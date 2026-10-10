// The truth of Melt's display: every figure it draws against the device's own
// formula, by the numbers in its header (`cpp/devices/melt/melt.h`, read here
// so a copy that drifts is caught) and by its compiled code run on its own;
// the two handles against the parameters they set; and the part that moves
// against the reading the device gives.
//
// "The compiled device" is melt.wasm with Mix at 1, so what comes out is the
// tail alone: a burst a third of a second long goes in, and the tail's pitch
// and level are read in windows after it.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { MELT_METERS, MELT_PARAMS } from '../../dsp/devices/melt.gen'
import { PLAIN_COLOURS, TEXT_LEAST } from '../components/display-kit'
import {
  MELT_AGE_MARKS,
  MELT_AGE_MOST,
  MELT_ALLPASS_SEC,
  MELT_BAND_INK,
  MELT_BAND_SHARE,
  MELT_BLUR_GAIN,
  MELT_CENTS_MOST,
  MELT_DIM_DB_PER_SEC,
  MELT_DRY_SHARE,
  MELT_FACES,
  MELT_LINE_HALF,
  MELT_LINE_SEC,
  MELT_LIT_HALF,
  MELT_MAX_SCALE,
  MELT_MIN_SCALE,
  MELT_OWN_SHARE,
  MELT_PITCH_MARKS,
  MELT_SMEAR_FULL_SEC,
  MELT_TIDE_SHARE,
  MELT_TRAVEL_SHARE,
  MELT_TURN_CENTS,
  MELT_UNHEARD,
  meltAgeAt,
  meltBand,
  meltCents,
  meltCentsAt,
  meltColour,
  meltLevelDb,
  meltLit,
  meltPassSec,
  meltPlot,
  meltReach,
  meltShown,
  meltSmearSec,
  meltX,
  meltY,
} from '../components/displays/melt'
import { type DisplayHandle } from '../components/plate-display'
import {
  drawDisplay,
  patchUnder,
  runDisplay,
  testSignal,
  viewOf,
  type RecordingContext,
} from './display-harness'

type Values = Readonly<Record<string, number>>

const RATE = 48000
const display = MELT_FACES.melt.display
const params = MELT_PARAMS

/** The shapes the display is handed: under four knobs, in the harness, upright, and under all nine knobs. */
const SIZES = [
  { width: 224, height: 48 },
  { width: 184, height: 48 },
  { width: 204, height: 100 },
  { width: 520, height: 48 },
] as const
const STRIP = SIZES[0]

const defaults: Record<string, number> = Object.fromEntries(
  Object.entries(params).map(([name, spec]) => [name, spec.default]),
)
const set = (values: Values = {}): Record<string, number> => ({ ...defaults, ...values })
/** Settings to go through one after another: each names only what it moves. */
const cases = (all: Values[]): Values[] => all

// --- The header ---------------------------------------------------------------

const header = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../../cpp/devices/melt/melt.h'),
  'utf8',
)
const headerNumber = (name: string): number => {
  const found = new RegExp(`\\b${name}\\s*=\\s*([-0-9.]+)f?;`).exec(header)
  if (!found) throw new Error(`melt.h has no ${name}`)
  return Number(found[1])
}
const headerList = (name: string): number[] => {
  const found = new RegExp(`\\b${name}\\[\\w*\\]\\s*=\\s*\\{([^}]*)\\}`).exec(header)
  if (!found) throw new Error(`melt.h has no ${name}`)
  return found[1].split(',').map((item) => parseFloat(item))
}

// --- What was drawn -------------------------------------------------------------

/** One stretch of the tail as the display fills it: its two ends, how far it stands either side of each, and its ink. */
interface Ribbon {
  from: [number, number]
  to: [number, number]
  fromHalf: number
  toHalf: number
  colour: string
  alpha: number
}

/** Every four-cornered shape the display filled: the tail's line, its band and what is lit on it. */
function ribbonsOf(drawn: RecordingContext): Ribbon[] {
  const ribbons: Ribbon[] = []
  let points: [number, number][] = []
  let colour = ''
  let alpha = 1
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
    else if (call.name === 'beginPath') points = []
    else if (call.name === 'moveTo' || call.name === 'lineTo') {
      points.push([Number(call.args[0]), Number(call.args[1])])
    } else if (call.name === 'fill' && points.length === 4) {
      const [a, b, c, d] = points
      ribbons.push({
        from: [a[0], (a[1] + d[1]) / 2],
        to: [b[0], (b[1] + c[1]) / 2],
        fromHalf: (d[1] - a[1]) / 2,
        toHalf: (c[1] - b[1]) / 2,
        colour,
        alpha,
      })
    }
  }
  return ribbons
}

const near = (a: number, b: number, by = 1e-6): boolean => Math.abs(a - b) <= by
const isLine = (ribbon: Ribbon): boolean =>
  ribbon.colour === PLAIN_COLOURS.ink &&
  near(ribbon.fromHalf, MELT_LINE_HALF) &&
  near(ribbon.toHalf, MELT_LINE_HALF)
const linesOf = (drawn: RecordingContext): Ribbon[] => ribbonsOf(drawn).filter(isLine)
const bandsOf = (drawn: RecordingContext): Ribbon[] =>
  ribbonsOf(drawn).filter((ribbon) => ribbon.colour === PLAIN_COLOURS.ink && !isLine(ribbon))
const litOf = (drawn: RecordingContext): Ribbon[] =>
  ribbonsOf(drawn).filter((ribbon) => ribbon.colour === PLAIN_COLOURS.accent)

/** Every dotted line stroked: Drip's reach. */
function dottedOf(drawn: RecordingContext): [number, number][][] {
  const lines: [number, number][][] = []
  let points: [number, number][] = []
  let dotted = false
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') points = []
    else if (call.name === 'moveTo' || call.name === 'lineTo') {
      points.push([Number(call.args[0]), Number(call.args[1])])
    } else if (call.name === 'setLineDash') dotted = (call.args[0] as number[]).length > 0
    else if (call.name === 'stroke' && dotted) lines.push(points)
  }
  return lines
}

/** Every filled rectangle, with its ink. */
function rectsOf(drawn: RecordingContext) {
  const rects: { x: number; y: number; w: number; h: number; colour: string; alpha: number }[] = []
  let colour = ''
  let alpha = 1
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
    else if (call.name === 'fillRect') {
      const [x, y, w, h] = call.args as number[]
      rects.push({ x, y, w, h, colour, alpha })
    }
  }
  return rects
}

/** Every straight stroke of two points: the rules and ticks of the scale, and Solid's stretch. */
function strokesOf(drawn: RecordingContext) {
  const strokes: { from: [number, number]; to: [number, number]; width: number }[] = []
  let points: [number, number][] = []
  let width = 1
  for (const call of drawn.calls) {
    if (call.name === 'set lineWidth') width = Number(call.args[0])
    else if (call.name === 'beginPath') points = []
    else if (call.name === 'moveTo' || call.name === 'lineTo') {
      points.push([Number(call.args[0]), Number(call.args[1])])
    } else if (call.name === 'stroke' && points.length === 2) {
      strokes.push({ from: points[0], to: points[1], width })
    }
  }
  return strokes
}

