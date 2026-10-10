// The display of the Acid Bass: one oscillator through a resonant low-pass, with accents and slides.
//
// It is a line of notes. Time runs across, six seconds of it with now at the
// right, and pitch runs upward. Each note is a band at its pitch, as thick as
// it is loud, under the line of the filter's edge: a struck note throws the
// edge up into a fin, an accent throws it higher, and a key pressed over a
// held one bends the band to its pitch and raises no fin. Beside the line, on
// the same scale of pitch, stand the harmonics that come through the filter
// and Drive now.
//
// The instrument has one voice and remembers (where the filter envelope and
// the accent store stand, which keys are down), so nothing here is read off a
// note alone: the keys are played through again, the way the header plays
// them, and the line is what that leaves.

import {
  INK,
  clamp,
  clipped,
  crisp,
  dot,
  fillRect,
  gainToDb,
  ground,
  handle,
  hzText,
  label,
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

type Size = Pick<DisplayView, 'width' | 'height'>

// --- The device's figures ------------------------------------------------------

/** `acid_bass.h`: where the voice sits before any key (`kRestPitch` is its log2), and the pitches a key is kept between. */
const ACID_REST_HZ = 55
const ACID_KEY_LOW_HZ = 8
const ACID_KEY_HIGH_HZ = 12000
/** `acid_bass.h`, `kMaxHeld`: the keys the stack holds. */
const ACID_MAX_HELD = 16
/** `kEnvOctaves`, `kAccentStrikeOctaves`, `kAccentOctaves`, `kMaxCutoffHz`: how far Env Mod, an accent's strike and a full store open the filter, and where it stops. */
const ACID_ENV_OCTAVES = 5
const ACID_ACCENT_STRIKE_OCTAVES = 1
const ACID_STORE_OCTAVES = 4
const ACID_MAX_CUTOFF_HZ = 18000
/** `kMaxFeedback`, `kOpenRatio`, `kBassKept`: the loop's feedback at Resonance 1, the stages' tuning with none, the share of the pass band given back. */
const ACID_MAX_FEEDBACK = 7.7
const ACID_OPEN_RATIO = 1.09
const ACID_BASS_KEPT = 0.6
/** `kAccentFrom`, `kLevelFloor`, `kAccentBoost`, `kAccentDecaySeconds`. */
const ACID_ACCENT_FROM = 0.7
const ACID_LEVEL_FLOOR = 0.3
const ACID_ACCENT_BOOST = 0.58
const ACID_ACCENT_DECAY_SEC = 0.2
/** `kStoreChargeTau`, `kStoreDrainTau`, `kStoreEmpty`. */
const ACID_STORE_CHARGE_SEC = 0.15
const ACID_STORE_DRAIN_SEC = 0.35
const ACID_STORE_EMPTY = 1e-3
/** `kStrikeSeconds`, `kStrikeTarget`, `kTieSeconds`, `kReleaseTau`, `kHoldFromSeconds`, `kSilent`. */
const ACID_STRIKE_SEC = 0.002
const ACID_STRIKE_TARGET = 1.3
const ACID_TIE_SEC = 0.008
const ACID_RELEASE_TAU = 0.0035
const ACID_HOLD_FROM_SEC = 19.9
const ACID_SILENT = 1e-6
/** `kSixtyDb`, `kTwentyDb`, `kSlideArrival`, `kArrived`: the logarithms the falls and the slide are timed by, and how near a slide is there. */
const ACID_SIXTY_DB = 6.907755279
const ACID_TWENTY_DB = 2.302585093
const ACID_SLIDE_ARRIVAL = 4.605170186
const ACID_ARRIVED = 1e-5
/** `kMaxDriveDb`, `kDriveFloor`, `kDriveNominal`, `kOutGain`. */
const ACID_MAX_DRIVE_DB = 36
const ACID_DRIVE_FLOOR = 0.6
const ACID_DRIVE_NOMINAL = 0.13
const ACID_OUT_GAIN = 1.7
/** `kOscGain`, `kSquareLevel`. */
const ACID_OSC_GAIN = 0.25
const ACID_SQUARE_LEVEL = 0.55
/** `kit::DeviceBase`, `kSmoothingSeconds`: how fast a key's own level is come to. */
const ACID_SMOOTH_SEC = 0.005

/** `AcidBass::note_on`: how much of an accent a key struck as hard as `gain` is, 0 for a plain note. It grows from a gain of 0.7 to 1, and with Accent. */
export function acidAccent(gain: number, accent: number): number {
  return clamp((gain - ACID_ACCENT_FROM) / (1 - ACID_ACCENT_FROM), 0, 1) * accent
}

/** `AcidBass::note_on`: the level of a key from how hard it was struck, with what its accent adds: 6 dB between a gain of 0.7 and a full accent at 1. */
export function acidKeyLevel(gain: number, keyAccent: number): number {
  return (
    (ACID_LEVEL_FLOOR + (1 - ACID_LEVEL_FLOOR) * clamp(gain, 0, 1)) *
    (1 + ACID_ACCENT_BOOST * keyAccent)
  )
}

/**
 * `AcidBass::advance_amp_envelope` and `advance_filter_envelope`: a rise from
 * `level`, `seconds` on. It aims 30 % past full and is cut off there, which
 * from nothing it reaches after `over` seconds: 2 ms for a strike, 8 ms for
 * the loudness under a tied key.
 */
export function acidRise(level: number, seconds: number, over: number): number {
  const short = (ACID_STRIKE_TARGET - 1) / ACID_STRIKE_TARGET
  return Math.min(
    1,
    ACID_STRIKE_TARGET - (ACID_STRIKE_TARGET - level) * Math.pow(short, seconds / over),
  )
}

/** How long that rise takes to be full, from `level`. */
function acidRiseSeconds(level: number, over: number): number {
  if (level >= 1) return 0
  const short = (ACID_STRIKE_TARGET - 1) / ACID_STRIKE_TARGET
  return (
    (over * Math.log((ACID_STRIKE_TARGET - 1) / (ACID_STRIKE_TARGET - level))) / Math.log(short)
  )
}

/** `AcidBass::set_filter_decay`: the seconds the filter envelope takes to come nine tenths of the way back. An accent pulls Decay towards its own 0.2 s, never up to it. */
export function acidFilterSeconds(decay: number, keyAccent: number): number {
  return keyAccent > 0 && decay > ACID_ACCENT_DECAY_SEC
    ? decay * Math.pow(ACID_ACCENT_DECAY_SEC / decay, keyAccent)
    : decay
}

/** `AcidBass::advance_filter_envelope`: what is left of the filter envelope `seconds` after its strike was full. */
export function acidFilterFall(seconds: number, decay: number, keyAccent: number): number {
  const level = Math.exp((-ACID_TWENTY_DB * seconds) / acidFilterSeconds(decay, keyAccent))
  return level < ACID_SILENT ? 0 : level
}

/** `AcidBass::advance_amp_envelope`: what is left of a held note `seconds` after it was full: 60 dB down after Sustain, which at its top holds. */
export function acidHeldFall(seconds: number, sustain: number): number {
  if (sustain >= ACID_HOLD_FROM_SEC) return 1
  const level = Math.exp((-ACID_SIXTY_DB * seconds) / sustain)
  return level < ACID_SILENT ? 0 : level
}

/**
 * `AcidBass::advance_filter_envelope`: the accent store `seconds` on, with the
 * accented envelope feeding it `feed`. It fills towards what feeds it through
 * a resistance and empties by itself, more slowly.
 */
export function acidStore(store: number, feed: number, seconds: number): number {
  const next =
    feed > store
      ? store + (1 - Math.exp(-seconds / ACID_STORE_CHARGE_SEC)) * (feed - store)
      : store * Math.exp(-seconds / ACID_STORE_DRAIN_SEC)
  return next < ACID_STORE_EMPTY && feed < ACID_STORE_EMPTY ? 0 : next
}

/** `AcidBass::process`: where the filter stands, in Hz. `opening` is the filter envelope, `keyAccent` the struck key's accent, `store` the accent store. No key moves it: the filter does not follow the keyboard. */
export function acidCutoffHz(
  cutoff: number,
  envMod: number,
  keyAccent: number,
  opening: number,
  store: number,
): number {
  const octaves =
    (envMod * ACID_ENV_OCTAVES + keyAccent * ACID_ACCENT_STRIKE_OCTAVES) * opening +
    ACID_STORE_OCTAVES * store
  return Math.min(octaves > 0 ? cutoff * Math.pow(2, octaves) : cutoff, ACID_MAX_CUTOFF_HZ)
}

/** The process loop's slide: the share of the interval still to go, `seconds` after the key. A hundredth is left after the Slide time. */
export function acidSlideLeft(seconds: number, slide: number): number {
  return Math.exp((-ACID_SLIDE_ARRIVAL * seconds) / slide)
}

/** `AcidBass::set_resonance`: the loop's feedback, how far the stages are tuned down so the peak stays on Cutoff, and the pass band's level given back. */
export function acidResonance(resonance: number): {
  feedback: number
  stageRatio: number
  passband: number
} {
  const feedback = ACID_MAX_FEEDBACK * clamp(resonance, 0, 1)
  const peak = Math.sqrt(2 * feedback) - 1
  return {
    feedback,
    stageRatio: peak > 0 ? Math.min(ACID_OPEN_RATIO, 1 / Math.sqrt(peak)) : ACID_OPEN_RATIO,
    passband: 1 + ACID_BASS_KEPT * feedback,
  }
}

/**
 * `ThreePole`, with the pass band given back as `AcidBass::process` gives it:
 * how much of a frequency comes through the three stages and the loop around
 * them, as a gain. Each stage is 1 / (1 + j u) with u the frequency over the
 * stages' corner, and the loop makes that 1 / ((1 + j u)³ + feedback). `loop`
 * is what the saturator in the loop passes (`acidLoopGain`): it scales what
 * goes round and what comes out. At 1 this is the filter as a faint sound
 * finds it, which is all that Cutoff and Resonance set by themselves; a note
 * holds its own peak under that, by 15 dB at the top of Resonance when the
 * peak stands on one of its lowest harmonics.
 */
export function acidFilterGain(hz: number, cutoffHz: number, resonance: number, loop = 1): number {
  const { feedback, stageRatio, passband } = acidResonance(resonance)
  const u = hz / (Math.min(cutoffHz, ACID_MAX_CUTOFF_HZ) * stageRatio)
  const re = 1 - 3 * u * u + feedback * loop
  const im = u * (3 - u * u)
  return (loop * passband) / Math.sqrt(re * re + im * im)
}

/** `kit::fast_tanh`, the saturator `ThreePole::process` puts where the feedback meets the input: a rational tanh, flat from 3 on. */
export function acidLoopCurve(x: number): number {
  const held = clamp(x, -3, 3)
  return (held * (27 + held * held)) / (27 + 9 * held * held)
}

/** `AcidBass::saturate`: Drive's curve, a straight line through zero that bends into a square root. */
export const acidSaturate = (x: number): number => x / Math.sqrt(Math.sqrt(1 + x * x))

/** `AcidBass::made_up`: what a signal at the nominal level loses to the curve at gain `pre`. */
const acidMadeUp = (pre: number): number => {
  const driven = pre * ACID_DRIVE_NOMINAL
  return Math.sqrt(Math.sqrt(1 + driven * driven))
}

/** `AcidBass::set_drive`: the gain into the saturator and what comes back off after it. The control d acts as d(2 − d), so its lower half is heard. */
export function acidDrive(drive: number): { pre: number; post: number } {
  const d = clamp(drive, 0, 1)
  const travel = d * (2 - d)
  const pre = ACID_DRIVE_FLOOR * Math.pow(10, (travel * ACID_MAX_DRIVE_DB) / 20)
  return { pre, post: (ACID_OUT_GAIN * acidMadeUp(pre)) / (acidMadeUp(ACID_DRIVE_FLOOR) * pre) }
}

// --- What goes out: the harmonics through the filter and Drive -------------------

/** The samples one cycle is kept in, and the harmonics read off it. */
const ACID_CYCLE = 512
export const ACID_PARTIALS = 128
/** The cosine at each point around the circle; the sine is the same three quarters of a turn on. */
const ACID_TURN = Float64Array.from({ length: ACID_CYCLE }, (_, i) =>
  Math.cos((2 * Math.PI * i) / ACID_CYCLE),
)
const acidRe = new Float64Array(ACID_CYCLE)
const acidIm = new Float64Array(ACID_CYCLE)

/** The two parts of every harmonic of the cycle in `re` and `im`, by halves; they hold them afterwards. */
function acidTransform(re: Float64Array, im: Float64Array): void {
  const n = ACID_CYCLE
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      const keepRe = re[i]
      re[i] = re[j]
      re[j] = keepRe
      const keepIm = im[i]
      im[i] = im[j]
      im[j] = keepIm
    }
  }
  for (let size = 2; size <= n; size *= 2) {
    const stride = n / size
    for (let k = 0; k < size / 2; k++) {
      const cos = ACID_TURN[k * stride]
      const sin = ACID_TURN[(k * stride + (3 * n) / 4) % n]
      for (let a = k; a < n; a += size) {
        const b = a + size / 2
        const turnedRe = re[b] * cos + im[b] * sin
        const turnedIm = im[b] * cos - re[b] * sin
        re[b] = re[a] - turnedRe
        im[b] = im[a] - turnedIm
        re[a] += turnedRe
        im[a] += turnedIm
      }
    }
  }
}

