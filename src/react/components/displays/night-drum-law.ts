// What the Night Drum display draws, worked out as the device works it out
// (`cpp/devices/night-drum/night_drum.h` and `drum_tables.h`; the constants
// carry their names): the twenty modes of the skin and how far Load has drawn
// them onto the harmonics, how strongly a hand wakes each at its place, how
// loud each is through the body, and how long it rings.

import { clamp } from '../display-kit'

export type NightRead = (name: string) => number

/** `skin_mode`: nodal diameters, Bessel zero, the ratio bare and loaded, the two over a kettle, which of its pair. */
export const NIGHT_MODES: readonly (readonly number[])[] = [
  [0, 2.4048, 1.0, 1, 1.0, 1, 0],
  [1, 3.8317, 1.594, 2, 1.56, 1.5, 0],
  [1, 3.8317, 1.594, 2, 1.56, 1.5, 1],
  [2, 5.1356, 2.136, 3, 2.07, 2, 0],
  [2, 5.1356, 2.136, 3, 2.07, 2, 1],
  [0, 5.5201, 2.296, 3, 2.03, 2, 0],
  [3, 6.3802, 2.653, 4, 2.56, 2.5, 0],
  [3, 6.3802, 2.653, 4, 2.56, 2.5, 1],
  [1, 7.0156, 2.918, 4, 2.61, 2.5, 0],
  [1, 7.0156, 2.918, 4, 2.61, 2.5, 1],
  [4, 7.5883, 3.156, 5, 3.04, 3, 0],
  [4, 7.5883, 3.156, 5, 3.04, 3, 1],
  [2, 8.4172, 3.501, 5, 3.19, 3, 0],
  [2, 8.4172, 3.501, 5, 3.19, 3, 1],
  [0, 8.6537, 3.6, 5, 3.13, 3, 0],
  [5, 8.7715, 3.652, 6, 3.51, 3.5, 0],
  [3, 9.761, 4.06, 6, 3.64, 3.5, 1],
  [6, 9.9361, 4.154, 7, 3.98, 4, 0],
  [7, 11.0864, 4.654, 8, 4.46, 4.5, 1],
  [8, 12.2251, 5.131, 9, 4.92, 5, 0],
]
/** `kRestShare`: how much of a resting hand each mode feels. */
const REST_SHARE = [
  1, 0.8, 0.8, 0.9, 0.9, 2, 1.2, 1.2, 1.4, 1.4, 1.6, 1.6, 1.8, 1.8, 3, 2, 2.2, 2.4, 2.6, 2.8,
]

interface NightBody {
  name: string
  /** The formants: log2 of hertz, octaves wide, gain. */
  bump: readonly number[]
  width: readonly number[]
  lift: readonly number[]
  base: number
  low: number
  high: number
  ring: number
  radial: number
  tilt: number
  kettle: number
}
const body = (
  name: string,
  bump: number[],
  width: number[],
  lift: number[],
  [base, low, high, ring, radial, tilt, kettle]: number[],
): NightBody => ({ name, bump, width, lift, base, low, high, ring, radial, tilt, kettle })

/** `body_of`, as Cavity counts them. */
export const NIGHT_BODIES: readonly NightBody[] = [
  body(
    'Shallow',
    [9.4, 10.7, 11.7],
    [0.4, 0.5, 0.6],
    [1.5, 3, 1.4],
    [0.35, 620, 7000, 1.9, 1.5, 0.6, 0],
  ),
  body(
    'Pot',
    [7.8, 9.1, 10.3],
    [0.8, 0.34, 0.28],
    [1.5, 2.4, 1.8],
    [0.38, 30, 2000, 0.8, 1.2, 0.1, 0],
  ),
  body('Kettle', [7, 8.3, 10.2], [0.5, 0.7, 0.6], [1.6, 0.9, 0.2], [0.4, 40, 760, 2.6, 4, -0.5, 1]),
  body(
    'Tube',
    [6.8, 9.6, 10.9],
    [0.3, 0.14, 0.2],
    [0.6, 3.2, 5],
    [0.03, 60, 4500, 0.75, 0.6, 0.4, 0],
  ),
  body(
    'None',
    [10, 10.8, 12],
    [0.8, 0.8, 0.8],
    [1.1, 0.6, 0.2],
    [0.9, 640, 5500, 0.15, 0.6, 0.35, 0],
  ),
]

interface NightHand {
  name: string
  sustained: boolean
  touch: number
  area: number
  bright: number
  ring: number
  bend: number
  clear: number
  pace: number
}
const hand = (
  name: string,
  sustained: boolean,
  [touch, area, bright, ring, bend, clear, pace]: number[],
): NightHand => ({ name, sustained, touch, area, bright, ring, bend, clear, pace })

