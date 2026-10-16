// The display of Coloured Noise: the bed over frequency, and its drift over time.
//
// The curve at the top is the bed as the device colours it: the level in each
// hertz from 20 Hz to 20 kHz, with the slope Colour gives it, the two cuts,
// and a peak at each sounding key when Tint is up. It stands still. Under it
// the drift is a slow line over four Drift times: the swells the device makes
// after a key from silence, which are the same train every time, the level of
// the bed above and the level of its top (what lies far over 700 Hz) under
// it. A dot stands where the device is in that train. No swell is shorter
// than a second, so nothing here moves in time with anything fast.
//
// Below are the rise and fall of one key, lit while a key is held, how far
// apart Width puts the two sides, and at the foot the level that comes out,
// taken over the last second.
//
// Everything is the device's own arithmetic: the colour is `kit::ColourFilter`
// of `cpp/kit/colour.h`, and the cuts, the bands at the keys, the swells and
// the darkening those of `cpp/devices/coloured-noise/coloured_noise.h`, with
// `kit::Svf`, `kit::OnePole`, `kit::Rng` and `kit::Adsr`. The device reports
// no reading, so the dot's place is worked out from the keys it was sent.

import {
  INK,
  clamp,
  dot,
  fillTo,
  freqGrid,
  ground,
  hzOfX,
  rule,
  text,
  trace,
  xOfHz,
  type Box,
  type Point,
} from '../display-kit'
import { plateDisplay, type DisplayNote, type DisplayView, type PlateFace } from '../plate-display'
import { levelFoot } from './instrument-parts'

// --- The device's numbers (`kit/colour.h`, `coloured_noise.h`, `kit/env.h`) ----

/** `ColourFilter::kSections`: first-order sections, a pole and a zero each. */
const SECTIONS = 7
/** `ColourFilter::kLowHz` and `kHighHz`: the poles stand from here to here, and the band ends there. */
const COLOUR_LOW_HZ = 20
const COLOUR_HIGH_HZ = 20000
/** `ColourFilter::kLevels`: the scale is worked out at this many Colours and read between them. */
const LEVELS = 17
/** `ColourFilter::kGrid`: the frequencies the scale is summed over. */
const GRID = 256
/** `kColourRms`: the RMS of each of the two noises at every Colour. */
export const COLOURED_NOISE_RMS = 0.2
/** `ColourFilter::End::k`: the two end filters are second-order sections of Q 0.7071. */
const END_K = Math.SQRT2
/** `kLowestHz` and `kHighestHz`: what a key may ask for. */
const LOWEST_KEY_HZ = 20
const HIGHEST_KEY_HZ = 12000
/** `kBandQ`: a key's pitch over the width of its band. */
const BAND_Q = 12
/** `kTintGain`: how many times over one key's band is added to the bed at Tint 1. */
const TINT_GAIN = 4.6
/** `kDriftLevel`: how much of the level a full swell takes at its bottom. */
const DRIFT_LEVEL = 0.65
/** `kDriftDark`: how much of what lies over the corner a full swell takes besides. */
const DRIFT_DARK = 0.5
/** `kDriftCornerHz`: the corner of the swell's darkening. */
const DRIFT_CORNER_HZ = 700
/** `kSwellShortest`: a swell lasts Drift time times a draw from this to this plus one. */
const SWELL_SHORTEST = 0.5
/** `kSwellShallowest`: a swell's depth is a draw from this to one. */
const SWELL_SHALLOWEST = 0.4
/** `kDriftSeed`: the swells are drawn from `kit::Rng` seeded with this at every key from silence. */
const DRIFT_SEED = 0xd21f7a11
/** `kCutRunOctaves`: over this much of its range before the open end a cut runs ahead of its knob. */
const CUT_RUN_OCTAVES = 0.5
/** `kCutOpenOctaves`: at the open end a cut stands this far outside its range. */
const CUT_OPEN_OCTAVES = 1
/** `kCutHighest`: no cut stands higher than this share of the sample rate. */
const CUT_HIGHEST = 0.49
/** `kCutQ`: the two sections of a fourth-order Butterworth cut. */
const CUT_Q = [0.5411961, 1.30656296]
/** `kParamMin[kLowCut]` and `kParamMax[kHighCut]`: the open ends of the two cuts. */
const LOW_CUT_OPEN_HZ = 20
const HIGH_CUT_OPEN_HZ = 20000
/** `kit::Adsr`, `kAttackTarget`: the attack aims this far above the top and is cut off where it gets there. */
const ATTACK_TARGET = 1.3
/** `kit::Adsr`, `kSixtyDb`: a release falls 60 dB in its time. */
const SIXTY_DB = 6.907755279
/** `kit::Adsr`, `kIdleLevel`: a voice has ended when its envelope is under this. */
const IDLE_LEVEL = 1e-5

// --- The colour: `kit::ColourFilter` -------------------------------------------

