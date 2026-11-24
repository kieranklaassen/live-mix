import { describe, expect, it } from 'vitest'

import { SIX_VOICES, voiceIndex } from '../six-voices'
import { type MadePhraseNote, type PlayedNote } from '../phrase'
import { WHITE_KEYS, type MadeEvent, type MakerKey } from '../types'
import { A_MINOR, chord, line, made, makerContract, notesOf, PENTATONIC } from './support'

const PART_IDS = ['mirror', 'middle', 'mirror-middle', 'octaflip', 'centre']

/** Every voice heard as itself, at the moment of the key: each on an instrument of its own. */
const PARTS = Object.fromEntries(PART_IDS.map((id) => [id, { deviceId: 'flute' }]))
const PLAIN = { human: 0, fall: 0 }

/** Only these made voices on, at full level. */
function only(...names: string[]): Record<string, number> {
  const off = { mirror: 0, middle: 0, mirrorMiddle: 0, octaflip: 0, centreLevel: 0 }
  return { ...PLAIN, ...off, ...Object.fromEntries(names.map((name) => [name, 1])) }
}

/** What each voice plays, by the part's name, `line` the played note. */
function voices(note: number, key: MakerKey = WHITE_KEYS): Record<string, number> {
  const phrase = made(SIX_VOICES, chord([note], 1), { params: PLAIN, parts: PARTS, key })
  return Object.fromEntries(phrase.map((event) => [event.part ?? 'line', event.note]))
}

/** Start, note and length in hundredths of a second, without what is under one. */
function timed(phrase: readonly MadePhraseNote[]): [number, number, number][] {
  const round = (sec: number): number => Math.round(sec * 100) / 100
  return phrase.map((event) => [round(event.atSec), event.note, round(event.durSec)])
}

function mirrorsOf(notes: readonly PlayedNote[], params: Record<string, number>, sec = 40) {
  const phrase = made(SIX_VOICES, notes, { params, parts: PARTS }, sec)
  return phrase.filter((event) => event.part !== undefined)
}

/** Keys, controls and time by hand: what is played goes out as it is asked for. */
function player(params: Record<string, number> = PLAIN, parts: readonly string[] = PART_IDS) {
  const maker = SIX_VOICES.create({ params, parts })
  const events: MadeEvent[] = []
  const emit = (event: MadeEvent): void => void events.push(event)
  return {
    maker,
    events,
    to: (sec: number) => maker.advance(sec, emit),
    silence: (sec: number) => maker.silence(sec, emit),
    /** What sounds now, as `part:note`. */
    open: (): string[] => {
      const open = new Map<number, string>()
      for (const event of events) {
        if (event.on) open.set(event.id, `${event.part ?? 'line'}:${event.note}`)
        else open.delete(event.id)
      }
      return [...open.values()].sort()
    },
  }
}

