// The display of Late Vibrato, held to its device: the life of a note is drawn
// from the formulas `cpp/devices/late-vibrato/late_vibrato.h` computes, its two
// points stand on the settings they set and a drag puts the setting under the
// hand, and the dot for the note sounding now stands where the device's own
// readings say it is. The device is the committed module, run here.

import { describe, expect, it } from 'vitest'

import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { LATE_VIBRATO_PARAMS } from '../../dsp/devices/late-vibrato.gen'
import { INK, PLAIN_COLOURS } from '../components/display-kit'
import {
  LATE_VIBRATO_CENTS_PER_HZ,
  LATE_VIBRATO_FACES,
  lateVibratoMost,
  lateVibratoRate,
  lateVibratoSpanSec,
  lateVibratoSway,
  lateVibratoTurns,
} from '../components/displays/late-vibrato'
import { type DisplayHandle, type DisplayHold } from '../components/plate-display'
import { drawDisplay, runDisplay, viewOf, type RecordingContext } from './display-harness'

const RATE = 48000
const TWO_PI = Math.PI * 2
const WIDTH = 224
const HEIGHT = 48
const P = LATE_VIBRATO_PARAMS
const display = LATE_VIBRATO_FACES['late-vibrato'].display

type Values = Readonly<Record<string, number>>

/** Where the picture lies on a canvas of a size: the ground's box, the straight line, and the pixels 100 cents take. */
function layout(width = WIDTH, height = HEIGHT) {
  const box = { x: 4, y: 4, w: width - 8, h: height - 8 }
  return { box, mid: height / 2, reach: box.h / 2 - 1.5, right: width - 4, foot: height - 4 }
}

/** A setting as the device takes it: seconds, and the seconds the strip spans. */
function setting(values: Values = {}) {
  const of = (name: keyof typeof P): number => values[name] ?? P[name].default
  const wait = of('wait') / 1000
  const grow = of('grow') / 1000
  const rate = of('rate')
  return {
    wait,
    grow,
    rate,
    quicken: of('quicken'),
    depth: of('depth'),
    shown: Math.min(of('depth'), lateVibratoMost(rate, of('human'))),
    span: lateVibratoSpanSec(wait, grow, rate),
  }
}

interface Stroke {
  colour: string
  alpha: number
  width: number
  dashed: boolean
  points: { x: number; y: number }[]
}

/** Every line a drawing strokes, with what it was stroked in. */
function strokes(drawn: RecordingContext): Stroke[] {
  const all: Stroke[] = []
  let path: { x: number; y: number }[] = []
  let colour = ''
  let alpha = 1
  let width = 1
  let dashed = false
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') path = []
    else if (call.name === 'moveTo' || call.name === 'lineTo')
      path.push({ x: call.args[0] as number, y: call.args[1] as number })
    else if (call.name === 'set strokeStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = call.args[0] as number
    else if (call.name === 'set lineWidth') width = call.args[0] as number
    else if (call.name === 'setLineDash') dashed = (call.args[0] as number[]).length > 0
    else if (call.name === 'stroke') all.push({ colour, alpha, width, dashed, points: path })
  }
  return all
}

/** Every whole circle a drawing has, with its radius: the two points (3.5, or 4.5 in hand) and the dot (2.5). */
function circles(drawn: RecordingContext): { x: number; y: number; r: number }[] {
  return drawn.calls
    .filter((call) => call.name === 'arc' && call.args[3] === 0 && call.args[4] === TWO_PI)
    .map((call) => ({
      x: call.args[0] as number,
      y: call.args[1] as number,
      r: call.args[2] as number,
    }))
}

const dotOf = (drawn: RecordingContext) => circles(drawn).find((circle) => circle.r === 2.5)

/** The swaying voice as drawn: the upper and the lower edge of the wave, which are one line where the cycles are far apart. */
function wave(drawn: RecordingContext): { upper: Stroke; lower: Stroke } | null {
  const edges = strokes(drawn).filter((stroke) => stroke.width === 1.25 && stroke.points.length > 2)
  return edges.length === 2 ? { upper: edges[0], lower: edges[1] } : null
}

/** The straight stretches: lines of two points at the height of the straight pitch, thicker than a scale line or as faint as told. */
function straights(drawn: RecordingContext, mid: number): Stroke[] {
  return strokes(drawn).filter(
    (stroke) =>
      stroke.points.length === 2 &&
      !stroke.dashed &&
      stroke.points.every((point) => point.y === mid) &&
      stroke.alpha !== INK.grid,
  )
}

