// Displays of the invented instruments that are made of voices.
//
// Overtone is one drone whose mouth picks single harmonics out of it, so its
// display is the ladder of those harmonics, each as strong as the body of the
// voice leaves it, under the mouth's resonance. Flock is a handful of small
// voices that fly in to a key, hover and scatter, so its display is the life
// of one flock from the key down to the last bird gone. Both draw what the
// knobs set from the device's own figures. Where the device draws lots (which
// rung the walk is on, where one bird starts) the picture shows the bounds and
// a still sample of the shape, and the light on it says only what is certain.

import { denormalizeParam } from '../../../core/params'
import {
  INK,
  clamp,
  dot,
  fillRect,
  gainToDb,
  ground,
  handle,
  label,
  lerp,
  rule,
  trace,
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
import { airEnvelope, chance } from './instrument-air'
import { levelFoot, outShare, pitchName } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>
type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>

const TAU = Math.PI * 2

// --- What the two share ------------------------------------------------------

/**
 * Where voices stand between the speakers, on the foot: the foot is the level
 * that comes out, filling from the middle, and its two ends are left and
 * right. A notch at each of `count` places (-1 to 1) read from `places`.
 */
function footPlaces(frame: Paint, foot: Box, places: ArrayLike<number>, count: number): void {
  const { ctx, colours } = frame
  ctx.beginPath()
  for (let index = 0; index < count; index++) {
    const x = Math.round(foot.x + 1 + ((clamp(places[index], -1, 1) + 1) / 2) * (foot.w - 3)) + 0.5
    ctx.moveTo(x, foot.y + 1)
    ctx.lineTo(x, foot.y + foot.h - 1)
  }
  ctx.globalAlpha = INK.text
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.globalAlpha = 1
}

/** A number in a response that is carried from filter to filter: its two parts. */
interface Phasor {
  re: number
  im: number
}

/** `kit::OnePole::lowpass` at `ratio` times its corner: 1 / (1 + j ratio). */
function throughLow(z: Phasor, ratio: number): void {
  const size = 1 + ratio * ratio
  const re = (z.re + z.im * ratio) / size
  z.im = (z.im - z.re * ratio) / size
  z.re = re
}

/**
 * `kit::Svf::bandpass` at `ratio` times its centre, 1 at the centre:
 * j ratio k / (1 - ratio² + j ratio k) with k = 1 / q. The number is
 * multiplied by 1 + `gain` times that, or by that alone with `alone`.
 */
function throughBand(z: Phasor, ratio: number, q: number, gain: number, alone = false): void {
  const a = ratio / q
  const d = 1 - ratio * ratio
  const size = d * d + a * a
  const re = (alone ? 0 : 1) + (gain * a * a) / size
  const im = (gain * a * d) / size
  const was = z.re
  z.re = was * re - z.im * im
  z.im = was * im + z.im * re
}

// --- Overtone ----------------------------------------------------------------

/** `overtone.h`, `kColours`: the body of each Voice. The ratios are multiples of the note. */
const OVERTONE_VOICES = [
  {
    name: 'Throat',
    even: 1,
    tilt: 1.2,
    thin: 0,
    formantHz: 560,
    formantQ: 3.5,
    formantGain: 1.6,
    darkHz: 2800,
    level: 1,
  },
  {
    name: 'Pipe',
    even: 0.3,
    tilt: 0.9,
    thin: 0,
    formantHz: 380,
    formantQ: 2.5,
    formantGain: 1,
    darkHz: 1500,
    level: 1.25,
  },
  {
    name: 'Reed',
    even: 1,
    tilt: 2.5,
    thin: 0.35,
    formantHz: 1500,
    formantQ: 2,
    formantGain: 1.2,
    darkHz: 6000,
    level: 0.68,
  },
] as const
/** `overtone.h`, `kThinRatio` and `kDarkRatio`. */
const OVERTONE_THIN_RATIO = 2.5
const OVERTONE_DARK_RATIO = 2.5
/** `overtone.h`, `kLadder`: the harmonics the walk steps on, the ones that land on a key. */
export const OVERTONE_LADDER: readonly number[] = [3, 4, 5, 6, 8, 9, 10, 12, 16]
/** `overtone.h`, `kMaxReach`, `kWhistleTopHz`, `kFullReach`, `kLeastReach`, `kHighLift`. */
const OVERTONE_REACH_MOST = 3
const OVERTONE_WHISTLE_TOP_HZ = 4000
const OVERTONE_FULL_REACH = 8
const OVERTONE_LEAST_REACH = 0.3
const OVERTONE_HIGH_LIFT = 1.3
/** `overtone.h`, `kWideBand`, `kSharpBand`, `kMouthTiltRatio`, `kWhistleSoft`, `kWhistleSharp`, `kDroneGiveWay`. */
const OVERTONE_WIDE_BAND = 4
const OVERTONE_SHARP_BAND = 0.6
const OVERTONE_MOUTH_TILT = 1
const OVERTONE_WHISTLE_SOFT = 0.3
const OVERTONE_WHISTLE_SHARP = 1.5
const OVERTONE_GIVE_WAY = 0.3
/** `overtone.h`, `kGrowlGain`, `kBodyAir`, `kWhistleAir`. */
const OVERTONE_GROWL_GAIN = 0.8
const OVERTONE_BODY_AIR = 6
const OVERTONE_WHISTLE_AIR = 24
/** `overtone.h`, `kVibratoHz`, `kVibratoCents`, `kVibratoDelay`, `kVibratoRise`. */
const OVERTONE_VIBRATO_HZ = 5.2
const OVERTONE_VIBRATO_CENTS = 40
const OVERTONE_VIBRATO_DELAY = 0.2
const OVERTONE_VIBRATO_RISE = 0.5
/** `overtone.h`, `kWhistlePan`, `kDronePan`, `kMaxVoices`. */
const OVERTONE_WHISTLE_PAN = 0.75
const OVERTONE_DRONE_PAN: readonly number[] = [0, -0.4, 0.4, -0.65, 0.65, 0]
const OVERTONE_NOTES_MOST = 6
/** `overtone.h`, `kTopHz`, `kTopOfRate`, `kPitchMargin`: where the train of harmonics stops. */
const OVERTONE_TOP_HZ = 16000
const OVERTONE_TOP_OF_RATE = 0.42
const OVERTONE_PITCH_MARGIN = 1.05
/** `kit::Adsr`, `kIdleLevel` and its 60 dB: under this a voice is no longer counted as sounding. */
const ADSR_IDLE = 1e-5
const ADSR_SIXTY_DB = 6.907755279

const overtoneVoice = (voice: number) =>
  OVERTONE_VOICES[clamp(Math.round(voice), 0, OVERTONE_VOICES.length - 1)]

/** `Overtone::start`, `terms`: how many harmonics the train of a note at `hz` has. */
export function overtoneTerms(hz: number, sampleRate: number): number {
  const top = Math.min(OVERTONE_TOP_HZ, OVERTONE_TOP_OF_RATE * sampleRate)
  return Math.max(1, Math.floor(top / (hz * OVERTONE_PITCH_MARGIN)))
}

/** `Overtone::start`, `reach`: the whistle's share on a note too high for most harmonics. */
export function overtoneWhistleShare(hz: number): number {
  const fit = OVERTONE_WHISTLE_TOP_HZ / (hz * OVERTONE_FULL_REACH)
  return clamp(fit * fit, OVERTONE_LEAST_REACH, 1)
}

/** `Overtone::home_rung`: the rung of the ladder nearest the Overtone knob. */
export function overtoneHome(knob: number): number {
  let best = 0
  for (let rung = 1; rung < OVERTONE_LADDER.length; rung++)
    if (Math.abs(OVERTONE_LADDER[rung] - knob) < Math.abs(OVERTONE_LADDER[best] - knob)) best = rung
  return best
}

/** `Overtone::reach`: how many rungs either side of home Wander lets the walk go. */
export function overtoneReach(wander: number): number {
  if (wander <= 0) return 0
  return clamp(Math.ceil(wander * OVERTONE_REACH_MOST), 1, OVERTONE_REACH_MOST)
}

/**
 * `Overtone::harmonic_for`: the harmonic a note at `hz` whistles when `asked`
 * for one. A high note cannot reach the upper ones: what is asked comes down
 * by octaves while it is even, else to the highest rung that fits.
 */
export function overtoneHarmonicFor(asked: number, hz: number): number {
  const top = Math.max(1, Math.floor(OVERTONE_WHISTLE_TOP_HZ / hz))
  let k = asked
  if (k <= top) return k
  while (k > top && k >= 2 && k % 2 === 0) k *= 0.5
  if (k <= top) return k
  for (let rung = OVERTONE_LADDER.length - 1; rung >= 0; rung--)
    if (OVERTONE_LADDER[rung] <= top) return OVERTONE_LADDER[rung]
  return top
}

/** `Overtone::control`, `band_`: the mouth's bandwidth as a share of the note. */
export function overtoneBand(focus: number): number {
  return OVERTONE_WIDE_BAND * Math.pow(OVERTONE_SHARP_BAND / OVERTONE_WIDE_BAND, clamp(focus, 0, 1))
}

/** Kept between calls, so no response makes a number of its own. */
const DRONE: Phasor = { re: 0, im: 0 }
const WHISTLE: Phasor = { re: 0, im: 0 }
const THINNED: Phasor = { re: 0, im: 0 }

/**
 * `Overtone::render` after the source and `tune`'s gain for the drone: what
 * the body of a Voice does to a frequency `x` times the note. The bottom is
 * thinned, the formant stands over the rest, the last low-pass darkens it,
 * and the drone gives way a little as Focus sharpens the whistle.
 */
function overtoneBody(z: Phasor, voice: number, hz: number, x: number, focus: number): void {
  const colour = overtoneVoice(voice)
  const share = overtoneWhistleShare(hz)
  if (colour.thin > 0) {
    THINNED.re = z.re
    THINNED.im = z.im
    throughLow(THINNED, x / OVERTONE_THIN_RATIO)
    z.re -= colour.thin * share * THINNED.re
    z.im -= colour.thin * share * THINNED.im
  }
  throughBand(z, (x * hz) / colour.formantHz, colour.formantQ, colour.formantGain)
  throughLow(z, (x * hz) / Math.max(colour.darkHz, OVERTONE_DARK_RATIO * hz))
  const gain =
    colour.level * (1 - OVERTONE_GIVE_WAY * focus) * (1 + OVERTONE_HIGH_LIFT * (1 - share))
  z.re *= gain
  z.im *= gain
}

/** `Overtone::render`, `source`: the body's share of harmonic `n`, the even ones weighted. */
const overtoneWeight = (voice: number, n: number): number =>
  n < 1 ? 0 : n % 2 === 0 ? overtoneVoice(voice).even : 1

/**
 * `Overtone::render`, the drone: how strong harmonic `n` of a note at `hz`
 * comes out of the body, 1 being a harmonic of the bare train. Its phase is
 * left in `into` for the whistle to be added to.
 */
export function overtoneDrone(
  voice: number,
  hz: number,
  n: number,
  focus: number,
  into: Phasor = DRONE,
): number {
  into.re = overtoneWeight(voice, n)
  into.im = 0
  throughLow(into, n / overtoneVoice(voice).tilt)
  overtoneBody(into, voice, hz, n, focus)
  return Math.hypot(into.re, into.im)
}

/**
 * `Overtone::render`, Growl: every other pulse stronger adds a rattle half
 * way between harmonics `m` and `m + 1`, half of each of the two times
 * `kGrowlGain` times the knob. Its level after the body, as `overtoneDrone`.
 */
export function overtoneRattle(
  voice: number,
  hz: number,
  m: number,
  growl: number,
  focus: number,
): number {
  DRONE.re =
    OVERTONE_GROWL_GAIN * growl * 0.5 * (overtoneWeight(voice, m) + overtoneWeight(voice, m + 1))
  DRONE.im = 0
  throughLow(DRONE, (m + 0.5) / overtoneVoice(voice).tilt)
  overtoneBody(DRONE, voice, hz, m + 0.5, focus)
  return Math.hypot(DRONE.re, DRONE.im)
}

/**
 * `Overtone::render` and `tune`, the whistle: what the mouth on harmonic `k`
 * lets through of a frequency `x` times the note: the tilt from the note up,
 * two resonators as wide as Focus leaves them, and the whistle's gain, which
 * gives harmonic `k` its level back.
 */
export function overtoneWhistle(
  hz: number,
  x: number,
  k: number,
  focus: number,
  into: Phasor = WHISTLE,
): number {
  into.re = 1
  into.im = 0
  throughLow(into, x / OVERTONE_MOUTH_TILT)
  const q = Math.max(k / overtoneBand(focus), 0.7)
  throughBand(into, x / k, q, 1, true)
  throughBand(into, x / k, q, 1, true)
  const lift = k / OVERTONE_MOUTH_TILT
  const gain =
    lerp(OVERTONE_WHISTLE_SOFT, OVERTONE_WHISTLE_SHARP, clamp(focus, 0, 1)) *
    Math.sqrt(1 + lift * lift) *
    clamp(Math.sqrt(8 / k), 0.7, 1.4) *
    overtoneWhistleShare(hz)
  into.re *= gain
  into.im *= gain
  return Math.hypot(into.re, into.im)
}

/** Harmonic `n` as it comes out, drone and whistle together; the drone alone while `k` is 0. */
export function overtoneLevel(
  voice: number,
  hz: number,
  n: number,
  k: number,
  focus: number,
): number {
  const drone = overtoneDrone(voice, hz, n, focus)
  if (!(k > 0)) return drone
  overtoneWhistle(hz, n, k, focus)
  return Math.hypot(DRONE.re + WHISTLE.re, DRONE.im + WHISTLE.im)
}

/**
 * `Overtone::render`, Breath: the air around `x` times the note, as loud as
 * the noise in a band one harmonic wide stands against a harmonic of the
 * train. The same noise goes through the body (`kBodyAir`) and through the
 * mouth (`kWhistleAir`, scaled with the note in `start`), so the two add.
 * White noise between -1 and 1 has a third of full power over half the rate,
 * and a harmonic of the train has amplitude 2: a band of `hz` is the root of
 * hz / 144000 against it. The knob is squared. With `k` at 0 it is the air
 * through the body alone.
 */
export function overtoneAir(
  voice: number,
  hz: number,
  x: number,
  k: number,
  focus: number,
  breath: number,
): number {
  DRONE.re = OVERTONE_BODY_AIR
  DRONE.im = 0
  overtoneBody(DRONE, voice, hz, x, focus)
  if (k > 0) {
    const trim = OVERTONE_WHISTLE_AIR * clamp(Math.sqrt(220 / hz), 0.3, 2.5)
    overtoneWhistle(hz, x, k, focus)
    DRONE.re += trim * WHISTLE.re
    DRONE.im += trim * WHISTLE.im
  }
  return breath * breath * Math.sqrt(hz / 144000) * Math.hypot(DRONE.re, DRONE.im)
}

/** `Overtone::tune`: the cents vibrato bends a note `age` seconds old, `turns` being the turns of the instrument's one vibrato. */
export function overtoneVibratoCents(age: number, vibrato: number, turns: number): number {
  const onset = clamp((age - OVERTONE_VIBRATO_DELAY) / OVERTONE_VIBRATO_RISE, 0, 1)
  return OVERTONE_VIBRATO_CENTS * vibrato * onset * onset * (3 - 2 * onset) * Math.sin(TAU * turns)
}

/**
 * `Overtone::note_on` and `restart`: the walk and the vibrato start again
 * with the first note after a silence and run for as long as any voice
 * sounds. The seconds since that first note, from the notes that were sent;
 * -1 while nothing sounds. A voice is counted until its release is 100 dB
 * down (`kit::Adsr`), so a note that began in another's tail is one stretch
 * with it.
 */
export function overtoneStretch(
  notes: readonly DisplayNote[],
  attack: number,
  release: number,
): number {
  let since = -1
  // How long from now the stretch still sounds: under 0 it is over.
  let left = -1
  for (const note of notes) {
    let ends = Infinity
    if (note.released !== null) {
      const top = airEnvelope(Math.max(0, note.age - note.released), null, attack, release)
      const tail = top > ADSR_IDLE ? (release * Math.log(top / ADSR_IDLE)) / ADSR_SIXTY_DB : 0
      ends = tail - note.released
    }
    if (since < 0 || -note.age > left) {
      since = note.age
      left = ends
    } else left = Math.max(left, ends)
  }
  return left > 0 ? since : -1
}

/** The harmonics the ladder shows, with room either side for the mouth's skirts, and the levels its rungs span. */
const OVERTONE_SHOWN = 16
const OVERTONE_FROM = 0.2
const OVERTONE_TO = 17
const OVERTONE_TOP_DB = 8
const OVERTONE_FLOOR_DB = -40
/** The note the ladder is drawn for while none sounds: the A an octave and a third under middle C. */
const OVERTONE_REST_HZ = 110
/** Under this a note is out: 60 dB down. */
const OVERTONE_DONE = 0.001
/**
 * `WasmDevice` forgets a key a minute after it was let go, and a release is
 * 100 dB down within 20 seconds at its longest. So a stretch whose first
 * known note is younger than the difference began with that note for certain,
 * unless the list is full: it keeps 128 notes (`PLAYED_MOST`) and drops the
 * oldest that was let go for a new one, however young, and a held one when
 * all 128 are held.
 */
const OVERTONE_SURE_SECONDS = 40
const OVERTONE_NOTES_KEPT = 128
/**
 * The walk is read from the sound when one rung's pattern is within so many
 * dB of the spectrum, on the mean, and nearer than any other's by so many;
 * the reading is kept this long.
 */
const OVERTONE_FIT_DB = 5
const OVERTONE_HEARD_DB = 3
const OVERTONE_HEARD_SECONDS = 0.4

interface OvertoneParts {
  /** The rungs: harmonic `OVERTONE_FROM` at `x`, their feet at `y + h`, `OVERTONE_TOP_DB` at `y`. */
  rungs: Box
  /** The height of the row of stones the walk steps on, and of the line that spans its reach. */
  stones: number
  span: number
  foot: Box
}

function overtoneParts(view: Size): OvertoneParts {
  return {
    rungs: { x: 5, y: 15, w: view.width - 10, h: view.height - 15 - 27 },
    stones: view.height - 21.5,
    span: view.height - 15.5,
    foot: { x: 4, y: view.height - 11, w: view.width - 8, h: 6 },
  }
}

const overtoneX = (harmonic: number, rungs: Box): number =>
  rungs.x + ((harmonic - OVERTONE_FROM) / (OVERTONE_TO - OVERTONE_FROM)) * rungs.w
const overtoneHarmonicAt = (x: number, rungs: Box): number =>
  OVERTONE_FROM + ((x - rungs.x) / rungs.w) * (OVERTONE_TO - OVERTONE_FROM)
/** How high a level stands on the rungs, 0 at their feet. */
const overtoneShare = (level: number): number =>
  clamp((gainToDb(level) - OVERTONE_FLOOR_DB) / (OVERTONE_TOP_DB - OVERTONE_FLOOR_DB), 0, 1)

/** A rate as it is said: "0.6 Hz", "0.15 Hz", "3 Hz". */
const paceText = (hz: number): string =>
  `${hz.toFixed(hz < 0.995 ? 2 : 1).replace(/\.?0+$/, '')} Hz`

/** A harmonic as it is said with the key it lands on; a mark before the ones that fall between the keys. */
function harmonicText(k: number, hz: number): string {
  const pitch = k * hz
  const off = 1200 * Math.log2(pitch / 440) + 6000
  const between = Math.abs(off - Math.round(off / 100) * 100) > 20
  const number = Number.isInteger(k) ? String(k) : k.toFixed(1)
  return `×${number} ${between ? '~' : ''}${pitchName(pitch)}`
}

/** The analyser's window, `bins` off a tone: how much of the tone a bin that far away reads. */
function analyserLobe(bins: number): number {
  const kernel = (d: number): number =>
    Math.abs(d) < 1e-6 ? 1 : Math.sin(Math.PI * d) / (Math.PI * d)
  return Math.abs(
    kernel(bins) +
      (0.25 / 0.42) * (kernel(bins - 1) + kernel(bins + 1)) +
      (0.04 / 0.42) * (kernel(bins - 2) + kernel(bins + 2)),
  )
}

/** The bins the walk is looked for in and what each reads, kept between frames: seven rungs of six notes at most. */
const HEARD_BIN = new Int32Array(42)
const HEARD_DB = new Float32Array(42)
const HEARD_EXPECTED = new Float32Array(42)
/** A bin this far under the loudest one read is as good as silent. */
const HEARD_DEPTH_DB = 45

/**
 * What the spectrum would read in bin `bin` with the mouth asked for
 * `asked`: every sounding note's harmonics that fall in the bin, and its air
 * there, each as loud as the note (`levels`). In dB, on a scale of its own.
 */
function overtoneExpected(
  bin: number,
  binHz: number,
  asked: number,
  pitches: ArrayLike<number>,
  levels: ArrayLike<number>,
  count: number,
  voice: number,
  focus: number,
  breath: number,
  sampleRate: number,
): number {
  let power = 0
  for (let index = 0; index < count; index++) {
    const hz = pitches[index]
    const k = overtoneHarmonicFor(asked, hz)
    const terms = overtoneTerms(hz, sampleRate)
    const nearest = Math.round((bin * binHz) / hz)
    for (let n = Math.max(1, nearest - 1); n <= Math.min(terms, nearest + 1); n++) {
      const off = Math.abs((n * hz) / binHz - bin)
      if (off >= 3) continue
      const size = levels[index] * overtoneLevel(voice, hz, n, k, focus) * analyserLobe(off)
      power += size * size
    }
    // The window gathers noise from 1.73 bins; `overtoneAir` is the air in a band as wide as the note.
    const air =
      levels[index] *
      overtoneAir(voice, hz, (bin * binHz) / hz, k, focus, breath) *
      Math.sqrt((1.73 * binHz) / hz)
    power += air * air
  }
  return 10 * Math.log10(Math.max(power, 1e-12))
}

/**
 * Which rung of the ladder the mouth is on, read from the sound: -1 when the
 * sound does not say. After its first step the walk is on one of the rungs
 * within reach of home, by lots nobody outside the device can follow. So the
 * spectrum is read where each sounding note would whistle on each of those
 * rungs, and compared with what the device's own figures would put there for
 * each rung in turn. The rung whose pattern fits is taken if it fits within
 * `OVERTONE_FIT_DB` and better than any other by `OVERTONE_HEARD_DB`.
 */
export function overtoneHeard(
  bins: Float32Array,
  binHz: number,
  pitches: ArrayLike<number>,
  levels: ArrayLike<number>,
  count: number,
  voice: number,
  focus: number,
  breath: number,
  home: number,
  reach: number,
  sampleRate: number,
): number {
  if (!(binHz > 0) || count <= 0) return -1
  const from = Math.max(0, home - reach)
  const to = Math.min(OVERTONE_LADDER.length - 1, home + reach)
  let probes = 0
  let loudest = -Infinity
  for (let index = 0; index < count; index++) {
    for (let rung = from; rung <= to && probes < HEARD_BIN.length; rung++) {
      const hz = pitches[index]
      const bin = Math.round((overtoneHarmonicFor(OVERTONE_LADDER[rung], hz) * hz) / binHz)
      if (bin < 1 || bin >= bins.length || !Number.isFinite(bins[bin])) continue
      HEARD_BIN[probes] = bin
      HEARD_DB[probes] = bins[bin]
      loudest = Math.max(loudest, bins[bin])
      probes++
    }
  }
  if (probes < 2) return -1
  let best = -1
  let least = Infinity
  let next = Infinity
  for (let rung = from; rung <= to; rung++) {
    // The two scales differ by an amount nobody knows: only the pattern is compared.
    let apart = 0
    let top = -Infinity
    for (let probe = 0; probe < probes; probe++) {
      const expected = overtoneExpected(
        HEARD_BIN[probe],
        binHz,
        OVERTONE_LADDER[rung],
        pitches,
        levels,
        count,
        voice,
        focus,
        breath,
        sampleRate,
      )
      HEARD_EXPECTED[probe] = expected
      top = Math.max(top, expected)
    }
    for (let probe = 0; probe < probes; probe++) {
      HEARD_EXPECTED[probe] = Math.max(HEARD_EXPECTED[probe], top - HEARD_DEPTH_DB)
      apart += Math.max(HEARD_DB[probe], loudest - HEARD_DEPTH_DB) - HEARD_EXPECTED[probe]
    }
    apart /= probes
    let error = 0
    for (let probe = 0; probe < probes; probe++) {
      const miss =
        Math.max(HEARD_DB[probe], loudest - HEARD_DEPTH_DB) - HEARD_EXPECTED[probe] - apart
      error += miss * miss
    }
    error = Math.sqrt(error / probes)
    if (error < least) {
      next = least
      least = error
      best = rung
    } else if (error < next) next = error
  }
  return least <= OVERTONE_FIT_DB && next - least >= OVERTONE_HEARD_DB ? best : -1
}

interface OvertoneState {
  /** The clock (`frame.now`) at which the stretch that sounds began, NaN while nothing sounds, and whether that is certain. */
  startedAt: number
  sure: boolean
  /** The walk's own clock since then, in steps: `walk_phase_` and the steps it has made. */
  steps: number
  /** Pace as it has stood since the stretch began, NaN once it has moved. */
  paced: number
  /** The rung last read from the sound, -1 for none, and when. */
  heard: number
  heardAt: number
  /** The notes that sound, low to high: where each is in `frame.notes`, its level, its pitch. */
  index: Int16Array
  level: Float32Array
  pitch: Float32Array
  /** The harmonic the mouth is asked for on this frame (0 while only the device knows), home's rung and the walk's reach. */
  asked: number
  home: number
  reach: number
  places: Float32Array
}

/**
 * `Overtone::control`, `aim` and `step_walk`: where the mouth is asked to be,
 * written into the state as a harmonic, or 0 while only the device knows.
 * With Wander at 0 it is the knob. With Wander up it is home until the walk's
 * first step, 1 / Pace after the first note of the stretch; from then on the
 * walk's lots decide, and the display takes the rung it reads from the sound.
 */
function overtoneMouth(frame: DisplayFrame<OvertoneState>, lit: number): void {
  const { state } = frame
  const knob = frame.value('overtone')
  const home = overtoneHome(knob)
  const reach = overtoneReach(frame.value('wander'))
  state.home = home
  state.reach = reach
  state.asked = reach === 0 ? knob : OVERTONE_LADDER[home]
  // Before the first step it is home for certain only if the stretch is known from its first note.
  if (reach === 0 || lit === 0 || (state.sure && state.steps < 1)) return
  const bins = frame.signal?.spectrum
  const read = bins
    ? overtoneHeard(
        bins,
        frame.signal?.binHz ?? 0,
        state.pitch,
        state.level,
        lit,
        frame.value('voice'),
        frame.value('focus'),
        frame.value('breath'),
        home,
        reach,
        frame.sampleRate,
      )
    : -1
  if (read >= 0) {
    state.heard = read
    state.heardAt = frame.now
  } else if (frame.now - state.heardAt > OVERTONE_HEARD_SECONDS) state.heard = -1
  // A rung heard before the knobs moved the reach is no longer one the walk can be on.
  if (Math.abs(state.heard - home) > reach) state.heard = -1
  state.asked = state.heard >= 0 ? OVERTONE_LADDER[state.heard] : 0
}

/** The notes that sound, into the state, low to high; how many. The walk's clock is kept on the way. */
function overtoneSounding(frame: DisplayFrame<OvertoneState>): number {
  const { state, notes } = frame
  const attack = frame.value('attack')
  const release = frame.value('release')
  const stretch = frame.powered ? overtoneStretch(notes, attack, release) : -1
  if (stretch < 0) {
    state.startedAt = NaN
    state.heard = -1
    return 0
  }
  // A stretch that began since the frame before is a new one, seen from its first note. One whose
  // beginning only moved later under a display that was watching is the one followed so far with
  // its first notes forgotten: the clock goes on as it was. Any other is taken as it is found,
  // and its beginning is certain only by what the list of notes can still say.
  const began = frame.now - stretch
  const pace = frame.value('pace')
  const watched = frame.dt > 0 && frame.dt <= 0.25
  const fresh = watched && began > frame.now - frame.dt - 0.05
  const same = Math.abs(began - state.startedAt) <= 0.05
  const followed = same || (watched && !fresh && began > state.startedAt)
  if (!followed) {
    state.startedAt = began
    state.sure = fresh || (stretch < OVERTONE_SURE_SECONDS && notes.length < OVERTONE_NOTES_KEPT)
    state.heard = -1
    state.paced = pace
  } else if (pace !== state.paced) state.paced = NaN
  // `walk_phase_` runs at Pace as the knob stands. A frame that did not follow the last is counted
  // from the start, which is right only while Pace has stood still since: if not, the clock is lost.
  if (followed && watched) state.steps += pace * frame.dt
  else {
    if (Number.isNaN(state.paced)) state.sure = false
    state.steps = (frame.now - state.startedAt) * pace
  }

  // The newest six that sound: the device has six voices.
  let count = 0
  for (let at = notes.length - 1; at >= 0 && count < OVERTONE_NOTES_MOST; at--) {
    const note = notes[at]
    // `Overtone::note_on`: a key struck again while held is faded in a fiftieth of a second.
    let again = false
    for (let later = at + 1; later < notes.length && note.released !== null; later++)
      again ||= notes[later].id === note.id && Math.abs(notes[later].age - note.released) < 0.005
    const level =
      airEnvelope(note.age, note.released, attack, release) * (0.3 + 0.7 * clamp(note.gain, 0, 1))
    if (again || level < OVERTONE_DONE) continue
    // Kept low to high, so a chord's lights stand in the order of its keys.
    let slot = count
    while (slot > 0 && state.pitch[slot - 1] > note.frequency) {
      state.index[slot] = state.index[slot - 1]
      state.level[slot] = state.level[slot - 1]
      state.pitch[slot] = state.pitch[slot - 1]
      slot--
    }
    state.index[slot] = at
    state.level[slot] = level
    state.pitch[slot] = note.frequency
    count++
  }
  return count
}

/** The ladder as the knobs set it, for a note at `hz` with the mouth on harmonic `k`. */
function overtoneRest(
  frame: DisplayFrame<OvertoneState>,
  parts: OvertoneParts,
  hz: number,
  k: number,
): void {
  const { ctx, colours, state } = frame
  const { rungs } = parts
  const voice = frame.value('voice')
  const focus = clamp(frame.value('focus'), 0, 1)
  const breath = clamp(frame.value('breath'), 0, 1)
  const growl = clamp(frame.value('growl'), 0, 1)
  const feet = rungs.y + rungs.h
  const right = rungs.x + rungs.w
  const each = rungs.w / (OVERTONE_TO - OVERTONE_FROM)
  const yOf = (level: number): number => feet - overtoneShare(level) * rungs.h
  const terms = Math.min(OVERTONE_SHOWN, overtoneTerms(hz, frame.sampleRate))
  rule(ctx, rungs.x, feet, right, feet, { colour: colours.ink, alpha: INK.rule })

  // Breath: the air in a harmonic's width, hissing through the body and whistling through the mouth.
  if (breath > 0) {
    ctx.beginPath()
    ctx.moveTo(rungs.x, feet)
    for (let x = rungs.x; x <= right; x += 2)
      ctx.lineTo(x, yOf(overtoneAir(voice, hz, overtoneHarmonicAt(x, rungs), k, focus, breath)))
    ctx.lineTo(right, feet)
    ctx.closePath()
    ctx.globalAlpha = 0.24
    ctx.fillStyle = colours.ink
    ctx.fill()
  }

  // The mouth: what its two resonators let through around harmonic k, as narrow as Focus makes them.
  ctx.beginPath()
  for (let x = rungs.x; x <= right; x += 1) {
    const y = yOf(overtoneWhistle(hz, overtoneHarmonicAt(x, rungs), k, focus))
    if (x === rungs.x) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.globalAlpha = INK.text
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.stroke()

  // The rungs: each harmonic as the body leaves it, and above that what the mouth adds to it.
  // Vibrato moves a harmonic by its own number of the note's bend, so the tops widen up the ladder.
  const bend = Math.pow(2, (OVERTONE_VIBRATO_CENTS * frame.value('vibrato')) / 1200) - 1
  ctx.lineWidth = each >= 9 ? 2 : 1.5
  for (const lifted of [false, true]) {
    ctx.beginPath()
    for (let n = 1; n <= terms; n++) {
      const x = overtoneX(n, rungs)
      const drone = Math.min(yOf(overtoneDrone(voice, hz, n, focus)), feet - 1.5)
      const whole = Math.min(yOf(overtoneLevel(voice, hz, n, k, focus)), feet - 1.5)
      if (!lifted) {
        ctx.moveTo(x, feet)
        ctx.lineTo(x, Math.max(drone, whole))
        continue
      }
      if (whole < drone - 0.5) {
        ctx.moveTo(x, drone)
        ctx.lineTo(x, whole)
      }
      const sway = n * bend * each
      if (sway >= 0.75) {
        ctx.moveTo(x - sway, whole)
        ctx.lineTo(x + sway, whole)
      }
    }
    ctx.globalAlpha = lifted ? 1 : INK.back
    ctx.stroke()
  }

  // Growl: the rattle half way between the harmonics, and an octave under the note.
  if (growl > 0) {
    ctx.beginPath()
    for (let m = 0; m < terms; m++) {
      const share = overtoneShare(overtoneRattle(voice, hz, m, growl, focus))
      if (share <= 0) continue
      const x = Math.floor(overtoneX(m + 0.5, rungs)) + 0.5
      ctx.moveTo(x, feet)
      ctx.lineTo(x, feet - share * rungs.h)
    }
    ctx.setLineDash([1, 1.5])
    ctx.globalAlpha = INK.text
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.setLineDash([])
  }
  ctx.globalAlpha = 1

  // The stones the walk steps on: the ones within its reach strong, home the largest, and the line that spans them.
  const { home, reach } = state
  for (let rung = 0; rung < OVERTONE_LADDER.length; rung++) {
    const size = reach > 0 && rung === home ? 5 : 3
    const x = Math.round(overtoneX(OVERTONE_LADDER[rung], rungs) - size / 2)
    fillRect(
      ctx,
      { x, y: Math.round(parts.stones - size / 2), w: size, h: size },
      colours.ink,
      reach > 0 && Math.abs(rung - home) <= reach ? 1 : 0.4,
    )
  }
  if (reach > 0) {
    const from = overtoneX(OVERTONE_LADDER[Math.max(0, home - reach)], rungs) - 3
    const to =
      overtoneX(OVERTONE_LADDER[Math.min(OVERTONE_LADDER.length - 1, home + reach)], rungs) + 3
    trace(
      ctx,
      [
        [from + 0.5, parts.span - 3],
        [from + 0.5, parts.span],
        [to - 0.5, parts.span],
        [to - 0.5, parts.span - 3],
      ],
      { colour: colours.ink, width: 1, alpha: INK.text },
    )
  }
}

/** The notes that sound, each lighting its own harmonics as far as its envelope has opened, and the mouth. */
function overtonePlayed(
  frame: DisplayFrame<OvertoneState>,
  parts: OvertoneParts,
  lit: number,
): void {
  const { ctx, colours, state, notes } = frame
  const { rungs } = parts
  if (lit === 0) return
  const voice = frame.value('voice')
  const focus = clamp(frame.value('focus'), 0, 1)
  const vibrato = frame.value('vibrato')
  const feet = rungs.y + rungs.h
  const each = rungs.w / (OVERTONE_TO - OVERTONE_FROM)
  // `vibrato_phase_` starts with the stretch and every voice bends by it; of an old stretch the turn is not known.
  const turns = state.sure ? OVERTONE_VIBRATO_HZ * (frame.now - state.startedAt) : 0
  // A chord's notes stand side by side on each rung.
  const gap = clamp((each * 0.5) / lit, 0.8, 2)
  ctx.beginPath()
  for (let index = 0; index < lit; index++) {
    const note = notes[state.index[index]]
    const hz = clamp(note.frequency, 16, 8000)
    const k = state.asked > 0 ? overtoneHarmonicFor(state.asked, hz) : 0
    const bent = Math.pow(2, overtoneVibratoCents(note.age, vibrato, turns) / 1200)
    const aside = (index - (lit - 1) / 2) * gap
    const terms = Math.min(OVERTONE_SHOWN, overtoneTerms(hz, frame.sampleRate))
    for (let n = 1; n <= terms; n++) {
      const share = overtoneShare(overtoneLevel(voice, hz, n, k, focus) * state.level[index])
      if (share <= 0) continue
      const x = overtoneX(n * bent, rungs) + aside
      ctx.moveTo(x, feet)
      ctx.lineTo(x, feet - share * rungs.h)
    }
  }
  ctx.strokeStyle = colours.accent
  ctx.lineWidth = Math.min(1.5, gap + 0.25)
  ctx.stroke()

  const from = Math.max(0, state.home - state.reach)
  const to = Math.min(OVERTONE_LADDER.length - 1, state.home + state.reach)
  if (state.asked > 0) {
    // The mouth of the lowest note, the drone the ladder is drawn for, where it is known to be:
    // its curve as loud as the note, and its place on the stones.
    const lowest = notes[state.index[0]]
    const hz = clamp(lowest.frequency, 16, 8000)
    const k = overtoneHarmonicFor(state.asked, hz)
    const level = airEnvelope(
      lowest.age,
      lowest.released,
      frame.value('attack'),
      frame.value('release'),
    )
    const bent = Math.pow(2, overtoneVibratoCents(lowest.age, vibrato, turns) / 1200)
    ctx.beginPath()
    let drawing = false
    for (let x = rungs.x; x <= rungs.x + rungs.w; x += 1) {
      const at = overtoneHarmonicAt(x, rungs) / bent
      const share = overtoneShare(overtoneWhistle(hz, at, k, focus) * level)
      if (share <= 0) {
        drawing = false
        continue
      }
      if (drawing) ctx.lineTo(x, feet - share * rungs.h)
      else ctx.moveTo(x, feet - share * rungs.h)
      drawing = true
    }
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.stroke()
    dot(ctx, overtoneX(k, rungs), parts.stones, 2.75, colours.accent)
  } else {
    // The walk has stepped and the sound does not say where to: it is on one of these.
    for (let rung = from; rung <= to; rung++)
      dot(ctx, overtoneX(OVERTONE_LADDER[rung], rungs), parts.stones, 1.5, colours.accent)
  }
  // The walk's clock: the line under the stones fills until the next step.
  if (state.reach > 0 && state.sure) {
    const a = overtoneX(OVERTONE_LADDER[from], rungs) - 3
    const b = overtoneX(OVERTONE_LADDER[to], rungs) + 3
    const turn = state.steps - Math.floor(state.steps)
    rule(ctx, a, parts.span, a + turn * (b - a), parts.span, { colour: colours.accent, width: 2 })
  }
}

const overtone = plateDisplay<OvertoneState>({
  place: 'window',
  columns: 2,
  params: [
    'voice',
    'overtone',
    'focus',
    'wander',
    'pace',
    'breath',
    'growl',
    'vibrato',
    'attack',
    'release',
    'width',
  ],
  live: { signal: true, notes: true, spectrum: true },
  info: 'The harmonics of the drone, each as strong as the voice leaves it, under the curve of the mouth that picks one out. The squares are the rungs the whistle walks and the line under them how far. A held note lights its harmonics and the one its mouth is on. Drag the ring to set Overtone.',
  init: () => ({
    startedAt: NaN,
    sure: false,
    steps: 0,
    paced: NaN,
    heard: -1,
    heardAt: 0,
    index: new Int16Array(OVERTONE_NOTES_MOST),
    level: new Float32Array(OVERTONE_NOTES_MOST),
    pitch: new Float32Array(OVERTONE_NOTES_MOST),
    asked: 0,
    home: 0,
    reach: 0,
    places: new Float32Array(OVERTONE_NOTES_MOST),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const parts = overtoneParts(frame)
    const lit = overtoneSounding(frame)
    overtoneMouth(frame, lit)
    // The ladder is the lowest sounding note's, the drone under the rest: the body's formant
    // stands at its own pitch, not at a harmonic, so each note has rungs of its own.
    const hz = clamp(lit > 0 ? state.pitch[0] : OVERTONE_REST_HZ, 16, 8000)
    const knob = frame.value('overtone')
    const set = overtoneHarmonicFor(state.reach === 0 ? knob : OVERTONE_LADDER[state.home], hz)
    overtoneRest(frame, parts, hz, set)
    overtonePlayed(frame, parts, lit)

    // The foot: the level, the six places the drones of a chord stand at, and under it how far the whistles drift.
    const width = clamp(frame.value('width'), 0, 1)
    const { foot } = parts
    levelFoot(frame, foot, outShare(frame))
    for (let voice = 0; voice < OVERTONE_NOTES_MOST; voice++)
      state.places[voice] = OVERTONE_DRONE_PAN[voice] * width
    footPlaces(frame, foot, state.places, OVERTONE_NOTES_MOST)
    if (width > 0) {
      const half = (OVERTONE_WHISTLE_PAN * width * (foot.w - 3)) / 2
      const middle = foot.x + foot.w / 2
      rule(ctx, middle - half, foot.y + foot.h + 1, middle + half, foot.y + foot.h + 1, {
        colour: colours.ink,
        alpha: INK.back,
      })
    }

    // The words: the voice, the walk's pace while it walks, and the harmonic the mouth is on with the key it lands on.
    label(frame, overtoneVoice(frame.value('voice')).name, parts.rungs.x, 10)
    const from = OVERTONE_LADDER[Math.max(0, state.home - state.reach)]
    const to = OVERTONE_LADDER[Math.min(OVERTONE_LADDER.length - 1, state.home + state.reach)]
    const on =
      state.asked > 0 ? harmonicText(overtoneHarmonicFor(state.asked, hz), hz) : `×${from}…${to}`
    const pace = state.reach > 0 ? `${paceText(frame.value('pace'))}  ` : ''
    label(frame, `${pace}${on}`, parts.rungs.x + parts.rungs.w, 10, 'right')

    for (const point of overtoneHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: overtoneHandles,
})

function overtoneHandles(view: DisplayView): DisplayHandle[] {
  const parts = overtoneParts(view)
  return [
    {
      key: 'overtone',
      name: 'Overtone',
      x: overtoneX(view.value('overtone'), parts.rungs),
      y: parts.stones,
      drag: (toX) => ({ overtone: clamp(overtoneHarmonicAt(toX, parts.rungs), 3, 16) }),
      reset: () => ({ overtone: view.spec('overtone')?.default ?? 8 }),
    },
  ]
}

// --- Flock -------------------------------------------------------------------

/** `flock.h`, `kMaxBirds` and `kMaxVoices`: the birds of a key and the keys that sound at once. */
const FLOCK_BIRDS_MOST = 8
const FLOCK_KEYS_MOST = 12
/** `flock.h`, `kNearOctaves`, `kFarOctaves`, `kQuickest`, `kFarLevel`: the fly-in. */
const FLOCK_NEAR_OCTAVES = 1 / 3
const FLOCK_FAR_OCTAVES = 1
const FLOCK_QUICKEST = 0.55
const FLOCK_FAR_LEVEL = 0.3
/** `flock.h`, `kStrayCents`, `kWalkSpread`: the roaming. */
const FLOCK_STRAY_CENTS = 120
const FLOCK_WALK_SPREAD = 0.8
/** `flock.h`, `kCallShortest`, `kCallLongest`, `kCallShare`, `kCallGain`, `kFirstCall`: the calls. */
const FLOCK_CALL_SHORTEST = 0.5
const FLOCK_CALL_LONGEST = 1.6
const FLOCK_CALL_SHARE = 0.6
const FLOCK_CALL_GAIN = 1.6
const FLOCK_FIRST_CALL = 0.09
/** `flock.h`, `kOctaveShare`, `kLowestOctaveHz`: the seats an octave off. */
const FLOCK_OCTAVE_SHARE = 0.75
const FLOCK_LOWEST_OCTAVE_HZ = 30
/** `flock.h`, `kScatterNear`, `kScatterFar`, `kQuickestLeave`: the leaving. */
const FLOCK_SCATTER_NEAR = 150
const FLOCK_SCATTER_FAR = 700
const FLOCK_QUICKEST_LEAVE = 0.6
/** `flock.h`, `kThird`, `kFifth`, `kSeventh`: the harmonics of a reed, against the fundamental. */
const FLOCK_THIRD = 0.55
const FLOCK_FIFTH = 0.33
const FLOCK_SEVENTH = 0.2

/** `Flock::start`, `displaced`: how many of the `birds` Octaves seats an octave off the note. */
export function flockDisplaced(birds: number, octaves: number): number {
  return Math.floor(octaves * (birds - 1) * FLOCK_OCTAVE_SHARE + 0.5)
}

/**
 * `Flock::start`: where bird `k` of `birds` sits: 0 on the note, 1 an octave
 * up, -1 an octave down. The last birds are the ones moved: up, down, down,
 * up and so on, and a seat that does not fit (above a fifth of the rate, under
 * 30 Hz) is the other one.
 */
export function flockSeat(
  k: number,
  birds: number,
  displaced: number,
  hz: number,
  sampleRate: number,
): number {
  const turn = birds - 1 - k
  if (turn >= displaced) return 0
  let up = (((turn + 1) >> 1) & 1) === 0
  if (up && !(2 * hz <= 0.2 * sampleRate)) up = false
  if (!up && !(0.5 * hz >= FLOCK_LOWEST_OCTAVE_HZ)) up = true
  return up ? 1 : -1
}

/**
 * `Flock::steer`, the fly-in: the cents a bird is off its seat when it has
 * `arrived` (0 when it sets out, 1 there), having set out `far` octaves away
 * on `side` (-1 below, 1 above). The curve is a cubic in frequency.
 */
export function flockFlyCents(far: number, side: number, arrived: number): number {
  const depart = Math.pow(2, side * far) - 1
  const away = 1 - clamp(arrived, 0, 1)
  return 1200 * Math.log2(1 + depart * away * away * away)
}

/** `Flock::steer`, `near`: how loud a bird is on its way in, 1 when it is there. */
export function flockNear(arrived: number): number {
  const short = 1 - clamp(arrived, 0, 1)
  return FLOCK_FAR_LEVEL + (1 - FLOCK_FAR_LEVEL) * (1 - short * short)
}

/**
 * `Flock::stray_cents`: how far the birds roam either side of the note. The
 * knob is squared. It is the spread of the walk in `steer`, not its limit: a
 * bird is past it a third of the time, and now and then three times as far.
 */
export function flockStrayCents(stray: number): number {
  return FLOCK_STRAY_CENTS * stray * stray
}

/** `Flock::steer`, the scatter: the cents a bird has gone off when `gone` (0 at the key up, 1 when it has left) of its way to `cents`. */
export function flockScatterCents(cents: number, gone: number): number {
  const share = clamp(gone, 0, 1)
  return cents * share * Math.sqrt(share)
}

/** `Flock::steer`, `staying`: how loud a leaving bird still is. */
export function flockStaying(gone: number): number {
  const left = 1 - clamp(gone, 0, 1)
  return left * left
}

/** `Flock::place_of`: where bird `k` of `n` sits from left (-1) to right (1): spread evenly in angle from the middle outwards. */
export function flockPlace(k: number, n: number): number {
  let spot = 0
  if (n % 2 === 0) {
    spot = (2 * (k >> 1) + 1) / n
    if (k % 2 === 0) spot = -spot
  } else if (k > 0) {
    spot = (2 * ((k + 1) >> 1)) / n
    if (k % 2 === 1) spot = -spot
  }
  return Math.sin((Math.PI / 2) * spot)
}

/** `Flock::steer`, Tone: the third, fifth and seventh harmonic against the fundamental, which come in one after another. */
export function flockHarmonic(tone: number, harmonic: 3 | 5 | 7): number {
  if (harmonic === 3) return FLOCK_THIRD * tone
  const into = harmonic === 5 ? clamp((tone - 0.2) * 1.25, 0, 1) : clamp((tone - 0.45) / 0.55, 0, 1)
  return (harmonic === 5 ? FLOCK_FIFTH : FLOCK_SEVENTH) * into * into
}

/** `Flock::steer`, the calls: a bird's level `turn` of the way through a call and its silence (0..1), as Chirp shapes it. */
export function flockCall(chirp: number, turn: number): number {
  const calling =
    turn < FLOCK_CALL_SHARE ? 0.5 - 0.5 * Math.cos((TAU * turn) / FLOCK_CALL_SHARE) : 0
  return 1 + chirp * (FLOCK_CALL_GAIN * calling - 1)
}

/** `Flock::apply`, `call_speed_`: how much faster than once in 0.5 to 1.6 s a bird calls at that Flutter. */
export function flockCallSpeed(flutter: number): number {
  return clamp(Math.sqrt(flutter * 2), 0.5, 2.5)
}

/** A time as it is said. Gather goes down to 20 ms, where steps of 10 ms are too coarse: under 100 ms it is said to the millisecond. */
const flockSeconds = (seconds: number): string =>
  seconds < 0.0995 ? `${Math.round(seconds * 1000)} ms` : secondsText(seconds)

/** The key the resting flock is called by: middle C. */
const FLOCK_REST_HZ = 261.63
/** The seconds of hovering between the gathering and the leaving. */
const FLOCK_HOVER_SECONDS = 4
/**
 * The octaves the picture spans either side of the note, and the power its
 * scale of pitch follows: a bird sets out an octave away and roams a few
 * cents, and both have to be seen, so the cents near the note are drawn large.
 */
const FLOCK_OCTAVES = 3
const FLOCK_WARP = 0.45
/** A trail has a point every so many pixels. */
const FLOCK_STEP = 2
/** The shares of the width the gathering and the leaving take at the two ends of their knobs. */
const FLOCK_GATHER_SHARE = [0.14, 0.4] as const
const FLOCK_LEAVE_SHARE = [0.12, 0.3] as const

interface FlockParts {
  /** Where the birds fly: time across, pitch up, the note along the middle. */
  sky: Box
  /** Where the gathering ends, and where the leaving begins: the key is held between the two. */
  gathered: number
  gate: number
  foot: Box
}

function flockParts(view: DisplayView): FlockParts {
  const sky: Box = { x: 5, y: 15, w: view.width - 10, h: view.height - 15 - 14 }
  return {
    sky,
    gathered: sky.x + sky.w * lerp(FLOCK_GATHER_SHARE[0], FLOCK_GATHER_SHARE[1], view.at('gather')),
    gate: sky.x + sky.w * (1 - lerp(FLOCK_LEAVE_SHARE[0], FLOCK_LEAVE_SHARE[1], view.at('leave'))),
    foot: { x: 4, y: view.height - 11, w: view.width - 8, h: 6 },
  }
}

/** Where a pitch so many cents off the note stands in the sky. */
function flockY(cents: number, sky: Box): number {
  const octaves = Math.min(Math.abs(cents) / 1200, FLOCK_OCTAVES)
  const share = Math.pow(octaves / FLOCK_OCTAVES, FLOCK_WARP)
  return sky.y + sky.h / 2 - Math.sign(cents) * share * (sky.h / 2 - 1)
}

/** A key that sounds, with the flock it called: what `Flock::start` read when it was pressed and `release` when it was let go. */
interface FlockKey {
  id: number
  /** The clock (`frame.now`) at which it was pressed. */
  began: number
  birds: number
  gather: number
  from: number
  displaced: number
  /** NaN while it is held. */
  leave: number
  /** Where its flock stands across the sky. */
  x: number
  seen: boolean
}

interface FlockState {
  /** What the trails were last drawn for, and the trails: for each bird at each point its cents off the note and its level. */
  drawnFor: Float64Array
  points: number
  cents: Float32Array
  level: Float32Array
  /** The keys that were sent, and the ones of them that sound, newest first. */
  keys: FlockKey[]
  lit: FlockKey[]
  at: Int16Array
  /** The birds of one key by seat (the note, above, below) and by whether their number is even. */
  tally: Int8Array
  places: Float32Array
}

const FLOCK_FRESH = new Float64Array(10)

/** A draw from a bell curve that is the same for the same two numbers: three of `chance` added. */
const flockLot = (seed: number, index: number): number =>
  (chance(seed, index) + chance(seed + 1, index) + chance(seed + 2, index) - 1.5) * 2

/**
 * The trails of a flock as the knobs set it, into the state: a still sample
 * of what `Flock::start`, `steer` and `release` do to each bird over the
 * gathering, four seconds of hovering and the leaving. Every lot the device
 * draws (how far away, how long, which way out, each turn of the roaming) is
 * drawn here from `chance`, so the sample stands still and shows the shape,
 * the spread and the pace, not where any real bird is.
 */
function flockTrails(
  view: DisplayView,
  parts: FlockParts,
  sampleRate: number,
  state: FlockState,
): void {
  const { sky, gathered, gate } = parts
  const birds = clamp(Math.round(view.value('birds')), 1, FLOCK_BIRDS_MOST)
  const gather = view.value('gather')
  const leave = view.value('leave')
  const from = Math.round(view.value('from'))
  const flutter = Math.max(view.value('flutter'), 0.01)
  const chirp = clamp(view.value('chirp'), 0, 1)
  const spread = flockStrayCents(view.value('stray'))
  const displaced = flockDisplaced(birds, view.value('octaves'))
  const points = Math.floor(sky.w / FLOCK_STEP) + 1
  // Drawn again only when something they follow has moved.
  const fresh = FLOCK_FRESH
  fresh[0] = birds
  fresh[1] = gather
  fresh[2] = leave
  fresh[3] = from
  fresh[4] = flutter
  fresh[5] = chirp
  fresh[6] = spread
  fresh[7] = displaced
  fresh[8] = sky.w
  fresh[9] = sky.h
  let same = points === state.points
  for (let index = 0; same && index < fresh.length; index++)
    same = fresh[index] === state.drawnFor[index]
  if (same) return
  state.drawnFor.set(fresh)
  state.points = points
  if (state.cents.length < FLOCK_BIRDS_MOST * points) {
    state.cents = new Float32Array(FLOCK_BIRDS_MOST * points)
    state.level = new Float32Array(FLOCK_BIRDS_MOST * points)
  }
  const speed = flockCallSpeed(flutter)
  const callSeconds = (index: number): number =>
    lerp(FLOCK_CALL_SHORTEST, FLOCK_CALL_LONGEST, chance(17, index)) / speed
  for (let k = 0; k < birds; k++) {
    // `Flock::start`: the first bird takes all of Gather and of Leave, the others a share of their own.
    const far = lerp(FLOCK_NEAR_OCTAVES, FLOCK_FAR_OCTAVES, chance(11, k))
    const share = k === 0 ? 1 : lerp(FLOCK_QUICKEST, 1, chance(12, k))
    const out = k === 0 ? 1 : lerp(FLOCK_QUICKEST_LEAVE, 1, chance(13, k))
    const scatter =
      lerp(FLOCK_SCATTER_NEAR, FLOCK_SCATTER_FAR, chance(14, k)) * (chance(15, k) < 0.5 ? -1 : 1)
    const seat = 1200 * flockSeat(k, birds, displaced, FLOCK_REST_HZ, sampleRate)
    // Around: every other bird from the other side; which half is which the device draws per key.
    const side = from === 0 ? -1 : from === 1 ? 1 : k % 2 === 0 ? -1 : 1
    let aim = FLOCK_WALK_SPREAD * flockLot(20, k * 512)
    let first = aim
    let second = aim
    let hold = chance(23, k) / flutter
    let turns = 1
    let call = k === 0 ? FLOCK_FIRST_CALL : chance(16, k)
    let calls = 1
    let callLasts = callSeconds(k * 64)
    let before = 0
    for (let point = 0; point < points; point++) {
      const x = sky.x + point * FLOCK_STEP
      let since: number
      let gone = 0
      if (x <= gathered) since = ((x - sky.x) / (gathered - sky.x)) * gather
      else if (x <= gate)
        since = gather + ((x - gathered) / (gate - gathered)) * FLOCK_HOVER_SECONDS
      else {
        const left = ((x - gate) / (sky.x + sky.w - gate)) * leave
        since = gather + FLOCK_HOVER_SECONDS + left
        gone = left / (out * leave)
      }
      // `Flock::steer`, the roaming: a new aim every 0.5 to 1.5 turns of Flutter, followed through two poles a quarter turn each.
      const passed = since - before
      before = since
      const steps = clamp(Math.ceil(passed * flutter * 8), 1, 24)
      const pole = 1 - Math.exp((-4 * flutter * passed) / steps)
      for (let step = 0; step < steps; step++) {
        hold -= passed / steps
        if (hold <= 0) {
          aim = flockLot(20, k * 512 + turns)
          hold = (0.5 + chance(23, k * 512 + turns)) / flutter
          turns++
        }
        first += (aim - first) * pole
        second += (first - second) * pole
      }
      call += passed / callLasts
      while (call >= 1) {
        call -= 1
        callLasts = callSeconds(k * 64 + calls++)
      }
      const arrived = Math.min(1, since / (share * gather))
      state.cents[k * points + point] =
        seat +
        flockFlyCents(far, side, arrived) +
        (spread * second) / FLOCK_WALK_SPREAD +
        flockScatterCents(scatter, gone)
      state.level[k * points + point] =
        gone >= 1
          ? 0
          : clamp(flockNear(arrived) * flockStaying(gone) * flockCall(chirp, call), 0, 1)
    }
  }
}

/** The sky as the knobs set it: the ground of pitch and time, and the sample trails. */
function flockRest(frame: DisplayFrame<FlockState>, parts: FlockParts): void {
  const { ctx, colours, state } = frame
  const { sky, gathered, gate } = parts
  const right = sky.x + sky.w
  const middle = sky.y + sky.h / 2
  const birds = clamp(Math.round(frame.value('birds')), 1, FLOCK_BIRDS_MOST)
  const from = Math.round(frame.value('from'))
  const displaced = flockDisplaced(birds, frame.value('octaves'))

  // The note along the middle, the octave either side, and the two moments: all gathered, key let go.
  for (const cents of [-1200, 1200]) {
    const y = flockY(cents, sky)
    rule(ctx, sky.x, y, right, y, { colour: colours.ink, alpha: INK.grid })
  }
  rule(ctx, sky.x, middle, right, middle, { colour: colours.ink, alpha: INK.rule })
  rule(ctx, gathered, sky.y, gathered, sky.y + sky.h, { colour: colours.ink, alpha: INK.grid })
  rule(ctx, gate, sky.y, gate, sky.y + sky.h, {
    colour: colours.ink,
    alpha: INK.back,
    dash: [2, 2],
  })

  // Where a bird can be on its way in: from a third of an octave to an octave off its seat, the
  // nearest and quickest along the inner edge, the furthest and slowest along the outer.
  ctx.beginPath()
  for (let seat = -1; seat <= 1; seat++) {
    let seated = false
    for (let k = 0; k < birds; k++)
      seated ||= flockSeat(k, birds, displaced, FLOCK_REST_HZ, frame.sampleRate) === seat
    if (!seated) continue
    for (let side = -1; side <= 1; side += 2) {
      if (from !== 2 && side !== (from === 0 ? -1 : 1)) continue
      const wide = gathered - sky.x
      for (let x = 0; x <= wide; x += FLOCK_STEP) {
        const y = flockY(1200 * seat + flockFlyCents(FLOCK_FAR_OCTAVES, side, x / wide), sky)
        if (x === 0) ctx.moveTo(sky.x + x, y)
        else ctx.lineTo(sky.x + x, y)
      }
      for (let x = wide; x >= 0; x -= FLOCK_STEP) {
        const arrived = Math.min(1, x / wide / FLOCK_QUICKEST)
        const cents = 1200 * seat + flockFlyCents(FLOCK_NEAR_OCTAVES, side, arrived)
        ctx.lineTo(sky.x + x, flockY(cents, sky))
      }
      ctx.closePath()
    }
  }
  ctx.globalAlpha = 0.13
  ctx.fillStyle = colours.ink
  ctx.fill()

  // Tone: the third, fifth and seventh harmonic of the hovering birds, as strong as each is against the note.
  const tone = clamp(frame.value('tone'), 0, 1)
  for (const harmonic of [3, 5, 7] as const) {
    const level = flockHarmonic(tone, harmonic)
    if (level < 0.005) continue
    const y = flockY(1200 * Math.log2(harmonic), sky)
    rule(ctx, gathered, y, gate, y, {
      colour: colours.ink,
      alpha: clamp(0.15 + 1.5 * level, 0, 1),
      width: level > 0.3 ? 1.5 : 1,
    })
  }

  // The trails, each as strong as its bird is loud: fainter far off and leaving, broken where Chirp leaves silence.
  flockTrails(frame, parts, frame.sampleRate, state)
  const { points } = state
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  for (let strength = 1; strength <= 4; strength++) {
    ctx.beginPath()
    for (let k = 0; k < birds; k++) {
      let drawing = false
      for (let point = 1; point < points; point++) {
        const level = state.level[k * points + point]
        if (level <= 0.03 || Math.min(4, Math.ceil(level * 4)) !== strength) {
          drawing = false
          continue
        }
        const x = sky.x + point * FLOCK_STEP
        if (!drawing) ctx.moveTo(x - FLOCK_STEP, flockY(state.cents[k * points + point - 1], sky))
        ctx.lineTo(x, flockY(state.cents[k * points + point], sky))
        drawing = true
      }
    }
    ctx.globalAlpha = strength / 4
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/** The keys that sound, into `state.lit`, newest first; how many. Each keeps what the device read when it was pressed and let go. */
function flockSounding(frame: DisplayFrame<FlockState>): number {
  const { state, notes } = frame
  for (const key of state.keys) key.seen = false
  let count = 0
  for (let at = notes.length - 1; at >= 0; at--) {
    const note = notes[at]
    const began = frame.now - note.age
    let key: FlockKey | null = null
    for (const known of state.keys)
      if (known.id === note.id && Math.abs(known.began - began) < 0.05) key = known
    if (!key) {
      // A key long gone when the display first sees it has no flock left to show.
      if (note.released !== null && note.released >= frame.value('leave')) continue
      // `Flock::start`: Birds, Gather, From and Octaves are read when the key is pressed.
      const birds = clamp(Math.round(frame.value('birds')), 1, FLOCK_BIRDS_MOST)
      key = {
        id: note.id,
        began,
        birds,
        gather: frame.value('gather'),
        from: Math.round(frame.value('from')),
        displaced: flockDisplaced(birds, frame.value('octaves')),
        leave: NaN,
        x: NaN,
        seen: true,
      }
      state.keys.push(key)
    }
    key.seen = true
    // `Flock::release`: Leave is read when the key is let go, and the first bird takes all of it.
    if (note.released !== null && Number.isNaN(key.leave)) key.leave = frame.value('leave')
    if (!frame.powered || (note.released !== null && note.released >= key.leave)) continue
    if (count < FLOCK_KEYS_MOST) {
      state.lit[count] = key
      state.at[count] = at
      count++
    }
  }
  let kept = 0
  for (const key of state.keys) if (key.seen) state.keys[kept++] = key
  state.keys.length = kept
  return count
}

/**
 * The flocks that sound, each a column of marks at its moment: one for each
 * bird, spread over where the birds can be then. Which bird is where in that
 * span only the device knows, so they stand evenly in it.
 */
function flockPlayed(frame: DisplayFrame<FlockState>, parts: FlockParts): void {
  const { ctx, colours, state, notes } = frame
  const { sky, gathered, gate } = parts
  const lit = flockSounding(frame)
  const spread = flockStrayCents(frame.value('stray'))
  // The flocks whose keys are held past the hovering wait in a row before the gate, the oldest nearest it.
  let waiting = 0
  const apart = Math.min(5, (gate - gathered) / (FLOCK_KEYS_MOST + 2))
  for (let index = lit - 1; index >= 0; index--) {
    const key = state.lit[index]
    const note = notes[state.at[index]]
    let x: number
    if (note.released !== null)
      x = gate + (sky.x + sky.w - gate) * clamp(note.released / key.leave, 0, 1)
    else if (note.age < key.gather) x = sky.x + (gathered - sky.x) * (note.age / key.gather)
    else {
      const across = (note.age - key.gather) / FLOCK_HOVER_SECONDS
      x = Math.min(gathered + (gate - gathered) * across, gate - 6 - waiting * apart)
      if (across >= 1) waiting++
    }
    // It moves to its place rather than jumping there, when the key goes up or the row closes.
    const eased = frame.dt > 0 && !Number.isNaN(key.x)
    key.x = eased ? x + (key.x - x) * Math.exp(-frame.dt / 0.06) : x

    // `Flock::start`: the birds by seat and by number, which says who flies from which side under Around.
    state.tally.fill(0)
    for (let k = 0; k < key.birds; k++) {
      const seat = flockSeat(k, key.birds, key.displaced, note.frequency, frame.sampleRate)
      state.tally[(seat === 0 ? 0 : seat > 0 ? 1 : 2) * 2 + (k & 1)]++
    }
    const lead = clamp(note.age / key.gather, 0, 1)
    const strength = (0.4 + 0.6 * clamp(note.gain, 0, 1)) * flockNear(lead)
    // The key's own moment, a thin line down the sky, under its birds.
    rule(ctx, key.x, sky.y, key.x, sky.y + sky.h, {
      colour: colours.accent,
      alpha: 0.7 * strength,
    })
    for (let seat = 0; seat < 3; seat++) {
      const even = state.tally[seat * 2]
      const odd = state.tally[seat * 2 + 1]
      if (even + odd === 0) continue
      const base = seat === 0 ? 0 : seat === 1 ? 1200 : -1200
      if (lead >= 1) flockMarks(frame, parts, key, note, base, 0, even + odd, 1, strength, spread)
      else if (key.from !== 2)
        flockMarks(
          frame,
          parts,
          key,
          note,
          base,
          key.from === 0 ? -1 : 1,
          even + odd,
          1,
          strength,
          spread,
        )
      else {
        // Around: the even birds come from one side and the odd from the other, and which is
        // which is a lot of the device's. As many as the smaller half are on each side for
        // certain; the rest are on one or the other, and are drawn half as strong on both.
        const most = Math.max(even, odd)
        const sure = (Math.min(even, odd) + 0.5 * (most - Math.min(even, odd))) / most
        for (let side = -1; side <= 1; side += 2)
          flockMarks(frame, parts, key, note, base, side, most, sure, strength, spread)
      }
    }
  }
}

/**
 * `count` birds of one key on one seat (`base` cents off the note) and one
 * side (0 once all have landed), evenly over where they are to be found: on
 * the way in between the nearest, quickest bird and the furthest, slowest;
 * there, over the spread of Stray; leaving, either way by 150 to 700 cents,
 * the quickest furthest. The marks are the span, not the birds: they stand
 * still while the birds roam in it.
 */
function flockMarks(
  frame: DisplayFrame<FlockState>,
  parts: FlockParts,
  key: FlockKey,
  note: DisplayNote,
  base: number,
  side: number,
  count: number,
  sure: number,
  strength: number,
  spread: number,
): void {
  const lead = clamp(note.age / key.gather, 0, 1)
  const quick = clamp(note.age / (FLOCK_QUICKEST * key.gather), 0, 1)
  const inner = Math.abs(flockFlyCents(FLOCK_NEAR_OCTAVES, side, quick))
  const outer = Math.abs(flockFlyCents(FLOCK_FAR_OCTAVES, side, lead))
  for (let bird = 0; bird < count; bird++) {
    const share = (bird + 0.5) / count
    const way = side === 0 ? 1 : side
    const cents = base + side * lerp(inner, outer, share) + way * spread * (2 * share - 1)
    if (note.released === null) {
      flockBird(frame, key.x, flockY(cents, parts.sky), strength * sure)
      continue
    }
    const gone = note.released / (lerp(1, FLOCK_QUICKEST_LEAVE, share) * key.leave)
    if (gone >= 1) continue
    const off = flockScatterCents(lerp(FLOCK_SCATTER_NEAR, FLOCK_SCATTER_FAR, share), gone)
    // Up or down is a lot too: half as strong each way, the two as one while it has not gone far.
    const alpha = strength * sure * flockStaying(gone) * (off < 25 ? 1 : 0.6)
    flockBird(frame, key.x, flockY(cents + off, parts.sky), alpha)
    if (off >= 25) flockBird(frame, key.x, flockY(cents - off, parts.sky), alpha)
  }
}

/** One bird of a key that sounds, bare in the accent: birds that stand close run together into the span they share. */
function flockBird(frame: Paint, x: number, y: number, alpha: number): void {
  dot(frame.ctx, x, y, 2.5, frame.colours.accent, { alpha })
}

const flock = plateDisplay<FlockState>({
  place: 'window',
  columns: 2,
  params: [
    'birds',
    'gather',
    'from',
    'stray',
    'flutter',
    'tone',
    'chirp',
    'octaves',
    'leave',
    'width',
  ],
  live: { signal: true, notes: true },
  info: 'One flock, time across and pitch up, the note in the middle: birds fly in over Gather, hover as wide as Stray and scatter over Leave. The trails are a sample, as each bird draws lots. A key that sounds crosses as a line, its birds set evenly where they may be. Drag the rings for Gather and Leave.',
  init: () => ({
    drawnFor: new Float64Array(10),
    points: 0,
    cents: new Float32Array(0),
    level: new Float32Array(0),
    keys: [],
    lit: [],
    at: new Int16Array(FLOCK_KEYS_MOST),
    tally: new Int8Array(6),
    places: new Float32Array(FLOCK_BIRDS_MOST),
  }),
  draw(frame) {
    const { state } = frame
    ground(frame)
    const parts = flockParts(frame)
    flockRest(frame, parts)
    flockPlayed(frame, parts)

    // The foot: the level, and where the birds of a key sit from left to right, as wide as Width.
    const birds = clamp(Math.round(frame.value('birds')), 1, FLOCK_BIRDS_MOST)
    const width = clamp(frame.value('width'), 0, 1)
    levelFoot(frame, parts.foot, outShare(frame))
    for (let k = 0; k < birds; k++) state.places[k] = flockPlace(k, birds) * width
    footPlaces(frame, parts.foot, state.places, birds)

    // The words: how long the gathering takes, how far the birds roam, how long the leaving takes.
    const { sky } = parts
    const spread = flockStrayCents(frame.value('stray'))
    label(frame, flockSeconds(frame.value('gather')), sky.x, 10)
    label(
      frame,
      spread < 0.5 ? 'unison' : `±${spread < 9.5 ? spread.toFixed(1) : Math.round(spread)} ct`,
      (parts.gathered + parts.gate) / 2 + 14,
      10,
      'right',
    )
    label(frame, flockSeconds(frame.value('leave')), sky.x + sky.w, 10, 'right')

    for (const point of flockHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: flockHandles,
})

function flockHandles(view: DisplayView): DisplayHandle[] {
  const { sky, gathered, gate } = flockParts(view)
  // At the foot of their lines, clear of the note the birds hover on.
  const low = sky.y + sky.h - 5
  // Each knob's place along its taper is its share of the width.
  const along = (x: number, [least, most]: readonly [number, number]): number =>
    clamp((x - least) / (most - least), 0, 1)
  const valueAt = (name: string, position: number): number => {
    const spec = view.spec(name)
    return spec ? denormalizeParam(spec, position) : position
  }
  return [
    {
      key: 'gather',
      name: 'Gather',
      x: gathered,
      y: low,
      drag: (toX) => ({
        gather: valueAt('gather', along((toX - sky.x) / sky.w, FLOCK_GATHER_SHARE)),
      }),
      reset: () => ({ gather: view.spec('gather')?.default ?? 1.2 }),
    },
    {
      key: 'leave',
      name: 'Leave',
      x: gate,
      y: low,
      drag: (toX) => ({
        leave: valueAt('leave', along(1 - (toX - sky.x) / sky.w, FLOCK_LEAVE_SHARE)),
      }),
      reset: () => ({ leave: view.spec('leave')?.default ?? 2.5 }),
    },
  ]
}

export const VOICE_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  // The mouth, the drone under it, and how a note comes, goes and stands.
  overtone: {
    display: overtone,
    face: ['voice', 'overtone', 'focus', 'wander'],
  },
  // How many, the flight in, the hovering, and the way out.
  flock: {
    display: flock,
    face: ['birds', 'gather', 'stray', 'leave'],
  },
}
