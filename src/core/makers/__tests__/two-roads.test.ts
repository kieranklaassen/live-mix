import { describe, expect, it } from 'vitest'

import { listPresets } from '../../devices/presets'
import { type MadePhraseNote, type PlayedNote } from '../phrase'
import { bestTonic, nextOn, ROAD_MAPS, roadsOf, TWO_ROADS, walk } from '../two-roads'
import { WHITE_KEYS, type MadeEvent, type MakerKey } from '../types'
import { A_MINOR, chord, made, makerContract, notesOf, PENTATONIC } from './support'

const MELODIC_MINOR = 0
const BHIMPALASI = 1
const HIJAZ = 10
const DO_GAPPED = 12
const KEY_ROOT = 2
const PLAYED = 4
const PLAYED_KEPT = 5

const straight = () => false
const crooked = () => true

function roads(map: number, tonic: number) {
  return roadsOf(ROAD_MAPS[map], tonic, null)
}

/** The melody alone: what is written with no drone. */
function melody(
  notes: readonly PlayedNote[],
  params: Record<string, number> = {},
  durationSec = 120,
  key?: MakerKey,
): MadePhraseNote[] {
  return made(TWO_ROADS, notes, { params: { drone: 0, ...params }, key }, durationSec)
}

const classes = (notes: readonly number[]): number[] =>
  [...new Set(notes.map((note) => note % 12))].sort((a, b) => a - b)

/** The notes of a melody that were reached from below, and those that were reached from above, as pitch classes. */
function reached(phrase: readonly MadePhraseNote[]): { rising: number[]; falling: number[] } {
  const rising: number[] = []
  const falling: number[] = []
  phrase.forEach((note, i) => {
    if (i === 0) return
    const before = phrase[i - 1]
    if (note.atSec - before.atSec - before.durSec > 1e-6) return
    if (note.note > before.note) rising.push(note.note)
    if (note.note < before.note) falling.push(note.note)
  })
  return { rising: classes(rising), falling: classes(falling) }
}

/** A melody cut where it is silent. */
function phrases(notes: readonly MadePhraseNote[]): MadePhraseNote[][] {
  const out: MadePhraseNote[][] = []
  let endSec = -1
  for (const note of notes) {
    if (note.atSec - endSec > 1e-6 || out.length === 0) out.push([])
    out[out.length - 1].push(note)
    endSec = note.atSec + note.durSec
  }
  return out
}

describe('Two Roads: the roads', () => {
  it('melodic minor on A goes up A B C D E F# G# A and down A G F E D C B A', () => {
    const map = roads(MELODIC_MINOR, 57)
    expect(walk(map, 57, 57, 69, straight)).toEqual([59, 60, 62, 64, 66, 68, 69])
    expect(walk(map, 57, 69, 57, straight)).toEqual([67, 65, 64, 62, 60, 59, 57])
    expect(map.strong).toBe(7)
  })

  it('Bhimpalasi on D goes up C D F G A C D and down D C B A G F E D', () => {
    const map = roads(BHIMPALASI, 62)
    expect(walk(map, 62, 60, 74, straight)).toEqual([62, 65, 67, 69, 72, 74])
    expect(walk(map, 62, 74, 62, straight)).toEqual([72, 71, 69, 67, 65, 64, 62])
    expect(map.strong).toBe(5)
    expect([...map.passing].sort()).toEqual([2, 9])
  })

  it('a fall of a fourth turns back once before it is done: G F E, G, D', () => {
    const map = roads(BHIMPALASI, 62)
    expect(walk(map, 62, 67, 62, crooked)).toEqual([65, 64, 67, 62])
    expect(walk(map, 62, 72, 62, crooked)).toEqual([71, 69, 72, 67, 65, 64, 67, 62])
    // A fall of less than a fourth is straight, and so is a rise.
    expect(walk(map, 62, 67, 64, crooked)).toEqual([65, 64])
    expect(walk(map, 62, 62, 67, crooked)).toEqual([65, 67])
  })

  it('turns back to a note a rise may land on', () => {
    // From B, which is only touched coming down, the turn is to A: B A G [A] F.
    const map = roads(BHIMPALASI, 62)
    expect(walk(map, 62, 71, 65, crooked)).toEqual([69, 67, 69, 65])
  })

  it('a gapped road has wide steps, and a fall of two of them has its turn', () => {
    // La gapped on A: A G E coming down is A G, A again, E.
    const map = roads(15, 57)
    expect(walk(map, 57, 69, 64, crooked)).toEqual([67, 69, 64])
    expect(nextOn(map, 57, 57, 1)).toBe(60)
    expect(nextOn(map, 57, 60, -1)).toBe(59)
  })

  it('a map rests where it leaves the key least: the white keys have each raga on its own note', () => {
    expect(ROAD_MAPS.map((map) => bestTonic(map, WHITE_KEYS))).toEqual([
      9, 2, 2, 5, 0, 4, 7, 9, 0, 2, 4, 9, 0, 2, 7, 9,
    ])
    // The same in the scale of A minor, where those two are on its own root.
    expect(bestTonic(ROAD_MAPS[MELODIC_MINOR], A_MINOR)).toBe(9)
    expect(bestTonic(ROAD_MAPS[BHIMPALASI], A_MINOR)).toBe(2)
    // F G A C D: the gapped mode on Do is that scale, from F.
    expect(bestTonic(ROAD_MAPS[DO_GAPPED], PENTATONIC)).toBe(5)
  })

  it('keeps inside a scale by leaving notes out: melodic minor loses its raised notes going up', () => {
    const map = roadsOf(ROAD_MAPS[MELODIC_MINOR], 57, WHITE_KEYS)
    expect(walk(map, 57, 57, 69, straight)).toEqual([59, 60, 62, 64, 69])
    expect(walk(map, 57, 69, 57, straight)).toEqual([67, 65, 64, 62, 60, 59, 57])
  })

  it('is sixteen maps, each with a strong note and a partner on both roads or on one', () => {
    expect(ROAD_MAPS).toHaveLength(16)
    expect(TWO_ROADS.params.map.choices).toEqual(ROAD_MAPS.map((map) => map.name))
    for (const map of ROAD_MAPS) {
      expect(map.up).toContain(0)
      expect(map.down).toContain(0)
      for (const note of [map.strong, map.partner, map.drone])
        expect(map.up.includes(note) || map.down.includes(note), map.name).toBe(true)
      // Passing notes are the fall's alone.
      for (const note of map.passing) {
        expect(map.down, map.name).toContain(note)
        expect(map.up, map.name).not.toContain(note)
      }
      expect(
        [...map.up].sort().join() === [...map.down].sort().join(),
        `${map.name} goes two ways`,
      ).toBe(false)
    }
  })
})

