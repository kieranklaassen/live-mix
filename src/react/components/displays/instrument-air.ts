// Displays of the instruments that make weather, places and bands of noise.
//
// These make their sound from noise and chance, so no display can show a drop
// or a bird where it truly falls. Each is a picture of what its knobs set (how
// many, how far, how bright, in which band), drawn still from the device's own
// figures; a key that sounds lights its share of the picture for as long as
// the device's envelope lets it; and what moves is read from the sound that
// comes out.

import {
  FREQ_MAX,
  FREQ_MIN,
  INK,
  clamp,
  fillRect,
  gainToDb,
  ground,
  handle,
  hzText,
  label,
  lerp,
  rule,
  spectrum,
  text,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayLevel,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { hzOfKey, keyOfHz, levelFoot, outShare, pitchName, xOfPitch } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>
type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>

const TAU = Math.PI * 2

// --- What the three share ----------------------------------------------------

/**
 * A number from 0 up to 1 that is always the same for the same two whole
 * numbers. A mark that stands for chance (a drop, a bird's place) is put where
 * this says, so it stands still from frame to frame.
 */
export function chance(seed: number, index: number): number {
  let x = Math.imul(seed + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(index + 1, 0xc2b2ae35)
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d)
  x = Math.imul(x ^ (x >>> 12), 0x297a2d39)
  return ((x ^ (x >>> 15)) >>> 0) / 4294967296
}

/** `kit/env.h`, `Adsr`: the attack aims this far over the top so that it arrives in the set time; under `ADSR_IDLE` a release is over. */
const ADSR_AIM = 1.3
const ADSR_IDLE = 1e-5

/**
 * `kit/env.h`, `Adsr::next` with full sustain, as Atmosphere and Outdoors set
 * it: the level of a key pressed `age` seconds ago and let go `released`
 * seconds ago (null while it is held). The release falls 60 dB in its time.
 */
export function airEnvelope(
  age: number,
  released: number | null,
  attack: number,
  release: number,
): number {
  const held = released === null ? age : Math.max(0, age - released)
  const top =
    held >= attack
      ? 1
      : Math.min(1, ADSR_AIM * (1 - Math.pow((ADSR_AIM - 1) / ADSR_AIM, held / attack)))
  if (released === null) return top
  const level = top * Math.pow(10, (-3 * released) / release)
  return level < ADSR_IDLE ? 0 : level
}

/**
 * How strongly a key is lit, 0..1: its level while it rises, and from the key
 * up the 60 dB of its release as one straight fall, so each of the two times
 * is read on the scale the device sets it on.
 */
export function airLight(
  age: number,
  released: number | null,
  attack: number,
  release: number,
): number {
  if (released === null) return airEnvelope(age, null, attack, release)
  const top = airEnvelope(Math.max(0, age - released), null, attack, release)
  return top * Math.max(0, 1 - released / release)
}

/** The devices have eight voices each: a ninth key takes the place of one. */
const AIR_VOICES = 8
/** Under this share of its light a key is done. */
const AIR_DONE = 0.02

interface Lit {
  /** Where in `frame.notes` each key that sounds is, the newest first, and how strongly it is lit. */
  index: Int16Array
  light: Float32Array
}

const newLit = (): Lit => ({
  index: new Int16Array(AIR_VOICES),
  light: new Float32Array(AIR_VOICES),
})

/** The keys that still sound, the newest first and no more than the device has voices: how many there are. */
function sounding(
  notes: readonly DisplayNote[],
  light: (note: DisplayNote) => number,
  into: Lit,
): number {
  let count = 0
  for (let index = notes.length - 1; index >= 0 && count < AIR_VOICES; index--) {
    const share = light(notes[index])
    if (share < AIR_DONE) continue
    into.index[count] = index
    into.light[count] = share
    count++
  }
  return count
}

/** A key's light as the accent is laid: a soft key is fainter, and still seen. */
const lightOf = (share: number, gain: number): number => share * (0.35 + 0.65 * clamp(gain, 0, 1))

/**
 * How far either side of its centre, in octaves, a band-pass of that Q stands
 * within 12 dB of a full one's peak when it is `level` loud: what of it a
 * picture of pitch against time shows. Nothing under a quarter of full level.
 */
export function bandReach(q: number, level: number): number {
  const over = level / 0.25
  if (over <= 1) return 0
  return Math.asinh(Math.sqrt(over * over - 1) / (2 * q)) / Math.LN2
}

/** Events a second as they are said: "0.15 /s", "2.4 /s", "25 /s". */
function rateText(perSecond: number): string {
  if (perSecond >= 9.95) return `${Math.round(perSecond)} /s`
  return `${perSecond.toFixed(perSecond < 0.995 ? 2 : 1)} /s`
}

/** The foot of the display, as wide a share of it as the sound's image is of the two speakers: a third of it in mono. */
function footBox(all: Box, wide: number): Box {
  const w = Math.round(all.w * lerp(0.34, 1, clamp(wide, 0, 1)))
  return { x: all.x + (all.w - w) / 2, y: all.y + all.h - 6, w, h: 5 }
}

// --- Atmosphere --------------------------------------------------------------

const WIND = 0
const RAIN = 1
const SEA = 2
const FIRE = 3
const VINYL = 4
const HUM = 5
const ATMOSPHERE_NAMES = ['Wind', 'Rain', 'Sea', 'Fire', 'Vinyl', 'Hum'] as const
const atmosphereKind = (type: number): number => clamp(Math.round(type), 0, 5)

/**
 * `Atmosphere::survey`, per type: the colour in Hz at Tone 0 and how many
 * times that at Tone 1; the gusts, drops, waves, crackles or clicks a second
 * at Density 0 and how many times that at Density 1. Hum has no events.
 */
const ATMOSPHERE_SURVEY = [
  { hz: 180, span: 16, rate: 0.04, more: 20 },
  { hz: 1200, span: 6, rate: 3, more: 200 },
  { hz: 350, span: 8, rate: 0.08, more: 2.5 },
  { hz: 900, span: 6, rate: 0.6, more: 80 },
  { hz: 2000, span: 4, rate: 0.3, more: 100 },
  { hz: 150, span: 40, rate: 0, more: 1 },
] as const
/**
 * `Atmosphere::kEvent`: an event is one impulse into a band-pass. How wide its
 * pitch scatters either side of the colour (octaves), the band-pass's Q, the
 * quietest one, and the power of a draw that makes loud ones the exception.
 */
const ATMOSPHERE_EVENTS = [
  null,
  { scatter: 0.9, q: 2.5, floor: 0.4, rarity: 2 },
  null,
  { scatter: 1.2, q: 1.2, floor: 0.25, rarity: 3 },
  { scatter: 0.7, q: 0.9, floor: 0.3, rarity: 3 },
  null,
] as const
/** `atmosphere.h`: the rumble under Fire and Vinyl is noise through two one-poles at this. */
const FIRE_RUMBLE_HZ = 140
const VINYL_RUMBLE_HZ = 45
/** `Atmosphere::shape`: a record turns 33⅓ times a minute; the fire flickers at 3 Hz and bursts at 0.15; the mains wobbles at 0.4. */
const VINYL_TURN_HZ = 33.333 / 60
const FIRE_FLICKER_HZ = 3
const FIRE_BURST_HZ = 0.15
const HUM_WOBBLE_HZ = 0.4
/** `atmosphere.h`, `kRingQ`, `kRingGain`: the resonance on the key. */
const RING_Q = 25
const RING_GAIN = 14
/** `atmosphere.h`, `kDiffuserGain` and the longer of a side's two allpass stages. */
const DIFFUSER_GAIN = 0.65
const DIFFUSER_SEC = 0.0123

/** The seconds across the picture, per type: long enough for a wave or a gust, short enough to count drops. */
const ATMOSPHERE_SPAN = [25, 1, 25, 6, 3.6, 10] as const
/** The key the picture is drawn for until one is played: the A the device leans its colour around. */
const ATMOSPHERE_KEY_HZ = 220
/** The room the words of the scale of pitch take at the right of the picture, in px. */
const SCALE_GUTTER = 16
/** How many events are drawn at most: for the picture at rest, and for each key that sounds. */
const EVENTS_MOST = 360
const EVENTS_LIT_MOST = 120

/** `Atmosphere::survey`: the colour of a type in Hz, before the key leans it. */
export function atmosphereColour(kind: number, tone: number): number {
  const survey = ATMOSPHERE_SURVEY[atmosphereKind(kind)]
  return survey.hz * Math.pow(survey.span, tone)
}

/** `Atmosphere::survey`: gusts, drops, waves, crackles or clicks a second. */
export function atmosphereRate(kind: number, density: number): number {
  const survey = ATMOSPHERE_SURVEY[atmosphereKind(kind)]
  return survey.rate * Math.pow(survey.more, density)
}

/** `Atmosphere::note_on`, `voice.lean`: half an octave of colour per octave of key, around the A at 220 Hz. */
export function atmosphereLean(hz: number): number {
  return clamp(Math.sqrt(clamp(hz, 8, 12000) / 220), 0.35, 2.8)
}

/** `Atmosphere::control`: where Size closes the low-pass of distance, in Hz. */
export function atmosphereCeilingHz(size: number): number {
  return 20000 * Math.pow(0.05, size)
}

/** `Atmosphere::control`: the share of what a key lets through that is the resonance on its pitch. Wind has none: it whistles with its own band. */
export function atmosphereRing(kind: number, resonance: number): number {
  if (kind === WIND) return 0
  const ring = RING_GAIN * resonance * resonance
  return ring / (ring + 1 - 0.5 * resonance)
}

/**
 * How long Size smears an event, in seconds: an allpass stage sends on what
 * it is given again every 12.3 ms, each time its feedback weaker (0.65 at full
 * Size), and this is when that has fallen 20 dB.
 */
export function atmosphereSmearSeconds(size: number): number {
  const feedback = DIFFUSER_GAIN * clamp(size, 0, 1)
  return feedback <= 0.01 ? 0 : (DIFFUSER_SEC * Math.log(0.1)) / Math.log(feedback)
}

/**
 * `kit/lfo.h`, `Drift`: three sines at rates that never meet, about ±1. The
 * device starts each at a place of chance; here they start where a Drift
 * stands before it is seeded, so the shape and the rate are the device's and
 * the picture is the same every time.
 */
export function drift(seconds: number, hz: number): number {
  return (
    0.5 * Math.sin(TAU * hz * seconds) +
    0.3 * Math.sin(TAU * (hz * 0.618034 * seconds + 0.33)) +
    0.2 * Math.sin(TAU * (hz * 1.7320508 * seconds + 0.71))
  )
}

/** `Atmosphere::shape`, Wind: the centre of the band in Hz for a gust of 0..1. Resonance pulls it onto the key. */
export function atmosphereWindHz(
  gust: number,
  tone: number,
  movement: number,
  resonance: number,
  keyHz: number,
): number {
  const colour = atmosphereColour(WIND, tone) * atmosphereLean(keyHz)
  const centre = colour * Math.pow(2, 1.6 * movement * (1 - 0.9 * resonance) * (gust - 0.5))
  return resonance > 0 ? centre * Math.pow(clamp(keyHz, 8, 12000) / colour, resonance) : centre
}

/** `Atmosphere::shape`, Wind: the band's Q, from 1.2 to a whistle's 30. */
export const atmosphereWindQ = (resonance: number): number => 1.2 * Math.pow(25, resonance)

/** `Atmosphere::shape`, Wind: how loud a gust of 0..1 is beside a full one. */
export const atmosphereWindLevel = (gust: number, movement: number): number =>
  1 - movement * (1 - gust)

/** `Atmosphere::shape`, Sea: how far a wave has built, 0..1, at `phase` of its cycle. The crest sits at 63 % of it. */
export function atmosphereSeaSwell(phase: number): number {
  return 0.5 - 0.5 * Math.cos(TAU * phase * Math.sqrt(phase))
}

/** `Atmosphere::shape`, Sea: where the low-pass stands in Hz; the wave opens it as it breaks. */
export function atmosphereSeaHz(
  swell: number,
  tone: number,
  movement: number,
  keyHz: number,
): number {
  const colour = atmosphereColour(SEA, tone) * atmosphereLean(keyHz)
  return colour * Math.pow(2, 2.6 * swell * swell * swell * (0.3 + 0.7 * movement))
}

/** `Atmosphere::shape`, Sea: how loud the wave is beside its crest. */
export function atmosphereSeaLevel(swell: number, movement: number): number {
  return 1 - 0.92 * movement * (1 - swell * Math.sqrt(Math.sqrt(swell)))
}

/**
 * `Atmosphere::shape` and `survey`, Hum: how strong the odd harmonic
 * `2 * index + 1` of a key is. Density is how slowly they fall away, Tone a
 * ceiling in Hz whatever the key, and Resonance leaves the fundamental and
 * thins the rest through its band on the key.
 */
export function atmosphereHum(
  index: number,
  keyHz: number,
  density: number,
  tone: number,
  resonance: number,
): number {
  const n = 2 * index + 1
  const x = (n * keyHz) / atmosphereColour(HUM, tone)
  const shape = Math.pow(n, -(2.6 - 2 * density)) / (1 + x * x)
  const ring = atmosphereRing(HUM, resonance)
  const through = 1 / Math.sqrt(1 + RING_Q * RING_Q * (n - 1 / n) * (n - 1 / n))
  return shape * (1 - ring + ring * through)
}

const yOfHz = (hz: number, box: Box): number =>
  box.y +
  box.h * (1 - Math.log(clamp(hz, FREQ_MIN, FREQ_MAX) / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN))
const hzOfY = (y: number, box: Box): number =>
  FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, clamp(1 - (y - box.y) / box.h, 0, 1))

