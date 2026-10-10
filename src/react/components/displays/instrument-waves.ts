// Displays of the synthesizers that shape a wave: tables, folds and partials.
//
// Each is the wave itself, or the partials it is made of, worked out the way
// the device works it out: the table's own recipes, the folder's own curve,
// the shape's own ratios. What the knobs set is drawn in the ink, and a key
// that is played lights its wave or its partials for as long and as strongly
// as the device's envelope lets it sound.
//
// None of the three says where its slow motion stands (an LFO, a drift), and a
// display cannot know it: the motion is drawn still, as the path it takes and
// how far it goes, never as a place.

import {
  INK,
  biquad,
  biquadDb,
  clamp,
  dot,
  fillRect,
  freqGrid,
  gainToDb,
  ground,
  handle,
  hzOfX,
  label,
  lerp,
  rule,
  text,
  xOfHz,
  yOfDb,
  type Box,
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
import { levelFoot, outShare, pitchName } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>
type Ctx = CanvasRenderingContext2D

const TWO_PI = Math.PI * 2
const frac = (value: number): number => value - Math.floor(value)

/** A light is as tall as its note is loud, on a scale of so many dB; under `LIT_DONE` of its height the note is done. */
const LIT_DB = 60
const LIT_DONE = 0.02
const litShare = (level: number, range = LIT_DB): number => clamp(1 + gainToDb(level) / range, 0, 1)

/** A slow rate as it is said: "0.08 Hz", "2.5 Hz". */
const rateText = (hz: number): string =>
  `${hz < 1 ? hz.toFixed(2) : hz.toFixed(1).replace(/\.0$/, '')} Hz`

/** The word of a knob that is a choice, as the device names it. */
const choiceWord = (view: DisplayView, param: string): string =>
  view.spec(param)?.choices?.[Math.round(view.value(param))] ?? ''

/**
 * The two words at the top of a display: the left one as it is, and at the
 * right the long one where both have room, else the short one.
 */
function topWords(
  frame: Pick<DisplayFrame, 'ctx' | 'colours' | 'fontFamily'>,
  left: string,
  long: string,
  short: string,
  from: number,
  to: number,
): void {
  const { ctx } = frame
  text(frame, left, from, 11)
  ctx.font = `8px ${frame.fontFamily}`
  const room = to - from - ctx.measureText(left).width - 6
  text(frame, ctx.measureText(long).width <= room ? long : short, to, 11, { align: 'right' })
}

// --- The pads' envelope ------------------------------------------------------

/** `kit::Adsr`: the attack aims at 1.3 and is cut off at 1, where it arrives in the set time; under `kIdleLevel` a voice is off. */
const ADSR_AIM = 1.3
const ADSR_IDLE = 1e-5

/** `kit::Adsr` in its attack: the level `seconds` after the key went down. */
export function padAttack(seconds: number, attack: number): number {
  if (seconds <= 0) return 0
  const left = Math.pow((ADSR_AIM - 1) / ADSR_AIM, seconds / Math.max(attack, 1e-4))
  return Math.min(1, ADSR_AIM * (1 - left))
}

/**
 * `kit::Adsr` from key down to silence, as the wavetable and the drone set it
 * (no decay, full sustain): a key played `age` seconds ago and let go
 * `released` seconds ago (null while it is held) falls 60 dB in `release`
 * from the level it had at key up.
 */
export function padLevel(
  age: number,
  released: number | null,
  attack: number,
  release: number,
): number {
  if (released === null) return padAttack(age, attack)
  const level = padAttack(age - released, attack) * Math.pow(10, (-3 * released) / release)
  return level < ADSR_IDLE ? 0 : level
}

/** `voice.gain` of `wavetable.h` and `drone.h`: how loud a key played as hard as `gain` is. */
export const padGain = (gain: number): number => 0.35 + 0.65 * clamp(gain, 0, 1)

/**
 * A key struck again while it was held: the list of played notes lets the old
 * note go at that moment, and the device cuts it off in a few hundredths of a
 * second (`fast_release`) instead of letting it ring out.
 */
function restruck(notes: readonly DisplayNote[], index: number): boolean {
  const note = notes[index]
  if (note.released === null) return false
  for (let later = index + 1; later < notes.length; later++)
    if (notes[later].id === note.id && Math.abs(notes[later].age - note.released) < 0.005)
      return true
  return false
}

/**
 * One cycle of a wave as a line across `w` pixels, twice over, added to the
 * path that is open. The cycle is the `points` samples of `wave` from `from`.
 */
function wavePath(
  ctx: Ctx,
  wave: Float32Array,
  points: number,
  x: number,
  y: number,
  w: number,
  scale: number,
  from = 0,
): void {
  const all = points * 2
  for (let i = 0; i <= all; i++) {
    const px = x + (i / all) * w
    const py = y - wave[from + (i % points)] * scale
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
}

function stroke(ctx: Ctx, colour: string, width: number, alpha = 1): void {
  ctx.globalAlpha = alpha
  ctx.strokeStyle = colour
  ctx.lineWidth = width
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.globalAlpha = 1
}

// --- Wavetable ---------------------------------------------------------------

/** `wavetable.h`: a row is nine frames of 512 harmonics, each one cycle 2048 samples long, kept at ten band limits. */
const WAVETABLE_FRAMES = 9
const WAVETABLE_HARMONICS = 512
const WAVETABLE_SIZE = 2048
const WAVETABLE_LEVELS = 10
/** `kTableRms`, and the ceiling `build_tables` puts on a frame's peak. */
const WAVETABLE_RMS = 0.25
const WAVETABLE_PEAK = 0.95
/** `kMaxQ` and `kSubGain`. */
const WAVETABLE_MAX_Q = 12
const WAVETABLE_SUB_GAIN = 0.5

/** `Wavetable::recipe`, Glass: the partials a sine grows, and how strong each gets. */
const GLASS_PARTIAL = [2, 3, 4, 5, 7, 9, 11, 12, 15, 16, 19, 21, 24, 27, 32, 39, 48, 64]
const GLASS_LEVEL = [
  0.16, 0.1, 0.04, 0.34, 0.38, 0.26, 0.14, 0.22, 0.12, 0.18, 0.1, 0.07, 0.09, 0.06, 0.07, 0.04,
  0.035, 0.02,
]
/** Vowels: the three formants of a, e, i, o and u in Hz, their gains and widths, on a voice at `VOWEL_PITCH`. */
const VOWEL_FORMANT = [
  [730, 1090, 2440],
  [530, 1840, 2480],
  [270, 2290, 3010],
  [570, 840, 2410],
  [300, 870, 2240],
]
const VOWEL_GAIN = [1, 0.5, 0.3]
const VOWEL_WIDTH = [90, 110, 170]
const VOWEL_PITCH = 110
/** Spectral: four clusters of harmonics, where each stands, how strong, how far it turns along the row and where it starts. */
const SPECTRAL_CENTRE = [4, 9, 15, 26]
const SPECTRAL_PEAK = [1, 0.8, 0.6, 0.45]
const SPECTRAL_TURNS = [1, 1, 2, 1]
const SPECTRAL_START = [0.1, 0.55, 0.3, 0.8]

/** `kit::Rng`: xorshift32, a number from 0 up to 1 at each draw. */
function kitRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state ^ (state << 13)) >>> 0
    state = (state ^ (state >>> 17)) >>> 0
    state = (state ^ (state << 5)) >>> 0
    return (state >>> 8) / 16777216
  }
}

/** `Wavetable::build_tables`: the phase and the weight the Spectral row gives each harmonic, drawn once from one seed. */
let spectral: { phase: Float64Array; weight: Float64Array } | null = null
function spectralDraws(): { phase: Float64Array; weight: Float64Array } {
  if (spectral) return spectral
  const draw = kitRng(0xc0ffee11)
  const phase = new Float64Array(WAVETABLE_HARMONICS + 1)
  const weight = new Float64Array(WAVETABLE_HARMONICS + 1)
  for (let n = 0; n <= WAVETABLE_HARMONICS; n++) {
    phase[n] = draw()
    weight[n] = 0.45 + 0.55 * draw()
  }
  spectral = { phase, weight }
  return spectral
}

/**
 * `Wavetable::recipe`: the harmonics of the frame at `t` (0 to 1) along row
 * `set`, written into `amp` (signed) and `phase` (cycles) from 1 to 512, as
 * amp · sin(2π(n·x + phase)).
 */
export function wavetableRecipe(
  set: number,
  t: number,
  amp: Float64Array,
  phase: Float64Array,
): void {
  amp.fill(0)
  phase.fill(0)
  const top = WAVETABLE_HARMONICS
  switch (set) {
    case 0: {
      // Glass: a sine that grows bell-like partials, the high ones last.
      amp[1] = 1
      for (let k = 0; k < GLASS_PARTIAL.length; k++) {
        const n = GLASS_PARTIAL[k]
        const rank = Math.log2(n) / 6
        const x = clamp((t - 0.6 * rank) * 2.5, 0, 1)
        amp[n] = GLASS_LEVEL[k] * x * x * (3 - 2 * x)
        phase[n] = frac(n * 0.381966)
      }
      break
    }
    case 1: {
      // Vowels: a, e, i, o, u on every second frame; the formants glide between.
      const at = t * 4
      const vowel = Math.min(3, Math.floor(at))
      const mix = at - vowel
      for (let n = 1; n <= top; n++) {
        const hz = VOWEL_PITCH * n
        let gain = 0.02 / (1 + (hz / 6000) * (hz / 6000))
        for (let f = 0; f < 3; f++) {
          const centre = lerp(VOWEL_FORMANT[vowel][f], VOWEL_FORMANT[vowel + 1][f], mix)
          const d = (hz - centre) / VOWEL_WIDTH[f]
          gain += VOWEL_GAIN[f] / (1 + d * d)
        }
        amp[n] = gain * Math.pow(n, -0.8)
      }
      break
    }
    case 2: {
      // Reed to Saw: odd harmonics with a soft top fill in to 1/n.
      for (let n = 1; n <= top; n++) {
        const soft = 1 / (1 + (n / 14) * (n / 14))
        const reed = ((n & 1 ? 1 : 0.08) * soft) / n
        amp[n] = lerp(reed, 1 / n, t)
      }
      break
    }
    case 3: {
      // Hollow: a square whose pulse narrows from 50 % to 12 %.
      const duty = 0.5 - 0.38 * t
      for (let n = 1; n <= top; n++) {
        amp[n] = Math.sin(Math.PI * n * duty) / (n * Math.sqrt(1 + (n / 48) * (n / 48)))
        phase[n] = 0.25
      }
      break
    }
    default: {
      // Spectral: four clusters of harmonics that wander and trade places.
      const draws = spectralDraws()
      for (let n = 1; n <= top; n++) {
        let gain = 0
        for (let k = 0; k < 4; k++) {
          const centre =
            SPECTRAL_CENTRE[k] *
            (1 + 0.45 * Math.sin(TWO_PI * (t * SPECTRAL_TURNS[k] * 0.75 + SPECTRAL_START[k])))
          const width = 0.2 * SPECTRAL_CENTRE[k] + 0.5
          const level =
            SPECTRAL_PEAK[k] * (0.55 + 0.45 * Math.sin(TWO_PI * (t * 1.25 + SPECTRAL_START[3 - k])))
          const d = (n - centre) / width
          gain += level * Math.exp(-d * d)
        }
        amp[n] = gain * Math.pow(n, -0.3) * draws.weight[n]
        phase[n] = draws.phase[n]
      }
      // The fundamental keeps the pitch anchored.
      amp[1] += 0.6
      break
    }
  }
}

