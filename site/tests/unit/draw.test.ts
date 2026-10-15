import { describe, expect, it } from 'vitest'
import {
  AUDIBLE,
  binHz,
  fromUnit,
  hzToX,
  label,
  minMaxColumns,
  minMaxPlaced,
  roomyAxis,
  ticks,
  toUnit,
  withUnit,
} from '../../src/figures/draw.ts'

describe('a wave in pixel columns', () => {
  it('gives each column the least and the most of its samples', () => {
    const data = new Float32Array(192_000)
    let seed = 7
    for (let i = 0; i < data.length; i += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      data[i] = seed / 2147483648 - 1
    }
    const columns = 600
    const ends = minMaxColumns(data, 0, data.length, columns)
    expect(ends.length).toBe(columns * 2)
    for (const column of [0, 1, 299, 598, 599]) {
      const a = Math.floor((column * data.length) / columns)
      const b = Math.floor(((column + 1) * data.length) / columns)
      let lo = Infinity
      let hi = -Infinity
      for (let i = a; i < b; i += 1) {
        lo = Math.min(lo, data[i]!)
        hi = Math.max(hi, data[i]!)
      }
      expect(ends[2 * column]).toBe(lo)
      expect(ends[2 * column + 1]).toBe(hi)
    }
  })

  it('draws an empty tap as a flat line and does not throw', () => {
    const ends = minMaxColumns(new Float32Array(0), 0, 0, 40)
    expect(Array.from(ends).every((value) => value === 0)).toBe(true)
  })

  it('keeps a stretch of the signal to that stretch', () => {
    const data = Float32Array.from({ length: 100 }, (_, i) => i)
    const ends = minMaxColumns(data, 20, 30, 5)
    expect(Array.from(ends)).toEqual([20, 21, 22, 23, 24, 25, 26, 27, 28, 29])
  })

  it('places points that do not stand evenly, and leaves the empty columns empty', () => {
    const ends = minMaxPlaced([1, 5, 3], (i) => [0.05, 0.06, 0.95][i]!, 10)
    expect(ends[0]).toBe(1)
    expect(ends[1]).toBe(5)
    expect(ends[18]).toBe(3)
    expect(Number.isNaN(ends[4])).toBe(true)
  })
})

describe('the frequency axis', () => {
  it('puts 1 kHz at the same place whatever the size of the transform', () => {
    const width = 700
    const places = [1024, 4096, 16384].map((size) => {
      const bins = size / 2 + 1
      const bin = (1000 * size) / 48_000
      return hzToX(binHz(bin, bins, 48_000), width)
    })
    expect(places[1]).toBeCloseTo(places[0]!, 9)
    expect(places[2]).toBeCloseTo(places[0]!, 9)
    // On the audible band's logarithmic axis 1 kHz stands 56.6 % of the way across.
    expect(places[0]! / width).toBeCloseTo(Math.log(50) / Math.log(1000), 9)
  })

  it('goes there and back on a linear and on a logarithmic axis', () => {
    for (const axis of [{ min: -60, max: 0 }, AUDIBLE]) {
      for (const unit of [0, 0.25, 0.5, 1]) {
        expect(toUnit(axis, fromUnit(axis, unit))).toBeCloseTo(unit, 9)
      }
    }
  })
})

describe('the grid', () => {
  it('finds round values on a linear axis', () => {
    expect(ticks({ min: -60, max: 0 }, 6)).toEqual([-60, -50, -40, -30, -20, -10, 0])
    expect(ticks({ min: -1, max: 1 }, 4)).toEqual([-1, -0.5, 0, 0.5, 1])
  })

  it('steps 1, 2, 5 through each decade of a logarithmic axis', () => {
    expect(ticks(AUDIBLE)).toEqual([20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000])
  })

  it('prints numbers short, with a real minus sign', () => {
    expect(label(1500)).toBe('1.5k')
    expect(label(20000)).toBe('20k')
    expect(label(-12)).toBe('−12')
    expect(label(0.25)).toBe('0.25')
    expect(label(0)).toBe('0')
    expect(withUnit(4, ':1')).toBe('4:1')
    expect(withUnit(-24, 'dB')).toBe('−24 dB')
    expect(withUnit(0.5, '')).toBe('0.5')
  })

  it('fits an axis with round ends around what it must hold', () => {
    expect(roomyAxis(-37, -2)).toEqual({ min: -40, max: 0 })
    const flat = roomyAxis(3, 3)
    expect(flat.min).toBeLessThan(3)
    expect(flat.max).toBeGreaterThan(3)
  })
})
