// The table of ways, how a way's takes are counted, and the first family:
// the chord's notes dealt out one at a time. Every take is held to what a
// take keeps (./ways-support.ts); what a way sounds like is the bench's to
// say (FACTORY_REPORT=ways).

import { describe, expect, it } from 'vitest'

import { FACTORY_SOUNDS, factorySound } from '..'
import { cycled, looped, played } from '../sounds/recipe'
import { type FactorySound } from '../types'
import { WAYS, WAY_FAMILIES, describeTake, playSound, wayTakes, waysFor } from '../ways'
import { readSound } from '../ways/reading'
import { wayRule } from '../ways/table'
import { countTakes } from '../ways/takes'
import { type Way } from '../ways/types'
import { bankProblems, notesKey } from './ways-support'

const chord = looped(16, 4, 2, [48, 55, 64, 71])
const one = looped(16, 4, 2, [48])
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
const four = played(8, [
  [0, 1, 48],
  [1, 1, 55],
  [2, 1, 60],
  [3, 1, 64],
  [4, 1, 55],
  [5, 1, 60],
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

const sound = (id: string): FactorySound => {
  const found = factorySound(id)
  if (!found) throw new Error(`no factory sound "${id}"`)
  return found
}

describe('the table of ways', () => {
  it('has rows of words and numbers only, which a host can keep or copy', () => {
    expect(structuredClone(WAYS)).toEqual(WAYS)
  })

  it('gives every row a far of its own, and every refusal a round of its own', () => {
    expect(new Set(WAYS.map((way) => way.far)).size).toBe(WAYS.length)
    for (const way of WAYS) expect(wayRule(way.id)?.far, way.id).not.toBe(way.far)
    expect(wayRule(WAYS[0].id)?.far).toEqual(WAYS[0].far)
    const none = { way: 'no-such-way', seed: 1 }
    expect(wayTakes(chord, none).round).not.toBe(wayTakes(chord, none).round)
  })

  it('has a row a host can list for every way', () => {
    const families: string[] = WAY_FAMILIES.map((family) => family.id)
    expect(new Set(WAYS.map((way) => way.id)).size).toBe(WAYS.length)
    for (const way of WAYS) {
      expect(way.id, way.id).toMatch(/^[a-z]+(-[a-z]+)*$/)
      expect(way.name.length, way.id).toBeLessThanOrEqual(24)
      expect(way.words.length, way.id).toBeLessThanOrEqual(300)
      expect(way.needs.length, way.id).toBeGreaterThan(0)
      expect(way.far.words.length, way.id).toBeGreaterThan(0)
      expect(way.far.default, way.id).toBeGreaterThanOrEqual(0)
      expect(way.far.default, way.id).toBeLessThanOrEqual(1)
      expect(families, way.id).toContain(way.family)
    }
  })
})

describe('playSound', () => {
  it('gives the sound itself back where no way plays it', () => {
    expect(playSound(chord)).toBe(chord)
    expect(playSound(chord, { way: 'no-such-way', seed: 1 })).toBe(chord)
    // A way with nothing to play there.
    expect(playSound(one, { way: 'rising', seed: 1 })).toBe(one)
  })

  it('takes a take number past the last round again', () => {
    expect(wayTakes(chord, { way: 'rising', seed: 1 }).takes).toBe(3)
    const take = (number: number): string =>
      notesKey(playSound(chord, { way: 'rising', seed: 1, take: number }).phrase.notes)
    expect(take(4)).toBe(take(1))
    expect(take(-1)).toBe(take(2))
    expect(take(1)).not.toBe(take(0))
    // A take number that is no whole number: the one below it, or the first.
    expect(take(1.7)).toBe(take(1))
    expect(take(Number.NaN)).toBe(take(0))
  })

  it('gives back a sound that no way can be asked of', () => {
    const silent = { ...round, phrase: { notes: [] } }
    const uneven = {
      ...round,
      phrase: {
        notes: round.phrase.notes.map((note, index) =>
          index === 9 ? { ...note, note: note.note + 2 } : note,
        ),
      },
    }
    // A chord held through a loop that is folded over its whole length: nowhere clear of the fold.
    const folded = looped(16, 4, 16, [48, 55, 64, 71])
    // What no sound of the bank is, and a host's sound may be.
    const timeless = {
      ...round,
      phrase: {
        notes: round.phrase.notes.map((note, index) =>
          index === 2 ? { ...note, atSec: Number.NaN } : note,
        ),
      },
    }
    const early = {
      ...round,
      phrase: { notes: round.phrase.notes.map((note) => ({ ...note, atSec: note.atSec - 100 })) },
    }
    for (const [each, refusal] of [
      [silent, 'It has no notes.'],
      [uneven, 'Its passes are not one pass repeated.'],
      [folded, 'Its loop is all crossfade.'],
      [{ ...round, durationSec: 0 }, 'It has no length.'],
      [{ ...round, durationSec: Number.NaN }, 'It has no length.'],
      [timeless, 'A note of it is not written in numbers.'],
      [early, 'It has no notes in its first pass.'],
    ] as const) {
      expect(wayTakes(each, { way: 'rising', seed: 1 })).toEqual({
        takes: 0,
        round: [],
        cut: false,
        refusal,
      })
      expect(waysFor(each)).toEqual([])
      expect(playSound(each, { way: 'rising', seed: 1, take: 1 })).toBe(each)
    }
    expect(wayTakes(looped(16, 4, 15, [48, 55, 64, 71]), { way: 'rising', seed: 1 }).takes).toBe(3)
  })
})

describe('wayTakes', () => {
  it('counts the different takes and the round they come in', () => {
    expect(wayTakes(chord, { way: 'rising', seed: 1 })).toEqual({
      takes: 3,
      round: [0, 1, 2],
      cut: false,
    })
  })

  it('says why a way has nothing to play', () => {
    expect(wayTakes(one, { way: 'rising', seed: 1 })).toEqual({
      takes: 0,
      round: [],
      cut: false,
      refusal: 'Needs two notes held, or more.',
    })
    // One note above the one it stands on: every turn deals the same note.
    expect(wayTakes(pair, { way: 'rising', seed: 1 }).refusal).toBe(
      'Every take of it comes out the same.',
    )
    expect(wayTakes(chord, { way: 'no-such-way', seed: 1 }).refusal).toBe('No such way.')
    expect(wayTakes(chord, { way: 'carry-on', seed: 1 }).refusal).toBe('Needs a phrase.')
  })

  it('is the same for the same sound, way, seed and far', () => {
    for (const way of WAYS) {
      for (const each of [chord, round, four]) {
        expect(wayTakes(each, { way: way.id, seed: 5 }), way.id).toEqual(
          wayTakes(each, { way: way.id, seed: 5 }),
        )
      }
    }
    // A way that counts and draws nothing gives the same takes at every seed.
    expect(wayTakes(round, { way: 'rising', seed: 1 })).toEqual(
      wayTakes(round, { way: 'rising', seed: 2 }),
    )
  })

  it('takes a far or a seed that is no number as the one it would have without', () => {
    const notes = (playing: { far?: number; seed?: number; way?: string }): string[] => {
      const at = { way: 'turning-rests', seed: 1, ...playing }
      return Array.from({ length: wayTakes(round, at).takes }, (_, take) =>
        notesKey(playSound(round, { ...at, take }).phrase.notes),
      )
    }
    // The amount: the row's own where it is no number, and held to 0 and 1.
    expect(notes({ far: 1 })).not.toEqual(notes({ far: 0 }))
    expect(notes({ far: Number.NaN })).toEqual(notes({}))
    expect(notes({ far: 7 })).toEqual(notes({ far: 1 }))
    expect(notes({ far: -1 })).toEqual(notes({ far: 0 }))
    expect(notes({ far: Infinity })).toEqual(notes({ far: 1 }))
    expect(notes({ far: -Infinity })).toEqual(notes({ far: 0 }))
    // The seed, on the one way that draws.
    const drawn = (seed: number): string[] => notes({ way: 'one-note-slips', seed })
    expect(
      new Set(Array.from({ length: 12 }, (_, seed) => drawn(seed).join('|'))).size,
    ).toBeGreaterThan(1)
    expect(drawn(Number.NaN)).toEqual(drawn(0))
  })

  const made = (id: string, pitchOf: (turn: number) => number): Way => ({
    id,
    name: id,
    family: 'counting',
    words: id,
    needs: id,
    far: { words: id, default: 0 },
    fits: () => null,
    play: (reading, { turn }) =>
      reading.notes.map((note, index) => (index === 1 ? { ...note, note: pitchOf(turn) } : note)),
  })

  it('reads the round off every turn asked for, not off the first turn that is the first again', () => {
    const counted = countTakes(
      round,
      made('three-and-one', (turn) => (turn % 4 === 3 ? 62 : 60)),
      { way: 'three-and-one', seed: 1 },
    )
    expect(counted).toMatchObject({ round: [0, 0, 0, 1], cut: false })
    expect(typeof counted === 'string' ? [] : counted.passes).toHaveLength(2)
  })

  it('cuts a round that never comes back at eight takes, and says so', () => {
    const counted = countTakes(
      round,
      made('never-again', (turn) => 60 + turn),
      { way: 'never-again', seed: 1 },
    )
    expect(counted).toMatchObject({ round: [0, 1, 2, 3, 4, 5, 6, 7], cut: true })
  })

  it('calls a round whole only where the turns after it play it again', () => {
    // Eleven turns at home and one away, over and over: the sixteen turns asked for show the
    // round once and a third of it again, and the next eight bear it out.
    const twelve = countTakes(
      round,
      made('one-in-twelve', (turn) => (turn % 12 === 11 ? 62 : 60)),
      { way: 'one-in-twelve', seed: 1 },
    )
    expect(twelve).toMatchObject({ round: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], cut: false })
    // Away once, on the fourteenth turn, and never again: sixteen turns look like a round of
    // fourteen, and the turns after them do not play it.
    const once = countTakes(
      round,
      made('once', (turn) => (turn === 13 ? 62 : 60)),
      { way: 'once', seed: 1 },
    )
    expect(once).toMatchObject({ cut: true })
    expect(typeof once === 'string' ? [] : once.round).toHaveLength(14)
    // On the bank: a phrase of eleven moments whose rests move on a place a turn.
    expect(
      wayTakes(sound('eighths-sequence-dm'), { way: 'turning-rests', seed: 1, far: 0 }),
    ).toMatchObject({ cut: true })
  })

  it('gives one take, and so nothing to play, for a rule that plays the same every turn', () => {
    expect(
      countTakes(
        round,
        made('same', () => 60),
        { way: 'same', seed: 1 },
      ),
    ).toBe('Every take of it comes out the same.')
  })
})

describe('waysFor', () => {
  it('names the ways with something to play, and none that needs pitches on a kit', () => {
    expect(waysFor(chord)).toEqual(
      expect.arrayContaining(['rising', 'there-and-back', 'outside-in']),
    )
    expect(waysFor(chord)).not.toContain('carry-on')
    expect(waysFor(one)).toEqual([])
    const kit = FACTORY_SOUNDS.find((each) => each.kit && each.phrase.notes.length > 8)
    expect(kit).toBeDefined()
    if (!kit) return
    for (const way of ['rising', 'there-and-back', 'outside-in', 'carry-on']) {
      expect(waysFor(kit), kit.id).not.toContain(way)
    }
  })

  it('asks each way at the far a host names', () => {
    // Two held notes: one note to deal until far adds the octave above it.
    expect(waysFor(pair)).not.toContain('rising')
    expect(waysFor(pair, { far: 1 })).toContain('rising')
  })
})

describe('describeTake', () => {
  it('counts what a take does to one pass of its sound', () => {
    // Rising, second take, on a phrase: the seven notes above the standing note, one place on.
    expect(describeTake(round, { way: 'rising', seed: 1, take: 1 })).toEqual({
      sounding: 8,
      resting: 0,
      moved: 7,
      shifted: 0,
      added: 0,
    })
    // On a held chord the standing note holds, each upper note is struck elsewhere and five more strikes are new.
    expect(describeTake(chord, { way: 'rising', seed: 1, take: 0 })).toEqual({
      sounding: 9,
      resting: 0,
      moved: 0,
      shifted: 3,
      added: 5,
    })
    expect(describeTake(chord)).toEqual({ sounding: 4, resting: 0, moved: 0, shifted: 0, added: 0 })
  })
})

describe('one at a time', () => {
  it('Rising deals the chord low to high and starts one note further up each turn', () => {
    expect(pitches(round, 'rising', 0)).toEqual([48, 60, 64, 67, 72, 76, 79, 84])
    expect(pitches(round, 'rising', 1)).toEqual([48, 64, 67, 72, 76, 79, 84, 60])
    expect(wayTakes(round, { way: 'rising', seed: 1 }).round).toEqual([0, 1, 2, 3, 4, 5, 6])
    // On a held chord: the standing note as written, the upper notes struck eight times across the loop.
    const held = playSound(chord, { way: 'rising', seed: 1, take: 0 }).phrase.notes
    expect(held[0]).toEqual({ ...chord.phrase.notes[0], gain: 0.8 })
    expect(held.slice(1).map((note) => note.note)).toEqual([55, 64, 71, 55, 64, 71, 55, 64])
    expect(held.slice(1).map((note) => note.atSec)).toEqual([
      6, 7.75, 9.5, 11.25, 13, 14.75, 16.5, 18.25,
    ])
    // Take 0 is the same notes at every seed: the way draws nothing.
    expect(notesKey(playSound(chord, { way: 'rising', seed: 99, take: 0 }).phrase.notes)).toBe(
      notesKey(held),
    )
  })

  it('Rising runs on into the octave above past half of far', () => {
    expect(pitches(four, 'rising', 0, 1)).toEqual([48, 55, 60, 64, 67, 72])
    expect(wayTakes(four, { way: 'rising', seed: 1, far: 1 }).takes).toBe(6)
  })

  it('There and back goes up through the chord and down again, carried on across turns', () => {
    // Three notes above the standing note: 55 60 64 60, and five moments to lay them on.
    expect(pitches(four, 'there-and-back', 0)).toEqual([48, 55, 60, 64, 60, 55])
    expect(pitches(four, 'there-and-back', 1)).toEqual([48, 60, 64, 60, 55, 60])
    expect(wayTakes(four, { way: 'there-and-back', seed: 1 })).toMatchObject({
      takes: 4,
      round: [0, 1, 2, 3],
    })
  })

  it('Outside in deals the lowest, the highest, then inwards', () => {
    expect(pitches(round, 'outside-in', 0)).toEqual([48, 60, 84, 64, 79, 67, 76, 72])
    expect(pitches(round, 'outside-in', 1)).toEqual([48, 84, 64, 79, 67, 76, 72, 60])
  })

  it('Carry on reads the phrase with its last note left off, on across turns', () => {
    expect(pitches(round, 'carry-on', 0)).toEqual([48, 60, 64, 67, 72, 76, 79, 60])
    expect(pitches(round, 'carry-on', 1)).toEqual([48, 64, 67, 72, 76, 79, 60, 64])
    // Seven notes read six at a time: the line comes round after six turns.
    expect(wayTakes(round, { way: 'carry-on', seed: 1 }).round).toEqual([0, 1, 2, 3, 4, 5])
    expect(pitches(round, 'carry-on', 1, 1)).toEqual([48, 67, 72, 76, 60, 64, 67, 72])
  })

  it('leaves a moment that holds the standing note as written, wherever it comes', () => {
    const line = sound('slow-sub-line-am')
    const standing = Math.min(...line.phrase.notes.map((note) => note.note))
    for (const way of ['rising', 'there-and-back', 'outside-in']) {
      const takes = wayTakes(line, { way, seed: 1 }).takes
      for (let take = 0; take < takes; take += 1) {
        const played = playSound(line, { way, seed: 1, take }).phrase.notes
        line.phrase.notes.forEach((note, index) => {
          if (note.note === standing)
            expect(played[index].note, `${way} take ${take}`).toBe(standing)
        })
      }
    }
  })

  it('keeps what a take keeps on every sound of the bank it fits', () => {
    const ways = ['rising', 'there-and-back', 'outside-in', 'carry-on']
    expect(bankProblems(ways, [3])).toEqual([])
    for (const way of ways) {
      const fitted = [0.25, 0.5, 1].flatMap((far) =>
        FACTORY_SOUNDS.filter((each) => wayTakes(each, { way, seed: 3, far }).takes > 0),
      )
      expect(fitted.length, way).toBeGreaterThanOrEqual(15)
    }
  }, 120_000)
})
