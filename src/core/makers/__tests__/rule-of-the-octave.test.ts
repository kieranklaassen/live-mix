import { describe, expect, it } from 'vitest'

import { type MadePhraseNote, type PlayedNote } from '../phrase'
import { MakerRandom } from '../random'
import { RULE_OF_THE_OCTAVE } from '../rule-of-the-octave'
import { type MadeEvent, type MakerKey } from '../types'
import { A_MINOR, PENTATONIC, chord, line, made, makerContract } from './support'

const IN_KEY = 0
const FULL = 1
const TRIADS = 2
const SEVENTHS = 3
const SIXTHS = 4

const APART = { parts: { upper: { deviceId: 'choir' } } }
const RISING = [48, 50, 52, 53, 55, 57, 59, 60]
const FALLING = [60, 59, 57, 55, 53, 52, 50, 48]

const bassLine = (notes: readonly number[], durSec = 2): PlayedNote[] =>
  line(notes.map((note) => [note, durSec] as const))

/** The upper notes sounding at a time, from low to high. */
function upperAt(phrase: readonly MadePhraseNote[], atSec: number): number[] {
  return phrase
    .filter(
      (note) => note.part === 'upper' && note.atSec <= atSec && note.atSec + note.durSec > atSec,
    )
    .map((note) => note.note)
    .sort((a, b) => a - b)
}

/** The upper notes under each bass of a line, each bass two seconds long. */
function chords(
  bass: readonly number[],
  params: Record<string, number> = {},
  key?: MakerKey,
): number[][] {
  const phrase = made(RULE_OF_THE_OCTAVE, bassLine(bass), { ...APART, params, key }, 60)
  return bass.map((_, i) => upperAt(phrase, 2 * i + 1.9))
}

/** The names of the notes of each chord, each once, in order of pitch class. */
const names = (rows: readonly number[][]): string[] =>
  rows.map((row) =>
    [...new Set(row.map((note) => note % 12))]
      .sort((a, b) => a - b)
      .map((pc) => ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][pc])
      .join(' '),
  )

