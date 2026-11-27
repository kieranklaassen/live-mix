// The rows of hills Ridge Lines draws a note's wave from, as the device draws
// them (`cpp/devices/ridge-lines/rows.h` and `build_rows`): the profiles, the
// rock and the lean that Jag and Sun give them, the blur of their own motion,
// and the outline that is seen of three of them for one eye.

import { clamp } from '../display-kit'

/** A knob's value by its name. */
export type Ask = (name: string) => number

/** `kDraw`: the points of a row and of an outline over one cycle. */
export const RIDGE_POINTS = 512
export const RIDGE_NEAR = ['Hills', 'Pines', 'Cliffs', 'Towers'] as const
export const RIDGE_FAR = ['Hills', 'Pines', 'Cliffs'] as const
const MIDDLE_REPEATS = [0, 1, 2, 3, 4, 5, 6, 8, 11, 14]
const FAR_REPEATS = [0, 2, 3, 5, 7, 8, 11, 13, 17, 19]
const PINE_TOPS = [0.06, 0.17, 0.335, 0.455, 0.615, 0.79, 0.915]
const FRAME_SEC = 0.008
const SWAY = 0.06
const LEAN = 0.3
const ROCK = 2.2
const FAR_LIFT = 0.12
const EYE_MIDDLE = 0.3
const EYE_FAR = -0.21
const TURN = 2 * Math.PI

const whole = (value: number, low: number, high: number): number =>
  clamp(Math.floor(value + 0.5), low, high)
export const ridgeNear = (ask: Ask): number => whole(ask('near'), 0, RIDGE_NEAR.length - 1)
export const ridgeFar = (ask: Ask): number => whole(ask('far'), 0, RIDGE_FAR.length - 1)

/** How often the middle row and the last one come round in a cycle of the note. */
export function ridgeRepeats(ask: Ask): readonly [number, number] {
  const step = whole(ask('repeats'), 1, 9)
  return [MIDDLE_REPEATS[step], FAR_REPEATS[step]]
}

/** Turns a second of the middle row, and of the last (`travel_speed`, `far_share`). */
export function ridgeSpeeds(ask: Ask): readonly [number, number] {
  const speed = 2.8 * Math.pow(ask('travel'), 2.5)
  return [speed, speed * (1 - 1.5 * ask('parallax'))]
}

/** How far the rows behind are lifted over the one in front. */
export const ridgeLift = (ask: Ask): number => ask('height') - 0.5

/** How much rock lies on every row. */
export const ridgeRock = (ask: Ask): number => {
  const jag = ask('jag')
  return ROCK * jag * (0.35 + 0.65 * jag)
}

function block(x: number, from: number, to: number): number {
  return clamp(Math.min(x - from, to - x) / 0.01, 0, 1)
}

/** The height of a profile at `x` of its turn. */
export function ridgeProfile(shape: number, at: number, turned = false): number {
  const x = turned && at > 0 ? 1 - at : at
  if (shape === 0) {
    const hill = 0.5 - 0.5 * Math.cos(TURN * (x + 0.07 * Math.sin(TURN * x)))
    return hill * (0.45 + 0.55 * hill)
  }
  if (shape === 1) {
    const hill = 0.5 - 0.5 * Math.cos(TURN * x)
    let tall = 0
    for (const top of PINE_TOPS) tall = Math.max(tall, 1 - Math.abs(x - top) * 14)
    return (0.55 + 0.45 * hill) * tall
  }
  if (shape === 2) return x < 0.985 ? x / 0.985 : (1 - x) / 0.015
  return Math.max(block(x, 0.1, 0.135), 0.7 * block(x, 0.43, 0.455))
}

let grain: Float64Array[] | null = null

/** `rock_`: the seeded grain of each row, its harmonics from the seventh up. */
export function ridgeGrain(): readonly Float64Array[] {
  if (grain) return grain
  grain = [0, 1, 2].map((row) => {
    let seed = (0x6a09e667 + 40503 * row) >>> 0
    const uniform = (): number => {
      seed = (seed ^ (seed << 13)) >>> 0
      seed = (seed ^ (seed >>> 17)) >>> 0
      seed = (seed ^ (seed << 5)) >>> 0
      return (seed >>> 8) / 16777216
    }
    const out = new Float64Array(RIDGE_POINTS)
    for (let h = 7; h <= 72; h++) {
      const phase = uniform()
      const size = (0.4 + 0.6 * uniform()) * Math.pow(h, -0.65)
      for (let i = 0; i < RIDGE_POINTS; i++)
        out[i] += size * Math.sin(TURN * ((h * i) / RIDGE_POINTS + phase))
    }
    return out
  })
  return grain
}

