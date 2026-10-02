// Seeded chance: every draw is a pure function of a seed and what it is
// drawn for, never of when it was asked or how often. So a piece that leaves
// something to chance plays the same way every time it is started with the
// same seed, a bounce hears what a live pass heard, and a pass can be gone
// back to without playing the ones before it.

import { type Clip } from './Clip'

/** Seeds are whole numbers a `Uint32` holds; anything else is brought there. */
export function normaliseSeed(seed: number): number {
  return Number.isFinite(seed) ? Math.floor(seed) >>> 0 : 0
}

// MurmurHash3's 32-bit finaliser: every input bit reaches every output bit.
function mix(h: number): number {
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return (h ^ (h >>> 16)) >>> 0
}

function hash(seed: number, parts: readonly (string | number)[]): number {
  let h = mix(normaliseSeed(seed) ^ 0x9e3779b9)
  for (const part of parts) {
    // A number and the string that spells it are different parts.
    const text = typeof part === 'number' ? `#${part}` : `$${part}`
    for (let i = 0; i < text.length; i += 1) {
      h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0
    }
    // Closes the part, so ('ab', 'c') and ('a', 'bc') differ.
    h = mix(h ^ text.length)
  }
  return h
}

/**
 * One draw in [0, 1) for `seed` and what the draw is for, named by `parts`
 * (a clip and a pass, say). The same seed and parts always give the same
 * number; any other seed or part gives an unrelated one.
 */
export function seededUnit(seed: number, ...parts: readonly (string | number)[]): number {
  return hash(seed, parts) / 4294967296
}

/**
 * A stream of draws in [0, 1) for `seed` and `parts`, for a decision that
 * takes more than one (mulberry32). Each call to this function starts the
 * same stream again from its first draw.
 */
export function seededRandom(seed: number, ...parts: readonly (string | number)[]): () => number {
  let state = hash(seed, parts)
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A clip's `chance` as the scheduler reads it: absent is 1, and it stays within 0 and 1. */
export function clipChance(clip: Pick<Clip, 'chance'>): number {
  const chance = clip.chance
  if (chance === undefined || Number.isNaN(chance)) return 1
  return Math.min(1, Math.max(0, chance))
}

/**
 * Whether a clip sounds on counted pass `pass` of a piece with `seed`: always
 * for a clip without a `chance`, else by a draw for that clip on that pass.
 * Over many passes a clip with a chance of 2/3 sounds on about two in three,
 * and which ones they are is fixed by the seed.
 */
export function soundsOnPass(
  clip: Pick<Clip, 'id' | 'chance'>,
  pass: number,
  seed: number,
): boolean {
  const chance = clipChance(clip)
  if (chance >= 1) return true
  if (chance <= 0) return false
  return seededUnit(seed, 'clip', clip.id, pass) < chance
}
