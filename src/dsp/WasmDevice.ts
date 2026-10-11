// Main-thread host for one WASM device: an AudioWorkletNode running
// wasm-device.processor.ts over a compiled module. The Module is compiled once
// per page (assets.ts), the processor script is added once per context, and
// every device gets its own node and WebAssembly.Instance. Parameters travel
// over the MessagePort by id (v1); the typed table next to each device maps
// names to ids and ranges.

import {
  modulatedParamValue,
  type ParamModulation,
  type ParamTravel,
} from '../core/automation/param-modulation'
import {
  type DeviceChange,
  type DeviceChangeListener,
  type DeviceMeterSpec,
  type MeteredDevice,
  type NoteWatchDevice,
  type ObservableDevice,
  type PlayedNote,
  type SampleWatchDevice,
} from '../core/devices/Device'
import { Emitter } from '../core/events'
import { LoadProbe, wasmMemoryBytes, type LoadClaim } from '../core/load'
import { ensureProcessor } from '../core/worklet-loader'
import { clampParam, type ParamSpec } from '../core/params'
import {
  DEVICE_METER_HZ,
  WASM_DEVICE_PROCESSOR_NAME,
  type DeviceHostMessage,
  type DeviceMessage,
  type WasmDeviceProcessorOptions,
} from './abi'
import { compileWasm, resolveProcessorUrl, type AssetOverrides, type WasmSource } from './assets'
import {
  prepareZoneLoad,
  type ZoneCapacity,
  type ZoneMap,
  type ZonePlan,
  type ZonePlanOptions,
  type ZoneSample,
} from './zones/zone-map'

/** Static description of a WASM device: where its module lives and its params. */
export interface WasmDeviceDefinition<
  P extends Record<string, ParamSpec> = Record<string, ParamSpec>,
> {
  id: string
  /** Default module location; called lazily so `import.meta.url` is never read at import time. */
  wasm: () => WasmSource
  params: P
  latencySec?: number
  /** Sample-exact latency at a given rate, when the DSP knows it (default: `round(latencySec · sampleRate)`); given alone, `latencySec` follows from it. */
  latencySamples?: (sampleRate: number) => number
  /** Readings the module reports through `device_meter`, by name; ids are positions in its list. */
  meters?: Readonly<Record<string, DeviceMeterSpec>>
  /** A multi-sample instrument: how many zones and sounds it holds and the size of its sample pool. */
  zones?: ZoneCapacity
  /**
   * An app-local worklet processor implementing the same ABI plus extras
   * (ambient-live's instrument). Defaults to the library's generic processor.
   */
  processor?: { name: string; url: () => URL | string }
}

export function defineWasmDevice<P extends Record<string, ParamSpec>>(
  definition: WasmDeviceDefinition<P>,
): WasmDeviceDefinition<P> {
  return definition
}

/** Injectable node constructor so tests can substitute a mock worklet node. */
export type WorkletNodeFactory = (
  context: BaseAudioContext,
  name: string,
  options: AudioWorkletNodeOptions,
) => AudioWorkletNode

export interface WasmDeviceOptions<P extends Record<string, ParamSpec>> extends AssetOverrides {
  /** Initial parameter values by name; anything omitted uses the spec default. */
  params?: Partial<Record<keyof P & string, number>>
  /**
   * What moves parameters on the audio thread from the first block on, by
   * name: as `modulate` after creation, but with no message to wait for, so
   * it is there in an offline render that starts at once. A name the device
   * lacks is ignored, and so is all of it on a processor of the app's own.
   */
  modulations?: Readonly<Record<string, ParamModulation>>
  createNode?: WorkletNodeFactory
}

const defaultCreateNode: WorkletNodeFactory = (context, name, options) =>
  new AudioWorkletNode(context, name, options)