/** `WaveOsc::next` and the gains `AcidBass::process` gives it: harmonic `n` of the oscillator, every one of a sawtooth or the odd ones of a square at 0.55 of it. */
function acidMade(square: boolean, n: number): number {
  if (!square) return (-ACID_OSC_GAIN * 2) / (Math.PI * n)
  return n % 2 === 0 ? 0 : (ACID_OSC_GAIN * ACID_SQUARE_LEVEL * 4) / (Math.PI * n)
}

/** How many harmonics of a note at `hz` are worked out: the ones under 20 kHz. */
const acidMost = (hz: number): number =>
  clamp(Math.floor(20000 / Math.max(hz, 1)), 1, ACID_PARTIALS)

/**
 * How much the saturator passes of the wave that stands at it, as one gain,
 * if what it passes is taken to be `loop`. The wave is the note's harmonics,
 * each (1 + j u)³ / ((1 + j u)³ + feedback · loop) of what the oscillator
 * makes: the input less what the loop brings back.
 */
function acidLoopPassed(
  square: boolean,
  hz: number,
  corner: number,
  feedback: number,
  most: number,
  loop: number,
): number {
  acidRe.fill(0)
  acidIm.fill(0)
  for (let n = 1; n <= most; n++) {
    const made = acidMade(square, n)
    if (made === 0) continue
    const u = (n * hz) / corner
    const re = 1 - 3 * u * u
    const im = u * (3 - u * u)
    const back = feedback * loop
    const under = (re + back) * (re + back) + im * im
    acidRe[n] = (made * im * back) / under / 2
    acidIm[n] = (made * (re * (re + back) + im * im)) / under / 2
    acidRe[ACID_CYCLE - n] = acidRe[n]
    acidIm[ACID_CYCLE - n] = -acidIm[n]
  }
  acidTransform(acidRe, acidIm)
  let passed = 0
  let stood = 0
  for (let i = 0; i < ACID_CYCLE; i++) {
    passed += acidRe[i] * acidLoopCurve(acidRe[i])
    stood += acidRe[i] * acidRe[i]
  }
  return stood > 0 ? passed / stood : 1
}