describe('Six voices: where they lie', () => {
  it('opens E4 G4 A4 F4 like a fan round D4', () => {
    // C4 A3 G3 B3.
    const tune = line([
      [64, 1],
      [67, 1],
      [69, 1],
      [65, 1],
    ])
    expect(notesOf(mirrorsOf(tune, only('mirror')))).toEqual([60, 57, 55, 59])
  })

  it('places all six on the white keys', () => {
    // E4: one step up. Half of one step is none.
    expect(voices(64)).toEqual({
      line: 64,
      mirror: 60,
      middle: 62,
      'mirror-middle': 62,
      octaflip: 52,
      centre: 62,
    })
    // G4: three steps up, so half is one: E4, and C4 across.
    expect(voices(67)).toEqual({
      line: 67,
      mirror: 57,
      middle: 64,
      'mirror-middle': 60,
      octaflip: 55,
      centre: 62,
    })
    // A4: four up, G3 below, F4 and B3 between.
    expect(voices(69)).toEqual({
      line: 69,
      mirror: 55,
      middle: 65,
      'mirror-middle': 59,
      octaflip: 57,
      centre: 62,
    })
  })

  it('turns the other way under the centre, the middle the lower of two', () => {
    // A3, three steps under D4: G4 above it, B3 (two under) and F4, and A4.
    expect(voices(57)).toEqual({
      line: 57,
      mirror: 67,
      middle: 59,
      'mirror-middle': 65,
      octaflip: 69,
      centre: 62,
    })
  })

  it('is one note on the centre', () => {
    const phrase = made(SIX_VOICES, chord([62], 1), { params: PLAIN })
    expect(timed(phrase)).toEqual([[0, 62, 1]])
  })

  it('takes a note outside the key to the nearest in it, the lower of two', () => {
    expect(voices(61)).toMatchObject({ line: 60, mirror: 64 })
  })

  it('turns round B3, the second degree, in A minor', () => {
    expect(voices(60, A_MINOR)).toMatchObject({ line: 60, mirror: 57, centre: 59, octaflip: 48 })
    expect(voices(64, A_MINOR)).toEqual({
      line: 64,
      mirror: 53,
      middle: 60,
      'mirror-middle': 57,
      octaflip: 52,
      centre: 59,
    })
  })

  it('counts five steps to the octave in a five-note scale', () => {
    // F G A C D: the centre is G4, C5 is two steps over it.
    expect(voices(72, PENTATONIC)).toEqual({
      line: 72,
      mirror: 62,
      middle: 69,
      'mirror-middle': 65,
      octaflip: 60,
      centre: 67,
    })
  })

  it('puts the centre where it is asked to, in steps from the root', () => {
    // A3 is two steps under the root: 57. E4 is four steps over it, D3 four under.
    const phrase = mirrorsOf(chord([64], 1), { ...only('mirror', 'centreLevel'), centre: -2 })
    expect(notesOf(phrase)).toEqual([50, 57])
  })

  it('brings a made voice that falls off the end back by octaves', () => {
    // C8 is 27 steps over D4; E0 under it would be 16, which comes up to E2.
    expect(notesOf(mirrorsOf(chord([108], 1), only('mirror')))).toEqual([40])
  })

  it('keeps the arithmetic of the transform for any step', () => {
    expect(voiceIndex('middle', 33, 36, 7)).toBe(34)
    expect(voiceIndex('mirrorMiddle', 33, 36, 7)).toBe(38)
    expect(voiceIndex('octaflip', 36, 36, 7)).toBe(36)
  })
})

describe('Six voices: levels', () => {
  it('plays a voice more softly the further it lies from the centre', () => {
    const at = (note: number, fall: number): number =>
      mirrorsOf(chord([note], 1), { ...only('mirror'), fall })[0].gain
    // D5 is an octave over D4: its mirror is at half, the one of an octave more at a quarter.
    expect(at(74, 1)).toBeCloseTo(0.4, 6)
    expect(at(86, 1)).toBeCloseTo(0.2, 6)
    expect(at(86, 0)).toBeCloseTo(0.8, 6)
  })

  it('falls with distance as it comes', () => {
    const gain = (note: number): number => {
      const phrase = made(SIX_VOICES, chord([note], 1), { params: { human: 0 }, parts: PARTS })
      return phrase.find((event) => event.part === 'mirror')?.gain ?? 0
    }
    expect(gain(64)).toBeGreaterThan(gain(69))
    expect(gain(69)).toBeGreaterThan(gain(79))
  })

  it('plays the made voices alone with the line off', () => {
    expect(
      notesOf(made(SIX_VOICES, chord([69], 1), { params: { ...only('mirror'), line: 0 } })),
    ).toEqual([55])
  })

  it('does not strike a played note again for a voice that meets it', () => {
    // C4 is held, with its mirror E4. Playing E4 strikes it. The mirror of that is C4, which is not.
    const held = [
      { atSec: 0, durSec: 4, note: 60, gain: 0.8 },
      { atSec: 1, durSec: 1, note: 64, gain: 0.8 },
    ]
    const phrase = made(SIX_VOICES, held, { params: { ...only(), mirror: 0.5 } })
    expect(timed(phrase)).toEqual([
      [0, 60, 4],
      [0, 64, 1],
      [1, 64, 3],
    ])
  })

  it('gives every note of a chord its own strike, whatever the voices meet', () => {
    // E4 first, whose mirror is the C4 that is played with it.
    const phrase = made(SIX_VOICES, chord([64, 60], 1), { params: { ...only(), mirror: 0.2 } })
    expect(phrase.map((event) => [event.note, event.gain])).toEqual([
      [64, 0.8],
      [60, 0.8],
    ])
  })
})

