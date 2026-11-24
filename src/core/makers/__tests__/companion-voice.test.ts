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
    expect(notes.map((n) => [n.note, n.atSec, n.durSec])).toEqual([
      [69, 0, 1],
      [69, 1, 4],
    ])
  })
})

/** A maker that is played by hand, with what it wrote and what sounds. */
function playing(params: Record<string, number>) {
  const maker = COMPANION_VOICE.create({ params, parts: ['companion', 'third'] })
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
