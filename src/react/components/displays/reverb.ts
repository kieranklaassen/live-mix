// Displays of the reverbs that are rooms, plates and springs: how the tail
// dies away, and how long it takes. One picture for all of them: level
// against time from the moment a sound goes in, on a scale of decibels, so a
// decay is a slope and a longer decay a shallower one. At the left the first
// moments on a scale of their own (the dry sound, the gap of the pre-delay,
// the first reflections at their real times and levels), at the right the
// whole tail on a scale in seconds, with a second, fainter line for the top
// of the spectrum, which dies at its own rate. Every time and rate is worked
// out from the device's own loops and gains; the functions that do it are
// named after the code they were ported from.
//
// While sound runs the level coming out is drawn in the accent from the
// moment the last sound went in, so a struck note is seen to ring down the
// slope.

import { REVERB_DECAY_SECONDS } from '../../../core/devices/native/ConvolverReverb'
import { denormalizeParam } from '../../../core/params'
import {
  FLOOR_DB,
  History,
  INK,
  clamp,
  clipped,
  dbGrid,
  dbOfY,
  dot,
  fillTo,
  gainToDb,
  ground,
  handle,
  lerp,
  rule,
  text,
  trace,
  yOfDb,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateDisplay,
  type PlateFace,
} from '../plate-display'

// --- What the family shares ---------------------------------------------------

/** The levels a reverb display spans: the sound going in at the top, 60 dB under it at the foot. */
const TOP_DB = 0
const FOOT_DB = -60
/** Where the two lines of a tail are worked out: the body of a sound, and the top of its spectrum. */
export const BODY_HZ = 500
export const TOP_HZ = 8000
/** A reverb mixed lower than this is drawn at this level, so its tail still has a length to show. */
const LOWEST_WET_DB = -36
/** The height of the scale of seconds under the boxes. */
const SCALE_HEIGHT = 8
/** How much of the past the level coming out is kept for, and in how many steps. */
const PAST_SEC = 30
const PAST_SLOTS = 900
/** Under this nothing is going in. */
const SILENT_DB = -66

const TWO_PI = Math.PI * 2

/**
 * What a one-pole low-pass `y = (1 − a)·x + a·y1` does to a frequency, in dB:
 * the damping filter of every loop here (`OnePoleLowpass` in `dsp_util.h`,
 * `kit::OnePole::lowpass`, the comb of `freeverb.h`).
 */
export function onePoleLossDb(a: number, hz: number, rate: number): number {
  const w = (TWO_PI * hz) / rate
  const power = ((1 - a) * (1 - a)) / (1 + a * a - 2 * a * Math.cos(w))
  return power > 1e-12 ? 10 * Math.log10(power) : FLOOR_DB
}

/**
 * How long a loop takes to fall 60 dB: `seconds` once round it, `gainDb`
 * (under 0) each time round. A loop that loses nothing never falls.
 */
export function loopRt60(seconds: number, gainDb: number): number {
  return gainDb < 0 ? (-60 * seconds) / gainDb : Infinity
}

/** The setting of a parameter at which `position` (which only rises or only falls with it) reaches `target`. */
function solveParam(
  view: DisplayView,
  name: string,
  position: (value: number) => number,
  target: number,
): number {
  const spec = view.spec(name)
  if (!spec) return view.value(name)
  const rising = position(spec.max) >= position(spec.min)
  let low = 0
  let high = 1
  for (let i = 0; i < 26; i++) {
    const middle = (low + high) / 2
    if (position(denormalizeParam(spec, middle)) < target === rising) low = middle
    else high = middle
  }
  return denormalizeParam(spec, (low + high) / 2)
}

/** The same view with one parameter somewhere else: where a handle would stand at another setting. */
function withParam(view: DisplayView, name: string, value: number): DisplayView {
  return {
    width: view.width,
    height: view.height,
    spec: (param) => view.spec(param),
    value: (param) => (param === name ? value : view.value(param)),
    at: (param) => {
      if (param !== name) return view.at(param)
      const spec = view.spec(param)
      if (!spec) return 0
      const position =
        spec.taper === 'log' && spec.min > 0
          ? Math.log(clamp(value, spec.min, spec.max) / spec.min) / Math.log(spec.max / spec.min)
          : (clamp(value, spec.min, spec.max) - spec.min) / (spec.max - spec.min)
      return Number.isFinite(position) ? position : 0
    },
  }
}

/** The rate the device runs at; a view without a frame (a handle being laid out) has the usual one. */
const rateOf = (view: DisplayView): number => (view as Partial<DisplayFrame>).sampleRate ?? 48000

const defaultOf = (view: DisplayView, name: string): number =>
  view.spec(name)?.default ?? view.value(name)

const yOf = (db: number, box: Box): number =>
  yOfDb(clamp(db, FOOT_DB, TOP_DB), box, TOP_DB, FOOT_DB)

/** Seconds as they are said on a scale: "0.2s", "1s", "20s". */
export function secondsText(seconds: number): string {
  if (!Number.isFinite(seconds)) return '∞'
  const shown =
    seconds >= 100
      ? String(Math.round(seconds))
      : seconds >= 10
        ? seconds.toFixed(0)
        : seconds >= 1
          ? seconds.toFixed(1).replace(/\.0$/, '')
          : seconds.toFixed(2).replace(/0$/, '')
  return `${shown}s`
}

/** The step of a scale of seconds `seconds` long over `width` pixels: 1, 2 or 5 of a power of ten, no two nearer than `apart`. */
function scaleStep(seconds: number, width: number, apart: number): number {
  const least = (seconds * apart) / Math.max(1, width)
  const decade = Math.pow(10, Math.floor(Math.log10(least)))
  for (const m of [1, 2, 5, 10]) if (m * decade >= least) return m * decade
  return 10 * decade
}

/**
 * A scale of seconds under a box that spans `seconds` from `box.x`: a line up
 * the box at every step, and the time in words under each when `words` says
 * so, or only the box's whole length at its right end.
 */
function timeScale(
  frame: DisplayFrame,
  box: Box,
  seconds: number,
  wordsY: number,
  each: boolean,
): void {
  const { ctx, colours } = frame
  if (!(seconds > 0) || !Number.isFinite(seconds)) return
  const step = scaleStep(seconds, box.w, each ? 30 : 9)
  for (let n = 1; n * step < seconds * 0.999; n++) {
    const x = box.x + ((n * step) / seconds) * box.w
    rule(ctx, x, box.y, x, box.y + box.h, { colour: colours.ink, alpha: INK.grid })
    if (each && x < box.x + box.w - 9) {
      text(frame, secondsText(n * step), x, wordsY, { align: 'center', alpha: INK.back })
    }
  }
  if (!each) {
    text(frame, secondsText(seconds), box.x + box.w, wordsY, { align: 'right', alpha: INK.back })
  }
}

const MOST_MARKS = 320

/** Upright marks gathered for one stroke: a reflection at its time, from the foot up to its level. */
class Marks {
  readonly at = new Float32Array(2 * MOST_MARKS)
  count = 0

  clear(): void {
    this.count = 0
  }

  /** `seconds` after the sound went in, `db` against the level the reverb starts at. */
  add(seconds: number, db: number): void {
    if (this.count >= MOST_MARKS || !Number.isFinite(seconds) || !Number.isFinite(db)) return
    this.at[2 * this.count] = seconds
    this.at[2 * this.count + 1] = db
    this.count += 1
  }
}

/** The columns marks can stand in, for counting how many are taken. */
const MARK_COLUMNS = new Uint8Array(1024)

/**
 * Every mark in `marks` as one path and one stroke, so marks that fall
 * together do not darken each other. They stand two pixels apart at the
 * nearest, so echoes too dense to tell apart read as an even hatch, not a
 * block; the closer they stand the lighter they are drawn.
 */
function strokeMarks(
  frame: DisplayFrame,
  marks: Marks,
  box: Box,
  seconds: number,
  levelDb: number,
  alpha: number,
): void {
  const { ctx } = frame
  const foot = box.y + box.h
  const columns = Math.min(MARK_COLUMNS.length, Math.floor(box.w / 2) + 1)
  MARK_COLUMNS.fill(0, 0, columns)
  let first = columns
  let last = -1
  let taken = 0
  ctx.beginPath()
  for (let i = 0; i < marks.count; i++) {
    const t = marks.at[2 * i]
    if (t < 0 || t > seconds) continue
    const column = Math.round(((t / seconds) * box.w) / 2)
    const y = yOf(levelDb + marks.at[2 * i + 1], box)
    if (column >= columns || y >= foot - 0.5) continue
    const x = Math.floor(box.x) + 2 * column + 0.5
    ctx.moveTo(x, foot)
    ctx.lineTo(x, y)
    if (MARK_COLUMNS[column] === 0) taken += 1
    MARK_COLUMNS[column] = 1
    if (column < first) first = column
    if (column > last) last = column
  }
  if (taken === 0) return
  const crowded = taken / (last - first + 1)
  ctx.globalAlpha = alpha * lerp(1, 0.5, clamp((crowded - 0.25) / 0.5, 0, 1))
  ctx.strokeStyle = frame.colours.ink
  ctx.lineWidth = 1
  ctx.lineCap = 'butt'
  ctx.setLineDash([])
  ctx.stroke()
  ctx.globalAlpha = 1
}

/**
 * A decay as a straight line across a box that spans `seconds`: from `level`
 * at `from` seconds, falling 60 dB in `rt60`, as far as the foot or the
 * box's right edge. A tail that is held runs level.
 */
function decayLine(box: Box, seconds: number, from: number, level: number, rt60: number): Point[] {
  const x0 = box.x + (from / seconds) * box.w
  const right = box.x + box.w
  const foot = box.y + box.h
  const y0 = yOf(level, box)
  if (x0 >= right) return []
  if (!Number.isFinite(rt60)) {
    return [
      [x0, y0],
      [right, y0],
    ]
  }
  const reach = from + (rt60 * (level - FOOT_DB)) / 60
  if (reach <= seconds) {
    return [
      [x0, y0],
      [box.x + (reach / seconds) * box.w, foot],
    ]
  }
  return [
    [x0, y0],
    [right, yOf(level - (60 * (seconds - from)) / rt60, box)],
  ]
}

/** What a display keeps of the sound: the level coming out, and when the last sound went in. */
interface Ringing {
  out: History
  /** On the frame's clock; NaN while nothing has gone in. */
  struck: number
  /** The level of that sound going in, dB. */
  struckDb: number
  /** The level going in on the frame before. */
  lastDb: number
  /** Seconds the level coming out has been under the foot of the display. */
  quiet: number
}