const handlesAt = (values: Values, size: { width: number; height: number } = STRIP) => {
  const all = display.handles?.(viewOf(display, params, { values: set(values), ...size })) ?? []
  const by = (key: string): DisplayHandle => {
    const found = all.find((handle) => handle.key === key)
    if (!found) throw new Error(`no handle ${key}`)
    return found
  }
  return { all, end: by('end'), solid: by('solid') }
}

const still = (values: Values, size: { width: number; height: number } = STRIP) =>
  drawDisplay(display, params, { values: set(values), ...size })

// --- The numbers ----------------------------------------------------------------

describe("melt's numbers are the header's", () => {
  it('copies every constant the picture is worked out from', () => {
    expect([...MELT_LINE_SEC]).toEqual(headerList('kLineSeconds'))
    expect([...MELT_ALLPASS_SEC]).toEqual(headerList('kAllpassSeconds'))
    expect(MELT_MIN_SCALE).toBe(headerNumber('kMinScale'))
    expect(MELT_MAX_SCALE).toBe(headerNumber('kMaxScale'))
    expect(MELT_TRAVEL_SHARE).toBe(headerNumber('kTravelShare'))
    expect(MELT_BLUR_GAIN).toBe(headerNumber('kBlurGain'))
    expect(MELT_DIM_DB_PER_SEC).toBe(headerNumber('kDimDbPerSecond'))
    expect(MELT_TURN_CENTS).toBe(headerNumber('kTurnCents'))
    expect(MELT_TIDE_SHARE).toBe(headerNumber('kTideShare'))
    expect(MELT_OWN_SHARE).toBe(headerNumber('kOwnShare'))
  })

  it('covers the oldest and the furthest a tail can get', () => {
    expect(MELT_AGE_MOST).toBe(params.solid.max / 1000 + params.hold.max)
    expect(MELT_CENTS_MOST).toBe(Math.max(-params.sag.min, params.sag.max) * params.hold.max)
  })
})

describe("melt's formulas, by hand", () => {
  it('slides by Sag for every second rung, and not before', () => {
    expect(meltCents(-30, 5)).toBe(-150)
    expect(meltCents(70, 8)).toBe(560)
    expect(meltCents(-100, 20)).toBe(-2000)
    expect(meltCents(-30, 0)).toBe(-0)
    expect(meltCents(-30, -0.5)).toBe(-0)
  })

  it('is 60 dB down after Hold', () => {
    expect(meltLevelDb(5, 5)).toBe(-60)
    expect(meltLevelDb(20, 5)).toBe(-15)
    expect(meltLevelDb(0.4, 0.1)).toBeCloseTo(-15, 9)
    expect(meltLevelDb(5, 0)).toBe(-0)
  })

  it('takes Dim off the highs of a sinking tail and the lows of a rising one', () => {
    // 36 dB a second at Dim 1, by the square of Dim: 36 x 0.16 at Dim 0.4.
    expect(meltColour(-30, 0.4).dark).toBeCloseTo(5.76, 9)
    expect(meltColour(-30, 0.4).thin).toBe(0)
    expect(meltColour(30, 0.4).thin).toBeCloseTo(5.76, 9)
    expect(meltColour(30, 0.4).dark).toBe(0)
    expect(meltColour(-100, 1)).toEqual({ dark: 36, thin: 0 })
    // Round Sag 0 the two cross-fade over ten cents a second either way.
    expect(meltColour(0, 1)).toEqual({ dark: 18, thin: 18 })
    expect(meltColour(-10, 1)).toEqual({ dark: 36, thin: 0 })
    expect(meltColour(5, 1).dark).toBeCloseTo(9, 9)
    expect(meltColour(5, 1).thin).toBeCloseTo(27, 9)
    expect(meltColour(-30, 0)).toEqual({ dark: 0, thin: 0 })
  })

  it('takes one trip round the network to be the mean line with its head half way and its allpass', () => {
    // The mean line is 57.7 ms and the mean allpass 10.6 ms. Size 0 scales the
    // lines by 0.45, Size 1 by 4.5; the head stands 0.2 of the line further on.
    expect(meltPassSec(0)).toBeCloseTo(0.0577 * 0.45 * 1.2 + 0.0106, 9)
    expect(meltPassSec(1)).toBeCloseTo(0.0577 * 4.5 * 1.2 + 0.0106, 9)
    expect(meltPassSec(0.5)).toBeCloseTo(0.0577 * Math.sqrt(0.45 * 4.5) * 1.2 + 0.0106, 9)
  })

  it('spreads a click by what one allpass does to it, pass after pass', () => {
    // An allpass of length M and gain g, as the kit's: v = x + g v[M], y = v[M] - g v.
    // The spread of its response about its mean delay, by its energy.
    const length = 16
    for (const gain of [0.2, 0.385, 0.7]) {
      const line = new Float64Array(length)
      let at = 0
      let energy = 0
      let first = 0
      let second = 0
      for (let n = 0; n < length * 400; n++) {
        const delayed = line[at]
        const v = (n === 0 ? 1 : 0) + gain * delayed
        line[at] = v
        at = (at + 1) % length
        const y = delayed - gain * v
        energy += y * y
        first += y * y * n
        second += y * y * n * n
      }
      const spread = Math.sqrt(second / energy - (first / energy) ** 2)
      expect(energy).toBeCloseTo(1, 9)
      expect(first / energy).toBeCloseTo(length, 6)
      expect(spread).toBeCloseTo(length * gain * Math.sqrt(2 / (1 - gain * gain)), 6)
    }
    // The display's: the mean allpass at Blur's gain, by the root of the passes made.
    const gain = 0.7 * 0.55
    const once = 0.0106 * gain * Math.sqrt(2 / (1 - gain * gain))
    expect(meltSmearSec(meltPassSec(0.35), 0.35, 0.55)).toBeCloseTo(once, 9)
    expect(meltSmearSec(4 * meltPassSec(0.35), 0.35, 0.55)).toBeCloseTo(2 * once, 9)
    expect(meltSmearSec(5, 0.35, 0)).toBe(0)
    expect(meltSmearSec(0, 0.35, 1)).toBe(0)
    // More passes in the same time at a small Size, so more smear.
    expect(meltSmearSec(3, 0, 0.5)).toBeGreaterThan(meltSmearSec(3, 1, 0.5))
  })

  it('lets Drip move the rate by its two drifts together, between none and twice', () => {
    expect(meltReach(0)).toBe(0)
    expect(meltReach(0.2)).toBeCloseTo(0.38, 9)
    expect(meltReach(0.5)).toBeCloseTo(0.95, 9)
    expect(meltReach(0.6)).toBe(1)
    expect(meltReach(1)).toBe(1)
  })
})

