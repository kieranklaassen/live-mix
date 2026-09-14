// Main-thread host for one WASM device: an AudioWorkletNode running
// wasm-device.processor.ts over a compiled module. The Module is compiled once
// per page (assets.ts), the processor script is added once per context, and
// every device gets its own node and WebAssembly.Instance. Parameters travel
// over the MessagePort by id (v1); the typed table next to each device maps
// names to ids and ranges.

import {
  type DeviceChange,
  type DeviceChangeListener,
  type NoteDevice,
  type ObservableDevice,
} from '../core/devices/Device'
import { Emitter } from '../core/events'
import { ensureProcessor } from '../core/worklet-loader'
import { clampParam, type ParamSpec } from '../core/params'
import {
  WASM_DEVICE_PROCESSOR_NAME,
  type DeviceMessage,
  type WasmDeviceProcessorOptions,
} from './abi'
import { compileWasm, resolveProcessorUrl, type AssetOverrides, type WasmSource } from './assets'

/** Static description of a WASM device: where its module lives and its params. */
export interface WasmDeviceDefinition<
  P extends Record<string, ParamSpec> = Record<string, ParamSpec>,
> {
  id: string
  /** Default module location; called lazily so `import.meta.url` is never read at import time. */
  wasm: () => WasmSource
  params: P
  latencySec?: number
  /** Sample-exact latency at a given rate, when the DSP knows it (default: `round(latencySec · sampleRate)`). */
  latencySamples?: (sampleRate: number) => number
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
  createNode?: WorkletNodeFactory
}

const defaultCreateNode: WorkletNodeFactory = (context, name, options) =>
  new AudioWorkletNode(context, name, options)

export class WasmDevice<P extends Record<string, ParamSpec> = Record<string, ParamSpec>>
  implements NoteDevice, ObservableDevice
{
  readonly id: string
  readonly params: Readonly<P>
  readonly node: AudioWorkletNode
  readonly latencySec: number
  readonly latencySamples: number
  private readonly values = new Map<string, number>()
  private readonly changes = new Emitter<DeviceChange>()
  private bypassed = false
  private disposed = false

  private constructor(
    definition: WasmDeviceDefinition<P>,
    node: AudioWorkletNode,
    initial: Map<string, number>,
    sampleRate: number,
  ) {
    this.id = definition.id
    this.params = definition.params
    this.node = node
    this.latencySec = definition.latencySec ?? 0
    this.latencySamples = Math.max(
      0,
      Math.round(
        definition.latencySamples
          ? definition.latencySamples(sampleRate)
          : this.latencySec * sampleRate,
      ),
    )
    this.values = initial
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
    const processorOptions: WasmDeviceProcessorOptions = {
      module,
      deviceId: definition.id,
      params: Object.entries(definition.params).map(
        ([name, spec]) => [spec.id, initial.get(name) ?? spec.default] as const,
      ),
    }
    const processorName = definition.processor?.name ?? WASM_DEVICE_PROCESSOR_NAME
    const node = (options.createNode ?? defaultCreateNode)(context, processorName, {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 2,
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
      outputChannelCount: [2],
      processorOptions,
    })
    return new WasmDevice(definition, node, initial, context.sampleRate)
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

  /** Note events for instrument modules (`device_note_on/off`); effects ignore them. */
  noteOn(noteId: number, frequency: number, gain = 0.5): void {
    this.post({ type: 'note-on', noteId, frequency, gain })
  }

  noteOff(noteId: number): void {
    this.post({ type: 'note-off', noteId })
  }

  /** Send an app-specific message to a custom processor (see `processor` in the definition). */
  postMessage(message: unknown, transfer?: Transferable[]): void {
    if (this.disposed) return
    if (transfer) this.node.port.postMessage(message, transfer)
    else this.node.port.postMessage(message)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.changes.clear()
    this.node.disconnect()
    this.node.port.close()
  }

  private post(message: DeviceMessage): void {
    if (this.disposed) return
    this.node.port.postMessage(message)
  }
}

export { ensureProcessor }
