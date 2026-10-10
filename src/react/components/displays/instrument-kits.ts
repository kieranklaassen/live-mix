// Displays of the kits: instruments whose twelve keys of the octave are twelve
// sounds, and whose octave tunes the sound.
//
// A kit has no keyboard to draw: every C is the same drum. So each display is
// the twelve sounds side by side in key order, each drawn from the device's own
// figures so that it is told from the others by its shape, and a hit lights
// the sound it struck for as long as the device lets it sound. The drums are
// twelve pads, each a small picture of pitch against time (a drum is a pitch
// that falls and a band of noise that dies); the faults are twelve named lanes
// of level against time (a fault is a pulse, a burst, a run of repeats).
//
// What a kit draws by chance at each hit (Variation, Scatter) the display
// cannot know, so it is drawn as the range it may fall in and never as a value.

import { INK, clamp, fillRect, ground, lerp, rule, text, type Box } from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { keyOfHz, levelFoot, outShare } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>
type Ctx = CanvasRenderingContext2D
type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>

/** Under this share of its light a sound that was struck is done. */
const DONE = 0.02
/** A level as a share of a light: whole at full scale, out at 60 dB under it. */
const shareOfDb = (db: number): number => clamp(1 + db / 60, 0, 1)
const dbOf = (gain: number): number => (gain > 1e-6 ? 20 * Math.log10(gain) : -120)
const smoothstep = (t: number): number => t * t * (3 - 2 * t)

/** The key of the octave a pitch is played on, 0 (C) to 11 (B): which sound of a kit it strikes. */
export const kitKey = (hz: number): number => ((keyOfHz(clamp(hz, 8, 14000)) % 12) + 12) % 12

/**
 * `kit::OctaveKey::semitones` (cpp/kit/keymap.h): how far the octave a key is
 * played in tunes its sound. The octave of middle C is the one a kit is written
 * in; two octaves either way is as far as it reaches, and the cents a key lies
 * off its pitch go into the tuning.
 */
export function kitTuning(hz: number, reach = 2): number {
  const note = 69 + 12 * Math.log2(clamp(hz, 8, 14000) / 440)
  const nearest = Math.floor(note + 0.5)
  const octave = Math.floor(nearest / 12) - 5
  return clamp(octave, -reach, reach) * 12 + (note - nearest)
}

/**
 * A note that is one: the drum kit drops a pitch that is not a number above
 * zero. The glitch kit drops only what is no number at all and would hold the
 * rest to its range, but no key sends such a pitch, so both are read alike.
 */
const struck = (note: DisplayNote): boolean =>
  Number.isFinite(note.frequency) && Number.isFinite(note.gain) && note.frequency > 0

/**
 * The newest note on each key of the octave, as its place in `notes`; -1 for a
 * key that was not struck. A sound struck again starts again: both kits give
 * the older hit 4 ms to fade, which no frame sees.
 */
function newestByKey(notes: readonly DisplayNote[], into: Int32Array): Int32Array {
  into.fill(-1)
  for (let index = 0; index < notes.length; index++)
    if (struck(notes[index])) into[kitKey(notes[index].frequency)] = index
  return into
}

/**
 * Thresholds for a stipple, 16 by 16 and the same every time: a cell is inked
 * where the level there is over its threshold, so a band of noise is drawn as
 * dots that thin out as it dies. Made once from a fixed scramble of the cell's
 * place; nothing in it is drawn by chance.
 */
const STIPPLE = (() => {
  const table = new Float32Array(256)
  for (let i = 0; i < 256; i++) {
    let h = Math.imul(i + 1, 0x9e3779b1)
    h ^= h >>> 15
    h = Math.imul(h, 0x85ebca6b)
    h ^= h >>> 13
    table[i] = ((h >>> 8) & 0xffff) / 0x10000
  }
  return table
})()
const stipple = (column: number, row: number): number => STIPPLE[((row & 15) << 4) | (column & 15)]

/** `kit::Svf` as a response: what a second-order filter of that sharpness leaves at `ratio` times its own frequency. */
function svfGain(kind: 'low' | 'high' | 'band', ratio: number, q: number): number {
  const w2 = ratio * ratio
  const under = Math.sqrt((1 - w2) * (1 - w2) + w2 / (q * q))
  if (under < 1e-9) return q
  return kind === 'low' ? 1 / under : kind === 'high' ? w2 / under : ratio / q / under
}

// --- Drum Kit ----------------------------------------------------------------

/** `drum_kit.h`, `DrumKit::Drum`: the drum on each key of the octave, from C. */
const DRUM_NAMES = [
  'Kick',
  'Sub',
  'Snare',
  'Brush',
  'Rim',
  'Closed hat',
  'Shaker',
  'Open hat',
  'Clap',
  'Low tom',
  'Tick',
  'High tom',
] as const
const KICK = 0
const SUB = 1
const SNARE = 2
const BRUSH = 3
const RIM = 4
const CLOSED_HAT = 5
const SHAKER = 6
const OPEN_HAT = 7
const CLAP = 8
const LOW_TOM = 9
const HIGH_TOM = 11
const DRUMS = 12

/**
 * `drum_kit.h`, `DrumKit::character`: what a Kit choice changes, as factors on
 * the Soft kit. In the header's order: the kick's and sub's pitch, the snare's
 * and toms', the rim's and tick's; how long the tonal drums ring and the noise
 * drums; how slowly the pitch falls and how far; the clicks; the soft attacks;
 * the lower and upper edges of the bands, the sharpness of the upper one; the
 * level of the hats, and of the brush and shaker.
 */
const DRUM_KITS = [
  {
    name: 'Soft',
    low: 1,
    pitch: 1,
    knock: 1,
    tonal: 1,
    noise: 1,
    fallTime: 1,
    fall: 1,
    click: 1,
    attack: 1,
    band: 1,
    edge: 1,
    q: 0.6,
    metal: 1,
    air: 1,
  },
  {
    name: 'Deep',
    low: 0.84,
    pitch: 0.84,
    knock: 0.84,
    tonal: 1.6,
    noise: 1.35,
    fallTime: 1.8,
    fall: 0.8,
    click: 0.55,
    attack: 1.5,
    band: 0.75,
    edge: 0.66,
    q: 0.6,
    metal: 1.2,
    air: 1.2,
  },
  {
    name: 'Tight',
    low: 1.12,
    pitch: 1.12,
    knock: 1.15,
    tonal: 0.6,
    noise: 0.6,
    fallTime: 0.6,
    fall: 1.2,
    click: 1.4,
    attack: 0.5,
    band: 1.12,
    edge: 1.5,
    q: 0.6,
    metal: 0.85,
    air: 0.75,
  },
  {
    name: 'Paper',
    low: 1.9,
    pitch: 1.25,
    knock: 0.8,
    tonal: 0.42,
    noise: 0.42,
    fallTime: 0.7,
    fall: 0.5,
    click: 1.3,
    attack: 0.8,
    band: 0.62,
    edge: 0.5,
    q: 1.4,
    metal: 0.7,
    air: 1.25,
  },
] as const
const drumKit = (kit: number) => DRUM_KITS[clamp(Math.round(kit), 0, DRUM_KITS.length - 1)]

/** `drum_kit.h`: no tonal drum is tuned under this, and no partial goes over this share of the sample rate. */
const DRUM_FLOOR_HZ = 24
const DRUM_TOP_OF_BAND = 0.45
/** `drum_kit.h`, `kChokeSeconds`: an open hat closed by the closed hat or the shaker fades in this long. */
export const DRUM_CHOKE_SEC = 0.008
/** `DrumKit::strike`: the clap's bursts are this far apart and each dies in this long. */
const DRUM_CLAP_GAP_SEC = 0.01
const DRUM_CLAP_BURST_SEC = 0.03
const DRUM_CLAP_BURSTS = 3
/** The gain a kit is balanced at: `DrumKit::strike` calls 0.7 the reference. */
const DRUM_FIRM = 0.7

/** How a filter shapes a drum's noise: `DrumKit::Shaping`. */
type Shaping = 'none' | 'high' | 'band'

/** One drum as `DrumKit::strike` sets a slot up: everything the hit will do, in the header's units. */
export interface DrumVoice {
  /** Up to two sines: where each is tuned, how loud it is, how long it takes to fall 60 dB. */
  partials: number
  hz: [number, number]
  gain: [number, number]
  seconds: [number, number]
  /** The pitch starts `1 + fall` times its own and comes down with this time constant. */
  fall: number
  fallSeconds: number
  /** The tones' soft start. */
  attack: number
  /** The noise: its level, its 60 dB time, its soft start, and the filter that shapes it. */
  noise: number
  noiseSeconds: number
  noiseAttack: number
  shaping: Shaping
  shapeHz: number
  shapeQ: number
  /** The hats: six pulses over the noise, and a second high-pass. */
  metal: boolean
  shape2Hz: number
  /** The clap: bursts before the tail, and how far apart. */
  bursts: number
  burstGap: number
  /** Tone: the low-pass everything goes through, before Tone moves it, and its sharpness. */
  cut: number
  q: number
  /** Tone's narrower range: the noise drums and the tick. */
  noiseClass: boolean
  /** The slot's level, and its place between the speakers at full Width. */
  level: number
  pan: number
}

export const drumVoiceBlank = (): DrumVoice => ({
  partials: 0,
  hz: [0, 0],
  gain: [0, 0],
  seconds: [0, 0],
  fall: 0,
  fallSeconds: 0.01,
  attack: 0,
  noise: 0,
  noiseSeconds: 0,
  noiseAttack: 0,
  shaping: 'none',
  shapeHz: 1000,
  shapeQ: 0.7,
  metal: false,
  shape2Hz: 0,
  bursts: 0,
  burstGap: 0,
  cut: 1000,
  q: 0.6,
  noiseClass: false,
  level: 0,
  pan: 0,
})

