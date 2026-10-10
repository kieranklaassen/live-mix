// The display of the String Bass: plucked electric, fretless and upright strings.
//
// It is the instrument seen from above, its bridge at the left: four heavy
// strings, the hand that plucks them and the hand that mutes them, and what
// hears them (a pickup, or a wooden body). Under the strings stand two small
// plots of the one note: how it dies, in seconds, and what is heard of it, by
// frequency. A played note swings on the string the device tunes for it, from
// the bridge to its fret, for as long as the device's own figures let it ring.
//
// The device has four strings to ring and tunes any of them as E, A, D or G
// for the note it plays, so two keys can sound on what the picture shows as
// one string. Which keys have a string at all is worked out as the device
// works it out (`stringBassVoices`): a fifth key takes the quietest.

import {
  INK,
  clamp,
  dot,
  fillRect,
  gainToDb,
  ground,
  handle,
  hzOfX,
  lerp,
  onePoleDb,
  rule,
  text,
  xOfHz,
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
import { partialSeconds, stringLoss, type StringLoss } from './instrument-guitars'
import { levelFoot, outShare, pitchName } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>
type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>

// --- The device's figures ----------------------------------------------------

/** `string_bass.h`, `kOpenHz`: the open strings, E1 to G2. */
const BASS_OPEN_HZ = [41.2034, 55, 73.4162, 97.9989] as const

/** `string_bass.h`, `kTypes`: what makes a type, as far as the picture follows it. */
interface BassKind {
  name: string
  /** Share of Sustain the fundamental rings; the share of that the partials near `highHz` ring. */
  ring: number
  highShare: number
  highHz: number
  /** The pluck's low-pass from a finger to a pick. */
  pickSoftHz: number
  pickHardHz: number
  /** The pickup's distance from the bridge over the open string (0: none), and where its resonance sits. */
  pickup: number
  humpHz: number
  /** The band the rattle or the bloom is heard in. */
  growlHz: number
  growlQ: number
  /**
   * How far under the fundamental of a note plucked at the default place the
   * top of that band stands with Growl full up, in dB: for Fretless at the
   * top of the bloom, for the other two at the pluck of a key played as hard
   * as can be. The header gives the height of one tap and not what a train of
   * them comes to, so these were measured on the device from E1 to D3 with
   * Tone open, as the strongest partial of what Growl adds: Fretless held
   * within 3 dB and Electric within 6, a little weaker the higher the key.
   * Upright held within 6 up to A1; above that its rattle is over in a
   * twentieth of a second, a burst too short for a height to be read from,
   * and the figure of its low keys is drawn for it.
   */
  growlDb: number
  /** Evens out the types, and the keys above A2. */
  level: number
  rise: number
}
const BASS_KINDS: readonly BassKind[] = [
  {
    name: 'Electric',
    ring: 1,
    highShare: 0.11,
    highHz: 2000,
    pickSoftHz: 300,
    pickHardHz: 7000,
    pickup: 0.17,
    humpHz: 2600,
    growlHz: 1700,
    growlQ: 2,
    growlDb: -22,
    level: 1,
    rise: 0.5,
  },
  {
    name: 'Fretless',
    ring: 0.85,
    highShare: 0.1,
    highHz: 2000,
    pickSoftHz: 170,
    pickHardHz: 2400,
    pickup: 0.14,
    humpHz: 2200,
    growlHz: 1000,
    growlQ: 4,
    growlDb: -11,
    level: 1,
    rise: 0.5,
  },
  {
    name: 'Upright',
    ring: 0.4,
    highShare: 0.09,
    highHz: 1000,
    pickSoftHz: 230,
    pickHardHz: 2400,
    pickup: 0,
    humpHz: 0,
    growlHz: 480,
    growlQ: 0.9,
    growlDb: -20,
    level: 1.2,
    rise: 0.15,
  },
]
const BASS_FRETLESS = 1
const BASS_UPRIGHT = 2
const bassKind = (type: number): BassKind =>
  BASS_KINDS[clamp(Math.round(type), 0, BASS_KINDS.length - 1)]

/** `string_bass.h`, `kMaxVoices`: the strings that can ring at once. */
const BASS_VOICES = 4
/** `kReferenceHz`: where Sustain is the ring time. */
const BASS_REFERENCE_HZ = 55
/** `kLowestHz` and `kHighestHz`: the pitches it plays. */
const BASS_LOWEST_HZ = 16
const BASS_HIGHEST_HZ = 4200
/** `kPickupFold`: past this share of the string the pickup is taken to stay where it is. */
const BASS_PICKUP_FOLD = 0.38
/** `kMutedSeconds`, `kMuteDulls`, `kMuteSoftens`: what Mute at 1 leaves of the ring, of its top and of the pluck. */
const BASS_MUTED_SECONDS = 0.12
const BASS_MUTE_DULLS = 0.8
const BASS_MUTE_SOFTENS = 0.6
/** `kShortestHighSeconds` and `kFilterShare`. */
const BASS_SHORTEST_HIGH = 0.012
const BASS_FILTER_SHARE = 0.6
/** `kSameRatio`: a quarter tone either side is the same string. */
const BASS_SAME_RATIO = 1.0293
/** `kStrokeLevel` and `kSilence`: the string's swing per unit of pluck, and the swing under which a string is let go. */
const BASS_STROKE_LEVEL = 2.5
const BASS_SILENCE_DB = -100
/** `kPitchTilt`, `kTiltLowest`, `kTiltKnee`, `kTiltHighest`: level against pitch. */
const BASS_PITCH_TILT = 0.25
const BASS_TILT_LOWEST = 0.375
const BASS_TILT_KNEE = 2
const BASS_TILT_HIGHEST = 4
/** `kBuzzHeight`: the string taps the neck when it swings past this height. */
const BASS_BUZZ_HEIGHT = 1
/** `kBloomDelaySeconds`, `kBloomSeconds`, `kBloomLowHz`, `kBloomSagSeconds`, `kBloomFloor`. */
const BASS_BLOOM_DELAY = 0.02
const BASS_BLOOM_SECONDS = 0.13
const BASS_BLOOM_LOW_HZ = 520
const BASS_BLOOM_SAG = 0.8
const BASS_BLOOM_FLOOR = 0.25
/** `kBodyHz`, `kBodyQ`, `kBodyGain`: the body of the upright (air, top plate, back). */
const BASS_BODY_HZ = [66, 112, 187] as const
const BASS_BODY_Q = [3, 3.5, 4] as const
const BASS_BODY_GAIN = [1, 0.8, 0.7] as const
/** `kDirectLoss` and `kBodyLevel`: what Resonance takes from the upright's string and what the body adds. */
const BASS_DIRECT_LOSS = 0.3
const BASS_BODY_LEVEL = 0.9
/** `kToneLowHz` and `kToneHighHz`: the tone control's low-pass, from one end to the other. */
const BASS_TONE_LOW_HZ = 180
const BASS_TONE_HIGH_HZ = 9000
/** `kHumpLowQ` and `kHumpHighQ`: the pickup's low-pass, no hump at Resonance 0 and about 10 dB at 1. */
const BASS_HUMP_LOW_Q = 0.55
const BASS_HUMP_HIGH_Q = 3.2
/**
 * How soon a plucked string's swing settles, as a share of its fundamental's
 * ring, by type (0 for Fretless, which does not rattle). The swing is all its
 * partials and the top of them goes first, so it falls faster than the
 * fundamental; the header has no figure for it. Measured on the device with
 * keys from E1 to G2 played hard: against the time the fundamental alone
 * would have taken to come down to the height, the rattle of Electric stopped
 * after 0.35 to 0.85 of it, most often near 0.65, and that of Upright, whose
 * top is gone sooner, after 0.2 to 0.6, most often near 0.4. Higher up or
 * under a soft finger it stops sooner still.
 */
const BASS_SWING_SETTLES = [0.65, 0, 0.4] as const

/** `StringBass::note_on`: how hard a key is played, 0..1; a gain that is not a number is taken for a middling one. */
const bassGain = (gain: number): number => (gain === gain ? clamp(gain, 0, 1) : 0.5)

/** `StringBass::note_on`: the pitch a key is played at. */
export const stringBassHz = (hz: number, sampleRate: number): number =>
  clamp(hz, BASS_LOWEST_HZ, Math.min(BASS_HIGHEST_HZ, 0.1 * sampleRate))

/** `StringBass::string_for`: the string a note is played on, 0 the low E: the highest whose open pitch is not above it. */
export function stringBassString(hz: number): number {
  let string = 0
  for (let s = 1; s < BASS_OPEN_HZ.length; s++) if (hz >= BASS_OPEN_HZ[s] * 0.999) string = s
  return string
}

/** `StringBass::fret_ratio`: the open string's length over the note's. Under 1 below the low E, which lengthens that string. */
export const stringBassFretRatio = (hz: number): number => hz / BASS_OPEN_HZ[stringBassString(hz)]

/** `StringBass::pickup_fraction`: the pickup's place on a note's sounding length; 0 on Upright, which has none. */
export function stringBassPickupFraction(type: number, hz: number): number {
  const open = bassKind(type).pickup
  return open > 0 ? clamp(open * stringBassFretRatio(hz), 0.02, BASS_PICKUP_FOLD) : 0
}

/** `StringBass::ring_seconds`: seconds the fundamental of a held note at `hz` takes to fall 60 dB. */
export function stringBassRingSeconds(
  type: number,
  hz: number,
  sustain: number,
  mute: number,
): number {
  const open = sustain * bassKind(type).ring * clamp(Math.sqrt(BASS_REFERENCE_HZ / hz), 0.3, 1.3)
  const muted = Math.min(open, BASS_MUTED_SECONDS)
  return open * Math.pow(muted / open, clamp(mute, 0, 1))
}

/**
 * `StringBass::high_seconds`: seconds its partials near the type's high
 * frequency take, the fundamental ringing `seconds`. The loop's one low-pass
 * may supply at most a share of the fundamental's own loss, so the top is gone
 * no sooner than a filter that gentle allows.
 */
export function stringBassHighSeconds(
  type: number,
  hz: number,
  seconds: number,
  mute: number,
): number {
  const kind = bassKind(type)
  const highHz = Math.max(kind.highHz, 2 * hz)
  const loss = 60 / (hz * seconds)
  const corner = Math.pow(10, 0.1 * BASS_FILTER_SHARE * loss) - 1
  const highLoss =
    loss * (1 - BASS_FILTER_SHARE) + 10 * Math.log10(1 + corner * (highHz / hz) * (highHz / hz))
  const soonest = 60 / (hz * highLoss)
  const share = kind.highShare * (1 - BASS_MUTE_DULLS * clamp(mute, 0, 1))
  return Math.max(seconds * share, BASS_SHORTEST_HIGH, soonest)
}

/** `StringBass::amplitude_of`: how far a key played as hard as `gain` pulls its string, 1 a full pluck. The softest key still plucks. */
export function stringBassPluckLevel(gain: number): number {
  const hard = bassGain(gain)
  return 0.2 + 0.8 * hard * Math.sqrt(hard)
}

/**
 * `StringBass::strike`: the corner of the pluck's low-pass, from the flesh of
 * a finger to a pick by Touch, brighter for a harder key and duller under the
 * muting hand, never under one and a half times the note.
 */
export function stringBassPickHz(
  type: number,
  touch: number,
  gain: number,
  mute: number,
  hz: number,
): number {
  const kind = bassKind(type)
  const pick =
    kind.pickSoftHz *
    Math.pow(kind.pickHardHz / kind.pickSoftHz, clamp(touch, 0, 1)) *
    (0.3 + 1.1 * bassGain(gain)) *
    (1 - BASS_MUTE_SOFTENS * clamp(mute, 0, 1))
  return Math.max(pick, 1.5 * hz)
}

/** `StringBass::apply`, `kTone`: the corner of the tone control's low-pass. */
export const stringBassToneHz = (tone: number): number =>
  BASS_TONE_LOW_HZ * Math.pow(BASS_TONE_HIGH_HZ / BASS_TONE_LOW_HZ, clamp(tone, 0, 1))

/** `StringBass::apply`, `kResonance`: the sharpness of the pickup's low-pass. */
export const stringBassHumpQ = (resonance: number): number =>
  lerp(BASS_HUMP_LOW_Q, BASS_HUMP_HIGH_Q, clamp(resonance, 0, 1))

/**
 * How far a string has fallen, in dB under a full pluck: plucked `since`
 * seconds ago as hard as `gain`, its key let go `released` seconds ago (null
 * while it is held). `StringBass::begin_release`: key up is a fade of 60 dB
 * over Release laid over the string, which goes on dying as it was. A key let
 * go before its pluck came is plucked all the same and let go at once.
 */
export function stringBassDb(
  since: number,
  gain: number,
  released: number | null,
  ring: number,
  release: number,
): number {
  const after = released === null ? 0 : Math.min(released, since)
  return gainToDb(stringBassPluckLevel(gain)) - 60 * (since / ring + after / release)
}

/** `StringBass::control`, Fretless: how far the band of the bloom has risen `seconds` after the pluck, 0..1. */
export function stringBassBloomRise(seconds: number): number {
  const t = clamp((seconds - BASS_BLOOM_DELAY) / BASS_BLOOM_SECONDS, 0, 1)
  return t * t * (3 - 2 * t)
}

/** `StringBass::control`: how tall the taps of the bloom are against the string's swing: in over 150 ms, then sagging to a quarter. */
export const stringBassBloom = (seconds: number): number =>
  stringBassBloomRise(seconds) *
  (BASS_BLOOM_FLOOR + (1 - BASS_BLOOM_FLOOR) * Math.exp(-seconds / BASS_BLOOM_SAG))

/** `StringBass::control`: where the band of the bloom sits, from 520 Hz at the pluck to the type's own. */
export const stringBassBloomHz = (seconds: number): number =>
  lerp(BASS_BLOOM_LOW_HZ, BASS_KINDS[BASS_FRETLESS].growlHz, stringBassBloomRise(seconds))

/**
 * `StringBass::strike`, `kPitchTilt`: the level a string is given for its
 * pitch, as a gain against the open A of an Electric. Higher notes have fewer
 * partials under the tone control and die sooner, so they are given a little
 * back: the fourth root of the note over A1 from E0 to A2, the type's own
 * power from there to A4.
 */
export function stringBassTilt(type: number, hz: number): number {
  const kind = bassKind(type)
  return (
    kind.level *
    Math.pow(clamp(hz / BASS_REFERENCE_HZ, BASS_TILT_LOWEST, BASS_TILT_KNEE), BASS_PITCH_TILT) *
    Math.pow(clamp(hz / (BASS_REFERENCE_HZ * BASS_TILT_KNEE), 1, BASS_TILT_HIGHEST), kind.rise)
  )
}

/** `StringBass::strike`: the bloom is for the bass register; from 600 Hz up there is none. */
export const stringBassBloomReach = (hz: number): number => clamp(1.5 - hz / 400, 0, 1)

/**
 * `StringBass::render`, Electric and Upright: how far the swing of a string
 * plucked `since` seconds ago stands over the height at which it taps the
 * neck, as a share of what a full pluck's does at first; 0 for a soft key,
 * for one that has settled and on Fretless. The swing starts at
 * `kStrokeLevel` times the pluck and settles as `BASS_SWING_SETTLES` says.
 */
export function stringBassRattle(type: number, since: number, gain: number, ring: number): number {
  const settles = BASS_SWING_SETTLES[clamp(Math.round(type), 0, BASS_KINDS.length - 1)]
  if (settles <= 0) return 0
  const swing =
    BASS_STROKE_LEVEL * stringBassPluckLevel(gain) * Math.pow(10, (-3 * since) / (ring * settles))
  return clamp((swing - BASS_BUZZ_HEIGHT) / (BASS_STROKE_LEVEL - BASS_BUZZ_HEIGHT), 0, 1)
}

/** `StringBass::same_pitch`. */
const bassSamePitch = (a: number, b: number): boolean =>
  a < b * BASS_SAME_RATIO && b < a * BASS_SAME_RATIO

/** Two times nearer than this are one instant: a key struck again is let go, in the list, at the very moment it is struck. */
const BASS_SAME_INSTANT = 1e-4

/**
 * `Voice::level`: the swing of the string `owner` plucked, as it was `ago`
 * seconds ago, in dB (0 is a swing of one). The swing is taken to fall with
 * the fundamental, which is what the device compares when it looks for its
 * quietest string.
 */
function bassSwingDb(owner: DisplayNote, ago: number, ring: number, release: number): number {
  const since = owner.age - ago
  const after = owner.released === null ? 0 : clamp(owner.released - ago, 0, since)
  return (
    gainToDb(BASS_STROKE_LEVEL * stringBassPluckLevel(owner.gain)) -
    60 * (since / ring + after / release)
  )
}

/**
 * `StringBass::note_on` and `kit::VoicePool::note_on`: which key has each of
 * the four strings now, as an index into `notes` (-1 for a string that was
 * never taken), written into `into`. A key takes its own string if it is
 * still down, else a string that still rings within a quarter tone of it,
 * else a free one (the one longest unused), else the quietest of those let
 * go, else the quietest of all. A key whose string was taken is no longer
 * there. `stamps` is the pool's own count of when each string was taken.
 */
export function stringBassVoices(
  notes: readonly DisplayNote[],
  type: number,
  sustain: number,
  mute: number,
  release: number,
  sampleRate: number,
  into: number[],
  stamps: number[] = [],
): number[] {
  into.length = BASS_VOICES
  into.fill(-1)
  stamps.length = BASS_VOICES
  stamps.fill(0)
  let counter = 0
  for (let index = 0; index < notes.length; index++) {
    const note = notes[index]
    // `note_on` drops a pitch that is not a number.
    if (!(note.frequency === note.frequency)) continue
    const hz = stringBassHz(note.frequency, sampleRate)
    let own = -1
    let same = -1
    let free = -1
    let fading = -1
    let fadingDb = Infinity
    let quiet = -1
    let quietDb = Infinity
    for (let v = 0; v < BASS_VOICES; v++) {
      const owner = into[v] < 0 ? null : notes[into[v]]
      const ownerHz = owner ? stringBassHz(owner.frequency, sampleRate) : 0
      const level = owner
        ? bassSwingDb(owner, note.age, stringBassRingSeconds(type, ownerHz, sustain, mute), release)
        : -Infinity
      if (!owner || level < BASS_SILENCE_DB) {
        if (free < 0 || stamps[v] < stamps[free]) free = v
        continue
      }
      const held = owner.released === null || owner.released <= note.age + BASS_SAME_INSTANT
      if (held && owner.id === note.id) own = v
      if (same < 0 && bassSamePitch(ownerHz, hz)) same = v
      if (!held && (level < fadingDb || (level === fadingDb && stamps[v] < stamps[fading]))) {
        fading = v
        fadingDb = level
      }
      if (level < quietDb || (level === quietDb && stamps[v] < stamps[quiet])) {
        quiet = v
        quietDb = level
      }
    }
    let choice = own >= 0 ? own : same
    if (choice < 0) {
      choice = free >= 0 ? free : fading >= 0 ? fading : quiet
      stamps[choice] = ++counter
    }
    into[choice] = index
  }
  return into
}

/** What a second-order low-pass of sharpness `q` at `cornerHz` does to a frequency, as a gain (`kit::Svf::lowpass`). */
const lowpassGain = (hz: number, cornerHz: number, q: number): number => {
  const x = hz / cornerHz
  return 1 / Math.hypot(1 - x * x, x / q)
}

/** What a band-pass of sharpness `q` at `centreHz` does to a frequency, in dB: none at its centre (`kit::Svf::bandpass`). */
const bandDb = (hz: number, centreHz: number, q: number): number => {
  const x = hz / centreHz
  return gainToDb(x / q / Math.hypot(1 - x * x, x / q))
}

/**
 * `StringBass::process`: what stands between the strings and the output does
 * to a frequency, in dB. On Electric and Fretless the pickup's low-pass, its
 * hump as tall as Resonance; on Upright the string at the bridge, less what
 * Resonance takes of it, and the three resonances of the body it brings in.
 * Then the tone control, a low-pass at `toneHz`.
 */
export function stringBassHeardDb(
  type: number,
  hz: number,
  toneHz: number,
  resonance: number,
): number {
  const kind = bassKind(type)
  let gain: number
  if (kind.pickup > 0) {
    gain = lowpassGain(hz, kind.humpHz, stringBassHumpQ(resonance))
  } else {
    // The body's band-passes are summed as they are, each with its own turn of phase.
    const wood = clamp(resonance, 0, 1)
    let re = 1 - BASS_DIRECT_LOSS * wood
    let im = 0
    for (let mode = 0; mode < BASS_BODY_HZ.length; mode++) {
      const x = hz / BASS_BODY_HZ[mode]
      const a = x / BASS_BODY_Q[mode]
      const b = 1 - x * x
      const through = (BASS_BODY_LEVEL * wood * BASS_BODY_GAIN[mode]) / (a * a + b * b)
      re += through * a * a
      im += through * a * b
    }
    gain = Math.hypot(re, im)
  }
  return gainToDb(gain * lowpassGain(hz, toneHz, Math.SQRT1_2))
}

/**
 * What a pluck puts into a string's partial at `hz`, in dB under the pluck
 * itself: its own fall (`kit::PluckExciter`: 6 dB an octave from the note up,
 * and again from the pick's corner), the comb of the place it is plucked
 * (`set_pluck_position`) and, where there is a pickup, the comb of the place
 * it is heard, with what that takes from the fundamental given back
 * (`StringBass::strike`). `span` is how many partials wide the thing drawn
 * is: where a comb's teeth are finer than that, its mean is drawn.
 */
export function stringBassPluckDb(
  hz: number,
  noteHz: number,
  type: number,
  position: number,
  pickHz: number,
  span = 0,
): number {
  const n = hz / noteHz
  const comb = (place: number): number => {
    const teeth = 2 * Math.abs(Math.sin(Math.PI * n * place))
    return lerp(teeth, Math.SQRT2, clamp((span * place - 0.2) / 0.3, 0, 1))
  }
  let gain =
    comb(clamp(position, 0.03, 0.5)) / Math.sqrt((1 + n * n) * (1 + (hz / pickHz) * (hz / pickHz)))
  const pickup = stringBassPickupFraction(type, noteHz)
  if (pickup > 0) gain *= comb(pickup) / (2 * Math.sin(Math.PI * pickup))
  return gainToDb(gain)
}

// --- The picture -------------------------------------------------------------

/** A level that has fallen `seconds` into a ring of `ring` seconds to 60 dB under itself, as a gain. */
const rung = (seconds: number, ring: number): number => Math.pow(10, (-3 * seconds) / ring)

/** Under this share of its light a string is done. */
const BASS_DONE = 0.02
/** The note that stands at rest: the open A, where a note rings as long as Sustain says, played as the device's own middle key. */
const BASS_REST_HZ = BASS_REFERENCE_HZ
const BASS_REST_GAIN = 0.7
/** The seconds the plot of a note's dying spans, on a scale of ratios. */
const BASS_SHORT_SEC = 0.005
const BASS_LONG_SEC = 30
/** The frequencies and the levels the plot of what is heard spans. */
const BASS_LOW_HZ = 30
const BASS_HIGH_HZ = 8000
const BASS_TOP_DB = 12
const BASS_FOOT_DB = -48
/** Where on their slopes the two handles stand, in dB under the pluck: apart, so that neither covers the other. */
const BASS_RELEASE_AT_DB = -12
const BASS_SUSTAIN_AT_DB = -40
/** The frets of the electric's neck, and the ones a fretless marks on its edge. */
const BASS_FRETS = 20
const BASS_MARKS = [3, 5, 7, 9, 12, 15, 17, 19] as const
/** How heavy each string is drawn, low E first. */
const BASS_STRING_PX = [3, 2.4, 1.9, 1.4] as const
/** The corners of the softest finger and the hardest pick the hand is drawn between. */
const BASS_ROUND_HZ = 150
const BASS_POINT_HZ = 7000
/** How long the pluck itself is shown, and the thump of the upright's body. */
const BASS_PLUCK_SEC = 0.14
const BASS_THUMP_SEC = 0.12

interface BassParts {
  /** The strings: the bridge at `x`, the nut at `x + w`, the low E at the foot. */
  neck: Box
  /** How a note dies: seconds across, 60 dB from top to foot. */
  time: Box
  /** What is heard of it, by frequency. */
  colour: Box
  /** The baseline of the two scales' words. */
  lane: number
  foot: Box
}

function bassParts(view: Size): BassParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const foot: Box = { x: all.x, y: all.y + all.h - 4, w: all.w, h: 4 }
  const lane = foot.y - 3
  const tall = Math.max(12, Math.round(all.h * 0.24))
  const y = lane - 8 - tall
  const wide = Math.round((all.w - 9) * 0.46)
  const time: Box = { x: all.x + 2, y, w: wide, h: tall }
  const colour: Box = { x: time.x + wide + 6, y, w: all.w - 9 - wide, h: tall }
  const top = all.y + 15
  return {
    neck: { x: all.x + 5, y: top, w: all.w - 9, h: Math.max(16, y - 9 - top) },
    time,
    colour,
    lane,
    foot,
  }
}