const ringing = (): Ringing => ({
  out: new History(PAST_SEC, PAST_SLOTS, FLOOR_DB, 'max'),
  struck: NaN,
  struckDb: FLOOR_DB,
  lastDb: FLOOR_DB,
  quiet: 0,
})

/**
 * Follow the sound for one frame. A sound "goes in" when the level going in
 * jumps, and is louder than what the tail of the sound before has fallen to
 * by now: from then on the level coming out is drawn against the slope.
 * `throughDb` is what the device does to the level at once (the louder of
 * its dry and its wet side), for a plate that was not told what feeds it.
 */
function listen(frame: DisplayFrame, state: Ringing, rt60: number, throughDb: number): void {
  const signal = frame.signal
  // Switched off the device rings nothing down: the picture is what it would do.
  if (!signal || !frame.powered) {
    state.struck = NaN
    state.lastDb = FLOOR_DB
    return
  }
  const out = gainToDb(signal.output.rms)
  const going = signal.input ? gainToDb(signal.input.rms) : out - throughDb
  state.out.push(frame.now, out)
  const since = frame.now - state.struck
  const left = Number.isFinite(since)
    ? state.struckDb - (Number.isFinite(rt60) && rt60 > 0 ? (60 * since) / rt60 : 0)
    : FLOOR_DB
  if (going > SILENT_DB && going > state.lastDb + 3 && going > left + 3) {
    state.struck = frame.now
    state.struckDb = going
    state.quiet = 0
  } else if (since < 0.12 && going > state.struckDb) {
    // Still the attack of the same sound.
    state.struckDb = going
  }
  state.lastDb = going
  if (Number.isFinite(state.struck)) {
    state.quiet = out - state.struckDb < FOOT_DB ? state.quiet + frame.dt : 0
    if (state.quiet > 1.5) state.struck = NaN
  }
}

/**
 * The level coming out since the last sound went in, across a box that spans
 * `seconds` from `zeroX`: a fill and a line in the accent under the slope,
 * and a dot where the sound is now.
 */
function drawRinging(
  frame: DisplayFrame,
  state: Ringing,
  box: Box,
  zeroX: number,
  seconds: number,
): void {
  if (!frame.signal || !frame.powered || !Number.isFinite(state.struck)) return
  const { ctx, colours } = frame
  const slot = PAST_SEC / PAST_SLOTS
  const steps = Math.min(
    PAST_SLOTS - 1,
    Math.floor(frame.now / slot) - Math.floor(state.struck / slot),
  )
  if (steps < 0) return
  const right = box.x + box.w
  const perSecond = (right - zeroX) / seconds
  const points: Point[] = []
  let column = -Infinity
  let highest = FOOT_DB
  for (let back = steps; back >= 0; back--) {
    const x = Math.min(right, zeroX + (steps - back) * slot * perSecond)
    const level = state.out.at(back) - state.struckDb
    // One point a pixel: the highest level that fell in it.
    if (x - column < 1 && back > 0) {
      if (level > highest) highest = level
      continue
    }
    points.push([x, yOf(Math.max(level, highest), box)])
    column = x
    highest = FOOT_DB
    if (x >= right) break
  }
  if (points.length === 0) return
  const foot = box.y + box.h
  clipped(ctx, box, () => {
    fillTo(ctx, points, foot, colours.accent, 0.3)
    trace(ctx, points, { colour: colours.accent, width: 1.25 })
  })
  const [x, y] = points[points.length - 1]
  if (y < foot - 0.5) dot(ctx, x, y, 2.5, colours.accent, { ring: colours.ink })
}

/**
 * A modulator's mark on a tail: a hairline that sways about the line of the
 * level at the modulator's own rate, read along the scale of seconds. It
 * moves with the clock, as the modulators do: they run free, and where in
 * its cycle one is says nothing. `sway` is in pixels; the device moves
 * pitch, not level, so its size is a notation and only its rate is to scale.
 */
function shimmer(
  frame: DisplayFrame,
  box: Box,
  line: readonly Point[],
  seconds: number,
  hz: number,
  sway: number,
): void {
  if (line.length < 2 || sway <= 0 || hz <= 0) return
  const x0 = line[0][0]
  const x1 = line[line.length - 1][0]
  const perCycle = box.w / (seconds * hz)
  // Finer than this the wave is a smear.
  if (perCycle < 6 || x1 - x0 < 4) return
  const moving = frame.signal !== null && frame.powered ? frame.now : 0
  const points: Point[] = []
  let at = 0
  for (let x = x0; x <= x1; x += 2) {
    while (at < line.length - 2 && line[at + 1][0] < x) at += 1
    const [ax, ay] = line[at]
    const [bx, by] = line[at + 1]
    const y = bx > ax ? lerp(ay, by, clamp((x - ax) / (bx - ax), 0, 1)) : by
    const t = ((x - box.x) / box.w) * seconds
    points.push([x, y - 2 + sway * Math.sin(TWO_PI * hz * (t + moving))])
  }
  clipped(frame.ctx, box, () =>
    trace(frame.ctx, points, { colour: frame.colours.ink, width: 1, alpha: INK.back }),
  )
}

// --- Rooms: a tail that dies away ---------------------------------------------

/** What a reverb answers a sound with, at the present settings. */
interface Answer {
  /** The dry sound and the start of the reverb, in dB under the sound going in. */
  dry: number
  wet: number
  /** The pre-delay, seconds. */
  gap: number
  /** Seconds from the sound going in to the reverb's first sound: the gap and what the device adds to it. */
  onset: number
  /** Seconds to fall 60 dB in the body of the sound; never, while the tail is held. */
  body: number
  /** The same at the top of the spectrum. */
  top: number
  /** The same low down, where a device sets that apart; NaN where it does not. */
  low: number
  /** What the body falls at once a hold is let go: the scale is set by it. `body` where nothing holds. */
  release: number
}

interface RoomState {
  ringing: Ringing
  marks: Marks
}

/** What one device brings to the family's picture. */
interface Room {
  params: readonly string[]
  info: string
  /** Seconds the box of the first moments spans. */
  first: number
  /** The parameters the handles set: the end of the tail, its start (across and up), the line of the highs. */
  decay: string
  mix: string
  predelay?: string
  damping?: string
  /** The level the reverb starts at for a setting of Mix, dB. */
  wetOf(mix: number): number
  answer(view: DisplayView, rate: number): Answer
  /** The first reflections, as marks. */
  reflections?(view: DisplayView, rate: number, answer: Answer, marks: Marks): void
  /** What is the device's own in the first moments, where marks do not say it. */
  drawFirst?(frame: DisplayFrame, box: Box, seconds: number, answer: Answer, level: number): void
  /** What is the device's own on the tail; nothing right of `wordsX`, where the time is written. */
  drawTail?(
    frame: DisplayFrame,
    box: Box,
    seconds: number,
    answer: Answer,
    level: number,
    wordsX: number,
  ): void
  /** The rate of what modulates the tail, Hz; left out where nothing does. */
  swayHz?: number
}

interface RoomBoxes {
  first: Box
  tail: Box
  /** The baseline of the scale's words. */
  wordsY: number
}

/** The first moments at the left, the whole tail at the right, a scale of seconds under both. */
function roomBoxes(view: Pick<DisplayView, 'width' | 'height'>): RoomBoxes {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 - SCALE_HEIGHT }
  const first = { ...all, w: Math.round(all.w * 0.3) }
  return {
    first,
    tail: { ...all, x: first.x + first.w + 6, w: all.w - first.w - 6 },
    wordsY: view.height - 3.5,
  }
}

/**
 * How far across its box a tail ends for a decay knob at `at`: a short tail
 * ends early and steep, a long one late and shallow. The knob alone places
 * the end, and the scale of seconds stretches to make it true, so the end
 * can be dragged without the scale running away under the hand.
 */
const endAt = (at: number): number => lerp(0.3, 0.94, clamp(at, 0, 1))

/** The seconds the tail's box spans. */
function tailSeconds(room: Room, view: DisplayView, answer: Answer): number {
  return Math.max(0.02, answer.onset + answer.release) / endAt(view.at(room.decay))
}

const shownWet = (answer: Answer): number => Math.max(answer.wet, LOWEST_WET_DB)

/** Where the body of the tail meets the foot of its box. */
function tailEndX(room: Room, view: DisplayView, rate: number): number {
  const answer = room.answer(view, rate)
  const { tail } = roomBoxes(view)
  const reach = answer.onset + (answer.release * (shownWet(answer) - FOOT_DB)) / 60
  return tail.x + (reach / tailSeconds(room, view, answer)) * tail.w
}

/** Where the handle of the highs stands: half way down their line. */
function highsX(room: Room, view: DisplayView, rate: number): number {
  const answer = room.answer(view, rate)
  const { tail } = roomBoxes(view)
  const top = Number.isFinite(answer.top) ? answer.top : answer.release
  const reach = answer.onset + (top * (shownWet(answer) - FOOT_DB)) / 120
  return tail.x + clamp(reach / tailSeconds(room, view, answer), 0, 1) * tail.w
}

function roomHandles(room: Room, view: DisplayView): DisplayHandle[] {
  const rate = rateOf(view)
  const answer = room.answer(view, rate)
  const { first, tail } = roomBoxes(view)
  const level = shownWet(answer)
  const foot = tail.y + tail.h
  const lowestY = yOf(LOWEST_WET_DB, first)
  const { mix, predelay, damping, decay } = room
  const mixAt = (y: number): number => {
    // At the lowest level drawn the handle stands for every mix under it.
    if (y >= lowestY - 0.25) {
      return answer.wet <= LOWEST_WET_DB ? view.value(mix) : (view.spec(mix)?.min ?? 0)
    }
    return solveParam(view, mix, (value) => room.wetOf(value), dbOfY(y, first, TOP_DB, FOOT_DB))
  }
  const handles: DisplayHandle[] = [
    {
      key: 'start',
      name: predelay ? 'Pre-delay and mix' : 'Mix',
      x: first.x + clamp(answer.onset / room.first, 0, 1) * first.w,
      y: yOf(level, first),
      drag: (x, y) => {
        const set: Record<string, number> = { [mix]: mixAt(y) }
        if (predelay) {
          const spec = view.spec(predelay)
          const seconds = ((x - first.x) / first.w) * room.first - (answer.onset - answer.gap)
          set[predelay] = clamp(seconds * 1000, spec?.min ?? 0, spec?.max ?? 250)
        }
        return set
      },
      reset: () => ({
        [mix]: defaultOf(view, mix),
        ...(predelay ? { [predelay]: defaultOf(view, predelay) } : {}),
      }),
    },
    {
      key: 'decay',
      name: 'Decay',
      x: tailEndX(room, view, rate),
      y: foot,
      drag: (x) => ({
        [decay]: solveParam(
          view,
          decay,
          (value) => tailEndX(room, withParam(view, decay, value), rate),
          x,
        ),
      }),
      reset: () => ({ [decay]: defaultOf(view, decay) }),
    },
  ]
  if (damping) {
    handles.push({
      key: 'damping',
      name: 'Damping',
      x: highsX(room, view, rate),
      y: (yOf(level, tail) + foot) / 2,
      drag: (x) => ({
        [damping]: solveParam(
          view,
          damping,
          (value) => highsX(room, withParam(view, damping, value), rate),
          x,
        ),
      }),
      reset: () => ({ [damping]: defaultOf(view, damping) }),
    })
  }
  return handles
}

