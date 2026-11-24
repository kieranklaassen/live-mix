import { describe, expect, it } from 'vitest'

import { COMPANION_VOICE } from '../companion-voice'
import { type PlayedNote } from '../phrase'
import { WHITE_KEYS, type MadeEvent, type MakerKey } from '../types'
import { A_MINOR, chord, line, made, makerContract, PENTATONIC } from './support'

const TRIAD = 0
const THIRDS = 3
const SIXTHS = 4
const FIFTHS = 5
const FOURTHS = 6
const FAUXBOURDON = 7

const BOTH = { companion: { deviceId: 'flute' }, third: { deviceId: 'choir' } }

/** What is written beside `notes`, with the line itself left out. */
function beside(
  notes: readonly PlayedNote[],
  params: Record<string, number>,
  key: MakerKey = WHITE_KEYS,
  part = 'companion',
) {
  return made(COMPANION_VOICE, notes, { params, key, parts: BOTH }, 40).filter(
    (note) => note.part === part,
  )
}

/** The companion of notes one after another. */
function companions(
  notes: readonly number[],
  params: Record<string, number>,
  key?: MakerKey,
  part?: string,
): number[] {
  const played = line(notes.map((note) => [note, 1] as const))
  return beside(played, params, key, part).map((made) => made.note)
}

// A4 B4 C5 D5 E5 D5 C5 B4
const MELODY = [69, 71, 72, 74, 76, 74, 72, 71]

describe('Companion Voice: the triad', () => {
  it('takes the nearest note of A C E below', () => {
    expect(companions(MELODY, { rule: TRIAD, tonic: 6 })).toEqual([64, 69, 69, 72, 72, 72, 69, 69])
  })

  it('takes the nearest note of A C E above', () => {
    expect(companions(MELODY, { rule: TRIAD, tonic: 6, side: 1 })).toEqual([
      72, 72, 76, 76, 81, 76, 76, 72,
    ])
  })

  it('alternates from below', () => {
    expect(companions(MELODY, { rule: TRIAD, tonic: 6, side: 2 })).toEqual([
      64, 72, 69, 76, 72, 76, 69, 72,
    ])
  })

  it('takes the next note but one in second position, and the one after that in third', () => {
    expect(companions(MELODY, { rule: 1, tonic: 6 })).toEqual([60, 64, 64, 69, 69, 69, 64, 64])
    expect(companions([69, 72, 71], { rule: 2, tonic: 6 })).toEqual([57, 60, 60])
  })

  it('counts its tonic in the key: the first degree of A minor is the sixth of C', () => {
    expect(companions(MELODY, { rule: TRIAD, tonic: 1 }, A_MINOR)).toEqual([
      64, 69, 69, 72, 72, 72, 69, 69,
    ])
  })

  it('has a triad on five notes, on the note nearest to the degree', () => {
    // F G A C D: F A C on the first degree, D F A on the sixth.
    const up = [65, 67, 69, 72, 74]
    expect(companions(up, { rule: TRIAD, tonic: 1 }, PENTATONIC)).toEqual([60, 65, 65, 69, 72])
    expect(companions(up, { rule: TRIAD, tonic: 6 }, PENTATONIC)).toEqual([62, 65, 65, 69, 69])
  })

  it('answers a note outside the key with a note of the chord', () => {
    expect(companions([70, 73], { rule: TRIAD, tonic: 6 })).toEqual([69, 72])
  })
})

