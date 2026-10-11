import { describe, expect, it } from 'vitest'

import {
  NO_POSE,
  PRESETS,
  PRESET_NAMES,
  presetDuration,
  presetPose,
  type MotionPreset,
  type MotionSide,
  type PresetName,
  type PresetPose,
} from '../presets'
import { NEUTRAL_PROFILE, motionProfile } from '../profile'

// The golden tables. The numbers pinned here are the ones docs/motion.md
// gives for each preset, worked out apart from this library. Each row is a
// preset at strength 0.5 under the neutral profile, at 0, 25, 50, 75 and 100%
// of the way through one side. Change a preset with its row and the document.
const STEPS = [0, 0.25, 0.5, 0.75, 1]

function pinned(
  preset: PresetName,
  side: MotionSide,
  property: keyof PresetPose,
  spec: Partial<MotionPreset> = {},
): number[] {
  const pose = presetPose({ preset, ...spec }, side, NEUTRAL_PROFILE)
  return STEPS.map((progress) => Number(pose(progress)[property].toFixed(6)))
}

describe('the presets', () => {
  it('are five, with a slide for each direction, and none and typeOn beside them', () => {
    expect(PRESET_NAMES).toEqual([
      'none',
      'fade',
      'pop',
      'scale',
      'slideUp',
      'slideDown',
      'slideLeft',
      'slideRight',
      'blur',
      'typeOn',
    ])
    expect(Object.keys(PRESETS)).toEqual([...PRESET_NAMES])
  })

  it('each arrive at rest and leave from rest, to the bit', () => {
    for (const preset of PRESET_NAMES) {
      for (const strength of [0, 0.5, 1]) {
        expect(presetPose({ preset, strength }, 'in', NEUTRAL_PROFILE)(1), `${preset} in`).toEqual(
          NO_POSE,
        )
        expect(
          presetPose({ preset, strength }, 'out', NEUTRAL_PROFILE)(0),
          `${preset} out`,
        ).toEqual(NO_POSE)
      }
    }
  })

  it('each drive what their entry says, and nothing else, on both sides', () => {
    for (const preset of PRESET_NAMES) {
      const start = presetPose({ preset, strength: 1 }, 'in', NEUTRAL_PROFILE)(0)
      const end = presetPose({ preset, strength: 1 }, 'out', NEUTRAL_PROFILE)(1)
      const moved = (pose: PresetPose) =>
        (Object.keys(NO_POSE) as (keyof PresetPose)[])
          .filter((property) => pose[property] !== NO_POSE[property])
          .sort()

      expect(moved(start), `${preset} in`).toEqual([...PRESETS[preset].drives].sort())
      expect(moved(end), `${preset} out`).toEqual([...PRESETS[preset].drives].sort())
    }
  })

  it('pins none: nothing moves', () => {
    expect(presetPose({ preset: 'none' }, 'in', NEUTRAL_PROFILE)(0)).toEqual(NO_POSE)
    expect(presetPose({ preset: 'none' }, 'out', NEUTRAL_PROFILE)(1)).toEqual(NO_POSE)
  })

  it('pins fade: opacity eases out on the way in and in on the way out, and strength is not used', () => {
    expect(pinned('fade', 'in', 'opacity')).toEqual([0, 0.577342, 0.872202, 0.983384, 1])
    expect(pinned('fade', 'out', 'opacity')).toEqual([1, 0.983384, 0.872202, 0.577342, 0])
    expect(pinned('fade', 'in', 'opacity', { strength: 1 })).toEqual(
      pinned('fade', 'in', 'opacity'),
    )
    expect(pinned('fade', 'in', 'scale')).toEqual([1, 1, 1, 1, 1])
  })

  it('pins pop: in from 0.6 of its size on a spring of bounce 0.45, solid by 27% of the way; out to 0.8 as it fades', () => {
    expect(pinned('pop', 'in', 'scale')).toEqual([0.6, 0.940055, 1.047336, 1.002867, 1])
    expect(pinned('pop', 'in', 'opacity')).toEqual([0, 0.9375, 1, 1, 1])
    expect(pinned('pop', 'out', 'scale')).toEqual([1, 0.980275, 0.935037, 0.873983, 0.8])
    expect(pinned('pop', 'out', 'opacity')).toEqual([1, 0.901373, 0.675185, 0.369915, 0])
  })

  it('a pop over 0.45 s passes its size at 0.14 s, peaks at 1.05 at 0.20 s and settles back onto its size', () => {
    const pose = presetPose({ preset: 'pop', strength: 0.5 }, 'in', NEUTRAL_PROFILE)
    const scales = Array.from({ length: 451 }, (_, index) => pose(index / 450).scale)
    const peak = Math.max(...scales)

    // One step is a millisecond of the 0.45 s entrance.
    expect(scales[0]).toBe(0.6)
    expect(scales.findIndex((scale) => scale >= 1)).toBeGreaterThanOrEqual(137)
    expect(scales.findIndex((scale) => scale >= 1)).toBeLessThanOrEqual(141)
    expect(peak).toBeCloseTo(1.051, 3)
    expect(scales.indexOf(peak)).toBeGreaterThanOrEqual(200)
    expect(scales.indexOf(peak)).toBeLessThanOrEqual(206)
    expect(Math.min(...scales.slice(300))).toBeGreaterThan(0.99)
    expect(scales[450]).toBe(1)
    expect(pose(0.12 / 0.45).opacity).toBe(1)
  })

  it('pins scale: in from 0.92 with no overshoot, solid by 43% of the way; out to 0.96 as it fades', () => {
    expect(pinned('scale', 'in', 'scale')).toEqual([0.92, 0.975087, 0.994728, 0.999516, 1])
    expect(pinned('scale', 'in', 'opacity')).toEqual([0, 0.583333, 1, 1, 1])
    expect(pinned('scale', 'out', 'scale')).toEqual([1, 0.999335, 0.994888, 0.983094, 0.96])
    expect(pinned('scale', 'out', 'opacity')).toEqual([1, 0.983384, 0.872202, 0.577342, 0])
    expect(
      Math.max(
        ...Array.from(
          { length: 101 },
          (_, index) => presetPose({ preset: 'scale' }, 'in')(index / 100).scale,
        ),
      ),
    ).toBe(1)
  })

  it('pins the slides: in from 6% of the height behind, solid by 37% of the way; out by 4% the same way, fading throughout', () => {
    const closing = [0.06, 0.010463, 0.001693, 0.000139, 0]
    const leaving = [0, 0.000093, 0.001129, 0.006975, 0.04]
    const other = (values: number[]) => values.map((value) => (value === 0 ? 0 : -value))

    // Up arrives from below (a positive offset down) and leaves upward.
    expect(pinned('slideUp', 'in', 'offsetY')).toEqual(closing)
    expect(pinned('slideUp', 'out', 'offsetY')).toEqual(other(leaving))
    expect(pinned('slideDown', 'in', 'offsetY')).toEqual(other(closing))
    expect(pinned('slideDown', 'out', 'offsetY')).toEqual(leaving)
    // Left arrives from the right and leaves to the left.
    expect(pinned('slideLeft', 'in', 'offsetX')).toEqual(closing)
    expect(pinned('slideLeft', 'out', 'offsetX')).toEqual(other(leaving))
    expect(pinned('slideRight', 'in', 'offsetX')).toEqual(other(closing))
    expect(pinned('slideRight', 'out', 'offsetX')).toEqual(leaving)
    expect(pinned('slideUp', 'in', 'offsetX')).toEqual([0, 0, 0, 0, 0])
    expect(pinned('slideLeft', 'in', 'opacity')).toEqual([0, 0.666667, 1, 1, 1])
    expect(pinned('slideLeft', 'out', 'opacity')).toEqual([1, 0.75, 0.5, 0.25, 0])
  })

  it('pins blur: in from 1.2% of the height, opacity with it; out the reverse', () => {
    expect(pinned('blur', 'in', 'blur')).toEqual([0.012, 0.005072, 0.001534, 0.000199, 0])
    expect(pinned('blur', 'in', 'opacity')).toEqual([0, 0.577342, 0.872202, 0.983384, 1])
    expect(pinned('blur', 'out', 'blur')).toEqual([0, 0.000199, 0.001534, 0.005072, 0.012])
    expect(pinned('blur', 'out', 'opacity')).toEqual([1, 0.983384, 0.872202, 0.577342, 0])
  })

  it('pins typeOn: characters at a steady rate, taken back from the end on the way out', () => {
    expect(pinned('typeOn', 'in', 'reveal')).toEqual([0, 0.25, 0.5, 0.75, 1])
    expect(pinned('typeOn', 'in', 'opacity')).toEqual([0, 1, 1, 1, 1])
    expect(pinned('typeOn', 'out', 'reveal')).toEqual([1, 0.75, 0.5, 0.25, 0])
    expect(pinned('typeOn', 'out', 'opacity')).toEqual([1, 1, 1, 1, 0])
  })

  it('starts twice as far from rest at full strength as at half, and at rest at none', () => {
    const start = (preset: PresetName, strength: number) =>
      presetPose({ preset, strength }, 'in', NEUTRAL_PROFILE)(0)

    expect(1 - start('pop', 1).scale).toBeCloseTo(2 * (1 - start('pop', 0.5).scale), 12)
    expect(1 - start('scale', 1).scale).toBeCloseTo(2 * (1 - start('scale', 0.5).scale), 12)
    expect(start('slideUp', 1).offsetY).toBeCloseTo(2 * start('slideUp', 0.5).offsetY, 12)
    expect(start('blur', 1).blur).toBeCloseTo(2 * start('blur', 0.5).blur, 12)
    for (const preset of PRESET_NAMES) {
      // Opacity and what is typed start from nothing; the place, the size and the blur do not move.
      expect({ ...start(preset, 0), opacity: 1, reveal: 1 }, preset).toEqual(NO_POSE)
    }
  })

  it('holds its ends outside its side', () => {
    const pose = presetPose({ preset: 'slideRight' }, 'in', NEUTRAL_PROFILE)

    expect(pose(-0.5)).toEqual(pose(0))
    expect(pose(1.5)).toEqual(NO_POSE)
  })
})