/** The dry sound: an upright line at the moment it goes in, as high as it comes out. */
function dryMark(frame: DisplayFrame, box: Box, dryDb: number): void {
  if (dryDb <= FOOT_DB) return
  const x = box.x + 1
  rule(frame.ctx, x, box.y + box.h, x, yOf(dryDb, box), {
    colour: frame.colours.ink,
    width: 2,
    alpha: INK.back,
  })
}

/** A reverb with a tail that dies away, drawn the family's way. */
function room(config: Room): PlateDisplay {
  return plateDisplay<RoomState>({
    place: 'strip',
    params: config.params,
    live: { signal: true },
    info: config.info,
    init: () => ({ ringing: ringing(), marks: new Marks() }),
    draw(frame) {
      const { ctx, colours, state } = frame
      ground(frame)
      const answer = config.answer(frame, frame.sampleRate)
      const { first, tail, wordsY } = roomBoxes(frame)
      const level = shownWet(answer)
      const seconds = tailSeconds(config, frame, answer)
      const held = !Number.isFinite(answer.body)
      const foot = tail.y + tail.h
      listen(frame, state.ringing, answer.body, Math.max(answer.dry, answer.wet))

      dbGrid(frame, first, TOP_DB, FOOT_DB, 20)
      dbGrid(frame, tail, TOP_DB, FOOT_DB, 20)
      timeScale(frame, first, config.first, wordsY, false)
      timeScale(frame, tail, seconds, wordsY, true)
      for (const box of [first, tail]) {
        rule(ctx, box.x, foot, box.x + box.w, foot, { colour: colours.ink, alpha: INK.rule })
      }

      // The first moments: the gap, the first reflections, the tail setting off.
      clipped(ctx, first, () => {
        const body = decayLine(first, config.first, answer.onset, level, answer.body)
        fillTo(ctx, body, foot, colours.ink, INK.fill)
        if (Number.isFinite(answer.top)) {
          trace(ctx, decayLine(first, config.first, answer.onset, level, answer.top), {
            colour: colours.ink,
            width: 1,
            alpha: INK.back,
          })
        }
        if (config.reflections) {
          state.marks.clear()
          config.reflections(frame, frame.sampleRate, answer, state.marks)
          strokeMarks(frame, state.marks, first, config.first, level, INK.text)
        }
        config.drawFirst?.(frame, first, config.first, answer, level)
        trace(ctx, body, { colour: colours.ink })
      })
      dryMark(frame, first, answer.dry)

      // The whole tail.
      const words =
        frame.hot === 'damping'
          ? secondsText(answer.top)
          : frame.hot === 'start' && config.predelay
            ? `${Math.round(answer.gap * 1000)}ms`
            : secondsText(answer.body)
      const wordsX = tail.x + tail.w - 2 - words.length * 5
      const body = decayLine(tail, seconds, answer.onset, level, answer.body)
      clipped(ctx, tail, () => {
        fillTo(ctx, body, foot, colours.ink, INK.fill)
        if (held) {
          // What it falls at once the hold is let go.
          trace(ctx, decayLine(tail, seconds, answer.onset, level, answer.release), {
            colour: colours.ink,
            width: 1,
            alpha: INK.back,
            dash: [2, 2],
          })
        }
        if (Number.isFinite(answer.low)) {
          trace(ctx, decayLine(tail, seconds, answer.onset, level, answer.low), {
            colour: colours.ink,
            width: 1,
            alpha: INK.back,
            dash: [3, 2],
          })
        }
        if (Number.isFinite(answer.top)) {
          trace(ctx, decayLine(tail, seconds, answer.onset, level, answer.top), {
            colour: colours.ink,
            width: 1,
            alpha: INK.back,
          })
        }
        config.drawTail?.(frame, tail, seconds, answer, level, wordsX)
      })
      drawRinging(frame, state.ringing, tail, tail.x, seconds)
      clipped(ctx, tail, () => trace(ctx, body, { colour: colours.ink }))
      if (config.swayHz && !held) shimmer(frame, tail, body, seconds, config.swayHz, 1)
      dryMark(frame, tail, answer.dry)

      for (const point of roomHandles(config, frame)) {
        handle(frame, point.x, point.y, { hot: frame.hot === point.key })
      }
      // The one figure a reverb is set by: how long the tail takes to fall 60 dB.
      // Under the line where a held tail runs level through its place.
      const lineY = yOf(level, tail)
      text(
        frame,
        words,
        tail.x + tail.w - 1,
        held && lineY < tail.y + 11 ? lineY + 11 : tail.y + 8,
        {
          align: 'right',
          size: 9,
        },
      )
    },
    handles: (view) => roomHandles(config, view),
  })
}

// --- Plate Reverb -------------------------------------------------------------

/** The tank of `plate_reverb.cpp`: its delays in samples at its reference rate of 29761 Hz, one half and the other. */
const PLATE_RATE = 29761
const PLATE_HALVES = [
  { diffuser: 672, first: 4453, second: 1800, last: 3720 },
  { diffuser: 908, first: 4217, second: 2656, last: 3163 },
] as const
/** Once round the figure of eight: both halves, an allpass counted at its length. */
const PLATE_LOOP_SEC =
  PLATE_HALVES.reduce((sum, h) => sum + h.diffuser + h.first + h.second + h.last, 0) / PLATE_RATE

/**
 * How long the plate takes to fall 60 dB at a frequency. `PlateReverb::process`
 * multiplies by Decay twice in each half of the tank and damps once, so a
 * trip round both halves is Decay⁴ and the damping filter twice.
 */
export function plateRt60(decay: number, damping: number, hz: number, rate: number): number {
  const kept = clamp(decay, 0, 0.9999)
  const a = clamp(damping, 0, 0.9999)
  return loopRt60(PLATE_LOOP_SEC, 80 * Math.log10(kept) + 2 * onePoleLossDb(a, hz, rate))
}

/**
 * The plate's first trip, from the output taps of `plate_reverb.cpp` (the
 * paper's table 2): when each tap first sounds after the input reaches the
 * tank, its level against the first, and how often it has been through
 * Decay by then. A tap on a half's first delay hears the input at once; a
 * tap further round hears it after that delay, through Decay, and through
 * the second allpass (half straight through, three quarters after its
 * length). Every arrival comes again after the first allpass's length.
 */
const PLATE_TAPS: readonly (readonly [samples: number, db: number, trips: number])[] = (() => {
  // Output left, then right: [half, where, offset].
  const taps: readonly (readonly [0 | 1, 'first' | 'second' | 'last', number])[] = [
    [1, 'first', 266],
    [1, 'first', 2974],
    [1, 'second', 1913],
    [1, 'last', 1996],
    [0, 'first', 1990],
    [0, 'second', 187],
    [0, 'last', 1066],
    [0, 'first', 353],
    [0, 'first', 3627],
    [0, 'second', 1228],
    [0, 'last', 2673],
    [1, 'first', 2111],
    [1, 'second', 335],
    [1, 'last', 121],
  ]
  // The first allpass (gain 0.7) passes 0.7 at once and 1 − 0.7² after its length.
  const again = 20 * Math.log10(0.51 / 0.7)
  const out: [number, number, number][] = []
  for (const [half, where, offset] of taps) {
    const h = PLATE_HALVES[half]
    const arrivals: [number, number, number][] =
      where === 'first'
        ? [[offset, 0, 0]]
        : where === 'second'
          ? [[h.first + offset, 0, 1]]
          : [
              [h.first + offset, 20 * Math.log10(0.5), 1],
              [h.first + h.second + offset, 20 * Math.log10(0.75), 1],
            ]
    for (const [samples, db, trips] of arrivals) {
      out.push([samples, db, trips], [samples + h.diffuser, db + again, trips])
    }
  }
  return out
})()
/** The first tap of all: the plate's own part of the gap. */
const PLATE_FIRST_SEC = Math.min(...PLATE_TAPS.map(([samples]) => samples)) / PLATE_RATE

const plateReverb = room({
  params: ['mix', 'decay', 'damping', 'predelayMs'],
  info: 'Level against time from the moment a sound goes in. Left, the first moments: the dry sound, the gap and the first taps of the plate. Right, the whole tail on a scale of seconds, with a fainter line for the highs. Sound rings down it in the second colour.',
  first: 0.4,
  decay: 'decay',
  mix: 'mix',
  predelay: 'predelayMs',
  damping: 'damping',
  // The two allpasses in the tank sway at 1 and 0.95 Hz.
  swayHz: 1,
  // `PlateReverbDevice::process`: dry·(1 − mix) + wet·mix.
  wetOf: (mix) => gainToDb(mix),
  answer(view, rate) {
    const mix = view.value('mix')
    const gap = view.value('predelayMs') / 1000
    const body = plateRt60(view.value('decay'), view.value('damping'), BODY_HZ, rate)
    return {
      dry: gainToDb(1 - mix),
      wet: gainToDb(mix),
      gap,
      onset: gap + PLATE_FIRST_SEC,
      body,
      top: plateRt60(view.value('decay'), view.value('damping'), TOP_HZ, rate),
      low: NaN,
      release: body,
    }
  },
  reflections(view, rate, answer, marks) {
    const trip =
      20 * Math.log10(Math.max(1e-6, clamp(view.value('decay'), 0, 0.9999))) +
      onePoleLossDb(clamp(view.value('damping'), 0, 0.9999), BODY_HZ, rate)
    for (const [samples, db, trips] of PLATE_TAPS) {
      marks.add(answer.gap + samples / PLATE_RATE, db + trips * trip)
    }
  },
})