describe('the chords of the rule', () => {
  it('rises in C: C, G/D, C/E, Dm7/F, G, F/A, G7/B, C', () => {
    for (const rule of [IN_KEY, FULL]) {
      expect(chords(RISING, { rule })).toEqual([
        [64, 67, 72],
        [65, 67, 71],
        [64, 67, 72],
        [62, 69, 72],
        [62, 67, 71],
        [60, 65, 72],
        [62, 65, 67],
        [64, 67, 72],
      ])
    }
  })

  it('falls in C: C, G/B, D7/A with its F sharp, G, G7/F, C/E, G7/D, C', () => {
    expect(names(chords(FALLING, { rule: FULL }))).toEqual([
      'C E G',
      'D G',
      'C D F#',
      'D G B',
      'D G B',
      'C E G',
      'F G B',
      'C E G',
    ])
  })

  it('has A minor there on the white keys', () => {
    const rows = chords(FALLING)
    expect(names(rows)[2]).toBe('C E A')
    for (const note of rows.flat()) expect([0, 2, 4, 5, 7, 9, 11]).toContain(note % 12)
  })

  it('plays the lament in A minor: Am, Em/G, F, E with its G sharp', () => {
    expect(names(chords([57, 55, 53, 52], { rule: FULL }, A_MINOR))).toEqual([
      'C E A',
      'E B',
      'C F A',
      'E G# B',
    ])
    expect(names(chords([57, 55, 53, 52], {}, A_MINOR))[3]).toBe('E G B')
  })

  it('rises in A minor over the raised sixth and seventh, when they are played', () => {
    expect(names(chords([45, 47, 48, 50, 52, 54, 56, 57], { rule: FULL }, A_MINOR))).toEqual([
      'C E A',
      'D E G#',
      'C E A',
      'F A B',
      'E G# B',
      'C D A',
      'D E B',
      'C E A',
    ])
  })

  it('leaves A minor only for the G sharp, and only under the full rule', () => {
    const basses = [45, 47, 48, 50, 52, 53, 55, 57, 55, 53, 52, 50, 48, 47, 45]
    const outside = (rule: number): number[] => [
      ...new Set(
        chords(basses, { rule }, A_MINOR)
          .flat()
          .map((note) => note % 12)
          .filter((pc) => ![0, 2, 4, 5, 7, 9, 11].includes(pc)),
      ),
    ]
    expect(outside(FULL)).toEqual([8])
    for (const rule of [IN_KEY, TRIADS, SEVENTHS, SIXTHS]) expect(outside(rule)).toEqual([])
  })

  it('begins a phrase on a chord of its own, and takes the direction it is told', () => {
    expect(names(chords([50]))).toEqual(['D F A'])
    expect(names(chords([57], { rule: FULL }))).toEqual(['C E A'])
    expect(names(chords([57], { rule: FULL, turn: 2 }))).toEqual(['C D F#'])
    expect(names(chords([57], { rule: FULL, turn: 1 }))).toEqual(['C F A'])
    expect(names(chords([53, 53, 55, 53]))).toEqual(['C F A', 'C F A', 'D G B', 'D G B'])
  })

  it('keeps the direction through a repeated note, and asks only where it came from', () => {
    expect(names(chords([48, 57, 57]))).toEqual(['C E G', 'C F A', 'C F A'])
    expect(names(chords([60, 57, 57], { rule: FULL }))).toEqual(['C E G', 'C D F#', 'C D F#'])
  })

  it('has a triad, a seventh or a sixth chord on every step for the plain rules', () => {
    expect(names(chords(RISING, { rule: TRIADS }))).toEqual([
      'C E G',
      'D F A',
      'E G B',
      'C F A',
      'D G B',
      'C E A',
      'D F B',
      'C E G',
    ])
    // Three voices leave the root of a seventh chord to the bass.
    expect(names(chords([48, 50, 55], { rule: SEVENTHS }))).toEqual(['E G B', 'C F A', 'D F B'])
    expect(names(chords([52, 50, 48], { rule: SIXTHS, voices: 2 }))).toEqual(['C G', 'F B', 'E A'])
  })

  it('leads a bass outside the key up to the step over it', () => {
    // C sharp has A7 over it, D sharp B7, and in the key what of it is there.
    expect(names(chords([49], { rule: FULL }))).toEqual(['E G A'])
    expect(names(chords([51], { rule: FULL }))).toEqual(['F# A B'])
    expect(names(chords([51]))).toEqual(['F A B'])
    expect(names(chords([54]))).toEqual(['C D A'])
  })

  it('has the triads of a five-note scale on it', () => {
    // F G A C D: the note nearest a third and the one nearest a fifth over each.
    const pentatonic = (bass: readonly number[], params = {}): string[] =>
      names(chords(bass, params, PENTATONIC))
    expect(pentatonic([41, 43, 45, 48, 50])).toEqual(['C F A', 'C D G', 'C F A', 'C F G', 'D F A'])
    for (const rule of [IN_KEY, FULL, TRIADS, SEVENTHS, SIXTHS]) {
      for (const note of chords([41, 43, 45, 48, 50, 48, 45, 43], { rule }, PENTATONIC).flat())
        expect([0, 2, 5, 7, 9]).toContain(note % 12)
    }
  })
})

