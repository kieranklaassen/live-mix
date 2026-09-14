// Host adapter for WebAudioModules 2.0 plugins: a WAM's `audioNode` under the
// library's `Device` contract. The plugin module is an ES module whose default
// export is a `WebAudioModule` constructor; `createInstance(groupId, ctx)`
// yields the module and its `WamNode`, and everything else — parameters,
// state, events, GUI — is the WAM API on that node. The adapter adds what the
// contract wants and a WAM lacks: a static `ParamSpec` table, a synchronous
// `setParam`/`getParam` pair, a click-free bypass, a latency in seconds and a
// one-call `dispose`.
//
//   input ─┬─► wam.audioNode ─► wet ─┬─► output
//          └──────────► dry ─────────┘
//
// Parameter writes go through `setParameterValues`, which SDK processors
// interpolate over a short window, so a knob is click-free; timed changes are
// `wam-automation` events (`scheduleParam`), the WAM form of automation.

import type {
  WamAutomationEvent,
  WamDescriptor,
  WamEvent,
  WamParameterDataMap,
  WamParameterInfoMap,
} from '@webaudiomodules/api'

import { type NoteDevice } from '../core/devices/Device'
import { NODE_DEVICE_RAMP_SECONDS } from '../core/devices/native/NodeDevice'
import { clampParam } from '../core/params'
import { ensureWamHost, type WamHost, type WamHostOptions } from './host'
import { snapWamValue, wamParamSpecs, type WamParamSpec } from './params'

/**
 * The slice of a `WamNode` the adapter drives. Structural, so the SDK's node,
 * a test fake, or a hand-written `AudioNode` implementing the WAM API all fit.
 */
export interface WamNodeLike extends AudioNode {
  getParameterInfo(...parameterIds: string[]): Promise<WamParameterInfoMap>
  getParameterValues(normalized?: boolean, ...parameterIds: string[]): Promise<WamParameterDataMap>
  setParameterValues(values: WamParameterDataMap): Promise<void>
  getState(): Promise<unknown>
  setState(state: unknown): Promise<void>
  /** In samples, per the WAM API. */
  getCompensationDelay(): Promise<number>
  scheduleEvents(...events: WamEvent[]): void
  clearEvents(): void | Promise<void>
  destroy(): void
}

/** The slice of a `WebAudioModule` instance the adapter uses. */
export interface WamModuleLike {
  readonly descriptor: WamDescriptor
  readonly audioNode: WamNodeLike
  readonly instanceId: string
  createGui(): Promise<Element | null | undefined>
  destroyGui(gui: Element): void
}

/** What a WAM's ES module exports as `default`. */
export interface WamModuleConstructor {
  readonly isWebAudioModuleConstructor: boolean
  createInstance(
    groupId: string,
    context: BaseAudioContext,
    initialState?: unknown,
  ): Promise<WamModuleLike>
}

/** A plugin URL (loaded with a dynamic import) or an already imported constructor. */
export type WamSource = string | WamModuleConstructor

/** Loads the ES module at `url`; defaults to `import(url)`. */
export type WamModuleImporter = (url: string) => Promise<unknown>

export interface WamDeviceOptions {
  /** `Device.id`; defaults to `wamDeviceId(descriptor)`, i.e. `wam:<identifier>`. */
  id?: string
  /** Initial parameter values by WAM parameter id; anything omitted keeps the plugin's value. */
  params?: Readonly<Record<string, number>>
  /** Plugin-native state (an earlier `getState()`) handed to `createInstance`. */
  initialState?: unknown
  /**
   * Options for `ensureWamHost` (ids, initializer); defaults to the context's
   * shared host. An existing host's `{ groupId, groupKey }` is fine too — the
   * SDK's installation is idempotent per group id.
   */
  host?: WamHostOptions
  /** Replaces the dynamic `import()` used for URL sources (bundlers, tests). */
  importModule?: WamModuleImporter
  /** Overrides the plugin's reported compensation delay. */
  latencySec?: number
  /** Bypass crossfade length; defaults to the node-device ramp (5 ms). */
  rampSec?: number
}

