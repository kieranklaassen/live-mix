// Growth: a phrase that gathers from a few of its moments to all of them, a
// phrase one more note of which has slipped each turn, and a phrase whose
// notes climb through its own chord, or lean across its rhythm, and come home.
// Every take is held to what a take keeps (./ways-support.ts).

import { describe, expect, it } from 'vitest'

import { FACTORY_SOUNDS } from '..'
import { FACTORY_MODES, type FactoryKey } from '../key'
import { cycled, played } from '../sounds/recipe'
import { type FactorySound } from '../types'
import { alongWhiteKeys } from '../vary'
import { WAYS, playSound, wayTakes, waysFor } from '../ways'
import { readSound } from '../ways/reading'
import { type PassNote } from '../ways/types'
import { bankProblems, takeProblems } from './ways-support'

const GROWTH = ['gather', 'one-note-slips', 'climb', 'lean']
const PITCH_DEALING = ['one-note-slips', 'climb', 'lean']

type Sound = Pick<FactorySound, 'phrase' | 'durationSec'>

/** Eight moments played round: the note the sound stands on, then seven above it. */
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
/** Eight moments played round that start above the note the sound stands on, which comes fifth. */
const turned = cycled(8, [
  [0, 1, 60],
  [1, 1, 64],
  [2, 1, 67],
  [3, 1, 72],
  [4, 1, 48],
  [5, 1, 64, 0.5],
  [6, 1, 67],
  [7, 0.5, 60],
])
/** Six moments that end: three pitches above the standing note, two of them twice. */
const four = played(8, [
  [0, 1, 48],
  [1, 1, 55],
  [2, 1, 60],
  [3, 1, 64],
  [4, 1, 55],
  [5, 1, 60],
])
/** The eight moments of `turned` in E major. */
const E_MAJOR: FactoryKey = { root: 4, mode: 'major' }
const inE = cycled(8, [
  [0, 1, 64],
  [1, 1, 68],
  [2, 1, 71],
  [3, 1, 76],
  [4, 1, 52],
  [5, 1, 68],
  [6, 1, 71],
  [7, 0.5, 64],
])

/** One pass of take `take`, in the order the sound is written in. */
const pass = (
  sound: Sound,
  way: string,
  take: number,
  { seed = 1, far, key }: { seed?: number; far?: number; key?: FactoryKey } = {},
): readonly PassNote[] => readSound(playSound(sound, { way, seed, far, take, key })).notes

/** The pitches of take `take`, one pass of them, in time order. */
const pitches = (sound: Sound, way: string, take: number, far?: number): number[] =>
  readSound(playSound(sound, { way, seed: 1, far, take }))
    .moments.flatMap((moment) => moment.notes)
    .map((note) => note.note)

/** Which notes of a pass are off their written pitch, as places in the written pass. */
const offPitch = (written: readonly PassNote[], played: readonly PassNote[]): number[] =>
  written.flatMap((note, index) => (played[index].note === note.note ? [] : [index]))

