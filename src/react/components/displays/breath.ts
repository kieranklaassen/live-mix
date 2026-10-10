// The Breath's display: one whole breath as it is set, drawn from the same
// formulas the device computes (`cpp/devices/breath/breath.h`), with a mark
// where the breath is now, from the place in the cycle the device reports.
//
// Across is time, the four parts each as wide as their share of the cycle:
// In, Hold, Out, Rest. Up is how much of the sound comes out: the top of the
// scale is the sound untouched, the foot is silence. The heavy line is the
// level; the fainter one under it is the level of the highs (4 kHz), which the
// colour filter takes down further as the breath empties; the short strokes
// over the two slopes are the air, tallest where it is loudest.

import {
  INK,
  clamp,
  clipped,
  dbText,
  dot,
  fillTo,
  follow,
  gainToDb,
  ground,
  handle,
  label,
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

// --- The device's own formulas ------------------------------------------------

/** Where the colour filter stands shut, and how many times higher it counts as open: `kClosedHz`, `kRange`. */
export const BREATH_CLOSED_HZ = 200
export const BREATH_RANGE = 100
/** Each of the filter's two poles has its corner this many times over the cutoff: `kPoleScale`. */
export const BREATH_POLE_SCALE = 1.553774
/** The frequency the fainter line is the level of. */
export const BREATH_HIGHS_HZ = 4000

/** The four lengths as they are set, in seconds, and their sum. */
export interface BreathParts {
  in: number
  hold: number
  out: number
  rest: number
  total: number
}

export function breathParts(view: Pick<DisplayView, 'value'>): BreathParts {
  const part = (name: string): number => Math.max(0, view.value(name))
  const parts = { in: part('in'), hold: part('hold'), out: part('out'), rest: part('rest') }
  // A device always has an In and an Out; a view of nothing still has a cycle to draw.
  const total = parts.in + parts.hold + parts.out + parts.rest
  return total > 0 ? { ...parts, total } : { in: 1, hold: 0, out: 1, rest: 0, total: 2 }
}

/** The floor the level falls to on an empty breath, `(1 − Depth^1.5)²`: `Breath::floor_gain`. */
export function breathFloor(depth: number): number {
  const open = 1 - depth * Math.sqrt(depth)
  return open * open
}

/** The Depth that has that floor: `breathFloor` the other way round. */
export function breathDepthOf(floor: number): number {
  return Math.pow(1 - Math.sqrt(clamp(floor, 0, 1)), 2 / 3)
}

/** The way in at `t` (0..1): a line at Ease 0, half a cosine at 1: `Breath::rise`. */
export function breathRise(t: number, ease: number): number {
  return t + ease * (0.5 - 0.5 * Math.cos(Math.PI * t) - t)
}

/** The parts of a breath, in the order they come. */
export type BreathStage = 'in' | 'hold' | 'out' | 'rest'

/** Which part a place in the cycle (0..1 of it as set) lies in, and how far through that part (0..1). */
export function breathPlace(phase: number, parts: BreathParts): { stage: BreathStage; t: number } {
  const seconds = clamp(phase, 0, 1) * parts.total
  if (seconds < parts.in) return { stage: 'in', t: seconds / parts.in }
  const held = seconds - parts.in
  if (held < parts.hold) return { stage: 'hold', t: held / parts.hold }
  const leaving = held - parts.hold
  if (leaving < parts.out) return { stage: 'out', t: leaving / parts.out }
  const resting = leaving - parts.out
  return { stage: 'rest', t: parts.rest > 0 ? Math.min(1, resting / parts.rest) : 0 }
}

/** How full the breath is (0 empty, 1 full) at `t` through a part: `Breath::breath_at`. */
export function breathIn(stage: BreathStage, t: number, ease: number): number {
  if (stage === 'in') return breathRise(t, ease)
  if (stage === 'hold') return 1
  if (stage === 'out') return 1 - breathRise(t, ease)
  return 0
}

/** How full the breath is at a place in the cycle (0..1 of it as set). */
export function breathAt(phase: number, parts: BreathParts, ease: number): number {
  const { stage, t } = breathPlace(phase, parts)
  return breathIn(stage, t, ease)
}

/** How loud the air is through a part, of its most: half a sine over In and over Out, nothing between. */
export function breathAir(stage: BreathStage, t: number): number {
  return stage === 'in' || stage === 'out' ? Math.sin(Math.PI * t) : 0
}

/**
 * How tall the air's stroke stands at a place, of the tallest: the square
 * root of the air's level there, which is Air squared times the flow, times
 * the breath's own gain there (the air is as loud as the breathing sound, so
 * Depth turns it down with it), times Mix. The root, so that a quarter of the
 * knob is a quarter of the height and a little air is still seen.
 */
export function breathAirSize(
  air: number,
  mix: number,
  stage: BreathStage,
  t: number,
  gain = 1,
): number {
  return Math.sqrt(air * air * mix * breathAir(stage, t) * gain)
}

/** The gain on the breathing sound for a breath `b`: the floor up to unity. */
export function breathGain(b: number, depth: number): number {
  const floor = breathFloor(depth)
  return floor + (1 - floor) * b
}

/** What that gain comes to once Mix has let the untouched sound in beside it (a linear crossfade). */
export function breathLevel(b: number, depth: number, mix: number): number {
  return 1 - mix + mix * breathGain(b, depth)
}

/** Where the colour filter is 3 dB down for a closing of 0..1, in Hz; infinite at 0: `Breath::cutoff_hz`. */
export function breathCutoffHz(closing: number): number {
  return (BREATH_CLOSED_HZ * (BREATH_RANGE - 1)) / (Math.pow(BREATH_RANGE, closing) - 1)
}

/**
 * The level of a tone of `hz` at the output for a breath `b`, of its level
 * going in: through the filter's two equal poles (each `exp(−2π·corner/rate)`,
 * as the device has them), the gain, and Mix's crossfade with the untouched
 * sound, whose phase the filter has turned.
 */
export function breathHighs(
  b: number,
  depth: number,
  colour: number,
  mix: number,
  sampleRate: number,
  hz = BREATH_HIGHS_HZ,
): number {
  const closing = colour * (1 - b)
  const corner = closing > 0 ? breathCutoffHz(closing) * BREATH_POLE_SCALE : Infinity
  const a = Number.isFinite(corner) ? Math.exp((-2 * Math.PI * corner) / sampleRate) : 0
  const w = (2 * Math.PI * hz) / sampleRate
  // One pole is (1 − a) / (1 − a·e^(−jw)); two of them are its square.
  const re = 1 - a * Math.cos(w)
  const im = a * Math.sin(w)
  const size = re * re + im * im
  const scale = ((1 - a) * (1 - a)) / (size * size)
  const wet = breathGain(b, depth) * mix * scale
  return Math.hypot(1 - mix + wet * (re * re - im * im), -wet * 2 * re * im)
}

// --- The picture --------------------------------------------------------------

/** What a point's ring takes about its middle when it is lit: the kit's 4.5 px and half its 1.5 px line. */
const RING_ROOM = 5.25
/** Under this Mix the Depth point goes no nearer the top: with no Mix it would have nowhere to be taken from. */
const DEPTH_TRAVEL_LEAST = 0.5

/** The box the breath is drawn in: a ring on any of its edges is whole on the canvas. */
export function breathBox(view: Pick<DisplayView, 'width' | 'height'>): Box {
  const pad = Math.ceil(RING_ROOM) + 1
  return { x: pad, y: pad - 1, w: view.width - 2 * pad, h: view.height - 2 * (pad - 1) }
}

const yOfLevel = (level: number, box: Box): number => box.y + (1 - clamp(level, 0, 1)) * box.h
const xOfSeconds = (seconds: number, parts: BreathParts, box: Box): number =>
  box.x + (seconds / parts.total) * box.w

/** A length as it is said: "0.5 s", "12 s". */
export function secondsText(seconds: number): string {
  const tenths = Math.round(seconds * 10) / 10
  return `${tenths >= 10 ? Math.round(tenths).toString() : tenths.toFixed(1)} s`
}

interface Range {
  min: number
  max: number
}

const rangeOf = (view: DisplayView, name: string, min: number, max: number): Range => ({
  min: view.spec(name)?.min ?? min,
  max: view.spec(name)?.max ?? max,
})

/**
 * The lengths a corner is moved from: those it had when it was pressed, kept
 * in the hold for as long as the hand is on it. A corner pushed through a part
 * that ran out of time gives that time back on the way back, so where the
 * hand is says what the breath is, whatever way it came there.
 */
function pressedParts(hold: DisplayHold | undefined, parts: BreathParts): BreathParts {
  if (!hold) return parts
  if (hold.total === undefined) {
    hold.in = parts.in
    hold.hold = parts.hold
    hold.out = parts.out
    hold.rest = parts.rest
    hold.total = parts.total
  }
  return { in: hold.in, hold: hold.hold, out: hold.out, rest: hold.rest, total: hold.total }
}

/**
 * The points of the display. Three stand on the corners of the shape, where
 * one part ends and the next begins: taken across, a corner gives time to the
 * part at one side of it and takes as much from the part at the other, so
 * the breath stays as long as it was and the corner stays under the hand. A
 * corner pushed against a part that is as short as it goes (a Hold of 20 ms)
 * pushes on into the next. The fourth stands on the floor at the start of the
 * breath: up and down is Depth, taken back through Mix, which scales the fall
 * with it.
 */
function breathHandles(view: DisplayView): DisplayHandle[] {
  const box = breathBox(view)
  const parts = breathParts(view)
  const depth = view.value('depth')
  const mix = view.value('mix')
  const ins = rangeOf(view, 'in', 0.2, 20)
  const holds = rangeOf(view, 'hold', 0.02, 20)
  const outs = rangeOf(view, 'out', 0.2, 20)
  const rests = rangeOf(view, 'rest', 0.02, 20)
  // Where the three corners stand, in seconds from the start of In.
  const fullX = xOfSeconds(parts.in, parts, box)
  const turnX = xOfSeconds(parts.in + parts.hold, parts, box)
  const emptyX = xOfSeconds(parts.in + parts.hold + parts.out, parts, box)
  const secondsOf = (x: number, of: BreathParts): number =>
    clamp((x - box.x) / box.w, 0, 1) * of.total
  const top = box.y
  const foot = yOfLevel(breathLevel(0, depth, mix), box)
  const travel = Math.max(DEPTH_TRAVEL_LEAST, mix)
  const depthY = yOfLevel(1 - travel * (1 - breathFloor(depth)), box)
  const depthSpec = view.spec('depth')
  const still = (x: number, at: number): boolean => Math.abs(x - at) < 1e-6

  return [
    {
      key: 'depth',
      name: 'Depth',
      x: box.x,
      y: depthY,
      drag: (_x, y) => {
        if (still(y, depthY)) return { depth }
        const level = 1 - clamp((y - box.y) / box.h, 0, 1)
        const floor = clamp(1 - (1 - level) / travel, 0, 1)
        return {
          depth: clamp(breathDepthOf(floor), depthSpec?.min ?? 0, depthSpec?.max ?? 1),
        }
      },
      reset: () => ({ depth: depthSpec?.default ?? depth }),
    },
    {
      key: 'full',
      name: 'End of In',
      x: fullX,
      y: top,
      drag: (x, _y, hold) => {
        const from = pressedParts(hold, parts)
        if (still(x, fullX)) return { in: parts.in, hold: parts.hold, out: parts.out }
        const turn = from.in + from.hold
        const empty = turn + from.out
        // The latest In can end where Hold is as short as it goes.
        const latest = turn - holds.min
        const at = secondsOf(x, from)
        if (at <= latest || latest > ins.max) {
          // In against Hold.
          const length = clamp(at, Math.max(ins.min, turn - holds.max), Math.min(ins.max, latest))
          return { in: length, hold: turn - length, out: from.out }
        }
        // Hold has nothing left to give: on into Out.
        const length = clamp(at, latest, Math.min(ins.max, empty - holds.min - outs.min))
        return { in: length, hold: holds.min, out: empty - holds.min - length }
      },
      reset: () => ({
        in: view.spec('in')?.default ?? parts.in,
        hold: view.spec('hold')?.default ?? parts.hold,
        out: parts.out,
      }),
    },
    {
      key: 'turn',
      name: 'End of Hold',
      x: turnX,
      y: top,
      drag: (x, _y, hold) => {
        const from = pressedParts(hold, parts)
        if (still(x, turnX)) return { in: parts.in, hold: parts.hold, out: parts.out }
        const full = from.in
        const empty = full + from.hold + from.out
        // The soonest Hold can end where In is left as it is.
        const soonest = full + holds.min
        const at = secondsOf(x, from)
        if (at >= soonest || empty - soonest > outs.max) {
          // Hold against Out.
          const end = clamp(
            at,
            Math.max(soonest, empty - outs.max),
            Math.min(full + holds.max, empty - outs.min),
          )
          return { in: from.in, hold: end - full, out: empty - end }
        }
        // Hold has nothing left to give: back into In.
        const end = clamp(at, Math.max(ins.min + holds.min, empty - outs.max), soonest)
        return { in: end - holds.min, hold: holds.min, out: empty - end }
      },
      reset: () => ({
        in: parts.in,
        hold: view.spec('hold')?.default ?? parts.hold,
        out: view.spec('out')?.default ?? parts.out,
      }),
    },
    {
      key: 'empty',
      name: 'End of Out',
      x: emptyX,
      y: foot,
      drag: (x, _y, hold) => {
        const from = pressedParts(hold, parts)
        if (still(x, emptyX)) return { hold: parts.hold, out: parts.out, rest: parts.rest }
        const full = from.in
        const turn = full + from.hold
        // The soonest Out can end where Hold is left as it is.
        const soonest = turn + outs.min
        const at = secondsOf(x, from)
        if (at >= soonest || from.total - soonest > rests.max) {
          // Out against Rest.
          const end = clamp(
            at,
            Math.max(soonest, from.total - rests.max),
            Math.min(turn + outs.max, from.total - rests.min),
          )
          return { hold: from.hold, out: end - turn, rest: from.total - end }
        }
        // Out is as short as it goes: back into Hold.
        const end = clamp(
          at,
          Math.max(full + holds.min + outs.min, from.total - rests.max),
          soonest,
        )
        return { hold: end - outs.min - full, out: outs.min, rest: from.total - end }
      },
      reset: () => ({
        hold: parts.hold,
        out: view.spec('out')?.default ?? parts.out,
        rest: view.spec('rest')?.default ?? parts.rest,
      }),
    },
  ]
}

interface BreathState {
  /** Where the breath is, carried between the device's readings. */
  phase: PhaseTrack | null
  /** How loud the sound coming out is, 0..1, for how strongly the breath so far is filled. */
  sound: number
}

/** How strongly the breath so far is filled with no sound to go by, and with the loudest. */
const FILLED_LEAST = 0.22
const FILLED_MOST = 0.62
/** The level that fills it all the way: 12 dB under full scale. */
const FILLED_AT = 0.25
/** How far apart the air's strokes stand, in pixels. */
const AIR_STEP = 3
/** How tall the air's tallest stroke stands, as a share of the height of the scale. */
export const BREATH_AIR_SHARE = 0.2
/** How tall the patch the figures stand on is, and how far over the foot of the letters it starts: the kit's. */
const FIGURES_TALL = 10
const FIGURES_RISE = 8

const wrap = (cycles: number): number => cycles - Math.floor(cycles)

/** How much of a line lies in an area, in pixels along it. */
function within(line: readonly Point[], area: Box): number {
  let sum = 0
  for (let n = 1; n < line.length; n++) {
    const [x0, y0] = line[n - 1]
    const [x1, y1] = line[n]
    // The part of this piece that is inside, 0..1 along it: from where it comes in to where it leaves.
    let from = 0
    let to = 1
    const cut = (start: number, step: number, low: number, high: number): void => {
      if (step === 0) {
        if (start < low || start > high) to = -1
        return
      }
      const one = (low - start) / step
      const other = (high - start) / step
      from = Math.max(from, Math.min(one, other))
      to = Math.min(to, Math.max(one, other))
    }
    cut(x0, x1 - x0, area.x, area.x + area.w)
    cut(y0, y1 - y0, area.y, area.y + area.h)
    if (to > from) sum += (to - from) * Math.hypot(x1 - x0, y1 - y0)
  }
  return sum
}

/** How far a place is from an area: 0 inside it. */
function apart(x: number, y: number, area: Box): number {
  return Math.max(area.x - x, x - area.x - area.w, area.y - y, y - area.y - area.h, 0)
}

const breath = plateDisplay<BreathState>({
  place: 'strip',
  params: ['in', 'hold', 'out', 'rest', 'depth', 'colour', 'air', 'ease', 'mix'],
  live: { meters: true, signal: true },
  info: 'One breath as it is set: the level rising over In, full over Hold, falling over Out and on its floor over Rest. The fainter line is the highs, the strokes on the slopes the air, the mark where the breath is now. A corner gives time to one part from the next; the ring at the left is Depth.',
  init: () => ({ phase: null, sound: 0 }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const box = breathBox(frame)
    const parts = breathParts(frame)
    const depth = frame.value('depth')
    const colour = frame.value('colour')
    const ease = frame.value('ease')
    const mix = frame.value('mix')
    const air = frame.value('air')
    const foot = box.y + box.h
    const points = breathHandles(frame)

    // Where the breath is: the device's reading, carried on between two of them at the breath's own pace.
    const metered = frame.hasMeter('phase')
    const reading = Number.isFinite(frame.meter('phase')) ? wrap(frame.meter('phase')) : 0
    const pace = frame.meter('pace') > 0 ? frame.meter('pace') : 1
    if (metered && frame.powered) {
      state.phase = trackPhase(state.phase, reading, 1 / (parts.total * pace), frame.dt)
    } else {
      state.phase = null
    }
    const now = state.phase?.phase ?? reading
    if (frame.signal) {
      const heard = clamp(frame.signal.output.peak / FILLED_AT, 0, 1)
      state.sound = follow(state.sound, heard, frame.dt, 0.05, 0.5)
    } else {
      state.sound = 0
    }

    // The scale: the sound untouched at the top, silence at the foot, and where each part ends.
    rule(ctx, box.x, box.y, box.x + box.w, box.y, { colour: colours.ink, alpha: INK.grid })
    rule(ctx, box.x, foot, box.x + box.w, foot, { colour: colours.ink, alpha: INK.grid })
    for (const point of points) {
      if (point.key === 'depth') continue
      rule(ctx, point.x, box.y, point.x, foot, { colour: colours.ink, alpha: INK.grid })
    }

    // The breath, part by part, so that every corner is a point of the line.
    const level: Point[] = []
    const highs: Point[] = []
    const strokes: [number, number, number][] = []
    const stages: readonly BreathStage[] = ['in', 'hold', 'out', 'rest']
    let from = 0
    for (const stage of stages) {
      const length = parts[stage]
      const startX = xOfSeconds(from, parts, box)
      const endX = xOfSeconds(from + length, parts, box)
      from += length
      if (!(length > 0)) continue
      // A point every two pixels, and every pixel where a part is only a few wide.
      const across = Math.ceil(endX - startX)
      const steps = Math.max(1, Math.min(6, across), Math.ceil(across / 2))
      for (let n = 0; n <= steps; n++) {
        const t = n / steps
        const b = breathIn(stage, t, ease)
        const x = startX + (endX - startX) * t
        level.push([x, yOfLevel(breathLevel(b, depth, mix), box)])
        highs.push([x, yOfLevel(breathHighs(b, depth, colour, mix, frame.sampleRate), box)])
      }
      // The air: a stroke every few pixels over a part that moves, as tall as the root of its level there.
      if (air > 0 && mix > 0 && (stage === 'in' || stage === 'out')) {
        const count = Math.floor((endX - startX) / AIR_STEP)
        for (let n = 1; n <= count; n++) {
          const t = n / (count + 1)
          const x = startX + (endX - startX) * t
          const b = breathIn(stage, t, ease)
          const y = yOfLevel(breathLevel(b, depth, mix), box)
          const tall = breathAirSize(air, mix, stage, t, breathGain(b, depth))
          strokes.push([x, y, tall * BREATH_AIR_SHARE * box.h])
        }
      }
    }
    fillTo(ctx, level, foot, colours.ink, INK.fill)
    fillTo(ctx, highs, foot, colours.ink, INK.fill)
    const nowX = box.x + now * box.w
    if (metered) {
      // The breath so far, filled the stronger the louder the sound is.
      const filled = FILLED_LEAST + (FILLED_MOST - FILLED_LEAST) * state.sound
      clipped(ctx, { x: box.x, y: box.y, w: nowX - box.x, h: box.h }, () => {
        fillTo(ctx, level, foot, colours.accent, filled)
      })
    }
    // The air stands across the line, half over it and half under; at the top of the scale it is cut at the edge.
    clipped(ctx, { x: box.x, y: 2, w: box.w, h: foot - 2 }, () => {
      for (const [x, y, tall] of strokes) {
        if (tall < 0.5) continue
        rule(ctx, x, y - tall / 2, x, y + tall / 2, { colour: colours.ink, alpha: INK.back })
      }
    })
    trace(ctx, highs, { colour: colours.ink, width: 1, alpha: INK.back })
    trace(ctx, level, { colour: colours.ink, width: 1.5 })

    // What is in hand, in figures; else how long this breath is. Depth's is the floor as it is
    // heard, with what Mix lets in of the untouched sound: the level the line stands at over Rest.
    const heardFloor = breathLevel(0, depth, mix)
    const figures =
      frame.hot === 'full'
        ? `in ${secondsText(parts.in)}  hold ${secondsText(parts.hold)}`
        : frame.hot === 'turn'
          ? `hold ${secondsText(parts.hold)}  out ${secondsText(parts.out)}`
          : frame.hot === 'empty'
            ? `out ${secondsText(parts.out)}  rest ${secondsText(parts.rest)}`
            : frame.hot === 'depth'
              ? heardFloor > 1e-4
                ? dbText(gainToDb(heardFloor))
                : 'silence'
              : secondsText(parts.total * pace)
    // They stand where they hide the least: along the top or along the foot, at the right, at the
    // left or between. A point's ring under them counts the most, then how much of the level is,
    // then how much of it runs close by, then how much of the highs is.
    ctx.font = `8px ${frame.fontFamily}`
    const wide = Math.ceil(ctx.measureText(figures).width) + 4
    const right = box.x + box.w - 1
    const left = box.x + RING_ROOM + 3 + wide
    const middle = box.x + (box.w + wide) / 2
    const high = box.y + 9
    const low = foot - 3
    const places: readonly (readonly [number, number])[] = [
      [right, high],
      [left, high],
      [middle, high],
      [middle, low],
      [right, low],
      [left, low],
    ]
    const hidden = ([end, base]: readonly [number, number]): number => {
      const patch = { x: end - wide + 2, y: base - FIGURES_RISE, w: wide, h: FIGURES_TALL }
      const near = { x: patch.x - 2, y: patch.y - 2, w: patch.w + 4, h: patch.h + 4 }
      const ring = points.some((point) => apart(point.x, point.y, patch) < RING_ROOM + 1)
      return (
        (ring ? 1e6 : 0) +
        1e3 * within(level, patch) +
        30 * within(level, near) +
        within(highs, patch)
      )
    }
    const place = places.reduce((best, one) => (hidden(one) < hidden(best) ? one : best))

    if (metered) {
      rule(ctx, nowX, box.y, nowX, foot, { colour: colours.ink, alpha: INK.rule })
    }
    // Over the mark's line, so that the figures are read whole as it goes by.
    label(frame, figures, place[0], place[1], 'right')
    if (metered) {
      const b = breathAt(now, parts, ease)
      dot(ctx, nowX, yOfLevel(breathLevel(b, depth, mix), box), 3, colours.accent, {
        ring: colours.ink,
      })
    }
    for (const point of points) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: breathHandles,
})

export const BREATH_FACES: Readonly<Record<string, PlateFace>> = {
  breath: {
    display: breath,
    face: ['in', 'out', 'depth', 'colour'],
  },
}
