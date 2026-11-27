// The overtones of one note of Ridge Lines as the device works them out
// (`draw`, `band` and `build_rows` in `cpp/devices/ridge-lines/ridge_lines.h`,
// the land, the matter and the body in `rows.h`; the constants carry their
// names): what is seen of each row is transformed, the rows behind go through
// the bands that glide, the shadow and the land lie over all, and the whole is
// brought to one loudness.

import { clamp } from '../display-kit'
import {
  RIDGE_POINTS,
  ridgeFar,
  ridgeGrain,
  ridgeNear,
  ridgeRepeats,
  ridgeRock,
  ridgeRows,
  ridgeSee,
  ridgeSightless,
  type Ask,
  type RidgeSight,
} from './ridge-lines-rows'

const HARMONICS = 240
const gainOf = (db: number): number => Math.pow(10, db / 20)
const bump = (octave: number, at: number, wide: number): number =>
  Math.exp(-0.5 * ((octave - at) / wide) ** 2)

/** `near_matter`: what the row in front is made of, in dB at its harmonic `h`. */
function nearMatter(shape: number, h: number): number {
  const x = Math.log2(h)
  if (shape === 0) return 3 - 5 * Math.max(0, x - 0.8)
  if (shape === 1)
    return 6 - 24 * bump(x, 1, 0.8) + 12 * bump(x, 2.8, 0.7) - 8 * Math.max(0, x - 3.6)
  if (shape === 2) return -1.2 * Math.max(0, x - 2)
  return -16 + 16 * Math.min(1, x / 2.6) + 2 * x
}

/** `near_land`: what the row in front does to the whole note. */
function nearLand(shape: number, hz: number, h: number): number {
  const x = Math.log2(hz / 440)
  if (shape === 0) return 4 - 7.5 * clamp(x + 0.4, 0, 3)
  if (shape === 1)
    return -11 * clamp(0.4 - x, 0, 2) + 13 * bump(x, 1.45, 0.42) - 7 * Math.max(0, x - 2.4)
  if (shape === 2) return 4.6 * clamp(x - 1.1, 0, 2.6)
  return (h % 2 === 0 ? -16 : 2) - 9 * bump(x, 1, 0.7) + 3.5 * clamp(x - 1.6, 0, 2.5)
}

/** `far_land`: what the land behind does to it. */
function farLand(shape: number, hz: number): number {
  const x = Math.log2(hz / 440)
  if (shape === 0) return 2 - 1.2 * Math.max(0, x - 1)
  if (shape === 1) return -14 * bump(x, 0.5, 1.1) + 6 * bump(x, 3, 0.8) - 5 * Math.max(0, x - 3.6)
  return -5 * clamp(0.2 - x, 0, 2) + 12 * bump(x, 1.6, 0.65) - 12 * Math.max(0, x - 2.3)
}

/** `kMatter`: the band each kind of land behind lets through. */
const MATTER = [
  { at: 1.1, sharp: 0.9, climb: 2.4, apart: 0.24, lag: 0.03, loud: 2, swell: 1.5, level: 0 },
  { at: 6, sharp: 3, climb: 0.9, apart: 2.6, lag: 0.45, loud: 3, swell: 0, level: 3 },
  { at: 2.8, sharp: 1.6, climb: 3, apart: 0.9, lag: 0.12, loud: 4, swell: 6.5, level: 3 },
] as const

/** `kBands` of the body: Hz, octaves, dB. */
const BODY: readonly (readonly [number, number, number])[] = [
  [60, 0.5, -5],
  [205, 0.28, 6],
  [300, 0.2, 5],
  [410, 0.24, -6],
  [540, 0.22, 6],
  [780, 0.26, -7],
  [1120, 0.26, 5],
  [1650, 0.3, -6],
  [2500, 0.4, 3],
  [4300, 0.5, -6],
  [9500, 0.9, -8],
  [18000, 0.8, -8],
]
const bodyDb = (hz: number): number =>
  2.7 * BODY.reduce((sum, [at, wide, db]) => sum + db * bump(Math.log2(hz / at), 0, wide), 0)

/** `passing`: where a band stands, 0 to 1, over one whole passing of its row. */
export function ridgePassing(shape: number, turn: number): number {
  const x = turn - Math.floor(turn)
  if (shape === 0) return 0.5 - 0.5 * Math.cos(2 * Math.PI * x)
  if (shape === 1) {
    const t = 5 * x
    return (1 - 2 * Math.abs(t - Math.floor(t) - 0.5)) ** 2
  }
  return x < 0.84 ? x / 0.84 : (1 - x) / 0.16
}

/** How far the two eyes stand off the middle, as each kind of land behind shows it. */
export function ridgeEyes(ask: Ask): { apart: number; lag: number } {
  const eyes = 0.5 * Math.pow(ask('eyes'), 1.5)
  const { apart, lag } = MATTER[ridgeFar(ask)]
  return { apart: eyes * apart, lag: eyes * lag }
}

