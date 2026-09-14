import { describe, expect, it } from 'vitest'

import { ParamLane, SMOOTH_SEGMENT_STEPS, laneEventsInRange, segmentValue } from '../ParamLane'

describe('ParamLane', () => {
  it('yields the default with no breakpoints and holds outside the first and last', () => {
    expect(new ParamLane({ defaultValue: 0.4 }).valueAt(3)).toBe(0.4)
    const lane = new ParamLane({
      breakpoints: [
        { timeSec: 1, value: 0.2 },
        { timeSec: 3, value: 0.8 },
      ],
    })
    expect(lane.valueAt(-5)).toBe(0.2)
    expect(lane.valueAt(1)).toBe(0.2)
    expect(lane.valueAt(3)).toBe(0.8)
    expect(lane.valueAt(99)).toBe(0.8)
  })

  it('interpolates linearly by default', () => {
    const lane = new ParamLane({
      breakpoints: [
        { timeSec: 0, value: 0 },
        { timeSec: 2, value: 1 },
      ],
    })
    expect(lane.valueAt(0.5)).toBeCloseTo(0.25, 12)
    expect(lane.valueAt(1)).toBeCloseTo(0.5, 12)
    expect(lane.valueAt(1.5)).toBeCloseTo(0.75, 12)
  })

  it('holds a step segment until the next breakpoint', () => {
    const lane = new ParamLane({
      breakpoints: [
        { timeSec: 0, value: 0, curve: 'step' },
        { timeSec: 2, value: 1 },
      ],
    })
    expect(lane.valueAt(1.999)).toBe(0)
    expect(lane.valueAt(2)).toBe(1)
  })

  it('follows exponentialRampToValueAtTime for an exponential segment', () => {
    const lane = new ParamLane({
      breakpoints: [
        { timeSec: 0, value: 100, curve: 'exponential' },
        { timeSec: 1, value: 1600 },
      ],
    })
    expect(lane.valueAt(0.5)).toBeCloseTo(400, 9)
    expect(lane.valueAt(0.25)).toBeCloseTo(200, 9)
  })

  it('degrades an exponential segment through zero to linear', () => {
    const lane = new ParamLane({
      breakpoints: [
        { timeSec: 0, value: 0, curve: 'exponential' },
        { timeSec: 1, value: 1 },
      ],
    })
    expect(lane.valueAt(0.5)).toBe(0.5)
    expect(laneEventsInRange(lane, 0, 2).map((event) => event.method)).toEqual([
      'setValueAtTime',
      'linearRampToValueAtTime',
    ])
  })

  it('eases a smooth segment along a half cosine', () => {
    const lane = new ParamLane({
      breakpoints: [
        { timeSec: 0, value: 0, curve: 'smooth' },
        { timeSec: 1, value: 1 },
      ],
    })
    expect(lane.valueAt(0.5)).toBeCloseTo(0.5, 12)
    expect(lane.valueAt(0.25)).toBeCloseTo((1 - Math.cos(Math.PI / 4)) / 2, 12)
    expect(lane.valueAt(0.1)).toBeLessThan(0.1)
    expect(lane.valueAt(0.9)).toBeGreaterThan(0.9)
  })

  it('renders an exact grid of values', () => {
    const lane = new ParamLane({
      breakpoints: [
        { timeSec: 0, value: 0 },
        { timeSec: 1, value: 1 },
      ],
    })
    const curve = lane.render(0, 1, 4)
    expect(Array.from(curve)).toEqual([0, 0.25, 0.5, 0.75])
    expect(lane.render(0, 0, 44100)).toHaveLength(0)
  })

  it('keeps breakpoints sorted, replaces one at the same time and clamps to the range', () => {
    const lane = new ParamLane({ min: 0, max: 1 })
    lane
      .add({ timeSec: 2, value: 0.5 })
      .add({ timeSec: 1, value: 4 })
      .add({ timeSec: 2, value: -1 })
    expect(lane.breakpoints).toEqual([
      { timeSec: 1, value: 1 },
      { timeSec: 2, value: 0 },
    ])
    lane.remove(1)
    expect(lane.breakpoints.map((point) => point.timeSec)).toEqual([2])
    lane.remove(42)
    expect(lane.breakpoints).toHaveLength(1)
  })

  it('bumps the version on every edit', () => {
    const lane = new ParamLane()
    expect(lane.version).toBe(0)
    lane.add({ timeSec: 0, value: 1 })
    lane.replace([{ timeSec: 0, value: 2 }])
    lane.clear()
    expect(lane.version).toBe(3)
    expect(lane.valueAt(0)).toBe(0)
  })

  it('rejects a non-finite time and swaps a non-finite value for the default', () => {
    const lane = new ParamLane({ defaultValue: 0.5 })
    expect(() => lane.add({ timeSec: Number.NaN, value: 1 })).toThrow(/finite/)
    lane.add({ timeSec: 0, value: Number.POSITIVE_INFINITY })
    expect(lane.breakpoints[0].value).toBe(0.5)
  })
})

describe('segmentValue', () => {
  it('returns the destination when the segment has no length', () => {
    expect(segmentValue({ timeSec: 1, value: 0 }, { timeSec: 1, value: 1 }, 1)).toBe(1)
  })
})

describe('laneEventsInRange', () => {
  const lane = new ParamLane({
    breakpoints: [
      { timeSec: 0, value: 0 },
      { timeSec: 1, value: 1, curve: 'step' },
      { timeSec: 2, value: 0.5, curve: 'exponential' },
      { timeSec: 3, value: 0.25, curve: 'smooth' },
      { timeSec: 4, value: 1 },
    ],
  })

  it('maps each segment curve to its AudioParam method', () => {
    expect(laneEventsInRange(lane, 0, 3)).toEqual([
      { timeSec: 0, value: 0, method: 'setValueAtTime' },
      { timeSec: 1, value: 1, method: 'linearRampToValueAtTime' },
      { timeSec: 2, value: 0.5, method: 'setValueAtTime' },
    ])
    expect(laneEventsInRange(lane, 2.5, 3.01)).toEqual([
      { timeSec: 3, value: 0.25, method: 'exponentialRampToValueAtTime' },
    ])
  })

  it('writes a smooth segment as linear sub-ramps that land exactly on the breakpoint', () => {
    const events = laneEventsInRange(lane, 3.5, 5)
    expect(events).toHaveLength(SMOOTH_SEGMENT_STEPS / 2 + 1)
    expect(events[0].timeSec).toBe(3.5)
    expect(events.every((event) => event.method === 'linearRampToValueAtTime')).toBe(true)
    const last = events[events.length - 1]
    expect(last).toEqual({ timeSec: 4, value: 1, method: 'linearRampToValueAtTime' })
    for (const event of events) expect(event.value).toBeCloseTo(lane.valueAt(event.timeSec), 12)
  })

  it('is half-open so consecutive windows never repeat an event', () => {
    const first = laneEventsInRange(lane, 0, 1)
    const second = laneEventsInRange(lane, 1, 2)
    expect(first.map((event) => event.timeSec)).toEqual([0])
    expect(second.map((event) => event.timeSec)).toEqual([1])
    expect(laneEventsInRange(lane, 2, 2)).toEqual([])
    expect(laneEventsInRange(lane, 10, 20)).toEqual([])
  })
})
