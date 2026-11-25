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

// --- The picture ---------------------------------------------------------------

/** The ladder's scale of pitch, as ratios of the prime: what lies above the twelfth is not drawn. */
const LADDER_LOW = 0.385
const LADDER_HIGH = 3.15
/** The length of a rung: dB against a full strike of a partial of level 1. */
const RUNG_FLOOR_DB = -42
const RUNG_TOP_DB = 6
/** The tick on a rung is what is left this long after the strike. */
export const TIERCE_TICK_SEC = 2
/** The scale of the third, in cents. */
const CENTS_LOW = 255
const CENTS_HIGH = 510
/** The scale of the glide: a root of time, so that a second and twenty both show. */
export const TIERCE_TIME_SEC = 24
/** The strike stands this far into the lane; the point before it is Lean's. */
const LANE_STRIKE = 8
/** A drag that comes this near to a named third lands on it, in pixels. */
const SNAP_PX = 1.6
/** A bell is followed for at least this long, so a roll does not shake the picture. */
export const TIERCE_FOLLOWS_SEC = 0.5
/** The level in the foot is the mean over this long. */
const LEVEL_SEC = 1
/** A key's pitch at rest: the octave from middle C. */
const C4_HZ = 261.6256

export interface TierceLayout {
  head: { left: number; right: number; baseline: number }
  /** The rungs stand in `ladder`; their names begin at `names`. */
  ladder: Box
  names: number
  /** The names of the thirds end at `marks`; the lane is right of them. */
  marks: number
  lane: Box
  keys: Box
  foot: Box
}

export function tierceLayout(size: Size): TierceLayout {
  const box: Box = { x: 4, y: 4, w: size.width - 8, h: size.height - 8 }
  const top = box.y + 12
  const foot: Box = { x: box.x, y: box.y + box.h - 4, w: box.w, h: 4 }
  const keys: Box = { x: box.x, y: foot.y - 11, w: box.w, h: 8 }
  const h = keys.y - 4 - top
  // The names take what they need; what is left is shared between the rungs and the lane.
  const spare = box.w - 4 - 31 - 4 - 17 - 5
  const rungs = Math.round(spare * 0.44)
  const ladder: Box = { x: box.x + 4, y: top, w: rungs, h }
  const names = ladder.x + rungs + 3
  const marks = names + 28 + 4 + 17
  const left = marks + 6
  return {
    head: { left: box.x, right: box.x + box.w, baseline: box.y + 8 },
    ladder,
    names,
    marks,
    lane: { x: left, y: top, w: box.x + box.w - 4 - left, h },
    keys,
    foot,
  }
}

/** Where a pitch, as a ratio of the prime, stands on the ladder. */
export function tierceRungY(ratio: number, ladder: Box): number {
  const share = Math.log(ratio / LADDER_LOW) / Math.log(LADDER_HIGH / LADDER_LOW)
  return ladder.y + ladder.h * (1 - share)
}

/** How long a rung is for a level as the device puts it out before Volume. */
export function tierceRungWidth(level: number, ladder: Box): number {
  if (!(level > 0)) return 0
  const db = 20 * Math.log10(level / TIERCE_LEVEL)
  return clamp((db - RUNG_FLOOR_DB) / (RUNG_TOP_DB - RUNG_FLOOR_DB), 0, 1) * ladder.w
}

/** The place the picture shows at rest: the third of the key that Root names. */
export const tierceRest = (set: TierceSettings): number => tiercePlace(set, set.root)

/** Where a third, in cents, stands in its lane; a third off the scale stands at its edge. */
export function tierceLaneY(cents: number, lane: Box): number {
  return lane.y + clamp((CENTS_HIGH - cents) / (CENTS_HIGH - CENTS_LOW), 0, 1) * lane.h
}