const bassStringY = (neck: Box, string: number): number =>
  neck.y + neck.h * (1 - (string + 0.5) / BASS_OPEN_HZ.length)

const BASS_SPAN = Math.log(BASS_LONG_SEC / BASS_SHORT_SEC)
const xOfSeconds = (seconds: number, time: Box): number =>
  time.x + clamp(Math.log(Math.max(seconds, 1e-6) / BASS_SHORT_SEC) / BASS_SPAN, 0, 1) * time.w
const secondsOfX = (x: number, time: Box): number =>
  BASS_SHORT_SEC * Math.exp(clamp((x - time.x) / time.w, 0, 1) * BASS_SPAN)
/** Where a level under the pluck falls in the plot of a note's dying: 60 dB from its top to its foot. */
const yOfFall = (db: number, time: Box): number => time.y + clamp(-db / 60, 0, 1) * time.h
const yOfColour = (db: number, colour: Box): number =>
  colour.y + clamp((BASS_TOP_DB - db) / (BASS_TOP_DB - BASS_FOOT_DB), 0, 1) * colour.h

/** How pointed what plucks the string is, 0 the flesh of a thumb and 1 a hard pick, from the corner of its low-pass. */
const bassPoint = (pickHz: number): number =>
  clamp(Math.log(pickHz / BASS_ROUND_HZ) / Math.log(BASS_POINT_HZ / BASS_ROUND_HZ), 0, 1)

