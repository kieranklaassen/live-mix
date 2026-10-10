// The truth of the Overtone Singer's display: its curve against the device's
// formula worked out here a second time, its numbers against the device's
// header, its marks against the readings they stand for, each handle against
// the parameter it sets, and the compiled device against what is drawn of it.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../core/params'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { INK, PLAIN_COLOURS, dbOfY, yOfDb } from '../components/display-kit'
import {
  OVERTONE_SINGER_FACES,
  SINGER_FOOT_DB,
  SINGER_FROM,
  SINGER_LIFT,
  SINGER_STAGE_SHARE,
  SINGER_TO,
  SINGER_TOP_DB,
  SINGER_WIDTH_NARROW,
  SINGER_WIDTH_WIDE,
  droneOfScaleDb,
  droneScaleDb,
  harmonicOfX,
  singerDb,
  singerLiftDb,
  singerPlot,
  singerRootHz,
  singerWidth,
  xOfHarmonic,
} from '../components/displays/overtone-singer'
import { type DisplayHandle, type DisplayHold } from '../components/plate-display'
import {
  displaySize,
  drawDisplay,
  patchUnder,
  stockDescriptors,
  testSignal,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const RATE = 48000
const ID = 'overtone-singer'
const { display, face } = OVERTONE_SINGER_FACES[ID]
const params: Readonly<Record<string, ParamSpec>> = stockDescriptors().get(ID)?.params ?? {}
const size = displaySize(display)
const plot = singerPlot(size)
const foot = plot.y + plot.h

const draw = (options: FrameOptions = {}): RecordingContext => drawDisplay(display, params, options)
/** A frame while the device runs: sound at it, and the readings given. */
const running = (
  meters: Record<string, number>,
  values: Record<string, number> = {},
  options: FrameOptions = {},
): RecordingContext => draw({ values, meters, signal: testSignal(), ...options })
const readings = (harmonic: number, more: Record<string, number> = {}): Record<string, number> => ({
  harmonic,
  harmonicRight: harmonic,
  target: Math.round(harmonic),
  ceiling: 0,
  ...more,
})
const handles = (
  values: Record<string, number> = {},
  options: FrameOptions = {},
): readonly DisplayHandle[] =>
  display.handles?.(viewOf(display, params, { values, ...options })) ?? []
const handle = (
  key: string,
  values: Record<string, number> = {},
  options: FrameOptions = {},
): DisplayHandle => {
  const found = handles(values, options).find((point) => point.key === key)
  if (!found) throw new Error(`no handle ${key}`)
  return found
}

const yOf = (db: number): number => yOfDb(db, plot, SINGER_TOP_DB, SINGER_FOOT_DB)
const dbAtY = (y: number): number => dbOfY(y, plot, SINGER_TOP_DB, SINGER_FOOT_DB)

interface Shape {
  op: 'stroke' | 'fill'
  points: [number, number][]
  arcs: [number, number, number][]
  width: number
  alpha: number
  dash: number[]
  colour: string
}

/** Every path stroked or filled, with the pen it was drawn with. */
function shapes(drawn: RecordingContext): Shape[] {
  const found: Shape[] = []
  let points: [number, number][] = []
  let arcs: [number, number, number][] = []
  let dash: number[] = []
  const pen: Record<string, unknown> = { lineWidth: 1, globalAlpha: 1 }
  for (const call of drawn.calls) {
    if (call.name.startsWith('set ')) pen[call.name.slice(4)] = call.args[0]
    else if (call.name === 'beginPath') {
      points = []
      arcs = []
    } else if (call.name === 'moveTo' || call.name === 'lineTo')
      points.push([call.args[0] as number, call.args[1] as number])
    else if (call.name === 'arc')
      arcs.push([call.args[0] as number, call.args[1] as number, call.args[2] as number])
    else if (call.name === 'setLineDash') dash = [...(call.args[0] as number[])]
    else if (call.name === 'stroke' || call.name === 'fill')
      found.push({
        op: call.name,
        points,
        arcs,
        width: pen.lineWidth as number,
        alpha: pen.globalAlpha as number,
        dash,
        colour: String(call.name === 'stroke' ? pen.strokeStyle : pen.fillStyle),
      })
  }
  return found
}

/** The curve of the resonance: the one long line in the ink at full strength. */
function mainCurve(drawn: RecordingContext): [number, number][] {
  const curves = shapes(drawn).filter(
    (shape) =>
      shape.op === 'stroke' &&
      shape.width === 1.5 &&
      shape.alpha === 1 &&
      shape.dash.length === 0 &&
      shape.points.length > 10,
  )
  expect(curves.length, 'one main curve').toBe(1)
  return curves[0].points
}

/** The right side's curve, when it is drawn: a long thinner line that stands back. */
function backCurves(drawn: RecordingContext): [number, number][][] {
  return shapes(drawn)
    .filter(
      (shape) =>
        shape.op === 'stroke' &&
        shape.width === 1 &&
        shape.alpha === INK.back &&
        shape.dash.length === 0 &&
        shape.points.length > 10,
    )
    .map((shape) => shape.points)
}

/** A line's height at `x`, between the two points either side of it. */
function yAt(points: readonly [number, number][], x: number): number {
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1]
    const [x1, y1] = points[i]
    if (x >= x0 && x <= x1) return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
  }
  throw new Error(`the line does not reach x = ${x}`)
}

