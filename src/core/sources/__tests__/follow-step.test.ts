import { describe, expect, it } from 'vitest'

import {
  FOLLOW_DRIFT_SEEK,
  FOLLOW_MAX_SEEK_LEAD,
  FOLLOW_SEEK_TOLERANCE,
  followStep,
} from '../follow-step'

const at = (currentTime: number, seeking = false) => ({ currentTime, seeking })
const wanted = (mediaTime: number, rate = 1) => ({ mediaTime, rate })

describe('bringing a paused element to its time', () => {
  it('seeks to the exact time when it is on another frame', () => {
    expect(followStep(at(1), wanted(1.5), false)).toEqual({ seekTo: 1.5, playbackRate: 1 })
    expect(followStep(at(2), wanted(1.5), false).seekTo).toBe(1.5)
  })

  it('leaves it alone when it is already on that frame', () => {
    expect(followStep(at(1.5), wanted(1.5), false).seekTo).toBeNull()
    expect(followStep(at(1.5 + FOLLOW_SEEK_TOLERANCE / 2), wanted(1.5), false).seekTo).toBeNull()
  })

  it('asks nothing while a seek is under way, and for the newest time once it lands', () => {
    expect(followStep(at(1, true), wanted(1.5), false).seekTo).toBeNull()
    // The seek to 1.5 landed while the person scrubbed on to 2.25.
    expect(followStep(at(1.5, false), wanted(2.25), false).seekTo).toBe(2.25)
  })
})

describe('keeping a playing element on the clock', () => {
  it('runs at the wanted rate when it is on time', () => {
    expect(followStep(at(3), wanted(3), true)).toEqual({ seekTo: null, playbackRate: 1 })
    expect(followStep(at(3), wanted(3, 2), true).playbackRate).toBe(2)
  })

  it('slows one that is ahead and hurries one that is behind, without seeking', () => {
    const ahead = followStep(at(3.05), wanted(3), true)
    const behind = followStep(at(2.95), wanted(3), true)

    expect(ahead.seekTo).toBeNull()
    expect(ahead.playbackRate).toBeCloseTo(0.9, 9)
    expect(behind.seekTo).toBeNull()
    expect(behind.playbackRate).toBeCloseTo(1.1, 9)
  })

  it('leans by half the wanted rate at most, whatever the rate', () => {
    // Just inside the drift limit the lean would be 0.48; it never passes 0.5.
    expect(followStep(at(3), wanted(3.24), true).playbackRate).toBeCloseTo(1.48, 9)
    expect(followStep(at(3), wanted(3.24, 1.5), true).playbackRate).toBeCloseTo(1.5 * 1.48, 9)
    expect(followStep(at(3.24), wanted(3, 1.5), true).playbackRate).toBeCloseTo(1.5 * 0.52, 9)
  })

  it('seeks when it is further off than a nudge can close, as at a cut', () => {
    expect(followStep(at(3), wanted(3 + FOLLOW_DRIFT_SEEK + 0.15), true)).toEqual({
      seekTo: 3.4,
      playbackRate: 1,
    })
    expect(followStep(at(3, true), wanted(3.4), true).seekTo).toBeNull()
  })

  it('names how far ahead a playing seek may aim', () => {
    expect(FOLLOW_MAX_SEEK_LEAD).toBeGreaterThan(FOLLOW_DRIFT_SEEK)
  })
})
