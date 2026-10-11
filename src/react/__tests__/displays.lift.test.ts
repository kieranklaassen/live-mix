// The truth of Lift's display: its curve against numbers worked out from the
// device's own formula, each point that can be dragged against the parameter
// it sets, and the mark and the bars against the readings they are drawn from.

import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../core/params'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import { PLATE_FACES } from '../components/displays'
import {
  type DisplayHandle,
  type DisplayHold,
  type DisplaySignal,
} from '../components/plate-display'
import {
  drawDisplay,
  runDisplay,
  stockDescriptors,
  testLevel,
  testSignal,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const descriptor = stockDescriptors().get('lift')
if (!descriptor) throw new Error('no stock device lift')
const { display } = PLATE_FACES.lift
const params: Readonly<Record<string, ParamSpec>> = descriptor.params
const { ink: INK_COLOUR, accent: ACCENT } = PLAIN_COLOURS

const draw = (options: FrameOptions = {}): RecordingContext => drawDisplay(display, params, options)
function handleOf(key: string, values: Record<string, number> = {}): DisplayHandle {
  const found = display.handles?.(viewOf(display, params, { values })).find((h) => h.key === key)
  if (!found) throw new Error(`lift has no handle ${key}`)
  return found
}

// --- The device's own numbers, from cpp/devices/lift/lift.h -------------------

/** `Lift::kKneeDb`: the lift comes in over so many dB above the floor; at the floor there is none. */
const KNEE_DB = 6

/**
 * `Lift::curve`, written out again here: the lift in dB for a steady level in
 * dB. `Lift::reach` (Amount of the way to the threshold, at most Limit) times
 * `Lift::open` (the share the floor lets through, a smooth step over its knee).
 */
function curve(level: number, threshold: number, amount: number, floor: number, limit: number) {
  if (level >= threshold) return 0
  let reach = amount * (threshold - level)
  if (reach > limit) reach = limit
  if (reach < 0) reach = 0
  const x = (level - floor) / KNEE_DB
  const open = x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x)
  return reach * open
}

/** `Lift::weight`: the share of the lift a part takes (0 lows, 1 middle, 2 highs). */
function weight(part: number, focus: number): number {
  if (part === 0) return focus > 0 ? 1 - focus : 1
  if (part === 2) return focus < 0 ? 1 + focus : 1
  return 1 - 0.5 * Math.abs(focus)
}

const gain = (db: number): number => Math.pow(10, db / 20)
const db = (linear: number): number => 20 * Math.log10(linear)
/**
 * `Lift::process`: out = dry + mix · ((whole − 1) · dry + added), where `whole`
 * is 1 on All and 0 on Lift only and `added` is (gain − 1) · dry.
 */
const leaves = (liftDb: number, mix = 1, alone = false): number =>
  db(1 + mix * ((alone ? -1 : 0) + gain(liftDb) - 1))
/** What the added sound alone comes to as a lift on the sound. */
const adds = (liftDb: number, mix = 1): number => db(1 + mix * (gain(liftDb) - 1))

// --- The picture's own scales -------------------------------------------------

// A window beside two columns of knobs is 128 by 100: the curve is 86 wide
// from x = 4 and 92 high from y = 4, spanning −78 dB to 0 dB both ways; the
// bars stand in the last 30 pixels, 80 high from y = 16, and span 30 dB.
const LEFT = 4
const TOP = 4
const HIGH = 92
const WIDE = 86
const SPAN = 78
const yOfLevel = (level: number): number => TOP + (-level / SPAN) * HIGH
const levelOfY = (y: number): number => (-(y - TOP) / HIGH) * SPAN
const xOfLevel = (level: number, wide = WIDE): number => LEFT + ((level + SPAN) / SPAN) * wide
const BARS = { x: 94, y: 16, w: 30, h: 80 }
const barTop = (liftDb: number): number => BARS.y + BARS.h - (liftDb / 30) * BARS.h

interface Shape {
  points: [number, number][]
  op: 'stroke' | 'fill'
  colour: string
  alpha: number
  width: number
}
interface Disc {
  x: number
  y: number
  radius: number
  colour: string
}
interface Rect {
  x: number
  y: number
  w: number
  h: number
  colour: string
  alpha: number
}

/** What was drawn: lines and areas with the ink they were laid in, filled discs, and filled rectangles. */
function drawn(context: RecordingContext): { shapes: Shape[]; discs: Disc[]; rects: Rect[] } {
  const shapes: Shape[] = []
  const discs: Disc[] = []
  const rects: Rect[] = []
  let points: [number, number][] = []
  let disc: Omit<Disc, 'colour'> | null = null
  const now = { fillStyle: '', strokeStyle: '', globalAlpha: 1, lineWidth: 1 }
  for (const { name, args } of context.calls) {
    if (name === 'beginPath') {
      points = []
      disc = null
    } else if (name === 'moveTo' || name === 'lineTo') {
      points.push([args[0] as number, args[1] as number])
    } else if (name === 'arc') {
      disc = { x: args[0] as number, y: args[1] as number, radius: args[2] as number }
    } else if (name === 'set fillStyle') now.fillStyle = String(args[0])
    else if (name === 'set strokeStyle') now.strokeStyle = String(args[0])
    else if (name === 'set globalAlpha') now.globalAlpha = args[0] as number
    else if (name === 'set lineWidth') now.lineWidth = args[0] as number
    else if (name === 'fillRect') {
      const [x, y, w, h] = args as number[]
      rects.push({ x, y, w, h, colour: now.fillStyle, alpha: now.globalAlpha })
    } else if (name === 'fill' || name === 'stroke') {
      if (disc && name === 'fill') discs.push({ ...disc, colour: now.fillStyle })
      else if (points.length > 0) {
        shapes.push({
          points: [...points],
          op: name,
          colour: name === 'fill' ? now.fillStyle : now.strokeStyle,
          alpha: now.globalAlpha,
          width: now.lineWidth,
        })
      }
    }
  }
  return { shapes, discs, rects }
}