describe('a pop’s bounce', () => {
  const peak = (spec: Partial<MotionPreset>, profile = NEUTRAL_PROFILE) => {
    const pose = presetPose({ preset: 'pop', strength: 0.5, ...spec }, 'in', profile)
    return Math.max(...Array.from({ length: 901 }, (_, index) => pose(index / 900).scale))
  }

  it('is 0.45 unless the layer says: 0.35 reads as crisp at a scale of 1.03, 0.55 as playful at 1.08', () => {
    expect(peak({})).toBeCloseTo(peak({ bounce: 0.45 }), 12)
    expect(peak({ bounce: 0.35 })).toBeCloseTo(1.027, 3)
    expect(peak({ bounce: 0.55 })).toBeCloseTo(1.082, 3)
    expect(peak({ bounce: 0 })).toBe(1)
  })

  it('is multiplied by the profile’s overshoot, and none of it is left at 0', () => {
    expect(peak({}, motionProfile({ overshoot: 0 }))).toBe(1)
    expect(peak({}, motionProfile({ overshoot: 0.35 / 0.45 }))).toBeCloseTo(
      peak({ bounce: 0.35 }),
      6,
    )
    expect(peak({}, motionProfile({ overshoot: 3 }))).toBe(peak({ bounce: 0.8 }))
  })
})