/** The halvings the loop's gain is found by: to a thousandth. */
const ACID_LOOP_STEPS = 8

/**
 * `ThreePole::process`: the saturator where the feedback meets the input, as
 * the one gain a note at `hz` leaves it with. A tall peak makes a large wave
 * there, the saturator passes less of it, and less goes round the loop, which
 * lowers the peak: the gain is the one at which the saturator passes just
 * that share of the wave it makes. The loop is not straight, so this is a
 * fit, held to the built device in the test: the harmonics that stand clear
 * of the picture's foot come within 3 dB up to a Resonance of 0.9 and within
 * 7 dB at its top, where without it a peak on a low harmonic read 15 dB too
 * high and Drive was fed a wave the device never makes.
 */
export function acidLoopGain(
  wave: number,
  hz: number,
  cutoffHz: number,
  resonance: number,
): number {
  const { feedback, stageRatio } = acidResonance(resonance)
  const corner = Math.min(cutoffHz, ACID_MAX_CUTOFF_HZ) * stageRatio
  const square = wave >= 0.5
  const most = acidMost(hz)
  // Less passed is less feedback and a smaller wave, of which more is passed: the gain lies
  // between what a straight loop's wave would have passed and 1.
  let low = acidLoopPassed(square, hz, corner, feedback, most, 1)
  let high = 1
  for (let step = 0; step < ACID_LOOP_STEPS && high - low > 1e-3; step++) {
    const middle = (low + high) / 2
    if (acidLoopPassed(square, hz, corner, feedback, most, middle) > middle) low = middle
    else high = middle
  }
  return (low + high) / 2
}

/**
 * `AcidBass::process`, from the oscillator to Drive: how strong each harmonic
 * of a note at `hz` leaves Drive, written into `partials` (1 is a sine at full
 * scale, before the loudness envelope and Volume); how many were worked out
 * comes back. `WaveOsc::next` makes a sawtooth with every harmonic, or a
 * square with the odd ones at 0.55 of it; each goes through the filter where
 * it stands (`acidFilterGain`, with the turn the filter gives it and the
 * loop's saturator as this note leaves it, `loop`), the cycle they add up to
 * goes through Drive's curve at the gain the control stands for, and the
 * harmonics are read off what comes out.
 */
export function acidPartials(
  wave: number,
  hz: number,
  cutoffHz: number,
  resonance: number,
  drive: number,
  partials: Float32Array,
  loop = acidLoopGain(wave, hz, cutoffHz, resonance),
): number {
  const { feedback, stageRatio, passband } = acidResonance(resonance)
  const { pre, post } = acidDrive(drive)
  const corner = Math.min(cutoffHz, ACID_MAX_CUTOFF_HZ) * stageRatio
  const square = wave >= 0.5
  const most = acidMost(hz)
  acidRe.fill(0)
  acidIm.fill(0)
  for (let n = 1; n <= most; n++) {
    const made = acidMade(square, n)
    if (made === 0) continue
    const u = (n * hz) / corner
    const re = 1 - 3 * u * u + feedback * loop
    const im = u * (3 - u * u)
    const through = (made * loop * pre * passband) / (re * re + im * im)
    // A sine through the filter is a sine and a cosine: half of each on either side of the circle.
    acidRe[n] = (-through * im) / 2
    acidIm[n] = (through * re) / 2
    acidRe[ACID_CYCLE - n] = acidRe[n]
    acidIm[ACID_CYCLE - n] = -acidIm[n]
  }
  acidTransform(acidRe, acidIm)
  for (let i = 0; i < ACID_CYCLE; i++) {
    acidRe[i] = acidSaturate(acidRe[i])
    acidIm[i] = 0
  }
  acidTransform(acidRe, acidIm)
  partials.fill(0)
  for (let n = 1; n <= most; n++)
    partials[n] = (post * 2 * Math.hypot(acidRe[n], acidIm[n])) / ACID_CYCLE
  return most
}

// --- The one voice, played through again ---------------------------------------

/** What the keys' replay reads of the knobs. */
export interface AcidSetting {
  cutoff: number
  envMod: number
  decay: number
  accent: number
  slide: number
  sustain: number
}

interface AcidKey {
  id: number
  /** log2 of its frequency. */
  pitch: number
  level: number
  accent: number
}

/** `AcidBass`'s own state, as far as the line shows it. */
export interface AcidVoice {
  /** Seconds, on the clock the keys are timed by. */
  time: number
  /** The stack of held keys: the newest, at `held - 1`, plays. */
  keys: AcidKey[]
  held: number
  /** The loudness envelope, and whether a strike or a tied key is bringing it up. */
  amp: number
  striking: boolean
  rising: boolean
  /** The filter envelope, and whether a strike is bringing it up. */
  opening: number
  opens: boolean
  /** The struck key's accent, and the store accents fill. */
  accent: number
  store: number
  /** The pitch, where it slides to, and whether it is on its way (log2 of Hz). */
  pitch: number
  target: number
  sliding: boolean
  /** The playing key's level and what it is coming to. */
  level: number
  levelTarget: number
  /** When the last key struck out of silence. */
  struckSilent: number
}

export const acidVoice = (): AcidVoice => ({
  time: 0,
  keys: Array.from({ length: ACID_MAX_HELD }, () => ({ id: -1, pitch: 0, level: 0, accent: 0 })),
  held: 0,
  amp: 0,
  striking: false,
  rising: false,
  opening: 0,
  opens: false,
  accent: 0,
  store: 0,
  pitch: Math.log2(ACID_REST_HZ),
  target: Math.log2(ACID_REST_HZ),
  sliding: false,
  level: 0,
  levelTarget: 0,
  struckSilent: -Infinity,
})

