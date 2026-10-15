// The display of Breath Pacer: one whole breath over time, and where it is now.
//
// The curve is one cycle as the device shapes it, in seconds from left to
// right: the level rises through In, stays through Hold, falls through Out and
// sits at Floor through Rest. Each part is named under the stretch of the axis
// it takes, with its seconds, and the axis has a tick for every second. A
// fainter line is how open the colour is, which Bright ties to the breath. A
// dot rides the curve at the breath's own pace, which is slow by nature: the
// quickest cycle takes two seconds, and the dot never goes faster than twice
// the cycle's pace or back along it. Nothing here goes on and off.
//
// Over the curve are the cycle's length as it is now and how many of them go
// in a minute. When a slow down is set, a line under those runs from the
// cycle's length as it is set to the length it grows to, with a dot at the
// place the device reports; the lengths written are then the ones of this
// moment. Under the curve are how far up Air, Tone and Marks stand, and the
// level that comes out, taken over the last second.
//
// Everything is the device's own arithmetic (`cpp/devices/breath-pacer/breath_pacer.h`):
// `rise`, `breath_at`, `floor_gain`, `level_gain` and `openness`, and the
// slow down of `kit::RateGlide` (`cpp/kit/beat.h`). The device reports where
// the breath stands in its cycle, how far through the slow down is and how
// many times its set length the cycle is now.

import {
  INK,
  clamp,
  dot,
  fillRect,
  fillTo,
  ground,
  rule,
  text,
  trace,
  type Box,
  type Point,
} from '../display-kit'
import { plateDisplay, type DisplayView, type PlateFace } from '../plate-display'
import { levelFoot } from './instrument-parts'

const wrap = (cycles: number): number => (Number.isFinite(cycles) ? cycles - Math.floor(cycles) : 0)
const shortWay = (cycles: number): number => wrap(cycles + 0.5) - 0.5

// --- The device's numbers (`breath_pacer.h`, `kit/beat.h`) ---------------------

/** `kEase`: how much of the soft S is in a rise: 0 is a straight line, 1 half a cosine. */
const EASE = 0.5
/** `kStageIn`, `kStageHold`, `kStageOut`, `kStageRest`: the four parts of a cycle, in order. */
export const BREATH_PACER_PARTS = ['In', 'Hold', 'Out', 'Rest'] as const
const STAGE_IN = 0
const STAGE_HOLD = 1
const STAGE_OUT = 2

/** `rise`: the way in at `t` (0..1) through a part, half a line and half a soft S. */
export function breathPacerRise(t: number): number {
  const along = clamp(t, 0, 1)
  return along + EASE * (0.5 - 0.5 * Math.cos(Math.PI * along) - along)
}

/** `breath_at`: how full the breath is at `t` (0..1) through a part: 0 empty, 1 full. */
export function breathPacerBreath(stage: number, t: number): number {
  if (stage === STAGE_IN) return breathPacerRise(t)
  if (stage === STAGE_HOLD) return 1
  if (stage === STAGE_OUT) return 1 - breathPacerRise(t)
  return 0
}

/** `floor_gain`: the gain at the bottom of the breath for a Floor of 0..1. */
export const breathPacerFloorGain = (floor: number): number => floor * floor

/** `level_gain`: the gain of the breathing sound for a Floor and a breath. */
export function breathPacerLevel(floor: number, breath: number): number {
  const gain = breathPacerFloorGain(clamp(floor, 0, 1))
  return gain + (1 - gain) * breath
}

/** `openness`: how open the sound is for a Bright and a breath: a half at Bright 0, the breath itself at 1. */
export const breathPacerOpen = (bright: number, breath: number): number =>
  0.5 + clamp(bright, 0, 1) * (breath - 0.5)

/** One part of a cycle that takes time: which it is, how long it is as set and when it starts, in seconds. */
export interface BreathPacerPart {
  stage: number
  name: string
  seconds: number
  from: number
}

/** A cycle as its four lengths set it. */
export interface BreathPacerCycle {
  parts: BreathPacerPart[]
  /** The length of the whole cycle as it is set, in seconds. */
  seconds: number
}

