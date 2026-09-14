// Main-thread host for the audio-thread sidechain ducker (U17): one
// two-input AudioWorkletNode running ducker.processor.ts. Input 0 carries the
// signal being ducked, input 1 the key; the ducked signal leaves output 0, so
// the device sits in a bus insert chain (`bus.addInsert(ducker)`) and the key
// is tapped with `key(node)` exactly like the legacy `Ducker`. Parameters
// travel over the MessagePort; the processor reports envelope and gain back
// at a low rate for meters. No timers: `stop()` and `unkey()` are messages
// and disconnections, not cleared intervals.
//
// The processor must be registered in the context before construction —
// `loadDuckerProcessor(ctx)` from the dsp entry does that (it resolves the
// bundled worklet URL); the engine's `addDucker(bus, { mode: 'worklet' })`
// then builds and inserts the device synchronously.

import { Emitter } from '../../events'
import { clampParam } from '../../params'
import { type DeviceChange, type DeviceChangeListener, type ObservableDevice } from '../Device'
import {
  DUCKER_PARAMS,
  DUCKER_PROCESSOR_NAME,
  type DuckerHostMessage,
  type DuckerMessage,
  type DuckerParamName,
  type DuckerProcessorOptions,
} from './ducker-abi'
import { type SidechainDucker } from './SidechainDucker'

/** Injectable node constructor so tests can substitute a mock worklet node. */
export type DuckerNodeFactory = (
  context: BaseAudioContext,
  name: string,
  options: AudioWorkletNodeOptions,
) => AudioWorkletNode

export type WorkletDuckerOptions = Partial<Record<DuckerParamName, number>> & {
  /** Key RMS window in samples. Default 256 (the legacy analyser's fftSize). */
  windowSize?: number
  /** Envelope report rate to the main thread (Hz); 0 disables. Default 30. */
  reportHz?: number
  createNode?: DuckerNodeFactory
}

const defaultCreateNode: DuckerNodeFactory = (context, name, options) =>
  new AudioWorkletNode(context, name, options)

const PARAM_NAMES = Object.keys(DUCKER_PARAMS) as DuckerParamName[]

export class WorkletDucker implements ObservableDevice, SidechainDucker {
  readonly id = 'ducker'
  readonly mode = 'worklet' as const
  readonly params = DUCKER_PARAMS
  readonly node: AudioWorkletNode
  readonly latencySec = 0
  readonly latencySamples = 0
  private readonly values = new Map<DuckerParamName, number>()
  private readonly changes = new Emitter<DeviceChange>()
  private keyed: AudioNode | null = null
  private envelopeValue = 0
  private gainValue = 1
  private bypassed = false
  private disposed = false

  constructor(ctx: BaseAudioContext, options: WorkletDuckerOptions = {}) {
    for (const name of PARAM_NAMES) {
      const spec = DUCKER_PARAMS[name]
      const requested = options[name]
      this.values.set(name, requested === undefined ? spec.default : clampParam(spec, requested))
    }
    const processorOptions: DuckerProcessorOptions = {
      params: PARAM_NAMES.map((name) => [DUCKER_PARAMS[name].id, this.getParam(name)] as const),
      windowSize: options.windowSize,
      reportHz: options.reportHz,
    }
    try {
      this.node = (options.createNode ?? defaultCreateNode)(ctx, DUCKER_PROCESSOR_NAME, {
        numberOfInputs: 2,
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
    this.node.port.onmessage = (event: MessageEvent<DuckerHostMessage>) => {
      this.handleMessage(event.data)
    }
  }

  get depth(): number {
    return this.getParam('depth')
  }

  get attackMs(): number {
    return this.getParam('attackMs')
  }

  get holdMs(): number {
    return this.getParam('holdMs')
  }

  get releaseMs(): number {
    return this.getParam('releaseMs')
  }

  get gainScale(): number {
    return this.getParam('gainScale')
  }

  get timeConstant(): number {
    return this.getParam('timeConstant')
  }

  /** Last reported follower value (RMS domain), updated at `reportHz`. */
  get envelope(): number {
    return this.envelopeValue
  }

  /** Last reported smoothed gain, updated at `reportHz`. */
  get gain(): number {
    return this.gainValue
  }

  /** The node currently feeding the key input, or null. */
  get keyNode(): AudioNode | null {
    return this.keyed
  }

  /** Signal input (worklet input 0). */
  get input(): AudioNode {
    return this.node
  }

  get output(): AudioNode {
    return this.node
  }

  /**
   * Feed `node` into the key input. A re-key disconnects the previous key
   * first; the follower keeps running across re-keys.
   */
  key(node: AudioNode): void {
    this.assertLive()
    this.unkey()
    node.connect(this.node, 0, 1)
    this.keyed = node
  }

  /** Disconnect the key: the follower sees silence and releases to unity. */
  unkey(): void {
    if (!this.keyed) return
    try {
      this.keyed.disconnect(this.node, 0, 1)
    } catch {
      // The key may already be disconnected (a live input re-attach unwires
      // the old source before re-keying); nothing to undo.
    }
    this.keyed = null
  }

  setParam(name: DuckerParamName, value: number): void {
    const spec = this.specFor(name)
    const clamped = clampParam(spec, value)
    this.values.set(name, clamped)
    this.post({ type: 'set-param', paramId: spec.id, value: clamped })
    this.changes.emit({ type: 'param', name, value: clamped })
  }

  getParam(name: DuckerParamName): number {
    return this.values.get(name) ?? this.specFor(name).default
  }

  /** Click-free bypass: the gain crossfades to unity in the processor; the follower keeps running. */
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

  /** Freeze the follower for good: the gain settles at its last target. */
  stop(): void {
    this.post({ type: 'stop' })
  }

  /**
   * Unkey, disconnect and release the processor. Remove the device from its
   * bus first (`bus.removeInsert`) so the chain is rewired around it.
   */
  dispose(): void {
    if (this.disposed) return
    this.unkey()
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

  private handleMessage(message: DuckerHostMessage): void {
    switch (message.type) {
      case 'ready':
        break
      case 'envelope':
        this.envelopeValue = message.envelope
        this.gainValue = message.gain
        break
      default: {
        const unhandled: never = message
        throw new Error(`live-mix: unhandled ducker host message ${JSON.stringify(unhandled)}`)
      }
    }
  }

  private specFor(name: DuckerParamName) {
    const spec = Object.hasOwn(DUCKER_PARAMS, name) ? DUCKER_PARAMS[name] : undefined
    if (!spec) throw new Error(`live-mix: ducker has no parameter "${String(name)}"`)
    return spec
  }

  private post(message: DuckerMessage): void {
    if (this.disposed) return
    this.node.port.postMessage(message)
  }

  private assertLive(): void {
    if (this.disposed) throw new Error('live-mix: ducker is disposed')
  }
}

/** The browser's InvalidStateError for an unregistered processor, made actionable. */
function describeMissingProcessor(error: unknown): unknown {
  const name = (error as { name?: unknown } | null)?.name
  if (name !== 'InvalidStateError') return error
  return new Error(
    `live-mix: "${DUCKER_PROCESSOR_NAME}" is not registered in this AudioContext; ` +
      'await loadDuckerProcessor(ctx) from @kieranklaassen/live-mix/dsp before creating a WorkletDucker',
    { cause: error },
  )
}