/** `AcidBass::init`: the voice before any key, at `time`. */
export function acidRest(voice: AcidVoice, time = 0): AcidVoice {
  voice.time = time
  voice.held = 0
  voice.amp = 0
  voice.striking = false
  voice.rising = false
  voice.opening = 0
  voice.opens = false
  voice.accent = 0
  voice.store = 0
  voice.pitch = Math.log2(ACID_REST_HZ)
  voice.target = voice.pitch
  voice.sliding = false
  voice.level = 0
  voice.levelTarget = 0
  voice.struckSilent = -Infinity
  return voice
}

/** What a key did to the voice. */
export const ACID_NOTHING = 0
export const ACID_STRIKE = 1
export const ACID_SLIDE = 2
export const ACID_LET_GO = 3

/** `AcidBass::drop`: a key leaves the stack; the ones over it move down. */
function acidDrop(voice: AcidVoice, index: number): void {
  const key = voice.keys[index]
  for (let i = index; i + 1 < voice.held; i++) voice.keys[i] = voice.keys[i + 1]
  voice.held -= 1
  voice.keys[voice.held] = key
}

function acidFind(voice: AcidVoice, id: number): number {
  for (let i = 0; i < voice.held; i++) if (voice.keys[i].id === id) return i
  return -1
}

/**
 * `AcidBass::note_on`. A key with none held strikes both envelopes and starts
 * on pitch. A key over a sounding one slides to its pitch and brings the
 * loudness back to full; the filter envelope and the accent are left alone.
 * Over silence there is nothing to slide from, and it strikes. The device
 * hears nothing between two keys of one block of sound, so a key within
 * `together` seconds of a strike out of silence finds that silence too.
 */
export function acidKeyDown(
  voice: AcidVoice,
  id: number,
  frequency: number,
  gain: number,
  setting: Pick<AcidSetting, 'accent'>,
  together = 0,
): number {
  if (!(frequency === frequency)) return ACID_NOTHING
  const hard = gain === gain ? clamp(gain, 0, 1) : 0.5
  const again = acidFind(voice, id)
  if (again >= 0) acidDrop(voice, again)
  const overlapping = voice.held > 0
  // A full stack forgets its oldest key.
  if (voice.held === ACID_MAX_HELD) acidDrop(voice, 0)
  const key = voice.keys[voice.held++]
  key.id = id
  key.pitch = Math.log2(clamp(frequency, ACID_KEY_LOW_HZ, ACID_KEY_HIGH_HZ))
  key.accent = acidAccent(hard, setting.accent)
  key.level = acidKeyLevel(hard, key.accent)

  const silent = voice.amp === 0 || voice.time - voice.struckSilent < together
  if (overlapping && !silent) {
    voice.target = key.pitch
    voice.sliding = key.pitch !== voice.pitch
    voice.levelTarget = key.level
    voice.rising = !voice.striking
    return ACID_SLIDE
  }
  if (silent) {
    // `AcidBass::restart`: every hit from rest is the same hit. Only the store carries over.
    voice.amp = 0
    voice.opening = 0
    voice.level = key.level
    voice.struckSilent = voice.time
  }
  voice.levelTarget = key.level
  voice.pitch = key.pitch
  voice.target = key.pitch
  voice.sliding = false
  voice.accent = key.accent
  voice.striking = true
  voice.rising = false
  voice.opens = true
  return ACID_STRIKE
}

/** `AcidBass::note_off`: letting the playing key go slides back to the one under it and strikes nothing; with none left the loudness is let go. */
export function acidKeyUp(voice: AcidVoice, id: number): number {
  const index = acidFind(voice, id)
  if (index < 0) return ACID_NOTHING
  const playing = index === voice.held - 1
  acidDrop(voice, index)
  if (voice.held === 0) return ACID_LET_GO
  if (!playing) return ACID_NOTHING
  const key = voice.keys[voice.held - 1]
  if (voice.amp > 0) {
    voice.target = key.pitch
    voice.sliding = key.pitch !== voice.pitch
    voice.levelTarget = key.level
    return ACID_SLIDE
  }
  voice.pitch = key.pitch
  voice.target = key.pitch
  voice.sliding = false
  voice.level = key.level
  voice.levelTarget = key.level
  return ACID_NOTHING
}

/** The store is worked out in steps this long while it moves: a seventy-fifth of the time it fills in. */
const ACID_STORE_STEP = 0.002

/**
 * `AcidBass::process` with no key in it, for `seconds`: the two envelopes,
 * the store, the slide and the key's level each move on as the header moves
 * them sample by sample.
 */
export function acidAdvance(
  voice: AcidVoice,
  seconds: number,
  setting: Pick<AcidSetting, 'decay' | 'slide' | 'sustain'>,
): void {
  if (!(seconds > 0)) return
  voice.time += seconds

  // The loudness: a strike is finished whatever the keys do, then it falls over Sustain under a
  // held key (after a tied key's rise) or is let go.
  let left = seconds
  if (voice.striking) {
    const need = acidRiseSeconds(voice.amp, ACID_STRIKE_SEC)
    if (left < need) {
      voice.amp = acidRise(voice.amp, left, ACID_STRIKE_SEC)
      left = 0
    } else {
      voice.amp = 1
      voice.striking = false
      left -= need
    }
  }
  if (left > 0 && voice.held === 0) {
    voice.rising = false
    voice.amp *= Math.exp(-left / ACID_RELEASE_TAU)
  } else if (left > 0 && voice.amp > 0) {
    if (voice.rising) {
      const need = acidRiseSeconds(voice.amp, ACID_TIE_SEC)
      if (left < need) {
        voice.amp = acidRise(voice.amp, left, ACID_TIE_SEC)
        left = 0
      } else {
        voice.amp = 1
        voice.rising = false
        left -= need
      }
    }
    if (left > 0) voice.amp *= acidHeldFall(left, setting.sustain)
  }
  if (!voice.striking && voice.amp < ACID_SILENT) voice.amp = 0

  // The filter envelope falls key held or not, and an accented one fills the store.
  left = seconds
  while (left > 0) {
    const moves =
      voice.store > 0 || voice.accent * (voice.opens ? 1 : voice.opening) >= ACID_STORE_EMPTY
    const step = moves ? Math.min(left, ACID_STORE_STEP) : left
    const before = voice.opening
    let falls = step
    if (voice.opens) {
      const need = acidRiseSeconds(voice.opening, ACID_STRIKE_SEC)
      if (falls < need) {
        voice.opening = acidRise(voice.opening, falls, ACID_STRIKE_SEC)
        falls = 0
      } else {
        voice.opening = 1
        voice.opens = false
        falls -= need
      }
    }
    if (falls > 0 && voice.opening > 0) {
      voice.opening *= acidFilterFall(falls, setting.decay, voice.accent)
      if (voice.opening < ACID_SILENT) voice.opening = 0
    }
    // Over a step this short the envelope has hardly moved: the store is fed its middle.
    if (moves)
      voice.store = acidStore(voice.store, (voice.accent * (before + voice.opening)) / 2, step)
    left -= step
  }

  if (voice.sliding) {
    const togo = (voice.target - voice.pitch) * acidSlideLeft(seconds, setting.slide)
    if (Math.abs(togo) < ACID_ARRIVED) {
      voice.pitch = voice.target
      voice.sliding = false
    } else {
      voice.pitch = voice.target - togo
    }
  }
  voice.level =
    voice.levelTarget + (voice.level - voice.levelTarget) * Math.exp(-seconds / ACID_SMOOTH_SEC)
}

