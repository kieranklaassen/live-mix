// Displays of the devices that hold sound and play it again: what is held, and where in it the playing stands.
//
// One language for the four. The held sound lies along the strip as the
// outline of its level, the newest at the right. The write head is an upright
// line in the ink with a mark on top; a read head is in the accent, with a
// flag that points the way it plays. A window a device opens on the sound (a
// reversed chunk's fade, a grain) is a lens over the stretch it reads. The
// length of the loop or the chunk is a span along the foot, with its far end
// to drag. Where the heads are is what the device reports; the outline is the
// level it reports having written, kept here by the device's own clock, which
// also says whether the device runs, stands (the sound is paused) or sleeps.

import { denormalizeParam } from '../../../core/params'
import {
  History,
  INK,
  clamp,
  clipped,
  gainToDb,
  ground,
  handle,
  lerp,
  rule,
  text,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>
type Size = Pick<DisplayView, 'width' | 'height'>

// --- What the four share ----------------------------------------------------

/**
 * A level as a share of the height: this many dB from nothing to full scale,
 * bent so that the loud end has the room and a tail still shows as it dies.
 */
const RANGE_DB = 48
export const heightOfLevel = (level: number): number =>
  Math.pow(clamp(1 + gainToDb(level) / RANGE_DB, 0, 1), 1.5)

/** How strongly the held sound is laid: what is in play, and what lies past it. */
const HELD = 0.36
const PAST = 0.16

/** How often the devices report, which is as fine as a level outline can be. */
const SLOT_SEC = 1 / 30
/** With no new reading for this long, the device has stopped: four readings have not come. */
const STALLED_SEC = 0.15

/**
 * The device's time. Each of these devices reports a clock of its own, a
 * number that moves on with every block it works; the display's clock carries
 * it between two readings, and when the number stops moving the device has
 * stopped (the sound is paused) and nothing drawn here may run on without it.
 * It is the device's own word and not a guess from the sound: a drone held at
 * one level runs the tape as a melody does.
 */
export interface DeviceClock {
  /** The device's time now, in seconds, and how much of it passed since the frame before. */
  time: number
  dt: number
  /** The display's clock at the frame before, the device's clock then, and how long it has not moved. */
  seen: number | null
  mark: number
  still: number
  /** Whether `mark` is a reading yet. */
  set: boolean
  /**
   * For a clock that counts seconds: how far the time here stood ahead of the
   * device's at its last reading, and what has been added to it since.
   */
  ahead: number
  carried: number
}

export const deviceClock = (): DeviceClock => ({
  time: 0,
  dt: 0,
  seen: null,
  mark: 0,
  still: 0,
  set: false,
  ahead: 0,
  carried: 0,
})

/** Where the devices' clocks go round, in seconds (`kClockSeconds` in each). */
const LAP_SEC = 64
const lapped = (seconds: number): number => seconds - LAP_SEC * Math.floor(seconds / LAP_SEC)
/** How far apart two times on a device's clock are, the short way round. */
export function apart(a: number, b: number): number {
  const between = lapped(a - b)
  return Math.min(between, LAP_SEC - between)
}

/** How far the time here may stand from the device's before it is put right: under two readings. */
const SLACK_SEC = 0.05

/**
 * Move the device's time on to the display's `now`. `mark` is the device's
 * clock as it was last read, and `runs` whether the device is awake to move
 * it; asleep nothing happens in it, and its time stands.
 *
 * With `timed` the mark counts seconds (round `LAP_SEC`), so it also says how
 * far the device has come. The time here is then held to it: what ran on
 * after a pause, before the pause could be known, is waited out when the
 * sound goes on, and a reading that came late is caught up with. So what is
 * kept by this time stays where the device wrote it.
 */
export function tick(
  clock: DeviceClock,
  now: number,
  mark: number,
  runs: boolean,
  timed = false,
): void {
  const step = clock.seen === null ? 0 : Math.max(0, now - clock.seen)
  clock.seen = now
  let passed = 0
  if (!runs) {
    clock.set = false
    clock.still = 0
    clock.ahead = 0
    clock.carried = 0
  } else {
    const fresh = !clock.set || mark !== clock.mark
    clock.still = fresh ? 0 : clock.still + step
    const slack = Math.max(SLACK_SEC, 1.5 * step)
    passed = clock.still > STALLED_SEC || clock.ahead > slack ? 0 : step
    clock.carried += passed
    if (fresh) {
      if (timed && clock.set) {
        // As far as the mark has moved, by the number of laps nearest to what was carried.
        let moved = lapped(mark - clock.mark)
        moved += LAP_SEC * Math.round((clock.ahead + clock.carried - moved) / LAP_SEC)
        clock.ahead += clock.carried - moved
        if (clock.ahead < -slack) {
          passed -= clock.ahead
          clock.ahead = 0
        }
      }
      clock.carried = 0
      clock.set = true
    }
  }
  clock.mark = mark
  clock.time += passed
  // A long step is time nobody watched: what is carried forward is not carried across it.
  clock.dt = Math.min(passed, 0.25)
}

/**
 * Levels kept by the device's time and read by how long ago they were: the
 * picture of what a write head laid down, as long as the head writes a second
 * of sound a second. More than a second nobody watched is left blank, since
 * what was written then is not known.
 */
export class Tape {
  private readonly past: History
  private latest: number | null = null
  private since: number | null = null

  constructor(readonly seconds: number) {
    const slots = Math.ceil(seconds / SLOT_SEC)
    this.past = new History(slots * SLOT_SEC, slots, 0, 'max')
  }

  /** How far into its newest slot the clock is, 0..1, worked out as `History` picks the slot. */
  private get into(): number {
    return (((this.latest ?? 0) / this.past.seconds) * this.past.slots) % 1
  }

  /** How long it has been kept without a gap, in seconds. */
  get known(): number {
    return this.latest === null || this.since === null ? 0 : this.latest - this.since
  }

  /** The device has forgotten what it held: a blank tape. */
  clear(): void {
    if (this.latest === null) return
    this.past.clear()
    this.latest = null
    this.since = null
  }

  /** Add the level written at `now`. */
  push(now: number, level: number): void {
    if (this.latest !== null && now - this.latest > 1) {
      this.past.push(this.latest + SLOT_SEC, 0)
      this.since = now
    }
    this.since ??= now
    this.past.push(now, Number.isFinite(level) && level > 0 ? level : 0)
    this.latest = now
  }

  /** The level `age` seconds before the latest reading, read between two slots. */
  at(age: number): number {
    if (this.latest === null || !(age >= 0)) return 0
    const place = age / SLOT_SEC - this.into + 0.5
    if (place <= 0) return this.past.at(0)
    const slot = Math.floor(place)
    if (slot >= this.past.slots - 1) return 0
    const near = this.past.at(slot)
    return near + (this.past.at(slot + 1) - near) * (place - slot)
  }

  /** The highest level between two ages, so a peak narrower than a pixel is kept. */
  over(from: number, to: number): number {
    let level = Math.max(this.at(from), this.at(to))
    if (this.latest === null || to - from <= SLOT_SEC) return level
    const into = this.into
    const first = Math.max(0, Math.ceil(from / SLOT_SEC - into + 0.5))
    const last = Math.min(this.past.slots - 2, Math.floor(to / SLOT_SEC - into + 0.5))
    for (let slot = first; slot <= last; slot++) level = Math.max(level, this.past.at(slot))
    return level
  }
}

/**
 * A reading that moves at a known speed, carried forward between two
 * arrivals so its mark moves smoothly and stays with the device (what
 * `trackPhase` does for a phase, for a value that does not go round). When
 * no new reading comes it stops: the device has, and the mark must not run on
 * without it.
 */
export interface Carried {
  value: number
  reading: number
  set: boolean
  /** Seconds since the reading last moved. */
  still: number
}

export const carried = (): Carried => ({ value: 0, reading: 0, set: false, still: 0 })

export function carry(track: Carried, reading: number, perSec: number, dt: number): number {
  if (!track.set) {
    track.value = reading
    track.reading = reading
    track.set = true
    track.still = 0
    return reading
  }
  const next = track.value + perSec * dt
  if (reading === track.reading) {
    track.still += dt
    if (track.still <= STALLED_SEC) track.value = next
  } else {
    // A new reading: go to it, unless carrying forward already put us within a step of it.
    const ahead = next - reading
    track.reading = reading
    track.still = 0
    track.value = Math.abs(ahead) < Math.abs(perSec) * 0.08 ? next - ahead * 0.5 : reading
  }
  return track.value
}

interface Lanes {
  /** Where the sound lies. */
  tape: Box
  /** The line the span is drawn on, under the sound. */
  foot: number
  /** Where the write head stands when it stands still: the right end. */
  head: number
  /** From the left end of the sound to the write head. */
  reach: number
}

function lanes(size: Size): Lanes {
  const tape: Box = { x: 4, y: 4, w: size.width - 8, h: Math.max(8, size.height - 17) }
  const head = tape.x + tape.w - 5
  return { tape, foot: size.height - 6.5, head, reach: head - tape.x }
}

/** Pixels between two points of an outline. */
const STEP = 2
const heights = new Float32Array(1024)

/**
 * The held sound between `from` and `to` as an outline about the middle of
 * the box: `level(x)` is its level there, linear, 1 at full scale. Silence is
 * a line one pixel high, so a blank stretch still reads as tape. With
 * `stroke` it is drawn as its two edges, for sound laid over other sound.
 */
function held(
  frame: Paint,
  box: Box,
  from: number,
  to: number,
  level: (x: number) => number,
  colour: string,
  alpha: number,
  stroke = false,
): void {
  const { ctx } = frame
  const left = Math.max(box.x, from)
  const right = Math.min(box.x + box.w, to)
  if (!(right - left >= 1)) return
  const middle = box.y + box.h / 2
  const half = box.h / 2 - 0.5
  const count = Math.min(heights.length, Math.ceil((right - left) / STEP) + 1)
  const step = (right - left) / (count - 1)
  for (let i = 0; i < count; i++) {
    heights[i] = Math.max(0.5, heightOfLevel(level(left + i * step)) * half)
  }
  ctx.beginPath()
  for (let i = 0; i < count; i++) {
    if (i === 0) ctx.moveTo(left, middle - heights[0])
    else ctx.lineTo(left + i * step, middle - heights[i])
  }
  if (stroke) {
    ctx.moveTo(left, middle + heights[0])
    for (let i = 1; i < count; i++) ctx.lineTo(left + i * step, middle + heights[i])
    ctx.globalAlpha = alpha
    ctx.strokeStyle = colour
    ctx.lineWidth = 1
    ctx.lineJoin = 'round'
    ctx.stroke()
  } else {
    for (let i = count - 1; i >= 0; i--) ctx.lineTo(left + i * step, middle + heights[i])
    ctx.closePath()
    ctx.globalAlpha = alpha
    ctx.fillStyle = colour
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/**
 * Upright lines a second apart behind the sound; every fifth or tenth when
 * they would crowd. They are marks on the sound itself: with `travelled`, the
 * seconds the sound has run, they move away from `zero` as it is written, so a
 * tape that runs is seen to run even while what is on it does not change.
 */
function secondsGrid(frame: Paint, box: Box, zero: number, pxPerSec: number, travelled = 0): void {
  if (!(pxPerSec > 0)) return
  const every = pxPerSec >= 12 ? 1 : pxPerSec >= 2.4 ? 5 : 10
  const reach = Math.min((zero - box.x) / pxPerSec, 400 * every)
  const first = travelled > 0 ? travelled % every : every
  for (let seconds = first; seconds <= reach; seconds += every) {
    const x = zero - seconds * pxPerSec
    rule(frame.ctx, x, box.y, x, box.y + box.h, { colour: frame.colours.ink, alpha: INK.grid })
  }
}

/** The write head: an upright line in the ink with a mark on top, filled while it records. */
function writeHead(frame: Paint, box: Box, x: number, recording = true): void {
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

/**
 * A read head: an upright line with a flag on top that points the way it
 * plays along the sound (right is forwards) and is longer the faster it goes.
 * `reach` is how much of the height it takes (a reader that is fading in).
 */
function readHead(
  frame: Paint,
  box: Box,
  x: number,
  speed: number,
  colour: string,
  alpha = 1,
  reach = 1,
): void {
  const { ctx } = frame
  if (!(x >= box.x - 8 && x <= box.x + box.w + 8)) return
  const middle = box.y + box.h / 2
  const half = (box.h / 2) * clamp(reach, 0.25, 1)
  ctx.globalAlpha = alpha
  ctx.strokeStyle = colour
  ctx.fillStyle = colour
  ctx.lineWidth = 1.5
  ctx.lineCap = 'butt'
  ctx.beginPath()
  ctx.moveTo(x, middle - half)
  ctx.lineTo(x, middle + half)
  ctx.stroke()
  const fast = Math.min(2, Math.abs(speed))
  if (fast > 0.05) {
    const long = (speed < 0 ? -1 : 1) * (2.5 + 3 * fast)
    ctx.beginPath()
    ctx.moveTo(x, middle - half - 0.5)
    ctx.lineTo(x + long, middle - half + 3)
    ctx.lineTo(x, middle - half + 6.5)
    ctx.closePath()
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/** A length as it is said: "600 ms", "1.8 s", "30 s". */
export function timeText(seconds: number): string {
  if (seconds < 0.9995) return `${Math.round(seconds * 1000)} ms`
  return `${seconds >= 9.95 ? Math.round(seconds) : seconds.toFixed(1).replace(/\.0$/, '')} s`
}

/**
 * A length along the foot: a line from `from` to `to` with a tick at each
 * end, what it measures in words beside the far end, and the far end as a
 * handle when it can be dragged.
 */
function span(
  frame: DisplayFrame,
  lay: Lanes,
  from: number,
  to: number,
  words: string,
  key: string | null,
): void {
  const { ctx, colours } = frame
  const y = lay.foot
  ctx.font = `8px ${frame.fontFamily}`
  const wide = ctx.measureText(words).width
  // The words stand inside the span when there is room, before its far end
  // when there is room there, and after it otherwise.
  const inside = to - from >= wide + 16
  const before = !inside && from - 8 - wide >= lay.tape.x
  if (inside) {
    rule(ctx, from + wide + 12, y, to, y, { colour: colours.ink, alpha: INK.back })
    text(frame, words, from + 8, y + 3)
  } else if (before) {
    rule(ctx, from, y, to, y, { colour: colours.ink, alpha: INK.back })
    text(frame, words, from - 7, y + 3, { align: 'right' })
  } else {
    rule(ctx, from, y, Math.min(to, from + 5), y, { colour: colours.ink, alpha: INK.back })
    text(frame, words, Math.min(from + 8, frame.width - wide - 3), y + 3)
  }
  rule(ctx, to, y - 3, to, y + 3, { colour: colours.ink, alpha: INK.back })
  if (key === null) rule(ctx, from, y - 3, from, y + 3, { colour: colours.ink, alpha: INK.back })
  if (key !== null) handle(frame, from, y, { hot: frame.hot === key, radius: 3 })
}

/** The share of the reach a loop takes at a knob position: a short loop keeps room to grow into. */
const LOOP_LEAST = 0.3
const loopShare = (at: number): number => LOOP_LEAST + (1 - LOOP_LEAST) * at

/** The handle at the far end of a loop: across is Length, on the knob's own taper. */
function lengthHandle(view: DisplayView, param: string, name: string): DisplayHandle {
  const lay = lanes(view)
  const spec = view.spec(param)
  return {
    key: param,
    name,
    x: lay.head - lay.reach * loopShare(view.at(param)),
    y: lay.foot,
    drag: (x: number) => ({
      [param]: spec
        ? denormalizeParam(spec, ((lay.head - x) / lay.reach - LOOP_LEAST) / (1 - LOOP_LEAST))
        : 0,
    }),
    reset: () => ({ [param]: spec?.default ?? 0 }),
  }
}

// --- Tape Loop --------------------------------------------------------------

const TAPE_SPEEDS = [0.5, 1, 2] as const
/** The longest stretch of tape the strip can span: a 1 s loop on the least share of it, or 30 s on all. */
const TAPE_KEEPS_SEC = 31

interface TapeLoopState {
  clock: DeviceClock
  tape: Tape
  head: Carried
}

const tapeLoop = plateDisplay<TapeLoopState>({
  place: 'strip',
  params: ['length', 'speed', 'direction', 'record'],
  live: { meters: true },
  info: 'The tape between the two decks. What is recorded enters at the right and runs left to the far deck one Length later, where it goes round again. The coloured mark is the play head and its flag points the way it plays. Drag the left end to set Length.',
  init: () => ({ clock: deviceClock(), tape: new Tape(TAPE_KEEPS_SEC), head: carried() }),
  draw(frame) {
    const { colours, state } = frame
    ground(frame)
    const lay = lanes(frame)
    const { tape, head } = lay
    const length = Math.max(0.01, frame.value('length'))
    const pxPerSec = (lay.reach * loopShare(frame.at('length'))) / length
    // Until the first reading arrives the length reads 0, which no loop has.
    const reading = frame.powered && frame.hasMeter('clock') && frame.meter('length') > 0
    // tape_loop.h `meter(4)`: the tape's running time, -1 while it is asleep.
    const ran = reading ? frame.meter('clock') : -1
    const awake = ran >= 0
    const asked =
      (TAPE_SPEEDS[Math.round(frame.value('speed'))] ?? 1) *
      (Math.round(frame.value('direction')) === 1 ? -1 : 1)
    // Asleep the motor is where it stopped; it wakes at the speed that is asked.
    const velocity = awake ? frame.meter('speed') : asked
    tick(state.clock, frame.now, ran, awake, true)
    if (awake) state.tape.push(state.clock.time, frame.meter('level'))
    // Asleep the tape is blank, and it is forgotten on waking.
    else if (reading) state.tape.clear()
    if (!awake) state.head.set = false

    // Between the decks, as it glides to where the knob has it.
    const between = awake ? frame.meter('length') : length
    const tap = head - between * pxPerSec
    // tape_loop.h: `phase_ += (1 - velocity) / length_` each sample, the play
    // head's place behind the record head in loops. At rest it is on the tap,
    // which is where `restart()` puts it when the device wakes.
    const behind = awake
      ? carry(state.head, frame.meter('head'), (1 - velocity) / between, state.clock.dt)
      : 1

    secondsGrid(frame, tape, head, pxPerSec, state.clock.time)
    const level = (x: number): number =>
      state.tape.over((head - x - STEP / 2) / pxPerSec, (head - x + STEP / 2) / pxPerSec)
    // Past the far deck the tape still holds the passes before: a longer loop finds them again.
    held(frame, tape, tape.x, tap, level, colours.ink, PAST)
    held(frame, tape, tap, head, level, colours.ink, HELD)
    rule(frame.ctx, tap, tape.y, tap, tape.y + tape.h, {
      colour: colours.ink,
      alpha: INK.back,
      dash: [2, 2],
    })
    // The play head is in the accent while the tape runs under it; at rest it is a ghost in the ink.
    clipped(frame.ctx, { x: tape.x - 2, y: 0, w: tape.w + 4, h: frame.height }, () => {
      const x = head - behind * between * pxPerSec
      if (awake) readHead(frame, tape, x, velocity, colours.accent)
      else readHead(frame, tape, x, velocity, colours.ink, INK.back)
    })
    writeHead(frame, tape, head, Math.round(frame.value('record')) === 0)
    span(frame, lay, head - length * pxPerSec, head, timeText(length), 'length')
  },
  handles: (view) => [lengthHandle(view, 'length', 'Length')],
})

// --- Reverse Delay ----------------------------------------------------------

/** reverse_delay.h `kRates`, by Pitch: Normal, Octave up, Octave down. */
const REVERSE_RATES = [1, 2, 0.5] as const
/**
 * The share of the reach one chunk takes, from the shortest Time to the
 * longest. The end of the span is the handle, so this is also how far a hand
 * moves it from one end of Time to the other: far enough to set it by.
 */
const CHUNK_LEAST = 0.1
const CHUNK_MOST = 0.5
const chunkShare = (at: number): number => lerp(CHUNK_LEAST, CHUNK_MOST, at)
const REVERSE_KEEPS_SEC = 4 / CHUNK_MOST + 0.5

/**
 * The gain of one reversed chunk `since` seconds after its reader started, as
 * reverse_delay.h fades it: in over `fade` on a quarter sine, and out the
 * same way from the moment the next chunk starts, one Time later.
 */
export function chunkGain(since: number, time: number, fade: number): number {
  if (since < 0 || since >= time + fade) return 0
  const rise = since < fade ? Math.sin((Math.PI / 2) * (since / fade)) : 1
  const fall = since > time ? Math.cos((Math.PI / 2) * ((since - time) / fade)) : 1
  return rise * fall
}

/** How long a chunk's fade is, as `launch()` has it: Smooth of the chunk, 4 ms at the least. */
export function chunkFade(time: number, smooth: number): number {
  return clamp(smooth * time, Math.min(0.004, time), time)
}

interface ReverseState {
  clock: DeviceClock
  tape: Tape
  readers: [Carried, Carried]
  /** The last reading of each reader, to tell a new one from the one before. */
  before: [number, number]
  /** When the last chunks started, by the device's time. */
  starts: Float64Array
  next: number
}

const NEVER = -1e12

const reverseDelay = plateDisplay<ReverseState>({
  place: 'strip',
  params: ['time', 'pitch', 'smooth'],
  live: { meters: true },
  info: 'What was just played, newest at the right, cut into chunks one Time long. A coloured head runs back through each chunk as it plays it backwards, and the lens over the chunk is its fade in and out. Drag the end of the span to set Time.',
  init: () => ({
    clock: deviceClock(),
    tape: new Tape(REVERSE_KEEPS_SEC),
    readers: [carried(), carried()],
    before: [0, 0],
    starts: new Float64Array(8).fill(NEVER),
    next: 0,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const lay = lanes(frame)
    const { tape, head } = lay
    const time = Math.max(0.001, frame.value('time') / 1000)
    const pxPerSec = (lay.reach * chunkShare(frame.at('time'))) / time
    const rate = REVERSE_RATES[Math.round(frame.value('pitch'))] ?? 1
    const fade = chunkFade(time, frame.value('smooth'))
    const reading = frame.powered && frame.hasMeter('clock')
    // reverse_delay.h `meter(5)`: its running time, -1 while it is asleep.
    const ran = reading ? frame.meter('clock') : -1
    const awake = ran >= 0
    tick(state.clock, frame.now, ran, awake, true)
    const now = state.clock.time
    if (awake) state.tape.push(now, frame.meter('level'))
    else if (reading) {
      // Asleep the ring is forgotten: nothing of it is played again.
      state.tape.clear()
      state.starts.fill(NEVER)
    }
    const middle = tape.y + tape.h / 2
    const half = tape.h / 2 - 0.5

    const level = (x: number): number =>
      state.tape.over((head - x - STEP / 2) / pxPerSec, (head - x + STEP / 2) / pxPerSec)
    held(frame, tape, tape.x, head, level, colours.ink, HELD)

    // A chunk's window on the sound: its reader started `since` seconds ago at
    // the newest sample and has walked back `rate` seconds of sound a second.
    const window = (since: number, playing: boolean, gain: number): void => {
      const start = head - since * pxPerSec
      const gainAt = (x: number): number => chunkGain((start - x) / pxPerSec / rate, time, fade)
      const far = start - rate * (time + fade) * pxPerSec
      clipped(ctx, { x: tape.x, y: tape.y - 1, w: head - tape.x, h: tape.h + 2 }, () => {
        if (playing) {
          // What it has played so far, as loud as its fade let it be.
          const reader = start - rate * since * pxPerSec
          held(frame, tape, reader, start, (x) => level(x) * gainAt(x), colours.accent, 0.85)
        }
        ctx.beginPath()
        for (let side = -1; side <= 1; side += 2) {
          ctx.moveTo(start, middle)
          for (let x = start; x > Math.max(far, tape.x - STEP); x -= STEP) {
            ctx.lineTo(x, middle + side * gainAt(x) * half)
          }
          ctx.lineTo(far, middle)
        }
        ctx.globalAlpha = INK.back
        ctx.strokeStyle = colours.ink
        ctx.lineWidth = 1
        ctx.lineJoin = 'round'
        ctx.stroke()
        ctx.globalAlpha = 1
        if (playing) {
          const reader = start - rate * since * pxPerSec
          readHead(frame, tape, reader, -rate, colours.accent, 0.35 + 0.65 * gain, gain)
        }
      })
    }

    let playing = 0
    for (let side = 0; side < 2; side++) {
      const behind = reading ? frame.meter(side === 0 ? 'aBehind' : 'bBehind') : 0
      const gain = reading ? clamp(frame.meter(side === 0 ? 'aGain' : 'bGain'), 0, 1) : 0
      const track = state.readers[side]
      if (!(behind > 0)) {
        track.set = false
        state.before[side] = 0
        continue
      }
      // A reader that is nearer than it was is a new one: a chunk has started.
      if (state.before[side] === 0 || behind < state.before[side] * 0.5) {
        track.set = false
        state.starts[state.next] = now - behind / (1 + rate)
        state.next = (state.next + 1) % state.starts.length
      }
      state.before[side] = behind
      // The newest sample runs away from a reader at 1 + rate seconds a second.
      const since = carry(track, behind, 1 + rate, state.clock.dt) / (1 + rate)
      window(since, true, gain)
      playing += 1
    }
    if (playing === 0) {
      // At rest: the window of a chunk that starts now, over the sound it will read.
      window(0, false, 0)
      readHead(frame, tape, head - 9, -rate, colours.ink, INK.back)
    }
    // Where the chunks were cut.
    for (const started of state.starts) {
      const x = head - (now - started) * pxPerSec
      if (reading && x > tape.x && x < head - 1) {
        rule(ctx, x, tape.y, x, tape.y + tape.h, { colour: colours.ink, alpha: INK.rule })
      }
    }
    writeHead(frame, tape, head)
    span(frame, lay, head - time * pxPerSec, head, timeText(time), 'time')
  },
  handles: (view) => {
    const lay = lanes(view)
    const spec = view.spec('time')
    return [
      {
        key: 'time',
        name: 'Time',
        x: lay.head - lay.reach * chunkShare(view.at('time')),
        y: lay.foot,
        drag: (x: number) => ({
          time: spec
            ? denormalizeParam(
                spec,
                ((lay.head - x) / lay.reach - CHUNK_LEAST) / (CHUNK_MOST - CHUNK_LEAST),
              )
            : 0,
        }),
        reset: () => ({ time: spec?.default ?? 600 }),
      },
    ]
  },
})

// --- Grain Delay ------------------------------------------------------------

/** The share of the reach the delay takes, from the shortest Time to the longest. */
const DELAY_LEAST = 0.25
const DELAY_MOST = 0.6
const delayShare = (at: number): number => lerp(DELAY_LEAST, DELAY_MOST, at)
/** The longest the strip spans: Time and Spray at their most, and a reversed grain four octaves up. */
const GRAIN_KEEPS_SEC = 6.5
/** Grains the display follows at once; the device plays 20 at the most. */
const GRAINS = 24

/** A grain's window as `kit::GrainPool` shapes it for this device: a Hann window over its length. */
export const grainWindow = (phase: number): number =>
  phase <= 0 || phase >= 1 ? 0 : 0.5 - 0.5 * Math.cos(2 * Math.PI * phase)

/**
 * How far behind the write point a grain starts, in seconds, as
 * `spawn_grain()` places it so that its middle reads the sample `delay` old:
 * a grain that reads faster than the sound is written, or backwards, starts
 * further back and is kept clear of the write point.
 */
export function grainStartBehind(
  delay: number,
  ratio: number,
  size: number,
  reversed: boolean,
): number {
  if (reversed) return Math.max(delay, 0.5 * (1 + ratio) * size) - 0.5 * size * (1 + ratio)
  const lead = 0.5 * (ratio - 1) * size
  return Math.max(delay, Math.abs(lead)) + lead
}

/** A grain's read speed at a Pitch in semitones, held to three octaves either way as the device holds it. */
const grainRatio = (semitones: number): number => clamp(Math.pow(2, semitones / 12), 1 / 8, 8)

/**
 * The oldest sound a grain of these settings reads, in seconds behind the
 * write point: where the far end of its stretch is when it ends, having
 * started as late as Spray allows. The sound has moved on by Size by then.
 */
export function grainReach(
  time: number,
  spray: number,
  ratio: number,
  size: number,
  backwards: number,
): number {
  const forwards = backwards < 1 ? grainStartBehind(time + spray, ratio, size, false) + size : 0
  const reversed =
    backwards > 0 ? grainStartBehind(time + spray, ratio, size, true) + (1 + ratio) * size : 0
  return Math.max(forwards, reversed)
}

/**
 * How the strip is scaled: Time stands a share of the way along that follows
 * its knob, unless the grains reach further back than the strip would then
 * show; then the strip spans what they reach.
 */
function grainScale(view: DisplayView, at = view.at('time')): { time: number; pxPerSec: number } {
  const spec = view.spec('time')
  const time = Math.max(0.001, (spec ? denormalizeParam(spec, at) : view.value('time')) / 1000)
  const reach = grainReach(
    time,
    view.value('spray') ** 2,
    grainRatio(view.value('pitch')),
    Math.max(0.001, view.value('size') / 1000),
    clamp(view.value('reverse'), 0, 1),
  )
  const spans = Math.max(time / delayShare(at), 1.06 * reach)
  return { time, pxPerSec: lanes(view).reach / spans }
}

interface GrainState {
  clock: DeviceClock
  tape: Tape
  /** When each grain started, by the device's time, and when the sound it starts on was written. */
  born: Float64Array
  from: Float64Array
  /** Its read speed (negative backwards) and its length in seconds. */
  ratio: Float32Array
  size: Float32Array
  next: number
  /** The device's clock at the last reading and when that came, by its time here; -1 before the first. */
  read: number
  readAt: number
  /** Where on the device's clock the newest grain started, as of that reading. */
  newest: number
}

/** Two grains that started within this of each other on the ring are one grain: under three samples. */
const SAME_GRAIN_SEC = 5e-5

/** A grain's lens over the stretch of sound it reads, above the middle forwards and under it backwards. */
function lens(
  frame: Paint,
  box: Box,
  from: number,
  to: number,
  down: boolean,
  colour: string,
  fill: number,
  line: number,
): void {
  const { ctx } = frame
  if (Math.max(from, to) < box.x || Math.min(from, to) > box.x + box.w) return
  const middle = box.y + box.h / 2
  const half = (box.h / 2 - 1) * (down ? 1 : -1)
  ctx.beginPath()
  ctx.moveTo(from, middle)
  for (let i = 1; i < 12; i++) {
    ctx.lineTo(from + ((to - from) * i) / 12, middle + half * grainWindow(i / 12))
  }
  ctx.lineTo(to, middle)
  if (fill > 0) {
    ctx.globalAlpha = fill
    ctx.fillStyle = colour
    ctx.fill()
  }
  if (line > 0) {
    ctx.globalAlpha = line
    ctx.strokeStyle = colour
    ctx.lineWidth = 1
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/** Keep a grain the device has started: when, on what sound, how fast and how long. */
function addGrain(
  state: GrainState,
  born: number,
  from: number,
  ratio: number,
  size: number,
): void {
  if (!Number.isFinite(from) || !Number.isFinite(ratio) || ratio === 0) return
  const i = state.next
  state.next = (i + 1) % GRAINS
  state.born[i] = born
  state.from[i] = from
  state.ratio[i] = ratio
  state.size[i] = size
}

const grainDelay = plateDisplay<GrainState>({
  place: 'strip',
  params: ['time', 'spray', 'pitch', 'size', 'density', 'reverse'],
  live: { meters: true },
  info: 'What the delay holds, newest at the right. Each coloured lens is a grain over the stretch of sound it reads, with a tick where it is reading: above the middle it plays forwards, under it backwards. The dashed line is Time, the band past it is Spray. Drag the line to set Time.',
  init: () => ({
    clock: deviceClock(),
    tape: new Tape(GRAIN_KEEPS_SEC),
    born: new Float64Array(GRAINS).fill(NEVER),
    from: new Float64Array(GRAINS),
    ratio: new Float32Array(GRAINS),
    size: new Float32Array(GRAINS),
    next: 0,
    read: -1,
    readAt: 0,
    newest: 0,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const lay = lanes(frame)
    const { tape, head } = lay
    const { time, pxPerSec } = grainScale(frame)
    const size = Math.max(0.001, frame.value('size') / 1000)
    // grain_delay.h `spray_seconds()`: a square-law amount, up to 1 s later.
    const spray = frame.value('spray') ** 2
    const reading = frame.powered && frame.hasMeter('clock')
    // grain_delay.h `meter(1)`: its running time, -1 while it is asleep.
    const ran = reading ? frame.meter('clock') : -1
    const awake = ran >= 0
    tick(state.clock, frame.now, ran, awake, true)
    const now = state.clock.time
    if (awake) {
      state.tape.push(now, frame.meter('level'))
      if (ran !== state.read) {
        // A new reading. A grain is known by where on the ring it started,
        // which is the clock less how far behind the write point that is now.
        const newBehind = frame.meter('newBehind')
        const oldBehind = frame.meter('oldBehind')
        const newest = ran - newBehind
        if (state.read >= 0 && apart(newest, state.newest) > SAME_GRAIN_SEC) {
          // Grains started since the last reading: the device tells of the last
          // two. When they started is not told: somewhere since that reading.
          const two = apart(ran - oldBehind, state.newest) > SAME_GRAIN_SEC
          const waited = clamp(now - state.readAt, 0, 1)
          const ago = Math.min(waited / (two ? 4 : 2), SLOT_SEC / 2)
          addGrain(state, now - ago, now - newBehind, frame.meter('newSpeed'), size)
          if (two) {
            const before = now - ago - Math.min(waited / 2, size)
            addGrain(state, before, now - oldBehind, frame.meter('oldSpeed'), size)
          }
        }
        state.newest = newest
        state.read = ran
        state.readAt = now
      }
    } else {
      state.read = -1
      if (reading) {
        // Asleep: what the ring holds is never played again, and no grain is open.
        state.tape.clear()
        state.born.fill(NEVER)
      }
    }

    const level = (x: number): number =>
      state.tape.over((head - x - STEP / 2) / pxPerSec, (head - x + STEP / 2) / pxPerSec)
    held(frame, tape, tape.x, head, level, colours.ink, HELD)

    // Time, and past it how much later Spray may place a grain.
    const delayed = head - time * pxPerSec
    const sprayed = Math.max(tape.x, delayed - spray * pxPerSec)
    if (delayed - sprayed >= 1) {
      ctx.globalAlpha = INK.grid
      ctx.fillStyle = colours.ink
      ctx.fillRect(sprayed, tape.y, delayed - sprayed, tape.h)
      ctx.globalAlpha = 1
    }
    rule(ctx, delayed, tape.y, delayed, tape.y + tape.h, {
      colour: colours.ink,
      alpha: INK.back,
      dash: [2, 2],
    })

    const middle = tape.y + tape.h / 2
    let open = 0
    clipped(ctx, { x: tape.x, y: tape.y, w: head - tape.x, h: tape.h }, () => {
      for (let i = 0; i < GRAINS; i++) {
        const phase = (now - state.born[i]) / state.size[i]
        if (!reading || !(phase >= 0 && phase < 1)) continue
        open += 1
        // The stretch it reads moves away with the sound; its read point crosses it once.
        const from = head - (now - state.from[i]) * pxPerSec
        const to = from + state.ratio[i] * state.size[i] * pxPerSec
        const down = state.ratio[i] < 0
        const gain = grainWindow(phase)
        lens(frame, tape, from, to, down, colours.accent, 0.15 + 0.35 * gain, 0.2 + 0.5 * gain)
        const at = from + (to - from) * phase
        const tall = Math.max(1.5, gain * (tape.h / 2 - 1))
        rule(ctx, at, middle, at, middle + (down ? tall : -tall), {
          colour: colours.accent,
          width: 1.5,
        })
      }
      if (open === 0) {
        // No grain is open: the grains these settings ask for, as they would
        // lie on the sound at one moment, Size / Density apart.
        const ratio = grainRatio(frame.value('pitch'))
        const backwards = clamp(frame.value('reverse'), 0, 1)
        const grains = clamp(Math.round(frame.value('density')), 1, 8)
        const between = size / frame.value('density')
        for (let k = 0; k < grains; k++) {
          // Grain k started k intervals before the newest, which is half an interval old.
          const shift = (k + 0.5) * between
          for (let way = 0; way < 2; way++) {
            const reversed = way === 1
            const share = reversed ? backwards : 1 - backwards
            if (share < 0.02) continue
            const behind = grainStartBehind(time, ratio, size, reversed) + shift
            const from = head - behind * pxPerSec
            const to = from + (reversed ? -ratio : ratio) * size * pxPerSec
            lens(frame, tape, from, to, reversed, colours.ink, 0, INK.back * share)
          }
        }
      }
    })
    writeHead(frame, tape, head)
    span(frame, lay, delayed, head, timeText(time), 'time')
  },
  handles: (view) => {
    const lay = lanes(view)
    const spec = view.spec('time')
    const placed = (at: number): number => {
      const scale = grainScale(view, at)
      return lay.head - scale.time * scale.pxPerSec
    }
    return [
      {
        key: 'time',
        name: 'Time',
        x: placed(view.at('time')),
        y: lay.foot,
        // The scale moves with Time, so the Time that stands under the
        // pointer is looked for: it only moves away from the head as it grows.
        drag: (x: number) => {
          let low = 0
          let high = 1
          for (let i = 0; i < 24; i++) {
            const middle = (low + high) / 2
            if (placed(middle) > x) low = middle
            else high = middle
          }
          // Past either end of its travel it is at that end, and not a hair short of it.
          const at = low === 0 ? 0 : high === 1 ? 1 : (low + high) / 2
          return { time: spec ? denormalizeParam(spec, at) : 0 }
        },
        reset: () => ({ time: spec?.default ?? 350 }),
      },
    ]
  },
})

// --- Micro Looper -----------------------------------------------------------

/** micro_looper.h `kSpeeds`, by Speed. */
const LOOPER_SPEEDS = [-2, -1, -0.5, 0.5, 1, 2] as const
/** The longest loop, which is how much of a capture the device keeps. */
const CAPTURE_SEC = 8
const CAPTURE_SLOTS = Math.round(CAPTURE_SEC / SLOT_SEC)
const UNKNOWN = -1

/**
 * How far either side of the playhead Smear takes its grains from, in
 * seconds of the loop: micro_looper.h `spawn()`, 20 ms growing to 300 ms and
 * never more than a quarter of the loop.
 */
export function smearReach(smear: number, length: number): number {
  return Math.min(0.02 + 0.28 * smear, 0.25 * length)
}

interface LooperState {
  clock: DeviceClock
  /** What was played, as the looper's memory heard it. */
  heard: Tape
  /** The capture that is playing: its level by how long before its end, in slots; UNKNOWN where nobody saw. */
  loop: Float32Array
  holds: boolean
  age: number
  place: Carried
  /** The slot the playhead was in at the last frame, to fill the ones it passed. */
  slot: number
}

const microLooper = plateDisplay<LooperState>({
  place: 'strip',
  params: ['length', 'speed', 'smear'],
  live: { meters: true, signal: true },
  info: 'What the looper remembers, newest at the right, and the span of it that is or would be the loop. While a loop plays it stands still, as tall as Fade has left it, and the coloured head moves through it the way it plays. Drag the left end of the span to set Length.',
  init: () => ({
    clock: deviceClock(),
    heard: new Tape(CAPTURE_SEC + 1),
    loop: new Float32Array(CAPTURE_SLOTS).fill(UNKNOWN),
    holds: false,
    age: 0,
    place: carried(),
    slot: -1,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const lay = lanes(frame)
    const { tape, head } = lay
    const length = Math.max(0.01, frame.value('length'))
    const pxPerSec = (lay.reach * loopShare(frame.at('length'))) / length
    const start = head - length * pxPerSec
    const reading = frame.powered && frame.hasMeter('age')
    // micro_looper.h `meter(4)`: over 0 it is how long ago the loop that plays
    // was taken; under 0 there is no loop and it is the memory's running time;
    // 0 is asleep. Either way it moves on with every block the looper works.
    const aged = reading ? frame.meter('age') : 0
    const awake = aged !== 0
    const playing = aged > 0
    const gain = playing ? clamp(frame.meter('gain'), 0, 1) : 0
    const wait = awake ? clamp(frame.meter('wait'), 0, length) : 0
    const speed = LOOPER_SPEEDS[Math.round(frame.value('speed'))] ?? 1
    // A loop held for hours has an age too long to show a block's worth; its playhead still moves.
    tick(state.clock, frame.now, aged * 64 + (playing ? frame.meter('place') : 0), awake)

    // The memory records what goes in, and nothing else: the level going in
    // is what it holds. Where the plate was not told what feeds the device the
    // memory is not drawn, and a loop is learnt from the tape under its playhead.
    const input = awake ? (frame.signal?.input ?? null) : null
    if (input) state.heard.push(state.clock.time, input.peak)
    // Asleep the memory is emptied: the looper wakes with nothing to take.
    else if (reading && !awake) state.heard.clear()

    if (playing) {
      const age = aged
      if (!state.holds || age < state.age - 0.05) {
        // A loop was taken: it is the memory as it stood `age` seconds ago,
        // as far back as the memory was watched.
        for (let i = 0; i < CAPTURE_SLOTS; i++) {
          const back = age + i * SLOT_SEC
          state.loop[i] =
            back + SLOT_SEC < state.heard.known ? state.heard.over(back, back + SLOT_SEC) : UNKNOWN
        }
        state.place.set = false
        state.slot = -1
      }
      state.age = age
    }
    state.holds = playing

    const loopLevel = (back: number): number => {
      const at = back / SLOT_SEC - 0.5
      const i = clamp(Math.floor(at), 0, CAPTURE_SLOTS - 2)
      const near = Math.max(0, state.loop[i])
      const far = Math.max(0, state.loop[i + 1])
      return back >= CAPTURE_SEC ? 0 : near + (far - near) * clamp(at - i, 0, 1)
    }

    // While a phrase is played in, the write head crosses the loop it will be.
    const writer = head - wait * pxPerSec
    // A loop stands still, and the seconds with it; the memory runs past its write head.
    if (playing) secondsGrid(frame, tape, head, pxPerSec)
    else secondsGrid(frame, tape, writer, pxPerSec, state.clock.time)
    const memory = (x: number): number =>
      state.heard.over((writer - x - STEP / 2) / pxPerSec, (writer - x + STEP / 2) / pxPerSec)
    let place = 0
    if (playing) {
      // micro_looper.h `play()`: the playhead moves `step` frames a sample
      // through `length` frames; the device reports that in loops a second.
      const turning = frame.meter('speed')
      const carriedTo = carry(state.place, frame.meter('place'), turning, state.clock.dt)
      place = carriedTo - Math.floor(carriedTo)
      // The tape under the playhead is the truth of what the loop holds there.
      const slot = clamp(Math.floor((length * (1 - place)) / SLOT_SEC), 0, CAPTURE_SLOTS - 1)
      const heard = Math.max(0, frame.meter('heard'))
      const passed = state.slot < 0 || Math.abs(slot - state.slot) > 8 ? slot : state.slot
      for (let i = Math.min(slot, passed); i <= Math.max(slot, passed); i++) {
        state.loop[i] = state.loop[i] === UNKNOWN ? heard : lerp(state.loop[i], heard, 0.5)
      }
      state.slot = slot
      const taken = (x: number): number => loopLevel((head - x) / pxPerSec) * gain
      held(frame, tape, tape.x, start, taken, colours.ink, PAST)
      held(frame, tape, start, head, taken, colours.ink, HELD)
      if (wait > 0) held(frame, tape, start, writer, memory, colours.ink, INK.text, true)
    } else {
      held(frame, tape, tape.x, Math.min(start, writer), memory, colours.ink, PAST)
      held(frame, tape, start, writer, memory, colours.ink, HELD)
    }
    rule(ctx, start, tape.y, start, tape.y + tape.h, {
      colour: colours.ink,
      alpha: INK.back,
      dash: [2, 2],
    })

    // The playhead; with no loop, where one would start and which way it would go.
    const turning = playing ? frame.meter('speed') * length : speed
    const at = playing ? start + place * (head - start) : speed < 0 ? head - 4 : start
    const reach = smearReach(frame.value('smear'), length) * pxPerSec
    if (!playing || wait > 0) writeHead(frame, tape, writer)
    else rule(ctx, head, tape.y, head, tape.y + tape.h, { colour: colours.ink, alpha: INK.rule })
    // Over the write head: while a phrase is played in over a loop the two cross it together.
    clipped(ctx, { x: tape.x, y: 0, w: tape.w, h: frame.height }, () => {
      if (frame.value('smear') > 0) {
        // Smear's grains are taken from this far either side of it.
        ctx.globalAlpha = playing ? 0.12 + 0.2 * frame.value('smear') : INK.grid
        ctx.fillStyle = playing ? colours.accent : colours.ink
        ctx.fillRect(at - reach, tape.y, 2 * reach, tape.h)
        ctx.globalAlpha = 1
      }
      readHead(
        frame,
        tape,
        at,
        turning,
        playing ? colours.accent : colours.ink,
        playing ? 1 : INK.back,
      )
    })
    span(frame, lay, start, head, timeText(length), 'length')
  },
  handles: (view) => [lengthHandle(view, 'length', 'Length')],
})

export const LOOPS_FACES: Readonly<Record<string, PlateFace>> = {
  'tape-loop': {
    display: tapeLoop,
    face: ['feedback', 'speed', 'wear', 'mix'],
  },
  'reverse-delay': {
    display: reverseDelay,
    face: ['feedback', 'pitch', 'smooth', 'mix'],
  },
  'grain-delay': {
    display: grainDelay,
    face: ['pitch', 'size', 'feedback', 'mix'],
  },
  'micro-looper': {
    display: microLooper,
    face: ['state', 'speed', 'fade', 'mix'],
  },
}