describe('Companion Voice: the intervals', () => {
  it('writes thirds of the key below and above', () => {
    expect(companions(MELODY, { rule: THIRDS })).toEqual([65, 67, 69, 71, 72, 71, 69, 67])
    expect(companions([69, 71, 72], { rule: THIRDS, side: 1 })).toEqual([72, 74, 76])
  })

  it('writes sixths', () => {
    expect(companions([69, 71, 72, 74, 76], { rule: SIXTHS })).toEqual([60, 62, 64, 65, 67])
  })

  it('writes perfect fifths, and a fourth where there is only a tritone', () => {
    expect(companions([69, 71, 72, 77], { rule: FIFTHS })).toEqual([62, 64, 65, 72])
    expect(companions([72, 71], { rule: FIFTHS, side: 1 })).toEqual([79, 76])
  })

  it('writes perfect fourths, and a fifth where there is only a tritone', () => {
    expect(companions([72, 71], { rule: FOURTHS })).toEqual([67, 64])
    expect(companions([72, 77], { rule: FOURTHS, side: 1 })).toEqual([77, 84])
  })

  it('takes what five notes have: a fourth for a missing third, a fifth for a missing sixth', () => {
    expect(companions([65, 67, 69, 72, 74], { rule: THIRDS }, PENTATONIC)).toEqual([
      62, 62, 65, 69, 69,
    ])
    expect(companions([65, 67, 69], { rule: SIXTHS }, PENTATONIC)).toEqual([57, 60, 60])
  })

  it('keeps behind the line: below it while it rises, above it while it falls', () => {
    expect(companions([69, 71, 72, 71, 71, 72], { rule: THIRDS, side: 3 })).toEqual([
      65, 67, 69, 74, 74, 69,
    ])
  })

  it('moves by octaves', () => {
    expect(companions([69, 71], { rule: THIRDS, octave: -1 })).toEqual([53, 55])
  })
})

describe('Companion Voice: fauxbourdon', () => {
  it('puts a sixth and a fourth under the line', () => {
    const notes = [72, 71, 69, 67]
    expect(companions(notes, { rule: FAUXBOURDON })).toEqual([64, 62, 60, 59])
    expect(companions(notes, { rule: FAUXBOURDON }, WHITE_KEYS, 'third')).toEqual([67, 65, 64, 62])
  })

  it('puts a third and a sixth over it', () => {
    const params = { rule: FAUXBOURDON, side: 1 }
    expect(companions([64, 65], params)).toEqual([72, 74])
    expect(companions([64, 65], params, WHITE_KEYS, 'third')).toEqual([67, 69])
  })

  it('opens to an octave and a fifth on a note that is held, and not on one that is not', () => {
    const notes = line([
      [71, 1],
      [72, 3],
    ])
    const params = { rule: FAUXBOURDON, cadence: 1, opens: 1, follow: 0 }
    const outer = beside(notes, params)
    // E4 goes to C4 a second into the C5; the fourth under it is a fifth over that.
    expect(outer.map((made) => made.note)).toEqual([62, 64, 60])
    expect(outer[2].atSec).toBeCloseTo(2.02)
    expect(outer[2].durSec).toBeCloseTo(1.98)
    expect(beside(notes, params, WHITE_KEYS, 'third').map((made) => made.note)).toEqual([65, 67])
  })

  it('leaves the tritone for a fifth when it opens on B', () => {
    const params = { rule: FAUXBOURDON, cadence: 1, opens: 1, follow: 0 }
    expect(beside(chord([71], 3), params).map((n) => n.note)).toEqual([62, 59])
    expect(beside(chord([71], 3), params, WHITE_KEYS, 'third').map((n) => n.note)).toEqual([65, 64])
  })
})

describe('Companion Voice: cadences', () => {
  it('goes to the tonic in Triad, and stays when it is there', () => {
    const params = { tonic: 6, cadence: 1, opens: 1, follow: 0 }
    expect(beside(chord([76], 3), params).map((n) => n.note)).toEqual([72, 69])
    expect(beside(chord([71], 3), params).map((n) => n.note)).toEqual([69])
  })

  it('waits for the delay too, and asks how long the note itself was held', () => {
    const params = { rule: THIRDS, cadence: 1, opens: 1, delay: 2, follow: 0 }
    const held = beside(chord([72], 3), params)
    expect(held.map((n) => [n.note, n.atSec])).toEqual([
      [69, 2],
      [60, 3.02],
    ])
    expect(beside(chord([72], 0.9), { ...params, ring: 6 }).map((n) => n.note)).toEqual([69])
    expect(beside(chord([72], 1), { ...params, ring: 6 }).map((n) => n.note)).toEqual([69])
  })
})

