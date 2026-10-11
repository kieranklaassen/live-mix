// The display of the Club Kit: twelve drums on the twelve keys of the octave,
// a firmer kit with cymbals beside the Drum Kit.
//
// Like the other kits it has no keyboard to draw: every C is the kick. Its
// drums are told apart by how long they ring more than by anything else (a
// closed hat is gone in a twentieth of a second, the crash rings over two), so
// each drum is a named lane of level against time, as long as the drum rings
// where the knobs stand, and a hit lights its lane for as long as that. The
// lanes stand in two columns of six in key order, since twelve words do not
// fit side by side in a pedal's window and twelve rows do not fit one over
// another.
//
// Every figure here is copied from `cpp/devices/club-kit/club_kit.h`, and the
// comment at each says where from. What a hit draws by chance (Variation) the
// display cannot know: it is drawn as the range it may fall in.

import { INK, clamp, fillRect, ground, lerp, rule, text, type Box } from '../display-kit'
import { plateDisplay, type DisplayNote, type DisplayView, type PlateFace } from '../plate-display'
import { kitKey, kitTuning } from './instrument-kits'
import { levelFoot, outShare } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>

/** `club_kit.h`, `ClubKit::Drum` (lines 81 to 95): the drum on each key of the octave, from C. */
export const CLUB_DRUM_NAMES = [
  'Kick',
  'Crash',
  'Snare',
  'Ride',
  'Rim',
  'Closed hat',
  'Shaker',
  'Open hat',
  'Clap',
  'Low conga',
  'Cowbell',
  'High conga',
] as const
/** The word a lane has room for; the shaker's is shorter still where the lanes are narrow. */
export const CLUB_LANE_NAMES = [
  'Kick',
  'Crash',
  'Snare',
  'Ride',
  'Rim',
  'Hat',
  'Shaker',
  'Open',
  'Clap',
  'Low',
  'Bell',
  'High',
] as const
export const CLUB_SHAKER_SHORT = 'Shkr'
export const CLUB_KICK = 0
export const CLUB_CRASH = 1
export const CLUB_SNARE = 2
export const CLUB_RIDE = 3
export const CLUB_RIM = 4
export const CLUB_CLOSED_HAT = 5
export const CLUB_SHAKER = 6
export const CLUB_OPEN_HAT = 7
export const CLUB_CLAP = 8
export const CLUB_LOW_CONGA = 9
export const CLUB_COWBELL = 10
export const CLUB_HIGH_CONGA = 11
const DRUMS = 12

/** `club_kit.h` line 233, `kChokeSeconds`: an open hat closed by the closed hat fades in this long. */
export const CLUB_CHOKE_SEC = 0.008
/** `club_kit.h` line 237, `kBodyFloorHz`: no drum of tones is tuned under this. */
const CLUB_FLOOR_HZ = 24
/** `club_kit.h` line 238, `kFifth`: seven semitones. */
const CLUB_FIFTH = 1.4983071
/** `club_kit.h` lines 442 to 446: a sine over this share of the sample rate is left out. */
const CLUB_TOP_OF_BAND = 0.45
/** `club_kit.h` line 572: the gain a kit is balanced at, where the hardness of a hit is 1. */
export const CLUB_FIRM = 0.7
/** `club_kit.h` lines 710 to 713: the clap's four bursts are this far apart and each dies 60 dB in this long. */
export const CLUB_CLAP_BURSTS = 4
export const CLUB_CLAP_GAP_SEC = 0.008
export const CLUB_CLAP_BURST_SEC = 0.022

/** `club_kit.h` lines 244 to 260: the white keys the kit is tuned to, in hertz. */
const F1 = 43.65353
const G1 = 48.99943
const D3 = 146.8324
const E3 = 164.8138
const G3 = 195.9977
const A3 = 220
const C4 = 261.6256
const D4 = 293.6648
const E4 = 329.6276
const C5 = 523.2511
const G6 = 1567.982
const D7 = 2349.318
const A7 = 3520
const E8 = 5274.041
const G8 = 6271.927

/**
 * `club_kit.h`, `ClubKit::character` (lines 286 to 302): what a Kit choice is,
 * the parts of it this display draws. Where the kick rests and how long it
 * rings at Length 1; the level of the clicks; the snare's two tones; the rim's
 * partials as a ratio; how long the tonal drums, the noise drums and the metal
 * ring, as factors on the Firm kit; the length of the attacks; the lower and
 * upper edges of the bands, the sharpness of the upper one; the snare's noise
 * against its tones.
 */