describe('Six voices: time', () => {
  const canon = { ...only('mirror', 'middle', 'mirrorMiddle'), delay: 0.5 }

  it('spreads the chord into a canon of 0, 0.5, 1 and 1.5 seconds, each as long as the note', () => {
    const phrase = made(SIX_VOICES, chord([69], 2), { params: canon })
    expect(timed(phrase)).toEqual([
      [0, 69, 2],
      [0.5, 55, 2],
      [1, 65, 2],
      [1.5, 59, 2],
    ])
  })

  it('plays a note shorter than its delay to its whole length', () => {
    const phrase = made(SIX_VOICES, chord([69], 0.2), { params: canon })
    expect(timed(phrase)).toEqual([
      [0, 69, 0.2],
      [0.5, 55, 0.2],
      [1, 65, 0.2],
      [1.5, 59, 0.2],
    ])
  })

  it('orders the voices as it is told', () => {
    const inOrder = (order: number): number[] =>
      notesOf(mirrorsOf(chord([69], 1), { ...PLAIN, delay: 0.5, order }))
    // A4: mirror G3, middle F4, mirror of it B3, octave flip A3, centre D4.
    expect(inOrder(0)).toEqual([55, 65, 59, 57, 62])
    expect(inOrder(1)).toEqual([55, 57, 65, 59, 62])
    expect(inOrder(2)).toEqual([62, 65, 59, 57, 55])
    expect(inOrder(3)).toEqual([55, 57, 65, 59, 62])
    expect(inOrder(4)).toEqual([55, 57, 59, 62, 65])
    expect(inOrder(5)).toEqual([65, 62, 59, 57, 55])
  })

  it('gives pairs one moment, and a voice that is off no turn', () => {
    const starts = (params: Record<string, number>): number[] =>
      timed(mirrorsOf(chord([69], 1), params)).map(([at]) => at)
    expect(starts({ ...PLAIN, delay: 1, order: 1 })).toEqual([1, 1, 2, 2, 3])
    expect(starts({ ...only('mirror', 'octaflip'), delay: 1 })).toEqual([1, 2])
    // With the line off the first does not wait.
    expect(starts({ ...only('mirror', 'octaflip'), delay: 1, line: 0 })).toEqual([0, 1])
  })

  it('strikes a pitch once when several voices of a note come to it late', () => {
    // E4: the middle, the mirror of it and the centre are all D4.
    for (const velocity of [0.3, 0.8]) {
      const phrase = made(
        SIX_VOICES,
        line(
          [
            [64, 1],
            [64, 1],
          ],
          velocity,
        ),
        { params: { ...only('middle', 'mirrorMiddle', 'centreLevel'), human: 1 } },
      )
      expect(notesOf(phrase)).toEqual([64, 62, 64, 62])
    }
  })

  it('lets voices be late, and no later than it says', () => {
    const late = mirrorsOf(chord([69], 1), { ...PLAIN, human: 1 }).map((event) => event.atSec)
    expect(new Set(late).size).toBe(5)
    for (const atSec of late) expect(atSec).toBeLessThan(0.083)
  })
})

