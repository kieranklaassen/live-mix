// The displays of the invented instruments: bodies.
//
// Each of these is a thing that rings and the thing that sets it ringing,
// drawn as what they are. What the knobs set is in the picture at rest (where
// the body is met, which of its partials that feeds and how long each rings),
// and a note that is played moves the body and lights its partials for as
// long as the device's own figures let it sound.

import {
  INK,
  clamp,
  dot,
  fillRect,
  gainToDb,
  ground,
  handle,
  lerp,
  rule,
  text,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { levelFoot, outShare, pitchName } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>
type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>

/** Under this share of its light a thing that sounded is done. */
const DONE = 0.02
/** A level as a share of a light: whole at full scale, out at 60 dB under it. */
const shareOfDb = (db: number): number => clamp(1 + db / 60, 0, 1)
const MIDDLE_C_HZ = 261.63

// --- Graft -------------------------------------------------------------------

/** `graft.h`, `Exciter` and `Body`: the two choices, as a crossing is said. */
const GRAFT_EXCITERS = ['Blown', 'Bowed', 'Struck', 'Plucked'] as const
const GRAFT_BODIES = ['string', 'pipe', 'bar', 'bowl'] as const
const BOW = 1
const MALLET = 2
const PIPE = 1
const BAR = 2
const BOWL = 3
/** `graft.h`, `kMaxVoices`, `kMinHz` and `kMaxHz`: the notes it has, and the pitches it plays. */
const GRAFT_VOICES = 10
const GRAFT_LOW_HZ = 25
const GRAFT_HIGH_HZ = 4500
/** `graft.h`, `kHeldSeconds`, `kHeldPeriods`, `kChokeSeconds`: a held body's own ring, and a key struck again. */
const GRAFT_HELD_SECONDS = 0.3
const GRAFT_HELD_PERIODS = 60
const GRAFT_CHOKE_SECONDS = 0.05
/** `graft.h`, `kDull`, `kMetal`, `kWood`: what Bright runs between. */
const GRAFT_DULL = 0.03
const GRAFT_METAL = 0.02
const GRAFT_WOOD = 2
/** `graft_bodies.h`, `kBarRatio` and `kBowlRatio`; a string has every harmonic and a pipe the odd ones. */
const GRAFT_RATIOS: readonly (readonly number[])[] = [
  Array.from({ length: 16 }, (_, n) => n + 1),
  Array.from({ length: 8 }, (_, n) => 2 * n + 1),
  [1, 2.756, 5.404, 8.933, 13.34],
  [1, 2.71, 5.15, 8.2, 11.9],
]
const GRAFT_PARTIALS_MOST = 16
/** `graft_bodies.h`, `kMateLevel`: the second half of a bowl's pair against the first. */
const GRAFT_MATE = 0.7
/** What a partial the device does not sound is said to stand at. */
const GRAFT_SILENT_DB = -200

/** The partials of a body as ratios of the note. */
export function graftRatios(body: number): readonly number[] {
  return GRAFT_RATIOS[clamp(Math.round(body), 0, 3)]
}

/** `Graft::start`, `strength`: what a key played as hard as `gain` brings. */
export const graftStrength = (gain: number): number => 0.25 + 0.75 * clamp(gain, 0, 1)

/** `Graft::start`, `track`: Decay at this pitch against middle C. */
export const graftTrack = (hz: number): number =>
  clamp(Math.pow(MIDDLE_C_HZ / Math.max(hz, 1), 0.35), 0.25, 2)

/**
 * `Graft::ring_time`: seconds the body's lowest partial rings as things
 * stand. Under breath or a bow it is damped so that it answers them; left
 * alone it rings for Decay, and once the key is up no longer than Release.
 */
export function graftRingSeconds(
  hz: number,
  decay: number,
  release: number,
  driven: boolean,
  up: boolean,
): number {
  const free = decay * graftTrack(hz)
  if (up) return Math.min(free, release)
  return driven ? Math.max(GRAFT_HELD_SECONDS, GRAFT_HELD_PERIODS / hz) : free
}

/** `Graft::drive_level`: how hard breath or a bow drives, 1 a full key at full Pressure. */
export function graftDriveLevel(exciter: number, gain: number, pressure: number): number {
  const soft = exciter === BOW ? 0.5 : 0.45
  return graftStrength(gain) * (soft + (1 - soft) * pressure)
}

/** `Graft::start`: the weight of a strike (`kSoftStrike`), and how hard its mallet or pick is. */
export const graftStrikeLevel = (gain: number, pressure: number): number =>
  graftStrength(gain) * (0.35 + 0.65 * pressure)
export const graftHardness = (gain: number, pressure: number): number =>
  clamp(pressure * (0.6 + 0.5 * clamp(gain, 0, 1)), 0, 1)

/** `Adsr::next` as `Graft::start` sets it: how far breath or a bow has come `seconds` after the key, 1 at Swell. */
export function graftSwellLevel(seconds: number, swell: number): number {
  if (seconds <= 0) return 0
  return Math.min(1, 1.3 * (1 - Math.pow(0.3 / 1.3, seconds / Math.max(swell, 1e-4))))
}

/** `Driver::set_pressure`: the width of the band a driver's force passes through, as a Q on the note. */
export const graftDriverQ = (exciter: number, pressure: number): number =>
  exciter === BOW ? 0.6 - 0.3 * pressure : 1.6 * Math.pow(0.45 / 1.6, pressure)

/** `Striker::strike`: the mallet's push in periods of the note, most of one when soft, never under two samples or over 12 ms. */
export function graftMalletPeriods(hardness: number, hz: number, sampleRate: number): number {
  const length = clamp((0.7 * Math.pow(0.1, hardness) * sampleRate) / hz, 2, 0.012 * sampleRate)
  return (length * hz) / sampleRate
}

/** `Striker::strike`: the corner the pick opens to, counted in partials of the note. */
export const graftPickHz = (hardness: number, hz: number, sampleRate: number): number =>
  clamp(hz * 0.6 * Math.pow(40, hardness), 120, 0.4 * sampleRate)

/** How much of a raised-cosine push `periods` long (in periods of a partial) ends up in that partial. */
function pulseResponse(periods: number): number {
  if (periods < 1e-3) return 1
  const spare = 1 - periods * periods
  if (Math.abs(spare) < 1e-3) return 0.5
  return Math.abs(Math.sin(Math.PI * periods) / (Math.PI * periods * spare))
}

/**
 * What an exciter gives a partial `ratio` times the note, against its own
 * level. `Driver`: breath and bow pass a band about the note, wider the
 * harder (`touch` is Pressure). `Striker`: a mallet's push keeps its energy
 * as it shortens, and a pluck falls as 1/n through the pick's corner
 * (`touch` is the hardness).
 */
export function graftReach(
  exciter: number,
  ratio: number,
  touch: number,
  hz: number,
  sampleRate: number,
): number {
  if (exciter < MALLET) {
    const q = graftDriverQ(exciter, touch)
    return 1 / Math.sqrt(1 + q * q * (ratio - 1 / ratio) * (ratio - 1 / ratio))
  }
  if (exciter === MALLET) {
    const periods = graftMalletPeriods(touch, hz, sampleRate)
    return Math.sqrt(Math.min(1, periods / 0.7)) * pulseResponse(periods * ratio)
  }
  const over = (ratio * hz) / graftPickHz(touch, hz, sampleRate)
  return 1 / Math.sqrt((1 + ratio * ratio) * (1 + over * over))
}

/**
 * How strongly Position lets partial `k` of a body be heard. `Waveguide::set_comb`:
 * a string or pipe is heard against itself a share of a period earlier, a
 * little apart left and right for Width (the two sides' power is given).
 * `Modes::set_position`: a bar's modes by their shape where it is met, a
 * bowl's pairs thinner the nearer the base.
 */
export function graftWeight(body: number, k: number, position: number, width: number): number {
  if (body === BOWL) return Math.pow(1 - 0.85 * position, k)
  if (body === BAR) {
    if (k === 0) return 1
    const turned = (k + 1.5) * Math.PI * (0.03 + 0.47 * position - 0.5)
    return Math.abs(k & 1 ? Math.sin(turned) : Math.cos(turned))
  }
  const n = graftRatios(body)[k]
  const q = 0.06 + 0.44 * position
  let power = 0
  for (let side = -1; side <= 1; side += 2) {
    const tap = clamp(q * (1 + side * 0.22 * width), 0.06, 0.5)
    const level = Math.sin(Math.PI * n * tap) / Math.sqrt(Math.sin(Math.PI * tap))
    power += 0.5 * level * level
  }
  return Math.sqrt(power)
}

/** The loss a string's or pipe's loop is given: its low-pass's pole and its gain. */
export interface GraftLoop {
  pole: number
  gain: number
}

const lossMagnitude = (pole: number, cos: number): number =>
  (1 - pole) / Math.sqrt(1 - 2 * pole * cos + pole * pole)

/**
 * `Waveguide::set_loss`: the loop of a string (or a pipe, half as long) at
 * `hz` whose fundamental rings `ring` seconds and whose partial near 3 kHz
 * rings `high`. The header finds the pole by halving; it is the root of a
 * quadratic, taken here. The low-pass may not take more off the fundamental
 * than the gain can give back, so on a short or high note Decay wins.
 */
export function graftLoop(
  hz: number,
  pipe: boolean,
  ring: number,
  high: number,
  sampleRate: number,
  into: GraftLoop = { pole: 0, gain: 0 },
): GraftLoop {
  const rounds = hz * (pipe ? 2 : 1)
  const w1 = (2 * Math.PI * hz) / sampleRate
  const w2 = (2 * Math.PI * clamp(Math.max(3000, 2 * hz), 0, 0.45 * sampleRate)) / sampleRate
  const c1 = Math.cos(w1)
  const c2 = Math.cos(w2)
  const gain1 = Math.pow(10, -3 / (rounds * Math.max(ring, 0.001)))
  const gain2 = Math.pow(10, -3 / (rounds * clamp(high, 0.0005, Math.max(ring, 0.0005))))
  const wanted = (gain2 / gain1) * (gain2 / gain1)
  let pole = 0
  if (w2 > w1 && wanted < 1) {
    const b = c1 - wanted * c2
    const root = b * b - (1 - wanted) * (1 - wanted)
    pole = root > 0 ? Math.min(0.98, (b - Math.sqrt(root)) / (1 - wanted)) : 0.98
  }
  const most = Math.min(0.9999, Math.pow(gain1, 0.25))
  const least = gain1 / most
  if (least < 1) {
    const m2 = least * least
    const b = 1 - m2 * c1
    const limit = (b - Math.sqrt(Math.max(0, b * b - (1 - m2) * (1 - m2)))) / (1 - m2)
    pole = Math.min(pole, Math.max(limit, 0))
  }
  into.pole = pole
  into.gain = Math.min(gain1 / lossMagnitude(pole, c1), most)
  return into
}

/** Seconds a component at `at` Hz takes to fall 60 dB round such a loop. */
export function graftLineSeconds(
  loop: GraftLoop,
  hz: number,
  pipe: boolean,
  at: number,
  sampleRate: number,
): number {
  if (at >= 0.5 * sampleRate) return 0
  const round = loop.gain * lossMagnitude(loop.pole, Math.cos((2 * Math.PI * at) / sampleRate))
  return round < 1 ? -3 / (hz * (pipe ? 2 : 1) * Math.log10(Math.max(round, 1e-9))) : Infinity
}

/**
 * Seconds each partial of a body at `hz` rings when its lowest rings `ring`,
 * written into `into`; 0 for one the device does not sound. `Graft::shape`:
 * Bright sets how long a string's or pipe's partial near 3 kHz lives against
 * the fundamental (`kDull` of it to all), and how much ring time a bar's or
 * bowl's modes lose by their ratio (`Modes::set_loss`, wood to metal).
 */
export function graftPartialSeconds(
  body: number,
  hz: number,
  ring: number,
  bright: number,
  sampleRate: number,
  into: Float32Array,
  loop?: GraftLoop,
): Float32Array {
  const ratios = graftRatios(body)
  if (body >= BAR) {
    const damping = GRAFT_METAL * Math.pow(GRAFT_WOOD / GRAFT_METAL, 1 - bright)
    for (let k = 0; k < ratios.length; k++)
      into[k] = hz * ratios[k] < 0.45 * sampleRate ? ring / (1 + damping * (ratios[k] - 1)) : 0
    return into
  }
  const pipe = body === PIPE
  const made = graftLoop(hz, pipe, ring, ring * Math.pow(GRAFT_DULL, 1 - bright), sampleRate, loop)
  for (let k = 0; k < ratios.length; k++)
    into[k] = graftLineSeconds(made, hz, pipe, hz * ratios[k], sampleRate)
  return into
}

/** `Modes::start`: the hertz the two halves of a bowl's pair `k` lie apart, never over ten cents for the lowest. */
export const graftBeatHz = (hz: number, k: number): number =>
  Math.min(0.7 * Math.sqrt(hz / 220), 0.006 * hz) * (1 + 0.7 * k)

/** `Modes::aim`, `swing`: how much of its full swing a pair has when its second half is `turn` of a round on from its first. */
export function graftSwing(turn: number): number {
  const along = 1 + GRAFT_MATE * Math.cos(2 * Math.PI * turn)
  const across = GRAFT_MATE * Math.sin(2 * Math.PI * turn)
  return Math.sqrt(along * along + across * across) / (1 + GRAFT_MATE)
}

/** `Graft::rub_level`: what the roughness of breath or bow gives an upper mode of a bar or bowl against the driven one, were it to ring as long. */
export const graftRubLevel = (pressure: number, air: number): number =>
  (0.08 + 0.52 * pressure) * Math.sqrt(Math.max(air, 0) / 0.25)

/**
 * Where a note stands between the speakers, −1 left to 1 right. `Graft::place`:
 * strings and pipes in two ranks, a key and the next on opposite sides
 * (`kRanks`). `Modes::set_position`: bars in a row by their pitch (`kBarRow`);
 * a bowl in the middle, the halves of its pairs to either side.
 */
export function graftPan(body: number, hz: number, width: number): number {
  if (body === BOWL) return 0
  if (body === BAR)
    return clamp(0.25 * clamp(Math.log2(hz / MIDDLE_C_HZ), -1.6, 1.6) * width, -1, 1)
  const key = Math.floor(12 * Math.log2(hz / 16.3516) + 0.5)
  return (key & 1 ? -0.35 : 0.35) * width
}

/** What the knobs set, as the figures below read them. */
export interface GraftSetting {
  exciter: number
  body: number
  pressure: number
  position: number
  bright: number
  decay: number
  air: number
  swell: number
  release: number
  width: number
  sampleRate: number
}

/** What a note's figures are worked out in, kept between frames. */
export interface GraftWork {
  held: Float32Array
  free: Float32Array
  loop: GraftLoop
}

export const graftWork = (): GraftWork => ({
  held: new Float32Array(GRAFT_PARTIALS_MOST),
  free: new Float32Array(GRAFT_PARTIALS_MOST),
  loop: { pole: 0, gain: 0 },
})

/**
 * How strongly a key played as hard as `gain` feeds partial `k` of the body,
 * 1 its full swing; `held` is how long each partial rings while the key is
 * down. A strike gives each partial what the mallet or pick has there; breath
 * and bow hold a string or pipe through their band, and a bar or bowl by its
 * lowest mode alone, their roughness finding the three modes (two pairs)
 * above it (`kRubbedModes`, `kRubbedPairs`): that falls away above the second
 * partial (`kRoughPartials`), and a mode that rings less than the driven one
 * is that much quieter.
 */
export function graftFed(
  set: GraftSetting,
  hz: number,
  gain: number,
  k: number,
  held: Float32Array,
): number {
  const { exciter, body, pressure } = set
  const ratio = graftRatios(body)[k]
  const weight = graftWeight(body, k, set.position, set.width)
  if (exciter >= MALLET) {
    const hardness = graftHardness(gain, pressure)
    return (
      graftStrikeLevel(gain, pressure) *
      weight *
      graftReach(exciter, ratio, hardness, hz, set.sampleRate)
    )
  }
  const level = graftDriveLevel(exciter, gain, pressure) * weight
  if (body < BAR) return level * graftReach(exciter, ratio, pressure, hz, set.sampleRate)
  if (k === 0) return level
  if (k >= (body === BOWL ? 3 : 4)) return 0
  const rough = 1 / Math.sqrt(1 + 0.25 * ratio * ratio)
  return level * graftRubLevel(pressure, set.air) * Math.sqrt(held[k] / held[0]) * rough
}

/**
 * How far each partial of a note stands under the body's full swing, in dB,
 * written into `into` from `at`; how many partials the body has comes back.
 * The key went down `age` seconds ago and up `released` seconds ago (null
 * while it is down); `choked` is the seconds since the same key was struck
 * again over it, null if it was not.
 *
 * `Graft::strike_body`: a mallet or pluck pushes once and each partial falls
 * 60 dB over its own ring, faster from the key up if Release is the shorter.
 * `Graft::drive_body`: breath or bow hold the body at their level, which
 * comes up over Swell and no faster than the damped body answers. From the
 * key up the body rings alone.
 */
export function graftNoteDb(
  set: GraftSetting,
  note: Pick<DisplayNote, 'frequency' | 'gain' | 'age' | 'released'>,
  choked: number | null,
  work: GraftWork,
  into: Float32Array,
  at = 0,
): number {
  const { body, sampleRate } = set
  const hz = clamp(note.frequency, GRAFT_LOW_HZ, GRAFT_HIGH_HZ)
  const count = graftRatios(body).length
  const driven = set.exciter < MALLET
  // A key struck again while it was down is a hand on the old note: it is let go there.
  const after = Math.min(Math.max(note.released ?? 0, choked ?? 0), note.age)
  const down = note.age - after
  const free = graftPartialSeconds(
    body,
    hz,
    graftRingSeconds(hz, set.decay, set.release, driven, true),
    set.bright,
    sampleRate,
    work.free,
    work.loop,
  )
  const held = graftPartialSeconds(
    body,
    hz,
    graftRingSeconds(hz, set.decay, set.release, driven, false),
    set.bright,
    sampleRate,
    work.held,
    work.loop,
  )
  const come = driven
    ? graftSwellLevel(down, set.swell) * (1 - Math.exp((-6.908 * down) / held[0]))
    : 1
  for (let k = 0; k < count; k++) {
    let db = GRAFT_SILENT_DB
    if (free[k] > 0 && held[k] > 0) {
      let gain = come * graftFed(set, hz, note.gain, k, held)
      // `Modes::spin`: the halves of a bowl's pair come round on each other from the strike on.
      if (body === BOWL) gain *= graftSwing(graftBeatHz(hz, k) * note.age)
      db = gainToDb(gain) - 60 * ((driven ? 0 : down / held[k]) + after / free[k])
      if (choked !== null) db -= (60 * Math.min(choked, note.age)) / GRAFT_CHOKE_SECONDS
    }
    into[at + k] = db
  }
  return count
}

/** The seconds a partial's length spans, foot to top, on a scale of ratios. */
const GRAFT_SHORT_SEC = 0.03
const GRAFT_LONG_SEC = 40
/** The highest ratio the partials' row reaches: a string's sixteenth harmonic. */
const GRAFT_RATIO_MOST = 16
/** A strike is seen for this long. */
const GRAFT_FLASH_SEC = 0.14
/** How many places along a body its motion is drawn at, and how many of its partials move it. */
const GRAFT_STEPS = 32
const GRAFT_MOVING = 6

interface GraftParts {
  /** The body lies from `x` to `x + w`; the exciter meets it at `y` and it is `h` deep. */
  body: Box
  /** The exciter's push in time, at the top right. */
  push: Box
  /** The partials: they stand on `y + h`, the longest reaching `y`. */
  sticks: Box
  /** The line the notes stand along between the speakers. */
  stage: number
  foot: Box
}

function graftParts(view: Size): GraftParts {
  const foot: Box = { x: 4, y: view.height - 10, w: view.width - 8, h: 6 }
  const stage = foot.y - 2
  const deck = Math.round(view.height * 0.38)
  const depth = Math.round(view.height * 0.14)
  const wide = Math.min(56, Math.round(view.width * 0.34))
  const top = deck + depth + 4
  return {
    body: { x: 12, y: deck, w: view.width - 24, h: depth },
    push: { x: view.width - 8 - wide, y: 17, w: wide, h: Math.max(4, deck - 5 - 17) },
    sticks: { x: 30, y: top, w: view.width - 42, h: Math.max(8, stage - 4 - top) },
    stage,
    foot,
  }
}

/** How large the exciter is drawn: it has the room between the words and the body. */
const graftExciterSize = (parts: GraftParts): number => clamp((parts.body.y - 15) / 21, 0.5, 2)

/** A partial's length as a share of the tallest, from the seconds it rings. */
const graftLength = (ring: number): number =>
  clamp(Math.log(ring / GRAFT_SHORT_SEC) / Math.log(GRAFT_LONG_SEC / GRAFT_SHORT_SEC), 0.03, 1)
const graftSecondsOf = (length: number): number =>
  GRAFT_SHORT_SEC * Math.pow(GRAFT_LONG_SEC / GRAFT_SHORT_SEC, length)

/** Where a partial stands across the row, by its ratio: the note at the left. */
const graftStickX = (ratio: number, sticks: Box): number =>
  sticks.x + 4 + ((ratio - 1) / (GRAFT_RATIO_MOST - 1)) * (sticks.w - 8)

/** `Graft::place`, `Modes::set_position`: how far along a string, pipe or bar Position meets it, the end at 0 and the middle at a half. */
const graftAlong = (body: number, position: number): number =>
  body === BAR ? 0.03 + 0.47 * position : 0.06 + 0.44 * position

/** The bowl in its box: how far its rim reaches either side of the middle. */
const graftBowlReach = (body: Box): number => Math.min(body.w * 0.5, body.h * 2.7)
/** How round the bowl's wall is: 2 would be half a circle. */
const GRAFT_BOWL_ROUND = 2.6

/**
 * A place on the bowl's wall seen from the side, `s` from −1 at the left rim
 * through 0 at the base to 1 at the right rim, written into `into` as x, y.
 */
function graftBowlAt(body: Box, s: number, into: [number, number]): [number, number] {
  const turn = (Math.abs(s) * Math.PI) / 2
  const reach = graftBowlReach(body)
  into[0] =
    body.x + body.w / 2 + Math.sign(s) * reach * Math.pow(Math.sin(turn), 2 / GRAFT_BOWL_ROUND)
  into[1] = body.y - 2 + (body.h + 1) * Math.pow(Math.cos(turn), 2 / GRAFT_BOWL_ROUND)
  return into
}

/** Where the exciter meets the body, in the display's pixels. */
function graftContact(
  body: number,
  position: number,
  box: Box,
  into: [number, number],
): [number, number] {
  if (body === BOWL) return graftBowlAt(box, position - 1, into)
  into[0] = box.x + graftAlong(body, position) * box.w
  into[1] = box.y
  return into
}

/**
 * The shapes a body moves in, one row of `GRAFT_STEPS + 1` places for each of
 * its first partials: a string's loops between its two ends, the air in a
 * pipe still at the open end and swinging most at the stopped one, and a bar
 * free at both ends (the beam's own shapes, whose pitches are the header's
 * ratios). A bowl's wall is moved in `graftBowlMoved`.
 */
const GRAFT_SHAPES: readonly Float32Array[] = [0, 1, 2].map((body) => {
  const table = new Float32Array(GRAFT_MOVING * (GRAFT_STEPS + 1))
  // The roots of cosh(b) cos(b) = 1, which a bar free at both ends rings at.
  const roots = [4.730041, 7.853205, 10.995608, 14.137165, 17.27876]
  for (let k = 0; k < GRAFT_MOVING; k++) {
    for (let i = 0; i <= GRAFT_STEPS; i++) {
      const u = i / GRAFT_STEPS
      let value = 0
      if (body === BAR) {
        const b = roots[k]
        if (b !== undefined) {
          const lean = (Math.cosh(b) - Math.cos(b)) / (Math.sinh(b) - Math.sin(b))
          value =
            0.5 * (Math.cosh(b * u) + Math.cos(b * u) - lean * (Math.sinh(b * u) + Math.sin(b * u)))
        }
      } else {
        const n = GRAFT_RATIOS[body][k]
        value = Math.sin(Math.PI * n * u * (body === PIPE ? 0.5 : 1))
      }
      table[k * (GRAFT_STEPS + 1) + i] = value
    }
  }
  return table
})

/** A number between 0 and 1 for each whole number, the same every time: where a speck of noise lies. */
const speck = (index: number): number => {
  const value = Math.sin(index * 12.9898 + 4.1) * 43758.5453
  return value - Math.floor(value)
}

/** A path stroked in one colour. */
function inked(ctx: CanvasRenderingContext2D, colour: string, width: number, alpha: number): void {
  ctx.globalAlpha = alpha
  ctx.strokeStyle = colour
  ctx.lineWidth = width
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.globalAlpha = 1
}

function filled(ctx: CanvasRenderingContext2D, colour: string, alpha: number): void {
  ctx.globalAlpha = alpha
  ctx.fillStyle = colour
  ctx.fill()
  ctx.globalAlpha = 1
}

/** The bar's thickness, and how far from each end the cords carry it: where its lowest mode stands still. */
const GRAFT_BAR_THICK = 6
const GRAFT_BAR_NODE = 0.224

/** The body at rest, as what it is: a string on two bridges, a pipe stopped at its far end, a bar on its cords, a bowl. */
function graftBody(frame: Paint, body: number, box: Box): void {
  const { ctx, colours } = frame
  const left = box.x
  const right = box.x + box.w
  const floor = box.y + box.h - 1
  if (body === BOWL) {
    const at: [number, number] = [0, 0]
    ctx.beginPath()
    for (let i = 0; i <= GRAFT_STEPS; i++) {
      graftBowlAt(box, (2 * i) / GRAFT_STEPS - 1, at)
      if (i === 0) ctx.moveTo(at[0], at[1])
      else ctx.lineTo(at[0], at[1])
    }
    filled(ctx, colours.ink, INK.ground)
    inked(ctx, colours.ink, 2, INK.back)
    // The ring it sits on.
    const middle = box.x + box.w / 2
    rule(ctx, middle - 9, floor + 2, middle + 9, floor + 2, { colour: colours.ink, width: 2 })
    return
  }
  if (body === BAR) {
    ctx.beginPath()
    ctx.rect(left, box.y, box.w, GRAFT_BAR_THICK)
    filled(ctx, colours.ink, INK.fill)
    inked(ctx, colours.ink, 1, INK.back)
    for (const node of [GRAFT_BAR_NODE, 1 - GRAFT_BAR_NODE]) {
      const x = left + node * box.w
      ctx.beginPath()
      ctx.moveTo(x, box.y + GRAFT_BAR_THICK + 1)
      ctx.lineTo(x - 4, floor + 1)
      ctx.lineTo(x + 4, floor + 1)
      ctx.closePath()
      filled(ctx, colours.ink, INK.text)
    }
    return
  }
  if (body === PIPE) {
    // Open where it is met, stopped at the far end: the air inside is what sounds.
    ctx.beginPath()
    ctx.rect(left, box.y, box.w, box.h - 2)
    filled(ctx, colours.ink, INK.ground)
    for (const y of [box.y, floor - 1])
      rule(ctx, left, y, right, y, { colour: colours.ink, width: 1.5, alpha: INK.text })
    ctx.beginPath()
    ctx.rect(right - 3, box.y, 4, box.h - 2)
    filled(ctx, colours.ink, 1)
    return
  }
  rule(ctx, left - 5, floor, right + 5, floor, { colour: colours.ink, width: 2, alpha: INK.back })
  for (const x of [left, right]) {
    ctx.beginPath()
    ctx.moveTo(x, box.y)
    ctx.lineTo(x - 3.5, floor)
    ctx.lineTo(x + 3.5, floor)
    ctx.closePath()
    filled(ctx, colours.ink, INK.text)
  }
  rule(ctx, left, box.y, right, box.y, { colour: colours.ink, alpha: INK.back })
}

/**
 * What sets the body going, where it meets it at (x, y): a fan of breath
 * from a mouth, a bow laid across, a mallet's head on its stick, a pick.
 * `weight` is how hard (0..1): more breath, a tighter bow, and a harder
 * mallet or pick, which is the smaller one. `lift` raises a mallet or pick
 * off the body, `slide` moves the bow along itself and `flow` runs the
 * breath; `air` is how much noise the exciter has of its own, as specks.
 */
function graftExciter(
  frame: Paint,
  exciter: number,
  x: number,
  y: number,
  size: number,
  weight: number,
  air: number,
  colour: string,
  alpha: number,
  lift = 0,
  slide = 0,
  flow = 0,
): void {
  const { ctx } = frame
  if (exciter === 0) {
    // A pipe to blow through, and the breath fanning from it onto the body.
    ctx.beginPath()
    ctx.moveTo(x - 15 * size, y - 19 * size)
    ctx.lineTo(x - 10.5 * size, y - 13 * size)
    inked(ctx, colour, 3.4 * size, alpha)
    const lines = 3 + Math.round(2 * weight)
    ctx.beginPath()
    for (let i = 0; i < lines; i++) {
      ctx.moveTo(x - 9 * size, y - 11.2 * size)
      ctx.lineTo(x + (i - (lines - 1) / 2) * 2.7 * size, y - 1.5)
    }
    ctx.setLineDash([3, 2])
    ctx.lineDashOffset = -flow
    inked(ctx, colour, 1, alpha)
    ctx.setLineDash([])
    ctx.lineDashOffset = 0
  } else if (exciter === BOW) {
    // The hair that Pressure tightens on the body, the stick arched over it, and the frog they meet at.
    const ax = x - 9.5 * size + slide * 0.5
    const ay = y - 17 * size + slide * 0.86
    const bx = ax + 15 * size
    const by = ay + 26 * size
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    inked(ctx, colour, 1 + 1.6 * weight, alpha)
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.quadraticCurveTo((ax + bx) / 2 + 5.5 * size, (ay + by) / 2 - 3.2 * size, bx, by)
    inked(ctx, colour, 1, alpha)
    ctx.beginPath()
    ctx.rect(ax - 1.5 * size, ay - 3 * size, 4.5 * size, 4 * size)
    filled(ctx, colour, alpha)
  } else if (exciter === MALLET) {
    const head = lerp(4.8, 2.6, weight) * size
    ctx.beginPath()
    ctx.moveTo(x, y - head - 1 - lift)
    ctx.lineTo(x - 12 * size, y - 17 * size - lift)
    inked(ctx, colour, 1.5, alpha)
    dot(ctx, x, y - head - 1 - lift, head, colour, { alpha })
  } else {
    // A pick: round where it is held, a point where it meets the body.
    const half = lerp(4.6, 2.4, weight) * size
    ctx.beginPath()
    ctx.moveTo(x, y - 1 - lift)
    ctx.lineTo(x - half, y - 1 - lift - half * 2)
    ctx.arc(x, y - 1 - lift - half * 2, half, Math.PI, 0)
    ctx.closePath()
    filled(ctx, colour, alpha)
  }
  // Breath in the tone, rosin under the bow, the thud of a mallet, the scrape of a pick.
  const specks = Math.round(14 * clamp(air, 0, 1))
  for (let i = 0; i < specks; i++)
    dot(ctx, x + (-11 + 24 * speck(i)) * size, y - 2.5 - 12 * speck(i + 40) * size, 0.8, colour, {
      alpha,
    })
}

/** How long a time is in the push, as a share of the room it has: 5 ms is still seen and 6 s takes all of it. */
const graftPushShare = (seconds: number): number =>
  clamp(Math.log(1 + seconds / 0.004) / Math.log(1 + 6 / 0.004), 0, 1)
/** How much of the push's width the swell may take, and how much of it one period of the note is under a strike. */
const GRAFT_PUSH_SWELL = 0.55
const GRAFT_PUSH_PERIOD = 0.3
/** `graft.h`, `kLean`: how far Wander leans the level of a held note either way. */
const GRAFT_LEAN = 0.25

/** `Striker::strike`, `pulse_gain`: the top of a mallet's push `long` periods long, for a strike of size one: the same energy however short, until it is as long as the softest, and the same area past that. */
const graftMalletPeak = (long: number): number => Math.sqrt(Math.min(1, long / 0.7)) / long

/** `PluckExciter::next`: the top of what an impulse of area one leaves after two corners, `slow` and `fast` periods long. */
function graftPickPeak(slow: number, fast: number): number {
  const at = (Math.log(slow / fast) * slow * fast) / (slow - fast)
  return (Math.exp(-at / slow) - Math.exp(-at / fast)) / (slow - fast)
}

/** The note's own corner in a pluck, in periods, and the pick's for a hardness: never quite the same, so the two can be told apart. */
const GRAFT_PICK_SLOW = 1 / (2 * Math.PI)
function graftPickFast(hardness: number, hz: number, sampleRate: number): number {
  const fast = (GRAFT_PICK_SLOW * hz) / graftPickHz(hardness, hz, sampleRate)
  return Math.abs(fast - GRAFT_PICK_SLOW) < 0.004 ? GRAFT_PICK_SLOW - 0.004 : fast
}

/**
 * How high a strike's push stands for its hardness, against the hardest of
 * the same strength. A soft mallet's push is longer with the same energy, so
 * lower by the root of how much longer (0.32 at the softest); a soft pick's
 * impulse is spread by its low corner (0.32 too).
 */
export function graftPushTop(
  exciter: number,
  hardness: number,
  hz: number,
  sampleRate: number,
): number {
  if (exciter === MALLET)
    return (
      graftMalletPeak(graftMalletPeriods(hardness, hz, sampleRate)) /
      graftMalletPeak(graftMalletPeriods(1, hz, sampleRate))
    )
  return (
    graftPickPeak(GRAFT_PICK_SLOW, graftPickFast(hardness, hz, sampleRate)) /
    graftPickPeak(GRAFT_PICK_SLOW, graftPickFast(1, hz, sampleRate))
  )
}

/** How wide the swell is drawn in a push `wide` across. */
const graftPushRamp = (swell: number, wide: number): number =>
  Math.max(1.5, GRAFT_PUSH_SWELL * wide * graftPushShare(swell))

/**
 * The exciter's push `d` pixels into a drawing `wide` across, 1 the hardest.
 * Breath and bow come up over Swell and then hold, leaning either way as far
 * as Wander lets them (the lean is the device's own slow chance, so its reach
 * is drawn and not its instant). A mallet's push is a share of one period of
 * the note, shorter and taller the harder; a pick's is the impulse through
 * the note's and the pick's two corners (`PluckExciter`), sharper and taller
 * the harder.
 */
function graftPushAt(set: GraftSetting, wander: number, d: number, wide: number): number {
  const { exciter, pressure } = set
  if (exciter < MALLET) {
    const full = graftDriveLevel(exciter, 1, pressure)
    const ramp = graftPushRamp(set.swell, wide)
    if (d <= ramp) return full * graftSwellLevel((d / ramp) * set.swell, set.swell)
    const on = d - ramp
    return full * (1 + GRAFT_LEAN * wander * (0.6 * Math.sin(0.5 * on) + 0.4 * Math.sin(1.17 * on)))
  }
  const periods = (d - 2) / (GRAFT_PUSH_PERIOD * wide)
  if (periods <= 0) return 0
  const hardness = graftHardness(1, pressure)
  const full =
    graftStrikeLevel(1, pressure) * graftPushTop(exciter, hardness, MIDDLE_C_HZ, set.sampleRate)
  if (exciter === MALLET) {
    const long = graftMalletPeriods(hardness, MIDDLE_C_HZ, set.sampleRate)
    return periods < long ? full * (0.5 - 0.5 * Math.cos((2 * Math.PI * periods) / long)) : 0
  }
  const slow = GRAFT_PICK_SLOW
  const fast = graftPickFast(hardness, MIDDLE_C_HZ, set.sampleRate)
  const shape = (Math.exp(-periods / slow) - Math.exp(-periods / fast)) / (slow - fast)
  return (full * shape) / graftPickPeak(slow, fast)
}

/** The push as a line across its box, from `from` pixels in to `to`. */
function graftPushPath(
  ctx: CanvasRenderingContext2D,
  set: GraftSetting,
  wander: number,
  box: Box,
  to: number,
): void {
  const foot = box.y + box.h
  // A hard mallet's push is under a pixel long: it is walked finely enough to find its top.
  const step = set.exciter < MALLET ? 1 : 0.25
  ctx.beginPath()
  ctx.moveTo(box.x, foot)
  for (let d = 0; d <= to; d += step)
    ctx.lineTo(box.x + d, foot - 0.8 * box.h * graftPushAt(set, wander, d, box.w))
}

/** The share a note must have to be among the `most` loudest of `shares`, 0 while there are no more than that. */
function loudestKept(shares: readonly number[], sorted: number[], most: number): number {
  sorted.length = 0
  for (const share of shares) if (share > 0) sorted.push(share)
  if (sorted.length <= most) return 0
  sorted.sort((a, b) => b - a)
  return sorted[most - 1]
}

/**
 * `Graft::note_on`: a key struck again while it is still down is a hand on
 * the old note. The seconds since that happened to note `index`, null if it
 * did not.
 */
export function graftChoked(notes: readonly DisplayNote[], index: number): number | null {
  const note = notes[index]
  for (let later = index + 1; later < notes.length; later++) {
    const again = notes[later]
    if (again.id === note.id && (note.released === null || note.released < again.age))
      return again.age
  }
  return null
}

/**
 * A note's age is read a little after the time of its frame (a fifth of a
 * millisecond to four, and a whole frame's 33 ms when one is slow), so
 * `frame.now - note.age` names its start that much early, and differently on
 * every frame. Within this much of one another two such times are the same
 * moment.
 */
export const MET_SLACK_SEC = 0.05

/**
 * What a display keeps of the notes it has met, for a knob the device reads
 * only when a note starts: what the knob said then is decided once, on the
 * frame a note is first met, and kept by the note's id and the start it had
 * on that frame. Asked again on every frame, a note that began close to a
 * turn of the knob would fall on one side of it or the other by how late its
 * age happened to be read.
 */
export interface Met {
  id: number[]
  start: number[]
  kind: number[]
  live: boolean[]
  /** What the knob says now, and the time of the last frame on which it still said something else. */
  now: number
  since: number
}

export const metNone = (): Met => ({
  id: [],
  start: [],
  kind: [],
  live: [],
  now: -1,
  since: -Infinity,
})

/** The knob as this frame finds it. A turn of it happened at some moment since the frame before. */
export function metKnob(met: Met, kind: number, now: number, dt: number): void {
  if (kind === met.now) return
  met.since = met.now < 0 ? -Infinity : now - Math.max(dt, 0)
  met.now = kind
}

/**
 * What the knob said when `note` began: kept, if the note has been met, by
 * its id and the nearest start within the slack. A note met for the first
 * time began with what the knob says now, unless it began before the knob's
 * last turn: then with something else, and -1 comes back.
 */
export function metKind(met: Met, note: Pick<DisplayNote, 'id' | 'age'>, now: number): number {
  const start = now - note.age
  let found = -1
  let off = MET_SLACK_SEC
  for (let i = 0; i < met.id.length; i++) {
    if (met.id[i] !== note.id || Math.abs(met.start[i] - start) > off) continue
    found = i
    off = Math.abs(met.start[i] - start)
  }
  if (found < 0) {
    found = met.id.length
    met.id.push(note.id)
    met.start.push(start)
    met.kind.push(start < met.since - MET_SLACK_SEC ? -1 : met.now)
  }
  met.live[found] = true
  return met.kind[found]
}

/** The end of a frame: the notes that were not asked after on it are over, and forgotten. */
export function metKeep(met: Met): void {
  let kept = 0
  for (let i = 0; i < met.id.length; i++) {
    if (!met.live[i]) continue
    met.id[kept] = met.id[i]
    met.start[kept] = met.start[i]
    met.kind[kept] = met.kind[i]
    kept++
  }
  met.id.length = met.start.length = met.kind.length = kept
  met.live.length = kept
  met.live.fill(false)
}

interface GraftState {
  set: GraftSetting
  work: GraftWork
  /** At rest, on middle C: the seconds each partial rings, and how strongly each is fed, in dB. */
  rest: Float32Array
  fed: Float32Array
  /** Every note's partials in dB, sixteen places a note; each note's loudest as a share; how far each partial is lit. */
  db: Float32Array
  shares: number[]
  sorted: number[]
  lit: Float32Array
  /** How far each of a body's first partials moves it on this frame, and a place on it. */
  mix: Float32Array
  at: [number, number]
  /** The crossing the knobs choose (exciter times four, and the body), and the one each note began with: a note keeps its two. */
  met: Met
  /** How far the breath or bow of a key that is down has come up, 0 for none; the seconds since the newest strike. */
  acting: number
  struck: number
}

function graftRead(view: DisplayView, sampleRate: number, into: GraftSetting): GraftSetting {
  into.exciter = clamp(Math.round(view.value('exciter')), 0, 3)
  into.body = clamp(Math.round(view.value('body')), 0, 3)
  into.pressure = clamp(view.value('pressure'), 0, 1)
  into.position = clamp(view.value('position'), 0, 1)
  into.bright = clamp(view.value('bright'), 0, 1)
  into.decay = Math.max(view.value('decay'), 0.01)
  into.air = clamp(view.value('air'), 0, 1)
  into.swell = Math.max(view.value('swell'), 0.001)
  into.release = Math.max(view.value('release'), 0.001)
  into.width = clamp(view.value('width'), 0, 1)
  into.sampleRate = sampleRate
  return into
}

const graftSetting = (): GraftSetting => ({
  exciter: 0,
  body: 0,
  pressure: 0.5,
  position: 0.35,
  bright: 0.5,
  decay: 3,
  air: 0.25,
  swell: 0.12,
  release: 1.2,
  width: 0.6,
  sampleRate: 48000,
})

/** How thick a partial is drawn, from how strongly it is fed: 40 dB under the body's full swing it is a hair. */
const graftFedShare = (db: number): number => clamp(1 + db / 40, 0, 1)

/** How wide the partials' sticks may be where they stand so close, and how wide stick `k` is. */
const graftStickMost = (sticks: Box): number =>
  clamp(((sticks.w - 8) / (GRAFT_RATIO_MOST - 1)) * 0.45, 1.5, 3.5)

/**
 * The lines one partial is drawn as, from the foot up to `reach` of its
 * length: one stick, or for a bowl the two halves of its pair side by side,
 * further apart the faster they beat and the second the thinner.
 */
function graftStick(
  frame: Paint,
  sticks: Box,
  body: number,
  k: number,
  long: number,
  reach: number,
  width: number,
  colour: string,
  alpha: number,
): void {
  const x = graftStickX(graftRatios(body)[k], sticks)
  const foot = sticks.y + sticks.h
  const top = foot - long * reach
  if (body !== BOWL) {
    rule(frame.ctx, x, foot, x, top, { colour, width, alpha })
    return
  }
  const apart = 1.1 + 0.25 * k + width / 2
  rule(frame.ctx, x - apart, foot, x - apart, top, { colour, width, alpha })
  rule(frame.ctx, x + apart, foot, x + apart, top, {
    colour,
    width: Math.max(0.75, width * GRAFT_MATE),
    alpha,
  })
}

/** The instrument at rest: the body, its partials as the knobs leave them, the push and where its notes stand. */
function graftRest(frame: DisplayFrame<GraftState>, parts: GraftParts, wander: number): void {
  const { ctx, colours, state } = frame
  const { set, work } = state
  const { body: box, push, sticks, stage, foot } = parts
  const { body } = set
  const driven = set.exciter < MALLET
  const count = graftRatios(body).length
  const base = sticks.y + sticks.h

  // The scale of seconds, said in the gutter at the left.
  for (const seconds of [1, 10]) {
    const y = base - graftLength(seconds) * sticks.h
    rule(ctx, sticks.x - 1, y, sticks.x + sticks.w, y, { colour: colours.ink, alpha: INK.grid })
    text(frame, `${seconds} s`, sticks.x - 4, y + 3, { align: 'right' })
  }
  rule(ctx, sticks.x - 1, base, sticks.x + sticks.w, base, { colour: colours.ink, alpha: INK.rule })

  // The partials on middle C: each as long as it rings left alone, as thick as a full key feeds it.
  graftPartialSeconds(
    body,
    MIDDLE_C_HZ,
    graftRingSeconds(MIDDLE_C_HZ, set.decay, set.release, driven, false),
    set.bright,
    set.sampleRate,
    work.held,
    work.loop,
  )
  for (let k = 0; k < count; k++)
    state.fed[k] = gainToDb(graftFed(set, MIDDLE_C_HZ, 1, k, work.held))
  graftPartialSeconds(
    body,
    MIDDLE_C_HZ,
    set.decay,
    set.bright,
    set.sampleRate,
    state.rest,
    work.loop,
  )
  const most = graftStickMost(sticks)
  for (let k = 0; k < count; k++) {
    if (state.rest[k] <= 0) continue
    const strong = graftFedShare(state.fed[k])
    graftStick(
      frame,
      sticks,
      body,
      k,
      graftLength(state.rest[k]) * sticks.h,
      1,
      lerp(0.75, most, strong),
      colours.ink,
      lerp(0.3, 0.75, strong),
    )
  }

  // Release: the hand laid on it. No partial of a key that is up rings on past this line.
  if (set.release < set.decay) {
    const y = base - graftLength(set.release) * sticks.h
    rule(ctx, sticks.x - 1, y, sticks.x + sticks.w, y, {
      colour: colours.ink,
      alpha: INK.text,
      dash: [2, 2],
    })
  }

  graftBody(frame, body, box)

  // The push in time: a swell that is held, or one blow.
  const floor = push.y + push.h
  graftPushPath(ctx, set, wander, push, push.w)
  ctx.lineTo(push.x + push.w, floor)
  ctx.closePath()
  filled(ctx, colours.ink, INK.fill)
  graftPushPath(ctx, set, wander, push, push.w)
  inked(ctx, colours.ink, 1.25, 1)
  rule(ctx, push.x, floor, push.x + push.w, floor, { colour: colours.ink, alpha: INK.rule })

  // Between the speakers: the two ranks of strings or pipes, the ends of the row of bars, the two halves of a bowl's pairs.
  const middle = foot.x + foot.w / 2
  const reach = ((body === BOWL ? 0.75 : body === BAR ? 0.4 : 0.35) * set.width * foot.w) / 2
  rule(ctx, middle - reach, stage, middle + reach, stage, { colour: colours.ink, alpha: INK.back })
  for (const side of [-1, 1]) {
    const x = middle + side * reach
    rule(ctx, x, stage - 2, x, stage + 2, { colour: colours.ink, alpha: INK.text })
  }
}

/**
 * A note's motion on the body, as large as it is loud: the body's own shapes
 * for its first partials, each as strong as it stands against the loudest
 * and swinging at a pace the eye can follow (the pitch itself is far too
 * fast), so a dull body settles into its lowest shape as the others die.
 */
function graftMoved(
  frame: DisplayFrame<GraftState>,
  box: Box,
  note: DisplayNote,
  share: number,
  at: number,
): void {
  const { ctx, colours, state } = frame
  const { body } = state.set
  const ratios = graftRatios(body)
  const moving = Math.min(ratios.length, GRAFT_MOVING)
  let best = GRAFT_SILENT_DB
  for (let k = 0; k < ratios.length; k++) best = Math.max(best, state.db[at + k])
  const pace = 2.2 + ((note.frequency * 0.37) % 1.3)
  let power = 0
  for (let k = 0; k < moving; k++) {
    const under = state.db[at + k] - best
    const part = under > -50 ? Math.pow(10, 0.03 * under) : 0
    power += part * part
    state.mix[k] =
      part *
      Math.cos(
        2 * Math.PI * pace * Math.pow(ratios[k], 0.55) * frame.now + note.frequency * (k + 1),
      )
  }
  const size = Math.pow(share, 0.7) / Math.max(1, 1.2 * Math.sqrt(power))
  const row = GRAFT_STEPS + 1

  if (body === BOWL) {
    // The wall flexes most at the rim: both rims out and in for a mode with an even count of
    // nodes round the rim, the two together to one side for an odd one.
    ctx.beginPath()
    for (let i = 0; i <= GRAFT_STEPS; i++) {
      const s = (2 * i) / GRAFT_STEPS - 1
      let moved = 0
      for (let k = 0; k < moving; k++)
        moved += state.mix[k] * Math.pow(Math.abs(s), (k + 2) / 2) * (k & 1 ? 1 : Math.sign(s))
      graftBowlAt(box, s, state.at)
      if (i === 0) ctx.moveTo(state.at[0] + 4.5 * size * moved, state.at[1])
      else ctx.lineTo(state.at[0] + 4.5 * size * moved, state.at[1])
    }
    inked(ctx, colours.accent, 1.75, 1)
    return
  }
  const shapes = GRAFT_SHAPES[body]
  const movedAt = (i: number): number => {
    let moved = 0
    for (let k = 0; k < moving; k++) moved += state.mix[k] * shapes[k * row + i]
    return moved * size
  }
  const xAt = (i: number): number => box.x + (i / GRAFT_STEPS) * box.w
  if (body === PIPE) {
    // The air in the pipe: its swing to either side of the middle of the bore.
    const half = (box.h - 2) / 2
    const reach = Math.max(1, half - 1.5)
    ctx.beginPath()
    for (let i = 0; i <= GRAFT_STEPS; i++) {
      if (i === 0) ctx.moveTo(xAt(i), box.y + half - reach * movedAt(i))
      else ctx.lineTo(xAt(i), box.y + half - reach * movedAt(i))
    }
    for (let i = GRAFT_STEPS; i >= 0; i--) ctx.lineTo(xAt(i), box.y + half + reach * movedAt(i))
    ctx.closePath()
    filled(ctx, colours.accent, 0.2)
    inked(ctx, colours.accent, 1.25, 1)
    return
  }
  const rest = body === BAR ? box.y + GRAFT_BAR_THICK / 2 : box.y
  const reach = body === BAR ? 4 : Math.min(6, box.h * 0.42)
  ctx.beginPath()
  for (let i = 0; i <= GRAFT_STEPS; i++) {
    if (i === 0) ctx.moveTo(xAt(i), rest + reach * movedAt(i))
    else ctx.lineTo(xAt(i), rest + reach * movedAt(i))
  }
  inked(ctx, colours.accent, body === BAR ? 2.25 : 1.75, 1)
}

/**
 * The notes that sound: each moves the body, lights the partials it has and
 * stands between the speakers. What the exciter is doing is left in the
 * state (`acting`, `struck`); the last note that sounds comes back.
 */
function graftPlayed(frame: DisplayFrame<GraftState>, parts: GraftParts): DisplayNote | null {
  const { ctx, colours, state, notes } = frame
  const { set } = state
  const { body: box, push, sticks, stage, foot } = parts
  const { body } = set
  const driven = set.exciter < MALLET
  const count = graftRatios(body).length
  state.acting = 0
  state.struck = Infinity
  state.lit.fill(0)
  if (state.db.length < notes.length * GRAFT_PARTIALS_MOST)
    state.db = new Float32Array(notes.length * GRAFT_PARTIALS_MOST * 2)

  state.shares.length = notes.length
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]
    state.shares[i] = 0
    // Exciter and Body are read when a note starts: one that began with another crossing is not of this picture.
    if (metKind(state.met, note, frame.now) !== state.met.now) continue
    const choked = graftChoked(notes, i)
    const at = i * GRAFT_PARTIALS_MOST
    graftNoteDb(set, note, choked, state.work, state.db, at)
    let best = GRAFT_SILENT_DB
    for (let k = 0; k < count; k++) best = Math.max(best, state.db[at + k])
    const share = shareOfDb(best)
    // A key that is down under breath or bow has a note of the device before it can be heard.
    const coming = driven && note.released === null && choked === null
    state.shares[i] = share >= DONE ? share : coming ? DONE / 2 : 0
  }
  // The device has ten notes and gives the quietest to a new key: no more than that are lit.
  const least = loudestKept(state.shares, state.sorted, GRAFT_VOICES)

  const middle = foot.x + foot.w / 2
  let said: DisplayNote | null = null
  for (let i = 0; i < notes.length; i++) {
    const share = state.shares[i]
    if (share <= 0 || share < least) continue
    const note = notes[i]
    const at = i * GRAFT_PARTIALS_MOST
    said = note
    for (let k = 0; k < count; k++)
      state.lit[k] = Math.max(state.lit[k], shareOfDb(state.db[at + k]))
    if (driven && note.released === null && graftChoked(notes, i) === null) {
      // The breath or bow of a key that is down, as far as it has come up; a mark rides the swell.
      state.acting = Math.max(state.acting, graftSwellLevel(note.age, set.swell))
      const d = graftPushRamp(set.swell, push.w) * Math.min(1, note.age / set.swell)
      const level = graftPushAt(set, 0, d, push.w)
      dot(ctx, push.x + d, push.y + push.h - 0.8 * push.h * level, 2, colours.accent)
    }
    if (!driven) state.struck = Math.min(state.struck, note.age)
    if (share < DONE) continue
    graftMoved(frame, box, note, share, at)
    // Where it stands between the speakers; a bowl's pairs lean to both sides at once.
    const hz = clamp(note.frequency, GRAFT_LOW_HZ, GRAFT_HIGH_HZ)
    for (const side of body === BOWL ? [-0.75 * set.width, 0.75 * set.width] : [0]) {
      const x = middle + ((graftPan(body, hz, set.width) + side) * foot.w) / 2
      rule(ctx, x, stage - 2, x, stage + 2, {
        colour: colours.accent,
        width: 2,
        alpha: 0.4 + 0.6 * share,
      })
    }
  }

  // The partials that sound, each lit as far up its length as it is loud.
  const most = graftStickMost(sticks)
  for (let k = 0; k < count; k++) {
    if (state.lit[k] < DONE || state.rest[k] <= 0) continue
    const strong = graftFedShare(state.fed[k])
    graftStick(
      frame,
      sticks,
      body,
      k,
      graftLength(state.rest[k]) * sticks.h,
      state.lit[k],
      lerp(0.75, most, strong) + 0.75,
      colours.accent,
      1,
    )
  }
  return said
}