const CLUB_KITS = [
  {
    name: 'Firm',
    kickHz: G1,
    kickLen: 0.32,
    click: 1,
    snareLow: G3,
    snareHigh: E4,
    knock: 1,
    tonal: 1,
    noise: 1,
    metal: 1,
    attack: 1,
    band: 1,
    edge: 1,
    q: 0.6,
    wires: 1,
  },
  {
    name: 'Deep',
    kickHz: F1,
    kickLen: 0.44,
    click: 0.3,
    snareLow: D3,
    snareHigh: A3,
    knock: 0.8408964,
    tonal: 1.4,
    noise: 1.25,
    metal: 1,
    attack: 1.6,
    band: 0.8,
    edge: 0.6,
    q: 0.6,
    wires: 0.7,
  },
  {
    name: 'Dusty',
    kickHz: G1,
    kickLen: 0.285,
    click: 0.7,
    snareLow: E3,
    snareHigh: C4,
    knock: 1,
    tonal: 0.9,
    noise: 0.9,
    metal: 0.8,
    attack: 1.2,
    band: 0.7,
    edge: 0.5,
    q: 0.9,
    wires: 2,
  },
  {
    name: 'Bright',
    kickHz: G1,
    kickLen: 0.265,
    click: 1.35,
    snareLow: A3,
    snareHigh: E4,
    knock: 1.122462,
    tonal: 0.85,
    noise: 0.9,
    metal: 1.05,
    attack: 0.7,
    band: 1.15,
    edge: 1.4,
    q: 0.6,
    wires: 1.5,
  },
] as const
const clubKit = (kit: number) => CLUB_KITS[clamp(Math.round(kit), 0, CLUB_KITS.length - 1)]
/** The name of a Kit choice, as the device's list has it. */
export const clubKitName = (kit: number): string => clubKit(kit).name

/** How a filter shapes a drum's air: `ClubKit::Shaping` (line 409). `high2` is two high-passes. */
type ClubShaping = 'none' | 'high' | 'high2' | 'band'

/** One drum as `ClubKit::strike` sets a slot up: what the hit will do, in the header's units. */
export interface ClubVoice {
  /** Up to four sines: where each is tuned, how loud it is, how long it takes to fall 60 dB. */
  partials: number
  hz: [number, number, number, number]
  gain: [number, number, number, number]
  seconds: [number, number, number, number]
  /** The air: noise and pulses under one envelope. Its level, its 60 dB time and its soft start. */
  air: number
  airSeconds: number
  airAttack: number
  /** Whether the air is pulses (the metal, the cowbell) more than noise. */
  pulsed: boolean
  /** The hard start of the air: so much over its level, gone 60 dB in so long. */
  bite: number
  biteSeconds: number
  /** The filter that shapes the air, and the second high-pass of the metal. */
  shaping: ClubShaping
  shapeHz: number
  shape2Hz: number
  shapeQ: number
  /** The clap: bursts before the tail, how far apart, and the tail's 60 dB time. */
  bursts: number
  burstGap: number
  tailSeconds: number
  /** Tone: the low-pass everything goes through, before Tone moves it, and its sharpness. */
  cut: number
  q: number
  /** Tone's narrower range: the noise drums, the metal and the cowbell. */
  noiseClass: boolean
}

export const clubVoiceBlank = (): ClubVoice => ({
  partials: 0,
  hz: [0, 0, 0, 0],
  gain: [0, 0, 0, 0],
  seconds: [0, 0, 0, 0],
  air: 0,
  airSeconds: 0,
  airAttack: 0,
  pulsed: false,
  bite: 0,
  biteSeconds: 0,
  shaping: 'none',
  shapeHz: 1000,
  shape2Hz: 0,
  shapeQ: 0.7,
  bursts: 0,
  burstGap: 0,
  tailSeconds: 0,
  cut: 1000,
  q: 0.6,
  noiseClass: false,
})

/** `ClubKit::note_on` and `strike` (lines 138 and 560): the tuning a hit is given, in semitones: the octave of its key, its cents and Tune. Variation's part is not known. */
export function clubTuning(hz: number, tune: number): number {
  return clamp(kitTuning(hz) + tune, -36, 36)
}

/** `ClubKit::strike` (line 564): Length as a drum tuned so far takes it. An octave up rings a third shorter, an octave down half longer. */
export function clubLength(length: number, semitones: number): number {
  return length * Math.pow(1.5, -semitones / 12)
}

/** `ClubKit::strike` (line 565): the most Variation may stretch or shrink a hit's length, as a factor either way. */
export const clubLengthSpan = (variation: number): number => Math.pow(2, 0.25 * variation)

/** `ClubKit::strike` (line 576): how loud a hit of `gain` is against the hardest. */
export const clubHitLevel = (gain: number): number => 0.25 + 0.75 * clamp(gain, 0, 1)

/** `ClubKit::held` (line 455): where a drum of tones is tuned, never under the floor. */
const clubHeld = (hz: number): number => Math.max(hz, CLUB_FLOOR_HZ)

/** `ClubKit::partial` (lines 442 to 452): one sine of a drum. One over the top of the band is silent and keeps its length. */
function clubPartial(
  v: ClubVoice,
  top: number,
  index: number,
  hz: number,
  level: number,
  seconds: number,
): void {
  v.hz[index] = clamp(hz, 8, top)
  v.gain[index] = hz > top ? 0 : level
  v.seconds[index] = seconds
  v.partials = Math.max(v.partials, index + 1)
}

