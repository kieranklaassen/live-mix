// A loop of its own length on the transport's clock.
//
// The transport has one loop. A `Cycle` is another, of any length, that runs
// on the same timeline: where the transport has run `elapsed()` seconds since
// its origin, the cycle is at `elapsed() % lengthSec` of its own pass. Two
// cycles of different lengths start together at the origin and slide apart,
// and meet again when the elapsed time is a multiple of both lengths. A track
// that follows a cycle instead of the transport (`AudioTrack.loopLengthSec`)
// repeats its clips at that length whatever the transport's loop does, which
// is how tape loops of unequal length are made.
//
// A cycle is the slice of `Transport` the scheduler and the lane writers read
// (`Timebase`), so they schedule a track on its cycle exactly as they would
// on the transport. It keeps no clock of its own: every answer is worked out
// from the transport's `elapsed()` and `contextTimeAtElapsed()`. Those are in
// timeline seconds, so a transport that runs faster or slower against the
// audio clock (`Transport.rate`) takes every cycle with it at that speed.

import { passAt, type TransportAnchor, type TransportLoop, type TransportPosition } from './anchor'

/**
 * What the scheduler and the lane writers read off a clock: where it is, the
 * loop it runs, the pin they measure from, and when a position comes round.
 * `Transport` is one; a `Cycle` is one derived from it.
 */
export interface Timebase {
  readonly loop: Readonly<TransportLoop>
  /** The pin on the audio clock while playing; null otherwise. */
  readonly anchor: Readonly<TransportAnchor> | null
  position(contextTime?: number): TransportPosition
  /** Audio-clock time at which `positionSec` of pass `iteration` is reached. */
  contextTimeAt(positionSec: number, iteration?: number): number
  /**
   * The counted pass that pass `iteration` is: how many times this clock had
   * come round before it, which a pause and a seek keep. What a clip leaves
   * to chance is drawn per counted pass of the clock it is on.
   */
  passOf(iteration: number): number
}

/** The slice of `Transport` a cycle is derived from; `Transport` satisfies it. */
export interface CycleTransport {
  readonly anchor: Readonly<TransportAnchor> | null
  readonly loop: Readonly<TransportLoop>
  /** Timeline seconds per second of the audio clock. Absent: 1. */
  readonly rate?: number
  now(): number
  position(contextTime?: number): TransportPosition
  elapsed(contextTime?: number): number
  contextTimeAtElapsed(elapsedSec: number): number
}

/** What a cycle remembers of the transport anchor its pass numbers were last worked out under. */
interface SeenAnchor {
  anchor: Readonly<TransportAnchor>
  elapsedSec: number
}

export class Cycle implements Timebase {
  private readonly transport: CycleTransport
  private length: number
  private seen: SeenAnchor | null = null
  // A pass's number is this plus how many of the cycle's passes fit in the elapsed time.
  private numberOffset = 0
  // The highest pass number given out so far, so the next run of numbers starts above it.
  private highest = -1

  constructor(transport: CycleTransport, lengthSec: number) {
    this.transport = transport
    this.length = validateLength(lengthSec)
  }

  /** How long one pass of the cycle is, in timeline seconds. */
  get lengthSec(): number {
    return this.length
  }

  /**
   * Changing the length moves where the cycle is, so its passes are numbered
   * afresh. The scheduler notices on its next pass and moves whatever runs
   * on the cycle over to where it now stands.
   */
  set lengthSec(lengthSec: number) {
    const next = validateLength(lengthSec)
    if (next === this.length) return
    this.length = next
    this.seen = null
  }

  /** A cycle always wraps: it is a loop whether or not the transport has one. */
  get loop(): Readonly<TransportLoop> {
    return { enabled: true, lengthSec: this.length }
  }

  /** The transport's rate: a cycle runs on its timeline, at its speed. */
  get rate(): number {
    return this.transport.rate ?? 1
  }

  get anchor(): Readonly<TransportAnchor> | null {
    const anchor = this.transport.anchor
    if (!anchor) return null
    const elapsedSec = this.transport.elapsed(anchor.contextTime)
    const pass = this.passAt(elapsedSec)
    return {
      contextTime: anchor.contextTime,
      positionSec: this.into(pass, elapsedSec),
      iteration: this.numberOf(pass),
    }
  }

