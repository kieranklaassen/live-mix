// The delays' displays against their devices: where each repeat falls and how
// loud it comes back, worked out by hand from `Delay.ts`, `analog_delay.h`,
// `tape_echo.h` and `echo_memory.h`, and what the displays draw from the
// devices' own readings.

import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../core/params'
import { INK, PLAIN_COLOURS } from '../components/display-kit'
import {
  DELAY_FACES,
  keptLevels,
  newComb,
  newKept,
  ringComb,
  spanOf,
  type Loop,
} from '../components/displays/delay'
import {
  drawDisplay,
  patchUnder,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const paramsOf = (id: string): Readonly<Record<string, ParamSpec>> => stock.get(id)?.params ?? {}
/**
 * A device's settings with Mix all the way up, where every repeat comes out
 * as loud as its loop has it: the tests of a loop work its levels by hand.
 * What Mix does to them has tests of its own, on the device's own settings.
 */
const allWet = (id: string): Readonly<Record<string, ParamSpec>> => {
  const params = paramsOf(id)
  return { ...params, mix: { ...params.mix, default: 1 } }
}
const { ink, accent } = PLAIN_COLOURS

// A strip at rest is 184 by 48: the scope is 176 by 40 inside it, now stands
// 0.22 of the way across, and the room right of it is 137 pixels.
const NOW_X = 43
const AHEAD = 137
const FULL = 1.25
/** The gap between repeats: the room right of now holds `spanOf` seconds. */
const gapOf = (seconds: number): number => (AHEAD * seconds) / spanOf(seconds)
/** The level a bar of that height stands for, on a scale of so many pixels. */
const levelOf = (height: number, rise: number): number => FULL * (height / rise) ** 2
const heightOf = (level: number, rise: number): number => Math.sqrt(level / FULL) * rise
/** `kit::fast_tanh`, worked by hand where a test needs it. */
const fastTanh = (x: number): number => (x * (27 + x * x)) / (27 + 9 * x * x)

interface Rect {
  x: number
  y: number
  w: number
  h: number
  style: string
  alpha: number
}
interface Path {
  points: [number, number][]
  op: 'fill' | 'stroke'
  style: string
}

/** Every rectangle filled and every path drawn, with the colour it was drawn in. */
function shapes(drawn: RecordingContext): {
  rects: Rect[]
  paths: Path[]
  arcs: number[][]
  words: string[]
} {
  const rects: Rect[] = []
  const paths: Path[] = []
  const arcs: number[][] = []
  let fill = ''
  let stroke = ''
  let alpha = 1
  let points: [number, number][] = []
  for (const call of drawn.calls) {
    const args = call.args as number[]
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'set strokeStyle') stroke = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
    else if (call.name === 'fillRect')
      rects.push({ x: args[0], y: args[1], w: args[2], h: args[3], style: fill, alpha })
    else if (call.name === 'beginPath') points = []
    else if (call.name === 'moveTo' || call.name === 'lineTo') points.push([args[0], args[1]])
    else if (call.name === 'arc') arcs.push(args)
    else if (call.name === 'fill') paths.push({ points, op: 'fill', style: fill })
    else if (call.name === 'stroke') paths.push({ points, op: 'stroke', style: stroke })
  }
  return { rects, paths, arcs, words: drawn.words() }
}

/** The repeats of the click: bars in the full ink, right of now, of that width, left to right. */
function bars(drawn: RecordingContext, width = 3, above = 48): Rect[] {
  return shapes(drawn)
    .rects.filter(
      (rect) =>
        rect.style === ink &&
        rect.alpha === 1 &&
        rect.w === width &&
        rect.x > NOW_X + 4 &&
        rect.y < above,
    )
    .sort((a, b) => a.x - b.x)
}

/** The slot about the mark for now: how far the pitch swings. */
const slot = (drawn: RecordingContext): Rect | undefined =>
  shapes(drawn).rects.find((rect) => rect.style === ink && rect.w === 2 && rect.x === NOW_X - 3)

const plain = (feedback: number): Loop => ({
  grid: 1,
  heads: [[1, 1]],
  feedback,
  cross: 0,
  send: [1, 1],
  level: 1,
})

describe('the repeats of one click', () => {
  it('come back times Feedback each pass', () => {
    const comb = newComb()
    ringComb(plain(0.5), newKept(), comb)
    expect([...comb.left.slice(1, 6)]).toEqual([1, 0.5, 0.25, 0.125, 0.0625])
    expect([...comb.right.slice(1, 4)]).toEqual([1, 0.5, 0.25])
    // The first is whole whatever Feedback is: with none there is one repeat.
    ringComb(plain(0), newKept(), comb)
    expect(comb.left[1]).toBe(1)
    expect(comb.left[2]).toBe(0)
    expect(comb.last).toBe(1)
  })

  it('lose what the loop filters take on every pass after the first', () => {
    const comb = newComb()
    const kept = newKept()
    kept[1] = 0.5
    kept[2] = 0.2
    ringComb(plain(0.5), kept, comb)
    expect(comb.left[1]).toBe(1)
    expect(comb.left[2]).toBeCloseTo(0.5 * 0.5, 6)
    expect(comb.left[3]).toBeCloseTo(0.25 * 0.2, 6)
  })

  it('bounce between the sides when the feedback is crossed', () => {
    const comb = newComb()
    ringComb({ ...plain(0.5), cross: 1, send: [1, 0] }, newKept(), comb)
    expect([...comb.left.slice(1, 5)]).toEqual([1, 0, 0.25, 0])
    expect([...comb.right.slice(1, 5)]).toEqual([0, 0.5, 0, 0.125])
    // Part crossed: the sum of the sides goes round at Feedback, their
    // difference at Feedback × (1 − 2 × cross).
    ringComb({ ...plain(0.5), cross: 0.3, send: [1, 0.7] }, newKept(), comb)
    for (let n = 1; n <= 4; n++) {
      const sum = 1.7 * 0.5 ** (n - 1)
      const difference = 0.3 * (0.5 * 0.4) ** (n - 1)
      expect(comb.left[n]).toBeCloseTo((sum + difference) / 2, 5)
      expect(comb.right[n]).toBeCloseTo((sum - difference) / 2, 5)
    }
  })

  it('add up from every head, a third of Time apart', () => {
    const comb = newComb()
    // Three heads at 1/3, 2/3 and 1 of Time, as the Tape Echo's Three mode has them.
    const three: Loop = {
      ...plain(0.5),
      grid: 3,
      heads: [
        [3, 0.45],
        [2, 0.35],
        [1, 0.35],
      ],
    }
    ringComb(three, newKept(), comb)
    expect(comb.left[1]).toBeCloseTo(0.35, 6)
    // The second head, and the first head's echo through the first head again.
    expect(comb.left[2]).toBeCloseTo(0.35 + 0.5 * 0.35 * 0.35, 6)
    // The third head; first then second and second then first; three times the first.
    expect(comb.left[3]).toBeCloseTo(0.45 + 2 * 0.5 * 0.35 * 0.35 + 0.25 * 0.35 ** 3, 6)
    // Where heads of different passes add, each has lost what its own passes
    // took: with a third gone on every pass, the second step is the second
    // head whole and the first head's echo at two thirds.
    const kept = newKept()
    for (let pass = 0; pass < kept.length; pass++) kept[pass] = (2 / 3) ** pass
    ringComb(three, kept, comb)
    expect(comb.left[1]).toBeCloseTo(0.35, 6)
    expect(comb.left[2]).toBeCloseTo(0.35 + (2 / 3) * 0.5 * 0.35 * 0.35, 6)
  })

  it('are bent on every pass by what the device does to a level it records', () => {
    // A tape that saturates as tanh: the click is recorded at tanh(1), and
    // every pass is what the pass before left, times Feedback, through tanh
    // again. As `kit::fast_tanh` computes them: 28/36, then 0.3723, 0.1843.
    const comb = newComb()
    ringComb(plain(0.5), newKept(), comb, fastTanh)
    expect(comb.left[1]).toBeCloseTo(28 / 36, 6)
    expect(comb.left[2]).toBeCloseTo(0.3723, 4)
    expect(comb.left[3]).toBeCloseTo(0.18426, 4)
    expect(comb.left[2]).toBeCloseTo(fastTanh(0.5 * fastTanh(1)), 6)
    // A loop over one does not grow for ever: it settles where one more pass
    // gives back what went in, x = tanh(1.1 x), which is 0.5315.
    ringComb(plain(1.1), newKept(), comb, fastTanh)
    expect(comb.left[60]).toBeCloseTo(Math.sqrt(2.7 / 9.559), 4)
    expect(comb.left[61]).toBeCloseTo(comb.left[60], 5)
    // With nothing to bend it the same loop is followed to eight times full scale and no further.
    ringComb(plain(1.1), newKept(), comb)
    expect(comb.left[4]).toBeCloseTo(1.1 ** 3, 5)
    expect(comb.left[60]).toBe(8)
  })
})

