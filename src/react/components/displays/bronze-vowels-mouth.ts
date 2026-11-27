// What the display of Bronze Vowels reads off the knobs and the notes: the
// mouth of a bell, what it leaves of each partial, and where each key is in its
// word. The arithmetic is the device's own (`cpp/devices/bronze-vowels/mouth.h`
// and `bronze_vowels.h`; the names in quotes are its names).

import { clamp, lerp } from '../display-kit'
import { type DisplayNote } from '../plate-display'
import {
  bronzeMallet,
  bronzeMetal,
  bronzePartials,
  bronzeShares,
  type BronzeSettings,
} from './bronze-vowels-metal'

const log2 = Math.log2
/** `kDbToLog2`: dB to log2 of a gain. */
const DB_TO_LOG2 = 0.166096405
/** A step of log2 of a gain, in dB. */
export const BRONZE_DB = 20 * Math.log10(2)
/** `kDeepest`: how far a mouth can shut a partial out, log2. */
const DEEPEST = 9

// --- The vowels and the words ----------------------------------------------------

/** A row of `vowel_row`: four formants, their heights, how far it is open, its tilt and its chest. */
interface Vowel {
  name: string
  hz: readonly number[]
  db: readonly number[]
  open: number
  tilt: number
  chest: number
}
const vowel = (
  name: string,
  hz: number[],
  db: number[],
  open: number,
  tilt: number,
  chest: number,
) => ({ name, hz, db, open, tilt, chest }) satisfies Vowel

export const BRONZE_VOWELS: readonly Vowel[] = [
  vowel('ah', [780, 1220, 2650, 3600], [0, 0, -14, -20], 0, -1.5, -24),
  vowel('eh', [560, 1850, 2600, 3600], [-1, -1, -6, -16], 0, -1, -20),
  vowel('ee', [270, 2400, 3150, 4300], [-6, 0, -1, -6], 0, 2, -20),
  vowel('oh', [470, 780, 2500, 3400], [0, -4, -34, -40], 0, -7, -15),
  vowel('oo', [290, 620, 2300, 3300], [0, -16, -42, -46], 0, -14, -7),
  vowel('mm', [190, 900, 2200, 3300], [0, -34, -42, -46], -9, -20, -1),
  vowel('er', [490, 1280, 1620, 3400], [-3, 0, 0, -28], 0, -4, -22),
  vowel('ue', [270, 1700, 2150, 3400], [-1, -2, -3, -26], 0, -3, -14),
  vowel('shut', [210, 700, 2100, 3300], [0, -34, -44, -48], -34, -20, -4),
  vowel('sh', [420, 1600, 3300, 5200], [-12, -6, 0, 0], -10, -8, -18),
]
const ER = 6
/** `word_row`: the five stations of each word, as Word counts them. */
export const BRONZE_WORDS: readonly (readonly number[])[] = [
  [0, 0, 3, 4, 4],
  [4, 4, 2, 2, 2],
  [5, 5, 5, 5, 5],
  [4, 8, 8, 8, 4],
  [1, 8, 1, 8, 1],
  [0, 2, 8, 8, 0],
  [3, 3, 3, 8, 8],
  [2, 2, 5, 8, 8],
  [9, 9, 4, 8, 9],
  [6, 0, 9, 9, 9],
]

/** A mouth: its formants and all its gains as log2, as `said` holds them. */
export interface BronzeMouth {
  f: readonly number[]
  height: readonly number[]
  open: number
  tilt: number
  chest: number
  /** The vowel it is nearest to in its word. */
  name: string
}

const ofVowel = (v: Vowel): BronzeMouth => ({
  f: v.hz.map(log2),
  height: v.db.map((db) => db * DB_TO_LOG2),
  open: v.open * DB_TO_LOG2,
  tilt: v.tilt * DB_TO_LOG2,
  chest: v.chest * DB_TO_LOG2,
  name: v.name,
})
const MOUTHS = BRONZE_VOWELS.map(ofVowel)

