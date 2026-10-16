// The display of Binaural: the tone each ear is given, over time.
//
// Two lanes, the left ear above the right, begin at the moment a key is
// struck in silence (where the device restarts its beat at the crest) and run
// to the right for a stretch of time that holds two beats or a few more. Each
// lane is that ear's sound as the device makes it: its own tone and, by Ears,
// some of the other ear's, one pair or the two of Cross, with the partials
// Warmth adds. The tones are drawn far slower than they sound (eight cycles of
// the key across the lanes), so that the left ear's is seen to be the higher
// and to drift against the right's and come round once a beat; a tick under
// the lanes marks each whole beat. Nothing in the lanes moves with the beat:
// the pattern stands still along the time axis, and a key that sounds lights
// it for as long as it sounds.
//
// Under the lanes the glide runs from Beat to Target with a dot at the place
// the device reports, and the foot fills with the level that comes out,
// averaged over one second so that a beat in the air does not make it flash.
//
// Everything here is the device's own arithmetic (`cpp/devices/binaural/
// binaural.h`, `cpp/kit/beat.h`, `cpp/kit/colour.h`): the fold of a key, the
// pair, the Ears law, Cross, the partials and which of them are split, the
// level of one key among the others, the bed's level and the glide's rate.

import {
  INK,
  clamp,
  dot,
  fillRect,
  gainToDb,
  ground,
  rule,
  text,
  trace,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { pitchName } from './instrument-parts'
import { adsrLevel, type AdsrTimes } from './instrument-subtractive'

const TWO_PI = 2 * Math.PI

// --- The device's numbers (`binaural.h`) ---------------------------------------

/** `kLowHz`, `kHighHz`: a key is brought into this range by octaves. */
const LOW_HZ = 80
const HIGH_HZ = 1000
/** `kSplitTopHz`: a partial above this is not split between the ears. */
const SPLIT_TOP_HZ = 1000
/** `kVoiceAmp`: one key at full gain, in each ear, before Volume. */
export const BINAURAL_VOICE_AMP = 0.175
/** `kSecond`, `kThird`: the second and third partial against the first at Warmth 1. */
const SECOND = 0.5
const THIRD = 0.25
/** `kBedLevel`: what the coloured noise is scaled by at Bed 1 for a key at full gain. */
const BED_LEVEL = 0.625
/** `kit::kColourRms` (`kit/colour.h`): the RMS of the coloured noise at any Colour. */
const COLOUR_RMS = 0.2
/** `set_envelope`: the decay and the sustain every key has; Attack and Release are the knobs. */
const DECAY_SEC = 0.1
const SUSTAIN = 1
/** `kVoices`: the keys that sound at once. */
const VOICES = 8

/** `Binaural::note_on` and `fold`: the pitch a key sounds at, held to 8 Hz to 12 kHz and brought into 80 Hz to 1 kHz by octaves. */
export function binauralFold(hz: number): number {
  let folded = clamp(Number.isFinite(hz) ? hz : 8, 8, 12000)
  while (folded > HIGH_HZ) folded *= 0.5
  while (folded < LOW_HZ) folded *= 2
  return folded
}

/** How one key's two ears are made, as the device has it from its knobs and the key's pitch. */
export interface BinauralTone {
  /** `kit::ear_gains`: how much of an ear's sound is its own tone, and how much the other ear's. */
  same: number
  other: number
  /** Layout Cross: two tones an ear. */
  cross: boolean
  /** The second and third partial against the first: `kSecond` and `kThird` times Warmth. */
  second: number
  third: number
  /** Whether each of them is split between the ears: only at or under `kSplitTopHz`. */
  splitSecond: boolean
  splitThird: boolean
}

export function binauralTone(value: (name: string) => number, keyHz: number): BinauralTone {
  const ears = clamp(value('ears'), 0, 1)
  const warmth = clamp(value('warmth'), 0, 1)
  return {
    same: 0.5 + 0.5 * ears,
    other: 0.5 - 0.5 * ears,
    cross: Math.round(value('layout')) === 1,
    second: SECOND * warmth,
    third: THIRD * warmth,
    splitSecond: 2 * keyHz <= SPLIT_TOP_HZ,
    splitThird: 3 * keyHz <= SPLIT_TOP_HZ,
  }
}

/**
 * What the two ears are given, left then right, written into `out`: 1 is the
 * peak of one bare key at full gain. `carrier` is the key's phase and `beat`
 * the beat's, both in cycles, so `beat` 1 is one whole beat after the crest.
 *
 * `kit::tone_pair`: hi = sin(c + h) and lo = sin(c - h), with h half of the
 * beat's phase. Cross (`Binaural::process`): the higher pair is the key less a
 * quarter of Beat and plus three quarters, the lower the key less three
 * quarters and plus a quarter, each at half the level. A partial that is
 * split is turned by the same h; one that is not is the same in both ears.
 * `kit::to_ears`: the left ear is the higher one. The whole is scaled so that
 * its peak does not move with Warmth.
 */
export function binauralEars(
  carrier: number,
  beat: number,
  tone: BinauralTone,
  out: [number, number] = [0, 0],
): [number, number] {
  const c = TWO_PI * carrier
  let sine = Math.sin(c)
  let cosine = Math.cos(c)
  let whole = 0
  if (tone.second > 0) {
    if (tone.splitSecond) {
      sine += tone.second * Math.sin(2 * c)
      cosine += tone.second * Math.cos(2 * c)
    } else whole += tone.second * Math.sin(2 * c)
    if (tone.splitThird) {
      sine += tone.third * Math.sin(3 * c)
      cosine += tone.third * Math.cos(3 * c)
    } else whole += tone.third * Math.sin(3 * c)
  }
  let hi: number
  let lo: number
  if (tone.cross) {
    const quarter = (TWO_PI * beat) / 4
    const near = sine * Math.cos(quarter)
    const nearTurn = cosine * Math.sin(quarter)
    const far = sine * Math.cos(3 * quarter)
    const farTurn = cosine * Math.sin(3 * quarter)
    hi = 0.5 * (near - nearTurn + far + farTurn)
    lo = 0.5 * (far - farTurn + near + nearTurn)
  } else {
    const half = (TWO_PI * beat) / 2
    const together = sine * Math.cos(half)
    const apart = cosine * Math.sin(half)
    hi = together + apart
    lo = together - apart
  }
  const scale = 1 / (1 + tone.second + tone.third)
  out[0] = (tone.same * hi + tone.other * lo + whole) * scale
  out[1] = (tone.other * hi + tone.same * lo + whole) * scale
  return out
}

/**
 * `kit::RateGlide`: the beat's rate at `place` of the way from Beat to Target,
 * by ratio (half way in pitch at half time). With Glide at 0 it is Beat.
 */
export function binauralRate(beat: number, target: number, glide: number, place: number): number {
  if (!(glide > 0) || !(beat > 0) || !(target > 0)) return beat
  return beat * Math.pow(target / beat, clamp(place, 0, 1))
}

/**
 * The bed's RMS against the peak of one bare key at the same touch: Bed
 * squared times `kBedLevel`, on noise of RMS `kColourRms`, over `kVoiceAmp`.
 */
export function binauralBedShare(bed: number): number {
  const knob = clamp(bed, 0, 1)
  return (knob * knob * BED_LEVEL * COLOUR_RMS) / BINAURAL_VOICE_AMP
}

/** The envelope every key has (`set_envelope`). */
export const binauralTimes = (attack: number, release: number): AdsrTimes => ({
  attack,
  decay: DECAY_SEC,
  sustain: SUSTAIN,
  release,
})

/**
 * The key the lanes show, when one sounds: the newest of them, at the pitch it
 * is folded to and as tall as the device makes it among the others. The sum
 * of the keys is scaled by one over the root of the sum of their envelopes
 * squared, once that is over one (`Binaural::process`, `norm`).
 */
export function binauralSounding(
  notes: readonly DisplayNote[],
  times: AdsrTimes,
): { hz: number; level: number } | null {
  let hz = 0
  let own = 0
  let power = 0
  let count = 0
  for (let i = notes.length - 1; i >= 0 && count < VOICES; i--) {
    const note = notes[i]
    const env = adsrLevel(times, note.age, note.released)
    if (!(env > 0)) continue
    if (count === 0) {
      hz = binauralFold(note.frequency)
      own = env * clamp(Number.isFinite(note.gain) ? note.gain : 0.5, 0, 1)
    }
    power += env * env
    count++
  }
  return count === 0 ? null : { hz, level: own / Math.sqrt(Math.max(1, power)) }
}

// --- The time axis ------------------------------------------------------------

/** How many cycles of the key lie across the lanes: the tones are drawn this slowly, whatever the key. */
export const BINAURAL_DRAWN_CYCLES = 8
/** The lanes hold at least this many beats. */
const LEAST_BEATS = 2
/** The lengths of time the lanes may span, in each power of ten. */
const SPAN_STEPS = [1, 1.5, 2, 3, 5, 7.5]

/**
 * How long a time the lanes span at a rate, in seconds: the shortest of 1,
 * 1.5, 2, 3, 5 and 7.5 times a power of ten that holds two beats. So two
 * beats to three and a third stand across them at any rate, 0.5 Hz in five
 * seconds and 40 Hz in fifty milliseconds.
 */
export function binauralSpan(rate: number): number {
  const need = LEAST_BEATS / clamp(Number.isFinite(rate) ? rate : 1, 0.01, 1000)
  const decade = Math.pow(10, Math.floor(Math.log10(need)))
  for (const step of SPAN_STEPS) if (step * decade >= need * (1 - 1e-9)) return step * decade
  return 10 * decade
}

const trimmed = (value: number, digits: number): string => String(Number(value.toFixed(digits)))

/** A rate as it is written: "6", "0.5", "7.4". */
export const binauralRateText = (hz: number): string => trimmed(hz, 1)

/** A span of time as it is written: "5 s", "1.5 s", "750 ms", "50 ms". */
export function binauralSpanText(seconds: number): string {
  return seconds >= 1 ? `${trimmed(seconds, 2)} s` : `${trimmed(seconds * 1000, 0)} ms`
}

/** The time a glide has left as it is written: "0:42", "12:08". */
export function binauralTimeText(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

// --- Where things stand -------------------------------------------------------

export interface BinauralLayout {
  /** The two lanes: the left ear's above, the right ear's below. */
  left: Box
  right: Box
  /** How far a tone at full swing stands from a lane's middle. */
  reach: number
  /** Where the ticks for the whole beats begin, under the lanes. */
  ticks: number
  /** The baselines of the words above the lanes and below them, and their two ends. */
  top: number
  row: number
  edge: number
  far: number
  /** The glide's line: from Beat at `x` to Target at `x + w`, `reach` up or down from `y`. */
  glide: { x: number; w: number; y: number; reach: number }
  foot: Box
}

/** Laid out from the size it is given. */
export function binauralLayout(view: Pick<DisplayView, 'width' | 'height'>): BinauralLayout {
  const { width, height } = view
  const x = 14
  const w = Math.max(16, width - 19)
  const top = 16
  const bottom = Math.max(top + 14, height - 28)
  const lane = Math.floor((bottom - top - 2) / 2)
  return {
    left: { x, y: top, w, h: lane },
    right: { x, y: top + lane + 2, w, h: lane },
    reach: lane / 2 - 1.5,
    ticks: top + 2 * lane + 2,
    top: 12,
    row: height - 14,
    edge: 5,
    far: width - 5,
    glide: { x, w: Math.round(w * 0.38), y: height - 17, reach: 3 },
    foot: { x: 4, y: height - 10, w: width - 8, h: 5 },
  }
}

/** How high a rate stands on the glide's line: by ratio, the lowest Beat at the foot and the highest at the top. */
function glideY(lay: BinauralLayout, rate: number, lowest: number, highest: number): number {
  const share = Math.log(clamp(rate, lowest, highest) / lowest) / Math.log(highest / lowest)
  return lay.glide.y + lay.glide.reach * (1 - 2 * share)
}

// --- The display --------------------------------------------------------------

/** The pitch the lanes are drawn for while no key sounds: both partials of it are split. */
export const BINAURAL_REST_HZ = 220
/** The level is averaged over this long. */
const MEAN_SEC = 1
/** The rate and the glide's place are taken from the device this often while a glide runs: twice a second. */
export const BINAURAL_HOLD_SEC = 0.5
/** The foot's scale: from this many dB under full scale. */
export const BINAURAL_FLOOR_DB = -60

export interface BinauralState {
  /** The knobs the glide is made of, as they stood when the rate was last taken. */
  beat: number
  target: number
  glide: number
  /** The glide's place, held between two takings, and when it was taken. */
  place: number
  since: number
  /** The output's power in the frames of the last second, each with how long it stood. */
  spans: number[]
  powers: number[]
  /** The level as the foot shows it, as a share of its scale. */
  shown: number
}

/**
 * How much of the last second lies between two ages (seconds back from now),
 * weighted so that its middle counts most and its two ends not at all: the
 * integral of 1 - cos(2 pi age / second). Over the whole second it is the
 * second itself.
 */
function meanWeight(from: number, to: number): number {
  const turn = TWO_PI / MEAN_SEC
  return to - from - (Math.sin(turn * to) - Math.sin(turn * from)) / turn
}

/**
 * The level that came out over the last second, as a gain: the mean of the
 * power, the middle of the second counting most, and what came before the
 * display ran counting as silence. A beat in the air swings the level many
 * times a second; this mean of it does not: of a swing at 3.5 Hz or faster
 * less than a seventieth is left, and a slower one is slow.
 */
export function binauralMeanLevel(
  state: Pick<BinauralState, 'spans' | 'powers'>,
  frame: Pick<DisplayFrame, 'signal' | 'powered' | 'dt'>,
): number {
  const { spans, powers } = state
  if (!frame.powered || !frame.signal || !(frame.dt > 0)) {
    spans.length = 0
    powers.length = 0
    return 0
  }
  const rms = frame.signal.output.rms
  spans.push(Math.min(frame.dt, MEAN_SEC))
  powers.push(Number.isFinite(rms) ? rms * rms : 0)
  let sum = 0
  let age = 0
  for (let i = spans.length - 1; i >= 0; i--) {
    const to = Math.min(MEAN_SEC, age + spans[i])
    sum += powers[i] * meanWeight(age, to)
    age += spans[i]
    if (age >= MEAN_SEC) {
      // What is older than the second is let go.
      spans.splice(0, i)
      powers.splice(0, i)
      break
    }
  }
  return Math.sqrt(Math.max(0, sum) / MEAN_SEC)
}

const binaural = plateDisplay<BinauralState>({
  place: 'window',
  columns: 2,
  params: ['beat', 'ears', 'layout', 'warmth', 'bed', 'target', 'glide', 'attack', 'release'],
  live: { meters: true, signal: true, notes: true },
  info: 'The tone each ear is given, left above right, over the time from a key struck in silence, drawn far slower than it sounds so the drift between the two shows. A tick marks each whole beat, a band the bed. Below, the glide with a dot where it stands, and the level over the last second.',
  init: () => ({
    beat: NaN,
    target: NaN,
    glide: NaN,
    place: 0,
    since: 0,
    spans: [],
    powers: [],
    shown: 0,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const lay = binauralLayout(frame)
    const beat = frame.value('beat')
    const target = frame.value('target')
    const glide = frame.value('glide')
    const gliding = glide > 0

    // Where the glide is: the device's reading. It is taken when a knob of
    // the glide moves and otherwise twice a second, and the rate follows from
    // it, so the lanes are drawn again at that pace and no faster.
    const read = gliding && frame.hasMeter('glide') ? frame.meter('glide') : 0
    const reading = Number.isFinite(read) ? clamp(read, 0, 1) : 0
    const moved = beat !== state.beat || target !== state.target || glide !== state.glide
    const due = frame.now - state.since >= BINAURAL_HOLD_SEC || frame.now < state.since
    if (moved || due || !(frame.dt > 0)) {
      state.beat = beat
      state.target = target
      state.glide = glide
      state.place = reading
      state.since = frame.now
    }
    const { place } = state
    const rate = binauralRate(beat, target, glide, place)
    const span = binauralSpan(rate)
    const beats = rate * span

    // The key that lights the lanes, and how its ears are made.
    const times = binauralTimes(frame.value('attack'), frame.value('release'))
    const sounding = frame.powered ? binauralSounding(frame.notes, times) : null
    const tone = binauralTone(
      (name) => frame.value(name),
      sounding ? sounding.hz : BINAURAL_REST_HZ,
    )
    const bed = Math.min(1, binauralBedShare(frame.value('bed')))

    // --- The lanes ---
    const step = tone.second > 0 ? 0.5 : 1
    const count = Math.max(2, Math.round(lay.left.w / step))
    const lanes = [lay.left, lay.right]
    const rest: Point[][] = [[], []]
    const lit: Point[][] = [[], []]
    const level = sounding ? sounding.level : 0
    const pair: [number, number] = [0, 0]
    for (let i = 0; i <= count; i++) {
      const along = i / count
      binauralEars(BINAURAL_DRAWN_CYCLES * along, beats * along, tone, pair)
      for (let ear = 0; ear < 2; ear++) {
        const lane = lanes[ear]
        const x = lane.x + along * lane.w
        const middle = lane.y + lane.h / 2
        rest[ear].push([x, middle - pair[ear] * lay.reach])
        if (level > 0) lit[ear].push([x, middle - pair[ear] * lay.reach * level])
      }
    }
    lanes.forEach((lane, ear) => {
      const middle = lane.y + lane.h / 2
      // The bed: a band as tall as its RMS stands against a key at full swing.
      const band = bed * lay.reach
      fillRect(ctx, { x: lane.x, y: middle - band, w: lane.w, h: 2 * band }, colours.ink, INK.fill)
      rule(ctx, lane.x, middle, lane.x + lane.w, middle, { colour: colours.ink, alpha: INK.grid })
      trace(ctx, rest[ear], {
        colour: colours.ink,
        width: 1.25,
        alpha: level > 0 ? INK.back : INK.trace,
      })
      if (level > 0) trace(ctx, lit[ear], { colour: colours.accent, width: 1.25 })
      text(frame, ear === 0 ? 'L' : 'R', lay.edge, middle + 3)
    })
    // A tick where each whole beat falls: the two ears stand as they did at the start.
    for (let whole = 0; whole <= beats + 1e-9; whole++) {
      const x = lay.left.x + (whole / beats) * lay.left.w
      rule(ctx, x, lay.ticks, x, lay.ticks + 3, { colour: colours.ink, alpha: INK.rule })
    }

    // --- The words: the rate now and where it is going, the layout and the key ---
    const waiting = gliding && place < 1
    text(
      frame,
      waiting
        ? `${binauralRateText(rate)} to ${binauralRateText(target)} Hz`
        : `${binauralRateText(rate)} Hz`,
      lay.edge,
      lay.top,
    )
    const layout = tone.cross ? 'Cross' : 'Pair'
    text(frame, sounding ? `${layout} ${pitchName(sounding.hz)}` : layout, lay.far, lay.top, {
      align: 'right',
    })
    text(frame, binauralSpanText(span), lay.far, lay.row, { align: 'right', alpha: INK.text })

    // --- The glide: Beat at the left, Target at the right, a dot where it is ---
    if (gliding) {
      const lowest = frame.spec('beat')?.min ?? 0.5
      const highest = frame.spec('beat')?.max ?? 40
      const from = glideY(lay, beat, lowest, highest)
      const to = glideY(lay, target, lowest, highest)
      const { x, w } = lay.glide
      rule(ctx, x, lay.glide.y - 4, x, lay.glide.y + 4, { colour: colours.ink, alpha: INK.rule })
      rule(ctx, x + w, lay.glide.y - 4, x + w, lay.glide.y + 4, {
        colour: colours.ink,
        alpha: INK.rule,
      })
      trace(
        ctx,
        [
          [x, from],
          [x + w, to],
        ],
        { colour: colours.ink, width: 1, alpha: INK.text },
      )
      dot(ctx, x + place * w, from + place * (to - from), 2.5, colours.accent, {
        ring: colours.ink,
      })
      if (place < 1)
        text(frame, binauralTimeText((1 - place) * glide * 60), x + w + 5, lay.row, {
          alpha: INK.text,
        })
    }

    // --- The level that comes out, over the last second ---
    const mean = binauralMeanLevel(state, frame)
    const db = mean > 0 ? gainToDb(mean) : -Infinity
    const share = Number.isFinite(db) ? clamp(1 - db / BINAURAL_FLOOR_DB, 0, 1) : 0
    // It moves by whole pixels: what is left of a beat in the mean is less than one.
    if (share === 0 || Math.abs(share - state.shown) * lay.foot.w >= 1) state.shown = share
    const { foot } = lay
    fillRect(ctx, foot, colours.ink, INK.fill)
    const wide = state.shown * foot.w
    ctx.globalAlpha = 1
    ctx.fillStyle = colours.accent
    ctx.fillRect(foot.x + (foot.w - wide) / 2, foot.y, wide, foot.h)
    ctx.globalAlpha = INK.rule
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.strokeRect(foot.x + 0.5, foot.y + 0.5, foot.w - 1, foot.h - 1)
    ctx.globalAlpha = 1
  },
})

export const BINAURAL_FACES: Readonly<Record<string, PlateFace>> = {
  binaural: { display: binaural, face: ['beat', 'ears', 'layout', 'warmth'] },
}