describe('what a loop filter leaves of a level', () => {
  const middle = Math.sqrt(20 * 20000)

  it('is the root of the share of the octaves it passes', () => {
    const kept = new Float32Array(8)
    // A wall at the middle of the ten octaves passes half the power of a pink sound.
    keptLevels(
      kept,
      () => 1,
      (hz) => (hz < middle ? 1 : 0),
    )
    expect(kept[0]).toBe(1)
    expect(kept[1]).toBeCloseTo(Math.SQRT1_2, 6)
    expect(kept[7]).toBeCloseTo(Math.SQRT1_2, 6)
  })

  it('falls with every pass of a real filter, and never faster than the first pass squared', () => {
    const kept = new Float32Array(8)
    // One pole at the middle: what it passes above and below mirror each other, so half is left.
    const onePole = (hz: number): number => 1 / (1 + (hz / middle) ** 2)
    keptLevels(kept, () => 1, onePole)
    expect(kept[1]).toBeCloseTo(Math.SQRT1_2, 5)
    for (let pass = 2; pass < 8; pass++) {
      expect(kept[pass]).toBeLessThan(kept[pass - 1])
      expect(kept[pass]).toBeGreaterThan(kept[1] ** pass)
    }
    // What every repeat goes through once is taken once.
    keptLevels(kept, onePole, () => 1)
    expect(kept[0]).toBeCloseTo(Math.SQRT1_2, 5)
    expect(kept[5]).toBeCloseTo(Math.SQRT1_2, 5)
  })
})

describe('the scale of seconds', () => {
  const { display } = DELAY_FACES.delay
  const params = paramsOf('delay')
  /** The lines the height of the scope: one at every second. */
  const lines = (timeSec: number): number[] =>
    shapes(drawDisplay(display, params, { values: { timeSec } }))
      .rects.filter((rect) => rect.w === 1 && rect.h === 40 && rect.alpha === INK.grid)
      .map((rect) => rect.x)
  /** The ticks under the foot: one at every tenth of a second where they have room. */
  const ticks = (timeSec: number): number[] =>
    shapes(drawDisplay(display, params, { values: { timeSec } }))
      .rects.filter((rect) => rect.w === 1 && rect.h === 2 && rect.y === 45)
      .map((rect) => rect.x)

  it('is the shortest of its steps that holds four of the time and a little more', () => {
    expect(spanOf(0.001)).toBe(0.5)
    expect(spanOf(0.113)).toBe(0.5)
    expect(spanOf(0.114)).toBe(1)
    expect(spanOf(0.35)).toBe(2)
    expect(spanOf(0.45)).toBe(2)
    expect(spanOf(0.46)).toBe(4)
    expect(spanOf(1.2)).toBe(8)
    expect(spanOf(4)).toBe(16)
    // The round times a player sets are well inside a scale, eight repeats in view, not on its edge.
    for (const round of [0.125, 0.25, 0.5, 1, 2]) {
      expect(spanOf(round)).toBe(8 * round)
      expect(spanOf(round * 1.01)).toBe(8 * round)
      expect(spanOf(round * 0.99)).toBe(8 * round)
    }
  })

  it('has a line at every second and a tick at every tenth where they have room', () => {
    // Two seconds across 137 pixels: one second is the middle of the room.
    expect(lines(0.35)).toEqual([112])
    // Tenths are 6.85 pixels apart, on both sides of now, the seconds among them.
    const tenths = ticks(0.35)
    expect(tenths).toContain(Math.round(NOW_X + 6.85))
    expect(tenths).toContain(Math.round(NOW_X - 6.85))
    expect(tenths).toContain(112)
    expect(tenths.length).toBe(5 + 19)
    // Four seconds across: a line at every second, 34 pixels apart, one of them in the past.
    expect(lines(0.6)).toEqual([9, 77, 112, 146])
    // Eight and sixteen seconds across: 17 and 8.6 pixels apart the lines
    // would crowd the repeats, so the ticks under the foot alone, and no tenths.
    expect(lines(1.2)).toEqual([])
    expect(ticks(1.2).filter((x) => x > NOW_X).length).toBe(7)
    expect(ticks(1.2)).toContain(Math.round(NOW_X + AHEAD / 8))
    expect(lines(4)).toEqual([])
    expect(ticks(4).filter((x) => x > NOW_X).length).toBe(15)
    expect(ticks(4)).toContain(Math.round(NOW_X + AHEAD / 16))
    // Half a second across: tenths only.
    expect(lines(0.09)).toEqual([])
    expect(ticks(0.09)).toContain(Math.round(NOW_X + AHEAD / 5))
  })
})

