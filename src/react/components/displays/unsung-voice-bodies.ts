// What Unsung Voice's display reads off the knobs, and how loud each overtone
// of a key is by its body, its mouth, its touch and its age, as the device has
// it (`cpp/devices/unsung-voice/bodies.h` and `unsung_voice.h`).

import { clamp, lerp } from '../display-kit'
import { type DisplayNote } from '../plate-display'

export const UNSUNG_PARAMS = [
  'body',
  'vowel',
  'tilt',
  'tolerance',
  'lift',
  'register',
  'partner',
  'lean',
  'pace',
  'glide',
  'linger',
  'second',
  'hold',
  'attack',
  'release',
] as const

export type UnsungSettings = Record<(typeof UNSUNG_PARAMS)[number], number>

export function unsungSettings(value: (name: string) => number): UnsungSettings {
  const set = Object.fromEntries(UNSUNG_PARAMS.map((name) => [name, value(name)])) as UnsungSettings
  set.body = clamp(Math.trunc(set.body + 0.5), 0, UNSUNG_BODIES.length - 1)
  return set
}

const SIXTY_DB = 6.907755279

/** What the display reads of `BodyTraits`. */
interface Body {
  mouth: number
  attack: number
  attackAdd: number
  release: number
  settle: number
  settleSec: number
  gain: number
}

const body = (...is: [number, number, number, number, number, number, number]): Body => ({
  mouth: is[0],
  attack: is[1],
  attackAdd: is[2],
  release: is[3],
  settle: is[4],
  settleSec: is[5],
  gain: is[6],
})

/** `traits`: throat, reed, glass, bowed, hollow. */
export const UNSUNG_BODIES: readonly Body[] = [
  body(1, 1.2, 0.012, 1, 1, 1, 0.88),
  body(0.8, 0.3, 0.015, 0.28, 1, 1, 1),
  body(0.7, 0.15, 0, 2.2, 0.16, 1.1, 1.48),
  body(0.6, 3.6, 0.3, 1.6, 1, 1, 1),
  body(0.45, 0.6, 0.02, 0.38, 0.66, 0.4, 1.12),
]

/** The mouth from a hum through Oo, Ah and Eh to Ee: three formants and how strong the upper two are. */
const MOUTHS: readonly (readonly number[])[] = [
  [250, 900, 2100, 0.14, 0.02],
  [330, 780, 2300, 0.62, 0.1],
  [700, 1150, 2650, 1.4, 0.5],
  [530, 1840, 2550, 1.3, 0.9],
  [290, 2250, 3050, 1.05, 1.2],
]

const band = (hz: number, f: number, q: number): number => {
  const r = hz / f
  return r / Math.hypot((1 - r * r) * q, r)
}
const roll = (hz: number, corner: number): number => 1 / Math.hypot(1, hz / corner)

/** `Mouth::set` and `Mouth::gain`: what the mouth does to a frequency of a key at `f0`. */
export function unsungMouth(vowel: number, f0: number): (hz: number) => number {
  const at = clamp(vowel, 0, 1) * 4
  const i = Math.min(3, Math.floor(at))
  const [a, b, c, g2, g3] = MOUTHS[i].map((from, n) => lerp(from, MOUTHS[i + 1][n], at - i))
  const f1 = Math.max(a, f0 * 1.05)
  const f2 = Math.max(b, f1 * 1.35)
  const f3 = Math.max(c, f2 * 1.25)
  return (hz) => {
    const r = hz / f1
    return 1 / Math.hypot(1 - r * r, r / 3.2) + g2 * band(hz, f2, 4.5) + g3 * band(hz, f3, 6)
  }
}

const RIM = [1, 0.1, 0.26, 0.035, 0.11, 0.02, 0.05, 0.03, 0.016, 0.02, 0.006, 0.012]

/** `source`: overtone `n` of a key at `f0` before the mouth, with a soft and with a hard touch. */
function source(which: number, n: number, f0: number): [number, number] {
  const hz = n * f0
  if (which === 0) {
    const r = roll(hz, 520)
    return [(r * r) / n, roll(hz, 5200) / Math.sqrt(n)]
  }
  if (which === 1) {
    const a = (0.3 + 0.7 * Math.abs(Math.sin(Math.PI * n * 0.19))) / Math.pow(n, 0.25)
    const box = 0.3 + band(hz, 1100, 1.5) + 0.7 * band(hz, 2600, 2)
    const all = ((a * hz) / (hz + 330)) * box
    const h = roll(hz, 5200)
    return [all * roll(hz, 1250) ** 2, all * h * h * Math.pow(n, 0.25)]
  }
  if (which === 2) {
    const a = RIM[n - 1] ?? 0
    return [a * roll(hz, 1500) * (n > 1 ? 0.6 : 1), a * roll(hz, 6000) * (n > 1 ? 2.8 : 1)]
  }
  if (which === 3) {
    const a = (0.25 + Math.abs(Math.sin(Math.PI * n * 0.127))) / n
    const low = 0.9 * band(hz, 280, 4) + 0.8 * band(hz, 470, 5) + 0.5 * band(hz, 760, 5)
    const all = a * (0.55 + low + 2.7 * band(hz, 2350, 1.8))
    return [all * roll(hz, 950) ** 2, all * roll(hz, 4400) ** 2 * Math.sqrt(n)]
  }
  const a = (n % 2 === 1 ? 1 : 0.05) / (n * Math.pow(n, 0.25))
  return [a * roll(hz, 300) ** 2, a * roll(hz, 3600) ** 2]
}