/**
 * What plucks the string, its tip at (`x`, `y`) and the rest above: round as
 * a fingertip where it is soft, drawn out to the point of a pick where it is
 * hard.
 */
function bassHand(
  frame: Paint,
  x: number,
  y: number,
  point: number,
  colour: string,
  alpha: number,
  size = 1,
): void {
  const { ctx } = frame
  const radius = size * lerp(3.3, 2.1, point)
  const reach = size * lerp(3.3, 5.4, point)
  // The two lines from the tip touch the round part this far round from the tip.
  const open = Math.acos(clamp(radius / reach, 0, 1))
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.arc(x, y - reach, radius, Math.PI / 2 + open, Math.PI / 2 - open + 2 * Math.PI)
  ctx.closePath()
  ctx.globalAlpha = alpha
  ctx.fillStyle = colour
  ctx.fill()
  ctx.globalAlpha = 1
}

/** The instrument at rest: its neck, its strings, what hears them and the two hands. */
function bassRest(frame: DisplayFrame<BassState>, parts: BassParts, type: number): void {
  const { ctx, colours } = frame
  const { neck } = parts
  const kind = bassKind(type)
  const xOf = (share: number): number => neck.x + share * neck.w
  const top = neck.y
  const low = neck.y + neck.h

  // The fingerboard, as far as an electric's twentieth fret.
  const boardEnd = xOf(Math.pow(2, -BASS_FRETS / 12))
  if (type === BASS_UPRIGHT) {
    // The wooden body under the strings, as much of it as Resonance lets be heard.
    const wood = clamp(frame.value('resonance'), 0, 1)
    ctx.beginPath()
    ctx.moveTo(neck.x - 3, top - 1)
    ctx.lineTo(boardEnd - 2, top - 1)
    ctx.quadraticCurveTo(boardEnd + 9, top + neck.h / 2, boardEnd - 2, low + 1)
    ctx.lineTo(neck.x - 3, low + 1)
    ctx.closePath()
    ctx.globalAlpha = lerp(0.06, 0.34, wood)
    ctx.fillStyle = colours.ink
    ctx.fill()
    ctx.globalAlpha = INK.rule
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.globalAlpha = 1
  }
  fillRect(ctx, { x: boardEnd, y: top, w: xOf(1) - boardEnd, h: neck.h }, colours.ink, 0.09)
  if (type === 0) {
    // Frets, each a semitone's ratio nearer the bridge than the last.
    ctx.beginPath()
    for (let fret = 1; fret <= BASS_FRETS; fret++) {
      const x = Math.floor(xOf(Math.pow(2, -fret / 12))) + 0.5
      ctx.moveTo(x, top)
      ctx.lineTo(x, low)
    }
    ctx.globalAlpha = INK.rule
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.globalAlpha = 1
  } else if (type === BASS_FRETLESS) {
    // Bare wood: only the marks on its edge where the frets would be.
    for (const fret of BASS_MARKS) {
      dot(ctx, xOf(Math.pow(2, -fret / 12)), top + 1.5, 1, colours.ink, { alpha: INK.text })
    }
  }

  // The hand that mutes, resting on the strings by the bridge.
  const mute = clamp(frame.value('mute'), 0, 1)
  if (mute > 0) {
    fillRect(
      ctx,
      { x: neck.x + 1, y: top - 1, w: Math.max(2, mute * 0.1 * neck.w), h: neck.h + 2 },
      colours.ink,
      INK.back,
    )
  }

  // The strings, the low ones heavier.
  for (let string = 0; string < BASS_OPEN_HZ.length; string++) {
    const heavy = BASS_STRING_PX[string]
    fillRect(
      ctx,
      { x: neck.x, y: bassStringY(neck, string) - heavy / 2, w: neck.w, h: heavy },
      colours.ink,
      0.9,
    )
  }

  // What hears them: a pickup under the strings, two poles to a string, or the bridge of an upright.
  if (kind.pickup > 0) {
    const x = xOf(kind.pickup)
    const half = Math.max(2, Math.round(neck.w * 0.016))
    fillRect(ctx, { x: x - half, y: top - 2, w: 2 * half, h: neck.h + 4 }, colours.ink)
    for (let string = 0; string < BASS_OPEN_HZ.length; string++) {
      const y = bassStringY(neck, string)
      dot(ctx, x, y - 1.8, 0.9, colours.plate)
      dot(ctx, x, y + 1.8, 0.9, colours.plate)
    }
  }
  const heavy = type === BASS_UPRIGHT ? 4 : 2
  rule(ctx, xOf(0), top - 2, xOf(0), low + 2, { colour: colours.ink, width: heavy })
  rule(ctx, xOf(1), top - 1, xOf(1), low + 1, { colour: colours.ink, width: 2, alpha: INK.text })

  // The hand that plucks: the dashed line is its place on the open strings, its shape what it plucks with.
  const x = xOf(frame.value('position'))
  rule(ctx, x, top, x, low + 4, { colour: colours.ink, dash: [2, 2] })
  const pickHz = stringBassPickHz(type, frame.value('touch'), BASS_REST_GAIN, mute, BASS_REST_HZ)
  bassHand(frame, x, top + 2, bassPoint(pickHz), colours.ink, 1)
}