// --- The scales -----------------------------------------------------------------

describe("melt's scales", () => {
  it.each(SIZES)('run from end to end of the plot at $width by $height', (size) => {
    const plot = meltPlot(size)
    expect(meltX(plot, 0)).toBe(plot.x)
    expect(meltX(plot, MELT_AGE_MOST)).toBeCloseTo(plot.x + plot.w, 9)
    expect(meltY(plot, 0)).toBeCloseTo(plot.y + plot.h / 2, 9)
    expect(meltY(plot, MELT_CENTS_MOST)).toBeCloseTo(plot.y, 9)
    expect(meltY(plot, -MELT_CENTS_MOST)).toBeCloseTo(plot.y + plot.h, 9)
    // The plot leaves a point room to stand whole at every edge.
    expect(plot.x).toBeGreaterThanOrEqual(5)
    expect(plot.y).toBeGreaterThanOrEqual(5)
    expect(size.width - plot.x - plot.w).toBeGreaterThanOrEqual(5)
    expect(size.height - plot.y - plot.h).toBeGreaterThanOrEqual(5)
  })

  it('read back what they place, and never turn round', () => {
    const plot = meltPlot(STRIP)
    for (const age of [0, 0.05, 0.4, 1, 5.12, 20, 21]) {
      expect(meltAgeAt(plot, meltX(plot, age))).toBeCloseTo(age, 9)
    }
    for (const cents of [-2000, -1200, -150, -3, 0, 2, 40, 700, 2000]) {
      expect(meltCentsAt(plot, meltY(plot, cents))).toBeCloseTo(cents, 7)
    }
    for (let age = 0.25; age <= 21; age += 0.25) {
      expect(meltX(plot, age)).toBeGreaterThan(meltX(plot, age - 0.25))
    }
    for (let cents = -1950; cents <= 2000; cents += 50) {
      expect(meltY(plot, cents)).toBeLessThan(meltY(plot, cents - 50))
    }
  })

  it('give the first second and the first semitone room', () => {
    const plot = meltPlot(STRIP)
    // A second is a fortieth of the ages and a semitone a twentieth of the
    // pitches: on even scales neither would be a pixel or two.
    expect(meltX(plot, 1) - plot.x).toBeGreaterThan(plot.w * 0.25)
    expect(meltY(plot, 0) - meltY(plot, 100)).toBeGreaterThan(plot.h * 0.18)
    // The default tail's 150 cents is a third of the way down its half.
    expect(meltY(plot, -150) - meltY(plot, 0)).toBeGreaterThan(plot.h * 0.2)
  })

  it('draws a level by its dB down to the 60 that end the tail', () => {
    expect(meltShown(0)).toBe(1)
    expect(meltShown(-30)).toBe(0.5)
    expect(meltShown(-60)).toBe(0)
    expect(meltShown(-90)).toBe(0)
    expect(meltShown(6)).toBe(1)
  })

  it('widens the band by the smear up to its widest', () => {
    const plot = meltPlot(STRIP)
    expect(meltBand(plot, 0)).toBe(0)
    expect(meltBand(plot, MELT_SMEAR_FULL_SEC / 2)).toBeCloseTo((plot.h * MELT_BAND_SHARE) / 2, 9)
    expect(meltBand(plot, MELT_SMEAR_FULL_SEC)).toBeCloseTo(plot.h * MELT_BAND_SHARE, 9)
    expect(meltBand(plot, 1)).toBeCloseTo(plot.h * MELT_BAND_SHARE, 9)
    // Blur full and Hold at its default reach about the widest the band gets.
    expect(meltSmearSec(5, 0.35, 1)).toBeGreaterThan(MELT_SMEAR_FULL_SEC * 0.8)
  })

  it('lights a sound by its level over 54 dB', () => {
    expect(meltLit(0)).toBe(0)
    expect(meltLit(Math.pow(10, -6 / 20))).toBeCloseTo(1, 9)
    expect(meltLit(1)).toBe(1)
    expect(meltLit(Math.pow(10, -33 / 20))).toBeCloseTo(0.5, 9)
    expect(meltLit(Math.pow(10, -60 / 20))).toBeCloseTo(0, 9)
  })
})

// --- The handles ----------------------------------------------------------------

