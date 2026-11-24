import { describe, expect, it } from 'vitest'

import { BREATH_BUDGET } from '../breath-budget'
import { type MadePhraseNote, type PlayedNote } from '../phrase'
import { type MadeEvent } from '../types'
import { A_MINOR, line, made, makerContract, notesOf, PENTATONIC } from './support'

/** Every lung alike, every first breath whole, a return as loud as the note. */
const PLAIN = { lung: 10, breath: 1.4, vary: 0, scatter: 0, gap: 1, level: 1 }

function held(notes: readonly number[], gain: number, durSec: number): PlayedNote[] {
  return notes.map((note) => ({ atSec: 0, durSec, note, gain }))
}

/** The notes of one pitch as `[start, end]`, to a hundredth of a second. */
function spans(phrase: readonly MadePhraseNote[], note?: number): [number, number][] {
  const round = (sec: number): number => Math.round(sec * 100) / 100
  return phrase
    .filter((made) => note === undefined || made.note === note)
    .map((made) => [round(made.atSec), round(made.atSec + made.durSec)])
}

/** The moments a note ends before `toSec`, in order. */
function stops(phrase: readonly MadePhraseNote[], toSec: number): number[] {
  return phrase
    .map((note) => note.atSec + note.durSec)
    .filter((atSec) => atSec < toSec - 1e-6)
    .sort((a, b) => a - b)
}

/** The least distance between two stops. */
function closest(atSec: readonly number[]): number {
  return Math.min(...atSec.slice(1).map((at, i) => at - atSec[i]))
}

function expectStops(phrase: readonly MadePhraseNote[], wanted: readonly number[]): void {
  const found = stops(phrase, 12)
  expect(found).toHaveLength(wanted.length)
  for (const [i, atSec] of wanted.entries()) expect(found[i]).toBeCloseTo(atSec, 6)
}

/** The fewest voices that sound together at any moment of the phrase up to `toSec`. */
function fewest(phrase: readonly MadePhraseNote[], toSec: number): number {
  let least = Infinity
  for (let atSec = 0.005; atSec < toSec; atSec += 0.01)
    least = Math.min(
      least,
      phrase.filter((note) => note.atSec <= atSec && note.atSec + note.durSec > atSec).length,
    )
  return least
}

describe('Breath Budget: air', () => {
  it('lets a soft note last its lung and one twice as loud half as long', () => {
    for (const [gain, weight, seconds] of [
      [0.35, 1, 10],
      [0.7, 1, 5],
      [0.175, 1, 20],
      [0.7, 0, 10],
      [0.7, 2, 2.5],
    ]) {
      const phrase = made(BREATH_BUDGET, held([67], gain, 60), { params: { ...PLAIN, weight } }, 60)
      expect(phrase[0].durSec, `${gain} at ${weight}`).toBeCloseTo(seconds, 6)
    }
  })

  it('lets a note by itself breathe, again and again', () => {
    const phrase = made(BREATH_BUDGET, held([60], 0.7, 20), { params: PLAIN }, 30)
    expect(spans(phrase)).toEqual([
      [0, 5],
      [6.4, 11.4],
      [12.8, 17.8],
      [19.2, 20],
    ])
  })

  it('comes back softer, and lasts longer for it', () => {
    const phrase = made(
      BREATH_BUDGET,
      held([60], 0.7, 30),
      { params: { ...PLAIN, level: 0.5 } },
      30,
    )
    expect(spans(phrase)).toEqual([
      [0, 5],
      [6.4, 16.4],
      [17.8, 27.8],
      [29.2, 30],
    ])
    expect(phrase.map((note) => note.gain)).toEqual([0.7, 0.35, 0.35, 0.35])
  })

  it('spends more up high and less low down, from the root near middle C', () => {
    const last = (note: number, key?: typeof A_MINOR): number =>
      made(BREATH_BUDGET, held([note], 0.35, 60), { params: { ...PLAIN, register: 1 }, key }, 60)[0]
        .durSec
    expect(last(60)).toBeCloseTo(10, 6)
    expect(last(72)).toBeCloseTo(5, 6)
    expect(last(48)).toBeCloseTo(20, 6)
    // The A below middle C is where A minor counts from.
    expect(last(69, A_MINOR)).toBeCloseTo(5, 6)
  })

  it('keeps the share of the breath that is left when a lung grows, and ends a breath that became shorter', () => {
    const maker = BREATH_BUDGET.create({ params: { ...PLAIN, breath: 4 } })
    const events: MadeEvent[] = []
    const emit = (event: MadeEvent): number => events.push(event)
    maker.noteOn(0, 1, 60, 0.35)
    maker.setParam(5, 'lung', 20)
    maker.setParam(16, 'breath', 2)
    maker.advance(18, emit)
    expect(events.map(({ atSec, on }) => [Math.round(atSec * 1000) / 1000, on])).toEqual([
      [0, true],
      [15, false],
      [17, true],
    ])
  })
})

