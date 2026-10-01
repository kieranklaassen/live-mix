// A hosted VST3 or Audio Unit plug-in under the library's `Device` contract.
// The plug-in runs in the plug-in host, a separate native program; this
// device is its stand-in in the audio graph. A bridge worklet carries the
// audio out and back through shared memory and a pump worker (see
// `bridge-protocol.ts`), and the control connection (`NativeHostClient`)
// carries everything else: parameters, state, MIDI and the editor window.
//
//   input ─┬─► bridge ───────────────► wet ─┬─► output
//          └─► delay (latency) ─► dry ──────┘
//
// The round trip through the host costs a fixed number of frames
// (`bridgeLatencyFrames`), which the device reports as latency together with
// the plug-in's own, so delay compensation lines other tracks up with it. The
// dry path is delayed by the same amount: bypass never moves the timing.
// If the host goes away the device passes the dry signal and reports
// `status === 'stopped'`.

import {
  type DeviceChange,
  type DeviceChangeListener,
  type EditorDevice,
  type NoteDevice,
  type ObservableDevice,
  type ParamTextDevice,
} from '../core/devices/Device'
import { NODE_DEVICE_RAMP_SECONDS } from '../core/devices/native/NodeDevice'
import { Emitter } from '../core/events'
import { clampParam } from '../core/params'
import { ensureProcessor } from '../core/worklet-loader'
import {
  BRIDGE_ACTIVE,
  BRIDGE_LATENCY,
  BRIDGE_MAX_BLOCK_FRAMES,
  BRIDGE_READY,
  BRIDGE_UNDERRUNS,
  BRIDGE_WRITTEN,
  DEFAULT_BRIDGE_LATENCY_FRAMES,
  NATIVE_BRIDGE_PROCESSOR_NAME,
  allocateBridgeMemory,
  bridgeLatencyFor,
  clampBridgeLatency,
  frameDistance,
  type BridgeMemory,
  type PumpEvent,
  type PumpMessage,
  type PumpStats,
} from './bridge-protocol'
import { type NativeHostClient } from './HostClient'
import { isOfflineContext, offlineBridgeClock } from './offline'
import {
  fromNormalised,
  nativeParamKey,
  nativeParamSpecs,
  tidyParamText,
  toNormalised,
  type NativeParamSpec,
} from './params'
import { type NativeParamChange, type NativeParamInfo, type NativeSlotInfo } from './protocol'

/** Injectable node constructor so tests can substitute a mock worklet node. */
export type NativeNodeFactory = (
  context: BaseAudioContext,
  name: string,
  options: AudioWorkletNodeOptions,
) => AudioWorkletNode

/** The slice of `Worker` the device uses. */
export interface PumpWorker {
  onmessage: ((event: { data: PumpEvent }) => void) | null
  postMessage(message: PumpMessage): void
  terminate(): void
}

export type NativeDeviceStatus = 'connecting' | 'running' | 'stopped'

/** A parameter the plug-in changed itself: a move in its editor, a preset it loaded. */
export interface NativeParamEdit {
  name: string
  value: number
}

export interface NativeDeviceOptions {
  /** `Device.id`; defaults to `nativeDeviceId(plugin)`, i.e. `native:<plug-in id>`. */
  id?: string
  /** Initial parameter values by name; anything omitted keeps the plug-in's value. */
  params?: Readonly<Record<string, number>>
  /** An earlier `getState()` result, restored before the first block. */
  state?: string
  /**
   * Frames the round trip through the host may take, a multiple of 128
   * between 128 and 8192. The default is `bridgeLatencyFor(context)`: the
   * audio device's buffer plus 512 (640 on a 128-frame device, 1024 on a
   * 512-frame one), or 512 in an offline render. Smaller is tighter and less
   * forgiving; anything late plays as silence and counts as an underrun.
   */
  latencyFrames?: number
  /**
   * How long an offline render waits for the host to open the audio
   * connection before `create` gives up (default 5000 ms).
   */
  connectTimeoutMs?: number
  /** How many parameters `panelParams` names (default 12). */
  panelParamCount?: number
  /** Where `addModule` loads the bridge processor from. */
  processorUrl?: URL | string
  /** Where the pump worker's script is. */
  pumpUrl?: URL | string
  /** Bypass crossfade length; defaults to the node-device ramp (5 ms). */
  rampSec?: number
  createNode?: NativeNodeFactory
  createWorker?: (url: string) => PumpWorker
}

