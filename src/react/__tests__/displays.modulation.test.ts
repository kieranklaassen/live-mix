// The truth of the modulation displays: what each draws against the device it
// stands for. The formulas the displays are drawn from are checked against
// numbers worked out by hand and against the compiled devices themselves
// (their sound through an impulse or a tone, and the readings they report),
// and the drawings against the formulas.

import { describe, expect, it } from 'vitest'

import { CHORUS_PARAMS } from '../../dsp/devices/chorus.gen'
import { FLANGER_PARAMS } from '../../dsp/devices/flanger.gen'
import { PHASER_PARAMS } from '../../dsp/devices/phaser.gen'
import { ROTARY_PARAMS } from '../../dsp/devices/rotary.gen'
import { TREMOLO_PARAMS } from '../../dsp/devices/tremolo.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { type ParamSpec } from '../../core/params'
import { INK, PLAIN_COLOURS, xOfHz, type Box } from '../components/display-kit'
import {
  MODULATION_FACES,
  chorusSwingMs,
  chorusVoiceMs,
  flangerDb,
  flangerDelayMs,
  mixedDb,
  phaserCoefficient,
  phaserDb,
  phaserTune,
  phaserTurn,
  rotaryGain,
  rotarySwing,
  scopeSpanSec,
  sweepWave,
} from '../components/displays/modulation'
import { type DisplayHandle, type PlateDisplay } from '../components/plate-display'
import { drawDisplay, runDisplay, viewOf, type RecordingContext } from './display-harness'

const RATE = 48000
const TWO_PI = Math.PI * 2
const wrap = (cycles: number): number => cycles - Math.floor(cycles)

type Specs = Readonly<Record<string, ParamSpec>>

function set(device: WasmDeviceHarness, specs: Specs, values: Readonly<Record<string, number>>) {
  for (const [name, value] of Object.entries(values)) device.set(specs[name], value)
}

function meter(device: WasmDeviceHarness, index: number): number {
  const read = device.device.device_meter
  if (!read) throw new Error('the device reports no readings')
  return read(index)
}

/** What a device answers to one click, on its left side. */
async function impulseResponse(
  id: string,
  specs: Specs,
  values: Readonly<Record<string, number>>,
  length = 16384,
): Promise<Float32Array> {
  const device = await loadWasmDevice(id, RATE)
  set(device, specs, values)
  const out = new Float32Array(length)
  const block = new Float32Array(128)
  for (let done = 0; done < length; done += 128) {
    block[0] = done === 0 ? 0.5 : 0
    device.processBlock(block)
    out.set(device.view(device.device.device_out_left(), 128), done)
  }
  return out.map((sample) => sample * 2)
}

/** What a response does to one frequency, in dB. */
function responseDb(response: Float32Array, hz: number): number {
  let re = 0
  let im = 0
  const w = (hz * TWO_PI) / RATE
  for (let n = 0; n < response.length; n++) {
    re += response[n] * Math.cos(w * n)
    im -= response[n] * Math.sin(w * n)
  }
  return 10 * Math.log10(Math.max(1e-12, re * re + im * im))
}

/** A model agrees with the device: to half a dB where there is sound, and both far down in a notch. */
function expectSameDb(model: number, device: number, what: string): void {
  if (model < -30) expect(device, what).toBeLessThan(-26)
  else expect(Math.abs(model - device), `${what}: ${model} against ${device}`).toBeLessThan(0.5)
}

/** A hiss that keeps a device awake, the same every time. */
function hiss(block: Float32Array, seed: number): void {
  let s = seed >>> 0
  for (let i = 0; i < block.length; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    block[i] = (s / 4294967296 - 0.5) * 0.2
  }
}

/** The dots a drawing has: every whole circle, with its radius. */
function dots(drawn: RecordingContext): { x: number; y: number; r: number }[] {
  return drawn.calls
    .filter((call) => call.name === 'arc' && call.args[3] === 0 && call.args[4] === TWO_PI)
    .map((call) => ({
      x: call.args[0] as number,
      y: call.args[1] as number,
      r: call.args[2] as number,
    }))
}

interface Stroke {
  colour: string
  alpha: number
  width: number
  dashed: boolean
  points: { x: number; y: number }[]
}

/** Every line a drawing strokes, with what it was stroked in. */
function strokes(drawn: RecordingContext): Stroke[] {
  const all: Stroke[] = []
  let path: { x: number; y: number }[] = []
  let colour = ''
  let alpha = 1
  let width = 1
  let dashed = false
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') path = []
    else if (call.name === 'moveTo' || call.name === 'lineTo')
      path.push({ x: call.args[0] as number, y: call.args[1] as number })
    else if (call.name === 'set strokeStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = call.args[0] as number
    else if (call.name === 'set lineWidth') width = call.args[0] as number
    else if (call.name === 'setLineDash') dashed = (call.args[0] as number[]).length > 0
    else if (call.name === 'stroke') all.push({ colour, alpha, width, dashed, points: path })
  }
  return all
}

/** Every point the lines in the plate's ink pass through: the curves, and not the marks in the accent. */
function points(drawn: RecordingContext): { x: number; y: number }[] {
  return strokes(drawn)
    .filter((stroke) => stroke.colour === PLAIN_COLOURS.ink)
    .flatMap((stroke) => stroke.points)
}

/** A phase as the device reports it while it runs: thirty times a second, whatever the frames do. */
const reported =
  (start: number, rate: number, more: (phase: number) => Record<string, number> = () => ({})) =>
  (time: number): { meters: Record<string, number> } => {
    const phase = wrap(start + rate * (Math.floor(time * 30 + 1e-9) / 30))
    return { meters: { phase, ...more(phase) } }
  }

const tremolo = MODULATION_FACES.tremolo.display
const chorus = MODULATION_FACES.chorus.display
const flanger = MODULATION_FACES.flanger.display
const phaser = MODULATION_FACES.phaser.display
const rotary = MODULATION_FACES.rotary.display

/** The one point of a display at these settings, on a plate at rest. */
function pointOf(
  display: PlateDisplay,
  params: Specs,
  values: Readonly<Record<string, number>> = {},
): DisplayHandle {
  const [point] = display.handles?.(viewOf(display, params, { values })) ?? []
  return point
}

/** The level lines of a scale: two points at one height in the plate's ink, as faint as a grid. */
const scaleLines = (drawn: RecordingContext): number[] =>
  strokes(drawn)
    .filter(
      (stroke) =>
        stroke.colour === PLAIN_COLOURS.ink &&
        stroke.alpha === INK.grid &&
        stroke.points.length === 2 &&
        stroke.points[0].y === stroke.points[1].y,
    )
    .map((stroke) => stroke.points[0].y)