/** A line of the curve's box, one point a pixel, as the level that comes out for a level going in. */
function lineOf(
  context: RecordingContext,
  width: number,
  wide = WIDE,
): ((inDb: number) => number) | null {
  const line = drawn(context).shapes.find(
    (shape) => shape.op === 'stroke' && shape.width === width && shape.points.length === wide + 1,
  )
  if (!line) return null
  return (inDb) => {
    const at = xOfLevel(inDb, wide) - LEFT
    const [below, above] = [Math.floor(at), Math.min(wide, Math.floor(at) + 1)]
    const y = line.points[below][1] + (line.points[above][1] - line.points[below][1]) * (at - below)
    return levelOfY(y)
  }
}
/** The curve of the part lifted most: the heavy line. */
function curveOf(context: RecordingContext, wide = WIDE): (inDb: number) => number {
  const line = lineOf(context, 1.5, wide)
  if (!line) throw new Error('no curve was drawn')
  return line
}

/**
 * The three bars' live parts, low to high: the pale part the sides get alone,
 * and the full part under it. A part with no height is not drawn at all, and
 * comes back here as a rectangle of none at the bar's foot.
 */
function barsOf(context: RecordingContext): { pale: Rect; full: Rect }[] {
  const { rects } = drawn(context)
  const tracks = rects.filter(
    (rect) => rect.colour === INK_COLOUR && rect.y === BARS.y && rect.h === BARS.h,
  )
  expect(tracks.length).toBe(3)
  return tracks.map((track) => {
    const none = { ...track, y: BARS.y + BARS.h, h: 0, colour: ACCENT }
    const lit = rects.filter((rect) => rect.colour === ACCENT && rect.x === track.x)
    for (const rect of lit) expect(rect.w).toBe(track.w)
    const full = lit.find((rect) => rect.alpha === 0.9) ?? { ...none, alpha: 0.9 }
    const pale = lit.find((rect) => rect.alpha === 0.4) ?? { ...none, y: full.y, alpha: 0.4 }
    return { pale, full }
  })
}

/** Sound at the device of those two peak levels; with no level going in, the plate was not told what feeds it. */
const sound = (input: number | null, output: number): DisplaySignal => ({
  ...testSignal(),
  input: input === null ? null : testLevel(input),
  output: testLevel(output),
})

/** Readings as the device reports them, and sound at the device so the display runs. */
const live = (
  level: number,
  low: number,
  mid: number,
  high: number,
  signal: DisplaySignal = sound(null, 0.25),
): FrameOptions => ({
  meters: { lift: Math.max(low, mid, high), liftLow: low, liftMid: mid, liftHigh: high, level },
  signal,
})

