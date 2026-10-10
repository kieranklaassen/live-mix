// The display of Stretch: what was played, and the reader that crawls through it.
//
// It speaks the language of the loop displays (`loops.ts`): the recording lies
// along the strip as the outline of its level, the newest at the right under
// the write head, and the reader is an upright mark in the accent with a flag
// that points the way it reads. What is its own: the reader falls behind as
// the recording runs away under it, the line ahead of it is what it will
// still play before Memory is used up and it runs up to the present, and
// beside the recording stands the window it reads, drawn at its length, with
// its foot to drag. Where the reader stands and how fast it moves are the
// device's readings; the outline is the level it reports having recorded,
// kept here by its own recording clock, which stands while Freeze is on.

import { denormalizeParam } from '../../../core/params'
import {
  INK,
  clamp,
  clipped,
  fillTo,
  ground,
  handle,
  label,
  rule,
  text,
  trace,
  type Box,
  type Point,
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

type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>
type Size = Pick<DisplayView, 'width' | 'height'>

// --- The device's own numbers (cpp/devices/stretch/stretch.h) ---------------

/** `kFrames`: the window of each Window choice, in samples. */
export const STRETCH_FRAMES = [2048, 4096, 8192, 16384] as const
const LONGEST_FRAME = STRETCH_FRAMES[STRETCH_FRAMES.length - 1]

/** The window of a Window choice in samples; a value between two choices is the nearer one, as `size_of` has it. */
export function stretchFrame(choice: number): number {
  return STRETCH_FRAMES[clamp(Math.round(choice), 0, STRETCH_FRAMES.length - 1)]
}

/** The Hann window the reader lays over the recording (`window_`): 0 at both ends, 1 in the middle; `at` is 0..1. */
export function hann(at: number): number {
  return at <= 0 || at >= 1 ? 0 : 0.5 - 0.5 * Math.cos(2 * Math.PI * at)
}

/**
 * How many seconds of the recording the reader still plays before Memory is
 * used up, from `behind` seconds back. `tick()` moves it on by Hop / Stretch
 * for every Hop recorded, so it falls behind by (1 - 1/Stretch) a second and
 * reaches Memory after (Memory - behind) / (1 - 1/Stretch) seconds, in which
 * it has read 1/Stretch of that.
 */
export function stretchAhead(behind: number, memory: number, stretch: number): number {
  return Math.max(0, memory - behind) / Math.max(1e-6, stretch - 1)
}

/** How fast the reader falls behind, in seconds a second: the recording's speed less its own. */
export function stretchDrift(speed: number, frozen: boolean): number {
  return (frozen ? 0 : 1) - speed
}

/** A stretch as it is said: "2.5×", "8×", "100×". */
export function stretchText(stretch: number): string {
  return `${stretch >= 9.95 ? Math.round(stretch) : stretch.toFixed(1).replace(/\.0$/, '')}×`
}

// --- Where things stand -----------------------------------------------------

/** How strongly the recording is laid: what the reader has still to reach, and what lies behind it. */
const HELD = 0.36
const PAST = 0.16

/** The share of the reach Memory takes at a knob position: a short Memory keeps room to grow into. */
const MEMORY_LEAST = 0.3
const memoryShare = (at: number): number => MEMORY_LEAST + (1 - MEMORY_LEAST) * at
/** The longest stretch of recording the strip can span: 20 s on all of the reach. */
const KEEPS_SEC = 21

export interface StretchLanes {
  /** Where the recording lies. */
  tape: Box
  /** The line Memory's span is drawn on, under the recording. */
  foot: number
  /** Where the write head stands: the right end. */
  head: number
  /** From the left end of the recording to the write head. */
  reach: number
  /** Where the window is drawn at its length: the whole width is the longest window. */
  pane: Box
  /** The baseline of the pane's words. */
  words: number
}

/**
 * A low strip has the window to the right of the recording; a display with
 * height to spare (an upright plate) has it underneath, at the full width.
 */
export function stretchLanes(size: Size): StretchLanes {
  const { width, height } = size
  if (height >= 80) {
    const tall = Math.round((height - 46) * 0.62)
    const tape: Box = { x: 4, y: 4, w: width - 8, h: tall }
    const head = tape.x + tape.w - 5
    const paneTop = tape.y + tall + 20
    const pane: Box = { x: 5, y: paneTop, w: width - 10, h: Math.max(8, height - paneTop - 14) }
    return { tape, foot: tape.y + tall + 8.5, head, reach: head - tape.x, pane, words: height - 4 }
  }
  const paneWide = clamp(Math.round(width * 0.27), 40, 64)
  const tape: Box = { x: 4, y: 4, w: width - 14 - paneWide, h: Math.max(8, height - 17) }
  const head = tape.x + tape.w - 5
  const pane: Box = { x: width - 5 - paneWide, y: 6, w: paneWide, h: Math.max(6, height - 23) }
  return { tape, foot: height - 6.5, head, reach: head - tape.x, pane, words: height - 3.5 }
}

/** Pixels a second of recording takes, at this Memory. */
function pxPerSec(view: DisplayView, lay: StretchLanes): number {
  return (lay.reach * memoryShare(view.at('memory'))) / Math.max(0.01, view.value('memory'))
}

/** How far along the pane a window of `frame` samples ends. */
const paneEnd = (lay: StretchLanes, frame: number): number =>
  lay.pane.x + (lay.pane.w * frame) / LONGEST_FRAME

// --- Drawing ----------------------------------------------------------------

const STEP = 2
const heights = new Float32Array(1024)

/** The recording between `from` and `to` as an outline about the middle of the box; silence is a line one pixel high. */
function held(
  frame: Paint,
  box: Box,
  from: number,
  to: number,
  level: (x: number) => number,
  alpha: number,
): void {
  const { ctx } = frame
  const left = Math.max(box.x, from)
  const right = Math.min(box.x + box.w, to)
  if (!(right - left >= 1)) return
  const middle = box.y + box.h / 2
  const half = box.h / 2 - 0.5
  const count = Math.min(heights.length, Math.ceil((right - left) / STEP) + 1)
  const step = (right - left) / (count - 1)
  for (let i = 0; i < count; i++)
    heights[i] = Math.max(0.5, heightOfLevel(level(left + i * step)) * half)
  ctx.beginPath()
  ctx.moveTo(left, middle - heights[0])
  for (let i = 1; i < count; i++) ctx.lineTo(left + i * step, middle - heights[i])
  for (let i = count - 1; i >= 0; i--) ctx.lineTo(left + i * step, middle + heights[i])
  ctx.closePath()
  ctx.globalAlpha = alpha
  ctx.fillStyle = frame.colours.ink
  ctx.fill()
  ctx.globalAlpha = 1
}

/** Upright lines a second apart behind the recording (every fifth or tenth when they would crowd), moving with it. */
function secondsGrid(
  frame: Paint,
  box: Box,
  zero: number,
  perSec: number,
  travelled: number,
): void {
  if (!(perSec > 0)) return
  const every = perSec >= 12 ? 1 : perSec >= 2.4 ? 5 : 10
  const reach = Math.min((zero - box.x) / perSec, 400 * every)
  const first = travelled > 0 ? travelled % every : every
  for (let seconds = first; seconds <= reach; seconds += every) {
    const x = zero - seconds * perSec
    rule(frame.ctx, x, box.y, x, box.y + box.h, { colour: frame.colours.ink, alpha: INK.grid })
  }
}

/** The write head: an upright line in the ink with a mark on top, filled while it records. */
function writeHead(frame: Paint, box: Box, x: number, recording: boolean): void {
  const { ctx, colours } = frame
  rule(ctx, x, box.y, x, box.y + box.h, { colour: colours.ink, alpha: INK.text })
  const at = Math.round(x) + 0.5
  ctx.beginPath()
  ctx.moveTo(at - 3.5, box.y - 1.5)
  ctx.lineTo(at + 3.5, box.y - 1.5)
  ctx.lineTo(at, box.y + 4)
  ctx.closePath()
  ctx.fillStyle = recording ? colours.ink : colours.plate
  ctx.fill()
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.stroke()
}

/** How long the reader's flag is at a speed: nothing when it stands, longer the faster it reads, no longer past twice real time. */
export function flagLength(speed: number): number {
  const fast = Math.min(2, Math.abs(speed))
  return fast > 0.005 ? 2.5 + 3 * fast : 0
}

/** The reader: an upright line with a flag on top that points the way it reads (right is forwards in time). */
function reader(
  frame: Paint,
  box: Box,
  x: number,
  speed: number,
  colour: string,
  alpha: number,
): void {
  const { ctx } = frame
  ctx.globalAlpha = alpha
  ctx.strokeStyle = colour
  ctx.fillStyle = colour
  ctx.lineWidth = 1.5
  ctx.lineCap = 'butt'
  ctx.beginPath()
  ctx.moveTo(x, box.y)
  ctx.lineTo(x, box.y + box.h)
  ctx.stroke()
  const long = flagLength(speed)
  if (long > 0) {
    ctx.beginPath()
    ctx.moveTo(x, box.y - 0.5)
    ctx.lineTo(x + long, box.y + 3)
    ctx.lineTo(x, box.y + 6.5)
    ctx.closePath()
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

// --- Stretch ----------------------------------------------------------------

interface StretchState {
  clock: DeviceClock
  tape: Tape
  reader: Carried
}

const stretch = plateDisplay<StretchState>({
  place: 'strip',
  params: ['stretch', 'window', 'memory', 'freeze', 'mix'],
  live: { meters: true },
  info: 'What you played, newest at the right, and the reader in colour crawling through it far behind the write head. The line ahead of it is what it still plays before it runs up to the present. Drag the left end to set Memory and the foot of the hump to set Window.',
  init: () => ({ clock: deviceClock(), tape: new Tape(KEEPS_SEC), reader: carried() }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const lay = stretchLanes(frame)
    const { tape, head, pane } = lay
    const perSec = pxPerSec(frame, lay)
    const memory = Math.max(0.01, frame.value('memory'))
    const times = Math.max(1.01, frame.value('stretch'))
    const frozen = Math.round(frame.value('freeze')) === 1
    const samples = stretchFrame(frame.value('window'))
    const windowSec = samples / frame.sampleRate
    const longestSec = LONGEST_FRAME / frame.sampleRate

    // stretch.h `meter(3)`: the time recorded, -1 while the device sleeps; it stands while Freeze is on.
    const reading = frame.powered && frame.hasMeter('clock')
    const ran = reading ? frame.meter('clock') : -1
    const awake = ran >= 0
    tick(state.clock, frame.now, ran, awake, true)
    if (awake) state.tape.push(state.clock.time, frame.meter('level'))
    // Asleep there is nothing but silence left to read, and it is forgotten on waking.
    else if (reading) state.tape.clear()
    if (!awake) state.reader.set = false

    // `meter(2)` and `meter(1)`: the reader's speed along the recording, and how far behind the
    // write head it stood at the last frame, carried on between two readings by how fast it falls
    // behind. At rest it waits where it will first read: half a window behind.
    const speed = awake && Number.isFinite(frame.meter('speed')) ? frame.meter('speed') : 0
    const lag = frame.meter('behind')
    const stood = Number.isFinite(lag) ? clamp(lag, 0, memory) : 0
    const behind = awake
      ? clamp(carry(state.reader, stood, stretchDrift(speed, frozen), state.clock.dt), 0, memory)
      : windowSec / 2
    // Only what Mix lets be heard is in colour; the reader is read all the same.
    const heard = awake && frame.value('mix') > 0
    const at = head - behind * perSec
    const limit = head - memory * perSec

    secondsGrid(frame, tape, head, perSec, state.clock.time)
    const level = (x: number): number =>
      state.tape.over((head - x - STEP / 2) / perSec, (head - x + STEP / 2) / perSec)
    clipped(ctx, { x: tape.x - 2, y: 0, w: tape.w + 4, h: frame.height }, () => {
      // Behind the reader lies what the cloud has played; ahead of it, what it has still to reach.
      held(frame, tape, tape.x, at, level, PAST)
      held(frame, tape, at, head, level, HELD)
      rule(ctx, limit, tape.y, limit, tape.y + tape.h, {
        colour: colours.ink,
        alpha: INK.back,
        dash: [2, 2],
      })
      // The stretch of recording under the reader's window.
      const under = Math.max(1, windowSec * perSec)
      ctx.globalAlpha = INK.fill
      ctx.fillStyle = heard ? colours.accent : colours.ink
      ctx.fillRect(at - under / 2, tape.y, under, tape.h)
      ctx.globalAlpha = 1
      // What it still plays before Memory is used up: stretchAhead. Catching up (faster than the
      // recording runs) it goes through all that lies ahead, to where a whole window is written.
      const end =
        speed > 1.001
          ? head - (windowSec / 2) * perSec
          : Math.min(head, at + stretchAhead(behind, memory, times) * perSec)
      if (!frozen && end > at) {
        const y = tape.y + tape.h - 1.5
        rule(ctx, at, y, end, y, {
          colour: heard ? colours.accent : colours.ink,
          alpha: heard ? 1 : INK.back,
          width: 2,
        })
      }
      reader(frame, tape, at, speed, heard ? colours.accent : colours.ink, heard ? 1 : INK.back)
    })
    writeHead(frame, tape, head, !frozen)
    label(frame, stretchText(frame.value('stretch')), tape.x + 3, tape.y + 9)

    // Memory along the foot: from where the reader runs up to the present, to the write head.
    const y = lay.foot
    const words = timeText(memory)
    ctx.font = `8px ${frame.fontFamily}`
    const wide = ctx.measureText(words).width
    if (head - limit >= wide + 16) {
      rule(ctx, limit + wide + 12, y, head, y, { colour: colours.ink, alpha: INK.back })
      text(frame, words, limit + 8, y + 3)
    } else {
      rule(ctx, limit, y, head, y, { colour: colours.ink, alpha: INK.back })
      text(frame, words, Math.max(tape.x + wide, limit - 7), y + 3, { align: 'right' })
    }
    rule(ctx, head, y - 3, head, y + 3, { colour: colours.ink, alpha: INK.back })
    handle(frame, limit, y, { hot: frame.hot === 'memory', radius: 3 })

    // The window at its length: the whole pane is the longest one.
    const base = pane.y + pane.h
    const end = paneEnd(lay, samples)
    rule(ctx, pane.x, base, pane.x + pane.w, base, { colour: colours.ink, alpha: INK.rule })
    for (const stop of STRETCH_FRAMES) {
      const x = paneEnd(lay, stop)
      rule(ctx, x, base, x, base + 3, { colour: colours.ink, alpha: INK.back })
    }
    // An even count, so the middle of the window, its top, is one of the points.
    const count = 2 * Math.max(4, Math.ceil((end - pane.x) / 4))
    const hump: Point[] = []
    const read: Point[] = []
    for (let i = 0; i <= count; i++) {
      const share = i / count
      const x = pane.x + (end - pane.x) * share
      hump.push([x, base - hann(share) * pane.h])
      // What the frame takes in: the recording under the window, times the window.
      const age = behind + windowSec / 2 - share * windowSec
      read.push([x, base - heightOfLevel(hann(share) * state.tape.at(age)) * pane.h])
    }
    fillTo(ctx, hump, base, colours.ink, INK.fill)
    if (heard) fillTo(ctx, read, base, colours.accent, INK.back)
    trace(ctx, hump, { colour: colours.ink, width: 1.5 })
    text(frame, timeText(windowSec), pane.x, lay.words, { alpha: INK.text })
    if (longestSec > 0) handle(frame, end, base, { hot: frame.hot === 'window', radius: 3 })
  },
  handles: (view) => {
    const lay = stretchLanes(view)
    const memory = view.spec('memory')
    const windowSpec = view.spec('window')
    const handles: DisplayHandle[] = [
      {
        key: 'memory',
        name: 'Memory',
        x: lay.head - lay.reach * memoryShare(view.at('memory')),
        y: lay.foot,
        // Across is Memory, on the knob's own taper.
        drag: (x: number) => ({
          memory: memory
            ? denormalizeParam(
                memory,
                clamp(((lay.head - x) / lay.reach - MEMORY_LEAST) / (1 - MEMORY_LEAST), 0, 1),
              )
            : 0,
        }),
        reset: () => ({ memory: memory?.default ?? 0 }),
      },
      {
        key: 'window',
        name: 'Window',
        x: paneEnd(lay, stretchFrame(view.value('window'))),
        y: lay.pane.y + lay.pane.h,
        // The window whose end is nearest under the hand.
        drag: (x: number) => {
          let nearest = 0
          for (let i = 1; i < STRETCH_FRAMES.length; i++) {
            if (
              Math.abs(paneEnd(lay, STRETCH_FRAMES[i]) - x) <
              Math.abs(paneEnd(lay, STRETCH_FRAMES[nearest]) - x)
            )
              nearest = i
          }
          return { window: nearest }
        },
        reset: () => ({ window: windowSpec?.default ?? 0 }),
      },
    ]
    return handles
  },
})

export const STRETCH_FACES: Readonly<Record<string, PlateFace>> = {
  stretch: { display: stretch, face: ['stretch', 'window', 'diffuse', 'mix'] },
}
