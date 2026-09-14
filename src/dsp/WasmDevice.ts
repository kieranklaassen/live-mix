// Main-thread host for one WASM device: an AudioWorkletNode running
// wasm-device.processor.ts over a compiled module. The Module is compiled once
// per page (assets.ts), the processor script is added once per context, and
// every device gets its own node and WebAssembly.Instance. Parameters travel
// over the MessagePort by id (v1); the typed table next to each device maps
// names to ids and ranges.

import { type Device } from '../core/devices/Device'
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

// `addModule` once per context per processor URL.
const loadedProcessors = new WeakMap<BaseAudioContext, Map<string, Promise<void>>>()

function ensureProcessor(context: BaseAudioContext, url: string): Promise<void> {
  let perContext = loadedProcessors.get(context)
  if (!perContext) {
    perContext = new Map()
    loadedProcessors.set(context, perContext)
  }
  let loading = perContext.get(url)
  if (!loading) {
    loading = context.audioWorklet.addModule(url).catch((error: unknown) => {
      perContext.delete(url)
      throw error
    })
    perContext.set(url, loading)
  }
  return loading
}

export class WasmDevice<
  P extends Record<string, ParamSpec> = Record<string, ParamSpec>,
> implements Device {
  readonly id: string
  readonly params: Readonly<P>
  readonly node: AudioWorkletNode
  readonly latencySec: number
  private readonly values = new Map<string, number>()
  private bypassed = false
  private disposed = false

  private constructor(
    definition: WasmDeviceDefinition<P>,
    node: AudioWorkletNode,
    initial: Map<string, number>,
  ) {
    this.id = definition.id
    this.params = definition.params
    this.node = node
    this.latencySec = definition.latencySec ?? 0
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
    const processorUrl = resolveProcessorUrl(options.processorUrl)
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
    const node = (options.createNode ?? defaultCreateNode)(context, WASM_DEVICE_PROCESSOR_NAME, {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 2,
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
      outputChannelCount: [2],
      processorOptions,
    })
    return new WasmDevice(definition, node, initial)
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
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.node.disconnect()
    this.node.port.close()
  }

  private post(message: DeviceMessage): void {
    if (this.disposed) return
    this.node.port.postMessage(message)
  }
}