/** `DrumKit::strike`: the tuning a hit is given, in semitones: the octave of its key, its cents and Tune. Variation's part is not known. */
export function drumTuning(hz: number, tune: number): number {
  return clamp(kitTuning(hz) + tune, -36, 36)
}

/** `DrumKit::strike`: Length as a drum tuned so far takes it. An octave up rings a third shorter, an octave down half longer. */
export function drumLength(length: number, semitones: number): number {
  return length * Math.pow(1.5, -semitones / 12)
}

/** `DrumKit::held`: where a drum's lowest partial is tuned, never under the floor. */
const drumHeld = (hz: number): number => Math.max(hz, DRUM_FLOOR_HZ)

/** `DrumKit::partial`: one sine of a drum, kept between the floor and the top of the band. */
function drumPartial(
  v: DrumVoice,
  top: number,
  index: number,
  hz: number,
  level: number,
  seconds: number,
): void {
  v.hz[index] = clamp(hz, DRUM_FLOOR_HZ, top)
  v.gain[index] = level
  v.seconds[index] = seconds
  v.partials = Math.max(v.partials, index + 1)
}

/** `DrumKit::fall`: how far over its pitch a drum starts; the swept pitch stays under the top of the band. */
function drumFall(v: DrumVoice, top: number, depth: number, seconds: number): void {
  const fastest = Math.max(v.hz[0], v.hz[1])
  v.fall = clamp(depth, 0, Math.max(0, top / fastest - 1))
  v.fallSeconds = seconds
}

/** `DrumKit::noise`: a drum's noise, its 60 dB time and its soft start. */
function drumNoise(v: DrumVoice, level: number, seconds: number, attack: number): void {
  v.noise = level
  v.noiseSeconds = seconds
  v.noiseAttack = attack
}

function drumVoiceReset(v: DrumVoice): DrumVoice {
  v.partials = 0
  v.hz[0] = v.hz[1] = v.gain[0] = v.gain[1] = v.seconds[0] = v.seconds[1] = 0
  v.fall = 0
  v.fallSeconds = 0.01
  v.attack = 0
  v.noise = v.noiseSeconds = v.noiseAttack = 0
  v.shaping = 'none'
  v.shapeHz = 1000
  v.shapeQ = 0.7
  v.metal = false
  v.shape2Hz = 0
  v.bursts = 0
  v.burstGap = 0
  v.cut = 1000
  v.q = 0.6
  v.noiseClass = false
  v.level = 0
  v.pan = 0
  return v
}

/**
 * `DrumKit::strike`: the drum on key `drum` as a hit of `gain` sets it up, with
 * the kit tuned `semitones` and the knobs where they stand, written into
 * `into`. Variation's draws are left at none: this is the hit the knobs ask
 * for, and the display draws what Variation may add as a range around it.
 */
export function drumVoice(
  drum: number,
  kit: number,
  semitones: number,
  lengthKnob: number,
  punch: number,
  snap: number,
  gain: number,
  into: DrumVoice,
  sampleRate = 48000,
): DrumVoice {
  const c = drumKit(kit)
  const ratio = Math.pow(2, semitones / 12)
  // The hats' and the shaker's bands move half as far as the tuning.
  const half = Math.sqrt(ratio)
  const length = drumLength(lengthKnob, semitones)
  const tonal = length * c.tonal
  const noisy = length * c.noise
  // A soft hit is quieter and duller, a hard one louder and brighter.
  const hardness = 0.5 + 0.7 * gain
  const bright = Math.pow(2, (gain - DRUM_FIRM) * 1.5)
  const brightHigh = Math.sqrt(bright)
  const v = drumVoiceReset(into)
  v.level = 0.25 + 0.75 * gain
  v.q = c.q
  const top = DRUM_TOP_OF_BAND * sampleRate
  if (drum === KICK) {
    drumPartial(v, top, 0, drumHeld(49 * c.low * ratio), 1, 0.45 * tonal)
    drumFall(
      v,
      top,
      (0.3 + 5 * punch) * c.fall * hardness,
      (0.012 + 0.014 * (1 - punch)) * c.fallTime,
    )
    v.attack = (0.004 - 0.0034 * punch) * c.attack
    if (snap > 0) {
      drumNoise(v, 1.2 * snap * c.click * hardness, 0.006, 0.0002)
      v.shaping = 'band'
      v.shapeHz = 3000 * half
      v.shapeQ = 0.8
    }
    v.cut = 4000 * half * bright * c.edge
    v.level *= 0.373
  } else if (drum === SUB) {
    drumPartial(v, top, 0, drumHeld(49 * c.low * ratio), 1, 0.9 * tonal)
    drumFall(v, top, 0.06 * c.fall, 0.04 * c.fallTime)
    v.attack = (0.014 - 0.008 * gain) * c.attack
    v.cut = 900 * half * bright * c.edge
    v.level *= 0.289
  } else if (drum === SNARE) {
    const tones = lerp(1, 0.45, snap)
    // Held at the floor by its lower tone; the upper one keeps its ratio.
    const lift = drumHeld(185 * c.pitch * ratio) / (185 * c.pitch * ratio)
    drumPartial(v, top, 0, 185 * c.pitch * ratio * lift, 0.6 * tones, 0.11 * tonal)
    drumPartial(v, top, 1, 330 * c.pitch * ratio * lift, 0.4 * tones, 0.09 * tonal)
    drumFall(v, top, 0.18 * c.fall * hardness, 0.012 * c.fallTime)
    v.attack = 0.0015 * c.attack
    drumNoise(v, lerp(0.25, 0.8, snap), 0.25 * noisy, lerp(0.006, 0.0005, snap) * c.attack)
    v.shaping = 'high'
    v.shapeHz = 1500 * c.band * ratio
    v.cut = 7000 * c.edge * ratio * bright
    v.noiseClass = true
    v.level *= 0.344
  } else if (drum === BRUSH) {
    drumNoise(v, 1, 0.35 * noisy, lerp(0.02, 0.012, snap) * c.attack)
    v.shaping = 'high'
    v.shapeHz = 700 * c.band * ratio
    v.cut = 4200 * c.edge * ratio * bright
    v.noiseClass = true
    v.level *= 0.34 * c.air
  } else if (drum === RIM) {
    drumPartial(v, top, 0, 480 * c.knock * ratio, 0.7, 0.06 * tonal)
    drumPartial(v, top, 1, 1700 * c.knock * ratio, 0.5, 0.04 * tonal)
    v.attack = lerp(0.0012, 0.0003, snap) * c.attack
    drumNoise(v, (0.15 + 0.6 * snap) * c.click * hardness, 0.004, 0.0002)
    v.shaping = 'band'
    v.shapeHz = 1700 * c.knock * ratio
    v.shapeQ = 1.2
    v.cut = 3000 * ratio * bright * c.edge
    v.level *= 0.174
    v.pan = -0.25
  } else if (drum === CLOSED_HAT || drum === OPEN_HAT) {
    const open = drum === OPEN_HAT
    drumNoise(v, 0.35, (open ? 0.4 : 0.045) * noisy, lerp(0.003, 0.0002, snap) * c.attack)
    v.metal = true
    v.shaping = 'high'
    v.shapeHz = Math.min(7000 * c.band * half, 13000)
    v.shape2Hz = Math.min(5500 * c.band * half, 11000)
    v.cut = 10000 * c.edge * half * brightHigh
    v.noiseClass = true
    v.level *= (open ? 0.4 : 0.84) * c.metal
    v.pan = open ? 0.4 : 0.35
  } else if (drum === SHAKER) {
    drumNoise(v, 1, 0.09 * noisy, lerp(0.01, 0.006, snap) * c.attack)
    v.shaping = 'high'
    v.shapeHz = Math.min(4000 * c.band * half, 12000)
    v.cut = 9000 * c.edge * half * brightHigh
    v.noiseClass = true
    v.level *= 0.296 * c.air
    v.pan = -0.45
  } else if (drum === CLAP) {
    // Three bursts about 10 ms apart, then the tail, which is the time written here.
    drumNoise(v, 1 / half, 0.15 * noisy, lerp(0.002, 0.0002, snap) * c.attack)
    v.bursts = DRUM_CLAP_BURSTS
    v.burstGap = DRUM_CLAP_GAP_SEC
    v.shaping = 'band'
    v.shapeHz = 1200 * c.band * ratio
    v.shapeQ = 1.4
    v.cut = 3200 * c.edge * ratio * bright
    v.noiseClass = true
    v.level *= 0.81
    v.pan = 0.1
  } else if (drum === LOW_TOM || drum === HIGH_TOM) {
    const high = drum === HIGH_TOM
    const hz = drumHeld((high ? 165 : 110) * c.pitch * ratio)
    const seconds = (high ? 0.3 : 0.4) * tonal
    drumPartial(v, top, 0, hz, 1, seconds)
    drumPartial(v, top, 1, hz * 1.59, 0.16, seconds * 0.4)
    drumFall(
      v,
      top,
      (0.1 + 0.9 * punch) * c.fall * hardness,
      (0.01 + 0.012 * (1 - punch)) * c.fallTime,
    )
    v.attack = (0.003 - 0.0024 * punch) * c.attack
    // The skin: a little noise a few harmonics up.
    drumNoise(v, 0.18 * (0.5 + 0.7 * snap) * c.click * hardness, 0.05 * tonal, 0.001)
    v.shaping = 'band'
    v.shapeHz = hz * 6
    v.cut = 1400 * ratio * bright * c.edge
    v.level *= 0.262
    v.pan = high ? 0.3 : -0.5
  } else {
    drumPartial(v, top, 0, 2200 * c.knock * ratio, 0.7, 0.04 * tonal)
    drumPartial(v, top, 1, 3410 * c.knock * ratio, 0.4, 0.025 * tonal)
    drumFall(v, top, 0.05 * c.fall, 0.006 * c.fallTime)
    v.attack = lerp(0.001, 0.0002, snap) * c.attack
    // Its partials are high already: Tone moves it as it moves the noise drums.
    v.cut = 4500 * ratio * bright * c.edge
    v.noiseClass = true
    v.level *= 0.149
    v.pan = 0.5
  }
  return v
}