const graft = plateDisplay<GraftState>({
  place: 'window',
  columns: 2,
  params: [
    'exciter',
    'body',
    'pressure',
    'position',
    'bright',
    'decay',
    'air',
    'swell',
    'release',
    'wander',
    'width',
  ],
  live: { signal: true, notes: true },
  info: 'What sets the body going stands on it where Position puts it, over the partials of the body, each as long as it rings; the line at the top right is the push in time. A note moves the body and lights its partials. Drag the handles to set Position and Decay.',
  init: () => ({
    set: graftSetting(),
    work: graftWork(),
    rest: new Float32Array(GRAFT_PARTIALS_MOST),
    fed: new Float32Array(GRAFT_PARTIALS_MOST),
    db: new Float32Array(GRAFT_VOICES * GRAFT_PARTIALS_MOST),
    shares: [],
    sorted: [],
    lit: new Float32Array(GRAFT_PARTIALS_MOST),
    mix: new Float32Array(GRAFT_MOVING),
    at: [0, 0],
    met: metNone(),
    acting: 0,
    struck: Infinity,
  }),
  draw(frame) {
    const { colours, state } = frame
    ground(frame)
    const set = graftRead(frame, frame.sampleRate, state.set)
    const wander = clamp(frame.value('wander'), 0, 1)
    const parts = graftParts(frame)
    const { exciter, body } = set

    metKnob(state.met, exciter * 4 + body, frame.now, frame.dt)

    graftRest(frame, parts, wander)
    const said = graftPlayed(frame, parts)
    metKeep(state.met)

    // What sets it going, where it meets the body: in the ink while it waits, in the accent while it acts.
    const [x, y] = graftContact(body, set.position, parts.body, state.at)
    const driven = exciter < MALLET
    const weight = driven ? set.pressure : graftHardness(1, set.pressure)
    const size = graftExciterSize(parts)
    if (driven) {
      const slide = state.acting > 0 ? 3 * Math.sin(2 * Math.PI * 0.8 * frame.now) : 0
      const flow = state.acting > 0 ? frame.now * 30 : 0
      graftExciter(frame, exciter, x, y, size, weight, set.air, colours.ink, 1, 0, slide, flow)
      if (state.acting > 0)
        graftExciter(
          frame,
          exciter,
          x,
          y,
          size,
          weight,
          set.air,
          colours.accent,
          lerp(0.45, 1, state.acting),
          0,
          slide,
          flow,
        )
    } else {
      // A mallet waits over the body and a pick a little off it; a strike is on it, and lifts.
      const waits = exciter === MALLET ? 3 : 1.5
      const since = clamp(state.struck / GRAFT_FLASH_SEC, 0, 1)
      graftExciter(frame, exciter, x, y, size, weight, set.air, colours.ink, 1, waits * since)
      if (since < 1) {
        graftExciter(
          frame,
          exciter,
          x,
          y,
          size,
          weight,
          set.air,
          colours.accent,
          1 - since,
          waits * since,
        )
        graftPushPath(frame.ctx, set, 0, parts.push, parts.push.w)
        inked(frame.ctx, colours.accent, 1.5, 1 - since)
      }
    }

    levelFoot(frame, parts.foot, outShare(frame))

    // The words: the crossing, and how long the last note's lowest partial rings left alone (middle C while none sounds).
    const hz = clamp(said ? said.frequency : MIDDLE_C_HZ, GRAFT_LOW_HZ, GRAFT_HIGH_HZ)
    text(frame, `${GRAFT_EXCITERS[exciter]} ${GRAFT_BODIES[body]}`, 5, 12)
    text(
      frame,
      `${pitchName(hz)} ${secondsText(set.decay * graftTrack(hz))}`,
      frame.width - 5,
      12,
      {
        align: 'right',
      },
    )

    for (const point of graftHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: graftHandles,
})

function graftHandles(view: DisplayView): DisplayHandle[] {
  const { body: box, sticks } = graftParts(view)
  const body = clamp(Math.round(view.value('body')), 0, 3)
  const [x, y] = graftContact(body, clamp(view.value('position'), 0, 1), box, [0, 0])
  const base = sticks.y + sticks.h
  return [
    {
      key: 'position',
      name: 'Position',
      x,
      y,
      drag: (toX) => {
        if (body === BOWL) {
          // Back along the wall from the rim: the place whose x this is.
          const out = clamp((box.x + box.w / 2 - toX) / graftBowlReach(box), 0, 1)
          const turn = Math.asin(Math.pow(out, GRAFT_BOWL_ROUND / 2))
          return { position: clamp(1 - (2 * turn) / Math.PI, 0, 1) }
        }
        const along = (toX - box.x) / box.w
        const from = graftAlong(body, 0)
        return { position: clamp((along - from) / (graftAlong(body, 1) - from), 0, 1) }
      },
      reset: () => ({ position: view.spec('position')?.default ?? 0.35 }),
    },
    {
      key: 'decay',
      name: 'Decay',
      x: graftStickX(1, sticks),
      y: base - graftLength(view.value('decay')) * sticks.h,
      drag: (_x, toY) => ({ decay: graftSecondsOf(clamp((base - toY) / sticks.h, 0, 1)) }),
      reset: () => ({ decay: view.spec('decay')?.default ?? 3 }),
    },
  ]
}

// --- Afterglow ---------------------------------------------------------------

/** `afterglow.h`, `Source`: what a key is struck as. */
const AFTERGLOW_SOURCES = ['Felt', 'Bell', 'Pluck', 'Glass'] as const
/** `afterglow.h`, `source_table`: where a source's partials sit, how strong each is at the hit, and how it rings. */
interface AfterglowSource {
  ratio: readonly number[]
  weight: readonly number[]
  stiffness: number
  damping: number
}
const AFTERGLOW_TABLES: readonly AfterglowSource[] = [
  {
    ratio: [1, 2, 3, 4, 5, 6, 7, 8],
    weight: [1, 0.5, 0.28, 0.17, 0.11, 0.07, 0.045, 0.03],
    stiffness: 4e-4,
    damping: 0.5,
  },
  {
    ratio: [0.5, 1, 2, 3.01, 4.17, 5.43, 6.8, 8.21],
    weight: [0.3, 0.8, 1, 0.55, 0.45, 0.3, 0.2, 0.12],
    stiffness: 0,
    damping: 0.06,
  },
  {
    ratio: [1, 2, 3, 4, 5, 6, 7, 8],
    weight: [1, 0.75, 0.42, 0.094, 0.14, 0.23, 0.2, 0.09],
    stiffness: 6e-5,
    damping: 0.3,
  },
  {
    ratio: [1, 2.32, 4.25, 6.63, 9.38, 12.5, 15.95, 19.75],
    weight: [1, 0.35, 0.16, 0.08, 0.04, 0.02, 0.012, 0.006],
    stiffness: 0,
    damping: 0.12,
  },
]
/** `afterglow.h`, `kPartials`, `kHaloPartials`, `kMaxVoices`: the partials of a key, those with a halo, the keys at once. */
const AFTERGLOW_PARTIALS = 8
const AFTERGLOW_HALOS = 4
const AFTERGLOW_VOICES = 16
/** `afterglow.h`, `kMinHz`, `kMaxHz`, `kMiddleC`, `kTopOfBand`, `kFloor`, `kSamePitch`. */
const AFTERGLOW_LOW_HZ = 16
const AFTERGLOW_HIGH_HZ = 12000
const AFTERGLOW_MIDDLE_C = 261.6256
const AFTERGLOW_BAND = 0.45
const AFTERGLOW_FLOOR = 1e-4
const AFTERGLOW_SAME = 1.003
/** `afterglow.h`, `kTouch`: the share of its glow the shortest touch of a key earns. */
const AFTERGLOW_TOUCH = 0.3
/** `Afterglow::start`, `pace`: a pair beats at 0.7 to 1.6 of the rate, by chance; this is the middle. */
const AFTERGLOW_PACE = 1.15

const afterglowSource = (source: number): AfterglowSource =>
  AFTERGLOW_TABLES[clamp(Math.round(source), 0, AFTERGLOW_TABLES.length - 1)]

/** `Afterglow::partial_ratio`: a partial's ratio to the played note, stretched as a stiff string's, the partial at 1 left on the note. */
export function afterglowRatio(source: number, k: number): number {
  const table = afterglowSource(source)
  const base = table.ratio[k]
  return base * Math.sqrt((1 + table.stiffness * base * base) / (1 + table.stiffness))
}

/** `Afterglow::note_on`: the pitches it plays. */
export const afterglowHz = (hz: number, sampleRate: number): number =>
  clamp(hz, AFTERGLOW_LOW_HZ, Math.min(AFTERGLOW_HIGH_HZ, 0.4 * sampleRate))

/** `Afterglow::start`, `count`: how many of its source's partials a note has, those under 0.45 of the sample rate from the lowest up. */
export function afterglowCount(source: number, hz: number, sampleRate: number): number {
  let count = 0
  while (
    count < AFTERGLOW_PARTIALS &&
    hz * afterglowRatio(source, count) < AFTERGLOW_BAND * sampleRate
  )
    count++
  return count
}

/** `Afterglow::start`, `played`: the partial that is the played note itself, which Evolve leaves alone; -1 for none. */
export const afterglowPlayed = (source: number): number => afterglowSource(source).ratio.indexOf(1)

/** `Afterglow::start`, `damp`: a partial's decay rate against the lowest partial's. */
export const afterglowDamp = (source: number, k: number): number =>
  1 + afterglowSource(source).damping * (afterglowRatio(source, k) / afterglowRatio(source, 0) - 1)

/** `Afterglow::start`, `key_decay`: Decay's multiple for a register, 1 at middle C and longer under it. */
export const afterglowKeyDecay = (hz: number): number =>
  clamp(Math.pow(AFTERGLOW_MIDDLE_C / hz, 0.3), 0.45, 1.6)

/** `Afterglow::weigh`, `amp`: a note's level for its velocity, against the hardest strike. */
export const afterglowStrength = (gain: number): number => 0.25 + 0.75 * clamp(gain, 0, 1)

/** `Afterglow::apply`: Strike and Glow are levels as the square of their knobs. */
export const afterglowKnob = (knob: number): number => clamp(knob, 0, 1) * clamp(knob, 0, 1)

/**
 * `Afterglow::weigh`: the weights of a note's partials in the strike, and in
 * the glow, which is the strike as it stands a moment after the hit at unit
 * power. Low notes and hard strikes are brighter. Returns how many there are.
 */
export function afterglowWeights(
  source: number,
  hz: number,
  gain: number,
  sampleRate: number,
  strike: Float32Array,
  glow: Float32Array,
): number {
  const table = afterglowSource(source)
  const count = afterglowCount(source, hz, sampleRate)
  const keyTilt = clamp(0.5 * Math.log2(AFTERGLOW_MIDDLE_C / hz), -0.5, 0.8)
  const velocityTilt = 0.6 * (gain - 0.7)
  let sum = 0
  let power = 0
  let glowPower = 0
  strike.fill(0)
  glow.fill(0)
  for (let k = 0; k < count; k++) {
    const ratio = afterglowRatio(source, k)
    const weight = table.weight[k] * Math.pow(ratio, keyTilt)
    strike[k] = weight * Math.pow(ratio, velocityTilt)
    // The strike 0.3 s after the hit, of a strike that rings 3 s.
    glow[k] = strike[k] * Math.pow(10, -0.3 * afterglowDamp(source, k))
    sum += weight
    power += weight * weight
    glowPower += glow[k] * glow[k]
  }
  // Halfway between unit power and unit sum, so a note of many partials is neither louder nor peakier than a plain one.
  const strikeScale = 1 / Math.sqrt(sum * Math.sqrt(power))
  const glowScale = 1 / Math.sqrt(glowPower)
  for (let k = 0; k < count; k++) {
    strike[k] *= strikeScale
    glow[k] *= glowScale
  }
  return count
}

/**
 * `Afterglow::retone`: Tone tilts the glow's weights about the played note,
 * at unit power, into `into`. Returns the trim that levels a glow spread over
 * many partials with one that is almost a sine.
 */
export function afterglowToned(
  source: number,
  glow: Float32Array,
  count: number,
  tone: number,
  into: Float32Array,
): number {
  const tilt = 1.5 * (2 * tone - 1)
  let sum = 0
  let power = 0
  into.fill(0)
  for (let k = 0; k < count; k++) {
    into[k] = glow[k] * Math.pow(afterglowRatio(source, k), tilt)
    sum += into[k]
    power += into[k] * into[k]
  }
  if (!(power > 0)) return 1
  const scale = 1 / Math.sqrt(power)
  for (let k = 0; k < count; k++) into[k] *= scale
  return 1 / Math.sqrt(sum * scale)
}

/** `Afterglow::tune_decay`: a partial's strike `seconds` after the hit, 1 at the hit and over at the floor; `decay` is the lowest partial's ring. */
export function afterglowRing(seconds: number, damp: number, decay: number): number {
  const ring = Math.pow(10, (-3 * Math.max(seconds, 0) * damp) / decay)
  return ring < AFTERGLOW_FLOOR ? 0 : ring
}

const risen = (share: number): number => {
  const b = clamp(share, 0, 1)
  return b * b * (3 - 2 * b)
}

/**
 * `Afterglow::control`, the bloom stage: the glow a key let go `share` of the
 * way through Bloom goes on to. In power it is the share it was held for over
 * what the shortest touch gets, and never less than the glow it carried.
 */
export const afterglowEarned = (share: number, carry = 0): number =>
  Math.max(
    Math.sqrt(
      AFTERGLOW_TOUCH * AFTERGLOW_TOUCH +
        (1 - AFTERGLOW_TOUCH * AFTERGLOW_TOUCH) * clamp(share, 0, 1),
    ),
    carry,
  )

/**
 * `Afterglow::control`: the glow's envelope `age` seconds after the strike of
 * a key let go `released` seconds ago (null while it is down). It rises over
 * Bloom from `from` (the glow its key already had), holds with the key and
 * falls 60 dB per Fade; a key let go on the way up rises on to what it earned
 * and fades from the end of Bloom.
 */
export function afterglowEnv(
  age: number,
  released: number | null,
  bloom: number,
  fade: number,
  from = 0,
): number {
  const held = released === null ? Infinity : Math.max(age - released, 0)
  let env: number
  if (held >= bloom) {
    if (age < bloom) return from + (1 - from) * risen(age / bloom)
    env = Math.pow(10, (-3 * (released ?? 0)) / fade)
  } else {
    const at = risen(held / bloom)
    const stood = from + (1 - from) * at
    const earn = afterglowEarned(held / bloom, Math.min(from, 1))
    if (age < bloom)
      return stood + ((earn - stood) * (risen(age / bloom) - at)) / Math.max(1 - at, 1e-6)
    env = earn * Math.pow(10, (-3 * (age - bloom)) / fade)
  }
  return env < AFTERGLOW_FLOOR ? 0 : env
}

/**
 * `Afterglow::tune_drift`: the Hz at which the two halves of a partial's pair
 * beat. 3 Hz for the lowest partial with Drift at 1, as the square of the
 * knob, faster up the partials and at a pace of the note's own.
 */
export const afterglowBeatHz = (drift: number, ratio: number, lowest: number, pace = 1): number =>
  3 * drift * drift * pace * Math.pow(ratio / lowest, 0.25)

/** `Afterglow::start`, `beat_re`: the half angle between the halves `seconds` into a note: a quarter turn apart at the hit, and closing. */
export const afterglowBeatAngle = (seconds: number, beatHz: number): number =>
  Math.PI * (beatHz * seconds - 0.25)

/** Equal power places a little to either side of the middle, 1 and 1 with Width at 0. */
function places(lean: number, width: number, into: [number, number]): [number, number] {
  const place = ((1 + lean * width) * Math.PI) / 4
  into[0] = width > 0 ? Math.SQRT2 * Math.cos(place) : 1
  into[1] = width > 0 ? Math.SQRT2 * Math.sin(place) : 1
  return into
}
const PLACE: [number, number] = [1, 1]

/**
 * `Afterglow::control`: the level of a partial's pair in the left and in the
 * right, against one sine of its power, at half angle `angle`. The weaker
 * half's share of the power grows with Drift to a third; the halves lean to
 * opposite sides with Width, and `side` says which way round.
 */
export function afterglowPair(
  angle: number,
  drift: number,
  width: number,
  side: number,
  into: [number, number],
): [number, number] {
  const far = Math.sqrt(0.33 * drift)
  const near = Math.sqrt(1 - 0.33 * drift)
  const [a, b] = places(0.6, width, PLACE)
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const one = Math.hypot(c * (near * a + far * b), s * (near * a - far * b))
  const other = Math.hypot(c * (near * b + far * a), s * (near * b - far * a))
  into[0] = side > 0 ? one : other
  into[1] = side > 0 ? other : one
  return into
}

/**
 * `Afterglow::control`: the halo partial `k` puts an octave above itself, left
 * and right, against that partial's own glow. It beats twice as fast as the
 * pair under it, and a still one is as loud as a beating one is on average.
 */
export function afterglowHalo(
  angle: number,
  halo: number,
  drift: number,
  width: number,
  k: number,
  into: [number, number],
): [number, number] {
  const far = Math.sqrt(0.33 * drift)
  const near = Math.sqrt(1 - 0.33 * drift)
  const c = Math.cos(2 * angle)
  const s = Math.sin(2 * angle)
  const level = halo * Math.SQRT1_2 * Math.hypot((c - s) * (near + far), (s + c) * (near - far))
  const [a, b] = places(0.7, width, PLACE)
  into[0] = level * (k & 1 ? b : a)
  into[1] = level * (k & 1 ? a : b)
  return into
}

/**
 * `Afterglow::start`, `onto`: the partial an octave above partial `k`, where
 * the source has one (a string's second over its first, a bell's prime over
 * its hum): the halo is more of that partial. -1 where it has none.
 */
export function afterglowOnto(source: number, k: number, hz: number, sampleRate: number): number {
  let onto = -1
  if (k >= AFTERGLOW_HALOS) return onto
  for (let j = k + 1; j < AFTERGLOW_PARTIALS; j++) {
    const octave = afterglowRatio(source, j) / (2 * afterglowRatio(source, k))
    if (
      octave > 0.98 &&
      octave < 1.02 &&
      hz * afterglowRatio(source, j) < AFTERGLOW_BAND * sampleRate
    )
      onto = j
  }
  return onto
}

/** `Afterglow::start`, `made`: the lowest partial with no octave above it in the source, whose halo is a line of its own at twice its pitch; -1 for none. */
export function afterglowMade(source: number, hz: number, sampleRate: number): number {
  const most = Math.min(AFTERGLOW_HALOS, afterglowCount(source, hz, sampleRate))
  for (let k = 0; k < most; k++) {
    if (
      afterglowOnto(source, k, hz, sampleRate) < 0 &&
      2 * hz * afterglowRatio(source, k) < AFTERGLOW_BAND * sampleRate
    )
      return k
  }
  return -1
}

/**
 * `Afterglow::control`, Evolve: every partial but the played note's own moves
 * by `depth` (0.8 with the knob at 1) of its weight along a slow sine of its
 * own, `sines`, and the moved ones are brought back to the power they had.
 */
export function afterglowEvolved(
  toned: Float32Array,
  count: number,
  played: number,
  depth: number,
  sines: ArrayLike<number>,
  into: Float32Array,
): Float32Array {
  let power = 0
  let share = 0
  for (let k = 0; k < count; k++) {
    if (k === played) continue
    into[k] = toned[k] * (1 + depth * sines[k])
    power += into[k] * into[k]
    share += toned[k] * toned[k]
  }
  const even = power > 0 ? Math.sqrt(share / power) : 1
  for (let k = 0; k < count; k++) into[k] = k === played ? toned[k] : into[k] * even
  return into
}

/** What the knobs say, as the figures read them. */
export interface AfterglowSetting {
  source: number
  strike: number
  decay: number
  glow: number
  bloom: number
  fade: number
  tone: number
  halo: number
  evolve: number
  drift: number
  width: number
  sampleRate: number
}

/** One key's partials: what `Afterglow::start` and `weigh` set up for a pitch and a velocity. */
export interface AfterglowVoice {
  count: number
  /** Each partial's weight in the strike, its glow with Tone and the trim, its decay rate. */
  strike: Float32Array
  toned: Float32Array
  damp: Float32Array
  /** Where each partial's halo goes: a partial above it, or -1; and the partial that makes an octave of its own. */
  onto: Int8Array
  made: number
  /** The lowest partial's ring in seconds, and the note's level for its velocity. */
  ring: number
  amp: number
  glow: Float32Array
}

export const afterglowVoice = (): AfterglowVoice => ({
  count: 0,
  strike: new Float32Array(AFTERGLOW_PARTIALS),
  toned: new Float32Array(AFTERGLOW_PARTIALS),
  damp: new Float32Array(AFTERGLOW_PARTIALS),
  onto: new Int8Array(AFTERGLOW_PARTIALS),
  made: -1,
  ring: 1,
  amp: 1,
  glow: new Float32Array(AFTERGLOW_PARTIALS),
})

/** A key of this pitch and velocity under the knobs: its weights, decays and halos, into `voice`. */
export function afterglowStruck(
  set: AfterglowSetting,
  frequency: number,
  gain: number,
  voice: AfterglowVoice,
): AfterglowVoice {
  const { source, sampleRate } = set
  const hz = afterglowHz(frequency, sampleRate)
  voice.count = afterglowWeights(source, hz, gain, sampleRate, voice.strike, voice.glow)
  const trim = afterglowToned(source, voice.glow, voice.count, set.tone, voice.toned)
  for (let k = 0; k < AFTERGLOW_PARTIALS; k++) {
    voice.toned[k] *= trim
    voice.damp[k] = afterglowDamp(source, k)
    voice.onto[k] = k < voice.count ? afterglowOnto(source, k, hz, sampleRate) : -1
  }
  voice.made = afterglowMade(source, hz, sampleRate)
  voice.ring = set.decay * afterglowKeyDecay(hz)
  voice.amp = afterglowStrength(gain)
  return voice
}

/**
 * How loud each partial of a key is `age` seconds after its strike with its
 * glow at `env`, against the note's own level, into `into`; one place more
 * holds the halo that is a line of its own. The strike and the glow of a
 * partial turn together and beat at a pace nobody outside can know, so this
 * is their power, with the halo a partial is lent from below. Returns the
 * loudest.
 */
export function afterglowLevels(
  set: AfterglowSetting,
  voice: AfterglowVoice,
  age: number,
  env: number,
  into: Float32Array,
  at = 0,
): number {
  const strike = afterglowKnob(set.strike)
  const glow = afterglowKnob(set.glow) * env
  let most = 0
  for (let k = 0; k <= AFTERGLOW_PARTIALS; k++) into[at + k] = 0
  for (let k = 0; k < voice.count; k++) {
    const struck = strike * voice.strike[k] * afterglowRing(age, voice.damp[k], voice.ring)
    const held = glow * voice.toned[k]
    into[at + k] += struck * struck + held * held
    const lent = set.halo * held
    if (voice.onto[k] >= 0) into[at + voice.onto[k]] += lent * lent
    else if (k === voice.made) into[at + AFTERGLOW_PARTIALS] = lent * lent
  }
  for (let k = 0; k <= AFTERGLOW_PARTIALS; k++) {
    into[at + k] = Math.sqrt(into[at + k])
    most = Math.max(most, into[at + k])
  }
  return most
}

const samePitch = (a: number, b: number): boolean =>
  a <= b * AFTERGLOW_SAME && b <= a * AFTERGLOW_SAME

/**
 * `Afterglow::note_on` and `restrike`: one pitch has one voice. The note that
 * took note `index`'s voice by striking its pitch again, -1 while it is its own.
 */
export function afterglowAgain(notes: readonly DisplayNote[], index: number): number {
  for (let later = index + 1; later < notes.length; later++)
    if (samePitch(notes[later].frequency, notes[index].frequency)) return later
  return -1
}

/**
 * `Afterglow::restrike`: a key struck again blooms from where its glow
 * stands, as the new strike's level reads it. The glow each of `notes`
 * begins with, into `into`; 0 for a key that was dark.
 */
export function afterglowFrom(
  notes: readonly DisplayNote[],
  bloom: number,
  fade: number,
  into: number[],
): number[] {
  into.length = notes.length
  for (let i = 0; i < notes.length; i++) {
    into[i] = 0
    for (let j = i - 1; j >= 0; j--) {
      if (!samePitch(notes[j].frequency, notes[i].frequency)) continue
      const then = notes[j].age - notes[i].age
      const since = notes[j].released
      const gone = since === null ? null : since - notes[i].age
      const stood = afterglowEnv(
        then,
        gone !== null && gone >= 0 ? gone : null,
        bloom,
        fade,
        into[j],
      )
      into[i] = (stood * afterglowStrength(notes[j].gain)) / afterglowStrength(notes[i].gain)
      break
    }
  }
  return into
}

/** The time a row runs through, left to right: a quarter of a second in, time is drawn ever closer, so 0.3 s and 50 s both have room. */
const AFTERGLOW_NEAR_SEC = 0.25
const AFTERGLOW_FAR_SEC = 50
const AFTERGLOW_SPAN = Math.log(1 + AFTERGLOW_FAR_SEC / AFTERGLOW_NEAR_SEC)
const afterglowAlong = (seconds: number): number =>
  clamp(Math.log(1 + Math.max(seconds, 0) / AFTERGLOW_NEAR_SEC) / AFTERGLOW_SPAN, 0, 1)
const afterglowSecondsAt = (along: number): number =>
  AFTERGLOW_NEAR_SEC * (Math.exp(clamp(along, 0, 1) * AFTERGLOW_SPAN) - 1)

/** The velocity the picture at rest is struck with: the one `Afterglow::weigh` tilts nothing at. */
const AFTERGLOW_REST_GAIN = 0.7
/** A part thinner than this is too faint to draw: its shape ends in a point there, a little before it is silent. */
const AFTERGLOW_HAIR = 0.2
/** The rows of the picture: the eight partials and the halo that is a line of its own; and the three parts of a row. */
const AFTERGLOW_ROWS = AFTERGLOW_PARTIALS + 1
const WEDGE = 0
const LENS = 1
const AURA = 2

interface AfterglowParts {
  foot: Box
  /** The row of the highest partial is at the top of this box and the lowest at its bottom. */
  rows: Box
  /** The line of time under the rows, and the line the glow's handles ride over them. */
  rail: number
  top: number
  /** Half the thickness of the strongest partial at full level, at most. */
  reach: number
}

function afterglowParts(view: Size): AfterglowParts {
  const { width, height } = view
  const foot = { x: 4, y: height - 10, w: width - 8, h: 6 }
  const rail = foot.y - 12
  const top = 19
  const reach = clamp((rail - top) / 10, 2, 6)
  const first = top + 7
  const rows = { x: 9, y: first, w: width - 16, h: Math.max(rail - 2 - reach - first, 4) }
  return { foot, rows, rail, top, reach }
}

/** Where a partial's row lies: by its pitch, the source's lowest at the bottom and its highest at the top. */
function afterglowRowY(source: number, ratio: number, rows: Box): number {
  const low = afterglowRatio(source, 0)
  const high = afterglowRatio(source, AFTERGLOW_PARTIALS - 1)
  return rows.y + rows.h * (1 - Math.log(ratio / low) / Math.log(high / low))
}

const afterglowX = (seconds: number, rows: Box): number => rows.x + rows.w * afterglowAlong(seconds)

/** Half the thickness a level is drawn with: its root, so a partial a tenth as loud is still a third as thick. */
function afterglowThick(level: number, reach: number): number {
  const half = reach * Math.sqrt(clamp(level, 0, 1.5))
  return half < AFTERGLOW_HAIR ? 0 : half
}

interface AfterglowState {
  set: AfterglowSetting
  /** The key the picture at rest is of, and the key of a note that is played. */
  rest: AfterglowVoice
  voice: AfterglowVoice
  /** What the picture at rest was last worked out for and what this frame finds, and its edges: for every part of every row, how far it reaches up and down at each step. */
  seen: Float32Array
  fresh: Float32Array
  edges: Float32Array
  steps: number
  /** The strongest partial of the strike at rest, which every level is drawn against, and half its thickness at full level. */
  full: number
  reach: number
  /** A note's partials on this frame, and its path so far. */
  levels: Float32Array
  path: Float32Array
  moved: Float32Array
  sines: Float32Array
  raw: Float32Array
  pair: [number, number]
  /** The glow each note began with, each note's loudest partial as a share, and room to sort them. */
  from: number[]
  shares: number[]
  sorted: number[]
  /** The source the knob chooses, and the one each note was struck as: a note keeps its own. */
  met: Met
}

function afterglowRead(
  view: DisplayView,
  sampleRate: number,
  into: AfterglowSetting,
): AfterglowSetting {
  into.source = clamp(Math.round(view.value('source')), 0, 3)
  into.strike = clamp(view.value('strike'), 0, 1)
  into.decay = Math.max(view.value('decay'), 0.01)
  into.glow = clamp(view.value('glow'), 0, 1)
  into.bloom = Math.max(view.value('bloom'), 0.01)
  into.fade = Math.max(view.value('fade'), 0.01)
  into.tone = clamp(view.value('tone'), 0, 1)
  into.halo = clamp(view.value('halo'), 0, 1)
  into.evolve = clamp(view.value('evolve'), 0, 1)
  into.drift = clamp(view.value('drift'), 0, 1)
  into.width = clamp(view.value('width'), 0, 1)
  into.sampleRate = sampleRate
  return into
}

const afterglowSetting = (): AfterglowSetting => ({
  source: 0,
  strike: 0.8,
  decay: 4,
  glow: 0.65,
  bloom: 1.5,
  fade: 5,
  tone: 0.5,
  halo: 0.2,
  evolve: 0.4,
  drift: 0.3,
  width: 0.6,
  sampleRate: 48000,
})

const edgeAt = (part: number, row: number, side: number, steps: number): number =>
  ((part * AFTERGLOW_ROWS + row) * 2 + side) * steps

/**
 * The picture at rest: middle C held just as long as its glow takes to come
 * up, then let go. For every step of time the strike of each partial, its
 * glow and the halo over it, to the left (drawn upward) and to the right
 * (downward). The pace a pair beats at and the slow sine Evolve moves a
 * partial by are the note's own in the device; here each row has one that
 * stays, so the knobs can be read.
 */
function afterglowSpecimen(state: AfterglowState, parts: AfterglowParts): void {
  const { set, rest, moved, sines, pair, raw } = state
  const { rows } = parts
  const steps = Math.max(Math.floor(rows.w) + 1, 2)
  if (state.edges.length < 3 * AFTERGLOW_ROWS * 2 * steps)
    state.edges = new Float32Array(3 * AFTERGLOW_ROWS * 2 * steps)
  state.steps = steps
  const { edges } = state
  edges.fill(0)
  afterglowStruck(set, AFTERGLOW_MIDDLE_C, AFTERGLOW_REST_GAIN, rest)
  // Every level is drawn against the strongest partial of the strike, and no thicker than lets the closest rows be told apart at the hit.
  let full = 0
  for (let k = 0; k < rest.count; k++) full = Math.max(full, rest.strike[k])
  let reach = parts.reach
  for (let k = 0; k + 1 < rest.count; k++) {
    const gap =
      afterglowRowAt(set.source, k, -1, rows) - afterglowRowAt(set.source, k + 1, -1, rows)
    const both = Math.sqrt(rest.strike[k] / full) + Math.sqrt(rest.strike[k + 1] / full)
    reach = Math.min(reach, (1.1 * gap) / both)
  }
  reach = Math.max(reach, 1.5)
  state.full = full
  state.reach = reach
  const strike = afterglowKnob(set.strike) / full
  const glow = afterglowKnob(set.glow) / full
  const lowest = afterglowRatio(set.source, 0)
  const played = afterglowPlayed(set.source)
  for (let i = 0; i < steps; i++) {
    const seconds = afterglowSecondsAt(i / (steps - 1))
    const env = afterglowEnv(
      seconds,
      seconds < set.bloom ? null : seconds - set.bloom,
      set.bloom,
      set.fade,
    )
    for (let k = 0; k < rest.count; k++)
      sines[k] = Math.sin(2 * Math.PI * (speck(k + 3) + seconds / (6 + 13 * speck(k + 11))))
    afterglowEvolved(rest.toned, rest.count, played, 0.8 * set.evolve, sines, moved)
    for (let k = 0; k < rest.count; k++) {
      const side = k & 1 ? -1 : 1
      const ring = afterglowRing(seconds, rest.damp[k], rest.ring)
      const struck = ring >= 0.001 ? strike * rest.strike[k] * ring : 0
      edges[edgeAt(WEDGE, k, 0, steps) + i] = afterglowThick(
        struck * (1 + 0.2 * set.width * side),
        reach,
      )
      edges[edgeAt(WEDGE, k, 1, steps) + i] = afterglowThick(
        struck * (1 - 0.2 * set.width * side),
        reach,
      )
      const held = env >= 0.001 ? glow * env * moved[k] : 0
      const beat = afterglowBeatHz(set.drift, afterglowRatio(set.source, k), lowest, AFTERGLOW_PACE)
      const angle = afterglowBeatAngle(seconds, beat)
      afterglowPair(angle, set.drift, set.width, side, pair)
      const left = held * pair[0]
      const right = held * pair[1]
      raw[k * 2] = left
      raw[k * 2 + 1] = right
      edges[edgeAt(LENS, k, 0, steps) + i] = afterglowThick(left, reach)
      edges[edgeAt(LENS, k, 1, steps) + i] = afterglowThick(right, reach)
      // The halo this partial puts an octave up: on a partial that is there (worked out after this one), or on a row of its own.
      const onto = rest.onto[k] >= 0 ? rest.onto[k] : k === rest.made ? AFTERGLOW_PARTIALS : -1
      if (onto < 0 || !(set.halo > 0) || held <= 0) continue
      afterglowHalo(angle, set.halo, set.drift, set.width, k, pair)
      edges[edgeAt(AURA, onto, 0, steps) + i] = held * pair[0]
      edges[edgeAt(AURA, onto, 1, steps) + i] = held * pair[1]
    }
    // A halo and the glow it lies on add in power: the halo is drawn out to where the two reach together.
    for (let row = 0; row < AFTERGLOW_ROWS; row++) {
      for (let side = 0; side < 2; side++) {
        const at = edgeAt(AURA, row, side, steps) + i
        if (edges[at] <= 0) continue
        const own = row < rest.count ? raw[row * 2 + side] : 0
        edges[at] = afterglowThick(Math.hypot(edges[at], own), reach)
      }
    }
  }
}

/**
 * One part of one row as a shape about the row's line: up by what `edges`
 * holds at `at`, down by what it holds one run of steps later. False when
 * there is nothing of it before step `to`.
 */
function afterglowShape(
  ctx: CanvasRenderingContext2D,
  edges: Float32Array,
  at: number,
  steps: number,
  rows: Box,
  y: number,
  to = steps,
): boolean {
  let first = -1
  let last = -1
  for (let i = 0; i < to; i++) {
    if (edges[at + i] <= 0 && edges[at + steps + i] <= 0) continue
    if (first < 0) first = i
    last = i
  }
  if (last <= first) return false
  // A shape begins and ends in a point where the step before or after it is silent.
  const from = Math.max(first - 1, 0)
  const end = Math.min(last + 1, to - 1)
  const pitch = rows.w / (steps - 1)
  ctx.beginPath()
  ctx.moveTo(rows.x + from * pitch, y - edges[at + from])
  for (let i = from + 1; i <= end; i++) ctx.lineTo(rows.x + i * pitch, y - edges[at + i])
  for (let i = end; i >= from; i--) ctx.lineTo(rows.x + i * pitch, y + edges[at + steps + i])
  ctx.closePath()
  return true
}

/** Where the row of the picture's `row` lies; the last row is the octave the source's `made` partial makes for itself. */
function afterglowRowAt(source: number, row: number, made: number, rows: Box): number {
  if (row < AFTERGLOW_PARTIALS) return afterglowRowY(source, afterglowRatio(source, row), rows)
  return afterglowRowY(source, 2 * afterglowRatio(source, Math.max(made, 0)), rows)
}

/** The seconds the line of time is marked at, the first two with their numbers. */
const AFTERGLOW_MARKS = [1, 10, 3, 30] as const

/** The picture at rest: the line of time, the key that is held, and every partial's strike, glow and halo. */
function afterglowRest(frame: DisplayFrame<AfterglowState>, parts: AfterglowParts): void {
  const { ctx, colours, state } = frame
  const { set, rest, edges, steps } = state
  const { rows, rail, top } = parts
  const { ink } = colours
  rule(ctx, rows.x, rail, rows.x + rows.w, rail, { colour: ink, alpha: INK.rule })
  AFTERGLOW_MARKS.forEach((seconds, index) => {
    const x = Math.round(afterglowX(seconds, rows))
    rule(ctx, x, rail, x, rail + (index < 2 ? 3 : 2), { colour: ink, alpha: INK.back })
    if (index < 2) text(frame, `${seconds} s`, x, rail + 10, { align: 'center', alpha: INK.text })
  })
  // The key: down from the strike until the glow is up.
  const up = afterglowX(set.bloom, rows)
  rule(ctx, rows.x, rail, up, rail, { colour: ink, width: 3, alpha: INK.back })
  rule(ctx, up, top + 4, up, rail - 2, { colour: ink, alpha: INK.rule, dash: [1, 3] })

  // The played note's own row: the one Evolve leaves where it is.
  const played = afterglowPlayed(set.source)
  if (played >= 0) {
    const y = afterglowRowAt(set.source, played, rest.made, rows)
    ctx.beginPath()
    ctx.moveTo(3, y - 2.5)
    ctx.lineTo(7, y)
    ctx.lineTo(3, y + 2.5)
    ctx.closePath()
    filled(ctx, ink, INK.text)
  }

  for (let row = 0; row < AFTERGLOW_ROWS; row++) {
    if (row < AFTERGLOW_PARTIALS ? row >= rest.count : rest.made < 0) continue
    const y = afterglowRowAt(set.source, row, rest.made, rows)
    // The glow is the plate itself, lighter than the ground it lies on; the halo is a paler light around it.
    if (afterglowShape(ctx, edges, edgeAt(AURA, row, 0, steps), steps, rows, y)) {
      filled(ctx, colours.plate, 0.6)
      inked(ctx, ink, 0.5, INK.rule)
    }
    if (row === AFTERGLOW_PARTIALS) continue
    if (afterglowShape(ctx, edges, edgeAt(LENS, row, 0, steps), steps, rows, y)) {
      filled(ctx, colours.plate, 1)
      inked(ctx, ink, 0.75, INK.back)
    }
    if (afterglowShape(ctx, edges, edgeAt(WEDGE, row, 0, steps), steps, rows, y))
      filled(ctx, ink, 0.72)
  }
}

/**
 * The notes that sound, in the accent: each is a mark on every row where its
 * age puts it, as thick as that partial is now, and the newest has its whole
 * way so far behind it. The newest comes back, or null.
 */
function afterglowNotes(
  frame: DisplayFrame<AfterglowState>,
  parts: AfterglowParts,
): DisplayNote | null {
  const { ctx, colours, state, notes } = frame
  const { set, voice, levels } = state
  const { rows, rail } = parts
  const { steps, reach } = state
  const scale = 1 / (afterglowStrength(AFTERGLOW_REST_GAIN) * state.full)
  afterglowFrom(notes, set.bloom, set.fade, state.from)
  state.shares.length = notes.length
  let newest = -1
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]
    state.shares[i] = 0
    // A note keeps the source it was struck as, and a key struck again is one note: the old one is in the new.
    const own = metKind(state.met, note, frame.now) === state.met.now
    if (!own || afterglowAgain(notes, i) >= 0) continue
    afterglowStruck(set, note.frequency, note.gain, voice)
    const env = afterglowEnv(note.age, note.released, set.bloom, set.fade, state.from[i])
    const most = afterglowLevels(set, voice, note.age, env, levels) * voice.amp * scale
    const share = shareOfDb(gainToDb(most))
    if (share >= DONE) state.shares[i] = share
  }
  // The device has sixteen notes and gives the quietest to a new key.
  const least = loudestKept(state.shares, state.sorted, AFTERGLOW_VOICES)
  for (let i = 0; i < notes.length; i++)
    if (state.shares[i] > 0 && state.shares[i] >= least) newest = i
  if (newest < 0) return null

  // The newest note's way so far, as it really went: by how long its key was down.
  const note = notes[newest]
  const down = note.released === null ? Infinity : Math.max(note.age - note.released, 0)
  afterglowStruck(set, note.frequency, note.gain, voice)
  if (state.path.length < AFTERGLOW_ROWS * 2 * steps)
    state.path = new Float32Array(AFTERGLOW_ROWS * 2 * steps)
  const { path } = state
  const to = Math.min(Math.floor(afterglowAlong(note.age) * (steps - 1)) + 1, steps)
  for (let i = 0; i < to; i++) {
    const seconds = Math.min(afterglowSecondsAt(i / (steps - 1)), note.age)
    const env = afterglowEnv(
      seconds,
      seconds >= down ? seconds - down : null,
      set.bloom,
      set.fade,
      state.from[newest],
    )
    afterglowLevels(set, voice, seconds, env, levels)
    for (let row = 0; row < AFTERGLOW_ROWS; row++) {
      const level = levels[row] * voice.amp * scale
      const half = level >= 0.001 ? afterglowThick(level, reach) : 0
      path[row * 2 * steps + i] = half
      path[(row * 2 + 1) * steps + i] = half
    }
  }
  for (let row = 0; row < AFTERGLOW_ROWS; row++) {
    if (row === AFTERGLOW_PARTIALS && voice.made < 0) continue
    const y = afterglowRowAt(set.source, row, voice.made, rows)
    if (afterglowShape(ctx, path, row * 2 * steps, steps, rows, y, to))
      filled(ctx, colours.accent, 0.85)
  }
  rule(ctx, rows.x, rail, afterglowX(Math.min(note.age, down), rows), rail, {
    colour: colours.accent,
    width: 3,
  })

  // Every note that sounds, where it is now.
  for (let i = 0; i < notes.length; i++) {
    const share = state.shares[i]
    if (share <= 0 || share < least) continue
    const each = notes[i]
    afterglowStruck(set, each.frequency, each.gain, voice)
    const env = afterglowEnv(each.age, each.released, set.bloom, set.fade, state.from[i])
    afterglowLevels(set, voice, each.age, env, levels)
    const x = afterglowX(each.age, rows)
    for (let row = 0; row < AFTERGLOW_ROWS; row++) {
      const level = levels[row] * voice.amp * scale
      if (level < 0.001) continue
      const half = Math.max(afterglowThick(level, reach), 0.75)
      const y = afterglowRowAt(set.source, row, voice.made, rows)
      rule(ctx, x, y - half, x, y + half, {
        colour: colours.accent,
        width: 2,
        alpha: i === newest ? 1 : lerp(0.5, 1, share),
      })
    }
  }
  return note
}