/** What a drawn curve says is done at a harmonic of the root, in dB. */
const drawnDb = (points: readonly [number, number][], harmonic: number): number =>
  dbAtY(yAt(points, xOfHarmonic(harmonic, plot)))

/** The highest point of a line. */
const topOf = (points: readonly [number, number][]): [number, number] =>
  points.reduce((top, point) => (point[1] < top[1] ? point : top))

/** The accent dots: the resonance now (2.5 px) and the right side's (1.75 px). */
const dots = (drawn: RecordingContext): [number, number, number][] =>
  shapes(drawn)
    .filter((shape) => shape.op === 'fill' && shape.colour === PLAIN_COLOURS.accent)
    .flatMap((shape) => shape.arcs)
    .filter((arc) => arc[2] < 3)

/** The mark at the foot on the harmonic the melody moves to: the one line in the accent. */
const targetMarks = (drawn: RecordingContext): [number, number][][] =>
  shapes(drawn)
    .filter(
      (shape) =>
        shape.op === 'stroke' && shape.colour === PLAIN_COLOURS.accent && shape.points.length === 2,
    )
    .map((shape) => shape.points)

/** The shaded span the melody travels: the rectangles laid in the ink that faintly. */
function spans(drawn: RecordingContext): number[][] {
  const found: number[][] = []
  let alpha = 1
  let fill = ''
  for (const call of drawn.calls) {
    if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    if (
      call.name === 'fillRect' &&
      fill === PLAIN_COLOURS.ink &&
      Math.abs(alpha - INK.fill * 0.75) < 1e-9
    )
      found.push(call.args as number[])
  }
  return found
}

/**
 * The device's formula a second time, straight from the comment at the head
 * of `overtone_singer.h`, with the tangent itself where the kit has its
 * approximation and the sine itself where the device has a series: two peaks
 * in series, wet = a² + 2·a·ρ·H + ρ²·H², H = j·k·w / (1 − w² + j·k·w),
 * k = width / (0.6435943 · position · sin(turn) / turn) with turn the centre
 * in radians a sample, lift = 14.142136 / √width, width = 2 · (0.05 / 2)^Focus
 * roots, and ρ = √lift − a, or what leaves `held` of the lift over the drone.
 */
function formulaDb(
  setting: { focus: number; drone: number; mix: number; held?: number },
  rootHz: number,
  position: number,
  hz: number,
): number {
  const width = 2 * Math.pow(0.05 / 2, setting.focus)
  const lift = 14.142136 / Math.sqrt(width)
  const turn = (2 * Math.PI * rootHz * position) / RATE
  const k = width / (0.6435943 * position * (Math.sin(turn) / turn))
  const w = Math.tan((Math.PI * hz) / RATE) / Math.tan((Math.PI * rootHz * position) / RATE)
  const denRe = 1 - w * w
  const denIm = k * w
  const den = denRe * denRe + denIm * denIm
  const re = (k * w * denIm) / den
  const im = (k * w * denRe) / den
  const a = setting.drone
  const reach = Math.sqrt(a * a + (setting.held ?? 1) * (lift - a * a)) - a
  // a² + 2·a·ρ·H + ρ²·H², with H² = (re² − im²) + j·2·re·im.
  const wetRe = a * a + 2 * a * reach * re + reach * reach * (re * re - im * im)
  const wetIm = 2 * a * reach * im + reach * reach * 2 * re * im
  const outRe = 1 - setting.mix + setting.mix * wetRe
  const outIm = setting.mix * wetIm
  return 10 * Math.log10(outRe * outRe + outIm * outIm)
}

describe('the numbers of the Overtone Singer display', () => {
  it('are the ones in the device header', () => {
    const header = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../../../cpp/devices/overtone-singer/overtone_singer.h',
      ),
      'utf8',
    )
    const constant = (name: string): number => {
      const found = new RegExp(`constexpr float ${name} = ([0-9.]+)f;`).exec(header)
      if (!found) throw new Error(`no ${name} in the header`)
      return Number(found[1])
    }
    expect(SINGER_WIDTH_WIDE).toBe(constant('kWidthWide'))
    expect(SINGER_WIDTH_NARROW).toBe(constant('kWidthNarrow'))
    expect(SINGER_LIFT).toBe(constant('kLift'))
    expect(SINGER_STAGE_SHARE).toBe(constant('kStageShare'))
  })

  it('give the width, the lift and the root as the device has them', () => {
    expect(singerWidth(0)).toBe(2)
    expect(singerWidth(1)).toBeCloseTo(0.05, 12)
    expect(singerWidth(0.5)).toBeCloseTo(Math.sqrt(2 * 0.05), 12)
    expect(singerLiftDb(0)).toBeCloseTo(20, 4)
    expect(singerLiftDb(1)).toBeCloseTo(36.02, 2)
    // A straight line in Focus, which is what lets a height say one Focus.
    expect(singerLiftDb(0.25)).toBeCloseTo(
      singerLiftDb(0) + 0.25 * (singerLiftDb(1) - singerLiftDb(0)),
      9,
    )
    expect(singerRootHz(9, 4)).toBeCloseTo(440, 9)
    expect(singerRootHz(0, 4)).toBeCloseTo(261.6256, 3)
    expect(singerRootHz(9, 2)).toBeCloseTo(110, 9)
  })

  it('give the curve the formula in the header gives', () => {
    for (const setting of [
      { focus: 0.6, drone: 1, mix: 1 },
      { focus: 0, drone: 0.5, mix: 1 },
      { focus: 1, drone: 0, mix: 1 },
      { focus: 0.3, drone: 0.3, mix: 0.4 },
      { focus: 0.8, drone: 0.7, mix: 1, held: 0.25 },
    ]) {
      for (const [rootHz, position] of [
        [110, 6],
        [110, 8.4],
        [singerRootHz(0, 4), 16],
        [singerRootHz(11, 1), 2],
      ]) {
        const db = singerDb(setting, rootHz, position, RATE)
        for (const harmonic of [
          0.5,
          1,
          position - 1,
          position - 0.2,
          position,
          position + 0.07,
          17,
        ])
          // The kit's tangent is within a few millionths of the true one this far under Nyquist.
          expect(
            db(rootHz * harmonic),
            `${JSON.stringify(setting)} on ${position} at ${harmonic}`,
          ).toBeCloseTo(formulaDb(setting, rootHz, position, rootHz * harmonic), 2)
      }
    }
  })
})

