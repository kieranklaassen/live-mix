import { describe, expect, it } from 'vitest'

import { MockAudioParam } from '../../../testing'
import { ClockLaneWriter } from '../ClockLaneWriter'
import { ParamLane } from '../ParamLane'

/** Two breath cycles as the guide schedules them: a hard reset to 0, then a swell. */
function cycles(): ParamLane {
  return new ParamLane({
    breakpoints: [
      { timeSec: 0, value: 0 },
      { timeSec: 2, value: 1 },
      { timeSec: 4, value: 0, curve: 'step' },
      { timeSec: 4.5, value: 0 },
      { timeSec: 6, value: 1 },
      { timeSec: 8, value: 0 },
    ],
  })
}

function calls(param: MockAudioParam): [string, ...unknown[]][] {
  return param.events.map((event) => [event.method, ...event.args])
}

describe('ClockLaneWriter', () => {
  it('writes lane events verbatim at anchor + timeSec, within now + lookahead, never twice', () => {
    const param = new MockAudioParam(0)
    const writer = new ClockLaneWriter(cycles(), param, { anchorSec: 10 })
    writer.tick(10, 3)
    expect(calls(param)).toEqual([
      ['setValueAtTime', 0, 10],
      ['linearRampToValueAtTime', 1, 12],
    ])
    expect(writer.writtenUntilSec).toBe(3)
    writer.tick(10.5, 3)
    expect(calls(param)).toHaveLength(2)
    writer.tick(11.5, 3)
    // Half-open window: the reset at lane second 4.5 waits for the next tick.
    expect(calls(param).slice(2)).toEqual([['linearRampToValueAtTime', 0, 14]])
    writer.tick(20, 3)
    expect(calls(param).slice(3)).toEqual([
      ['setValueAtTime', 0, 14.5],
      ['linearRampToValueAtTime', 1, 16],
      ['linearRampToValueAtTime', 0, 18],
    ])
    // No join ramps, no synthetic anchors: the events are exactly the lane's.
    expect(calls(param)).toHaveLength(6)
  })

  it('does not replay the past on the first tick', () => {
    const param = new MockAudioParam(0)
    const writer = new ClockLaneWriter(cycles(), param)
    writer.tick(3, 2)
    expect(calls(param)).toEqual([
      ['linearRampToValueAtTime', 0, 4],
      ['setValueAtTime', 0, 4.5],
    ])
  })

  it('append mode keeps writing after the lane grows; rewrite mode cancels from now', () => {
    const append = new MockAudioParam(0)
    const lane = cycles()
    const appender = new ClockLaneWriter(lane, append, { onEdit: 'append' })
    appender.tick(0, 9)
    expect(calls(append)).toHaveLength(6)
    lane.add({ timeSec: 10, value: 1 })
    appender.tick(2, 9)
    expect(calls(append).at(-1)).toEqual(['linearRampToValueAtTime', 1, 10])
    expect(calls(append).filter(([method]) => method === 'cancelScheduledValues')).toHaveLength(0)

    const rewrite = new MockAudioParam(0)
    const lane2 = cycles()
    const rewriter = new ClockLaneWriter(lane2, rewrite)
    rewriter.tick(0, 9)
    lane2.add({ timeSec: 3, value: 0.5 })
    rewriter.tick(1, 9)
    const tail = calls(rewrite).slice(6)
    expect(tail[0]).toEqual(['cancelScheduledValues', 1])
    expect(tail.slice(1)).toEqual([
      ['linearRampToValueAtTime', 1, 2],
      ['linearRampToValueAtTime', 0.5, 3],
      ['linearRampToValueAtTime', 0, 4],
      ['setValueAtTime', 0, 4.5],
      ['linearRampToValueAtTime', 1, 6],
      ['linearRampToValueAtTime', 0, 8],
    ])
  })

  it('override holds and stops writing; release resumes with a plain set at now', () => {
    const param = new MockAudioParam(0)
    const writer = new ClockLaneWriter(cycles(), param)
    writer.tick(0, 1)
    writer.override(1)
    expect(writer.isOverridden).toBe(true)
    expect(calls(param).at(-1)).toEqual(['cancelAndHoldAtTime', 1])
    writer.tick(1.5, 5)
    expect(calls(param)).toHaveLength(2)
    writer.release(3)
    expect(calls(param).at(-1)).toEqual(['setValueAtTime', 0.5, 3])
    writer.tick(3, 2)
    expect(calls(param).slice(-2)).toEqual([
      ['linearRampToValueAtTime', 0, 4],
      ['setValueAtTime', 0, 4.5],
    ])
    writer.reset()
    expect(writer.writtenUntilSec).toBeNull()
  })
})