interface ColourModel {
  rate: number
  /** ln of the ratio between one pole and the next. */
  spacingLog: number
  /** tan(π · pole frequency / rate) for each pole, and the pole itself. */
  warped: number[]
  pole: number[]
  /** The `g` of the high pass at 20 Hz and of the low pass at 20 kHz. */
  highG: number
  lowG: number
  /** ln of the scale at each sixteenth of Colour. */
  levelLog: number[]
}

const models = new Map<number, ColourModel>()

/** `ColourFilter::zeros_for`: each pole's warped frequency times the spacing to the power Colour, mapped back. */
function zerosFor(model: ColourModel, colour: number): number[] {
  const ratio = Math.exp(model.spacingLog * colour)
  return model.warped.map((warped) => (1 - warped * ratio) / (1 + warped * ratio))
}

/** `ColourFilter::init` and `build_level_table`, for one sample rate. */
function colourModel(sampleRate: number): ColourModel {
  const rate = sampleRate > 1000 && sampleRate < 1e7 ? sampleRate : 48000
  const known = models.get(rate)
  if (known) return known
  const held = (hz: number): number => Math.tan((Math.PI * Math.min(hz, 0.49 * rate)) / rate)
  const spacingLog = Math.log(COLOUR_HIGH_HZ / COLOUR_LOW_HZ) / (SECTIONS - 1)
  const warped: number[] = []
  for (let i = 0; i < SECTIONS; i++) warped.push(held(COLOUR_LOW_HZ * Math.exp(spacingLog * i)))
  const model: ColourModel = {
    rate,
    spacingLog,
    warped,
    pole: warped.map((w) => (1 - w) / (1 + w)),
    highG: held(COLOUR_LOW_HZ),
    lowG: held(COLOUR_HIGH_HZ),
    levelLog: [],
  }
  // The gain squared of everything but the zeros, at 256 frequencies spaced by
  // ratio from 1 Hz to half the rate, each standing for a band as wide as itself.
  const lowest = (2 * Math.PI) / rate
  const logStep = Math.log(Math.PI / lowest) / GRID
  const cosine: number[] = []
  const fixed: number[] = []
  for (let n = 0; n < GRID; n++) {
    const w = lowest * Math.exp(logStep * (n + 0.5))
    const t = Math.tan(0.5 * w)
    const hx = t / model.highG
    const lx = t / model.lowG
    const high = (hx * hx * hx * hx) / ((1 - hx * hx) * (1 - hx * hx) + END_K * END_K * hx * hx)
    const low = 1 / ((1 - lx * lx) * (1 - lx * lx) + END_K * END_K * lx * lx)
    let poles = 1
    for (const pole of model.pole) poles *= 1 - 2 * pole * Math.cos(w) + pole * pole
    cosine.push(Math.cos(w))
    fixed.push((w * high * low) / poles)
  }
  for (let level = 0; level < LEVELS; level++) {
    const zero = zerosFor(model, level / (LEVELS - 1))
    let sum = 0
    for (let n = 0; n < GRID; n++) {
      let zeros = 1
      for (const z of zero) zeros *= 1 - 2 * z * cosine[n] + z * z
      sum += fixed[n] * zeros
    }
    // White noise of RMS 1/√3 in: a third of the mean of the gain squared comes out.
    const meanSquare = (sum * logStep) / Math.PI / 3
    model.levelLog.push(Math.fround(Math.log(COLOURED_NOISE_RMS) - 0.5 * Math.log(meanSquare)))
  }
  models.set(rate, model)
  return model
}

/**
 * `ColourFilter::set_colour` and `process`: what the colour filter makes of
 * white noise at `hz`, as a gain. Colour 0 is flat, and each step of a half
 * tilts it by 3 dB an octave about a level that keeps the RMS where it was.
 */
export function colouredNoiseColour(colour: number, hz: number, sampleRate: number): number {
  const model = colourModel(sampleRate)
  const c = clamp(colour, 0, 1)
  const w = (2 * Math.PI * clamp(hz, 0.01, 0.4999 * model.rate)) / model.rate
  const cosine = Math.cos(w)
  const t = Math.tan(0.5 * w)
  const zero = zerosFor(model, c)
  let power = 1
  for (let i = 0; i < SECTIONS; i++) {
    const pole = model.pole[i]
    power *= (1 - 2 * zero[i] * cosine + zero[i] * zero[i]) / (1 - 2 * pole * cosine + pole * pole)
  }
  const hx = t / model.highG
  const lx = t / model.lowG
  power *= (hx * hx * hx * hx) / ((1 - hx * hx) * (1 - hx * hx) + END_K * END_K * hx * hx)
  power /= (1 - lx * lx) * (1 - lx * lx) + END_K * END_K * lx * lx
  // The scale, read between two of the seventeen it was worked out at.
  const place = c * (LEVELS - 1)
  const index = place < LEVELS - 2 ? Math.floor(place) : LEVELS - 2
  const { levelLog } = model
  const gain = Math.exp(levelLog[index] + (levelLog[index + 1] - levelLog[index]) * (place - index))
  return gain * Math.sqrt(power)
}