describe('the voices', () => {
  it('never go in fifths or octaves with each other or the bass, up and down the octave', () => {
    const keys: [MakerKey | undefined, number[], number[]][] = [
      [undefined, RISING, FALLING],
      [A_MINOR, [45, 47, 48, 50, 52, 54, 56, 57], [57, 55, 53, 52, 50, 48, 47, 45]],
    ]
    for (const [key, up, down] of keys) {
      for (const rule of [IN_KEY, FULL, TRIADS]) {
        for (const voices of [3, 4]) {
          const bass = [...up, ...down]
          const rows = chords(bass, { rule, voices }, key).map((row, i) => [bass[i], ...row])
          for (let i = 1; i < rows.length; i += 1) {
            const [from, to] = [rows[i - 1], rows[i]]
            expect(to.length).toBe(voices + 1)
            for (let low = 0; low < to.length; low += 1) {
              for (let high = low + 1; high < to.length; high += 1) {
                if (from[low] === to[low] || from[high] === to[high]) continue
                const before = (from[high] - from[low]) % 12
                const after = (to[high] - to[low]) % 12
                const alike = before === after && (after === 0 || after === 7)
                expect(alike, `${rule}: ${String(from)} to ${String(to)}`).toBe(false)
              }
            }
          }
        }
      }
    }
  })

  it('holds a note two chords share, and strikes the rest', () => {
    const phrase = made(RULE_OF_THE_OCTAVE, bassLine([48, 50, 52]), APART)
    const g = phrase.filter((note) => note.note === 67)
    expect(g).toHaveLength(1)
    expect(g[0].durSec).toBeCloseTo(6.37, 6) // to the last release, and 0.4 s
    expect(phrase.filter((note) => note.note === 65)).toMatchObject([
      { atSec: 2.03, part: 'upper' },
    ])
  })

  it('strikes it again when asked to', () => {
    const phrase = made(RULE_OF_THE_OCTAVE, bassLine([48, 50, 52]), {
      ...APART,
      params: { hold: 1 },
    })
    expect(phrase.filter((note) => note.note === 67).map((note) => note.atSec)).toEqual([
      0.03, 2.03, 4.03,
    ])
  })

  it('takes over what still rings when the next bass comes', () => {
    const played = [
      { atSec: 0, durSec: 1, note: 48 },
      { atSec: 1.3, durSec: 1, note: 48 },
    ]
    const rings = made(RULE_OF_THE_OCTAVE, played, APART).filter((note) => note.part === 'upper')
    expect(rings).toHaveLength(3)
    expect(rings[0].durSec).toBeCloseTo(2.3 + 0.4 - 0.03, 6)
    const dry = made(RULE_OF_THE_OCTAVE, played, { ...APART, params: { sustain: 0.1 } })
    expect(dry.filter((note) => note.part === 'upper')).toHaveLength(6)
  })

  it('lie a sixth or so apart when open, close together when close, and above the bass', () => {
    const gaps = (spacing: number): number[] =>
      chords([48, 50, 52, 50, 48], { spacing }).flatMap((row) => [row[1] - row[0], row[2] - row[1]])
    expect(Math.max(...gaps(0))).toBeLessThanOrEqual(7)
    expect(Math.min(...gaps(2))).toBeGreaterThanOrEqual(5)
    expect(chords([48], { spacing: 2, height: 4 })).toEqual([[55, 64, 72]])
    for (const spacing of [0, 1, 2, 3]) {
      for (const bass of [36, 55, 67, 79])
        expect(chords([bass], { spacing })[0][0]).toBeGreaterThan(bass)
    }
  })

  it('come late when they are told to, over the new bass', () => {
    const phrase = made(RULE_OF_THE_OCTAVE, bassLine([48, 50]), {
      ...APART,
      params: { delay: 1 },
    })
    expect(upperAt(phrase, 0.9)).toEqual([])
    expect(upperAt(phrase, 1.01)).toEqual([64, 67, 72])
    expect(upperAt(phrase, 2.9)).toEqual([64, 67, 72])
    expect(upperAt(phrase, 3.01)).toEqual([65, 67, 71])
    // The last key is up at 4: a second late, and 0.4 s of ringing.
    expect(upperAt(phrase, 5.39)).toEqual([65, 67, 71])
    expect(upperAt(phrase, 5.41)).toEqual([])
  })

  it('move one after another from the lowest, each from its own old note', () => {
    const phrase = made(RULE_OF_THE_OCTAVE, bassLine([48, 50]), {
      ...APART,
      params: { strum: 1 },
    })
    expect(upperAt(phrase, 0.1)).toEqual([64])
    expect(upperAt(phrase, 0.6)).toEqual([64, 67])
    expect(upperAt(phrase, 1.9)).toEqual([64, 67, 72])
    expect(upperAt(phrase, 2.1)).toEqual([65, 67, 72])
    expect(upperAt(phrase, 3.1)).toEqual([65, 67, 71])
  })

  it('leave their old notes ringing when they linger', () => {
    const phrase = made(RULE_OF_THE_OCTAVE, bassLine([48, 50]), {
      ...APART,
      params: { linger: 0.5 },
    })
    expect(upperAt(phrase, 2.4)).toEqual([64, 65, 67, 71, 72])
    expect(upperAt(phrase, 2.6)).toEqual([65, 67, 71])
  })

  it('are played softer than the bass by their level', () => {
    const phrase = made(RULE_OF_THE_OCTAVE, bassLine([48]), { params: { level: 0.5 } })
    expect(phrase.map((note) => note.gain)).toEqual([0.8, 0.4, 0.4, 0.4])
    expect(phrase[0]).toMatchObject({ note: 48, atSec: 0, durSec: 2 })
  })
})