describe("melt's handles", () => {
  it('are the end of the tail and the corner where the melt starts', () => {
    const { all } = handlesAt({})
    expect(all.map((handle) => handle.key)).toEqual(['end', 'solid'])
    expect(all.map((handle) => handle.name)).toEqual(['Sag and Hold', 'Solid'])
  })

  it.each(SIZES)(
    'stand where the settings say at $width by $height, inside the picture',
    (size) => {
      const plot = meltPlot(size)
      for (const sag of [-100, -30, 0, 45, 100]) {
        for (const hold of [0.4, 5, 20]) {
          for (const solid of [0, 120, 1000]) {
            const { end, solid: corner } = handlesAt({ sag, hold, solid }, size)
            expect(end.x).toBeCloseTo(meltX(plot, solid / 1000 + hold), 9)
            expect(end.y).toBeCloseTo(meltY(plot, sag * hold), 9)
            expect(corner.x).toBeCloseTo(meltX(plot, solid / 1000), 9)
            expect(corner.y).toBeCloseTo(meltY(plot, 0), 9)
            for (const point of [end, corner]) {
              expect(point.x).toBeGreaterThanOrEqual(plot.x)
              expect(point.x).toBeLessThanOrEqual(plot.x + plot.w + 1e-9)
              expect(point.y).toBeGreaterThanOrEqual(plot.y - 1e-9)
              expect(point.y).toBeLessThanOrEqual(plot.y + plot.h + 1e-9)
            }
            // The two never stand on one another: the shortest Hold is still a point's width off.
            expect(end.x - corner.x).toBeGreaterThan(8)
          }
        }
      }
    },
  )

  it('the end: dragged to where a setting stands, it sets that setting', () => {
    for (const size of SIZES) {
      const plot = meltPlot(size)
      for (const solid of [0, 120, 1000]) {
        for (const hold of [0.4, 1.3, 5, 20]) {
          for (const sag of [-100, -45, -3, 0, 12, 100]) {
            const { end } = handlesAt({ solid }, size)
            const there = handlesAt({ sag, hold, solid }, size).end
            const got = end.drag(there.x, there.y, {})
            expect(Object.keys(got).sort()).toEqual(['hold', 'sag'])
            expect(got.hold).toBeCloseTo(hold, 6)
            expect(got.sag).toBeCloseTo(sag, 5)
          }
        }
      }
      expect(plot.w).toBeGreaterThan(0)
    }
  })

  it('the end: taken and not moved, nothing moves', () => {
    for (const values of cases([
      {},
      { sag: 37.5, hold: 0.9, solid: 430 },
      { sag: -100, hold: 20 },
    ])) {
      const { end } = handlesAt(values)
      const full = set(values)
      expect(end.drag(end.x, end.y, {})).toEqual({ sag: full.sag, hold: full.hold })
    }
  })

  it('the end: across is Hold and keeps the slide, up and down is Sag and keeps Hold', () => {
    const plot = meltPlot(STRIP)
    const { end } = handlesAt({})
    // Up and down alone: Hold stays, and the tail ends that many cents off.
    const up = end.drag(end.x, meltY(plot, 250), {})
    expect(up.hold).toBeCloseTo(5, 9)
    expect(up.sag).toBeCloseTo(50, 6)
    // Across alone: the tail still ends 150 cents down, later, so Sag is less.
    const later = end.drag(meltX(plot, 0.12 + 10), end.y, {})
    expect(later.hold).toBeCloseTo(10, 6)
    expect(later.sag).toBeCloseTo(-15, 6)
    expect(later.sag * later.hold).toBeCloseTo(-150, 5)
  })

  it('the end: past what the knobs reach it stops at their ends', () => {
    const plot = meltPlot(STRIP)
    const { end } = handlesAt({ solid: 500 })
    // Left of Solid's corner there is no tail: the shortest Hold.
    expect(end.drag(-40, end.y, {}).hold).toBe(params.hold.min)
    expect(end.drag(meltX(plot, 0.5), end.y, {}).hold).toBe(params.hold.min)
    // Far right is the longest Hold; far up and down the most Sag either way.
    expect(end.drag(900, end.y, {}).hold).toBe(params.hold.max)
    expect(end.drag(900, -50, {})).toEqual({ hold: 20, sag: 100 })
    expect(end.drag(900, 500, {})).toEqual({ hold: 20, sag: -100 })
    // A short tail asked to go further than Sag can take it in that time.
    const short = end.drag(meltX(plot, 0.5 + 1), meltY(plot, -1200), {})
    expect(short.hold).toBeCloseTo(1, 6)
    expect(short.sag).toBe(-100)
  })

  it('the corner: dragged to an age, Solid is that age, whatever the height', () => {
    for (const size of SIZES) {
      const plot = meltPlot(size)
      const { solid } = handlesAt({}, size)
      for (const ms of [0, 35, 120, 600, 1000]) {
        const got = solid.drag(meltX(plot, ms / 1000), 3, {})
        expect(Object.keys(got)).toEqual(['solid'])
        expect(got.solid).toBeCloseTo(ms, 6)
      }
      expect(solid.drag(solid.x, solid.y, {}).solid).toBeCloseTo(120, 9)
      expect(solid.drag(-30, 0, {}).solid).toBe(0)
      expect(solid.drag(meltX(plot, 4), 0, {}).solid).toBe(1000)
    }
  })

  it('a double press puts each back where the device starts', () => {
    const { end, solid } = handlesAt({ sag: 80, hold: 12, solid: 900 })
    expect(end.reset?.()).toEqual({ sag: -30, hold: 5 })
    expect(solid.reset?.()).toEqual({ solid: 120 })
  })
})

// --- The picture ----------------------------------------------------------------

