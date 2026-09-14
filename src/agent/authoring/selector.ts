// The tuin music selector (`.claude/skills/breathwork/scripts/music_selector.py`,
// `select_songs_for_session`), ported behaviour for behaviour: three sections
// filled greedily to a third of the session each, intensity targets per
// section and position (grounding 1 then 2, active always 3, integration 2
// after a 3 else 1), fallbacks to the neighbouring intensities, no repeats,
// and Camelot filtering (same number or ±1, letter-agnostic) applied only when
// it leaves a candidate. `random.choice` is replaced by an injectable chooser;
// `pythonChooser(seed)` reproduces CPython's picks so the parity goldens
// recorded from the Python hold exactly. Quirks are kept on purpose
// (integer division, the "Unknown" sentinel) — this is the canon the
// Breathwork Live server selector also mirrors.

import { camelotNumber, compatibleCamelotNumbers } from '../../core/music/camelot'
import { type IntensityTrack } from '../../core/music/intensity'
import { PythonRandom } from './pythonRandom'

/** Section numbers of the tuin canon. */
export type SectionNumber = 1 | 2 | 3

/** Picks one of the surviving candidates (`random.choice` in the original). */
export type TrackChooser<T> = (candidates: readonly T[]) => T

export interface SectionSelection<T> {
  tracks: T[]
  /** Summed track durations (the section's music length in the pipeline). */
  totalDurationSec: number
}

export interface SessionSelection<T> {
  sections: [SectionSelection<T>, SectionSelection<T>, SectionSelection<T>]
  /** Every picked id, as strings. */
  usedIds: Set<string>
  /** `minimumTotalSec // 3`: what each section was filled to. */
  sectionTargetSec: number
}

/** The tuin sentinel for a track whose key analysis failed. */
export const UNKNOWN_CAMELOT = 'Unknown'

/** Assumed track length when estimating how many tracks a section needs. */
export const AVERAGE_TRACK_SECONDS = 180

export interface SelectNextOptions<T> {
  previous?: T
  /** Ids already picked (strings); updated by the section and session selectors. */
  used?: ReadonlySet<string>
  /** 0-based position of the pick within its section. */
  trackIndex?: number
  /** How many tracks the section is expected to need. */
  expectedTrackCount?: number
  chooser: TrackChooser<T>
}

/** `random.choice` as CPython computes it for `random.seed(seed)`. */
export function pythonChooser<T>(seed: number | bigint = 0): TrackChooser<T> {
  const random = new PythonRandom(seed)
  return (candidates) => random.choice(candidates)
}

/**
 * The intensity a pick targets: section 1 stays at 1 for the first half of
 * the expected picks (at least one) then 2; section 2 is always 3; section 3
 * is 2 right after a 3, else 1.
 */
export function sectionTargetIntensity(
  section: SectionNumber,
  trackIndex: number,
  expectedTrackCount: number,
  previous?: IntensityTrack,
): number {
  switch (section) {
    case 1: {
      const calmThreshold = Math.max(1, Math.floor(expectedTrackCount / 2))
      return trackIndex < calmThreshold ? 1 : 2
    }
    case 2:
      return 3
    case 3:
      return previous?.intensity === 3 ? 2 : 1
    default: {
      const exhaustive: never = section
      return exhaustive
    }
  }
}

/** The intensities a section falls back to when its target has no unused track. */
export function fallbackIntensities(section: SectionNumber): readonly number[] {
  return section === 2 ? [2, 3] : [1, 2]
}

/** `select_next_song`: one pick, or null when the library has nothing left for the section. */
export function selectNextTrack<T extends IntensityTrack>(
  section: SectionNumber,
  library: readonly T[],
  options: SelectNextOptions<T>,
): T | null {
  const used = options.used ?? new Set<string>()
  const trackIndex = options.trackIndex ?? 0
  const expected = options.expectedTrackCount ?? 4
  const intensity = sectionTargetIntensity(section, trackIndex, expected, options.previous)

  let candidates = library.filter(
    (track) => track.intensity === intensity && !used.has(String(track.id)),
  )
  if (candidates.length === 0) {
    const fallback = fallbackIntensities(section)
    candidates = library.filter(
      (track) => fallback.includes(track.intensity) && !used.has(String(track.id)),
    )
  }
  if (candidates.length === 0) return null

  const previous = options.previous
  if (previous && previous.camelot !== UNKNOWN_CAMELOT) {
    // `get_compatible_camelot_codes` returns every number for an unparseable code.
    const valid = compatibleCamelotNumbers(previous.camelot) ?? ALL_NUMBERS
    const harmonic = candidates.filter((track) => {
      if (track.camelot === UNKNOWN_CAMELOT) return false
      const number = camelotNumber(track.camelot)
      return number !== null && valid.includes(number)
    })
    if (harmonic.length > 0) candidates = harmonic
  }
  return options.chooser(candidates)
}

const ALL_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export interface SelectSectionOptions<T> {
  previous?: T
  /** Mutated: every pick's id is added. */
  used?: Set<string>
  chooser: TrackChooser<T>
}

/** `select_songs_for_section`: picks until the summed durations reach `minimumDurationSec`. */
export function selectTracksForSection<T extends IntensityTrack>(
  minimumDurationSec: number,
  section: SectionNumber,
  library: readonly T[],
  options: SelectSectionOptions<T>,
): SectionSelection<T> {
  const used = options.used ?? new Set<string>()
  const expectedTrackCount = Math.max(2, Math.floor(minimumDurationSec / AVERAGE_TRACK_SECONDS))
  const tracks: T[] = []
  let total = 0
  let previous = options.previous
  let trackIndex = 0
  while (total < minimumDurationSec) {
    const pick = selectNextTrack(section, library, {
      previous,
      used,
      trackIndex,
      expectedTrackCount,
      chooser: options.chooser,
    })
    if (!pick) break
    tracks.push(pick)
    used.add(String(pick.id))
    total += pick.durationSec
    previous = pick
    trackIndex += 1
  }
  return { tracks, totalDurationSec: total }
}

export interface SelectSessionOptions<T> {
  /** CPython-compatible seed for the default chooser. Default 0. */
  seed?: number | bigint
  /** Replaces the seeded chooser (a tonal ranking, a test stub, …). */
  chooser?: TrackChooser<T>
}

/**
 * `select_songs_for_session`: grounding, active and integration, each filled
 * to a third of `minimumTotalSec`, the last pick of a section anchoring the
 * next section's harmony, never repeating a track across the session.
 */
export function selectTracksForSession<T extends IntensityTrack>(
  minimumTotalSec: number,
  library: readonly T[],
  options: SelectSessionOptions<T> = {},
): SessionSelection<T> {
  const chooser = options.chooser ?? pythonChooser<T>(options.seed ?? 0)
  const sectionTargetSec = Math.floor(minimumTotalSec / 3)
  const used = new Set<string>()
  const grounding = selectTracksForSection(sectionTargetSec, 1, library, { chooser, used })
  const active = selectTracksForSection(sectionTargetSec, 2, library, {
    previous: grounding.tracks[grounding.tracks.length - 1],
    chooser,
    used,
  })
  const integration = selectTracksForSection(sectionTargetSec, 3, library, {
    previous: active.tracks[active.tracks.length - 1],
    chooser,
    used,
  })
  return { sections: [grounding, active, integration], usedIds: used, sectionTargetSec }
}