describe('the Tremolo display', () => {
  // The scope on a plate at rest: 176 by 38 from (4, 5), its middle at 24.
  const square = { shape: 2, smooth: 0 }

  it('has Depth on a point at the foot of the swing, at the left end of the scope', () => {
    // Depth 0.55 of 38 px down from the top, where the sound is untouched.
    const point = pointOf(tremolo, TREMOLO_PARAMS)
    expect(point.key).toBe('depth')
    expect(point.x).toBe(9)
    expect(point.y).toBeCloseTo(5 + 0.55 * 38, 9)
    // A square swings the whole way: the lowest the trace gets is where the point stands.
    const drawn = drawDisplay(tremolo, TREMOLO_PARAMS, { values: square, meters: { phase: 0 } })
    const trace = strokes(drawn).filter((stroke) => stroke.points.length > 10)
    expect(Math.max(...trace.flatMap((stroke) => stroke.points.map((at) => at.y)))).toBeCloseTo(
      point.y,
      3,
    )
    // The line it is taken by lies across the scope at that height, on the row of pixels it falls in.
    expect(scaleLines(drawn)).toContain(Math.floor(point.y) + 0.5)
    // And the ring is drawn there, larger while it is under the pointer.
    expect(dots(drawn)).toContainEqual({ x: 9, y: point.y, r: 3.5 })
    const hot = drawDisplay(tremolo, TREMOLO_PARAMS, { hot: 'depth' })
    expect(dots(hot)).toContainEqual({ x: 9, y: point.y, r: 4.5 })
  })

  it('stands the point where the swing ends in every mode, Mix scaling it with Depth', () => {
    // Harmonic swings down from the top as Tremolo does.
    expect(pointOf(tremolo, TREMOLO_PARAMS, { mode: 2, depth: 0.9 }).y).toBeCloseTo(5 + 0.9 * 38, 9)
    expect(pointOf(tremolo, TREMOLO_PARAMS, { mode: 0, depth: 0.1 }).y).toBeCloseTo(5 + 0.1 * 38, 9)
    // Pan and Vibrato swing about the middle: the point is on the upper end, 19 px for all of it.
    expect(pointOf(tremolo, TREMOLO_PARAMS, { mode: 1, depth: 0.9 }).y).toBeCloseTo(
      24 - 0.9 * 19,
      9,
    )
    expect(pointOf(tremolo, TREMOLO_PARAMS, { mode: 3, depth: 0.5 }).y).toBeCloseTo(14.5, 9)
    expect(pointOf(tremolo, TREMOLO_PARAMS, { mode: 1, depth: 0 }).y).toBe(24)
    // Half the Mix is half the swing: Depth 0.8 of it is 0.4 of the box.
    expect(pointOf(tremolo, TREMOLO_PARAMS, { depth: 0.8, mix: 0.5 }).y).toBeCloseTo(
      5 + 0.4 * 38,
      9,
    )
    expect(pointOf(tremolo, TREMOLO_PARAMS, { mode: 1, depth: 0.8, mix: 0.5 }).y).toBeCloseTo(
      24 - 0.4 * 19,
      9,
    )
    // The trace of a square in Pan reaches up to it too.
    const values = { ...square, mode: 1, depth: 0.7 }
    const drawn = drawDisplay(tremolo, TREMOLO_PARAMS, { values, meters: { phase: 0 } })
    const trace = strokes(drawn).filter((stroke) => stroke.points.length > 10)
    expect(Math.min(...trace.flatMap((stroke) => stroke.points.map((at) => at.y)))).toBeCloseTo(
      pointOf(tremolo, TREMOLO_PARAMS, values).y,
      3,
    )
  })

  it('takes Depth from how far the point is dragged, and leaves it alone when it is only taken', () => {
    const settings: Record<string, number>[] = [
      {},
      { depth: 0.37 },
      { mode: 1, depth: 0.81 },
      { mode: 2, depth: 0.2, mix: 0.3 },
      { mode: 3, depth: 1 },
      { depth: 0 },
    ]
    for (const values of settings) {
      const point = pointOf(tremolo, TREMOLO_PARAMS, values)
      const depth = values.depth ?? TREMOLO_PARAMS.depth.default
      expect(point.drag(point.x, point.y)).toEqual({ depth })
      // Only up and down counts.
      expect(point.drag(point.x + 60, point.y)).toEqual({ depth })
    }
    // Down a quarter of the box is Depth 0.25; in Pan up a quarter of the half is the same.
    const down = pointOf(tremolo, TREMOLO_PARAMS)
    expect(down.drag(9, 5 + 0.25 * 38).depth).toBeCloseTo(0.25, 9)
    expect(pointOf(tremolo, TREMOLO_PARAMS, { depth: 0.25 }).y).toBeCloseTo(5 + 0.25 * 38, 9)
    const up = pointOf(tremolo, TREMOLO_PARAMS, { mode: 1 })
    expect(up.drag(9, 24 - 0.25 * 19).depth).toBeCloseTo(0.25, 9)
    // With half the Mix the same place is twice the Depth.
    expect(pointOf(tremolo, TREMOLO_PARAMS, { mix: 0.5 }).drag(9, 5 + 0.25 * 38).depth).toBeCloseTo(
      0.5,
      9,
    )
  })

  it('stops at the ends of Depth however far it is dragged, and a double press gives the default', () => {
    const down = pointOf(tremolo, TREMOLO_PARAMS)
    expect(down.drag(9, 900)).toEqual({ depth: 1 })
    expect(down.drag(9, -900)).toEqual({ depth: 0 })
    expect(down.drag(-400, 43)).toEqual({ depth: 1 })
    const up = pointOf(tremolo, TREMOLO_PARAMS, { mode: 3 })
    expect(up.drag(9, -900)).toEqual({ depth: 1 })
    expect(up.drag(9, 900)).toEqual({ depth: 0 })
    expect(pointOf(tremolo, TREMOLO_PARAMS, { depth: 0.9 }).reset?.()).toEqual({ depth: 0.55 })
    // With no Mix nothing swings: the point has nowhere to go and Depth stays.
    const flat = pointOf(tremolo, TREMOLO_PARAMS, { mix: 0, depth: 0.4 })
    expect(flat.y).toBe(5.25)
    expect(flat.drag(9, 40)).toEqual({ depth: 0.4 })
  })

  it('keeps the ring whole on the strip where the line is at an edge of the scope', () => {
    // Lit, the ring is 4.5 px wide under a 1.5 px line: 5.25 px about its middle, on a strip 48 high.
    const edges: [Record<string, number>, number, number][] = [
      [{ mode: 0, depth: 0 }, 5, 5.25],
      [{ mode: 2, depth: 0 }, 5, 5.25],
      [{ mode: 0, depth: 1 }, 43, 42.75],
      [{ mode: 2, depth: 1 }, 43, 42.75],
      [{ mode: 1, depth: 1 }, 5, 5.25],
      [{ mode: 3, depth: 1 }, 5, 5.25],
      [{ mode: 0, depth: 0.7, mix: 0 }, 5, 5.25],
    ]
    for (const [values, line, ring] of edges) {
      const point = pointOf(tremolo, TREMOLO_PARAMS, values)
      expect(point.y, JSON.stringify(values)).toBeCloseTo(ring, 9)
      const hot = drawDisplay(tremolo, TREMOLO_PARAMS, { values, hot: 'depth' })
      const lit = dots(hot).find((dot) => dot.x === 9 && dot.r === 4.5)
      expect(lit?.y).toBeCloseTo(ring, 9)
      // The line it is taken by stays where the swing ends, a quarter pixel from the ring.
      expect(scaleLines(hot)).toContain(line + 0.5)
      // Taken there and moved a pixel into the scope, Depth moves by that pixel and the quarter, and no further.
      const inward = ring < 24 ? 1 : -1
      const depth = values.depth ?? 0
      const moved = point.drag(9, point.y + inward).depth
      // And pushed on past the edge it stays at the end it is on.
      expect(point.drag(9, point.y - inward * 3)).toEqual({ depth })
      if ((values.mix ?? 1) === 0) {
        expect(moved).toBe(depth)
        continue
      }
      expect(Math.abs(moved - depth)).toBeLessThan(1.3 / (values.mode % 2 === 1 ? 19 : 38))
      // Brought back to where it was taken, the ring is at its end again, and so is Depth.
      const there = pointOf(tremolo, TREMOLO_PARAMS, { ...values, depth: moved })
      expect(there.y).toBeCloseTo(point.y + inward, 9)
      expect(there.drag(9, there.y - inward)).toEqual({ depth })
    }
    // Everywhere between, the ring is on the line itself.
    for (const depth of [0.01, 0.3, 0.99])
      expect(pointOf(tremolo, TREMOLO_PARAMS, { depth }).y).toBeCloseTo(
        Math.min(42.75, Math.max(5.25, 5 + depth * 38)),
        9,
      )
  })

  it('draws Pan as the device pans: up while the left side is the louder', async () => {
    const values = { mode: 1, shape: 2, smooth: 0, depth: 1, mix: 1, rate: 2 }
    const device = await loadWasmDevice('tremolo', RATE)
    set(device, TREMOLO_PARAMS, values)
    const block = new Float32Array(128).fill(0.5)
    let lefts = 0
    let rights = 0
    for (let n = 0; n < 600; n++) {
      device.processBlock(block)
      const phase = meter(device, 0)
      // In the middle of each half of the square, where the slew has long settled.
      const half = phase % 0.5
      if (n < 200 || half < 0.15 || half > 0.35) continue
      const left = device.view(device.device.device_out_left(), 128)[127]
      const right = device.view(device.device.device_out_right(), 128)[127]
      // `tremolo.h`: the modulator up is the right side, hard over at full Depth.
      const m = meter(device, 1)
      expect(Math.abs(m)).toBeGreaterThan(0.99)
      expect(m > 0 ? left : right).toBeLessThan(0.01)
      expect(m > 0 ? right : left).toBeCloseTo(0.5 * Math.SQRT2, 2)
      // The display, at the phase the device reports: its dot at now on the louder side's end.
      const drawn = drawDisplay(tremolo, TREMOLO_PARAMS, {
        values,
        meters: { phase },
        dt: 1 / 60,
      })
      const now = dots(drawn).find((dot) => dot.r === 3)
      expect(now?.y).toBeCloseTo(left > right ? 5 : 43, 1)
      if (left > right) lefts += 1
      else rights += 1
    }
    expect(lefts).toBeGreaterThan(20)
    expect(rights).toBeGreaterThan(20)
    // The words at the two ends say so: L over R.
    const drawn = drawDisplay(tremolo, TREMOLO_PARAMS, { values, meters: { phase: 0.1 } })
    const word = (words: string): number =>
      drawn.calls.find((call) => call.name === 'fillText' && call.args[0] === words)
        ?.args[2] as number
    expect(word('L')).toBeLessThan(24)
    expect(word('R')).toBeGreaterThan(24)
  })
})

/** Where a swept display draws its response on a plate at rest: 128 by 100, the bar under it at 92.5. */
const PLOT: Box = { x: 4, y: 4, w: 120, h: 83 }
const RAIL = 92.5