// --- The cuts and the bands at the keys: `kit::Svf` -----------------------------

/** `kit::tan_prewarp`: the tangent the kit's filters are set with. */
const tanPrewarp = (x: number): number =>
  x > 0.7 ? Math.tan(x) : (x * (15 - x * x)) / (15 - 6 * x * x)

/** `kit::Svf::set`: the `g` of a filter at `hz`, which it holds between 5 Hz and 0.49 of the rate. */
const svfG = (hz: number, sampleRate: number): number =>
  tanPrewarp((Math.PI * clamp(hz, 5, 0.49 * sampleRate)) / sampleRate)

/** How far `hz` stands from a filter of that `g`, as the filter counts it: 1 at its own frequency. */
const svfX = (hz: number, g: number, sampleRate: number): number =>
  Math.tan((Math.PI * clamp(hz, 0.01, 0.4999 * sampleRate)) / sampleRate) / g

/**
 * `set_cuts`: where a cut stands, in hertz, for where its knob is. Over the
 * last half octave before the open end of its range it runs ahead of the knob,
 * and at the end itself stands an octave outside (10 Hz; 40 kHz, or 0.49 of
 * the sample rate if that is lower), where it takes nothing from the bed.
 */
export function colouredNoiseCutHz(
  which: 'low' | 'high',
  knobHz: number,
  sampleRate: number,
): number {
  const low = which === 'low'
  const highest = Math.log2(CUT_HIGHEST * sampleRate)
  const end = Math.log2(low ? LOW_CUT_OPEN_HZ : HIGH_CUT_OPEN_HZ)
  let octave = Math.log2(knobHz)
  const fromEnd = low ? octave - end : end - octave
  if (fromEnd < CUT_RUN_OCTAVES) {
    const inner = low ? end + CUT_RUN_OCTAVES : end - CUT_RUN_OCTAVES
    const open = low ? end - CUT_OPEN_OCTAVES : Math.min(end + CUT_OPEN_OCTAVES, highest)
    octave = inner + ((open - inner) * (CUT_RUN_OCTAVES - fromEnd)) / CUT_RUN_OCTAVES
  }
  return Math.pow(2, Math.min(octave, highest))
}

/** What a cut leaves at `hz`, as a gain: two sections, 24 dB an octave. Low cut takes what lies under it, High cut what lies over. */
export function colouredNoiseCut(
  which: 'low' | 'high',
  knobHz: number,
  hz: number,
  sampleRate: number,
): number {
  const x = svfX(hz, svfG(colouredNoiseCutHz(which, knobHz, sampleRate), sampleRate), sampleRate)
  let power = 1
  for (const q of CUT_Q) {
    const under = (1 - x * x) * (1 - x * x) + (x * x) / (q * q)
    power *= which === 'low' ? (x * x * x * x) / under : 1 / under
  }
  return Math.sqrt(power)
}

// --- The keys: one bed, and a band at each pitch --------------------------------

/** `kit::Adsr`: a key's level `along` its Attack (0..1): it aims above the top and arrives in the set time. */
export const colouredNoiseAttack = (along: number): number =>
  Math.min(
    1,
    ATTACK_TARGET * (1 - Math.pow((ATTACK_TARGET - 1) / ATTACK_TARGET, clamp(along, 0, 1))),
  )

/** `kit::Adsr`: a key's level `along` its Release (0..1): 60 dB down at the end of it. */
export const colouredNoiseRelease = (along: number): number =>
  Math.exp(-SIXTY_DB * clamp(along, 0, 1))

/** A key as the bed takes it: its pitch, and its envelope times its gain (`voice.amp`). */
export interface ColouredNoiseKey {
  hz: number
  level: number
}

/** How long a key that was let go at `level` of its envelope goes on, in Releases: until it is under `kIdleLevel`. */
const tailOf = (level: number): number =>
  level > IDLE_LEVEL ? Math.log(level / IDLE_LEVEL) / SIXTY_DB : 0

/**
 * One note as the device plays it now: where its envelope stands (it rises
 * over Attack to the top and stays, and from where it was let go falls 60 dB
 * over Release) times its gain. Null once its voice has ended.
 */
export function colouredNoiseKey(
  note: DisplayNote,
  attack: number,
  release: number,
): ColouredNoiseKey | null {
  const hz = clamp(note.frequency, LOWEST_KEY_HZ, HIGHEST_KEY_HZ)
  const gain = clamp(note.gain, 0, 1)
  if (note.released === null)
    return { hz, level: gain * colouredNoiseAttack(note.age / Math.max(attack, 1e-6)) }
  const top = colouredNoiseAttack((note.age - note.released) / Math.max(attack, 1e-6))
  const along = note.released / Math.max(release, 1e-6)
  if (along >= tailOf(top)) return null
  return { hz, level: gain * top * Math.exp(-SIXTY_DB * along) }
}

