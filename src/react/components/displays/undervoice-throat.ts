// The arithmetic of Undervoice as its display draws it, under the device's own
// names (`cpp/devices/undervoice`: folds.h, tract.h, voice.h, undervoice.h), for
// a key by itself: how many pulses a group has, the gate over them and the tone
// it adds below, the door between the two divisions, and the throat.

import { clamp, lerp } from '../display-kit'

/** Reads a knob, in its own unit. */
export type Read = (name: string) => number

// `kDivide` (32 stands for drips, 0 for the shared pulse), and `kPosture`: the throat's size, octaves on
// the lips, a lean along the vowels.
const DIVIDE = [1, 2, 3, 4, 8, 32, 0]
const SIZE = [1.1, 1, 1.27, 0.63, 1.35, 0.71, 0.82]
const LIPS = [0.8, -0.77, -0.61, -0.82, 0.29, 1.3, 0.31]
const LEAN = [0.08, 0.02, 0.1, -0.22, 0.21, -0.13, -0.22]
// `kColour` by log2 of a group: how far its gate is narrowed, how loud its floor is, how far the voice
// is handed over to the rings; last, `kPurr`.
const COLOUR_AT = [0, 1, 1.585, 2, 3, 5]
const SHARP = [0, 0.1, 0.24, 0.11, 0.71, 1, 0.45]
const FLOOR = [0.4, 1.4, 2, 1.55, 0.8, 0, 0.67]
const DRIP = [0, 0, 0, 0.09, 0.41, 1, 0]
// `kVowelHz`: the first, the second and the third formant of each.
const FORMANTS = [
  [290, 430, 690, 530, 285, 280],
  [720, 800, 1120, 1720, 2200, 1540],
  [2250, 2400, 2500, 2480, 2950, 2080],
]
const BANDWIDTH = [135, 120, 115, 150, 190, 240]

/** Which of the seven choices of Division. */
export const undervoiceDivision = (value: Read): number =>
  clamp(Math.round(value('division')), 0, 6)

function colourAt(table: readonly number[], n: number): number {
  const at = Math.log2(n)
  let from = 0
  while (from < 4 && at >= COLOUR_AT[from + 1]) from++
  const share = (at - COLOUR_AT[from]) / (COLOUR_AT[from + 1] - COLOUR_AT[from])
  return lerp(table[from], table[from + 1], clamp(share, 0, 1))
}

/** `fit_pulse`: the pulse, 10 to 34 a second, that divides the keys best. */
export function undervoicePulse(keys: readonly number[]): number {
  let [best, found] = [Infinity, 17]
  for (let pulse = 10; pulse <= 34; pulse *= 1.004) {
    let cost = 0.004 * Math.abs(Math.log2(pulse / 17))
    for (const hz of keys) cost += Math.abs(hz / pulse / Math.max(Math.round(hz / pulse), 1) - 1)
    if (cost < best) [best, found] = [cost, pulse]
  }
  return found
}

/** `divide_for`: how many pulses of a key a group of the first division has. */
export function undervoiceGroup(value: Read, hz: number, keys: readonly number[]): number {
  let n = DIVIDE[undervoiceDivision(value)]
  if (n === 0) return clamp(Math.round(hz / undervoicePulse(keys)), 1, 1024)
  while (n >= 32 && hz / n > 3.9 && n < 2048) n *= 2
  return n
}

/** `floor_hz`: where the tone of a group lies, the first octave of it over 42 Hz. */
export function undervoiceFloorHz(hz: number, n: number): number {
  let under = hz / n
  while (under < 42) under *= 2
  return under
}

/** `skew_aim_`: where in its group a hump stands highest. */
export const undervoiceRise = (skew: number): number => 0.015 + 0.965 * Math.pow(skew, 1.15)