describe('Companion Voice: cadences on the tonic', () => {
  it('is at the octave for a note on the tonic, from its start', () => {
    expect(companions([71, 72, 74], { rule: FAUXBOURDON, cadence: 2 })).toEqual([62, 60, 65])
    expect(companions([71, 72, 69], { rule: THIRDS, cadence: 2, tonic: 6 })).toEqual([67, 69, 57])
    // In the triad rules, A over A C E is answered with the A under it.
    expect(companions([71, 69], { rule: TRIAD, cadence: 2, tonic: 6 })).toEqual([69, 57])
  })

  it('waits on a tonic until it is held, and leaves other notes alone', () => {
    const params = { rule: SIXTHS, cadence: 3, opens: 1, follow: 0 }
    expect(beside(chord([72], 3), params).map((n) => n.note)).toEqual([64, 60])
    expect(beside(chord([74], 3), params).map((n) => n.note)).toEqual([65])
  })
})

describe('Companion Voice: which notes and when', () => {
  it('follows the top, the bottom or all of a chord', () => {
    const notes = chord([60, 64, 67], 2)
    expect(beside(notes, { rule: SIXTHS, follow: 1 }).map((n) => n.note)).toEqual([59])
    expect(beside(notes, { rule: SIXTHS, follow: 2 }).map((n) => n.note)).toEqual([52])
    expect(beside(notes, { rule: SIXTHS, follow: 0 }).map((n) => n.note)).toEqual([52, 55, 59])
  })

  it('hears a chord that is rolled, from either end, as one chord', () => {
    for (const notes of [
      [60, 64, 67],
      [67, 64, 60],
    ]) {
      const rolled = notes.map((note, i) => ({ atSec: i * 0.01, durSec: 2, note }))
      expect(beside(rolled, { rule: THIRDS }).map((n) => n.note)).toEqual([64])
    }
  })

  it('answers every other note', () => {
    expect(companions(MELODY, { rule: THIRDS, every: 2 })).toEqual([65, 69, 72, 69])
    expect(companions(MELODY, { rule: THIRDS, every: 3 })).toEqual([65, 71, 69])
  })

  it('is late by the delay, as long as the note, and rings on', () => {
    const [late] = beside(chord([72], 1), { rule: THIRDS, follow: 0, delay: 2, ring: 0.5 })
    expect([late.note, late.atSec, late.durSec]).toEqual([69, 2, 1.5])
    expect(late.gain).toBeCloseTo(0.56)
  })

  it('answers a note that is let go before its chord is heard', () => {
    const [made] = beside(chord([72], 0.01), { rule: THIRDS })
    expect(made.note).toBe(69)
    expect(made.atSec).toBeCloseTo(1 / 30)
    expect(made.durSec).toBeCloseTo(0.01)
  })

  it('plays the companion alone', () => {
    const notes = made(COMPANION_VOICE, line([[72, 1]]), {
      params: { rule: THIRDS, melody: 0 },
    })
    expect(notes.map((note) => note.note)).toEqual([69])
  })

  it('struck twice, rings as one voice at one pitch', () => {
    const notes = beside(
      line([
        [71, 1],
        [72, 1],
      ]),
      { tonic: 6, ring: 3, follow: 0 },
    )
    const tenths = (sec: number): number => Math.round(sec * 10) / 10
    expect(notes.map((n) => [n.note, tenths(n.atSec), tenths(n.durSec)])).toEqual([
      [69, 0, 1],
      [69, 1, 4],
    ])
  })
})

/** A maker that is played by hand, with what it wrote and what sounds. */
function playing(params: Record<string, number>, parts = ['companion', 'third']) {
  const maker = COMPANION_VOICE.create({ params, parts })
  const events: MadeEvent[] = []
  const open = new Map<number, number>()
  const to = (atSec: number): void =>
    maker.advance(atSec, (event) => {
      events.push(event)
      if (event.on) open.set(event.id, event.note)
      else open.delete(event.id)
    })
  const sounding = (): number[] => [...open.values()].sort((a, b) => a - b)
  return { maker, events, to, sounding }
}