describe('Breath Budget: air under a control', () => {
  const stopAfter = (
    params: Record<string, number>,
    note: number,
    gain: number,
    move: (maker: ReturnType<typeof BREATH_BUDGET.create>) => void,
  ): number => {
    const maker = BREATH_BUDGET.create({ params })
    const events: MadeEvent[] = []
    maker.noteOn(0, 1, note, gain)
    move(maker)
    maker.advance(60, (event) => events.push(event))
    return events.find((event) => !event.on)?.atSec ?? Infinity
  }

  it('measures what is left anew when loudness or height costs more', () => {
    // At 0 a loud note lasts its ten seconds; at 5 s, half gone, it lasts a quarter of them.
    expect(
      stopAfter({ ...PLAIN, weight: 0 }, 60, 0.7, (maker) => maker.setParam(5, 'weight', 2)),
    ).toBeCloseTo(6.25, 6)
    expect(stopAfter(PLAIN, 72, 0.35, (maker) => maker.setParam(5, 'register', 1))).toBeCloseTo(
      7.5,
      6,
    )
  })

  it('counts height from the new root when the key moves', () => {
    // C4 is the root, and then three semitones over the A under it.
    expect(
      stopAfter({ ...PLAIN, register: 1 }, 60, 0.35, (maker) => maker.setKey(5, A_MINOR)),
    ).toBeCloseTo(5 + 5 * 2 ** (-3 / 12), 6)
  })

  it('breathes alike after a silence', () => {
    const maker = BREATH_BUDGET.create({ params: { ...PLAIN, vary: 0.6 } })
    const play = (from: number): number[] => {
      const ends: number[] = []
      maker.noteOn(from, 1, 60, 0.35)
      maker.advance(from + 50, (event) => {
        if (!event.on) ends.push(Math.round((event.atSec - from) * 1e6) / 1e6)
      })
      maker.silence(from + 50, () => {})
      return ends
    }
    const first = play(0)
    expect(first.length).toBeGreaterThan(2)
    expect(play(100)).toEqual(first)
  })
})

