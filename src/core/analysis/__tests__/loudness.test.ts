import { describe, expect, it } from 'vitest'

import {
  Biquad,
  LoudnessAnalyzer,
  TRUE_PEAK_FIR_PHASES,
  TruePeakDetector,
  dbToGain,
  gainToDb,
  kWeightingCoefficients,
  loudnessFromMeanSquare,
  truePeakOversampling,
} from '../loudness'

const BLOCK = 128

/** Feeds `seconds` of a stereo signal through the analyser in 128-frame blocks. */
function feed(
  analyzer: LoudnessAnalyzer,
  seconds: number,
  sample: (t: number) => [number, number],
): void {
  const total = Math.round(seconds * analyzer.sampleRate)
  const left = new Float32Array(BLOCK)
  const right = new Float32Array(BLOCK)
  let n = 0
  while (n < total) {
    const frames = Math.min(BLOCK, total - n)
    for (let i = 0; i < frames; i += 1) {
      const [l, r] = sample((n + i) / analyzer.sampleRate)
      left[i] = l
      right[i] = r
    }
    analyzer.process(left, right, frames)
    n += frames
  }
}

const sine =
  (frequency: number, gainL: number, gainR = gainL, phase = 0) =>
  (t: number): [number, number] => {
    const v = Math.sin(2 * Math.PI * frequency * t + phase)
    return [gainL * v, gainR * v]
  }

const silence = (): [number, number] => [0, 0]

describe('kWeightingCoefficients', () => {
  it('reproduces the BS.1770-4 tables at 48 kHz', () => {
    const { shelf, highpass } = kWeightingCoefficients(48000)
    expect(shelf.b0).toBeCloseTo(1.53512485958697, 10)
    expect(shelf.b1).toBeCloseTo(-2.69169618940638, 10)
    expect(shelf.b2).toBeCloseTo(1.19839281085285, 10)
    expect(shelf.a1).toBeCloseTo(-1.69065929318241, 10)
    expect(shelf.a2).toBeCloseTo(0.73248077421585, 10)
    expect(highpass.b0).toBe(1)
    expect(highpass.b1).toBe(-2)
    expect(highpass.b2).toBe(1)
    expect(highpass.a1).toBeCloseTo(-1.99004745483398, 10)
    expect(highpass.a2).toBeCloseTo(0.99007225036621, 10)
  })

  it('applies +0.69 dB at 997 Hz (the offset the −0.691 LU term cancels) at any rate', () => {
    for (const sampleRate of [44100, 48000, 96000]) {
      const { shelf, highpass } = kWeightingCoefficients(sampleRate)
      const a = new Biquad(shelf)
      const b = new Biquad(highpass)
      let sumSquares = 0
      let count = 0
      const total = sampleRate * 2
      for (let n = 0; n < total; n += 1) {
        const y = b.process(a.process(Math.sin((2 * Math.PI * 997 * n) / sampleRate)))
        if (n >= sampleRate) {
          sumSquares += y * y
          count += 1
        }
      }
      const gainDb = 10 * Math.log10(sumSquares / count / 0.5)
      expect(gainDb).toBeCloseTo(0.691, 1)
    }
  })
})