describe('the Delay display', () => {
  const { display } = DELAY_FACES.delay
  const params = allWet('delay')
  const set = paramsOf('delay')

  it('stands a bar at every delay time, each as much lower as Feedback says', () => {
    const values = { timeSec: 0.35, feedback: 0.5, damping: 20000 }
    const gap = gapOf(0.35)
    expect(gap).toBeCloseTo((AHEAD * 0.35) / 2, 9)
    const drawn = bars(drawDisplay(display, params, { values }))
    expect(drawn.length).toBe(Math.floor((AHEAD - 1) / gap))
    drawn.forEach((bar, index) => {
      expect(Math.abs(bar.x + 1.5 - (NOW_X + (index + 1) * gap))).toBeLessThanOrEqual(0.51)
      expect(bar.y + bar.h).toBe(44)
    })
    const levels = drawn.map((bar) => levelOf(bar.h, 40))
    expect(levels[0]).toBeCloseTo(1, 3)
    // With the damping wide open each repeat is half the one before, within a few percent.
    expect(levels[1]).toBeGreaterThan(0.48)
    expect(levels[1]).toBeLessThan(0.52)
    expect(levels[2] / levels[1]).toBeGreaterThan(0.48)
    expect(levels[2] / levels[1]).toBeLessThan(0.52)
  })

  it('spaces the bars by the time, pixel for millisecond on one scale', () => {
    const first = (timeSec: number): number =>
      bars(drawDisplay(display, params, { values: { timeSec, feedback: 0.5 } }))[0].x + 1.5
    // 0.25, 0.3 and 0.4 s share the scale of two seconds: 68.5 pixels a second.
    expect(first(0.25) - NOW_X).toBeCloseTo(17.1, 0)
    expect(first(0.3) - NOW_X).toBeCloseTo(20.55, 0)
    expect(first(0.4) - NOW_X).toBeCloseTo(27.4, 0)
    // Past 0.45 s the next scale takes over, and the gap is half as wide again.
    expect(first(0.6)).toBe(first(0.3))
    // Under the shortest scale's times the repeats close up: 10 ms is 2.7 pixels.
    const close = bars(
      drawDisplay(display, params, { values: { timeSec: 0.01, feedback: 0.9 } }),
      1,
    )
    expect(close[1].x - close[0].x).toBeGreaterThanOrEqual(2)
    expect(close[1].x - close[0].x).toBeLessThanOrEqual(3)
  })

  it('shortens later repeats by what the damping takes', () => {
    // A low-pass at 500 Hz passes the lowest 4.6 of the ten octaves: √0.47 =
    // 0.68 of a pink sound's level behind a wall. The device's filter is a
    // flat Web Audio low-pass, two poles and no peak: it keeps a little of
    // what is over its corner, and nothing comes back louder than it went in.
    const drawn = bars(
      drawDisplay(display, params, { values: { timeSec: 0.2, feedback: 0.5, damping: 500 } }),
    )
    const levels = drawn.map((bar) => levelOf(bar.h, 40))
    const once = levels[1] / (0.5 * levels[0])
    expect(levels[0]).toBeCloseTo(1, 3)
    expect(once).toBeGreaterThan(0.68)
    expect(once).toBeLessThan(0.8)
    // Wide open it takes next to nothing.
    const open = bars(
      drawDisplay(display, params, { values: { timeSec: 0.2, feedback: 0.5, damping: 20000 } }),
    )
    expect(open[1].h).toBeGreaterThan(drawn[1].h + 2)
  })

  it('draws repeats that only fall, however high Feedback is: the loop’s filter has no peak', () => {
    // The low-pass in the loop is flat under its corner, so a pass gives back
    // Feedback of what it took there and less of everything else. With its Q
    // read as decibels it stood 1.7 dB proud under the corner, and over a
    // Feedback of 0.82 the repeats grew.
    for (const [feedback, damping] of [
      [0.95, 2000],
      [0.95, 20000],
      [0.8, 2000],
      [0.35, 6000],
    ]) {
      const drawn = bars(
        drawDisplay(display, params, { values: { timeSec: 0.025, feedback, damping } }),
      )
      const levels = drawn.map((bar) => levelOf(bar.h, 40))
      expect(levels[0]).toBeCloseTo(1, 3)
      for (let n = 1; n < drawn.length; n++) {
        expect(drawn[n].h, `${feedback} at ${damping} Hz`).toBeLessThanOrEqual(drawn[n - 1].h)
        // No pass gives back more than Feedback of the one before.
        expect(levels[n], `${feedback} at ${damping} Hz`).toBeLessThan(
          feedback * levels[n - 1] + 0.02,
        )
      }
    }
    const falling = bars(
      drawDisplay(display, params, { values: { timeSec: 0.025, feedback: 0.8, damping: 2000 } }),
    )
    expect(falling[falling.length - 1].h).toBeLessThan(falling[0].h / 2)
  })

  it('has no bar on the edge: a loop that only falls has nothing louder to come', () => {
    const edge = (feedback: number, damping: number): Rect[] =>
      shapes(
        drawDisplay(display, params, { values: { timeSec: 0.1, feedback, damping } }),
      ).rects.filter(
        (rect) => rect.style === ink && rect.x === 178 && rect.w === 2 && rect.alpha === INK.text,
      )
    const seen = bars(
      drawDisplay(display, params, { values: { timeSec: 0.1, feedback: 0.95, damping: 2000 } }),
    )
    expect(seen.length).toBe(4)
    expect(levelOf(seen[3].h, 40)).toBeLessThan(0.86)
    expect(edge(0.95, 2000)).toEqual([])
    expect(edge(0.95, 20000)).toEqual([])
    expect(edge(0.8, 2000)).toEqual([])
    expect(edge(0.35, 6000)).toEqual([])
  })

  it('shows a note marching to the right: one delay time later, and again at Feedback', () => {
    // 0.6 for a tenth of a second, then silence: a quarter of a second on,
    // the note is between 0.2 and 0.27 s old.
    const values = { timeSec: 0.5, feedback: 0.5, damping: 20000 }
    const drawn = runDisplay(display, params, 0.3, { values }, (time) => ({
      signal: time < 0.1 ? testSignal(0.6, 0.3) : testSignal(0, 0),
    }))
    const gap = gapOf(0.5)
    const { paths } = shapes(drawn)
    const filled = paths.filter((path) => path.op === 'fill' && path.style === ink)
    const past = filled.find((path) => path.points[0][0] === 4 && path.points[0][1] === 44)
    const ahead = filled.find((path) => path.points[0][0] === NOW_X && path.points[0][1] === 44)
    expect(past).toBeDefined()
    expect(ahead).toBeDefined()
    const yAt = (path: Path | undefined, x: number): number =>
      path?.points.find((point, index) => index > 0 && point[0] === Math.round(x))?.[1] ?? NaN
    const top = 44 - heightOf(0.6, 40)
    // In the past, where it went in: 0.23 s back.
    expect(yAt(past, NOW_X - gap * (0.233 / 0.5))).toBeCloseTo(top, 0)
    // To come: it lands on now when it is 0.5 s old, so it is 0.27 s of the gap away.
    const place = NOW_X + gap * (1 - 0.233 / 0.5)
    expect(yAt(ahead, place)).toBeCloseTo(top, 0)
    // And one delay time after that, half as loud.
    const second = yAt(ahead, place + gap)
    expect(second).toBeGreaterThan(44 - heightOf(0.3, 40) - 0.5)
    expect(second).toBeLessThan(44 - heightOf(0.27, 40) + 0.5)
    // Between them, where the silence after the note repeats, nothing.
    expect(yAt(ahead, NOW_X + gap * 0.9)).toBe(44)
    expect(yAt(ahead, NOW_X + gap * 1.9)).toBe(44)
    // The click's repeats stand in front of it as they do at rest.
    expect(bars(drawn).map((bar) => bar.h)).toEqual(
      bars(drawDisplay(display, params, { values })).map((bar) => bar.h),
    )
  })

  it('draws no repeats to come from a level it only knows coming out', () => {
    const signal = { ...testSignal(0.5, 0.4), input: null }
    const drawn = runDisplay(display, params, 0.3, { signal })
    const filled = shapes(drawn).paths.filter((path) => path.op === 'fill' && path.style === ink)
    expect(filled.some((path) => path.points[0][0] === 4)).toBe(true)
    expect(filled.some((path) => path.points[0][0] === NOW_X)).toBe(false)
    // The click's repeats stay the picture.
    expect(bars(drawn).length).toBeGreaterThan(1)
  })

  it('has one point: across is Time on the scale of seconds, up and down is Feedback', () => {
    const view = viewOf(display, params, { values: { timeSec: 0.35, feedback: 0.35 } })
    const [point] = display.handles?.(view) ?? []
    expect(point.x).toBeCloseTo(NOW_X + gapOf(0.35), 6)
    expect(point.y).toBeCloseTo(44 - heightOf(0.35, 40), 6)
    expect(point.drag(point.x, point.y)).toEqual({ timeSec: 0.35, feedback: 0.35 })
    // A pixel is 14.6 ms on this scale. Four pixels on is 58 ms more...
    expect(point.drag(point.x + 4, point.y).timeSec).toBeCloseTo(0.35 + (4 * 2) / AHEAD, 6)
    // ...and within half a pixel of 375 ms or of 400 ms it is that.
    expect(point.drag(NOW_X + (AHEAD * 0.379) / 2, point.y).timeSec).toBe(0.375)
    expect(point.drag(NOW_X + (AHEAD * 0.405) / 2, point.y).timeSec).toBe(0.4)
    // Until the display has seen it taken it stays among the times of its
    // scale, 2 s / 8.8 to 2 s / 4.4, so the scale cannot step under it.
    expect(point.drag(0, 0).timeSec).toBeCloseTo(2 / 8.8, 5)
    expect(point.drag(0, 0).timeSec).toBeGreaterThan(2 / 8.8)
    expect(spanOf(point.drag(0, 0).timeSec)).toBe(2)
    expect(point.drag(0, 0).feedback).toBe(0.95)
    expect(point.drag(184, 48)).toEqual({ timeSec: 2 / 4.4, feedback: 0 })
    expect(spanOf(2 / 4.4)).toBe(2)
    expect(point.reset?.()).toEqual({ timeSec: 0.35, feedback: 0.35 })
  })

  it('keeps its scale while the point is in hand, and steps when it is let go', () => {
    const state = display.init?.()
    const taken = { state, hot: 'repeat', dragging: true }
    drawDisplay(display, params, { ...taken, values: { timeSec: 0.35 } })
    // Dragged to a second and a half: still on the scale of two seconds, three quarters across.
    const values = { timeSec: 1.5, feedback: 0.5 }
    const view = viewOf(display, params, { values })
    const [held] = display.handles?.(view) ?? []
    expect(held.x).toBeCloseTo(NOW_X + AHEAD * 0.75, 6)
    // And the whole of the scale is in reach: from the knob's shortest to its right edge.
    expect(held.drag(0, held.y).timeSec).toBe(0.001)
    expect(held.drag(NOW_X + AHEAD, held.y).timeSec).toBe(2)
    const drawn = drawDisplay(display, params, { ...taken, values })
    expect(Math.abs(bars(drawn)[0].x + 1.5 - held.x)).toBeLessThanOrEqual(0.51)
    expect(bars(drawn).length).toBe(1)
    // Another plate's display is not held by it.
    const other = bars(drawDisplay(display, params, { values }))
    expect(Math.abs(other[0].x + 1.5 - (NOW_X + gapOf(1.5)))).toBeLessThanOrEqual(0.51)
    // Let go, the scale is the one for the time it was left at: eight seconds.
    const after = drawDisplay(display, params, { state, values })
    const [free] = display.handles?.(view) ?? []
    expect(free.x).toBeCloseTo(NOW_X + (AHEAD * 1.5) / 8, 6)
    expect(Math.abs(bars(after)[0].x + 1.5 - free.x)).toBeLessThanOrEqual(0.51)
  })

  it('follows the pointer past the right edge while in hand, to the longest Time the knob has', () => {
    // Taken at the default, 350 ms on the scale of two seconds: 14.6 ms a pixel.
    const state = display.init?.()
    const taken = { state, hot: 'repeat', dragging: true }
    drawDisplay(display, set, taken)
    const pointAt = (timeSec: number) =>
      (display.handles?.(viewOf(display, set, { values: { timeSec } })) ?? [])[0]
    const first = pointAt(0.35)
    // The scale ends at the right edge of the display. The pointer goes on:
    // as far again is four seconds, and half as far three.
    expect(first.drag(NOW_X + AHEAD, first.y).timeSec).toBe(2)
    expect(first.drag(NOW_X + 1.5 * AHEAD, first.y).timeSec).toBe(3)
    expect(first.drag(NOW_X + 1.25 * AHEAD + 0.3, first.y).timeSec).toBe(2.5)
    expect(first.drag(NOW_X + 2 * AHEAD, first.y).timeSec).toBe(4)
    // No further than the knob.
    expect(first.drag(NOW_X + 5 * AHEAD, first.y).timeSec).toBe(4)
    // A drag asks for the point again on every move. Out there it stands on
    // the edge, and the pointer is read from now as before, so nothing jumps:
    // on, back, and under the edge again.
    const out = pointAt(3)
    expect(out.x).toBe(NOW_X + AHEAD)
    expect(out.drag(NOW_X + 1.5 * AHEAD, out.y).timeSec).toBe(3)
    expect(out.drag(NOW_X + 1.75 * AHEAD, out.y).timeSec).toBe(3.5)
    expect(out.drag(NOW_X + AHEAD - 1, out.y).timeSec).toBeCloseTo(2 - 2 / AHEAD, 2)
    expect(out.drag(NOW_X + 0.5 * AHEAD, out.y).timeSec).toBe(1)
    // The one repeat it has is drawn nowhere: it is later than the scale shows.
    expect(bars(drawDisplay(display, set, { ...taken, values: { timeSec: 3 } }))).toEqual([])
    expect(shapes(drawDisplay(display, set, { ...taken, values: { timeSec: 3 } })).words).toContain(
      '3.00 s  35%',
    )
    // Let go, the scale steps to hold it and the point is under the time again.
    drawDisplay(display, set, { state, values: { timeSec: 3 } })
    expect(pointAt(3).x).toBeCloseTo(NOW_X + gapOf(3), 6)
    expect(spanOf(3)).toBeGreaterThanOrEqual(3 * 4.4)
    // Not in hand it keeps to the times of its scale, as it did.
    expect(pointAt(0.35).drag(NOW_X + 2 * AHEAD, 0).timeSec).toBe(2 / 4.4)
  })

  it('draws the repeats as loud as Mix lets them out: the wet gain is Mix itself', () => {
    const values = { timeSec: 0.35, feedback: 0.5, damping: 20000 }
    const levels = (mix?: number): number[] =>
      bars(
        drawDisplay(display, set, { values: mix === undefined ? values : { ...values, mix } }),
      ).map((bar) => levelOf(bar.h, 40))
    const whole = levels(1)
    expect(whole[0]).toBeCloseTo(1, 3)
    for (const mix of [0.75, 0.5, 0.1]) {
      const drawn = levels(mix)
      expect(drawn.length).toBeGreaterThan(1)
      drawn.forEach((level, index) => expect(level / whole[index]).toBeCloseTo(mix, 3))
    }
    // As the device is set when it is new, Mix is 0.3: the first repeat is 0.3 of the click.
    expect(set.mix.default).toBe(0.3)
    expect(levels()[0]).toBeCloseTo(0.3, 3)
    // With no Mix none is heard, and none is drawn. The click that goes in is.
    const dry = drawDisplay(display, set, { values: { ...values, mix: 0 } })
    expect(bars(dry)).toEqual([])
    expect(
      shapes(dry).rects.filter((rect) => rect.style === accent && rect.x === NOW_X - 1),
    ).toEqual([expect.objectContaining({ w: 3, y: 44 - heightOf(1, 40) })])
    // The point is where Feedback has it, whatever Mix: it can be taken at every Mix.
    const point = (mix: number) =>
      (display.handles?.(viewOf(display, set, { values: { ...values, mix } })) ?? [])[0]
    expect(point(0).y).toBe(point(1).y)
    expect(point(0).x).toBe(point(1).x)

    // A note's repeats to come are as loud as Mix lets them out too: at half,
    // the first is half the note (see the note marching to the right, above).
    const note = { timeSec: 0.5, feedback: 0.5, damping: 20000, mix: 0.5 }
    const drawn = runDisplay(display, set, 0.3, { values: note }, (time) => ({
      signal: time < 0.1 ? testSignal(0.6, 0.3) : testSignal(0, 0),
    }))
    const ahead = shapes(drawn).paths.find(
      (path) =>
        path.op === 'fill' &&
        path.style === ink &&
        path.points[0][0] === NOW_X &&
        path.points[0][1] === 44,
    )
    const place = Math.round(NOW_X + gapOf(0.5) * (1 - 0.233 / 0.5))
    const top = ahead?.points.find((point, index) => index > 0 && point[0] === place)?.[1]
    expect(top).toBeCloseTo(44 - heightOf(0.3, 40), 0)
  })

  it('says the time in words, and the feedback while the point is in hand', () => {
    expect(shapes(drawDisplay(display, params)).words).toContain('350 ms')
    expect(shapes(drawDisplay(display, params, { values: { timeSec: 1.2 } })).words).toContain(
      '1.20 s',
    )
    expect(shapes(drawDisplay(display, params, { hot: 'repeat' })).words).toContain('350 ms  35%')
  })

  it('keeps the sound and the repeats clear of the words', () => {
    // The words are 8 pixels high at the top right; what is drawn under them is cut away.
    const drawn = runDisplay(display, params, 0.3, {
      values: { feedback: 0.95 },
      signal: testSignal(1, 1),
    })
    const cut = drawn.calls.findIndex((call) => call.name === 'clip')
    const said = drawn.calls.findIndex((call) => call.name === 'fillText')
    const freed = drawn.calls.findIndex((call) => call.name === 'restore')
    expect(drawn.calls[cut].args[0]).toBe('evenodd')
    const hole = drawn.calls.filter((call, index) => call.name === 'rect' && index < cut)[1]
      .args as number[]
    // 6 characters measured at 5 pixels each by the test's canvas, and a margin.
    expect(hole[0]).toBeLessThanOrEqual(180 - 30)
    expect(hole[0] + hole[2]).toBeGreaterThanOrEqual(180)
    expect(hole[1]).toBeLessThanOrEqual(4)
    expect(hole[1] + hole[3]).toBeGreaterThanOrEqual(12)
    expect(freed).toBeLessThan(said)
  })
})

