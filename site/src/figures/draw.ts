// The arithmetic of a figure, apart from any canvas: where a value stands on an axis, what a
// pixel column of a long signal holds, where the grid lines go. Tested in tests/unit/draw.test.ts.

import { SAMPLE_RATE } from '../lab/rate.ts'

export interface Axis {
  min: number
  max: number
  /** A logarithmic axis: equal steps for equal ratios. `min` must be above zero. */
  log?: boolean
}

/** Where a value stands on an axis, 0 at `min` and 1 at `max`. Not clamped. */
export function toUnit(axis: Axis, value: number): number {
  if (axis.log) return Math.log(Math.max(value, 1e-12) / axis.min) / Math.log(axis.max / axis.min)
  return (value - axis.min) / (axis.max - axis.min)
}

/** The value at a place on an axis, the inverse of `toUnit`. */
export function fromUnit(axis: Axis, unit: number): number {
  if (axis.log) return axis.min * Math.pow(axis.max / axis.min, unit)
  return axis.min + unit * (axis.max - axis.min)
}

/** The frequency a bin of a spectrum stands at, for a spectrum of `bins` points up to half the rate. */
export function binHz(bin: number, bins: number, sampleRate: number): number {
  return (bin * sampleRate) / (2 * (bins - 1))
}

/** The audible band, the axis of every spectrum unless a figure says otherwise. */
export const AUDIBLE: Axis = { min: 20, max: 20_000, log: true }

/** Where a frequency stands across a figure `width` wide. The same for any size of transform. */
export function hzToX(hz: number, width: number, axis: Axis = AUDIBLE): number {
  return toUnit(axis, hz) * width
}

/**
 * The time axis of a stretch of the loop: `from` seconds in and `span` long, or to the loop's end.
 * A stretch shorter than a fifth of a second, near the loop's start, reads better in milliseconds:
 * `scale` is what a time in seconds is multiplied by to stand on `x`.
 */
export function loopAxis(result: { frames: number } | undefined, from: number, span?: number) {
  const seconds = result ? result.frames / SAMPLE_RATE : 4
  const length = span ?? seconds - from
  const scale = length < 0.2 && from < 1 ? 1000 : 1
  return {
    seconds,
    length,
    scale,
    x: {
      min: from * scale,
      max: (from + length) * scale,
      unit: scale === 1 ? 's' : 'ms',
      title: scale === 1 ? 'seconds' : 'milliseconds',
    },
  }
}

/**
 * The smallest and the largest sample in each pixel column, for points `from` to `to` of `data`
 * laid across `columns` columns: [min0, max0, min1, max1, …]. A column no point falls in holds
 * NaN twice. An empty range gives every column 0, a flat line.
 */
export function minMaxColumns(
  data: ArrayLike<number>,
  from: number,
  to: number,
  columns: number,
): Float32Array {
  const out = new Float32Array(columns * 2)
  const start = Math.max(0, Math.floor(from))
  const end = Math.min(data.length, Math.ceil(to))
  const count = end - start
  if (count <= 0) return out
  for (let c = 0; c < columns; c += 1) {
    const a = start + Math.floor((c * count) / columns)
    const b = Math.max(a + 1, start + Math.floor(((c + 1) * count) / columns))
    if (a >= end) {
      out[2 * c] = NaN
      out[2 * c + 1] = NaN
      continue
    }
    let lo = Infinity
    let hi = -Infinity
    for (let i = a; i < b && i < end; i += 1) {
      const v = data[i]!
      if (v < lo) lo = v
      if (v > hi) hi = v
    }
    out[2 * c] = lo
    out[2 * c + 1] = hi
  }
  return out
}

/**
 * The same for points that do not stand evenly across the figure (a spectrum on a logarithmic
 * axis): `place(i)` says where point `i` stands, 0 to 1. Columns no point falls in hold NaN.
 */