describe('Two Roads: the melody', () => {
  it('rises only to the rising road and falls only to the falling one', () => {
    for (const seed of [1, 2, 3]) {
      const params = { seed, grow: 0, range: 12 }
      const minor = reached(melody(chord([57], 300), params, 300))
      // A B C D E F# G# and A G F E D C B.
      expect(minor.rising).toEqual([0, 2, 4, 6, 8, 9, 11])
      expect(minor.falling).toEqual([0, 2, 4, 5, 7, 9, 11])
      const raga = reached(melody(chord([62], 300), { ...params, map: BHIMPALASI }, 300))
      // C D F G A, and the same with E and B.
      expect(raga.rising).toEqual([0, 2, 5, 7, 9])
      expect(raga.falling).toEqual([0, 2, 4, 5, 7, 9, 11])
    }
  })

  it('turns round on a note of both roads: F# goes on up to G#, and G on down to F', () => {
    const written = notesOf(melody(chord([57], 300), { grow: 0, range: 12, zigzag: 0 }, 300))
    let raised = 0
    written.slice(0, -1).forEach((note, i) => {
      if (note === 66) expect(written[i + 1]).toBe(68)
      if (note === 67) expect(written[i + 1]).toBe(65)
      if (note === 66) raised += 1
    })
    expect(raised).toBeGreaterThan(3)
    // B down to F is a tritone: no turn leads into that leap.
    expect(walk(roads(HIJAZ, 64), 64, 71, 64, crooked)).toEqual([69, 68, 65, 64])
  })

  it('reads the key: melodic minor on F in F, on the lowest key, in five notes when kept', () => {
    const inF = reached(
      melody(chord([53], 300), { tonic: KEY_ROOT, grow: 0, range: 12 }, 300, PENTATONIC),
    )
    // F G Ab Bb C D E and F Eb Db C Bb Ab G.
    expect(inF.rising).toEqual([0, 2, 4, 5, 7, 8, 10])
    expect(inF.falling).toEqual([0, 1, 3, 5, 7, 8, 10])
    const onB = reached(
      melody(chord([59], 300), { map: BHIMPALASI, tonic: PLAYED, grow: 0, range: 12 }, 300),
    )
    // B D E F# A, and C# and G# coming down.
    expect(onB.rising).toEqual([2, 4, 6, 9, 11])
    expect(onB.falling).toEqual([1, 2, 4, 6, 8, 9, 11])
    for (let map = 0; map < 16; map += 1) {
      for (const tonic of [1, 3, 5]) {
        for (const key of [WHITE_KEYS, A_MINOR, PENTATONIC, { root: 0, steps: [0] }]) {
          const inside = key.steps.map((step) => (key.root + step) % 12)
          const written = melody(chord([58, 66], 60), { map, tonic, grow: 0 }, 60, key)
          expect(written.length).toBeGreaterThan(2)
          for (const { note } of written) expect(inside).toContain(note % 12)
        }
      }
    }
  })

  it('only touches a passing note, and comes to it from above', () => {
    const written = melody(chord([62], 300), { map: BHIMPALASI, grow: 0, range: 12 }, 300)
    let touched = 0
    written.forEach((note, i) => {
      if (note.note % 12 !== 4 && note.note % 12 !== 11) return
      touched += 1
      expect(note.durSec).toBeCloseTo(0.28, 6)
      expect(written[i - 1].note).toBeGreaterThan(note.note)
    })
    expect(touched).toBeGreaterThan(20)
  })

  it('gives the strong note 40 percent, its partner 20, and every other note under a second', () => {
    for (const seed of [1, 2, 3, 4]) {
      const written = melody(chord([57], 600), { seed }, 600)
      const seconds = (pitchClass: number): number =>
        written
          .filter(({ note }) => note % 12 === pitchClass)
          .reduce((sum, { durSec }) => sum + durSec, 0)
      const total = written.reduce((sum, { durSec }) => sum + durSec, 0)
      expect(seconds(4) / total).toBeGreaterThan(0.36)
      expect(seconds(4) / total).toBeLessThan(0.44)
      expect(seconds(9) / total).toBeGreaterThan(0.17)
      expect(seconds(9) / total).toBeLessThan(0.25)
      for (const { note, durSec } of written)
        if (note % 12 !== 4 && note % 12 !== 9) expect(durSec).toBeLessThan(1)
    }
  })

  it('ends every phrase on the resting note, with a silence after it', () => {
    for (const [map, rest] of [
      [MELODIC_MINOR, 57],
      [BHIMPALASI, 62],
      [HIJAZ, 64],
    ]) {
      const written = melody(chord([rest], 200), { map, phrase: 8, rest: 3 }, 200)
      const cut = phrases(written).slice(0, -1)
      expect(cut.length).toBeGreaterThan(10)
      cut.forEach((phrase, i) => {
        expect(phrase[phrase.length - 1].note).toBe(rest)
        const first = phrase[0].atSec
        const last = phrase[phrase.length - 1]
        expect(last.atSec + last.durSec - first).toBeLessThan(20)
        const next = phrases(written)[i + 1]
        const silence = next[0].atSec - last.atSec - last.durSec
        expect(silence).toBeGreaterThanOrEqual(2.1)
        expect(silence).toBeLessThanOrEqual(4.2)
      })
    }
  })

  it('reaches a step further every so often and then less far again', () => {
    // Do gapped on C: C D E F G A. From G (four steps up, and two down to G) to C (six, and three down to F).
    const params = { map: DO_GAPPED, range: 6, grow: 20 }
    for (const seed of [1, 2, 3, 4, 5]) {
      const written = melody(chord([60], 160), { ...params, seed }, 160)
      const between = (from: number, to: number): number[] =>
        notesOf(written.filter(({ atSec }) => atSec >= from && atSec < to))
      expect(Math.max(...between(0, 20))).toBeLessThanOrEqual(67)
      expect(Math.min(...between(0, 20))).toBeGreaterThanOrEqual(55)
      expect(Math.max(...between(20, 40))).toBeLessThanOrEqual(69)
      expect(Math.max(...between(0, 160))).toBeLessThanOrEqual(72)
      expect(Math.min(...between(0, 160))).toBeGreaterThanOrEqual(53)
      // Grown at 40 s, and narrow again from 80 s on.
      expect(Math.max(...between(90, 100))).toBeLessThanOrEqual(67)
    }
    const all = [1, 2, 3, 4, 5].flatMap((seed) =>
      notesOf(melody(chord([60], 160), { ...params, seed }, 160)),
    )
    expect(Math.max(...all)).toBe(72)
  })
})

