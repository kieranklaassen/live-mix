// The truth of Howl's display: the curve and the posts against the loop's own
// rates (`cpp/devices/howl/howl.h`), the points against the knobs they set, the
// singing tones against the device's readings, and the compiled device itself
// against what is drawn of it.

import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../core/params'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { INK, PLAIN_COLOURS, xOfHz, yOfDb, type Box } from '../components/display-kit'
import {
  HOWL_BEST_WALK,
  HOWL_CENTRE_MAX_HZ,
  HOWL_CENTRE_MIN_HZ,
  HOWL_CENTRE_OVER_NOTE,
  HOWL_DUCK_DB,
  HOWL_EDGE_HARMONICS,
  HOWL_FACES,
  HOWL_FOOT_ROOM,
  HOWL_MAX_HZ,
  HOWL_MIN_HZ,
  HOWL_POSTS_APART,
  HOWL_RATE_CURVE,
  HOWL_RATE_MAX,
  HOWL_SETTLED_CENTS,
  HOWL_SOUND_FOOT_DB,
  HOWL_TILT_RATIO,
  HOWL_TRIP_MAX_DB,
  howlBoxes,
  howlCentreHz,
  howlCentreIn,
  howlDucked,
  howlEdgeShare,
  howlFundamentalHz,
  howlGainAtY,
  howlHeard,
  howlKnobOf,
  howlLoopRate,
  howlNote,
  howlOvertone,
  howlPosts,
  howlRate,
  howlRateAt,
  howlRateText,
  howlSettled,
  howlShape,
  howlYOfRate,
} from '../components/displays/howl'
import { type DisplayHandle } from '../components/plate-display'
import {
  displaySize,
  drawDisplay,
  patchUnder,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const RATE = 48000
const { display } = HOWL_FACES.howl
const params: Readonly<Record<string, ParamSpec>> = stockDescriptors().get('howl')?.params ?? {}
const size = displaySize(display)
/** The two shapes a plate hands the display: flat beside four knobs, and upright over eight. */
const SHAPES: readonly (readonly [number, number])[] = [
  [size.width, size.height],
  [204, 100],
]

const handles = (
  values: Record<string, number> = {},
  width = size.width,
  height = size.height,
): readonly DisplayHandle[] =>
  display.handles?.(viewOf(display, params, { values, width, height })) ?? []
const draw = (options: FrameOptions = {}): RecordingContext => drawDisplay(display, params, options)
/** The device's readings with nothing singing. */
const QUIET = {
  level: 0,
  pitch: 0,
  levelRight: 0,
  pitchRight: 0,
  centre: 0,
  centreRight: 0,
  ducked: 0,
}
const run = (
  seconds: number,
  values: Record<string, number>,
  meters: Partial<typeof QUIET>,
  more: FrameOptions = {},
): RecordingContext =>
  runDisplay(display, params, seconds, {
    values,
    meters: { ...QUIET, ...meters },
    signal: testSignal(),
    ...more,
  })

interface Shape {
  op: 'stroke' | 'fill'
  points: [number, number][]
  width: number
  alpha: number
  colour: string
}

/** Every path stroked or filled, with the pen it was drawn with. */
function shapes(drawn: RecordingContext): Shape[] {
  const found: Shape[] = []
  let points: [number, number][] = []
  const pen: Record<string, unknown> = { lineWidth: 1, globalAlpha: 1 }
  for (const call of drawn.calls) {
    if (call.name.startsWith('set ')) pen[call.name.slice(4)] = call.args[0]
    else if (call.name === 'beginPath') points = []
    else if (call.name === 'moveTo' || call.name === 'lineTo')
      points.push([call.args[0] as number, call.args[1] as number])
    else if (call.name === 'stroke' || call.name === 'fill')
      found.push({
        op: call.name,
        points,
        width: pen.lineWidth as number,
        alpha: pen.globalAlpha as number,
        colour: String(call.name === 'stroke' ? pen.strokeStyle : pen.fillStyle),
      })
  }
  return found
}

const strokes = (drawn: RecordingContext): Shape[] =>
  shapes(drawn).filter((shape) => shape.op === 'stroke')
/** The left side's curve, through the tops of its overtones: the one long line in the ink at full strength. */
function curveOf(drawn: RecordingContext): [number, number][] {
  const curves = strokes(drawn).filter(
    (shape) => shape.width === 1.5 && shape.points.length > 2 && shape.colour === PLAIN_COLOURS.ink,
  )
  expect(curves.length, 'one curve in front').toBe(1)
  return curves[0].points
}
/** Upright lines of two points: the posts and the singing tones. */
const uprights = (drawn: RecordingContext, colour: string): Shape[] =>
  strokes(drawn).filter(
    (shape) =>
      shape.colour === colour &&
      shape.points.length === 2 &&
      Math.abs(shape.points[0][0] - shape.points[1][0]) < 1e-9,
  )

const xOf = (hz: number, plot: Box): number => xOfHz(hz, plot, HOWL_MIN_HZ, HOWL_MAX_HZ)
const yOfSound = (gain: number, plot: Box): number =>
  yOfDb(20 * Math.log10(gain), plot, 0, HOWL_SOUND_FOOT_DB)
const yOfRate = (rate: number, plot: Box): number => howlYOfRate(rate, plot)

describe("the loop's numbers, as howl.h has them", () => {
  it('maps Gain to a rate of dying or growing, nothing at the middle and 240 dB a second at the ends', () => {
    expect(HOWL_RATE_MAX).toBe(240) // kRateMax
    expect(HOWL_RATE_CURVE).toBe(3.5) // kRateCurve
    // `rate_of` in howl.h, as the compiled header gives it.
    const device: readonly (readonly [number, number])[] = [
      [0, -240],
      [0.1, -115.41844],
      [0.25, -35.53133],
      [0.42, -5.60981],
      [0.5, 0],
      [0.62, 9.83726],
      [0.75, 35.53133],
      [0.85, 79.12715],
      [1, 240],
    ]
    for (const [gain, rate] of device) {
      expect(howlRate(gain), `Gain ${gain}`).toBeCloseTo(rate, 3)
      expect(howlKnobOf(howlRate(gain)), `Gain ${gain}`).toBeCloseTo(gain, 9)
    }
    // Every twentieth of the knob is a different rate, and a greater one.
    for (let step = 1; step <= 20; step++)
      expect(howlRate(step / 20) - howlRate((step - 1) / 20)).toBeGreaterThan(1.5)
    expect(howlRate(-1)).toBe(-240)
    expect(howlRate(2)).toBe(240)
    expect(howlKnobOf(1000)).toBeGreaterThan(1)
    expect(howlKnobOf(-1000)).toBeLessThan(0)
  })

  it('gives a long loop no more than 6 dB a turn', () => {
    expect(HOWL_TRIP_MAX_DB).toBe(6) // kTripMaxDb
    // `trip_db` in howl.h: [Gain, Distance in ms, dB a turn].
    const device: readonly (readonly [number, number, number])[] = [
      [0.3, 1, -0.022832],
      [0.85, 1, 0.079127],
      [1, 1, 0.24],
      [0.3, 7.645, -0.174548],
      [0.85, 7.645, 0.604927],
      [1, 7.645, 1.8348],
      [0.85, 15.29, 1.209854],
      [1, 15.29, 3.6696],
      [0.3, 40, -0.913265],
      [0.85, 40, 3.165086],
      [1, 40, 6],
    ]
    for (const [gain, distance, trip] of device)
      expect(
        (howlLoopRate(gain, distance) * distance) / 1000,
        `${gain} at ${distance}`,
      ).toBeCloseTo(trip, 5)
    expect(howlLoopRate(1, 40)).toBeCloseTo(150, 9)
    expect(howlLoopRate(1, 25)).toBeCloseTo(240, 9)
  })

  it('ports the body and the tilt: `shape`', () => {
    expect(HOWL_TILT_RATIO).toBe(3) // kTiltRatio
    // `shape` in howl.h: [Hz, centre, sample rate, what is passed].
    const device: readonly (readonly [number, number, number, number])[] = [
      [40, 80, 44100, 0.2432441],
      [100, 80, 44100, 0.6207889],
      [152, 80, 44100, 0.0004274],
      [1500, 3000, 44100, 0.2440993],
      [3000, 3000, 44100, 0.9127483],
      [3750, 3000, 44100, 0.6345817],
      [260, 520, 48000, 0.2432667],
      [416, 520, 48000, 0.764008],
      [520, 520, 48000, 0.900347],
      [650, 520, 48000, 0.6211531],
      [988, 520, 48000, 0.000428],
      [2400, 3000, 48000, 0.769715],
      [5700, 3000, 48000, 0.0004464],
      [64, 80, 96000, 0.7638201],
      [520, 520, 96000, 0.9000865],
      [3000, 3000, 96000, 0.9028472],
      [3750, 3000, 96000, 0.6238511],
    ]
    for (const [hz, centre, rate, passed] of device)
      expect(howlShape(hz, centre, rate), `${hz} of ${centre} at ${rate}`).toBeCloseTo(passed, 5)
    // The body alone is sin^4: nothing at twice its centre, and the same either side of it.
    expect(howlShape(1040, 520, RATE)).toBeLessThan(1e-12)
    // Low down the two low passes at three times the centre take a tenth off at the centre.
    expect(howlShape(200, 200, RATE)).toBeCloseTo(0.9, 3)
  })

  it('tunes by Distance: the fundamental is one over it', () => {
    expect(howlFundamentalHz(10)).toBe(100)
    expect(howlFundamentalHz(7.645)).toBeCloseTo(130.8, 1)
    expect(howlNote(howlFundamentalHz(7.645))).toBe('C3')
    expect(howlNote(440)).toBe('A4')
    expect(howlNote(185)).toBe('F#3')
  })

  it('stands each body where Body, Width and the wander put it', () => {
    // kMoveOctaves 1, kWidthOctaves 0.25, kCentreMinHz 80, kCentreMaxHz 3000.
    expect(howlCentreHz(500, 0, 0, 0, 0)).toBeCloseTo(500, 9)
    expect(howlCentreHz(500, 0, 0, 1, 1)).toBeCloseTo(500, 9)
    expect(howlCentreHz(500, 1, 0, 0, 1)).toBeCloseTo(1000, 9)
    expect(howlCentreHz(500, 0.5, 0, 0, -1)).toBeCloseTo(500 / Math.SQRT2, 9)
    expect(howlCentreHz(500, 0, 1, 0, 0)).toBeCloseTo(500 * 2 ** -0.25, 9)
    expect(howlCentreHz(500, 0, 1, 1, 0)).toBeCloseTo(500 * 2 ** 0.25, 9)
    expect(howlCentreHz(2400, 1, 1, 1, 1)).toBe(HOWL_CENTRE_MAX_HZ)
    expect(howlCentreHz(120, 1, 1, 0, -1)).toBe(HOWL_CENTRE_MIN_HZ)
  })

  it('keeps a body over the note of a short loop, where its taps still fit: `centre_in`', () => {
    expect(HOWL_CENTRE_OVER_NOTE).toBe(1.125) // kCentreOverNote
    // `centre_in` in howl.h: [asked, fundamental, sample rate, where it stands].
    const device: readonly (readonly [number, number, number, number])[] = [
      [80, 25, 44100, 80],
      [520, 25, 44100, 520],
      [80, 130.8, 44100, 148.0281],
      [520, 130.8, 44100, 520],
      [520, 1000, 44100, 1178.4442],
      [3000, 1000, 44100, 3000],
      [80, 130.8, 48000, 147.9564],
      [80, 1000, 48000, 1173.9131],
      [520, 1000, 48000, 1173.9131],
    ]
    for (const [hz, fundamental, rate, stands] of device)
      expect(howlCentreIn(hz, fundamental, rate), `${hz} over ${fundamental}`).toBeCloseTo(
        stands,
        2,
      )
  })

  it('names the overtone the body passes best: `best_overtone`', () => {
    expect(HOWL_BEST_WALK).toBe(8) // kBestWalk
    // `best_overtone` in howl.h at 48 kHz: [centre, fundamental, overtone].
    const device: readonly (readonly [number, number, number])[] = [
      [80, 25, 3],
      [333, 25, 13],
      [520, 25, 20],
      [2400, 25, 94],
      [2854.1, 25, 112],
      [3000, 25, 118],
      [150, 100, 1],
      [333, 100, 3],
      [440, 100, 4],
      [460, 100, 5],
      [777, 100, 8],
      [1900, 100, 19],
      [150, 130.8, 1],
      [440, 130.8, 3],
      [520, 130.8, 4],
      [777, 130.8, 6],
      [3000, 130.8, 23],
      [1900, 523.25, 4],
      [3000, 523.25, 6],
      [1900, 1000, 2],
      [3000, 1000, 3],
    ]
    for (const [centre, fundamental, overtone] of device)
      expect(howlOvertone(centre, fundamental, RATE), `${centre} over ${fundamental}`).toBe(
        overtone,
      )
    // No overtone under 0.45 of the rate is passed more than the one named, wherever the body
    // may stand in the loop: also where they stand close and the low passes lean the top of
    // the pass band more than one of them under the centre (2.4 kHz in a loop of 40 ms).
    for (const fundamental of [25, 65.4, 130.8, 333.3, 1000])
      for (const asked of [80, 120, 333, 777, 1900, 2400, 2854.1, 3000]) {
        const centre = howlCentreIn(asked, fundamental, RATE)
        const best = howlOvertone(centre, fundamental, RATE)
        const passed = howlShape(best * fundamental, centre, RATE)
        for (let k = 1; k * fundamental < 0.45 * RATE; k++)
          expect(
            howlShape(k * fundamental, centre, RATE),
            `${k} of ${fundamental} at ${centre}`,
          ).toBeLessThanOrEqual(passed)
      }
  })

  it("gives the best overtone Gain's rate and every other frequency less by what the body takes off a turn", () => {
    for (const [distance, centre, gain] of [
      [7.645, 520, 0.85],
      [10, 400, 0.3],
      [40, 196, 1],
      [1.911, 1050, 0.6],
    ]) {
      const fundamental = howlFundamentalHz(distance)
      const best = howlOvertone(centre, fundamental, RATE) * fundamental
      expect(howlRateAt(best, centre, gain, distance, RATE)).toBeCloseTo(
        howlLoopRate(gain, distance),
        9,
      )
      // `tune` in howl.h: the loop's gain is the gain of a turn over what the best overtone is
      // passed, so a tone at `hz` is multiplied each turn by trip × shape(hz) / shape(best), and
      // there are 1000 / Distance turns a second.
      for (const hz of [best - fundamental, best + fundamental, 0.7 * centre, 1.4 * centre]) {
        const turn =
          Math.pow(10, (howlLoopRate(gain, distance) * distance) / 1000 / 20) *
          (howlShape(hz, centre, RATE) / howlShape(best, centre, RATE))
        expect(howlRateAt(hz, centre, gain, distance, RATE)).toBeCloseTo(
          (20 * Math.log10(turn) * 1000) / distance,
          6,
        )
        expect(howlRateAt(hz, centre, gain, distance, RATE)).toBeLessThan(
          howlLoopRate(gain, distance),
        )
      }
    }
  })

  it("lets through of the feedback what the device's equal-power Mix does, less what a new note takes off", () => {
    expect(howlHeard(0)).toBe(0)
    expect(howlHeard(0.5)).toBeCloseTo(Math.SQRT1_2, 9)
    expect(howlHeard(1)).toBeCloseTo(1, 9)
    expect(HOWL_DUCK_DB).toBe(24) // kDuckDb
    expect(howlDucked(0)).toBe(1)
    expect(howlDucked(0.5)).toBeCloseTo(Math.pow(10, -12 / 20), 9)
    expect(howlDucked(1)).toBeCloseTo(Math.pow(10, -24 / 20), 9)
    expect(howlDucked(3)).toBe(howlDucked(1))
  })

  it("adds Edge's harmonics whole under 0.4 of the sample rate and not at all past 0.45 of it", () => {
    // `tune` in howl.h: clamp((0.45 rate - h hz) / (0.05 rate), 0, 1) / h.
    expect(HOWL_EDGE_HARMONICS).toEqual([
      [3, 1 / 3],
      [5, 1 / 5],
      [7, 1 / 7],
    ])
    expect(howlEdgeShare(0.4 * RATE, RATE)).toBeCloseTo(1, 9)
    expect(howlEdgeShare(1000, RATE)).toBe(1)
    expect(howlEdgeShare(0.425 * RATE, RATE)).toBeCloseTo(0.5, 9)
    expect(howlEdgeShare(0.45 * RATE, RATE)).toBeCloseTo(0, 9)
    expect(howlEdgeShare(0.49 * RATE, RATE)).toBe(0)
  })

  it('says a rate with its sign', () => {
    expect(howlRateText(79.127)).toBe('+79 dB/s')
    expect(howlRateText(-5.61)).toBe('−5.6 dB/s')
    expect(howlRateText(0)).toBe('+0.0 dB/s')
    expect(howlRateText(240)).toBe('+240 dB/s')
  })
})

const valueOf = (values: Record<string, number>, name: string): number =>
  values[name] ?? params[name].default
/** Where the knobs put one side's body at rest, in the loop Distance tunes. */
const centreAt = (values: Record<string, number>, side: 0 | 1): number =>
  howlCentreIn(
    howlCentreHz(valueOf(values, 'body'), 0, valueOf(values, 'width'), side, 0),
    howlFundamentalHz(valueOf(values, 'distance')),
    RATE,
  )

describe.each(SHAPES)('the picture at %i by %i', (width, height) => {
  const { plot, rail, zero } = howlBoxes({ width, height })
  const foot = plot.y + plot.h
  const at = (values: Record<string, number> = {}, more: FrameOptions = {}): RecordingContext =>
    draw({ values, width, height, ...more })
  /** The rate the device gives a tone at `hz` on one side, with the knobs at `values`. */
  const rateAt = (hz: number, values: Record<string, number>, side: 0 | 1 = 0): number =>
    howlRateAt(
      hz,
      centreAt(values, side),
      valueOf(values, 'gain'),
      valueOf(values, 'distance'),
      RATE,
    )

  it('puts the middle of the Gain knob across the plot, and its ends at the top and over the foot', () => {
    expect(zero).toBeCloseTo(plot.y + (plot.h - HOWL_FOOT_ROOM) / 2, 9)
    expect(yOfRate(240, plot)).toBe(plot.y)
    expect(yOfRate(-240, plot)).toBe(foot - HOWL_FOOT_ROOM)
    expect(yOfRate(-5000, plot)).toBe(foot - HOWL_FOOT_ROOM)
    for (const gain of [0, 0.2, 0.5, 0.85, 1])
      expect(howlGainAtY(yOfRate(howlRate(gain), plot), plot)).toBeCloseTo(gain, 9)
    const rules = strokes(at()).filter(
      (shape) => shape.alpha === INK.rule && shape.points.length === 2,
    )
    expect(rules.some((shape) => Math.abs(shape.points[0][1] - zero) <= 0.5)).toBe(true)
  })

  /** The overtones the scale holds, each where the curve has a point. */
  const overtones = (values: Record<string, number>): number[] => {
    const fundamental = howlFundamentalHz(valueOf(values, 'distance'))
    const list: number[] = []
    for (let k = 1; k * fundamental <= HOWL_MAX_HZ; k++)
      if (k * fundamental >= HOWL_MIN_HZ) list.push(k * fundamental)
    return list
  }
  /** Whether a drawn line is the rates of one side's overtones, joined. */
  const expectJoined = (
    points: readonly [number, number][],
    values: Record<string, number>,
    side: 0 | 1,
    rate: (hz: number) => number = (hz) => rateAt(hz, values, side),
  ): void => {
    const list = overtones(values)
    expect(points).toHaveLength(list.length)
    list.forEach((hz, index) => {
      expect(points[index][0]).toBeCloseTo(xOf(hz, plot), 9)
      expect(Math.abs(points[index][1] - yOfRate(rate(hz), plot)), `${hz} Hz`).toBeLessThan(1e-6)
    })
  }

  it('joins the tops of the overtones as the curve of the left side, each as high as its rate', () => {
    const cases: Record<string, number>[] = [
      {},
      { gain: 1, body: 2400 },
      { gain: 0.3, body: 150, width: 0 },
      { gain: 1, distance: 40, body: 196 },
      { gain: 0.7, distance: 1, body: 300 },
      { gain: 0.42, move: 0 },
    ]
    for (const values of cases) {
      const points = curveOf(at(values))
      expectJoined(points, values, 0)
      // Its top is the overtone the body passes best, at the rate Gain gives the loop.
      const fundamental = howlFundamentalHz(valueOf(values, 'distance'))
      const best = howlOvertone(centreAt(values, 0), fundamental, RATE) * fundamental
      const loop = howlLoopRate(valueOf(values, 'gain'), valueOf(values, 'distance'))
      const highest = points.reduce((a, b) => (b[1] < a[1] ? b : a))
      expect(highest[1]).toBeCloseTo(yOfRate(loop, plot), 6)
      if (loop < 240) expect(highest[0]).toBeCloseTo(xOf(best, plot), 9)
    }
  })

  it('never draws the curve over the point: no tone the loop can hold grows faster than Gain says', () => {
    // Between two overtones the body would pass more than it passes either, but there is no
    // tone there to pass: a curve drawn through those frequencies stood over the line with
    // Gain under the middle, where nothing sings.
    for (const gain of [0.1, 0.42, 0.5, 0.62, 0.85, 1])
      for (const body of [120, 300, 477, 590, 1000, 2400])
        for (const distance of [1, 3, 7.645, 15.29, 40])
          for (const width of [0, 0.5, 1]) {
            const values = { gain, body, distance, width, move: 0 }
            const drawn = at(values)
            const [point] = handles(values, width, height)
            const lines = strokes(drawn).filter(
              (shape) => shape.points.length > 2 && shape.colour === PLAIN_COLOURS.ink,
            )
            expect(lines.length).toBeGreaterThan(0)
            for (const line of lines)
              for (const [, y] of line.points) expect(y).toBeGreaterThanOrEqual(point.y - 1e-6)
            if (gain <= 0.5)
              for (const line of lines)
                for (const [, y] of line.points) expect(y).toBeGreaterThanOrEqual(zero - 1e-6)
          }
  })

  it('draws the right side behind where Width sets the two apart, and one curve at Width 0', () => {
    const behind = (values: Record<string, number>): Shape[] =>
      strokes(at(values)).filter(
        (shape) => shape.width === 1 && shape.alpha === INK.back && shape.points.length > 10,
      )
    expect(behind({ width: 0 })).toHaveLength(0)
    const values = { width: 1, body: 500, gain: 0.8 }
    const [right] = behind(values)
    expectJoined(right.points, values, 1)
    // The two stand a half octave apart.
    expect(centreAt(values, 1) / centreAt(values, 0)).toBeCloseTo(Math.SQRT2, 6)
  })

  it('stands a post on every whole multiple of the fundamental, as high as the rate there', () => {
    const values = { distance: 10, body: 400, gain: 0.75, width: 0, move: 0 }
    const drawn = at(values)
    const posts = uprights(drawn, PLAIN_COLOURS.ink).filter(
      (shape) =>
        shape.width === 1 &&
        shape.alpha === INK.back &&
        Math.max(shape.points[0][1], shape.points[1][1]) === foot,
    )
    const expected = howlPosts(100, plot)
    expect(expected.slice(0, 4)).toEqual([1, 2, 3, 4])
    expect(posts).toHaveLength(expected.length)
    expected.forEach((k, index) => {
      const post = posts[index]
      expect(post.points[0][0]).toBe(Math.floor(xOf(k * 100, plot)) + 0.5)
      expect(Math.min(post.points[0][1], post.points[1][1])).toBeCloseTo(
        yOfRate(rateAt(k * 100, values), plot),
        6,
      )
    })
    // The fourth is the one the body passes best: it goes at Gain's rate, 35.5 dB a second,
    // and its neighbours die more than 200 dB a second.
    expect(rateAt(400, values)).toBeCloseTo(35.53133, 3)
    expect(rateAt(300, values)).toBeLessThan(-200)
    expect(rateAt(500, values)).toBeLessThan(-200)
    // The part of a post over the line is drawn again, heavier.
    const over = uprights(drawn, PLAIN_COLOURS.ink).filter((shape) => shape.width === 2)
    const singing = expected.filter((k) => rateAt(k * 100, values) > 0)
    expect(singing).toEqual([4])
    expect(over.map((shape) => shape.points[0][0])).toEqual(
      singing.map((k) => Math.round(xOf(k * 100, plot))),
    )
    for (const shape of over) expect(Math.max(shape.points[0][1], shape.points[1][1])).toBe(zero)
  })

  it('has several posts over the line in a long loop, where a turn takes little off the neighbours', () => {
    const values = { distance: 40, body: 196, gain: 1, width: 0, move: 0 }
    const over = uprights(at(values), PLAIN_COLOURS.ink).filter((shape) => shape.width === 2)
    const singing = howlPosts(25, plot).filter((k) => rateAt(k * 25, values) > 0)
    expect(singing.length).toBeGreaterThan(2)
    expect(over).toHaveLength(singing.length)
  })

  it('has no post over the line while Gain is at the middle or under it', () => {
    for (const gain of [0.5, 0.45, 0]) {
      const drawn = at({ distance: 10, body: 400, gain, width: 0 })
      expect(uprights(drawn, PLAIN_COLOURS.ink).filter((shape) => shape.width === 2)).toHaveLength(
        0,
      )
    }
    expect(
      uprights(at({ distance: 10, body: 400, gain: 0.52, width: 0 }), PLAIN_COLOURS.ink).filter(
        (shape) => shape.width === 2,
      ),
    ).toHaveLength(1)
  })

  it('breaks the posts off where they crowd and fills under the curve from there', () => {
    for (const distance of [2, 7.645, 40]) {
      const fundamental = howlFundamentalHz(distance)
      const posts = howlPosts(fundamental, plot)
      const last = posts[posts.length - 1]
      posts.forEach((k, index) => {
        if (index > 0) expect(k).toBe(posts[index - 1] + 1)
        if (k > 1)
          expect(
            xOf(k * fundamental, plot) - xOf((k - 1) * fundamental, plot),
          ).toBeGreaterThanOrEqual(HOWL_POSTS_APART)
      })
      const next = (last + 1) * fundamental
      const crowded =
        xOf(next, plot) - xOf(last * fundamental, plot) < HOWL_POSTS_APART || next > HOWL_MAX_HZ
      expect(crowded, `after post ${last} at ${distance} ms`).toBe(true)
      const fills = shapes(at({ distance })).filter(
        (shape) =>
          shape.op === 'fill' && shape.points.length > 4 && shape.colour === PLAIN_COLOURS.ink,
      )
      if (next > HOWL_MAX_HZ) expect(fills).toHaveLength(0)
      else {
        expect(fills).toHaveLength(2)
        for (const fill of fills) expect(fill.points[0][0]).toBeCloseTo(xOf(next, plot), 6)
      }
    }
  })

  it('draws what sings as strongly as Mix lets the feedback be heard', () => {
    const over = (mix: number): number[] =>
      uprights(at({ distance: 10, body: 400, gain: 0.8, mix }), PLAIN_COLOURS.ink)
        .filter((shape) => shape.width === 2)
        .map((shape) => shape.alpha)
    expect(new Set(over(0))).toEqual(new Set([INK.back]))
    expect(new Set(over(1))).toEqual(new Set([INK.trace]))
    const half = over(0.5)[0]
    expect(half).toBeCloseTo(INK.back + (INK.trace - INK.back) * Math.SQRT1_2, 9)
  })

  it('stands where the knobs put it at rest, and where the device says the bodies are while it runs', () => {
    const values = { body: 500, gain: 0.8, width: 0, follow: 1, mix: 1 }
    const meters = { ...QUIET, centre: 900, centreRight: 900, ducked: 0.5 }
    const law =
      (centre: number) =>
      (hz: number): number =>
        howlRateAt(hz, centre, 0.8, params.distance.default, RATE)
    const strength = (drawn: RecordingContext): number[] =>
      uprights(drawn, PLAIN_COLOURS.ink)
        .filter((shape) => shape.width === 2)
        .map((shape) => shape.alpha)
    // At rest the readings are not looked at.
    const rest = at(values, { meters })
    expectJoined(curveOf(rest), values, 0, law(500))
    expect(new Set(strength(rest))).toEqual(new Set([INK.trace]))
    // Running, the curve stands on the reading. A new note turns the howl down at the output and
    // leaves the loop as it was: the curve stays, and what sings is drawn fainter by Follow's share.
    const running = runDisplay(display, params, 0.2, {
      values,
      meters,
      signal: testSignal(),
      width,
      height,
    })
    expectJoined(curveOf(running), values, 0, law(900))
    const heard = howlDucked(0.5)
    expect(heard).toBeCloseTo(Math.pow(10, -12 / 20), 9)
    expect(strength(running).length).toBeGreaterThan(0)
    for (const alpha of strength(running))
      expect(alpha).toBeCloseTo(INK.back + (INK.trace - INK.back) * heard, 9)
    // Switched off it is at rest again.
    const off = at(values, { meters, signal: testSignal(), powered: false })
    expectJoined(curveOf(off), values, 0, law(500))
  })

  it('stands the curve where the body really is when a short loop holds it over its note', () => {
    // Distance 1 ms: the loop's lowest note is 1 kHz and the body cannot stand under 1174 Hz,
    // so with Body at 300 Hz the first overtone is still the one that sings.
    const values = { distance: 1, body: 300, gain: 0.8, width: 0 }
    expect(centreAt(values, 0)).toBeCloseTo(1173.9131, 2)
    expect(howlOvertone(centreAt(values, 0), 1000, RATE)).toBe(1)
    const points = curveOf(at(values))
    expect(points[0][0]).toBeCloseTo(xOf(1000, plot), 9)
    expect(points[0][1]).toBeCloseTo(yOfRate(howlRate(0.8), plot), 6)
    for (const [, y] of points.slice(1)) expect(y).toBeGreaterThan(points[0][1])
  })

  it('shades how far the bodies may wander', () => {
    const band = (values: Record<string, number>) =>
      at(values).calls.filter(
        (call) => call.name === 'fillRect' && call.args[1] === plot.y && call.args[3] === plot.h,
      )
    expect(band({ move: 0, width: 0 })).toHaveLength(0)
    const [shade] = band({ body: 500, move: 0.5, width: 1 })
    const from = xOf(howlCentreHz(500, 0.5, 1, 0, -1), plot)
    const to = xOf(howlCentreHz(500, 0.5, 1, 1, 1), plot)
    expect(shade.args[0]).toBeCloseTo(from, 6)
    expect(shade.args[2]).toBeCloseTo(to - from, 6)
  })

  it('keeps the rail under the plot, clear of it', () => {
    expect(rail).toBeGreaterThan(foot + 3)
    expect(rail).toBeLessThan(height - 3)
  })
})

describe.each(SHAPES)('the points at %i by %i', (width, height) => {
  const { plot, rail } = howlBoxes({ width, height })
  const foot = plot.y + plot.h
  const points = (values: Record<string, number> = {}) => handles(values, width, height)
  const point = (key: string, values: Record<string, number> = {}): DisplayHandle => {
    const found = points(values).find((handle) => handle.key === key)
    if (!found) throw new Error(`no handle ${key}`)
    return found
  }

  it('has one at Body across and Gain up and down, level with the top of the post that sings', () => {
    const cases: Record<string, number>[] = [{}, { body: 120, gain: 0 }, { body: 2400, gain: 1 }]
    for (const values of cases) {
      const body = point('body', values)
      expect(body.x).toBeCloseTo(xOf(valueOf(values, 'body'), plot), 9)
      expect(body.y).toBeCloseTo(yOfRate(howlRate(valueOf(values, 'gain')), plot), 9)
      expect(body.x).toBeGreaterThan(plot.x)
      expect(body.x).toBeLessThan(plot.x + plot.w)
      expect(body.y).toBeGreaterThanOrEqual(plot.y)
      expect(body.y).toBeLessThanOrEqual(foot - HOWL_FOOT_ROOM)
    }
    // At the defaults the loop is short enough to have all of Gain's rate, and the post the
    // body passes best stands as high as the point.
    const fundamental = howlFundamentalHz(params.distance.default)
    const best = howlOvertone(centreAt({}, 0), fundamental, RATE) * fundamental
    expect(
      yOfRate(
        howlRateAt(best, centreAt({}, 0), params.gain.default, params.distance.default, RATE),
        plot,
      ),
    ).toBeCloseTo(point('body').y, 9)
    const set = point('body').drag(xOf(1000, plot), yOfRate(howlRate(0.8), plot))
    expect(set.body).toBeCloseTo(1000, 6)
    expect(set.gain).toBeCloseTo(0.8, 9)
    // A drag is solved for the setting whose picture is under the hand.
    const moved = point('body', set)
    expect(moved.x).toBeCloseTo(xOf(1000, plot), 6)
    expect(moved.y).toBeCloseTo(yOfRate(howlRate(0.8), plot), 6)
    // Past the ends of its travel it stops at them.
    expect(point('body').drag(-50, -50)).toEqual({ body: 120, gain: 1 })
    expect(point('body').drag(width + 50, height + 50)).toEqual({ body: 2400, gain: 0 })
    expect(point('body', { body: 300, gain: 0.2 }).reset?.()).toEqual({
      body: params.body.default,
      gain: params.gain.default,
    })
  })

  it('has one on the rail: the fundamental, which is Distance', () => {
    for (const distance of [1, 7.645, 40]) {
      const handle = point('distance', { distance })
      expect(handle.x).toBeCloseTo(xOf(1000 / distance, plot), 9)
      expect(handle.y).toBe(rail)
    }
    const set = point('distance').drag(xOf(220, plot), 0)
    expect(set.distance).toBeCloseTo(1000 / 220, 6)
    expect(Object.keys(set)).toEqual(['distance'])
    expect(point('distance', set).x).toBeCloseTo(xOf(220, plot), 6)
    expect(point('distance').drag(-50, 0).distance).toBe(40)
    expect(point('distance').drag(width + 50, 0).distance).toBe(1)
    expect(point('distance', { distance: 20 }).reset?.()).toEqual({
      distance: params.distance.default,
    })
  })

  it('gives each enough travel to be set by hand, the same for every part of Gain, and keeps the two apart', () => {
    expect(yOfRate(howlRate(0), plot) - yOfRate(howlRate(1), plot)).toBeGreaterThan(40)
    // Every twentieth of the Gain knob is the same distance under the hand.
    const step = (plot.h - HOWL_FOOT_ROOM) / 20
    for (let n = 1; n <= 20; n++)
      expect(yOfRate(howlRate((n - 1) / 20), plot) - yOfRate(howlRate(n / 20), plot)).toBeCloseTo(
        step,
        9,
      )
    expect(xOf(2400, plot) - xOf(120, plot)).toBeGreaterThan(40)
    expect(xOf(1000, plot) - xOf(25, plot)).toBeGreaterThan(60)
    const cases: Record<string, number>[] = [
      {},
      { gain: 0, body: 120, distance: 8 },
      { gain: 0, distance: 1 },
    ]
    for (const values of cases) {
      const [body, distance] = points(values)
      expect(Math.hypot(body.x - distance.x, body.y - distance.y)).toBeGreaterThan(8)
    }
  })

  it('draws both as the kit draws a point, the one in hand in the accent', () => {
    const rings = (hot: string | null) =>
      draw({ width, height, hot })
        .calls.map((call, index, calls) => ({ call, fill: calls.slice(0, index) }))
        .filter(({ call }) => call.name === 'arc')
        .map(({ call }) => call.args.slice(0, 3) as number[])
    const [body, distance] = points()
    const cold = rings(null)
    expect(cold).toContainEqual([body.x, body.y, 3.5])
    expect(cold).toContainEqual([distance.x, distance.y, 3])
    expect(rings('body')).toContainEqual([body.x, body.y, 4.5])
    expect(rings('distance')).toContainEqual([distance.x, distance.y, 4])
  })
})

describe.each(SHAPES)('the singing tones at %i by %i', (width, height) => {
  const { plot } = howlBoxes({ width, height })
  const foot = plot.y + plot.h
  const accents = (drawn: RecordingContext): Shape[] => uprights(drawn, PLAIN_COLOURS.accent)
  const sing = (
    values: Record<string, number>,
    meters: Partial<typeof QUIET>,
    more: FrameOptions = {},
  ): RecordingContext => run(2, values, meters, { width, height, ...more })
  const top = (shape: Shape): number => Math.min(shape.points[0][1], shape.points[1][1])

  it('marks in the accent the tone each side sings, as loud as it is heard', () => {
    const meters = { pitch: 392, level: 0.2, pitchRight: 654, levelRight: 0.1 }
    for (const mix of [1, 0.4]) {
      const marks = accents(sing({ mix, edge: 0 }, meters))
      expect(marks).toHaveLength(2)
      // The right side's behind and finer, the left side's in front.
      const [right, left] = marks
      expect(left.width).toBe(2)
      expect(left.points[0][0]).toBeCloseTo(xOf(392, plot), 9)
      expect(top(left)).toBeCloseTo(yOfSound(0.2 * howlHeard(mix), plot), 3)
      expect(right.width).toBe(1)
      expect(right.points[0][0]).toBeCloseTo(xOf(654, plot), 9)
      expect(top(right)).toBeCloseTo(yOfSound(0.1 * howlHeard(mix), plot), 3)
      for (const mark of marks) expect(Math.max(mark.points[0][1], mark.points[1][1])).toBe(foot)
    }
  })

  it('draws the tone lower by what a new note has turned the howl down', () => {
    // The device's `level` is the tone in the loop; `process` puts it out times the duck.
    const meters = { pitch: 392, level: 0.2, pitchRight: 392, levelRight: 0.2 }
    for (const ducked of [0.5, 1]) {
      const [mark] = accents(sing({ mix: 1, edge: 0, follow: 1 }, { ...meters, ducked }))
      expect(top(mark)).toBeCloseTo(yOfSound(0.2 * Math.pow(10, (-24 * ducked) / 20), plot), 3)
    }
  })

  it('draws one tone where both sides sing the same', () => {
    const marks = accents(
      sing({ mix: 1, edge: 0 }, { pitch: 523, level: 0.2, pitchRight: 523, levelRight: 0.2 }),
    )
    expect(marks).toHaveLength(1)
    expect(marks[0].width).toBe(2)
  })

  it('draws nothing of a tone Mix lets none of through, nor at rest, switched off or silent', () => {
    const meters = { pitch: 392, level: 0.2, pitchRight: 654, levelRight: 0.1 }
    expect(accents(sing({ mix: 0 }, meters))).toHaveLength(0)
    expect(accents(sing({ mix: 1 }, QUIET))).toHaveLength(0)
    expect(accents(sing({ mix: 1 }, meters, { powered: false }))).toHaveLength(0)
    expect(
      accents(draw({ values: { mix: 1 }, meters: { ...QUIET, ...meters }, width, height })),
    ).toHaveLength(0)
    // A reading that is no frequency is no tone.
    expect(accents(sing({ mix: 1 }, { pitch: -6, level: -6 }))).toHaveLength(0)
    expect(accents(sing({ mix: 1 }, { pitch: 0.5, level: 0.5 }))).toHaveLength(0)
  })

  it("stands Edge's harmonics beside the tone, at a third, a fifth and a seventh of it", () => {
    const meters = { pitch: 300, level: 0.5, pitchRight: 300, levelRight: 0.5 }
    for (const edge of [1, 0.5]) {
      const marks = accents(sing({ mix: 1, edge }, meters))
      const harmonics = marks.filter((mark) => mark.width === 1)
      expect(harmonics).toHaveLength(3)
      HOWL_EDGE_HARMONICS.forEach(([harmonic, share], index) => {
        expect(harmonics[index].points[0][0]).toBeCloseTo(xOf(harmonic * 300, plot), 9)
        expect(top(harmonics[index])).toBeCloseTo(yOfSound(0.5 * edge * share, plot), 3)
        expect(harmonics[index].alpha).toBe(INK.text)
      })
    }
    expect(
      accents(sing({ mix: 1, edge: 0 }, meters)).filter((mark) => mark.width === 1),
    ).toHaveLength(0)
    // A harmonic past the scale is left out: the seventh of 1 kHz.
    const high = accents(sing({ mix: 1, edge: 1 }, { pitch: 1000, level: 0.5 }))
    expect(high.filter((mark) => mark.width === 1)).toHaveLength(2)
  })

  it('says the notes that sing, on a patch, and what the point in hand is set to', () => {
    const meters = { pitch: 392, level: 0.2, pitchRight: 654, levelRight: 0.1 }
    const singing = sing({ mix: 1 }, meters)
    expect(singing.words()).toContain('G4 E5')
    expect(patchUnder(singing, 'G4 E5', PLAIN_COLOURS.plate)).not.toBeNull()
    // A side between two overtones (the tone handed from one to the next) is given no note.
    const between = sing({ mix: 1 }, { ...meters, pitch: 540 })
    expect(between.words()).toContain('E5')
    expect(between.words()).not.toContain('G4 E5')
    expect(howlSettled(540, howlFundamentalHz(7.645))).toBe(0)
    expect(howlSettled(654, howlFundamentalHz(7.645))).toBe(5)
    expect(
      howlSettled(654 * Math.pow(2, (HOWL_SETTLED_CENTS - 1) / 1200), howlFundamentalHz(7.645)),
    ).toBe(5)
    expect(
      howlSettled(654 * Math.pow(2, (HOWL_SETTLED_CENTS + 1) / 1200), howlFundamentalHz(7.645)),
    ).toBe(0)
    // The note Distance tunes stands at the end of the rail, at rest too.
    expect(draw({ width, height }).words()).toEqual(['C3'])
    expect(draw({ values: { distance: 1000 / 110 }, width, height }).words()).toEqual(['A2'])
    // In hand, the point on the curve says where the body stands and the rate Gain gives the loop.
    const body = draw({ width, height, hot: 'body' })
    expect(body.words()).toContain('520 Hz  +79 dB/s')
    expect(patchUnder(body, '520 Hz  +79 dB/s', PLAIN_COLOURS.plate)).not.toBeNull()
    expect(draw({ values: { gain: 0.42 }, width, height, hot: 'body' }).words()).toContain(
      '520 Hz  −5.6 dB/s',
    )
    // A long loop has not all of the top of the knob: 6 dB a turn of 40 ms.
    expect(
      draw({ values: { gain: 1, distance: 40 }, width, height, hot: 'body' }).words(),
    ).toContain('520 Hz  +150 dB/s')
    expect(draw({ width, height, hot: 'distance' }).words()).toContain('7.6 ms  131 Hz')
    // In hand, the point's words take the place of the notes.
    expect(sing({ mix: 1 }, meters, { hot: 'body' }).words()).not.toContain('G4 E5')
  })

  it('moves its words to the foot of the plot when the point on the curve stands in their place', () => {
    const baseline = (values: Record<string, number>): number => {
      const drawn = draw({ values, width, height, hot: 'body' })
      const call = drawn.calls.filter((entry) => entry.name === 'fillText').pop()
      return call?.args[2] as number
    }
    expect(baseline({ body: 2400, gain: 0.2 })).toBe(plot.y + 8)
    expect(baseline({ body: 120, gain: 1 })).toBe(plot.y + plot.h - 3)
  })
})

describe('the compiled device against what is drawn of it', () => {
  const BLOCK = 128
  const METERS = ['level', 'pitch', 'levelRight', 'pitchRight', 'centre', 'centreRight', 'ducked']

  /** The loop alone and still, with only the feedback at the output. */
  async function loop(values: Record<string, number>) {
    const harness = await loadWasmDevice('howl', RATE)
    const settings = { move: 0, width: 0, follow: 0, edge: 0, mix: 1, hold: 30, ...values }
    for (const [name, value] of Object.entries(settings)) harness.set(params[name], value)
    const meter = (name: string): number => harness.device.device_meter?.(METERS.indexOf(name)) ?? 0
    /** Play a struck note of eight harmonics for `seconds`, then nothing for `tail` seconds; the left output of the tail. */
    const strike = (hz: number, seconds: number, tail: number): Float32Array => {
      const out = new Float32Array(Math.round(tail * RATE))
      const block = new Float32Array(BLOCK)
      const total = Math.round((seconds + tail) * RATE)
      const played = Math.round(seconds * RATE)
      for (let done = 0; done < total; done += BLOCK) {
        for (let i = 0; i < BLOCK; i++) {
          const t = (done + i) / RATE
          let sample = 0
          if (done + i < played)
            for (let h = 1; h <= 8; h++)
              sample += (Math.sin(2 * Math.PI * hz * h * t) / h) * Math.exp((-t * h) / 0.6)
          block[i] = 0.4 * sample
        }
        harness.processBlock(block)
        const left = harness.view(harness.device.device_out_left(), BLOCK)
        for (let i = 0; i < BLOCK; i++) {
          const index = done + i - played
          if (index >= 0 && index < out.length) out[index] = left[i]
        }
      }
      return out
    }
    return { harness, meter, strike }
  }

  /** The frequency of a nearly pure tone, from its upward zero crossings. */
  function crossingHz(wave: Float32Array, from: number, to: number): number {
    let first = -1
    let last = -1
    let count = 0
    for (let i = from + 1; i < to; i++) {
      if (wave[i - 1] < 0 && wave[i] >= 0) {
        const at = i - 1 - wave[i - 1] / (wave[i] - wave[i - 1])
        if (first < 0) first = at
        last = at
        count += 1
      }
    }
    return count > 1 ? ((count - 1) * RATE) / (last - first) : 0
  }
  const peakOf = (wave: Float32Array, from: number, to: number): number => {
    let peak = 0
    for (let i = from; i < to; i++) peak = Math.max(peak, Math.abs(wave[i]))
    return peak
  }
  /** The level of the tone at `hz` in a stretch of a wave, as a sine's peak. */
  const toneOf = (wave: Float32Array, hz: number, from: number, to: number): number => {
    let re = 0
    let im = 0
    for (let i = from; i < to; i++) {
      const phase = (2 * Math.PI * hz * i) / RATE
      re += wave[i] * Math.cos(phase)
      im += wave[i] * Math.sin(phase)
    }
    return (2 * Math.hypot(re, im)) / (to - from)
  }

  it('sings on the post that stands highest over the line, and reads out that tone', async () => {
    for (const [distance, body] of [
      [10, 400],
      [7.645, 520],
      [4, 900],
    ]) {
      const fundamental = howlFundamentalHz(distance)
      const { plot } = howlBoxes(size)
      const centre = howlCentreIn(body, fundamental, RATE)
      // The post the picture shows highest.
      const posts = howlPosts(fundamental, plot)
      const height = (k: number): number => howlRateAt(k * fundamental, centre, 0.8, distance, RATE)
      const best = posts.reduce((a, b) => (height(b) > height(a) ? b : a))
      expect(height(best)).toBeGreaterThan(0)
      expect(best).toBe(howlOvertone(centre, fundamental, RATE))

      const { meter, strike } = await loop({ distance, body, gain: 0.8 })
      const tail = strike(196, 0.5, 1.5)
      const sung = crossingHz(tail, RATE, 1.5 * RATE)
      // The loop's tone is the whole multiple itself.
      expect(
        Math.abs(1200 * Math.log2(sung / (best * fundamental))),
        `${distance} ms`,
      ).toBeLessThan(0.5)
      // The readings the display marks the tone from: its frequency, its level, and where the body stands.
      expect(Math.abs(1200 * Math.log2(meter('pitch') / sung))).toBeLessThan(2)
      expect(meter('pitchRight')).toBeCloseTo(meter('pitch'), 1)
      const level = peakOf(tail, 1.4 * RATE, 1.5 * RATE)
      expect(Math.abs(meter('level') / level - 1)).toBeLessThan(0.05)
      expect(meter('centre') / centre).toBeCloseTo(1, 4)
      expect(meter('ducked')).toBe(0)
    }
  })

  it('rings and dies at the rate the picture gives the post, with Gain under the middle', async () => {
    const fundamental = howlFundamentalHz(10)
    const { plot } = howlBoxes(size)
    for (const gain of [0.3, 0.4]) {
      for (const k of howlPosts(fundamental, plot))
        expect(howlRateAt(k * fundamental, 400, gain, 10, RATE)).toBeLessThan(0)
      const drawn = howlRateAt(400, 400, gain, 10, RATE)
      expect(drawn).toBe(howlLoopRate(gain, 10))
      const { strike } = await loop({ distance: 10, body: 400, gain })
      const tail = strike(200, 0.5, 1.4)
      const early = toneOf(tail, 400, 0.2 * RATE, 0.4 * RATE)
      const late = toneOf(tail, 400, 1.0 * RATE, 1.2 * RATE)
      const measured = (20 * Math.log10(late / early)) / 0.8
      expect(Math.abs(measured - drawn), `Gain ${gain}: ${measured} against ${drawn}`).toBeLessThan(
        1,
      )
    }
    // Right down, nothing is left a second on.
    const { meter, strike } = await loop({ distance: 10, body: 400, gain: 0.1 })
    const tail = strike(196, 0.5, 1.5)
    expect(peakOf(tail, RATE, 1.5 * RATE)).toBeLessThan(1e-4)
    expect(meter('level')).toBeLessThan(1e-4)
  })

  it('stands its bodies where the picture stands them at rest: Width apart, the left one down', async () => {
    const { meter, strike } = await loop({ body: 500, width: 1, gain: 0.8 })
    strike(196, 0.5, 0.1)
    expect(meter('centre')).toBeCloseTo(centreAt({ body: 500, width: 1 }, 0), 1)
    expect(meter('centreRight')).toBeCloseTo(centreAt({ body: 500, width: 1 }, 1), 1)
    // And over the note of a short loop, where the picture stands them too.
    const short = await loop({ body: 300, distance: 1, gain: 0.8 })
    short.strike(196, 0.5, 0.1)
    expect(short.meter('centre')).toBeCloseTo(centreAt({ body: 300, distance: 1, width: 0 }, 0), 0)
    expect(short.meter('centre')).toBeGreaterThan(1100)
  })

  it('reads out how much of its 24 dB a new note has taken off the howl', async () => {
    const { meter, strike } = await loop({ follow: 1, gain: 0.8 })
    // Soon after a note out of silence the howl is turned right down.
    strike(196, 0.03, 0)
    expect(meter('ducked')).toBeGreaterThan(0.9)
    expect(meter('ducked')).toBeLessThanOrEqual(1)
    const less = await loop({ follow: 0.5, gain: 0.8 })
    less.strike(196, 0.03, 0)
    expect(less.meter('ducked')).toBeGreaterThan(0.45)
    expect(less.meter('ducked')).toBeLessThanOrEqual(0.5)
    const none = await loop({ follow: 0, gain: 0.8 })
    none.strike(196, 0.03, 0)
    expect(none.meter('ducked')).toBe(0)
  })
  it('reading it changes nothing it puts out', async () => {
    const read = await loadWasmDevice('howl', RATE)
    const unread = await loadWasmDevice('howl', RATE)
    for (const device of [read, unread]) {
      device.set(params.move, 1)
      device.set(params.pace, 1)
      device.set(params.hold, 0.3)
    }
    const block = new Float32Array(BLOCK)
    let different = 0
    for (let done = 0; done < RATE * 2.5; done += BLOCK) {
      // Sound, a silence long enough to come to rest and fall asleep in, and sound again.
      const silent = done > RATE * 0.5 && done < RATE * 1.5
      for (let i = 0; i < BLOCK; i++)
        block[i] = silent ? 0 : 0.2 * Math.sin((2 * Math.PI * 196 * (done + i)) / RATE)
      read.processBlock(block)
      unread.processBlock(block)
      for (let twice = 0; twice < 2; twice++)
        for (let index = 0; index < METERS.length; index++) read.device.device_meter?.(index)
      const a = read.view(read.device.device_out_left(), BLOCK)
      const b = unread.view(unread.device.device_out_left(), BLOCK)
      for (let i = 0; i < BLOCK; i++) if (a[i] !== b[i]) different += 1
    }
    expect(different).toBe(0)
  })
})
