import { describe, expect, it } from 'vitest'

import { MockAudioParam, createMockContext } from '../../../testing'
import { Transport } from '../../transport'
import { LaneWriter, laneWindowFrom } from '../LaneWriter'
import { ParamLane } from '../ParamLane'

// A 0 → 1 → 0 swell over four seconds, the breath guide's gain lane in miniature.
function swell(): ParamLane {
  return new ParamLane({
    breakpoints: [
      { timeSec: 0, value: 0 },
      { timeSec: 2, value: 1 },
      { timeSec: 4, value: 0 },
    ],
  })
}

function calls(param: MockAudioParam): [string, ...unknown[]][] {
  return param.events.map((event) => [event.method, ...event.args])
}

/** `calls` with numbers rounded to 9 places, for times the transport derives in float math. */
function rounded(param: MockAudioParam): [string, ...unknown[]][] {
  return calls(param).map(
    ([method, ...args]) =>
      [method, ...args.map((arg) => (typeof arg === 'number' ? Number(arg.toFixed(9)) : arg))] as [
        string,
        ...unknown[],
      ],
  )
}

/** A param without `cancelAndHoldAtTime`, as Firefox ships it. */
function firefoxParam(): MockAudioParam {
  const param = new MockAudioParam()
  ;(param as { cancelAndHoldAtTime?: unknown }).cancelAndHoldAtTime = undefined
  return param
}

