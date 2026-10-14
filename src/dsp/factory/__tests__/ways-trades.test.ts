// Trades: notes of a phrase that change places. Neighbours swap walks the
// notes through each other a pair at a time; Home and away turns the phrase
// upside down within its own chord every fourth turn. Both deal pitches only,
// so the rhythm, the lengths and the touch of the phrase are as written.

import { describe, expect, it } from 'vitest'

import { FACTORY_SOUNDS } from '..'
import { cycled, looped, played } from '../sounds/recipe'
import { type FactorySound } from '../types'
import { playSound, wayTakes, waysFor } from '../ways'
import { readSound } from '../ways/reading'
import { bankProblems } from './ways-support'

const TRADES = ['neighbours-swap', 'home-and-away']

const chord = looped(16, 4, 2, [48, 55, 64, 71])
const round = cycled(8, [
  [0, 1, 48],
  [1, 1, 60],
  [2, 1, 64],
  [3, 1, 67],
  [4, 1, 72],
  [5, 1, 76],
  [6, 1, 79],
  [7, 0.5, 84],
])
const four = played(8, [
  [0, 1, 48],
  [1, 1, 55],
  [2, 1, 60],
  [3, 1, 64],
  [4, 1, 55],
  [5, 1, 60],
])

// The note it stands on comes third: its first note is one a trade deals.
const late = cycled(8, [
  [0, 1, 60],
  [1, 1, 64],
  [2, 1, 48],
  [3, 1, 67],
  [4, 1, 72],
  [5, 1, 76],
])

/** The pitches of take `take`, one pass of them, in time order. */
const pitches = (
  sound: Pick<FactorySound, 'phrase' | 'durationSec'>,
  way: string,
  take: number,
  far?: number,
): number[] =>
  readSound(playSound(sound, { way, seed: 1, far, take }))
    .moments.flatMap((moment) => moment.notes)
    .map((note) => note.note)

const sorted = (notes: readonly number[]): number[] => [...notes].sort((a, b) => a - b)

describe('neighbours swap', () => {
  it('swaps one set of neighbouring pairs, then the other, each turn on from the last', () => {
    // 48 is the first note and the note the phrase stands on: the seven after it are dealt.
    expect(pitches(round, 'neighbours-swap', 0)).toEqual([48, 60, 64, 67, 72, 76, 79, 84])
    expect(pitches(round, 'neighbours-swap', 1)).toEqual([48, 64, 60, 72, 67, 79, 76, 84])
    expect(pitches(round, 'neighbours-swap', 2)).toEqual([48, 64, 72, 60, 79, 67, 84, 76])
    expect(pitches(four, 'neighbours-swap', 1)).toEqual([48, 60, 55, 55, 64, 60])
    // A phrase that starts on a note it deals: that note is in no pair.
    expect(pitches(late, 'neighbours-swap', 1)).toEqual([60, 67, 48, 64, 76, 72])
    expect(pitches(late, 'neighbours-swap', 2)).toEqual([60, 67, 48, 76, 64, 72])
  })

  it('keeps the first note in place, changes a pair or more each turn, and plays the written pitches exactly', () => {
    for (const each of [round, four, late]) {
      const written = pitches(each, 'neighbours-swap', 0)
      const { takes, round: turns } = wayTakes(each, { way: 'neighbours-swap', seed: 1 })
      expect(takes).toBeGreaterThanOrEqual(2)
      for (let take = 0; take < takes; take += 1) {
        const now = pitches(each, 'neighbours-swap', take)
        expect(now[0], `take ${take}`).toBe(written[0])
        expect(sorted(now), `take ${take}`).toEqual(sorted(written))
      }
      // Where no two neighbours are the same note, every turn is another order than the one before.
      if (each !== round) continue
      turns.forEach((take, turn) => {
        const last = turns[(turn + turns.length - 1) % turns.length]
        const before = pitches(each, 'neighbours-swap', last)
        const now = pitches(each, 'neighbours-swap', take)
        const changed = now.filter((note, index) => note !== before[index]).length
        expect(changed, `turn ${turn}`).toBeGreaterThanOrEqual(2)
      })
    }
  })

  it('comes home after the number of turns far names, four to eight', () => {
    expect(wayTakes(round, { way: 'neighbours-swap', seed: 1, far: 0 }).round).toEqual([0, 1, 2, 3])
    expect(wayTakes(round, { way: 'neighbours-swap', seed: 1 }).round).toEqual([0, 1, 2, 3, 4, 5])
    expect(wayTakes(round, { way: 'neighbours-swap', seed: 1, far: 1 })).toEqual({
      takes: 8,
      round: [0, 1, 2, 3, 4, 5, 6, 7],
      cut: false,
    })
    // It draws nothing: the same takes at every seed.
    expect(pitches(round, 'neighbours-swap', 3)).toEqual(
      readSound(playSound(round, { way: 'neighbours-swap', seed: 99, take: 3 }))
        .moments.flatMap((moment) => moment.notes)
        .map((note) => note.note),
    )
  })
})