/** Bypass crossfade length: the same 5 ms every other device kind uses. */
export const WAM_DEVICE_RAMP_SECONDS = NODE_DEVICE_RAMP_SECONDS

const defaultImporter: WamModuleImporter = (url) =>
  // eslint-disable-next-line no-restricted-syntax -- the URL is runtime data (a plugin), not a module dependency
  import(/* @vite-ignore */ url)

export function isWamModuleConstructor(value: unknown): value is WamModuleConstructor {
  if (typeof value !== 'function') return false
  const candidate = value as unknown as Partial<WamModuleConstructor>
  return (
    candidate.isWebAudioModuleConstructor === true && typeof candidate.createInstance === 'function'
  )
}

/** Import a WAM module and return its default export, checked to be a WAM constructor. */
export async function loadWamModule(
  url: string,
  importModule: WamModuleImporter = defaultImporter,
): Promise<WamModuleConstructor> {
  const loaded: unknown = await importModule(url)
  const candidate =
    typeof loaded === 'object' && loaded !== null && 'default' in loaded ? loaded.default : loaded
  if (!isWamModuleConstructor(candidate)) {
    throw new Error(`live-mix: ${url} does not export a WebAudioModule constructor as default`)
  }
  return candidate
}

/** Default `Device.id` for a WAM: its descriptor identifier under a `wam:` prefix. */
export function wamDeviceId(descriptor: Pick<WamDescriptor, 'identifier'>): string {
  return `wam:${descriptor.identifier}`
}

/** MIDI note number nearest to `frequency` (A4 = 69 = 440 Hz), clamped to 0..127. */
export function midiNoteFromFrequency(frequency: number): number {
  if (!(frequency > 0)) return 0
  return Math.min(127, Math.max(0, Math.round(69 + 12 * Math.log2(frequency / 440))))
}

function rampGain(param: AudioParam, value: number, now: number, rampSec: number): void {
  if (typeof param.cancelAndHoldAtTime === 'function') {
    param.cancelAndHoldAtTime(now)
  } else {
    param.cancelScheduledValues(now)
    param.setValueAtTime(param.value, now)
  }
  param.linearRampToValueAtTime(value, now + rampSec)
}

interface WamDeviceInit {
  id: string
  context: BaseAudioContext
  host: WamHost
  module: WamModuleLike
  url: string | undefined
  paramInfo: WamParameterInfoMap
  latencySamples: number
  rampSec: number
}

export class WamDevice implements NoteDevice {
  readonly id: string
  readonly params: Readonly<Record<string, WamParamSpec>>
  /** The plugin's own parameter table, including any param the contract could not map. */
  readonly paramInfo: Readonly<WamParameterInfoMap>
  readonly input: GainNode
  readonly output: GainNode
  /** `getCompensationDelay()` (samples) in seconds at the context rate. */
  readonly latencySec: number
  /** The plugin's compensation delay as reported, whole samples, for PDC (U34). */
  readonly latencySamples: number
  readonly context: BaseAudioContext
  readonly host: WamHost
  readonly module: WamModuleLike
  /** The plugin's `audioNode`; connect nothing to it directly — use `input`/`output`. */
  readonly node: WamNodeLike
  /** The URL the plugin was loaded from, when created from one. */
  readonly url: string | undefined
  private readonly dry: GainNode
  private readonly wet: GainNode
  private readonly rampSec: number
  private readonly values = new Map<string, number>()
  private readonly guis = new Set<Element>()
  private readonly notes = new Map<number, number>()
  private bypassed = false
  private disposed = false

  private constructor(init: WamDeviceInit) {
    this.id = init.id
    this.context = init.context
    this.host = init.host
    this.module = init.module
    this.node = init.module.audioNode
    this.url = init.url
    this.paramInfo = init.paramInfo
    this.params = wamParamSpecs(init.paramInfo)
    this.latencySamples = init.latencySamples
    this.latencySec = init.latencySamples / init.context.sampleRate
    this.rampSec = init.rampSec
    for (const [name, spec] of Object.entries(this.params)) this.values.set(name, spec.default)

    const context = init.context
    this.input = context.createGain()
    this.output = context.createGain()
    this.dry = context.createGain()
    this.wet = context.createGain()
    this.dry.gain.value = 0
    this.wet.gain.value = 1

    const { descriptor } = init.module
    if (this.node.numberOfInputs > 0 && descriptor.hasAudioInput !== false) {
      this.input.connect(this.node)
    }
    if (this.node.numberOfOutputs > 0 && descriptor.hasAudioOutput !== false) {
      this.node.connect(this.wet)
    }
    this.wet.connect(this.output)
    this.input.connect(this.dry)
    this.dry.connect(this.output)

    this.node.addEventListener('wam-automation', this.onAutomation)
  }

