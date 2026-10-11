// The display of Seasons against the device: the hills against the weights in
// `cpp/devices/seasons/seasons.h`, the tone against the header's own filters
// run sample by sample and against the compiled device, the mark and the live
// line against the readings the device gives, and the ring against the two
// parameters it sets.

import { describe, expect, it } from 'vitest'

import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { SEASONS_METERS, SEASONS_PARAMS } from '../../dsp/devices/seasons.gen'
import { PLAIN_COLOURS, hzOfX, yOfDb } from '../components/display-kit'
import {
  SEASONS_FACES,
  SEASONS_RING_LEAST,
  SEASONS_RING_MOST,
  SEASONS_TONE_DB,
  SEASONS_TRAIL_SEC,
  SEASONS_SPRING_AT,
  SEASON_NAMES,
  ringAlpha,
  seasonWeight,
  seasonsHill,
  seasonsLayout,
  seasonsRingSec,
  seasonsToneDb,
  seasonsTrail,
  seasonsWedge,
  xOfYear,
  yOfRing,
  yearOfX,
  type SeasonsTone,
} from '../components/displays/seasons'
import {
  drawDisplay,
  runDisplay,
  stockDescriptors,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const { display } = SEASONS_FACES.seasons
const params = stockDescriptors().get('seasons')?.params ?? {}
const { ink, accent, plate } = PLAIN_COLOURS
const RATE = 48000

/** The two shapes a plate hands it: the strip of a plate lying flat, and the upright plate's. */
const SHAPES = [
  { width: 224, height: 48 },
  { width: 204, height: 100 },
] as const
const FLAT = SHAPES[0]

const draw = (options: FrameOptions = {}): RecordingContext =>
  drawDisplay(display, params, { ...FLAT, ...options })

/** Readings as the device gives them at rest, with any that are told. */
const readings = (told: Record<string, number> = {}): Record<string, number> => ({
  year: 0,
  crumble: 1,
  glitter: 0,
  sway: 0,
  ...told,
})

const ring = (
  values: Record<string, number> = {},
  size: { width: number; height: number } = FLAT,
) => {
  const found = display.handles?.(viewOf(display, params, { values, ...size }))[0]
  if (!found) throw new Error('Seasons has no ring')
  return found
}

// --- Reading what was drawn -------------------------------------------------

interface Path {
  points: [number, number][]
  arcs: number[][]
  fill: string | null
  stroke: string | null
  alpha: number
  lineWidth: number
}

/** Every path put on the canvas, with what it was painted in. */
function pathsOf(drawn: RecordingContext): Path[] {
  const paths: Path[] = []
  let now: Path | null = null
  let fillStyle = ''
  let strokeStyle = ''
  let alpha = 1
  let lineWidth = 1
  for (const { name, args } of drawn.calls) {
    const numbers = args as number[]
    if (name === 'set fillStyle') fillStyle = String(args[0])
    else if (name === 'set strokeStyle') strokeStyle = String(args[0])
    else if (name === 'set globalAlpha') alpha = numbers[0]
    else if (name === 'set lineWidth') lineWidth = numbers[0]
    else if (name === 'beginPath') {
      now = { points: [], arcs: [], fill: null, stroke: null, alpha: 1, lineWidth: 1 }
      paths.push(now)
    } else if (!now) continue
    else if (name === 'moveTo' || name === 'lineTo') now.points.push([numbers[0], numbers[1]])
    else if (name === 'arc') now.arcs.push(numbers)
    else if (name === 'fill') {
      now.fill = fillStyle
      now.alpha = alpha
    } else if (name === 'stroke') {
      now.stroke = strokeStyle
      now.lineWidth = lineWidth
      if (now.fill === null) now.alpha = alpha
    }
  }
  return paths
}

/** The hills' outlines: the lines in the ink that are neither a rule nor the tone. */
const outlinesOf = (drawn: RecordingContext): Path[] =>
  pathsOf(drawn).filter(
    (path) => path.stroke === ink && path.fill === null && path.lineWidth === 1.25,
  )

/** The hills' fills: what is heard of each season. */
const fillsOf = (drawn: RecordingContext): Path[] =>
  pathsOf(drawn).filter(
    (path) => path.fill === ink && path.stroke === null && path.points.length === 27,
  )

/** The mark: the upright line in the accent. */
function markOf(drawn: RecordingContext): number {
  const marks = pathsOf(drawn).filter(
    (path) =>
      path.stroke === accent &&
      path.lineWidth === 1.5 &&
      path.points.length === 2 &&
      path.points[0][0] === path.points[1][0],
  )
  expect(marks.length, 'one mark').toBe(1)
  return marks[0].points[0][0]
}

/** The dots on the mark, and the sparks' one: by where they stand. */
const dotsOf = (drawn: RecordingContext, radius: number): [number, number][] =>
  pathsOf(drawn)
    .filter((path) => path.fill === accent && path.arcs.length === 1 && path.arcs[0][2] === radius)
    .map((path) => [path.arcs[0][0], path.arcs[0][1]])

/** The wedge behind the mark: the four-cornered shapes filled in the accent. */
const wedgesOf = (drawn: RecordingContext): [number, number][][] =>
  pathsOf(drawn)
    .filter((path) => path.fill === accent && path.points.length === 4 && path.arcs.length === 0)
    .map((path) => path.points)

/** The tone's lines in one colour: the long ones 1.5 wide. */
const tonesOf = (drawn: RecordingContext, colour: string): [number, number][][] =>
  pathsOf(drawn)
    .filter((path) => path.stroke === colour && path.lineWidth === 1.5 && path.points.length > 8)
    .map((path) => path.points)

// --- The header, written out again ------------------------------------------

// `seasons_parts` in cpp/devices/seasons/seasons.h, at Depth 1.
const kLowShelfDb = [-2, 3, 2, -7]
const kLowShelfHz = [200, 260, 180, 400]
const kHighShelfDb = [4.5, -2, -9, 3]
const kHighShelfHz = [2800, 4500, 1300, 6500]
const kTrimDb = [-1.2, -2.8, 1.45, 3.25]
// `kTopBandHz` in the class.
const kTopBandHz = 900

// `kSpringAt`: spring's middle on the Year dial, whose two ends are the turn of the year.
const kSpringAt = 0.125

/** `weight`: cos²(2π·d) for a season nearer than a quarter of a year, the shorter way round. */
function weight(k: number, year: number): number {
  let d = year - kSpringAt - 0.25 * k
  d -= Math.floor(d + 0.5)
  if (d < 0) d = -d
  if (d >= 0.25) return 0
  return Math.cos(2 * Math.PI * d) ** 2
}

/**
 * The straight path of `process()` for one side, sample by sample, on a sine:
 * the two shelves, the band above 900 Hz at `top`, the side's gain, the Mix.
 * It gives the level out against the level in, in dB, once it has settled.
 */
function throughHeader(hz: number, tone: SeasonsTone): number {
  const w = [0, 1, 2, 3].map((k) => weight(k, tone.year))
  const blend = (table: number[]): number => table.reduce((sum, v, k) => sum + v * w[k], 0)
  const blendLog = (table: number[]): number =>
    Math.exp(table.reduce((sum, v, k) => sum + Math.log(v) * w[k], 0))
  const pole = (cut: number): number => Math.exp((-2 * Math.PI * cut) / RATE)
  const lowA = pole(blendLog(kLowShelfHz))
  const highA = pole(blendLog(kHighShelfHz))
  const topA = pole(kTopBandHz)
  const low = 10 ** ((tone.depth * blend(kLowShelfDb)) / 20) - 1
  const high = 10 ** ((tone.depth * blend(kHighShelfDb)) / 20) - 1
  const widened = 1 / Math.sqrt(0.75 + 0.25 * tone.width * tone.width)
  const trim = widened * 10 ** ((tone.depth * blend(kTrimDb)) / 20)
  const gain = trim * (1 + (tone.side ?? 0))
  let lowState = 0
  let highState = 0
  let topState = 0
  const total = Math.round(RATE * 0.25)
  let peak = 0
  for (let n = 0; n < total; n++) {
    const x = Math.sin((2 * Math.PI * hz * n) / RATE)
    // kit::OnePole::lowpass
    lowState = x + (lowState - x) * lowA
    highState = x + (highState - x) * highA
    let toned = x + low * lowState + high * (x - highState)
    topState = toned + (topState - toned) * topA
    toned += ((tone.top ?? 1) - 1) * (toned - topState)
    const out = x * (1 - tone.mix) + gain * toned * tone.mix
    if (n > total / 2) peak = Math.max(peak, Math.abs(out))
  }
  return 20 * Math.log10(peak)
}

const TONE: SeasonsTone = { year: 0, depth: 1, width: 1, mix: 1 }

describe('the year of Seasons', () => {
  it('weighs the seasons as the header does: cos² of the way to each, the shorter way round', () => {
    for (let i = 0; i <= 400; i++) {
      const year = i / 400
      let sum = 0
      for (let k = 0; k < 4; k++) {
        expect(seasonWeight(k, year)).toBeCloseTo(weight(k, year), 12)
        sum += seasonWeight(k, year)
      }
      // Two seasons at the most, and together they are the whole sound.
      expect(sum).toBeCloseTo(1, 12)
    }
    for (let k = 0; k < 4; k++) {
      // A season has the middle of its quarter of the dial to itself.
      expect(seasonWeight(k, 0.125 + 0.25 * k)).toBe(1)
      expect(seasonWeight(k, 0.25 * k)).toBeCloseTo(0.5, 12)
      expect(seasonWeight(k, 0.25 * k + 0.25)).toBeCloseTo(0.5, 12)
      expect(seasonWeight(k, 0.125 + 0.25 * k + 0.25)).toBeCloseTo(0, 12)
    }
    expect(SEASONS_SPRING_AT).toBe(kSpringAt)
    // The two ends of the dial are the same day: half winter, half spring.
    for (let k = 0; k < 4; k++) expect(seasonWeight(k, 1)).toBeCloseTo(seasonWeight(k, 0), 12)
    expect(seasonWeight(0, 0)).toBeCloseTo(0.5, 12)
    expect(seasonWeight(3, 0)).toBeCloseTo(0.5, 12)
    expect(seasonWeight(0, 0.99)).toBeCloseTo(seasonWeight(0, -0.01), 12)
    expect(seasonWeight(3, 0.99)).toBeCloseTo(seasonWeight(3, -0.01), 12)
  })

  it('lays the Year dial across the band from end to end, a season to a quarter', () => {
    for (const size of SHAPES) {
      const { hills } = seasonsLayout(size)
      // Each season's middle is over the middle of its quarter.
      for (let k = 0; k < 4; k++)
        expect(xOfYear(kSpringAt + 0.25 * k, hills)).toBeCloseTo(
          hills.x + ((2 * k + 1) / 8) * hills.w,
          9,
        )
      for (let i = 0; i <= 200; i++) {
        const year = i / 200
        expect(yearOfX(xOfYear(year, hills), hills)).toBeCloseTo(year, 9)
      }
      // The dial's two ends are the picture's two edges, and it goes no further.
      expect(xOfYear(0, hills)).toBe(hills.x)
      expect(xOfYear(1, hills)).toBe(hills.x + hills.w)
      expect(yearOfX(hills.x - 40, hills)).toBe(0)
      expect(yearOfX(hills.x + hills.w + 40, hills)).toBe(1)
    }
  })

  it('draws each hill as the season’s share at every place, as tall as Depth', () => {
    for (const size of SHAPES) {
      const { hills } = seasonsLayout(size)
      const foot = hills.y + hills.h
      for (const depth of [1, 0.75, 0.3]) {
        const outlines = outlinesOf(draw({ ...size, values: { depth, turn: 0 } }))
        // Spring and winter come in two pieces, one at each end.
        expect(outlines.length).toBe(6)
        const pieces = [0, 1, 2, 3].flatMap((k) =>
          seasonsHill(k, hills, depth).map((points) => ({ k, points })),
        )
        expect(pieces.map((piece) => piece.k)).toEqual([0, 0, 1, 2, 3, 3])
        pieces.forEach(({ k, points }, i) => {
          expect(outlines[i].points.length).toBe(points.length)
          let widest = 0
          points.forEach(([x, y], n) => {
            expect(outlines[i].points[n][0]).toBeCloseTo(x, 9)
            expect(outlines[i].points[n][1]).toBeCloseTo(y, 9)
            expect(x).toBeGreaterThanOrEqual(hills.x - 1e-9)
            expect(x).toBeLessThanOrEqual(hills.x + hills.w + 1e-9)
            expect(y).toBeCloseTo(foot - depth * weight(k, yearOfX(x, hills)) * hills.h, 6)
            widest = Math.max(widest, x)
          })
          expect(widest).toBeGreaterThan(points[0][0])
        })
        // A hill stands as tall as Depth over the middle of its quarter.
        const tops = outlines.map((path) => Math.min(...path.points.map((p) => p[1])))
        expect(Math.min(...tops)).toBeCloseTo(foot - depth * hills.h, 6)
      }
    }
  })

  it('fills the hills of the seasons in the blend, by their share, as far as Mix lets them be heard', () => {
    const { hills } = seasonsLayout(FLAT)
    // Summer alone.
    const summer = fillsOf(draw({ values: { year: 0.375, depth: 0.8, turn: 0 } }))
    expect(summer.length).toBe(1)
    expect(summer[0].alpha).toBeCloseTo(0.34, 9)
    const whole = seasonsHill(1, hills, 0.8)[0]
    whole.forEach(([x, y], n) => {
      expect(summer[0].points[n][0]).toBeCloseTo(x, 9)
      expect(summer[0].points[n][1]).toBeCloseTo(y, 9)
    })
    // Half way to autumn: both, each half as strongly.
    const between = fillsOf(draw({ values: { year: 0.5, turn: 0 } }))
    expect(between.length).toBe(2)
    for (const path of between) expect(path.alpha).toBeCloseTo(0.17, 9)
    // Winter with a little spring: winter's two pieces and spring's two.
    const late = fillsOf(draw({ values: { year: 0.925, turn: 0 } }))
    expect(late.length).toBe(4)
    expect(late[0].alpha).toBeCloseTo(0.34 * weight(0, 0.925), 9)
    expect(late[2].alpha).toBeCloseTo(0.34 * weight(3, 0.925), 9)
    expect(weight(3, 0.925)).toBeGreaterThan(0.8)
    // Mix lets half of it through: the fill is half as tall, the outline stays where Depth is.
    const half = draw({ values: { year: 0.375, depth: 0.8, mix: 0.5, turn: 0 } })
    const low = seasonsHill(1, hills, 0.4)[0]
    low.forEach(([, y], n) => expect(fillsOf(half)[0].points[n][1]).toBeCloseTo(y, 9))
    expect(Math.min(...outlinesOf(half)[2].points.map((p) => p[1]))).toBeCloseTo(
      hills.y + hills.h - 0.8 * hills.h,
      6,
    )
    // With no Mix or no Depth nothing of a season is heard, and nothing is filled.
    expect(fillsOf(draw({ values: { year: 0.375, mix: 0 } })).length).toBe(0)
    expect(fillsOf(draw({ values: { year: 0.375, depth: 0 } })).length).toBe(0)
    expect(outlinesOf(draw({ values: { year: 0.375, mix: 0 } })).length).toBe(6)
  })

  it('stands the mark on the year the device reports, and on the knob when it has no reading', () => {
    for (const size of SHAPES) {
      const { hills } = seasonsLayout(size)
      // At rest: where the Year knob put it.
      expect(markOf(draw({ ...size, values: { year: 0.4 } }))).toBeCloseTo(xOfYear(0.4, hills), 9)
      // At either end of the dial it stands with the ring, though both ends are the same day.
      expect(markOf(draw({ ...size, values: { year: 0 } }))).toBe(hills.x)
      expect(markOf(draw({ ...size, values: { year: 1 } }))).toBe(hills.x + hills.w)
      // Running, the year has turned on from the knob.
      for (const year of [0, 0.13, 0.5, 0.874, 0.876, 0.999]) {
        const drawn = draw({ ...size, values: { year: 0.4 }, meters: readings({ year }) })
        expect(markOf(drawn)).toBeCloseTo(xOfYear(year, hills), 9)
      }
      // Bypassed it shows what it would do: the knob again.
      const off = draw({
        ...size,
        values: { year: 0.4 },
        meters: readings({ year: 0.7 }),
        powered: false,
      })
      expect(markOf(off)).toBeCloseTo(xOfYear(0.4, hills), 9)
      // Before the first reading arrives every reading is nothing: not the year at spring.
      const early = draw({ ...size, values: { year: 0.4 }, meters: readings({ crumble: 0 }) })
      expect(markOf(early)).toBeCloseTo(xOfYear(0.4, hills), 9)
    }
  })

  it('puts a dot on the mark for each season in the blend, as high as its share of Depth', () => {
    const { hills } = seasonsLayout(FLAT)
    const foot = hills.y + hills.h
    // A little past the middle of summer: summer above, autumn coming in under it.
    const drawn = draw({ values: { depth: 0.6 }, meters: readings({ year: 0.425 }) })
    const dots = dotsOf(drawn, 2).sort((a, b) => a[1] - b[1])
    expect(dots.length).toBe(2)
    for (const [x] of dots) expect(x).toBeCloseTo(xOfYear(0.425, hills), 9)
    expect(dots[0][1]).toBeCloseTo(foot - 0.6 * weight(1, 0.425) * hills.h, 9)
    expect(dots[1][1]).toBeCloseTo(foot - 0.6 * weight(2, 0.425) * hills.h, 9)
    // One season alone has one dot, at the top of its hill.
    const alone = dotsOf(draw({ values: { depth: 0.6, year: 0.625 } }), 2)
    expect(alone).toEqual([[xOfYear(0.625, hills), foot - 0.6 * hills.h]])
    expect(dotsOf(draw({ values: { depth: 0, year: 0.625 } }), 2).length).toBe(0)
  })

  it('draws behind the mark the stretch the year turned through in ten seconds', () => {
    expect(SEASONS_TRAIL_SEC).toBe(10)
    // Turn: Still, Forward, Backward. Turning is the seconds a year takes.
    expect(seasonsTrail(0, 120)).toBe(0)
    expect(seasonsTrail(1, 120)).toBeCloseTo(10 / 120, 12)
    expect(seasonsTrail(2, 120)).toBeCloseTo(-10 / 120, 12)
    expect(seasonsTrail(1, 1800)).toBeCloseTo(10 / 1800, 12)
    // A year that turns in ten seconds or less has been everywhere.
    expect(seasonsTrail(1, 10)).toBe(1)
    expect(seasonsTrail(2, 10)).toBe(-1)
    for (const size of SHAPES) {
      const { hills } = seasonsLayout(size)
      const foot = hills.y + hills.h
      const at = (values: Record<string, number>, year: number) =>
        wedgesOf(draw({ ...size, values, meters: readings({ year }) }))
      // Forward: the past lies to the left of the mark.
      const forward = at({ turn: 1, turning: 40 }, 0.5)
      expect(forward.length).toBe(1)
      const xNow = xOfYear(0.5, hills)
      const corners = [
        [xNow - 0.25 * hills.w, foot],
        [xNow - 0.25 * hills.w, foot],
        [xNow, foot - 3],
        [xNow, foot],
      ]
      corners.forEach(([x, y], n) => {
        expect(forward[0][n][0]).toBeCloseTo(x, 9)
        expect(forward[0][n][1]).toBeCloseTo(y, 9)
      })
      // Backward: to its right.
      const backward = at({ turn: 2, turning: 40 }, 0.5)
      expect(backward.length).toBe(1)
      expect(backward[0][0][0]).toBeCloseTo(xNow, 9)
      expect(backward[0][1][1]).toBeCloseTo(foot - 3, 9)
      expect(backward[0][2][0]).toBeCloseTo(xNow + 0.25 * hills.w, 9)
      expect(backward[0][2][1]).toBeCloseTo(foot, 9)
      // Still: none.
      expect(at({ turn: 0, turning: 40 }, 0.5)).toEqual([])
      // Past the dial's end it goes on from the other, as thick there as where it left.
      const cut = at({ turn: 1, turning: 40 }, 0.075)
      expect(cut.length).toBe(2)
      const widths = cut.map((shape) => shape[3][0] - shape[0][0])
      expect(widths[0] + widths[1]).toBeCloseTo(0.25 * hills.w, 6)
      const [right, left] = cut[0][0][0] > cut[1][0][0] ? cut : [cut[1], cut[0]]
      expect(left[0][0]).toBeCloseTo(hills.x, 9)
      expect(left[3][0]).toBeCloseTo(xOfYear(0.075, hills), 9)
      expect(left[2][1]).toBeCloseTo(foot - 3, 9)
      expect(right[3][0]).toBeCloseTo(hills.x + hills.w, 9)
      expect(right[2][1]).toBeCloseTo(left[1][1], 9)
      expect(right[1][1]).toBeCloseTo(foot, 9)
      // The drawing is the function's.
      expect(cut).toEqual(seasonsWedge(0.075, 0.25, hills))
    }
  })

  it('names the four seasons under their hills, or the one the year is in where four do not fit', () => {
    // The test's canvas takes five pixels a letter: thirty for a name.
    const upright = draw({ ...SHAPES[1], meters: readings({ year: 0.425 }) })
    expect(upright.words()).toEqual([...SEASON_NAMES])
    const narrow = (year: number) =>
      draw({ width: 150, height: 48, meters: readings({ year }) }).words()
    expect(narrow(0.425)).toEqual(['Summer'])
    expect(narrow(0.525)).toEqual(['Autumn'])
    expect(narrow(0.925)).toEqual(['Winter'])
    expect(narrow(0.025)).toEqual(['Spring'])
    // Each stands under the middle of its hill, and whole on the band.
    const { hills, namesY } = seasonsLayout(SHAPES[1])
    const texts = upright.calls.filter((call) => call.name === 'fillText')
    texts.forEach((call, k) => {
      expect(call.args[1]).toBeCloseTo(xOfYear(kSpringAt + 0.25 * k, hills), 9)
      expect(call.args[2]).toBe(namesY)
    })
    expect(namesY).toBeLessThan(seasonsLayout(SHAPES[1]).tone.y - 2)
  })
})

describe('the tone of Seasons', () => {
  const places = [0, 0.125, 0.25, 0.4, 0.5, 0.75, 0.9]
  const pitches = [40, 97, 311, 1013, 3301, 9007, 14983]

  it('is what the header’s two shelves, its top band, its trims and its Mix do to a sine', () => {
    const tones: SeasonsTone[] = [
      ...places.map((year) => ({ ...TONE, year })),
      { ...TONE, year: 0.5, depth: 0.4 },
      { ...TONE, year: 0.75, mix: 0.5 },
      { ...TONE, year: 0.25, width: 2 },
      { ...TONE, year: 0.75, width: 0 },
      // The left side as the readings carry it: swayed, and its top broken.
      { ...TONE, year: 0.5, side: 0.2, top: 0.3 },
      { ...TONE, year: 0.6, depth: 0.8, mix: 0.7, side: -0.14, top: 0 },
    ]
    for (const tone of tones) {
      for (const hz of pitches) {
        expect(seasonsToneDb(hz, tone, RATE), `${JSON.stringify(tone)} at ${hz} Hz`).toBeCloseTo(
          throughHeader(hz, tone),
          2,
        )
      }
    }
    // Depth at nothing, or Mix at nothing, is the sound as it came in.
    for (const hz of pitches) {
      expect(seasonsToneDb(hz, { ...TONE, year: 0.5, depth: 0 }, RATE)).toBeCloseTo(0, 9)
      expect(seasonsToneDb(hz, { ...TONE, year: 0.5, mix: 0 }, RATE)).toBeCloseTo(0, 9)
    }
  })

  it('is what the compiled device does to a sine with its room, movement and texture off', async () => {
    const P = SEASONS_PARAMS
    const cases: SeasonsTone[] = [
      { ...TONE, year: 0 },
      { ...TONE, year: 0.25 },
      { ...TONE, year: 0.5 },
      { ...TONE, year: 0.75 },
      { ...TONE, year: 0.625, depth: 0.6 },
      { ...TONE, year: 0.5, mix: 0.5 },
      { ...TONE, year: 0.75, width: 2 },
    ]
    for (const tone of cases) {
      for (const hz of [97, 1013, 9007]) {
        const harness = await loadWasmDevice('seasons')
        harness.set(P.turn, 0)
        harness.set(P.year, tone.year)
        harness.set(P.depth, tone.depth)
        harness.set(P.space, 0)
        harness.set(P.motion, 0)
        harness.set(P.grit, 0)
        harness.set(P.width, tone.width)
        harness.set(P.mix, tone.mix)
        // Quiet enough that the ceiling leaves it alone.
        const peak = harness.feedTone(0.5, hz, 0.1, 0.3)
        expect(20 * Math.log10(peak / 0.1), `${JSON.stringify(tone)} at ${hz} Hz`).toBeCloseTo(
          seasonsToneDb(hz, tone, RATE),
          1,
        )
      }
    }
  })

  it('is the level of a held note with the whole of its room in, to the room’s share of a quarter', async () => {
    const P = SEASONS_PARAMS
    const block = 128
    const window = Math.round(0.2 * RATE)
    let least = 0
    let most = 0
    for (const year of [0.125, 0.375, 0.625, 0.875, 0.5]) {
      for (const hz of [97, 311, 1013, 3301]) {
        const harness = await loadWasmDevice('seasons')
        harness.set(P.turn, 0)
        harness.set(P.year, year)
        harness.set(P.depth, 1)
        harness.set(P.space, 1)
        harness.set(P.motion, 0)
        harness.set(P.grit, 0)
        const line = seasonsToneDb(hz, { ...TONE, year }, RATE)
        const input = new Float32Array(block)
        let sum = 0
        let count = 0
        for (let n = 0; n < 5 * RATE; n += block) {
          for (let i = 0; i < block; i++)
            input[i] = 0.1 * Math.sin((2 * Math.PI * hz * (n + i)) / RATE)
          harness.processBlock(input)
          if (n < 2 * RATE) continue
          const left = harness.view(harness.device.device_out_left(), block)
          const right = harness.view(harness.device.device_out_right(), block)
          for (let i = 0; i < block; i++) sum += left[i] * left[i] + right[i] * right[i]
          count += block
          if (count < window) continue
          // Both sides' power against the sine's own, which is half its peak squared on each.
          const over = 10 * Math.log10(sum / count / (0.1 * 0.1)) - line
          least = Math.min(least, over)
          most = Math.max(most, over)
          // A quarter against the sound is 2.5 dB down, a quarter with it 1.9 dB up.
          expect(over, `${hz} Hz held at year ${year}`).toBeGreaterThan(-2.7)
          expect(over, `${hz} Hz held at year ${year}`).toBeLessThan(2.1)
          sum = 0
          count = 0
        }
      }
    }
    // The room is there: it moves the level, by less than it is allowed to.
    expect(most - least).toBeGreaterThan(0.5)
  }, 60000)

  it('draws that tone at the year now, on a scale of 9 dB each way', () => {
    expect(SEASONS_TONE_DB).toBe(9)
    for (const size of SHAPES) {
      const { tone } = seasonsLayout(size)
      for (const values of [
        {},
        { depth: 1, space: 1, width: 0.4 },
        { depth: 0.5, mix: 0.6 },
      ] as Record<string, number>[]) {
        for (const year of [0, 0.3, 0.5, 0.75]) {
          const drawn = draw({ ...size, values, meters: readings({ year }) })
          const lines = tonesOf(drawn, ink)
          expect(lines.length).toBe(1)
          const at: SeasonsTone = {
            year,
            depth: values.depth ?? 0.75,
            width: values.width ?? 1,
            mix: values.mix ?? 1,
          }
          expect(lines[0][0][0]).toBe(tone.x)
          expect(lines[0][lines[0].length - 1][0]).toBeGreaterThan(tone.x + tone.w - 2.01)
          for (const [x, y] of lines[0]) {
            const db = seasonsToneDb(hzOfX(x, tone), at, RATE)
            expect(y).toBeCloseTo(yOfDb(db, tone, 9, -9), 9)
          }
          // Nothing moves and nothing crumbles: the left side is the tone at rest, and is not drawn apart.
          expect(tonesOf(drawn, accent).length).toBe(0)
        }
      }
      // With no Depth or no Mix it lies on the level of none.
      const none: Record<string, number>[] = [{ depth: 0 }, { mix: 0 }]
      for (const values of none) {
        const [flat] = tonesOf(draw({ ...size, values }), ink)
        for (const [, y] of flat) expect(y).toBeCloseTo(tone.y + tone.h / 2, 9)
      }
    }
  })

  it('lights the left side as the device reports it: carried by the sway, its top broken by the crumble', () => {
    const { tone } = seasonsLayout(FLAT)
    const at: SeasonsTone = { year: 0.5, depth: 0.75, width: 1, mix: 1 }
    for (const [sway, crumble] of [
      [0.12, 1],
      [-0.12, 1],
      [0, 0.4],
      [0.05, 0.02],
    ]) {
      const drawn = draw({ meters: readings({ year: 0.5, sway, crumble }) })
      const [lit] = tonesOf(drawn, accent)
      expect(tonesOf(drawn, accent).length).toBe(1)
      for (const [x, y] of lit) {
        const db = seasonsToneDb(hzOfX(x, tone), { ...at, side: sway, top: crumble }, RATE)
        expect(y).toBeCloseTo(yOfDb(Math.max(-33, db), tone, 9, -9), 9)
      }
      // The tone at rest stays under it.
      const [rest] = tonesOf(drawn, ink)
      for (const [x, y] of rest)
        expect(y).toBeCloseTo(yOfDb(seasonsToneDb(hzOfX(x, tone), at, RATE), tone, 9, -9), 9)
    }
    // More of the sound to the left lifts the line by 20·log10(1 + sway) everywhere.
    const lift = (sway: number): number =>
      seasonsToneDb(1000, { ...at, side: sway }, RATE) - seasonsToneDb(1000, at, RATE)
    expect(lift(0.2)).toBeCloseTo(20 * Math.log10(1.2), 9)
    // A broken top takes the band above 900 Hz and leaves the bass.
    const broken = (hz: number): number =>
      seasonsToneDb(hz, { ...at, top: 0.25 }, RATE) - seasonsToneDb(hz, at, RATE)
    // The band is cut from the rest by one pole, which lets a little of the top through with the bass.
    expect(broken(12000)).toBeGreaterThan(20 * Math.log10(0.25))
    expect(broken(12000)).toBeLessThan(20 * Math.log10(0.25) + 2)
    expect(broken(60)).toBeGreaterThan(-0.1)
    // A reading too near rest to be seen apart is not drawn; nor is any at rest, off, or with no Mix.
    expect(tonesOf(draw({ meters: readings({ sway: 0.02 }) }), accent).length).toBe(0)
    expect(tonesOf(draw({ meters: readings({ sway: 0.2 }), powered: false }), accent).length).toBe(
      0,
    )
    expect(
      tonesOf(draw({ values: { mix: 0 }, meters: readings({ sway: 0.2 }) }), accent).length,
    ).toBe(0)
  })
})

describe('the room of Seasons', () => {
  /** The ground under the tone: the one long shape filled in the ink that is not a hill. */
  const groundOf = (drawn: RecordingContext): Path[] =>
    pathsOf(drawn).filter(
      (path) => path.fill === ink && path.stroke === null && path.points.length !== 27,
    )

  it('rings at the top and the bottom as long as the header’s decays say, and the season’s own length between', () => {
    // kDecaySeconds, kHighDecay and kLowDecay; Tails at its middle is the season's own length.
    const decay = [0.5, 3.2, 0.9, 8]
    const highDecay = [0.6, 0.35, 0.25, 0.7]
    const lowDecay = [0.5, 1, 0.8, 0.2]
    for (let k = 0; k < 4; k++) {
      const year = kSpringAt + 0.25 * k
      // A rate so high that a tenth of it lies far past every crossover.
      const ring = (hz: number, tail = 0.5): number => seasonsRingSec(hz, year, tail, 1e9)
      // Far past each crossover the line's own losses are all there is.
      expect(ring(1e8) / (decay[k] * highDecay[k])).toBeCloseTo(1, 3)
      expect(ring(0.01) / (decay[k] * lowDecay[k])).toBeCloseTo(1, 3)
      // Nowhere longer than the season's decay, and Tails stretches it from 0.4 to 2.5 times.
      for (const hz of [50, 200, 1000, 4000, 12000]) {
        expect(seasonsRingSec(hz, year, 0.5, RATE)).toBeLessThanOrEqual(decay[k] * 1.0001)
        expect(seasonsRingSec(hz, year, 1, RATE)).toBeGreaterThan(seasonsRingSec(hz, year, 0, RATE))
      }
      expect(ring(1e8, 0) / ring(1e8, 0.5)).toBeCloseTo(0.4, 3)
      expect(ring(1e8, 1) / ring(1e8, 0.5)).toBeCloseTo(2.5, 3)
    }
  })

  it('is one trip round the header’s eight lines, each run sample by sample on a sine', () => {
    // kLineMs, kHighCrossHz, kLowCrossHz, kTailLeast and kTailSpan, with the decays above.
    const kLineMs = [41.3, 49.7, 59.9, 71.3, 83.9, 97.7, 113.3, 131.9]
    const kDecaySeconds = [0.5, 3.2, 0.9, 8]
    const kHighCrossHz = [6000, 3000, 1600, 5000]
    const kHighDecay = [0.6, 0.35, 0.25, 0.7]
    const kLowCrossHz = [250, 150, 150, 600]
    const kLowDecay = [0.5, 1, 0.8, 0.2]
    const throughLines = (hz: number, year: number, tail: number): number => {
      const w = [0, 1, 2, 3].map((k) => weight(k, year))
      const blend = (table: number[]): number => table.reduce((sum, v, k) => sum + v * w[k], 0)
      const blendLog = (table: number[]): number =>
        Math.exp(table.reduce((sum, v, k) => sum + Math.log(v) * w[k], 0))
      const decay = blendLog(kDecaySeconds) * 0.4 * 6.25 ** tail
      const dampA = Math.exp((-2 * Math.PI * blendLog(kHighCrossHz)) / RATE)
      const cutA = Math.exp((-2 * Math.PI * blendLog(kLowCrossHz)) / RATE)
      // kit::rt60_gain
      const kept = (seconds: number, rt60: number): number => 10 ** ((-3 * seconds) / rt60)
      let lost = 0
      let time = 0
      for (const ms of kLineMs) {
        const seconds = ms / 1000
        const gain = kept(seconds, decay)
        const highLoss = 1 - kept(seconds, decay * blend(kHighDecay)) / gain
        const lowLoss = 1 - kept(seconds, decay * blend(kLowDecay)) / gain
        let damp = 0
        let cut = 0
        let peak = 0
        const total = Math.round(RATE * 0.3)
        for (let n = 0; n < total; n++) {
          const out = Math.sin((2 * Math.PI * hz * n) / RATE)
          damp = out + (damp - out) * dampA
          cut = out + (cut - out) * cutA
          const v = (out - highLoss * (out - damp) - lowLoss * cut) * gain
          if (n > total / 2) peak = Math.max(peak, Math.abs(v))
        }
        lost += Math.log10(peak)
        time += seconds
      }
      return (-3 * time) / lost
    }
    for (const year of [0.125, 0.3, 0.375, 0.625, 0.8, 0.875]) {
      for (const hz of [97, 311, 1013, 3301, 9007]) {
        for (const tail of [0, 0.5, 1]) {
          const ratio = seasonsRingSec(hz, year, tail, RATE) / throughLines(hz, year, tail)
          expect(ratio, `the ring at ${hz} Hz, year ${year}, Tails ${tail}`).toBeCloseTo(1, 3)
        }
      }
    }
  })

  it('rings as long as the compiled device does, by pitch: the mean of twelve pitches about each place', async () => {
    const P = SEASONS_PARAMS
    /** The slope of the level after a burst at `hz`, as seconds to 60 dB down. */
    async function measured(hz: number, year: number, expected: number): Promise<number> {
      const harness = await loadWasmDevice('seasons')
      harness.set(P.turn, 0)
      harness.set(P.year, year)
      harness.set(P.depth, 1)
      harness.set(P.space, 1)
      harness.set(P.motion, 0)
      harness.set(P.grit, 0)
      const block = 128
      const burst = Math.round(0.4 * RATE)
      const from = burst + Math.round(0.15 * RATE)
      const total = from + Math.round(Math.min(12, expected * 0.75) * RATE)
      const window = Math.round(0.02 * RATE)
      const levels: number[] = []
      const input = new Float32Array(block)
      let sum = 0
      let count = 0
      for (let n = 0; n < total; n += block) {
        for (let i = 0; i < block; i++) {
          const at = n + i
          const fade = Math.min(1, at / 480, (burst - at) / 480)
          input[i] = at < burst ? 0.2 * fade * Math.sin((2 * Math.PI * hz * at) / RATE) : 0
        }
        harness.processBlock(input)
        const left = harness.view(harness.device.device_out_left(), block)
        const right = harness.view(harness.device.device_out_right(), block)
        for (let i = 0; i < block; i++) {
          if (n + i < from) continue
          sum += left[i] * left[i] + right[i] * right[i]
          if (++count === window) {
            levels.push(10 * Math.log10(sum / window + 1e-30))
            sum = 0
            count = 0
          }
        }
      }
      // The line of best fit through the levels, in dB a window.
      const m = levels.length
      const meanT = (m - 1) / 2
      const meanL = levels.reduce((a, b) => a + b, 0) / m
      let over = 0
      let under = 0
      levels.forEach((level, i) => {
        over += (i - meanT) * (level - meanL)
        under += (i - meanT) * (i - meanT)
      })
      return -60 / (over / under / 0.02)
    }
    const NEIGHBOURS = 12
    for (const [year, hz] of [
      [0.125, 1000],
      [0.375, 330],
      [0.375, 3000],
      [0.375, 8000],
      [0.625, 330],
      [0.875, 110],
      [0.875, 1000],
      [0.875, 3000],
      [0.5, 1000],
    ]) {
      // One burst rings on the two or three lines of the room nearest its pitch, whose beating
      // moves a single slope by a tenth either way: twelve pitches a seventy-second of an octave
      // apart, each against the formula at its own pitch, and the mean of the twelve.
      let sum = 0
      for (let k = 0; k < NEIGHBOURS; k++) {
        const near = hz * 2 ** ((k - 0.5 * (NEIGHBOURS - 1)) / 72)
        const formula = seasonsRingSec(near, year, 0.5, RATE)
        const got = await measured(near, year, formula)
        expect(got / formula, `the room at ${near} Hz, year ${year}`).toBeGreaterThan(0.75)
        expect(got / formula, `the room at ${near} Hz, year ${year}`).toBeLessThan(1.25)
        sum += got / formula
      }
      expect(sum / NEIGHBOURS, `the room about ${hz} Hz, year ${year}`).toBeGreaterThan(0.93)
      expect(sum / NEIGHBOURS, `the room about ${hz} Hz, year ${year}`).toBeLessThan(1.05)
    }
  }, 60000)

  it('draws that ring under the tone, on a scale of equal ratios from 0.05 to 20 seconds', () => {
    expect([SEASONS_RING_LEAST, SEASONS_RING_MOST]).toEqual([0.05, 20])
    for (const size of SHAPES) {
      const { tone } = seasonsLayout(size)
      const foot = tone.y + tone.h
      expect(yOfRing(0.05, tone)).toBeCloseTo(foot, 9)
      expect(yOfRing(1, tone)).toBeCloseTo(foot - 0.5 * tone.h, 9)
      expect(yOfRing(20, tone)).toBeCloseTo(tone.y, 9)
      for (const [year, tail] of [
        [0, 0.5],
        [0.25, 0.5],
        [0.75, 1],
        [0.6, 0],
      ]) {
        const drawn = draw({ ...size, values: { tail }, meters: readings({ year }) })
        const grounds = groundOf(drawn)
        expect(grounds.length).toBe(1)
        const points = grounds[0].points
        // The last two corners close it along the foot.
        expect(points[points.length - 1]).toEqual([tone.x, foot])
        expect(points[points.length - 2][1]).toBe(foot)
        for (const [x, y] of points.slice(0, -2)) {
          const seconds = seasonsRingSec(hzOfX(x, tone), year, tail, RATE)
          expect(y).toBeCloseTo(foot - (Math.log(seconds / 0.05) / Math.log(400)) * tone.h, 9)
          expect(y).toBeGreaterThanOrEqual(tone.y)
          expect(y).toBeLessThanOrEqual(foot)
        }
      }
    }
  })

  it('lays the ground as strongly as the room is heard, and not at all when it is not', () => {
    expect(ringAlpha(0)).toBe(0)
    expect(ringAlpha(1)).toBeCloseTo(0.38, 9)
    const alpha = (values: Record<string, number>): number | undefined =>
      groundOf(draw({ values }))[0]?.alpha
    // Space, through Depth and Mix.
    expect(alpha({ space: 1, depth: 1, mix: 1 })).toBeCloseTo(ringAlpha(1), 9)
    expect(alpha({})).toBeCloseTo(ringAlpha(0.6 * 0.75), 9)
    expect(alpha({ space: 0.5, depth: 0.5, mix: 0.5 })).toBeCloseTo(ringAlpha(0.125), 9)
    expect(alpha({ space: 0 })).toBeUndefined()
    expect(alpha({ depth: 0 })).toBeUndefined()
    expect(alpha({ mix: 0 })).toBeUndefined()
  })
})

describe('the sparks of Seasons', () => {
  /** The sparks' mark after the display has run on one reading for a second. */
  const sparkOf = (glitter: number, values: Record<string, number> = {}): [number, number][] =>
    dotsOf(runDisplay(display, params, 1, { ...FLAT, values, meters: readings({ glitter }) }), 1.75)

  it('stand as high beside the tone as the one sounding is loud, through the Mix', () => {
    const { tone, sparkX } = seasonsLayout(FLAT)
    const foot = tone.y + tone.h
    expect(sparkX).toBeGreaterThan(tone.x + tone.w)
    expect(sparkX).toBeLessThan(FLAT.width - 4)
    for (const level of [0.1, 0.5, 1]) {
      const [[x, y]] = sparkOf(level)
      expect(x).toBe(sparkX)
      expect(y).toBeCloseTo(foot - level * (tone.h - 3), 6)
    }
    const [[, half]] = sparkOf(0.8, { mix: 0.5 })
    expect(half).toBeCloseTo(foot - 0.4 * (tone.h - 3), 6)
    // None sounding, or none heard: no mark.
    expect(sparkOf(0)).toEqual([])
    expect(sparkOf(0.8, { mix: 0 })).toEqual([])
    expect(dotsOf(draw({ meters: readings({ glitter: 0.8 }), powered: false }), 1.75)).toEqual([])
  })

  it('jump up with a spark and sink back over a tenth of a second', () => {
    const state = display.init?.()
    const { tone } = seasonsLayout(FLAT)
    const foot = tone.y + tone.h
    const heights: number[] = []
    for (let n = 0; n < 12; n++) {
      const drawn = drawDisplay(display, params, {
        ...FLAT,
        state,
        now: 10 + n / 30,
        dt: n === 0 ? 0 : 1 / 30,
        meters: readings({ glitter: n === 1 ? 0.9 : 0 }),
      })
      const [dot] = dotsOf(drawn, 1.75)
      heights.push(dot ? (foot - dot[1]) / (tone.h - 3) : 0)
    }
    expect(heights[0]).toBe(0)
    expect(heights[1]).toBeCloseTo(0.9, 6)
    // A thirtieth of a second later it has sunk by e^(−1/3).
    expect(heights[2]).toBeCloseTo(0.9 * Math.exp(-1 / 3), 6)
    expect(heights[3]).toBeLessThan(heights[2])
    expect(heights[11]).toBeLessThan(0.05)
  })
})

describe('the ring of Seasons', () => {
  it('stands at the Year across and the Depth up, whole on the display in both shapes', () => {
    for (const size of SHAPES) {
      const { hills } = seasonsLayout(size)
      const foot = hills.y + hills.h
      for (const [year, depth] of [
        [0, 0.75],
        [0.3, 1],
        [0.874, 0],
        [0.876, 0.5],
        [1, 1],
      ]) {
        const point = ring({ year, depth }, size)
        expect(point.key).toBe('year')
        expect(point.x).toBeCloseTo(xOfYear(year, hills), 9)
        expect(point.y).toBeCloseTo(foot - depth * hills.h, 9)
        // The kit's ring when it is lit: 4.5 px and half its 1.5 px line.
        expect(point.x - 5.25).toBeGreaterThanOrEqual(0)
        expect(point.x + 5.25).toBeLessThanOrEqual(size.width)
        expect(point.y - 5.25).toBeGreaterThanOrEqual(0)
        expect(point.y + 5.25).toBeLessThanOrEqual(size.height)
      }
      // It has room to travel: the whole band across, and more than 20 px up.
      expect(hills.w).toBeGreaterThan(120)
      expect(hills.h).toBeGreaterThanOrEqual(24)
      // The ring is drawn where the handle is.
      const drawn = draw({ ...size, values: { year: 0.3, depth: 0.4 } })
      const rings = pathsOf(drawn).filter((path) => path.fill === plate && path.stroke === ink)
      expect(rings.length).toBe(1)
      expect(rings[0].arcs[0][0]).toBeCloseTo(xOfYear(0.3, hills), 9)
      expect(rings[0].arcs[0][1]).toBeCloseTo(foot - 0.4 * hills.h, 9)
      expect(rings[0].arcs[0][2]).toBe(3.5)
      // Under the pointer it is lit.
      const hot = pathsOf(draw({ ...size, hot: 'year' })).filter(
        (path) => path.fill === accent && path.stroke === ink,
      )
      expect(hot.length).toBe(1)
      expect(hot[0].arcs[0][2]).toBe(4.5)
    }
  })

  it('sets the Year and the Depth whose ring is under the hand', () => {
    for (const size of SHAPES) {
      const { hills } = seasonsLayout(size)
      const foot = hills.y + hills.h
      const from = ring({}, size)
      for (let i = 0; i <= 20; i++) {
        for (let j = 0; j <= 6; j++) {
          const x = hills.x + (hills.w * i) / 20
          const y = hills.y + (hills.h * j) / 6
          const set = from.drag(x, y)
          expect(Object.keys(set).sort()).toEqual(['depth', 'year'])
          expect(set.year).toBeCloseTo(i / 20, 9)
          expect(set.depth).toBeCloseTo((foot - y) / hills.h, 9)
          const there = ring(set, size)
          expect(there.x).toBeCloseTo(x, 6)
          expect(there.y).toBeCloseTo(y, 6)
        }
      }
      // Past the picture it goes no further than its edge: an end of the dial, no Depth or all of it.
      expect(from.drag(-50, size.height + 50)).toEqual({ year: 0, depth: 0 })
      expect(from.drag(size.width + 50, -50)).toEqual({ year: 1, depth: 1 })
    }
  })

  it('leaves both where they are when it is taken and not moved, and goes home on a double press', () => {
    const settings: Record<string, number>[] = [
      {},
      { year: 1, depth: 0.2 },
      { year: 0.5, depth: 1 },
    ]
    for (const values of settings) {
      const point = ring(values)
      const set = point.drag(point.x, point.y)
      expect(set.year).toBe(values.year ?? 0.125)
      expect(set.depth).toBe(values.depth ?? 0.75)
      // Moved up and down only, the year stays; moved across only, the Depth stays.
      expect(point.drag(point.x, point.y - 4).year).toBe(set.year)
      expect(point.drag(point.x + 9, point.y).depth).toBe(set.depth)
      expect(point.reset?.()).toEqual({ year: 0.125, depth: 0.75 })
    }
  })
})

describe('the face and the readings of Seasons', () => {
  const M = SEASONS_METERS
  const P = SEASONS_PARAMS

  async function device(set: Partial<Record<keyof typeof P, number>>) {
    const harness = await loadWasmDevice('seasons')
    const exports = harness.device as unknown as { device_meter(index: number): number }
    for (const [name, value] of Object.entries(set)) harness.set(P[name as keyof typeof P], value)
    /** Run `seconds` of a steady noise through it, reading the meters after every block. */
    const play = (seconds: number, each?: () => void): void => {
      const block = new Float32Array(128)
      let seed = 12345
      for (let n = 0; n < seconds * RATE; n += 128) {
        for (let i = 0; i < 128; i++) {
          seed = (seed * 1664525 + 1013904223) >>> 0
          block[i] = 0.2 * (seed / 2147483648 - 1)
        }
        harness.processBlock(block)
        each?.()
      }
    }
    return {
      ...harness,
      play,
      meter: (name: keyof typeof M): number => exports.device_meter(M[name].id),
    }
  }

  it('puts Year, Depth, Space and Turn on the face, and reads four readings kept off the plate', () => {
    expect(SEASONS_FACES.seasons.face).toEqual(['year', 'depth', 'space', 'turn'])
    expect(display.place).toBe('strip')
    expect(display.live?.meters).toBe(true)
    expect(Object.keys(M)).toEqual(['year', 'crumble', 'glitter', 'sway'])
    for (const spec of Object.values(M)) expect(spec.display).toBe(true)
  })

  it('has a mark that walks with the device’s own year: forward, backward, through silence, and on from the knob', async () => {
    const { hills } = seasonsLayout(FLAT)
    const markAt = (year: number, knob: number): number =>
      markOf(draw({ values: { year: knob }, meters: readings({ year }) }))
    // Forward from spring, a year in ten seconds: a quarter of it in two and a half, which is summer.
    const forward = await device({ turning: 10, turn: 1 })
    forward.play(2.5)
    expect(forward.meter('year')).toBeCloseTo(0.375, 3)
    expect(markAt(forward.meter('year'), 0.125)).toBeCloseTo(xOfYear(0.375, hills), 1)
    // It turns on while nothing sounds.
    forward.renderSilence(5)
    expect(forward.meter('year')).toBeCloseTo(0.875, 3)
    // Backward from where the knob put it.
    const backward = await device({ turning: 20, turn: 2, year: 0.5 })
    backward.play(2)
    expect(backward.meter('year')).toBeCloseTo(0.4, 3)
    expect(markAt(backward.meter('year'), 0.5)).toBeCloseTo(xOfYear(0.4, hills), 1)
    // Still: on the knob.
    const still = await device({ turn: 0, year: 0.6 })
    still.play(1)
    expect(still.meter('year')).toBeCloseTo(0.6, 5)
  })

  it('reads a whole top band and no sparks at rest, a broken one in autumn, sparks in winter, a sway in summer', async () => {
    const rest = await device({ turn: 0 })
    expect(rest.meter('crumble')).toBe(1)
    expect(rest.meter('glitter')).toBe(0)
    expect(rest.meter('sway')).toBe(0)

    const autumn = await device({ turn: 0, year: 0.625, depth: 1, grit: 1, motion: 0 })
    let least = 1
    let most = 0
    autumn.play(2, () => {
      least = Math.min(least, autumn.meter('crumble'))
      most = Math.max(most, autumn.meter('crumble'))
    })
    // The gain of the band above 900 Hz: never more than whole, never under nothing.
    expect(most).toBeLessThanOrEqual(1)
    expect(least).toBeGreaterThanOrEqual(0)
    expect(least).toBeLessThan(0.5)
    expect(autumn.meter('glitter')).toBe(0)

    const winter = await device({ turn: 0, year: 0.875, depth: 1, grit: 1, motion: 0 })
    let loudest = 0
    winter.play(2, () => {
      loudest = Math.max(loudest, winter.meter('glitter'))
    })
    // Winter's sparks at Grit 1: the bell of the one sounding, times its own level of 0.5 to 1.
    expect(loudest).toBeGreaterThan(0.4)
    expect(loudest).toBeLessThanOrEqual(2)

    // kSway: 0.2 of the level in summer at Motion 1, on a sine of 0.19 Hz.
    const summer = await device({ turn: 0, year: 0.375, depth: 1, motion: 1 })
    let left = 0
    let right = 0
    summer.play(6, () => {
      left = Math.max(left, summer.meter('sway'))
      right = Math.min(right, summer.meter('sway'))
    })
    // The tumble's 0.02 rides on it.
    expect(left).toBeGreaterThan(0.18)
    expect(left).toBeLessThanOrEqual(0.2 + 0.02 + 1e-3)
    expect(right).toBeLessThan(-0.18)
    expect(right).toBeGreaterThanOrEqual(-0.2 - 0.02 - 1e-3)
    // Asleep again it reads rest.
    summer.renderSilence(20)
    expect(summer.meter('crumble')).toBe(1)
    expect(summer.meter('sway')).toBe(0)
  })
})
