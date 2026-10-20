// Main-thread host for the audio-thread gate: one AudioWorkletNode running
// gate.processor.ts. The signal goes in and leaves gated, so the device sits
// in any insert chain (a voice's strip first of all). Parameters travel over
// the MessagePort; the processor reports its detector and gain back at a low
// rate for meters. It keys on its own input: there is no key to wire.
//
// The processor must be registered in the context before construction —
// `loadGateProcessor(ctx)` from the dsp entry does that (it resolves the
// bundled worklet URL), and the registry's factory awaits it.

import { Emitter } from '../../events'
import { clampParam } from '../../params'
import { createWorkletNode } from '../../worklet-node'
import {
  type DeviceChange,
  type DeviceChangeListener,
  type DeviceMeterSpec,
  type MeteredDevice,
  type ObservableDevice,
} from '../Device'
import {
  GATE_PARAMS,
  GATE_PROCESSOR_NAME,
  GATE_REPORT_HZ,
  type GateHostMessage,
  type GateMessage,
  type GateParamName,
  type GateProcessorOptions,
} from './gate-abi'

/** Injectable node constructor so tests can substitute a mock worklet node. */
export type GateNodeFactory = (
  context: BaseAudioContext,
  name: string,
  options: AudioWorkletNodeOptions,
) => AudioWorkletNode

export type WorkletGateOptions = Partial<Record<GateParamName, number>> & {
  /** Level report rate to the main thread (Hz); 0 disables. Default 30. */
  reportHz?: number
  createNode?: GateNodeFactory
}

const PARAM_NAMES = Object.keys(GATE_PARAMS) as GateParamName[]

/**
 * What the gate reports about its own work, for a display to draw: the gain
 * it has on the signal (linear, 1 when open) and its detector on the signal
 * (linear peak), as the processor last reported them.
 */
export const GATE_METERS = {
  gain: { id: 0, name: 'Gate gain', unit: '', display: true },
  level: { id: 1, name: 'Level', unit: '', display: true },
} as const satisfies Record<string, DeviceMeterSpec>

const NO_METERS: Readonly<Record<string, DeviceMeterSpec>> = {}

export class WorkletGate implements ObservableDevice, MeteredDevice {
  readonly id = 'gate'
  readonly params = GATE_PARAMS
  readonly node: AudioWorkletNode
  readonly latencySec = 0
  readonly latencySamples = 0
  /** The readings a display draws; none when the processor was told not to report (a `reportHz` not above 0). */
  readonly meters: Readonly<Record<string, DeviceMeterSpec>>
  private readonly values = new Map<GateParamName, number>()
  private readonly changes = new Emitter<DeviceChange>()
  private levelValue = 0
  private gainValue = 1
  private bypassed = false
  private disposed = false

  constructor(ctx: BaseAudioContext, options: WorkletGateOptions = {}) {
    for (const name of PARAM_NAMES) {
      const spec = GATE_PARAMS[name]
      const requested = options[name]
      this.values.set(name, requested === undefined ? spec.default : clampParam(spec, requested))
    }
    const processorOptions: GateProcessorOptions = {
      params: PARAM_NAMES.map((name) => [GATE_PARAMS[name].id, this.getParam(name)] as const),
      reportHz: options.reportHz,
    }
    // As the processor reads it: it reports only at a rate above 0.
    this.meters = (options.reportHz ?? GATE_REPORT_HZ) > 0 ? GATE_METERS : NO_METERS
    try {
      this.node = (options.createNode ?? createWorkletNode)(ctx, GATE_PROCESSOR_NAME, {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 2,
        channelCountMode: 'explicit',
        channelInterpretation: 'speakers',
        outputChannelCount: [2],
        processorOptions,
      })
    } catch (error) {
      throw describeMissingProcessor(error)
    }
    this.node.port.onmessage = (event: MessageEvent<GateHostMessage>) => {
      this.handleMessage(event.data)
    }
  }

  /** Last reported detector value (linear peak), updated at `reportHz`. */
  get level(): number {
    return this.levelValue
  }

  /** Last reported gain, updated at `reportHz`. */
  get gain(): number {
    return this.gainValue
  }

  /** The latest reading of a meter: `gain` and `level` as above, both linear. */
  meter(name: string): number {
    if (name === 'gain') return this.gainValue
    if (name === 'level') return this.levelValue
    throw new Error(`live-mix: gate has no meter "${name}"`)
  }

  /** The processor reports at `reportHz` whether or not anyone watches, so there is nothing to start or to stop. */
  watchMeters(): () => void {
    return () => {}
  }

  get input(): AudioNode {
    return this.node
  }

  get output(): AudioNode {
    return this.node
  }

  setParam(name: GateParamName, value: number): void {
    const spec = this.specFor(name)
    const clamped = clampParam(spec, value)
    this.values.set(name, clamped)
    this.post({ type: 'set-param', paramId: spec.id, value: clamped })
    this.changes.emit({ type: 'param', name, value: clamped })
  }

  getParam(name: GateParamName): number {
    return this.values.get(name) ?? this.specFor(name).default
  }

  /** Click-free bypass: the gain crossfades to unity in the processor; the detector keeps running. */
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

  /**
   * Disconnect and release the processor. Remove the device from its bus
   * first (`bus.removeInsert`) so the chain is rewired around it.
   */
  dispose(): void {
    if (this.disposed) return
    this.post({ type: 'dispose' })
    this.disposed = true
    this.changes.clear()
    try {
      this.node.disconnect()
    } catch {
      // Context may already be closed; ignore.
    }
    this.node.port.close()
  }

  private handleMessage(message: GateHostMessage): void {
    switch (message.type) {
      case 'ready':
        break
      case 'level':
        this.levelValue = message.level
        this.gainValue = message.gain
        break
      default: {
        const unhandled: never = message
        throw new Error(`live-mix: unhandled gate host message ${JSON.stringify(unhandled)}`)
      }
    }
  }

  private specFor(name: GateParamName) {
    const spec = Object.hasOwn(GATE_PARAMS, name) ? GATE_PARAMS[name] : undefined
    if (!spec) throw new Error(`live-mix: gate has no parameter "${String(name)}"`)
    return spec
  }

  private post(message: GateMessage): void {
    if (this.disposed) return
    this.node.port.postMessage(message)
  }
}

/** The browser's InvalidStateError for an unregistered processor, made actionable. */
function describeMissingProcessor(error: unknown): unknown {
  const name = (error as { name?: unknown } | null)?.name
  if (name !== 'InvalidStateError') return error
  return new Error(
    `live-mix: "${GATE_PROCESSOR_NAME}" is not registered in this AudioContext; ` +
      'await loadGateProcessor(ctx) from @kieranklaassen/live-mix/dsp before creating a WorkletGate',
    { cause: error },
  )
}