const HARMONIC: MakerKey = { root: 9, steps: [0, 2, 3, 5, 7, 8, 11] }
const IN_SEN: MakerKey = { root: 7, steps: [0, 1, 5, 7, 10] }
const ONE_NOTE: MakerKey = { root: 2, steps: [0] }

describe('Companion Voice: the triad in any key', () => {
  const pitchClass = (note: number): number => ((note % 12) + 12) % 12

  it('is found one semitone at a time, in all three positions', () => {
    // C E G, A C E in minor, and D F A with the raised seventh beside it.
    const rows: [MakerKey, number, number[]][] = [
      [WHITE_KEYS, 1, [0, 4, 7]],
      [A_MINOR, 1, [9, 0, 4]],
      [HARMONIC, 4, [2, 5, 9]],
      [HARMONIC, 5, [4, 8, 11]],
    ]
    for (const [key, tonic, triad] of rows) {
      for (let note = 48; note < 85; note += 1) {
        if (!key.steps.includes(pitchClass(note - key.root))) continue
        for (const rule of [0, 1, 2]) {
          for (const side of [0, 1]) {
            let wanted = note
            for (let left = rule + 1; left > 0;) {
              wanted += side === 1 ? 1 : -1
              if (triad.includes(pitchClass(wanted))) left -= 1
            }
            expect(companions([note], { rule, side, tonic }, key)).toEqual([wanted])
          }
        }
      }
    }
  })

  it('has the sixth for a fifth that would be diminished', () => {
    // The second degree of A minor is B D F: B D G.
    expect(companions([72, 69, 74], { rule: TRIAD, tonic: 2 }, A_MINOR)).toEqual([71, 67, 71])
    // With G sharp there is no G to take: B D F as it stands.
    expect(companions([67, 72], { rule: TRIAD, tonic: 2 }, HARMONIC)).toEqual([65, 71])
  })

  it('stays in a key of few notes', () => {
    expect(companions([62, 65, 74], { rule: TRIAD }, ONE_NOTE)).toEqual([50, 62, 62])
    for (const note of companions([62, 67, 68, 72], { rule: TRIAD, tonic: 3, side: 2 }, IN_SEN)) {
      expect([7, 8, 0, 2, 5]).toContain(pitchClass(note))
    }
  })

  it('takes a note sung between the keys as the key beside it', () => {
    expect(companions([69.3, 71.8], { rule: TRIAD, tonic: 6 })).toEqual([64, 69])
    expect(companions([69.3], { rule: THIRDS })).toEqual([65])
  })
})