/** The peak one key's band stands over the bed at a Tint, as a gain: 5.6 times, 15 dB, at Tint 1. */
export const colouredNoisePeak = (tint: number): number => 1 + clamp(tint, 0, 1) * TINT_GAIN

/** A band of the bed at a pitch, and how many times over it is added to the bed. */
export interface ColouredNoiseBand {
  hz: number
  lift: number
}

/**
 * The bands Tint adds, as `process` shares them out. One key's band is added
 * `peak` times over, which lifts the power at its pitch by (1 + peak)² - 1;
 * several keys split that lift by the squares of their levels, and keys at
 * one pitch are one band of their summed power.
 */
export function colouredNoiseBands(
  keys: readonly ColouredNoiseKey[],
  tint: number,
): ColouredNoiseBand[] {
  const peak = clamp(tint, 0, 1) * TINT_GAIN
  let power = 0
  const atPitch = new Map<number, number>()
  for (const key of keys) {
    const squared = key.level * key.level
    if (!(squared > 0)) continue
    power += squared
    atPitch.set(key.hz, (atPitch.get(key.hz) ?? 0) + squared)
  }
  if (!(peak > 0) || !(power > 1e-20)) return []
  const lift = (peak * (peak + 2)) / power
  return [...atPitch].map(([hz, squared]) => ({ hz, lift: Math.sqrt(1 + lift * squared) - 1 }))
}

/**
 * What the bands make of the bed at `hz`, as a gain: the bed and each band of
 * it (`kit::Svf::bandpass` at the key, of Q `kBandQ`, unity at its centre)
 * added in step.
 */
export function colouredNoiseTint(
  bands: readonly ColouredNoiseBand[],
  hz: number,
  sampleRate: number,
): number {
  let re = 1
  let im = 0
  for (const band of bands) {
    const x = svfX(hz, svfG(band.hz, sampleRate), sampleRate)
    // jkx / (1 - x² + jkx), with k = 1 / Q.
    const a = 1 - x * x
    const b = x / BAND_Q
    const under = a * a + b * b
    re += (band.lift * b * b) / under
    im += (band.lift * a * b) / under
  }
  return Math.hypot(re, im)
}

/** The settings the bed is made of. */
export interface ColouredNoiseBed {
  colour: number
  lowCut: number
  highCut: number
}

/**
 * The bed at `hz` against flat white noise, in dB: the colour, the two cuts
 * and the bands at the keys. White noise with the cuts open is 0 dB at every
 * pitch; pink crosses it near 3 kHz and brown near 600 Hz, since every Colour
 * has one RMS.
 */
export function colouredNoiseDb(
  bed: ColouredNoiseBed,
  bands: readonly ColouredNoiseBand[],
  hz: number,
  sampleRate: number,
): number {
  const gain =
    (colouredNoiseColour(bed.colour, hz, sampleRate) / colouredNoiseColour(0, 1000, sampleRate)) *
    colouredNoiseCut('low', bed.lowCut, hz, sampleRate) *
    colouredNoiseCut('high', bed.highCut, hz, sampleRate) *
    colouredNoiseTint(bands, hz, sampleRate)
  return gain > 1e-9 ? 20 * Math.log10(gain) : -180
}

/** The Ears law of `kit/beat.h` on two unlike noises: side over mid is Width itself. */
export const colouredNoiseSideOverMid = (width: number): number => clamp(width, 0, 1)

// --- The drift: a train of swells -----------------------------------------------

/** One swell: how long it lasts in Drift times (a half to one and a half), and how deep it goes (0.4 to 1). */
export interface ColouredNoiseSwell {
  length: number
  depth: number
}

const swells: ColouredNoiseSwell[] = []
/** Where each swell begins, in Drift times since the key from silence. */
const swellStarts: number[] = [0]
let swellState = DRIFT_SEED

/** `kit::Rng::uniform`: xorshift32, its top 24 bits. */
function drawUniform(): number {
  swellState ^= swellState << 13
  swellState >>>= 0
  swellState ^= swellState >>> 17
  swellState ^= swellState << 5
  swellState >>>= 0
  return (swellState >>> 8) / 16777216
}

/**
 * `next_swell`: the swell of that number in the train every key from silence
 * begins, the first being 0. Its length is `kSwellShortest` plus a draw and
 * its depth `kSwellShallowest` plus the rest times another, from `kit::Rng`
 * seeded with `kDriftSeed`.
 */
export function colouredNoiseSwell(index: number): ColouredNoiseSwell {
  while (swells.length <= index) {
    const length = Math.fround(SWELL_SHORTEST + drawUniform())
    const depth = Math.fround(SWELL_SHALLOWEST + (1 - SWELL_SHALLOWEST) * drawUniform())
    swells.push({ length, depth })
    swellStarts.push(swellStarts[swellStarts.length - 1] + length)
  }
  return swells[index]
}

