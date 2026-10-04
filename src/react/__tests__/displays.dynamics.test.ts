// The truth of the dynamics displays: each curve against numbers worked out
// from the device's own formula, what hangs from the top against the gain it
// stands for, and each handle against the parameter it sets.

import { describe, expect, it } from 'vitest'

import { DuckerKernel } from '../../core/devices/native/DuckerKernel'
import { type ParamSpec } from '../../core/params'
import { PLAIN_COLOURS } from '../components/display-kit'
import { PLATE_FACES } from '../components/displays'
import { duck, nodeCurve, nodeMakeupDb, swellShape } from '../components/displays/dynamics'
import { type DisplayHandle, type DisplaySignal } from '../components/plate-display'
import {
  drawDisplay,
  patchUnder,
  runDisplay,
  stockDescriptors,
  testLevel,
  testSignal,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const { ink: INK_COLOUR, accent: ACCENT } = PLAIN_COLOURS

function plate(id: string) {
  const descriptor = stock.get(id)
  if (!descriptor) throw new Error(`no stock device ${id}`)
  const { display } = PLATE_FACES[id]
  const params: Readonly<Record<string, ParamSpec>> = descriptor.params
  return {
    display,
    params,
    draw: (options: FrameOptions = {}) => drawDisplay(display, params, options),
    run: (
      seconds: number,
      options: FrameOptions = {},
      each?: (time: number) => Partial<FrameOptions>,
    ) => runDisplay(display, params, seconds, options, each),
    handle: (key: string, values: Record<string, number> = {}): DisplayHandle => {
      const found = display
        .handles?.(viewOf(display, params, { values }))
        .find((h) => h.key === key)
      if (!found) throw new Error(`${id} has no handle ${key}`)
      return found
    },
  }
}

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

/** What was drawn, as lines and areas with the ink they were laid in, and the filled discs. */
function drawn(context: RecordingContext): { shapes: Shape[]; discs: Disc[] } {
  const shapes: Shape[] = []
  const discs: Disc[] = []
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
    else if (name === 'fill' || name === 'stroke') {
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
  return { shapes, discs }
}

/** The points of a shape that was looked for: a test that finds none fails here. */
function pointsOf(shape: Shape | undefined): [number, number][] {
  if (!shape) throw new Error('the shape looked for was not drawn')
  return shape.points
}
/** The lowest place a shape reaches on the display (the largest y), and the highest. */
const lowest = (shape: Shape | undefined): number => Math.max(...pointsOf(shape).map(([, y]) => y))
const highest = (shape: Shape | undefined): number => Math.min(...pointsOf(shape).map(([, y]) => y))
/** How tall a shape is at its right edge, where now is. */
function tallNow(shape: Shape | undefined): { top: number; foot: number } {
  const points = pointsOf(shape)
  const right = Math.max(...points.map(([x]) => x))
  const now = points.filter(([x]) => x === right).map(([, y]) => y)
  return { top: Math.min(...now), foot: Math.max(...now) }
}

// A window beside two columns of knobs is 128 by 100: the curve is 48 wide
// from x = 4, the past 68 wide from x = 56, both 92 high from y = 4. Beside
// one column (176 wide) the curve is 67 wide and the past starts at 75.
const TOP = 4
const HIGH = 92
/** Where a level stands on the scale the family shares, 0 dB at the top and −60 dB at the foot. */
const yOfLevel = (db: number): number => TOP + (-db / 60) * HIGH
const levelOfY = (y: number): number => (-(y - TOP) / HIGH) * 60
/** Across a curve `wide` pixels wide from x = 4: −60 dB at the left, 0 dB at the right. */
const xOfLevel = (db: number, wide: number): number => 4 + ((db + 60) / 60) * wide
const db = (gain: number): number => 20 * Math.log10(gain)
const gain = (decibels: number): number => Math.pow(10, decibels / 20)

/** A sound of those two peak levels (sines, so the RMS is 3 dB under each). */
const sound = (input: number | null, output: number): DisplaySignal => ({
  ...testSignal(),
  input: input === null ? null : testLevel(input),
  output: testLevel(output),
})

/** The curve of a compressor's display: the line as wide as the curve's box, one point a pixel. */
function curveOf(context: RecordingContext, wide: number): (inDb: number) => number {
  const line = drawn(context).shapes.find(
    (shape) => shape.op === 'stroke' && shape.width === 1.5 && shape.points.length === wide + 1,
  )
  if (!line) throw new Error('no curve was drawn')
  return (inDb) => {
    const at = xOfLevel(inDb, wide) - 4
    const [below, above] = [Math.floor(at), Math.min(wide, Math.floor(at) + 1)]
    const y = line.points[below][1] + (line.points[above][1] - line.points[below][1]) * (at - below)
    return levelOfY(y)
  }
}

describe('the Ambient Compressor display', () => {
  const comp = plate('ambient-comp')

  it('draws the soft knee of the device: 6 dB over a 4:1 threshold comes out 1.5 dB over', () => {
    const out = curveOf(comp.draw({ values: { threshold: -24, ratio: 4, knee: 0 } }), 48)
    expect(out(-40)).toBeCloseTo(-40, 1)
    expect(out(-18)).toBeCloseTo(-22.5, 1)
    expect(out(-6)).toBeCloseTo(-19.5, 1)
    // In the middle of a 12 dB knee half of a quarter of the knee's slope is off: 0.75 · 6² / 24.
    const soft = curveOf(comp.draw({ values: { threshold: -24, ratio: 4, knee: 12 } }), 48)
    expect(soft(-24)).toBeCloseTo(-24 - 1.125, 1)
  })

  it('shows what the reduction comes to behind Mix: less with the dry sound beside it, none at nothing', () => {
    const taken = (mix: number): { tall: number; words: string[] } => {
      const context = comp.run(1, {
        values: { mix, makeup: 0 },
        meters: { reduction: -12 },
        signal: sound(0.5, 0.5),
      })
      const band = drawn(context).shapes.find(
        (shape) => shape.op === 'fill' && shape.colour === ACCENT,
      )
      const { top, foot } = tallNow(band)
      return { tall: foot - top, words: context.words() }
    }
    expect(taken(1).tall).toBeCloseTo((12 / 60) * HIGH, 3)
    expect(taken(1).words).toContain('−12.0')
    // Half dry: 1 − 0.5 + 0.5 · 10^(−12 / 20) of the sound is left, 4.07 dB off.
    const half = -db(0.5 + 0.5 * gain(-12))
    expect(taken(0.5).tall).toBeCloseTo((half / 60) * HIGH, 3)
    expect(taken(0.5).words).toContain('−4.1')
    // All dry: the compressor works, and none of it is heard.
    expect(taken(0).tall).toBeCloseTo(0, 6)
    expect(taken(0).words).toContain('0.0')
  })

  it('draws the level coming out as a line: under the level going in by what was taken off, over it by the make-up', () => {
    const lineNow = (makeup: number): number => {
      const context = comp.run(1, {
        values: { makeup },
        meters: { reduction: -6 },
        signal: sound(0.5, 0.5),
      })
      const line = drawn(context).shapes.find(
        (shape) => shape.op === 'stroke' && shape.width === 1.25 && shape.colour === INK_COLOUR,
      )
      return tallNow(line).top
    }
    // The detector reads RMS: a sine at half scale is 9.03 dB under full scale.
    const going = db(0.5) - db(Math.SQRT2)
    expect(lineNow(0)).toBeCloseTo(yOfLevel(going - 6), 3)
    expect(lineNow(9)).toBeCloseTo(yOfLevel(going - 6 + 9), 3)
  })

  it('lets its last seconds go when it is switched off: nothing is taken off a sound it does not touch', () => {
    const state = comp.display.init?.()
    const heard = comp.run(1, { state, meters: { reduction: -12 }, signal: sound(0.5, 0.25) })
    const band = (context: RecordingContext): Shape | undefined =>
      drawn(context).shapes.find((shape) => shape.op === 'fill' && shape.colour === ACCENT)
    expect(lowest(band(heard)) - highest(band(heard))).toBeGreaterThan(10)
    const off = comp.draw({ state, powered: false, meters: { reduction: -12 } })
    expect(lowest(band(off)) - highest(band(off))).toBe(0)
    expect(off.words()).toEqual(['0.0'])
  })

  it('has points that do not move when they are taken with the curve over the top of the display', () => {
    const settings: Record<string, number>[] = [
      { threshold: -24, ratio: 2, makeup: 12 },
      { threshold: -24, ratio: 2, makeup: 18 },
      { threshold: -12, ratio: 2, makeup: 24 },
      { threshold: -6, ratio: 6, makeup: 24, mix: 0.6 },
    ]
    for (const values of settings) {
      const threshold = comp.handle('threshold', values)
      const ratio = comp.handle('ratio', values)
      expect(threshold.y).toBeGreaterThanOrEqual(TOP)
      expect(threshold.drag(threshold.x, threshold.y).threshold).toBeCloseTo(values.threshold, 6)
      expect(ratio.y).toBeGreaterThanOrEqual(TOP)
      expect(ratio.drag(ratio.x, ratio.y).ratio).toBeCloseTo(values.ratio, 6)
      // And from there they still go where the hand goes: down is a firmer hand.
      expect(ratio.drag(ratio.x, ratio.y + 10).ratio).toBeGreaterThan(values.ratio)
    }
  })
})

describe('the Compressor display', () => {
  const comp = plate('compressor')

  it('ports the curve of the compressor node: straight to the threshold, a knee, then the ratio', () => {
    const hard = nodeCurve(-24, 0, 4)
    expect(db(hard(gain(-40)))).toBeCloseTo(-40, 6)
    expect(db(hard(gain(-24)))).toBeCloseTo(-24, 6)
    expect(db(hard(gain(-18)))).toBeCloseTo(-22.5, 6)
    expect(db(hard(1))).toBeCloseTo(-18, 6)
    // The node's own make-up: what the curve takes off full scale (18 dB), to the power 0.6.
    expect(nodeMakeupDb(hard)).toBeCloseTo(10.8, 6)

    // A knee of 30 dB over a threshold of −24 dB ends at +6 dB: it joins the
    // straight part at the threshold and the ratio's slope at its end, and never turns back.
    const soft = nodeCurve(-24, 30, 12)
    expect(db(soft(gain(-24.001)))).toBeCloseTo(-24.001, 3)
    expect(db(soft(gain(-23.999)))).toBeCloseTo(-23.999, 2)
    const slope = (at: number): number =>
      (db(soft(gain(at + 0.05))) - db(soft(gain(at - 0.05)))) / 0.1
    expect(slope(5.9)).toBeCloseTo(1 / 12, 1)
    expect(slope(12)).toBeCloseTo(1 / 12, 3)
    for (let level = -60; level < 12; level += 0.5) {
      expect(soft(gain(level + 0.5))).toBeGreaterThan(soft(gain(level)))
      expect(db(soft(gain(level)))).toBeLessThanOrEqual(level + 1e-6)
    }
  })

  it('agrees with the node itself', () => {
    // Read off a DynamicsCompressorNode on a steady 1 kHz sine in a browser:
    // threshold, knee, ratio, the level in, the level out and the `reduction` it reported.
    const measured = [
      [-24, 30, 12, -50, -46.34, 0],
      [-24, 30, 12, -12, -9.43, -1.1],
      [-24, 30, 12, 0, -2.34, -6.02],
      [-24, 0, 4, -18, -11.62, -4.43],
      [-24, 0, 4, 0, -6.97, -17.8],
      [-20, 6, 4, -12, -8.16, -4.02],
      [-6, 0, 20, 0, -2.16, -5.6],
    ]
    for (const [threshold, knee, ratio, level, out, reduction] of measured) {
      const curve = nodeCurve(threshold, knee, ratio)
      const taken = db(curve(gain(level))) - level
      // The node's gain wobbles a little with the wave; the curve is where it settles.
      expect(Math.abs(taken - reduction), `reduction at ${level} dB`).toBeLessThan(0.3)
      expect(
        Math.abs(level + taken + nodeMakeupDb(curve) - out),
        `out at ${level} dB`,
      ).toBeLessThan(0.3)
    }
  })

  it('agrees with the node at the ends of its knobs too', () => {
    // A second reading of a DynamicsCompressorNode in a browser (an offline
    // context, a 1 kHz sine, the peak of what leaves once it has settled).
    const measured = [
      [-24, 30, 12, -30, -26.34, 0],
      [-24, 30, 12, -6, -5.2, -2.87],
      [-24, 0, 4, -6, -8.49, -13.32],
      [-40, 10, 8, -10, -13.54, -22.39],
      [-12, 40, 2, 0, -0.09, -0.24],
      [-18, 12, 2, -3, -3.77, -4.29],
      [-60, 0, 20, -20, -23.49, -37.72],
      [-100, 40, 20, -40, -29.63, -31.56],
    ]
    for (const [threshold, knee, ratio, level, out, reduction] of measured) {
      const curve = nodeCurve(threshold, knee, ratio)
      const taken = db(curve(gain(level))) - level
      expect(Math.abs(taken - reduction), `reduction at ${level} dB`).toBeLessThan(0.35)
      expect(
        Math.abs(level + taken + nodeMakeupDb(curve) - out),
        `out at ${level} dB`,
      ).toBeLessThan(0.35)
    }
  })

  it('draws that curve with both make-ups on it', () => {
    const values = { threshold: -24, knee: 0, ratio: 4, makeupDb: 3 }
    const out = curveOf(comp.draw({ values }), 48)
    expect(out(-40)).toBeCloseTo(-40 + 10.8 + 3, 1)
    expect(out(-20)).toBeCloseTo(-23 + 10.8 + 3, 1)
  })

  it('puts the mark where the node says the sound is: its reduction, not the curve’s', () => {
    const values = { threshold: -24, knee: 0, ratio: 4, makeupDb: 0 }
    const context = comp.run(0.5, { values, meters: { reduction: -2 }, signal: sound(0.25, 0.3) })
    const mark = drawn(context).discs.find((disc) => disc.radius === 2.5)
    expect(mark?.colour).toBe(ACCENT)
    // The detector reads peaks: −12 dB going in.
    expect(mark?.x).toBeCloseTo(xOfLevel(db(0.25), 48), 3)
    expect(mark?.y).toBeCloseTo(yOfLevel(db(0.25) - 2 + 10.8), 3)
    expect(context.words()).toContain('−2.0')
  })

  it('shows what was taken off between the level going in and the level it was held at', () => {
    const context = comp.run(1, { meters: { reduction: -9 }, signal: sound(0.5, 0.3) })
    const band = drawn(context).shapes.find(
      (shape) => shape.op === 'fill' && shape.colour === ACCENT,
    )
    expect(tallNow(band).top).toBeCloseTo(yOfLevel(db(0.5)), 3)
    expect(tallNow(band).foot).toBeCloseTo(yOfLevel(db(0.5) - 9), 3)
  })

  it('draws the level coming out with the make-up on it: louder than what went in when little is taken off', () => {
    const values = { threshold: -24, knee: 0, ratio: 4, makeupDb: 3 }
    const context = comp.run(1, { values, meters: { reduction: -2 }, signal: sound(0.5, 0.5) })
    const { shapes } = drawn(context)
    const line = shapes.find(
      (shape) => shape.op === 'stroke' && shape.width === 1.25 && shape.colour === INK_COLOUR,
    )
    // 2 dB off, 10.8 dB of the node's own make-up and 3 dB of the knob's.
    expect(tallNow(line).top).toBeCloseTo(yOfLevel(db(0.5) - 2 + 10.8 + 3), 2)
    // What was taken off still hangs from the level going in, and the figure is that.
    const band = shapes.find((shape) => shape.op === 'fill' && shape.colour === ACCENT)
    expect(tallNow(band).top).toBeCloseTo(yOfLevel(db(0.5)), 3)
    expect(tallNow(band).foot).toBeCloseTo(yOfLevel(db(0.5) - 2), 3)
    expect(context.words()).toContain('−2.0')
  })

  it('reads nothing off silence, where the node stops and its reading stays put', () => {
    const silent = comp.run(0.5, { meters: { reduction: -0.165 }, signal: sound(0, 0) })
    expect(silent.words()).toEqual(['0.0'])
    // Any sound, and the reading is the node's again.
    const heard = comp.run(0.5, { meters: { reduction: -0.165 }, signal: sound(0.01, 0.01) })
    expect(heard.words()).toEqual(['−0.2'])
  })

  it('has a threshold point at the bend of the curve, and the wheel sets the knee with it', () => {
    const threshold = comp.handle('threshold')
    expect(threshold.x).toBeCloseTo(xOfLevel(-24, 48), 6)
    // The bend stands on the curve: at the threshold, with the node's make-up on it.
    expect(threshold.y).toBeCloseTo(yOfLevel(-24 + nodeMakeupDb(nodeCurve(-24, 30, 12))), 3)
    expect(threshold.wheel?.(1)).toEqual({ knee: 32 })
    expect(threshold.wheel?.(-1)).toEqual({ knee: 28 })
    expect(comp.handle('threshold', { knee: 40 }).wheel?.(1)).toEqual({ knee: 40 })
    expect(threshold.reset?.()).toEqual({ threshold: -24, knee: 30 })
    // Taken and not moved, it stays to the last decimal.
    expect(threshold.drag(threshold.x, threshold.y).threshold).toBeCloseTo(-24, 9)
    // Dragged to where the bend of another threshold stands, it is that threshold:
    // the make-up under it moves as it goes, and the point stays in the hand.
    for (const wanted of [-50, -36, -12, -3]) {
      const there = comp.handle('threshold', { threshold: wanted })
      expect(threshold.drag(there.x, there.y).threshold).toBeCloseTo(wanted, 1)
    }
    // Along the diagonal: across alone or up alone moves it half as far.
    const across = threshold.drag(threshold.x + (10 / 60) * 48, threshold.y).threshold
    const up = threshold.drag(threshold.x, threshold.y - (10 / 60) * HIGH).threshold
    expect(across).toBeGreaterThan(-24)
    expect(across).toBeLessThan(-14)
    expect(up).toBeCloseTo(across, 6)
    // It stops at the ends of the display.
    expect(threshold.drag(200, -100).threshold).toBe(0)
    expect(threshold.drag(-100, 200).threshold).toBe(-60)
    // The node makes up for most of what a ratio takes off, so there is no
    // point for Ratio: all of the knob moves the end of the curve 2.6 dB here.
    expect(comp.display.handles?.(viewOf(comp.display, comp.params)).map((h) => h.key)).toEqual([
      'threshold',
    ])
    const endOf = (ratio: number): number => {
      const curve = nodeCurve(-24, 30, ratio)
      return db(curve(1)) + nodeMakeupDb(curve)
    }
    expect(endOf(1) - endOf(20)).toBeLessThan(3)
  })

  it('leaves a point that stands off the display where it is when it is taken', () => {
    // With all of Make-up the bend is over the top of the display: its point waits at the edge.
    const loud = comp.handle('threshold', { makeupDb: 24 })
    expect(loud.y).toBe(TOP)
    expect(loud.drag(loud.x, loud.y).threshold).toBeCloseTo(-24, 9)
    expect(loud.drag(loud.x + 4, loud.y).threshold).toBeGreaterThan(-24)
    expect(loud.drag(loud.x - 4, loud.y).threshold).toBeLessThan(-24)

    // The threshold knob goes down to −100 dB, the display to −60: taken there it stays.
    const low = comp.handle('threshold', { threshold: -80 })
    expect(low.x).toBe(4)
    expect(low.drag(low.x, low.y).threshold).toBe(-80)
    expect(low.drag(low.x - 5, low.y + 5).threshold).toBe(-80)
    // Pulled in to where the bend of −50 dB stands, it is on the display again, there.
    const there = comp.handle('threshold', { threshold: -50 })
    expect(low.drag(there.x, there.y).threshold).toBeCloseTo(-50, 1)
  })

  it('writes the reduction at the foot of the past, clear of the peaks; the reference keeps it at the top', () => {
    const place = (id: string): number => {
      const context = plate(id).run(0.2, { meters: { reduction: -3 }, signal: sound(0.9, 0.6) })
      const written = context.calls.find((call) => call.name === 'fillText')
      return written?.args[2] as number
    }
    expect(place('compressor')).toBe(TOP + HIGH - 2)
    expect(place('fet-limiter')).toBe(TOP + HIGH - 2)
    expect(place('ambient-comp')).toBe(TOP + 8)
  })
})

describe('the FET Limiter display', () => {
  const fet = plate('fet-limiter')
  /** The threshold on each side of a centred sound: −6 dB of |left| + |right|. */
  const bend = -6 - db(2)

  it('draws the fixed 4:1 curve, driven by Input gain: 6 dB over comes out 1.5 dB over', () => {
    const out = curveOf(fet.draw(), 67)
    expect(out(-30)).toBeCloseTo(-30, 1)
    expect(out(bend - 2)).toBeCloseTo(bend - 2, 1)
    expect(out(bend + 6)).toBeCloseTo(bend + 1.5, 1)
    // 10 dB of input gain brings the bend to a sound 10 dB quieter, and all of it out 10 dB louder.
    const driven = curveOf(fet.draw({ values: { inputGain: 10 } }), 67)
    expect(driven(-40)).toBeCloseTo(-30, 1)
    expect(driven(bend - 10 + 6)).toBeCloseTo(bend + 1.5, 1)
    // Output gain moves the whole curve.
    const trimmed = curveOf(fet.draw({ values: { outputGain: -6 } }), 67)
    expect(trimmed(bend + 6)).toBeCloseTo(bend + 1.5 - 6, 1)
  })

  it('rounds off what is still over half scale, and never passes full scale', () => {
    // Full scale in with 24 dB of gain: 36.04 dB over, 9.01 dB of it left, −3.03 dBFS,
    // which is 0.7055; the ceiling makes that 0.5 + 0.5 · tanh(0.411) = 0.6947.
    const out = curveOf(fet.draw({ values: { inputGain: 24 } }), 67)
    expect(out(0)).toBeCloseTo(db(0.5 + 0.5 * Math.tanh((0.7055 - 0.5) / 0.5)), 1)
    const flat = curveOf(fet.draw({ values: { inputGain: 40 } }), 67)
    for (let level = -60; level <= 0; level += 1) expect(flat(level)).toBeLessThan(0.05)
  })

  it('agrees with the device itself', () => {
    // The compiled device on a steady 1 kHz sine, the same on both sides:
    // Input gain, Output gain, the peak going in and the peak that left, in dB.
    const measured = [
      [0, 0, -30, -30],
      [0, 0, -6.04, -10.46],
      [0, 0, 0, -8.95],
      [10, 0, -16.04, -10.46],
      [24, 0, 0, -3.09],
      [40, 0, 0, -0.68],
      [12, -6, -6, -13.45],
    ]
    for (const [inputGain, outputGain, level, left] of measured) {
      const out = curveOf(fet.draw({ values: { inputGain, outputGain } }), 67)
      // The device's follower sits a little under the peaks it reads: under 0.1 dB.
      expect(Math.abs(out(level) - left), `${level} dB in at ${inputGain} dB`).toBeLessThan(0.15)
    }
  })

  it('reads the reduction off the sound: what comes out against what goes in, less the two gains', () => {
    expect(fet.run(0.5, { signal: sound(0.5, 0.25) }).words()).toContain('−6.0')
    expect(fet.run(0.5, { values: { inputGain: 6 }, signal: sound(0.5, 0.5) }).words()).toContain(
      '−6.0',
    )
    expect(
      fet.run(0.5, { values: { inputGain: 6, outputGain: 3 }, signal: sound(0.25, 0.25) }).words(),
    ).toContain('−9.0')
    // A sound that comes out as loud as the gains make it has nothing off.
    expect(
      fet.run(0.5, { values: { inputGain: 6 }, signal: sound(0.1, gain(db(0.1) + 6)) }).words(),
    ).toContain('0.0')
  })

  it('lets the reduction go home in silence as the device does: 13 dB a second', () => {
    // The device's level falls with a time constant of 0.5 s, 17.4 dB a second,
    // and 4:1 gives back three quarters of it. (Measured on the compiled
    // device: 8.9 dB of reduction was home 0.69 s after the sound stopped.)
    const after = (seconds: number): string =>
      fet
        .run(1 + seconds, {}, (time) => ({ signal: time < 1 ? sound(0.5, 0.25) : sound(0, 0) }))
        .words()[0]
    // Nine frames of silence: 6.02 − 13.03 · 0.3 = 2.11 dB still off.
    expect(after(0.3)).toBe('−2.1')
    // It is a steady rate, not a decay: half a second and it is home, and stays there.
    expect(after(0.5)).toBe('0.0')
    expect(after(2)).toBe('0.0')
  })

  it('without the level going in, reads the curve back from what comes out', () => {
    // A sound 6 dB over the bend comes out 1.5 dB over it, with 4.5 dB off.
    const context = fet.run(0.5, { signal: sound(null, gain(bend + 1.5)) })
    expect(context.words()).toContain('−4.5')
  })

  it('has a point at the bend that sets Input gain', () => {
    const drive = fet.handle('drive')
    expect(drive.x).toBeCloseTo(xOfLevel(bend, 67), 6)
    expect(drive.y).toBeCloseTo(yOfLevel(bend), 6)
    expect(drive.drag(xOfLevel(bend - 20, 67), 0).inputGain).toBeCloseTo(20, 6)
    expect(drive.drag(0, 0).inputGain).toBe(40)
    expect(drive.drag(200, 0).inputGain).toBe(0)
    expect(fet.handle('drive', { inputGain: 15 }).x).toBeCloseTo(xOfLevel(bend - 15, 67), 6)
  })
})

describe('the Ambient Limiter display', () => {
  const limiter = plate('ambient-limiter')
  /** Its own scale: 36 dB over the height, from 6 dB over full scale. */
  const yOfLimit = (level: number): number => TOP + ((6 - level) / 36) * HIGH
  const meters = { reduction: 0, ride: 0 }

  it('has the ceiling as a line to drag, on a scale that leaves room over full scale', () => {
    const ceiling = limiter.handle('ceiling')
    expect(ceiling.y).toBeCloseTo(yOfLimit(-1), 6)
    expect(limiter.handle('ceiling', { ceiling: -12 }).y).toBeCloseTo(yOfLimit(-12), 6)
    expect(ceiling.drag(0, yOfLimit(-6)).ceiling).toBeCloseTo(-6, 6)
    expect(ceiling.drag(0, 0).ceiling).toBe(0)
    expect(ceiling.drag(0, 100).ceiling).toBe(-12)
    expect(ceiling.reset?.()).toEqual({ ceiling: -1 })
  })

  it('hangs the gain taken off from the top: a dB of it as far down as a dB of level stands up', () => {
    const context = limiter.run(1, {
      meters: { reduction: -6, ride: -4 },
      signal: sound(0.5, 0.25),
    })
    const hung = drawn(context).shapes.filter(
      (shape) => shape.op === 'fill' && shape.colour === ACCENT,
    )
    // The whole of it lighter, the ride's share solid over it.
    expect(hung.map((shape) => shape.alpha)).toEqual([0.45, 0.9])
    expect(hung.map(highest)).toEqual([TOP, TOP])
    expect(lowest(hung[0]) - TOP).toBeCloseTo((6 / 36) * HIGH, 3)
    expect(lowest(hung[1]) - TOP).toBeCloseTo((4 / 36) * HIGH, 3)
    expect(lowest(hung[0]) - TOP).toBeCloseTo(yOfLimit(-10) - yOfLimit(-4), 3)
    expect(context.words()).toContain('−6.0')
  })

  it('shows the level arriving after Gain, and under it what leaves', () => {
    const context = limiter.run(1, {
      values: { gain: 9 },
      meters: { reduction: -4, ride: -4 },
      signal: sound(0.5, gain(-1)),
    })
    const { shapes } = drawn(context)
    // What leaves, as a line; over it, what arrived: −6.02 dB and 9 dB of gain.
    const leaving = shapes.find((shape) => shape.op === 'stroke' && shape.width === 1.25)
    expect(lowest(leaving)).toBeLessThanOrEqual(yOfLimit(-30))
    expect(highest(leaving)).toBeCloseTo(yOfLimit(-1), 3)
    const over = shapes.find(
      (shape) => shape.op === 'fill' && shape.colour === INK_COLOUR && shape.alpha === 0.5,
    )
    expect(highest(over)).toBeCloseTo(yOfLimit(db(0.5) + 9), 3)
  })

  it('keeps the level that leaves in sight under a reduction deep enough to reach it', () => {
    // 12 dB off hangs to −6 dB on the scale; what leaves stands at −1 dB, behind it.
    const context = limiter.run(1, {
      values: { gain: 12 },
      meters: { reduction: -12, ride: -10 },
      signal: sound(1, gain(-1)),
    })
    const { shapes } = drawn(context)
    const leaving = shapes.findIndex((shape) => shape.op === 'stroke' && shape.width === 1.25)
    const hung = shapes.flatMap((shape, index) => (shape.colour === ACCENT ? [index] : []))
    expect(hung).toHaveLength(2)
    expect(lowest(shapes[hung[0]])).toBeGreaterThan(highest(shapes[leaving]))
    expect(leaving).toBeGreaterThan(Math.max(...hung))
  })

  it('works back what arrived from what left when the level going in is unknown', () => {
    const context = limiter.run(1, {
      meters: { reduction: -5, ride: -5 },
      signal: sound(null, gain(-1)),
    })
    const over = drawn(context).shapes.find(
      (shape) => shape.op === 'fill' && shape.colour === INK_COLOUR && shape.alpha === 0.5,
    )
    expect(highest(over)).toBeCloseTo(yOfLimit(-1 + 5), 3)
  })

  it('draws a limiter that reports only the whole reduction as one stage', () => {
    const context = limiter.run(1, { meters: { reduction: -6 }, signal: sound(0.5, 0.25) })
    const hung = drawn(context).shapes.filter(
      (shape) => shape.op === 'fill' && shape.colour === ACCENT,
    )
    expect(hung.map((shape) => lowest(shape) - TOP)).toEqual([
      expect.closeTo((6 / 36) * HIGH, 3),
      expect.closeTo((6 / 36) * HIGH, 3),
    ])
  })

  it('hangs nothing and reads 0.0 at rest', () => {
    const context = limiter.draw({ meters })
    const hung = drawn(context).shapes.filter((shape) => shape.colour === ACCENT)
    for (const shape of hung) expect(lowest(shape)).toBe(TOP)
    expect(context.words()).toEqual(['0.0'])
  })

  it('says where the ceiling stands while it is in hand', () => {
    expect(limiter.draw({ meters, hot: 'ceiling', values: { ceiling: -3.5 } }).words()).toContain(
      '−3.5 dB',
    )
  })
})

describe('the Sidechain Ducker display', () => {
  const ducker = plate('ducker')
  const view = (values: Record<string, number>) => viewOf(ducker.display, ducker.params, { values })
  /** One duck at those settings, and the gain in dB at a time in seconds. */
  const duckAt = (values: Record<string, number>) => {
    const made = duck(view(values), new Float32Array(96))
    return {
      ...made,
      at: (seconds: number) => made.gains[Math.round((seconds / made.span) * 96)],
    }
  }
  // The gain's own smoothing out of the way, so the envelope alone is seen.
  const sharp = { timeConstant: 0.001, attackMs: 50, releaseMs: 400, holdMs: 0 }

  it('makes one duck as the device does: down with Attack to the floor Depth sets', () => {
    const one = duckAt({ ...sharp, depth: 0.5, gainScale: 4 })
    expect(one.at(one.from * 0.5)).toBe(0)
    // The key is 0.25 and Key scale 4 takes it to full depth: half the sound, −6.02 dB.
    expect(one.at(one.to)).toBeCloseTo(db(0.5), 1)
    // One time constant in, the envelope is at 63 %: 1 − 0.632 · 0.5.
    expect(one.at(one.from + 0.05)).toBeCloseTo(db(1 - (1 - Math.exp(-1)) * 0.5), 0)
    // And back at the end.
    expect(one.gains[95]).toBeGreaterThan(-0.5)
  })

  it('goes as far as the key drives it: a quarter of the way at Key scale 1', () => {
    const one = duckAt({ ...sharp, depth: 0.68, gainScale: 1 })
    expect(one.at(one.to)).toBeCloseTo(db(1 - 0.25 * 0.68), 1)
  })

  it('waits for Hold before it lets go, and then comes back with Release', () => {
    const held = duckAt({ ...sharp, depth: 0.5, gainScale: 4, holdMs: 1000 })
    expect(held.at(held.to + 0.9)).toBeCloseTo(db(0.5), 1)
    // One time constant of Release after the hold, the envelope is at 37 %.
    expect(held.at(held.to + 1 + 0.4)).toBeCloseTo(db(1 - Math.exp(-1) * 0.5), 0)
    const free = duckAt({ ...sharp, depth: 0.5, gainScale: 4 })
    expect(held.span - free.span).toBeCloseTo(1.1, 6)
  })

  it('stays down longer under a key that overdrives it', () => {
    // At Key scale 32 the envelope has to fall to an eighth before the gain moves: ln 8 time constants.
    const one = duckAt({ ...sharp, depth: 0.5, gainScale: 32 })
    expect(one.at(one.to + 0.4 * Math.log(8) * 0.8)).toBeCloseTo(db(0.5), 1)
    expect(one.at(one.to + 0.4 * Math.log(8) + 0.4)).toBeGreaterThan(db(0.5) + 1)
  })

  it('makes the duck the device makes', () => {
    // The device's own kernel, sample by sample at 48 kHz, under a key of the
    // same level: a square wave between −0.25 and 0.25, whose RMS is 0.25.
    const settings: Record<string, number>[] = [
      {},
      { depth: 0.9, attackMs: 5, holdMs: 300, releaseMs: 200, gainScale: 16, timeConstant: 0.01 },
      { depth: 0.4, attackMs: 300, holdMs: 0, releaseMs: 1500, gainScale: 2, timeConstant: 0.2 },
      { depth: 1, attackMs: 40, holdMs: 1000, releaseMs: 400, gainScale: 1, timeConstant: 0.08 },
    ]
    for (const values of settings) {
      const one = duckAt(values)
      const kernel = new DuckerKernel(48000)
      for (const [name, value] of Object.entries(values)) {
        kernel.setParam(name as Parameters<DuckerKernel['setParam']>[0], value)
      }
      const key = new Float32Array(128)
      const gains = new Float32Array(128)
      let done = 0
      let worst = 0
      let sum = 0
      for (let point = 1; point < 96; point++) {
        const until = Math.round((point / 96) * one.span * 48000)
        while (done < until) {
          const frames = Math.min(128, until - done)
          for (let i = 0; i < frames; i++) {
            const time = (done + i) / 48000
            key[i] = time >= one.from && time < one.to ? ((done + i) % 2 ? 0.25 : -0.25) : 0
          }
          kernel.renderGain([key], gains, frames)
          done += frames
        }
        const off = Math.abs(db(kernel.gain) - one.gains[point])
        worst = Math.max(worst, off)
        sum += off
      }
      // The shape steps a few milliseconds at a time, so it is a hair early or
      // late where the gain moves fastest (1 dB at the worst, under a 5 ms
      // Attack); along the rest it is the same line.
      expect(worst, JSON.stringify(values)).toBeLessThan(1.5)
      expect(sum / 95, JSON.stringify(values)).toBeLessThan(0.05)
    }
  })

  it('takes the gain from the device, whatever the two levels say, and in silence too', () => {
    const told = ducker.run(1, {
      meters: { gain: 0.5, envelope: 0.25 },
      signal: sound(0.5, 0.5),
    })
    const hung = drawn(told).shapes.find((shape) => shape.op === 'fill' && shape.colour === ACCENT)
    expect(lowest(hung)).toBeCloseTo(yOfLevel(db(0.5)), 3)
    expect(told.words()).toContain('−6.0')
    // The reading is linear: a quarter of the sound left is 12.04 dB off.
    const silent = ducker.run(1, { meters: { gain: 0.25, envelope: 0.3 }, signal: sound(0, 0) })
    expect(silent.words()).toContain('−12.0')
    // At rest the device reports unity and no key: nothing hangs.
    const rest = ducker.run(1, { meters: { gain: 1, envelope: 0 }, signal: sound(0, 0) })
    for (const shape of drawn(rest).shapes.filter((one) => one.colour === ACCENT)) {
      expect(lowest(shape)).toBe(TOP)
    }
    expect(rest.words()).toContain('0.0')
  })

  it('says so when nothing keys it: the shape at the left is what it would do, and it does nothing', () => {
    const unkeyed = { meters: { gain: 1, envelope: 0 }, signal: sound(0.5, 0.5) }
    const never = ducker.run(1, unkeyed)
    expect(never.words()).toEqual(['no key', '0.0'])
    expect(patchUnder(never, 'no key', PLAIN_COLOURS.plate)).not.toBeNull()
    // A key sounding, or one that sounded within the seconds the display looks back: nothing to say.
    const state = ducker.display.init?.()
    const keyed = ducker.run(1, {
      state,
      meters: { gain: 0.5, envelope: 0.25 },
      signal: sound(0.5, 0.25),
    })
    expect(keyed.words()).not.toContain('no key')
    const since = ducker.run(5, { ...unkeyed, state, now: 11 })
    expect(since.words()).not.toContain('no key')
    // The key gone for longer than that: it says so again.
    const gone = ducker.run(2, { ...unkeyed, state, now: 16 })
    expect(gone.words()).toContain('no key')
    // A ducker that reports no follower cannot know, and says nothing.
    const unknown = ducker.run(1, { meters: {}, signal: sound(0.5, 0.5) })
    expect(unknown.words()).not.toContain('no key')
  })

  it('draws the key from the follower the device reports: a bar over the top, as thick as it drives the duck', () => {
    /** How far the bar of the key stands over the top of the past, now. */
    const bar = (meters: Record<string, number>, values = {}): number | null => {
      const context = ducker.run(1, { values, meters, signal: sound(0.5, 0.25) })
      const over = drawn(context).shapes.filter(
        (shape) => shape.op === 'fill' && shape.colour === INK_COLOUR && highest(shape) < TOP,
      )
      if (over.length === 0) return null
      expect(over).toHaveLength(1)
      // It runs the length of the past, and rests on its top edge.
      expect(lowest(over[0])).toBe(TOP)
      expect(Math.min(...over[0].points.map(([x]) => x))).toBe(56)
      return TOP - tallNow(over[0]).top
    }
    // The follower times Key scale, and no further than all the way: 3 pixels at full drive.
    expect(bar({ gain: 0.32, envelope: 0.25 })).toBeCloseTo(3, 6)
    expect(bar({ gain: 0.32, envelope: 0.9 })).toBeCloseTo(3, 6)
    expect(bar({ gain: 0.66, envelope: 0.125 })).toBeCloseTo(1.5, 6)
    expect(bar({ gain: 0.83, envelope: 0.25 }, { gainScale: 1 })).toBeCloseTo(0.75, 6)
    // No key, no bar; and a ducker that does not report its follower has none to draw.
    expect(bar({ gain: 1, envelope: 0 })).toBeNull()
    expect(bar({ gain: 0.5 })).toBeNull()
    expect(bar({})).toBeNull()
  })

  it('marks the key of the shape at the left with the same bar', () => {
    const barOf = (values: Record<string, number>): number[] => {
      const rect = ducker
        .draw({ values })
        .calls.find(
          (call) =>
            call.name === 'fillRect' &&
            (call.args[1] as number) > 0 &&
            (call.args[1] as number) < TOP,
        )
      return rect?.args as number[]
    }
    // The shape's key drives the duck all the way at the default Key scale: 3 pixels, over the top.
    const full = barOf({})
    expect(full[1]).toBeCloseTo(TOP - 3, 6)
    expect(full[3]).toBeCloseTo(3, 6)
    const one = duckAt({})
    expect(full[0]).toBeCloseTo(4 + (one.from / one.span) * 48, 6)
    expect(full[2]).toBeCloseTo(((one.to - one.from) / one.span) * 48, 6)
    // A key that hardly drives it still shows when it sounds.
    expect(barOf({ gainScale: 0.5 })[3]).toBe(1)
  })

  it('draws that duck at the left, hanging on the scale of the levels', () => {
    const { shapes } = drawn(ducker.draw({ values: { ...sharp, depth: 0.5 } }))
    const shape = shapes.find(
      (one) => one.op === 'stroke' && one.width === 1.5 && one.points.length === 96,
    )
    expect(highest(shape)).toBe(TOP)
    expect(lowest(shape)).toBeCloseTo(yOfLevel(db(0.5)), 0)
  })

  it('reads the gain off the two levels, and hangs it from the top', () => {
    const context = ducker.run(1, { signal: sound(0.5, 0.25) })
    const hung = drawn(context).shapes.find(
      (shape) => shape.op === 'fill' && shape.colour === ACCENT,
    )
    expect(lowest(hung)).toBeCloseTo(yOfLevel(db(0.5)), 3)
    expect(context.words()).toContain('−6.0')
  })

  it('keeps the gain where it was while the sound is too quiet to tell', () => {
    const context = ducker.run(1, {}, (time) => ({
      signal: time < 0.5 ? sound(0.5, 0.25) : sound(0, 0),
    }))
    expect(context.words()).toContain('−6.0')
  })

  it('claims no gain when it cannot know one, and takes the device’s own when it reports it', () => {
    const blind = ducker.run(0.5, { signal: sound(null, 0.25) })
    expect(blind.words()).toEqual([])
    for (const shape of drawn(blind).shapes.filter((one) => one.colour === ACCENT)) {
      expect(lowest(shape)).toBe(TOP)
    }
    const told = ducker.run(0.5, { meters: { gain: 0.5 }, signal: sound(null, 0.25) })
    expect(told.words()).toContain('−6.0')
  })

  it('has a point on the floor of the duck that sets Depth', () => {
    const depth = ducker.handle('depth', { depth: 0.5 })
    expect(depth.y).toBeCloseTo(yOfLevel(db(0.5)), 6)
    expect(depth.drag(0, yOfLevel(-20)).depth).toBeCloseTo(0.9, 6)
    expect(depth.drag(0, 0).depth).toBe(0)
    // At the foot of the display the sound is gone.
    expect(depth.drag(0, TOP + HIGH).depth).toBe(1)
    const silent = ducker.handle('depth', { depth: 1 })
    expect(silent.drag(silent.x, silent.y).depth).toBe(1)
  })
})

describe('the Swell display', () => {
  const swell = plate('swell')
  const shapeOf = (context: RecordingContext): Shape => {
    const shape = drawn(context).shapes.find(
      (one) => one.op === 'stroke' && one.width === 1.5 && one.points.length === 49,
    )
    if (!shape) throw new Error('no swell was drawn')
    return shape
  }

  it('ports the rise of the device: a line, an exponential, or between the two', () => {
    expect(swellShape(0, 0.5)).toBe(0)
    expect(swellShape(1, 0.5)).toBe(1)
    expect(swellShape(0.5, 0)).toBe(0.5)
    // (e^2.5 − 1) / (e^5 − 1): low for a long while, as a pedal is rocked.
    expect(swellShape(0.5, 1)).toBeCloseTo(0.07586, 4)
    expect(swellShape(0.5, 0.5)).toBeCloseTo((0.5 + 0.07586) / 2, 4)
    expect(swellShape(0.9, 1)).toBeCloseTo((Math.exp(4.5) - 1) / (Math.exp(5) - 1), 6)
  })

  it('draws one swell from the floor Depth sets up to unity, the dry part of Mix with it', () => {
    // Depth 0.5 is a floor of (1 − 0.5)² = 0.25, −12 dB.
    const half = shapeOf(swell.draw({ values: { depth: 0.5, mix: 1 } }))
    expect(half.points[0][1]).toBeCloseTo(yOfLevel(db(0.25)), 3)
    expect(highest(half)).toBe(TOP)
    // From silence with half of the sound left untouched: never under −6 dB.
    const mixed = shapeOf(swell.draw({ values: { depth: 1, mix: 0.5 } }))
    expect(lowest(mixed)).toBeCloseTo(yOfLevel(db(0.5)), 3)
    // From silence, all of it: the foot of the display.
    expect(lowest(shapeOf(swell.draw({ values: { depth: 1, mix: 1 } })))).toBe(TOP + HIGH)
  })

  it('gives rise and fall their share of the width by Attack and Release', () => {
    const top = (values: Record<string, number>): number[] =>
      shapeOf(swell.draw({ values: { ...values, depth: 1, mix: 1 } }))
        .points.filter(([, y]) => y === TOP)
        .map(([x]) => x)
    // 400 ms up and 150 ms down share the 86 % the open stretch leaves: the rise ends at 0.625.
    const open = top({ attack: 400, release: 150 })
    expect(Math.min(...open)).toBe(Math.ceil(4 + 48 * (400 / 550) * 0.86))
    expect(Math.max(...open)).toBe(Math.floor(4 + 48 * ((400 / 550) * 0.86 + 0.14)))
    // A longer Attack takes more of it.
    expect(Math.min(...top({ attack: 2000, release: 150 }))).toBeGreaterThan(Math.min(...open))
  })

  it('bends the rise with Curve as the device does, in dB', () => {
    const at = (curve: number): number => {
      const shape = shapeOf(
        swell.draw({ values: { curve, depth: 1, mix: 1, attack: 400, release: 400 } }),
      )
      // Half way up the rise, which is 43 % of 48 pixels wide: its tenth point.
      return levelOfY(shape.points[10][1])
    }
    const position = 10 / (48 * 0.43)
    expect(at(0)).toBeCloseTo(db(position), 1)
    expect(at(1)).toBeCloseTo(db(swellShape(position, 1)), 1)
    expect(at(1)).toBeLessThan(at(0) - 12)
  })

  it('rides the swell with a mark where the device says the ramp is', () => {
    const values = { attack: 400, release: 400, depth: 1, mix: 1 }
    const markAt = (meters: Record<string, number>): Disc | undefined =>
      drawn(swell.run(0.3, { values, meters, signal: sound(0.5, 0.25) })).discs.find(
        (disc) => disc.radius === 2.5,
      )
    const rising = markAt({ gain: 0.5, position: 0.5, state: 2 })
    expect(rising?.colour).toBe(ACCENT)
    expect(rising?.x).toBeCloseTo(4 + 48 * 0.43 * 0.5, 3)
    expect(rising?.y).toBeCloseTo(yOfLevel(db(0.5)), 3)
    expect(markAt({ gain: 1, position: 1, state: 3 })?.x).toBeCloseTo(4 + 48 * 0.5, 3)
    expect(markAt({ gain: 0.5, position: 0.25, state: 4 })?.x).toBeCloseTo(
      4 + 48 * (0.57 + 0.75 * 0.43),
      3,
    )
    // Diving before a rise, it waits at the start at the height of the gain.
    const diving = markAt({ gain: 0.5, position: 0, state: 1 })
    expect(diving?.x).toBe(4)
    expect(diving?.y).toBeCloseTo(yOfLevel(db(0.5)), 3)
    // Shut, nothing is under way: no mark in a silence, and none at rest.
    expect(markAt({ gain: 0, position: 0, state: 0 })).toBeUndefined()
    expect(drawn(swell.draw({ meters: { gain: 0, position: 0, state: 0 } })).discs).toEqual(
      drawn(swell.draw()).discs,
    )
  })

  it('hangs the gain not yet given back to a note, and the sound it holds shut under Sensitivity', () => {
    const hungBy = (
      meters: Record<string, number>,
      values = {},
      signal = sound(0.5, 0.25),
    ): number => {
      const context = swell.run(1, { values, meters, signal })
      const hung = drawn(context).shapes.find(
        (shape) => shape.op === 'fill' && shape.colour === ACCENT,
      )
      return lowest(hung)
    }
    expect(hungBy({ gain: 0.5, position: 0.5, state: 2 })).toBeCloseTo(yOfLevel(db(0.5)), 3)
    // The dry part of Mix is not taken off: 1 − 0.5 + 0.5 · 0.5.
    expect(hungBy({ gain: 0.5, position: 0.5, state: 2 }, { mix: 0.5 })).toBeCloseTo(
      yOfLevel(db(0.75)),
      3,
    )
    expect(hungBy({ gain: 1, position: 1, state: 3 })).toBe(TOP)
    // Shut over a sound that stays under Sensitivity: it holds that sound at
    // its floor, a quarter of it at Depth 0.5 and none of it at Depth 1.
    const shut = { position: 0, state: 0 }
    expect(hungBy({ ...shut, gain: 0.25 }, { depth: 0.5 })).toBeCloseTo(yOfLevel(db(0.25)), 3)
    expect(hungBy({ ...shut, gain: 0 }, { depth: 1 })).toBe(TOP + HIGH)
    // Shut in silence it holds nothing back from anyone: nothing hangs.
    expect(hungBy({ ...shut, gain: 0 }, { depth: 1 }, sound(0, 0))).toBe(TOP)
  })

  it('shows every note starting from the floor, also when no reading caught it there', () => {
    // Depth 0.5 is a floor of −12.04 dB. A note comes while the swell is open:
    // the next reading already finds the rise a fifth of the way up.
    const values = { depth: 0.5, curve: 0, mix: 1 }
    const open = { gain: 1, position: 1, state: 3 }
    const risen = { gain: 0.4, position: 0.2, state: 2 }
    const deepest = (each: (time: number) => Record<string, number>): number => {
      const context = swell.run(1, { values, signal: sound(0.5, 0.25) }, (time) => ({
        meters: each(time),
      }))
      return lowest(
        drawn(context).shapes.find((shape) => shape.op === 'fill' && shape.colour === ACCENT),
      )
    }
    expect(deepest((time) => (time < 0.5 ? open : risen))).toBeCloseTo(yOfLevel(db(0.25)), 3)
    // A new note during a rise starts the ramp again, from the floor.
    const further = { gain: 0.7, position: 0.6, state: 2 }
    expect(deepest((time) => (time < 0.5 ? further : risen))).toBeCloseTo(yOfLevel(db(0.25)), 3)
    // A rise that only goes on has not been to the floor since.
    expect(deepest((time) => (time < 0.5 ? risen : further))).toBeCloseTo(yOfLevel(db(0.4)), 3)
    // Nor has a display that opens on a rise under way seen where it began.
    expect(deepest(() => risen)).toBeCloseTo(yOfLevel(db(0.4)), 3)
  })

  it('has Sensitivity as a line to drag across the notes arriving', () => {
    const line = swell.handle('sensitivity')
    expect(line.y).toBeCloseTo(yOfLevel(-40), 6)
    expect(line.x).toBeGreaterThan(56)
    expect(line.drag(0, yOfLevel(-25)).sensitivity).toBeCloseTo(-25, 6)
    expect(line.drag(0, 0).sensitivity).toBe(-10)
    // The knob goes on under the display's −60 dB: the line then waits at the foot.
    expect(line.drag(0, 200).sensitivity).toBe(-70)
    const low = swell.handle('sensitivity', { sensitivity: -70 })
    expect(low.y).toBe(TOP + HIGH)
    // Taken there and not moved, it stays under the display; pulled up, it is on it again.
    expect(low.drag(low.x, low.y).sensitivity).toBe(-70)
    expect(swell.handle('sensitivity', { sensitivity: -64 }).drag(0, TOP + HIGH).sensitivity).toBe(
      -64,
    )
    expect(low.drag(low.x, yOfLevel(-50)).sensitivity).toBeCloseTo(-50, 6)
    // One on the display, pushed just past the foot, goes on down.
    expect(line.drag(0, yOfLevel(-63)).sensitivity).toBeCloseTo(-63, 6)
    expect(swell.draw({ hot: 'sensitivity', meters: { gain: 0 } }).words()).toContain('−40.0 dB')
  })
})

describe('the dynamics displays together', () => {
  it('show the same gain as tall on one as on the next: 60 dB over the height', () => {
    // Half the sound taken off, 6.02 dB, on each of the five that share the scale.
    const half = { signal: sound(0.5, 0.25) }
    const reduction = { reduction: db(0.5) }
    const contexts = [
      plate('ambient-comp').run(1, { ...half, meters: reduction }),
      plate('compressor').run(1, { ...half, meters: reduction }),
      plate('fet-limiter').run(1, half),
      plate('ducker').run(1, half),
      plate('swell').run(1, { ...half, meters: { gain: 0.5, position: 0.5, state: 2 } }),
    ]
    for (const context of contexts) {
      const taken = drawn(context).shapes.find(
        (shape) => shape.op === 'fill' && shape.colour === ACCENT,
      )
      const { top, foot } = tallNow(taken)
      expect(foot - top).toBeCloseTo((-db(0.5) / 60) * HIGH, 2)
    }
  })
})

describe('the Ambient Compressor ratio point under Mix and make-up', () => {
  const comp = plate('ambient-comp')
  const ratioAt = (values: Record<string, number>): DisplayHandle => {
    const handle = comp.display
      .handles?.(viewOf(comp.display, comp.params, { values }))
      .find((each) => each.key === 'ratio')
    if (!handle) throw new Error('no ratio point')
    return handle
  }

  it('does not move when it is taken, whatever Mix and the make-up add', () => {
    const settings: Record<string, number>[] = [
      { ratio: 4 },
      { ratio: 4, mix: 0.5 },
      { ratio: 4, mix: 0.5, makeup: 9 },
      { ratio: 2.5, mix: 0.25, makeup: 3, threshold: -36 },
    ]
    for (const values of settings) {
      const handle = ratioAt(values)
      expect(handle.drag(handle.x, handle.y).ratio).toBeCloseTo(values.ratio, 6)
    }
  })
})