  /**
   * Install the context's WAM host if needed, load the plugin (URL sources
   * through `importModule`), instantiate it in the host group, read its
   * parameter table and latency, mirror its current values and apply
   * `options.params`.
   */
  static async create(
    context: BaseAudioContext,
    source: WamSource,
    options: WamDeviceOptions = {},
  ): Promise<WamDevice> {
    const host = await ensureWamHost(context, options.host)
    const constructor =
      typeof source === 'string' ? await loadWamModule(source, options.importModule) : source
    const module = await constructor.createInstance(host.groupId, context, options.initialState)
    const node = module.audioNode
    let device: WamDevice | undefined
    try {
      const [paramInfo, delaySamples] = await Promise.all([
        node.getParameterInfo(),
        node.getCompensationDelay(),
      ])
      const samples =
        options.latencySec === undefined ? delaySamples : options.latencySec * context.sampleRate
      device = new WamDevice({
        id: options.id ?? wamDeviceId(module.descriptor),
        context,
        host,
        module,
        url: typeof source === 'string' ? source : undefined,
        paramInfo,
        latencySamples: Number.isFinite(samples) && samples > 0 ? Math.round(samples) : 0,
        rampSec: options.rampSec ?? WAM_DEVICE_RAMP_SECONDS,
      })
      await device.syncParams()
      if (options.params) await device.writeParams(options.params)
      return device
    } catch (error) {
      // The plugin exists but the adapter could not finish: do not leak it.
      if (device) device.dispose()
      else node.destroy()
      throw error
    }
  }

  /** The plugin's `descriptor.json` values (name, vendor, version, I/O flags, …). */
  get descriptor(): WamDescriptor {
    return this.module.descriptor
  }

  setParam(name: string, value: number): void {
    this.setParams({ [name]: value })
  }

  /** Several params in one `setParameterValues` round trip; unknown names throw before anything is sent. */
  setParams(values: Readonly<Record<string, number>>): void {
    void this.writeParams(values).catch(() => {})
  }

  getParam(name: string): number {
    const spec = this.params[name]
    if (!spec) throw new Error(`live-mix: ${this.id} has no parameter "${name}"`)
    return this.values.get(name) ?? spec.default
  }

  /**
   * Schedule `value` at context time `time` as a `wam-automation` event. The
   * mirrored value updates when the plugin reports the event processed, not
   * now; `getParam` keeps the last `setParam` until then.
   */
  scheduleParam(name: string, value: number, time: number): void {
    const spec = this.params[name]
    if (!spec) throw new Error(`live-mix: ${this.id} has no parameter "${name}"`)
    if (this.disposed) return
    const event: WamAutomationEvent = {
      type: 'wam-automation',
      data: { id: name, value: this.coerce(spec, value), normalized: false },
      time,
    }
    this.node.scheduleEvents(event)
  }

  /**
   * Drop every event still queued on the plugin. WAM 2.0 has no per-param
   * clear, so this also drops pending MIDI and other params' automation.
   */
  clearScheduled(): void {
    if (this.disposed) return
    void Promise.resolve(this.node.clearEvents()).catch(() => {})
  }

  /** Any WAM event (transport, MIDI, sysex, OSC, automation) at its `time`. */
  scheduleEvents(...events: WamEvent[]): void {
    if (this.disposed || events.length === 0) return
    this.node.scheduleEvents(...events)
  }

  /** A raw MIDI message, now or at `time`. */
  sendMidi(bytes: [number, number, number], time?: number): void {
    this.scheduleEvents({ type: 'wam-midi', data: { bytes }, time })
  }

