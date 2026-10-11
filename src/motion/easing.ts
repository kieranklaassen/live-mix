// Easing: how a value travels from one point to the next. A curve takes
// progress from 0 to 1 and returns how much of the way the value has gone; it
// may pass 1 on the way, which is overshoot. Every curve here is a pure
// function of its progress.
//
// An easing as a document stores it is a name, a cubic bezier, or a spring,
// given by how much it bounces or by its stiffness, damping and mass:
//
//   'easeOutCubic'
//   { bezier: [0.2, 0, 0, 1] }
//   { spring: { bounce: 0.2 } }
//   { spring: { stiffness: 170, damping: 18, mass: 1 } }

import { MAX_BOUNCE, bounceCurve, springCurve, type SpringConfig } from './spring'

export type Curve = (progress: number) => number

/** The two control points of a cubic bezier from (0, 0) to (1, 1): x1, y1, x2, y2. Each x is within 0 to 1. */
export type Bezier = readonly [number, number, number, number]

// The CSS keywords (CSS Easing Functions Level 1), the bezier forms of the
// classic families (easings.net), and Material Design 3's three.
const BEZIERS = {
  ease: [0.25, 0.1, 0.25, 1],
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
  easeInSine: [0.12, 0, 0.39, 0],
  easeOutSine: [0.61, 1, 0.88, 1],
  easeInOutSine: [0.37, 0, 0.63, 1],
  easeInQuad: [0.11, 0, 0.5, 0],
  easeOutQuad: [0.5, 1, 0.89, 1],
  easeInOutQuad: [0.45, 0, 0.55, 1],
  easeInCubic: [0.32, 0, 0.67, 0],
  easeOutCubic: [0.33, 1, 0.68, 1],
  easeInOutCubic: [0.65, 0, 0.35, 1],
  easeInQuart: [0.5, 0, 0.75, 0],
  easeOutQuart: [0.25, 1, 0.5, 1],
  easeInOutQuart: [0.76, 0, 0.24, 1],
  easeInQuint: [0.64, 0, 0.78, 0],
  easeOutQuint: [0.22, 1, 0.36, 1],
  easeInOutQuint: [0.83, 0, 0.17, 1],
  easeInExpo: [0.7, 0, 0.84, 0],
  easeOutExpo: [0.16, 1, 0.3, 1],
  easeInOutExpo: [0.87, 0, 0.13, 1],
  easeInCirc: [0.55, 0, 1, 0.45],
  easeOutCirc: [0, 0.55, 0.45, 1],
  easeInOutCirc: [0.85, 0, 0.15, 1],
  easeInBack: [0.36, 0, 0.66, -0.56],
  easeOutBack: [0.34, 1.56, 0.64, 1],
  easeInOutBack: [0.68, -0.6, 0.32, 1.6],
  standard: [0.2, 0, 0, 1],
  decelerate: [0.05, 0.7, 0.1, 1],
  accelerate: [0.3, 0, 0.8, 0.15],
} as const satisfies Record<string, Bezier>

/**
 * `linear` is the progress itself. `hold` stays at the first value until the
 * very end. `easyEase` is After Effects' Easy Ease, the bezier
 * (1/3, 0, 2/3, 1), which is the polynomial 3p² − 2p³.
 */
export type EasingName = 'linear' | 'hold' | 'easyEase' | keyof typeof BEZIERS

export const EASING_NAMES: readonly EasingName[] = [
  'linear',
  'hold',
  'easyEase',
  ...(Object.keys(BEZIERS) as (keyof typeof BEZIERS)[]),
]

export type Easing =
  | EasingName
  | { bezier: [number, number, number, number] }
  | { spring: SpringConfig | { bounce: number } }

const clamped =
  (curve: Curve): Curve =>
  (progress) =>
    progress <= 0 ? 0 : progress >= 1 ? 1 : curve(progress)

const LINEAR: Curve = clamped((progress) => progress)
const HOLD: Curve = (progress) => (progress >= 1 ? 1 : 0)
const EASY_EASE: Curve = clamped((progress) => progress * progress * (3 - 2 * progress))

const NEWTON_STEPS = 8
const HALVINGS = 40
const CLOSE = 1e-9

/**
 * The cubic bezier with control points (x1, y1) and (x2, y2) as a curve. The
 * point of the bezier whose x is the progress is found by a fixed number of
 * Newton steps, and by halving when the curve is too steep for them, so the
 * answer depends on the progress and on nothing else.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Curve {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const xAt = (s: number): number => ((ax * s + bx) * s + cx) * s
  const yAt = (s: number): number => ((ay * s + by) * s + cy) * s
  const slopeAt = (s: number): number => (3 * ax * s + 2 * bx) * s + cx

  return clamped((progress) => {
    let s = progress
    for (let step = 0; step < NEWTON_STEPS; step += 1) {
      const off = xAt(s) - progress
      if (Math.abs(off) < CLOSE) return yAt(s)
      const slope = slopeAt(s)
      if (Math.abs(slope) < 1e-6) break
      s -= off / slope
    }

    let low = 0
    let high = 1
    for (let step = 0; step < HALVINGS; step += 1) {
      s = (low + high) / 2
      if (xAt(s) < progress) low = s
      else high = s
    }
    return yAt((low + high) / 2)
  })
}

export const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Whether a stored value is an easing this library reads. */
export function isEasing(value: unknown): value is Easing {
  if (typeof value === 'string') return (EASING_NAMES as readonly string[]).includes(value)
  if (!isRecord(value) || Object.keys(value).length !== 1) return false
  if ('bezier' in value) {
    const points = value.bezier
    return (
      Array.isArray(points) &&
      points.length === 4 &&
      points.every(isNumber) &&
      points[0] >= 0 &&
      points[0] <= 1 &&
      points[2] >= 0 &&
      points[2] <= 1
    )
  }
  if ('spring' in value) {
    const spring = value.spring
    if (!isRecord(spring)) return false
    if ('bounce' in spring)
      return (
        Object.keys(spring).length === 1 &&
        isNumber(spring.bounce) &&
        spring.bounce >= 0 &&
        spring.bounce <= MAX_BOUNCE
      )
    // A spring with no damping never settles, so it has no end to fit to a segment.
    return (
      isNumber(spring.stiffness) &&
      spring.stiffness > 0 &&
      isNumber(spring.damping) &&
      spring.damping > 0 &&
      isNumber(spring.mass) &&
      spring.mass > 0
    )
  }
  return false
}

/** The curve an easing stands for. Make it once and sample it many times. */
export function curveOf(easing: Easing): Curve {
  if (typeof easing === 'string') {
    if (easing === 'linear') return LINEAR
    if (easing === 'hold') return HOLD
    if (easing === 'easyEase') return EASY_EASE
    const [x1, y1, x2, y2]: Bezier = BEZIERS[easing]
    return cubicBezier(x1, y1, x2, y2)
  }
  if ('bezier' in easing) return cubicBezier(...easing.bezier)
  return 'bounce' in easing.spring ? bounceCurve(easing.spring.bounce) : springCurve(easing.spring)
}

/**
 * The control points of an easing that is a cubic bezier: a named curve's, or
 * the easing's own. Null for `hold` and for a spring, which are not beziers.
 * What a curve editor needs to draw a named curve's handles.
 */
export function bezierOf(easing: Easing): Bezier | null {
  if (typeof easing === 'string') {
    if (easing === 'linear') return [0, 0, 1, 1]
    if (easing === 'hold') return null
    if (easing === 'easyEase') return [1 / 3, 0, 2 / 3, 1]
    return BEZIERS[easing]
  }
  return 'bezier' in easing ? easing.bezier : null
}