describe('the curve of the Overtone Singer display', () => {
  it('stands on the harmonic the device reads, with the lift Focus gives it', () => {
    for (const [harmonic, focus] of [
      [6, 0.6],
      [9, 0],
      [12.5, 0.3],
      [16, 1],
      [2, 0.9],
    ]) {
      const curve = mainCurve(running(readings(harmonic), { focus }))
      const [x, y] = topOf(curve)
      expect(x, `on ${harmonic}`).toBeCloseTo(xOfHarmonic(harmonic, plot), 6)
      expect(dbAtY(y), `Focus ${focus}`).toBeCloseTo(singerLiftDb(focus), 6)
    }
  })

  it('is the device formula across the plot, at any Focus, Drone and Mix', () => {
    const cases: Record<string, number>[] = [
      {},
      { focus: 0, drone: 0.5 },
      { focus: 0.85, drone: 0.25 },
      { focus: 0.3, drone: 0.3, mix: 0.4 },
      { root: 0, octave: 4, focus: 0.5, mix: 0.7 },
    ]
    for (const values of cases) {
      const setting = { focus: 0.6, drone: 1, mix: 1, ...values }
      const rootHz = singerRootHz(values.root ?? 9, values.octave ?? 2)
      const curve = mainCurve(running(readings(8.4), values))
      for (const harmonic of [1, 3, 6.5, 7.4, 8, 8.4, 9, 9.4, 10.6, 13, 16.5]) {
        const said = formulaDb(setting, rootHz, 8.4, rootHz * harmonic)
        // Under the foot the line is clipped away, and it is a line between points a pixel apart.
        if (said < SINGER_FOOT_DB) continue
        expect(
          Math.abs(drawnDb(curve, harmonic) - said),
          `${JSON.stringify(values)} at ${harmonic}: ${drawnDb(curve, harmonic)} against ${said}`,
        ).toBeLessThan(harmonic === 8.4 ? 1e-6 : 0.4)
      }
    }
  })

  it('never goes under what Drone leaves, beside the resonance or anywhere, held by the ceiling or not', () => {
    for (const drone of [1, 0.5]) {
      for (const focus of [0, 0.3, 0.6, 1]) {
        for (const ceiling of [0, -6, -20]) {
          const around = 40 * Math.log10(drone)
          const curve = mainCurve(running(readings(9, { ceiling }), { focus, drone }))
          for (const [, y] of curve)
            expect(dbAtY(y), `Drone ${drone} Focus ${focus} ceiling ${ceiling}`).toBeGreaterThan(
              around - 1e-6,
            )
          // And the harmonics either side are the device's formula: over the drone, not under.
          for (const harmonic of [8, 10]) {
            const said = formulaDb(
              { focus, drone, mix: 1, held: Math.pow(10, ceiling / 20) },
              110,
              9,
              110 * harmonic,
            )
            expect(said).toBeGreaterThan(around)
            expect(Math.abs(drawnDb(curve, harmonic) - said)).toBeLessThan(0.05)
          }
        }
      }
    }
  })

  it('keeps a resonance narrower than a pixel whole, and as wide as Focus makes it', () => {
    for (const focus of [0, 0.5, 1]) {
      // With no Drone the response is the resonance alone: 3 dB down at its two edges.
      const curve = mainCurve(running(readings(9), { focus, drone: 0 }))
      const half = yOf(singerLiftDb(focus) - 3.0103)
      const crossings: number[] = []
      for (let i = 1; i < curve.length; i++) {
        const [x0, y0] = curve[i - 1]
        const [x1, y1] = curve[i]
        if (y0 > half === y1 > half) continue
        crossings.push(harmonicOfX(x0 + ((x1 - x0) * (half - y0)) / (y1 - y0), plot))
      }
      expect(crossings.length, `Focus ${focus}`).toBe(2)
      // In roots, whatever the harmonic. A wide one leans a little to the low side of its centre.
      const width = singerWidth(focus)
      expect((crossings[1] - crossings[0]) / width, `Focus ${focus}`).toBeCloseTo(1, 1)
      expect(crossings[0], `Focus ${focus}`).toBeLessThan(9 - 0.45 * width)
      expect(crossings[1], `Focus ${focus}`).toBeGreaterThan(9 + 0.45 * width)
    }
  })

  it('is lowered by what the ceiling reading says the resonance is held by', () => {
    const free = topOf(mainCurve(running(readings(8), { drone: 0 })))
    const held = topOf(mainCurve(running(readings(8, { ceiling: -12 }), { drone: 0 })))
    expect(dbAtY(free[1]) - dbAtY(held[1])).toBeCloseTo(12, 6)
    // With Drone the part held is the resonance, not the sound around it.
    const around = mainCurve(running(readings(8, { ceiling: -12 }), { drone: 1 }))
    expect(drawnDb(around, 2)).toBeCloseTo(
      formulaDb({ focus: 0.6, drone: 1, mix: 1 }, 110, 8, 220),
      1,
    )
    const lift = Math.pow(10, singerLiftDb(0.6) / 20)
    expect(dbAtY(topOf(around)[1])).toBeCloseTo(20 * Math.log10(1 + 0.2512 * (lift - 1)), 2)
    // A reading above 0 is no reading of a ceiling: nothing is lifted by it.
    const over = topOf(mainCurve(running(readings(8, { ceiling: 3 }), { drone: 0 })))
    expect(over[1]).toBeCloseTo(free[1], 9)
  })

  it('is flat at Mix 0, with the range, the points and the marks still there', () => {
    const drawn = running(readings(9.5, { target: 10 }), { mix: 0 })
    for (const [, y] of mainCurve(drawn)) expect(y).toBeCloseTo(yOf(0), 9)
    const [dot] = dots(drawn)
    expect(dot[0]).toBeCloseTo(xOfHarmonic(9.5, plot), 9)
    expect(dot[1]).toBeCloseTo(yOf(0), 9)
    expect(targetMarks(drawn)[0][0][0]).toBeCloseTo(xOfHarmonic(10, plot), 9)
    const dashed = shapes(drawn).filter((shape) => shape.dash.length > 0)
    expect(dashed.length).toBe(1)
    expect(dashed[0].points[0][1]).toBeCloseTo(Math.floor(yOf(singerLiftDb(0.6))) + 0.5, 9)
  })
})

