// Held: the notes above the one a held chord stands on, coming in and going
// out. The standing note is the written note untouched in every take; the
// upper notes enter one at a time, trade places in the chord, or are struck
// again at counts of their own.

import { describe, expect, it } from 'vitest'

import { FACTORY_SOUNDS } from '..'
import { type PhraseNote } from '../../patch-render'
import { cycled, looped } from '../sounds/recipe'
import { WAYS, playSound, wayTakes, waysFor, type WayPlaying } from '../ways'
import { readSound } from '../ways/reading'
import { bankProblems } from './ways-support'

const HELD = WAYS.filter((way) => way.family === 'held').map((way) => way.id)

// Skipped start 4 s, loop 16 s, crossfade 2 s: a note may be struck from 6 s to 20 s, and
// every written note is down from 0 to 23 s.
const chord = looped(16, 4, 2, [48, 55, 64, 71])
const UPPER = [55, 64, 71]
const FROM = 6
const TO = 20
const END = 23
const pair = looped(16, 4, 2, [48, 55])
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

/** The notes of take `take` of `way` on the chord, earliest first. */
const take = (way: string, number: number, at: Partial<WayPlaying> = {}): PhraseNote[] =>
  [...playSound(chord, { way, seed: 1, ...at, take: number }).phrase.notes].sort(
    (a, b) => a.atSec - b.atSec || a.note - b.note,
  )
const of = (notes: readonly PhraseNote[], pitch: number): PhraseNote[] =>
  notes.filter((note) => note.note === pitch)
const upTo = (note: PhraseNote): number => note.atSec + note.durSec
/** The upper notes that are not down at `sec`. */
const absent = (notes: readonly PhraseNote[], sec: number): number[] =>
  UPPER.filter((pitch) => !of(notes, pitch).some((note) => note.atSec <= sec && sec < upTo(note)))

const takesOf = (way: string, at: Partial<WayPlaying> = {}): number =>
  wayTakes(chord, { way, seed: 1, ...at }).takes

describe('staggered entries', () => {
  it('holds the lowest note as written and brings each upper note in once inside the pass', () => {
    expect(wayTakes(chord, { way: 'staggered-entries', seed: 1 })).toEqual({
      takes: 3,
      round: [0, 1, 2],
      cut: false,
    })
    const orders = new Set<string>()
    for (let number = 0; number < 3; number += 1) {
      const notes = take('staggered-entries', number)
      expect(notes).toHaveLength(4)
      expect(of(notes, 48)).toEqual([{ ...chord.phrase.notes[0], gain: 0.8 }])
      const entries = notes.filter((note) => note.note !== 48)
      expect(sortedPitches(entries)).toEqual(UPPER)
      for (const note of entries) {
        expect(note.atSec, `take ${number}`).toBeGreaterThanOrEqual(FROM)
        expect(note.atSec, `take ${number}`).toBeLessThan(TO)
        // Held from its entry to the written end.
        expect(upTo(note), `take ${number}`).toBeCloseTo(END, 9)
      }
      // One at a time: no two enter together.
      expect(new Set(entries.map((note) => note.atSec)).size).toBe(3)
      orders.add(entries.map((note) => note.note).join(' '))
    }
    expect([...orders]).toEqual(['55 64 71', '64 71 55', '71 55 64'])
  })

  it('spreads the entries over as much of the window as far says', () => {
    const last = (far: number): number =>
      Math.max(...take('staggered-entries', 0, { far }).map((note) => note.atSec))
    // Three entries over the whole window of 14 s: the first on its start, a third of it apart.
    expect(
      take('staggered-entries', 0, { far: 1 })
        .slice(1)
        .map((note) => note.atSec),
    ).toEqual([6, 6 + 14 / 3, 6 + 28 / 3])
    expect(last(0)).toBeLessThan(last(0.5))
    expect(last(0.5)).toBeLessThan(last(1))
    expect(takesOf('staggered-entries', { far: 0 })).toBe(3)
  })
})

