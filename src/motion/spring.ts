// A damped spring released from rest toward a target, by its exact solution.
// Nothing is integrated and nothing is carried from one call to the next, so
// the value at a time is the same number however that time is reached.
//
// Two uses. `springValue` is the spring in real seconds. `springCurve` and
// `bounceCurve` are the same response fitted to a segment: stretched so the
// segment ends where the spring has settled, and landing on exactly 1.
// Fitted, only the damping ratio shows: it sets how much the curve bounces,
// and the segment sets how long it takes (docs/motion.md, "Springs").

export interface SpringConfig {
  stiffness: number
  damping: number
  mass: number
}

/** A spring has settled once it is within this share of its travel from the target. */
export const SETTLED = 0.01

/** The most a spring may bounce: above this a second swing shows. */
export const MAX_BOUNCE = 0.8

// Within this distance of 1 the damping ratio is treated as critical, where
// the other two solutions divide by something close to zero.
const CRITICAL_BAND = 1e-6

/** 1 reaches the target as fast as possible without passing it; less overshoots, more creeps. */
export function dampingRatio({ stiffness, damping, mass }: SpringConfig): number {
  return damping / (2 * Math.sqrt(stiffness * mass))
}

/** Radians per second: how fast the spring is. */
function naturalFrequency({ stiffness, mass }: SpringConfig): number {
  return Math.sqrt(stiffness / mass)
}

/** The response of a spring of damping ratio `zeta`, at `tau` radians of its natural frequency. */
function response(zeta: number, tau: number): number {
  if (tau <= 0) return 0
  if (Math.abs(zeta - 1) < CRITICAL_BAND) return 1 - Math.exp(-tau) * (1 + tau)
  if (zeta < 1) {
    const damped = Math.sqrt(1 - zeta * zeta)
    return (
      1 -
      Math.exp(-zeta * tau) * (Math.cos(damped * tau) + (zeta / damped) * Math.sin(damped * tau))
    )
  }
  const root = Math.sqrt(zeta * zeta - 1)
  const slow = -(zeta - root)
  const fast = -(zeta + root)
  return 1 - (fast * Math.exp(slow * tau) - slow * Math.exp(fast * tau)) / (fast - slow)
}

/**
 * Where the response of damping ratio `zeta` has settled, in radians of its
 * natural frequency: 4.6 over the ratio while the spring swings, 6.6 near
 * critical damping, and found by halving for a spring that creeps.
 */
function settling(zeta: number): number {
  if (zeta <= 0.9) return 4.6 / zeta
  if (zeta <= 1 + CRITICAL_BAND) return 6.6

  let high = 1
  while (1 - response(zeta, high) > SETTLED) high *= 2
  let low = high / 2
  for (let step = 0; step < 60; step += 1) {
    const middle = (low + high) / 2
    if (1 - response(zeta, middle) > SETTLED) low = middle
    else high = middle
  }
  return high
}

/**
 * The response of damping ratio `zeta` over a segment. The last of the way,
 * under a hundredth of the travel, is added in gradually (as the cube of the
 * progress, so the early swing is left as it is) and the curve lands on
 * exactly 1 with nothing to jump at the end.
 */
function fitted(zeta: number): (progress: number) => number {
  const end = settling(zeta)
  const short = 1 - response(zeta, end)
  return (progress) => {
    if (progress <= 0) return 0
    if (progress >= 1) return 1
    return response(zeta, progress * end) + short * progress * progress * progress
  }
}

/** Where a spring released from rest toward 1 is after `time` seconds. */
export function springValue(config: SpringConfig, time: number): number {
  return response(dampingRatio(config), naturalFrequency(config) * time)
}

/** How many seconds the spring takes to settle. */
export function springDuration(config: SpringConfig): number {
  return settling(dampingRatio(config)) / naturalFrequency(config)
}

/** The spring as a curve over a segment: 0 at progress 0, exactly 1 at progress 1. */
export function springCurve(config: SpringConfig): (progress: number) => number {
  return fitted(dampingRatio(config))
}

/**
 * A spring by how much it bounces, from 0, none, to 0.8: the damping ratio is
 * 1 less the bounce. 0.35 is crisp, 0.45 is a pop, 0.55 is playful.
 */
export function bounceCurve(bounce: number): (progress: number) => number {
  return fitted(1 - Math.min(Math.max(bounce, 0), MAX_BOUNCE))
}