describe('the Chorus display', () => {
  it('swings each voice as far as the device does', () => {
    expect(chorusSwingMs(50, 12)).toBeCloseTo(2.5, 9)
    // Under 6 ms of Delay the swing stops a millisecond short of nothing.
    expect(chorusSwingMs(100, 5)).toBeCloseTo(4, 9)
    expect(chorusSwingMs(100, 30)).toBeCloseTo(5, 9)
    // Two voices are opposite; three stand a third of a cycle apart and sum to nothing.
    for (const phase of [0, 0.13, 0.5, 0.77]) {
      expect(chorusVoiceMs(phase, 0, 2, 3) + chorusVoiceMs(phase, 1, 2, 3)).toBeCloseTo(0, 9)
      const three = [0, 1, 2].map((voice) => chorusVoiceMs(phase, voice, 3, 3))
      expect(three[0] + three[1] + three[2]).toBeCloseTo(0, 9)
    }
    // Full Spread puts the right side a quarter of a cycle on.
    expect(chorusVoiceMs(0, 0, 2, 3, 0.25)).toBeCloseTo(3, 9)
    // By hand, a tenth of a cycle in (36°), swinging 2.5 ms: the second of
    // three voices is at sin(156°) = 0.406737, the third at sin(276°) =
    // −0.994522, and the first on the right at full Spread at sin(126°) = 0.809017.
    expect(chorusVoiceMs(0.1, 1, 3, 2.5)).toBeCloseTo(1.01684, 4)
    expect(chorusVoiceMs(0.1, 2, 3, 2.5)).toBeCloseTo(-2.4863, 4)
    expect(chorusVoiceMs(0.1, 0, 3, 2.5, 0.25)).toBeCloseTo(2.02254, 4)
    // The limit of 5 ms is reached from 6 ms of Delay on.
    expect(chorusSwingMs(100, 6)).toBeCloseTo(5, 9)
    expect(chorusSwingMs(30, 5)).toBeCloseTo(1.2, 9)
  })

  it.each([
    ['two voices', 0, 2],
    ['three voices', 1, 3],
  ])(
    'reads where the device reads, from the phase it reports: %s',
    async (_name, choice, voices) => {
      const device = await loadWasmDevice('chorus', RATE)
      set(device, CHORUS_PARAMS, {
        voices: choice,
        rate: 10,
        depth: 50,
        delayMs: 12,
        spread: 0,
        feedback: 0,
        mix: 1,
      })
      // The LFO runs while the device sleeps: a hundredth of a second at 10 Hz is a tenth of a cycle.
      const silence = new Float32Array(120)
      for (let i = 0; i < 4; i++) device.processBlock(silence)
      set(device, CHORUS_PARAMS, { rate: 0.01 })
      const phase = meter(device, 0)
      expect(phase).toBeCloseTo(0.1, 3)
      // One click: each voice answers it once, as late as its read point.
      const out = new Float32Array(1024)
      const block = new Float32Array(128)
      for (let done = 0; done < out.length; done += 128) {
        block[0] = done === 0 ? 0.5 : 0
        device.processBlock(block)
        out.set(device.view(device.device.device_out_left(), 128), done)
      }
      const expected = Array.from({ length: voices }, (_, voice) =>
        Math.round(
          ((12 + chorusVoiceMs(phase, voice, voices, chorusSwingMs(50, 12))) * RATE) / 1000,
        ),
      )
      for (const at of expected) {
        let loudest = 0
        for (let n = 1; n < out.length; n++) {
          if (Math.abs(n - at) > 8) continue
          if (Math.abs(out[n]) > Math.abs(out[loudest]) || loudest === 0) loudest = n
        }
        expect(Math.abs(loudest - at), `a voice answers at sample ${at}`).toBeLessThanOrEqual(1)
        expect(Math.abs(out[loudest])).toBeGreaterThan(0.1)
      }
    },
  )

  it('draws every voice at now where the formula has it, at the phase the device reports', () => {
    const middle = 24
    const perMs = 19 / 5
    const nowX = 4 + (176 - 30) * 0.7
    // At rest the LFO stands at the start of its cycle.
    const atRest = dots(drawDisplay(chorus, CHORUS_PARAMS, { meters: { phase: 0 } }))
    const left = atRest.filter((dot) => dot.r === 2.5)
    expect(left.length).toBe(3)
    for (const dot of left) expect(dot.x).toBeCloseTo(nowX, 6)
    left.forEach((dot, voice) =>
      expect(dot.y).toBeCloseTo(middle - chorusVoiceMs(0, voice, 3, 2.5) * perMs, 6),
    )
    // The right side, Spread 70 %: 0.175 of a cycle on.
    const right = atRest.filter((dot) => dot.r === 1.5)
    expect(right.length).toBe(3)
    right.forEach((dot, voice) =>
      expect(dot.y).toBeCloseTo(middle - chorusVoiceMs(0, voice, 3, 2.5, 0.175) * perMs, 6),
    )
    // Running, the device says a quarter of a cycle: the first voice is at the top of its swing.
    const running = dots(
      runDisplay(chorus, CHORUS_PARAMS, 2 / 60, {
        values: { voices: 0, spread: 0 },
        meters: { phase: 0.25 },
      }),
    ).filter((dot) => dot.r === 2.5)
    expect(running.map((dot) => dot.y)).toEqual([
      expect.closeTo(middle - 2.5 * perMs, 6),
      expect.closeTo(middle + 2.5 * perMs, 6),
    ])
  })

  it('carries the phase forward between two readings at the Rate', () => {
    // The same reading for three frames at 60 a second, Rate 3 Hz: a tenth of a cycle has passed.
    const drawn = runDisplay(chorus, CHORUS_PARAMS, 4 / 60, {
      values: { voices: 0, spread: 0, rate: 3 },
      meters: { phase: 0.25 },
    })
    const [first] = dots(drawn).filter((dot) => dot.r === 2.5)
    expect(first.y).toBeCloseTo(24 - chorusVoiceMs(0.25 + 2 * (3 / 60), 0, 2, 2.5) * (19 / 5), 4)
  })

  it('settles on the phase the device reports, and not a frame ahead of it', () => {
    const place = (phase: number): number => 24 - chorusVoiceMs(phase, 0, 2, 2.5) * (19 / 5)
    const first = (drawn: RecordingContext): number =>
      dots(drawn).find((dot) => dot.r === 2.5)?.y ?? NaN
    const values = { voices: 0, spread: 0, rate: 3 }
    // Sixty frames, thirty readings: the last frame is the one a reading arrives on.
    const onReading = runDisplay(chorus, CHORUS_PARAMS, 59 / 60, { values }, reported(0.3, 3))
    expect(first(onReading)).toBeCloseTo(place(0.3 + 3 * (58 / 60)), 5)
    // The frame after it has the same reading, carried on by one frame of the Rate.
    const between = runDisplay(chorus, CHORUS_PARAMS, 1, { values }, reported(0.3, 3))
    expect(first(between)).toBeCloseTo(place(0.3 + 3 * (58 / 60) + 3 / 60), 5)
    // A frame ahead of the reading it would stand 3 / 60 of a cycle further on: not here.
    expect(Math.abs(first(onReading) - place(0.3 + 3 * (59 / 60)))).toBeGreaterThan(0.4)
  })

  it('stands where the device last said when no reading comes any more', () => {
    // Half a second of one reading: nothing is running the device, and the clock does not carry it on.
    const drawn = runDisplay(chorus, CHORUS_PARAMS, 0.5, {
      values: { voices: 0, spread: 0, rate: 3 },
      meters: { phase: 0.1 },
    })
    const [first] = dots(drawn).filter((dot) => dot.r === 2.5)
    expect(first.y).toBeCloseTo(24 - chorusVoiceMs(0.1, 0, 2, 2.5) * (19 / 5), 6)
  })

  it('spans two seconds, and four cycles where the Rate is faster than that', () => {
    expect(scopeSpanSec(0.01)).toBe(2)
    expect(scopeSpanSec(0.8)).toBe(2)
    expect(scopeSpanSec(2)).toBe(2)
    expect(scopeSpanSec(4)).toBe(1)
    expect(scopeSpanSec(10)).toBeCloseTo(0.4, 9)
    // The line of a voice: at the left edge of the scope it is the span's share before now back.
    const nowX = 4 + 146 * 0.7
    for (const [rate, span] of [
      [0.8, 2],
      [10, 0.4],
    ]) {
      const drawn = drawDisplay(chorus, CHORUS_PARAMS, {
        values: { voices: 0, spread: 0, rate },
        meters: { phase: 0 },
      })
      const [past, next] = strokes(drawn).filter((stroke) => stroke.points.length > 10)
      const at = (seconds: number): number =>
        24 - chorusVoiceMs(seconds * rate, 0, 2, 2.5) * (19 / 5)
      expect(past.points[0].x).toBe(4)
      expect(past.points[0].y).toBeCloseTo(at(-0.7 * span), 4)
      expect(past.points[past.points.length - 1].x).toBeCloseTo(nowX, 4)
      expect(past.points[past.points.length - 1].y).toBeCloseTo(at(0), 4)
      expect(next.dashed).toBe(true)
      expect(next.points[next.points.length - 1].y).toBeCloseTo(at(0.3 * span), 4)
      // Never closer than a point a pixel, never fewer than thirty a cycle.
      const gaps = past.points.slice(1).map((point, i) => point.x - past.points[i].x)
      expect(Math.min(...gaps)).toBeGreaterThanOrEqual(0.99)
      expect(Math.max(...gaps) * span * rate).toBeLessThanOrEqual(146 / 30)
    }
  })

  it('draws the right side behind and fainter, and only where Spread sets it apart', () => {
    const lines = (spread: number): Stroke[] =>
      strokes(
        drawDisplay(chorus, CHORUS_PARAMS, { values: { spread }, meters: { phase: 0 } }),
      ).filter((stroke) => stroke.points.length > 10)
    // Three voices: what each has done and what comes, and nothing else.
    expect(lines(0).length).toBe(6)
    // Set apart: three fainter lines of what the right side has done, drawn first.
    const apart = lines(70)
    expect(apart.length).toBe(9)
    expect(apart.slice(0, 3).every((stroke) => stroke.alpha < 0.5 && !stroke.dashed)).toBe(true)
    expect(apart.slice(3).filter((stroke) => stroke.alpha === 1).length).toBe(3)
  })

  it('has Depth on a point at the top of the swing, at the left end of the scope', () => {
    // Depth 50 % of 5 ms, at 3.8 px a millisecond over the middle line.
    const point = pointOf(chorus, CHORUS_PARAMS)
    expect(point.key).toBe('depth')
    expect(point.x).toBe(9)
    expect(point.y).toBeCloseTo(24 - 2.5 * (19 / 5), 9)
    // The highest a voice gets is where the point stands, and the line it is taken by lies there.
    const drawn = drawDisplay(chorus, CHORUS_PARAMS, { meters: { phase: 0 } })
    const voices = strokes(drawn).filter((stroke) => stroke.points.length > 10)
    const top = Math.min(...voices.flatMap((stroke) => stroke.points.map((at) => at.y)))
    expect(top).toBeGreaterThanOrEqual(point.y - 1e-6)
    expect(top).toBeLessThan(point.y + 0.1)
    expect(scaleLines(drawn)).toContain(Math.floor(point.y) + 0.5)
    expect(dots(drawn)).toContainEqual({ x: 9, y: point.y, r: 3.5 })
    // At other settings: none of it on the middle line, all of it at the top of the scope.
    expect(pointOf(chorus, CHORUS_PARAMS, { depth: 0 }).y).toBe(24)
    expect(pointOf(chorus, CHORUS_PARAMS, { depth: 90 }).y).toBeCloseTo(24 - 4.5 * (19 / 5), 9)
    // All of it is the top of the scope: the ring a quarter pixel under the line, whole when it is lit.
    const whole = pointOf(chorus, CHORUS_PARAMS, { depth: 100 })
    expect(whole.y).toBe(5.25)
    const lit = drawDisplay(chorus, CHORUS_PARAMS, { values: { depth: 100 }, hot: 'depth' })
    expect(dots(lit)).toContainEqual({ x: 9, y: 5.25, r: 4.5 })
    expect(scaleLines(lit)).toContain(5.5)
    expect(whole.drag(9, 3)).toEqual({ depth: 100 })
    const less = whole.drag(9, 6.25).depth
    expect(100 - less).toBeLessThan((1.3 / 19) * 100)
    // Brought back up to where the ring stops, it is all of Depth again.
    const lower = pointOf(chorus, CHORUS_PARAMS, { depth: less })
    expect(lower.y).toBeCloseTo(6.25, 9)
    expect(lower.drag(9, 5.25)).toEqual({ depth: 100 })
    // Under 6 ms of Delay the whole of Depth is less than the scale: 4 ms at 5.
    expect(pointOf(chorus, CHORUS_PARAMS, { depth: 100, delayMs: 5 }).y).toBeCloseTo(
      24 - 4 * (19 / 5),
      9,
    )
    // Rate is not on this scale: the point stays where it is as the scope spans less time.
    expect(pointOf(chorus, CHORUS_PARAMS, { rate: 10 }).y).toBe(point.y)
  })

  it('takes Depth from how far up the point is dragged, and leaves it alone when it is only taken', () => {
    const settings: Record<string, number>[] = [
      {},
      { depth: 0 },
      { depth: 83 },
      { depth: 100 },
      { depth: 37, delayMs: 5 },
    ]
    for (const values of settings) {
      const point = pointOf(chorus, CHORUS_PARAMS, values)
      const depth = values.depth ?? CHORUS_PARAMS.depth.default
      expect(point.drag(point.x, point.y)).toEqual({ depth })
      expect(point.drag(point.x - 40, point.y)).toEqual({ depth })
    }
    // To 1 ms over the middle: a fifth of the 5 ms, and a quarter of the 4 ms a Delay of 5 leaves.
    expect(pointOf(chorus, CHORUS_PARAMS).drag(9, 24 - 19 / 5).depth).toBeCloseTo(20, 9)
    expect(pointOf(chorus, CHORUS_PARAMS, { delayMs: 5 }).drag(9, 24 - 19 / 5).depth).toBeCloseTo(
      25,
      9,
    )
    expect(pointOf(chorus, CHORUS_PARAMS, { depth: 20 }).y).toBeCloseTo(24 - 19 / 5, 9)
    // The ends are exact however far it goes, and a double press gives the default.
    const point = pointOf(chorus, CHORUS_PARAMS)
    expect(point.drag(9, -900)).toEqual({ depth: 100 })
    expect(point.drag(9, 900)).toEqual({ depth: 0 })
    expect(point.drag(700, 24)).toEqual({ depth: 0 })
    expect(pointOf(chorus, CHORUS_PARAMS, { depth: 12 }).reset?.()).toEqual({ depth: 50 })
  })
})