/** The harmonic the band of the middle row lies on, or of the last one. */
export function ridgeBand(ask: Ask, hz: number, row: 0 | 1, turn: number): number {
  const shape = ridgeFar(ask)
  const { at, climb } = MATTER[shape]
  const beyond = row === 1 ? 2.2 * (ask('parallax') - 0.4) : 0
  const octaves = climb * (ridgePassing(shape, turn) - 0.5) + beyond
  return clamp(ridgeRepeats(ask)[row] * at * 2 ** octaves, 1, Math.max(1, 5200 / hz))
}

/** The shadow of an outline: how dark it is, and how far on in the cycle it lies. */
export const ridgeShadow = (sun: number): { dark: number; length: number } => ({
  dark: 0.9 * (sun < 0.35 ? (sun * (2 - sun / 0.35)) / 0.35 : 1),
  length: 0.012 + 0.488 * sun ** 1.5,
})

/** A transform of `re` and `im` in place; the points are a power of two. */
function transform(re: Float64Array, im: Float64Array): void {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j |= bit
    if (i < j) [re[i], re[j], im[i], im[j]] = [re[j], re[i], im[j], im[i]]
  }
  for (let size = 2; size <= n; size *= 2) {
    for (let k = 0; k < size / 2; k++) {
      const [c, s] = [Math.cos((-2 * Math.PI * k) / size), Math.sin((-2 * Math.PI * k) / size)]
      for (let a = k; a < n; a += size) {
        const b = a + size / 2
        const [x, y] = [re[b] * c - im[b] * s, re[b] * s + im[b] * c]
        re[b] = re[a] - x
        im[b] = im[a] - y
        re[a] += x
        im[a] += y
      }
    }
  }
}

/** The note that is drawn: what it was played with, and where it and its rows are now. */
export interface RidgeNote {
  hz: number
  gain: number
  /** Its envelope, 0 to 1, and what is left of its stroke. */
  level: number
  struck: number
  turns: readonly [number, number]
}

/** What each harmonic owes to each row for the left ear, as amplitudes: harmonic `h` at `h`. */
export interface RidgeOvertones {
  count: number
  all: Float64Array
  near: Float64Array
  middle: Float64Array
  far: Float64Array
}

/** Everything that stands still while the rows pass: kept until a knob of it turns. */
export interface RidgeStill {
  asked: string
  rows: readonly Float64Array[]
  nearRe: Float64Array
  nearIm: Float64Array
}

const STILL_KNOBS = ['near', 'far', 'repeats', 'sun', 'jag', 'travel', 'parallax', 'vibrato']

export function ridgeStill(ask: Ask, kept: RidgeStill | null): RidgeStill {
  const asked = STILL_KNOBS.map(ask).join()
  if (kept?.asked === asked) return kept
  const rows = ridgeRows(ask)
  const nearRe = Float64Array.from(rows[0])
  const nearIm = new Float64Array(RIDGE_POINTS)
  const grainRe = Float64Array.from(ridgeGrain()[0])
  const grainIm = new Float64Array(RIDGE_POINTS)
  transform(nearRe, nearIm)
  transform(grainRe, grainIm)
  for (let h = 1; h <= HARMONICS; h++) {
    const mask = gainOf(nearMatter(ridgeNear(ask), h))
    const rough = ridgeRock(ask) * (1 - Math.min(1, mask))
    nearRe[h] = nearRe[h] * mask + rough * grainRe[h]
    nearIm[h] = nearIm[h] * mask + rough * grainIm[h]
  }
  return { asked, rows, nearRe, nearIm }
}

