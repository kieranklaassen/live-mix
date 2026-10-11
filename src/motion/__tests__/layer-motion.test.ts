import { describe, expect, it } from 'vitest'

import {
  DEFAULT_FADE,
  layerMotionAt,
  motionAt,
  motionIssues,
  resolveLayerMotion,
  type LayerMotion,
} from '../layer-motion'
import { motionProfile } from '../profile'
import { ORIGIN, restValues, type RestPose } from '../values'

const SPRING = { spring: { stiffness: 170, damping: 12, mass: 1 } }

/** Where the layer of these tests rests: a tenth in from the left and two tenths down, turned 10 degrees, at 0.8 opacity. */
const REST: RestPose = { x: 0.1, y: 0.2, rotation: 10, opacity: 0.8 }

/** A layer with all three: a pop in, a fade out, and keyframes with a spring and a bezier segment. */
const SAMPLE: LayerMotion = {
  in: { preset: 'pop', duration: 0.45, strength: 0.5, bounce: 0.45 },
  out: { preset: 'fade' },
  keyframes: {
    x: [
      { time: 0, value: 0 },
      { time: 0.6, value: 0.1, easing: SPRING },
    ],
    scale: [
      { time: 1.2, value: 1 },
      { time: 1.5, value: 1.2, easing: { spring: { bounce: 0.2 } } },
      { time: 2, value: 1, easing: { bezier: [0.2, 0, 0, 1] } },
    ],
  },
}

describe('a layer with no motion', () => {
  it('is at its rest pose, and at the picture’s top left when it is given none', () => {
    expect(layerMotionAt(undefined, 2, { length: 4, rest: REST })).toEqual({
      x: 0.1,
      y: 0.2,
      scale: 1,
      rotation: 10,
      opacity: 0.8,
      blur: 0,
      reveal: 1,
      offsetX: 0,
      offsetY: 0,
    })
    expect(layerMotionAt(undefined, 2, { length: 4 })).toEqual(restValues(ORIGIN))
  })

  it('fades in and out over 0.2 s on Easy Ease', () => {
    const at = (time: number) => layerMotionAt(undefined, time, { length: 4 })

    expect(DEFAULT_FADE).toBe(0.2)
    expect(at(0).opacity).toBe(0)
    expect(at(0.05).opacity).toBe(0.15625)
    expect(at(0.1).opacity).toBe(0.5)
    expect(at(0.15).opacity).toBeCloseTo(0.84375, 12)
    expect(at(0.2)).toEqual(restValues())
    expect(at(2)).toEqual(restValues())
    expect(at(3.9).opacity).toBeCloseTo(0.5, 12)
    expect(at(3.95).opacity).toBeCloseTo(0.15625, 12)
  })

  it('fades for as long as the layer’s own fade says, and not at all for 0', () => {
    expect(layerMotionAt(undefined, 0.5, { length: 6, fade: { in: 1, out: 2 } }).opacity).toBe(0.5)
    expect(layerMotionAt(undefined, 5, { length: 6, fade: { in: 1, out: 2 } }).opacity).toBe(0.5)
    expect(layerMotionAt(undefined, 0, { length: 6, fade: { in: 0, out: 0 } })).toEqual(
      restValues(),
    )
    expect(layerMotionAt({}, 0.1, { length: 6, fade: { in: 1 } }).opacity).toBeCloseTo(0.028, 12)
    expect(layerMotionAt({}, 5.9, { length: 6, fade: { in: 1 } }).opacity).toBeCloseTo(0.5, 12)
  })

  it('multiplies its fade into its own opacity', () => {
    expect(layerMotionAt(undefined, 0.1, { length: 4, rest: REST }).opacity).toBe(0.4)
  })

  it('never fades for longer than half the layer, so the two fades never overlap', () => {
    const at = (time: number) => layerMotionAt(undefined, time, { length: 0.2 }).opacity

    expect(at(0.05)).toBe(0.5)
    expect(at(0.1)).toBe(1)
    expect(at(0.15)).toBeCloseTo(0.5, 12)
  })
})