// --- FDN Reverb ---------------------------------------------------------------

/** The eight lines of `fdn_reverb.h`, in samples at 44.1 kHz. */
const FDN_LINES = [4799, 5399, 5801, 6199, 6599, 6997, 7393, 7789] as const
/** One line's length in seconds at Size 1, cut to whole samples as `FdnReverb::init` cuts it. */
const fdnLine = (line: number, rate: number): number =>
  Math.floor((FDN_LINES[line] * rate) / 44100) / rate

/**
 * How long the network takes to fall 60 dB at a frequency. A trip is the
 * mean line times Size; on it `FdnReverb::process` multiplies by
 * `feedback_gain_for` (the gain that makes Decay the RT60, held under 0.98),
 * damps with a one-pole whose cutoff Damping sweeps from 20 kHz to 1 kHz,
 * and blocks DC with R = 0.995.
 */
export function fdnRt60(
  decay: number,
  damping: number,
  size: number,
  hz: number,
  rate: number,
): number {
  let mean = 0
  for (let i = 0; i < FDN_LINES.length; i++) mean += fdnLine(i, rate) / FDN_LINES.length
  const trip = mean * clamp(size, 0.5, 2)
  const gain = Math.min(0.98, Math.pow(10, (-3 * trip) / clamp(decay, 0.1, 20)))
  const cutoff = 20000 * Math.pow(1000 / 20000, clamp(damping, 0, 1))
  const w = (TWO_PI * hz) / rate
  const r = 0.995
  const blocker = 10 * Math.log10((2 - 2 * Math.cos(w)) / (1 + r * r - 2 * r * Math.cos(w)))
  return loopRt60(
    trip,
    20 * Math.log10(gain) + onePoleLossDb(Math.exp((-TWO_PI * cutoff) / rate), hz, rate) + blocker,
  )
}

/** `FdnReverb::breath_law`: how much of the input the breath lets in at a place in its cycle. */
export function fdnBreath(phase: number, depth: number): number {
  const breathMod = Math.sin(phase * TWO_PI) * 0.5 + 0.5
  return 1 - depth * (1 - breathMod)
}

const fdnReverb = room({
  params: ['mix', 'decay', 'damping', 'predelayMs', 'size', 'breathRate', 'breathDepth'],
  info: 'Level against time from the moment a sound goes in. Left, the first moments: the gap, then the eight lines answering, wider apart as Size grows. Right, the whole tail in seconds, a fainter line for the highs, and dotted the breath that lets sound in.',
  first: 0.6,
  decay: 'decay',
  mix: 'mix',
  predelay: 'predelayMs',
  damping: 'damping',
  // The lines sway at 0.3 to 0.79 Hz; this is the middle of them.
  swayHz: 0.545,
  // `FdnReverbDevice::process`: dry·cos(mix·π/2) + wet·sin(mix·π/2).
  wetOf: (mix) => gainToDb(Math.sin((clamp(mix, 0, 1) * Math.PI) / 2)),
  answer(view, rate) {
    const mix = clamp(view.value('mix'), 0, 1)
    const gap = view.value('predelayMs') / 1000
    const size = clamp(view.value('size'), 0.5, 2)
    const body = fdnRt60(view.value('decay'), view.value('damping'), size, BODY_HZ, rate)
    return {
      dry: gainToDb(Math.cos((mix * Math.PI) / 2)),
      wet: gainToDb(Math.sin((mix * Math.PI) / 2)),
      gap,
      // Nothing comes out before the shortest line has been gone through once.
      onset: gap + fdnLine(0, rate) * size,
      body,
      top: fdnRt60(view.value('decay'), view.value('damping'), size, TOP_HZ, rate),
      low: NaN,
      release: body,
    }
  },
  reflections(view, rate, answer, marks) {
    const size = clamp(view.value('size'), 0.5, 2)
    // Once through a line, and what the Hadamard matrix hands on to every
    // line for a second trip: an eighth of the power each, less the loop's loss.
    const again = (-60 * fdnLine(3, rate) * size) / answer.body - 10 * Math.log10(8)
    for (let i = 0; i < FDN_LINES.length; i++) {
      marks.add(answer.gap + fdnLine(i, rate) * size, 0)
      for (let j = i; j < FDN_LINES.length; j++) {
        // Two ways round to the same moment when the lines differ.
        marks.add(
          answer.gap + (fdnLine(i, rate) + fdnLine(j, rate)) * size,
          again + (i === j ? 0 : 3),
        )
      }
    }
  },
  drawTail(frame, box, seconds, _answer, level, wordsX) {
    const depth = clamp(frame.value('breathDepth'), 0, 1)
    if (depth < 0.005) return
    // The breath over the same seconds: a sound that goes in at a moment
    // starts its tail this far down. Drawn open at the left; the device's
    // breath runs free and where it is now is not known here.
    const hz = frame.value('breathRate')
    const points: Point[] = []
    for (let x = box.x; x <= wordsX - 3; x += 2) {
      const t = ((x - box.x) / box.w) * seconds
      points.push([x, yOf(level + gainToDb(fdnBreath(t * hz + 0.25, depth)), box)])
    }
    trace(frame.ctx, points, {
      colour: frame.colours.ink,
      width: 1,
      alpha: INK.text,
      dash: [1, 2],
    })
  },
})

// --- Hall Reverb --------------------------------------------------------------

/** The eight loops of `re.zita_rev1_stereo` and the allpass in front of each, in seconds (`hall-reverb.dsp`). */
const HALL_LOOPS = [
  0.153129, 0.210389, 0.127837, 0.256891, 0.174713, 0.192303, 0.125, 0.219991,
] as const
const HALL_ALLPASSES = [
  0.020346, 0.024421, 0.031604, 0.027333, 0.022904, 0.029291, 0.013458, 0.019123,
] as const
const HALL_MEAN_LOOP = HALL_LOOPS.reduce((sum, seconds) => sum + seconds, 0) / HALL_LOOPS.length
/** The reverb's own output runs 7 dB under what goes in; Mix is levelled for it (`wetPower` in the .dsp). */
const HALL_WET_POWER = 0.2

/**
 * What one trip round a loop `seconds` long does to a frequency, in dB, as
 * the generated `hall-reverb.h` computes each line's filter: the gain that
 * makes Mid decay the RT60, a low shelf at Crossover that turns it into Low
 * decay's, and a low-pass with that same gain again at the Damping frequency.
 */
export function hallTripDb(
  seconds: number,
  hz: number,
  crossover: number,
  lowDecay: number,
  midDecay: number,
  damping: number,
  rate: number,
): number {
  const mid = Math.pow(10, (-3 * seconds) / midDecay)
  const low = Math.pow(10, (-3 * seconds) / lowDecay)
  // The shelf: 1 + (low / mid − 1) · a first-order low-pass at Crossover.
  const ratio = Math.tan((Math.PI * hz) / rate) / Math.tan((Math.PI * crossover) / rate)
  const lift = low / mid
  const shelf = (lift * lift + ratio * ratio) / (1 + ratio * ratio)
  // The low-pass: one pole, 1 at DC and `mid` at the Damping frequency.
  const squared = mid * mid
  const half = (1 - squared * Math.cos((TWO_PI * damping) / rate)) / (1 - squared)
  const pole = half - Math.sqrt(Math.max(0, half * half - 1))
  return 20 * Math.log10(mid) + 10 * Math.log10(shelf) + onePoleLossDb(pole, hz, rate)
}

/** How long the hall takes to fall 60 dB at a frequency: the mean of its loops, and what a trip round it loses. */
export function hallRt60(
  hz: number,
  crossover: number,
  lowDecay: number,
  midDecay: number,
  damping: number,
  rate: number,
): number {
  return loopRt60(
    HALL_MEAN_LOOP,
    hallTripDb(HALL_MEAN_LOOP, hz, crossover, lowDecay, midDecay, damping, rate),
  )
}

/** The dry and the wet gain of the hall's levelled Mix (`hall-reverb.dsp`). */
function hallGains(mix: number): { dry: number; wet: number } {
  const m = clamp(mix, 0, 1)
  const level = 1 / Math.sqrt((1 - m) * (1 - m) + HALL_WET_POWER * m * m)
  return { dry: (1 - m) * level, wet: m * level }
}

/** The frequencies the hall's three lines are worked out at: well under Crossover, between it and Damping, and the top. */
const hallMidHz = (view: DisplayView): number =>
  Math.sqrt(view.value('crossover') * Math.min(view.value('damping'), 12000))

const hallReverb = room({
  params: ['preDelay', 'crossover', 'lowDecay', 'midDecay', 'damping', 'mix'],
  info: 'Level against time from the moment a sound goes in. Left, the first moments: the gap, the first echoes and the eight loops coming round. Right, the whole tail in seconds: the mids, dashed the lows under Crossover, and fainter the highs above Damping.',
  first: 0.4,
  decay: 'midDecay',
  mix: 'mix',
  predelay: 'preDelay',
  damping: 'damping',
  wetOf: (mix) => gainToDb(hallGains(mix).wet) + 10 * Math.log10(HALL_WET_POWER),
  answer(view, rate) {
    const gains = hallGains(view.value('mix'))
    const gap = view.value('preDelay') / 1000
    const at = (hz: number): number =>
      hallRt60(
        hz,
        view.value('crossover'),
        view.value('lowDecay'),
        view.value('midDecay'),
        view.value('damping'),
        rate,
      )
    const body = at(hallMidHz(view))
    return {
      dry: gainToDb(gains.dry),
      wet: gainToDb(gains.wet) + 10 * Math.log10(HALL_WET_POWER),
      gap,
      // What goes straight through the allpasses cancels in the output: the
      // first sound is the shortest allpass's echo.
      onset: gap + Math.min(...HALL_ALLPASSES),
      body,
      top: at(TOP_HZ),
      low: at(view.value('crossover') / 4),
      release: body,
    }
  },
  reflections(view, rate, answer, marks) {
    // Each allpass (gain 0.6) hands on 1 − 0.6² after its length and 0.6 of
    // that again after twice it; then each loop comes round, straight
    // through its allpass (0.6) and after its length.
    const second = 20 * Math.log10(0.6)
    const through = 20 * Math.log10(0.6 / 0.64)
    const hz = hallMidHz(view)
    for (let i = 0; i < HALL_LOOPS.length; i++) {
      const allpass = HALL_ALLPASSES[i]
      const trip = hallTripDb(
        HALL_LOOPS[i],
        hz,
        view.value('crossover'),
        view.value('lowDecay'),
        view.value('midDecay'),
        view.value('damping'),
        rate,
      )
      marks.add(answer.gap + allpass, 0)
      marks.add(answer.gap + 2 * allpass, second)
      marks.add(answer.gap + HALL_LOOPS[i], trip + through)
      marks.add(answer.gap + HALL_LOOPS[i] + allpass, trip)
    }
  },
})

