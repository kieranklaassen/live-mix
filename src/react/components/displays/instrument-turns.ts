// The displays of the invented instruments: turns.
//
// Two instruments that turn a note round. The Staircase turns it in pitch: a
// stack of octaves under a bell of loudness that climbs and never arrives. The
// Rewind turns it in time: a struck sound run backwards, so that it swells
// into its strike. Each display is drawn from the device's own figures, and
// both devices start their clocks at the first key after a silence, so where a
// played note stands is worked out from its age and not guessed.

import { INK, clamp, crisp, dot, ground, label, lerp, rule, text, type Box } from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { levelFoot, outShare, pitchName } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>

const TAU = Math.PI * 2
const frac = (value: number): number => value - Math.floor(value)
/** `smooth_step` in both headers: 0 at 0, 1 at 1, level at both ends. */
const smooth = (value: number): number => {
  const t = clamp(value, 0, 1)
  return t * t * (3 - 2 * t)
}

// --- Staircase ---------------------------------------------------------------

/** `staircase.h`, `kBaseHz` and `kMiddleHz`: places are octaves above 10 Hz, and the bell is on Centre for middle C. */
const STAIR_BASE_HZ = 10
const STAIR_MIDDLE_HZ = 261.6255653
/** `staircase.h`, `kPartials`, `kMaxVoices`, `kSparseOctaves`, `kSparseSpan`. */
const STAIR_PARTIALS = 12
const STAIR_VOICES = 16
const STAIR_SPARSE_OCTAVES = 3
const STAIR_SPARSE_SPAN = 4
/** `staircase.h`, `kGlideOctavesPerSecond` and `kStepsPerSecond`: what Speed 1 is. */
const STAIR_GLIDE = 0.1
const STAIR_STEPS = 4
/** `staircase.h`, `kLowSilentHz`, `kLowFullHz`, `kHighSilentHz`, `kBellLowHz`, `kBellHighHz`, `kFollow`. */
const STAIR_LOW_SILENT_HZ = 20
const STAIR_LOW_FULL_HZ = 40
const STAIR_HIGH_SILENT_HZ = 18000
const STAIR_BELL_LOW_HZ = 40
const STAIR_BELL_HIGH_HZ = 6400
const STAIR_FOLLOW = 0.5
/** `staircase.h`, `kSpread`, `kSparseSpread`, `kSameNote`, `kSettleOctavesPerSecond`. */
const STAIR_SPREAD = 0.5
const STAIR_SPARSE_SPREAD = 0.3
const STAIR_SAME_NOTE = 0.004
const STAIR_SETTLE = 4
/** `Staircase::init`, `period_`: the control clock ticks 750 times a second, and no slide is shorter than a tick. */
const STAIR_TICK = 1 / 750
/** `staircase.h`, `kThird`, `kFifth`, `kSeventh`: harmonics 3, 5 and 7 at Shape 1. */
const STAIR_OVERTONES = [0.55, 0.35, 0.22] as const
const STAIR_MOTIONS = ['Glide', 'Semitones', 'Chord'] as const
const GLIDE = 0
const SEMITONES = 1
const CHORD = 2
/** `kit/env.h`, `Adsr`: the attack aims this far over the top, and under this a release is over. */
const ADSR_AIM = 1.3
const ADSR_IDLE = 1e-5

const octavesOf = (hz: number): number => Math.log2(Math.max(hz, 1e-6) / STAIR_BASE_HZ)
const hzOfOctaves = (octaves: number): number => STAIR_BASE_HZ * Math.pow(2, octaves)

/** `Staircase::pace`: Speed squared with its sign, which keeps the middle of the knob slow. */
export const staircasePace = (speed: number): number => speed * Math.abs(speed)
/** `Staircase::climb`, Glide: octaves a second, falling when negative. */
export const staircaseGlide = (speed: number): number => STAIR_GLIDE * staircasePace(speed)
/** `Staircase::climb`, Semitones and Chord: steps a second. */
export const staircaseSteps = (speed: number): number =>
  STAIR_STEPS * Math.abs(staircasePace(speed))

/** `Staircase::climb`, `slide_seconds`: Slide is the share of a step spent moving, a tick at least. */
export function staircaseSlideSeconds(slide: number, speed: number): number {
  const steps = staircaseSteps(speed)
  return Math.max(steps > 0 ? slide / steps : 0, STAIR_TICK)
}

/** `Staircase::place`, `span`: in Chord the bell is four octaves wide at least. */
export const staircaseSpan = (motion: number, span: number): number =>
  Math.round(motion) === CHORD ? Math.max(span, STAIR_SPARSE_SPAN) : span

/** `Staircase::note_on`, `lean`, and `place`, `centre`: where the bell of a key at `keyHz` is centred, in Hz. It follows the key by half. */
export function staircaseCentre(centreHz: number, keyHz: number): number {
  const lean = STAIR_FOLLOW * Math.log2(keyHz / STAIR_MIDDLE_HZ)
  return hzOfOctaves(
    clamp(octavesOf(centreHz) + lean, octavesOf(STAIR_BELL_LOW_HZ), octavesOf(STAIR_BELL_HIGH_HZ)),
  )
}

/** `Staircase::fade_high`: nothing at 18 kHz, all of it an octave under. */
const stairFadeHigh = (hz: number): number =>
  smooth((STAIR_HIGH_SILENT_HZ - hz) / (0.5 * STAIR_HIGH_SILENT_HZ))

/**
 * `Staircase::place`, `weight`: how strong a partial at `hz` is under a bell
 * centred on `bellHz` and `span` octaves wide, before the device scales a key
 * to constant power. A raised cosine over the octaves, faded out under 40 Hz;
 * `harmonic` 3, 5 or 7 is faded where that overtone nears the top.
 */
export function staircaseBell(hz: number, bellHz: number, span: number, harmonic = 1): number {
  const x = Math.log2(hz / bellHz)
  if (!(x > -0.5 * span && x < 0.5 * span)) return 0
  const bell = 0.5 + 0.5 * Math.cos((TAU * x) / span)
  const low = smooth((hz - STAIR_LOW_SILENT_HZ) / (STAIR_LOW_FULL_HZ - STAIR_LOW_SILENT_HZ))
  return bell * low * stairFadeHigh(harmonic * hz)
}

/** `Staircase::place`, `third`, `fifth`, `seventh`: how strong harmonic 3, 5 or 7 of every partial is against it. */
export const staircaseOvertone = (shape: number, harmonic: number): number =>
  STAIR_OVERTONES[(harmonic - 3) / 2] * Math.pow(clamp(shape, 0, 1), (harmonic - 1) / 2)

/** `Staircase::apply`, `kChorus`: the second set against the first, half as loud at most. */
export const staircaseSecond = (chorus: number): number => chorus / (1 + chorus)

/** `Staircase::place`, `spread`: how far to one side a partial sits, 1 hard over. */
export const staircaseSpread = (motion: number, width: number): number =>
  (Math.round(motion) === CHORD ? STAIR_SPARSE_SPREAD : STAIR_SPREAD) * width

/**
 * `kit/env.h`, `Adsr::next` as the Staircase sets it (full sustain): the level
 * of a key pressed `age` seconds ago and let go `released` seconds ago (null
 * while it is held). The release falls 60 dB in its time and is over at 100.
 */
export function staircaseLevel(
  age: number,
  released: number | null,
  attack: number,
  release: number,
): number {
  if (age < 0) return 0
  const held = released === null ? age : Math.max(0, age - released)
  const top =
    held >= attack
      ? 1
      : Math.min(1, ADSR_AIM * (1 - Math.pow((ADSR_AIM - 1) / ADSR_AIM, held / attack)))
  if (released === null) return top
  const level = top * Math.pow(10, (-3 * released) / release)
  return level < ADSR_IDLE ? 0 : level
}

/** `Staircase::note_on`, `gain`: a pad answers touch gently. */
export const staircaseTouch = (gain: number): number => 0.35 + 0.65 * Math.sqrt(clamp(gain, 0, 1))

/**
 * `Staircase::walk`: how far a key standing at `at` (octaves) moves at a step
 * of the chord walk: to the next pitch class in `direction` that one of the
 * `count` held keys in `rungs` is on. A key alone on its pitch class moves an
 * octave.
 */
export function staircaseChordStep(
  at: number,
  rungs: ArrayLike<number>,
  count: number,
  direction: number,
): number {
  let nearest = 1
  for (let r = 0; r < count; r++) {
    let distance = frac(direction > 0 ? rungs[r] - at : at - rungs[r])
    if (distance < STAIR_SAME_NOTE || distance > 1 - STAIR_SAME_NOTE) distance = 1
    if (distance < nearest) nearest = distance
  }
  return nearest
}

/** `Staircase::lighter_side_is_far`, the toss-up: a key alone goes by its semitone, the odd ones to the far side. */
export const staircaseFarAlone = (keyHz: number): boolean =>
  (Math.floor(octavesOf(keyHz) * 12) & 1) !== 0

/** How strongly a key is lit, 0..1: its level while it rises, and from the key up the 60 dB of its release as one straight fall. */
export function staircaseLight(
  age: number,
  released: number | null,
  attack: number,
  release: number,
): number {
  if (released === null) return staircaseLevel(age, null, attack, release)
  const top = staircaseLevel(Math.max(0, age - released), null, attack, release)
  return top * Math.max(0, 1 - released / release)
}

/**
 * `Staircase::note_on`, `restart`: the first key after a silence starts the
 * climb again, so the climb is as old as the first key of the run that still
 * sounds. The place of that key in `notes` comes back, -1 while nothing
 * sounds. A voice is counted until its release is 100 dB down.
 */
export function staircaseRun(
  notes: readonly DisplayNote[],
  attack: number,
  release: number,
): number {
  let first = -1
  // How long ago the last voice of the run went quiet; under zero, one still sounds.
  let quiet = Infinity
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]
    if (first < 0 || quiet >= note.age) {
      first = i
      quiet = Infinity
    }
    let ended = -Infinity
    if (note.released !== null) {
      const top = staircaseLevel(note.age - note.released, null, attack, release)
      ended = note.released - (top > ADSR_IDLE ? (release * (5 + Math.log10(top))) / 3 : 0)
    }
    quiet = quiet === Infinity ? ended : Math.min(quiet, ended)
  }
  return quiet < 0 ? first : -1
}