describe("melt's picture", () => {
  it.each(SIZES)(
    'the line runs from the corner to the end by the device at $width by $height',
    (size) => {
      for (const values of cases([
        {},
        { sag: 70, hold: 8, solid: 250 },
        { sag: -100, hold: 20, solid: 0 },
      ])) {
        const full = set(values)
        const plot = meltPlot(size)
        const lines = linesOf(still({ ...values, dim: 0 }, size))
        const { end, solid } = handlesAt(values, size)
        expect(lines.length).toBeGreaterThanOrEqual(6)
        expect(lines[0].from[0]).toBeCloseTo(solid.x, 9)
        expect(lines[0].from[1]).toBeCloseTo(solid.y, 9)
        // The last stretches are 60 dB down and no longer drawn: the line stops short of the end by a stretch or two.
        const last = lines[lines.length - 1]
        expect(end.x - last.to[0]).toBeLessThan(8)
        expect(end.x - last.to[0]).toBeGreaterThanOrEqual(0)
        for (let n = 0; n < lines.length; n++) {
          if (n > 0) expect(lines[n].from).toEqual(lines[n - 1].to)
          const [x, y] = lines[n].to
          const rung = meltAgeAt(plot, x) - full.solid / 1000
          expect(y).toBeCloseTo(meltY(plot, meltCents(full.sag, rung)), 6)
        }
      }
    },
  )

  it('the line fades by the level of the highs, the band by the lows', () => {
    const plot = meltPlot(STRIP)
    for (const values of cases([
      { sag: -30, dim: 0.6, mix: 1 },
      { sag: 45, dim: 0.6, mix: 1 },
      { sag: -30, dim: 0, mix: 0.4 },
    ])) {
      const full = set(values)
      const colour = meltColour(full.sag, full.dim)
      const wet = Math.sin((full.mix * Math.PI) / 2)
      const shown = MELT_UNHEARD + (1 - MELT_UNHEARD) * wet
      const drawn = still(values)
      const lines = linesOf(drawn)
      const bands = bandsOf(drawn)
      expect(lines.length).toBeGreaterThan(4)
      expect(bands.length).toBeGreaterThan(4)
      for (const line of lines) {
        const rung = meltAgeAt(plot, (line.from[0] + line.to[0]) / 2) - full.solid / 1000
        const level = meltLevelDb(full.hold, rung)
        expect(line.alpha).toBeCloseTo(shown * meltShown(level - colour.dark * rung), 6)
      }
      for (const band of bands) {
        const rung = meltAgeAt(plot, (band.from[0] + band.to[0]) / 2) - full.solid / 1000
        const level = meltLevelDb(full.hold, rung)
        expect(band.alpha).toBeCloseTo(
          MELT_BAND_INK * shown * meltShown(level - colour.thin * rung),
          6,
        )
      }
    }
  })

  it('so a sinking tail loses its line first and a rising one its band', () => {
    const sinking = still({ sag: -30, dim: 0.8, hold: 10, blur: 1 })
    const rising = still({ sag: 30, dim: 0.8, hold: 10, blur: 1 })
    const reach = (ribbons: Ribbon[]): number => Math.max(...ribbons.map((ribbon) => ribbon.to[0]))
    expect(reach(linesOf(sinking))).toBeLessThan(reach(bandsOf(sinking)) - 20)
    expect(reach(bandsOf(rising))).toBeLessThan(reach(linesOf(rising)) - 20)
    // With Dim off both last as long as each other.
    const plain = still({ sag: -30, dim: 0, hold: 10, blur: 1 })
    expect(Math.abs(reach(linesOf(plain)) - reach(bandsOf(plain)))).toBeLessThan(4)
  })

  it('the band is as wide as the smear, and is not there with Blur at 0', () => {
    const plot = meltPlot(SIZES[2])
    for (const values of cases([
      { blur: 0.55, size: 0.35 },
      { blur: 1, size: 0 },
      { blur: 0.3, size: 1, hold: 20 },
    ])) {
      const full = set(values)
      const bands = bandsOf(still(values, SIZES[2]))
      expect(bands.length).toBeGreaterThan(4)
      for (const band of bands) {
        const rung = meltAgeAt(plot, band.to[0]) - full.solid / 1000
        expect(band.toHalf).toBeCloseTo(meltBand(plot, meltSmearSec(rung, full.size, full.blur)), 6)
      }
      // It grows with age and never past its widest.
      const widest = Math.max(...bands.map((band) => band.toHalf))
      expect(widest).toBeLessThanOrEqual(plot.h * MELT_BAND_SHARE + 1e-9)
      expect(bands[bands.length - 1].toHalf).toBeGreaterThan(bands[0].fromHalf)
    }
    expect(bandsOf(still({ blur: 0 }))).toEqual([])
    expect(linesOf(still({ blur: 0 })).length).toBeGreaterThan(4)
  })

  it.each(SIZES)('nothing of the tail leaves the display at $width by $height', (size) => {
    for (const values of cases([
      { sag: -100, hold: 20, blur: 1, size: 0, solid: 1000, drip: 1 },
      { sag: 100, hold: 20, blur: 1, size: 0, solid: 0, drip: 1 },
      { sag: 100, hold: 0.4, blur: 1, drip: 0.3 },
    ])) {
      const drawn = runDisplay(display, params, 0.2, {
        values: set(values),
        ...size,
        signal: testSignal(),
        meters: { wander: 1 },
      })
      for (const call of drawn.calls) {
        if (call.name !== 'moveTo' && call.name !== 'lineTo') continue
        const [x, y] = call.args as number[]
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(size.width)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(size.height)
      }
    }
  })

  it('Solid is a stretch at the played pitch, as long as Solid', () => {
    const plot = meltPlot(STRIP)
    const middle = meltY(plot, 0)
    const stretch = (values: Values) =>
      strokesOf(still(values)).filter(
        (stroke) =>
          stroke.width === 2 && near(stroke.from[1], middle) && near(stroke.to[1], middle),
      )
    for (const solid of [120, 600, 1000]) {
      const [drawn] = stretch({ solid })
      expect(drawn.from[0]).toBeCloseTo(plot.x, 9)
      expect(drawn.to[0]).toBeCloseTo(meltX(plot, solid / 1000), 9)
    }
    expect(stretch({ solid: 0 })).toEqual([])
  })

  it("Drip's reach is the two dotted lines the tail falls between", () => {
    const plot = meltPlot(STRIP)
    expect(dottedOf(still({ drip: 0 }))).toEqual([])
    expect(dottedOf(still({ drip: 0.5, sag: 0 }))).toEqual([])
    for (const values of cases([{ drip: 0.2 }, { drip: 0.4, sag: 60, hold: 3 }, { drip: 1 }])) {
      const full = set(values)
      const reach = meltReach(full.drip)
      const fan = dottedOf(still(values))
      expect(fan).toHaveLength(2)
      const ends = fan.map((line) => line[line.length - 1])
      const { end, solid } = handlesAt(values)
      for (const line of fan) {
        expect(line[0][0]).toBeCloseTo(solid.x, 9)
        expect(line[0][1]).toBeCloseTo(solid.y, 9)
        expect(line[line.length - 1][0]).toBeCloseTo(end.x, 9)
      }
      expect(ends[0][1]).toBeCloseTo(meltY(plot, full.sag * (1 - reach) * full.hold), 9)
      expect(ends[1][1]).toBeCloseTo(meltY(plot, full.sag * (1 + reach) * full.hold), 9)
    }
    // At Drip 1 the slow one stands still and the fast one falls twice as far.
    const flat = dottedOf(still({ drip: 1 }))[0]
    for (const point of flat) expect(point[1]).toBeCloseTo(meltY(plot, 0), 9)
  })

  it('the scale: the played pitch, a semitone and an octave either way, and 1, 5 and 20 seconds', () => {
    expect([...MELT_PITCH_MARKS]).toEqual([-1200, -100, 100, 1200])
    expect([...MELT_AGE_MARKS]).toEqual([1, 5, 20])
    for (const size of SIZES) {
      const plot = meltPlot(size)
      for (const sag of [-30, 0, 45]) {
        const strokes = strokesOf(still({ sag }, size))
        for (const cents of [...MELT_PITCH_MARKS, 0]) {
          const y = meltY(plot, cents)
          expect(
            strokes.some(
              (stroke) =>
                // A level rule is set on the pixel grid: within half a pixel of its place.
                near(stroke.from[1], y, 0.51) &&
                near(stroke.to[1], y, 0.51) &&
                near(stroke.from[0], plot.x) &&
                near(stroke.to[0], plot.x + plot.w),
            ),
          ).toBe(true)
        }
        // The seconds stand on the edge the tail heads for.
        const edge = sag > 0 ? plot.y : plot.y + plot.h
        for (const age of MELT_AGE_MARKS) {
          const x = meltX(plot, age)
          const tick = strokes.find(
            (stroke) =>
              near(stroke.from[0], x, 0.51) &&
              near(stroke.to[0], x, 0.51) &&
              stroke.from[1] !== stroke.to[1],
          )
          if (!tick) throw new Error(`no tick at ${age} s`)
          expect((tick.from[1] + tick.to[1]) / 2).toBeCloseTo(edge, 9)
        }
      }
    }
  })

  it('says how far the tail slides in how long, on a patch, on the side the tail leaves free', () => {
    const cases: [Values, string][] = [
      [{}, '−150 ct in 5.0 s'],
      [{ sag: 70, hold: 8 }, '+560 ct in 8.0 s'],
      [{ sag: 0, hold: 4 }, '0 ct in 4.0 s'],
      [{ sag: -100, hold: 20 }, '−2000 ct in 20 s'],
      [{ sag: -8, hold: 0.4 }, '−3 ct in 0.4 s'],
    ]
    for (const size of SIZES) {
      const plot = meltPlot(size)
      for (const [values, words] of cases) {
        const drawn = still(values, size)
        expect(drawn.words()).toEqual([words])
        const patch = patchUnder(drawn, words, PLAIN_COLOURS.plate)
        expect(patch).not.toBeNull()
        if (!patch) continue
        // A tail that lifts leaves the foot free, any other the top; the
        // seconds are ticked on the other edge, so no tick runs under a word.
        const lifts = set(values).sag > 0
        const middle = meltY(plot, 0)
        if (lifts) expect(patch.y).toBeGreaterThan(middle)
        else expect(patch.y + patch.h).toBeLessThan(middle)
        expect(patch.x + patch.w).toBeLessThanOrEqual(size.width)
        expect(patch.x).toBeGreaterThanOrEqual(0)
        expect(patch.y).toBeGreaterThanOrEqual(0)
        expect(patch.y + patch.h).toBeLessThanOrEqual(size.height)
        const tickEdge = lifts ? plot.y : plot.y + plot.h
        expect(Math.abs(tickEdge - (patch.y + patch.h / 2))).toBeGreaterThan(patch.h / 2 + 3)
      }
    }
  })

  it('says Solid while its corner is in hand', () => {
    expect(
      drawDisplay(display, params, { values: set({ solid: 600 }), hot: 'solid' }).words(),
    ).toEqual(['600 ms'])
    expect(
      drawDisplay(display, params, { values: set({ solid: 600 }), hot: 'end' }).words(),
    ).toEqual(['−150 ct in 5.0 s'])
  })

  it('writes at 8 px and no fainter than a word may be', () => {
    const drawn = still({})
    const fonts = drawn.calls
      .filter((call) => call.name === 'set font')
      .map((call) => String(call.args[0]))
    expect(fonts.length).toBeGreaterThan(0)
    for (const font of fonts) expect(parseFloat(font)).toBeGreaterThanOrEqual(8)
    let alpha = 1
    for (const call of drawn.calls) {
      if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
      if (call.name === 'fillText') expect(alpha).toBeGreaterThanOrEqual(TEXT_LEAST)
    }
  })

  it('draws only what Mix lets be heard, and still reads with Mix at 0', () => {
    const plot = meltPlot(STRIP)
    const dry = still({ mix: 0, dim: 0 })
    const wet = still({ mix: 1, dim: 0 })
    // The tail's shape is there at Mix 0, at the faintness of a thing not heard.
    expect(linesOf(dry).length).toBe(linesOf(wet).length)
    expect(linesOf(dry)[0].alpha).toBeCloseTo(MELT_UNHEARD * linesOf(wet)[0].alpha, 6)
    expect(linesOf(wet)[0].alpha).toBeGreaterThan(0.95)
    // The dry sound's mark at the left grows as Mix gives it room.
    const mark = (drawn: RecordingContext) => {
      const found = rectsOf(drawn).find((rect) => rect.colour === PLAIN_COLOURS.ink && rect.w === 2)
      if (!found) throw new Error('no mark for the dry sound')
      return found
    }
    expect(mark(dry).h).toBeCloseTo(2 * (2 + plot.h * MELT_DRY_SHARE), 9)
    expect(mark(wet).h).toBeCloseTo(4, 6)
    expect(mark(dry).y + mark(dry).h / 2).toBeCloseTo(meltY(plot, 0), 9)
    // Nothing of the tail is lit at Mix 0, however loud the sound.
    const loud = { signal: testSignal(0.9, 0.9), meters: { wander: 0 }, ...STRIP }
    expect(litOf(runDisplay(display, params, 3, { values: set({ mix: 0 }), ...loud }))).toEqual([])
    expect(
      litOf(runDisplay(display, params, 3, { values: set({ mix: 1 }), ...loud })).length,
    ).toBeGreaterThan(4)
  })
})