describe('the Analog Delay display', () => {
  const { display } = DELAY_FACES['analog-delay']
  const params = allWet('analog-delay')
  const set = paramsOf('analog-delay')
  const levels = (values: Record<string, number>): number[] =>
    bars(drawDisplay(display, params, { values })).map((bar) => levelOf(bar.h, 40))
  /** What the line returns of a steady level: `compander.h` and `bbd_line.h`, worked by hand. */
  const line = (level: number, headroom: number): number => {
    const compressed = Math.sqrt((0.16 * Math.PI) / 2) * Math.sqrt(level)
    return ((headroom * fastTanh(compressed / headroom)) / Math.sqrt((0.16 * Math.PI) / 2)) ** 2
  }

  it('makes long times darker: the clock holds the filters down whatever Tone says', () => {
    // At 1.2 s the clock is 8192 / 1.2 = 6.8 kHz and the two low-passes stand
    // at 2.5 and 2.9 kHz; at 100 ms Tone's own 8 kHz is the limit.
    const [long] = levels({ time: 1200, tone: 8000, age: 0, feedback: 0.45 })
    const [short] = levels({ time: 100, tone: 8000, age: 0, feedback: 0.45 })
    expect(long).toBeLessThan(short * 0.95)
    expect(long).toBeGreaterThan(0.6)
    expect(long).toBeLessThan(0.76)
    // And a low Tone at a short time does what the clock does at a long one.
    expect(levels({ time: 100, tone: 800, age: 0, feedback: 0.45 })[0]).toBeLessThan(long)
  })

  it('takes the ceiling of the line on every pass, not once at the end', () => {
    // A new line (headroom 1) returns 0.863 of a full-scale level: the
    // compressor puts it at 0.5013, tanh(0.5013) = 0.4658, and the expander
    // squares 0.4658 / 0.5013. A worn one (Age 1, headroom 0.4) returns
    // (0.4 × tanh(1.2533) / 0.5013)² = 0.482.
    expect(line(1, 1)).toBeCloseTo(0.863, 2)
    expect(line(1, 0.4)).toBeCloseTo(0.482, 2)
    // The second repeat is the first, times Feedback, through the line again:
    // 0.36 of full scale on a new line and 0.18 on a worn one, less what the
    // filters take, and not the 0.42 and 0.31 one pass alone would leave.
    expect(line(0.45, 1)).toBeCloseTo(0.419, 2)
    expect(line(0.45, 0.4)).toBeCloseTo(0.31, 2)
    const fresh = levels({ time: 100, feedback: 0.45, age: 0, tone: 8000 })
    const worn = levels({ time: 100, feedback: 0.45, age: 1, tone: 8000 })
    expect(line(0.45 * line(1, 1), 1)).toBeCloseTo(0.365, 2)
    expect(line(0.45 * line(1, 0.4), 0.4)).toBeCloseTo(0.18, 2)
    // (Tone at 8 kHz and the 45 Hz low cut leave 0.87 of a pink sound's level
    // on the first pass, which the new line returns at 0.75.)
    expect(fresh[0]).toBeGreaterThan(0.7)
    expect(fresh[0]).toBeLessThan(0.863)
    expect(fresh[1]).toBeGreaterThan(0.25)
    expect(fresh[1]).toBeLessThan(0.365)
    expect(fresh[1] / fresh[0]).toBeLessThan(0.45)
    expect(worn[0]).toBeGreaterThan(0.44)
    expect(worn[0]).toBeLessThan(0.482)
    expect(worn[1]).toBeGreaterThan(0.14)
    expect(worn[1]).toBeLessThan(0.18)
  })

  it('draws the repeats as loud as Mix lets them out: the sine of a quarter turn of it', () => {
    // `kit::equal_power`: the wet gain is sin(Mix × π / 2), after the line and
    // its ceiling, so every repeat is lower by the same share.
    const loop = { time: 100, feedback: 0.45, age: 0, tone: 8000 }
    const at = (mix?: number): number[] =>
      bars(drawDisplay(display, set, { values: mix === undefined ? loop : { ...loop, mix } })).map(
        (bar) => levelOf(bar.h, 40),
      )
    const whole = at(1)
    expect(whole).toEqual(levels(loop))
    for (const mix of [0.75, 0.5, 0.2]) {
      const drawn = at(mix)
      expect(drawn.length).toBeGreaterThan(1)
      drawn.forEach((level, index) =>
        expect(level / whole[index]).toBeCloseTo(Math.sin((mix * Math.PI) / 2), 3),
      )
    }
    // New, the device has Mix at 0.35: 0.52 of each repeat comes out.
    expect(set.mix.default).toBe(0.35)
    expect(at()[0] / whole[0]).toBeCloseTo(0.5225, 3)
    expect(at(0)).toEqual([])
  })

  it('settles a loop that runs away where the line holds it', () => {
    // Feedback 1.1: the repeats come to rest where one more pass returns what
    // went in, x = line(1.1 x). That is 0.61 of full scale on a new line and
    // 0.10 on a worn one. At 25 ms nineteen repeats are in view.
    expect(line(1.1 * 0.61, 1)).toBeCloseTo(0.61, 2)
    expect(line(1.1 * 0.1, 0.4)).toBeCloseTo(0.1, 2)
    const fresh = levels({ time: 25, feedback: 1.1, age: 0, tone: 8000 })
    const worn = levels({ time: 25, feedback: 1.1, age: 1, tone: 8000 })
    expect(fresh.length).toBe(19)
    expect(fresh[fresh.length - 1]).toBeGreaterThan(0.5)
    expect(fresh[fresh.length - 1]).toBeLessThan(0.62)
    expect(worn[0]).toBeGreaterThan(0.4)
    expect(worn[worn.length - 1]).toBeGreaterThan(0.06)
    expect(worn[worn.length - 1]).toBeLessThan(0.16)
    for (let n = 1; n < worn.length; n++) expect(worn[n]).toBeLessThanOrEqual(worn[n - 1] + 1e-6)
  })

  it('places the repeats by the clock the device reports: twice the clock is half the delay', () => {
    const gap = gapOf(0.38)
    const signal = testSignal()
    const steady = (clock: number): Rect[] =>
      bars(
        runDisplay(display, params, 1, {
          signal,
          meters: { clockLeft: clock, clockRight: clock },
        }),
      )
    expect(Math.abs(steady(1)[0].x + 1.5 - (NOW_X + gap))).toBeLessThanOrEqual(0.51)
    expect(Math.abs(steady(2)[0].x + 1.5 - (NOW_X + gap / 2))).toBeLessThanOrEqual(0.51)
    expect(Math.abs(steady(2)[1].x + 1.5 - (NOW_X + gap))).toBeLessThanOrEqual(0.51)
  })

  it('shows the pitch of the echoes: the clock now over the clock when they were written', () => {
    const run = (clock: (time: number) => number): number[][] =>
      shapes(
        runDisplay(
          display,
          params,
          1,
          { values: { time: 380, intervalA: 6 }, signal: testSignal() },
          (time) => ({ meters: { clockLeft: clock(time), clockRight: clock(time) } }),
        ),
      ).arcs
    // A steady clock, whatever its rate, plays the line back at the pitch it was written.
    for (const dot of run(() => 2).filter((arc) => arc[2] <= 3)) {
      expect(dot[0]).toBe(NOW_X)
      expect(dot[1]).toBeCloseTo(24, 6)
    }
    // A step up an octave plays what the slower clock wrote an octave up:
    // 1200 cents on a scale of 1300, by the root, of 17 pixels.
    const stepped = run((time) => (time < 0.8 ? 1 : 2)).filter((arc) => arc[2] <= 3)
    expect(stepped.length).toBe(2)
    for (const dot of stepped) expect(dot[1]).toBeCloseTo(24 - Math.sqrt(1200 / 1300) * 17, 4)
  })

  it('leaves the mark to the pitch while sound plays, and to the click at rest', () => {
    const onMark = (drawn: RecordingContext): Rect[] =>
      shapes(drawn).rects.filter((rect) => rect.style === accent && rect.x === NOW_X - 1)
    expect(onMark(drawDisplay(display, params))).toEqual([
      expect.objectContaining({ w: 3, y: 44 - heightOf(1, 40) }),
    ])
    const playing = runDisplay(display, params, 0.3, {
      signal: testSignal(),
      meters: { clockLeft: 1, clockRight: 1 },
    })
    expect(onMark(playing)).toEqual([])
    expect(shapes(playing).arcs.filter((arc) => arc[2] <= 3).length).toBe(2)
  })

  it('marks at rest how far the wobble bends the echoes, and where the steps go', () => {
    // 2 × 3 % of clock at full depth, times sin(π × rate × time), which is 1
    // at 1 Hz and half a second; and the drift, 0.3 of the wobble and a
    // little for Spread, at its 0.23 Hz.
    const values = { time: 500, modDepth: 1, modRate: 1, spread: 0.5 }
    const drift = (0.3 * 0.03 + 0.0012 * 0.5) * Math.sin(Math.PI * 0.23 * 0.5)
    const swing = 1200 * Math.log2(1 + 2 * 0.03 + 2 * drift)
    expect(swing).toBeCloseTo(112, 0)
    const mark = slot(drawDisplay(display, params, { values }))
    const reach = Math.sqrt(swing / 140) * 17
    expect(mark?.y).toBeCloseTo(24 - reach, 4)
    expect(mark?.h).toBeCloseTo(2 * reach, 4)
    // A wobble that comes round exactly once in a delay time bends nothing: only the drift is left.
    const round = slot(drawDisplay(display, params, { values: { ...values, modRate: 2 } }))
    expect(round?.h).toBeCloseTo(2 * Math.sqrt((1200 * Math.log2(1 + 2 * drift)) / 140) * 17, 4)
    // No wobble and no Spread, no slot.
    expect(
      slot(drawDisplay(display, params, { values: { modDepth: 0, spread: 0 } })),
    ).toBeUndefined()
  })
})

