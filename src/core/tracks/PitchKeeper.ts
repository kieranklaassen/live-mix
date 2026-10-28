// A track's sound at the pitch it was recorded, while the transport runs at
// another rate. The transport's rate is tape's (`Transport.setRate`): every
// voice reads its buffer `rate` times as fast, so at 2 it is an octave higher.
// A `PitchKeeper` is one Signalsmith Stretch node in its live-input mode
// (`signalsmith-stretch`, MIT), which the track's voices are summed into and
// which shifts them back down by `−12·log2(rate)` semitones before the strip:
// every insert, send and fader then hears the sound at its own pitch.
//
// It is out of the path at rate 1, so a mix that never plays fast sounds as it
// did to the sample. It holds the sound back by its own latency, the same for
// every keeper of one engine (they share a configuration), so the tracks stay
// lined up and the engine reports that delay as `IoLatency.keptSec`.
//
// The node is made by the factory the host passes (the package's
// `SignalsmithStretch`), as `StretchSource` takes it: the library imports
// nothing from the package, and a host that never plays fast loads no WASM.

import { type StretchNode, type StretchNodeFactory } from '../sources/StretchSource'

/** The semitones that bring a sound read `rate` times as fast back to its own pitch. */
export function keptSemitones(rate: number): number {
  return -12 * Math.log2(rate)
}

export interface PitchKeeperOptions {
  /** `SignalsmithStretch` from `signalsmith-stretch`, or a stand-in of the same shape. */
  create: StretchNodeFactory
  /** The node's block, in milliseconds: shorter is less delay and more work. Default 70. */
  blockMs?: number
}

/** The block the keepers run with when the host names none: under 80 ms of delay. */
export const DEFAULT_KEEPER_BLOCK_MS = 70

export class PitchKeeper {
  private rateValue = 1
  private disposed = false

  private constructor(readonly node: StretchNode) {}

  /** Makes a keeper for one track, idle and at no shift until a rate is set. */
  static async make(context: BaseAudioContext, options: PitchKeeperOptions): Promise<PitchKeeper> {
    const node = await options.create(context, {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    })
    node.configure?.({ blockMs: options.blockMs ?? DEFAULT_KEEPER_BLOCK_MS })
    node.schedule({ active: false, semitones: 0 })
    return new PitchKeeper(node)
  }

  /** The rate it is shifting for: 1 while idle. */
  get rate(): number {
    return this.rateValue
  }

  /** Seconds it holds the sound back by: what it reports while it works, 0 while idle. */
  get latencySec(): number {
    return this.rateValue === 1 || this.disposed ? 0 : this.node.latency()
  }

  /** Shifts for `rate` from now; at 1 it goes idle. */
  setRate(rate: number): void {
    if (this.disposed || rate === this.rateValue) return
    this.rateValue = rate
    this.node.schedule(
      rate === 1
        ? { active: false, semitones: 0 }
        : { active: true, semitones: keptSemitones(rate) },
    )
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.node.schedule({ active: false })
    this.node.disconnect()
  }
}
