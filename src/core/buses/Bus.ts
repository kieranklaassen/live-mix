// A summing bus: one GainNode (the fader) that sources connect into, an
// optional post-fader insert chain, and a destination. Exactly one node is
// created per bus so a consumer's node order stays predictable; inserts
// rewire the tail when added or removed.

import { type Device } from '../devices/Device'

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
  protected readonly insertList: Device[] = []
  protected disposed = false

  constructor(ctx: BaseAudioContext, options: BusOptions) {
    this.ctx = ctx
    this.name = options.name
    this.destination = options.destination
    this.gainNode = ctx.createGain()
    if (options.gain !== undefined) this.gainNode.gain.value = options.gain
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
    this.gainNode.gain.setTargetAtTime(
      Math.max(0, value),
      at,
      options.timeConstant ?? LEVEL_RAMP_SECONDS,
    )
  }

  /** Append a device to the post-fader chain. */
  addInsert(device: Device): void {
    this.assertLive()
    if (this.insertList.includes(device)) return
    this.output.disconnect()
    this.output.connect(device.input)
    this.insertList.push(device)
    device.output.connect(this.destination)
  }

  /** Remove a device from the chain and reconnect around it (does not dispose it). */
  removeInsert(device: Device): void {
    this.assertLive()
    const index = this.insertList.indexOf(device)
    if (index === -1) return
    const before = index === 0 ? this.gainNode : this.insertList[index - 1].output
    const after = this.insertList[index + 1]?.input ?? this.destination
    before.disconnect()
    device.output.disconnect()
    this.insertList.splice(index, 1)
    before.connect(after)
  }

  /** Re-point the bus (and its chain tail) at a new destination. */
  connectTo(destination: AudioNode): void {
    this.assertLive()
    this.output.disconnect()
    this.destination = destination
    this.output.connect(destination)
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
  }

  protected assertLive(): void {
    if (this.disposed) throw new Error(`live-mix: bus "${this.name}" is disposed`)
  }
}