describe('the marks of the Overtone Singer display', () => {
  it('put the dot on the top of the curve at the harmonic read, and move with the reading', () => {
    let before = -Infinity
    for (const harmonic of [6, 6.25, 6.5, 6.9, 7, 11.3]) {
      const drawn = running(readings(harmonic))
      const all = dots(drawn)
      expect(all.length).toBe(1)
      const [x, y, radius] = all[0]
      expect(radius).toBe(2.5)
      expect(x).toBeCloseTo(xOfHarmonic(harmonic, plot), 9)
      expect(y).toBeCloseTo(topOf(mainCurve(drawn))[1], 9)
      expect(x).toBeGreaterThan(before)
      before = x
    }
  })

  it('draw the right side where its reading has it, and only when it is elsewhere', () => {
    const together = running(readings(8))
    expect(backCurves(together).length).toBe(0)
    expect(dots(together).length).toBe(1)
    const apart = running(readings(8, { harmonicRight: 7 }))
    const [back] = backCurves(apart)
    expect(topOf(back)[0]).toBeCloseTo(xOfHarmonic(7, plot), 9)
    // The same curve a note behind: as high, and the same shape.
    expect(topOf(back)[1]).toBeCloseTo(topOf(mainCurve(apart))[1], 6)
    const both = dots(apart)
    expect(both.map((dot) => dot[2]).sort()).toEqual([1.75, 2.5])
    const small = both.find((dot) => dot[2] === 1.75)
    expect(small?.[0]).toBeCloseTo(xOfHarmonic(7, plot), 9)
    expect(small?.[1]).toBeCloseTo(topOf(back)[1], 9)
  })

  it('mark the harmonic the melody moves to at the foot', () => {
    for (const target of [2, 7, 16]) {
      const [mark] = targetMarks(running(readings(8.2, { target })))
      expect(mark[0][0]).toBeCloseTo(xOfHarmonic(target, plot), 9)
      expect(mark[1][1]).toBe(foot)
      expect(mark[0][1]).toBeLessThan(foot)
    }
  })

  it('stand where the melody starts, without motion, until the device has said and while it is off', () => {
    const cases: [string, FrameOptions][] = [
      ['no readings yet', { signal: testSignal(), meters: { harmonic: 0, target: 0, ceiling: 0 } }],
      ['no sound at it', { meters: readings(11), signal: null }],
      ['switched off', { meters: readings(11), signal: testSignal(), powered: false }],
    ]
    for (const [what, options] of cases) {
      const drawn = draw(options)
      expect(topOf(mainCurve(drawn))[0], what).toBeCloseTo(xOfHarmonic(6, plot), 9)
      expect(dots(drawn), what).toEqual([])
      expect(targetMarks(drawn), what).toEqual([])
      // Down starts at the top of its range.
      const down = draw({ ...options, values: { pattern: 2 } })
      expect(topOf(mainCurve(down))[0], what).toBeCloseTo(xOfHarmonic(12, plot), 9)
    }
  })

  it('shade the span the melody travels, and none under Hold', () => {
    const [span] = spans(draw())
    expect(span[0]).toBeCloseTo(xOfHarmonic(6, plot), 9)
    expect(span[0] + span[2]).toBeCloseTo(xOfHarmonic(12, plot), 9)
    // Low over High is the same range.
    const [crossed] = spans(draw({ values: { low: 13, high: 4 } }))
    expect(crossed[0]).toBeCloseTo(xOfHarmonic(4, plot), 9)
    expect(crossed[0] + crossed[2]).toBeCloseTo(xOfHarmonic(13, plot), 9)
    expect(spans(draw({ values: { pattern: 5 } }))).toEqual([])
    expect(spans(draw({ values: { low: 8, high: 8 } }))).toEqual([])
  })

  it('draw the spectrum on the same axis: a partial on the 7th harmonic stands over the 7th rung', () => {
    const signal = testSignal()
    const binHz = signal.binHz
    signal.spectrum?.fill(-100)
    const bin = Math.round((7 * 110) / binHz)
    if (signal.spectrum) signal.spectrum[bin] = -10
    const fills = shapes(draw({ meters: readings(6), signal })).filter(
      (shape) => shape.op === 'fill' && shape.alpha === 0.5 && shape.points.length > 10,
    )
    expect(fills.length).toBe(1)
    const [x] = topOf(fills[0].points)
    // A column of the fill is two pixels, a bin a pixel and a half.
    expect(Math.abs(x - xOfHarmonic((bin * binHz) / 110, plot))).toBeLessThan(2)
    // An octave up the root the same partial is the 3.5th harmonic.
    const up = shapes(draw({ meters: readings(6), signal, values: { octave: 3 } })).filter(
      (shape) => shape.op === 'fill' && shape.alpha === 0.5 && shape.points.length > 10,
    )
    expect(Math.abs(topOf(up[0].points)[0] - xOfHarmonic((bin * binHz) / 220, plot))).toBeLessThan(
      2,
    )
  })

  it('name the root, and what the point in hand sets, on a patch of the plate', () => {
    for (const [values, words] of [
      [{}, 'A2'],
      [{ root: 0, octave: 4 }, 'C4'],
      [{ root: 6, octave: 1 }, 'F#1'],
    ] as const) {
      const drawn = draw({ values })
      expect(drawn.words()).toContain(words)
      expect(patchUnder(drawn, words, PLAIN_COLOURS.plate)).not.toBeNull()
    }
    const cases = [
      ['low', { low: 3, focus: 0.07 }, 'Low 3  Focus 0.07'],
      ['high', {}, 'High 12  Focus 0.60'],
      ['drone', { drone: 0.5 }, 'Drone 0.50'],
    ] as const
    for (const [hot, values, words] of cases) {
      const drawn = draw({ values, hot })
      expect(drawn.words()).toContain(words)
      expect(drawn.words()).not.toContain('A2')
      expect(patchUnder(drawn, words, PLAIN_COLOURS.plate)).not.toBeNull()
    }
  })

  it('number the harmonics under their rungs, as many as there is room for', () => {
    const numbersAt = (width: number): string[] =>
      draw({ width })
        .words()
        .filter((words) => /^\d+$/.test(words))
    expect(numbersAt(128)).toEqual(['4', '8', '12', '16'])
    expect(numbersAt(204)).toEqual(['2', '4', '6', '8', '10', '12', '14', '16'])
    expect(numbersAt(293).length).toBe(16)
    const drawn = draw()
    const eight = drawn.calls.find((call) => call.name === 'fillText' && call.args[0] === '8')
    expect(eight?.args[1]).toBeCloseTo(xOfHarmonic(8, plot), 9)
  })
})