// --- What moves -----------------------------------------------------------------

describe("melt's moving part", () => {
  const quiet = testSignal(0, 0)
  const loud = testSignal(0.5, 0.5)
  /** The level `loud` brings in, as the display reads it. */
  const loudRms = 0.5 / Math.SQRT2

  it('reads the level the test brings in', () => {
    expect(loud.input?.rms).toBeCloseTo(loudRms, 9)
    expect(quiet.input?.rms).toBe(0)
  })

  it('declares the reading it follows', () => {
    expect(Object.keys(MELT_METERS)).toEqual(['wander'])
    expect(MELT_METERS.wander.id).toBe(0)
    expect(display.live?.meters).toBe(true)
    expect(display.live?.signal).toBe(true)
  })

  it('lights each stretch by the sound that came in that long ago', () => {
    // Two seconds of sound, then three of silence: what is in the tail now came in three to five seconds ago.
    const plot = meltPlot(STRIP)
    const values = set({ hold: 20, solid: 0, mix: 1, dim: 0 })
    const drawn = runDisplay(
      display,
      params,
      5,
      { values, ...STRIP, meters: { wander: 0 } },
      (time) => ({ signal: time < 2 ? loud : quiet }),
    )
    const lit = litOf(drawn)
    expect(lit.length).toBeGreaterThan(3)
    for (const stretch of lit) {
      const age = meltAgeAt(plot, (stretch.from[0] + stretch.to[0]) / 2)
      expect(age).toBeGreaterThan(2.9)
      expect(age).toBeLessThan(5.15)
      expect(near(stretch.fromHalf, MELT_LIT_HALF)).toBe(true)
      // As loud as the tail still has it: what came in, less Hold's fall over its age.
      const level = loudRms * Math.pow(10, meltLevelDb(20, age) / 20)
      expect(stretch.alpha).toBeCloseTo(meltLit(level) * meltShown(meltLevelDb(20, age)), 1)
    }
    // And the lit stretches cover that span, not a corner of it.
    const ages = lit.map((stretch) => meltAgeAt(plot, (stretch.from[0] + stretch.to[0]) / 2))
    expect(Math.min(...ages)).toBeLessThan(3.4)
    expect(Math.max(...ages)).toBeGreaterThan(4.5)
  })

  it('lights the dry mark by the sound coming in now, as much as Mix leaves of it', () => {
    const mark = (mix: number, signal = loud) =>
      rectsOf(
        runDisplay(display, params, 0.2, { values: set({ mix }), signal, meters: { wander: 0 } }),
      ).filter((rect) => rect.colour === PLAIN_COLOURS.accent && rect.w === 2)
    expect(mark(0)[0].alpha).toBeCloseTo(meltLit(loudRms), 6)
    expect(mark(0.5)[0].alpha).toBeCloseTo(meltLit(loudRms) * Math.SQRT1_2, 6)
    expect(mark(1)).toEqual([])
    expect(mark(0, quiet)).toEqual([])
  })

  it('is dark with the device off', () => {
    const drawn = runDisplay(display, params, 3, {
      values: set({ mix: 1 }),
      ...STRIP,
      signal: loud,
      meters: { wander: 0.5 },
      powered: false,
    })
    expect(litOf(drawn)).toEqual([])
    expect(rectsOf(drawn).filter((rect) => rect.colour === PLAIN_COLOURS.accent)).toEqual([])
    // And the line is the one the settings draw.
    const plot = meltPlot(STRIP)
    for (const line of linesOf(drawn)) {
      expect(line.to[1]).toBeCloseTo(
        meltY(plot, meltCents(-30, meltAgeAt(plot, line.to[0]) - 0.12)),
        6,
      )
    }
  })

  it("bends the line by the rate the device reads out, summed over the sound's age", () => {
    const plot = meltPlot(SIZES[2])
    const values = set({ sag: -60, hold: 20, solid: 0, drip: 1, dim: 0 })
    // The rate at half of Sag for four seconds: a sound that old has slid
    // half as far, and an older one that far and then at Sag's own rate.
    const half = runDisplay(display, params, 4, {
      values,
      ...SIZES[2],
      signal: loud,
      meters: { wander: -0.5 },
    })
    for (const line of linesOf(half)) {
      const rung = meltAgeAt(plot, line.to[0])
      const slid = rung <= 4 ? rung * 0.5 : 2 + (rung - 4)
      expect(meltCentsAt(plot, line.to[1])).toBeCloseTo(-60 * slid, -0.6)
      expect(Math.abs(meltCentsAt(plot, line.to[1]) + 60 * slid)).toBeLessThan(0.03 * 60 * rung + 1)
    }
    // Stalled, then running twice as fast: two seconds of nothing, then two at double.
    const fits = runDisplay(display, params, 4, { values, ...SIZES[2], signal: loud }, (time) => ({
      meters: { wander: time < 2 ? -1 : 1 },
    }))
    for (const line of linesOf(fits)) {
      const rung = meltAgeAt(plot, line.to[0])
      const slid = rung <= 2 ? rung * 2 : rung <= 4 ? 4 : 4 + (rung - 4)
      expect(Math.abs(meltCentsAt(plot, line.to[1]) + 60 * slid)).toBeLessThan(0.03 * 60 * rung + 8)
    }
    // A reading of nothing is Sag as set: the still picture.
    const steady = runDisplay(display, params, 4, {
      values,
      ...SIZES[2],
      signal: loud,
      meters: { wander: 0 },
    })
    for (const line of linesOf(steady)) {
      expect(meltCentsAt(plot, line.to[1])).toBeCloseTo(-60 * meltAgeAt(plot, line.to[0]), 3)
    }
  })

  it('keeps its handles where the settings put them while the line moves', () => {
    const view = viewOf(display, params, { values: set({ drip: 1 }), ...STRIP })
    const before = display.handles?.(view).map((handle) => [handle.x, handle.y])
    runDisplay(display, params, 2, {
      values: set({ drip: 1 }),
      ...STRIP,
      signal: loud,
      meters: { wander: 0.8 },
    })
    expect(display.handles?.(view).map((handle) => [handle.x, handle.y])).toEqual(before)
  })
})

