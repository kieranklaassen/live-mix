import { describe, expect, it } from 'vitest'

import { axisNote, foldTowards, MIRROR_ON_D, mirrored } from '../mirror-on-d'
import { type MadePhraseNote } from '../phrase'
import { type MadeEvent, type MakerKey, WHITE_KEYS } from '../types'
import { A_MINOR, chord, line, made, makerContract, notesOf, PENTATONIC } from './support'

const REPLACE = { mode: 0, level: 1 }
const ANSWER = { mode: 2, level: 1 }
const HARMONIC_MINOR: MakerKey = { root: 9, steps: [0, 2, 3, 5, 7, 8, 11] }

/** Notes of one length one after another. */
function even(notes: readonly number[], durSec = 1) {
  return line(notes.map((note) => [note, durSec] as const))
}

function replaced(notes: readonly number[], params: Record<string, number> = {}, key?: MakerKey) {
  return notesOf(made(MIRROR_ON_D, even(notes), { params: { ...REPLACE, ...params }, key }))
}

/** `[begins, ends, note]`, to the millisecond, as they begin and then from the lowest. */
function times(phrase: readonly MadePhraseNote[]): [number, number, number][] {
  const ms = (sec: number) => Math.round(sec * 1000) / 1000
  return phrase
    .map((n): [number, number, number] => [ms(n.atSec), ms(n.atSec + n.durSec), n.note])
    .sort((a, b) => a[0] - b[0] || a[2] - b[2])
}

/** A maker played by hand: what sounds at each moment it is asked. */
function hand(params: Record<string, number>, parts?: string[]) {
  const maker = MIRROR_ON_D.create({ params, parts })
  const open = new Map<number, MadeEvent>()
  const emit = (event: MadeEvent): void => {
    if (event.on) open.set(event.id, event)
    else open.delete(event.id)
  }
  return {
    maker,
    at: (sec: number): number[] => {
      maker.advance(sec, emit)
      return [...open.values()].map((event) => event.note).sort((a, b) => a - b)
    },
    gain: (note: number) => [...open.values()].find((event) => event.note === note)?.gain,
  }
}

describe('Mirror on D: the turn', () => {
  it('turns n into 124 - n on the white keys', () => {
    expect(replaced([48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 76])).toEqual([
      76, 74, 72, 71, 69, 67, 65, 64, 62, 60, 48,
    ])
  })

  it('makes C E G into E C A, F A C into B G E, and G B D F into A F D B', () => {
    const turned = (notes: number[]) =>
      notesOf(made(MIRROR_ON_D, chord(notes, 1), { params: REPLACE }))
    expect(turned([60, 64, 67])).toEqual([64, 60, 57])
    expect(turned([53, 57, 60])).toEqual([71, 67, 64])
    expect(turned([55, 59, 62, 65])).toEqual([69, 65, 62, 59])
  })

  it('makes a rising dorian scale fall', () => {
    expect(replaced([62, 64, 65, 67, 69, 71, 72, 74])).toEqual([62, 60, 59, 57, 55, 53, 52, 50])
  })

  it('meets its own fall in contrary motion in Both, the D one voice', () => {
    expect(times(made(MIRROR_ON_D, even([62, 64, 65]), { params: { mode: 1, level: 1 } }))).toEqual(
      [
        [0, 1, 62],
        [1, 2, 60],
        [1, 2, 64],
        [2, 3, 59],
        [2, 3, 65],
      ],
    )
  })

  it('leaves a note outside the key as far outside it on the other side', () => {
    // C sharp and E flat change places, F sharp and B flat, and G sharp is its own.
    expect(replaced([61, 63, 66, 70, 68])).toEqual([63, 61, 58, 54, 56])
    expect(replaced([60.5])).toEqual([63.5])
  })

  it('turns round the D of A minor, the D of G mixolydian and the G of F pentatonic', () => {
    expect(replaced([57, 59, 60, 64, 65], {}, A_MINOR)).toEqual([67, 65, 64, 60, 59])
    expect(replaced([55, 59, 62, 65], {}, { root: 7, steps: [0, 2, 4, 5, 7, 9, 10] })).toEqual([
      69, 65, 62, 59,
    ])
    // F G A C D round G4 (67): A G F D C.
    expect(replaced([65, 67, 69, 72, 74], {}, PENTATONIC)).toEqual([69, 67, 65, 62, 60])
    // D major turns round E: F sharp becomes D.
    expect(replaced([66, 69, 62], {}, { root: 2, steps: [0, 2, 4, 5, 7, 9, 11] })).toEqual([
      62, 59, 66,
    ])
  })

  it('stays in a key that no note mirrors, by its steps', () => {
    // A harmonic minor round A3 (57): A B C D E F G# becomes A G# F E D C B.
    expect(replaced([57, 59, 60, 62, 64, 65, 68, 69], {}, HARMONIC_MINOR)).toEqual([
      57, 56, 53, 52, 50, 48, 47, 45,
    ])
    // B flat, a semitone over A, is a semitone under it.
    expect(mirrored(HARMONIC_MINOR, 58, 57)).toBe(56)
  })

  it('takes a scale of one note, of the whole tones and of all twelve', () => {
    expect(replaced([60, 72], {}, { root: 0, steps: [0] })).toEqual([60, 48])
    expect(replaced([60, 64], {}, { root: 0, steps: [0, 2, 4, 6, 8, 10] })).toEqual([60, 56])
    expect(
      replaced([60, 64], {}, { root: 0, steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }),
    ).toEqual([60, 56])
  })
})

