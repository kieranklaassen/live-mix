// Generated sounds held to what the bank's own are: the same seed gives the
// same sound, in any key every note is a note of that key, and one sound of
// every voice renders at the bank's level as the kind it was asked to be.

import { describe, expect, it } from 'vitest'

import { analyzeSound } from '../../../core/analysis/sound-kind'
import { DeviceRegistry } from '../../../core/devices/registry'
import { validatePatch } from '../../../core/devices/patch'
import { compileFromDisk, measureAudio, toDb } from '../../__tests__/render-support'
import { canRenderPatch, peakOf } from '../../patch-render'
import { STOCK_WASM_DEVICES } from '../../registry'
import {
  FACTORY_MODES,
  FACTORY_PEAK_DB,
  GENERATED_KINDS,
  generateSound,
  keyChord,
  renderGeneratedSound,
  type FactoryKey,
  type FactoryMode,
  type GeneratedSound,
} from '..'

const registry = new DeviceRegistry(STOCK_WASM_DEVICES)
const MODES = Object.keys(FACTORY_MODES) as FactoryMode[]
const SEEDS = Array.from({ length: 60 }, (_unused, index) => index + 1)
const mod12 = (value: number): number => ((Math.round(value) % 12) + 12) % 12

/** A key that goes round all twelve roots and six modes with the seed. */
const keyFor = (seed: number): FactoryKey => ({
  root: (seed * 7) % 12,
  mode: MODES[seed % MODES.length],
})

function scaleOf(key: FactoryKey): Set<number> {
  return new Set(FACTORY_MODES[key.mode].map((step) => mod12(key.root + step)))
}

/** What a sound is without its note or chord: "Warm pad" of "Warm pad Dm9". */
const voiceOf = (sound: GeneratedSound): string => sound.name.replace(/ [A-G][♯♭]?[^ ]*$/, '')

const devicesOf = (sound: GeneratedSound): string[] =>
  [sound.patch.instrument, ...sound.patch.effects].map(
    (device) => `${device?.deviceId}/${device?.preset ?? ''}`,
  )

function largestStep(channel: Float32Array): number {
  let largest = 0
  for (let i = 1; i < channel.length; i += 1) {
    largest = Math.max(largest, Math.abs(channel[i] - channel[i - 1]))
  }
  return largest
}

