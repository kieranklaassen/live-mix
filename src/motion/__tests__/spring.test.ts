import { describe, expect, it } from 'vitest'

import {
  MAX_BOUNCE,
  SETTLED,
  bounceCurve,
  dampingRatio,
  springCurve,
  springDuration,
  springValue,
  type SpringConfig,
} from '../spring'

/** Remotion's and Motion's default: damping ratio 0.5, ten radians a second. */
const BOUNCY: SpringConfig = { stiffness: 100, damping: 10, mass: 1 }
const CRITICAL: SpringConfig = { stiffness: 100, damping: 20, mass: 1 }
const HEAVY: SpringConfig = { stiffness: 100, damping: 40, mass: 1 }

/**
 * The same spring worked out another way: mass times acceleration is the
 * spring's pull less its damping, integrated from rest by Runge-Kutta in
 * steps of a tenth of a millisecond.
 */
function integrated({ stiffness, damping, mass }: SpringConfig, time: number): number {
  const acceleration = (x: number, v: number): number => (stiffness * (1 - x) - damping * v) / mass
  const steps = Math.round(time / 0.0001)
  const dt = time / steps
  let x = 0
  let v = 0
  for (let step = 0; step < steps; step += 1) {
    const a1 = acceleration(x, v)
    const a2 = acceleration(x + (dt / 2) * v, v + (dt / 2) * a1)
    const v2 = v + (dt / 2) * a1
    const a3 = acceleration(x + (dt / 2) * v2, v + (dt / 2) * a2)
    const v3 = v + (dt / 2) * a2
    const a4 = acceleration(x + dt * v3, v + dt * a3)
    const v4 = v + dt * a3
    x += (dt / 6) * (v + 2 * v2 + 2 * v3 + v4)
    v += (dt / 6) * (a1 + 2 * a2 + 2 * a3 + a4)
  }
  return x
}

const peakOf = (curve: (progress: number) => number): number =>
  Math.max(...Array.from({ length: 2001 }, (_, index) => curve(index / 2000)))

describe('a spring from rest toward 1', () => {
  it('reads its damping ratio from stiffness, damping and mass', () => {
    expect(dampingRatio(BOUNCY)).toBe(0.5)
    expect(dampingRatio(CRITICAL)).toBe(1)
    expect(dampingRatio(HEAVY)).toBe(2)
    expect(dampingRatio({ stiffness: 400, damping: 10, mass: 4 })).toBe(0.125)
  })

  it('starts at 0 and is pinned at five times', () => {
    expect(springValue(BOUNCY, 0)).toBe(0)
    expect(springValue(BOUNCY, 0.1)).toBeCloseTo(0.3403, 6)
    expect(springValue(BOUNCY, 0.2)).toBeCloseTo(0.849426, 6)
    expect(springValue(BOUNCY, 0.4)).toBeCloseTo(1.153123, 6)
    expect(springValue(BOUNCY, 0.8)).toBeCloseTo(0.979007, 6)
    expect(springValue(BOUNCY, 1.6)).toBeCloseTo(0.999721, 6)
  })

  it('peaks where and as high as the closed form says', () => {
    const damped = 10 * Math.sqrt(1 - 0.25)
    const peakTime = Math.PI / damped
    const peak = 1 + Math.exp((-0.5 * Math.PI) / Math.sqrt(0.75))

    expect(peakTime).toBeCloseTo(0.36276, 5)
    expect(springValue(BOUNCY, peakTime)).toBeCloseTo(peak, 12)
    expect(peak).toBeCloseTo(1.16303, 5)
    expect(springValue(BOUNCY, peakTime - 0.01)).toBeLessThan(peak)
    expect(springValue(BOUNCY, peakTime + 0.01)).toBeLessThan(peak)
  })

  it('never passes 1 when critically damped or heavier', () => {
    for (const config of [CRITICAL, HEAVY]) {
      let last = 0
      for (let time = 0; time <= 3; time += 0.01) {
        const value = springValue(config, time)
        expect(value).toBeLessThanOrEqual(1)
        expect(value).toBeGreaterThanOrEqual(last)
        last = value
      }
    }
  })

  it('agrees with the same spring integrated step by step', () => {
    for (const config of [BOUNCY, CRITICAL, HEAVY]) {
      for (let index = 1; index <= 10; index += 1) {
        const time = index * 0.13
        expect(springValue(config, time)).toBeCloseTo(integrated(config, time), 8)
      }
    }
  })

  it('takes 4.6 over its damping ratio to settle while it swings, 6.6 at critical damping, and longer when it creeps', () => {
    expect(springDuration(BOUNCY)).toBeCloseTo(0.92, 12)
    expect(springDuration(CRITICAL)).toBeCloseTo(0.66, 12)
    expect(springDuration(HEAVY)).toBeCloseTo(1.746478, 5)
    for (const config of [BOUNCY, CRITICAL, HEAVY]) {
      expect(Math.abs(springValue(config, springDuration(config)) - 1)).toBeLessThan(SETTLED * 1.4)
    }
  })

  it('takes a time scaled by the spring’s speed: four times the stiffness is twice as fast', () => {
    const fast: SpringConfig = { stiffness: 400, damping: 20, mass: 1 }

    expect(dampingRatio(fast)).toBe(0.5)
    expect(springDuration(fast)).toBeCloseTo(springDuration(BOUNCY) / 2, 12)
    expect(springValue(fast, 0.2)).toBeCloseTo(springValue(BOUNCY, 0.4), 12)
  })
})