/** `own_mouth`: the mouth at a place in a word, 0 its beginning, 1 its end and 2 its beginning again. */
export function bronzeMouth(word: number, position: number): BronzeMouth {
  const row = BRONZE_WORDS[clamp(Math.floor(word + 0.5), 0, BRONZE_WORDS.length - 1)]
  const x = bronzeFold(position) * 4
  const at = clamp(Math.floor(x), 0, 3)
  const t = (x - at) * (x - at) * (3 - 2 * (x - at))
  const [a, b] = [MOUTHS[row[at]], MOUTHS[row[at + 1]]]
  const mixed = (from: readonly number[], to: readonly number[]) =>
    from.map((each, j) => lerp(each, to[j], t))
  return {
    f: mixed(a.f, b.f),
    height: mixed(a.height, b.height),
    open: lerp(a.open, b.open, t),
    tilt: lerp(a.tilt, b.tilt, t),
    chest: lerp(a.chest, b.chest, t),
    name: t < 0.5 ? a.name : b.name,
  }
}

/** A place that goes to the end of the word and back, as a share of the word. */
export function bronzeFold(position: number): number {
  const x = position - 2 * Math.floor(position / 2)
  return x > 1 ? 2 - x : x
}

/** The first formant a bell comes to: its own, or drawn to the newest bell's, or to its opposite (`move_mouth`). */
export function bronzeTaught(
  own: BronzeMouth,
  teacher: BronzeMouth,
  set: Pick<BronzeSettings, 'contagion' | 'speak'>,
  since: number,
): readonly [number, number] {
  const seconds = clamp(0.22 * set.speak, 0.05, 1.6)
  const come = Math.abs(set.contagion) * (1 - Math.exp(-since / seconds))
  const goal = (j: number): number =>
    set.contagion < 0 ? 2 * MOUTHS[ER].f[j] - teacher.f[j] : teacher.f[j]
  return [lerp(own.f[0], goal(0), come), lerp(own.f[1], goal(1), come)]
}

// --- The keys --------------------------------------------------------

/** `scatter`: a number in [0, 1) that is always the same for one part of one key. */
function scatter(a: number, b: number): number {
  let x = (Math.imul(a, 2654435761) + Math.imul(b, 40503) + 977) >>> 0
  x ^= x >>> 15
  x = Math.imul(x, 2246822519) >>> 0
  x ^= x >>> 13
  return (x >>> 8) / 16777216
}

const midiOf = (hz: number): number => 69 + 12 * log2(hz / 440)

/** Where in its word a bell is `age` seconds after its strike (`start`, `strike`, `move_mouth`). */
export function bronzePosition(set: BronzeSettings, hz: number, age: number): number {
  const midi = midiOf(hz)
  const x = clamp((midi - 60) / 24, -1, 1)
  const pace = x + 0.35 * (scatter(Math.floor(midi * 8 + 0.5), 3) - 0.5)
  const late = 0.5 * set.stagger * (0.5 + 0.5 * x)
  return late + (age / set.speak) * Math.pow(2, 2 * set.stagger * pace)
}

// --- What the mouth leaves ----------------------------------------------------------

/** `deep`: how many times over the mouth's shape is cut, for a bell that nobody taught. */
export const bronzeDeep = (clarity: number): number => clarity * (1 + 0.5 * clarity)

/** `drawn` of `look_at_mouth`: the mouth's envelope at `hz`, log2 of a gain, before Clarity. */
export function bronzeDrawn(mouth: BronzeMouth, tract: number, hz: number): number {
  const f = mouth.f.map((each) => clamp(Math.pow(2, each + tract / 12), 60, 9000))
  let sum = Math.pow(2, mouth.chest) / (1 + (hz / f[0]) ** 4)
  f.forEach((at, j) => {
    const x = (hz - at) / (0.085 * at + 34)
    sum += Math.pow(2, mouth.height[j]) / (1 + x * x)
  })
  return Math.max(log2(sum), -DEEPEST)
}

