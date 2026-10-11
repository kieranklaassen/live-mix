// Displays of the guitars: strings under a pick, a thumb or a bar.
//
// Each is the instrument seen from above, its bridge at the left, over the
// level that comes out. The electric guitar is its neck and the pickup under
// the strings, and below them what that pickup hears of a note. The acoustic
// is its body and sound hole, and below them what the box adds. The steel is
// its ten strings under the bar, and below them what the foot on the volume
// pedal and the hand on the bar do in the seconds after a pick.

import {
  INK,
  biquad,
  biquadDb,
  clamp,
  clipped,
  dot,
  fillRect,
  gainToDb,
  ground,
  handle,
  hzOfX,
  hzText,
  label,
  lerp,
  rule,
  text,
  xOfHz,
  type Biquad,
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

// --- What they share ---------------------------------------------------------

/** A level that has fallen `seconds` into a ring of `ring` seconds to 60 dB under itself, as a gain. */
const rung = (seconds: number, ring: number): number => Math.pow(10, (-3 * seconds) / ring)

/** A level in dB under a full pluck as a share of the 60 dB a ring is: 1 at the pluck, 0 when it has died. */
const shareOfDb = (db: number): number => clamp(1 + db / 60, 0, 1)

/** Under this share of its light a string is done. */
const DONE = 0.02

/** Notes this near in time were played as one chord: a block of sound at 48 kHz is under 3 ms, a hand is not this even. */
const CHORD_SEC = 0.03

/**
 * When each note of a strummed chord is picked: seconds after it was sent,
 * one figure per note in the order of `notes`, written into `into`. Both
 * guitars sort a chord by pitch and pick it `step` seconds apart from the
 * lowest note up, however many notes it has; a note alone is not held back.
 */
export function strummed(notes: readonly DisplayNote[], step: number, into: number[]): number[] {
  into.length = notes.length
  into.fill(0)
  if (step <= 0) return into
  // `frame.notes` is oldest first, so a chord is a run of neighbours.
  let from = 0
  while (from < notes.length) {
    let to = from + 1
    while (to < notes.length && notes[from].age - notes[to].age <= CHORD_SEC) to++
    for (let i = from; i < to; i++) {
      let below = 0
      for (let j = from; j < to; j++) {
        const lower =
          notes[j].frequency < notes[i].frequency ||
          (notes[j].frequency === notes[i].frequency && j < i)
        if (lower) below++
      }
      into[i] = below * step
    }
    from = to
  }
  return into
}

/** The loop of a string: the pole of its low-pass and its gain once round. */
export interface StringLoss {
  pole: number
  gain: number
}

const lossMagnitude = (pole: number, w: number): number =>
  (1 - pole) / Math.sqrt(1 - 2 * pole * Math.cos(w) + pole * pole)

/**
 * `PluckedString::design` in `kit/string.h`: the loss a string's loop is given
 * so that its fundamental rings `seconds` and a partial at `highHz` (or an
 * octave above the note, when that is higher) rings `highSeconds`. Written
 * into `into`.
 */
export function stringLoss(
  hz: number,
  seconds: number,
  highSeconds: number,
  highHz: number,
  sampleRate: number,
  into: StringLoss,
): StringLoss {
  const ring = Math.max(seconds, 0.001)
  const high = clamp(highSeconds, 0.0005, ring)
  const w1 = (2 * Math.PI * hz) / sampleRate
  const w2 = (2 * Math.PI * clamp(Math.max(highHz, 2 * hz), 0, 0.45 * sampleRate)) / sampleRate
  const gain1 = Math.pow(10, -3 / (hz * ring))
  const wanted = Math.pow(10, -3 / (hz * high)) / gain1
  const ratio = (pole: number): number => lossMagnitude(pole, w2) / lossMagnitude(pole, w1)
  let pole = 0
  if (w2 > w1 && wanted < 1) {
    let low = 0
    let top = 0.98
    if (ratio(top) < wanted) {
      for (let i = 0; i < 24; i++) {
        const middle = 0.5 * (low + top)
        if (ratio(middle) > wanted) low = middle
        else top = middle
      }
    }
    pole = top
  }
  into.pole = pole
  into.gain = Math.min(gain1 / lossMagnitude(pole, w1), 0.99999)
  return into
}

/** Seconds the partial at `partialHz` of a string at `hz` rings with that loss: what it loses once round, once a period. */
export function partialSeconds(
  loss: StringLoss,
  hz: number,
  partialHz: number,
  sampleRate: number,
): number {
  const w = (2 * Math.PI * Math.min(partialHz, 0.49 * sampleRate)) / sampleRate
  const round = loss.gain * lossMagnitude(loss.pole, w)
  return round < 1 ? -3 / (hz * Math.log10(round)) : Infinity
}

/**
 * A string that rings, as the eye sees it: the spindle between its two ends
 * that its swing fills. `from` is the bridge and `to` the nut or the finger,
 * `at` the place it was plucked, `wide` half its width there in pixels.
 * `corner` is how much of the pluck's corner is left: 1 is the two straight
 * lines of a string just let go, 0 the single bow of a fundamental alone.
 * `heard` is how much of it is heard, 0..1: a string that has nearly died,
 * or is still behind a swell, is pale.
 */
function spindle(
  frame: Paint,
  from: number,
  to: number,
  y: number,
  at: number,
  wide: number,
  corner: number,
  heard: number,
): void {
  const { ctx, colours } = frame
  const long = to - from
  if (long <= 0) return
  const pluck = clamp((at - from) / long, 0.02, 0.98)
  const shape = (u: number): number =>
    lerp(Math.sin(Math.PI * u), u < pluck ? u / pluck : (1 - u) / (1 - pluck), corner)
  const steps = 12
  ctx.beginPath()
  ctx.moveTo(from, y)
  for (const side of [-1, 1]) {
    // Out along one side and back along the other, the corner a point of its own.
    let cornered = false
    for (let step = 1; step <= steps; step++) {
      const u = side < 0 ? step / steps : 1 - step / steps
      const passed = side < 0 ? u > pluck : u < pluck
      if (!cornered && passed) {
        ctx.lineTo(from + pluck * long, y + side * wide)
        cornered = true
      }
      ctx.lineTo(from + u * long, y + side * wide * shape(u))
    }
  }
  ctx.closePath()
  ctx.fillStyle = colours.accent
  ctx.globalAlpha = 0.4 * heard
  ctx.fill()
  ctx.strokeStyle = colours.accent
  ctx.globalAlpha = lerp(0.3, 1, heard)
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.globalAlpha = 1
}

/** The frequencies the lower part of a guitar's display spans, on a scale of octaves. */
const COLOUR_LOW_HZ = 70
const COLOUR_HIGH_HZ = 9000

/** The rate the fixed filters' curves are worked out at; they lie far under half of any rate in use. */
const CURVE_RATE = 48000

// --- Guitar ------------------------------------------------------------------

/** `guitar.h`, `kOpenHz`: the open strings, low E to high E. */
const GUITAR_OPEN_HZ = [82.407, 110, 146.832, 195.998, 246.942, 329.628] as const
/** `guitar.h`: the pickup's distance from the bridge over the open string, at the two ends of Pickup. */
const GUITAR_BRIDGE_PICKUP = 0.065
const GUITAR_NECK_PICKUP = 0.25
const GUITAR_FOLD_FLOOR = 0.12
/** `guitar.h`: how much of each polarisation the pickup hears, and how soon the first dies against the second. */
const GUITAR_FIRST = 0.72
const GUITAR_SECOND = 0.34
const GUITAR_FIRST_DECAY = 0.55
/** `guitar.h`: a finger on the string at key up (the tail and the partials near 3 kHz), the share of a swell its 10 to 90 % takes. */
const GUITAR_DAMP_SECONDS = 0.14
const GUITAR_DAMP_HIGH_SECONDS = 0.035
const GUITAR_SWELL_RISE = 0.608
/** `guitar.h`: how much of what the pickup's place takes from the fundamental is given back, and what a high note is given, as powers. */
const GUITAR_TRIM_POWER = 0.5
const GUITAR_PITCH_TILT = 0.3
/** `guitar.h`: the partials near 3 kHz ring this share of the fundamental's time, string by string. */
const GUITAR_HIGH_HZ = 3000
const GUITAR_HIGH_DECAY = [0.045, 0.05, 0.055, 0.08, 0.09, 0.1] as const
const GUITAR_SHORTEST_HIGH = 0.06
const GUITAR_FILTER_SHARE = 0.6
const GUITAR_RESONANCE_Q = 1.7
/** `Guitar::note_on`: the pitches it plays, and how many notes at once. */
const GUITAR_LOWEST_HZ = 24
const GUITAR_HIGHEST_HZ = 4200
const GUITAR_VOICES = 12
/** `Guitar::init`: the tone stack's scoop and the speaker, which no knob moves. */
const GUITAR_SPEAKER: readonly Biquad[] = [
  biquad('peaking', 480, 0.7, -4, CURVE_RATE),
  biquad('highpass', 85, 0.75, 0, CURVE_RATE),
  biquad('peaking', 2600, 0.9, 3, CURVE_RATE),
]
const GUITAR_SPEAKER_TOP_HZ = 5000

/** `Guitar::string_for`: the string a note is played on, 0 the low E: the highest whose open pitch is not above it. */
export function guitarString(hz: number): number {
  let string = 0
  for (let s = 1; s < GUITAR_OPEN_HZ.length; s++) if (hz >= GUITAR_OPEN_HZ[s] * 0.999) string = s
  return string
}

/** `Guitar::fret_ratio`: the open string's length over the note's, 2^(fret / 12). */
export const guitarFretRatio = (hz: number): number => hz / GUITAR_OPEN_HZ[guitarString(hz)]

/** `Guitar::pickup_open_fraction`: where Pickup puts the pickup on the open string, from the bridge. */
export const guitarPickupPlace = (pickup: number): number =>
  lerp(GUITAR_BRIDGE_PICKUP, GUITAR_NECK_PICKUP, clamp(pickup, 0, 1))

/** `Guitar::pickup_fraction`: the pickup's place on what a fret leaves of the string, folded about its middle. */
export function guitarPickupFraction(place: number, ratio: number): number {
  let q = place * ratio
  if (q > 0.5) q = Math.max(1 - q, GUITAR_FOLD_FLOOR)
  return Math.max(q, 0.01)
}

/** `Guitar::pick_fraction`: the pick's place on what a fret leaves of the string. */
export const guitarPickFraction = (position: number, ratio: number): number =>
  clamp(position * ratio, 0.02, 0.5)

/** `Guitar::sustain_seconds`: seconds the tail of a held note at `hz` takes to fall 60 dB. */
export const guitarRingSeconds = (hz: number, sustain: number): number =>
  sustain * clamp(Math.sqrt(110 / hz), 0.2, 1.4)

/** `Guitar::ring_high_seconds`: seconds its partials near 3 kHz take. */
export function guitarHighSeconds(hz: number, sustain: number): number {
  const seconds = guitarRingSeconds(hz, sustain)
  const nearness = hz / Math.max(GUITAR_HIGH_HZ, 2 * hz)
  return Math.max(
    seconds * GUITAR_HIGH_DECAY[guitarString(hz)],
    GUITAR_SHORTEST_HIGH,
    (seconds * nearness * nearness) / GUITAR_FILTER_SHARE,
  )
}

/** `Guitar::render`: what the volume pedal lets through `seconds` after the pick, 0..1. */
export function guitarSwell(seconds: number, swell: number): number {
  if (swell <= 0) return 1
  const along = clamp((GUITAR_SWELL_RISE * seconds) / swell, 0, 1)
  return along * along * (3 - 2 * along)
}

/**
 * `Guitar::advance_damp`: the loop of a string at `hz` under the finger that
 * key up lays on it: the tail has 0.14 s left and the partials near 3 kHz
 * 35 ms, so the top of the note goes first. Written into `into`.
 */
export function guitarDampedLoss(
  hz: number,
  sustain: number,
  sampleRate: number,
  into: StringLoss,
): StringLoss {
  return stringLoss(
    hz,
    Math.min(guitarRingSeconds(hz, sustain), GUITAR_DAMP_SECONDS),
    Math.min(guitarHighSeconds(hz, sustain), GUITAR_DAMP_HIGH_SECONDS),
    GUITAR_HIGH_HZ,
    sampleRate,
    into,
  )
}

/** `Guitar::strike`: how hard a key's gain plucks the string. */
const guitarPluck = (gain: number): number => 0.25 + 0.75 * gain * Math.sqrt(gain)

/**
 * How far a string has fallen, in dB under a full pluck: picked `since`
 * seconds ago as hard as `gain`, let go `released` seconds ago (null while it
 * is held), its tail ringing `ring` seconds. The two polarisations of
 * `Guitar::set_ring` fall at their own pace and beat against each other at
 * Shimmer; from key up both fall as `Guitar::advance_damp` leaves them. A key
 * let go before its pick came is picked all the same and damped at once.
 */
export function guitarStringDb(
  since: number,
  gain: number,
  released: number | null,
  ring: number,
  shimmer: number,
): number {
  const after = released === null ? 0 : Math.min(released, since)
  const held = since - after
  const damped = Math.min(ring, GUITAR_DAMP_SECONDS)
  const first =
    GUITAR_FIRST * rung(held, ring * GUITAR_FIRST_DECAY) * rung(after, damped * GUITAR_FIRST_DECAY)
  const second = GUITAR_SECOND * rung(held, ring) * rung(after, damped)
  const beat = Math.cos(2 * Math.PI * shimmer * since)
  const both = Math.sqrt(first * first + second * second + 2 * first * second * beat)
  return gainToDb((guitarPluck(gain) * both) / (GUITAR_FIRST + GUITAR_SECOND))
}

/**
 * `Guitar::strike`: the level a note is given whatever its partials, in dB.
 * `level_trim` gives back half (in dB) of what a pickup at `pickup` of the
 * sounding length takes from the fundamental, so a bridge pickup is thinner
 * and not only quieter; and a note is lifted by the 0.3 power of its pitch
 * over 110 Hz, for the partials the speaker takes from a high one.
 */
export const guitarLevelDb = (noteHz: number, pickup: number): number =>
  gainToDb(
    Math.pow(2 * Math.sin(Math.PI * pickup), -GUITAR_TRIM_POWER) *
      clamp(Math.pow(noteHz / 110, GUITAR_PITCH_TILT), 0.7, 2.2),
  )

/**
 * What the pickup, the amplifier and the speaker make of a string's partial
 * at `hz`, in dB: the pluck's own fall (`PluckExciter`: 6 dB an octave from
 * the note up, and again from the pick's corner), the comb of the place it is
 * picked and of the place it is heard, the level the note is given for them,
 * the pickup's resonance at Tone, and the scoop and the speaker of
 * `Guitar::init`. `lift` is the amplifier's gain for a quiet note.
 */
export function guitarColourDb(
  hz: number,
  noteHz: number,
  pick: number,
  pickup: number,
  pickHz: number,
  tone: number,
  lift: number,
): number {
  const n = hz / noteHz
  const pluck = 1 / Math.sqrt((1 + n * n) * (1 + (hz / pickHz) * (hz / pickHz)))
  const combs = 4 * Math.abs(Math.sin(Math.PI * n * pick) * Math.sin(Math.PI * n * pickup))
  const x = hz / tone
  const resonance =
    1 / Math.sqrt((1 - x * x) * (1 - x * x) + (x / GUITAR_RESONANCE_Q) * (x / GUITAR_RESONANCE_Q))
  let db = gainToDb(pluck * combs * resonance) + guitarLevelDb(noteHz, pickup) + lift
  for (const part of GUITAR_SPEAKER) db += biquadDb(part, hz, CURVE_RATE)
  // Two sections of a fourth-order low-pass.
  return db - 10 * Math.log10(1 + Math.pow(hz / GUITAR_SPEAKER_TOP_HZ, 8))
}

/** `Guitar::strike`: the corner of the pick's low-pass, by Hardness and by how hard the key is played. */
export const guitarPickHz = (hardness: number, gain: number): number =>
  300 * Math.pow(32, hardness) * (0.3 + gain)

/** `Guitar::apply`: what Warmth gives a quiet note: it is driven harder and made up by less. */
export const guitarWarmthDb = (warmth: number): number =>
  20 * 0.4 * Math.log10(1 + 4 * warmth * warmth)

/** The levels the colour spans, top to foot. */
const GUITAR_TOP_DB = 18
const GUITAR_FOOT_DB = -42
/** The note whose colour stands at rest: the open A, where a note rings as long as Sustain says. */
const GUITAR_REST_HZ = 110
/** How hard that note is taken to be played. */
const GUITAR_REST_GAIN = 0.8
const GUITAR_FRETS = 22
const GUITAR_DOTS = [3, 5, 7, 9, 12, 15, 17, 19, 21] as const

interface GuitarParts {
  /** The strings: the bridge at `x`, the nut at `x + w`, the low E at the foot. */
  neck: Box
  /** What the pickup hears, by frequency. */
  colour: Box
  foot: Box
}

function guitarParts(view: Size): GuitarParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const foot: Box = { x: all.x, y: all.y + all.h - 4, w: all.w, h: 4 }
  const tall = Math.max(10, Math.round(all.h * 0.29))
  const colour: Box = { x: all.x + 2, y: foot.y - 3 - tall, w: all.w - 4, h: tall }
  const top = all.y + 14
  return {
    neck: { x: all.x + 6, y: top, w: all.w - 10, h: Math.max(12, colour.y - 9 - top) },
    colour,
    foot,
  }
}