/** What a note's glow is doing, as the device's stages are said. */
function afterglowStage(set: AfterglowSetting, note: DisplayNote, from: number): string {
  const env = afterglowEnv(note.age, note.released, set.bloom, set.fade, from)
  if (!(set.glow > 0) || env <= 0) return 'rings'
  if (note.age < set.bloom) return 'blooms'
  return note.released === null ? 'holds' : 'fades'
}

const afterglow = plateDisplay<AfterglowState>({
  place: 'window',
  columns: 2,
  params: [
    'source',
    'strike',
    'decay',
    'glow',
    'bloom',
    'fade',
    'tone',
    'halo',
    'evolve',
    'drift',
    'width',
  ],
  live: { signal: true, notes: true },
  info: 'Each row is an overtone of the strike, running in time from the left: the dark wedge is the strike dying away, the pale shape the glow that blooms behind it and fades once the key is let go. A played note runs along its rows. Drag the handles to set Decay, Bloom and Fade.',
  init: () => ({
    set: afterglowSetting(),
    rest: afterglowVoice(),
    voice: afterglowVoice(),
    seen: new Float32Array(14).fill(NaN),
    fresh: new Float32Array(14),
    edges: new Float32Array(0),
    steps: 2,
    full: 1,
    reach: 6,
    levels: new Float32Array(AFTERGLOW_ROWS),
    path: new Float32Array(0),
    moved: new Float32Array(AFTERGLOW_PARTIALS),
    sines: new Float32Array(AFTERGLOW_PARTIALS),
    raw: new Float32Array(AFTERGLOW_PARTIALS * 2),
    pair: [1, 1],
    from: [],
    shares: [],
    sorted: [],
    met: metNone(),
  }),
  draw(frame) {
    const { state } = frame
    ground(frame)
    const set = afterglowRead(frame, frame.sampleRate, state.set)
    const parts = afterglowParts(frame)
    metKnob(state.met, set.source, frame.now, frame.dt)

    // The picture at rest is worked out again only when a knob or the size has changed.
    const { seen, fresh } = state
    fresh[0] = set.source
    fresh[1] = set.strike
    fresh[2] = set.decay
    fresh[3] = set.glow
    fresh[4] = set.bloom
    fresh[5] = set.fade
    fresh[6] = set.tone
    fresh[7] = set.halo
    fresh[8] = set.evolve
    fresh[9] = set.drift
    fresh[10] = set.width
    fresh[11] = set.sampleRate
    fresh[12] = frame.width
    fresh[13] = frame.height
    let turned = false
    for (let i = 0; i < fresh.length; i++) if (seen[i] !== fresh[i]) turned = true
    if (turned) {
      seen.set(fresh)
      afterglowSpecimen(state, parts)
    }
    afterglowRest(frame, parts)
    const said = afterglowNotes(frame, parts)
    metKeep(state.met)
    levelFoot(frame, parts.foot, outShare(frame))

    // The words: what is struck, and the newest note with what its glow is doing.
    text(frame, AFTERGLOW_SOURCES[set.source], 5, 12)
    if (said) {
      const hz = afterglowHz(said.frequency, set.sampleRate)
      const from = state.from[frame.notes.indexOf(said)] ?? 0
      text(frame, `${pitchName(hz)} ${afterglowStage(set, said, from)}`, frame.width - 5, 12, {
        align: 'right',
      })
    }

    for (const point of afterglowHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: afterglowHandles,
})

function afterglowHandles(view: DisplayView): DisplayHandle[] {
  const { rows, top } = afterglowParts(view)
  const bloom = Math.max(view.value('bloom'), 0.01)
  const within = (param: string, seconds: number, low: number, high: number): number =>
    clamp(seconds, view.spec(param)?.min ?? low, view.spec(param)?.max ?? high)
  const secondsAt = (x: number): number => afterglowSecondsAt((x - rows.x) / rows.w)
  return [
    {
      key: 'decay',
      name: 'Decay',
      x: afterglowX(view.value('decay'), rows),
      y: rows.y + rows.h,
      drag: (toX) => ({ decay: within('decay', secondsAt(toX), 0.2, 20) }),
      reset: () => ({ decay: view.spec('decay')?.default ?? 4 }),
    },
    {
      key: 'bloom',
      name: 'Bloom',
      x: afterglowX(bloom, rows),
      y: top,
      drag: (toX) => ({ bloom: within('bloom', secondsAt(toX), 0.3, 20) }),
      reset: () => ({ bloom: view.spec('bloom')?.default ?? 1.5 }),
    },
    {
      key: 'fade',
      name: 'Fade',
      x: afterglowX(bloom + view.value('fade'), rows),
      y: top,
      drag: (toX) => ({ fade: within('fade', secondsAt(toX) - bloom, 0.1, 30) }),
      reset: () => ({ fade: view.spec('fade')?.default ?? 5 }),
    },
  ]
}

// --- Feedback ----------------------------------------------------------------

/** `feedback.h`, `kMaxVoices`, `kLowestHz`, `kHighestHz`, `kTopHz`: the strings it has and the pitches they play; no overtone above 5 kHz is favoured. */
const FEEDBACK_VOICES = 12
const FEEDBACK_LOW_HZ = 27
const FEEDBACK_HIGH_HZ = 4300
const FEEDBACK_TOP_HZ = 5000
/** `feedback.h`, `kMaxRatio`: Gain at 1 gives back this many times what the overtone that sings loses. */
const FEEDBACK_MOST_LIFT = 8
/** `feedback.h`, `kRingSeconds`, `kHighHz`: the string alone, to -60 dB at 110 Hz, and where its top is measured. */
const FEEDBACK_RING_SEC = 3.2
const FEEDBACK_TOP_AT_HZ = 3000
/** `feedback.h`, `kPickLevel`, `kChokeSeconds`, `kCeiling`: the pluck at Pick 1 against the held level, a key struck again, and what all the strings may come to. */
const FEEDBACK_PICK = 1.6
/** A pluck is no tone: the limiter, which takes a string's mean size over a period, reads one as this share of what it was struck at (0.58 to 0.63 of the level at Pick 0.5 from A1 to A6, the header run natively). */
const FEEDBACK_PICK_READS = 0.73
const FEEDBACK_CHOKE_SEC = 0.03
const FEEDBACK_CEILING = 1.5
const FEEDBACK_LEVEL = 0.25
/** `feedback.h`, `kTaps`, `kTapsPerPeriod`, `kLeastPassed`: the band is fifteen taps a sixteenth of a period apart. */
const FEEDBACK_TAPS = 15
const FEEDBACK_TAPS_A_PERIOD = 16
const FEEDBACK_LEAST_PASSED = 0.05
/** The pitch the picture at rest is of: the one `kRingSeconds` is said at. */
const FEEDBACK_REST_HZ = 110

/** `Feedback::note_on`: the pitches it plays. */
export const feedbackHz = (hz: number, sampleRate: number): number =>
  clamp(hz, FEEDBACK_LOW_HZ, Math.min(FEEDBACK_HIGH_HZ, 0.11 * sampleRate))

/** `Feedback::apply`, `kGain`: how many times its own loss the overtone that sings is given back. Under 1 a note dies, over 1 it holds. */
export const feedbackLift = (gain: number): number => {
  const knob = clamp(gain, 0, 1)
  return FEEDBACK_MOST_LIFT * knob * knob * knob
}

/** `Feedback::level_for`: the level a key asks for by its velocity, against the hardest. */
export const feedbackStrength = (gain: number): number => 0.4 + 0.6 * clamp(gain, 0, 1)

/** `Feedback::start`, `ring`: the seconds the string rings by itself, longer for low notes. */
export const feedbackRing = (hz: number): number =>
  FEEDBACK_RING_SEC * clamp(Math.sqrt(110 / hz), 0.3, 1.5)

/** `Feedback::control`, `top_`: the ring of the top of the string against the note's own; Damp takes it from 0.6 down to 0.03. */
export const feedbackTop = (damp: number): number => 0.6 * Math.pow(0.05, clamp(damp, 0, 1))

/** `Feedback::start`, `max_overtone`: the highest overtone a note can be held on. */
export const feedbackMostOvertone = (hz: number): number => clamp(FEEDBACK_TOP_HZ / hz, 1, 8)

/** `Feedback::steer`, `overtone`: where the band stands, Distance moved by Wander's drift (-1 to 1) up to 2.5 overtones either way. */
export const feedbackFavoured = (
  distance: number,
  wander: number,
  drift: number,
  hz: number,
): number => clamp(distance + wander * 2.5 * drift, 1, feedbackMostOvertone(hz))

/** `Feedback::apply`, `kGrit`: the amplifier's drive in units of the string's level, 0.1 to 8. */
export const feedbackDrive = (grit: number): number => 0.1 * Math.pow(80, clamp(grit, 0, 1))

/** `Feedback::tone_gain`: the size of the tone a soft clip driven by `drive` gives back for a tone of size one. */
export const feedbackToneGain = (drive: number): number =>
  drive / Math.sqrt(1 + ((drive * Math.PI) / 4) * ((drive * Math.PI) / 4))

/** `Feedback::render`: the amplifier's wave for a tone of size one at `turn` of its cycle: as large whatever Grit is, and squarer the harder it is driven. */
export const feedbackWave = (turn: number, drive: number): number =>
  Math.tanh(drive * Math.sin(2 * Math.PI * turn)) / feedbackToneGain(drive)

/** `Feedback::control`, `bloom_rate_`: how far the feedback has opened `seconds` after the key: within 5 % at Bloom. */
export const feedbackBloom = (seconds: number, bloom: number): number =>
  1 - Math.exp((-3 * Math.max(seconds, 0)) / bloom)

/** The seconds' worth of open feedback so far: `feedbackBloom` cubed, which is what a string is given by, summed from the key on. */
export function feedbackOpened(seconds: number, bloom: number): number {
  const t = Math.max(seconds, 0)
  const k = 3 / bloom
  const gone = (times: number): number => (1 - Math.exp(-times * k * t)) / (times * k)
  return t - 3 * gone(1) + 3 * gone(2) - gone(3)
}

/** `Feedback::control`, `hold_coeff_` and `choke_coeff_`: the feedback's hold on a string `seconds` after its key: 60 dB down at Release, or in 30 ms under a key struck again. */
export const feedbackHold = (seconds: number, release: number, choked = false): number =>
  choked
    ? Math.exp((-6 * Math.max(seconds, 0)) / FEEDBACK_CHOKE_SEC)
    : Math.exp((-6.9 * Math.max(seconds, 0)) / release)

/**
 * `Feedback::render`, the amplifier in the loop: it is scaled to give a tone
 * of the key's level back as large as it came, so a faint one, which it does
 * not clip, comes back this many times larger: next to 1 with Grit low, 2 at
 * Grit 0.7 and 6.4 at Grit 1.
 */
export const feedbackFaint = (drive: number): number => drive / feedbackToneGain(drive)

/**
 * Whether a held key holds. The header says by Gain alone, from the middle
 * of the knob up; run natively, Grit lowers that, because a faint string
 * gets `feedbackFaint` times what Gain gives: at Grit 1 a key holds from Gain
 * 0.27 up, at 0.35 from 0.49.
 */
export const feedbackHolds = (lift: number, drive: number): boolean =>
  lift * feedbackFaint(drive) > 1

/**
 * `Feedback::steer`, the limiter: the size a held string is brought to,
 * against the level of the hardest key. It is the level its key asked for,
 * opened by Bloom as its square and closed by Release, times the root of
 * what Gain gives over the string's loss. Where Gain gives no more than the
 * loss the limiter holds nothing, and a string that still holds, by Grit,
 * settles where the amplifier clips it down to what it loses: smaller than
 * its level (within 1.5 dB of the header run natively).
 */
export function feedbackHeld(
  lift: number,
  strength: number,
  bloom: number,
  hold: number,
  drive: number,
): number {
  if (lift > 1) return Math.sqrt(lift) * strength * bloom * bloom * hold
  const back = lift * bloom * bloom * bloom * feedbackFaint(drive)
  if (back <= 1) return 0
  return (strength * hold * Math.sqrt(back * back - 1)) / ((drive * Math.PI) / 4)
}

/** `Feedback::start`, `kHum`: the size the overtone that will sing starts from on a string with no pick, against the hardest key's level (read off the header run natively). */
const FEEDBACK_HUM = 0.00006

/**
 * `Feedback::steer`, `most`: how large the feedback alone has made a string
 * that began at `start`, `seconds` after its key: under its level it is
 * given all Gain has (the fourth power of what Gain gives, once that is over
 * the loss), as far as Bloom has opened, and never more than doubles in a
 * trip round. Far over the threshold that is at once; just over it a string
 * with no pick is seconds coming out of the hum (two at 110 Hz with Gain at
 * 0.55). `need` is what the overtone that sings loses in a trip round.
 */
export function feedbackGrown(
  lift: number,
  start: number,
  seconds: number,
  bloom: number,
  need: number,
  hz: number,
  drive: number,
): number {
  const t = Math.max(seconds, 0)
  const opened = feedbackOpened(t, bloom)
  const gave = lift > 1 ? (lift * lift * lift * lift - lift) * t + lift * opened : lift * opened
  const grew = Math.min(need * (feedbackFaint(drive) * gave - t), Math.LN2 * t)
  return Math.max(start, FEEDBACK_HUM) * Math.exp(hz * grew)
}

/** `Feedback::control`, `fit_`: what the levels the held strings ask for are scaled by, so that together they stay under the ceiling. `asked` is their sum against the hardest key's. */
export function feedbackFit(asked: number, lift: number): number {
  const all = FEEDBACK_LEVEL * asked * Math.sqrt(lift)
  return lift > 1 && all > FEEDBACK_CEILING ? FEEDBACK_CEILING / all : 1
}

/**
 * `Feedback::start` and `steer`: the pluck of a key `seconds` on, against the
 * hardest key's held level. It is struck at Pick times 1.6 of the key's
 * level, which the limiter reads as 0.73 of that, and dies as the string
 * alone does. Where a note does not hold the feedback still gives back part
 * of what the string loses once it has opened (`back` of it, for `opened`
 * seconds' worth), so the pluck dies more slowly; where it holds, `back` is
 * 0 here: the feedback has the string and the pluck is only the start of it.
 */
export function feedbackPluck(
  pick: number,
  strength: number,
  seconds: number,
  ring: number,
  back: number,
  opened: number,
): number {
  const lost = Math.max(seconds, 0) - clamp(back, 0, 1) * opened
  const struck = FEEDBACK_PICK * FEEDBACK_PICK_READS * pick * strength
  return struck * Math.pow(10, (-3 * Math.max(lost, 0)) / ring)
}

/** `Feedback::crowding`: the power the held strings' sizes follow their strengths by: 1 with Crowd at 0, about 3 at the middle, without end at the top. */
export function feedbackCrowdPower(crowd: number): number {
  if (crowd >= 0.9999) return Infinity
  return 1 + (3.2 * Math.max(crowd, 0)) / Math.pow(1 - crowd, 0.317)
}

/**
 * `Feedback::steer`, what the limiter sees: held strings settle at sizes that
 * stand to one another as their strengths to `power`, and come together to
 * the power mean of the strengths. The sizes of strings of these `strengths`,
 * into `into`.
 */
export function feedbackShares(
  strengths: readonly number[],
  power: number,
  into: number[],
): number[] {
  into.length = strengths.length
  let most = 0
  for (const strength of strengths) most = Math.max(most, strength)
  if (!(most > 0)) return into.fill(0)
  if (!Number.isFinite(power)) {
    // All to one: the first of the strongest.
    const leader = strengths.indexOf(most)
    for (let i = 0; i < strengths.length; i++) into[i] = i === leader ? most : 0
    return into
  }
  let sum = 0
  for (const strength of strengths) sum += Math.pow(strength / most, power)
  const mean = most * Math.pow(sum, 1 / power)
  for (let i = 0; i < strengths.length; i++)
    into[i] = (most * Math.pow(strengths[i] / most, power)) / Math.pow(mean / most, power - 1)
  return into
}

/** `Feedback::lean_of_shares`: the octaves a string's hold on the amplifier leans either way under Wander: its cube root, and less as Crowd rises. */
export function feedbackLean(wander: number, crowd: number): number {
  const power = feedbackCrowdPower(crowd)
  const crowding = Number.isFinite(power) ? 1 - 1 / power : 1
  const spread = (2 * (1 - crowding)) / (2 * (1 - crowding) + crowding)
  return 2.65 * Math.cbrt(clamp(wander, 0, 1)) * (0.12 + 0.88 * spread)
}

/** `FeedbackString`: the loss low-pass of a string, a pole and a gain. */
export interface FeedbackLoss {
  pole: number
  gain: number
  /** Radians per sample at the note. */
  w: number
}

/** |H| of the loss low-pass (1 - a) / (1 - a z^-1) at `w`: `FeedbackString::magnitude`. */
const lossAt = (pole: number, w: number): number =>
  (1 - pole) / Math.sqrt(1 - 2 * pole * Math.cos(w) + pole * pole)

/**
 * `Feedback::start` and `FeedbackString::set`: the loss round a string that
 * rings `feedbackRing` at its note and `feedbackTop` of that at 3 kHz (an
 * octave over the note where that is higher). The pole may put the highest
 * overtone the feedback can favour no more than two cents sharp; past that
 * the top rings longer than asked.
 */
export function feedbackLoss(
  hz: number,
  damp: number,
  sampleRate: number,
  into: FeedbackLoss = { pole: 0, gain: 0, w: 0 },
): FeedbackLoss {
  const period = sampleRate / hz
  const top = (2 * Math.PI * feedbackMostOvertone(hz)) / period
  const most = ((2 / 1731) * period * 6) / (top * top)
  let low = 0
  let high = 0.98
  for (let i = 0; i < 16; i++) {
    const mid = 0.5 * (low + high)
    if (mid * (1 + mid) < most * (1 - mid) * (1 - mid) * (1 - mid)) low = mid
    else high = mid
  }
  const mostPole = low

  const ring = feedbackRing(hz)
  const ringHigh = clamp(ring * feedbackTop(damp), 0.0005, ring)
  const w1 = (2 * Math.PI * hz) / sampleRate
  const w2 =
    (2 * Math.PI * Math.min(Math.max(FEEDBACK_TOP_AT_HZ, 2 * hz), 0.45 * sampleRate)) / sampleRate
  const gain1 = Math.pow(10, -3 / (hz * ring))
  const wanted = Math.pow(10, -3 / (hz * ringHigh)) / gain1
  const ratio = (pole: number): number => lossAt(pole, w2) / lossAt(pole, w1)
  let pole = 0
  if (w2 > w1 && wanted < 1) {
    low = 0
    high = 0.98
    if (ratio(high) < wanted) {
      for (let i = 0; i < 20; i++) {
        const mid = 0.5 * (low + high)
        if (ratio(mid) > wanted) low = mid
        else high = mid
      }
    }
    pole = Math.min(high, mostPole)
  }
  into.pole = pole
  into.gain = Math.min(gain1 / lossAt(pole, w1), 0.99999)
  into.w = w1
  return into
}

/** `FeedbackString::gain_at`: what overtone `h` of a string loses in one trip round. */
export const feedbackLost = (loss: FeedbackLoss, h: number): number =>
  1 - loss.gain * lossAt(loss.pole, loss.w * h)

/**
 * `Feedback::draw`: how much of whole overtone `h` the band passes when it
 * stands at `overtone` (which need not be a whole one), as a share of its
 * window's sum: a Hann window of cosines over one period with its mean
 * removed. One it is centred on passes about half. The taps are taken where
 * they should be, not at the whole samples the device has to read.
 */
export function feedbackPassed(overtone: number, h: number): number {
  const half = (FEEDBACK_TAPS - 1) / 2
  let sum = 0
  let windowSum = 0
  for (let j = -half; j <= half; j++) {
    const offset = j / FEEDBACK_TAPS_A_PERIOD
    const window = 0.5 + 0.5 * Math.cos(2 * Math.PI * offset)
    sum += window * Math.cos(2 * Math.PI * overtone * offset)
    windowSum += window
  }
  let through = 0
  for (let j = -half; j <= half; j++) {
    const offset = j / FEEDBACK_TAPS_A_PERIOD
    const window = 0.5 + 0.5 * Math.cos(2 * Math.PI * offset)
    const weight = window * Math.cos(2 * Math.PI * overtone * offset) - (window * sum) / windowSum
    through += weight * Math.cos(2 * Math.PI * h * offset)
  }
  return through / windowSum
}

/**
 * What whole overtone `h` costs with the band at `overtone`: what it loses in
 * a trip round over the share of it the band gives back. Without end for one
 * the band does not pass, or that lies over 0.45 of the rate.
 */
export function feedbackCost(overtone: number, h: number, loss: FeedbackLoss): number {
  if (h < 1 || h * loss.w > 0.9 * Math.PI) return Infinity
  const through = feedbackPassed(overtone, h)
  return through < FEEDBACK_LEAST_PASSED ? Infinity : feedbackLost(loss, h) / through
}

/**
 * The whole overtone that costs the least with the band at `overtone`, among
 * those the band stands near. `Feedback::draw` looks only up to 5 kHz over
 * the note, but the loop itself has no such stop: run natively, a key whose
 * band is held at that top sings the overtone past it where that one costs
 * less (C6 with Distance at 5 or more sings on 5, which is 5.2 kHz).
 */
export function feedbackSung(overtone: number, loss: FeedbackLoss): number {
  let least = Infinity
  let sung = 1
  for (let h = Math.max(Math.floor(overtone) - 1, 1); h <= Math.ceil(overtone) + 2; h++) {
    const cost = feedbackCost(overtone, h, loss)
    if (cost < least) {
      least = cost
      sung = h
    }
  }
  return sung
}

/**
 * How much less an overtone must cost before it is known to be the one that
 * sings. These two are measured, not read: the header run natively at 48 kHz
 * over every key from A1 to C8, ten Distances, Gain 0.55 to 1, Damp and Grit
 * at both ends and Pick at 0, 0.5 and 1, each note held four seconds and the
 * loudest overtone on the string taken. Where two overtones cost within 1.5
 * of one another either may be the one that sings, by Gain, Grit and the
 * pick. Under Wander a string was found on another overtone than its own
 * wherever that one came to cost 7 % less or more, and never where it stayed
 * within 6 % (two minutes each of Wander at 0.2, 0.5 and 1 on four keys).
 * Twice in 6840 notes another sang than is said here, both with no pick on
 * the lowest keys: the band's taps are a sixteenth of a period apart and
 * pass overtone 16 less Distance as they pass Distance's own (the eleventh
 * of B1 with Distance at 5).
 */
const FEEDBACK_CLEAR = 1.5
const FEEDBACK_MOVES = 1.07
/** How finely Wander's reach is walked, in overtones. */
const FEEDBACK_WALK = 0.25

/** The overtones a string may sing on: the likeliest, and the lowest and highest it may be found on. */
export interface FeedbackSings {
  sung: number
  low: number
  high: number
}

/**
 * The overtones a key may be found singing on. With Wander at 0 it is the one
 * that costs the least at Distance, with its neighbours where they cost
 * nearly the same. Wander moves the band up to 2.5 overtones either way at
 * its own slow pace, a path of its own for every key, so all that can be said
 * is how far that may carry the note: an overtone is added once it costs
 * clearly less than the one the string would be on by then.
 */
export function feedbackSings(
  distance: number,
  wander: number,
  hz: number,
  loss: FeedbackLoss,
  into: FeedbackSings = { sung: 1, low: 1, high: 1 },
): FeedbackSings {
  const at = feedbackFavoured(distance, 0, 0, hz)
  const sung = feedbackSung(at, loss)
  const least = feedbackCost(at, sung, loss)
  let low = sung
  let high = sung
  while (feedbackCost(at, low - 1, loss) <= FEEDBACK_CLEAR * least) low--
  while (feedbackCost(at, high + 1, loss) <= FEEDBACK_CLEAR * least) high++
  for (let side = -1; side <= 1 && wander > 0; side += 2) {
    // The band with Wander's drift all the way to this side.
    const end = feedbackFavoured(distance, wander, side, hz)
    let held = side < 0 ? low : high
    for (let step = 1; ; step++) {
      const walked = at + side * step * FEEDBACK_WALK
      const band = side < 0 ? Math.max(walked, end) : Math.min(walked, end)
      const next = feedbackSung(band, loss)
      if (feedbackCost(band, held, loss) > FEEDBACK_MOVES * feedbackCost(band, next, loss)) {
        held = next
        low = Math.min(low, held)
        high = Math.max(high, held)
      }
      if (band === end) break
    }
  }
  into.sung = sung
  into.low = low
  into.high = high
  return into
}

/** What the knobs say, as the figures read them. */
export interface FeedbackSetting {
  gain: number
  distance: number
  bloom: number
  grit: number
  pick: number
  crowd: number
  wander: number
  damp: number
  release: number
  width: number
  sampleRate: number
}

/**
 * A key as far as it can be known from outside: `age` seconds on, let go
 * `released` seconds ago (null while it is down), choked `choked` seconds ago
 * by its own key struck again (null if not). Its pluck and the level the
 * feedback holds it at, both against the hardest key's held level at the
 * threshold, into `into`; `fit` is what the ceiling leaves of the levels and
 * `need` what the overtone it sings loses in a trip round. The held part is
 * the level the limiter has opened, or as much of it as the feedback has had
 * time to raise the string to. Returns the larger of the two: about the size
 * of the string.
 */
export function feedbackNote(
  set: FeedbackSetting,
  note: Pick<DisplayNote, 'frequency' | 'gain' | 'age' | 'released'>,
  choked: number | null,
  fit: number,
  need: number,
  into: [number, number],
): number {
  const hz = feedbackHz(note.frequency, set.sampleRate)
  const lift = feedbackLift(set.gain)
  const drive = feedbackDrive(set.grit)
  const strength = feedbackStrength(note.gain)
  const ring = feedbackRing(hz)
  const up = note.released === null ? choked : Math.max(note.released, choked ?? 0)
  const after = up === null ? 0 : Math.min(up, note.age)
  const down = note.age - after
  let hold = 1
  let hand = 1
  if (up !== null) {
    hold = feedbackHold(after, set.release, choked !== null)
    // `Feedback::steer`, `hand`: a hand on the string when Release is shorter than its ring.
    const wanted = choked !== null ? FEEDBACK_CHOKE_SEC : set.release
    if (wanted < ring) hand = Math.pow(10, -3 * after * (1 / wanted - 1 / ring))
  }
  const open = feedbackBloom(note.age, set.bloom)
  // What is given back once the key is up is what was open then, closing by the hold.
  const opened = feedbackOpened(down, set.bloom)
  const back = feedbackHolds(lift, drive) ? 0 : lift * feedbackFaint(drive)
  into[0] = feedbackPluck(set.pick, strength, note.age, ring, back, opened) * hand
  // The feedback starts from the pluck, or from the hum where there is none, and stops raising the string at key up.
  const struck = feedbackPluck(set.pick, strength, 0, ring, 0, 0)
  const grown = feedbackGrown(lift, struck, down, set.bloom, need, hz, drive) * hold
  into[1] = Math.min(feedbackHeld(lift, strength, open, hold, drive) * fit, grown)
  return Math.max(into[0], into[1])
}

/** `Feedback::control`, `asked`: what the keys that are down ask of the amplifier together, against the hardest key's level. */
export function feedbackAsked(
  set: FeedbackSetting,
  notes: readonly DisplayNote[],
  chokes: readonly (number | null)[],
): number {
  let asked = 0
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]
    const choked = chokes[i]
    const up = note.released === null ? choked : Math.max(note.released, choked ?? 0)
    const hold =
      up === null ? 1 : feedbackHold(Math.min(up, note.age), set.release, choked !== null)
    const open = feedbackBloom(note.age, set.bloom)
    asked += feedbackStrength(note.gain) * open * open * hold
  }
  return asked
}

