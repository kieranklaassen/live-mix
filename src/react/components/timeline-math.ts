// The arithmetic under a timeline that is drawn to scale: one second is
// `pxPerSecond` wide. Pure functions, so a host that scrolls, zooms or draws
// its own ruler reads the same numbers `TimeRuler` and `Overview` do.

/** The scale's limits and where it starts, in px per second. */
export const MIN_PX_PER_SECOND = 2
export const MAX_PX_PER_SECOND = 400
export const DEFAULT_PX_PER_SECOND = 20

export interface RulerScale {
  /** Seconds between minor ticks: the width of a field column. */
  minorSec: number
  /** Seconds between labelled ticks. */
  labelSec: number
  /** Minor ticks per label: a field's `majorColumns`. */
  majorColumns: number
}

/** A scale kept inside its limits; anything that is no number is the default. */
export function clampPxPerSecond(pxPerSecond: number): number {
  if (!Number.isFinite(pxPerSecond)) return DEFAULT_PX_PER_SECOND
  return Math.min(Math.max(pxPerSecond, MIN_PX_PER_SECOND), MAX_PX_PER_SECOND)
}

/**
 * Which ticks a ruler draws at a scale: tenths under a second from 100 px per
 * second, two seconds under ten from 20, ten under thirty from 5, and thirty
 * under two minutes below that.
 */
export function rulerScale(pxPerSecond: number): RulerScale {
  if (pxPerSecond >= 100) return { minorSec: 0.1, labelSec: 1, majorColumns: 10 }
  if (pxPerSecond >= 20) return { minorSec: 2, labelSec: 10, majorColumns: 5 }
  if (pxPerSecond >= 5) return { minorSec: 10, labelSec: 30, majorColumns: 3 }
  return { minorSec: 30, labelSec: 120, majorColumns: 4 }
}

export interface RulerTick {
  /** Seconds on the timeline. */
  time: number
  /** Px from the left edge of the window. */
  x: number
}

/** The labelled ticks in a window that starts at `start` seconds and is `width` px wide. */
export function rulerLabels(start: number, width: number, pxPerSecond: number): RulerTick[] {
  if (!(pxPerSecond > 0) || !(width > 0)) return []
  const { labelSec } = rulerScale(pxPerSecond)
  const from = Math.max(0, start)
  const first = Math.ceil(from / labelSec - 1e-9)
  const last = Math.floor((from + width / pxPerSecond) / labelSec + 1e-9)
  const ticks: RulerTick[] = []
  for (let index = first; index <= last; index += 1) {
    // Whole steps of the label, so a tenth never drifts into 0.30000000000000004.
    const time = Number((index * labelSec).toFixed(3))
    ticks.push({ time, x: (time - start) * pxPerSecond })
  }
  return ticks
}

export interface TimelineZoom {
  pxPerSecond: number
  /** The scroll, in px, that keeps the anchor where it was. */
  scrollPx: number
}

/**
 * A change of scale around a place on screen: the time under `anchorPx` (px
 * from the left edge of the window) is under it afterwards too.
 */
export function zoomAround(
  pxPerSecond: number,
  factor: number,
  anchorPx: number,
  scrollPx: number,
): TimelineZoom {
  const next = clampPxPerSecond(pxPerSecond * factor)
  const time = (scrollPx + anchorPx) / pxPerSecond
  return { pxPerSecond: next, scrollPx: Math.max(0, time * next - anchorPx) }
}

/** The scale at which `durationSec` is exactly `widthPx` wide, inside the limits. */
export function fitPxPerSecond(durationSec: number, widthPx: number): number {
  if (!(durationSec > 0) || !(widthPx > 0)) return DEFAULT_PX_PER_SECOND
  return clampPxPerSecond(widthPx / durationSec)
}

/**
 * Where a window `widthPx` wide scrolls to so a playing playhead stays in it:
 * the scroll it has while the playhead is inside, and a window that starts at
 * the playhead once it has passed the right edge or is left of the window.
 */
export function pageScroll(playheadPx: number, scrollPx: number, widthPx: number): number {
  if (!(widthPx > 0)) return scrollPx
  if (playheadPx >= scrollPx && playheadPx < scrollPx + widthPx) return scrollPx
  return Math.max(0, playheadPx)
}