// --- Ether Reverb -------------------------------------------------------------

/** The eight combs of `freeverb.h`, in samples at 44.1 kHz. */
const ETHER_COMBS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617] as const
const ETHER_MEAN_COMB =
  ETHER_COMBS.reduce((sum, samples) => sum + samples, 0) / ETHER_COMBS.length / 44100

/**
 * `EtherReverbDevice::reverb_parameters_for` and the scaling in `freeverb.h`:
 * what the combs feed back, and the coefficient of the damping in them.
 */
export function etherLaw(
  decay: number,
  size: number,
  damping: number,
  frozen: boolean,
): { feedback: number; damp: number } {
  if (frozen) return { feedback: 1, damp: 0 }
  const decayFactor = (decay - 0.5) / 29.5
  const roomSize = Math.min(1, size + decayFactor * 0.3)
  const damp = Math.max(0, damping - decayFactor * 0.2)
  return { feedback: roomSize * 0.28 + 0.7, damp: damp * 0.4 }
}

/** How long Ether's room takes to fall 60 dB at a frequency: the mean comb, its feedback and its damping. */
export function etherRt60(
  decay: number,
  size: number,
  damping: number,
  frozen: boolean,
  hz: number,
  rate: number,
): number {
  const { feedback, damp } = etherLaw(decay, size, damping, frozen)
  if (frozen) return Infinity
  return loopRt60(ETHER_MEAN_COMB, 20 * Math.log10(feedback) + onePoleLossDb(damp, hz, rate))
}

const etherReverb = room({
  params: ['mix', 'decay', 'damping', 'predelayMs', 'size', 'freeze'],
  info: 'Level against time from the moment a sound goes in. Left, the first moments: the gap, then the eight combs answering and coming round. Right, the whole tail in seconds, with a fainter line for the highs. With Freeze on the tail runs level and never falls.',
  first: 0.3,
  decay: 'decay',
  mix: 'mix',
  predelay: 'predelayMs',
  damping: 'damping',
  // `EtherReverbDevice::process`: dry·(1 − mix) + wet·mix.
  wetOf: (mix) => gainToDb(mix),
  answer(view, rate) {
    const mix = view.value('mix')
    const gap = view.value('predelayMs') / 1000
    const frozen = view.value('freeze') >= 0.5
    const at = (hz: number, held: boolean): number =>
      etherRt60(view.value('decay'), view.value('size'), view.value('damping'), held, hz, rate)
    return {
      // A held room mutes the dry sound.
      dry: frozen ? FLOOR_DB : gainToDb(1 - mix),
      wet: gainToDb(mix),
      gap,
      onset: gap + ETHER_COMBS[0] / 44100,
      body: at(BODY_HZ, frozen),
      top: at(TOP_HZ, frozen),
      low: NaN,
      release: at(BODY_HZ, false),
    }
  },
  reflections(view, rate, answer, marks) {
    // A held room lets nothing new in.
    if (view.value('freeze') >= 0.5) return
    const { feedback, damp } = etherLaw(
      view.value('decay'),
      view.value('size'),
      view.value('damping'),
      false,
    )
    const trip = 20 * Math.log10(feedback) + onePoleLossDb(damp, BODY_HZ, rate)
    // Each comb's echo, and its next two trips; after that they are a wash.
    for (const samples of ETHER_COMBS) {
      for (let n = 1; n <= 3; n++) marks.add(answer.gap + (n * samples) / 44100, (n - 1) * trip)
    }
  },
})

// --- Spring -------------------------------------------------------------------

/** The constants of `spring_reverb.h`. */
const SPRING_TRANSITION_HZ = 4600
const SPRING_ROUND_TRIPS = [0.0412, 0.0356, 0.0479] as const
const SPRING_SLACK = 0.45
const SPRING_TAUT = 0.8
const SPRING_OFFSETS = [0, 0.02, -0.02] as const
const SPRING_STAGES = 100
const SPRING_TREBLE_LOSS = 0.6
const SPRING_LINE_MOST = 1024 - 8
const SPRING_DRIP_HZ = 2200
const SPRING_DRIP_GAIN = 4
/** What each spring is fed in each setting of Springs. */
const SPRING_FEED = [
  [1, 0, 0],
  [0.75, 0.75, 0],
  [0.62, 0.62, 0.62],
] as const
/** The pieces each bounce's sweep is drawn in. */
const SPRING_PIECES = 6
const SPRING_SHARES = new Float64Array(SPRING_PIECES)
/** The most trips of one spring that are drawn, and the outlines of them all. */
const SPRING_TRIPS = 24
const SPRING_WEDGES = new Float32Array(3 * SPRING_TRIPS * 2 * (SPRING_PIECES + 2))

/** The rate the tank runs at: the device's rate over a whole number, so that half of it lands near the transition frequency. */
export function springRate(rate: number): number {
  return rate / clamp(Math.floor(rate / (2 * SPRING_TRANSITION_HZ) + 0.5), 1, 32)
}

/** The allpass coefficient of spring `n` at a Tension. */
const springCoefficient = (tension: number, n: number): number =>
  lerp(SPRING_SLACK, SPRING_TAUT, clamp(tension, 0, 1)) + SPRING_OFFSETS[n]

/**
 * The samples (at the tank's rate) the cascade of a hundred allpasses
 * `(a + z⁻¹) / (1 + a·z⁻¹)` holds a frequency back: its group delay at `w`
 * radians a sample. It grows with frequency, which is the spring's chirp.
 */
export function springCascade(a: number, w: number): number {
  return (SPRING_STAGES * (1 - a * a)) / (1 + a * a + 2 * a * Math.cos(w))
}

/** The frequency (radians a sample) the cascade holds back by `samples`: `springCascade` the other way round. */
function springCascadeAt(a: number, samples: number): number {
  return Math.acos(clamp(((SPRING_STAGES * (1 - a * a)) / samples - 1 - a * a) / (2 * a), -1, 1))
}

/** One spring as `SpringReverb::control` sets it: the line that makes up its round trip, its loop gain and its damping. */
function springLoop(n: number, decay: number, tension: number, rate: number) {
  const low = springRate(rate)
  const a = springCoefficient(tension, n)
  const trip = SPRING_ROUND_TRIPS[n] * low
  const gain = Math.pow(10, (-3 * trip) / (decay * low))
  return {
    low,
    a,
    line: clamp(trip - springCascade(a, 0), 4, SPRING_LINE_MOST),
    half: clamp(Math.floor(0.5 * trip + 0.5), 1, SPRING_LINE_MOST),
    gainDb: 20 * Math.log10(gain),
    damping: clamp(1 - Math.pow(gain, SPRING_TREBLE_LOSS), 0, 0.5),
  }
}

/**
 * How long a spring takes to fall 60 dB at a frequency: a trip round it is
 * the line and what the cascade holds that frequency back, and on each trip
 * it loses the loop gain and the damping.
 */
export function springRt60(
  decay: number,
  tension: number,
  hz: number,
  rate: number,
  n = 0,
): number {
  const loop = springLoop(n, decay, tension, rate)
  const w = (TWO_PI * Math.min(hz, loop.low * 0.499)) / loop.low
  return loopRt60(
    (loop.line + springCascade(loop.a, w)) / loop.low,
    loop.gainDb + onePoleLossDb(loop.damping, hz, loop.low),
  )
}

/** What Drip adds at a frequency, in dB: `x + drip · 4 · highpass(x)` with the high-pass at 2.2 kHz. */
export function springDripDb(drip: number, hz: number, rate: number): number {
  const a = Math.exp((-TWO_PI * SPRING_DRIP_HZ) / rate)
  const w = (TWO_PI * hz) / rate
  const under = 1 + a * a - 2 * a * Math.cos(w)
  const lowRe = ((1 - a) * (1 - a * Math.cos(w))) / under
  const lowIm = (-(1 - a) * a * Math.sin(w)) / under
  const amount = SPRING_DRIP_GAIN * clamp(drip, 0, 1)
  const re = 1 + amount * (1 - lowRe)
  const im = -amount * lowIm
  return 10 * Math.log10(re * re + im * im)
}

/** The top of what comes back from the tank: Tone, or 0.8 of the way to half the tank's rate, where its filters close. */
const springTopHz = (view: DisplayView, rate: number): number =>
  Math.min(view.value('tone'), 0.4 * springRate(rate))

const springMode = (view: DisplayView): number => clamp(Math.round(view.value('springs')), 0, 2)

/**
 * The bounces of the springs: each trip an echo, and each echo a sweep. The
 * lows of a bounce arrive together and its highs trail behind, further
 * behind on every trip, so a bounce is drawn as a wedge: upright where the
 * lows land, sloping away to where the top of the band lands. Its height
 * along the way is how much of the band arrives in that moment, which is
 * what Tension shapes; Drip lifts the trailing highs.
 */
