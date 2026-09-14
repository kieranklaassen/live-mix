import { describe, expect, it } from 'vitest'

import { type MockAudioParam, asAudioContext, createMockContext } from '../../../testing'
import { createCompressor } from '../../devices/native/Compressor'
import { createDelay } from '../../devices/native/Delay'
import { createFilter } from '../../devices/native/Filter'
import { dbToGain } from '../../devices/native/units'
import { LaneWriter } from '../LaneWriter'
import { nodeDeviceParam } from '../node-device-param'
import { ParamLane } from '../ParamLane'

function calls(param: MockAudioParam): [string, ...unknown[]][] {
  return param.events.map((event) => [event.method, ...event.args])
}

describe('nodeDeviceParam', () => {
  it('lets a LaneWriter schedule ahead on the filter’s own AudioParam, leaving setParam alone', () => {
    const ctx = createMockContext()
    const filter = createFilter(asAudioContext(ctx), { params: { frequency: 400 } })
    const frequency = ctx.filters[0].frequency
    const lane = new ParamLane({
      min: 20,
      max: 20000,
      breakpoints: [
        { timeSec: 0, value: 400, curve: 'exponential' },
        { timeSec: 4, value: 1100 },
      ],
    })
    const writer = new LaneWriter(lane, nodeDeviceParam(filter, 'frequency'))
    writer.tick({ playheadSec: 0, lookaheadSec: 5, contextTimeSec: 10 })

    expect(calls(frequency)).toEqual([
      ['setValueAtTime', 400, 10],
      ['exponentialRampToValueAtTime', 1100, 14],
    ])
    expect(filter.getParam('frequency')).toBe(400)

    // A live change still holds at now and ramps, wiping what was scheduled.
    ctx.currentTime = 11
    writer.override(11)
    filter.setParam('frequency', 800)
    expect(calls(frequency).slice(2)).toEqual([
      ['cancelAndHoldAtTime', 11],
      ['cancelAndHoldAtTime', 11],
      ['linearRampToValueAtTime', 800, 11.005],
    ])
    expect(filter.getParam('frequency')).toBe(800)
  })

  it('converts units at the scheduled time and clamps to the spec', () => {
    const ctx = createMockContext()
    const compressor = createCompressor(asAudioContext(ctx))
    const makeup = nodeDeviceParam(compressor, 'makeupDb')
    makeup.linearRampToValueAtTime(6, 3)
    makeup.setValueAtTime(999, 4)
    const gain = ctx.gains.find((node) => node.gain.events.length > 0)
    if (!gain) throw new Error('no gain node was written')
    const [ramp, set] = calls(gain.gain)
    expect(ramp).toEqual(['linearRampToValueAtTime', dbToGain(6), 3])
    expect(set[0]).toBe('setValueAtTime')
    expect(set[1]).toBe(dbToGain(compressor.params.makeupDb.max))
  })

  it('fans out to every AudioParam the applier drives and cancels them all', () => {
    const ctx = createMockContext()
    const delay = createDelay(asAudioContext(ctx), { params: { mix: 0.3 } })
    const mix = nodeDeviceParam(delay, 'mix')
    mix.linearRampToValueAtTime(1, 2)
    const driven = ctx.gains.filter((node) => node.gain.events.length > 0)
    expect(driven).toHaveLength(2)
    expect(driven.map((node) => node.gain.events[0].args)).toEqual([
      [0, 2],
      [1, 2],
    ])
    mix.cancelScheduledValues(1.5)
    mix.cancelAndHoldAtTime?.(1.6)
    for (const node of driven) {
      expect(calls(node.gain).slice(1)).toEqual([
        ['cancelScheduledValues', 1.5],
        ['cancelAndHoldAtTime', 1.6],
      ])
    }
  })

  it('rejects an unknown parameter', () => {
    const ctx = createMockContext()
    const filter = createFilter(asAudioContext(ctx))
    expect(() => nodeDeviceParam(filter, 'cutoff' as 'frequency')).toThrow(/no parameter/)
  })
})