/** Where a time after the strike stands in the lane. */
export function tierceLaneX(seconds: number, lane: Box): number {
  const from = lane.x + LANE_STRIKE
  return from + Math.sqrt(clamp(seconds / TIERCE_TIME_SEC, 0, 1)) * (lane.w - LANE_STRIKE)
}

/** A third as it is said: its name when it is one of the named ones, else cents. */
export function tierceName(cents: number): string {
  const named = TIERCE_NAMED.find((each) => Math.abs(each.cents - cents) < 1)
  return named ? named.name : `${Math.round(cents)} ct`
}

/** The newest bell, as the device reports it and the notes date it. */
interface Ringing {
  tierce: number
  place: number
  level: number
  hz: number
  gain: number
  age: number
  released: number
}

interface TierceState extends HeardLevel {
  /** The strike that is followed: when it was struck and when it was taken up, on the display's clock. */
  strike: { id: number; at: number; taken: number; gain: number } | null
  ringing: Ringing | null
  /** The words of the third, and since when they stand. */
  said: { words: string; at: number } | null
}

/**
 * The bell that is shown on this frame. A new strike is taken up only when the
 * one followed has been followed for `TIERCE_FOLLOWS_SEC`; until then what was
 * shown last stands, so fast playing moves the picture twice a second at most.
 */
function ringingNow(frame: DisplayFrame<TierceState>): Ringing | null {
  const { state, now } = frame
  const hz = frame.meter('prime')
  if (!frame.powered || !(hz >= 20)) {
    state.strike = null
    state.ringing = null
    return null
  }
  // The newest note on the reported bell, else (the reading is a frame behind) the newest of all.
  const newest = (notes: readonly DisplayNote[]): DisplayNote | null => {
    let found: DisplayNote | null = null
    for (const note of notes) if (!found || note.age <= found.age) found = note
    return found
  }
  const note =
    newest(frame.notes.filter((each) => Math.abs(each.frequency / hz - 1) < 1e-3)) ??
    newest(frame.notes)
  const strike = state.strike
  if (note) {
    const at = now - note.age
    const same = strike !== null && strike.id === note.id && Math.abs(strike.at - at) < 0.1
    if (!same) {
      if (strike && state.ringing && now - strike.taken < TIERCE_FOLLOWS_SEC) return state.ringing
      state.strike = { id: note.id, at, taken: now, gain: note.gain }
    }
  }
  state.ringing = {
    tierce: frame.meter('tierce'),
    place: frame.meter('place'),
    level: Math.max(frame.meter('level'), 0),
    hz,
    gain: state.strike?.gain ?? 1,
    // A bell the plate has no note of is taken to have rung for as long as the ticks are dated.
    age: state.strike ? now - state.strike.at : TIERCE_TICK_SEC,
    released: note?.released ?? 0,
  }
  return state.ringing
}

/** The words of the third, which change twice a second at most while it glides. */
function saidNow(state: TierceState, words: string, now: number): string {
  if (!state.said || (state.said.words !== words && now - state.said.at >= TIERCE_FOLLOWS_SEC))
    state.said = { words, at: now }
  return state.said.words
}

/** The partials that are named beside the ladder; the third and the deciem are told by their colour. */
const RUNG_NAMES: readonly { role: TierceRole; ratio: number; name: string }[] = [
  { role: 'hum', ratio: 0.5, name: 'hum' },
  { role: 'prime', ratio: 1, name: 'prime' },
  { role: 'fifth', ratio: 1.5, name: 'quint' },
  { role: 'over', ratio: 2, name: 'nominal' },
]

