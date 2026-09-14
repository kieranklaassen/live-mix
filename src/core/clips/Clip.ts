// The seconds-first clip record shared by the arrangement, the scheduler and
// the track that plays it. A clip is a slice of a decoded source placed on the
// timeline: `startSec` is where it sits, `offsetSec` where playback enters the
// source, `durationSec` the audible length (not the source length).

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
   * Warp markers (source second → beat from the clip start) for tempo-synced
   * playback on a stretch source; absent means the clip plays unwarped.
   */
  warp?: readonly { sourceSec: number; beat: number }[]
  /** Pitch shift in semitones on a stretch source (key matching). */
  semitones?: number
}