export function minMaxPlaced(
  data: ArrayLike<number>,
  place: (index: number) => number,
  columns: number,
  from = 0,
  to = data.length,
): Float32Array {
  const out = new Float32Array(columns * 2).fill(NaN)
  for (let i = Math.max(0, from); i < to && i < data.length; i += 1) {
    const unit = place(i)
    if (!(unit >= 0 && unit <= 1)) continue
    const c = Math.min(columns - 1, Math.floor(unit * columns))
    const v = data[i]!
    if (!(v >= out[2 * c]!)) out[2 * c] = v
    if (!(v <= out[2 * c + 1]!)) out[2 * c + 1] = v
  }
  return out
}

const STEPS = [1, 2, 5, 10]

/** The step `places` along the run 1, 2, 5, 10, 20, 50 and on, in both directions: 0 is 1. */
const stepAt = (place: number) =>
  [1, 2, 5][((place % 3) + 3) % 3]! * Math.pow(10, Math.floor(place / 3))

/** The round values of a linear axis that stand a step apart. */
function steps(axis: Axis, step: number): number[] {
  const out: number[] = []
  const start = Math.ceil(axis.min / step - 1e-9) * step
  for (let value = start; value <= axis.max + step * 1e-9; value += step) {
    out.push(Math.abs(value) < step * 1e-9 ? 0 : value)
  }
  return out
}

/**
 * Round values for grid lines: about `count` of them on a linear axis, 1-2-5 per decade on a
 * logarithmic one. Any range gets three or more: where the step that `count` asks for leaves
 * fewer (−48 to 48 in fifties holds only 0), the steps are taken finer until there are three,
 * and a logarithmic axis too short for three of its own is numbered evenly.
 */
export function ticks(axis: Axis, count = 5): number[] {
  const out: number[] = []
  // An axis that is not a span of real numbers has no grid: a figure asks for one before its
  // data has come, and a logarithmic axis from 0 has no first decade to start at.
  if (!Number.isFinite(axis.min) || !Number.isFinite(axis.max)) return out
  if (axis.log) {
    if (!(axis.min > 0) || !(axis.max > axis.min)) return out
    const first = Math.floor(Math.log10(axis.min))
    const last = Math.ceil(Math.log10(axis.max))
    for (let decade = first; decade <= last; decade += 1) {
      for (const step of [1, 2, 5]) {
        const value = step * Math.pow(10, decade)
        if (value >= axis.min * 0.999 && value <= axis.max * 1.001) out.push(value)
      }
    }
    return out.length >= 3 ? out : ticks({ min: axis.min, max: axis.max }, count)
  }
  const span = axis.max - axis.min
  if (!(span > 0)) return [axis.min]
  const rough = span / count
  const decade = Math.floor(Math.log10(rough))
  let place = 3 * decade + STEPS.findIndex((s) => s * Math.pow(10, decade) >= rough)
  let found = steps(axis, stepAt(place))
  while (found.length < 3) {
    place -= 1
    found = steps(axis, stepAt(place))
  }
  return found
}

/**
 * The bottom of an axis that keeps close to what it holds: `lo` rounded down to a round number,
 * one of steps about a tenth of the way from `lo` to `hi`. A value that is not below `floor` is
 * not given a bottom below it: nothing is ever drawn there.
 */
export function tidyFloor(lo: number, hi: number, floor = -Infinity): number {
  const span = hi - lo
  if (!(span > 0)) return lo
  const decade = Math.floor(Math.log10(span / 10))
  const step =
    (STEPS.find((s) => s * Math.pow(10, decade) >= span / 10) ?? 10) * Math.pow(10, decade)
  const bottom = Math.floor(lo / step + 1e-9) * step + 0
  return lo >= floor ? Math.max(bottom, floor) : bottom
}

/**
 * Where the name of each upright line of a picture is written: beside its line, towards the
 * side with more room, and in the first row where it runs into no name written before it. `at`
 * is where a line stands and `wide` how wide its name is, in pixels across a picture `width`
 * wide. Each name gets its left edge and its row, counted from 0 at the top.
 */