/** The note the two plots are drawn for: the last key that sounds, or the open A at rest. */
interface BassSaid {
  hz: number
  gain: number
  /** Seconds since its pluck, and since its key went up (0 while it is held); -1 at rest. */
  since: number
  after: number
}

interface BassState {
  /** The key that has each of the four strings, as an index into `frame.notes`, and when each string was taken. */
  owners: number[]
  stamps: number[]
  /** The loop of the note whose dying is shown. */
  loss: StringLoss
  /** The note the two plots are drawn for, found anew each frame. */
  said: BassSaid
}

/**
 * The strings that sound: each swings from the bridge to its fret, as wide as
 * it is loud. The last of them comes back in `said`, and how hard the
 * upright's body was thumped just now.
 */
function bassPlayed(
  frame: DisplayFrame<BassState>,
  parts: BassParts,
  type: number,
  said: BassSaid,
): number {
  const { ctx, colours, state, notes } = frame
  const { neck, time } = parts
  const sustain = frame.value('sustain')
  const mute = clamp(frame.value('mute'), 0, 1)
  const release = frame.value('release')
  const growl = clamp(frame.value('growl'), 0, 1)
  const touch = frame.value('touch')
  const place = clamp(frame.value('position'), 0.03, 0.5)
  const owners = stringBassVoices(
    notes,
    type,
    sustain,
    mute,
    release,
    frame.sampleRate,
    state.owners,
    state.stamps,
  )
  let last = -1
  let thump = 0
  for (let v = 0; v < BASS_VOICES; v++) {
    const index = owners[v]
    if (index < 0) continue
    const note = notes[index]
    const hz = stringBassHz(note.frequency, frame.sampleRate)
    const ring = stringBassRingSeconds(type, hz, sustain, mute)
    const db = stringBassDb(note.age, note.gain, note.released, ring, release)
    const share = clamp(1 + db / 60, 0, 1)
    if (share < BASS_DONE) continue
    const since = note.age
    const after = note.released === null ? 0 : Math.min(note.released, since)
    if (index > last) {
      last = index
      said.hz = hz
      said.gain = note.gain
      said.since = since
      said.after = after
    }

    const ratio = stringBassFretRatio(hz)
    const y = bassStringY(neck, stringBassString(hz))
    // A note under the low E lengthens that string past the nut, which a neck cannot show: it ends at the nut.
    const fret = neck.x + neck.w * Math.min(1, 1 / ratio)
    const long = fret - neck.x
    const wide = Math.min(4, neck.h / 9) * Math.pow(share, 0.7)
    const pickHz = stringBassPickHz(type, touch, note.gain, mute, hz)
    // The corner the pluck left goes as the top of the note dies, sooner than the note.
    const corner =
      lerp(0.2, 1, bassPoint(pickHz)) *
      Math.pow(rung(since, stringBassHighSeconds(type, hz, ring, mute)), 0.25)
    const shape = (u: number): number =>
      lerp(Math.sin(Math.PI * u), u < place ? u / place : (1 - u) / (1 - place), corner)

    // All the room its swing fills.
    const steps = 12
    ctx.beginPath()
    ctx.moveTo(neck.x, y)
    for (const side of [-1, 1]) {
      let cornered = false
      for (let step = 1; step <= steps; step++) {
        const u = side < 0 ? step / steps : 1 - step / steps
        if (!cornered && (side < 0 ? u > place : u < place)) {
          ctx.lineTo(neck.x + place * long, y + side * wide)
          cornered = true
        }
        ctx.lineTo(neck.x + u * long, y + side * wide * shape(u))
      }
    }
    ctx.closePath()
    ctx.globalAlpha = 0.5 * share
    ctx.fillStyle = colours.accent
    ctx.fill()

    // The string itself, somewhere in its swing, each at a pace of its own so a chord does not move as one.
    const swing = Math.sin(frame.now * 2 * Math.PI * (4.5 + ((hz * 0.37) % 3)) + hz)
    // Against the neck: on Fretless the tone swells open after the pluck and the string is drawn fuller for it;
    // on the others a string hit hard rattles for a moment and is drawn jagged while it does.
    const bloom =
      type === BASS_FRETLESS ? growl * stringBassBloom(since) * stringBassBloomReach(hz) : 0
    const rattle = growl * stringBassRattle(type, since, note.gain, ring)
    ctx.beginPath()
    ctx.moveTo(neck.x, y)
    let cornered = false
    for (let step = 1; step <= steps; step++) {
      const u = step / steps
      if (!cornered && u > place) {
        ctx.lineTo(neck.x + place * long, y + swing * wide)
        cornered = true
      }
      const jag = step < steps && u > place ? (step % 2 === 0 ? 1.6 : -1.6) * rattle : 0
      ctx.lineTo(neck.x + u * long, y + swing * wide * shape(u) + jag)
    }
    ctx.globalAlpha = lerp(0.45, 1, share)
    ctx.strokeStyle = colours.accent
    ctx.lineWidth = 1.5 + 1.75 * bloom
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.globalAlpha = 1

    // The finger on the neck; an open string has none.
    if (ratio > 1.001) dot(ctx, fret, y, 2, colours.accent, { alpha: lerp(0.45, 1, share) })
    // The pluck, for a moment, where it met this string.
    if (since < BASS_PLUCK_SEC) {
      bassHand(
        frame,
        neck.x + place * long,
        y - 1,
        bassPoint(pickHz),
        colours.accent,
        1 - since / BASS_PLUCK_SEC,
        0.8,
      )
    }
    // `StringBass::strike`: one hand, one thump: strings plucked in the same instant share the hardest of their pulls.
    if (type === BASS_UPRIGHT && since < BASS_THUMP_SEC) {
      thump = Math.max(
        thump,
        stringBassPluckLevel(note.gain) * (1 - 0.5 * mute) * (1 - since / BASS_THUMP_SEC),
      )
    }

    // Where it is on its way down, in the plot of a note's dying.
    dot(ctx, xOfSeconds(since, time), yOfFall(db, time), 1.75, colours.accent, {
      alpha: lerp(0.5, 1, share),
    })
  }
  if (last < 0) said.since = -1
  return thump
}