describe('a layer with presets', () => {
  it('plays its entrance, rests, then plays its exit', () => {
    const motion: LayerMotion = {
      in: { preset: 'slideUp', duration: 0.4 },
      out: { preset: 'slideUp', duration: 0.25 },
    }
    const at = (time: number) => layerMotionAt(motion, time, { length: 4, rest: REST })

    // In from 6% of the height below; out by 4% upward (presets.test.ts).
    expect(at(0)).toMatchObject({ offsetY: 0.06, opacity: 0, x: 0.1, y: 0.2 })
    expect(at(0.1).offsetY).toBeCloseTo(0.010463, 6)
    expect(at(0.4)).toEqual(restValues(REST))
    expect(at(2)).toEqual(restValues(REST))
    expect(at(3.75)).toEqual(restValues(REST))
    expect(at(3.875).offsetY).toBeCloseTo(-0.001129, 6)
    expect(at(3.875).opacity).toBeCloseTo(0.4, 12)
  })

  it('lays a preset over the rest pose: scale and opacity are multiplied, the place is left alone', () => {
    const values = layerMotionAt({ in: { preset: 'pop', duration: 0.45 } }, 0.1125, {
      length: 4,
      rest: REST,
    })

    // A quarter of the way through a pop: scale 0.940055, opacity 0.9375 of the layer's 0.8.
    expect(values.scale).toBeCloseTo(0.940055, 6)
    expect(values.opacity).toBeCloseTo(0.75, 12)
    expect(values).toMatchObject({ x: 0.1, y: 0.2, rotation: 10, offsetX: 0, offsetY: 0 })
  })

  it('overrides the fallback fade on the side that has a preset, and keeps it on the other', () => {
    const at = (time: number) => layerMotionAt({ in: { preset: 'none' } }, time, { length: 4 })

    expect(at(0)).toEqual(restValues())
    expect(at(0.1)).toEqual(restValues())
    expect(at(3.9).opacity).toBeCloseTo(0.5, 12)
  })

  it('cuts an entrance and an exit that are longer than the layer to half of it each', () => {
    const resolved = resolveLayerMotion(
      { in: { preset: 'scale', duration: 3 }, out: { preset: 'fade', duration: 5 } },
      { length: 2 },
    )

    expect(resolved.in.duration).toBe(1)
    expect(resolved.out.duration).toBe(1)
    expect(motionAt(resolved, 0.5).scale).toBeCloseTo(0.994728, 6)
    expect(motionAt(resolved, 1)).toEqual(restValues())
    expect(motionAt(resolved, 1.5).opacity).toBeCloseTo(0.872202, 6)
  })

  it('a profile’s duration scale stretches the entrance, the fallback fade included', () => {
    const slow = motionProfile({ durationScale: 2 })
    const pop = (profile?: ReturnType<typeof motionProfile>) =>
      resolveLayerMotion({ in: { preset: 'pop' } }, { length: 10, profile })

    expect(pop().in.duration).toBe(0.45)
    expect(pop(slow).in.duration).toBe(0.9)
    expect(motionAt(pop(slow), 0.45)).toEqual(motionAt(pop(), 0.225))
    expect(resolveLayerMotion(undefined, { length: 10, profile: slow }).in.duration).toBe(0.4)
  })

  it('says which preset each side plays and for how long', () => {
    const resolved = resolveLayerMotion({ in: { preset: 'pop' } }, { length: 10 })

    expect(resolved.in).toMatchObject({ preset: 'pop', duration: 0.45 })
    expect(resolved.out).toMatchObject({ preset: 'fade', duration: 0.2 })
  })

  it('gives typeOn a length from the layer’s characters', () => {
    expect(
      resolveLayerMotion({ in: { preset: 'typeOn' } }, { length: 10, characters: 20 }).in.duration,
    ).toBeCloseTo(0.7, 12)
    expect(
      layerMotionAt({ in: { preset: 'typeOn' } }, 0.35, { length: 10, characters: 20 }).reveal,
    ).toBeCloseTo(0.5, 12)
  })
})