describe('Six voices: the centre', () => {
  const drone = { ...only('centreLevel'), hold: 3 }

  it('is struck with each note at no hold, and is one long note over it', () => {
    const tune = line([
      [64, 1],
      [67, 1],
      [69, 1],
    ])
    expect(timed(mirrorsOf(tune, only('centreLevel')))).toEqual([
      [0, 62, 1],
      [1, 62, 1],
      [2, 62, 1],
    ])
    expect(timed(mirrorsOf(tune, drone))).toEqual([[0, 62, 6]])
  })

  it('is held over a rest shorter than its hold and begins again after a longer one', () => {
    const tune = [
      { atSec: 0, durSec: 1, note: 69 },
      { atSec: 3, durSec: 1, note: 67 },
      { atSec: 9, durSec: 1, note: 64 },
    ]
    expect(timed(mirrorsOf(tune, drone))).toEqual([
      [0, 62, 7],
      [9, 62, 4],
    ])
  })

  it('walks D E G D under a held note, the old note held a little into the new', () => {
    const phrase = mirrorsOf(chord([59], 33), { ...only('centreLevel'), walk: 1, hold: 1 })
    expect(timed(phrase)).toEqual([
      [0, 62, 8.23],
      [8.03, 64, 8.2],
      [16.03, 67, 8.2],
      [24.03, 62, 9.97],
    ])
    // Softer than it began.
    expect(phrase[1].gain).toBeLessThan(phrase[0].gain)
  })

  it('moves the harmony under one repeated note', () => {
    // A4 every eight seconds. Round D4: G3. Round E4: B3. Round G4: F4. Round D4 again.
    const tune = [0, 8, 16, 24].map((atSec) => ({ atSec, durSec: 5, note: 69 }))
    const phrase = mirrorsOf(tune, { ...only('mirror'), walk: 1 })
    expect(timed(phrase)).toEqual([
      [0, 55, 5],
      [8, 59, 5],
      [16, 65, 5],
      [24, 55, 5],
    ])
  })

  it('moves what is held with the walk', () => {
    const phrase = mirrorsOf(chord([69], 24), { ...only('mirror'), walk: 1 })
    expect(notesOf(phrase)).toEqual([55, 59, 65])
  })

  it('keeps a note two voices share: what moves on to it joins it', () => {
    // E4 is held, and the centre walks on to it, on the same instrument.
    const params = { ...only('centreLevel'), walk: 1, walkTime: 2, hold: 1 }
    const phrase = made(SIX_VOICES, chord([64], 3), { params })
    expect(timed(phrase)).toEqual([
      [0, 64, 4],
      [0, 62, 2.23],
    ])
  })

  it('begins its walk again after a rest', () => {
    const tune = [
      { atSec: 0, durSec: 5, note: 69 },
      { atSec: 8.5, durSec: 1, note: 69 },
      { atSec: 20, durSec: 1, note: 69 },
    ]
    expect(notesOf(mirrorsOf(tune, { ...only('mirror'), walk: 1 }))).toEqual([55, 59, 55])
  })

  it('walks by the same notes on five', () => {
    // F G A C D round G4: one step and then two are A4 and C5.
    const phrase = made(
      SIX_VOICES,
      chord([62], 23),
      { params: { ...only('centreLevel'), walk: 1 }, parts: PARTS, key: PENTATONIC },
      40,
    )
    expect(notesOf(phrase.filter((event) => event.part === 'centre'))).toEqual([67, 69, 72])
  })
})