describe('Companion Voice: the line it goes beside', () => {
  /** Line and companion on one instrument. */
  const together = (notes: readonly PlayedNote[], params: Record<string, number>) =>
    made(COMPANION_VOICE, notes, { params }, 40).map((n) => [
      n.note,
      Math.round(n.atSec * 100) / 100,
      Math.round(n.durSec * 100) / 100,
      Math.round(n.gain * 100) / 100,
    ])

  it('is silent where the line holds its note, and leaves that note as loud and as long', () => {
    // The third under E4 is C4, which is held.
    expect(together(chord([60, 64], 2), { rule: THIRDS })).toEqual([
      [60, 0, 2, 0.8],
      [64, 0, 2, 0.8],
    ])
    const under = [
      { atSec: 0, durSec: 4, note: 60, gain: 0.8 },
      { atSec: 1, durSec: 1, note: 64, gain: 0.8 },
    ]
    expect(together(under, { rule: THIRDS })).toEqual([
      [60, 0, 4, 0.8],
      [57, 0.03, 4, 0.56],
      [64, 1, 1, 0.8],
    ])
  })

  it('comes in when the line leaves its note, for a key that is still held', () => {
    const notes = [
      { atSec: 0, durSec: 1.1, note: 69, gain: 0.8 },
      { atSec: 1, durSec: 2, note: 71, gain: 0.8 },
    ]
    expect(together(notes, { tonic: 6 })).toEqual([
      [69, 0, 1.1, 0.8],
      [64, 0.03, 1.1, 0.56],
      [71, 1, 2, 0.8],
      [69, 1.13, 1.9, 0.56],
    ])
  })

  it('does not come in for keys that are let go together', () => {
    const rolled = chord([60, 64], 2).map((n, i) => ({ ...n, durSec: 2 + i * 0.02 }))
    expect(together(rolled, { rule: THIRDS, ring: 3 }).length).toBe(2)
  })

  it('gives way to a line that comes to its note while it sounds', () => {
    const notes = [
      { atSec: 0, durSec: 3, note: 71, gain: 0.8 },
      { atSec: 1, durSec: 0.5, note: 69, gain: 0.8 },
    ]
    // A4 under B4, the line's own A4 for as long as it is held, and A4 under B4 again.
    expect(together(notes, { tonic: 6, follow: 1 })).toEqual([
      [71, 0, 3, 0.8],
      [69, 0.03, 0.97, 0.56],
      [69, 1, 0.5, 0.8],
      [69, 1.53, 1.5, 0.56],
    ])
    // A bell that only rings is over then: the line's note is as short as it was played.
    const after = line([
      [71, 1],
      [69, 0.2],
    ])
    expect(together(after, { tonic: 6, ring: 4 }).filter(([note]) => note === 69)).toEqual([
      [69, 0.03, 0.97, 0.56],
      [69, 1, 0.2, 0.8],
    ])
  })

  it('writes nothing under a chord from above that its line then strikes', () => {
    // E4 first, C4 at the same moment: C4 is the line's, struck once, at its level.
    const { maker, events, to } = playing({ rule: THIRDS, follow: 0 }, [])
    maker.noteOn(0, 1, 64, 0.8)
    maker.noteOn(0, 2, 60, 0.8)
    to(1)
    expect(events.filter((e) => e.note === 60).map((e) => [e.on, e.gain])).toEqual([[true, 0.8]])
  })

  it('is heard over a line that is softer than it', () => {
    const under = [
      { atSec: 0, durSec: 4, note: 60, gain: 0.2 },
      { atSec: 1, durSec: 1, note: 64, gain: 0.9 },
    ]
    const c = together(under, { rule: THIRDS, level: 1 }).filter(([note]) => note === 60)
    expect(c.map(([, , , gain]) => gain)).toEqual([0.2, 0.9])
  })

  it('on an instrument of its own it does not give way', () => {
    expect(beside(chord([60, 64], 2), { rule: THIRDS }).map((n) => n.note)).toEqual([60])
  })
})