interface AtmosphereParts {
  /** Pitch against time: 20 Hz at the foot, 20 kHz at the top, the type's seconds across. */
  field: Box
  /** The sound that comes out now, on the same scale of pitch. */
  column: Box
  foot: Box
}

function atmosphereParts(view: Size, width: number): AtmosphereParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const wide = clamp(Math.round(all.w * 0.08), 9, 16)
  // The scale's words stand in a gutter of their own at the right, clear of what moves.
  const field: Box = {
    x: all.x + 1,
    y: all.y + 12,
    w: all.w - wide - SCALE_GUTTER - 4,
    h: all.h - 12 - 9,
  }
  return {
    field,
    column: { x: field.x + field.w + 3, y: field.y, w: wide, h: field.h },
    foot: footBox(all, width),
  }
}

interface AtmosphereKnobs {
  kind: number
  density: number
  movement: number
  tone: number
  resonance: number
  size: number
}

interface AtmosphereState {
  /** The last key played, in Hz: the picture is drawn for it. */
  key: number
  knobs: AtmosphereKnobs
  lit: Lit
  /** A line's points, or the events of one drawing: x, top, foot and strength of each. */
  scratch: Float32Array
}

type AtmosphereFrame = Pick<
  DisplayFrame<AtmosphereState>,
  'ctx' | 'colours' | 'state' | 'sampleRate'
>

/** The seconds from the left of the field to `step` of `steps`. */
const atSeconds = (step: number, steps: number, span: number): number => (step / steps) * span

/**
 * The events of a type as one key makes them over the field's seconds: each a
 * short upright stroke at its pitch, as tall as its band-pass lets it reach
 * and as long as Size smears it. Where they stand is chance, here and in the
 * device; how many, in which band and how loud is the device's.
 */
