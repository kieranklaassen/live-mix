import { describe, expect, it } from 'vitest'

import { clipsInWindow } from '../../clips/window'
import { type TransportLoop } from '../anchor'
import { startsInWindow, type ScheduleWindow } from '../window'

// ambient-live's timeline length; the library takes it as an argument.
const LOOP_LENGTH_SEC = 32
const looping: TransportLoop = { enabled: true, lengthSec: LOOP_LENGTH_SEC }
const bounded: TransportLoop = { enabled: false, lengthSec: LOOP_LENGTH_SEC }

const clips = [
  { id: 'a', startSec: 0.5 },
  { id: 'b', startSec: 4 },
  { id: 'c', startSec: LOOP_LENGTH_SEC - 0.5 },
]

function window(overrides: Partial<ScheduleWindow> = {}) {
  return startsInWindow({
    clips,
    positionSec: 0,
    lookaheadSec: 0.2,
    iteration: 0,
    loop: looping,
    ...overrides,
  })
}

// The eight cases of ambient-live's clip-schedule.test.ts (1d3b31b), against
// the widened signature.
describe('startsInWindow — the clipsInWindow contract', () => {
  it('returns a clip inside the lookahead and skips one beyond it', () => {
    expect(window({ positionSec: 0.45 }).map((entry) => entry.clipId)).toEqual(['a'])
    expect(window({ positionSec: 0 })).toEqual([])
  })

  it('reports how long until the clip starts', () => {
    expect(window({ positionSec: 0.45 })[0].startsInSec).toBeCloseTo(0.05, 5)
  })

  it('skips a clip the playhead has already passed', () => {
    expect(window({ positionSec: 0.6 })).toEqual([])
  })

  it('includes the clip sitting exactly on the window start', () => {
    expect(window({ positionSec: 0.5 }).map((entry) => entry.clipId)).toEqual(['a'])
  })

  it('returns a start exactly once across consecutive windows', () => {
    const first = window({ positionSec: 0.4, lookaheadSec: 0.1 })
    const second = window({ positionSec: 0.5, lookaheadSec: 0.1 })
    expect(first).toEqual([])
    expect(second.map((entry) => entry.clipId)).toEqual(['a'])
  })

  it('reaches into the next loop pass when the window wraps', () => {
    const wrapped = window({ positionSec: LOOP_LENGTH_SEC - 0.1, lookaheadSec: 0.7 })
    expect(wrapped.map((entry) => entry.clipId)).toEqual(['a'])
    expect(wrapped[0].iteration).toBe(1)
    expect(wrapped[0].startsInSec).toBeCloseTo(0.6, 5)
  })

  it('does not wrap when loop is off', () => {
    expect(
      window({ positionSec: LOOP_LENGTH_SEC - 0.1, lookaheadSec: 0.7, loop: bounded }),
    ).toEqual([])
  })

  it('sorts by how soon each clip starts', () => {
    const busy = startsInWindow({
      clips: [
        { id: 'late', startSec: 1.9 },
        { id: 'early', startSec: 1.1 },
      ],
      positionSec: 1,
      lookaheadSec: 1,
      iteration: 3,
      loop: looping,
    })
    expect(busy.map((entry) => entry.clipId)).toEqual(['early', 'late'])
    expect(busy.every((entry) => entry.iteration === 3)).toBe(true)
  })

  it('is clipsInWindow when there is nothing to catch up on', () => {
    for (const positionSec of [0, 0.45, 0.5, 4, 31.5, 31.9]) {
      for (const loop of [looping, bounded]) {
        expect(window({ positionSec, lookaheadSec: 0.7, loop })).toEqual(
          clipsInWindow({
            clips,
            playheadSec: positionSec,
            lookaheadSec: 0.7,
            iteration: 0,
            loopEnabled: loop.enabled,
            loopLengthSec: loop.lengthSec,
          }),
        )
      }
    }
  })
})

describe('startsInWindow — catching up', () => {
  it('reaches behind the position and reports those starts as already due', () => {
    const late = window({ positionSec: 4.5, lookaheadSec: 0.2, catchUpSec: 1 })
    expect(late).toEqual([{ clipId: 'b', iteration: 0, startsInSec: -0.5 }])
  })

  it('keeps the half-open contract at the catch-up edge', () => {
    expect(window({ positionSec: 5, catchUpSec: 1 }).map((entry) => entry.clipId)).toEqual(['b'])
    expect(window({ positionSec: 5.001, catchUpSec: 1 })).toEqual([])
  })

  it('crosses the loop seam backwards into the previous pass', () => {
    const late = window({ positionSec: 0.2, lookaheadSec: 0.2, iteration: 3, catchUpSec: 1 })
    expect(late.map((entry) => [entry.clipId, entry.iteration])).toEqual([['c', 2]])
    expect(late[0].startsInSec).toBeCloseTo(-0.7, 5)
  })

  it('spans several passes of a short loop, oldest first', () => {
    const tiny: TransportLoop = { enabled: true, lengthSec: 1 }
    const hits = startsInWindow({
      clips: [{ id: 'k', startSec: 0.25 }],
      positionSec: 0.5,
      lookaheadSec: 1,
      iteration: 10,
      loop: tiny,
      catchUpSec: 2.5,
    })
    expect(hits.map((entry) => entry.iteration)).toEqual([8, 9, 10, 11])
    expect(hits.map((entry) => entry.startsInSec)).toEqual([-2.25, -1.25, -0.25, 0.75])
  })

  it('ignores a negative catch-up', () => {
    expect(window({ positionSec: 0.45, catchUpSec: -5 })).toEqual(window({ positionSec: 0.45 }))
  })

  it('does not wrap an endless timeline, however far it catches up', () => {
    const endless: TransportLoop = { enabled: false, lengthSec: Infinity }
    const hits = startsInWindow({
      clips: [{ id: 'z', startSec: 100 }],
      positionSec: 130,
      lookaheadSec: 5,
      iteration: 0,
      loop: endless,
      catchUpSec: 60,
    })
    expect(hits).toEqual([{ clipId: 'z', iteration: 0, startsInSec: -30 }])
  })
})