describe('Companion Voice: a line played legato', () => {
  it('answers a falling line whose notes overlap', () => {
    for (const overlap of [0.02, 0.1, 0.5]) {
      for (const delay of [0, 0.4]) {
        const down = [76, 74, 72, 71].map((note, i) => ({ atSec: i, durSec: 1 + overlap, note }))
        const notes = beside(down, { rule: THIRDS, delay })
        expect(notes.map((n) => n.note)).toEqual([72, 71, 69, 67])
        expect(notes[1].atSec).toBeCloseTo(
          Math.max(1 + overlap + (overlap < 0.03 ? 0.013 : 0.03), 1 + delay),
        )
      }
    }
  })

  it('answers a rising one from its bass', () => {
    const up = [71, 72, 74].map((note, i) => ({ atSec: i, durSec: 1.1, note }))
    expect(beside(up, { rule: THIRDS, follow: 2 }).map((n) => n.note)).toEqual([67, 69, 71])
  })

  it('answers no inner note of a chord whose top is let go', () => {
    const notes = chord([60, 64, 67], 3).map((n) => ({ ...n, durSec: n.note === 67 ? 1 : 3 }))
    expect(beside(notes, { rule: THIRDS }).map((n) => n.note)).toEqual([64])
    // Nor one that was held long under a note struck after it.
    const late = [...chord([60], 4), { atSec: 1, durSec: 1, note: 72, gain: 0.8 }]
    expect(beside(late, { rule: THIRDS }).map((n) => n.note)).toEqual([57, 69])
    // Nor what is left of it under a note that came after it.
    const rest = [
      { atSec: 0, durSec: 4, note: 60 },
      { atSec: 0, durSec: 0.5, note: 64 },
      { atSec: 0.6, durSec: 0.3, note: 72 },
    ]
    expect(beside(rest, { rule: THIRDS }).map((n) => n.note)).toEqual([60, 69])
    // Nor one that lay long under a drone.
    const drone = [...chord([79], 4), { atSec: 1, durSec: 5, note: 72, gain: 0.8 }]
    expect(beside(drone, { rule: THIRDS }).map((n) => n.note)).toEqual([76])
  })

  it('has one companion for a chord that is struck and let go at once', () => {
    expect(beside(chord([60, 64, 67], 0.02), { rule: THIRDS }).map((n) => n.note)).toEqual([64])
  })

  it('hears a wider chord where it is late anyway', () => {
    const rolled = [60, 64, 67].map((note, i) => ({ atSec: i * 0.04, durSec: 2, note }))
    expect(beside(rolled, { rule: THIRDS, delay: 0.1 }).map((n) => n.note)).toEqual([64])
  })

  it('counts one pitch under two keys once', () => {
    const twice = MELODY.slice(0, 4).flatMap((note, i) =>
      [0, 0.004].map((late) => ({ atSec: i + late, durSec: 0.9, note })),
    )
    expect(beside(twice, { tonic: 6, side: 2 }).map((n) => n.note)).toEqual([64, 72, 69, 76])
    expect(beside(twice, { rule: THIRDS, every: 2 }).map((n) => n.note)).toEqual([65, 69])
  })

  it('keeps its turn over a long session', () => {
    const notes = Array.from({ length: 2000 }, (_, i) => 60 + [0, 4, 7][i % 3])
    const played = line(notes.map((note) => [note, 0.2] as const))
    const { maker, events, to } = playing({ side: 2, every: 4, rule: FOURTHS })
    for (const [id, { atSec, durSec, note }] of played.entries()) {
      maker.noteOn(atSec, id, note, 0.8)
      maker.noteOff(atSec + durSec * 0.9, id)
    }
    to(500)
    const written = events.filter((event) => event.on && event.part === 'companion')
    expect(written.length).toBe(500)
    written.forEach((event, i) => {
      expect(event.note < notes[i * 4], String(i)).toBe(i % 2 === 0)
    })
  })
})

describe('Companion Voice: cadences that are none', () => {
  it('opens on no note outside the key', () => {
    const params = { rule: SIXTHS, cadence: 1, opens: 1, follow: 0 }
    expect(beside(chord([73], 3), params).length).toBe(1)
    expect(beside(chord([73], 3), { ...params, cadence: 2 }).map((n) => n.note)).toEqual([64])
  })

  it('opens for no moment at the end of a note', () => {
    for (const durSec of [1.03, 1.05]) {
      for (const delay of [0, 2]) {
        const params = { rule: SIXTHS, cadence: 1, opens: 1, delay }
        expect(beside(chord([72], durSec), params).map((n) => n.note)).toEqual([64])
      }
    }
  })
})