/** The largest a string can be held, against the hardest key's level at the threshold: the root of the most Gain gives. */
const FEEDBACK_MOST = Math.sqrt(FEEDBACK_MOST_LIFT)
/** Where along a string, nut to bridge, it is picked. */
const FEEDBACK_PICKED_AT = 0.78
/** The speaker with its magnet, and the amplifier under it, in pixels. */
const FEEDBACK_SPEAKER_W = 15
const FEEDBACK_AMP_H = 12
/** The time a note's life is drawn over, key down and key up: 50 ms in, time is drawn ever closer. */
const FEEDBACK_NEAR_SEC = 0.05
const FEEDBACK_DOWN_SEC = 10
const FEEDBACK_UP_SEC = 12
const FEEDBACK_DOWN_SHARE = 0.6
/** The strengths of the three keys the amplifier's sharing is shown for: each 2 dB under the one before. */
const FEEDBACK_KEYS = [1, 0.8, 0.64] as const

interface FeedbackParts {
  foot: Box
  /** The strings stand side by side in this box, from the nut at its top to the bridge at its bottom. */
  zone: Box
  /** The air: the height the wave runs at, where it reaches the strings, and how far off the speaker stands with Distance at its most. */
  air: number
  from: number
  gap: number
  /** A note's life in time: key down on the left, key up on the right. */
  life: Box
  down: number
  up: number
}

