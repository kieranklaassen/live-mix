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

  it('keeps the octaves of a phrase where no others would bring a note within reach', () => {
    // With one octave the mirror of C6 can come no nearer than E3.
    expect(replaced([50, 84], { fold: 1 })).toEqual([62, 28])
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

  it('takes a rest of exactly the length asked for as one, whatever the sum rounds to', () => {
    // 0.7 + 0.1 - 0.7 is a hair less than 0.1.
    const notes = [
      { atSec: 0, durSec: 0.7, note: 69 },
      { atSec: 0.7 + 0.1, durSec: 1, note: 69 },
    ]
    expect(notesOf(made(MIRROR_ON_D, notes, { params: { ...ANSWER, rest: 0.1 } }))).toEqual([
      69, 55,
    ])
  })

  it('brings the third of the round back by up to three octaves', () => {
    const notes = [0, 2, 4].map((atSec) => ({ atSec, durSec: 1, note: 40 }))
    expect(notesOf(made(MIRROR_ON_D, notes, { params: { ...ANSWER, round: 1 } }))).toEqual([
      40, 84, 48,
    ])
  })

  it('counts two chords to a phrase, however many notes they have', () => {
    const notes = [0, 1, 2, 3].flatMap((atSec) => chord([60, 64, 67], 1, atSec))
    expect(notesOf(made(MIRROR_ON_D, notes, { params: { ...ANSWER, strikes: 2 } }))).toEqual([
      60, 64, 67, 60, 64, 67, 64, 60, 57, 64, 60, 57,
    ])
  })

  it('begins as played when it is turned on between two phrases, or over held ones', () => {
    const { maker, at } = hand({ mode: 0, level: 1 })
    for (const i of [0, 1, 2]) {
      maker.noteOn(i * 2, i, 69, 0.8)
      maker.noteOff(i * 2 + 1, i)
    }
    maker.setParam(7, 'mode', 2)
    maker.noteOn(8, 4, 69, 0.8)
    expect(at(8)).toEqual([69])
    maker.noteOff(9, 4)
    maker.noteOn(11, 5, 69, 0.8)
    expect(at(11)).toEqual([55])
    maker.noteOff(12, 5)
    expect(at(12)).toEqual([])

    const held = hand({ mode: 0, level: 1, strikes: 1 })
    held.maker.noteOn(0, 1, 69, 0.8)
    held.maker.noteOn(1, 2, 71, 0.8)
    expect(held.at(1)).toEqual([53, 55])
    held.maker.setParam(2, 'mode', 2)
    expect(held.at(2)).toEqual([69, 71])
    held.maker.noteOn(3, 3, 72, 0.8)
    expect(held.at(3)).toEqual([52, 69, 71])

    // One key held from an earlier phrase than the one that has just been let go.
    for (const before of [true, false]) {
      const { maker: apart, at: sounds } = hand({ mode: 0, level: 1, strikes: 1 })
      if (before) {
        apart.noteOn(0, 1, 64, 0.8)
        apart.noteOff(0.5, 1)
      }
      apart.noteOn(0.6, 2, 69, 0.8)
      apart.noteOn(1, 3, 71, 0.8)
      apart.noteOff(1.5, 3)
      apart.setParam(2, 'mode', 2)
      expect(sounds(2)).toEqual([69])
      apart.noteOn(3, 4, 72, 0.8)
      expect(sounds(3)).toEqual([52, 69])
    }
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

describe('Mirror on D: fingers that do not land together', () => {
  /** Every note begun so far, `[seconds, note, gain]`, to the millisecond and the hundredth. */
  function struck(params: Record<string, number>, parts?: string[]) {
    const maker = MIRROR_ON_D.create({ params, parts })
    const begun: [number, number, number][] = []
    const open = new Map<number, number>()
    const to = (sec: number): number[] => {
      maker.advance(sec, (event) => {
        if (!event.on) {
          open.delete(event.id)
          return
        }
        open.set(event.id, event.note)
        begun.push([
          Math.round(event.atSec * 1000) / 1000,
          event.note,
          Math.round(event.gain * 100) / 100,
        ])
      })
      return [...open.values()].sort((a, b) => a - b)
    }
    const spread = (notes: readonly number[], gapSec: number, gain = 0.8, atSec = 0): void => {
      for (const [i, note] of notes.entries()) {
        maker.noteOn(atSec + i * gapSec, i, note, gain)
        to(atSec + i * gapSec)
      }
    }
    return { maker, begun, to, spread }
  }

  it('strikes each mirror of a folded chord once, when the chord is whole', () => {
    for (const gap of [0, 0.01, 0.02]) {
      const { maker, begun, to, spread } = struck({ ...REPLACE, fold: 3 })
      spread([50, 57, 65, 72], gap)
      to(1)
      expect(begun).toEqual([
        [0.065, 74, 0.8],
        [0.065, 67, 0.8],
        [0.065, 59, 0.8],
        [0.065, 52, 0.8],
      ])
      for (const i of [3, 1, 2, 0]) maker.noteOff(2, i)
      expect(to(2)).toEqual([52, 59, 67, 74])
      expect(to(2.07)).toEqual([])
    }
  })

  it('waits for nothing where nothing can move a mirror', () => {
    const settled: Record<string, number>[] = [
      { fold: 0 },
      { fold: 3, foldBy: 1 },
      { fold: 3, turns: 1 },
      { mode: 2, fold: 3 },
    ]
    for (const params of settled) {
      const { begun, spread } = struck({ ...REPLACE, ...params })
      spread([40], 0)
      expect(begun.map(([sec]) => sec)).toEqual([0])
    }
    const { begun, spread, to } = struck({ ...REPLACE, fold: 3, delay: 0.5 })
    spread([69], 0)
    to(2)
    expect(begun).toEqual([[0.5, 67, 0.8]])
  })

  it('folds a chord of taps by all of it, the keys let go before it was whole among them', () => {
    const { maker, begun, to } = struck({ ...REPLACE, fold: 3 })
    for (const [i, note] of [50, 57, 65, 72].entries()) {
      maker.noteOn(i * 0.02, i, note, 0.8)
      maker.noteOff(i * 0.02 + 0.015, i)
    }
    expect(to(1)).toEqual([])
    expect(begun.map(([, note]) => note)).toEqual([74, 67, 59, 52])
  })

  it('strikes a note once that is played and mirrored in one chord', () => {
    const { maker, begun, to, spread } = struck({ level: 0.7 })
    spread([60, 64], 0.03)
    to(1)
    // The E was struck as the mirror of the C, and the E's mirror is the C that was played.
    expect(begun).toEqual([
      [0, 60, 0.8],
      [0, 64, 0.56],
    ])
    // Each sounds for as long as either of its two keys is held.
    maker.noteOff(2, 0)
    expect(to(2)).toEqual([60, 64])
    maker.noteOff(3, 1)
    expect(to(3)).toEqual([])
    spread([60, 64], 0.03, 0.8, 4)
    maker.noteOff(5, 1)
    expect(to(5)).toEqual([60, 64])
    maker.noteOff(6, 0)
    expect(to(6)).toEqual([])
  })

  it('strikes it again where the mirror was much the softer, or the two are further apart', () => {
    const soft = struck({ level: 0.3 })
    soft.spread([60, 64], 0.03)
    expect(soft.begun).toEqual([
      [0, 60, 0.8],
      [0, 64, 0.24],
      [0.03, 64, 0.8],
    ])
    const apart = struck({ level: 0.7 })
    apart.spread([60, 64], 0.2)
    expect(apart.begun.slice(2)).toEqual([
      [0.2, 64, 0.8],
      [0.2, 60, 0.56],
    ])
    // A mirror harder than the note that was played is struck.
    const hard = struck({ level: 1 })
    hard.maker.noteOn(0, 1, 60, 0.2)
    hard.maker.noteOn(0.03, 2, 64, 0.9)
    hard.to(1)
    expect(hard.begun.filter(([, note]) => note === 60)).toEqual([
      [0, 60, 0.2],
      [0.03, 60, 0.9],
    ])
  })

  it('is as hard as it was played when the two begin as one, the mirror of a key let go too', () => {
    const { begun, spread } = struck({ level: 0.7 })
    spread([60, 64], 0.01)
    expect(begun.filter(([, note]) => note === 64)).toEqual([
      [0, 64, 0.56],
      [0.01, 64, 0.8],
    ])
    const late = struck({ level: 0.3, delay: 0.5 })
    late.maker.noteOn(0, 1, 60, 0.8)
    late.maker.noteOff(0.1, 1)
    late.maker.noteOn(0.51, 2, 64, 0.8)
    expect(late.to(0.55)).toEqual([64])
    expect(late.begun.slice(1)).toEqual([
      [0.5, 64, 0.24],
      [0.51, 64, 0.8],
    ])
    // A softer note joins a harder mirror.
    const hard = struck({ level: 1 })
    hard.maker.noteOn(0, 1, 60, 1)
    hard.maker.noteOn(0.01, 2, 64, 0.2)
    hard.to(1)
    expect(hard.begun.filter(([, note]) => note === 64)).toEqual([[0, 64, 1]])
  })

  it('ends a note three share with the last of them', () => {
    const { maker, to } = struck({ level: 0.7 })
    maker.noteOn(0, 1, 60, 0.8)
    maker.noteOn(0.03, 2, 64, 0.8)
    maker.noteOn(0.04, 3, 64, 0.8)
    maker.noteOff(1, 1)
    maker.noteOff(1, 2)
    expect(to(1)).toEqual([60, 64])
    maker.noteOff(2, 3)
    expect(to(2)).toEqual([])
    expect(maker.next()).toBe(Infinity)
  })

  it('strikes both where the mirror has an instrument of its own', () => {
    const { begun, spread } = struck({ level: 0.7 }, ['mirror'])
    spread([60, 64], 0.03)
    expect(begun).toEqual([
      [0, 60, 0.8],
      [0, 64, 0.56],
      [0.03, 64, 0.8],
      [0.03, 60, 0.56],
    ])
  })

  it('counts a chord spread over 60 ms as one strike, and a fast run as many', () => {
    const { maker, begun, spread } = struck({ ...ANSWER, strikes: 1 })
    spread([60, 64, 67], 0.03)
    for (const i of [0, 1, 2]) maker.noteOff(1, i)
    spread([60, 64, 67], 0.03, 0.8, 2)
    expect(begun.map(([, note]) => note)).toEqual([60, 64, 67, 64, 60, 57])
    const run = struck({ ...ANSWER, strikes: 1 })
    run.spread([60, 62, 64, 65], 0.08)
    expect(run.begun.map(([, note]) => note)).toEqual([60, 62, 64, 59])
  })
})

describe('Mirror on D: what is still to come', () => {
  it('leaves a held note as it was when its mirror has no level', () => {
    const { maker, at, gain } = hand({ level: 0, delay: 1 })
    maker.noteOn(0, 1, 62, 0.8)
    expect(at(2)).toEqual([62])
    expect(gain(62)).toBe(0.8)
  })

  it('brings the mirror of a key let go into a new key, sounding or to come', () => {
    const { maker, at } = hand({ ...REPLACE, delay: 4 })
    maker.noteOn(0, 1, 65, 0.8)
    maker.noteOff(1, 1)
    // D major turns round E4 (64), where F becomes E flat; on the white keys it becomes B.
    maker.setKey(2, { root: 2, steps: [0, 2, 4, 5, 7, 9, 11] })
    expect(at(4)).toEqual([63])
    maker.setKey(4.5, WHITE_KEYS)
    expect(at(4.5)).toEqual([59])
    expect(at(5)).toEqual([])
    expect(maker.next()).toBe(Infinity)
  })

  it('folds by what is held once a control has moved', () => {
    const { maker, at } = hand({ ...REPLACE, fold: 3 })
    maker.noteOn(0, 1, 55, 0.8)
    maker.noteOn(1, 2, 60, 0.8)
    expect(at(1)).toEqual([52, 57])
    maker.noteOff(2, 1)
    maker.setParam(3, 'round', 1)
    expect(at(3)).toEqual([64])
  })

  it('moves held notes no oftener than twenty times a second, and ends where the control does', () => {
    const maker = MIRROR_ON_D.create({ params: { mode: 0, level: 1 } })
    const open = new Map<number, number>()
    let begun = 0
    const emit = (event: MadeEvent): void => {
      if (event.on) {
        begun += 1
        open.set(event.id, event.note)
      } else open.delete(event.id)
    }
    maker.noteOn(0, 1, 60, 0.8)
    for (let i = 0; i < 200; i += 1) maker.setParam(1 + i * 0.005, 'octave', 3 + (i % 3))
    maker.setParam(2, 'octave', 6)
    maker.advance(2.06, emit)
    expect(begun).toBeGreaterThan(10)
    expect(begun).toBeLessThanOrEqual(23)
    expect([...open.values()]).toEqual([112])
    maker.noteOff(3, 1)
    maker.advance(3, emit)
    expect(open.size).toBe(0)
    // Silenced with a move to come, it still moves afterwards.
    maker.setParam(4, 'octave', 4)
    maker.setParam(4.01, 'octave', 3)
    maker.silence(4.02, emit)
    maker.noteOn(5, 1, 60, 0.8)
    maker.setParam(6, 'octave', 4)
    maker.advance(6, emit)
    expect([...open.values()]).toEqual([64])
  })

  it('keeps nothing of what was played, however long Answer goes on', () => {
    const { maker, at } = hand({ ...ANSWER, rest: 0.3, delay: 1 })
    for (let i = 0; i < 2000; i += 1) {
      maker.noteOn(i * 0.5, i, 60 + (i % 5), 0.8)
      maker.noteOff(i * 0.5 + 0.1, i)
      at(i * 0.5 + 0.1)
    }
    const kept = maker as unknown as Record<'voices' | 'tails' | 'shared', { size: number }>
    expect(at(1001.2)).toEqual([])
    expect(maker.next()).toBe(Infinity)
    const sizes = () => [kept.voices.size, kept.tails.size, kept.shared.size]
    expect(sizes()).toEqual([0, 0, 0])
    maker.setParam(1002, 'mode', 1)
    maker.setParam(1002, 'delay', 0.03)
    maker.noteOn(1002, 1, 60, 0.8)
    maker.noteOn(1002.01, 2, 64, 0.8)
    maker.noteOff(1002.035, 1)
    expect(sizes()).toEqual([1, 1, 1])
    maker.silence(1002.05, () => undefined)
    expect(sizes()).toEqual([0, 0, 0])
  })
})

makerContract(MIRROR_ON_D)