describe('Companion Voice: played live', () => {
  it('moves what sounds when a control moves, and leaves nothing hanging', () => {
    const { maker, to, sounding } = playing({ rule: THIRDS })
    maker.noteOn(0, 1, 72, 0.8)
    to(1)
    expect(sounding()).toEqual([69, 72])
    maker.setParam(1, 'side', 1)
    to(1.1)
    expect(sounding()).toEqual([72, 76])
    maker.setParam(2, 'rule', FAUXBOURDON)
    to(2.1)
    expect(sounding()).toEqual([72, 76, 81])
    maker.setKey(3, { root: 0, steps: [0, 2, 3, 5, 7, 8, 10] })
    to(3.1)
    expect(sounding()).toEqual([72, 75, 80])
    maker.setParam(4, 'level', 0)
    to(4.1)
    expect(sounding()).toEqual([72])
    maker.setParam(5, 'level', 0.5)
    maker.setParam(5, 'melody', 0)
    to(5.1)
    expect(sounding()).toEqual([75, 80])
    maker.noteOff(6, 1)
    to(7)
    expect(sounding()).toEqual([])
    expect(maker.next()).toBe(Infinity)
  })

  it('takes many controls at once as one change', () => {
    const { maker, events, to, sounding } = playing({ rule: THIRDS, follow: 0 })
    maker.noteOn(0, 1, 72, 0.8)
    for (const [name, value] of [
      ['rule', SIXTHS],
      ['side', 1],
      ['octave', 1],
    ] as const)
      maker.setParam(1, name, value)
    to(2)
    expect(sounding()).toEqual([72, 93])
    // The note, its third, the third let go, the sixth an octave up.
    expect(events.length).toBe(4)
  })

  it('comes to a cadence at once when one is set on a note already held so long, and goes back', () => {
    const { maker, to, sounding } = playing({ rule: SIXTHS })
    maker.noteOn(0, 1, 72, 0.8)
    to(3)
    expect(sounding()).toEqual([64, 72])
    maker.setParam(3, 'opens', 2)
    maker.setParam(3, 'cadence', 1)
    to(3.1)
    expect(sounding()).toEqual([60, 72])
    maker.setParam(4, 'opens', 6)
    to(4.1)
    expect(sounding()).toEqual([64, 72])
    to(6.2)
    expect(sounding()).toEqual([60, 72])
    maker.setParam(7, 'cadence', 0)
    to(7.1)
    expect(sounding()).toEqual([64, 72])
  })

  it('does not come to a cadence that was called off', () => {
    const { maker, to, sounding } = playing({ rule: SIXTHS, cadence: 1, opens: 2 })
    maker.noteOn(0, 1, 72, 0.8)
    to(1)
    maker.setParam(1, 'cadence', 0)
    to(4)
    expect(sounding()).toEqual([64, 72])
  })

  it('moves with the key while it is late, after its note is let go, and then only rings', () => {
    const { maker, to, sounding } = playing({ rule: THIRDS, delay: 2, ring: 2 })
    maker.noteOn(0, 1, 72, 0.8)
    maker.noteOff(2.5, 1)
    to(3)
    expect(sounding()).toEqual([69])
    maker.setKey(3, { root: 0, steps: [0, 2, 3, 5, 7, 8, 10] })
    to(3.1)
    expect(sounding()).toEqual([68])
    maker.setKey(5, WHITE_KEYS)
    to(5.1)
    expect(sounding()).toEqual([68])
    to(7)
    expect(sounding()).toEqual([])
  })

  it('ends a note of no length', () => {
    const { maker, to, sounding } = playing({ rule: FAUXBOURDON, delay: 1 })
    maker.noteOn(0, 1, 72, 0.8)
    maker.noteOff(0, 1)
    to(9)
    expect(sounding()).toEqual([])
  })

  it('keeps to itself when keys are played very fast', () => {
    for (const rule of [TRIAD, FIFTHS, FAUXBOURDON]) {
      const { maker, to, sounding } = playing({
        rule,
        ring: 2,
        cadence: 1,
        opens: 0.5,
        delay: 0.3,
        side: 2,
      })
      for (let i = 0; i < 200; i += 1) {
        maker.noteOn(i * 0.02, i, 60 + ((i * 7) % 24), 0.8)
        maker.noteOff(i * 0.02 + 0.03, i)
      }
      to(4.1)
      expect(sounding().length).toBeLessThanOrEqual(64)
      to(10)
      expect(sounding()).toEqual([])
    }
  })
})

makerContract(COMPANION_VOICE)