describe("the curve of Lift's display", () => {
  const plain = { threshold: -24, amount: 0.5, floor: -66, limit: 30, hear: 0, mix: 1 }

  it('is the device’s: untouched over the threshold, carried up under it, nothing at the floor or under it', () => {
    const out = curveOf(draw({ values: plain }))
    for (const level of [-77, -75, -72, -68, -58, -54, -36, -30, -12, -3]) {
      const lift = curve(level, -24, 0.5, -66, 30)
      expect(out(level), `at ${level} dB`).toBeCloseTo(level + lift, 1)
    }
    // Worked by hand: half of the 12 dB up to the threshold; half of 34 dB
    // 8 dB over the floor, clear of its knee.
    expect(out(-36)).toBeCloseTo(-30, 1)
    expect(out(-58)).toBeCloseTo(-58 + 17, 1)
    expect(out(-12)).toBeCloseTo(-12, 5)
    // At the floor and everywhere under it there is no lift at all.
    for (const level of [-66.5, -68, -72, -78]) expect(out(level)).toBeCloseTo(level, 5)
  })

  it('brings the lift in over the 6 dB above the floor', () => {
    // The curve is read back a pixel at a time and the knee is steep, so the
    // floor lies on a pixel here (the thirteenth of the 86, −66.2 dB) and the
    // levels are the pixels over it.
    const floor = -SPAN + (13 * SPAN) / WIDE
    const out = curveOf(draw({ values: { ...plain, floor } }))
    for (let pixel = 13; pixel <= 21; pixel += 1) {
      const level = -SPAN + (pixel * SPAN) / WIDE
      expect(out(level), `pixel ${pixel}`).toBeCloseTo(level + curve(level, -24, 0.5, floor, 30), 5)
    }
    // Half way up the knee half of the lift is on: half of half of the 39.2 dB up to the threshold.
    expect(curve(floor + 3, -24, 0.5, floor, 30)).toBeCloseTo((0.5 * (-24 - floor - 3)) / 2, 9)
    // A sixth of the way up, 2 parts in 27; five sixths, 25 in 27.
    expect(curve(floor + 1, -24, 0.5, floor, 30)).toBeCloseTo((0.5 * (-24 - floor - 1) * 2) / 27, 9)
    expect(curve(floor + 5, -24, 0.5, floor, 30)).toBeCloseTo(
      (0.5 * (-24 - floor - 5) * 25) / 27,
      9,
    )
  })

  it('never lifts by more than Limit', () => {
    const out = curveOf(draw({ values: { ...plain, limit: 9 } }))
    expect(out(-36)).toBeCloseTo(-30, 1)
    for (const level of [-44, -50, -58]) expect(out(level)).toBeCloseTo(level + 9, 1)
    const none = curveOf(draw({ values: { ...plain, limit: 0 } }))
    for (const level of [-76, -60, -40, -20]) expect(none(level)).toBeCloseTo(level, 5)
  })

  it('has no lift where the floor is not under the threshold', () => {
    const out = curveOf(draw({ values: { ...plain, threshold: -50, floor: -40 } }))
    for (const level of [-76, -60, -52, -45, -20]) expect(out(level)).toBeCloseTo(level, 5)
  })

  it('shows what Mix lets be heard: less of the lift part way, the level going in at nothing', () => {
    const half = curveOf(draw({ values: { ...plain, mix: 0.5 } }))
    // 6 dB of lift is a gain of 1.995; half of what it adds is a gain of 1.498, 3.51 dB.
    expect(half(-36)).toBeCloseTo(-36 + 3.51, 1)
    expect(half(-36)).toBeCloseTo(-36 + leaves(6, 0.5), 1)
    const dry = curveOf(draw({ values: { ...plain, mix: 0 } }))
    for (const level of [-76, -66, -60, -36, -12]) expect(dry(level)).toBeCloseTo(level, 5)
  })

  it('on Lift only draws what was added alone: nothing over the threshold, an island under it', () => {
    const out = curveOf(draw({ values: { ...plain, hear: 1 } }))
    // 17 dB of lift adds 6.08 times the sound: 15.7 dB over it. 6 dB adds as much as the sound itself.
    expect(out(-58)).toBeCloseTo(-58 + leaves(17, 1, true), 1)
    expect(out(-58)).toBeCloseTo(-58 + 15.68, 1)
    expect(out(-36)).toBeCloseTo(-36, 0)
    // Where there is no lift nothing comes out: the curve runs along the foot.
    for (const level of [-20, -6, -78]) expect(out(level)).toBeCloseTo(-SPAN, 5)
    // Part way down, the sound comes back under it.
    const part = curveOf(draw({ values: { ...plain, hear: 1, mix: 0.6 } }))
    expect(part(-12)).toBeCloseTo(-12 + db(0.4), 1)
    expect(part(-58)).toBeCloseTo(-58 + leaves(17, 0.6, true), 1)
  })

  it('draws under it the part lifted least, where Focus or Sides part them', () => {
    expect(lineOf(draw({ values: plain }), 1)).toBeNull()
    for (const focus of [0.5, -0.5]) {
      const back = lineOf(draw({ values: { ...plain, focus } }), 1)
      // The far side of Focus takes half the lift: 7.5 of the 15 dB at −54 dB.
      expect(back?.(-54)).toBeCloseTo(-54 + 15 * Math.min(weight(0, focus), weight(2, focus)), 1)
      expect(back?.(-54)).toBeCloseTo(-46.5, 1)
    }
    const quarter = lineOf(draw({ values: { ...plain, sides: 0.75 } }), 1)
    expect(quarter?.(-54)).toBeCloseTo(-54 + 3.75, 1)
    // With Sides fully up the middle of the image is not lifted at all.
    const sides = lineOf(draw({ values: { ...plain, sides: 1 } }), 1)
    for (const level of [-72, -60, -50, -36]) expect(sides?.(level)).toBeCloseTo(level, 5)
    // The curve itself is the part lifted most, which neither moves.
    const out = curveOf(draw({ values: { ...plain, focus: 1, sides: 1 } }))
    expect(out(-54)).toBeCloseTo(-39, 1)
  })
})

