import { describe, expect, it } from 'vitest'

import { clipsInWindow, clipsSoundingAt } from '../window'

// ambient-live's timeline length; the library takes it as an argument.
const LOOP_LENGTH_SEC = 32

const clips = [
  { id: 'a', startSec: 0.5 },
  { id: 'b', startSec: 4 },
  { id: 'c', startSec: LOOP_LENGTH_SEC - 0.5 },
]

function window(overrides: Partial<Parameters<typeof clipsInWindow>[0]> = {}) {
  return clipsInWindow({
    clips,
    playheadSec: 0,
    lookaheadSec: 0.2,
    iteration: 0,
    loopEnabled: true,
    loopLengthSec: LOOP_LENGTH_SEC,
    ...overrides,
  })
}

describe('clipsInWindow', () => {
  it('returns a clip inside the lookahead and skips one beyond it', () => {
    expect(window({ playheadSec: 0.45 }).map((entry) => entry.clipId)).toEqual(['a'])
    expect(window({ playheadSec: 0 })).toEqual([])
  })

  it('reports how long until the clip starts', () => {
    expect(window({ playheadSec: 0.45 })[0].startsInSec).toBeCloseTo(0.05, 5)
  })

  it('skips a clip the playhead has already passed', () => {
    expect(window({ playheadSec: 0.6 })).toEqual([])
  })

  it('includes the clip sitting exactly on the window start', () => {
    expect(window({ playheadSec: 0.5 }).map((entry) => entry.clipId)).toEqual(['a'])
  })

  it('returns a start exactly once across consecutive windows', () => {
    const first = window({ playheadSec: 0.4, lookaheadSec: 0.1 })
    const second = window({ playheadSec: 0.5, lookaheadSec: 0.1 })
    expect(first).toEqual([])
    expect(second.map((entry) => entry.clipId)).toEqual(['a'])
  })

  it('reaches into the next loop pass when the window wraps', () => {
    const wrapped = window({ playheadSec: LOOP_LENGTH_SEC - 0.1, lookaheadSec: 0.7 })
    expect(wrapped.map((entry) => entry.clipId)).toEqual(['a'])
    expect(wrapped[0].iteration).toBe(1)
    expect(wrapped[0].startsInSec).toBeCloseTo(0.6, 5)
  })

  it('does not wrap when loop is off', () => {
    expect(
      window({ playheadSec: LOOP_LENGTH_SEC - 0.1, lookaheadSec: 0.7, loopEnabled: false }),
    ).toEqual([])
  })

  it('sorts by how soon each clip starts', () => {
    const busy = clipsInWindow({
      clips: [
        { id: 'late', startSec: 1.9 },
        { id: 'early', startSec: 1.1 },
      ],
      playheadSec: 1,
      lookaheadSec: 1,
      iteration: 3,
      loopEnabled: true,
      loopLengthSec: LOOP_LENGTH_SEC,
    })
    expect(busy.map((entry) => entry.clipId)).toEqual(['early', 'late'])
    expect(busy.every((entry) => entry.iteration === 3)).toBe(true)
  })

  it('wraps against whatever loop length the caller passes', () => {
    const short = window({ playheadSec: 7.9, lookaheadSec: 0.7, loopLengthSec: 8 })
    expect(short.map((entry) => entry.clipId)).toEqual(['a'])
    expect(short[0].iteration).toBe(1)
    expect(short[0].startsInSec).toBeCloseTo(0.6, 5)
  })
})

describe('clipsSoundingAt', () => {
  const strokes = [
    { id: 'late', startSec: 6, durationSec: 4 },
    { id: 'early', startSec: 2, durationSec: 16 },
    { id: 'bare', startSec: 0 },
  ]

  it('names the clips begun before the position and not yet over, in timeline order', () => {
    expect(clipsSoundingAt(strokes, 7).map((clip) => clip.id)).toEqual(['early', 'late'])
    expect(clipsSoundingAt(strokes, 12).map((clip) => clip.id)).toEqual(['early'])
    expect(clipsSoundingAt(strokes, 1)).toEqual([])
  })

  it('leaves out a clip that starts or ends exactly there', () => {
    expect(clipsSoundingAt(strokes, 6).map((clip) => clip.id)).toEqual(['early'])
    expect(clipsSoundingAt(strokes, 10).map((clip) => clip.id)).toEqual(['early'])
    expect(clipsSoundingAt(strokes, 18)).toEqual([])
  })

  it('never names a clip with no length', () => {
    expect(clipsSoundingAt([{ id: 'bare', startSec: 0 }], 5)).toEqual([])
  })
})
