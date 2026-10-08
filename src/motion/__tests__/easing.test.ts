import { describe, expect, it } from 'vitest'

import { EASING_NAMES, bezierOf, cubicBezier, curveOf, isEasing, type Easing } from '../easing'

const smoothstep = (value: number): number => value * value * (3 - 2 * value)

describe('the named curves', () => {
  it('each run from 0 to 1', () => {
    for (const name of EASING_NAMES) {
      const curve = curveOf(name)

      expect(curve(0), name).toBe(0)
      expect(curve(1), name).toBe(1)
    }
  })

  it('hold their ends outside 0 to 1', () => {
    for (const name of EASING_NAMES) {
      expect(curveOf(name)(-0.5), name).toBe(0)
      expect(curveOf(name)(1.5), name).toBe(1)
    }
  })

  it('include a hold, which stays at 0 until the very end', () => {
    const hold = curveOf('hold')

    expect(hold(0.5)).toBe(0)
    expect(hold(0.999999)).toBe(0)
    expect(hold(1)).toBe(1)
  })

  it('has a linear that is the progress itself', () => {
    for (const progress of [0.1, 0.37, 0.9]) expect(curveOf('linear')(progress)).toBe(progress)
  })

  it('pins the CSS keywords', () => {
    const at = (name: Easing) =>
      [0.25, 0.5, 0.75].map((progress) => Number(curveOf(name)(progress).toFixed(4)))

    expect(at('ease')).toEqual([0.4085, 0.8024, 0.9605])
    expect(at('easeIn')).toEqual([0.0935, 0.3154, 0.6219])
    expect(at('easeOut')).toEqual([0.3781, 0.6846, 0.9065])
    expect(at('easeInOut')).toEqual([0.1292, 0.5, 0.8708])
  })

  it('pins three of the easings.net curves and Material’s decelerate', () => {
    const at = (name: Easing) =>
      [0.25, 0.5, 0.75].map((progress) => Number(curveOf(name)(progress).toFixed(4)))

    expect(at('easeOutCubic')).toEqual([0.5773, 0.8722, 0.9834])
    expect(at('easeOutQuint')).toEqual([0.7649, 0.9614, 0.9969])
    expect(at('easeInOutQuart')).toEqual([0.0528, 0.5, 0.9472])
    expect(at('decelerate')).toEqual([0.8315, 0.9502, 0.9905])
  })

  it('passes 1 and returns for a curve whose control points lie above 1', () => {
    const back = curveOf('easeOutBack')
    const peak = Math.max(...Array.from({ length: 100 }, (_, index) => back(index / 100)))

    expect(peak).toBeGreaterThan(1.05)
    expect(peak).toBeLessThan(1.15)
    expect(back(1)).toBe(1)
  })
})

describe('Easy Ease', () => {
  it('is the look’s smoothstep, to the bit', () => {
    for (const progress of [0.05, 0.25, 0.5, 0.75, 0.95])
      expect(curveOf('easyEase')(progress)).toBe(smoothstep(progress))
  })

  it('is After Effects’ Easy Ease: the bezier with a third of influence each side', () => {
    const bezier = cubicBezier(1 / 3, 0, 2 / 3, 1)

    for (const progress of [0.1, 0.25, 0.5, 0.75, 0.9])
      expect(bezier(progress)).toBeCloseTo(smoothstep(progress), 6)
  })
})

describe('a cubic bezier', () => {
  it('is a straight line when its control points sit on the diagonal', () => {
    const line = cubicBezier(0.25, 0.25, 0.75, 0.75)

    for (const progress of [0.1, 0.5, 0.8]) expect(line(progress)).toBeCloseTo(progress, 9)
  })

  it('solves a curve that is nearly vertical at its start', () => {
    const steep = cubicBezier(0, 0.9, 0, 1)

    expect(steep(0.001)).toBeGreaterThan(0.2)
    expect(steep(0.5)).toBeGreaterThan(0.95)
    expect(steep(0.5)).toBeLessThan(1)
  })

  it('gives the identical number for the same progress, asked twice or after other calls', () => {
    const curve = cubicBezier(0.22, 1, 0.36, 1)
    const first = curve(0.3)
    for (const progress of [0.9, 0.01, 0.6]) curve(progress)

    expect(curve(0.3)).toBe(first)
    expect(cubicBezier(0.22, 1, 0.36, 1)(0.3)).toBe(first)
  })
})