/** A key down or a key up of the notes, at its time. */
interface AcidEvent {
  at: number
  down: boolean
  index: number
}

/** In the order they came. Of two at one instant the older note's comes first: a key let go as the next is pressed did not overlap it. */
const acidInOrder = (a: AcidEvent, b: AcidEvent): number =>
  a.at - b.at || a.index - b.index || Number(b.down) - Number(a.down)

/** Every key down and key up of `notes`, in order, written into `into`, which is kept between frames; the count comes back. */
function acidEvents(notes: readonly DisplayNote[], into: AcidEvent[]): number {
  let count = 0
  for (let index = 0; index < notes.length; index++) {
    const note = notes[index]
    for (let up = 0; up < (note.released === null ? 1 : 2); up++) {
      if (count === into.length) into.push({ at: 0, down: false, index: 0 })
      const event = into[count++]
      event.at = up === 0 ? -note.age : -(note.released ?? 0)
      event.down = up === 0
      event.index = index
    }
  }
  // The ones left over from a fuller frame go to the end.
  for (let i = count; i < into.length; i++) into[i].at = Infinity
  into.sort(acidInOrder)
  return count
}

/** The seconds the line shows, now at its right end. */
export const ACID_WINDOW_SEC = 6
/** Under this share of its light a note is done: 59 dB under a full one. */
const ACID_DONE = 0.02
/** How long after the last key went up a point is set: the loudness is 40 dB down by then. */
const ACID_LET_GO_SEC = 0.016
/** The points and the marks a line has room for, and the columns it is read at. */
const ACID_POINTS = 2048
const ACID_MARKS = 256
const ACID_COLUMNS_MOST = 1024

/** How much of its light a level has: 1 for a full note, 0 from 59 dB under it. An accent stands a little over 1. */
export function acidShare(loud: number): number {
  const share = 1 + gainToDb(loud) / 60
  return share < ACID_DONE ? 0 : Math.min(share, 1.1)
}

/** The line of notes: the voice read at every column of the picture and around every key. */
export interface AcidLine {
  voice: AcidVoice
  events: AcidEvent[]
  /** The points, oldest first: when (seconds, now is 0), where the filter stands (Hz), the pitch (log2 of Hz), the level, and whether a struck note begins there. */
  count: number
  at: Float32Array
  cut: Float32Array
  pitch: Float32Array
  loud: Float32Array
  struck: Uint8Array
  /** The keys that struck, and the ones pressed over a held key: when, the pitch they went to, the strike's accent, the key's own level, and the first point after them. */
  marks: number
  markKind: Uint8Array
  markAt: Float32Array
  markTo: Float32Array
  markAccent: Float32Array
  markLevel: Float32Array
  markPoint: Int16Array
}

export const acidLine = (): AcidLine => ({
  voice: acidVoice(),
  events: [],
  count: 0,
  at: new Float32Array(ACID_POINTS),
  cut: new Float32Array(ACID_POINTS),
  pitch: new Float32Array(ACID_POINTS),
  loud: new Float32Array(ACID_POINTS),
  struck: new Uint8Array(ACID_POINTS),
  marks: 0,
  markKind: new Uint8Array(ACID_MARKS),
  markAt: new Float32Array(ACID_MARKS),
  markTo: new Float32Array(ACID_MARKS),
  markAccent: new Float32Array(ACID_MARKS),
  markLevel: new Float32Array(ACID_MARKS),
  markPoint: new Int16Array(ACID_MARKS),
})

function acidPoint(line: AcidLine, setting: AcidSetting, struck: boolean): void {
  if (line.count === ACID_POINTS) return
  const { voice } = line
  const i = line.count++
  line.at[i] = voice.time
  line.cut[i] = acidCutoffHz(
    setting.cutoff,
    setting.envMod,
    voice.accent,
    voice.opening,
    voice.store,
  )
  line.pitch[i] = voice.pitch
  line.loud[i] = voice.amp * voice.level
  line.struck[i] = struck ? 1 : 0
}

/**
 * `AcidBass::note_on`, `note_off` and `process` played through again: the
 * voice as `notes` leave it, read at `columns` moments across the last
 * `ACID_WINDOW_SEC` seconds and just before and after every key in them, so
 * that a strike of 2 ms stands in the line however far apart the columns
 * are. The keys before those seconds are played too: the store, the filter
 * envelope and the held keys they left are what the first of the line finds.
 * The knobs are read as they stand now.
 */
export function acidPlay(
  notes: readonly DisplayNote[],
  setting: AcidSetting,
  columns: number,
  together: number,
  line: AcidLine,
): AcidLine {
  const { voice, events } = line
  const count = acidEvents(notes, events)
  const cols = clamp(Math.round(columns), 1, ACID_COLUMNS_MOST)
  acidRest(voice, count > 0 ? Math.min(events[0].at, -ACID_WINDOW_SEC) : -ACID_WINDOW_SEC)
  line.count = 0
  line.marks = 0
  let e = 0
  let c = 0
  while (e < count || c <= cols) {
    const key = e < count ? events[e].at : Infinity
    const column = c <= cols ? -ACID_WINDOW_SEC * (1 - c / cols) : Infinity
    if (column < key) {
      if (column > voice.time || line.count === 0) {
        acidAdvance(voice, column - voice.time, setting)
        voice.time = column
        acidPoint(line, setting, false)
      }
      c++
      continue
    }
    acidAdvance(voice, key - voice.time, setting)
    voice.time = key
    const event = events[e++]
    const note = notes[event.index]
    const seen = key >= -ACID_WINDOW_SEC
    if (seen) acidPoint(line, setting, false)
    const what = event.down
      ? acidKeyDown(voice, note.id, note.frequency, note.gain, setting, together)
      : acidKeyUp(voice, note.id)
    if (!seen || what === ACID_NOTHING) continue
    // What a key does at once (a strike, a tied key's rise, the loudness let go) is over before
    // the next column: a point where it ends, or at the next key if that comes first.
    const quick =
      what === ACID_STRIKE ? ACID_STRIKE_SEC : what === ACID_SLIDE ? ACID_TIE_SEC : ACID_LET_GO_SEC
    const until = Math.min(key + quick, e < count ? events[e].at : 0, 0)
    acidAdvance(voice, until - voice.time, setting)
    voice.time = until
    acidPoint(line, setting, what === ACID_STRIKE)
    // A mark for a key that struck and for one pressed over a held one. A key let go strikes
    // nothing, wherever the pitch goes then.
    if (what === ACID_LET_GO || !event.down) continue
    // Keys of one instant are one mark: the last of them is the one that plays.
    const last = line.marks - 1
    const joins = last >= 0 && line.markKind[last] === what && key - line.markAt[last] <= together
    if (!joins && line.marks === ACID_MARKS) continue
    const m = joins ? last : line.marks++
    if (!joins) {
      line.markKind[m] = what
      line.markAt[m] = key
    }
    line.markTo[m] = voice.target
    line.markAccent[m] = what === ACID_STRIKE ? voice.accent : 0
    // `note_on` gives every key its own level, a tied one too: that is what its loudness comes to.
    line.markLevel[m] = voice.levelTarget
    line.markPoint[m] = line.count - 1
  }
  return line
}

