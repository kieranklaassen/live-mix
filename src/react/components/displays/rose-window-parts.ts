// What the display of Rose Window (`rose-window.ts`) draws from: the rotors of
// a key with the level of each as it opens, tips, is struck and dies, and the
// figure they draw, folded and curled.
//
// The arithmetic is the device's own (`cpp/devices/rose-window/rose_window.h`;
// the names are its names). Rotor 0 is the heart; ring k is rotor 2k - 1, which
// runs backwards, and 2k. Left out are the panes and clouds of Broken, which
// come and go by chance (the level the device reports has the clouds), what
// brings every setting to one level, the breath and the stone.

import { clamp, gainToDb, lerp, type Box } from '../display-kit'
import { type DisplayView } from '../plate-display'

/** A parameter's value by its name. */
export type Ask = (param: string) => number

export const RINGS = 9
export const ROTORS = 1 + 2 * RINGS
const TWO_PI = 2 * Math.PI
const SIXTY_DB = 6.907755279
const EDGE_HZ = 5500
const TOP_HZ = 14000
const FOLD_FROM = 2800
const FOLD_TO = 5600
const MOST_FOLD = 4.8
const POINTED = 1
const BROKEN = 2
export const GOLDEN = 3
const RIM_FIRST = 1
const PASSING = 2
/** `open_coeff_`: a rotor follows its opening this far behind, seconds. */
const OPENS_LATE = 0.03
/** `kPanes`: how Broken lights its rings before chance has its say. */
const PANES = [0.08, 0.9, 0.1, 0.9, 1, 0.15, 0.9, 0.1, 1]

export const each = <T>(n: number, make: (i: number) => T): T[] =>
  Array.from({ length: n }, (_, i) => make(i))
const part = (x: number): number => x - Math.floor(x)
const step = (ask: Ask, param: string): number => Math.floor(ask(param) + 0.5)
const smooth = (x: number): number => {
  const t = clamp(x, 0, 1)
  return t * t * (3 - 2 * t)
}
const ringOf = (j: number): number => Math.floor((j + 1) / 2)

/** `ring_spacing`: how far apart the rings stand, in harmonics. */
export const roseSpacing = (ask: Ask): number =>
  clamp(step(ask, 'petals'), 3, 13) * (step(ask, 'tracery') === GOLDEN ? 0.872678 : 1)

/** `set_figure` and `tune`: each rotor's harmonic, with Ring tuning. */
export function roseRatios(ask: Ask): number[] {
  const m = roseSpacing(ask)
  return each(ROTORS, (j) => {
    if (j === 0) return 1
    const ratio = ringOf(j) * m + (j % 2 ? -1 : 1)
    return Math.pow(2, (ask('bend') / 1200) * Math.log2(ratio)) * ratio
  })
}

/** `set_profile`: how loud each rotor is in a figure whose power is one. */
export function roseWeights(ask: Ask): number[] {
  const tracery = step(ask, 'tracery')
  const [rings, reach] = [ask('rings'), ask('reach')]
  const apart = 1 / (0.64 * rings * Math.sqrt(Math.sqrt(rings)))
  const heart = 0.08 * Math.pow(156, ask('heart'))
  const target = each(ROTORS, (j) => {
    if (j === 0) return heart * (tracery === POINTED ? 0.07 : tracery === BROKEN ? 0.36 : 1)
    const k = ringOf(j)
    const out = (0.8 / rings - k) * apart
    let ring = Math.exp(out * lerp(9, 0.4, reach))
    if (tracery === POINTED) {
      const far = (k - (0.8 + 0.62 * reach * (rings - 1))) * 1.3
      ring = 1.2 * Math.exp(-far * far) + 0.004
    } else if (tracery === BROKEN) ring = PANES[k - 1] * Math.exp(out * lerp(4, 0, reach))
    else if (tracery === GOLDEN) ring = 0.9 * Math.exp((out + 0.4 * apart) * lerp(6, 0.5, reach))
    return ring * clamp(rings - k + 1, 0, 1)
  })
  const power = target.reduce((sum, t, j) => sum + (j > 0 ? t * t : heart * heart), 0)
  return target.map((t) => t / Math.sqrt(power))
}

