// The intensity ladder and the steering resolver (R26), moved from Breathwork
// Live's musicResolver.ts (`targetIntensity`, `resolveReplacementTracks`) so
// selection, the agent API and any consumer share one ladder. Canon from the
// tuin selector: three intensities — 1 grounding, 2 settled, 3 active — and
// Camelot compatibility per `camelot.ts` (same number or ±1, letter-agnostic,
// applied only when it leaves at least one candidate). Everything here is
// pure and framework-free.

import { camelotNumber, compatibleCamelotNumbers, parseCamelot } from './camelot'

export const MIN_INTENSITY = 1
export const MAX_INTENSITY = 3

/** The ladder in order, lowest first. */
export const INTENSITY_LADDER: readonly number[] = [1, 2, 3]

/** Human labels for the ladder (the tuin section canon). */
export const INTENSITY_LABELS: Readonly<Record<number, string>> = {
  1: 'grounding',
  2: 'settled',
  3: 'active',
}

/** Intensity axis: calmer steps down (floor 1), stronger steps up (cap 3), change stays. */
export type IntensityDirection = 'calmer' | 'stronger' | 'change'

/** Tonal axis on the wheel: brighter prefers major and +1, darker minor and −1. */
export type TonalDirection = 'brighter' | 'darker'

/** What the agent may ask for; `more-intense` is `stronger` in the coach's words. */
export type SteerDirection = IntensityDirection | TonalDirection | 'more-intense'

export const STEER_DIRECTIONS: readonly SteerDirection[] = [
  'calmer',
  'stronger',
  'more-intense',
  'change',
  'brighter',
  'darker',
]

/** Any candidate a resolver can rank: a library track with its analysis. */
export interface IntensityTrack {
  id: number | string
  intensity: number
  camelot: string
  durationSec: number
}

export function clampIntensity(level: number): number {
  if (!Number.isFinite(level)) return MIN_INTENSITY
  return Math.min(MAX_INTENSITY, Math.max(MIN_INTENSITY, Math.round(level)))
}

/** The intensity a direction lands on from `current`. Tonal directions keep it. */
export function targetIntensity(current: number, direction: SteerDirection): number {
  const level = clampIntensity(current)
  switch (direction) {
    case 'calmer':
      return Math.max(MIN_INTENSITY, level - 1)
    case 'stronger':
    case 'more-intense':
      return Math.min(MAX_INTENSITY, level + 1)
    case 'change':
    case 'brighter':
    case 'darker':
      return level
    default: {
      const exhaustive: never = direction
      return exhaustive
    }
  }
}

/** The tonal preference a direction carries, if any. */
export function tonalPreference(direction: SteerDirection): TonalDirection | null {
  return direction === 'brighter' || direction === 'darker' ? direction : null
}

/**
 * Rank harmonic candidates for a tonal direction. Brighter prefers major (B)
 * and a clockwise step (+1, a fifth up — the DJ "energy boost"), then the
 * same number, then −1; darker prefers minor (A) and −1. Ties keep input
 * order. Candidates with unparseable keys rank last.
 */
export function rankTonal<T extends { camelot: string }>(
  anchor: string,
  candidates: readonly T[],
  direction: TonalDirection,
): T[] {
  const anchorNumber = camelotNumber(anchor)
  const score = (candidate: T): number => {
    const key = parseCamelot(candidate.camelot)
    if (!key) return 100
    const letterScore =
      direction === 'brighter' ? (key.letter === 'B' ? 0 : 1) : key.letter === 'A' ? 0 : 1
    if (anchorNumber === null) return letterScore
    const step = ((key.number - anchorNumber + 18) % 12) - 6
    const preferred = direction === 'brighter' ? 1 : -1
    const stepScore = step === preferred ? 0 : step === 0 ? 1 : step === -preferred ? 2 : 3
    return letterScore * 10 + stepScore
  }
  return candidates
    .map((candidate, index) => ({ candidate, index, score: score(candidate) }))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((entry) => entry.candidate)
}

export interface ResolveReplacementsOptions<T extends IntensityTrack> {
  /** Every track that may be picked (the library / manifest). */
  library: readonly T[]
  /** The currently playing track — the anchor for intensity and Camelot. */
  currentTrack: { intensity: number; camelot: string }
  /** Where to steer, or an explicit target intensity on the ladder. */
  direction?: SteerDirection
  targetIntensity?: number
  /** Track ids already played (or planned); never re-picked. */
  excludeIds?: readonly (number | string)[]
  /** Seconds left to fill; picks sum to at least this (always ≥ 1 pick). */
  remainingSeconds: number
  /**
   * Pick among the surviving candidates. Default: the tonal ranking's first
   * when a tonal direction is given, otherwise uniform via `random`.
   */
  chooser?: (candidates: T[]) => T
  /** Uniform random source for the default chooser. Default `Math.random`. */
  random?: () => number
}

/**
 * Ordered replacement tracks to fill `remainingSeconds`, greedily picked
 * until the summed durations reach it. Each pick anchors the next pick's
 * Camelot compatibility; the first anchors on the current track. Candidate
 * ladder per pick: target intensity + harmonic → any at target intensity →
 * adjacent intensities. Returns fewer tracks (possibly none) when the library
 * is exhausted. Parity with Breathwork Live's `resolveReplacementTracks`.
 */
export function resolveReplacementTracks<T extends IntensityTrack>(
  options: ResolveReplacementsOptions<T>,
): T[] {
  const { library, currentTrack, remainingSeconds } = options
  const direction = options.direction ?? 'change'
  const tonal = tonalPreference(direction)
  const random = options.random ?? Math.random
  const chooser =
    options.chooser ??
    ((candidates: T[]): T =>
      tonal ? candidates[0] : candidates[Math.floor(random() * candidates.length)])
  const used = new Set((options.excludeIds ?? []).map((id) => String(id)))
  const target =
    options.targetIntensity !== undefined
      ? clampIntensity(options.targetIntensity)
      : targetIntensity(currentTrack.intensity, direction)
  const adjacent = [target - 1, target + 1].filter(
    (level) => level >= MIN_INTENSITY && level <= MAX_INTENSITY,
  )

  const picks: T[] = []
  const goal = Math.max(remainingSeconds, 1)
  let covered = 0
  let anchorCamelot = currentTrack.camelot

  while (covered < goal) {
    let candidates = library.filter(
      (track) => track.intensity === target && !used.has(String(track.id)),
    )
    if (candidates.length === 0) {
      candidates = library.filter(
        (track) => adjacent.includes(track.intensity) && !used.has(String(track.id)),
      )
    }
    if (candidates.length === 0) break

    const valid = compatibleCamelotNumbers(anchorCamelot)
    if (valid) {
      const harmonic = candidates.filter((track) => {
        const number = camelotNumber(track.camelot)
        return number !== null && valid.includes(number)
      })
      if (harmonic.length > 0) candidates = harmonic
    }
    if (tonal) candidates = rankTonal(anchorCamelot, candidates, tonal)

    const pick = chooser(candidates)
    picks.push(pick)
    used.add(String(pick.id))
    covered += pick.durationSec
    anchorCamelot = pick.camelot
  }

  return picks
}