/** Whether anything in the line can be seen to sound. */
export function acidSounded(line: AcidLine): boolean {
  for (let i = 0; i < line.count; i++) if (acidShare(line.loud[i]) > 0) return true
  return false
}

/**
 * The figure the line shows while nothing is played: the instrument's four
 * rules, one after another, on its own rest pitch. A plain note; three
 * accents close together, each finding the store fuller; and a held note with
 * a key an octave up pressed over it and let go again, which slides there and
 * back without striking the filter.
 */
const ACID_FIGURE: readonly DisplayNote[] = [
  { id: 1, frequency: ACID_REST_HZ, gain: 0.7, age: 5.75, released: 4.85 },
  { id: 2, frequency: ACID_REST_HZ, gain: 1, age: 4.5, released: 4.3 },
  { id: 3, frequency: ACID_REST_HZ, gain: 1, age: 4.15, released: 3.95 },
  { id: 4, frequency: ACID_REST_HZ, gain: 1, age: 3.8, released: 3.6 },
  { id: 5, frequency: ACID_REST_HZ, gain: 0.7, age: 3, released: 0.25 },
  { id: 6, frequency: 2 * ACID_REST_HZ, gain: 0.7, age: 2.1, released: 1.15 },
]

// --- The picture ---------------------------------------------------------------

/** The pitches the line stands between: under the lowest bass string, and where the filter stops. */
const ACID_LOW_HZ = 30
const ACID_HIGH_HZ = ACID_MAX_CUTOFF_HZ
/** The frames the engine hands the device at a time. */
const ACID_BLOCK_FRAMES = 128
/** The levels the harmonics are drawn between, in dB against a sine at full scale: the filter's peak at the top of Resonance is 20 dB and must stand inside. */
const ACID_TOP_DB = 21
const ACID_BOTTOM_DB = -51
/** Where a harmonic as strong as a sawtooth's first leaves the device with the filter and Drive taking nothing: the filter's curve is drawn from there. */
const ACID_FIRST_DB = gainToDb(((ACID_OSC_GAIN * 2) / Math.PI) * ACID_OUT_GAIN)
/** The pitches a scale line stands at. */
const ACID_DECADES_HZ = [100, 1000, 10000] as const

interface AcidParts {
  /** The line of notes: time across, pitch upward. */
  roll: Box
  /** What goes out now, on the roll's scale of pitch: level to the right. */
  profile: Box
  /** The line of words over them. */
  words: Box
  foot: Box
}

function acidParts(view: Size): AcidParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const side = clamp(Math.round(view.width * 0.14), 22, 30)
  const top = all.y + 12
  const high = all.h - 12 - 8
  const roll: Box = { x: all.x + 1, y: top, w: all.w - 2 - side - 3, h: high }
  return {
    roll,
    profile: { x: roll.x + roll.w + 3, y: top, w: side, h: high },
    words: { x: all.x, y: all.y, w: all.w, h: 9 },
    foot: { x: all.x, y: all.y + all.h - 5, w: all.w, h: 5 },
  }
}

const ACID_OCTAVES = Math.log(ACID_HIGH_HZ / ACID_LOW_HZ)
const acidY = (hz: number, box: Box): number =>
  box.y + box.h - clamp(Math.log(Math.max(hz, 1) / ACID_LOW_HZ) / ACID_OCTAVES, 0, 1) * box.h
const acidHzOfY = (y: number, box: Box): number =>
  ACID_LOW_HZ * Math.exp(ACID_OCTAVES * clamp((box.y + box.h - y) / box.h, 0, 1))
/** Where a moment stands across the roll: `at` seconds, now being 0 at its right end. */
const acidX = (at: number, box: Box): number => box.x + box.w * (1 + at / ACID_WINDOW_SEC)
const acidDbX = (db: number, box: Box): number =>
  box.x + clamp((db - ACID_BOTTOM_DB) / (ACID_TOP_DB - ACID_BOTTOM_DB), 0, 1) * box.w
/** The filter's curve at one pitch, as a place across the profile. */
const acidCurveX = (hz: number, cutoffHz: number, resonance: number, box: Box, loop = 1): number =>
  acidDbX(ACID_FIRST_DB + gainToDb(acidFilterGain(hz, cutoffHz, resonance, loop)), box)

/** Half the thickness of a note's band, from its share of the light. */
const acidHalf = (share: number): number => (share > 0 ? 0.4 + 1.8 * share : 0)
/**
 * On a narrow roll the notes are written smaller, bands, heads and wedges
 * alike: keys a third of a second apart are 5 px apart at 128 wide, and at
 * full size their heads would run into each other.
 */
const acidNarrow = (roll: Box): number => clamp(roll.w / 160, 0.68, 1)

interface AcidState {
  line: AcidLine
  setting: AcidSetting
  /** The harmonics that go out now, and the ones a note at rest would have, with the knobs they were worked out for. */
  partials: Float32Array
  rest: Float32Array
  restFor: Float64Array
}

