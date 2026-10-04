// The displays of the devices that place a sound, against the devices: the
// cloud against what a pair of samples is, the fans and marks against the
// formulas in `StereoWidener.cpp`, `Utility.ts` and `stereo_detune.h`, and
// the Stereo Detune's readings against the compiled device itself.

import { describe, expect, it } from 'vitest'

import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { STEREO_DETUNE_METERS, STEREO_DETUNE_PARAMS } from '../../dsp/devices/stereo-detune.gen'
import { PLAIN_COLOURS } from '../components/display-kit'
import {
  DETUNE_SMEAR_MS,
  SPATIAL_FACES,
  detuneAngle,
  detuneReach,
  detuneTravel,
  fieldOf,
  utilityPair,
  widening,
} from '../components/displays/spatial'
import { type DisplayLevel, type DisplaySignal } from '../components/plate-display'
import {
  displaySize,
  drawDisplay,
  stockDescriptors,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const EIGHTH = Math.PI / 4
const HALF = Math.SQRT1_2

function plate(id: string) {
  const display = SPATIAL_FACES[id].display
  const params = stock.get(id)?.params ?? {}
  const field = fieldOf(displaySize(display))
  return {
    display,
    params,
    field,
    draw: (options: FrameOptions = {}) => drawDisplay(display, params, options),
    handle: (key: string, values: Record<string, number> = {}) => {
      const found = display
        .handles?.(viewOf(display, params, { values }))
        .find((candidate) => candidate.key === key)
      if (!found) throw new Error(`${id} has no handle ${key}`)
      return found
    },
  }
}

// --- Reading what was drawn -------------------------------------------------

interface Path {
  points: [number, number][]
  rects: number[][]
  arcs: number[][]
  /** What it was filled and drawn with; null for not at all. */
  fill: string | null
  stroke: string | null
  alpha: number
  lineWidth: number
  dash: number[]
}

/** Every path put on the canvas, with what it was painted in. */
function pathsOf(drawn: RecordingContext): Path[] {
  const paths: Path[] = []
  let now: Path | null = null
  let fillStyle = ''
  let strokeStyle = ''
  let alpha = 1
  let lineWidth = 1
  let dash: number[] = []
  for (const { name, args } of drawn.calls) {
    const numbers = args as number[]
    if (name === 'set fillStyle') fillStyle = String(args[0])
    else if (name === 'set strokeStyle') strokeStyle = String(args[0])
    else if (name === 'set globalAlpha') alpha = numbers[0]
    else if (name === 'set lineWidth') lineWidth = numbers[0]
    else if (name === 'setLineDash') dash = args[0] as number[]
    else if (name === 'beginPath') {
      now = {
        points: [],
        rects: [],
        arcs: [],
        fill: null,
        stroke: null,
        alpha: 1,
        lineWidth: 1,
        dash: [],
      }
      paths.push(now)
    } else if (!now) continue
    else if (name === 'moveTo' || name === 'lineTo') now.points.push([numbers[0], numbers[1]])
    else if (name === 'rect') now.rects.push(numbers)
    else if (name === 'arc') now.arcs.push(numbers)
    else if (name === 'fill') {
      now.fill = fillStyle
      now.alpha = alpha
    } else if (name === 'stroke') {
      now.stroke = strokeStyle
      now.lineWidth = lineWidth
      now.dash = dash
      if (now.fill === null) now.alpha = alpha
    }
  }
  return paths
}

const { ink, accent, plate: ground } = PLAIN_COLOURS

/** The cloud: the one path of small squares, as the middles of the squares. */
function cloudOf(drawn: RecordingContext): [number, number][] {
  const cloud = pathsOf(drawn).filter((path) => path.rects.length > 0)
  expect(cloud.length, 'the cloud is one path').toBeLessThanOrEqual(1)
  return (cloud[0]?.rects ?? []).map(([x, y, w, h]) => [x + w / 2, y + h / 2])
}

/** The dots in the accent, by where they stand and how large they are. */
const dotsOf = (drawn: RecordingContext): { x: number; y: number; radius: number }[] =>
  pathsOf(drawn)
    .filter((path) => path.fill === accent && path.arcs.length === 1)
    .map((path) => ({ x: path.arcs[0][0], y: path.arcs[0][1], radius: path.arcs[0][2] }))

/** The fans: the filled shapes that start at the listener. */
const fansOf = (drawn: RecordingContext, field: { cx: number; cy: number }): Path[] =>
  pathsOf(drawn).filter(
    (path) =>
      path.fill === ink &&
      path.points.length > 20 &&
      path.points[0][0] === field.cx &&
      path.points[0][1] === field.cy,
  )

// --- Sounds -----------------------------------------------------------------

const WINDOW = 2048

function level(sample: (i: number) => number): DisplayLevel {
  const wave = new Float32Array(WINDOW)
  let peak = 0
  let sum = 0
  for (let i = 0; i < WINDOW; i++) {
    wave[i] = sample(i)
    peak = Math.max(peak, Math.abs(wave[i]))
    sum += wave[i] * wave[i]
  }
  return { peak, rms: Math.sqrt(sum / WINDOW), wave }
}

/** The sound at a device with these two sides. */
function sound(left: (i: number) => number, right: (i: number) => number): DisplaySignal {
  return {
    input: null,
    output: level(left),
    spectrum: null,
    binHz: 0,
    left: level(left),
    right: level(right),
  }
}

const tone =
  (peak: number, cycles = 8, turn = 0) =>
  (i: number): number =>
    peak * Math.sin((i / WINDOW) * cycles * 2 * Math.PI + turn * 2 * Math.PI)

// --- The field --------------------------------------------------------------

describe('the stereo field every spatial display stands on', () => {
  const { field, draw } = plate('stereo-widener')
  /** Where the mark on the scale of likeness stands, −1..1. */
  const alike = (drawn: RecordingContext): number => {
    const marks = dotsOf(drawn).filter((dot) => dot.radius === 2.5)
    expect(marks.length).toBe(1)
    const from = field.alike.x + 16
    const to = field.alike.x + field.alike.w - 16
    return ((marks[0].x - from) / (to - from)) * 2 - 1
  }

  it('draws a sound that is the same on both sides as an upright line, and says +1', () => {
    const drawn = draw({ signal: sound(tone(0.5), tone(0.5)) })
    const cloud = cloudOf(drawn)
    expect(cloud.length).toBeGreaterThan(100)
    expect(cloud.length).toBeLessThanOrEqual(400)
    for (const [x] of cloud) expect(x).toBeCloseTo(field.cx, 6)
    expect(Math.min(...cloud.map(([, y]) => y))).toBeLessThan(field.cy - field.r * 0.5)
    expect(alike(drawn)).toBeCloseTo(1, 6)
  })

  it('draws one side against the other flat along the foot, and says −1', () => {
    const drawn = draw({ signal: sound(tone(0.5), tone(-0.5)) })
    const cloud = cloudOf(drawn)
    for (const [, y] of cloud) expect(y).toBeCloseTo(field.cy, 6)
    const across = cloud.map(([x]) => x - field.cx)
    expect(Math.max(...across)).toBeGreaterThan(field.r * 0.5)
    expect(Math.min(...across)).toBeLessThan(-field.r * 0.5)
    expect(alike(drawn)).toBeCloseTo(-1, 6)
  })

  it('draws one side alone along its diagonal: the left to the left', () => {
    for (const [left, right, sign] of [
      [tone(0.5), () => 0, -1],
      [() => 0, tone(0.5), 1],
    ] as const) {
      const cloud = cloudOf(draw({ signal: sound(left, right) }))
      for (const [x, y] of cloud) expect(sign * (x - field.cx)).toBeCloseTo(field.cy - y, 6)
      expect(Math.max(...cloud.map(([x]) => sign * (x - field.cx)))).toBeGreaterThan(field.r * 0.3)
    }
  })

  it('says 0 of two sides that have nothing to do with each other', () => {
    expect(alike(draw({ signal: sound(tone(0.5), tone(0.5, 8, 0.25)) }))).toBeCloseTo(0, 6)
    expect(alike(draw({ signal: sound(tone(0.5), tone(0.2, 13)) }))).toBeCloseTo(0, 6)
  })

  it('stands a pair by the cube root of its size: full scale on the rim, an eighth half way', () => {
    for (const [size, at] of [
      [1, 1],
      [0.125, 0.5],
      [0.001, 0.1],
    ]) {
      const cloud = cloudOf(
        draw({
          signal: sound(
            () => size,
            () => size,
          ),
        }),
      )
      for (const [x, y] of cloud) {
        expect(x).toBeCloseTo(field.cx, 6)
        expect(field.cy - y).toBeCloseTo(at * field.r, 4)
      }
    }
    // One side alone at full scale is 3 dB under both: the cube root of √½ of the way.
    const [x, y] = cloudOf(
      draw({
        signal: sound(
          () => 1,
          () => 0,
        ),
      }),
    )[0]
    expect(Math.hypot(x - field.cx, field.cy - y)).toBeCloseTo(Math.cbrt(HALF) * field.r, 4)
  })

  it('shows each side as a bar in dB: full scale fills it, 24 dB under fills half', () => {
    const drawn = draw({ signal: sound(tone(1), tone(Math.pow(10, -24 / 20))) })
    const bars = drawn.calls.filter((call) => call.name === 'fillRect').map((call) => call.args)
    const [left, right] = field.bars
    expect(bars).toContainEqual([left.x, left.y, left.w, left.h])
    const half = bars.find(
      ([x, , , h]) => x === right.x && Math.abs((h as number) - right.h / 2) < 1e-3,
    )
    expect(half, 'the right bar stands half way').toBeDefined()
    expect(half?.[1]).toBeCloseTo(right.y + right.h / 2, 3)
  })

  it('says nothing of silence, and at rest shows no sound at all', () => {
    const silent = draw({
      signal: sound(
        () => 0,
        () => 0,
      ),
    })
    expect(dotsOf(silent)).toEqual([])
    const still = draw()
    expect(cloudOf(still)).toEqual([])
    expect(
      still.calls.some((call) => call.name === 'set fillStyle' && call.args[0] === accent),
    ).toBe(false)
  })

  it('lays the bars beside a wide disc and under a narrow one, and keeps all of it on the display', () => {
    for (const [width, height] of [
      [176, 100],
      [128, 100],
      [80, 100],
      [184, 48],
      [389, 100],
    ]) {
      const made = fieldOf({ width, height })
      expect(made.upright).toBe(width >= 176)
      expect(made.cx - made.r).toBeGreaterThanOrEqual(4)
      expect(made.cy - made.r).toBeGreaterThanOrEqual(4)
      for (const box of [made.alike, ...made.bars]) {
        expect(box.x).toBeGreaterThanOrEqual(4)
        expect(box.x + box.w).toBeLessThanOrEqual(width - 4)
        expect(box.y + box.h).toBeLessThanOrEqual(height - 4 + 1e-9)
      }
    }
  })
})

// --- Stereo Widener ---------------------------------------------------------

describe('the Stereo Widener display', () => {
  const { field, draw, handle } = plate('stereo-widener')
  /** One fan radius: the field as it came. */
  const unit = field.r / (2.5 * HALF + 0.1)

  it('has the gains StereoWidener::updateParameters sets', () => {
    expect(widening(0)).toMatchObject({ side: 0, bass: 1, blur: 0, late: 0 })
    expect(widening(0).mid).toBeCloseTo(Math.SQRT2, 9)
    expect(widening(0.25).side).toBeCloseTo(0.5, 9)
    expect(widening(0.5)).toMatchObject({ side: 1, mid: 1, blur: 0, late: 0 })
    expect(widening(0.5).bass).toBeCloseTo(0.65, 9)
    expect(widening(0.75)).toMatchObject({ side: 1.75, blur: 0, late: 0 })
    expect(widening(0.875).blur).toBeCloseTo(0.5, 9)
    expect(widening(0.85).late).toBe(0)
    expect(widening(0.925).late).toBeCloseTo(0.5, 9)
    const top = widening(1)
    expect(top.side).toBeCloseTo(2.5, 9)
    expect(top.mid).toBeCloseTo(1 / Math.sqrt(3.625), 9)
    expect(top.bass).toBeCloseTo(0.3, 9)
    expect(top.blur).toBeCloseTo(1, 9)
    expect(top.late).toBeCloseTo(1, 9)
  })

  it('stands the fan edge where the right side alone goes', () => {
    // As it came: on the right diagonal, one fan radius out.
    const normal = handle('width', { width: 0.5 })
    expect(normal.x - field.cx).toBeCloseTo(unit * HALF, 6)
    expect(field.cy - normal.y).toBeCloseTo(unit * HALF, 6)
    // Mono: in the middle, and 3 dB up.
    const mono = handle('width', { width: 0 })
    expect(mono.x).toBeCloseTo(field.cx, 6)
    expect(field.cy - mono.y).toBeCloseTo(unit, 6)
    // The widest: 2.5 times as far across, and down by the gain on the sum.
    const widest = handle('width', { width: 1 })
    expect(widest.x - field.cx).toBeCloseTo(2.5 * unit * HALF, 6)
    expect(field.cy - widest.y).toBeCloseTo((unit * HALF) / Math.sqrt(3.625), 6)
    expect(Math.atan2(widest.x - field.cx, field.cy - widest.y)).toBeCloseTo(
      Math.atan(2.5 * Math.sqrt(3.625)),
      6,
    )
    expect(widest.x).toBeLessThan(field.cx + field.r)
  })

  it('takes the width from how far across the edge is dragged, and gives the same one back', () => {
    for (let width = 0; width <= 1.0001; width += 0.05) {
      const edge = handle('width', { width })
      expect(edge.drag(edge.x, edge.y).width).toBeCloseTo(width, 9)
      // Only across counts: up and down the edge stays where it is.
      expect(edge.drag(edge.x, 0).width).toBeCloseTo(width, 9)
    }
    const edge = handle('width')
    expect(edge.drag(field.cx - 30, 50).width).toBe(0)
    expect(edge.drag(field.cx + field.r + 40, 50).width).toBe(1)
    expect(edge.reset?.()).toEqual({ width: 0.5 })
  })

  it('draws the fan and the bass from the same gains', () => {
    for (const width of [0.25, 0.5, 0.7, 1]) {
      const set = widening(width)
      const [bass, fan] = fansOf(draw({ values: { width } }), field)
      const middle = (path: Path) => path.points[13]
      const corner = (path: Path) => path.points[25]
      expect(middle(fan)[0]).toBeCloseTo(field.cx, 6)
      expect(field.cy - middle(fan)[1]).toBeCloseTo(set.mid * unit, 6)
      expect(corner(fan)[0] - field.cx).toBeCloseTo(set.side * HALF * unit, 6)
      expect(field.cy - corner(fan)[1]).toBeCloseTo(set.mid * HALF * unit, 6)
      // The bass keeps its sum and so much of its difference.
      const small = unit * 0.55
      expect(field.cy - middle(bass)[1]).toBeCloseTo(small, 6)
      expect(corner(bass)[0] - field.cx).toBeCloseTo(set.bass * HALF * small, 6)
      expect(field.cy - corner(bass)[1]).toBeCloseTo(HALF * small, 6)
    }
    // As it came, the fan is the field itself: every point of its arc one radius out.
    const [, fan] = fansOf(draw({ values: { width: 0.5 } }), field)
    for (const [x, y] of fan.points.slice(1))
      expect(Math.hypot(x - field.cx, field.cy - y)).toBeCloseTo(unit, 6)
  })

  it('fades the fan edges as the allpasses come in, and draws nothing the device does not do', () => {
    /** The two edges: the lines from the listener to the ends of the fan's arc. */
    const edges = (width: number): Path[] => {
      const [, fan] = fansOf(draw({ values: { width } }), field)
      const ends = [fan.points[1], fan.points[fan.points.length - 1]]
      return pathsOf(draw({ values: { width } })).filter(
        (path) =>
          path.lineWidth === 1.5 &&
          path.points.length === 2 &&
          path.points[0][0] === field.cx &&
          path.points[0][1] === field.cy &&
          ends.some(([x, y]) => path.points[1][0] === x && path.points[1][1] === y),
      )
    }
    for (const [width, alpha] of [
      [0.5, 1],
      [0.75, 1],
      [0.8, 1 - 0.75 * 0.2],
      [1, 0.25],
    ]) {
      const found = edges(width)
      expect(found.length).toBe(2)
      for (const edge of found) expect(edge.alpha).toBeCloseTo(alpha, 9)
    }
    // Past the marks nothing is drawn beyond the fan: every dotted line is the
    // corner's own path, one pixel wide.
    for (const width of [0.8, 0.9, 1]) {
      const dotted = pathsOf(draw({ values: { width } })).filter(
        (path) => path.dash.join() === '1,3',
      )
      expect(dotted.length).toBe(1)
      expect(dotted[0].lineWidth).toBe(1)
    }
  })

  it('says how wide in a word, and names what is added past each mark', () => {
    const words = (width: number): string[] => draw({ values: { width } }).words()
    expect(words(0)).toContain('MONO')
    expect(words(0.3)).toContain('NARROW')
    expect(words(0.5)).toContain('NORMAL')
    expect(words(0.7)).toContain('WIDE')
    expect(words(0.7)).not.toContain('PHASE')
    // The allpasses turn each side's phase from three quarters up.
    expect(words(0.75)).not.toContain('PHASE')
    expect(words(0.8)).toEqual(expect.arrayContaining(['WIDE', 'PHASE']))
    expect(words(0.8)).not.toContain('DELAY')
    // The right side's late copy comes in from 0.85 up.
    expect(words(0.85)).not.toContain('DELAY')
    expect(words(0.9)).toEqual(expect.arrayContaining(['WIDE', 'PHASE', 'DELAY']))
    expect(words(1)).toEqual(expect.arrayContaining(['WIDE', 'PHASE', 'DELAY']))
  })

  it('works a pair through StereoWidener::process by hand: the left alone at full Width', () => {
    // Above the bass: mid = 0.5, side = 0.5; mid gain 1/sqrt(3.625) = 0.5252, side gain 2.5.
    // Left = 0.2626 + 1.25 = 1.5126, right = 0.2626 - 1.25 = -0.9874: the right is against the left.
    const { side, mid } = widening(1)
    expect(0.5 * mid + 0.5 * side).toBeCloseTo(1.5126, 4)
    expect(0.5 * mid - 0.5 * side).toBeCloseTo(-0.9874, 4)
    // On the field that is the fan's left corner, a mirror of the handle.
    const corner = handle('width', { width: 1 })
    const [, fan] = fansOf(draw({ values: { width: 1 } }), field)
    expect(fan.points[1][0]).toBeCloseTo(2 * field.cx - corner.x, 6)
    expect(fan.points[1][1]).toBeCloseTo(corner.y, 6)
    // The bass under 200 Hz keeps its sum and 0.3 of its difference: 0.65 and 0.35.
    expect(0.5 + 0.5 * widening(1).bass).toBeCloseTo(0.65, 9)
    expect(0.5 - 0.5 * widening(1).bass).toBeCloseTo(0.35, 9)
  })
})

// --- Utility ----------------------------------------------------------------

describe('the Utility display', () => {
  const { field, draw, handle } = plate('utility')
  const unit = field.r / 1.5
  const angle = (x: number, y: number): number => Math.atan2(x - field.cx, field.cy - y)

  it('has the width and the pan of Utility.ts', () => {
    // Full width and in the middle, a pair goes through as it came.
    const [sameL, sameR] = utilityPair(0.3, -0.8, 1, 0)
    expect(sameL).toBeCloseTo(0.3, 12)
    expect(sameR).toBeCloseTo(-0.8, 12)
    // Width at nothing: both sides are half the sum.
    const [l, r] = utilityPair(0.3, -0.8, 0, 0)
    expect(l).toBeCloseTo(-0.25, 9)
    expect(r).toBeCloseTo(-0.25, 9)
    const [narrowL, narrowR] = utilityPair(1, 0, 0.5, 0)
    expect(narrowL).toBeCloseTo(0.75, 12)
    expect(narrowR).toBeCloseTo(0.25, 12)
    // Hard over, everything is on one side: nothing is thrown away.
    const right = utilityPair(0.3, 0.5, 1, 1)
    expect(right[0]).toBeCloseTo(0, 9)
    expect(right[1]).toBeCloseTo(0.8, 9)
    const left = utilityPair(0.3, 0.5, 1, -1)
    expect(left[0]).toBeCloseTo(0.8, 9)
    expect(left[1]).toBeCloseTo(0, 9)
    // Half way to the right: the left is turned down by cos 45° and that much of it handed over.
    const half = utilityPair(1, 1, 1, 0.5)
    expect(half[0]).toBeCloseTo(HALF, 9)
    expect(half[1]).toBeCloseTo(1 + HALF, 9)
  })

  it('leans the middle an eighth of a turn for the whole of Pan, and stands the point there', () => {
    for (const pan of [-1, -0.6, -0.25, 0, 0.25, 0.5, 1]) {
      for (const width of [0, 0.4, 1]) {
        const [l, r] = utilityPair(1, 1, width, pan)
        expect(Math.atan2(r - l, r + l)).toBeCloseTo(pan * EIGHTH, 9)
      }
      const point = handle('pan', { pan })
      expect(angle(point.x, point.y)).toBeCloseTo(pan * EIGHTH, 9)
      expect(Math.hypot(point.x - field.cx, field.cy - point.y)).toBeCloseTo(field.r, 6)
      expect(point.drag(point.x, point.y).pan).toBeCloseTo(pan, 9)
    }
    const point = handle('pan')
    expect(point.drag(field.cx + 40, field.cy + 30).pan).toBe(1)
    expect(point.drag(field.cx - 40, field.cy + 30).pan).toBe(-1)
    expect(point.drag(field.cx, 0).pan).toBeCloseTo(0, 9)
    expect(point.reset?.()).toEqual({ pan: 0 })
  })

  it('stands the fan edge where the right side alone goes, and gives the width back', () => {
    const full = handle('width')
    expect(full.x - field.cx).toBeCloseTo(unit * HALF, 6)
    expect(field.cy - full.y).toBeCloseTo(unit * HALF, 6)
    const mono = handle('width', { width: 0 })
    expect(mono.x).toBeCloseTo(field.cx, 6)
    expect(field.cy - mono.y).toBeCloseTo(unit * HALF, 6)
    for (const pan of [-0.9, -0.5, 0, 0.3, 0.8]) {
      for (const width of [0, 0.2, 0.5, 0.85, 1]) {
        const edge = handle('width', { width, pan })
        expect(edge.drag(edge.x, edge.y).width).toBeCloseTo(width, 3)
      }
    }
    // Hard over, the edge does not move with the width: it is left where it is.
    for (const pan of [-1, 1]) {
      const edge = handle('width', { width: 0.4, pan })
      expect(edge.drag(edge.x, edge.y)).toEqual({ width: 0.4 })
      expect(edge.drag(10, 10)).toEqual({ width: 0.4 })
    }
    expect(full.drag(field.cx, 10).width).toBeCloseTo(0, 3)
    expect(full.reset?.()).toEqual({ width: 1 })
  })

  it('moves the fan edge only outward as the width rises, at every pan: so halving finds it', () => {
    for (let pan = -0.98; pan <= 0.981; pan += 0.07) {
      let before = -Infinity
      for (let width = 0; width <= 1.0001; width += 0.05) {
        const [l, r] = utilityPair(0, 1, width, pan)
        const at = Math.atan2(r - l, r + l)
        expect(at).toBeGreaterThan(before)
        before = at
      }
    }
    // By hand, in the middle: the right alone at Width one half is 0.25 and 0.75, at atan(0.5).
    const [l, r] = utilityPair(0, 1, 0.5, 0)
    expect(l).toBeCloseTo(0.25, 12)
    expect(r).toBeCloseTo(0.75, 12)
    const edge = handle('width', { width: 0.5 })
    expect(angle(edge.x, edge.y)).toBeCloseTo(Math.atan(0.5), 9)
  })

  it('draws the fan through the same sum: a line when mono, on one diagonal when hard over', () => {
    const fan = (values: Record<string, number>): [number, number][] =>
      fansOf(draw({ values }), field)[0].points.slice(1)
    for (const [x, y] of fan({}))
      expect(Math.hypot(x - field.cx, field.cy - y)).toBeCloseTo(unit, 6)
    for (const [x] of fan({ width: 0 })) expect(x).toBeCloseTo(field.cx, 6)
    for (const [x, y] of fan({ pan: 1 })) expect(x - field.cx).toBeCloseTo(field.cy - y, 6)
    for (const [x, y] of fan({ pan: -1 })) expect(field.cx - x).toBeCloseTo(field.cy - y, 6)
    // Hard over, the middle is 3 dB up: √2 fan radii out.
    const reach = Math.max(
      ...fan({ pan: 1 }).map(([x, y]) => Math.hypot(x - field.cx, field.cy - y)),
    )
    expect(reach).toBeCloseTo(Math.SQRT2 * unit, 6)
    expect(reach).toBeLessThan(field.r)
  })

  it('marks Gain on the bars, on their scale of dB', () => {
    const [bar] = field.bars
    const mark = (gainDb: number): number => {
      const lines = pathsOf(draw({ values: { gainDb } })).filter((path) => path.lineWidth === 2)
      expect(lines.length).toBe(1)
      return (lines[0].points[0][0] - bar.x) / bar.w
    }
    // The bars run from −48 to +12 dB.
    expect(mark(12)).toBeCloseTo(1, 9)
    expect(mark(0)).toBeCloseTo(0.8, 9)
    expect(mark(-18)).toBeCloseTo(0.5, 9)
    expect(mark(-60)).toBe(0)
  })

  it('says the pan, the flipped polarity and mono in words', () => {
    const words = (values: Record<string, number>): string[] => draw({ values }).words()
    expect(words({})).toContain('C')
    expect(words({ pan: 0.5 })).toContain('50R')
    expect(words({ pan: -1 })).toContain('100L')
    expect(words({ polarity: 1 })).toContain('Ø')
    expect(words({})).not.toContain('Ø')
    expect(words({})).not.toContain('MONO')
    expect(words({ width: 0 })).toContain('MONO')
    // Both at once are two words in two places, so neither runs under the point on the rim.
    expect(words({ width: 0, polarity: 1 })).toEqual(expect.arrayContaining(['Ø', 'MONO']))
    const drawn = draw({ values: { width: 0, polarity: 1, pan: -0.6 } })
    const point = handle('pan', { pan: -0.6 })
    for (const call of drawn.calls.filter((made) => made.name === 'fillText')) {
      const [word, x, y] = call.args as [string, number, number]
      if (word !== 'Ø' && word !== 'MONO') continue
      // A word of 8 px type: about 5 px a letter, 6 px high over its line.
      const clear = point.x - 5 > x + word.length * 5.5 || point.y - 5 > y || point.y + 5 < y - 6
      expect(clear, `${word} is clear of the pan point`).toBe(true)
    }
  })
})

// --- Stereo Detune ----------------------------------------------------------

describe('the Stereo Detune display', () => {
  const { field, draw, handle } = plate('stereo-detune')
  const P = STEREO_DETUNE_PARAMS
  /** A bead at Mix `mix` with the level hold at `hold`. */
  const beadRadius = (mix: number, hold = 1): number =>
    1.5 + 2.5 * Math.sin((mix * Math.PI) / 2) * hold
  interface Bead {
    out: number
    angle: number
    radius: number
    fill: string | null
  }
  /**
   * The two beads, the left one first: the dots with a ring on the disc, how
   * far out and at what angle. The point that is dragged is a ring too, but
   * filled with the plate.
   */
  const beads = (drawn: RecordingContext): Bead[] =>
    pathsOf(drawn)
      .filter(
        (path) =>
          path.arcs.length === 1 &&
          path.fill !== null &&
          path.fill !== ground &&
          path.stroke === ink &&
          path.arcs[0][1] < field.alike.y,
      )
      .map((path) => ({ x: path.arcs[0][0], y: path.arcs[0][1], radius: path.arcs[0][2], path }))
      .sort((a, b) => a.x - b.x)
      .map((dot) => ({
        out: Math.hypot(dot.x - field.cx, field.cy - dot.y) / field.r,
        angle: Math.atan2(dot.x - field.cx, field.cy - dot.y),
        radius: dot.radius,
        fill: dot.path.fill,
      }))
  const live = { centsLeft: 11.4, centsRight: -7.6, delayLeft: 20, delayRight: 30 }

  it('pans the copies as stereo_detune.h does: an eighth of a turn each way at full Width', () => {
    for (const width of [0, 0.25, 0.5, 1]) {
      // The sharp copy goes to the left with `near` and to the right with `far`.
      const turn = 0.125 * (1 - width)
      const near = Math.cos(2 * Math.PI * turn)
      const far = Math.sin(2 * Math.PI * turn)
      expect(detuneAngle(0, width)).toBeCloseTo(Math.atan2(far - near, far + near), 9)
      expect(detuneAngle(1, width)).toBeCloseTo(Math.atan2(near - far, near + far), 9)
    }
    expect(detuneAngle(0, 1)).toBeCloseTo(-EIGHTH, 9)
    expect(detuneAngle(1, 0)).toBeCloseTo(0, 9)
  })

  it('stands a copy further out the later it is, by the square root, the rim at 120 ms', () => {
    expect(detuneReach(0)).toBe(0)
    expect(detuneReach(30)).toBeCloseTo(0.5, 9)
    expect(detuneReach(120)).toBe(1)
    expect(detuneReach(400)).toBe(1)
    // The latest a head can be is inside the rim: Delay at its top, the right
    // side's 1.4 times, the travel to a forced splice and the drift.
    expect(P.delay.max * 1.4 + 9.5 + 1.5).toBeLessThan(120)
  })

  it('at rest stands the copies at the Delay, the right one 1.4 times as late, and says the Detune', () => {
    const drawn = draw()
    const [left, right] = beads(drawn)
    expect(left.out).toBeCloseTo(detuneReach(14), 6)
    expect(right.out).toBeCloseTo(detuneReach(14 * 1.4), 6)
    expect(left.angle).toBeCloseTo(-EIGHTH, 6)
    expect(right.angle).toBeCloseTo(EIGHTH, 6)
    expect(left.radius).toBeCloseTo(beadRadius(0.36), 9)
    // The numbers: each copy's detune over the disc, its Delay at the foot (19.6 ms is said as 20).
    expect(drawn.words()).toEqual(expect.arrayContaining(['+9 ct', '−9 ct', '14 ms', '20 ms']))
    expect(draw({ values: { delay: 45 } }).words()).toEqual(
      expect.arrayContaining(['45 ms', '63 ms']),
    )
    const set = beads(draw({ values: { delay: 40, width: 0.5, detune: 23.4, mix: 1 } }))
    expect(set[0].out).toBeCloseTo(detuneReach(40), 6)
    expect(set[1].out).toBeCloseTo(detuneReach(56), 6)
    expect(set[0].angle).toBeCloseTo(-EIGHTH / 2, 6)
    expect(set[0].radius).toBeCloseTo(4, 9)
  })

  it('running stands them where the device says its heads are, and says its detune', () => {
    const drawn = draw({ meters: { ...live, holdLeft: 1, holdRight: 0.5 } })
    const [left, right] = beads(drawn)
    expect(left.out).toBeCloseTo(detuneReach(20), 6)
    expect(right.out).toBeCloseTo(detuneReach(30), 6)
    expect(left.radius).toBeCloseTo(beadRadius(0.36), 9)
    // The level hold has the right copy at half: its bead is that much smaller.
    expect(right.radius).toBeCloseTo(beadRadius(0.36, 0.5), 9)
    // The detune is the device's now; the Delay at the foot stays what is set.
    expect(drawn.words()).toEqual(expect.arrayContaining(['+11 ct', '−8 ct', '14 ms', '20 ms']))
  })

  it('paints the beads in the accent only while the device says where its heads are', () => {
    const running = beads(draw({ meters: { ...live, holdLeft: 1, holdRight: 1 } }))
    expect(running.map((bead) => bead.fill)).toEqual([accent, accent])
    for (const drawn of [
      draw(),
      draw({ meters: { ...live, holdLeft: 1, holdRight: 1 }, powered: false }),
    ]) {
      expect(beads(drawn).map((bead) => bead.fill)).toEqual([ink, ink])
      expect(
        drawn.calls.some((call) => call.name === 'set fillStyle' && call.args[0] === accent),
      ).toBe(false)
    }
  })

  it('keeps to what is set until a reading has come, and while switched off', () => {
    const none = { centsLeft: 0, centsRight: 0, delayLeft: 0, delayRight: 0, holdLeft: 0 }
    for (const drawn of [
      draw({ meters: { ...none, holdRight: 0 } }),
      draw({ meters: { ...live, holdLeft: 1, holdRight: 1 }, powered: false }),
    ]) {
      const [left, right] = beads(drawn)
      expect(left.out).toBeCloseTo(detuneReach(14), 6)
      expect(right.out).toBeCloseTo(detuneReach(19.6), 6)
      expect(left.radius).toBeCloseTo(beadRadius(0.36), 9)
      expect(drawn.words()).toEqual(expect.arrayContaining(['+9 ct', '−9 ct']))
    }
  })

  it('draws the rail the head travels: 7.5 ms either side of the Delay, none for a copy that holds still', () => {
    /** The lines from the listener's side outward along the left copy's angle, as delays. */
    const rails = (values: Record<string, number>): [number, number][] =>
      pathsOf(draw({ values }))
        .filter(
          (path) =>
            path.stroke === ink &&
            path.points.length === 2 &&
            path.arcs.length === 0 &&
            path.points.every(
              ([x, y]) =>
                (x !== field.cx || y !== field.cy) &&
                Math.abs(Math.atan2(x - field.cx, field.cy - y) + EIGHTH) < 1e-6,
            ),
        )
        .map(
          (path) =>
            path.points.map(
              ([x, y]) => Math.pow(Math.hypot(x - field.cx, field.cy - y) / field.r, 2) * 120,
            ) as [number, number],
        )
    const [plain] = rails({ drift: 0 })
    expect(plain[0]).toBeCloseTo(6.5, 6)
    expect(plain[1]).toBeCloseTo(21.5, 6)
    // Drift at full wanders the delay 1.5 ms more each way.
    const [drifting] = rails({ drift: 1, delay: 30 })
    expect(drifting[0]).toBeCloseTo(21, 6)
    expect(drifting[1]).toBeCloseTo(39, 6)
    // Neither detuned nor drifting, the head stays where it is: no rail.
    expect(rails({ detune: 0, drift: 0 })).toEqual([])
    // Drift alone is a detune that wanders: the head travels its whole rail all the same.
    expect(detuneTravel(0, 0)).toBe(0)
    expect(detuneTravel(9, 0)).toBe(7.5)
    expect(detuneTravel(0, 0.6)).toBeCloseTo(7.5 + 0.9, 9)
    const [wandering] = rails({ detune: 0, drift: 0.6, delay: 25 })
    expect(wandering[0]).toBeCloseTo(25 - 8.4, 6)
    expect(wandering[1]).toBeCloseTo(25 + 8.4, 6)
  })

  it('marks the Delay across each rail with a short line', () => {
    const marks = pathsOf(draw({ values: { delay: 30, width: 1 } })).filter(
      (path) =>
        path.stroke === ink &&
        path.points.length === 2 &&
        path.points[0][1] < field.cy &&
        Math.abs(
          Math.hypot(path.points[1][0] - path.points[0][0], path.points[1][1] - path.points[0][1]) -
            6,
        ) < 1e-6,
    )
    expect(marks.length).toBe(2)
    const middles = marks
      .map(({ points: [[x1, y1], [x2, y2]] }) => [(x1 + x2) / 2, (y1 + y2) / 2])
      .sort((a, b) => a[0] - b[0])
    for (const [n, ms] of [30, 42].entries()) {
      const [x, y] = middles[n]
      expect(Math.hypot(x - field.cx, field.cy - y) / field.r).toBeCloseTo(detuneReach(ms), 6)
      expect(Math.atan2(x - field.cx, field.cy - y)).toBeCloseTo(n === 0 ? -EIGHTH : EIGHTH, 6)
    }
  })

  it('draws each time round as late again and that much quieter, later by the allpasses, as far as the rim', () => {
    /** The repeats: the dots in the ink, as how far out and how strong. */
    const repeats = (values: Record<string, number>): { ms: number; alpha: number }[] =>
      pathsOf(draw({ values }))
        .filter((path) => path.fill === ink && path.arcs.length === 1 && path.arcs[0][2] < 2)
        .map((path) => ({
          ms:
            Math.pow(
              Math.hypot(path.arcs[0][0] - field.cx, field.cy - path.arcs[0][1]) / field.r,
              2,
            ) * 120,
          alpha: path.alpha,
        }))
    expect(repeats({ feedback: 0 })).toEqual([])
    // kDiffusionSeconds: 3.11 and 5.23 ms on the left, 3.97 and 6.41 ms on the right.
    expect(DETUNE_SMEAR_MS[0]).toBeCloseTo(8.34, 9)
    expect(DETUNE_SMEAR_MS[1]).toBeCloseTo(10.38, 9)
    const round = repeats({ feedback: 0.5 })
    // Left: 2 x 14 + 8.34, 3 x 14 + 16.68, 4 x 14 + 25.02 ms; right the same from 19.6 and 10.38.
    expect(round.map((dot) => Math.round(dot.ms * 100) / 100)).toEqual([
      36.34, 58.68, 81.02, 49.58, 79.56, 109.54,
    ])
    expect(round.map((dot) => dot.alpha)).toEqual([0.5, 0.25, 0.125, 0.5, 0.25, 0.125])
    // At a Delay of 50 ms the left's second pass is still on the disc and the right's is past the rim.
    expect(
      repeats({ feedback: 0.5, delay: 50 }).map((dot) => Math.round(dot.ms * 100) / 100),
    ).toEqual([108.34])
    expect(repeats({ feedback: 0.5, delay: 60 })).toEqual([])
  })

  it('shows the dry sound at the listener, as much of it as Mix leaves', () => {
    const dry = (mix: number): number => {
      const found = pathsOf(draw({ values: { mix } })).filter(
        (path) =>
          path.fill === ink &&
          path.arcs.length === 1 &&
          path.arcs[0][0] === field.cx &&
          path.arcs[0][1] === field.cy,
      )
      expect(found.length).toBe(1)
      return found[0].arcs[0][2]
    }
    expect(dry(0)).toBeCloseTo(4.5, 9)
    expect(dry(0.5)).toBeCloseTo(1.5 + 3 * HALF, 9)
    expect(dry(1)).toBeCloseTo(1.5, 9)
  })

  /** A place on the field so many ms out, at an angle off straight up (left is negative). */
  const placeOf = (ms: number, angle: number): [number, number] => [
    field.cx + field.r * detuneReach(ms) * Math.sin(angle),
    field.cy - field.r * detuneReach(ms) * Math.cos(angle),
  ]
  /** The rings filled with the plate: the points that can be dragged. */
  const rings = (drawn: RecordingContext): { x: number; y: number; radius: number }[] =>
    pathsOf(drawn)
      .filter((path) => path.arcs.length === 1 && path.fill === ground && path.stroke === ink)
      .map((path) => ({ x: path.arcs[0][0], y: path.arcs[0][1], radius: path.arcs[0][2] }))

  it('has Delay and Width on a point at the mark across the left copy', () => {
    const settings: Record<string, number>[] = [
      {},
      { delay: 30, width: 1 },
      { delay: 12, width: 0 },
      { delay: 60, width: 0.5 },
      { delay: 45, width: 0.2 },
    ]
    for (const values of settings) {
      const delay = values.delay ?? 14
      const width = values.width ?? 1
      const point = handle('copy', values)
      // As far out as the Delay, an eighth of a turn to the left at full Width.
      const [x, y] = placeOf(delay, -EIGHTH * width)
      expect(point.x).toBeCloseTo(x, 9)
      expect(point.y).toBeCloseTo(y, 9)
      // The short line across the rail has its middle there, and the ring is drawn round it.
      const drawn = draw({ values })
      const marks = pathsOf(drawn)
        .filter(
          (path) =>
            path.stroke === ink &&
            path.points.length === 2 &&
            Math.abs(
              Math.hypot(
                path.points[1][0] - path.points[0][0],
                path.points[1][1] - path.points[0][1],
              ) - 6,
            ) < 1e-6,
        )
        .map(({ points: [[x1, y1], [x2, y2]] }) => [(x1 + x2) / 2, (y1 + y2) / 2])
      expect(
        marks.some(([mx, my]) => Math.hypot(mx - point.x, my - point.y) < 1e-6),
        `a mark under the point at Delay ${delay}, Width ${width}`,
      ).toBe(true)
      expect(rings(drawn).map((ring) => [ring.x, ring.y])).toEqual([[point.x, point.y]])
    }
  })

  it('holds the point still while the head moves: it is where the copy is set, not where it is', () => {
    const still = handle('copy')
    const running = draw({ meters: { ...live, holdLeft: 1, holdRight: 0.5 } })
    expect(rings(running).map((ring) => [ring.x, ring.y])).toEqual([[still.x, still.y]])
    // The bead is elsewhere on its rail, in the accent, and lies over the ring.
    const [left] = beads(running)
    expect(left.out).toBeCloseTo(detuneReach(20), 6)
    const order = pathsOf(running).filter(
      (path) => path.arcs.length === 1 && path.stroke === ink && path.fill !== null,
    )
    expect(order.findIndex((path) => path.fill === ground)).toBeLessThan(
      order.findIndex((path) => path.fill === accent),
    )
  })

  it('draws the ring clear of the bead, which grows with Mix', () => {
    for (const mix of [0, 0.36, 0.7, 1]) {
      const drawn = draw({ values: { mix } })
      const [ring] = rings(drawn)
      // The ring's line is 1.5 wide, the bead's own 1.
      expect(ring.radius - 0.75).toBeGreaterThan(beadRadius(mix) + 0.5 + 0.5)
      expect(ring.radius).toBeGreaterThanOrEqual(5)
      expect(ring.radius).toBeLessThanOrEqual(6.25)
    }
    const hot = rings(draw({ hot: 'copy' }))
    expect(hot).toEqual([])
    const taken = pathsOf(draw({ hot: 'copy' })).filter(
      (path) => path.arcs.length === 1 && path.fill === accent && path.stroke === ink,
    )
    // Under the pointer it is the accent, a pixel larger: 2.25 px clear of the bead at Mix 0.36, and one.
    expect(taken.map((path) => path.arcs[0][2])).toEqual([beadRadius(0.36) + 2.25 + 1])
  })

  it('takes the Delay from how far out the point is dragged and the Width from how far round', () => {
    const settings: Record<string, number>[] = [
      {},
      { delay: 30, width: 1 },
      { delay: 12, width: 0 },
      { delay: 60, width: 0.5 },
      { delay: 23.7, width: 0.31 },
    ]
    for (const values of settings) {
      const point = handle('copy', values)
      const delay = values.delay ?? 14
      const width = values.width ?? 1
      // Taken and not moved, both stay exactly where they are.
      expect(point.drag(point.x, point.y)).toEqual({ delay, width })
    }
    const point = handle('copy')
    // Out along its rail to where 40 ms stands: 40 ms, the Width as it was.
    const out = point.drag(...placeOf(40, -EIGHTH))
    expect(out.delay).toBeCloseTo(40, 9)
    expect(out.width).toBeCloseTo(1, 9)
    // Round to a quarter of the way to the left side, no further out: Width a quarter.
    const round = point.drag(...placeOf(14, -EIGHTH / 4))
    expect(round.delay).toBeCloseTo(14, 9)
    expect(round.width).toBeCloseTo(0.25, 9)
    // The point goes where it is taken.
    const moved = handle('copy', { delay: 33, width: 0.6 })
    const there = point.drag(moved.x, moved.y)
    expect(there.delay).toBeCloseTo(33, 9)
    expect(there.width).toBeCloseTo(0.6, 9)
  })

  it('stops at the ends of Delay and Width however far the point is dragged, and a double press gives the defaults', () => {
    const point = handle('copy', { delay: 30, width: 0.5 })
    // Far to the left: past the rim and past the left side.
    expect(point.drag(field.cx - 900, field.cy - 20)).toEqual({ delay: 60, width: 1 })
    // Far to the right the copies are one, straight ahead: the rail stands
    // upright, and the Delay is the place on it level with the pointer.
    const right = point.drag(field.cx + 900, field.cy - 30)
    expect(right.width).toBe(0)
    expect(right.delay).toBeCloseTo(120 * (30 / field.r) ** 2, 9)
    expect(point.drag(field.cx + 900, field.cy - 55)).toEqual({ delay: 60, width: 0 })
    // Far up: past the rim, straight ahead.
    expect(point.drag(field.cx, -900)).toEqual({ delay: 60, width: 0 })
    // At the listener, and anywhere near: the shortest Delay.
    expect(point.drag(field.cx, field.cy)).toEqual({ delay: 12, width: 0 })
    expect(point.drag(field.cx - 5, field.cy - 5).delay).toBe(12)
    // Under the foot there is no field: a place there counts as on the foot,
    // past the left side, and the Delay is the place on the left diagonal nearest it.
    expect(point.drag(field.cx - 10, field.cy + 900)).toEqual({ delay: 12, width: 1 })
    const under = point.drag(field.cx - 40, field.cy + 900)
    expect(under.width).toBe(1)
    expect(under.delay).toBeCloseTo(120 * ((40 * HALF) / field.r) ** 2, 9)
    // To the right of the middle the Width is none: the left copy does not cross over.
    const over = point.drag(...placeOf(25, EIGHTH / 2))
    expect(over.width).toBe(0)
    expect(over.delay).toBeCloseTo(25 * Math.cos(EIGHTH / 2) ** 2, 9)
    expect(point.reset?.()).toEqual({ delay: 14, width: 1 })
  })
})

describe('the readings Stereo Detune gives its display', () => {
  const M = STEREO_DETUNE_METERS
  const P = STEREO_DETUNE_PARAMS
  async function device(drift: number) {
    const harness = await loadWasmDevice('stereo-detune')
    const exports = harness.device as unknown as { device_meter(index: number): number }
    harness.set(P.drift, drift)
    return {
      ...harness,
      meter: (name: keyof typeof M): number => exports.device_meter(M[name].id),
    }
  }

  it('are the six the display reads, kept off the plate', () => {
    expect(Object.keys(M)).toEqual([
      'centsLeft',
      'centsRight',
      'delayLeft',
      'delayRight',
      'holdLeft',
      'holdRight',
    ])
    for (const spec of Object.values(M)) expect(spec.display).toBe(true)
    expect(Object.keys(stock.get('stereo-detune')?.meters ?? {})).toEqual(Object.keys(M))
  })

  it('say the detune and where each head is: the sharp one closing in, the flat one falling back', async () => {
    const h = await device(0)
    h.feedTone(0.01, 330, 0.3)
    expect(h.meter('centsLeft')).toBeCloseTo(9, 2)
    expect(h.meter('centsRight')).toBeCloseTo(-9, 2)
    // Each head starts where a splice would have landed: 7.5 ms behind its travel.
    expect(h.meter('delayLeft')).toBeCloseTo(14 + 7.5, 0)
    expect(h.meter('delayRight')).toBeCloseTo(19.6 - 7.5, 0)
    expect(h.meter('holdLeft')).toBeGreaterThan(0)
    expect(h.meter('holdLeft')).toBeLessThanOrEqual(1)
    const [left, right] = [h.meter('delayLeft'), h.meter('delayRight')]
    h.feedTone(1, 330, 0.3)
    // Nine cents is 5.2 ms of delay a second: the pitch is the head moving.
    expect(left - h.meter('delayLeft')).toBeCloseTo(1000 * (Math.pow(2, 9 / 1200) - 1), 1)
    expect(h.meter('delayRight') - right).toBeCloseTo(1000 * (1 - Math.pow(2, -9 / 1200)), 1)
    // A splice aims 7.5 ms behind the Delay and lands where the waveform fits,
    // never further than 19.5 ms from it; over time the head is about the Delay.
    const sum = [0, 0]
    for (let n = 0; n < 80; n++) {
      h.feedTone(0.25, 330, 0.3)
      const off = [h.meter('delayLeft') - 14, h.meter('delayRight') - 19.6]
      for (const [side, value] of off.entries()) {
        expect(Math.abs(value)).toBeLessThan(19.6)
        sum[side] += value / 80
      }
    }
    expect(Math.abs(sum[0])).toBeLessThan(4)
    expect(Math.abs(sum[1])).toBeLessThan(4)
  })

  it('has the head travel its whole rail on Drift alone', async () => {
    const h = await device(0.6)
    h.set(P.detune, 0)
    h.set(P.delay, 25)
    const reach = [0, 0]
    for (let n = 0; n < 120; n++) {
      h.feedTone(0.25, 330, 0.3)
      for (const [side, name] of (['delayLeft', 'delayRight'] as const).entries()) {
        reach[side] = Math.max(reach[side], Math.abs(h.meter(name) - 25 * (side === 0 ? 1 : 1.4)))
      }
    }
    for (const side of [0, 1]) {
      // Well past what the wander of the delay alone would be (0.9 ms), and on the rail.
      expect(reach[side]).toBeGreaterThan(6)
      expect(reach[side]).toBeLessThan(detuneTravel(0, 0.6) + 2)
    }
  })

  it('brings each repeat later than twice the Delay by its allpasses', async () => {
    const h = await device(0)
    h.set(P.detune, 0)
    h.set(P.feedback, 0.7)
    h.set(P.focus, 20)
    h.set(P.tone, 18000)
    h.set(P.mix, 1)
    const rate = h.sampleRate
    const total = Math.round(0.12 * rate)
    const out = [new Float32Array(total), new Float32Array(total)]
    const block = new Float32Array(128)
    for (let n = 0; n < total; n += 128) {
      block.fill(0)
      // A click a quarter of a millisecond long.
      if (n === 0) for (let i = 0; i < 12; i++) block[i] = Math.sin((i / 12) * Math.PI)
      h.processBlock(block)
      const frames = Math.min(128, total - n)
      out[0].set(h.view(h.device.device_out_left(), frames), n)
      out[1].set(h.view(h.device.device_out_right(), frames), n)
    }
    /** When the loudest millisecond between two times begins, ms. */
    const loudest = (wave: Float32Array, fromMs: number, toMs: number): number => {
      const window = Math.round(rate / 1000)
      let best = 0
      let at = 0
      for (let n = Math.round((fromMs * rate) / 1000); n < (toMs * rate) / 1000; n++) {
        let energy = 0
        for (let i = 0; i < window; i++) energy += wave[n + i] * wave[n + i]
        if (energy > best) {
          best = energy
          at = n
        }
      }
      return (at * 1000) / rate
    }
    for (const [side, delay] of [14, 19.6].entries()) {
      const first = loudest(out[side], 0, delay + 6)
      expect(first).toBeCloseTo(delay, 0)
      // The second time round: the Delay again, and the two allpasses.
      const second = loudest(out[side], first + 6, 2 * delay + 30)
      expect(second - first).toBeGreaterThan(delay + DETUNE_SMEAR_MS[side] - 1)
      expect(second - first).toBeLessThan(delay + DETUNE_SMEAR_MS[side] + 1)
    }
  })

  it('carry the drift: up to 8 cents and 1.5 ms either way at full', async () => {
    const still = await device(0)
    const drifting = await device(1)
    let widest = 0
    for (let n = 0; n < 80; n++) {
      still.feedTone(0.25, 330, 0.3)
      drifting.feedTone(0.25, 330, 0.3)
      expect(still.meter('centsLeft')).toBeCloseTo(9, 2)
      const off = Math.abs(drifting.meter('centsLeft') - 9)
      expect(off).toBeLessThan(8.05)
      widest = Math.max(widest, off)
    }
    expect(widest).toBeGreaterThan(2)
  })
})