describe('a layer with keyframes', () => {
  const still = { in: { preset: 'none' }, out: { preset: 'none' } } as const

  it('takes a keyframe’s value in place of its rest value, and leaves the other properties at rest', () => {
    const values = layerMotionAt(
      {
        ...still,
        keyframes: {
          rotation: [{ time: 0, value: 30 }],
          x: [{ time: 0, value: 0.5 }],
          opacity: [{ time: 0, value: 0.25 }],
        },
      },
      1,
      { length: 4, rest: REST },
    )

    expect(values).toEqual({ ...restValues(REST), rotation: 30, x: 0.5, opacity: 0.25 })
  })

  it('combines with a preset: the keyframes set the pose, and the preset multiplies its scale and opacity and offsets it', () => {
    const motion: LayerMotion = {
      in: { preset: 'scale', duration: 1, strength: 1 },
      out: { preset: 'slideDown', duration: 1, strength: 1 },
      keyframes: {
        scale: [{ time: 0, value: 2 }],
        opacity: [{ time: 0, value: 0.5 }],
        x: [{ time: 0, value: 0.25 }],
      },
    }
    const start = layerMotionAt(motion, 0, { length: 4, rest: REST })
    const half = layerMotionAt(motion, 0.5, { length: 4, rest: REST })
    const rest = layerMotionAt(motion, 2, { length: 4, rest: REST })
    const leaving = layerMotionAt(motion, 3.5, { length: 4, rest: REST })

    expect(start).toMatchObject({ x: 0.25, scale: 2 * 0.84, opacity: 0 })
    // Half way in, a scale at half strength is 0.994728 (presets.test.ts); at full strength it is twice as far from 1.
    expect(half.scale).toBeCloseTo(2 * (1 - 2 * (1 - 0.994728)), 5)
    expect(half.opacity).toBe(0.5)
    expect(rest).toEqual({ ...restValues(REST), x: 0.25, scale: 2, opacity: 0.5 })
    // Half way out of a slide down at full strength: 0.08 of the height by then, on (0.7, 0, 0.84, 0).
    expect(leaving).toMatchObject({ x: 0.25, scale: 2, offsetX: 0 })
    expect(leaving.offsetY).toBeCloseTo(0.002258, 6)
    expect(leaving.opacity).toBeCloseTo(0.25, 12)
  })

  it('keeps opacity within 0 to 1 and scale and blur at 0 or above where a spring passes its ends', () => {
    const bouncy = { spring: { bounce: 0.6 } }
    const motion: LayerMotion = {
      ...still,
      keyframes: {
        opacity: [
          { time: 0, value: 0 },
          { time: 1, value: 1, easing: bouncy },
          { time: 2, value: 0, easing: bouncy },
        ],
        scale: [
          { time: 0, value: 1 },
          { time: 1, value: 0, easing: bouncy },
        ],
        blur: [
          { time: 0, value: 0.02 },
          { time: 1, value: 0, easing: bouncy },
        ],
      },
    }
    const samples = Array.from({ length: 201 }, (_, index) =>
      layerMotionAt(motion, index / 100, { length: 4 }),
    )

    expect(Math.max(...samples.map((values) => values.opacity))).toBe(1)
    expect(Math.min(...samples.map((values) => values.opacity))).toBe(0)
    expect(Math.min(...samples.map((values) => values.scale))).toBe(0)
    expect(Math.min(...samples.map((values) => values.blur))).toBe(0)
  })
})

describe('motion is a function of time', () => {
  const context = { length: 4, characters: 12, rest: REST }
  const times = Array.from({ length: 241 }, (_, frame) => frame / 60)

  it('a value at a time is identical however the time is reached', () => {
    const alone = layerMotionAt(SAMPLE, 1.234, context)

    const forwards = resolveLayerMotion(SAMPLE, context)
    for (const time of times) if (time < 1.234) motionAt(forwards, time)
    const afterForwards = motionAt(forwards, 1.234)

    const backwards = resolveLayerMotion(SAMPLE, context)
    for (const time of [...times].reverse()) if (time > 1.234) motionAt(backwards, time)
    const afterBackwards = motionAt(backwards, 1.234)

    const shuffled = resolveLayerMotion(SAMPLE, context)
    // A fixed shuffle: every 97th frame of 241, which visits them all.
    for (let step = 0; step < times.length; step += 1)
      motionAt(shuffled, times[(step * 97) % times.length])
    const afterShuffle = motionAt(shuffled, 1.234)

    for (const values of [afterForwards, afterBackwards, afterShuffle]) {
      for (const property of Object.keys(alone) as (keyof typeof alone)[])
        expect(Object.is(values[property], alone[property]), property).toBe(true)
    }
    // And the time is one where something is happening: the scale is on its way to 1.2.
    expect(alone.scale).toBeGreaterThan(1)
  })

  it('gives every frame of an export the value the preview had at that time', () => {
    const preview = resolveLayerMotion(SAMPLE, context)
    // The preview plays at the display's rate and is scrubbed back and forth before the export runs.
    for (let tick = 0; tick < 480; tick += 1) motionAt(preview, tick / 120)
    for (let tick = 479; tick >= 0; tick -= 7) motionAt(preview, tick / 120)
    const exported = resolveLayerMotion(SAMPLE, context)

    for (const time of times) expect(motionAt(exported, time)).toEqual(motionAt(preview, time))
  })

  it('returns a fresh object each time, so no caller can change another’s values', () => {
    const resolved = resolveLayerMotion(SAMPLE, context)
    const first = motionAt(resolved, 3)
    first.x = 99

    expect(motionAt(resolved, 3).x).toBe(0.1)
    expect(REST.x).toBe(0.1)
  })
})