describe('LaneWriter', () => {
  it('anchors at the playhead on the first tick and writes the ramps inside the lookahead', () => {
    const param = new MockAudioParam()
    const writer = new LaneWriter(swell(), param)
    writer.tick({ playheadSec: 1, lookaheadSec: 2, contextTimeSec: 10 })

    expect(calls(param)).toEqual([
      ['setValueAtTime', 0.5, 10],
      ['linearRampToValueAtTime', 1, 11],
    ])
    expect(writer.writtenUntilSec).toBe(3)
  })

  it('writes every ramp exactly once across overlapping windows', () => {
    const param = new MockAudioParam()
    const writer = new LaneWriter(swell(), param)
    for (let step = 0; step <= 40; step += 1) {
      const playheadSec = step * 0.1
      writer.tick({ playheadSec, lookaheadSec: 2, contextTimeSec: 100 + playheadSec })
    }
    expect(param.eventsFor('linearRampToValueAtTime')).toHaveLength(2)
    expect(calls(param)).toEqual([
      ['setValueAtTime', 0, 100],
      ['linearRampToValueAtTime', 1, 102],
      ['linearRampToValueAtTime', 0, 104],
    ])
  })

  it('does nothing while the lookahead has not moved past what is written', () => {
    const param = new MockAudioParam()
    const writer = new LaneWriter(swell(), param)
    writer.tick({ playheadSec: 0, lookaheadSec: 5, contextTimeSec: 0 })
    const written = param.events.length
    writer.tick({ playheadSec: 0.05, lookaheadSec: 5, contextTimeSec: 0.05 })
    expect(param.events).toHaveLength(written)
  })

  it('yields to a live override with cancel-and-hold and stops writing until released', () => {
    const param = new MockAudioParam()
    const writer = new LaneWriter(swell(), param, { joinRampSec: 0.05 })
    writer.tick({ playheadSec: 0, lookaheadSec: 1, contextTimeSec: 100 })

    writer.override(100.5)
    expect(writer.isOverridden).toBe(true)
    expect(param.lastEvent('cancelAndHoldAtTime')).toEqual({
      method: 'cancelAndHoldAtTime',
      args: [100.5],
    })
    const afterOverride = param.events.length
    writer.tick({ playheadSec: 1, lookaheadSec: 2, contextTimeSec: 101 })
    writer.tick({ playheadSec: 2, lookaheadSec: 2, contextTimeSec: 102 })
    expect(param.events).toHaveLength(afterOverride)

    writer.release()
    expect(writer.isOverridden).toBe(false)
    writer.tick({ playheadSec: 3, lookaheadSec: 2, contextTimeSec: 103 })
    const rejoin = calls(param).slice(afterOverride)
    expect(rejoin[0]).toEqual(['cancelAndHoldAtTime', 103])
    expect(rejoin[1][0]).toBe('linearRampToValueAtTime')
    expect(rejoin[1][1]).toBeCloseTo(0.475, 12)
    expect(rejoin[1][2]).toBeCloseTo(103.05, 12)
    expect(rejoin[2]).toEqual(['linearRampToValueAtTime', 0, 104])
  })

  it('falls back to cancel + set when cancelAndHoldAtTime is missing', () => {
    const param = firefoxParam()
    const writer = new LaneWriter(swell(), param)
    writer.tick({ playheadSec: 0, lookaheadSec: 1, contextTimeSec: 100 })
    writer.override(101)
    expect(calls(param).slice(-2)).toEqual([
      ['cancelScheduledValues', 101],
      ['setValueAtTime', 0.5, 101],
    ])
  })

  it('re-plans with a ramp when the lane is edited under playback', () => {
    const param = new MockAudioParam()
    const lane = swell()
    const writer = new LaneWriter(lane, param, { joinRampSec: 0.05 })
    writer.tick({ playheadSec: 0, lookaheadSec: 5, contextTimeSec: 0 })
    const before = param.events.length

    lane.replace([
      { timeSec: 0, value: 1 },
      { timeSec: 4, value: 0 },
    ])
    writer.tick({ playheadSec: 1, lookaheadSec: 5, contextTimeSec: 1 })
    const replan = calls(param).slice(before)
    expect(replan[0]).toEqual(['cancelAndHoldAtTime', 1])
    expect(replan[1][0]).toBe('linearRampToValueAtTime')
    expect(replan[1][1]).toBeCloseTo(lane.valueAt(1.05), 12)
    expect(replan[1][2]).toBeCloseTo(1.05, 12)
    expect(replan[2]).toEqual(['linearRampToValueAtTime', 0, 4])
  })

  it('treats a changed timeline-to-context offset as a seek and rejoins', () => {
    const param = new MockAudioParam()
    const writer = new LaneWriter(swell(), param, { joinRampSec: 0.05 })
    writer.tick({ playheadSec: 0, lookaheadSec: 2, contextTimeSec: 10 })
    const before = param.events.length

    // Seek to 3 s while the context clock is at 11.
    writer.tick({ playheadSec: 3, lookaheadSec: 2, contextTimeSec: 11 })
    const seek = calls(param).slice(before)
    expect(seek[0]).toEqual(['cancelAndHoldAtTime', 11])
    expect(seek[1][1]).toBeCloseTo(0.475, 12)
    expect(seek[1][2]).toBeCloseTo(11.05, 12)
    expect(seek[2]).toEqual(['linearRampToValueAtTime', 0, 12])
  })

  it('catches up with a ramp after a stall instead of replaying', () => {
    const param = new MockAudioParam()
    const writer = new LaneWriter(swell(), param, { joinRampSec: 0.05 })
    writer.tick({ playheadSec: 0, lookaheadSec: 0.5, contextTimeSec: 0 })
    const before = param.events.length

    // Timers throttled: the next tick lands past everything written.
    writer.tick({ playheadSec: 3, lookaheadSec: 0.5, contextTimeSec: 3 })
    const catchUp = calls(param).slice(before)
    expect(catchUp[0]).toEqual(['cancelAndHoldAtTime', 3])
    expect(catchUp[1][1]).toBeCloseTo(0.475, 12)
    expect(writer.writtenUntilSec).toBe(3.5)
  })

  it('snaps instead of ramping when joinRampSec is 0', () => {
    const param = new MockAudioParam()
    const writer = new LaneWriter(swell(), param, { joinRampSec: 0 })
    writer.tick({ playheadSec: 0, lookaheadSec: 1, contextTimeSec: 0 })
    writer.override(0.5)
    writer.release()
    writer.tick({ playheadSec: 1, lookaheadSec: 1, contextTimeSec: 1 })
    expect(calls(param).slice(-2)).toEqual([
      ['cancelAndHoldAtTime', 1],
      ['setValueAtTime', 0.5, 1],
    ])
  })

  it('starts over after reset', () => {
    const param = new MockAudioParam()
    const writer = new LaneWriter(swell(), param)
    writer.tick({ playheadSec: 0, lookaheadSec: 5, contextTimeSec: 0 })
    writer.reset()
    expect(writer.writtenUntilSec).toBeNull()
    writer.tick({ playheadSec: 2, lookaheadSec: 1, contextTimeSec: 50 })
    expect(calls(param).slice(-1)).toEqual([['setValueAtTime', 1, 50]])
  })

  it('reproduces the breath guide’s cycle automation from a gain lane and a filter lane', () => {
    // breathGuide.scheduleCycle: gain 0 → 0.12 over the inhale, → 0 over the
    // exhale; filter 400 Hz → 1100 Hz → 400 Hz on the same times. Cycle S1:
    // inhale 4 s, exhale 6 s, written 2 s ahead on a 100 ms tick.
    const ctx = createMockContext()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    const at = 12.5
    const gainLane = new ParamLane({
      breakpoints: [
        { timeSec: at, value: 0 },
        { timeSec: at + 4, value: 0.12 },
        { timeSec: at + 10, value: 0 },
      ],
    })
    const filterLane = new ParamLane({
      breakpoints: [
        { timeSec: at, value: 400 },
        { timeSec: at + 4, value: 1100 },
        { timeSec: at + 10, value: 400 },
      ],
    })
    const writers = [
      new LaneWriter(gainLane, gain.gain),
      new LaneWriter(filterLane, filter.frequency),
    ]
    for (let step = 0; step <= 110; step += 1) {
      const now = 11 + step * 0.1
      for (const writer of writers) {
        writer.tick({ playheadSec: now, lookaheadSec: 2, contextTimeSec: now })
      }
    }
    expect(calls(gain.gain)).toEqual([
      ['setValueAtTime', 0, 11],
      ['setValueAtTime', 0, at],
      ['linearRampToValueAtTime', 0.12, at + 4],
      ['linearRampToValueAtTime', 0, at + 10],
    ])
    expect(calls(filter.frequency)).toEqual([
      ['setValueAtTime', 400, 11],
      ['setValueAtTime', 400, at],
      ['linearRampToValueAtTime', 1100, at + 4],
      ['linearRampToValueAtTime', 400, at + 10],
    ])
    // The picture follows the same formula as the sound (R33).
    expect(gainLane.valueAt(at + 2)).toBeCloseTo(0.06, 12)
    expect(filterLane.valueAt(at + 7)).toBeCloseTo(750, 12)
  })

  describe('with the Transport', () => {
    it('builds each tick’s window from the transport, wraps with its pass numbers and rejoins on seek', () => {
      let now = 100
      const transport = new Transport({ now: () => now, loop: { enabled: true, lengthSec: 4 } })
      const param = new MockAudioParam()
      const writer = new LaneWriter(swell(), param, { joinRampSec: 0.05 })
      transport.start()

      const tick = () => writer.tick(laneWindowFrom(transport, 1))
      for (let step = 0; step <= 45; step += 1) {
        now = 100 + step / 10
        tick()
      }

      expect(rounded(param)).toEqual([
        ['setValueAtTime', 0, 100],
        ['linearRampToValueAtTime', 1, 102],
        ['linearRampToValueAtTime', 0, 104],
        ['linearRampToValueAtTime', 0.025, 104.05],
      ])
      expect(transport.position().iteration).toBe(1)
      expect(writer.writtenUntilSec).toBeCloseTo(5.5, 6)

      // Seek to 1 s: the transport re-pins with a fresh pass number; the
      // writer sees the offset change and ramps onto the lane at its new place.
      const before = param.events.length
      transport.seek(1)
      tick()
      const seek = calls(param).slice(before)
      expect(seek[0]).toEqual(['cancelAndHoldAtTime', now])
      expect(seek[1][1]).toBeCloseTo(0.525, 9)
      expect(seek[1][2]).toBeCloseTo(now + 0.05, 9)
    })

    it('treats the default never-ending loop as no loop at all', () => {
      let now = 0
      const transport = new Transport({ now: () => now })
      const param = new MockAudioParam()
      const writer = new LaneWriter(swell(), param)
      transport.start()
      writer.tick(laneWindowFrom(transport, 10))
      now = 5
      writer.tick(laneWindowFrom(transport, 10))
      expect(calls(param)).toEqual([
        ['setValueAtTime', 0, 0],
        ['linearRampToValueAtTime', 1, 2],
        ['linearRampToValueAtTime', 0, 4],
      ])
      expect(writer.writtenUntilSec).toBe(15)
    })
  })

  describe('looping', () => {
    const loopLengthSec = 4

    it('re-anchors at the wrap and continues into the next pass', () => {
      const param = new MockAudioParam()
      const writer = new LaneWriter(swell(), param, { joinRampSec: 0.05 })
      writer.tick({
        playheadSec: 3,
        lookaheadSec: 2,
        contextTimeSec: 13,
        iteration: 0,
        loopEnabled: true,
        loopLengthSec,
      })
      // The breakpoint on the loop length is written, then the wrap ramps onto the lane start.
      expect(calls(param)).toEqual([
        ['setValueAtTime', 0.5, 13],
        ['linearRampToValueAtTime', 0, 14],
        ['linearRampToValueAtTime', 0.025, 14.05],
      ])
      expect(writer.writtenUntilSec).toBe(5)

      writer.tick({
        playheadSec: 0.5,
        lookaheadSec: 2,
        contextTimeSec: 14.5,
        iteration: 1,
        loopEnabled: true,
        loopLengthSec,
      })
      expect(calls(param).slice(3)).toEqual([['linearRampToValueAtTime', 1, 16]])
    })

    it('detects the wrap from a backwards playhead when no iteration is given', () => {
      const param = new MockAudioParam()
      const writer = new LaneWriter(swell(), param, { joinRampSec: 0 })
      const window = { lookaheadSec: 1, loopEnabled: true, loopLengthSec }
      writer.tick({ ...window, playheadSec: 3.5, contextTimeSec: 3.5 })
      writer.tick({ ...window, playheadSec: 0.1, contextTimeSec: 4.1 })
      // Start and end of the swell are both 0, so the wrap adds no event.
      expect(calls(param)).toEqual([
        ['setValueAtTime', 0.25, 3.5],
        ['linearRampToValueAtTime', 0, 4],
      ])
      expect(param.eventsFor('cancelAndHoldAtTime')).toHaveLength(0)
      expect(writer.writtenUntilSec).toBe(5.1)
    })

    it('reads the lane at the position inside the loop, not the unwrapped time', () => {
      const param = firefoxParam()
      const writer = new LaneWriter(swell(), param, { joinRampSec: 0 })
      const window = { lookaheadSec: 1, loopEnabled: true, loopLengthSec }
      writer.tick({ ...window, playheadSec: 1, contextTimeSec: 105, iteration: 2 })
      expect(calls(param)).toEqual([['setValueAtTime', 0.5, 105]])
      writer.override(106)
      expect(calls(param).slice(1)).toEqual([
        ['cancelScheduledValues', 106],
        ['setValueAtTime', 1, 106],
      ])
    })

    it('writes the wrap once when a window ends exactly on the loop boundary', () => {
      const param = new MockAudioParam()
      const lane = new ParamLane({
        breakpoints: [
          { timeSec: 0, value: 0.2 },
          { timeSec: 2, value: 1 },
          { timeSec: 4, value: 0 },
        ],
      })
      const writer = new LaneWriter(lane, param, { joinRampSec: 0 })
      const window = { lookaheadSec: 2, loopEnabled: true, loopLengthSec }
      writer.tick({ ...window, playheadSec: 2, contextTimeSec: 2, iteration: 0 })
      expect(writer.writtenUntilSec).toBe(4)
      writer.tick({ ...window, playheadSec: 3, contextTimeSec: 3, iteration: 0 })
      writer.tick({ ...window, playheadSec: 0.5, contextTimeSec: 4.5, iteration: 1 })
      expect(calls(param)).toEqual([
        ['setValueAtTime', 1, 2],
        ['linearRampToValueAtTime', 0, 4],
        ['setValueAtTime', 0.2, 4],
        ['linearRampToValueAtTime', 1, 6],
      ])
    })
  })
})