function drawBounces(
  frame: DisplayFrame,
  box: Box,
  seconds: number,
  answer: Answer,
  level: number,
): void {
  const { ctx, colours } = frame
  const rate = frame.sampleRate
  const decay = frame.value('decay')
  const tension = frame.value('tension')
  const drip = frame.value('drip')
  const feeds = SPRING_FEED[springMode(frame)]
  const topHz = springTopHz(frame, rate)
  const foot = box.y + box.h
  const x = (t: number): number => box.x + (t / seconds) * box.w
  // Every wedge's outline first, then one fill and one stroke for them all.
  const each = SPRING_PIECES + 2
  let wedges = 0
  for (let n = 0; n < feeds.length; n++) {
    if (feeds[n] <= 0) continue
    const loop = springLoop(n, decay, tension, rate)
    const still = springCascade(loop.a, 0)
    const wTop = (TWO_PI * topHz) / loop.low
    const trails = springCascade(loop.a, wTop) - still
    const feedDb = 20 * Math.log10(feeds[n])
    for (let trip = 0; trip < SPRING_TRIPS; trip++) {
      const lands = answer.gap + (still + loop.half + trip * (loop.line + still)) / loop.low
      const base = level + feedDb + trip * loop.gainDb
      if (lands > seconds || base < FOOT_DB) break
      const spread = ((trip + 1) * trails) / loop.low
      // How much of the band lands in each piece of the sweep, and the most in any.
      let from = 0
      let most = -Infinity
      for (let piece = 0; piece < SPRING_PIECES; piece++) {
        const held = still + (trails * (piece + 1)) / SPRING_PIECES
        const to = piece === SPRING_PIECES - 1 ? wTop : springCascadeAt(loop.a, held)
        const hz = ((from + to) / 2 / TWO_PI) * loop.low
        const share =
          10 * Math.log10(Math.max(1e-6, ((to - from) / wTop) * SPRING_PIECES)) +
          trip * onePoleLossDb(loop.damping, hz, loop.low)
        if (share > most) most = share
        SPRING_SHARES[piece] = share + springDripDb(drip, hz, rate)
        from = to
      }
      const at = 2 * each * wedges
      SPRING_WEDGES[at] = x(lands)
      SPRING_WEDGES[at + 1] = yOf(base + SPRING_SHARES[0] - most, box)
      for (let piece = 0; piece < SPRING_PIECES; piece++) {
        SPRING_WEDGES[at + 2 + 2 * piece] = x(lands + (spread * (piece + 0.5)) / SPRING_PIECES)
        SPRING_WEDGES[at + 3 + 2 * piece] = yOf(base + SPRING_SHARES[piece] - most, box)
      }
      SPRING_WEDGES[at + 2 * each - 2] = x(lands + spread)
      SPRING_WEDGES[at + 2 * each - 1] = SPRING_WEDGES[at + 2 * each - 3]
      wedges += 1
    }
  }
  if (wedges === 0) return
  const outline = (part: 'whole' | 'front' | 'sweep'): void => {
    ctx.beginPath()
    for (let wedge = 0; wedge < wedges; wedge++) {
      const at = 2 * each * wedge
      if (part === 'sweep') ctx.moveTo(SPRING_WEDGES[at], SPRING_WEDGES[at + 1])
      else ctx.moveTo(SPRING_WEDGES[at], foot)
      const points = part === 'front' ? 1 : each
      for (let i = 0; i < points; i++) {
        ctx.lineTo(SPRING_WEDGES[at + 2 * i], SPRING_WEDGES[at + 2 * i + 1])
      }
      if (part === 'whole') {
        ctx.lineTo(SPRING_WEDGES[at + 2 * each - 2], foot)
        ctx.closePath()
      }
    }
  }
  ctx.fillStyle = colours.ink
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.lineCap = 'butt'
  ctx.setLineDash([])
  outline('whole')
  ctx.globalAlpha = INK.fill
  ctx.fill()
  // The moment each bounce lands, lightly, and the slope of its sweep.
  outline('front')
  ctx.globalAlpha = INK.rule
  ctx.stroke()
  outline('sweep')
  ctx.globalAlpha = INK.text
  ctx.stroke()
  ctx.globalAlpha = 1
}

const springReverb = room({
  params: ['mix', 'decay', 'tension', 'springs', 'tone', 'drip', 'predelay'],
  info: 'Level against time from the moment a sound goes in. Left, the first moments: every bounce of the springs, its highs trailing further behind on each trip. Tension shapes the sweep and Drip lifts its end. Right, the whole tail in seconds, fainter for the highs.',
  first: 0.25,
  decay: 'decay',
  mix: 'mix',
  predelay: 'predelay',
  // `kit::equal_power`: dry·cos(mix·π/2) + wet·sin(mix·π/2).
  wetOf: (mix) => gainToDb(Math.sin((clamp(mix, 0, 1) * Math.PI) / 2)),
  answer(view, rate) {
    const mix = clamp(view.value('mix'), 0, 1)
    const gap = view.value('predelay') / 1000
    const decay = view.value('decay')
    const tension = view.value('tension')
    const feeds = SPRING_FEED[springMode(view)]
    // The pickup is half way round: the first sound is half a trip of the shortest spring that is fed.
    let first = Infinity
    for (let n = 0; n < feeds.length; n++) {
      if (feeds[n] <= 0) continue
      const loop = springLoop(n, decay, tension, rate)
      first = Math.min(first, (springCascade(loop.a, 0) + loop.half) / loop.low)
    }
    const body = springRt60(decay, tension, BODY_HZ, rate)
    return {
      dry: mix >= 1 ? FLOOR_DB : gainToDb(Math.cos((mix * Math.PI) / 2)),
      wet: gainToDb(Math.sin((mix * Math.PI) / 2)),
      gap,
      onset: gap + first,
      body,
      top: springRt60(decay, tension, springTopHz(view, rate), rate),
      low: NaN,
      release: body,
    }
  },
  drawFirst: drawBounces,
})

// --- Convolver Reverb ---------------------------------------------------------

/** The power the generated impulse's envelope is raised to: `(1 − i / length) ** 2.5` in `generateHallImpulse`. */
const CONVOLVER_POWER = 2.5
/** The seconds the convolver's picture spans: a little more than its impulse. */
const CONVOLVER_SPAN = 3

/**
 * The level of the generated impulse `seconds` after a sound, in dB against
 * its start (`generateHallImpulse`): noise under `(1 − t / length) ** 2.5`,
 * which on a scale of decibels is no straight slope: it leans over slowly
 * and then drops away to nothing at the impulse's end.
 */
export function convolverDb(seconds: number): number {
  const left = 1 - seconds / REVERB_DECAY_SECONDS
  return left > 1e-6 ? 20 * CONVOLVER_POWER * Math.log10(left) : FLOOR_DB
}

/** The seconds after which that is `db` down. */
export function convolverSeconds(db: number): number {
  return REVERB_DECAY_SECONDS * (1 - Math.pow(10, -db / (20 * CONVOLVER_POWER)))
}

const stripBox = (view: Pick<DisplayView, 'width' | 'height'>): Box => ({
  x: 4,
  y: 4,
  w: view.width - 8,
  h: view.height - 8 - SCALE_HEIGHT,
})

function convolverHandles(view: DisplayView): DisplayHandle[] {
  const box = stripBox(view)
  const wet = gainToDb(view.value('wet'))
  const lowestY = yOf(LOWEST_WET_DB, box)
  return [
    {
      key: 'wet',
      name: 'Wet',
      x: box.x,
      y: yOf(Math.max(wet, LOWEST_WET_DB), box),
      drag: (_x, y) => {
        if (y >= lowestY - 0.25) {
          return { wet: wet <= LOWEST_WET_DB ? view.value('wet') : (view.spec('wet')?.min ?? 0) }
        }
        return { wet: clamp(Math.pow(10, dbOfY(y, box, TOP_DB, FOOT_DB) / 20), 0, 1) }
      },
      reset: () => ({ wet: defaultOf(view, 'wet') }),
    },
  ]
}

/**
 * The convolver: one fixed room, so one fixed curve, and Wet sets how high
 * it starts. It has no dry side, no gap and no first reflections: the
 * impulse is noise from its first sample on, the same at every frequency.
 */
const convolverReverb = plateDisplay<{ ringing: Ringing }>({
  place: 'strip',
  params: ['wet'],
  live: { signal: true },
  info: 'Level against time from the moment a sound goes in. This reverb is one fixed room: its tail leans over slowly, then drops away 2.6 seconds on. The figure is the time it takes to fall 60 dB. Drag the start up or down for how loud it is.',
  init: () => ({ ringing: ringing() }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const box = stripBox(frame)
    const foot = box.y + box.h
    const wet = gainToDb(frame.value('wet'))
    const level = Math.max(wet, LOWEST_WET_DB)
    listen(frame, state.ringing, convolverSeconds(60), wet)

    dbGrid(frame, box, TOP_DB, FOOT_DB, 20)
    timeScale(frame, box, CONVOLVER_SPAN, frame.height - 3.5, true)
    rule(ctx, box.x, foot, box.x + box.w, foot, { colour: colours.ink, alpha: INK.rule })

    // The curve as far as the foot, and the moment it gets there.
    const reach = convolverSeconds(level - FOOT_DB)
    const curve: Point[] = []
    for (let x = 0; x <= box.w + 2; x += 2) {
      const seconds = Math.min(reach, (x / box.w) * CONVOLVER_SPAN)
      curve.push([
        box.x + (seconds / CONVOLVER_SPAN) * box.w,
        yOf(level + convolverDb(seconds), box),
      ])
      if (seconds >= reach) break
    }
    clipped(ctx, box, () => fillTo(ctx, curve, foot, colours.ink, INK.fill))
    drawRinging(frame, state.ringing, box, box.x, CONVOLVER_SPAN)
    clipped(ctx, box, () => trace(ctx, curve, { colour: colours.ink }))
    // The impulse's end, where there is nothing left at all.
    const end = box.x + (REVERB_DECAY_SECONDS / CONVOLVER_SPAN) * box.w
    rule(ctx, end, foot - 3, end, foot, { colour: colours.ink, alpha: INK.back })

    for (const point of convolverHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
    const words = frame.hot === 'wet' ? `${Math.round(wet)}dB` : secondsText(convolverSeconds(60))
    text(frame, words, box.x + box.w - 1, box.y + 8, { align: 'right', size: 9 })
  },
  handles: convolverHandles,
})

// --- Shaped Reverb ------------------------------------------------------------

/** The constants of `shaped_reverb.h`. */
const SHAPED_MOST_TAPS = 256
const SHAPED_FLOOR_SEC = 0.001
const SHAPED_COLOUR_HZ = 900
const SHAPED_TAIL_DAMP_SHARE = 0.5
const SHAPED_TAIL_LOW_HZ = 140
/** The tail's eight lines in seconds, which `kit::spread_lengths` lays out from 99.1 to 316.7 ms in equal ratios, and their mean. */
const SHAPED_TAIL_LINES = [0, 1, 2, 3, 4, 5, 6, 7].map(
  (line) => 0.0991 * Math.pow(0.3167 / 0.0991, line / 7),
)
const SHAPED_TAIL_PASS =
  SHAPED_TAIL_LINES.reduce((sum, seconds) => sum + seconds, 0) / SHAPED_TAIL_LINES.length
/** The middle of the rates the diffuser's five sweeps run at, 0.23 to 1.06 Hz. */
const SHAPED_SWEEP_HZ = 0.645
/** The most steps the level is worked out in: one a pixel. */
const SHAPED_STEPS = 1024

/**
 * Where in its cell each tap of the left side falls: `jitter_[0]`, drawn by
 * `kit::Rng` (a 32-bit xorshift) from the device's own seed, so the marks
 * stand where the echoes are.
 */
const SHAPED_JITTER: Float32Array = (() => {
  const jitter = new Float32Array(SHAPED_MOST_TAPS)
  let state = 0x3c6ef372
  const uniform = (): number => {
    state = (state ^ (state << 13)) >>> 0
    state = (state ^ (state >>> 17)) >>> 0
    state = (state ^ (state << 5)) >>> 0
    return (state >>> 8) / 16777216
  }
  for (let k = 0; k < SHAPED_MOST_TAPS; k++) {
    jitter[k] = uniform()
    // A tap's sign, its colour group and its side are drawn after its place.
    uniform()
    uniform()
    uniform()
  }
  return jitter
})()

/** The Shape as an amplitude at `u` along the span: `ShapedReverb::shape_gain`. Gate, Reverse, Bloom, Fall, Pulse. */
export function shapedGain(shape: number, u: number): number {
  if (!(u >= 0 && u <= 1)) return 0
  switch (shape) {
    case 1:
      return Math.exp(-3.22 * (1 - u)) * Math.min(1, 12 * u)
    case 2:
      return Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(u, 0.8))), 1.2)
    case 3:
      return 1 - u
    case 4: {
      const wave = Math.sin(3 * Math.PI * u)
      return Math.pow(wave * wave, 0.75) * (1 - 0.3 * u)
    }
    default:
      return 1
  }
}