/** What of a parameter's spec its travel is worked out from, and no more: it crosses to the audio thread. */
function paramTravel(spec: ParamSpec): ParamTravel {
  return {
    min: spec.min,
    max: spec.max,
    default: spec.default,
    taper: spec.taper,
    ...(spec.step === undefined ? {} : { step: spec.step }),
    ...(spec.choices === undefined ? {} : { choices: spec.choices }),
  }
}

const NO_METERS: Readonly<Record<string, DeviceMeterSpec>> = Object.freeze({})

/**
 * How long a note that was let go is remembered, in ms, and how many notes at
 * the most. A minute: the longest tails the stock instruments have (a bell's
 * Decay and a steel's Sustain at 40 s, a pad's Release at 30) are over by then.
 * Past the most, the oldest note that was let go is forgotten first, and a held
 * one only when every note remembered is held.
 */
const PLAYED_KEPT_MS = 60_000
const PLAYED_MOST = 128

const clockMs = (): number => (typeof performance === 'object' ? performance.now() : Date.now())

export class WasmDevice<P extends Record<string, ParamSpec> = Record<string, ParamSpec>>
  implements NoteWatchDevice, SampleWatchDevice, ObservableDevice, MeteredDevice
{
  /**
   * Whether the device moves its parameters on the audio thread
   * (`ModulatedDevice`): true on the library's own processor. An app-local
   * processor is not sent the message, so its device says false.
   */
  readonly modulates: boolean
  readonly id: string
  readonly params: Readonly<P>
  readonly meters: Readonly<Record<string, DeviceMeterSpec>>
  readonly node: AudioWorkletNode
  readonly latencySec: number
  readonly latencySamples: number
  /** What a multi-sample instrument holds; undefined for every other device. */
  readonly zones: ZoneCapacity | undefined
  private readonly values = new Map<string, number>()
  private readonly modulations: Map<string, ParamModulation>
  private readonly changes = new Emitter<DeviceChange>()
  private readonly meterIntervalFrames: number
  private meterValues: readonly number[] = []
  private meterWatchers = 0
  /** The notes it was sent, oldest first (`playedNotes`). */
  private readonly played: PlayedNote[] = []
  /** How long the sound it was last handed is (`loadedSampleSeconds`). */
  private sampleSeconds: number | null = null
  private bypassed = false
  private disposed = false
  private readonly load: LoadClaim
  private readonly context: BaseAudioContext

  private constructor(
    definition: WasmDeviceDefinition<P>,
    node: AudioWorkletNode,
    initial: Map<string, number>,
    moved: Map<string, ParamModulation>,
    context: BaseAudioContext,
    load: LoadClaim,
  ) {
    const sampleRate = context.sampleRate
    this.id = definition.id
    this.load = load
    this.context = context
    this.modulates = definition.processor === undefined
    this.params = definition.params
    this.meters = definition.meters ?? NO_METERS
    this.zones = definition.zones
    this.meterIntervalFrames = Math.max(1, Math.round(sampleRate / DEVICE_METER_HZ))
    this.node = node
    this.latencySamples = Math.max(
      0,
      Math.round(
        definition.latencySamples
          ? definition.latencySamples(sampleRate)
          : (definition.latencySec ?? 0) * sampleRate,
      ),
    )
    // A definition that only knows its sample count still reports seconds, so
    // delay compensation sees the device whichever field it reads.
    this.latencySec = definition.latencySec ?? this.latencySamples / sampleRate
    this.values = initial
    this.modulations = moved
  }

  /**
   * Compile (cached), load the processor (once per context), and construct
   * the node with the module and initial params in `processorOptions`.
   */
  static async create<P extends Record<string, ParamSpec>>(
    context: BaseAudioContext,
    definition: WasmDeviceDefinition<P>,
    options: WasmDeviceOptions<P> = {},
  ): Promise<WasmDevice<P>> {
    const processorUrl = resolveProcessorUrl(options.processorUrl ?? definition.processor?.url())
    const [module] = await Promise.all([
      compileWasm(options.wasm ?? definition.wasm()),
      ensureProcessor(context, processorUrl),
    ])

    const initial = new Map<string, number>()
    for (const [name, spec] of Object.entries(definition.params)) {
      const requested = options.params?.[name as keyof P & string]
      initial.set(name, requested === undefined ? spec.default : clampParam(spec, requested))
    }
    // The engine's load and memory figures count this device from here to `dispose`.
    const load = LoadProbe.for(context).claim(definition.id)
    void wasmMemoryBytes(module).then((bytes) => {
      load.memoryBytes = bytes
    })
    const moved = new Map<string, ParamModulation>()
    if (definition.processor === undefined) {
      for (const [name, modulation] of Object.entries(options.modulations ?? {})) {
        if (Object.hasOwn(definition.params, name) && modulation.routes.length > 0) {
          moved.set(name, modulation)
        }
      }
    }
    const processorOptions: WasmDeviceProcessorOptions = {
      module,
      deviceId: definition.id,
      params: Object.entries(definition.params).map(
        ([name, spec]) => [spec.id, initial.get(name) ?? spec.default] as const,
      ),
      ...(moved.size > 0
        ? {
            modulations: [...moved].map(([name, modulation]) => ({
              paramId: definition.params[name].id,
              travel: paramTravel(definition.params[name]),
              base: initial.get(name) ?? definition.params[name].default,
              modulation,
            })),
          }
        : {}),
      ...(load.slot ? { load: load.slot } : {}),
    }
    const processorName = definition.processor?.name ?? WASM_DEVICE_PROCESSOR_NAME
    let node: AudioWorkletNode
    try {
      node = (options.createNode ?? defaultCreateNode)(context, processorName, {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 2,
        channelCountMode: 'explicit',
        channelInterpretation: 'speakers',
        outputChannelCount: [2],
        processorOptions,
      })
    } catch (error) {
      load.release()
      throw error
    }
    return new WasmDevice(definition, node, initial, moved, context, load)
  }

  get input(): AudioNode {
    return this.node
  }

  get output(): AudioNode {
    return this.node
  }

  setParam(name: keyof P & string, value: number): void {
    const spec = this.params[name]
    if (!spec) throw new Error(`live-mix: ${this.id} has no parameter "${name}"`)
    const clamped = clampParam(spec, value)
    this.values.set(name, clamped)
    this.post({ type: 'set-param', paramId: spec.id, value: clamped })
    this.changes.emit({ type: 'param', name, value: clamped })
  }

  getParam(name: keyof P & string): number {
    const spec = this.params[name]
    if (!spec) throw new Error(`live-mix: ${this.id} has no parameter "${name}"`)
    return this.values.get(name) ?? spec.default
  }

  /**
   * Move a parameter on the audio thread, around the value it is set to;
   * null leaves it there. Only on the library's own processor (`modulates`).
   */
  modulate(name: keyof P & string, modulation: ParamModulation | null): void {
    const spec = this.params[name]
    if (!spec) throw new Error(`live-mix: ${this.id} has no parameter "${name}"`)
    if (!this.modulates) {
      throw new Error(`live-mix: ${this.id} runs a processor of its own and takes no modulation`)
    }
    const moves = modulation !== null && modulation.routes.length > 0
    if (!moves && !this.modulations.has(name)) return
    if (moves) this.modulations.set(name, modulation)
    else this.modulations.delete(name)
    this.post({
      type: 'modulate',
      paramId: spec.id,
      travel: paramTravel(spec),
      base: this.getParam(name),
      modulation: moves ? modulation : null,
    })
    this.changes.emit({ type: 'modulation', name })
  }

  /** What moves a parameter on the audio thread now; undefined for one that stands still. */
  modulationOf(name: keyof P & string): ParamModulation | undefined {
    return this.modulations.get(name)
  }

  /**
   * The parameter's value at `timeSec` on the context's clock (now, left
   * out): where the audio thread has it, worked out from the same numbers.
   */
  paramAt(name: keyof P & string, timeSec: number = this.context.currentTime): number {
    const base = this.getParam(name)
    const modulation = this.modulations.get(name)
    return modulation ? modulatedParamValue(this.params[name], base, modulation, timeSec) : base
  }

  get bypass(): boolean {
    return this.bypassed
  }

  set bypass(enabled: boolean) {
    if (this.bypassed === enabled) return
    this.bypassed = enabled
    this.post({ type: 'bypass', enabled })
    this.changes.emit({ type: 'bypass', bypass: enabled })
  }

  /** Called after every `setParam` and bypass change; returns the unsubscribe function. */
  onChange(listener: DeviceChangeListener): () => void {
    return this.changes.subscribe(listener)
  }

  /** The latest reading of a meter; 0 until one has arrived (nothing arrives unless the meters are watched). */
  meter(name: string): number {
    const spec = this.meters[name]
    if (!spec) throw new Error(`live-mix: ${this.id} has no meter "${name}"`)
    return this.meterValues[spec.id] ?? 0
  }

  /**
   * Have the module report its meters (`DEVICE_METER_HZ` times a second) until
   * the returned function is called. Watches are counted, so several views
   * can watch one device; a device without meters ignores it.
   */
  watchMeters(): () => void {
    const count = Object.keys(this.meters).length
    if (count === 0 || this.disposed) return () => {}
    if (this.meterWatchers === 0) {
      // `onmessage` is left to whoever made the device: an app-local processor answers there.
      this.node.port.addEventListener('message', this.onPortMessage)
      this.node.port.start()
      this.post({ type: 'meters', count, intervalFrames: this.meterIntervalFrames })
    }
    this.meterWatchers += 1
    let watching = true
    return () => {
      if (!watching) return
      watching = false
      this.meterWatchers -= 1
      if (this.meterWatchers > 0 || this.disposed) return
      this.node.port.removeEventListener('message', this.onPortMessage)
      this.post({ type: 'meters', count: 0, intervalFrames: this.meterIntervalFrames })
      // A reading nobody refreshes is not a reading.
      this.meterValues = []
    }
  }

  private readonly onPortMessage = (event: MessageEvent<DeviceHostMessage>): void => {
    if (event.data?.type === 'meters') this.meterValues = event.data.values
  }

  /** Note events for instrument modules (`device_note_on/off`); effects ignore them. */
  noteOn(noteId: number, frequency: number, gain = 0.5): void {
    this.post({ type: 'note-on', noteId, frequency, gain })
    this.remember(noteId, frequency, gain)
  }

  noteOff(noteId: number): void {
    this.post({ type: 'note-off', noteId })
    const nowMs = clockMs()
    for (const note of this.played)
      if (note.id === noteId && note.offMs === null) note.offMs = nowMs
  }

  /**
   * The notes this device was sent: the held ones, and the ones let go in the
   * last `PLAYED_KEPT_MS`, oldest first. For a display of what an instrument
   * plays (`NoteWatchDevice`); nothing of it reaches the sound.
   */
  playedNotes(): readonly PlayedNote[] {
    this.forget(clockMs())
    return this.played
  }

  private remember(id: number, frequency: number, gain: number): void {
    const nowMs = clockMs()
    // A key struck again while it is held is a new note, and the old one is let go.
    for (const note of this.played) if (note.id === id && note.offMs === null) note.offMs = nowMs
    this.forget(nowMs)
    if (this.played.length >= PLAYED_MOST) {
      // The oldest note that was let go makes room: a key still held sounds, so it is kept
      // while there is one to drop in its place.
      const letGo = this.played.findIndex((note) => note.offMs !== null)
      this.played.splice(Math.max(letGo, 0), 1)
    }
    this.played.push({ id, frequency, gain, onMs: nowMs, offMs: null })
  }

  private forget(nowMs: number): void {
    const played = this.played
    let kept = 0
    for (const note of played) {
      if (note.offMs === null || nowMs - note.offMs <= PLAYED_KEPT_MS) played[kept++] = note
    }
    played.length = kept
  }

  /**
   * Hand a sample device (granular synth, sampler) the sound it plays: one or
   * two channels of audio at `sampleRate`. The data is copied, so the caller's
   * buffers stay usable; frames beyond the device's capacity are dropped.
   * Devices that take no sample ignore it.
   */
  loadSample(channels: readonly Float32Array[], sampleRate: number): void {
    if (channels.length === 0) return
    const copies = channels.slice(0, 2).map((channel) => channel.slice())
    if (this.disposed) return
    // Read before the copies are handed over: a transferred buffer has no length left.
    this.sampleSeconds = sampleRate > 0 ? copies[0].length / sampleRate : null
    this.node.port.postMessage(
      { type: 'sample', channels: copies, sampleRate } satisfies DeviceMessage,
      copies.map((copy) => copy.buffer),
    )
  }

  /**
   * How long the sound this device was last handed is, in seconds; null until
   * it is handed one, while a sample device plays the sound it is built with,
   * and again once it is handed an instrument of zones.
   * For a display of where in the sound a note is read (`SampleWatchDevice`).
   */
  loadedSampleSeconds(): number | null {
    return this.sampleSeconds
  }

  /**
   * Hand a multi-sample instrument its zones and the sounds they play: a
   * zone map and a table of decoded audio keyed by the names the zones use
   * (docs/zone-sampler.md). The instrument is fitted to the device's sample memory
   * first (`planZoneLoad`): it loads whole, or not at all and the returned
   * plan says why, or with `overBudget: 'thin'` in part and the plan says
   * what was left out. The audio is copied, so the caller's buffers stay
   * usable and can be let go. A device that takes no zones refuses.
   */
  loadZones(
    map: ZoneMap,
    samples: Readonly<Record<string, ZoneSample | undefined>>,
    options: ZonePlanOptions = {},
  ): ZonePlan {
    if (!this.zones) {
      return {
        ok: false,
        reason: `${this.id} takes no zones`,
        bytes: 0,
        budgetBytes: 0,
        missing: [],
        problems: [],
      }
    }
    const { plan, load } = prepareZoneLoad(map, samples, this.zones, options)
    if (!load || this.disposed) return plan
    // An instrument of zones is many sounds: the length of the one before it is no longer true.
    this.sampleSeconds = null
    this.post({ type: 'zones-begin' })
    for (const sample of load.samples) {
      this.node.port.postMessage(
        {
          type: 'zone-sample',
          channels: sample.channels,
          sampleRate: sample.sampleRate,
        } satisfies DeviceMessage,
        sample.channels.map((channel) => channel.buffer),
      )
    }
    this.node.port.postMessage({ type: 'zones', fields: load.fields } satisfies DeviceMessage, [
      load.fields.buffer,
    ])
    return plan
  }

  /** Send an app-specific message to a custom processor (see `processor` in the definition). */
  postMessage(message: unknown, transfer?: Transferable[]): void {
    if (this.disposed) return
    if (transfer) this.node.port.postMessage(message, transfer)
    else this.node.port.postMessage(message)
  }

  dispose(): void {
    if (this.disposed) return
    // Without this the processor would go on being rendered, disconnected, for the life of the context.
    this.post({ type: 'dispose' })
    this.disposed = true
    this.load.release()
    this.changes.clear()
    if (this.meterWatchers > 0) this.node.port.removeEventListener('message', this.onPortMessage)
    this.node.disconnect()
    this.node.port.close()
  }

  private post(message: DeviceMessage): void {
    if (this.disposed) return
    this.node.port.postMessage(message)
  }
}

export { ensureProcessor }