describe('the sweep shapes of the Flanger and the Phaser', () => {
  it('are the ones `mod_lfo.h` computes', () => {
    expect(sweepWave(0, 0.25)).toBeCloseTo(1, 9)
    expect(sweepWave(0, 0.75)).toBeCloseTo(-1, 9)
    expect(sweepWave(1, 0)).toBe(-1)
    expect(sweepWave(1, 0.5)).toBe(1)
    expect(sweepWave(1, 0.75)).toBe(0)
    expect(sweepWave(2, 0.75)).toBe(0.5)
    expect(sweepWave(3, 0.75)).toBe(-0.5)
    expect(sweepWave(4, 0.25)).toBe(1)
    expect(sweepWave(4, 0.75)).toBe(-1)
    // Random is the device's own: no formula follows it.
    expect(sweepWave(5, 0.3)).toBe(0)
    // A phase past the end of the cycle is the same place in the next one.
    expect(sweepWave(2, 1.75)).toBe(0.5)
  })

  it('mix a dry signal with a turned one as the devices do', () => {
    // Half and half, no feedback: in phase is untouched, half a turn is nothing.
    expect(mixedDb(0, 0, 0, 0.5)).toBeCloseTo(0, 9)
    expect(mixedDb(Math.PI, Math.PI, 0, 0.5)).toBeLessThan(-100)
    // A quarter wet leaves half: 6 dB down.
    expect(mixedDb(Math.PI, Math.PI, 0, 0.25)).toBeCloseTo(-6.02, 2)
    // Feedback 50 % doubles the wet where the loop is in phase: 0.5 + 0.5 · 2.
    expect(mixedDb(0, 0, 0.5, 0.5)).toBeCloseTo(20 * Math.log10(1.5), 6)
    // Negative feedback lifts the half turn instead: |0.5 − 0.5 · 2|... the wet alone is 1 / (1 − 0.5).
    expect(mixedDb(Math.PI, Math.PI, -0.5, 1)).toBeCloseTo(20 * Math.log10(2), 6)
  })
})

