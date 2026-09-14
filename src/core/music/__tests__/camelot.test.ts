import { describe, expect, it } from 'vitest'

import {
  camelotCompatible,
  camelotDistance,
  camelotNumber,
  compatibleCamelotNumbers,
  formatCamelot,
  parseCamelot,
  semitonesBetween,
  transposeCamelot,
} from '../camelot'
import { keyMatch, rankByKeyMatch } from '../keyMatch'

// The Breathwork Live client rule (musicResolver.ts `compatibleNumbers`) and
// the server rule (Music::Selection#compatible_camelot_numbers), both from
// the tuin selector: number ±1 wrapping within 1–12, letter-agnostic.
function referenceCompatibleNumbers(camelot: string): number[] | null {
  const digits = camelot.slice(0, -1)
  if (!/^\d+$/.test(digits)) return null
  const number = Number.parseInt(digits, 10)
  return [((number - 2 + 12) % 12) + 1, number, (number % 12) + 1]
}

describe('camelot wheel', () => {
  it('parses codes the way musicResolver.ts does', () => {
    expect(camelotNumber('8A')).toBe(8)
    expect(camelotNumber('12B')).toBe(12)
    expect(camelotNumber('Unknown')).toBeNull()
    expect(camelotNumber('')).toBeNull()
    expect(camelotNumber('13A')).toBeNull()
    expect(parseCamelot('8a')).toEqual({ number: 8, letter: 'A' })
    expect(parseCamelot('8C')).toBeNull()
    expect(formatCamelot({ number: 3, letter: 'B' })).toBe('3B')
  })

  it('matches the reference compatibility table for every code', () => {
    for (let n = 1; n <= 12; n += 1) {
      for (const letter of ['A', 'B']) {
        const code = `${n}${letter}`
        expect(compatibleCamelotNumbers(code)).toEqual(referenceCompatibleNumbers(code))
      }
    }
    expect(compatibleCamelotNumbers('Unknown')).toBeNull()
    expect(compatibleCamelotNumbers('1A')).toEqual([12, 1, 2])
    expect(compatibleCamelotNumbers('12B')).toEqual([11, 12, 1])
  })

  it('compatibility is letter-agnostic, wraps, and treats unknown anchors as open', () => {
    expect(camelotCompatible('8A', '8B')).toBe(true)
    expect(camelotCompatible('8A', '9A')).toBe(true)
    expect(camelotCompatible('8A', '7B')).toBe(true)
    expect(camelotCompatible('8A', '10A')).toBe(false)
    expect(camelotCompatible('12A', '1B')).toBe(true)
    expect(camelotCompatible('1A', '12B')).toBe(true)
    expect(camelotCompatible('Unknown', '3A')).toBe(true)
    // Client parity: an unknown candidate passes; server parity: it is excluded.
    expect(camelotCompatible('8A', 'Unknown')).toBe(true)
    expect(camelotCompatible('8A', 'Unknown', { unknownCandidate: 'incompatible' })).toBe(false)
  })

  it('measures wheel distance around the circle', () => {
    expect(camelotDistance(8, 8)).toBe(0)
    expect(camelotDistance(8, 9)).toBe(1)
    expect(camelotDistance(1, 12)).toBe(1)
    expect(camelotDistance(2, 8)).toBe(6)
    expect(camelotDistance(11, 5)).toBe(6)
  })

  it('transposes by semitones: a semitone is seven steps (8A → 3A), a fifth is one step', () => {
    expect(transposeCamelot({ number: 8, letter: 'A' }, 1)).toEqual({ number: 3, letter: 'A' })
    expect(transposeCamelot({ number: 8, letter: 'A' }, 7)).toEqual({ number: 9, letter: 'A' })
    expect(transposeCamelot({ number: 8, letter: 'A' }, -1)).toEqual({ number: 1, letter: 'A' })
    expect(transposeCamelot({ number: 8, letter: 'A' }, 12)).toEqual({ number: 8, letter: 'A' })
    expect(transposeCamelot({ number: 8, letter: 'B' }, 2)).toEqual({ number: 10, letter: 'B' })
    for (let n = 1; n <= 12; n += 1) {
      const key = { number: n, letter: 'A' as const }
      for (let s = -6; s <= 6; s += 1) {
        expect(semitonesBetween(key, transposeCamelot(key, s))).toBe(s === -6 ? 6 : s)
      }
    }
  })
})

