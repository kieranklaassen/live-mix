// The display of Common Tones against the device it shows: the gain, the
// leeway and the floor are checked against the numbers `common_tones.h`
// gives (cpp/devices/common-tones/), each handle against the parameter it
// sets, and what is drawn from the device's readings against the readings.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  COMMON_TONES_FACES,
  TONES_BANDS,
  TONES_EXAMPLE_NOW_DB,
  TONES_EXAMPLE_THEN_DB,
  TONES_FOOT_DB,
  TONES_GAUGE_DB,
  TONES_HIGH_HZ,
  TONES_LOW_HZ,
  TONES_MAX_LEEWAY_DB,
  TONES_TOP_DB,
  tonesAgoAt,
  tonesAgoText,
  tonesBandX,
  tonesExample,
  tonesFloorGain,
  tonesGain,
  tonesLayout,
  tonesLeewayDb,
} from '../components/displays/common-tones'
import { type DisplayHandle } from '../components/plate-display'
import {
  drawDisplay,
  metersOf,
  patchUnder,
  runDisplay,
  stockDescriptors,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const descriptor = stockDescriptors().get('common-tones')
if (!descriptor) throw new Error('common-tones is not a stock device')
const display = COMMON_TONES_FACES['common-tones'].display
const params = descriptor.params
const quiet = metersOf(descriptor.meters)
const { accent: ACCENT, ink: INK, plate: PLATE } = PLAIN_COLOURS

/** The window on a plate lying flat, and on one standing upright. */
const FLAT = { width: 128, height: 100 }
const UPRIGHT = { width: 204, height: 100 }

interface Rect {
  colour: string
  alpha: number
  x: number
  y: number
  w: number
  h: number
}

/** Every rectangle a drawing filled, with its colour and how strongly it was laid. */
function rectsOf(drawn: RecordingContext): Rect[] {
  const rects: Rect[] = []
  let colour = ''
  let alpha = 1
  for (const { name, args } of drawn.calls) {
    if (name === 'set fillStyle') colour = String(args[0])
    else if (name === 'set globalAlpha') alpha = Number(args[0])
    else if (name === 'fillRect') {
      const [x, y, w, h] = args as number[]
      rects.push({ colour, alpha, x, y, w, h })
    }
  }
  return rects
}

function handleOf(key: string, options: FrameOptions = {}): DisplayHandle {
  const found = display.handles?.(viewOf(display, params, options)).find((h) => h.key === key)
  if (!found) throw new Error(`no handle ${key}`)
  return found
}

/** Where a level stands on the display's scale: -6 dB at the top of the bands (17), -66 at their foot. */
const yOf = (db: number, height = 100): number => 17 + ((TONES_TOP_DB - db) / 60) * (height - 21)
const db = (gain: number): number => 20 * Math.log10(gain)

/** The marks of one band: what was filled between its edges, inside the bands' box. */
function bandOf(drawn: RecordingContext, band: number, size = FLAT): Rect[] {
  const { box } = tonesLayout(size)
  const [left, right] = tonesBandX(band, box)
  return rectsOf(drawn).filter(
    (rect) => rect.x === left && rect.w === right - left && rect.y >= box.y - 0.01,
  )
}

/** The device running for two seconds with these readings, the rest at nothing. */
const running = (
  readings: Record<string, number>,
  values: Record<string, number> = {},
  size = FLAT,
): RecordingContext =>
  runDisplay(display, params, 2, { ...size, values, meters: { ...quiet, ...readings } })

describe('Common Tones: the device', () => {
  it('reports 24 third octaves from 62.5 Hz, three levels each', () => {
    // common_tones.h: kBands = 24, kBandLowHz = 62.5, kMeters = 3 * kBands.
    expect(TONES_BANDS).toBe(24)
    expect(TONES_LOW_HZ).toBe(62.5)
    expect(TONES_HIGH_HZ).toBeCloseTo(16000, 6)
    const names = Object.keys(descriptor.meters ?? {})
    expect(names).toHaveLength(72)
    for (let band = 1; band <= 24; band++) {
      expect(names).toContain(`now${band}`)
      expect(names).toContain(`then${band}`)
      expect(names).toContain(`heard${band}`)
    }
  })

  it('gives 24 dB of leeway at Strict 0 and none at 1', () => {
    // apply(kStrict): leeway = 10^(0.1 × kMaxLeewayDb × (1 − strict)), kMaxLeewayDb = 24.
    expect(TONES_MAX_LEEWAY_DB).toBe(24)
    expect(tonesLeewayDb(0)).toBe(24)
    expect(tonesLeewayDb(0.6)).toBeCloseTo(9.6, 6)
    expect(tonesLeewayDb(1)).toBe(0)
    expect(tonesLeewayDb(7)).toBe(0)
  })

  it('takes the bottom of Floor for nothing at all', () => {
    // apply(kFloor): param <= min + 0.01 ? 0 : 10^(param / 20).
    expect(tonesFloorGain(-48)).toBe(0)
    expect(tonesFloorGain(-47.995)).toBe(0)
    expect(tonesFloorGain(-40)).toBeCloseTo(0.01, 6)
    expect(tonesFloorGain(-6)).toBeCloseTo(0.5012, 4)
    expect(tonesFloorGain(0)).toBe(1)
    expect(tonesFloorGain(-48, descriptor.params.floor.min)).toBe(0)
  })

  it('lets a bin through whole inside the leeway and 2 dB down for every dB past it', () => {
    // frame(): common = a > limit ? limit / a : 1, with a = now², limit = leeway × then².
    const then = 0.1
    const up = (dbOver: number): number => then * Math.pow(10, dbOver / 20)
    expect(tonesGain(then, then, 0.6, false, 0)).toBe(1)
    expect(tonesGain(up(9.5), then, 0.6, false, 0)).toBe(1)
    expect(db(tonesGain(up(9.6 + 3), then, 0.6, false, 0))).toBeCloseTo(-6, 4)
    expect(db(tonesGain(up(9.6 + 10), then, 0.6, false, 0))).toBeCloseTo(-20, 4)
    expect(db(tonesGain(up(5), then, 1, false, 0))).toBeCloseTo(-10, 4)
    expect(tonesGain(up(24), then, 0, false, 0)).toBeCloseTo(1, 6)
    // A sound that was not there at all is not let through, and one that has gone is.
    expect(tonesGain(0.3, 0, 0.6, false, 0)).toBe(0)
    expect(tonesGain(0, 0.3, 0.6, false, 0)).toBe(1)
  })

  it('makes Changes what Common leaves, and Floor the gain of what is turned down', () => {
    // frame(): share = common + side × (1 − 2 × common); gain = floor + (1 − floor) × share.
    for (const [now, then, strict] of [
      [0.2, 0.1, 0.9],
      [0.5, 0.01, 0.3],
      [0.1, 0.1, 0.6],
    ]) {
      const common = tonesGain(now, then, strict, false, 0)
      expect(tonesGain(now, then, strict, true, 0)).toBeCloseTo(1 - common, 9)
      expect(tonesGain(now, then, strict, false, 0.25)).toBeCloseTo(0.25 + 0.75 * common, 9)
      expect(tonesGain(now, then, strict, true, 0.25)).toBeCloseTo(1 - 0.75 * common, 9)
      expect(tonesGain(now, then, strict, false, 1)).toBe(1)
    }
  })

  it('works its example through the same gain', () => {
    const floorGain = tonesFloorGain(-20)
    for (const changes of [false, true]) {
      const example = tonesExample(0.6, changes, floorGain)
      for (let band = 0; band < TONES_BANDS; band++) {
        const now = Math.pow(10, TONES_EXAMPLE_NOW_DB[band] / 20)
        const then = Math.pow(10, TONES_EXAMPLE_THEN_DB[band] / 20)
        expect(example[band]).toBeCloseTo(now, 6)
        expect(example[TONES_BANDS + band]).toBeCloseTo(then, 6)
        expect(example[2 * TONES_BANDS + band]).toBeCloseTo(
          now * tonesGain(now, then, 0.6, changes, floorGain),
          6,
        )
      }
    }
    // The held note (band 3) is the same then and now, the note that has begun (band 12) was not there.
    expect(TONES_EXAMPLE_NOW_DB[2]).toBe(TONES_EXAMPLE_THEN_DB[2])
    expect(TONES_EXAMPLE_NOW_DB[11] - TONES_EXAMPLE_THEN_DB[11]).toBe(24)
    const common = tonesExample(0.6, false, 0)
    const fresh = tonesExample(0.6, true, 0)
    expect(db(common[48 + 2])).toBeCloseTo(-12, 4)
    expect(fresh[48 + 2]).toBe(0)
    // 24 dB over a past with 9.6 dB of leeway: 14.4 dB past it, so 28.8 dB down.
    expect(db(common[48 + 11])).toBeCloseTo(-14 - 28.8, 3)
    expect(db(fresh[48 + 11])).toBeCloseTo(-14 + db(1 - Math.pow(10, -28.8 / 20)), 3)
  })
})

describe('Common Tones: the picture', () => {
  it('draws each band between its own edges, on a scale of 60 dB from half of full scale', () => {
    for (const size of [FLAT, UPRIGHT]) {
      const { box } = tonesLayout(size)
      expect(box).toEqual({ x: 4, y: 17, w: size.width - 19, h: 79 })
      let last = box.x - 1
      for (let band = 0; band < TONES_BANDS; band++) {
        const [left, right] = tonesBandX(band, box)
        // Whole pixels, a pixel of ground between bands, and each within half a pixel of its third octave.
        expect(Number.isInteger(left) && Number.isInteger(right)).toBe(true)
        expect(left).toBeGreaterThanOrEqual(last + 1)
        expect(right - left).toBeGreaterThanOrEqual(3)
        const hz = TONES_LOW_HZ * Math.pow(2, band / 3)
        const exact =
          box.x + (Math.log(hz / TONES_LOW_HZ) / Math.log(TONES_HIGH_HZ / TONES_LOW_HZ)) * box.w
        expect(Math.abs(left - exact)).toBeLessThanOrEqual(0.5)
        last = right
      }
      expect(last).toBeLessThanOrEqual(box.x + box.w)
    }
  })

  it('stands the three readings of a band where the device says they are', () => {
    // Band 13 (1 to 1.26 kHz): now 0.5, then 0.1, let through 0.25, at Mix 0.7 and Strict 0.6.
    for (const size of [FLAT, UPRIGHT]) {
      const drawn = running({ now13: 0.5, then13: 0.1, heard13: 0.25 }, {}, size)
      const marks = bandOf(drawn, 12, size)
      const now = marks.find(
        (rect) => rect.colour === INK && rect.alpha < 0.3 && rect.y + rect.h === 96,
      )
      expect(now?.y).toBeCloseTo(yOf(db(0.5)), 1)
      // What is let through, as loud as Mix leaves it, in the second colour.
      const through = marks.find((rect) => rect.colour === ACCENT)
      expect(through?.y).toBeCloseTo(yOf(db(0.25 * 0.7)), 1)
      expect(through && through.y + through.h).toBe(96)
      expect(through?.alpha).toBeCloseTo(0.9, 6)
      // The mark of then, a pixel high, and the leeway over it: 9.6 dB.
      const then = marks.find((rect) => rect.colour === INK && rect.alpha === 1 && rect.h === 1)
      expect(Math.abs((then?.y ?? 0) + 0.5 - yOf(-20))).toBeLessThanOrEqual(1)
      const shade = marks.find((rect) => rect.colour === INK && rect.y + rect.h < 90 && rect.h > 1)
      expect(shade?.y).toBeCloseTo(yOf(-20 + 9.6), 1)
      expect(shade && shade.y + shade.h).toBeCloseTo(yOf(-20), 1)
      // A band that reads nothing has nothing in it.
      expect(bandOf(drawn, 5, size)).toHaveLength(0)
    }
  })

  it('draws what is let through only as far as Mix lets it be heard', () => {
    const readings = { now13: 0.5, then13: 0.5, heard13: 0.5 }
    const through = (mix: number): Rect | undefined =>
      bandOf(running(readings, { mix }), 12).find((rect) => rect.colour === ACCENT)
    expect(through(1)?.y).toBeCloseTo(yOf(db(0.5)), 1)
    expect(through(0.5)?.y).toBeCloseTo(yOf(db(0.25)), 1)
    expect(through(0.1)?.y).toBeCloseTo(yOf(db(0.05)), 1)
    // With none of it in the mix the sound that came in is still drawn, and nothing the device does.
    const dry = bandOf(running(readings, { mix: 0 }), 12)
    expect(dry).toHaveLength(1)
    expect(dry[0].colour).toBe(INK)
    expect(dry[0].y).toBeCloseTo(yOf(db(0.5)), 1)
    // At rest there is then no example of what the settings would do: they would do nothing.
    const rest = drawDisplay(display, params, { values: { mix: 0 }, meters: quiet })
    for (let band = 0; band < TONES_BANDS; band++) expect(bandOf(rest, band)).toHaveLength(0)
  })

  it('keeps a reading that is not a level out of the picture', () => {
    for (const reading of [-6, Number.NaN, Number.POSITIVE_INFINITY, 1e9]) {
      const drawn = running({ now13: reading, then13: reading, heard13: reading })
      for (const rect of rectsOf(drawn)) {
        expect(Number.isFinite(rect.y) && Number.isFinite(rect.h)).toBe(true)
        expect(rect.y).toBeGreaterThanOrEqual(0)
        expect(rect.y + rect.h).toBeLessThanOrEqual(100)
      }
    }
  })

  it('shows a worked example at rest, in the ink, and the readings in the second colour', () => {
    const rest = drawDisplay(display, params, { meters: quiet })
    expect(rectsOf(rest).filter((rect) => rect.colour === ACCENT)).toHaveLength(0)
    const example = tonesExample(0.6, false, 0)
    for (const band of [2, 10, 11]) {
      const marks = bandOf(rest, band)
      const through = marks.find((rect) => rect.colour === INK && rect.alpha === 0.55)
      expect(through?.y).toBeCloseTo(yOf(Math.max(TONES_FOOT_DB, db(example[48 + band] * 0.7))), 1)
      const now = marks.find(
        (rect) => rect.colour === INK && rect.alpha < 0.3 && rect.y + rect.h === 96,
      )
      expect(now?.y).toBeCloseTo(yOf(TONES_EXAMPLE_NOW_DB[band]), 1)
    }
    // The same picture whenever it is drawn, and the same switched off.
    const later = drawDisplay(display, params, { meters: quiet, now: 73.4 })
    expect(later.print()).toBe(rest.print())
    expect(drawDisplay(display, params, { meters: quiet, powered: false }).print()).toBe(
      rest.print(),
    )
    // Keep, Strict and Floor each change it.
    const other = (values: Record<string, number>): string =>
      drawDisplay(display, params, { meters: quiet, values }).print()
    expect(other({ keep: 1 })).not.toBe(rest.print())
    expect(other({ strict: 1 })).not.toBe(rest.print())
    expect(other({ floor: -12 })).not.toBe(rest.print())
    // Sound stops: the readings stay for half a second, then the example is back.
    const state = display.init?.()
    const sounding = { ...quiet, now13: 0.5, then13: 0.5, heard13: 0.5 }
    runDisplay(display, params, 1, { meters: sounding, state })
    const soon = runDisplay(display, params, 0.3, { meters: quiet, state, now: 11 })
    expect(rectsOf(soon).some((rect) => rect.colour === INK && rect.alpha === 0.55)).toBe(false)
    const after = runDisplay(display, params, 1.5, { meters: quiet, state, now: 11.3 })
    expect(rectsOf(after).some((rect) => rect.colour === INK && rect.alpha === 0.55)).toBe(true)
  })

  it('writes which side is let through, and Ago in words, on a patch where bands can reach', () => {
    const words = (values: Record<string, number>, hot: string | null = null): string[] =>
      drawDisplay(display, params, { meters: quiet, values, hot }).words()
    expect(words({})).toEqual(['350 ms', 'COMMON'])
    expect(words({ keep: 1, ago: 2000 })).toEqual(['2.0 s', 'CHANGES'])
    expect(words({ strict: 0.25 }, 'strict')).toEqual(['350 ms', 'Leeway  18.0 dB'])
    expect(tonesAgoText(50)).toBe('50 ms')
    expect(tonesAgoText(999.4)).toBe('999 ms')
    expect(tonesAgoText(999.6)).toBe('1.0 s')
    expect(tonesAgoText(8000)).toBe('8.0 s')
    const drawn = drawDisplay(display, params, { meters: quiet })
    expect(patchUnder(drawn, 'COMMON', PLATE)).not.toBeNull()
  })
})

describe('Common Tones: the handles', () => {
  it("stands Ago on a ruler that is the knob's own travel, and a drag there sets it", () => {
    // The knob is a log one from 50 ms to 8 s: equal steps for equal ratios.
    expect(descriptor.params.ago.taper).toBe('log')
    expect(tonesAgoAt(50)).toBe(0)
    expect(tonesAgoAt(8000)).toBe(1)
    expect(tonesAgoAt(632.46)).toBeCloseTo(0.5, 4)
    for (const size of [FLAT, UPRIGHT]) {
      const span = size.width - 12
      for (const ago of [50, 350, 2000, 8000]) {
        const point = handleOf('ago', { ...size, values: { ago } })
        expect(point.x).toBeCloseTo(
          6 + viewOf(display, params, { values: { ago } }).at('ago') * span,
          3,
        )
        expect(point.y).toBe(8)
        expect(point.drag(point.x, point.y).ago).toBeCloseTo(ago, 3)
      }
      const point = handleOf('ago', size)
      expect(point.drag(6 + span / 2, 50).ago).toBeCloseTo(632.46, 1)
      expect(point.drag(-40, 0).ago).toBeCloseTo(50, 6)
      expect(point.drag(size.width + 40, 0).ago).toBeCloseTo(8000, 6)
      expect(point.reset?.()).toEqual({ ago: 350 })
    }
  })

  it("stands the leeway over its mark on the bands' own scale, with room to set it by hand", () => {
    for (const size of [FLAT, UPRIGHT]) {
      const { box, gaugeX } = tonesLayout(size)
      expect(gaugeX + 4.5).toBeLessThanOrEqual(size.width)
      expect(gaugeX - 4.5).toBeGreaterThanOrEqual(box.x + box.w)
      for (const strict of [0, 0.25, 0.6, 1]) {
        const point = handleOf('strict', { ...size, values: { strict } })
        expect(point.x).toBe(gaugeX)
        expect(point.y).toBeCloseTo(yOf(TONES_GAUGE_DB + tonesLeewayDb(strict)), 3)
        expect(point.drag(point.x, point.y).strict).toBeCloseTo(strict, 6)
      }
      const loose = handleOf('strict', { ...size, values: { strict: 0 } })
      const tight = handleOf('strict', { ...size, values: { strict: 1 } })
      // 24 dB of a scale of 60 over 79 pixels.
      expect(tight.y - loose.y).toBeCloseTo((24 / 60) * 79, 3)
      expect(tight.y - loose.y).toBeGreaterThan(30)
      expect(tight.drag(0, yOf(TONES_GAUGE_DB + 12)).strict).toBeCloseTo(0.5, 6)
      expect(tight.drag(0, 0).strict).toBe(0)
      expect(tight.drag(0, 200).strict).toBe(1)
      expect(tight.reset?.()).toEqual({ strict: 0.6 })
    }
  })

  it('draws the shade over every mark as high as the leeway its point shows', () => {
    const strict = 0.25
    const drawn = running({ now13: 0.03, then13: 0.03, heard13: 0.03 }, { strict })
    const shade = bandOf(drawn, 12).find(
      (rect) => rect.colour === INK && rect.y + rect.h < 90 && rect.h > 1,
    )
    const point = handleOf('strict', { values: { strict } })
    const { gaugeX } = tonesLayout(FLAT)
    const gauge = rectsOf(drawn).find((rect) => rect.x === gaugeX - 3 && rect.w === 6)
    expect(gauge?.y).toBeCloseTo(point.y, 6)
    expect(shade?.h).toBeCloseTo(gauge?.h ?? 0, 1)
    expect(shade?.h).toBeCloseTo((18 / 60) * 79, 1)
  })
})
