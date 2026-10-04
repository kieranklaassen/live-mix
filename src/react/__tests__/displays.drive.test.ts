// The drive displays against their devices: each curve and each tone against
// numbers worked out from the device's source, and against the device itself
// (its .wasm, played a tone), since a curve that is nearly right would pass
// for right on a plate.

import { describe, expect, it } from 'vitest'

import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import {
  DRIVE_FACES,
  analogDriveCurve,
  analogDriveTone,
  reAmpCurve,
  reAmpTone,
  saturatorCurve,
  saturatorShape,
  saturatorTone,
} from '../components/displays/drive'
import { type DisplayView } from '../components/plate-display'
import {
  drawDisplay,
  runDisplay,
  stockDescriptors,
  testLevel,
  testSignal,
  viewOf,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const RATE = 48000

type Values = Readonly<Record<string, number>>

function paramsOf(id: string) {
  const descriptor = stock.get(id)
  if (!descriptor) throw new Error(`${id} is not a stock device`)
  return descriptor.params
}

const displayOf = (id: string) => DRIVE_FACES[id].display
const view = (id: string, values: Values = {}): DisplayView =>
  viewOf(displayOf(id), paramsOf(id), { values })

const gainOf = (db: number): number => Math.pow(10, db / 20)
const dbOf = (gain: number): number => 20 * Math.log10(gain)
/** The slope of a curve where the sound is quiet, in dB. */
const slopeDb = (out: (x: number) => number): number => dbOf((out(1e-4) - out(-1e-4)) / 2e-4)

// --- The devices themselves ---------------------------------------------------

async function device(id: string, values: Values): Promise<WasmDeviceHarness> {
  const loaded = await loadWasmDevice(id, RATE)
  const params = paramsOf(id)
  for (const [name, value] of Object.entries(values)) loaded.set(params[name], value)
  return loaded
}

/** Play a sine through a device; what went in and what came out over the last `keep` seconds. */
function play(loaded: WasmDeviceHarness, hz: number, gain: number, seconds: number, keep: number) {
  const total = Math.floor(seconds * RATE)
  const from = total - Math.floor(keep * RATE)
  const input: number[] = []
  const output: number[] = []
  const block = new Float32Array(128)
  for (let done = 0; done < total; done += 128) {
    for (let i = 0; i < 128; i++) block[i] = gain * Math.sin((2 * Math.PI * hz * (done + i)) / RATE)
    loaded.processBlock(block)
    const out = loaded.view(loaded.device.device_out_left(), 128)
    for (let i = 0; i < 128; i++) {
      if (done + i < from) continue
      input.push(block[i])
      output.push(out[i])
    }
  }
  return { input, output }
}

const rms = (wave: readonly number[]): number =>
  Math.sqrt(wave.reduce((sum, sample) => sum + sample * sample, 0) / wave.length)
const span = (wave: readonly number[]): number => Math.max(...wave) - Math.min(...wave)
const meterOf = (loaded: WasmDeviceHarness, index: number): number => {
  const read = loaded.device.device_meter
  if (!read) throw new Error('the device has no readings')
  return read(index)
}
/** What a device does to a quiet tone, in dB. */
async function quietGainDb(id: string, values: Values, hz: number): Promise<number> {
  const { input, output } = play(await device(id, values), hz, 0.001, 0.6, 0.2)
  return dbOf(rms(output) / rms(input))
}

// --- What was drawn -----------------------------------------------------------

interface DrawnPath {
  points: [number, number][]
  how: 'stroke' | 'fill'
  colour: string
  width: number
  dashed: boolean
}

/** Every path a display stroked or filled, with the ink it was drawn in. */
function pathsOf(drawn: RecordingContext): DrawnPath[] {
  const paths: DrawnPath[] = []
  let points: [number, number][] = []
  let stroke = ''
  let fill = ''
  let width = 1
  let dashed = false
  for (const { name, args } of drawn.calls) {
    if (name === 'beginPath') points = []
    else if (name === 'moveTo' || name === 'lineTo') points.push([Number(args[0]), Number(args[1])])
    else if (name === 'set strokeStyle') stroke = String(args[0])
    else if (name === 'set fillStyle') fill = String(args[0])
    else if (name === 'set lineWidth') width = Number(args[0])
    else if (name === 'setLineDash') dashed = (args[0] as unknown[]).length > 0
    else if (name === 'stroke') paths.push({ points, how: 'stroke', colour: stroke, width, dashed })
    else if (name === 'fill') paths.push({ points, how: 'fill', colour: fill, width, dashed })
  }
  return paths
}

/** The scales of the curve's plot, read off the straight line of no change: its two ends are the corners. */
function plotOf(drawn: RecordingContext) {
  const line = pathsOf(drawn).find((path) => path.dashed && path.points.length === 2)
  if (!line) throw new Error('no straight line of no change was drawn')
  const [[left, foot], [right, top]] = line.points
  return {
    left,
    right,
    top,
    foot,
    x: (level: number) => left + ((level + 1) / 2) * (right - left),
    y: (level: number) => foot + ((level + 1) / 2) * (top - foot),
    level: (x: number) => ((x - left) / (right - left)) * 2 - 1,
  }
}

/** The curve as it was drawn: the one long line in the ink. */
function curveOf(drawn: RecordingContext): [number, number][] {
  const curve = pathsOf(drawn).find(
    (path) => path.how === 'stroke' && path.colour === 'CanvasText' && path.points.length > 200,
  )
  if (!curve) throw new Error('no curve was drawn')
  return curve.points
}

/** The mark of the level: the dot on the curve, and the bar along the input axis. */
function markOf(drawn: RecordingContext) {
  const dot = drawn.calls.find((call) => call.name === 'arc' && call.args[2] === 2.5)
  let accent = false
  let bar: number[] | null = null
  for (const { name, args } of drawn.calls) {
    if (name === 'set fillStyle') accent = args[0] === 'Highlight'
    if (name === 'fillRect' && accent) bar = args.map(Number)
  }
  return { dot: dot ? [Number(dot.args[0]), Number(dot.args[1])] : null, bar }
}

const usesAccent = (drawn: RecordingContext): boolean =>
  drawn.calls.some((call) => call.name.startsWith('set ') && call.args[0] === 'Highlight')

// --- Saturator ----------------------------------------------------------------

describe('the display of saturator', () => {
  const out = (values: Values) => saturatorCurve(view('saturator', values))

  it('has the five curves of Waveshapers.h', () => {
    // Soft: tanh. Drive 6 dB is a gain of 1.9953, so half scale goes in at 0.9976.
    expect(out({ curve: 0, driveDb: 6 })(0.5)).toBeCloseTo(Math.tanh(0.99763), 4)
    expect(out({ curve: 0, driveDb: 6 })(0.5)).toBeCloseTo(0.7606, 3)
    // Hard: a clip. 18 dB is 7.943: a tenth of full scale is still on the slope, a fifth is on the ceiling.
    expect(out({ curve: 1, driveDb: 18 })(0.1)).toBeCloseTo(0.7943, 3)
    expect(out({ curve: 1, driveDb: 18 })(0.2)).toBe(1)
    expect(out({ curve: 1, driveDb: 18 })(-0.2)).toBe(-1)
    // Tube: the lower half lands at −1 / 1.5, the upper at 1.
    expect(out({ curve: 2, driveDb: 36 })(1)).toBeCloseTo(1, 4)
    expect(out({ curve: 2, driveDb: 36 })(-1)).toBeCloseTo(-2 / 3, 4)
    // Tape: x / √(1 + x²).
    expect(out({ curve: 3, driveDb: 0 })(1)).toBeCloseTo(Math.SQRT1_2, 5)
    // Fold: twice full scale comes back to zero, one and a half times to a half.
    expect(out({ curve: 4, driveDb: 6.0206 })(1)).toBeCloseTo(0, 3)
    expect(out({ curve: 4, driveDb: 6.0206 })(0.75)).toBeCloseTo(0.5, 3)
    expect(out({ curve: 4, driveDb: 0 })(1)).toBeCloseTo(1, 5)
  })

  it('passes silence as silence at any bias, and leans with it', () => {
    for (const curve of [0, 1, 2, 3, 4]) {
      for (const bias of [-1, -0.3, 0.5, 1]) {
        expect(out({ curve, bias, driveDb: 12 })(0)).toBeCloseTo(0, 9)
      }
    }
    // tanh(1.5) − tanh(0.5) up, tanh(−0.5) − tanh(0.5) down.
    const biased = out({ curve: 0, driveDb: 0, bias: 0.5 })
    expect(biased(1)).toBeCloseTo(0.90515 - 0.46212, 4)
    expect(biased(-1)).toBeCloseTo(-2 * 0.46212, 4)
  })

  it('has Output behind the curve and the clean signal beside it', () => {
    expect(out({ curve: 1, driveDb: 18, outputDb: -6.0206 })(0.5)).toBeCloseTo(0.5, 4)
    expect(out({ curve: 1, driveDb: 18, mix: 0.5 })(0.5)).toBeCloseTo(0.75, 6)
    expect(out({ curve: 1, driveDb: 18, mix: 0 })(0.3)).toBeCloseTo(0.3, 9)
  })

  it('is the device: at 1x, where the output is the curve exactly, every sample is on it', async () => {
    for (const curve of [0, 1, 2, 3, 4]) {
      // Tape has a high cut after the curve, so it is asked at a low note.
      const values = { curve, driveDb: 12, bias: 0.3, outputDb: -6, mix: 0.8, toneDb: 0 }
      const off = { ...values, oversample: 0, dcBlock: 0, adaa: 0 }
      const { input, output } = play(
        await device('saturator', off),
        curve === 3 ? 30 : 220,
        0.9,
        0.3,
        0.1,
      )
      const expected = out(values)
      let worst = 0
      // The device is 39 samples late.
      for (let i = 39; i < input.length; i++) {
        worst = Math.max(worst, Math.abs(output[i] - expected(input[i - 39])))
      }
      expect(worst, `curve ${curve}`).toBeLessThan(curve === 3 ? 0.01 : 1e-5)
    }
  })

  it('tilts about 1 kHz, and Tape closes its top as Drive goes up', () => {
    const tone = saturatorTone(view('saturator', { toneDb: 12 }), RATE)
    expect(tone(1000)).toBeCloseTo(0, 2)
    expect(tone(20)).toBeCloseTo(-12, 1)
    expect(Math.abs(tone(20000) - 12)).toBeLessThan(0.3)
    expect(saturatorTone(view('saturator', { toneDb: 0 }), RATE)(5000)).toBeCloseTo(0, 6)
    // The Tape curve's high cut: 16 kHz with no drive, 6 kHz at full, 3 dB down at its corner.
    const tape = (driveDb: number, hz: number) =>
      saturatorTone(view('saturator', { curve: 3, driveDb }), RATE)(hz)
    expect(Math.abs(tape(36, 6000) + 3)).toBeLessThan(0.4)
    expect(tape(0, 6000)).toBeGreaterThan(-1)
    expect(tape(36, 100)).toBeCloseTo(0, 1)
    // No other curve has it.
    expect(saturatorTone(view('saturator', { curve: 0, driveDb: 36 }), RATE)(6000)).toBeCloseTo(
      0,
      6,
    )
  })

  it('draws that curve, up for more, on scales from minus to plus full scale', () => {
    const settings: Values[] = [
      { curve: 1, driveDb: 18 },
      { curve: 2, driveDb: 12, bias: 0.3, outputDb: -6 },
      { curve: 4, driveDb: 16, bias: 0.15, outputDb: -10 },
    ]
    for (const values of settings) {
      const drawn = drawDisplay(displayOf('saturator'), paramsOf('saturator'), { values })
      const plot = plotOf(drawn)
      expect(plot.right).toBeGreaterThan(plot.left)
      expect(plot.top).toBeLessThan(plot.foot)
      const expected = out(values)
      const curve = curveOf(drawn)
      expect(plot.level(curve[0][0])).toBeCloseTo(-1, 6)
      expect(plot.level(curve[curve.length - 1][0])).toBeCloseTo(1, 6)
      for (const [x, y] of curve) expect(y).toBeCloseTo(plot.y(expected(plot.level(x))), 4)
    }
  })

  it('draws a hard clip and a tube as differently as they sound', () => {
    const drawnAt = (curve: number) => {
      const drawn = drawDisplay(displayOf('saturator'), paramsOf('saturator'), {
        values: { curve, driveDb: 12 },
      })
      return { plot: plotOf(drawn), points: curveOf(drawn) }
    }
    const hard = drawnAt(1)
    const tube = drawnAt(2)
    const at = (points: [number, number][], plot: ReturnType<typeof plotOf>, level: number) =>
      points.reduce((best, point) =>
        Math.abs(plot.level(point[0]) - level) < Math.abs(plot.level(best[0]) - level)
          ? point
          : best,
      )[1]
    // The clip is flat from a quarter of full scale out and the same both ways...
    expect(at(hard.points, hard.plot, 0.3)).toBe(at(hard.points, hard.plot, 0.9))
    expect(at(hard.points, hard.plot, 0.5) - hard.plot.y(0)).toBeCloseTo(
      hard.plot.y(0) - at(hard.points, hard.plot, -0.5),
      6,
    )
    // ...the tube still rises there, and its lower half stops a third short.
    expect(at(tube.points, tube.plot, 0.3)).toBeGreaterThan(at(tube.points, tube.plot, 0.9) + 1)
    const pixel = hard.plot.y(0) - hard.plot.y(1)
    expect(at(tube.points, tube.plot, -1) - tube.plot.y(0)).toBeCloseTo(pixel * (2 / 3), 0)
    expect(tube.plot.y(0) - at(tube.points, tube.plot, 1)).toBeCloseTo(pixel, 0)
  })

  it('marks the level going in on the curve, and nothing while there is no sound', () => {
    const values = { curve: 0, driveDb: 12 }
    const display = displayOf('saturator')
    const params = paramsOf('saturator')
    const running = runDisplay(display, params, 0.3, { values, signal: testSignal(0.5, 0.4) })
    const plot = plotOf(running)
    const { dot, bar } = markOf(running)
    expect(dot?.[0]).toBeCloseTo(plot.x(0.5), 4)
    expect(dot?.[1]).toBeCloseTo(plot.y(out(values)(0.5)), 4)
    // The bar runs from the peak below zero to the peak above it.
    expect(bar?.[0]).toBeCloseTo(plot.x(-0.5), 4)
    expect(bar?.[2]).toBeCloseTo(plot.x(0.5) - plot.x(-0.5), 4)

    const still = drawDisplay(display, params, { values })
    expect(markOf(still).dot).toBeNull()
    expect(usesAccent(still)).toBe(false)
    expect(usesAccent(drawDisplay(display, params, { values, powered: false }))).toBe(false)
    const silent = runDisplay(display, params, 0.3, { values, signal: testSignal(0, 0) })
    expect(markOf(silent).dot).toBeNull()
    // Not told what feeds it, the Saturator has nothing to place the mark by: the wave is still drawn.
    const untold = { ...testSignal(0.5, 0.4), input: null }
    const alone = runDisplay(display, params, 0.3, { values, signal: untold })
    expect(markOf(alone).dot).toBeNull()
    expect(alone.calls.length).toBeGreaterThan(still.calls.length)
  })

  it('lets the mark sink back when the sound stops', () => {
    const state = displayOf('saturator').init?.()
    const params = paramsOf('saturator')
    runDisplay(displayOf('saturator'), params, 0.2, { state, signal: testSignal(0.8, 0.5) })
    const quiet = { state, signal: testSignal(0, 0), now: 20 }
    const soon = runDisplay(displayOf('saturator'), params, 0.1, quiet)
    const plot = plotOf(soon)
    const dot = markOf(soon).dot
    expect(dot?.[0]).toBeGreaterThan(plot.x(0.2))
    expect(dot?.[0]).toBeLessThan(plot.x(0.8))
    const later = runDisplay(displayOf('saturator'), params, 3, { ...quiet, now: 21 })
    expect(markOf(later).dot).toBeNull()
  })

  it('has a Drive point on the curve that goes left for more, and a Bias point at its middle', () => {
    const handlesAt = (values: Values) => {
      const drawn = drawDisplay(displayOf('saturator'), paramsOf('saturator'), { values })
      const handles = displayOf('saturator').handles?.(view('saturator', values)) ?? []
      return { plot: plotOf(drawn), handles: Object.fromEntries(handles.map((h) => [h.key, h])) }
    }
    const low = handlesAt({ driveDb: 6 })
    const high = handlesAt({ driveDb: 30 })
    expect(high.handles.drive.x).toBeLessThan(low.handles.drive.x - 20)
    // On the curve.
    const where = low.plot.level(low.handles.drive.x)
    expect(low.handles.drive.y).toBeCloseTo(low.plot.y(out({ driveDb: 6 })(where)), 4)
    // The ends of its travel are the ends of Drive.
    expect(low.handles.drive.drag(low.plot.right, 0).driveDb).toBe(0)
    expect(low.handles.drive.drag(low.plot.x(0), 0).driveDb).toBe(36)
    // A pixel is under a decibel.
    const step =
      low.handles.drive.drag(low.handles.drive.x - 1, 0).driveDb -
      low.handles.drive.drag(low.handles.drive.x, 0).driveDb
    expect(step).toBeGreaterThan(0.3)
    expect(step).toBeLessThan(1)

    // Bias: at the origin when there is none, on the curve where its middle has gone when there is.
    expect(low.handles.bias.x).toBeCloseTo(low.plot.x(0), 6)
    expect(low.handles.bias.y).toBeCloseTo(low.plot.y(0), 6)
    for (const curve of [0, 1, 2, 3, 4]) {
      for (const bias of [-0.8, -0.25, 0.4, 1]) {
        const values = { curve, bias, driveDb: 12 }
        const { plot, handles } = handlesAt(values)
        const middle = -bias / gainOf(12)
        expect(plot.level(handles.bias.x)).toBeCloseTo(middle, 6)
        expect(handles.bias.y).toBeCloseTo(plot.y(out(values)(middle)), 4)
        expect(out(values)(middle)).toBeCloseTo(-saturatorShape(curve, bias), 6)
        // Taken and not moved it stays; a double press takes the bias off.
        expect(handles.bias.drag(handles.bias.x, handles.bias.y).bias).toBeCloseTo(bias, 3)
        expect(handles.bias.reset?.()).toEqual({ bias: 0 })
      }
    }
    // Down is more bias, up is less.
    expect(low.handles.bias.drag(0, low.plot.y(-0.3)).bias).toBeGreaterThan(0.2)
    expect(low.handles.bias.drag(0, low.plot.y(0.3)).bias).toBeLessThan(-0.2)
    // With Output down the point keeps half its travel, so it can still be set by hand.
    const quiet = handlesAt({ bias: 0.5, outputDb: -18 })
    expect(quiet.handles.bias.y - quiet.plot.y(0)).toBeCloseTo(
      (quiet.plot.y(0) - quiet.plot.y(1)) * Math.tanh(0.5) * 0.5,
      4,
    )
    expect(quiet.handles.bias.drag(0, quiet.handles.bias.y).bias).toBeCloseTo(0.5, 3)
  })
})

// --- Analog Drive -------------------------------------------------------------

describe('the display of analog-drive', () => {
  const CIRCUITS = [0, 1, 2, 3, 4]
  const out = (values: Values, arriving = 0, envelope = 0) =>
    analogDriveCurve(view('analog-drive', values), arriving, envelope)
  const tone = (values: Values) => analogDriveTone(view('analog-drive', values), RATE)

  it('is clean at Drive 0 and lands on the ceiling of its circuit at Drive 1', () => {
    for (const circuit of CIRCUITS) {
      // Full scale is a quarter of the way to the ceiling and the make-up gives the 12 dB back.
      expect(Math.abs(slopeDb(out({ circuit, drive: 0 })))).toBeLessThan(1)
      expect(out({ circuit, drive: 0 })(0)).toBeCloseTo(0, 9)
    }
    // Pentode, Push on: 0.35 firm landing on 0.75 and 0.65 hard on 0.55 make a ceiling of 0.62
    // either way; the working point is 0.02 + 0.02 × 1, where the curve still has unit slope;
    // the make-up at the top of the pushed table is −14.40 dB.
    const pentode = out({ circuit: 4, drive: 1, push: 1 })
    expect(pentode(1)).toBeCloseTo((0.62 - 0.04) * gainOf(-14.4), 3)
    expect(pentode(-1)).toBeCloseTo((-0.62 - 0.04) * gainOf(-14.4), 3)
    // Tape preamp, Auto Gain off: the soft knee tends to 1 above and −1 / 1.3 below, about a
    // working point of 0.05 + 0.08, behind 12.61 − 12.04 dB: a ceiling that ends at full scale.
    const tape = out({ circuit: 0, drive: 1, autoGain: 0 })
    expect(tape(1)).toBeGreaterThan(0.9)
    expect(tape(1)).toBeLessThan(1)
    expect(tape(-1) / tape(1)).toBeCloseTo((-1 / 1.3 - 0.13) / (1 - 0.13), 1)
  })

  it('has the taper of Drive: 23 dB up at 0.3, 31 dB at 0.5, 42 dB at 1, and 20 dB more with Push', () => {
    // The console has no sag and next to no bias, so with Auto Gain off the slope is the gain
    // less the headroom given back: 12.05 dB at Drive 0, 12.04 dB × the taper less after it.
    const gainDb = (drive: number, push = 0) =>
      slopeDb(out({ circuit: 1, drive, push, autoGain: 0 })) -
      slopeDb(out({ circuit: 1, drive: 0, autoGain: 0 }))
    const taper = (knob: number) => Math.log1p(8 * knob) / Math.log(9)
    for (const [knob, up] of [
      [0.3, 23.4],
      [0.5, 30.8],
      [1, 42],
    ]) {
      expect(42 * taper(knob)).toBeCloseTo(up, 1)
      expect(gainDb(knob)).toBeCloseTo(up - 12.04 * taper(knob), 1)
    }
    // Push is ten times into the curve, taken back out after it by the two tables' difference.
    expect(gainDb(0.3, 1) - gainDb(0.3)).toBeCloseTo(
      20 + (-15.27 - -8.57) + 0.37 * (-15.97 - -15.27 - (-11.17 - -8.57)),
      0,
    )
  })

  it('moves with the readings: the triode leans as the level rises, the pentode sags', () => {
    // Triode: the working point goes from 0.14 + 0.15 d towards 1.2 more as the level arriving
    // passes its knee of 1.5, so the upper half lands sooner and the lower later.
    const triode = { circuit: 3, drive: 0.5 }
    expect(out(triode, 1.5)(1)).toBeLessThan(out(triode)(1) * 0.75)
    expect(out(triode, 1.5)(-1)).toBeLessThan(out(triode)(-1) * 1.2)
    // Pentode: the gain falls to 1 / 1.5 with the level leaving at the ceiling.
    const pentode = { circuit: 4, drive: 0.3 }
    expect(slopeDb(out(pentode, 0, 1)) - slopeDb(out(pentode))).toBeCloseTo(dbOf(1 / 1.5), 2)
    // The console does neither.
    expect(out({ circuit: 1 }, 2, 1)(0.4)).toBe(out({ circuit: 1 })(0.4))
  })

  it('is the device for a quiet sound: every circuit, across the range, with the filters in and out', async () => {
    const settings: Values[] = [
      {},
      { lowCut: 200, lowBump: 0.7, tone: 0.5, highCut: 5000, drive: 0.6 },
    ]
    for (const circuit of CIRCUITS) {
      for (const extra of settings) {
        const values = { circuit, ...extra }
        const model = slopeDb(out(values))
        const { net } = tone(values)
        for (const hz of [60, 300, 1000, 8000]) {
          const heard = await quietGainDb('analog-drive', values, hz)
          expect(
            Math.abs(heard - (model + net(hz))),
            `circuit ${circuit} at ${hz} Hz`,
          ).toBeLessThan(0.2)
        }
      }
    }
  })

  it('is the device for a loud sound, with the device reading where its circuit stands', async () => {
    for (const circuit of CIRCUITS) {
      const values = { circuit, drive: 0.3 }
      const loaded = await device('analog-drive', values)
      const { output } = play(loaded, 1000, 0.3, 1.5, 0.2)
      const arriving = meterOf(loaded, 0)
      const envelope = meterOf(loaded, 1)
      // The filters around the curve cannot be on it: at 1 kHz they are taken as plain gains.
      const { into, net } = tone(values)
      const before = gainOf(into(1000))
      const after = gainOf(net(1000) - into(1000))
      const curve = out(values, arriving, envelope)
      const expected = (curve(0.3 * before) - curve(-0.3 * before)) * after
      expect(Math.abs(span(output) / expected - 1), `circuit ${circuit}`).toBeLessThan(0.04)

      // The first reading is the level arriving at the curve, sag and all: a follower on a
      // sine settles a little under its peak. Without the sag the pentode would read 0.65.
      const sag = [0.2, 0, 0.08, 0, 0.5][circuit]
      const gain = (0.25 * gainOf(42 * (Math.log1p(8 * 0.3) / Math.log(9)))) / (1 + sag * envelope)
      const peak = gain * 0.3 * before
      expect(arriving / peak, `circuit ${circuit} arriving`).toBeGreaterThan(0.78)
      expect(arriving / peak, `circuit ${circuit} arriving`).toBeLessThan(0.92)
      // The second is the level leaving it: under the curve's ceiling, over half of it here.
      expect(envelope).toBeGreaterThan(0.5)
      expect(envelope).toBeLessThan(1)
    }
  })

  it('has the tone the device measures on itself', () => {
    // Each against the same circuit with the control at rest; the figures are the ones the
    // device's own harness (cpp/test/analog_drive_test.cpp) prints.
    const flat = tone({}).net
    const less = (values: Values, hz: number) => tone(values).net(hz) - flat(hz)
    expect(less({ lowCut: 200 }, 50)).toBeCloseTo(-24.1, 0)
    expect(less({ lowCut: 200 }, 200)).toBeCloseTo(-3, 1)
    expect(less({ lowCut: 200 }, 2000)).toBeCloseTo(0, 1)
    expect(less({ lowCut: 100, lowBump: 1 }, 160) - less({ lowCut: 100 }, 160)).toBeCloseTo(9, 1)
    expect(less({ lowBump: 1 }, 60)).toBeCloseTo(9, 1)
    expect(less({ tone: 1 }, 60)).toBeCloseTo(-5.9, 1)
    expect(less({ tone: 1 }, 800)).toBeCloseTo(0, 2)
    expect(less({ tone: 1 }, 12000)).toBeCloseTo(6, 1)
    expect(less({ tone: -1 }, 12000)).toBeCloseTo(-6, 1)
    expect(less({ highCut: 2000 }, 500)).toBeCloseTo(0, 1)
    expect(less({ highCut: 2000 }, 2000)).toBeCloseTo(-3, 1)
    expect(less({ highCut: 2000 }, 8000)).toBeCloseTo(-51.4, 0)
    // Both cuts are out of the path at the ends of their travel.
    expect(less({ lowCut: 20, highCut: 20000 }, 25)).toBe(0)
    // What reaches the curve: the transformer sees its lows 8.5 dB up, the tape preamp its treble 8.
    expect(tone({ circuit: 2 }).into(30)).toBeCloseTo(8.5, 0)
    expect(tone({ circuit: 2 }).into(5000)).toBeCloseTo(0, 1)
    expect(tone({ circuit: 0 }).into(15000)).toBeCloseTo(8, 0)
    // And the voicing each circuit is left with, against 500 Hz: what a quiet tone through a
    // new device measures (the 100 and 240 Hz figures quoted in circuits.h are not against
    // 500 Hz, the 2, 4 and 8 kHz ones are).
    const voice = (circuit: number, hz: number) =>
      tone({ circuit }).net(hz) - tone({ circuit }).net(500)
    const voicing: [number, number, number][] = [
      [0, 100, 1.2],
      [0, 8000, -2.4],
      [1, 2000, 1.6],
      [2, 240, 1.7],
      [3, 8000, 0.9],
      [4, 100, -2.0],
      [4, 2000, 2.2],
    ]
    for (const [circuit, hz, db] of voicing) {
      expect(Math.abs(voice(circuit, hz) - db), `circuit ${circuit} at ${hz} Hz`).toBeLessThan(0.1)
    }
  })

  it('places the mark by the level going in, and by its own reading when it was not told what feeds it', () => {
    const display = displayOf('analog-drive')
    const params = paramsOf('analog-drive')
    const meters = { arriving: 1, envelope: 0.5 }
    const told = runDisplay(display, params, 0.3, { meters, signal: testSignal(0.4, 0.3) })
    expect(markOf(told).dot?.[0]).toBeCloseTo(plotOf(told).x(0.4), 4)
    expect(markOf(told).dot?.[1]).toBeCloseTo(plotOf(told).y(out({}, 1, 0.5)(0.4)), 4)
    // Tape preamp at Drive 0.3: 0.25 × 23.39 dB = 3.695 into the curve, less a sag of 0.2 × 0.5.
    // A level of 1 arriving there went in at 1 / 3.359.
    const untold = { ...testSignal(0.4, 0.3), input: null }
    const alone = runDisplay(display, params, 0.3, { meters, signal: untold })
    expect(plotOf(alone).level(markOf(alone).dot?.[0] ?? 0)).toBeCloseTo(1 / 3.359, 3)
    // The curve drawn is the one at those readings, and the one at rest when there is no sound.
    const drawnAt = (drawn: RecordingContext, curve: (x: number) => number) => {
      const plot = plotOf(drawn)
      for (const [x, y] of curveOf(drawn)) expect(y).toBeCloseTo(plot.y(curve(plot.level(x))), 4)
    }
    const triode = { circuit: 3, drive: 0.5 }
    const sounding = {
      values: triode,
      meters: { arriving: 1.5, envelope: 0.8 },
      signal: testSignal(),
    }
    drawnAt(runDisplay(display, params, 0.1, sounding), out(triode, 1.5, 0.8))
    drawnAt(drawDisplay(display, params, { values: triode, meters: sounding.meters }), out(triode))
    expect(out(triode, 1.5, 0.8)(0.5)).not.toBeCloseTo(out(triode)(0.5), 2)
    // A device without the readings (a host that does not pass them on) is drawn at rest.
    drawnAt(runDisplay(display, params, 0.1, { values: triode, signal: testSignal() }), out(triode))
  })

  it('has a point for Drive and one for each cut on the tone', () => {
    const handles = Object.fromEntries(
      (displayOf('analog-drive').handles?.(view('analog-drive')) ?? []).map((h) => [h.key, h]),
    )
    expect(Object.keys(handles)).toEqual(['drive', 'lowCut', 'highCut'])
    const { lowCut, highCut, drive } = handles
    // Out of the path they stand at the two ends of the strip; a decade is a third of the way.
    const decade = (highCut.x - lowCut.x) / 3
    expect(lowCut.drag(lowCut.x + decade, 0).lowCut).toBeCloseTo(200, 0)
    expect(highCut.drag(highCut.x - decade / 2, 0).highCut).toBeCloseTo(20000 / Math.sqrt(10), 0)
    // Each keeps to its own range.
    expect(lowCut.drag(highCut.x, 0).lowCut).toBe(1000)
    expect(highCut.drag(lowCut.x, 0).highCut).toBe(1000)
    expect(lowCut.reset?.()).toEqual({ lowCut: 20 })
    expect(highCut.reset?.()).toEqual({ highCut: 20000 })
    expect(drive.drag(drive.x - 12, 0).drive).toBeCloseTo(0.5, 1)
  })
})

// --- Re-amp -------------------------------------------------------------------

describe('the display of re-amp', () => {
  const out = (values: Values, load = 0) => reAmpCurve(view('re-amp', values), load)
  const tone = (values: Values) => reAmpTone(view('re-amp', values), RATE)

  it('has the valve of re_amp.h at its bias, level held', () => {
    // Drive 0.25: gain 0.5 × 2^1.25 = 1.189, bias 0.12 + 0.05 = 0.17, and a level of
    // √(1 + (0.18 × 1.189)²) × (1 + 0.17²)^1.5 / 1.189 = 0.898 on u / √(1 + u²) less its value at the bias.
    const s = (u: number) => u / Math.sqrt(1 + u * u)
    const curve = out({ drive: 0.25 })
    expect(curve(1)).toBeCloseTo(0.898 * (s(1.189 + 0.17) - s(0.17)), 3)
    expect(curve(1)).toBeCloseTo(0.572, 2)
    expect(curve(-1)).toBeCloseTo(0.898 * (s(-1.189 + 0.17) - s(0.17)), 3)
    expect(curve(0)).toBeCloseTo(0, 9)
    // Clean at Drive 0 and at any Drive for a quiet sound: √(1 + (0.18 g)²) is all that is added.
    expect(slopeDb(out({ drive: 0 }))).toBeCloseTo(dbOf(Math.sqrt(1 + 0.09 * 0.09)), 2)
    expect(slopeDb(out({ drive: 1 }))).toBeCloseTo(dbOf(0.875 * Math.sqrt(1 + 2.88 * 2.88)), 2)
    // Output and Mix.
    expect(out({ drive: 0.25, output: -6.0206 })(1)).toBeCloseTo(curve(1) / 2, 4)
    expect(out({ drive: 0.25, mix: 0.5 })(1)).toBeCloseTo((1 + curve(1)) / 2, 6)
  })

  it('gives under load: up to 35 % off the gain and 20 % off the ceiling', () => {
    // A load of 2 is half the droop: load² / (load² + 4).
    const rested = out({ drive: 0.5 })
    const loaded = out({ drive: 0.5 }, 2)
    expect(slopeDb(loaded) - slopeDb(rested)).toBeCloseTo(dbOf((1 - 0.175) * (1 - 0.1)), 2)
    const flatOut = out({ drive: 1 })
    expect(out({ drive: 1 }, 1e6)(1) / flatOut(1)).toBeCloseTo(0.8, 1)
  })

  it('is the device for a quiet sound: every speaker with the amplifier and the microphone set', async () => {
    for (const speaker of [0, 1, 2, 3, 4]) {
      const values = { speaker, distance: 0, angle: 0.5, noise: 0, bass: 0.4, treble: -0.3 }
      const model = slopeDb(out(values))
      const { direct } = tone(values)
      for (const hz of [100, 1000, 2500, 5000]) {
        const heard = await quietGainDb('re-amp', values, hz)
        expect(
          Math.abs(heard - (model + direct(hz))),
          `speaker ${speaker} at ${hz} Hz`,
        ).toBeLessThan(0.1)
      }
    }
  })

  it('is the device for a loud sound, with the device reading its load', async () => {
    for (const [drive, level] of [
      [0.25, 0.5],
      [0.6, 0.5],
      [1, 0.3],
    ]) {
      // The monitor on the cone, so nearly nothing but the amplifier is heard.
      const values = { speaker: 4, distance: 0, angle: 0, noise: 0, drive }
      const loaded = await device('re-amp', values)
      const { output } = play(loaded, 1000, level, 1.5, 0.2)
      const load = meterOf(loaded, 0)
      const through = gainOf(tone(values).direct(1000))
      const curve = out(values, load)
      expect(Math.abs(span(output) / ((curve(level) - curve(-level)) * through) - 1)).toBeLessThan(
        0.03,
      )
      // The reading is the follower on the driven signal: near gain × level for a held note.
      const gain = 0.5 * Math.pow(2, 5 * drive)
      expect(load / (gain * level)).toBeGreaterThan(0.7)
      expect(load / (gain * level)).toBeLessThan(1)
      // At rest the curve is not the device any more once it is pushed.
      if (drive >= 0.6) {
        const rested = out(values)
        expect(
          Math.abs(span(output) / ((rested(level) - rested(-level)) * through) - 1),
        ).toBeGreaterThan(0.08)
      }
    }
  })

  it('shows the speaker as the microphone hears it, and the room coming up behind it', () => {
    // On the cone there is no room, and 3 dB of proximity under 180 Hz.
    const close = tone({ speaker: 4, distance: 0, angle: 0 })
    const back = tone({ speaker: 4, distance: 0.5, angle: 0 })
    expect(close.room(1000)).toBeLessThan(-100)
    expect(
      close.direct(60) - close.direct(1000) - (back.direct(60) - back.direct(1000)),
    ).toBeCloseTo(3, 0)
    // Direct for room at constant power: cos and sin of 1.44 × distance^1.3.
    const theta = 1.44 * Math.pow(0.5, 1.3)
    expect(back.direct(1000) - close.direct(1000)).toBeCloseTo(dbOf(Math.cos(theta)), 2)
    const far = tone({ speaker: 4, distance: 1, angle: 0 })
    expect(far.direct(1000) - close.direct(1000)).toBeCloseTo(dbOf(Math.cos(1.44)), 2)
    expect(far.room(1000)).toBeGreaterThan(far.direct(1000) + 15)
    // Off the axis the top goes: 9 dB of shelf from where the cone beams, and a low-pass closing on it.
    const turned = tone({ speaker: 1, distance: 0.3, angle: 1 })
    const facing = tone({ speaker: 1, distance: 0.3, angle: 0 })
    expect(turned.direct(200)).toBeCloseTo(facing.direct(200), 0)
    expect(turned.direct(3000)).toBeLessThan(facing.direct(3000) - 5)
    expect(turned.room(3000)).toBe(facing.room(3000))
    // The amplifier's Bass and Treble: 10 dB shelves at 160 Hz and 2.8 kHz, ahead of both.
    const lifted = tone({ speaker: 4, bass: 1, treble: -1 })
    const plain = tone({ speaker: 4 })
    expect(lifted.direct(40) - plain.direct(40)).toBeCloseTo(10, 0)
    expect(lifted.room(10000) - plain.room(10000)).toBeCloseTo(-10, 0)
    // The five speakers are not one curve: the horn has no lows, the monitor has them all.
    expect(tone({ speaker: 3 }).direct(100)).toBeLessThan(tone({ speaker: 4 }).direct(100) - 30)
    expect(tone({ speaker: 1 }).direct(8000)).toBeLessThan(tone({ speaker: 4 }).direct(8000) - 20)
  })

  it('draws the curve at the load it reads, and marks the level going in', () => {
    const display = displayOf('re-amp')
    const params = paramsOf('re-amp')
    const values = { drive: 0.6 }
    const running = runDisplay(display, params, 0.3, {
      values,
      meters: { load: 2 },
      signal: testSignal(0.5, 0.3),
    })
    const plot = plotOf(running)
    for (const [x, y] of curveOf(running))
      expect(y).toBeCloseTo(plot.y(out(values, 2)(plot.level(x))), 4)
    expect(markOf(running).dot?.[0]).toBeCloseTo(plot.x(0.5), 4)
    expect(markOf(running).dot?.[1]).toBeCloseTo(plot.y(out(values, 2)(0.5)), 4)
    // Not told what feeds it: the load is gain × level, so the level is the load over the gain of 4.
    const untold = { ...testSignal(0.5, 0.3), input: null }
    const alone = runDisplay(display, params, 0.3, { values, meters: { load: 2 }, signal: untold })
    expect(plotOf(alone).level(markOf(alone).dot?.[0] ?? 0)).toBeCloseTo(
      2 / (0.5 * Math.pow(2, 3)),
      4,
    )
    const still = drawDisplay(display, params, { values, meters: { load: 2 } })
    for (const [x, y] of curveOf(still))
      expect(y).toBeCloseTo(plot.y(out(values)(plot.level(x))), 4)
    expect(usesAccent(still)).toBe(false)
  })
})

// --- The three together ---------------------------------------------------------

describe('the drive displays together', () => {
  it('are windows beside four knobs, each with a Drive point', () => {
    for (const [id, face] of Object.entries(DRIVE_FACES)) {
      expect(face.display.place, id).toBe('window')
      expect(face.display.columns, id).toBe(2)
      expect(face.face?.length, id).toBe(4)
      const handles = face.display.handles?.(view(id)) ?? []
      expect(
        handles.map((handle) => handle.key),
        id,
      ).toContain('drive')
    }
  })

  it('show the wave coming out only while there is one, on the scale of the curve', () => {
    for (const id of Object.keys(DRIVE_FACES)) {
      const display = displayOf(id)
      const params = paramsOf(id)
      const meters = { arriving: 0, envelope: 0, load: 0 }
      // A sine of 0.6 coming out: the filled wave reaches 0.6 of full scale and no further.
      const signal = { ...testSignal(0.5, 0.6), output: testLevel(0.6, 8) }
      const running = runDisplay(display, params, 0.2, { meters, signal })
      const plot = plotOf(running)
      const fills = pathsOf(running).filter(
        (path) => path.how === 'fill' && path.points.length > 40,
      )
      const tops = fills.map((path) => Math.min(...path.points.map((point) => point[1])))
      expect(
        tops.some((top) => Math.abs(top - plot.y(0.6)) < 0.5),
        id,
      ).toBe(true)
      const still = drawDisplay(display, params, { meters })
      expect(pathsOf(still).filter((path) => path.how === 'fill').length, id).toBeLessThan(
        pathsOf(running).filter((path) => path.how === 'fill').length,
      )
    }
  })

  it('name what is in use, and say what the point in hand is set to', () => {
    const words = (id: string, values: Values, hot: string | null = null) =>
      drawDisplay(displayOf(id), paramsOf(id), { values, hot }).words()
    expect(words('saturator', { curve: 2 })).toEqual(['TUBE'])
    expect(words('analog-drive', { circuit: 3 })).toEqual(['TRIODE'])
    expect(words('re-amp', { speaker: 2 })).toEqual(['STACK'])
    expect(words('saturator', { driveDb: 18 }, 'drive')).toEqual(['+18.0 dB'])
    expect(words('saturator', { bias: -0.25 }, 'bias')).toEqual(['Bias −0.25'])
    // Analog Drive says the gain into the circuit: 42 dB × the taper, and 20 dB more with Push.
    expect(words('analog-drive', { drive: 1, push: 1 }, 'drive')).toEqual(['+62.0 dB'])
    expect(words('analog-drive', { lowCut: 120 }, 'lowCut')).toEqual(['Low cut 120 Hz'])
    // Re-amp the gain into the valve: half at Drive 0, 30 dB more at 1.
    expect(words('re-amp', { drive: 0 }, 'drive')).toEqual(['−6.0 dB'])
    expect(words('re-amp', { drive: 1 }, 'drive')).toEqual(['+24.1 dB'])
  })
})
