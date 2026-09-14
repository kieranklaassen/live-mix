// A summing bus: one GainNode (the fader) that sources connect into, an
// optional post-fader insert chain, and a destination. Exactly one node is
// created per bus so a consumer's node order stays predictable; inserts
// rewire the tail when added or removed. Taps (meters) hang off the tail and
// are re-fed after every rewire.

import { type Device } from '../devices/Device'
import { Emitter } from '../events'

/** What a bus reports to hosts: a fader target change or an insert-chain change. */
export type BusChangeKind = 'level' | 'inserts'

export interface BusChange {
  kind: BusChangeKind
  bus: Bus
}

export type BusChangeListener = (change: BusChange) => void

export interface BusOptions {
  name: string
  /** Where the bus feeds; the master's is the OutputRouter output. */
  destination: AudioNode
  /** Initial fader value (unity by default). */
  gain?: number
}

/** Default ramp for level changes made through `setLevel`. */
export const LEVEL_RAMP_SECONDS = 0.005

export class Bus {
  readonly name: string
  readonly gainNode: GainNode
  protected readonly ctx: BaseAudioContext
  protected destination: AudioNode
  private levelValue: number
  private readonly changes = new Emitter<BusChange>()
  protected readonly insertList: Device[] = []
  protected readonly tapSet = new Set<AudioNode>()
  protected disposed = false

  constructor(ctx: BaseAudioContext, options: BusOptions) {
    this.ctx = ctx
    this.name = options.name
    this.destination = options.destination
    this.gainNode = ctx.createGain()
    if (options.gain !== undefined) this.gainNode.gain.value = options.gain
    this.levelValue = Math.max(0, options.gain ?? 1)
    this.gainNode.connect(this.destination)
  }

  /** Connect sources here. */
  get input(): AudioNode {
    return this.gainNode
  }

  /** The fader as an AudioParam, for callers that schedule it themselves. */
  get gain(): AudioParam {
    return this.gainNode.gain
  }

  /** The last node of the bus (fader or last insert), i.e. what feeds the destination. */
  get output(): AudioNode {
    const last = this.insertList[this.insertList.length - 1]
    return last ? last.output : this.gainNode
  }

  /** The node the bus currently feeds (the master's is the terminus or its meter). */
  get destinationNode(): AudioNode {
    return this.destination
  }

  /** Post-fader inserts, in order. */
  get inserts(): readonly Device[] {
    return this.insertList
  }

  /**
   * Click-free level change: an exponential approach with `timeConstant`
   * seconds, starting `at` (default now).
   */
  setLevel(value: number, options: { at?: number; timeConstant?: number } = {}): void {
    const at = options.at ?? this.ctx.currentTime
    this.levelValue = Math.max(0, value)
    this.gainNode.gain.setTargetAtTime(
      this.levelValue,
      at,
      options.timeConstant ?? LEVEL_RAMP_SECONDS,
    )
    this.changes.emit({ kind: 'level', bus: this })
  }

  /** The fader's target (the last `setLevel`, or the initial gain); `MasterBus.level()` is the meter. */
  get targetLevel(): number {
    return this.levelValue
  }

  /** Level and insert-chain changes, for views. Returns the unsubscribe function. */
  onChange(listener: BusChangeListener): () => void {
    return this.changes.subscribe(listener)
  }

  /** Nodes fed a copy of the bus output (meters, analysers), in the order added. */
  get taps(): readonly AudioNode[] {
    return [...this.tapSet]
  }

  /** Append a device to the post-fader chain. */
  addInsert(device: Device): void {
    this.assertLive()
    if (this.insertList.includes(device)) return
    this.output.disconnect()
    this.output.connect(device.input)
    this.insertList.push(device)
    device.output.connect(this.destination)
    this.retap(device.output)
    this.changes.emit({ kind: 'inserts', bus: this })
  }

  /** Remove a device from the chain and reconnect around it (does not dispose it). */
  removeInsert(device: Device): void {
    this.assertLive()
    const index = this.insertList.indexOf(device)
    if (index === -1) return
    const wasTail = index === this.insertList.length - 1
    const before = index === 0 ? this.gainNode : this.insertList[index - 1].output
    const after = this.insertList[index + 1]?.input ?? this.destination
    before.disconnect()
    device.output.disconnect()
    this.insertList.splice(index, 1)
    before.connect(after)
    if (wasTail) this.retap(before)
    this.changes.emit({ kind: 'inserts', bus: this })
  }

  /**
   * Feed a copy of the bus output (post-fader, post-inserts) into `node`, for
   * example a `LufsMeter` input. The tap survives insert changes.
   */
  addTap(node: AudioNode): void {
    this.assertLive()
    if (this.tapSet.has(node)) return
    this.tapSet.add(node)
    this.tapSource().connect(node)
  }

  removeTap(node: AudioNode): void {
    if (!this.tapSet.delete(node)) return
    try {
      this.tapSource().disconnect(node)
    } catch {
      // Already disconnected by a rewire or a closed context; ignore.
    }
  }

  /** Re-point the bus (and its chain tail) at a new destination. */
  connectTo(destination: AudioNode): void {
    this.assertLive()
    const tail = this.output
    tail.disconnect()
    this.destination = destination
    tail.connect(destination)
    this.retap(tail)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    try {
      this.gainNode.disconnect()
      for (const device of this.insertList) device.output.disconnect()
    } catch {
      // Context may already be closed; ignore.
    }
    this.insertList.length = 0
    this.tapSet.clear()
    this.changes.clear()
  }

  /** The node taps read from: the chain tail here; the master overrides it to sit after its limiter. */
  protected tapSource(): AudioNode {
    return this.output
  }

  /** Re-feed the taps after `tail` was rewired, if that is where they hang. */
  protected retap(tail: AudioNode): void {
    if (this.tapSource() !== tail) return
    for (const tap of this.tapSet) tail.connect(tap)
  }

  protected assertLive(): void {
    if (this.disposed) throw new Error(`live-mix: bus "${this.name}" is disposed`)
  }
}
