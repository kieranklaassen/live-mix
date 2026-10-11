// The truth of Vessel's display: its tables and laws against the numbers of
// `cpp/devices/vessel/bodies.h` and `vessel.h`, its curve against the compiled
// device's own answer to an impulse, what it draws against that curve, each
// handle against the parameter it sets, and what moves against the readings
// the device gives.

import { describe, expect, it } from 'vitest'

import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS, xOfHz, yOfDb } from '../components/display-kit'
import {
  VESSEL_BODIES,
  VESSEL_FACES,
  VESSEL_FOOT_DB,
  VESSEL_OVER_HALF,
  VESSEL_OVER_HIGH,
  VESSEL_TOP_DB,
  ringText,
  vesselBodyDb,
  vesselLayout,
  vesselLean,
  vesselLevels,
  vesselListenAt,
  vesselModeSeconds,
  vesselModeShape,
  vesselModel,
  vesselOutDb,
  vesselOver,
  vesselRingSeconds,
  vesselRingX,
  vesselStartGain,
  vesselTrim,
  type VesselSetting,
} from '../components/displays/vessel'
import { type DisplayHandle, type DisplayHold, type DisplayView } from '../components/plate-display'
import {
  drawDisplay,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type RecordingContext,
} from './display-harness'

type Values = Readonly<Record<string, number>>

const RATE = 48000
const display = VESSEL_FACES.vessel.display
const descriptor = stockDescriptors().get('vessel')
if (!descriptor) throw new Error('vessel is not a stock device')
const params = descriptor.params

/** The two shapes a plate gives the display: beside the knobs of a plate lying flat, and across a plate standing upright. */
const FLAT = { width: 128, height: 100 }
const UPRIGHT = { width: 204, height: 100 }
const SHAPES = [FLAT, UPRIGHT]

/** The device's defaults (device.json), as the display reads them. */
const DEFAULTS: VesselSetting = {
  body: 1,
  size: 1,
  material: 0.5,
  opening: 0.5,
  position: 0.3,
  tone: 0.5,
  width: 0.5,
  mix: 0.7,
}
const settingOf = (values: Values = {}): VesselSetting => ({ ...DEFAULTS, ...values })

const view = (values: Values = {}, size = FLAT): DisplayView =>
  viewOf(display, params, { values, ...size })
const handlesOf = (values: Values = {}, size = FLAT): readonly DisplayHandle[] =>
  display.handles?.(view(values, size)) ?? []
const handleOf = (key: string, values: Values = {}, size = FLAT): DisplayHandle => {
  const found = handlesOf(values, size).find((handle) => handle.key === key)
  if (!found) throw new Error(`no ${key} handle`)
  return found
}

// --- What was drawn -----------------------------------------------------------

interface DrawnPath {
  points: [number, number][]
  how: 'stroke' | 'fill'
  colour: string
  width: number
}

/** Every path the display stroked or filled, with the ink it was drawn in. */
function pathsOf(drawn: RecordingContext): DrawnPath[] {
  const paths: DrawnPath[] = []
  let points: [number, number][] = []
  let stroke = ''
  let fill = ''
  let width = 1
  for (const { name, args } of drawn.calls) {
    if (name === 'beginPath') points = []
    else if (name === 'moveTo' || name === 'lineTo') points.push([Number(args[0]), Number(args[1])])
    else if (name === 'set strokeStyle') stroke = String(args[0])
    else if (name === 'set fillStyle') fill = String(args[0])
    else if (name === 'set lineWidth') width = Number(args[0])
    else if (name === 'stroke') paths.push({ points, how: 'stroke', colour: stroke, width })
    else if (name === 'fill') paths.push({ points, how: 'fill', colour: fill, width })
  }
  return paths
}

/** The curves as drawn: the long lines in the ink; what comes out is the heavy one, the body alone the fine one. */
function curvesOf(drawn: RecordingContext): {
  out: [number, number][]
  alone?: [number, number][]
} {
  const long = pathsOf(drawn).filter(
    (path) => path.how === 'stroke' && path.colour === PLAIN_COLOURS.ink && path.points.length > 60,
  )
  const out = long.find((path) => path.width === 1.5)
  if (!out) throw new Error('no curve was drawn')
  return { out: out.points, alone: long.find((path) => path.width === 1)?.points }
}

/** The marks on the resonances: upright lines in the accent, as [x, foot, top]. */
function stemsOf(drawn: RecordingContext): [number, number, number][] {
  return pathsOf(drawn)
    .filter(
      (path) =>
        path.how === 'stroke' &&
        path.colour === PLAIN_COLOURS.accent &&
        path.points.length === 2 &&
        path.points[0][0] === path.points[1][0],
    )
    .map((path) => [path.points[0][0], path.points[0][1], path.points[1][1]])
}

/** The arrowheads at the top of the box: filled triangles in the ink with their point on `top`, as [x of the point, half width, height]. */
function headsOf(drawn: RecordingContext, top: number): [number, number, number][] {
  return pathsOf(drawn)
    .filter(
      (path) =>
        path.how === 'fill' &&
        path.colour === PLAIN_COLOURS.ink &&
        path.points.length === 3 &&
        path.points[1][1] === top,
    )
    .map((path) => [
      path.points[1][0],
      (path.points[2][0] - path.points[0][0]) / 2,
      path.points[0][1] - top,
    ])
}

const yOf = (db: number, size = FLAT, body = DEFAULTS.body): number => {
  const { curve } = vesselLayout(size, body)
  return Math.min(
    curve.y + curve.h,
    Math.max(curve.y, yOfDb(db, curve, VESSEL_TOP_DB, VESSEL_FOOT_DB)),
  )
}

// --- The laws -----------------------------------------------------------------

