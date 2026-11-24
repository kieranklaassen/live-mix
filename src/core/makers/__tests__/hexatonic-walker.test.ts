import { describe, expect, it } from 'vitest'

import { HEXATONIC_WALKER } from '../hexatonic-walker'
import { type MadePhraseNote } from '../phrase'
import { type MadeEvent, type MakerKey, WHITE_KEYS } from '../types'
import { A_MINOR, chord, made, makerContract, notesOf, PENTATONIC } from './support'

const C_MAJOR = [60, 64, 67]
const PARTS = { bass: { deviceId: 'organ' }, top: { deviceId: 'flute' } }
/** A chord each second, with the voices a tenth of a second apart where they come in together. */
const QUICK = { time: 1, step: 0.1 }
const WORD = {
  pl: 0,
  lp: 1,
  rl: 2,
  lr: 3,
  pr: 4,
  prrp: 5,
  root: 6,
  third: 7,
  fifth: 8,
  own: 9,
  wander: 10,
}

/** What sounds at a moment, low to high, of one part or of the three voices. */
function soundingAt(phrase: readonly MadePhraseNote[], atSec: number, part?: string): number[] {
  return phrase
    .filter((n) => n.part === part && n.atSec <= atSec && n.atSec + n.durSec > atSec)
    .map((n) => n.note)
    .sort((a, b) => a - b)
}

/** The chords of a walk of a chord a second, each read near its end. */
function walk(
  params: Record<string, number>,
  count: number,
  notes: readonly number[] = C_MAJOR,
  key: MakerKey = WHITE_KEYS,
): number[][] {
  const phrase = made(
    HEXATONIC_WALKER,
    chord(notes, count + 0.02),
    { params: { ...QUICK, ...params }, key, parts: PARTS },
    count + 1,
  )
  return Array.from({ length: count }, (_, i) => soundingAt(phrase, i + 0.95))
}

/** The same chords as pitch classes. */
function classes(chords: readonly number[][]): number[][] {
  return chords.map((notes) => notes.map((note) => note % 12).sort((a, b) => a - b))
}

/** A maker played by hand, with what it wrote and what sounds. */
function byHand(params: Record<string, number>, key: MakerKey = WHITE_KEYS) {
  const maker = HEXATONIC_WALKER.create({ params, key, parts: ['bass', 'top'] })
  const events: MadeEvent[] = []
  const open = new Map<number, number>()
  const emit = (event: MadeEvent): void => {
    events.push(event)
    if (event.on) open.set(event.id, event.note)
    else open.delete(event.id)
  }
  return {
    maker,
    events,
    to: (atSec: number): number[] => {
      maker.advance(atSec, emit)
      return [...open.values()].sort((a, b) => a - b)
    },
    strike: (atSec: number, notes: readonly number[], from = 0): void => {
      notes.forEach((note, i) => maker.noteOn(atSec, from + i, note, 0.8))
    },
    lift: (atSec: number, count: number, from = 0): void => {
      for (let i = 0; i < count; i += 1) maker.noteOff(atSec, from + i)
    },
  }
}

