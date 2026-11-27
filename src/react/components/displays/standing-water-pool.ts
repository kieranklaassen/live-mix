// The picture of Standing Water's pool: its shore, the reading over the whole
// of it and the contours that are filled.

import { type Box } from '../display-kit'
import { type DisplayFrame } from '../plate-display'
import {
  CAUSTIC,
  LONG,
  ROUND,
  SLOPE,
  waterBend,
  waterBendGain,
  waterDepth,
  waterForce,
  waterPool,
  waterReading,
  type Ask,
  type Ripple,
  type Water,
} from './standing-water-parts'

const CORNER_X = [0, 1, 1, 0]
const CORNER_Y = [0, 0, 1, 1]

/** The area of a grid of values over `level`, as one path. */
export function contour(
  ctx: CanvasRenderingContext2D,
  values: Float32Array,
  columns: number,
  level: number,
  { x: left, y: top, w: dx, h: dy }: Box,
): void {
  const rows = values.length / columns
  let first = true
  const put = (x: number, y: number): void => {
    if (first) ctx.moveTo(left + x * dx, top + y * dy)
    else ctx.lineTo(left + x * dx, top + y * dy)
    first = false
  }
  let strip = -1
  const endStrip = (r: number, c: number): void => {
    if (strip >= 0) ctx.rect(left + strip * dx, top + r * dy, (c - strip) * dx, dy)
    strip = -1
  }
  for (let r = 0; r + 1 < rows; r++) {
    for (let c = 0; c + 1 < columns; c++) {
      const at = r * columns + c
      const over =
        Number(values[at] > level) +
        Number(values[at + 1] > level) +
        Number(values[at + columns] > level) +
        Number(values[at + columns + 1] > level)
      // Cells that are wholly over it are one strip as far as they run.
      if (over === 4) {
        if (strip < 0) strip = c
        continue
      }
      endStrip(r, c)
      if (over === 0) continue
      first = true
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) & 3
        const ax = CORNER_X[i]
        const ay = CORNER_Y[i]
        const bx = CORNER_X[j]
        const by = CORNER_Y[j]
        const a = values[at + ay * columns + ax]
        const b = values[at + by * columns + bx]
        if (a > level) put(c + ax, r + ay)
        if (a > level !== b > level) {
          const t = (level - a) / (b - a)
          put(c + ax + (bx - ax) * t, r + ay + (by - ay) * t)
        }
      }
      if (!first) ctx.closePath()
    }
    endStrip(r, columns - 1)
  }
}

/**
 * The reading over a grid of the pool, row by row: 0 where the water lies still, 1 at the brightest
 * the knobs allow. A wave's angle is a sum over the two axes, so its sines are asked along each axis
 * and not at every point.
 */
export function waterField(
  ask: Ask,
  ripples: readonly Ripple[],
  strength: number,
  [x, y, radius]: readonly [number, number, number],
  across: Float64Array,
  down: Float64Array,
): Float32Array {
  const reading = waterReading(ask)
  const count = across.length * down.length
  const out = new Float32Array(count)
  const bend = (radius * radius) / (0.35 * radius * radius + 1)
  for (const { a, kx, ky, p, fine } of ripples) {
    const cosX = across.map((px) => Math.cos(kx * px + p))
    const sinX = across.map((px) => Math.sin(kx * px + p))
    const height = reading === CAUSTIC ? -a * fine * fine : a
    for (let r = 0, n = 0; r < down.length; r++) {
      const py = down[r]
      const [cosY, sinY] = [Math.cos(ky * py), Math.sin(ky * py)]
      for (let c = 0; c < across.length; c++, n++) {
        if (reading === SLOPE) {
          // Along the circle that runs through this point.
          const steep = ky * (across[c] - x) - kx * (py - y)
          out[n] -= a * steep * (sinX[c] * cosY + cosX[c] * sinY)
        } else out[n] += height * (cosX[c] * cosY - sinX[c] * sinY)
      }
    }
  }
  let power = 0
  for (let n = 0; n < count; n++) {
    if (reading === SLOPE) {
      const [px, py] = [across[n % across.length], down[Math.floor(n / across.length)]]
      out[n] *= radius / (0.5 * radius + 0.6) / (Math.hypot(px - x, py - y) + 1e-6)
    }
    if (reading === CAUSTIC) out[n] *= bend
    power += out[n] * out[n]
  }
  const depth = waterDepth(ask, strength)
  const gain = waterBendGain(ask, strength, Math.sqrt(power / Math.max(1, count)))
  const still = waterBend(reading, depth, 0)
  const top =
    reading === CAUSTIC
      ? waterBend(reading, depth, -1)
      : reading === SLOPE
        ? 1
        : waterBend(reading, depth, 1.5 * (0.2 + 5 * depth * depth))
  for (let n = 0; n < count; n++)
    out[n] = (waterBend(reading, depth, out[n] * gain) - still) / (top - still)
  return out
}

/** The shore: an oval, a channel, or none. */
export function shore(ctx: CanvasRenderingContext2D, ask: Ask, pool: Box): void {
  const kind = waterPool(ask)
  ctx.beginPath()
  if (kind === ROUND) {
    for (let i = 0; i < 72; i++) {
      const [c, s] = [Math.cos((i / 36) * Math.PI), Math.sin((i / 36) * Math.PI)]
      const put = (v: number): number => Math.sign(v) * Math.pow(Math.abs(v), 0.72)
      const [x, y] = [pool.x + (pool.w / 2) * (1 + put(c)), pool.y + (pool.h / 2) * (1 + put(s))]
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
  } else if (kind === LONG) ctx.rect(pool.x, pool.y + pool.h * 0.14, pool.w, pool.h * 0.72)
  else ctx.rect(pool.x, pool.y, pool.w, pool.h)
}

export function ring(
  frame: DisplayFrame,
  x: number,
  y: number,
  r: number,
  colour: string,
  alpha: number,
  width = 1,
): void {
  const { ctx } = frame
  ctx.beginPath()
  ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2)
  ctx.globalAlpha = alpha
  ctx.strokeStyle = colour
  ctx.lineWidth = width
  ctx.stroke()
  ctx.globalAlpha = 1
}

/** The rings a strike sends out, or at rest the first of them: a pin's stand close, a boulder's are wide and last. */
export function drawSplash(
  frame: DisplayFrame,
  ask: Ask,
  x: number,
  y: number,
  water: Water,
): void {
  const stone = Math.pow(ask('stone'), 0.6)
  const force = Math.min(1, waterForce(ask, water.velocity))
  const apart = 3.5 + 6 * stone
  const fades = (0.25 + 0.9 * stone) * (1.5 - ask('thickness'))
  const resting = !frame.powered || frame.notes.length === 0
  for (let k = 0; k < 3; k++) {
    const r = resting ? (k + 1) * apart : water.age * (26 + 34 * stone) - k * apart
    const left = resting ? 0.4 : Math.exp(-water.age / fades)
    const alpha = (0.9 * force * left) / (k + 1)
    if (r > 0.5 && alpha > 0.02) ring(frame, x, y, r, frame.colours.plate, alpha, 1 + stone)
  }
}