describe('Mirror on D: where it lies', () => {
  it('has its axis an octave or a tritone up', () => {
    expect(axisNote(WHITE_KEYS, 4, false)).toBe(62)
    expect(axisNote(WHITE_KEYS, 4, true)).toBe(68)
    expect(replaced([60, 64, 67], { octave: 5 })).toEqual([88, 84, 81])
    expect(replaced([60, 64, 67], { octave: 3 })).toEqual([40, 36, 33])
    // Round G sharp: n becomes 136 - n.
    expect(replaced([60, 64, 67], { axis: 1 })).toEqual([76, 72, 69])
  })

  it('folds by octaves as far as it may, and never past the nearest', () => {
    expect([0, 1, 2, 3].map((most) => foldTowards(84, 40, most))).toEqual([84, 72, 60, 48])
    expect(foldTowards(84, 40, 9)).toBe(36)
    expect(foldTowards(62, 56, 3)).toBe(62)
    // E2 becomes C6, and C5, C4 and C3 with one, two and three octaves of fold.
    for (const foldBy of [0, 1]) {
      expect(replaced([40], { fold: 0, foldBy })).toEqual([84])
      expect(replaced([40], { fold: 1, foldBy })).toEqual([72])
      expect(replaced([40], { fold: 2, foldBy })).toEqual([60])
      expect(replaced([40], { fold: 3, foldBy })).toEqual([48])
    }
  })

  it('folds a phrase as one, so it keeps its shape', () => {
    // The two bars of the idea's own sketch: A B C, G A E.
    expect(replaced([69, 71, 72], { fold: 3 })).toEqual([67, 65, 64])
    expect(replaced([67, 69, 64], { fold: 3 })).toEqual([69, 67, 72])
    // Each by itself, the C has gone up where the line falls.
    expect(replaced([69, 71, 72], { fold: 3, foldBy: 1 })).toEqual([67, 65, 76])
  })

  it('folds a phrase anew once it has climbed out of reach', () => {
    // The A is 14 under. The F would be 30 under and begins again, A and C follow it, 20 under at
    // the most; the E would be 28 under and begins again.
    expect(replaced([50, 57, 65, 69, 72, 76], { fold: 3 })).toEqual([50, 43, 59, 55, 52, 72])
    // With no octave to move by it lies where it falls.
    expect(replaced([50, 57, 65], { fold: 0 })).toEqual([74, 67, 59])
  })

  it('folds each phrase anew after a rest', () => {
    const notes = [
      { atSec: 0, durSec: 1, note: 69 },
      { atSec: 1, durSec: 1, note: 71 },
      { atSec: 3, durSec: 1, note: 57 },
      { atSec: 4, durSec: 1, note: 59 },
    ]
    // A4 goes up one octave with its phrase; A3 comes down one with its own.
    expect(notesOf(made(MIRROR_ON_D, notes, { params: { ...REPLACE, fold: 3 } }))).toEqual([
      67, 65, 55, 53,
    ])
    expect(notesOf(made(MIRROR_ON_D, notes, { params: { ...REPLACE, fold: 3, rest: 2 } }))).toEqual(
      [67, 65, 79, 77],
    )
  })

  it('folds a chord by its middle, whichever note of it came first', () => {
    for (const notes of [
      [50, 57, 65, 72],
      [72, 65, 57, 50],
    ]) {
      const turned = notesOf(
        made(MIRROR_ON_D, chord(notes, 1), { params: { ...REPLACE, fold: 3 } }),
      )
      expect(turned.sort((a, b) => a - b)).toEqual([52, 59, 67, 74])
    }
    // Low in the bass, the whole chord comes down.
    const low = notesOf(
      made(MIRROR_ON_D, chord([36, 43, 52], 1), { params: { ...REPLACE, fold: 3 } }),
    )
    expect(low.sort((a, b) => a - b)).toEqual([36, 45, 52])
  })

  it('leaves what is below the axis, or above it, as it was', () => {
    const notes = [43, 52, 62, 67, 72]
    expect(replaced(notes, { turns: 1 })).toEqual([43, 52, 62, 57, 52])
    expect(replaced(notes, { turns: 2 })).toEqual([81, 72, 62, 67, 72])
    // Both, over a bass that stays: one voice for the bass, two for the rest.
    expect(
      times(made(MIRROR_ON_D, chord([48, 67], 1), { params: { turns: 1, level: 1 } })),
    ).toEqual([
      [0, 1, 48],
      [0, 1, 57],
      [0, 1, 67],
    ])
  })
})