function drawLadder(
  frame: DisplayFrame<TierceState>,
  at: TierceLayout,
  set: TierceSettings,
  cents: number,
  hz: number,
  ringing: Ringing | null,
): void {
  const { ctx, colours, sampleRate } = frame
  const { ladder } = at
  const full = tierceLevels(set, hz, 1, cents, 0, 0, sampleRate)
  const later = tierceLevels(set, hz, 1, cents, TIERCE_TICK_SEC, 0, sampleRate)
  let now: number[] | null = null
  if (ringing) {
    const shape = tierceLevels(
      set,
      hz,
      ringing.gain,
      cents,
      ringing.age,
      ringing.released,
      sampleRate,
    )
    const total = tierceTotal(shape)
    if (total > 0) now = shape.map((level) => (level * ringing.level) / total)
  }
  rule(ctx, ladder.x, ladder.y, ladder.x, ladder.y + ladder.h, {
    colour: colours.ink,
    alpha: INK.rule,
  })
  const tied: number[] = []
  TIERCE_BELLS[set.bell].partials.forEach((partial, k) => {
    const ratio = tierceRatio(set, partial, cents)
    if (ratio > LADDER_HIGH) return
    const y = tierceRungY(ratio, ladder)
    const moves = partial.role === 'third' || partial.role === 'deciem'
    if (moves) tied.push(y)
    const colour = moves ? colours.accent : colours.ink
    const wide = tierceRungWidth(full[k], ladder)
    if (wide > 0) {
      rule(ctx, ladder.x, y, ladder.x + wide, y, { colour, alpha: moves ? INK.trace : INK.text })
      const left = tierceRungWidth(later[k], ladder)
      if (left > 0)
        rule(ctx, ladder.x + left, y - 1.5, ladder.x + left, y + 1.5, { colour, alpha: INK.trace })
    }
    if (!now) return
    const lit = tierceRungWidth(now[k], ladder)
    if (lit > 0) fillRect(ctx, { x: ladder.x, y: y - 1.5, w: lit, h: 3 }, colour)
  })
  // The third and the deciem are an octave apart, always: one line ties them.
  if (tied.length === 2)
    trace(
      ctx,
      [
        [ladder.x, tied[0]],
        [ladder.x - 3, tied[0]],
        [ladder.x - 3, tied[1]],
        [ladder.x, tied[1]],
      ],
      { colour: colours.accent, width: 1 },
    )
  for (const { role, ratio, name } of RUNG_NAMES) {
    const y = tierceRungY(role === 'hum' ? set.humPitch : ratio, ladder)
    text(frame, name, at.names, Math.round(y) + 3)
  }
}

/** The way of a strike's third to `place`: level before the strike, then the glide on the lane's root of time. */
function lanePoints(set: TierceSettings, place: number, lane: Box): Point[] {
  const points: Point[] = [[lane.x, tierceLaneY(place + set.lean, lane)]]
  const steps = Math.max(8, Math.round(lane.w))
  for (let i = 0; i <= steps; i++) {
    const seconds = TIERCE_TIME_SEC * (i / steps) ** 2
    points.push([
      tierceLaneX(seconds, lane),
      tierceLaneY(tierceGlide(place, set.lean, set.glide, seconds), lane),
    ])
  }
  return points
}