describe('the Tape Echo display', () => {
  const { display } = DELAY_FACES['tape-echo']
  const params = allWet('tape-echo')
  const set = paramsOf('tape-echo')
  // 150 ms on the scale of one second: 20.55 pixels, and the heads a third of that apart.
  const gap = gapOf(0.15)
  const clean = { time: 150, feedback: 0.5, drive: 0, lowCut: 20, highCut: 16000 }
  const near = (rect: Rect, steps: number): boolean =>
    Math.abs(rect.x + rect.w / 2 - (NOW_X + (steps * gap) / 3)) <= 0.51

  it('bounces the repeats between the sides at full Ping Pong', () => {
    const drawn = bars(drawDisplay(display, params, { values: { ...clean, heads: 0, spread: 1 } }))
    const up = drawn.filter((bar) => bar.y < 24)
    const down = drawn.filter((bar) => bar.y === 24 && bar.h > 0)
    // Left, right, left, right: one Time apart.
    const places = [3, 6, 9, 12, 15, 18]
    expect(up.map((bar) => places.find((steps) => near(bar, steps)))).toEqual([3, 9, 15])
    expect(down.map((bar) => places.find((steps) => near(bar, steps)))).toEqual([6, 12, 18])
    // The first is a full-scale click through the tape: tanh(1) as the device computes it.
    expect(levelOf(up[0].h, 20)).toBeCloseTo(fastTanh(1), 4)
    // The second is that, times Feedback, less what the cuts took, through
    // the tape again: 0.372 at the most, and not the tanh(0.5) = 0.466 of a
    // click that met the tape once.
    const second = levelOf(down[0].h, 20)
    expect(fastTanh(0.5 * fastTanh(1))).toBeCloseTo(0.3723, 4)
    expect(second).toBeGreaterThan(fastTanh(0.9 * 0.5 * fastTanh(1)))
    expect(second).toBeLessThan(0.3723)
  })

  it('plays both sides alike with Ping Pong off', () => {
    const drawn = bars(drawDisplay(display, params, { values: { ...clean, heads: 0, spread: 0 } }))
    const up = drawn.filter((bar) => bar.y < 24)
    const down = drawn.filter((bar) => bar.y === 24)
    expect(up.length).toBe(down.length)
    up.forEach((bar, index) => expect(bar.h).toBeCloseTo(down[index].h, 6))
  })

  it('draws a comb for every head: Two adds a tap at a third of Time', () => {
    const drawn = bars(
      drawDisplay(display, params, { values: { ...clean, heads: 1, spread: 0 } }),
    ).filter((bar) => bar.y < 24)
    expect([1, 2, 3, 4].map((steps) => drawn.findIndex((bar) => near(bar, steps)))).toEqual([
      0, 1, 2, 3,
    ])
    // The click is on the tape at tanh(1) = 0.778. The near head plays it at 0.5...
    const taped = fastTanh(1)
    expect(levelOf(drawn[0].h, 20)).toBeCloseTo(0.5 * taped, 4)
    // ...which is recorded again at Feedback and played by the near head once more...
    const again = 0.5 * fastTanh(0.5 * 0.5 * taped)
    expect(again).toBeCloseTo(0.0961, 3)
    expect(levelOf(drawn[1].h, 20)).toBeLessThan(again)
    expect(levelOf(drawn[1].h, 20)).toBeGreaterThan(0.9 * again)
    // ...and the far head plays the click at 0.6, with the near head's third time round under it.
    expect(levelOf(drawn[2].h, 20)).toBeGreaterThan(0.6 * taped + 0.5 * 0.5 * 0.8 * again)
    expect(levelOf(drawn[2].h, 20)).toBeLessThan(0.6 * taped + 0.5 * 0.5 * again)
    // One only has the far head.
    const one = bars(drawDisplay(display, params, { values: { ...clean, heads: 0, spread: 0 } }))
    expect(one.some((bar) => near(bar, 1) || near(bar, 2))).toBe(false)
  })

  it('has the heads of each mode where the device has them', () => {
    // `kHeadGains`: Three plays 0.35, 0.35 and 0.45 at one, two and three thirds; Dotted 0.5 and 0.6 at two and three.
    const first = (heads: number): [number, number][] =>
      bars(drawDisplay(display, params, { values: { ...clean, heads, spread: 0, feedback: 0 } }))
        .filter((bar) => bar.y < 24)
        .map((bar) => [
          [1, 2, 3].find((steps) => near(bar, steps)) ?? 0,
          levelOf(bar.h, 20) / fastTanh(1),
        ])
    const expectHeads = (heads: number, want: [number, number][]): void => {
      const got = first(heads)
      expect(got.map(([steps]) => steps)).toEqual(want.map(([steps]) => steps))
      got.forEach(([, gain], index) => expect(gain).toBeCloseTo(want[index][1], 3))
    }
    expectHeads(0, [[3, 1]])
    expectHeads(1, [
      [1, 0.5],
      [3, 0.6],
    ])
    expectHeads(2, [
      [1, 0.35],
      [2, 0.35],
      [3, 0.45],
    ])
    expectHeads(3, [
      [2, 0.5],
      [3, 0.6],
    ])
  })

  it('draws the repeats as loud as Mix lets them out, on both sides', () => {
    // `kit::equal_power` after the tape: sin(Mix × π / 2) of every repeat.
    const loop = { ...clean, heads: 0, spread: 1 }
    const at = (mix?: number): Rect[] =>
      bars(drawDisplay(display, set, { values: mix === undefined ? loop : { ...loop, mix } }))
    const whole = at(1)
    expect(levelOf(whole[0].h, 20)).toBeCloseTo(fastTanh(1), 4)
    for (const mix of [0.75, 0.5]) {
      const drawn = at(mix)
      expect(drawn.length).toBeGreaterThan(3)
      drawn.forEach((bar, index) => {
        expect(bar.x).toBe(whole[index].x)
        // Up for the left and down for the right, as at full Mix.
        expect(bar.y < 24).toBe(whole[index].y < 24)
        expect(levelOf(bar.h, 20) / levelOf(whole[index].h, 20)).toBeCloseTo(
          Math.sin((mix * Math.PI) / 2),
          3,
        )
      })
    }
    expect(set.mix.default).toBe(0.35)
    expect(levelOf(at()[0].h, 20) / fastTanh(1)).toBeCloseTo(0.5225, 3)
    expect(at(0)).toEqual([])
  })

  it('squashes a loud repeat as Drive is turned up', () => {
    const first = (drive: number): number =>
      levelOf(
        bars(drawDisplay(display, params, { values: { ...clean, heads: 0, drive } }))[0].h,
        20,
      )
    // The record path is tanh(4x) / 4 at full Drive.
    expect(first(1)).toBeCloseTo(1 / 4, 4)
    expect(first(1)).toBeLessThan(first(0.3))
    expect(first(0.3)).toBeLessThan(first(0))
  })

  it('holds a Feedback over one where the tape saturates', () => {
    // x = tanh(1.1 x): 0.53 of full scale at no Drive, and not the full scale
    // a click that met the tape once would be drawn at. At 30 ms the repeats
    // are 8 pixels apart and a pixel wide.
    const drawn = bars(
      drawDisplay(display, params, { values: { ...clean, time: 30, heads: 0, feedback: 1.1 } }),
      1,
    ).filter((bar) => bar.y < 24)
    expect(drawn.length).toBe(16)
    expect(levelOf(drawn[0].h, 20)).toBeCloseTo(fastTanh(1), 4)
    const last = levelOf(drawn[drawn.length - 1].h, 20)
    expect(last).toBeGreaterThan(0.42)
    expect(last).toBeLessThan(0.56)
  })

  it('stands the head where the device says it is, and rides the tape speed on the mark', () => {
    // Half way to its time, and half a percent fast: 8.6 cents on a scale of 20, by the root.
    const drawn = runDisplay(display, params, 0.3, {
      values: { ...clean, heads: 0, wow: 1, flutter: 1 },
      signal: testSignal(),
      meters: { time: 75, speed: 1.005 },
    })
    const [first] = bars(drawn, 2)
    expect(Math.abs(first.x + 1 - (NOW_X + gap / 2))).toBeLessThanOrEqual(0.51)
    const dots = shapes(drawn).arcs.filter((arc) => arc[2] === 3)
    expect(dots.length).toBe(1)
    expect(dots[0][0]).toBe(NOW_X)
    expect(dots[0][1]).toBeCloseTo(24 - Math.sqrt((1200 * Math.log2(1.005)) / 20) * 17, 4)
    // The slot about the mark is how far full wow and flutter bend it. The
    // read point moves 1.6 ms with a drift whose steepest is 2π × 0.5 Hz ×
    // 0.516, and 0.07 ms with 0.7 of a 7.1 Hz sine and 0.3 of a drift about
    // 1.9 Hz: 0.52 % and 0.24 %.
    const wow = 0.0016 * 2 * Math.PI * 0.5 * (0.5 + 0.3 * 0.618034 + 0.2 * 1.7320508)
    const flutter =
      0.00007 * 2 * Math.PI * (0.7 * 7.1 + 0.3 * 1.9 * (0.5 + 0.3 * 0.618034 + 0.2 * 1.7320508))
    expect(wow).toBeCloseTo(0.0052, 4)
    expect(flutter).toBeCloseTo(0.0024, 4)
    const reach = Math.sqrt((1200 * Math.log2(1.0076)) / 20) * 17
    expect(slot(drawn)?.y).toBeCloseTo(24 - reach, 4)
    expect(slot(drawn)?.h).toBeCloseTo(2 * reach, 4)
  })

  it('shows no speed while nothing sounds', () => {
    const drawn = runDisplay(display, params, 0.3, {
      signal: testSignal(0, 0),
      meters: { time: 380, speed: 1 },
    })
    expect(shapes(drawn).arcs.filter((arc) => arc[2] === 3)).toEqual([])
  })

  it('has its point on the upper side', () => {
    const view = viewOf(display, params)
    const [point] = display.handles?.(view) ?? []
    expect(point.x).toBeCloseTo(NOW_X + gapOf(0.38), 6)
    expect(point.y).toBeCloseTo(24 - heightOf(0.45, 20), 6)
    expect(point.drag(point.x, point.y)).toEqual({ time: 380, feedback: 0.45 })
    // Not yet seen taken, it stays among the times of its scale of two seconds: 227 to 455 ms.
    expect(point.drag(184, 0)).toEqual({ time: 2000 / 4.4, feedback: 1.1 })
    expect(point.drag(0, 48).time).toBeCloseTo(2000 / 8.8, 2)
    expect(point.drag(0, 48).feedback).toBe(0)
    // Within half a pixel of a round time it is that, in the knob's own milliseconds.
    expect(point.drag(NOW_X + (AHEAD * 0.372) / 2, point.y).time).toBe(375)
  })
})

