// Hits and voices: the three ways that add notes a sound does not have.
// Echoes after a hit, a second voice beside a phrase, a note in a phrase's
// rests. The written notes stay as they are in all three; what every take
// keeps is ./ways-support.ts, and one take of Echoes is rendered to hear how
// an instrument takes a key struck again while it is held.

import { describe, expect, it } from 'vitest'

import { FACTORY_SOUNDS, factorySound, renderFactorySound, varySound } from '..'
import { compileFromDisk, toDb } from '../../__tests__/render-support'
import { cycled, played } from '../sounds/recipe'
import { type FactorySound } from '../types'
import { HIGHEST_NOTE, alongWhiteKeys } from '../vary'
import { playSound, wayTakes, type WayPlaying } from '../ways'
import { cents, readSound, tick } from '../ways/reading'
import { type PassNote } from '../ways/types'
import { bankProblems } from './ways-support'

const node = { compile: compileFromDisk, sliceMs: 0 } as const

type Made = Pick<FactorySound, 'phrase' | 'durationSec'>

const sound = (id: string): FactorySound => {
  const found = factorySound(id)
  if (!found) throw new Error(`no factory sound "${id}"`)
  return found
}

/** One struck note that ends: a second long, in a sound of four. */
const hit = played(4, [[0, 1, 60]])
/** Eight even strokes, played round: 48 is the note it stands on. */
const line = cycled(8, [
  [0, 1, 48],
  [1, 1, 60],
  [2, 1, 64],
  [3, 1, 67],
  [4, 1, 72],
  [5, 1, 76],
  [6, 1, 79],
  [7, 0.5, 84],
])
/** A phrase with rests, played round: gaps of half a second, and of 2, 1.5 and 3 seconds. */
const rests = cycled(8, [
  [0, 0.5, 48],
  [0.5, 0.5, 60],
  [1, 0.5, 64],
  [3, 0.5, 67],
  [3.5, 0.5, 72],
  [5, 0.5, 64],
])

/** One pass of the take `playing` names, in time order. */
const pass = (made: Made, playing: WayPlaying): PassNote[] =>
  readSound(playSound(made, playing)).moments.flatMap((moment) => moment.notes)
/** The notes of that pass the sound does not have: at a time and pitch nothing is written at. */
const added = (made: Made, playing: WayPlaying): PassNote[] => {
  const written = new Set(
    readSound(made).notes.map((note) => `${tick(note.at)}:${cents(note.note)}`),
  )
  return pass(made, playing).filter((note) => !written.has(`${tick(note.at)}:${cents(note.note)}`))
}
/** The written notes of one pass as a take plays them: every one where and as it was written. */
const kept = (made: Made, playing: WayPlaying): boolean => {
  const played = pass(made, playing)
  return readSound(made).notes.every((note) =>
    played.some(
      (each) =>
        tick(each.at) === tick(note.at) &&
        cents(each.note) === cents(note.note) &&
        tick(each.dur) === tick(note.dur),
    ),
  )
}
const takesOf = (made: Made, playing: WayPlaying): number[] =>
  Array.from({ length: wayTakes(made, playing).takes }, (_, take) => take)