describe('the laws of the body, by the numbers of bodies.h and vessel.h', () => {
  it('has the six bodies of kBodies: their lowest resonance and how many they have', () => {
    // bodies.h, kBodies: base_hz and count of Bottle, Open pipe, Stopped pipe, Shell, Drum, Soundboard.
    expect(VESSEL_BODIES.map((body) => body.baseHz)).toEqual([110, 130.81, 65.41, 620, 82.41, 98])
    expect(VESSEL_BODIES.map((body) => body.modes.length)).toEqual([8, 16, 16, 14, 16, 16])
    // An open pipe has every multiple, a stopped one the odd ones, an octave lower.
    expect(VESSEL_BODIES[1].modes.map((mode) => mode.ratio)).toEqual(
      Array.from({ length: 16 }, (_, k) => k + 1),
    )
    expect(VESSEL_BODIES[2].modes.map((mode) => mode.ratio)).toEqual(
      Array.from({ length: 16 }, (_, k) => 2 * k + 1),
    )
    // The first of each table's other bodies, as the header has them: ratio, gain, ring, lobes, phase.
    expect(VESSEL_BODIES[0].modes[1]).toEqual({
      ratio: 5.3,
      gain: 0.5,
      ring: 0.6,
      lobes: 1,
      phase: 0.5,
    })
    expect(VESSEL_BODIES[3].modes[1]).toEqual({
      ratio: 1.17,
      gain: 1,
      ring: 1,
      lobes: 1.3,
      phase: 0,
    })
    expect(VESSEL_BODIES[4].modes[1]).toEqual({
      ratio: 1.593,
      gain: 0.9,
      ring: 0.8,
      lobes: 1,
      phase: 0,
    })
    expect(VESSEL_BODIES[5].modes[15]).toEqual({
      ratio: 13.3,
      gain: 0.62,
      ring: 0.26,
      lobes: 6.4,
      phase: 0.5,
    })
  })

  it('rings as ring_seconds and mode_seconds say', () => {
    // bodies.h: ring_seconds = 0.04 * 100^material.
    expect(vesselRingSeconds(0)).toBeCloseTo(0.04, 9)
    expect(vesselRingSeconds(0.5)).toBeCloseTo(0.4, 9)
    expect(vesselRingSeconds(1)).toBeCloseTo(4, 9)
    // mode_seconds = ring_seconds * ring * ratio^-slope, the slope 0.9 dead to 0.3 ringing.
    const fourth = VESSEL_BODIES[1].modes[3]
    expect(vesselModeSeconds(fourth, 0.5)).toBeCloseTo(0.4 * Math.pow(4, -0.6), 9)
    expect(vesselModeSeconds(fourth, 0)).toBeCloseTo(0.04 * Math.pow(4, -0.9), 9)
    expect(vesselModeSeconds(fourth, 1)).toBeCloseTo(4 * Math.pow(4, -0.3), 9)
    // The drum's lowest has ring 0.35.
    expect(vesselModeSeconds(VESSEL_BODIES[4].modes[0], 1)).toBeCloseTo(1.4, 9)
  })

  it('is heard from listen_at, and a mode is heard there as mode_shape says', () => {
    // bodies.h: listen_at = 0.03 + (far - 0.03) * position; far is 0.5 for the bottle and the open pipe, 0.97 for the rest.
    expect(VESSEL_BODIES.map((body) => vesselListenAt(body, 1))).toEqual([
      0.5, 0.5, 0.97, 0.97, 0.97, 0.97,
    ])
    for (const body of VESSEL_BODIES) expect(vesselListenAt(body, 0)).toBeCloseTo(0.03, 12)
    expect(vesselListenAt(VESSEL_BODIES[1], 0.3)).toBeCloseTo(0.171, 12)
    // mode_shape = |sin(pi (lobes x + phase))|: in the middle of an open pipe the even multiples are not heard.
    const pipe = VESSEL_BODIES[1].modes
    expect(vesselModeShape(pipe[0], 0.5)).toBeCloseTo(1, 12)
    expect(vesselModeShape(pipe[1], 0.5)).toBeCloseTo(0, 12)
    expect(vesselModeShape(pipe[2], 0.5)).toBeCloseTo(1, 12)
    expect(vesselModeShape(pipe[1], 0.171)).toBeCloseTo(Math.sin(Math.PI * 2 * 0.171), 12)
  })

  it('tunes each resonance as Vessel::tune does', () => {
    const model = vesselModel(DEFAULTS, RATE)
    // mode_hz = base_hz * ratio / size.
    expect(model.peaks.map((peak) => peak.hz)[3]).toBeCloseTo(130.81 * 4, 9)
    expect(vesselModel(settingOf({ size: 4 }), RATE).peaks[0].hz).toBeCloseTo(130.81 / 4, 9)
    // mode_q = 0.45473 * hz * seconds, between 0.7 and 1500.
    expect(model.peaks[0].q).toBeCloseTo(0.45473 * 130.81 * 0.4, 6)
    expect(vesselModel(settingOf({ body: 4, size: 4, material: 0 }), RATE).peaks[0].q).toBe(0.7)
    expect(vesselModel(settingOf({ body: 3, size: 0.25, material: 1 }), RATE).peaks[0].q).toBe(1500)
    // Its strength: the table's gain, the shape at the place, Opening's tilt ratio^-(1.5 (1 - opening)).
    const second = 0.92 * Math.abs(Math.sin(Math.PI * 2 * 0.171)) * Math.pow(2, -0.75)
    expect(model.peaks[1].strength).toBeCloseTo(second, 9)
    // level_trim: the gain t on the resonances at which they and the direct sound d pass a sound with equal
    // power in every octave at its own level: t^2 A + 2 t d C + d^2 = 1, with A = 0.2274 sum s^2 (1 + lean^2) / q
    // and C = 0.2274 sum s / q. At most 63.
    const powerSum = model.peaks.reduce(
      (sum, peak) => sum + (peak.strength * peak.strength * (1 + peak.lean * peak.lean)) / peak.q,
      0,
    )
    const stepSum = model.peaks.reduce((sum, peak) => sum + peak.strength / peak.q, 0)
    const { trim, direct } = model
    expect(trim).toBeCloseTo(vesselTrim(powerSum, stepSum, direct), 12)
    expect(
      trim * trim * 0.2274 * powerSum + 2 * trim * direct * 0.2274 * stepSum + direct * direct,
    ).toBeCloseTo(1, 9)
    expect(
      vesselModel(settingOf({ body: 3, size: 0.25, material: 1, opening: 0 }), RATE).trim,
    ).toBeLessThanOrEqual(63)
    expect(vesselTrim(1e-12, 0, 0.4)).toBe(63)
    // opening_direct = 0.4 + 0.3 * opening^2: the sound itself is under the body at every Opening.
    expect(direct).toBeCloseTo(0.475, 12)
    expect(vesselModel(settingOf({ opening: 1 }), RATE).direct).toBeCloseTo(0.7, 12)
    expect(vesselModel(settingOf({ opening: 0 }), RATE).direct).toBeCloseTo(0.4, 12)
    // Tone is 12 dB each way.
    expect(model.toneGain).toBeCloseTo(1, 12)
    expect(20 * Math.log10(vesselModel(settingOf({ tone: 1 }), RATE).toneGain)).toBeCloseTo(12, 9)
    expect(20 * Math.log10(vesselModel(settingOf({ tone: 0 }), RATE).toneGain)).toBeCloseTo(-12, 9)
  })

  it('leans each resonance to a side as mode_lean does', () => {
    // bodies.h, mode_lean: odd ones one way and even ones the other, by 0.9 of Width; none of it
    // under 80 Hz, all of it from 250 Hz up.
    expect(vesselLean(1, 250, 1)).toBeCloseTo(0.9, 12)
    expect(vesselLean(0, 250, 1)).toBeCloseTo(-0.9, 12)
    expect(vesselLean(3, 4000, 0.5)).toBeCloseTo(0.45, 12)
    expect(vesselLean(1, 165, 1)).toBeCloseTo(0.45, 12)
    expect(vesselLean(1, 80, 1)).toBeCloseTo(0, 12)
    expect(vesselLean(2, 30, 1)).toBeCloseTo(0, 12)
    expect(vesselLean(5, 1000, 0)).toBeCloseTo(0, 12)
    // The open pipe at its defaults: 130.81 Hz leans by (130.81 - 80) / 170 of 0.45, 261.62 Hz by all of it.
    const model = vesselModel(DEFAULTS, RATE)
    expect(model.peaks[0].lean).toBeCloseTo((-0.45 * (130.81 - 80)) / 170, 9)
    expect(model.peaks[1].lean).toBeCloseTo(0.45, 9)
  })

  it('starts the level match as start_gain does', () => {
    // bodies.h, start_gain: the gain g at which the mean over the readings of min(g^2 heard, 1.26^2) is 1,
    // between 0.355 and 4.
    const all = (power: number): number[] => Array.from({ length: 42 }, () => power)
    expect(vesselStartGain(all(1))).toBeCloseTo(1, 3)
    expect(vesselStartGain(all(4))).toBeCloseTo(0.5, 3)
    expect(vesselStartGain(all(0.01))).toBe(4)
    expect(vesselStartGain(all(100))).toBe(0.355)
    // Half the readings far over the ceiling, half at a quarter: (1.26^2 + 0.25 g^2) / 2 = 1.
    const uneven = all(16).map((power, n) => (n % 2 === 0 ? power : 0.25))
    expect(vesselStartGain(uneven)).toBeCloseTo(Math.sqrt((2 - 1.26 * 1.26) / 0.25), 3)
    // A body that rings hard is turned up more at rest than a dead one: the hold will keep its resonances.
    const ringing = vesselModel(settingOf({ material: 1 }), RATE).start
    const dead = vesselModel(settingOf({ material: 0 }), RATE).start
    expect(ringing).toBeGreaterThan(dead)
    expect(dead).toBeGreaterThan(0.355)
    expect(ringing).toBeLessThanOrEqual(4)
  })

  it('fades a resonance out over the top of the range and under 20 Hz', () => {
    // bodies.h, in_range: the ceiling is 18 kHz or 0.45 of the rate, faded over its top 15 %; 12 to 20 Hz at the foot.
    const small = vesselModel(settingOf({ body: 3, size: 0.25, opening: 1, position: 0.37 }), RATE)
    const ceiling = 18000
    small.peaks.forEach((peak, k) => {
      const mode = VESSEL_BODIES[3].modes[k]
      const whole = mode.gain * vesselModeShape(mode, vesselListenAt(VESSEL_BODIES[3], 0.37))
      const fade = Math.min(1, Math.max(0, (ceiling - peak.hz) / (0.15 * ceiling)))
      expect(peak.strength).toBeCloseTo(whole * fade, 9)
    })
    // The stopped pipe at its largest: 65.41 / 4 = 16.35 Hz, a little over half faded in.
    const deep = vesselModel(settingOf({ body: 2, size: 4, opening: 1 }), RATE)
    const first = VESSEL_BODIES[2].modes[0]
    const heard = first.gain * vesselModeShape(first, vesselListenAt(VESSEL_BODIES[2], 0.3))
    expect(deep.peaks[0].strength).toBeCloseTo((heard * (65.41 / 4 - 12)) / 8, 9)
  })
})