/** The shade: the filled shapes in the ink that are neither the ground nor a patch under a word. */
function shadeTop(drawn: RecordingContext): number {
  let top = Infinity
  let path: number[] = []
  let alpha = 1
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') path = []
    else if (call.name === 'moveTo' || call.name === 'lineTo') path.push(call.args[1] as number)
    else if (call.name === 'set globalAlpha') alpha = call.args[0] as number
    else if (call.name === 'fill' && alpha < 0.5 && path.length > 4) top = Math.min(top, ...path)
  }
  return top
}

function handlesOf(
  values: Values = {},
  width = WIDTH,
  height = HEIGHT,
): Record<string, DisplayHandle> {
  const all = display.handles?.(viewOf(display, P, { values, width, height })) ?? []
  return Object.fromEntries(all.map((handle) => [handle.key, handle]))
}

const still = (values: Values = {}, width = WIDTH, height = HEIGHT): RecordingContext =>
  drawDisplay(display, P, { values, width, height })

/** One frame while the device runs, with its readings: the first frame of a run, so each is taken as it is. */
const live = (
  values: Values,
  meters: Record<string, number>,
  more: { powered?: boolean; width?: number; height?: number } = {},
): RecordingContext =>
  drawDisplay(display, P, { values, meters, dt: 1 / 60, width: WIDTH, height: HEIGHT, ...more })

function set(device: WasmDeviceHarness, values: Values): void {
  for (const [name, value] of Object.entries(values)) device.set(P[name as keyof typeof P], value)
}

function meters(device: WasmDeviceHarness): Record<string, number> {
  const read = device.device.device_meter
  if (!read) throw new Error('the device reports no readings')
  return { age: read(0), depth: read(1), phase: read(2), rate: read(3) }
}

/** Feeds a held tone, block by block, and hands back the readings after each block. */
function hold(
  device: WasmDeviceHarness,
  seconds: number,
  gain: number,
  from = 0,
): Record<string, number>[] {
  const readings: Record<string, number>[] = []
  const block = new Float32Array(128)
  const blocks = Math.round((seconds * RATE) / 128)
  for (let n = 0; n < blocks; n++) {
    for (let i = 0; i < 128; i++)
      block[i] = gain * Math.cos(((from + n * 128 + i) * 440 * TWO_PI) / RATE)
    device.processBlock(block)
    readings.push(meters(device))
  }
  return readings
}

describe("Late Vibrato's display: the formulas", () => {
  it('takes its numbers from the device', () => {
    // late_vibrato.h: room = (kLatency − kGuard) samples at 96 kHz, and
    // cents_per_hz_ = room / sr · π · 1200 / ln 2.
    expect(LATE_VIBRATO_CENTS_PER_HZ).toBeCloseTo(
      (((960 - 8) / 96000) * Math.PI * 1200) / Math.LN2,
      9,
    )
    expect(LATE_VIBRATO_CENTS_PER_HZ).toBeCloseTo(53.94, 2)
    // sway_ = u²(3 − 2u), u running from the end of Wait over Grow.
    expect(lateVibratoSway(0.3, 0.35, 0.9)).toBe(0)
    expect(lateVibratoSway(0.35 + 0.225, 0.35, 0.9)).toBeCloseTo(0.15625, 9)
    expect(lateVibratoSway(0.35 + 0.45, 0.35, 0.9)).toBeCloseTo(0.5, 9)
    expect(lateVibratoSway(5, 0.35, 0.9)).toBe(1)
    // rate_now_ = rate · (1 + kQuickenMost · quicken · sway), kQuickenMost 0.5.
    expect(lateVibratoRate(5, 1, 1)).toBeCloseTo(7.5, 9)
    expect(lateVibratoRate(5, 0.4, 0.5)).toBeCloseTo(5.5, 9)
    // most_cents_ = cents_per_hz_ · rate · (1 − 0.12 · human) / (1 + 0.25 · human).
    expect(lateVibratoMost(0.5, 0)).toBeCloseTo(26.97, 2)
    expect(lateVibratoMost(0.5, 1)).toBeCloseTo((26.968 * 0.88) / 1.25, 2)
    expect(lateVibratoMost(1.9, 0)).toBeGreaterThan(100)
  })

  it('counts the cycles of a note by the rate it has at each moment', () => {
    for (const quicken of [0, 0.3, 1]) {
      for (const age of [0.1, 0.4, 0.8, 1.2, 1.3, 3]) {
        const step = 1e-5
        const slope =
          (lateVibratoTurns(age + step, 0.35, 0.9, 5, quicken) -
            lateVibratoTurns(age - step, 0.35, 0.9, 5, quicken)) /
          (2 * step)
        expect(slope).toBeCloseTo(lateVibratoRate(5, quicken, lateVibratoSway(age, 0.35, 0.9)), 4)
      }
    }
    expect(lateVibratoTurns(0, 0.35, 0.9, 5, 1)).toBe(0)
  })
})

