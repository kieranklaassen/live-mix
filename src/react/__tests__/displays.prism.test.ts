// The Prism's display against the device: the curve it draws is held to the
// device's own table of delays (printed from `cpp/devices/prism/prism.h` by a
// native run and written out below), every line and mark to that curve, each
// point to the parameter it sets, and what moves to the readings it is drawn
// from.

import { describe, expect, it } from 'vitest'

import { INK, PLAIN_COLOURS } from '../components/display-kit'
import {
  PRISM_FACES,
  PRISM_LINE_PER,
  PRISM_LIT_GROW,
  PRISM_PASSES,
  PRISM_SHADES,
  PRISM_TRANSIT_ALPHA,
  prismAgainSec,
  prismDeal,
  prismDelaySec,
  prismLayout,
  prismLoopGain,
  prismPassesBy,
  prismPlace,
  prismPlaceAt,
  prismPoints,
  prismRepeatAlpha,
  prismRowY,
  prismSecAt,
  prismShade,
  prismWet,
  prismX,
  prismY,
  prismZone,
  type PrismSettings,
} from '../components/displays/prism'
import { type DisplayHandle, type DisplayHold } from '../components/plate-display'
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

const descriptor = stockDescriptors().get('prism')
if (!descriptor) throw new Error('prism is not a stock device')
const { display } = PRISM_FACES.prism
const params = descriptor.params
const silent = metersOf(descriptor.meters)
const ACCENT = PLAIN_COLOURS.accent
const INK_COLOUR = PLAIN_COLOURS.ink

/** The device's defaults (`device.json`), as the curve's formula takes them. */
const DEFAULTS: PrismSettings = {
  time: 600,
  fan: 1,
  shape: 0,
  bend: 0,
  bands: 12,
  smear: 0.25,
  shuffle: 1,
  feedback: 0.4,
  tilt: -0.25,
}
const settings = (values: Partial<PrismSettings> = {}): PrismSettings => ({
  ...DEFAULTS,
  ...values,
})

/** The two sizes a plate hands the display: lying flat beside four knobs, and upright. */
const SIZES: readonly (readonly [number, number])[] = [
  [128, 100],
  [204, 100],
]

function handleOf(key: string, options: FrameOptions = {}): DisplayHandle {
  const found = display.handles?.(viewOf(display, params, options)).find((h) => h.key === key)
  if (!found) throw new Error(`prism has no handle ${key}`)
  return found
}

interface Mark {
  kind: 'fill' | 'stroke' | 'rect' | 'words'
  colour: string
  alpha: number
  width: number
  points: [number, number][]
  words?: string
}

/** Everything a drawing put down, each mark with its colour, its strength and where it lies. */
function marksOf(drawn: RecordingContext): Mark[] {
  const marks: Mark[] = []
  let fill = ''
  let stroke = ''
  let alpha = 1
  let width = 1
  let path: [number, number][] = []
  for (const { name, args } of drawn.calls) {
    const n = args as number[]
    if (name === 'set fillStyle') fill = String(args[0])
    else if (name === 'set strokeStyle') stroke = String(args[0])
    else if (name === 'set globalAlpha') alpha = Number(args[0])
    else if (name === 'set lineWidth') width = Number(args[0])
    else if (name === 'beginPath') path = []
    else if (name === 'moveTo' || name === 'lineTo' || name === 'arc') path.push([n[0], n[1]])
    else if (name === 'fill') marks.push({ kind: 'fill', colour: fill, alpha, width, points: path })
    else if (name === 'stroke')
      marks.push({ kind: 'stroke', colour: stroke, alpha, width, points: path })
    else if (name === 'fillRect')
      marks.push({
        kind: 'rect',
        colour: fill,
        alpha,
        width,
        points: [
          [n[0], n[1]],
          [n[0] + n[2], n[1] + n[3]],
        ],
      })
    else if (name === 'fillText')
      marks.push({
        kind: 'words',
        colour: fill,
        alpha,
        width,
        points: [[n[1], n[2]]],
        words: String(args[0]),
      })
  }
  return marks
}

/** The curve: the one long line in the ink at full strength. */
const curveOf = (marks: readonly Mark[]): Mark => {
  const found = marks.find(
    (mark) => mark.kind === 'stroke' && mark.width === 1.5 && mark.points.length > 20,
  )
  if (!found) throw new Error('no curve was drawn')
  return found
}
/** The repeats: the thin lines in the ink that are neither level nor upright. */
const repeatsOf = (marks: readonly Mark[]): Mark[] =>
  marks.filter(
    (mark) =>
      mark.kind === 'stroke' &&
      mark.width === 1 &&
      mark.colour === INK_COLOUR &&
      mark.points.length >= 2 &&
      mark.points[0][0] !== mark.points[mark.points.length - 1][0] &&
      mark.points[0][1] !== mark.points[mark.points.length - 1][1],
  )
/** What is coming out now: the rectangles in the second colour. */
const litOf = (marks: readonly Mark[]): Mark[] =>
  marks.filter((mark) => mark.kind === 'rect' && mark.colour === ACCENT)
/** What is on its way: the rectangles in the ink, the ground (the whole canvas) left out. */
const transitOf = (marks: readonly Mark[]): Mark[] =>
  marks.filter(
    (mark) => mark.kind === 'rect' && mark.colour === INK_COLOUR && mark.points[0][0] > 0,
  )