describe('generated sounds', () => {
  it('are the same sound for the same seed', () => {
    for (const kind of GENERATED_KINDS) {
      const options = { seed: 20261002, kind, key: { root: 2, mode: 'dorian' } as const }
      expect(generateSound(options)).toEqual(generateSound(options))
      expect(generateSound({ ...options, degree: 3 })).toEqual(
        generateSound({ ...options, degree: 10 }),
      )
    }
    expect(generateSound({ seed: 7 })).toEqual(generateSound({ seed: 7 }))
    expect(generateSound({ seed: 7.9 }).seed).toBe(7)
    expect(generateSound({ seed: 7 }).key).toEqual({ root: 0, mode: 'major' })
  })

  it('differ from seed to seed', () => {
    for (const kind of GENERATED_KINDS) {
      const made = SEEDS.map((seed) => JSON.stringify(generateSound({ seed, kind }).patch))
      expect(new Set(made).size, kind).toBeGreaterThan(SEEDS.length / 3)
      const voices = new Set(SEEDS.map((seed) => voiceOf(generateSound({ seed, kind }))))
      expect(voices.size, `${kind} voices`).toBeGreaterThanOrEqual(5)
    }
  })

  it('are listed like the bank: a short name, a sentence, real devices', () => {
    for (const kind of GENERATED_KINDS) {
      for (const seed of SEEDS) {
        for (const degree of [undefined, seed % 7]) {
          const sound = generateSound({ seed, kind, key: keyFor(seed), degree })
          const label = `${kind} ${seed}: ${sound.name}`
          expect(sound.kind).toBe(kind)
          expect(sound.name.length, label).toBeGreaterThan(2)
          expect(sound.name.length, label).toBeLessThanOrEqual(24)
          expect(sound.description, label).toMatch(/^[A-Z].{24,}\.$/)
          expect(sound.patch.name).toBe(sound.name)
          expect(validatePatch(sound.patch, registry), label).toEqual([])
          expect(canRenderPatch(sound.patch), label).toBe(true)
          expect(sound.phrase.notes.length, label).toBeGreaterThan(0)
          expect(sound.durationSec).toBeGreaterThanOrEqual(2)
          expect(sound.durationSec).toBeLessThanOrEqual(32)
          for (const note of sound.phrase.notes) {
            expect(note.atSec, label).toBeGreaterThanOrEqual(0)
            expect(note.atSec, label).toBeLessThan(sound.durationSec)
            expect(note.note, label).toBeGreaterThanOrEqual(24)
            expect(note.note, label).toBeLessThanOrEqual(100)
          }
          // A loop holds its notes through all of it; a sound that ends says how.
          if (sound.loopCrossfadeSec) expect(sound.fadeOutSec).toBeUndefined()
          else expect(sound.fadeOutSec, label).toBeGreaterThan(0)
        }
      }
    }
  })

  it('play only notes of the key', () => {
    for (const kind of GENERATED_KINDS.filter((k) => k !== 'texture')) {
      for (const seed of SEEDS) {
        for (const degree of [undefined, 0, 1, 2, 3, 4, 5, 6]) {
          const key = keyFor(seed)
          const scale = scaleOf(key)
          const sound = generateSound({ seed, kind, key, degree })
          for (const note of sound.phrase.notes) {
            expect(
              scale.has(mod12(note.note)),
              `${kind} ${seed} on ${degree} in ${key.root} ${key.mode}: ${sound.name} plays ${note.note}`,
            ).toBe(true)
          }
        }
      }
    }
  })

  it('are the same instrument and effects in every key', () => {
    for (const kind of GENERATED_KINDS) {
      for (const seed of SEEDS.slice(0, 24)) {
        const mode = MODES[seed % MODES.length]
        const home = generateSound({ seed, kind, key: { root: 0, mode }, degree: 0 })
        for (let root = 1; root < 12; root += 1) {
          const moved = generateSound({ seed, kind, key: { root, mode }, degree: 0 })
          expect(devicesOf(moved), `${kind} ${seed}`).toEqual(devicesOf(home))
          expect(voiceOf(moved)).toBe(voiceOf(home))
          expect(moved.durationSec).toBe(home.durationSec)
          // The same notes, each moved to the new key (in whichever octave suits it
          // there); rain and fire are held open by a note that tunes nothing.
          if (kind !== 'texture') {
            expect(moved.phrase.notes.map((note) => mod12(note.note - root))).toEqual(
              home.phrase.notes.map((note) => mod12(note.note)),
            )
          }
          expect(moved.phrase.notes.map((note) => note.atSec)).toEqual(
            home.phrase.notes.map((note) => note.atSec),
          )
        }
      }
    }
  })

  it("draw the chord when none is asked for, the key's own most often", () => {
    const drawn = new Array<number>(7).fill(0)
    for (let seed = 1; seed <= 700; seed += 1) {
      const key = keyFor(seed)
      const sound = generateSound({ seed, kind: 'pad', key })
      expect(keyChord(key, sound.degree).fifth, `seed ${seed}`).toBe(7)
      drawn[sound.degree] += 1
    }
    expect(drawn[0]).toBeGreaterThan(Math.max(...drawn.slice(1)))
    expect(drawn.filter((count) => count > 0).length).toBe(7)
  })
})

// One sound of every voice, found by going through the seeds, each in the key its seed gives.
const VOICES = GENERATED_KINDS.flatMap((kind) => {
  const found = new Map<string, GeneratedSound>()
  for (let seed = 1; seed <= 200; seed += 1) {
    const sound = generateSound({ seed, kind, key: keyFor(seed) })
    if (!found.has(voiceOf(sound))) found.set(voiceOf(sound), sound)
  }
  return [...found].map(([voice, sound]) => [`${kind}: ${voice}`, sound] as const)
})

describe.each(VOICES)('generated %s', (_voice, sound) => {
  it('renders at the bank level as the kind it was asked to be', async () => {
    const audio = await renderGeneratedSound(sound, { compile: compileFromDisk, sliceMs: 0 })
    expect(audio.channels[0]).toHaveLength(Math.round(sound.durationSec * audio.sampleRate))
    expect(toDb(peakOf(audio.channels))).toBeCloseTo(FACTORY_PEAK_DB, 1)
    expect(measureAudio(audio).lufs, 'loudness').toBeGreaterThan(-40)
    expect(analyzeSound(audio.channels, audio.sampleRate).kind, sound.name).toBe(sound.kind)
    for (const channel of audio.channels) {
      const wrap = Math.abs(channel[0] - channel[channel.length - 1])
      if (sound.loopCrossfadeSec) {
        expect(wrap, 'the loop seam').toBeLessThanOrEqual(largestStep(channel))
      } else {
        expect(Math.abs(channel[channel.length - 1]), 'the last sample').toBeLessThan(1e-3)
      }
    }
  })
})
