// Framework-free transport: play, pause, stop with fade, seek and loop over an
// anchor on the audio clock (R5, KTD6), at a speed that can be changed while
// it plays (`rate`: the tape runs faster or slower against the clock).
//
// Lifted from ambient-live `app/frontend/pages/live/use-clip-transport.ts`
// (1d3b31b): `anchorAt`/`resetSchedule` (:113-130), pause-at-end (:146-152),
// `changeTransport`/`seek` (:268-290). Breathwork Live's `MusicEngine`
// (`musicEngine.ts:238-250`, ebdd457) is the loop-off, never-ending case: one
// anchor pinned at start, positions in seconds since then.

import {
  isLooping,
  positionFromAnchor,
  wrapPosition,
  type TransportAnchor,
  type TransportLoop,
  type TransportPosition,
} from './anchor'

export type TransportState = 'stopped' | 'playing' | 'paused'

export type TransportChangeReason = 'start' | 'pause' | 'stop' | 'seek' | 'loop' | 'end' | 'rate'

export interface TransportChange {
  reason: TransportChangeReason
  state: TransportState
  position: TransportPosition
  /** Seconds sounding audio may take to fade before it is silenced. Non-zero only for `stop`. */
  fadeSec: number
}

export type TransportListener = (change: TransportChange) => void

export interface TransportOptions {
  /** Audio clock in seconds, normally `() => context.currentTime`. */
  now: () => number
  /** Defaults to loop off with no end (`lengthSec: Infinity`). */
  loop?: Partial<TransportLoop>
  /** Timeline seconds per second of the audio clock. Default 1. */
  rate?: number
}

export interface StopOptions {
  /** Fade length handed to listeners; the transport itself stops immediately. */
  fadeSec?: number
}

const DEFAULT_LOOP: TransportLoop = { enabled: false, lengthSec: Infinity }

export class Transport {
  private readonly clock: () => number
  private currentState: TransportState = 'stopped'
  private currentLoop: TransportLoop
  // Pinned while playing. Null otherwise: the idle fields hold the position.
  private currentAnchor: TransportAnchor | null = null
  private idlePositionSec = 0
  private idleIteration = 0
  // How far the timeline has run since its origin, while idle (see `elapsed`).
  private idleElapsedSec = 0
  // While playing: what to add to the anchor's own count of the timeline
  // (passes times the loop length, plus the position) to get `elapsed`. Set
  // once per pin, so it holds however the anchor is moved along afterwards.
  private elapsedOffsetSec = 0
  // Loop passes are numbered across anchors so a re-pin cannot reuse a number.
  private nextIteration = 0
  // Timeline seconds per second of the audio clock, since the anchor while playing.
  private currentRate: number
  private readonly listeners = new Set<TransportListener>()

  constructor(options: TransportOptions) {
    this.clock = options.now
    this.currentLoop = validateLoop({ ...DEFAULT_LOOP, ...options.loop })
    this.currentRate = validateRate(options.rate ?? 1)
  }

  get state(): TransportState {
    return this.currentState
  }

  get loop(): Readonly<TransportLoop> {
    return this.currentLoop
  }

  /** The pin on the audio clock while playing; null when paused or stopped. */
  get anchor(): Readonly<TransportAnchor> | null {
    return this.currentAnchor
  }

  /**
   * How fast the timeline runs against the audio clock: timeline seconds per
   * clock second. 1 is the clock's own speed; below it the timeline is slow,
   * above it fast. Whatever follows the transport plays at this speed, so a
   * clip sounds lower and longer, or higher and shorter, as tape does.
   */
  get rate(): number {
    return this.currentRate
  }

  /** The audio clock. */
  now(): number {
    return this.clock()
  }

  /**
   * Where the transport is. Pure: reading it never changes state, so a paused
   * or stopped transport keeps reporting where it was left. `finished` is
   * reported, not acted on — the `Scheduler` (or the host) pauses at the end.
   */
  position(contextTime = this.clock()): TransportPosition {
    if (this.currentAnchor) {
      return positionFromAnchor(this.currentAnchor, contextTime, this.currentLoop, this.currentRate)
    }
    return { positionSec: this.idlePositionSec, iteration: this.idleIteration, finished: false }
  }