describe('voices come and go', () => {
  it('lets one upper note go at the trade and brings back the one that left last turn', () => {
    expect(wayTakes(chord, { way: 'voices-come-and-go', seed: 1 })).toEqual({
      takes: 3,
      round: [0, 1, 2],
      cut: false,
    })
    // The trade is half way through the window: 13 s. The top note goes first.
    expect(take('voices-come-and-go', 0)).toEqual([
      { atSec: 0, durSec: 23, note: 48, gain: 0.8 },
      { atSec: 0, durSec: 23, note: 64, gain: 0.8 },
      { atSec: 0, durSec: 13, note: 71, gain: 0.8 },
      { atSec: 13, durSec: 10, note: 55, gain: 0.8 },
    ])
  })

  it('has at most one upper note absent at any moment, and the one that leaves comes in next turn', () => {
    const { round: turns } = wayTakes(chord, { way: 'voices-come-and-go', seed: 1 })
    const leaves = (notes: readonly PhraseNote[]): number[] =>
      notes.filter((note) => note.note !== 48 && upTo(note) < END).map((note) => note.note)
    const enters = (notes: readonly PhraseNote[]): number[] =>
      notes.filter((note) => note.atSec > 0).map((note) => note.note)
    turns.forEach((number, turn) => {
      const notes = take('voices-come-and-go', number)
      const next = take('voices-come-and-go', turns[(turn + 1) % turns.length])
      for (let sec = 0; sec < END; sec += 0.25) {
        expect(absent(notes, sec).length, `turn ${turn} at ${sec} s`).toBeLessThanOrEqual(1)
      }
      expect(leaves(notes), `turn ${turn}`).toHaveLength(1)
      expect(enters(next), `turn ${turn}`).toEqual(leaves(notes))
      // A take starts where the take before it ended.
      expect(absent(next, 0), `turn ${turn}`).toEqual(absent(notes, END - 0.5))
      expect(of(notes, 48)).toEqual([{ ...chord.phrase.notes[0], gain: 0.8 }])
    })
  })

  it('trades where in the window far says', () => {
    const trade = (far: number): number =>
      Math.max(...take('voices-come-and-go', 0, { far }).map((note) => note.atSec))
    expect(trade(0.5)).toBe(13)
    expect(trade(0)).toBeGreaterThanOrEqual(FROM)
    expect(trade(0)).toBeLessThan(trade(0.5))
    expect(trade(1)).toBeGreaterThan(trade(0.5))
    expect(trade(1)).toBeLessThan(TO)
  })
})