/**
 * The cycle from its four lengths in seconds. A Hold or a Rest of 0 takes no
 * time at all and is no part of it (`set_length`: under one sample is none);
 * In and Out are a second at the least.
 */
export function breathPacerCycle(
  inSec: number,
  holdSec: number,
  outSec: number,
  restSec: number,
): BreathPacerCycle {
  const lengths = [
    Math.max(1, inSec),
    Math.max(0, holdSec),
    Math.max(1, outSec),
    Math.max(0, restSec),
  ]
  const parts: BreathPacerPart[] = []
  let from = 0
  lengths.forEach((seconds, stage) => {
    if (!(seconds > 0)) return
    parts.push({ stage, name: BREATH_PACER_PARTS[stage], seconds, from })
    from += seconds
  })
  return { parts, seconds: from }
}

/**
 * How full the breath is at `place` of its cycle (0 at the start of In, 1 at
 * the end of the last part, each part taking its share of the lengths, as the
 * device reports it).
 */
export function breathPacerAt(cycle: BreathPacerCycle, place: number): number {
  const time = clamp(place, 0, 1) * cycle.seconds
  for (let i = cycle.parts.length - 1; i >= 0; i--) {
    const part = cycle.parts[i]
    if (time >= part.from) return breathPacerBreath(part.stage, (time - part.from) / part.seconds)
  }
  return 0
}

/**
 * `kit::RateGlide`: how many times its set length the cycle is at `place` of
 * the slow down (0..1). The speed goes from 1 to 1 / Slow to by ratio, so the
 * length goes from 1 to Slow to by ratio. With Over at 0 there is no slow down.
 */
export function breathPacerStretch(slowTo: number, over: number, place: number): number {
  if (!(over > 0) || !(slowTo > 1)) return 1
  return Math.pow(slowTo, clamp(place, 0, 1))
}

/**
 * `kAirGain`, `kToneGain` and `kMarkGain` each scale the square of their
 * knob, so a part's level under its own top is 40 times the logarithm of the
 * knob, in dB.
 */
export const breathPacerPartDb = (knob: number): number =>
  knob > 0 ? 40 * Math.log10(Math.min(1, knob)) : -Infinity

/** The foot of the scale Air, Tone and Marks are drawn on, dB under each one's top. */
const PART_FLOOR_DB = -40

/** How much of its bar a part fills: all of it at the top, none 40 dB under. */
export const breathPacerPartShare = (knob: number): number =>
  clamp(1 - breathPacerPartDb(knob) / PART_FLOOR_DB, 0, 1)

/** A figure as it is written: whole where it is whole, else to a tenth. */
const figure = (value: number): string => {
  const tenths = Math.round(value * 10) / 10
  return Number.isInteger(tenths) ? String(tenths) : tenths.toFixed(1)
}

/** A length of time as it is written: "10 s", "5.5 s". */
export const breathPacerSecondsText = (seconds: number): string => `${figure(seconds)} s`

/** How many cycles of `seconds` go in a minute, as it is written: "6 a minute", "5.5 a minute". */
export const breathPacerMinuteText = (seconds: number): string => `${figure(60 / seconds)} a minute`

/**
 * The curve as places in the cycle (0..1) to draw it through: the corners of
 * every part and, up In and down Out, a point about every pixel and a half of
 * a curve `wide` pixels across. Hold and Rest are level between their corners.
 */
export function breathPacerCurvePlaces(cycle: BreathPacerCycle, wide: number): number[] {
  const places: number[] = []
  for (const part of cycle.parts) {
    const moving = part.stage === STAGE_IN || part.stage === STAGE_OUT
    const pixels = (part.seconds / cycle.seconds) * wide
    const steps = moving ? clamp(Math.ceil(pixels / 1.5), 8, 96) : 1
    for (let i = 0; i < steps; i++)
      places.push((part.from + (part.seconds * i) / steps) / cycle.seconds)
  }
  places.push(1)
  return places
}

// --- The mark's place ------------------------------------------------------------

/** How long the device must say nothing sounds before the mark goes back to rest, in seconds. */
export const BREATH_PACER_REST_SEC = 0.25
/** The mark goes to the reading in one move at most this often, in seconds. */
export const BREATH_PACER_JUMP_SEC = 0.5
/** How far the mark may be from the reading, in cycles, before it goes there in one move. */
const FAR = 0.08
/** How much of the way to the reading the mark makes up on a frame. */
const CATCH_UP = 0.25