/** `hand_of`, as Hand counts them. */
export const NIGHT_HANDS: readonly NightHand[] = [
  hand('Finger', false, [0.00009, 0.1, 0, 1, 1, 0, 1]),
  hand('Thumb', false, [0.0005, 0.26, -1, 0.5, 1.8, -0.6, 0.16]),
  hand('Palm', false, [0.00016, 0.34, 0.3, 0.13, 1.2, 0.2, 0.22]),
  hand('Stick', false, [0.0001, 0.02, 1.4, 1.3, 0.8, 0.8, 1.25]),
  hand('Brush', true, [0.00008, 0.22, -0.3, 0.25, 0.6, 0, 0.09]),
  hand('Rub', true, [0.00005, 0.04, 1.4, 0.09, 1.4, 0, 0.08]),
  hand('Hum', true, [0.00012, 0.13, 0.6, 1, 1, 0, 0.5]),
]

const chosen = <T>(list: readonly T[], value: number): T =>
  list[clamp(Math.floor(value + 0.5), 0, list.length - 1)]
export const nightHand = (read: NightRead): NightHand => chosen(NIGHT_HANDS, read('hand'))
export const nightBody = (read: NightRead): NightBody => chosen(NIGHT_BODIES, read('cavity'))

/** `bessel`: J of a whole order, by its series. */
function bessel(m: number, x: number): number {
  let term = 1
  for (let i = 1; i <= m; i += 1) term *= (0.5 * x) / i
  let sum = term
  for (let k = 1; k < 60; k += 1) {
    term *= (-0.25 * x * x) / (k * (k + m))
    sum += term
  }
  return sum
}
const STEPS = 32
/** `Shapes`: each mode along the radius, its highest at 1. */
const SHAPES = NIGHT_MODES.map(([m, zero]) => {
  const at = Array.from({ length: STEPS + 1 }, (_, i) => bessel(m, (zero * i) / STEPS))
  const most = Math.max(...at.map(Math.abs))
  return at.map((y) => y / most)
})

/** How high mode `k` stands at a radius, 0 at the centre to 1 at the rim. */
export function nightShape(k: number, radius: number): number {
  const place = clamp(radius, 0, 1) * STEPS
  const i = Math.min(STEPS - 1, Math.floor(place))
  return SHAPES[k][i] + (SHAPES[k][i + 1] - SHAPES[k][i]) * (place - i)
}

/** Where the hand comes down, as a share of the radius, and back to the knob. */
export const nightRadius = (place: number): number => 0.03 + 0.92 * clamp(place, 0, 1)
export const nightPlace = (radius: number): number => clamp((radius - 0.03) / 0.92, 0, 1)

/** `start`: the angle of the hand on the drum of a key, in turns. */
export function nightAngle(hz: number): number {
  const home = Math.log2(hz) * 0.41
  return 0.04 + 0.17 * (home - Math.floor(home))
}

/** `derive`: how far up from bare to loaded the modes are. */
export function nightLoaded(load: number, off: number): number {
  return (1 - Math.pow(1 - load, 2.5)) * (1 - 0.45 * Math.pow(off, 4))
}

/** Where a mode stands before it is pulled off its mate, in octaves over the note. */
function octaveOf(k: number, loaded: number, kettle: number): number {
  const [, , bare, full, bowlBare, bowlFull] = NIGHT_MODES[k].map(Math.log2)
  const open = bare + (full - bare) * loaded
  return open + (bowlBare + (bowlFull - bowlBare) * loaded - open) * kettle
}

/** `derive`: the ratio of each mode to the note. */
export function nightRatios(read: NightRead): number[] {
  const off = read('offCentre')
  const loaded = nightLoaded(read('load'), off)
  const { kettle } = nightBody(read)
  return NIGHT_MODES.map(([m, , , , , , side], k) => {
    const apart = m > 0 ? 0.06 * off * off * (1 + 0.25 * m) : 0
    return Math.pow(2, octaveOf(k, loaded, kettle)) * (1 + (side ? apart : -apart))
  })
}

/** `outputs`: what the body makes of a mode of the key at `hz`, which stands at `at` hertz. */
export function nightBodyGain(read: NightRead, at: number): number {
  const of = nightBody(read)
  const shift = read('cavityTune') / 12
  const moved = Math.pow(4, shift)
  const octave = Math.log2(at)
  let level = of.base
  of.bump.forEach((bump, b) => {
    const d = (octave - bump - shift) / of.width[b]
    level += of.lift[b] / (1 + d * d)
  })
  level *= (at * at) / (at * at + of.low * of.low * moved)
  level /= 1 + (at * at) / (of.high * of.high * moved)
  return level * clamp((16000 - at) / 4000, 0, 1)
}