/**
 * Where the train stands `turns` Drift times after the key from silence:
 * which swell, how far through it (0..1), and how far the bed is sunk there at
 * Drift 1. A swell begins and ends at the crest and is a raised cosine between.
 */
export function colouredNoiseTrain(turns: number): { index: number; phase: number; sunk: number } {
  const t = Number.isFinite(turns) && turns > 0 ? turns : 0
  let index = 0
  while (colouredNoiseSwell(index).length + swellStarts[index] <= t) index += 1
  const swell = colouredNoiseSwell(index)
  const phase = (t - swellStarts[index]) / swell.length
  return { index, phase, sunk: swell.depth * (0.5 - 0.5 * Math.cos(2 * Math.PI * phase)) }
}

/** What a swell leaves of the level where the bed is `sunk` so far: 0.35 of it, 9 dB down, at the bottom of a full one. */
export const colouredNoiseDriftLevel = (sunk: number): number => 1 - DRIFT_LEVEL * clamp(sunk, 0, 1)

/**
 * What the swell's darkening leaves at `hz`, as a gain, besides the level:
 * `dark` of what lies over `kDriftCornerHz` is taken away (`kit::OnePole`), so
 * far over the corner half is left at the bottom of a full swell.
 */
export function colouredNoiseDriftTone(sunk: number, hz: number, sampleRate: number): number {
  const dark = DRIFT_DARK * clamp(sunk, 0, 1)
  const a = Math.exp((-2 * Math.PI * DRIFT_CORNER_HZ) / sampleRate)
  const w = (2 * Math.PI * hz) / sampleRate
  // The low pass (1 - a) / (1 - a/z), and 1 - dark · (1 - low pass).
  const under = 1 - 2 * a * Math.cos(w) + a * a
  const lowRe = ((1 - a) * (1 - a * Math.cos(w))) / under
  const lowIm = (-(1 - a) * a * Math.sin(w)) / under
  return Math.hypot(1 - dark * (1 - lowRe), dark * lowIm)
}

/**
 * How long ago the key was struck that began what sounds now, in seconds: the
 * first key after every voice had ended, which is where the device starts its
 * swells again. Null when nothing sounds. `broke` says that an earlier voice
 * of the list had ended before it, so it is known to be a start.
 */
export function colouredNoiseRun(
  notes: readonly DisplayNote[],
  attack: number,
  release: number,
): { age: number; broke: boolean } | null {
  let age = NaN
  let broke = false
  // How long ago the last voice of the run ended; under 0 while one goes on.
  let ended = Infinity
  const byStart = [...notes].sort((a, b) => b.age - a.age)
  byStart.forEach((note, n) => {
    let over = -Infinity
    if (note.released !== null) {
      const top = colouredNoiseAttack((note.age - note.released) / Math.max(attack, 1e-6))
      over = note.released - tailOf(top) * release
    }
    if (n === 0 || note.age < ended) {
      broke = n > 0
      age = note.age
      ended = over
    } else ended = Math.min(ended, over)
  })
  return Number.isFinite(age) && ended <= 0 ? { age, broke } : null
}

// --- Where things stand -------------------------------------------------------

/** The curve's scale: dB over and under flat white noise at its top and its foot. */
export const COLOURED_NOISE_TOP_DB = 36
export const COLOURED_NOISE_FOOT_DB = -36
/** The drift's line runs over this many Drift times, whatever the Drift time. */
export const COLOURED_NOISE_SPAN = 4
/** The foot of the drift's scale, dB under the crest. */
export const COLOURED_NOISE_DRIFT_FOOT_DB = -16
/** The drift's lower line is the level of the bed's top, read at this pitch. */
export const COLOURED_NOISE_TOP_HZ = 10000
/** The level is taken over this long, so it follows a swell and nothing quicker. */
export const COLOURED_NOISE_LEVEL_SEC = 1
/** The level's bar moves only when the level has moved by this share of its scale (1.2 dB). */
const LEVEL_STEP = 0.02
/** The foot of the level's scale, dB under full scale. */
const LEVEL_FLOOR_DB = -60
/** A frame that comes this long after the one before is a new start: the dot's place is worked out afresh. */
const LATE_SEC = 0.5
/** A start this much later than the one being followed is another key from silence. */
const NEW_KEY_SEC = 0.05

export interface ColouredNoiseLayout {
  /** The line the words are written on, and the ends of the words. */
  words: number
  left: number
  right: number
  /** The bed over frequency. */
  curve: Box
  /** The drift over `COLOURED_NOISE_SPAN` Drift times; `row` is where the time across it is written. */
  drift: Box
  row: number
  /** One key's rise and fall. */
  envelope: Box
  /** How far apart Width puts the two sides. */
  sides: Box
  /** The level over the last second. */
  foot: Box
}