// --- The device itself --------------------------------------------------------

/** The compiled device at a setting, its breath off: Air is noise, and no part of the curve. */
async function device(values: Values, rate = RATE): Promise<WasmDeviceHarness> {
  const loaded = await loadWasmDevice('vessel', rate)
  for (const [name, value] of Object.entries({ air: 0, ...values })) loaded.set(params[name], value)
  return loaded
}

const CLICK = 0.05

const meterOf = (loaded: WasmDeviceHarness, index: number): number => {
  const read = loaded.device.device_meter
  if (!read) throw new Error('the device has no readings')
  return read(index)
}

interface Answer {
  /** The mean of the two sides for one unit of click, with what the level hold took off put back. */
  answer: Float64Array
  /** The deepest the level hold went while the device answered, in dB (0 or less). */
  held: number
  /** How far the hold fell in the one tick after the click, in dB: there the readings are too coarse to put it back. */
  hurried: number
}

/**
 * The device's answer to one quiet click: the mean of its two sides (Width
 * leans each resonance to one side by as much as it takes from the other, so
 * the mean is the body the display draws), for one unit of click.
 *
 * The level hold is not part of the curve at rest, and it works on a click as
 * on anything else: it closes on the click itself where Tone lifts it over the
 * hold's ceiling, and further where the ring that follows has more power than
 * the click had. The device says how far at every control tick (reading 4),
 * so the answer is taken a tick at a time and the body's share divided by
 * the hold: the reading is taken at the head of a tick, so a tick's samples
 * lie between its own reading and the next one's, and the hold is taken to
 * move evenly in dB between the two. On the click itself it closes all at
 * once, so the click is the last sample of the first tick: the next reading
 * is then the hold that sample was given.
 */