/** The climb of the whole instrument as the device keeps it: `global_`, `global_target_`, `global_rate_`, `beat_`, `motion_`. */
export interface StairClimb {
  global: number
  target: number
  rate: number
  beat: number
  motion: number
}

/** One key of the run: where it was played, its own walk (`walk`, `walk_target`, `walk_rate`) and its side. */
export interface StairKey {
  id: number
  /** When it was pressed on the display's clock, and its place in `frame.notes`. */
  born: number
  index: number
  /** The played note in octaves above 10 Hz. */
  key: number
  walk: number
  target: number
  rate: number
  far: boolean
  /** Seconds after the run began that it was pressed, let go (Infinity while held) and went quiet. */
  from: number
  up: number
  end: number
}

export const stairClimb = (motion = CHORD): StairClimb => ({
  global: 0,
  target: 0,
  rate: 0,
  beat: 0,
  motion: Math.round(motion),
})

export const stairKey = (keyHz = STAIR_MIDDLE_HZ): StairKey => ({
  id: -1,
  born: 0,
  index: -1,
  key: octavesOf(keyHz),
  walk: 0,
  target: 0,
  rate: 0,
  far: staircaseFarAlone(keyHz),
  from: 0,
  up: Infinity,
  end: Infinity,
})

/** `Staircase::approach`. */
const approach = (value: number, target: number, step: number): number =>
  value < target ? Math.min(target, value + step) : Math.max(target, value - step)

/**
 * `Staircase::control`, `climb` and `walk`, `seconds` of them at once: the
 * climb and every key's walk are moved on from `from` seconds after the run
 * began. Glide moves the lot without stop; the other two count beats, and at
 * each a semitone is added for all or each sounding key walks to the next
 * held note, over Slide's share of the step. `rungs` is room for the held
 * keys' pitch classes.
 */
export function staircaseAdvance(
  climb: StairClimb,
  keys: readonly StairKey[],
  from: number,
  seconds: number,
  motion: number,
  speed: number,
  slide: number,
  rungs: Float64Array,
): void {
  const mode = Math.round(motion)
  if (mode !== climb.motion) {
    // Switched while it sounds: the climb moves onto the grid the new motion keeps.
    climb.motion = mode
    climb.beat = 0
    if (mode === SEMITONES) climb.target = Math.floor(climb.global * 12 + 0.5) / 12
    if (mode === CHORD) climb.target = Math.floor(climb.global + 0.5)
    climb.rate = STAIR_SETTLE
  }
  const pace = staircasePace(speed)
  const steps = staircaseSteps(speed)
  const direction = pace > 0 ? 1 : -1
  let at = from
  let left = seconds
  for (let guard = 0; left > 0 && guard < 200000; guard++) {
    let span = left
    let beats = false
    if (mode !== GLIDE && steps > 0) {
      const toBeat = (1 - climb.beat) / steps
      if (toBeat <= left) {
        span = toBeat
        beats = true
      }
    }
    if (mode === GLIDE) {
      climb.global += STAIR_GLIDE * pace * span
      climb.target = climb.global
    } else {
      climb.beat += steps * span
      climb.global = approach(climb.global, climb.target, climb.rate * span)
    }
    for (const key of keys) key.walk = approach(key.walk, key.target, key.rate * span)
    at += span
    left -= span
    if (!beats) continue
    climb.beat = 0
    const sliding = staircaseSlideSeconds(slide, speed)
    if (mode === SEMITONES) {
      climb.target += direction / 12
      climb.rate = Math.abs(climb.target - climb.global) / sliding
      continue
    }
    // Chord: the rungs are the keys that are down at this beat; with none down the fading keys stay.
    let count = 0
    for (const key of keys)
      if (key.from <= at && at < key.up && count < rungs.length) rungs[count++] = frac(key.key)
    if (count === 0) continue
    for (const key of keys) {
      if (key.from > at || at >= key.end) continue
      key.target += direction * staircaseChordStep(key.key + key.target, rungs, count, direction)
      key.rate = Math.abs(key.target - key.walk) / sliding
    }
  }
}

/** The key the display stands on while none is played: middle C. */
const STAIR_REST_HZ = STAIR_MIDDLE_HZ
/** Seconds the stairs are drawn ahead, by Motion: a glide is slow and is given a minute. */
const STAIR_AHEAD = [60, 12, 12] as const
/** The bell stands over ten octaves from 20 Hz. */
const STAIR_FOOT_HZ = 20
const STAIR_OCTAVES = 10
/** Where the wrapped stairs begin: half a semitone under a C, so that no tread of a tempered key lies on the edge. */
const STAIR_ORIGIN = octavesOf(130.8128) - 1 / 24
/** Under this share of its light a key is done; nearer than this in seconds, two sightings are one key or one run. */
const STAIR_DONE = 0.02
const STAIR_SAME_SECONDS = 0.05
/** The most a partial's bar reaches to one side, in bells: a partial hard over at Width 1, at constant power. */
const STAIR_REACH = 1.5 / Math.sqrt(1.25)
/** How far from a bar the two hairlines of the second set are drawn, above and under it. */
const STAIR_SECOND_PX = 1.5

interface StairParts {
  /** The bell: pitch from foot to top, loudness out from the middle to both sides. */
  bell: Box
  /** The stairs: the seconds ahead from left to right, pitch upwards and round again. */
  stairs: Box
  foot: Box
}

function stairParts(view: Size): StairParts {
  const top = 15
  const high = view.height - 13 - top
  const wide = clamp(Math.round(view.width * 0.25), 30, 56)
  return {
    bell: { x: 5, y: top, w: wide, h: high },
    stairs: { x: 11 + wide, y: top, w: view.width - 16 - wide, h: high },
    foot: { x: 4, y: view.height - 10, w: view.width - 8, h: 6 },
  }
}

interface StairState {
  climb: StairClimb
  keys: StairKey[]
  spare: StairKey[]
  /** The resting key and its climb, never moved. */
  rest: StairKey
  still: StairClimb
  /** When the run began on the display's clock (NaN for none), and the time the climb stands at. */
  began: number
  at: number
  rungs: Float64Array
  /** The corners of one key's stairs: seconds ahead and place, in pairs. */
  corners: Float32Array
}

/** `Staircase::lighter_side_is_far`: the side a new key takes in Chord, the lighter one as the keys before it stand. */
function stairSide(
  notes: readonly DisplayNote[],
  before: readonly StairKey[],
  note: DisplayNote,
  attack: number,
  release: number,
): boolean {
  let near = 0
  let far = 0
  for (const other of before) {
    const was = notes[other.index]
    const since = was.age - note.age
    const up = was.released !== null && was.released > note.age ? was.released - note.age : null
    // A key of the same block has not been rendered yet and counts in full.
    const level = since < 0.003 ? 1 : staircaseLevel(since, up, attack, release)
    if (other.far) far += staircaseTouch(was.gain) * level
    else near += staircaseTouch(was.gain) * level
  }
  if (far < near - 1e-3) return true
  if (near < far - 1e-3) return false
  return staircaseFarAlone(note.frequency)
}

/**
 * Brings the climb and the keys of the run to this frame; false while nothing
 * sounds. A run seen for the first time is played through from its first key
 * with the knobs as they stand, which is where the device is if they have not
 * been turned since. From then on it is moved by the clock, so a knob turned
 * under held keys bends the climb here as it does there.
 */
function stairFollow(frame: DisplayFrame<StairState>): boolean {
  const { state, notes } = frame
  const attack = frame.value('attack')
  const release = frame.value('release')
  const first = frame.powered ? staircaseRun(notes, attack, release) : -1
  if (first < 0) {
    state.began = NaN
    state.keys.length = 0
    return false
  }
  const age = notes[first].age
  const began = frame.now - age
  const same = Math.abs(began - state.began) < STAIR_SAME_SECONDS && frame.now >= state.at
  const old = state.keys
  const keys = state.spare
  keys.length = 0
  for (let index = first; index < notes.length; index++) {
    const note = notes[index]
    const born = frame.now - note.age
    let key: StairKey | undefined
    for (let i = 0; same && !key && i < old.length; i++)
      if (old[i].id === note.id && Math.abs(old[i].born - born) < STAIR_SAME_SECONDS) key = old[i]
    if (!key) {
      key = stairKey(clamp(note.frequency, 8, 20000))
      key.far = stairSide(notes, keys, note, attack, release)
    }
    key.id = note.id
    key.born = born
    key.index = index
    key.from = age - note.age
    key.up = note.released === null ? Infinity : age - note.released
    key.end = key.up
    if (note.released !== null) {
      const top = staircaseLevel(note.age - note.released, null, attack, release)
      if (top > ADSR_IDLE) key.end += (release * (5 + Math.log10(top))) / 3
    }
    keys.push(key)
  }
  state.keys = keys
  state.spare = old
  const motion = frame.value('motion')
  const speed = frame.value('speed')
  const slide = frame.value('slide')
  if (same) {
    const passed = frame.now - state.at
    staircaseAdvance(state.climb, keys, age - passed, passed, motion, speed, slide, state.rungs)
  } else {
    Object.assign(state.climb, stairClimbZero, { motion: Math.round(motion) })
    staircaseAdvance(state.climb, keys, 0, age, motion, speed, slide, state.rungs)
  }
  state.began = began
  state.at = frame.now
  return true
}

const stairClimbZero: Readonly<Omit<StairClimb, 'motion'>> = {
  global: 0,
  target: 0,
  rate: 0,
  beat: 0,
}

const stairY = (hz: number, bell: Box): number =>
  bell.y + bell.h * (1 - clamp(Math.log2(Math.max(hz, 1) / STAIR_FOOT_HZ) / STAIR_OCTAVES, 0, 1))