/** Laid out from the size it is given. */
export function colouredNoiseLayout(
  view: Pick<DisplayView, 'width' | 'height'>,
): ColouredNoiseLayout {
  const { width, height } = view
  const left = 5
  const right = width - 5
  const curve: Box = { x: left, y: 15, w: right - left, h: clamp(height - 66, 12, 60) }
  const drift: Box = {
    x: left,
    y: curve.y + curve.h + 5,
    w: Math.max(12, right - left - 26),
    h: 16,
  }
  const under = drift.y + drift.h + 4
  const envelope: Box = {
    x: left,
    y: under,
    w: clamp(Math.round((right - left) * 0.56), 20, 150),
    h: 14,
  }
  const sidesX = envelope.x + envelope.w + 8
  return {
    words: 11,
    left,
    right,
    curve,
    drift,
    row: drift.y + drift.h / 2 + 3,
    envelope,
    sides: { x: sidesX, y: under, w: Math.max(12, right - sidesX), h: 14 },
    foot: { x: left, y: under + 18, w: right - left, h: 4 },
  }
}

/** How high a level of the bed stands in the curve's box, held to the box. */
export function colouredNoiseCurveY(db: number, box: Box): number {
  const share = (COLOURED_NOISE_TOP_DB - db) / (COLOURED_NOISE_TOP_DB - COLOURED_NOISE_FOOT_DB)
  return box.y + clamp(share, 0, 1) * box.h
}

/**
 * The bed across the curve's box: a point about every pixel and a half, and
 * at each band its key and the two half heights of its peak, so a peak a
 * pixel wide is drawn as high as it stands.
 */
export function colouredNoiseCurve(
  bed: ColouredNoiseBed,
  bands: readonly ColouredNoiseBand[],
  box: Box,
  sampleRate: number,
): Point[] {
  const places: number[] = []
  const steps = Math.max(8, Math.round(box.w / 1.5))
  for (let i = 0; i <= steps; i++) places.push(box.x + (i / steps) * box.w)
  for (const band of bands) {
    for (const ratio of [1 - 0.5 / BAND_Q, 1, 1 + 0.5 / BAND_Q]) {
      const x = xOfHz(band.hz * ratio, box)
      if (x > box.x && x < box.x + box.w) places.push(x)
    }
  }
  places.sort((a, b) => a - b)
  return places.map((x): Point => [
    x,
    colouredNoiseCurveY(colouredNoiseDb(bed, bands, hzOfX(x, box), sampleRate), box),
  ])
}

/** How high a level of the drift stands in its box: the crest at the top line. */
export function colouredNoiseDriftY(gain: number, box: Box): number {
  const db = gain > 1e-6 ? 20 * Math.log10(gain) : -120
  return box.y + 1 + clamp(db / COLOURED_NOISE_DRIFT_FOOT_DB, 0, 1) * (box.h - 2)
}

/**
 * The drift over one page of the train, `COLOURED_NOISE_SPAN` Drift times
 * from `from`: the time in Drift times and how far the bed is sunk there at
 * that Drift. The points stand on every crest between two swells and about
 * every pixel and a half of a box `wide` pixels across.
 */
export function colouredNoiseDriftPoints(
  from: number,
  drift: number,
  wide: number,
): [number, number][] {
  const to = from + COLOURED_NOISE_SPAN
  const times: number[] = []
  const steps = Math.max(8, Math.round(wide / 1.5))
  for (let i = 0; i <= steps; i++) times.push(from + (i / steps) * COLOURED_NOISE_SPAN)
  for (let index = colouredNoiseTrain(from).index + 1; swellStarts[index] < to; index++) {
    times.push(swellStarts[index])
    colouredNoiseSwell(index)
  }
  times.sort((a, b) => a - b)
  const deep = clamp(drift, 0, 1)
  return times.map((time) => [time, deep * colouredNoiseTrain(time).sunk])
}

/** The slope Colour gives the bed as it is written: "−3.0 dB/oct". */
export function colouredNoiseSlopeText(colour: number): string {
  const slope = 6 * clamp(colour, 0, 1)
  return `${slope >= 0.05 ? '−' : ''}${slope.toFixed(1)} dB/oct`
}

/** The peak a key's band stands over the bed as it is written: "key +15 dB". */
export function colouredNoisePeakText(tint: number): string {
  return `key +${Math.round(20 * Math.log10(colouredNoisePeak(tint)))} dB`
}

/** A length of time as it is written: "8.0 s", "36 s". */
export function colouredNoiseTimeText(seconds: number): string {
  return `${seconds < 9.95 ? seconds.toFixed(1) : String(Math.round(seconds))} s`
}

// --- The display --------------------------------------------------------------

interface ColouredNoiseState {
  /** Where the train stands, in Drift times since the key from silence; null when nothing sounds. */
  turns: number | null
  /** When that key was struck, on the frame's clock. */
  began: number
  /** The mean squares of the sound that came out in the last second, each with the time it stands for. */
  heard: { at: number; square: number; dt: number }[]
  /** The level the foot shows, as a share of its scale. */
  shown: number
}