describe('the keys', () => {
  it('takes the lowest of a chord for the bass, whatever order it comes in', () => {
    for (const notes of [
      [50, 57, 65],
      [65, 57, 50],
    ]) {
      const phrase = made(
        RULE_OF_THE_OCTAVE,
        notes.map((note, i) => ({ atSec: i * 0.01, durSec: 2 - i * 0.01, note })),
        APART,
      )
      expect(new Set(upperAt(phrase, 1).map((note) => note % 12))).toEqual(new Set([2, 5, 9]))
      expect(phrase.filter((note) => note.part === 'upper')).toHaveLength(3)
      expect(phrase.filter((note) => !note.part).map((note) => note.note)).toEqual(notes)
    }
  })

  it('writes no chord for the keys of a hand that is being lifted', () => {
    const phrase = made(
      RULE_OF_THE_OCTAVE,
      [50, 57, 65].map((note, i) => ({ atSec: 0, durSec: 2 + i * 0.02, note })),
      APART,
    )
    expect(phrase.filter((note) => note.part === 'upper')).toHaveLength(3)
  })

  it('takes the next key up for the bass when the bass goes', () => {
    const phrase = made(
      RULE_OF_THE_OCTAVE,
      [
        { atSec: 0, durSec: 2, note: 48 },
        { atSec: 1, durSec: 3, note: 50 },
      ],
      APART,
    )
    expect(upperAt(phrase, 1.5)).toEqual([64, 67, 72])
    expect(upperAt(phrase, 2.1)).toEqual([65, 67, 71])
  })

  it('keeps the voices under a tune', () => {
    const played = [
      { atSec: 0, durSec: 4, note: 48 },
      { atSec: 0, durSec: 2, note: 72 },
      { atSec: 2, durSec: 2, note: 64 },
    ]
    const phrase = made(RULE_OF_THE_OCTAVE, played, { ...APART, params: { keys: 1 } })
    expect(Math.max(...upperAt(phrase, 1))).toBeLessThan(72)
    expect(Math.max(...upperAt(phrase, 3))).toBeLessThan(64)
    expect(upperAt(phrase, 3).length).toBeGreaterThanOrEqual(2)
  })

  it('leaves out the keys above, when they are silent, until one is the bass', () => {
    const phrase = made(
      RULE_OF_THE_OCTAVE,
      [
        { atSec: 0, durSec: 2, note: 48 },
        { atSec: 1, durSec: 3, note: 64 },
      ],
      { ...APART, params: { keys: 2 } },
    )
    const own = phrase.filter((note) => !note.part)
    expect(own.map((note) => note.note)).toEqual([48, 64])
    expect(own[1].atSec).toBeCloseTo(2.05, 6)
  })

  it('plays a chord over a bass too short to read, and over none twice', () => {
    const phrase = made(RULE_OF_THE_OCTAVE, [{ atSec: 0, durSec: 0.01, note: 48 }], APART)
    expect(upperAt(phrase, 0.2)).toEqual([64, 67, 72])
    expect(upperAt(phrase, 0.5)).toEqual([])
    expect(phrase).toHaveLength(4)
  })

  it('keeps up with a line of very short notes', () => {
    const phrase = made(RULE_OF_THE_OCTAVE, bassLine([48, 50, 52, 53, 55, 57, 59, 60], 0.06), APART)
    expect(
      upperAt(phrase, 0.47)
        .map((note) => note % 12)
        .sort((a, b) => a - b),
    ).toEqual([0, 4, 7])
  })
})

/** A maker played by hand, with what sounds at any time. */
function hands(params: Record<string, number> = {}) {
  const maker = RULE_OF_THE_OCTAVE.create({ params, parts: ['upper'] })
  const open = new Map<number, MadeEvent>()
  const started: number[] = []
  const emit = (event: MadeEvent): void => {
    if (event.on) {
      open.set(event.id, event)
      started.push(event.note)
    } else open.delete(event.id)
  }
  const upper = (): number[] =>
    [...open.values()]
      .filter((event) => event.part === 'upper')
      .map((event) => event.note)
      .sort((a, b) => a - b)
  return { maker, emit, open, upper, started }
}