/**
 * How long a drum takes to fall 60 dB: its slowest envelope, as
 * `DrumKit::render` ends a slot by the largest one. The clap's bursts come
 * before its tail.
 */
export function drumRingSeconds(v: DrumVoice): number {
  const tones = Math.max(v.seconds[0], v.seconds[1])
  return Math.max(tones, v.noise > 0 ? v.bursts * v.burstGap + v.noiseSeconds : 0)
}

/** `DrumKit::render`: a drum's noise envelope `age` seconds after the hit, in dB. Each burst of the clap starts it again. */
function drumNoiseDb(v: DrumVoice, age: number): number {
  const tail = age - v.bursts * v.burstGap
  if (tail >= 0) return (-60 * tail) / v.noiseSeconds
  return (-60 * (age % v.burstGap)) / DRUM_CLAP_BURST_SEC
}

/** `DrumKit::render`, `remaining`: the largest envelope of a drum `age` seconds after the hit, in dB under the hit. */
export function drumRemainingDb(v: DrumVoice, age: number): number {
  let most = -120
  for (let k = 0; k < v.partials; k++) most = Math.max(most, (-60 * age) / v.seconds[k])
  if (v.noise > 0)
    most = Math.max(most, v.bursts > 0 && age < v.bursts * v.burstGap ? 0 : drumNoiseDb(v, age))
  return most
}

/** `DrumKit::strike`: how loud a hit of `gain` is against the hardest. */
export const drumHitLevel = (gain: number): number => 0.25 + 0.75 * clamp(gain, 0, 1)

/** `DrumKit::follow_tone`: what Tone does to a drum's low-pass, two octaves either way for a tonal drum and less for a noise drum. */
export function drumToneFactor(tone: number, noiseClass: boolean): number {
  return Math.pow(2, (tone - 0.5) * (noiseClass ? 1.7 : 4))
}

/** `DrumKit::retune`: where a drum's low-pass stands with Tone there. */
export function drumCutHz(v: DrumVoice, tone: number, sampleRate = 48000): number {
  return clamp(v.cut * drumToneFactor(tone, v.noiseClass), 40, DRUM_TOP_OF_BAND * sampleRate)
}

/** `kit::fast_tanh` (cpp/kit/math.h). */
function fastTanh(x: number): number {
  const held = clamp(x, -3, 3)
  const x2 = held * held
  return (held * (27 + x2)) / (27 + 9 * x2)
}

/** `DrumKit::process`: Drive, a blend towards a saturator that gives back the level of one firm kick (0.3) unchanged. */
export function drumDrive(drive: number, x: number): number {
  return x + drive * (fastTanh(x * 6) * 0.3095 - x)
}
/** The level Drive leaves where it is. */
const DRUM_DRIVE_HOME = 0.3

/** `DrumKit::process`: where a drum sits with Width there, -1 (left) to 1. */
export const drumPlace = (pan: number, width: number): number => pan * clamp(width, 0, 1)

/** `DrumKit::strike`: the most Variation may stretch or shrink a hit's length, as a factor either way. */
export const drumLengthSpan = (variation: number): number => Math.pow(2, 0.25 * variation)

/** `DrumKit::strike`: how much of an open hat is left `since` seconds after the closed hat or the shaker was struck. */
export function drumChoke(since: number): number {
  return since >= DRUM_CHOKE_SEC ? 0 : smoothstep(1 - Math.max(since, 0) / DRUM_CHOKE_SEC)
}

/** A pad's scales: time across by ratio, a millisecond to four seconds, and pitch upwards by octave. */
const DRUM_SHORT_SEC = 0.001
const DRUM_LONG_SEC = 4
const DRUM_LOW_HZ = 20
const DRUM_HIGH_HZ = 20000
/** A band of noise is drawn down to 24 dB under its top: one stipple's worth of the 60 dB a ring is drawn over. */
const DRUM_SKIRT = 2.5
/** The widest a pitch is drawn in a pad, and the narrowest that still shows. */
const DRUM_LINE_MOST = 1.6
const DRUM_LINE_LEAST = 0.45

const drumX = (seconds: number, box: Box): number =>
  box.x +
  box.w * clamp(Math.log(seconds / DRUM_SHORT_SEC) / Math.log(DRUM_LONG_SEC / DRUM_SHORT_SEC), 0, 1)
const drumSecondsAt = (x: number, box: Box): number =>
  DRUM_SHORT_SEC * Math.pow(DRUM_LONG_SEC / DRUM_SHORT_SEC, (x - box.x) / box.w)
const drumY = (hz: number, box: Box): number =>
  box.y +
  box.h * (1 - clamp(Math.log(hz / DRUM_LOW_HZ) / Math.log(DRUM_HIGH_HZ / DRUM_LOW_HZ), 0, 1))
const drumHzAt = (y: number, box: Box): number =>
  DRUM_LOW_HZ * Math.pow(DRUM_HIGH_HZ / DRUM_LOW_HZ, 1 - (y - box.y) / box.h)

interface DrumParts {
  /** The baseline of the words. */
  words: number
  /** The twelve pads, two rows of six in key order. */
  pads: Box
  rows: number
  columns: number
  /** One hit's fall, the places between the speakers, and Drive's bend. */
  fall: Box
  stage: Box
  drive: Box
  foot: Box
}

function drumParts(view: Size): DrumParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const foot: Box = { x: all.x, y: all.y + all.h - 6, w: all.w, h: 6 }
  const high = 13
  const y = foot.y - 3 - high
  const gap = all.w < 160 ? 5 : 7
  const fall = Math.round((all.w - high - 2 * gap) * 0.48)
  return {
    words: all.y + 7,
    pads: { x: all.x, y: all.y + 10, w: all.w, h: y - 2 - (all.y + 10) },
    rows: 2,
    columns: DRUMS / 2,
    fall: { x: all.x, y, w: fall, h: high },
    stage: { x: all.x + fall + gap, y, w: all.w - high - 2 * gap - fall, h: high },
    drive: { x: all.x + all.w - high, y, w: high, h: high },
    foot,
  }
}

/** Where the pad of a drum stands on a display of that size. */
export const drumPadBox = (view: Size, drum: number): Box => drumPad(drum, drumParts(view))

/** The pad of a drum: its key's place in the two rows, with a pixel between pads. */
function drumPad(drum: number, parts: DrumParts): Box {
  const { pads, rows, columns } = parts
  const column = drum % columns
  const row = Math.floor(drum / columns)
  const x = Math.round(pads.x + (column * pads.w) / columns)
  const y = Math.round(pads.y + (row * pads.h) / rows)
  return {
    x,
    y,
    w: Math.round(pads.x + ((column + 1) * pads.w) / columns) - x - 1,
    h: Math.round(pads.y + ((row + 1) * pads.h) / rows) - y - 1,
  }
}

interface DrumState {
  /** The drum being drawn, set up again for each pad. */
  voice: DrumVoice
  /** The newest note on each key, as its place in the notes. */
  newest: Int32Array
  /** What the filters leave of the noise at each row of a pad's stipple, in dB. */
  rows: Float32Array
  /** The drum last struck: the one the words and the fall are of. */
  last: number
}

/** `DrumKit::render`: what a drum's own filter and its low-pass leave of its noise at `hz`. */
function drumNoiseGain(v: DrumVoice, hz: number, cutHz: number): number {
  let gain = svfGain('low', hz / cutHz, v.q)
  if (v.shaping === 'high') {
    gain *= svfGain('high', hz / v.shapeHz, v.shapeQ)
    if (v.shape2Hz > 0) gain *= svfGain('high', hz / v.shape2Hz, v.shapeQ)
  } else if (v.shaping === 'band') gain *= svfGain('band', hz / v.shapeHz, v.shapeQ)
  return gain
}

/**
 * One drum in its pad, pitch against time. A tone is a line where its pitch
 * is, as thick as it is loud: it starts as far over its pitch as the drum
 * falls, swells over its soft start and thins out to nothing where it has
 * fallen 60 dB. Noise is a stipple over the band its filters leave it, as dense
 * as it is loud; the hats' pulses, which are pitches and not noise, are
 * streaks. So a kick is a hook low down, a hat a short cloud high up, a snare
 * two short lines under a cloud.
 */