function clickThrough(loaded: WasmDeviceHarness, seconds: number, mix: number): Answer {
  const TICK = 16
  const total = Math.ceil((seconds * loaded.sampleRate) / TICK) * TICK
  const answer = new Float64Array(total)
  const block = new Float32Array(TICK)
  const holds: number[] = []
  for (let done = 0; done < total; done += TICK) {
    block[TICK - 1] = done === 0 ? CLICK : 0
    loaded.processBlock(block)
    const left = loaded.view(loaded.device.device_out_left(), TICK)
    const right = loaded.view(loaded.device.device_out_right(), TICK)
    for (let i = 0; i < TICK; i++) answer[done + i] = (left[i] + right[i]) / (2 * CLICK)
    holds.push(meterOf(loaded, 4))
  }
  for (let tick = 0; tick < holds.length; tick++) {
    const next = holds[Math.min(tick + 1, holds.length - 1)]
    const from = tick === 0 ? next : holds[tick]
    for (let i = 0; i < TICK; i++) {
      const n = tick * TICK + i
      const dry = n === TICK - 1 ? 1 - mix : 0
      const hold = Math.pow(10, (from + ((next - from) * (i + 1)) / TICK) / 20)
      answer[n] = dry + (answer[n] - dry) / hold
    }
  }
  return { answer, held: Math.min(...holds), hurried: holds[1] - holds[2] }
}

/**
 * A quiet tone held until the body has settled: what comes out at that
 * frequency (the mean of the two sides) against what went in, in dB, with
 * the gain the device read on the body over the measured stretch (hold and
 * match, in dB), the hold's share of it, and the last readings of the
 * resonances.
 */
function toneThrough(
  loaded: WasmDeviceHarness,
  hz: number,
  seconds: number,
): { measured: number; riding: number; held: number; levels: number[] } {
  const rate = loaded.sampleRate
  const level = 0.05
  const keep = Math.round((Math.round(hz * 0.5) / hz) * rate)
  const total = Math.ceil((seconds * rate) / 128) * 128
  const block = new Float32Array(128)
  let re = 0
  let im = 0
  let n = 0
  let riding = 0
  let held = 0
  let ticks = 0
  let levels: number[] = []
  for (let done = 0; done + 128 <= total; done += 128) {
    for (let i = 0; i < 128; i++)
      block[i] = level * Math.sin((2 * Math.PI * hz * (done + i)) / rate)
    loaded.processBlock(block)
    if (done < total - keep - 128) continue
    const left = loaded.view(loaded.device.device_out_left(), 128)
    const right = loaded.view(loaded.device.device_out_right(), 128)
    // The readings over the stretch that is measured: hold (4) and match (5), in dB.
    riding += meterOf(loaded, 4) + meterOf(loaded, 5)
    held += meterOf(loaded, 4)
    ticks += 1
    levels = [0, 1, 2, 3].flatMap((index) => vesselLevels(meterOf(loaded, index)))
    for (let i = 0; i < 128 && n < keep; i++, n++) {
      const angle = (2 * Math.PI * hz * (done + i)) / rate
      const sample = (left[i] + right[i]) / 2
      re += sample * Math.sin(angle)
      im += sample * Math.cos(angle)
    }
  }
  return {
    measured: 20 * Math.log10((2 * Math.hypot(re, im)) / n / level),
    riding: riding / ticks,
    held: held / ticks,
    levels,
  }
}

/** What an answer to a click does to a frequency, in dB. */
function answerDb(answer: Float64Array, hz: number, rate: number): number {
  const step = (2 * Math.PI * hz) / rate
  let re = 0
  let im = 0
  for (let n = 0; n < answer.length; n++) {
    re += answer[n] * Math.cos(step * n)
    im -= answer[n] * Math.sin(step * n)
  }
  return 10 * Math.log10(re * re + im * im)
}

/** The frequencies a body is asked at: each resonance, between each two, and a few away from them all. */
function askedAt(setting: VesselSetting, rate: number): number[] {
  const peaks = vesselModel(setting, rate)
    .peaks.filter((peak) => peak.strength > 1e-3 && peak.hz > 25 && peak.hz < 0.4 * rate)
    .map((peak) => peak.hz)
  const between = peaks.slice(1).map((hz, n) => Math.sqrt(hz * peaks[n]))
  return [...peaks, ...between, 30, 60, 3000, 9000, 15000]
}