/** A slope of 60 dB over `seconds` across the plot of a note's dying, as a path: with `close`, down to the foot and back for a fill. */
function bassSlope(
  ctx: CanvasRenderingContext2D,
  time: Box,
  seconds: number,
  close: boolean,
): void {
  const end = xOfSeconds(seconds, time)
  const foot = time.y + time.h
  ctx.beginPath()
  ctx.moveTo(time.x, yOfFall((-60 * BASS_SHORT_SEC) / seconds, time))
  for (let x = time.x + 1.5; x < end; x += 1.5) {
    ctx.lineTo(x, yOfFall((-60 * secondsOfX(x, time)) / seconds, time))
  }
  ctx.lineTo(end, foot)
  if (close) {
    ctx.lineTo(time.x, foot)
    ctx.closePath()
  }
}

/** A word of a scale, centred under its line, where it stands clear between `from` and `to`; its two ends come back in `ends`. */
function bassScaleWord(
  frame: DisplayFrame<BassState>,
  words: string,
  x: number,
  baseline: number,
  from: number,
  to: number,
): number {
  const { ctx } = frame
  ctx.font = `8px ${frame.fontFamily}`
  const half = ctx.measureText(words).width / 2
  if (x - half < from || x + half > to) return 0
  text(frame, words, x, baseline, { align: 'center' })
  return half
}

