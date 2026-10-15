// The arithmetic of a figure, apart from any canvas: where a value stands on an axis, what a
// pixel column of a long signal holds, where the grid lines go. Tested in tests/unit/draw.test.ts.

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

/** Round values for grid lines: about `count` of them on a linear axis, 1-2-5 per decade on a logarithmic one. */
export function ticks(axis: Axis, count = 5): number[] {
  const out: number[] = []
  if (axis.log) {
    const first = Math.floor(Math.log10(axis.min))
    const last = Math.ceil(Math.log10(axis.max))
    for (let decade = first; decade <= last; decade += 1) {
      for (const step of [1, 2, 5]) {
        const value = step * Math.pow(10, decade)
        if (value >= axis.min * 0.999 && value <= axis.max * 1.001) out.push(value)
      }
    }
    return out
  }
  const span = axis.max - axis.min
  if (!(span > 0)) return [axis.min]
  const rough = span / count
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)))
  const step = (STEPS.find((s) => s * magnitude >= rough) ?? 10) * magnitude
  const start = Math.ceil(axis.min / step - 1e-9) * step
  for (let value = start; value <= axis.max + step * 1e-9; value += step) {
    out.push(Math.abs(value) < step * 1e-9 ? 0 : value)
  }
  return out
}

/** A number as a figure prints it: 1500 as "1.5k", 0.25 as "0.25", −12 with a real minus sign. */
export function label(value: number): string {
  const size = Math.abs(value)
  let text: string
  if (size >= 1000) text = `${+(size / 1000).toPrecision(3)}k`
  else if (size >= 100) text = size.toFixed(0)
  else if (size >= 10) text = `${+size.toFixed(1)}`
  else if (size >= 1) text = `${+size.toFixed(2)}`
  else if (size === 0) text = '0'
  else text = `${+size.toPrecision(2)}`
  return value < 0 ? `−${text}` : text
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
