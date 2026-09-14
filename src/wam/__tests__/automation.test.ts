import { describe, expect, it } from 'vitest'

import { LaneWriter } from '../../core/automation/LaneWriter'
import { ParamLane } from '../../core/automation/ParamLane'
import { asAudioContext, createMockContext } from '../../testing'
import { WAM_AUTOMATION_STEP_SECONDS, wamDeviceParam } from '../automation'
import { WamDevice } from '../WamDevice'
import { FAKE_EFFECT_CONFIG, defineFakeWam } from './fake-wam'

async function make() {
  const Effect = defineFakeWam(FAKE_EFFECT_CONFIG)
  const ctx = createMockContext({ currentTime: 10 })
  const device = await WamDevice.create(asAudioContext(ctx), Effect, {
    host: { groupId: 'g', groupKey: 'k' },
  })
  const instance = Effect.instances[0]
  const events = () =>
    instance.node.scheduledEvents.map((event) =>
      event.type === 'wam-automation' ? [event.data.id, event.data.value, event.time] : event.type,
    )
  return { device, ctx, instance, events }
}

describe('wamDeviceParam', () => {
  it('refuses unknown params', async () => {
    const { device } = await make()
    expect(() => wamDeviceParam(device, 'nope')).toThrow(/no parameter "nope"/)
    device.dispose()
  })

  it('writes setValueAtTime as one automation event, clamped', async () => {
    const { device, events } = await make()
    const param = wamDeviceParam(device, 'gain')
    param.setValueAtTime(-6, 11)
    param.setValueAtTime(100, 12)
    expect(events()).toEqual([
      ['gain', -6, 11],
      ['gain', 24, 12],
    ])
    device.dispose()
  })

  it('breaks a linear ramp into evenly spaced points from the previous event', async () => {
    const { device, events } = await make()
    const param = wamDeviceParam(device, 'gain', { stepSec: 0.25 })
    param.setValueAtTime(0, 10)
    param.linearRampToValueAtTime(4, 11)
    expect(events()).toEqual([
      ['gain', 0, 10],
      ['gain', 1, 10.25],
      ['gain', 2, 10.5],
      ['gain', 3, 10.75],
      ['gain', 4, 11],
    ])
    device.dispose()
  })

  it('anchors a ramp with no previous event at the mirrored value now', async () => {
    const { device, events } = await make()
    device.setParam('gain', 12)
    const param = wamDeviceParam(device, 'gain', { stepSec: 0.5 })
    param.linearRampToValueAtTime(0, 11)
    expect(events()).toEqual([
      ['gain', 6, 10.5],
      ['gain', 0, 11],
    ])
    device.dispose()
  })

  it('uses the default step and one point for a zero-length ramp', async () => {
    const { device, events } = await make()
    const param = wamDeviceParam(device, 'cutoff')
    param.setValueAtTime(1000, 10)
    param.linearRampToValueAtTime(2000, 10.1)
    expect(events()).toHaveLength(1 + Math.ceil(0.1 / WAM_AUTOMATION_STEP_SECONDS))
    param.linearRampToValueAtTime(3000, 10.1)
    expect(events().at(-1)).toEqual(['cutoff', 3000, 10.1])
    device.dispose()
  })

  it('interpolates an exponential ramp geometrically and falls back to linear through zero', async () => {
    const { device, events } = await make()
    const param = wamDeviceParam(device, 'cutoff', { stepSec: 0.5 })
    param.setValueAtTime(100, 10)
    param.exponentialRampToValueAtTime(10000, 11)
    expect(events()).toEqual([
      ['cutoff', 100, 10],
      ['cutoff', 1000, 10.5],
      ['cutoff', 10000, 11],
    ])
    const gain = wamDeviceParam(device, 'gain', { stepSec: 0.5 })
    gain.setValueAtTime(-12, 11)
    gain.exponentialRampToValueAtTime(12, 12)
    expect(events().slice(3)).toEqual([
      ['gain', -12, 11],
      ['gain', 0, 11.5],
      ['gain', 12, 12],
    ])
    device.dispose()
  })

  it('writes setTargetAtTime as an exponential approach that arrives after five time constants', async () => {
    const { device, events } = await make()
    const param = wamDeviceParam(device, 'gain', { stepSec: 0.5 })
    param.setValueAtTime(10, 10)
    param.setTargetAtTime(0, 10, 0.2)
    const points = events().slice(1) as [string, number, number][]
    expect(points.at(-1)).toEqual(['gain', 0, 11])
    expect(points[0][1]).toBeCloseTo(10 * Math.exp(-0.5 / 0.2), 9)
    for (let i = 1; i < points.length; i += 1) expect(points[i][1]).toBeLessThan(points[i - 1][1])
    param.setTargetAtTime(5, 11, 0)
    expect(events().at(-1)).toEqual(['gain', 5, 11])
    device.dispose()
  })

  it('cancel clears the plugin queue and forgets points at or after the cancel time', async () => {
    const { device, instance, events } = await make()
    const param = wamDeviceParam(device, 'gain', { stepSec: 1 })
    param.setValueAtTime(0, 10)
    param.linearRampToValueAtTime(10, 12)
    param.cancelAndHoldAtTime?.(11.5)
    expect(instance.node.clearEventsCalls.count).toBe(1)
    expect(events()).toEqual([])
    param.linearRampToValueAtTime(2, 13)
    expect(events()).toEqual([
      ['gain', 1, 12.25],
      ['gain', 2, 13],
    ])
    param.cancelScheduledValues(20)
    expect(instance.node.clearEventsCalls.count).toBe(2)
    param.linearRampToValueAtTime(4, 14)
    expect(events()).toEqual([['gain', 4, 14]])
    device.dispose()
  })

  it('lets a LaneWriter drive a WAM parameter ahead of the playhead', async () => {
    const { device, events } = await make()
    const lane = new ParamLane({
      breakpoints: [
        { timeSec: 0, value: 0, curve: 'linear' },
        { timeSec: 2, value: 24 },
      ],
    })
    const writer = new LaneWriter(lane, wamDeviceParam(device, 'gain', { stepSec: 0.5 }))
    writer.tick({ playheadSec: 0, lookaheadSec: 3, contextTimeSec: 10 })
    const written = events() as [string, number, number][]
    expect(written[0]).toEqual(['gain', 0, 10])
    expect(written.at(-1)).toEqual(['gain', 24, 12])
    expect(written.map(([, value]) => value)).toEqual([0, 6, 12, 18, 24])
    writer.override(10.4)
    device.dispose()
  })
})