/** A row as the device keeps it: each frame's harmonics at the loudness it is stored at, and the one phase a harmonic has along the row. */
export interface WavetableRow {
  amps: Float32Array[]
  phase: Float32Array
}

const wavetableRows: (WavetableRow | undefined)[] = []

/**
 * `Wavetable::build_tables` for one row: every frame is brought to one
 * loudness (`kTableRms`), and held back where its peak would pass 0.95. The
 * peak is that of the whole cycle of 2048 samples, as the device measures it.
 */
export function wavetableRow(set: number): WavetableRow {
  const kept = wavetableRows[set]
  if (kept) return kept
  const size = WAVETABLE_SIZE
  const sine = new Float64Array(size)
  for (let j = 0; j < size; j++) sine[j] = Math.sin((TWO_PI * j) / size)
  const amp = new Float64Array(WAVETABLE_HARMONICS + 1)
  const phase = new Float64Array(WAVETABLE_HARMONICS + 1)
  const wave = new Float64Array(size)
  const row: WavetableRow = { amps: [], phase: new Float32Array(WAVETABLE_HARMONICS + 1) }
  for (let frame = 0; frame < WAVETABLE_FRAMES; frame++) {
    wavetableRecipe(set, frame / (WAVETABLE_FRAMES - 1), amp, phase)
    let power = 0
    wave.fill(0)
    for (let n = 1; n <= WAVETABLE_HARMONICS; n++) {
      if (amp[n] === 0) continue
      power += 0.5 * amp[n] * amp[n]
      const asSine = amp[n] * Math.cos(TWO_PI * phase[n])
      const asCosine = amp[n] * Math.sin(TWO_PI * phase[n])
      for (let j = 0; j < size; j++) {
        const at = (n * j) & (size - 1)
        wave[j] += asSine * sine[at] + asCosine * sine[(at + size / 4) & (size - 1)]
      }
    }
    let gain = power > 0 ? WAVETABLE_RMS / Math.sqrt(power) : 0
    let peak = 0
    for (let j = 0; j < size; j++) peak = Math.max(peak, Math.abs(wave[j]))
    if (peak * gain > WAVETABLE_PEAK) gain = WAVETABLE_PEAK / peak
    const scaled = new Float32Array(WAVETABLE_HARMONICS + 1)
    for (let n = 1; n <= WAVETABLE_HARMONICS; n++) scaled[n] = amp[n] * gain
    row.amps.push(scaled)
    row.phase.set(phase)
  }
  wavetableRows[set] = row
  return row
}

/** `Wavetable::position_target`: Position with the motion LFO at `lfo` (−1 to 1), turned back into the row at both ends. */
export function wavetablePosition(position: number, motion: number, lfo: number): number {
  let at = position + 0.5 * motion * lfo
  if (at < 0) at = -at
  if (at > 1) at = 2 - at
  return clamp(at, 0, 1)
}

/**
 * `Wavetable::update_pitch`: the harmonics a key at `hz` reads. Up to `whole`
 * they are all there; from there up to `most` they are faded by `share`, over
 * the top quarter of each octave of pitch.
 */
export function wavetableBand(
  hz: number,
  detune: number,
  sampleRate: number,
): { whole: number; most: number; share: number } {
  const highest = Math.min(clamp(hz, 8, 12000) / sampleRate, 0.49) * Math.pow(2, detune / 2400)
  const octave = Math.log2(highest * 2 * WAVETABLE_HARMONICS)
  const level = Math.max(0, Math.ceil(octave))
  if (level >= WAVETABLE_LEVELS - 1) return { whole: 1, most: 1, share: 1 }
  const t = clamp((octave - (level - 1) - 0.75) * 4, 0, 1)
  return {
    whole: WAVETABLE_HARMONICS >> (level + 1),
    most: WAVETABLE_HARMONICS >> level,
    share: 1 - t * t * (3 - 2 * t),
  }
}

/** `Wavetable::control`: the Q that Resonance sets, from no peak up to `kMaxQ`. */
const wavetableQ = (resonance: number): number =>
  Math.SQRT1_2 * Math.pow(WAVETABLE_MAX_Q / Math.SQRT1_2, clamp(resonance, 0, 1))

/**
 * What the wavetable's low-pass does to a frequency, in dB: `kit::Svf` at
 * Cutoff with the Q of Resonance, and the level Resonance takes off the rest
 * for its peak (`filter_gain_`).
 */
export function wavetableFilterDb(
  hz: number,
  cutoff: number,
  resonance: number,
  sampleRate: number,
): number {
  const q = wavetableQ(resonance)
  const g = Math.tan((Math.PI * clamp(cutoff, 5, 0.49 * sampleRate)) / sampleRate)
  const w = Math.tan((Math.PI * Math.min(hz, 0.499 * sampleRate)) / sampleRate) / g
  const trade = q > Math.SQRT1_2 ? Math.sqrt(Math.SQRT1_2 / q) : 1
  const down = (1 - w * w) * (1 - w * w) + (w / q) * (w / q)
  return gainToDb(trade / Math.sqrt(down))
}

/** How the two oscillators of a key stand to each other in a wave that is worked out. */
interface WavetablePair {
  /** Cycles the wave is slipped as a whole: the second oscillator alone. */
  turn: number
  /** Cycles the second oscillator has slipped from the first, both sounding; NaN for one alone, Infinity for a slip too fast to see. */
  slip: number
}
const ONE_OSCILLATOR: WavetablePair = { turn: 0, slip: Number.NaN }

interface WavetableSound {
  cutoff: number
  resonance: number
  detune: number
  sampleRate: number
}

/** The middle C a wave is drawn for until a key is played. */
const WAVETABLE_REST_HZ = 261.63
/** How many cycles after a key goes down the second oscillator is drawn at rest: as far behind as Detune has left it by then. */
const WAVETABLE_STILL_CYCLES = 16
/** A beat between the two oscillators faster than this many a second is not seen at thirty frames a second. */
const WAVETABLE_BEAT_SEEN = 6
/** The seconds of motion the panel at the right holds. */
const WAVETABLE_MOTION_SEC = 10
/** How many keys are drawn lit at once: the device's sixteen voices. */
const WAVETABLE_LIT_MOST = 16
/** The most harmonics a wave is drawn with, and the most points a cycle has. */
const WAVETABLE_DRAWN = 40
const WAVETABLE_POINTS = 160

interface WavetableState {
  /** The points one cycle is drawn with, the harmonics they can show, and each harmonic's sine and cosine at each point. */
  points: number
  harmonics: number
  sin: Float32Array
  cos: Float32Array
  /** The nine frames of the row in use, one cycle each, and which row that is. */
  frames: Float32Array
  row: number
  /** The wave a key reads and its second oscillator's, and what they were worked out from. */
  read: Float32Array
  twin: Float32Array
  readOf: Float64Array
  /** Each harmonic as a sine and a cosine part, and a lit key's wave. */
  parts: Float32Array
  lit: Float32Array
  /** The notes of this frame that sound, by their place in `frame.notes`. */
  sounding: number[]
  /** The pitch of the last key played. */
  hz: number
}

function wavetableMeasure(state: WavetableState, points: number): void {
  if (state.points === points) return
  const harmonics = Math.min(WAVETABLE_DRAWN, Math.floor(points / 3))
  state.points = points
  state.harmonics = harmonics
  state.sin = new Float32Array(harmonics * points)
  state.cos = new Float32Array(harmonics * points)
  for (let n = 1; n <= harmonics; n++) {
    for (let i = 0; i < points; i++) {
      state.sin[(n - 1) * points + i] = Math.sin((TWO_PI * n * i) / points)
      state.cos[(n - 1) * points + i] = Math.cos((TWO_PI * n * i) / points)
    }
  }
  state.frames = new Float32Array(WAVETABLE_FRAMES * points)
  state.read = new Float32Array(points)
  state.twin = new Float32Array(points)
  state.lit = new Float32Array(points)
  state.parts = new Float32Array(2 * (harmonics + 1))
  state.row = -1
  state.readOf.fill(Number.NaN)
}

/** One cycle from harmonics given as sine and cosine parts. */
function wavetableCycle(state: WavetableState, out: Float32Array, from = 0): void {
  const { points, harmonics, sin, cos, parts } = state
  for (let i = 0; i < points; i++) {
    let sum = 0
    for (let n = 1; n <= harmonics; n++) {
      const at = (n - 1) * points + i
      sum += parts[2 * n] * sin[at] + parts[2 * n + 1] * cos[at]
    }
    out[from + i] = sum
  }
}

/**
 * The harmonics of what a key at `hz` gives at `position` along a row, as
 * the device makes it: read between the two nearest frames, with the
 * harmonics its pitch leaves it, through the low-pass. Written into
 * `state.parts`.
 */
function wavetableKey(
  state: WavetableState,
  row: WavetableRow,
  position: number,
  hz: number,
  sound: WavetableSound,
  pair: WavetablePair,
): void {
  const { harmonics, parts } = state
  const at = clamp(position, 0, 1) * (WAVETABLE_FRAMES - 1)
  const frame = Math.min(WAVETABLE_FRAMES - 2, Math.floor(at))
  const mix = at - frame
  const band = wavetableBand(hz, sound.detune, sound.sampleRate)
  const q = wavetableQ(sound.resonance)
  const trade = q > Math.SQRT1_2 ? Math.sqrt(Math.SQRT1_2 / q) : 1
  const g = Math.tan((Math.PI * clamp(sound.cutoff, 5, 0.49 * sound.sampleRate)) / sound.sampleRate)
  for (let n = 1; n <= harmonics; n++) {
    const share = n <= band.whole ? 1 : n <= band.most ? band.share : 0
    const level = lerp(row.amps[frame][n], row.amps[frame + 1][n], mix) * share
    if (level === 0 || n * hz >= 0.49 * sound.sampleRate) {
      parts[2 * n] = 0
      parts[2 * n + 1] = 0
      continue
    }
    // The low-pass: 1 / (1 − w² + j·w/Q) on the filter's own bent scale of frequency.
    const w = Math.tan((Math.PI * n * hz) / sound.sampleRate) / g
    const down = (1 - w * w) * (1 - w * w) + (w / q) * (w / q)
    const passRe = (trade * (1 - w * w)) / down
    const passIm = (-trade * (w / q)) / down
    let angle = TWO_PI * (row.phase[n] + n * pair.turn)
    let size = level
    if (pair.slip === Infinity) {
      // Two that slip faster than a frame: as loud together as two that have nothing to do with each other.
      size *= Math.SQRT1_2
    } else if (!Number.isNaN(pair.slip)) {
      // Two of one wave, the second `slip` cycles on: half their sum.
      size *= Math.cos(Math.PI * n * pair.slip)
      angle += Math.PI * n * pair.slip
    }
    const re = size * Math.cos(angle)
    const im = size * Math.sin(angle)
    parts[2 * n] = re * passRe - im * passIm
    parts[2 * n + 1] = re * passIm + im * passRe
  }
}

