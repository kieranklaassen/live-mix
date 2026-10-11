// The motion profile: how a style changes the feel of every preset. The
// host supplies one, from its theme or its project's style; with none the
// profile is neutral and a preset plays as it is defined.

import { isEasing, isNumber, isRecord, type Easing } from './easing'

export interface MotionProfile {
  /** Multiplies how long every preset plays. Above 0. */
  durationScale: number
  /** Multiplies how much a pop bounces. 0 is none. */
  overshoot: number
  /**
   * The curve a slide, a scale and a blur arrive on, in place of each
   * preset's own; they leave on the same curve, backwards. Null leaves each
   * preset its own curves.
   */
  ease: Easing | null
}

export const NEUTRAL_PROFILE: MotionProfile = { durationScale: 1, overshoot: 1, ease: null }

/** A stored ease: any easing value, or a bare list of four numbers read as a bezier. Anything else is no ease of its own. */
function easeOf(value: unknown): Easing | null {
  if (isEasing(value)) return value
  const bezier = { bezier: value }
  return isEasing(bezier) ? bezier : null
}

/**
 * A profile from whatever a host stored. Each field is kept when it is
 * usable and is neutral when it is not, so a profile with one bad number
 * still gives its other two.
 */
export function motionProfile(value: unknown): MotionProfile {
  if (!isRecord(value)) return NEUTRAL_PROFILE
  const { durationScale, overshoot, ease } = value
  return {
    durationScale:
      isNumber(durationScale) && durationScale > 0 ? durationScale : NEUTRAL_PROFILE.durationScale,
    overshoot: isNumber(overshoot) && overshoot >= 0 ? overshoot : NEUTRAL_PROFILE.overshoot,
    ease: easeOf(ease),
  }
}