  /** Note events for instruments, as MIDI note on/off; effects ignore them. */
  noteOn(noteId: number, frequency: number, gain = 0.5): void {
    const note = midiNoteFromFrequency(frequency)
    const velocity = Math.min(127, Math.max(1, Math.round(Math.min(1, Math.max(0, gain)) * 127)))
    this.notes.set(noteId, note)
    this.sendMidi([0x90, note, velocity])
  }

  noteOff(noteId: number): void {
    const note = this.notes.get(noteId)
    if (note === undefined) return
    this.notes.delete(noteId)
    this.sendMidi([0x80, note, 0])
  }

  /**
   * Re-read the plugin's current values into the mirror `getParam` serves.
   * Call after a GUI or `setState` changed the plugin, before capturing a
   * preset.
   */
  async syncParams(): Promise<void> {
    if (this.disposed) return
    const data = await this.node.getParameterValues(false)
    for (const [name, spec] of Object.entries(this.params)) {
      const entry = data[name]
      if (!entry || typeof entry.value !== 'number') continue
      const value = entry.normalized ? this.paramInfo[name].denormalize(entry.value) : entry.value
      this.values.set(name, clampParam(spec, value))
    }
  }

  /** The plugin's full native state (params and whatever else it keeps). */
  getState(): Promise<unknown> {
    return this.node.getState()
  }

  /** Restore a `getState()` result, then refresh the mirrored param values. */
  async setState(state: unknown): Promise<void> {
    if (this.disposed) return
    await this.node.setState(state)
    await this.syncParams()
  }

  get bypass(): boolean {
    return this.bypassed
  }

  set bypass(enabled: boolean) {
    if (this.bypassed === enabled) return
    this.bypassed = enabled
    if (this.disposed) return
    const now = this.context.currentTime
    rampGain(this.dry.gain, enabled ? 1 : 0, now, this.rampSec)
    rampGain(this.wet.gain, enabled ? 0 : 1, now, this.rampSec)
  }

  /**
   * The plugin's GUI element, for the caller to place; `null` when the plugin
   * has none. Every element is destroyed with the device unless `destroyGui`
   * ran first.
   */
  async createGui(): Promise<Element | null> {
    if (this.disposed) return null
    const gui = await this.module.createGui()
    if (!gui) return null
    this.guis.add(gui)
    return gui
  }

  destroyGui(gui: Element): void {
    if (!this.guis.delete(gui)) return
    this.module.destroyGui(gui)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.node.removeEventListener('wam-automation', this.onAutomation)
    for (const gui of this.guis) this.module.destroyGui(gui)
    this.guis.clear()
    this.notes.clear()
    for (const node of [this.input, this.dry, this.wet, this.output]) node.disconnect()
    this.node.disconnect()
    this.node.destroy()
  }

  /**
   * Validate, coerce and mirror synchronously (so a bad name throws to the
   * caller), then send the batch; the promise is the plugin's acknowledgement.
   */
  private writeParams(values: Readonly<Record<string, number>>): Promise<void> {
    const update: WamParameterDataMap = {}
    for (const [name, value] of Object.entries(values)) {
      const spec = this.params[name]
      if (!spec) throw new Error(`live-mix: ${this.id} has no parameter "${name}"`)
      const coerced = this.coerce(spec, value)
      this.values.set(name, coerced)
      update[name] = { id: name, value: coerced, normalized: false }
    }
    if (this.disposed || Object.keys(update).length === 0) return Promise.resolve()
    return this.node.setParameterValues(update)
  }

  /** Clamp to the spec and snap discrete params to their grid. */
  private coerce(spec: WamParamSpec, value: number): number {
    return clampParam(spec, snapWamValue(spec, clampParam(spec, value)))
  }

  /** The plugin processed an automation event (ours or its own): mirror it. */
  private readonly onAutomation = (event: Event): void => {
    const detail = (event as CustomEvent<WamAutomationEvent | undefined>).detail
    const data = detail?.data
    if (!data || typeof data.value !== 'number') return
    const spec = this.params[data.id]
    if (!spec) return
    const value = data.normalized ? this.paramInfo[data.id].denormalize(data.value) : data.value
    this.values.set(data.id, clampParam(spec, value))
  }
}