describe('Hexatonic Walker: the moves', () => {
  it('walks P L P L P L from C: C Cm Ab Abm E Em and C again, one voice a step', () => {
    expect(walk({}, 7)).toEqual([
      [60, 64, 67],
      [60, 63, 67],
      [60, 63, 68],
      [59, 63, 68],
      [59, 64, 68],
      [59, 64, 67],
      [60, 64, 67],
    ])
  })

  it('strikes only the voice that moves, and holds the two that stay', () => {
    const phrase = made(HEXATONIC_WALKER, chord(C_MAJOR, 6.5), { params: { ...QUICK, time: 2 } }, 8)
    expect(notesOf(phrase)).toEqual([60, 64, 67, 63, 68, 59])
    // C is held through C, Cm and Ab, and goes where B comes. Keys are read 0.03 s after they go down.
    const [c] = phrase
    expect(c.durSec).toBeCloseTo(6, 5)
    expect(phrase[3].atSec).toBeCloseTo(2.03, 5)
    expect(phrase[4].atSec).toBeCloseTo(4.03, 5)
  })

  it('walks the cycle the other way with L first: C Em E Abm Ab Cm', () => {
    expect(walk({ word: WORD.lp }, 7)).toEqual([
      [60, 64, 67],
      [59, 64, 67],
      [59, 64, 68],
      [59, 63, 68],
      [60, 63, 68],
      [60, 63, 67],
      [60, 64, 67],
    ])
  })

  it('walks R L from C: C Am F Dm, and on to Bb', () => {
    expect(walk({ word: WORD.rl }, 5)).toEqual([
      [60, 64, 67],
      [60, 64, 69],
      [60, 65, 69],
      [62, 65, 69],
      [62, 65, 70],
    ])
  })

  it('walks L R from C up by thirds: C Em G Bm', () => {
    expect(walk({ word: WORD.lr }, 4)).toEqual([
      [60, 64, 67],
      [59, 64, 67],
      [59, 62, 67],
      [59, 62, 66],
    ])
  })

  it('walks P R through the minor thirds: C Cm Eb Ebm Gb Gbm A Am C', () => {
    expect(classes(walk({ word: WORD.pr }, 9))).toEqual([
      [0, 4, 7],
      [0, 3, 7],
      [3, 7, 10],
      [3, 6, 10],
      [1, 6, 10],
      [1, 6, 9],
      [1, 4, 9],
      [0, 4, 9],
      [0, 4, 7],
    ])
  })

  it('walks P R R P round the four chords C Cm Eb Cm', () => {
    expect(walk({ word: WORD.prrp }, 6)).toEqual([
      [60, 64, 67],
      [60, 63, 67],
      [58, 63, 67],
      [60, 63, 67],
      [60, 64, 67],
      [60, 63, 67],
    ])
  })

  it('walks the six chords that share a note, from a major chord and from a minor one', () => {
    // C Am F Fm Ab Cm: all have C.
    expect(classes(walk({ word: WORD.root }, 7))).toEqual([
      [0, 4, 7],
      [0, 4, 9],
      [0, 5, 9],
      [0, 5, 8],
      [0, 3, 8],
      [0, 3, 7],
      [0, 4, 7],
    ])
    // C Am A C#m E Em: all have E.
    expect(classes(walk({ word: WORD.third }, 7))).toEqual([
      [0, 4, 7],
      [0, 4, 9],
      [1, 4, 9],
      [1, 4, 8],
      [4, 8, 11],
      [4, 7, 11],
      [0, 4, 7],
    ])
    // C Em G Gm Eb Cm: all have G.
    expect(classes(walk({ word: WORD.fifth }, 7))).toEqual([
      [0, 4, 7],
      [4, 7, 11],
      [2, 7, 11],
      [2, 7, 10],
      [3, 7, 10],
      [0, 3, 7],
      [0, 4, 7],
    ])
    // D minor: D, F and A stay in turn.
    for (const [word, held] of [
      [WORD.root, 2],
      [WORD.third, 5],
      [WORD.fifth, 9],
    ]) {
      const chords = classes(walk({ word }, 7, [62, 65, 69]))
      for (const notes of chords) expect(notes).toContain(held)
      expect(new Set(chords.slice(0, 6).map(String)).size).toBe(6)
      expect(chords[6]).toEqual([2, 5, 9])
    }
  })

  it('passes over chords where a change is more than one move', () => {
    // P L: C Ab E C. P L P: C and Abm, the far pole, which shares no note with it.
    expect(classes(walk({ moves: 2 }, 4))).toEqual([
      [0, 4, 7],
      [0, 3, 8],
      [4, 8, 11],
      [0, 4, 7],
    ])
    expect(walk({ moves: 3 }, 3)).toEqual([
      [60, 64, 67],
      [59, 63, 68],
      [60, 64, 67],
    ])
    // R L: C F Bb Eb.
    expect(classes(walk({ word: WORD.rl, moves: 2 }, 4))).toEqual([
      [0, 4, 7],
      [0, 5, 9],
      [2, 5, 10],
      [3, 7, 10],
    ])
  })

  it('turns back the way it came', () => {
    // C Am F, back over Am to C, and out again.
    expect(classes(walk({ word: WORD.rl, turn: 5 }, 7))).toEqual([
      [0, 4, 7],
      [0, 4, 9],
      [0, 5, 9],
      [0, 4, 9],
      [0, 4, 7],
      [0, 4, 9],
      [0, 5, 9],
    ])
  })

  it('is always a major or a minor triad, and stays near where it began', () => {
    const triads = new Set<string>()
    for (let root = 0; root < 12; root += 1) {
      for (const third of [3, 4]) {
        triads.add(String([root, (root + third) % 12, (root + 7) % 12].sort((a, b) => a - b)))
      }
    }
    for (let word = 0; word <= 10; word += 1) {
      for (const moves of [1, 2, 3]) {
        const chords = walk({ word, moves, seed: 7 }, 60)
        for (const [i, notes] of classes(chords).entries())
          expect(triads.has(String(notes)), `word ${word}, moves ${moves}, chord ${i}`).toBe(true)
        for (const notes of chords) {
          expect(notes[2] - notes[0]).toBeLessThanOrEqual(12)
          expect(notes[0]).toBeGreaterThan(48)
          expect(notes[2]).toBeLessThan(80)
        }
      }
    }
  })

  it('draws a word, or a way, from its seed, and the same seed draws the same', () => {
    for (const word of [WORD.own, WORD.wander]) {
      const ways = [1, 2, 3, 4, 5, 6].map((seed) => String(walk({ word, seed }, 12)))
      expect(new Set(ways).size).toBeGreaterThan(3)
      expect(ways[2]).toBe(String(walk({ word, seed: 3 }, 12)))
    }
    // Wander never goes straight back.
    const chords = classes(walk({ word: WORD.wander, seed: 4 }, 40)).map(String)
    for (let i = 2; i < chords.length; i += 1) expect(chords[i]).not.toBe(chords[i - 2])
  })
})