describe('the curve against the compiled device', () => {
  const cases: [string, Values, number][] = [
    ['the bottle', { body: 0 }, RATE],
    ['the open pipe, the default', {}, RATE],
    ['the stopped pipe', { body: 2 }, RATE],
    ['the shell', { body: 3 }, RATE],
    ['the drum', { body: 4 }, RATE],
    ['the soundboard', { body: 5 }, RATE],
    ['a small pipe, all wet', { size: 0.25, mix: 1 }, RATE],
    ['a large pipe, all wet', { size: 4, mix: 1 }, RATE],
    ['a dead pipe', { material: 0.1, mix: 1 }, RATE],
    ['a closed drum', { body: 4, opening: 0, mix: 1 }, RATE],
    ['an open soundboard', { body: 5, opening: 1, mix: 1 }, RATE],
    ['a pipe heard at its end', { position: 0, mix: 1 }, RATE],
    ['a pipe heard in its middle', { position: 1, mix: 1 }, RATE],
    ['a shell heard deep inside, half wet', { body: 3, position: 0.8, mix: 0.5 }, RATE],
    ['a dark stopped pipe', { body: 2, tone: 0, mix: 1 }, RATE],
    ['a small shell at 96 kHz', { body: 3, size: 0.5, mix: 1 }, 96000],
    ['the default at 44.1 kHz', {}, 44100],
    ['a drum with no lean', { body: 4, width: 0, mix: 1 }, RATE],
    ['a soundboard leaning all the way', { body: 5, width: 1, mix: 1 }, RATE],
    ['a ringing closed shell at 44.1 kHz', { body: 3, material: 0.9, opening: 0, mix: 1 }, 44100],
    ['a large open bottle at 96 kHz', { body: 0, size: 3, opening: 1, mix: 0.6 }, 96000],
  ]

  it.each(cases)('draws what %s does to a click', async (_name, values, rate) => {
    const setting = settingOf(values)
    const model = vesselModel(setting, rate)
    const { answer, held, hurried } = clickThrough(await device(values, rate), 2.5, setting.mix)
    // The hold has little to do on a click: it is put back, and the curve is the body at rest.
    expect(held).toBeGreaterThan(-9)
    expect(hurried).toBeLessThan(0.1)
    const off = askedAt(setting, rate).map((hz) => {
      const drawn = vesselOutDb(model, hz)
      return { hz, drawn, measured: answerDb(answer, hz, rate) }
    })
    for (const { hz, drawn, measured } of off) {
      // Under 40 dB down a line is past the foot of the picture, and a click's answer is lost in its own rounding.
      if (drawn < -40) expect(measured, `${hz} Hz`).toBeLessThan(-34)
      else
        expect(
          Math.abs(measured - drawn),
          `${hz} Hz: drawn ${drawn}, measured ${measured}`,
        ).toBeLessThan(0.25)
    }
    // The peaks stand well clear of what lies between them, so the test would see one out of place.
    const heights = off.map((point) => point.drawn)
    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(6)
  })

  it('draws the body alone as the device all wet', async () => {
    const { answer, held } = clickThrough(await device({ mix: 1 }), 2.5, 1)
    const model = vesselModel(DEFAULTS, RATE)
    // The hold leaves this click alone: the body alone is drawn at the level match's starting value.
    expect(held).toBe(0)
    for (const hz of askedAt(DEFAULTS, RATE))
      expect(
        Math.abs(answerDb(answer, hz, RATE) - vesselBodyDb(model, hz)),
        `${hz} Hz`,
      ).toBeLessThan(0.25)
  })

  it('starts the level match where the device starts it', async () => {
    // The device works its starting gain out from the knobs before any sound; the reading (5) says it
    // from the first block. Every body at three sizes and three materials, at three rates.
    const block = new Float32Array(128)
    let furthest = 0
    for (const rate of [44100, RATE, 96000]) {
      for (let body = 0; body < VESSEL_BODIES.length; body++) {
        for (const size of [0.25, 1, 4]) {
          for (const material of [0, 0.5, 1]) {
            const values = {
              body,
              size,
              material,
              opening: (body % 3) / 2,
              position: 0.15 + 0.14 * body,
              width: size === 1 ? 1 : 0.5,
              mix: 1,
            }
            const loaded = await device(values, rate)
            block.fill(0)
            block[0] = CLICK
            loaded.processBlock(block)
            const read = meterOf(loaded, 5)
            const meant = 20 * Math.log10(vesselModel(settingOf(values), rate).start)
            furthest = Math.max(furthest, Math.abs(read - meant))
            expect(
              Math.abs(read - meant),
              `body ${body} size ${size} material ${material} at ${rate}: device ${read}, display ${meant}`,
            ).toBeLessThan(0.05)
          }
        }
      }
    }
    expect(furthest).toBeLessThan(0.05)
    // It is no small thing: over these settings it runs from under 0 dB to several dB over.
    const starts = [0, 0.5, 1].map(
      (material) => vesselModel(settingOf({ body: 3, material, opening: 0 }), RATE).start,
    )
    expect(20 * Math.log10(Math.max(...starts) / Math.min(...starts))).toBeGreaterThan(2)
  })

  const held: [string, Values, number][] = [
    ['a bright bottle', { body: 0, tone: 1, mix: 1 }, RATE],
    ['a bright ringing drum, half wet', { body: 4, tone: 0.9, material: 0.8, mix: 0.5 }, RATE],
    ['a dark closed pipe at 96 kHz', { tone: 0.1, opening: 0, width: 1, mix: 0.8 }, 96000],
    ['a small open shell at 44.1 kHz', { body: 3, size: 0.5, opening: 1, mix: 1 }, 44100],
  ]

  it.each(held)(
    'draws what %s does to a held tone, with the gain the device reads',
    async (_name, values, rate) => {
      // Tone lifts a click over the hold's ceiling, and the hold then moves faster than its readings
      // come: these are asked with held tones instead, where the gain riding on the body stands still.
      const setting = settingOf(values)
      const model = vesselModel(setting, rate)
      const seconds = Math.max(2, 2.5 * vesselRingSeconds(setting.material))
      let ridden = 0
      for (const hz of askedAt(setting, rate).filter((at) => at > 40 && at < 16000)) {
        const { measured, riding } = toneThrough(await device(values, rate), hz, seconds)
        const drawn = vesselOutDb(model, hz, Math.pow(10, riding / 20))
        expect(
          Math.abs(measured - drawn),
          `${hz} Hz: drawn ${drawn}, measured ${measured}`,
        ).toBeLessThan(0.25)
        ridden = Math.max(ridden, Math.abs(riding - 20 * Math.log10(model.start)))
      }
      // The gain was not the one at rest for every tone: the reading is part of what is checked.
      expect(ridden).toBeGreaterThan(1)
    },
  )

  it('reads the gain the device rides the body with, and which resonance rings', async () => {
    // A held tone on the pipe's lowest resonance: the level hold turns the body down under the level match.
    const loaded = await device({})
    const hz = 130.81
    const block = new Float32Array(128)
    const { measured, riding: meant, held: holding, levels } = toneThrough(loaded, hz, 4)
    const model = vesselModel(DEFAULTS, RATE)
    expect(holding).toBeLessThan(-1)
    expect(meant).toBeLessThan(20 * Math.log10(model.start) - 1)
    const drawn = vesselOutDb(model, hz, Math.pow(10, meant / 20))
    expect(Math.abs(measured - drawn), `drawn ${drawn}, measured ${measured}`).toBeLessThan(0.5)
    // At rest the picture would have it far higher: the reading is what brings it down.
    expect(vesselOutDb(model, hz) - measured).toBeGreaterThan(1)
    // The driven resonance reads highest; its neighbours, off their own frequencies, well under it.
    expect(levels[0]).toBeGreaterThan(20)
    for (const other of levels.slice(1)) expect(other).toBeLessThan(levels[0] - 6)
    // Asleep, every reading is nought.
    block.fill(0)
    for (let done = 0; done < 12 * RATE; done += 128) loaded.processBlock(block)
    for (let index = 0; index < 6; index++) expect(meterOf(loaded, index)).toBe(0)
  })
})

// --- The picture --------------------------------------------------------------