// --- The device itself ------------------------------------------------------------

async function device(values: Values): Promise<WasmDeviceHarness> {
  const loaded = await loadWasmDevice('melt', RATE)
  for (const [name, value] of Object.entries(set(values))) {
    loaded.set(params[name as keyof typeof params], value)
  }
  return loaded
}

const BURST_SEC = 0.3

/** A burst with soft ends: a tone, or noise round `hz` when `noise` is set. */
function burst(hz: number, noise: boolean): Float32Array {
  const length = Math.round(BURST_SEC * RATE)
  const wave = new Float32Array(length)
  let seed = 12345
  let low = 0
  let band = 0
  const f = 2 * Math.sin((Math.PI * hz) / RATE)
  for (let i = 0; i < length; i++) {
    const edge = Math.min(1, i / 480, (length - 1 - i) / 480)
    const shape = 0.5 - 0.5 * Math.cos(Math.PI * edge)
    if (noise) {
      seed = (seed * 1664525 + 1013904223) >>> 0
      const white = seed / 2147483648 - 1
      // A two-pole band round hz, a third of an octave or so wide.
      low += f * band
      band += f * (white - low - 0.3 * band)
      wave[i] = 0.5 * shape * band
    } else {
      wave[i] = 0.5 * shape * Math.sin((2 * Math.PI * hz * i) / RATE)
    }
  }
  return wave
}

/** Play a burst and then silence; the two channels of what came out, and a reading of the meter every block. */
function ring(loaded: WasmDeviceHarness, sound: Float32Array, seconds: number) {
  const total = Math.round(seconds * RATE)
  const left = new Float32Array(total)
  const right = new Float32Array(total)
  const meter: number[] = []
  const block = new Float32Array(128)
  for (let done = 0; done < total; done += 128) {
    const frames = Math.min(128, total - done)
    for (let i = 0; i < frames; i++) block[i] = done + i < sound.length ? sound[done + i] : 0
    loaded.processBlock(block.subarray(0, frames))
    left.set(loaded.view(loaded.device.device_out_left(), frames), done)
    right.set(loaded.view(loaded.device.device_out_right(), frames), done)
    meter.push(loaded.device.device_meter?.(MELT_METERS.wander.id) ?? NaN)
  }
  return { left, right, meter }
}

/** A wave through the burst's own band twice over, so what lies outside the band is not counted. */
function bandOf(wave: Float32Array, hz: number): Float32Array {
  const f = 2 * Math.sin((Math.PI * hz) / RATE)
  let from = wave
  for (let pass = 0; pass < 2; pass++) {
    const to = new Float32Array(from.length)
    let low = 0
    let band = 0
    for (let i = 0; i < from.length; i++) {
      low += f * band
      band += f * (from[i] - low - 0.3 * band)
      to[i] = band
    }
    from = to
  }
  return from
}

/** The power of both channels over a window, in dB: all of it, or what lies in the band round `hz`. */
function powerDb(
  out: { left: Float32Array; right: Float32Array },
  fromSec: number,
  sec: number,
  hz?: number,
) {
  const left = hz === undefined ? out.left : bandOf(out.left, hz)
  const right = hz === undefined ? out.right : bandOf(out.right, hz)
  const from = Math.round(fromSec * RATE)
  const length = Math.round(sec * RATE)
  let sum = 0
  for (let i = from; i < from + length; i++) sum += left[i] ** 2 + right[i] ** 2
  return 10 * Math.log10(sum / (2 * length) + 1e-30)
}

/**
 * Where a tone's power lies over a window, in cents from `hz`: the strongest
 * of a comb of frequencies five cents apart, and the centre of the power
 * within 150 cents of it.
 */
function centreCents(wave: Float32Array, fromSec: number, sec: number, hz: number): number {
  const from = Math.round(fromSec * RATE)
  const length = Math.round(sec * RATE)
  const power: number[] = []
  const cents: number[] = []
  for (let c = -900; c <= 900; c += 5) {
    const w = (2 * Math.PI * hz * Math.pow(2, c / 1200)) / RATE
    // Goertzel over a Hann window.
    const coefficient = 2 * Math.cos(w)
    let s1 = 0
    let s2 = 0
    for (let i = 0; i < length; i++) {
      const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / length)
      const s0 = wave[from + i] * window + coefficient * s1 - s2
      s2 = s1
      s1 = s0
    }
    power.push(s1 * s1 + s2 * s2 - coefficient * s1 * s2)
    cents.push(c)
  }
  const peak = power.indexOf(Math.max(...power))
  let sum = 0
  let weight = 0
  for (let n = Math.max(0, peak - 30); n <= Math.min(power.length - 1, peak + 30); n++) {
    sum += power[n] * cents[n]
    weight += power[n]
  }
  return sum / weight
}