/** `ClubKit::air` and `noise` (lines 470 to 479): a drum's air, its level, its 60 dB time and its soft start. */
function clubAir(v: ClubVoice, level: number, seconds: number, attack: number): void {
  v.air = level
  v.airSeconds = seconds
  v.airAttack = attack
}

function clubVoiceReset(v: ClubVoice): ClubVoice {
  v.partials = 0
  v.hz.fill(0)
  v.gain.fill(0)
  v.seconds.fill(0)
  v.air = v.airSeconds = v.airAttack = 0
  v.pulsed = false
  v.bite = v.biteSeconds = 0
  v.shaping = 'none'
  v.shapeHz = 1000
  v.shape2Hz = 0
  v.shapeQ = 0.7
  v.bursts = v.burstGap = v.tailSeconds = 0
  v.cut = 1000
  v.q = 0.6
  v.noiseClass = false
  return v
}

/** What `ClubKit::strike` works out once for a hit, whatever the drum. */
interface ClubHit {
  ratio: number
  half: number
  tonal: number
  noisy: number
  metal: number
  hardness: number
  bright: number
  brightHigh: number
  snap: number
  /** The top of the band, in hertz. */
  top: number
}

/** `ClubKit::strike`, the keys from F up: the hats, the shaker, the clap, the congas and the cowbell. */
function clubVoiceTops(v: ClubVoice, drum: number, c: (typeof CLUB_KITS)[number], hit: ClubHit) {
  const { ratio, half, tonal, noisy, metal, hardness, bright, brightHigh, snap } = hit
  if (drum === CLUB_CLOSED_HAT || drum === CLUB_OPEN_HAT) {
    // Lines 681 to 696: the open hat is the closed hat ringing.
    const open = drum === CLUB_OPEN_HAT
    clubAir(v, 1, (open ? 0.42 : 0.05) * metal, lerp(0.003, 0.0002, snap) * c.attack)
    v.pulsed = true
    v.bite = 0.8 * snap * hardness
    v.biteSeconds = 0.005
    v.shaping = 'high2'
    v.shapeHz = Math.min(7000 * c.band * half, 13000)
    v.shape2Hz = Math.min(5500 * c.band * half, 11000)
    v.cut = 11000 * c.edge * half * brightHigh
    v.noiseClass = true
  } else if (drum === CLUB_SHAKER) {
    // Lines 697 to 706: a band of noise with a soft attack.
    clubAir(v, 1, 0.075 * noisy, lerp(0.008, 0.004, snap) * c.attack)
    v.shaping = 'high'
    v.shapeHz = Math.min(4500 * c.band * half, 12000)
    v.cut = 9500 * c.edge * half * brightHigh
    v.noiseClass = true
  } else if (drum === CLUB_CLAP) {
    // Lines 707 to 726: four bursts 8 ms apart, each dying in 22 ms, then the tail.
    clubAir(v, 1 / half, CLUB_CLAP_BURST_SEC, lerp(0.0015, 0.0002, snap) * c.attack)
    v.bursts = CLUB_CLAP_BURSTS
    v.burstGap = CLUB_CLAP_GAP_SEC
    v.tailSeconds = 0.2 * noisy
    v.shaping = 'band'
    v.shapeHz = 1500 * c.band * ratio
    v.shapeQ = 1.2
    v.cut = 4200 * c.edge * ratio * bright
    v.noiseClass = true
  } else if (drum === CLUB_LOW_CONGA || drum === CLUB_HIGH_CONGA) {
    // Lines 727 to 747: a sine with a fifth over it, and the slap a few harmonics up.
    const high = drum === CLUB_HIGH_CONGA
    const hz = clubHeld((high ? D4 : G3) * ratio)
    const seconds = (high ? 0.2 : 0.25) * tonal
    clubPartial(v, hit.top, 0, hz, 1, seconds)
    clubPartial(v, hit.top, 1, hz * CLUB_FIFTH, 0.35, seconds * 0.6)
    const slap = (high ? 2.4 : 1.6) * (0.4 + snap) * c.click * hardness
    clubAir(v, slap, 0.035 * tonal, 0.0002)
    v.shaping = 'band'
    v.shapeHz = hz * 7
    v.shapeQ = 0.8
    v.cut = hz * 13 * bright * c.edge
  } else {
    // Lines 748 to 763, the cowbell: two pulses a fifth apart through a band-pass.
    clubAir(v, 1, 0.16 * tonal, lerp(0.001, 0.0002, snap) * c.attack)
    v.pulsed = true
    v.bite = (0.5 + 0.6 * snap) * hardness
    v.biteSeconds = 0.012
    v.shaping = 'band'
    v.shapeHz = 1200 * ratio
    v.shapeQ = 0.9
    v.cut = 3000 * ratio * bright * c.edge
    v.noiseClass = true
  }
}

/**
 * `ClubKit::strike` (lines 509 to 769): the drum on key `drum` as a hit of
 * `gain` sets it up, with the kit tuned `semitones` and the knobs where they
 * stand, written into `into`. Variation's draws are left at none: this is the
 * hit the knobs ask for. Punch is not among them: it moves the pitch of the
 * kick and the congas as they start, and nothing here is drawn by pitch.
 */
