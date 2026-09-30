import { describe, expect, it } from 'vitest'

import { analyzeSound, kindOf, type SoundFeatures } from '../sound-kind'
import {
  SAMPLE_RATE,
  click,
  clickTrain96,
  irregularNotes,
  kick,
  mixInto,
  note,
  pattern,
  pinkNoise,
  rain,
  seeded,
  shape,
  silence,
  sine,
  whiteNoise,
} from './fixtures'

const analyze = (signal: Float32Array) => analyzeSound([signal], SAMPLE_RATE)

describe('analyzeSound', () => {
  it('calls steady noise a texture with no onsets', () => {
    for (const noise of [rain(8), whiteNoise(8), pinkNoise(8)]) {
      const analysis = analyze(noise)
      expect(analysis.kind).toBe('texture')
      expect(analysis.onsetsSec.length).toBeLessThanOrEqual(1)
      expect(analysis.tempo).toBeNull()
      expect(analysis.loop).toBe(false)
    }
    // Wind: noise whose level comes and goes is still a texture, not a pad.
    const gusts = shape(whiteNoise(10, 7), (t) => 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.15 * t))
    expect(analyze(gusts).kind).toBe('texture')
  })

  it('calls a flat sine a drone', () => {
    const analysis = analyze(sine(8, 220))
    expect(analysis).toEqual({ kind: 'drone', onsetsSec: [], tempo: null, loop: false })
    expect(analyze(sine(8, 55)).kind).toBe('drone')
    // A little hiss under the tone, and short fades at the edges, change nothing.
    const recorded = shape(mixInto(sine(8, 110, 0.4), whiteNoise(8, 2, 0.01)), (t, d) =>
      Math.min(1, t / 0.02, (d - t) / 0.02),
    )
    expect(analyze(recorded).kind).toBe('drone')
  })

  it('calls a sine with a slow swell a pad', () => {
    const swell = shape(sine(8, 220), (t, d) => Math.sin((Math.PI * t) / d) ** 2)
    expect(analyze(swell)).toEqual({ kind: 'pad', onsetsSec: [], tempo: null, loop: false })
    // Slow level movement without ever reaching silence.
    const moving = shape(sine(10, 220), (t) => 0.55 + 0.45 * Math.sin(2 * Math.PI * 0.25 * t))
    expect(analyze(moving).kind).toBe('pad')
    // Two detuned tones beating three times a second.
    expect(analyze(mixInto(sine(8, 220, 0.3), sine(8, 223, 0.3))).kind).toBe('pad')
  })

  it('calls an exponentially decaying sine a one-shot, with its attack as the only onset', () => {
    const analysis = analyze(note(440, 2, 0.3))
    expect(analysis.kind).toBe('oneshot')
    expect(analysis.onsetsSec).toHaveLength(1)
    expect(analysis.onsetsSec[0]).toBeLessThan(0.02)
    expect(analysis.tempo).toBeNull()
    expect(analysis.loop).toBe(false)
  })

  it('calls drum hits, long-tailed bells and short stabs one-shots', () => {
    expect(analyze(kick()).kind).toBe('oneshot')
    expect(analyze(click(4, 0.06, 0.8, 0.3)).kind).toBe('oneshot')
    expect(analyze(click(4, 0.01, 0.8, 0.08)).kind).toBe('oneshot')
    expect(analyze(note(660, 6, 1.5)).kind).toBe('oneshot')
    // A 0.4 s organ stab never decays, but is too short to be a drone.
    const stab = shape(sine(0.4, 330), (t, d) => Math.min(1, t / 0.005, (d - t) / 0.02))
    expect(analyze(stab).kind).toBe('oneshot')
  })

  it('calls a 96 bpm click train a beat that loops, at 96 ± 2 bpm', () => {
    const analysis = analyze(clickTrain96())
    expect(analysis.kind).toBe('beat')
    expect(analysis.onsetsSec).toHaveLength(16)
    expect(analysis.tempo?.bpm).toBeGreaterThan(94)
    expect(analysis.tempo?.bpm).toBeLessThan(98)
    expect(analysis.tempo?.confidence).toBeGreaterThan(0.9)
    expect(analysis.loop).toBe(true)
  })

  it('calls drum loops beats, and only whole-beat lengths loops', () => {
    const drums = (seconds: number) =>
      mixInto(
        pattern(seconds, 120, (step) => (step % 2 === 0 ? kick() : click(step, 0.05, 0.7, 0.2))),
        pattern(seconds, 120, (step) => click(step, 0.008, 0.25, 0.05), 4),
      )
    const loop = analyze(drums(8))
    expect(loop.kind).toBe('beat')
    expect(loop.tempo?.bpm).toBeCloseTo(120, 0)
    expect(loop.loop).toBe(true)

    // The same groove cut a third of a beat late does not repeat seamlessly.
    const ragged = analyze(drums(8 + 0.5 / 3))
    expect(ragged.kind).toBe('beat')
    expect(ragged.tempo?.bpm).toBeCloseTo(120, 0)
    expect(ragged.loop).toBe(false)

    // Tonal hits in time are a beat too: the kind follows the rhythm, not the timbre.
    const kicks = analyze(pattern((60 / 70) * 8, 70, () => kick()))
    expect(kicks.kind).toBe('beat')
    expect(kicks.tempo?.bpm).toBeCloseTo(70, 0)
    expect(kicks.loop).toBe(true)
  })

  it('calls irregular decaying notes melodic', () => {
    const { signal, times } = irregularNotes()
    const analysis = analyze(signal)
    expect(analysis.kind).toBe('melodic')
    expect(analysis.onsetsSec).toHaveLength(times.length)
    expect(analysis.tempo).toBeNull()
    expect(analysis.loop).toBe(false)
  })

  it('calls noisy irregular hits a texture when long and a one-shot when a short gesture', () => {
    const random = seeded(5)
    const crackle = whiteNoise(12, 8, 0.02)
    for (let time = 0.3; time < 11.5; time += 0.1 + random() * 1.2) {
      mixInto(crackle, click(Math.floor(time * 100), 0.008, 0.2 + 0.6 * random(), 0.05), time)
    }
    expect(analyze(crackle).kind).toBe('texture')

    const fill = silence(1.2)
    ;[0, 0.11, 0.2, 0.37, 0.5, 0.74].forEach((time, index) => {
      mixInto(fill, click(index, 0.04, 0.7, 0.15), time)
    })
    expect(analyze(fill).kind).toBe('oneshot')
  })

  it('reports silence and empty input as an empty texture', () => {
    const empty = { kind: 'texture', onsetsSec: [], tempo: null, loop: false }
    expect(analyzeSound([], SAMPLE_RATE)).toEqual(empty)
    expect(analyze(silence(1))).toEqual(empty)
  })

  it('gives the same answer for stereo as for mono', () => {
    const signal = clickTrain96()
    const stereo = analyzeSound([signal, signal.slice()], SAMPLE_RATE)
    expect(stereo).toEqual(analyze(signal))
  })
})

