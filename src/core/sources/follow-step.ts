// How a media element follows a clock it is not the master of: a video
// element under a picture that follows the audio clock, for one. The engine
// runs on the audio context's clock and is never steered from an element, so
// the element is brought to the clock, once per frame, by this rule:
//
// - Paused, it seeks to the exact time. While a seek is under way nothing more
//   is asked of it: the next frame asks again with the newest time, so a scrub
//   never queues seeks and never waits on a decode.
// - Playing, it plays by itself with its rate nudged toward the clock. Further
//   off than a nudge can close, as at a cut, it seeks.
//
// Pure: the host reads the element, asks for the step, and applies it. A host
// that seeks while playing aims ahead by what its last seek took, at most
// `FOLLOW_MAX_SEEK_LEAD`, because the clock does not wait for a seek.

/** Paused, an element this close to the wanted time is on the wanted frame: half a frame at 120 Hz. */
export const FOLLOW_SEEK_TOLERANCE = 1 / 240
/** Playing, an element further off than this seeks instead of being nudged, in seconds. */
export const FOLLOW_DRIFT_SEEK = 0.25
/** The furthest ahead a seek while playing aims, in seconds, however slow the last one was. */
export const FOLLOW_MAX_SEEK_LEAD = 0.5
/** How hard the rate leans against the drift, and how far it may go from the wanted rate. */
const NUDGE_GAIN = 2
const NUDGE_LIMIT = 0.5

/** Where a media element is: what `HTMLMediaElement` reports. */
export interface FollowingElement {
  currentTime: number
  seeking: boolean
}

/** Where the clock says the element should be. */
export interface FollowTarget {
  /** Seconds into the media. */
  mediaTime: number
  /** How fast the media should run while playing. */
  rate: number
}

export interface FollowStep {
  /** The time to seek to, or null to leave the element's time alone. */
  seekTo: number | null
  /** The rate the element should run at. */
  playbackRate: number
}

/**
 * What to ask of one element this frame, given where it is and where it
 * should be. Never a seek while one is under way.
 */
export function followStep(
  element: FollowingElement,
  target: FollowTarget,
  playing: boolean,
): FollowStep {
  const drift = element.currentTime - target.mediaTime
  if (!playing) {
    const off = !element.seeking && Math.abs(drift) > FOLLOW_SEEK_TOLERANCE
    return { seekTo: off ? target.mediaTime : null, playbackRate: target.rate }
  }
  if (Math.abs(drift) > FOLLOW_DRIFT_SEEK) {
    return { seekTo: element.seeking ? null : target.mediaTime, playbackRate: target.rate }
  }
  const lean = Math.min(Math.max(-drift * NUDGE_GAIN, -NUDGE_LIMIT), NUDGE_LIMIT)
  return { seekTo: null, playbackRate: target.rate * (1 + lean) }
}