export function clubVoice(
  drum: number,
  kit: number,
  semitones: number,
  lengthKnob: number,
  snap: number,
  gain: number,
  into: ClubVoice,
  sampleRate = 48000,
): ClubVoice {
  const c = clubKit(kit)
  const v = clubVoiceReset(into)
  const ratio = Math.pow(2, semitones / 12)
  // The bands of the metal, the shaker and the kick's click move half as far as the tuning (line 562).
  const half = Math.sqrt(ratio)
  const length = clubLength(lengthKnob, semitones)
  const tonal = length * c.tonal
  const noisy = length * c.noise
  const metal = length * c.metal
  // A soft hit is quieter and duller, a hard one louder and brighter (lines 572 to 575).
  const hardness = 0.5 + 0.7 * gain
  const bright = Math.pow(2, (gain - CLUB_FIRM) * 1.5)
  const brightHigh = Math.sqrt(bright)
  const top = CLUB_TOP_OF_BAND * sampleRate
  v.q = c.q
  if (drum === CLUB_KICK) {
    // Lines 581 to 602. The kick's length is its own and not the tonal drums'.
    clubPartial(v, top, 0, clubHeld(c.kickHz * ratio), 1, c.kickLen * length)
    if (snap > 0) {
      clubAir(v, 4 * snap * c.click * hardness, 0.006, 0.0002)
      v.shaping = 'band'
      v.shapeHz = 3500 * half
      v.shapeQ = 0.8
    }
    v.cut = 5000 * half * bright * c.edge
  } else if (drum === CLUB_CRASH) {
    // Lines 603 to 622: six pulses over noise, and the stick well over the wash at first.
    clubAir(v, 1, 2.3 * metal, lerp(0.003, 0.0003, snap) * c.attack)
    v.pulsed = true
    v.bite = (1 + 1.5 * snap) * hardness
    v.biteSeconds = 0.25
    v.shaping = 'high2'
    v.shapeHz = Math.min(3400 * c.band * half, 9000)
    v.shape2Hz = Math.min(2600 * c.band * half, 8000)
    v.cut = 14000 * c.edge * half * brightHigh
    v.noiseClass = true
  } else if (drum === CLUB_SNARE) {
    // Lines 623 to 641. Held at the floor by its lower tone; the upper one keeps its ratio.
    const tones = lerp(1, 0.5, snap)
    const lift = clubHeld(c.snareLow * ratio) / (c.snareLow * ratio)
    clubPartial(v, top, 0, c.snareLow * ratio * lift, 0.6 * tones, 0.1 * tonal)
    clubPartial(v, top, 1, c.snareHigh * ratio * lift, 0.4 * tones, 0.07 * tonal)
    clubAir(v, lerp(0.35, 1, snap) * c.wires, 0.18 * noisy, lerp(0.004, 0.0003, snap) * c.attack)
    v.shaping = 'high'
    v.shapeHz = 1800 * c.band * ratio
    v.cut = 9000 * c.edge * ratio * bright
    v.noiseClass = true
  } else if (drum === CLUB_RIDE) {
    // Lines 642 to 664: the ping, four sines, over a quieter wash of pulses.
    clubPartial(v, top, 0, A7 * ratio, 1, 0.95 * metal)
    clubPartial(v, top, 1, E8 * ratio, 0.55 * c.edge, 0.65 * metal)
    clubPartial(v, top, 2, D7 * ratio, 0.4, 1.15 * metal)
    clubPartial(v, top, 3, G8 * ratio, 0.3 * c.edge, 0.45 * metal)
    clubAir(v, 0.45 * c.edge, 1.25 * metal, lerp(0.003, 0.0003, snap) * c.attack)
    v.pulsed = true
    v.bite = 0.8 * snap * hardness
    v.biteSeconds = 0.03
    v.shaping = 'high2'
    v.shapeHz = Math.min(5200 * c.band * half, 12000)
    v.shape2Hz = Math.min(4200 * c.band * half, 10000)
    v.cut = 13000 * c.edge * half * brightHigh
    v.noiseClass = true
  } else if (drum === CLUB_RIM) {
    // Lines 665 to 680. A side stick is short in every Kit: half the move of the other drums.
    const knock = length * Math.sqrt(c.tonal)
    clubPartial(v, top, 0, C5 * c.knock * ratio, 0.7, 0.045 * knock)
    clubPartial(v, top, 1, G6 * c.knock * ratio, 0.55, 0.03 * knock)
    clubAir(v, (0.6 + 3 * snap) * c.click * hardness, 0.004, 0.0002)
    v.shaping = 'band'
    v.shapeHz = 3200 * c.knock * ratio
    v.shapeQ = 1.2
    v.cut = 5000 * ratio * bright * c.edge
  } else
    clubVoiceTops(v, drum, c, {
      ratio,
      half,
      tonal,
      noisy,
      metal,
      hardness,
      bright,
      brightHigh,
      snap,
      top,
    })
  return v
}

