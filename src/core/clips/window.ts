// Turns the timeline into a list of clip starts that fall inside the next
// slice of time. Pure, so the scheduling contract is provable without audio.

import { type Clip } from './Clip'

export interface ScheduledClip {
  clipId: string
  /** Loop pass this start belongs to — the key that stops a clip firing twice. */
  iteration: number
  /** Seconds from the window's start until the clip begins. */
  startsInSec: number
}

/**
 * What the scheduler reads off a clip. `durationSec` is only needed to tell
 * whether a clip is sounding at a position (`clipsSoundingAt`); one without
 * it is only ever started at its start. One with a `chance` sits some passes
 * out (`soundsOnPass`).
 */
export type WindowClip = Pick<Clip, 'id' | 'startSec'> &
  Partial<Pick<Clip, 'durationSec' | 'chance'>>

export interface ClipWindow {
  clips: readonly WindowClip[]
  playheadSec: number
  lookaheadSec: number
  iteration: number
  loopEnabled: boolean
  /** Length of one loop pass; only read when `loopEnabled`. */
  loopLengthSec: number
}

/**
 * Clip starts in `[playheadSec, playheadSec + lookaheadSec)`, plus the ones
 * reached by wrapping when the window runs past the loop end. Half-open, so
 * consecutive windows never return the same start twice.
 */
export function clipsInWindow({
  clips,
  playheadSec,
  lookaheadSec,
  iteration,
  loopEnabled,
  loopLengthSec,
}: ClipWindow): ScheduledClip[] {
  if (lookaheadSec <= 0) return []
  const scheduled: ScheduledClip[] = []
  const windowEnd = playheadSec + lookaheadSec

  for (const clip of clips) {
    if (clip.startSec >= playheadSec && clip.startSec < windowEnd) {
      scheduled.push({
        clipId: clip.id,
        iteration,
        startsInSec: clip.startSec - playheadSec,
      })
    }
  }

  const wrappedEnd = windowEnd - loopLengthSec
  if (loopEnabled && wrappedEnd > 0) {
    for (const clip of clips) {
      if (clip.startSec < wrappedEnd) {
        scheduled.push({
          clipId: clip.id,
          iteration: iteration + 1,
          startsInSec: loopLengthSec - playheadSec + clip.startSec,
        })
      }
    }
  }

  return scheduled.sort((a, b) => a.startsInSec - b.startsInSec)
}

/**
 * The clips already sounding at `positionSec`: begun before it and not yet
 * over. A clip that starts exactly there is not one of them (the window hands
 * it over), and a clip with no `durationSec` never is. In timeline order.
 */
export function clipsSoundingAt(clips: ClipWindow['clips'], positionSec: number): WindowClip[] {
  return clips
    .filter(
      (clip) =>
        clip.durationSec !== undefined &&
        clip.startSec < positionSec &&
        positionSec < clip.startSec + clip.durationSec,
    )
    .sort((a, b) => a.startSec - b.startSec)
}