/** `UnsungVoice::spectrum`: how loud each overtone of a key is as `bright` as the touch leaves it (0 to 1). */
export function unsungSpectrum(
  set: { body: number; vowel: number; tilt: number },
  f0: number,
  bright: number,
): number[] {
  const traits = UNSUNG_BODIES[set.body]
  const mouth = unsungMouth(set.vowel, f0)
  const slope = (set.tilt * (set.tilt < 0 ? 9 : 7)) / 6.0206
  const count = (clamp(Math.trunc(9600 / f0), 4, 40) + 3) & ~3
  let power = 1e-9
  const levels = Array.from({ length: count }, (_, k) => {
    const hz = f0 * (k + 1)
    const [soft, hard] = source(set.body, k + 1, f0)
    const edge = k === 0 ? 1 : hz > 12000 ? 0 : 1 / (1 + (hz / 6500) ** 4)
    const shaped = Math.max(0, 1 + traits.mouth * (mouth(hz) - 1))
    const all = shaped * Math.pow(k + 1, slope) * edge
    const ear = (hz / (hz + 160)) * (1 + hz / 7000)
    power += (0.5 * (soft + hard) * all * ear) ** 2
    return (soft + (hard - soft) * bright) * all
  })
  const level = (1.4142 * traits.gain * 0.72) / Math.sqrt(power)
  return levels.map((each) => each * level)
}

/** `go_hold`, `ring_`: how fast a key goes by Hold and a tone of the line by Linger, in powers of e a second. */
export const unsungRing = (knob: number): number =>
  (SIXTY_DB / (0.35 * Math.pow(2, 6.5 * knob))) * Math.min(1, 6 * (1 - knob))

/** `pace_key`, `tick_key`: what is left of a key by its age: its envelope, and what Hold and the body leave. */
export function unsungKey(
  set: Pick<UnsungSettings, 'body' | 'attack' | 'hold' | 'release'>,
  age: number,
  released: number | null,
): { env: number; left: number } {
  const traits = UNSUNG_BODIES[set.body]
  const slow = set.attack * Math.max(0, traits.attack - 1) * 0.14
  const attack = (set.attack * traits.attack) / (1 + slow) + traits.attackAdd
  const held = Math.max(0, age - (released ?? 0))
  const x = held / Math.max(1e-4, 0.22 * attack)
  const risen = Math.min(1, 1.002 * (1 - (1 + x) * Math.exp(-x)))
  const gone = released === null ? 0 : released / Math.max(0.04, set.release * traits.release)
  // Hold and the body's own settling begin once the key is nearly in (0.93 is at 4.2 of its rise).
  const since = Math.max(0, age - 4.2 * 0.22 * attack)
  const rate = unsungRing(set.hold)
  const settle = traits.settle + (1 - traits.settle) * Math.exp(-since / traits.settleSec)
  return { env: risen * Math.exp(-SIXTY_DB * gone), left: settle * Math.exp(-rate * since) }
}

/** `touch`, `tick_key`, `spectrum`: how loud each overtone of a note is now, before the line takes any. */
export function unsungBars(set: UnsungSettings, note: DisplayNote): number[] {
  const { env, left } = unsungKey(set, note.age, note.released)
  const gain = clamp(note.gain, 0, 1)
  const dying = 1 - set.hold
  const played = (0.3 + 0.7 * gain) * gain * (1 + 0.5 * dying * dying)
  const bright = gain ** 1.5 * (0.25 + 0.75 * env) * (0.35 + 0.65 * left)
  const level = played * env * left * unsungLift(set.lift).keys
  return unsungSpectrum(set, note.frequency, bright).map((each) => each * level)
}

/** `set_knobs`: what Lift gives the keys and the line. */
export function unsungLift(lift: number): { keys: number; line: number } {
  const up = Math.min(1, 2 * lift)
  const over = 2 * Math.max(0, lift - 0.5)
  const line = Math.pow(10, (-14 * (1 - up) + 2 * over) / 20) * Math.min(1, 8 * up)
  return { keys: Math.pow(10, (-26 * over) / 20), line }
}