const dbOf = (gain: number): number => (gain > 1e-6 ? 20 * Math.log10(gain) : -120)
const smoothstep = (t: number): number => t * t * (3 - 2 * t)

/** `ClubKit::render` (lines 899 to 904): how long a drum's air takes to fall 60 dB from the hit. The clap's tail starts where its last burst would. */
export function clubAirSeconds(v: ClubVoice): number {
  if (v.air <= 0) return 0
  return v.bursts > 0 ? v.bursts * v.burstGap + v.tailSeconds : v.airSeconds
}

/**
 * How long a drum rings: the 60 dB time of its slowest envelope, which is how
 * the header gives every length. `ClubKit::render` goes by the largest envelope
 * too (`remaining`, line 857), and lets the slot go 100 dB down (line 1029),
 * two thirds as long again and far under anything heard.
 */
export function clubRingSeconds(v: ClubVoice): number {
  let most = clubAirSeconds(v)
  for (let k = 0; k < v.partials; k++) most = Math.max(most, v.seconds[k])
  return most
}

/** `ClubKit::render`, `remaining`: the largest envelope of a drum `age` seconds after the hit, in dB under the hit. A sine left out for its pitch keeps its envelope. */
export function clubRemainingDb(v: ClubVoice, age: number): number {
  let most = -120
  for (let k = 0; k < v.partials; k++) most = Math.max(most, (-60 * age) / v.seconds[k])
  if (v.air <= 0) return most
  if (v.bursts === 0) return Math.max(most, (-60 * age) / v.airSeconds)
  // Each burst of the clap starts the envelope again; the tail falls from the last (line 907).
  const tail = age - v.bursts * v.burstGap
  return Math.max(most, tail < 0 ? 0 : (-60 * tail) / v.tailSeconds)
}

/**
 * The longest a lane is lit. The crash at Length 4, three octaves down, takes
 * half a minute to fall 60 dB, which no eye reads as a hit: a light goes out
 * where its lane ends, ten seconds on, and the words still say the whole time.
 */
export const CLUB_LIGHT_MOST_SEC = 10

/** How much of a hit `age` seconds old is left, as a share of its light: whole when struck, out when it has fallen 60 dB or the lane has run out. */
export function clubLeft(v: ClubVoice, age: number): number {
  if (age < 0 || age >= CLUB_LIGHT_MOST_SEC) return 0
  return clamp(1 + clubRemainingDb(v, age) / 60, 0, 1)
}

/** `ClubKit::strike` and `render` (lines 520 to 525 and 1008 to 1011): how much of an open hat is left `since` seconds after the closed hat was struck. Only the closed hat chokes it. */
export function clubChoke(since: number): number {
  return since >= CLUB_CHOKE_SEC ? 0 : smoothstep(1 - Math.max(since, 0) / CLUB_CHOKE_SEC)
}

/** `ClubKit::follow_tone` (lines 1049 and 1050): what Tone does to a drum's low-pass, two octaves either way for a tonal drum and less for the rest. */
export function clubToneFactor(tone: number, noiseClass: boolean): number {
  return Math.pow(2, (tone - 0.5) * (noiseClass ? 1.7 : 4))
}

/** `ClubKit::retune` (line 1037): where a drum's low-pass stands with Tone there. It stops at 0.45 of the sample rate, so the top of Tone does nothing to the cymbals. */
export function clubCutHz(v: ClubVoice, tone: number, sampleRate = 48000): number {
  return clamp(v.cut * clubToneFactor(tone, v.noiseClass), 40, CLUB_TOP_OF_BAND * sampleRate)
}

/** `kit::Svf` as a response: what a second-order filter of that sharpness leaves at `ratio` times its own frequency. */
function svfGain(kind: 'low' | 'high' | 'band', ratio: number, q: number): number {
  const w2 = ratio * ratio
  const under = Math.sqrt((1 - w2) * (1 - w2) + w2 / (q * q))
  if (under < 1e-9) return q
  return kind === 'low' ? 1 / under : kind === 'high' ? w2 / under : ratio / q / under
}

/** `ClubKit::render` (lines 991 to 1004): what a drum's own filters and its low-pass leave of its air at `hz`. */
function clubAirGain(v: ClubVoice, hz: number, cutHz: number): number {
  let gain = svfGain('low', hz / cutHz, v.q)
  if (v.shaping === 'band') gain *= svfGain('band', hz / v.shapeHz, v.shapeQ)
  else if (v.shaping !== 'none') gain *= svfGain('high', hz / v.shapeHz, v.shapeQ)
  if (v.shaping === 'high2') gain *= svfGain('high', hz / v.shape2Hz, v.shapeQ)
  return gain
}

/** The power of a drum's air through its filters with the low-pass at `cutHz`: noise as loud at every pitch, summed by the octave third from 50 Hz to the top of the band. */
function clubAirPower(v: ClubVoice, cutHz: number, top: number): number {
  let power = 0
  for (let hz = 50; hz < top; hz *= 1.26) {
    const gain = clubAirGain(v, hz, cutHz)
    power += hz * gain * gain
  }
  return power
}