describe('Two Roads: played live', () => {
  it('begins on the resting note nearest the lowest key of a chord, in whatever order it is played', () => {
    const first = (notes: number[], params = {}): number =>
      notesOf(melody(chord(notes, 10), params, 12))[0]
    expect(first([57, 64, 72])).toBe(57)
    expect(first([72, 64, 57])).toBe(57)
    expect(first([48])).toBe(45)
    expect(first([55])).toBe(57)
    expect(first([62], { tonic: KEY_ROOT })).toBe(60)
    expect(first([61, 66], { tonic: PLAYED })).toBe(61)
    // Outside the key, its nearest note.
    expect(first([66], { tonic: PLAYED_KEPT })).toBe(65)
    // The ends of the keyboard are moved to where the whole range is on it.
    expect(first([21])).toBe(45)
    expect(first([108])).toBe(81)
  })

  it('goes to another resting note as soon as the keys held move it, on the road that leads there', () => {
    const cases: [Record<string, number>, high: number][] = [
      [{}, 69],
      [{ tonic: KEY_ROOT }, 72],
      [{ map: DO_GAPPED, tonic: PLAYED }, 69],
    ]
    for (const [params, high] of cases) {
      const written = melody([...chord([69], 60), ...chord([57], 52, 8)], params, 60)
      for (const { atSec, note } of written)
        if (atSec > 30) expect(note).toBeLessThanOrEqual(high + 2)
      const cut = phrases(written)
      for (const phrase of cut)
        if (phrase[0].atSec > 10 && phrase[phrase.length - 1].atSec < 50)
          expect(phrase[phrase.length - 1].note).toBe(high - 12)
      // It sets out within a note's length, and is down there soon.
      expect(written.some(({ atSec }) => atSec > 8 && atSec < 8.03 + 0.71)).toBe(true)
      expect(written.some(({ atSec, note }) => atSec > 8 && atSec < 16 && note <= high - 7)).toBe(
        true,
      )
    }
    // A key that leaves the resting note where it is changes nothing.
    const alone = melody(chord([57], 20), {}, 20)
    expect(
      melody([...chord([57], 20), ...chord([55], 5, 1), ...chord([76], 1, 2)], {}, 20),
    ).toEqual(alone)
  })

  it('keeps the lowest key of a chord let go, in whatever order its keys are', () => {
    for (const order of [
      [60, 64, 67],
      [67, 64, 60],
    ]) {
      const keys = order.map((note, i) => ({ atSec: 0, durSec: 2 + i * 0.02, note, gain: 0.8 }))
      const written = melody(keys, { tonic: PLAYED, map: DO_GAPPED }, 30)
      expect(written[written.length - 1].note).toBe(60)
    }
    // One key of the chord let go and the others held: the next lowest is the resting note.
    const held = melody(
      [...chord([60], 2), ...chord([65, 69], 30)],
      { tonic: PLAYED, map: DO_GAPPED },
      30,
    )
    for (const { atSec, note } of held)
      if (atSec > 3) expect([5, 7, 9, 10, 0, 2]).toContain(note % 12)
  })

  it('begins the next phrase when a key is pressed in a silence', () => {
    const params = { rest: 20, phrase: 4 }
    const [phrase] = phrases(melody(chord([57], 60), params, 60))
    const last = phrase[phrase.length - 1]
    const end = last.atSec + last.durSec
    const starts = (notes: readonly PlayedNote[], made = params): number[] =>
      phrases(melody(notes, made, 60)).map(([first]) => first.atSec)
    expect(starts(chord([57], 60))[1]).toBeGreaterThan(end + 13)
    expect(starts([...chord([57], 60), ...chord([64], 50, end + 2)])[1]).toBeCloseTo(end + 2.03, 6)
    // A new key is where it begins.
    const lower = phrases(melody([...chord([57], 60), ...chord([45], 50, end + 2)], params, 60))
    expect(lower[1][lower[1].length - 1].note).toBe(45)
    // One pressed while the phrase goes home waits for it, and for a breath.
    const asked = starts([...chord([57], 60), ...chord([64], 50, last.atSec + 0.1)])
    expect(asked[1]).toBeCloseTo(end + 0.5, 6)
    // A key let go there begins nothing.
    expect(starts([...chord([57], 60), ...chord([64], end + 2)])[1]).toBeGreaterThan(end + 13)
  })

  it('comes home within the tail when the last key is let go', () => {
    for (const tail of [0.5, 2, 5, 20]) {
      for (const at of [1.3, 4, 6.1, 9.7, 17]) {
        const written = melody(chord([57], at), { tail, rest: 0.5 }, 60)
        const last = written[written.length - 1]
        expect(last.note, `tail ${tail}, let go at ${at}`).toBe(57)
        expect(last.atSec + last.durSec).toBeLessThanOrEqual(at + tail + 1e-6)
      }
    }
  })

  it('stops at once with no tail, and goes on when a key is played inside one', () => {
    const cut = melody(chord([57], 5), { tail: 0 }, 60)
    for (const { atSec, durSec } of cut) expect(atSec + durSec).toBeLessThanOrEqual(5 + 1e-9)
    const taken = melody([...chord([57], 5), ...chord([57], 60, 6)], {}, 60)
    expect(taken[taken.length - 1].atSec).toBeGreaterThan(50)
    // Let go in a silence there is nothing to bring home.
    const [phrase] = phrases(melody(chord([57], 60), {}, 60))
    const end = phrase[phrase.length - 1]
    const resting = made(TWO_ROADS, chord([57], end.atSec + end.durSec + 1), {}, 60)
    for (const { atSec, durSec } of resting)
      expect(atSec + durSec).toBeLessThanOrEqual(end.atSec + end.durSec + 1 + 1e-6)
  })

  it('makes a short phrase of a tap, and of many taps', () => {
    const tap = melody([{ atSec: 0, durSec: 0.01, note: 57, gain: 0.8 }], { tail: 6 }, 30)
    expect(tap.length).toBeGreaterThan(2)
    expect(tap[0].note).toBe(57)
    expect(tap[tap.length - 1].note).toBe(57)
    const taps = Array.from({ length: 120 }, (_, i) => ({
      atSec: i * 0.05,
      durSec: 0.03,
      note: 57 + (i % 7),
      gain: 0.8,
    }))
    const written = melody(taps, { tail: 4 }, 30)
    const last = written[written.length - 1]
    expect(last.note).toBe(57)
    expect(last.atSec + last.durSec).toBeLessThanOrEqual(10)
    expect(written.length).toBeLessThan(40)
    // With no tail each tap is a melody cut off, or none, and nothing is left sounding.
    const short = made(TWO_ROADS, taps, { params: { tail: 0 } }, 30)
    for (const { atSec, durSec } of short) expect(atSec + durSec).toBeLessThanOrEqual(6)
  })

  it('takes another map in the middle of a phrase, from where it is', () => {
    const maker = TWO_ROADS.create({ params: { map: DO_GAPPED, drone: 0, tonic: KEY_ROOT } })
    const events: MadeEvent[] = []
    const emit = (event: MadeEvent): void => {
      events.push(event)
    }
    maker.noteOn(0, 1, 60, 0.8)
    maker.advance(5, emit)
    maker.setParam(5, 'map', HIJAZ)
    maker.advance(60, emit)
    for (const { atSec, note, on } of events) {
      if (!on) continue
      expect(atSec < 5 ? [0, 2, 4, 5, 7, 9] : [0, 1, 4, 5, 7, 8, 9, 10]).toContain(note % 12)
    }
    expect(events.filter(({ atSec, on }) => on && atSec > 5 && atSec < 9).length).toBeGreaterThan(0)
  })

  it('takes a quicker pace, a shorter silence and a shorter tail without waiting them out', () => {
    const maker = TWO_ROADS.create({ params: { pace: 6, drone: 0, phrase: 2, rest: 20, dwell: 0 } })
    const events: MadeEvent[] = []
    const emit = (event: MadeEvent): void => {
      events.push(event)
    }
    const starts = (from: number, to: number): number =>
      events.filter(({ atSec, on }) => on && atSec >= from && atSec < to).length
    maker.noteOn(0, 1, 57, 0.8)
    maker.advance(1, emit)
    maker.setParam(1, 'pace', 0.3)
    maker.advance(4, emit)
    expect(starts(1, 2)).toBeGreaterThanOrEqual(1)
    // Its phrase of two seconds is over, and the silence would be fourteen seconds at least.
    maker.advance(10, emit)
    expect(starts(6, 10)).toBe(0)
    maker.setParam(10, 'rest', 0)
    maker.advance(11, emit)
    expect(starts(10, 11)).toBeGreaterThanOrEqual(1)
    maker.setParam(11, 'tail', 30)
    maker.noteOff(11, 1)
    maker.setParam(11.2, 'tail', 0)
    maker.advance(12, emit)
    expect(events[events.length - 1].on).toBe(false)
    expect(events[events.length - 1].atSec).toBeCloseTo(11.2, 9)
    expect(maker.next()).toBe(Infinity)
  })

  it('holds the resting note and one more under it as a drone, struck with each phrase', () => {
    const written = made(
      TWO_ROADS,
      chord([57], 40),
      { params: { drone: 0.5, range: 3, tail: 0 }, parts: { drone: { deviceId: 'tanpura' } } },
      60,
    )
    const drone = written.filter(({ part }) => part === 'drone')
    const song = written.filter(({ part }) => part === undefined)
    // A and the E over it.
    expect(classes(notesOf(drone))).toEqual([4, 9])
    expect(new Set(notesOf(drone))).toEqual(new Set([45, 52]))
    expect(drone[0]).toMatchObject({ note: 45, gain: 0.4 })
    for (const phrase of phrases(song))
      expect(drone.some(({ atSec }) => Math.abs(atSec - phrase[0].atSec) < 1e-9)).toBe(true)
    // It goes on through the silences, and ends with the melody.
    const covered = drone.filter(({ note }) => note === 45)
    covered.slice(1).forEach((note, i) => {
      expect(note.atSec).toBeCloseTo(covered[i].atSec + covered[i].durSec, 9)
    })
    for (const { atSec, durSec } of drone) expect(atSec + durSec).toBeLessThanOrEqual(40 + 1e-9)
  })

  it('is another melody with another take, and has a preset for every map', () => {
    expect(notesOf(melody(chord([57], 60), { seed: 1 }))).not.toEqual(
      notesOf(melody(chord([57], 60), { seed: 2 })),
    )
    const maps = new Set(listPresets(TWO_ROADS).map(({ params }) => params.map ?? 0))
    expect(maps.size).toBe(16)
  })
})

