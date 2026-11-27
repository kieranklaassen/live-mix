// What Standing Water reads along its circle: two cycles of the note, as the
// device builds them (`Surface::build` in `cpp/devices/standing-water`): the
// surface on the circle, bent by the reading, coloured by the pool harmonic by
// harmonic, with the plain tone beside it and half the pitch under it.

import { clamp } from '../display-kit'
import {
  CAUSTIC,
  HEIGHT,
  LONG,
  ROUND,
  SLOPE,
  waterBend,
  waterBendGain,
  waterDepth,
  waterFigure,
  waterPool,
  waterReading,
  type Ask,
  type Ripple,
  type Water,
} from './standing-water-parts'

/** Points of two cycles, and how many bins of half the pitch are kept. */
export const CYCLE_POINTS = 512
const BINS = 96
const TOP_HZ = 15000

// Cosines of every product a transform here needs.
const WAVE = Float64Array.from({ length: CYCLE_POINTS }, (_, i) =>
  Math.cos((2 * Math.PI * i) / CYCLE_POINTS),
)
const cosAt = (i: number): number => WAVE[i & (CYCLE_POINTS - 1)]
const sinAt = (i: number): number => WAVE[(i - CYCLE_POINTS / 4) & (CYCLE_POINTS - 1)]

/** The bins of a real signal of two cycles: the parts of its amplitude, so `x = sum of re cos - im sin`. */
function analyse(x: Float64Array, bins: number): [Float64Array, Float64Array] {
  const re = new Float64Array(bins)
  const im = new Float64Array(bins)
  for (let k = 1; k < bins; k++) {
    for (let i = 0; i < CYCLE_POINTS; i++) {
      re[k] += x[i] * cosAt(i * k)
      im[k] -= x[i] * sinAt(i * k)
    }
    re[k] *= 2 / CYCLE_POINTS
    im[k] *= 2 / CYCLE_POINTS
  }
  return [re, im]
}

function compose(re: Float64Array, im: Float64Array): Float64Array {
  const x = new Float64Array(CYCLE_POINTS)
  for (let k = 1; k < re.length; k++) {
    if (re[k] === 0 && im[k] === 0) continue
    for (let i = 0; i < CYCLE_POINTS; i++) x[i] += re[k] * cosAt(i * k) - im[k] * sinAt(i * k)
  }
  return x
}

const hump = (hz: number, at: number, wide: number): number =>
  1 / (1 + ((hz - at) / (wide * (hz + 0.5 * at))) ** 2)

/** `colour`: what the pool and the water leave of an overtone `n` of a key. */
export function waterColour(ask: Ask, key: { hz: number; velocity: number }, n: number): number {
  const reading = waterReading(ask)
  const pool = waterPool(ask)
  const thick = ask('thickness')
  const hand = key.velocity - 0.7
  const dull = reading === HEIGHT ? 0.15 : 0
  const figureDull = (reading === HEIGHT ? 0.4 : 1) * waterFigure(ask).dull
  const thickly = 0.15 * thick + 0.5 * thick ** 3
  const swallow = Math.max(0, 0.005 - 0.35 * hand + thickly + dull + figureDull)
  const hz = n * key.hz
  const over = hz / ([2100, 3600, 8000][reading] * Math.pow(0.2, thick) * (1 + 0.7 * hand))
  let g = 1 / ((1 + swallow * Math.max(0, n - 1)) * (1 + over * over))
  g *= 1 + (2.8 * ask('layers') * n * n) / (n * n + 60)
  if (reading === SLOPE) g *= (hz * hz) / (hz * hz + 650 * 650) / (1 + over * over)
  if (pool === ROUND) return g * (0.7 + hump(hz, 380, 0.6) + 0.3 * hump(hz, 1500, 0.5))
  if (pool === LONG)
    return (
      g *
      (0.015 + 0.4 * hump(hz, 400, 0.12) + 2 * hump(hz, 1350, 0.11) + 1.5 * hump(hz, 3200, 0.09))
    )
  return g * (2 / (1 + 0.8 * (hz / 520) ** 2) + 0.02)
}