describe('Echoes', () => {
  it('repeats one struck note after itself, softer each time, at its pitch', () => {
    // Up to two repeats at the far it stands at, the last by half the length: the number
    // comes round in two turns and the spacing in three, so the round is six takes.
    expect(wayTakes(hit, { way: 'echoes', seed: 1 })).toEqual({
      takes: 6,
      round: [0, 1, 2, 3, 4, 5],
      cut: false,
    })
    expect(pass(hit, { way: 'echoes', seed: 1, take: 0 })).toEqual([
      { at: 0, dur: 1, note: 60, gain: 0.8 },
      { at: 1, dur: 1, note: 60, gain: 0.48 },
    ])
    const second = pass(hit, { way: 'echoes', seed: 1, take: 1 })
    expect(second.map((note) => note.at)).toEqual([0, 0.5, 1])
    expect(second[2].gain).toBeCloseTo(0.288, 9)
    // The way counts and draws nothing: the same takes at every seed.
    expect(pass(hit, { way: 'echoes', seed: 99, take: 1 })).toEqual(second)

    for (const far of [0, 0.25, 0.5, 1]) {
      const playing = { way: 'echoes', seed: 1, far }
      for (const take of takesOf(hit, playing)) {
        const [first, ...repeats] = pass(hit, { ...playing, take })
        expect(first, `far ${far} take ${take}`).toEqual({ at: 0, dur: 1, note: 60, gain: 0.8 })
        expect(repeats.length, `far ${far} take ${take}`).toBeGreaterThanOrEqual(1)
        expect(repeats.length, `far ${far} take ${take}`).toBeLessThanOrEqual(3)
        repeats.forEach((repeat, index) => {
          const before = index === 0 ? first : repeats[index - 1]
          expect(repeat.note).toBe(60)
          expect(repeat.at).toBeGreaterThan(before.at)
          expect(repeat.gain).toBeLessThan(before.gain)
        })
      }
    }
  })

  it('has more repeats, and later ones, the further it goes', () => {
    const most = (far: number): number =>
      Math.max(
        ...takesOf(hit, { way: 'echoes', seed: 1, far }).map(
          (take) => added(hit, { way: 'echoes', seed: 1, far, take }).length,
        ),
      )
    const latest = (far: number): number =>
      Math.max(
        ...takesOf(hit, { way: 'echoes', seed: 1, far }).flatMap((take) =>
          added(hit, { way: 'echoes', seed: 1, far, take }).map((note) => note.at),
        ),
      )
    expect([0.25, 0.5, 1].map(most)).toEqual([1, 2, 3])
    expect(latest(0.25)).toBeLessThan(latest(0.5))
    expect(latest(0.5)).toBeLessThan(latest(1))
    // Never as late as three quarters of the sound's length.
    expect(latest(1)).toBeLessThan(3)
  })

  it('repeats the whole of a chord struck together, each key held as long as it was or to the end', () => {
    const chord = played(4, [
      [0, 3.5, 48],
      [0, 3.5, 55, 0.5],
      [0, 1, 64],
    ])
    const repeats = added(chord, { way: 'echoes', seed: 1, take: 0 })
    expect(repeats).toEqual([
      { at: 1, dur: 3, note: 48, gain: 0.48 },
      { at: 1, dur: 3, note: 55, gain: 0.3 },
      { at: 1, dur: 1, note: 64, gain: 0.48 },
    ])
  })

  it('has takes on a single stroke of a kit, which a variant leaves as it is', () => {
    const stroke = sound('club-snare-hit')
    expect(stroke.kit).toBe(true)
    expect(varySound(stroke, { seed: 1, amount: 1 })).toBe(stroke)
    const playing = { way: 'echoes', seed: 1 }
    expect(wayTakes(stroke, playing).takes).toBeGreaterThanOrEqual(2)
    const [key] = stroke.phrase.notes
    for (const take of takesOf(stroke, playing)) {
      const notes = pass(stroke, { ...playing, take })
      expect(notes.length).toBeGreaterThan(1)
      expect(notes.every((note) => note.note === key.note)).toBe(true)
    }
  })

  it('gives no takes on a phrase, or on a sound read in time from other audio, and says why', () => {
    expect(wayTakes(line, { way: 'echoes', seed: 1 })).toEqual({
      takes: 0,
      round: [],
      cut: false,
      refusal: 'Needs one hit that ends.',
    })
    const read = sound('house-reverse-crash-one')
    expect(wayTakes(read, { way: 'echoes', seed: 1 }).refusal).toBe(
      'Its one key reads other audio in time.',
    )
    expect(varySound(read, { seed: 1, amount: 1 })).toBe(read)
  })

  const hits = FACTORY_SOUNDS.filter(
    (each) => !each.loopCrossfadeSec && readSound(each).moments.length === 1,
  )

  it('has takes on every one-shot of the bank that is one struck moment', () => {
    const oneShots = hits.filter(
      (each) => each.kind === 'oneshot' && !(each.source !== undefined && each.bpm !== undefined),
    )
    expect(oneShots.length).toBeGreaterThanOrEqual(40)
    for (const each of oneShots) {
      expect(wayTakes(each, { way: 'echoes', seed: 1 }).takes, each.id).toBeGreaterThanOrEqual(2)
    }
  })

  it('strikes every repeat after the hit and before three quarters of the length, and lifts every key inside it', () => {
    let fitted = 0
    for (const each of hits) {
      for (const far of [0.25, 0.5, 1]) {
        const playing = { way: 'echoes', seed: 3, far }
        if (wayTakes(each, playing).takes === 0) continue
        fitted += 1
        const struck = Math.min(...each.phrase.notes.map((note) => note.atSec))
        for (const take of takesOf(each, playing)) {
          const where = `${each.id} far ${far} take ${take}`
          expect(kept(each, { ...playing, take }), where).toBe(true)
          const repeats = added(each, { ...playing, take })
          expect(repeats.length, where).toBeGreaterThanOrEqual(each.phrase.notes.length)
          for (const repeat of repeats) {
            expect(repeat.at, where).toBeGreaterThan(struck)
            expect(repeat.at, where).toBeLessThan(each.durationSec * 0.75)
            // A sound that keeps time: on a sixteenth of its length.
            if (each.bpm !== undefined) {
              const sixteenths = ((repeat.at - struck) / each.durationSec) * 16
              expect(Math.abs(sixteenths - Math.round(sixteenths)), where).toBeLessThan(1e-6)
            }
          }
          for (const note of pass(each, { ...playing, take })) {
            expect(note.at + note.dur, where).toBeLessThanOrEqual(each.durationSec + 1e-9)
          }
        }
      }
    }
    expect(fitted).toBeGreaterThanOrEqual(120)
  })

  it('is heard on a key that is still down: the felt piano strikes it again', async () => {
    // The piano's note is held for 7.8 of its 8 seconds, so both repeats of this take strike a
    // key that is down. Each note of a phrase is a key of its own to the renderer, pressed and
    // lifted by its own number, so the second strike reaches the instrument.
    const piano = sound('felt-piano-c')
    const playing = { way: 'echoes', seed: 1, take: 1 }
    const repeats = added(piano, playing)
    expect(repeats.map((note) => note.at)).toEqual([1, 2])
    expect(repeats.every((note) => note.at < piano.phrase.notes[0].durSec)).toBe(true)

    const written = await renderFactorySound(piano, node)
    const take = await renderFactorySound(playSound(piano, playing), node)
    const [was] = written.channels
    const [now] = take.channels
    expect(now).toHaveLength(was.length)
    const frame = (sec: number): number => Math.round(sec * take.sampleRate)
    const level = (channel: Float32Array, fromSec: number, toSec: number): number => {
      let sum = 0
      for (let index = frame(fromSec); index < frame(toSec); index += 1) sum += channel[index] ** 2
      return toDb(Math.sqrt(sum / (frame(toSec) - frame(fromSec))))
    }
    const step = (channel: Float32Array): number =>
      channel.reduce(
        (most, value, index) => Math.max(most, Math.abs(value - (channel[index - 1] ?? 0))),
        0,
      )

    // Up to the first repeat the take is the sound itself: the written note is not touched.
    let same = true
    for (let index = 0; index < frame(repeats[0].at) - 1; index += 1) {
      if (Math.abs(now[index] - was[index]) > 1e-6) same = false
    }
    expect(same, 'the written note up to the first repeat').toBe(true)
    // Each repeat is struck: the level rises where the sound alone only falls.
    for (const repeat of repeats) {
      const rise = (channel: Float32Array): number =>
        level(channel, repeat.at + 0.005, repeat.at + 0.105) -
        level(channel, repeat.at - 0.105, repeat.at - 0.005)
      expect(rise(was), `the sound alone at ${repeat.at} s`).toBeLessThan(0)
      expect(rise(now), `the repeat at ${repeat.at} s`).toBeGreaterThan(1)
    }
    // And struck cleanly: no step from one sample to the next larger than the hit's own.
    expect(step(now)).toBeLessThanOrEqual(step(was) * 1.01)
  }, 120_000)
})