function feedbackParts(view: Size): FeedbackParts {
  const { width, height } = view
  const foot = { x: 4, y: height - 10, w: width - 8, h: 6 }
  const life = { x: 8, y: foot.y - 20, w: width - 16, h: 16 }
  const nut = 19
  const bridge = Math.max(life.y - 9, nut + 12)
  const zone = { x: 8, y: nut, w: clamp(Math.round(width * 0.2), 24, 40), h: bridge - nut }
  const from = zone.x + zone.w + 5
  const gap = Math.max(width - 8 - FEEDBACK_SPEAKER_W - from, 16)
  const down = Math.round(life.w * FEEDBACK_DOWN_SHARE)
  return {
    foot,
    zone,
    air: nut + Math.round(zone.h * 0.4),
    from,
    gap,
    life,
    down,
    up: life.w - down - 5,
  }
}

const warp = (seconds: number, far: number): number =>
  clamp(
    Math.log(1 + Math.max(seconds, 0) / FEEDBACK_NEAR_SEC) / Math.log(1 + far / FEEDBACK_NEAR_SEC),
    0,
    1,
  )
const unwarp = (along: number, far: number): number =>
  FEEDBACK_NEAR_SEC * (Math.exp(clamp(along, 0, 1) * Math.log(1 + far / FEEDBACK_NEAR_SEC)) - 1)