describe('what Vessel draws', () => {
  const settings: [string, Values][] = [
    ['at its defaults', {}],
    ['a small ringing shell', { body: 3, size: 0.4, material: 0.9, opening: 0.1 }],
    ['a large dead drum, all wet', { body: 4, size: 3, material: 0.1, mix: 1, tone: 0.8 }],
  ]

  it.each(settings)('draws what comes out as the curve, %s, in both shapes', (_name, values) => {
    for (const size of SHAPES) {
      const setting = settingOf(values)
      const model = vesselModel(setting, RATE)
      const { curve } = vesselLayout(size, setting.body)
      const { out, alone } = curvesOf(drawDisplay(display, params, { values, ...size }))
      // A point for every column of the box, and one on every resonance in it, so a sharp peak keeps its height.
      expect(out.length).toBeGreaterThanOrEqual(Math.floor(curve.w) + 1)
      expect(out[0][0]).toBeCloseTo(curve.x, 6)
      expect(out[out.length - 1][0]).toBeCloseTo(curve.x + curve.w, 6)
      const span = Math.log(20000 / 20)
      for (const [x, y] of out) {
        const hz = 20 * Math.exp(((x - curve.x) / curve.w) * span)
        expect(y).toBeCloseTo(yOf(vesselOutDb(model, hz), size, setting.body), 4)
      }
      for (const peak of model.peaks) {
        if (peak.strength <= 0 || peak.hz <= 20 || peak.hz >= 20000) continue
        const at = xOfHz(peak.hz, curve)
        expect(
          out.some(([x]) => Math.abs(x - at) < 1e-6),
          `a point on ${peak.hz} Hz`,
        ).toBe(true)
      }
      // Under a Mix below 1 the body alone stands behind, at its own height; all wet, it is the curve itself.
      if (setting.mix < 0.995) {
        expect(alone).toBeDefined()
        for (const [x, y] of alone ?? []) {
          const hz = 20 * Math.exp(((x - curve.x) / curve.w) * span)
          expect(y).toBeCloseTo(yOf(vesselBodyDb(model, hz), size, setting.body), 4)
        }
      } else expect(alone).toBeUndefined()
    }
  })

  it('marks each peak the top of the box cuts with an arrowhead there, and no other', () => {
    // The far corner: the smallest shell, ringing its longest, closed, all wet, before any sound.
    const corner = { body: 3, size: 0.25, material: 1, opening: 0, mix: 1 }
    const quiet = { modes1: 0, modes2: 0, modes3: 0, modes4: 0, hold: 0, match: 0 }
    for (const size of SHAPES) {
      const model = vesselModel(settingOf(corner), RATE)
      const { curve } = vesselLayout(size, corner.body)
      const over = vesselOver(model)
      expect(over.length).toBeGreaterThan(1)
      for (const peak of model.peaks) {
        const cut = vesselOutDb(model, peak.hz) > VESSEL_TOP_DB && peak.hz < 20000
        expect(over.includes(peak), `${peak.hz} Hz`).toBe(cut && peak.strength > 0)
      }
      const drawn = drawDisplay(display, params, { values: corner, ...size })
      const heads = headsOf(drawn, curve.y)
      expect(heads.length).toBe(over.length)
      over.forEach((peak, n) => {
        expect(heads[n][0]).toBeCloseTo(xOfHz(peak.hz, curve), 6)
        expect(heads[n][1]).toBeCloseTo(VESSEL_OVER_HALF, 6)
        expect(heads[n][2]).toBeCloseTo(VESSEL_OVER_HIGH, 6)
        // The curve under the arrowhead is at the top of the box: it is the cut that is marked.
        const at = curvesOf(drawn).out.find(([x]) => Math.abs(x - heads[n][0]) < 1e-6)
        expect(at?.[1]).toBe(curve.y)
      })
      // Ridden 15 dB down by the level hold the body is at its own gain less 15 dB: marked are the peaks still over.
      const ridden = Math.pow(10, -15 / 20)
      const still = vesselOver(model, ridden)
      expect(still.length).toBeLessThan(over.length)
      const held = runDisplay(display, params, 4, {
        values: corner,
        meters: { ...quiet, hold: -15 },
        signal: testSignal(),
        ...size,
      })
      expect(headsOf(held, curve.y).map(([x]) => x)).toEqual(
        still.map((peak) => xOfHz(peak.hz, curve)),
      )
    }
    // At every other setting too the marks are the peaks over the top, and where every peak is
    // inside the box (the defaults, a large dead drum) there is none.
    for (const [name, values] of settings) {
      const setting = settingOf(values)
      const over = vesselOver(vesselModel(setting, RATE))
      if (name !== 'a small ringing shell') expect(over).toEqual([])
      for (const size of SHAPES) {
        const { curve } = vesselLayout(size, setting.body)
        expect(
          headsOf(drawDisplay(display, params, { values, ...size }), curve.y).map(([x]) => x),
        ).toEqual(over.map((peak) => xOfHz(peak.hz, curve)))
      }
    }
  })

  it('keeps the body in the picture with Mix at nought, where nothing of it comes out', () => {
    const { out, alone } = curvesOf(drawDisplay(display, params, { values: { mix: 0 } }))
    for (const [, y] of out) expect(y).toBeCloseTo(yOf(0), 6)
    expect(new Set(alone?.map(([, y]) => Math.round(y))).size).toBeGreaterThan(10)
  })

  it('says the lowest resonance and how long the body rings', () => {
    const words = (values: Values, size = UPRIGHT): string[] =>
      drawDisplay(display, params, { values, ...size }).words()
    expect(words({})).toEqual(expect.arrayContaining(['131 Hz', '400 ms']))
    expect(words({ body: 3, size: 0.5, material: 1 })).toEqual(
      expect.arrayContaining(['1.2 kHz', '4.0 s']),
    )
    expect(words({ body: 2, size: 4, material: 0 })).toEqual(
      expect.arrayContaining(['16 Hz', '40 ms']),
    )
    // Beside the knobs there is room for the ring alone, next to a long body.
    expect(words({}, FLAT)).toContain('400 ms')
    expect(words({}, FLAT)).not.toContain('131 Hz')
    // With a hand on Size the one number is what Size sets: the lowest resonance, as it is dragged.
    const held = (values: Values, hot: string): string[] =>
      drawDisplay(display, params, { values, hot, ...FLAT }).words()
    expect(held({}, 'size')).toContain('131 Hz')
    expect(held({}, 'size')).not.toContain('400 ms')
    expect(held({ size: 0.5 }, 'size')).toContain('262 Hz')
    expect(held({}, 'material')).toContain('400 ms')
    expect(held({}, 'position')).toContain('400 ms')
    // Where both fit they both stand, whatever the hand is on.
    expect(drawDisplay(display, params, { values: {}, hot: 'size', ...UPRIGHT }).words()).toEqual(
      expect.arrayContaining(['131 Hz', '400 ms']),
    )
    expect(ringText(0.04)).toBe('40 ms')
    expect(ringText(0.9949)).toBe('995 ms')
    expect(ringText(0.996)).toBe('1.0 s')
    expect(ringText(1.64)).toBe('1.6 s')
  })

  it('draws the ring as a wedge that ends at its handle, on a scale marked at 100 ms and 1 s', () => {
    for (const size of SHAPES) {
      for (const material of [0, 0.3, 1]) {
        const { ring } = vesselLayout(size, DEFAULTS.body)
        const drawn = drawDisplay(display, params, { values: { material }, ...size })
        const wedge = pathsOf(drawn).find((path) => path.how === 'fill' && path.points.length === 3)
        expect(wedge?.points[1]).toEqual([vesselRingX(ring, material), ring.y])
        expect(wedge?.points[0][0]).toBe(ring.from)
        const marks = pathsOf(drawn)
          .filter((path) => path.how === 'stroke' && path.points.length === 2)
          .filter(
            (path) =>
              path.points[0][0] === path.points[1][0] && Math.abs(path.points[0][1] - ring.y) < 3,
          )
          .map((path) => path.points[0][0])
        // 100 ms and 1 s on a scale of even ratios from 40 ms to 4 s: log(2.5) / log(100) and log(25) / log(100) of the way.
        const travel = ring.long - ring.short
        for (const share of [Math.log(2.5) / Math.log(100), Math.log(25) / Math.log(100)])
          expect(marks.some((x) => Math.abs(x - (ring.short + share * travel)) <= 0.5)).toBe(true)
      }
    }
  })
})

