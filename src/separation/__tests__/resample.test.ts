import { describe, expect, it } from 'vitest'

import { resample, resampledLength } from '../resample'
import { differenceDb, sine } from './support'

describe('resampling to a stated length', () => {
  it('keeps a 1 kHz sine a 1 kHz sine from 48 kHz to 44.1 kHz', () => {
    const out = resample(sine(48000, 1000, 48000), 48000, 44100, 44100)
    expect(out.length).toBe(44100)
    // Away from the ends, where the kernel has frames on both sides.
    expect(differenceDb(out, sine(44100, 1000, 44100), 200, 43900)).toBeLessThan(-70)
  })

  it('goes down and back to exactly the length it had, and to itself away from the ends', () => {
    for (const length of [48000, 48001, 47999, 50003, 12345]) {
      const x = sine(length, 440, 48000, 0.4).map(
        (value, i) => value + 0.3 * Math.sin((2 * Math.PI * 9000 * i) / 48000),
      )
      const down = resample(x, 48000, 44100, resampledLength(length, 48000, 44100))
      const back = resample(down, 44100, 48000, length)
      expect(back.length).toBe(length)
      expect(differenceDb(x, back, 400, length - 400)).toBeLessThan(-60)
    }
  })

  it('rounds the length a track has at another rate', () => {
    expect(resampledLength(48000, 48000, 44100)).toBe(44100)
    expect(resampledLength(48001, 48000, 44100)).toBe(44101)
    expect(resampledLength(1, 48000, 8000)).toBe(1)
  })

  it('returns the array it was given when the rates are equal', () => {
    const x = sine(1000, 440, 44100)
    expect(resample(x, 44100, 44100, 1000)).toBe(x)
  })

  it('keeps a level that stands still', () => {
    const out = resample(new Float32Array(4000).fill(0.5), 44100, 48000, 4354)
    for (let i = 300; i < 4000; i += 1) expect(out[i]).toBeCloseTo(0.5, 6)
  })

  it('refuses a length of zero, a rate of zero and a rate that is no whole number', () => {
    const x = sine(1000, 440, 44100)
    expect(() => resample(x, 44100, 48000, 0)).toThrow(/length/)
    expect(() => resample(x, 0, 48000, 100)).toThrow(/rate/)
    expect(() => resample(x, 44100, 0, 100)).toThrow(/rate/)
    expect(() => resample(x, 44100.5, 48000, 100)).toThrow(/rate/)
  })
})