/**
 * What Tone makes of a drum's air, as a gain: how loud it comes through with
 * Tone there against Tone at the middle, where the kit is balanced. Dull is
 * quieter, bright louder, and nothing changes once the low-pass has stopped.
 */
export function clubAirTone(v: ClubVoice, tone: number, sampleRate = 48000): number {
  const top = CLUB_TOP_OF_BAND * sampleRate
  const middle = clubAirPower(v, clubCutHz(v, 0.5, sampleRate), top)
  return middle > 0 ? Math.sqrt(clubAirPower(v, clubCutHz(v, tone, sampleRate), top) / middle) : 1
}

/** What Tone makes of one sine of a drum, the same way: its low-pass at the sine's pitch against Tone at the middle. */
export function clubPartialTone(v: ClubVoice, k: number, tone: number, sampleRate = 48000): number {
  const at = (cutHz: number): number => svfGain('low', v.hz[k] / cutHz, v.q)
  return at(clubCutHz(v, tone, sampleRate)) / at(clubCutHz(v, 0.5, sampleRate))
}

interface ClubParts {
  /** The baseline of the words. */
  words: number
  /** The twelve lanes, two columns of six in key order, and the room a lane's name takes. */
  lanes: Box
  name: number
  foot: Box
}

const CLUB_ROWS = DRUMS / 2
/** The room a lane's name takes at 8 px: "Shaker" from a pedal's window up, "Snare" and "Crash" on a flat plate. */
const CLUB_NAME_WIDE = 30
const CLUB_NAME_NARROW = 26

function clubParts(view: Size): ClubParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const foot: Box = { x: all.x, y: all.y + all.h - 6, w: all.w, h: 6 }
  const top = all.y + 10
  return {
    words: all.y + 7,
    lanes: { x: all.x, y: top, w: all.w, h: foot.y - 2 - top },
    name: all.w < 160 ? CLUB_NAME_NARROW : CLUB_NAME_WIDE,
    foot,
  }
}

/** The lane of a drum: its key's place down the two columns, with a pixel between lanes. */
function clubLane(drum: number, parts: ClubParts): Box {
  const { lanes } = parts
  const column = Math.floor(drum / CLUB_ROWS)
  const row = drum % CLUB_ROWS
  const wide = Math.floor((lanes.w - 4) / 2)
  const y = Math.round(lanes.y + (row * lanes.h) / CLUB_ROWS)
  return {
    x: lanes.x + column * (lanes.w - wide),
    y,
    w: wide,
    h: Math.round(lanes.y + ((row + 1) * lanes.h) / CLUB_ROWS) - y - 1,
  }
}
/** Where a drum is drawn in its lane: after its name. */
const clubTrack = (lane: Box, parts: ClubParts): Box => ({
  ...lane,
  x: lane.x + parts.name,
  w: lane.w - parts.name,
})
/** Where the lane of a drum stands on a display of that size, and the part of it the drum is drawn in. */
export const clubLaneBox = (view: Size, drum: number): Box => clubLane(drum, clubParts(view))
export const clubTrackBox = (view: Size, drum: number): Box => {
  const parts = clubParts(view)
  return clubTrack(clubLane(drum, parts), parts)
}

/**
 * A lane's scale: time across by ratio, a millisecond at its left end and ten
 * seconds at its right, so a click of 6 ms, a hat of 50 ms and a crash of two
 * seconds all show. The lines through the lanes are at 10 ms, 100 ms and 1 s.
 */
const CLUB_SHORT_SEC = 0.001
const CLUB_LONG_SEC = CLUB_LIGHT_MOST_SEC
const CLUB_MARKS_SEC = [0.01, 0.1, 1] as const
const CLUB_DECADES = Math.log(CLUB_LONG_SEC / CLUB_SHORT_SEC)
/** Where a time stands across a drum's track. */
export const clubX = (seconds: number, box: Box): number =>
  box.x + box.w * clamp(Math.log(seconds / CLUB_SHORT_SEC) / CLUB_DECADES, 0, 1)
const clubSecondsAt = (x: number, box: Box): number =>
  CLUB_SHORT_SEC * Math.exp((CLUB_DECADES * (x - box.x)) / box.w)

/**
 * How thick a part of a drum is drawn, as a share of half its lane: by its
 * level against the drum's own, from 12 dB over it (the stick on the crash)
 * to 36 dB under, and never thinner than a line that shows.
 */
const CLUB_THICK_TOP_DB = 12
const CLUB_THICK_SPAN_DB = 48
const CLUB_THIN = 0.2
export const clubThick = (db: number): number =>
  clamp(1 - (CLUB_THICK_TOP_DB - db) / CLUB_THICK_SPAN_DB, CLUB_THIN, 1)

/** A scatter for the dots of a noise, the same every time: a number in 0..1 from a column and a row. */
function clubSpeck(column: number, row: number): number {
  let h = Math.imul(column + 1, 0x9e3779b1) ^ Math.imul(row + 17, 0x85ebca6b)
  h ^= h >>> 15
  h = Math.imul(h, 0x2c1b3c6d)
  return ((h >>> 12) & 0xff) / 256
}