/** `set_contact`: how long the hand is on the skin, in seconds. */
export function nightContact(read: NightRead, hz: number, gain: number): number {
  const size = Math.pow(clamp(hz / 220, 0.2, 8), -0.35)
  const soft = Math.pow(2, (0.5 - read('touch')) * 6)
  return clamp(nightHand(read).touch * size * soft * (1.7 - 1.1 * gain), 0.000008, 0.02)
}

export interface NightMode {
  ratio: number
  /** How far a stroke moves the skin in this mode, the strongest of the hand's at 1; its sign is its way. */
  wake: number
  /** The same as it is heard: through the body. */
  level: number
  /** Seconds it rings to -60 dB while the key is held. */
  ring: number
}

/** `aim`, `colour`, `tune`, `outputs`: one stroke on the drum of a key, mode by mode. */
export function nightStroke(read: NightRead, hz: number, gain: number): NightMode[] {
  const how = nightHand(read)
  const of = nightBody(read)
  const off = read('offCentre')
  const skin = read('skin')
  const loaded = nightLoaded(read('load'), off)
  const ratios = nightRatios(read)
  const octave = Math.log2(hz)
  const low = clamp(7.7 - octave, 0, 2)
  const tilt = (1.3 - 2.3 * skin - of.tilt - 0.35 * (1 - loaded)) * (1 - 0.3 * low) - 0.12 * low
  const place = read('place')
  const angle = nightAngle(hz)
  const lean =
    how.bright +
    1.2 * (place - 0.5) +
    (read('touch') - 0.45) +
    0.6 * (gain - 0.7) +
    (how.sustained ? 1.5 * (read('damp') - 0.15) : 0)
  const both = Math.min(1, 1.5 * off)
  const contact = nightContact(read, hz, gain)
  const key = Math.pow(clamp(hz / 220, 0.1, 20), 0.4)
  const asked = Math.max((read('ring') * of.ring * how.ring) / key, 1e-3)
  const longest = Math.max(asked / Math.pow(1 + Math.pow(asked / 18, 4), 0.25), 0.07)
  const rest = 14 * read('damp') * read('damp')
  const lossPower = 1.3 - 1.8 * skin
  const modes = NIGHT_MODES.map(([m, zero, , , , , side], k): NightMode => {
    const up = octaveOf(k, loaded, of.kettle)
    let wake = nightShape(k, nightRadius(place))
    if (m > 0) {
      const turn = 2 * Math.PI * m * angle
      const line = side ? Math.sin(turn) : Math.cos(turn)
      wake *= line + both * ((0.7071 * line) / Math.sqrt(line * line + 0.02) - line)
    }
    wake *= Math.exp(-0.5 * Math.pow(how.area * zero, 2))
    wake *= Math.pow(2, (lean - tilt) * up)
    const at = hz * ratios[k]
    // The two-pole of the contact, and what lies far under the note is kept out.
    wake /= 1 + Math.pow(2 * Math.PI * at * contact, 2)
    wake *= ratios[k] / Math.hypot(ratios[k], 0.4)
    let loss = Math.pow(2, lossPower * up) * (m === 0 && k > 0 ? of.radial : 1)
    if (k === 0) loss = 1 + 2.5 * (1 - loaded)
    const nepers =
      (6.907755 / longest) * loss * Math.pow(2, -how.clear * up) +
      rest * REST_SHARE[k] +
      5 * Math.pow(at / 3500, 2)
    return {
      ratio: ratios[k],
      wake,
      level: wake * nightBodyGain(read, at),
      ring: 6.907755 / nepers,
    }
  })
  const most = (part: 'wake' | 'level'): number =>
    Math.max(1e-9, ...modes.map((mode) => Math.abs(mode[part])))
  const [wakes, levels] = [most('wake'), most('level')]
  return modes.map((mode) => ({ ...mode, wake: mode.wake / wakes, level: mode.level / levels }))
}

/** `derive`, `tune`: the second skin's own modes, as ratios to the key, and `kOtherShare`. */
const OTHER_LIKE = [0, 1, 3, 6]
export function nightOther(read: NightRead): number[] {
  const loaded = nightLoaded(read('load'), read('offCentre'))
  const { kettle } = nightBody(read)
  const other = Math.pow(2, read('otherTune') / 12)
  return OTHER_LIKE.map((k) => other * Math.pow(2, octaveOf(k, loaded, kettle)))
}