describe('keyMatch', () => {
  it('needs no shift when already compatible', () => {
    expect(keyMatch('8A', '8B')).toEqual({
      semitones: 0,
      distance: 0,
      key: { number: 8, letter: 'B' },
    })
    expect(keyMatch('8A', '9A')).toEqual({
      semitones: 0,
      distance: 1,
      key: { number: 9, letter: 'A' },
    })
  })

  it('finds the smallest shift within the budget, exact over neighbor, down over up', () => {
    // 3A is a semitone above 8A: shift down one to land exactly on 8A.
    expect(keyMatch('8A', '3A')).toEqual({
      semitones: -1,
      distance: 0,
      key: { number: 8, letter: 'A' },
    })
    // 1A is a semitone below 8A: shift up one.
    expect(keyMatch('8A', '1A')?.semitones).toBe(1)
    // 10A is two steps (a whole tone) away: -2 semitones gives 8A exactly... wait, 10 → 8 is -2 steps
    // = -2 fifths = +2 semitones? Check both directions land compatible within budget.
    const tenA = keyMatch('8A', '10A')
    expect(tenA).not.toBeNull()
    expect(tenA?.distance).toBe(0)
    expect(Math.abs(tenA?.semitones ?? 99)).toBeLessThanOrEqual(3)
    expect(
      camelotDistance(
        8,
        transposeCamelot({ number: 10, letter: 'A' }, tenA?.semitones ?? 0).number,
      ),
    ).toBe(0)
  })

  it('respects the budget and the exact-only option', () => {
    // 2A (E♭ minor) is six fifths from 8A (A minor): an exact match takes six
    // semitones, but one semitone down is D minor (7A), a neighbor.
    expect(keyMatch('8A', '2A', { maxSemitones: 3 })).toEqual({
      semitones: -1,
      distance: 1,
      key: { number: 7, letter: 'A' },
    })
    expect(keyMatch('8A', '2A', { maxSemitones: 3, allowNeighbors: false })).toBeNull()
    // The smaller shift still wins with a bigger budget; exact-only needs the six.
    expect(keyMatch('8A', '2A', { maxSemitones: 6 })?.semitones).toBe(-1)
    expect(keyMatch('8A', '2A', { maxSemitones: 6, allowNeighbors: false })).toEqual({
      semitones: -6,
      distance: 0,
      key: { number: 8, letter: 'A' },
    })
    expect(keyMatch('8A', '2A', { maxSemitones: 0 })).toBeNull()
    expect(keyMatch('8A', '9A', { allowNeighbors: false })?.semitones).not.toBe(0)
    expect(keyMatch('8A', '9A', { allowNeighbors: false, maxSemitones: 0 })).toBeNull()
    expect(keyMatch('Unknown', '8A')).toBeNull()
    expect(keyMatch('8A', 'Unknown')).toBeNull()
  })

  it('ranks candidates: exact matches first, then smaller shifts, unmatched last', () => {
    const ranked = rankByKeyMatch(
      '8A',
      [
        { id: 'far', camelot: '2A' },
        { id: 'neighbor', camelot: '9A' },
        { id: 'shift', camelot: '3A' },
        { id: 'same', camelot: '8B' },
        { id: 'unknown', camelot: 'Unknown' },
      ],
      { maxSemitones: 1 },
    )
    expect(ranked.map((r) => r.candidate.id)).toEqual([
      'same',
      'shift',
      'neighbor',
      'far',
      'unknown',
    ])
    expect(ranked[3].match).toEqual({ semitones: -1, distance: 1, key: { number: 7, letter: 'A' } })
    expect(ranked[4].match).toBeNull()
  })
})
