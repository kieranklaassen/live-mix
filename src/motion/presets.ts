// The presets: the named ways a layer arrives and leaves. Each has an in and
// an out of its own, defined here by what it does to the layer's scale,
// opacity, blur and place over its length. docs/motion.md gives each
// number and says why it is what it is, and the golden tables in
// `__tests__/presets.test.ts` pin them.
//
// What a preset does is laid over the layer: it multiplies scale and
// opacity and adds an offset and a blur, on top of the layer's rest pose and
// its keyframes.

import { cubicBezier, curveOf, type Curve } from './easing'
import { NEUTRAL_PROFILE, type MotionProfile } from './profile'
import { bounceCurve } from './spring'

export const PRESET_NAMES = [
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
] as const
export type PresetName = (typeof PRESET_NAMES)[number]

/** A layer's entrance or exit as a document stores it. */
export interface MotionPreset {
  preset: PresetName
  /** Seconds. Left out, the preset's own length. */
  duration?: number
  /** From 0 to 1: how far from rest the layer starts, or ends. Left out, 0.5. */
  strength?: number
  /** For a pop arriving: how much its spring bounces, from 0 to 0.8. Left out, 0.45. */
  bounce?: number
}

export type MotionSide = 'in' | 'out'

/** What an entrance or exit lays over a layer at one moment. */
export interface PresetPose {
  /** Multiplies the layer's scale. */
  scale: number
  /** Multiplies the layer's opacity. */
  opacity: number
  /** Added to the layer's blur, as a fraction of the output's height. */
  blur: number
  /** How much of the layer's text shows, from 0 to 1. */
  reveal: number
  /** How far the layer is moved right and down from its place, as fractions of the output's height. */
  offsetX: number
  offsetY: number
}

/** A preset that is doing nothing. */
export const NO_POSE: Readonly<PresetPose> = {
  scale: 1,
  opacity: 1,
  blur: 0,
  reveal: 1,
  offsetX: 0,
  offsetY: 0,
}

/** The strength a preset has when the layer does not give one: 1 is twice as far from rest. */
export const DEFAULT_STRENGTH = 0.5

/** How much a pop bounces when the layer does not say: a 13% overshoot of its travel. */
export const DEFAULT_BOUNCE = 0.45

// The presets' curves (docs/motion.md, "Presets"), as cubic beziers.
const EASE_OUT = cubicBezier(0.33, 1, 0.68, 1)
const EASE_IN = cubicBezier(0.32, 0, 0.67, 0)
const POP_OUT = cubicBezier(0.4, 0, 1, 1)
const SLIDE_IN = cubicBezier(0.16, 1, 0.3, 1)
const SLIDE_OUT = cubicBezier(0.7, 0, 0.84, 0)
const SCALE_IN = cubicBezier(0.25, 1, 0.5, 1)

// How far from rest each preset starts, and ends, at strength 1.
const POP_FROM = 0.8
const POP_TO = 0.4
const SCALE_FROM = 0.16
const SCALE_TO = 0.08
const SLIDE_FROM = 0.12
const SLIDE_TO = 0.08
const BLUR_AMOUNT = 0.024

// Opacity leads: the layer is solid this far into its entrance, so its landing is seen whole.
const POP_LEAD = 0.12 / 0.45
const SLIDE_LEAD = 0.15 / 0.4
const SCALE_LEAD = 0.15 / 0.35
const TYPE_LEAD = 0.1

// A typed entrance takes this long a character, within these bounds, and its exit this share of that.
const TYPE_SECONDS_PER_CHARACTER = 0.035
const TYPE_SHORTEST = 0.3
const TYPE_LONGEST = 2
const TYPE_EXIT = 0.6

export interface PresetInfo {
  /** What it changes. */
  drives: readonly (keyof PresetPose)[]
  /** Seconds in and out under the neutral profile; null where the length follows the text. */
  duration: { in: number; out: number } | null
  /** False where strength changes nothing. */
  usesStrength: boolean
  /** True where the layer needs text. */
  needsText: boolean
}

const slide = (axis: 'offsetX' | 'offsetY'): PresetInfo => ({
  drives: [axis, 'opacity'],
  duration: { in: 0.4, out: 0.25 },
  usesStrength: true,
  needsText: false,
})

/** Every preset: what it drives and how long it plays. */
export const PRESETS: Record<PresetName, PresetInfo> = {
  none: { drives: [], duration: { in: 0, out: 0 }, usesStrength: false, needsText: false },
  fade: {
    drives: ['opacity'],
    duration: { in: 0.3, out: 0.2 },
    usesStrength: false,
    needsText: false,
  },
  pop: {
    drives: ['scale', 'opacity'],
    duration: { in: 0.45, out: 0.2 },
    usesStrength: true,
    needsText: false,
  },
  scale: {
    drives: ['scale', 'opacity'],
    duration: { in: 0.35, out: 0.2 },
    usesStrength: true,
    needsText: false,
  },
  slideUp: slide('offsetY'),
  slideDown: slide('offsetY'),
  slideLeft: slide('offsetX'),
  slideRight: slide('offsetX'),
  blur: {
    drives: ['blur', 'opacity'],
    duration: { in: 0.5, out: 0.3 },
    usesStrength: true,
    needsText: false,
  },
  typeOn: { drives: ['reveal', 'opacity'], duration: null, usesStrength: false, needsText: true },
}

/** The way each slide travels, right and down positive. It arrives from behind and leaves ahead. */
const TRAVEL: Record<
  'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight',
  readonly [number, number]