describe('the Flanger display', () => {
  it('has its notches at odd multiples of half the reciprocal of the delay', () => {
    // 2.5 ms: 200 Hz, 600 Hz, 1 kHz, with the peaks half way between.
    for (const hz of [200, 600, 1000, 1400])
      expect(flangerDb(hz, 2.5, 0, 0.5, RATE)).toBeLessThan(-60)
    for (const hz of [400, 800, 1200]) expect(flangerDb(hz, 2.5, 0, 0.5, RATE)).toBeCloseTo(0, 6)
    // A quarter wet: the notch is 6 dB.
    expect(flangerDb(200, 2.5, 0, 0.25, RATE)).toBeCloseTo(-6.02, 2)
    // Twice the delay, half the frequency.
    expect(flangerDb(100, 5, 0, 0.5, RATE)).toBeLessThan(-60)
    // By hand, half wet and no feedback: the power is ½ + ½ · cos(2π · f · delay).
    // 100 Hz through 2.5 ms is a quarter of a turn, half the power; 50 Hz an
    // eighth, 0.853553 of it.
    expect(flangerDb(100, 2.5, 0, 0.5, RATE)).toBeCloseTo(-3.0103, 3)
    expect(flangerDb(50, 2.5, 0, 0.5, RATE)).toBeCloseTo(-0.6877, 3)
    // And with half the wet fed back, at 100 Hz: the loop is a quarter turn
    // and one sample (0.01309 rad), so 1 − 0.5 · e^(jψ) is 1.006545 + 0.499957j,
    // the wet −j over that is −0.395821 − 0.796891j, and half of 1 plus it
    // is 0.302090 − 0.398446j: a power of 0.250017.
    expect(flangerDb(100, 2.5, 0.5, 0.5, RATE)).toBeCloseTo(-6.0203, 3)
  })

  it('sharpens with feedback, and turns over with its sign', () => {
    // Positive feedback lifts the multiples of 1 / delay, where the loop (a
    // sample longer than the delay) comes round in phase: 0.5 + 0.5 / (1 − 0.7).
    const peak = RATE / 121
    expect(flangerDb(peak, 2.5, 0.7, 0.5, RATE)).toBeCloseTo(20 * Math.log10(0.5 + 0.5 / 0.3), 1)
    // The notch stays between them, filled in a little: 0.5 − 0.5 / (1 + 0.7).
    expect(flangerDb(200, 2.5, 0.7, 0.5, RATE)).toBeCloseTo(20 * Math.log10(0.5 - 0.5 / 1.7), 0)
    // Negative feedback puts the peaks on the odd half multiples, where the
    // notches were (0.5 − 0.5 / (1 − 0.7) there), and takes from the multiples.
    expect(flangerDb(peak / 2, 2.5, -0.7, 0.5, RATE)).toBeCloseTo(
      20 * Math.log10(0.5 / 0.3 - 0.5),
      1,
    )
    expect(flangerDb(peak, 2.5, -0.7, 0.5, RATE)).toBeCloseTo(20 * Math.log10(0.5 + 0.5 / 1.7), 1)
    // Wet only, the peaks are the loop's own resonance: 1 / (1 − 0.9) is 20 dB.
    expect(flangerDb(peak, 2.5, 0.9, 1, RATE)).toBeCloseTo(20, 1)
  })

  it.each([
    ['no feedback', 0, 0.5],
    ['feedback 70 %', 70, 0.5],
    ['feedback −70 %', -70, 0.5],
    ['wet only, feedback 50 %', 50, 1],
    ['a quarter wet', 30, 0.25],
  ])('is the response of the device: %s', async (_name, feedback, mix) => {
    const response = await impulseResponse('flanger', FLANGER_PARAMS, {
      delayMs: 2.5,
      depth: 0,
      feedback,
      mix,
    })
    for (const hz of [50, 100, 200, 300, 400, 600, 1000, 3170, 5000, 10850, 15000]) {
      expectSameDb(
        flangerDb(hz, 2.5, feedback / 100, mix, RATE),
        responseDb(response, hz),
        `${hz} Hz`,
      )
    }
  })

  it('follows the delay the device reads at, for every shape', async () => {
    for (const shape of [0, 1, 2, 3, 4]) {
      const device = await loadWasmDevice('flanger', RATE)
      set(device, FLANGER_PARAMS, { delayMs: 2.5, depth: 50, rate: 1, shape, stereo: 90 })
      // Asleep the sweep keeps its place in the cycle.
      const block = new Float32Array(128)
      for (let i = 0; i < 123; i++) device.processBlock(block)
      const phase = meter(device, 0)
      expect(phase).toBeCloseTo(wrap((123 * 128) / RATE), 3)
      expect(meter(device, 1)).toBeCloseTo(
        flangerDelayMs(2.5, 50, sweepWave(shape, phase), RATE),
        3,
      )
      expect(meter(device, 2)).toBeCloseTo(
        flangerDelayMs(2.5, 50, sweepWave(shape, phase + 0.25), RATE),
        3,
      )
      // Awake, a 3 ms lag stands between the shape and the read point: nothing to a sine or a triangle.
      if (shape > 1) continue
      for (let i = 0; i < 40; i++) {
        hiss(block, i + 1)
        device.processBlock(block)
      }
      const awake = meter(device, 0)
      expect(
        Math.abs(meter(device, 1) - flangerDelayMs(2.5, 50, sweepWave(shape, awake), RATE)),
      ).toBeLessThan(0.03)
    }
  })

  it('never reads nearer than two samples', () => {
    expect(flangerDelayMs(0.5, 100, -1, RATE)).toBeCloseTo(2000 / RATE, 9)
    expect(flangerDelayMs(2.5, 50, 1, RATE)).toBeCloseTo(2.5 * 1.475, 9)
    // By hand: Depth 50 % is 0.475 of the Delay each way, 1.3125 to 3.6875 ms.
    expect(flangerDelayMs(2.5, 50, -1, RATE)).toBeCloseTo(1.3125, 9)
    expect(flangerDelayMs(2.5, 50, 1, RATE)).toBeCloseTo(3.6875, 9)
    // Nor further than the line is long: 2044 samples.
    expect(flangerDelayMs(10, 100, 1, 96000)).toBeCloseTo(19.5, 9)
    expect(flangerDelayMs(10, 100, 1, 192000)).toBeCloseTo((2044 * 1000) / 192000, 9)
  })

  it('shades how far its first notch travels, and marks in the accent where it is now', () => {
    // 1.3125 to 3.6875 ms: the first notch goes from 380.95 Hz down to 135.59 Hz.
    const from = xOfHz(500 / 3.6875, PLOT)
    const to = xOfHz(500 / 1.3125, PLOT)
    const drawn = runDisplay(flanger, FLANGER_PARAMS, 2 / 30, {
      values: { stereo: 0 },
      meters: { phase: 0, left: 2, right: 2 },
    })
    const shade = drawn.calls.find(
      (call) => call.name === 'fillRect' && call.args[1] === PLOT.y && call.args[3] === PLOT.h,
    )
    expect(shade?.args[0]).toBeCloseTo(from, 6)
    expect((shade?.args[0] as number) + (shade?.args[2] as number)).toBeCloseTo(to, 6)
    const ends = points(drawn).filter((point) => point.y === RAIL - 2.5 || point.y === RAIL + 2.5)
    const xs = [...new Set(ends.map((point) => point.x))].sort((a, b) => a - b)
    expect(xs.length).toBe(2)
    expect(Math.abs(xs[0] - from)).toBeLessThanOrEqual(1)
    expect(Math.abs(xs[1] - to)).toBeLessThanOrEqual(1)
    // The one line in the accent: at the notch of the delay the device reads at, 250 Hz at 2 ms.
    const marks = strokes(drawn).filter((stroke) => stroke.colour === PLAIN_COLOURS.accent)
    expect(marks.length).toBe(1)
    expect(marks[0].points).toEqual([
      { x: expect.closeTo(xOfHz(250, PLOT), 6), y: PLOT.y },
      { x: expect.closeTo(xOfHz(250, PLOT), 6), y: RAIL },
    ])
    // Both sides at one place: one dot on the bar.
    expect(dots(drawn).filter((dot) => dot.y === RAIL).length).toBe(1)
  })

  it('settles on the delay the device reports, and stands on it when no reading comes', () => {
    const at = (phase: number): number => flangerDelayMs(2.5, 50, sweepWave(0, phase), RATE)
    const now = (drawn: RecordingContext): number =>
      dots(drawn).find((dot) => dot.r === 2.75)?.x ?? NaN
    // A reading on every frame, each a thirtieth of a cycle on at Rate 1 Hz: the dot is on the reading.
    const moving = runDisplay(
      flanger,
      FLANGER_PARAMS,
      1,
      { values: { rate: 1, stereo: 0 } },
      reported(0.1, 1, (phase) => ({ left: at(phase), right: at(phase) })),
    )
    expect(now(moving)).toBeCloseTo(xOfHz(500 / at(0.1 + 29 / 30), PLOT), 5)
    // The same reading for half a second: it is not carried on.
    const standing = runDisplay(flanger, FLANGER_PARAMS, 0.5, {
      values: { rate: 1, stereo: 0 },
      meters: { phase: 0.1, left: at(0.1), right: at(0.1) },
    })
    expect(now(standing)).toBeCloseTo(xOfHz(500 / at(0.1), PLOT), 6)
  })

  it('draws the comb where the delay is: the first notch a third of the way across at 2.5 ms', () => {
    const drawn = drawDisplay(flanger, FLANGER_PARAMS, { values: { feedback: 0 } })
    for (const hz of [200, 600, 1000]) {
      const x = xOfHz(hz, PLOT)
      const deepest = Math.max(
        ...points(drawn)
          .filter((point) => Math.abs(point.x - x) < 0.3)
          .map((point) => point.y),
      )
      expect(deepest, `the notch at ${hz} Hz runs off the foot`).toBeGreaterThan(PLOT.y + PLOT.h)
    }
    // Half way between two notches the line is where nothing is changed.
    const zero = PLOT.y + (24 / 60) * PLOT.h
    const between = points(drawn).filter((point) => Math.abs(point.x - xOfHz(400, PLOT)) < 0.6)
    expect(Math.min(...between.map((point) => Math.abs(point.y - zero)))).toBeLessThan(0.5)
  })

  it('stands where the device says its delay is, not where a clock of its own would have it', () => {
    const drawn = runDisplay(flanger, FLANGER_PARAMS, 2 / 30, {
      values: { feedback: 0, stereo: 0 },
      meters: { phase: 0, left: 5, right: 5 },
    })
    // The dot on the bar is the first notch: 100 Hz at 5 ms.
    const [now] = dots(drawn).filter((dot) => dot.r === 2.75)
    expect(now.x).toBeCloseTo(xOfHz(100, PLOT), 6)
    expect(now.y).toBe(RAIL)
    const deepest = Math.max(
      ...points(drawn)
        .filter((point) => Math.abs(point.x - xOfHz(100, PLOT)) < 0.3)
        .map((point) => point.y),
    )
    expect(deepest).toBeGreaterThan(PLOT.y + PLOT.h)
  })

  it('carries a reading forward by the shape until the next one arrives', () => {
    const at = (phase: number): number => flangerDelayMs(2.5, 50, sweepWave(0, phase), RATE)
    // The same reading for two more frames at Rate 1 Hz: the sweep is two thirtieths of a cycle on.
    const drawn = runDisplay(flanger, FLANGER_PARAMS, 4 / 30, {
      values: { rate: 1, stereo: 0 },
      meters: { phase: 0.1, left: at(0.1), right: at(0.1) },
    })
    const [now] = dots(drawn).filter((dot) => dot.r === 2.75)
    expect(now.x).toBeCloseTo(xOfHz(500 / at(0.1 + 2 / 30), PLOT), 4)
    // Random has no shape to carry it: the reading stands.
    const random = runDisplay(flanger, FLANGER_PARAMS, 4 / 30, {
      values: { rate: 1, stereo: 0, shape: 5 },
      meters: { phase: 0.1, left: 3.1, right: 3.1 },
    })
    expect(dots(random).find((dot) => dot.r === 2.75)?.x).toBeCloseTo(xOfHz(500 / 3.1, PLOT), 6)
  })

  it('has a point that is Delay across and Feedback up and down', () => {
    const view = {
      width: 128,
      height: 100,
      at: () => 0,
      value: (name: string) => FLANGER_PARAMS[name as keyof typeof FLANGER_PARAMS].default,
      spec: (name: string) => FLANGER_PARAMS[name as keyof typeof FLANGER_PARAMS],
    }
    const [point] = flanger.handles?.(view) ?? []
    // 2.5 ms: on the first notch, 200 Hz. 30 % of feedback: above the line where nothing is changed.
    expect(point.x).toBeCloseTo(xOfHz(200, PLOT), 6)
    expect(point.y).toBeLessThan(PLOT.y + (24 / 60) * PLOT.h)
    // To 100 Hz and onto the line: 5 ms, no feedback.
    const moved = point.drag(xOfHz(100, PLOT), PLOT.y + (24 / 60) * PLOT.h)
    expect(moved.delayMs).toBeCloseTo(5, 6)
    expect(moved.feedback).toBeCloseTo(0, 6)
  })
})