// --- The device's numbers ---------------------------------------------------

/**
 * `Prism::delay_samples(bin)` at 48 kHz, printed by a native run of the device
 * at seven settings (the frame is 2048 long, so bin k is k × 23.4375 Hz).
 */
const DEVICE_BINS = [2, 4, 7, 13, 27, 55, 90, 140, 215, 300, 420, 900]
const DEVICE_TABLE: readonly (Partial<PrismSettings> & { samples: readonly number[] })[] = [
  // prettier-ignore
  { time: 600, fan: 1, shape: 0, bend: 0, bands: 12, smear: 0.25, shuffle: 1, samples: [3600.0, 5897.7, 8342.5, 12582.6, 15249.8, 19610.0, 21967.6, 24259.5, 26534.7, 28685.4, 28800.0, 28800.0] },
  // prettier-ignore
  { time: 1500, fan: 0.6, shape: 1, bend: 0.5, bands: 7, smear: 0, shuffle: 1, samples: [72000.0, 68706.5, 68706.5, 65063.6, 60928.6, 56023.8, 56023.8, 49631.8, 49631.8, 34200.0, 34200.0, 34200.0] },
  // prettier-ignore
  { time: 900, fan: 1, shape: 2, bend: -0.7, bands: 24, smear: 1, shuffle: 1, samples: [5400.0, 5833.6, 9102.5, 18526.7, 40382.1, 22212.8, 12571.0, 7776.9, 5772.7, 5406.0, 5400.0, 5400.0] },
  // prettier-ignore
  { time: 250, fan: 0.3, shape: 3, bend: 0, bands: 5, smear: 0.5, shuffle: 1, samples: [12000.0, 11710.3, 10559.5, 10157.6, 8895.6, 10053.8, 10373.6, 10660.4, 11726.4, 11942.7, 12000.0, 12000.0] },
  // prettier-ignore
  { time: 1200, fan: 1, shape: 4, bend: 0, bands: 8, smear: 0, shuffle: 3, samples: [21600.0, 28800.0, 28800.0, 57600.0, 7200.0, 14400.0, 43200.0, 50400.0, 50400.0, 36000.0, 36000.0, 36000.0] },
  // prettier-ignore
  { time: 2000, fan: 1, shape: 4, bend: 0, bands: 48, smear: 1, shuffle: 7, samples: [35234.0, 69442.5, 75248.8, 88456.4, 45636.0, 44573.6, 43066.3, 22120.2, 52842.9, 58755.5, 70978.7, 70978.7] },
  // prettier-ignore
  { time: 40, fan: 1, shape: 4, bend: 0.3, bands: 2, smear: 0.5, shuffle: 16, samples: [1920.0, 1868.6, 1803.0, 1728.7, 1638.4, 789.7, 684.2, 577.1, 452.1, 315.6, 288.0, 288.0] },
]

describe('the curve of the Prism', () => {
  it('gives every bin the delay the device gives it, at every Shape', () => {
    for (const { samples, ...values } of DEVICE_TABLE) {
      const at = settings(values)
      DEVICE_BINS.forEach((bin, i) => {
        const seconds = prismDelaySec(prismPlace((bin * 48000) / 2048), at)
        // The device keeps its table in single precision: half a sample in thirty thousand.
        expect(seconds * 48000, `${JSON.stringify(values)} bin ${bin}`).toBeCloseTo(samples[i], 0)
      })
    }
  })

  it('deals Scatter as the device does: evenly spaced orders, the same for one Shuffle', () => {
    // Shuffle 3 over eight bands at Time 1200 and Fan 1 is the table's fifth row: a band waits
    // 150 ms and 150 ms more for each place in the deal. The bins of the table lie in bands
    // 0, 1, 1, 2, 3, 4, 5, 6, 6, 7 (a band is an octave wide, from 85 Hz on), which reads
    // 450, 600, 1200, 150, 300, 900, 1050 and 750 ms from the lowest band up.
    const deal = prismDeal(8, 3)
    expect(deal).toEqual([2, 3, 7, 0, 1, 5, 6, 4].map((n) => n / 7))
    expect(prismDeal(8, 3)).toEqual(deal)
    expect(prismDeal(8, 4)).not.toEqual(deal)
    // Two bands have only a first and a last.
    expect([...prismDeal(2, 16)].sort()).toEqual([0, 1])
  })
})