describe('Breath Budget: turns', () => {
  it('keeps stops apart when the lungs shrink and all are out of air at once', () => {
    const maker = BREATH_BUDGET.create({ params: { ...PLAIN, lung: 40, most: 6, gap: 0.5 } })
    const ends: number[] = []
    for (const [id, note] of [60, 64, 67, 72].entries()) maker.noteOn(0, id, note, 0.35)
    maker.setParam(30, 'lung', 2)
    maker.advance(60, (event) => {
      if (!event.on) ends.push(event.atSec)
    })
    expect(ends.length).toBeGreaterThan(20)
    expect(closest(ends)).toBeGreaterThanOrEqual(0.5 - 1e-9)
  })

  it('sings at least a second before a breath, however many come in', () => {
    const notes = [48, 55, 60, 64, 67, 71, 74, 79]
    const played = notes.map((note, i) => ({ atSec: i * 0.45, durSec: 40, note, gain: 0.35 }))
    const params = { ...PLAIN, lung: 3, gap: 1, most: 6, scatter: 0.9 }
    const phrase = made(BREATH_BUDGET, played, { params }, 39)
    for (const note of phrase)
      if (note.atSec + note.durSec < 38.9) expect(note.durSec).toBeGreaterThanOrEqual(1 - 1e-9)
  })

  it('lets the first of two go early, so that it is back when the second stops', () => {
    const phrase = made(BREATH_BUDGET, held([60, 64], 0.35, 24), { params: PLAIN }, 24)
    expect(spans(phrase, 60)).toEqual([
      [0, 8.6],
      [10, 20],
      [21.4, 24],
    ])
    expect(spans(phrase, 64)).toEqual([
      [0, 10],
      [11.4, 21.4],
      [22.8, 24],
    ])
  })

  it('counts three back from the last', () => {
    const phrase = made(BREATH_BUDGET, held([60, 64, 67], 0.35, 12), { params: PLAIN }, 12)
    expectStops(phrase, [7.2, 8.6, 10])
  })

  it('keeps stops as far apart as it is told', () => {
    const params = { ...PLAIN, gap: 3 }
    const phrase = made(BREATH_BUDGET, held([60, 64, 67], 0.35, 12), { params }, 12)
    expectStops(phrase, [4, 7, 10])
  })

  it('lets two be silent together where it may, and never both of two', () => {
    const three = made(
      BREATH_BUDGET,
      held([60, 64, 67], 0.35, 12),
      { params: { ...PLAIN, most: 2 } },
      12,
    )
    expectStops(three, [8, 9, 10])
    expect(fewest(three, 11.9)).toBe(1)
    const two = made(BREATH_BUDGET, held([60, 64], 0.35, 12), { params: { ...PLAIN, most: 6 } }, 12)
    expectStops(two, [8.6, 10])
  })

  it('keeps six voices going for ever, one silent at the most, stops a second apart', () => {
    const six = [48, 55, 60, 64, 67, 71]
    for (const gain of [0.2, 0.3, 0.4]) {
      const phrase = made(
        BREATH_BUDGET,
        held(six, gain, 300),
        { params: { lung: 9, breath: 1.4, gap: 1 } },
        300,
      )
      expect([...new Set(notesOf(phrase))].sort((a, b) => a - b)).toEqual(six)
      expect(closest(stops(phrase, 300))).toBeGreaterThanOrEqual(1 - 1e-9)
      expect(fewest(phrase, 300)).toBe(5)
      // Nobody sings on past the longest of its lungs by more than half a breath.
      const longest = Math.max(...phrase.map((note) => note.durSec))
      expect(longest).toBeLessThan(((9 * 0.35) / (gain * 0.9)) * 1.2 + 0.7)
      // Everyone breathes, and nobody at the pace of anybody else.
      for (const note of six) expect(spans(phrase, note).length).toBeGreaterThan(10)
    }
  })

  it('starts the breaths of a chord apart', () => {
    const params = { ...PLAIN, scatter: 0.9 }
    const phrase = made(BREATH_BUDGET, held([60, 64, 67], 0.35, 12), { params }, 12)
    // 1, 1 - 0.9 x 0.618 and 1 - 0.9 x 0.236 of ten seconds.
    expect(spans(phrase, 64)[0]).toEqual([0, 4.44])
    expect(spans(phrase, 67)[0]).toEqual([0, 7.88])
    expect(spans(phrase, 60)[0]).toEqual([0, 10])
  })

  it('takes shorter breaths when a section is too big for its air', () => {
    // A second of air and 1.4 of breath: two voices cannot cover for each other.
    const params = { ...PLAIN, lung: 2, gap: 0 }
    const phrase = made(BREATH_BUDGET, held([60, 64], 0.7, 40), { params }, 40)
    const low = spans(phrase, 60)
    for (let i = 1; i < low.length; i += 1) expect(low[i][0] - low[i - 1][1]).toBeCloseTo(0.9, 1)
    expect(fewest(phrase, 39.9)).toBe(1)
  })

  it('never passes the number silent, however many voices and however little air', () => {
    const ten = [36, 43, 48, 52, 55, 60, 64, 67, 72, 76]
    for (const most of [1, 3]) {
      const params = { ...PLAIN, lung: 2, most }
      const phrase = made(BREATH_BUDGET, held(ten, 1, 60), { params }, 60)
      expect(fewest(phrase, 59.9)).toBe(10 - most)
      for (const note of ten) expect(spans(phrase, note).length, `${note}`).toBeGreaterThan(5)
    }
  })

  it('holds on past its air by a quarter and a turn at the most, where breaths can still be taken', () => {
    const notes = [36, 43, 48, 52, 55, 60, 64, 67]
    for (const count of [2, 3, 4, 6, 8]) {
      for (const lung of [6, 9, 14, 20]) {
        const params = { ...PLAIN, lung }
        const phrase = made(BREATH_BUDGET, held(notes.slice(0, count), 0.7, 120), { params }, 120)
        const longest = Math.max(...phrase.map((note) => note.durSec))
        expect(longest, `${count} of ${lung} s`).toBeLessThan((lung / 2) * 1.25 + 1.4)
      }
    }
  })
})

