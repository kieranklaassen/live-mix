// The display of Canon: the line and the followers that take it up.
//
// It is the delays' picture with a second axis. A mark stands for now, where
// the line is played, and what was played travels right from it, a second a
// second, as the outline of its level. Each follower stands one gap further
// along: a stem rises from the line where the follower takes it to a note at
// the height of the follower's interval, as thick as the follower is loud and
// filled in the second colour while it plays. A crab's stem does not stand: it
// runs along the line, twice as fast as the line travels, from the entry
// before its own to the one after, and then goes back, which is how it plays
// each gap's worth backwards. The dashed way back to the mark is the round.
//
// Every place here is the device's own (canon.h): where a follower reads, how
// loud it is, which ones are crabs. The line's outline is the level the device
// reports having written, kept by the device's clock.

import { denormalizeParam } from '../../../core/params'
import {
  INK,
  clamp,
  clipped,
  fillRect,
  follow,
  ground,
  handle,
  label,
  lerp,
  rule,
  text,
  trace,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import {
  Tape,
  carried,
  carry,
  deviceClock,
  heightOfLevel,
  tick,
  timeText,
  type Carried,
  type DeviceClock,
} from './loops'

// --- The device, as canon.h has it ------------------------------------------

/** canon.h `kVoices`. */
export const CANON_VOICES = 4
/** canon.h `kFadeDb`: each follower is this much quieter than the one before at Fade 1. */
const FADE_DB = 12

/**
 * How loud follower `k` (0 the first) of `count` plays a full-scale line,
 * before Mix: canon.h `place()`. Each is 12 dB times Fade under the one
 * before, and together they are scaled to the power of one.
 */
export function followerGain(k: number, count: number, fade: number): number {
  let power = 0
  for (let n = 0; n < count; n++) power += Math.pow(10, (-FADE_DB * fade * n) / 10)
  return k < count ? Math.pow(10, (-FADE_DB * fade * k) / 20) / Math.sqrt(power) : 0
}

/** How much of the followers Mix lets out: canon.h `process()`, equal power with exact ends. */
export function wetGain(mix: number): number {
  return mix <= 0 ? 0 : mix >= 1 ? 1 : Math.sin((Math.PI / 2) * mix)
}

/** Whether follower `k` of `count` is a crab under a choice of Crab (Off, Last, Every other, All): canon.h `control()`. */
export function isCrab(choice: number, k: number, count: number): boolean {
  const crab = Math.round(choice)
  return crab === 3 || (crab === 2 && (k & 1) === 1) || (crab === 1 && k === count - 1)
}

/**
 * How far back along the line follower `k` reads, in seconds: canon.h
 * `read()`. Forwards it stands one gap behind the follower before it. A crab
 * starts each gap where the follower before it stands and walks back two
 * seconds a second; `chunk` is how far into the gap the device is.
 */
export function followerBehind(k: number, gap: number, crab: boolean, chunk: number): number {
  return crab ? k * gap + 2 * chunk : (k + 1) * gap
}

// --- The picture ------------------------------------------------------------

/** The share of the reach the last follower stands at, from the shortest Gap to the longest. */
const SHARE_LEAST = 0.5
const SHARE_MOST = 1
const share = (at: number): number => lerp(SHARE_LEAST, SHARE_MOST, at)

/** How long a note is drawn, and how thick: a thread for silence, the most for full scale. */
const NOTE_LONG = 12
const NOTE_THIN = 2
const NOTE_THICK = 6
/** How thick a note is drawn for a level, linear. */
export const noteThickness = (level: number): number =>
  NOTE_THIN + (NOTE_THICK - NOTE_THIN) * heightOfLevel(level)

/** How strongly the line is laid: what a follower will still take up, and what lies past the last of them. */
const HELD = 0.36
const PAST = 0.16
/** The longest the line is kept: five of the longest Gap and a little more, as the device keeps it. */
const KEEPS_SEC = 40

export interface CanonLayout {
  /** Where the picture lies inside the ground. */
  box: Box
  /** The mark for now, where the line is played. */
  now: number
  /** From the mark to where the last follower stands at the longest Gap. */
  reach: number
  /** The rows of the highest and the lowest interval, unison between them, and the height of a semitone. */
  top: number
  bottom: number
  zero: number
  semitone: number
  /** The most semitones a follower moves, either way. */
  range: number
  /** The line the gap is measured on, and the one the round returns along. */
  foot: number
  back: number
  /** How many followers play, the gap in seconds, and how far the line travels in a second. */
  count: number
  gap: number
  pxPerSec: number
  /** Where each follower takes up the line: one gap apart from the mark on. */
  entries: number[]
  /** The row of an interval in semitones. */
  rowOf(semitones: number): number
}

/** Where everything stands, from the size and the settings alone. */
export function canonLayout(view: DisplayView): CanonLayout {
  const box: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const now = Math.round(box.x + Math.min(0.2 * box.w, 28))
  const reach = Math.max(8, box.x + box.w - NOTE_LONG - 1 - now)
  const foot = box.y + box.h - 5.5
  const top = box.y + 7
  const bottom = Math.max(top + 2, foot - 9)
  const range = Math.max(1, view.spec('interval1')?.max ?? 12)
  const semitone = (bottom - top) / (2 * range)
  const zero = (top + bottom) / 2
  const count = clamp(Math.round(view.value('followers')), 1, CANON_VOICES)
  const gap = Math.max(0.001, view.value('gap'))
  const last = reach * share(view.at('gap'))
  const entries: number[] = []
  for (let k = 0; k < count; k++) entries.push(now + (last * (k + 1)) / count)
  return {
    box,
    now,
    reach,
    top,
    bottom,
    zero,
    semitone,
    range,
    foot,
    back: box.y + 2.5,
    count,
    gap,
    pxPerSec: last / (count * gap),
    entries,
    rowOf: (semitones) => zero - clamp(semitones, -range, range) * semitone,
  }
}

const intervalName = (k: number): string => `interval${k + 1}`
/** An interval as it is said, with a real minus: "+7", "−12", "0". */
export function intervalText(semitones: number): string {
  const whole = Math.round(semitones)
  return `${whole > 0 ? '+' : whole < 0 ? '−' : ''}${Math.abs(whole)}`
}

interface CanonState {
  clock: DeviceClock
  /** The level written to the line, by the device's time. */
  line: Tape
  /** How far into the crabs' gap the device is, carried between two readings. */
  chunk: Carried
  /** What each follower plays now, falling back slowly enough to be seen. */
  played: Float32Array
}

/** Pixels between two points of the line's outline. */
const STEP = 2
const heights = new Float32Array(1024)

/** The line between `from` and `to` as an outline about the unison row; silence is a line one pixel high. */
function outline(
  frame: Pick<DisplayFrame, 'ctx' | 'colours'>,
  lay: CanonLayout,
  half: number,
  from: number,
  to: number,
  level: (x: number) => number,
  alpha: number,
): void {
  const { ctx } = frame
  if (!(to - from >= 1)) return
  const count = Math.min(heights.length, Math.ceil((to - from) / STEP) + 1)
  const step = (to - from) / (count - 1)
  for (let i = 0; i < count; i++) {
    heights[i] = Math.max(0.5, heightOfLevel(level(from + i * step)) * half)
  }
  ctx.beginPath()
  ctx.moveTo(from, lay.zero - heights[0])
  for (let i = 1; i < count; i++) ctx.lineTo(from + i * step, lay.zero - heights[i])
  for (let i = count - 1; i >= 0; i--) ctx.lineTo(from + i * step, lay.zero + heights[i])
  ctx.closePath()
  ctx.globalAlpha = alpha
  ctx.fillStyle = frame.colours.ink
  ctx.fill()
  ctx.globalAlpha = 1
}

const canon = plateDisplay<CanonState>({
  place: 'window',
  columns: 2,
  params: [
    'followers',
    'gap',
    'interval1',
    'interval2',
    'interval3',
    'interval4',
    'crab',
    'fade',
    'round',
    'mix',
  ],
  live: { meters: true, settle: 9 },
  info: 'The line travels right from the mark where it is played. Each follower takes it up one gap further on and plays it as a note at the height of its interval, and a crab runs back along it. Drag a note up or down for its interval and the point at the foot for the gap.',
  init: () => ({
    clock: deviceClock(),
    line: new Tape(KEEPS_SEC),
    chunk: carried(),
    played: new Float32Array(CANON_VOICES),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const lay = canonLayout(frame)
    const { box, now, zero, count, gap, pxPerSec, entries } = lay
    const right = box.x + box.w
    const wet = wetGain(frame.value('mix'))
    const fade = frame.value('fade')
    const crabs = frame.value('crab')
    const round = frame.value('round')

    // canon.h `meter()`: 0 its running time, -1 while it sleeps and the line
    // is forgotten; 1 the level written to the line; 2 how far into the gap the
    // crabs count it is; 3 to 6 what each follower plays, before Mix.
    const reading = frame.powered && frame.hasMeter('clock')
    const ran = reading ? frame.meter('clock') : -1
    const awake = ran >= 0
    tick(state.clock, frame.now, ran, awake, true)
    if (awake) state.line.push(state.clock.time, frame.meter('level'))
    else if (reading) state.line.clear()
    let chunk = 0
    if (awake) {
      chunk = carry(state.chunk, clamp(frame.meter('chunk'), 0, gap), 1, state.clock.dt)
      chunk = clamp(chunk, 0, gap)
    } else state.chunk.set = false
    for (let k = 0; k < CANON_VOICES; k++) {
      const level = awake && k < count ? frame.meter(`level${k + 1}`) : 0
      state.played[k] = follow(state.played[k], level > 0 ? level : 0, frame.dt, 0, 0.12)
    }

    // The scale: unison, and the furthest a follower moves either way.
    for (const semitones of [lay.range, 0, -lay.range]) {
      const y = lay.rowOf(semitones)
      rule(ctx, now - 3, y, right, y, {
        colour: colours.ink,
        alpha: semitones === 0 ? INK.rule : INK.grid,
      })
      text(frame, intervalText(semitones), now - 5, y, { align: 'right', baseline: 'middle' })
    }

    // The line, travelling right from the mark: what a follower will still
    // take up, and fainter what the last of them has left behind.
    const half = Math.min(9, (lay.bottom - lay.top) * 0.13)
    let furthest = 0
    for (let k = 0; k < count; k++) {
      const crab = isCrab(crabs, k, count)
      furthest = Math.max(furthest, followerBehind(k, gap, crab, crab ? gap : 0))
    }
    const used = Math.min(right, now + furthest * pxPerSec)
    const level = (x: number): number =>
      state.line.over((x - now - STEP / 2) / pxPerSec, (x - now + STEP / 2) / pxPerSec)
    outline(frame, lay, half, now, used, level, HELD)
    outline(frame, lay, half, used, right, level, PAST)

    // The round: the last follower's way back to the mark.
    if (round > 0 && count > 0) {
      const from = Math.round(entries[count - 1]) + 0.5
      const strength = lerp(INK.rule, INK.trace, round / (frame.spec('round')?.max ?? 0.95))
      trace(
        ctx,
        [
          [from, lay.rowOf(frame.value(intervalName(count - 1)))],
          [from, lay.back],
          [now + 5, lay.back],
        ],
        { colour: colours.ink, width: 1, alpha: strength, dash: [2, 2] },
      )
      ctx.beginPath()
      ctx.moveTo(now + 1, lay.back)
      ctx.lineTo(now + 6, lay.back - 2.5)
      ctx.lineTo(now + 6, lay.back + 2.5)
      ctx.closePath()
      ctx.globalAlpha = strength
      ctx.fillStyle = colours.ink
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // The mark for now.
    rule(ctx, now, box.y, now, lay.bottom + 3, { colour: colours.ink, alpha: INK.text })

    // The stems: where each follower takes the line. One that plays forwards
    // stands; a crab runs right along the line and its stem leans after it.
    clipped(ctx, { x: now, y: box.y, w: right - now, h: box.h }, () => {
      for (let k = 0; k < count; k++) {
        const x = entries[k]
        const y = lay.rowOf(frame.value(intervalName(k)))
        const sounding = state.played[k] * wet > 0.003
        const crab = isCrab(crabs, k, count)
        let at = now + followerBehind(k, gap, crab, chunk) * pxPerSec
        let on = zero
        if (at > right + 8) {
          // Past the edge: the stem is cut where it leaves the picture.
          on = y + ((zero - y) * (right + 8 - x)) / (at - x)
          at = right + 8
        }
        trace(
          ctx,
          [
            [crab ? at : Math.round(at) + 0.5, on],
            [crab ? x : Math.round(x) + 0.5, y],
          ],
          {
            colour: sounding ? colours.accent : colours.ink,
            width: 1,
            alpha: sounding ? 1 : INK.back,
          },
        )
        if (crab && on === zero) {
          // The way it runs: with the line, and faster.
          ctx.beginPath()
          ctx.moveTo(at + 4.5, zero)
          ctx.lineTo(at, zero - 3)
          ctx.lineTo(at, zero + 3)
          ctx.closePath()
          ctx.fillStyle = sounding ? colours.accent : colours.ink
          ctx.fill()
        }
      }
    })

    // The notes: as thick as a full-scale line would come back through that
    // follower and Mix, and filled as far as what it plays now.
    const apart = count > 0 ? (entries[count - 1] - now) / count : lay.reach
    const long = clamp(apart - 4, 6, NOTE_LONG)
    for (let k = 0; k < count; k++) {
      const x = entries[k]
      const semitones = Math.round(frame.value(intervalName(k)))
      const y = lay.rowOf(semitones)
      const thick = noteThickness(followerGain(k, count, fade) * wet)
      fillRect(ctx, { x, y: y - thick / 2, w: long, h: thick }, colours.plate)
      const playing = state.played[k] * wet
      if (heightOfLevel(playing) > 0) {
        const lit = noteThickness(playing)
        fillRect(ctx, { x, y: y - lit / 2, w: long, h: lit }, colours.accent)
      }
      ctx.globalAlpha = INK.text
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.strokeRect(x, y - thick / 2, long, thick)
      ctx.globalAlpha = 1
      const key = intervalName(k)
      handle(frame, x, y, { hot: frame.hot === key, radius: 3 })
      // Its interval in figures, when there is room between two followers or it is in hand.
      if (apart >= 18 || frame.hot === key) {
        const above = y - thick / 2 - 4
        const below = y + thick / 2 + 10
        const roomAbove = above - 8 >= lay.back + 3
        const roomBelow = below <= lay.foot - 5
        const up = semitones >= 0 ? roomAbove || !roomBelow : !roomBelow && roomAbove
        // The figures of a follower at the far right end at the edge of the picture.
        const words = intervalText(semitones)
        ctx.font = `8px ${frame.fontFamily}`
        const fits = x + 5 + Math.ceil(ctx.measureText(words).width) + 2 <= right
        if (fits) label(frame, words, x + 5, up ? above : below)
        else label(frame, words, right - 2, up ? above : below, 'right')
      }
    }

    // The gap along the foot: from one entry to the next, with its length in words.
    const to = entries[count - 1]
    const from = count > 1 ? entries[count - 2] : now
    const words = timeText(gap)
    ctx.font = `8px ${frame.fontFamily}`
    const wide = ctx.measureText(words).width
    for (let k = -1; k < count; k++) {
      const x = k < 0 ? now : entries[k]
      rule(ctx, x, lay.foot - 3, x, lay.foot + 3, { colour: colours.ink, alpha: INK.back })
    }
    rule(ctx, from, lay.foot, to, lay.foot, { colour: colours.ink, alpha: INK.back })
    // The words stand after the gap when there is room, inside it when it is
    // long enough, and before it otherwise.
    if (to + 8 + wide <= right) text(frame, words, to + 7, lay.foot + 3)
    else if (to - from >= wide + 14) label(frame, words, from + 6, lay.foot + 3)
    else label(frame, words, Math.max(box.x + wide + 2, from - 6), lay.foot + 3, 'right')
    handle(frame, to, lay.foot, { hot: frame.hot === 'gap', radius: 3 })
  },
  handles: (view) => {
    const lay = canonLayout(view)
    const out: DisplayHandle[] = []
    for (let k = 0; k < lay.count; k++) {
      const key = intervalName(k)
      const spec = view.spec(key)
      out.push({
        key,
        name: `Interval ${k + 1}`,
        x: lay.entries[k],
        y: lay.rowOf(Math.round(view.value(key))),
        // Up and down only: a follower's place across is the gap's.
        drag: (_x: number, y: number) => ({
          [key]: clamp(Math.round((lay.zero - y) / lay.semitone), -lay.range, lay.range) + 0,
        }),
        reset: () => ({ [key]: spec?.default ?? 0 }),
      })
    }
    const spec = view.spec('gap')
    out.push({
      key: 'gap',
      name: 'Gap',
      x: lay.entries[lay.count - 1],
      y: lay.foot,
      // Across only, on the knob's own taper.
      drag: (x: number) => ({
        gap: spec
          ? denormalizeParam(
              spec,
              ((x - lay.now) / lay.reach - SHARE_LEAST) / (SHARE_MOST - SHARE_LEAST),
            )
          : 0,
      }),
      reset: () => ({ gap: spec?.default ?? 1.5 }),
    })
    return out
  },
})

export const CANON_FACES: Readonly<Record<string, PlateFace>> = {
  canon: { display: canon, face: ['followers', 'crab', 'round', 'mix'] },
}
