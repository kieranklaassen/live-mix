// The display of Size against the device it shows: the outlines it draws are
// checked against the sum `cpp/devices/size/size.h` does for each bin, the two
// points against the values they set, and what is drawn from the device's
// readings against the readings.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  SIZE_BODY_FIRST_HZ,
  SIZE_BODY_POINTS,
  SIZE_BODY_STEP_OCTAVES,
  SIZE_FACES,
  SIZE_FOOT_DB,
  SIZE_LEAST_GAIN_DB,
  SIZE_MAX_HZ,
  SIZE_METER_FLOOR_DB,
  SIZE_MIDDLE_HZ,
  SIZE_MIN_HZ,
  SIZE_MOST_GAIN_DB,
  SIZE_MOST_OCTAVES,
  SIZE_OCTAVES,
  SIZE_SPECTRUM_DB,
  SIZE_TILT_DB_PER_OCTAVE,
  SIZE_TILT_MOST_DB,
  SIZE_TILT_PIVOT_HZ,
  SIZE_TOP_DB,
  SIZE_WANDER_OCTAVES,
  SIZE_WIDTH_OCTAVES,
  sizeBodyDb,
  sizeBodyHz,
  sizeExampleDb,
  sizeLayout,
  sizeMovedDb,
  sizeOctavesAt,
  sizeSideOctaves,
  sizeTiltDb,
  sizeX,
} from '../components/displays/size'
import { type DisplayHandle } from '../components/plate-display'
import {
  drawDisplay,
  metersOf,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const ACCENT = PLAIN_COLOURS.accent
const INK = PLAIN_COLOURS.ink

const descriptor = stockDescriptors().get('size')
if (!descriptor) throw new Error('size is not a stock device')
const display = SIZE_FACES.size.display
const params = descriptor.params
const meters = metersOf(descriptor.meters)

/** The window as the plate gives it, and the picture in it. */
const view = viewOf(display, params)
const { plot, bodyY, notesY } = sizeLayout(view)
/** So many pixels to an octave on the picture's scale. */
const PER_OCTAVE = plot.w / Math.log2(SIZE_MAX_HZ / SIZE_MIN_HZ)

function handleOf(key: string, values: Record<string, number> = {}): DisplayHandle {
  const found = display.handles?.(viewOf(display, params, { values })).find((h) => h.key === key)
  if (!found) throw new Error(`size has no handle ${key}`)
  return found
}

/** Readings of a body: `db(hz)` at the frequencies the device reports, and the rest as given. */
function readings(
  db: (hz: number) => number,
  rest: Record<string, number> = {},
): Record<string, number> {
  const body: Record<string, number> = {}
  for (let point = 0; point < SIZE_BODY_POINTS; point++)
    body[`body${point + 1}`] = db(sizeBodyHz(point))
  return { ...meters, ...body, ...rest }
}

/** A body that falls 6 dB an octave from -20 dB at 80 Hz. */
const slope = (hz: number): number => -20 - 6 * Math.log2(hz / 80)
/** One with a hill of 20 dB on a level of -50 dB, at the thirteenth frequency the device reports (905 Hz). */
const HILL_HZ = sizeBodyHz(12)
const hill = (hz: number): number =>
  -50 + 20 * Math.exp(-0.5 * Math.pow(Math.log2(hz / HILL_HZ) / 0.5, 2))

interface Line {
  colour: string
  alpha: number
  dashed: boolean
  points: [number, number][]
}

/** The lines a drawing stroked, each with its points. */
function linesOf(drawn: RecordingContext): Line[] {
  const lines: Line[] = []
  let stroke = ''
  let alpha = 1
  let dashed = false
  let path: [number, number][] = []
  for (const { name, args } of drawn.calls) {
    const n = args as number[]
    if (name === 'set strokeStyle') stroke = String(args[0])
    else if (name === 'set globalAlpha') alpha = Number(args[0])
    else if (name === 'setLineDash') dashed = (args[0] as number[]).length > 0
    else if (name === 'beginPath') path = []
    else if (name === 'moveTo' || name === 'lineTo') path.push([n[0], n[1]])
    else if (name === 'stroke') lines.push({ colour: stroke, alpha, dashed, points: path })
  }
  return lines
}

/** The outlines among them: lines with a point every second pixel across the picture. */
const outlinesOf = (drawn: RecordingContext): Line[] =>
  linesOf(drawn).filter((line) => line.points.length === Math.floor(plot.w / 2) + 1)

/** The dots a drawing filled in a colour: [x, y, radius]. */
function dotsOf(drawn: RecordingContext, colour: string): [number, number, number][] {
  const dots: [number, number, number][] = []
  let fill = ''
  let arc: [number, number, number] | null = null
  for (const { name, args } of drawn.calls) {
    const n = args as number[]
    if (name === 'set fillStyle') fill = String(args[0])
    else if (name === 'beginPath') arc = null
    else if (name === 'arc') arc = [n[0], n[1], n[2]]
    else if (name === 'fill' && arc && fill === colour) dots.push(arc)
  }
  return dots
}

/** Where the picture puts a level of the outline: the device's dB on the spectrum's scale. */
const yOf = (db: number): number =>
  Math.min(
    plot.y + plot.h,
    Math.max(
      plot.y,
      plot.y + ((SIZE_TOP_DB - (db + SIZE_SPECTRUM_DB)) / (SIZE_TOP_DB - SIZE_FOOT_DB)) * plot.h,
    ),
  )
const hzAt = (x: number): number =>
  SIZE_MIN_HZ * Math.pow(SIZE_MAX_HZ / SIZE_MIN_HZ, (x - plot.x) / plot.w)
const xAt = (hz: number): number =>
  plot.x + (Math.log(hz / SIZE_MIN_HZ) / Math.log(SIZE_MAX_HZ / SIZE_MIN_HZ)) * plot.w

const draw = (options: FrameOptions = {}): RecordingContext =>
  drawDisplay(display, params, { meters, dt: 1 / 30, ...options })

describe('Size', () => {
  it('keeps the numbers of size.h', () => {
    // kSizeOctaves, kWanderOctaves, kWidthOctaves, kMostOctaves.
    expect([SIZE_OCTAVES, SIZE_WANDER_OCTAVES, SIZE_WIDTH_OCTAVES, SIZE_MOST_OCTAVES]).toEqual([
      1, 0.75, 0.25, 1.5,
    ])
    // kMostLift and kLeastLift are log2 of an amplitude: 2.9897353 and -3.9863137, times 6.0206 dB.
    expect(SIZE_MOST_GAIN_DB).toBeCloseTo(2.9897353 * 6.0206, 3)
    expect(SIZE_LEAST_GAIN_DB).toBeCloseTo(-3.9863137 * 6.0206, 3)
    // kTiltDbPerOctave, kTiltMostDb, kTiltPivotHz.
    expect([SIZE_TILT_DB_PER_OCTAVE, SIZE_TILT_MOST_DB, SIZE_TILT_PIVOT_HZ]).toEqual([
      4.5, 18, 1000,
    ])
    // kBodyPoints, kBodyFirstHz, kBodyStepOctaves, kMeterFloorDb, and the readings the manifest names.
    expect([SIZE_BODY_POINTS, SIZE_BODY_FIRST_HZ, SIZE_BODY_STEP_OCTAVES]).toEqual([24, 40, 0.375])
    expect(SIZE_METER_FLOOR_DB).toBe(-120)
    // meter() reads a full-scale sine's bin (kFullScale) as 0 dB; the analyser behind reads it as 0.42 / 2.
    expect(SIZE_SPECTRUM_DB).toBeCloseTo(-13.556, 3)
    expect(Object.keys(descriptor.meters ?? {})).toEqual([
      'sizeLeft',
      'sizeRight',
      'level',
      ...Array.from({ length: 24 }, (_, point) => `body${point + 1}`),
    ])
    // The ranges the sums below lean on.
    expect([params.size.min, params.size.max]).toEqual([-1, 1])
    expect([params.pitch.min, params.pitch.max]).toEqual([-12, 12])
  })

  it('reads the outline where meter() takes it: every three eighths of an octave from 40 Hz', () => {
    expect(sizeBodyHz(0)).toBe(40)
    expect(sizeBodyHz(8)).toBeCloseTo(320, 9)
    expect(sizeBodyHz(23)).toBeCloseTo(40 * Math.pow(2, 8.625), 6)
    const body = Float32Array.from({ length: 24 }, (_, point) => -10 - 3 * point)
    // On a reading it is the reading, between two it is straight over octaves, past the ends the end.
    expect(sizeBodyDb(body, sizeBodyHz(5))).toBeCloseTo(-25, 5)
    expect(sizeBodyDb(body, sizeBodyHz(5) * Math.pow(2, 0.375 / 2))).toBeCloseTo(-26.5, 5)
    expect(sizeBodyDb(body, 10)).toBe(-10)
    expect(sizeBodyDb(body, 22000)).toBe(-79)
  })

  it('tilts as update_tilt() does: 4.5 dB an octave about 1 kHz at Tone 1, 18 dB at the most', () => {
    expect(sizeTiltDb(1000, 1)).toBeCloseTo(0, 9)
    expect(sizeTiltDb(2000, 1)).toBeCloseTo(4.5, 9)
    expect(sizeTiltDb(250, 1)).toBeCloseTo(-9, 9)
    expect(sizeTiltDb(250, -0.5)).toBeCloseTo(4.5, 9)
    expect(sizeTiltDb(20000, 1)).toBe(18)
    expect(sizeTiltDb(40, 1)).toBe(-18)
    expect(sizeTiltDb(4000, 0)).toBeCloseTo(0, 9)
  })

  it('moves the outline as frame() does: the body an octave larger has at f what it had at 2f', () => {
    const body = Float32Array.from({ length: 24 }, (_, point) => hill(sizeBodyHz(point)))
    for (const hz of [200, 500, 1000, 3000]) {
      // Size alone: the outline slid down the scale by its octaves.
      expect(sizeMovedDb(body, hz, 1, 0, 0, 0)).toBeCloseTo(sizeBodyDb(body, hz * 2), 6)
      expect(sizeMovedDb(body, hz, -0.5, 0, 0, 0)).toBeCloseTo(sizeBodyDb(body, hz / Math.SQRT2), 6)
      // Nothing moved is the outline itself, and the level made up is added whole.
      expect(sizeMovedDb(body, hz, 0, 0, 0, 0)).toBeCloseTo(sizeBodyDb(body, hz), 6)
      expect(sizeMovedDb(body, hz, 0, 0, 0, -2.5)).toBeCloseTo(sizeBodyDb(body, hz) - 2.5, 6)
      // The notes moved and the body kept: whatever Pitch, it is the outline where it stood.
      expect(sizeMovedDb(body, hz, 0, 7, 0, 0)).toBeCloseTo(sizeBodyDb(body, hz), 6)
      expect(sizeMovedDb(body, hz, 1, -12, 0, 0)).toBeCloseTo(sizeBodyDb(body, hz * 2), 6)
      // Tone lies on top.
      expect(sizeMovedDb(body, hz, 1, 0, -1, 0)).toBeCloseTo(
        sizeBodyDb(body, hz * 2) - 4.5 * Math.log2(hz / 1000),
        6,
      )
    }
    // No bin is given more than 18 dB or less than -24: a step of 40 dB moved an octave.
    const step = Float32Array.from({ length: 24 }, (_, point) =>
      sizeBodyHz(point) < 1000 ? -70 : -30,
    )
    expect(sizeMovedDb(step, 700, 1, 0, 0, 0)).toBeCloseTo(-70 + 18, 6)
    expect(sizeMovedDb(step, 1400, -1, 0, 0, 0)).toBeCloseTo(-30 - 24, 6)
  })

  it('sets the two sides apart as size_of() does: a quarter octave each at Width 1', () => {
    expect(sizeSideOctaves(0.4, 0, 0)).toBeCloseTo(0.4, 9)
    expect(sizeSideOctaves(0.4, 0, 1)).toBeCloseTo(0.4, 9)
    expect(sizeSideOctaves(0.4, 1, 0)).toBeCloseTo(0.15, 9)
    expect(sizeSideOctaves(0.4, 1, 1)).toBeCloseTo(0.65, 9)
    expect(sizeSideOctaves(-1, 0.5, 0)).toBeCloseTo(-1.125, 9)
  })

  it('stands the upper point where Size has slid the body: larger is down the scale', () => {
    // The scale: 80 Hz to 7.24 kHz across the picture, with nothing moved at its middle.
    expect(sizeX(0, plot)).toBeCloseTo(plot.x + plot.w / 2, 6)
    expect(SIZE_MIDDLE_HZ).toBeCloseTo(761.05, 1)
    const middle = plot.x + plot.w / 2
    expect(handleOf('size', { size: 0 }).x).toBeCloseTo(middle, 6)
    expect(handleOf('size').x).toBeCloseTo(middle - 0.4 * PER_OCTAVE, 6)
    expect(handleOf('size', { size: -1 }).x).toBeCloseTo(middle + PER_OCTAVE, 6)
    expect(handleOf('size').y).toBe(bodyY)
    // It has room to be set by hand.
    expect(handleOf('size', { size: -1 }).x - handleOf('size', { size: 1 }).x).toBeGreaterThan(30)
  })

  it('takes the upper point to the size it is dragged to, and no further than the knob goes', () => {
    const at = handleOf('size')
    expect(at.drag(sizeX(-0.75, plot), 0).size).toBeCloseTo(0.75, 6)
    expect(at.drag(sizeX(0.25, plot), 60).size).toBeCloseTo(-0.25, 6)
    expect(at.drag(plot.x, 0).size).toBe(1)
    expect(at.drag(plot.x + plot.w, 0).size).toBe(-1)
    expect(at.reset?.()).toEqual({ size: 0.4 })
    expect(sizeOctavesAt(sizeX(0.6, plot), plot)).toBeCloseTo(0.6, 9)
  })

  it('stands the lower point where the notes are, Fine with Pitch, and sets whole semitones', () => {
    const middle = plot.x + plot.w / 2
    expect(handleOf('pitch').x).toBeCloseTo(middle, 6)
    expect(handleOf('pitch').y).toBe(notesY)
    expect(handleOf('pitch', { pitch: 7 }).x).toBeCloseTo(middle + (7 / 12) * PER_OCTAVE, 6)
    expect(handleOf('pitch', { pitch: -12, fine: 50 }).x).toBeCloseTo(
      middle - (11.5 / 12) * PER_OCTAVE,
      6,
    )
    const at = handleOf('pitch')
    expect(at.drag(sizeX(-5 / 12, plot), 0)).toEqual({ pitch: -5 })
    expect(at.drag(sizeX(7.4 / 12, plot), 0)).toEqual({ pitch: 7 })
    expect(at.drag(plot.x, 0)).toEqual({ pitch: -12 })
    expect(at.drag(plot.x + plot.w, 0)).toEqual({ pitch: 12 })
    expect(at.reset?.()).toEqual({ pitch: 0 })
    // With Fine up, the point is dragged to where the notes are to stand and Pitch makes up the rest.
    const tuned = handleOf('pitch', { fine: 40 })
    expect(tuned.drag(sizeX(3.4 / 12, plot), 0)).toEqual({ pitch: 3 })
    expect(
      handleOf('pitch', { pitch: 12 }).x - handleOf('pitch', { pitch: -12 }).x,
    ).toBeGreaterThan(30)
  })

  it('draws the body the device reports, dashed, and the body moved by the sum, solid', () => {
    const live = readings(hill, { sizeLeft: 0.6, sizeRight: 0.6, level: -1.5 })
    const body = Float32Array.from({ length: 24 }, (_, point) => hill(sizeBodyHz(point)))
    const outlines = outlinesOf(draw({ meters: live, values: { size: 0.6, tone: 0.5 } }))
    expect(outlines).toHaveLength(2)
    const [stands, moved] = outlines
    expect(stands.dashed).toBe(true)
    expect(stands.colour).toBe(INK)
    expect(moved.dashed).toBe(false)
    expect(moved.colour).toBe(ACCENT)
    for (const [x, y] of stands.points) expect(y).toBeCloseTo(yOf(sizeBodyDb(body, hzAt(x))), 4)
    for (const [x, y] of moved.points)
      expect(y).toBeCloseTo(yOf(sizeMovedDb(body, hzAt(x), 0.6, 0, 0.5, -1.5)), 4)
    // The hill stands where it is in the dashed outline and 0.6 octaves down the scale in the solid one.
    const peakX = (line: Line): number => line.points.reduce((a, b) => (b[1] < a[1] ? b : a))[0]
    const plain = outlinesOf(draw({ meters: readings(hill, { sizeLeft: 0.6, sizeRight: 0.6 }) }))
    expect(Math.abs(peakX(plain[0]) - xAt(HILL_HZ))).toBeLessThanOrEqual(2)
    expect(Math.abs(peakX(plain[1]) - xAt(HILL_HZ / Math.pow(2, 0.6)))).toBeLessThanOrEqual(2)
  })

  it('follows the size the device reports and not the knob: the drift moves the outline', () => {
    const body = Float32Array.from({ length: 24 }, (_, point) => hill(sizeBodyHz(point)))
    const drifted = draw({ meters: readings(hill, { sizeLeft: -0.35, sizeRight: -0.35 }) })
    const [, moved] = outlinesOf(drifted)
    for (const [x, y] of moved.points)
      expect(y).toBeCloseTo(yOf(sizeMovedDb(body, hzAt(x), -0.35, 0, 0, 0)), 4)
    // A dot in the second colour stands in the body's row where the body is now.
    const dots = dotsOf(drifted, ACCENT)
    expect(dots).toHaveLength(1)
    expect(dots[0][0]).toBeCloseTo(sizeX(0.35, plot), 4)
    expect(dots[0][1]).toBe(bodyY)
    // And the words say how many times as large it is.
    expect(drifted.words()).toContain(`×${Math.pow(2, -0.35).toFixed(2)}`)
  })

  it('draws each side its own outline once Width sets them apart', () => {
    const body = Float32Array.from({ length: 24 }, (_, point) => hill(sizeBodyHz(point)))
    const wide = draw({
      meters: readings(hill, { sizeLeft: 0.15, sizeRight: 0.65 }),
      values: { width: 1 },
    })
    const outlines = outlinesOf(wide)
    expect(outlines).toHaveLength(3)
    const [, right, left] = outlines
    expect(right.alpha).toBeCloseTo(0.75, 6)
    expect(left.alpha).toBe(1)
    for (const [x, y] of left.points)
      expect(y).toBeCloseTo(yOf(sizeMovedDb(body, hzAt(x), 0.15, 0, 0, 0)), 4)
    for (const [x, y] of right.points)
      expect(y).toBeCloseTo(yOf(sizeMovedDb(body, hzAt(x), 0.65, 0, 0, 0)), 4)
    const dots = dotsOf(wide, ACCENT)
    const across = dots.map((dot) => dot[0]).sort((a, b) => a - b)
    expect(across).toHaveLength(2)
    expect(across[0]).toBeCloseTo(sizeX(-0.65, plot), 4)
    expect(across[1]).toBeCloseTo(sizeX(-0.15, plot), 4)
  })

  it('keeps the notes where Pitch puts them in the moved outline: the body stays', () => {
    const body = Float32Array.from({ length: 24 }, (_, point) => hill(sizeBodyHz(point)))
    const [stands, moved] = outlinesOf(
      draw({
        meters: readings(hill, { sizeLeft: 0, sizeRight: 0 }),
        values: { size: 0, pitch: 7 },
      }),
    )
    // The gain is worked out against the outline the moved notes carry; what comes out is the body as it was.
    for (let n = 0; n < moved.points.length; n++) {
      expect(moved.points[n][1]).toBeCloseTo(yOf(sizeBodyDb(body, hzAt(moved.points[n][0]))), 4)
      expect(moved.points[n][1]).toBeCloseTo(stands.points[n][1], 4)
    }
  })

  it('draws no moved outline and no dot at Mix 0, where none of it is heard', () => {
    const dry = draw({
      meters: readings(hill, { sizeLeft: 0.4, sizeRight: 0.4 }),
      values: { mix: 0 },
    })
    const outlines = outlinesOf(dry)
    expect(outlines).toHaveLength(1)
    expect(outlines[0].dashed).toBe(true)
    expect(dotsOf(dry, ACCENT)).toHaveLength(0)
  })

  it('shows a worked example while nothing sounds, in the ink, moved by the knobs', () => {
    const example = Float32Array.from({ length: 24 }, (_, point) =>
      sizeExampleDb(sizeBodyHz(point)),
    )
    // Asleep the device reports nothing of the outline; the size it reports still runs.
    const silent = readings(() => SIZE_METER_FLOOR_DB, { sizeLeft: 0.4, sizeRight: 0.4 })
    for (const drawn of [draw({ meters: silent }), drawDisplay(display, params, { meters })]) {
      const [stands, moved] = outlinesOf(drawn)
      expect(moved.colour).toBe(INK)
      for (const [x, y] of stands.points)
        expect(y).toBeCloseTo(yOf(sizeBodyDb(example, hzAt(x))), 4)
      for (const [x, y] of moved.points)
        expect(y).toBeCloseTo(yOf(sizeMovedDb(example, hzAt(x), 0.4, 0, 0, 0)), 4)
    }
    // The example has its two hills: 700 Hz stands over 300 Hz and 1.6 kHz, 3 kHz over 1.6 kHz.
    expect(sizeExampleDb(700)).toBeGreaterThan(sizeExampleDb(300) + 4)
    expect(sizeExampleDb(700)).toBeGreaterThan(sizeExampleDb(1600) + 8)
    expect(sizeExampleDb(3000)).toBeGreaterThan(sizeExampleDb(1600) + 3)
  })

  it('is a still picture of the settings when there is no sound', () => {
    const settings: Record<string, number>[] = [
      {},
      { size: -1, pitch: 5, wander: 1, width: 1, tone: -1 },
    ]
    for (const values of settings) {
      const one = drawDisplay(display, params, { meters, values, now: 10 })
      const other = drawDisplay(display, params, { meters, values, now: 73.4 })
      expect(other.print()).toBe(one.print())
    }
  })

  it('marks the rows: how far Wander carries the body, and where Width sets the sides', () => {
    const bars = (values: Record<string, number>): [number, number][] => {
      const found: [number, number][] = []
      for (const { name, args } of drawDisplay(display, params, { meters, values }).calls) {
        const n = args as number[]
        if (name === 'fillRect' && n[3] === 3 && n[1] === bodyY - 1.5)
          found.push([n[0], n[0] + n[2]])
      }
      return found
    }
    expect(bars({})).toHaveLength(0)
    // Wander at 1 carries the body three quarters of an octave either way from where the knob stands.
    const [bar] = bars({ size: 0.2, wander: 1 })
    expect(bar[0]).toBeCloseTo(sizeX(-0.2 - 0.75, plot), 4)
    expect(bar[1]).toBeCloseTo(sizeX(-0.2 + 0.75, plot), 4)
    const [half] = bars({ size: 0.2, wander: 0.5 })
    expect(half[1] - half[0]).toBeCloseTo(0.75 * PER_OCTAVE, 4)
    // Never past an octave and a half, the most the device lets the size be.
    const [far] = bars({ size: 1, wander: 1 })
    expect(far[0]).toBeCloseTo(sizeX(-1.5, plot), 4)

    // Width: an upright tick for each side, a quarter octave from the knob at the most.
    const ticks = (values: Record<string, number>): number[] =>
      linesOf(drawDisplay(display, params, { meters, values }))
        .filter(
          (line) =>
            line.points.length === 2 &&
            line.alpha === 1 &&
            line.points[0][0] === line.points[1][0] &&
            line.points[0][1] === bodyY - 3,
        )
        .map((line) => line.points[0][0])
    expect(ticks({})).toHaveLength(0)
    // A rule is drawn on the pixel grid: within half a pixel of the place.
    const sides = ticks({ size: 0, width: 1 }).sort((a, b) => a - b)
    expect(sides).toHaveLength(2)
    expect(Math.abs(sides[0] - sizeX(-0.25, plot))).toBeLessThanOrEqual(0.5)
    expect(Math.abs(sides[1] - sizeX(0.25, plot))).toBeLessThanOrEqual(0.5)
  })

  it('says the size and the notes in words', () => {
    const words = (values: Record<string, number>): string[] =>
      drawDisplay(display, params, { meters, values }).words()
    expect(words({})).toEqual(expect.arrayContaining(['BODY', '×1.32', 'NOTES', '0 st']))
    expect(words({ size: -1 })).toContain('×0.50')
    expect(words({ size: 1, pitch: 7 })).toEqual(expect.arrayContaining(['×2.00', '+7 st']))
    expect(words({ pitch: -5 })).toContain('−5 st')
    expect(words({ pitch: 0, fine: 12 })).toContain('+0.12 st')
    expect(words({ pitch: -3, fine: 25 })).toContain('−2.75 st')
    // Width leaves the middle of the two sides where Size put it.
    expect(words({ size: 0.4, width: 1 })).toContain('×1.32')
  })

  it('makes no new points for its outlines from one frame to the next', () => {
    const state = display.init?.() as { stands: unknown[]; left: unknown[]; right: unknown[] }
    const options = {
      signal: testSignal(),
      meters: readings(slope, { sizeLeft: 0.3, sizeRight: 0.5 }),
      state,
    }
    runDisplay(display, params, 0.2, options)
    const before = {
      stands: state.stands,
      first: state.stands[0],
      left: state.left,
      right: state.right,
    }
    runDisplay(display, params, 0.2, { ...options, values: { size: -0.5, pitch: 3 } })
    expect(state.stands).toBe(before.stands)
    expect(state.stands[0]).toBe(before.first)
    expect(state.left).toBe(before.left)
    expect(state.right).toBe(before.right)
  })

  it('names the four knobs on the face', () => {
    expect(SIZE_FACES.size.face).toEqual(['size', 'pitch', 'wander', 'mix'])
    for (const name of SIZE_FACES.size.face ?? []) expect(params[name]).toBeDefined()
  })
})