describe('Six voices: under the hands', () => {
  it('follows a centre that is moved while notes are held', () => {
    const { maker, to, open } = player(only('mirror', 'centreLevel'))
    maker.noteOn(0, 1, 69, 0.8)
    to(1)
    expect(open()).toEqual(['centre:62', 'line:69', 'mirror:55'])
    maker.setParam(1, 'centre', 2)
    to(2)
    // Round E4 the mirror of A4 is B3.
    expect(open()).toEqual(['centre:64', 'line:69', 'mirror:59'])
    maker.noteOff(2, 1)
    to(3)
    expect(open()).toEqual([])
  })

  it('takes a voice off and puts it on while a key is held', () => {
    const { maker, to, open } = player(only('mirror'))
    maker.noteOn(0, 1, 69, 0.8)
    to(1)
    maker.setParam(1, 'mirror', 0)
    maker.setParam(1, 'octaflip', 0.5)
    to(2)
    expect(open()).toEqual(['line:69', 'octaflip:57'])
    maker.setParam(2, 'line', 0)
    to(3)
    expect(open()).toEqual(['octaflip:57'])
    maker.noteOff(3, 1)
    to(4)
    expect(open()).toEqual([])
  })

  it('plays a held voice anew at the level its control was left at', () => {
    const { maker, to, events } = player({ ...only(), mirror: 0.8 })
    maker.noteOn(0, 1, 69, 1)
    to(1)
    for (let i = 1; i <= 10; i += 1) maker.setParam(1 + i / 100, 'mirror', 0.8 - i * 0.05)
    to(2)
    const mirrors = events.filter((event) => event.on && event.part === 'mirror')
    expect(mirrors.map((event) => Math.round(event.gain * 100))).toEqual([80, 30])
  })

  it('goes into another key with what is held', () => {
    const { maker, to, open } = player(only('mirror'))
    maker.noteOn(0, 1, 64, 0.8)
    to(1)
    // C minor: E4 goes down to E flat, one step over D4, whose mirror is C4.
    maker.setKey(1, { root: 0, steps: [0, 2, 3, 5, 7, 8, 10] })
    to(2)
    expect(open()).toEqual(['line:63', 'mirror:60'])
  })

  it('ends a drone whose hold is taken away', () => {
    const { maker, to, open } = player({ ...only('centreLevel'), hold: 8 })
    maker.noteOn(0, 1, 69, 0.8)
    maker.noteOff(1, 1)
    to(2)
    expect(open()).toEqual(['centre:62'])
    maker.setParam(2, 'hold', 0)
    to(2.1)
    expect(open()).toEqual([])
  })

  it('keeps a repeated note, two keys on one pitch and fast playing in order', () => {
    const { maker, to, open, events } = player({ ...PLAIN, delay: 0.3, walk: 3, walkTime: 1 }, [])
    let id = 0
    for (let i = 0; i < 200; i += 1) {
      const at = i * 0.03
      maker.noteOn(at, id, 60 + (i % 5) * 2, 0.7)
      if (id > 2) maker.noteOff(at + 0.01, id - 2)
      id += 1
    }
    maker.noteOff(7, id - 1)
    maker.noteOff(7, id - 2)
    for (let i = 0; i < id; i += 1) maker.noteOff(7.1, i)
    to(30)
    expect(events.length).toBeGreaterThan(200)
    expect(open()).toEqual([])
    expect(maker.next()).toBe(Infinity)
  })

  it('has nothing left to do once its tails are over, its walk too', () => {
    const { maker, to } = player({ ...PLAIN, walk: 1, hold: 2, delay: 1 })
    maker.noteOn(0, 1, 69, 0.8)
    maker.noteOff(1, 1)
    to(20)
    expect(maker.next()).toBe(Infinity)
  })

  it('never has more than its share of voices at once', () => {
    const { maker, to, open } = player({ ...PLAIN, hold: 1 })
    for (let i = 0; i < 10; i += 1) maker.noteOn(0, i, 48 + i * 3, 0.7)
    to(1)
    expect(open().length).toBeLessThanOrEqual(58)
  })

  it('is silenced and plays again from the start of its walk', () => {
    const { maker, to, silence, open, events } = player({ ...only('mirror'), walk: 1 })
    maker.noteOn(0, 1, 69, 0.8)
    to(9)
    expect(open()).toContain('mirror:59')
    silence(9)
    expect(open()).toEqual([])
    events.length = 0
    maker.noteOn(9.5, 2, 69, 0.8)
    to(10)
    expect(open()).toEqual(['line:69', 'mirror:55'])
  })
})

makerContract(SIX_VOICES)