describe('what a pass leaves, and when the next one comes', () => {
  it('loses to Tilt what `rebuild` takes: 6 dB an octave over 250 Hz or under 4 kHz, never a gain', () => {
    expect(prismLoopGain(1000, 0.5, 0)).toBeCloseTo(0.5, 9)
    // Tilt -1 at 1 kHz: two octaves over 250 Hz, 12 dB.
    expect(prismLoopGain(1000, 1, -1)).toBeCloseTo(Math.pow(10, -12 / 20), 9)
    expect(prismLoopGain(200, 1, -1)).toBe(1)
    // Tilt 0.5 at 500 Hz: three octaves under 4 kHz at 3 dB each.
    expect(prismLoopGain(500, 0.8, 0.5)).toBeCloseTo(0.8 * Math.pow(10, -9 / 20), 9)
    expect(prismLoopGain(8000, 0.8, 1)).toBe(0.8)
    for (const tilt of [-1, -0.25, 0, 0.6, 1])
      for (const hz of [30, 250, 1000, 4000, 15000])
        expect(prismLoopGain(hz, 1, tilt)).toBeLessThanOrEqual(1)
  })

  it('repeats a colour every whole number of hops, as the harness measured', () => {
    // `prism_test.cpp`, Time 480 over twelve plain bands: 545 Hz came back every 256.0 ms and
    // 3182 Hz every 405.3 ms.
    const plain = settings({ time: 480, smear: 0 })
    expect(prismAgainSec(prismDelaySec(prismPlace(545), plain), 48000)).toBeCloseTo(0.256, 6)
    expect(prismAgainSec(prismDelaySec(prismPlace(3182), plain), 48000)).toBeCloseTo(0.40533, 4)
    // Never under one hop: the shortest wait there is, 6 ms, comes round every 10.7 ms.
    expect(prismAgainSec(0.006, 48000)).toBeCloseTo(512 / 48000, 9)
    // By then it has come out so often.
    expect(prismPassesBy(0.3, 0.355, 0.352)).toBe(0)
    expect(prismPassesBy(0.355, 0.355, 0.352)).toBe(1)
    expect(prismPassesBy(0.7, 0.355, 0.352)).toBe(1)
    expect(prismPassesBy(0.71, 0.355, 0.352)).toBe(2)
  })

  it('mixes by equal power, as the device does', () => {
    expect(prismWet(0)).toBe(0)
    expect(prismWet(0.5)).toBeCloseTo(Math.SQRT1_2, 9)
    expect(prismWet(1)).toBeCloseTo(1, 9)
  })
})

// --- The lines --------------------------------------------------------------

describe('the picture of the Prism', () => {
  it('draws the curve through the delay of every row, at both sizes and every Shape', () => {
    for (const [width, height] of SIZES) {
      for (const values of [
        {},
        { shape: 1, bend: 0.6 },
        { shape: 2, bands: 5 },
        { shape: 3 },
        { shape: 4, shuffle: 3, bands: 8, smear: 0 },
        { fan: 0 },
      ]) {
        const layout = prismLayout({ width, height })
        const marks = marksOf(
          drawDisplay(display, params, { values, width, height, meters: silent }),
        )
        const curve = curveOf(marks)
        expect(curve.colour).toBe(INK_COLOUR)
        expect(curve.alpha).toBe(INK.trace)
        expect(curve.points).toHaveLength(layout.rows * PRISM_LINE_PER)
        const at = settings(values)
        curve.points.forEach(([x, y], i) => {
          expect(y).toBeCloseTo(prismRowY(i, layout, PRISM_LINE_PER), 6)
          const seconds = prismDelaySec(prismPlaceAt(y, layout.plot), at)
          expect(x, `${JSON.stringify(values)} row ${i}`).toBeCloseTo(
            prismX(seconds, layout.plot),
            3,
          )
        })
      }
    }
  })

  it('stands the default where the device puts it: 75 ms at the bottom, 600 ms at the top', () => {
    // Flat, the plot is 120 wide from x 4 and three decades across: 40 pixels a decade from 10 ms.
    const curve = curveOf(marksOf(drawDisplay(display, params, { meters: silent })))
    const first = curve.points[0]
    const last = curve.points[curve.points.length - 1]
    expect(first[0]).toBeCloseTo(4 + 40 * Math.log10(60), 3)
    expect(last[0]).toBeCloseTo(4 + 40 * Math.log10(7.5), 3)
    // The octave under 60 Hz and the one over 7.7 kHz wait as the ends do.
    const layout = prismLayout({ width: 128, height: 100 })
    for (const [x, y] of curve.points) {
      if (y > prismY(0, layout.plot)) expect(x).toBeCloseTo(last[0], 6)
      if (y < prismY(1, layout.plot)) expect(x).toBeCloseTo(first[0], 6)
    }
    // Fan 0 is one wait for every colour: an upright line at Time.
    const plain = curveOf(
      marksOf(drawDisplay(display, params, { values: { fan: 0 }, meters: silent })),
    )
    for (const [x] of plain.points) expect(x).toBeCloseTo(first[0], 6)
  })

  it('draws each repeat a whole number of hops on, as strong as that colour is by then', () => {
    for (const [width, height] of SIZES) {
      for (const values of [
        {},
        { feedback: 0.9, tilt: -1 },
        { feedback: 0.7, tilt: 0.8, mix: 1 },
        { feedback: 1, tilt: 0, mix: 1, time: 90 },
      ]) {
        const layout = prismLayout({ width, height })
        const at = settings(values)
        const wet = prismWet(values.mix ?? 0.4)
        const repeats = repeatsOf(
          marksOf(drawDisplay(display, params, { values, width, height, meters: silent })),
        )
        expect(repeats.length).toBeGreaterThan(0)
        let passes = 0
        for (const line of repeats) {
          // Every point but the last is a row of its own stretch: which pass it is shows from where it lies.
          line.points.slice(0, -1).forEach(([x, y]) => {
            const place = prismPlaceAt(y, layout.plot)
            const delay = prismDelaySec(place, at)
            const again = prismAgainSec(delay, 48000)
            const pass = 1 + Math.round((prismSecAt(x, layout.plot) - delay) / again)
            expect(pass).toBeGreaterThanOrEqual(2)
            expect(pass).toBeLessThanOrEqual(PRISM_PASSES)
            passes = Math.max(passes, pass)
            expect(x).toBeCloseTo(prismX(delay + (pass - 1) * again, layout.plot), 3)
            const hz = 60 * Math.pow(2, 7 * place)
            const strength = wet * Math.pow(prismLoopGain(hz, at.feedback, at.tilt), pass - 1)
            expect(line.alpha, `pass ${pass} at ${Math.round(hz)} Hz`).toBeCloseTo(
              prismRepeatAlpha(strength),
              6,
            )
          })
        }
        expect(passes).toBeGreaterThanOrEqual(3)
      }
    }
  })
})