function drumGlyph(
  ctx: Ctx,
  box: Box,
  v: DrumVoice,
  cutHz: number,
  rows: Float32Array,
  colour: string,
): void {
  ctx.beginPath()
  if (v.noise > 0) {
    const cell = 2
    const rowCount = Math.min(rows.length, Math.floor(box.h / cell))
    const columns = Math.floor(box.w / cell)
    for (let r = 0; r < rowCount; r++)
      rows[r] = DRUM_SKIRT * dbOf(drumNoiseGain(v, drumHzAt(box.y + (r + 0.5) * cell, box), cutHz))
    // `DrumKit::metal`: the hats' six pulses are at full level over a little noise.
    const level = dbOf(v.metal ? 1 : v.noise)
    for (let c = 0; c < columns; c++) {
      const t = drumSecondsAt(box.x + (c + 0.5) * cell, box)
      const soft = v.noiseAttack > 0 && t < v.noiseAttack ? dbOf(smoothstep(t / v.noiseAttack)) : 0
      const db = level + drumNoiseDb(v, t) + soft
      if (db <= -60) continue
      for (let r = 0; r < rowCount; r++)
        if (1 + (db + rows[r]) / 60 > stipple(c, r))
          ctx.rect(box.x + c * cell, box.y + r * cell, v.metal ? cell : 1, 1)
    }
  }
  for (let k = 0; k < v.partials; k++) {
    for (let x = 0; x < box.w; x++) {
      const t = drumSecondsAt(box.x + x + 0.5, box)
      const hz = v.hz[k] * (1 + v.fall * Math.exp(-t / v.fallSeconds))
      let share = shareOfDb(
        dbOf(v.gain[k] * svfGain('low', hz / cutHz, v.q)) - (60 * t) / v.seconds[k],
      )
      if (v.attack > 0 && t < v.attack) share *= smoothstep(t / v.attack)
      if (share <= 0) continue
      const half = DRUM_LINE_LEAST + (DRUM_LINE_MOST - DRUM_LINE_LEAST) * share
      const y = clamp(drumY(hz, box), box.y + half, box.y + box.h - half)
      ctx.rect(box.x + x, y - half, 1, 2 * half)
    }
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = colour
  ctx.fill()
}

/** The steps of an octave that are sharps, as bits: 1, 3, 6, 8 and 10. */
const SHARPS = 0b010101001010
const isSharp = (key: number): boolean => ((SHARPS >> key) & 1) === 1

/** A time as it is said, to the millisecond under a tenth of a second: a tick rings 40 ms. */
const kitSecondsText = (seconds: number): string =>
  seconds < 0.0995 ? `${Math.max(1, Math.round(seconds * 1000))} ms` : secondsText(seconds)

/**
 * One hit's fall, level against time: the drum's tones as lines and its noise
 * dotted, each from its own level down 60 dB over its own time, on a scale
 * that ends a quarter past the drum's ring. The wedge at the slowest is what
 * Variation may make of a hit, up to `drumLengthSpan` longer or shorter: a hit
 * `age` seconds old (under 0 for none) is lit across it, since where in it
 * this hit lies was drawn by chance.
 */
function drumFallLane(frame: Paint, box: Box, v: DrumVoice, variation: number, age: number): void {
  const { ctx, colours } = frame
  const ring = Math.max(drumRingSeconds(v), 1e-4)
  const across = (seconds: number): number => box.x + box.w * clamp(seconds / (ring * 1.25), 0, 1)
  const down = (db: number): number => box.y + (box.h - 1) * clamp(-db / 60, 0, 1)
  fillRect(ctx, box, colours.ink, 0.07)
  rule(ctx, box.x, box.y + box.h - 1, box.x + box.w, box.y + box.h - 1, {
    colour: colours.ink,
    alpha: INK.rule,
  })
  // The slowest envelope: where it starts, how loud, and how long it takes.
  let from = 0
  let start = 0
  let seconds = 0
  for (let k = 0; k < v.partials; k++)
    if (v.seconds[k] > seconds) {
      seconds = v.seconds[k]
      from = dbOf(v.gain[k])
    }
  const noiseFrom = dbOf(Math.min(1, v.noise))
  const noiseStart = v.bursts * v.burstGap
  if (v.noise > 0 && noiseStart + v.noiseSeconds > seconds) {
    seconds = v.noiseSeconds
    start = noiseStart
    from = noiseFrom
  }
  const span = drumLengthSpan(variation)
  if (span > 1) {
    ctx.beginPath()
    ctx.moveTo(across(start), down(from))
    ctx.lineTo(across(start + seconds * span), down(-60))
    ctx.lineTo(across(start + seconds / span), down(-60))
    ctx.closePath()
    ctx.globalAlpha = INK.back
    ctx.fillStyle = colours.ink
    ctx.fill()
    ctx.globalAlpha = 1
  }
  for (let k = 0; k < v.partials; k++)
    rule(ctx, across(0), down(dbOf(v.gain[k])), across(v.seconds[k]), down(-60), {
      colour: colours.ink,
      alpha: INK.trace,
    })
  if (v.noise > 0) {
    // The clap's bursts, each 20 dB down by the time the next one comes.
    for (let b = 0; b < v.bursts; b++)
      rule(
        ctx,
        across(b * v.burstGap),
        down(noiseFrom),
        across((b + 1) * v.burstGap),
        down(noiseFrom - (60 * v.burstGap) / DRUM_CLAP_BURST_SEC),
        { colour: colours.ink, alpha: INK.trace },
      )
    rule(ctx, across(noiseStart), down(noiseFrom), across(noiseStart + v.noiseSeconds), down(-60), {
      colour: colours.ink,
      alpha: INK.trace,
      dash: [1, 2],
    })
  }
  if (age < 0) return
  // Lit between the longest and the shortest this hit may be: all of it, till the longest is done.
  const since = Math.max(0, age - start)
  const high = from - (60 * since) / (seconds * span)
  if (age < start || high <= -60) return
  const top = down(high)
  const bottom = Math.max(down(from - (60 * since) / (seconds / span)), top + 2)
  const now = across(age)
  rule(ctx, now, box.y, now, box.y + box.h - 1, { colour: colours.accent, alpha: INK.back })
  fillRect(ctx, { x: now - 1.5, y: top - 1, w: 3, h: bottom - top + 1 }, colours.accent)
}

const drumKitDisplay = plateDisplay<DrumState>({
  place: 'window',
  columns: 2,
  params: ['kit', 'tune', 'length', 'punch', 'snap', 'tone', 'drive', 'variation', 'width'],
  live: { signal: true, notes: true },
  info: 'Twelve pads in key order, each drum as pitch against time: a line where its tone is and falls, dots where its noise is, the dashed lid its Tone. A hit lights its pad until it has died. Under them one hit falling with what Variation may make of it, where the drums sit, and the bend of Drive.',
  init: () => ({
    voice: drumVoiceBlank(),
    newest: new Int32Array(DRUMS),
    rows: new Float32Array(128),
    last: KICK,
  }),
  draw(frame) {
    const { ctx, colours, state, notes } = frame
    ground(frame)
    const kit = frame.value('kit')
    const tune = frame.value('tune')
    const length = frame.value('length')
    const punch = frame.value('punch')
    const snap = frame.value('snap')
    const tone = frame.value('tone')
    const drive = clamp(frame.value('drive'), 0, 1)
    const variation = clamp(frame.value('variation'), 0, 1)
    const width = frame.value('width')
    const parts = drumParts(frame)
    const v = state.voice
    const newest = newestByKey(notes, state.newest)
    const middle = parts.stage.x + parts.stage.w / 2
    const reach = parts.stage.w / 2 - 2
    const level = parts.stage.y + Math.round(parts.stage.h / 2)
    // The line's ends are the speakers (`DrumKit::process`: a place of 1 leaves one side silent), so
    // the widest drums, the low tom and the tick, stand half way out at full Width and no further.
    const placeX = (pan: number): number => middle + drumPlace(pan, width) * reach

    // The stage: the line between the speakers, with its middle marked.
    rule(ctx, middle - reach, level, middle + reach, level, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    rule(ctx, middle, parts.stage.y, middle, parts.stage.y + parts.stage.h, {
      colour: colours.ink,
      alpha: INK.grid,
    })

    /** How much of the hit on a key is left, 0 for none; it sets the voice up as that hit struck it. */
    const sounding = (drum: number): number => {
      const index = newest[drum]
      if (index < 0) return 0
      const note = notes[index]
      const gain = clamp(note.gain, 0, 1)
      drumVoice(
        drum,
        kit,
        drumTuning(note.frequency, tune),
        length,
        punch,
        snap,
        gain,
        v,
        frame.sampleRate,
      )
      let share = shareOfDb(drumRemainingDb(v, note.age))
      if (drum === OPEN_HAT) {
        // The closed hat and the shaker choke it, in the order the notes came. The first of them
        // after it starts the fade (`DrumKit::begin_fade` never starts one again): a later one
        // finds it gone and must not light it for another 8 ms.
        for (let later = index + 1; later < notes.length; later++) {
          if (!struck(notes[later])) continue
          const key = kitKey(notes[later].frequency)
          if (key !== CLOSED_HAT && key !== SHAKER) continue
          share *= drumChoke(notes[later].age)
          break
        }
      }
      return share >= DONE ? share : 0
    }

    let said = -1
    let saidAt = Infinity
    for (let drum = 0; drum < DRUMS; drum++) {
      const pad = drumPad(drum, parts)
      const share = sounding(drum)
      const note = share > 0 ? notes[newest[drum]] : null
      // At rest a pad is its drum in the octave a kit is written in, struck firmly.
      if (!note)
        drumVoice(
          drum,
          kit,
          clamp(tune, -36, 36),
          length,
          punch,
          snap,
          DRUM_FIRM,
          v,
          frame.sampleRate,
        )
      const cutHz = drumCutHz(v, tone, frame.sampleRate)
      fillRect(ctx, pad, colours.ink, isSharp(drum) ? 0.16 : 0.07)
      if (note) fillRect(ctx, pad, colours.accent, 0.85 * share * drumHitLevel(note.gain))
      const inner: Box = { x: pad.x + 1, y: pad.y + 1, w: pad.w - 2, h: pad.h - 2 }
      // The lid: the low-pass everything in the drum goes through, where Tone puts it.
      const lid = drumY(cutHz, inner)
      rule(ctx, pad.x, lid, pad.x + pad.w, lid, {
        colour: colours.ink,
        alpha: 0.4,
        dash: [1, 2],
      })
      drumGlyph(ctx, inner, v, cutHz, state.rows, colours.ink)
      // Where it sits between the speakers.
      const at = placeX(v.pan)
      rule(ctx, at, level - 3, at, level + 4, {
        colour: note ? colours.accent : colours.ink,
        width: note ? 2 : 1,
        alpha: note ? 1 : INK.text,
      })
      if (!note) continue
      // The hit, as far into the pad as it has come.
      const now = drumX(Math.max(note.age, DRUM_SHORT_SEC), inner)
      rule(ctx, now, pad.y, now, pad.y + pad.h, { colour: colours.accent })
      ctx.globalAlpha = 0.4 + 0.6 * share
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 1
      ctx.strokeRect(pad.x + 0.5, pad.y + 0.5, pad.w - 1, pad.h - 1)
      ctx.globalAlpha = 1
      if (note.age < saidAt) {
        saidAt = note.age
        said = drum
      }
    }
    if (said >= 0) state.last = said

    // One hit's fall: the newest drum that sounds, or the last one struck at rest.
    const shown = state.last
    const lit = said >= 0 && sounding(shown) > 0
    if (!lit)
      drumVoice(
        shown,
        kit,
        clamp(tune, -36, 36),
        length,
        punch,
        snap,
        DRUM_FIRM,
        v,
        frame.sampleRate,
      )
    drumFallLane(frame, parts.fall, v, variation, lit ? notes[newest[shown]].age : -1)
    const ring = drumRingSeconds(v)

    // Drive: level in across, level out upwards, about the level it leaves alone.
    const bend = parts.drive
    fillRect(ctx, bend, colours.ink, 0.07)
    const full = 2 * DRUM_DRIVE_HOME
    ctx.beginPath()
    for (let s = 0; s <= bend.w; s++) {
      const out = drumDrive(drive, (s / bend.w) * full) / full
      const y = bend.y + bend.h - clamp(out, 0, 1) * bend.h
      if (s === 0) ctx.moveTo(bend.x, y)
      else ctx.lineTo(bend.x + s, y)
    }
    ctx.globalAlpha = drive > 0 ? INK.trace : INK.back
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.globalAlpha = 1
    fillRect(
      ctx,
      { x: bend.x + bend.w / 2 - 1, y: bend.y + bend.h / 2 - 1, w: 2, h: 2 },
      colours.ink,
    )

    levelFoot(frame, parts.foot, outShare(frame))

    // The words: the kit, and the drum that is shown with how long it rings.
    text(frame, drumKit(kit).name, parts.pads.x, parts.words)
    text(
      frame,
      `${DRUM_NAMES[shown]} ${kitSecondsText(ring)}`,
      parts.pads.x + parts.pads.w,
      parts.words,
      {
        align: 'right',
      },
    )
  },
})

// --- Glitch Kit --------------------------------------------------------------

/** `glitch_kit.h`, `GlitchKit::Voice`: the fault on each key of the octave, from C. */
const GLITCH_NAMES = [
  'Click',
  'Double',
  'Pop',
  'Crackle',
  'Pip',
  'Cut',
  'Static',
  'Buzz',
  'Zap',
  'Chirp',
  'Stutter',
  'Bit',
] as const
const CLICK = 0
const DOUBLE = 1
const POP = 2
const CRACKLE = 3
const PIP = 4
const CUT = 5
const STATIC = 6
const BUZZ = 7
const ZAP = 8
const CHIRP = 9
const STUTTER = 10
const BIT = 11
const FAULTS = 12

/** `glitch_kit.h`, `kPlace`: where each voice sits with Scatter at 0 and Spread at 1. */
const GLITCH_PLACE = [-0.25, 0.35, 0, -0.5, 0.2, -0.15, 0.5, -0.3, 0.4, -0.45, 0.3, -0.2] as const
/** `glitch_kit.h`: the click's band and how long it rings at Length 1, and the pulse that rings it. */
const GLITCH_CLICK_HZ = 2600
const GLITCH_CLICK_RING = 0.003
const GLITCH_PULSE_SEC = 0.00015
/** `glitch_kit.h`: the pitches the voices are built on. */
const GLITCH_POP_HZ = 97.999
const GLITCH_PIP_HZ = 1318.51
const GLITCH_BUZZ_HZ = 97.999
const GLITCH_BUZZ_BAND_HZ = 1400
const GLITCH_BUZZ_Q = 1.5
const GLITCH_BUZZ_PULSE_SEC = 0.00025
const GLITCH_ZAP_HZ = [6000, 300] as const
const GLITCH_CHIRP_HZ = [880, 3520] as const
const GLITCH_GRAIN_HZ = 2093
const GLITCH_BIT_HZ = 7902.13
const GLITCH_STATIC_HZ = 3000
const GLITCH_CUT_HZ = 7000
/** `glitch_kit.h`, `kRoundSeconds`: the rounding of an end with Edge at 0. */
const GLITCH_ROUND_SEC = 0.003
/** `glitch_kit.h`, `kThrow`: how far Scatter may throw a hit to either side. */
const GLITCH_THROW = 0.9
const SIXTY_DB = 6.907755279

/** `GlitchKit::note_on`: the tuning a hit is given, in semitones: the octave of its key, its cents and Tune. */
export function glitchTuning(hz: number, tune: number): number {
  return clamp(kitTuning(hz) + tune, -36, 36)
}

/**
 * `GlitchKit::note_on`: what a voice tuned so far makes of Length. An octave up
 * is a quarter shorter (`kOctaveShortening`). `stretch` is what Scatter drew for
 * this hit, 1 for none: the device holds the product, not Length, to its range.
 */
export function glitchDuration(length: number, tuning: number, stretch = 1): number {
  return clamp(length * Math.pow(0.75, tuning / 12) * stretch, 0.1, 12)
}

/**
 * `GlitchKit::note_on`: the most Scatter may stretch or shrink a hit's
 * duration, as a factor either way, and move its pitch, in semitones. The
 * duration is not the time a fault lasts: the spacing of the double's clicks
 * and the stutter's repeats is Density's and Scatter leaves it alone.
 */
export const glitchLengthSpan = (scatter: number): number => Math.pow(2, 0.5 * scatter)
export const glitchPitchSpan = (scatter: number): number => 3 * scatter * scatter

/** `GlitchKit::note_on`: where a voice sits, -1 (left) to 1, before Scatter throws the hit; the pop is in the middle. */
export function glitchPlace(voice: number, spread: number, scatter: number): number {
  return voice === POP ? 0 : spread * (1 - Math.sqrt(scatter)) * GLITCH_PLACE[voice]
}
/** `GlitchKit::note_on`: how far to either side of that place Scatter may throw a hit. */
export function glitchThrow(voice: number, spread: number, scatter: number): number {
  return voice === POP ? 0 : spread * GLITCH_THROW * Math.sqrt(scatter)
}

/** `GlitchKit::start`: how loud a hit of `gain` is against the hardest. */
export const glitchHitLevel = (gain: number): number => 0.25 + 0.75 * clamp(gain, 0, 1)

/** `GlitchKit::tone_hz_at`: where Tone's low-pass stands, 1.5 kHz to 18 kHz. */
export const glitchToneHz = (tone: number): number => 1500 * Math.pow(12, tone)

/** `GlitchKit::crush_clock` and `set_crush`: the clock Crush holds samples at, and the step it rounds them to, of full scale. */
export const glitchCrushClock = (crush: number): number => 48000 * Math.pow(2, -3 * crush)
export const glitchCrushStep = (crush: number): number => Math.pow(2, -(16 - 10 * crush))

/** `GlitchKit::start`: the rounding at each end of a sound, in seconds: none with Edge full up. */
export const glitchRound = (edge: number): number => GLITCH_ROUND_SEC * (1 - edge) * (1 - edge)

/**
 * `GlitchKit::start`: how many events a voice makes. The double is two clicks
 * or, from half Density, three; the stutter four repeats to twelve. The
 * crackle's pulses are drawn by chance, about a third of the 10 to 160 a burst
 * length it starts at and the first one: this is their count on average.
 */
export function glitchEvents(voice: number, density: number): number {
  if (voice === DOUBLE) return density < 0.5 ? 2 : 3
  if (voice === STUTTER) return 4 + Math.floor(8 * density + 0.5)
  if (voice === CRACKLE) return 1 + (10 * Math.pow(2, 4 * density)) / 3
  return 1
}

/** `GlitchKit::start`: how far apart the double's clicks and the stutter's repeats lie, in seconds; Length does not move it. */
export function glitchPeriod(voice: number, density: number): number {
  return voice === STUTTER ? lerp(0.04, 0.012, density) : lerp(0.03, 0.012, density)
}

/** `GlitchKit::band_hz`: the click's band for a hit tuned `ratio`; a harder hit rings it a little higher. */
export function glitchBandHz(ratio: number, gain: number, sampleRate = 48000): number {
  const harder = Math.pow(2, (gain - DRUM_FIRM) * 0.5)
  return clamp(GLITCH_CLICK_HZ * ratio * harder, 200, Math.min(12000, 0.4 * sampleRate))
}

/** `GlitchKit::start`: the band the buzz's pulses ring, for a hit tuned `ratio`. */
const glitchBuzzBand = (ratio: number, sampleRate: number): number =>
  Math.min(GLITCH_BUZZ_BAND_HZ * ratio, Math.min(10000, 0.4 * sampleRate))

/**
 * `GlitchKit::buzz_crest`: how many samples after a pulse of the buzz begins
 * its ring is at its crest. The device finds it by a dry run of one pulse
 * through the band, and so does this: the same `kit::Svf`, the same pulse.
 */
export function glitchBuzzCrest(ratio: number, sampleRate = 48000): number {
  const hz = GLITCH_BUZZ_HZ * ratio
  const band = glitchBuzzBand(ratio, sampleRate)
  const ideal = GLITCH_BUZZ_PULSE_SEC * (GLITCH_BUZZ_HZ / hz) * sampleRate
  const pulse = Math.max(ideal, 3)
  const g = Math.tan((Math.PI * clamp(band, 5, sampleRate * 0.49)) / sampleRate)
  const k = 1 / GLITCH_BUZZ_Q
  const a1 = 1 / (1 + g * (g + k))
  const a2 = g * a1
  const a3 = g * a2
  let ic1 = 0
  let ic2 = 0
  let crest = 0
  let top = 0
  const n = Math.min(Math.floor(pulse + sampleRate / band) + 2, Math.floor(sampleRate / hz))
  for (let i = 0; i < n; i++) {
    const x = i < pulse ? (ideal / pulse) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / pulse)) : 0
    const v3 = x - ic2
    const v1 = a1 * ic1 + a2 * v3
    const v2 = ic2 + a2 * ic1 + a3 * v3
    ic1 = 2 * v1 - ic1
    ic2 = 2 * v2 - ic2
    if (Math.abs(v1) > top) {
      top = Math.abs(v1)
      crest = i
    }
  }
  return crest
}

