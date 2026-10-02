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
  // Loop passes are numbered across anchors so a re-pin cannot reuse a number.
  private nextIteration = 0
  // The counted pass: how many times the loop has come round since `stop` or
  // `setPass`. `iteration` names a handover and is new after every re-pin;
  // this is the piece's own count, and a pause, a seek or a loop change keeps it.
  private idlePass = 0
  /** The counted pass of the anchor's own `iteration`, while playing. */
  private anchorPass = 0
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
   * The counted pass at `contextTime`: 0 on the first time through, one more
   * each time the loop comes round. A pause, a seek and a loop change keep
   * the count; `stop` goes back to 0 and `setPass` puts it anywhere. With the
   * loop off it stays where it is. What is left to chance is drawn per
   * counted pass (`soundsOnPass`), so the same pass always plays the same.
   */
  pass(contextTime = this.clock()): number {
    if (!this.currentAnchor) return this.idlePass
    return this.passOf(this.position(contextTime).iteration)
  }

  /** The counted pass that loop pass `iteration` is under the current anchor. */
  passOf(iteration: number): number {
    const anchor = this.currentAnchor
    if (!anchor) return this.idlePass
    return Math.max(0, this.anchorPass + (iteration - anchor.iteration))
  }

  /**
   * Makes the pass the position is in counted pass `pass`. While playing
   * this is a seek to where the transport already is: it is re-pinned with a
   * fresh pass number, so what sounds is let go and entered again as that
   * pass has it. Listeners hear `seek`.
   */
  setPass(pass: number): void {
    if (Number.isNaN(pass)) throw new RangeError('Transport: pass must be a number')
    const next = Math.max(0, Math.floor(pass))
    if (next === this.pass()) return
    if (this.currentAnchor) {
      const position = this.unpin()
      this.idlePass = next
      this.pin(this.clock(), position.positionSec)
    } else {
      this.idlePass = next
    }
    this.emit('seek')
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
   * Returns to position 0 and to the first counted pass. `fadeSec` is passed
   * on to listeners for their fade-out.
   */
  stop(options: StopOptions = {}): void {
    if (this.currentState === 'stopped' && this.idlePositionSec === 0 && this.idlePass === 0) {
      return
    }
    if (this.currentAnchor) this.unpin()
    this.idlePositionSec = 0
    this.idlePass = 0
    this.currentState = 'stopped'
    this.emit('stop', Math.max(0, options.fadeSec ?? 0))
  }

  /**
   * Moves the position. Wraps into the loop when looping, clamps to
   * `[0, lengthSec]` otherwise. While playing the transport is re-pinned to
   * now with a fresh pass number; the counted pass stays as it is.
   */
  seek(positionSec: number): void {
    const target = this.normalisePosition(positionSec)
    if (this.currentAnchor) {
      this.unpin()
      this.pin(this.clock(), target)
    } else {
      this.idlePositionSec = target
    }
    this.emit('seek')
  }

  /**
   * Slides a playing transport `deltaSec` along the timeline (forwards when
   * positive) without re-pinning it: for keeping step with a clock the audio
   * clock drifts against, such as an Ableton Link session or a MIDI clock.
   * Nothing is announced and nothing sounding is touched. Starts already
   * handed to the audio graph keep their time; later ones are timed from the
   * moved anchor, on the same pass numbers. It is for the fraction of a
   * millisecond two clocks part by in a second: a start inside a larger jump
   * is passed over or met twice with nobody told, which is what `seek` is
   * for. `deltaSec` is timeline time, whatever the `rate`. No-op unless playing.
   */
  nudge(deltaSec: number): void {
    if (!this.currentAnchor || !Number.isFinite(deltaSec) || deltaSec === 0) return
    this.currentAnchor = {
      ...this.currentAnchor,
      contextTime: this.currentAnchor.contextTime - deltaSec / this.currentRate,
    }
  }

  /**
   * Stretches the timeline under the transport by `ratio`: the position and
   * the loop length are multiplied by it, and the moment on the audio clock
   * stays. This is a tempo change for a host whose clips keep their beat: at
   * 120/100 (slower) everything that was at 10 s is at 12 s, the transport
   * included, so it is in the same bar as before. `lengthSec` gives the new
   * loop length exactly, where the host has it without the rounding of a
   * multiplication.
   *
   * Loop passes keep their numbers and the counted pass stays as it is, so
   * starts already handed over still belong to the pass they were handed over
   * for; `Scheduler.rescale` is what moves them along with their clips.
   * Announced as a `loop` change.
   */
  rescale(ratio: number, lengthSec: number = this.currentLoop.lengthSec * ratio): void {
    if (!Number.isFinite(ratio) || ratio <= 0) {
      throw new RangeError(`Transport: rescale ratio must be positive, got ${ratio}`)
    }
    const next = validateLoop({ ...this.currentLoop, lengthSec })
    if (ratio === 1 && next.lengthSec === this.currentLoop.lengthSec) return
    if (this.currentAnchor) {
      const now = this.clock()
      const position = this.position(now)
      // A start still pinned in the future keeps its moment.
      const contextTime = Math.max(now, this.currentAnchor.contextTime)
      // The new anchor is of the pass the position is in: its counted pass goes with it.
      this.anchorPass = this.passOf(position.iteration)
      this.currentLoop = next
      this.currentAnchor = {
        contextTime,
        positionSec: this.normalisePosition(position.positionSec * ratio),
        iteration: position.iteration,
      }
      this.nextIteration = Math.max(this.nextIteration, position.iteration + 1)
    } else {
      this.currentLoop = next
      this.idlePositionSec = this.normalisePosition(this.idlePositionSec * ratio)
    }
    this.emit('loop')
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
    if (this.currentAnchor) {
      const position = this.unpin()
      this.currentLoop = next
      this.pin(this.clock(), this.normalisePosition(position.positionSec))
    } else {
      this.currentLoop = next
      this.idlePositionSec = this.normalisePosition(this.idlePositionSec)
    }
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
      // The new anchor is of the pass the position is in: its counted pass goes with it.
      this.anchorPass = this.passOf(position.iteration)
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
    this.anchorPass = this.idlePass
    this.nextIteration += 1
  }

  /** Drops the anchor, freezing the position it reported and retiring its pass number. */
  private unpin(): TransportPosition {
    const position = this.position()
    this.idlePass = this.passOf(position.iteration)
    this.currentAnchor = null
    this.idlePositionSec = position.positionSec
    this.idleIteration = position.iteration
    this.nextIteration = Math.max(this.nextIteration, position.iteration + 1)
    return position
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
