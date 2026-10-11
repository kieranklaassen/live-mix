// Keyframes: the values a property of a layer has at chosen times, and how
// it travels between them.
//
// A keyframe's time is seconds from the layer's start. Its value replaces
// the layer's rest value of that property. Its easing shapes the segment
// that arrives at it: "be at this value at this time, getting there like
// this". The first keyframe's easing is never used. Before the first
// keyframe a property holds the first value, and after the last, the last.
//
// A keyframe is named by its property and its time: no two keyframes of one
// property share a time.

import { curveOf, type Curve, type Easing } from './easing'

export const KEYFRAME_PROPERTIES = ['x', 'y', 'scale', 'rotation', 'opacity', 'blur'] as const
export type KeyframeProperty = (typeof KEYFRAME_PROPERTIES)[number]

export interface Keyframe {
  /** Seconds from the layer's start. */
  time: number
  /** In the property's own unit (values.ts): it takes the place of the layer's rest value. */
  value: number
  /** How the value travels here from the keyframe before. Left out, ease out. */
  easing?: Easing
}

/** The easing of a keyframe that gives none: "Ease out", (0.33, 1, 0.68, 1). */
export const DEFAULT_KEYFRAME_EASING: Easing = 'easeOutCubic'

/** A keyframe list made ready to sample: each segment's curve is built once. */
export interface KeyframeTrack {
  times: readonly number[]
  values: readonly number[]
  /** `curves[index]` shapes the segment that arrives at keyframe `index`. */
  curves: readonly Curve[]
}

export function keyframeTrack(keyframes: readonly Keyframe[]): KeyframeTrack {
  return {
    times: keyframes.map((keyframe) => keyframe.time),
    values: keyframes.map((keyframe) => keyframe.value),
    curves: keyframes.map((keyframe) => curveOf(keyframe.easing ?? DEFAULT_KEYFRAME_EASING)),
  }
}

/** The value of a track at `time`, or undefined for a track with no keyframes. */
export function trackValue(
  { times, values, curves }: KeyframeTrack,
  time: number,
): number | undefined {
  const last = times.length - 1
  if (last < 0) return undefined
  if (time <= times[0]) return values[0]
  if (time >= times[last]) return values[last]

  let next = 1
  while (times[next] <= time) next += 1
  const from = values[next - 1]
  const progress = (time - times[next - 1]) / (times[next] - times[next - 1])
  return from + (values[next] - from) * curves[next](progress)
}

/** The value of a keyframe list at `time`. To sample one list many times, make its track once. */
export function valueAt(keyframes: readonly Keyframe[], time: number): number | undefined {
  return trackValue(keyframeTrack(keyframes), time)
}

export function keyframeTimes(keyframes: readonly Keyframe[]): number[] {
  return keyframes.map((keyframe) => keyframe.time)
}

export function keyframeAt(keyframes: readonly Keyframe[], time: number): Keyframe | undefined {
  return keyframes.find((keyframe) => keyframe.time === time)
}

/** The list with `keyframe` in its place in time, in place of any keyframe at the same time. */
export function withKeyframe(keyframes: readonly Keyframe[], keyframe: Keyframe): Keyframe[] {
  return [...withoutKeyframe(keyframes, keyframe.time), keyframe].sort((a, b) => a.time - b.time)
}

/** The list without the keyframe at `time`. */
export function withoutKeyframe(keyframes: readonly Keyframe[], time: number): Keyframe[] {
  return keyframes.filter((keyframe) => keyframe.time !== time)
}