describe('what Mix and Feedback leave of the picture', () => {
  it('draws no repeat that is not heard: none at Mix 0, none without Feedback, fewer under Tilt', () => {
    const repeats = (values: Record<string, number>): Mark[] =>
      repeatsOf(marksOf(drawDisplay(display, params, { values, meters: silent })))
    expect(repeats({ mix: 0 })).toHaveLength(0)
    expect(repeats({ feedback: 0 })).toHaveLength(0)
    // The curve itself is the setting: it stands whatever Mix is.
    const dry = marksOf(drawDisplay(display, params, { values: { mix: 0 }, meters: silent }))
    expect(curveOf(dry).alpha).toBe(INK.trace)
    // Tilt at its dark end wears the top of a repeat away: its lines end lower than the curve does.
    const rows = (lines: Mark[]): number => lines.reduce((sum, line) => sum + line.points.length, 0)
    expect(rows(repeats({ feedback: 0.8, tilt: -1 }))).toBeLessThan(
      rows(repeats({ feedback: 0.8, tilt: 0 })),
    )
    const highest = Math.min(
      ...repeats({ feedback: 0.8, tilt: -1 }).flatMap((line) => line.points.map(([, y]) => y)),
    )
    const layout = prismLayout({ width: 128, height: 100 })
    // By the eighth return 20 kHz is gone but 250 Hz is whole: something is left below, not at the top.
    expect(highest).toBeLessThan(prismY(prismPlace(250), layout.plot))
    const last = repeats({ feedback: 0.8, tilt: -1 })[0]
    expect(Math.min(...last.points.map(([, y]) => y))).toBeGreaterThan(prismY(1, layout.plot))
  })

  it('says its scales in words: two waits along the foot, two frequencies on patches', () => {
    for (const [width, height] of SIZES) {
      const layout = prismLayout({ width, height })
      const drawn = drawDisplay(display, params, { width, height, meters: silent })
      const marks = marksOf(drawn)
      const words = (text: string): Mark => {
        const found = marks.find((mark) => mark.words === text)
        if (!found) throw new Error(`"${text}" is not written`)
        return found
      }
      expect(words('100 ms').points[0][0]).toBeCloseTo(prismX(0.1, layout.plot), 6)
      expect(words('1 s').points[0][0]).toBeCloseTo(prismX(1, layout.plot), 6)
      // Under the plot, where nothing moves.
      expect(words('100 ms').points[0][1]).toBeGreaterThan(layout.plot.y + layout.plot.h)
      // A frequency's word stands just over its line, on a patch: sound runs under it.
      for (const [text, hz] of [
        ['100 Hz', 100],
        ['1 kHz', 1000],
      ] as const) {
        const line = Math.round(prismY(Math.log2(hz / 60) / 7, layout.plot))
        expect(words(text).points[0][1]).toBe(line - 2)
        expect(patchUnder(drawn, text, PLAIN_COLOURS.plate)).not.toBeNull()
        // The line itself, from side to side.
        const rule = marks.find(
          (mark) =>
            mark.kind === 'stroke' &&
            mark.points.length === 2 &&
            Math.abs(mark.points[0][1] - (line + 0.5)) < 1e-6 &&
            Math.abs(mark.points[1][1] - (line + 0.5)) < 1e-6,
        )
        expect(rule?.alpha).toBe(INK.grid)
      }
    }
  })

  it('moves the frequency words to the right when the curve begins at the left', () => {
    const layout = prismLayout({ width: 128, height: 100 })
    const at = (values: Record<string, number>): number => {
      const marks = marksOf(drawDisplay(display, params, { values, meters: silent }))
      return marks.find((mark) => mark.words === '1 kHz')?.points[0][0] ?? Number.NaN
    }
    expect(at({})).toBe(layout.plot.x + 2)
    // Time 100 ms with Fan whole begins at 12.5 ms, four pixels in.
    expect(at({ time: 100 })).toBe(layout.plot.x + layout.plot.w - 2)
    expect(at({ time: 100, fan: 0 })).toBe(layout.plot.x + 2)
  })
})

// --- The points -------------------------------------------------------------

