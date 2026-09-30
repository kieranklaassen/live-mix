import { describe, expect, it } from 'vitest'

import { detectOnsets, estimateTempo } from '../onsets'
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

const onsetsOf = (signal: Float32Array) => detectOnsets([signal], SAMPLE_RATE)

/** Every expected time has a detected onset within `toleranceSec`, and nothing else was found. */
function expectOnsetsAt(found: number[], expected: number[], toleranceSec = 0.02): void {
  expect(found).toHaveLength(expected.length)
  expected.forEach((time, index) => {
    expect(Math.abs(found[index] - time)).toBeLessThanOrEqual(toleranceSec)
  })
}

describe('detectOnsets', () => {
  it('returns nothing for empty, silent or degenerate input', () => {
    expect(detectOnsets([], SAMPLE_RATE)).toEqual([])
    expect(detectOnsets([new Float32Array(0)], SAMPLE_RATE)).toEqual([])
    expect(onsetsOf(silence(2))).toEqual([])
    expect(detectOnsets([sine(1, 220)], 0)).toEqual([])
  })

  it('finds no onsets in steady noise', () => {
    expect(onsetsOf(whiteNoise(8))).toEqual([])
    expect(onsetsOf(rain(8))).toEqual([])
    expect(onsetsOf(pinkNoise(8)).length).toBeLessThanOrEqual(1)
    // Hiss that comes and goes in slow gusts.
    const gusts = shape(whiteNoise(10, 7), (t) => 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.15 * t))
    expect(onsetsOf(gusts)).toEqual([])
  })

  it('finds no onsets in drones, even when cut from the middle of a longer sound', () => {
    expect(onsetsOf(sine(8, 220))).toEqual([])
    // A low tone has under one period per hop; the envelope must not ripple into hits.
    expect(onsetsOf(sine(8, 55))).toEqual([])
    const chord = mixInto(mixInto(sine(8, 110, 0.3), sine(8, 165, 0.3)), sine(8, 220.7, 0.2))
    expect(onsetsOf(chord)).toEqual([])
  })

  it('finds no onsets in slow swells', () => {
    expect(onsetsOf(shape(sine(8, 220), (t, d) => Math.sin((Math.PI * t) / d) ** 2))).toEqual([])
    // Half a second up from nothing is still a swell, not a hit.
    expect(onsetsOf(shape(sine(6, 220), (t, d) => Math.min(1, t / 0.5, (d - t) / 2)))).toEqual([])
  })

  it('counts the attack at t≈0 of a sound that starts abruptly and decays', () => {
    expectOnsetsAt(onsetsOf(note(440, 2, 0.3)), [0])
    // A bell: abrupt start, long tail.
    expectOnsetsAt(onsetsOf(note(660, 6, 1.5)), [0])
    expectOnsetsAt(onsetsOf(kick()), [0])
    expectOnsetsAt(onsetsOf(click(4, 0.01, 0.8, 0.08)), [0])
  })

  it('finds one onset per hit of a click train', () => {
    const expected = Array.from({ length: 16 }, (_, beat) => beat * 0.625)
    expectOnsetsAt(onsetsOf(clickTrain96()), expected, 0.005)
  })

  it('finds each hit of a kick and hat loop, including hats over a sustained bass', () => {
    const eighths = Array.from({ length: 32 }, (_, step) => step * 0.3125)
    const loop = mixInto(
      pattern(10, 96, () => kick()),
      pattern(10, 96, (step) => click(step, 0.01, 0.3, 0.06), 2),
    )
    expectOnsetsAt(onsetsOf(loop), eighths)

    const overBass = mixInto(
      pattern(10, 96, (step) => click(step, 0.01, 0.15, 0.06), 2),
      sine(10, 60, 0.5),
    )
    expectOnsetsAt(onsetsOf(overBass), eighths)
  })

  it('finds each note of an irregular phrase of plucks', () => {
    const { signal, times } = irregularNotes()
    expectOnsetsAt(onsetsOf(signal), times)
  })

  it('mixes channels to mono and works at other sample rates', () => {
    const sampleRate = 44100
    const left = new Float32Array(sampleRate * 4)
    const right = new Float32Array(sampleRate * 4)
    const random = seeded(2)
    for (let hit = 0; hit < 8; hit++) {
      const offset = Math.round(hit * 0.5 * sampleRate)
      for (let i = 0; i < sampleRate * 0.1; i++) {
        const value = 0.8 * (2 * random() - 1) * Math.exp(-i / sampleRate / 0.03)
        // Alternate sides: every hit must survive the mono mix.
        if (hit % 2 === 0) left[offset + i] = value
        else right[offset + i] = value
      }
    }
    expectOnsetsAt(
      detectOnsets([left, right], sampleRate),
      Array.from({ length: 8 }, (_, hit) => hit * 0.5),
      0.005,
    )
  })

  it('honours the minimum gap and the sensitivity', () => {
    // A flam: two clicks 30 ms apart are one onset by default, two with a short gap.
    const flam = mixInto(mixInto(silence(1), click(1, 0.004), 0.2), click(2, 0.004), 0.23)
    expect(onsetsOf(flam)).toHaveLength(1)
    expect(detectOnsets([flam], SAMPLE_RATE, { minGapSec: 0.02 })).toHaveLength(2)

    // A ghost note at 2 % of the accent's level: found by default, dropped when less sensitive.
    const ghost = mixInto(mixInto(silence(2), click(1), 0.3), click(2, 0.03, 0.016), 1.2)
    expect(onsetsOf(ghost)).toHaveLength(2)
    expect(detectOnsets([ghost], SAMPLE_RATE, { sensitivity: 3 })).toHaveLength(1)
  })
})

