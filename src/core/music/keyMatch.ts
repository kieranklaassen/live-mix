// Key matching by pitch shift (R20/R21): the smallest semitone shift within a
// budget that brings a track's Camelot key into compatibility (same number or
// a neighbor) with an anchor. Smaller shifts beat larger ones (a semitone to a
// neighbor beats a tritone to the exact key); at equal magnitude an exact
// match beats a neighbor and shifting down beats shifting up.

import { camelotDistance, parseCamelot, transposeCamelot, type CamelotKey } from './camelot'

export interface KeyMatchOptions {
  /** Largest |shift| allowed, in semitones. Default 3. */
  maxSemitones?: number
  /** Accept neighbors (distance 1) or exact matches only. Default true. */
  allowNeighbors?: boolean
}

export interface KeyMatch {
  /** Semitones to shift the candidate by. */
  semitones: number
  /** Wheel distance after the shift: 0 exact, 1 neighbor. */
  distance: number
  /** The candidate's key after the shift. */
  key: CamelotKey
}

export const DEFAULT_MAX_SEMITONES = 3

/**
 * How to shift `candidate` so it sits with `anchor`, or null when no shift
 * within the budget works (or either code is unparseable — then no shift is
 * needed or possible; treat as compatible per `camelotCompatible`).
 */
export function keyMatch(
  anchor: string,
  candidate: string,
  options: KeyMatchOptions = {},
): KeyMatch | null {
  const anchorKey = parseCamelot(anchor)
  const candidateKey = parseCamelot(candidate)
  if (!anchorKey || !candidateKey) return null
  const maxSemitones = Math.max(0, Math.floor(options.maxSemitones ?? DEFAULT_MAX_SEMITONES))
  const allowNeighbors = options.allowNeighbors ?? true

  let best: KeyMatch | null = null
  for (let magnitude = 0; magnitude <= maxSemitones; magnitude += 1) {
    for (const semitones of magnitude === 0 ? [0] : [-magnitude, magnitude]) {
      const key = transposeCamelot(candidateKey, semitones)
      const distance = camelotDistance(anchorKey.number, key.number)
      if (distance > (allowNeighbors ? 1 : 0)) continue
      const match: KeyMatch = { semitones, distance, key }
      if (!best || distance < best.distance) best = match
      if (best.distance === 0) return best
    }
    if (best) return best
  }
  return best
}

/** Rank candidates by key-match quality: exact before neighbor, small shifts before large. */
export function rankByKeyMatch<T extends { camelot: string }>(
  anchor: string,
  candidates: readonly T[],
  options: KeyMatchOptions = {},
): { candidate: T; match: KeyMatch | null }[] {
  return candidates
    .map((candidate) => ({ candidate, match: keyMatch(anchor, candidate.camelot, options) }))
    .sort((a, b) => {
      if (!a.match && !b.match) return 0
      if (!a.match) return 1
      if (!b.match) return -1
      return (
        a.match.distance - b.match.distance ||
        Math.abs(a.match.semitones) - Math.abs(b.match.semitones) ||
        a.match.semitones - b.match.semitones
      )
    })
}