/** Where a moment of a held key, and of a key let go, lies on the line of a note's life. */
const feedbackDownX = (seconds: number, parts: FeedbackParts): number =>
  parts.life.x + parts.down * warp(seconds, FEEDBACK_DOWN_SEC)
const feedbackUpX = (seconds: number, parts: FeedbackParts): number =>
  parts.life.x + parts.life.w - parts.up + parts.up * warp(seconds, FEEDBACK_UP_SEC)
/** How high a size stands on that line: by its root, so a note that sinks can be followed down. */
const feedbackLifeY = (size: number, life: Box): number =>
  life.y + life.h - life.h * Math.sqrt(clamp(size / FEEDBACK_MOST, 0, 1))

/**
 * Where the speaker's mouth stands for a Distance: further off for a higher
 * overtone, but not in step, so that each cycle of the wave between is
 * shorter the higher the overtone is.
 */
const FEEDBACK_STEP = 0.6
const feedbackMouth = (distance: number, parts: FeedbackParts): number =>
  parts.from + parts.gap * Math.pow(clamp(distance, 0, 8) / 8, FEEDBACK_STEP)
const feedbackDistanceAt = (mouth: number, parts: FeedbackParts): number =>
  8 * Math.pow(clamp((mouth - parts.from) / parts.gap, 0, 1), 1 / FEEDBACK_STEP)