describe('the Phaser display', () => {
  it('tunes a stage as the device does', () => {
    for (const hz of [20, 100, 800, 5000, 12000]) {
      const t = Math.tan((Math.PI * hz) / RATE)
      expect(phaserCoefficient(hz, RATE)).toBeCloseTo((t - 1) / (t + 1), 3)
    }
    // Clamped at 10 Hz and at 0.45 of the sample rate, as in the device.
    expect(phaserCoefficient(1, RATE)).toBe(phaserCoefficient(10, RATE))
    expect(phaserCoefficient(23000, RATE)).toBe(phaserCoefficient(21600, RATE))
    // By hand: at a quarter of the sample rate the tangent is 1 and the
    // coefficient nothing; at 800 Hz it is tan(0.0523599) = 0.0524078, so
    // (0.0524078 − 1) / (0.0524078 + 1) = −0.900404.
    expect(phaserCoefficient(12000, RATE)).toBeCloseTo(0, 4)
    expect(phaserCoefficient(800, RATE)).toBeCloseTo(-0.900404, 5)
  })

  it('adds up the turns of the stages as the formula of one stage gives them', () => {
    for (const count of [4, 6, 8, 10, 12]) {
      for (const spread of [0, 0.3, 1]) {
        for (const sweep of [100, 800, 5000]) {
          const stages = new Float32Array(12)
          phaserTune(stages, count, sweep, spread, RATE)
          for (const hz of [20, 55, 331, 800, 1931, 5000, 12000, 20000]) {
            const w = (hz * TWO_PI) / RATE
            let turn = -count * w
            for (let s = 0; s < count; s++)
              turn += 2 * Math.atan2(stages[s] * Math.sin(w), 1 + stages[s] * Math.cos(w))
            expect(phaserTurn(stages, count, hz, RATE)).toBeCloseTo(turn, 6)
          }
        }
      }
    }
    // A stage turns its own frequency a quarter back: four alike a whole turn
    // there (nothing is cut), six a turn and a half (a notch).
    const alike = new Float32Array(12)
    phaserTune(alike, 6, 800, 0, RATE)
    expect(phaserTurn(alike, 1, 800, RATE)).toBeCloseTo(-Math.PI / 2, 4)
    expect(phaserTurn(alike, 4, 800, RATE)).toBeCloseTo(-TWO_PI, 4)
    expect(phaserDb(800, 800, 4, 0, 0, 0.5, RATE)).toBeCloseTo(0, 4)
    expect(phaserDb(800, 800, 6, 0, 0, 0.5, RATE)).toBeLessThan(-60)
    // Spread 100 % lays the stages from an octave under the sweep to an octave over it.
    phaserTune(alike, 4, 800, 1, RATE)
    expect(alike[0]).toBeCloseTo(phaserCoefficient(400, RATE), 6)
    expect(alike[3]).toBeCloseTo(phaserCoefficient(1600, RATE), 6)
    expect(alike[1]).toBeCloseTo(phaserCoefficient(400 * Math.pow(2, 2 / 3), RATE), 6)
  })

  it('has a notch for every two stages, where the stages turn the sound half way round', () => {
    // Four stages on one frequency f: notches at f · tan(π/8) and f · tan(3π/8), before warping.
    const t = Math.tan((Math.PI * 800) / RATE)
    for (const part of [Math.tan(Math.PI / 8), Math.tan((3 * Math.PI) / 8)]) {
      const hz = (RATE / Math.PI) * Math.atan(t * part)
      expect(phaserDb(hz, 800, 4, 0, 0, 0.5, RATE)).toBeLessThan(-45)
    }
    expect(phaserDb(800 * Math.tan(Math.PI / 8), 800, 4, 0, 0, 0.5, RATE)).toBeLessThan(-30)
    // As many notches as half the stages, whatever Spread does.
    for (const stages of [4, 6, 8, 10, 12]) {
      for (const spread of [0, 0.3, 1]) {
        let notches = 0
        let before = 0
        let falling = false
        for (let step = 0; step <= 6000; step++) {
          const db = phaserDb(20 * Math.pow(1000, step / 6000), 800, stages, spread, 0, 0.5, RATE)
          if (db > before && falling && before < -25) notches += 1
          falling = db < before
          before = db
        }
        expect(notches, `${stages} stages, spread ${spread}`).toBe(stages / 2)
      }
    }
  })

  it('lifts with feedback what the chain leaves in phase, and with negative feedback the notches', () => {
    // At the foot of the spectrum the chain turns nothing: 0.5 + 0.5 / (1 − 0.6).
    expect(phaserDb(20, 2000, 6, 0, 0.6, 0.5, RATE)).toBeCloseTo(20 * Math.log10(1.75), 0)
    const t = Math.tan((Math.PI * 800) / RATE)
    const notch = (RATE / Math.PI) * Math.atan(t * Math.tan(Math.PI / 8))
    // In the notch the chain is half a turn round: 0.5 − 0.5 / (1 + 0.6) with
    // feedback, 0.5 − 0.5 / (1 − 0.6) against it, and at −90 % a peak of some
    // 13 dB where the notch was (a little under: the loop is a sample longer).
    expect(phaserDb(notch, 800, 4, 0, 0.6, 0.5, RATE)).toBeCloseTo(20 * Math.log10(0.1875), 0)
    expect(phaserDb(notch, 800, 4, 0, -0.6, 0.5, RATE)).toBeCloseTo(20 * Math.log10(0.75), 0)
    expect(phaserDb(notch, 800, 4, 0, -0.9, 0.5, RATE)).toBeGreaterThan(12)
  })

  it.each([
    ['its defaults', { stages: 1, spread: 30, feedback: 40, mix: 0.5 }, 6],
    ['four stages alike, no feedback', { stages: 0, spread: 0, feedback: 0, mix: 0.5 }, 4],
    [
      'twelve stages spread wide, negative feedback',
      { stages: 4, spread: 100, feedback: -60, mix: 0.5 },
      12,
    ],
    ['eight stages, wet only', { stages: 2, spread: 50, feedback: 80, mix: 1 }, 8],
  ])('is the response of the device: %s', async (_name, values, count) => {
    const response = await impulseResponse('phaser', PHASER_PARAMS, {
      ...values,
      centerHz: 800,
      depth: 0,
    })
    for (const hz of [30, 100, 250, 331, 500, 800, 1200, 1931, 3000, 6000, 12000, 18000]) {
      expectSameDb(
        phaserDb(hz, 800, count, values.spread / 100, values.feedback / 100, values.mix, RATE),
        responseDb(response, hz),
        `${hz} Hz`,
      )
    }
  })

  it('follows the frequency the device is swept to, for every shape', async () => {
    for (const shape of [0, 1, 2, 3, 4]) {
      const device = await loadWasmDevice('phaser', RATE)
      set(device, PHASER_PARAMS, { centerHz: 800, depth: 60, rate: 1, shape, stereo: 90 })
      const block = new Float32Array(128)
      for (let i = 0; i < 123; i++) device.processBlock(block)
      const phase = meter(device, 0)
      const swept = (at: number): number => 800 * Math.pow(2, sweepWave(shape, at) * 0.6 * 2.5)
      expect(meter(device, 1) / swept(phase)).toBeCloseTo(1, 3)
      expect(meter(device, 2) / swept(phase + 0.25)).toBeCloseTo(1, 3)
      if (shape > 1) continue
      for (let i = 0; i < 40; i++) {
        hiss(block, i + 1)
        device.processBlock(block)
      }
      expect(meter(device, 1) / swept(meter(device, 0))).toBeCloseTo(1, 1)
    }
  })

  it('draws the notches where the chain has them', () => {
    const drawn = drawDisplay(phaser, PHASER_PARAMS, {
      values: { stages: 0, spread: 0, feedback: 0 },
    })
    const t = Math.tan((Math.PI * 800) / RATE)
    for (const part of [Math.tan(Math.PI / 8), Math.tan((3 * Math.PI) / 8)]) {
      const x = xOfHz((RATE / Math.PI) * Math.atan(t * part), PLOT)
      const deepest = Math.max(
        ...points(drawn)
          .filter((point) => Math.abs(point.x - x) < 0.4)
          .map((point) => point.y),
      )
      expect(deepest).toBeGreaterThan(PLOT.y + PLOT.h)
    }
  })

  it('stands where the device says its sweep is, and carries it forward by the shape', () => {
    const drawn = runDisplay(phaser, PHASER_PARAMS, 2 / 30, {
      values: { stereo: 0 },
      meters: { phase: 0, left: 1600, right: 1600 },
    })
    const [now] = dots(drawn).filter((dot) => dot.r === 2.75)
    expect(now.x).toBeCloseTo(xOfHz(1600, PLOT), 6)
    expect(now.y).toBe(RAIL)
    const swept = (at: number): number => 800 * Math.pow(2, sweepWave(1, at) * 0.6 * 2.5)
    const later = runDisplay(phaser, PHASER_PARAMS, 4 / 30, {
      values: { stereo: 0, shape: 1, rate: 1 },
      meters: { phase: 0.3, left: swept(0.3), right: swept(0.3) },
    })
    expect(dots(later).find((dot) => dot.r === 2.75)?.x).toBeCloseTo(
      xOfHz(swept(0.3 + 2 / 30), PLOT),
      4,
    )
    // The line in the accent stands on the same place, from the top of the response to the bar.
    const [mark] = strokes(drawn).filter((stroke) => stroke.colour === PLAIN_COLOURS.accent)
    expect(mark.points).toEqual([
      { x: expect.closeTo(xOfHz(1600, PLOT), 6), y: PLOT.y },
      { x: expect.closeTo(xOfHz(1600, PLOT), 6), y: RAIL },
    ])
    // A reading on every frame: the dot is on it and not a frame ahead; none for half a second: it stands.
    const every = (phase: number) => ({ left: swept(phase), right: swept(phase) })
    const moving = runDisplay(
      phaser,
      PHASER_PARAMS,
      1,
      { values: { stereo: 0, shape: 1, rate: 1 } },
      reported(0.3, 1, every),
    )
    expect(dots(moving).find((dot) => dot.r === 2.75)?.x).toBeCloseTo(
      xOfHz(swept(0.3 + 29 / 30), PLOT),
      5,
    )
    const standing = runDisplay(phaser, PHASER_PARAMS, 0.5, {
      values: { stereo: 0, shape: 1, rate: 1 },
      meters: { phase: 0.3, ...every(0.3) },
    })
    expect(dots(standing).find((dot) => dot.r === 2.75)?.x).toBeCloseTo(xOfHz(swept(0.3), PLOT), 6)
  })

  it('shows the range of the sweep: Depth 100 % is two and a half octaves each way', () => {
    const drawn = drawDisplay(phaser, PHASER_PARAMS, { values: { depth: 100, centerHz: 800 } })
    const ends = points(drawn).filter((point) => point.y === RAIL - 2.5 || point.y === RAIL + 2.5)
    const xs = [...new Set(ends.map((point) => point.x))].sort((a, b) => a - b)
    expect(xs.length).toBe(2)
    expect(Math.abs(xs[0] - xOfHz(800 / Math.pow(2, 2.5), PLOT))).toBeLessThanOrEqual(1)
    expect(Math.abs(xs[1] - xOfHz(800 * Math.pow(2, 2.5), PLOT))).toBeLessThanOrEqual(1)
    // By hand, at the Depth it starts with: 60 % is an octave and a half each way, 282.84 Hz to 2262.74 Hz, shaded.
    const usual = drawDisplay(phaser, PHASER_PARAMS, { values: { centerHz: 800 } })
    const shade = usual.calls.find(
      (call) => call.name === 'fillRect' && call.args[1] === PLOT.y && call.args[3] === PLOT.h,
    )
    expect(shade?.args[0]).toBeCloseTo(xOfHz(282.843, PLOT), 3)
    expect((shade?.args[0] as number) + (shade?.args[2] as number)).toBeCloseTo(
      xOfHz(2262.742, PLOT),
      3,
    )
  })
})