/** How long an offline render waits at one stop for a host that has gone quiet. */
const OFFLINE_SETTLE_TIMEOUT_MS = 10000
const DEFAULT_CONNECT_TIMEOUT_MS = 5000

type WaitAsync = (
  array: Int32Array,
  index: number,
  value: number,
  timeout: number,
) => { async: boolean; value: Promise<unknown> | string }

/** Sleep until `array[index]` stops being `value`, or `timeoutMs` at most. */
async function waitForChange(
  array: Int32Array,
  index: number,
  value: number,
  timeoutMs: number,
): Promise<void> {
  const waitAsync = (Atomics as unknown as { waitAsync?: WaitAsync }).waitAsync
  if (typeof waitAsync !== 'function') {
    await new Promise((resolve) => setTimeout(resolve, 1))
    return
  }
  const wait = waitAsync(array, index, value, timeoutMs)
  if (wait.async) await wait.value
}

/** Longest delay the dry path can add, in seconds. */
const DRY_DELAY_MAX_SECONDS = 2
export const DEFAULT_PANEL_PARAM_COUNT = 12

/** Default location of the bundled bridge processor. Call lazily. */
export function defaultNativeProcessorUrl(): string {
  return new URL('../worklets/native-bridge.js', import.meta.url).href
}

/** Default location of the bundled pump worker. Call lazily. */
export function defaultNativePumpUrl(): string {
  return new URL('../worklets/native-pump.js', import.meta.url).href
}

/** Default `Device.id` for a hosted plug-in: its identifier under a `native:` prefix. */
export function nativeDeviceId(plugin: string): string {
  return `native:${plugin}`
}

/** MIDI note number nearest to `frequency` (A4 = 69 = 440 Hz), clamped to 0..127. */
export function midiNoteFromFrequency(frequency: number): number {
  if (!(frequency > 0)) return 0
  return Math.min(127, Math.max(0, Math.round(69 + 12 * Math.log2(frequency / 440))))
}

