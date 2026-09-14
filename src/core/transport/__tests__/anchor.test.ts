import { describe, expect, it } from 'vitest'

import {
  isLooping,
  positionFromAnchor,
  scheduleKey,
  wrapPosition,
  type TransportLoop,
} from '../anchor'

const looping: TransportLoop = { enabled: true, lengthSec: 32 }
const bounded: TransportLoop = { enabled: false, lengthSec: 32 }
const endless: TransportLoop = { enabled: false, lengthSec: Infinity }

describe('positionFromAnchor', () => {
  const anchor = { contextTime: 100, positionSec: 30, iteration: 2 }

  it('adds the audio time elapsed since the pin', () => {
    expect(positionFromAnchor(anchor, 101, looping)).toEqual({
      positionSec: 31,
      iteration: 2,
      finished: false,
    })
  })

  it('wraps into the next pass when looping and numbers it from the anchor', () => {
    expect(positionFromAnchor(anchor, 103, looping)).toEqual({
      positionSec: 1,
      iteration: 3,
      finished: false,
    })
    expect(positionFromAnchor(anchor, 100 + 2 + 64, looping).iteration).toBe(5)
  })

  it('clamps at the end and reports finished when the loop is off', () => {
    expect(positionFromAnchor(anchor, 101.5, bounded).finished).toBe(false)
    expect(positionFromAnchor(anchor, 103, bounded)).toEqual({
      positionSec: 32,
      iteration: 2,
      finished: true,
    })
    expect(positionFromAnchor(anchor, 102, bounded).finished).toBe(true)
  })

  it('never finishes or wraps an endless timeline', () => {
    const far = positionFromAnchor(anchor, 100 + 3600, endless)
    expect(far).toEqual({ positionSec: 3630, iteration: 2, finished: false })
    expect(positionFromAnchor(anchor, 100 + 3600, { enabled: true, lengthSec: Infinity })).toEqual(
      far,
    )
  })

  it('reads as the anchor position before a start pinned in the future', () => {
    expect(positionFromAnchor(anchor, 99, looping)).toEqual({
      positionSec: 30,
      iteration: 2,
      finished: false,
    })
  })
})

describe('scheduleKey', () => {
  it('joins clip, pass and position at millisecond precision', () => {
    expect(scheduleKey({ clipId: 'pad', iteration: 3, startSec: 1.5 })).toBe('pad:3:1.500')
    expect(scheduleKey({ clipId: 'pad', iteration: 3, startSec: 1.50049 })).toBe('pad:3:1.500')
  })

  it('changes when the clip moves, even within the same pass', () => {
    const before = scheduleKey({ clipId: 'pad', iteration: 0, startSec: 4 })
    const after = scheduleKey({ clipId: 'pad', iteration: 0, startSec: 4.25 })
    expect(before).not.toBe(after)
  })
})

describe('wrapPosition', () => {
  it('wraps positive and negative positions into the loop', () => {
    expect(wrapPosition(33, 32)).toBe(1)
    expect(wrapPosition(-1, 32)).toBe(31)
    expect(wrapPosition(32, 32)).toBe(0)
    expect(wrapPosition(5, 32)).toBe(5)
  })

  it('returns 0 for a loop without length', () => {
    expect(wrapPosition(5, 0)).toBe(0)
    expect(wrapPosition(5, -1)).toBe(0)
  })
})

describe('isLooping', () => {
  it('needs the loop on with a finite positive length', () => {
    expect(isLooping(looping)).toBe(true)
    expect(isLooping(bounded)).toBe(false)
    expect(isLooping({ enabled: true, lengthSec: Infinity })).toBe(false)
    expect(isLooping({ enabled: true, lengthSec: 0 })).toBe(false)
  })
})