describe('the Rotary display', () => {
  it('swings a microphone as the device does', () => {
    // Horn Depth 0.6 at Distance 0.3: 0.6 · 0.75 · (1 − 0.18).
    const swing = rotarySwing('horn', 0.6, 0.3)
    expect(swing).toBeCloseTo(0.369, 6)
    expect(rotarySwing('drum', 0.5, 0.3)).toBeCloseTo(0.5 * 0.5 * 0.85, 9)
    // Facing the microphone it is the make-up alone, facing away 1 − swing of it.
    const makeup = 1 / Math.sqrt((1 - swing / 2) ** 2 + 0.125 * swing * swing)
    expect(makeup).toBeCloseTo(1.2109, 3)
    expect(rotaryGain('horn', 0, -1, swing, 0)).toBeCloseTo(makeup, 9)
    expect(rotaryGain('horn', 0.5, -1, swing, 0)).toBeCloseTo(makeup * (1 - swing), 9)
    // By hand: Horn Depth 1 close up swings 0.75, and the make-up is
    // 1 / √(0.625² + 0.125 · 0.75²) = 1 / √0.4609375 = 1.472919. Facing the
    // microphone that, a quarter turn off 0.625 of it, facing away a quarter of it.
    expect(rotarySwing('horn', 1, 0)).toBe(0.75)
    expect(rotaryGain('horn', 0, -1, 0.75, 0)).toBeCloseTo(1.472919, 5)
    expect(rotaryGain('horn', 0.25, -1, 0.75, 0)).toBeCloseTo(0.920574, 5)
    expect(rotaryGain('horn', 0.5, -1, 0.75, 0)).toBeCloseTo(0.36823, 5)
    // Drum Depth 1 at full Distance swings 0.25: 1 / √(0.875² + 0.125 · 0.25²) = 1.13707.
    expect(rotarySwing('drum', 1, 1)).toBeCloseTo(0.25, 9)
    expect(rotaryGain('drum', 0, 1, 0.25, 0)).toBeCloseTo(1.13707, 5)
    // The make-up keeps the mean power of a whole turn where it was.
    let power = 0
    for (let step = 0; step < 360; step++)
      power += rotaryGain('horn', step / 360, 1, swing, 0.7) ** 2
    expect(power / 360).toBeCloseTo(1, 6)
  })

  it('has the microphones where the device has them', () => {
    // Full Spread: a fifth of a turn either side for the horn, half as far for the drum; the left is the lower angle.
    expect(rotaryGain('horn', -0.2, -1, 0.5, 1)).toBeCloseTo(rotaryGain('horn', 0, -1, 0.5, 0), 9)
    expect(rotaryGain('horn', 0.2, 1, 0.5, 1)).toBeCloseTo(rotaryGain('horn', 0, -1, 0.5, 0), 9)
    expect(rotaryGain('drum', -0.1, -1, 0.5, 1)).toBeCloseTo(rotaryGain('drum', 0, -1, 0.5, 0), 9)
    expect(rotaryGain('drum', 0.1, 1, 0.5, 1)).toBeCloseTo(rotaryGain('drum', 0, -1, 0.5, 0), 9)
  })

  /** Play a tone through the cabinet and keep, for each cycle of it, how loud each side was and where a rotor pointed. */
  async function turn(
    values: Readonly<Record<string, number>>,
    hz: number,
    seconds: number,
    angle: 0 | 1,
  ): Promise<{ device: WasmDeviceHarness; left: number[]; right: number[]; angles: number[] }> {
    const device = await loadWasmDevice('rotary', RATE)
    set(device, ROTARY_PARAMS, { drive: 0, mix: 1, ...values })
    // A block is a whole number of cycles of the tone, so its level is the same wherever it starts.
    const frames = 960
    const block = new Float32Array(frames)
    const left: number[] = []
    const right: number[] = []
    const angles: number[] = []
    for (let done = 0; done < seconds * RATE; done += frames) {
      for (let i = 0; i < frames; i++) block[i] = 0.25 * Math.sin(((done + i) * hz * TWO_PI) / RATE)
      device.processBlock(block)
      const rms = (pointer: number): number =>
        Math.sqrt(device.view(pointer, frames).reduce((sum, s) => sum + s * s, 0) / frames)
      left.push(rms(device.device.device_out_left()))
      right.push(rms(device.device.device_out_right()))
      // The reading is of the end of the block; its level is of the middle.
      angles.push(meter(device, angle))
    }
    return { device, left, right, angles }
  }

  it('gives the drum the level the device gives it, at the angle the device reports', async () => {
    const { left, right, angles } = await turn(
      { speed: 0, balance: 0, drumDepth: 1, distance: 0, spread: 1 },
      150,
      3.5,
      1,
    )
    const swing = rotarySwing('drum', 1, 0)
    const loudest = Math.max(...left.slice(25))
    const facing = rotaryGain('drum', 0, -1, swing, 0)
    // Half a block on from the middle of the block the drum has turned back by 0.67 Hz · 10 ms.
    const middle = 0.67 * (480 / RATE)
    for (let i = 25; i < left.length; i++) {
      const at = angles[i] + middle
      expect(left[i] / loudest).toBeCloseTo(rotaryGain('drum', at, -1, swing, 1) / facing, 1)
      expect(right[i] / loudest).toBeCloseTo(rotaryGain('drum', at, 1, swing, 1) / facing, 1)
    }
    // It swings the whole way the formula says: down to half at full Depth, close up.
    expect(Math.min(...left.slice(25)) / loudest).toBeCloseTo(0.5, 1)
  })

  it('has the horn loudest at each microphone when the device points it there', async () => {
    const { left, right, angles } = await turn(
      { speed: 0, balance: 1, hornDepth: 1, distance: 0, spread: 1 },
      3000,
      3.5,
      0,
    )
    const loudestAt = (levels: number[]): number => {
      let best = 25
      for (let i = 25; i < levels.length; i++) if (levels[i] > levels[best]) best = i
      // Back to the middle of the block: the horn's angle rises.
      return wrap(angles[best] - 0.8 * (480 / RATE))
    }
    const off = (a: number, b: number): number => Math.abs(wrap(a - b + 0.5) - 0.5)
    expect(off(loudestAt(left), -0.2)).toBeLessThan(0.02)
    expect(off(loudestAt(right), 0.2)).toBeLessThan(0.02)
  })

  it('reports the speeds the display takes for Slow and Fast, the horn rising and the drum falling', async () => {
    const slow = await turn({ speed: 0 }, 440, 1, 0)
    expect(meter(slow.device, 2)).toBeCloseTo(0.8, 5)
    expect(meter(slow.device, 3)).toBeCloseTo(0.67, 5)
    const step = (angles: number[], i: number): number =>
      wrap(angles[i] - angles[i - 1] + 0.5) - 0.5
    expect(step(slow.angles, 20)).toBeCloseTo(0.8 * (960 / RATE), 4)
    const drum = await turn({ speed: 0 }, 440, 1, 1)
    expect(step(drum.angles, 20)).toBeCloseTo(-0.67 * (960 / RATE), 4)
    const fast = await turn({ speed: 1, acceleration: 4 }, 440, 4, 0)
    expect(meter(fast.device, 2)).toBeCloseTo(6.7, 2)
    expect(meter(fast.device, 3)).toBeCloseTo(5.8, 2)
  })

  interface Kept {
    horn: { turn: number }
    drum: { turn: number }
  }

  /** The readings of a cabinet turning steadily, as they arrive: thirty times a second. */
  const turning =
    (horn: number, drum: number) =>
    (time: number): { meters: Record<string, number> } => {
      const heard = Math.floor(time * 30 + 1e-9) / 30
      return {
        meters: {
          hornAngle: wrap(0.2 + horn * heard),
          drumAngle: wrap(0.37 - drum * heard),
          hornSpeed: horn,
          drumSpeed: drum,
        },
      }
    }

  it('says at rest what the rotors would do at the Speed it is set to', () => {
    expect(drawDisplay(rotary, ROTARY_PARAMS).words()).toEqual(['HORN  0.8 Hz', 'DRUM  0.7 Hz'])
    expect(drawDisplay(rotary, ROTARY_PARAMS, { values: { speed: 1 } }).words()).toEqual([
      'HORN  6.7 Hz',
      'DRUM  5.8 Hz',
    ])
    expect(drawDisplay(rotary, ROTARY_PARAMS, { values: { speed: 2 } }).words()).toEqual([
      'HORN  0.0 Hz',
      'DRUM  0.0 Hz',
    ])
  })

  it('turns each rotor with the device, a fast one never backwards', () => {
    const state = rotary.init?.() as Kept
    // Fast: the horn turns 0.22 of a turn between two readings.
    runDisplay(rotary, ROTARY_PARAMS, 2, { values: { speed: 1 }, state }, turning(6.7, 5.8))
    // The last frame is one after a reading: where the device said, and a frame of turning on.
    const seen = 2 - 1 / 60
    expect(Math.abs(state.horn.turn - (0.2 + 6.7 * seen))).toBeLessThan(1e-3)
    expect(Math.abs(state.drum.turn - (0.37 - 5.8 * seen))).toBeLessThan(1e-3)
    // And on the frame the reading arrives, on the reading itself: not a frame ahead of it.
    const onReading = rotary.init?.() as Kept
    runDisplay(
      rotary,
      ROTARY_PARAMS,
      2 - 1 / 60,
      { values: { speed: 1 }, state: onReading },
      turning(6.7, 5.8),
    )
    expect(Math.abs(onReading.horn.turn - (0.2 + 6.7 * (2 - 2 / 60)))).toBeLessThan(1e-3)
    expect(Math.abs(onReading.drum.turn - (0.37 - 5.8 * (2 - 2 / 60)))).toBeLessThan(1e-3)
  })

  it('marks at each microphone the level the formula gives for where the rotor points', () => {
    const state = rotary.init?.() as Kept
    const drawn = runDisplay(rotary, ROTARY_PARAMS, 1, { state }, turning(0.8, 0.67))
    // A rotor's scope on a plate at rest: 44 high, its foot the level of nothing and 1.5 two under its top.
    const level = (row: 0 | 1, gain: number): number => 4 + row * 48 + 44 - (gain / 1.5) * 42
    // Where a rotor points is where the device last said, carried on to the frame.
    const off = (a: number, b: number): number => Math.abs(wrap(a - b + 0.5) - 0.5)
    expect(off(state.horn.turn, 0.2 + 0.8 * (1 - 1 / 60))).toBeLessThan(1e-3)
    expect(off(state.drum.turn, 0.37 - 0.67 * (1 - 1 / 60))).toBeLessThan(1e-3)
    const marks = dots(drawn).filter((dot) => dot.r === 2.5)
    expect(marks.length).toBe(2)
    expect(marks[0].y).toBeCloseTo(
      level(0, rotaryGain('horn', state.horn.turn, -1, rotarySwing('horn', 0.6, 0.3), 0.7)),
      6,
    )
    expect(marks[1].y).toBeCloseTo(
      level(1, rotaryGain('drum', state.drum.turn, -1, rotarySwing('drum', 0.5, 0.3), 0.7)),
      6,
    )
    // No rotor is on its way to another speed: no arrow, only the horn and the drum's scoop are filled shapes.
    expect(drawn.calls.filter((call) => call.name === 'closePath').length).toBe(2)
  })

  it('draws the level over the last moments: a second and a half, or four turns of a fast rotor', () => {
    expect(scopeSpanSec(0.8, 1.5)).toBe(1.5)
    expect(scopeSpanSec(0, 1.5)).toBe(1.5)
    expect(scopeSpanSec(6.7, 1.5)).toBeCloseTo(4 / 6.7, 9)
    const level = (row: 0 | 1, gain: number): number => 4 + row * 48 + 44 - (gain / 1.5) * 42
    const lines = (values: Record<string, number>): Stroke[] =>
      strokes(drawDisplay(rotary, ROTARY_PARAMS, { values })).filter(
        (stroke) => stroke.points.length > 10,
      )
    // At rest the line is what the rotor would do at its speed. One microphone: one line a rotor.
    const fast = lines({ speed: 1, spread: 0 })
    expect(fast.length).toBe(2)
    // Fast, its oldest point is four whole turns back: as high as now.
    for (const line of fast)
      expect(line.points[0].y).toBeCloseTo(line.points[line.points.length - 1].y, 3)
    // Slow, the horn's is 0.8 Hz · 1.5 s = 1.2 turns back and the drum's 0.67 Hz · 1.5 s on from 0.37.
    const slow = lines({ speed: 0, spread: 0 })
    const horn = rotarySwing('horn', 0.6, 0.3)
    const drum = rotarySwing('drum', 0.5, 0.3)
    expect(slow[0].points[0].y).toBeCloseTo(level(0, rotaryGain('horn', -1.2, -1, horn, 0)), 3)
    expect(slow[1].points[0].y).toBeCloseTo(
      level(1, rotaryGain('drum', 0.37 + 0.67 * 1.5, -1, drum, 0)),
      3,
    )
    // A point a pixel, and the right microphone's line behind and fainter where Spread sets it apart.
    expect(slow[0].points.length).toBeLessThanOrEqual(128)
    const apart = lines({ speed: 0 })
    expect(apart.length).toBe(4)
    expect(apart.map((stroke) => stroke.alpha < 0.5)).toEqual([true, false, true, false])
  })

  it('shows a rotor on its way to another speed', () => {
    // Set to Fast, and the device says the rotors are not there yet.
    const drawn = runDisplay(rotary, ROTARY_PARAMS, 0.5, { values: { speed: 1 } }, turning(3, 1.2))
    expect(drawn.words()).toEqual(['HORN  3.0 Hz', 'DRUM  1.2 Hz'])
    expect(drawn.calls.filter((call) => call.name === 'closePath').length).toBe(4)
  })

  it('is at rest while the rotors stand: the device turns them only while it has sound', () => {
    const state = rotary.init?.() as Kept
    const drawn = runDisplay(rotary, ROTARY_PARAMS, 1, {
      values: { speed: 0 },
      state,
      meters: { hornAngle: 0.31, drumAngle: 0.62, hornSpeed: 6.7, drumSpeed: 5.8 },
    })
    // They take up again at the speed they had, and no arrow claims they are changing now.
    expect(drawn.words()).toEqual(['HORN  6.7 Hz', 'DRUM  5.8 Hz'])
    expect(drawn.calls.filter((call) => call.name === 'closePath').length).toBe(2)
    // And they point where the device has them, not where carrying on would have taken them.
    expect(state.horn.turn).toBeCloseTo(0.31, 6)
    expect(state.drum.turn).toBeCloseTo(0.62, 6)
  })

  // The horn on a plate at rest: its hub at (27, 20), its path 14 px out, a microphone 4 to 7 px beyond.
  const hub = { x: 27, y: 20 }
  /** A place so far round to the left of the front, which is down the display, in turns. */
  const round = (turns: number, out: number): [number, number] => [
    hub.x - out * Math.sin(turns * TWO_PI),
    hub.y + out * Math.cos(turns * TWO_PI),
  ]

  it("has Spread on a point at the horn's left microphone, which stands still", () => {
    for (const [spread, distance] of [
      [0.7, 0.3],
      [0, 0.3],
      [1, 0],
      [0.35, 1],
    ]) {
      const values = { spread, distance }
      const point = pointOf(rotary, ROTARY_PARAMS, values)
      expect(point.key).toBe('spread')
      // A fifth of a turn off the front at full Spread, further out with Distance.
      const [x, y] = round(0.2 * spread, 18 + 3 * distance)
      expect(point.x).toBeCloseTo(x, 9)
      expect(point.y).toBeCloseTo(y, 9)
      // The microphone is drawn there, and the ring round it.
      const drawn = drawDisplay(rotary, ROTARY_PARAMS, { values })
      expect(dots(drawn)).toContainEqual({ x: point.x, y: point.y, r: 1.75 })
      expect(dots(drawn)).toContainEqual({ x: point.x, y: point.y, r: 3 })
      // It does not turn with the rotors.
      const turned = drawDisplay(rotary, ROTARY_PARAMS, {
        values,
        meters: { hornAngle: 0.4, drumAngle: 0.1, hornSpeed: 6.7, drumSpeed: 5.8 },
      })
      expect(dots(turned)).toContainEqual({ x: point.x, y: point.y, r: 3 })
    }
    // One ring only: the drum's microphones and the horn's right one are not points.
    expect(dots(drawDisplay(rotary, ROTARY_PARAMS)).filter((dot) => dot.r === 3).length).toBe(1)
    expect(
      dots(drawDisplay(rotary, ROTARY_PARAMS, { hot: 'spread' })).filter((dot) => dot.r === 4)
        .length,
    ).toBe(1)
  })

  it('takes Spread from how far round the horn the point is dragged, and leaves it alone when it is only taken', () => {
    for (const spread of [0, 0.2, 0.7, 1]) {
      const point = pointOf(rotary, ROTARY_PARAMS, { spread })
      expect(point.drag(point.x, point.y)).toEqual({ spread })
    }
    const point = pointOf(rotary, ROTARY_PARAMS)
    // A tenth of a turn round is half of it, however far out the pointer is.
    expect(point.drag(...round(0.1, 19)).spread).toBeCloseTo(0.5, 9)
    expect(point.drag(...round(0.1, 60)).spread).toBeCloseTo(0.5, 9)
    expect(point.drag(...round(0.05, 8)).spread).toBeCloseTo(0.25, 9)
    const half = pointOf(rotary, ROTARY_PARAMS, { spread: 0.5 })
    expect(half.x).toBeCloseTo(round(0.1, 18.9)[0], 9)
    expect(half.y).toBeCloseTo(round(0.1, 18.9)[1], 9)
  })

  it('stops at the ends of Spread, the nearer one past them, and a double press gives the default', () => {
    const point = pointOf(rotary, ROTARY_PARAMS)
    // Straight in front the microphones are one; a fifth of a turn round they are furthest apart.
    expect(point.drag(hub.x, hub.y + 40)).toEqual({ spread: 0 })
    expect(point.drag(...round(0.2, 19)).spread).toBeCloseTo(1, 9)
    // Far off to the left and over the top it stays at the most, far to the right at none.
    expect(point.drag(-900, hub.y)).toEqual({ spread: 1 })
    expect(point.drag(hub.x - 1, -900)).toEqual({ spread: 1 })
    expect(point.drag(900, hub.y)).toEqual({ spread: 0 })
    expect(point.drag(hub.x + 5, hub.y + 900)).toEqual({ spread: 0 })
    // The two ends meet opposite the middle of the travel: 0.6 of a turn round.
    expect(point.drag(...round(0.59, 30))).toEqual({ spread: 1 })
    expect(point.drag(...round(0.61, 30))).toEqual({ spread: 0 })
    expect(pointOf(rotary, ROTARY_PARAMS, { spread: 0.1 }).reset?.()).toEqual({ spread: 0.7 })
  })
})