/** How a note dies: the release, the top of the note and its fundamental, each a slope to 60 dB under the pluck. */
function bassDying(frame: DisplayFrame<BassState>, parts: BassParts, type: number): void {
  const { ctx, colours } = frame
  const { time, lane } = parts
  const sustain = frame.value('sustain')
  const mute = clamp(frame.value('mute'), 0, 1)
  const release = frame.value('release')
  const foot = time.y + time.h
  for (const seconds of [0.1, 1, 10]) {
    const x = xOfSeconds(seconds, time)
    rule(ctx, x, time.y, x, foot + 2, { colour: colours.ink, alpha: INK.grid })
  }
  rule(ctx, time.x, foot, time.x + time.w, foot, { colour: colours.ink, alpha: INK.rule })

  // The hand that stops the string when its key is let go.
  bassSlope(ctx, time, release, true)
  ctx.globalAlpha = INK.fill
  ctx.fillStyle = colours.ink
  ctx.fill()
  bassSlope(ctx, time, release, false)
  ctx.globalAlpha = INK.text
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.stroke()

  // The open A as Sustain sets it, where its handle stands; under the muting hand the string rings shorter than that.
  const open = stringBassRingSeconds(type, BASS_REST_HZ, sustain, 0)
  const ring = stringBassRingSeconds(type, BASS_REST_HZ, sustain, mute)
  if (ring < open * 0.98) {
    bassSlope(ctx, time, open, false)
    ctx.globalAlpha = INK.rule
    ctx.stroke()
  }
  // The top of the note goes first.
  bassSlope(ctx, time, stringBassHighSeconds(type, BASS_REST_HZ, ring, mute), false)
  ctx.setLineDash([2, 2])
  ctx.globalAlpha = INK.text
  ctx.stroke()
  ctx.setLineDash([])
  bassSlope(ctx, time, ring, false)
  ctx.globalAlpha = 1
  ctx.lineWidth = 1.5
  ctx.stroke()

  // The scale: a second in any case, a tenth and ten where there is room.
  const second = xOfSeconds(1, time)
  const half = bassScaleWord(frame, '1 s', second, lane, time.x - 2, time.x + time.w + 2)
  bassScaleWord(frame, '0.1 s', xOfSeconds(0.1, time), lane, time.x - 2, second - half - 3)
  bassScaleWord(frame, '10 s', xOfSeconds(10, time), lane, second + half + 3, time.x + time.w + 3)
}