describe('Breath Budget: where a voice comes back', () => {
  it('climbs the chord inside itself: Next with no reach', () => {
    const six = [48, 55, 60, 64, 67, 71]
    const params = { ...PLAIN, lung: 9, back: 1, reach: 0 }
    const phrase = made(BREATH_BUDGET, held(six, 0.3, 26), { params }, 26)
    expect(notesOf(phrase)).toEqual([
      ...six,
      // C3 stays; G3 goes to B3; C4, E4 and G4 have neighbours over them and wait; B4 is the top.
      ...[48, 59, 60, 64, 67, 52],
      // B3 finds B4 free, and E3 the G3 that was left: the chord as it was played.
      ...[48, 71, 60, 64, 67, 55],
    ])
  })

  it('goes over the top of a close chord as far as it reaches', () => {
    const params = { ...PLAIN, back: 1 }
    const phrase = made(BREATH_BUDGET, held([60, 64, 67], 0.35, 23), { params }, 23)
    expect(notesOf(phrase)).toEqual([60, 64, 67, 60, 72, 76, 60, 79, 76])
    const minor = made(BREATH_BUDGET, held([57, 60, 64], 0.35, 12), { params, key: A_MINOR }, 12)
    expect(notesOf(minor)).toEqual([57, 60, 64, 57, 69, 72])
  })

  it('comes down with Below, from the top again when it is at the bottom', () => {
    const params = { ...PLAIN, back: 2 }
    const phrase = made(BREATH_BUDGET, held([60, 64, 67], 0.35, 12), { params }, 12)
    // E4 is the lowest that moves, so it goes to the top, and G4 to the E4 it left.
    expect(notesOf(phrase)).toEqual([60, 64, 67, 60, 79, 64])
  })

  it('changes octave with Octave and comes back', () => {
    const params = { ...PLAIN, back: 3 }
    const phrase = made(BREATH_BUDGET, held([60, 64, 67], 0.35, 23), { params }, 23)
    expect(notesOf(phrase)).toEqual([60, 64, 67, 60, 76, 79, 60, 64, 67])
  })

  it('leans a step of the key away with Neighbour, and goes home', () => {
    const params = { ...PLAIN, back: 4 }
    const of = (notes: readonly number[], key?: typeof A_MINOR): number[] =>
      notesOf(made(BREATH_BUDGET, held(notes, 0.35, 23), { params, key }, 23))
    expect(of([60, 64, 67])).toEqual([60, 64, 67, 60, 65, 69, 60, 64, 67])
    expect(of([57, 60, 64], A_MINOR)).toEqual([57, 60, 64, 57, 62, 65, 57, 60, 64])
    // Over A in this scale is C, which is sung: G it is. Over C is D.
    expect(of([65, 69, 72], PENTATONIC)).toEqual([65, 69, 72, 65, 67, 74, 65, 69, 72])
  })

  it('goes to notes of the chord only with Any, and never two to one', () => {
    const params = { ...PLAIN, back: 5, vary: 0.4, most: 2 }
    const phrase = made(BREATH_BUDGET, held([50, 57, 65, 72], 0.35, 200), { params }, 200)
    for (const note of notesOf(phrase)) expect([2, 9, 5, 0]).toContain(note % 12)
    for (const a of phrase)
      for (const b of phrase)
        if (a !== b && a.note === b.note)
          expect(a.atSec + a.durSec <= b.atSec + 1e-9 || b.atSec + b.durSec <= a.atSec + 1e-9).toBe(
            true,
          )
    expect(new Set(notesOf(phrase)).size).toBeGreaterThan(6)
  })

  it('keeps the chord while it turns over: a note nobody sings is the next to come back', () => {
    const chord = [48, 55, 64, 71]
    for (const back of [1, 2, 5]) {
      for (const reach of [0, 1, 2]) {
        const params = { lung: 8, breath: 0.8, vary: 0.4, scatter: 0.9, back, reach }
        const phrase = made(BREATH_BUDGET, held(chord, 0.6, 300), { params }, 300)
        for (const pitchClass of [0, 7, 4, 11]) {
          const of = phrase
            .filter((note) => note.note % 12 === pitchClass)
            .sort((a, b) => a.atSec - b.atSec)
          let sungTo = 0
          let longest = 0
          for (const note of of) {
            longest = Math.max(longest, note.atSec - sungTo)
            sungTo = Math.max(sungTo, note.atSec + note.durSec)
          }
          longest = Math.max(longest, 300 - sungTo)
          expect(longest, `${back}, ${reach}, ${pitchClass}`).toBeLessThan(6)
        }
      }
    }
  })

  it('takes a note that is missing before one that is nearer', () => {
    const params = { ...PLAIN, back: 2, reach: 0 }
    const phrase = made(BREATH_BUDGET, held([48, 55, 64, 71], 0.35, 11.5), { params }, 11.5)
    // G3 comes down to E3, so there is no G: E4 passes over the C4 under it and takes G3.
    expect(notesOf(phrase)).toEqual([48, 55, 64, 71, 48, 52, 55, 67])
  })

  it('leans clear of where a silent voice comes home to', () => {
    // Over A3 is B3, a minor ninth under the C5 that is taking a breath. Under it is G3.
    for (const vary of [0.3, 0.45, 0.6]) {
      const params = { lung: 8, breath: 0.8, vary, scatter: 0.9, back: 4 }
      const phrase = made(BREATH_BUDGET, held([50, 57, 65, 72], 0.6, 200), { params }, 200)
      expect(notesOf(phrase)).not.toContain(59)
    }
  })

  it('does not lean to a semitone from where another is at home, though it has leaned away', () => {
    // F4 has gone to G4. Over D4 is E4, under the F: C4 it is.
    const params = { ...PLAIN, back: 4 }
    const phrase = made(BREATH_BUDGET, held([57, 65, 62], 0.35, 11.5), { params }, 11.5)
    expect(notesOf(phrase)).toEqual([57, 65, 62, 57, 67, 60])
  })

  it('makes no third low down, and goes no higher than the C over the treble staff by itself', () => {
    for (const back of [1, 2, 3, 5]) {
      const at = (notes: readonly number[], reach: number): number[] =>
        notesOf(
          made(
            BREATH_BUDGET,
            held(notes, 0.7, 120),
            { params: { ...PLAIN, vary: 0.3, back, reach } },
            120,
          ),
        )
      // E2 is a third over the C2 that stays.
      expect(at([36, 43, 52], 0)).not.toContain(40)
      const high = at([84, 88, 91], 2)
      expect(Math.max(...high)).toBe(back === 3 ? 91 : 96)
    }
  })

  it('leaves the bass its own note while it takes a breath', () => {
    const params = { ...PLAIN, back: 2, reach: 0, most: 2 }
    const phrase = made(BREATH_BUDGET, held([71, 64, 55, 48], 0.35, 12), { params }, 12)
    // G3 comes back while C3 is silent: to the E under it, and to no C in the bass's place.
    expect(notesOf(phrase)).toEqual([71, 64, 55, 48, 64, 59, 52, 48])
  })

  it('does not lean off the end of the keyboard', () => {
    const params = { ...PLAIN, back: 4, bass: 0 }
    expect(notesOf(made(BREATH_BUDGET, held([119], 0.35, 22), { params }, 22))).toEqual([119, 117])
  })

  it('keeps the bass, or lets it move too', () => {
    const at = (bass: number): number[] =>
      notesOf(
        made(
          BREATH_BUDGET,
          held([60, 64, 67], 0.35, 9),
          { params: { ...PLAIN, back: 1, bass } },
          9,
        ),
      )
    expect(at(1)).toEqual([60, 64, 67, 60])
    expect(at(0)).toEqual([60, 64, 67, 72])
  })

  it('plays a note outside the key as it is', () => {
    expect(notesOf(made(BREATH_BUDGET, held([61], 0.7, 8), { params: PLAIN }, 8))).toEqual([61, 61])
  })
})