describe('the Echo Memory display', () => {
  const { display } = DELAY_FACES['echo-memory']
  const params = allWet('echo-memory')
  const set = paramsOf('echo-memory')
  // The scope is the upper 27 pixels; the memory is a band of 10 along the foot.
  const RISE = 27
  const BAND_Y = 34

  it('sets how far back the memory reaches on a patch of the plate, inside the band', () => {
    // What was played is drawn in the same ink right under the figures.
    const patch = patchUnder(drawDisplay(display, params), '20 s', PLAIN_COLOURS.plate)
    expect(patch).not.toBeNull()
    expect(patch?.x).toBeGreaterThanOrEqual(4)
    expect((patch?.y ?? 0) + (patch?.h ?? 0)).toBeLessThanOrEqual(BAND_Y + 10)
  })

  it('plays the echo as loud as Echo says, and not at all at zero', () => {
    const echoes = (echo: number): Rect[] =>
      bars(
        drawDisplay(display, params, { values: { echo, feedback: 0.5, tone: 16000 } }),
        3,
        BAND_Y - 3,
      )
    expect(echoes(0)).toEqual([])
    const half = echoes(0.5).map((bar) => levelOf(bar.h, RISE))
    // Tone is on the playback, so the first repeat has lost a little already.
    expect(half[0]).toBeGreaterThan(0.45)
    expect(half[0]).toBeLessThan(0.5)
    expect(half[1] / half[0]).toBeGreaterThan(0.42)
    expect(half[1] / half[0]).toBeLessThan(0.5)
    expect(echoes(1)[0].h).toBeGreaterThan(echoes(0.5)[0].h)
  })

  it('plays the echo as loud as Mix lets it out, after the limit', () => {
    // `echo_memory.h`: the echo and the memory are limited together, and the
    // wet gain, sin(Mix × π / 2), comes after.
    const loop = { echo: 1, feedback: 0.5, tone: 16000 }
    const at = (mix?: number): number[] =>
      bars(
        drawDisplay(display, set, { values: mix === undefined ? loop : { ...loop, mix } }),
        3,
        BAND_Y - 3,
      ).map((bar) => levelOf(bar.h, RISE))
    const whole = at(1)
    expect(whole.length).toBeGreaterThan(2)
    for (const mix of [0.75, 0.5, 0.2]) {
      const drawn = at(mix)
      expect(drawn.length).toBeGreaterThan(1)
      drawn.forEach((level, index) =>
        expect(level / whole[index]).toBeCloseTo(Math.sin((mix * Math.PI) / 2), 3),
      )
    }
    // New, the device has Mix at 0.4: 0.59 of the echo comes out.
    expect(set.mix.default).toBe(0.4)
    expect(at()[0] / whole[0]).toBeCloseTo(0.5878, 3)
    expect(at(0)).toEqual([])
    // The memory below is what was played, not what comes out: Mix leaves its band as it is.
    const band = (mix: number): unknown[] =>
      drawDisplay(display, set, { values: { mix } }).calls.filter(
        (call) => call.name === 'fillRect' && (call.args as number[])[1] >= BAND_Y,
      )
    expect(band(0)).toEqual(band(1))
  })

  it('marks in the memory where each voice is reading, and which way', () => {
    const marks = (level: number): Rect[] =>
      shapes(
        runDisplay(display, params, 0.2, {
          values: { reach: 20 },
          signal: testSignal(),
          meters: { time: 500, age1: 10, level1: level, age2: 0, level2: 0 },
        }),
      ).rects.filter((rect) => rect.style === accent && rect.y === BAND_Y - 2)
    // Ten seconds back of twenty is the middle of the band.
    const forward = marks(1)
    expect(forward).toContainEqual(expect.objectContaining({ x: 91, w: 3, h: 12 }))
    // As strong as it plays: its window, times Memory at 0.6.
    expect(forward[0].alpha).toBeCloseTo(0.3 + 0.7 * 0.9, 6)
    expect(forward).toContainEqual(expect.objectContaining({ x: 94, w: 3, h: 2 }))
    const backward = marks(-1)
    expect(backward).toContainEqual(expect.objectContaining({ x: 91, w: 3, h: 12 }))
    expect(backward).toContainEqual(expect.objectContaining({ x: 88, w: 3, h: 2 }))
    // A voice at rest is not drawn.
    expect(marks(0)).toEqual([])
  })

  it('reads the second voice from its own two readings, and the echo head from the first', () => {
    // `meter(index)`: 0 the head in ms, 1 and 2 the first voice's age in seconds and its level, 3 and 4 the second's.
    const drawn = runDisplay(display, params, 0.2, {
      values: { reach: 20 },
      signal: testSignal(),
      meters: { time: 500, age1: 0, level1: 0, age2: 5, level2: 0.5 },
    })
    const marks = shapes(drawn).rects.filter(
      (rect) => rect.style === accent && rect.y === BAND_Y - 2 && rect.h === 12,
    )
    // Five seconds back of twenty is three quarters of the way across the band.
    expect(marks.map((rect) => rect.x)).toEqual([4 + 132 - 1])
    expect(marks[0].alpha).toBeCloseTo(0.3 + 0.7 * 0.5 * 0.6 * 1.5, 6)
    // The rule at two seconds: nothing nearer is recalled. A tenth of the band from its right end.
    const rule = shapes(drawn).paths.find(
      (path) => path.op === 'stroke' && path.points.length === 2 && path.points[0][1] === BAND_Y,
    )
    expect(rule?.points[0][0]).toBeCloseTo(4 + 176 * 0.9 + 0.5, 0)
  })

  it('draws at rest one moment as long as Size and Wander make it', () => {
    const moment = (values: Record<string, number>): number => {
      const hump = shapes(drawDisplay(display, params, { values })).paths.find(
        (path) => path.op === 'stroke' && path.points.length > 3 && path.points[0][1] === 44,
      )
      const xs = hump?.points.map((point) => point[0]) ?? []
      return Math.max(...xs) - Math.min(...xs)
    }
    // Size 3 s, but a wait of 2 s at Wander 0.5 holds a moment to 1.4 × 2 s: 2.8 of 20 s of 176 px.
    expect(moment({ reach: 20, size: 3, wander: 0.5 })).toBeCloseTo((2.8 / 20) * 176, 4)
    // A slow Wander leaves Size its length.
    expect(moment({ reach: 20, size: 3, wander: 0 })).toBeCloseTo((3 / 20) * 176, 4)
    expect(moment({ reach: 60, size: 3, wander: 0 })).toBeCloseTo((3 / 60) * 176, 4)
    // No memory, no moment.
    expect(moment({ memory: 0 })).toBe(-Infinity)
  })

  it('stands the echo where its head is on the way to Time', () => {
    const gap = gapOf(0.5)
    const first = (time: number): number =>
      bars(
        runDisplay(display, params, 0.3, {
          signal: testSignal(),
          meters: { time, age1: 0, level1: 0, age2: 0, level2: 0 },
        }),
        3,
        BAND_Y - 3,
      )[0].x
    expect(Math.abs(first(500) + 1.5 - (NOW_X + gap))).toBeLessThanOrEqual(0.51)
    expect(Math.abs(first(250) + 1.5 - (NOW_X + gap / 2))).toBeLessThanOrEqual(0.51)
  })

  it('has its point in the echo, above the memory', () => {
    const view = viewOf(display, params)
    const [point] = display.handles?.(view) ?? []
    expect(point.y).toBeCloseTo(31 - heightOf(0.35, RISE), 6)
    expect(point.drag(point.x, 48).feedback).toBe(0)
    expect(point.drag(point.x, 0).feedback).toBe(0.95)
    // Half a second is on the scale of four seconds, a pixel 29 ms wide. A
    // drag takes the roundest time within half a pixel: 375 ms is three
    // eighths of a second, though no multiple of 50 or of 100.
    const state = display.init?.()
    drawDisplay(display, params, { state, hot: 'repeat', dragging: true })
    const [held] = display.handles?.(view) ?? []
    expect(held.drag(NOW_X + (AHEAD * 0.383) / 4, held.y).time).toBe(375)
    expect(held.drag(NOW_X + (AHEAD * 0.26) / 4, held.y).time).toBe(250)
    expect(held.drag(NOW_X + (AHEAD * 0.31) / 4, held.y).time).toBe(300)
    drawDisplay(display, params, { state })
  })
})

describe('the four of them', () => {
  it('set no type under 8 pixels, running or at rest, closed or opened', () => {
    for (const [id, face] of Object.entries(DELAY_FACES)) {
      const params = paramsOf(id)
      const meters = Object.fromEntries(Object.keys(stock.get(id)?.meters ?? {}).map((k) => [k, 1]))
      for (const width of [184, 600]) {
        for (const drawn of [
          drawDisplay(face.display, params, { width }),
          runDisplay(face.display, params, 0.2, { width, signal: testSignal(), meters }),
        ]) {
          const sizes = drawn.calls
            .filter((call) => call.name === 'set font')
            .map((call) => Number(/(\d+(?:\.\d+)?)px/.exec(String(call.args[0]))?.[1]))
          expect(sizes.length, id).toBeGreaterThan(0)
          for (const size of sizes) expect(size, id).toBeGreaterThanOrEqual(8)
        }
      }
    }
  })
})
