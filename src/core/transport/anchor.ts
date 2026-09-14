// Anchor-based transport position.
//
// Moved from ambient-live `app/frontend/pages/live/use-clip-transport.ts:14-67`
// (1d3b31b) and `timeline-model.ts:25-29` (`clampTime`). The position is
// derived from the audio clock and one pinned anchor rather than accumulated
// frame by frame, so what is drawn and what is scheduled cannot drift apart.
// Seconds are the primary unit (KD5); bars are a view layered on later.

export interface TransportLoop {
  /** Wrap at `lengthSec` and number the passes. Off: pause when `lengthSec` is reached. */
  enabled: boolean
  /** Timeline length in seconds. `Infinity` never wraps and never ends. */
  lengthSec: number
}

export interface TransportAnchor {
  /** Audio-clock time the transport was pinned at. */
  contextTime: number
  /** Timeline position at that moment. */
  positionSec: number
  /** Loop pass the anchor started on. */
  iteration: number
}

export interface TransportPosition {
  positionSec: number
  /** Loop pass. Numbered across re-pins, so a number is never reused. */
  iteration: number
  /** True when the loop is off and the position has run off the end. */
  finished: boolean
}

/** A start already handed to a schedulable. */
export interface ScheduledStart {
  clipId: string
  /** Loop pass the start belongs to. */
  iteration: number
  /** Where on the timeline the clip stood when it was scheduled. */
  startSec: number
}

/**
 * Dedupe key for a start (`clipId:iteration:startSec`, KTD6). The timeline
 * position is part of it, so moving a clip schedules its new position even
 * within the same loop pass.
 */
export function scheduleKey(start: ScheduledStart): string {
  return `${start.clipId}:${start.iteration}:${start.startSec.toFixed(3)}`
}

/** A loop only wraps when it is on and has a finite, positive length. */
export function isLooping(loop: TransportLoop): boolean {
  return loop.enabled && Number.isFinite(loop.lengthSec) && loop.lengthSec > 0
}

/**
 * Where the transport is at `contextTime`, derived from the anchor rather than
 * from accumulated frames. Time before the anchor (a start pinned in the
 * future) reads as the anchor position.
 */
export function positionFromAnchor(
  anchor: TransportAnchor,
  contextTime: number,
  loop: TransportLoop,
): TransportPosition {
  const raw = anchor.positionSec + Math.max(0, contextTime - anchor.contextTime)
  if (!isLooping(loop)) {
    return {
      positionSec: Math.min(raw, loop.lengthSec),
      iteration: anchor.iteration,
      finished: raw >= loop.lengthSec,
    }
  }
  const passes = Math.floor(raw / loop.lengthSec)
  return {
    positionSec: raw - passes * loop.lengthSec,
    iteration: anchor.iteration + passes,
    finished: false,
  }
}

/** Wraps a timeline position into `[0, loopLengthSec)`. */
export function wrapPosition(sec: number, loopLengthSec: number): number {
  if (loopLengthSec <= 0) return 0
  const wrapped = sec % loopLengthSec
  return wrapped < 0 ? wrapped + loopLengthSec : wrapped
}