describe('an easing value', () => {
  it('is a name, a bezier or a spring', () => {
    expect(isEasing('easeOutQuint')).toBe(true)
    expect(isEasing({ bezier: [0.2, 0, 0, 1] })).toBe(true)
    expect(isEasing({ bezier: [0.3, -0.5, 0.7, 1.5] })).toBe(true)
    expect(isEasing({ spring: { stiffness: 170, damping: 18, mass: 1 } })).toBe(true)
    expect(isEasing({ spring: { bounce: 0.2 } })).toBe(true)
    expect(isEasing({ spring: { bounce: 0 } })).toBe(true)
  })

  it('is not an unknown name, a bezier whose x leaves 0 to 1, or a spring that cannot settle', () => {
    expect(isEasing('bouncy')).toBe(false)
    expect(isEasing({ bezier: [1.2, 0, 0.5, 1] })).toBe(false)
    expect(isEasing({ bezier: [0.2, 0, -0.1, 1] })).toBe(false)
    expect(isEasing({ bezier: [0.2, 0, 0.5] })).toBe(false)
    expect(isEasing({ bezier: [0.2, 0, 0.5, Number.NaN] })).toBe(false)
    expect(isEasing({ spring: { stiffness: 170, damping: 0, mass: 1 } })).toBe(false)
    expect(isEasing({ spring: { stiffness: -1, damping: 10, mass: 1 } })).toBe(false)
    expect(isEasing({ spring: { stiffness: 170, damping: 10 } })).toBe(false)
    expect(isEasing({ spring: { bounce: 0.9 } })).toBe(false)
    expect(isEasing({ spring: { bounce: -0.1 } })).toBe(false)
    expect(isEasing({ spring: { bounce: 0.2, mass: 1 } })).toBe(false)
    expect(isEasing({ spring: 0.2 })).toBe(false)
    expect(
      isEasing({ bezier: [0.2, 0, 0, 1], spring: { stiffness: 170, damping: 18, mass: 1 } }),
    ).toBe(false)
    expect(isEasing(null)).toBe(false)
    expect(isEasing(3)).toBe(false)
  })

  it('becomes the curve it names', () => {
    expect(curveOf({ bezier: [0.22, 1, 0.36, 1] })(0.25)).toBe(curveOf('easeOutQuint')(0.25))
    expect(curveOf({ spring: { stiffness: 100, damping: 10, mass: 1 } })(0.3)).toBeGreaterThan(1)
    expect(curveOf({ spring: { bounce: 0.5 } })(0.3)).toBe(
      curveOf({ spring: { stiffness: 100, damping: 10, mass: 1 } })(0.3),
    )
  })
})

describe('an easing’s control points', () => {
  it('are a named curve’s own, and draw the curve the name stands for', () => {
    for (const name of EASING_NAMES) {
      const points = bezierOf(name)
      if (points === null) {
        expect(name).toBe('hold')
        continue
      }
      const curve = cubicBezier(...points)
      for (const progress of [0.1, 0.25, 0.5, 0.75, 0.9])
        expect(curve(progress), name).toBeCloseTo(curveOf(name)(progress), 6)
    }
  })

  it('are a bezier’s own, and a spring has none', () => {
    expect(bezierOf({ bezier: [0.2, 0, 0, 1] })).toEqual([0.2, 0, 0, 1])
    expect(bezierOf({ spring: { bounce: 0.3 } })).toBeNull()
    expect(bezierOf({ spring: { stiffness: 170, damping: 18, mass: 1 } })).toBeNull()
  })
})