  /**
   * Where the cycle is. `finished` is the transport's: a cycle never ends by
   * itself, but it stops with a transport that has run off its end.
   */
  position(contextTime = this.transport.now()): TransportPosition {
    const elapsedSec = this.transport.elapsed(contextTime)
    const pass = this.passAt(elapsedSec)
    return {
      positionSec: this.into(pass, elapsedSec),
      iteration: this.numberOf(pass),
      finished: this.transport.position(contextTime).finished,
    }
  }

  contextTimeAt(positionSec: number, iteration?: number): number {
    const anchor = this.transport.anchor
    if (!anchor) throw new Error('Cycle.contextTimeAt: the transport is not playing')
    this.follow(anchor)
    const pass =
      iteration === undefined
        ? this.passAt(this.transport.elapsed(anchor.contextTime))
        : iteration - this.numberOffset
    // A start handed over ahead of the cycle can be on a pass it has not reached.
    if (iteration !== undefined && iteration > this.highest) this.highest = iteration
    return this.transport.contextTimeAtElapsed(pass * this.length + positionSec)
  }

  /**
   * The counted pass of the cycle's pass `iteration`: how many of its own
   * lengths the timeline had run from its origin when that pass began.
   */
  passOf(iteration: number): number {
    const anchor = this.transport.anchor
    if (!anchor) return Math.max(0, this.passAt(this.transport.elapsed()))
    this.follow(anchor)
    return Math.max(0, iteration - this.numberOffset)
  }

  /**
   * The pass the run of the timeline is in at `elapsedSec`. The start of a
   * pass belongs to it however it was worked out: with a length a float
   * cannot hold exactly (35.765), 29 lengths divided by one is a hair under
   * 29, and the meeting point of two loops would read as the last instant of
   * the pass before.
   */
  private passAt(elapsedSec: number): number {
    return passAt(elapsedSec, this.length)
  }

  /** How far into pass `pass` the run is at `elapsedSec`: never before its start. */
  private into(pass: number, elapsedSec: number): number {
    return Math.max(0, elapsedSec - pass * this.length)
  }

  /** The number of one of the cycle's passes, counted from the timeline's origin. */
  private numberOf(pass: number): number {
    const anchor = this.transport.anchor
    if (anchor) this.follow(anchor)
    else this.seen = null
    const iteration = this.numberOffset + pass
    if (iteration > this.highest) this.highest = iteration
    return iteration
  }

  /**
   * Pass numbers are never reused, as the transport's are not, so a start is
   * named for ever by its clip, its pass and its place. When the transport
   * takes a fresh pass number for its anchor (it started, was put somewhere
   * else, or its loop changed) the cycle's numbers start again above every
   * one given out. An anchor that only moved along the pass it was in, at the
   * number the old one had reached, carries the cycle's numbers on with it.
   */
  private follow(anchor: Readonly<TransportAnchor>): void {
    if (this.seen?.anchor === anchor) return
    const elapsedSec = this.transport.elapsed(anchor.contextTime)
    if (!this.seen || !this.carriesOn(this.seen, anchor, elapsedSec)) {
      this.numberOffset = this.highest + 1 - this.passAt(elapsedSec)
    }
    this.seen = { anchor, elapsedSec }
  }

  private carriesOn(
    seen: SeenAnchor,
    anchor: Readonly<TransportAnchor>,
    elapsedSec: number,
  ): boolean {
    if (elapsedSec < seen.elapsedSec) return false
    const { enabled, lengthSec } = this.transport.loop
    const looping = enabled && Number.isFinite(lengthSec) && lengthSec > 0
    const passes = looping
      ? Math.floor((seen.anchor.positionSec + elapsedSec - seen.elapsedSec) / lengthSec)
      : 0
    return anchor.iteration === seen.anchor.iteration + passes
  }
}

function validateLength(lengthSec: number): number {
  if (!Number.isFinite(lengthSec) || lengthSec <= 0) {
    throw new RangeError(`Cycle: lengthSec must be a positive number, got ${lengthSec}`)
  }
  return lengthSec
}