/** One key as it is played. */
export interface RoseKey {
  frequency: number
  gain: number
  age: number
  released: number | null
}
const keyOf = (hz: number): number => 69 + 12 * Math.log2(hz / 440)
const octaveOf = (hz: number): number => (keyOf(hz) - 60) / 12
const againstOf = (ask: Ask): number => clamp(-10 * ask('turn'), 0, 1)
/** `pace`: how fast this key rocks against Turn's own rate. */
const paceOf = (hz: number): number => 0.75 + 0.5 * part(keyOf(hz) * 0.618034)
const firstPlane = (hz: number, k: number): number =>
  part(0.3 * part(keyOf(hz) * 0.236068) + 0.05 * k - 0.1)
/** `turn_hz`: how many times a second a ring of pace 1 rocks. */
export const roseTurnHz = (ask: Ask): number => 5 * Math.pow(Math.abs(ask('turn')), 2.5)

/** How far the first ring of a key has rocked `age` seconds after it began, in cycles. */
export const roseRocked = (ask: Ask, hz: number, age: number): number =>
  roseTurnHz(ask) * paceOf(hz) * age
/** Where the device says the first ring is (its `angle`), from how far it has rocked. */
export const roseAngle = (hz: number, rocked: number): number => part(firstPlane(hz, 1) + rocked)

/** `set_gains`: the plane of each rotor, how far it faces (1 is full) and how it leans to the left. */
export function roseFacing(
  ask: Ask,
  hz: number,
  rocked: number,
): { facing: number; lean: number }[] {
  const tilt = Math.sqrt(Math.max(ask('tilt'), 0))
  const against = againstOf(ask)
  return each(ROTORS, (j) => {
    const k = ringOf(j)
    const speed = k > 0 && k % 2 === 0 ? lerp(1, -1, against) : 1
    let angle = firstPlane(hz, k) + speed * rocked + (j % 2 ? 0.07 : 0)
    if (k === 0) angle += 0.5
    if (k % 2 === 0) angle += 0.5 * against
    const depth = j === 0 ? 0.5 * tilt : tilt
    const face = 0.5 - 0.5 * Math.cos(TWO_PI * angle)
    return {
      facing: (1 - 0.97 * depth * face * (2 - face)) * (1 + 0.55 * depth),
      lean: 1.1 * depth * Math.sin(TWO_PI * (angle + 0.11)),
    }
  })
}

/** Where each rotor stands as the heart sets out, in cycles (`set_figure`, and the spin of `tune`). */
export function rosePhases(ask: Ask, hz: number, rocked: number): number[] {
  const against = againstOf(ask)
  return each(ROTORS, (j) => {
    const k = ringOf(j)
    const own = 0.7 + 0.9 * part(k * 0.618034)
    const spin = k === 0 ? 0 : (k % 2 ? own : own * lerp(1, -1.4, against)) * (0.22 / paceOf(hz))
    return part(k * k * 0.118034 + k * 0.19 + 5.52 * octaveOf(hz)) + spin * rocked
  })
}

/** `open_rotors`: how open each rotor is, and when it opens, 0..1. */
function opening(ask: Ask, hz: number, at: number) {
  const order = step(ask, 'order')
  const bloom = ask('bloom')
  const rings = clamp(EDGE_HZ / (hz * roseSpacing(ask)), 1, Math.max(ask('rings'), 1))
  const front = part(at / Math.max(1.4 * bloom, 0.35) + 0.1) * (rings + 3.2) - 1.2
  return each(ROTORS, (j) => {
    const k = ringOf(j)
    const near = clamp(k / (rings + 0.5), 0, 1)
    if (order === PASSING) {
      const far = (k - front) / (0.5 + 0.1 * rings)
      return { open: 0.03 + 0.87 * Math.exp(-far * far), place: near }
    }
    const place = order === RIM_FIRST ? 1 - near : near
    const open = smooth((at + 0.08 * bloom - 0.85 * bloom * place) / (0.3 * bloom + 0.01))
    return { open: j > 0 || order === RIM_FIRST ? open : 1, place }
  })
}

