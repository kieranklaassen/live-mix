// The tuner: each tuning's pitch for every key, in every root, and what it
// does with a key that already carries a fraction.

import { describe, expect, it } from 'vitest'

import {
  KEY_TUNINGS,
  KEY_TUNING_LABELS,
  KEY_TUNING_SCALES,
  type KeyTuning,
  tuneKey,
} from '../tuning'

const cents = (ratio: number): number => 1200 * Math.log2(ratio)
/** How far `upper` sits above `lower`, both fractional keys, in cents. */
const above = (upper: number, lower: number): number => (upper - lower) * 100

const JUST = [1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 9 / 5, 15 / 8]

describe('tuneKey', () => {
  it('lists the menu in order, each with a label', () => {
    expect(KEY_TUNINGS).toEqual([
      'equal',
      'by-ear',
      'just',
      'pythagorean',
      'meantone',
      'slendro',
      'pelog',
      'rast',
      'bayati',
    ])
    for (const tuning of KEY_TUNINGS) expect(KEY_TUNING_LABELS[tuning]).toMatch(/\S/)
  })

  it('leaves every key alone in Equal, whole or not', () => {
    for (let root = 0; root < 12; root += 1) {
      for (let key = 0; key < 128; key += 1) {
        expect(tuneKey(key, { tuning: 'equal', root })).toBe(key)
        expect(tuneKey(key + 0.3, { tuning: 'equal', root })).toBe(key + 0.3)
      }
    }
  })

  it('keeps the root where it is in every tuning, root and octave', () => {
    for (const tuning of KEY_TUNINGS) {
      for (let root = 0; root < 12; root += 1) {
        for (let key = root; key < 128; key += 12) {
          expect(tuneKey(key, { tuning, root })).toBeCloseTo(key, 9)
          expect(tuneKey(key, { tuning, root, chordRoot: (root + 2) % 12 })).toBeCloseTo(key, 9)
        }
      }
    }
  })

  it('makes Just a pure third on the root', () => {
    const e = tuneKey(64, { tuning: 'just', root: 0 })
    expect(Math.abs(above(e, 60) - cents(5 / 4))).toBeLessThan(0.1)
    // Equal's third is the one Just is there to fix.
    expect(
      Math.abs(above(tuneKey(64, { tuning: 'equal', root: 0 }), 60) - cents(5 / 4)),
    ).toBeGreaterThan(13)
  })

  it('builds Just on the piece root', () => {
    const cSharp = tuneKey(73, { tuning: 'just', root: 9 })
    expect(Math.abs(above(cSharp, 69) - cents(5 / 4))).toBeLessThan(0.1)
    for (let degree = 0; degree < 12; degree += 1) {
      expect(above(tuneKey(57 + degree, { tuning: 'just', root: 9 }), 57)).toBeCloseTo(
        cents(JUST[degree]),
        6,
      )
    }
  })

  it('stacks pure fifths in Pythagorean', () => {
    const context: KeyTuning = { tuning: 'pythagorean', root: 2 }
    for (let fifth = 1; fifth <= 6; fifth += 1) {
      const from = 50 + ((7 * (fifth - 1)) % 12)
      let to = 50 + ((7 * fifth) % 12)
      if (to < from) to += 12
      expect(
        Math.abs(above(tuneKey(to, context), tuneKey(from, context)) - cents(3 / 2)),
      ).toBeLessThan(0.1)
    }
  })

  it('makes the major third pure in Meantone', () => {
    const third = above(tuneKey(64, { tuning: 'meantone', root: 0 }), 60)
    expect(Math.abs(third - cents(5 / 4))).toBeLessThan(0.1)
  })

  it('lays Slendro on the pentatonic keys and snaps the rest to the nearest tone', () => {
    const context: KeyTuning = { tuning: 'slendro', root: 2 }
    expect(above(tuneKey(64, context), 62)).toBeCloseTo(231, 6)
    expect(above(tuneKey(66, context), 62)).toBeCloseTo(474, 6)
    expect(above(tuneKey(69, context), 62)).toBeCloseTo(717, 6)
    expect(above(tuneKey(71, context), 62)).toBeCloseTo(955, 6)
    // G# above D is 600: 474 is 126 away and 717 is 117, so it takes 717.
    expect(above(tuneKey(68, context), 62)).toBeCloseTo(717, 6)
    // E# (F above D, 300) sits between 231 and 474 and takes 231.
    expect(above(tuneKey(65, context), 62)).toBeCloseTo(231, 6)
    // C# (1100) is nearer the next D than 955.
    expect(above(tuneKey(73, context), 62)).toBeCloseTo(1200, 6)
    // D# (100) lies between 0 and 231 and goes down.
    expect(above(tuneKey(63, context), 62)).toBeCloseTo(0, 6)
  })

  it('lays Pelog on the minor keys and snaps C#', () => {
    const context: KeyTuning = { tuning: 'pelog', root: 0 }
    const expected = [0, 120, 258, 539, 675, 785, 943]
    ;[0, 2, 3, 5, 7, 8, 10].forEach((degree, index) => {
      expect(above(tuneKey(60 + degree, context), 60)).toBeCloseTo(expected[index], 6)
    })
    expect(above(tuneKey(61, context), 60)).toBeCloseTo(120, 6)
  })

  it('puts Rast third and seventh a quarter tone flat', () => {
    const context: KeyTuning = { tuning: 'rast', root: 0 }
    expect(above(tuneKey(64, context), 60)).toBeCloseTo(350, 6)
    expect(above(tuneKey(71, context), 60)).toBeCloseTo(1050, 6)
    expect(above(tuneKey(65, context), 60)).toBeCloseTo(500, 6)
    expect(above(tuneKey(67, context), 60)).toBeCloseTo(700, 6)
  })

  it('puts Bayati second a quarter tone flat', () => {
    expect(above(tuneKey(64, { tuning: 'bayati', root: 2 }), 62)).toBeCloseTo(150, 6)
    expect(above(tuneKey(65, { tuning: 'bayati', root: 2 }), 62)).toBeCloseTo(300, 6)
  })

  it('sounds like Just in By ear with no chord', () => {
    for (let root = 0; root < 12; root += 1) {
      for (let key = 36; key < 96; key += 1) {
        expect(tuneKey(key, { tuning: 'by-ear', root })).toBeCloseTo(
          tuneKey(key, { tuning: 'just', root }),
          9,
        )
        expect(tuneKey(key, { tuning: 'by-ear', root, chordRoot: root })).toBeCloseTo(
          tuneKey(key, { tuning: 'just', root }),
          9,
        )
      }
    }
  })

  it('tunes By ear pure above the chord root, which sits by Just on the piece root', () => {
    const overD: KeyTuning = { tuning: 'by-ear', root: 0, chordRoot: 2 }
    const d = tuneKey(62, overD)
    const a = tuneKey(69, overD)
    expect(above(d, 60)).toBeCloseTo(cents(9 / 8), 6)
    expect(above(a, d)).toBeCloseTo(cents(3 / 2), 6)
    // That A is 27/16 over C, a comma above Just's 5/3.
    expect(above(a, tuneKey(69, { tuning: 'just', root: 0 }))).toBeCloseTo(cents(81 / 80), 6)
    // F under the D chord is its minor third, and it lies below the octave's root key.
    expect(above(tuneKey(65, overD), d)).toBeCloseTo(cents(6 / 5), 6)

    const overA: KeyTuning = { tuning: 'by-ear', root: 0, chordRoot: 9 }
    const lowA = tuneKey(57, overA)
    expect(above(lowA, 48)).toBeCloseTo(cents(5 / 3), 6)
    expect(above(tuneKey(64, overA), lowA)).toBeCloseTo(cents(3 / 2), 6)
  })

  it('never moves the piece root in By ear, whatever the chord', () => {
    for (const chordRoot of [2, 10, 5, 7]) {
      for (let key = 0; key < 128; key += 12) {
        expect(tuneKey(key, { tuning: 'by-ear', root: 0, chordRoot })).toBe(key)
      }
    }
  })

  it("keeps a note's own offset over 2.5 cents and drops a smaller one", () => {
    const just: KeyTuning = { tuning: 'just', root: 0 }
    const e = tuneKey(64, just)
    expect(tuneKey(64.05, just)).toBeCloseTo(e + 0.05, 9)
    expect(tuneKey(63.97, just)).toBeCloseTo(e - 0.03, 9)
    // The generated drones' pure fifth and the whole-cycles nudge are Equal's
    // own corrections: the tuning places those notes itself.
    expect(tuneKey(67.0196, just)).toBeCloseTo(tuneKey(67, just), 9)
    expect(tuneKey(64.015, just)).toBeCloseTo(e, 9)
  })

  it('names the scale a gamelan or maqam tuning sets', () => {
    expect(KEY_TUNING_SCALES).toEqual({
      slendro: 'major-pentatonic',
      pelog: 'minor',
      rast: 'major',
      bayati: 'minor',
    })
  })
})