function atmosphereEvents(
  frame: AtmosphereFrame,
  field: Box,
  keyHz: number,
  colour: string,
  alpha: number,
  most: number,
): void {
  const { ctx, state } = frame
  const { kind, density, movement, tone, size } = state.knobs
  const event = ATMOSPHERE_EVENTS[kind]
  if (!event) return
  const span = ATMOSPHERE_SPAN[kind]
  const centre = atmosphereColour(kind, tone) * atmosphereLean(keyHz)
  // A fire's crackles come in bursts, 1.5 octaves of rate either way at full Movement: the
  // most there can be are drawn, and each is kept as often as the burst at its moment says.
  const swing = kind === FIRE ? 1.5 * movement : 0
  const expected = Math.min(most, atmosphereRate(kind, density) * span * Math.pow(2, swing))
  const seed = keyOfHz(keyHz) * 8 + kind
  const marks = state.scratch
  let count = 0
  for (let i = 0; i < expected; i++) {
    // The last of them stands for a part of one: it is there as often as that part.
    if (i + 1 > expected && chance(seed, i * 4 + 3) >= expected - i) break
    const seconds = chance(seed, i * 4) * span
    if (
      swing > 0 &&
      chance(seed, i * 4 + 3) >= Math.pow(2, swing * (drift(seconds, FIRE_BURST_HZ) - 1))
    )
      continue
    const hz = clamp(
      centre * Math.pow(2, event.scatter * (2 * chance(seed, i * 4 + 1) - 1)),
      60,
      0.42 * frame.sampleRate,
    )
    const loud = event.floor + (1 - event.floor) * Math.pow(chance(seed, i * 4 + 2), event.rarity)
    const reach = bandReach(event.q, loud)
    const y = yOfHz(hz, field)
    marks[count * 4] = Math.floor(field.x + (seconds / span) * field.w) + 0.5
    marks[count * 4 + 1] = Math.min(y - 1, yOfHz(hz * Math.pow(2, reach), field))
    marks[count * 4 + 2] = Math.max(y + 1, yOfHz(hz * Math.pow(2, -reach), field))
    marks[count * 4 + 3] = loud
    count++
  }
  if (count === 0) return
  // What Size smears of them lies behind each, to the right: later in time.
  const smear = (atmosphereSmearSeconds(size) / span) * field.w
  if (smear >= 1.5) {
    ctx.beginPath()
    for (let i = 0; i < count; i++) {
      const x = marks[i * 4]
      const wide = Math.min(smear, field.x + field.w - x)
      ctx.rect(x, marks[i * 4 + 1], wide, marks[i * 4 + 2] - marks[i * 4 + 1])
    }
    ctx.globalAlpha = alpha * 0.22
    ctx.fillStyle = colour
    ctx.fill()
  }
  // In three strengths, so a hundred strokes are three paths.
  for (let strength = 0; strength < 3; strength++) {
    const from = strength === 0 ? 0 : strength === 1 ? 0.5 : 0.75
    const to = strength === 0 ? 0.5 : strength === 1 ? 0.75 : 2
    ctx.beginPath()
    for (let i = 0; i < count; i++) {
      const loud = marks[i * 4 + 3]
      if (loud < from || loud >= to) continue
      ctx.moveTo(marks[i * 4], marks[i * 4 + 1])
      ctx.lineTo(marks[i * 4], marks[i * 4 + 2])
    }
    ctx.globalAlpha = alpha * (strength === 0 ? 0.5 : strength === 1 ? 0.75 : 1)
    ctx.strokeStyle = colour
    ctx.lineWidth = 1
    ctx.lineCap = 'butt'
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/**
 * A low-passed noise whose corner and level move, as the area under where it
 * has fallen away: `edge(seconds)` is the corner in Hz times the root of the
 * level, since past the corner the sound falls 12 dB an octave, so half the
 * level reaches half an octave less far up.
 */
function atmosphereSwell(
  frame: AtmosphereFrame,
  field: Box,
  span: number,
  edge: (seconds: number) => number,
  colour: string,
  alpha: number,
  fill: number,
): void {
  const { ctx } = frame
  const steps = clamp(Math.floor(field.w / 2), 8, 240)
  const foot = field.y + field.h
  ctx.beginPath()
  ctx.moveTo(field.x, foot)
  for (let i = 0; i <= steps; i++)
    ctx.lineTo(field.x + (i / steps) * field.w, yOfHz(edge(atSeconds(i, steps, span)), field))
  ctx.lineTo(field.x + field.w, foot)
  ctx.closePath()
  ctx.globalAlpha = alpha * fill
  ctx.fillStyle = colour
  ctx.fill()
  // Its edge at full strength, so the shape is read through the keys that lie over it.
  ctx.beginPath()
  for (let i = 0; i <= steps; i++)
    ctx.lineTo(field.x + (i / steps) * field.w, yOfHz(edge(atSeconds(i, steps, span)), field))
  ctx.globalAlpha = alpha
  ctx.strokeStyle = colour
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.globalAlpha = 1
}

/** A steady hiss up to a corner: a wash over that much of the field. */
function atmosphereHiss(frame: AtmosphereFrame, field: Box, cornerHz: number, alpha: number): void {
  const y = yOfHz(cornerHz, field)
  fillRect(
    frame.ctx,
    { x: field.x, y, w: field.w, h: field.y + field.h - y },
    frame.colours.ink,
    alpha,
  )
}

/**
 * What one key makes of the type that is set, over the field: the picture at
 * rest in the ink, and again in the accent for each key that sounds. The
 * steady hiss under rain, fire and a record is drawn once, in the ink.
 */
function atmosphereTexture(
  frame: AtmosphereFrame,
  field: Box,
  keyHz: number,
  colour: string,
  alpha: number,
  lit: boolean,
): void {
  const { ctx, state } = frame
  const { kind, density, movement, tone, resonance } = state.knobs
  const span = ATMOSPHERE_SPAN[kind]
  const lean = atmosphereLean(keyHz)
  const perOctave = field.h / Math.log2(FREQ_MAX / FREQ_MIN)
  const steps = clamp(Math.floor(field.w / 3), 8, 200)

  if (kind === WIND) {
    // A band of noise that wanders with the gusts: higher and wider as one comes, sunk to a
    // thread between two. Resonance draws it onto the key and narrows it into a whistle.
    const rate = atmosphereRate(WIND, density)
    const q = atmosphereWindQ(resonance)
    const line = state.scratch
    for (let i = 0; i <= steps; i++) {
      const gust = clamp(0.5 + 0.75 * drift(atSeconds(i, steps, span), rate), 0, 1)
      line[i * 2] = atmosphereWindHz(gust, tone, movement, resonance, keyHz)
      line[i * 2 + 1] = Math.max(
        0.75 / perOctave,
        bandReach(q, atmosphereWindLevel(gust, movement)),
      )
    }
    ctx.beginPath()
    for (let i = 0; i <= steps; i++)
      ctx.lineTo(
        field.x + (i / steps) * field.w,
        yOfHz(line[i * 2] * Math.pow(2, line[i * 2 + 1]), field),
      )
    for (let i = steps; i >= 0; i--)
      ctx.lineTo(
        field.x + (i / steps) * field.w,
        yOfHz(line[i * 2] * Math.pow(2, -line[i * 2 + 1]), field),
      )
    ctx.closePath()
    ctx.globalAlpha = alpha * (lit ? 0.45 : 0.4)
    ctx.fillStyle = colour
    ctx.fill()
    // The centre of the band, so its path is read where the band is wide.
    ctx.beginPath()
    for (let i = 0; i <= steps; i++)
      ctx.lineTo(field.x + (i / steps) * field.w, yOfHz(line[i * 2], field))
    ctx.globalAlpha = alpha
    ctx.strokeStyle = colour
    ctx.lineWidth = 1
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.globalAlpha = 1
    return
  }

  if (kind === HUM) {
    // The key's pitch and its odd harmonics, each a line as thick as it is strong; an
    // unsteady supply (Movement) swells and thins them a quarter either way.
    for (let index = 0; index < 6; index++) {
      const hz = (2 * index + 1) * clamp(keyHz, 8, 12000)
      if (hz >= 0.45 * frame.sampleRate || hz > FREQ_MAX) break
      const share = 1 + gainToDb(atmosphereHum(index, keyHz, density, tone, resonance)) / 36
      if (share <= 0) continue
      const y = yOfHz(hz, field)
      const half = (0.6 + 2.6 * share) / 2
      ctx.beginPath()
      for (let i = 0; i <= steps; i++)
        ctx.lineTo(
          field.x + (i / steps) * field.w,
          y - half * (1 + 0.25 * movement * drift(atSeconds(i, steps, span), HUM_WOBBLE_HZ)),
        )
      for (let i = steps; i >= 0; i--)
        ctx.lineTo(
          field.x + (i / steps) * field.w,
          y + half * (1 + 0.25 * movement * drift(atSeconds(i, steps, span), HUM_WOBBLE_HZ)),
        )
      ctx.closePath()
      ctx.globalAlpha = alpha * (0.4 + 0.6 * share)
      ctx.fillStyle = colour
      ctx.fill()
    }
    ctx.globalAlpha = 1
    return
  }

  if (kind === SEA) {
    // Each wave builds, opens the filter as it breaks and runs back.
    const rate = atmosphereRate(SEA, density)
    const edge = (seconds: number): number => {
      const phase = 0.25 + seconds * rate
      const swell = atmosphereSeaSwell(phase - Math.floor(phase))
      return (
        atmosphereSeaHz(swell, tone, movement, keyHz) *
        Math.sqrt(atmosphereSeaLevel(swell, movement))
      )
    }
    atmosphereSwell(frame, field, span, edge, colour, alpha, lit ? 0.55 : 0.4)
    // The foam is the white under the pink: it shows only where a wave has opened the filter
    // past it, as flecks of the plate in the crest.
    for (let i = 0; i < 48; i++) {
      const seconds = chance(SEA, i * 2) * span
      const hz = 2000 * Math.pow(10, chance(SEA, i * 2 + 1))
      if (hz * 1.3 > edge(seconds)) continue
      fillRect(
        ctx,
        {
          x: Math.floor(field.x + (seconds / span) * field.w),
          y: Math.floor(yOfHz(hz, field)),
          w: 1,
          h: 1,
        },
        frame.colours.plate,
        0.85,
      )
    }
  } else if (kind === FIRE) {
    // A low rumble that flickers under a soft roar, and the crackles over it.
    if (!lit) atmosphereHiss(frame, field, 0.7 * atmosphereColour(FIRE, tone) * lean, INK.grid)
    atmosphereSwell(
      frame,
      field,
      span,
      (seconds) =>
        FIRE_RUMBLE_HZ *
        Math.sqrt(Math.max(0, 1 + 0.6 * movement * drift(seconds, FIRE_FLICKER_HZ))),
      colour,
      alpha,
      lit ? 0.55 : 0.5,
    )
  } else if (kind === VINYL) {
    // A faint hiss, and a rumble that swells once for every turn of the record.
    if (!lit) atmosphereHiss(frame, field, 2500 * Math.pow(6, tone) * lean, INK.grid * 0.6)
    atmosphereSwell(
      frame,
      field,
      span,
      (seconds) =>
        VINYL_RUMBLE_HZ * Math.sqrt(1 + 0.6 * movement * Math.sin(TAU * VINYL_TURN_HZ * seconds)),
      colour,
      alpha,
      lit ? 0.55 : 0.5,
    )
  } else if (!lit) {
    // Rain: light rain is drops, the hiss arrives with the downpour.
    atmosphereHiss(
      frame,
      field,
      1.5 * atmosphereColour(RAIN, tone) * lean,
      INK.fill * (0.15 + 0.85 * density * density),
    )
  }
  atmosphereEvents(frame, field, keyHz, colour, alpha, lit ? EVENTS_LIT_MOST : EVENTS_MOST)

  // The resonance on the key: a line at its pitch, as strong as its share of the sound.
  const ring = atmosphereRing(kind, resonance)
  if (ring > 0.02) {
    const y = yOfHz(keyHz, field)
    rule(ctx, field.x, y, field.x + field.w, y, {
      colour,
      alpha: alpha * lerp(0.25, 1, ring),
      dash: lit ? undefined : [3, 2],
    })
  }
}

/** The spectrum of what comes out, lying on its side: each pitch a bar from the left of the box, in the accent. */
function atmosphereNow(frame: Paint & Pick<DisplayFrame, 'signal' | 'powered'>, box: Box): void {
  const bins = frame.signal?.spectrum
  const binHz = frame.signal?.binHz ?? 0
  if (!frame.powered || !bins || binHz <= 0) return
  const { ctx } = frame
  const rows = Math.max(2, Math.floor(box.h / 2))
  let any = false
  ctx.beginPath()
  ctx.moveTo(box.x, box.y + box.h)
  for (let row = 0; row <= rows; row++) {
    const y = box.y + box.h - (row / rows) * box.h
    const from = hzOfY(y + box.h / rows / 2, box)
    const to = hzOfY(y - box.h / rows / 2, box)
    let db = -Infinity
    if (to - from < binHz) {
      // Low down a bin is wider than a row: read between two.
      const at = clamp((from + to) / 2 / binHz, 1, bins.length - 1)
      const below = Math.floor(at)
      db = lerp(bins[below], bins[Math.min(bins.length - 1, below + 1)], at - below)
    } else {
      const first = clamp(Math.ceil(from / binHz), 1, bins.length - 1)
      const last = clamp(Math.floor(to / binHz), first, bins.length - 1)
      for (let i = first; i <= last; i++) if (bins[i] > db) db = bins[i]
    }
    const long = Number.isFinite(db) ? clamp((db + 96) / 76, 0, 1) * box.w : 0
    if (long > 0) any = true
    ctx.lineTo(box.x + long, y)
  }
  ctx.lineTo(box.x, box.y)
  ctx.closePath()
  if (!any) return
  ctx.globalAlpha = 0.9
  ctx.fillStyle = frame.colours.accent
  ctx.fill()
  ctx.globalAlpha = 1
}

/** The figure beside the type's name: how often its gusts, drops, waves, crackles or clicks come, or the key that hums. */
function atmosphereFigure(knobs: AtmosphereKnobs, keyHz: number): string {
  const rate = atmosphereRate(knobs.kind, knobs.density)
  switch (knobs.kind) {
    case WIND:
      return `gust ${secondsText(1 / rate)}`
    case SEA:
      return `wave ${secondsText(1 / rate)}`
    case RAIN: {
      // The rain swells and thins more slowly than the field is long: 1.2 octaves of rate either way.
      const swing = Math.pow(2, 1.2 * knobs.movement)
      return knobs.movement < 0.02
        ? rateText(rate)
        : `${rateText(rate / swing).replace(' /s', '')} to ${rateText(rate * swing)}`
    }
    case HUM:
      return `${pitchName(keyHz)} ${hzText(keyHz)}`
    default:
      return rateText(rate)
  }
}

const atmosphere = plateDisplay<AtmosphereState>({
  place: 'window',
  columns: 2,
  params: [
    'type',
    'density',
    'movement',
    'tone',
    'resonance',
    'size',
    'attack',
    'release',
    'width',
  ],
  live: { signal: true, notes: true, spectrum: true },
  info: 'What a key opens, as pitch against time: drops and crackles as strokes, a wave or a gust as its shape, a hum as its lines, under the dashed line where Size cuts. A key that sounds lights its own, the column at the right is the sound now, and the handle sets Size.',
  init: () => ({
    key: ATMOSPHERE_KEY_HZ,
    knobs: { kind: 0, density: 0, movement: 0, tone: 0, resonance: 0, size: 0 },
    lit: newLit(),
    scratch: new Float32Array(Math.max(EVENTS_MOST * 4, 512)),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const knobs = state.knobs
    knobs.kind = atmosphereKind(frame.value('type'))
    knobs.density = clamp(frame.value('density'), 0, 1)
    knobs.movement = clamp(frame.value('movement'), 0, 1)
    knobs.tone = clamp(frame.value('tone'), 0, 1)
    knobs.resonance = clamp(frame.value('resonance'), 0, 1)
    knobs.size = clamp(frame.value('size'), 0, 1)
    const attack = frame.value('attack')
    const release = frame.value('release')
    const { field, column, foot } = atmosphereParts(frame, frame.value('width'))

    // The scale of pitch, across the field and the column of the sound.
    for (const hz of [100, 1000, 10000]) {
      const y = yOfHz(hz, field)
      rule(ctx, field.x, y, column.x + column.w, y, { colour: colours.ink, alpha: INK.grid })
    }

    // The picture at rest is what the last key opened; each key that sounds lights its own
    // over it, leaned by its pitch as the device leans it.
    const notes = frame.notes
    const count = sounding(
      notes,
      (note) => airLight(note.age, note.released, attack, release),
      state.lit,
    )
    if (count > 0) state.key = clamp(notes[state.lit.index[0]].frequency, 8, 12000)
    atmosphereTexture(frame, field, state.key, colours.ink, 1, false)
    for (let n = count - 1; n >= 0; n--) {
      const note = notes[state.lit.index[n]]
      atmosphereTexture(
        frame,
        field,
        clamp(note.frequency, 8, 12000),
        colours.accent,
        lightOf(state.lit.light[n], note.gain),
        true,
      )
    }

    // Size is distance: what lies over the low-pass is dulled, more an octave further up.
    const ceiling = yOfHz(atmosphereCeilingHz(knobs.size), field)
    if (ceiling > field.y + 0.5) {
      fillRect(
        ctx,
        { x: field.x, y: field.y, w: field.w, h: ceiling - field.y },
        colours.plate,
        0.5,
      )
      const over = yOfHz(2 * atmosphereCeilingHz(knobs.size), field)
      fillRect(ctx, { x: field.x, y: field.y, w: field.w, h: over - field.y }, colours.plate, 0.5)
    }
    rule(ctx, field.x, ceiling, field.x + field.w, ceiling, {
      colour: colours.ink,
      alpha: INK.text,
      dash: [2, 2],
    })

    // Now: the spectrum of what comes out, from the line at the field's right edge.
    atmosphereNow(frame, column)
    rule(ctx, column.x, column.y, column.x, column.y + column.h, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    const right = column.x + column.w + SCALE_GUTTER
    text(frame, '100', right, yOfHz(100, field) + 3, { align: 'right' })
    text(frame, '1k', right, yOfHz(1000, field) + 3, { align: 'right' })
    text(frame, '10k', right, yOfHz(10000, field) + 3, { align: 'right' })

    levelFoot(frame, foot, outShare(frame))

    // The words: the type and the seconds across the field, and how often its events come.
    const top = field.y - 4
    text(
      frame,
      `${ATMOSPHERE_NAMES[knobs.kind]}, ${secondsText(ATMOSPHERE_SPAN[knobs.kind])}`,
      field.x,
      top,
    )
    text(frame, atmosphereFigure(knobs, state.key), right, top, { align: 'right' })

    for (const point of atmosphereHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: atmosphereHandles,
})

function atmosphereHandles(view: DisplayView): DisplayHandle[] {
  const { field } = atmosphereParts(view, view.value('width'))
  return [
    {
      key: 'size',
      name: 'Size',
      // Between the two words over the field: at Size 0 the line is up against them.
      x: field.x + field.w * 0.56,
      y: yOfHz(atmosphereCeilingHz(view.value('size')), field),
      drag: (_x, toY) => ({
        size: clamp(Math.log(hzOfY(toY, field) / 20000) / Math.log(0.05), 0, 1),
      }),
      reset: () => ({ size: view.spec('size')?.default ?? 0.3 }),
    },
  ]
}

// --- Outdoors ----------------------------------------------------------------

const BIRDS = 0
const CRICKETS = 1
const FROGS = 2
const STREAM = 3
const THUNDER = 4
const CHIMES = 5
const OUTDOORS_NAMES = ['Birds', 'Crickets', 'Frogs', 'Stream', 'Thunder', 'Chimes'] as const
const outdoorsKind = (type: number): number => clamp(Math.round(type), 0, 5)

/** `birds.h`, `crickets.h`, `frogs.h`: how many of each a key can have. */
const OUTDOORS_MOST = [6, 6, 5, 0, 0, 0] as const
/**
 * `outdoors_scene::key_lean` as each scene calls it: the octaves its pitch
 * moves per octave of key around middle C, and the most it moves either way;
 * then the octaves a full turn of Tone moves it. The chimes take their pitch
 * from the key itself, and Tone only brightens them.
 */
const OUTDOORS_PITCH = [
  { perOctave: 0.33, limit: 0.5, tone: 0.6 },
  { perOctave: 0.2, limit: 0.3, tone: 0.5 },
  { perOctave: 0.3, limit: 0.5, tone: 0.5 },
  { perOctave: 0.4, limit: 0.8, tone: 1.2 },
  { perOctave: 0.5, limit: 1, tone: 1.2 },
  { perOctave: 0, limit: 0, tone: 0 },
] as const
/** `frogs.h`, `kSlot` and `kBody`: the first formant of the frog in each place, in Hz. Two croakers, a peeper, a triller, a deep one. */
const FROG_HZ = [620, 620, 2900, 1250, 250] as const
/** `stream.h`: where each of the four places sheds its bubbles: their pitch in Hz, the place across the field, its share of the flow. */
const STREAM_SITES = [
  { hz: 600, pan: 0.25, share: 0.05 },
  { hz: 1300, pan: -0.6, share: 0.15 },
  { hz: 2500, pan: 0.7, share: 0.32 },
  { hz: 4500, pan: -0.2, share: 0.48 },
] as const
/** `chimes.h`, `kScale`, `kRing`, `kWeight`: the tubes in semitones over the key, where each hangs from left to right, and how strong the partials over the first are. */
const CHIME_SCALE = [0, 2, 4, 7, 9, 12] as const
const CHIME_RING = [0, 3, 1, 4, 2, 5] as const
const CHIME_WEIGHT = [0.8, 0.45, 0.2] as const
/** A cloud's three heaps: where each stands across it, how wide and how high it is, as shares of the cloud's. */
const CLOUD = [
  [-0.5, 0.55, 0.7],
  [0.05, 0.5, 1],
  [0.56, 0.48, 0.62],
] as const
/** The key the scene is drawn for until one is played: middle C, which the device leans its scenes around. */
const OUTDOORS_KEY_HZ = 261.63

/** `Birds::control`, `Crickets::read`, `Frogs::control`: how many of a key's creatures are there at a Density. */
export function outdoorsCount(kind: number, density: number): number {
  const most = OUTDOORS_MOST[outdoorsKind(kind)]
  return most === 0 ? 0 : 1 + Math.floor(density * (most - 1) + 0.5)
}

/**
 * How often a scene's events come at a Density, a second: bubbles
 * (`Stream::control`), strikes of the clapper (`Chimes::control`), and for
 * Thunder the strokes (`Thunder::control`: one every 60 s to one every 10).
 */
export function outdoorsRate(kind: number, density: number): number {
  if (kind === STREAM) return 40 * Math.pow(50, density)
  if (kind === CHIMES) return 0.15 * Math.pow(40, density)
  if (kind === THUNDER) return Math.pow(6, density) / 60
  return 0
}

/** `outdoors_scene::key_lean` and each scene's use of Tone: how many times its own pitch a key's scene sounds at. */
export function outdoorsPitch(kind: number, keyHz: number, tone: number): number {
  const pitch = OUTDOORS_PITCH[outdoorsKind(kind)]
  const lean = clamp(
    Math.log2(clamp(keyHz, 8, 12000) / 261.63) * pitch.perOctave,
    -pitch.limit,
    pitch.limit,
  )
  return Math.pow(2, lean + pitch.tone * (tone - 0.5))
}

/** `Birds::arrive`, `Crickets::start`, `Frogs::start`: where across the field a creature sits, -1..1. The first sits near the middle, the rest where chance puts them. */
export function outdoorsPan(kind: number, slot: number, seed: number): number {
  const side = 2 * chance(seed, slot * 2) - 1
  if (kind === CRICKETS) return slot === 0 ? 0.4 * side : side
  if (kind === FROGS)
    return slot === 0 ? 0.4 * side : side < 0 ? side * 0.7 - 0.3 : side * 0.7 + 0.3
  return slot === 0 ? 0.45 * side : side < 0 ? side * 0.8 - 0.2 : side * 0.8 + 0.2
}

/** The same three: how loud a creature is beside the nearest, which is the first. */
export function outdoorsNear(kind: number, slot: number, seed: number): number {
  if (slot === 0) return 1
  const u = chance(seed, slot * 2 + 1)
  if (kind === CRICKETS) return slot === 5 ? 0.1 + 0.1 * u : 0.12 * Math.pow(5, u)
  if (kind === FROGS) return 0.25 * Math.pow(2.8, u)
  return 0.16 * Math.pow(3.75, u)
}

/**
 * `Crickets::pulse`: the share of its time a cricket rests. It sings 5 to 40 s
 * times (1.4 - Movement), then stops to listen for 1 to (4 + 14 Movement)
 * seconds times (0.2 + Movement).
 */
export function cricketRest(movement: number): number {
  const sings = 22.5 * (1.4 - movement)
  const rests = (2.5 + 7 * movement) * (0.2 + movement)
  return rests / (sings + rests)
}

/** `Chimes::root`: the lowest tube's pitch for a key, folded by octaves into what a set of chimes can have. */
export function chimeRoot(hz: number): number {
  let root = clamp(hz, 8, 12000)
  while (root > 1800) root *= 0.5
  while (root < 100) root *= 2
  return root
}

/** `Chimes::start`: where a tube hangs across the field, -0.75..0.75. */
export const chimePan = (tube: number): number => -0.75 + (1.5 * CHIME_RING[tube]) / 5

/**
 * `Chimes::fits`: with one key down all six tubes of its set sound; with more,
 * a set keeps its root, fifth and octave and those of its other tubes that
 * are, in any octave, one of the keys held.
 */
export function chimeFits(tube: number, root: number, held: readonly number[]): boolean {
  const step = CHIME_SCALE[tube]
  if (held.length <= 1 || step === 0 || step === 7 || step === 12) return true
  const hz = root * Math.pow(2, step / 12)
  for (const key of held) {
    const octaves = Math.log2(hz / Math.max(key, 1))
    if (Math.abs(octaves - Math.floor(octaves + 0.5)) < 0.3 / 12) return true
  }
  return false
}

/** `Chimes::strike`: how much of each partial a strike puts in beside the one under it, before the 0.35 of its own force that a harder one adds. A brighter Tone puts in more. */
export const chimeBright = (tone: number): number => 0.3 + 0.55 * tone

/** `Outdoors::aim_air`: where the air between closes its low-pass for a Distance, in Hz: 20 kHz near, 2 kHz far. */
export const outdoorsAirHz = (distance: number): number =>
  20000 * Math.pow(0.1, clamp(distance, 0, 1))

/** `Thunder::nearness`: 1 with the storm overhead, 0 from Distance 0.3 outwards. */
export const thunderNearness = (distance: number): number => Math.max(0, 1 - distance / 0.3)

/** `Thunder::strike`: how far a stroke may fall short of the strongest. */
export const thunderUnlike = (movement: number, distance: number): number =>
  Math.min(0.85, 0.25 + 0.45 * movement + 0.25 * distance)

/** How many steps of the slow wave are kept, and how far one step is, in the wave's own time (1 is its mean time between two moves). */
const WAVE_STEPS = 160
const WAVE_STEP = 0.05

/**
 * `outdoors_scene::Wander`: the slow random wave a scene rises and falls on.
 * A target redrawn at moments of chance, followed through two one-poles; it
 * never cycles. One stretch of it, drawn once, since no display can know where
 * the device's own stands.
 */
function wander(): Float32Array {
  const wave = new Float32Array(WAVE_STEPS)
  let draws = 0
  let target = chance(11, draws++)
  let a = target
  let b = target
  let hold = 0
  for (let i = 0; i < WAVE_STEPS; i++) {
    hold -= WAVE_STEP
    if (hold <= 0) {
      target = chance(11, draws++)
      hold = 0.4 - 0.6 * Math.log(1 - chance(11, draws++))
    }
    const k = Math.min(1, 3 * WAVE_STEP)
    a += (target - a) * k
    b += (a - b) * k
    wave[i] = clamp(0.5 + 1.5 * (b - 0.5), 0, 1)
  }
  return wave
}

interface OutdoorsParts {
  /** The place, seen from where the listener stands at the middle of its foot. */
  scene: Box
  foot: Box
  /** The y of the horizon and of the nearest ground; the x of the middle, and how far a full Width reaches either side of it. */
  horizon: number
  near: number
  mid: number
  half: number
}

function outdoorsParts(view: Size): OutdoorsParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const scene: Box = { x: all.x + 1, y: all.y + 12, w: all.w - 2, h: all.h - 12 - 9 }
  return {
    scene,
    foot: { x: all.x, y: all.y + all.h - 6, w: all.w, h: 5 },
    horizon: scene.y + 8,
    near: scene.y + scene.h - 5,
    mid: scene.x + scene.w / 2,
    half: scene.w / 2 - 12,
  }
}

/** The depth the nearest of a scene stands at for a Distance, 0 at the listener's feet and 1 at the horizon. */
const outdoorsFront = (distance: number): number => 0.06 + 0.52 * distance

/** How far back something as loud as `near` of the nearest stands: ten times quieter is over half of the way further. */
function outdoorsDepth(near: number, distance: number): number {
  return clamp(outdoorsFront(distance) + (0.55 * Math.log(1 / near)) / Math.LN10, 0, 1)
}

const yOfDepth = (depth: number, parts: OutdoorsParts): number =>
  parts.near - depth * (parts.near - parts.horizon - 2)
/** Far things are smaller and paler: air takes the highs and the edges. */
const sizeAtDepth = (depth: number): number => lerp(1, 0.45, depth)
const inkAtDepth = (depth: number): number => lerp(1, 0.5, depth)

interface OutdoorsKnobs {
  kind: number
  density: number
  distance: number
  movement: number
  tone: number
  width: number
}

interface OutdoorsState {
  /** The last key played, in Hz: the scene is drawn for it. */
  key: number
  knobs: OutdoorsKnobs
  lit: Lit
  wave: Float32Array
  /** The keys that are held now, in Hz: the chimes tune to them. */
  held: number[]
}

type OutdoorsFrame = Pick<DisplayFrame<OutdoorsState>, 'ctx' | 'colours' | 'state'>

/** A bird as it is drawn from far off: two wings. */
function birdPath(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.moveTo(x - s, y - s * 0.2)
  ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.85, x, y)
  ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.85, x + s, y - s * 0.2)
}

/** A cricket from the side: its hind leg bent over its back, its feelers before it. `way` is 1 or -1, the way it faces. */
function cricketPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  way: number,
): void {
  ctx.moveTo(x - way * s * 0.2, y)
  ctx.lineTo(x - way * s * 0.9, y - s * 1.15)
  ctx.lineTo(x - way * s * 1.6, y + s * 0.45)
  ctx.moveTo(x + way * s * 0.8, y - s * 0.2)
  ctx.lineTo(x + way * s * 1.9, y - s * 1.1)
}

/** A frog as it lies in the water: the top of its head and its two eyes, over a ripple. */
function frogPath(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.moveTo(x + s, y)
  ctx.arc(x, y, s, 0, Math.PI, true)
  ctx.closePath()
  ctx.moveTo(x - s * 0.5 + s * 0.36, y - s * 0.85)
  ctx.arc(x - s * 0.5, y - s * 0.85, s * 0.36, 0, TAU)
  ctx.moveTo(x + s * 0.5 + s * 0.36, y - s * 0.85)
  ctx.arc(x + s * 0.5, y - s * 0.85, s * 0.36, 0, TAU)
}

/**
 * One key's scene of the type that is set: in the ink at rest, and in the
 * accent for each key that sounds. Where a creature sits is chance, here and
 * in the device, and so the same for the same key; how many there are, how
 * far off, how wide and how large is the device's.
 */
function outdoorsScene(
  frame: OutdoorsFrame,
  parts: OutdoorsParts,
  keyHz: number,
  colour: string,
  alpha: number,
  lit: boolean,
): void {
  const { ctx, state } = frame
  const { kind, density, distance, movement, tone, width } = state.knobs
  const seed = keyOfHz(keyHz) * 8 + kind
  // A lower pitch is a larger creature, a larger bubble, a deeper storm.
  const large = Math.pow(outdoorsPitch(kind, keyHz, tone), -0.75)
  const across = width * parts.half
  const stroke = lit ? 1.75 : 1.25
  ctx.strokeStyle = colour
  ctx.fillStyle = colour
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  if (kind === BIRDS || kind === CRICKETS || kind === FROGS) {
    const count = outdoorsCount(kind, density)
    // So many of a field's crickets have stopped to listen: the farthest of them here.
    const resting = kind === CRICKETS ? Math.round(cricketRest(movement) * count) : 0
    for (let slot = count - 1; slot >= 0; slot--) {
      const depth = outdoorsDepth(outdoorsNear(kind, slot, seed), distance)
      const x = parts.mid + outdoorsPan(kind, slot, seed) * across
      const y = yOfDepth(depth, parts)
      const size = sizeAtDepth(depth) * large
      ctx.globalAlpha = alpha * inkAtDepth(depth)
      ctx.lineWidth = Math.max(1, stroke * sizeAtDepth(depth))
      ctx.beginPath()
      if (kind === BIRDS) {
        birdPath(ctx, x, y, 8.5 * size)
        ctx.stroke()
      } else if (kind === CRICKETS) {
        const s = 4.4 * size
        const rests = slot >= count - resting
        cricketPath(ctx, x, y, s, slot % 2 === 0 ? 1 : -1)
        ctx.stroke()
        ctx.beginPath()
        ctx.ellipse(x, y, s, s * 0.45, 0, 0, TAU)
        if (rests) ctx.stroke()
        else ctx.fill()
      } else {
        const s = 5.2 * size * Math.pow(FROG_HZ[0] / FROG_HZ[slot], 0.4)
        frogPath(ctx, x, y, s)
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(x - s * 1.7, y + 1.5)
        ctx.lineTo(x + s * 1.7, y + 1.5)
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
  } else if (kind === STREAM) {
    // Bubbles over the four places that shed them: a tenth of a second's worth, the low
    // ones large and few, the high ones small and many.
    const depth = outdoorsFront(distance)
    const y = yOfDepth(depth, parts)
    const scale = sizeAtDepth(depth)
    const flow = outdoorsRate(STREAM, density) * 0.1
    ctx.lineWidth = lit ? 1.25 : 1
    // From far off the single bubbles sink into the rush.
    ctx.globalAlpha = alpha * inkAtDepth(depth) * (1 - 0.45 * distance)
    ctx.beginPath()
    STREAM_SITES.forEach((site, at) => {
      const expected = Math.min(28, flow * site.share)
      const r = Math.max(0.7, 4.2 * scale * large * Math.pow(STREAM_SITES[0].hz / site.hz, 0.6))
      for (let i = 0; i < expected; i++) {
        const base = at * 97 + i * 3
        if (i + 1 > expected && chance(seed, base) >= expected - i) break
        const rise = chance(seed, base + 1)
        const bx = parts.mid + site.pan * across + (chance(seed, base + 2) - 0.5) * 20 * scale
        const by = y - 2 - r - rise * rise * 24 * scale
        ctx.moveTo(bx + r, by)
        ctx.arc(bx, by, r, 0, TAU)
      }
    })
    ctx.stroke()
  } else if (kind === THUNDER) {
    // The storm: a cloud as wide as its strokes may wander, and so many strokes as fall in
    // a minute. Overhead they are long and sharp; from far off the edge is gone.
    const depth = outdoorsFront(distance)
    const scale = sizeAtDepth(depth)
    const groundY = yOfDepth(depth, parts)
    const close = thunderNearness(distance)
    const wide = Math.max(9 * scale, clamp(0.45 + 0.8 * movement, 0, 1) * across * 0.8)
    const tall = 9 * scale * large
    const baseY = Math.max(parts.scene.y + tall + 2, groundY - (15 + 9 * close) * scale)
    ctx.globalAlpha = alpha * inkAtDepth(depth) * (lit ? 1 : 0.7)
    ctx.beginPath()
    for (const [at, share, high] of CLOUD) {
      ctx.moveTo(parts.mid + (at + share) * wide, baseY)
      ctx.ellipse(parts.mid + at * wide, baseY, share * wide, high * tall, 0, 0, Math.PI, true)
    }
    ctx.fill()
    const strokes = clamp(Math.round(outdoorsRate(THUNDER, density) * 60), 1, 6)
    const unlike = thunderUnlike(movement, distance)
    ctx.globalAlpha = alpha * inkAtDepth(depth)
    ctx.lineWidth = stroke * (0.8 + 0.6 * close)
    ctx.lineJoin = 'miter'
    ctx.beginPath()
    for (let i = 0; i < strokes; i++) {
      const x = parts.mid + ((i + 0.5) / strokes - 0.5) * 1.5 * wide
      const long = (groundY - baseY) * (1 - unlike * chance(seed, i))
      ctx.moveTo(x + 1.5, baseY + 1)
      ctx.lineTo(x - 2, baseY + long * 0.5)
      ctx.lineTo(x + 1.5, baseY + long * 0.5)
      ctx.lineTo(x - 1.5, baseY + long)
    }
    ctx.stroke()
  } else {
    // Six tubes on the major pentatonic of the key, hung where the device pans them, each as
    // long as its pitch makes a tube (the frequency goes with one over the length squared).
    const depth = outdoorsFront(distance)
    const scale = sizeAtDepth(depth)
    const root = chimeRoot(keyHz)
    const top = Math.max(parts.scene.y + 2, yOfDepth(depth, parts) - 44 * scale)
    const bright = chimeBright(tone)
    for (let tube = 0; tube < 6; tube++) {
      const sounds = !lit || chimeFits(tube, root, state.held)
      if (!sounds) continue
      const hz = root * Math.pow(2, CHIME_SCALE[tube] / 12)
      const long = 38 * scale * Math.sqrt(100 / hz) + 4 * scale
      const x = parts.mid + chimePan(tube) * across
      ctx.globalAlpha = alpha * inkAtDepth(depth)
      ctx.lineWidth = Math.max(2, 3.4 * scale)
      ctx.lineCap = 'butt'
      ctx.beginPath()
      ctx.moveTo(x, top + 3 * scale)
      ctx.lineTo(x, top + 3 * scale + long)
      ctx.stroke()
      // The three partials over the first, as bands across the tube: as strong as a strike puts them in.
      let amount = 1
      for (let k = 0; k < 3; k++) {
        amount *= bright
        ctx.globalAlpha = alpha * inkAtDepth(depth) * Math.min(1, 1.6 * CHIME_WEIGHT[k] * amount)
        ctx.lineWidth = 1
        ctx.beginPath()
        const y = Math.floor(top + 3 * scale + long * (0.25 + 0.25 * k)) + 0.5
        ctx.moveTo(x - 4 * scale, y)
        ctx.lineTo(x + 4 * scale, y)
        ctx.stroke()
      }
    }
    if (!lit) {
      // The bar they hang from and the clapper the wind swings between them.
      const left = parts.mid + chimePan(0) * across
      const right = parts.mid + chimePan(5) * across
      ctx.globalAlpha = alpha * inkAtDepth(depth) * INK.back
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(left - 3, Math.floor(top + 3 * scale) + 0.5)
      ctx.lineTo(right + 3, Math.floor(top + 3 * scale) + 0.5)
      ctx.moveTo(parts.mid, top + 3 * scale)
      ctx.lineTo(parts.mid, top + 15 * scale)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(parts.mid, top + 17 * scale, 2.2 * scale, 0, TAU)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
  ctx.lineCap = 'butt'
  ctx.lineJoin = 'miter'
}

/** How loud one side is, as a share of a scale from -60 dB up to full scale. */
function sideShare(level: DisplayLevel | null | undefined): number {
  if (!level) return 0
  const db = gainToDb(level.rms)
  return Number.isFinite(db) ? clamp(1 + db / 60, 0, 1) : 0
}

/**
 * The foot under a place: the level foot every instrument has, with a side of
 * its own for each speaker. The left half fills from the middle with the left
 * speaker's level and the right half with the right's, so it leans to where
 * the sound is.
 */
function sidesFoot(frame: Paint & Pick<DisplayFrame, 'signal' | 'powered'>, box: Box): void {
  const { ctx, colours } = frame
  const signal = frame.powered ? frame.signal : null
  const left = sideShare(signal?.left ?? signal?.output)
  const right = sideShare(signal?.right ?? signal?.output)
  const mid = box.x + box.w / 2
  fillRect(ctx, box, colours.ink, INK.fill)
  fillRect(
    ctx,
    { x: mid - (left * box.w) / 2, y: box.y, w: (left * box.w) / 2, h: box.h },
    colours.accent,
  )
  fillRect(ctx, { x: mid, y: box.y, w: (right * box.w) / 2, h: box.h }, colours.accent)
  ctx.globalAlpha = INK.rule
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1)
  ctx.globalAlpha = 1
}

/** The figure beside the scene's name: how many of a key's creatures are there, or how often its events come. */
function outdoorsFigure(knobs: OutdoorsKnobs): string {
  const { kind, density } = knobs
  if (kind === STREAM || kind === CHIMES) return rateText(outdoorsRate(kind, density))
  if (kind === THUNDER) return `every ${secondsText(1 / outdoorsRate(THUNDER, density))}`
  return `${outdoorsCount(kind, density)} of ${OUTDOORS_MOST[kind]}`
}

const outdoors = plateDisplay<OutdoorsState>({
  place: 'window',
  columns: 2,
  params: ['type', 'density', 'distance', 'movement', 'tone', 'attack', 'release', 'width'],
  live: { signal: true, notes: true, stereo: true },
  info: 'The place from where you stand: what a key puts there, as many as Density, as far back as Distance, as wide as Width, larger for a lower Tone. A key that sounds lights its own, the foot fills to each side with its speaker, and the handle sets Distance, said as where the air cuts the highs.',
  init: () => ({
    key: OUTDOORS_KEY_HZ,
    knobs: { kind: 0, density: 0, distance: 0, movement: 0, tone: 0, width: 0 },
    lit: newLit(),
    wave: wander(),
    held: [],
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const knobs = state.knobs
    knobs.kind = outdoorsKind(frame.value('type'))
    knobs.density = clamp(frame.value('density'), 0, 1)
    knobs.distance = clamp(frame.value('distance'), 0, 1)
    knobs.movement = clamp(frame.value('movement'), 0, 1)
    knobs.tone = clamp(frame.value('tone'), 0, 1)
    knobs.width = clamp(frame.value('width'), 0, 1)
    const attack = frame.value('attack')
    const release = frame.value('release')
    const parts = outdoorsParts(frame)
    const { scene } = parts

    // The horizon. Birds, frogs, a stream and the wind in the chimes rise and fall on a slow
    // wave that never repeats: it is the line of the land, as deep as Movement makes it.
    // Crickets and thunder have no such wave, and their horizon is level.
    const rides = knobs.kind !== CRICKETS && knobs.kind !== THUNDER
    const deep = rides ? 5 * knobs.movement : 0
    ctx.beginPath()
    const steps = Math.max(8, Math.floor(scene.w / 3))
    for (let i = 0; i <= steps; i++) {
      const at = (i / steps) * (WAVE_STEPS - 1)
      const below = Math.floor(at)
      const wave = lerp(
        state.wave[below],
        state.wave[Math.min(WAVE_STEPS - 1, below + 1)],
        at - below,
      )
      ctx.lineTo(scene.x + (i / steps) * scene.w, parts.horizon - deep * (wave - 0.5))
    }
    ctx.globalAlpha = INK.back
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.globalAlpha = 1

    // The ground the listener stands on, and how far back the scene begins.
    const front = yOfDepth(outdoorsFront(knobs.distance), parts)
    rule(ctx, scene.x + 4, parts.horizon + 2, scene.x + 4, parts.near, {
      colour: colours.ink,
      alpha: INK.grid,
    })
    rule(ctx, scene.x, front, scene.x + scene.w, front, {
      colour: colours.ink,
      alpha: INK.grid,
      dash: [1, 3],
    })
    ctx.beginPath()
    ctx.moveTo(parts.mid - 3.5, scene.y + scene.h)
    ctx.lineTo(parts.mid, scene.y + scene.h - 4.5)
    ctx.lineTo(parts.mid + 3.5, scene.y + scene.h)
    ctx.closePath()
    ctx.globalAlpha = INK.text
    ctx.fillStyle = colours.ink
    ctx.fill()
    ctx.globalAlpha = 1

    if (knobs.kind === STREAM) {
      // The rush under the bubbles: stronger with the flow, and from far off.
      const rate = outdoorsRate(STREAM, knobs.density)
      const rush = clamp((0.5 + 1.5 * knobs.distance) * 0.5 * Math.sqrt(rate / 2000), 0, 1)
      const scale = sizeAtDepth(outdoorsFront(knobs.distance))
      // `stream.h`: each side has a noise of its own, so the rush is as wide as Width lets
      // anything be; the room either side is what the bubbles of a place scatter over.
      const reach = knobs.width * parts.half + 10 * scale
      const from = parts.mid - reach
      const to = parts.mid + reach
      const swell = (0.5 + 2 * knobs.movement) * scale
      for (let line = 0; line < 3; line++) {
        ctx.beginPath()
        for (let x = from; x <= to; x += 2)
          ctx.lineTo(x, front + line * 3 * scale + swell * Math.sin(x / (3.2 * scale) + line * 2))
        ctx.globalAlpha = 0.25 + 0.75 * rush
        ctx.strokeStyle = colours.ink
        ctx.lineWidth = 1
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }

    // The scene at rest is what the last key put there; each key that sounds lights its own.
    const notes = frame.notes
    const count = sounding(
      notes,
      (note) => airLight(note.age, note.released, attack, release),
      state.lit,
    )
    if (count > 0) state.key = clamp(notes[state.lit.index[0]].frequency, 8, 12000)
    state.held.length = 0
    for (let n = 0; n < count; n++) {
      const note = notes[state.lit.index[n]]
      if (note.released === null) state.held.push(clamp(note.frequency, 8, 12000))
    }
    outdoorsScene(frame, parts, state.key, colours.ink, 1, false)
    for (let n = count - 1; n >= 0; n--) {
      const note = notes[state.lit.index[n]]
      outdoorsScene(
        frame,
        parts,
        clamp(note.frequency, 8, 12000),
        colours.accent,
        lightOf(state.lit.light[n], note.gain),
        true,
      )
    }

    sidesFoot(frame, parts.foot)

    const top = scene.y - 4
    text(frame, OUTDOORS_NAMES[knobs.kind], scene.x, top)
    text(frame, outdoorsFigure(knobs), scene.x + scene.w, top, { align: 'right' })
    // What Distance does, in a unit: where the air cuts the highs. Said between the two
    // where there is room for a third.
    if (frame.width >= 170)
      text(frame, `air ${hzText(outdoorsAirHz(knobs.distance))}`, parts.mid, top, {
        align: 'center',
      })

    for (const point of outdoorsHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: outdoorsHandles,
})

function outdoorsHandles(view: DisplayView): DisplayHandle[] {
  const parts = outdoorsParts(view)
  return [
    {
      key: 'distance',
      name: 'Distance',
      x: parts.scene.x + 4,
      y: yOfDepth(outdoorsFront(view.value('distance')), parts),
      drag: (_x, toY) => ({
        distance: clamp(
          ((parts.near - toY) / (parts.near - parts.horizon - 2) - outdoorsFront(0)) /
            (outdoorsFront(1) - outdoorsFront(0)),
          0,
          1,
        ),
      }),
      reset: () => ({ distance: view.spec('distance')?.default ?? 0.4 }),
    },
  ]
}

// --- Thesis ------------------------------------------------------------------

/** `ThesisTransform.h`, `kIntervalTable`: the scales, in semitones over the root. */
const THESIS_SCALES: readonly (readonly number[])[] = [
  [0, 2, 4, 5, 7, 9, 11],
  [0, 2, 3, 5, 7, 8, 10],
  [0, 2, 3, 5, 7, 8, 11],
  [0, 2, 3, 5, 7, 9, 11],
  [0, 2, 3, 5, 7, 9, 10],
  [0, 1, 3, 5, 7, 8, 10],
  [0, 2, 4, 6, 7, 9, 11],
  [0, 2, 4, 5, 7, 9, 10],
  [0, 1, 3, 5, 6, 8, 10],
  [0, 2, 4, 7, 9],
  [0, 3, 5, 6, 7, 10],
  [0, 2, 4, 6, 8, 10],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
]
const THESIS_SCALE_NAMES = [
  'Major',
  'Natural Minor',
  'Harmonic Minor',
  'Melodic Minor',
  'Dorian',
  'Phrygian',
  'Lydian',
  'Mixolydian',
  'Locrian',
  'Pentatonic',
  'Blues',
  'Whole Tone',
  'Chromatic',
] as const
/** The same, for a display too narrow for the whole name beside the mode. */
const THESIS_SCALE_SHORT = [
  'Major',
  'Minor',
  'Harm min',
  'Mel min',
  'Dorian',
  'Phrygian',
  'Lydian',
  'Mixolyd',
  'Locrian',
  'Penta',
  'Blues',
  'Whole',
  'Chromatic',
] as const
const BREATHE = 1
const DRIFT = 2
const GRAVITY = 3
const THESIS_MODES = ['Fixed', 'Breathe', 'Drift', 'Gravity'] as const
/** `ThesisTransform::rebuildScaleNotes`: the scale is laid out from C1 to C7, 73 keys at most. */
const THESIS_LOW = 24
const THESIS_HIGH = 96
const THESIS_KEYS_MOST = 73
/** `thesis.h`, `kPartials`: the six bands of a note. The first is always on; these switch the rest. */
const THESIS_BANDS = 6
const THESIS_SWITCHES = [
  'mirrorEnabled',
  'octaflipEnabled',
  'middleEnabled',
  'mirrorMiddleEnabled',
  'centerEnabled',
] as const
/** `thesis.h`, `kOffsetSin` and `kOffsetCos`: how far into the turn of a note's LFO each of its bands is. */
const THESIS_OFFSETS = [0, 0.17, 0.33, 0.5, 0.67, 0.83] as const
/** `Thesis::note_on`: a note's LFO starts at a place of chance in the first tenth of its turn. The middle of that tenth is drawn. */
const THESIS_START = 0.05
/** `thesis.h`, `kDriftDepth`: Drift wobbles a band's pitch by 2 % either way. */
const THESIS_DRIFT = 0.02
/** `Thesis::move`, Gravity: from where a band starts the fifth above is the nearest aim, and it is there within milliseconds. */
const THESIS_FIFTH = 1.5
/** The scale of pitch across the picture: from under C1 to over the fifth above C7. */
const THESIS_LOW_KEY = 22
const THESIS_HIGH_KEY = 105
const THESIS_LOW_HZ = hzOfKey(THESIS_LOW_KEY)
const THESIS_HIGH_HZ = hzOfKey(THESIS_HIGH_KEY)
/** How many dB the height of the picture holds, from the loudest band the device can make down to the foot. */
const THESIS_DB = 36
/**
 * The ticks of the Strum: so many px stand for a second between two entries.
 * From 34 ms up two ticks are 2 px apart and more, so each is seen; under that
 * they run into one block as wide as the chord takes to come in.
 */
const THESIS_STRUM_PX = 60

/** `ThesisTransform::rebuildScaleNotes`: every key of the scale from C1 to C7, lowest first. How many there are. */
function scaleInto(scale: number, root: number, into: Int16Array): number {
  const steps = THESIS_SCALES[clamp(Math.round(scale), 0, THESIS_SCALES.length - 1)]
  const from = clamp(Math.round(root), 0, 11)
  let count = 0
  // The device builds it octave by octave from the root in the octave of C1, so with a root
  // above C the keys under that first root are not in it.
  for (let octave = 2; octave <= 7; octave++)
    for (const step of steps) {
      const key = octave * 12 + from + step
      if (key >= THESIS_LOW && key <= THESIS_HIGH) into[count++] = key
    }
  return count
}

/** `ThesisTransform::midiToScaleIndex`: where in the scale the key nearest a key is. Between two, the lower. */
function nearest(keys: Int16Array, count: number, key: number): number {
  let best = 0
  let apart = Math.abs(keys[0] - key)
  for (let i = 1; i < count; i++) {
    const far = Math.abs(keys[i] - key)
    if (far < apart) {
      apart = far
      best = i
    } else if (far > apart) break
  }
  return best
}

/**
 * `ThesisTransform::transform`: the six keys a played key becomes, counted in
 * steps of the scale: itself on the scale, its mirror in the centre, itself an
 * octave towards the centre, halfway to the centre, that one's mirror, and the
 * centre.
 */
function chordInto(
  keys: Int16Array,
  count: number,
  size: number,
  key: number,
  centre: number,
  into: Int16Array,
): void {
  const at = (index: number): number => keys[clamp(index, 0, count - 1)]
  const middle = nearest(keys, count, clamp(Math.floor(centre + 0.5), THESIS_LOW, THESIS_HIGH))
  const played = nearest(keys, count, key)
  into[0] = at(played)
  into[1] = at(2 * middle - played)
  into[2] = at(played + (into[0] > at(middle) ? -size : into[0] < at(middle) ? size : 0))
  const half = Math.trunc((played + middle) / 2)
  into[3] = at(half)
  into[4] = at(2 * middle - half)
  into[5] = at(middle)
}

/** The keys of a scale on a root, as `ThesisTransform` lays them out. */
export function thesisScale(scale: number, root: number): number[] {
  const keys = new Int16Array(THESIS_KEYS_MOST)
  return Array.from(keys.subarray(0, scaleInto(scale, root, keys)))
}

/** The six keys of a played key, as MIDI numbers: original, mirror, octaflip, middle, mirror middle, centre. */
export function thesisChord(key: number, centre: number, scale: number, root: number): number[] {
  const keys = new Int16Array(THESIS_KEYS_MOST)
  const count = scaleInto(scale, root, keys)
  const into = new Int16Array(THESIS_BANDS)
  chordInto(keys, count, THESIS_SCALES[clamp(Math.round(scale), 0, 12)].length, key, centre, into)
  return Array.from(into)
}

/**
 * `Thesis::Envelope`: straight lines. The level of a key pressed `age` seconds
 * ago and let go `released` seconds ago: up to full over Attack, and from the
 * key up down from where it stood, at the rate that takes a full level to
 * nothing over Release.
 */
export function thesisEnvelope(
  age: number,
  released: number | null,
  attack: number,
  release: number,
): number {
  const held = released === null ? age : Math.max(0, age - released)
  const top = Math.min(1, held / attack)
  return released === null ? top : Math.max(0, top - released / release)
}

/** `Thesis::apply`, `kResonance`: the Q of the bands. The device stops at 50, so the top half of the knob adds nothing. */
export const thesisQ = (resonance: number): number => clamp(resonance, 1, 50)

/**
 * `StereoWidener::updateParameters` on a sound that is mono, as the sum of the
 * voices is: what Width makes of the part over the bass crossover, from 3 dB
 * up at 0 to 5.6 dB down at 100. The bass under it goes by untouched.
 */
export function thesisMid(width: number): number {
  const w = clamp(width / 100, 0, 1)
  const side = w <= 0.5 ? 2 * w : 1 + (w - 0.5) * 3
  return 1 / Math.sqrt(0.5 * (1 + side * side))
}

/** The same: how much of the sound goes through the decorrelators that make it stereo, from Width 75 up. */
export const thesisSpread = (width: number): number => clamp((width / 100 - 0.75) * 4, 0, 1)

/** `StereoWidener::prepare`: the bass crossover, each side's four delays in samples and what each stage feeds forward. */
const WIDENER_BASS_HZ = 200
const WIDENER_DELAYS = [
  [7, 19, 37, 67],
  [11, 29, 47, 79],
] as const
const WIDENER_FORWARD = [0.5, 0.6, 0.55, 0.65] as const
/** The length of a stage's line, and the late copy on the right: 0.8 ms, 63 samples at most. */
const WIDENER_LINE = 512
const WIDENER_LATE_SEC = 0.0008
const WIDENER_LATE_MOST = 63

/**
 * `StereoWidener::process` on a mono band at `hz`: what it makes of the level,
 * as the mean of the two sides' power. Under the crossover a band goes by, so
 * Width trims a low band less than a high one. Past Width 75 the band goes
 * through four stages a side, and `AllpassFilter::process` keeps what comes in
 * where an all-pass keeps what goes out: each stage is a comb, -g + z^-D +
 * g z^-512, so the level of a band there depends on its pitch, by 20 dB and
 * more. The display draws that, since that is what is heard.
 */
export function thesisWidener(width: number, hz: number, sampleRate: number): number {
  const w = clamp(width / 100, 0, 1)
  const turn = (TAU * hz) / sampleRate
  const pole = Math.exp((-TAU * WIDENER_BASS_HZ) / sampleRate)
  const under = 1 - 2 * pole * Math.cos(turn) + pole * pole
  const lowRe = ((1 - pole) * (1 - pole * Math.cos(turn))) / under
  const lowIm = (-(1 - pole) * pole * Math.sin(turn)) / under
  const mid = thesisMid(width)
  const highRe = mid * (1 - lowRe)
  const highIm = -mid * lowIm
  const mix = thesisSpread(width)
  const late = clamp((w - 0.85) / 0.15, 0, 1)
  const lineRe = Math.cos(turn * WIDENER_LINE)
  const lineIm = -Math.sin(turn * WIDENER_LINE)
  let power = 0
  for (let side = 0; side < 2; side++) {
    let re = 1
    let im = 0
    if (mix > 0.001) {
      for (let stage = 0; stage < 4; stage++) {
        const g = WIDENER_FORWARD[stage]
        const at = turn * WIDENER_DELAYS[side][stage]
        const stageRe = -g + Math.cos(at) + g * lineRe
        const stageIm = -Math.sin(at) + g * lineIm
        const next = re * stageRe - im * stageIm
        im = re * stageIm + im * stageRe
        re = next
      }
      re = 1 - mix + mix * re
      im = mix * im
    }
    if (side === 1 && late > 0.001) {
      const at = turn * Math.min(Math.floor(WIDENER_LATE_SEC * sampleRate), WIDENER_LATE_MOST)
      const lateRe = 1 - late + late * Math.cos(at)
      const lateIm = -late * Math.sin(at)
      const next = re * lateRe - im * lateIm
      im = re * lateIm + im * lateRe
      re = next
    }
    const outRe = lowRe + highRe * re - highIm * im
    const outIm = lowIm + highRe * im + highIm * re
    power += outRe * outRe + outIm * outIm
  }
  return Math.sqrt(power / 2)
}

/**
 * The peak of one band before the widener, beside the loudest a band can be.
 * `Thesis::process` scales a band whose peak is Q by 1 / max(1, Q / 10), and
 * `Thesis::render` divides a note by the root of how many of its bands have
 * entered.
 */
export function thesisPeak(resonance: number, entered: number): number {
  const q = thesisQ(resonance)
  return Math.min(q, 10) / 10 / Math.sqrt(Math.max(1, entered))
}

/** `Thesis::render`, Breathe: the level of band `index` of a note `seconds` old, between 0.3 and 1. */
export function thesisBreath(index: number, seconds: number, rate: number): number {
  const breath = 0.5 + 0.5 * Math.sin(TAU * (THESIS_START + rate * seconds + THESIS_OFFSETS[index]))
  return 0.3 + 0.7 * breath * breath
}

/** `Thesis::move`: how many times its own pitch band `index` of a note `seconds` old sounds at. */
export function thesisBend(mode: number, index: number, seconds: number, rate: number): number {
  if (mode === GRAVITY) return THESIS_FIFTH
  if (mode !== DRIFT) return 1
  return 1 + THESIS_DRIFT * Math.sin(TAU * (THESIS_START + rate * seconds + THESIS_OFFSETS[index]))
}

/**
 * A level as a share of the picture's height. The top is 6 dB over one band
 * that the widener leaves as it is: room for what Width 0 adds and for most of
 * what the comb past 75 does. A band louder than that stands at the top.
 */
const THESIS_TOP = 2
const thesisShare = (level: number): number =>
  level <= 0 ? 0 : clamp(1 + gainToDb(level / THESIS_TOP) / THESIS_DB, 0, 1)

interface ThesisParts {
  /** The bands: pitch across, level up. */
  field: Box
  /** The keys of the scale, as a comb under the bands. */
  comb: Box
  foot: Box
}

function thesisParts(view: Size, spread: number): ThesisParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const field: Box = { x: all.x + 1, y: all.y + 13, w: all.w - 2, h: all.h - 13 - 15 }
  return {
    field,
    comb: { x: field.x, y: field.y + field.h + 2, w: field.w, h: 5 },
    foot: footBox(all, spread),
  }
}

const xOfKey = (key: number, field: Box): number =>
  xOfPitch(hzOfKey(key), field, THESIS_LOW_HZ, THESIS_HIGH_HZ)
const keyOfX = (x: number, field: Box): number =>
  THESIS_LOW_KEY + ((x - field.x) / field.w) * (THESIS_HIGH_KEY - THESIS_LOW_KEY)

/**
 * One band, added to the path: a band-pass of that Q around `hz`, its peak
 * `share` of the field high, falling on the picture's scale of dB as the
 * filter falls: 1 / sqrt(1 + Q^2 (r - 1/r)^2) at `r` times its pitch.
 */
function thesisBand(
  ctx: CanvasRenderingContext2D,
  field: Box,
  hz: number,
  q: number,
  share: number,
): void {
  if (share <= 0) return
  const foot = field.y + field.h
  const right = field.x + field.w
  const perOctave = field.w / Math.log2(THESIS_HIGH_HZ / THESIS_LOW_HZ)
  const x = xOfPitch(hz, field, THESIS_LOW_HZ, THESIS_HIGH_HZ)
  // Where it has fallen to the foot: `share` of the scale of dB under its peak.
  const down = Math.pow(10, (share * THESIS_DB) / 20)
  const reach = (Math.asinh(Math.sqrt(down * down - 1) / (2 * q)) / Math.LN2) * perOctave
  const steps = clamp(Math.ceil(reach / 1.5), 3, 14)
  ctx.moveTo(clamp(x - reach, field.x, right), foot)
  for (let i = 1 - steps; i < steps; i++) {
    const r = Math.pow(2, ((i / steps) * reach) / perOctave)
    const off = q * (r - 1 / r)
    const high = Math.max(0, share - (10 * Math.log10(1 + off * off)) / THESIS_DB)
    ctx.lineTo(clamp(x + (i / steps) * reach, field.x, right), foot - field.h * high)
  }
  ctx.lineTo(clamp(x + reach, field.x, right), foot)
}

interface ThesisState {
  /** The last key played, as a MIDI number: the chord at rest is drawn for it. Under 0 until one is. */
  key: number
  /** The keys of the scale, and the scale and root they were laid out for. */
  keys: Int16Array
  count: number
  scale: number
  root: number
  chord: Int16Array
  /** Which of the six bands are switched on. */
  on: Uint8Array
  /** What the widener makes of each band of the chord at rest, at its pitch. */
  gain: Float32Array
  lit: Lit
}

/** The mode and its one figure: how fast it breathes or drifts, or where Gravity takes a band. */
function thesisFigure(mode: number, rate: number): string {
  if (mode === BREATHE || mode === DRIFT) return `${THESIS_MODES[mode]} ${rate.toFixed(2)} Hz`
  return mode === GRAVITY ? 'Gravity ×1.5' : THESIS_MODES[0]
}

const thesis = plateDisplay<ThesisState>({
  place: 'window',
  columns: 2,
  params: [
    'center',
    'resonance',
    'width',
    'attack',
    'release',
    'mode',
    'breatheRate',
    'strum',
    'mirrorEnabled',
    'octaflipEnabled',
    'middleEnabled',
    'mirrorMiddleEnabled',
    'centerEnabled',
    'scale',
    'root',
  ],
  live: { signal: true, notes: true, spectrum: true },
  info: 'The bands of noise a key makes, over the keys of the scale: the key and its reflections about the dashed Center Note, as tall as they are loud, as narrow as Resonance makes them. The ticks at the right are their entries under Strum. A key that sounds lights its own, and the handle moves the centre.',
  init: () => ({
    key: -1,
    keys: new Int16Array(THESIS_KEYS_MOST),
    count: 0,
    scale: -1,
    root: -1,
    chord: new Int16Array(THESIS_BANDS),
    on: new Uint8Array(THESIS_BANDS),
    gain: new Float32Array(THESIS_BANDS),
    lit: newLit(),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const scale = clamp(Math.round(frame.value('scale')), 0, THESIS_SCALES.length - 1)
    const root = clamp(Math.round(frame.value('root')), 0, 11)
    if (scale !== state.scale || root !== state.root) {
      state.count = scaleInto(scale, root, state.keys)
      state.scale = scale
      state.root = root
    }
    const size = THESIS_SCALES[scale].length
    const mode = clamp(Math.round(frame.value('mode')), 0, 3)
    const rate = frame.value('breatheRate')
    const strum = frame.value('strum') / 1000
    const attack = frame.value('attack')
    const release = frame.value('release')
    const resonance = frame.value('resonance')
    const q = thesisQ(resonance)
    const width = frame.value('width')
    const centre = frame.value('center')
    const { on, chord, gain } = state
    on[0] = 1
    let bands = 1
    for (let i = 1; i < THESIS_BANDS; i++) {
      on[i] = frame.value(THESIS_SWITCHES[i - 1]) > 0.5 ? 1 : 0
      bands += on[i]
    }
    const { field, comb, foot } = thesisParts(frame, thesisSpread(width))
    const base = field.y + field.h

    // The sound that comes out, behind the bands and on their scale of pitch.
    if (frame.powered)
      spectrum(frame, field, {
        minHz: THESIS_LOW_HZ,
        maxHz: THESIS_HIGH_HZ,
        topDb: -18,
        bottomDb: -90,
      })
    rule(ctx, field.x, base + 0.5, field.x + field.w, base + 0.5, {
      colour: colours.ink,
      alpha: INK.rule,
    })

    // The keys of the scale: a band can stand nowhere else. The roots are the tall teeth.
    for (let tall = 0; tall < 2; tall++) {
      ctx.beginPath()
      for (let i = 0; i < state.count; i++) {
        const key = state.keys[i]
        if (((key - root) % 12 === 0) !== (tall === 1)) continue
        const x = Math.floor(xOfKey(key, field)) + 0.5
        ctx.moveTo(x, comb.y + (tall ? 0 : 2))
        ctx.lineTo(x, comb.y + comb.h)
      }
      ctx.globalAlpha = tall ? 1 : INK.back
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // The centre, where the device takes it: the key of the scale nearest the knob.
    const middle =
      state.keys[
        nearest(state.keys, state.count, clamp(Math.floor(centre + 0.5), THESIS_LOW, THESIS_HIGH))
      ]
    const centreX = Math.floor(xOfKey(middle, field)) + 0.5
    rule(ctx, centreX, field.y, centreX, comb.y + comb.h, {
      colour: colours.ink,
      alpha: INK.text,
      dash: [2, 2],
    })

    const notes = frame.notes
    const count = sounding(
      notes,
      (note) => thesisEnvelope(note.age, note.released, attack, release),
      state.lit,
    )
    if (count > 0) state.key = keyOfHz(clamp(notes[state.lit.index[0]].frequency, 8, 13000))

    // At rest: the chord of the last key played, or until one is, of the key four steps of
    // the scale over the centre. Every band that is switched on, as the knobs leave it.
    const rest =
      state.key >= 0
        ? state.key
        : state.keys[clamp(nearest(state.keys, state.count, middle) + 4, 0, state.count - 1)]
    chordInto(state.keys, state.count, size, rest, centre, chord)
    const still = thesisPeak(resonance, bands)
    const sampleRate = frame.sampleRate
    const bend = mode === GRAVITY ? THESIS_FIFTH : 1
    ctx.beginPath()
    for (let i = 0; i < THESIS_BANDS; i++) {
      if (!on[i]) continue
      const hz = hzOfKey(chord[i]) * bend
      gain[i] = thesisWidener(width, hz, sampleRate)
      if (mode === DRIFT) {
        // Drift: the band at either end of its wobble, as loud as the widener has it there.
        const under = hz * (1 - THESIS_DRIFT)
        const over = hz * (1 + THESIS_DRIFT)
        thesisBand(
          ctx,
          field,
          under,
          q,
          thesisShare(still * thesisWidener(width, under, sampleRate)),
        )
        thesisBand(ctx, field, over, q, thesisShare(still * thesisWidener(width, over, sampleRate)))
      } else thesisBand(ctx, field, hz, q, thesisShare(still * gain[i]))
    }
    ctx.globalAlpha = INK.fill
    ctx.fillStyle = colours.ink
    ctx.fill()
    ctx.globalAlpha = INK.text
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.lineJoin = 'round'
    ctx.stroke()

    // What the mode does to them, still: how low a breath takes each, or where Gravity
    // took it from.
    ctx.beginPath()
    for (let i = 0; i < THESIS_BANDS; i++) {
      if (!on[i]) continue
      const x = xOfKey(chord[i], field)
      const drawn = xOfPitch(hzOfKey(chord[i]) * bend, field, THESIS_LOW_HZ, THESIS_HIGH_HZ)
      if (mode === BREATHE) {
        const low = base - field.h * thesisShare(still * gain[i] * 0.3)
        ctx.moveTo(drawn - 3, Math.floor(low) + 0.5)
        ctx.lineTo(drawn + 3, Math.floor(low) + 0.5)
      } else if (mode === GRAVITY) {
        ctx.moveTo(x, base - 5.5)
        ctx.lineTo(x, base - 2.5)
        ctx.lineTo(drawn, base - 2.5)
      }
    }
    ctx.globalAlpha = INK.text
    ctx.stroke()

    // What Strum does to a chord's entries, at the right under the mode: a tick for each
    // band that is switched on, in the order they come and as far apart as they come in
    // time. `Thesis::note_on` makes band i wait i times the knob, whichever others are on.
    let taken = field.x + field.w
    if (strum > 0) {
      const most = (frame.spec('strum')?.max ?? 100) / 1000
      const from = field.x + field.w - (THESIS_BANDS - 1) * most * THESIS_STRUM_PX
      taken = from - 2
      ctx.beginPath()
      for (let i = 0; i < THESIS_BANDS; i++) {
        if (!on[i]) continue
        const x = Math.floor(from + i * strum * THESIS_STRUM_PX) + 0.5
        ctx.moveTo(x, field.y + 1)
        ctx.lineTo(x, field.y + 7)
      }
      ctx.globalAlpha = 1
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.stroke()
      // The knob's own figure beside them, where there is room for it.
      if (frame.width >= 170) {
        const figure = `${Math.round(strum * 1000)} ms`
        label(frame, figure, from - 4, field.y + 7, 'right')
        taken = from - 6 - ctx.measureText(figure).width
      }
    }

    // A mirror is as many steps of the scale past the centre as its band is short of it:
    // an arc joins the two, from the top of the one to the top of the other.
    ctx.beginPath()
    for (let pair = 0; pair < 2; pair++) {
      const a = pair === 0 ? 0 : 3
      if (!on[a] || !on[a + 1] || chord[a] === chord[a + 1]) continue
      const from = xOfPitch(hzOfKey(chord[a]) * bend, field, THESIS_LOW_HZ, THESIS_HIGH_HZ)
      const to = xOfPitch(hzOfKey(chord[a + 1]) * bend, field, THESIS_LOW_HZ, THESIS_HIGH_HZ)
      const fromY = base - field.h * thesisShare(still * gain[a])
      const toY = base - field.h * thesisShare(still * gain[a + 1])
      const apex = Math.max(field.y + 1, Math.min(fromY, toY) - 7)
      ctx.moveTo(from, fromY)
      ctx.quadraticCurveTo((from + to) / 2, 2 * apex - (fromY + toY) / 2, to, toY)
    }
    ctx.globalAlpha = INK.back
    ctx.setLineDash([1, 2])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1

    // Each key that sounds lights its own bands: those that have entered, each where the
    // mode has it now, as strong as the envelope.
    for (let n = count - 1; n >= 0; n--) {
      const note = notes[state.lit.index[n]]
      chordInto(
        state.keys,
        state.count,
        size,
        keyOfHz(clamp(note.frequency, 8, 13000)),
        centre,
        chord,
      )
      let entered = 0
      for (let i = 0; i < THESIS_BANDS; i++) if (on[i] && note.age >= i * strum) entered++
      const level = thesisPeak(resonance, entered)
      ctx.beginPath()
      for (let i = 0; i < THESIS_BANDS; i++) {
        if (!on[i] || note.age < i * strum) continue
        const hz = hzOfKey(chord[i]) * thesisBend(mode, i, note.age, rate)
        const heard = level * thesisWidener(width, hz, sampleRate)
        thesisBand(
          ctx,
          field,
          hz,
          q,
          thesisShare(mode === BREATHE ? heard * thesisBreath(i, note.age, rate) : heard),
        )
      }
      const alpha = lightOf(state.lit.light[n], note.gain)
      ctx.globalAlpha = alpha * 0.5
      ctx.fillStyle = colours.accent
      ctx.fill()
      ctx.globalAlpha = alpha
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 1.25
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    levelFoot(frame, foot, outShare(frame))

    // The words: the scale, the mode and its rate, and the centre by its name.
    const top = field.y - 5
    const names = frame.width < 170 ? THESIS_SCALE_SHORT : THESIS_SCALE_NAMES
    text(frame, `${pitchName(hzOfKey(60 + root)).slice(0, -1)} ${names[scale]}`, field.x, top)
    text(frame, thesisFigure(mode, rate), field.x + field.w, top, { align: 'right' })
    // The handle stands on the knob's own key, which may be a key past the line: the name clears both.
    // It goes to the left of them when the right is taken by what Strum draws there.
    const points = thesisHandles(frame)
    const name = pitchName(hzOfKey(middle))
    const after = Math.max(centreX, points[0].x) + 7
    ctx.font = `8px ${frame.fontFamily}`
    if (after + ctx.measureText(name).width + 2 > taken)
      label(frame, name, Math.min(centreX, points[0].x) - 7, field.y + 7, 'right')
    else label(frame, name, after, field.y + 7)

    for (const point of points) handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: thesisHandles,
})

function thesisHandles(view: DisplayView): DisplayHandle[] {
  const { field } = thesisParts(view, thesisSpread(view.value('width')))
  const spec = view.spec('center')
  return [
    {
      key: 'center',
      name: 'Center Note',
      // Where the knob stands: the dashed line is on the key of the scale nearest it.
      x: xOfKey(view.value('center'), field),
      y: field.y + 4,
      drag: (toX) => ({
        center: clamp(Math.round(keyOfX(toX, field)), spec?.min ?? 48, spec?.max ?? 71),
      }),
      reset: () => ({ center: spec?.default ?? 62 }),
    },
  ]
}

export const AIR_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  atmosphere: { display: atmosphere, face: ['type', 'density', 'movement', 'tone'] },
  outdoors: { display: outdoors, face: ['type', 'density', 'distance', 'movement'] },
  thesis: {
    display: thesis,
    face: ['center', 'resonance', 'scale', 'root'],
    // What the bands are tuned to, which of them a key gets, and how they come and go.
    sections: [
      ['center', 'resonance', 'scale', 'root'],
      ['mirrorEnabled', 'octaflipEnabled', 'middleEnabled', 'mirrorMiddleEnabled', 'centerEnabled'],
      ['mode', 'breatheRate', 'strum', 'attack', 'release', 'width'],
    ],
  },
}
