import { describe, expect, it } from 'vitest'

import { MockAudioParam } from '../../../testing'
import { ParamGlide, ParamRamper, holdParamAt } from '../scheduled-param'

function calls(param: MockAudioParam): [string, ...unknown[]][] {
  return param.events.map((event) => [event.method, ...event.args])
}

describe('holdParamAt', () => {
  it('uses cancelAndHoldAtTime when the param has it', () => {
    const param = new MockAudioParam()
    holdParamAt(param, 3, 0.4)
    expect(calls(param)).toEqual([['cancelAndHoldAtTime', 3]])
  })

  it('cancels and sets the caller’s value where cancelAndHoldAtTime is missing', () => {
    const param = new MockAudioParam()
    ;(param as { cancelAndHoldAtTime?: unknown }).cancelAndHoldAtTime = undefined
    holdParamAt(param, 3, 0.4)
    expect(calls(param)).toEqual([
      ['cancelScheduledValues', 3],
      ['setValueAtTime', 0.4, 3],
    ])
  })
})

describe('ParamRamper', () => {
  it('sets once, then ramps from the value it knows the param holds', () => {
    const param = new MockAudioParam()
    const ramper = new ParamRamper(param)
    expect(ramper.valueAt(0)).toBeUndefined()
    ramper.rampTo(0.5, 1, 0.1)
    expect(calls(param)).toEqual([['setValueAtTime', 0.5, 1]])
    ramper.rampTo(1, 2, 0.1)
    expect(calls(param).slice(1)).toEqual([
      ['setValueAtTime', 0.5, 2],
      ['linearRampToValueAtTime', 1, 2.1],
    ])
    expect(ramper.valueAt(2.05)).toBeCloseTo(0.75, 12)
    expect(ramper.valueAt(2.1)).toBe(1)
    expect(ramper.valueAt(5)).toBe(1)
  })

  it('writes a set instead of a zero-length ramp', () => {
    const param = new MockAudioParam()
    const ramper = new ParamRamper(param)
    ramper.set(0, 0)
    ramper.rampTo(1, 1, 0)
    expect(calls(param).slice(1)).toEqual([
      ['setValueAtTime', 0, 1],
      ['setValueAtTime', 1, 1],
    ])
  })

  it('forgets its segment on reset', () => {
    const param = new MockAudioParam()
    const ramper = new ParamRamper(param)
    ramper.rampTo(0.5, 1)
    ramper.reset()
    ramper.rampTo(0.9, 2)
    expect(calls(param).slice(-1)).toEqual([['setValueAtTime', 0.9, 2]])
  })
})

describe('ParamGlide', () => {
  it('glides from where the param rests through each point, a straight line in dB', () => {
    const param = new MockAudioParam()
    const glide = new ParamGlide(param, 1)
    expect(glide.valueAt(0)).toBe(1)
    glide.along(2, { value: 0.01, atSec: 2.1 }, { value: 1, atSec: 4.1 })
    expect(calls(param)).toEqual([
      ['setValueAtTime', 1, 2],
      ['exponentialRampToValueAtTime', 0.01, 2.1],
      ['exponentialRampToValueAtTime', 1, 4.1],
    ])
    // Halfway in time is halfway in dB.
    expect(glide.valueAt(2.05)).toBeCloseTo(0.1, 12)
    expect(glide.valueAt(3.1)).toBeCloseTo(0.1, 12)
    expect(glide.valueAt(1)).toBe(1)
    expect(glide.valueAt(9)).toBe(1)
    expect(glide.target).toBe(1)
    expect(glide.endSec).toBe(4.1)
  })

  it('holds a glide that is still running and goes on from where it is', () => {
    const param = new MockAudioParam()
    const glide = new ParamGlide(param, 1)
    glide.along(0, { value: 0.01, atSec: 0.1 })
    glide.along(0.05, { value: 1, atSec: 0.15 })
    expect(calls(param).slice(2)).toEqual([
      ['cancelAndHoldAtTime', 0.05],
      ['exponentialRampToValueAtTime', 1, 0.15],
    ])
    expect(glide.valueAt(0.05)).toBeCloseTo(0.1, 12)
    expect(glide.valueAt(0.1)).toBeCloseTo(10 ** -0.5, 12)
  })

  it('keeps two gains glided to reciprocal levels reciprocal all the way', () => {
    const down = new ParamGlide(new MockAudioParam(), 1)
    const up = new ParamGlide(new MockAudioParam(), 1)
    down.along(1, { value: 0.05, atSec: 1.04 }, { value: 1, atSec: 14 })
    up.along(1, { value: 20, atSec: 1.04 }, { value: 1, atSec: 14 })
    // Taken up again partway, to other levels.
    down.along(1.02, { value: 0.5, atSec: 1.06 }, { value: 1, atSec: 4 })
    up.along(1.02, { value: 2, atSec: 1.06 }, { value: 1, atSec: 4 })
    for (const at of [0, 1, 1.01, 1.02, 1.03, 1.05, 1.06, 2, 3.5, 4, 20]) {
      expect(down.valueAt(at) * up.valueAt(at)).toBeCloseTo(1, 12)
    }
  })

  it('gives every leg a length and keeps clear of zero', () => {
    const param = new MockAudioParam()
    const glide = new ParamGlide(param, 0)
    glide.along(1, { value: 0, atSec: 1 }, { value: 1, atSec: 0.5 })
    expect(calls(param).slice(0, 2)).toEqual([
      ['setValueAtTime', 1e-6, 1],
      ['exponentialRampToValueAtTime', 1e-6, 1.001],
    ])
    const [method, value, at] = calls(param)[2]
    expect([method, value]).toEqual(['exponentialRampToValueAtTime', 1])
    expect(at).toBeCloseTo(1.002, 9)
  })

  it('approaches silence with a time constant, and is settled six of them later', () => {
    const param = new MockAudioParam()
    const glide = new ParamGlide(param, 0.5)
    expect(glide.isSettled(0)).toBe(true)
    glide.approach(0, 1, 0.03)
    expect(calls(param)).toEqual([['setTargetAtTime', 0, 1, 0.03]])
    expect(glide.target).toBe(0)
    expect(glide.isSettled(1.1)).toBe(false)
    expect(glide.isSettled(1.18)).toBe(true)
    // A glide after an approach starts from wherever the browser has the param.
    glide.approach(0.5, 2, 0.03)
    glide.along(2.01, { value: 0.25, atSec: 2.05 })
    expect(calls(param).slice(2)).toEqual([
      ['cancelAndHoldAtTime', 2.01],
      ['exponentialRampToValueAtTime', 0.25, 2.05],
    ])
    expect(glide.isSettled(2.01)).toBe(true)
  })

  it('an approach holds a glide that is still running', () => {
    const param = new MockAudioParam()
    const glide = new ParamGlide(param, 1)
    glide.along(0, { value: 0.5, atSec: 0.04 })
    glide.approach(0, 0.02, 0.03)
    expect(calls(param).slice(2)).toEqual([
      ['cancelAndHoldAtTime', 0.02],
      ['setTargetAtTime', 0, 0.02, 0.03],
    ])
  })
})