/** `GlitchKit::start`: how many pulses of the buzz crest inside the voice's length: at least one, which is left to ring out. */
export function glitchBuzzPulses(duration: number, ratio: number, sampleRate = 48000): number {
  const room =
    Math.max(1, Math.round(0.09 * duration * sampleRate)) - 1 - glitchBuzzCrest(ratio, sampleRate)
  return room > 0 ? 1 + Math.floor((room * GLITCH_BUZZ_HZ * ratio) / sampleRate) : 1
}

/** `GlitchKit::start`: the buzz's band has rung 60 dB down this long after a pulse. */
const glitchBuzzRing = (ratio: number, sampleRate: number): number =>
  (SIXTY_DB * 2 * GLITCH_BUZZ_Q) / (2 * Math.PI * glitchBuzzBand(ratio, sampleRate))

/** `GlitchKit::start`: a click from its pulse to where its band has rung 90 dB down, one and a half ring times on. */
function glitchClickSeconds(duration: number, ratio: number, gain: number, rate: number): number {
  const pulse = GLITCH_PULSE_SEC * (GLITCH_CLICK_HZ / glitchBandHz(ratio, gain, rate))
  return Math.max(pulse, 2.5 / rate) + 1.5 * GLITCH_CLICK_RING * duration
}

/**
 * `GlitchKit::start`, `hit.length`: how long a voice sounds, in seconds, for a
 * hit of `gain` that lasts `duration` times the voice's own length and is
 * tuned `ratio`. A hit is a one-shot that counts its own samples: it stops
 * here. The stutter is given its sine grain; which grain a hit gets is drawn
 * by chance once Scatter is up.
 */
