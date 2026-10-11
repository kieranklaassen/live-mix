import { describe, expect, it } from 'vitest'

import {
  KEYFRAME_PROPERTIES,
  keyframeAt,
  keyframeTimes,
  valueAt,
  withKeyframe,
  withoutKeyframe,
  type Keyframe,
} from '../keyframes'

describe('the value of a keyframed property', () => {
  it('is nothing with no keyframes: the property stays at rest', () => {
    expect(valueAt([], 1)).toBeUndefined()
  })

  it('is one keyframe’s value everywhere', () => {
    const keyframes: Keyframe[] = [{ time: 1, value: 0.3 }]

    expect(valueAt(keyframes, 0)).toBe(0.3)
    expect(valueAt(keyframes, 1)).toBe(0.3)
    expect(valueAt(keyframes, 9)).toBe(0.3)
  })

  it('holds the first value before the first keyframe and the last after the last', () => {
    const keyframes: Keyframe[] = [
      { time: 1, value: 2 },
      { time: 3, value: 6, easing: 'linear' },
    ]

    expect(valueAt(keyframes, -1)).toBe(2)
    expect(valueAt(keyframes, 1)).toBe(2)
    expect(valueAt(keyframes, 3)).toBe(6)
    expect(valueAt(keyframes, 10)).toBe(6)
  })

  it('travels between two keyframes on the easing of the one it arrives at', () => {
    const linear: Keyframe[] = [
      { time: 1, value: 2, easing: 'easeInExpo' },
      { time: 3, value: 6, easing: 'linear' },
    ]
    const eased: Keyframe[] = [
      { time: 1, value: 2 },
      { time: 3, value: 6, easing: { bezier: [0.22, 1, 0.36, 1] } },
    ]

    expect(valueAt(linear, 1.5)).toBe(3)
    expect(valueAt(linear, 2)).toBe(4)
    expect(valueAt(eased, 1.5)).toBeCloseTo(2 + 4 * 0.7649, 3)
  })

  it('eases out when a keyframe gives no easing: on (0.33, 1, 0.68, 1)', () => {
    const keyframes: Keyframe[] = [
      { time: 0, value: 0 },
      { time: 2, value: 1 },
    ]

    expect(valueAt(keyframes, 0.5)).toBeCloseTo(0.577342, 5)
    expect(valueAt(keyframes, 1)).toBeCloseTo(0.872202, 5)
    expect(valueAt(keyframes, 1)).toBe(
      valueAt([keyframes[0], { ...keyframes[1], easing: 'easeOutCubic' }], 1),
    )
  })

  it('travels on the other curves by their names', () => {
    const arriving = (easing: Keyframe['easing']) =>
      valueAt(
        [
          { time: 0, value: 0 },
          { time: 1, value: 1, easing },
        ],
        0.25,
      )

    // Ease in is (0.32, 0, 0.67, 0); ease in and out is (0.65, 0, 0.35, 1).
    expect(arriving('easeInCubic')).toBeCloseTo(1 - 0.983384, 5)
    expect(arriving('easeInOutCubic')).toBeCloseTo(0.070797, 5)
    expect(arriving('linear')).toBe(0.25)
  })

  it('springs by its bounce, in the time between the two keyframes', () => {
    const keyframes: Keyframe[] = [
      { time: 0, value: 0 },
      { time: 0.5, value: 10, easing: { spring: { bounce: 0.45 } } },
    ]
    const values = Array.from({ length: 101 }, (_, index) => valueAt(keyframes, index / 200) ?? NaN)

    expect(Math.max(...values)).toBeCloseTo(11.274, 2)
    expect(values[100]).toBe(10)
  })

  it('holds the first value until the second’s time on a hold', () => {
    const keyframes: Keyframe[] = [
      { time: 0, value: 1 },
      { time: 2, value: 5, easing: 'hold' },
    ]

    expect(valueAt(keyframes, 1.999)).toBe(1)
    expect(valueAt(keyframes, 2)).toBe(5)
  })

  it('passes its end value on a spring segment and lands on it', () => {
    const keyframes: Keyframe[] = [
      { time: 0, value: 0 },
      { time: 1, value: 10, easing: { spring: { stiffness: 100, damping: 10, mass: 1 } } },
    ]
    const values = Array.from({ length: 101 }, (_, index) => valueAt(keyframes, index / 100) ?? NaN)

    expect(Math.max(...values)).toBeGreaterThan(11.5)
    expect(values[100]).toBe(10)
    expect(valueAt(keyframes, 1.2)).toBe(10)
  })

  it('takes each segment on its own easing across three keyframes', () => {
    const keyframes: Keyframe[] = [
      { time: 0, value: 0 },
      { time: 1, value: 10, easing: 'linear' },
      { time: 2, value: 0, easing: 'hold' },
    ]

    expect(valueAt(keyframes, 0.5)).toBe(5)
    expect(valueAt(keyframes, 1)).toBe(10)
    expect(valueAt(keyframes, 1.5)).toBe(10)
    expect(valueAt(keyframes, 2)).toBe(0)
  })
})

describe('editing a keyframe list', () => {
  const list: Keyframe[] = [
    { time: 1, value: 1 },
    { time: 3, value: 3, easing: 'linear' },
  ]

  it('names the six properties a layer can be keyframed on', () => {
    expect(KEYFRAME_PROPERTIES).toEqual(['x', 'y', 'scale', 'rotation', 'opacity', 'blur'])
  })

  it('adds in time order, wherever the keyframe falls', () => {
    expect(keyframeTimes(withKeyframe(list, { time: 2, value: 2 }))).toEqual([1, 2, 3])
    expect(keyframeTimes(withKeyframe(list, { time: 0, value: 0 }))).toEqual([0, 1, 3])
    expect(keyframeTimes(withKeyframe(list, { time: 5, value: 5 }))).toEqual([1, 3, 5])
    expect(withKeyframe([], { time: 2, value: 2 })).toEqual([{ time: 2, value: 2 }])
  })

  it('replaces the keyframe at an equal time', () => {
    expect(withKeyframe(list, { time: 3, value: 9 })).toEqual([
      { time: 1, value: 1 },
      { time: 3, value: 9 },
    ])
  })

  it('finds and removes a keyframe by its time, and leaves the list it was given alone', () => {
    expect(keyframeAt(list, 3)).toEqual({ time: 3, value: 3, easing: 'linear' })
    expect(keyframeAt(list, 2)).toBeUndefined()
    expect(withoutKeyframe(list, 1)).toEqual([{ time: 3, value: 3, easing: 'linear' }])
    expect(withoutKeyframe(list, 2)).toEqual(list)
    expect(list).toHaveLength(2)
  })
})