describe('the points of the Prism', () => {
  const SHAPES: Record<string, number>[] = [
    {},
    { shape: 1 },
    { shape: 2 },
    { shape: 3 },
    { shape: 4, shuffle: 5 },
    { shape: 2, bands: 5, bend: 0.5 },
    { shape: 4, bands: 48, smear: 1, shuffle: 7 },
    { fan: 0.4, bend: -0.6, time: 2500 },
  ]

  it('stand on the curve: each at the wait of its band, at the height of its frequency', () => {
    for (const [width, height] of SIZES) {
      for (const values of SHAPES) {
        const layout = prismLayout({ width, height })
        const at = settings(values)
        const points = prismPoints(at)
        const places = { time: points.last, fan: points.first, bend: points.middle }
        for (const [key, place] of Object.entries(places)) {
          const handle = handleOf(key, { values, width, height })
          expect(handle.y).toBeCloseTo(prismY(place, layout.plot), 6)
          expect(handle.x).toBeCloseTo(prismX(prismDelaySec(place, at), layout.plot), 6)
        }
        // Time is on the colour that comes last and Fan on the one that comes first.
        const waits = Array.from({ length: at.bands }, (_, band) =>
          prismDelaySec(band / (at.bands - 1), at),
        )
        expect(prismDelaySec(points.last, at)).toBeCloseTo(Math.max(...waits), 9)
        expect(prismDelaySec(points.first, at)).toBeCloseTo(Math.min(...waits), 9)
        // No two of them in one place.
        const stand = ['time', 'fan', 'bend'].map((key) => handleOf(key, { values, width, height }))
        for (let a = 0; a < 3; a++)
          for (let b = a + 1; b < 3; b++)
            expect(Math.hypot(stand[a].x - stand[b].x, stand[a].y - stand[b].y)).toBeGreaterThan(6)
      }
    }
  })

  it('take Time to the wait the hand is at: the last colour comes back there', () => {
    for (const [width, height] of SIZES) {
      for (const values of SHAPES) {
        const layout = prismLayout({ width, height })
        const at = settings(values)
        const handle = handleOf('time', { values, width, height })
        for (const seconds of [0.05, 0.3, 1.7]) {
          const set = handle.drag(prismX(seconds, layout.plot), handle.y, {})
          expect(Object.keys(set)).toEqual(['time'])
          const moved = settings({ ...values, time: set.time })
          expect(prismDelaySec(prismPoints(at).last, moved)).toBeCloseTo(seconds, 6)
        }
        // Past the ends of its range it stops there.
        expect(handle.drag(-50, handle.y, {}).time).toBe(20)
        expect(handle.drag(width + 400, handle.y, {}).time).toBe(4000)
        expect(handle.reset?.()).toEqual({ time: 600 })
      }
    }
  })

  it('take Fan to the wait the hand is at: the first colour comes back there', () => {
    for (const [width, height] of SIZES) {
      for (const values of SHAPES) {
        const layout = prismLayout({ width, height })
        const at = settings(values)
        const handle = handleOf('fan', { values, width, height })
        const whole = at.time / 1000
        for (const share of [0.2, 0.5, 0.9]) {
          const set = handle.drag(prismX(whole * share, layout.plot), handle.y, {})
          expect(Object.keys(set)).toEqual(['fan'])
          const moved = settings({ ...values, fan: set.fan })
          // In a Valley of twelve bands the first colour is a step off the very first order, and
          // Fan whole brings it no sooner than that.
          const soonest = prismDelaySec(prismPoints(at).first, settings({ ...values, fan: 1 }))
          expect(prismDelaySec(prismPoints(at).first, moved)).toBeCloseTo(
            Math.max(whole * share, soonest),
            6,
          )
        }
        // At Time it is a plain delay; no sooner than an eighth of Time.
        expect(handle.drag(prismX(whole, layout.plot), handle.y, {}).fan).toBeCloseTo(0, 9)
        expect(handle.drag(width + 400, handle.y, {}).fan).toBe(0)
        expect(handle.drag(prismX(whole / 20, layout.plot), handle.y, {}).fan).toBe(1)
        expect(handle.reset?.()).toEqual({ fan: 1 })
      }
    }
  })
  it('draws Fan at the edge when the first colour comes before the picture begins, and moves it from where it lies', () => {
    // Time 20 ms with Fan whole: the first colour would come at 2.5 ms (the device holds it at 6),
    // a decade's sixth left of the picture's 10 ms.
    const values = { time: 20 }
    const layout = prismLayout({ width: 128, height: 100 })
    const handle = handleOf('fan', { values })
    expect(handle.x).toBe(layout.plot.x)
    const hold: DisplayHold = {}
    // Taken and not moved, nothing changes.
    expect(handle.drag(handle.x, handle.y, hold).fan).toBe(1)
    // Ten pixels to the right is a quarter of a decade later than where it lay: 2.5 ms × 10^(1/4).
    const moved = handle.drag(handle.x + 10, handle.y, hold).fan
    const first = 0.0025 * Math.pow(10, 10 / 40)
    expect(moved).toBeCloseTo((1 - first / 0.02) / 0.875, 6)
    // The plate asks for the point again after every move; the same hold carries the hand on.
    const next = handleOf('fan', { values: { ...values, fan: moved } })
    expect(next.x).toBe(layout.plot.x)
    const further = next.drag(handle.x + 20, handle.y, hold).fan
    expect(further).toBeCloseTo((1 - (0.0025 * Math.pow(10, 20 / 40)) / 0.02) / 0.875, 6)
  })

  it('take Bend to the wait the hand is at, and leave it where bending moves nothing', () => {
    for (const [width, height] of SIZES) {
      for (const values of SHAPES) {
        const layout = prismLayout({ width, height })
        const at = settings(values)
        const handle = handleOf('bend', { values, width, height })
        const middle = prismPoints(at).middle
        for (const bend of [-0.8, -0.3, 0.2, 0.9]) {
          const there = prismX(prismDelaySec(middle, settings({ ...values, bend })), layout.plot)
          const set = handle.drag(there, handle.y, {})
          expect(Object.keys(set)).toEqual(['bend'])
          expect(set.bend, `${JSON.stringify(values)} to ${bend}`).toBeCloseTo(bend, 5)
        }
        expect(handle.drag(-50, handle.y, {}).bend).toBe(-1)
        expect(handle.drag(width + 400, handle.y, {}).bend).toBe(1)
        expect(handle.reset?.()).toEqual({ bend: 0 })
        expect(handle.wheel?.(1).bend).toBeCloseTo(at.bend + 0.05, 9)
        expect(handle.wheel?.(-1).bend).toBeCloseTo(at.bend - 0.05, 9)
      }
    }
    // With no fan there is nothing to bend, and two plain bands have only a first and a last.
    const plain = handleOf('bend', { values: { fan: 0, bend: 0.3 } })
    expect(plain.drag(plain.x + 30, plain.y, {})).toEqual({ bend: 0.3 })
    const two = handleOf('bend', { values: { bands: 2, smear: 0, bend: -0.4 } })
    expect(two.drag(two.x + 30, two.y, {})).toEqual({ bend: -0.4 })
  })

  it('have room to be set by hand at the default, flat and upright', () => {
    for (const [width, height] of SIZES) {
      const layout = prismLayout({ width, height })
      const reach = (key: string, name: string, low: number, high: number): number =>
        Math.abs(
          handleOf(key, { values: { [name]: high }, width, height }).x -
            handleOf(key, { values: { [name]: low }, width, height }).x,
        )
      expect(reach('time', 'time', 20, 4000)).toBeGreaterThan(0.7 * layout.plot.w)
      expect(reach('fan', 'fan', 0, 1)).toBeGreaterThan(0.25 * layout.plot.w)
      // Bend has the least: 28 pixels flat, and the wheel beside.
      expect(reach('bend', 'bend', -1, 1)).toBeGreaterThan(24)
    }
  })

  it('say the point in hand in words, on a patch at the end away from it', () => {
    const layout = prismLayout({ width: 128, height: 100 })
    const words = (
      hot: string,
      values: Record<string, number> = {},
    ): { text: string; x: number } => {
      const drawn = drawDisplay(display, params, { values, hot, meters: silent })
      const found = marksOf(drawn).find((mark) => mark.words?.startsWith(handleOf(hot).name))
      if (!found?.words) throw new Error(`nothing said of ${hot}`)
      expect(patchUnder(drawn, found.words, PLAIN_COLOURS.plate)).not.toBeNull()
      return { text: found.words, x: found.points[0][0] }
    }
    expect(words('time').text).toBe('Time  600 ms')
    expect(words('time', { time: 2500 }).text).toBe('Time  2.50 s')
    expect(words('fan', { fan: 0.73 }).text).toBe('Fan  73 %')
    expect(words('bend', { bend: 0.25 }).text).toBe('Bend  +0.25')
    expect(words('bend', { bend: -1 }).text).toBe('Bend  −1.00')
    expect(words('bend').text).toBe('Bend  0.00')
    // Time stands in the right half at the default, so its words are at the left; Fan the other way.
    expect(words('time').x).toBe(layout.plot.x + 3)
    expect(words('fan').x).toBe(layout.plot.x + layout.plot.w - 3)
    // In hand, a point is filled with the second colour.
    const hot = marksOf(drawDisplay(display, params, { hot: 'bend', meters: silent }))
    const at = handleOf('bend')
    const filled = hot.filter(
      (mark) => mark.kind === 'fill' && mark.colour === ACCENT && mark.points.length === 1,
    )
    expect(filled).toHaveLength(1)
    expect(filled[0].points[0][0]).toBeCloseTo(at.x, 6)
    expect(filled[0].points[0][1]).toBeCloseTo(at.y, 6)
  })
})

