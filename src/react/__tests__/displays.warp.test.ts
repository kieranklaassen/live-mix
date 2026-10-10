// The truth of Warp's display: every curve, mark and handle against a number
// worked out from the device's own formula (`cpp/devices/warp/warp.h`), at the
// size the display has on a plate at rest (a window of two columns, 128 by
// 100) and at the size it has on an upright plate (204 by 100).

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import { WARP_FACES } from '../components/displays/warp'
import { type DisplayHandle, type DisplayHold } from '../components/plate-display'
import {
  drawDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const descriptor = stockDescriptors().get('warp')
if (!descriptor) throw new Error('no stock device warp')
const params = descriptor.params
const { display } = WARP_FACES.warp
const { ink, accent, plate } = PLAIN_COLOURS

// --- The device's own numbers, copied from `warp.h` ---------------------------

/** `kLeanOctaves`: Lean's weight is halfway at two octaves from the pivot. */
const LEAN_OCTAVES = 2
/** `kWidthDepth`: the left side's Stretch is `width * 0.04` under the setting, the right's as much over. */
const WIDTH_DEPTH = 0.04
/** `kDriftDepth`: Drift at full takes the Stretch 0.12 either way (the device reports the result as `stretchNow`). */
const DRIFT_DEPTH = 0.12
/** `kSameNote`: a partial is a note's own from 3 % under the note's pivot (`Warp::pivot_for`). */
const SAME_NOTE = 0.03

/**
 * `Warp::frame`: a partial `o` octaves from the pivot lands at
 * `place * exp2(o * (e - 1) * weight + shift)`, `e = exp2(stretch)`, with
 * `x = o / kLeanOctaves`, `r = x * x / (1 + x * x)` and the weight
 * `1 - lean * (1 - r)` for a Lean of 0 or more, `1 + lean * r` under 0.
 */
function lands(hz: number, pivot: number, stretch: number, lean = 0, shiftSt = 0): number {
  const o = Math.log2(hz / pivot)
  const x = o / LEAN_OCTAVES
  const r = (x * x) / (1 + x * x)
  const weight = lean >= 0 ? 1 - lean * (1 - r) : 1 + lean * r
  return hz * Math.pow(2, o * (Math.pow(2, stretch) - 1) * weight + shiftSt / 12)
}

// --- The picture: 20 Hz to 20 kHz both ways, 4 px in from each edge -----------

interface Scale {
  xOf(hz: number): number
  yOf(hz: number): number
  hzOfX(x: number): number
  left: number
  right: number
  top: number
  foot: number
}
function scaleOf(width = 128, height = 100): Scale {
  const w = width - 8
  const h = height - 8
  const along = (hz: number): number => Math.log(hz / 20) / Math.log(1000)
  return {
    xOf: (hz) => 4 + along(hz) * w,
    yOf: (hz) => 4 + h - along(hz) * h,
    hzOfX: (x) => 20 * Math.pow(1000, (x - 4) / w),
    left: 4,
    right: 4 + w,
    top: 4,
    foot: 4 + h,
  }
}

// --- What was drawn, read back from the calls --------------------------------

interface Shape {
  points: [number, number][]
  /** Centre and radius of every arc in the path. */
  arcs: [number, number, number][]
  colour: string
  width: number
  alpha: number
  dashed: boolean
  /** The box drawing was kept inside when it was drawn: [x, y, w, h], or null. */
  clip: number[] | null
}
interface Picture {
  lines: Shape[]
  fills: Shape[]
  rects: { x: number; y: number; w: number; h: number; colour: string; alpha: number }[]
  words: string[]
}

function pictureOf(drawn: RecordingContext): Picture {
  const picture: Picture = { lines: [], fills: [], rects: [], words: [] }
  let alpha = 1
  let stroke = ''
  let fill = ''
  let width = 1
  let dashed = false
  let points: [number, number][] = []
  let arcs: [number, number, number][] = []
  let box: number[] | null = null
  let clip: number[] | null = null
  for (const { name, args } of drawn.calls) {
    const n = args as number[]
    if (name === 'set globalAlpha') alpha = n[0]
    else if (name === 'set strokeStyle') stroke = String(args[0])
    else if (name === 'set fillStyle') fill = String(args[0])
    else if (name === 'set lineWidth') width = n[0]
    else if (name === 'setLineDash') dashed = (args[0] as number[]).length > 0
    else if (name === 'beginPath') {
      points = []
      arcs = []
      box = null
    } else if (name === 'rect') box = [n[0], n[1], n[2], n[3]]
    else if (name === 'clip') clip = box
    else if (name === 'restore') clip = null
    else if (name === 'moveTo' || name === 'lineTo') points.push([n[0], n[1]])
    else if (name === 'arc') arcs.push([n[0], n[1], n[2]])
    else if (name === 'stroke')
      picture.lines.push({
        points: [...points],
        arcs: [...arcs],
        colour: stroke,
        width,
        alpha,
        dashed,
        clip,
      })
    else if (name === 'fill')
      picture.fills.push({
        points: [...points],
        arcs: [...arcs],
        colour: fill,
        width,
        alpha,
        dashed,
        clip,
      })
    else if (name === 'fillRect')
      picture.rects.push({ x: n[0], y: n[1], w: n[2], h: n[3], colour: fill, alpha })
    else if (name === 'fillText') picture.words.push(String(args[0]))
  }
  return picture
}

const draw = (options: FrameOptions = {}): Picture =>
  pictureOf(drawDisplay(display, params, options))

/** The curves of one colour and width: lines through more than ten points. */
const curves = (picture: Picture, colour: string, width: number): Shape[] =>
  picture.lines.filter(
    (line) => line.colour === colour && line.width === width && line.points.length > 10,
  )

/** Every point of a drawn curve stands where the formula puts the pitch under it. */
function expectCurve(
  curve: Shape,
  scale: Scale,
  pivot: number,
  stretch: number,
  lean = 0,
  shift = 0,
): void {
  expect(curve.points[0][0]).toBeCloseTo(scale.left, 9)
  expect(curve.points[curve.points.length - 1][0]).toBeCloseTo(scale.right, 9)
  for (const [x, y] of curve.points) {
    const want = scale.yOf(lands(scale.hzOfX(x), pivot, stretch, lean, shift))
    // A curve that leaves the picture is cut by the clip; its points are held within 200 px.
    expect(y).toBeCloseTo(Math.min(scale.foot + 200, Math.max(scale.top - 200, want)), 6)
  }
}

function handleOf(key: string, options: FrameOptions = {}): DisplayHandle {
  const handle = display.handles?.(viewOf(display, params, options)).find((h) => h.key === key)
  if (!handle) throw new Error(`warp has no handle ${key}`)
  return handle
}

/** The readings of a device that plays: six partials of a note, as loud as given. */
function playing(
  pivotNow: number,
  stretchNow: number,
  partials: readonly [number, number, number][],
): Record<string, number> {
  const meters: Record<string, number> = { stretchNow, pivotNow }
  for (let m = 1; m <= 6; m++) {
    const [from, to, level] = partials[m - 1] ?? [0, 0, 0]
    meters[`partial${m}In`] = from
    meters[`partial${m}Out`] = to
    meters[`partial${m}Level`] = level
  }
  return meters
}

describe('the warp display at rest', () => {
  const scale = scaleOf()

  it('reads the meters the device has, in the order the device reports them', () => {
    // `Warp::meter`: 0 the stretch in use, 1 the pivot in use, then In, Out and Level of six partials.
    const names = ['stretchNow', 'pivotNow']
    for (let m = 1; m <= 6; m++) names.push(`partial${m}In`, `partial${m}Out`, `partial${m}Level`)
    expect(Object.keys(descriptor.meters ?? {})).toEqual(names)
    names.forEach((name, id) => expect(descriptor.meters?.[name].id).toBe(id))
    expect(WARP_FACES.warp.face).toEqual(['stretch', 'lean', 'drift', 'mix'])
  })

  it('draws the setting as the curve of the formula, pinned on the pivot', () => {
    const settings: [number, number, number, number][] = [
      [220, 0.3, 0, 0],
      [220, 1, 0, 0],
      [220, -1, 0, 0],
      [20, 0.3, 0, 0],
      [2000, -0.5, 0, 7],
      [440, 0.6, 1, -12],
      [110, 0.6, -1, 12],
      [330, -0.8, -0.5, 0],
    ]
    for (const [pivot, stretch, lean, shift] of settings) {
      const picture = draw({ values: { follow: 0, pivot, stretch, lean, shift } })
      const lines = curves(picture, ink, 1.5)
      expect(lines).toHaveLength(1)
      expect(lines[0].alpha).toBeCloseTo(1, 9)
      expect(lines[0].points).toHaveLength(61)
      expectCurve(lines[0], scale, pivot, stretch, lean, shift)
      // Nothing of now is drawn at rest: the second colour is the device's readings only.
      expect([...picture.lines, ...picture.fills].filter((s) => s.colour === accent)).toEqual([])
    }
  })

  it('stands by hand where the device puts a partial', () => {
    // Stretch 1 doubles the octaves: three octaves over a pivot of 220 Hz, 1760 Hz lands six
    // over it, at 14080 Hz. Across: ln(88) / ln(1000) of 120 px from 4. Up: ln(704) / ln(1000) of 92 px.
    expect(lands(1760, 220, 1)).toBeCloseTo(14080, 6)
    const stretch = handleOf('stretch', { values: { follow: 0, pivot: 220, stretch: 1 } })
    expect(stretch.x).toBeCloseTo(81.78, 2)
    expect(stretch.y).toBeCloseTo(8.674, 2)
    // Stretch −1 halves them: 1760 Hz lands an octave and a half over the pivot.
    expect(lands(1760, 220, -1)).toBeCloseTo(220 * Math.pow(2, 1.5), 6)
    // Lean up at three octaves weighs the exponent by 2.25 / 3.25; Lean down by 1 less that.
    expect(lands(1760, 220, 1, 1)).toBeCloseTo(220 * Math.pow(2, 3 * (1 + 2.25 / 3.25)), 6)
    expect(lands(1760, 220, 1, -1)).toBeCloseTo(220 * Math.pow(2, 3 * (1 + 1 / 3.25)), 6)
    // Shift comes after: seven semitones more.
    expect(lands(1760, 220, 1, 0, 7) / lands(1760, 220, 1)).toBeCloseTo(Math.pow(2, 7 / 12), 9)
    // The pivot itself does not move, whatever the Stretch and the Lean.
    expect(lands(220, 220, 1, 1)).toBe(220)
    expect(lands(220, 220, -1, -1)).toBe(220)
  })

  it('draws the scale: a line at 100 Hz, 1 kHz and 10 kHz each way, and the diagonal', () => {
    const picture = draw({ values: { follow: 0 } })
    const diagonal = picture.lines.filter((line) => line.dashed && line.colour === ink)
    expect(diagonal).toHaveLength(1)
    expect(diagonal[0].points).toEqual([
      [scale.left, scale.foot],
      [scale.right, scale.top],
    ])
    for (const hz of [100, 1000, 10000]) {
      const y = Math.floor(scale.yOf(hz)) + 0.5
      const x = Math.floor(scale.xOf(hz)) + 0.5
      const level = picture.lines.filter((l) => l.points.length === 2 && l.points[0][1] === y)
      const upright = picture.lines.filter((l) => l.points.length === 2 && l.points[0][0] === x)
      expect(level.length, `a line across at ${hz} Hz`).toBeGreaterThan(0)
      expect(upright.length, `a line up at ${hz} Hz`).toBeGreaterThan(0)
    }
    expect(picture.words).toEqual(['in', 'out'])
  })

  it('shades the pitches that get a pivot of their own while Follow is on', () => {
    const shade = (values: Record<string, number>) =>
      draw({ values }).rects.filter((rect) => rect.colour === ink && rect.alpha === 0.07)
    expect(shade({ follow: 0, pivot: 220 })).toEqual([])
    // From the Pivot setting to the right edge, the whole height of the picture.
    const on = shade({ follow: 1, pivot: 220 })
    expect(on).toHaveLength(1)
    expect(on[0].x).toBeCloseTo(scale.xOf(220), 9)
    expect(on[0].x + on[0].w).toBeCloseTo(scale.right, 9)
    expect([on[0].y, on[0].h]).toEqual([4, 92])
    // At its start, 20 Hz, that is every pitch.
    expect(shade({})[0].x).toBeCloseTo(scale.left, 9)
  })

  it('lets the curve stand back as Mix takes the warped sound away', () => {
    // The device mixes at equal power: the warped sound by the sine of a quarter turn of Mix.
    const alphaAt = (mix: number): number => curves(draw({ values: { mix } }), ink, 1.5)[0].alpha
    expect(alphaAt(1)).toBeCloseTo(1, 9)
    expect(alphaAt(0.5)).toBeCloseTo(0.34 + 0.66 * Math.SQRT1_2, 9)
    expect(alphaAt(0)).toBeCloseTo(0.34, 9)
  })

  it('lays itself out from the size it is given: the upright plate has it 204 by 100', () => {
    const wide = scaleOf(204, 100)
    const values = { follow: 0, pivot: 330, stretch: 0.7, lean: 0.5, shift: -5 }
    const lines = curves(draw({ values, width: 204, height: 100 }), ink, 1.5)
    expect(lines[0].points).toHaveLength(99)
    expectCurve(lines[0], wide, 330, 0.7, 0.5, -5)
    const view = viewOf(display, params, { values, width: 204, height: 100 })
    const [stretch, pivot] = display.handles?.(view) ?? []
    expect(stretch.x).toBeCloseTo(wide.xOf(2640), 9)
    expect(stretch.y).toBeCloseTo(wide.yOf(lands(2640, 330, 0.7, 0.5, -5)), 9)
    expect(pivot.x).toBeCloseTo(wide.xOf(330), 9)
    expect(pivot.drag(wide.xOf(880), 50).pivot).toBeCloseTo(880, 6)
  })
})

describe('the handles of the warp display', () => {
  const scale = scaleOf()

  it('stands Stretch on the curve three octaves over the pivot, and Pivot on its pin', () => {
    for (const [pivot, stretch, lean, shift] of [
      [20, 0.3, 0, 0],
      [220, 0.5, 1, 0],
      [220, -1, -1, 5],
      [100, 0.9, 0.3, -12],
    ]) {
      const values = { pivot, stretch, lean, shift }
      const point = handleOf('stretch', { values })
      expect(point.x).toBeCloseTo(scale.xOf(pivot * 8), 9)
      expect(point.y).toBeCloseTo(scale.yOf(lands(pivot * 8, pivot, stretch, lean, shift)), 9)
      const pin = handleOf('pivot', { values })
      expect(pin.x).toBeCloseTo(scale.xOf(pivot), 9)
      // The pin is the pivot's own place: it comes out Shift away from where it went in.
      expect(pin.y).toBeCloseTo(scale.yOf(pivot * Math.pow(2, shift / 12)), 9)
    }
  })

  it('solves a drag of Stretch for the curve that passes under the hand', () => {
    for (const lean of [-1, -0.4, 0, 0.6, 1]) {
      for (const shift of [0, -7, 12]) {
        for (const pivot of [20, 60, 220]) {
          const values = { pivot, lean, shift, stretch: 0.3 }
          const point = handleOf('stretch', { values })
          for (const wanted of [-1, -0.45, 0, 0.3, 0.8, 1]) {
            const y = scale.yOf(lands(pivot * 8, pivot, wanted, lean, shift))
            // Only where the curve's point is in the picture: past its edge the hand cannot go.
            if (y < scale.top || y > scale.foot) continue
            expect(point.drag(point.x + 9, y).stretch).toBeCloseTo(wanted, 6)
          }
          // Past what the curve can reach, the ends of the range.
          expect(point.drag(point.x, -500).stretch).toBe(1)
          expect(point.drag(point.x, 900).stretch).toBe(-1)
        }
      }
    }
  })

  it('gives Stretch travel enough for a hand', () => {
    const travel = (lean: number): number =>
      scale.yOf(lands(160, 20, -1, lean)) - scale.yOf(lands(160, 20, 1, lean))
    // 4.5 octaves of pitch out at 9.2 px an octave; with Lean up, 3.1 octaves.
    expect(travel(0)).toBeCloseTo(41.54, 1)
    expect(travel(1)).toBeGreaterThan(28)
    // With Lean full down the far partials hardly move, and neither does the point: the knob
    // sets Stretch more finely there.
    expect(travel(-1)).toBeGreaterThan(12)
  })

  it('takes a curve that has left the picture at the edge and moves it from where it lies', () => {
    // A pivot of 2 kHz at Stretch 1: 16 kHz lands six octaves over the pivot, far over the top.
    const values = { follow: 0, pivot: 2000, stretch: 1 }
    const point = handleOf('stretch', { values })
    const lies = scale.yOf(lands(16000, 2000, 1))
    expect(lies).toBeLessThan(scale.top)
    expect(point.y).toBe(scale.top)
    // Taken there, nothing moves; 10 px down, the curve is the one 10 px under where it lay.
    const hold: DisplayHold = {}
    expect(point.drag(point.x, point.y, hold).stretch).toBe(1)
    const out = 20 * Math.pow(1000, (scale.foot - (lies + 10)) / 92)
    const exponent = Math.log2(out / 2000) / 3
    expect(point.drag(point.x, point.y + 10, hold).stretch).toBeCloseTo(Math.log2(exponent), 6)
    expect(point.drag(point.x, point.y + 10, hold).stretch).toBeLessThan(1)
  })

  it('sets the Pivot to the pitch under the hand, and resets both to where the device starts', () => {
    const pin = handleOf('pivot', { values: { pivot: 220 } })
    expect(pin.drag(scale.xOf(440), 3).pivot).toBeCloseTo(440, 6)
    expect(pin.drag(scale.xOf(55), 90).pivot).toBeCloseTo(55, 6)
    expect(pin.drag(pin.x, pin.y).pivot).toBe(220)
    expect(pin.drag(-40, 50).pivot).toBe(20)
    expect(pin.drag(400, 50).pivot).toBe(2000)
    // The whole range of the knob is two thirds of the picture: 80 px.
    expect(scale.xOf(2000) - scale.xOf(20)).toBeCloseTo(80, 9)
    expect(pin.reset?.()).toEqual({ pivot: params.pivot.default })
    expect(handleOf('stretch').reset?.()).toEqual({ stretch: params.stretch.default })
  })

  it('names the handle under the pointer and its setting', () => {
    const said = (hot: string, values: Record<string, number>): string[] =>
      draw({ hot, values }).words
    expect(said('stretch', { stretch: 0.3 })).toEqual(['in', 'Stretch +0.30'])
    expect(said('stretch', { stretch: -1 })).toEqual(['in', 'Stretch −1.00'])
    expect(said('pivot', { pivot: 220 })).toEqual(['in', 'Pivot 220 Hz'])
    expect(said('pivot', { pivot: 2000 })).toEqual(['in', 'Pivot 2 kHz'])
  })
})

describe('the warp display while the device plays', () => {
  const scale = scaleOf()
  const signal = testSignal()
  // A note at 220 Hz with Follow on, the Pivot setting under it at 20 Hz: the device has put a
  // pivot on the note, and reports its three loudest partials where its own formula lands them.
  const note = (stretchNow: number, level = 0.1): Record<string, number> =>
    playing(220, stretchNow, [
      [220, 220, level],
      [440, lands(440, 220, stretchNow), level],
      [660, lands(660, 220, stretchNow), level],
    ])
  const accents = (picture: Picture): Shape[] =>
    [...picture.lines, ...picture.fills].filter((shape) => shape.colour === accent)

  it('draws the curves of the two sides as they are now, pinned on the pivot in use', () => {
    // Width 0.5: the left side's Stretch is 0.02 under the reading and the right's 0.02 over.
    const picture = draw({ values: { width: 0.5 }, meters: note(0.36), signal })
    const now = curves(picture, accent, 1)
    expect(now).toHaveLength(2)
    expectCurve(now[0], scale, 220, 0.36 - 0.5 * WIDTH_DEPTH)
    expectCurve(now[1], scale, 220, 0.36 + 0.5 * WIDTH_DEPTH)
    // The reading is the setting with Drift's wander on it: at full Drift no further than 0.12
    // from the knob. The ink stays the setting: 0.3 about the Pivot setting of 20 Hz.
    expect(Math.abs(0.36 - params.stretch.default)).toBeLessThanOrEqual(DRIFT_DEPTH)
    const setting = curves(picture, ink, 1.5)
    expect(setting).toHaveLength(1)
    expectCurve(setting[0], scale, 20, 0.3)
    // The pivot in use is a dot on its own place.
    const pin = picture.fills.filter((f) => f.colour === accent && f.arcs[0]?.[2] === 2.5)
    expect(pin).toHaveLength(1)
    expect(pin[0].arcs[0][0]).toBeCloseTo(scale.xOf(220), 9)
    expect(pin[0].arcs[0][1]).toBeCloseTo(scale.yOf(220), 9)
  })

  it('parts the curve where the device does: the setting under the lowest note, the note above', () => {
    // `Warp::pivot_for`: a partial more than 3 % under the lowest pivot is moved around the knob.
    const seam = scale.xOf(220 * (1 - SAME_NOTE))
    const picture = draw({ meters: note(0.3), signal })
    const now = curves(picture, accent, 1)
    for (const curve of now) expect(curve.clip?.[0]).toBeCloseTo(seam, 9)
    const strong = curves(picture, ink, 1.5)
    expect(strong).toHaveLength(1)
    expect((strong[0].clip?.[0] ?? 0) + (strong[0].clip?.[2] ?? 0)).toBeCloseTo(seam, 9)
    // Past the seam the setting's curve stands back: nothing played is moved along it there.
    const ghost = curves(picture, ink, 1)
    expect(ghost).toHaveLength(1)
    expect(ghost[0].clip?.[0]).toBeCloseTo(seam, 9)
    expect(ghost[0].alpha).toBeCloseTo(0.34, 9)
    expectCurve(ghost[0], scale, 20, 0.3)
    // With Follow off the pivot in use is the setting, and the curve is whole.
    const fixed = draw({
      values: { follow: 0, pivot: 220 },
      meters: playing(220, 0.3, []),
      signal,
    })
    expect(curves(fixed, ink, 1)).toEqual([])
    expect(curves(fixed, ink, 1.5)[0].clip).toEqual([3, 3, 122, 94])
    for (const curve of curves(fixed, accent, 1)) expect(curve.clip).toEqual([3, 3, 122, 94])
  })

  it('draws each partial from where it was to where the device reports it lands', () => {
    // −20 dB against full scale: a mark is drawn with 0.3 at −60 dB and whole at 0 dB.
    const picture = draw({ meters: note(0.3, 0.1), signal })
    const strength = 0.3 + 0.7 * (1 - 20 / 60)
    for (const hz of [440, 660]) {
      const x = Math.floor(scale.xOf(hz)) + 0.5
      const way = picture.lines.filter(
        (l) => l.colour === accent && l.points.length === 2 && l.points[0][0] === x,
      )
      expect(way, `the way of ${hz} Hz`).toHaveLength(1)
      // From the diagonal, where it came out as it went in, to its landing.
      expect(way[0].points[0][1]).toBeCloseTo(scale.yOf(hz), 9)
      expect(way[0].points[1][1]).toBeCloseTo(scale.yOf(lands(hz, 220, 0.3)), 9)
      expect(way[0].alpha).toBeCloseTo(strength, 9)
      const dots = picture.fills.filter(
        (f) => f.colour === accent && f.arcs[0]?.[0] === x && f.arcs[0]?.[2] === 2,
      )
      expect(dots).toHaveLength(1)
      expect(dots[0].arcs[0][1]).toBeCloseTo(scale.yOf(lands(hz, 220, 0.3)), 9)
    }
    // 440 Hz an octave over the pivot at Stretch 0.3 lands 2^0.3 octaves over it: 0.231 of an
    // octave up, 2.1 px at 9.23 px an octave.
    expect(scale.yOf(440) - scale.yOf(lands(440, 220, 0.3))).toBeCloseTo(2.13, 2)
    // A louder partial is a stronger mark, a partial under −60 dB none, and a reading that is no
    // pitch (nothing has come yet, or a bad number) none.
    const marks = (meters: Record<string, number>): Shape[] =>
      draw({ meters, signal }).fills.filter((f) => f.colour === accent && f.arcs[0]?.[2] === 2)
    expect(marks(playing(220, 0.3, [[440, 500, 1]]))[0].alpha).toBeCloseTo(1, 9)
    expect(marks(playing(220, 0.3, [[440, 500, 0.0005]]))).toEqual([])
    expect(marks(playing(220, 0.3, [[0, 0, 0.5]]))).toEqual([])
    expect(marks(playing(220, 0.3, [[Number.NaN, 500, 0.5]]))).toEqual([])
    expect(marks(playing(220, 0.3, [[25000, 30000, 0.5]]))).toEqual([])
  })

  it('draws only what Mix lets be heard, and still reads the device at Mix 0', () => {
    const strength = 0.3 + 0.7 * (1 - 20 / 60)
    const x = Math.floor(scale.xOf(440)) + 0.5
    const dryDot = (picture: Picture): Shape[] =>
      picture.fills.filter(
        (f) => f.colour === ink && f.arcs[0]?.[0] === x && f.arcs[0]?.[2] === 1.5,
      )
    // Mix 1: the warped sound alone. No partial is heard where it was.
    const full = draw({ meters: note(0.3), signal })
    expect(dryDot(full)).toEqual([])
    // Mix 0.5: both at the sine and cosine of an eighth of a turn.
    const half = draw({ values: { mix: 0.5 }, meters: note(0.3), signal })
    expect(dryDot(half)[0].alpha).toBeCloseTo(Math.SQRT1_2 * strength, 9)
    expect(dryDot(half)[0].arcs[0][1]).toBeCloseTo(scale.yOf(440), 9)
    for (const curve of curves(half, accent, 1)) expect(curve.alpha).toBeCloseTo(Math.SQRT1_2, 9)
    // Mix 0: the sound as it went in. Nothing in the second colour, and the partials stand on
    // the diagonal where the device reads them.
    const none = draw({ values: { mix: 0 }, meters: note(0.3), signal })
    expect(accents(none)).toEqual([])
    expect(dryDot(none)[0].alpha).toBeCloseTo(strength, 9)
  })

  it('shows nothing of now while it is bypassed or has no sound to read', () => {
    expect(accents(draw({ meters: note(0.3), signal, powered: false }))).toEqual([])
    expect(accents(draw({ meters: note(0.3), signal: null }))).toEqual([])
    // Readings that are not numbers leave the setting in their place.
    const bad = draw({
      values: { width: 0 },
      meters: playing(Number.NaN, Number.NaN, []),
      signal,
    })
    for (const curve of curves(bad, accent, 1)) expectCurve(curve, scale, 20, 0.3)
    expect(plate).not.toBe(accent)
  })
})
