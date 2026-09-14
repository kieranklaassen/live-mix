// The Camelot wheel, shared by selection, crossfade choice and key matching
// (R21). Parity with Breathwork Live's musicResolver.ts (`camelotNumber`,
// `compatibleNumbers`) and Music::Selection (`compatible_camelot_numbers`),
// which both trace back to the tuin music selector: compatible = same wheel
// number or ±1, wrapping within 1–12, letter-agnostic; an unparseable code
// ("Unknown") is compatible with everything.

export type CamelotLetter = 'A' | 'B'

export interface CamelotKey {
  /** 1–12 around the wheel (a step = a perfect fifth). */
  number: number
  /** A = minor, B = major (relative keys share a number). */
  letter: CamelotLetter
}

/** Wheel number ("8A" → 8); null when unparseable ("Unknown"). */
export function camelotNumber(camelot: string): number | null {
  const digits = camelot.slice(0, -1)
  if (!/^\d+$/.test(digits)) return null
  const number = Number.parseInt(digits, 10)
  return number >= 1 && number <= 12 ? number : null
}

/** Parsed key, or null when the code is not `1–12` + `A|B`. */
export function parseCamelot(camelot: string): CamelotKey | null {
  const number = camelotNumber(camelot)
  if (number === null) return null
  const letter = camelot.slice(-1).toUpperCase()
  if (letter !== 'A' && letter !== 'B') return null
  return { number, letter }
}

export function formatCamelot(key: CamelotKey): string {
  return `${key.number}${key.letter}`
}

/**
 * The wheel numbers harmonically compatible with `camelot` (itself and its
 * neighbors, wrapping within 1–12); null means "compatible with everything".
 */
export function compatibleCamelotNumbers(camelot: string): number[] | null {
  const number = camelotNumber(camelot)
  if (number === null) return null
  return [((number - 2 + 12) % 12) + 1, number, (number % 12) + 1]
}

/** Shortest distance around the wheel between two numbers, 0–6. */
export function camelotDistance(a: number, b: number): number {
  const raw = Math.abs(a - b) % 12
  return Math.min(raw, 12 - raw)
}

export interface CamelotCompatibilityOptions {
  /**
   * How an unparseable *candidate* compares against a parseable anchor.
   * Breathwork Live's client treats unknown codes as compatible; its server
   * selector excludes them. Default 'compatible'.
   */
  unknownCandidate?: 'compatible' | 'incompatible'
}

/** Same number or a neighbor, letter-agnostic; unparseable anchor matches all. */
export function camelotCompatible(
  anchor: string,
  candidate: string,
  options: CamelotCompatibilityOptions = {},
): boolean {
  const numbers = compatibleCamelotNumbers(anchor)
  if (numbers === null) return true
  const number = camelotNumber(candidate)
  if (number === null) return (options.unknownCandidate ?? 'compatible') === 'compatible'
  return numbers.includes(number)
}

/**
 * The key `semitones` above (or below) `key`. One semitone moves the wheel by
 * seven steps (7 × 7 ≡ 1 mod 12): 8A (A minor) +1 → 3A (B♭ minor).
 */
export function transposeCamelot(key: CamelotKey, semitones: number): CamelotKey {
  const steps = (((Math.round(semitones) * 7) % 12) + 12) % 12
  return { number: ((key.number - 1 + steps) % 12) + 1, letter: key.letter }
}

/** Semitones from `from` to `to` along the shortest path (−6..6), letter-agnostic. */
export function semitonesBetween(from: CamelotKey, to: CamelotKey): number {
  // Inverse of the ×7 map is also ×7 (7 × 7 ≡ 1 mod 12).
  const steps = (((to.number - from.number) % 12) + 12) % 12
  const semitones = (steps * 7) % 12
  return semitones > 6 ? semitones - 12 : semitones
}