describe("the points of Lift's display", () => {
  // The Amount point stands at the top of the floor's knee, 6 dB over the
  // floor: the corner of the curve. The curve is read back a pixel at a time,
  // so here that level lies on a pixel: the twentieth of the 86, −59.9 dB,
  // 35.9 dB under the threshold, and the floor 6 dB under it.
  const AT = -SPAN + (20 * SPAN) / WIDE
  const FLOOR = AT - KNEE_DB
  const ROOM = -24 - AT
  const plain = { threshold: -24, amount: 0.5, floor: FLOOR, limit: 30, hear: 0, mix: 1 }

  it('stand on the picture: the threshold on the diagonal, Amount at the corner of the curve, Floor at its foot', () => {
    const threshold = handleOf('threshold', plain)
    expect(threshold.x).toBeCloseTo(xOfLevel(-24), 5)
    expect(threshold.y).toBeCloseTo(yOfLevel(-24), 5)
    // Amount stands at the top of the knee, where the lift is greatest: half of 35.9 dB is on.
    const amount = handleOf('amount', plain)
    expect(amount.x).toBeCloseTo(xOfLevel(AT), 5)
    expect(amount.y).toBeCloseTo(yOfLevel(AT + ROOM / 2), 5)
    // With the floor under the picture's foot it stays on the picture, 10 dB over the foot.
    expect(handleOf('amount', { ...plain, floor: -90 }).x).toBeCloseTo(xOfLevel(-68), 5)
    // Never nearer the threshold's point than 8 dB, where the two would lie on each other.
    expect(handleOf('amount', { ...plain, threshold: -44, floor: -40 }).x).toBeCloseTo(
      xOfLevel(-52),
      5,
    )
    // Where Limit holds the curve down the point stands on the Limit.
    const held = handleOf('amount', { ...plain, limit: 12 })
    expect(held.x).toBeCloseTo(xOfLevel(AT), 5)
    expect(held.y).toBeCloseTo(yOfLevel(AT + 12), 5)
    // The floor's point is on the scale of levels going in, at the picture's foot.
    const floor = handleOf('floor', plain)
    expect(floor.x).toBeCloseTo(xOfLevel(FLOOR), 5)
    expect(floor.y).toBeCloseTo(TOP + HIGH, 5)
    // The curve that is drawn passes through the Amount point.
    const out = curveOf(draw({ values: plain }))
    expect(levelOfY(amount.y)).toBeCloseTo(out(AT), 1)
    // As the device starts, the hand has the whole way from the diagonal to
    // the threshold's line: 26 dB, 30 pixels.
    const start = handleOf('amount', { limit: 30 })
    const level = params.floor.default + KNEE_DB
    expect(start.x).toBeCloseTo(xOfLevel(level), 5)
    expect(yOfLevel(level) - yOfLevel(params.threshold.default)).toBeGreaterThanOrEqual(30)
    expect(start.drag(start.x, yOfLevel(level)).amount).toBeCloseTo(0, 6)
    expect(start.drag(start.x, yOfLevel(params.threshold.default)).amount).toBeCloseTo(1, 6)
    // And the same travel with the Limit as it starts, which holds the point lower.
    const limited = handleOf('amount')
    const hold: DisplayHold = {}
    expect(limited.drag(limited.x, limited.y, hold).amount).toBeCloseTo(params.amount.default, 9)
    const none = limited.drag(limited.x, limited.y + 40, hold).amount
    const all = limited.drag(limited.x, limited.y - 40, hold).amount
    expect(none).toBe(0)
    expect(all).toBe(1)
  })

  it('set the threshold along the diagonal', () => {
    const point = handleOf('threshold', plain)
    expect(point.drag(point.x, point.y).threshold).toBeCloseTo(-24, 9)
    expect(point.drag(xOfLevel(-40), yOfLevel(-40)).threshold).toBeCloseTo(-40, 9)
    // Across alone or up alone is half the way.
    expect(point.drag(xOfLevel(-40), yOfLevel(-24)).threshold).toBeCloseTo(-32, 9)
    expect(point.drag(200, -50).threshold).toBe(-12)
    expect(point.drag(-50, 200).threshold).toBe(params.threshold.min)
    expect(point.reset?.().threshold).toBe(params.threshold.default)
  })

  it('set the floor across', () => {
    const point = handleOf('floor', plain)
    expect(point.drag(point.x, point.y).floor).toBeCloseTo(FLOOR, 9)
    expect(point.drag(xOfLevel(-50), 0).floor).toBeCloseTo(-50, 9)
    expect(point.drag(xOfLevel(-50), 100).floor).toBeCloseTo(-50, 9)
    expect(point.drag(-50, 50).floor).toBe(-90)
    expect(point.drag(200, 50).floor).toBe(-40)
    expect(point.reset?.().floor).toBe(params.floor.default)
    // A floor under the picture's foot stands at its edge, and moves from
    // where it lies: 6 dB to the right is 6 dB up, not a jump to the edge's level.
    const under = handleOf('floor', { ...plain, floor: -90 })
    expect(under.x).toBeCloseTo(LEFT, 5)
    const hold: DisplayHold = {}
    expect(under.drag(under.x, under.y, hold).floor).toBeCloseTo(-90, 9)
    expect(under.drag(under.x + (6 / SPAN) * WIDE, under.y, hold).floor).toBeCloseTo(-84, 9)
    expect(under.drag(under.x + (30 / SPAN) * WIDE, under.y, hold).floor).toBeCloseTo(-60, 9)
  })

  it('set the Amount whose curve is under the hand, behind Mix and on Lift only too', () => {
    // Another knee whose top is on a pixel, the thirty-first: −49.9 dB.
    const higher = -SPAN + (31 * SPAN) / WIDE
    for (const more of [
      {},
      { mix: 0.5 },
      { hear: 1 },
      { hear: 1, mix: 0.7 },
      { floor: higher - KNEE_DB },
    ]) {
      const values = { ...plain, ...more }
      const point = handleOf('amount', values)
      const level = 'floor' in more ? higher : AT
      expect(point.x).toBeCloseTo(xOfLevel(level), 5)
      expect(point.drag(point.x, point.y).amount).toBeCloseTo(0.5, 9)
      // Heights every one of these can reach: half of a 30 dB lift is 24 dB.
      for (const over of [8, 14, 20]) {
        const to = level + over
        const { amount } = point.drag(point.x, yOfLevel(to), {})
        const out = curveOf(draw({ values: { ...values, amount } }))
        expect(out(level), `to ${to} dB with ${JSON.stringify(more)}`).toBeCloseTo(to, 1)
      }
    }
    const point = handleOf('amount', plain)
    // All but 6 of the 35.9 dB between the point's level and the threshold.
    expect(point.drag(point.x, yOfLevel(-30)).amount).toBeCloseTo((ROOM - 6) / ROOM, 6)
    expect(point.drag(point.x, yOfLevel(AT)).amount).toBe(0)
    expect(point.drag(point.x, yOfLevel(-75)).amount).toBe(0)
    expect(point.drag(point.x, yOfLevel(-24)).amount).toBe(1)
    expect(point.drag(point.x, -50).amount).toBe(1)
    expect(point.reset?.().amount).toBe(params.amount.default)
  })

  it('waits on the Limit where it holds the curve down, and moves from where Amount lies', () => {
    const values = { ...plain, limit: 6 }
    const point = handleOf('amount', values)
    // 17.9 dB asked for, 6 allowed: the point stands on the 6.
    expect(point.y).toBeCloseTo(yOfLevel(AT + 6), 5)
    const hold: DisplayHold = {}
    expect(point.drag(point.x, point.y, hold).amount).toBeCloseTo(0.5, 9)
    // Three dB down with the same hand takes 3 dB off what was asked for, and
    // the same again brings the curve itself down.
    expect(point.drag(point.x, yOfLevel(AT + 3), hold).amount).toBeCloseTo((ROOM / 2 - 3) / ROOM, 6)
    expect(point.drag(point.x, yOfLevel(AT), hold).amount).toBeCloseTo((ROOM / 2 - 6) / ROOM, 6)
    expect(point.drag(point.x, point.y, hold).amount).toBeCloseTo(0.5, 6)
  })

  it('leaves Amount to the knob where it has no travel', () => {
    const silent = handleOf('amount', { ...plain, mix: 0 })
    expect(silent.drag(silent.x, 10).amount).toBe(0.5)
    expect(silent.drag(silent.x, 90).amount).toBe(0.5)
    const shut = handleOf('amount', { ...plain, threshold: -48, floor: -40 })
    expect(shut.drag(shut.x, 10).amount).toBe(0.5)
    // It still stands clear of the threshold's point.
    expect(shut.x).toBeCloseTo(xOfLevel(-56), 5)
  })
})