describe('the compiled device does what the picture says', () => {
  it('the tail is as far off pitch as the line stands, at every age', async () => {
    // A tone goes in and Mix is 1: the tail alone, read half a second at a
    // time. Both channels, since each hears two of the four lines.
    for (const sag of [-60, 45, 0]) {
      const out = ring(
        await device({ sag, hold: 8, solid: 0, drip: 0, dim: 0, mix: 1 }),
        burst(440, false),
        5,
      )
      for (const age of [1, 2, 3, 4]) {
        // The window's middle is `age` after the burst's.
        const from = BURST_SEC / 2 + age - 0.25
        const heard =
          (centreCents(out.left, from, 0.5, 440) + centreCents(out.right, from, 0.5, 440)) / 2
        expect(Math.abs(heard - meltCents(sag, age))).toBeLessThan(25)
      }
    }
  }, 120000)

  it('Solid holds the melt back: no tail before it, and the slide counted from it', async () => {
    const out = ring(
      await device({ sag: -60, hold: 8, solid: 1000, drip: 0, dim: 0, mix: 1 }),
      burst(440, false),
      4.5,
    )
    // Nothing at all comes out for the first second.
    expect(powerDb(out, 0, 0.95)).toBeLessThan(-200)
    expect(powerDb(out, 1.0, 0.5)).toBeGreaterThan(-60)
    // Three seconds after the burst the tail has rung for two.
    const from = BURST_SEC / 2 + 3 - 0.25
    const heard =
      (centreCents(out.left, from, 0.5, 440) + centreCents(out.right, from, 0.5, 440)) / 2
    expect(Math.abs(heard - meltCents(-60, 3 - 1))).toBeLessThan(25)
  }, 120000)

  it('the tail falls 60 dB in Hold, whichever way it slides', async () => {
    for (const [sag, hold] of [
      [-30, 5],
      [45, 5],
      [0, 2],
      [-30, 12],
    ]) {
      const out = ring(
        await device({ sag, hold, solid: 0, drip: 0, dim: 0, mix: 1 }),
        burst(700, true),
        hold * 0.8 + 1,
      )
      // From a tenth of Hold to seven tenths of it: the line says 36 dB.
      const window = Math.min(0.5, hold * 0.1)
      const early = powerDb(out, BURST_SEC / 2 + hold * 0.1, window)
      const late = powerDb(out, BURST_SEC / 2 + hold * 0.7, window)
      const said = meltLevelDb(hold, hold * 0.7) - meltLevelDb(hold, hold * 0.1)
      expect(said).toBeCloseTo(-36, 9)
      expect(Math.abs(late - early - said)).toBeLessThan(6)
    }
  }, 120000)

  it("Dim takes the picture's dB a second off the highs of a sinking tail, and off the lows of a rising one", async () => {
    // The same band of noise with Dim on and off: how much faster it falls.
    const fall = async (sag: number, dim: number, hz: number): Promise<number> => {
      const out = ring(
        await device({ sag, hold: 8, solid: 0, drip: 0, dim, blur: 0.3, mix: 1 }),
        burst(hz, true),
        3.6,
      )
      const fell =
        (powerDb(out, BURST_SEC / 2 + 2.5, 0.8, hz) - powerDb(out, BURST_SEC / 2 + 0.5, 0.8, hz)) /
        2
      return fell
    }
    const dim = 0.5
    const said = meltColour(-30, dim).dark
    expect(said).toBeCloseTo(9, 9)
    expect(meltColour(30, dim).thin).toBeCloseTo(9, 9)
    // Sinking: the highs go, the lows stay.
    const highsSinking = (await fall(-30, 0, 6000)) - (await fall(-30, dim, 6000))
    const lowsSinking = (await fall(-30, 0, 120)) - (await fall(-30, dim, 120))
    expect(Math.abs(highsSinking - said)).toBeLessThan(0.3 * said)
    expect(Math.abs(lowsSinking)).toBeLessThan(1.5)
    // Rising: the lows go, the highs stay.
    const lowsRising = (await fall(30, 0, 120)) - (await fall(30, dim, 120))
    const highsRising = (await fall(30, 0, 6000)) - (await fall(30, dim, 6000))
    expect(Math.abs(lowsRising - said)).toBeLessThan(0.3 * said)
    expect(Math.abs(highsRising)).toBeLessThan(1.5)
  }, 120000)

  it('the reading is how far the rate is off Sag: nothing without Drip, within its reach with it, and at rest asleep', async () => {
    const sound = burst(440, true)
    const without = ring(await device({ drip: 0, hold: 20 }), sound, 6)
    for (const reading of without.meter) expect(reading).toBe(0)
    for (const drip of [0.2, 1]) {
      const reach = meltReach(drip)
      const out = ring(await device({ drip, hold: 20 }), sound, 40)
      const lowest = Math.min(...out.meter)
      const highest = Math.max(...out.meter)
      // Never past the lines the picture dots, and near them some of the time.
      expect(lowest).toBeGreaterThanOrEqual(-reach - 1e-6)
      expect(highest).toBeLessThanOrEqual(reach + 1e-6)
      expect(lowest).toBeLessThan(-0.4 * reach)
      expect(highest).toBeGreaterThan(0.4 * reach)
    }
    // Rung out and asleep, it reads nothing, which is what the display takes for Sag as set.
    const slept = ring(await device({ drip: 1, hold: 0.4, solid: 0 }), sound, 6)
    expect(slept.meter[slept.meter.length - 1]).toBe(0)
    expect(Math.max(...slept.meter.map(Math.abs))).toBeGreaterThan(0)
  }, 120000)

  it("the picture drawn from the device's own readings is where the tail was heard to be", async () => {
    // Drip at 1, a tone in, the meter read thirty times a second into the
    // display as the plate does. Where the display puts a sound three seconds
    // old is where that sound is heard: within 30 cents of 180 or so.
    const values = { sag: -60, hold: 12, solid: 0, drip: 1, dim: 0, mix: 1 }
    const out = ring(await device(values), burst(440, false), 3.6)
    const perSec = RATE / 128
    const drawn = runDisplay(
      display,
      params,
      BURST_SEC / 2 + 3,
      { values: set(values), ...SIZES[2], signal: testSignal(0.5, 0.5) },
      (time) => ({
        meters: { wander: out.meter[Math.min(out.meter.length - 1, Math.floor(time * perSec))] },
      }),
    )
    const plot = meltPlot(SIZES[2])
    const lines = linesOf(drawn)
    const at = lines.reduce((best, line) =>
      Math.abs(meltAgeAt(plot, line.to[0]) - 3) < Math.abs(meltAgeAt(plot, best.to[0]) - 3)
        ? line
        : best,
    )
    const rung = meltAgeAt(plot, at.to[0])
    expect(Math.abs(rung - 3)).toBeLessThan(0.2)
    const shownCents = meltCentsAt(plot, at.to[1])
    const from = BURST_SEC / 2 + rung - 0.25
    const heard =
      (centreCents(out.left, from, 0.5, 440) + centreCents(out.right, from, 0.5, 440)) / 2
    expect(Math.abs(heard - shownCents)).toBeLessThan(30)
    // And Drip did move it: the reading was not nothing over those seconds.
    expect(Math.max(...out.meter.map(Math.abs))).toBeGreaterThan(0.2)
  }, 120000)
})