export function glitchSeconds(
  voice: number,
  duration: number,
  density: number,
  edge: number,
  ratio: number,
  gain: number,
  sampleRate = 48000,
): number {
  const clicked = glitchClickSeconds(duration, ratio, gain, sampleRate)
  switch (voice) {
    case CLICK:
      return clicked
    case DOUBLE:
      return (glitchEvents(voice, density) - 1) * glitchPeriod(voice, density) + clicked
    case CRACKLE:
      return 0.25 * duration + clicked
    case POP:
      return 0.02 * duration
    case PIP:
      return 0.04 * duration
    case CUT:
      return 0.05 * duration
    case STATIC:
      return 0.2 * duration
    case BUZZ: {
      const pulses = glitchBuzzPulses(duration, ratio, sampleRate)
      const crest = glitchBuzzCrest(ratio, sampleRate)
      const open = edge * edge
      const kept = pulses > 1 ? 1 - open : 1
      return (
        (pulses - 1) / (GLITCH_BUZZ_HZ * ratio) +
        (crest - Math.round(crest * open)) / sampleRate +
        glitchBuzzRing(ratio, sampleRate) * kept
      )
    }
    case ZAP:
      return 0.04 * duration
    case CHIRP:
      return 0.03 * duration
    case STUTTER: {
      const period = glitchPeriod(voice, density)
      return (glitchEvents(voice, density) - 1) * period + Math.min(0.006 * duration, 0.9 * period)
    }
    default:
      return 0.08 * duration
  }
}

/**
 * `GlitchKit::note_on` and `start`: how long a fault tuned `tuning` semitones
 * lasts when Scatter drew `stretch` for its duration. Scatter stretches the
 * duration and not the time: what Length does not set (the spacing of repeats,
 * a click's pulse, the buzz's ring) stays as it is.
 */
export function glitchLasts(
  voice: number,
  length: number,
  tuning: number,
  stretch: number,
  density: number,
  edge: number,
  gain: number,
  sampleRate = 48000,
): number {
  const duration = glitchDuration(length, tuning, stretch)
  return glitchSeconds(voice, duration, density, edge, Math.pow(2, tuning / 12), gain, sampleRate)
}

/**
 * Where a voice lies in pitch, for a hit tuned `ratio`: the pitch of its sine,
 * the band its pulses ring, the clock of its steps, the top of its noise. The
 * zap and the chirp run from one to the other; the rest have one. No sine is
 * asked to go over 18 kHz or 0.42 of the sample rate.
 */
export function glitchFromHz(voice: number, ratio: number, gain = DRUM_FIRM, rate = 48000): number {
  const top = Math.min(18000, 0.42 * rate)
  switch (voice) {
    case POP:
      return GLITCH_POP_HZ * ratio
    case PIP:
      return Math.min(GLITCH_PIP_HZ * ratio, top)
    case CUT:
      return clamp(GLITCH_CUT_HZ * ratio, 400, Math.min(16000, 0.45 * rate))
    case STATIC:
      return Math.min(GLITCH_STATIC_HZ * ratio, 16000)
    case BUZZ:
      return glitchBuzzBand(ratio, rate)
    case ZAP:
      return Math.min(GLITCH_ZAP_HZ[0] * ratio, top)
    case CHIRP:
      return Math.min(GLITCH_CHIRP_HZ[0] * ratio, top)
    case STUTTER:
      return Math.min(GLITCH_GRAIN_HZ * ratio, top)
    case BIT:
      return Math.min(GLITCH_BIT_HZ * ratio, 16000)
    default:
      return glitchBandHz(ratio, gain, rate)
  }
}
export function glitchToHz(voice: number, ratio: number, gain = DRUM_FIRM, rate = 48000): number {
  const top = Math.min(18000, 0.42 * rate)
  if (voice === ZAP) return Math.min(GLITCH_ZAP_HZ[1] * ratio, top)
  if (voice === CHIRP) return Math.min(GLITCH_CHIRP_HZ[1] * ratio, top)
  return glitchFromHz(voice, ratio, gain, rate)
}

/**
 * A lane's scale: time across to half a second, the early part drawn wider (the 0.4th
 * power of the time), so that a click of 5 ms and a burst of half a second
 * both show and repeats 12 ms apart can still be counted. The lines through
 * the lanes are at 10 ms and 100 ms.
 */
const GLITCH_SPAN_SEC = 0.5
const GLITCH_BEND = 0.4
const GLITCH_MARKS_SEC = [0.01, 0.1] as const
const glitchX = (seconds: number, box: Box): number =>
  box.x + box.w * Math.pow(clamp(seconds / GLITCH_SPAN_SEC, 0, 1), GLITCH_BEND)
const glitchSecondsAt = (x: number, box: Box): number =>
  GLITCH_SPAN_SEC * Math.pow(Math.max(0, (x - box.x) / box.w), 1 / GLITCH_BEND)

/** `GlitchKit::window`: a sound `seconds` long at `t`, rounded over `round` at each end. */
function glitchWindow(t: number, seconds: number, round: number): number {
  const from = Math.min(t, seconds - t)
  if (from < 0) return 0
  return from >= round ? 1 : 0.5 - 0.5 * Math.cos((Math.PI * from) / round)
}

/**
 * A band struck at `from` and left to ring: a stroke as tall as it is struck,
 * falling to nothing where the band has rung 60 dB down, `ring` seconds on.
 * What dies away in a lane is drawn as its level in dB, as in the drums' pads.
 */
function glitchStroke(ctx: Ctx, box: Box, from: number, high: number, ring: number): void {
  const mid = box.y + box.h / 2
  const first = Math.floor(glitchX(from, box))
  for (let x = first; x < box.x + box.w; x++) {
    const since = glitchSecondsAt(x + 0.5, box) - from
    const tall = x === first ? high : high * shareOfDb((-60 * since) / ring)
    if (tall < 0.35) break
    ctx.rect(x, mid - tall, 1, 2 * tall)
  }
}

/** `GlitchKit::render`, `kBit`: the bit's shift register, fifteen bits fed back from the first and the seventh, where it starts with no Scatter. */
const GLITCH_BIT_SEED = (0xc2b2ae35 & 0x7fff) | 1
const glitchShift = (shift: number): number => (shift >> 1) | (((shift ^ (shift >> 6)) & 1) << 14)

/**
 * One fault in its lane, level against time, as `GlitchKit::render` makes it
 * for a hit `duration` times the voice's length, tuned `ratio`, `amp` of the
 * lane high. A band that is struck is a stroke that rings off; a sine burst
 * is a solid block and a slice of noise a dotted one, each with the ends Edge
 * gives it; the static is steps that die away; the buzz is its pulses; the two
 * sweeps are hollow, with their pitch drawn through them from 100 Hz at the
 * foot of the lane to 10 kHz at its top; the stutter is its grains, each
 * softer; the bit is its register's own bits, one to a column, since its
 * clock is far too fast to draw. The noise and the crackle's pattern are
 * drawn by chance in the device: here the dots are a fixed texture and the
 * crackle's pulses stand where they fall on average.
 */