describe('Hexatonic Walker: the key', () => {
  it('keeps to the white keys where it is asked to: C Am F Dm, and back over F', () => {
    expect(classes(walk({ word: WORD.rl, keep: 2 }, 10))).toEqual([
      [0, 4, 7],
      [0, 4, 9],
      [0, 5, 9],
      [2, 5, 9],
      [0, 5, 9],
      [0, 4, 9],
      [0, 4, 7],
      [4, 7, 11],
      [2, 7, 11],
      [4, 7, 11],
    ])
  })

  it('never leaves the key in key, and nearly keeps two notes of three in it', () => {
    for (const key of [WHITE_KEYS, A_MINOR, PENTATONIC]) {
      const inside = (note: number): boolean => key.steps.includes((note - key.root + 120) % 12)
      for (let word = 0; word <= 10; word += 1) {
        for (const note of [57, 60, 62, 65]) {
          for (const notes of walk({ word, keep: 2 }, 20, [note], key))
            expect(notes.every(inside), `word ${word} from ${note}: ${String(notes)}`).toBe(true)
          for (const notes of walk({ word, keep: 1 }, 20, [note], key))
            expect(notes.filter(inside).length).toBeGreaterThanOrEqual(2)
        }
      }
    }
  })

  it('has a walk of two chords in the pentatonic scale: F and D minor', () => {
    expect(classes(walk({ keep: 2 }, 4, [65], PENTATONIC))).toEqual([
      [0, 5, 9],
      [2, 5, 9],
      [0, 5, 9],
      [2, 5, 9],
    ])
  })

  it('goes on where the key has no triad at all, and where it has one', () => {
    const wholeTone = { root: 0, steps: [0, 2, 4, 6, 8, 10] }
    expect(new Set(walk({ keep: 2 }, 8, [60], wholeTone).map(String)).size).toBeGreaterThan(1)
    const onlyC = { root: 0, steps: [0, 4, 7, 10, 11].slice(0, 3) }
    expect(classes(walk({ keep: 2 }, 3, [60], onlyC))).toEqual([
      [0, 4, 7],
      [0, 4, 7],
      [0, 4, 7],
    ])
  })
})

