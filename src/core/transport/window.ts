// The scheduler's view of `clipsInWindow` (U3, from ambient-live
// `pages/live/clip-schedule.ts`): the loop is a `TransportLoop`, and the window
// can reach back `catchUpSec` behind the position — across any number of loop
// seams — so starts missed while the timer was throttled are still handed
// over, late, instead of skipped (R7, AE4).

import { clipsInWindow, type ClipWindow, type ScheduledClip } from '../clips/window'
import { isLooping, type TransportLoop } from './anchor'

export interface ScheduleWindow {
  clips: ClipWindow['clips']
  positionSec: number
  lookaheadSec: number
  iteration: number
  loop: TransportLoop
  /** How far behind `positionSec` the window reaches. Default 0. */
  catchUpSec?: number
}

/**
 * Starts in `[positionSec - catchUpSec, positionSec + lookaheadSec)`, wrapped
 * into whichever loop passes that span covers. `startsInSec` is measured from
 * `positionSec`, so a start being caught up on is negative. Half-open, so
 * consecutive windows never return the same start twice. Sorted by how soon
 * each start is due. With `catchUpSec` 0 this is `clipsInWindow`.
 */
export function startsInWindow({
  clips,
  positionSec,
  lookaheadSec,
  iteration,
  loop,
  catchUpSec = 0,
}: ScheduleWindow): ScheduledClip[] {
  const behindSec = Math.max(0, catchUpSec)
  const windowStartSec = positionSec - behindSec
  const spanSec = behindSec + lookaheadSec
  const fromWindowStart = (hit: ScheduledClip): ScheduledClip => ({
    ...hit,
    startsInSec: hit.startsInSec - behindSec,
  })

  if (!isLooping(loop)) {
    return clipsInWindow({
      clips,
      playheadSec: windowStartSec,
      lookaheadSec: spanSec,
      iteration,
      loopEnabled: false,
      loopLengthSec: loop.lengthSec,
    }).map(fromWindowStart)
  }

  // One pass at a time with the loop off: each pass sees the window shifted
  // into its own coordinates, which is what lets the span cross several seams.
  const length = loop.lengthSec
  const firstPass = Math.floor(windowStartSec / length)
  const lastPass = Math.floor((positionSec + lookaheadSec) / length)
  const starts: ScheduledClip[] = []
  for (let pass = firstPass; pass <= lastPass; pass += 1) {
    const hits = clipsInWindow({
      clips,
      playheadSec: windowStartSec - pass * length,
      lookaheadSec: spanSec,
      iteration: iteration + pass,
      loopEnabled: false,
      loopLengthSec: length,
    })
    for (const hit of hits) starts.push(fromWindowStart(hit))
  }
  return starts.sort((a, b) => a.startsInSec - b.startsInSec)
}