describe('Mirror on D: when it sounds, and how hard', () => {
  it('comes late by the delay and is held as long as the note was', () => {
    expect(
      times(
        made(
          MIRROR_ON_D,
          line([
            [64, 1.5],
            [65, 0.5],
          ]),
          { params: { delay: 0.75 } },
        ),
      ),
    ).toEqual([
      [0, 1.5, 64],
      [0.75, 2.25, 60],
      [1.5, 2, 65],
      [2.25, 2.75, 59],
    ])
  })

  it('comes even when its note has long gone, and goes again', () => {
    expect(
      times(made(MIRROR_ON_D, [{ atSec: 0, durSec: 0.1, note: 67 }], { params: { delay: 8 } })),
    ).toEqual([
      [0, 0.1, 67],
      [8, 8.1, 57],
    ])
  })

  it('is as hard as its share of the note', () => {
    const notes = made(MIRROR_ON_D, [{ atSec: 0, durSec: 1, note: 67, gain: 0.5 }], {
      params: { level: 0.4 },
    })
    expect(notes.map(({ note, gain }) => [note, gain])).toEqual([
      [67, 0.5],
      [57, 0.2],
    ])
  })

  it('never takes the place of a played note with a softer one of its pitch', () => {
    // C and E are each other's mirror: the two of the chord are as hard as they were played.
    for (const level of [0, 0.3]) {
      for (const notes of [
        [60, 64],
        [64, 60],
      ]) {
        const made2 = made(MIRROR_ON_D, chord(notes, 1), { params: { level } })
        expect(made2.map(({ note, gain }) => [note, gain]).sort()).toEqual([
          [60, 0.8],
          [64, 0.8],
        ])
      }
    }
  })

  it('plays the mirror on its own part, where a D is two voices', () => {
    const notes = made(MIRROR_ON_D, chord([62, 64], 1), {
      params: { level: 1 },
      parts: { mirror: { deviceId: 'flute' } },
    })
    expect(notes.map(({ note, part }) => [note, part])).toEqual([
      [62, undefined],
      [62, 'mirror'],
      [64, undefined],
      [60, 'mirror'],
    ])
  })
})

describe('Mirror on D: answering', () => {
  const PHRASES = [
    { atSec: 0, durSec: 1, note: 69 },
    { atSec: 1, durSec: 1, note: 71 },
    { atSec: 2.6, durSec: 1, note: 69 },
    { atSec: 3.6, durSec: 1, note: 71 },
    { atSec: 5.5, durSec: 1, note: 69 },
    { atSec: 6.5, durSec: 1, note: 71 },
    { atSec: 8.5, durSec: 1, note: 69 },
  ]
  const answers = (params: Record<string, number>) =>
    notesOf(made(MIRROR_ON_D, PHRASES, { params: { ...ANSWER, ...params } }))

  it('plays a phrase as it is and turns the next', () => {
    expect(answers({})).toEqual([69, 71, 55, 53, 69, 71, 55])
  })

  it('takes the third back to where it was played, in a round of three', () => {
    expect(answers({ round: 1 })).toEqual([69, 71, 55, 53, 67, 65, 69])
  })

  it('ends a phrase at a rest as long as it was told, to the moment', () => {
    // The rests are 0.6, 0.9 and 1 s.
    expect(answers({ rest: 0.6 })).toEqual([69, 71, 55, 53, 69, 71, 55])
    expect(answers({ rest: 0.8 })).toEqual([69, 71, 69, 71, 55, 53, 69])
    expect(answers({ rest: 0.95 })).toEqual([69, 71, 69, 71, 69, 71, 55])
    expect(answers({ rest: 4 })).toEqual([69, 71, 69, 71, 69, 71, 69])
  })

  it('counts the strikes of a phrase that has no rest, a chord being one', () => {
    const legato = [
      ...chord([48, 52, 55], 2),
      ...chord([50, 53, 57], 2, 1.5),
      ...chord([52, 55, 59], 2, 3),
    ]
    const notes = made(MIRROR_ON_D, legato, { params: { ...ANSWER, strikes: 1 } })
    expect(notesOf(notes)).toEqual([48, 52, 55, 74, 71, 67, 52, 55, 59])
    // What began in one phrase ends when its key does, into the next.
    expect(times(notes).slice(0, 4)).toEqual([
      [0, 2, 48],
      [0, 2, 52],
      [0, 2, 55],
      [1.5, 3.5, 67],
    ])
    expect(replaced([64, 65, 67, 69, 71], { ...ANSWER, strikes: 2 })).toEqual([64, 65, 57, 55, 71])
  })

  it('answers over a bass that stays', () => {
    const notes = [
      { atSec: 0, durSec: 1, note: 67 },
      { atSec: 2, durSec: 2, note: 43 },
      { atSec: 2, durSec: 2, note: 67 },
    ]
    expect(notesOf(made(MIRROR_ON_D, notes, { params: { ...ANSWER, turns: 1 } }))).toEqual([
      67, 43, 57,
    ])
  })
})