/** `ClubKit::render` (lines 898 to 921): how loud a drum's air is `t` seconds after the hit against its own level, and how much of its fall is left. */
function clubAirAt(v: ClubVoice, t: number, into: { level: number; left: number }): void {
  let level = Math.min(1, v.air)
  if (v.airAttack > 0 && t < v.airAttack) level *= smoothstep(t / v.airAttack)
  if (v.bite > 0) level *= 1 + v.bite * Math.pow(10, (-3 * t) / v.biteSeconds)
  into.level = level
  const tail = t - v.bursts * v.burstGap
  // A burst of the clap is 22 dB down when the next one starts it again.
  if (v.bursts > 0)
    into.left = tail < 0 ? 1 - (t % v.burstGap) / v.airSeconds : 1 - tail / v.tailSeconds
  else into.left = 1 - t / v.airSeconds
}

const AIR_AT = { level: 0, left: 0 }
const TONE_DB = [0, 0, 0, 0]

/**
 * One drum in its track, level against time, in two parts about the middle of
 * the lane. Under the middle are its tones, solid, as thick as they are loud
 * and thinning to nothing where they have fallen 60 dB. Over it is its air:
 * scattered dots where it is noise, level lines where it is pulses (the metal
 * and the cowbell), as thick as Snap and Tone make it. The clap's bursts are
 * a ripple of a row or so in its first 32 ms, which is small at a pedal's
 * size. So a kick is a long solid bar under a short dotted front, a hat a
 * short stub of lines, the crash lines to the far end of the lane.
 */
function clubGlyph(
  ctx: CanvasRenderingContext2D,
  box: Box,
  v: ClubVoice,
  tone: number,
  sampleRate: number,
): void {
  const base = box.y + Math.floor(box.h / 2)
  const high = Math.min(base - box.y, box.y + box.h - base)
  const airDb = v.air > 0 ? dbOf(clubAirTone(v, tone, sampleRate)) : 0
  for (let k = 0; k < v.partials; k++)
    TONE_DB[k] = v.gain[k] > 0 ? dbOf(v.gain[k] * clubPartialTone(v, k, tone, sampleRate)) : -120
  for (let x = 0; x < box.w; x++) {
    const t = clubSecondsAt(box.x + x + 0.5, box)
    let body = 0
    for (let k = 0; k < v.partials; k++)
      if (v.gain[k] > 0 && t < v.seconds[k])
        body = Math.max(body, high * clubThick(TONE_DB[k]) * (1 - t / v.seconds[k]))
    if (body > 0) ctx.rect(box.x + x, base, 1, body)
    if (v.air <= 0) continue
    clubAirAt(v, t, AIR_AT)
    if (AIR_AT.left <= 0) continue
    // A row is left of it until it has fallen 60 dB, so the air is drawn as long as it rings.
    const air = Math.max(1, Math.round(high * clubThick(dbOf(AIR_AT.level) + airDb) * AIR_AT.left))
    for (let row = 0; row < air; row++) {
      // Pulses are pitches that ring: every other row a line. Noise is dots: every other one
      // along its foot, and half of them, scattered, over that.
      const blank = v.pulsed ? (row & 1) === 1 : row === 0 ? (x & 1) === 1 : clubSpeck(x, row) < 0.5
      if (!blank) ctx.rect(box.x + x, base - 1 - row, 1, 1)
    }
  }
}

/** `ClubKit::note_on` (line 132): a note that is one. A pitch or a gain that is no number, and a pitch not above zero, is dropped. */
const struck = (note: DisplayNote): boolean =>
  Number.isFinite(note.frequency) && Number.isFinite(note.gain) && note.frequency > 0

/**
 * The newest note on each key of the octave, as its place in `notes`; -1 for a
 * key that was not struck. A drum struck again starts again in its other slot
 * and the older hit fades in 4 ms (`kStealSeconds`, line 232), which no frame
 * sees. A drum is one drum whatever octave its key is played in.
 */
function newestByKey(notes: readonly DisplayNote[], into: Int32Array): Int32Array {
  into.fill(-1)
  for (let index = 0; index < notes.length; index++)
    if (struck(notes[index])) into[kitKey(notes[index].frequency)] = index
  return into
}

/** A time as it is said, to the millisecond under a tenth of a second: a closed hat rings 50 ms. */
export const clubSecondsText = (seconds: number): string =>
  seconds < 0.0995 ? `${Math.max(1, Math.round(seconds * 1000))} ms` : secondsText(seconds)

/** How strongly a lit lane is laid in the accent: this much while anything is left of the hit, up to this much for a hard hit just struck. */
export const CLUB_LIT_LEAST = 0.2
export const CLUB_LIT_MOST = 0.7

interface ClubState {
  /** The drum being drawn, set up again for each lane. */
  voice: ClubVoice
  /** The newest note on each key, as its place in the notes. */
  newest: Int32Array
  /** The drum last struck: the one the words are of. */
  last: number
}

