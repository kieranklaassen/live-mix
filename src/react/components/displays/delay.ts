// Displays of the delays that repeat: each repeat where it falls in time and
// how loud it comes back. One picture for the four of them. A mark stands for
// now and time runs to the right of it on a scale of seconds. The bars are the
// repeats of one full-scale click: a delay time apart, each as much lower as
// the loop makes it, and all as loud as Mix lets them out. Behind them is the
// sound itself: at the left of the mark the level that went in over the last
// moments, at its right what is still to come of it, so a loud note is seen
// marching off to the right and fading. The point on the first repeat is
// dragged: across is the time, up and down the feedback.

import { type ParamSpec } from '../../../core/params'
import {
  History,
  INK,
  biquad,
  biquadDb,
  clamp,
  crisp,
  dot,
  ground,
  handle,
  label,
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
 * How many seconds the room right of now holds. Time is a knob of many
 * octaves, so the scale has steps: within one a longer time is a wider gap,
 * pixel for millisecond, and where the repeats would leave the display the
 * scale goes to the next. The lines and ticks under the repeats say which.
 */
const SPANS = [0.5, 1, 2, 4, 8, 16] as const
/**
 * The scale is the shortest that holds so many of the time: four to nine
 * repeats are in view, the fourth clear of the edge. The steps fall between
 * the round times (at 114, 227, 455, 909 and 1818 ms), so a time like 250 or
 * 500 ms does not stand on the edge of two scales.
 */
const FIT = 4.4
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
/** A loop that grows is followed no further than to where it comes out at this many times full scale. */
const RUNAWAY = 8
/** How strongly the ink is laid for what went in, and for what is to come of it. */
const PAST_INK = 0.3
const AHEAD_INK = 0.45
/** The one point a delay's display has. */
const POINT = 'repeat'

/** The seconds across the room right of now for a delay time (exported for the test beside the displays). */
export function spanOf(seconds: number): number {
  for (const span of SPANS) if (span >= FIT * seconds) return span
  return SPANS[SPANS.length - 1]
}

/** The times a scale is chosen for: longer than the first, no longer than the second. */
function timesOf(span: number): readonly [number, number] {
  return [
    span === SPANS[0] ? 0 : (span / (2 * FIT)) * (1 + 1e-6),
    span === SPANS[SPANS.length - 1] ? Infinity : span / FIT,
  ]
}

/**
 * The point in hand keeps the scale it was taken on until it is let go, so it
 * stays under the pointer and a drag reaches every time the scale shows. Past
 * the scale's right edge the point stops and the drag goes on, as many
 * milliseconds to the pixel, to the longest time the knob has. Only a display
 * knows it is in hand (`frame.dragging`); it leaves the scale here for
 * `handles`, which is given no more than the parameters. One point is in hand
 * at a time.
 */
let held: { state: object; spec: ParamSpec | undefined; span: number; at: number } | null = null
/** A hold whose display has not drawn for this long is gone with its plate. */
const HELD_SEC = 10

/** The scale to draw on this frame: the held one while the point is in hand. */
function spanNow(frame: DisplayFrame<EchoState>, time: string, seconds: number): number {
  if (held && Math.abs(frame.now - held.at) > HELD_SEC) held = null
  if (frame.dragging && frame.hot === POINT) {
    if (held?.state !== frame.state) {
      held = { state: frame.state, spec: frame.spec(time), span: spanOf(seconds), at: frame.now }
    }
    held.at = frame.now
    return held.span
  }
  if (held?.state === frame.state) held = null
  return spanOf(seconds)
}

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

/**
 * Times a drag comes to rest on, in milliseconds, the roundest first: a drag
 * takes the first multiple it comes within half a pixel of, of the steps no
 * finer than a pixel.
 */
const ROUND_MS = [1000, 500, 250, 125, 100, 50, 25, 10, 5, 1] as const

/**
 * The point on the first repeat: across is Time, up and down is Feedback.
 * `unit` is the Time knob's unit in seconds. `span` is the scale it stands
 * on; on a scale that is not held a drag stays among the times that scale is
 * chosen for, so the scale cannot change under the pointer before the display
 * has seen the point taken. A pixel is some milliseconds wide, so a drag that
 * comes within half a pixel of a round time takes it: 250, 375 and 500 ms
 * can be set by hand.
 */
function echoHandle(
  view: DisplayView,
  scope: Scope,
  time: string,
  feedback: string,
  unit: number,
  span: number,
  isHeld: boolean,
): DisplayHandle {
  const timeSpec = view.spec(time)
  const feedbackSpec = view.spec(feedback)
  // In hand the drag has no end but the knob's: the pointer is followed past the edge of the display.
  const [over, upTo] = isHeld ? [0, Infinity] : timesOf(span)
  const pixelMs = (span * 1000) / scope.ahead
  const x = scope.nowX + Math.min(1, (view.value(time) * unit) / span) * scope.ahead
  const y = yOf(scope, view.value(feedback))
  const timeAt = (to: number): number => {
    // Taken and not moved, it stays where it is.
    if (!timeSpec || Math.abs(to - x) < 1e-6) return view.value(time)
    let ms = Math.max(0, (to - scope.nowX) / scope.ahead) * span * 1000
    for (const step of ROUND_MS) {
      if (step < pixelMs) break
      const round = Math.round(ms / step) * step
      if (Math.abs(round - ms) <= pixelMs / 2) {
        ms = round
        break
      }
    }
    ms = clamp(ms, over * 1000, upTo * 1000)
    return clamp(ms / (unit * 1000), timeSpec.min, timeSpec.max)
  }
  return {
    key: POINT,
    name: 'Time and feedback',
    x,
    y,
    drag: (toX, toY) => ({
      [time]: timeAt(toX),
      [feedback]:
        Math.abs(toY - y) < 1e-6
          ? view.value(feedback)
          : clamp(
              levelOf((scope.base - toY) / scope.rise),
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

/** The point as `handles` gives it: on the held scale when its display has it in hand. */
function pointOf(
  view: DisplayView,
  scope: Scope,
  time: string,
  feedback: string,
  unit: number,
): DisplayHandle {
  const spec = held?.spec
  const mine = spec !== undefined && spec === view.spec(time)
  const span = mine && held ? held.span : spanOf(view.value(time) * unit)
  return echoHandle(view, scope, time, feedback, unit, span, mine)
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
  /** The last step that can be seen. */
  last: number
  /** What stands on each line by step, and how many times round the loop it has been. */
  work: Float32Array[]
}

export const newComb = (): Comb => ({
  left: new Float32Array(MOST + 1),
  right: new Float32Array(MOST + 1),
  last: 0,
  work: [0, 1, 2, 3].map(() => new Float32Array(MOST + 1)),
})

/** What a loop's filters leave of a level, pass by pass: all of it until `keptLevels` says otherwise. */
export const newKept = (): Float32Array => new Float32Array(MOST + 1).fill(1)

/**
 * The repeats of one click, a step of the comb at a time: this is the
 * recurrence the four devices run a sample at a time. At every step each head
 * plays what was recorded so many steps before, and the sum is recorded again
 * times Feedback, crossed between the sides, less what the loop's filters
 * take on one more pass (`kept`, by how many times round the sound has been;
 * where heads of different passes add, by their mean). `record` is what the
 * device does to a level on its way into the line, the click's own included:
 * a tape that saturates, a line with a ceiling. Left out, the comb is that of
 * a small sound, which no device bends. (This and `keptLevels` are exported
 * for the test beside the displays.)
 */
export function ringComb(
  loop: Loop,
  kept: Float32Array,
  comb: Comb,
  record?: (level: number) => number,
): void {
  const { left, right } = comb
  const [lineL, lineR, passL, passR] = comb.work
  // Where the following ends is of what comes out: played quietly, a loop that grows still grows off the scale.
  const most = RUNAWAY / Math.max(loop.level, FAINT)
  const take = (level: number): number => (record ? record(level) : Math.min(level, most))
  /** What one more pass leaves of a sound that has been round so many times. */
  const lost = (passes: number): number => {
    const whole = Math.min(Math.floor(passes), MOST - 2)
    const first = kept[whole] > 0 ? kept[whole + 1] / kept[whole] : 0
    const next = kept[whole + 1] > 0 ? kept[whole + 2] / kept[whole + 1] : 0
    return lerp(first, next, Math.min(1, passes - whole))
  }
  left[0] = 0
  right[0] = 0
  lineL[0] = take(loop.send[0] * kept[0])
  lineR[0] = take(loop.send[1] * kept[0])
  passL[0] = 0
  passR[0] = 0
  comb.last = 0
  for (let m = 1; m <= MOST; m++) {
    let playL = 0
    let playR = 0
    let wentL = 0
    let wentR = 0
    for (const [behind, gain] of loop.heads) {
      if (m < behind) continue
      const l = gain * lineL[m - behind]
      const r = gain * lineR[m - behind]
      playL += l
      playR += r
      wentL += l * passL[m - behind]
      wentR += r * passR[m - behind]
    }
    left[m] = playL * loop.level
    right[m] = playR * loop.level
    if (left[m] >= FAINT || right[m] >= FAINT) comb.last = m
    const backL = lerp(playL, playR, loop.cross)
    const backR = lerp(playR, playL, loop.cross)
    const roundL = backL > 0 ? lerp(wentL, wentR, loop.cross) / backL : 0
    const roundR = backR > 0 ? lerp(wentR, wentL, loop.cross) / backR : 0
    lineL[m] = take(loop.feedback * backL * lost(roundL))
    lineR[m] = take(loop.feedback * backR * lost(roundR))
    passL[m] = roundL + 1
    passR[m] = roundR + 1
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

/**
 * What Mix lets through of the repeats where it is equal power: the sine of a
 * quarter turn of it (`kit::equal_power`). The repeats are drawn as loud as
 * they come out, so at no Mix there are none.
 */
const wetOf = (mix: number): number => Math.sin((clamp(mix, 0, 1) * Math.PI) / 2)

/** One head at the Time knob's own distance, both sides fed alike: the plain loop. */
const ONE_HEAD: Loop['heads'] = [[1, 1]]
const BOTH_SIDES: Loop['send'] = [1, 1]

// --- The scope --------------------------------------------------------------

interface EchoState {
  /** The level going in, by the clock. */
  heard: History
  /** The same by pixel of age, made again each frame, and what the device records of it. */
  ages: Float32Array
  taken: Float32Array
  /** The repeats of a small sound, which nothing bends, and of one full-scale click. */
  small: Comb
  click: Comb
  kept: Float32Array
  /** What the combs were made from, so they are made again only when that moves. */
  made: string
  /** Whether a sound was drawn on the last frame. */
  sounding: boolean
}

const newEchoState = (): EchoState => ({
  heard: new History(PAST_SEC, SLOTS, 0, 'max'),
  ages: new Float32Array(2048),
  taken: new Float32Array(2048),
  small: newComb(),
  click: newComb(),
  kept: newKept(),
  made: '',
  sounding: false,
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
  /** The loop, its filters and its limits in a word: the combs are made again when it changes. */
  key: string
  /** Fills `kept` for the combs; called only when the key changes. */
  losses: (kept: Float32Array) => void
  /** What the device does to a level it records: the tape's saturation, the line's ceiling. */
  record?: (level: number) => number
  /** What it does to the level it plays, after the loop. */
  out?: (level: number) => number
  /** The Time knob in seconds, and the delay as it is now against it (1 when it stands where the knob says). */
  seconds: number
  place: number
  /** The seconds across the room right of now. */
  span: number
  /** The mark for now carries something else while sound plays: no level on it. */
  bare?: boolean
  /** Where the words stand: nothing is drawn under them. */
  words: Box
}

/** The scale of seconds: a tick under the foot at every second and every tenth, and a line at every second, where they have room. */
function drawScale(frame: DisplayFrame, scope: Scope, span: number): void {
  const { ctx, colours } = frame
  const { box, nowX } = scope
  const foot = box.y + box.h
  const right = box.x + box.w
  const second = scope.ahead / span
  ctx.fillStyle = colours.ink
  for (const [gap, tall] of [
    [second, true],
    [second / 10, false],
  ] as const) {
    if (gap < 6) continue
    for (let n = -Math.floor((nowX - box.x) / gap); nowX + n * gap <= right + 0.5; n++) {
      if (n === 0 || (!tall && n % 10 === 0)) continue
      const x = Math.round(nowX + n * gap)
      if (x >= right) continue
      // A line the whole height only where the seconds stand well apart: closer, they crowd the repeats.
      if (tall && gap >= 20) {
        ctx.globalAlpha = INK.grid
        ctx.fillRect(x, box.y, 1, box.h)
      }
      ctx.globalAlpha = tall ? INK.back : INK.rule
      ctx.fillRect(x, foot + 1, 1, 2)
    }
  }
  ctx.globalAlpha = 1
}

/** Draw the scope: the scale, the past, the repeats to come and the click's own repeats. Returns the level now. */
function drawEchoes(frame: DisplayFrame<EchoState>, picture: EchoPicture): number {
  const { ctx, colours, state } = frame
  const { scope, loop, record, out, span, words } = picture
  const { box, nowX, base, sided } = scope
  const { ages, taken, small } = state
  if (picture.key !== state.made) {
    picture.losses(state.kept)
    ringComb(loop, state.kept, small)
    if (record) ringComb(loop, state.kept, state.click, record)
    state.made = picture.key
  }
  const click = record ? state.click : small
  const source = hear(frame, state.heard)
  // A pixel in seconds, and a step of the comb in pixels.
  const perPixel = span / scope.ahead
  const step = Math.max(0.05, (picture.seconds * picture.place) / loop.grid / perPixel)
  const behind = nowX - box.x
  const count = Math.min(
    ages.length,
    Math.ceil(PAST_SEC / perPixel) + 1,
    Math.max(behind, Math.ceil(small.last * step)) + 2,
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
      taken[k] = record ? record(level) : level
      if (level > loudest) loudest = level
    }
  }
  // The past is drawn from either level; what is to come only from the level going in.
  const heardNow = source !== null && loudest > FAINT
  const sounding = heardNow && source === 'in'
  state.sounding = sounding
  const sides: readonly (0 | 1)[] = sided ? [0, 1] : [0]
  const right = box.x + box.w

  drawScale(frame, scope, span)
  // Everything of the sound and its repeats keeps clear of the words.
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, frame.width, frame.height)
  ctx.rect(words.x, words.y, words.w, words.h)
  ctx.clip('evenodd')
  ctx.fillStyle = colours.ink
  if (heardNow) {
    // What went in, at the left of now.
    for (const side of sides) {
      ctx.beginPath()
      ctx.moveTo(box.x, base)
      for (let x = box.x; x <= nowX; x++) ctx.lineTo(x, yOf(scope, ages[nowX - x], side))
      ctx.lineTo(nowX, base)
      ctx.closePath()
      ctx.globalAlpha = PAST_INK
      ctx.fill()
    }
  }
  if (sounding) {
    // What is to come: every repeat of it that has not played yet, the powers
    // added. A repeat is the small sound's, of what the device recorded, and
    // never more than the full-scale click's: in a loop that bends, a sound
    // twice as loud does not come back twice as loud.
    const stride = scope.ahead > 320 ? 2 : 1
    for (const side of sides) {
      const gains = side === 0 ? small.left : small.right
      const most = side === 0 ? click.left : click.right
      ctx.beginPath()
      ctx.moveTo(nowX, base)
      for (let j = 0; j <= scope.ahead; j += stride) {
        let power = 0
        for (let m = Math.max(1, Math.ceil(j / step)); m <= small.last; m++) {
          const age = Math.max(0, Math.round(m * step - j))
          if (age >= count) break
          let level = gains[m] * taken[age]
          const ceiling = ages[age] > 1 ? most[m] * ages[age] : most[m]
          if (level > ceiling) level = ceiling
          power += level * level
        }
        const level = Math.sqrt(power)
        ctx.lineTo(nowX + j, yOf(scope, out ? out(level) : level, side))
      }
      ctx.lineTo(right, base)
      ctx.closePath()
      ctx.globalAlpha = AHEAD_INK
      ctx.fill()
    }
  }

  // The repeats of one full-scale click.
  const width = step >= 5 ? 3 : step >= 3 ? 2 : 1
  // Steps enough to hold every head, and both sides of a loop that crosses.
  const round = 2 * loop.grid
  for (const side of sides) {
    const levels = side === 0 ? click.left : click.right
    let seen = 0
    ctx.globalAlpha = 1
    for (let m = 1; m <= click.last; m++) {
      const x = nowX + m * step
      if (x > right - 1) break
      seen = m
      const level = out ? out(levels[m]) : levels[m]
      if (level < FAINT) continue
      const y = yOf(scope, level, side)
      ctx.fillRect(Math.round(x - width / 2), Math.min(y, base), width, Math.abs(y - base))
    }
    // A loop that grows may not have grown yet where the view ends. Where the
    // repeats long after stand taller than the last ones seen, a bar on the
    // edge says how tall.
    if (click.last === MOST && seen > 0 && seen + round <= MOST) {
      let near = 0
      let far = 0
      for (let m = Math.max(1, seen - round + 1); m <= seen; m++) near = Math.max(near, levels[m])
      for (let m = MOST - round + 1; m <= MOST; m++) far = Math.max(far, levels[m])
      const tall = Math.abs(yOf(scope, out ? out(far) : far, side) - base)
      if (tall >= Math.abs(yOf(scope, out ? out(near) : near, side) - base) + 2) {
        ctx.globalAlpha = INK.text
        ctx.fillRect(right - 2, side === 0 ? base - tall : base, 2, tall)
      }
    }
  }
  ctx.globalAlpha = 1
  ctx.restore()

  // The lines the levels stand on, and now.
  rule(ctx, box.x, base, right, base, { colour: colours.ink, alpha: INK.rule })
  rule(ctx, nowX, box.y, nowX, box.y + box.h, { colour: colours.ink, alpha: INK.back })
  const now = heardNow ? ages[0] : 0
  if (!heardNow || !picture.bare) {
    // On the mark, in the second ink: the level going in now, or at rest the click itself.
    ctx.fillStyle = colours.accent
    for (const side of sides) {
      const y = yOf(scope, heardNow ? now : 1, side)
      ctx.fillRect(nowX - 1, Math.min(y, base), 3, Math.abs(y - base))
    }
  }
  if (sided && box.w >= 120) {
    text(frame, 'L', box.x + 1, box.y + 7, { alpha: INK.back })
    text(frame, 'R', box.x + 1, box.y + box.h, { alpha: INK.back })
  }
  return now
}

/** The time the point stands at, in words, and the feedback while it is in hand. */
function wordsOf(frame: DisplayFrame, seconds: number, feedback: number): string {
  const time = seconds >= 1 ? `${seconds.toFixed(2)} s` : `${Math.round(seconds * 1000)} ms`
  return frame.hot === POINT ? `${time}  ${Math.round(feedback * 100)}%` : time
}

/** Where the words stand: the top right corner of the scope. */
function wordsBox(frame: DisplayFrame, scope: Scope, words: string): Box {
  frame.ctx.font = `8px ${frame.fontFamily}`
  const width = Math.ceil(frame.ctx.measureText(words).width) + 3
  return { x: scope.box.x + scope.box.w - width, y: scope.box.y - 1, w: width + 1, h: 10 }
}

/** The point and the words beside it. */
function drawHandle(frame: DisplayFrame, scope: Scope, point: DisplayHandle, words: string): void {
  const { ctx, colours } = frame
  const hot = frame.hot === point.key
  // The rail it runs on: up is more feedback.
  rule(ctx, point.x, scope.base - scope.rise, point.x, scope.base, {
    colour: colours.ink,
    alpha: hot ? INK.back : INK.grid,
  })
  handle(frame, point.x, point.y, { hot })
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
}

/**
 * The pitch of the repeats, on the mark that stands for now: the middle of the
 * display is in tune, up is sharp. The slot about the mark is how far the
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
    // A slot either side of the mark, so what stands on the mark shows through.
    const top = y(pitch.swing)
    const tall = Math.max(1, y(-pitch.swing) - top)
    ctx.globalAlpha = INK.back
    ctx.fillStyle = colours.ink
    ctx.fillRect(nowX - 3, top, 2, tall)
    ctx.fillRect(nowX + 2, top, 2, tall)
    ctx.globalAlpha = 1
  }
  for (const cents of pitch.steps) {
    rule(ctx, nowX - 4, y(cents), nowX + 5, y(cents), { colour: colours.ink, alpha: INK.text })
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
  params: ['timeSec', 'feedback', 'damping', 'mix'],
  live: { signal: true },
  info: 'The bars are the repeats of one loud click on a scale of seconds, lower by Feedback, Damping and Mix, and a bar on the right edge means they grow louder later. Behind them the sound that went in runs on from now, the mark, into its repeats. Drag the point: across is Time, up is Feedback.',
  init: newEchoState,
  draw(frame) {
    ground(frame)
    const scope = delayScope(frame)
    const feedback = frame.value('feedback')
    const damping = frame.value('damping')
    const seconds = frame.value('timeSec')
    const mix = frame.value('mix')
    const span = spanNow(frame, 'timeSec', seconds)
    const words = wordsOf(frame, seconds, feedback)
    drawEchoes(frame, {
      scope,
      // `Delay.ts`: the delay feeds the wet gain, which is Mix itself, and
      // goes round through the damping filter and the feedback gain. Nothing
      // in the loop holds a level down: where a pass gives back more than it
      // took, the repeats grow, and are drawn growing to the top of the scale.
      loop: { grid: 1, heads: ONE_HEAD, feedback, cross: 0, send: BOTH_SIDES, level: mix },
      key: `${feedback.toFixed(4)} ${damping.toFixed(1)} ${mix.toFixed(4)} ${frame.sampleRate}`,
      losses: (kept) => {
        // A Web Audio low-pass, whose Q of √½ is read as decibels: it stands
        // 1.7 dB proud under its corner, so over a Feedback of 0.82 a pass
        // gives back more than it took there.
        const filter = biquad('lowpass', damping, Math.SQRT1_2, 0, frame.sampleRate, true)
        keptLevels(
          kept,
          () => 1,
          (hz) => powerOfDb(biquadDb(filter, hz, frame.sampleRate)),
        )
      },
      seconds,
      place: 1,
      span,
      words: wordsBox(frame, scope, words),
    })
    drawHandle(
      frame,
      scope,
      echoHandle(frame, scope, 'timeSec', 'feedback', 1, span, frame.dragging),
      words,
    )
  },
  handles: (view) => [pointOf(view, delayScope(view), 'timeSec', 'feedback', 1)],
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
    'mix',
  ],
  live: { signal: true, meters: true },
  info: 'The bars are the repeats of one loud click on a scale of seconds: a long Time, a low Tone, a worn line and less Mix make them lower. The dots on the mark for now are the pitch of the echoes on each side, up for sharp. Drag the point for Time and Feedback.',
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
    const wet = wetOf(frame.value('mix'))
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
    const headroom = 1 - BBD_HEADROOM_LOSS * age
    const clockHz = BBD_SAMPLES / seconds
    const inCorner = Math.min(tone, BBD_INPUT_SHARE * clockHz)
    const outCorner = Math.min(tone, BBD_OUTPUT_SHARE * clockHz)
    const span = spanNow(frame, 'time', seconds)
    const words = wordsOf(frame, seconds, feedback)
    drawEchoes(frame, {
      scope,
      loop: { grid: 1, heads: ONE_HEAD, feedback, cross: 0, send: BOTH_SIDES, level: wet },
      key: `${feedback.toFixed(4)} ${inCorner.toFixed(1)} ${outCorner.toFixed(1)} ${age.toFixed(3)} ${wet.toFixed(4)}`,
      losses: (kept) => {
        // Every repeat goes through both fourth-order low-passes and the low
        // cut once more: the first as well, since they stand in the line's path.
        const pass = (hz: number): number =>
          butterworth(inCorner, 4, hz) *
          butterworth(outCorner, 4, hz) *
          powerOfDb(onePoleDb('highpass', BBD_LOW_CUT_HZ, hz))
        keptLevels(kept, pass, pass)
      },
      // Every pass goes through the line, which saturates towards its
      // headroom behind a 2:1 compressor and in front of a 1:2 expander: for a
      // steady level a root and a square, which put a full-scale sine at half
      // the headroom of a new line (`compander.h`, `bbd_line.h`). After the
      // expander the wet path is linear to ±1 and never past ±2.
      record: (level) => {
        const line = headroom * fastTanh((BBD_COMPRESSED * Math.sqrt(level)) / headroom)
        return softLimit((line / BBD_COMPRESSED) ** 2)
      },
      seconds,
      place: 1 / clamp(mean, 0.25, 4),
      span,
      bare: true,
      words: wordsBox(frame, scope, words),
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
    const pitchOf = (side: 0 | 1): number =>
      centsOf(readBack(state.clocks[side], 0) / readBack(state.clocks[side], delayNow))
    drawPitch(frame, scope, {
      scale: intervals.length > 0 ? 1300 : 140,
      swing,
      steps: intervals.flatMap((clock) => [centsOf(clock), -centsOf(clock)]),
      now:
        running && sounds(frame) ? (spread > 0.002 ? [pitchOf(0), pitchOf(1)] : [pitchOf(0)]) : [],
    })
    drawHandle(
      frame,
      scope,
      echoHandle(frame, scope, 'time', 'feedback', 0.001, span, frame.dragging),
      words,
    )
  },
  handles: (view) => [pointOf(view, analogScope(view), 'time', 'feedback', 0.001)],
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
/**
 * The pitch the wow and the flutter reach at full, either way: how fast the
 * read point moves. The wow is 1.6 ms of a drift of three sines about 0.5 Hz
 * (`kit::Drift`: 2π × 0.5 × 0.516 at its steepest); the flutter 0.07 ms of 0.7
 * of a sine at 7.1 Hz and 0.3 of a drift about 1.9 Hz.
 */
const TAPE_WOW_SWING = 0.0052
const TAPE_FLUTTER_SWING = 0.0024

function tapeScope(view: DisplayView): Scope {
  return scopeOf(scopeBox(view), true)
}

const tapeEcho = plateDisplay<EchoState>({
  place: 'strip',
  params: [
    'time',
    'feedback',
    'heads',
    'wow',
    'flutter',
    'drive',
    'lowCut',
    'highCut',
    'spread',
    'mix',
  ],
  live: { signal: true, meters: true },
  info: 'The bars are the repeats of one loud click from every head on a scale of seconds, as loud as Mix lets them out, the left side above the line and the right below, so Ping Pong is seen to bounce. The dot on the mark for now is the tape speed, up for sharp. Drag the point for Time and Feedback.',
  init: newEchoState,
  draw(frame) {
    ground(frame)
    const scope = tapeScope(frame)
    const seconds = frame.value('time') / 1000
    const feedback = frame.value('feedback')
    const mode = clamp(Math.round(frame.value('heads')), 0, 3)
    const spread = frame.value('spread')
    const lowCut = frame.value('lowCut')
    const highCut = frame.value('highCut')
    const wet = wetOf(frame.value('mix'))
    // The record path: tanh at unity gain for a small sound, harder with Drive.
    const drive = 1 + 3 * frame.value('drive')
    const running = frame.powered && frame.dt > 0 && frame.hasMeter('speed')
    let place = 1
    let cents = 0
    if (running) {
      // The head on its way to where the knob says, with the motor's lag.
      const head = frame.meter('time')
      if (head > 0) place = clamp(head / (seconds * 1000), 0.05, 20)
      // While the motor chases a longer Time the head runs away faster than
      // the tape and the repeats play backwards: that is off the foot of the scale.
      const speed = frame.meter('speed')
      cents = speed === 0 ? 0 : centsOf(Math.max(speed, 0.01))
    }
    const span = spanNow(frame, 'time', seconds)
    const words = wordsOf(frame, seconds, feedback)
    drawEchoes(frame, {
      scope,
      loop: {
        grid: 3,
        heads: TAPE_HEADS[mode],
        feedback,
        // Ping Pong records the input on the left tape and crosses the feedback.
        cross: spread,
        send: [1, 1 - spread],
        level: wet,
      },
      key: `${mode} ${feedback.toFixed(4)} ${spread.toFixed(3)} ${lowCut.toFixed(1)} ${highCut.toFixed(1)} ${drive.toFixed(3)} ${wet.toFixed(4)}`,
      losses: (kept) =>
        // The cuts stand in the feedback path only: the first echo is whole.
        keptLevels(
          kept,
          () => 1,
          (hz) => svfLowpass(highCut, 0.6, hz) * powerOfDb(onePoleDb('highpass', lowCut, hz)),
        ),
      // Whatever is recorded, the click and every pass of it, saturates.
      record: (level) => fastTanh(level * drive) / drive,
      seconds,
      place,
      span,
      bare: true,
      words: wordsBox(frame, scope, words),
    })
    drawPitch(frame, scope, {
      scale: 20,
      swing: centsOf(
        1 + TAPE_WOW_SWING * frame.value('wow') + TAPE_FLUTTER_SWING * frame.value('flutter'),
      ),
      steps: [],
      now: running && sounds(frame) ? [cents] : [],
    })
    drawHandle(
      frame,
      scope,
      echoHandle(frame, scope, 'time', 'feedback', 0.001, span, frame.dragging),
      words,
    )
  },
  handles: (view) => [pointOf(view, tapeScope(view), 'time', 'feedback', 0.001)],
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
  params: ['time', 'feedback', 'echo', 'tone', 'memory', 'reach', 'size', 'wander', 'mix'],
  live: { signal: true, meters: true },
  info: 'Above, the echo: the bars are the repeats of one loud click on a scale of seconds, as loud as Echo and Mix let them out. Below, the memory, from Reach ago at the left to now at the right, with a mark in the second colour where a moment is being played back. Drag the point for Time and Feedback.',
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
    const wet = wetOf(frame.value('mix'))
    const running = frame.powered && frame.dt > 0 && frame.hasMeter('time')
    let place = 1
    if (running) {
      const head = frame.meter('time')
      if (head > 0) place = clamp(head / (seconds * 1000), 0.05, 20)
    }
    const span = spanNow(frame, 'time', seconds)
    const words = wordsOf(frame, seconds, feedback)
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
      // What is recorded and what is played are both limited: linear to full
      // scale. Mix comes after the limit.
      record: softLimit,
      out: (level) => softLimit(level) * wet,
      seconds,
      place,
      span,
      words: wordsBox(frame, scope, words),
    })
    drawHandle(
      frame,
      scope,
      echoHandle(frame, scope, 'time', 'feedback', 0.001, span, frame.dragging),
      words,
    )

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
      const across = Math.max(3, (length / reach) * band.w)
      ctx.beginPath()
      ctx.moveTo(from, foot)
      for (let x = 0; x <= across; x += 1) {
        ctx.lineTo(from + x, foot - momentWindow(x / across) * memory * (band.h - 1))
      }
      ctx.lineTo(from + across, foot)
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.globalAlpha = state.sounding ? INK.back : 1
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    // Over what was played, which would cross the figures.
    label(frame, `${Math.round(reach)} s`, band.x + 2, crisp(foot - 2) - 0.5)
  },
  handles: (view) => [pointOf(view, memoryBoxes(view).scope, 'time', 'feedback', 0.001)],
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