describe('a preset’s length', () => {
  it('is its own default, and going out about half of coming in', () => {
    const lengths = Object.fromEntries(
      PRESET_NAMES.filter((name) => name !== 'typeOn').map((name) => [
        name,
        [presetDuration({ preset: name }, 'in'), presetDuration({ preset: name }, 'out')],
      ]),
    )

    expect(lengths).toEqual({
      none: [0, 0],
      fade: [0.3, 0.2],
      pop: [0.45, 0.2],
      scale: [0.35, 0.2],
      slideUp: [0.4, 0.25],
      slideDown: [0.4, 0.25],
      slideLeft: [0.4, 0.25],
      slideRight: [0.4, 0.25],
      blur: [0.5, 0.3],
    })
  })

  it('is the layer’s own when it gives one, on either side', () => {
    expect(presetDuration({ preset: 'pop', duration: 0.8 }, 'in')).toBe(0.8)
    expect(presetDuration({ preset: 'pop', duration: 0.8 }, 'out')).toBe(0.8)
    expect(presetDuration({ preset: 'pop', duration: 0 }, 'in')).toBe(0)
  })

  it('follows the text for typeOn: 0.035 s a character, from 0.3 to 2 s, and 60% of that going out', () => {
    const typing = (characters: number, side: MotionSide = 'in') =>
      presetDuration({ preset: 'typeOn' }, side, { characters })

    expect(typing(20)).toBeCloseTo(0.7, 12)
    expect(typing(3)).toBe(0.3)
    expect(typing(200)).toBe(2)
    expect(typing(0)).toBe(0.3)
    expect(typing(20, 'out')).toBeCloseTo(0.42, 12)
  })

  it('is scaled by the profile, a chosen length included', () => {
    const slow = motionProfile({ durationScale: 2 })

    expect(presetDuration({ preset: 'pop' }, 'in', { profile: slow })).toBe(0.9)
    expect(presetDuration({ preset: 'pop', duration: 0.3 }, 'in', { profile: slow })).toBe(0.6)
  })
})