/** `lean_profile`: a profile pushed over by its own height, and the higher line where it overhangs. */
function leaned(row: Float64Array, lean: number): Float64Array {
  if (lean <= 0) return row
  const out = new Float64Array(RIDGE_POINTS).fill(-Infinity)
  const push = lean * RIDGE_POINTS
  for (let i = 0; i < RIDGE_POINTS; i++) {
    let [a, b] = [row[i], row[(i + 1) % RIDGE_POINTS]]
    let [x0, x1] = [i + push * a, i + 1 + push * b]
    if (x1 < x0) [x0, x1, a, b] = [x1, x0, b, a]
    const slope = x1 - x0 > 1e-6 ? (b - a) / (x1 - x0) : 0
    for (let p = Math.ceil(x0); p <= x1; p++) {
      const at = p & (RIDGE_POINTS - 1)
      out[at] = Math.max(out[at], a + slope * (p - x0))
    }
  }
  return out.map((v, i) => (v > -1e8 ? v : row[i]))
}

/** `blur_profile`: a running mean over `wide` points round the ring, twice. */
function blurred(row: Float64Array, wide: number): Float64Array {
  if (wide <= 1) return row
  const width = Math.min(wide, RIDGE_POINTS - 2)
  const steps = Math.floor(width)
  let ring = row
  for (const back of [steps >> 1, steps - (steps >> 1)]) {
    const sum = new Float64Array(2 * RIDGE_POINTS + 1)
    for (let i = 0; i < 2 * RIDGE_POINTS; i++) sum[i + 1] = sum[i] + ring[i % RIDGE_POINTS]
    const from = ring
    ring = from.map((_, i) => {
      const start = (i - back) & (RIDGE_POINTS - 1)
      const more = from[(start + steps) % RIDGE_POINTS]
      return (sum[start + steps] - sum[start] + (width - steps) * more) / width
    })
  }
  return ring
}

/** The near row, the middle one and the last, each over one turn of its own (`build_rows`). */
export function ridgeRows(ask: Ask): readonly Float64Array[] {
  const [middle, far] = ridgeRepeats(ask)
  const speeds = ridgeSpeeds(ask)
  const rocked = ask('vibrato') * SWAY * TURN * 5.25
  const moved = speeds.map((speed) => (Math.abs(speed) + rocked) * FRAME_SEC * RIDGE_POINTS)
  const sun = ask('sun')
  const rock = ridgeRock(ask)
  const shapes = [ridgeNear(ask), ridgeFar(ask), ridgeFar(ask)]
  return shapes.map((shape, row) => {
    const rough = Float64Array.from(
      ridgeGrain()[row],
      (v, i) => ridgeProfile(shape, i / RIDGE_POINTS, row === 2) + rock * v,
    )
    const least = 0.8 * [1, middle, far][row]
    return blurred(
      leaned(rough, LEAN * sun * (0.4 + 0.6 * sun)),
      Math.max(least, [0, ...moved][row]),
    )
  })
}

function readRow(
  ring: Float64Array,
  multiple: number,
  turn: number,
  lift: number,
  out: Float64Array,
): void {
  const place = (turn - Math.floor(turn)) * RIDGE_POINTS
  const first = Math.floor(place)
  const part = place - first
  for (let i = 0; i < RIDGE_POINTS; i++) {
    const at = (i * multiple + first) & (RIDGE_POINTS - 1)
    out[i] = ring[at] + (ring[(at + 1) & (RIDGE_POINTS - 1)] - ring[at]) * part + lift
  }
}

/** `soft_max`: the higher of two heights, the corner between them rounded over `k` of height. */
export function ridgeSoftMax(a: number, b: number, k: number): number {
  const near = Math.max(0, k - Math.abs(a - b))
  return Math.max(a, b) + (0.25 * near * near) / k
}

/** How wide an edge Penumbra and the touch make. */
export function ridgeEdge(ask: Ask, gain: number): number {
  const p = ask('penumbra')
  return Math.max(0.02, 0.3 * p + 4 * p * p * p + 0.25 * p * (1 - gain))
}

/** What one eye sees: the rows as they stand, and what shows of each over the rows before it. */
export interface RidgeSight {
  middle: Float64Array
  far: Float64Array
  /** The middle row over the near one, and the last one over both. */
  middleSeen: Float64Array
  farSeen: Float64Array
  outline: Float64Array
}

const blank = (): Float64Array => new Float64Array(RIDGE_POINTS)
export const ridgeSightless = (): RidgeSight => ({
  middle: blank(),
  far: blank(),
  middleSeen: blank(),
  farSeen: blank(),
  outline: blank(),
})

/** `outline`: the rows behind at `turns` of their own, for an eye that stands `eye` off the middle. */
export function ridgeSee(
  ask: Ask,
  rows: readonly Float64Array[],
  turns: readonly [number, number],
  eye: number,
  gain: number,
  out: RidgeSight,
): RidgeSight {
  const [middle, far] = ridgeRepeats(ask)
  const lift = ridgeLift(ask)
  readRow(rows[1], middle, turns[0] + eye * EYE_MIDDLE, lift, out.middle)
  readRow(rows[2], far, turns[1] + eye * EYE_FAR, lift + FAR_LIFT, out.far)
  const k = ridgeEdge(ask, gain)
  for (let i = 0; i < RIDGE_POINTS; i++) {
    const near = rows[0][i]
    const two = ridgeSoftMax(near, out.middle[i], k)
    const three = ridgeSoftMax(two, out.far[i], k)
    out.middleSeen[i] = two - near
    out.farSeen[i] = three - two
    out.outline[i] = three
  }
  return out
}
