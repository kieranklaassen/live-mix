// Every sound of the bank that keeps time (a drum loop, a glitch loop, a
// pulse: one with a `bpm`), held to what a host that follows a tempo counts
// on: it is a loop of whole bars at the tempo it is written at, the same
// strokes played round and kept from a bar line; at another tempo it is the same strokes on the same
// beats and as many beats long; and rendered there it is that long to the
// frame, at the bank's level, and still comes round on itself.
//
// `tempo.test.ts` holds the arithmetic on sounds made up for it; this file
// holds the bank, so a sound added with a `bpm` is held to it by being there.

import { describe, expect, it } from 'vitest'

import { compileFromDisk, toDb } from '../../__tests__/render-support'
import { peakOf } from '../../patch-render'
import {
  FACTORY_PEAK_DB,
  FACTORY_SOUNDS,
  factoryPreset,
  isKitInstrument,
  renderFactorySound,
  soundAtTempo,
} from '..'
import { BAR_SEC, WRITTEN_BPM } from '../sounds/rhythm'
import { measureEnds } from './sound-measure'

const TIMED = FACTORY_SOUNDS.filter((sound) => sound.bpm !== undefined)
const node = { compile: compileFromDisk, sliceMs: 0 } as const
/** A tempo no sound is written at and no length divides evenly: a loop of 4 s is 5 s here, one of 8 s is 10. */
const OTHER_BPM = 96
/** Tempos from one end of what a host asks for to the other. */
const TEMPOS = [60, 90, 150, 200] as const

/** The largest step between neighbouring samples, the wrap from the last to the first excluded. */
function largestStep(channel: Float32Array): number {
  let largest = 0
  for (let i = 1; i < channel.length; i += 1) {
    largest = Math.max(largest, Math.abs(channel[i] - channel[i - 1]))
  }
  return largest
}

describe('the sounds that keep time', () => {
  it('are there, and are told from the rest by their tempo alone', () => {
    expect(TIMED.length).toBeGreaterThan(0)
    // A sound without one is the same object at any tempo: a host keys its store by tempo only where there is one.
    for (const sound of FACTORY_SOUNDS) {
      if (sound.bpm === undefined) expect(soundAtTempo(sound, OTHER_BPM), sound.id).toBe(sound)
    }
  })

  it('are played on a kit exactly when they are marked as played on one', () => {
    for (const sound of TIMED) {
      const patch = typeof sound.patch === 'string' ? factoryPreset(sound.patch) : sound.patch
      const instrument = patch?.instrument?.deviceId
      expect(instrument !== undefined && isKitInstrument(instrument), sound.id).toBe(
        sound.kit === true,
      )
    }
  })
})

describe.each(TIMED.map((sound) => [sound.id, sound] as const))('sound %s', (_id, sound) => {
  it('is whole bars at the tempo it is written at, the same strokes played round, kept from a bar line', () => {
    expect(sound.bpm).toBe(WRITTEN_BPM)
    const barCount = sound.durationSec / BAR_SEC
    expect(barCount, 'bars').toBe(Math.round(barCount))
    expect(barCount).toBeGreaterThanOrEqual(1)
    expect(sound.loopCrossfadeSec, 'comes round').toBeGreaterThan(0)
    expect(['beat', 'melodic']).toContain(sound.kind)
    // What is kept starts a whole number of rounds in: on a bar line, with the rounds before it ringing into it.
    const dropped = (sound.skipSec ?? 0) / sound.durationSec
    expect(dropped, 'rounds dropped').toBe(Math.round(dropped))
    expect(dropped).toBeGreaterThanOrEqual(1)
    // Every round is the same strokes, and there is one after the kept one for the fold to take from.
    const rounds: string[][] = []
    for (const note of sound.phrase.notes) {
      const round = Math.floor(note.atSec / sound.durationSec + 1e-9)
      const within = note.atSec - round * sound.durationSec
      expect(within, 'inside its round').toBeGreaterThanOrEqual(-1e-9)
      expect(within).toBeLessThan(sound.durationSec)
      ;(rounds[round] ??= []).push(
        [within.toFixed(6), note.durSec.toFixed(6), note.note, note.gain ?? ''].join(' '),
      )
    }
    expect(rounds).toHaveLength(dropped + 2)
    expect(rounds[0].length).toBeGreaterThan(0)
    for (const round of rounds) expect(round).toEqual(rounds[0])
  })

  it.each(TEMPOS)('is the same strokes on the same beats at %i', (bpm) => {
    const moved = soundAtTempo(sound, bpm)
    const ratio = WRITTEN_BPM / bpm
    expect(moved.bpm).toBe(bpm)
    expect(moved.id).toBe(sound.id)
    expect(moved.durationSec).toBeCloseTo(sound.durationSec * ratio, 9)
    expect(moved.phrase.notes).toHaveLength(sound.phrase.notes.length)
    moved.phrase.notes.forEach((note, at) => {
      const written = sound.phrase.notes[at]
      expect(note.atSec).toBeCloseTo(written.atSec * ratio, 9)
      expect(note.note).toBe(written.note)
    })
    // The fold is never made longer than it is written: what it folds is the ring of the drums, which stays as long.
    expect(moved.loopCrossfadeSec ?? 0).toBeLessThanOrEqual((sound.loopCrossfadeSec ?? 0) + 1e-9)
    // And back at its own tempo it is the sound.
    expect(soundAtTempo(sound, WRITTEN_BPM).durationSec).toBe(sound.durationSec)
  })

  it(`renders as many beats long at ${OTHER_BPM}, at the bank level, and comes round on itself`, async () => {
    const audio = await renderFactorySound(sound, { ...node, bpm: OTHER_BPM })
    const seconds = sound.durationSec * (WRITTEN_BPM / OTHER_BPM)
    expect(audio.channels[0]).toHaveLength(Math.round(seconds * audio.sampleRate))
    expect(toDb(peakOf(audio.channels))).toBeCloseTo(FACTORY_PEAK_DB, 1)
    for (const channel of audio.channels) {
      const wrap = Math.abs(channel[0] - channel[channel.length - 1])
      expect(wrap, 'the loop seam').toBeLessThanOrEqual(largestStep(channel))
    }
    expect(measureEnds(audio).round, 'comes round on itself').toBe(true)
  })
})
