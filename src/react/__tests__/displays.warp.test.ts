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
/** `kWidthDepth`: the left side's Stretch is `width * 0.04` under the setting, the right's as much over, about each note. */
const WIDTH_DEPTH = 0.04
/** `kDriftDepth`: Drift at full takes the Stretch 0.12 either way (the device reports the result as `stretchNow`). */
const DRIFT_DEPTH = 0.12

/**
 * `Warp::plan`: a partial `o` octaves from the pivot is moved by
 * `o * (e - 1) * weight + shift` octaves, `e = exp2(stretch)`, with
 * `x = o / kLeanOctaves`, `r = x * x / (1 + x * x)` and the weight
 * `1 - lean * (1 - r)` for a Lean of 0 or more, `1 + lean * r` under 0. With
 * Follow on the pivot is a note, and only its overtones are moved about it:
 * what is at the note or under it is moved by Shift alone.
 */
function moved(
  hz: number,
  pivot: number,
  stretch: number,
  lean = 0,
  shiftSt = 0,
  follow = false,
): number {
  if (follow && hz <= pivot) return shiftSt / 12
  const o = Math.log2(hz / pivot)
  const x = o / LEAN_OCTAVES
  const r = (x * x) / (1 + x * x)
  const weight = lean >= 0 ? 1 - lean * (1 - r) : 1 + lean * r
  return o * (Math.pow(2, stretch) - 1) * weight + shiftSt / 12
}

/**
 * `Warp::plan`, Width: a side's exponent is `exp2(stretch - width * kWidthDepth)`
 * on the left and `exp2(stretch + width * kWidthDepth)` on the right, and what
 * that differs from the middle one, `exp2(stretch)`, works on an overtone's
 * octaves over its own note, weighted by Lean over that distance. `side` is -1
 * for the left and 1 for the right; at the note or under it nothing parts.
 */
function parted(
  hz: number,
  note: number,
  stretch: number,
  width: number,
  side: -1 | 1,
  lean = 0,
): number {
  if (hz <= note) return 0
  const o = Math.log2(hz / note)
  const x = o / LEAN_OCTAVES
  const r = (x * x) / (1 + x * x)
  const weight = lean >= 0 ? 1 - lean * (1 - r) : 1 + lean * r
  return o * weight * (Math.pow(2, stretch + side * width * WIDTH_DEPTH) - Math.pow(2, stretch))
}

// --- The picture: 20 Hz to 20 kHz across, two octaves of move either way of the
// middle line, 4 px in from each edge ------------------------------------------