function drawLane(
  frame: DisplayFrame<TierceState>,
  at: TierceLayout,
  set: TierceSettings,
  ringing: Ringing | null,
): void {
  const { ctx, colours } = frame
  const { lane } = at
  const right = lane.x + lane.w
  for (const { name, cents } of TIERCE_NAMED) {
    const y = tierceLaneY(cents, lane)
    rule(ctx, lane.x, y, right + 4, y, { colour: colours.ink, alpha: INK.grid })
    text(frame, name, at.marks, Math.round(y) + 3, { align: 'right' })
  }
  const strikeX = tierceLaneX(0, lane)
  rule(ctx, strikeX, lane.y, strikeX, lane.y + lane.h, { colour: colours.ink, alpha: INK.rule })
  // A strike's third from Lean away to its place: at rest, and over it the bell that rings.
  const rest = tierceRest(set)
  trace(ctx, lanePoints(set, rest, lane), { colour: colours.ink, width: 1.5 })
  if (ringing && Math.abs(ringing.place - rest) > 1)
    trace(ctx, lanePoints(set, ringing.place, lane), { colour: colours.accent, width: 1 })
  // Where it starts off the scale, a mark at the edge says which way it is.
  const start = rest + set.lean
  if (start > CENTS_HIGH || start < CENTS_LOW) {
    const up = start > CENTS_HIGH
    const y = up ? lane.y : lane.y + lane.h
    const back = up ? 4 : -4
    trace(
      ctx,
      [
        [strikeX + 3, y + back],
        [strikeX + 6, y],
        [strikeX + 9, y + back],
      ],
      { colour: colours.ink, width: 1 },
    )
  }
  // The knob, where the bell at rest does not take its third from it.
  const [third, lean] = tierceHandles(frame)
  if (Math.abs(rest - set.tierce) > 1)
    trace(
      ctx,
      [
        [third.x, third.y],
        [right + 4, third.y],
      ],
      { colour: colours.ink, width: 1, alpha: INK.text, dash: [2, 2] },
    )
  if (ringing) {
    const x = tierceLaneX(ringing.age, lane)
    dot(ctx, x, tierceLaneY(ringing.tierce, lane), 3, colours.accent, { ring: colours.ink })
  }
  handle(frame, lean.x, lean.y, { hot: frame.hot === 'lean', radius: 2.5 })
  handle(frame, third.x, third.y, { hot: frame.hot === 'tierce' })
}

function drawKeys(
  frame: DisplayFrame<TierceState>,
  at: TierceLayout,
  set: TierceSettings,
  key: number,
  ringing: Ringing | null,
): void {
  const { ctx, colours } = frame
  const { keys } = at
  const cell = keys.w / 12
  for (let k = 0; k < 12; k++) {
    const kind = tierceKind(set, k)
    const h = kind === 'major' ? keys.h : kind === 'minor' ? keys.h / 2 : 1
    const lit = ringing !== null && k === key
    fillRect(
      ctx,
      { x: keys.x + k * cell + 1, y: keys.y + keys.h - h, w: cell - 2, h },
      lit ? colours.accent : colours.ink,
      lit ? INK.trace : INK.back,
    )
  }
  // The root of the scale, marked under its key while Follow is on.
  if (set.follow)
    fillRect(
      ctx,
      { x: keys.x + set.root * cell + cell / 2 - 1.5, y: keys.y + keys.h + 1, w: 3, h: 1 },
      colours.ink,
    )
}

const centsPerPixel = (lane: Box): number => (CENTS_HIGH - CENTS_LOW) / lane.h

/**
 * A point dragged upright moves from the setting it was taken at, so one whose
 * setting lies off the scale does not jump to the edge it stands on.
 */
function dragged(y: number, from: { y: number; value: number }, lane: Box, hold?: DisplayHold) {
  const start = hold ? (hold.value ??= from.value) : from.value
  const pressed = hold ? (hold.y ??= from.y) : from.y
  const moved = pressed - y
  return { value: start + moved * centsPerPixel(lane), moved }
}