describe('the modulation plates together', () => {
  it('set no type under 8 px, in any mode and with a point in hand', () => {
    const drawings: [string, RecordingContext][] = [
      ...[0, 1, 2, 3].map((mode): [string, RecordingContext] => [
        `tremolo in mode ${mode}`,
        drawDisplay(MODULATION_FACES.tremolo.display, TREMOLO_PARAMS, { values: { mode } }),
      ]),
      ['chorus', drawDisplay(chorus, CHORUS_PARAMS)],
      ['flanger', drawDisplay(flanger, FLANGER_PARAMS, { hot: 'delayMs' })],
      ['phaser', drawDisplay(phaser, PHASER_PARAMS, { hot: 'centerHz' })],
      ['rotary', drawDisplay(rotary, ROTARY_PARAMS)],
    ]
    let words = 0
    for (const [what, drawn] of drawings) {
      words += drawn.words().length
      for (const call of drawn.calls) {
        if (call.name !== 'set font') continue
        const size = Number(/(\d+(?:\.\d+)?)px/.exec(String(call.args[0]))?.[1])
        expect(size, `${what}: "${String(call.args[0])}"`).toBeGreaterThanOrEqual(8)
      }
    }
    // Pan, Harmonic and Vibrato name their two ends, the Chorus its Delay, the points what they are set to, the Rotary its rotors.
    expect(words).toBe(6 + 1 + 1 + 1 + 2)
  })

  it('gives every knob of the opened Rotary a word that fits under it', () => {
    const { labels } = MODULATION_FACES.rotary
    for (const [name, spec] of Object.entries(ROTARY_PARAMS)) {
      const words = (labels?.[name] ?? spec.name).split(' ')
      expect(Math.max(...words.map((word) => word.length)), name).toBeLessThanOrEqual(9)
    }
  })
})