/** How far a string of this size swings, of the most its place allows. */
const feedbackSwing = (size: number): number => Math.sqrt(clamp(size / FEEDBACK_MOST, 0, 1))

/**
 * A string from the nut to the bridge at `x`: standing in `loops` loops and
 * swinging `swing` pixels to either side, and pulled `pulled` pixels aside
 * where it is picked. The path is both sides of the swing, down one and up
 * the other.
 */
function feedbackString(
  ctx: CanvasRenderingContext2D,
  zone: Box,
  x: number,
  loops: number,
  swing: number,
  pulled: number,
): void {
  const steps = Math.max(24, loops * 8)
  ctx.beginPath()
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i <= steps; i++) {
      const u = side === 0 ? i / steps : 1 - i / steps
      const pull =
        pulled *
        (u < FEEDBACK_PICKED_AT ? u / FEEDBACK_PICKED_AT : (1 - u) / (1 - FEEDBACK_PICKED_AT))
      const out = (side === 0 ? 1 : -1) * swing * Math.abs(Math.sin(loops * Math.PI * u))
      const px = x + pull + out
      const py = zone.y + zone.h * u
      if (side === 0 && i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
  }
  ctx.closePath()
}

/** The wave in the air from the speaker's mouth back to the strings: `cycles` of it, `lag` of a cycle late, as large as `reach` and as square as the amplifier is driven. */
function feedbackAir(
  ctx: CanvasRenderingContext2D,
  parts: FeedbackParts,
  mouth: number,
  cycles: number,
  reach: number,
  drive: number,
  lag: number,
): void {
  ctx.beginPath()
  const { from, air } = parts
  const pitch = cycles / Math.max(mouth - from, 1)
  for (let x = mouth; ; x -= 0.75) {
    const at = Math.max(x, from)
    const y = air - reach * feedbackWave((mouth - at) * pitch - lag, drive)
    if (x === mouth) ctx.moveTo(at, y)
    else ctx.lineTo(at, y)
    if (x <= from) break
  }
}

/** The speaker, its mouth to the strings, and the amplifier under it with the three keys' shares of it. */
function feedbackAmp(
  frame: Paint,
  parts: FeedbackParts,
  mouth: number,
  shares: readonly number[],
): void {
  const { ctx, colours } = frame
  const { air, zone } = parts
  const { ink } = colours
  ctx.beginPath()
  ctx.moveTo(mouth, air - 11)
  ctx.lineTo(mouth + 9, air - 4)
  ctx.lineTo(mouth + 9, air + 4)
  ctx.lineTo(mouth, air + 11)
  ctx.closePath()
  filled(ctx, ink, INK.fill)
  inked(ctx, ink, 1, 1)
  ctx.beginPath()
  ctx.rect(mouth + 9.5, air - 5, 4, 10)
  filled(ctx, ink, INK.text)

  const top = zone.y + zone.h - FEEDBACK_AMP_H + 4
  const box = { x: mouth + 0.5, y: top + 0.5, w: 13, h: FEEDBACK_AMP_H - 1 }
  ctx.beginPath()
  ctx.rect(box.x, box.y, box.w, box.h)
  filled(ctx, ink, INK.fill)
  inked(ctx, ink, 1, 1)
  // The amplifier feeds the speaker.
  rule(ctx, mouth + 11.5, air + 5, mouth + 11.5, top, { colour: ink })
  shares.forEach((share, index) => {
    const tall = (box.h - 3) * clamp(share, 0, 1)
    if (tall > 0.2)
      fillRect(
        ctx,
        { x: box.x + 2 + index * 3.5, y: box.y + box.h - 1.5 - tall, w: 2.5, h: tall },
        ink,
      )
  })
}

interface FeedbackState {
  set: FeedbackSetting
  loss: FeedbackLoss
  /** A note's pluck and its held level; the three keys' shares of the amplifier. */
  sizes: [number, number]
  shares: number[]
  /** For every note: when its key was struck again over it, its size as a share of a light, and room to sort those. */
  chokes: (number | null)[]
  lit: number[]
  sorted: number[]
  /** What the ceiling leaves of the levels the keys ask for. */
  fit: number
  /** The overtones each pitch asked after may sing on, and which of these is written over next. */
  known: FeedbackKnown[]
  turn: number
}

/** The overtones a pitch may sing on with what the likeliest loses in a trip round, and the knobs they were worked out for. */
interface FeedbackKnown extends FeedbackSings {
  need: number
  hz: number
  distance: number
  wander: number
  damp: number
  rate: number
}

/** As many pitches as are kept: the device's strings, the picture's own, and those of keys let go a while ago. */
const FEEDBACK_KNOWN = 32

/** The overtones a pitch may sing on: worked out once and kept while Distance, Wander and Damp stand still. */
function feedbackKnown(state: FeedbackState, hz: number): FeedbackKnown {
  const { set, known } = state
  for (const kept of known) {
    if (kept.hz !== hz || kept.distance !== set.distance || kept.wander !== set.wander) continue
    if (kept.damp === set.damp && kept.rate === set.sampleRate) return kept
  }
  const entry = known[state.turn]
  state.turn = (state.turn + 1) % known.length
  entry.hz = hz
  entry.distance = set.distance
  entry.wander = set.wander
  entry.damp = set.damp
  entry.rate = set.sampleRate
  const loss = feedbackLoss(hz, set.damp, set.sampleRate, state.loss)
  feedbackSings(set.distance, set.wander, hz, loss, entry)
  entry.need = feedbackLost(loss, entry.sung)
  return entry
}

