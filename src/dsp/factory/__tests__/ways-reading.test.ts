// A sound read into what a way works on, and a pass laid out again as a
// phrase: the three shapes of the bank, the keys that are not pitches, and
// that reading and laying out again changes nothing about any sound.

import { describe, expect, it } from 'vitest'

import { DEFAULT_PHRASE_GAIN } from '../../patch-render'
import { FACTORY_SOUNDS } from '..'
import { loadFactoryPackSounds } from '../sound-packs'
import { cycled, looped, played } from '../sounds/recipe'
import { alongKey, layOut, readSound } from '../ways/reading'
import { notesKey } from './ways-support'

const chord = looped(16, 4, 2, [48, 55, [64, 0.6], 71])
const round = cycled(8, [
  [0, 1, 48],
  [1, 1, 60],
  [2, 1, 64],
  [3, 1, 67],
  [4, 1, 72],
  [5, 1, 76],
  [6, 1, 79],
  [7, 0.5, 84],
])
const ending = played(8, [
  [0, 1, 48],
  [1, 1, 60],
  [1, 1, 64],
  [3, 2, 67],
])

describe('readSound', () => {
  it('reads a chord held through a loop', () => {
    const reading = readSound(chord)
    expect(reading.shape).toBe('held')
    expect(reading.moments).toHaveLength(1)
    expect(reading.chord).toEqual([48, 55, 64, 71])
    expect(reading.standing).toBe(48)
    expect(reading.upper).toEqual([55, 64, 71])
    // A way strikes a held chord from a crossfade's length into the loop to the loop's end.
    expect([reading.fromSec, reading.toSec, reading.endSec]).toEqual([6, 20, 22])
  })

  it('reads one pass of a phrase played round', () => {
    const reading = readSound(round)
    expect(reading.shape).toBe('round')
    expect(reading.moments).toHaveLength(8)
    expect(reading.passSec).toBe(8)
    expect(reading.moments.map((moment) => moment.standing)).toEqual([
      true,
      ...Array.from({ length: 7 }, () => false),
    ])
  })

  it('reads a phrase that ends, with the notes struck together as one moment', () => {
    const reading = readSound(ending)
    expect(reading.shape).toBe('ended')
    expect(reading.moments.map((moment) => moment.notes.length)).toEqual([1, 2, 1])
    expect([reading.fromSec, reading.toSec]).toEqual([0, 3])
  })

  it('gives a kit and a sound made of another one no note to stand on', () => {
    const kit = FACTORY_SOUNDS.find((sound) => sound.kit)
    const made = FACTORY_SOUNDS.find((sound) => sound.source !== undefined)
    for (const sound of [kit, made]) {
      expect(sound).toBeDefined()
      if (!sound) continue
      const reading = readSound(sound)
      expect(reading.pitched, sound.id).toBe(false)
      expect(reading.standing, sound.id).toBeNull()
    }
  })

  it('reads a round sound whose passes differ as irregular', () => {
    const notes = round.phrase.notes.map((note, index) =>
      index === 9 ? { ...note, note: note.note + 2 } : note,
    )
    expect(readSound({ ...round, phrase: { notes } }).shape).toBe('irregular')
  })
})

describe('layOut', () => {
  it('gives back the written notes of a phrase played round, exactly', () => {
    const reading = readSound(round)
    const again = layOut(round, reading, reading.notes).phrase.notes
    expect(again.map((note) => [note.atSec, note.durSec, note.note])).toEqual(
      round.phrase.notes.map((note) => [note.atSec, note.durSec, note.note]),
    )
  })

  it('gives back a held chord and a phrase that ends', () => {
    for (const sound of [chord, ending]) {
      const reading = readSound(sound)
      const again = layOut(sound, reading, reading.notes)
      expect(again.phrase.notes).toEqual(
        sound.phrase.notes.map((note) => ({ ...note, gain: note.gain ?? DEFAULT_PHRASE_GAIN })),
      )
      expect(again.durationSec).toBe(sound.durationSec)
    }
  })

  it('brings the hardest note of a pass to the hardest note of the sound', () => {
    const reading = readSound(chord)
    const quiet = reading.notes.map((note) => ({ ...note, gain: note.gain / 2 }))
    const gains = layOut(chord, reading, quiet).phrase.notes.map((note) => note.gain)
    expect(Math.max(...gains.map((gain) => gain ?? 0))).toBeCloseTo(DEFAULT_PHRASE_GAIN, 9)
    expect(gains[2]).toBeCloseTo(0.6, 9)
  })

  it('writes a pass with no note that sounds at gains that are numbers', () => {
    const reading = readSound(chord)
    const silent = reading.notes.map((note) => ({ ...note, gain: 0 }))
    for (const note of layOut(chord, reading, silent).phrase.notes) {
      expect(note.gain).toBe(0.02)
    }
  })

  it('changes nothing about any sound of the bank or of a pack', async () => {
    for (const sound of [...FACTORY_SOUNDS, ...(await loadFactoryPackSounds())]) {
      const reading = readSound(sound)
      if (reading.shape === 'irregular') continue
      expect(notesKey(layOut(sound, reading, reading.notes).phrase.notes), sound.id).toBe(
        notesKey(sound.phrase.notes),
      )
    }
  })
})

describe('alongKey', () => {
  it('steps along the white keys for a sound of the bank', () => {
    expect(alongKey(62, 3, { root: 2, mode: 'dorian' })).toBe(67)
    expect(alongKey(67, -3, { root: 2, mode: 'dorian' })).toBe(62)
    expect(alongKey(62, 3)).toBe(67)
  })

  it('steps along another key through the white keys and back', () => {
    const key = { root: 4, mode: 'major' } as const
    expect(alongKey(64, 3, key)).toBe(69)
    expect(alongKey(69, -3, key)).toBe(64)
    // E to F sharp, G sharp, A: the steps of E major.
    expect([1, 2, 3].map((steps) => alongKey(64, steps, key))).toEqual([66, 68, 69])
  })
})