interface Scale {
  xOf(hz: number): number
  /** Where a move of so many octaves stands: none is the middle line. */
  yOf(octaves: number): number
  hzOfX(x: number): number
  left: number
  right: number
  top: number
  foot: number
}
function scaleOf(width = 128, height = 100): Scale {
  const w = width - 8
  const h = height - 8
  return {
    xOf: (hz) => 4 + (Math.log(hz / 20) / Math.log(1000)) * w,
    yOf: (octaves) => 4 + h / 2 - (octaves / 4) * h,
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
  follow = false,
): void {
  expect(curve.points[0][0]).toBeCloseTo(scale.left, 9)
  expect(curve.points[curve.points.length - 1][0]).toBeCloseTo(scale.right, 9)
  for (const [x, y] of curve.points) {
    const want = scale.yOf(moved(scale.hzOfX(x), pivot, stretch, lean, shift, follow))
    // A curve that leaves the picture is cut by the clip; its points are held within 200 px.
    expect(y).toBeCloseTo(Math.min(scale.foot + 200, Math.max(scale.top - 200, want)), 6)
  }
}

function handlesOf(options: FrameOptions = {}): readonly DisplayHandle[] {
  return display.handles?.(viewOf(display, params, options)) ?? []
}

function handleOf(key: string, options: FrameOptions = {}): DisplayHandle {
  const handle = handlesOf(options).find((h) => h.key === key)
  if (!handle) throw new Error(`warp has no handle ${key}`)
  return handle
}

/**
 * The readings of a device that plays: six partials of a note, as loud as
 * given, and the lowest note it has found (`noteNow`; 0 is none).
 */
function playing(
  pivotNow: number,
  stretchNow: number,
  partials: readonly [number, number, number][],
  noteNow = 0,
): Record<string, number> {
  const meters: Record<string, number> = { stretchNow, pivotNow, noteNow }
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
  const none = scale.yOf(0)

  it('reads the meters the device has, in the order the device reports them', () => {
    // `Warp::meter`: 0 the stretch in use, 1 the pivot in use, then In, Out and Level of six
    // partials, and last the lowest note being played.
    const names = ['stretchNow', 'pivotNow']
    for (let m = 1; m <= 6; m++) names.push(`partial${m}In`, `partial${m}Out`, `partial${m}Level`)
    names.push('noteNow')
    expect(Object.keys(descriptor.meters ?? {})).toEqual(names)
    names.forEach((name, id) => expect(descriptor.meters?.[name].id).toBe(id))
    expect(WARP_FACES.warp.face).toEqual(['stretch', 'lean', 'drift', 'mix'])
  })

  it('draws the setting as the curve of the formula, through nought at the pivot', () => {
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

  it('with Follow on draws the curve of one note at 110 Hz, whatever the Pivot knob says', () => {
    // The device does not use the knob while Follow is on (`Warp::plan`): every note played is
    // its own pivot. The picture shows the curve of one note, A2, and what lies under it at rest.
    for (const [stretch, lean, shift] of [
      [0.3, 0, 0],
      [1, 1, 0],
      [-1, -1, 5],
      [0.7, 0.4, -12],
    ]) {
      const values = { follow: 1, stretch, lean, shift }
      const picture = draw({ values })
      const lines = curves(picture, ink, 1.5)
      expect(lines).toHaveLength(1)
      expectCurve(lines[0], scale, 110, stretch, lean, shift, true)
      for (const [x, y] of lines[0].points) {
        if (x <= scale.xOf(110)) expect(y).toBeCloseTo(scale.yOf(shift / 12), 9)
      }
      // The note itself is a dot of ink where it stands: moved by Shift alone.
      const note = picture.fills.filter((f) => f.colour === ink && f.arcs[0]?.[2] === 2)
      expect(note).toHaveLength(1)
      expect(note[0].arcs[0][0]).toBeCloseTo(scale.xOf(110), 9)
      expect(note[0].arcs[0][1]).toBeCloseTo(scale.yOf(shift / 12), 9)
      for (const pivot of [20, 2000]) {
        expect(draw({ values: { ...values, pivot } })).toEqual(picture)
      }
    }
    // With Follow off there is no such dot: the pivot is the ring.
    const off = draw({ values: { follow: 0 } })
    expect(off.fills.filter((f) => f.colour === ink && f.arcs[0]?.[2] === 2)).toEqual([])
  })

  it('stands by hand where the device puts a partial', () => {
    // Stretch 1 doubles the octaves: two octaves over a pivot of 220 Hz, 880 Hz is moved two
    // octaves up, to the top of the picture. Across: ln(44) / ln(1000) of 120 px from 4.
    expect(moved(880, 220, 1)).toBeCloseTo(2, 9)
    const stretch = handleOf('stretch', { values: { follow: 0, pivot: 220, stretch: 1 } })
    expect(stretch.x).toBeCloseTo(69.738, 2)
    expect(stretch.y).toBeCloseTo(4, 9)
    // Stretch −1 halves them: it is moved an octave down, 23 px under the middle line at 50.
    expect(moved(880, 220, -1)).toBeCloseTo(-1, 9)
    expect(handleOf('stretch', { values: { follow: 0, pivot: 220, stretch: -1 } }).y).toBeCloseTo(
      73,
      9,
    )
    // The default, 0.3: 2 * (2^0.3 - 1) = 0.462 of an octave, 10.6 px over the middle line.
    expect(handleOf('stretch', { values: { follow: 0, pivot: 220 } }).y).toBeCloseTo(39.367, 2)
    // Lean up at two octaves weighs the move by a half, and so does Lean down.
    expect(moved(880, 220, 1, 1)).toBeCloseTo(1, 9)
    expect(moved(880, 220, 1, -1)).toBeCloseTo(1, 9)
    // At one octave Lean up weighs it by a fifth and Lean down by four fifths.
    expect(moved(440, 220, 1, 1)).toBeCloseTo(0.2, 9)
    expect(moved(440, 220, 1, -1)).toBeCloseTo(0.8, 9)
    // Shift comes after: seven semitones more.
    expect(moved(880, 220, 1, 0, 7) - moved(880, 220, 1)).toBeCloseTo(7 / 12, 9)
    // The pivot itself does not move, whatever the Stretch and the Lean.
    expect(moved(220, 220, 1, 1)).toBe(0)
    expect(moved(220, 220, -1, -1)).toBe(0)
  })

  it('draws the scale: a line up at 100 Hz, 1 kHz and 10 kHz, an octave each way, and no move', () => {
    const picture = draw({ values: { follow: 0 } })
    const dashed = picture.lines.filter((line) => line.dashed && line.colour === ink)
    expect(dashed).toHaveLength(1)
    expect(none).toBe(50)
    expect(dashed[0].points).toEqual([
      [scale.left, 50.5],
      [scale.right, 50.5],
    ])
    for (const hz of [100, 1000, 10000]) {
      const x = Math.floor(scale.xOf(hz)) + 0.5
      const upright = picture.lines.filter((l) => l.points.length === 2 && l.points[0][0] === x)
      expect(upright.length, `a line up at ${hz} Hz`).toBeGreaterThan(0)
    }
    for (const octaves of [-1, 1]) {
      const y = Math.floor(scale.yOf(octaves)) + 0.5
      const level = picture.lines.filter(
        (l) => !l.dashed && l.points.length === 2 && l.points[0][1] === y && l.points[1][1] === y,
      )
      expect(level, `a line across ${octaves} octave from no move`).toHaveLength(1)
    }
    // An octave is 23 px: the picture holds two either way.
    expect(scale.yOf(-1) - scale.yOf(1)).toBe(46)
    expect([scale.yOf(2), scale.yOf(-2)]).toEqual([scale.top, scale.foot])
    expect(picture.words).toEqual(['pitch in', 'flat', 'sharp'])
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
    const [stretch, pivot] = handlesOf({ values, width: 204, height: 100 })
    expect(stretch.x).toBeCloseTo(wide.xOf(1320), 9)
    expect(stretch.y).toBeCloseTo(wide.yOf(moved(1320, 330, 0.7, 0.5, -5)), 9)
    expect(pivot.x).toBeCloseTo(wide.xOf(330), 9)
    expect(pivot.y).toBeCloseTo(wide.yOf(-5 / 12), 9)
    expect(pivot.drag(wide.xOf(880), 50).pivot).toBeCloseTo(880, 6)
  })
})

describe('the handles of the warp display', () => {
  const scale = scaleOf()

  it('stands Stretch on the curve two octaves over the pivot, and Pivot on its pin', () => {
    for (const [pivot, stretch, lean, shift] of [
      [20, 0.3, 0, 0],
      [220, 0.5, 1, 0],
      [220, -1, -1, 5],
      [100, 0.9, 0.3, -12],
      [2000, 0.3, 0, 0],
    ]) {
      const values = { follow: 0, pivot, stretch, lean, shift }
      const handles = handlesOf({ values })
      expect(handles.map((handle) => handle.key)).toEqual(['stretch', 'pivot'])
      const [point, pin] = handles
      expect(point.x).toBeCloseTo(scale.xOf(pivot * 4), 9)
      expect(point.y).toBeCloseTo(scale.yOf(moved(pivot * 4, pivot, stretch, lean, shift)), 9)
      expect(pin.x).toBeCloseTo(scale.xOf(pivot), 9)
      // The pin is the pivot's own place: only Shift moves it.
      expect(pin.y).toBeCloseTo(scale.yOf(shift / 12), 9)
    }
  })

  it('with Follow on has the Stretch ring alone, on the curve of the note at 110 Hz', () => {
    // The Pivot knob is not used while Follow is on, so there is no ring to take for it.
    for (const pivot of [20, 220, 2000]) {
      for (const [stretch, lean, shift] of [
        [0.3, 0, 0],
        [-0.6, 1, 7],
        [1, -1, -3],
      ]) {
        const handles = handlesOf({ values: { follow: 1, pivot, stretch, lean, shift } })
        expect(handles.map((handle) => handle.key)).toEqual(['stretch'])
        expect(handles[0].x).toBeCloseTo(scale.xOf(440), 9)
        expect(handles[0].y).toBeCloseTo(scale.yOf(moved(440, 110, stretch, lean, shift)), 9)
      }
    }
  })

  it('solves a drag of Stretch for the curve that passes under the hand', () => {
    for (const follow of [0, 1]) {
      for (const lean of [-1, -0.4, 0, 0.6, 1]) {
        for (const shift of [0, -7, 12]) {
          for (const knob of [20, 60, 220]) {
            const pivot = follow ? 110 : knob
            const values = { follow, pivot: knob, lean, shift, stretch: 0.3 }
            const point = handleOf('stretch', { values })
            for (const wanted of [-1, -0.45, 0, 0.3, 0.8, 1]) {
              const y = scale.yOf(moved(pivot * 4, pivot, wanted, lean, shift))
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
    }
  })

  it('gives Stretch travel enough for a hand at every Lean', () => {
    // From Stretch −1 to 1 the point two octaves over the pivot goes from an octave down to two
    // up at Lean 0, 69 px; Lean at either end halves it, 34.5 px. (In a picture of pitch out
    // against pitch in no point of the curve went further than 13.8 px at Lean −1.)
    const travel = (lean: number, follow: number): number =>
      handleOf('stretch', { values: { follow, lean, stretch: -1 } }).y -
      handleOf('stretch', { values: { follow, lean, stretch: 1 } }).y
    for (const follow of [0, 1]) {
      expect(travel(0, follow)).toBeCloseTo(69, 9)
      expect(travel(1, follow)).toBeCloseTo(34.5, 9)
      expect(travel(-1, follow)).toBeCloseTo(34.5, 9)
      for (const lean of [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1]) {
        expect(travel(lean, follow), `Lean ${lean}`).toBeGreaterThanOrEqual(34)
      }
    }
  })

  it('takes a curve that has left the picture at the edge and moves it from where it lies', () => {
    // Stretch 1 with Shift an octave up: the point is moved three octaves, one over the top.
    const values = { follow: 0, pivot: 220, stretch: 1, shift: 12 }
    const point = handleOf('stretch', { values })
    const lies = scale.yOf(moved(880, 220, 1, 0, 12))
    expect(lies).toBe(scale.top - 23)
    expect(point.y).toBe(scale.top)
    // Taken there, nothing moves; 10 px down, the curve is the one 10 px under where it lay.
    const hold: DisplayHold = {}
    expect(point.drag(point.x, point.y, hold).stretch).toBe(1)
    const octaves = 3 - 10 / 23
    const exponent = 1 + (octaves - 1) / 2
    expect(point.drag(point.x, point.y + 10, hold).stretch).toBeCloseTo(Math.log2(exponent), 6)
    expect(point.drag(point.x, point.y + 10, hold).stretch).toBeLessThan(1)
  })

  it('sets the Pivot to the pitch under the hand, and resets both to where the device starts', () => {
    const pin = handleOf('pivot', { values: { follow: 0, pivot: 220 } })
    expect(pin.drag(scale.xOf(440), 3).pivot).toBeCloseTo(440, 6)
    expect(pin.drag(scale.xOf(55), 90).pivot).toBeCloseTo(55, 6)
    expect(pin.drag(pin.x, pin.y).pivot).toBe(220)
    expect(pin.drag(-40, 50).pivot).toBe(20)
    expect(pin.drag(400, 50).pivot).toBe(2000)
    // The whole range of the knob is two thirds of the picture: 80 px.
    expect(scale.xOf(2000) - scale.xOf(20)).toBeCloseTo(80, 9)
    expect(pin.reset?.()).toEqual({ pivot: params.pivot.default })
    expect(params.pivot.default).toBe(220)
    expect(handleOf('stretch').reset?.()).toEqual({ stretch: params.stretch.default })
  })

  it('names the handle under the pointer and its setting', () => {
    const said = (hot: string, values: Record<string, number>): string[] =>
      draw({ hot, values }).words
    expect(said('stretch', { stretch: 0.3 })).toEqual(['pitch in', 'flat', 'Stretch +0.30'])
    expect(said('stretch', { stretch: -1 })).toEqual(['pitch in', 'flat', 'Stretch −1.00'])
    expect(said('pivot', { follow: 0, pivot: 220 })).toEqual(['pitch in', 'flat', 'Pivot 220 Hz'])
    expect(said('pivot', { follow: 0, pivot: 2000 })).toEqual(['pitch in', 'flat', 'Pivot 2 kHz'])
  })
})

describe('the warp display while the device plays', () => {
  const scale = scaleOf()
  const none = scale.yOf(0)
  const signal = testSignal()
  // A note at 220 Hz with Follow on: the device has put a pivot on the note, and reports its three
  // loudest partials where its own formula lands them.
  const note = (stretchNow: number, level = 0.1): Record<string, number> =>
    playing(220, stretchNow, [
      [220, 220, level],
      [440, 440 * Math.pow(2, moved(440, 220, stretchNow)), level],
      [660, 660 * Math.pow(2, moved(660, 220, stretchNow)), level],
    ])
  const accents = (picture: Picture): Shape[] =>
    [...picture.lines, ...picture.fills].filter((shape) => shape.colour === accent)

  it('draws the curves of the two sides as they are now, through nought at the note played', () => {
    // Width 0.5: the left side's Stretch is 0.02 under the reading and the right's 0.02 over.
    const picture = draw({ values: { width: 0.5 }, meters: note(0.36), signal })
    const now = curves(picture, accent, 1)
    expect(now).toHaveLength(2)
    expectCurve(now[0], scale, 220, 0.36 - 0.5 * WIDTH_DEPTH, 0, 0, true)
    expectCurve(now[1], scale, 220, 0.36 + 0.5 * WIDTH_DEPTH, 0, 0, true)
    // Under the note nothing is moved (`Warp::plan`: what is nobody's overtone stays).
    for (const curve of now) {
      for (const [x, y] of curve.points) if (x <= scale.xOf(220)) expect(y).toBe(none)
    }
    // The reading is the setting with Drift's wander on it: at full Drift no further than 0.12
    // from the knob. The ink stays the setting: 0.3, for the note at 110 Hz.
    expect(Math.abs(0.36 - params.stretch.default)).toBeLessThanOrEqual(DRIFT_DEPTH)
    const setting = curves(picture, ink, 1.5)
    expect(setting).toHaveLength(1)
    expectCurve(setting[0], scale, 110, 0.3, 0, 0, true)
    // The note in play is a dot on its own place.
    const pin = picture.fills.filter((f) => f.colour === accent && f.arcs[0]?.[2] === 2.5)
    expect(pin).toHaveLength(1)
    expect(pin[0].arcs[0][0]).toBeCloseTo(scale.xOf(220), 9)
    expect(pin[0].arcs[0][1]).toBeCloseTo(none, 9)
    // Shift moves the note and everything with it: the dot stands seven semitones up.
    const shifted = draw({ values: { shift: 7, width: 0 }, meters: note(0.3), signal })
    const moved7 = shifted.fills.filter((f) => f.colour === accent && f.arcs[0]?.[2] === 2.5)
    expect(moved7[0].arcs[0][1]).toBeCloseTo(scale.yOf(7 / 12), 9)
    // (Width 0: the two sides are the same, and one curve is drawn for both)
    expect(curves(shifted, accent, 1)).toHaveLength(1)
    for (const curve of curves(shifted, accent, 1)) expectCurve(curve, scale, 220, 0.3, 0, 7, true)
  })

  it('with Follow on and no note in play draws no curve of now', () => {
    // The device reports no pivot (0) while it has none: a sound that is no note is not moved.
    const picture = draw({ meters: playing(0, 0.3, [[300, 300, 0.1]]), signal })
    expect(curves(picture, accent, 1)).toEqual([])
    expect(picture.fills.filter((f) => f.colour === accent && f.arcs[0]?.[2] === 2.5)).toEqual([])
    // What it hears is still marked, on the middle line: it comes out where it went in.
    const marks = picture.fills.filter((f) => f.colour === accent && f.arcs[0]?.[2] === 2)
    expect(marks).toHaveLength(1)
    expect(marks[0].arcs[0][1]).toBe(none)
  })

  it('with Follow off draws now about the knob, both ways from it, one curve for both sides', () => {
    const values = { follow: 0, pivot: 220, width: 0 }
    const picture = draw({ values, meters: playing(220, 0.42, []), signal })
    const now = curves(picture, accent, 1)
    expect(now).toHaveLength(1)
    for (const curve of now) expectCurve(curve, scale, 220, 0.42)
    // Width pulls the sides apart around each note played, not around the knob (`Warp::plan`: the
    // stretch about the knob is the middle one on both sides): with no note in play the curve
    // about the knob is still the one curve of the reading, at any Width.
    for (const width of [0.25, 1]) {
      const wide = curves(
        draw({ values: { ...values, width }, meters: playing(220, 0.42, []), signal }),
        accent,
        1,
      )
      expect(wide, `Width ${width}`).toHaveLength(1)
      expectCurve(wide[0], scale, 220, 0.42)
    }
    // Under the pivot the partials go down: 55 Hz, two octaves under, by 2 * (2^0.42 - 1).
    expect(moved(55, 220, 0.42)).toBeCloseTo(-2 * (Math.pow(2, 0.42) - 1), 9)
    expect(now[0].points[0][1]).toBeGreaterThan(none)
    expectCurve(curves(picture, ink, 1.5)[0], scale, 220, 0.3)
  })

  it('with Follow off and a note in play parts the two sides over that note', () => {
    // A C3 under a pivot at 220 Hz: the curve about the knob is one for both sides up to the
    // note, and over it the left side's overtones lie under the curve and the right's over it,
    // by the difference of the sides' exponents times their octaves over the note.
    const c3 = 130.81
    for (const [width, lean] of [
      [1, 0],
      [0.25, 0],
      [1, 0.7],
      [0.6, -0.5],
    ]) {
      const values = { follow: 0, pivot: 220, width, lean }
      const now = curves(draw({ values, meters: playing(220, 0.45, [], c3), signal }), accent, 1)
      expect(now, `Width ${width}`).toHaveLength(2)
      now.forEach((curve, at) => {
        const side = at === 0 ? -1 : 1
        expect(curve.points[0][0]).toBeCloseTo(scale.left, 9)
        expect(curve.points[curve.points.length - 1][0]).toBeCloseTo(scale.right, 9)
        for (const [x, y] of curve.points) {
          const hz = scale.hzOfX(x)
          const want = moved(hz, 220, 0.45, lean) + parted(hz, c3, 0.45, width, side, lean)
          expect(y).toBeCloseTo(scale.yOf(want), 6)
        }
      })
      // Up to the note the two are one curve; over it the right side is the higher (a smaller y).
      for (let i = 0; i < now[0].points.length; i++) {
        const [x, left] = now[0].points[i]
        const right = now[1].points[i][1]
        if (x <= scale.xOf(c3)) expect(right).toBe(left)
        else expect(right).toBeLessThan(left)
      }
    }
    // The rule in numbers, as the harness measures it on the sound (`warp_test.cpp`, group 26): the
    // second partial of the note, an octave over it, lands 2^(0.45 ± 0.04) - 2^0.45 octaves off the
    // middle at full Width, 44.8 cents under on the left and 46.1 over on the right.
    expect(1200 * parted(2 * c3, c3, 0.45, 1, -1)).toBeCloseTo(-44.83, 1)
    expect(1200 * parted(2 * c3, c3, 0.45, 1, 1)).toBeCloseTo(46.09, 1)
    // The pin stays on the knob, and at Width 0 the note parts nothing: one curve.
    const picture = draw({
      values: { follow: 0, pivot: 220, width: 1 },
      meters: playing(220, 0.45, [], c3),
      signal,
    })
    const pin = picture.fills.filter((f) => f.colour === accent && f.arcs[0]?.[2] === 2.5)
    expect(pin[0].arcs[0][0]).toBeCloseTo(scale.xOf(220), 9)
    const narrow = draw({
      values: { follow: 0, pivot: 220, width: 0 },
      meters: playing(220, 0.45, [], c3),
      signal,
    })
    expect(curves(narrow, accent, 1)).toHaveLength(1)
    // A reading that is no pitch parts nothing either.
    for (const reading of [0, Number.NaN, -5]) {
      const lost = draw({
        values: { follow: 0, pivot: 220, width: 1 },
        meters: playing(220, 0.45, [], reading),
        signal,
      })
      expect(curves(lost, accent, 1)).toHaveLength(1)
    }
  })

  it('draws each partial from where it was to how far the device reports it moved', () => {
    // −20 dB against full scale: a mark is drawn with 0.3 at −60 dB and whole at 0 dB.
    const picture = draw({ meters: note(0.3, 0.1), signal })
    const strength = 0.3 + 0.7 * (1 - 20 / 60)
    for (const hz of [440, 660]) {
      const x = Math.floor(scale.xOf(hz)) + 0.5
      const way = picture.lines.filter(
        (l) => l.colour === accent && l.points.length === 2 && l.points[0][0] === x,
      )
      expect(way, `the way of ${hz} Hz`).toHaveLength(1)
      // From the middle line, where it came out as it went in, to its move.
      expect(way[0].points[0][1]).toBeCloseTo(none, 9)
      expect(way[0].points[1][1]).toBeCloseTo(scale.yOf(moved(hz, 220, 0.3)), 9)
      expect(way[0].alpha).toBeCloseTo(strength, 9)
      const dots = picture.fills.filter(
        (f) => f.colour === accent && f.arcs[0]?.[0] === x && f.arcs[0]?.[2] === 2,
      )
      expect(dots).toHaveLength(1)
      expect(dots[0].arcs[0][1]).toBeCloseTo(scale.yOf(moved(hz, 220, 0.3)), 9)
    }
    // 440 Hz an octave over the note at Stretch 0.3 is moved 2^0.3 - 1 = 0.231 of an octave up:
    // 5.3 px at 23 px an octave.
    expect(none - scale.yOf(moved(440, 220, 0.3))).toBeCloseTo(5.316, 2)
    // The note itself is not moved: its mark stands on the middle line.
    const own = picture.fills.filter(
      (f) => f.colour === accent && f.arcs[0]?.[0] === Math.floor(scale.xOf(220)) + 0.5,
    )
    expect(own.map((f) => f.arcs[0][1])).toEqual([none])
    // A louder partial is a stronger mark, a partial under −60 dB none, and a reading that is no
    // pitch (nothing has come yet, or a bad number) none.
    const marks = (meters: Record<string, number>): Shape[] =>
      draw({ meters, signal }).fills.filter((f) => f.colour === accent && f.arcs[0]?.[2] === 2)
    expect(marks(playing(220, 0.3, [[440, 500, 1]]))[0].alpha).toBeCloseTo(1, 9)
    expect(marks(playing(220, 0.3, [[440, 500, 1]]))[0].arcs[0][1]).toBeCloseTo(
      scale.yOf(Math.log2(500 / 440)),
      9,
    )
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
    expect(dryDot(half)[0].arcs[0][1]).toBeCloseTo(none, 9)
    for (const curve of curves(half, accent, 1)) expect(curve.alpha).toBeCloseTo(Math.SQRT1_2, 9)
    // Mix 0: the sound as it went in. Nothing in the second colour, and the partials stand on
    // the middle line where the device reads them.
    const dryOnly = draw({ values: { mix: 0 }, meters: note(0.3), signal })
    expect(accents(dryOnly)).toEqual([])
    expect(dryDot(dryOnly)[0].alpha).toBeCloseTo(strength, 9)
  })

  it('shows nothing of now while it is bypassed or has no sound to read', () => {
    expect(accents(draw({ meters: note(0.3), signal, powered: false }))).toEqual([])
    expect(accents(draw({ meters: note(0.3), signal: null }))).toEqual([])
    // Readings that are not numbers: with Follow on there is no note to draw a curve about, and
    // with it off the setting stands in their place.
    const bad = playing(Number.NaN, Number.NaN, [])
    expect(accents(draw({ meters: bad, signal }))).toEqual([])
    const off = draw({ values: { follow: 0, pivot: 330, width: 0 }, meters: bad, signal })
    expect(curves(off, accent, 1)).toHaveLength(1)
    for (const curve of curves(off, accent, 1)) expectCurve(curve, scale, 330, 0.3)
    expect(plate).not.toBe(accent)
  })
})