interface WavetableParts {
  /** The front frame's left end and its line; each frame behind it stands `dx` further right and `dy` higher. */
  x: number
  y: number
  dx: number
  dy: number
  /** How wide a frame is drawn, and how many pixels a full-scale sample is high. */
  w: number
  scale: number
  /** The motion: Position from the foot of the box to its top, ten seconds from left to right. */
  motion: Box
  /** The level that comes out. */
  foot: Box
}

function wavetableParts(view: Size): WavetableParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const footRoom = 8
  const top = all.y + 11
  const bottom = all.y + all.h - footRoom - 5
  const dx = clamp(view.width * 0.02, 2, 6)
  const motionW = Math.round(clamp(view.width * 0.19, 22, 72))
  const back = WAVETABLE_FRAMES - 1
  const dy = Math.max(1, (bottom - top - 22) / back)
  const y = bottom - 11
  return {
    x: all.x + 3,
    y,
    dx,
    dy,
    w: Math.max(16, all.w - 6 - back * dx - 7 - motionW),
    scale: 20,
    motion: { x: all.x + all.w - motionW, y: y - back * dy, w: motionW, h: back * dy },
    foot: { x: all.x, y: all.y + all.h - footRoom + 1, w: all.w, h: 4 },
  }
}

const wavetable = plateDisplay<WavetableState>({
  place: 'window',
  columns: 2,
  params: [
    'table',
    'position',
    'motion',
    'rate',
    'detune',
    'sub',
    'cutoff',
    'resonance',
    'attack',
    'release',
    'spread',
  ],
  live: { signal: true, notes: true },
  info: 'The nine waveforms of the table from front to back, and strong among them the wave a key reads, its second oscillator beside it and the sub dashed. At the right, where Motion carries Position over ten seconds. A key that sounds lights its wave. Drag the ring to set Position.',
  init: () => ({
    points: 0,
    harmonics: 0,
    sin: new Float32Array(0),
    cos: new Float32Array(0),
    frames: new Float32Array(0),
    row: -1,
    read: new Float32Array(0),
    twin: new Float32Array(0),
    readOf: new Float64Array(7),
    parts: new Float32Array(0),
    lit: new Float32Array(0),
    sounding: [],
    hz: WAVETABLE_REST_HZ,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const parts = wavetableParts(frame)
    const set = clamp(Math.round(frame.value('table')), 0, 4)
    const position = clamp(frame.value('position'), 0, 1)
    const motion = clamp(frame.value('motion'), 0, 1)
    const rate = frame.value('rate')
    const attack = frame.value('attack')
    const release = frame.value('release')
    const spread = clamp(frame.value('spread'), 0, 1)
    const sound: WavetableSound = {
      cutoff: frame.value('cutoff'),
      resonance: frame.value('resonance'),
      detune: frame.value('detune'),
      sampleRate: frame.sampleRate,
    }
    const row = wavetableRow(set)
    wavetableMeasure(state, Math.round(clamp((parts.w / 2) * 1.5, 24, WAVETABLE_POINTS)))
    const { points } = state
    const back = WAVETABLE_FRAMES - 1

    // The keys that sound, and the pitch of the last of them: the wave is drawn for that key.
    const notes = frame.notes
    const sounding = state.sounding
    sounding.length = 0
    for (let index = 0; index < notes.length; index++) {
      const note = notes[index]
      if (restruck(notes, index)) continue
      const level = padLevel(note.age, note.released, attack, release) * padGain(note.gain)
      if (litShare(level) < LIT_DONE) continue
      sounding.push(index)
    }
    if (sounding.length > WAVETABLE_LIT_MOST)
      sounding.splice(0, sounding.length - WAVETABLE_LIT_MOST)
    if (sounding.length > 0) state.hz = notes[sounding[sounding.length - 1]].frequency
    const hz = state.hz

    // The row as it is stored: nine frames, each a cycle, worked out once for a row.
    if (state.row !== set) {
      for (let k = 0; k < WAVETABLE_FRAMES; k++) {
        for (let n = 1; n <= state.harmonics; n++) {
          const angle = TWO_PI * row.phase[n]
          state.parts[2 * n] = row.amps[k][n] * Math.cos(angle)
          state.parts[2 * n + 1] = row.amps[k][n] * Math.sin(angle)
        }
        wavetableCycle(state, state.frames, k * points)
      }
      state.row = set
    }
    // The frames Position and its motion read from stand out from the rest.
    const low = Math.max(0, position - motion / 2)
    const high = Math.min(1, position + motion / 2)
    const firstRead = Math.min(back - 1, Math.floor(low * back))
    const lastRead = Math.max(firstRead + 1, Math.ceil(high * back))
    for (const read of [false, true]) {
      ctx.beginPath()
      for (let k = back; k >= 0; k--) {
        if ((k >= firstRead && k <= lastRead) !== read) continue
        wavePath(
          ctx,
          state.frames,
          points,
          parts.x + k * parts.dx,
          parts.y - k * parts.dy,
          parts.w,
          parts.scale,
          k * points,
        )
      }
      stroke(ctx, colours.ink, 1, read ? INK.back : 0.26)
    }

    // The rail the frames end on, and on it how far the motion carries the reading.
    const railX = parts.x + parts.w
    rule(ctx, railX, parts.y, railX + back * parts.dx, parts.y - back * parts.dy, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    if (high > low) {
      rule(
        ctx,
        railX + low * back * parts.dx,
        parts.y - low * back * parts.dy,
        railX + high * back * parts.dx,
        parts.y - high * back * parts.dy,
        { colour: colours.ink, width: 2.5, alpha: INK.text },
      )
    }

    // The motion: where the LFO carries Position over ten seconds, from where it starts.
    const box = parts.motion
    const yOf = (at: number): number => box.y + (1 - at) * box.h
    for (const end of [0, 1]) {
      rule(ctx, box.x, yOf(end), box.x + box.w, yOf(end), { colour: colours.ink, alpha: INK.grid })
    }
    rule(ctx, railX + position * back * parts.dx, yOf(position), box.x + box.w, yOf(position), {
      colour: colours.ink,
      alpha: INK.rule,
      dash: [2, 2],
    })
    if (rate * WAVETABLE_MOTION_SEC > box.w / 3) {
      // Faster than a line can show in this room: the stretch it runs over, filled.
      fillRect(
        ctx,
        { x: box.x, y: yOf(high), w: box.w, h: Math.max(1, yOf(low) - yOf(high)) },
        colours.ink,
        INK.back,
      )
    } else {
      ctx.beginPath()
      const steps = Math.max(2, Math.round(box.w))
      for (let i = 0; i <= steps; i++) {
        const seconds = (i / steps) * WAVETABLE_MOTION_SEC
        const at = wavetablePosition(position, motion, Math.sin(TWO_PI * rate * seconds))
        if (i === 0) ctx.moveTo(box.x, yOf(at))
        else ctx.lineTo(box.x + (i / steps) * box.w, yOf(at))
      }
      stroke(ctx, colours.ink, 1.25)
    }

    // The wave a key at this pitch reads, and its second oscillator as far on as Detune has carried it.
    const up = Math.pow(2, sound.detune / 2400)
    const apart = up - 1 / up
    const of = state.readOf
    if (
      of[0] !== set ||
      of[1] !== position ||
      of[2] !== sound.cutoff ||
      of[3] !== sound.resonance ||
      of[4] !== sound.detune ||
      of[5] !== hz ||
      of[6] !== sound.sampleRate
    ) {
      wavetableKey(state, row, position, hz, sound, ONE_OSCILLATOR)
      wavetableCycle(state, state.read)
      wavetableKey(state, row, position, hz, sound, {
        turn: Math.min(0.5, WAVETABLE_STILL_CYCLES * apart),
        slip: Number.NaN,
      })
      wavetableCycle(state, state.twin)
      of[0] = set
      of[1] = position
      of[2] = sound.cutoff
      of[3] = sound.resonance
      of[4] = sound.detune
      of[5] = hz
      of[6] = sound.sampleRate
    }
    const readX = parts.x + position * back * parts.dx
    const readY = parts.y - position * back * parts.dy

    // The sub: a sine an octave under the key, one cycle to the wave's two, through the same low-pass.
    const sub =
      frame.value('sub') *
      WAVETABLE_SUB_GAIN *
      Math.pow(10, wavetableFilterDb(hz / 2, sound.cutoff, sound.resonance, sound.sampleRate) / 20)
    if (sub > 0) {
      ctx.beginPath()
      const steps = 32
      for (let i = 0; i <= steps; i++) {
        const y = readY - sub * Math.sin((TWO_PI * i) / steps) * parts.scale
        if (i === 0) ctx.moveTo(readX, y)
        else ctx.lineTo(readX + (i / steps) * parts.w, y)
      }
      ctx.setLineDash([2, 2])
      stroke(ctx, colours.ink, 1, INK.text)
      ctx.setLineDash([])
    }
    if (apart > 0) {
      ctx.beginPath()
      wavePath(ctx, state.twin, points, readX, readY, parts.w, parts.scale)
      stroke(ctx, colours.ink, 1, INK.back)
    }
    ctx.beginPath()
    wavePath(ctx, state.read, points, readX, readY, parts.w, parts.scale)
    stroke(ctx, colours.ink, 1.5)

    // The keys that sound: each its two oscillators together, as far apart as they
    // have slipped since the key went down (they start as one), as tall as it is loud.
    for (const index of sounding) {
      const note = notes[index]
      const level = padLevel(note.age, note.released, attack, release) * padGain(note.gain)
      const beat = note.frequency * apart
      wavetableKey(state, row, position, note.frequency, sound, {
        turn: 0,
        slip: beat > WAVETABLE_BEAT_SEEN ? Infinity : frac(note.age * beat),
      })
      wavetableCycle(state, state.lit)
      ctx.beginPath()
      wavePath(ctx, state.lit, points, readX, readY, parts.w, parts.scale * litShare(level))
      stroke(ctx, colours.accent, 1.25)
    }

    // Where the two oscillators sit between the speakers stands on the level that comes out.
    const middle = parts.foot.x + parts.foot.w / 2
    for (const side of [-1, 1]) {
      dot(
        ctx,
        middle + side * spread * (parts.foot.w / 2 - 3),
        parts.foot.y - 2.5,
        1.5,
        colours.ink,
      )
    }
    levelFoot(frame, parts.foot, outShare(frame))

    // The words: which table, the key the wave is drawn for and how fast the motion runs.
    const pace = motion > 0 ? rateText(rate) : 'still'
    topWords(
      frame,
      choiceWord(frame, 'table'),
      `${pitchName(hz)} ${pace}`,
      pace,
      parts.x - 2,
      box.x + box.w + 1,
    )
    label(frame, `${WAVETABLE_MOTION_SEC} s`, box.x + box.w + 1, parts.y + 10, 'right')

    for (const point of wavetableHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: wavetableHandles,
})

function wavetableHandles(view: DisplayView): DisplayHandle[] {
  const parts = wavetableParts(view)
  const back = WAVETABLE_FRAMES - 1
  const position = clamp(view.value('position'), 0, 1)
  return [
    {
      key: 'position',
      name: 'Position',
      x: parts.x + parts.w + position * back * parts.dx,
      y: parts.y - position * back * parts.dy,
      // The rail climbs from the front frame to the back one: up is further along the row.
      drag: (_x, toY) => ({ position: clamp((parts.y - toY) / (back * parts.dy), 0, 1) }),
      reset: () => ({ position: view.spec('position')?.default ?? 0.3 }),
    },
  ]
}

// --- West Coast --------------------------------------------------------------

/** `wavefolder.h`, `FoldCurve`: where the curve turns, its slope between the turns from the centre out, and how wide a turn is rounded. */
const FOLD_THRESHOLD = [0.6, 1.8, 3.0, 4.1, 5.5]
const FOLD_SLOPE = [1, -1.3 / 1.2, 1.5 / 1.2, -1.7 / 1.1, 1.9 / 1.4, -1.2]
const FOLD_SOFTNESS = 0.15
/** `kFullLevel`: the level of the sine that reaches every fold. */
const FOLD_FULL_LEVEL = 6.3

/** `FoldCurve::init`: the curve as eleven pieces, each a parabola from where it starts. */
const FOLD_PIECES = (() => {
  const count = 2 * FOLD_THRESHOLD.length + 1
  const start = new Array<number>(count).fill(0)
  const c0 = new Array<number>(count).fill(0)
  const c1 = new Array<number>(count).fill(0)
  const c2 = new Array<number>(count).fill(0)
  let slope = FOLD_SLOPE[0]
  for (let k = 0; k < FOLD_THRESHOLD.length; k++) {
    start[2 * k + 1] = FOLD_THRESHOLD[k] - FOLD_SOFTNESS
    start[2 * k + 2] = FOLD_THRESHOLD[k] + FOLD_SOFTNESS
    c1[2 * k] = slope
    c1[2 * k + 1] = slope
    c2[2 * k + 1] = (FOLD_SLOPE[k + 1] - FOLD_SLOPE[k]) / (4 * FOLD_SOFTNESS)
    slope = FOLD_SLOPE[k + 1]
  }
  c1[count - 1] = slope
  for (let p = 0; p + 1 < count; p++) {
    const u = start[p + 1] - start[p]
    c0[p + 1] = c0[p] + u * (c1[p] + u * c2[p])
  }
  return { count, start, c0, c1, c2 }
})()

/** `FoldCurve::shape`: what the folder makes of an input. */
export function westCoastFold(x: number): number {
  const a = Math.abs(x)
  const { count, start, c0, c1, c2 } = FOLD_PIECES
  let p = 0
  while (p + 1 < count && a >= start[p + 1]) p++
  const u = a - start[p]
  const y = c0[p] + u * (c1[p] + u * c2[p])
  return x < 0 ? -y : y
}

/** `west_coast.h`: the modulator's pitch against the note, by the Ratio knob. */
const WEST_COAST_RATIOS = [0.5, 1, 1.5, 2, 3, 3.5, 5]
/** The folder: where Fold starts, how much louder the overtones are than the folder gives them, and how the note's pitch limits Fold. */
const WC_START_LEVEL = 0.42
const WC_OVERTONE_GAIN = 2
const WC_FOLD_LIMIT_HZ = 600
const WC_FOLD_FADE_HZ = 4000
const WC_FOLD_END_HZ = 8000
const WC_SYMMETRY_BASE = 0.3
const WC_SYMMETRY_SLOPE = 0.12
const WC_TIMBRE_ENV_RANGE = 0.6
/** FM: the index in radians at FM 1, how high its sidebands may reach, and where each pitch starts its cycle. */
const WC_MAX_INDEX = 4
const WC_FM_LIMIT_HZ = 14000
const WC_PHASE_SCATTER = 7.6180339
/** The gate. */
const WC_STRIKE_HOLD_SEC = 0.002
const WC_SLOW_SHARE = 0.25
const WC_DECAY_SCALE = 21
const WC_CUTOFF_IN_STEP = 0.5
const WC_OFF_LEVEL = 2.5e-4
const WC_GATE_CEILING_HZ = 18000
const WC_DARK_RATIO = 2
const WC_DARK_FLOOR_HZ = 150
const WC_DARK_CEILING_HZ = 6000
const WC_QUICK_ATTACK_SEC = 0.02
const WC_GATE_DAMPING = 1.25
const WC_GATE_LIMIT = 0.2
const WC_SOFT_STRIKE = 0.55
const WC_HOLD_LEVEL = 0.7
/** What Chance and Drift may add to Fold, and how many octaves Chance may stretch a note's decay. */
const WC_CHANCE_FOLD = 0.25
const WC_CHANCE_DECAY_OCTAVES = 0.8
const WC_MAX_FOLD_DRIFT = 0.1

/** The knobs that make the tone. */
export interface WestCoastTimbre {
  fold: number
  symmetry: number
  fm: number
  /** The Ratio knob's choice, 0 to 6. */
  ratio: number
  timbreEnv: number
}

/** `WestCoast::FoldPoint`: the level the sine enters the folder at, the offset Symmetry adds, and what the folder does to a sine of that level. */
export interface FoldPoint {
  level: number
  offset: number
  fundamental: number
  makeup: number
}

/** `build_tables`: the 128 steps of half a cycle a sine is tried on. */
const WC_STEPS = 128
const WC_SINES = Float64Array.from({ length: WC_STEPS }, (_, k) =>
  Math.sin(Math.PI * ((k + 0.5) / WC_STEPS - 0.5)),
)

const wcRatio = (choice: number): number =>
  WEST_COAST_RATIOS[clamp(Math.round(choice), 0, WEST_COAST_RATIOS.length - 1)]

/** The pitch a note is played at: `WestCoast::note_on` keeps it under 12 kHz and under 0.4 of the sample rate. */
const wcPitch = (hz: number, sampleRate: number): number =>
  clamp(hz, 8, Math.min(12000, 0.4 * sampleRate))

/**
 * `WestCoast::note_on` and `render`: how far FM bends the phase of the note,
 * in radians. FM to the power 1.5 times four, less for a high note so that
 * its sidebands stay under 14 kHz.
 */
export function westCoastIndex(fm: number, ratio: number, hz: number): number {
  const limit = Math.max(0, (WC_FM_LIMIT_HZ / hz - 1) / wcRatio(ratio) - 2)
  return Math.min(WC_MAX_INDEX * fm * Math.sqrt(Math.max(0, fm)), limit)
}

/**
 * `WestCoast::aim`: where a voice at `hz` stands on the folder with its gate
 * at `vactrol` (Timbre Env pushes Fold up by as much as the gate is open).
 * `lean` is what Chance and Drift add to Fold. The fundamental and the
 * make-up are worked out as `build_tables` does, at the level itself and not
 * between two entries of a table.
 */
export function westCoastPoint(
  timbre: WestCoastTimbre,
  hz: number,
  vactrol: number,
  lean = 0,
): FoldPoint {
  const amount = clamp(timbre.fold + lean + timbre.timbreEnv * WC_TIMBRE_ENV_RANGE * vactrol, 0, 1)
  const level = WC_START_LEVEL + amount * Math.sqrt(amount) * westCoastSpan(timbre, hz)
  const offset = timbre.symmetry * (WC_SYMMETRY_BASE + WC_SYMMETRY_SLOPE * level)
  let first = 0
  let square = 0
  let mean = 0
  for (let k = 0; k < WC_STEPS; k++) {
    const y = westCoastFold(level * WC_SINES[k] + offset)
    first += y * WC_SINES[k]
    square += y * y
    mean += y
  }
  first *= 2 / WC_STEPS
  square /= WC_STEPS
  mean /= WC_STEPS
  const overtones = 2 * (square - mean * mean) - first * first
  return {
    level,
    offset,
    fundamental: first,
    makeup: 1 / Math.sqrt(1 + WC_OVERTONE_GAIN * WC_OVERTONE_GAIN * Math.max(0, overtones)),
  }
}

/**
 * `WestCoast::aim`: how much of the folder Fold 1 reaches at this pitch. All
 * of it up to 600 Hz, less the higher the note and the deeper the FM, and
 * nothing from 8 kHz.
 */
export function westCoastSpan(timbre: WestCoastTimbre, hz: number): number {
  const swing = 1 + wcRatio(timbre.ratio) * westCoastIndex(timbre.fm, timbre.ratio, hz)
  const span =
    (FOLD_FULL_LEVEL - WC_START_LEVEL) *
    clamp((WC_FOLD_END_HZ - hz) / (WC_FOLD_END_HZ - WC_FOLD_FADE_HZ), 0, 1)
  return span / Math.max(1, (hz / WC_FOLD_LIMIT_HZ) * swing)
}

/** `WestCoast::note_on`: how hard a key played at `gain` strikes the gate, and how loud its voice is. */
export const westCoastStrike = (gain: number): number =>
  WC_SOFT_STRIKE + (1 - WC_SOFT_STRIKE) * clamp(gain, 0, 1)
export const westCoastAmp = (gain: number): number => 0.45 + 0.55 * clamp(gain, 0, 1)

/**
 * `WestCoast::render`: a closing vactrol. From `from` towards `to` it falls
 * at Decay's rate, slower the further it has closed (a quarter of the rate
 * when shut). In closed form: (v − to) / (0.25 + 0.75 v) falls by a steady
 * ratio.
 */
function wcFall(from: number, to: number, decay: number, seconds: number): number {
  if (seconds <= 0 || from <= to) return Math.max(from, to)
  const a = WC_SLOW_SHARE
  const b = 1 - WC_SLOW_SHARE
  const rate = WC_DECAY_SCALE / decay
  const w = ((from - to) / (a + b * from)) * Math.exp(-rate * (a + b * to) * seconds)
  return (to + a * w) / (1 - b * w)
}

/** The seconds a vactrol takes to close from `from` to `to` with the key up. */
function wcFallSeconds(from: number, to: number, decay: number): number {
  const a = WC_SLOW_SHARE
  const b = 1 - WC_SLOW_SHARE
  const w = (level: number): number => level / (a + b * level)
  return (Math.log(w(from) / w(to)) * decay) / (WC_DECAY_SCALE * a)
}

/** The knobs that move the gate. */
export interface WestCoastGate {
  attack: number
  decay: number
  sustain: number
}

/**
 * `WestCoast::render`: how far the gate is open `seconds` after a key was
 * played as hard as `gain` and let go `heldFor` seconds after that (null
 * while it is held). An Attack up to 20 ms is a strike: the key drives the
 * gate to the strike's full level, the strike lands even when the key is
 * already up, and the gate falls back to where a held key keeps it (0.7 of
 * the strike, times Sustain). A longer Attack is a swell straight to that
 * level, and a key let go lets the gate fall from wherever it is. The
 * vactrol's own rise, 0.7 ms, is left out.
 */
export function westCoastGate(
  seconds: number,
  heldFor: number | null,
  gain: number,
  gate: WestCoastGate,
): number {
  if (seconds <= 0) return 0
  const strike = westCoastStrike(gain)
  const held = strike * WC_HOLD_LEVEL
  const quick = gate.attack <= WC_QUICK_ATTACK_SEC
  const top = quick ? strike : held
  const landed = gate.attack + WC_STRIKE_HOLD_SEC
  let letGo = heldFor ?? Infinity
  if (quick) letGo = Math.max(letGo, landed)
  // The level when the key went up, or now while it is down.
  const until = Math.min(seconds, letGo)
  let level: number
  if (until < gate.attack) level = (top * until) / gate.attack
  else if (until <= landed) level = top
  else level = wcFall(top, held * gate.sustain, gate.decay, until - landed)
  if (seconds > letGo) level = wcFall(level, 0, gate.decay, seconds - letGo)
  return level
}

/**
 * `WestCoast::tune` and `render`: where the gate's low-pass stands in Hz. It
 * never closes below the note, Colour opens it from just above the note up to
 * 18 kHz, a softer strike opens it less far, and it falls faster than the
 * level: half with the gate, half with its square.
 */
export function westCoastCutoff(
  hz: number,
  colour: number,
  gain: number,
  vactrol: number,
  sampleRate: number,
): number {
  const strike = westCoastStrike(gain)
  const dark = clamp(WC_DARK_RATIO * hz, WC_DARK_FLOOR_HZ, WC_DARK_CEILING_HZ)
  const struck = strike / (WC_CUTOFF_IN_STEP + (1 - WC_CUTOFF_IN_STEP) * strike)
  const open = dark * Math.pow(WC_GATE_CEILING_HZ / dark, clamp(colour, 0, 1)) * struck
  const opening = vactrol * (WC_CUTOFF_IN_STEP + (1 - WC_CUTOFF_IN_STEP) * vactrol)
  return Math.min(hz + open * opening, WC_GATE_LIMIT * 2 * sampleRate)
}

/**
 * Two cycles of a voice as `WestCoast::render` makes them, into `out`: the
 * sine with FM through zero, the steady sine as the body with the folder's
 * overtones on top, the mean taken off as the DC blocker does, the make-up,
 * and the gate's low-pass at `cutoff`. The low-pass is the device's own
 * two-pole, run round the cycles until it has settled.
 */
function westCoastWave(
  out: Float32Array,
  timbre: WestCoastTimbre,
  hz: number,
  point: FoldPoint,
  cutoff: number,
): void {
  const count = out.length
  const ratio = wcRatio(timbre.ratio)
  const index = westCoastIndex(timbre.fm, timbre.ratio, hz)
  // Each pitch starts its cycle at a place of its own, the modulator where it would be had both run from zero.
  const start = frac(WC_PHASE_SCATTER * Math.log2(hz))
  const lead = index * Math.cos(TWO_PI * ratio * start)
  let mean = 0
  for (let j = 0; j < count; j++) {
    const x = (2 * j) / count
    const sine = Math.sin(TWO_PI * x + lead - index * Math.cos(TWO_PI * ratio * x))
    const folded = westCoastFold(point.level * sine + point.offset)
    out[j] = sine + WC_OVERTONE_GAIN * (folded - point.fundamental * sine)
    mean += out[j]
  }
  mean /= count
  for (let j = 0; j < count; j++) out[j] = (out[j] - mean) * point.makeup
  // The low-pass at the rate these samples stand for, so many to a cycle of the note.
  // Open past what they can carry, it lets all of them through.
  const rate = (count / 2) * hz
  if (cutoff >= 0.45 * rate) return
  const g = Math.tan((Math.PI * cutoff) / rate)
  const a1 = 1 / (1 + g * (g + WC_GATE_DAMPING))
  const a2 = g * a1
  const a3 = g * a2
  let ic1 = 0
  let ic2 = 0
  // Twice round to settle; what comes out the third time is kept.
  for (let round = 0; round < 3; round++) {
    for (let j = 0; j < count; j++) {
      const v3 = out[j] - ic2
      const v1 = a1 * ic1 + a2 * v3
      const v2 = ic2 + a2 * ic1 + a3 * v3
      ic1 = 2 * v1 - ic1
      ic2 = 2 * v2 - ic2
      if (round === 2) out[j] = v2
    }
  }
}

/** The A that what the knobs set is drawn for: below 600 Hz, where the device begins to hold Fold back. */
const WC_REST_HZ = 220
/** The folder's curve as it is drawn: inputs from −7.6 to 7.6, which holds the furthest a sine reaches, and outputs to 1.6 either way. */
const WC_CURVE_IN = 7.6
const WC_CURVE_OUT = 1.6
/**
 * The height a voice's wave has room for inside its box, in the wave's own
 * units. A few are taller, 2.3 at the most (full Fold far off centre): those
 * run so many pixels into the gaps above and below, so no wave is cut flat
 * where the device does not cut it.
 */
const WC_WAVE_PEAK = 2
const WC_WAVE_PAST = 4
/** The gate's scale of time, on ratios: 4 ms at the left, 16 s at the right. */
const WC_TIME_FROM = 0.004
const WC_TIME_TO = 16
/** The gate's scale of level: its foot is where the device stops a voice, 72 dB down. */
const WC_GATE_DB = 72
/** The level the Decay handle stands at, half way down that scale. */
const WC_HANDLE_LEVEL = Math.pow(10, -WC_GATE_DB / 40)
/** How many notes stand lit on the gate at once: the device's eight voices. */
const WC_LIT_MOST = 8
/** The room the words "1 s" and a handle beside them take to the right of the second's line, in pixels. */
const WC_SECOND_ROOM = 30
/** The samples two cycles of a voice are worked out at. */
const WC_SAMPLES = 256

interface WestCoastParts {
  /** The folder's curve. */
  curve: Box
  /** Two cycles of the note. */
  wave: Box
  /** The gate over time. */
  gate: Box
  /** The level that comes out. */
  foot: Box
}

function westCoastParts(view: Size): WestCoastParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const footRoom = 8
  const top = all.y + 11
  const gateH = Math.round(clamp(view.height * 0.2, 12, 30))
  const gateY = all.y + all.h - footRoom - 2 - gateH
  const upper = Math.max(8, gateY - 4 - top)
  const curveW = Math.round(clamp(view.width * 0.22, 28, 70))
  return {
    curve: { x: all.x + 1, y: top, w: curveW, h: upper },
    wave: { x: all.x + curveW + 7, y: top, w: all.w - curveW - 8, h: upper },
    gate: { x: all.x + 1, y: gateY, w: all.w - 2, h: gateH },
    foot: { x: all.x, y: all.y + all.h - footRoom + 1, w: all.w, h: 4 },
  }
}

const wcXOfTime = (seconds: number, gate: Box): number =>
  gate.x +
  clamp(
    Math.log(Math.max(seconds, 1e-6) / WC_TIME_FROM) / Math.log(WC_TIME_TO / WC_TIME_FROM),
    0,
    1,
  ) *
    gate.w
const wcTimeOfX = (x: number, gate: Box): number =>
  WC_TIME_FROM * Math.pow(WC_TIME_TO / WC_TIME_FROM, clamp((x - gate.x) / gate.w, 0, 1))
const wcYOfLevel = (level: number, gate: Box): number =>
  gate.y + (1 - litShare(level, WC_GATE_DB)) * gate.h

function wcTimbre(view: DisplayView): WestCoastTimbre {
  return {
    fold: view.value('fold'),
    symmetry: view.value('symmetry'),
    fm: view.value('fm'),
    ratio: view.value('ratio'),
    timbreEnv: view.value('timbreEnv'),
  }
}

interface WestCoastState {
  /** Two cycles of a note as it is struck, the same with Chance and Drift at either end of what they add to Fold, and what the three were worked out from. */
  struck: Float32Array
  low: Float32Array
  high: Float32Array
  struckOf: Float64Array
  /** A lit note's two cycles. */
  lit: Float32Array
  /** What they would be worked out from now. */
  struckNow: Float64Array
  /** The notes of this frame that sound, by their place in `frame.notes`. */
  sounding: number[]
}

/** A voice's two cycles across a box, added to the path that is open. */
function wcWavePath(ctx: Ctx, wave: Float32Array, box: Box, share = 1, back = false): void {
  const middle = box.y + box.h / 2
  const scale = (box.h / 2 / WC_WAVE_PEAK) * share
  const last = wave.length - 1
  for (let step = 0; step <= last; step++) {
    const j = back ? last - step : step
    const x = box.x + (j / last) * box.w
    const y = clamp(middle - wave[j] * scale, box.y - WC_WAVE_PAST, box.y + box.h + WC_WAVE_PAST)
    if (step === 0 && !back) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
}

const westCoast = plateDisplay<WestCoastState>({
  place: 'window',
  columns: 2,
  params: [
    'fold',
    'symmetry',
    'fm',
    'ratio',
    'timbreEnv',
    'attack',
    'decay',
    'sustain',
    'colour',
    'chance',
    'drift',
  ],
  live: { signal: true, notes: true },
  info: 'At the left the folder’s curve and how far into it the tone reaches, beside it the wave of a note as it is struck. Below, the gate on a scale of time: how loud a note is and, dashed, how bright. Notes that sound stand on it. Drag the rings to set Fold and Decay.',
  init: () => ({
    struck: new Float32Array(WC_SAMPLES),
    low: new Float32Array(WC_SAMPLES),
    high: new Float32Array(WC_SAMPLES),
    struckOf: new Float64Array(8).fill(Number.NaN),
    struckNow: new Float64Array(8),
    lit: new Float32Array(WC_SAMPLES),
    sounding: [],
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const parts = westCoastParts(frame)
    const timbre = wcTimbre(frame)
    const gate: WestCoastGate = {
      attack: frame.value('attack'),
      decay: frame.value('decay'),
      sustain: clamp(frame.value('sustain'), 0, 1),
    }
    const colour = frame.value('colour')
    const chance = clamp(frame.value('chance'), 0, 1)
    const drift = clamp(frame.value('drift'), 0, 1)
    const rate = frame.sampleRate

    // The notes that sound. A key played again while its note rings strikes the same gate again:
    // the later of two notes with one id is the one that is drawn.
    const notes = frame.notes
    const sounding = state.sounding
    sounding.length = 0
    for (let index = 0; index < notes.length; index++) {
      const note = notes[index]
      let again = false
      for (let later = index + 1; later < notes.length; later++)
        if (notes[later].id === note.id) again = true
      if (again) continue
      const heldFor = note.released === null ? null : note.age - note.released
      if (westCoastGate(note.age, heldFor, note.gain, gate) < WC_OFF_LEVEL) continue
      sounding.push(index)
    }
    if (sounding.length > WC_LIT_MOST) sounding.splice(0, sounding.length - WC_LIT_MOST)

    // What the knobs set is drawn for one note, an A in the middle of the keyboard, as it is
    // struck at full: the gate wide open, Timbre Env at its most.
    const hz = WC_REST_HZ
    const point = westCoastPoint(timbre, hz, 1)
    // Chance changes Fold from note to note and Drift moves it while a note sounds: so far either way.
    const lean = chance * WC_CHANCE_FOLD + drift * WC_MAX_FOLD_DRIFT
    const now = state.struckNow
    now[0] = timbre.fold
    now[1] = timbre.symmetry
    now[2] = timbre.fm
    now[3] = timbre.ratio
    now[4] = timbre.timbreEnv
    now[5] = colour
    now[6] = lean
    now[7] = rate
    if (now.some((value, index) => state.struckOf[index] !== value)) {
      const open = westCoastCutoff(hz, colour, 1, 1, rate)
      westCoastWave(state.struck, timbre, hz, point, open)
      westCoastWave(state.low, timbre, hz, westCoastPoint(timbre, hz, 1, -lean), open)
      westCoastWave(state.high, timbre, hz, westCoastPoint(timbre, hz, 1, lean), open)
      state.struckOf.set(now)
    }

    // The folder: its curve, and strong on it the stretch the sine runs over.
    const { curve } = parts
    const xIn = (value: number): number => curve.x + ((value / WC_CURVE_IN + 1) / 2) * curve.w
    const yOut = (value: number): number => curve.y + ((1 - value / WC_CURVE_OUT) / 2) * curve.h
    rule(ctx, curve.x, yOut(0), curve.x + curve.w, yOut(0), {
      colour: colours.ink,
      alpha: INK.grid,
    })
    rule(ctx, xIn(0), curve.y, xIn(0), curve.y + curve.h, { colour: colours.ink, alpha: INK.grid })
    const reach = (from: number, to: number): void => {
      ctx.beginPath()
      const steps = Math.max(2, Math.ceil(xIn(to) - xIn(from)))
      for (let i = 0; i <= steps; i++) {
        const value = from + ((to - from) * i) / steps
        const y = clamp(yOut(westCoastFold(value)), curve.y, curve.y + curve.h)
        if (i === 0) ctx.moveTo(xIn(value), y)
        else ctx.lineTo(xIn(value), y)
      }
    }
    reach(-WC_CURVE_IN, WC_CURVE_IN)
    stroke(ctx, colours.ink, 1, INK.back)
    reach(point.offset - point.level, point.offset + point.level)
    stroke(ctx, colours.ink, 2)

    // The wave: where Chance and Drift may take it, and the note as struck.
    const { wave } = parts
    rule(ctx, wave.x, wave.y + wave.h / 2, wave.x + wave.w, wave.y + wave.h / 2, {
      colour: colours.ink,
      alpha: INK.grid,
    })
    if (lean > 0) {
      ctx.beginPath()
      wcWavePath(ctx, state.low, wave)
      wcWavePath(ctx, state.high, wave, 1, true)
      ctx.closePath()
      ctx.globalAlpha = INK.fill + 0.1
      ctx.fillStyle = colours.ink
      ctx.fill()
      ctx.globalAlpha = 1
    }
    ctx.beginPath()
    wcWavePath(ctx, state.struck, wave)
    stroke(ctx, colours.ink, 1.5)

    // The gate, on a scale of time: a line at every tenfold.
    const box = parts.gate
    const foot = box.y + box.h
    rule(ctx, box.x, foot, box.x + box.w, foot, { colour: colours.ink, alpha: INK.rule })
    for (const seconds of [0.01, 0.1, 1, 10]) {
      const x = wcXOfTime(seconds, box)
      rule(ctx, x, box.y, x, foot, { colour: colours.ink, alpha: INK.grid })
    }
    const steps = Math.max(8, Math.round(box.w / 2))
    const landed = gate.attack + WC_STRIKE_HOLD_SEC
    const timeAt = (i: number): number =>
      WC_TIME_FROM * Math.pow(WC_TIME_TO / WC_TIME_FROM, i / steps)
    const xAt = (i: number): number => box.x + (i / steps) * box.w
    // Where Chance may take a note's decay: 0.8 of an octave either way at its most.
    if (chance > 0) {
      const stretch = Math.pow(2, chance * WC_CHANCE_DECAY_OCTAVES)
      const long: WestCoastGate = { ...gate, decay: gate.decay * stretch }
      const short: WestCoastGate = { ...gate, decay: gate.decay / stretch }
      ctx.beginPath()
      for (let i = 0; i <= steps; i++) {
        const level = westCoastGate(timeAt(i), null, 1, long)
        if (i === 0) ctx.moveTo(xAt(i), wcYOfLevel(level, box))
        else ctx.lineTo(xAt(i), wcYOfLevel(level, box))
      }
      for (let i = steps; i >= 0; i--) {
        ctx.lineTo(xAt(i), wcYOfLevel(westCoastGate(timeAt(i), null, 1, short), box))
      }
      ctx.closePath()
      ctx.globalAlpha = INK.fill + 0.1
      ctx.fillStyle = colours.ink
      ctx.fill()
      ctx.globalAlpha = 1
    }
    // How bright: where the low-pass stands between the note itself and as far as it can open.
    const ceiling = Math.min(hz + WC_GATE_CEILING_HZ, WC_GATE_LIMIT * 2 * rate)
    ctx.beginPath()
    for (let i = 0; i <= steps; i++) {
      const cutoff = westCoastCutoff(hz, colour, 1, westCoastGate(timeAt(i), null, 1, gate), rate)
      const y = foot - clamp(Math.log(cutoff / hz) / Math.log(ceiling / hz), 0, 1) * box.h
      if (i === 0) ctx.moveTo(xAt(i), y)
      else ctx.lineTo(xAt(i), y)
    }
    ctx.setLineDash([2, 2])
    stroke(ctx, colours.ink, 1, INK.text)
    ctx.setLineDash([])
    // How loud: a key that is held, and thin under it the same key let go as soon as it is struck.
    for (const held of gate.sustain > 0 ? [false, true] : [true]) {
      ctx.beginPath()
      for (let i = 0; i <= steps; i++) {
        const level = westCoastGate(timeAt(i), held ? null : landed, 1, gate)
        if (i === 0) ctx.moveTo(xAt(i), wcYOfLevel(level, box))
        else ctx.lineTo(xAt(i), wcYOfLevel(level, box))
        // Shut, the voice is stopped: the line ends on the foot.
        if (i > 0 && level < WC_OFF_LEVEL && timeAt(i) > landed) break
      }
      stroke(ctx, colours.ink, held ? 1.5 : 1, held ? 1 : INK.back)
    }

    // The notes that sound: each stands on the gate where its time has come to, as tall as it
    // is loud. The newest shows its wave as the gate has left it, smaller and duller sooner,
    // and how far it reaches into the folder now.
    for (let at = sounding.length - 1; at >= 0; at--) {
      const note = notes[sounding[at]]
      const heldFor = note.released === null ? null : note.age - note.released
      const vactrol = westCoastGate(note.age, heldFor, note.gain, gate)
      const level = vactrol * westCoastAmp(note.gain)
      const x = wcXOfTime(note.age, box)
      const y = wcYOfLevel(level, box)
      ctx.beginPath()
      ctx.moveTo(x, foot)
      ctx.lineTo(x, y)
      stroke(ctx, colours.accent, 1.75)
      dot(ctx, x, y, 2, colours.accent)
      if (at < sounding.length - 1) continue
      const noteHz = wcPitch(note.frequency, rate)
      const lit = westCoastPoint(timbre, noteHz, vactrol)
      westCoastWave(
        state.lit,
        timbre,
        noteHz,
        lit,
        westCoastCutoff(noteHz, colour, note.gain, vactrol, rate),
      )
      ctx.beginPath()
      wcWavePath(ctx, state.lit, wave, litShare(level, WC_GATE_DB))
      stroke(ctx, colours.accent, 1.5)
      reach(lit.offset - lit.level, lit.offset + lit.level)
      stroke(ctx, colours.accent, 2)
    }

    levelFoot(frame, parts.foot, outShare(frame))

    // The words: the modulator's ratio, and how long a note rings.
    text(frame, `FM ${choiceWord(frame, 'ratio')}`, curve.x, 11)
    text(frame, secondsText(gate.decay), wave.x + wave.w, 11, { align: 'right' })
    // The second is named above or below the held key's line, whichever the line leaves
    // free, and on the side of its own line that the Decay handle does not stand on.
    const spots = westCoastHandles(frame)
    const high = litShare(westCoastGate(1.4, null, 1, gate), WC_GATE_DB) > 0.5
    const second = wcXOfTime(1, box)
    const decayX = spots[1].x
    const before = decayX >= second && decayX < second + WC_SECOND_ROOM
    label(
      frame,
      '1 s',
      before ? second - 5 : second + 5,
      high ? foot - 2 : box.y + 8,
      before ? 'right' : 'left',
    )

    for (const spot of spots) {
      handle(frame, spot.x, spot.y, { hot: frame.hot === spot.key })
    }
  },
  handles: westCoastHandles,
})

function westCoastHandles(view: DisplayView): DisplayHandle[] {
  const parts = westCoastParts(view)
  const timbre = wcTimbre(view)
  const hz = WC_REST_HZ
  const point = westCoastPoint(timbre, hz, 1)
  const { curve, gate } = parts
  const end = point.offset + point.level
  const xIn = (value: number): number => curve.x + ((value / WC_CURVE_IN + 1) / 2) * curve.w
  const span = westCoastSpan(timbre, hz)
  const pushed = timbre.timbreEnv * WC_TIMBRE_ENV_RANGE
  const attack = view.value('attack')
  const decay = view.value('decay')
  const top = attack <= WC_QUICK_ATTACK_SEC ? 1 : WC_HOLD_LEVEL
  const landed = attack + WC_STRIKE_HOLD_SEC
  const falls = wcFallSeconds(top, WC_HANDLE_LEVEL, 1)
  return [
    {
      key: 'fold',
      name: 'Fold',
      x: xIn(end),
      y: clamp(
        curve.y + ((1 - westCoastFold(end) / WC_CURVE_OUT) / 2) * curve.h,
        curve.y,
        curve.y + curve.h,
      ),
      // The end of the stretch the sine runs over: further out is more Fold. Timbre Env has
      // pushed the end out already, and past the last fold it waits there: the drag moves Fold
      // from where it stands, by as much as the end is moved.
      drag: (toX: number, _y: number, hold?: DisplayHold) => {
        const kept = hold ?? {}
        kept.past ??= timbre.fold + pushed - clamp(timbre.fold + pushed, 0, 1)
        const reached = (toX - curve.x) / curve.w
        const level =
          ((reached * 2 - 1) * WC_CURVE_IN - timbre.symmetry * WC_SYMMETRY_BASE) /
          (1 + timbre.symmetry * WC_SYMMETRY_SLOPE)
        const amount = Math.pow(clamp((level - WC_START_LEVEL) / Math.max(span, 1e-6), 0, 1), 2 / 3)
        return { fold: amount - pushed + kept.past }
      },
      reset: () => ({ fold: view.spec('fold')?.default ?? 0.35 }),
    },
    {
      key: 'decay',
      name: 'Decay',
      x: wcXOfTime(landed + falls * decay, gate),
      y: wcYOfLevel(WC_HANDLE_LEVEL, gate),
      // Half way down the gate's fall: right is a longer Decay.
      drag: (toX) => ({ decay: Math.max(0, wcTimeOfX(toX, gate) - landed) / falls }),
      reset: () => ({ decay: view.spec('decay')?.default ?? 1.4 }),
    },
  ]
}

// --- Drone -------------------------------------------------------------------

/** `drone.h`, `kRatio`: the partials of each shape against the key, in the order Partials brings them in. */
const DRONE_RATIO = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 1, 4, 2, 8, 4, 16],
  [1, 1.5, 2, 3, 4, 6, 8, 12],
  [1, 2, 3, 4, 5, 6, 7, 8],
  [1, 1.25, 1.5, 2, 2.5, 3, 4, 5],
  [1, 1.2, 1.5, 2, 2.4, 3, 4, 4.8],
  [1, 1.125, 1.5, 4 / 3, 1.2, 5 / 3, 16 / 15, 2],
]
const DRONE_PARTIALS = 8
/** `kPanBase`: where each partial sits between the speakers at full Width, left to right as −1 to 1. */
const DRONE_PAN = [0, -0.8, 0.8, -0.5, 0.5, -1, 1, 0.3]
/** `kSubGain`, `kAirGain`, `kAirQ`, `kLevelDepth` and `kFilterOctaves`. */
const DRONE_SUB_GAIN = 0.7
const DRONE_AIR_GAIN = 0.9
const DRONE_AIR_Q = 5
const DRONE_LEVEL_DEPTH = 0.7
const DRONE_FILTER_OCTAVES = 0.33
/** The harmonics a stored cycle has, and the copies of it by band limit. */
const DRONE_HARMONICS = 512
const DRONE_LEVELS = 10

/**
 * `Drone::tune` and `update`: how strong each of the eight partials of a key
 * at `hz` is, into `into`. Partials brings the upper ones in one after
 * another, each falls off as the root of its ratio, one that would pass 0.45
 * of the sample rate is left out, and the sum is held at one power.
 */
export function dronePartials(
  shape: number,
  partials: number,
  hz: number,
  sampleRate: number,
  into: number[],
): number[] {
  const ratios = DRONE_RATIO[clamp(Math.round(shape), 0, DRONE_RATIO.length - 1)]
  const root = Math.min(clamp(hz, 8, 12000) / sampleRate, 0.45)
  const reach = 1 + 7 * clamp(partials, 0, 1)
  let power = 0
  for (let k = 0; k < DRONE_PARTIALS; k++) {
    const rolloff = root * ratios[k] < 0.45 ? 1 / Math.sqrt(ratios[k]) : 0
    into[k] = clamp(reach - k, 0, 1) * rolloff
    power += into[k] * into[k]
  }
  const norm = power > 0 ? 1 / Math.sqrt(power) : 0
  for (let k = 0; k < DRONE_PARTIALS; k++) into[k] *= norm
  into.length = DRONE_PARTIALS
  return into
}

/** `Drone::build_tables` and `process`: how strong harmonic `n` of a partial is as Wave goes from a sine through a triangle to a sawtooth. */
export function droneHarmonic(n: number, wave: number): number {
  const sine = n === 1 ? 1 : 0
  const triangle = n & 1 ? (((n - 1) / 2) & 1 ? -1 : 1) * (8 / (Math.PI * Math.PI * n * n)) : 0
  const saw = ((n & 1 ? 1 : -1) * 2) / (Math.PI * n)
  const at = clamp(wave, 0, 1) * 2
  return Math.abs(at >= 1 ? lerp(triangle, saw, at - 1) : lerp(sine, triangle, at))
}

/** `Drone::tune`: how many harmonics the copy a partial at `hz` reads has. */
export function droneTop(hz: number, sampleRate: number): number {
  const octave = Math.log2(Math.max(hz / sampleRate, 1e-6) * 1.01 * 2 * DRONE_HARMONICS)
  return DRONE_HARMONICS >> clamp(Math.ceil(octave), 0, DRONE_LEVELS - 1)
}

/** What the drone's low-pass does to a frequency, in dB: `kit::Svf` at Cutoff with no peak. */
export function droneLowpassDb(hz: number, cutoff: number, sampleRate: number): number {
  const g = Math.tan((Math.PI * clamp(cutoff, 5, 0.49 * sampleRate)) / sampleRate)
  const w = Math.tan((Math.PI * Math.min(hz, 0.499 * sampleRate)) / sampleRate) / g
  return -10 * Math.log10(1 + w * w * w * w)
}

/**
 * A key as the drone's display remembers it. The list of played notes forgets
 * a key twenty seconds after it went up, and a drone that Hold keeps sounds on
 * for as long as it is left: so the display keeps the keys it has seen, with
 * what the device did with each.
 */
export interface DroneKey {
  id: number
  frequency: number
  gain: number
  /** When it was played, in seconds on the display's clock. */
  on: number
  /** Seconds after that at which its key went up, and at which it began to fade; NaN for what has not happened. */
  up: number
  fade: number
  /** It started nothing: a second press under Hold, which only lets the drone go. */
  none: boolean
  /** It is in the list of played notes at this frame. */
  listed: boolean
}

/** Two readings of one note's start lie this near: a frame's clock and the list's are read a moment apart. */
const DRONE_SAME_SEC = 0.05
/** The longest Release there is: a fade is over after it. */
const DRONE_RELEASE_MOST = 30
/** How many keys the list has forgotten are kept: the device's eight voices. */
const DRONE_KEPT_MOST = 8

/** `Drone::find_key`: the key that sounds on (not fading) with this id or this pitch, the latest of them. */
function droneSounding(keys: readonly DroneKey[], id: number, hz: number): DroneKey | null {
  let found: DroneKey | null = null
  for (const key of keys) {
    if (key.none || !Number.isNaN(key.fade)) continue
    if (key.id === id || Math.abs(key.frequency - hz) <= 0.0005 * hz) found = key
  }
  return found
}

/** `Drone::apply`, Hold switched off: every drone whose key is up is let go, at `now`. Keys still down stay. */
export function droneFree(keys: readonly DroneKey[], now: number): void {
  for (const key of keys) {
    if (!key.none && Number.isNaN(key.fade) && !Number.isNaN(key.up)) key.fade = now - key.on
  }
}

/**
 * What became of each key in the device, by `Drone::note_on` and `note_off`,
 * kept in `keys` from frame to frame. With Hold off a key fades when it is let
 * go, and a held key struck again is cut off. With Hold on it sounds on after
 * its key went up, the same key played again lets it go, and that second
 * press starts nothing; the same key is the same id or the same pitch. A key
 * the list has forgotten stays for as long as it sounds or fades. `silent`
 * says nothing comes out of the device: then nothing the list has forgotten
 * can still sound, whatever the display missed.
 *
 * A note is met here once, at the first frame that lists it, and Hold is read
 * as it stands then. A note older than the display's first frame is taken as
 * if Hold had stood as it does now all along.
 */
export function droneFollow(
  keys: DroneKey[],
  notes: readonly DisplayNote[],
  now: number,
  hold: boolean,
  silent = false,
): DroneKey[] {
  for (const key of keys) key.listed = false
  for (const note of notes) {
    const on = now - note.age
    let key: DroneKey | null = null
    for (const kept of keys) {
      if (kept.listed || kept.id !== note.id || Math.abs(kept.on - on) > DRONE_SAME_SEC) continue
      key = kept
      break
    }
    if (!key) {
      key = {
        id: note.id,
        frequency: note.frequency,
        gain: note.gain,
        on,
        up: Number.NaN,
        fade: Number.NaN,
        none: false,
        listed: true,
      }
      if (hold) {
        // The second press of a key lets its drone go and starts nothing.
        const sounding = droneSounding(keys, note.id, note.frequency)
        if (sounding) {
          sounding.fade = on - sounding.on
          key.none = true
        }
      } else {
        // A held key struck again is cut off in a twentieth of a second (`fast_release`):
        // the list lets the old note go at the moment the new one starts.
        for (const old of keys) {
          if (old.id === note.id && Math.abs(old.on + old.up - on) < 0.005) old.none = true
        }
      }
      keys.push(key)
    }
    key.on = on
    key.listed = true
    if (note.released !== null && Number.isNaN(key.up)) {
      key.up = note.age - note.released
      if (!hold && Number.isNaN(key.fade)) key.fade = key.up
    }
  }
  // What the list no longer has is gone when it started nothing, when its fade is over, when
  // its key was still down (the list forgets no held key: it was emptied), and in silence.
  // Of the rest the newest eight stay.
  let forgotten = 0
  for (let index = keys.length - 1; index >= 0; index--) {
    const key = keys[index]
    if (key.listed) continue
    const over = now - key.on - key.fade > DRONE_RELEASE_MOST
    const gone = silent || key.none || over || Number.isNaN(key.up)
    if (gone || forgotten >= DRONE_KEPT_MOST) keys.splice(index, 1)
    else forgotten++
  }
  return keys
}

/** `kit::Adsr` on a key the display remembers: how far its envelope is open at `now`. */
export function droneKeyLevel(key: DroneKey, now: number, attack: number, release: number): number {
  if (key.none) return 0
  const age = now - key.on
  return padLevel(age, Number.isNaN(key.fade) ? null : age - key.fade, attack, release)
}

/** The A a key's partials are drawn for until one is played. */
const DRONE_REST_HZ = 110
/** The bars' scale of level: a partial alone is 0 dB. */
const DRONE_TOP_DB = 4
const DRONE_FLOOR_DB = -44
/** White noise between −1 and 1 is as loud as a sine this high. */
const DRONE_NOISE_AS_SINE = Math.sqrt(2 / 3)
/** How many overtones of a partial are drawn at most, and how many keys are lit: the device's eight voices. */
const DRONE_OVERTONES = 24
const DRONE_LIT_MOST = 8
/** A peak under this is no sound at all (120 dB down), and so many seconds of it are silence. */
const DRONE_SILENCE = 1e-6
const DRONE_SILENCE_SEC = 1

interface DroneParts {
  /** The partials by pitch, 20 Hz to 20 kHz, and by level. */
  bars: Box
  /** The level that comes out. */
  foot: Box
}

function droneParts(view: Size): DroneParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const footRoom = 8
  return {
    bars: { x: all.x + 1, y: all.y + 12, w: all.w - 2, h: Math.max(8, all.h - 12 - footRoom - 5) },
    foot: { x: all.x, y: all.y + all.h - footRoom + 1, w: all.w, h: 4 },
  }
}

/** Partials on one pitch stand side by side, two pixels apart: the first in the middle, the next right, the next left. */
function droneBeside(ratios: readonly number[], k: number): number {
  let before = 0
  for (let j = 0; j < k; j++) if (ratios[j] === ratios[k]) before++
  return (before & 1 ? 1 : -1) * 2 * ((before + 1) >> 1)
}

interface DroneState {
  /** The levels of the eight partials, of the key drawn and of a lit one. */
  levels: number[]
  lit: number[]
  /** The keys the display remembers, and those of them that sound at this frame. */
  keys: DroneKey[]
  sounding: DroneKey[]
  /** Whether Hold was on at the last frame. */
  hold: boolean | null
  /** How long nothing has come out of the device, in seconds. */
  quiet: number
  /** The pitch of the last key played. */
  hz: number
}

const drone = plateDisplay<DroneState>({
  place: 'window',
  columns: 2,
  params: [
    'shape',
    'partials',
    'wave',
    'movement',
    'rate',
    'sub',
    'air',
    'cutoff',
    'attack',
    'release',
    'width',
    'hold',
  ],
  live: { signal: true, notes: true },
  info: 'The partials of a key as bars by pitch, with their overtones, the sub under them, the band of air and the low pass over it all. The pale caps are how far Movement lets a partial wander. Keys that sound light their partials. Drag the ring to set Cutoff.',
  init: () => ({
    levels: [],
    lit: [],
    keys: [],
    sounding: [],
    hold: null,
    quiet: 0,
    hz: DRONE_REST_HZ,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    const all = ground(frame)
    const parts = droneParts(frame)
    const { bars } = parts
    const shape = clamp(Math.round(frame.value('shape')), 0, DRONE_RATIO.length - 1)
    const ratios = DRONE_RATIO[shape]
    const partials = frame.value('partials')
    const wave = frame.value('wave')
    const movement = clamp(frame.value('movement'), 0, 1)
    const cutoff = frame.value('cutoff')
    const attack = frame.value('attack')
    const release = frame.value('release')
    const width = clamp(frame.value('width'), 0, 1)
    const hold = frame.value('hold') >= 0.5
    const rate = frame.sampleRate
    const foot = bars.y + bars.h
    const yOf = (level: number): number =>
      clamp(yOfDb(gainToDb(level), bars, DRONE_TOP_DB, DRONE_FLOOR_DB), bars.y, foot)
    const pass = (hz: number): number => Math.pow(10, droneLowpassDb(hz, cutoff, rate) / 20)

    // Hold switched off lets go what it kept, whether the display runs or stands still.
    if (state.hold === true && !hold) droneFree(state.keys, frame.now)
    state.hold = hold

    // The keys that sound, and the last of them: the partials are drawn for that key. A still
    // draw is handed no notes and no sound: it lights nothing and forgets nothing.
    const sounding = state.sounding
    sounding.length = 0
    if (frame.signal !== null || frame.notes.length > 0) {
      // Silence that lasts says no drone is left, whatever the display has missed. A moment
      // of it says nothing: a tap that was just hung on the device has not heard yet.
      const heard = frame.signal === null || frame.signal.output.peak > DRONE_SILENCE
      state.quiet = heard ? 0 : state.quiet + frame.dt
      const keys = droneFollow(
        state.keys,
        frame.notes,
        frame.now,
        hold,
        state.quiet > DRONE_SILENCE_SEC,
      )
      for (const key of keys) {
        const level = droneKeyLevel(key, frame.now, attack, release) * padGain(key.gain)
        if (litShare(level, DRONE_TOP_DB - DRONE_FLOOR_DB) >= LIT_DONE) sounding.push(key)
      }
    }
    if (sounding.length > DRONE_LIT_MOST) sounding.splice(0, sounding.length - DRONE_LIT_MOST)
    if (sounding.length > 0) state.hz = clamp(sounding[sounding.length - 1].frequency, 8, 12000)
    const hz = state.hz

    freqGrid(frame, bars)
    rule(ctx, bars.x, foot, bars.x + bars.w, foot, { colour: colours.ink, alpha: INK.rule })

    // The low-pass over everything, and how far Movement lets it wander: a third of an octave either way.
    const steps = Math.max(8, Math.round(bars.w / 2))
    const hzAt = (i: number): number => hzOfX(bars.x + (i / steps) * bars.w, bars)
    const xAt = (i: number): number => bars.x + (i / steps) * bars.w
    const wander = Math.pow(2, movement * DRONE_FILTER_OCTAVES)
    if (movement > 0) {
      ctx.beginPath()
      for (let i = 0; i <= steps; i++) {
        const y = yOf(Math.pow(10, droneLowpassDb(hzAt(i), cutoff * wander, rate) / 20))
        if (i === 0) ctx.moveTo(xAt(i), y)
        else ctx.lineTo(xAt(i), y)
      }
      for (let i = steps; i >= 0; i--) {
        ctx.lineTo(xAt(i), yOf(Math.pow(10, droneLowpassDb(hzAt(i), cutoff / wander, rate) / 20)))
      }
      ctx.closePath()
      ctx.globalAlpha = INK.fill
      ctx.fillStyle = colours.ink
      ctx.fill()
      ctx.globalAlpha = 1
    }
    ctx.beginPath()
    for (let i = 0; i <= steps; i++) {
      if (i === 0) ctx.moveTo(xAt(i), yOf(pass(hzAt(i))))
      else ctx.lineTo(xAt(i), yOf(pass(hzAt(i))))
    }
    stroke(ctx, colours.ink, 1, INK.back)

    // The air: noise through a narrow band on the key, as loud as Air sets it, under the low-pass.
    const air = frame.value('air') * DRONE_AIR_GAIN * DRONE_NOISE_AS_SINE
    if (air > 0) {
      const band = biquad('bandpass', clamp(hz, 30, 0.4 * rate), DRONE_AIR_Q, 0, rate)
      ctx.beginPath()
      ctx.moveTo(bars.x, foot)
      for (let i = 0; i <= steps; i++) {
        const at = hzAt(i)
        ctx.lineTo(xAt(i), yOf(air * Math.pow(10, biquadDb(band, at, rate) / 20) * pass(at)))
      }
      ctx.lineTo(bars.x + bars.w, foot)
      ctx.closePath()
      ctx.globalAlpha = INK.fill + 0.08
      ctx.fillStyle = colours.ink
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // The partials of the key, each with the overtones Wave gives it, and the cap it wanders in.
    const levels = dronePartials(shape, partials, hz, rate, state.levels)
    const first = droneHarmonic(1, wave)
    ctx.beginPath()
    for (let k = 0; k < DRONE_PARTIALS; k++) {
      if (levels[k] <= 0) continue
      const top = Math.min(DRONE_OVERTONES, droneTop(hz * ratios[k], rate))
      for (let n = 2; n <= top; n++) {
        const at = hz * ratios[k] * n
        if (at >= 20000) break
        const y = yOf(levels[k] * droneHarmonic(n, wave) * pass(at))
        if (y >= foot - 0.5) continue
        const x = Math.round(xOfHz(at, bars) + droneBeside(ratios, k)) + 0.5
        ctx.moveTo(x, foot)
        ctx.lineTo(x, y)
      }
    }
    stroke(ctx, colours.ink, 1, 0.34)
    if (movement > 0) {
      for (let k = 0; k < DRONE_PARTIALS; k++) {
        if (levels[k] <= 0) continue
        const at = hz * ratios[k]
        const level = levels[k] * first * pass(at)
        const high = yOf(level * (1 + movement * DRONE_LEVEL_DEPTH))
        const low = yOf(level * Math.max(0, 1 - movement * DRONE_LEVEL_DEPTH))
        fillRect(
          ctx,
          {
            x: Math.round(xOfHz(at, bars) + droneBeside(ratios, k)) - 1.5,
            y: high,
            w: 4,
            h: low - high,
          },
          colours.ink,
          INK.fill + 0.12,
        )
      }
    }
    ctx.beginPath()
    for (let k = 0; k < DRONE_PARTIALS; k++) {
      if (levels[k] <= 0) continue
      const at = hz * ratios[k]
      const x = Math.round(xOfHz(at, bars) + droneBeside(ratios, k)) + 0.5
      ctx.moveTo(x, foot)
      ctx.lineTo(x, yOf(levels[k] * first * pass(at)))
    }
    stroke(ctx, colours.ink, 1.5, INK.text)

    // The sub: a steady sine an octave under the key. It does not wander, and has a head to tell it by.
    const sub = frame.value('sub') * DRONE_SUB_GAIN
    const subX = Math.round(xOfHz(hz / 2, bars)) + 0.5
    if (sub > 0) {
      const y = yOf(sub * pass(hz / 2))
      rule(ctx, subX, foot, subX, y, { colour: colours.ink, width: 1.5, alpha: INK.text })
      dot(ctx, subX, y, 2, colours.ink)
    }

    // The keys that sound: each lights its partials and its sub, as tall as it is loud.
    for (const key of sounding) {
      const level = droneKeyLevel(key, frame.now, attack, release) * padGain(key.gain)
      const root = clamp(key.frequency, 8, 12000)
      const lit = dronePartials(shape, partials, root, rate, state.lit)
      ctx.beginPath()
      for (let k = 0; k < DRONE_PARTIALS; k++) {
        if (lit[k] <= 0) continue
        const at = root * ratios[k]
        const x = Math.round(xOfHz(at, bars) + droneBeside(ratios, k)) + 0.5
        ctx.moveTo(x, foot)
        ctx.lineTo(x, yOf(lit[k] * first * pass(at) * level))
      }
      if (sub > 0) {
        const x = Math.round(xOfHz(root / 2, bars)) + 0.5
        ctx.moveTo(x, foot)
        ctx.lineTo(x, yOf(sub * pass(root / 2) * level))
      }
      stroke(ctx, colours.accent, 1.5)
    }

    // Where the partials sit between the speakers stands on the level that comes out. Every
    // second voice has them the other way round (`pan_base`), and which voice a key gets is
    // not the display's to know: both ways are marked.
    const middle = parts.foot.x + parts.foot.w / 2
    for (let k = 0; k < DRONE_PARTIALS; k++) {
      if (levels[k] <= 0) continue
      const off = width * DRONE_PAN[k] * (parts.foot.w / 2 - 3)
      for (let side = -1; side <= (off === 0 ? -1 : 1); side += 2) {
        const x = middle + side * off
        rule(ctx, x, parts.foot.y - 3, x, parts.foot.y, { colour: colours.ink, alpha: INK.text })
      }
    }
    levelFoot(frame, parts.foot, outShare(frame))

    // The words: the shape and whether Hold keeps it, the key the partials are drawn for and how fast they wander.
    const pace = movement > 0 ? rateText(frame.value('rate')) : 'still'
    topWords(
      frame,
      `${choiceWord(frame, 'shape')}${hold ? ', held' : ''}`,
      `${pitchName(hz)} ${pace}`,
      pace,
      all.x + 1,
      all.x + all.w - 1,
    )

    for (const spot of droneHandles(frame)) {
      handle(frame, spot.x, spot.y, { hot: frame.hot === spot.key })
    }
  },
  handles: droneHandles,
})

function droneHandles(view: DisplayView): DisplayHandle[] {
  const { bars } = droneParts(view)
  return [
    {
      key: 'cutoff',
      name: 'Cutoff',
      // On the low-pass where it is 3 dB down, which is at Cutoff itself.
      x: xOfHz(view.value('cutoff'), bars),
      y: yOfDb(-3, bars, DRONE_TOP_DB, DRONE_FLOOR_DB),
      drag: (toX) => ({ cutoff: hzOfX(toX, bars) }),
      reset: () => ({ cutoff: view.spec('cutoff')?.default ?? 2400 }),
    },
  ]
}

export const WAVE_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  wavetable: { display: wavetable, face: ['table', 'position', 'motion', 'cutoff'] },
  'west-coast': { display: westCoast, face: ['fold', 'fm', 'decay', 'colour'] },
  drone: {
    display: drone,
    face: ['shape', 'partials', 'wave', 'cutoff'],
    // The tone, how it wanders, the layers under and over it, and the envelope with what comes out.
    sections: [
      ['shape', 'partials', 'wave', 'cutoff'],
      ['movement', 'rate', 'width'],
      ['sub', 'air'],
      ['attack', 'release', 'hold', 'volume'],
    ],
  },
}