function href(url: URL | string): string {
  return typeof url === 'string' ? url : url.href
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

const defaultCreateNode: NativeNodeFactory = (context, name, options) =>
  new AudioWorkletNode(context, name, options)

const defaultCreateWorker = (url: string): PumpWorker => new Worker(url) as unknown as PumpWorker

interface NativeDeviceInit {
  id: string
  context: BaseAudioContext
  client: NativeHostClient
  slot: NativeSlotInfo
  memory: BridgeMemory
  node: AudioWorkletNode
  worker: PumpWorker
  bridgeLatencyFrames: number
  rampSec: number
  panelParamCount: number
}

export class NativeDevice implements NoteDevice, ObservableDevice, EditorDevice, ParamTextDevice {
  readonly id: string
  readonly params: Readonly<Record<string, NativeParamSpec>>
  readonly panelParams: readonly string[]
  readonly input: GainNode
  readonly output: GainNode
  readonly context: BaseAudioContext
  readonly client: NativeHostClient
  /** What the host said about the loaded instance (name, vendor, format, layout). */
  readonly slot: NativeSlotInfo
  /** The bridge worklet node; connect nothing to it directly — use `input`/`output`. */
  readonly node: AudioWorkletNode
  /** Frames the round trip through the host is given. */
  readonly bridgeLatencyFrames: number
  private readonly worker: PumpWorker
  private readonly control: Int32Array
  private readonly dry: GainNode
  private readonly wet: GainNode
  private readonly dryDelay: DelayNode
  private readonly rampSec: number
  private readonly values = new Map<string, number>()
  private readonly texts = new Map<string, string>()
  private readonly keysByIndex = new Map<number, string>()
  private readonly changes = new Emitter<DeviceChange>()
  private readonly edits = new Emitter<NativeParamEdit>()
  private readonly statusChanges = new Emitter<NativeDeviceStatus>()
  private readonly statsChanges = new Emitter<PumpStats>()
  private readonly notes = new Map<number, number>()
  private readonly unsubscribe: (() => void)[] = []
  private pluginLatencySamples: number
  private currentStatus: NativeDeviceStatus = 'connecting'
  private lastStats: PumpStats | null = null
  private bypassed = false
  private disposed = false
  /** Whether the context is an offline render, where MIDI waits for the host (`sendMidi`). */
  private readonly offline: boolean
  private midiSent: Promise<void> = Promise.resolve()

  private constructor(init: NativeDeviceInit) {
    this.id = init.id
    this.context = init.context
    this.offline = isOfflineContext(init.context)
    this.client = init.client
    this.slot = init.slot
    this.node = init.node
    this.worker = init.worker
    this.control = new Int32Array(init.memory.control)
    this.bridgeLatencyFrames = init.bridgeLatencyFrames
    this.pluginLatencySamples = Math.max(0, Math.round(init.slot.latencySamples))
    this.rampSec = init.rampSec
    this.params = nativeParamSpecs(init.slot.params)
    this.panelParams = Object.keys(this.params).slice(0, init.panelParamCount)
    for (const [key, spec] of Object.entries(this.params)) this.keysByIndex.set(spec.index, key)
    this.mirror(init.slot.params)

    const context = init.context
    this.input = context.createGain()
    this.output = context.createGain()
    this.dry = context.createGain()
    this.wet = context.createGain()
    this.dryDelay = context.createDelay(DRY_DELAY_MAX_SECONDS)
    this.dry.gain.value = 0
    this.wet.gain.value = 1
    this.dryDelay.delayTime.value = this.latencySec

    if (init.slot.inputs > 0) this.input.connect(this.node)
    this.node.connect(this.wet)
    this.wet.connect(this.output)
    this.input.connect(this.dryDelay)
    this.dryDelay.connect(this.dry)
    this.dry.connect(this.output)

    const { client } = init
    const slotId = init.slot.slot
    this.unsubscribe.push(
      client.on('params', (event) => {
        if (event.slot === slotId) this.onHostParams(event.changes)
      }),
      client.on('latency', (event) => {
        if (event.slot === slotId) this.setPluginLatency(event.latencySamples)
      }),
      client.on('close', () => this.setStatus('stopped')),
    )
    this.worker.onmessage = (event) => this.onPumpEvent(event.data)
  }

  /**
   * Load the plug-in in the host (by the id a scan reported), start the
   * bridge worklet and its pump, mirror the plug-in's parameter values and
   * apply `options.params`. The page must be cross-origin isolated. On an
   * `OfflineAudioContext` the device also waits for the host's audio
   * connection and joins the context's pacing clock (`offline.ts`), so make
   * it before `startRendering()`.
   */
  static async create(
    context: BaseAudioContext,
    client: NativeHostClient,
    plugin: string,
    options: NativeDeviceOptions = {},
  ): Promise<NativeDevice> {
    const offline = isOfflineContext(context)
    const bridgeLatencyFrames = clampBridgeLatency(
      options.latencyFrames ??
        (offline ? DEFAULT_BRIDGE_LATENCY_FRAMES : bridgeLatencyFor(context)),
    )
    await ensureProcessor(context, href(options.processorUrl ?? defaultNativeProcessorUrl()))
    const slot = await client.load({
      plugin,
      sampleRate: context.sampleRate,
      blockSize: BRIDGE_MAX_BLOCK_FRAMES,
      state: options.state,
    })

    let worker: PumpWorker | undefined
    try {
      const memory = allocateBridgeMemory(slot.inputs > 0 ? 2 : 0, 2)
      Atomics.store(new Int32Array(memory.control), BRIDGE_LATENCY, bridgeLatencyFrames)
      const node = (options.createNode ?? defaultCreateNode)(
        context,
        NATIVE_BRIDGE_PROCESSOR_NAME,
        {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          channelCount: 2,
          channelCountMode: 'explicit',
          channelInterpretation: 'speakers',
          outputChannelCount: [2],
          processorOptions: memory,
        },
      )
      worker = (options.createWorker ?? defaultCreateWorker)(
        href(options.pumpUrl ?? defaultNativePumpUrl()),
      )
      const device = new NativeDevice({
        id: options.id ?? nativeDeviceId(plugin),
        context,
        client,
        slot,
        memory,
        node,
        worker,
        bridgeLatencyFrames,
        rampSec: options.rampSec ?? NODE_DEVICE_RAMP_SECONDS,
        panelParamCount: options.panelParamCount ?? DEFAULT_PANEL_PARAM_COUNT,
      })
      worker.postMessage({ type: 'start', memory, url: client.audioUrl(slot.slot, 2) })
      if (options.params) {
        // A saved value for a parameter this version of the plug-in no longer
        // has must not keep the plug-in from loading.
        device.setParams(
          Object.fromEntries(
            Object.entries(options.params).filter(([name]) => name in device.params),
          ),
        )
      }
      if (offline) {
        // A render cannot start on a device that is still connecting: the
        // first frames would be lost. Then let the clock pace the render.
        await device.whenRunning(options.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS)
        device.unsubscribe.push(
          offlineBridgeClock(context).add({
            periodFrames: bridgeLatencyFrames,
            settled: () => device.settled(),
          }),
        )
      }
      return device
    } catch (error) {
      // The plug-in exists in the host but the device could not finish: do not leak it.
      worker?.terminate()
      void client.unload(slot.slot).catch(() => {})
      throw error
    }
  }

  /** Bridge latency plus the plug-in's own, in samples at the context rate. */
  get latencySamples(): number {
    return this.bridgeLatencyFrames + this.pluginLatencySamples
  }

  get latencySec(): number {
    return this.latencySamples / this.context.sampleRate
  }

  /** `'running'` once audio flows through the host; `'stopped'` when the host is gone. */
  get status(): NativeDeviceStatus {
    return this.currentStatus
  }

  /** The pump's last report: round-trip time, underruns, dropped frames. */
  get stats(): PumpStats | null {
    return this.lastStats
  }

  /** Render quanta played as silence so far because the host answered late. */
  get underruns(): number {
    return Atomics.load(this.control, BRIDGE_UNDERRUNS)
  }

  /** Whether the plug-in draws its own editor; `openEditor` shows a generic one otherwise. */
  get hasEditor(): boolean {
    return this.slot.hasEditor
  }

  setParam(name: string, value: number): void {
    this.setParams({ [name]: value })
  }

  /** Several params at once; unknown names throw before anything is sent. */
  setParams(values: Readonly<Record<string, number>>): void {
    const updates: [string, NativeParamSpec, number][] = []
    for (const [name, value] of Object.entries(values)) {
      const spec = this.params[name]
      if (!spec) throw new Error(`live-mix: ${this.id} has no parameter "${name}"`)
      const clamped = clampParam(spec, value)
      updates.push([name, spec, spec.steps > 1 ? Math.round(clamped) : clamped])
    }
    for (const [name, spec, value] of updates) {
      // Already there (the plug-in said so itself, or we did): writing it
      // again would only fight a knob being dragged in the plug-in's editor.
      if (this.values.get(name) === value) continue
      this.values.set(name, value)
      if (!this.disposed)
        this.client.setParam(this.slot.slot, spec.index, toNormalised(spec, value))
      this.changes.emit({ type: 'param', name, value })
    }
  }

  getParam(name: string): number {
    const spec = this.params[name]
    if (!spec) throw new Error(`live-mix: ${this.id} has no parameter "${name}"`)
    return this.values.get(name) ?? spec.default
  }

  /** The plug-in's own wording of the parameter's value, as last reported. */
  paramText(name: string): string | undefined {
    const reported = this.texts.get(name)
    if (reported === undefined || reported === '') return undefined
    const text = tidyParamText(reported)
    const unit = this.params[name]?.unit
    return unit && !text.endsWith(unit) ? `${text} ${unit}` : text
  }

  get bypass(): boolean {
    return this.bypassed
  }

  set bypass(enabled: boolean) {
    if (this.bypassed === enabled) return
    this.bypassed = enabled
    this.applyMix()
    this.changes.emit({ type: 'bypass', bypass: enabled })
  }

  onChange(listener: DeviceChangeListener): () => void {
    return this.changes.subscribe(listener)
  }

  /**
   * Called for changes that came from the plug-in (its editor, a preset it
   * loaded), not for `setParam`. A host that keeps a document writes these
   * into it; `onChange` reports them too, for the knobs.
   */
  onEdit(listener: (edit: NativeParamEdit) => void): () => void {
    return this.edits.subscribe(listener)
  }

  onStatus(listener: (status: NativeDeviceStatus) => void): () => void {
    return this.statusChanges.subscribe(listener)
  }

  onStats(listener: (stats: PumpStats) => void): () => void {
    return this.statsChanges.subscribe(listener)
  }

  /**
   * A raw MIDI message for the start of the next block the plug-in processes.
   *
   * In an offline render the message first waits for the host to return
   * everything rendered so far. Sent while the render is held at a block
   * (`holdRenderAt`), it is then the first thing the plug-in sees of that
   * block, the same on every render; `notesDelivered` says when it has gone.
   */
  sendMidi(bytes: readonly number[]): void {
    if (this.disposed) return
    const message: PumpMessage = { type: 'midi', bytes: [...bytes] }
    if (!this.offline) {
      this.worker.postMessage(message)
      return
    }
    this.midiSent = this.midiSent
      .then(() => this.settled())
      .then(() => {
        if (!this.disposed) this.worker.postMessage(message)
      })
  }

  /** Resolves once every MIDI message sent so far has been handed to the host's connection. */
  notesDelivered(): Promise<void> {
    return this.midiSent
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

  /** Open the plug-in's editor window (the host's, outside the page), or bring it forward. */
  async openEditor(): Promise<void> {
    if (this.disposed) return
    await this.client.showEditor(this.slot.slot)
  }

  async closeEditor(): Promise<void> {
    if (this.disposed) return
    await this.client.hideEditor(this.slot.slot)
  }

  /** The plug-in's full state as base64: what its own preset or project file would hold. */
  getState(): Promise<string> {
    return this.client.getState(this.slot.slot)
  }

  /** Restore a `getState()` result, then refresh the mirrored values. */
  async setState(state: string): Promise<void> {
    if (this.disposed) return
    const { params, latencySamples } = await this.client.setState(this.slot.slot, state)
    this.mirror(params)
    this.setPluginLatency(latencySamples)
    for (const [name, value] of this.values) this.changes.emit({ type: 'param', name, value })
  }

  /** Re-read every value from the plug-in into the mirror `getParam` serves. */
  async syncParams(): Promise<void> {
    if (this.disposed) return
    this.mirror(await this.client.getParams(this.slot.slot))
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    for (const off of this.unsubscribe) off()
    this.changes.clear()
    this.edits.clear()
    this.statusChanges.clear()
    this.statsChanges.clear()
    this.notes.clear()
    this.worker.onmessage = null
    this.worker.postMessage({ type: 'stop' })
    this.worker.terminate()
    this.node.port.postMessage({ type: 'dispose' })
    for (const node of [this.input, this.dry, this.wet, this.dryDelay, this.output]) {
      node.disconnect()
    }
    this.node.disconnect()
    if (!this.client.closed) void this.client.unload(this.slot.slot).catch(() => {})
  }

  private whenRunning(timeoutMs: number): Promise<void> {
    if (this.currentStatus === 'running') return Promise.resolve()
    const failure = (): Error =>
      new Error(`live-mix: the plug-in host did not open audio for ${this.slot.name}`)
    if (this.currentStatus === 'stopped') return Promise.reject(failure())
    return new Promise((resolve, reject) => {
      const off = this.statusChanges.subscribe((status) => {
        clearTimeout(timer)
        off()
        if (status === 'running') resolve()
        else reject(failure())
      })
      const timer = setTimeout(() => {
        off()
        reject(failure())
      }, timeoutMs)
    })
  }

  /** Resolves once the host has returned everything the worklet has written (or is gone). */
  private async settled(): Promise<void> {
    const { control } = this
    const deadline = Date.now() + OFFLINE_SETTLE_TIMEOUT_MS
    while (!this.disposed && Atomics.load(control, BRIDGE_ACTIVE) === 1) {
      const ready = Atomics.load(control, BRIDGE_READY)
      if (frameDistance(ready, Atomics.load(control, BRIDGE_WRITTEN)) >= 0) return
      if (Date.now() > deadline) return
      await waitForChange(control, BRIDGE_READY, ready, 50)
    }
  }

  private mirror(infos: readonly NativeParamInfo[]): void {
    for (const info of infos) {
      const key = nativeParamKey(info)
      const spec = this.params[key]
      if (spec?.index !== info.index) continue
      this.values.set(key, fromNormalised(spec, info.value))
      this.texts.set(key, info.text)
    }
  }

  private onHostParams(changes: readonly NativeParamChange[]): void {
    for (const change of changes) {
      const key = this.keysByIndex.get(change.index)
      if (key === undefined) continue
      this.texts.set(key, change.text)
      const spec = this.params[key]
      // The echo of our own write only brings the text; the knob already moved on.
      const value =
        change.origin === 'plugin' ? fromNormalised(spec, change.value) : this.getParam(key)
      this.values.set(key, value)
      this.changes.emit({ type: 'param', name: key, value })
      if (change.origin === 'plugin') this.edits.emit({ name: key, value })
    }
  }

  private onPumpEvent(event: PumpEvent): void {
    switch (event.type) {
      case 'open':
        this.setStatus('running')
        break
      case 'close':
        this.setStatus('stopped')
        break
      case 'stats':
        this.lastStats = event.stats
        this.statsChanges.emit(event.stats)
        break
    }
  }

  private setStatus(status: NativeDeviceStatus): void {
    if (this.disposed || this.currentStatus === status) return
    // A stopped device does not come back: a new one is made against a new host.
    if (this.currentStatus === 'stopped') return
    this.currentStatus = status
    this.applyMix()
    this.statusChanges.emit(status)
  }

  private setPluginLatency(samples: number): void {
    const next = Math.max(0, Math.round(samples))
    if (next === this.pluginLatencySamples) return
    this.pluginLatencySamples = next
    this.dryDelay.delayTime.value = Math.min(DRY_DELAY_MAX_SECONDS, this.latencySec)
  }

  /** Dry passes when bypassed or when the host is gone; wet otherwise. */
  private applyMix(): void {
    if (this.disposed) return
    const dry = this.bypassed || this.currentStatus === 'stopped'
    const now = this.context.currentTime
    rampGain(this.dry.gain, dry ? 1 : 0, now, this.rampSec)
    rampGain(this.wet.gain, dry ? 0 : 1, now, this.rampSec)
  }
}
