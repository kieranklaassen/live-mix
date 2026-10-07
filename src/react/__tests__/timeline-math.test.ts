import { describe, expect, it } from 'vitest'

import {
  clampPxPerSecond,
  DEFAULT_PX_PER_SECOND,
  fitPxPerSecond,
  MAX_PX_PER_SECOND,
  MIN_PX_PER_SECOND,
  pageScroll,
  rulerLabels,
  rulerScale,
  zoomAround,
} from '../components/timeline-math'

describe('rulerScale', () => {
  it('picks its ticks from the scale, in four steps', () => {
    expect(rulerScale(400)).toEqual({ minorSec: 0.1, labelSec: 1, majorColumns: 10 })
    expect(rulerScale(100)).toEqual({ minorSec: 0.1, labelSec: 1, majorColumns: 10 })
    expect(rulerScale(99)).toEqual({ minorSec: 2, labelSec: 10, majorColumns: 5 })
    expect(rulerScale(20)).toEqual({ minorSec: 2, labelSec: 10, majorColumns: 5 })
    expect(rulerScale(19)).toEqual({ minorSec: 10, labelSec: 30, majorColumns: 3 })
    expect(rulerScale(5)).toEqual({ minorSec: 10, labelSec: 30, majorColumns: 3 })
    expect(rulerScale(4.9)).toEqual({ minorSec: 30, labelSec: 120, majorColumns: 4 })
    expect(rulerScale(2)).toEqual({ minorSec: 30, labelSec: 120, majorColumns: 4 })
  })

  it('a label is a whole number of minor ticks, and never closer than 100 px to the next', () => {
    for (const scale of [2, 4.9, 5, 19, 20, 99, 100, 400]) {
      const { minorSec, labelSec, majorColumns } = rulerScale(scale)
      expect(minorSec * majorColumns, String(scale)).toBeCloseTo(labelSec, 9)
      expect(labelSec * scale, String(scale)).toBeGreaterThanOrEqual(100)
    }
  })
})

describe('rulerLabels', () => {
  it('lists the labelled ticks of a window from its start', () => {
    expect(rulerLabels(0, 500, 20)).toEqual([
      { time: 0, x: 0 },
      { time: 10, x: 200 },
      { time: 20, x: 400 },
    ])
  })

  it('begins at the first tick at or after the start', () => {
    const ticks = rulerLabels(95, 400, 20)
    expect(ticks.map((tick) => tick.time)).toEqual([100, 110])
    expect(ticks[0].x).toBe(100)
  })

  it('keeps tenths whole at a fine scale', () => {
    const ticks = rulerLabels(0.3, 250, 100)
    expect(ticks.map((tick) => tick.time)).toEqual([1, 2])
    expect(ticks[0].x).toBeCloseTo(70, 9)
  })

  it('is empty for a window of no width or a scale of nothing', () => {
    expect(rulerLabels(0, 0, 20)).toEqual([])
    expect(rulerLabels(0, 400, 0)).toEqual([])
    expect(rulerLabels(0, 400, Number.NaN)).toEqual([])
  })
})

describe('zoomAround', () => {
  it('keeps the time under the anchor where it was', () => {
    // 20 px/s, scrolled 300 px, the pointer 100 px in: second 20 is under it.
    const zoomed = zoomAround(20, 2, 100, 300)
    expect(zoomed.pxPerSecond).toBe(40)
    expect((zoomed.scrollPx + 100) / zoomed.pxPerSecond).toBe(20)
  })

  it('stops at the limits and never scrolls before the start', () => {
    expect(zoomAround(300, 2, 0, 0).pxPerSecond).toBe(MAX_PX_PER_SECOND)
    expect(zoomAround(3, 0.5, 0, 0).pxPerSecond).toBe(MIN_PX_PER_SECOND)
    expect(zoomAround(40, 0.5, 600, 0).scrollPx).toBe(0)
  })
})

describe('fitPxPerSecond and clampPxPerSecond', () => {
  it('fits a length to a width, inside the limits', () => {
    expect(fitPxPerSecond(600, 1200)).toBe(2)
    expect(fitPxPerSecond(60, 1200)).toBe(20)
    expect(fitPxPerSecond(1, 1200)).toBe(MAX_PX_PER_SECOND)
    expect(fitPxPerSecond(6000, 1200)).toBe(MIN_PX_PER_SECOND)
  })

  it('answers the default for nothing to fit', () => {
    expect(fitPxPerSecond(0, 1200)).toBe(DEFAULT_PX_PER_SECOND)
    expect(fitPxPerSecond(60, 0)).toBe(DEFAULT_PX_PER_SECOND)
    expect(clampPxPerSecond(Number.NaN)).toBe(DEFAULT_PX_PER_SECOND)
    expect(clampPxPerSecond(1)).toBe(MIN_PX_PER_SECOND)
    expect(clampPxPerSecond(1000)).toBe(MAX_PX_PER_SECOND)
  })
})

describe('pageScroll', () => {
  it('leaves the window alone while the playhead is in it', () => {
    expect(pageScroll(500, 200, 800)).toBe(200)
    expect(pageScroll(999, 200, 800)).toBe(200)
  })

  it('turns the page when the playhead reaches the right edge', () => {
    expect(pageScroll(1000, 200, 800)).toBe(1000)
  })

  it('goes back to a playhead that is left of the window', () => {
    expect(pageScroll(50, 200, 800)).toBe(50)
  })
})