describe("Late Vibrato's display: the life of a note", () => {
  const settings: [string, Values][] = [
    ['as it starts, evenly', { human: 0, quicken: 0 }],
    ['quickening', { human: 0, quicken: 1, wait: 200, grow: 500, rate: 2, depth: 60 }],
    ['slow and long', { human: 0, wait: 300, grow: 4000, rate: 0.4, depth: 21 }],
  ]

  it.each(settings)(
    'is straight through Wait and then the wave under the S, %s',
    (_what, values) => {
      for (const [width, height] of [
        [WIDTH, HEIGHT],
        [204, 100],
      ]) {
        const { box, mid, reach, right } = layout(width, height)
        const s = setting(values)
        const drawn = still(values, width, height)
        const from = box.x + (box.w * s.wait) / s.span

        // Straight, at full strength, from the left edge to the end of Wait.
        const [flat, ...rest] = straights(drawn, mid)
        expect(flat.points[0].x).toBe(box.x)
        expect(flat.points[1].x).toBeCloseTo(from, 9)
        expect(flat.width).toBe(1.5)
        expect(flat.alpha).toBe(1)
        // With Mix all the way up the straight voice ends there.
        expect(rest).toEqual([])

        // From there to the right edge, the sway: the depth the S has opened to
        // times the sine of the cycles turned since Wait ended.
        const edges = wave(drawn)
        expect(edges).not.toBeNull()
        const { upper, lower } = edges ?? { upper: flat, lower: flat }
        expect(upper.points[0].x).toBeCloseTo(from, 9)
        expect(upper.points[upper.points.length - 1].x).toBeCloseTo(right, 9)
        expect(upper.points.length).toBeGreaterThan(box.w)
        let highest = Infinity
        upper.points.forEach((point, n) => {
          const seconds = ((point.x - box.x) / box.w) * s.span
          const turned =
            lateVibratoTurns(seconds, s.wait, s.grow, s.rate, s.quicken) -
            lateVibratoTurns(s.wait, s.wait, s.grow, s.rate, s.quicken)
          const cents =
            s.shown * lateVibratoSway(seconds, s.wait, s.grow) * Math.sin(turned * TWO_PI)
          // The two edges lie a quarter pixel's sway either side of the wave.
          const middle = (point.y + lower.points[n].y) / 2
          expect(Math.abs(middle - (mid - (reach * cents) / 100))).toBeLessThan(0.12)
          expect(point.y).toBeLessThanOrEqual(lower.points[n].y)
          highest = Math.min(highest, point.y)
        })
        // Its crests reach the Depth, and the point that sets it stands on them.
        expect(highest).toBeCloseTo(mid - (reach * s.shown) / 100, 1)
        expect(handlesOf(values, width, height).full.y).toBeCloseTo(
          mid - (reach * s.shown) / 100,
          9,
        )

        // The S itself, dashed, from the one point to the other.
        const [crest] = strokes(drawn).filter((stroke) => stroke.dashed)
        crest.points.forEach((point) => {
          const seconds = ((point.x - box.x) / box.w) * s.span
          const open = s.shown * lateVibratoSway(seconds, s.wait, s.grow)
          expect(point.y).toBeCloseTo(mid - (reach * open) / 100, 9)
        })
      }
    },
  )

  it('closes the cycles up into the band they fill when they are too many to draw', () => {
    const values = { wait: 4000, grow: 8000, rate: 10, quicken: 1, depth: 60, human: 0 }
    const { box, mid, reach } = layout()
    const s = setting(values)
    // 1.2 pixels a cycle once it is open: nothing a line could follow.
    expect((box.w / s.span / 15) * 1).toBeLessThan(1.5)
    const edges = wave(still(values))
    expect(edges).not.toBeNull()
    const upper = edges?.upper.points ?? []
    const lower = edges?.lower.points ?? []
    upper.forEach((point, n) => {
      const seconds = ((point.x - box.x) / box.w) * s.span
      const open = (reach * s.shown * lateVibratoSway(seconds, s.wait, s.grow)) / 100
      // Never past the S on either side.
      expect(point.y).toBeGreaterThan(mid - open - 1e-6)
      expect(lower[n].y).toBeLessThan(mid + open + 1e-6)
      if (seconds < s.wait + s.grow || n < 2 || n > upper.length - 3) return
      // Half a pixel holds half a cycle here, so one of any three holds a
      // crest and one a trough: the edges are the S and its mirror.
      const top = Math.min(upper[n - 1].y, point.y, upper[n + 1].y)
      const bottom = Math.max(lower[n - 1].y, lower[n].y, lower[n + 1].y)
      expect(top).toBeCloseTo(mid - open, 6)
      expect(bottom).toBeCloseTo(mid + open, 6)
    })
  })

  it('shows no more Depth than the Rate holds', () => {
    const { mid, reach } = layout()
    for (const human of [0, 1]) {
      const values = { rate: 0.5, depth: 100, human, quicken: 0 }
      const most = lateVibratoMost(0.5, human)
      expect(most).toBeLessThan(30)
      const edges = wave(still(values))
      const highest = Math.min(...(edges?.upper.points.map((point) => point.y) ?? []))
      expect(highest).toBeCloseTo(mid - (reach * most) / 100, 1)
    }
    // From 1.9 Hz up all of it is held.
    const all = wave(still({ rate: 1.9, depth: 100, human: 0, wait: 100, grow: 100 }))
    expect(Math.min(...(all?.upper.points.map((point) => point.y) ?? []))).toBeCloseTo(
      mid - reach,
      1,
    )
  })

  it('shades how far Human lets the depth wander: a quarter over, at the most', () => {
    const { mid, reach } = layout()
    for (const human of [0, 0.5, 1]) {
      const top = shadeTop(still({ human, depth: 40 }))
      // kHumanDepth in late_vibrato.h is 0.25.
      expect(top).toBeCloseTo(mid - (reach * 40 * (1 + 0.25 * human)) / 100, 6)
    }
  })

  it('draws each voice as strongly as Mix lets it be heard, and keeps its points at Mix 0', () => {
    const { box, mid, right } = layout()
    const s = setting()
    const from = box.x + (box.w * s.wait) / s.span
    const place = (values: Values) =>
      Object.values(handlesOf(values)).map((handle) => [handle.x, handle.y])

    // Mix 0: nothing sways, the straight voice runs through at full strength.
    const none = still({ mix: 0 })
    expect(wave(none)).toBeNull()
    expect(shadeTop(none)).toBe(Infinity)
    const [, through] = straights(none, mid)
    expect([through.points[0].x, through.points[1].x]).toEqual([from, right])
    expect(through.alpha).toBe(1)
    // What is set is still there to read and to take: the S, and both points.
    expect(strokes(none).filter((stroke) => stroke.dashed)).toHaveLength(1)
    expect(place({ mix: 0 })).toEqual(place({ mix: 1 }))
    expect(circles(none).map((circle) => circle.r)).toEqual([3.5, 3.5])

    // Half way both voices are there, each as strong as the other.
    const half = still({ mix: 0.5 })
    expect(wave(half)?.upper.alpha).toBeCloseTo(0.675, 9)
    expect(straights(half, mid)[1].alpha).toBeCloseTo(0.675, 9)

    // All the way, only the swaying one.
    const all = still({ mix: 1 })
    expect(wave(all)?.upper.alpha).toBe(1)
    expect(straights(all, mid)).toHaveLength(1)
  })

  it('says how much time the strip spans, and marks it', () => {
    expect(still().words()).toEqual(['2.0 s'])
    expect(still({ wait: 4000, grow: 8000, rate: 10 }).words()).toEqual(['14 s'])
    expect(still({ wait: 10, grow: 20, rate: 10 }).words()).toEqual(['280 ms'])
    // Wait and Grow are a quarter of the way across at their shortest and most
    // of the way at their longest, and two and a half cycles follow them.
    expect(0.03 / lateVibratoSpanSec(0.01, 0.02, 10)).toBeCloseTo(0.03 / (0.03 + 0.25), 9)
    expect(12 / lateVibratoSpanSec(4, 8, 10)).toBeCloseTo(0.85, 9)
    expect(lateVibratoSpanSec(0.01, 0.02, 0.6) - 0.03).toBeCloseTo(2.5 / 0.6, 9)
    // A mark each half second at the defaults, on the foot of the box.
    const { box, foot } = layout()
    const marks = strokes(still()).filter(
      (stroke) => stroke.points.length === 2 && stroke.points[1].y === foot,
    )
    const span = setting().span
    expect(marks.map((mark) => mark.points[0].x)).toEqual(
      [0.5, 1, 1.5].map((seconds) => Math.floor(box.x + (box.w * seconds) / span) + 0.5),
    )
  })
})

