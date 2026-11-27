// The arithmetic of Standing Water's display: the device's own, under the
// names `cpp/devices/standing-water` gives it. A figure of a few waves, what
// the amplitude equations make of them, the circle they are read along and the
// cycle the reading leaves. Where the device draws on chance (how a key's water
// wanders) a slow sum of sines stands in, seeded by the key.

import { clamp } from '../display-kit'

const TURN = Math.PI * 2
const WAVES = 6
/** `kStill`, `kPush`. */
const STILL = 0.005
const PUSH = 2.2

interface Figure {
  name: string
  /** Of each wave, in turns. */
  angle: readonly number[]
  phase: readonly number[]
  side: number
  chase: number
  low: number
  high: number
  ring: readonly [number, number]
  ringTurn: number
  anchor: number
  dull: number
  trade: number
  pace: number
}

const third = 1 / 3
const figure = (
  name: string,
  angle: readonly number[],
  phase: readonly number[],
  [side, chase, low, high]: readonly number[],
  ring: readonly [number, number],
  [ringTurn, anchor, dull, trade, pace]: readonly number[],
): Figure => ({
  ...{ name, angle, phase, side, chase, low, high, ring, ringTurn },
  ...{ anchor, dull, trade, pace },
})

/** `kFigures`, in the order of the Pattern control. */
export const WATER_FIGURES: readonly Figure[] = [
  figure(
    'Stripes',
    [0, third, 2 * third],
    [0.25, 0.25, 0.25],
    [1.9, 0, 0.35, 5],
    [2, 3],
    [0, 3.4, 0.85, 0, 1],
  ),
  figure(
    'Squares',
    [0, 0.25],
    [0, 0],
    [0.4, 0, 1.4, 7.5],
    [Math.SQRT2, 2],
    [0.125, 0.22, 0.03, 0.9, 2.2],
  ),
  figure(
    'Hexagons',
    [0, third, 2 * third],
    [0.125, 0.125, 0.125],
    [0.6, 0, 0.8, 7.5],
    [1.7320508, 2],
    [0.0833333, 1.05, 0.06, 0, 1],
  ),
  figure(
    'Eightfold',
    [0, 0.125, 0.25, 0.375],
    [0, 0, 0, 0],
    [0.3, 0, 6.5, 15],
    [1.8477591, 1.41421356],
    [0.0625, 0.6, 0.008, 0.2, 0.45],
  ),
  figure(
    'Free',
    [0, 0.0833333, 0.1666667, 0.25, 0.3333333, 0.4166667],
    [0.25, 0, 0.2, 0.02, 0.3, 0.08],
    [1.25, 0.75, 0.5, 7],
    [1.5, 2],
    [0.04, 0.4, 0.05, 0, 0.4],
  ),
]
export const WATER_READINGS = ['Height', 'Slope', 'Caustic'] as const
export const HEIGHT = 0
export const SLOPE = 1
export const CAUSTIC = 2
export const ROUND = 0
export const LONG = 1
export const SEA = 2

export type Ask = (name: string) => number
const choice = (value: number, count: number): number =>
  clamp(Math.floor(value + 0.5), 0, count - 1)
export const waterFigure = (ask: Ask): Figure => WATER_FIGURES[choice(ask('pattern'), 5)]
export const waterReading = (ask: Ask): number => choice(ask('reading'), 3)
export const waterPool = (ask: Ask): number => choice(ask('pool'), 3)

/** What a touch makes of Shake, and where Threshold stands on the same scale (`past_threshold`). */
export const waterShaken = (shake: number, velocity: number): number =>
  shake * (0.3 + 0.7 * velocity) * 1.12
export const waterSill = (threshold: number): number => 0.68 * threshold
export const waterPast = (ask: Ask, velocity: number): number =>
  clamp(2.6 * (waterShaken(ask('shake'), velocity) - waterSill(ask('threshold'))), -1.8, 2.6)

/** The radius the Circle knob asks for, in radians of the ripple, and the knob a radius asks for. */
export function waterRadius(at: Figure, knob: number): number {
  return at.low + (at.high - at.low) * knob * (0.45 + 0.55 * knob)
}
export function waterKnob(at: Figure, radius: number): number {
  const share = clamp((radius - at.low) / (at.high - at.low), 0, 1)
  return clamp((Math.sqrt(0.2025 + 2.2 * share) - 0.45) / 1.1, 0, 1)
}

/** How hard the key strikes the water (`start`): a key under its threshold keeps a little. */
export function waterForce(ask: Ask, velocity: number): number {
  const least = 0.28 * clamp(-2 * waterPast(ask, velocity), 0, 1)
  return Math.pow(least + (1 - least) * ask('splash'), 1.1) * (0.25 + 0.75 * velocity)
}

/** One key's water: its waves, and what moves them. */
export interface Water {
  hz: number
  velocity: number
  seed: number
  wave: Float64Array
  age: number
  push: number
  burst: number
  below: number
  trade: number
  /** Drift and the unevenness, each on a clock of its own, and the travel of the sea. */
  clock: number
  uneven: number
  travel: number
}