function glitchGlyph(
  ctx: Ctx,
  box: Box,
  voice: number,
  duration: number,
  density: number,
  edge: number,
  ratio: number,
  seconds: number,
  amp: number,
  sampleRate: number,
): void {
  const mid = box.y + box.h / 2
  const high = amp * (box.h / 2 - 0.5)
  const round = glitchRound(edge)
  const ring = GLITCH_CLICK_RING * duration
  const last = Math.min(box.x + box.w, Math.max(box.x + 1, Math.round(glitchX(seconds, box))))
  if (voice === CLICK || voice === DOUBLE) {
    const period = glitchPeriod(voice, density)
    for (let k = 0; k < glitchEvents(voice, density); k++)
      glitchStroke(ctx, box, k * period, high * Math.pow(0.6, k), ring)
  } else if (voice === CRACKLE) {
    // Fewer and softer as the burst runs out: the rate falls as the square of what is left.
    const span = 0.25 * duration
    const rate = 10 * Math.pow(2, 4 * density)
    glitchStroke(ctx, box, 0, high, ring)
    for (let k = 1; 3 * k < rate; k++) {
      const left = Math.cbrt(1 - (3 * k) / rate)
      glitchStroke(ctx, box, span * (1 - left), high * 0.7 * (0.5 + 0.5 * left), ring)
    }
  } else if (voice === BUZZ) {
    const out = glitchBuzzRing(ratio, sampleRate)
    const pulses = glitchBuzzPulses(duration, ratio, sampleRate)
    for (let k = 0; k < pulses; k++) glitchStroke(ctx, box, k / (GLITCH_BUZZ_HZ * ratio), high, out)
  } else if (voice === STUTTER) {
    const period = glitchPeriod(voice, density)
    const grain = Math.min(0.006 * duration, 0.9 * period)
    const events = glitchEvents(voice, density)
    for (let k = 0; k < events; k++) {
      const from = Math.round(glitchX(k * period, box))
      const to = Math.max(from + 1, Math.round(glitchX(k * period + grain, box)))
      for (let x = from; x < to && x < box.x + box.w; x++) {
        const t = clamp(glitchSecondsAt(x + 0.5, box) - k * period, 0, grain)
        const tall = Math.max(
          0.5,
          high * Math.pow(0.86, k) * glitchWindow(t, grain, Math.min(round, grain / 2)),
        )
        ctx.rect(x, mid - tall, 1, 2 * tall)
      }
    }
  } else {
    let shift = GLITCH_BIT_SEED
    for (let x = box.x; x < last; x++) {
      const t = Math.min(glitchSecondsAt(x + 0.5, box), seconds)
      const open = glitchWindow(t, seconds, Math.min(round, seconds / 2))
      const tall = Math.max(0.5, high * open)
      if (voice === PIP) ctx.rect(x, mid - tall, 1, 2 * tall)
      else if (voice === POP) {
        // A cycle and a half of a low sine under a falling window; Edge full up starts it on the crest.
        const wave =
          Math.sin(2 * Math.PI * (GLITCH_POP_HZ * ratio * t + 0.25 * edge)) *
          (round > 0 && t < round ? 0.5 - 0.5 * Math.cos((Math.PI * t) / round) : 1) *
          (0.5 + 0.5 * Math.cos((Math.PI * t) / seconds))
        const reach = high * wave
        ctx.rect(x, Math.min(mid, mid - reach), 1, Math.max(0.5, Math.abs(reach)))
      } else if (voice === CUT) {
        for (let row = -Math.round(tall); row < Math.round(tall); row++)
          if (stipple(x, row + 8) < 0.5) ctx.rect(x, mid + row, 1, 1)
      } else if (voice === STATIC) {
        // Held steps of noise, falling 60 dB over the voice's length; each is drawn far wider than it is.
        const step = 2 * stipple(x >> 1, 5) - 1
        const reach = tall * shareOfDb((-60 * t) / seconds) * step
        ctx.rect(x, Math.min(mid, mid - reach), 1, Math.max(0.5, Math.abs(reach)))
      } else if (voice === BIT) {
        if (((x - box.x) & 1) === 0) shift = glitchShift(shift)
        ctx.rect(x, shift & 1 ? mid - tall : mid, 1, tall)
      } else {
        // The zap and the chirp: the outline of the burst, and its pitch on its way through it.
        const from = (voice === ZAP ? GLITCH_ZAP_HZ[0] : GLITCH_CHIRP_HZ[0]) * ratio
        const to = (voice === ZAP ? GLITCH_ZAP_HZ[1] : GLITCH_CHIRP_HZ[1]) * ratio
        const hz = from * Math.pow(to / from, t / seconds)
        const at = mid + tall - 2 * tall * clamp(Math.log10(hz / 100) / 2, 0, 1)
        if (x === box.x || x === last - 1) ctx.rect(x, mid - tall, 1, 2 * tall)
        else {
          ctx.rect(x, mid - tall, 1, 1)
          ctx.rect(x, mid + tall - 1, 1, 1)
          ctx.rect(x, clamp(at - 0.75, mid - tall, mid + tall - 1.5), 1, 1.5)
        }
      }
    }
  }
}

interface GlitchParts {
  /** The baseline of the words. */
  words: number
  /** The twelve lanes, two columns of six in key order, and whether there is room to name them. */
  lanes: Box
  named: boolean
  /** The pip as Crush holds it, the kit's sounds under Tone's curve, and where they sit. */
  crush: Box
  tone: Box
  stage: Box
  foot: Box
}

const GLITCH_ROWS = FAULTS / 2
/** The room a lane's name takes: "Crackle" and "Stutter" at 8 px. */
const GLITCH_NAME_WIDE = 32

function glitchParts(view: Size): GlitchParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const foot: Box = { x: all.x, y: all.y + all.h - 6, w: all.w, h: 6 }
  const high = 12
  const y = foot.y - 3 - high
  const gap = all.w < 160 ? 5 : 7
  const room = all.w - 2 * gap
  const crush = Math.round(room * 0.22)
  const stage = Math.round(room * 0.3)
  return {
    words: all.y + 7,
    lanes: { x: all.x, y: all.y + 10, w: all.w, h: y - 2 - (all.y + 10) },
    named: all.w >= 160,
    crush: { x: all.x, y, w: crush, h: high },
    tone: { x: all.x + crush + gap, y, w: room - crush - stage, h: high },
    stage: { x: all.x + all.w - stage, y, w: stage, h: high },
    foot,
  }
}

/** The lane of a fault: its key's place down the two columns, with a pixel between lanes. */
function glitchLane(voice: number, parts: GlitchParts): Box {
  const { lanes } = parts
  const column = Math.floor(voice / GLITCH_ROWS)
  const row = voice % GLITCH_ROWS
  const wide = Math.floor((lanes.w - 4) / 2)
  const y = Math.round(lanes.y + (row * lanes.h) / GLITCH_ROWS)
  return {
    x: lanes.x + column * (lanes.w - wide),
    y,
    w: wide,
    h: Math.round(lanes.y + ((row + 1) * lanes.h) / GLITCH_ROWS) - y - 1,
  }
}
/** Where a fault is drawn in its lane: after its name, where there is one. */
const glitchTrack = (lane: Box, named: boolean): Box =>
  named ? { ...lane, x: lane.x + GLITCH_NAME_WIDE, w: lane.w - GLITCH_NAME_WIDE } : lane
/** Where the lane of a fault stands on a display of that size, and the part of it the fault is drawn in. */
export const glitchLaneBox = (view: Size, voice: number): Box =>
  glitchLane(voice, glitchParts(view))
export const glitchTrackBox = (view: Size, voice: number): Box =>
  glitchTrack(glitchLane(voice, glitchParts(view)), glitchParts(view).named)
/** Where the pitches of the faults stand under Tone's curve on a display of that size. */
export const glitchPitchBox = (view: Size): Box => glitchParts(view).tone

/** The scale of pitch under Tone's curve, and how far down the curve is drawn. */
const GLITCH_LOW_HZ = 50
const GLITCH_HIGH_HZ = 20000
const GLITCH_CURVE_DB = 24
const glitchPitchX = (hz: number, box: Box): number =>
  box.x +
  box.w * clamp(Math.log(hz / GLITCH_LOW_HZ) / Math.log(GLITCH_HIGH_HZ / GLITCH_LOW_HZ), 0, 1)
/** How high Tone's low-pass (`GlitchKit::set_tone`: a Butterworth at `toneHz`) leaves a pitch, as a place in the box. */
const glitchCurveY = (hz: number, toneHz: number, box: Box): number =>
  box.y +
  1 +
  (box.h - 2) * clamp(-dbOf(svfGain('low', hz / toneHz, Math.SQRT1_2)) / GLITCH_CURVE_DB, 0, 1)

/** `glitch_kit.h`, `kLevel`: the pip's level, at the hit a kit is balanced at. */
const GLITCH_PIP_LEVEL = 0.26 * (0.25 + 0.75 * DRUM_FIRM)

/**
 * What Crush makes of the pip, before Tone: two cycles of its sine, each
 * sample held until the crusher's clock ticks and rounded to its step
 * (`GlitchKit::take`). The clock starts with the hit, on the pip's crest.
 */