describe('Hexatonic Walker: what is played', () => {
  const starts = (notes: readonly number[], key = WHITE_KEYS, keep = 0): number[] =>
    classes(walk({ keep }, 1, notes, key))[0]

  it('takes one note as the root of the triad the key has on it', () => {
    expect(starts([60])).toEqual([0, 4, 7])
    expect(starts([62])).toEqual([2, 5, 9])
    expect(starts([69])).toEqual([0, 4, 9])
    expect(starts([57], A_MINOR)).toEqual([0, 4, 9])
    // B has no major or minor triad in the key: B minor, or in key E minor, which has it.
    expect(starts([59])).toEqual([2, 6, 11])
    expect(starts([59], WHITE_KEYS, 2)).toEqual([4, 7, 11])
  })

  it('reads chords in any order, with more notes and with fewer', () => {
    expect(starts([64, 67, 72])).toEqual([0, 4, 7])
    expect(starts([60, 63, 67])).toEqual([0, 3, 7])
    expect(starts([50, 57, 65, 72, 76])).toEqual([2, 5, 9])
    expect(starts([57, 60, 64, 67])).toEqual([0, 4, 9])
    expect(starts([60, 64, 67, 69])).toEqual([0, 4, 7])
    expect(starts([50, 57])).toEqual([2, 5, 9])
    expect(starts([53, 57, 60, 64])).toEqual([0, 5, 9])
    expect(starts([60, 65, 67])).toEqual([0, 4, 7])
  })

  it('begins again from a chord struck over the one that is held', () => {
    const hand = byHand(QUICK)
    hand.strike(0, C_MAJOR)
    expect(hand.to(1.9)).toEqual([60, 63, 67])
    hand.strike(2.5, [65, 69, 72], 10)
    expect(hand.to(3.4)).toEqual([65, 69, 72])
    // P from F, a second after it was read.
    expect(hand.to(3.6)).toEqual([65, 68, 72])
    hand.lift(3.7, 3)
    expect(hand.to(4.6)).toEqual([65, 68, 73])
    hand.lift(5, 3, 10)
    expect(hand.to(5)).toEqual([])
    expect(hand.maker.next()).toBe(Infinity)
  })

  it('takes a note added to a chord into account, and holds a voice both chords have', () => {
    const hand = byHand(QUICK)
    hand.strike(0, C_MAJOR)
    hand.to(0.5)
    hand.strike(0.5, [69], 10)
    // C E G and A, the A just struck: A minor, with C and E of C major still sounding.
    const before = hand.events.length
    expect(hand.to(0.9).map((note) => note % 12)).toEqual([0, 4, 9])
    expect(hand.events.slice(before).map((event) => [event.on, event.note])).toEqual([
      [false, 67],
      [true, 69],
    ])
  })

  it('ends everything when the last key goes, and nothing before', () => {
    for (let rhythm = 0; rhythm <= 4; rhythm += 1) {
      const hand = byHand({ ...QUICK, rhythm, bass: 1, top: 1, ring: 0.5 })
      hand.strike(0, C_MAJOR)
      hand.to(2.8)
      hand.lift(2.8, 2)
      expect(hand.to(3.9).length).toBeGreaterThan(0)
      hand.lift(4, 1, 2)
      expect(hand.to(4)).toEqual([])
      const count = hand.events.length
      hand.to(30)
      expect(hand.events.length).toBe(count)
    }
  })

  it('sounds a chord that was let go before it was read, and lets go of it', () => {
    const hand = byHand(QUICK)
    hand.strike(0, C_MAJOR)
    hand.lift(0.01, 3)
    expect(hand.to(0.035)).toEqual([60])
    expect(hand.to(0.2)).toEqual([])
    // Very fast: there is a chord all through, and nothing after.
    for (let i = 0; i < 100; i += 1) {
      if (i > 3) expect(hand.to(1 + i * 0.02).length).toBeGreaterThan(0)
      hand.strike(1 + i * 0.02, [60 + (i % 7)], 20 + i)
      hand.lift(1.012 + i * 0.02, 1, 20 + i)
    }
    expect(hand.to(4)).toEqual([])
  })

  it('keeps a low chord clear, and follows the hand where it is high', () => {
    expect(walk({}, 1, [36, 40, 43])).toEqual([[60, 64, 67]])
    expect(walk({}, 1, [72, 76, 79])).toEqual([[72, 76, 79]])
    expect(walk({}, 1, [96, 100, 103])).toEqual([[72, 76, 79]])
    expect(walk({ octave: 1 }, 1)).toEqual([[72, 76, 79]])
    expect(walk({ octave: -1 }, 1)).toEqual([[48, 52, 55]])
  })
})

