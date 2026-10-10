// The truth of Howl's display: the curve and the posts against the loop's own
// gain (`cpp/devices/howl/howl.h`), the points against the knobs they set, the
// singing tones against the device's readings, and the compiled device itself
// against what is drawn of it.

import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../core/params'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { INK, PLAIN_COLOURS, xOfHz, yOfDb, type Box } from '../components/display-kit'
import {
  HOWL_BODY_Q,
  HOWL_CENTRE_MAX_HZ,
  HOWL_CENTRE_MIN_HZ,
  HOWL_EDGE_HARMONICS,
  HOWL_FACES,
  HOWL_FOOT_DB,
  HOWL_GAIN_FLOOR_DB,
  HOWL_GAIN_SPAN_DB,
  HOWL_MAX_HZ,
  HOWL_MIN_HZ,
  HOWL_POSTS_APART,
  HOWL_SETTLED_CENTS,
  HOWL_SOUND_FOOT_DB,
  HOWL_TOP_DB,
  howlBodyDb,
  howlBoxes,
  howlCentreHz,
  howlFundamentalHz,
  howlGainOf,
  howlHeard,
  howlLoopDb,
  howlNote,
  howlOvertone,
  howlPosts,
  howlSettled,
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
/** The loop's gain curve of the left side: the one long line in the ink at full strength. */
function curveOf(drawn: RecordingContext): [number, number][] {
  const curves = strokes(drawn).filter(
    (shape) =>
      shape.width === 1.5 && shape.points.length > 10 && shape.colour === PLAIN_COLOURS.ink,
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
const yOfLoop = (db: number, plot: Box): number => yOfDb(db, plot, HOWL_TOP_DB, HOWL_FOOT_DB)
const yOfSound = (gain: number, plot: Box): number =>
  yOfDb(20 * Math.log10(gain), plot, 0, HOWL_SOUND_FOOT_DB)
/** A line's height at `x`, between the two points either side of it. */
function yAt(points: readonly [number, number][], x: number): number {
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1]
    const [x1, y1] = points[i]
    if (x >= x0 && x <= x1) return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
  }
  throw new Error(`the line does not reach x = ${x}`)
}

describe("the loop's numbers, as howl.h has them", () => {
  it('maps Gain to a loop gain of -18 to +12 dB, with one turn round the loop at 0.6', () => {
    // kGainFloorDb and kGainSpanDb.
    expect(HOWL_GAIN_FLOOR_DB).toBe(-18)
    expect(HOWL_GAIN_SPAN_DB).toBe(30)
    expect(howlLoopDb(0)).toBe(-18)
    expect(howlLoopDb(0.6)).toBeCloseTo(0, 9)
    expect(howlLoopDb(1)).toBe(12)
    for (const gain of [0, 0.25, 0.6, 1]) expect(howlGainOf(howlLoopDb(gain))).toBeCloseTo(gain, 9)
    expect(howlGainOf(40)).toBe(1)
    expect(howlGainOf(-40)).toBe(0)
  })

  it('ports the body: unity at its centre, a band pass of Q 2 either side', () => {
    expect(HOWL_BODY_Q).toBe(2) // kBodyQ
    for (const centre of [120, 520, 2400])
      expect(howlBodyDb(centre, centre, RATE)).toBeCloseTo(0, 6)
    // The analogue band pass at a ratio r of its centre is 1 / sqrt(1 + Q² (r - 1/r)²); the
    // device's is that at the ratio of the two tangents, which low down is the ratio of the frequencies.
    const analogue = (ratio: number): number =>
      -10 * Math.log10(1 + HOWL_BODY_Q ** 2 * (ratio - 1 / ratio) ** 2)
    for (const ratio of [0.25, 0.5, 0.8, 1.25, 2, 4])
      expect(howlBodyDb(200 * ratio, 200, RATE)).toBeCloseTo(analogue(ratio), 1)
    expect(howlBodyDb(400, 200, RATE)).toBeCloseTo(-10, 1)
    // High up the tangent's warp shows: an octave over 2.4 kHz is cut a little more.
    const warped = Math.tan((Math.PI * 4800) / RATE) / Math.tan((Math.PI * 2400) / RATE)
    expect(howlBodyDb(4800, 2400, RATE)).toBeCloseTo(analogue(warped), 6)
    expect(howlBodyDb(4800, 2400, RATE)).toBeLessThan(analogue(2))
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

  it('names the overtone the body passes best', () => {
    // At the fundamental's fourth multiple the fourth wins; between the fourth and the fifth,
    // the one nearer on a scale of equal ratios.
    expect(howlOvertone(400, 100, RATE)).toBe(4)
    expect(howlOvertone(440, 100, RATE)).toBe(4)
    expect(howlOvertone(460, 100, RATE)).toBe(5)
    expect(howlOvertone(30, 100, RATE)).toBe(1)
    for (const centre of [150, 333, 777, 1900]) {
      const best = howlOvertone(centre, 100, RATE)
      for (const other of [best - 1, best + 1].filter((k) => k >= 1))
        expect(howlBodyDb(best * 100, centre, RATE)).toBeGreaterThanOrEqual(
          howlBodyDb(other * 100, centre, RATE),
        )
    }
  })

  it("lets through of the feedback what the device's equal-power Mix does", () => {
    expect(howlHeard(0)).toBe(0)
    expect(howlHeard(0.5)).toBeCloseTo(Math.SQRT1_2, 9)
    expect(howlHeard(1)).toBeCloseTo(1, 9)
  })
})

const valueOf = (values: Record<string, number>, name: string): number =>
  values[name] ?? params[name].default

describe.each(SHAPES)('the picture at %i by %i', (width, height) => {
  const { plot, rail, zero } = howlBoxes({ width, height })
  const foot = plot.y + plot.h
  const loopY = (db: number): number => Math.min(foot, Math.max(plot.y, yOfLoop(db, plot)))
  const at = (values: Record<string, number> = {}, more: FrameOptions = {}): RecordingContext =>
    draw({ values, width, height, ...more })

  it('draws the loop gain of the left side as its curve', () => {
    const cases: Record<string, number>[] = [
      {},
      { gain: 1, body: 2400 },
      { gain: 0.3, body: 150, width: 0 },
    ]
    for (const values of cases) {
      const points = curveOf(at(values))
      const centre = howlCentreHz(valueOf(values, 'body'), 0, valueOf(values, 'width'), 0, 0)
      const top = howlLoopDb(valueOf(values, 'gain'))
      for (const hz of [60, 200, centre, 1500, 5000]) {
        const db = top + howlBodyDb(hz, centre, RATE)
        if (yOfLoop(db, plot) > foot - 2) continue // under the plot the curve lies along its foot
        expect(Math.abs(yAt(points, xOf(hz, plot)) - loopY(db)), `${hz} Hz`).toBeLessThan(0.6)
      }
      // Its top is the body's centre, at Gain's loop gain.
      const highest = Math.min(...points.map((point) => point[1]))
      expect(Math.abs(highest - loopY(top))).toBeLessThan(0.5)
    }
  })

  it('draws the right side behind where Width sets the two apart, and one curve at Width 0', () => {
    const behind = (values: Record<string, number>): Shape[] =>
      strokes(at(values)).filter(
        (shape) => shape.width === 1 && shape.alpha === INK.back && shape.points.length > 10,
      )
    expect(behind({ width: 0 })).toHaveLength(0)
    const [right] = behind({ width: 1, body: 500, gain: 0.8 })
    const centre = howlCentreHz(500, 0, 1, 1, 0)
    expect(Math.abs(yAt(right.points, xOf(centre, plot)) - loopY(howlLoopDb(0.8)))).toBeLessThan(
      0.5,
    )
  })

  it('stands a post on every whole multiple of the fundamental, as high as the loop gain there', () => {
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
      const db = howlLoopDb(0.75) + howlBodyDb(k * 100, 400, RATE)
      expect(Math.min(post.points[0][1], post.points[1][1])).toBeCloseTo(loopY(db), 6)
    })
    // The part of a post over the line is drawn again, heavier: here the third, fourth and fifth.
    const over = uprights(drawn, PLAIN_COLOURS.ink).filter((shape) => shape.width === 2)
    const singing = expected.filter((k) => howlLoopDb(0.75) + howlBodyDb(k * 100, 400, RATE) > 0)
    expect(singing).toEqual([3, 4, 5])
    expect(over.map((shape) => shape.points[0][0])).toEqual(
      singing.map((k) => Math.round(xOf(k * 100, plot))),
    )
    for (const shape of over) expect(Math.max(shape.points[0][1], shape.points[1][1])).toBe(zero)
  })

  it('has no post over the line while the loop gain is under 0 dB everywhere', () => {
    const drawn = at({ distance: 10, body: 400, gain: 0.55, width: 0 })
    expect(uprights(drawn, PLAIN_COLOURS.ink).filter((shape) => shape.width === 2)).toHaveLength(0)
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
    const values = { body: 500, gain: 0.8, width: 0, follow: 1 }
    const meters = { ...QUIET, centre: 900, centreRight: 900, ducked: 0.5 }
    // At rest the readings are not looked at.
    const rest = curveOf(at(values, { meters }))
    expect(Math.abs(yAt(rest, xOf(500, plot)) - loopY(howlLoopDb(0.8)))).toBeLessThan(0.5)
    // Running, the curve stands on the reading, and lower by what a new note has taken off.
    const running = curveOf(
      runDisplay(display, params, 0.2, { values, meters, signal: testSignal(), width, height }),
    )
    const ducked = howlLoopDb(0.8) + 20 * Math.log10(0.5)
    expect(Math.abs(yAt(running, xOf(900, plot)) - loopY(ducked))).toBeLessThan(0.5)
    expect(Math.min(...running.map((point) => point[1]))).toBeGreaterThan(loopY(ducked) - 0.5)
    // Switched off it is at rest again.
    const off = curveOf(at(values, { meters, signal: testSignal(), powered: false }))
    expect(Math.abs(yAt(off, xOf(500, plot)) - loopY(howlLoopDb(0.8)))).toBeLessThan(0.5)
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
  const points = (values: Record<string, number> = {}) => handles(values, width, height)
  const point = (key: string, values: Record<string, number> = {}): DisplayHandle => {
    const found = points(values).find((handle) => handle.key === key)
    if (!found) throw new Error(`no handle ${key}`)
    return found
  }

  it('has one on the curve: Body across, Gain up and down', () => {
    const cases: Record<string, number>[] = [{}, { body: 120, gain: 0 }, { body: 2400, gain: 1 }]
    for (const values of cases) {
      const body = point('body', values)
      expect(body.x).toBeCloseTo(xOf(valueOf(values, 'body'), plot), 9)
      expect(body.y).toBeCloseTo(yOfLoop(howlLoopDb(valueOf(values, 'gain')), plot), 9)
      expect(body.x).toBeGreaterThan(plot.x)
      expect(body.x).toBeLessThan(plot.x + plot.w)
      expect(body.y).toBeGreaterThan(plot.y)
      expect(body.y).toBeLessThan(plot.y + plot.h)
    }
    const set = point('body').drag(xOf(1000, plot), yOfLoop(6, plot))
    expect(set.body).toBeCloseTo(1000, 6)
    expect(set.gain).toBeCloseTo(0.8, 9)
    // A drag is solved for the setting whose picture is under the hand.
    const moved = point('body', set)
    expect(moved.x).toBeCloseTo(xOf(1000, plot), 6)
    expect(moved.y).toBeCloseTo(yOfLoop(6, plot), 6)
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

  it('gives each enough travel to be set by hand, and keeps the two apart', () => {
    expect(yOfLoop(howlLoopDb(0), plot) - yOfLoop(howlLoopDb(1), plot)).toBeGreaterThan(40)
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
    // `turn` in howl.h: edge × (T3 / 3, T5 / 5, T7 / 7) of the tone.
    expect(HOWL_EDGE_HARMONICS).toEqual([
      [3, 1 / 3],
      [5, 1 / 5],
      [7, 1 / 7],
    ])
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
    // A side between two overtones (the body moving from one to the next) is given no note.
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
    const body = draw({ width, height, hot: 'body' })
    expect(body.words()).toContain('520 Hz  +3.0 dB')
    expect(patchUnder(body, '520 Hz  +3.0 dB', PLAIN_COLOURS.plate)).not.toBeNull()
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

  it('sings on the post that stands highest over the line, and reads out that tone', async () => {
    for (const [distance, body] of [
      [10, 400],
      [7.645, 520],
      [4, 900],
    ]) {
      const fundamental = howlFundamentalHz(distance)
      const { plot } = howlBoxes(size)
      // The post the picture shows highest.
      const posts = howlPosts(fundamental, plot)
      const height = (k: number): number =>
        howlLoopDb(0.8) + howlBodyDb(k * fundamental, body, RATE)
      const best = posts.reduce((a, b) => (height(b) > height(a) ? b : a))
      expect(height(best)).toBeGreaterThan(0)
      expect(best).toBe(howlOvertone(body, fundamental, RATE))

      const { meter, strike } = await loop({ distance, body, gain: 0.8 })
      const tail = strike(196, 0.5, 1.5)
      const sung = crossingHz(tail, RATE, 1.5 * RATE)
      expect(
        Math.abs(1200 * Math.log2(sung / (best * fundamental))),
        `${distance} ms`,
      ).toBeLessThan(3)
      // The readings the display marks the tone from: its frequency, its level, and where the body stands.
      expect(Math.abs(1200 * Math.log2(meter('pitch') / sung))).toBeLessThan(10)
      expect(meter('pitchRight')).toBeCloseTo(meter('pitch'), 1)
      const level = peakOf(tail, 1.4 * RATE, 1.5 * RATE)
      expect(Math.abs(meter('level') / level - 1)).toBeLessThan(0.05)
      expect(meter('centre') / body).toBeCloseTo(1, 2)
      expect(meter('ducked')).toBe(0)
    }
  })

  it('dies away when no post stands over the line', async () => {
    const fundamental = howlFundamentalHz(10)
    const { plot } = howlBoxes(size)
    for (const k of howlPosts(fundamental, plot))
      expect(howlLoopDb(0.55) + howlBodyDb(k * fundamental, 400, RATE)).toBeLessThan(0)
    const { meter, strike } = await loop({ distance: 10, body: 400, gain: 0.55 })
    const tail = strike(196, 0.5, 1.5)
    expect(peakOf(tail, RATE, 1.5 * RATE)).toBeLessThan(1e-4)
    expect(meter('level')).toBeLessThan(1e-4)
  })

  it('stands its bodies where the picture stands them at rest: Width apart, the left one down', async () => {
    const { meter, strike } = await loop({ body: 500, width: 1, gain: 0.8 })
    strike(196, 0.5, 0.1)
    expect(meter('centre')).toBeCloseTo(howlCentreHz(500, 0, 1, 0, 0), 1)
    expect(meter('centreRight')).toBeCloseTo(howlCentreHz(500, 0, 1, 1, 0), 1)
  })

  it('reads out how much of its gain a new note has taken off', async () => {
    const { meter, strike } = await loop({ follow: 1, gain: 0.8 })
    // A tenth of a second into a note out of silence the loop is knocked right back.
    strike(196, 0.1, 0)
    expect(meter('ducked')).toBeGreaterThan(0.9)
    const less = await loop({ follow: 0.5, gain: 0.8 })
    less.strike(196, 0.1, 0)
    expect(less.meter('ducked')).toBeGreaterThan(0.45)
    expect(less.meter('ducked')).toBeLessThanOrEqual(0.5)
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
