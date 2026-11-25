import { describe, expect, it } from 'vitest'

import { classesOf, HEXATONIC_WALKER, moved, type Move } from '../hexatonic-walker'
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

  it('goes on where two moves would undo each other', () => {
    // From the second chord of P R R P, two moves at a time: R R is one move more, R R P.
    const hand = byHand({ ...QUICK, word: WORD.prrp })
    hand.strike(0, C_MAJOR)
    hand.to(1.5)
    hand.maker.setParam(1.5, 'moves', 2)
    const chords = Array.from({ length: 12 }, (_, i) => String(hand.to(1.9 + i)))
    for (let i = 1; i < chords.length; i += 1) expect(chords[i]).not.toBe(chords[i - 1])
    for (const keep of [1, 2])
      for (let word = 0; word <= 10; word += 1)
        for (const key of [WHITE_KEYS, PENTATONIC]) {
          const kept = walk({ word, keep, moves: 2 }, 20, [65], key).map(String)
          for (let i = 1; i < kept.length; i += 1)
            expect(kept[i], `word ${word}, keep ${keep}, chord ${i}`).not.toBe(kept[i - 1])
        }
  })

  it('goes back to where a control was moved, and out again on the same word', () => {
    // C Am, then the moves go two out from A minor: F, F minor and back. All have C.
    const hand = byHand({ ...QUICK, word: WORD.root })
    hand.strike(0, C_MAJOR)
    hand.to(1.5)
    hand.maker.setParam(1.5, 'turn', 5)
    const chords = classes(Array.from({ length: 7 }, (_, i) => hand.to(1.9 + i)))
    const [am, f, fm] = [
      [0, 4, 9],
      [0, 5, 9],
      [0, 5, 8],
    ]
    expect(chords).toEqual([am, f, fm, f, am, f, fm])
    // Another word is another way out, from the chord it was given at.
    hand.maker.setParam(8.5, 'word', WORD.fifth)
    const others = classes(Array.from({ length: 5 }, (_, i) => hand.to(8.9 + i)))
    for (const notes of others) expect(notes).toContain(0)
    expect(others[0]).toEqual(f)
    expect(others[2]).not.toEqual(f)
    expect(others[4]).toEqual(f)
  })

  it('holds its time, its range and its three voices for ten minutes', () => {
    for (let word = 0; word <= 10; word += 1) {
      const hand = byHand({ word, time: 3.7, step: 0.3 })
      hand.strike(0, C_MAJOR)
      for (let i = 0; i < 160; i += 1) {
        const notes = hand.to(0.03 + (i + 0.95) * 3.7)
        expect(notes).toHaveLength(3)
        expect(notes[0]).toBeGreaterThan(48)
        expect(notes[2]).toBeLessThan(80)
      }
      for (const { atSec } of hand.events) {
        const chords = (atSec - 0.03) / 3.7
        expect(Math.abs(chords - Math.round(chords))).toBeLessThan(1e-6)
      }
    }
  })

  it('makes of each of the 24 triads the one that keeps the two notes its move keeps', () => {
    // P keeps the fifth, L the minor third and R the major third of every triad.
    const kept: readonly [Move, number][] = [
      ['P', 7],
      ['L', 3],
      ['R', 4],
    ]
    for (let i = 0; i < 24; i += 1) {
      const triad = { root: i >> 1, minor: i % 2 === 1 }
      for (const [move, size] of kept) {
        const next = moved(triad, move)
        const common = classesOf(triad).filter((c) => classesOf(next).includes(c))
        expect(common).toHaveLength(2)
        const apart = (common[1] - common[0] + 12) % 12
        expect([apart, 12 - apart]).toContain(size)
        expect(next.minor).toBe(!triad.minor)
        expect(moved(next, move)).toEqual(triad)
      }
    }
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

  it('goes back where the word says a move twice, nearly in key: G Gm Bb Gm G', () => {
    expect(classes(walk({ word: WORD.prrp, keep: 1 }, 5, [67, 71, 74]))).toEqual([
      [2, 7, 11],
      [2, 7, 10],
      [2, 5, 10],
      [2, 7, 10],
      [2, 7, 11],
    ])
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

describe('Hexatonic Walker: a key that changes while it walks', () => {
  it('comes into the key and stays, on its way out and back too', () => {
    const E_FLAT = { root: 3, steps: [0, 2, 4, 5, 7, 9, 11] }
    for (const turn of [0, 1, 5]) {
      for (let word = 0; word <= 10; word += 1) {
        const hand = byHand({ ...QUICK, word, keep: 2, turn })
        hand.strike(0, C_MAJOR)
        // After 8 is on its way back by now, through chords of the key before.
        hand.to(9.5)
        hand.maker.setKey(9.5, E_FLAT)
        const inside = (note: number): boolean => E_FLAT.steps.includes((note + 9) % 12)
        for (let i = 0; i < 30; i += 1) {
          const notes = hand.to(15.9 + i)
          expect(notes.every(inside), `word ${word}, turn ${turn}: ${String(notes)}`).toBe(true)
        }
        // Keep turned on out of the key is the same.
        const other = byHand({ ...QUICK, word, turn }, E_FLAT)
        other.strike(0, C_MAJOR)
        other.to(9.5)
        other.maker.setParam(9.5, 'keep', 2)
        for (let i = 0; i < 30; i += 1)
          expect(other.to(15.9 + i).every(inside), `word ${word}, turn ${turn}`).toBe(true)
      }
    }
  })

  it('turns back in a key that has no triad', () => {
    const onlyC = { root: 0, steps: [0] }
    const chords = walk({ keep: 2, turn: 5 }, 9, [60], onlyC).map(String)
    expect(chords[4]).toBe(chords[0])
    expect(chords[2]).not.toBe(chords[0])
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
    expect(hand.to(5.031)).toEqual([])
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
      hand.to(4)
      const count = hand.events.length
      // A chord due in these hundredths is not struck, only to end at once.
      expect(hand.to(4.031)).toEqual([])
      expect(hand.events.slice(count).every((event) => !event.on)).toBe(true)
      const after = hand.events.length
      hand.to(30)
      expect(hand.events.length).toBe(after)
    }
  })

  it('begins nothing once the last key is up', () => {
    const cases: Record<string, number>[] = [
      { time: 1 },
      { time: 9, rhythm: 2, step: 1 },
      { time: 2, top: 1 },
      { time: 8, rhythm: 1, step: 1 },
    ]
    for (const params of cases) {
      const hand = byHand(params)
      hand.strike(0, C_MAJOR)
      hand.lift(1.01, 3)
      hand.maker.setParam(1.015, 'time', 0.5)
      hand.maker.setParam(1.015, 'octave', 1)
      expect(hand.to(1.041)).toEqual([])
      expect(hand.events.filter((event) => event.on && event.atSec > 1)).toEqual([])
      hand.to(20)
      expect(hand.events.filter((event) => event.on && event.atSec > 1)).toEqual([])
    }
  })

  it('sounds a chord that was let go before it was read, and lets go of it', () => {
    const hand = byHand(QUICK)
    hand.strike(0, C_MAJOR)
    hand.lift(0.01, 3)
    expect(hand.to(0.035)).toEqual([60, 64, 67])
    expect(hand.to(0.175)).toEqual([60, 64, 67])
    expect(hand.to(0.2)).toEqual([])
    // Very fast: there is a chord all through, and nothing after.
    for (let i = 0; i < 100; i += 1) {
      if (i > 3) expect(hand.to(1 + i * 0.02).length).toBeGreaterThan(0)
      hand.strike(1 + i * 0.02, [60 + (i % 7)], 20 + i)
      hand.lift(1.012 + i * 0.02, 1, 20 + i)
    }
    expect(hand.to(4)).toEqual([])
  })

  it('strikes a played chord whole in Melt, and one voice after another in Stagger', () => {
    const times = (rhythm: number): number[] =>
      made(HEXATONIC_WALKER, chord(C_MAJOR, 3), { params: { rhythm, step: 0.4 } }, 4).map(
        (note) => Math.round(note.atSec * 100) / 100,
      )
    expect(times(0)).toEqual([0.03, 0.03, 0.03])
    expect(times(1)).toEqual([0.03, 0.43, 0.83])
  })

  it('strikes every voice of a chord played after all keys were up, with no hole between', () => {
    for (const [held, from] of [
      [0.1, 0.11],
      [1, 1],
      [0.98, 1],
    ]) {
      const hand = byHand({ time: 9, bass: 1 })
      hand.strike(0, C_MAJOR)
      hand.lift(held, 3)
      hand.strike(from, [60, 63, 67], 10)
      hand.to(from + 0.02)
      expect(hand.to(from + 0.02)).toEqual([36, 60, 64, 67])
      const before = hand.events.length
      expect(hand.to(from + 0.03)).toEqual([36, 60, 63, 67])
      const again = hand.events.slice(before).filter((event) => event.on)
      expect(again.map((event) => event.note).sort((a, b) => a - b)).toEqual([36, 60, 63, 67])
      expect(again.every((event) => Math.abs(event.atSec - from - 0.03) < 1e-9)).toBe(true)
    }
  })

  it('gives each note of a legato line the chord it has alone, however long they overlap', () => {
    const line = [60, 62, 64, 65, 67, 65, 64, 62, 60]
    const roots = (overlap: number): number[][] => {
      const hand = byHand({ time: 9 })
      const chords: number[][] = []
      line.forEach((note, i) => {
        if (i > 1 && overlap > 0.2) hand.maker.noteOff(i * 0.3 + overlap - 0.3, i - 2)
        hand.maker.noteOn(i * 0.3 + (overlap > 0.2 ? 0.001 : 0), i, note, 0.8)
        if (overlap <= 0.2 && i > 0) hand.maker.noteOff(i * 0.3 + overlap, i - 1)
        chords.push([...new Set(hand.to(i * 0.3 + 0.2).map((n) => n % 12))].sort((a, b) => a - b))
      })
      return chords
    }
    const alone = roots(0.01)
    expect(alone.slice(0, 5)).toEqual([
      [0, 4, 7],
      [2, 5, 9],
      [4, 7, 11],
      [0, 5, 9],
      [2, 7, 11],
    ])
    expect(roots(0.06)).toEqual(alone)
    expect(roots(0.15)).toEqual(alone)
    // Three keys of a chord one after another are the chord.
    const hand = byHand({ time: 9 })
    C_MAJOR.forEach((note, i) => hand.maker.noteOn(i * 0.2, i, note, 0.8))
    expect(hand.to(1).map((note) => note % 12)).toEqual([0, 4, 7])
  })

  it('takes a key that is sent again while keys are gathered at its last pitch', () => {
    const hand = byHand({ time: 9 })
    hand.maker.noteOn(0, 1, 60, 0.8)
    hand.maker.noteOn(0.005, 1, 64, 0.8)
    hand.maker.noteOn(0.01, 1, 67, 0.8)
    hand.maker.noteOn(0.015, 1, 62, 0.8)
    expect(
      hand
        .to(1)
        .map((note) => note % 12)
        .sort((a, b) => a - b),
    ).toEqual([2, 5, 9])
    hand.maker.noteOff(1, 1)
    expect(hand.to(2)).toEqual([])
  })

  it('is as loud with ten keys as with one, and is not silenced by a key with no velocity', () => {
    const gains = (keys: readonly (readonly [number, number])[]): number[] => {
      const hand = byHand({ time: 9 })
      keys.forEach(([note, gain], i) => hand.maker.noteOn(0, i, note, gain))
      hand.to(1)
      return hand.events.map((event) => Math.round(event.gain * 100) / 100)
    }
    expect(gains(Array.from({ length: 10 }, (_, i) => [50 + 3 * i, 0.6] as const))).toEqual([
      0.6, 0.6, 0.6,
    ])
    expect(gains([[60, 0.6]])).toEqual([0.6, 0.6, 0.6])
    expect(
      gains([
        [60, NaN],
        [64, 0.8],
        [67, 7],
      ]),
    ).toEqual([0.6, 0.6, 0.6])
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

  it('takes no more than half the chord time to bring the voices in', () => {
    expect(struck({ rhythm: 1, time: 2, step: 4 }, 1.9)).toEqual([
      [0, 60],
      [0.5, 64],
      [1, 67],
    ])
  })

  it('keeps the high voice clear of the top of the chord', () => {
    for (let word = 0; word <= 10; word += 1) {
      const hand = byHand({ ...QUICK, word, top: 1 })
      hand.strike(0, C_MAJOR)
      for (let i = 0; i < 30; i += 1) {
        const notes = hand.to(i + 0.95)
        expect(notes[3] - notes[2]).toBeGreaterThan(2)
      }
    }
  })

  it('does not end a note that was struck again before it was due to end', () => {
    const high = made(
      HEXATONIC_WALKER,
      chord(C_MAJOR, 4),
      { params: { rhythm: 4, time: 10, step: 0.5, ring: 0.9 } },
      5,
    ).filter((note) => note.note === 67)
    expect(high.slice(0, 3).map((note) => Math.round(note.durSec * 100) / 100)).toEqual([1, 1, 1])
  })

  it('walks on in the octave it was moved to', () => {
    const hand = byHand({ ...QUICK, word: WORD.lr })
    hand.strike(0, C_MAJOR)
    hand.to(0.5)
    hand.maker.setParam(0.5, 'octave', 1)
    const low = walk({ word: WORD.lr }, 30)
    for (let i = 0; i < 30; i += 1)
      expect(hand.to(i + 0.95)).toEqual(low[i].map((note) => note + 12))
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
    expect(hand.to(10.031)).toEqual([])
  })

  it('moves its high note with the chord time, and keeps to the note that moved', () => {
    const tops = (change: (hand: ReturnType<typeof byHand>) => void): [number, number][] => {
      const hand = byHand({ time: 20, top: 1 })
      hand.strike(0, C_MAJOR)
      hand.to(22)
      change(hand)
      hand.to(39)
      return hand.events
        .filter((event) => event.on && event.part === 'top' && event.atSec > 21)
        .map((event) => [Math.round(event.atSec * 100) / 100, event.note])
    }
    expect(tops(() => {})).toEqual([[30.03, 75]])
    expect(tops((hand) => hand.maker.setParam(22, 'time', 10))[0]).toEqual([25.03, 75])
    expect(
      tops((hand) => {
        hand.maker.setParam(22, 'top', 0)
        hand.maker.setParam(35, 'top', 1)
      }),
    ).toEqual([[35, 75]])
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