describe('Hexatonic Walker: the rhythm and the other voices', () => {
  const struck = (params: Record<string, number>, toSec: number): [number, number][] =>
    made(HEXATONIC_WALKER, chord(C_MAJOR, toSec), { params, parts: PARTS }, toSec + 1)
      .filter((note) => note.part === undefined)
      .map((note) => [Math.round((note.atSec - 0.03) * 100) / 100, note.note])

  it('staggers: the voice that moved, then those that stay', () => {
    expect(struck({ rhythm: 1, time: 2, step: 0.3 }, 3.5)).toEqual([
      [0, 60],
      [0.3, 64],
      [0.6, 67],
      [2, 63],
      [2.3, 60],
      [2.6, 67],
    ])
  })

  it('breaks the chord up, down and rocking, from the voice that moved', () => {
    expect(struck({ rhythm: 2, time: 2, step: 0.5 }, 3.9)).toEqual([
      [0, 60],
      [0.5, 64],
      [1, 67],
      [1.5, 60],
      [2, 63],
      [2.5, 67],
      [3, 60],
      [3.5, 63],
    ])
    expect(struck({ rhythm: 3, time: 2, step: 0.5 }, 3.9).map(([, note]) => note)).toEqual([
      67, 64, 60, 67, 63, 60, 67, 63,
    ])
    expect(struck({ rhythm: 4, time: 2, step: 0.5 }, 3.9).map(([, note]) => note)).toEqual([
      60, 67, 64, 67, 63, 67, 60, 67,
    ])
  })

  it('leaves out a step that would run into the next chord', () => {
    expect(struck({ rhythm: 2, time: 1, step: 0.3 }, 1.2)).toEqual([
      [0, 60],
      [0.3, 64],
      [0.6, 67],
      [1, 63],
    ])
  })

  it('holds a note of a broken chord as long as it is told', () => {
    const ring = (share: number): number =>
      made(
        HEXATONIC_WALKER,
        chord(C_MAJOR, 4),
        { params: { rhythm: 2, time: 10, step: 0.5, ring: share } },
        5,
      )[0].durSec
    expect(ring(1)).toBeCloseTo(1.5, 5)
    expect(ring(0.5)).toBeCloseTo(0.75, 5)
    expect(ring(0.2)).toBeCloseTo(0.3, 5)
  })

  it('puts the root of each chord under it, or the first root under all of them', () => {
    const bass = (mode: number): [number, number][] =>
      made(
        HEXATONIC_WALKER,
        chord(C_MAJOR, 6.02),
        { params: { ...QUICK, bass: mode }, parts: PARTS },
        7,
      )
        .filter((note) => note.part === 'bass')
        .map((note) => [note.note, Math.round(note.durSec)])
    expect(bass(1)).toEqual([
      [36, 2],
      [32, 2],
      [40, 2],
    ])
    expect(bass(2)).toEqual([[36, 6]])
    expect(bass(0)).toEqual([])
  })

  it('has a high voice half way through, on the note that moved or on one that stayed', () => {
    // The note that moved, and how long: to the next chord where that lacks it.
    const top = (mode: number): [number, number, number][] =>
      made(
        HEXATONIC_WALKER,
        chord(C_MAJOR, 3.9),
        { params: { ...QUICK, top: mode }, parts: PARTS },
        5,
      )
        .filter((note) => note.part === 'top')
        .map((note) => [
          Math.round((note.atSec - 0.03) * 10) / 10,
          note.note,
          Math.round((note.durSec + 0.01) * 10) / 10,
        ])
    // C, Cm, Ab, Abm: the G is in Cm and the E flat in Ab, the G no longer in Ab.
    expect(top(1)).toEqual([
      [0.5, 79, 1],
      [1.5, 75, 1],
      [2.5, 80, 1],
      [3.5, 71, 0.4],
    ])
    expect(top(2)).toEqual([
      [0.5, 79, 1],
      [1.5, 79, 0.5],
      [2.5, 75, 1],
      [3.5, 80, 0.4],
    ])
  })

  it('takes a control that moves in the middle, at once and with nothing left over', () => {
    const hand = byHand({ ...QUICK, time: 20, bass: 1 })
    hand.strike(0, C_MAJOR)
    expect(hand.to(2)).toEqual([36, 60, 64, 67])
    hand.maker.setParam(2, 'bass', 0)
    expect(hand.to(2)).toEqual([60, 64, 67])
    hand.maker.setParam(2.5, 'octave', 1)
    expect(hand.to(3)).toEqual([72, 76, 79])
    hand.maker.setParam(3, 'octave', 0)
    expect(hand.to(3.5)).toEqual([60, 64, 67])
    // A shorter chord time that is already over: the next chord now.
    hand.maker.setParam(4, 'time', 3)
    expect(hand.to(4.2)).toEqual([60, 63, 67])
    hand.maker.setParam(4.3, 'word', WORD.rl)
    expect(hand.to(7.2).map((note) => note % 12)).toEqual([10, 3, 7])
    hand.maker.setParam(7.3, 'rhythm', 2)
    hand.maker.setParam(7.4, 'ring', 0.1)
    expect(hand.to(8.9).length).toBeLessThanOrEqual(2)
    hand.maker.setParam(9, 'rhythm', 0)
    expect(hand.to(9.5)).toHaveLength(3)
    hand.lift(10, 3)
    expect(hand.to(10)).toEqual([])
  })

  it('keeps a broken chord going when its chord time grows or its step shrinks', () => {
    const hand = byHand({ time: 2, step: 0.8, rhythm: 2 })
    hand.strike(0, C_MAJOR)
    hand.to(1.9)
    hand.maker.setParam(1.9, 'time', 8)
    hand.to(3)
    const after = hand.events.filter((event) => event.on && event.atSec > 1.8)
    expect(after.length).toBeGreaterThan(0)
    hand.maker.setParam(3, 'step', 0.1)
    const before = hand.events.length
    hand.to(3.3)
    expect(hand.events.length).toBeGreaterThan(before + 3)
  })
})

makerContract(HEXATONIC_WALKER)
