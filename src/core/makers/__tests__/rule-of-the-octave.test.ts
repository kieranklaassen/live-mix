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
  const phrase = made(
    RULE_OF_THE_OCTAVE,
    bassLine(bass),
    { ...APART, params, key },
    2 * bass.length + 30,
  )
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

describe('the voices over a long bass', () => {
  /** A walk in the scale, mostly by step, with thirds, fourths and fifths in it. */
  const walk = (length: number, key: MakerKey): number[] => {
    const scale: number[] = []
    for (let note = 36; note <= 60; note += 1)
      if (key.steps.includes((note - key.root + 12) % 12)) scale.push(note)
    const random = new MakerRandom(7)
    const out: number[] = []
    let at = 7
    while (out.length < length) {
      out.push(scale[at])
      let by = [1, -1, 1, -1, 1, -1, 2, -2, 3, -3, 4, -4][random.below(12)]
      if (at + by < 0 || at + by >= scale.length) by = -by
      at += by
    }
    return out
  }
  const WHITE: MakerKey = { root: 0, steps: [0, 2, 4, 5, 7, 9, 11] }

  it('stay near their place, and move by steps and thirds, for two hundred notes', () => {
    for (const key of [WHITE, A_MINOR, PENTATONIC]) {
      const bass = walk(200, key)
      for (const rule of [IN_KEY, FULL, TRIADS]) {
        for (const voices of [2, 3]) {
          const rows = chords(bass, { rule, voices }, key)
          const about = `${key.root} rule ${rule}, ${voices} voices`
          let moved = 0
          let leaps = 0
          let alike = 0
          for (let i = 1; i < rows.length; i += 1) {
            const from = [bass[i - 1], ...rows[i - 1]]
            const to = [bass[i], ...rows[i]]
            expect(to.length, about).toBe(voices + 1)
            for (let a = 0; a < to.length; a += 1) {
              if (a > 0) moved += Math.abs(to[a] - from[a])
              if (a > 0 && Math.abs(to[a] - from[a]) > 7) leaps += 1
              for (let b = a + 1; b < to.length; b += 1) {
                if (from[a] === to[a] || from[b] === to[b]) continue
                const after = (to[b] - to[a]) % 12
                if ((from[b] - from[a]) % 12 === after && (after === 0 || after === 7)) alike += 1
              }
            }
          }
          expect(alike, about).toBe(0)
          expect(moved / (199 * voices), about).toBeLessThan(2.5)
          expect(leaps, about).toBeLessThanOrEqual(6)
          expect(Math.min(...rows.flat()), about).toBeGreaterThanOrEqual(50)
          expect(Math.max(...rows.flat()), about).toBeLessThanOrEqual(88)
        }
      }
    }
  })

  it('keep off a low bass: a fifth and more over it', () => {
    for (let bass = 37; bass <= 47; bass += 1) {
      const [row] = chords([bass], { height: -12 })
      expect(row[0] - bass, `${bass}: ${String(row)}`).toBeGreaterThanOrEqual(6)
    }
  })

  it('share a move of some size rather than have one of them leap', () => {
    // From E and G to the C and G over E, not up to G and C.
    expect(chords([48, 40], { voices: 2 })).toEqual([
      [64, 67],
      [60, 67],
    ])
  })

  it('stay over a high bass, and fewer of them when there is no more room', () => {
    for (const spacing of [0, 1, 2, 3]) {
      for (let bass = 84; bass <= 119; bass += 1) {
        const [row] = chords([bass], { spacing, voices: 4 })
        for (const note of row) {
          expect(note, `bass ${bass}`).toBeGreaterThan(bass)
          expect(note).toBeLessThanOrEqual(119)
        }
        expect(new Set(row).size).toBe(row.length)
        if (bass <= 100) expect(row).toHaveLength(4)
      }
    }
    // A bass past what is played comes an octave lower, and its voices with it.
    expect(chords([122])).toEqual([[113, 117]])
  })

  it('come within the spread of a bass that moves faster than it', () => {
    const bass = [48, 50, 52, 53, 55, 57, 59, 60, 59, 57, 55, 53, 52, 50, 48]
    const phrase = made(
      RULE_OF_THE_OCTAVE,
      bassLine(bass, 1),
      { ...APART, params: { strum: 3 } },
      40,
    )
    // All three are there after three seconds, and none keeps a note for long.
    expect(upperAt(phrase, 3.1)).toHaveLength(3)
    const rows = made(RULE_OF_THE_OCTAVE, bassLine(bass, 1), APART, 40)
    for (let at = 3.1; at < 15; at += 0.5) {
      const lately = new Set<number>()
      for (let back = 0; back <= 3.1; back += 0.1)
        for (const note of upperAt(rows, at - back)) lately.add(note % 12)
      const row = upperAt(phrase, at)
      expect(row).toHaveLength(3)
      for (const note of row) expect(lately, `${note} at ${at}`).toContain(note % 12)
    }
  })

  it('are rolled from the lowest up, when struck again, over a bass that comes before the top', () => {
    const params = { hold: 1, strum: 0.6, voices: 4 }
    const phrase = made(RULE_OF_THE_OCTAVE, bassLine([48, 50, 52, 53], 0.5), {
      ...APART,
      params,
    }).filter((note) => note.part)
    const chordAt = (at: number): MadePhraseNote[] =>
      phrase.filter((note) => note.atSec >= at && note.atSec < at + 0.5)
    for (const at of [0.03, 0.53, 1.53]) {
      const roll = chordAt(at).map((note) => note.note)
      expect(roll.slice(0, 3)).toEqual([...roll.slice(0, 3)].sort((a, b) => a - b))
    }
    // The top is put off once, and is there by the third chord.
    expect(chordAt(0.03)).toHaveLength(3)
    expect(upperAt(phrase, 1.22)).toHaveLength(3)
    expect(upperAt(phrase, 1.24)).toHaveLength(4)
  })

  it('keep a note they were about to leave when the next chord has it', () => {
    // C E G C: its top voice was to go to B at 3, and is asked back to C before.
    const phrase = made(
      RULE_OF_THE_OCTAVE,
      [
        { atSec: 0, durSec: 2, note: 48 },
        { atSec: 2, durSec: 0.5, note: 50 },
        { atSec: 2.5, durSec: 2, note: 48 },
      ],
      { ...APART, params: { strum: 1 } },
    )
    expect(phrase.filter((note) => note.part && note.note === 72)).toHaveLength(1)
    expect(phrase.filter((note) => note.note === 71)).toEqual([])
    expect(upperAt(phrase, 4)).toEqual([64, 67, 72])
  })

  it('end in time with the hand at its latest, most spread and longest', () => {
    for (const delay of [0, 4]) {
      for (const strum of [0, 3]) {
        for (const sustain of [0.05, 8]) {
          for (const linger of [0, 4]) {
            for (const durSec of [0.01, 0.2, 1, 5]) {
              const params = { delay, strum, sustain, linger, voices: 4 }
              const { maker, emit, open } = hands(params)
              let atSec = 0
              let most = 0
              for (const note of RISING) {
                maker.noteOn(atSec, 1, note, 0.8)
                atSec += durSec
                maker.noteOff(atSec, 1)
                maker.advance(atSec, emit)
                most = Math.max(most, open.size)
              }
              // Once the hand is up what rings is a ringing chord or what a voice left before.
              maker.advance(atSec + delay + Math.max(sustain, linger) + 0.01, emit)
              expect(open.size, JSON.stringify({ ...params, durSec })).toBe(0)
              expect(maker.next()).toBe(Infinity)
              expect(most).toBeLessThanOrEqual(linger === 0 ? 5 : 24)
            }
          }
        }
      }
    }
  })
})

