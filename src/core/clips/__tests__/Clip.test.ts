import { describe, expect, it } from 'vitest'

import {
  type Clip,
  clipsInWindow,
  computePeaks,
  equalPowerFadeIn,
  fadeGain,
  slicePeaks,
} from '../index'

const clip: Clip = {
  id: 'intro',
  sourceId: 'a',
  startSec: 12,
  offsetSec: 5,
  durationSec: 5,
  fadeInSec: 2.5,
  fadeOutSec: 2.5,
  fadeCurve: 'equalPower',
  gainDb: -3.2,
}

describe('Clip', () => {
  it('feeds the window directly', () => {
    const scheduled = clipsInWindow({
      clips: [clip],
      playheadSec: 11.9,
      lookaheadSec: 0.2,
      iteration: 0,
      loopEnabled: false,
      loopLengthSec: 32,
    })
    expect(scheduled).toHaveLength(1)
    expect(scheduled[0].clipId).toBe('intro')
    expect(scheduled[0].iteration).toBe(0)
    expect(scheduled[0].startsInSec).toBeCloseTo(0.1, 5)
  })

  it('draws the slice it plays', () => {
    const ramp = Float32Array.from({ length: 1000 }, (_, i) => i / 999)
    const peaks = computePeaks([ramp], 1000, 100)
    const sliced = slicePeaks(peaks, clip.offsetSec, clip.durationSec, 10)
    expect(sliced.min).toHaveLength(50)
    expect(sliced.max[0]).toBeCloseTo(peaks.max[50], 5)
  })

  it('carries either fade law', () => {
    const linear: Clip = { ...clip, fadeCurve: 'linear' }
    expect(fadeGain(1.25, linear.durationSec, linear.fadeInSec, linear.fadeOutSec)).toBeCloseTo(
      0.5,
      5,
    )
    expect(clip.fadeCurve).toBe('equalPower')
    expect(equalPowerFadeIn()[63]).toBeCloseTo(1, 6)
  })

  it('leaves loop optional and off by default', () => {
    expect(clip.loop).toBeUndefined()
    const looping: Clip = { ...clip, loop: true }
    expect(looping.loop).toBe(true)
  })
})