// --- What moves -------------------------------------------------------------

/**
 * The display run as a plate runs it until `last` seconds after the first
 * frame, with the readings and the settings `each` gives for each moment.
 * The first frame only starts the clock: readings are kept from the second.
 */
function runTo(
  last: number,
  each: (time: number) => Partial<FrameOptions>,
  options: FrameOptions = {},
): Mark[] {
  const frames = Math.round(last * 30) + 1
  return marksOf(runDisplay(display, params, frames / 30, { meters: silent, ...options }, each))
}

/** A sound in one octave for the first quarter of a second, then nothing. */
const burst =
  (meter: string, level = 0.5, values?: Record<string, number>) =>
  (time: number): Partial<FrameOptions> => ({
    meters: { ...silent, [meter]: time < 0.25 ? level : 0 },
    ...(values ? { values } : {}),
  })

const within = (mark: Mark, x: number, y: number, grow = 0): boolean =>
  x >= mark.points[0][0] + grow - 1e-6 &&
  x <= mark.points[1][0] - grow + 1e-6 &&
  y > mark.points[0][1] &&
  y < mark.points[1][1]

describe('the sound on its way through the Prism', () => {
  const layout = prismLayout({ width: 128, height: 100 })
  const { plot, rows } = layout
  const wet = prismWet(0.4)
  /** The rows of the picture that one reading speaks for, each with its wait. */
  const rowsOf = (zone: number, at: PrismSettings = DEFAULTS) =>
    Array.from({ length: rows }, (_, row) => {
      const y = prismRowY(row, layout)
      const place = prismPlaceAt(y, plot)
      const delay = prismDelaySec(place, at)
      return { y, place, delay, again: prismAgainSec(delay, 48000), zone: prismZone(place) }
    }).filter((row) => row.zone === zone)

  it('shades a sound by its level: nothing 60 dB down, eight shades over 50 dB', () => {
    expect(prismShade(1)).toBe(PRISM_SHADES)
    expect(prismShade(0.5)).toBe(PRISM_SHADES)
    // 20 dB down is 40 of the 50 dB up from the floor: 6.4 shades.
    expect(prismShade(0.1)).toBe(6)
    expect(prismShade(0.001)).toBe(0)
    expect(prismShade(0)).toBe(0)
  })

  it('reads the octaves as the device reports them, the ends taking what lies beyond', () => {
    // `zone_` in `Prism::init`: seven octaves from 60 Hz, everything under 120 Hz in the first
    // and everything over 3.84 kHz in the last.
    expect(
      [30, 60, 119, 121, 500, 1000, 3800, 3900, 7680, 15000].map((hz) => prismZone(prismPlace(hz))),
    ).toEqual([0, 0, 0, 1, 3, 4, 5, 6, 6, 6])
    for (const [meter, zone] of [
      ['flow1', 0],
      ['flow4', 3],
      ['flow7', 6],
    ] as const) {
      const marks = runTo(0.2, () => ({ meters: { ...silent, [meter]: 0.5 } }))
      const mine = rowsOf(zone)
      const on = transitOf(marks)
      expect(on.length).toBeGreaterThan(0)
      for (const mark of on) {
        expect(mark.points[0][1]).toBeGreaterThanOrEqual(mine[0].y - 0.5 - 1e-6)
        expect(mark.points[1][1]).toBeLessThanOrEqual(mine[mine.length - 1].y + 0.5 + 1e-6)
      }
      // The whole height of the octave is drawn, the octave past the axis's end with it.
      expect(Math.min(...on.map((mark) => mark.points[0][1]))).toBeCloseTo(mine[0].y - 0.5, 6)
      expect(Math.max(...on.map((mark) => mark.points[1][1]))).toBeCloseTo(
        mine[mine.length - 1].y + 0.5,
        6,
      )
    }
    expect(rowsOf(0)[rowsOf(0).length - 1].y).toBeCloseTo(plot.y + plot.h - 0.5, 6)
    expect(rowsOf(6)[0].y).toBeCloseTo(plot.y + 0.5, 6)
  })

  it('draws a sound as far across as it went in ago, in the ink, and lights nothing before its wait is up', () => {
    // 0.3 s after the first frame the burst is between 67 and 267 ms old; its octave waits 300 ms and more.
    const marks = runTo(0.3, burst('flow4'))
    expect(Math.min(...rowsOf(3).map((row) => row.delay))).toBeGreaterThan(0.3)
    expect(litOf(marks)).toHaveLength(0)
    const on = transitOf(marks)
    expect(on.length).toBeGreaterThan(0)
    for (const mark of on) {
      expect(mark.points[0][0]).toBeGreaterThanOrEqual(prismX(0.045, plot))
      expect(mark.points[1][0]).toBeLessThanOrEqual(prismX(0.3, plot))
      expect(mark.alpha).toBeCloseTo(
        (PRISM_TRANSIT_ALPHA * prismShade(0.5 * wet)) / PRISM_SHADES,
        6,
      )
    }
    // It reaches from the newest of it to the oldest.
    expect(Math.min(...on.map((mark) => mark.points[0][0]))).toBeLessThan(prismX(0.075, plot))
    expect(Math.max(...on.map((mark) => mark.points[1][0]))).toBeGreaterThan(prismX(0.25, plot))
    // In silence nothing is on its way.
    expect(transitOf(runTo(0.3, () => ({})))).toHaveLength(0)
  })

  it('lights the curve in the second colour where a sound comes out, row by row at its own wait', () => {
    // Half a second on, the burst is 267 to 467 ms old: every row of its octave has its wait in that.
    const marks = runTo(0.5, burst('flow4'))
    const lit = litOf(marks)
    const mine = rowsOf(3)
    for (const row of mine) {
      const x = prismX(row.delay, plot)
      const here = lit.filter((mark) => within(mark, x, row.y, PRISM_LIT_GROW))
      expect(here, `the row at ${row.y}`).toHaveLength(1)
      expect(here[0].alpha).toBe(prismShade(0.5 * wet) / PRISM_SHADES)
    }
    // And nothing else is: every mark lies over a row of that octave, on the curve.
    for (const mark of lit) {
      expect(mine.some((row) => within(mark, prismX(row.delay, plot), row.y, PRISM_LIT_GROW))).toBe(
        true,
      )
    }
    // Past the curve it travels on, as much fainter as one pass leaves it.
    const beyond = transitOf(marks).filter((mark) => mark.points[0][0] > prismX(0.38, plot))
    expect(beyond.length).toBeGreaterThan(0)
    for (const mark of beyond) {
      const row = mine.find((r) => r.y > mark.points[0][1] && r.y < mark.points[1][1])
      if (!row) throw new Error('a mark outside the octave')
      const left = 0.5 * wet * prismLoopGain(60 * Math.pow(2, 7 * row.place), 0.4, -0.25)
      expect(mark.alpha).toBeCloseTo((PRISM_TRANSIT_ALPHA * prismShade(left)) / PRISM_SHADES, 6)
    }
  })
  it('lights each repeat where it comes out again, a pass fainter', () => {
    // A sound for the first 0.3 s is 600 to 867 ms old 0.9 s on. Its octave came out at 310 to
    // 365 ms and comes out again a whole number of hops later, at 619 to 728 ms.
    const longer = (values?: Record<string, number>) => (time: number) => ({
      meters: { ...silent, flow4: time < 0.31 ? 0.5 : 0 },
      ...(values ? { values } : {}),
    })
    const marks = runTo(0.9, longer())
    const lit = litOf(marks)
    const mine = rowsOf(3)
    expect(lit.length).toBeGreaterThan(0)
    for (const row of mine) {
      const x = prismX(row.delay + row.again, plot)
      const here = lit.filter((mark) => within(mark, x, row.y, PRISM_LIT_GROW))
      expect(here, `the row at ${row.y}`).toHaveLength(1)
      const left = 0.5 * wet * prismLoopGain(60 * Math.pow(2, 7 * row.place), 0.4, -0.25)
      expect(here[0].alpha).toBe(prismShade(left) / PRISM_SHADES)
      expect(here[0].alpha).toBeLessThan(1)
    }
    // Nothing is lit on the curve itself any more: that was half a second ago.
    for (const row of mine)
      expect(lit.some((mark) => within(mark, prismX(row.delay, plot), row.y, PRISM_LIT_GROW))).toBe(
        false,
      )
    // Without Feedback it comes out once, and nothing travels on.
    const once = runTo(0.9, longer({ feedback: 0 }))
    expect(litOf(once)).toHaveLength(0)
    expect(transitOf(once)).toHaveLength(0)
  })

  it('draws nothing as heard while Mix is at nothing, and goes on reading the device', () => {
    const dry = runTo(0.5, burst('flow4', 0.5, { mix: 0 }))
    expect(litOf(dry)).toHaveLength(0)
    expect(transitOf(dry)).toHaveLength(0)
    // What went in unheard is still on its way: Mix raised before it comes out, it is seen to.
    const raised = runTo(0.5, (time) => ({
      meters: { ...silent, flow4: time < 0.25 ? 0.5 : 0 },
      values: { mix: time < 0.4 ? 0 : 0.4 },
    }))
    const row = rowsOf(3)[3]
    expect(
      litOf(raised).some((mark) => within(mark, prismX(row.delay, plot), row.y, PRISM_LIT_GROW)),
    ).toBe(true)
    // Less Mix, a fainter mark.
    const faint = litOf(runTo(0.5, burst('flow4', 0.5, { mix: 0.05 })))
    expect(faint.length).toBeGreaterThan(0)
    for (const mark of faint)
      expect(mark.alpha).toBe(prismShade(0.5 * prismWet(0.05)) / PRISM_SHADES)
    expect(prismShade(0.5 * prismWet(0.05))).toBeLessThan(PRISM_SHADES)
  })

  it('keeps for each sound the wait it went in under: a knob turned moves only what comes after', () => {
    // The device throws a sound forward when it goes in. Time doubled 0.3 s on, the burst still
    // comes out where the old curve stood, and the line is drawn where the new one does.
    const marks = runTo(0.5, (time) => ({
      meters: { ...silent, flow4: time < 0.25 ? 0.5 : 0 },
      values: { time: time < 0.3 ? 600 : 1200 },
    }))
    const lit = litOf(marks)
    const was = rowsOf(3)
    const now = rowsOf(3, settings({ time: 1200 }))
    for (const row of was)
      expect(
        lit.filter((mark) => within(mark, prismX(row.delay, plot), row.y, PRISM_LIT_GROW)),
      ).toHaveLength(1)
    for (const row of now)
      expect(lit.some((mark) => within(mark, prismX(row.delay, plot), row.y, PRISM_LIT_GROW))).toBe(
        false,
      )
    const curve = curveOf(marks)
    const top = curve.points[0]
    expect(top[0]).toBeCloseTo(prismX(1.2, plot), 3)
  })

  it('stands still when it is switched off or drawn once: the curve, and nothing on its way', () => {
    const loud = { ...silent, flow4: 0.5, flow2: 0.5 }
    const off = marksOf(runDisplay(display, params, 0.5, { meters: loud, powered: false }))
    expect(litOf(off)).toHaveLength(0)
    expect(transitOf(off)).toHaveLength(0)
    expect(curveOf(off).points.length).toBeGreaterThan(20)
    const once = drawDisplay(display, params, { meters: loud, now: 10 })
    const again = drawDisplay(display, params, { meters: loud, now: 73.4 })
    expect(again.print()).toBe(once.print())
    expect(litOf(marksOf(once))).toHaveLength(0)
    // Switched off after sound went in, what was on its way is dropped: the device's ring is not read.
    const stopped = runTo(0.5, (time) => ({ meters: loud, powered: time < 0.4 }))
    expect(transitOf(stopped)).toHaveLength(0)
  })
})