describe('estimateTempo', () => {
  const grid = (count: number, stepSec: number) =>
    Array.from({ length: count }, (_, index) => index * stepSec)

  it('returns null with fewer than four onsets', () => {
    expect(estimateTempo([], 10)).toBeNull()
    expect(estimateTempo([0, 0.5, 1], 2)).toBeNull()
  })

  it('reads the tempo of a regular train with full confidence', () => {
    const tempo = estimateTempo(grid(16, 0.625), 10)
    expect(tempo?.bpm).toBeCloseTo(96, 3)
    expect(tempo?.beatSec).toBeCloseTo(0.625, 5)
    expect(tempo?.confidence).toBeCloseTo(1, 3)
  })

  it('reads the tempo of the detected onsets of a 96 bpm click train', () => {
    const tempo = estimateTempo(detectOnsets([clickTrain96()], SAMPLE_RATE), 10)
    expect(tempo?.bpm).toBeGreaterThan(95.5)
    expect(tempo?.bpm).toBeLessThan(96.5)
    expect(tempo?.confidence).toBeGreaterThan(0.9)
  })

  it('folds subdivisions and slow pulses into 60–180 bpm', () => {
    // Eighths and sixteenths at 96 are still 96.
    expect(estimateTempo(grid(32, 0.3125), 10)?.bpm).toBeCloseTo(96, 2)
    expect(estimateTempo(grid(64, 0.15625), 10)?.bpm).toBeCloseTo(96, 2)
    // One hit per bar at 96 (2.5 s apart) folds up to 96.
    expect(estimateTempo(grid(8, 2.5), 20)?.bpm).toBeCloseTo(96, 2)
    // A hit on every beat at 70 and at 150 reads as played.
    expect(estimateTempo(grid(8, 60 / 70), 8)?.bpm).toBeCloseTo(70, 2)
    expect(estimateTempo(grid(16, 0.4), 6.4)?.bpm).toBeCloseTo(150, 2)
    for (const stepSec of [0.11, 0.2, 0.34, 0.5, 0.77, 1, 1.9]) {
      const bpm = estimateTempo(grid(24, stepSec), 24 * stepSec)?.bpm ?? 0
      expect(bpm).toBeGreaterThanOrEqual(60)
      expect(bpm).toBeLessThanOrEqual(180)
    }
  })

  it('finds the beat of a syncopated pattern from its bar-length repeats', () => {
    // A tresillo on sixteenths at 96 bpm: no two hits are one beat apart.
    const cell = 0.15625
    const onsets = [0, 1, 2, 3].flatMap((bar) =>
      [0, 3, 6, 8, 11, 14].map((step) => (bar * 16 + step) * cell),
    )
    const tempo = estimateTempo(onsets, 10)
    expect(tempo?.bpm).toBeCloseTo(96, 1)
    expect(tempo?.confidence).toBeGreaterThan(0.6)
  })

  it('tolerates human timing and unsorted input, with lower confidence', () => {
    const random = seeded(5)
    const loose = grid(16, 0.625).map((time) => time + (random() - 0.5) * 0.04)
    const tempo = estimateTempo([...loose].reverse(), 10)
    expect(tempo?.bpm).toBeGreaterThan(95)
    expect(tempo?.bpm).toBeLessThan(97)
    expect(tempo?.confidence).toBeGreaterThan(0.7)
    expect(tempo?.confidence).toBeLessThan(1)
  })

  it('has little or no confidence in irregular onsets', () => {
    const random = seeded(99)
    let confident = 0
    for (let trial = 0; trial < 200; trial++) {
      const onsets: number[] = []
      let time = 0
      for (let index = 0; index < 10; index++) {
        time += 0.15 + random()
        onsets.push(time)
      }
      const tempo = estimateTempo(onsets, time + 0.5)
      if (tempo && tempo.confidence >= 0.6) confident += 1
    }
    expect(confident).toBeLessThanOrEqual(4)
    expect(estimateTempo(irregularNotes().times, 9)).toBeNull()
  })
})
