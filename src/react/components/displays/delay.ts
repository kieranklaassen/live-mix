// Displays of the delays that repeat: each repeat where it falls in time and
// how loud it comes back. One picture for the four of them. A mark stands for
// now. At its left is the level that went in over the last moments; at its
// right is what is still to come: that same level again one delay time later,
// and again, each time as much quieter as the loop makes it, so a loud note is
// seen marching off to the right and fading. Under it stand the repeats of a
// single full-scale click, which is the picture at rest. The point on the
// first repeat is dragged: across is the time, up and down the feedback.

import { denormalizeParam } from '../../../core/params'
import {
  History,
  INK,
  biquad,
  biquadDb,
  clamp,
  crisp,
  dot,
  follow,
  ground,
  handle,
  lerp,
  onePoleDb,
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

// --- The time axis ----------------------------------------------------------

/** Where now stands across the display. */
const NOW_AT = 0.22
/**
 * How far right of now the first repeat falls, as a share of the room there:
 * at the short end of the Time knob and at the long end. Time is a knob of
 * many octaves, so the axis is drawn to the time: seconds run evenly across
 * it at any one setting, and a longer time is a wider gap on a wider view.
 */
const NEAR = 0.08
const FAR = 0.4
/** The level at the top of a display: a little over full scale, for a loop that runs away. */
const FULL = 1.25
/** The level going in is kept this long, in slots this fine. */
const PAST_SEC = 12
const SLOTS_PER_SEC = 120
const SLOTS = PAST_SEC * SLOTS_PER_SEC
/** The most repeats a comb holds. */
const MOST = 64
/** Under this a repeat is not drawn. */
const FAINT = 0.004
/** How strongly the ink is laid for what went in, and for what is to come of it. */
const PAST_INK = 0.4
const AHEAD_INK = 0.62

interface Scope {
  box: Box
  nowX: number
  /** The room right of now, in pixels. */
  ahead: number
  /** Two sides: the left side stands on the middle line and the right hangs from it. */
  sided: boolean
  /** The line the levels stand on, and how many pixels full height is. */
  base: number
  rise: number
}

function scopeOf(box: Box, sided: boolean): Scope {
  const nowX = Math.round(box.x + box.w * NOW_AT)
  return {
    box,
    nowX,
    ahead: box.x + box.w - nowX,
    sided,
    base: sided ? Math.round(box.y + box.h / 2) : box.y + box.h,
    rise: sided ? Math.floor(box.h / 2) : box.h,
  }
}

/** A level as a share of full height: by its root, so a repeat at a tenth is still seen. */
const shareOf = (level: number): number => Math.sqrt(clamp(level, 0, FULL) / FULL)
const levelOf = (share: number): number => FULL * clamp(share, 0, 1) ** 2
/** Where a level stands on a side: 0 is up (the left side, or the only one), 1 hangs down. */
const yOf = (scope: Scope, level: number, side: 0 | 1 = 0): number =>
  scope.base + (side === 0 ? -1 : 1) * shareOf(level) * scope.rise

/** The gap between two repeats in pixels, from where the Time knob stands. */
const gapOf = (scope: Scope, view: DisplayView, time: string): number =>
  scope.ahead * lerp(NEAR, FAR, view.at(time))

/** The point on the first repeat: across is Time, up and down is Feedback. */
function echoHandle(
  view: DisplayView,
  scope: Scope,
  time: string,
  feedback: string,
): DisplayHandle {
  const timeSpec = view.spec(time)
  const feedbackSpec = view.spec(feedback)
  return {
    key: 'repeat',
    name: 'Time and feedback',
    x: scope.nowX + gapOf(scope, view, time),
    y: yOf(scope, view.value(feedback)),
    drag: (x, y) => ({
      [time]: timeSpec
        ? denormalizeParam(timeSpec, ((x - scope.nowX) / scope.ahead - NEAR) / (FAR - NEAR))
        : view.value(time),
      [feedback]: clamp(
        levelOf((scope.base - y) / scope.rise),
        feedbackSpec?.min ?? 0,
        feedbackSpec?.max ?? 1,
      ),
    }),
    reset: () => ({
      [time]: timeSpec?.default ?? view.value(time),
      [feedback]: feedbackSpec?.default ?? view.value(feedback),
    }),
  }
}

// --- The loop ---------------------------------------------------------------

/** A delay's loop, as far as its repeats go. */
export interface Loop {
  /** Steps of the comb in one Time: 1, or 3 where heads stand at thirds of it. */
  grid: number
  /** The playback heads: how many steps behind the record head, and how loud. */
  heads: readonly (readonly [number, number])[]
  feedback: number
  /** How much of each side's feedback is recorded on the other side, 0..1. */
  cross: number
  /** What a sound in the middle puts on the left line and on the right. */
  send: readonly [number, number]
  /** How loud every repeat is played. */
  level: number
}

/** The repeats of one click by step of the comb, on each side. */
export interface Comb {
  left: Float32Array
  right: Float32Array
  /** The two sides as one level: the root of their mean power. */
  both: Float32Array
  /** The last step that can be seen. */
  last: number
  /** What it was made from, so it is made again only when that moves. */
  made: string
  /** What is left of a level after so many passes of the loop's filters. */
  kept: Float32Array
  work: Float32Array[]
}

export const newComb = (): Comb => ({
  left: new Float32Array(MOST + 1),
  right: new Float32Array(MOST + 1),
  both: new Float32Array(MOST + 1),
  last: 0,
  made: '',
  kept: new Float32Array(MOST + 1).fill(1),
  work: [0, 1, 2, 3].map(() => new Float32Array(MOST + 1)),
})

/**
 * The repeats of one full-scale click, pass by pass. A pass plays what was
 * recorded through every head, and records the sum again times Feedback,
 * crossed between the sides; what it plays has been through the loop's
 * filters once more than the pass before. This is the recurrence the four
 * devices run a sample at a time, taken a repeat at a time. (This and
 * `keptLevels` are exported for the test beside the displays.)
 */
export function ringComb(loop: Loop, comb: Comb): void {
  const { left, right, kept } = comb
  const [recL, recR, playL, playR] = comb.work
  const steps = MOST + 1
  left.fill(0)
  right.fill(0)
  recL.fill(0)
  recR.fill(0)
  recL[0] = loop.send[0]
  recR[0] = loop.send[1]
  for (let pass = 0; pass <= MOST; pass++) {
    let loudest = 0
    for (let m = 0; m < steps; m++) {
      let l = 0
      let r = 0
      for (const [behind, gain] of loop.heads) {
        if (m < behind) continue
        l += gain * recL[m - behind]
        r += gain * recR[m - behind]
      }
      playL[m] = l
      playR[m] = r
    }
    for (let m = 0; m < steps; m++) {
      left[m] += playL[m] * kept[pass] * loop.level
      right[m] += playR[m] * kept[pass] * loop.level
      // Kept finite where Feedback is over one; the device's own limit is drawn on top.
      recL[m] = clamp(loop.feedback * lerp(playL[m], playR[m], loop.cross), -8, 8)
      recR[m] = clamp(loop.feedback * lerp(playR[m], playL[m], loop.cross), -8, 8)
      loudest = Math.max(loudest, Math.abs(recL[m]), Math.abs(recR[m]))
    }
    if (loudest < FAINT * 0.1) break
  }
  comb.last = 0
  for (let m = 1; m < steps; m++) {
    comb.both[m] = Math.sqrt((left[m] * left[m] + right[m] * right[m]) / 2)
    if (Math.abs(left[m]) >= FAINT || Math.abs(right[m]) >= FAINT) comb.last = m
  }
}

/** The frequencies a loss is taken over: one to a third of an octave, 20 Hz to 20 kHz. */
const PINK = Array.from({ length: 30 }, (_, i) => 20 * Math.pow(1000, (i + 0.5) / 30))
const pinkWork = new Float32Array(PINK.length)

/**
 * How much of a sound's level is left after 0, 1, 2... passes of a loop's
 * filters, for a sound with as much in every octave (pink): the root of the
 * mean of the power the filters let through. `once` is the power response of
 * what every repeat goes through one time, `again` of what each pass adds.
 */
export function keptLevels(
  kept: Float32Array,
  once: (hz: number) => number,
  again: (hz: number) => number,
): void {
  for (let i = 0; i < PINK.length; i++) pinkWork[i] = once(PINK[i])
  for (let pass = 0; pass < kept.length; pass++) {
    let sum = 0
    for (let i = 0; i < PINK.length; i++) {
      sum += pinkWork[i]
      pinkWork[i] *= again(PINK[i])
    }
    kept[pass] = Math.sqrt(sum / PINK.length)
  }
}

const powerOfDb = (db: number): number => Math.pow(10, db / 10)
/** A second-order low-pass of the kit (`kit::Svf`): the power it lets through at `hz`. */
function svfLowpass(cutHz: number, q: number, hz: number): number {
  const r = hz / cutHz
  return 1 / ((1 - r * r) ** 2 + (r / q) ** 2)
}
/** A Butterworth low-pass of so many poles. */
const butterworth = (cutHz: number, poles: number, hz: number): number =>
  1 / (1 + Math.pow(hz / cutHz, 2 * poles))

/** One head at the Time knob's own distance, both sides fed alike: the plain loop. */
const ONE_HEAD: Loop['heads'] = [[1, 1]]
const BOTH_SIDES: Loop['send'] = [1, 1]

// --- The scope --------------------------------------------------------------

interface EchoState {
  /** The level going in, by the clock. */
  heard: History
  /** The same by pixel of age, made again each frame. */
  ages: Float32Array
  comb: Comb
  /** 1 while nothing sounds and the click's repeats are the picture, 0 while the sound is. */
  rest: number
}

const newEchoState = (): EchoState => ({
  heard: new History(PAST_SEC, SLOTS, 0, 'max'),
  ages: new Float32Array(2048),
  comb: newComb(),
  rest: 1,
})

/**
 * Take in the level since the frame before. The taps hand over the last 43 ms
 * of samples, so the frame is read in pieces a slot long and a pluck keeps
 * its edge. Where the plate was not told what feeds the device the level
 * coming out is kept in its place, which is only good for the past: it has
 * the repeats in it already. Null when there is no sound to read.
 */
function hear(frame: DisplayFrame, heard: History): 'in' | 'out' | null {
  const signal = frame.signal
  if (!signal || !frame.powered) return null
  const level = signal.input ?? signal.output
  // The first frame after a pause: what went in meanwhile was not seen, and
  // the history would fill the gap with the last level it had.
  if (frame.dt === 0) heard.clear()
  const wave = level.wave
  const pieces = clamp(Math.round(frame.dt * SLOTS_PER_SEC), 1, 8)
  const span = Math.min(
    wave.length,
    Math.round(Math.max(frame.dt, 1 / SLOTS_PER_SEC) * frame.sampleRate),
  )
  for (let piece = 0; piece < pieces; piece++) {
    const from = wave.length - span + Math.floor((piece * span) / pieces)
    const to = wave.length - span + Math.floor(((piece + 1) * span) / pieces)
    let peak = 0
    for (let i = from; i < to; i++) {
      const size = wave[i] < 0 ? -wave[i] : wave[i]
      if (size > peak) peak = size
    }
    heard.push(frame.now - ((pieces - 1 - piece) * frame.dt) / pieces, peak)
  }
  return signal.input ? 'in' : 'out'
}

interface EchoPicture {
  scope: Scope
  loop: Loop
  /** The loop and its filters in a word: the comb is made again when it changes. */
  key: string
  /** Fills `kept` for the comb; called only when the key changes. */
  losses: (kept: Float32Array) => void
  /** The device's limit on a level: what the tape or the line does to a loud one. */
  limit: (level: number) => number
  /** The Time knob in seconds, and the delay as it is now against it (1 when it stands where the knob says). */
  seconds: number
  place: number
  /** The gap between repeats where the knob stands, in pixels. */
  gap: number
}

/** Draw the scope: the past, the repeats to come and the click's own repeats. Returns the level now. */
function drawEchoes(frame: DisplayFrame<EchoState>, picture: EchoPicture): number {
  const { ctx, colours, state } = frame
  const { scope, loop, limit } = picture
  const { box, nowX, base, sided } = scope
  const { comb, ages } = state
  if (picture.key !== comb.made) {
    picture.losses(comb.kept)
    ringComb(loop, comb)
    comb.made = picture.key
  }
  const source = hear(frame, state.heard)
  // A step of the comb in pixels, and a pixel in seconds.
  const step = Math.max(0.5, (picture.gap * picture.place) / loop.grid)
  const perPixel = picture.seconds / Math.max(1, picture.gap)
  const behind = nowX - box.x
  const count = Math.min(
    ages.length,
    Math.ceil(PAST_SEC / perPixel) + 1,
    Math.max(behind, Math.ceil(comb.last * step)) + 2,
  )
  let loudest = 0
  if (source) {
    const perSlot = perPixel * SLOTS_PER_SEC
    for (let k = 0; k < count; k++) {
      const from = Math.floor(k * perSlot)
      const to = Math.min(SLOTS - 1, Math.max(from, Math.ceil((k + 1) * perSlot) - 1))
      let level = 0
      for (let i = from; i <= to; i++) level = Math.max(level, state.heard.at(i))
      ages[k] = level
      if (level > loudest) loudest = level
    }
  }
  // The past is drawn from either level; what is to come only from the level going in.
  const heardNow = source !== null && loudest > FAINT
  const sounding = heardNow && source === 'in'
  state.rest =
    frame.dt > 0 ? follow(state.rest, sounding ? 0 : 1, frame.dt, 0.4, 0.08) : sounding ? 0 : 1
  const sides: readonly (0 | 1)[] = sided ? [0, 1] : [0]
  const right = box.x + box.w

  if (heardNow) {
    // What went in, at the left of now.
    for (const side of sides) {
      ctx.beginPath()
      ctx.moveTo(box.x, base)
      for (let x = box.x; x <= nowX; x++) ctx.lineTo(x, yOf(scope, ages[nowX - x], side))
      ctx.lineTo(nowX, base)
      ctx.closePath()
      ctx.globalAlpha = PAST_INK
      ctx.fillStyle = colours.ink
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
  if (sounding) {
    // What is to come: every repeat of it that has not played yet, the powers added.
    const stride = scope.ahead > 320 ? 2 : 1
    for (const side of sides) {
      const gains = !sided ? comb.both : side === 0 ? comb.left : comb.right
      ctx.beginPath()
      ctx.moveTo(nowX, base)
      for (let j = 0; j <= scope.ahead; j += stride) {
        let power = 0
        for (let m = 1; m <= comb.last; m++) {
          const age = Math.round(m * step - j)
          if (age < 0) continue
          if (age >= count) break
          const level = gains[m] * ages[age]
          power += level * level
        }
        ctx.lineTo(nowX + j, yOf(scope, limit(Math.sqrt(power)), side))
      }
      ctx.lineTo(right, base)
      ctx.closePath()
      ctx.globalAlpha = AHEAD_INK
      ctx.fillStyle = colours.ink
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  // The repeats of one click: bars at rest, a ruler under the sound while it plays.
  const rest = state.rest
  const width = rest > 0.5 ? 3 : 1
  for (const side of sides) {
    const gains = !sided ? comb.both : side === 0 ? comb.left : comb.right
    ctx.fillStyle = colours.ink
    for (let m = 1; m <= comb.last; m++) {
      const x = nowX + m * step
      if (x > right - 1) break
      const level = limit(Math.abs(gains[m]))
      if (level < FAINT) continue
      const y = yOf(scope, level, side)
      ctx.globalAlpha = lerp(INK.text, 1, rest)
      ctx.fillRect(Math.round(x - width / 2), Math.min(y, base), width, Math.abs(y - base))
    }
  }
  ctx.globalAlpha = 1

  // The lines the levels stand on, and now.
  rule(ctx, box.x, base, right, base, { colour: colours.ink, alpha: INK.rule })
  rule(ctx, nowX, box.y, nowX, box.y + box.h, { colour: colours.ink, alpha: INK.back })
  const now = heardNow ? ages[0] : 0
  if (heardNow) {
    // The level going in now, in the second ink on the mark.
    for (const side of sides) {
      const y = yOf(scope, now, side)
      ctx.fillStyle = colours.accent
      ctx.fillRect(nowX - 1, Math.min(y, base), 3, Math.abs(y - base))
    }
  } else {
    // The click itself, at full scale.
    for (const side of sides) {
      const y = yOf(scope, 1, side)
      ctx.globalAlpha = rest
      ctx.fillStyle = colours.accent
      ctx.fillRect(nowX - 1, Math.min(y, base), 3, Math.abs(y - base))
    }
    ctx.globalAlpha = 1
  }
  if (sided && box.w >= 120) {
    text(frame, 'L', box.x + 1, box.y + 6, { size: 7, alpha: INK.back })
    text(frame, 'R', box.x + 1, box.y + box.h, { size: 7, alpha: INK.back })
  }
  return now
}

/** The point in hand and the time it stands at, in words. */
function drawHandle(
  frame: DisplayFrame,
  scope: Scope,
  point: DisplayHandle,
  seconds: number,
  feedback: number,
): void {
  const { ctx, colours } = frame
  const hot = frame.hot === point.key
  // The rail it runs on: up is more feedback.
  rule(ctx, point.x, scope.base - scope.rise, point.x, scope.base, {
    colour: colours.ink,
    alpha: hot ? INK.back : INK.grid,
  })
  handle(frame, point.x, point.y, { hot })
  const time = seconds >= 1 ? `${seconds.toFixed(2)} s` : `${Math.round(seconds * 1000)} ms`
  const words = hot ? `${time}  ${Math.round(feedback * 100)}%` : time
  text(frame, words, scope.box.x + scope.box.w - 1, scope.box.y + 7, {
    align: 'right',
    alpha: hot ? 1 : INK.text,
  })
}

const scopeBox = (view: Pick<DisplayView, 'width' | 'height'>): Box => ({
  x: 4,
  y: 4,
  w: view.width - 8,
  h: view.height - 8,
})

// --- Pitch on the mark ------------------------------------------------------

const centsOf = (ratio: number): number => (ratio > 0 ? 1200 * Math.log2(ratio) : 0)

interface PitchMark {
  /** Cents at the two ends of the scale. */
  scale: number
  /** How far the repeats' pitch swings either way at this setting, in cents. */
  swing: number
  /** Pitches the repeats step to, in cents. */
  steps: readonly number[]
  /** The pitch of what plays now, a side each; none at rest. */
  now: readonly number[]
  /** The pitch so many seconds ago, for the trail behind the mark; null to leave it out. */
  trail: ((secondsAgo: number) => number) | null
  /** Seconds in a pixel, for the trail. */
  perPixel: number
}

/**
 * The pitch of the repeats, on the mark that stands for now: the middle of the
 * display is in tune, up is sharp. The thick part of the mark is how far the
 * pitch can swing at this setting; the dot in the second ink is where it is.
 */
function drawPitch(frame: DisplayFrame, scope: Scope, pitch: PitchMark): void {
  const { ctx, colours } = frame
  const { box, nowX } = scope
  const middle = box.y + box.h / 2
  const half = box.h / 2 - 3
  // By the root, as the levels are: a few cents of wow are seen beside an octave's step.
  const y = (cents: number): number =>
    middle - Math.sign(cents) * Math.sqrt(Math.min(1, Math.abs(cents) / pitch.scale)) * half
  if (pitch.swing > 0.5) {
    const top = y(pitch.swing)
    ctx.globalAlpha = INK.back
    ctx.fillStyle = colours.ink
    ctx.fillRect(nowX - 2, top, 5, Math.max(1, y(-pitch.swing) - top))
    ctx.globalAlpha = 1
  }
  for (const cents of pitch.steps) {
    rule(ctx, nowX - 4, y(cents), nowX + 5, y(cents), { colour: colours.ink, alpha: INK.text })
  }
  if (pitch.now.length === 0) return
  if (pitch.trail) {
    let furthest = 0
    ctx.beginPath()
    for (let x = nowX; x >= box.x; x -= 2) {
      const cents = pitch.trail((nowX - x) * pitch.perPixel)
      furthest = Math.max(furthest, Math.abs(cents))
      if (x === nowX) ctx.moveTo(x, y(cents))
      else ctx.lineTo(x, y(cents))
    }
    // A transport that runs steady leaves no trail.
    if (furthest > 0.5) {
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 1
      ctx.lineJoin = 'round'
      ctx.stroke()
    }
  }
  for (let side = pitch.now.length - 1; side >= 0; side--) {
    dot(ctx, nowX, y(pitch.now[side]), side === 0 ? 3 : 2, colours.accent, { ring: colours.ink })
  }
}

/** Whether anything comes out of the device: its repeats are still sounding, so its pitch is worth a dot. */
const sounds = (frame: DisplayFrame): boolean => (frame.signal?.output.peak ?? 0) > FAINT * 0.25

/** A reading kept by the clock and read back by its age in seconds; no further back than it goes. */
const READ_SEC = 5
const READ_SLOTS = 300
const newReadings = (fill: number): History => new History(READ_SEC, READ_SLOTS, fill)
const readBack = (readings: History, secondsAgo: number): number =>
  readings.at(clamp(Math.round((secondsAgo * READ_SLOTS) / READ_SEC), 0, READ_SLOTS - 1))

// --- Delay ------------------------------------------------------------------

function delayScope(view: DisplayView): Scope {
  return scopeOf(scopeBox(view), false)
}

const delay = plateDisplay<EchoState>({
  place: 'strip',
  params: ['timeSec', 'feedback', 'damping'],
  live: { signal: true },
  info: 'Time runs to the right and the mark is now. Left of it is the level that went in, right of it the repeats still to come, each a delay time later and quieter by Feedback. Damping makes later repeats shorter. Drag the point: across is Time, up is Feedback.',
  init: newEchoState,
  draw(frame) {
    ground(frame)
    const scope = delayScope(frame)
    const feedback = frame.value('feedback')
    const damping = frame.value('damping')
    const seconds = frame.value('timeSec')
    drawEchoes(frame, {
      scope,
      // `Delay.ts`: the delay feeds the wet gain as it is, and goes round
      // through the damping filter and the feedback gain.
      loop: { grid: 1, heads: ONE_HEAD, feedback, cross: 0, send: BOTH_SIDES, level: 1 },
      key: `${feedback.toFixed(4)} ${damping.toFixed(1)} ${frame.sampleRate}`,
      losses: (kept) => {
        // A Web Audio low-pass, whose Q of √½ is read as decibels.
        const filter = biquad('lowpass', damping, Math.SQRT1_2, 0, frame.sampleRate, true)
        keptLevels(
          kept,
          () => 1,
          (hz) => powerOfDb(biquadDb(filter, hz, frame.sampleRate)),
        )
      },
      limit: (level) => level,
      seconds,
      place: 1,
      gap: gapOf(scope, frame, 'timeSec'),
    })
    drawHandle(frame, scope, echoHandle(frame, scope, 'timeSec', 'feedback'), seconds, feedback)
  },
  handles: (view) => [echoHandle(view, delayScope(view), 'timeSec', 'feedback')],
})

// --- Analog Delay -----------------------------------------------------------

/** `analog_delay.h`: the line's length, the filters' corners as a share of the clock, the clock's swing. */
const BBD_SAMPLES = 8192
const BBD_INPUT_SHARE = 0.36
const BBD_OUTPUT_SHARE = 0.42
const BBD_LOW_CUT_HZ = 45
const BBD_CLOCK_SWING = 0.03
const BBD_DRIFT_SHARE = 0.3
const BBD_DRIFT_FLOOR = 0.0012
const BBD_DRIFT_HZ = 0.23
const BBD_HEADROOM_LOSS = 0.6
/** What the compressor makes of a full-scale sine: √(kUnity ÷ the mean of a rectified sine). */
const BBD_COMPRESSED = Math.sqrt(0.16 / (2 / Math.PI))
/** Clock rate of each interval choice, as `kIntervalClock` has them. */
const BBD_INTERVALS = [1, 0.5, 2 / 3, 0.75, 4 / 3, 1.5, 2]

/** `kit::fast_tanh`. */
function fastTanh(x: number): number {
  const c = clamp(x, -3, 3)
  return (c * (27 + c * c)) / (27 + 9 * c * c)
}

/** Exactly linear up to ±1, never past ±2: `limit` over `kit::soft_clip`. */
function softLimit(level: number): number {
  const half = 0.5 * level
  return half <= 0.5 ? level : 2 * (0.5 + 0.5 * fastTanh((half - 0.5) * 2))
}

interface AnalogState extends EchoState {
  /** Each line's clock against the knob's, as the device reports it. */
  clocks: [History, History]
}

function analogScope(view: DisplayView): Scope {
  return scopeOf(scopeBox(view), false)
}

const analogDelay = plateDisplay<AnalogState>({
  place: 'strip',
  params: [
    'time',
    'feedback',
    'tone',
    'age',
    'modDepth',
    'modRate',
    'intervalA',
    'intervalB',
    'spread',
  ],
  live: { signal: true, meters: true },
  info: 'Left of the mark is the level that went in, right of it the repeats to come; long times and a low Tone make them shorter. The dots on the mark are the pitch of the echoes on each side, up for sharp: they ride the clock wobble and jump with the interval steps. Drag the point for Time and Feedback.',
  init: () => ({ ...newEchoState(), clocks: [newReadings(1), newReadings(1)] }),
  draw(frame) {
    const { state } = frame
    ground(frame)
    const scope = analogScope(frame)
    const seconds = frame.value('time') / 1000
    const feedback = frame.value('feedback')
    const tone = frame.value('tone')
    const age = frame.value('age')
    const depth = frame.value('modDepth')
    const rate = frame.value('modRate')
    const spread = frame.value('spread')
    const intervals = [frame.value('intervalA'), frame.value('intervalB')]
      .map((choice) => BBD_INTERVALS[Math.round(choice)] ?? 1)
      .filter((clock) => clock !== 1)
    const running = frame.powered && frame.dt > 0 && frame.hasMeter('clockLeft')
    if (running) {
      for (const side of [0, 1] as const) {
        const clock = frame.meter(side === 0 ? 'clockLeft' : 'clockRight')
        state.clocks[side].push(frame.now, clock > 0 ? clock : 1)
      }
    }
    // The delay is the line's length over its clock: a clock that ran faster
    // while the line filled is a shorter delay. The mean over one Time back.
    let mean = 1
    if (running) {
      const slots = clamp(Math.round((seconds * READ_SLOTS) / READ_SEC), 1, READ_SLOTS)
      let sum = 0
      for (let i = 0; i < slots; i++) sum += state.clocks[0].at(i)
      mean = sum / slots
    }
    // The line saturates towards its headroom, behind a 2:1 compressor and in
    // front of a 1:2 expander: for a steady level a root and a square, which
    // put a full-scale sine at half the headroom of a new line (`compander.h`).
    const headroom = 1 - BBD_HEADROOM_LOSS * age
    const clockHz = BBD_SAMPLES / seconds
    const inCorner = Math.min(tone, BBD_INPUT_SHARE * clockHz)
    const outCorner = Math.min(tone, BBD_OUTPUT_SHARE * clockHz)
    drawEchoes(frame, {
      scope,
      loop: { grid: 1, heads: ONE_HEAD, feedback, cross: 0, send: BOTH_SIDES, level: 1 },
      key: `${feedback.toFixed(4)} ${inCorner.toFixed(1)} ${outCorner.toFixed(1)}`,
      losses: (kept) => {
        // Every repeat goes through both fourth-order low-passes and the low
        // cut once more: the first as well, since they stand in the line's path.
        const pass = (hz: number): number =>
          butterworth(inCorner, 4, hz) *
          butterworth(outCorner, 4, hz) *
          powerOfDb(onePoleDb('highpass', BBD_LOW_CUT_HZ, hz))
        keptLevels(kept, pass, pass)
      },
      // After the expander the wet path is linear to ±1 and never past ±2.
      limit: (level) => {
        const line = headroom * fastTanh((BBD_COMPRESSED * Math.sqrt(level)) / headroom)
        return softLimit((line / BBD_COMPRESSED) ** 2)
      },
      seconds,
      place: 1 / clamp(mean, 0.25, 4),
      gap: gapOf(scope, frame, 'time'),
    })
    // An echo's pitch is the clock now over the clock when it was written,
    // so its swing is 2 × the clock's × sin(π × rate × time) (`analog_delay.h`):
    // that of the wobble at Mod Rate, and of the slow drift at its own rate.
    const wobble = BBD_CLOCK_SWING * depth * depth
    const wander = BBD_DRIFT_SHARE * wobble + BBD_DRIFT_FLOOR * spread
    const swing = centsOf(
      1 +
        2 * wobble * Math.abs(Math.sin(Math.PI * rate * seconds)) +
        2 * wander * Math.abs(Math.sin(Math.PI * BBD_DRIFT_HZ * seconds)),
    )
    const delayNow = seconds / clamp(mean, 0.25, 4)
    const pitchOf = (side: 0 | 1, ago: number): number =>
      centsOf(readBack(state.clocks[side], ago) / readBack(state.clocks[side], ago + delayNow))
    const sides: (0 | 1)[] = spread > 0.002 ? [0, 1] : [0]
    drawPitch(frame, scope, {
      scale: intervals.length > 0 ? 1300 : 140,
      swing,
      steps: intervals.flatMap((clock) => [centsOf(clock), -centsOf(clock)]),
      now: running && sounds(frame) ? sides.map((side) => pitchOf(side, 0)) : [],
      trail: (ago) => pitchOf(0, ago),
      perPixel: seconds / Math.max(1, gapOf(scope, frame, 'time')),
    })
    drawHandle(frame, scope, echoHandle(frame, scope, 'time', 'feedback'), seconds, feedback)
  },
  handles: (view) => [echoHandle(view, analogScope(view), 'time', 'feedback')],
})

// --- Tape Echo --------------------------------------------------------------

/** `tape_echo.h`: the heads as steps of a third of Time behind the record head, and their gains by mode. */
const TAPE_HEADS: readonly (readonly (readonly [number, number])[])[] = [
  [[3, 1]],
  [
    [3, 0.6],
    [1, 0.5],
  ],
  [
    [3, 0.45],
    [2, 0.35],
    [1, 0.35],
  ],
  [
    [3, 0.6],
    [2, 0.5],
  ],
]
/** The pitch the wow and the flutter reach at full, either way (`kWowSeconds`, `kFlutterSeconds`). */
const TAPE_WOW_SWING = 0.005
const TAPE_FLUTTER_SWING = 0.003

interface TapeState extends EchoState {
  /** The tape's speed past the heads, in cents off a steady transport. */
  speed: History
}

function tapeScope(view: DisplayView): Scope {
  return scopeOf(scopeBox(view), true)
}

const tapeEcho = plateDisplay<TapeState>({
  place: 'strip',
  params: ['time', 'feedback', 'heads', 'wow', 'flutter', 'drive', 'lowCut', 'highCut', 'spread'],
  live: { signal: true, meters: true },
  info: 'Left of the mark is the level that went in, right of it the repeats to come from every head, the left side above the line and the right below, so Ping Pong is seen to bounce. The dot on the mark is the tape speed: up is sharp, and it rides the wow and flutter. Drag the point for Time and Feedback.',
  init: () => ({ ...newEchoState(), speed: newReadings(0) }),
  draw(frame) {
    const { state } = frame
    ground(frame)
    const scope = tapeScope(frame)
    const seconds = frame.value('time') / 1000
    const feedback = frame.value('feedback')
    const mode = clamp(Math.round(frame.value('heads')), 0, 3)
    const spread = frame.value('spread')
    const lowCut = frame.value('lowCut')
    const highCut = frame.value('highCut')
    // The record path: tanh at unity gain for a small sound, harder with Drive.
    const drive = 1 + 3 * frame.value('drive')
    const running = frame.powered && frame.dt > 0 && frame.hasMeter('speed')
    let place = 1
    if (running) {
      // The head on its way to where the knob says, with the motor's lag.
      const head = frame.meter('time')
      if (head > 0) place = clamp(head / (seconds * 1000), 0.05, 20)
      // While the motor chases a longer Time the head runs away faster than
      // the tape and the repeats play backwards: that is off the foot of the scale.
      const speed = frame.meter('speed')
      state.speed.push(frame.now, speed === 0 ? 0 : centsOf(Math.max(speed, 0.01)))
    }
    const gap = gapOf(scope, frame, 'time')
    drawEchoes(frame, {
      scope,
      loop: {
        grid: 3,
        heads: TAPE_HEADS[mode],
        feedback,
        // Ping Pong records the input on the left tape and crosses the feedback.
        cross: spread,
        send: [1, 1 - spread],
        level: 1,
      },
      key: `${mode} ${feedback.toFixed(4)} ${spread.toFixed(3)} ${lowCut.toFixed(1)} ${highCut.toFixed(1)}`,
      losses: (kept) =>
        // The cuts stand in the feedback path only: the first echo is whole.
        keptLevels(
          kept,
          () => 1,
          (hz) => svfLowpass(highCut, 0.6, hz) * powerOfDb(onePoleDb('highpass', lowCut, hz)),
        ),
      limit: (level) => fastTanh(level * drive) / drive,
      seconds,
      place,
      gap,
    })
    const wow = frame.value('wow')
    const flutter = frame.value('flutter')
    drawPitch(frame, scope, {
      scale: 20,
      swing: centsOf(1 + TAPE_WOW_SWING * wow + TAPE_FLUTTER_SWING * flutter),
      steps: [],
      now: running && sounds(frame) ? [readBack(state.speed, 0)] : [],
      trail: (ago) => readBack(state.speed, ago),
      perPixel: seconds / Math.max(1, gap),
    })
    drawHandle(frame, scope, echoHandle(frame, scope, 'time', 'feedback'), seconds, feedback)
  },
  handles: (view) => [echoHandle(view, tapeScope(view), 'time', 'feedback')],
})

// --- Echo Memory ------------------------------------------------------------

/** `echo_memory.h`: the nearest moment the memory voice may take, and the shape and length of one. */
const MEMORY_NEAREST_SEC = 2
const MEMORY_EDGE = 0.4
const MEMORY_LOW_CUT_HZ = 70
const MEMORY_LONGEST_SEC = 64
const MEMORY_SLOTS = 256
/** The band along the foot of the display that is the memory. */
const MEMORY_BAND = 10

/** The window a recalled moment plays under: a raised cosine over the first and the last 40 %. */
function momentWindow(phase: number): number {
  const edge = Math.min(phase, 1 - phase)
  return edge >= MEMORY_EDGE ? 1 : 0.5 - 0.5 * Math.cos((Math.PI * Math.max(0, edge)) / MEMORY_EDGE)
}

interface MemoryState extends EchoState {
  /** The level going in over the last minute: the memory's own map, redrawn. */
  minute: History
  /** When it was last added to, to leave a pause in it empty. */
  seen: number | null
}

interface MemoryBoxes {
  scope: Scope
  band: Box
}

function memoryBoxes(view: Pick<DisplayView, 'width' | 'height'>): MemoryBoxes {
  const all = scopeBox(view)
  const band = Math.min(MEMORY_BAND, Math.floor(all.h / 3))
  return {
    scope: scopeOf({ ...all, h: all.h - band - 3 }, false),
    band: { x: all.x, y: all.y + all.h - band, w: all.w, h: band },
  }
}

const echoMemory = plateDisplay<MemoryState>({
  place: 'strip',
  params: ['time', 'feedback', 'echo', 'tone', 'memory', 'reach', 'size', 'wander'],
  live: { signal: true, meters: true },
  info: 'Above, the echo: the level that went in at the left of the mark and the repeats to come at its right. Below, the memory, from Reach ago at the left to now at the right: the marks in the second colour are the moments being played back. Drag the point for Time and Feedback.',
  init: () => ({
    ...newEchoState(),
    minute: new History(MEMORY_LONGEST_SEC, MEMORY_SLOTS, 0, 'max'),
    seen: null,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { scope, band } = memoryBoxes(frame)
    const seconds = frame.value('time') / 1000
    const feedback = frame.value('feedback')
    const echo = frame.value('echo')
    const tone = frame.value('tone')
    const running = frame.powered && frame.dt > 0 && frame.hasMeter('time')
    let place = 1
    if (running) {
      const head = frame.meter('time')
      if (head > 0) place = clamp(head / (seconds * 1000), 0.05, 20)
    }
    const now = drawEchoes(frame, {
      scope,
      // Spread moves the repeats between the sides at the same power, which
      // one line of levels does not show: the two sides are drawn as one.
      loop: { grid: 1, heads: ONE_HEAD, feedback, cross: 0, send: BOTH_SIDES, level: echo },
      key: `${feedback.toFixed(4)} ${echo.toFixed(3)} ${tone.toFixed(1)}`,
      losses: (kept) =>
        // Tone is on the playback, so the first echo has it too; the low cut is in the loop.
        keptLevels(
          kept,
          (hz) => svfLowpass(tone, 0.6, hz),
          (hz) =>
            svfLowpass(tone, 0.6, hz) * powerOfDb(onePoleDb('highpass', MEMORY_LOW_CUT_HZ, hz)),
        ),
      limit: softLimit,
      seconds,
      place,
      gap: gapOf(scope, frame, 'time'),
    })
    drawHandle(frame, scope, echoHandle(frame, scope, 'time', 'feedback'), seconds, feedback)

    // The memory: Reach ago at the left, now at the right.
    const reach = frame.value('reach')
    const memory = frame.value('memory')
    const foot = band.y + band.h
    const xOfAge = (age: number): number => band.x + band.w * (1 - clamp(age / reach, 0, 1))
    if (frame.signal?.input && frame.powered) {
      // After a pause the map is blank where nothing was seen, not held at the last level.
      if (frame.dt === 0 && state.seen !== null && frame.now - state.seen > 1) {
        state.minute.push(state.seen + (2 * MEMORY_LONGEST_SEC) / MEMORY_SLOTS, 0)
      }
      state.minute.push(frame.now, now)
      state.seen = frame.now
    }
    ctx.globalAlpha = INK.grid
    ctx.fillStyle = colours.ink
    ctx.fillRect(band.x, band.y, band.w, band.h)
    // What was played, as far back as the memory reaches.
    ctx.beginPath()
    ctx.moveTo(band.x, foot)
    for (let x = 0; x <= band.w; x += 2) {
      const age = reach * (1 - x / band.w)
      const slot = clamp(Math.round((age * MEMORY_SLOTS) / MEMORY_LONGEST_SEC), 0, MEMORY_SLOTS - 1)
      ctx.lineTo(band.x + x, foot - shareOf(state.minute.at(slot)) * band.h)
    }
    ctx.lineTo(band.x + band.w, foot)
    ctx.closePath()
    ctx.globalAlpha = INK.back
    ctx.fill()
    ctx.globalAlpha = 1
    // Nearer than two seconds is the echo's: no moment is taken from there.
    rule(ctx, xOfAge(MEMORY_NEAREST_SEC), band.y, xOfAge(MEMORY_NEAREST_SEC), foot, {
      colour: colours.ink,
      alpha: INK.back,
    })
    let playing = false
    if (running) {
      for (const voice of [1, 2]) {
        const level = frame.meter(`level${voice}`)
        const age = frame.meter(`age${voice}`)
        if (level === 0 || age <= 0) continue
        playing = true
        const x = Math.round(xOfAge(age))
        ctx.globalAlpha = lerp(0.3, 1, clamp(Math.abs(level) * memory * 1.5, 0, 1))
        ctx.fillStyle = colours.accent
        ctx.fillRect(x - 1, band.y - 2, 3, band.h + 2)
        // A moment read backwards points into the past.
        if (level < 0) ctx.fillRect(x - 4, band.y - 2, 3, 2)
        else ctx.fillRect(x + 2, band.y - 2, 3, 2)
        ctx.globalAlpha = 1
      }
    }
    if (!playing && memory > 0) {
      // At rest: one moment as long as Size gives (a busy Wander cuts it
      // shorter), under its window, where the memory may take it from.
      const interval = 20 * Math.pow(0.01, frame.value('wander'))
      const length = Math.min(frame.value('size'), 1.4 * interval, reach - MEMORY_NEAREST_SEC)
      const from = xOfAge(MEMORY_NEAREST_SEC + (reach - MEMORY_NEAREST_SEC) / 2 + length / 2)
      const span = Math.max(3, (length / reach) * band.w)
      ctx.beginPath()
      ctx.moveTo(from, foot)
      for (let x = 0; x <= span; x += 1) {
        ctx.lineTo(from + x, foot - momentWindow(x / span) * memory * (band.h - 1))
      }
      ctx.lineTo(from + span, foot)
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.globalAlpha = state.rest > 0.5 ? 1 : INK.back
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    text(frame, `${Math.round(reach)} s`, band.x + 1, crisp(foot - 2) - 0.5, { size: 7 })
  },
  handles: (view) => [echoHandle(view, memoryBoxes(view).scope, 'time', 'feedback')],
})

export const DELAY_FACES: Readonly<Record<string, PlateFace>> = {
  delay: {
    display: delay,
    face: ['timeSec', 'feedback', 'damping', 'mix'],
  },
  'analog-delay': {
    display: analogDelay,
    face: ['time', 'feedback', 'modDepth', 'mix'],
    labels: { modDepth: 'Mod' },
  },
  'tape-echo': {
    display: tapeEcho,
    face: ['time', 'feedback', 'heads', 'wow'],
  },
  'echo-memory': {
    display: echoMemory,
    face: ['time', 'feedback', 'memory', 'mix'],
  },
}