describe("what moves on Lift's display", () => {
  const plain = { threshold: -24, amount: 0.5, floor: -66, limit: 30, hear: 0, mix: 1, split: 1 }
  const mark = (context: RecordingContext): Disc | undefined =>
    drawn(context).discs.find((disc) => disc.colour === ACCENT && disc.radius === 2.5)

  it('puts the mark at the level the device reads, as far over it as the sound comes out', () => {
    // Twice as much comes out as goes in: 6.02 dB over the level the device reads.
    const now = mark(draw({ values: plain, ...live(-40, 6, 6, 6, sound(0.1, 0.2)) }))
    expect(now?.x).toBeCloseTo(xOfLevel(-40), 5)
    expect(now?.y).toBeCloseTo(yOfLevel(-40 + db(2)), 5)
    // It is the sound that is measured: the parts may be lifted more than the whole comes to.
    const apart = mark(draw({ values: plain, ...live(-40, 0, 3, 18, sound(0.1, 0.11)) }))
    expect(apart?.y).toBeCloseTo(yOfLevel(-40 + db(1.1)), 5)
    // On Lift only what was added alone can come out under what went in.
    const alone = mark(
      draw({ values: { ...plain, hear: 1 }, ...live(-40, 3, 3, 3, sound(0.1, 0.041)) }),
    )
    expect(alone?.y).toBeCloseTo(yOfLevel(-40 + db(0.41)), 5)
    // With Mix at nothing the device is still read: the mark rides the diagonal.
    const dry = mark(draw({ values: { ...plain, mix: 0 }, ...live(-40, 6, 6, 6, sound(0.1, 0.1)) }))
    expect(dry?.x).toBeCloseTo(xOfLevel(-40), 5)
    expect(dry?.y).toBeCloseTo(yOfLevel(-40), 5)
    // Not running, there is no sound to mark.
    expect(mark(draw({ values: plain }))).toBeUndefined()
  })

  it('puts the mark where the device reads the sound coming out, the sides counted', () => {
    // The middle of the image came out as it went in (the plate's two levels
    // are one sum of both sides); the sides were lifted, and the device reads 9 dB more.
    const meters = { lift: 12, liftLow: 12, liftMid: 12, liftHigh: 12, level: -40, out: -31 }
    const now = mark(draw({ values: { ...plain, sides: 1 }, meters, signal: sound(0.1, 0.1) }))
    expect(now?.x).toBeCloseTo(xOfLevel(-40), 5)
    expect(now?.y).toBeCloseTo(yOfLevel(-31), 5)
    // Nothing coming out yet: it falls back on what the plate measures.
    const early = mark(
      draw({ values: plain, meters: { ...meters, out: -120 }, signal: sound(0.1, 0.2) }),
    )
    expect(early?.y).toBeCloseTo(yOfLevel(-40 + db(2)), 5)
  })

  it('works the mark out from the lift the device reports where it is not told what feeds it', () => {
    const now = mark(draw({ values: plain, ...live(-40, 6, 6, 6) }))
    expect(now?.x).toBeCloseTo(xOfLevel(-40), 5)
    expect(now?.y).toBeCloseTo(yOfLevel(-34), 5)
    const half = mark(draw({ values: { ...plain, mix: 0.5 }, ...live(-40, 6, 6, 6) }))
    expect(half?.y).toBeCloseTo(yOfLevel(-40 + leaves(6, 0.5)), 5)
    const alone = mark(draw({ values: { ...plain, hear: 1 }, ...live(-40, 12, 12, 12) }))
    expect(alone?.y).toBeCloseTo(yOfLevel(-40 + leaves(12, 1, true)), 5)
    const dry = mark(draw({ values: { ...plain, mix: 0 }, ...live(-40, 6, 6, 6) }))
    expect(dry?.y).toBeCloseTo(yOfLevel(-40), 5)
    // Silence going in says nothing of what was done to it either.
    const silent = mark(draw({ values: plain, ...live(-40, 6, 6, 6, sound(0, 0)) }))
    expect(silent?.y).toBeCloseTo(yOfLevel(-34), 5)
  })

  it('stands each bar as high as the lift of its part, and writes the most of them', () => {
    const context = draw({ values: plain, ...live(-40, 6, 12, 18) })
    const bars = barsOf(context)
    for (const [part, lift] of [6, 12, 18].entries()) {
      expect(bars[part].full.x).toBeCloseTo(BARS.x + part * 11, 5)
      expect(bars[part].full.w).toBeCloseTo(8, 5)
      expect(bars[part].full.y).toBeCloseTo(barTop(lift), 5)
      expect(bars[part].full.y + bars[part].full.h).toBeCloseTo(BARS.y + BARS.h, 5)
      expect(bars[part].pale.h).toBeCloseTo(0, 5)
    }
    expect(context.words()).toEqual(['+18.0'])
  })

  it('shows in the bars what Mix lets be heard, and nothing at nothing', () => {
    const half = draw({ values: { ...plain, mix: 0.5 }, ...live(-40, 6, 12, 18) })
    expect(barsOf(half)[2].full.y).toBeCloseTo(barTop(adds(18, 0.5)), 5)
    expect(half.words()).toEqual([`+${adds(18, 0.5).toFixed(1)}`])
    const dry = draw({ values: { ...plain, mix: 0 }, ...live(-40, 6, 12, 18) })
    for (const bar of barsOf(dry)) expect(bar.full.h + bar.pale.h).toBeCloseTo(0, 5)
    expect(dry.words()).toEqual(['0.0'])
    // On Lift only the same sound is added, so the bars say the same.
    const alone = draw({ values: { ...plain, hear: 1 }, ...live(-40, 6, 12, 18) })
    expect(barsOf(alone)[1].full.y).toBeCloseTo(barTop(12), 5)
    // Not running, nothing is lifted.
    for (const bar of barsOf(draw({ values: plain }))) expect(bar.full.h).toBeCloseTo(0, 5)
  })

  it('draws paler what only the sides get', () => {
    const bars = barsOf(draw({ values: { ...plain, sides: 0.5 }, ...live(-40, 6, 12, 18) }))
    expect(bars[1].pale.y).toBeCloseTo(barTop(12), 5)
    expect(bars[1].pale.h).toBeCloseTo(barTop(6) - barTop(12), 5)
    expect(bars[1].full.y).toBeCloseTo(barTop(6), 5)
    expect(bars[1].pale.alpha).toBeLessThan(bars[1].full.alpha)
    const all = barsOf(draw({ values: { ...plain, sides: 1 }, ...live(-40, 6, 12, 18) }))
    expect(all[2].full.h).toBeCloseTo(0, 5)
    expect(all[2].pale.y).toBeCloseTo(barTop(18), 5)
  })

  it('gives the sides no more over the middle than the room the device reports', () => {
    const meters = { lift: 18, liftLow: 6, liftMid: 12, liftHigh: 18, level: -40 }
    const signal = sound(null, 0.25)
    // Sides fully up: the middle gets none of it, the sides 12 dB where there
    // is room for that, and 4 dB where the device says that is all the room.
    const free = barsOf(
      draw({ values: { ...plain, sides: 1 }, meters: { ...meters, room: 60 }, signal }),
    )
    expect(free[1].pale.y).toBeCloseTo(barTop(12), 5)
    const held = barsOf(
      draw({ values: { ...plain, sides: 1 }, meters: { ...meters, room: 4 }, signal }),
    )
    expect(held[1].pale.y).toBeCloseTo(barTop(4), 5)
    expect(held[1].full.h).toBeCloseTo(0, 5)
    expect(held[2].pale.y).toBeCloseTo(barTop(4), 5)
    // Half way: the middle gets 6 of the 12 dB, the sides 4 dB more.
    const half = barsOf(
      draw({ values: { ...plain, sides: 0.5 }, meters: { ...meters, room: 4 }, signal }),
    )
    expect(half[1].full.y).toBeCloseTo(barTop(6), 5)
    expect(half[1].pale.y).toBeCloseTo(barTop(10), 5)
    // The lows' 6 dB leaves the sides 3 dB over the middle, less than the room: all of it.
    expect(half[0].pale.y).toBeCloseTo(barTop(6), 5)
    // No room at all (a sound on one side): the sides get what the middle gets.
    const none = barsOf(
      draw({ values: { ...plain, sides: 0.5 }, meters: { ...meters, room: 0 }, signal }),
    )
    expect(none[1].pale.h).toBeCloseTo(0, 5)
    expect(none[1].full.y).toBeCloseTo(barTop(6), 5)
  })

  it('stands the bars as one block with Split at nothing and apart as it rises', () => {
    const as = (split: number): Rect[] =>
      barsOf(draw({ values: { ...plain, split }, ...live(-40, 6, 6, 6) })).map((bar) => bar.full)
    expect(as(0).map((bar) => [bar.x, bar.w])).toEqual([
      [94, 10],
      [104, 10],
      [114, 10],
    ])
    expect(as(0.5).map((bar) => [bar.x, bar.w])).toEqual([
      [94, 9],
      [104.5, 9],
      [115, 9],
    ])
  })

  it('marks on each bar the most its part can be lifted as Focus has it', () => {
    const marks = (values: Record<string, number>): number[] =>
      drawn(draw({ values }))
        .shapes.filter(
          (shape) =>
            shape.op === 'stroke' &&
            shape.colour === INK_COLOUR &&
            shape.alpha === 0.8 &&
            shape.points.length === 2 &&
            shape.points[0][0] >= BARS.x,
        )
        .map((shape) => shape.points[0][1])
    // Half of the 36 dB between the top of the floor's knee and the threshold
    // is the most there is: 18 dB.
    for (const focus of [0, 1, -1, 0.5]) {
      const tops = marks({ ...plain, focus })
      expect(tops.length).toBe(3)
      for (const part of [0, 1, 2])
        expect(Math.abs(tops[part] - barTop(18 * weight(part, focus)))).toBeLessThanOrEqual(0.5)
    }
    // Where the threshold lies close over the floor the most is inside the
    // knee, not at its top: with the threshold 9 dB over the floor the top of
    // the knee gets 1.5 dB and a level 1.25 dB under it 1.89 dB. The mark
    // stands on the most the curve gives anywhere.
    const close = { ...plain, threshold: -44, floor: -53 }
    expect(curve(-47, -44, 0.5, -53, 30)).toBeCloseTo(1.5, 9)
    expect(curve(-48.25, -44, 0.5, -53, 30)).toBeCloseTo(1.887, 2)
    let most = 0
    for (let level = -53; level <= -44; level += 0.01)
      most = Math.max(most, curve(level, -44, 0.5, -53, 30))
    expect(most).toBeGreaterThan(1.85)
    // (A mark lies on a half pixel, as the others here do: nearer the most than the knee's top.)
    for (const top of marks(close)) {
      expect(Math.abs(top - barTop(most))).toBeLessThanOrEqual(0.5)
      expect(Math.abs(top - barTop(most))).toBeLessThan(Math.abs(top - barTop(1.5)))
    }
    // Limit holds them all down, and Mix brings them down with the bars.
    for (const top of marks({ ...plain, limit: 9 }))
      expect(Math.abs(top - barTop(9))).toBeLessThanOrEqual(0.5)
    for (const top of marks({ ...plain, mix: 0.5 }))
      expect(Math.abs(top - barTop(adds(18, 0.5)))).toBeLessThanOrEqual(0.5)
  })

  it('keeps the last seconds where it is wide enough: upright, 204 wide', () => {
    const upright = { width: 204, height: 100 }
    // Four times as much comes out as goes in: 12.04 dB on top of the level the device reads.
    const options = { values: plain, ...live(-40, 12, 12, 12, sound(0.05, 0.2)) }
    const context = runDisplay(display, params, 1, { ...options, ...upright })
    // The curve is as wide as it is high there, and still the device's.
    expect(curveOf(context, 92)(-36)).toBeCloseTo(-30, 1)
    const { shapes } = drawn(context)
    const added = shapes.find((shape) => shape.op === 'fill' && shape.colour === ACCENT)
    const right = Math.max(...(added?.points.map(([x]) => x) ?? []))
    const now = added?.points.filter(([x]) => x === right).map(([, y]) => y) ?? []
    expect(right).toBeCloseTo(164, 5)
    expect(Math.min(...now)).toBeCloseTo(yOfLevel(-40 + db(4)), 3)
    expect(Math.max(...now)).toBeCloseTo(yOfLevel(-40), 3)
    // The line over it is the level that comes out.
    const out = shapes.find((shape) => shape.op === 'stroke' && shape.width === 1.25)
    expect(out?.points.at(-1)?.[1]).toBeCloseTo(yOfLevel(-40 + db(4)), 3)
    // On Lift only less can come out than went in: nothing is put on top, and the line lies under.
    const under = drawn(
      runDisplay(display, params, 1, {
        values: { ...plain, hear: 1 },
        ...upright,
        ...live(-40, 3, 3, 3, sound(0.1, 0.041)),
      }),
    ).shapes
    const none = under.find((shape) => shape.op === 'fill' && shape.colour === ACCENT)
    const edge = none?.points.filter(([x]) => x === right).map(([, y]) => y) ?? []
    expect(Math.max(...edge) - Math.min(...edge)).toBeCloseTo(0, 5)
    expect(
      under.find((shape) => shape.op === 'stroke' && shape.width === 1.25)?.points.at(-1)?.[1],
    ).toBeCloseTo(yOfLevel(-40 + db(0.41)), 3)
    // Flat there is no room for them.
    const flat = drawn(runDisplay(display, params, 1, options)).shapes
    expect(flat.some((shape) => shape.op === 'fill' && shape.colour === ACCENT)).toBe(false)
  })
})