describe('what is wrong with a stored motion field', () => {
  const text = { text: true }
  const messages = (value: unknown, layer = text) =>
    motionIssues(value, layer).map((issue) => `${issue.path}: ${issue.message}`)

  it('is nothing for the sample, for an empty field and for presets alone', () => {
    expect(messages(SAMPLE)).toEqual([])
    expect(messages({})).toEqual([])
    expect(messages({ in: { preset: 'typeOn' }, out: { preset: 'none' } })).toEqual([])
  })

  it('names a field that is not an object, and a part it does not know', () => {
    expect(messages('pop')).toEqual(['motion: has motion that is not an object'])
    expect(messages({ loop: true })).toEqual([
      'motion.loop: has motion with a part it does not know, loop',
    ])
  })

  it('names a preset that does not exist, a strength outside 0 to 1, a negative duration and a bounce above 0.8', () => {
    expect(messages({ in: { preset: 'wobble' } })[0]).toMatch(
      /^motion\.in\.preset: has an entrance preset that is not one of none, fade, pop/,
    )
    expect(messages({ out: { preset: 'pop', strength: 2 } })).toEqual([
      'motion.out.strength: has an exit strength that is not from 0 to 1',
    ])
    expect(messages({ in: { preset: 'pop', duration: -1 } })).toEqual([
      'motion.in.duration: has an entrance duration that is not 0 seconds or more',
    ])
    expect(messages({ in: { preset: 'pop', bounce: 0.9 } })).toEqual([
      'motion.in.bounce: has an entrance bounce that is not from 0 to 0.8',
    ])
    expect(messages({ in: 'pop' })).toEqual([
      'motion.in: has an entrance that is not a preset with a name',
    ])
    expect(messages({ in: { preset: 'pop', wobble: 3 } })).toEqual([
      'motion.in.wobble: has an entrance with a part it does not know, wobble',
    ])
  })

  it('refuses typeOn where there is no text to type', () => {
    expect(messages({ in: { preset: 'typeOn' } }, { text: false })).toEqual([
      'motion.in.preset: has a typeOn entrance, and typeOn needs a layer with text',
    ])
  })

  it('names a property that cannot be keyframed, an empty list and a malformed keyframe', () => {
    expect(messages({ keyframes: { width: [{ time: 0, value: 1 }] } })).toEqual([
      'motion.keyframes.width: has keyframes on width, which is not one of x, y, scale, rotation, opacity, blur',
    ])
    expect(messages({ keyframes: { x: [] } })).toEqual([
      'motion.keyframes.x: has an empty list of x keyframes',
    ])
    expect(messages({ keyframes: { x: [{ time: 0 }] } })).toEqual([
      'motion.keyframes.x.0: has an x keyframe that is not a time and a value',
    ])
    expect(messages({ keyframes: { x: [{ time: 0, value: 1, easing: 'wobble' }] } })).toEqual([
      'motion.keyframes.x.0.easing: has an x keyframe with an easing it cannot read',
    ])
  })

  it('names keyframes out of time order, and two at one time', () => {
    const late = {
      keyframes: {
        x: [
          { time: 2, value: 0 },
          { time: 1, value: 1 },
        ],
      },
    }
    const twice = {
      keyframes: {
        x: [
          { time: 1, value: 0 },
          { time: 1, value: 1 },
        ],
      },
    }

    expect(messages(late)).toEqual([
      'motion.keyframes.x.1: has x keyframes that are not in time order, each later than the one before',
    ])
    expect(messages(twice)).toEqual([
      'motion.keyframes.x.1: has x keyframes that are not in time order, each later than the one before',
    ])
  })

  it('names a value a property cannot take', () => {
    expect(messages({ keyframes: { opacity: [{ time: 0, value: 1.5 }] } })).toEqual([
      'motion.keyframes.opacity.0.value: has an opacity keyframe that is not from 0 to 1',
    ])
    expect(messages({ keyframes: { scale: [{ time: 0, value: -1 }] } })).toEqual([
      'motion.keyframes.scale.0.value: has a scale keyframe below 0',
    ])
    expect(messages({ keyframes: { blur: [{ time: 0, value: -0.1 }] } })).toEqual([
      'motion.keyframes.blur.0.value: has a blur keyframe below 0',
    ])
    expect(
      messages({
        keyframes: { x: [{ time: 0, value: -3 }], rotation: [{ time: 0, value: -720 }] },
      }),
    ).toEqual([])
  })
})