describe('true peak FIR', () => {
  it('has four near-unity phases that mirror each other', () => {
    expect(TRUE_PEAK_FIR_PHASES).toHaveLength(4)
    for (const phase of TRUE_PEAK_FIR_PHASES) {
      expect(phase).toHaveLength(12)
      // The spec's coefficients are quantised to 1/8192; the mid phases carry ~0.25 dB of ripple.
      expect(Math.abs(phase.reduce((sum, c) => sum + c, 0) - 1)).toBeLessThan(0.03)
    }
    expect(TRUE_PEAK_FIR_PHASES[3]).toEqual([...TRUE_PEAK_FIR_PHASES[0]].reverse())
    expect(TRUE_PEAK_FIR_PHASES[2]).toEqual([...TRUE_PEAK_FIR_PHASES[1]].reverse())
  })

  it('oversamples 4× to 48 kHz, 2× to 96 kHz and not above', () => {
    expect(truePeakOversampling(44100)).toBe(4)
    expect(truePeakOversampling(48000)).toBe(4)
    expect(truePeakOversampling(88200)).toBe(2)
    expect(truePeakOversampling(96000)).toBe(2)
    expect(truePeakOversampling(192000)).toBe(1)
  })

  it('finds the inter-sample peak of a quarter-rate sine the samples miss', () => {
    // fs/4 with a 45° offset: every sample is ±0.7071 but the waveform peaks at 1.
    const detector = new TruePeakDetector(48000)
    let samplePeak = 0
    let truePeak = 0
    for (let n = 0; n < 4800; n += 1) {
      const x = Math.sin((Math.PI / 2) * n + Math.PI / 4)
      samplePeak = Math.max(samplePeak, Math.abs(x))
      truePeak = Math.max(truePeak, detector.push(x))
    }
    expect(samplePeak).toBeCloseTo(Math.SQRT1_2, 6)
    expect(truePeak).toBeGreaterThan(0.98)
    expect(truePeak).toBeLessThan(1.02)
  })

  it('never reports less than the sample peak', () => {
    const detector = new TruePeakDetector(48000)
    let ok = true
    for (let n = 0; n < 2000; n += 1) {
      const x = Math.sin(n * 0.37) * Math.cos(n * 0.011)
      if (detector.push(x) < Math.abs(x)) ok = false
    }
    expect(ok).toBe(true)
  })
})