/** The bell of a key: loudness out from the middle to both sides, over pitch from the foot up. */
function stairBell(frame: DisplayFrame<StairState>, bell: Box, bellHz: number): void {
  const { ctx, colours } = frame
  const middle = bell.x + bell.w / 2
  const unit = (bell.w / 2 - 1) / STAIR_REACH
  const span = staircaseSpan(frame.value('motion'), frame.value('span'))
  ctx.beginPath()
  for (let side = -1; side <= 1; side += 2) {
    for (let step = 0; step <= bell.h; step += 2) {
      const y = side < 0 ? bell.y + bell.h - step : bell.y + step
      const hz = STAIR_FOOT_HZ * Math.pow(2, (1 - (y - bell.y) / bell.h) * STAIR_OCTAVES)
      const x = middle + side * unit * staircaseBell(hz, bellHz, span)
      if (side < 0 && step === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
  }
  ctx.closePath()
  ctx.globalAlpha = INK.fill
  ctx.fillStyle = colours.ink
  ctx.fill()
  ctx.globalAlpha = INK.back
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.globalAlpha = 1
}

/**
 * The partials of a key standing at `place` octaves, as bars across the bell:
 * an octave apart (every third octave in Chord), each as long as the bell
 * makes it and `light` of that, further out on the side it is panned to. The
 * overtones Shape adds lie between them, thinner. The second set of Chorus
 * is a hairline on both sides of each bar, as long as the set is loud: its
 * delays are swept both ways, so it drifts above the first set and under it
 * in turn, some 8 cents at most (`kChorusSlowSeconds`, `kChorusFastSeconds`), a
 * twentieth of a pixel here. The lines stand for its being there and to
 * neither side of the pitch, not for how far off it is.
 */
function stairBars(
  frame: DisplayFrame<StairState>,
  bell: Box,
  place: number,
  bellHz: number,
  light: number,
  far: boolean,
  lit: boolean,
): void {
  const { ctx, colours } = frame
  const motion = frame.value('motion')
  const sparse = Math.round(motion) === CHORD
  const span = staircaseSpan(motion, frame.value('span'))
  const shape = frame.value('shape')
  const second = staircaseSecond(frame.value('chorus'))
  const spread = staircaseSpread(motion, frame.value('width'))
  const middle = bell.x + bell.w / 2
  const unit = ((bell.w / 2 - 1) / STAIR_REACH) * light
  const whole = Math.floor(place)
  ctx.strokeStyle = lit ? colours.accent : colours.ink
  for (let pass = 0; pass < 3; pass++) {
    ctx.beginPath()
    for (let k = 0; k < STAIR_PARTIALS; k++) {
      const hz = hzOfOctaves(place - whole + k)
      const above = k - whole
      if (sparse && above % STAIR_SPARSE_OCTAVES !== 0) continue
      // `Staircase::place`: mid and side, so the left is 1 + pan of it and the right 1 - pan, at constant power.
      const pan = (sparse ? far : (above & 1) !== 0) ? -spread : spread
      const left = (unit * (1 + pan)) / Math.sqrt(1 + spread * spread)
      const right = (unit * (1 - pan)) / Math.sqrt(1 + spread * spread)
      if (pass === 0) {
        const weight = staircaseBell(hz, bellHz, span)
        if (weight * unit < 0.4) continue
        const y = stairY(hz, bell)
        ctx.moveTo(middle - left * weight, y)
        ctx.lineTo(middle + right * weight, y)
      } else if (pass === 1) {
        for (let harmonic = 3; harmonic <= 7 && shape > 0; harmonic += 2) {
          const weight =
            staircaseBell(hz, bellHz, span, harmonic) * staircaseOvertone(shape, harmonic)
          if (weight * unit < 0.4) continue
          const y = stairY(harmonic * hz, bell)
          ctx.moveTo(middle - left * weight, y)
          ctx.lineTo(middle + right * weight, y)
        }
      } else {
        const weight = staircaseBell(hz, bellHz, span) * second
        if (weight * unit < 0.4) continue
        const y = stairY(hz, bell)
        for (let side = -1; side <= 1; side += 2) {
          ctx.moveTo(middle - left * weight, y + side * STAIR_SECOND_PX)
          ctx.lineTo(middle + right * weight, y + side * STAIR_SECOND_PX)
        }
      }
    }
    ctx.globalAlpha = pass === 0 ? 1 : lit ? 0.75 : INK.back
    ctx.lineWidth = pass === 0 ? (lit ? 1.75 : 1.25) : 0.75
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/** Writes one corner, seconds and place, after the `pairs` already in `corners` while there is room; how many there are now comes back. */
function putCorner(corners: Float32Array, pairs: number, seconds: number, place: number): number {
  if (pairs * 2 + 1 >= corners.length) return pairs
  corners[pairs * 2] = seconds
  corners[pairs * 2 + 1] = place
  return pairs + 1
}

/**
 * Where a key goes from here, as the corners of its stairs: `Staircase::climb`
 * and `walk` run ahead for `ahead` seconds from the climb as it stands, the
 * keys that are down staying down. Seconds and place in pairs into `corners`;
 * how many pairs comes back.
 */
export function staircaseAhead(
  corners: Float32Array,
  climb: StairClimb,
  key: StairKey,
  ahead: number,
  speed: number,
  slide: number,
  rungs: ArrayLike<number>,
  count: number,
): number {
  const mode = climb.motion
  const pace = staircasePace(speed)
  const steps = staircaseSteps(speed)
  const direction = pace > 0 ? 1 : -1
  const sliding = staircaseSlideSeconds(slide, speed)
  let { global, target, rate, beat } = climb
  let walk = key.walk
  let to = key.target
  let pacing = key.rate
  let at = 0
  let pairs = putCorner(corners, 0, 0, key.key + global + walk)
  for (let guard = 0; at < ahead && guard < 400; guard++) {
    let span = ahead - at
    let beats = false
    if (mode !== GLIDE && steps > 0) {
      const toBeat = (1 - beat) / steps
      if (toBeat < span) {
        span = toBeat
        beats = true
      }
    }
    if (mode === GLIDE) {
      global += STAIR_GLIDE * pace * span
      target = global
    } else {
      // The climb and the walk each stop where they arrive: a corner at each.
      const one = rate > 0 ? Math.abs(target - global) / rate : 0
      const two = pacing > 0 ? Math.abs(to - walk) / pacing : 0
      for (let turn = 0; turn < 2; turn++) {
        const corner = turn === 0 ? Math.min(one, two) : Math.max(one, two)
        if (corner <= 0 || corner >= span) continue
        const there = approach(global, target, rate * corner) + approach(walk, to, pacing * corner)
        pairs = putCorner(corners, pairs, at + corner, key.key + there)
      }
      global = approach(global, target, rate * span)
      walk = approach(walk, to, pacing * span)
      beat += steps * span
    }
    at += span
    pairs = putCorner(corners, pairs, at, key.key + global + walk)
    if (!beats) continue
    beat = 0
    if (mode === SEMITONES) {
      target += direction / 12
      rate = Math.abs(target - global) / sliding
    } else if (count > 0) {
      to += direction * staircaseChordStep(key.key + to, rungs, count, direction)
      pacing = Math.abs(to - walk) / sliding
    }
  }
  return pairs
}

/** The octaves the stairs go round in: one, and three in Chord, where a key sounds every third octave. */
const stairRound = (motion: number): number =>
  Math.round(motion) === CHORD ? STAIR_SPARSE_OCTAVES : 1

/** How far up the stairs' box a place stands, 0 at the foot and 1 at the top, where it goes round to the foot again. */
export const staircaseHeight = (place: number, motion: number): number =>
  frac((place - STAIR_ORIGIN) / stairRound(motion))

/**
 * Lays a key's stairs into the path: its corners across the box, broken where
 * they leave by the top and come in again at the foot (or the other way when
 * it falls). With `filled` each flight is closed down to the foot.
 */
function stairFlights(
  ctx: CanvasRenderingContext2D,
  corners: Float32Array,
  pairs: number,
  box: Box,
  ahead: number,
  round: number,
  filled: boolean,
): void {
  const foot = box.y + box.h
  const xOf = (seconds: number): number => box.x + (seconds / ahead) * box.w
  const yOf = (share: number): number => foot - share * box.h
  let at = corners[0]
  let turns = (corners[1] - STAIR_ORIGIN) / round
  let cell = Math.floor(turns)
  if (filled) {
    ctx.moveTo(xOf(at), foot)
    ctx.lineTo(xOf(at), yOf(turns - cell))
  } else ctx.moveTo(xOf(at), yOf(turns - cell))
  for (let i = 1; i < pairs; i++) {
    const next = corners[i * 2]
    const there = (corners[i * 2 + 1] - STAIR_ORIGIN) / round
    for (let guard = 0; Math.floor(there) !== cell && guard < 64; guard++) {
      const up = there > turns
      const edge = up ? cell + 1 : cell
      const crossed = at + ((next - at) * (edge - turns)) / (there - turns)
      const x = xOf(crossed)
      ctx.lineTo(x, yOf(up ? 1 : 0))
      if (filled) ctx.lineTo(x, foot)
      cell += up ? 1 : -1
      if (filled) {
        ctx.moveTo(x, foot)
        ctx.lineTo(x, yOf(up ? 0 : 1))
      } else ctx.moveTo(x, yOf(up ? 0 : 1))
      at = crossed
      turns = edge
    }
    ctx.lineTo(xOf(next), yOf(there - cell))
    at = next
    turns = there
  }
  if (filled) ctx.lineTo(xOf(at), foot)
}

const staircase = plateDisplay<StairState>({
  place: 'window',
  columns: 2,
  params: [
    'motion',
    'speed',
    'centre',
    'span',
    'shape',
    'slide',
    'chorus',
    'attack',
    'release',
    'width',
  ],
  live: { signal: true, notes: true },
  info: 'Left, the bell of loudness over pitch, with the octaves of a key as bars across it. Right, the stairs those bars take in the seconds ahead, leaving by the top and coming in again at the foot. A played key lights its bars and rides the left edge of its stairs.',
  init: () => ({
    climb: stairClimb(),
    keys: [],
    spare: [],
    rest: stairKey(STAIR_REST_HZ),
    still: stairClimb(),
    began: NaN,
    at: 0,
    rungs: new Float64Array(64),
    corners: new Float32Array(1024),
  }),
  draw(frame) {
    const { ctx, colours, state, notes } = frame
    ground(frame)
    const { bell, stairs, foot } = stairParts(frame)
    const sounding = stairFollow(frame)
    const motion = frame.value('motion')
    const mode = clamp(Math.round(motion), GLIDE, CHORD)
    const speed = frame.value('speed')
    const slide = frame.value('slide')
    const attack = frame.value('attack')
    const release = frame.value('release')
    const centre = frame.value('centre')
    const ahead = STAIR_AHEAD[mode]
    const round = stairRound(motion)
    const base = stairs.y + stairs.h
    state.still.motion = mode
    const climb = sounding ? state.climb : state.still

    // The keys that are drawn: the ones that sound, no more than the device has voices, or middle C.
    let from = state.keys.length
    let shown = 0
    for (let i = state.keys.length - 1; sounding && i >= 0 && shown < STAIR_VOICES; i--) {
      const note = notes[state.keys[i].index]
      if (staircaseLight(note.age, note.released, attack, release) < STAIR_DONE) continue
      from = i
      shown++
    }
    // The rungs of the chord walk: the keys that are down now.
    let rungs = 0
    for (const key of state.keys)
      if (notes[key.index].released === null && rungs < state.rungs.length)
        state.rungs[rungs++] = frac(key.key)
    if (shown === 0) {
      state.rungs[0] = frac(state.rest.key)
      rungs = 1
    }

    // The stairs' box: now at the left edge, and what the steps stand on.
    rule(ctx, stairs.x, stairs.y, stairs.x, base, { colour: colours.ink, alpha: INK.rule })
    rule(ctx, stairs.x, base, stairs.x + stairs.w, base, { colour: colours.ink, alpha: INK.rule })
    if (mode === SEMITONES) {
      // Twelve semitones to the octave: a line where each tread lies.
      for (let tone = 0; tone < 12; tone++) {
        const y = base - ((tone + 0.5) / 12) * stairs.h
        rule(ctx, stairs.x, y, stairs.x + stairs.w, y, { colour: colours.ink, alpha: INK.grid })
      }
    } else if (mode === CHORD) {
      // The rungs: every held note, in each of the three octaves a key goes round.
      for (let rung = 0; rung < rungs; rung++) {
        for (let octave = 0; octave < STAIR_SPARSE_OCTAVES; octave++) {
          const y = base - staircaseHeight(state.rungs[rung] + octave, motion) * stairs.h
          rule(ctx, stairs.x, y, stairs.x + stairs.w, y, { colour: colours.ink, alpha: INK.grid })
        }
      }
    }

    // The bell of the last key played, and each key's stairs and bars.
    const last = shown > 0 ? state.keys[state.keys.length - 1] : state.rest
    let said = state.rest
    stairBell(frame, bell, staircaseCentre(centre, hzOfOctaves(last.key)))
    rule(ctx, bell.x + bell.w / 2, bell.y, bell.x + bell.w / 2, bell.y + bell.h, {
      colour: colours.ink,
      alpha: INK.grid,
    })
    for (let i = shown > 0 ? from : -1; i < (shown > 0 ? state.keys.length : 0); i++) {
      const key = i < 0 ? state.rest : state.keys[i]
      const note = i < 0 ? null : notes[key.index]
      const light = note ? staircaseLight(note.age, note.released, attack, release) : 1
      if (light < STAIR_DONE) continue
      said = key
      const pairs = staircaseAhead(
        state.corners,
        climb,
        key,
        ahead,
        speed,
        slide,
        state.rungs,
        rungs,
      )
      // One key's stairs are filled, as a flight seen from the side; a chord's are lines.
      if (shown <= 1) {
        ctx.beginPath()
        stairFlights(ctx, state.corners, pairs, stairs, ahead, round, true)
        ctx.globalAlpha = INK.fill
        ctx.fillStyle = colours.ink
        ctx.fill()
      }
      ctx.beginPath()
      stairFlights(ctx, state.corners, pairs, stairs, ahead, round, false)
      ctx.globalAlpha = lerp(0.4, 1, light)
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1.5
      ctx.lineJoin = 'round'
      ctx.stroke()
      ctx.globalAlpha = 1
      const place = key.key + climb.global + key.walk
      const bellHz = staircaseCentre(centre, hzOfOctaves(key.key))
      stairBars(
        frame,
        bell,
        place,
        bellHz,
        note ? light * staircaseTouch(note.gain) : 1,
        key.far,
        !!note,
      )
      if (note) {
        const y = base - staircaseHeight(place, motion) * stairs.h
        dot(ctx, stairs.x, y, 1.5 + 1.5 * light, colours.accent)
      }
    }

    levelFoot(frame, foot, outShare(frame))
    label(frame, `${ahead} s`, stairs.x + stairs.w, base - 3, 'right')

    // The words: how it moves and which way, and how fast the last key goes.
    const name = STAIR_MOTIONS[mode]
    text(frame, name, 6, 11)
    const pace = staircasePace(speed)
    if (pace !== 0) {
      const x = 6 + ctx.measureText(name).width + 6
      const tip = pace > 0 ? 4.5 : 10.5
      ctx.beginPath()
      ctx.moveTo(x, tip)
      ctx.lineTo(x - 3.5, 15 - tip)
      ctx.lineTo(x + 3.5, 15 - tip)
      ctx.closePath()
      ctx.fillStyle = colours.ink
      ctx.fill()
    }
    const steps = staircaseSteps(speed)
    const rate =
      pace === 0
        ? 'still'
        : mode === GLIDE
          ? `${secondsText(1 / Math.abs(staircaseGlide(speed)), true)}/oct`
          : steps >= 0.95
            ? `${steps.toFixed(1)}/s`
            : `${secondsText(1 / steps, true)}/step`
    const pitch = frame.width >= 160 ? `${pitchName(hzOfOctaves(said.key))} ` : ''
    text(frame, `${pitch}${rate}`, frame.width - 6, 11, { align: 'right' })
  },
})

// --- Rewind ------------------------------------------------------------------

const REWIND_SOURCES = ['Piano', 'Bell', 'Pluck', 'Bowl'] as const
const PIANO = 0
const BELL = 1
const PLUCK = 2
const BOWL = 3
/** `rewind.h`, `kPartials`, `kMaxVoices`, `kTopHz`, `kLowestHz`, `kMinHz`, `kMaxHz`. */
const REWIND_PARTIALS = 12
const REWIND_VOICES = 12
const REWIND_TOP_HZ = 18000
const REWIND_LOWEST_HZ = 16
const REWIND_MIN_HZ = 20
const REWIND_MAX_HZ = 8000
/** `rewind.h`, `kSixtyDb`, `kDormant`, `kDeepest`, `kShallowRise`, `kDeepRise`, `kFadeIn`. */
const REWIND_SIXTY_DB = 6.907755279
const REWIND_DORMANT = 16
const REWIND_DEEPEST = 120
const REWIND_SHALLOW_RISE = 1.8
const REWIND_DEEP_RISE = 12
const REWIND_FADE_IN = 0.12
/** `rewind.h`, `kHoverSpan`, `kHoverShort`, `kHoverUnder`, `kSurgeSeconds`: a held key's note slows, rests, and runs in when it is let go. */
const REWIND_HOVER_SPAN = 0.15
const REWIND_HOVER_SHORT = 0.15
const REWIND_HOVER_UNDER = 0.7
const REWIND_SURGE_SECONDS = 0.06
/** `rewind.h`, `kPromptSeconds`, `kPromptMost`: the strike's own surge. */
const REWIND_PROMPT_SECONDS = 0.012
const REWIND_PROMPT_MOST = 1.5
/** `rewind.h`, `kStopSeconds`, `kStopPeriods`, `kSlowestStop`: how a note at Tail 0 stops. */
const REWIND_STOP_SECONDS = 0.002
const REWIND_STOP_PERIODS = 0.5
const REWIND_SLOWEST_STOP = 0.006
/** `rewind.h`, `kMaxDetune`, `kMaxWow`, `kWowSlowHz`, `kWowFastHz`, `kWowSlowShare`. */
const REWIND_DETUNE = 0.008
const REWIND_WOW = 0.0104
const REWIND_WOW_SLOW_HZ = 0.55
const REWIND_WOW_FAST_HZ = 2.3
const REWIND_WOW_SLOW_SHARE = 0.75
/** `rewind.h`, `kFloor`, `kLoudest`, `kLoudness`, `kTallest`, `kHammerTall`, `kKeyTilt`, `kTiltTop`: how a note is levelled, and the level under which it is silence. */
const REWIND_FLOOR = 1e-6
const REWIND_LOUDEST = 0.4
const REWIND_LOUDNESS = 0.141
const REWIND_TALLEST = 1.41
const REWIND_HAMMER_TALL = 0.5
const REWIND_KEY_TILT = -0.08
const REWIND_TILT_TOP = 1000
/** `Rewind::place`, `kPan`: where each partial sits at Width 1, twice as far as it is put. */
const REWIND_PAN = [0, -0.5, 0.5, -0.8, 0.8, -0.3, 0.3, -1, 1, -0.6, 0.6, 0] as const
/** `Rewind::build`: the bell's partials (hum, prime, tierce, quint, nominal and up) and the bowl's six rim modes. */
const REWIND_BELL_RATIO = [0.5, 1, 1.2, 1.5, 2, 2.5, 3, 4, 5.33, 6.67, 8, 9.5] as const
const REWIND_BELL_LEVEL = [0.45, 1, 0.8, 0.4, 0.9, 0.45, 0.5, 0.45, 0.3, 0.2, 0.14, 0.1] as const
const REWIND_BOWL_RATIO = [1, 2.77, 5.17, 8.14, 11.64, 15.6] as const
const REWIND_BOWL_LEVEL = [1, 0.6, 0.34, 0.2, 0.11, 0.06] as const

/** The partials of one note as `Rewind::build` and `start` make them. */
export interface RewindPartials {
  count: number
  /** Seconds the slowest partial takes to fall 60 dB forwards at Tail 1. */
  ring: number
  /** Each partial's pitch in Hz, its decay rate against the slowest, and whether it is the upper half of a beating pair. */
  hz: Float32Array
  rate: Float32Array
  mate: Uint8Array
  /** Its level at the strike at Tone 0, 0.5 and 1, three to a partial, and the ghost's level on it. */
  weight: Float32Array
  wash: Float32Array
}

export const rewindPartials = (): RewindPartials => ({
  count: 0,
  ring: 1,
  hz: new Float32Array(REWIND_PARTIALS),
  rate: new Float32Array(REWIND_PARTIALS),
  mate: new Uint8Array(REWIND_PARTIALS),
  weight: new Float32Array(REWIND_PARTIALS * 3),
  wash: new Float32Array(REWIND_PARTIALS),
})

const HARMONIC_NUMBER = new Float32Array(REWIND_PARTIALS)
const HARMONIC_BAND = new Float32Array(REWIND_PARTIALS)
/** Room for the sums of the three sets of levels while a note is built. */
const LEVEL_SUM = new Float64Array(3)
const LEVEL_POWER = new Float64Array(3)
const LEVEL_SET = new Float64Array(3)

/** `Rewind::harmonics`: harmonics 1 to 6 of a string, then six more spread evenly in pitch up to `reachHz`, each standing for the band around it. */
function rewindHarmonics(hz: number, reachHz: number, most: number): void {
  const top = clamp(reachHz / hz, 12, most)
  const growth = Math.pow(top / 6, 1 / 6)
  let x = 6
  for (let k = 0; k < REWIND_PARTIALS; k++) {
    if (k < 6) HARMONIC_NUMBER[k] = k + 1
    else {
      x *= growth
      HARMONIC_NUMBER[k] = Math.max(Math.floor(x + 0.5), HARMONIC_NUMBER[k - 1] + 1)
    }
  }
  for (let k = 0; k < REWIND_PARTIALS; k++) {
    const below = k > 0 ? HARMONIC_NUMBER[k - 1] : 0
    const above = k + 1 < REWIND_PARTIALS ? HARMONIC_NUMBER[k + 1] : 2 * HARMONIC_NUMBER[k] - below
    HARMONIC_BAND[k] = Math.sqrt(0.5 * (above - below))
  }
}

/**
 * `Rewind::build` and the levelling in `start`: the partials of `source` on a
 * key at `keyHz`, written into `into`. Those above 18 kHz are left out; the
 * levels are tilted for Tone's two ends and each set is levelled half by its
 * sum and half by its power.
 */
export function rewindBuild(source: number, keyHz: number, into: RewindPartials): RewindPartials {
  const hz = clamp(keyHz, REWIND_MIN_HZ, REWIND_MAX_HZ)
  const kind = clamp(Math.round(source), PIANO, BOWL)
  if (kind === PLUCK) rewindHarmonics(hz, 6000, 40)
  else if (kind === PIANO) rewindHarmonics(hz, 7000, 48)
  // Stiffness sharpens a piano's upper partials, more so up the keyboard.
  const stiff =
    kind === PIANO
      ? Math.min(0.012, 2e-4 * (1 + (hz / 350) * (hz / 350)))
      : kind === PLUCK
        ? 2e-5
        : 0
  into.ring =
    kind === BELL
      ? clamp(16 * Math.pow(hz / 220, -0.4), 2, 30)
      : kind === PLUCK
        ? clamp(4.5 * Math.pow(hz / 110, -0.45), 0.6, 9)
        : kind === BOWL
          ? clamp(20 * Math.pow(hz / 220, -0.3), 3, 30)
          : clamp(11 * Math.pow(hz / 110, -0.55), 1.2, 22)
  let count = 0
  const sum = LEVEL_SUM.fill(0)
  const power = LEVEL_POWER.fill(0)
  const sets = LEVEL_SET
  for (let k = 0; k < REWIND_PARTIALS; k++) {
    let ratio: number
    let offset = 0
    let level: number
    let rate: number
    let paired = false
    if (kind === BELL) {
      ratio = REWIND_BELL_RATIO[k]
      level = REWIND_BELL_LEVEL[k]
      rate = Math.pow(ratio * 2, 0.7)
    } else if (kind === BOWL) {
      // Each rim mode is a pair a little apart, 0.6 of it under the mode and 0.4 over.
      const pair = k >> 1
      const apart = (0.6 + 0.36 * pair) * clamp(hz / 220, 0.12, 2)
      paired = (k & 1) === 1
      ratio = REWIND_BOWL_RATIO[pair]
      offset = paired ? 0.6 * apart : -0.4 * apart
      level = (paired ? 0.4 : 0.6) * REWIND_BOWL_LEVEL[pair]
      rate = Math.pow(ratio, 0.55)
    } else {
      const n = HARMONIC_NUMBER[k]
      ratio = n * Math.sqrt((1 + stiff * n * n) / (1 + stiff))
      // The comb of a string plucked a fifth of the way along, or struck an eighth along and softened.
      level =
        kind === PLUCK
          ? Math.pow(n, -1.5) * (0.35 + 0.65 * Math.abs(Math.sin(Math.PI * n * 0.21)))
          : Math.pow(n, -1.15) * (0.55 + 0.45 * Math.abs(Math.sin(Math.PI * n * 0.118)))
      level *= HARMONIC_BAND[k]
      rate = kind === PLUCK ? n : Math.pow(n, 0.65)
    }
    const at = hz * ratio + offset
    if (at > REWIND_TOP_HZ || at < REWIND_LOWEST_HZ) continue
    const mate = paired && count > 0
    into.hz[count] = at
    into.rate[count] = rate
    into.mate[count] = mate ? 1 : 0
    // Tone tilts the levels about the played note.
    sets[0] = level * Math.pow(ratio, -1.2)
    sets[1] = level
    sets[2] = level * Math.pow(ratio, 0.9)
    for (let set = 0; set < 3; set++) {
      into.weight[count * 3 + set] = sets[set]
      sum[set] += sets[set]
      power[set] += sets[set] * sets[set]
      // The halves of a pair meet on the strike: there they are one partial.
      if (mate) power[set] += 2 * sets[set] * into.weight[(count - 1) * 3 + set]
    }
    // A room keeps less of the top, and a pair has one wash, on its lower half.
    into.wash[count] = level * Math.min(1, Math.pow(ratio, -0.3))
    if (mate) {
      into.wash[count - 1] += into.wash[count]
      into.wash[count] = 0
    }
    count++
  }
  into.count = count
  for (let k = 0; k < count; k++) {
    for (let set = 0; set < 3; set++)
      into.weight[k * 3 + set] /= Math.sqrt(sum[set] * Math.sqrt(power[set]))
    into.wash[k] /= Math.sqrt(sum[1] * Math.sqrt(power[1]))
  }
  return into
}

/** `Rewind::start`, `deep`: how many nepers under its strike the slowest partial starts, from Rise. */
export const rewindDeep = (rise: number): number =>
  Math.exp(lerp(Math.log(REWIND_SHALLOW_RISE), Math.log(REWIND_DEEP_RISE), clamp(rise, 0, 1)))

/**
 * `Rewind::advance`, `body`: a partial at `place` of the swell (0 at the key,
 * 1 at the strike), against its level at the strike. It decays `rate` times
 * as fast as the slowest forwards, so backwards it starts that much deeper
 * and arrives later; under 16 nepers it has not started.
 */
export function rewindBody(deep: number, rate: number, place: number): number {
  const depth = Math.min(deep * rate, REWIND_DEEPEST)
  return place >= 1 - REWIND_DORMANT / depth ? Math.exp(-depth * (1 - Math.min(place, 1))) : 0
}

/** `Rewind::advance`, `gate`: the first part of the swell comes out of nothing. */
export const rewindGate = (place: number): number => smooth(place / REWIND_FADE_IN)

/** `Rewind::start`, `short_of`: how far short of its strike a held key's note comes to rest, as a place in the swell. */
export const rewindRest = (deep: number): number =>
  1 - clamp(REWIND_HOVER_UNDER / deep, REWIND_HOVER_SHORT, 0.5)

/**
 * `Rewind::advance`, a held key under On release: the place in the swell
 * `seconds` after the key. It runs as After swell does until it is 0.15 of the
 * swell short of its rest, and from there each tick goes a little less far.
 */
export function rewindHeld(seconds: number, swell: number, deep: number): number {
  const slows = rewindRest(deep) - REWIND_HOVER_SPAN
  const at = seconds / swell
  if (at <= slows) return Math.max(0, at)
  return slows + REWIND_HOVER_SPAN * (1 - Math.exp(-(at - slows) / REWIND_HOVER_SPAN))
}

/** Where a note stands: its place in the swell, and the seconds since its strike (under zero before it). */
export interface RewindPlace {
  place: number
  after: number
}

/**
 * `Rewind::start`, `release` and `advance`: where a note pressed `age`
 * seconds ago and let go `released` seconds ago (null while held) stands.
 * After swell it lands Swell after the key whatever the key does. On release
 * it rests under the held key and runs the rest in 60 ms once it is let go.
 */
export function rewindWhere(
  onRelease: boolean,
  swell: number,
  deep: number,
  age: number,
  released: number | null,
  into: RewindPlace,
): RewindPlace {
  if (!onRelease) {
    into.place = clamp(age / swell, 0, 1)
    into.after = age - swell
    return into
  }
  const held = rewindHeld(released === null ? age : age - released, swell, deep)
  if (released === null) {
    into.place = held
    into.after = -Infinity
  } else {
    into.place = lerp(held, 1, clamp(released / REWIND_SURGE_SECONDS, 0, 1))
    into.after = released - REWIND_SURGE_SECONDS
  }
  return into
}

/** `Rewind::start`, `stop`: the time constant of a note that stops dead, half its period between 2 and 6 ms. */
export const rewindStop = (keyHz: number): number =>
  clamp(REWIND_STOP_PERIODS / keyHz, REWIND_STOP_SECONDS, REWIND_SLOWEST_STOP)

/** `Rewind::advance`, `fall`: the time constant a partial decays with after the strike. Tail scales the source's own by its square. */
export const rewindFallSeconds = (
  tail: number,
  ring: number,
  rate: number,
  keyHz: number,
): number => rewindStop(keyHz) + (tail * tail * ring) / (REWIND_SIXTY_DB * rate)

/** `Rewind::advance`, `prompt`: the strike's own surge, `seconds` before or after it: 1 for none. */
export const rewindSurge = (snap: number, seconds: number): number =>
  1 + REWIND_PROMPT_MOST * snap * Math.exp(-Math.abs(seconds) / REWIND_PROMPT_SECONDS)

/**
 * `Rewind::advance`, `ghost`: the wash ahead of the note at `place`, against
 * a partial's level at the strike. It is shallower than the note, so it comes
 * up earlier, and it is gone at the strike.
 */
export function rewindGhost(ghost: number, deep: number, place: number): number {
  const u2 = place * place
  return ghost * Math.exp(-(0.5 * deep + 0.6) * (1 - place)) * (1 - u2 * u2) * rewindGate(place)
}

/** `Rewind::control`, `wow`: the tape's speed error `seconds` after the first note of a silence, as a share of the pitch. */
export function rewindWow(wobble: number, seconds: number): number {
  return (
    REWIND_WOW *
    wobble *
    Math.sqrt(wobble) *
    (REWIND_WOW_SLOW_SHARE * Math.sin(TAU * REWIND_WOW_SLOW_HZ * seconds) +
      (1 - REWIND_WOW_SLOW_SHARE) * Math.sin(TAU * REWIND_WOW_FAST_HZ * seconds))
  )
}

/** `Rewind::wow_depth`: the most the tape runs off its pitch, in cents either way: 18 at Wobble 1 (`kMaxWow`). */
export const rewindWowCents = (wobble: number): number =>
  1200 * Math.log2(1 + REWIND_WOW * wobble * Math.sqrt(wobble))

/** `Rewind::place`, `second`: the second copy against the two together. */
export const rewindSecond = (shimmer: number): number => 0.5 * Math.sqrt(clamp(shimmer, 0, 1))
/** `Rewind::control`, `beat`: how often a partial at `hz` and its second copy come round, in Hz. */
export const rewindBeatHz = (hz: number, shimmer: number): number => hz * REWIND_DETUNE * shimmer

/** Two parts `a` and `b` that turn against each other, `turns` round: what they add up to against the two in step. */
export const rewindBeat = (a: number, b: number, turns: number): number =>
  a + b > 0 ? Math.sqrt(a * a + b * b + 2 * a * b * Math.cos(TAU * turns)) / (a + b) : 0

/** `Rewind::advance`, `weight`: a partial's level at the strike, between the three sets Tone moves through. */
export function rewindWeight(partials: RewindPartials, k: number, tone: number): number {
  const low = tone < 0.5 ? 0 : 1
  const blend = clamp(tone, 0, 1) * 2 - low
  return lerp(partials.weight[k * 3 + low], partials.weight[k * 3 + low + 1], blend)
}

/**
 * How loud a note is against its own strike, all its partials together:
 * `place` of the way through the swell, or `after` seconds past the strike
 * when that is not negative.
 */
export function rewindLevel(
  partials: RewindPartials,
  keyHz: number,
  deep: number,
  tone: number,
  tail: number,
  place: number,
  after: number,
): number {
  let now = 0
  let full = 0
  for (let k = 0; k < partials.count; k++) {
    const weight = rewindWeight(partials, k, tone)
    full += weight
    now +=
      weight *
      (after >= 0
        ? Math.exp(-after / rewindFallSeconds(tail, partials.ring, partials.rate[k], keyHz))
        : rewindBody(deep, partials.rate[k], place) * rewindGate(place))
  }
  return full > 0 ? now / full : 0
}

/**
 * `Rewind::start`, `amp`, and `note_gain`: the gain of a note played as hard
 * as `gain`, with Tail and Snap as they stand when it starts. The device
 * levels the loudest 400 ms of every note, the stretch round its strike, in
 * closed form: each partial climbs into the strike, falls from it, and Snap's
 * surge stands on both sides; the strike is kept under a ceiling. It is here
 * because a tail is over where it falls under the device's floor, which is a
 * level and not a distance under the strike.
 */
export function rewindAmp(
  partials: RewindPartials,
  keyHz: number,
  gain: number,
  onRelease: boolean,
  swell: number,
  deep: number,
  tail: number,
  snap: number,
): number {
  const hz = clamp(keyHz, REWIND_MIN_HZ, REWIND_MAX_HZ)
  const shortOf = 1 - rewindRest(deep)
  const surge = REWIND_PROMPT_MOST * snap
  // Under a held key the last climb is the run in after the key is let go, from where the note rested.
  const climb = onRelease ? REWIND_SURGE_SECONDS / shortOf : swell
  const reach = onRelease ? REWIND_SURGE_SECONDS : Math.min(swell, REWIND_LOUDEST)
  const fast = 1 / REWIND_PROMPT_SECONDS
  let most = 0
  for (let step = 0; step <= 4; step++) {
    const before = REWIND_LOUDEST * 0.25 * step
    const after = REWIND_LOUDEST - before
    const rising = Math.min(before, reach)
    let energy = 0
    let half = 0
    for (let k = 0; k < partials.count; k++) {
      // As at Tone 0.5; the halves of a beating pair are in step round the strike and count as one.
      let weight = partials.weight[k * 3 + 1]
      if (k + 1 < partials.count && partials.mate[k + 1]) {
        half = weight
        continue
      }
      if (partials.mate[k]) weight += half
      const depth = Math.min(deep * partials.rate[k], REWIND_DEEPEST)
      const c = (2 * depth) / climb
      const d = 2 / rewindFallSeconds(tail, partials.ring, partials.rate[k], hz)
      let part = (1 - Math.exp(-c * rising)) / c + (1 - Math.exp(-d * after)) / d
      if (onRelease && before > reach) part += Math.exp(-2 * depth * shortOf) * (before - reach)
      part +=
        surge * (2 / (fast + c) + 2 / (fast + d)) +
        surge * surge * (1 / (2 * fast + c) + 1 / (2 * fast + d))
      energy += weight * weight * part
    }
    most = Math.max(most, energy)
  }
  const loud = Math.sqrt((0.5 * most) / REWIND_LOUDEST)
  const level = Math.min(
    REWIND_LOUDNESS / Math.max(loud, 1e-6),
    REWIND_TALLEST / (1 + surge + REWIND_HAMMER_TALL * snap),
  )
  const touch = clamp(gain, 0, 1)
  const tilt = Math.pow(Math.min(hz, REWIND_TILT_TOP) / 220, REWIND_KEY_TILT)
  return tilt * touch * (0.4 + 0.6 * touch) * level
}

/**
 * `Rewind::advance`, `follow`: the seconds after its strike at which what is
 * left of a note of gain `amp` is under `kFloor` of full scale, where the
 * device retires it. A soft note is there sooner than a hard one. (A note
 * that shared its strike with others was turned down a little more, see
 * `gather`: that is left out, and is under a twentieth of the time.)
 */
export function rewindRings(
  partials: RewindPartials,
  keyHz: number,
  amp: number,
  tone: number,
  tail: number,
): number {
  let full = 0
  let slowest = 0
  for (let k = 0; k < partials.count; k++) {
    full += rewindWeight(partials, k, tone)
    slowest = Math.max(slowest, rewindFallSeconds(tail, partials.ring, partials.rate[k], keyHz))
  }
  if (amp * full <= REWIND_FLOOR) return 0
  // No partial outlasts the slowest: the answer lies before the time all of them would take at its pace.
  let from = 0
  let to = slowest * Math.log((amp * full) / REWIND_FLOOR)
  for (let halving = 0; halving < 20; halving++) {
    const at = (from + to) / 2
    if (amp * full * rewindLevel(partials, keyHz, 0, tone, tail, 1, at) > REWIND_FLOOR) from = at
    else to = at
  }
  return to
}

/**
 * `Rewind::note_on`, `restart`: the first note after a silence starts the
 * tape's wow again, so the wow is as old as the first note of the run that
 * still sounds. Its place in `notes` comes back, -1 while nothing sounds.
 * `quiet` says for each note how many seconds ago the device retired it,
 * under zero while it sounds: its strike (`rewindWhere`) and `rewindRings`.
 */
export function rewindRun(notes: readonly DisplayNote[], quiet: ArrayLike<number>): number {
  let first = -1
  let last = Infinity
  for (let i = 0; i < notes.length; i++) {
    if (first < 0 || last >= notes[i].age) {
      first = i
      last = Infinity
    }
    last = Math.min(last, quiet[i])
  }
  return last < 0 ? first : -1
}

/** The key the display stands on while none is played: middle C. */
const REWIND_REST_HZ = 261.6255653
/** Under this share of its strike a note that has landed is done: 60 dB. */
const REWIND_DONE = 0.001
/** How far the tape's middle line is drawn off its place at Wobble 1, in px: 18 cents would be nothing to see. */
const REWIND_WOW_PX = 5
/** The seconds a tick of the tape's scale may stand for: the least of them that leaves 7 px between two. */
const REWIND_TICKS = [0.1, 0.5, 1, 5, 10] as const
/** One column of the picture: x, the middle line's y, and the px each partial's edge and the ghost's stand off it, up and down. */
const COLUMN_UP = 2
const COLUMN_DOWN = COLUMN_UP + REWIND_PARTIALS + 1
const COLUMN_GHOST = COLUMN_DOWN + REWIND_PARTIALS + 1
const COLUMN = COLUMN_GHOST + 2

interface RewindParts {
  /** The tape: the key at its left edge, time to the right. */
  tape: Box
  /** Where the strike stands, and how wide the wait under a held key is drawn before it. */
  strike: number
  hold: number
  foot: Box
}

function rewindParts(view: Size, onRelease: boolean): RewindParts {
  const tape: Box = { x: 6, y: 15, w: view.width - 12, h: view.height - 28 }
  return {
    tape,
    strike: tape.x + Math.round(tape.w * 0.62),
    hold: onRelease ? clamp(Math.round(tape.w * 0.09), 10, 18) : 0,
    foot: { x: 4, y: view.height - 10, w: view.width - 8, h: 6 },
  }
}

/** The px a note stands off the tape's middle line at its strike: the strike's surge at Snap 1 reaches the edge of the room the wow leaves. */
const rewindUnit = (tape: Box): number =>
  (tape.h / 2 - REWIND_WOW_PX - 1) / Math.cbrt(1 + REWIND_PROMPT_MOST)

/**
 * What a note was started with: `Rewind::start` reads Source, Strike, Swell
 * and Rise once, and sets the note's gain from Tail and Snap as they stand.
 * A key played twice is two notes with one id, so a note is known by its id
 * and when it began.
 */
interface RewindSeen {
  id: number
  born: number
  source: number
  onRelease: boolean
  swell: number
  deep: number
  amp: number
  /** Seconds its tail lasts after the strike (`rewindRings`), and the Tail and Tone that was worked out for. */
  rings: number
  ringsTail: number
  ringsTone: number
}

interface RewindState {
  /** The partials the picture is drawn from, and of the note whose level is asked for; what each was built for. */
  shown: RewindPartials
  shownFor: [number, number]
  own: RewindPartials
  ownFor: [number, number]
  /** What each note of `frame.notes` was started with, in their order; last frame's list, to find them in; how long ago each went quiet. */
  seen: RewindSeen[]
  spare: RewindSeen[]
  quiet: number[]
  where: RewindPlace
  /** The picture's columns, how many, and the two between which a held key waits (-1 for none). */
  columns: Float32Array
  corners: Float64Array
  count: number
  holdFrom: number
  holdTo: number
}

/** The partials of a key, built again only when the source or the key is another. */
function rewindOf(into: RewindPartials, built: [number, number], source: number, hz: number) {
  if (built[0] !== source || built[1] !== hz) {
    rewindBuild(source, hz, into)
    built[0] = source
    built[1] = hz
  }
  return into
}

/** A beat as it can be drawn: its true swell where a turn is eight px or more, its mean where it is under four. */
function drawnBeat(a: number, b: number, hz: number, seconds: number, pxPerSecond: number): number {
  const turn = hz > 0 ? pxPerSecond / hz : Infinity
  const mean = a + b > 0 ? Math.sqrt(a * a + b * b) / (a + b) : 0
  if (turn <= 4) return mean
  return lerp(mean, rewindBeat(a, b, hz * seconds), clamp((turn - 4) / 4, 0, 1))
}

/**
 * The picture of one note on a key at `keyHz`, column by column: the tape's
 * middle line, bent by the wow from `since` seconds after the first note of
 * the run, and every partial laid on the one below it, the left speaker's
 * share upwards and the right's downwards, on a scale of cube roots so that
 * 18 dB is a doubling and the quiet start of a swell is still seen. Left of the strike a partial is its mirror image
 * `rewindBody`; right of it its own decay as Tail leaves it.
 */
function rewindColumns(
  frame: DisplayFrame<RewindState>,
  parts: RewindParts,
  keyHz: number,
  since: number,
): void {
  const { state } = frame
  const { tape, strike, hold } = parts
  const partials = state.shown
  const onRelease = hold > 0
  const swell = frame.value('swell')
  const deep = rewindDeep(frame.value('rise'))
  const tone = frame.value('tone')
  const tail = frame.value('tail')
  const snap = frame.value('snap')
  const ghost = frame.value('ghost')
  const wobble = frame.value('wobble')
  const shimmer = frame.value('shimmer')
  const width = frame.value('width')
  const second = rewindSecond(shimmer)
  const rest = rewindRest(deep)
  const run = strike - tape.x - hold
  const pxPerSecond = (strike - tape.x) / swell
  const waits = tape.x + rest * run
  const middle = tape.y + tape.h / 2
  const unit = rewindUnit(tape)
  let full = 0
  let wash = 0
  for (let k = 0; k < partials.count; k++) {
    full += rewindWeight(partials, k, tone)
    wash += partials.wash[k]
  }
  const columns = state.columns
  const most = Math.floor(columns.length / COLUMN)
  let count = 0
  state.holdFrom = state.holdTo = -1
  const end = tape.x + tape.w
  // Every other pixel, and the places where the picture turns a corner: the wait's two ends and the strike.
  const corners = state.corners
  corners[0] = waits
  corners[1] = waits + hold
  corners[2] = strike - 1.5
  corners[3] = strike
  corners[4] = strike + 1.5
  let x = tape.x
  while (count < most) {
    const at = count * COLUMN
    const struck = x > strike
    let place = 1
    let toStrike = 0
    let after = 0
    if (struck) after = (x - strike) / pxPerSecond
    else if (!onRelease) {
      place = (x - tape.x) / run
      toStrike = (1 - place) * swell
    } else if (x <= waits) {
      place = (x - tape.x) / run
      toStrike = Infinity
      if (x === waits) state.holdFrom = count
    } else if (x < waits + hold) {
      place = rest
      toStrike = Infinity
    } else {
      place = clamp((x - hold - tape.x) / run, rest, 1)
      toStrike = ((1 - place) / (1 - rest)) * REWIND_SURGE_SECONDS
      if (x === waits + hold) state.holdTo = count
    }
    const seconds = (x - tape.x) / pxPerSecond
    // What beats inside the note meets on the strike; under a held key, where the strike is not known, on the key.
    const beats = seconds - (onRelease && x < waits + hold ? 0 : swell)
    // The seconds since the key at this column, for the wow. On release a key is held for as long
    // as it likes: the picture is of one let go the moment its note comes to rest.
    const rested = rest * swell
    const turned = !onRelease
      ? seconds
      : struck
        ? rested + REWIND_SURGE_SECONDS + after
        : x <= waits
          ? place * swell
          : rested + (x < waits + hold ? 0 : REWIND_SURGE_SECONDS - toStrike)
    columns[at] = x
    columns[at + 1] = middle - (rewindWow(wobble, since + turned) / REWIND_WOW) * REWIND_WOW_PX
    let up = 0
    let down = 0
    for (let k = 0; k < partials.count; k++) {
      const weight = rewindWeight(partials, k, tone)
      let level = struck
        ? Math.exp(-after / rewindFallSeconds(tail, partials.ring, partials.rate[k], keyHz)) *
          rewindSurge(snap, after)
        : rewindBody(deep, partials.rate[k], place) *
          rewindGate(place) *
          rewindSurge(snap, toStrike)
      level *= drawnBeat(
        1 - second,
        second,
        rewindBeatHz(partials.hz[k], shimmer),
        beats,
        pxPerSecond,
      )
      // The two halves of a beating pair swell and thin together.
      const lower = partials.mate[k]
        ? k - 1
        : k + 1 < partials.count && partials.mate[k + 1]
          ? k
          : -1
      if (lower >= 0)
        level *= drawnBeat(
          rewindWeight(partials, lower, tone),
          rewindWeight(partials, lower + 1, tone),
          partials.hz[lower + 1] - partials.hz[lower],
          beats,
          pxPerSecond,
        )
      // `Rewind::place`: a partial's place between the speakers, at constant power.
      const angle = (0.5 * width * REWIND_PAN[k] + 1) * (Math.PI / 4)
      up += weight * level * Math.SQRT2 * Math.cos(angle)
      down += weight * level * Math.SQRT2 * Math.sin(angle)
      columns[at + COLUMN_UP + k] = unit * Math.cbrt(up / full)
      columns[at + COLUMN_DOWN + k] = unit * Math.cbrt(down / full)
    }
    const haze = struck ? 0 : rewindGhost(ghost, deep, place) * wash
    columns[at + COLUMN_GHOST] = unit * Math.cbrt((up + haze) / full)
    columns[at + COLUMN_GHOST + 1] = unit * Math.cbrt((down + haze) / full)
    count++
    if (x >= end) break
    let next = Math.min(x + 2, end)
    for (let c = onRelease ? 0 : 2; c < corners.length; c++)
      if (corners[c] > x && corners[c] < next) next = corners[c]
    x = next
  }
  state.count = count
}

/** One of a column's figures at `x`, read between the two columns it lies between. */
function rewindAt(state: RewindState, x: number, figure: number): number {
  const { columns, count } = state
  let i = 1
  while (i < count - 1 && columns[i * COLUMN] < x) i++
  const from = columns[(i - 1) * COLUMN]
  const to = columns[i * COLUMN]
  const share = to > from ? clamp((x - from) / (to - from), 0, 1) : 0
  return lerp(columns[(i - 1) * COLUMN + figure], columns[i * COLUMN + figure], share)
}

/** A closed shape between two of the picture's edges, `up` above the middle line and `down` under it, over some of its columns. */
function rewindShape(
  ctx: CanvasRenderingContext2D,
  state: RewindState,
  from: number,
  to: number,
  up: number,
  down: number,
): void {
  const { columns } = state
  for (let i = from; i <= to; i++) {
    const at = i * COLUMN
    if (i === from) ctx.moveTo(columns[at], columns[at + 1] - columns[at + up])
    else ctx.lineTo(columns[at], columns[at + 1] - columns[at + up])
  }
  for (let i = to; i >= from; i--) {
    const at = i * COLUMN
    ctx.lineTo(columns[at], columns[at + 1] + columns[at + down])
  }
  ctx.closePath()
}

/** One edge of the picture as a line over some of its columns: `side` -1 above the middle line, 1 under it. */
function rewindEdge(
  ctx: CanvasRenderingContext2D,
  state: RewindState,
  from: number,
  to: number,
  figure: number,
  side: number,
): void {
  const { columns } = state
  for (let i = from; i <= to; i++) {
    const at = i * COLUMN
    if (i === from) ctx.moveTo(columns[at], columns[at + 1] + side * columns[at + figure])
    else ctx.lineTo(columns[at], columns[at + 1] + side * columns[at + figure])
  }
}

const rewind = plateDisplay<RewindState>({
  place: 'window',
  columns: 2,
  params: [
    'source',
    'strike',
    'swell',
    'tail',
    'snap',
    'rise',
    'tone',
    'ghost',
    'wobble',
    'shimmer',
    'width',
  ],
  live: { signal: true, notes: true },
  info: 'One note as the tape holds it, read from the key at the left: its partials laid on one another, swelling into the strike at the upright line, then stopping dead or ringing on. The haze ahead is the ghost. A played note runs along it, and waits at the gap while its key is held.',
  init: () => ({
    shown: rewindPartials(),
    shownFor: [-1, 0],
    own: rewindPartials(),
    ownFor: [-1, 0],
    seen: [],
    spare: [],
    quiet: [],
    where: { place: 0, after: 0 },
    columns: new Float32Array(COLUMN * 280),
    corners: new Float64Array(5),
    count: 0,
    holdFrom: -1,
    holdTo: -1,
  }),
  draw(frame) {
    const { ctx, colours, state, notes } = frame
    ground(frame)
    const source = clamp(Math.round(frame.value('source')), PIANO, BOWL)
    const onRelease = frame.value('strike') > 0.5
    const swell = frame.value('swell')
    const deep = rewindDeep(frame.value('rise'))
    const tone = frame.value('tone')
    const tail = frame.value('tail')
    const parts = rewindParts(frame, onRelease)
    const { tape, strike, hold, foot } = parts
    const run = strike - tape.x - hold
    const pxPerSecond = (strike - tape.x) / swell
    const rest = rewindRest(deep)
    const end = tape.x + tape.w

    // What each note was started with, kept from the frame it is first seen on, and how long ago
    // the device retired it: its strike, and the tail its own key and gain leave after it.
    const before = state.seen
    const seenNow = state.spare
    seenNow.length = 0
    state.quiet.length = notes.length
    for (let index = 0; index < notes.length; index++) {
      const note = notes[index]
      const born = frame.now - note.age
      const hz = clamp(note.frequency, REWIND_MIN_HZ, REWIND_MAX_HZ)
      let seen: RewindSeen | undefined
      for (let i = 0; !seen && i < before.length; i++)
        if (before[i].id === note.id && Math.abs(before[i].born - born) < 0.05) seen = before[i]
      if (!seen) {
        const own = rewindOf(state.own, state.ownFor, source, hz)
        const amp = rewindAmp(own, hz, note.gain, onRelease, swell, deep, tail, frame.value('snap'))
        seen = {
          id: note.id,
          born,
          source,
          onRelease,
          swell,
          deep,
          amp,
          rings: 0,
          ringsTail: NaN,
          ringsTone: NaN,
        }
      }
      if (seen.ringsTail !== tail || seen.ringsTone !== tone) {
        const own = rewindOf(state.own, state.ownFor, seen.source, hz)
        seen.rings = rewindRings(own, hz, seen.amp, tone, tail)
        seen.ringsTail = tail
        seen.ringsTone = tone
      }
      seenNow.push(seen)
      const where = rewindWhere(
        seen.onRelease,
        seen.swell,
        seen.deep,
        note.age,
        note.released,
        state.where,
      )
      state.quiet[index] = where.after - seen.rings
    }
    state.seen = seenNow
    state.spare = before

    // The picture is the last key's (middle C while none is played), with the wow where the run has brought it.
    const last = notes.length > 0 ? notes[notes.length - 1] : null
    const keyHz = clamp(last ? last.frequency : REWIND_REST_HZ, REWIND_MIN_HZ, REWIND_MAX_HZ)
    rewindOf(state.shown, state.shownFor, source, keyHz)
    const first = rewindRun(notes, state.quiet)
    rewindColumns(frame, parts, keyHz, first >= 0 && last ? notes[first].age - last.age : 0)
    const edge = state.shown.count - 1
    const top = COLUMN_UP + edge
    const bottom = COLUMN_DOWN + edge
    // The picture ends where nothing of the note is left: a note that stops dead has no line after its strike.
    let lastColumn = state.count - 1
    while (
      state.columns[lastColumn * COLUMN] > strike + 1.5 &&
      state.columns[lastColumn * COLUMN + top] < 0.35 &&
      state.columns[lastColumn * COLUMN + bottom] < 0.35
    )
      lastColumn--

    // The strike, and seconds counted from it both ways.
    rule(ctx, strike, tape.y, strike, tape.y + tape.h, { colour: colours.ink, alpha: INK.rule })
    let step = 10
    for (let i = REWIND_TICKS.length - 1; i >= 0; i--)
      if (REWIND_TICKS[i] * pxPerSecond >= 7) step = REWIND_TICKS[i]
    ctx.beginPath()
    for (let x = strike - step * pxPerSecond; !onRelease && x > tape.x; x -= step * pxPerSecond) {
      ctx.moveTo(crisp(x), tape.y + tape.h)
      ctx.lineTo(crisp(x), tape.y + tape.h - 3)
    }
    // On release the strike waits for the key, so no second before it can be counted back from it:
    // they are counted on from the key, as far as the note runs straight (`hover_at`).
    const straight = rest - REWIND_HOVER_SPAN
    for (let sec = step; onRelease && sec <= straight * swell; sec += step) {
      const x = tape.x + (sec / swell) * run
      ctx.moveTo(crisp(x), tape.y + tape.h)
      ctx.lineTo(crisp(x), tape.y + tape.h - 3)
    }
    for (let x = strike + step * pxPerSecond; x < end; x += step * pxPerSecond) {
      ctx.moveTo(crisp(x), tape.y + tape.h)
      ctx.lineTo(crisp(x), tape.y + tape.h - 3)
    }
    ctx.globalAlpha = INK.back
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()

    // The tape is drawn whole, or in the two pieces either side of the wait under a held key.
    const waits = state.holdFrom >= 0 && state.holdTo > state.holdFrom
    const core = state.shown.count > 1 && state.shown.mate[1] ? 1 : 0
    ctx.lineJoin = 'round'
    for (let piece = 0; piece < (waits ? 2 : 1); piece++) {
      const from = piece === 0 ? 0 : state.holdTo
      const to = waits && piece === 0 ? state.holdFrom : lastColumn
      // The ghost ahead of the note, the note, and its lowest partial as the core.
      ctx.fillStyle = colours.ink
      ctx.beginPath()
      rewindShape(ctx, state, from, to, COLUMN_GHOST, COLUMN_GHOST + 1)
      ctx.globalAlpha = 0.16
      ctx.fill()
      for (let layer = 0; layer < 2; layer++) {
        const figure = layer === 0 ? edge : core
        ctx.beginPath()
        rewindShape(ctx, state, from, to, COLUMN_UP + figure, COLUMN_DOWN + figure)
        ctx.globalAlpha = 0.3
        ctx.fill()
      }
      // The edges between the partials, a beating pair as one.
      ctx.beginPath()
      for (let k = core + 1; k < edge; k++) {
        if (state.shown.mate[k + 1]) continue
        rewindEdge(ctx, state, from, to, COLUMN_UP + k, -1)
        rewindEdge(ctx, state, from, to, COLUMN_DOWN + k, 1)
      }
      ctx.globalAlpha = 0.4
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 0.75
      ctx.stroke()
      ctx.beginPath()
      rewindEdge(ctx, state, from, to, top, -1)
      rewindEdge(ctx, state, from, to, bottom, 1)
      ctx.globalAlpha = 1
      ctx.lineWidth = 1.25
      ctx.stroke()
    }
    if (waits) {
      // The wait: the note stands as it is for as long as the key is held.
      ctx.beginPath()
      rewindEdge(ctx, state, state.holdFrom, state.holdTo, top, -1)
      rewindEdge(ctx, state, state.holdFrom, state.holdTo, bottom, 1)
      ctx.setLineDash([2, 2])
      ctx.globalAlpha = INK.text
      ctx.lineWidth = 1.25
      ctx.stroke()
      ctx.setLineDash([])
    }
    ctx.globalAlpha = 1

    // The notes that sound, the newest twelve: each where it stands on the tape.
    let lit = 0
    for (let index = notes.length - 1; index >= 0 && lit < REWIND_VOICES; index--) {
      const note = notes[index]
      const seen = state.seen[index]
      const where = rewindWhere(
        seen.onRelease,
        seen.swell,
        seen.deep,
        note.age,
        note.released,
        state.where,
      )
      const landed = where.after >= 0
      let level = 1
      if (landed) {
        const hz = clamp(note.frequency, REWIND_MIN_HZ, REWIND_MAX_HZ)
        const own = rewindOf(state.own, state.ownFor, seen.source, hz)
        level = rewindLevel(own, hz, seen.deep, tone, tail, 1, where.after)
        if (level < REWIND_DONE) continue
      }
      lit++
      const strength = lerp(0.55, 1, clamp(note.gain, 0, 1))
      const x = landed
        ? strike + where.after * pxPerSecond
        : tape.x + where.place * run + (hold > 0 && where.place > rest + 1e-6 ? hold : 0)
      if (landed && where.after < 0.15) {
        // It has just landed: the strike itself, for a moment.
        rule(ctx, strike, tape.y, strike, tape.y + tape.h, {
          colour: colours.accent,
          width: 2,
          alpha: 1 - where.after / 0.15,
        })
      }
      if (x > end) {
        // Its tail has run off the picture: what is left of it, at the edge.
        const y = rewindAt(state, end, 1) - rewindUnit(tape) * Math.cbrt(level)
        dot(ctx, end, clamp(y, tape.y, tape.y + tape.h), 2.5, colours.accent, { alpha: strength })
        continue
      }
      // The stretch of the note that sounds now, bright at the place it has come to and fainter behind.
      for (let slab = 0; slab < 3; slab++) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(x - 5 - slab * 6, tape.y, slab === 0 ? 5 : 6, tape.h)
        ctx.clip()
        ctx.beginPath()
        rewindShape(ctx, state, 0, lastColumn, top, bottom)
        ctx.globalAlpha = strength / (1 << slab)
        ctx.fillStyle = colours.accent
        ctx.fill()
        ctx.restore()
      }
      ctx.globalAlpha = 1
      const middle = rewindAt(state, x, 1)
      const up = middle - rewindAt(state, x, top)
      rule(ctx, x, up, x, middle + rewindAt(state, x, bottom), {
        colour: colours.accent,
        width: 1.5,
      })
      dot(ctx, x, up, 2.5, colours.accent)
    }

    levelFoot(frame, foot, outShare(frame))

    // The words: the source and how it lands, the key and how long its swell is.
    // The tape's weave is drawn far out of scale, so where it can be seen its true size is said.
    const wobble = frame.value('wobble')
    const weaves = frame.width >= 160 && REWIND_WOW_PX * wobble * Math.sqrt(wobble) >= 0.5
    const wow = weaves ? `, wow ±${Math.round(rewindWowCents(wobble))} ct` : ''
    text(frame, `${REWIND_SOURCES[source]}${onRelease ? ', held' : ''}${wow}`, 6, 11)
    text(frame, `${pitchName(keyHz)} ${secondsText(swell)}`, frame.width - 6, 11, {
      align: 'right',
    })
  },
})

export const TURN_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  staircase: {
    display: staircase,
    face: ['motion', 'speed', 'centre', 'span'],
  },
  rewind: {
    display: rewind,
    face: ['source', 'strike', 'swell', 'tail'],
  },
}