describe("Late Vibrato's display: the two points", () => {
  it('stand on Wait, and on the end of Grow at the Depth', () => {
    for (const [width, height] of [
      [WIDTH, HEIGHT],
      [204, 100],
      [484, 48],
    ]) {
      const { box, mid, reach } = layout(width, height)
      const grounds: Values[] = [{}, { wait: 1200, grow: 300, depth: 70, rate: 2 }]
      for (const values of grounds) {
        const s = setting(values)
        const { wait, full } = handlesOf(values, width, height)
        expect(wait.x).toBeCloseTo(box.x + (box.w * s.wait) / s.span, 9)
        expect(wait.y).toBe(mid)
        expect(full.x).toBeCloseTo(box.x + (box.w * (s.wait + s.grow)) / s.span, 9)
        expect(full.y).toBeCloseTo(mid - (reach * s.depth) / 100, 9)
        // And are drawn there.
        const rings = circles(still(values, width, height))
        expect(rings).toEqual([
          { x: wait.x, y: wait.y, r: 3.5 },
          { x: full.x, y: full.y, r: 3.5 },
        ])
      }
    }
  })

  it('put Wait under the hand: dragged there, the point stands there', () => {
    const { box, mid } = layout()
    const grounds: Values[] = [{}, { grow: 200, rate: 0.5 }, { grow: 6000, rate: 8 }]
    for (const ground of grounds) {
      const least = handlesOf({ ...ground, wait: P.wait.min }).wait.x
      const most = handlesOf({ ...ground, wait: P.wait.max }).wait.x
      expect(most - least).toBeGreaterThan(20)
      for (const part of [0.1, 0.35, 0.6, 0.9]) {
        const x = least + (most - least) * part
        const set = handlesOf(ground).wait.drag(x, mid + 7)
        expect(Object.keys(set)).toEqual(['wait'])
        expect(set.wait).toBeGreaterThan(P.wait.min)
        expect(set.wait).toBeLessThan(P.wait.max)
        expect(handlesOf({ ...ground, ...set }).wait.x).toBeCloseTo(x, 6)
      }
      // Past either end it is the end.
      expect(handlesOf(ground).wait.drag(box.x - 30, mid)).toEqual({ wait: P.wait.min })
      expect(handlesOf(ground).wait.drag(box.x + box.w + 30, mid)).toEqual({ wait: P.wait.max })
    }
    expect(handlesOf({ wait: 2000 }).wait.reset?.()).toEqual({ wait: P.wait.default })
  })

  it('put Grow and Depth under the hand: dragged there, the point stands there', () => {
    const { box, mid, reach } = layout()
    const grounds: Values[] = [{}, { wait: 100, rate: 0.5, human: 0 }, { wait: 2000, rate: 8 }]
    for (const ground of grounds) {
      const least = handlesOf({ ...ground, grow: P.grow.min }).full.x
      const most = handlesOf({ ...ground, grow: P.grow.max }).full.x
      expect(most - least).toBeGreaterThan(20)
      const held = lateVibratoMost(ground.rate ?? P.rate.default, ground.human ?? P.human.default)
      for (const part of [0.1, 0.4, 0.75]) {
        for (const cents of [0, 12, Math.min(90, held - 1)]) {
          const x = least + (most - least) * part
          const y = mid - (reach * cents) / 100
          // Taken from a Depth the Rate holds all of.
          const from = { ...ground, depth: Math.min(20, held - 1) }
          const set = handlesOf(from).full.drag(x, y)
          expect(Object.keys(set).sort()).toEqual(['depth', 'grow'])
          expect(set.depth).toBeCloseTo(cents, 6)
          const there = handlesOf({ ...from, ...set }).full
          expect(there.x).toBeCloseTo(x, 6)
          expect(there.y).toBeCloseTo(y, 6)
        }
      }
      // Past the ends: the shortest and the longest Grow, no Depth and all of it.
      const far = handlesOf(ground).full.drag(box.x + box.w + 40, -40)
      expect(far.grow).toBe(P.grow.max)
      const near = handlesOf({ ...ground, depth: 0 }).full.drag(box.x - 40, HEIGHT + 40)
      expect(near).toEqual({ grow: P.grow.min, depth: 0 })
    }
    expect(handlesOf({ grow: 3000, depth: 80 }).full.reset?.()).toEqual({
      grow: P.grow.default,
      depth: P.depth.default,
    })
  })

  it('wait at what the Rate holds when Depth is set past it, and move from where Depth lies', () => {
    const { mid, reach } = layout()
    const ground = { rate: 0.5, human: 0 }
    const held = lateVibratoMost(0.5, 0)
    const hold: DisplayHold = {}
    let values: Values = { ...ground, depth: 100 }
    const press = handlesOf(values).full
    // Drawn at the 27 cents that are held, not at the 100 that are set.
    expect(press.y).toBeCloseTo(mid - (reach * held) / 100, 9)
    // Taken and not moved, the setting stays.
    expect(press.drag(press.x, press.y, hold).depth).toBeCloseTo(100, 9)
    // Pulled down, Depth comes down from 100 by as much, and the point waits
    // until the setting is under what is held.
    values = { ...values, ...handlesOf(values).full.drag(press.x, press.y + 3, hold) }
    expect(values.depth).toBeCloseTo(100 - (3 / reach) * 100, 6)
    expect(handlesOf(values).full.y).toBeCloseTo(press.y, 9)
    // The hand remembers how far over the setting lay, whatever is drawn
    // meanwhile, and goes under the straight line to take all of it off.
    values = { ...values, ...handlesOf(values).full.drag(press.x, mid + 2, hold) }
    expect(values.depth).toBeCloseTo(100 - held - (2 / reach) * 100, 6)
    expect(values.depth).toBeGreaterThan(held)
    expect(handlesOf(values).full.y).toBeCloseTo(press.y, 9)
    // Under what is held, the point comes with the hand.
    values = { ...values, ...handlesOf(values).full.drag(press.x, press.y + 15, hold) }
    expect(values.depth).toBeCloseTo(100 - (15 / reach) * 100, 6)
    expect(values.depth).toBeLessThan(held)
    expect(handlesOf(values).full.y).toBeCloseTo(mid - (reach * values.depth) / 100, 9)
    values = { ...values, ...handlesOf(values).full.drag(press.x, HEIGHT + 30, hold) }
    expect(values.depth).toBe(0)
    // Another hand, later, begins again from what lies over then.
    values = { ...ground, depth: 20 }
    const again = handlesOf(values).full
    expect(again.drag(again.x, again.y - 1, {}).depth).toBeCloseTo(20 + 100 / reach, 6)
  })
})