describe('the points of the Overtone Singer display', () => {
  it('stand on Low and High at the height of the lift, and on the level Drone leaves', () => {
    const cases: Record<string, number>[] = [
      {},
      { low: 2, high: 16, focus: 0, drone: 0.5 },
      { low: 9, high: 9, focus: 1, drone: 0.2 },
    ]
    for (const values of cases) {
      const set = { low: 6, high: 12, focus: 0.6, drone: 1, ...values }
      const low = handle('low', values)
      const high = handle('high', values)
      const drone = handle('drone', values)
      expect(low.x).toBeCloseTo(xOfHarmonic(set.low, plot), 9)
      expect(high.x).toBeCloseTo(xOfHarmonic(set.high, plot), 9)
      expect(low.y).toBeCloseTo(yOf(singerLiftDb(set.focus)), 9)
      expect(high.y).toBe(low.y)
      // The level around the resonance is Drone squared.
      expect(drone.y).toBeCloseTo(yOf(40 * Math.log10(set.drone)), 9)
      expect(drone.x).toBeGreaterThan(xOfHarmonic(16, plot))
      // The curve's top, standing on Low with no Drone, is under the Low point.
      const top = topOf(mainCurve(running(readings(set.low), { ...values, drone: 0 })))
      expect(top[0]).toBeCloseTo(low.x, 9)
      expect(top[1]).toBeCloseTo(low.y, 6)
    }
  })

  it('set the harmonic and the Focus whose picture is under the hand', () => {
    for (const key of ['low', 'high'] as const) {
      for (const harmonic of key === 'low' ? [2, 5, 9, 12] : [6, 9, 13, 16]) {
        for (const focus of [0, 0.37, 1]) {
          const there = handle(key, { [key]: harmonic, focus })
          const set = handle(key).drag(there.x, there.y)
          expect(set[key], `${key} ${harmonic}`).toBe(harmonic)
          expect(set.focus, `Focus ${focus}`).toBeCloseTo(focus, 9)
          // A hand between two rungs is on the nearer one.
          expect(handle(key).drag(there.x + 3, there.y)[key]).toBe(harmonic)
          expect(handle(key).drag(there.x - 3, there.y)[key]).toBe(harmonic)
        }
      }
    }
    // Past the scale's two ends Focus stops at its own.
    expect(handle('low').drag(40, 0).focus).toBe(1)
    expect(handle('low').drag(40, size.height).focus).toBe(0)
  })

  it('stop Low at High and High at Low, so each stays the end it is named for', () => {
    expect(handle('low').drag(size.width, 20).low).toBe(12)
    expect(handle('high').drag(0, 20).high).toBe(6)
    expect(handle('low').drag(0, 20).low).toBe(2)
    expect(handle('high').drag(size.width, 20).high).toBe(16)
    // Set crossed by the knobs, a point taken and not moved stays where it is.
    const crossed = { low: 13, high: 4 }
    const low = handle('low', crossed)
    expect(low.drag(low.x, low.y).low).toBe(13)
    const high = handle('high', crossed)
    expect(high.drag(high.x, high.y).high).toBe(4)
  })

  it('open a range closed on one harmonic whichever way the hand pulls', () => {
    const closed = { low: 9, high: 9 }
    for (const key of ['low', 'high'] as const) {
      const point = handle(key, closed)
      const hold: DisplayHold = {}
      // Taken and held still it moves nothing, and both ends are in the hand.
      expect(point.drag(point.x, point.y, hold)).toMatchObject({ low: 9, high: 9 })
      expect(Object.keys(point.drag(point.x, point.y, hold)).sort()).toEqual([
        'focus',
        'high',
        'low',
      ])
      // Pulled up the ladder it is High that goes, and the plate has the new range at the next move.
      expect(point.drag(xOfHarmonic(12, plot), point.y, hold)).toMatchObject({ low: 9, high: 12 })
      const open = handle(key, { low: 9, high: 12 })
      // The same hand pulled back down past where they stood: now it is Low.
      expect(open.drag(xOfHarmonic(5, plot), point.y, hold)).toMatchObject({ low: 5, high: 9 })
      expect(handle(key, { low: 5, high: 9 }).drag(point.x, point.y, hold)).toMatchObject(closed)
      // Past either end of the ladder it stops at the ladder's.
      expect(point.drag(-50, point.y, hold)).toMatchObject({ low: 2, high: 9 })
      expect(point.drag(size.width + 50, point.y, hold)).toMatchObject({ low: 9, high: 16 })
    }
    // A range that is open: an end is itself alone, taken with a hold or without.
    expect(Object.keys(handle('low').drag(40, 20, {})).sort()).toEqual(['focus', 'low'])
    expect(Object.keys(handle('high').drag(40, 20)).sort()).toEqual(['focus', 'high'])
  })

  it('set the Drone whose level is under the hand', () => {
    for (const drone of [1, 0.71, 0.5, 0.3, 0.2]) {
      const there = handle('drone', { drone })
      expect(handle('drone').drag(there.x, there.y).drone).toBeCloseTo(drone, 9)
    }
    // Above the line where nothing is changed, all of it.
    expect(handle('drone').drag(0, 0).drone).toBe(1)
  })

  it('keep a Drone under the foot at the foot, and move it from where it lies', () => {
    const atFoot = Math.pow(10, SINGER_FOOT_DB / 40)
    for (const drone of [0, 0.03, 0.1, atFoot]) {
      const point = handle('drone', { drone })
      expect(point.y, `Drone ${drone}`).toBeCloseTo(foot, 9)
      // Taken and held still it stays what it was, through the whole of a hold.
      const hold: DisplayHold = {}
      expect(point.drag(point.x, point.y, hold).drone).toBeCloseTo(drone, 9)
      expect(point.drag(point.x, point.y, hold).drone).toBeCloseTo(drone, 9)
      // One place is one value while the hand holds it, wherever the value has got to.
      const up = point.drag(point.x, point.y - 20, hold).drone
      const later = handle('drone', { drone: up }).drag(point.x, point.y - 20, hold).drone
      expect(later).toBeCloseTo(up, 9)
      expect(up).toBeGreaterThan(Math.max(drone, atFoot))
    }
    // Nothing lies 6 dB of the scale under the foot: from there the hand comes
    // up that far before the point leaves the edge with it.
    const hold: DisplayHold = {}
    const point = handle('drone', { drone: 0 })
    point.drag(point.x, point.y, hold)
    const sixDb = yOf(0) - yOf(6)
    expect(point.drag(point.x, point.y - sixDb / 2, hold).drone).toBeCloseTo(atFoot / 2, 9)
    expect(point.drag(point.x, point.y - sixDb, hold).drone).toBeCloseTo(atFoot, 9)
    expect(point.drag(point.x, point.y - sixDb - 10, hold).drone).toBeCloseTo(
      Math.pow(10, dbAtY(foot - 10) / 40),
      9,
    )
    // Taken on the scale and pulled down past the foot it goes the same way to nothing.
    const down: DisplayHold = {}
    const from = handle('drone', { drone: 0.5 })
    from.drag(from.x, from.y, down)
    expect(from.drag(from.x, foot, down).drone).toBeCloseTo(atFoot, 9)
    expect(from.drag(from.x, foot + sixDb, down).drone).toBe(0)
    expect(from.drag(from.x, foot + 40, down).drone).toBe(0)
    // The scale under the foot and back.
    for (const drone of [0, 0.01, 0.1, atFoot, 0.4, 1])
      expect(droneOfScaleDb(droneScaleDb(drone))).toBeCloseTo(drone, 12)
  })

  it('set Focus alone by the wheel over Low or High, a fiftieth a notch, and stop at its ends', () => {
    for (const key of ['low', 'high'] as const) {
      expect(handle(key).wheel?.(1)).toEqual({ focus: 0.62 })
      expect(handle(key).wheel?.(-3)).toEqual({ focus: 0.54 })
      expect(handle(key, { focus: 0.99 }).wheel?.(2)).toEqual({ focus: 1 })
      expect(handle(key, { focus: 0.03 }).wheel?.(-4)).toEqual({ focus: 0 })
      // A notch moves the point about a third of a pixel: finer than a hand on it.
      const before = handle(key).y
      const after = handle(key, { focus: 0.62 }).y
      expect(before - after).toBeGreaterThan(0.2)
      expect(before - after).toBeLessThan(0.6)
    }
    expect(handle('drone').wheel).toBeUndefined()
  })

  it('go back to where the device starts on a double press', () => {
    const moved = { low: 3, high: 15, focus: 0.1, drone: 0.2 }
    expect(handle('low', moved).reset?.()).toEqual({ low: 6, focus: 0.6 })
    expect(handle('high', moved).reset?.()).toEqual({ high: 12, focus: 0.6 })
    expect(handle('drone', moved).reset?.()).toEqual({ drone: 1 })
  })

  it('are drawn where they stand, joined by the dashed line of the range', () => {
    const values = { low: 4, high: 14, focus: 0.2, drone: 0.5 }
    const drawn = draw({ values })
    const rings = shapes(drawn)
      .filter((shape) => shape.op === 'fill' && shape.colour === PLAIN_COLOURS.plate)
      .flatMap((shape) => shape.arcs)
    for (const point of handles(values)) {
      const ring = rings.find((arc) => Math.abs(arc[0] - point.x) < 1e-9)
      expect(ring?.[1], point.key).toBeCloseTo(point.y, 9)
    }
    const [dashed] = shapes(drawn).filter((shape) => shape.dash.length > 0)
    expect(dashed.points[0][0]).toBeCloseTo(handle('low', values).x, 9)
    expect(dashed.points[1][0]).toBeCloseTo(handle('high', values).x, 9)
  })

  it('are laid out from the size the display is given', () => {
    for (const [width, height] of [
      [204, 100],
      [176, 100],
      [128, 100],
    ]) {
      const at = singerPlot({ width, height })
      expect(at).toEqual({ x: 4, y: 4, w: width - 8, h: height - 18 })
      const low = handle('low', {}, { width, height })
      expect(low.x).toBeCloseTo(
        4 + ((6 - SINGER_FROM) / (SINGER_TO - SINGER_FROM)) * (width - 8),
        9,
      )
      expect(harmonicOfX(low.x, at)).toBeCloseTo(6, 9)
      const drone = handle('drone', {}, { width, height })
      expect(drone.x).toBeLessThan(width - 4)
      expect(drone.x).toBeGreaterThan(xOfHarmonic(16, at) + 4)
      const drawn = running(readings(8.4), {}, { width, height })
      expect(topOf(mainCurve(drawn))[0]).toBeCloseTo(xOfHarmonic(8.4, at), 9)
    }
  })

  it('stands with the four knobs a player reaches for', () => {
    expect(face).toEqual(['root', 'pattern', 'pace', 'glide'])
    for (const name of face ?? []) expect(params[name].name.length, name).toBeLessThanOrEqual(9)
  })
})