  /**
   * Audio-clock time at which timeline position `positionSec` of loop pass
   * `iteration` is reached under the current anchor. This is how a scheduler
   * turns a start into a `when` for the audio graph.
   */
  contextTimeAt(positionSec: number, iteration?: number): number {
    const anchor = this.currentAnchor
    if (!anchor) throw new Error('Transport.contextTimeAt: the transport is not playing')
    const offsetSec = positionSec - anchor.positionSec
    const rate = this.currentRate
    if (!isLooping(this.currentLoop)) return anchor.contextTime + offsetSec / rate
    const passes = (iteration ?? anchor.iteration) - anchor.iteration
    return anchor.contextTime + (passes * this.currentLoop.lengthSec) / rate + offsetSec / rate
  }

  /**
   * How far the timeline has run since its origin, in timeline seconds: the
   * position with every pass before it counted in, so it does not come back
   * to 0 when the loop wraps. A pause keeps it, a `seek` moves it by as much
   * as it moves the position (the passes before stay counted), `seekElapsed`
   * sets it, and `stop` puts it back to 0. With the loop off it follows the
   * position. It is the clock a `Cycle` (a loop of its own length) runs on,
   * and `Math.floor(elapsed() / loop.lengthSec)` is how many passes of the
   * transport's loop have gone by.
   */
  elapsed(contextTime = this.clock()): number {
    if (!this.currentAnchor) return this.idleElapsedSec
    return this.elapsedOffsetSec + this.counted(this.position(contextTime))
  }

  /**
   * Audio-clock time at which `elapsed()` reaches `elapsedSec` under the
   * current anchor: `contextTimeAt` for a point on the whole run of the
   * timeline rather than in one pass of the loop.
   */
  contextTimeAtElapsed(elapsedSec: number): number {
    const anchor = this.currentAnchor
    if (!anchor) throw new Error('Transport.contextTimeAtElapsed: the transport is not playing')
    const countedSec = elapsedSec - this.elapsedOffsetSec
    if (!isLooping(this.currentLoop)) return this.contextTimeAt(countedSec)
    const length = this.currentLoop.lengthSec
    const iteration = Math.floor(countedSec / length)
    return this.contextTimeAt(countedSec - iteration * length, iteration)
  }

  /**
   * Starts playing from the current position, pinning the anchor at `at` on
   * the audio clock (default: now; past times are clamped to now, as in
   * `AudioScheduledSourceNode.start`). No-op while already playing.
   */
  start(at?: number): void {
    if (this.currentState === 'playing') return
    const now = this.clock()
    this.pin(at === undefined ? now : Math.max(at, now), this.idlePositionSec)
    this.currentState = 'playing'
    this.emit('start')
  }

  /** Freezes the position where it is. Pausing a finished transport is the pause-at-end. */
  pause(): void {
    if (this.currentState !== 'playing') return
    const position = this.unpin()
    this.currentState = 'paused'
    this.emit(position.finished ? 'end' : 'pause')
  }

  /**
   * Returns to position 0, the timeline's origin (`elapsed()` is 0 again).
   * `fadeSec` is passed on to listeners for their fade-out.
   */
  stop(options: StopOptions = {}): void {
    if (
      this.currentState === 'stopped' &&
      this.idlePositionSec === 0 &&
      this.idleElapsedSec === 0
    ) {
      return
    }
    if (this.currentAnchor) this.unpin()
    this.idlePositionSec = 0
    this.idleElapsedSec = 0
    this.currentState = 'stopped'
    this.emit('stop', Math.max(0, options.fadeSec ?? 0))
  }

  /**
   * Moves the position. Wraps into the loop when looping, clamps to
   * `[0, lengthSec]` otherwise. While playing the transport is re-pinned to
   * now with a fresh pass number. `elapsed()` moves by as much as the
   * position does: a seek is a move within the pass the transport is in.
   */
  seek(positionSec: number): void {
    const target = this.normalisePosition(positionSec)
    if (this.currentAnchor) this.unpin()
    this.moveTo(target)
    if (this.currentState === 'playing') this.pin(this.clock(), target)
    this.emit('seek')
  }

  /**
   * Moves to a point on the whole run of the timeline: `elapsed()` becomes
   * `elapsedSec`, and the position is where that falls in the loop (or the
   * same second, clamped to the timeline, with the loop off). `seekElapsed(0)`
   * is the origin, where every `Cycle` is at its own start. Listeners hear a
   * `seek`.
   */
  seekElapsed(elapsedSec: number): void {
    if (Number.isNaN(elapsedSec)) throw new RangeError('Transport: elapsed must be a number')
    const target = this.normalisePosition(Math.max(0, elapsedSec))
    if (this.currentAnchor) this.unpin()
    this.idlePositionSec = target
    // With the loop off the timeline may end short of what was asked for.
    this.idleElapsedSec = isLooping(this.currentLoop) ? Math.max(0, elapsedSec) : target
    if (this.currentState === 'playing') this.pin(this.clock(), target)
    this.emit('seek')
  }