describe('Mirror on D: under the hands', () => {
  it('moves a held mirror with the axis, the fold, the turns and the mode', () => {
    const { maker, at } = hand({ level: 1 })
    maker.noteOn(0, 1, 48, 0.8)
    expect(at(0)).toEqual([48, 76])
    maker.setParam(1, 'octave', 5)
    expect(at(1)).toEqual([48, 100])
    maker.setParam(2, 'octave', 4)
    maker.setParam(2, 'fold', 2)
    expect(at(2)).toEqual([48, 52])
    maker.setParam(3, 'mode', 0)
    expect(at(3)).toEqual([52])
    maker.setParam(4, 'turns', 1)
    expect(at(4)).toEqual([48])
    maker.setParam(5, 'turns', 0)
    maker.setParam(5, 'fold', 0)
    maker.setParam(5, 'axis', 1)
    expect(at(5)).toEqual([88])
    maker.setParam(6, 'mode', 2)
    expect(at(6)).toEqual([48])
    maker.noteOff(7, 1)
    expect(at(7)).toEqual([])
    maker.noteOn(8, 1, 48, 0.8)
    expect(at(8)).toEqual([88])
    maker.noteOff(9, 1)
    expect(at(9)).toEqual([])
  })

  it('moves a held mirror into another key', () => {
    const { maker, at } = hand({ ...REPLACE })
    maker.noteOn(0, 1, 60, 0.8)
    expect(at(0)).toEqual([64])
    // F major turns round G4, 67.
    maker.setKey(1, { root: 5, steps: [0, 2, 4, 5, 7, 9, 11] })
    expect(at(1)).toEqual([74])
    maker.noteOff(2, 1)
    expect(at(2)).toEqual([])
  })

  it('leaves a mirror that is still to come to its time', () => {
    const { maker, at } = hand({ level: 1, delay: 2 })
    maker.noteOn(0, 1, 48, 0.8)
    maker.setParam(1, 'octave', 3)
    maker.setParam(1, 'delay', 0)
    expect(at(1.9)).toEqual([48])
    expect(at(2)).toEqual([48, 52])
    maker.noteOff(3, 1)
    expect(at(4.9)).toEqual([52])
    expect(at(5)).toEqual([])
  })

  it('folds a chord that arrives a finger at a time as one', () => {
    const { maker, at } = hand({ ...REPLACE, fold: 3 })
    for (const [i, note] of [50, 57, 65, 72].entries()) maker.noteOn(i * 0.01, i, note, 0.8)
    expect(at(0.1)).toEqual([52, 59, 67, 74])
    for (const i of [0, 1, 2, 3]) maker.noteOff(1 + i * 0.01, i)
    expect(at(2)).toEqual([])
  })

  it('takes a repeated note and one key struck twice', () => {
    const { maker, at, gain } = hand({ level: 0.5 })
    maker.noteOn(0, 1, 64, 0.4)
    maker.noteOn(1, 2, 64, 1)
    expect(at(1)).toEqual([60, 64])
    expect(gain(60)).toBe(0.5)
    maker.noteOff(2, 1)
    expect(at(2)).toEqual([60, 64])
    maker.noteOn(3, 2, 65, 1)
    expect(at(3)).toEqual([59, 65])
    maker.noteOff(4, 2)
    expect(at(4)).toEqual([])
  })

  it('keeps a trill in order and ends it', () => {
    const { maker, at } = hand({ ...REPLACE, delay: 0.3 })
    for (let i = 0; i < 40; i += 1) {
      maker.noteOn(i * 0.03, i, i % 2 === 0 ? 64 : 65, 0.8)
      maker.noteOff(i * 0.03 + 0.025, i)
    }
    expect(at(1.2 + 0.2)).toEqual([60])
    expect(at(1.2 + 0.3)).toEqual([])
    expect(maker.next()).toBe(Infinity)
  })
})

makerContract(MIRROR_ON_D)