/** `draw`: the two eyes, and the overtones of a note in the left ear. */
export function ridgeOvertones(
  ask: Ask,
  still: RidgeStill,
  note: RidgeNote,
  sampleRate: number,
  sight: readonly [RidgeSight, RidgeSight] = [ridgeSightless(), ridgeSightless()],
): RidgeOvertones {
  const { hz, gain, level } = note
  const shape = ridgeFar(ask)
  const matter = MATTER[shape]
  const eyes = ridgeEyes(ask)
  ;[1, -1].forEach((side, n) =>
    ridgeSee(ask, still.rows, note.turns, side * eyes.apart, gain, sight[n]),
  )
  const count = clamp(Math.floor(Math.min(18000, 0.44 * sampleRate) / hz), 1, HARMONICS)
  const open =
    5.8 * ask('tone') +
    3.2 * (gain - 0.7) +
    1.2 * note.struck +
    ask('glow') * (1.2 + 3.4 * Math.log2(Math.max(level, 0.25)))
  const cutoff = 220 * 2 ** (open + 0.45 * Math.log2(hz / 220))
  const [wood, box] = [2 * Math.min(0.5, ask('body')), 2 * Math.max(0, ask('body') - 0.5)]
  const shade = new Float64Array(count + 1)
  const weight = new Float64Array(count + 1)
  for (let h = 1; h <= count; h++) {
    const at = h * hz
    const body = gainOf(bodyDb(at))
    const boxed = 1 + wood * (Math.sqrt(body) - 1) + box * (body - Math.sqrt(body))
    const land = gainOf(nearLand(ridgeNear(ask), at, h) + farLand(shape, at))
    const soft = Math.pow(h, 0.9 - 2 * ask('penumbra'))
    shade[h] = (boxed * land * soft) / (1 + (at / cutoff) ** 2)
    const ear = (at / 1800) ** 2
    weight[h] = shade[h] ** 2 * (1 + (1.5 * ear) / (1 + ear))
  }

  // One row behind: its two ears out of one transform, each through its band.
  const behindRow = (row: 0 | 1) => {
    const re = Float64Array.from(row === 0 ? sight[0].middleSeen : sight[0].farSeen)
    const im = Float64Array.from(row === 0 ? sight[1].middleSeen : sight[1].farSeen)
    transform(re, im)
    const bands = [1, -1].map((side) => {
      const turn = note.turns[row] + side * eyes.lag
      const at = ridgeBand(ask, hz, row, turn)
      const stands = 2 * ridgePassing(shape, turn) - 1
      return { at, peak: gainOf(matter.level + matter.loud * stands) }
    })
    const gainAt = (h: number, { at, peak }: { at: number; peak: number }): number => {
      const off = h / at - at / h
      const hazed = (h * hz) / (row === 0 ? 10000 : 7000)
      return (0.5 * peak * (0.02 + 1 / (1 + matter.sharp * off * off))) / (1 + hazed * hazed)
    }
    const parts = [0, 1, 2, 3].map(() => new Float64Array(count + 1))
    let energy = 0
    for (let h = 1; h <= count; h++) {
      const [a, b, c, d] = [re[h], im[h], re[RIDGE_POINTS - h], im[RIDGE_POINTS - h]]
      const [l, r] = [gainAt(h, bands[0]), gainAt(h, bands[1])]
      ;[(a + c) * l, (b - d) * l, (b + d) * r, (c - a) * r].forEach((v, n) => {
        parts[n][h] = v
        energy += v * v * weight[h]
      })
    }
    return { parts, energy }
  }
  const [middle, far] = [behindRow(0), behindRow(1)]
  let nearEnergy = 0
  for (let h = 1; h <= count; h++)
    nearEnergy += 2 * (still.nearRe[h] ** 2 + still.nearIm[h] ** 2) * weight[h]

  const settled = ask('sustain')
  const over = clamp((level - settled) / (1.02 - settled), 0, 1)
  const behind = gainOf(-8 + 22 * ask('height') + 4 * over)
  const base = 1 / (nearEnergy + 1)
  const gm = behind * Math.pow((middle.energy + 1) * base, -0.3)
  const gf = behind * 1.3 * Math.pow((far.energy + 1) * base, -0.3)
  const { dark, length } = ridgeShadow(ask('sun'))
  const out: RidgeOvertones = {
    count,
    all: new Float64Array(count + 1),
    near: new Float64Array(count + 1),
    middle: new Float64Array(count + 1),
    far: new Float64Array(count + 1),
  }
  let energy = 0
  let first = 0
  for (let h = 1; h <= count; h++) {
    const turn = 2 * Math.PI * length * h
    const lit = Math.hypot(1 - dark * Math.cos(turn), dark * Math.sin(turn))
    const [nr, ni] = [still.nearRe[h], still.nearIm[h]]
    const [m, f] = [middle.parts, far.parts]
    const left = Math.hypot(nr + gm * m[0][h] + gf * f[0][h], ni + gm * m[1][h] + gf * f[1][h])
    const right = Math.hypot(nr + gm * m[2][h] + gf * f[2][h], ni + gm * m[3][h] + gf * f[3][h])
    const both = (left * left + right * right) * lit * lit
    if (h === 1) first = 0.5 * both * shade[1] ** 2
    else energy += both * weight[h]
    const heard = lit * shade[h]
    out.all[h] = left * heard
    out.near[h] = Math.hypot(nr, ni) * heard
    out.middle[h] = gm * Math.hypot(m[0][h], m[1][h]) * heard
    out.far[h] = gf * Math.hypot(f[0][h], f[1][h]) * heard
  }
  // The fundamental at the level it was seen at, or at the floor under it, as Ground says.
  const knob = ask('ground')
  const ground = knob * (0.4 + 1.4 * knob) * (1 - 0.5 * (gain - 0.7))
  const one = Math.sqrt((first + 0.1 * energy) * 4) * ground
  const share = (2 * energy + 4 * one * one) / (2 * RIDGE_POINTS * RIDGE_POINTS)
  const moving = Math.min(1, 6 * ask('travel'))
  const swell = gainOf(matter.swell * moving * (2 * ridgePassing(shape, note.turns[0]) - 1.3))
  const scale = (2 * Math.pow(Math.max(share, 1e-7), -0.485) * swell) / RIDGE_POINTS
  const tune = out.all[1] > 0 ? one / out.all[1] : 0
  out.near[1] *= tune
  out.middle[1] *= tune
  out.far[1] *= tune
  out.all[1] = one
  for (const row of [out.all, out.near, out.middle, out.far])
    for (let h = 1; h <= count; h++) row[h] *= scale
  return out
}
