// Verbatim copies of the ambient-live functions this unit ports, kept as the
// reference the parity tests compare against. Source: kieranklaassen/ambient-live
// @ 1d3b31b9c2e397cb668c650ba66a661f228327a9. Only the imports were inlined;
// the bodies are untouched. Do not "fix" anything here — if the port and the
// original disagree, the port is what needs looking at.

// --- app/frontend/pages/live/timeline-model.ts:1,25-29,73-79 -----------------

export const LOOP_LENGTH_SEC = 32

export function clampTime(sec: number, loopLengthSec: number): number {
  if (loopLengthSec <= 0) return 0
  const wrapped = sec % loopLengthSec
  return wrapped < 0 ? wrapped + loopLengthSec : wrapped
}

export function advancePlayhead(
  playheadSec: number,
  deltaSec: number,
  loopLengthSec: number = LOOP_LENGTH_SEC,
): number {
  return clampTime(playheadSec + deltaSec, loopLengthSec)
}

// --- app/frontend/pages/live/use-clip-transport.ts:14-67 ---------------------

export interface TransportAnchor {
  /** Audio-clock time the transport was pinned at. */
  contextTime: number
  /** Playhead position at that moment. */
  playheadSec: number
  /** Loop pass the anchor started on. */
  iteration: number
}

/** A clip start already handed to the player. */
export interface ScheduledStart {
  clipId: string
  /** Loop pass the start belongs to. */
  iteration: number
  /** Where on the timeline the clip stood when it was scheduled. */
  startSec: number
}

/**
 * Dedupe key for a clip start. The timeline position is part of it, so moving
 * a clip schedules its new position even within the same loop pass.
 */
export function scheduleKey(start: ScheduledStart): string {
  return `${start.clipId}:${start.iteration}:${start.startSec.toFixed(3)}`
}

export interface TransportPosition {
  playheadSec: number
  iteration: number
  /** True when the loop is off and the playhead has run off the end. */
  finished: boolean
}

/** Where the playhead is now, derived from the audio clock rather than accumulated frames. */
export function positionFromAnchor(
  anchor: TransportAnchor,
  contextTime: number,
  loopEnabled: boolean,
): TransportPosition {
  const raw = anchor.playheadSec + (contextTime - anchor.contextTime)
  if (!loopEnabled) {
    return {
      playheadSec: Math.min(raw, LOOP_LENGTH_SEC),
      iteration: anchor.iteration,
      finished: raw >= LOOP_LENGTH_SEC,
    }
  }
  const passes = Math.floor(raw / LOOP_LENGTH_SEC)
  return {
    playheadSec: raw - passes * LOOP_LENGTH_SEC,
    iteration: anchor.iteration + passes,
    finished: false,
  }
}

// --- app/frontend/pages/live/clip-schedule.ts:1-64 ---------------------------

export interface ScheduledClip {
  clipId: string
  /** Loop pass this start belongs to — the key that stops a clip firing twice. */
  iteration: number
  /** Seconds from the window's start until the clip begins. */
  startsInSec: number
}

export interface ClipWindow {
  clips: readonly { id: string; startSec: number }[]
  playheadSec: number
  lookaheadSec: number
  iteration: number
  loopEnabled: boolean
  loopLengthSec?: number
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
  loopLengthSec = LOOP_LENGTH_SEC,
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

// --- app/frontend/lib/breathwork/musicEngine.ts (breathwork-live @ ebdd457) --
//
// Not copied: `MusicEngine` is a class bound to its selection model. What the
// scheduler parity test needs is its handoff rule, distilled from
// `tickAsync` (:722-745) — an entry is handed to the graph on the first tick
// where `startAt - now <= SCHEDULE_LOOKAHEAD_SECONDS`, and never again.

export const SCHEDULER_TICK_MS = 100
export const SCHEDULE_LOOKAHEAD_SECONDS = 5

export interface ReferenceEntry {
  id: string
  startAt: number
  scheduled: boolean
}

/** One `MusicEngine.tickAsync` pass over the handoff rule; returns the ids handed over this tick. */
export function musicEngineTick(entries: ReferenceEntry[], now: number): string[] {
  const handed: string[] = []
  for (const entry of entries) {
    if (entry.scheduled) continue
    if (entry.startAt - now <= SCHEDULE_LOOKAHEAD_SECONDS) {
      entry.scheduled = true
      handed.push(entry.id)
    }
  }
  return handed
}