describe('home and away', () => {
  it('plays three turns as written and the fourth upside down within its own chord', () => {
    expect(wayTakes(round, { way: 'home-and-away', seed: 1 })).toEqual({
      takes: 2,
      round: [0, 0, 0, 1],
      cut: false,
    })
    expect(pitches(round, 'home-and-away', 0)).toEqual([48, 60, 64, 67, 72, 76, 79, 84])
    // The seven notes above the standing note, bottom for top; the middle one is its own.
    expect(pitches(round, 'home-and-away', 1)).toEqual([48, 84, 79, 76, 72, 67, 64, 60])
    expect(pitches(four, 'home-and-away', 1)).toEqual([48, 64, 60, 55, 64, 60])
  })

  it('uses the same set of pitches away as at home', () => {
    for (const each of [round, four]) {
      const home = new Set(pitches(each, 'home-and-away', 0))
      const away = new Set(pitches(each, 'home-and-away', 1))
      expect(sorted([...away])).toEqual(sorted([...home]))
    }
  })

  it('is at home one turn in two past half of far', () => {
    expect(wayTakes(round, { way: 'home-and-away', seed: 1, far: 0.5 }).round).toEqual([0, 0, 0, 1])
    expect(wayTakes(round, { way: 'home-and-away', seed: 1, far: 1 }).round).toEqual([0, 1])
  })
})

describe('trades', () => {
  it('have nothing to play on a held chord or on a kit', () => {
    const kit = FACTORY_SOUNDS.find((each) => each.kit && each.phrase.notes.length > 8)
    expect(kit).toBeDefined()
    if (!kit) return
    for (const way of TRADES) {
      expect(wayTakes(chord, { way, seed: 1 }), way).toMatchObject({
        takes: 0,
        refusal: 'Needs a phrase.',
      })
      expect(wayTakes(kit, { way, seed: 1 }), way).toMatchObject({
        takes: 0,
        refusal: 'Its keys are not notes.',
      })
      expect(waysFor(chord)).not.toContain(way)
      expect(waysFor(kit)).not.toContain(way)
    }
    // Three single notes: one short of what Neighbours swap needs.
    const three = played(8, [
      [0, 1, 48],
      [1, 1, 55],
      [2, 1, 60],
      [3, 1, 64],
    ])
    expect(wayTakes(three, { way: 'neighbours-swap', seed: 1 }).refusal).toBe(
      'Needs a phrase of four single notes.',
    )
    expect(wayTakes(three, { way: 'home-and-away', seed: 1 }).takes).toBe(2)
  })

  it('keep what a take keeps on every sound of the bank they fit', () => {
    expect(bankProblems(TRADES, [3, 77])).toEqual([])
    for (const way of TRADES) {
      const fitted = FACTORY_SOUNDS.filter((each) => wayTakes(each, { way, seed: 3 }).takes > 0)
      expect(fitted.length, way).toBeGreaterThanOrEqual(5)
    }
  }, 120_000)
})