const guitarStringY = (neck: Box, string: number): number =>
  neck.y + neck.h * (1 - (string + 0.5) / GUITAR_OPEN_HZ.length)

interface GuitarState {
  delays: number[]
  /** The loop of the note whose partials are shown: as it rings, and under a finger. */
  loss: StringLoss
  damped: StringLoss
}

const guitar = plateDisplay<GuitarState>({
  place: 'window',
  columns: 2,
  params: [
    'pickup',
    'position',
    'hardness',
    'sustain',
    'tone',
    'swell',
    'strum',
    'shimmer',
    'warmth',
  ],
  live: { signal: true, notes: true },
  info: 'The neck from the bridge at the left, the pickup under the strings and the dashed line where they are picked. Below, what the pickup hears of the note, partial by partial. A played string swings from the bridge to its fret. Drag the three handles to set Pickup, Position and Tone.',
  init: () => ({ delays: [], loss: { pole: 0, gain: 0 }, damped: { pole: 0, gain: 0 } }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { neck, colour, foot } = guitarParts(frame)
    const place = guitarPickupPlace(frame.value('pickup'))
    const position = frame.value('position')
    const hardness = clamp(frame.value('hardness'), 0, 1)
    const sustain = frame.value('sustain')
    const tone = frame.value('tone')
    const swell = frame.value('swell')
    const shimmer = frame.value('shimmer')
    const lift = guitarWarmthDb(frame.value('warmth'))
    const xOf = (share: number): number => neck.x + share * neck.w
    const top = neck.y
    const low = neck.y + neck.h

    // The fingerboard and its frets, each a semitone's ratio nearer the bridge than the last.
    const boardEnd = xOf(Math.pow(2, -GUITAR_FRETS / 12))
    fillRect(ctx, { x: boardEnd, y: top, w: xOf(1) - boardEnd, h: neck.h }, colours.ink, 0.07)
    ctx.beginPath()
    for (let fret = 1; fret <= GUITAR_FRETS; fret++) {
      const x = Math.floor(xOf(Math.pow(2, -fret / 12))) + 0.5
      ctx.moveTo(x, top)
      ctx.lineTo(x, low)
    }
    ctx.globalAlpha = INK.rule
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.globalAlpha = 1
    for (const fret of GUITAR_DOTS) {
      const x = (xOf(Math.pow(2, -fret / 12)) + xOf(Math.pow(2, -(fret - 1) / 12))) / 2
      if (fret === 12) {
        dot(ctx, x, top + neck.h / 6, 1, colours.ink, { alpha: INK.back })
        dot(ctx, x, low - neck.h / 6, 1, colours.ink, { alpha: INK.back })
      } else {
        dot(ctx, x, top + neck.h / 2, 1, colours.ink, { alpha: INK.back })
      }
    }
    // The nut and the bridge.
    rule(ctx, xOf(1), top, xOf(1), low, { colour: colours.ink, width: 2, alpha: INK.text })
    rule(ctx, xOf(0), top, xOf(0), low, { colour: colours.ink, width: 2, alpha: INK.text })

    // The strings, the wound ones heavier.
    for (let string = 0; string < GUITAR_OPEN_HZ.length; string++) {
      const y = guitarStringY(neck, string)
      rule(ctx, xOf(0), y, xOf(1), y, {
        colour: colours.ink,
        width: string < 3 ? 1.5 - string * 0.2 : 1,
        alpha: string < 3 ? INK.text : INK.back + 0.1,
      })
    }

    // The pickup under them, and the line where the pick meets them.
    const pickupX = xOf(place)
    fillRect(ctx, { x: pickupX - 3, y: top - 2, w: 6, h: neck.h + 4 }, colours.ink, INK.trace)
    for (let string = 0; string < GUITAR_OPEN_HZ.length; string++) {
      dot(ctx, pickupX, guitarStringY(neck, string), 1.25, colours.plate)
    }
    const pickX = xOf(position)
    rule(ctx, pickX, top - 2, pickX, low + 4, {
      colour: colours.ink,
      alpha: INK.trace,
      dash: [2, 2],
    })

    // The strings that are played, the newest first: twelve at most sound.
    const notes = frame.notes
    const step = frame.value('strum') / 1000 / (GUITAR_OPEN_HZ.length - 1)
    const delays = strummed(notes, step, state.delays)
    let lit = 0
    let said: DisplayNote | null = null
    let saidSince = 0
    for (let index = notes.length - 1; index >= 0 && lit < GUITAR_VOICES; index--) {
      const note = notes[index]
      const since = note.age - delays[index]
      if (since < 0 || guitarTakenOver(notes, delays, index)) continue
      const hz = guitarHz(note.frequency, frame.sampleRate)
      const ring = guitarRingSeconds(hz, sustain)
      const share = shareOfDb(guitarStringDb(since, note.gain, note.released, ring, shimmer))
      if (share < DONE) continue
      if (!said) {
        said = note
        saidSince = since
      }
      lit++
      const ratio = guitarFretRatio(hz)
      const y = guitarStringY(neck, guitarString(hz))
      // A note under the low E lengthens that string past the nut, which a neck cannot show: it ends at the nut.
      const fret = xOf(Math.min(1, 1 / ratio))
      // The corner the pick left goes as the top of the note dies, sooner than the note.
      const high = guitarHighSeconds(hz, sustain)
      const corner = lerp(0.25, 1, hardness) * rung(since, high) ** 0.25
      spindle(
        frame,
        xOf(0),
        fret,
        y,
        xOf(guitarPickFraction(position, ratio) / ratio),
        3 * Math.pow(share, 0.7),
        corner,
        share * guitarSwell(since, swell),
      )
      // The finger on its fret; an open string has none.
      if (ratio > 1.001) dot(ctx, fret, y, 1.75, colours.accent, { alpha: lerp(0.3, 1, share) })
    }

    // What the pickup hears of the note last played, or of the open A at rest.
    const noteHz = said ? guitarHz(said.frequency, frame.sampleRate) : GUITAR_REST_HZ
    const gain = said ? said.gain : GUITAR_REST_GAIN
    const ratio = guitarFretRatio(noteHz)
    const pick = guitarPickFraction(position, ratio)
    const pickup = guitarPickupFraction(place, ratio)
    const pickHz = guitarPickHz(hardness, gain)
    const yOfDb = (db: number): number =>
      colour.y +
      (clamp(GUITAR_TOP_DB - db, 0, GUITAR_TOP_DB - GUITAR_FOOT_DB) /
        (GUITAR_TOP_DB - GUITAR_FOOT_DB)) *
        colour.h
    const floor = colour.y + colour.h
    rule(ctx, colour.x, floor, colour.x + colour.w, floor, { colour: colours.ink, alpha: INK.rule })
    // The curve the partials stand under, from the note up: the combs of the pick and the pickup, the peak at Tone, the speaker.
    const first = Math.max(
      0,
      Math.ceil(xOfHz(noteHz, colour, COLOUR_LOW_HZ, COLOUR_HIGH_HZ) - colour.x),
    )
    for (const fill of [true, false]) {
      ctx.beginPath()
      for (let x = first; x <= colour.w; x++) {
        const hz = hzOfX(colour.x + x, colour, COLOUR_LOW_HZ, COLOUR_HIGH_HZ)
        const y = yOfDb(guitarColourDb(hz, noteHz, pick, pickup, pickHz, tone, lift))
        if (x === first) ctx.moveTo(colour.x + x, fill ? floor : y)
        ctx.lineTo(colour.x + x, y)
      }
      ctx.lineJoin = 'round'
      if (fill) {
        ctx.lineTo(colour.x + colour.w, floor)
        ctx.closePath()
        ctx.globalAlpha = INK.fill
        ctx.fillStyle = colours.ink
        ctx.fill()
      } else {
        ctx.globalAlpha = INK.back
        ctx.strokeStyle = colours.ink
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1
    // The partials themselves: in the ink where they start, in the accent where they are now.
    const ring = guitarRingSeconds(noteHz, sustain)
    const high = guitarHighSeconds(noteHz, sustain)
    const loss = stringLoss(noteHz, ring, high, GUITAR_HIGH_HZ, frame.sampleRate, state.loss)
    const damped = guitarDampedLoss(noteHz, sustain, frame.sampleRate, state.damped)
    const after = said?.released == null ? 0 : Math.min(said.released, saidSince)
    for (const light of [false, true]) {
      if (light && !said) break
      ctx.beginPath()
      let last = -Infinity
      for (let n = 1; n * noteHz <= COLOUR_HIGH_HZ; n++) {
        const hz = n * noteHz
        if (hz < COLOUR_LOW_HZ) continue
        const x = Math.floor(xOfHz(hz, colour, COLOUR_LOW_HZ, COLOUR_HIGH_HZ)) + 0.5
        // Up the scale the partials crowd: one every third pixel is all that can be told apart.
        if (x - last < 3) continue
        last = x
        let db = guitarColourDb(hz, noteHz, pick, pickup, pickHz, tone, lift)
        if (light) {
          const seconds = partialSeconds(loss, noteHz, hz, frame.sampleRate)
          const stopped = partialSeconds(damped, noteHz, hz, frame.sampleRate)
          const held = saidSince - after
          // `Guitar::set_ring`: the first polarisation takes its share of every time, ringing and damped.
          const one =
            GUITAR_FIRST *
            rung(held, seconds * GUITAR_FIRST_DECAY) *
            rung(after, stopped * GUITAR_FIRST_DECAY)
          const two = GUITAR_SECOND * rung(held, seconds) * rung(after, stopped)
          db +=
            gainToDb(
              ((one + two) / (GUITAR_FIRST + GUITAR_SECOND)) * guitarSwell(saidSince, swell),
            ) + gainToDb(guitarPluck(gain) / guitarPluck(GUITAR_REST_GAIN))
        }
        const y = yOfDb(db)
        if (y >= floor - 0.5) continue
        ctx.moveTo(x, floor)
        ctx.lineTo(x, y)
      }
      ctx.globalAlpha = light ? 1 : INK.text
      ctx.strokeStyle = light ? colours.accent : colours.ink
      ctx.lineWidth = light ? 2 : 1
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    levelFoot(frame, foot, outShare(frame))

    // The words: the note whose colour is shown and how long it rings, and where the pickup's peak is, beside its handle.
    const toneX = xOfHz(tone, colour, COLOUR_LOW_HZ, COLOUR_HIGH_HZ)
    rule(ctx, toneX, colour.y + 2, toneX, floor, {
      colour: colours.ink,
      alpha: INK.rule,
      dash: [1, 2],
    })
    label(frame, hzText(tone), toneX - 6, colour.y + 6, 'right')
    text(frame, `${pitchName(noteHz)} ${secondsText(ring)}`, neck.x + neck.w + 1, neck.y - 6, {
      align: 'right',
    })

    for (const point of guitarHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: guitarHandles,
})

/** `Guitar::note_on`: the pitch a key is played at. */
const guitarHz = (hz: number, sampleRate: number): number =>
  clamp(hz, GUITAR_LOWEST_HZ, Math.min(GUITAR_HIGHEST_HZ, 0.11 * sampleRate))

/** A later note at the same pitch that has been picked: `Guitar::choose_voice` gives it the same string. */
function guitarTakenOver(
  notes: readonly DisplayNote[],
  delays: readonly number[],
  index: number,
): boolean {
  const hz = notes[index].frequency
  for (let later = index + 1; later < notes.length; later++) {
    // `Guitar::same_pitch`.
    const other = notes[later].frequency
    if (other > hz * 0.997 && other < hz * 1.003 && notes[later].age - delays[later] >= 0)
      return true
  }
  return false
}

function guitarHandles(view: DisplayView): DisplayHandle[] {
  const { neck, colour } = guitarParts(view)
  const span = GUITAR_NECK_PICKUP - GUITAR_BRIDGE_PICKUP
  return [
    {
      key: 'pickup',
      name: 'Pickup',
      x: neck.x + guitarPickupPlace(view.value('pickup')) * neck.w,
      y: neck.y - 1,
      drag: (toX) => ({
        pickup: clamp(((toX - neck.x) / neck.w - GUITAR_BRIDGE_PICKUP) / span, 0, 1),
      }),
      reset: () => ({ pickup: view.spec('pickup')?.default ?? 0.85 }),
    },
    {
      key: 'position',
      name: 'Position',
      x: neck.x + view.value('position') * neck.w,
      y: neck.y + neck.h + 4,
      drag: (toX) => ({ position: clamp((toX - neck.x) / neck.w, 0.05, 0.35) }),
      reset: () => ({ position: view.spec('position')?.default ?? 0.14 }),
    },
    {
      key: 'tone',
      name: 'Tone',
      x: xOfHz(view.value('tone'), colour, COLOUR_LOW_HZ, COLOUR_HIGH_HZ),
      y: colour.y + 2,
      drag: (toX) => ({
        tone: clamp(hzOfX(toX, colour, COLOUR_LOW_HZ, COLOUR_HIGH_HZ), 1500, 5500),
      }),
      reset: () => ({ tone: view.spec('tone')?.default ?? 3600 }),
    },
  ]
}

// --- Acoustic Guitar ---------------------------------------------------------

const ACOUSTIC_TYPES = ['Steel', 'Nylon', 'Twelve string'] as const
const ACOUSTIC_TWELVE = 2
/** `acoustic_guitar.h`, per type: how long it rings beside steel, how much sooner its high partials die, how bright it is plucked. */
const ACOUSTIC_TYPE_RING = [1, 0.7, 0.9] as const
const ACOUSTIC_TYPE_DAMPING = [0.45, 1, 0.45] as const
const ACOUSTIC_TYPE_PLUCK = [1.5, 1, 1.6] as const
/** `acoustic_guitar.h`: the two polarisations' levels and shares of the ring time, and what a body mode takes of the first. */
const ACOUSTIC_LEVEL = [0.75, 0.25] as const
const ACOUSTIC_RING = [0.75, 1.5] as const
const ACOUSTIC_BRIDGE_LOSS = 0.4
/** `acoustic_guitar.h`: the two strings of a twelve string's course, an octave apart below B3. */
const ACOUSTIC_COURSE_LEVEL = 0.5
const ACOUSTIC_OCTAVE_RING = 0.7
const ACOUSTIC_OCTAVE_BELOW_HZ = 240
/** `acoustic_guitar.h`: the body's modes, the air and the top plate first. */
const ACOUSTIC_BODY_HZ = [100, 200, 283, 372, 441, 553, 728, 1010] as const
const ACOUSTIC_BODY_Q = [14, 18, 16, 14, 14, 12, 12, 10] as const
const ACOUSTIC_BODY_GAIN = [1, 0.9, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25] as const
/** `acoustic_guitar.h`: what the full body takes of the string's own low end, and below where. */
const ACOUSTIC_DIRECT_CUT = 0.85
const ACOUSTIC_DIRECT_HZ = 700
/** `acoustic_guitar.h`: the tone shelf, and the pluck's low-pass from the pad of a finger to a pick. */
const ACOUSTIC_TONE_LOW_DB = -12
const ACOUSTIC_TONE_HIGH_DB = 8
const ACOUSTIC_TONE_HZ = 3000
const ACOUSTIC_FLESH_HZ = 650
const ACOUSTIC_PICK_HZ = 11000
const ACOUSTIC_HIGH_HZ = 3000
const ACOUSTIC_LOWEST_HZ = 30
const ACOUSTIC_HIGHEST_HZ = 4200
const ACOUSTIC_VOICES = 12

/** A note's two loops, by number: kept here so that going through them makes nothing. */
const ACOUSTIC_LOOPS = [0, 1] as const

const acousticType = (type: number): number => clamp(Math.round(type), 0, 2)

/** `AcousticGuitar::ring_seconds`: seconds a held note at `hz` takes to fall 60 dB, before its two loops share it out. */
export function acousticRingSeconds(hz: number, sustain: number, type: number): number {
  return sustain * clamp(Math.sqrt(110 / hz), 0.25, 1.3) * ACOUSTIC_TYPE_RING[acousticType(type)]
}

/** `AcousticGuitar::bridge_coupling`: how near `hz` is to the body's air or top mode, 1 on it and nothing two semitones off. */
export function acousticCoupling(hz: number): number {
  let nearest = 0
  for (let mode = 0; mode < 2; mode++) {
    const semitones = 12 * Math.log2(hz / ACOUSTIC_BODY_HZ[mode])
    nearest = Math.max(nearest, Math.exp(-0.5 * semitones * semitones))
  }
  return nearest
}

/** `AcousticGuitar::pluck`: seconds one of a note's two loops rings: the two polarisations, or the two strings of a course. */
export function acousticLoopSeconds(loop: 0 | 1, hz: number, ring: number, type: number): number {
  const coupled = 1 - ACOUSTIC_BRIDGE_LOSS * acousticCoupling(hz)
  if (acousticType(type) === ACOUSTIC_TWELVE) {
    if (loop === 0) return ring * coupled
    return ring * (hz < ACOUSTIC_OCTAVE_BELOW_HZ ? ACOUSTIC_OCTAVE_RING : 1)
  }
  return loop === 0 ? ring * ACOUSTIC_RING[0] * coupled : ring * ACOUSTIC_RING[1]
}

const acousticLoopLevel = (loop: 0 | 1, type: number): number =>
  acousticType(type) === ACOUSTIC_TWELVE ? ACOUSTIC_COURSE_LEVEL : ACOUSTIC_LEVEL[loop]

/** `AcousticGuitar::pluck`: the pitch one of a note's two loops is a string at: the note, but for the octave string of a twelve string's course below B3. */
export const acousticLoopHz = (loop: 0 | 1, hz: number, type: number): number =>
  loop === 1 && acousticType(type) === ACOUSTIC_TWELVE && hz < ACOUSTIC_OCTAVE_BELOW_HZ
    ? 2 * hz
    : hz

/** `AcousticGuitar::pluck`: how hard a key's gain plucks the string. */
const acousticPluck = (gain: number): number => 0.2 + 0.8 * gain * Math.sqrt(gain)

/**
 * What is left of one loop, as a gain: plucked `since` seconds ago, let go
 * `released` seconds ago (null while held). Key up never touches the loop:
 * `Voice::release` fades what it puts out by 60 dB over Release. A key let go
 * before its pluck came is plucked first and let go at once.
 */
function acousticLoopLeft(
  loop: 0 | 1,
  since: number,
  released: number | null,
  hz: number,
  ring: number,
  type: number,
  release: number,
): number {
  const after = released === null ? 0 : Math.min(released, since)
  return (
    acousticLoopLevel(loop, type) *
    rung(since, acousticLoopSeconds(loop, hz, ring, type)) *
    rung(after, release)
  )
}

/** One loop's level in dB under a full pluck: on a twelve string, one string of the course. */
export function acousticLoopDb(
  loop: 0 | 1,
  since: number,
  gain: number,
  released: number | null,
  hz: number,
  ring: number,
  type: number,
  release: number,
): number {
  // Each string of a course is drawn by itself, so a full pluck of one is the top of its scale.
  const left = acousticLoopLeft(loop, since, released, hz, ring, type, release)
  return gainToDb((acousticPluck(gain) * left) / acousticLoopLevel(loop, type))
}

/** The whole note's level in dB under a full pluck: its two loops, beating against each other at Shimmer. */
export function acousticStringDb(
  since: number,
  gain: number,
  released: number | null,
  hz: number,
  ring: number,
  type: number,
  release: number,
  shimmer: number,
): number {
  const first = acousticLoopLeft(0, since, released, hz, ring, type, release)
  const second = acousticLoopLeft(1, since, released, hz, ring, type, release)
  const beat = Math.cos(2 * Math.PI * shimmer * since)
  const both = Math.sqrt(first * first + second * second + 2 * first * second * beat)
  return gainToDb(acousticPluck(gain) * both)
}

/** Seconds a body mode rings on after a knock: 60 dB at its frequency and Q. */
export const acousticModeSeconds = (mode: number): number =>
  (Math.log(1000) * ACOUSTIC_BODY_Q[mode]) / (Math.PI * ACOUSTIC_BODY_HZ[mode])

/**
 * `AcousticGuitar::process`: what the box makes of a string's partial at
 * `hz`, in dB, with so much of the Body: the string itself, less the low end
 * the box takes over, beside the eight modes that ring with it.
 */
export function acousticBoxDb(hz: number, body: number): number {
  const cut = ACOUSTIC_DIRECT_CUT * body
  const x = hz / ACOUSTIC_DIRECT_HZ
  let re = (1 - cut + x * x) / (1 + x * x)
  let im = (cut * x) / (1 + x * x)
  for (let mode = 0; mode < ACOUSTIC_BODY_HZ.length; mode++) {
    // A band-pass of unity gain at its centre.
    const y = hz / ACOUSTIC_BODY_HZ[mode]
    const a = 1 - y * y
    const b = y / ACOUSTIC_BODY_Q[mode]
    const share = (body * ACOUSTIC_BODY_GAIN[mode]) / (a * a + b * b)
    re += share * b * b
    im += share * a * b
  }
  return gainToDb(Math.hypot(re, im))
}

/** `AcousticGuitar::control`: the shelf Tone puts above 3 kHz, in dB. */
export const acousticToneDb = (tone: number): number =>
  lerp(ACOUSTIC_TONE_LOW_DB, ACOUSTIC_TONE_HIGH_DB, clamp(tone, 0, 1))

/** `AcousticGuitar::pluck`: the corner of the pluck's low-pass, never under the note's second partial. */
export function acousticPickHz(nail: number, type: number, gain: number, hz: number): number {
  const corner =
    ACOUSTIC_FLESH_HZ *
    Math.pow(ACOUSTIC_PICK_HZ / ACOUSTIC_FLESH_HZ, nail) *
    ACOUSTIC_TYPE_PLUCK[acousticType(type)] *
    (0.35 + 0.85 * gain)
  return Math.max(corner, 2 * hz)
}

/**
 * The pluck's own partial at `hz` on a string at `stringHz`, as a gain: what
 * `PluckExciter` and the comb of the place it is plucked leave of it. The
 * exciter is scaled by the period, so two strings plucked alike are as loud.
 */
function acousticPluckGain(hz: number, stringHz: number, position: number, pickHz: number): number {
  const n = hz / stringHz
  return (
    (2 * Math.abs(Math.sin(Math.PI * n * position))) /
    Math.sqrt((1 + n * n) * (1 + (hz / pickHz) * (hz / pickHz)))
  )
}

/** The levels the box spans, top to foot. */
const ACOUSTIC_TOP_DB = 10
const ACOUSTIC_FOOT_DB = -26
/** The note whose partials stand at rest: the open A, and how hard it is taken to be plucked. */
const ACOUSTIC_REST_HZ = 110
const ACOUSTIC_REST_GAIN = 0.8
/** Where the tone handle stands: well up the shelf. */
const ACOUSTIC_HANDLE_HZ = 7000
/** The sound hole on the string, from the bridge: its middle and its radius. Position ends over its far edge. */
const ACOUSTIC_HOLE = 0.3
const ACOUSTIC_HOLE_RADIUS = 0.085
/** The body meets the neck at the fourteenth fret, and the bridge sits this far along the body from its tail. */
const ACOUSTIC_JOINT = Math.pow(2, -14 / 12)
const ACOUSTIC_BRIDGE_ALONG = 0.43
/**
 * Half the body's outline, tail to neck: each part a curve to a point, as
 * (along the body, half its width) with the lower bout's half width as 1.
 */
const ACOUSTIC_OUTLINE: readonly (readonly [number, number, number, number, number, number])[] = [
  [0, 0.72, 0.12, 1, 0.36, 1],
  [0.52, 1, 0.56, 0.68, 0.66, 0.68],
  [0.74, 0.68, 0.76, 0.78, 0.84, 0.78],
  [0.95, 0.78, 1, 0.62, 1, 0.2],
]

interface AcousticParts {
  /** The guitar: the room it is drawn in, cut at its edges. */
  top: Box
  /** The string: its bridge at `bridge`, `scale` pixels to the nut, `middle` the line between the third and fourth. */
  bridge: number
  scale: number
  middle: number
  /** Pixels from one string to the next, and the lower bout's half width. */
  gap: number
  bout: number
  /** What the box adds, by frequency. */
  box: Box
  foot: Box
}

function acousticParts(view: Size): AcousticParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const foot: Box = { x: all.x, y: all.y + all.h - 4, w: all.w, h: 4 }
  const tall = Math.max(10, Math.round(all.h * 0.27))
  const box: Box = { x: all.x + 2, y: foot.y - 3 - tall, w: all.w - 4, h: tall }
  const top: Box = { x: all.x, y: all.y, w: all.w, h: Math.max(16, box.y - 4 - all.y) }
  const scale = top.h * 2.7
  return {
    top,
    bridge: all.x + Math.round(scale * 0.11),
    scale,
    middle: top.y + top.h / 2,
    gap: clamp(top.h * 0.058, 2, 4),
    // The waist stays inside the room; the lower bout runs out of it.
    bout: (top.h / 2 - 5) / 0.68,
    box,
    foot,
  }
}

const acousticStringY = (parts: AcousticParts, string: number): number =>
  parts.middle + (2.5 - string) * parts.gap

interface AcousticState {
  delays: number[]
  loss: [StringLoss, StringLoss]
  /** The tone shelf, worked out again only when Tone moves. */
  shelf: Biquad
  shelfDb: number
}

const acoustic = plateDisplay<AcousticState>({
  place: 'window',
  columns: 2,
  params: ['type', 'body', 'position', 'nail', 'sustain', 'release', 'tone', 'shimmer', 'strum'],
  live: { signal: true, notes: true },
  info: 'The strings over the bridge, the sound hole and the neck, the dashed line where they are plucked. Below, what the box adds to the string by frequency, and the partials of the note. A plucked string swings and the hole lights with the body. Drag the handles to set Position and Tone.',
  init: () => ({
    delays: [],
    loss: [
      { pole: 0, gain: 0 },
      { pole: 0, gain: 0 },
    ],
    shelf: biquad('highshelf', ACOUSTIC_TONE_HZ, 0, 0, CURVE_RATE),
    shelfDb: 0,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const parts = acousticParts(frame)
    const { top, bridge, scale, middle, gap, bout, box, foot } = parts
    const type = acousticType(frame.value('type'))
    const twelve = type === ACOUSTIC_TWELVE
    const body = clamp(frame.value('body'), 0, 1)
    const position = frame.value('position')
    const nail = clamp(frame.value('nail'), 0, 1)
    const sustain = frame.value('sustain')
    const release = frame.value('release')
    const shimmer = frame.value('shimmer')
    const toneDb = acousticToneDb(frame.value('tone'))
    const xOf = (share: number): number => bridge + share * scale
    const nut = xOf(1)
    const joint = xOf(ACOUSTIC_JOINT)
    const long = (joint - bridge) / (1 - ACOUSTIC_BRIDGE_ALONG)
    const tail = bridge - ACOUSTIC_BRIDGE_ALONG * long
    const holeX = xOf(ACOUSTIC_HOLE)
    const holeR = ACOUSTIC_HOLE_RADIUS * scale
    const neckHalf = gap * 3.4

    // The strings that are played: worked out first, since the hole lights with them.
    const notes = frame.notes
    const delays = strummed(notes, frame.value('strum') / 1000 / 5, state.delays)
    let said: DisplayNote | null = null
    let saidSince = 0
    let glow = 0

    // Cut where the ground ends, as a picture is by its frame.
    const room: Box = { x: 1, y: 1, w: frame.width - 2, h: top.y + top.h - 1 }
    clipped(ctx, room, () => {
      // The body: as much of the box as Body lets be heard.
      ctx.beginPath()
      ctx.moveTo(tail, middle)
      for (const side of [-1, 1]) {
        const count = ACOUSTIC_OUTLINE.length
        for (let n = 0; n < count; n++) {
          // Out along the upper side, back along the lower.
          const part = ACOUSTIC_OUTLINE[side < 0 ? n : count - 1 - n]
          if (side < 0) {
            ctx.bezierCurveTo(
              tail + part[0] * long,
              middle - part[1] * bout,
              tail + part[2] * long,
              middle - part[3] * bout,
              tail + part[4] * long,
              middle - part[5] * bout,
            )
          } else {
            const before = n === count - 1 ? null : ACOUSTIC_OUTLINE[count - 2 - n]
            ctx.bezierCurveTo(
              tail + part[2] * long,
              middle + part[3] * bout,
              tail + part[0] * long,
              middle + part[1] * bout,
              tail + (before ? before[4] : 0) * long,
              middle + (before ? before[5] : 0) * bout,
            )
          }
        }
        if (side < 0) ctx.lineTo(joint, middle + 0.2 * bout)
      }
      ctx.closePath()
      ctx.fillStyle = colours.ink
      ctx.globalAlpha = 0.05 + 0.2 * body
      ctx.fill()
      ctx.strokeStyle = colours.ink
      ctx.globalAlpha = lerp(INK.rule, INK.trace, body)
      ctx.lineWidth = 1.25
      ctx.stroke()
      ctx.globalAlpha = 1

      // The fingerboard, from over the hole's edge to the nut, and its frets.
      const boardEnd = xOf(ACOUSTIC_HOLE + ACOUSTIC_HOLE_RADIUS) + 1
      fillRect(
        ctx,
        { x: boardEnd, y: middle - neckHalf, w: nut - boardEnd, h: neckHalf * 2 },
        colours.ink,
        0.14,
      )
      ctx.beginPath()
      for (let fret = 1; fret <= 20; fret++) {
        const x = Math.floor(xOf(Math.pow(2, -fret / 12))) + 0.5
        if (x < boardEnd) break
        ctx.moveTo(x, middle - neckHalf)
        ctx.lineTo(x, middle + neckHalf)
      }
      ctx.globalAlpha = INK.rule
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.globalAlpha = 1
      rule(ctx, nut, middle - neckHalf, nut, middle + neckHalf, {
        colour: colours.ink,
        width: 2,
        alpha: INK.text,
      })
      // The head, as far as there is room for it.
      ctx.beginPath()
      ctx.moveTo(nut, middle - neckHalf)
      ctx.lineTo(nut + neckHalf * 0.6, middle - neckHalf * 1.25)
      ctx.lineTo(nut + neckHalf * 3.4, middle - neckHalf * 1.25)
      ctx.lineTo(nut + neckHalf * 3.4, middle + neckHalf * 1.25)
      ctx.lineTo(nut + neckHalf * 0.6, middle + neckHalf * 1.25)
      ctx.lineTo(nut, middle + neckHalf)
      ctx.fillStyle = colours.ink
      ctx.globalAlpha = 0.14
      ctx.fill()
      ctx.globalAlpha = INK.back
      ctx.stroke()
      ctx.globalAlpha = 1

      // The sound hole and the ring around it.
      dot(ctx, holeX, middle, holeR, colours.ink, { alpha: 0.4 })
      ctx.beginPath()
      ctx.arc(holeX, middle, holeR + 2.5, 0, Math.PI * 2)
      ctx.globalAlpha = INK.back
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.globalAlpha = 1
    })

    // The bridge the strings are tied to.
    fillRect(
      ctx,
      { x: bridge - 3, y: middle - gap * 4.2, w: 4, h: gap * 8.4 },
      colours.ink,
      INK.text,
    )

    // The strings: six, or six courses of two. The wound ones are heavier; nylon's plain three are thick and pale.
    for (let string = 0; string < 6; string++) {
      const y = acousticStringY(parts, string)
      const plain = string >= 3
      for (const side of twelve ? [-0.75, 0.75] : [0]) {
        rule(ctx, bridge, y + side, Math.min(nut, top.x + top.w), y + side, {
          colour: colours.ink,
          width: twelve ? 0.75 : plain ? (type === 1 ? 1.5 : 0.75) : 1.25,
          alpha: plain && type === 1 ? INK.back : INK.trace,
        })
      }
    }
    // Where the hand meets them.
    const handX = xOf(position)
    rule(ctx, handX, middle - gap * 3.6, handX, middle + gap * 3.6 + 3, {
      colour: colours.ink,
      dash: [2, 2],
    })

    const reach = Math.min(nut, top.x + top.w)
    let lit = 0
    for (let index = notes.length - 1; index >= 0 && lit < ACOUSTIC_VOICES; index--) {
      const note = notes[index]
      const since = note.age - delays[index]
      if (since < 0 || acousticTakenOver(notes, delays, index)) continue
      const hz = acousticHz(note.frequency, frame.sampleRate)
      const ring = acousticRingSeconds(hz, sustain, type)
      const whole = shareOfDb(
        acousticStringDb(since, note.gain, note.released, hz, ring, type, release, shimmer),
      )
      if (whole < DONE) continue
      if (!said) {
        said = note
        saidSince = since
      }
      lit++
      // The device has pitches and no strings or frets of its own. The picture puts a note by one rule: on the
      // highest of six strings in standard tuning whose open pitch is not above it, at the fret that makes it.
      const y = acousticStringY(parts, guitarString(hz))
      const fretted = guitarFretRatio(hz) > 1.001
      const stop = Math.min(nut, xOf(1 / guitarFretRatio(hz)))
      const end = Math.min(stop, reach)
      // It is plucked at Position of its own length, wherever it is stopped.
      const pluckX = bridge + position * (stop - bridge)
      // The corner the pluck left goes as the top of the note dies.
      const high =
        ring * Math.pow(Math.max(ACOUSTIC_HIGH_HZ, 2 * hz) / hz, -ACOUSTIC_TYPE_DAMPING[type])
      const corner = lerp(0.2, 1, nail) * rung(since, high) ** 0.25
      if (twelve) {
        // Each string of the course by itself: the thin octave string dies sooner.
        for (const loop of ACOUSTIC_LOOPS) {
          const share = shareOfDb(
            acousticLoopDb(loop, since, note.gain, note.released, hz, ring, type, release),
          )
          if (share < DONE) continue
          const side = loop === 0 ? 0.75 : -0.75
          spindle(frame, bridge, end, y + side, pluckX, 1.2 * Math.pow(share, 0.7), corner, share)
        }
      } else {
        spindle(frame, bridge, end, y, pluckX, 2.5 * Math.pow(whole, 0.7), corner, whole)
      }
      if (fretted && stop <= reach)
        dot(ctx, stop, y, 1.5, colours.accent, { alpha: lerp(0.3, 1, whole) })
      // The body: the knock of the pluck rings as long as its air mode, and it sings with every string.
      const knock = acousticPluck(note.gain) * rung(since, acousticModeSeconds(0))
      glow = Math.max(glow, knock, 0.6 * whole)
    }
    if (glow > 0 && body > 0) {
      dot(ctx, holeX, middle, holeR, colours.accent, { alpha: clamp(body * glow, 0, 0.9) })
    }

    // What the box adds, by frequency: its eight modes beside the string, under the tone shelf.
    if (toneDb !== state.shelfDb) {
      state.shelf = biquad('highshelf', ACOUSTIC_TONE_HZ, 0, toneDb, CURVE_RATE)
      state.shelfDb = toneDb
    }
    const boxDb = (hz: number): number =>
      acousticBoxDb(hz, body) + biquadDb(state.shelf, hz, CURVE_RATE)
    const yOfDb = (db: number): number =>
      box.y +
      (clamp(ACOUSTIC_TOP_DB - db, 0, ACOUSTIC_TOP_DB - ACOUSTIC_FOOT_DB) /
        (ACOUSTIC_TOP_DB - ACOUSTIC_FOOT_DB)) *
        box.h
    const floor = box.y + box.h
    rule(ctx, box.x, floor, box.x + box.w, floor, { colour: colours.ink, alpha: INK.rule })
    for (const fill of [true, false]) {
      ctx.beginPath()
      for (let x = 0; x <= box.w; x++) {
        const y = yOfDb(boxDb(hzOfX(box.x + x, box, COLOUR_LOW_HZ, COLOUR_HIGH_HZ)))
        if (x === 0) ctx.moveTo(box.x, fill ? floor : y)
        ctx.lineTo(box.x + x, y)
      }
      ctx.lineJoin = 'round'
      if (fill) {
        ctx.lineTo(box.x + box.w, floor)
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

    // The partials of the note last played, or of the open A at rest: in the ink where they start, in the accent where they are now.
    const noteHz = said ? acousticHz(said.frequency, frame.sampleRate) : ACOUSTIC_REST_HZ
    const gain = said ? said.gain : ACOUSTIC_REST_GAIN
    const ring = acousticRingSeconds(noteHz, sustain, type)
    // Its two loops: the second is a string of its own, an octave up, on a twelve string's low courses.
    const pickHz = acousticPickHz(nail, type, gain, noteHz)
    const otherHz = acousticLoopHz(1, noteHz, type)
    const otherPickHz = acousticPickHz(nail, type, gain, otherHz)
    for (const loop of ACOUSTIC_LOOPS) {
      const loopHz = loop === 0 ? noteHz : otherHz
      const highHz = Math.max(ACOUSTIC_HIGH_HZ, 2 * loopHz)
      stringLoss(
        loopHz,
        acousticLoopSeconds(loop, noteHz, ring, type),
        ring * Math.pow(highHz / loopHz, -ACOUSTIC_TYPE_DAMPING[type]),
        highHz,
        frame.sampleRate,
        state.loss[loop],
      )
    }
    const after = said?.released == null ? 0 : Math.min(said.released, saidSince)
    for (const light of [false, true]) {
      if (light && !said) break
      ctx.beginPath()
      let last = -Infinity
      for (let n = 1; n * noteHz <= COLOUR_HIGH_HZ; n++) {
        const hz = n * noteHz
        if (hz < COLOUR_LOW_HZ) continue
        const x = Math.floor(xOfHz(hz, box, COLOUR_LOW_HZ, COLOUR_HIGH_HZ)) + 0.5
        // Up the scale the partials crowd: one every third pixel is all that can be told apart.
        if (x - last < 3) continue
        last = x
        // Each loop's share of it: as it was plucked, and what is left of that now.
        let plucked = 0
        let left = 0
        for (const loop of ACOUSTIC_LOOPS) {
          const loopHz = loop === 0 ? noteHz : otherHz
          // An octave string has no partial between the even ones of the string beside it.
          if (loopHz > noteHz && n % 2 === 1) continue
          const share =
            acousticLoopLevel(loop, type) *
            acousticPluckGain(hz, loopHz, position, loop === 0 ? pickHz : otherPickHz)
          plucked += share
          if (light)
            left +=
              share *
              rung(saidSince, partialSeconds(state.loss[loop], loopHz, hz, frame.sampleRate))
        }
        const heard = light
          ? (left * rung(after, release) * acousticPluck(gain)) / acousticPluck(ACOUSTIC_REST_GAIN)
          : plucked
        const y = yOfDb(boxDb(hz) + gainToDb(heard))
        if (y >= floor - 0.5) continue
        ctx.moveTo(x, floor)
        ctx.lineTo(x, y)
      }
      ctx.globalAlpha = light ? 1 : INK.back
      ctx.strokeStyle = light ? colours.accent : colours.ink
      ctx.lineWidth = light ? 2 : 1
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    levelFoot(frame, foot, outShare(frame))

    // The words: which guitar, the note whose partials are shown and how long it rings.
    label(frame, ACOUSTIC_TYPES[type], top.x + top.w - 1, top.y + top.h - 1, 'right')
    label(frame, `${pitchName(noteHz)} ${secondsText(ring)}`, top.x + top.w - 1, top.y + 8, 'right')

    for (const point of acousticHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: acousticHandles,
})

/** `AcousticGuitar::note_on`: the pitch a key is played at. */
const acousticHz = (hz: number, sampleRate: number): number =>
  clamp(hz, ACOUSTIC_LOWEST_HZ, Math.min(ACOUSTIC_HIGHEST_HZ, 0.1 * sampleRate))

/** A later note within a quarter tone that has been plucked: `AcousticGuitar::note_on` stops the old string for it. */
function acousticTakenOver(
  notes: readonly DisplayNote[],
  delays: readonly number[],
  index: number,
): boolean {
  const hz = notes[index].frequency
  for (let later = index + 1; later < notes.length; later++) {
    // `acoustic_guitar.h`, `kSamePitchLow` and `kSamePitchHigh`.
    const ratio = notes[later].frequency / hz
    if (ratio > 0.9715 && ratio < 1.0293 && notes[later].age - delays[later] >= 0) return true
  }
  return false
}

function acousticHandles(view: DisplayView): DisplayHandle[] {
  const parts = acousticParts(view)
  const { box } = parts
  const span = ACOUSTIC_TOP_DB - ACOUSTIC_FOOT_DB
  const toneDb = acousticToneDb(view.value('tone'))
  return [
    {
      key: 'position',
      name: 'Position',
      x: parts.bridge + view.value('position') * parts.scale,
      y: parts.middle + parts.gap * 3.6 + 3,
      drag: (toX) => ({ position: clamp((toX - parts.bridge) / parts.scale, 0.06, 0.4) }),
      reset: () => ({ position: view.spec('position')?.default ?? 0.18 }),
    },
    {
      key: 'tone',
      name: 'Tone',
      x: xOfHz(ACOUSTIC_HANDLE_HZ, box, COLOUR_LOW_HZ, COLOUR_HIGH_HZ),
      y: box.y + ((ACOUSTIC_TOP_DB - toneDb) / span) * box.h,
      drag: (_x, toY) => ({
        tone: clamp(
          (ACOUSTIC_TOP_DB - ((toY - box.y) / box.h) * span - ACOUSTIC_TONE_LOW_DB) /
            (ACOUSTIC_TONE_HIGH_DB - ACOUSTIC_TONE_LOW_DB),
          0,
          1,
        ),
      }),
      reset: () => ({ tone: view.spec('tone')?.default ?? 0.6 }),
    },
  ]
}

// --- Pedal Steel -------------------------------------------------------------

/** `pedal_steel.h`, `kOpenStrings`: the E9 neck's ten open strings, low to high, as MIDI notes. */
const STEEL_OPEN = [47, 50, 52, 54, 56, 59, 63, 64, 66, 68] as const
/** `pedal_steel.h`: the bar is not played below the third fret, and the pickup sits a fifteenth of the open string from the bridge. */
const STEEL_LOWEST_FRET = 3
const STEEL_PICKUP = 1 / 15
/** `pedal_steel.h`: a hand laid on the string at key up. */
const STEEL_RELEASE_SECONDS = 0.6
/** `pedal_steel.h`: the foot opening the pedal makes good this share of the string's decay, until it has given 12 dB. */
const STEEL_RIDE_SHARE = 0.7
const STEEL_RIDE_MOST_DB = 12
/** `pedal_steel.h`: the shares of a swell and of a bend that their 10 to 90 % take. */
const STEEL_SWELL_SHARE = 0.5903
const STEEL_NO_SWELL = 0.001
const STEEL_BEND_SHARE = 3.358
/** `pedal_steel.h`: the nearest note that bends, how far past Range one may lie, and how soon after a pick a key is part of its chord. */
const STEEL_NEAREST = 0.5
const STEEL_RANGE_SLACK = 0.25
const STEEL_CHORD_SECONDS = 0.05
/** `pedal_steel.h`: a pick stills the bar; it waits, then shakes again. */
const STEEL_SHAKE_WAIT = 0.35
const STEEL_SHAKE_RISE = 0.5
const STEEL_SHAKE_FALL = 0.04
/** `pedal_steel.h`: where a soft pick and a hard one fall on the sounding length, from the bridge. */
const STEEL_PICK_NECK = 0.3
const STEEL_PICK_BRIDGE = 0.07
const STEEL_LOWEST_HZ = 27.5
const STEEL_HIGHEST_HZ = 4186
/** `steel_amp.h`: the height of the pickup's resonance, and the scoop and the speaker, which no knob moves. */
const STEEL_RESONANCE_Q = 1.6
const STEEL_SPEAKER: readonly Biquad[] = [
  biquad('peaking', 500, 0.7, -4, CURVE_RATE),
  biquad('highpass', 90, Math.SQRT1_2, 0, CURVE_RATE),
  biquad('peaking', 2500, 0.8, 3, CURVE_RATE),
]
const STEEL_SPEAKER_TOP_HZ = 6000
/** `pedal_steel.h`, `kSilence`: a string 140 dB under its pick has rung out and is free. */
const STEEL_RUNG_OUT_DB = 140

const steelNote = (hz: number): number =>
  69 + 12 * Math.log2(clamp(hz, STEEL_LOWEST_HZ, STEEL_HIGHEST_HZ) / 440)

/** `PedalSteel::pickup_fraction`: the string a note is picked on, 0 the lowest: the highest that keeps the bar at the third fret or above. */
export function steelString(note: number): number {
  let string = 0
  for (let s = 0; s < STEEL_OPEN.length; s++)
    if (STEEL_OPEN[s] <= note - STEEL_LOWEST_FRET) string = s
  return string
}

/** `PedalSteel::pickup_fraction`: the fret the bar lies on for that note. */
export const steelFret = (note: number): number =>
  Math.max(note - STEEL_OPEN[steelString(note)], STEEL_LOWEST_FRET)

/** `PedalSteel::control`: how much of a bend is done `seconds` after its key: two one-poles in a row, 10 to 90 % in Glide. */
export function steelBend(seconds: number, glideMs: number): number {
  if (seconds <= 0) return 0
  const x = (seconds * STEEL_BEND_SHARE) / (0.001 * glideMs)
  return 1 - (1 + x) * Math.exp(-x)
}

/** `PedalSteel::control`: what the volume pedal's fade-in lets through `seconds` after the pick, 0..1. */
export function steelSwell(seconds: number, swell: number): number {
  if (swell <= STEEL_NO_SWELL) return 1
  const along = clamp((seconds * STEEL_SWELL_SHARE) / swell, 0, 1)
  return 0.5 - 0.5 * Math.cos(Math.PI * along)
}

/**
 * What is heard of a string, in dB under its pick: picked `since` seconds
 * ago, let go `released` seconds ago (null while held). The string falls
 * 60 dB over Sustain, and over 0.6 s from key up; the pedal fades it in over
 * Swell and then rides after it (`PedalSteel::control`).
 */
export function steelPedalDb(
  since: number,
  released: number | null,
  sustain: number,
  swell: number,
): number {
  const after = released === null ? 0 : Math.min(released, since)
  const string = -60 * ((since - after) / sustain + after / STEEL_RELEASE_SECONDS)
  const ride = Math.min(STEEL_RIDE_MOST_DB, (60 * STEEL_RIDE_SHARE * since) / sustain)
  return string + ride + gainToDb(steelSwell(since, swell))
}

/** `PedalSteel::control`: how much of Vibrato the bar gives `seconds` after a pick that found it giving `before`. */
export function steelShake(before: number, seconds: number): number {
  if (seconds <= STEEL_SHAKE_WAIT) return before * Math.exp(-seconds / STEEL_SHAKE_FALL)
  const stilled = before * Math.exp(-STEEL_SHAKE_WAIT / STEEL_SHAKE_FALL)
  return 1 - (1 - stilled) * Math.exp(-(seconds - STEEL_SHAKE_WAIT) / STEEL_SHAKE_RISE)
}

/** `PedalSteel::pick`: how hard a key's gain picks the string. */
const steelPick = (gain: number): number => 0.2 + 0.8 * gain

/**
 * `SteelAmp::process`: what stands after the strings does to a frequency, in
 * dB. Tone is where the pickup's resonant low-pass has its peak: level under
 * it, 1.6 times over at it, 12 dB an octave down above it. Then the scoop and
 * the speaker, which lets little through over 6 kHz wherever Tone is.
 */
export function steelAmpDb(hz: number, tone: number): number {
  const x = hz / tone
  const resonance =
    1 / Math.sqrt((1 - x * x) * (1 - x * x) + (x / STEEL_RESONANCE_Q) * (x / STEEL_RESONANCE_Q))
  let db = gainToDb(resonance)
  for (const part of STEEL_SPEAKER) db += biquadDb(part, hz, CURVE_RATE)
  // Two sections of a fourth-order low-pass.
  return db - 10 * Math.log10(1 + Math.pow(hz / STEEL_SPEAKER_TOP_HZ, 8))
}

/** The strings a display follows at once, the keys one answers to (`kMaxKeys`) and the bends kept of each. */
const STEEL_STRINGS_MOST = 24
const STEEL_KEYS = 4
const STEEL_BENDS = 8

/** The strings that were picked, as the device's own rules make them of the keys played. Times are seconds ago. */
interface SteelStrings {
  count: number
  /** When it was picked, how hard, and at which note. */
  picked: Float32Array
  strike: Float32Array
  note: Float32Array
  /** Where it is bent to, and when a key last took it. */
  target: Float32Array
  taken: Float32Array
  /** When it was let go: under 0 while a key holds it. */
  let: Float32Array
  /** The keys that hold it, oldest first: which of `frame.notes`, and the notes they ask for. */
  keys: Int16Array
  keyNote: Float32Array
  keyCount: Int8Array
  /** Its bends: when each began and by how many semitones; and the semitones of older bends than the list holds. */
  bendAt: Float32Array
  bendBy: Float32Array
  bendCount: Int8Array
  bent: Float32Array
}

function steelStrings(): SteelStrings {
  const most = STEEL_STRINGS_MOST
  return {
    count: 0,
    picked: new Float32Array(most),
    strike: new Float32Array(most),
    note: new Float32Array(most),
    target: new Float32Array(most),
    taken: new Float32Array(most),
    let: new Float32Array(most),
    keys: new Int16Array(most * STEEL_KEYS),
    keyNote: new Float32Array(most * STEEL_KEYS),
    keyCount: new Int8Array(most),
    bendAt: new Float32Array(most * STEEL_BENDS),
    bendBy: new Float32Array(most * STEEL_BENDS),
    bendCount: new Int8Array(most),
    bent: new Float32Array(most),
  }
}

/** One more bend of string `v`, begun `at` seconds ago; the oldest of a full list is taken as done. */
function steelBendTo(strings: SteelStrings, v: number, at: number, to: number): void {
  const by = to - strings.target[v]
  strings.target[v] = to
  if (by === 0) return
  const first = v * STEEL_BENDS
  if (strings.bendCount[v] === STEEL_BENDS) {
    // Not into `note`: the string and the fret it was picked at stay what they were.
    strings.bent[v] += strings.bendBy[first]
    for (let b = 1; b < STEEL_BENDS; b++) {
      strings.bendAt[first + b - 1] = strings.bendAt[first + b]
      strings.bendBy[first + b - 1] = strings.bendBy[first + b]
    }
    strings.bendCount[v]--
  }
  strings.bendAt[first + strings.bendCount[v]] = at
  strings.bendBy[first + strings.bendCount[v]] = by
  strings.bendCount[v]++
}

/**
 * `PedalSteel::note_on` and `note_off`, played again over `notes`: a key that
 * starts while a neighbour within Range is held bends that string and picks
 * nothing; letting it go bends back; anything else picks a string of its own.
 * The order two keys of one instant came in is not known: the key down is
 * taken first. Written into `into`.
 */
export function steelPlayed(
  notes: readonly DisplayNote[],
  range: number,
  sustain: number,
  events: number[],
  into: SteelStrings,
): SteelStrings {
  // Every key down and every key up, in the order they came: twice a note's index, and one more for its key up.
  events.length = 0
  for (let n = 0; n < notes.length; n++) {
    events.push(n * 2)
    if (notes[n].released !== null) events.push(n * 2 + 1)
  }
  const ago = (event: number): number =>
    event & 1 ? (notes[event >> 1].released ?? 0) : notes[event >> 1].age
  events.sort((a, b) => ago(b) - ago(a) || a - b)

  into.count = 0
  const held = (v: number): boolean => into.let[v] < 0
  for (const event of events) {
    const n = event >> 1
    const at = ago(event)
    if (event & 1) {
      // Key up: the string that answers to it lets it go, and bends back to an older key or is damped.
      for (let v = 0; v < into.count; v++) {
        if (!held(v)) continue
        const first = v * STEEL_KEYS
        let index = -1
        for (let k = 0; k < into.keyCount[v]; k++) if (into.keys[first + k] === n) index = k
        if (index < 0) continue
        for (let k = index; k + 1 < into.keyCount[v]; k++) {
          into.keys[first + k] = into.keys[first + k + 1]
          into.keyNote[first + k] = into.keyNote[first + k + 1]
        }
        into.keyCount[v]--
        if (into.keyCount[v] > 0)
          steelBendTo(into, v, at, into.keyNote[first + into.keyCount[v] - 1])
        else into.let[v] = at
        break
      }
      continue
    }
    const note = steelNote(notes[n].frequency)
    // The same key again picks its own string again.
    let again = -1
    for (let v = 0; v < into.count && again < 0; v++) {
      if (!held(v)) continue
      for (let k = 0; k < into.keyCount[v]; k++)
        if (notes[into.keys[v * STEEL_KEYS + k]].id === notes[n].id) again = v
    }
    let v = again
    if (v < 0 && range >= STEEL_NEAREST) {
      // A neighbour of a held string: the nearest bends to it, the lower one of two as near.
      let nearest = -1
      let distance = range + STEEL_RANGE_SLACK
      for (let other = 0; other < into.count; other++) {
        // A string picked or bent a moment ago is part of the chord being struck; one that has rung out is free.
        const rungOut = (60 * (into.picked[other] - at)) / sustain > STEEL_RUNG_OUT_DB
        if (!held(other) || rungOut || into.taken[other] - at < STEEL_CHORD_SECONDS) continue
        const apart = Math.abs(note - into.target[other])
        if (apart < STEEL_NEAREST || apart > distance) continue
        if (nearest >= 0 && apart > distance - 0.01 && into.target[other] > note) continue
        nearest = other
        distance = apart
      }
      if (nearest >= 0) {
        const first = nearest * STEEL_KEYS
        if (into.keyCount[nearest] === STEEL_KEYS) {
          // A full hand drops its oldest key.
          for (let k = 1; k < STEEL_KEYS; k++) {
            into.keys[first + k - 1] = into.keys[first + k]
            into.keyNote[first + k - 1] = into.keyNote[first + k]
          }
          into.keyCount[nearest]--
        }
        into.keys[first + into.keyCount[nearest]] = n
        into.keyNote[first + into.keyCount[nearest]] = note
        into.keyCount[nearest]++
        into.taken[nearest] = at
        steelBendTo(into, nearest, at, note)
        continue
      }
    }
    if (v < 0) {
      // A string of its own: a new one, or the room of the one let go longest ago.
      if (into.count < STEEL_STRINGS_MOST) v = into.count++
      else {
        v = 0
        for (let other = 1; other < into.count; other++)
          if (into.let[other] > into.let[v]) v = other
      }
    }
    into.picked[v] = at
    into.strike[v] = notes[n].gain
    into.note[v] = note
    into.target[v] = note
    into.taken[v] = at
    into.let[v] = -1
    into.keys[v * STEEL_KEYS] = n
    into.keyNote[v * STEEL_KEYS] = note
    into.keyCount[v] = 1
    into.bendCount[v] = 0
    into.bent[v] = 0
  }
  return into
}

/** The note string `v` sounds at now, as a MIDI note: where it was picked, and as much of each bend as is done. */
export function steelPitch(strings: SteelStrings, v: number, glideMs: number): number {
  let note = strings.note[v] + strings.bent[v]
  for (let b = 0; b < strings.bendCount[v]; b++) {
    const index = v * STEEL_BENDS + b
    note += strings.bendBy[index] * steelBend(strings.bendAt[index], glideMs)
  }
  return note
}

/** The level the pedal's part spans under a full pick, and the seconds across it, on a scale of ratios. */
const STEEL_FOOT_DB = -48
const STEEL_FIRST_SEC = 0.05
const STEEL_LAST_SEC = 60
const STEEL_FRETS = 24
/** How much of the bar's shake the still wave beside the pedal shows, in seconds. */
const STEEL_WAVE_SEC = 0.5
/** The amplifier's small curve among the words: the frequencies and the levels it spans, and how wide it is at most and at least. */
const STEEL_AMP_LOW_HZ = 400
const STEEL_AMP_HIGH_HZ = 12000
const STEEL_AMP_TOP_DB = 6
const STEEL_AMP_FOOT_DB = -30
const STEEL_AMP_WIDE = 46
const STEEL_AMP_NARROW = 14
/** With less room than this for the curve, the note's name gives way to it. */
const STEEL_AMP_ROOM = 30

interface SteelParts {
  /** The strings: the bridge at `x`, the nut at `x + w`, the lowest at the foot. */
  neck: Box
  /** What the pedal lets through, against the seconds since a pick. */
  pedal: Box
  foot: Box
}

function steelParts(view: Size): SteelParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const foot: Box = { x: all.x, y: all.y + all.h - 4, w: all.w, h: 4 }
  const tall = Math.max(10, Math.round(all.h * 0.29))
  const pedal: Box = { x: all.x + 2, y: foot.y - 3 - tall, w: all.w - 4, h: tall }
  const top = all.y + 14
  return {
    neck: { x: all.x + 6, y: top, w: all.w - 10, h: Math.max(12, pedal.y - 9 - top) },
    pedal,
    foot,
  }
}

const steelStringY = (neck: Box, string: number): number =>
  neck.y + neck.h * (1 - (string + 0.5) / STEEL_OPEN.length)
/** Where a fret lies on the neck: each a semitone's ratio nearer the bridge. */
const steelFretX = (neck: Box, fret: number): number =>
  neck.x + clamp(Math.pow(2, -fret / 12), 0, 1) * neck.w
const steelSecX = (pedal: Box, seconds: number): number =>
  pedal.x +
  clamp(Math.log(seconds / STEEL_FIRST_SEC) / Math.log(STEEL_LAST_SEC / STEEL_FIRST_SEC), 0, 1) *
    pedal.w
const steelXSec = (pedal: Box, x: number): number =>
  STEEL_FIRST_SEC * Math.pow(STEEL_LAST_SEC / STEEL_FIRST_SEC, clamp((x - pedal.x) / pedal.w, 0, 1))
const steelDbY = (pedal: Box, db: number): number =>
  pedal.y + (clamp(-db, 0, -STEEL_FOOT_DB) / -STEEL_FOOT_DB) * pedal.h

/** The bar, or the part of it on a string: a round-ended slug standing across the strings. */
function steelBar(
  frame: Paint,
  x: number,
  from: number,
  to: number,
  colour: string,
  wide: number,
  alpha = 1,
): void {
  const { ctx } = frame
  ctx.beginPath()
  ctx.moveTo(x, from)
  ctx.lineTo(x, to)
  ctx.globalAlpha = alpha
  ctx.strokeStyle = colour
  ctx.lineWidth = wide
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.lineCap = 'butt'
  ctx.globalAlpha = 1
}

/**
 * The amplifier's curve, small, on the line of the words between `from` and
 * `to`: what `steelAmpDb` makes of each frequency, a dot on it at Tone, and
 * Tone in its unit beside it where there is room for that too. With no room
 * for a curve that could be read, nothing.
 */
function steelAmp(
  frame: Pick<DisplayFrame, 'ctx' | 'colours' | 'fontFamily'>,
  from: number,
  to: number,
  baseline: number,
  tone: number,
): void {
  const { ctx, colours } = frame
  const room = to - from
  if (room < STEEL_AMP_NARROW) return
  const wide = Math.min(STEEL_AMP_WIDE, Math.floor(room))
  const figure = hzText(tone)
  // The words before these left the type set: the figure is measured in it.
  const figured = room >= wide + ctx.measureText(figure).width + 4
  // The curve stands against the right end of its room, the figure before it.
  const left = to - wide
  const top = baseline - 7
  const tall = 9
  const floor = top + tall
  if (figured) text(frame, figure, left - 4, baseline, { align: 'right' })
  const yOf = (hz: number): number =>
    top +
    (clamp(STEEL_AMP_TOP_DB - steelAmpDb(hz, tone), 0, STEEL_AMP_TOP_DB - STEEL_AMP_FOOT_DB) /
      (STEEL_AMP_TOP_DB - STEEL_AMP_FOOT_DB)) *
      tall
  const span = STEEL_AMP_HIGH_HZ / STEEL_AMP_LOW_HZ
  for (const fill of [true, false]) {
    ctx.beginPath()
    for (let x = 0; x <= wide; x++) {
      const y = yOf(STEEL_AMP_LOW_HZ * Math.pow(span, x / wide))
      if (x === 0) ctx.moveTo(left, fill ? floor : y)
      ctx.lineTo(left + x, y)
    }
    ctx.lineJoin = 'round'
    if (fill) {
      ctx.lineTo(left + wide, floor)
      ctx.closePath()
      ctx.globalAlpha = INK.fill
      ctx.fillStyle = colours.ink
      ctx.fill()
    } else {
      ctx.globalAlpha = INK.trace
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
  rule(ctx, left, floor, left + wide, floor, { colour: colours.ink, alpha: INK.rule })
  dot(
    ctx,
    left + (Math.log(tone / STEEL_AMP_LOW_HZ) / Math.log(span)) * wide,
    yOf(tone),
    1.75,
    colours.ink,
  )
}

interface SteelState {
  events: number[]
  strings: SteelStrings
  /** When each string was picked, seconds ago, the oldest first. */
  picks: number[]
}

const pedalSteel = plateDisplay<SteelState>({
  place: 'window',
  columns: 2,
  params: ['swell', 'sustain', 'glide', 'range', 'vibrato', 'rate', 'pick', 'tone'],
  live: { signal: true, notes: true },
  info: 'Ten strings from the bridge at the left, the bar across them, under it how far a held note bends. A picked string lights up to the bar. Above, the curve of the amplifier with a dot at Tone. Below, what the volume pedal lets through after a pick. Drag the handles to set Pick, Swell and Sustain.',
  init: () => ({ events: [], strings: steelStrings(), picks: [] }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { neck, pedal, foot } = steelParts(frame)
    const swell = frame.value('swell')
    const sustain = frame.value('sustain')
    const glide = frame.value('glide')
    const range = frame.value('range')
    const depth = frame.value('vibrato')
    const rate = frame.value('rate')
    const top = neck.y
    const low = neck.y + neck.h
    const gap = neck.h / STEEL_OPEN.length
    const bridge = neck.x
    const nut = neck.x + neck.w

    // The neck: a steel's frets are lines painted under the strings, the octave's heavier.
    fillRect(ctx, { x: bridge, y: top, w: neck.w, h: neck.h }, colours.ink, 0.07)
    for (let fret = 1; fret <= STEEL_FRETS; fret++) {
      const x = steelFretX(neck, fret)
      rule(ctx, x, top, x, low, {
        colour: colours.ink,
        alpha: fret % 12 === 0 ? INK.rule : INK.grid,
      })
    }
    rule(ctx, nut, top, nut, low, { colour: colours.ink, width: 2, alpha: INK.text })
    rule(ctx, bridge, top, bridge, low, { colour: colours.ink, width: 2, alpha: INK.text })
    // The pickup, which no knob moves.
    const pickupX = bridge + STEEL_PICKUP * neck.w
    fillRect(ctx, { x: pickupX - 1.5, y: top - 1, w: 3, h: neck.h + 2 }, colours.ink, INK.back)
    for (let string = 0; string < STEEL_OPEN.length; string++) {
      const y = steelStringY(neck, string)
      rule(ctx, bridge, y, nut, y, { colour: colours.ink, width: 0.75, alpha: INK.back + 0.1 })
    }

    // The strings that are played, as the device makes them of the keys.
    const notes = frame.notes
    const strings = steelPlayed(notes, range, sustain, state.events, state.strings)
    // The bar's shake: every pick stills it, and it comes back after the last. Each pick, in the order
    // they were made, finds the bar as the one before left it.
    const picks = state.picks
    picks.length = strings.count
    for (let v = 0; v < strings.count; v++) picks[v] = strings.picked[v]
    picks.sort((a, b) => b - a)
    let shake = 0
    for (let n = 0; n < picks.length; n++)
      shake = steelShake(shake, picks[n] - (n + 1 < picks.length ? picks[n + 1] : 0))

    let newest = -1
    let sounding = 0
    for (let v = 0; v < strings.count; v++) {
      const since = strings.picked[v]
      const released = strings.let[v] < 0 ? null : strings.let[v]
      const db =
        gainToDb(steelPick(strings.strike[v])) + steelPedalDb(since, released, sustain, swell)
      const share = shareOfDb(db)
      if (share < DONE) continue
      sounding++
      if (newest < 0 || strings.taken[v] <= strings.taken[newest]) newest = v
      const picked = strings.note[v]
      const string = steelString(picked)
      const pitch = steelPitch(strings, v, glide)
      const y = steelStringY(neck, string)
      // In the device a bend is a pedal's pull: the pitch moves and the pickup's share of the string stays as
      // the pick left it. The neck is this picture's scale of pitch, so the string's piece of the bar stands
      // where a bar would sound the pitch it has now.
      const x = Math.max(bridge + 3, steelFretX(neck, steelFret(picked) + pitch - picked))
      // As much of it as the pedal lets through: a thin line while it swells, a heavy one at full.
      rule(ctx, bridge, y, x, y, { colour: colours.accent, width: 0.75 + 1.75 * share })
      // The shake is the bar's own along the string: so many cents either side, at a pace that is not known here.
      const cents = depth * shake
      const reach = (cents / 100) * (Math.LN2 / 12) * (x - bridge)
      const strong = lerp(0.35, 1, Math.sqrt(share))
      // Its piece of the bar: three strings long, and no further over the neck's edges than the whole bar is.
      const from = Math.max(top + 1, y - gap * 1.5)
      const to = Math.min(low - 1, y + gap * 1.5)
      if (reach > 0.25) {
        steelBar(frame, x - reach, from, to, colours.accent, 5, 0.4 * strong)
        steelBar(frame, x + reach, from, to, colours.accent, 5, 0.4 * strong)
      }
      steelBar(frame, x, from, to, colours.accent, 5, strong)
    }

    // At rest the bar lies across every string on the third fret, the lowest it is played on.
    const restX = steelFretX(neck, STEEL_LOWEST_FRET)
    if (sounding === 0) {
      steelBar(frame, restX, top + 1, low - 1, colours.ink, 6)
      steelBar(frame, restX - 1, top + 2, low - 2, colours.plate, 1, 0.6)
    }
    // How far a held note bends rather than picks: so many frets either side of where it is.
    const centre =
      newest >= 0 && strings.let[newest] < 0
        ? steelFret(strings.note[newest]) + strings.target[newest] - strings.note[newest]
        : STEEL_LOWEST_FRET
    if (range >= STEEL_NEAREST) {
      const from = steelFretX(neck, centre + range)
      const to = steelFretX(neck, Math.max(0, centre - range))
      const y = low + 3.5
      rule(ctx, from, y, to, y, { colour: colours.ink, alpha: INK.trace })
      rule(ctx, from, y - 2.5, from, y + 2.5, { colour: colours.ink, alpha: INK.trace })
      rule(ctx, to, y - 2.5, to, y + 2.5, { colour: colours.ink, alpha: INK.trace })
    }
    // Where the pick falls between the bridge and the bar at rest.
    const pickX =
      bridge + lerp(STEEL_PICK_NECK, STEEL_PICK_BRIDGE, frame.value('pick')) * (restX - bridge)
    rule(ctx, pickX, top - 2, pickX, low + 4, { colour: colours.ink, dash: [2, 2] })

    // The pedal: what is heard of a held string against the seconds since its pick.
    const floor = pedal.y + pedal.h
    for (const seconds of [0.1, 1, 10]) {
      const x = steelSecX(pedal, seconds)
      rule(ctx, x, pedal.y, x, floor, { colour: colours.ink, alpha: INK.grid })
    }
    rule(ctx, pedal.x, floor, pedal.x + pedal.w, floor, { colour: colours.ink, alpha: INK.rule })
    for (const fill of [true, false]) {
      ctx.beginPath()
      for (let x = 0; x <= pedal.w; x++) {
        const y = steelDbY(pedal, steelPedalDb(steelXSec(pedal, pedal.x + x), null, sustain, swell))
        if (x === 0) ctx.moveTo(pedal.x, fill ? floor : y)
        ctx.lineTo(pedal.x + x, y)
      }
      ctx.lineJoin = 'round'
      if (fill) {
        ctx.lineTo(pedal.x + pedal.w, floor)
        ctx.closePath()
        ctx.globalAlpha = INK.fill
        ctx.fillStyle = colours.ink
        ctx.fill()
      } else {
        ctx.globalAlpha = INK.trace
        ctx.strokeStyle = colours.ink
        ctx.lineWidth = 1.25
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1
    // The lines are a tenth of a second, a second and ten; the one said stands clear of the handle on the foot.
    label(frame, '1 s', steelSecX(pedal, 1) - 3, floor - 2, 'right')
    // Each string that sounds, where it is on its way.
    for (let v = 0; v < strings.count; v++) {
      const since = strings.picked[v]
      const released = strings.let[v] < 0 ? null : strings.let[v]
      const db =
        gainToDb(steelPick(strings.strike[v])) + steelPedalDb(since, released, sustain, swell)
      if (shareOfDb(db) < DONE) continue
      dot(ctx, steelSecX(pedal, since), steelDbY(pedal, db), 2.25, colours.accent, {
        ring: colours.plate,
      })
    }

    // The bar's shake, drawn still: half a second of it, as deep as Vibrato and as fast as Rate.
    const wide = clamp(pedal.w * 0.2, 18, 40)
    const waveX = pedal.x + pedal.w - wide - 1
    const waveY = pedal.y + 5.5
    fillRect(ctx, { x: waveX - 2, y: pedal.y - 1, w: wide + 4, h: 13 }, colours.plate, 0.7)
    for (const light of [false, true]) {
      const tall = (depth / 40) * 5 * (light ? shake : 1)
      if (light && (sounding === 0 || tall < 0.25)) break
      ctx.beginPath()
      for (let x = 0; x <= wide; x++) {
        const y = waveY - tall * Math.sin((x / wide) * STEEL_WAVE_SEC * rate * 2 * Math.PI)
        if (x === 0) ctx.moveTo(waveX, y)
        else ctx.lineTo(waveX + x, y)
      }
      ctx.globalAlpha = light ? 1 : INK.text
      ctx.strokeStyle = light ? colours.accent : colours.ink
      ctx.lineWidth = light ? 1.5 : 1
      ctx.lineJoin = 'round'
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    levelFoot(frame, foot, outShare(frame))

    // The words: the bend, and how long a string rings (with the note the newest sounds at).
    const words = neck.y - 6
    const reachText =
      range >= STEEL_NEAREST
        ? `${Math.round(range * 10) / 10} st ${Math.round(glide)} ms`
        : 'No bend'
    text(frame, reachText, neck.x - 3, words)
    const ampFrom = neck.x - 3 + ctx.measureText(reachText).width + 5
    const ringText = secondsText(sustain)
    const hz = newest >= 0 ? 440 * Math.pow(2, (steelPitch(strings, newest, glide) - 69) / 12) : 0
    const named = newest >= 0 ? `${pitchName(hz)} ${ringText}` : ringText
    // Between them the amplifier's curve has to stand: where the note's name would crowd it, the name is left out.
    const fits = nut + 1 - ctx.measureText(named).width - 5 - ampFrom >= STEEL_AMP_ROOM
    const said = fits ? named : ringText
    text(frame, said, nut + 1, words, { align: 'right' })
    steelAmp(frame, ampFrom, nut + 1 - ctx.measureText(said).width - 5, words, frame.value('tone'))

    for (const point of steelHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: steelHandles,
})

function steelHandles(view: DisplayView): DisplayHandle[] {
  const { neck, pedal } = steelParts(view)
  const swell = view.value('swell')
  const sustain = view.value('sustain')
  const restX = steelFretX(neck, STEEL_LOWEST_FRET)
  const span = STEEL_PICK_NECK - STEEL_PICK_BRIDGE
  // The swell's handle stands where the pedal is half open.
  const half = (0.5 * swell) / STEEL_SWELL_SHARE
  return [
    {
      key: 'pick',
      name: 'Pick',
      x: neck.x + lerp(STEEL_PICK_NECK, STEEL_PICK_BRIDGE, view.value('pick')) * (restX - neck.x),
      y: neck.y + neck.h + 4,
      drag: (toX) => ({
        pick: clamp((STEEL_PICK_NECK - (toX - neck.x) / (restX - neck.x)) / span, 0, 1),
      }),
      reset: () => ({ pick: view.spec('pick')?.default ?? 0.45 }),
    },
    {
      key: 'swell',
      name: 'Swell',
      x: steelSecX(pedal, half),
      y: steelDbY(pedal, steelPedalDb(Math.max(half, STEEL_FIRST_SEC), null, sustain, swell)),
      drag: (toX) => ({
        // The left edge is no swell at all.
        swell:
          toX <= pedal.x + 0.5 ? 0 : clamp((steelXSec(pedal, toX) * STEEL_SWELL_SHARE) / 0.5, 0, 2),
      }),
      reset: () => ({ swell: view.spec('swell')?.default ?? 0.4 }),
    },
    {
      key: 'sustain',
      name: 'Sustain',
      // With the pedal's 12 dB given, a string is 48 dB under its pick after Sustain: where the curve meets the foot.
      x: steelSecX(pedal, sustain),
      y: pedal.y + pedal.h,
      drag: (toX) => ({ sustain: clamp(steelXSec(pedal, toX), 2, 40) }),
      reset: () => ({ sustain: view.spec('sustain')?.default ?? 14 }),
    },
  ]
}

export const GUITAR_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  guitar: { display: guitar, face: ['pickup', 'tone', 'sustain', 'swell'] },
  'acoustic-guitar': { display: acoustic, face: ['type', 'body', 'tone', 'sustain'] },
  'pedal-steel': { display: pedalSteel, face: ['swell', 'sustain', 'range', 'vibrato'] },
}