describe('Breath Budget: under the hands', () => {
  it('leaves quick playing alone', () => {
    const quick = line(
      [60, 60, 62, 64, 64, 64, 67, 60, 72, 71].map((note) => [note, 0.12] as const),
      1,
    )
    const rest = { lung: 2, scatter: 0.9, vary: 0.6, weight: 1 }
    for (const params of [PLAIN, rest]) {
      const phrase = made(BREATH_BUDGET, quick, { params }, 4)
      expect(notesOf(phrase)).toEqual([60, 60, 62, 64, 64, 64, 67, 60, 72, 71])
      for (const note of phrase) expect(note.durSec).toBeCloseTo(0.12, 6)
    }
  })

  it('takes a key played again as one voice, struck again', () => {
    const phrase = made(
      BREATH_BUDGET,
      [
        { atSec: 0, durSec: 4, note: 60, gain: 0.5 },
        { atSec: 1, durSec: 1, note: 60, gain: 0.7 },
      ],
      { params: PLAIN },
      10,
    )
    expect(spans(phrase)).toEqual([
      [0, 1],
      [1, 4],
    ])
    expect(phrase.map((note) => note.gain)).toEqual([0.5, 0.7])
    // Two keys of it at once are one attack.
    const together = [0, 0.01].map((atSec) => ({ atSec, durSec: 3, note: 60, gain: 0.5 }))
    expect(notesOf(made(BREATH_BUDGET, together, { params: PLAIN }, 5))).toEqual([60])
  })

  it('comes back as loud as it was last struck', () => {
    const phrase = made(
      BREATH_BUDGET,
      [
        { atSec: 0, durSec: 12, note: 60, gain: 0.35 },
        { atSec: 1, durSec: 11, note: 60, gain: 0.7 },
      ],
      { params: PLAIN },
      12,
    )
    expect(phrase.map((note) => note.gain)).toEqual([0.35, 0.7, 0.7])
  })

  it('takes a loudness that is none as silence, and the others still breathe', () => {
    const maker = BREATH_BUDGET.create({ params: PLAIN })
    const events: MadeEvent[] = []
    maker.noteOn(0, 1, 60, Number.NaN)
    maker.noteOn(0, 2, 64, 0.35)
    maker.noteOn(0, 3, 67, 5)
    maker.advance(12, (event) => events.push(event))
    expect(events.slice(0, 3).map((event) => event.gain)).toEqual([0, 0.35, 1])
    const firstStop = (note: number): number =>
      events.find((event) => !event.on && event.note === note)?.atSec ?? Infinity
    expect(firstStop(64)).toBeCloseTo(10, 6)
    // Five is as loud as one.
    expect(firstStop(67)).toBeCloseTo(3.5, 6)
  })

  it('starts nothing later for a key let go in its silence', () => {
    for (const back of [0, 1, 5]) {
      const phrase = made(
        BREATH_BUDGET,
        [
          { atSec: 0, durSec: 30, note: 60, gain: 0.35 },
          { atSec: 0, durSec: 9, note: 64, gain: 0.35 },
          { atSec: 0, durSec: 30, note: 67, gain: 0.35 },
        ],
        { params: { ...PLAIN, back, reach: 0, bass: 0 } },
        40,
      )
      // It had stopped at 8.6 and would have been back at 10.
      const late = phrase.filter((note) => note.atSec > 8.6)
      expect(late.length).toBeGreaterThan(2)
      for (const note of late) expect([60, 67]).toContain(note.note)
    }
  })

  it('ends with the keys, and what was silent stays silent', () => {
    const phrase = made(BREATH_BUDGET, held([60, 64, 67], 0.35, 9), { params: PLAIN }, 30)
    expect(Math.max(...phrase.map((note) => note.atSec + note.durSec))).toBeCloseTo(9, 6)
    expect(Math.max(...phrase.map((note) => note.atSec))).toBeLessThan(9)
  })

  it('comes back at once when the hand leaves only a voice that is taking a breath', () => {
    const phrase = made(
      BREATH_BUDGET,
      [
        { atSec: 0, durSec: 15, note: 60, gain: 0.35 },
        { atSec: 0, durSec: 9, note: 64, gain: 0.35 },
      ],
      { params: PLAIN },
      15,
    )
    // It had 0.48 of its 1.4 seconds, and so 3.43 of ten seconds of air.
    expect(spans(phrase, 60)).toEqual([
      [0, 8.6],
      [9.08, 12.51],
      [13.91, 15],
    ])
    const sooner = made(
      BREATH_BUDGET,
      [
        { atSec: 0, durSec: 15, note: 60, gain: 0.35 },
        { atSec: 0, durSec: 8.7, note: 64, gain: 0.35 },
      ],
      { params: PLAIN },
      15,
    )
    expect(spans(sooner, 60)[1]).toEqual([8.78, 11.78])
  })

  it('does not cut short the breath a voice took alone', () => {
    const phrase = made(
      BREATH_BUDGET,
      [
        { atSec: 0, durSec: 8, note: 60, gain: 0.7 },
        { atSec: 5.2, durSec: 0.2, note: 67, gain: 0.7 },
      ],
      { params: PLAIN },
      12,
    )
    expect(spans(phrase, 60)).toEqual([
      [0, 5],
      [6.4, 8],
    ])
  })

  it('takes a voice that moved home when its note is no longer of the chord', () => {
    const phrase = made(
      BREATH_BUDGET,
      [
        { atSec: 0, durSec: 10.7, note: 60, gain: 0.35 },
        { atSec: 0, durSec: 24, note: 64, gain: 0.35 },
        { atSec: 0, durSec: 14, note: 67, gain: 0.35 },
      ],
      { params: { ...PLAIN, back: 1 } },
      24,
    )
    // E4 had gone up to C5, whose C was let go.
    expect(spans(phrase, 72)).toEqual([[10, 10.78]])
    expect(spans(phrase, 64)).toEqual([
      [0, 8.6],
      // On the air it took at ten.
      [10.78, 20],
      [21.4, 24],
    ])
  })

  it('plays every second voice and every other breath on a part', () => {
    const phrase = made(
      BREATH_BUDGET,
      held([60, 64], 0.35, 24),
      { params: PLAIN, parts: { second: { deviceId: 'flute' }, relief: { deviceId: 'choir' } } },
      24,
    )
    const partsOf = (note: number): (string | undefined)[] =>
      phrase.filter((made) => made.note === note).map((made) => made.part)
    expect(partsOf(60)).toEqual([undefined, 'relief', undefined])
    expect(partsOf(64)).toEqual(['second', 'second', 'second'])
  })
})

makerContract(BREATH_BUDGET)
