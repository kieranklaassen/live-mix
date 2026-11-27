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

/** The area of a grid of values over `level`, as one path. */
export function contour(
  ctx: CanvasRenderingContext2D,
  values: Float32Array,
  columns: number,
  level: number,
  { x: left, y: top, w: dx, h: dy }: Box,
): void {
  const rows = values.length / columns
  const corners = [0, 0, 1, 0, 1, 1, 0, 1]
  for (let r = 0; r + 1 < rows; r++) {
    for (let c = 0; c + 1 < columns; c++) {
      let first = true
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) & 3
        const [ax, ay, bx, by] = [
          corners[2 * i],
          corners[2 * i + 1],
          corners[2 * j],
          corners[2 * j + 1],
        ]
        const a = values[(r + ay) * columns + c + ax]
        const b = values[(r + by) * columns + c + bx]
        const put = (x: number, y: number): void => {
          if (first) ctx.moveTo(left + x * dx, top + y * dy)
          else ctx.lineTo(left + x * dx, top + y * dy)
          first = false
        }
        if (a > level) put(c + ax, r + ay)
        if (a > level !== b > level) {
          const t = (level - a) / (b - a)
          put(c + ax + (bx - ax) * t, r + ay + (by - ay) * t)
        }
      }
      if (!first) ctx.closePath()
    }
  }
}

/** The reading over the pool: 0 where the water lies still, 1 at the brightest the knobs allow. */
export function waterField(
  ask: Ask,
  ripples: readonly Ripple[],
  strength: number,
  [x, y, radius]: readonly [number, number, number],
  at: (n: number) => readonly [number, number],
  count: number,
): Float32Array {
  const reading = waterReading(ask)
  const out = new Float32Array(count)
  let power = 0
  const bend = (radius * radius) / (0.35 * radius * radius + 1)
  for (let n = 0; n < count; n++) {
    const [px, py] = at(n)
    const far = Math.hypot(px - x, py - y) + 1e-6
    const [tx, ty] = [-(py - y) / far, (px - x) / far]
    let sum = 0
    for (const { a, kx, ky, p, fine } of ripples) {
      const run = kx * px + ky * py + p
      if (reading === SLOPE) sum -= a * (kx * tx + ky * ty) * Math.sin(run)
      else sum += a * Math.cos(run) * (reading === CAUSTIC ? -fine * fine : 1)
    }
    if (reading === SLOPE) sum *= radius / (0.5 * radius + 0.6)
    if (reading === CAUSTIC) sum *= bend
    out[n] = sum
    power += sum * sum
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