// --- The compiled device ------------------------------------------------------

/**
 * A steady tone through src/dsp/wasm/lift.wasm as set, with short times so it
 * settles: what goes in and comes out over the last quarter second (the mean
 * power of both sides and the sum of the two, as the plate measures it), and
 * the device's own readings.
 */
async function settled(values: Record<string, number>, levelDb: number, right = 1) {
  const wasm = await loadWasmDevice('lift')
  for (const [key, value] of Object.entries({ rise: 0.05, hold: 0.01, ...values })) {
    wasm.set(params[key], value)
  }
  // The level is the mean power of the two sides.
  const peak = (Math.SQRT2 * gain(levelDb)) / Math.sqrt((1 + right * right) / 2)
  const block = 128
  // Four seconds: near the floor's knee the lift comes in at 8 dB a second.
  const blocks = Math.round((4 * wasm.sampleRate) / block)
  const from = blocks - Math.round((0.25 * wasm.sampleRate) / block)
  const left = new Float32Array(block)
  const other = new Float32Array(block)
  const sums = { in: 0, out: 0, inMono: 0, outMono: 0 }
  for (let at = 0; at < blocks; at += 1) {
    for (let i = 0; i < block; i += 1) {
      left[i] = peak * Math.sin((2 * Math.PI * 1000 * (at * block + i)) / wasm.sampleRate)
      other[i] = right * left[i]
    }
    wasm.processBlock(left, other)
    if (at < from) continue
    const outLeft = wasm.view(wasm.device.device_out_left(), block)
    const outRight = wasm.view(wasm.device.device_out_right(), block)
    for (let i = 0; i < block; i += 1) {
      sums.in += (left[i] * left[i] + other[i] * other[i]) / 2
      sums.out += (outLeft[i] * outLeft[i] + outRight[i] * outRight[i]) / 2
      sums.inMono += ((left[i] + other[i]) / 2) ** 2
      sums.outMono += ((outLeft[i] + outRight[i]) / 2) ** 2
    }
  }
  const meter = (index: number): number => wasm.device.device_meter?.(index) ?? Number.NaN
  return {
    out: sums.out > 0 ? 10 * Math.log10(sums.out / sums.in) + levelDb : -Infinity,
    inMono: Math.sqrt(sums.inMono / ((blocks - from) * block)),
    outMono: Math.sqrt(sums.outMono / ((blocks - from) * block)),
    meters: {
      lift: meter(0),
      liftLow: meter(1),
      liftMid: meter(2),
      liftHigh: meter(3),
      level: meter(4),
      out: meter(5),
      room: meter(6),
    },
  }
}