/** One of a key's two gates for groups of `n` (`Hump::at`, `tune`), and the tone under it. */
export function undervoiceGate(value: Read, hz: number, n: number, first: boolean) {
  const [depth, chest] = [value('depth'), value('chest')]
  const colour = (table: readonly number[]): number =>
    first && undervoiceDivision(value) === 6 ? table[6] : colourAt(table, n)
  const inPulse = first ? 0.92 * clamp((1800 - hz) / 1200, 0, 1) : 0
  const shut = Math.pow(Math.min(depth / 0.7, 1), 0.75) * (n > 1 ? 1 : inPulse)
  const rise = undervoiceRise(value('skew'))
  const narrow = [clamp((depth - 0.5) * 2, 0, 1), colour(SHARP)]
  const under = undervoiceFloorHz(hz, n)
  const drip = colour(DRIP)
  const loud = 8 * (0.15 + 0.85 * chest) * chest * depth * (0.65 + 0.6 * depth * depth)
  return {
    /** How open it is, so many cycles on. */
    at(cycles: number): number {
      const u = (cycles % n) / n
      const t = u < rise ? u / rise : (1 - u) / (1 - rise)
      let w = t * t * (3 - 2 * t)
      for (const much of narrow) w += much * (w ** 4 - w)
      return 1 - shut * (1 - w)
    },
    /** How loud the tone is, and how many cycles of the key one of its own takes. */
    floor: loud * colour(FLOOR) * clamp((700 - under) / 400, 0, 1),
    cycles: hz / under,
    /** How far it is drops, and what a cycle leaves of one that rings (`ring_seconds_`, `ring_times`). */
    drip,
    keeps: Math.exp(-6.9078 / (0.05 * Math.pow(2, 6.3 * value('ring')) * (1 + 0.3 * drip) * hz)),
  }
}

/** `tune`, `globals`: how far the door has gone over, how loud the breath is, how far the mouth goes along. */
export function undervoiceDoor(value: Read, flip: number) {
  const [turn, breath] = [value('turn'), value('breath')]
  // Faster turns than this the picture would only flicker with: it stands half way.
  if (value('pace') > 2.9) return { door: turn / 2, loud: 1 - 0.46 * breath, swing: turn / 2 }
  const t = clamp(0.5 - 1.5 * Math.cos(2 * Math.PI * flip), 0, 1)
  const phase = flip % 1
  const out = phase < 0.62 ? Math.sin((Math.PI * phase) / 0.62) : 0
  const into = phase < 0.62 ? 0 : Math.sin((Math.PI * (phase - 0.62)) / 0.38)
  const door = lerp(turn * t * t * (3 - 2 * t), 1, breath * Math.min(2 * into, 1))
  const loud = 1 + breath * (1.1 * out + 0.22 * into - 0.95)
  return { door, loud, swing: turn * (0.5 - 0.5 * Math.cos(2 * Math.PI * (flip + 0.9))) }
}

/** `globals`: the vowel the mouth stands at, by the knob, the division and the door. */
export function undervoiceVowel(value: Read, swing: number): number {
  const knob = value('vowel')
  const vowel = knob + 4 * LEAN[undervoiceDivision(value)] * knob * (1 - knob) + 0.11 * swing
  return vowel > 1 ? 2 - vowel : Math.abs(vowel)
}

/** `Tract::set` and `power_at`: what the throat does to a tone, in dB. */
export function undervoiceThroat(value: Read, swing: number): (hz: number) => number {
  const scale = value('throat') * SIZE[undervoiceDivision(value)]
  const mouth = clamp(value('mouth') + 0.14 * (swing - 0.3 * value('turn')), 0, 1)
  const at = undervoiceVowel(value, swing) * 5
  const from = clamp(Math.floor(at), 0, 4)
  const places = FORMANTS.map((hz) => lerp(hz[from], hz[from + 1], at - from))
  const wide = 1 + 1.5 * clamp((places[1] - 1100) / 1000, 0, 1)
  places[0] *= 0.72 + 0.42 * mouth
  let last = 0
  const poles = [...places, 3350, 4150, 4900].map((hz, f) => {
    last = Math.max(clamp(hz * scale, 60, 20640), last * 1.12)
    const damping = (BANDWIDTH[f] * (f === 1 || f === 2 ? wide : 1) * scale) / last
    return { square: last * last, loss: clamp(damping * damping, 0.01, 1) }
  })
  for (let n = 0; n < 8; n++) poles.push({ square: ((5700 + 1000 * n) * scale) ** 2, loss: 0.05 })
  const lipsHz = clamp(480 * Math.pow(2, 5 * mouth + LIPS[undervoiceDivision(value)]), 250, 19200)
  return (hz) => {
    let under = 1 + (hz / lipsHz) ** 4
    for (const { square, loss } of poles) {
      const r = (hz * hz) / square
      under *= (1 - r) * (1 - r) + r * loss
    }
    return -10 * Math.log10(Math.max(under, 1e-9))
  }
}
