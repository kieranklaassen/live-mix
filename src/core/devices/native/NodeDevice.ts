// Host for devices built from stock Web Audio nodes (Biquad, Delay,
// DynamicsCompressor, Gain, StereoPanner). A definition describes the param
// table and how to build the processing graph; NodeDevice wraps that graph in
// the Device contract: a stable input/output pair, clamped and tracked
// parameter values scheduled as short ramps on the underlying AudioParams, and
// a click-free bypass crossfade that keeps the chain running.
//
//   input ─┬─► graph.input … graph.output ─► wet ─┬─► output
//          └──────────────────► dry ──────────────┘
//
// Every parameter change (and the bypass) ramps over NODE_DEVICE_RAMP_SECONDS,
// the same 5 ms the WASM host uses for its bypass crossfade, so both device
// kinds respond identically to a knob.

import { clampParam, type ParamSpec } from '../../params'
import { type Device } from '../Device'

/** Ramp length for parameter and bypass changes; equals the WASM host's `BYPASS_RAMP_SECONDS`. */
export const NODE_DEVICE_RAMP_SECONDS = 0.005

/** Moves `param` to `value` click-free, starting now. */
export type ParamRamp = (param: AudioParam, value: number, rampSec?: number) => void

/** Applies one clamped parameter value to the graph through `ramp`. */
export type ParamApplier = (value: number, ramp: ParamRamp) => void

/** What a definition's `build` returns: the chain and how params reach it. */
export interface NodeDeviceGraph<P extends Record<string, ParamSpec>> {
  /** First node of the chain; the device's input feeds it. */
  input: AudioNode
  /** Last node of the chain; feeds the device's wet path. */
  output: AudioNode
  /** One applier per parameter name; the type forces every param to be wired. */
  apply: { readonly [K in keyof P]: ParamApplier }
  /** Every node the graph created, so `dispose` can disconnect them all. */
  nodes: readonly AudioNode[]
}

export interface NodeDeviceDefinition<
  P extends Record<string, ParamSpec>,
  G extends NodeDeviceGraph<P> = NodeDeviceGraph<P>,
> {
  id: string
  params: P
  /** Fixed processing latency of the chain, for plugin delay compensation. */
  latencySec?: number
  build(context: BaseAudioContext): G
}

export function defineNodeDevice<
  P extends Record<string, ParamSpec>,
  G extends NodeDeviceGraph<P> = NodeDeviceGraph<P>,
>(definition: NodeDeviceDefinition<P, G>): NodeDeviceDefinition<P, G> {
  return definition
}

export interface NodeDeviceOptions<P extends Record<string, ParamSpec>> {
  /** Initial parameter values by name; anything omitted uses the spec default. */
  params?: Partial<Record<keyof P & string, number>>
}

/** Sets a param outright; used for initial values before any automation exists. */
const setImmediately: ParamRamp = (param, value) => {
  param.value = value
}

export class NodeDevice<
  P extends Record<string, ParamSpec> = Record<string, ParamSpec>,
  G extends NodeDeviceGraph<P> = NodeDeviceGraph<P>,
> implements Device {
  readonly id: string
  readonly params: Readonly<P>
  readonly input: GainNode
  readonly output: GainNode
  readonly latencySec: number
  protected readonly context: BaseAudioContext
  protected readonly graph: G
  private readonly dry: GainNode
  private readonly wet: GainNode
  private readonly values = new Map<string, number>()
  private bypassed = false
  private disposed = false

  constructor(
    context: BaseAudioContext,
    definition: NodeDeviceDefinition<P, G>,
    options: NodeDeviceOptions<P> = {},
  ) {
    this.context = context
    this.id = definition.id
    this.params = definition.params
    this.latencySec = definition.latencySec ?? 0

    this.input = context.createGain()
    this.output = context.createGain()
    this.dry = context.createGain()
    this.wet = context.createGain()
    this.dry.gain.value = 0
    this.wet.gain.value = 1

    this.graph = definition.build(context)
    this.input.connect(this.graph.input)
    this.graph.output.connect(this.wet)
    this.wet.connect(this.output)
    this.input.connect(this.dry)
    this.dry.connect(this.output)

    for (const [name, spec] of Object.entries(definition.params)) {
      const requested = options.params?.[name as keyof P & string]
      const value = requested === undefined ? spec.default : clampParam(spec, requested)
      this.values.set(name, value)
      this.graph.apply[name as keyof P](value, setImmediately)
    }
  }

  setParam(name: keyof P & string, value: number): void {
    const spec = this.params[name]
    if (!spec) throw new Error(`live-mix: ${this.id} has no parameter "${name}"`)
    const clamped = clampParam(spec, value)
    this.values.set(name, clamped)
    if (this.disposed) return
    this.graph.apply[name](clamped, this.ramp)
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
    if (this.disposed) return
    this.ramp(this.dry.gain, enabled ? 1 : 0)
    this.ramp(this.wet.gain, enabled ? 0 : 1)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    for (const node of [this.input, this.dry, this.wet, this.output, ...this.graph.nodes]) {
      node.disconnect()
    }
  }

  /**
   * Hold the param where it is now and ramp linearly to `value`. Uses
   * `cancelAndHoldAtTime` where the browser has it; otherwise pins the current
   * value with `setValueAtTime` after cancelling what was scheduled.
   */
  protected readonly ramp: ParamRamp = (param, value, rampSec = NODE_DEVICE_RAMP_SECONDS) => {
    const now = this.context.currentTime
    if (typeof param.cancelAndHoldAtTime === 'function') {
      param.cancelAndHoldAtTime(now)
    } else {
      param.cancelScheduledValues(now)
      param.setValueAtTime(param.value, now)
    }
    param.linearRampToValueAtTime(value, now + rampSec)
  }
}