describe('a control moved under held keys', () => {
  it('changes the chord at once and keeps the notes it shares', () => {
    const { maker, emit, upper, started } = hands({ hold: 1 })
    maker.noteOn(0, 1, 50, 0.8)
    maker.advance(1, emit)
    expect(upper()).toEqual([62, 65, 69])
    started.length = 0
    maker.setParam(1, 'rule', SEVENTHS)
    maker.advance(1.01, emit)
    expect(new Set(upper().map((note) => note % 12))).toEqual(new Set([0, 5, 9]))
    expect(started).toEqual([60])
    maker.setParam(2, 'voices', 2)
    maker.advance(2.1, emit)
    expect(upper()).toHaveLength(2)
    maker.setParam(3, 'height', 24)
    maker.advance(3.1, emit)
    expect(upper()[0]).toBeGreaterThan(72)
    maker.noteOff(4, 1)
    maker.advance(5, emit)
    expect(upper()).toEqual([])
  })

  it('silences the keys above and brings them back', () => {
    const { maker, emit, open } = hands()
    maker.noteOn(0, 1, 48, 0.8)
    maker.noteOn(0.5, 2, 76, 0.8)
    maker.advance(1, emit)
    const own = (): number[] =>
      [...open.values()].filter((event) => !event.part).map((event) => event.note)
    expect(own()).toEqual([48, 76])
    maker.setParam(1, 'keys', 2)
    maker.advance(1.1, emit)
    expect(own()).toEqual([48])
    maker.setParam(2, 'keys', 0)
    maker.advance(2.1, emit)
    expect(own()).toEqual([48, 76])
  })

  it('does not bring back a chord that was let go when the hand stops being late', () => {
    const { maker, emit, open } = hands({ delay: 4 })
    maker.noteOn(0, 1, 48, 0.8)
    maker.advance(1, emit)
    maker.setParam(1, 'delay', 0)
    maker.noteOff(2, 1)
    maker.advance(30, emit)
    expect(open.size).toBe(0)
  })

  it('changes the key under a held bass', () => {
    const { maker, emit, upper } = hands({ rule: FULL })
    maker.noteOn(0, 1, 52, 0.8)
    maker.advance(1, emit)
    expect(new Set(upper().map((note) => note % 12))).toEqual(new Set([0, 4, 7]))
    maker.setKey(1, A_MINOR)
    maker.advance(1.1, emit)
    expect(new Set(upper().map((note) => note % 12))).toEqual(new Set([4, 8, 11]))
  })

  it('hangs nothing, whatever is played and turned', () => {
    const specs = Object.entries(RULE_OF_THE_OCTAVE.params)
    for (let seed = 1; seed <= 60; seed += 1) {
      const random = new MakerRandom(seed)
      const { maker, emit, open } = hands()
      const down = new Set<number>()
      let atSec = 0
      let most = 0
      for (let i = 0; i < 150; i += 1) {
        atSec += random.next() < 0.5 ? random.between(0, 0.05) : random.between(0, 0.8)
        const what = random.next()
        const id = random.below(6)
        if (what < 0.5) {
          maker.noteOn(atSec, id, 36 + random.below(48), 0.8)
          down.add(id)
        } else if (what < 0.8) {
          maker.noteOff(atSec, id)
          down.delete(id)
        } else {
          const [name, spec] = specs[random.below(specs.length)]
          maker.setParam(atSec, name, random.between(spec.min, spec.max))
        }
        maker.advance(atSec, emit)
        most = Math.max(most, open.size)
      }
      for (const id of down) maker.noteOff(atSec, id)
      // Late, spread, sustain and linger at their most.
      maker.advance(atSec + 4 + 3 + 8 + 4, emit)
      expect(open.size, `seed ${seed}`).toBe(0)
      expect(maker.next()).toBe(Infinity)
      expect(most).toBeLessThanOrEqual(50)
    }
  })

  it('holds no more voices than it has when nothing lingers', () => {
    const random = new MakerRandom(5)
    const { maker, emit, upper } = hands({ strum: 0.3 })
    let atSec = 0
    for (let i = 0; i < 300; i += 1) {
      atSec += random.between(0.01, 0.4)
      const id = random.below(3)
      if (random.next() < 0.6) maker.noteOn(atSec, id, 36 + random.below(24), 0.8)
      else maker.noteOff(atSec, id)
      maker.advance(atSec, emit)
      expect(upper().length).toBeLessThanOrEqual(3)
    }
  })
})

describe('a chord played into it', () => {
  it('is the bass with its voices, beside the keys', () => {
    const phrase = made(RULE_OF_THE_OCTAVE, chord([48, 64, 67], 2), APART)
    // Where a key is held already the voices go elsewhere if they can.
    expect(upperAt(phrase, 1)).toHaveLength(3)
    expect(names([upperAt(phrase, 1)])).toEqual(['C E G'])
  })
})

makerContract(RULE_OF_THE_OCTAVE)