/**
 * A string in every way it may stand: thin and pale in the lowest and the
 * highest overtone it may be found on, and over them in the likeliest, which
 * is left as the path for the caller to fill and ink.
 */
function feedbackStands(
  frame: Paint,
  zone: Box,
  x: number,
  sings: FeedbackSings,
  swing: number,
  pulled: number,
  colour: string,
): void {
  const { ctx } = frame
  if (swing > 0.3) {
    for (let end = 0; end < 2; end++) {
      const loops = end === 0 ? sings.low : sings.high
      if (loops === sings.sung) continue
      feedbackString(ctx, zone, x, loops, swing, pulled)
      inked(ctx, colour, 0.75, INK.back)
    }
  }
  feedbackString(ctx, zone, x, sings.sung, swing, pulled)
}

function feedbackRead(
  view: DisplayView,
  sampleRate: number,
  into: FeedbackSetting,
): FeedbackSetting {
  into.gain = clamp(view.value('gain'), 0, 1)
  into.distance = clamp(view.value('distance'), 1, 8)
  into.bloom = Math.max(view.value('bloom'), 0.001)
  into.grit = clamp(view.value('grit'), 0, 1)
  into.pick = clamp(view.value('pick'), 0, 1)
  into.crowd = clamp(view.value('crowd'), 0, 1)
  into.wander = clamp(view.value('wander'), 0, 1)
  into.damp = clamp(view.value('damp'), 0, 1)
  into.release = Math.max(view.value('release'), 0.001)
  into.width = clamp(view.value('width'), 0, 1)
  into.sampleRate = sampleRate
  return into
}

const feedbackSetting = (): FeedbackSetting => ({
  gain: 0.7,
  distance: 2,
  bloom: 0.5,
  grit: 0.35,
  pick: 0.5,
  crowd: 0.5,
  wander: 0.2,
  damp: 0.4,
  release: 1.5,
  width: 0.6,
  sampleRate: 48000,
})

/** The last answer of `feedbackRestNeed` and what it was for: the handles ask on every frame and have no state to keep it in. */
const feedbackRestKept = {
  distance: NaN,
  damp: NaN,
  rate: NaN,
  need: 0,
  loss: { pole: 0, gain: 0, w: 0 },
}

/** What the overtone the picture's own string sings loses in a trip round. */
function feedbackRestNeed(set: FeedbackSetting): number {
  const kept = feedbackRestKept
  if (kept.distance !== set.distance || kept.damp !== set.damp || kept.rate !== set.sampleRate) {
    const loss = feedbackLoss(FEEDBACK_REST_HZ, set.damp, set.sampleRate, kept.loss)
    const band = feedbackFavoured(set.distance, 0, 0, FEEDBACK_REST_HZ)
    kept.need = feedbackLost(loss, feedbackSung(band, loss))
    kept.distance = set.distance
    kept.damp = set.damp
    kept.rate = set.sampleRate
  }
  return kept.need
}

/**
 * The hardest key held `seconds`, at the pitch the picture is of: the level
 * the feedback has opened for it, or as much of that as the string has had
 * time to come up to. Where a note does not hold it is the level the limiter
 * opens all the same, which no string reaches. `need` is what the overtone
 * that sings loses in a trip round.
 */
function feedbackOpening(set: FeedbackSetting, seconds: number, need: number): number {
  const lift = feedbackLift(set.gain)
  const drive = feedbackDrive(set.grit)
  const open = feedbackBloom(seconds, set.bloom)
  if (!feedbackHolds(lift, drive)) return Math.sqrt(lift) * open * open
  const struck = feedbackPluck(set.pick, 1, 0, 1, 0, 0)
  const grown = feedbackGrown(lift, struck, seconds, set.bloom, need, FEEDBACK_REST_HZ, drive)
  return Math.min(feedbackHeld(lift, 1, open, 1, drive), grown)
}

/** A note's life in time, for the hardest key held ten seconds and let go: its pluck dying, the string coming up to the level Bloom opens, and Release closing it. */
function feedbackLife(
  frame: Paint,
  parts: FeedbackParts,
  set: FeedbackSetting,
  need: number,
): void {
  const { ctx, colours } = frame
  const { life, down } = parts
  const { ink } = colours
  const base = life.y + life.h
  const lift = feedbackLift(set.gain)
  const drive = feedbackDrive(set.grit)
  const holds = feedbackHolds(lift, drive)
  const back = holds ? 0 : lift * feedbackFaint(drive)
  const ring = feedbackRing(FEEDBACK_REST_HZ)
  // The key: down along the thick line, up along the thin one.
  rule(ctx, life.x, base, life.x + down, base, { colour: ink, width: 3, alpha: INK.back })
  rule(ctx, feedbackUpX(0, parts), base, life.x + life.w, base, { colour: ink, alpha: INK.back })

  if (set.pick > 0) {
    ctx.beginPath()
    ctx.moveTo(life.x, base)
    for (let x = 0; x <= down; x += 1.5) {
      const seconds = unwarp(x / down, FEEDBACK_DOWN_SEC)
      const size = feedbackPluck(
        set.pick,
        1,
        seconds,
        ring,
        back,
        feedbackOpened(seconds, set.bloom),
      )
      ctx.lineTo(life.x + x, feedbackLifeY(size, life))
    }
    ctx.lineTo(life.x + down, base)
    ctx.closePath()
    filled(ctx, ink, 0.4)
  }

  // A level no string reaches, because the string gets back less than it loses, is a broken line.
  ctx.setLineDash(holds ? [] : [2, 2])
  ctx.beginPath()
  for (let x = 0; x <= down; x += 1.5) {
    const seconds = unwarp(x / down, FEEDBACK_DOWN_SEC)
    const y = feedbackLifeY(feedbackOpening(set, seconds, need), life)
    if (x === 0) ctx.moveTo(life.x, y)
    else ctx.lineTo(life.x + x, y)
  }
  inked(ctx, ink, 1.25, 1)
  const held = feedbackOpening(set, FEEDBACK_DOWN_SEC, need)
  ctx.beginPath()
  for (let x = 0; x <= parts.up; x += 1.5) {
    const seconds = unwarp(x / parts.up, FEEDBACK_UP_SEC)
    const y = feedbackLifeY(held * feedbackHold(seconds, set.release), life)
    if (x === 0) ctx.moveTo(feedbackUpX(0, parts), y)
    else ctx.lineTo(feedbackUpX(0, parts) + x, y)
  }
  inked(ctx, ink, 1.25, 1)
  ctx.setLineDash([])
}

/** The picture at rest: the loop from the string through the amplifier and the speaker and back through the air, and under it a note's life. */
function feedbackRest(
  frame: DisplayFrame<FeedbackState>,
  parts: FeedbackParts,
  playing: boolean,
): FeedbackKnown {
  const { ctx, colours, state } = frame
  const { set } = state
  const { zone, air } = parts
  const { ink } = colours
  const lift = feedbackLift(set.gain)
  const drive = feedbackDrive(set.grit)
  const holds = feedbackHolds(lift, drive)
  const mouth = feedbackMouth(set.distance, parts)
  const right = zone.x + zone.w
  const bridge = zone.y + zone.h

  // The nut and the bridge, and the lead from the bridge to the amplifier, with the way round marked on it.
  rule(ctx, zone.x - 1, zone.y, right + 1, zone.y, { colour: ink, width: 2 })
  rule(ctx, zone.x - 1, bridge, right + 1, bridge, { colour: ink, width: 2 })
  rule(ctx, right + 1, bridge, mouth, bridge, { colour: ink })
  const middle = (right + mouth) / 2
  ctx.beginPath()
  ctx.moveTo(middle - 2.5, bridge - 3)
  ctx.lineTo(middle + 2.5, bridge)
  ctx.lineTo(middle - 2.5, bridge + 3)
  ctx.closePath()
  filled(ctx, ink, 1)

  // One amplifier for every string: how three keys, each 2 dB under the last, would share it.
  feedbackShares(FEEDBACK_KEYS, feedbackCrowdPower(set.crowd), state.shares)
  feedbackAmp(frame, parts, mouth, state.shares)

  // Wander: how far the speaker drifts either way, each key on a path of its own.
  if (set.wander > 0) {
    const most = feedbackMostOvertone(FEEDBACK_REST_HZ)
    const near = feedbackMouth(clamp(set.distance - 2.5 * set.wander, 1, most), parts) + 4
    const far = feedbackMouth(clamp(set.distance + 2.5 * set.wander, 1, most), parts) + 4
    const y = air - 14
    rule(ctx, near, y, far, y, { colour: ink, alpha: INK.back })
    rule(ctx, near, y - 2, near, y + 2, { colour: ink, alpha: INK.back })
    rule(ctx, far, y - 2, far, y + 2, { colour: ink, alpha: INK.back })
  }

  // What comes back: as much as Gain gives, as square as Grit drives it, the right a little behind the left.
  ctx.setLineDash(holds ? [] : [2, 2])
  if (set.width > 0) {
    feedbackAir(ctx, parts, mouth, set.distance, 9 * set.gain, drive, 0.1 * set.width)
    inked(ctx, ink, 1, INK.back)
  }
  feedbackAir(ctx, parts, mouth, set.distance, 9 * set.gain, drive, 0)
  inked(ctx, ink, 1.25, 1)
  ctx.setLineDash([])

  // The pick, as large as it is hard, while it waits.
  const x = right - 7
  const at = zone.y + zone.h * FEEDBACK_PICKED_AT
  if (set.pick > 0 && !playing) {
    const size = 2.5 + 5 * set.pick
    ctx.beginPath()
    ctx.moveTo(x - 7, at)
    ctx.lineTo(x - 7 - size, at - size * 0.55)
    ctx.lineTo(x - 7 - size, at + size * 0.55)
    ctx.closePath()
    filled(ctx, ink, INK.text)
  }

  // The string: standing in the overtones it may sing where Gain holds it, only pulled aside by the pick where it does not.
  const sings = feedbackKnown(state, FEEDBACK_REST_HZ)
  if (!playing) {
    const swing = holds ? 5.5 * feedbackSwing(feedbackHeld(lift, 1, 1, 1, drive)) : 0
    const pulled = holds ? 0 : 5.5 * feedbackSwing(feedbackPluck(set.pick, 1, 0, 1, 0, 0))
    feedbackStands(frame, zone, x, sings, swing, pulled, ink)
    if (swing > 0) filled(ctx, ink, INK.fill)
    // Damp: a thin wire is bright, a thick one dark.
    inked(ctx, ink, 0.75 + 1.25 * set.damp, 1)
  }
  feedbackLife(frame, parts, set, sings.need)
  return sings
}

/**
 * `Feedback::note_on` and `control`: which of the notes sound. Each one's size
 * as a share of a light goes into `state.lit`, 0 for one that is over or that
 * the device has no string for, and what the ceiling leaves of the levels
 * into `state.fit`. Returns how many sound.
 */
function feedbackHeard(state: FeedbackState, notes: readonly DisplayNote[]): number {
  const { set, sizes, chokes, lit } = state
  const lift = feedbackLift(set.gain)
  const holds = feedbackHolds(lift, feedbackDrive(set.grit))
  chokes.length = notes.length
  lit.length = notes.length
  // A key struck again while it is down lets its old string go in 30 ms.
  for (let i = 0; i < notes.length; i++) chokes[i] = graftChoked(notes, i)
  state.fit = feedbackFit(feedbackAsked(set, notes, chokes), lift)
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]
    const { need } = feedbackKnown(state, feedbackHz(note.frequency, set.sampleRate))
    const size = feedbackNote(set, note, chokes[i], state.fit, need, sizes)
    const share = shareOfDb(gainToDb(size / FEEDBACK_MOST))
    // A key that is down has a string of the device before it can be heard, if it will hold.
    const coming = note.released === null && chokes[i] === null && holds
    lit[i] = share >= DONE ? share : coming ? DONE / 2 : 0
  }
  // The device has twelve strings and gives the quietest to a new key.
  const least = loudestKept(lit, state.sorted, FEEDBACK_VOICES)
  let count = 0
  for (let i = 0; i < notes.length; i++) {
    if (lit[i] < least) lit[i] = 0
    if (lit[i] > 0) count++
  }
  return count
}

/**
 * The keys that sound, in the accent: each a string of its own, standing in
 * the overtones it may sing as far as the limiter has opened its level, and
 * pulled aside as far as its pluck still rings. Which of them leads comes out
 * of the loop and is not drawn. Each rides the line of a note's life where
 * its age puts it. The newest comes back, or null.
 */
function feedbackPlayed(
  frame: DisplayFrame<FeedbackState>,
  parts: FeedbackParts,
  count: number,
): DisplayNote | null {
  const { ctx, colours, state, notes } = frame
  const { set, sizes, chokes, lit, fit } = state
  const { zone, life } = parts
  if (count === 0) return null

  const pitch = Math.min(13, (zone.w - 2) / count)
  const room = Math.max(pitch / 2 - 1, 0.75)
  let place = 0
  let newest: DisplayNote | null = null
  for (let i = 0; i < notes.length; i++) {
    if (lit[i] <= 0) continue
    const note = notes[i]
    newest = note
    const hz = feedbackHz(note.frequency, set.sampleRate)
    const sings = feedbackKnown(state, hz)
    const size = feedbackNote(set, note, chokes[i], fit, sings.need, sizes)
    const x = zone.x + zone.w - 0.5 - pitch * (place + 0.5)
    place++
    const swing = room * feedbackSwing(sizes[1])
    const pulled = room * feedbackSwing(sizes[0])
    feedbackStands(frame, zone, x, sings, swing, pulled, colours.accent)
    if (swing > 0.3) filled(ctx, colours.accent, 0.4)
    inked(ctx, colours.accent, clamp(0.75 + 1.25 * set.damp, 0.75, pitch / 3), 1)

    const up = note.released === null ? chokes[i] : Math.max(note.released, chokes[i] ?? 0)
    dot(
      ctx,
      up === null ? feedbackDownX(note.age, parts) : feedbackUpX(Math.min(up, note.age), parts),
      feedbackLifeY(size, life),
      2,
      colours.accent,
    )
  }

  // The air carries what really sounds: the wave as large as the level that comes out, on its way to the strings.
  const loud = outShare(frame)
  if (loud > 0) {
    const mouth = feedbackMouth(set.distance, parts)
    feedbackAir(ctx, parts, mouth, set.distance, 9 * loud, feedbackDrive(set.grit), frame.now * 1.2)
    inked(ctx, colours.accent, 1.5, 1)
  }
  return newest
}

const feedback = plateDisplay<FeedbackState>({
  place: 'window',
  columns: 2,
  params: [
    'gain',
    'distance',
    'bloom',
    'grit',
    'pick',
    'crowd',
    'wander',
    'damp',
    'release',
    'width',
  ],
  live: { signal: true, notes: true },
  info: 'The loop: strings, the lead to the amplifier, the speaker and its wave back, one cycle for each overtone of Distance. A pale outline is another overtone a string may sing. The bars in the amplifier are how three keys share it; the line below is a note in time. Drag the speaker, Bloom or Release.',
  init: () => ({
    set: feedbackSetting(),
    loss: { pole: 0, gain: 0, w: 0 },
    sizes: [0, 0],
    shares: [],
    chokes: [],
    lit: [],
    sorted: [],
    fit: 1,
    known: Array.from({ length: FEEDBACK_KNOWN }, () => ({
      hz: 0,
      distance: 0,
      wander: 0,
      damp: 0,
      rate: 0,
      need: 0,
      sung: 1,
      low: 1,
      high: 1,
    })),
    turn: 0,
  }),
  draw(frame) {
    const { state } = frame
    ground(frame)
    const set = feedbackRead(frame, frame.sampleRate, state.set)
    const parts = feedbackParts(frame)
    // Whether any key sounds decides if the string at rest is drawn, so the notes are counted first and drawn last.
    const count = feedbackHeard(state, frame.notes)
    let sings = feedbackRest(frame, parts, count > 0)
    const said = feedbackPlayed(frame, parts, count)
    levelFoot(frame, parts.foot, outShare(frame))

    // The words: whether a held note holds or dies, and the overtones the newest note may sing on (the picture's own at rest).
    const holds = feedbackHolds(feedbackLift(set.gain), feedbackDrive(set.grit))
    const fate = holds ? 'Holds' : 'Dies'
    text(frame, fate, 5, 12)
    let named = ''
    if (said) {
      const hz = feedbackHz(said.frequency, set.sampleRate)
      sings = feedbackKnown(state, hz)
      named = `${pitchName(hz)} `
    }
    let words =
      sings.low === sings.high
        ? `harmonic ${sings.sung}`
        : `harmonics ${sings.low} to ${sings.high}`
    // The pitch is named where there is room for it beside the other word.
    const room = frame.width - 16 - frame.ctx.measureText(fate).width
    if (frame.ctx.measureText(named + words).width <= room) words = named + words
    if (frame.hot === 'bloom') words = `Bloom ${secondsText(set.bloom)}`
    if (frame.hot === 'release') words = `Release ${secondsText(set.release)}`
    text(frame, words, frame.width - 5, 12, { align: 'right' })

    for (const point of feedbackHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: feedbackHandles,
})

function feedbackHandles(view: DisplayView): DisplayHandle[] {
  const parts = feedbackParts(view)
  const { life } = parts
  const set = feedbackRead(view, 48000, feedbackSetting())
  const within = (param: string, value: number, low: number, high: number): number =>
    clamp(value, view.spec(param)?.min ?? low, view.spec(param)?.max ?? high)
  return [
    {
      key: 'distance',
      name: 'Distance',
      x: feedbackMouth(set.distance, parts) + 4,
      y: parts.air,
      drag: (toX) => ({ distance: within('distance', feedbackDistanceAt(toX - 4, parts), 1, 8) }),
      reset: () => ({ distance: view.spec('distance')?.default ?? 2 }),
    },
    {
      key: 'bloom',
      name: 'Bloom',
      x: feedbackDownX(set.bloom, parts),
      y: feedbackLifeY(feedbackOpening(set, set.bloom, feedbackRestNeed(set)), life),
      drag: (toX) => ({
        bloom: within('bloom', unwarp((toX - life.x) / parts.down, FEEDBACK_DOWN_SEC), 0.02, 8),
      }),
      reset: () => ({ bloom: view.spec('bloom')?.default ?? 0.5 }),
    },
    {
      key: 'release',
      name: 'Release',
      x: feedbackUpX(set.release, parts),
      y: life.y + life.h,
      drag: (toX) => ({
        release: within(
          'release',
          unwarp((toX - feedbackUpX(0, parts)) / parts.up, FEEDBACK_UP_SEC),
          0.05,
          12,
        ),
      }),
      reset: () => ({ release: view.spec('release')?.default ?? 1.5 }),
    },
  ]
}

// --- The faces ---------------------------------------------------------------

export const BODY_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  graft: { display: graft, face: ['exciter', 'body', 'pressure', 'position'] },
  afterglow: { display: afterglow, face: ['source', 'strike', 'glow', 'bloom'] },
  feedback: { display: feedback, face: ['gain', 'distance', 'grit', 'crowd'] },
}
