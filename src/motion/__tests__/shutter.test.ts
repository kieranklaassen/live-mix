import { describe, expect, it } from 'vitest'

import { DEFAULT_SAMPLES, DEFAULT_SHUTTER, shutterTimes } from '../shutter'

describe('the moments of a frame that motion blur samples', () => {
  it('defaults to a 180 degree shutter and 8 samples', () => {
    expect(DEFAULT_SHUTTER).toBe(0.5)
    expect(DEFAULT_SAMPLES).toBe(8)
  })

  it('are centred on the frame’s time, evenly spaced, inside the shutter', () => {
    const frame = 1 / 60
    const times = shutterTimes(2, { samples: 8, shutter: 0.5, frameDuration: frame })

    expect(times).toHaveLength(8)
    expect(times.reduce((sum, time) => sum + time, 0) / 8).toBeCloseTo(2, 12)
    for (let index = 1; index < 8; index += 1)
      expect(times[index] - times[index - 1]).toBeCloseTo((0.5 * frame) / 8, 12)
    expect(Math.min(...times)).toBeGreaterThan(2 - frame / 4)
    expect(Math.max(...times)).toBeLessThan(2 + frame / 4)
  })

  it('is the frame’s own time for one sample, or for a closed shutter', () => {
    expect(shutterTimes(2, { samples: 1, shutter: 0.5, frameDuration: 1 / 60 })).toEqual([2])
    expect(shutterTimes(2, { samples: 4, shutter: 0, frameDuration: 1 / 60 })).toEqual([2])
  })

  it('spans the whole frame for a 360 degree shutter', () => {
    const times = shutterTimes(1, { samples: 2, shutter: 1, frameDuration: 0.1 })

    expect(times[0]).toBeCloseTo(0.975, 12)
    expect(times[1]).toBeCloseTo(1.025, 12)
  })
})