/** How many echoes make the shape: `ShapedReverb::taps_for`. */
export function shapedTaps(density: number, seconds: number): number {
  const rate = 8 * Math.pow(260 / 8, density)
  return clamp(Math.floor(rate * seconds + 0.5), 4 + Math.floor(44 * density), SHAPED_MOST_TAPS)
}

/** How long the allpasses in front draw each echo out: `ShapedReverb::smear_for`. */
export function shapedSmear(seconds: number, taps: number): number {
  return Math.min(clamp((1.8 * seconds) / taps, 0.008, 0.045), 0.25 * seconds)
}

/** The seconds after the sound that echo `k` of `taps` arrives: its place in `ShapedReverb::build`, and the smear the allpasses hold it back by. */
export function shapedTapSeconds(k: number, taps: number, seconds: number, pre: number): number {
  const smear = shapedSmear(seconds, taps)
  return pre + SHAPED_FLOOR_SEC + ((k + SHAPED_JITTER[k]) / taps) * (seconds - smear) + smear
}

/** The seconds the tail after the shape takes to fall 60 dB: `0.6 · 10^Tail` in `ShapedReverb::control`. */
export const shapedTailRt60 = (tail: number): number => 0.6 * Math.pow(10, tail)

/** The level the tail settles at against a shape that is held, as a gain: `ShapedReverb::tail_level_for`. */
export const shapedTailLevel = (tail: number): number =>
  tail <= 0 ? 0 : 0.95 * Math.pow(tail, 0.765)

/** The level the shape's top comes out at, dB: `kit::equal_power`, and what Repeat takes back, `(1 − repeat²)^¼`. */
export function shapedWetDb(mix: number, repeat: number): number {
  return gainToDb(Math.sin((clamp(mix, 0, 1) * Math.PI) / 2) * Math.pow(1 - repeat * repeat, 0.25))
}

/** A one-pole low-pass `kit::OnePole` set to `cutoff`, at a frequency: the real and imaginary parts of what it passes. */
function onePoleAt(cutoff: number, hz: number, rate: number): { re: number; im: number } {
  const a = Math.exp((-TWO_PI * clamp(cutoff, 0, rate * 0.49)) / rate)
  const w = (TWO_PI * hz) / rate
  const under = 1 + a * a - 2 * a * Math.cos(w)
  return {
    re: ((1 - a) * (1 - a * Math.cos(w))) / under,
    im: (-(1 - a) * a * Math.sin(w)) / under,
  }
}

/** What the shaped reverb does to one frequency, each as a share of its power. */
interface ShapedBand {
  /** High Cut and Low Cut on the whole of the wet sound: two poles each. */
  cut: number
  /** Colour on the early echoes and on the late ones. */
  early: number
  late: number
  /** What a trip round the Repeat loop keeps, less the Repeat setting itself. */
  loop: number
  /** What gets into the tail. */
  feed: number
  /** What the tail loses a second, as a rate of its power. */
  fall: number
}

function shapedBand(view: DisplayView, hz: number, rate: number): ShapedBand {
  const high = view.value('highCut')
  const low = view.value('lowCut')
  const colour = view.value('colour')
  const warp = (f: number): number => Math.tan((Math.PI * clamp(f, 5, rate * 0.49)) / rate)
  const over = Math.pow(warp(hz) / warp(high), 4)
  const under = Math.pow(warp(low) / warp(hz), 4)
  // A treble shelf on one group: the group mixed towards a low-pass of itself.
  const amount = 1 - Math.pow(10, -1.2 * Math.abs(colour))
  const dull = onePoleAt(SHAPED_COLOUR_HZ, hz, rate)
  const shelf = (1 - amount + amount * dull.re) ** 2 + (amount * dull.im) ** 2
  const loopHigh = onePoleAt(high, hz, rate)
  const loopLow = onePoleAt(low, hz, rate)
  const thin = onePoleAt(SHAPED_TAIL_LOW_HZ, hz, rate)
  const damp = onePoleAt(SHAPED_TAIL_DAMP_SHARE * high, hz, rate)
  const kept = damp.re * damp.re + damp.im * damp.im
  const rt60 = shapedTailRt60(view.value('tail'))
  return {
    cut: 1 / (1 + over) / (1 + under),
    early: colour > 0 ? shelf : 1,
    late: colour < 0 ? shelf : 1,
    loop:
      (loopHigh.re * loopHigh.re + loopHigh.im * loopHigh.im) *
      ((1 - loopLow.re) ** 2 + loopLow.im * loopLow.im),
    // The tail is read through its damping before it is heard, and fed thinned.
    feed: kept * ((1 - thin.re) ** 2 + thin.im * thin.im),
    // 60 dB in its time, and the damping once more on every pass of a line.
    fall:
      (Math.LN10 / 10) * (60 / rt60 - (10 * Math.log10(Math.max(kept, 1e-9))) / SHAPED_TAIL_PASS),
  }
}

/** The settings the picture is laid out by. */
interface ShapedLayout {
  shape: number
  time: number
  taps: number
  smear: number
  /** Seconds after the sound that the shape starts and ends. */
  from: number
  to: number
  /** Seconds the box spans. */
  seconds: number
  repeat: number
  tail: number
  wet: number
  dry: number
}

/**
 * How far across its box the shape ends for a Time knob at `at`. As with the
 * rooms the knob alone places the end and the scale of seconds stretches to
 * make it true; the rest of the box is what comes after the shape.
 */
const SHAPED_END = [0.28, 0.6] as const
const shapedEnd = (at: number): number => lerp(SHAPED_END[0], SHAPED_END[1], clamp(at, 0, 1))

function shapedLayout(view: DisplayView): ShapedLayout {
  const shape = clamp(Math.round(view.value('shape')), 0, 4)
  const time = view.value('time')
  const pre = view.value('preDelay') / 1000
  const taps = shapedTaps(view.value('density'), time)
  const smear = shapedSmear(time, taps)
  const repeat = clamp(view.value('repeat'), 0, 0.95)
  const mix = clamp(view.value('mix'), 0, 1)
  const to = pre + SHAPED_FLOOR_SEC + time
  return {
    shape,
    time,
    taps,
    smear,
    from: pre + SHAPED_FLOOR_SEC + smear,
    to,
    seconds: to / shapedEnd(view.at('time')),
    repeat,
    tail: view.value('tail'),
    wet: shapedWetDb(mix, repeat),
    dry: mix >= 1 ? FLOOR_DB : gainToDb(Math.cos((mix * Math.PI) / 2)),
  }
}

/** The odds an echo at `u` along the shape is of the late colour group: none in the first tenth, all in the last (`ShapedReverb::build`). */
function shapedLate(u: number): number {
  const along = clamp((u - 0.1) * 1.25, 0, 1)
  return along * along * (3 - 2 * along)
}

/**
 * The level of the wet sound at one frequency, in dB against the shape's
 * top, at `steps + 1` moments evenly across `layout.seconds`, into `out`.
 * Three things add up, as powers: the shape itself (`shape_gain` squared,
 * through Colour); the shape coming round again every Time, each trip down
 * by Repeat and by the loop's filters; and the tail, an eight-line network
 * the shaped sound feeds. The tail hears the shape a line later, each line
 * in its own time, fills and empties at the rate of its decay, and stands at
 * `tail_level_for` under a shape that is held. `tail` gets the tail alone.
 */
function shapedLevels(
  layout: ShapedLayout,
  band: ShapedBand,
  steps: number,
  power: Float32Array,
  out: Float32Array,
  tail: Float32Array,
): void {
  const step = layout.seconds / steps
  const span = layout.time - layout.smear
  const each = layout.repeat * layout.repeat * band.loop
  for (let i = 0; i <= steps; i++) {
    const t = i * step
    let sum = 0
    let trip = 1
    for (let n = 0; n < 16 && trip > 1e-7; n++) {
      let u = (t - layout.from - n * layout.time) / span
      // The smear between one time round and the next is no gap to hear.
      if (u < 0 && n > 0 && u >= -layout.smear / span) u = 0
      if (u < 0) break
      if (u <= 1) {
        const gain = shapedGain(layout.shape, u)
        const late = shapedLate(u)
        sum += trip * gain * gain * ((1 - late) * band.early + late * band.late)
      }
      trip *= each
    }
    power[i] = sum
  }
  const level = shapedTailLevel(layout.tail)
  const fills =
    (1 - Math.exp((-step * 6 * Math.LN10) / shapedTailRt60(layout.tail))) / SHAPED_TAIL_LINES.length
  const keeps = Math.exp(-step * band.fall)
  let held = 0
  for (let i = 0; i <= steps; i++) {
    let heard = 0
    for (const line of SHAPED_TAIL_LINES) {
      const from = i - Math.round(line / step)
      if (from >= 0) heard += power[from]
    }
    held = held * keeps + fills * band.feed * heard
    const rings = band.cut * level * level * held
    const whole = band.cut * power[i] + rings
    out[i] = whole > 1e-12 ? 10 * Math.log10(whole) : FLOOR_DB
    tail[i] = rings > 1e-12 ? 10 * Math.log10(rings) : FLOOR_DB
  }
}