describe('growth', () => {
  it('has its four ways in the table, in the family', () => {
    const rows = WAYS.filter((way) => way.family === 'growth')
    expect(rows.map((way) => way.id)).toEqual(GROWTH)
    expect(rows.map((way) => way.name)).toEqual(['Gather', 'One note slips', 'Climb', 'Lean'])
    for (const way of rows) expect(way.words.length, way.id).toBeLessThanOrEqual(300)
  })

  it('Gather plays a quarter of the moments, then half, then three quarters, then all', () => {
    expect(wayTakes(round, { way: 'gather', seed: 1 })).toEqual({
      takes: 4,
      round: [0, 1, 2, 3],
      cut: false,
    })
    expect(pitches(round, 'gather', 0)).toEqual([48, 60])
    expect(pitches(round, 'gather', 1)).toEqual([48, 60, 64, 67])
    expect(pitches(round, 'gather', 2)).toEqual([48, 60, 64, 67, 72, 76])
    // The last take is the phrase as written: the sound itself comes back.
    expect(playSound(round, { way: 'gather', seed: 1, take: 3 })).toBe(round)
    // It draws nothing: the same takes at every seed.
    expect(pass(round, 'gather', 1, { seed: 99 })).toEqual(pass(round, 'gather', 1))
  })

  it('Gather starts from one moment past half of far', () => {
    expect(pitches(round, 'gather', 0, 1)).toEqual([48])
    expect(pitches(round, 'gather', 1, 1)).toEqual([48, 60, 64, 67])
    expect(wayTakes(round, { way: 'gather', seed: 1, far: 1 }).round).toEqual([0, 1, 2, 3])
  })

  it('Gather always sounds the first moment and every moment that holds the standing note', () => {
    // The first two moments, and the fifth, which holds the note the sound stands on.
    const first = pass(turned, 'gather', 0)
    expect(first.map((note) => [note.at, note.note])).toEqual([
      [0, 60],
      [1, 64],
      [4, 48],
    ])
    expect(pitches(turned, 'gather', 0, 1)).toEqual([60, 48])
  })

  it('Gather ends on the phrase as written and starts with the fewest notes, on every sound of the bank it fits', () => {
    for (const each of FACTORY_SOUNDS) {
      const { takes } = wayTakes(each, { way: 'gather', seed: 3 })
      if (takes === 0) continue
      expect(playSound(each, { way: 'gather', seed: 3, take: takes - 1 }), each.id).toBe(each)
      const counts = Array.from({ length: takes }, (_, take) => pass(each, 'gather', take).length)
      expect(Math.min(...counts.slice(1)), each.id).toBeGreaterThan(counts[0])
    }
  })

  it('One note slips has one more note off its written pitch each take, and it stays there', () => {
    const written = readSound(turned).notes
    for (let seed = 1; seed <= 24; seed += 1) {
      expect(wayTakes(turned, { way: 'one-note-slips', seed }), `seed ${seed}`).toEqual({
        takes: 5,
        round: [0, 1, 2, 3, 4],
        cut: false,
      })
      let before: number[] = []
      for (let take = 0; take < 5; take += 1) {
        const played = pass(turned, 'one-note-slips', take, { seed })
        const off = offPitch(written, played)
        expect(off, `seed ${seed} take ${take}`).toHaveLength(take)
        // What the take before had moved is still where it went.
        const last = pass(turned, 'one-note-slips', Math.max(0, take - 1), { seed })
        for (const index of before) expect(played[index].note).toBe(last[index].note)
        // Never the first note of the pass, never the note the sound stands on.
        expect(off).not.toContain(0)
        expect(off).not.toContain(4)
        for (const index of off) {
          // A step along the key, to a white key above the standing note.
          expect([-1, 1].map((steps) => alongWhiteKeys(written[index].note, steps))).toContain(
            played[index].note,
          )
          expect(played[index].note).toBeGreaterThan(48)
          expect(played[index]).toEqual({ ...written[index], note: played[index].note })
        }
        before = off
      }
    }
  })

  it('One note slips moves a note a third past half of far', () => {
    const written = readSound(turned).notes
    for (let take = 1; take < 5; take += 1) {
      const played = pass(turned, 'one-note-slips', take, { far: 1 })
      const off = offPitch(written, played)
      expect(off).toHaveLength(take)
      for (const index of off) {
        expect([-2, 2].map((steps) => alongWhiteKeys(written[index].note, steps))).toContain(
          played[index].note,
        )
      }
    }
  })

  it('One note slips keeps a phrase in E major in E major', () => {
    const scale = FACTORY_MODES.major.map((step) => (step + E_MAJOR.root) % 12)
    const written = readSound(inE).notes
    for (const seed of [1, 2, 3, 77]) {
      expect(wayTakes(inE, { way: 'one-note-slips', seed, key: E_MAJOR }).takes).toBe(5)
      for (let take = 0; take < 5; take += 1) {
        const played = pass(inE, 'one-note-slips', take, { seed, key: E_MAJOR })
        expect(offPitch(written, played), `seed ${seed} take ${take}`).toHaveLength(take)
        for (const note of played)
          expect(scale, `seed ${seed} take ${take}`).toContain(note.note % 12)
      }
      expect(takeProblems(inE, 'one-note-slips', seed, undefined, E_MAJOR)).toEqual([])
    }
  })

  it('One note slips has take n with n notes off, each on a white key, on every sound of the bank it fits', () => {
    const white = [0, 2, 4, 5, 7, 9, 11]
    for (const each of FACTORY_SOUNDS) {
      const { takes } = wayTakes(each, { way: 'one-note-slips', seed: 3 })
      if (takes === 0) continue
      const reading = readSound(each)
      const first = Math.min(...reading.notes.map((note) => note.at))
      for (let take = 0; take < takes; take += 1) {
        const played = pass(each, 'one-note-slips', take, { seed: 3 })
        const off = offPitch(reading.notes, played)
        expect(off, `${each.id} take ${take}`).toHaveLength(take)
        for (const index of off) {
          expect(white, `${each.id} take ${take}`).toContain(played[index].note % 12)
          expect(reading.notes[index].at, `${each.id} take ${take}`).toBeGreaterThan(first)
          expect(reading.notes[index].note, `${each.id} take ${take}`).not.toBe(reading.standing)
        }
      }
    }
  })

  it('Climb sits every dealt note one chord note higher each turn, and comes home', () => {
    // Three notes above the standing note: after three turns every note is home.
    expect(pitches(four, 'climb', 0)).toEqual([48, 55, 60, 64, 55, 60])
    expect(pitches(four, 'climb', 1)).toEqual([48, 60, 64, 55, 60, 64])
    expect(pitches(four, 'climb', 2)).toEqual([48, 64, 55, 60, 64, 55])
    expect(wayTakes(four, { way: 'climb', seed: 1 })).toEqual({
      takes: 3,
      round: [0, 1, 2, 0],
      cut: false,
    })
    // Seven notes above it: four turns, and home on the fifth.
    expect(pitches(round, 'climb', 3)).toEqual([48, 72, 76, 79, 84, 60, 64, 67])
    expect(wayTakes(round, { way: 'climb', seed: 1 }).round).toEqual([0, 1, 2, 3])
  })

  it('Climb comes home after two, three or four turns as far says', () => {
    expect(wayTakes(round, { way: 'climb', seed: 1, far: 0.25 }).round).toEqual([0, 1])
    expect(wayTakes(round, { way: 'climb', seed: 1, far: 0.5 }).round).toEqual([0, 1, 2])
    expect(wayTakes(round, { way: 'climb', seed: 1, far: 1 }).round).toEqual([0, 1, 2, 3])
  })

  it('Climb has the written standing note in every take', () => {
    const written = readSound(turned).notes
    const { takes, round: order } = wayTakes(turned, { way: 'climb', seed: 1 })
    expect(takes).toBe(4)
    // The round starts on the phrase as written, so the turn after its last is home.
    expect(order).toEqual([0, 1, 2, 3])
    expect(playSound(turned, { way: 'climb', seed: 1, take: 0 })).toBe(turned)
    for (let take = 0; take < takes; take += 1) {
      const played = pass(turned, 'climb', take)
      expect(played[4], `take ${take}`).toEqual(written[4])
      expect(offPitch(written, played), `take ${take}`).toEqual(
        take === 0 ? [] : [0, 1, 2, 3, 5, 6, 7],
      )
    }
  })

  it('Lean plays each dealt note one dealt moment later and one chord note higher each turn', () => {
    expect(pitches(four, 'lean', 0)).toEqual([48, 55, 60, 64, 55, 60])
    expect(pitches(four, 'lean', 1)).toEqual([48, 64, 60, 64, 55, 60])
    expect(pitches(four, 'lean', 2)).toEqual([48, 64, 55, 64, 55, 60])
    // The third turn is three chord notes higher, which is home, and three moments later.
    expect(pitches(four, 'lean', 3)).toEqual([48, 64, 55, 60, 55, 60])
    expect(wayTakes(four, { way: 'lean', seed: 1 })).toEqual({
      takes: 4,
      round: [0, 1, 2, 3],
      cut: false,
    })
    expect(wayTakes(four, { way: 'lean', seed: 1, far: 0.25 }).round).toEqual([0, 1])
    expect(wayTakes(four, { way: 'lean', seed: 1, far: 0.5 }).round).toEqual([0, 1, 2])
  })

  it('Lean keeps every note on a moment the written phrase has, with its length and touch', () => {
    for (const each of [four, turned]) {
      const written = readSound(each).notes
      const { takes } = wayTakes(each, { way: 'lean', seed: 1 })
      expect(takes).toBeGreaterThanOrEqual(2)
      for (let take = 0; take < takes; take += 1) {
        const played = pass(each, 'lean', take)
        expect(played.map((note) => ({ ...note, note: 0 }))).toEqual(
          written.map((note) => ({ ...note, note: 0 })),
        )
        // Only the sound's own pitches, and the standing note where it is written.
        const chord = written.map((note) => note.note)
        for (const note of played) expect(chord).toContain(note.note)
        written.forEach((note, index) => {
          if (note.note === 48) expect(played[index].note).toBe(48)
        })
      }
    }
  })

  it('is played on a kit loop by Gather alone', () => {
    const kits = FACTORY_SOUNDS.filter((each) => each.kit)
    const loops = kits.filter((each) => {
      const reading = readSound(each)
      return reading.shape === 'round' && reading.moments.length >= 4
    })
    expect(loops.length).toBeGreaterThan(0)
    for (const kit of loops) expect(waysFor(kit), kit.id).toContain('gather')
    for (const kit of kits) {
      for (const way of PITCH_DEALING) {
        expect(waysFor(kit), kit.id).not.toContain(way)
        expect(wayTakes(kit, { way, seed: 1 }).refusal, kit.id).toBe('Its keys are not notes.')
      }
    }
  })

  it('says why a way has nothing to play', () => {
    const held = FACTORY_SOUNDS.find((each) => readSound(each).shape === 'held')
    expect(held).toBeDefined()
    if (!held) return
    for (const way of GROWTH) {
      expect(wayTakes(held, { way, seed: 1 }).refusal, way).toBe('Needs a phrase.')
    }
    const two = played(4, [
      [0, 1, 48],
      [1, 1, 55],
      [2, 1, 48],
      [3, 1, 55],
    ])
    for (const way of PITCH_DEALING) {
      expect(wayTakes(two, { way, seed: 1 }).refusal, way).toBe('Needs a phrase of three pitches.')
    }
  })

  it('keeps what a take keeps on every sound of the bank it fits', () => {
    expect(bankProblems(GROWTH, [3, 77])).toEqual([])
    const fitted: Record<string, number> = {}
    const kinds: Record<string, string[]> = {}
    for (const each of FACTORY_SOUNDS) {
      const kind = each.kit ? 'kit' : each.source !== undefined ? 'audio' : readSound(each).shape
      for (const way of GROWTH) {
        if (wayTakes(each, { way, seed: 3 }).takes > 0) {
          fitted[way] = (fitted[way] ?? 0) + 1
          kinds[way] = [...(kinds[way] ?? []), kind]
        }
      }
    }
    for (const way of GROWTH) expect(fitted[way], way).toBeGreaterThanOrEqual(5)
    // Each way has takes on a sound of every kind it says it plays.
    expect([...new Set(kinds.gather)].sort()).toEqual(['audio', 'ended', 'kit', 'round'])
    for (const way of PITCH_DEALING) {
      expect([...new Set(kinds[way])].sort(), way).toEqual(['ended', 'round'])
    }
  }, 120_000)
})