const chance = (seed: number, n: number): number => {
  const x = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453
  return x - Math.floor(x)
}
/** `kit::Drift`: three sines that never meet. */
const wander = (clock: number, seed: number): number =>
  0.5 * Math.sin(TURN * (clock + chance(seed, 1))) +
  0.3 * Math.sin(TURN * (clock * 0.618034 + chance(seed, 2))) +
  0.2 * Math.sin(TURN * (clock * 1.7320508 + chance(seed, 3)))
const uneven = (water: Water, j: number): number =>
  1.6 * wander(water.uneven, water.seed + 7 + 3 * j)

/** A key in a pool that lies still (`start`). */
export function waterStart(ask: Ask, hz: number, velocity: number, seed: number): Water {
  const stone = Math.pow(ask('stone'), 0.6)
  const force = waterForce(ask, velocity)
  return {
    ...{ hz, velocity, seed, age: 0, below: 0, clock: 0, uneven: 0, travel: 0 },
    wave: Float64Array.from({ length: WAVES }, (_, j) => STILL * (1 + 0.8 * chance(seed, 11 + j))),
    push: PUSH * force * (0.75 + 0.4 * stone),
    burst: 1.3 * force,
    trade: 0.6 * chance(seed, 5),
  }
}

/** What a wave holds its neighbours down by, as one number: a figure of waves that share stands at `excess / share`. */
const shareOf = (at: Figure): number => 1 + (at.angle.length - 1) * at.side

/** How far past its threshold the water stands (`move_water`). */
export function waterStrength(ask: Ask, water: Water): number {
  const at = waterFigure(ask)
  let energy = 0
  for (let j = 0; j < at.angle.length; j++) energy += water.wave[j] * water.wave[j]
  return Math.sqrt((energy * shareOf(at)) / at.angle.length)
}

/** `move_water`, `dt` seconds on. Motion is drawn no faster than once a second, however fast it is heard. */
export function waterMove(ask: Ask, water: Water, gate: boolean, dt: number): void {
  const at = waterFigure(ask)
  const waves = at.angle.length
  const past = waterPast(ask, water.velocity)
  const full = gate ? past : clamp(-1.77 * ask('threshold'), -1.8, 0)
  const lag = Math.max(ask('lag'), 0.01)
  const grow = Math.max(0.01, lag / 10)
  const ring = 11 * Math.pow(0.012, ask('thickness'))
  const stone = Math.pow(ask('stone'), 0.6)
  const pushRate = 1 / (0.003 + 0.07 * stone * stone)
  const calm = Math.max(0.05, Math.min(ask('calm'), 20))
  const share = shareOf(at)
  const unrest = ask('unrest')
  const steps = Math.max(1, Math.round(dt / 0.006))
  const h = dt / steps
  const next = new Float64Array(WAVES)
  for (let s = 0; s < steps; s++) {
    water.age += h
    water.clock += h * Math.min(1, ask('drift'))
    water.uneven += h * Math.min(0.8, Math.sqrt(ask('drift')))
    const into = water.age / (0.5 * lag)
    const hold = (into * into) / (1 + into * into)
    const excess = gate ? -0.5 + (full + 0.5) * hold : full
    const pushed = water.push * (1 - Math.exp(-h * pushRate))
    water.push -= pushed
    for (let j = 0; j < waves; j++) {
      const a = water.wave[j]
      let held = a * a
      for (let m = 1; m < waves; m++) {
        const b = water.wave[(j + m) % waves]
        held += (at.side + at.chase * Math.sign(waves - 2 * m)) * b * b
      }
      const u = uneven(water, j)
      const fed = excess + unrest * 0.8 * u * (0.35 + Math.max(excess, 0))
      const up = excess > 0 ? Math.max(fed, 0) / grow : 0
      const still = (6.9 / ring) * (1 + 0.5 * Math.max(0, -full))
      const lost = !gate ? 6.9 / calm : excess > 0 ? Math.max(-fed, 0) / grow : still
      const down = gate && excess > 0 ? held / grow : held * 0.4
      const now = (a * (1 + h * up)) / (1 + h * (lost + down))
      const floor = gate ? STILL * (1 + 0.5 * u * u) : 0
      next[j] = Math.max(now, floor) + (pushed * (1 + 0.35 * u * u)) / Math.sqrt(share)
    }
    water.wave.set(next)
  }
  const belowTo = ask('below') * clamp((waterStrength(ask, water) - 0.25) * 2, 0, 1)
  const rate = belowTo > water.below ? 1 / (0.15 + 3 * grow) : 4
  water.below += (belowTo - water.below) * (1 - Math.exp(-dt * rate))
  water.burst *= Math.exp(-dt / (0.05 + stone * stone))
  water.trade += dt * Math.min(0.8, 0.9 * at.pace * Math.sqrt(ask('drift') * 3.3))
  water.travel += dt * (0.5 + 1.5 * unrest)
}

