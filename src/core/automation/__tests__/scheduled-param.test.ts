import { describe, expect, it } from 'vitest'

import { MockAudioParam } from '../../../testing'
import { ParamRamper, holdParamAt } from '../scheduled-param'

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