describe('a preset under a profile’s ease', () => {
  it('moves a slide, a scale and a blur on that curve: a linear ease makes a slide’s offset a straight line', () => {
    const linear = motionProfile({ ease: 'linear' })
    const pose = presetPose({ preset: 'slideUp', strength: 1 }, 'in', linear)

    expect(pose(0.25).offsetY).toBeCloseTo(0.09, 12)
    expect(pose(0.5).offsetY).toBeCloseTo(0.06, 12)
    expect(presetPose({ preset: 'scale', strength: 1 }, 'in', linear)(0.5).scale).toBeCloseTo(
      0.92,
      12,
    )
    expect(presetPose({ preset: 'blur', strength: 1 }, 'in', linear)(0.5).blur).toBeCloseTo(
      0.012,
      12,
    )
  })

  it('leaves on the same curve played backwards', () => {
    const eased = motionProfile({ ease: 'easeOutQuint' })
    const leaving = presetPose({ preset: 'scale', strength: 1 }, 'out', eased)
    const arriving = presetPose({ preset: 'scale', strength: 1 }, 'in', eased)

    // How far it has gone at a quarter of the way out is how far it still had to come at three quarters of the way in.
    expect((1 - leaving(0.25).scale) / 0.08).toBeCloseTo((1 - arriving(0.75).scale) / 0.16, 12)
  })

  it('leaves a fade and a pop’s spring alone', () => {
    const eased = motionProfile({ ease: 'linear' })

    for (const progress of STEPS) {
      expect(presetPose({ preset: 'fade' }, 'in', eased)(progress)).toEqual(
        presetPose({ preset: 'fade' }, 'in')(progress),
      )
      expect(presetPose({ preset: 'pop' }, 'in', eased)(progress)).toEqual(
        presetPose({ preset: 'pop' }, 'in')(progress),
      )
    }
  })
})