/** The water of a key held long enough, with no splash left in it: what the plate shows at rest. */
export function waterSettled(ask: Ask, hz: number, velocity: number): Water {
  const water = waterStart((name) => (name === 'splash' ? 0 : ask(name)), hz, velocity, 3)
  water.push = water.burst = 0
  const quick: Ask = (name) => (name === 'lag' ? 0.15 : ask(name))
  waterMove(quick, water, true, 4)
  water.below = ask('below') * clamp((waterStrength(ask, water) - 0.25) * 2, 0, 1)
  return water
}

/** Where a key's circle stands from the middle of the figure, and how wide it is, in radians of the ripple. */
export function waterCircle(ask: Ask, water: Water, strength: number): [number, number, number] {
  const stray = ask('stray')
  const reach = 4 * stray * (0.4 + 0.6 * stray)
  const long = waterPool(ask) === LONG ? 2.2 : 1
  const east = reach * long * wander(water.clock, water.seed + 31)
  const north = reach * wander(water.clock, water.seed + 47)
  const other = wander(water.clock, water.seed + 59)
  const scale = clamp(Math.pow(300 / water.hz, 0.22), 0.55, 1.25)
  const radius =
    waterRadius(waterFigure(ask), ask('circle')) *
    scale *
    (1 + water.burst) *
    clamp(1 + 0.5 * stray * other, 0.4, 1.8) *
    (0.66 + 0.48 * water.velocity) *
    (0.75 + 0.25 * Math.min(strength, 1.6))
  return [east, north, radius]
}

/** One plane wave of the surface: height `a cos(kx x + ky y + p)`, its ripple `fine` times the figure's. */
export interface Ripple {
  a: number
  kx: number
  ky: number
  p: number
  fine: number
}

/** The waves that are there now (`sum_waves`): the figure, and the two rings of finer ripples on it. */
export function waterRipples(ask: Ask, water: Water): Ripple[] {
  const at = waterFigure(ask)
  const waves = at.angle.length
  const squeeze = waterPool(ask) === LONG ? 0.3 : 1
  const sea = waterPool(ask) === SEA ? 1 : 0
  const layers = ask('layers')
  const unrest = ask('unrest')
  const own = Math.sqrt(shareOf(at))
  const traded = Math.sin(TURN * water.trade)
  const amp: number[] = []
  const phase: number[] = []
  for (let j = 0; j < waves; j++) {
    const u = uneven(water, j)
    const trade = 1 + at.trade * (j & 1 ? -0.95 : 0.95) * traded
    amp.push(clamp(water.wave[j] * own * (1 + 0.6 * unrest * u) * trade, 0, 1.8))
    const travel = (j & 1 ? -1 : 1) * (0.16 + 0.5 * chance(water.seed, 21 + j)) * water.travel
    phase.push(at.phase[j] + 0.06 * unrest * u + sea * (travel + 0.25 * j))
  }
  const out: Ripple[] = []
  for (let ring = 0; ring < 3; ring++) {
    const fine = ring === 0 ? 1 : at.ring[ring - 1]
    const weight = ring === 0 ? 1 : ring === 1 ? layers * 1.5 : layers * layers * 2
    if (weight < 1e-3) continue
    for (let j = 0; j < waves; j++) {
      const next = (j + 1) % waves
      const angle = TURN * (at.angle[j] + (ring === 1 ? at.ringTurn : 0)) * squeeze
      let a = amp[j]
      let p = phase[j]
      if (ring === 1) {
        a = Math.sqrt(amp[j] * amp[next]) * Math.min(1, amp[j] + amp[next])
        p += phase[next]
      } else if (ring === 2) {
        a = amp[j] * Math.min(1, amp[j] * 1.5)
        p *= 2
      }
      const [kx, ky] = [Math.cos(angle) * fine, Math.sin(angle) * fine]
      out.push({ a: (a * weight) / Math.sqrt(waves), kx, ky, p: p * TURN, fine })
    }
  }
  return out
}

/** How steeply the bend is driven, for a surface of that size (`bend`). */
export function waterBendGain(ask: Ask, strength: number, size: number): number {
  const s = Math.min(strength, 1.6)
  const even = s / (0.15 + 0.3 * s + 0.7 * size)
  const depth = waterDepth(ask, strength)
  const reading = waterReading(ask)
  if (reading === CAUSTIC) return even * (0.15 + 3 * depth * depth + 0.8 * depth)
  return even * (reading === SLOPE ? 0.7 + 6 * depth * depth : 0.2 + 5 * depth * depth)
}
export const waterDepth = (ask: Ask, strength: number): number =>
  Math.min(1, ask('depth') * (0.8 + 0.2 * Math.min(strength, 1.6)))

/** The reading of one point, `x` times that gain (`bend`). */
export function waterBend(reading: number, depth: number, xd: number): number {
  if (reading === CAUSTIC) return 1 / (0.3 - 0.22 * depth + Math.sqrt((1 + xd) ** 2 + 0.01))
  if (reading === SLOPE) return Math.sin(xd)
  return Math.pow(1 + clamp(xd, -8, 4) / 16, 16)
}