/** How far a key is handed over from vowels to bright and dark: 0 up to B4, 1 from Ab5 (`high`). */
export function bronzeHigh(hz: number): number {
  const above = clamp((midiOf(hz) - 71) / 9, 0, 1)
  return above * above * (3 - 2 * above)
}

/** `want`, without what Clarity evens out: the envelope a key at `hz` dies into, in dB at `at`. */
export function bronzeEnvelope(set: BronzeSettings, mouth: BronzeMouth, hz: number, at: number) {
  const tilted = Math.max(mouth.tilt * Math.max(log2(at / hz), 0), -DEEPEST)
  const drawn = lerp(bronzeDrawn(mouth, set.tract, at), tilted, bronzeHigh(hz))
  return bronzeDeep(set.clarity) * drawn * BRONZE_DB
}

/**
 * How loud each partial of a held bell is `age` seconds after a strike, as a
 * share of the whole bell (`strike`, `look_at_mouth`, `control_voice`): what
 * the strike gave it, dying to what Sing feeds, times what the mouth leaves.
 * The few tenths of a second a partial takes to follow the mouth are not in it.
 */
export function bronzeLevels(
  set: BronzeSettings,
  note: Pick<DisplayNote, 'frequency' | 'gain' | 'age'>,
  mouth: BronzeMouth,
): number[] {
  const { frequency: hz, gain, age } = note
  const metal = bronzeMetal(set)
  const given = bronzeShares(set, hz, gain, false)
  const usual = bronzeShares(set, hz, 0.75, true)
  const white = 0.52 * (1 + 0.3 * clamp((190 - hz) / 120, 0, 1))
  const high = bronzeHigh(hz)
  const ring = set.ring * metal.ring * Math.pow(clamp(hz / 220, 0.2, 16), -0.22)
  const fed = set.sing * (0.4 + 0.5 * set.sing) * metal.feed
  const { wear } = set
  const touch = [0.01, 0.004, 0.002, 0.5][bronzeMallet(set)] * (1.6 - 1.1 * set.hardness)
  const attack = Math.max(touch, set.swell)
  const levels = bronzePartials(set, hz).map((at, p) => {
    const ratio = metal.ratio[p]
    const above = Math.max(log2(ratio), 0)
    const even = p === 0 ? 0 : white * clamp(-log2(usual[p] + 1e-6) - 1, 0, 7)
    const want =
      bronzeEnvelope(set, mouth, hz, at) / BRONZE_DB + set.clarity * (1 - 0.6 * high) * even
    const keep = Math.pow(Math.max(ratio, 1), -metal.slope) * (p === 0 ? 1.3 : 1)
    const brief = Math.pow(2, above * 1.1 * wear * wear) * Math.pow(keep, -(0.15 + 2.1 * wear))
    const nepers = (6.907755 / ring) * brief * (1 + 0.12 * Math.max(-want, 0))
    // Some metals bring their high partials up late, and a swell brings them all up slowly.
    const up = attack + metal.bloom * clamp(0.25 + 0.25 * log2(ratio), 0, 1)
    const t = clamp(age / up, 0, 1)
    const rest = fed * Math.pow(2, -(1.5 * wear * wear + 0.3 * wear) * above)
    const left = rest + (1 - rest) * Math.exp(-nepers * Math.max(age - up, 0))
    // The two halves of a pair together, against a partial that is alone.
    const pair = p < 12 ? Math.hypot(0.8, 0.38) : 1
    return (
      pair *
      given[p] *
      t *
      t *
      (3 - 2 * t) *
      left *
      Math.pow(2, want) *
      (p === 0 ? 1.6 * set.hum : 1)
    )
  })
  const total = Math.sqrt(levels.reduce((sum, each) => sum + each * each, 1e-12))
  return levels.map((each) => each / total)
}