/** `strike`: what a strike gives each rotor. */
function struck(ask: Ask, weights: readonly number[], gain: number): number[] {
  const much = step(ask, 'tracery') === GOLDEN ? 0.3 + 0.7 * ask('strike') : ask('strike')
  const hit = (1 - 0.48 * much * much) * Math.sin((Math.PI / 2) * much)
  const amount = each(ROTORS, (j) => {
    const k = ringOf(j)
    const rim = step(ask, 'order') === RIM_FIRST && k < 2 ? 0.3 + 0.3 * k : 1
    const soft = k > 1 ? Math.pow(0.55 + 0.45 * gain, k - 1) : 1
    return Math.pow(1 + k, 0.9 * (0.15 + 0.75 * gain)) * soft * rim
  })
  const whole = weights.reduce((sum, w) => sum + w * w, 1e-9)
  const power = weights.reduce((sum, w, j) => sum + (w * amount[j]) ** 2, 1e-9)
  return amount.map((a) => a * hit * Math.sqrt(whole / power))
}

export interface RoseLevels {
  /** Each rotor as it stands now, facing the listener. */
  level: number[]
  /** Its share inside Fold and Curl. */
  inside: number[]
  /** How far the rose is open, as the device reports it. */
  opened: number
}

/** `set_gains`: the level of every rotor of a key; where there is no key to hear, of one fully open. */
export function roseLevels(ask: Ask, key: RoseKey, rest = false): RoseLevels {
  const { frequency: hz, gain } = key
  const weights = roseWeights(ask)
  const ratios = roseRatios(ask)
  const up = key.released ?? 0
  const held = key.age - up
  const bell = step(ask, 'tracery') === GOLDEN
  const damping = ask('damping') * (1 + 1.4 * ask('damping'))
  const seconds = ask('decay') * Math.pow(clamp(220 / hz, 0.1, 2), 0.35)
  const m = roseSpacing(ask)
  const open = opening(ask, hz, Math.max(key.age - OPENS_LATE, 0))
  const hits = struck(ask, weights, gain)
  const rise = Math.sin((Math.PI / 2) * clamp(held / ask('attack'), 0, 1)) ** 2
  const sustained = 0.64 * Math.pow(1 - ask('strike'), 1.6)
  const inside: number[] = []
  let sum = 0
  const level = weights.map((weight, j) => {
    const at = hz * ratios[j]
    const ratio = j === 0 ? 1 : ringOf(j) * m + (j % 2 ? -1 : 1)
    inside.push(1 - smooth((at - FOLD_FROM) / (FOLD_TO - FOLD_FROM)))
    const edge = 1 - smooth((at - EDGE_HZ) / (TOP_HZ - EDGE_HZ))
    const own = Math.max(seconds * Math.pow(ratio, -damping), 0.03)
    const dies = (SIXTY_DB * Math.max(key.age - 0.005, 0)) / own
    const soak = Math.pow(Math.max(ratio, 1), -0.9 * ask('damping'))
    if (rest) return weight * edge * (sustained * soak + hits[j])
    sum += (weight * open[j].open) ** 2
    const close = Math.exp((-2.2 * open[j].place * SIXTY_DB * up) / ask('release'))
    const stay = bell ? Math.exp(-0.45 * Math.max(dies - (SIXTY_DB * 0.145) / own, 0)) : 1
    const pad = sustained * rise * stay * soak * open[j].open
    return weight * edge * close * (pad + hits[j] * Math.exp(-dies))
  })
  return { level, inside, opened: clamp(Math.sqrt(sum), 0, 1) }
}

/** `set_tone`: where Light begins to darken a key, in Hz. */
export function roseCutoff(ask: Ask, hz: number, gain: number, opened: number): number {
  const tracery = step(ask, 'tracery')
  const light = Math.log2(ask('light')) + ROSE_OPENNESS[tracery]
  const opening = tracery === POINTED ? 0 : [1.4, -0.8, 0.5][step(ask, 'order')] * (opened - 1)
  return clamp(Math.pow(2, light + 0.4 * octaveOf(hz) + 1.3 * (gain - 0.7) + opening), 60, 21600)
}
/** `kOpenness`: the octaves of light a tracery lets in. */
export const ROSE_OPENNESS = [0, 0.65, 1.2, 0.4]
/** What Light leaves of a frequency: two poles in a row. */
export const rosePass = (hz: number, cutoff: number): number => 1 / (1 + (hz / cutoff) ** 2)

/**
 * `render_voice`: the figure a key draws over `turns` periods of its note, left
 * across and right upwards, so many points a period. One period runs first, so
 * the radius Curl looks back at is the one it would be.
 */