const shapedShownWet = (layout: ShapedLayout): number => Math.max(layout.wet, LOWEST_WET_DB)

const shapedSteps = (box: Box): number => clamp(Math.round(box.w), 8, SHAPED_STEPS)

/** Where the Tail handle stands: on the tail once every one of its lines has heard the whole shape, or at the box's end. */
function shapedTailStep(layout: ShapedLayout, steps: number): number {
  const longest = SHAPED_TAIL_LINES[SHAPED_TAIL_LINES.length - 1]
  return Math.min(steps - 3, Math.round(((layout.to + longest) / layout.seconds) * steps))
}

/** Scratch for laying out the handles, which have no state of their own. */
const SHAPED_SCRATCH = [0, 1, 2].map(() => new Float32Array(SHAPED_STEPS + 1))

function shapedHandles(view: DisplayView): DisplayHandle[] {
  const box = stripBox(view)
  const layout = shapedLayout(view)
  const level = shapedShownWet(layout)
  const foot = box.y + box.h
  const lowestY = yOf(LOWEST_WET_DB, box)
  const across = shapedEnd(view.at('time')) * box.w
  const timeSpec = view.spec('time')
  const steps = shapedSteps(box)
  const tailStep = shapedTailStep(layout, steps)
  // The tail alone where its handle stands, in dB, at a setting of Tail.
  const tailAt = (value: number): number => {
    const [power, whole, tail] = SHAPED_SCRATCH
    const other = withParam(view, 'tail', value)
    shapedLevels(
      { ...layout, tail: value },
      shapedBand(other, BODY_HZ, rateOf(view)),
      steps,
      power,
      whole,
      tail,
    )
    return level + tail[tailStep]
  }
  const tailDb = tailAt(layout.tail)
  return [
    {
      key: 'start',
      name: 'Pre-delay and mix',
      x: box.x + (layout.from / layout.to) * across,
      y: yOf(level, box),
      drag: (x, y) => {
        // The end of the shape stays where it is, so the start alone says the gap.
        const share = clamp((x - box.x) / across, 0, 0.99)
        const gap = (share * layout.time - layout.smear) / (1 - share) - SHAPED_FLOOR_SEC
        const spec = view.spec('preDelay')
        return {
          preDelay: clamp(gap * 1000, spec?.min ?? 0, spec?.max ?? 250),
          mix:
            y >= lowestY - 0.25
              ? layout.wet <= LOWEST_WET_DB
                ? view.value('mix')
                : (view.spec('mix')?.min ?? 0)
              : solveParam(
                  view,
                  'mix',
                  (mix) => shapedWetDb(mix, layout.repeat),
                  dbOfY(y, box, TOP_DB, FOOT_DB),
                ),
        }
      },
      reset: () => ({ preDelay: defaultOf(view, 'preDelay'), mix: defaultOf(view, 'mix') }),
    },
    {
      key: 'end',
      name: 'Time',
      x: box.x + across,
      y: yOf(level, box),
      drag: (x) => ({
        time: timeSpec
          ? denormalizeParam(
              timeSpec,
              clamp(((x - box.x) / box.w - SHAPED_END[0]) / (SHAPED_END[1] - SHAPED_END[0]), 0, 1),
            )
          : layout.time,
      }),
      reset: () => ({ time: defaultOf(view, 'time') }),
    },
    {
      key: 'tail',
      name: 'Tail',
      x: box.x + (tailStep / steps) * box.w,
      y: yOf(tailDb, box),
      drag: (_x, y) => {
        if (y >= foot - 0.25) return { tail: tailDb <= FOOT_DB ? layout.tail : 0 }
        // The Tail that puts the tail at that level here: more of it is louder and longer.
        return { tail: solveParam(view, 'tail', tailAt, dbOfY(y, box, TOP_DB, FOOT_DB)) }
      },
      reset: () => ({ tail: defaultOf(view, 'tail') }),
    },
  ]
}

interface ShapedState {
  ringing: Ringing
  marks: Marks
  power: Float32Array
  body: Float32Array
  top: Float32Array
  tail: Float32Array
}

/** The parts of a line of levels that stand above the foot, each with its feet on it, so a gate's sides are upright. */
function runsAbove(levels: Float32Array, steps: number, box: Box, levelDb: number): Point[][] {
  const runs: Point[][] = []
  const foot = box.y + box.h
  let run: Point[] | null = null
  for (let i = 0; i <= steps; i++) {
    const x = box.x + (i / steps) * box.w
    const db = levelDb + levels[i]
    if (db > FOOT_DB + 0.05) {
      if (!run) {
        run = i > 0 ? [[x, foot]] : []
        runs.push(run)
      }
      run.push([x, yOf(db, box)])
    } else if (run) {
      run.push([box.x + ((i - 1) / steps) * box.w, foot])
      run = null
    }
  }
  return runs
}

/**
 * The shaped reverb: its level over time is drawn, not decayed, so the shape
 * is the picture. The echoes that make it stand as marks at their own
 * moments, as many as Density asks for; the line over them is the level in
 * the body of the sound and the fainter one the level of the highs, which
 * Colour takes from the early or the late echoes. After the shape, on the
 * same scale: the repeats and the tail.
 */
const shapedReverb = plateDisplay<ShapedState>({
  place: 'strip',
  params: [
    'shape',
    'time',
    'density',
    'preDelay',
    'colour',
    'highCut',
    'lowCut',
    'modulation',
    'repeat',
    'tail',
    'mix',
  ],
  live: { signal: true },
  info: 'Level against time from the moment a sound goes in. The marks are the echoes that make the shape and the line over them is their level. After the shape come its repeats and its tail. The fainter line is the highs. Drag the start for pre-delay and mix, the end for time and tail.',
  init: () => ({
    ringing: ringing(),
    marks: new Marks(),
    power: new Float32Array(SHAPED_STEPS + 1),
    body: new Float32Array(SHAPED_STEPS + 1),
    top: new Float32Array(SHAPED_STEPS + 1),
    tail: new Float32Array(SHAPED_STEPS + 1),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const box = stripBox(frame)
    const foot = box.y + box.h
    const layout = shapedLayout(frame)
    const level = shapedShownWet(layout)
    const steps = shapedSteps(box)
    const bodyBand = shapedBand(frame, BODY_HZ, frame.sampleRate)
    const topBand = shapedBand(frame, TOP_HZ, frame.sampleRate)
    shapedLevels(layout, topBand, steps, state.power, state.top, state.tail)
    shapedLevels(layout, bodyBand, steps, state.power, state.body, state.tail)
    listen(frame, state.ringing, layout.time, Math.max(layout.dry, layout.wet))

    dbGrid(frame, box, TOP_DB, FOOT_DB, 20)
    timeScale(frame, box, layout.seconds, frame.height - 3.5, true)
    rule(ctx, box.x, foot, box.x + box.w, foot, { colour: colours.ink, alpha: INK.rule })

    const body = runsAbove(state.body, steps, box, level)
    clipped(ctx, box, () => {
      for (const run of body) fillTo(ctx, run, foot, colours.ink, INK.fill)
      // The echoes of the shape's first time round, each as high as the shape is there.
      state.marks.clear()
      const cut = 10 * Math.log10(bodyBand.cut)
      for (let k = 0; k < layout.taps; k++) {
        const u = (k + SHAPED_JITTER[k]) / layout.taps
        const gain = shapedGain(layout.shape, u)
        if (gain <= 0) continue
        const late = shapedLate(u)
        state.marks.add(
          shapedTapSeconds(
            k,
            layout.taps,
            layout.time,
            layout.from - layout.smear - SHAPED_FLOOR_SEC,
          ),
          cut +
            20 * Math.log10(gain) +
            10 * Math.log10((1 - late) * bodyBand.early + late * bodyBand.late),
        )
      }
      strokeMarks(frame, state.marks, box, layout.seconds, level, INK.text)
      for (const run of runsAbove(state.top, steps, box, level)) {
        trace(ctx, run, { colour: colours.ink, width: 1, alpha: INK.back })
      }
      // The tail alone, filling up under the shape and its repeats.
      for (const run of runsAbove(state.tail, steps, box, level)) {
        trace(ctx, run, { colour: colours.ink, width: 1, alpha: INK.back, dash: [2, 2] })
      }
    })
    drawRinging(frame, state.ringing, box, box.x, layout.seconds)
    clipped(ctx, box, () => {
      for (const run of body) trace(ctx, run, { colour: colours.ink })
    })
    // Modulation sweeps the allpasses that draw each echo out.
    if (body.length > 0) {
      shimmer(frame, box, body[0], layout.seconds, SHAPED_SWEEP_HZ, 1.5 * frame.value('modulation'))
    }
    dryMark(frame, box, layout.dry)

    // The frame the shape is drawn in: its length and the level of its top.
    const points = shapedHandles(frame)
    rule(ctx, points[0].x, points[0].y, points[1].x, points[1].y, {
      colour: colours.ink,
      alpha: INK.back,
      dash: [1, 2],
    })
    for (const point of points) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
    const words =
      frame.hot === 'start' ? `${Math.round(frame.value('preDelay'))}ms` : secondsText(layout.time)
    // The figure goes under the line where repeats or a long tail hold the line up.
    let highest = FOOT_DB
    for (let i = Math.round(steps * (1 - 26 / box.w)); i <= steps; i++) {
      highest = Math.max(highest, level + state.body[i])
    }
    const under = yOf(highest, box) < box.y + 11
    text(frame, words, box.x + box.w - 1, under ? yOf(highest, box) + 11 : box.y + 8, {
      align: 'right',
      size: 9,
    })
  },
  handles: shapedHandles,
})

export const REVERB_FACES: Readonly<Record<string, PlateFace>> = {
  'convolver-reverb': { display: convolverReverb, face: ['wet'] },
  'plate-reverb': {
    display: plateReverb,
    face: ['decay', 'damping', 'predelayMs', 'mix'],
  },
  'fdn-reverb': {
    display: fdnReverb,
    face: ['decay', 'size', 'breathDepth', 'mix'],
  },
  'hall-reverb': {
    display: hallReverb,
    face: ['midDecay', 'lowDecay', 'crossover', 'mix'],
  },
  'spring-reverb': {
    display: springReverb,
    face: ['decay', 'tension', 'drip', 'mix'],
  },
  'shaped-reverb': {
    display: shapedReverb,
    face: ['shape', 'time', 'density', 'mix'],
  },
  'ether-reverb': {
    display: etherReverb,
    face: ['decay', 'size', 'freeze', 'mix'],
  },
}