export function namePlaces(
  names: readonly { at: number; wide: number }[],
  width: number,
  gap = 5,
): { left: number; row: number }[] {
  const rows: { from: number; to: number }[][] = []
  return names.map(({ at, wide }) => {
    const left = at > width / 2 ? at - gap - wide : at + gap
    let row = 0
    // A name's plate reaches 3 px past its letters, and two plates keep a little apart.
    while (rows[row]?.some((one) => left < one.to + 8 && left + wide > one.from - 8)) row += 1
    ;(rows[row] ??= []).push({ from: left, to: left + wide })
    return { left, row }
  })
}

/**
 * The scale each sound of a strip of lanes is drawn to, by its id: the peak of the loudest, so
 * that two sounds can be compared by eye. A sound named in `own` is drawn to its own peak, and
 * is left out of the scale the others share. A scale is never nothing.
 */
export function soundPeaks(
  sounds: readonly { id: string; peak: number }[],
  own: readonly string[] = [],
): Record<string, number> {
  const least = 1e-6
  const shared = Math.max(
    least,
    ...sounds.filter((one) => !own.includes(one.id)).map((one) => one.peak),
  )
  return Object.fromEntries(
    sounds.map((one) => [one.id, own.includes(one.id) ? Math.max(least, one.peak) : shared]),
  )
}

/** A number as a figure prints it: 1500 as "1.5k", 0.25 as "0.25", −12 with a real minus sign. */
export function label(value: number): string {
  return written(value, 4)
}

/** A number in so many figures, one fewer above a thousand, as `label` prints it in four. */
function written(value: number, figures: number): string {
  const size = Math.abs(value)
  let text: string
  if (size >= 1000) text = `${+(size / 1000).toPrecision(figures - 1)}k`
  else text = `${+size.toPrecision(figures)}`
  return value < 0 ? `−${text}` : text
}

/**
 * The numbers of an axis's grid lines as they are printed: each as `label` writes it, and all
 * in more figures where two of them would otherwise read the same (a millisecond a second into
 * a loop: 1.0002 and 1.0004 are both "1" in four figures).
 */
export function tickLabels(values: readonly number[]): string[] {
  let out = values.map((value) => written(value, 4))
  for (let figures = 5; figures <= 9 && new Set(out).size < out.length; figures += 1) {
    out = values.map((value) => written(value, figures))
  }
  return out
}

/** A value with its unit, as a control or a readout prints it. */
export function withUnit(value: number, unit: string): string {
  if (!unit) return label(value)
  return unit === '%' || unit.startsWith(':') ? `${label(value)}${unit}` : `${label(value)} ${unit}`
}

/** Level in decibels of a linear amplitude, with a floor so silence is a number. */
export function toDb(amplitude: number, floor = -120): number {
  const size = Math.abs(amplitude)
  return size > 0 ? Math.max(floor, 20 * Math.log10(size)) : floor
}

/** The largest size of any sample in a range. */
export function peakOf(data: ArrayLike<number>, from = 0, to = data.length): number {
  let peak = 0
  for (let i = Math.max(0, from); i < to && i < data.length; i += 1) {
    const size = Math.abs(data[i]!)
    if (size > peak) peak = size
  }
  return peak
}

/** The smallest and largest value in a range, ignoring what is not a number. */
export function rangeOf(data: ArrayLike<number>, from = 0, to = data.length): [number, number] {
  let lo = Infinity
  let hi = -Infinity
  for (let i = Math.max(0, from); i < to && i < data.length; i += 1) {
    const v = data[i]!
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  return lo <= hi ? [lo, hi] : [0, 0]
}

/** An axis with round ends that holds `lo` to `hi`, with a little room. */
export function roomyAxis(lo: number, hi: number): Axis {
  if (!(hi > lo)) {
    const size = Math.abs(lo) || 1
    return { min: lo - size * 0.5, max: hi + size * 0.5 }
  }
  const span = hi - lo
  const magnitude = Math.pow(10, Math.floor(Math.log10(span)))
  const step = (STEPS.find((s) => s * magnitude >= span / 4) ?? 10) * magnitude
  // `+ 0` so an end that rounds to nothing is 0 and not −0.
  return {
    min: Math.floor(lo / step + 1e-9) * step + 0,
    max: Math.ceil(hi / step - 1e-9) * step + 0,
  }
}
