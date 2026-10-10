// The display of Late Vibrato: one note's life from left to right. The pitch
// runs straight for Wait, then the sway opens along the device's own S over
// Grow to its Depth and goes on, drawn as the wave itself at the Rate (and
// faster as it opens, with Quicken). Where the cycles are too close to draw
// one by one they close up into the band they fill. A dot rides the line
// where the note sounding now is in its life, at the bend the device reports,
// and the wave is laid so that it passes under the dot: the cycle runs freely,
// so every note meets it somewhere else.
//
// Time is to scale across the whole strip, and the scale follows the settings:
// the point where the sway is fully open stands further right the longer Wait
// and Grow are (a quarter of the way across at the shortest, most of the way
// at the longest), and never so far that fewer than two and a half cycles are
// left to see after it. The figure in the corner is the time at the right edge.

import {
  INK,
  PHASE_STANDS_SEC,
  clamp,
  dot,
  fillBetween,
  ground,
  handle,
  label,
  lerp,
  rule,
  trace,
  trackPhase,
  type Box,
  type PhaseTrack,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayHold,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- The device's own numbers, from `cpp/devices/late-vibrato/late_vibrato.h` --

/** `kQuickenMost`: how much of the rate Quicken adds once the sway is open. */
const QUICKEN_MOST = 0.5
/** `kHumanRate` and `kHumanDepth`: how far Human wanders the rate and the depth. */
const HUMAN_RATE = 0.12
const HUMAN_DEPTH = 0.25
/** `(kLatency − kGuard) / 96000`: the room the read point has either side of its centre, in seconds. */
const ROOM_SEC = (960 - 8) / 96000

/** `cents_per_hz_`: the cents of Depth a sway holds for each Hz of its Rate. */
export const LATE_VIBRATO_CENTS_PER_HZ = (ROOM_SEC * Math.PI * 1200) / Math.LN2

/** How open the sway is (0..1) in a note held for `age` seconds: `sway_`, the S of `u_`. */
export function lateVibratoSway(age: number, wait: number, grow: number): number {
  const u = clamp((age - wait) / grow, 0, 1)
  return u * u * (3 - 2 * u)
}

/** The most Depth the device lets through at a Rate, in cents: `most_cents_`. */
export function lateVibratoMost(rate: number, human: number): number {
  return (LATE_VIBRATO_CENTS_PER_HZ * rate * (1 - HUMAN_RATE * human)) / (1 + HUMAN_DEPTH * human)
}

/** The rate of the sway when it is so far open, in Hz: `rate_now_` without Human. */
export function lateVibratoRate(rate: number, quicken: number, sway: number): number {
  return rate * (1 + QUICKEN_MOST * quicken * sway)
}

/**
 * How many cycles the sway turns through in the first `age` seconds of a
 * note: `lateVibratoRate` summed over them. The S sums to `u³ − u⁴ / 2`.
 */
export function lateVibratoTurns(
  age: number,
  wait: number,
  grow: number,
  rate: number,
  quicken: number,
): number {
  const u = clamp((age - wait) / grow, 0, 1)
  const open = grow * (u * u * u - (u * u * u * u) / 2) + Math.max(0, age - wait - grow)
  return rate * (age + QUICKEN_MOST * quicken * open)
}

// --- The scale across ---------------------------------------------------------

/** The shortest and the longest Wait and Grow come to together, in seconds. */
const SHORTEST_SEC = 0.03
const LONGEST_SEC = 12
/** How far across the fully open point stands at the shortest and at the longest. */
const PART_LEAST = 0.25
const PART_MOST = 0.85
/** The cycles of the open sway there is always room for after it. */
const CYCLES_AFTER = 2.5
/** The top of the scale upward, in cents: the most Depth there is. */
const DEPTH_TOP = 100

/** How far across the fully open point stands, as a part of the width. */
function partOf(total: number, rate: number): number {
  const byLength =
    PART_LEAST +
    ((PART_MOST - PART_LEAST) * Math.log(total / SHORTEST_SEC)) /
      Math.log(LONGEST_SEC / SHORTEST_SEC)
  const byCycles = total / (total + CYCLES_AFTER / rate)
  return clamp(Math.min(byLength, byCycles), 0.001, PART_MOST)
}

/** The length of Wait and Grow together that puts the fully open point so far across: `partOf` the other way. */
function totalAt(part: number, rate: number): number {
  const byLength =
    SHORTEST_SEC *
    Math.pow(LONGEST_SEC / SHORTEST_SEC, (part - PART_LEAST) / (PART_MOST - PART_LEAST))
  const byCycles = ((CYCLES_AFTER / rate) * part) / (1 - part)
  return Math.max(byLength, byCycles)
}

/** The seconds the strip spans at a setting. */
export function lateVibratoSpanSec(wait: number, grow: number, rate: number): number {
  return (wait + grow) / partOf(wait + grow, rate)
}

/** A setting as the picture needs it: times in seconds, the Depth the device lets through. */
interface Life {
  wait: number
  grow: number
  rate: number
  quicken: number
  human: number
  mix: number
  /** Depth as set, and as much of it as the Rate holds, in cents. */
  depth: number
  shown: number
  span: number
}

function lifeOf(view: DisplayView): Life {
  const wait = Math.max(0.001, view.value('wait') / 1000)
  const grow = Math.max(0.001, view.value('grow') / 1000)
  const rate = Math.max(0.05, view.value('rate'))
  const human = clamp(view.value('human'), 0, 1)
  const depth = clamp(view.value('depth'), 0, DEPTH_TOP)
  return {
    wait,
    grow,
    rate,
    quicken: clamp(view.value('quicken'), 0, 1),
    human,
    mix: clamp(view.value('mix'), 0, 1),
    depth,
    shown: Math.min(depth, lateVibratoMost(rate, human)),
    span: lateVibratoSpanSec(wait, grow, rate),
  }
}

/** Where the picture is drawn: the ground's own box. */
const lifeBox = (view: Pick<DisplayView, 'width' | 'height'>): Box => ({
  x: 4,
  y: 4,
  w: view.width - 8,
  h: view.height - 8,
})

/** The height of the straight line, and the pixels a bend of the whole scale takes. */
const middleOf = (box: Box): number => box.y + box.h / 2
const reachOf = (box: Box): number => box.h / 2 - 1.5

// --- Handles ------------------------------------------------------------------

function lateVibratoHandles(view: DisplayView): DisplayHandle[] {
  const box = lifeBox(view)
  const life = lifeOf(view)
  const mid = middleOf(box)
  const reach = reachOf(box)
  const waitSpec = view.spec('wait')
  const growSpec = view.spec('grow')
  const depthSpec = view.spec('depth')
  const across = (x: number): number => clamp((x - box.x) / box.w, 0, 1)
  /** How far across the Wait point stands with Wait at so many seconds and Grow as it is. */
  const waitAt = (wait: number): number =>
    (partOf(wait + life.grow, life.rate) * wait) / (wait + life.grow)
  return [
    {
      key: 'wait',
      name: 'Wait',
      x: box.x + (box.w * life.wait) / life.span,
      y: mid,
      // A longer Wait is a longer life, so the scale gives as the point is
      // pulled: the Wait is found that stands under the hand on its own scale.
      drag: (x) => {
        const to = across(x)
        let low = (waitSpec?.min ?? 10) / 1000
        let high = (waitSpec?.max ?? 4000) / 1000
        if (to <= waitAt(low)) return { wait: low * 1000 }
        if (to >= waitAt(high)) return { wait: high * 1000 }
        for (let round = 0; round < 48; round++) {
          const between = Math.sqrt(low * high)
          if (waitAt(between) < to) low = between
          else high = between
        }
        return { wait: Math.sqrt(low * high) * 1000 }
      },
      reset: () => ({ wait: waitSpec?.default ?? 350 }),
    },
    {
      key: 'full',
      name: 'Grow and Depth',
      x: box.x + (box.w * (life.wait + life.grow)) / life.span,
      y: mid - (reach * life.shown) / DEPTH_TOP,
      drag: (x, y, hold?: DisplayHold) => {
        const total = totalAt(Math.min(across(x), 0.98), life.rate)
        // A slow Rate holds less Depth than is set: the point waits at what is
        // held, and moves from where the setting lies, as far over as it lay
        // at the press.
        const kept = hold ?? {}
        kept.past ??= life.depth - life.shown
        // Not held to the scale here: under the straight line is where the
        // hand goes to take off what lies over.
        const cents = ((mid - y) / reach) * DEPTH_TOP
        return {
          grow: clamp((total - life.wait) * 1000, growSpec?.min ?? 20, growSpec?.max ?? 8000),
          depth: clamp(cents + kept.past, depthSpec?.min ?? 0, depthSpec?.max ?? DEPTH_TOP),
        }
      },
      reset: () => ({ grow: growSpec?.default ?? 900, depth: depthSpec?.default ?? 28 }),
    },
  ]
}

// --- The picture ----------------------------------------------------------------

interface LateVibratoState {
  /** The cycle between two readings of it. */
  track: PhaseTrack | null
  /** The note's age carried on between two readings, the reading itself, and how long it has stood. */
  age: number
  read: number
  stood: number
  /** Where the cycle stood when the note in the picture began, in cycles; null before any note. */
  base: number | null
}

const TWO_PI = Math.PI * 2

/** A step of 1, 2 or 5 that marks a span some four to eight times. */
function tickStep(span: number): number {
  const decade = Math.pow(10, Math.floor(Math.log10(span / 4)))
  const over = span / 4 / decade
  return decade * (over >= 5 ? 5 : over >= 2 ? 2 : 1)
}

function spanText(span: number): string {
  if (span < 0.995) return `${Math.round(span * 1000)} ms`
  return span < 9.95 ? `${span.toFixed(1)} s` : `${Math.round(span)} s`
}

const lateVibrato = plateDisplay<LateVibratoState>({
  place: 'strip',
  params: ['wait', 'grow', 'depth', 'rate', 'quicken', 'human', 'mix'],
  live: { meters: true, fps: 60 },
  info: 'One note from left to right: straight through Wait, then the sway opening over Grow to its Depth, drawn at its Rate. The shade is how far Human lets it wander; the dot is the note sounding now. Drag the first point for Wait, the second for Grow and Depth. The figure is the time at the right edge.',
  init: () => ({ track: null, age: 0, read: 0, stood: 0, base: null }),
  draw(frame) {
    const { ctx, colours, state } = frame
    const box = ground(frame)
    const life = lifeOf(frame)
    const mid = middleOf(box)
    const reach = reachOf(box)
    const right = box.x + box.w
    const foot = box.y + box.h
    const xOf = (seconds: number): number => box.x + (box.w * seconds) / life.span
    const yOf = (cents: number): number => mid - (reach * cents) / DEPTH_TOP
    const turns = (seconds: number): number =>
      lateVibratoTurns(seconds, life.wait, life.grow, life.rate, life.quicken)

    // The note sounding now, from the device: how long it has been held, and
    // where the cycle is. Both come thirty times a second and are carried on
    // between two readings.
    const running = frame.powered && frame.hasMeter('age') && frame.dt > 0
    let held = false
    let phase = 0
    if (running) {
      const reading = Math.max(0, frame.meter('age'))
      if (reading !== state.read) {
        state.age = reading
        state.read = reading
        state.stood = 0
      } else {
        state.stood += frame.dt
        // The same age twice over is a device that is not running: the note stands.
        if (reading > 0 && state.stood < PHASE_STANDS_SEC) state.age += frame.dt
      }
      state.track = trackPhase(state.track, frame.meter('phase'), frame.meter('rate'), frame.dt)
      phase = state.track.phase
      held = state.age > 0
      // The wave passes under the dot. A note older than the picture stands at
      // its right edge, and the wave runs on under it.
      if (held) state.base = phase - turns(Math.min(state.age, life.span))
    } else if (!frame.powered) {
      state.track = null
      state.base = null
      state.age = 0
      state.read = 0
    }
    // With no note to go by, the sway is drawn rising through nought as Wait ends.
    const base = (running ? state.base : null) ?? -turns(life.wait)

    // Time along the foot, and the straight pitch across the middle.
    const step = tickStep(life.span)
    for (let at = step; at < life.span - step * 0.01; at += step)
      rule(ctx, xOf(at), foot - 3, xOf(at), foot, { colour: colours.ink, alpha: INK.rule })
    rule(ctx, box.x, mid, right, mid, { colour: colours.ink, alpha: INK.grid })

    // The swaying voice from the end of Wait on: for each half pixel, the
    // highest and the lowest the wave comes within it. Far apart, the two are
    // one line, the wave; close up, they are the edges of the band it fills.
    const from = xOf(life.wait)
    const within = (0.25 * life.span) / box.w
    const upper: Point[] = []
    const lower: Point[] = []
    const over: Point[] = []
    const under: Point[] = []
    const crest: Point[] = []
    const wander = 1 + HUMAN_DEPTH * life.human
    for (let x = from; ; x = Math.min(right, x + 0.5)) {
      const seconds = ((x - box.x) / box.w) * life.span
      const open = life.shown * lateVibratoSway(seconds, life.wait, life.grow)
      const a = base + turns(Math.max(life.wait, seconds - within))
      const b = base + turns(seconds + within)
      const sa = Math.sin(a * TWO_PI)
      const sb = Math.sin(b * TWO_PI)
      // A crest lies a quarter of the way through a cycle, a trough three quarters.
      const high = Math.floor(b - 0.25) > Math.floor(a - 0.25) ? 1 : Math.max(sa, sb)
      const low = Math.floor(b - 0.75) > Math.floor(a - 0.75) ? -1 : Math.min(sa, sb)
      upper.push([x, yOf(open * high)])
      lower.push([x, yOf(open * low)])
      over.push([x, yOf(Math.min(DEPTH_TOP, open * wander))])
      under.push([x, yOf(-Math.min(DEPTH_TOP, open * wander))])
      crest.push([x, yOf(open)])
      if (x >= right) break
    }
    // Both voices are drawn as strongly as Mix lets each be heard; at either
    // end of Mix the other one is not there.
    const wet = life.mix > 0 ? lerp(0.35, 1, life.mix) : 0
    const dry = life.mix < 1 ? lerp(0.35, 1, 1 - life.mix) : 0
    if (wet > 0) fillBetween(ctx, over, under, colours.ink, INK.fill * wet)
    // What is set, whatever is heard of it: the S the sway opens along, from
    // the one point to the other.
    trace(ctx, crest, { colour: colours.ink, width: 1, alpha: INK.rule, dash: [2, 2] })
    trace(
      ctx,
      [
        [box.x, mid],
        [from, mid],
      ],
      { colour: colours.ink },
    )
    if (dry > 0)
      trace(
        ctx,
        [
          [from, mid],
          [right, mid],
        ],
        { colour: colours.ink, width: 1, alpha: dry },
      )
    if (wet > 0) {
      fillBetween(ctx, upper, lower, colours.ink, wet)
      trace(ctx, upper, { colour: colours.ink, width: 1.25, alpha: wet })
      trace(ctx, lower, { colour: colours.ink, width: 1.25, alpha: wet })
    }

    label(frame, spanText(life.span), right - 1, foot - 1, 'right')

    handle(frame, from, mid, { hot: frame.hot === 'wait' })
    handle(frame, xOf(life.wait + life.grow), yOf(life.shown), { hot: frame.hot === 'full' })

    // The note now: as far along as it is old, at the bend the device reports.
    if (held) {
      const bend = life.mix > 0 ? frame.meter('depth') * Math.sin(phase * TWO_PI) : 0
      dot(
        ctx,
        xOf(Math.min(state.age, life.span)),
        clamp(yOf(bend), box.y, foot),
        2.5,
        colours.accent,
        { ring: colours.ink },
      )
    }
  },
  handles: lateVibratoHandles,
})

export const LATE_VIBRATO_FACES: Readonly<Record<string, PlateFace>> = {
  'late-vibrato': {
    display: lateVibrato,
    face: ['wait', 'grow', 'depth', 'rate'],
  },
}