describe('a spring fitted to a segment', () => {
  it('starts at exactly 0 and lands on exactly 1, whatever the damping', () => {
    for (const curve of [
      springCurve(BOUNCY),
      springCurve(CRITICAL),
      springCurve(HEAVY),
      bounceCurve(0.45),
      bounceCurve(0),
    ]) {
      expect(curve(0)).toBe(0)
      expect(curve(1)).toBe(1)
      expect(curve(-1)).toBe(0)
      expect(curve(2)).toBe(1)
    }
  })

  it('is the spring’s own response stretched to end where it settles, with nothing to jump at the end', () => {
    const curve = springCurve(BOUNCY)
    const duration = springDuration(BOUNCY)

    // The last of the way is under half a percent here, and comes in as the cube of the progress.
    for (const progress of [0.1, 0.25, 0.5])
      expect(curve(progress)).toBeCloseTo(springValue(BOUNCY, progress * duration), 2)
    expect([0.25, 0.5, 0.75].map((progress) => Number(curve(progress).toFixed(6)))).toEqual([
      0.962648, 1.110524, 0.977247,
    ])
    expect(peakOf(curve)).toBeCloseTo(1.163317, 4)
    expect(Math.abs(curve(0.999) - 1)).toBeLessThan(0.001)
  })

  it('depends on the damping ratio alone: a stiffer spring of the same ratio has the same shape', () => {
    const stiff = springCurve({ stiffness: 900, damping: 30, mass: 1 })
    const soft = springCurve(BOUNCY)

    for (const progress of [0.1, 0.3, 0.6, 0.9])
      expect(stiff(progress)).toBeCloseTo(soft(progress), 12)
  })

  it('gives the identical number for the same progress, asked twice or after other calls', () => {
    const curve = springCurve(BOUNCY)
    const first = curve(0.37)
    for (const progress of [0.9, 0.1, 0.5]) curve(progress)

    expect(curve(0.37)).toBe(first)
    expect(springCurve({ ...BOUNCY })(0.37)).toBe(first)
  })
})

describe('a spring by its bounce', () => {
  it('has a damping ratio of 1 less the bounce: a bounce of 0.5 is the spring of ratio 0.5', () => {
    for (const progress of [0.2, 0.5, 0.8])
      expect(bounceCurve(0.5)(progress)).toBe(springCurve(BOUNCY)(progress))
  })

  it('passes its end by 7% at 0.35, 13% at 0.45 and 21% at 0.55, and not at all at 0', () => {
    expect(peakOf(bounceCurve(0.35))).toBeCloseTo(1.067966, 4)
    expect(peakOf(bounceCurve(0.45))).toBeCloseTo(1.127414, 4)
    expect(peakOf(bounceCurve(0.55))).toBeCloseTo(1.205015, 4)
    expect(peakOf(bounceCurve(0))).toBe(1)
  })

  it('is pinned for no bounce: half the way at a quarter of the time', () => {
    expect(
      [0.25, 0.5, 0.75].map((progress) => Number(bounceCurve(0)(progress).toFixed(6))),
    ).toEqual([0.491229, 0.842695, 0.962215])
  })

  it('bounces no more than the most it may', () => {
    expect(MAX_BOUNCE).toBe(0.8)
    expect(bounceCurve(3)(0.3)).toBe(bounceCurve(0.8)(0.3))
    expect(bounceCurve(-1)(0.3)).toBe(bounceCurve(0)(0.3))
  })
})
