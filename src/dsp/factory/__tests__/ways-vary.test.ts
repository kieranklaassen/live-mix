// A way and a variant together (`playAndVarySound`, and `plays` with `vary`
// on a render). The way writes the notes; the variant gives its chord and its
// touch. What the takes of one way must stay through any variant: different
// from one another, and on one chord.

import { describe, expect, it } from 'vitest'

import { FACTORY_SOUNDS, factorySound } from '..'
import { looped } from '../sounds/recipe'
import { type FactorySound } from '../types'
import {
  HIGHEST_NOTE,
  LOWEST_NOTE,
  type SoundVariation,
  alongWhiteKeys,
  describeVariant,
  varySound,
} from '../vary'
import { WAYS, playAndVarySound, playSound, wayTakes } from '../ways'
import { notesKey } from './ways-support'

const sound = (id: string): FactorySound => {
  const found = factorySound(id)
  if (!found) throw new Error(`no factory sound "${id}"`)
  return found
}

const takesOf = (count: number): number[] => Array.from({ length: count }, (_, take) => take)
/** The key a sound's lowest note is on: a variant's touch may tune it a few cents off. */
const lowest = (of: Pick<FactorySound, 'phrase'>): number =>
  Math.round(Math.min(...of.phrase.notes.map((note) => note.note)))

describe('a way with a variant on top', () => {
  it('keeps every take of every way different from the others, on every sound of the bank', () => {
    const variations: SoundVariation[] = [
      { seed: 1, amount: 1 },
      { seed: 2, amount: 0.5 },
      { seed: 3, amount: 0.25 },
      { seed: 4, speed: 1, pattern: 1 },
    ]
    let asked = 0
    for (const each of FACTORY_SOUNDS) {
      for (const way of WAYS) {
        const playing = { way: way.id, seed: 1 }
        const { takes } = wayTakes(each, playing)
        if (takes === 0) continue
        for (const variation of variations) {
          const keys = takesOf(takes).map((take) =>
            notesKey(playAndVarySound(each, { ...playing, take }, variation).phrase.notes),
          )
          expect(new Set(keys).size, `${each.id} ${way.id} seed ${variation.seed}`).toBe(takes)
          asked += 1
        }
      }
    }
    expect(asked).toBeGreaterThan(1000)
  }, 240000)

  it('reads no speed and no pattern from the variant: with those alone a take is the take', () => {
    const variation = { seed: 9, speed: 1, pattern: 1 }
    for (const id of ['thumb-dub-line-am', 'soft-pad-fmaj7', 'club-snare-hit', 'felt-piano-c']) {
      const each = sound(id)
      for (const way of WAYS) {
        const playing = { way: way.id, seed: 3 }
        for (const take of takesOf(wayTakes(each, playing).takes)) {
          // The same object where the take is the sound as written, the same notes everywhere.
          const played = playSound(each, { ...playing, take })
          const varied = playAndVarySound(each, { ...playing, take }, variation)
          expect(notesKey(varied.phrase.notes), `${id} ${way.id} take ${take}`).toBe(
            notesKey(played.phrase.notes),
          )
          if (played === each) expect(varied, `${id} ${way.id} take ${take}`).toBe(each)
        }
      }
    }
  })

  it('is the variant there was where the way has nothing to play, and the take where there is no variant', () => {
    const variation = { seed: 5, amount: 1 }
    const line = sound('thumb-dub-line-am')
    expect(wayTakes(line, { way: 'echoes', seed: 1 }).takes).toBe(0)
    expect(playAndVarySound(line, { way: 'echoes', seed: 1 }, variation)).toEqual(
      varySound(line, variation),
    )
    expect(playAndVarySound(line, { way: 'no-such-way', seed: 1 }, variation)).toEqual(
      varySound(line, variation),
    )
    const playing = { way: 'leave-one-out', seed: 1, take: 1 }
    expect(wayTakes(line, playing).takes).toBeGreaterThanOrEqual(2)
    expect(playAndVarySound(line, playing)).toEqual(playSound(line, playing))
  })

  // C3 E4 G4 B5: past half of far the first family plays the octave above as well, so some
  // takes reach B6 and some do not. A chord asked of each take's own notes would go up for
  // the one and down for the others.
  const high = looped(16, 4, 2, [48, 64, 67, 83])

  it('puts every take of a way on one chord: the one the variant puts the sound on', () => {
    const playing = { way: 'there-and-back', seed: 1, far: 0.6 }
    const { takes } = wayTakes(high, playing)
    expect(takes).toBeGreaterThanOrEqual(3)
    let moved = 0
    let turned = 0
    for (let seed = 0; seed < 400; seed += 1) {
      const variation = { seed, amount: 0.5 }
      const steps = describeVariant(high, variation).chordSteps
      const stood = takesOf(takes).map((take) =>
        playAndVarySound(high, { ...playing, take }, variation),
      )
      // Every take keeps the note its sound stands on, so where that note is says the chord.
      const floors = new Set(stood.map(lowest))
      expect(floors.size, `seed ${seed}`).toBe(1)
      const [floor] = floors
      const octave = steps > 0 ? steps - 7 : steps + 7
      expect(
        [steps, octave, 0].map((by) => alongWhiteKeys(48, by)),
        `seed ${seed}`,
      ).toContain(floor)
      for (const take of stood) {
        for (const note of take.phrase.notes) {
          expect(note.note, `seed ${seed}`).toBeGreaterThanOrEqual(LOWEST_NOTE)
          expect(note.note, `seed ${seed}`).toBeLessThanOrEqual(HIGHEST_NOTE)
        }
      }
      if (floor !== 48) moved += 1
      if (steps !== 0 && floor !== alongWhiteKeys(48, steps)) turned += 1
    }
    // The chord is moved for some seeds, and for some of those the takes do not all fit
    // where the sound as written does: they stand an octave the other way, together.
    expect(moved).toBeGreaterThan(20)
    expect(turned).toBeGreaterThan(0)
  })

  it('does the same for a chord said by name', () => {
    const playing = { way: 'rising', seed: 1, far: 1 }
    const { takes } = wayTakes(high, playing)
    expect(takes).toBeGreaterThanOrEqual(2)
    for (const chord of [-3, -2, -1, 1, 2, 3]) {
      for (let seed = 0; seed < 40; seed += 1) {
        const floors = new Set(
          takesOf(takes).map((take) =>
            lowest(playAndVarySound(high, { ...playing, take }, { seed, chord })),
          ),
        )
        expect(floors.size, `chord ${chord} seed ${seed}`).toBe(1)
      }
    }
  })
})
