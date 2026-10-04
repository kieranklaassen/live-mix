// The delays' displays against their devices: where each repeat falls and how
// loud it comes back, worked out by hand from `Delay.ts`, `analog_delay.h`,
// `tape_echo.h` and `echo_memory.h`, and what the displays draw from the
// devices' own readings.

import { describe, expect, it } from 'vitest'

import { normalizeParam, type ParamSpec } from '../../core/params'
import { PLAIN_COLOURS } from '../components/display-kit'
import { DELAY_FACES, keptLevels, newComb, ringComb, type Loop } from '../components/displays/delay'
import {
  drawDisplay,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const paramsOf = (id: string): Readonly<Record<string, ParamSpec>> => stock.get(id)?.params ?? {}
const { ink, accent } = PLAIN_COLOURS

// A strip at rest is 184 by 48: the scope is 176 by 40 inside it, now stands
// 0.22 of the way across, and the room right of it is 137 pixels.
const NOW_X = 43
const AHEAD = 137
const FULL = 1.25
/** The gap between repeats: 0.08 of the room at the short end of Time, 0.4 of it at the long end. */
const gapOf = (id: string, time: string, value: number): number =>
  AHEAD * (0.08 + 0.32 * normalizeParam(paramsOf(id)[time], value))
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

/** The repeats of the click: bars in the ink, right of now, of that width, left to right. */
function bars(drawn: RecordingContext, width = 3, above = 48): Rect[] {
  return shapes(drawn)
    .rects.filter(
      (rect) => rect.style === ink && rect.w === width && rect.x > NOW_X && rect.y < above,
    )
    .sort((a, b) => a.x - b.x)
}

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
    ringComb(plain(0.5), comb)
    expect([...comb.left.slice(1, 6)]).toEqual([1, 0.5, 0.25, 0.125, 0.0625])
    expect([...comb.both.slice(1, 4)]).toEqual([1, 0.5, 0.25])
    // The first is whole whatever Feedback is: with none there is one repeat.
    ringComb(plain(0), comb)
    expect(comb.left[1]).toBe(1)
    expect(comb.left[2]).toBe(0)
    expect(comb.last).toBe(1)
  })

  it('lose what the loop filters take on every pass after the first', () => {
    const comb = newComb()
    comb.kept[1] = 0.5
    comb.kept[2] = 0.2
    ringComb(plain(0.5), comb)
    expect(comb.left[1]).toBe(1)
    expect(comb.left[2]).toBeCloseTo(0.5 * 0.5, 6)
    expect(comb.left[3]).toBeCloseTo(0.25 * 0.2, 6)
  })

  it('bounce between the sides when the feedback is crossed', () => {
    const comb = newComb()
    ringComb({ ...plain(0.5), cross: 1, send: [1, 0] }, comb)
    expect([...comb.left.slice(1, 5)]).toEqual([1, 0, 0.25, 0])
    expect([...comb.right.slice(1, 5)]).toEqual([0, 0.5, 0, 0.125])
    // Part crossed: the sum of the sides goes round at Feedback, their
    // difference at Feedback × (1 − 2 × cross).
    ringComb({ ...plain(0.5), cross: 0.3, send: [1, 0.7] }, comb)
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
    ringComb(
      {
        ...plain(0.5),
        grid: 3,
        heads: [
          [3, 0.45],
          [2, 0.35],
          [1, 0.35],
        ],
      },
      comb,
    )
    expect(comb.left[1]).toBeCloseTo(0.35, 6)
    // The second head, and the first head's echo through the first head again.
    expect(comb.left[2]).toBeCloseTo(0.35 + 0.5 * 0.35 * 0.35, 6)
    // The third head; first then second and second then first; three times the first.
    expect(comb.left[3]).toBeCloseTo(0.45 + 2 * 0.5 * 0.35 * 0.35 + 0.25 * 0.35 ** 3, 6)
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

describe('the Delay display', () => {
  const { display } = DELAY_FACES.delay
  const params = paramsOf('delay')

  it('stands a bar at every delay time, each as much lower as Feedback says', () => {
    const values = { timeSec: 0.35, feedback: 0.5, damping: 20000 }
    const gap = gapOf('delay', 'timeSec', 0.35)
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

  it('spaces the bars by the time: wider for a longer one', () => {
    const first = (timeSec: number): number =>
      bars(drawDisplay(display, params, { values: { timeSec, feedback: 0.5 } }))[0].x
    expect(first(0.09)).toBeLessThan(first(0.35))
    expect(first(0.35)).toBeLessThan(first(1.2))
    expect(first(0.001) + 1.5 - NOW_X).toBeCloseTo(AHEAD * 0.08, 0)
    expect(first(4) + 1.5 - NOW_X).toBeCloseTo(AHEAD * 0.4, 0)
  })

  it('shortens later repeats by what the damping takes', () => {
    // A low-pass at 500 Hz passes the lowest 4.6 of the ten octaves: √0.47 =
    // 0.68 of a pink sound's level behind a wall. The device's filter is a
    // Web Audio low-pass whose Q of √½ is read as decibels, so it stands a
    // little proud under its corner (1.7 dB at the most) and keeps more.
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

  it('shows a note marching to the right: one delay time later, and again at Feedback', () => {
    // 0.6 for a tenth of a second, then silence: a quarter of a second on,
    // the note is between 0.2 and 0.27 s old.
    const values = { timeSec: 0.5, feedback: 0.5, damping: 20000 }
    const drawn = runDisplay(display, params, 0.3, { values }, (time) => ({
      signal: time < 0.1 ? testSignal(0.6, 0.3) : testSignal(0, 0),
    }))
    const gap = gapOf('delay', 'timeSec', 0.5)
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

  it('has one point: across is Time on its own taper, up and down is Feedback', () => {
    const view = viewOf(display, params, { values: { timeSec: 0.35, feedback: 0.35 } })
    const [point] = display.handles?.(view) ?? []
    expect(point.x).toBeCloseTo(NOW_X + gapOf('delay', 'timeSec', 0.35), 6)
    expect(point.y).toBeCloseTo(44 - heightOf(0.35, 40), 6)
    const held = point.drag(point.x, point.y)
    expect(held.timeSec).toBeCloseTo(0.35, 6)
    expect(held.feedback).toBeCloseTo(0.35, 6)
    // Half way along its travel is the middle of the knob: the geometric mean of 1 ms and 4 s.
    const middle = point.drag(NOW_X + AHEAD * 0.24, 44)
    expect(middle.timeSec).toBeCloseTo(Math.sqrt(0.001 * 4), 4)
    expect(middle.feedback).toBe(0)
    expect(point.drag(0, 0)).toEqual({ timeSec: 0.001, feedback: 0.95 })
    expect(point.drag(184, 48).timeSec).toBe(4)
    expect(point.reset?.()).toEqual({ timeSec: 0.35, feedback: 0.35 })
  })

  it('says the time in words, and the feedback while the point is in hand', () => {
    expect(shapes(drawDisplay(display, params)).words).toContain('350 ms')
    expect(shapes(drawDisplay(display, params, { values: { timeSec: 1.2 } })).words).toContain(
      '1.20 s',
    )
    expect(shapes(drawDisplay(display, params, { hot: 'repeat' })).words).toContain('350 ms  35%')
  })
})

describe('the Analog Delay display', () => {
  const { display } = DELAY_FACES['analog-delay']
  const params = paramsOf('analog-delay')
  const level = (values: Record<string, number>, index = 0): number =>
    levelOf(bars(drawDisplay(display, params, { values }))[index].h, 40)

  it('makes long times darker: the clock holds the filters down whatever Tone says', () => {
    // At 1.2 s the clock is 8192 / 1.2 = 6.8 kHz and the two low-passes stand
    // at 2.5 and 2.9 kHz; at 100 ms Tone's own 8 kHz is the limit.
    const long = level({ time: 1200, tone: 8000, age: 0, feedback: 0.45 })
    const short = level({ time: 100, tone: 8000, age: 0, feedback: 0.45 })
    expect(long).toBeLessThan(short * 0.95)
    expect(long).toBeGreaterThan(0.6)
    expect(long).toBeLessThan(0.76)
    // And a low Tone at a short time does what the clock does at a long one.
    expect(level({ time: 100, tone: 800, age: 0, feedback: 0.45 })).toBeLessThan(long)
  })

  it('holds a loop that runs away under what the worn line can carry', () => {
    // At Age 1 the headroom is 0.4, behind a compressor that puts full scale
    // at 0.5: the line never returns more than (0.4 / 0.5)² = 0.64.
    const values = { time: 60, feedback: 1.1, age: 1, tone: 8000 }
    const worn = bars(drawDisplay(display, params, { values })).map((bar) => levelOf(bar.h, 40))
    expect(worn.length).toBeGreaterThan(4)
    for (const one of worn) expect(one).toBeLessThan(0.64)
    expect(worn[worn.length - 1]).toBeGreaterThan(worn[0])
    expect(level({ ...values, age: 0 })).toBeGreaterThan(worn[0])
  })

  it('places the repeats by the clock the device reports: twice the clock is half the delay', () => {
    const gap = gapOf('analog-delay', 'time', 380)
    const signal = testSignal()
    const steady = (clock: number): number =>
      bars(
        runDisplay(display, params, 1, {
          signal,
          meters: { clockLeft: clock, clockRight: clock },
        }),
        1,
      )[0].x
    expect(Math.abs(steady(1) + 0.5 - (NOW_X + gap))).toBeLessThanOrEqual(0.51)
    expect(Math.abs(steady(2) + 0.5 - (NOW_X + gap / 2))).toBeLessThanOrEqual(0.51)
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

  it('marks at rest how far the wobble bends the echoes, and where the steps go', () => {
    // 2 × 3 % of clock at full depth, times sin(π × rate × time), which is 1
    // at 1 Hz and half a second; and the drift, 0.3 of the wobble and a
    // little for Spread, at its 0.23 Hz.
    const values = { time: 500, modDepth: 1, modRate: 1, spread: 0.5 }
    const drift = (0.3 * 0.03 + 0.0012 * 0.5) * Math.sin(Math.PI * 0.23 * 0.5)
    const swing = 1200 * Math.log2(1 + 2 * 0.03 + 2 * drift)
    expect(swing).toBeCloseTo(112, 0)
    const mark = shapes(drawDisplay(display, params, { values })).rects.find(
      (rect) => rect.w === 5 && rect.style === ink,
    )
    const reach = Math.sqrt(swing / 140) * 17
    expect(mark?.x).toBe(NOW_X - 2)
    expect(mark?.y).toBeCloseTo(24 - reach, 4)
    expect(mark?.h).toBeCloseTo(2 * reach, 4)
    // A wobble that comes round exactly once in a delay time bends nothing: only the drift is left.
    const round = shapes(
      drawDisplay(display, params, { values: { ...values, modRate: 2 } }),
    ).rects.find((rect) => rect.w === 5 && rect.style === ink)
    expect(round?.h).toBeCloseTo(2 * Math.sqrt((1200 * Math.log2(1 + 2 * drift)) / 140) * 17, 4)
    // No wobble and no Spread, no mark.
    const still = shapes(drawDisplay(display, params, { values: { modDepth: 0, spread: 0 } })).rects
    expect(still.some((rect) => rect.w === 5)).toBe(false)
  })
})

describe('the Tape Echo display', () => {
  const { display } = DELAY_FACES['tape-echo']
  const params = paramsOf('tape-echo')
  const gap = gapOf('tape-echo', 'time', 150)
  const clean = { time: 150, feedback: 0.5, drive: 0, lowCut: 20, highCut: 16000 }
  const near = (rect: Rect, steps: number): boolean =>
    Math.abs(rect.x + 1.5 - (NOW_X + (steps * gap) / 3)) <= 0.51

  it('bounces the repeats between the sides at full Ping Pong', () => {
    const drawn = bars(drawDisplay(display, params, { values: { ...clean, heads: 0, spread: 1 } }))
    const up = drawn.filter((bar) => bar.y < 24)
    const down = drawn.filter((bar) => bar.y === 24 && bar.h > 0)
    // Left, right, left, right: one Time apart.
    expect(up.map((bar) => [3, 6, 9, 12].find((steps) => near(bar, steps)))).toEqual([3, 9])
    expect(down.map((bar) => [3, 6, 9, 12].find((steps) => near(bar, steps)))).toEqual([6, 12])
    // The first is a full-scale click through the tape: tanh(1) as the device computes it.
    expect(levelOf(up[0].h, 20)).toBeCloseTo(fastTanh(1), 4)
    // The second went round once: half, less what the cuts took.
    const second = levelOf(down[0].h, 20)
    expect(second).toBeGreaterThan(0.42)
    expect(second).toBeLessThan(fastTanh(0.5))
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
    // The near head at 0.5, its own echo through itself, the far head at 0.6
    // with the near head's third time round under it, and both ways round.
    expect([1, 2, 3, 4].map((steps) => drawn.findIndex((bar) => near(bar, steps)))).toEqual([
      0, 1, 2, 3,
    ])
    expect(levelOf(drawn[0].h, 20)).toBeCloseTo(fastTanh(0.5), 4)
    expect(levelOf(drawn[2].h, 20)).toBeGreaterThan(fastTanh(0.6 + 0.5 ** 3 * 0.5 ** 2 * 0.8))
    expect(levelOf(drawn[2].h, 20)).toBeLessThan(fastTanh(0.6 + 0.5 ** 3 * 0.5 ** 2))
    expect(levelOf(drawn[1].h, 20)).toBeLessThan(0.5 * 0.5 * 0.5)
    expect(levelOf(drawn[1].h, 20)).toBeGreaterThan(0.5 * 0.5 * 0.5 * 0.85)
    // One only has the far head.
    const one = bars(drawDisplay(display, params, { values: { ...clean, heads: 0, spread: 0 } }))
    expect(one.some((bar) => near(bar, 1) || near(bar, 2))).toBe(false)
  })

  it('squashes a loud repeat as Drive is turned up', () => {
    const first = (drive: number): number =>
      levelOf(
        bars(drawDisplay(display, params, { values: { ...clean, heads: 0, drive } }))[0].h,
        20,
      )
    // The record path is tanh(4x) / 4 at full Drive.
    expect(first(1)).toBeCloseTo(fastTanh(3) / 4, 4)
    expect(first(1)).toBeLessThan(first(0.3))
    expect(first(0.3)).toBeLessThan(first(0))
  })

  it('stands the head where the device says it is, and rides the tape speed on the mark', () => {
    // Half way to its time, and half a percent fast: 8.6 cents on a scale of 20, by the root.
    const drawn = runDisplay(display, params, 0.3, {
      values: { ...clean, heads: 0, wow: 1, flutter: 1 },
      signal: testSignal(),
      meters: { time: 75, speed: 1.005 },
    })
    const ticks = bars(drawn, 1)
    expect(Math.abs(ticks[0].x + 0.5 - (NOW_X + gap / 2))).toBeLessThanOrEqual(0.51)
    const dots = shapes(drawn).arcs.filter((arc) => arc[2] === 3)
    expect(dots.length).toBe(1)
    expect(dots[0][0]).toBe(NOW_X)
    expect(dots[0][1]).toBeCloseTo(24 - Math.sqrt((1200 * Math.log2(1.005)) / 20) * 17, 4)
    // The thick part of the mark is how far full wow and flutter bend it: 0.8 %.
    const reach = Math.sqrt((1200 * Math.log2(1.008)) / 20) * 17
    const mark = shapes(drawn).rects.find((rect) => rect.w === 5 && rect.style === ink)
    expect(mark?.y).toBeCloseTo(24 - reach, 4)
    expect(mark?.h).toBeCloseTo(2 * reach, 4)
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
    expect(point.x).toBeCloseTo(NOW_X + gapOf('tape-echo', 'time', 380), 6)
    expect(point.y).toBeCloseTo(24 - heightOf(0.45, 20), 6)
    expect(point.drag(184, 0)).toEqual({ time: 2000, feedback: 1.1 })
    expect(point.drag(0, 48)).toEqual({ time: 30, feedback: 0 })
  })
})

describe('the Echo Memory display', () => {
  const { display } = DELAY_FACES['echo-memory']
  const params = paramsOf('echo-memory')
  // The scope is the upper 27 pixels; the memory is a band of 10 along the foot.
  const RISE = 27
  const BAND_Y = 34

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
    const gap = gapOf('echo-memory', 'time', 500)
    const first = (time: number): number =>
      bars(
        runDisplay(display, params, 0.3, {
          signal: testSignal(),
          meters: { time, age1: 0, level1: 0, age2: 0, level2: 0 },
        }),
        1,
        BAND_Y - 3,
      )[0].x
    expect(Math.abs(first(500) + 0.5 - (NOW_X + gap))).toBeLessThanOrEqual(0.51)
    expect(Math.abs(first(250) + 0.5 - (NOW_X + gap / 2))).toBeLessThanOrEqual(0.51)
  })

  it('has its point in the echo, above the memory', () => {
    const view = viewOf(display, params)
    const [point] = display.handles?.(view) ?? []
    expect(point.y).toBeCloseTo(31 - heightOf(0.35, RISE), 6)
    expect(point.drag(point.x, 48).feedback).toBe(0)
    expect(point.drag(point.x, 0).feedback).toBe(0.95)
  })
})