/** The last note that sounds, in the plot of a note's dying: its way down from its pluck to now. */
function bassFalling(
  frame: DisplayFrame<BassState>,
  parts: BassParts,
  type: number,
  said: BassSaid,
): void {
  if (said.since < 0) return
  const { ctx, colours } = frame
  const { time } = parts
  const release = frame.value('release')
  const ring = stringBassRingSeconds(
    type,
    said.hz,
    frame.value('sustain'),
    clamp(frame.value('mute'), 0, 1),
  )
  const start = gainToDb(stringBassPluckLevel(said.gain))
  const held = said.since - said.after
  const fall = (seconds: number): number =>
    start - 60 * (seconds / ring + Math.max(0, seconds - held) / release)
  const end = xOfSeconds(said.since, time)
  ctx.beginPath()
  ctx.moveTo(time.x, yOfFall(fall(BASS_SHORT_SEC), time))
  for (let x = time.x + 1.5; x < end; x += 1.5) {
    ctx.lineTo(x, yOfFall(fall(secondsOfX(x, time)), time))
  }
  ctx.lineTo(end, yOfFall(fall(said.since), time))
  ctx.strokeStyle = colours.accent
  ctx.lineWidth = 1.5
  ctx.lineJoin = 'round'
  ctx.stroke()
}

