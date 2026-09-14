import { describe, expect, it } from 'vitest'

import { EQUAL_POWER_CURVE_LENGTH, equalPowerFadeIn, equalPowerFadeOut } from '../curves'

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