// --- The handles --------------------------------------------------------------

describe('the handles of Vessel', () => {
  it('has Size on the lowest resonance, at the foot of the curve', () => {
    for (const size of SHAPES) {
      for (let body = 0; body < VESSEL_BODIES.length; body++) {
        const { curve } = vesselLayout(size, body)
        for (const value of [0.25, 0.6, 1, 2.5, 4]) {
          const hz = VESSEL_BODIES[body].baseHz / value
          const handle = handleOf('size', { body, size: value }, size)
          expect(handle.x).toBeCloseTo(xOfHz(hz, curve), 6)
          expect(handle.y).toBeGreaterThan(curve.y + curve.h - 8)
          // Dragged from anywhere to where a resonance of that frequency lies, it sets the Size that puts it there.
          if (hz < 20) continue
          const set = handleOf('size', { body }, size).drag(xOfHz(hz, curve), 50, {})
          expect(Object.keys(set)).toEqual(['size'])
          expect(set.size).toBeCloseTo(value, 6)
        }
        // From the smallest to the largest is sixteen times in frequency, four tenths of the picture's three decades.
        const travel =
          handleOf('size', { body, size: 0.25 }, size).x -
          handleOf('size', { body, size: 4 }, size).x
        expect(travel).toBeGreaterThanOrEqual(20)
      }
    }
  })

  it('moves Size from where it lies when the lowest resonance is under the picture', () => {
    // The stopped pipe at Size 4: 16.35 Hz, left of the 20 Hz the picture begins at.
    const values = { body: 2, size: 4 }
    const { curve } = vesselLayout(FLAT, 2)
    const handle = handleOf('size', values)
    expect(handle.x).toBe(curve.x)
    const hold: DisplayHold = {}
    expect(handle.drag(handle.x, handle.y, hold).size).toBeCloseTo(4, 9)
    // Ten pixels to the right is ten pixels' worth of frequency above 16.35 Hz, not above 20.
    const moved = handle.drag(handle.x + 10, handle.y, hold).size
    expect(moved).toBeCloseTo(4 / Math.pow(1000, 10 / curve.w), 6)
    // The plate asks again at every move: the hold keeps how far past the edge it lay at the press.
    const next = handleOf('size', { body: 2, size: moved })
    expect(next.drag(handle.x + 10, handle.y, hold).size).toBeCloseTo(moved, 6)
  })

  it('has Material at the end of the ring', () => {
    for (const size of SHAPES) {
      const { ring } = vesselLayout(size, DEFAULTS.body)
      expect(ring.long - ring.short).toBeGreaterThanOrEqual(30)
      for (const material of [0, 0.2, 0.5, 0.77, 1]) {
        const handle = handleOf('material', { material }, size)
        expect(handle.x).toBeCloseTo(ring.short + material * (ring.long - ring.short), 9)
        expect(handle.y).toBe(ring.y)
        const set = handleOf('material', {}, size).drag(handle.x, handle.y)
        expect(Object.keys(set)).toEqual(['material'])
        expect(set.material).toBeCloseTo(material, 9)
        // Where it stands is the ring it is said to have: 40 ms at the short end, 4 s at the long.
        const share = (handle.x - ring.short) / (ring.long - ring.short)
        expect(0.04 * Math.pow(100, share)).toBeCloseTo(vesselRingSeconds(material), 9)
      }
      expect(handleOf('material', {}, size).drag(-50, 0).material).toBe(0)
      expect(handleOf('material', {}, size).drag(900, 0).material).toBe(1)
    }
  })

  it('has Position on the body, at the place the sound is heard from', () => {
    for (const size of SHAPES) {
      for (let body = 0; body < VESSEL_BODIES.length; body++) {
        const { shape } = vesselLayout(size, body)
        const places = [0, 0.25, 0.5, 0.75, 1].map((position) => {
          const handle = handleOf('position', { body, position }, size)
          // It stands on the body as it is drawn.
          expect(handle.x).toBeGreaterThanOrEqual(shape.x - 1e-9)
          expect(handle.x).toBeLessThanOrEqual(shape.x + shape.w + 1e-9)
          expect(handle.y).toBeGreaterThanOrEqual(shape.y - 1e-9)
          expect(handle.y).toBeLessThanOrEqual(shape.y + shape.h + 1e-9)
          // Dragged from elsewhere to that place, it sets the Position that is heard there.
          const set = handleOf('position', { body, position: 0.1 }, size).drag(handle.x, handle.y)
          expect(Object.keys(set)).toEqual(['position'])
          expect(set.position).toBeCloseTo(position, 6)
          return [handle.x, handle.y]
        })
        // Taken and not moved it stays, between the steps a hand is matched to as well.
        const between = handleOf('position', { body, position: 0.3333 }, size)
        expect(between.drag(between.x, between.y).position).toBe(0.3333)
        // Its way from one end to the other is long enough for a hand.
        let travel = 0
        for (let n = 1; n < places.length; n++)
          travel += Math.hypot(places[n][0] - places[n - 1][0], places[n][1] - places[n - 1][1])
        expect(travel, `body ${body} at ${size.width}`).toBeGreaterThanOrEqual(20)
      }
    }
    // Along a pipe the place is listen_at of the way along its drawn length, on its axis.
    for (const [body, far] of [
      [1, 0.5],
      [2, 0.97],
    ]) {
      const { shape } = vesselLayout(UPRIGHT, body)
      const end = handleOf('position', { body, position: 1 }, UPRIGHT)
      expect(end.x).toBeCloseTo(shape.x + far * shape.w, 9)
      expect(end.y).toBeCloseTo(shape.y + shape.h / 2, 9)
      expect(handleOf('position', { body, position: 0 }, UPRIGHT).x).toBeCloseTo(
        shape.x + 0.03 * shape.w,
        9,
      )
    }
  })
})