describe('LoudnessAnalyzer', () => {
  it('reads −23.0 LUFS on the EBU Tech 3341 reference (997 Hz, −23 dBFS, stereo)', () => {
    for (const sampleRate of [44100, 48000, 96000]) {
      const analyzer = new LoudnessAnalyzer(sampleRate)
      feed(analyzer, 5, sine(997, dbToGain(-23)))
      const reading = analyzer.read()
      expect(reading.momentary).toBeCloseTo(-23, 1)
      expect(reading.shortTerm).toBeCloseTo(-23, 1)
      expect(reading.integrated).toBeCloseTo(-23, 1)
      expect(reading.elapsedSec).toBeCloseTo(5, 6)
      expect(reading.samplePeak[0]).toBeCloseTo(dbToGain(-23), 3)
      expect(gainToDb(reading.truePeak[1])).toBeCloseTo(-23, 1)
    }
  })

  it('tracks level: −33 dBFS reads −33 LUFS and a single-channel 0 dBFS tone reads −3.01', () => {
    const quiet = new LoudnessAnalyzer(48000)
    feed(quiet, 4, sine(997, dbToGain(-33)))
    expect(quiet.integrated).toBeCloseTo(-33, 1)

    const mono = new LoudnessAnalyzer(48000)
    feed(mono, 4, sine(997, 1, 0))
    expect(mono.shortTerm).toBeCloseTo(-3.01, 1)
  })

  it('is silent before any signal and after a reset', () => {
    const analyzer = new LoudnessAnalyzer(48000)
    const before = analyzer.read()
    expect(before.momentary).toBe(-Infinity)
    expect(before.shortTerm).toBe(-Infinity)
    expect(before.integrated).toBe(-Infinity)
    expect(before.samplePeak).toEqual([0, 0])
    expect(before.maxTruePeak).toBe(0)

    feed(analyzer, 2, sine(997, 0.5))
    expect(analyzer.integrated).toBeGreaterThan(-10)
    analyzer.reset()
    const after = analyzer.read()
    expect(after.integrated).toBe(-Infinity)
    expect(after.maxTruePeak).toBe(0)
    expect(after.elapsedSec).toBe(0)
  })

  // The three 400 ms blocks straddling a level change carry a mix of both
  // levels and pass the gates, as the spec intends; over the 20 s passages of
  // EBU Tech 3341 they move the result by ~0.03 LU.
  it('absolute gate: trailing digital silence does not pull the integrated value down', () => {
    const analyzer = new LoudnessAnalyzer(48000)
    feed(analyzer, 20, sine(997, dbToGain(-23)))
    feed(analyzer, 4, silence)
    expect(analyzer.integrated).toBeCloseTo(-23, 1)
    expect(analyzer.momentary).toBeLessThan(-100)
    expect(analyzer.shortTerm).toBeLessThan(-100)
  })

  it('relative gate: a −36 dBFS passage before a −23 dBFS one is gated out (3341 case 4)', () => {
    const analyzer = new LoudnessAnalyzer(48000)
    feed(analyzer, 5, sine(997, dbToGain(-36)))
    feed(analyzer, 20, sine(997, dbToGain(-23)))
    expect(analyzer.integrated).toBeCloseTo(-23, 1)
  })

  it('a passage within 10 LU counts toward the integrated value (power mean)', () => {
    const analyzer = new LoudnessAnalyzer(48000)
    feed(analyzer, 5, sine(997, dbToGain(-29)))
    feed(analyzer, 5, sine(997, dbToGain(-23)))
    const expected = 10 * Math.log10((10 ** -2.9 + 10 ** -2.3) / 2)
    expect(analyzer.integrated).toBeCloseTo(expected, 1)
  })

  it('momentary reacts within 400 ms while short-term averages 3 s', () => {
    const analyzer = new LoudnessAnalyzer(48000)
    feed(analyzer, 4, sine(997, dbToGain(-23)))
    feed(analyzer, 0.5, sine(997, dbToGain(-13)))
    expect(analyzer.momentary).toBeCloseTo(-13, 1)
    // 0.5 s of −13 in a 3 s window of otherwise −23: the mean power sits in between.
    const mixed = 10 * Math.log10((2.5 * 10 ** -2.3 + 0.5 * 10 ** -1.3) / 3)
    expect(analyzer.shortTerm).toBeCloseTo(mixed, 1)
  })

  it('measures the sample peak of a square exactly and a true peak above it', () => {
    const analyzer = new LoudnessAnalyzer(48000)
    const square = (t: number): [number, number] => {
      const v = Math.sin(2 * Math.PI * 1000 * t) >= 0 ? 0.5 : -0.5
      return [v, v]
    }
    feed(analyzer, 1, square)
    const reading = analyzer.read()
    expect(reading.samplePeak).toEqual([0.5, 0.5])
    // The interpolator's ringing on a hard edge: ~+2 dB over the sample peak.
    expect(reading.truePeak[0]).toBeGreaterThan(0.5)
    expect(reading.truePeak[0]).toBeLessThan(0.7)
    expect(reading.maxTruePeak).toBe(reading.truePeak[0])
  })

  it('peaks span one reading; maxTruePeak holds until reset', () => {
    const analyzer = new LoudnessAnalyzer(48000)
    feed(analyzer, 0.2, sine(440, 0.8, 0.2))
    const loud = analyzer.read()
    expect(loud.samplePeak[0]).toBeCloseTo(0.8, 3)
    expect(loud.samplePeak[1]).toBeCloseTo(0.2, 3)
    feed(analyzer, 0.2, sine(440, 0.1))
    const quiet = analyzer.read()
    expect(quiet.samplePeak[0]).toBeCloseTo(0.1, 3)
    expect(quiet.maxTruePeak).toBeGreaterThanOrEqual(0.8)
    expect(analyzer.read().samplePeak).toEqual([0, 0])
  })

  it('exposes the dB helpers used by hosts', () => {
    expect(gainToDb(1)).toBe(0)
    expect(gainToDb(0)).toBe(-Infinity)
    expect(gainToDb(dbToGain(-6))).toBeCloseTo(-6, 10)
    expect(loudnessFromMeanSquare(0)).toBe(-Infinity)
    expect(loudnessFromMeanSquare(1)).toBeCloseTo(-0.691, 10)
  })
})