describe('Two readers', () => {
  it('reads the line a fifth higher at every third moment, and carries on across turns', () => {
    // Eight moments: the second voice joins the third and the sixth. The line is the seven
    // notes above the standing note, read two a turn, so it comes round after seven turns.
    expect(wayTakes(line, { way: 'two-readers', seed: 1 })).toEqual({
      takes: 7,
      round: [0, 1, 2, 3, 4, 5, 6],
      cut: false,
    })
    const voice = (take: number): (readonly [number, number])[] =>
      added(line, { way: 'two-readers', seed: 1, take }).map((note) => [note.at, note.note])
    // 60 and 64 a fifth higher along the white keys, then 67 and 72, and so on.
    expect(voice(0)).toEqual([
      [2, 67],
      [5, 71],
    ])
    expect(voice(1)).toEqual([
      [2, 74],
      [5, 79],
    ])
    expect(voice(3)).toEqual([
      [2, 91],
      [5, 67],
    ])
    for (const take of takesOf(line, { way: 'two-readers', seed: 1 })) {
      expect(kept(line, { way: 'two-readers', seed: 1, take }), `take ${take}`).toBe(true)
    }
  })

  it('strikes with the moment it joins, as long as its note and softer', () => {
    const [third, sixth] = added(line, { way: 'two-readers', seed: 1, take: 0 })
    expect(third).toMatchObject({ at: 2, dur: 1 })
    expect(sixth).toMatchObject({ at: 5, dur: 1 })
    const gain = (far: number): number =>
      added(line, { way: 'two-readers', seed: 1, far, take: 0 })[0].gain
    // The written notes are at 0.8: the second voice is under them at any far.
    expect(gain(0)).toBeLessThan(gain(0.5))
    expect(gain(0.5)).toBeLessThan(gain(1))
    expect(gain(1)).toBeLessThan(0.8)
  })

  it('adds notes only at moments the phrase has, each a fifth above a note of its line', () => {
    const fifths = (made: Made): number[] =>
      readSound(made)
        .upper.map((note) => alongWhiteKeys(note, 4))
        .map((note) => (note > HIGHEST_NOTE ? note - 12 : note))
    for (const each of [line, rests, sound('felt-piano-phrase-am'), sound('kalimba-pattern-am')]) {
      const playing = { way: 'two-readers', seed: 1 }
      const moments = readSound(each).moments.map((moment) => tick(moment.at))
      expect(wayTakes(each, playing).takes).toBeGreaterThanOrEqual(2)
      for (const take of takesOf(each, playing)) {
        const voice = added(each, { ...playing, take })
        expect(voice.length).toBeGreaterThan(0)
        for (const note of voice) {
          expect(moments).toContain(tick(note.at))
          expect(fifths(each)).toContain(note.note)
        }
      }
    }
  })

  it('takes the fifth an octave lower where it leaves the range', () => {
    // Four moments: the second voice joins the third, and reads 88, 91, 93 a turn each. The
    // fifth above 88 is 95; above 91 and 93 it is over the highest note, 96.
    const high = played(6, [
      [0, 1, 60],
      [1, 1, 88],
      [2, 1, 91],
      [3, 1, 93],
    ])
    const voice = [0, 1, 2].map(
      (take) => added(high, { way: 'two-readers', seed: 1, take })[0].note,
    )
    expect(voice).toEqual([95, 86, 88])
  })

  it('gives no takes on a kit or on one hit', () => {
    const kit = FACTORY_SOUNDS.find((each) => each.kit && each.phrase.notes.length > 8)
    expect(kit).toBeDefined()
    if (!kit) return
    expect(wayTakes(kit, { way: 'two-readers', seed: 1 }).refusal).toBe('Its keys are not notes.')
    expect(wayTakes(hit, { way: 'two-readers', seed: 1 }).refusal).toBe(
      'Needs a phrase of three pitches.',
    )
  })
})

