// The truth of the dynamics displays: each curve against numbers worked out
// from the device's own formula, what hangs from the top against the gain it
// stands for, and each handle against the parameter it sets.

import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../core/params'
import { PLAIN_COLOURS } from '../components/display-kit'
import { PLATE_FACES } from '../components/displays'
import { duck, nodeCurve, nodeMakeupDb, swellShape } from '../components/displays/dynamics'
import { type DisplayHandle, type DisplaySignal } from '../components/plate-display'
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

  it('reads nothing off silence, where the node stops and its reading stays put', () => {
    const silent = comp.run(0.5, { meters: { reduction: -0.165 }, signal: sound(0, 0) })
    expect(silent.words()).toEqual(['0.0'])
    // Any sound, and the reading is the node's again.
    const heard = comp.run(0.5, { meters: { reduction: -0.165 }, signal: sound(0.01, 0.01) })
    expect(heard.words()).toEqual(['−0.2'])
  })

  it('has a threshold point the wheel sets the knee with, and a ratio point at the end of the curve', () => {
    const threshold = comp.handle('threshold')
    expect(threshold.x).toBeCloseTo(xOfLevel(-24, 48), 6)
    expect(threshold.wheel?.(1)).toEqual({ knee: 32 })
    expect(threshold.wheel?.(-1)).toEqual({ knee: 28 })
    expect(comp.handle('threshold', { knee: 40 }).wheel?.(1)).toEqual({ knee: 40 })
    // Along the diagonal: 12 dB to the left and 12 dB down is 12 dB less.
    const moved = threshold.drag(threshold.x - (12 / 60) * 48, threshold.y + (12 / 60) * HIGH)
    expect(moved.threshold).toBeCloseTo(-36, 3)

    // Dragged to where the curve would end at 4:1, the ratio is 4.
    const at4 = comp.handle('ratio', { threshold: -30, knee: 10, ratio: 4 })
    const from12 = comp.handle('ratio', { threshold: -30, knee: 10, ratio: 12 })
    expect(from12.y).toBeGreaterThan(at4.y)
    expect(from12.drag(from12.x, at4.y).ratio).toBeCloseTo(4, 1)
    // A threshold at full scale leaves the curve nothing to bend: the ratio stays.
    expect(comp.handle('ratio', { threshold: 0, knee: 0, ratio: 7 }).drag(0, 50)).toEqual({
      ratio: 7,
    })
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

  it('lets the reduction go home in silence at the release of the device, half a second', () => {
    const context = fet.run(1.5, {}, (time) => ({
      signal: time < 1 ? sound(0.5, 0.25) : sound(0, 0),
    }))
    // 6.02 dB after half a second of silence: 6.02 / e = 2.2 dB (the frame the silence began on counts).
    const shown = Number(context.words()[0].replace('−', '-'))
    expect(shown).toBeGreaterThan(-2.5)
    expect(shown).toBeLessThan(-2.0)
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
    // Shut, it waits at the start, on the floor.
    const shut = markAt({ gain: 0, position: 0, state: 0 })
    expect(shut?.x).toBe(4)
    expect(shut?.y).toBe(TOP + HIGH)
    // No mark at rest.
    expect(drawn(swell.draw({ meters: { gain: 0, position: 0, state: 0 } })).discs).toEqual(
      drawn(swell.draw()).discs,
    )
  })

  it('hangs the gain not yet given back to a note, and nothing while it is shut', () => {
    const hungBy = (meters: Record<string, number>, values = {}): number => {
      const context = swell.run(1, { values, meters, signal: sound(0.5, 0.25) })
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
    expect(hungBy({ gain: 0, position: 0, state: 0 })).toBe(TOP)
    expect(hungBy({ gain: 1, position: 1, state: 3 })).toBe(TOP)
  })

  it('has Sensitivity as a line to drag across the notes arriving', () => {
    const line = swell.handle('sensitivity')
    expect(line.y).toBeCloseTo(yOfLevel(-40), 6)
    expect(line.x).toBeGreaterThan(56)
    expect(line.drag(0, yOfLevel(-25)).sensitivity).toBeCloseTo(-25, 6)
    expect(line.drag(0, 0).sensitivity).toBe(-10)
    // The knob goes on under the display's −60 dB: the line then waits at the foot.
    expect(line.drag(0, 200).sensitivity).toBe(-70)
    expect(swell.handle('sensitivity', { sensitivity: -70 }).y).toBe(TOP + HIGH)
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