const colouredNoise = plateDisplay<ColouredNoiseState>({
  place: 'window',
  columns: 2,
  params: [
    'colour',
    'lowCut',
    'highCut',
    'tint',
    'drift',
    'driftTime',
    'width',
    'attack',
    'release',
  ],
  live: { signal: true, notes: true },
  info: 'The bed over pitch from 20 Hz to 20 kHz: its slope, the two cuts and a peak at each sounding key. Below, the swells of the drift over four Drift times with a dot at its place, the rise and fall of a key, how far apart the sides are, and the level over the last second.',
  init: () => ({ turns: null, began: 0, heard: [], shown: 0 }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const lay = colouredNoiseLayout(frame)
    const rate = frame.sampleRate > 0 ? frame.sampleRate : 48000
    const attack = frame.value('attack')
    const release = frame.value('release')
    const tint = frame.value('tint')
    const drift = frame.value('drift')
    const driftTime = Math.max(frame.value('driftTime'), 0.01)

    // --- The bed over frequency: the colour, the cuts, a peak at each sounding key ---
    const { curve } = lay
    const bed: ColouredNoiseBed = {
      colour: frame.value('colour'),
      lowCut: frame.value('lowCut'),
      highCut: frame.value('highCut'),
    }
    const notes = frame.powered ? frame.notes : []
    const keys: ColouredNoiseKey[] = []
    const heldHz = new Set<number>()
    for (const note of notes) {
      const key = colouredNoiseKey(note, attack, release)
      if (!key) continue
      keys.push(key)
      if (note.released === null) heldHz.add(key.hz)
    }
    const bands = colouredNoiseBands(keys, tint)
    const points = colouredNoiseCurve(bed, bands, curve, rate)
    const foot = curve.y + curve.h
    freqGrid(frame, curve)
    const white = colouredNoiseCurveY(0, curve)
    rule(ctx, curve.x, white, curve.x + curve.w, white, { colour: colours.ink, alpha: INK.grid })
    fillTo(ctx, points, foot, colours.ink)
    rule(ctx, curve.x, foot, curve.x + curve.w, foot, { colour: colours.ink, alpha: INK.rule })
    trace(ctx, points, { colour: colours.ink, width: 1.5 })
    // A held key is lit on its peak for as long as it is held.
    for (const band of bands) {
      if (!heldHz.has(band.hz)) continue
      dot(
        ctx,
        xOfHz(band.hz, curve),
        colouredNoiseCurveY(colouredNoiseDb(bed, bands, band.hz, rate), curve),
        2,
        colours.accent,
        { ring: colours.ink },
      )
    }
    text(frame, colouredNoiseSlopeText(bed.colour), lay.left, lay.words)
    if (tint > 0)
      text(frame, colouredNoisePeakText(tint), lay.right, lay.words, {
        align: 'right',
        alpha: INK.text,
      })

    // --- Where the train of swells stands ---
    // The device starts its swells again at the first key after every voice
    // has ended, and a change of Drift time goes on from where the swell is.
    const run = frame.powered ? colouredNoiseRun(frame.notes, attack, release) : null
    if (!run) state.turns = null
    else {
      const began = frame.now - run.age
      const fresh =
        state.turns === null ||
        !(frame.dt > 0) ||
        frame.dt > LATE_SEC ||
        (run.broke && began > state.began + NEW_KEY_SEC)
      if (fresh) {
        state.turns = run.age / driftTime
        state.began = began
      } else state.turns = (state.turns ?? 0) + frame.dt / driftTime
    }

    // --- The drift: the level above, the level of the top under it ---
    const box = lay.drift
    const page = state.turns === null ? 0 : Math.floor(state.turns / COLOURED_NOISE_SPAN)
    const from = page * COLOURED_NOISE_SPAN
    const across = (time: number): number => box.x + ((time - from) / COLOURED_NOISE_SPAN) * box.w
    const level = (sunk: number): number => colouredNoiseDriftY(colouredNoiseDriftLevel(sunk), box)
    const top = (sunk: number): number =>
      colouredNoiseDriftY(
        colouredNoiseDriftLevel(sunk) * colouredNoiseDriftTone(sunk, COLOURED_NOISE_TOP_HZ, rate),
        box,
      )
    const train = colouredNoiseDriftPoints(from, drift, box.w)
    rule(ctx, box.x, box.y + box.h, box.x + box.w, box.y + box.h, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    for (let turn = 0; turn <= COLOURED_NOISE_SPAN; turn++) {
      const x = box.x + (turn / COLOURED_NOISE_SPAN) * box.w
      rule(ctx, x, box.y + box.h - 3, x, box.y + box.h, { colour: colours.ink, alpha: INK.rule })
    }
    if (drift > 0)
      trace(
        ctx,
        train.map(([time, sunk]): Point => [across(time), top(sunk)]),
        { colour: colours.ink, width: 1, alpha: INK.back },
      )
    trace(
      ctx,
      train.map(([time, sunk]): Point => [across(time), level(sunk)]),
      { colour: colours.ink, width: 1.25 },
    )
    if (state.turns !== null && drift > 0)
      dot(
        ctx,
        across(state.turns),
        level(clamp(drift, 0, 1) * colouredNoiseTrain(state.turns).sunk),
        2.5,
        colours.accent,
        { ring: colours.ink },
      )
    text(frame, colouredNoiseTimeText(COLOURED_NOISE_SPAN * driftTime), lay.right, lay.row, {
      align: 'right',
      alpha: INK.text,
    })

    // --- One key's rise and fall, lit while a key is held ---
    const { envelope } = lay
    const base = envelope.y + envelope.h - 0.5
    const peak = envelope.y + 1.5
    const rise = Math.max(1.5, frame.at('attack') * 0.42 * envelope.w)
    const fall = Math.max(1.5, frame.at('release') * 0.42 * envelope.w)
    const letGo = envelope.x + envelope.w - fall
    const rising: Point[] = []
    const falling: Point[] = []
    for (let i = 0; i <= 12; i++) {
      rising.push([
        envelope.x + (i / 12) * rise,
        base - colouredNoiseAttack(i / 12) * (base - peak),
      ])
      falling.push([letGo + (i / 12) * fall, base - colouredNoiseRelease(i / 12) * (base - peak)])
    }
    const whole: Point[] = [...rising, ...falling]
    fillTo(ctx, whole, base, colours.ink)
    rule(ctx, envelope.x, base, envelope.x + envelope.w, base, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    trace(ctx, whole, { colour: colours.ink, width: 1 })
    if (notes.some((note) => note.released === null))
      trace(ctx, [...rising, falling[0]], { colour: colours.accent, width: 1.5 })
    if (notes.some((note) => note.released !== null && note.released < release))
      trace(ctx, falling, { colour: colours.accent, width: 1.5 })

    // --- How far apart the two sides are: nothing at Width 0, from end to end at 1 ---
    const { sides } = lay
    const middle = sides.x + sides.w / 2
    const line = sides.y + sides.h / 2
    const half = Math.max(2, sides.w / 2 - 9)
    const reach = colouredNoiseSideOverMid(frame.value('width')) * half
    text(frame, 'L', sides.x, line + 3, { alpha: INK.text })
    text(frame, 'R', sides.x + sides.w, line + 3, { align: 'right', alpha: INK.text })
    for (const end of [middle - half, middle + half])
      rule(ctx, end, line - 2, end, line + 2, { colour: colours.ink, alpha: INK.rule })
    rule(ctx, middle, line - 4, middle, line + 4, { colour: colours.ink, alpha: INK.back })
    if (reach > 0)
      trace(
        ctx,
        [
          [middle - reach, line],
          [middle + reach, line],
        ],
        { colour: colours.ink, width: 2 },
      )

    // --- The level that comes out, over the last second ---
    // Each frame's reading stands for the time since the frame before it, and
    // the mean is taken over the whole second, so time with nothing read counts
    // as silence and a level that pulses is read as its mean.
    const rms = frame.powered && frame.signal ? frame.signal.output.rms : NaN
    if (!Number.isFinite(rms) || !(frame.dt >= 0) || frame.dt > COLOURED_NOISE_LEVEL_SEC) {
      state.heard = []
      state.shown = 0
    } else {
      if (frame.dt > 0) state.heard.push({ at: frame.now, square: rms * rms, dt: frame.dt })
      const since = frame.now - COLOURED_NOISE_LEVEL_SEC
      state.heard = state.heard.filter((one) => one.at > since && one.at <= frame.now)
      let sum = 0
      for (const one of state.heard) sum += one.square * Math.min(one.dt, one.at - since)
      const mean = sum / COLOURED_NOISE_LEVEL_SEC
      const db = mean > 1e-12 ? 10 * Math.log10(mean) : LEVEL_FLOOR_DB
      const share = clamp(1 - db / LEVEL_FLOOR_DB, 0, 1)
      // The bar moves when the level has moved by a step, and to its ends.
      const end = share <= 0 || share >= 1
      if (Math.abs(share - state.shown) > LEVEL_STEP || (end && share !== state.shown))
        state.shown = share
    }
    levelFoot(frame, lay.foot, state.shown)
  },
})

export const COLOURED_NOISE_FACES: Readonly<Record<string, PlateFace>> = {
  'coloured-noise': {
    display: colouredNoise,
    face: ['colour', 'lowCut', 'highCut', 'drift'],
    sections: [
      ['colour', 'lowCut', 'highCut', 'tint'],
      ['drift', 'driftTime', 'width'],
      ['attack', 'release', 'volume'],
    ],
  },
}