describe('In the gaps', () => {
  it('sounds a note of the chord in one of the widest gaps, a different gap each turn', () => {
    // Three gaps wider than half a second: 3 seconds after the last stroke, 2 after the third
    // and 1.5 after the fifth. Widest first, each with the next note of the chord above 48.
    expect(wayTakes(rests, { way: 'in-the-gaps', seed: 1 })).toEqual({
      takes: 3,
      round: [0, 1, 2],
      cut: false,
    })
    expect(added(rests, { way: 'in-the-gaps', seed: 1, take: 0 })).toEqual([
      { at: 6.5, dur: 0.5, note: 60, gain: 0.8 },
    ])
    expect(added(rests, { way: 'in-the-gaps', seed: 1, take: 1 })).toEqual([
      { at: 2, dur: 0.5, note: 64, gain: 0.8 },
    ])
    expect(added(rests, { way: 'in-the-gaps', seed: 1, take: 2 })).toEqual([
      { at: 4.25, dur: 0.5, note: 67, gain: 0.8 },
    ])
  })

  it('fills two gaps a turn past half of far', () => {
    const filled = (take: number): number[] =>
      added(rests, { way: 'in-the-gaps', seed: 1, far: 1, take }).map((note) => note.at)
    expect(wayTakes(rests, { way: 'in-the-gaps', seed: 1, far: 1 }).takes).toBe(3)
    expect(filled(0)).toEqual([2, 6.5])
    expect(filled(1)).toEqual([2, 4.25])
    expect(filled(2)).toEqual([4.25, 6.5])
  })

  it('leaves every written note as it is, and adds notes only inside gaps wider than the narrowest', () => {
    for (const each of [rests, sound('felt-piano-phrase-am'), sound('kalimba-pattern-am')]) {
      const reading = readSound(each)
      const starts = reading.moments.map((moment) => moment.at)
      const ends = [...starts.slice(1), ...(reading.shape === 'round' ? [reading.passSec] : [])]
      const gaps = ends.map((end, index) => end - starts[index])
      const narrowest = Math.min(...gaps)
      for (const far of [0.25, 1]) {
        const playing = { way: 'in-the-gaps', seed: 1, far }
        expect(wayTakes(each, playing).takes).toBeGreaterThanOrEqual(2)
        for (const take of takesOf(each, playing)) {
          expect(kept(each, { ...playing, take }), `take ${take}`).toBe(true)
          const notes = added(each, { ...playing, take })
          expect(notes).toHaveLength(far > 0.5 ? 2 : 1)
          for (const note of notes) {
            const gap = gaps.findIndex(
              (_, index) => note.at > starts[index] && note.at < ends[index],
            )
            expect(gap, `take ${take} at ${note.at}`).toBeGreaterThanOrEqual(0)
            expect(tick(gaps[gap])).toBeGreaterThan(tick(narrowest))
            expect(reading.upper).toContain(note.note)
          }
        }
      }
    }
  })

  it('gives no takes on a phrase of even strokes, or on a kit', () => {
    expect(wayTakes(line, { way: 'in-the-gaps', seed: 1 })).toEqual({
      takes: 0,
      round: [],
      cut: false,
      refusal: 'Needs a phrase with rests.',
    })
    const kit = FACTORY_SOUNDS.find((each) => each.kit && each.phrase.notes.length > 8)
    expect(kit).toBeDefined()
    if (!kit) return
    expect(wayTakes(kit, { way: 'in-the-gaps', seed: 1 }).refusal).toBe('Its keys are not notes.')
  })
})

describe('hits and voices', () => {
  const WAYS_OF_IT = ['echoes', 'two-readers', 'in-the-gaps']

  it('keeps what a take keeps on every sound of the bank it fits', () => {
    expect(bankProblems(WAYS_OF_IT, [3, 77])).toEqual([])
  }, 120_000)

  it('has something to play on sounds of the bank at the far each way stands at', () => {
    for (const way of WAYS_OF_IT) {
      const fitted = FACTORY_SOUNDS.filter((each) => wayTakes(each, { way, seed: 3 }).takes > 0)
      expect(fitted.length, way).toBeGreaterThanOrEqual(5)
    }
  })
})