  /** Changes the loop. While playing the transport is re-pinned so the position carries over. */
  setLoop(loop: Partial<TransportLoop>): void {
    const next = validateLoop({ ...this.currentLoop, ...loop })
    if (
      next.enabled === this.currentLoop.enabled &&
      next.lengthSec === this.currentLoop.lengthSec
    ) {
      return
    }
    if (this.currentAnchor) this.unpin()
    this.currentLoop = next
    // Folded into a shorter loop, the position moves and `elapsed()` with it.
    const target = this.normalisePosition(this.idlePositionSec)
    this.moveTo(target)
    if (this.currentState === 'playing') this.pin(this.clock(), target)
    this.emit('loop')
  }

  /**
   * Changes how fast the timeline runs against the audio clock, from now on.
   * While playing the transport is re-pinned where it is, on the pass it is
   * in: the position carries on without a jump and no pass is renumbered, so
   * starts already handed over keep their keys and only their clock times
   * move. Listeners hear reason `rate` and read the new one off `rate`; the
   * `Scheduler` moves what is pending and what sounds. Stopped or paused, the
   * rate is kept for the next start.
   */
  setRate(rate: number): void {
    const next = validateRate(rate)
    if (next === this.currentRate) return
    const anchor = this.currentAnchor
    if (anchor) {
      const now = this.clock()
      const position = this.position(now)
      this.currentAnchor = {
        // A start pinned ahead of the clock stays where it was pinned.
        contextTime: Math.max(now, anchor.contextTime),
        positionSec: position.positionSec,
        iteration: position.iteration,
      }
      this.nextIteration = Math.max(this.nextIteration, position.iteration + 1)
    }
    this.currentRate = next
    this.emit('rate')
  }

  /** Subscribes to state changes and re-pins. Returns the unsubscribe function. */
  onChange(listener: TransportListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private pin(contextTime: number, positionSec: number): void {
    this.currentAnchor = { contextTime, positionSec, iteration: this.nextIteration }
    this.elapsedOffsetSec = this.idleElapsedSec - this.counted(this.currentAnchor)
    this.nextIteration += 1
  }

  /** Drops the anchor, freezing the position it reported and retiring its pass number. */
  private unpin(): TransportPosition {
    const now = this.clock()
    const position = this.position(now)
    this.idleElapsedSec = this.elapsed(now)
    this.currentAnchor = null
    this.idlePositionSec = position.positionSec
    this.idleIteration = position.iteration
    this.nextIteration = Math.max(this.nextIteration, position.iteration + 1)
    return position
  }

  /** Puts the idle position at `positionSec`, carrying `elapsed()` along by the same amount. */
  private moveTo(positionSec: number): void {
    this.idleElapsedSec = Math.max(0, this.idleElapsedSec + positionSec - this.idlePositionSec)
    this.idlePositionSec = positionSec
  }

  /**
   * The timeline as the anchor's own numbers count it: every numbered pass a
   * loop long, plus the position. It differs from `elapsed()` by a constant
   * while one anchor (or one moved along in place) is pinned.
   */
  private counted(at: { positionSec: number; iteration: number }): number {
    if (!isLooping(this.currentLoop)) return at.positionSec
    return at.iteration * this.currentLoop.lengthSec + at.positionSec
  }

  private normalisePosition(sec: number): number {
    if (Number.isNaN(sec)) throw new RangeError('Transport: position must be a number')
    if (isLooping(this.currentLoop)) return wrapPosition(sec, this.currentLoop.lengthSec)
    return Math.min(Math.max(0, sec), this.currentLoop.lengthSec)
  }

  private emit(reason: TransportChangeReason, fadeSec = 0): void {
    const change: TransportChange = {
      reason,
      state: this.currentState,
      position: this.position(),
      fadeSec,
    }
    for (const listener of [...this.listeners]) listener(change)
  }
}

function validateRate(rate: number): number {
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new RangeError(`Transport: rate must be a positive number, got ${rate}`)
  }
  return rate
}

function validateLoop(loop: TransportLoop): TransportLoop {
  if (Number.isNaN(loop.lengthSec) || loop.lengthSec <= 0) {
    throw new RangeError(`Transport: loop lengthSec must be positive, got ${loop.lengthSec}`)
  }
  return loop
}