function tierceHandles(view: DisplayView): [DisplayHandle, DisplayHandle] {
  const set = tierceSettings((name) => view.value(name))
  const { lane } = tierceLayout(view)
  const third = { y: tierceLaneY(set.tierce, lane), value: set.tierce }
  const thirdX = tierceLaneX(set.glide, lane)
  const place = tierceRest(set)
  const lean = { y: tierceLaneY(place + set.lean, lane), value: set.lean }
  const bounded = (cents: number): number => clamp(cents, TIERCE_LOW, TIERCE_HIGH)
  return [
    {
      key: 'tierce',
      name: 'Tierce and Glide',
      x: thirdX,
      y: third.y,
      drag: (x, y, hold) => {
        const { value, moved } = dragged(y, third, lane, hold)
        let tierce = bounded(value)
        if (Math.abs(moved) > 0.5) {
          const near = TIERCE_NAMED.find(
            (each) => Math.abs(each.cents - tierce) < SNAP_PX * centsPerPixel(lane),
          )
          if (near) tierce = bounded(near.cents)
        }
        const startX = hold ? (hold.x ??= thirdX) : thirdX
        const seconds = hold ? (hold.glide ??= set.glide) : set.glide
        // The same step of the pointer is the same step along the lane's root of time.
        const share = Math.sqrt(seconds / TIERCE_TIME_SEC) + (x - startX) / (lane.w - LANE_STRIKE)
        const spec = view.spec('glide')
        const glide =
          Math.abs(x - startX) < 0.5 ? seconds : TIERCE_TIME_SEC * Math.max(share, 0) ** 2
        return { tierce, glide: clamp(glide, spec?.min ?? SHORTEST_GLIDE, spec?.max ?? 20) }
      },
      wheel: (steps) => ({ tierce: bounded(set.tierce + steps) }),
      reset: () => ({
        tierce: view.spec('tierce')?.default ?? TIERCE_MINOR,
        glide: view.spec('glide')?.default ?? 1.5,
      }),
    },
    {
      key: 'lean',
      name: 'Lean',
      x: lane.x,
      y: lean.y,
      drag: (_x, y, hold) => {
        const spec = view.spec('lean')
        const { value, moved } = dragged(y, lean, lane, hold)
        const near = Math.abs(value) < SNAP_PX * centsPerPixel(lane) && Math.abs(moved) > 0.5
        return { lean: near ? 0 : clamp(value, spec?.min ?? -231, spec?.max ?? 231) }
      },
      wheel: (steps) => ({ lean: clamp(set.lean + steps, -231, 231) }),
      reset: () => ({ lean: 0 }),
    },
  ]
}

const tierceBells = plateDisplay<TierceState>({
  place: 'window',
  columns: 2,
  params: [
    'bell',
    'tierce',
    'follow',
    'root',
    'scale',
    'lean',
    'glide',
    'humPitch',
    'humLevel',
    'quint',
    'upper',
    'decay',
    'damping',
    'hardness',
  ],
  live: { meters: true, signal: true, notes: true },
  info: "Left, a bell's partials by pitch, the third tied to the deciem an octave up; ticks mark what is left after two seconds. Right, the third from Lean to its place over Glide; drag either point. Below, the third each key gets: tall is major, half is minor, a line is the Tierce knob.",
  init: () => ({ strike: null, ringing: null, said: null, heard: [], shown: 0 }),
  draw(frame) {
    ground(frame)
    const set = tierceSettings((name) => frame.value(name))
    const at = tierceLayout(frame)
    const ringing = ringingNow(frame)
    const hz = ringing?.hz ?? C4_HZ * Math.pow(2, set.root / 12)
    const cents = ringing?.tierce ?? tierceRest(set)

    text(frame, TIERCE_BELLS[set.bell].name, at.head.left, at.head.baseline)
    const words = `${pitchName(hz)}  ${tierceName(cents)}`
    text(frame, saidNow(frame.state, words, frame.now), at.head.right, at.head.baseline, {
      align: 'right',
    })
    drawLadder(frame, at, set, cents, hz, ringing)
    drawLane(frame, at, set, ringing)
    drawKeys(frame, at, set, tierceKey(hz), ringing)
    levelFoot(frame, at.foot, meanOutShare(frame.state, frame, LEVEL_SEC))
  },
  handles: (view) => tierceHandles(view),
})

export const TIERCE_BELLS_FACES: Readonly<Record<string, PlateFace>> = {
  'tierce-bells': {
    display: tierceBells,
    face: ['tierce', 'follow', 'lean', 'glide'],
    sections: [
      ['bell', 'hardness', 'decay', 'damping', 'doublet', 'release'],
      ['tierce', 'follow', 'lean', 'root', 'scale', 'glide'],
      ['humPitch', 'humLevel', 'quint', 'upper'],
      ['spread', 'volume'],
    ],
  },
}
