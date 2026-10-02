// The seconds-first clip record shared by the arrangement, the scheduler and
// the track that plays it. A clip is a slice of a decoded source placed on the
// timeline: `startSec` is where it sits, `offsetSec` where playback enters the
// source, `durationSec` the audible length (not the source length).

import { type JsonObject } from '../json'

/**
 * Shape of a clip's fade-in and fade-out gain envelope.
 *
 * `linear` is ambient-live's triangle (`fadeGain`); `equalPower` is Breathwork
 * Live's sin/cos crossfade (`equalPowerFadeIn` / `equalPowerFadeOut`), which
 * keeps the summed loudness flat while two clips overlap.
 */
export type FadeCurve = 'linear' | 'equalPower'

export interface Clip {
  id: string
  /** Key of the decoded source in the `SampleStore`. */
  sourceId: string
  /** Timeline position in seconds. */
  startSec: number
  /** Seconds into the source where playback enters. */
  offsetSec: number
  /** Audible length in seconds. */
  durationSec: number
  fadeInSec: number
  fadeOutSec: number
  fadeCurve: FadeCurve
  /** Per-clip loudness trim in dB; the track clamps it. */
  gainDb: number
  /** Loop the source when the clip outlives it. */
  loop?: boolean
  /**
   * Source region a looping clip cycles over, in source seconds; `offsetSec`
   * may sit anywhere inside it (a legato launch enters mid-region). Default:
   * from `offsetSec` to the end of the source.
   */
  loopStartSec?: number
  loopEndSec?: number
  /**
   * Warp markers (source second → beat from the clip start) for tempo-synced
   * playback on a stretch source; absent means the clip plays unwarped.
   */
  warp?: readonly { sourceSec: number; beat: number }[]
  /** Pitch shift in semitones on a stretch source (key matching). */
  semitones?: number
  /**
   * A muted clip keeps its place on the track and is never started: the
   * arrangement's "deactivate clip". Muting one that is sounding stops it.
   */
  muted?: boolean
  /**
   * Play the clip's slice of the source backwards: one pass reads from the
   * far end of the slice back to `offsetSec`, and a looping clip cycles
   * backwards over its region (`mirrorSlice`). Audio tracks only; a stretch
   * or element source plays the clip forwards.
   */
  reversed?: boolean
  /**
   * How likely the clip is to sound each time its start comes round, 0 to 1:
   * the scheduler draws once per counted pass of the transport, from its
   * seed, the clip's id and the pass (`soundsOnPass`), so the passes a clip
   * sits out are the same every time the piece is played with that seed.
   * Absent, and 1, play it on every pass.
   */
  chance?: number
  /**
   * Where this clip sits between left (−1) and right (1), ahead of the
   * track's own pan. A clip with `pan`, `lowpassHz` or `spaceDb` is placed:
   * it plays through nodes of its own, so clips sharing a track can sit in
   * different places at once, and a change to any of the three (or to
   * `gainDb`) is heard while the clip sounds. Audio tracks only.
   */
  pan?: number
  /** Cutoff of a low-pass on this clip alone, in Hz: lower is duller, further off. */
  lowpassHz?: number
  /**
   * How much of this clip goes into the track's space (a long dark room
   * ahead of the track's inserts), in dB against the clip's own level after
   * `gainDb`. At −60 and below, and when absent, it sends nothing.
   */
  spaceDb?: number
  /**
   * Annotations the host application keeps with the clip (where a paint
   * field draws it, what it was painted with). Plain JSON: the library
   * carries it through the score and its operations and never reads it.
   */
  meta?: JsonObject
}

/** True for a clip the scheduler may start. */
export function isAudibleClip(clip: Pick<Clip, 'muted'>): boolean {
  return clip.muted !== true
}
