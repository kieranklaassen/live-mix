import { describe, expect, it } from 'vitest'

import { NEUTRAL_PROFILE, motionProfile } from '../profile'

describe('the motion profile', () => {
  it('is neutral when there is none: every preset keeps its own length, bounce and curves', () => {
    expect(NEUTRAL_PROFILE).toEqual({ durationScale: 1, overshoot: 1, ease: null })
    expect(motionProfile(undefined)).toEqual(NEUTRAL_PROFILE)
    expect(motionProfile(null)).toEqual(NEUTRAL_PROFILE)
    expect(motionProfile('snappy')).toEqual(NEUTRAL_PROFILE)
    expect(motionProfile([1, 2, 3])).toEqual(NEUTRAL_PROFILE)
    expect(motionProfile({})).toEqual(NEUTRAL_PROFILE)
  })

  it('takes a whole profile as it is', () => {
    const bouncy = { durationScale: 0.8, overshoot: 1.6, ease: { bezier: [0.2, 0, 0, 1] } }

    expect(motionProfile(bouncy)).toEqual(bouncy)
  })

  it('keeps a good field beside a bad one', () => {
    expect(motionProfile({ durationScale: -2, overshoot: 0, ease: 'easeOutCubic' })).toEqual({
      durationScale: 1,
      overshoot: 0,
      ease: 'easeOutCubic',
    })
    expect(motionProfile({ durationScale: 1.5, overshoot: Number.NaN, ease: 'wobbly' })).toEqual({
      durationScale: 1.5,
      overshoot: 1,
      ease: null,
    })
    expect(motionProfile({ durationScale: 0 })).toEqual(NEUTRAL_PROFILE)
    expect(motionProfile({ overshoot: -1 })).toEqual(NEUTRAL_PROFILE)
  })

  it('reads a bare list of four numbers as a bezier, and a spring by its bounce', () => {
    expect(motionProfile({ ease: [0.2, 0, 0, 1] }).ease).toEqual({ bezier: [0.2, 0, 0, 1] })
    expect(motionProfile({ ease: [2, 0, 0, 1] }).ease).toBeNull()
    expect(motionProfile({ ease: { spring: { bounce: 0.2 } } }).ease).toEqual({
      spring: { bounce: 0.2 },
    })
  })
})