describe('the bass and the hand above it', () => {
  it('takes a key pressed again at another pitch for a new bass', () => {
    // By the same id, with and without its release, and a key held above.
    for (const released of [true, false]) {
      const { maker, emit, upper } = hands()
      maker.noteOn(0, 9, 67, 0.8)
      maker.noteOn(0, 1, 48, 0.8)
      maker.advance(1, emit)
      const classes = (): Set<number> => new Set(upper().map((note) => note % 12))
      expect(classes()).toEqual(new Set([0, 4, 7]))
      if (released) maker.noteOff(1, 1)
      maker.noteOn(1.02, 1, 50, 0.8)
      maker.advance(2, emit)
      expect(classes()).toEqual(new Set([5, 7, 11]))
      maker.noteOn(2, 1, 48, 0.8)
      maker.advance(3, emit)
      expect(classes()).toEqual(new Set([0, 4, 7]))
    }
  })

  it('strikes the chord again for a bass repeated quickly under a held hand', () => {
    const { maker, emit, started } = hands({ hold: 1 })
    maker.noteOn(0, 9, 79, 0.8)
    maker.noteOn(0, 1, 48, 0.8)
    maker.advance(1, emit)
    started.length = 0
    maker.noteOff(1, 1)
    maker.noteOn(1.02, 1, 48, 0.8)
    maker.advance(2, emit)
    expect(started).toEqual([48, 64, 67, 72])
  })

  it('reads a chord too short to read by its lowest key, whichever goes first', () => {
    for (const order of [
      [1, 2, 3],
      [3, 2, 1],
    ]) {
      const { maker, emit, upper } = hands()
      for (const [i, note] of [48, 65, 69].entries()) maker.noteOn(0, i + 1, note, 0.8)
      for (const [i, id] of order.entries()) maker.noteOff(0.01 + 0.004 * i, id)
      maker.advance(0.1, emit)
      expect(new Set(upper().map((note) => note % 12))).toEqual(new Set([0, 4, 7]))
    }
  })

  it('reads a chord too short to read that came from its top, lowest key first to go', () => {
    const { maker, emit, upper } = hands()
    for (const [i, note] of [69, 65, 48].entries()) maker.noteOn(0.002 * i, i, note, 0.8)
    maker.noteOff(0.012, 2)
    maker.noteOff(0.014, 1)
    maker.noteOff(0.016, 0)
    maker.advance(0.1, emit)
    expect(new Set(upper().map((note) => note % 12))).toEqual(new Set([0, 4, 7]))
  })

  it('goes where the hand is not, when its keys sound', () => {
    for (const hand of [
      [48, 64, 67],
      [48, 60, 64, 67],
    ]) {
      const { maker, emit, upper } = hands()
      for (const [i, note] of hand.entries()) maker.noteOn(0, i, note, 0.8)
      maker.advance(1, emit)
      expect(upper()).toEqual([67, 72, 76])
    }
  })

  it('takes a new key under a held one for the bass, and one over it when that goes', () => {
    const { maker, emit, upper } = hands()
    maker.noteOn(0, 1, 52, 0.8)
    maker.noteOn(1, 2, 50, 0.8)
    maker.advance(1.1, emit)
    expect(new Set(upper().map((note) => note % 12))).toEqual(new Set([5, 7, 11]))
    maker.noteOff(1.2, 1)
    maker.noteOn(2, 3, 53, 0.8)
    maker.advance(2.2, emit)
    expect(new Set(upper().map((note) => note % 12))).toEqual(new Set([5, 7, 11]))
    maker.noteOff(2.2, 2)
    maker.advance(2.3, emit)
    // It rose to F: D minor with its seventh.
    expect(new Set(upper().map((note) => note % 12))).toEqual(new Set([0, 2, 9]))
  })

  it('puts the same voices over a silent hand as over the bass alone', () => {
    const { maker, emit, upper } = hands({ keys: 2 })
    for (const [i, note] of [48, 64, 67, 72].entries()) maker.noteOn(0, i, note, 0.8)
    maker.advance(1, emit)
    expect(upper()).toEqual([64, 67, 72])
  })

  it('keeps the chord under a tune when the bass is let go, and the direction with it', () => {
    const { maker, emit, upper, started } = hands({ keys: 1 })
    maker.noteOn(0, 1, 48, 0.8)
    for (const [i, note] of [76, 80].entries()) maker.noteOn(0, 8 + i, note, 0.8)
    maker.advance(1, emit)
    expect(upper()).toEqual([64, 67, 72])
    started.length = 0
    maker.noteOff(1, 1)
    maker.advance(1.5, emit)
    // The tune moves on, down to the note beside it.
    maker.noteOn(1.5, 10, 75, 0.8)
    maker.noteOff(1.6, 8)
    maker.noteOff(1.6, 9)
    maker.advance(2, emit)
    expect(upper()).toEqual([64, 67, 72])
    expect(started).toEqual([75])
    // F risen to from C, with D; fallen to from the tune it would have had B.
    maker.noteOn(2, 1, 53, 0.8)
    maker.advance(3, emit)
    expect(new Set(upper().map((note) => note % 12))).toEqual(new Set([0, 2, 9]))
    maker.noteOff(3, 1)
    maker.noteOff(3, 10)
    maker.advance(4, emit)
    expect(upper()).toEqual([])
    // With the hand up before, a high key is a bass like any other.
    maker.noteOn(4, 1, 76, 0.8)
    maker.advance(5, emit)
    expect(upper()[0]).toBeGreaterThan(76)
  })

  it('keeps the chord under a whole hand an octave wide', () => {
    const { maker, emit, upper } = hands({ keys: 1 })
    for (const [i, note] of [48, 64, 67, 76].entries()) maker.noteOn(0, i, note, 0.8)
    maker.advance(1, emit)
    maker.noteOff(1, 0)
    maker.advance(2, emit)
    expect(upper()).toEqual([64, 67, 72])
  })

  it('has all its voices again once there is room for them', () => {
    const { maker, emit, upper } = hands({ keys: 1 })
    maker.noteOn(0, 1, 48, 0.8)
    maker.noteOn(0, 2, 60, 0.8)
    maker.advance(1, emit)
    expect(upper()).toEqual([52, 55])
    maker.noteOff(1, 2)
    maker.noteOn(1, 3, 63, 0.8)
    maker.noteOn(2, 1, 48, 0.8)
    maker.advance(3, emit)
    expect(upper()).toEqual([52, 55, 60])
  })

  it('takes no short note of the tune for a bass, and none that is the bass once more', () => {
    const { maker, emit, upper, started } = hands({ keys: 1, hold: 1 })
    maker.noteOn(0, 1, 48, 0.8)
    maker.noteOn(0, 2, 76, 0.8)
    maker.advance(1, emit)
    maker.noteOn(1, 3, 48, 0.8)
    maker.advance(1.1, emit)
    started.length = 0
    maker.noteOff(2, 3)
    maker.advance(2.5, emit)
    expect(started).toEqual([])
    maker.noteOff(3, 1)
    maker.advance(3.5, emit)
    maker.noteOn(3.5, 4, 74, 0.8)
    maker.noteOff(3.52, 4)
    maker.advance(4, emit)
    expect(started).toEqual([74])
    expect(upper()).toEqual([64, 67, 72])
  })

  it('takes a key far under the tune for the bass', () => {
    const { maker, emit, upper } = hands({ keys: 1 })
    maker.noteOn(0, 1, 48, 0.8)
    maker.noteOn(0, 2, 81, 0.8)
    maker.noteOff(1, 1)
    maker.noteOn(1.5, 1, 62, 0.8)
    maker.advance(2, emit)
    expect(new Set(upper().map((note) => note % 12))).toEqual(new Set([5, 7, 11]))
  })

  it('brings voices back up that a low tune pressed down, once it has gone up', () => {
    const { maker, emit, upper } = hands({ keys: 1 })
    maker.noteOn(0, 1, 48, 0.8)
    maker.noteOn(0, 2, 62, 0.8)
    maker.advance(1, emit)
    expect(upper()).toEqual([52, 55, 60])
    maker.noteOff(1, 2)
    maker.noteOn(1, 3, 79, 0.8)
    maker.noteOn(2, 1, 48, 0.8)
    maker.advance(3, emit)
    expect(upper()[0]).toBeGreaterThanOrEqual(60)
  })
})

makerContract(RULE_OF_THE_OCTAVE)
