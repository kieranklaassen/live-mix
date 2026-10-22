// Main-thread host for a voice cleanup device: one AudioWorkletNode running
// that kind's processor (cleanup.processor.ts). The signal goes in and leaves
// cleaned, so the device sits in any insert chain, a voice's strip first of
// all. Parameters travel over the MessagePort; the processor reports the dB
// it took off at a low rate, for a meter. One class hosts all six kinds;
// which one it is, is its `id`.
//
// The processors must be registered in the context before construction —
// `loadCleanupProcessor(ctx)` from the dsp entry does that (it resolves the
// bundled worklet URL), and the registry's factories await it.

import {
  type DeviceChange,
  type DeviceChangeListener,
  type DeviceMeterSpec,
  type MeteredDevice,
  type ObservableDevice,
} from '../../Device'
import { Emitter } from '../../../events'
import { clampParam, type ParamSpec } from '../../../params'
import { createWorkletNode } from '../../../worklet-node'
import {
  CLEANUP_PARAMS,
  CLEANUP_REPORT_HZ,
  cleanupLatencySamples,
  cleanupProcessorName,
  type CleanupHostMessage,
  type CleanupKind,
  type CleanupMessage,
  type CleanupProcessorOptions,
} from './abi'

/** Injectable node constructor so tests can substitute a mock worklet node. */
export type CleanupNodeFactory = (
  context: BaseAudioContext,
  name: string,
  options: AudioWorkletNodeOptions,
) => AudioWorkletNode

export interface WorkletCleanupOptions {
  /** Initial parameter values by name; anything left out is the default. */
  params?: Readonly<Record<string, number>>
  /** Meter report rate to the main thread (Hz); 0 disables. Default 30. */
  reportHz?: number
  createNode?: CleanupNodeFactory
}

/** What a cleanup device reports about its own work: the dB it took off the sound lately (0 or more). */
export const CLEANUP_METERS = {
  reduction: { id: 0, name: 'Reduction', unit: 'dB' },
} as const satisfies Record<string, DeviceMeterSpec>

const NO_METERS: Readonly<Record<string, DeviceMeterSpec>> = {}

export class WorkletCleanup implements ObservableDevice, MeteredDevice {
  readonly id: CleanupKind
  readonly params: Readonly<Record<string, ParamSpec>>
  readonly node: AudioWorkletNode
  readonly latencySamples: number
  readonly latencySec: number
  /** The readings a meter shows; none when the processor was told not to report (a `reportHz` not above 0). */
  readonly meters: Readonly<Record<string, DeviceMeterSpec>>
  private readonly values = new Map<string, number>()
  private readonly changes = new Emitter<DeviceChange>()
  private reductionValue = 0
  private bypassed = false
  private disposed = false

  constructor(ctx: BaseAudioContext, kind: CleanupKind, options: WorkletCleanupOptions = {}) {
    this.id = kind
    this.params = CLEANUP_PARAMS[kind]
    this.latencySamples = cleanupLatencySamples(kind, ctx.sampleRate)
    this.latencySec = this.latencySamples / ctx.sampleRate
    for (const [name, spec] of Object.entries(this.params)) {
      const requested = options.params?.[name]
      this.values.set(name, requested === undefined ? spec.default : clampParam(spec, requested))
    }
    const processorOptions: CleanupProcessorOptions = {
      kind,
      params: Object.entries(this.params).map(
        ([name, spec]) => [spec.id, this.getParam(name)] as const,
      ),
      reportHz: options.reportHz,
    }
    // As the processor reads it: it reports only at a rate above 0.
    this.meters = (options.reportHz ?? CLEANUP_REPORT_HZ) > 0 ? CLEANUP_METERS : NO_METERS
    const name = cleanupProcessorName(kind)
    try {
      this.node = (options.createNode ?? createWorkletNode)(ctx, name, {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 2,
        channelCountMode: 'explicit',
        channelInterpretation: 'speakers',
        outputChannelCount: [2],
        processorOptions,
      })
    } catch (error) {
      throw describeMissingProcessor(error, name)
    }
    this.node.port.onmessage = (event: MessageEvent<CleanupHostMessage>) => {
      this.handleMessage(event.data)
    }
  }

  /** The dB the device took off over the last report's span, updated at `reportHz`. */
  get reduction(): number {
    return this.reductionValue
  }

  meter(name: string): number {
    if (name === 'reduction') return this.reductionValue
    throw new Error(`live-mix: ${this.id} has no meter "${name}"`)
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

  setParam(name: string, value: number): void {
    const spec = this.specFor(name)
    const clamped = clampParam(spec, value)
    this.values.set(name, clamped)
    this.post({ type: 'set-param', paramId: spec.id, value: clamped })
    this.changes.emit({ type: 'param', name, value: clamped })
  }

  getParam(name: string): number {
    return this.values.get(name) ?? this.specFor(name).default
  }

  /** Click-free bypass to the dry sound held as long as the device holds its own; the processing keeps running. */
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

  private handleMessage(message: CleanupHostMessage): void {
    switch (message.type) {
      case 'ready':
        break
      case 'meter':
        this.reductionValue = message.reduction
        break
      default: {
        const unhandled: never = message
        throw new Error(`live-mix: unhandled cleanup host message ${JSON.stringify(unhandled)}`)
      }
    }
  }

  private specFor(name: string): ParamSpec {
    const spec = Object.hasOwn(this.params, name) ? this.params[name] : undefined
    if (!spec) throw new Error(`live-mix: ${this.id} has no parameter "${name}"`)
    return spec
  }

  private post(message: CleanupMessage): void {
    if (this.disposed) return
    this.node.port.postMessage(message)
  }
}

/** The browser's InvalidStateError for an unregistered processor, made actionable. */
function describeMissingProcessor(error: unknown, name: string): unknown {
  const kind = (error as { name?: unknown } | null)?.name
  if (kind !== 'InvalidStateError') return error
  return new Error(
    `live-mix: "${name}" is not registered in this AudioContext; ` +
      'await loadCleanupProcessor(ctx) from @kieranklaassen/live-mix/dsp before creating a WorkletCleanup',
    { cause: error },
  )
}