describe("Late Vibrato's display: the note sounding now", () => {
  const values = { human: 0, quicken: 0.5 }

  it('is a dot as far along as the note is old, at the bend the device reports', () => {
    const { box, mid, reach, right } = layout()
    const s = setting(values)
    for (const [age, depth, phase] of [
      [0.2, 0, 0.3],
      [0.8, 9, 0.25],
      [1.3, 28, 0.75],
      [1.7, 28, 0.1],
    ]) {
      const dot = dotOf(live(values, { age, depth, phase, rate: 5.2 }))
      expect(dot?.x).toBeCloseTo(box.x + (box.w * age) / s.span, 9)
      expect(dot?.y).toBeCloseTo(mid - (reach * depth * Math.sin(phase * TWO_PI)) / 100, 9)
    }
    // Older than the strip is long, it stands at the right edge.
    expect(dotOf(live(values, { age: 30, depth: 28, phase: 0.5, rate: 5.2 }))?.x).toBe(right)
    // In the accent, with a ring in the ink.
    const drawn = live(values, { age: 1, depth: 20, phase: 0.2, rate: 5.2 })
    const at = drawn.calls.findIndex((call) => call.name === 'arc' && call.args[2] === 2.5)
    const after = drawn.calls.slice(at)
    expect(after.find((call) => call.name === 'set fillStyle')?.args[0]).toBe(PLAIN_COLOURS.accent)
    expect(after.find((call) => call.name === 'set strokeStyle')?.args[0]).toBe(PLAIN_COLOURS.ink)
  })

  it('is not drawn between notes, at rest, switched off or standing still', () => {
    const reading = { age: 1, depth: 20, phase: 0.2, rate: 5.2 }
    expect(dotOf(live(values, reading))).toBeDefined()
    expect(dotOf(live(values, { ...reading, age: 0, depth: 0 }))).toBeUndefined()
    expect(dotOf(live(values, reading, { powered: false }))).toBeUndefined()
    expect(dotOf(drawDisplay(display, P, { values, meters: reading }))).toBeUndefined()
    // With Mix at 0 the note is there and straight.
    const { mid } = layout()
    expect(dotOf(live({ ...values, mix: 0 }, reading))?.y).toBe(mid)
  })

  it('lays the wave under the dot, wherever in its cycle the note met it', () => {
    const { box } = layout()
    const s = setting(values)
    for (const [age, phase] of [
      [0.9, 0.1],
      [1.4, 0.6],
      [1.9, 0.85],
      [25, 0.4],
    ]) {
      const depth = s.shown * lateVibratoSway(age, s.wait, s.grow)
      const drawn = live(values, { age, depth, phase, rate: 5.2 })
      const dot = dotOf(drawn)
      const edges = wave(drawn)
      expect(dot).toBeDefined()
      expect(edges).not.toBeNull()
      if (!dot || !edges) continue
      const n = edges.upper.points.findIndex((point) => point.x >= dot.x - 1e-9)
      const middle = (edges.upper.points[n].y + edges.lower.points[n].y) / 2
      // Half a pixel along is up to a pixel of height where the wave is steep.
      expect(Math.abs(middle - dot.y)).toBeLessThan(1)
      expect(dot.x).toBeLessThanOrEqual(box.x + box.w)
    }
    // Two notes that met the cycle a quarter of it apart: the same wave, a quarter cycle along.
    const one = wave(live(values, { age: 1.5, depth: 28, phase: 0.2, rate: 5.2 }))
    const other = wave(live(values, { age: 1.5, depth: 28, phase: 0.45, rate: 5.2 }))
    expect(one?.upper.points.map((point) => point.y)).not.toEqual(
      other?.upper.points.map((point) => point.y),
    )
  })

  it('moves along with the note between two readings, and stands when the device does', () => {
    const { box } = layout()
    const s = setting(values)
    const xOf = (age: number): number => box.x + (box.w * age) / s.span
    // Readings thirty times a second, frames sixty.
    const reported = (time: number) => {
      const read = Math.floor(time * 30 + 1e-9) / 30
      return {
        meters: { age: 0.5 + read, depth: 5, phase: (0.3 + 5.2 * read) % 1, rate: 5.2 },
      }
    }
    for (const seconds of [0.25, 0.5, 0.75]) {
      const dot = dotOf(
        runDisplay(display, P, seconds, { values, width: WIDTH, height: HEIGHT }, reported),
      )
      const elapsed = (Math.round(seconds * 60) - 1) / 60
      expect(dot?.x).toBeCloseTo(xOf(0.5 + elapsed), 6)
    }
    // The same reading over and over is a device that has stopped: the note stands on it.
    const stopped = runDisplay(display, P, 1, {
      values,
      width: WIDTH,
      height: HEIGHT,
      meters: { age: 0.5, depth: 5, phase: 0.3, rate: 5.2 },
    })
    expect(dotOf(stopped)?.x).toBeGreaterThanOrEqual(xOf(0.5))
    expect(dotOf(stopped)?.x).toBeLessThan(xOf(0.5 + 0.2))
  })
})