describe('Two Roads: what a check of it asked for', () => {
  /** The steps a melody takes inside its phrases: from, to, and the note after. */
  function steps(phrase: readonly MadePhraseNote[]): [number, number, number | null][] {
    return phrases(phrase).flatMap((cut) =>
      cut
        .slice(1)
        .map((note, i): [number, number, number | null] => [
          cut[i].note,
          note.note,
          cut[i + 2]?.note ?? null,
        ]),
    )
  }

  it('keeps to the two roads of every map for ten minutes, and never leaps a tritone', () => {
    // Written out by hand, on the note each map rests on on the white keys.
    const written: [up: string, down: string, rest: number][] = [
      ['A B C D E F# G#', 'A G F E D C B', 57],
      ['D F G A C', 'D C B A G F E', 62],
      ['D F G B C', 'D C B A G F E', 62],
      ['F G A B D E', 'F E D C B A G', 53],
      ['C E F G B', 'C B A G F E D', 60],
      ['E F G B C', 'E D C A G F', 52],
      ['G B C E F', 'G F E C B A', 55],
      ['A B D E F', 'A G F E D C B', 57],
      ['C D E F G A B', 'C Bb A G F E D', 60],
      ['D E F G A B C', 'D C Bb A G F Eb', 62],
      ['E F G# A B C# D', 'E D C B A G# F', 52],
      ['A B C D E F G#', 'A G F E D C B', 57],
      ['C D E G A', 'C A G F E D', 60],
      ['D E G A C', 'D C B A G E', 62],
      ['G A C D E', 'G E D C B A', 55],
      ['A C D E G', 'A G E D C B', 57],
    ]
    const names = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']
    const set = (notes: string): string[] => notes.split(' ').sort()
    written.forEach(([up, down, rest], map) => {
      const rising = new Set<string>()
      const falling = new Set<string>()
      for (const seed of [1, 2, 3]) {
        for (const [from, to, next] of steps(
          melody(chord([rest], 600), { map, seed, grow: 8, range: 12 }, 600),
        )) {
          expect(Math.abs(to - from)).not.toBe(6)
          if (to > from) rising.add(names[to % 12])
          else falling.add(names[to % 12])
          // A note of the rising road alone is never turned down from.
          if (to > from && next !== null && next < to)
            expect(set(down), ROAD_MAPS[map].name).toContain(names[to % 12])
        }
      }
      expect([...rising].sort(), ROAD_MAPS[map].name).toEqual(set(up))
      expect([...falling].sort(), ROAD_MAPS[map].name).toEqual(set(down))
    })
    // From G, which only a fall has, there is no turn up to F# and down again.
    expect(walk(roads(MELODIC_MINOR, 57), 57, 67, 62, crooked)).toEqual([65, 64, 62])
  })

  it('has both roads of melodic minor in the first minute and a half: the strong note under rest is in reach', () => {
    let raised = 0
    let natural = 0
    for (let seed = 1; seed <= 12; seed += 1) {
      const heard = notesOf(melody(chord([57], 90), { seed }, 90))
      if (heard.some((note) => note === 54 || note === 56)) raised += 1
      if (heard.some((note) => note === 53 || note === 55)) natural += 1
      // E under A, and not yet the A over it.
      expect(Math.min(...heard)).toBe(52)
      expect(Math.max(...heard)).toBeLessThan(69)
    }
    expect(raised).toBe(12)
    expect(natural).toBeGreaterThanOrEqual(10)
    // Nine steps are A to the C of the second octave, at their widest after five steps of growth.
    const top = (from: number, to: number): number =>
      Math.max(
        ...Array.from({ length: 24 }, (_, i) => i + 1).flatMap((seed) =>
          notesOf(
            melody(chord([57], 400), { seed }, 400).filter((n) => n.atSec >= from && n.atSec < to),
          ),
        ),
      )
    expect(top(0, 32)).toBe(64)
    expect(top(97, 130)).toBeLessThanOrEqual(69)
    expect(top(162, 222)).toBeGreaterThan(69)
    expect(top(162, 222)).toBeLessThanOrEqual(72)
    expect(top(290, 318)).toBeLessThanOrEqual(65)
    expect(top(335, 350)).toBeLessThanOrEqual(65)
    // The strong note of Yaman is a sixth under its rest, and waits for the range.
    expect(Math.min(...notesOf(melody(chord([53], 60), { map: 3 }, 60)))).toBeGreaterThanOrEqual(50)
  })

  it('has a turn in every fall of a fourth with the zigzag full, and in none without', () => {
    for (const map of [BHIMPALASI, 15, 11]) {
      const straightDown = steps(melody(chord([57], 300), { map, zigzag: 0, grow: 0 }, 300))
      const turned = steps(melody(chord([57], 300), { map, zigzag: 1, grow: 0 }, 300))
      const leaps = (all: typeof turned): number =>
        all.filter(([from, to]) => from - to >= 5).length
      expect(leaps(straightDown)).toBeGreaterThan(0)
      // Back to the top of the fall first: what falls a fourth at once has just risen to where it falls from.
      turned.forEach(([from, to], i) => {
        if (from - to >= 5 && i > 0) expect(turned[i - 1][0]).toBeLessThan(from)
      })
    }
  })

  /** The share of a melody held to `untilSec` that a pitch class has, of the notes begun after `fromSec`. */
  function share(
    pitchClass: number,
    params: Record<string, number>,
    turn: [name: string, value: number, before: number],
    fromSec: number,
    untilSec: number,
  ): number {
    const maker = TWO_ROADS.create({ params: { drone: 0, ...params, [turn[0]]: turn[2] } })
    const events: MadeEvent[] = []
    const emit = (event: MadeEvent): void => {
      events.push(event)
    }
    maker.noteOn(0, 1, 57, 0.8)
    maker.advance(600, emit)
    maker.setParam(600, turn[0], turn[1])
    maker.advance(untilSec, emit)
    let on = 0
    let all = 0
    const began = new Map<number, number>()
    for (const event of events) {
      if (event.on) began.set(event.id, event.atSec)
      const from = began.get(event.id) ?? 0
      if (event.on || from < fromSec) continue
      all += event.atSec - from
      if (event.note % 12 === pitchClass) on += event.atSec - from
    }
    return on / all
  }

  it('sings the share that is asked for soon after the dwell is turned, from its least to its most', () => {
    for (const dwell of [0.1, 0.2, 0.3, 0.4, 0.5]) {
      const heard = share(4, {}, ['dwell', dwell, dwell > 0.3 ? 0.1 : 0.5], 601, 720)
      expect(Math.abs(heard - dwell), `${dwell}: ${heard}`).toBeLessThan(0.05)
    }
    expect(share(4, {}, ['dwell', 0.1, 0.5], 601, 1200)).toBeLessThan(0.115)
  })

  it('keeps to the roads that are left where the notes a key lacks are left out', () => {
    // One more way to be wrong: a strong note that only one of the two roads has kept.
    const key = { root: 0, steps: [0, 2, 4, 6, 8, 10] }
    for (let map = 0; map < 16; map += 1) {
      const kept = roadsOf(ROAD_MAPS[map], 60, key)
      const written = melody(chord([60], 200), { map, tonic: 3, grow: 0, range: 12 }, 200, key)
      for (const [from, to] of steps(written)) {
        const road = to > from ? kept.up : kept.down
        expect([...road], `${ROAD_MAPS[map].name} ${from} ${to}`).toContain(to % 12)
      }
    }
  })

  it('strikes the drone once where its knob was turned just before a phrase', () => {
    const [, second] = phrases(melody(chord([57], 30), {}, 30))
    const maker = TWO_ROADS.create({ parts: ['drone'] })
    const events: MadeEvent[] = []
    maker.noteOn(0, 1, 57, 0.8)
    maker.setParam(second[0].atSec - 0.1, 'drone', 0.6)
    maker.advance(second[0].atSec + 1, (event) => events.push(event))
    const struck = events.filter((e) => e.on && e.part === 'drone' && e.atSec > 5)
    expect(struck.map(({ note }) => note)).toEqual([45, 52])
  })

  it('touches a passing note softly, ends a phrase on a longer and softer one, with the drone a step softer above', () => {
    const written = made(
      TWO_ROADS,
      chord([62], 60),
      { params: { map: BHIMPALASI, drone: 0.5 }, parts: { drone: { deviceId: 'tanpura' } } },
      60,
    )
    const song = written.filter(({ part }) => part === undefined)
    for (const { note, gain } of song) if (note % 12 === 4) expect(gain).toBeCloseTo(0.48, 9)
    for (const phrase of phrases(song).slice(0, -1)) {
      const last = phrase[phrase.length - 1]
      expect(last.durSec).toBeGreaterThanOrEqual(1.4 - 1e-9)
      expect(last.gain).toBeCloseTo(0.624, 9)
    }
    const [low, high] = written.filter(({ part }) => part === 'drone')
    expect([low.note, low.gain, high.note]).toEqual([50, 0.4, 55])
    expect(high.gain).toBeCloseTo(0.32, 9)
  })

  it('writes nothing after a tail shorter than it waits for a chord', () => {
    expect(made(TWO_ROADS, chord([57], 0.001), { params: { tail: 0.01 } }, 20)).toEqual([])
  })

  it('stays on the keyboard in a key of few notes: no note is written twice over for being folded', () => {
    for (const steps of [[0], [0, 7]]) {
      const key = { root: 0, steps }
      const written = melody(chord([84], 120), { tonic: 3, range: 15, grow: 0, drone: 0 }, 120, key)
      for (const cut of phrases(written))
        cut.slice(1).forEach((note, i) => expect(note.note).not.toBe(cut[i].note))
    }
  })

  it('strikes the drone once for a knob that is turned, and not at all with it at zero', () => {
    const maker = TWO_ROADS.create({ params: { pace: 3 }, parts: ['drone'] })
    const events: MadeEvent[] = []
    const emit = (event: MadeEvent): void => {
      events.push(event)
    }
    const drones = (from: number, to: number): MadeEvent[] =>
      events.filter((e) => e.on && e.part === 'drone' && e.atSec >= from && e.atSec < to)
    maker.noteOn(0, 1, 57, 0.8)
    maker.advance(1, emit)
    for (let k = 0; k <= 50; k += 1) maker.setParam(1 + k * 0.016, 'drone', 0.4 + k * 0.01)
    maker.advance(3, emit)
    expect(drones(1, 3).map(({ note }) => note)).toEqual([45, 52])
    expect(drones(1, 3)[0].atSec).toBeCloseTo(2, 6)
    expect(drones(1, 3)[0].gain).toBeCloseTo(0.72, 6)
    maker.setParam(3, 'drone', 0)
    maker.advance(3, emit)
    expect(events[events.length - 1]).toMatchObject({ on: false, atSec: 3, part: 'drone' })
    maker.setParam(3.1, 'drone', 0.5)
    maker.advance(3.2, emit)
    expect(drones(3, 3.2)).toHaveLength(2)
    // Another map every hundredth of a second: the drone waits for the last.
    for (let k = 0; k < 100; k += 1) maker.setParam(4 + k * 0.01, 'map', k % 16)
    maker.advance(4.99, emit)
    expect(drones(4, 4.99)).toHaveLength(0)
    maker.noteOff(5, 1)
    maker.advance(30, emit)
    expect(events.filter(({ on }) => on)).toHaveLength(events.filter(({ on }) => !on).length)
  })

  it('answers a key far from the last in its own register within a note or so', () => {
    for (let at = 0.2; at < 14; at += 0.31) {
      const written = melody([...chord([57], at), ...chord([81], 40, at + 0.2)], {}, 40)
      const answer = written.find(({ atSec, note }) => atSec >= at && note >= 76)
      expect(answer?.atSec ?? 99, `at ${at}`).toBeLessThan(at + 2.2)
    }
  })

  it('leaves a major or natural minor key with melodic minor and the maqam paths, and with nothing else', () => {
    const leaves = (map: (typeof ROAD_MAPS)[number], key: MakerKey): boolean => {
      const inside = key.steps.map((step) => (key.root + step) % 12)
      const tonic = bestTonic(map, key)
      return [...map.up, ...map.down].some((step) => !inside.includes((tonic + step) % 12))
    }
    for (let root = 0; root < 12; root += 1)
      for (const steps of [WHITE_KEYS.steps, A_MINOR.steps])
        expect(
          ROAD_MAPS.filter((map) => leaves(map, { root, steps })).map(({ name }) => name),
        ).toEqual(['Melodic minor', 'Rast', 'Bayati', 'Hijaz', 'Nahawand'])
  })
})

makerContract(TWO_ROADS)