export function roseFigure(
  ask: Ask,
  key: Pick<RoseKey, 'frequency' | 'gain'>,
  { level, inside }: Pick<RoseLevels, 'level' | 'inside'>,
  planes: readonly { lean: number }[],
  phases: readonly number[],
  turns: number,
  perTurn: number,
): [number, number][] {
  const hz = key.frequency
  const ratios = roseRatios(ask)
  const figure = level.map((a, j) => a * inside[j])
  const power = figure.reduce((sum, a) => sum + a * a, 0)
  const spread = Math.max(power * power - figure.reduce((sum, a) => sum + a ** 4, 0), 0)
  const live = Math.min((1.1 * power) / (power + 0.012), 1.1)
  const room = clamp(400 / hz, 0.12, 1)
  const inverse = 1 / (TWO_PI * Math.max(Math.sqrt(spread), 0.25 * power, 0.004))
  const fold = MOST_FOLD * Math.pow(ask('fold'), 0.8) * (0.5 + 0.7 * key.gain) * room * live
  const tip = (0.13 * fold) / (fold + 1.2)
  const makeup = 1 + (0.45 * fold) / (fold + 1)
  const curl = 9 * ask('curl') * (0.6 + 0.57 * key.gain) * room * live
  const anchor = (0.7 * (fold + curl)) / (fold + curl + 1.5)
  const behind = clamp(0.5 * roseSpacing(ask) * hz, 40, 3000) / hz
  const follows = 1 - Math.exp((-TWO_PI * behind) / perTurn)
  const used = each(ROTORS, (j) => j).filter((j) => level[j] > 1e-4)
  const points: [number, number][] = []
  let lag = 0
  for (let i = -perTurn; i <= turns * perTurn; i++) {
    let [x, y, px, py] = [0, 0, 0, 0]
    for (const j of used) {
      const at = TWO_PI * (phases[j] + ((j % 2 ? -1 : 1) * ratios[j] * i) / perTurn)
      const [c, s] = [Math.cos(at), Math.sin(at)]
      x += c * figure[j]
      y += s * figure[j]
      const apart = level[j] - figure[j] + (j === 0 ? anchor * figure[0] : 0)
      px += c * (apart + level[j] * planes[j].lean)
      py += s * (apart - level[j] * planes[j].lean)
    }
    const far = clamp((x * x + y * y - power) * inverse, -0.64, 0.64)
    lag += follows * (far - lag)
    if (i < 0) continue
    const folded = makeup * Math.cos(TWO_PI * (fold * far - tip))
    const [c, s] = [folded * Math.cos(TWO_PI * curl * lag), folded * Math.sin(TWO_PI * curl * lag)]
    points.push([x * c - y * s + px, x * s + y * c + py])
  }
  return points
}

// --- Where it stands -----------------------------------------------------------

/** The scale of pitch at the right, and of level across it. */
const LOW_HZ = 60
export const HIGH_HZ = 16000
const FLOOR_DB = 54

export function roseLayout({ width, height }: Pick<DisplayView, 'width' | 'height'>) {
  const r = Math.min((height - 24) / 2, width * 0.29)
  const window = { x: 5 + r, y: 11 + (height - 20) / 2, r }
  const left = window.x + r + 7
  const slope: Box = { x: left, y: 18, w: width - 7 - left, h: height - 32 }
  return { window, slope, foot: { x: 4, y: height - 7, w: width - 8, h: 3 } }
}

/** How far out ring `k` stands in the window, and the ring a distance stands for. */
export const roseRadius = (k: number, r: number): number => 0.82 * r * Math.pow(k / RINGS, 0.6)
export const ringAt = (distance: number, r: number): number =>
  RINGS * Math.pow(distance / (0.82 * r), 1 / 0.6)
export const roseY = (hz: number, box: Box): number =>
  box.y + box.h * (1 - clamp(Math.log(hz / LOW_HZ) / Math.log(HIGH_HZ / LOW_HZ), 0, 1))
export const hzOfY = (y: number, box: Box): number =>
  LOW_HZ * Math.pow(HIGH_HZ / LOW_HZ, clamp(1 - (y - box.y) / box.h, 0, 1))
export const roseX = (level: number, box: Box): number =>
  box.x + box.w * clamp(1 + gainToDb(level) / FLOOR_DB, 0, 1)
