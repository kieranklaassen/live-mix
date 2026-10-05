import { describe, expect, it } from 'vitest'

import { MockAudioParam } from '../../../testing'
import {
  EQUAL_POWER_CURVE_LENGTH,
  equalPowerFadeIn,
  equalPowerFadeOut,
  writeEqualPowerEnvelope,
  writeEqualPowerFadeOut,
} from '../curves'
import { strictCurves } from './strict-curves'

// Breathwork Live's originals (musicEngine.ts, CURVE_LENGTH = 64), kept
// verbatim so the port is checked sample-for-sample, not just by shape.
const ORIGINAL_CURVE_LENGTH = 64

function originalFadeIn(): Float32Array {
  const curve = new Float32Array(ORIGINAL_CURVE_LENGTH)
  for (let i = 0; i < ORIGINAL_CURVE_LENGTH; i += 1) {
    curve[i] = Math.sin(((i / (ORIGINAL_CURVE_LENGTH - 1)) * Math.PI) / 2)
  }
  return curve
}

function originalFadeOut(): Float32Array {
  const curve = new Float32Array(ORIGINAL_CURVE_LENGTH)
  for (let i = 0; i < ORIGINAL_CURVE_LENGTH; i += 1) {
    curve[i] = Math.cos(((i / (ORIGINAL_CURVE_LENGTH - 1)) * Math.PI) / 2)
  }
  return curve
}

describe('equal-power curves', () => {
  it('default to the 64-sample length Breathwork Live schedules', () => {
    expect(EQUAL_POWER_CURVE_LENGTH).toBe(64)
    expect(equalPowerFadeIn()).toHaveLength(64)
    expect(equalPowerFadeOut()).toHaveLength(64)
  })

  it('reproduce the original curves sample for sample', () => {
    expect(equalPowerFadeIn()).toEqual(originalFadeIn())
    expect(equalPowerFadeOut()).toEqual(originalFadeOut())
  })

  it('run from 0 to 1 and from 1 to 0', () => {
    const fadeIn = equalPowerFadeIn()
    const fadeOut = equalPowerFadeOut()
    expect(fadeIn[0]).toBe(0)
    expect(fadeIn[fadeIn.length - 1]).toBeCloseTo(1, 6)
    expect(fadeOut[0]).toBe(1)
    expect(fadeOut[fadeOut.length - 1]).toBeCloseTo(0, 6)
  })

  it('sum to constant power at every sample', () => {
    const fadeIn = equalPowerFadeIn()
    const fadeOut = equalPowerFadeOut()
    for (let i = 0; i < fadeIn.length; i += 1) {
      expect(fadeIn[i] ** 2 + fadeOut[i] ** 2).toBeCloseTo(1, 6)
    }
  })

  // The assertions musicEngine.test.ts makes on the curves it records.
  it('satisfy the crossfade shape Breathwork Live asserts on', () => {
    const outCurve = equalPowerFadeOut()
    const inCurve = equalPowerFadeIn()
    expect(outCurve[0]).toBeCloseTo(1)
    expect(outCurve[outCurve.length - 1]).toBeCloseTo(0)
    expect(inCurve[0]).toBeCloseTo(0)
    expect(inCurve[inCurve.length - 1]).toBeCloseTo(1)
    const mid = Math.floor(outCurve.length / 2)
    expect(outCurve[mid] ** 2 + inCurve[mid] ** 2).toBeCloseTo(1, 1)
  })

  it('rise and fall monotonically', () => {
    const fadeIn = equalPowerFadeIn()
    const fadeOut = equalPowerFadeOut()
    for (let i = 1; i < fadeIn.length; i += 1) {
      expect(fadeIn[i]).toBeGreaterThan(fadeIn[i - 1])
      expect(fadeOut[i]).toBeLessThan(fadeOut[i - 1])
    }
  })

  it('accept another length and keep the endpoints', () => {
    const fadeIn = equalPowerFadeIn(9)
    const fadeOut = equalPowerFadeOut(9)
    expect(fadeIn).toHaveLength(9)
    expect(fadeIn[0]).toBe(0)
    expect(fadeIn[8]).toBeCloseTo(1, 6)
    expect(fadeOut[0]).toBe(1)
    expect(fadeOut[8]).toBeCloseTo(0, 6)
    expect(fadeIn[4]).toBeCloseTo(Math.SQRT1_2, 6)
    expect(fadeOut[4]).toBeCloseTo(Math.SQRT1_2, 6)
  })
})

describe('writeEqualPowerEnvelope', () => {
  /** The envelope's events under a stand-in that refuses what a browser refuses of a curve. */
  function written(startAt: number, durationSec: number, fadeInSec: number, fadeOutSec: number) {
    const restore = strictCurves()
    try {
      const param = new MockAudioParam()
      writeEqualPowerEnvelope(
        param as unknown as AudioParam,
        startAt,
        durationSec,
        fadeInSec,
        fadeOutSec,
      )
      return param.events
    } finally {
      restore()
    }
  }

  it('writes the scheduleEntry events when both fades have a length and fit in the clip', () => {
    expect(written(2, 10, 3, 4)).toEqual([
      { method: 'setValueAtTime', args: [0, 2] },
      { method: 'setValueCurveAtTime', args: [equalPowerFadeIn(), 2, 3] },
      { method: 'setValueCurveAtTime', args: [equalPowerFadeOut(), 2 + 10 - 4, 4] },
    ])
  })

  it('writes no curve of no length: full level from the start, and to the end', () => {
    expect(written(2, 10, 0, 4).map((e) => e.method)).toEqual([
      'setValueAtTime',
      'setValueCurveAtTime',
    ])
    expect(written(2, 10, 0, 4)[0].args).toEqual([1, 2])
    expect(written(2, 10, 3, 0).map((e) => e.method)).toEqual([
      'setValueAtTime',
      'setValueCurveAtTime',
    ])
    expect(written(2, 10, 0, 0)).toEqual([{ method: 'setValueAtTime', args: [1, 2] }])
  })

  it('lays no curve over another: fades that fill the clip meet, and longer ones share it', () => {
    // 5.91 + 2.88 - 1.12 falls a hair short of 5.91 + 1.76: written as they come, the two would overlap.
    const meeting = written(5.91, 2.88, 1.76, 1.12)
    expect(meeting[2].args[1]).toBe(5.91 + 1.76)
    expect(written(0, 3, 2, 2).map((e) => e.args.slice(1))).toEqual([[0], [0, 2], [2, 1]])
    // A fade-in as long as the clip, or longer, leaves no room for a fade-out.
    expect(written(0, 3, 5, 2).map((e) => e.args.slice(1))).toEqual([[0], [0, 3]])
  })

  it('a fade-out over no time is a cut', () => {
    const restore = strictCurves()
    try {
      const param = new MockAudioParam()
      writeEqualPowerFadeOut(param as unknown as AudioParam, 4, 0)
      writeEqualPowerFadeOut(param as unknown as AudioParam, 5, 0.5)
      expect(param.events).toEqual([
        { method: 'setValueAtTime', args: [0, 4] },
        { method: 'setValueCurveAtTime', args: [equalPowerFadeOut(), 5, 0.5] },
      ])
    } finally {
      restore()
    }
  })
})