/** What is heard of the note by frequency: its partials as the pluck left them, the band Growl speaks in, and the note as it is now. */
function bassHeard(
  frame: DisplayFrame<BassState>,
  parts: BassParts,
  type: number,
  said: BassSaid,
): void {
  const { ctx, colours, state } = frame
  const { colour, lane } = parts
  const kind = bassKind(type)
  const sustain = frame.value('sustain')
  const mute = clamp(frame.value('mute'), 0, 1)
  const release = frame.value('release')
  const growl = clamp(frame.value('growl'), 0, 1)
  const resonance = frame.value('resonance')
  const toneHz = stringBassToneHz(frame.value('tone'))
  const position = frame.value('position')
  const foot = colour.y + colour.h
  const sounds = said.since >= 0
  const noteHz = sounds ? said.hz : BASS_REST_HZ
  const gain = sounds ? said.gain : BASS_REST_GAIN
  const pickHz = stringBassPickHz(type, frame.value('touch'), gain, mute, noteHz)
  const level = gainToDb(stringBassPluckLevel(gain))
  const trim = gainToDb(stringBassTilt(type, noteHz))
  const hzAt = (x: number): number => hzOfX(colour.x + x, colour, BASS_LOW_HZ, BASS_HIGH_HZ)
  const first = Math.max(0, Math.ceil(xOfHz(noteHz, colour, BASS_LOW_HZ, BASS_HIGH_HZ) - colour.x))
  /** The partial at `hz` as the pluck left it, seen through the instrument. */
  const plucked = (hz: number, span: number): number =>
    level +
    trim +
    stringBassPluckDb(hz, noteHz, type, position, pickHz, span) +
    stringBassHeardDb(type, hz, toneHz, resonance)

  for (const seconds of [100, 1000]) {
    const x = xOfHz(seconds, colour, BASS_LOW_HZ, BASS_HIGH_HZ)
    rule(ctx, x, colour.y, x, foot + 2, { colour: colours.ink, alpha: INK.grid })
  }
  rule(ctx, colour.x, foot, colour.x + colour.w, foot, { colour: colours.ink, alpha: INK.rule })

  // The partials the pluck left, from the note up.
  for (const fill of [true, false]) {
    ctx.beginPath()
    for (let x = first; x <= colour.w; x++) {
      const span = (hzAt(x + 0.5) - hzAt(x - 0.5)) / noteHz
      const y = yOfColour(plucked(hzAt(x), span), colour)
      if (x === first) ctx.moveTo(colour.x + x, fill ? foot : y)
      ctx.lineTo(colour.x + x, y)
    }
    ctx.lineJoin = 'round'
    if (fill) {
      ctx.lineTo(colour.x + colour.w, foot)
      ctx.closePath()
      ctx.globalAlpha = INK.fill
      ctx.fillStyle = colours.ink
      ctx.fill()
    } else {
      ctx.globalAlpha = INK.text
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1

  // The band Growl speaks in, as tall as it can stand: on Fretless at the top of the bloom, where
  // the taps are as tall as the string swings; on the others at the pluck of a key played as hard
  // as can be, whatever key this is. A soft key on those has none of it.
  const reach = type === BASS_FRETLESS ? stringBassBloomReach(noteHz) : 1
  const most = trim + (type === BASS_FRETLESS ? level : 0) + kind.growlDb
  const band = (hz: number, centre: number, top: number): number =>
    top + bandDb(hz, centre, kind.growlQ) + stringBassHeardDb(type, hz, toneHz, resonance)
  if (growl * reach > 0) {
    const top = most + gainToDb(growl * reach)
    ctx.beginPath()
    let drawing = false
    for (let x = 0; x <= colour.w; x++) {
      const y = yOfColour(band(hzAt(x), kind.growlHz, top), colour)
      if (y >= foot - 0.25) {
        drawing = false
        continue
      }
      if (drawing) ctx.lineTo(colour.x + x, y)
      else ctx.moveTo(colour.x + x, y)
      drawing = true
    }
    ctx.setLineDash([2, 2])
    ctx.globalAlpha = 1
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.setLineDash([])
  }

  // The note as it is now: every partial as far down as its own ring has let it fall, the top
  // first, behind the low-pass that closes once the key is let go; and what Growl adds this moment.
  if (sounds) {
    const ring = stringBassRingSeconds(type, noteHz, sustain, mute)
    const high = stringBassHighSeconds(type, noteHz, ring, mute)
    const loss = stringLoss(noteHz, ring, high, kind.highHz, frame.sampleRate, state.loss)
    // `StringBass::begin_release` and `control`: the fade, and the low-pass that closes with it.
    const fade = rung(said.after, release)
    const closes = Math.max(6 * noteHz, 0.4 * frame.sampleRate * fade * Math.sqrt(fade))
    const stopped = (hz: number): number =>
      said.after > 0 ? gainToDb(fade) + onePoleDb('lowpass', closes, hz) : 0
    // The taps follow the string down: the bloom is as tall as the string swings, the rattle
    // as tall as the swing stands over the neck.
    const adds =
      type === BASS_FRETLESS
        ? growl * reach * stringBassBloom(said.since) * rung(said.since, ring)
        : growl * stringBassRattle(type, said.since, said.gain, ring)
    const centre = type === BASS_FRETLESS ? stringBassBloomHz(said.since) : kind.growlHz
    const top = adds > 0 ? most + gainToDb(adds) : -Infinity
    ctx.beginPath()
    ctx.moveTo(colour.x + first, foot)
    for (let x = first; x <= colour.w; x++) {
      const hz = hzAt(x)
      const span = (hzAt(x + 0.5) - hzAt(x - 0.5)) / noteHz
      const own =
        plucked(hz, span) -
        (60 * said.since) / partialSeconds(loss, noteHz, hz, frame.sampleRate) +
        stopped(hz)
      const added = adds > 0 ? band(hz, centre, top) + stopped(hz) : -Infinity
      ctx.lineTo(colour.x + x, yOfColour(Math.max(own, added), colour))
    }
    ctx.lineTo(colour.x + colour.w, foot)
    ctx.closePath()
    ctx.globalAlpha = 0.6
    ctx.fillStyle = colours.accent
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // The scale.
  const kilo = xOfHz(1000, colour, BASS_LOW_HZ, BASS_HIGH_HZ)
  const half = bassScaleWord(frame, '1 kHz', kilo, lane, colour.x - 2, colour.x + colour.w + 3)
  bassScaleWord(
    frame,
    '100 Hz',
    xOfHz(100, colour, BASS_LOW_HZ, BASS_HIGH_HZ),
    lane,
    colour.x - 3,
    kilo - half - 3,
  )
}

const stringBass = plateDisplay<BassState>({
  place: 'window',
  columns: 2,
  params: ['type', 'touch', 'position', 'tone', 'mute', 'sustain', 'release', 'growl', 'resonance'],
  live: { signal: true, notes: true },
  info: 'Four strings from the bridge at the left, the dashed line where they are plucked, the block by the bridge the muting hand. A played string swings up to its fret. Below left, how a note dies: release, its top, its ring. Below right, its partials. Drag the handles to set Position, Sustain and Release.',
  init: () => ({
    owners: [],
    stamps: [],
    loss: { pole: 0, gain: 0 },
    said: { hz: BASS_REST_HZ, gain: BASS_REST_GAIN, since: -1, after: 0 },
  }),
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const parts = bassParts(frame)
    const { neck } = parts
    const type = clamp(Math.round(frame.value('type')), 0, BASS_KINDS.length - 1)
    bassRest(frame, parts, type)

    const { said } = frame.state
    said.hz = BASS_REST_HZ
    said.gain = BASS_REST_GAIN
    said.since = -1
    said.after = 0
    bassDying(frame, parts, type)
    const thump = bassPlayed(frame, parts, type, said)
    bassFalling(frame, parts, type, said)
    // The thump of the upright: the body answers the pull of the finger, for a moment.
    if (thump > 0) {
      fillRect(
        ctx,
        { x: neck.x - 3, y: neck.y - 1, w: 5, h: neck.h + 2 },
        colours.accent,
        clamp(thump, 0, 1),
      )
    }
    bassHeard(frame, parts, type, said)
    levelFoot(frame, parts.foot, outShare(frame))

    // The words: which bass, and how long the last note played rings (the open A while none is).
    const mute = clamp(frame.value('mute'), 0, 1)
    const ring = stringBassRingSeconds(type, said.hz, frame.value('sustain'), mute)
    text(frame, bassKind(type).name, 5, 11)
    text(frame, `${pitchName(said.hz)} ${secondsText(ring)}`, frame.width - 5, 11, {
      align: 'right',
    })

    for (const point of bassHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: bassHandles,
})

function bassHandles(view: DisplayView): DisplayHandle[] {
  const { neck, time } = bassParts(view)
  const kind = bassKind(view.value('type'))
  // A slope of 60 dB over a time is this share of the time along at so many dB.
  const releaseAt = BASS_RELEASE_AT_DB / -60
  const sustainAt = BASS_SUSTAIN_AT_DB / -60
  return [
    {
      key: 'position',
      name: 'Position',
      x: neck.x + view.value('position') * neck.w,
      y: neck.y + neck.h + 4,
      drag: (toX) => ({ position: clamp((toX - neck.x) / neck.w, 0.05, 0.5) }),
      reset: () => ({ position: view.spec('position')?.default ?? 0.22 }),
    },
    {
      key: 'sustain',
      name: 'Sustain',
      // On the slope of the open A with no hand on it: Sustain times the type's share of it.
      x: xOfSeconds(view.value('sustain') * kind.ring * sustainAt, time),
      y: yOfFall(BASS_SUSTAIN_AT_DB, time),
      drag: (toX) => ({ sustain: secondsOfX(toX, time) / (kind.ring * sustainAt) }),
      reset: () => ({ sustain: view.spec('sustain')?.default ?? 5 }),
    },
    {
      key: 'release',
      name: 'Release',
      x: xOfSeconds(view.value('release') * releaseAt, time),
      y: yOfFall(BASS_RELEASE_AT_DB, time),
      drag: (toX) => ({ release: secondsOfX(toX, time) / releaseAt }),
      reset: () => ({ release: view.spec('release')?.default ?? 0.15 }),
    },
  ]
}

export const STRING_BASS_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  'string-bass': { display: stringBass, face: ['type', 'touch', 'tone', 'sustain'] },
}