describe("Late Vibrato's display against the device", () => {
  it('reads the depth and the rate the formulas give, at the age the device reports', async () => {
    const values = { wait: 200, grow: 500, depth: 40, rate: 4, quicken: 1, human: 0, swell: 0 }
    const device = await loadWasmDevice('late-vibrato', RATE)
    set(device, values)
    const readings = hold(device, 1.2, 0.4)
    const { box, mid, reach } = layout()
    const s = setting(values)
    let opening = 0
    let before = readings[0]
    let depthOut = 0
    let rateOut = 0
    let cycleOut = 0
    for (const reading of readings) {
      const sway = lateVibratoSway(reading.age, 0.2, 0.5)
      // Depth is smoothed over 5 ms as the device wakes; after that it is the formula's.
      if (reading.age > 0.05) {
        depthOut = Math.max(depthOut, Math.abs(reading.depth - 40 * sway))
        // The rate is set every sixteen samples.
        rateOut = Math.max(rateOut, Math.abs(reading.rate - lateVibratoRate(4, 1, sway)))
      }
      if (sway > 0.1 && sway < 0.9) opening += 1
      // The cycle goes on at that rate from block to block.
      const turned = (reading.phase - before.phase + 1) % 1
      if (reading !== readings[0])
        cycleOut = Math.max(cycleOut, Math.abs(turned - (reading.rate * 128) / RATE))
      before = reading
    }
    expect(depthOut).toBeLessThan(0.05)
    expect(rateOut).toBeLessThan(0.005)
    expect(cycleOut).toBeLessThan(0.0005)
    expect(opening).toBeGreaterThan(50)
    // The note is as old as it has been held, less the moment the attack takes to pass.
    const last = readings[readings.length - 1]
    expect(last.age).toBeGreaterThan(1.2 - 0.04)
    expect(last.age).toBeLessThanOrEqual(1.2)
    expect(last.depth).toBeCloseTo(40, 2)
    expect(last.rate).toBeCloseTo(6, 3)

    // The display, given those readings: the dot on its wave, at that age.
    const drawn = live(values, last)
    const dot = dotOf(drawn)
    const edges = wave(drawn)
    expect(dot?.x).toBeCloseTo(box.x + (box.w * last.age) / s.span, 6)
    expect(dot?.y).toBeCloseTo(mid - (reach * last.depth * Math.sin(last.phase * TWO_PI)) / 100, 6)
    const n = edges?.upper.points.findIndex((point) => point.x >= (dot?.x ?? 0) - 1e-9) ?? -1
    const middle = ((edges?.upper.points[n].y ?? 0) + (edges?.lower.points[n].y ?? 0)) / 2
    expect(Math.abs(middle - (dot?.y ?? 0))).toBeLessThan(1.2)
  })

  it('goes back to the start at a new attack while the cycle runs on', async () => {
    const values = { wait: 200, grow: 300, depth: 40, rate: 4, quicken: 0, human: 0, swell: 0 }
    const device = await loadWasmDevice('late-vibrato', RATE)
    set(device, values)
    const first = hold(device, 1, 0.15)
    const swaying = first[first.length - 1]
    expect(swaying.depth).toBeCloseTo(40, 2)
    // Three times as loud, from one sample to the next: a new note.
    const second = hold(device, 0.15, 0.45, RATE)
    const struck = second[second.length - 1]
    expect(struck.age).toBeLessThan(0.15)
    expect(struck.depth).toBe(0)
    // The cycle was not sent back to its start: it is where the rate has taken it.
    const turned = (struck.phase - swaying.phase + 10) % 1
    expect(turned).toBeCloseTo((4 * 0.15) % 1, 2)
    // And the picture has the note at the left again, on the straight line.
    const { box, mid } = layout()
    const dot = dotOf(live(values, struck))
    expect(dot?.y).toBe(mid)
    expect(dot?.x).toBeLessThan(box.x + box.w * 0.2)
  })

  it('holds a slow sway to the depth the display draws', async () => {
    const values = { wait: 10, grow: 20, depth: 100, rate: 0.5, quicken: 0, human: 0, swell: 0 }
    const device = await loadWasmDevice('late-vibrato', RATE)
    set(device, values)
    const readings = hold(device, 0.5, 0.4)
    const { mid, reach } = layout()
    const depth = readings[readings.length - 1].depth
    expect(depth).toBeCloseTo(lateVibratoMost(0.5, 0), 2)
    expect(handlesOf(values).full.y).toBeCloseTo(mid - (reach * depth) / 100, 3)
  })
})