/** The mark for now: where it stands in the cycle, whether a breath is sounding, and what it remembers. */
export interface BreathPacerMark {
  place: number
  running: boolean
  /** How long the device has said nothing sounds, in seconds. */
  quiet: number
  /** How long ago the mark last went to the reading in one move, in seconds. */
  sinceJump: number
}

/** The mark put straight on a reading: 0 is a breath that is not sounding. */
export function breathPacerPut(reading: number): BreathPacerMark {
  const place = Number.isFinite(reading) ? clamp(reading, 0, 1) : 0
  return { place: place < 1 ? place : 0, running: place > 0, quiet: 0, sinceJump: Infinity }
}

/**
 * The mark a frame later. It goes on at the cycle's own `pace` (cycles a
 * second) and leans toward the device's reading, never back and never faster
 * than twice the pace, so it cannot go round more than once a second whatever
 * it is told. A reading far from it (a new breath begun at In) is taken in one
 * move, at most twice a second. When the device has said for a quarter of a
 * second that nothing sounds, the mark goes back to rest at the start of In.
 */
export function breathPacerFollow(
  mark: BreathPacerMark,
  reading: number,
  pace: number,
  dt: number,
): BreathPacerMark {
  if (!(dt > 0)) return breathPacerPut(reading)
  const read = breathPacerPut(reading).place
  const sinceJump = mark.sinceJump + dt
  const on = Number.isFinite(pace) && pace > 0 ? pace * dt : 0
  if (!(read > 0)) {
    if (!mark.running) return { place: 0, running: false, quiet: 0, sinceJump }
    const quiet = mark.quiet + dt
    if (quiet >= BREATH_PACER_REST_SEC) return { place: 0, running: false, quiet: 0, sinceJump: 0 }
    return { place: wrap(mark.place + on), running: true, quiet, sinceJump }
  }
  if (!mark.running) {
    // A breath has begun: the mark goes to it, unless it only just went to rest.
    if (sinceJump < BREATH_PACER_JUMP_SEC) return { place: 0, running: false, quiet: 0, sinceJump }
    return { place: read, running: true, quiet: 0, sinceJump: 0 }
  }
  const ahead = shortWay(read - (mark.place + on))
  if (Math.abs(ahead) > FAR && sinceJump >= BREATH_PACER_JUMP_SEC)
    return { place: read, running: true, quiet: 0, sinceJump: 0 }
  const step = clamp(on + CATCH_UP * ahead, 0, 2 * on)
  return { place: wrap(mark.place + step), running: true, quiet: 0, sinceJump }
}

// --- Where things stand -------------------------------------------------------

/** The slow down's place and the cycle's length there are taken from the device this often while it runs, in seconds. */
const TAKE_SEC = 0.5
/** The level is taken over this long. */
export const BREATH_PACER_LEVEL_SEC = 1
/** The level's bar moves only when the level has moved by this share of its scale (1.2 dB). */
const LEVEL_STEP = 0.02
/** The foot of the level's scale, dB under full scale. */
const LEVEL_FLOOR_DB = -60
/** The least room between two words in a row, in pixels. */
const WORD_GAP = 3

export interface BreathPacerLayout {
  /** The ends of everything across. */
  left: number
  right: number
  /** The line the cycle's length and the breaths a minute are written on. */
  header: number
  /** The slow down: its line is at `y`, the lengths at its ends are written on `row`. */
  slow: { y: number; row: number }
  /** One cycle across, from none of the sound at `base` to all of it at the top. */
  curve: Box
  base: number
  /** The line the parts are named on. */
  names: number
  /** Air, Tone and Marks: their words are written on `row`, their bars are `h` high from `y`. */
  mix: { row: number; y: number; h: number }
  /** The level over the last second. */
  foot: Box
}

