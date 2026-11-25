// The display of Tierce Bells: one bell's partials as a ladder, with the third
// as the rung that moves.
//
// At the left the ladder: the hum, the prime, the third, the quint, the
// nominal, the deciem and the twelfth, each a rung at its pitch on a scale of
// octaves, as long as a full strike leaves it loud, with a tick at what is
// left of it two seconds on. The third and the deciem are tied by a line: the
// deciem is always an octave over the third. At the right the third alone,
// on a scale of cents with the five named thirds ruled across: the way a
// strike's third goes over Glide, from Lean away to its place, and a dot where
// the newest bell's third is. Two points can be dragged there: the one at the
// right sets Tierce, the one at the left sets Lean. Under both are the twelve
// keys, each with the third Root and Scale give it: a whole bar is a major
// third, half a bar a minor one, a line a key that takes the Tierce knob.
//
// The arithmetic is the device's own (`cpp/devices/tierce-bells/tierce_bells.h`;
// the constants carry its names). The device reports the newest bell: where its
// third is, where that goes, its level and its note. How the partials stand to
// each other as they die is worked out from the stroke's age, and the whole is
// put at the level the device reports, so a soft strike, a key let go and a
// bell struck again are as loud in the picture as they are.

import {
  INK,
  clamp,
  dot,
  fillRect,
  ground,
  handle,
  rule,
  text,
  trace,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayHold,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { levelFoot, meanOutShare, pitchName, type HeardLevel } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>

// --- The device's numbers ------------------------------------------------------

/** `kMinorThird`, `kMajorThird`: 6/5 and 5/4 in cents. */
export const TIERCE_MINOR = 315.6413
export const TIERCE_MAJOR = 386.3137
/** The named thirds, in cents above the prime. */
export const TIERCE_NAMED: readonly { name: string; cents: number }[] = [
  { name: '7/6', cents: 266.8709 },
  { name: '6/5', cents: TIERCE_MINOR },
  { name: '11/9', cents: 347.4079 },
  { name: '5/4', cents: TIERCE_MAJOR },
  { name: '4/3', cents: 498.045 },
]
/** The two ends of the Tierce knob. */
const TIERCE_LOW = 266.87
const TIERCE_HIGH = 498.04

const SIXTY_DB = 6.907755279
const EDGE_HZ = 15000
const TOP_HZ = 18000
/** `kLevel`: a full strike of a partial of level 1; the ladder's scale is in dB against it. */
export const TIERCE_LEVEL = 0.122
const SOFT_CONTACT = 1.5
const HARD_CONTACT = 0.08
const MAKEUP = 0.7
const HARD_TILT = 0.7
const RUB_SECONDS = 0.35
const RUB_LEVEL = 0.105
const RUBBED_HIT = 0.22
const SHORTEST_GLIDE = 0.02

export type TierceRole = 'hum' | 'prime' | 'third' | 'fifth' | 'over' | 'deciem'

/** One partial: a row of `Mode`, or two rows where it is a pair. */
export interface TiercePartial {
  role: TierceRole
  /** Its place for the clapper. */
  ratio: number
  /** `level` of its one mode, or of the two halves of its pair. */
  levels: readonly number[]
  /** Its ring time as a share of the hum's, before Damping. */
  keep: number
  /** The levels rubbing brings them to; empty for a bell that is struck. */
  rub: readonly number[]
}

const struck = (
  role: TierceRole,
  ratio: number,
  levels: readonly number[],
  keep: number,
  rub: readonly number[] = [],
): TiercePartial => ({ role, ratio, levels, keep, rub })

export interface TierceBell {
  name: string
  gain: number
  striker: number
  partials: readonly TiercePartial[]
}

/** `kTables`: the four bells, as Bell counts them. */
export const TIERCE_BELLS: readonly TierceBell[] = [
  {
    name: 'Tower',
    gain: 1,
    striker: 1,
    partials: [
      struck('hum', 0.5, [0.26, 0.17], 1),
      struck('prime', 1, [0.36, 0.24], 0.62),
      struck('third', 1.2, [0.5, 0.33], 0.8),
      struck('fifth', 1.5, [0.26], 0.42),
      struck('over', 2, [0.54, 0.36], 0.4),
      struck('deciem', 2.4, [0.27, 0.18], 0.32),
      struck('over', 3, [0.3, 0.2], 0.22),
      struck('over', 4, [0.3], 0.15),
      struck('over', 5.1, [0.2], 0.1),
      struck('over', 6.3, [0.14], 0.07),
      struck('over', 7.6, [0.09], 0.05),
    ],
  },
  {
    name: 'Handbell',
    gain: 0.96,
    striker: 0.8,
    partials: [
      struck('hum', 0.5, [0.07, 0.05], 1),
      struck('prime', 1, [0.6, 0.4], 0.9),
      struck('third', 1.2, [0.33, 0.22], 0.6),
      struck('fifth', 1.5, [0.14], 0.3),
      struck('over', 2, [0.16], 0.35),
      struck('deciem', 2.4, [0.15, 0.1], 0.3),
      struck('over', 3, [0.6, 0.4], 0.5),
      struck('over', 5.2, [0.16], 0.16),
      struck('over', 7.4, [0.1], 0.08),
    ],
  },
  {
    name: 'Small clock',
    gain: 0.95,
    striker: 0.6,
    partials: [
      struck('hum', 0.5, [0.08, 0.05], 1),
      struck('prime', 1, [0.34, 0.23], 0.28),
      struck('third', 1.2, [0.36, 0.24], 0.26),
      struck('fifth', 1.5, [0.17], 0.2),
      struck('over', 2, [0.84], 0.2),
      struck('deciem', 2.4, [0.36, 0.24], 0.17),
      struck('over', 4.1, [0.44], 0.11),
      struck('over', 5.6, [0.28], 0.08),
      struck('over', 7.1, [0.17], 0.06),
    ],
  },
  {
    name: 'Rubbed',
    gain: 0.86,
    striker: 1.3,
    partials: [
      struck('hum', 0.5, [0.3, 0.2], 1, [0.42, 0.28]),
      struck('prime', 1, [0.36, 0.24], 0.8, [0.46, 0.31]),
      struck('third', 1.2, [0.4, 0.27], 0.8, [0.5, 0.33]),
      struck('fifth', 1.5, [0.18], 0.5, [0.18]),
      struck('over', 2, [0.3, 0.2], 0.5, [0.2, 0.13]),
      struck('deciem', 2.4, [0.15, 0.1], 0.4, [0.12, 0.08]),
      struck('over', 3, [0.14], 0.3, [0.07]),
    ],
  },
]
const RUBBED = 3

/** `in_scale`, `kScales`: the notes of each scale above its root, in the order of the Scale control. */
export const TIERCE_SCALES: readonly (readonly number[])[] = [
  [0, 2, 4, 5, 7, 9, 11],
  [0, 2, 3, 5, 7, 8, 10],
  [0, 2, 3, 5, 7, 9, 10],
  [0, 1, 3, 5, 7, 8, 10],
  [0, 2, 4, 6, 7, 9, 11],
  [0, 2, 4, 5, 7, 9, 10],
  [0, 2, 3, 5, 7, 8, 11],
]

/** What the display reads off the knobs, as the device applies them. */
export interface TierceSettings {
  bell: number
  /** The Tierce knob, cents. */
  tierce: number
  follow: boolean
  root: number
  scale: number
  lean: number
  /** Seconds. */
  glide: number
  humPitch: number
  humLevel: number
  quint: number
  upper: number
  decay: number
  damping: number
  hardness: number
}

export function tierceSettings(value: (name: string) => number): TierceSettings {
  return {
    bell: clamp(Math.floor(value('bell') + 0.5), 0, TIERCE_BELLS.length - 1),
    tierce: value('tierce'),
    follow: value('follow') >= 0.5,
    root: clamp(Math.floor(value('root') + 0.5), 0, 11),
    scale: clamp(Math.floor(value('scale') + 0.5), 0, TIERCE_SCALES.length - 1),
    lean: value('lean'),
    glide: Math.max(value('glide'), SHORTEST_GLIDE),
    humPitch: value('humPitch'),
    humLevel: value('humLevel'),
    quint: value('quint'),
    upper: value('upper'),
    decay: value('decay'),
    damping: value('damping'),
    hardness: value('hardness'),
  }
}

type KeySettings = Pick<TierceSettings, 'tierce' | 'follow' | 'root' | 'scale'>

/**
 * `TierceBells::place_for`: the place of the third of a key (0 is C), in cents
 * above its prime. The scale's note four semitones up makes it major, three up
 * minor; where the scale has both, the one nearer Tierce; where it has neither,
 * and for a key outside the scale, Tierce.
 */
export function tiercePlace(set: KeySettings, key: number): number {
  if (!set.follow) return set.tierce
  const notes = TIERCE_SCALES[set.scale]
  const degree = (((key - set.root) % 12) + 12) % 12
  if (!notes.includes(degree)) return set.tierce
  const minor = notes.includes((degree + 3) % 12)
  const major = notes.includes((degree + 4) % 12)
  if (minor && major)
    return set.tierce - TIERCE_MINOR <= TIERCE_MAJOR - set.tierce ? TIERCE_MINOR : TIERCE_MAJOR
  if (major) return TIERCE_MAJOR
  return minor ? TIERCE_MINOR : set.tierce
}

/** Which of the three a key gets: the scale's major third, its minor third, or the knob. */
export function tierceKind(set: KeySettings, key: number): 'major' | 'minor' | 'knob' {
  // Asked with the knob where no third is: what comes back is then the scale's or the knob's.
  const given = tiercePlace({ ...set, tierce: -1 }, key)
  if (given === -1) return 'knob'
  return tiercePlace(set, key) === TIERCE_MAJOR ? 'major' : 'minor'
}

/** `kit::octave_key`: the equal-tempered key nearest a frequency at A 440, 0 (C) to 11 (B). */
export function tierceKey(hz: number): number {
  const note = Math.floor(69 + 12 * Math.log2(clamp(hz, 8, 14000) / 440) + 0.5)
  return ((note % 12) + 12) % 12
}

/** `Glider::step` for a strike that leans: where the third is `t` seconds after it, in cents. */
export function tierceGlide(place: number, lean: number, glide: number, t: number): number {
  const share = clamp(t / Math.max(glide, SHORTEST_GLIDE), 0, 1)
  return place + lean * (1 - share * share * (3 - 2 * share))
}

/** `TierceBells::contact`: how long the clapper rests on the bell, in periods of the note. */
export function tierceContact(bell: number, hardness: number, gain: number): number {
  return (
    SOFT_CONTACT *
    Math.pow(HARD_CONTACT / SOFT_CONTACT, hardness) *
    TIERCE_BELLS[bell].striker *
    (1.2 - 0.4 * gain)
  )
}

/** `TierceBells::strike_share`: the share of a partial at `ratio` that a clapper wakes. */
export function tierceShare(ratio: number, contact: number, hardness: number): number {
  const x = ratio * contact
  const tilt = HARD_TILT * (hardness - 0.5)
  return (
    (Math.pow(1 + contact * contact, MAKEUP) / (1 + x * x)) *
    (ratio > 1 ? Math.pow(ratio, tilt) : 1)
  )
}

/** `TierceBells::tune`: how long a partial rings to -60 dB while its key is held, in seconds. */
export function tierceRing(
  set: Pick<TierceSettings, 'decay' | 'damping'>,
  partial: TiercePartial,
): number {
  const power = 0.1 + 1.4 * set.damping + 1.1 * set.damping * set.damping
  return set.decay * Math.pow(partial.keep, power)
}

/** `TierceBells::mode_hz`: a partial's pitch against the prime, between the two halves of its pair. */
export function tierceRatio(set: TierceSettings, partial: TiercePartial, cents: number): number {
  if (partial.role === 'hum') return set.humPitch
  const third = Math.pow(2, cents / 1200)
  if (partial.role === 'third') return third
  if (partial.role === 'deciem') return 2 * third
  return partial.ratio
}

/** `TierceBells::gains`: what the level knobs give a partial; each is 1 in the middle and 2 at the top. */
function knobGain(set: TierceSettings, role: TierceRole): number {
  if (role === 'hum') return 2 * set.humLevel
  if (role === 'fifth') return 2 * set.quint
  if (role === 'over' || role === 'deciem') return 2 * set.upper
  return 1
}

/** `turn_to`, `edge`: a partial fades out between 15 and 18 kHz, and under 5 Hz it does not exist. */
function edgeGain(hz: number, sampleRate: number): number {
  if (hz < 5) return 0
  return clamp((Math.min(TOP_HZ, 0.45 * sampleRate) - hz) / (TOP_HZ - EDGE_HZ), 0, 1)
}

/** A rubbed partial on its way from `from` to `target`, `t` seconds on (`control_voice`, `kRubSeconds`). */
function rubbedTo(from: number, target: number, seconds: number, t: number): number {
  if (!(target > 0)) return from * Math.exp((-SIXTY_DB * t) / seconds)
  if (from >= target) return Math.max(target, from * Math.exp((-SIXTY_DB * t) / seconds))
  // Under a fifth of its target it grows at four times the rate, and from there it closes on it.
  const least = 1e-4 * target
  const start = Math.max(from, least)
  const fifth = target / 5
  const climbs = start < fifth ? (RUB_SECONDS / 4) * Math.log(fifth / start) : 0
  if (t < climbs) return start * Math.exp((4 * t) / RUB_SECONDS)
  const at = Math.max(start, fifth)
  return target - (target - at) * Math.exp(-(t - climbs) / RUB_SECONDS)
}

/**
 * How loud every partial of a bell at `hz` is `t` seconds after a strike at
 * `gain` on a bell at rest, as it goes out before Volume: the two halves of a
 * pair added as power, so without their beat (`strike`, `control_voice`).
 * `released` is how many of those seconds the key has been up; a rubbed bell
 * grows only while it is down. What letting go takes off all partials alike is
 * not in it: the reported level says that.
 */
export function tierceLevels(
  set: TierceSettings,
  hz: number,
  gain: number,
  cents: number,
  t: number,
  released: number,
  sampleRate: number,
): number[] {
  const bell = TIERCE_BELLS[set.bell]
  const rubbed = set.bell === RUBBED
  const contact = tierceContact(set.bell, set.hardness, gain)
  const soft = 0.8 + 0.2 * gain
  const hit = TIERCE_LEVEL * bell.gain * (rubbed ? RUBBED_HIT : 1) * gain * soft
  const rub = RUB_LEVEL * bell.gain * gain * soft
  return bell.partials.map((partial) => {
    const share = hit * tierceShare(partial.ratio, contact, set.hardness)
    const tilt = partial.ratio > 1 ? Math.pow(partial.ratio, 2 * set.hardness - 1) : 1
    const seconds = tierceRing(set, partial)
    const up = clamp(released, 0, t)
    let power = 0
    partial.levels.forEach((level, i) => {
      const begun = share * level
      const target = partial.rub.length > 0 ? rub * tilt * partial.rub[i] : 0
      const held = rubbed
        ? rubbedTo(begun, target, seconds, t - up)
        : begun * Math.exp((-SIXTY_DB * (t - up)) / seconds)
      const now = held * Math.exp((-SIXTY_DB * up) / seconds)
      power += now * now
    })
    const edge = edgeGain(hz * tierceRatio(set, partial, cents), sampleRate)
    return Math.sqrt(power) * knobGain(set, partial.role) * edge
  })
}

/** The level of the whole bell as the device reports it (`follow`): its partials added as power. */
export const tierceTotal = (levels: readonly number[]): number =>
  Math.sqrt(levels.reduce((sum, level) => sum + level * level, 0))