> = {
  slideUp: [0, -1],
  slideDown: [0, 1],
  slideLeft: [-1, 0],
  slideRight: [1, 0],
}

export interface PresetContext {
  profile?: MotionProfile
  /** How many characters the layer's text has, for a typed entrance. */
  characters?: number
}

/**
 * How many seconds a preset plays on one side, before it is cut to fit its
 * layer: the layer's own length for it, or the preset's, times the profile's
 * duration scale.
 */
export function presetDuration(
  spec: MotionPreset,
  side: MotionSide,
  context: PresetContext = {},
): number {
  let seconds = spec.duration
  if (seconds === undefined) {
    const own = PRESETS[spec.preset].duration
    if (own) seconds = own[side]
    else {
      const typing = Math.min(
        Math.max((context.characters ?? 0) * TYPE_SECONDS_PER_CHARACTER, TYPE_SHORTEST),
        TYPE_LONGEST,
      )
      seconds = side === 'in' ? typing : typing * TYPE_EXIT
    }
  }
  return seconds * (context.profile ?? NEUTRAL_PROFILE).durationScale
}

const clamped = (value: number): number => Math.min(Math.max(value, 0), 1)

/** Opacity that rises in a straight line over the first `share` of an entrance. */
const leading = (share: number, progress: number): number => clamped(progress / share)

/** `distance` times `share`, and exactly 0 at none of it: a distance toward the left or the top never comes out as a negative zero. */
const along = (distance: number, share: number): number => (share === 0 ? 0 : distance * share + 0)

/** A curve played backwards: an arrival that decelerates, as a departure that accelerates. */
const backwards =
  (curve: Curve): Curve =>
  (progress) =>
    1 - curve(1 - progress)

/**
 * What a preset lays over its layer on one side, by progress through that
 * side: for an entrance 0 is where it starts and 1 is rest; for an exit 0 is
 * rest and 1 is gone. Make it once per layer and sample it per frame.
 */
export function presetPose(
  spec: MotionPreset,
  side: MotionSide,
  profile: MotionProfile = NEUTRAL_PROFILE,
): (progress: number) => PresetPose {
  const strength = spec.strength ?? DEFAULT_STRENGTH
  const arriving = side === 'in'
  // A profile's ease takes the place of a slide's, a scale's and a blur's own curve.
  const styled =
    profile.ease === null
      ? null
      : arriving
        ? curveOf(profile.ease)
        : backwards(curveOf(profile.ease))

  switch (spec.preset) {
    case 'none':
      return () => ({ ...NO_POSE })
    case 'fade':
      return arriving
        ? (progress) => ({ ...NO_POSE, opacity: EASE_OUT(progress) })
        : (progress) => ({ ...NO_POSE, opacity: 1 - EASE_IN(progress) })
    case 'pop': {
      if (!arriving)
        return (progress) => ({
          ...NO_POSE,
          scale: 1 - POP_TO * strength * POP_OUT(progress),
          opacity: 1 - POP_OUT(progress),
        })
      const spring = bounceCurve((spec.bounce ?? DEFAULT_BOUNCE) * profile.overshoot)
      return (progress) => ({
        ...NO_POSE,
        scale: 1 - POP_FROM * strength * (1 - spring(progress)),
        opacity: leading(POP_LEAD, progress),
      })
    }
    case 'scale': {
      const curve = styled ?? (arriving ? SCALE_IN : EASE_IN)
      return arriving
        ? (progress) => ({
            ...NO_POSE,
            scale: 1 - SCALE_FROM * strength * (1 - curve(progress)),
            opacity: leading(SCALE_LEAD, progress),
          })
        : (progress) => ({
            ...NO_POSE,
            scale: 1 - SCALE_TO * strength * curve(progress),
            opacity: 1 - curve(progress),
          })
    }
    case 'slideUp':
    case 'slideDown':
    case 'slideLeft':
    case 'slideRight': {
      const [right, down] = TRAVEL[spec.preset]
      const curve = styled ?? (arriving ? SLIDE_IN : SLIDE_OUT)
      // Arriving, it starts behind its place and closes the gap; leaving, it moves on the same way.
      const from = -SLIDE_FROM * strength
      const to = SLIDE_TO * strength
      return arriving
        ? (progress) => ({
            ...NO_POSE,
            offsetX: along(right * from, 1 - curve(progress)),
            offsetY: along(down * from, 1 - curve(progress)),
            opacity: leading(SLIDE_LEAD, progress),
          })
        : (progress) => ({
            ...NO_POSE,
            offsetX: along(right * to, curve(progress)),
            offsetY: along(down * to, curve(progress)),
            opacity: 1 - clamped(progress),
          })
    }
    case 'blur': {
      const curve = styled ?? (arriving ? EASE_OUT : EASE_IN)
      return arriving
        ? (progress) => ({
            ...NO_POSE,
            blur: BLUR_AMOUNT * strength * (1 - curve(progress)),
            opacity: curve(progress),
          })
        : (progress) => ({
            ...NO_POSE,
            blur: BLUR_AMOUNT * strength * curve(progress),
            opacity: 1 - curve(progress),
          })
    }
    case 'typeOn':
      // Typed on from its first character; taken back from its last.
      return arriving
        ? (progress) => ({
            ...NO_POSE,
            reveal: clamped(progress),
            opacity: leading(TYPE_LEAD, progress),
          })
        : (progress) => ({
            ...NO_POSE,
            reveal: 1 - clamped(progress),
            opacity: leading(TYPE_LEAD, 1 - progress),
          })
  }
}