/** The filter's edge along the line from point `from` on, as a path. */
function acidEdge(ctx: CanvasRenderingContext2D, line: AcidLine, roll: Box, from: number): void {
  ctx.beginPath()
  for (let i = from; i < line.count; i++) {
    const x = acidX(line.at[i], roll)
    const y = acidY(line.cut[i], roll)
    if (i === from) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
}

/**
 * The notes of the line. Each struck note with the keys tied to it is one
 * band along its pitch, as thick as it is loud, and under the filter's edge
 * the ground is shaded for as long as it sounds. The one that still sounds is
 * in the accent; the ones that are over stand back in the ink. The point the
 * sounding note begins at comes back, or the line's length when none sounds.
 */
function acidBands(
  frame: DisplayFrame<AcidState>,
  roll: Box,
  played: boolean,
  live: boolean,
): number {
  const { ctx, colours } = frame
  const line = frame.state.line
  const floor = roll.y + roll.h
  const narrow = acidNarrow(roll)
  let sounding = line.count
  let from = 0
  for (let i = 1; i <= line.count; i++) {
    if (i < line.count && !line.struck[i]) continue
    let first = -1
    let last = -1
    for (let j = from; j < i; j++) {
      if (acidShare(line.loud[j]) <= 0) continue
      if (first < 0) first = j
      last = j
    }
    const lit = live && i === line.count
    if (lit) sounding = from
    if (first >= 0) {
      // One point further, where it has gone out, so the band closes on its own pitch.
      const end = Math.min(last + 1, i - 1)
      ctx.fillStyle = colours.ink
      ctx.beginPath()
      ctx.moveTo(acidX(line.at[first], roll), floor)
      for (let j = first; j <= end; j++)
        ctx.lineTo(acidX(line.at[j], roll), acidY(line.cut[j], roll))
      ctx.lineTo(acidX(line.at[end], roll), floor)
      ctx.closePath()
      ctx.globalAlpha = lit || !played ? 0.13 : 0.07
      ctx.fill()
      ctx.fillStyle = lit ? colours.accent : colours.ink
      ctx.beginPath()
      for (let j = first; j <= end; j++) {
        const x = acidX(line.at[j], roll)
        const y =
          acidY(Math.pow(2, line.pitch[j]), roll) - narrow * acidHalf(acidShare(line.loud[j]))
        if (j === first) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      for (let j = end; j >= first; j--)
        ctx.lineTo(
          acidX(line.at[j], roll),
          acidY(Math.pow(2, line.pitch[j]), roll) + narrow * acidHalf(acidShare(line.loud[j])),
        )
      ctx.closePath()
      ctx.globalAlpha = lit || !played ? 1 : INK.back
      ctx.fill()
    }
    from = i
  }
  ctx.globalAlpha = 1
  return sounding
}

/**
 * A head's radius from the level `note_on` gives its key (`acidKeyLevel`):
 * 3 px at a gain of 0.7, 2.4 for the softest key, 3.9 for a full accent. The
 * band is thick over 60 dB, on which a key's own 14 dB cannot be seen.
 */
export const acidHead = (level: number): number => 2.05 + 1.2 * clamp(level, 0, 1.6)

/**
 * What the keys did, written on the line as music is: a head on a struck
 * note, a wedge over an accent's fin, as large as the accent, and an open
 * head where a key was pressed over a held one, at the pitch the band then
 * slides to. A head is as large as its key was played hard. That is all a
 * hard key tied over a held one shows of its accent, as it is all the device
 * gives it: the loudness, with no wedge because the filter is not struck.
 */
function acidMarks(
  frame: DisplayFrame<AcidState>,
  roll: Box,
  played: boolean,
  sounding: number,
): void {
  const { ctx, colours } = frame
  const line = frame.state.line
  const narrow = acidNarrow(roll)
  for (let m = 0; m < line.marks; m++) {
    const point = line.markPoint[m]
    const lit = point >= sounding
    const colour = lit ? colours.accent : colours.ink
    const alpha = lit || !played ? 1 : INK.back
    const x = acidX(line.markAt[m], roll)
    const y = acidY(Math.pow(2, line.markTo[m]), roll)
    const head = acidHead(line.markLevel[m]) * narrow
    if (line.markKind[m] !== ACID_STRIKE) {
      dot(ctx, x, y, head - 0.5, colours.plate)
      ctx.globalAlpha = alpha
      ctx.strokeStyle = colour
      ctx.lineWidth = 1.25
      ctx.stroke()
      ctx.globalAlpha = 1
      continue
    }
    const accent = line.markAccent[m]
    dot(ctx, x, y, head, colour, { alpha })
    if (accent <= 0) continue
    const size = (1.6 + 2.2 * accent) * narrow
    // Over the fin's tip; where the fin reaches the top of the picture, beside it, before the strike.
    const above = acidY(line.cut[point], roll) - size - 2.5
    const least = roll.y + size + 1
    const over = Math.max(least, above)
    const middle = above < least ? x - size - 2 : x
    ctx.beginPath()
    ctx.moveTo(middle - size, over - size * 0.8)
    ctx.lineTo(middle + size, over)
    ctx.lineTo(middle - size, over + size * 0.8)
    ctx.globalAlpha = alpha
    ctx.strokeStyle = colour
    ctx.lineWidth = 1.25
    ctx.lineJoin = 'miter'
    ctx.lineCap = 'round'
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/**
 * The filter's curve on its side: level to the right, on the roll's scale of
 * pitch. With `loop` left at 1 it is the curve Cutoff and Resonance set, which
 * the handle stands on; with a note's own (`acidLoopGain`) it is the filter
 * as that note has it, its peak held lower.
 */
function acidCurve(
  ctx: CanvasRenderingContext2D,
  profile: Box,
  cutoffHz: number,
  resonance: number,
  loop = 1,
): void {
  // Near the top of Resonance the peak is narrower than a step of the curve, and a curve that
  // stepped over it would leave the handle standing in the air: it is drawn through its tip,
  // which three stages with this much feedback have at sqrt(sqrt(2 feedback) - 1) of their corner.
  const { feedback, stageRatio } = acidResonance(resonance)
  const over = Math.sqrt(2 * feedback * loop) - 1
  const tip =
    over > 0
      ? acidY(Math.min(cutoffHz, ACID_MAX_CUTOFF_HZ) * stageRatio * Math.sqrt(over), profile)
      : Infinity
  ctx.beginPath()
  let y = profile.y + profile.h
  for (;;) {
    const x = acidCurveX(acidHzOfY(y, profile), cutoffHz, resonance, profile, loop)
    if (y === profile.y + profile.h) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
    // Above here it is under the scale's foot: the curve ends on the edge.
    if (y <= profile.y || x <= profile.x) break
    const next = Math.max(profile.y, y - 1.5)
    y = tip < y && tip > next ? tip : next
  }
}

/** The harmonics of a note at `hz`, each a line at its pitch as long as it is strong, `loud` being the note's own level. */
function acidComb(
  ctx: CanvasRenderingContext2D,
  profile: Box,
  partials: Float32Array,
  most: number,
  hz: number,
  loud: number,
): void {
  ctx.beginPath()
  for (let n = 1; n <= most && n * hz <= ACID_HIGH_HZ; n++) {
    const db = gainToDb(partials[n] * loud)
    if (db <= ACID_BOTTOM_DB) continue
    const y = crisp(acidY(n * hz, profile))
    ctx.moveTo(profile.x, y)
    ctx.lineTo(acidDbX(db, profile), y)
  }
}

const acidBass = plateDisplay<AcidState>({
  place: 'window',
  columns: 2,
  params: ['wave', 'cutoff', 'resonance', 'envMod', 'decay', 'accent', 'slide', 'sustain', 'drive'],
  live: { signal: true, notes: true },
  info: "Six seconds of notes, now at the right (a figure at rest): each a band, thinner as it fades, under the filter's edge. A strike throws the edge up, an accent higher under a wedge; a tied key is an open head the band slides to. Beside it, the harmonics that pass. The ring sets Cutoff and Resonance.",
  init: () => ({
    line: acidLine(),
    setting: { cutoff: 0, envMod: 0, decay: 1, accent: 0, slide: 1, sustain: 1 },
    partials: new Float32Array(ACID_PARTIALS + 1),
    rest: new Float32Array(ACID_PARTIALS + 1),
    restFor: new Float64Array([-1, -1, -1, -1]),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const parts = acidParts(frame)
    const { roll, profile, words } = parts
    const floor = roll.y + roll.h
    const wave = frame.value('wave') >= 0.5 ? 1 : 0
    const resonance = clamp(frame.value('resonance'), 0, 1)
    const drive = clamp(frame.value('drive'), 0, 1)
    const setting = state.setting
    setting.cutoff = frame.value('cutoff')
    setting.envMod = clamp(frame.value('envMod'), 0, 1)
    setting.decay = Math.max(frame.value('decay'), 0.001)
    setting.accent = clamp(frame.value('accent'), 0, 1)
    setting.slide = Math.max(frame.value('slide'), 0.001)
    setting.sustain = Math.max(frame.value('sustain'), 0.001)

    // The ground of the two parts, a line at 100 Hz, 1 kHz and 10 kHz through both, a tick at every second.
    for (const box of [roll, profile]) {
      fillRect(ctx, box, colours.ink, 0.07)
      rule(ctx, box.x, floor, box.x + box.w, floor, { colour: colours.ink, alpha: INK.rule })
    }
    for (const hz of ACID_DECADES_HZ) {
      const y = acidY(hz, roll)
      rule(ctx, roll.x, y, profile.x + profile.w, y, { colour: colours.ink, alpha: INK.grid })
    }
    for (let second = 1; second < ACID_WINDOW_SEC; second++) {
      const x = acidX(-second, roll)
      rule(ctx, x, roll.y, x, roll.y + 3, { colour: colours.ink, alpha: INK.back })
    }

    // The line: what was played in the last six seconds, or the figure while nothing was.
    const line = state.line
    const columns = Math.max(8, Math.round(roll.w))
    let played = false
    if (frame.powered && frame.notes.length > 0) {
      const together = (0.5 * ACID_BLOCK_FRAMES) / frame.sampleRate
      played = acidSounded(acidPlay(frame.notes, setting, columns, together, line))
    }
    if (!played) acidPlay(ACID_FIGURE, setting, columns, 0, line)
    const now = line.count - 1
    const loud = played ? line.loud[now] : 0
    const live = acidShare(loud) > 0
    // The edge is drawn as heavy as the peak on it is high.
    const heavy = 1 + 1.2 * resonance
    clipped(ctx, { x: roll.x, y: roll.y, w: roll.w, h: roll.h + 1 }, () => {
      const sounding = acidBands(frame, roll, played, live)
      acidEdge(ctx, line, roll, 0)
      ctx.globalAlpha = played ? INK.back : INK.text
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = heavy
      ctx.lineJoin = 'round'
      ctx.lineCap = 'butt'
      ctx.stroke()
      if (live) {
        // From the strike's foot on: the point before the first of the sounding note.
        acidEdge(ctx, line, roll, Math.max(0, sounding - 1))
        ctx.globalAlpha = 1
        ctx.strokeStyle = colours.accent
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      acidMarks(frame, roll, played, sounding)
    })
    label(frame, '1 s', acidX(-ACID_WINDOW_SEC, roll) + 3, roll.y + 10)

    // Beside it, where now is: the filter at rest as Cutoff and Resonance set it, on its side, and
    // the harmonics that go out. While a note sounds they are its own, as loud as it is, under the
    // filter where the envelope has it; at rest a full note on the rest pitch. The curve in the ink
    // is the filter by itself, the same for every note, so the handle can stand on it; the lit one
    // is the filter as the sounding note has it, whose peak the loop's saturator holds lower.
    const cutoff = setting.cutoff
    const pitchNow = live ? line.pitch[now] : Math.log2(ACID_REST_HZ)
    const cutNow = live ? line.cut[now] : cutoff
    const hz = Math.pow(2, pitchNow)
    const loop = live ? acidLoopGain(wave, hz, cutNow, resonance) : 1
    clipped(ctx, { x: profile.x, y: profile.y, w: profile.w + 1, h: profile.h + 1 }, () => {
      const made = state.restFor
      if (made[0] !== wave || made[1] !== cutoff || made[2] !== resonance || made[3] !== drive) {
        acidPartials(wave, ACID_REST_HZ, cutoff, resonance, drive, state.rest)
        made[0] = wave
        made[1] = cutoff
        made[2] = resonance
        made[3] = drive
      }
      if (live) {
        const most = acidPartials(wave, hz, cutNow, resonance, drive, state.partials, loop)
        acidComb(ctx, profile, state.partials, most, hz, loud)
      } else {
        acidComb(ctx, profile, state.rest, ACID_PARTIALS, ACID_REST_HZ, 1)
      }
      ctx.globalAlpha = live ? 1 : INK.back
      ctx.strokeStyle = live ? colours.accent : colours.ink
      ctx.lineWidth = 1
      ctx.lineCap = 'butt'
      ctx.stroke()
      acidCurve(ctx, profile, cutoff, resonance)
      ctx.globalAlpha = live ? INK.back : 1
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1.25
      ctx.lineJoin = 'round'
      ctx.stroke()
      if (live) {
        acidCurve(ctx, profile, cutNow, resonance, loop)
        ctx.globalAlpha = 1
        ctx.strokeStyle = colours.accent
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    })
    rule(ctx, profile.x - 1.5, roll.y, profile.x - 1.5, floor, {
      colour: colours.ink,
      alpha: INK.rule,
    })

    levelFoot(frame, parts.foot, outShare(frame))

    // The words: the wave, and the note with where its filter stands.
    const base = words.y + 8
    const shape = wave === 1 ? 'Square' : 'Saw'
    const stands = `${pitchName(hz)} ${hzText(cutNow)}`
    text(frame, shape, words.x, base)
    text(frame, stands, words.x + words.w, base, { align: 'right' })

    // Between them, a slide as Slide sets it, on the roll's own scale of time: the pitch leaves
    // one key for the next and is all but there after the Slide time.
    ctx.font = `8px ${frame.fontFamily}`
    const from = words.x + ctx.measureText(shape).width + 7
    const to = words.x + words.w - ctx.measureText(stands).width - 7
    const perSecond = roll.w / ACID_WINDOW_SEC
    const wide = Math.min(to - from, 5 + 1.25 * perSecond)
    if (wide >= 12) {
      const left = Math.round((from + to - wide) / 2)
      const low = words.y + words.h - 1.5
      const high = words.y + 1.5
      ctx.beginPath()
      ctx.moveTo(left, low)
      ctx.lineTo(left + 4, low)
      for (let x = 0.5; left + 4 + x < left + wide; x += 0.5)
        ctx.lineTo(left + 4 + x, high + (low - high) * acidSlideLeft(x / perSecond, setting.slide))
      ctx.globalAlpha = INK.text
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1.25
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    for (const point of acidHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: acidHandles,
})

function acidHandles(view: DisplayView): DisplayHandle[] {
  const { profile } = acidParts(view)
  const cutoff = view.value('cutoff')
  const resonance = clamp(view.value('resonance'), 0, 1)
  return [
    {
      // The tip of the filter's curve: up and down is Cutoff, out and in is Resonance.
      key: 'filter',
      name: 'Cutoff and Resonance',
      x: acidCurveX(cutoff, cutoff, resonance, profile),
      y: acidY(cutoff, profile),
      drag: (toX, toY) => {
        // The peak grows with Resonance all the way: the one that puts the tip at `toX` is found by halves.
        let low = 0
        let high = 1
        for (let step = 0; step < 24; step++) {
          const middle = (low + high) / 2
          if (acidCurveX(1, 1, middle, profile) < toX) low = middle
          else high = middle
        }
        return { cutoff: acidHzOfY(toY, profile), resonance: (low + high) / 2 }
      },
      reset: () => ({
        cutoff: view.spec('cutoff')?.default ?? 280,
        resonance: view.spec('resonance')?.default ?? 0.7,
      }),
    },
  ]
}

export const ACID_BASS_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  'acid-bass': { display: acidBass, face: ['cutoff', 'resonance', 'envMod', 'decay'] },
}