function glitchCrushed(frame: Paint, box: Box, crush: number, pipHz: number): void {
  const { ctx, colours } = frame
  fillRect(ctx, box, colours.ink, 0.07)
  const mid = box.y + box.h / 2
  const reach = box.h / 2 - 1.5
  const span = 2 / pipHz
  const clock = glitchCrushClock(crush)
  const step = glitchCrushStep(crush)
  const steps = Math.max(2, Math.floor(box.w * 4))
  ctx.beginPath()
  for (let s = 0; s <= steps; s++) {
    const t = (s / steps) * span
    const held = crush > 0 ? Math.floor(t * clock + 1e-9) / clock : t
    const wave = Math.cos(2 * Math.PI * pipHz * held)
    const out =
      crush > 0
        ? (step * Math.floor((wave * GLITCH_PIP_LEVEL) / step + 0.5)) / GLITCH_PIP_LEVEL
        : wave
    const x = box.x + (s / steps) * box.w
    if (s === 0) ctx.moveTo(x, mid - out * reach)
    else ctx.lineTo(x, mid - out * reach)
  }
  ctx.globalAlpha = INK.trace
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.globalAlpha = 1
}

interface GlitchState {
  /** The newest note on each key, as its place in the notes. */
  newest: Int32Array
  /** The fault last struck: the one the words are of. */
  last: number
}

const glitchKitDisplay = plateDisplay<GlitchState>({
  place: 'window',
  columns: 2,
  params: ['tune', 'length', 'tone', 'edge', 'density', 'crush', 'scatter', 'spread'],
  live: { signal: true, notes: true },
  info: 'Twelve lanes in key order, each fault as level against time, with a shade where Scatter may end it. A hit lights its lane while it sounds. Under them the pip as Crush holds it, the pitch of every fault under the curve of Tone, and where they sit.',
  init: () => ({ newest: new Int32Array(FAULTS), last: CLICK }),
  draw(frame) {
    const { ctx, colours, state, notes } = frame
    ground(frame)
    const tune = clamp(frame.value('tune'), -36, 36)
    const length = frame.value('length')
    const toneHz = glitchToneHz(frame.value('tone'))
    const edge = clamp(frame.value('edge'), 0, 1)
    const density = clamp(frame.value('density'), 0, 1)
    const crush = clamp(frame.value('crush'), 0, 1)
    const scatter = clamp(frame.value('scatter'), 0, 1)
    const spread = clamp(frame.value('spread'), 0, 1)
    const rate = frame.sampleRate
    const parts = glitchParts(frame)
    const newest = newestByKey(notes, state.newest)
    const span = glitchLengthSpan(scatter)
    const home = Math.pow(2, tune / 12)

    // What Crush makes of the pip, at the kit's own tuning.
    glitchCrushed(frame, parts.crush, crush, glitchFromHz(PIP, home, DRUM_FIRM, rate))

    // Tone: its curve over the pitch of every fault, each a bar as high as the curve lets it through.
    const curve = parts.tone
    const floor = curve.y + curve.h
    fillRect(ctx, curve, colours.ink, 0.07)
    ctx.beginPath()
    for (let x = 0; x <= curve.w; x++) {
      const hz = GLITCH_LOW_HZ * Math.pow(GLITCH_HIGH_HZ / GLITCH_LOW_HZ, x / curve.w)
      const y = glitchCurveY(hz, toneHz, curve)
      if (x === 0) ctx.moveTo(curve.x, y)
      else ctx.lineTo(curve.x + x, y)
    }
    ctx.globalAlpha = INK.trace
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.globalAlpha = 1
    /** A pitch under the curve: a bar as high as the curve lets it through, as wide as `out` times either way. */
    const bar = (hz: number, out: number, colour: string): void => {
      const lit = colour !== colours.ink
      const x = Math.round(glitchPitchX(hz / out, curve))
      const wide = Math.max(lit ? 2 : 1, glitchPitchX(hz * out, curve) - x)
      const y = glitchCurveY(hz, toneHz, curve) + 2
      fillRect(ctx, { x, y, w: wide, h: Math.max(1, floor - y) }, colour, lit ? 1 : INK.back)
    }
    /** A fault's pitch under the curve; a sweep is a bar at each end and a line between. `wander` is semitones either way. */
    const pitched = (
      voice: number,
      ratio: number,
      gain: number,
      wander: number,
      colour: string,
    ) => {
      const from = glitchFromHz(voice, ratio, gain, rate)
      const to = glitchToHz(voice, ratio, gain, rate)
      const out = Math.pow(2, wander / 12)
      bar(from, out, colour)
      if (from === to) return
      bar(to, out, colour)
      const x = glitchPitchX(Math.min(from, to), curve)
      const wide = glitchPitchX(Math.max(from, to), curve) - x
      fillRect(
        ctx,
        { x, y: floor - 1, w: wide, h: 1 },
        colour,
        colour === colours.ink ? INK.back : 1,
      )
    }
    for (let voice = 0; voice < FAULTS; voice++) pitched(voice, home, DRUM_FIRM, 0, colours.ink)

    // The stage: the line between the speakers, the reach of Scatter's throw about its middle.
    const middle = parts.stage.x + parts.stage.w / 2
    const reach = parts.stage.w / 2 - 2
    const level = parts.stage.y + Math.round(parts.stage.h / 2)
    const thrown = glitchThrow(CLICK, spread, scatter) * reach
    rule(ctx, middle - reach, level, middle + reach, level, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    rule(ctx, middle, parts.stage.y, middle, parts.stage.y + parts.stage.h, {
      colour: colours.ink,
      alpha: INK.grid,
    })
    fillRect(ctx, { x: middle - thrown, y: level - 2, w: 2 * thrown, h: 5 }, colours.ink, INK.fill)

    let said = -1
    let saidAt = Infinity
    let saidSeconds = 0
    for (let voice = 0; voice < FAULTS; voice++) {
      const lane = glitchLane(voice, parts)
      const track = glitchTrack(lane, parts.named)
      // At rest a lane is its fault in the octave a kit is written in, struck firmly, the lane high.
      let tuning = tune
      let gain = DRUM_FIRM
      let lit = 0
      const note = newest[voice] >= 0 ? notes[newest[voice]] : null
      if (note) {
        const struckAt = glitchTuning(note.frequency, tune)
        const hard = clamp(note.gain, 0, 1)
        // It sounds for certain till the shortest Scatter may make it, and may till the longest.
        const least = glitchLasts(voice, length, struckAt, 1 / span, density, edge, hard, rate)
        const most = glitchLasts(voice, length, struckAt, span, density, edge, hard, rate)
        lit = note.age < least ? 1 : note.age < most ? 0.5 : 0
        if (lit > 0) {
          tuning = struckAt
          gain = hard
        }
      }
      const duration = glitchDuration(length, tuning)
      const ratio = Math.pow(2, tuning / 12)
      const seconds = glitchSeconds(voice, duration, density, edge, ratio, gain, rate)
      fillRect(ctx, track, colours.ink, 0.07)
      for (const mark of GLITCH_MARKS_SEC) {
        const x = Math.round(glitchX(mark, track))
        rule(ctx, x, track.y, x, track.y + track.h, { colour: colours.ink, alpha: INK.grid })
      }
      if (span > 1) {
        // Only what Length sets is stretched: the stutter's last grain, not the repeats before it.
        const least = glitchLasts(voice, length, tuning, 1 / span, density, edge, gain, rate)
        const most = glitchLasts(voice, length, tuning, span, density, edge, gain, rate)
        const from = glitchX(least, track)
        fillRect(
          ctx,
          { x: from, y: track.y, w: glitchX(most, track) - from, h: track.h },
          colours.ink,
          INK.fill,
        )
      }
      ctx.beginPath()
      glitchGlyph(
        ctx,
        track,
        voice,
        duration,
        density,
        edge,
        ratio,
        seconds,
        lit > 0 ? glitchHitLevel(gain) : 1,
        rate,
      )
      ctx.globalAlpha = lit > 0 ? lit : 1
      ctx.fillStyle = lit > 0 ? colours.accent : colours.ink
      ctx.fill()
      ctx.globalAlpha = 1
      if (parts.named)
        text(frame, GLITCH_NAMES[voice], lane.x + 1, lane.y + lane.h - 1, {
          colour: lit > 0 ? colours.accent : colours.ink,
        })
      // Where it sits; a hit is somewhere within Scatter's throw of there.
      const at = middle + glitchPlace(voice, spread, scatter) * reach
      rule(ctx, at, level - 3, at, level + 4, { colour: colours.ink, alpha: INK.back })
      if (!note || lit === 0) continue
      const far = glitchThrow(voice, spread, scatter) * reach
      fillRect(
        ctx,
        { x: Math.min(at - far, at - 1), y: level - 3, w: Math.max(2 * far, 2), h: 7 },
        colours.accent,
        lit,
      )
      pitched(voice, ratio, gain, glitchPitchSpan(scatter), colours.accent)
      const now = glitchX(note.age, track)
      rule(ctx, now, track.y, now, track.y + track.h, { colour: colours.accent })
      if (note.age < saidAt) {
        saidAt = note.age
        said = voice
        saidSeconds = seconds
      }
    }
    if (said >= 0) state.last = said
    const shown = state.last
    if (said < 0) {
      const duration = glitchDuration(length, tune)
      saidSeconds = glitchSeconds(shown, duration, density, edge, home, DRUM_FIRM, rate)
    }

    levelFoot(frame, parts.foot, outShare(frame))

    // The words: the fault that is shown, and how long it lasts.
    text(frame, GLITCH_NAMES[shown], parts.lanes.x, parts.words)
    text(frame, kitSecondsText(saidSeconds), parts.lanes.x + parts.lanes.w, parts.words, {
      align: 'right',
    })
  },
})

export const KIT_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  'drum-kit': { display: drumKitDisplay, face: ['kit', 'tune', 'length', 'tone'] },
  'glitch-kit': { display: glitchKitDisplay, face: ['length', 'tone', 'density', 'crush'] },
}