/** Laid out from the size it is given. */
export function breathPacerLayout(view: Pick<DisplayView, 'width' | 'height'>): BreathPacerLayout {
  const { width, height } = view
  const left = 6
  const right = width - 6
  const top = 25
  const high = Math.max(12, height - 63)
  const base = top + high
  return {
    left,
    right,
    header: 10,
    slow: { y: 17.5, row: 20 },
    curve: { x: left, y: top, w: Math.max(12, right - left), h: high },
    base,
    names: base + 13,
    mix: { row: base + 24, y: base + 19, h: 3 },
    foot: { x: left, y: base + 30, w: Math.max(12, right - left), h: 4 },
  }
}

/** A word and where its left end stands. */
export interface BreathPacerWord {
  words: string
  x: number
  wide: number
}

/**
 * The names of the parts under the axis, each with its seconds as they are
 * now and under the middle of its part where there is room: a word that
 * would run into its neighbour or off the end is moved along. Where the
 * seconds do not all fit, the names stand alone. `across` is where a time in
 * the cycle as set stands; `wideOf` is how wide a word is drawn.
 */
export function breathPacerNames(
  cycle: BreathPacerCycle,
  stretch: number,
  lay: Pick<BreathPacerLayout, 'left' | 'right'>,
  across: (seconds: number) => number,
  wideOf: (words: string) => number,
): BreathPacerWord[] {
  const room = lay.right - lay.left
  const fits = (all: readonly string[]): boolean =>
    all.reduce((sum, words) => sum + wideOf(words), 0) + WORD_GAP * (all.length - 1) <= room
  const full = cycle.parts.map((part) => `${part.name} ${figure(part.seconds * stretch)}`)
  const said = fits(full) ? full : cycle.parts.map((part) => part.name)
  const placed = said.map((words, i): BreathPacerWord => {
    const part = cycle.parts[i]
    const wide = wideOf(words)
    return { words, wide, x: across(part.from + part.seconds / 2) - wide / 2 }
  })
  // From the left each word clears the one before it; from the right each clears the one after.
  let edge = lay.left
  for (const word of placed) {
    word.x = Math.max(word.x, edge)
    edge = word.x + word.wide + WORD_GAP
  }
  edge = lay.right
  for (let i = placed.length - 1; i >= 0; i--) {
    placed[i].x = Math.min(placed[i].x, edge - placed[i].wide)
    edge = placed[i].x - WORD_GAP
  }
  return placed
}

/** How many seconds lie between two ticks of the axis, so that they stand three pixels apart or more. */
export function breathPacerTickSeconds(seconds: number, wide: number): number {
  const each = wide / seconds
  return each >= 3 ? 1 : each * 5 >= 3 ? 5 : 10
}

// --- The display --------------------------------------------------------------

interface BreathPacerState {
  /** The four lengths as they stood when the mark was last put on the reading. */
  lengths: string
  mark: BreathPacerMark
  /** Slow to and Over as they stood when the slow down's readings were last taken, and when that was. */
  slowKnobs: string
  takenAt: number
  /** The slow down's place and how many times its set length the cycle is, as last taken. */
  slowing: number
  stretch: number
  /** The mean squares of the sound that came out in the last second, each with the time it stands for. */
  heard: { at: number; square: number; dt: number }[]
  /** The level the foot shows, as a share of its scale. */
  shown: number
}