describe('the compiled Overtone Singer against what is drawn of it', () => {
  const BLOCK = 128

  /** The level of a tone in a stretch of sound, through a Hann window. */
  function toneLevel(samples: Float32Array, hz: number): number {
    let re = 0
    let im = 0
    let weight = 0
    for (let n = 0; n < samples.length; n++) {
      const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / (samples.length - 1))
      const angle = (2 * Math.PI * hz * n) / RATE
      re += hann * samples[n] * Math.cos(angle)
      im += hann * samples[n] * Math.sin(angle)
      weight += hann
    }
    return (2 * Math.hypot(re, im)) / weight
  }

  /** Runs the device on `sound(n)` for `seconds` and hands back the last `keep` seconds of its left side. */
  async function rendered(
    values: Record<string, number>,
    sound: (n: number) => number,
    seconds: number,
    keep: number,
  ) {
    const device = await loadWasmDevice(ID, RATE)
    for (const [name, value] of Object.entries(values)) device.set(params[name], value)
    const total = Math.round((seconds * RATE) / BLOCK) * BLOCK
    const kept = new Float32Array(Math.round(keep * RATE))
    const block = new Float32Array(BLOCK)
    for (let done = 0; done < total; done += BLOCK) {
      for (let i = 0; i < BLOCK; i++) block[i] = sound(done + i)
      device.processBlock(block)
      const out = device.view(device.device.device_out_left(), BLOCK)
      for (let i = 0; i < BLOCK; i++) {
        const at = done + i - (total - kept.length)
        if (at >= 0) kept[at] = out[i]
      }
    }
    return { device, kept, meter: (index: number) => device.device.device_meter?.(index) ?? NaN }
  }

  it('does to small tones beside a loud one what the curve says, at three settings', async () => {
    // The ceiling takes its measure from the loud tone, far under the
    // resonance, so the small ones get the whole of the lift: the curve.
    const rootHz = singerRootHz(0, 3)
    for (const values of [
      { focus: 0.6, drone: 1, mix: 1 },
      { focus: 0.2, drone: 0.5, mix: 1 },
      { focus: 0.8, drone: 0.3, mix: 0.4 },
    ]) {
      const probes = [2.5, 7, 7.6, 7.9, 8, 8.1, 8.5, 9, 12.3].map((harmonic) => harmonic * rootHz)
      const { kept } = await rendered(
        { root: 0, octave: 3, low: 8, high: 8, pattern: 5, ...values },
        (n) => {
          const t = n / RATE
          let sum = 0.4 * Math.sin(2 * Math.PI * 0.283 * rootHz * t)
          for (let p = 0; p < probes.length; p++)
            sum += 1e-4 * Math.sin(2 * Math.PI * probes[p] * t + 1.3 * p)
          return sum
        },
        1.6,
        0.8,
      )
      const curve = singerDb(values, rootHz, 8, RATE)
      for (const hz of probes) {
        const measured = 20 * Math.log10(toneLevel(kept, hz) / 1e-4)
        expect(
          Math.abs(measured - curve(hz)),
          `${JSON.stringify(values)} at ${(hz / rootHz).toFixed(2)}: ${measured} against ${curve(hz)}`,
        ).toBeLessThan(0.15)
      }
    }
  })

  it('reads where the two sides stand and where they go, and the curve drawn of it stands there', async () => {
    // A move every half second, a tenth of a second long; the right side half a step behind.
    const values = { pace: 2, glide: 100, spread: 0.5, low: 6, high: 9 }
    const seen: number[][] = []
    const device = await loadWasmDevice(ID, RATE)
    for (const [name, value] of Object.entries(values)) device.set(params[name], value)
    const block = new Float32Array(BLOCK)
    for (let done = 0; done < RATE * 1.3; done += BLOCK) {
      for (let i = 0; i < BLOCK; i++)
        block[i] = 0.1 * Math.sin((2 * Math.PI * 220 * (done + i)) / RATE)
      device.processBlock(block)
      seen.push([0, 1, 2].map((index) => device.device.device_meter?.(index) ?? NaN))
    }
    const at = (seconds: number): number[] => seen[Math.round((seconds * RATE) / BLOCK)]
    expect(at(0.4)).toEqual([6, 6, 6])
    // Half way through the left side's glide: between the two, on its way to 7.
    const [gliding, behind, target] = at(0.55)
    expect(gliding).toBeGreaterThan(6.2)
    expect(gliding).toBeLessThan(6.8)
    expect(behind).toBe(6)
    expect(target).toBe(7)
    expect(at(0.7)).toEqual([7, 6, 7])
    expect(at(0.9)).toEqual([7, 7, 7])
    expect(at(1.2)).toEqual([8, 7, 8])
    const drawn = running({ harmonic: gliding, harmonicRight: behind, target, ceiling: 0 }, values)
    expect(topOf(mainCurve(drawn))[0]).toBeCloseTo(xOfHarmonic(gliding, plot), 9)
    expect(topOf(backCurves(drawn)[0])[0]).toBeCloseTo(xOfHarmonic(6, plot), 9)
    expect(targetMarks(drawn)[0][0][0]).toBeCloseTo(xOfHarmonic(7, plot), 9)
  })

  it('holds a loud tone on the resonance as far as the ceiling reading says, and the curve is drawn that far down', async () => {
    const rootHz = singerRootHz(0, 3)
    for (const drone of [0, 1]) {
      const values = { root: 0, octave: 3, low: 8, high: 8, pattern: 5, focus: 0.8, drone }
      const { kept, meter } = await rendered(
        values,
        (n) => 0.5 * Math.sin((2 * Math.PI * 8 * rootHz * n) / RATE),
        1.5,
        0.5,
      )
      const reading = meter(3)
      // The whole lift would be 33 dB; the ceiling takes nearly all of it.
      expect(reading).toBeLessThan(-25)
      const measured = 20 * Math.log10(toneLevel(kept, 8 * rootHz) / 0.5)
      const drawn = running(readings(8, { ceiling: reading }), values)
      expect(Math.abs(dbAtY(topOf(mainCurve(drawn))[1]) - measured), `Drone ${drone}`).toBeLessThan(
        0.2,
      )
      // The resonant part is held to the input's own level, less half of what Drone leaves.
      expect(measured).toBeCloseTo(20 * Math.log10(1 + 0.5 * drone * drone), 0)
    }
  })
})