export interface WaterCycle {
  /** Two cycles, with a mean square of one. */
  wave: Float64Array
  /** How strong each multiple of half the pitch is in it: 2 is the pitch. */
  bins: Float64Array
}

/** The cycle read along a circle at (`x`, `y`) of that radius, with the water `strength` past its threshold. */
export function waterCycle(
  ask: Ask,
  water: Water,
  ripples: readonly Ripple[],
  [x, y, radius]: readonly [number, number, number],
  strength: number,
): WaterCycle {
  const reading = waterReading(ask)
  const s = Math.min(strength, 1.6)
  const depth = waterDepth(ask, strength)
  // The height on the circle; the mean of it is not in what is read.
  const height = new Float64Array(CYCLE_POINTS)
  for (const ripple of ripples) {
    const run = Math.min(radius, 30 / ripple.fine)
    const from = ripple.kx * x + ripple.ky * y + ripple.p
    for (let i = 0; i < CYCLE_POINTS / 2; i++) {
      const along = run * (ripple.kx * cosAt(2 * i) + ripple.ky * sinAt(2 * i))
      height[i] += ripple.a * Math.cos(along + from)
    }
  }
  height.copyWithin(CYCLE_POINTS / 2, 0, CYCLE_POINTS / 2)
  const [re, im] = analyse(height, BINS)
  const shallow = 0.04 * (1 - depth) ** 4
  for (let k = 2; k < BINS; k += 2) {
    const n = k / 2
    const [a, b] = [re[k], im[k]]
    if (reading === SLOPE) {
      const m = n / (0.5 * radius + 0.6)
      re[k] = -b * m
      im[k] = a * m
    } else if (reading === CAUSTIC) {
      const m = (n * n) / ((0.35 * radius * radius + 1) * (1 + shallow * n * n))
      re[k] = -a * m
      im[k] = -b * m
    }
  }
  // The tilt of the whole pool, and the second halving: every other crest stands higher.
  re[2] += 0.32 * s * (reading === CAUSTIC ? -1 : 1)
  const bent = compose(re, im)
  let power = 0
  for (let i = 0; i < CYCLE_POINTS; i++) {
    bent[i] *= 1 + 0.9 * water.below * cosAt(i)
    power += bent[i] * bent[i]
  }
  const gain = waterBendGain(ask, strength, Math.sqrt(power / CYCLE_POINTS))
  for (let i = 0; i < CYCLE_POINTS; i++) bent[i] = waterBend(reading, depth, bent[i] * gain)

  const bins = clamp(Math.floor(TOP_HZ / (0.5 * water.hz)) + 1, 4, BINS)
  const [outRe, outIm] = analyse(bent, bins)
  let heard = 0
  for (let k = 1; k < bins; k++) {
    const g = waterColour(ask, water, k / 2)
    outRe[k] *= g
    outIm[k] *= g
    heard += (outRe[k] ** 2 + outIm[k] ** 2) / 2
  }
  // The plain tone and half the pitch, each a share of how loud the figure is (both ears' power).
  const figure = Math.sqrt(2 * heard)
  const flat = 1 - depth
  const own = waterFigure(ask).anchor
  const anchor =
    (reading === HEIGHT ? Math.min(own, 1.1) : own) *
    [0.32, 0.12, 0.5][reading] *
    [1, 0.12, 1.1][waterPool(ask)] *
    (1 + 1.6 * flat ** 3)
  outRe[2] += anchor * figure
  outRe[1] += 0.9 * water.below * figure
  const wave = compose(outRe, outIm)
  let mean = 0
  for (const value of wave) mean += value * value
  const scale = 1 / Math.max(1e-9, Math.sqrt(mean / CYCLE_POINTS))
  for (let i = 0; i < CYCLE_POINTS; i++) wave[i] *= scale
  return { wave, bins: outRe.map((value, k) => Math.hypot(value, outIm[k]) * scale) }
}