const breathPacer = plateDisplay<BreathPacerState>({
  place: 'window',
  columns: 2,
  params: [
    'in',
    'hold',
    'out',
    'rest',
    'slowTo',
    'over',
    'air',
    'tone',
    'bright',
    'marks',
    'floor',
  ],
  live: { meters: true, signal: true, notes: true },
  info: 'One breath over time: the level rises through In, stays through Hold, falls through Out and sits at Floor through Rest, with a dot at its place now. The fainter line is how open the colour is. Above, the length of a cycle, how many a minute and any slow down. Below, Air, Tone, Marks and the level.',
  init: () => ({
    lengths: '',
    mark: breathPacerPut(0),
    slowKnobs: '',
    takenAt: 0,
    slowing: 0,
    stretch: 1,
    heard: [],
    shown: 0,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const lay = breathPacerLayout(frame)
    const { curve, base } = lay
    const cycle = breathPacerCycle(
      frame.value('in'),
      frame.value('hold'),
      frame.value('out'),
      frame.value('rest'),
    )
    const slowTo = frame.value('slowTo')
    const over = frame.value('over')
    const slows = over > 0 && slowTo > 1
    const floor = frame.value('floor')
    const bright = frame.value('bright')

    // The slow down: the device's readings, taken when one of its knobs moves
    // and otherwise twice a second, so nothing drawn from them moves more often.
    const slowKnobs = `${slowTo}|${over}`
    const since = frame.now - state.takenAt
    if (slowKnobs !== state.slowKnobs || frame.dt <= 0 || !(since >= 0) || since >= TAKE_SEC) {
      state.slowKnobs = slowKnobs
      state.takenAt = frame.now
      const live = frame.powered && slows
      const place = live && frame.hasMeter('slowing') ? frame.meter('slowing') : 0
      state.slowing = Number.isFinite(place) ? clamp(place, 0, 1) : 0
      const times = live && frame.hasMeter('stretch') ? frame.meter('stretch') : NaN
      state.stretch = Number.isFinite(times)
        ? clamp(times, 1, Math.max(1, slowTo))
        : breathPacerStretch(slowTo, over, state.slowing)
    }
    const stretch = slows ? state.stretch : 1
    /** The length of the whole cycle now, slow down included, in seconds (`cycle_seconds`). */
    const seconds = cycle.seconds * stretch

    // Where the breath stands: the device's reading, followed at the cycle's own pace.
    const lengths = cycle.parts.map((part) => `${part.stage}:${part.seconds}`).join('|')
    const reading = frame.powered && frame.hasMeter('place') ? frame.meter('place') : 0
    if (lengths !== state.lengths || frame.dt <= 0) state.mark = breathPacerPut(reading)
    else state.mark = breathPacerFollow(state.mark, reading, 1 / seconds, frame.dt)
    state.lengths = lengths
    const { mark } = state

    const across = (setSeconds: number): number => curve.x + (setSeconds / cycle.seconds) * curve.w
    const levelY = (breath: number): number => base - breathPacerLevel(floor, breath) * curve.h
    ctx.font = `8px ${frame.fontFamily}`
    const wideOf = (words: string): number => Math.ceil(ctx.measureText(words).width)

    // --- The cycle's length now, and how many go in a minute ---
    text(frame, breathPacerSecondsText(seconds), lay.left, lay.header)
    text(frame, breathPacerMinuteText(seconds), lay.right, lay.header, { align: 'right' })

    // --- The slow down: from the length as set to the length it grows to ---
    if (slows) {
      const from = breathPacerSecondsText(cycle.seconds)
      const to = breathPacerSecondsText(cycle.seconds * slowTo)
      const x0 = lay.left + wideOf(from) + WORD_GAP
      const x1 = Math.max(x0 + 8, lay.right - wideOf(to) - WORD_GAP)
      text(frame, from, lay.left, lay.slow.row, { alpha: INK.text })
      text(frame, to, lay.right, lay.slow.row, { align: 'right', alpha: INK.text })
      rule(ctx, x0, lay.slow.y, x1, lay.slow.y, { colour: colours.ink, alpha: INK.rule })
      dot(ctx, x0 + state.slowing * (x1 - x0), lay.slow.y, 2.5, colours.accent, {
        ring: colours.ink,
      })
    }

    // --- One cycle: the level, and how open the colour is ---
    const level: Point[] = []
    const open: Point[] = []
    for (const place of breathPacerCurvePlaces(cycle, curve.w)) {
      const breath = breathPacerAt(cycle, place)
      const x = curve.x + place * curve.w
      level.push([x, levelY(breath)])
      open.push([x, base - breathPacerOpen(bright, breath) * curve.h])
    }
    fillTo(ctx, level, base, colours.ink)
    rule(ctx, curve.x, base, curve.x + curve.w, base, { colour: colours.ink, alpha: INK.rule })
    // A tick for every second of the cycle as it is now (every five or ten where they would crowd).
    const every = breathPacerTickSeconds(seconds, curve.w)
    for (let at = every; at < seconds - 1e-6; at += every) {
      const x = curve.x + (at / seconds) * curve.w
      rule(ctx, x, base, x, base + 2, { colour: colours.ink, alpha: INK.rule })
    }
    // A longer one where each part begins, and at the end.
    for (const part of cycle.parts)
      rule(ctx, across(part.from), base, across(part.from), base + 4, { colour: colours.ink })
    rule(ctx, curve.x + curve.w, base, curve.x + curve.w, base + 4, { colour: colours.ink })
    trace(ctx, open, { colour: colours.ink, width: 1, alpha: INK.back })
    trace(ctx, level, { colour: colours.ink, width: 1.5 })
    // The two struck marks: at the start of In and at the start of Out.
    const marks = frame.value('marks')
    if (marks > 0) {
      const size = 1 + 1.5 * breathPacerPartShare(marks)
      for (const part of cycle.parts)
        if (part.stage === STAGE_IN || part.stage === STAGE_OUT)
          dot(ctx, across(part.from), base, size, colours.ink)
    }
    for (const word of breathPacerNames(cycle, stretch, lay, across, wideOf))
      text(frame, word.words, word.x, lay.names)

    // --- Now ---
    const nowX = curve.x + mark.place * curve.w
    const nowY = levelY(breathPacerAt(cycle, mark.place))
    if (mark.running) {
      rule(ctx, nowX, curve.y, nowX, base, { colour: colours.accent })
      dot(ctx, nowX, nowY, 3, colours.accent, { ring: colours.ink })
    } else {
      dot(ctx, nowX, nowY, 2.5, colours.plate, { ring: colours.ink })
    }

    // --- Air, Tone and Marks: how far up each stands, on a scale of 40 dB ---
    const parts: [string, number][] = [
      ['Air', frame.value('air')],
      ['Tone', frame.value('tone')],
      ['Marks', marks],
    ]
    const wordRoom = parts.reduce((sum, [name]) => sum + wideOf(name), 0)
    const barWide = Math.max(4, (lay.right - lay.left - wordRoom - 3 * 3 - 2 * 5) / 3)
    let x = lay.left
    for (const [name, knob] of parts) {
      text(frame, name, x, lay.mix.row, { alpha: INK.text })
      x += wideOf(name) + 3
      fillRect(ctx, { x, y: lay.mix.y, w: barWide, h: lay.mix.h }, colours.ink, INK.fill)
      fillRect(
        ctx,
        { x, y: lay.mix.y, w: barWide * breathPacerPartShare(knob), h: lay.mix.h },
        colours.ink,
      )
      x += barWide + 5
    }

    // --- The level that comes out, over the last second ---
    // Each frame's reading stands for the time since the frame before it, and
    // the mean is taken over the whole second, so time with nothing read counts
    // as silence.
    const rms = frame.powered && frame.signal ? frame.signal.output.rms : NaN
    if (!Number.isFinite(rms) || !(frame.dt >= 0) || frame.dt > BREATH_PACER_LEVEL_SEC) {
      state.heard = []
      state.shown = 0
    } else {
      if (frame.dt > 0) state.heard.push({ at: frame.now, square: rms * rms, dt: frame.dt })
      const from = frame.now - BREATH_PACER_LEVEL_SEC
      state.heard = state.heard.filter((one) => one.at > from && one.at <= frame.now)
      let sum = 0
      for (const one of state.heard) sum += one.square * Math.min(one.dt, one.at - from)
      const mean = sum / BREATH_PACER_LEVEL_SEC
      const db = mean > 1e-12 ? 10 * Math.log10(mean) : LEVEL_FLOOR_DB
      const share = clamp(1 - db / LEVEL_FLOOR_DB, 0, 1)
      // The bar moves when the level has moved by a step, and to its ends.
      const end = share <= 0 || share >= 1
      if (Math.abs(share - state.shown) > LEVEL_STEP || (end && share !== state.shown))
        state.shown = share
    }
    levelFoot(frame, lay.foot, state.shown)
  },
})

export const BREATH_PACER_FACES: Readonly<Record<string, PlateFace>> = {
  'breath-pacer': {
    display: breathPacer,
    face: ['in', 'hold', 'out', 'rest'],
    sections: [
      ['in', 'hold', 'out', 'rest'],
      ['slowTo', 'over'],
      ['air', 'tone', 'bright', 'marks', 'floor'],
      ['release', 'volume'],
    ],
  },
}
