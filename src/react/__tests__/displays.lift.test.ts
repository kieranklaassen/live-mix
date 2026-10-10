// The truth of Lift's display: its curve against numbers worked out from the
// device's own formula, each point that can be dragged against the parameter
// it sets, and the mark and the bars against the readings they are drawn from.

import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../core/params'
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

/** `Lift::kLetGoDb`: so far under the floor the lift is gone again. */
const LET_GO_DB = 12

/** `Lift::curve`, written out again here: the lift in dB for a level in dB. */
function curve(level: number, threshold: number, amount: number, floor: number, limit: number) {
  if (level >= threshold) return 0
  const foot = floor < threshold ? floor : threshold
  let lift = amount * (threshold - (level > foot ? level : foot))
  if (lift > limit) lift = limit
  if (level < foot) lift *= 1 - (foot - level) / LET_GO_DB
  return lift > 0 ? lift : 0
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
// from x = 4 and 92 high from y = 4, spanning −96 dB to 0 dB both ways; the
// bars stand in the last 30 pixels, 80 high from y = 16, and span 30 dB.
const LEFT = 4
const TOP = 4
const HIGH = 92
const WIDE = 86
const SPAN = 96
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

  it('is the device’s: untouched over the threshold, carried up under it, let go under the floor', () => {
    const out = curveOf(draw({ values: plain }))
    for (const level of [-90, -84, -72, -54, -36, -30, -12, -3]) {
      const lift = curve(level, -24, 0.5, -66, 30)
      expect(out(level), `at ${level} dB`).toBeCloseTo(level + lift, 1)
    }
    // Worked by hand: half of the 12 dB up to the threshold; half of 42 dB at
    // the floor's own level; 6 dB under the floor half of that is let go.
    expect(out(-36)).toBeCloseTo(-30, 1)
    expect(out(-72)).toBeCloseTo(-72 + 10.5, 1)
    expect(out(-12)).toBeCloseTo(-12, 5)
    expect(out(-84)).toBeCloseTo(-84, 5)
  })

  it('never lifts by more than Limit', () => {
    const out = curveOf(draw({ values: { ...plain, limit: 9 } }))
    expect(out(-36)).toBeCloseTo(-30, 1)
    for (const level of [-44, -50, -60]) expect(out(level)).toBeCloseTo(level + 9, 1)
    const none = curveOf(draw({ values: { ...plain, limit: 0 } }))
    for (const level of [-80, -60, -40, -20]) expect(none(level)).toBeCloseTo(level, 5)
  })

  it('has no lift where the floor is not under the threshold', () => {
    const out = curveOf(draw({ values: { ...plain, threshold: -50, floor: -40 } }))
    for (const level of [-80, -60, -52, -45, -20]) expect(out(level)).toBeCloseTo(level, 5)
  })

  it('shows what Mix lets be heard: less of the lift part way, the level going in at nothing', () => {
    const half = curveOf(draw({ values: { ...plain, mix: 0.5 } }))
    // 6 dB of lift is a gain of 1.995; half of what it adds is a gain of 1.498, 3.51 dB.
    expect(half(-36)).toBeCloseTo(-36 + 3.51, 1)
    expect(half(-36)).toBeCloseTo(-36 + leaves(6, 0.5), 1)
    const dry = curveOf(draw({ values: { ...plain, mix: 0 } }))
    for (const level of [-84, -66, -36, -12]) expect(dry(level)).toBeCloseTo(level, 5)
  })

  it('on Lift only draws what was added alone: nothing over the threshold, an island under it', () => {
    const out = curveOf(draw({ values: { ...plain, hear: 1 } }))
    // 18 dB of lift adds 6.94 times the sound: 16.8 dB over it. 6 dB adds as much as the sound itself.
    expect(out(-60)).toBeCloseTo(-60 + leaves(18, 1, true), 1)
    expect(out(-60)).toBeCloseTo(-60 + 16.83, 1)
    expect(out(-36)).toBeCloseTo(-36, 0)
    // Where there is no lift nothing comes out: the curve runs along the foot.
    for (const level of [-20, -6, -90]) expect(out(level)).toBeCloseTo(-SPAN, 5)
    // Part way down, the sound comes back under it.
    const part = curveOf(draw({ values: { ...plain, hear: 1, mix: 0.6 } }))
    expect(part(-12)).toBeCloseTo(-12 + db(0.4), 1)
    expect(part(-60)).toBeCloseTo(-60 + leaves(18, 0.6, true), 1)
  })

  it('draws under it the part lifted least, where Focus or Sides part them', () => {
    expect(lineOf(draw({ values: plain }), 1)).toBeNull()
    for (const focus of [0.5, -0.5]) {
      const back = lineOf(draw({ values: { ...plain, focus } }), 1)
      // The far side of Focus takes half the lift: 9 of the 18 dB at −60 dB.
      expect(back?.(-60)).toBeCloseTo(-60 + 18 * Math.min(weight(0, focus), weight(2, focus)), 1)
      expect(back?.(-60)).toBeCloseTo(-51, 1)
    }
    const quarter = lineOf(draw({ values: { ...plain, sides: 0.75 } }), 1)
    expect(quarter?.(-60)).toBeCloseTo(-60 + 4.5, 1)
    // With Sides fully up the middle of the image is not lifted at all.
    const sides = lineOf(draw({ values: { ...plain, sides: 1 } }), 1)
    for (const level of [-72, -60, -36]) expect(sides?.(level)).toBeCloseTo(level, 5)
    // The curve itself is the part lifted most, which neither moves.
    const out = curveOf(draw({ values: { ...plain, focus: 1, sides: 1 } }))
    expect(out(-60)).toBeCloseTo(-42, 1)
  })
})