// --- What moves ---------------------------------------------------------------

/** Four resonances' levels as the device packs them (vessel.h, `meter()`): base 64, the lowest first. */
const packed = (levels: readonly number[]): number =>
  levels.reduce((sum, level, n) => sum + level * Math.pow(64, n), 0)

describe('what moves on Vessel', () => {
  const quiet = { modes1: 0, modes2: 0, modes3: 0, modes4: 0, hold: 0, match: 0 }

  it('unpacks the levels of four resonances from one reading', () => {
    expect(vesselLevels(packed([63, 32, 0, 16]))).toEqual([63, 32, 0, 16])
    expect(vesselLevels(0)).toEqual([0, 0, 0, 0])
    expect(vesselLevels(packed([63, 63, 63, 63]))).toEqual([63, 63, 63, 63])
    expect(vesselLevels(Number.NaN)).toEqual([0, 0, 0, 0])
  })

  it('fills each resonance towards its peak by the level the device reads on it', () => {
    const levels = [63, 42, 0, 21, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 63]
    const meters = {
      ...quiet,
      modes1: packed(levels.slice(0, 4)),
      modes2: packed(levels.slice(4, 8)),
      modes3: packed(levels.slice(8, 12)),
      modes4: packed(levels.slice(12, 16)),
    }
    for (const size of SHAPES) {
      const { curve } = vesselLayout(size, DEFAULTS.body)
      const foot = curve.y + curve.h
      const model = vesselModel(DEFAULTS, RATE)
      const stems = stemsOf(
        runDisplay(display, params, 4, { meters, signal: testSignal(), ...size }),
      )
      const ringing = levels.flatMap((level, k) => (level > 0 ? [k] : []))
      expect(stems.length).toBe(ringing.length)
      ringing.forEach((k, n) => {
        const [x, from, to] = stems[n]
        const peak = model.peaks[k]
        expect(x).toBeCloseTo(xOfHz(peak.hz, curve), 6)
        expect(from).toBe(foot)
        // Full scale (63) reaches the curve at that resonance; a third of it, a third of the way up.
        // (The readings here have the level match and hold at nought: the body at its own gain.)
        const top = yOf(vesselOutDb(model, peak.hz, 1), size)
        expect(to).toBeCloseTo(foot + (top - foot) * (levels[k] / 63), 3)
      })
    }
  })

  it('shows no resonance ringing in silence, switched off, or with Mix at nought', () => {
    const meters = { ...quiet, modes1: packed([63, 63, 63, 63]) }
    const running = { meters, signal: testSignal() }
    expect(stemsOf(runDisplay(display, params, 2, running)).length).toBe(4)
    expect(stemsOf(runDisplay(display, params, 2, { meters, signal: testSignal(0, 0) }))).toEqual(
      [],
    )
    expect(stemsOf(runDisplay(display, params, 2, { meters, signal: null }))).toEqual([])
    expect(stemsOf(runDisplay(display, params, 2, { ...running, powered: false }))).toEqual([])
    expect(stemsOf(runDisplay(display, params, 2, { ...running, values: { mix: 0 } }))).toEqual([])
    // Once the sound has stopped they sink back.
    const state = display.init?.()
    runDisplay(display, params, 2, { ...running, state })
    expect(
      stemsOf(runDisplay(display, params, 3, { meters: quiet, signal: testSignal(), state })),
    ).toEqual([])
  })

  it('draws what comes out with the gain the device rides the body with', () => {
    const model = vesselModel(DEFAULTS, RATE)
    const { curve } = vesselLayout(FLAT, DEFAULTS.body)
    const span = Math.log(20000 / 20)
    const held = (meters: Record<string, number>, signal = testSignal()) =>
      curvesOf(runDisplay(display, params, 4, { meters, signal })).out
    const expectGain = (points: [number, number][], gain: number): void => {
      for (const [x, y] of points) {
        const hz = 20 * Math.exp(((x - curve.x) / curve.w) * span)
        expect(y).toBeCloseTo(yOf(vesselOutDb(model, hz, gain)), 2)
      }
    }
    // The level match 6 dB up and the level hold 2 dB down: the body 4 dB over.
    expectGain(held({ ...quiet, match: 6, hold: -2 }), Math.pow(10, 4 / 20))
    // The hold alone, hard: 15 dB under.
    expectGain(held({ ...quiet, hold: -15 }), Math.pow(10, -15 / 20))
    // With both at nought the body is at its own gain.
    expectGain(held(quiet), 1)
    // In silence, whatever the last readings were: the curve at rest, at the level match's starting value.
    expect(Math.abs(20 * Math.log10(model.start))).toBeGreaterThan(0.2)
    expectGain(held({ ...quiet, match: 6, hold: -2 }, testSignal(0, 0)), model.start)
    expectGain(curvesOf(drawDisplay(display, params, {})).out, model.start)
    // Ridden, a peak stands where the gain puts it: lower by nearly all of 15 dB at the lowest resonance.
    const hz = model.peaks[0].hz
    expect(vesselOutDb(model, hz) - vesselOutDb(model, hz, Math.pow(10, -15 / 20))).toBeGreaterThan(
      8,
    )
  })
})
