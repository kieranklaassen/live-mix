// Framework-free transport: play, pause, stop with fade, seek and loop over an
// anchor on the audio clock (R5, KTD6).
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

export type TransportChangeReason = 'start' | 'pause' | 'stop' | 'seek' | 'loop' | 'end'

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
  private readonly listeners = new Set<TransportListener>()

  constructor(options: TransportOptions) {
    this.clock = options.now
    this.currentLoop = validateLoop({ ...DEFAULT_LOOP, ...options.loop })
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
      return positionFromAnchor(this.currentAnchor, contextTime, this.currentLoop)
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
    if (!isLooping(this.currentLoop)) return anchor.contextTime + offsetSec
    const passes = (iteration ?? anchor.iteration) - anchor.iteration
    return anchor.contextTime + passes * this.currentLoop.lengthSec + offsetSec
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

  /** Returns to position 0. `fadeSec` is passed on to listeners for their fade-out. */
  stop(options: StopOptions = {}): void {
    if (this.currentState === 'stopped' && this.idlePositionSec === 0) return
    if (this.currentAnchor) this.unpin()
    this.idlePositionSec = 0
    this.currentState = 'stopped'
    this.emit('stop', Math.max(0, options.fadeSec ?? 0))
  }

  /**
   * Moves the position. Wraps into the loop when looping, clamps to
   * `[0, lengthSec]` otherwise. While playing the transport is re-pinned to
   * now with a fresh pass number.
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

  /** Subscribes to state changes and re-pins. Returns the unsubscribe function. */
  onChange(listener: TransportListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private pin(contextTime: number, positionSec: number): void {
    this.currentAnchor = { contextTime, positionSec, iteration: this.nextIteration }
    this.nextIteration += 1
  }

  /** Drops the anchor, freezing the position it reported and retiring its pass number. */
  private unpin(): TransportPosition {
    const position = this.position()
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

function validateLoop(loop: TransportLoop): TransportLoop {
  if (Number.isNaN(loop.lengthSec) || loop.lengthSec <= 0) {
    throw new RangeError(`Transport: loop lengthSec must be positive, got ${loop.lengthSec}`)
  }
  return loop
}