describe('unequal rounds', () => {
  it('strikes each upper note more than once in a pass, each at a count of its own', () => {
    const takes = takesOf('unequal-rounds')
    expect(takes).toBeGreaterThanOrEqual(3)
    expect(wayTakes(chord, { way: 'unequal-rounds', seed: 1 }).cut).toBe(false)
    for (let number = 0; number < takes; number += 1) {
      const notes = take('unequal-rounds', number)
      expect(of(notes, 48)).toEqual([{ ...chord.phrase.notes[0], gain: 0.8 }])
      for (const pitch of UPPER) {
        const voice = of(notes, pitch)
        const struck = voice.filter((note) => note.atSec > 0)
        expect(struck.length, `take ${number} note ${pitch}`).toBeGreaterThan(1)
        for (const note of struck) {
          expect(note.atSec).toBeGreaterThanOrEqual(FROM)
          expect(note.atSec).toBeLessThan(TO)
        }
        // Held as written to its first strike, each strike to the next, the last to the written end.
        expect(voice[0].atSec).toBe(0)
        voice.forEach((note, index) => {
          const until = index + 1 < voice.length ? voice[index + 1].atSec : END
          expect(upTo(note), `take ${number} note ${pitch}`).toBeCloseTo(until, 9)
        })
      }
    }
    // The first take on the middle grid of far 0.25, twelve places in the window: the top
    // note on every second place, the next on every third, the lowest upper note on every fifth.
    const first = take('unequal-rounds', 0)
    const places = (pitch: number): number[] =>
      of(first, pitch)
        .filter((note) => note.atSec > 0)
        .map((note) => Math.round(((note.atSec - FROM) / (TO - FROM)) * 12))
    expect(places(71)).toEqual([0, 2, 4, 6, 8, 10])
    expect(places(64)).toEqual([0, 3, 6, 9])
    expect(places(55)).toEqual([0, 5, 10])
    // Carried on: the second take counts on from twelve.
    const second = take('unequal-rounds', 1)
    expect(
      of(second, 55)
        .filter((note) => note.atSec > 0)
        .map((note) => Math.round(((note.atSec - FROM) / (TO - FROM)) * 12)),
    ).toEqual([3, 8])
  })

  it('gives three takes or more that differ, on a round that comes back', () => {
    const keys = [0, 1, 2].map((number) => JSON.stringify(take('unequal-rounds', number)))
    expect(new Set(keys).size).toBe(3)
    expect(wayTakes(chord, { way: 'unequal-rounds', seed: 1 })).toEqual({
      takes: 5,
      round: [0, 1, 2, 3, 4],
      cut: false,
    })
  })

  it('has a finer grid the further far goes', () => {
    const struck = (far: number): number => take('unequal-rounds', 0, { far }).length
    expect(struck(0)).toBeLessThan(struck(0.5))
    expect(struck(0.5)).toBeLessThan(struck(1))
  })
})

describe('held', () => {
  it('has nothing to play on a held note with none to lend it, on a phrase and on a kit', () => {
    const kit = FACTORY_SOUNDS.find((each) => each.kit && each.phrase.notes.length > 8)
    expect(kit).toBeDefined()
    if (!kit) return
    // The top of the keyboard: no note of the key is above it to be lent.
    const top = looped(16, 4, 2, [96])
    for (const way of HELD) {
      expect(wayTakes(top, { way, seed: 1 }), way).toMatchObject({
        takes: 0,
        refusal: 'Needs three notes held, or more.',
      })
      expect(wayTakes(round, { way, seed: 1 }), way).toMatchObject({
        takes: 0,
        refusal: 'Needs a held chord.',
      })
      expect(wayTakes(kit, { way, seed: 1 }), way).toMatchObject({
        takes: 0,
        refusal: 'Its keys are not notes.',
      })
      expect(waysFor(chord)).toContain(way)
      // A held chord of two notes is lent a third, and has a chord to deal.
      expect(waysFor(pair)).toContain(way)
      expect(waysFor(top)).not.toContain(way)
      expect(waysFor(round)).not.toContain(way)
      expect(waysFor(kit)).not.toContain(way)
    }
  })

  it('plays every held sound of the bank whose keys are pitches, one note or many', () => {
    const chords = FACTORY_SOUNDS.filter((each) => {
      const reading = readSound(each)
      return reading.shape === 'held' && reading.pitched
    })
    expect(chords.some((each) => readSound(each).chord.length === 1)).toBe(true)
    expect(chords.length).toBeGreaterThanOrEqual(5)
    for (const each of chords) {
      for (const way of HELD) {
        for (const far of [undefined, 0.25, 0.5, 1]) {
          expect(
            wayTakes(each, { way, seed: 3, far }).takes,
            `${each.id} ${way} far ${far}`,
          ).toBeGreaterThanOrEqual(2)
        }
      }
    }
  })

  it('keeps what a take keeps on every sound of the bank it fits', () => {
    expect(bankProblems(HELD, [3, 77])).toEqual([])
    for (const way of HELD) {
      const fitted = FACTORY_SOUNDS.filter((each) => wayTakes(each, { way, seed: 3 }).takes > 0)
      expect(fitted.length, way).toBeGreaterThanOrEqual(5)
    }
  }, 120_000)
})

function sortedPitches(notes: readonly PhraseNote[]): number[] {
  return notes.map((note) => note.note).sort((a, b) => a - b)
}