const clubKitDisplay = plateDisplay<ClubState>({
  place: 'window',
  columns: 2,
  params: ['kit', 'tune', 'length', 'snap', 'tone', 'variation'],
  live: { signal: true, notes: true },
  info: 'Twelve lanes in key order, each drum as level against time from a millisecond to ten seconds: its tones solid under the middle, its noise dotted and its pulses lined over it, a shade where Variation may end it. A hit lights its lane for as long as the drum rings.',
  init: () => ({ voice: clubVoiceBlank(), newest: new Int32Array(DRUMS), last: CLUB_KICK }),
  draw(frame) {
    const { ctx, colours, state, notes } = frame
    ground(frame)
    const kit = frame.value('kit')
    const home = clamp(frame.value('tune'), -36, 36)
    const length = frame.value('length')
    const snap = clamp(frame.value('snap'), 0, 1)
    const tone = frame.value('tone')
    const span = clubLengthSpan(clamp(frame.value('variation'), 0, 1))
    const rate = frame.sampleRate
    const parts = clubParts(frame)
    const v = state.voice
    const newest = newestByKey(notes, state.newest)

    /** How much of the hit on a key is left, 0 for none; it sets the voice up as that hit struck it. */
    const sounding = (drum: number): number => {
      const index = newest[drum]
      if (index < 0) return 0
      const note = notes[index]
      const tuning = clubTuning(note.frequency, frame.value('tune'))
      clubVoice(drum, kit, tuning, length, snap, clamp(note.gain, 0, 1), v, rate)
      const left = clubLeft(v, note.age)
      if (drum !== CLUB_OPEN_HAT) return left
      // The closed hat chokes it, in the order the notes came. The first one after it starts the
      // fade (`ClubKit::begin_fade` never starts one again): a later one finds it gone.
      for (let later = index + 1; later < notes.length; later++)
        if (struck(notes[later]) && kitKey(notes[later].frequency) === CLUB_CLOSED_HAT)
          return left * clubChoke(notes[later].age)
      return left
    }

    let said = -1
    let saidAt = Infinity
    let saidRing = 0
    for (let drum = 0; drum < DRUMS; drum++) {
      const lane = clubLane(drum, parts)
      const track = clubTrack(lane, parts)
      const left = sounding(drum)
      const note = left > 0 ? notes[newest[drum]] : null
      // At rest a lane is its drum in the octave a kit is written in, struck firmly.
      if (!note) clubVoice(drum, kit, home, length, snap, CLUB_FIRM, v, rate)
      const ring = clubRingSeconds(v)
      fillRect(ctx, track, colours.ink, 0.07)
      for (const mark of CLUB_MARKS_SEC) {
        const x = Math.round(clubX(mark, track))
        rule(ctx, x, track.y, x, track.y + track.h, { colour: colours.ink, alpha: INK.grid })
      }
      if (span > 1) {
        // Where Variation may end the hit: up to `span` times longer or shorter.
        const from = clubX(ring / span, track)
        const wide = clubX(ring * span, track) - from
        fillRect(ctx, { x: from, y: track.y, w: wide, h: track.h }, colours.ink, INK.fill)
      }
      if (note) {
        const much =
          CLUB_LIT_LEAST + (CLUB_LIT_MOST - CLUB_LIT_LEAST) * left * clubHitLevel(note.gain)
        fillRect(ctx, track, colours.accent, much)
      }
      ctx.beginPath()
      clubGlyph(ctx, track, v, tone, rate)
      ctx.globalAlpha = 1
      ctx.fillStyle = colours.ink
      ctx.fill()
      const short = drum === CLUB_SHAKER && parts.name < CLUB_NAME_WIDE
      const name = short ? CLUB_SHAKER_SHORT : CLUB_LANE_NAMES[drum]
      text(frame, name, lane.x + 1, lane.y + lane.h - 2, {
        colour: note ? colours.accent : colours.ink,
      })
      if (!note) continue
      // The hit, as far into the lane as it has come.
      const now = clubX(Math.max(note.age, CLUB_SHORT_SEC), track)
      rule(ctx, now, track.y, now, track.y + track.h, { colour: colours.accent })
      if (note.age < saidAt) {
        saidAt = note.age
        said = drum
        saidRing = ring
      }
    }
    if (said >= 0) state.last = said
    const shown = state.last
    if (said < 0) {
      clubVoice(shown, kit, home, length, snap, CLUB_FIRM, v, rate)
      saidRing = clubRingSeconds(v)
    }

    levelFoot(frame, parts.foot, outShare(frame))

    // The words: the kit, and the drum last struck with how long it rings as struck.
    text(frame, clubKitName(kit), parts.lanes.x, parts.words)
    const words = `${CLUB_DRUM_NAMES[shown]} ${clubSecondsText(saidRing)}`
    text(frame, words, parts.lanes.x + parts.lanes.w, parts.words, { align: 'right' })
  },
})

export const CLUB_KIT_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  'club-kit': { display: clubKitDisplay, face: ['kit', 'tune', 'length', 'tone'] },
}