describe("the points of Lift's display", () => {
  const plain = { threshold: -24, amount: 0.5, floor: -66, limit: 30, hear: 0, mix: 1 }

  it('stand on the picture: the threshold on the diagonal, Amount and Floor on the curve', () => {
    const threshold = handleOf('threshold', plain)
    expect(threshold.x).toBeCloseTo(xOfLevel(-24), 5)
    expect(threshold.y).toBeCloseTo(yOfLevel(-24), 5)
    // A Limit's width under the threshold, where no Amount is held down: half of 30 dB is on.
    const amount = handleOf('amount', plain)
    expect(amount.x).toBeCloseTo(xOfLevel(-54), 5)
    expect(amount.y).toBeCloseTo(yOfLevel(-54 + 15), 5)
    // Never nearer the floor's point than 8 dB, where the two would lie on each other.
    expect(handleOf('amount', { ...plain, floor: -50 }).x).toBeCloseTo(xOfLevel(-42), 5)
    // With less Limit than half the way to the floor it stands half way: half of 21 dB.
    const half = handleOf('amount', { ...plain, limit: 18 })
    expect(half.x).toBeCloseTo(xOfLevel(-45), 5)
    expect(half.y).toBeCloseTo(yOfLevel(-45 + 10.5), 5)
    const floor = handleOf('floor', plain)
    expect(floor.x).toBeCloseTo(xOfLevel(-66), 5)
    expect(floor.y).toBeCloseTo(yOfLevel(-66 + 21), 5)
    // The curve that is drawn passes through both.
    const out = curveOf(draw({ values: plain }))
    expect(levelOfY(amount.y)).toBeCloseTo(out(-54), 1)
    // As the device starts, the hand has 20 pixels between no lift and all of it.
    const start = handleOf('amount')
    const level = (params.floor.default + params.threshold.default) / 2
    expect(start.x).toBeCloseTo(xOfLevel(level), 5)
    expect(yOfLevel(level) - yOfLevel(params.threshold.default)).toBeGreaterThanOrEqual(20)
    expect(start.drag(start.x, yOfLevel(level)).amount).toBeCloseTo(0, 6)
    expect(start.drag(start.x, yOfLevel(params.threshold.default)).amount).toBeCloseTo(1, 6)
  })

  it('set the threshold along the diagonal', () => {
    const point = handleOf('threshold', plain)
    expect(point.drag(point.x, point.y).threshold).toBeCloseTo(-24, 9)
    expect(point.drag(xOfLevel(-40), yOfLevel(-40)).threshold).toBeCloseTo(-40, 9)
    // Across alone or up alone is half the way.
    expect(point.drag(xOfLevel(-40), yOfLevel(-24)).threshold).toBeCloseTo(-32, 9)
    expect(point.drag(200, -50).threshold).toBe(-12)
    expect(point.drag(-50, 200).threshold).toBe(-60)
    expect(point.reset?.().threshold).toBe(params.threshold.default)
  })

  it('set the floor across', () => {
    const point = handleOf('floor', plain)
    expect(point.drag(point.x, point.y).floor).toBeCloseTo(-66, 9)
    expect(point.drag(xOfLevel(-50), 0).floor).toBeCloseTo(-50, 9)
    expect(point.drag(xOfLevel(-50), 100).floor).toBeCloseTo(-50, 9)
    expect(point.drag(-50, 50).floor).toBe(-90)
    expect(point.drag(200, 50).floor).toBe(-40)
    expect(point.reset?.().floor).toBe(params.floor.default)
  })

  it('set the Amount whose curve is under the hand, behind Mix and on Lift only too', () => {
    for (const more of [{}, { mix: 0.5 }, { hear: 1 }, { hear: 1, mix: 0.7 }, { limit: 14 }]) {
      const values = { ...plain, ...more }
      const point = handleOf('amount', values)
      const level = 'limit' in more ? -45 : -54
      expect(point.x).toBeCloseTo(xOfLevel(level), 5)
      expect(point.drag(point.x, point.y).amount).toBeCloseTo(0.5, 9)
      for (const to of [-43, -38, -33]) {
        const { amount } = point.drag(point.x, yOfLevel(to), {})
        const out = curveOf(draw({ values: { ...values, amount } }))
        expect(out(level), `to ${to} dB with ${JSON.stringify(more)}`).toBeCloseTo(to, 1)
      }
    }
    const point = handleOf('amount', { ...plain, limit: 18 })
    // 15 of the 21 dB between the point's level and the threshold.
    expect(point.drag(point.x, yOfLevel(-30)).amount).toBeCloseTo(15 / 21, 6)
    expect(point.drag(point.x, yOfLevel(-45)).amount).toBe(0)
    expect(point.drag(point.x, yOfLevel(-60)).amount).toBe(0)
    expect(point.drag(point.x, yOfLevel(-24)).amount).toBe(1)
    expect(point.drag(point.x, -50).amount).toBe(1)
    expect(point.reset?.().amount).toBe(params.amount.default)
  })

  it('waits on the Limit where it holds the curve down, and moves from where Amount lies', () => {
    const values = { ...plain, limit: 6 }
    const point = handleOf('amount', values)
    // 10.5 dB asked for, 6 allowed: the point stands on the 6.
    expect(point.y).toBeCloseTo(yOfLevel(-39), 5)
    const hold: DisplayHold = {}
    expect(point.drag(point.x, point.y, hold).amount).toBeCloseTo(0.5, 9)
    // Three dB down with the same hand takes 3 dB off what was asked for, and
    // the same again brings the curve itself down.
    expect(point.drag(point.x, yOfLevel(-42), hold).amount).toBeCloseTo(7.5 / 21, 6)
    expect(point.drag(point.x, yOfLevel(-45), hold).amount).toBeCloseTo(4.5 / 21, 6)
    expect(point.drag(point.x, point.y, hold).amount).toBeCloseTo(0.5, 6)
  })

  it('leaves Amount to the knob where it has no travel', () => {
    const silent = handleOf('amount', { ...plain, mix: 0 })
    expect(silent.drag(silent.x, 10).amount).toBe(0.5)
    expect(silent.drag(silent.x, 90).amount).toBe(0.5)
    const shut = handleOf('amount', { ...plain, threshold: -50, floor: -40 })
    expect(shut.drag(shut.x, 10).amount).toBe(0.5)
    // It still stands clear of the threshold's point.
    expect(shut.x).toBeCloseTo(xOfLevel(-58), 5)
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
    // Half of the 42 dB between the floor and the threshold is the most there is: 21 dB.
    for (const focus of [0, 1, -1, 0.5]) {
      const tops = marks({ ...plain, focus })
      expect(tops.length).toBe(3)
      for (const part of [0, 1, 2])
        expect(Math.abs(tops[part] - barTop(21 * weight(part, focus)))).toBeLessThanOrEqual(0.5)
    }
    // Limit holds them all down, and Mix brings them down with the bars.
    for (const top of marks({ ...plain, limit: 9 }))
      expect(Math.abs(top - barTop(9))).toBeLessThanOrEqual(0.5)
    for (const top of marks({ ...plain, mix: 0.5 }))
      expect(Math.abs(top - barTop(adds(21, 0.5)))).toBeLessThanOrEqual(0.5)
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