describe('kindOf', () => {
  const base: SoundFeatures = {
    durationSec: 6,
    attackSec: 0.01,
    tailRatio: 0.9,
    flatness: 0.9,
    tonality: 0.9,
    strongOnsets: 0,
  }

  it('applies the documented rules to the features', () => {
    expect(kindOf(base)).toBe('drone')
    expect(kindOf({ ...base, flatness: 0.3 })).toBe('pad')
    expect(kindOf({ ...base, tonality: 0.1 })).toBe('texture')
    expect(kindOf({ ...base, tonality: 0.1, flatness: 0.3 })).toBe('texture')
    expect(kindOf({ ...base, tailRatio: 0.05, strongOnsets: 1 })).toBe('oneshot')
    expect(kindOf({ ...base, tailRatio: 0.05, strongOnsets: 1, tonality: 0.1 })).toBe('oneshot')
    expect(kindOf({ ...base, tailRatio: 0.05, strongOnsets: 5 })).toBe('melodic')
    // A slow attack that fades is a pad however empty its tail.
    expect(kindOf({ ...base, attackSec: 1.5, tailRatio: 0.05, flatness: 0.1 })).toBe('pad')
    // A sustained tone that merely starts after a silence keeps its kind.
    expect(kindOf({ ...base, strongOnsets: 1 })).toBe('drone')
    expect(kindOf({ ...base, durationSec: 0.3 })).toBe('oneshot')
  })
})