describe("Lift's display against the compiled device", () => {
  // A floor on a pixel of the curve, as above; Split at nothing, so one gain.
  const floor = -SPAN + (13 * SPAN) / WIDE
  const plain = { threshold: -24, amount: 0.5, floor, limit: 30, hear: 0, mix: 1, split: 0 }

  it('draws the curve the device plays: tones at six levels through seven settings', async () => {
    const settings: Record<string, number>[] = [
      {},
      { limit: 9 },
      { mix: 0.5 },
      { hear: 1 },
      { hear: 1, mix: 0.7 },
      { amount: 1, threshold: -40, floor: -SPAN + (20 * SPAN) / WIDE },
      { amount: 0.8, threshold: -12, limit: 18 },
    ]
    let worst = 0
    for (const more of settings) {
      const values = { ...plain, ...more }
      const picture = curveOf(draw({ values }))
      for (const level of [-72, -61, -50, -38, -29, -18]) {
        const played = Math.max((await settled(values, level)).out, -SPAN)
        const shown = picture(level)
        worst = Math.max(worst, Math.abs(played - shown))
        expect(
          Math.abs(played - shown),
          `${JSON.stringify(more)} at ${level} dB: the device ${played.toFixed(2)} dB, the picture ${shown.toFixed(2)} dB`,
        ).toBeLessThan(0.4)
      }
    }
    expect(worst).toBeGreaterThan(0)
  }, 120000)

  it('puts the mark where the device plays, with Sides up on a sound to one side', async () => {
    // Left twice the right: most of it is in the middle, which Sides at 1 leaves alone.
    const values = { ...plain, sides: 1 }
    const run = await settled(values, -45, 0.5)
    const mark = drawn(
      draw({ values, meters: run.meters, signal: sound(run.inMono, run.outMono) }),
    ).discs.find((disc) => disc.colour === ACCENT && disc.radius === 2.5)
    expect(run.meters.lift).toBeCloseTo(10.5, 0)
    // Left twice the right: the middle is 9.5 dB over the sides, and the sides
    // may rise to 1.5 dB under it: 8 dB of room, which the pale bar stops at.
    expect(run.meters.room).toBeCloseTo(8.04, 1)
    const bars = barsOf(
      draw({ values, meters: run.meters, signal: sound(run.inMono, run.outMono) }),
    )
    expect(Math.abs(bars[1].pale.y - barTop(run.meters.room))).toBeLessThan(0.5)
    expect(bars[1].full.h).toBeCloseTo(0, 5)
    expect(levelOfY(mark?.y ?? 0)).toBeGreaterThan(run.out - 0.3)
    expect(levelOfY(mark?.y ?? 0)).toBeLessThan(run.out + 0.3)
    expect(mark?.x).toBeGreaterThan(xOfLevel(-45.3))
    expect(mark?.x).toBeLessThan(xOfLevel(-44.7))
    // The plate's own two levels are sums of both sides and cannot see it: by
    // them the sound came out as it went in, and it came out louder.
    expect(db(run.outMono / run.inMono)).toBeCloseTo(0, 1)
    expect(run.out - -45).toBeGreaterThan(1)
  }, 60000)
})

describe("the face of Lift's plate", () => {
  it('stands Threshold over Amount, not beside it, so the two long names do not run together', () => {
    // Flat, the face fills two columns row by row, 48 apart; a name is drawn 5.6 a letter.
    const face = PLATE_FACES.lift.face ?? []
    expect(face).toEqual(['threshold', 'rise', 'amount', 'split'])
    const between = (a: string, b: string): number => 48 - ((a.length + b.length) * 5.6) / 2
    for (const row of [face.slice(0, 2), face.slice(2, 4)])
      expect(between(row[0], row[1])).toBeGreaterThan(10)
    // Side by side they stood a letter apart.
    expect(between('threshold', 'amount')).toBeLessThan(6.5)
  })
})
