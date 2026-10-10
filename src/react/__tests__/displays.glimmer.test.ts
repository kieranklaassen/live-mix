// The truth of Glimmer's display: the law it is drawn from against numbers
// worked out by hand and against the compiled device itself (its sound through
// a comb of tones, and the clock it reports), the drawing against the law, and
// each handle against the parameter it sets.

import { describe, expect, it } from 'vitest'

import { GLIMMER_PARAMS } from '../../dsp/devices/glimmer.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { type ParamSpec } from '../../core/params'
import { INK, PLAIN_COLOURS, crisp, hzOfX } from '../components/display-kit'
import {
  DEPTH_TRAVEL_LEAST,
  GLIMMER_CLOCK_WRAP,
  GLIMMER_FACES,
  glimmerBand,
  glimmerBands,
  glimmerBlend,
  glimmerCentre,
  glimmerDepthAt,
  glimmerDip,
  glimmerFlash,
  glimmerHeardClock,
  glimmerHeight,
  glimmerLayout,
  glimmerLift,
  glimmerLight,
  glimmerPlace,
  glimmerShare,
  glimmerTrack,
  type GlimmerSettings,
} from '../components/displays/glimmer'
import { type DisplayHandle } from '../components/plate-display'
import {
  drawDisplay,
  patchUnder,
  runDisplay,
  viewOf,
  type RecordingContext,
} from './display-harness'

const RATE = 48000
const BLOCK = 128
// From `cpp/devices/glimmer/glimmer.h`: `Stft<2048, 512>` and its latency
// (`Stft::kLatency`, the manifest's `latencySamples`), the widths and knees of
// the bands (`kBroadHz`, `kFineHz`, `kBroadKneeHz`, `kFineKneeHz`), the flash
// (`kGlintPlateau`, `kGlintReach`), the cap on the lift (`kMaxLift`), the
// stretch Lean works along (`kLeanLowHz`, `kLeanOctaves`), and the clock's
// wrap (`kClockWrap`).
const FRAME = 2048
const LATENCY = 2304
const BROAD_HZ = 120
const FINE_HZ = 47
const BROAD_KNEE_HZ = 200
const FINE_KNEE_HZ = 4000
const GLINT_PLATEAU = 0.06
const GLINT_REACH = 0.14
const MAX_LIFT = 2
const LEAN_LOW_HZ = 100
const LEAN_OCTAVES = 6
const CLOCK_WRAP = 4096

const display = GLIMMER_FACES.glimmer.display
const params: Readonly<Record<string, ParamSpec>> = GLIMMER_PARAMS

const defaults: GlimmerSettings = {
  depth: GLIMMER_PARAMS.depth.default,
  pattern: GLIMMER_PARAMS.pattern.default,
  lean: GLIMMER_PARAMS.lean.default,
  soft: GLIMMER_PARAMS.soft.default,
  vary: GLIMMER_PARAMS.vary.default,
  apart: GLIMMER_PARAMS.apart.default,
}

describe("the law of Glimmer's bands and lights", () => {
  it('lays the bands as the header does: so wide at the bottom, widening above a knee', () => {
    expect(glimmerBands(0).width).toBeCloseTo(BROAD_HZ, 9)
    expect(glimmerBands(0).knee).toBeCloseTo(BROAD_KNEE_HZ, 9)
    expect(glimmerBands(1).width).toBeCloseTo(FINE_HZ, 9)
    expect(glimmerBands(1).knee).toBeCloseTo(FINE_KNEE_HZ, 9)
    // Half way the width and the knee are the mean by ratio of their two ends.
    expect(glimmerBands(0.5).width).toBeCloseTo(Math.sqrt(BROAD_HZ * FINE_HZ), 9)
    expect(glimmerBands(0.5).knee).toBeCloseTo(Math.sqrt(BROAD_KNEE_HZ * FINE_KNEE_HZ), 6)
    // Never narrower than two bins: at 96 kHz the finest band is 93.75 Hz wide.
    expect(glimmerBands(1, 96000).width).toBeCloseTo((2 * 96000) / FRAME, 9)
    for (const grain of [0, 0.3, 0.7, 1]) {
      const bands = glimmerBands(grain)
      // Band 0 is centred on nothing, the next a band's width up, and a place and a centre undo each other.
      expect(glimmerCentre(0, bands)).toBe(0)
      expect(glimmerCentre(1, bands) / bands.width).toBeGreaterThan(1)
      expect(glimmerCentre(1, bands) / bands.width).toBeLessThan(1.4)
      for (const j of [1, 7, 40])
        expect(glimmerPlace(glimmerCentre(j, bands), bands)).toBeCloseTo(j, 9)
      // Far above the knee a band is as wide as its frequency over the scale: equal steps of pitch.
      const high = glimmerCentre(30, bands)
      const next = (high + bands.knee) * (Math.exp(1 / bands.scale) - 1)
      expect((glimmerCentre(31, bands) - high) / next).toBeCloseTo(1, 9)
    }
  })

  it('holds a band level about its centre and blends to the next over the middle half', () => {
    expect(glimmerBlend(0)).toBe(0)
    expect(glimmerBlend(0.25)).toBeCloseTo(0, 12)
    expect(glimmerBlend(0.5)).toBeCloseTo(0.5, 12)
    expect(glimmerBlend(0.375)).toBeCloseTo(0.5 - 0.5 * Math.cos(Math.PI / 4), 12)
    expect(glimmerBlend(0.75)).toBeCloseTo(1, 12)
    expect(glimmerBlend(1)).toBe(1)
  })

  it('takes depth away along six octaves from 100 Hz, from whichever end Lean says', () => {
    for (const hz of [20, 100, 800, 6400, 20000]) expect(glimmerShare(hz, 0)).toBe(1)
    const top = LEAN_LOW_HZ * 2 ** LEAN_OCTAVES
    expect(glimmerShare(LEAN_LOW_HZ, 1)).toBe(0)
    expect(glimmerShare(50, 1)).toBe(0)
    expect(glimmerShare(LEAN_LOW_HZ * 8, 1)).toBeCloseTo(0.5, 12)
    expect(glimmerShare(top, 1)).toBeCloseTo(1, 12)
    expect(glimmerShare(20000, 1)).toBe(1)
    expect(glimmerShare(LEAN_LOW_HZ, -1)).toBe(1)
    expect(glimmerShare(LEAN_LOW_HZ * 8, -1)).toBeCloseTo(0.5, 12)
    expect(glimmerShare(top, -1)).toBeCloseTo(0, 12)
    expect(glimmerShare(LEAN_LOW_HZ * 8, 0.4)).toBeCloseTo(0.8, 12)
  })

  it('flashes once a cycle, as wide and as soft as Soft says', () => {
    expect(glimmerFlash(0)).toEqual({ a: GLINT_PLATEAU, b: GLINT_REACH })
    expect(glimmerFlash(1).a).toBe(0)
    expect(glimmerFlash(1).b).toBeCloseTo(0.5, 12)
    for (const soft of [0, 0.3, 0.6, 1]) {
      const { a, b } = glimmerFlash(soft)
      // Full in the middle of the cycle, out at its ends, and half way down half way along the edge.
      expect(glimmerLight(7.5, 3, CLOCK_WRAP, soft, 0)).toBe(1)
      expect(glimmerLight(7, 3, CLOCK_WRAP, soft, 0)).toBeCloseTo(0, 9)
      expect(glimmerLight(7.5 + (a + b) / 2, 3, CLOCK_WRAP, soft, 0)).toBeCloseTo(0.5, 9)
      expect(glimmerLight(7.5 - (a + b) / 2, 3, CLOCK_WRAP, soft, 0)).toBeCloseTo(0.5, 9)
      expect(glimmerLight(-2.5 + b, 3, CLOCK_WRAP, soft, 0)).toBeCloseTo(0, 9)
    }
    // At Soft 1 the light is a raised cosine: a plain tremolo.
    for (const phase of [0.1, 0.3, 0.62, 0.9])
      expect(glimmerLight(phase, 0, CLOCK_WRAP, 1, 0)).toBeCloseTo(
        0.5 - 0.5 * Math.cos(2 * Math.PI * phase),
        9,
      )
  })

  it('lifts a band by what keeps its power over a cycle, and by no more than 6 dB', () => {
    // The mean of the gain's square over a cycle, by counting: over the flash's phase and, under Vary, its height.
    const power = (d: number, soft: number, vary: number): number => {
      let sum = 0
      const steps = 4000
      const heights = vary > 0 ? 200 : 1
      for (let n = 0; n < steps; n++) {
        const light = glimmerLight((n + 0.5) / steps, 0, CLOCK_WRAP, soft, 0)
        for (let h = 0; h < heights; h++) {
          const gain = 1 - d + d * light * (1 - vary * ((h + 0.5) / heights))
          sum += gain * gain
        }
      }
      return sum / (steps * heights)
    }
    for (const [d, soft, vary] of [
      [0.65, 0.6, 0.35],
      [0.3, 0, 0],
      [0.8, 1, 0],
      [0.5, 0.2, 1],
      [1, 1, 0],
      [1, 1, 0.3],
    ]) {
      const lift = glimmerLift(d, soft, vary)
      expect(lift, `depth ${d} soft ${soft} vary ${vary}`).toBeLessThan(MAX_LIFT)
      expect(
        lift * lift * power(d, soft, vary),
        `depth ${d} soft ${soft} vary ${vary}`,
      ).toBeCloseTo(1, 3)
    }
    expect(glimmerLift(0, 0.6, 0.35)).toBe(1)
    // A deep, sudden flash would want more than 6 dB: there the lift stops, and the level falls.
    expect(glimmerLift(1, 0, 0)).toBe(MAX_LIFT)
    expect(power(1, 0, 0) * MAX_LIFT * MAX_LIFT).toBeLessThan(0.75)
    // More Depth never lifts less: the tallest crest on the display is that of a band with all of Depth.
    for (const [soft, vary] of [
      [0, 0],
      [0.6, 0.35],
      [1, 1],
    ])
      for (let d = 0.05; d <= 1; d += 0.05)
        expect(glimmerLift(d, soft, vary)).toBeGreaterThanOrEqual(glimmerLift(d - 0.05, soft, vary))
  })

  it('gives each flash a height of its own under Vary, the same again when the clock comes round', () => {
    const heights = new Set<number>()
    for (let cycle = 0; cycle < 40; cycle++) {
      const height = glimmerLight(cycle + 0.5, 5, CLOCK_WRAP, 0.6, 0.7)
      expect(height).toBeGreaterThan(0.3 - 1e-9)
      expect(height).toBeLessThanOrEqual(1)
      heights.add(Math.round(height * 1e6))
      // No Vary, no difference; and the heights are a band's own.
      expect(glimmerLight(cycle + 0.5, 5, CLOCK_WRAP, 0.6, 0)).toBe(1)
      expect(glimmerLight(cycle + 0.5 + CLOCK_WRAP, 5, CLOCK_WRAP, 0.6, 0.7)).toBe(height)
      expect(glimmerLight(cycle + 0.5 - CLOCK_WRAP, 5, CLOCK_WRAP, 0.6, 0.7)).toBe(height)
    }
    expect(heights.size).toBeGreaterThan(35)
    const other = Array.from({ length: 40 }, (_, cycle) =>
      glimmerLight(cycle + 0.5, 6, CLOCK_WRAP, 0.6, 0.7),
    )
    const same = other.filter(
      (height, cycle) => height === glimmerLight(cycle + 0.5, 5, CLOCK_WRAP, 0.6, 0.7),
    )
    expect(same.length).toBeLessThan(3)
  })
})

// --- Against the compiled device ---------------------------------------------------

function set(device: WasmDeviceHarness, values: Readonly<Record<string, number>>): void {
  for (const [name, value] of Object.entries(values)) device.set(params[name], value)
}

function clockOf(device: WasmDeviceHarness): number {
  const read = device.device.device_meter
  if (!read) throw new Error('the device reports no readings')
  return read(0)
}

/** The device's two sides for `seconds` of a sum of tones, each of the same size. */
function throughDevice(
  device: WasmDeviceHarness,
  tones: readonly number[],
  size: number,
  seconds: number,
): [Float32Array, Float32Array] {
  const total = Math.floor((seconds * RATE) / BLOCK) * BLOCK
  const out: [Float32Array, Float32Array] = [new Float32Array(total), new Float32Array(total)]
  const block = new Float32Array(BLOCK)
  for (let start = 0; start < total; start += BLOCK) {
    for (let i = 0; i < BLOCK; i++) {
      let sample = 0
      for (const hz of tones) sample += size * Math.sin((2 * Math.PI * hz * (start + i)) / RATE)
      block[i] = sample
    }
    device.processBlock(block)
    out[0].set(device.view(device.device.device_out_left(), BLOCK), start)
    out[1].set(device.view(device.device.device_out_right(), BLOCK), start)
  }
  return out
}

/** How large the tone at `hz` is around sample `at`: under a window a frame long. */
function sizeOf(wave: Float32Array, hz: number, at: number): number {
  let re = 0
  let im = 0
  let weight = 0
  for (let n = -FRAME / 2; n < FRAME / 2; n++) {
    const w = 0.5 + 0.5 * Math.cos((2 * Math.PI * n) / FRAME)
    const turn = (2 * Math.PI * hz * (at + n)) / RATE
    re += w * wave[at + n] * Math.cos(turn)
    im += w * wave[at + n] * Math.sin(turn)
    weight += w
  }
  return (2 * Math.hypot(re, im)) / weight
}

/**
 * A frame that ends at sample t is centred half a frame before it and comes
 * out a latency later: what is heard at sample n was given its gains by the
 * clock half a frame less than a latency before.
 */
const HEARD_LATE = LATENCY - FRAME / 2

describe("Glimmer's law against the compiled device", () => {
  // Broad bands, and tones on the centres of six of them well apart, so that each tone is one band's alone.
  const grain = 0.3
  const bands = glimmerBands(grain)
  const cells = [6, 8, 10, 12, 14, 16]
  const tones = cells.map((j) => glimmerCentre(j, bands))
  const size = 0.1

  /** The worst difference between the law's gain and the device's, over the tones, both sides and five seconds. */
  async function worst(
    values: Readonly<Record<string, number>>,
    mix = 1,
  ): Promise<{ error: number; least: number; most: number }> {
    const device = await loadWasmDevice('glimmer', RATE)
    const rate = values.rate
    set(device, { grain, mix, ...values })
    const seconds = 5.5
    const out = throughDevice(device, tones, size, seconds)
    const settings: GlimmerSettings = { ...defaults, ...values }
    let error = 0
    let least = Infinity
    let most = 0
    for (let at = 0.5 * RATE; at < (seconds - 0.1) * RATE; at += 0.05 * RATE) {
      const theta = (rate * (at - HEARD_LATE)) / RATE
      for (const side of [0, 1] as const) {
        cells.forEach((j, index) => {
          const gain = glimmerBand(j, theta, settings, bands, side).gain
          const heard = sizeOf(out[side], tones[index], at) / size
          // Dry and wet are in step, so Mix is a straight line from 1 to the gain: the display's `glimmerHeight`.
          error = Math.max(error, Math.abs(heard - (1 + mix * (gain - 1))))
          least = Math.min(least, gain)
          most = Math.max(most, gain)
        })
      }
    }
    // The clock the device reports is the one the law was read at.
    const now = out[0].length
    expect(clockOf(device)).toBeCloseTo((rate * now) / RATE, 3)
    return { error, least, most }
  }

  it('scatters the bands as the device does: each its own rate, start and flash heights, each side its own', async () => {
    const { error, least, most } = await worst({
      depth: 0.8,
      rate: 0.5,
      pattern: 0,
      lean: 0.3,
      soft: 0.6,
      vary: 0.5,
      apart: 0.7,
    })
    // The run takes in crests and troughs, and the law is within a few hundredths of the sound throughout.
    expect(least).toBeLessThan(0.45)
    expect(most).toBeGreaterThan(1.4)
    expect(error).toBeLessThan(0.01)
  })

  it('runs the waves as the device does: upward, downward and outward, the right side behind by Apart', async () => {
    for (const pattern of [1, 2, 3]) {
      const { error, least, most } = await worst({
        depth: 0.9,
        rate: 0.6,
        pattern,
        lean: -0.4,
        soft: 0.8,
        vary: 0.3,
        apart: 0.5,
      })
      // Lean to the left leaves these bands, all above 900 Hz, part of Depth: they dip to about half.
      expect(least, `pattern ${pattern}`).toBeLessThan(0.55)
      expect(most, `pattern ${pattern}`).toBeGreaterThan(1.3)
      expect(error, `pattern ${pattern}`).toBeLessThan(0.01)
    }
  })

  it('mixes as the display draws it: a straight line from the sound untouched to the gain', async () => {
    const { error } = await worst(
      { depth: 1, rate: 0.5, pattern: 1, lean: 0, soft: 1, vary: 0, apart: 0 },
      0.4,
    )
    expect(error).toBeLessThan(0.01)
  })

  it('reports its clock in cycles of Rate, kept through silence, and starts again at 4096', async () => {
    const device = await loadWasmDevice('glimmer', RATE)
    set(device, { rate: 12 })
    const silence = new Float32Array(BLOCK)
    const tone = Float32Array.from({ length: BLOCK }, (_, i) => 0.2 * Math.sin(i / 3))
    let blocks = 0
    for (; blocks < 400; blocks++) device.processBlock(tone)
    expect(clockOf(device)).toBeCloseTo((12 * blocks * BLOCK) / RATE, 3)
    // Six seconds of silence put the device to sleep; the clock runs on.
    for (let n = 0; n < 2250; n++, blocks++) device.processBlock(silence)
    expect(clockOf(device)).toBeCloseTo((12 * blocks * BLOCK) / RATE, 2)
    expect(GLIMMER_CLOCK_WRAP).toBe(CLOCK_WRAP)
    // What is heard now was given its gains a latency less half a frame ago.
    expect(glimmerHeardClock(10, 12, RATE)).toBeCloseTo(10 - (12 * HEARD_LATE) / RATE, 12)
    expect(glimmerHeardClock(10, 3, 96000)).toBeCloseTo(10 - (3 * 1280) / 96000, 12)
  })
})

// --- The drawing against the law ----------------------------------------------------

interface Rect {
  colour: string
  alpha: number
  x: number
  y: number
  w: number
  h: number
}

/** Every rectangle filled, with its colour and how strongly it was laid. */
function rects(drawn: RecordingContext): Rect[] {
  const all: Rect[] = []
  let colour = ''
  let alpha = 1
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = call.args[0] as number
    else if (call.name === 'fillRect') {
      const [x, y, w, h] = call.args as number[]
      all.push({ colour, alpha, x, y, w, h })
    }
  }
  return all
}

interface Stroke {
  colour: string
  alpha: number
  width: number
  dashed: boolean
  points: { x: number; y: number }[]
}

/** Every line stroked, with its colour, weight and points. */
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

/** The filled circles: the lamp in the Rate ring is the only one in the accent that is not a ring. */
function discs(
  drawn: RecordingContext,
): { colour: string; alpha: number; x: number; y: number; r: number }[] {
  const all: { colour: string; alpha: number; x: number; y: number; r: number }[] = []
  let colour = ''
  let alpha = 1
  let arc: number[] | null = null
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = call.args[0] as number
    else if (call.name === 'arc') arc = call.args as number[]
    else if (call.name === 'fill' && arc)
      all.push({ colour, alpha, x: arc[0], y: arc[1], r: arc[2] })
  }
  return all
}

/**
 * One pixel column of the picture as it was drawn, by its four edges from the
 * top down: the light above the line, the water, the light below. A part with
 * no height is not drawn, and its two edges are then one.
 */
interface Column {
  top: number
  waterTop: number
  waterFoot: number
  foot: number
  body: Rect | undefined
  above: Rect | undefined
  below: Rect | undefined
}

function columnAt(narrow: readonly Rect[], x: number, water: number): Column {
  const here = narrow.filter((rect) => Math.abs(rect.x - x) < 1e-6)
  const body = here.find((rect) => rect.colour === PLAIN_COLOURS.ink)
  const light = here.filter((rect) => rect.colour === PLAIN_COLOURS.accent)
  const above = light.find((rect) => rect.y < water - 1e-9)
  const below = light.find((rect) => rect.y >= water - 1e-9)
  const waterTop = body ? body.y : water
  const waterFoot = body ? body.y + body.h : water
  // The light stands on the water, and hangs from it, with no gap.
  if (above) expect(above.y + above.h).toBeCloseTo(waterTop, 6)
  if (below) expect(below.y).toBeCloseTo(waterFoot, 6)
  return {
    top: above ? above.y : waterTop,
    waterTop,
    waterFoot,
    foot: below ? below.y + below.h : waterFoot,
    body,
    above,
    below,
  }
}

/** The columns of a drawing, left to right, with the x of the middle of each. */
function columnsOf(
  drawn: RecordingContext,
  size: { width: number; height: number },
): { x: number; column: Column }[] {
  const { field, water } = glimmerLayout(size)
  const narrow = rects(drawn).filter((rect) => rect.w < 2)
  const count = Math.round(field.w)
  const step = field.w / count
  return Array.from({ length: count }, (_, i) => ({
    x: field.x + (i + 0.5) * step,
    column: columnAt(narrow, field.x + i * step, water),
  }))
}

/** The gain the law gives the frequency under a pixel on one side, and that band's crest and trough: `frame()`. */
function lawAt(
  hz: number,
  theta: number,
  settings: GlimmerSettings,
  grain: number,
  side: 0 | 1,
): { gain: number; crest: number; trough: number } {
  const bands = glimmerBands(grain)
  const place = glimmerPlace(hz, bands)
  const j = Math.floor(place)
  const t = glimmerBlend(place - j)
  const under = glimmerBand(j, theta, settings, bands, side)
  const over = glimmerBand(j + 1, theta, settings, bands, side)
  const between = (a: number, b: number): number => a + (b - a) * t
  return {
    gain: between(under.gain, over.gain),
    crest: between(under.lift, over.lift),
    trough: between(under.lift * (1 - under.depth), over.lift * (1 - over.depth)),
  }
}

const SHAPES = [
  { width: 224, height: 48 },
  { width: 204, height: 100 },
]

const valueOf = (values: Readonly<Record<string, number>>, name: string): number =>
  values[name] ?? params[name].default

const settingsOf = (values: Readonly<Record<string, number>>): GlimmerSettings => ({
  depth: valueOf(values, 'depth'),
  pattern: valueOf(values, 'pattern'),
  lean: valueOf(values, 'lean'),
  soft: valueOf(values, 'soft'),
  vary: valueOf(values, 'vary'),
  apart: valueOf(values, 'apart'),
})

describe("the picture on Glimmer's plate", () => {
  const settingsToDraw: Readonly<Record<string, number>>[] = [
    {},
    { depth: 0.9, grain: 0.4, pattern: 1, lean: 0, soft: 0.8, vary: 0, apart: 0.5 },
    { grain: 1, pattern: 3, lean: -0.6, apart: 1, mix: 0.6, rate: 9 },
    { depth: 1, grain: 0, pattern: 2, soft: 0, vary: 1, apart: 0.25 },
  ]

  it('stands every band as far from the water line as the law makes its gain, the left side above and the right below', () => {
    for (const size of SHAPES)
      for (const values of settingsToDraw) {
        const clock = 3.37
        const drawn = drawDisplay(display, params, { values, ...size, meters: { clock } })
        const { field, water, up, down } = glimmerLayout(size)
        const settings = settingsOf(values)
        const grain = valueOf(values, 'grain')
        const mix = valueOf(values, 'mix')
        const theta = glimmerHeardClock(clock, valueOf(values, 'rate'), RATE)
        const tallest = glimmerLift(settings.depth, settings.soft, settings.vary)
        const tall = (gain: number): number => glimmerHeight(gain, tallest, mix)
        const columns = columnsOf(drawn, size)
        let lit = 0
        for (const { x, column } of columns) {
          const hz = hzOfX(x, field)
          const left = lawAt(hz, theta, settings, grain, 0)
          const right = lawAt(hz, theta, settings, grain, 1)
          expect(column.top).toBeCloseTo(water - tall(left.gain) * up, 6)
          expect(column.waterTop).toBeCloseTo(water - tall(left.trough) * up, 6)
          expect(column.waterFoot).toBeCloseTo(water + tall(left.trough) * down, 6)
          expect(column.foot).toBeCloseTo(water + tall(right.gain) * down, 6)
          // Nothing stands taller than the picture.
          expect(column.top).toBeGreaterThanOrEqual(field.y - 1e-6)
          expect(column.foot).toBeLessThanOrEqual(field.y + field.h + 1e-6)
          if (column.above && column.above.h > 0.5) lit += 1
        }
        expect(lit, 'some bands are lit').toBeGreaterThan(3)
        // The line of the crests, faint, and the sound untouched, dashed: both the law's.
        const lines = strokes(drawn).filter((stroke) => stroke.colour === PLAIN_COLOURS.ink)
        const crest = lines.find((stroke) => stroke.points.length === columns.length)
        expect(crest?.alpha).toBe(INK.rule)
        crest?.points.forEach((point, i) => {
          expect(point.x).toBeCloseTo(columns[i].x, 6)
          const { crest: lift } = lawAt(hzOfX(point.x, field), theta, settings, grain, 0)
          expect(point.y).toBeCloseTo(water - tall(lift) * up, 6)
        })
        const dashed = lines.filter((stroke) => stroke.dashed)
        expect(dashed).toHaveLength(1)
        expect(dashed[0].points[0].y).toBe(crisp(water - tall(1) * up))
        expect(dashed[0].points[1].y).toBe(dashed[0].points[0].y)
      }
  })

  it('mirrors the left side in the water while Apart is at nothing, and not once it is up', () => {
    for (const size of SHAPES) {
      const { water, up, down } = glimmerLayout(size)
      const mirrored = (apart: number): number => {
        const drawn = drawDisplay(display, params, {
          values: { apart },
          ...size,
          meters: { clock: 11.2 },
        })
        let off = 0
        for (const { column } of columnsOf(drawn, size))
          off = Math.max(off, Math.abs((water - column.top) / up - (column.foot - water) / down))
        return off
      }
      expect(mirrored(0)).toBeLessThan(1e-9)
      expect(mirrored(0.5)).toBeGreaterThan(0.2)
    }
  })

  it('draws only what Mix and Depth let be heard: level water and no light at nothing', () => {
    const nothing: Readonly<Record<string, number>>[] = [{ mix: 0 }, { depth: 0 }]
    for (const size of SHAPES)
      for (const values of nothing) {
        const drawn = drawDisplay(display, params, { values, ...size, meters: { clock: 5.5 } })
        const { field } = glimmerLayout(size)
        for (const { column } of columnsOf(drawn, size)) {
          expect(column.above).toBeUndefined()
          expect(column.below).toBeUndefined()
          expect(column.waterTop).toBeCloseTo(field.y, 6)
          expect(column.waterFoot).toBeCloseTo(field.y + field.h, 6)
        }
        // The sound untouched is then the top of the picture.
        const dashed = strokes(drawn).filter((stroke) => stroke.dashed)
        expect(dashed[0].points[0].y).toBe(crisp(field.y))
      }
    // Half the Mix, half the way: a band's light at Mix 0.5 adds half of what it adds to the gain at Mix 1.
    expect(glimmerHeight(1.6, 2, 0.5) * 1.5).toBeCloseTo(1.3, 12)
    expect(glimmerHeight(0, 2, 0.5) * 1.5).toBeCloseTo(0.5, 12)
    expect(glimmerHeight(0.7, 1.8, 1)).toBeCloseTo(0.7 / 1.8, 12)
  })

  it('lays the water and its light more strongly where the sound is, and the reflection fainter than the light', () => {
    // A sound that is all under 1 kHz.
    const binHz = RATE / 2048
    const spectrum = Float32Array.from({ length: 1024 }, (_, i) => (i * binHz < 1000 ? -24 : -120))
    const level = { peak: 0.3, rms: 0.2, wave: new Float32Array(2048) }
    const signal = { input: level, output: level, spectrum, binHz, left: null, right: null }
    for (const size of SHAPES) {
      const { field } = glimmerLayout(size)
      const drawn = drawDisplay(display, params, { ...size, signal, meters: { clock: 2.2 } })
      const columns = columnsOf(drawn, size)
      const low = columns.filter(({ x }) => hzOfX(x, field) < 900)
      const high = columns.filter(({ x }) => hzOfX(x, field) > 1200)
      const body = (list: typeof columns): number[] =>
        list.flatMap(({ column }) => column.body?.alpha ?? [])
      const light = (list: typeof columns): number[] =>
        list.flatMap(({ column }) => column.above?.alpha ?? [])
      expect(light(low).length).toBeGreaterThan(3)
      expect(light(high).length).toBeGreaterThan(3)
      expect(Math.min(...body(low))).toBeGreaterThan(2 * Math.max(...body(high)))
      expect(Math.min(...light(low))).toBeGreaterThan(1.5 * Math.max(...light(high)))
      expect(Math.min(...light(high))).toBeGreaterThan(0.4)
      for (const { column } of columns)
        if (column.above && column.below)
          expect(column.below.alpha).toBeLessThan(column.above.alpha)
    }
  })

  it('moves with the clock the device reports, and stands while the plate is switched off', () => {
    const picture = (clock: number, powered = true): string =>
      JSON.stringify(
        columnsOf(
          drawDisplay(display, params, { ...SHAPES[0], meters: { clock }, powered }),
          SHAPES[0],
        ).map(({ column }) => column.top.toFixed(3)),
      )
    expect(picture(1.3)).not.toBe(picture(1.6))
    // The heights of the flashes come round when the clock does.
    expect(picture(1.3 + CLOCK_WRAP)).toBe(picture(1.3))
    expect(picture(1.3, false)).toBe(picture(1.6, false))
  })
})

describe("the clock Glimmer's display keeps", () => {
  /** The clock as the device reports it: thirty times a second, whatever the frames do. */
  const reported =
    (start: number, rate: number) =>
    (time: number): { meters: Record<string, number> } => ({
      meters: { clock: (start + rate * (Math.floor(time * 30 + 1e-9) / 30)) % CLOCK_WRAP },
    })

  it('runs with the reported clock between readings and across the wrap', () => {
    for (const [start, rate] of [
      [12.25, 2.2],
      [4095.4, 12],
      [100, 0.03],
    ]) {
      const state = display.init?.() as { theta: number }
      const seconds = 2
      runDisplay(display, params, seconds, { values: { rate }, state }, reported(start, rate))
      // The last frame is one short of the end; the clock shown is within a twentieth of a cycle of the device's.
      const truth = (start + rate * (seconds - 1 / 30)) % CLOCK_WRAP
      const off = Math.abs(state.theta - truth)
      expect(Math.min(off, CLOCK_WRAP - off), `from ${start} at ${rate} Hz`).toBeLessThan(0.05)
    }
  })

  it('carries on at Rate between two readings, stands when they stop, and jumps to one that is far', () => {
    const clock = { theta: 0, reading: Number.NaN, stood: 0 }
    glimmerTrack(clock, 7.5, 2, 0)
    expect(clock.theta).toBe(7.5)
    glimmerTrack(clock, 7.5, 2, 0.02)
    expect(clock.theta).toBeCloseTo(7.54, 9)
    // A reading a little off what was carried is met half way.
    glimmerTrack(clock, 7.6, 2, 0.02)
    expect(clock.theta).toBeCloseTo(7.59, 9)
    // The same reading for long enough: the engine stands, and so does the clock.
    for (let n = 0; n < 10; n++) glimmerTrack(clock, 7.6, 2, 0.02)
    expect(clock.theta).toBe(7.6)
    glimmerTrack(clock, 900, 2, 0.02)
    expect(clock.theta).toBe(900)
    // Just under the wrap, a reading just over it is near.
    const late = { theta: CLOCK_WRAP - 0.01, reading: CLOCK_WRAP - 0.01, stood: 0 }
    glimmerTrack(late, 0.03, 2, 0.02)
    expect(late.theta).toBeCloseTo(0.03, 9)
  })
})

describe("the handles on Glimmer's display", () => {
  const handlesAt = (
    values: Readonly<Record<string, number>>,
    size = SHAPES[0],
  ): Record<string, DisplayHandle> => {
    const view = viewOf(display, params, { values, ...size })
    return Object.fromEntries((display.handles?.(view) ?? []).map((handle) => [handle.key, handle]))
  }

  it('has a ring for Depth and one for Rate, each back at its default at a double press', () => {
    const handles = handlesAt({ depth: 0.2, rate: 7 })
    expect(Object.keys(handles).sort()).toEqual(['depth', 'rate'])
    expect(handles.depth.reset?.()).toEqual({ depth: GLIMMER_PARAMS.depth.default })
    expect(handles.rate.reset?.()).toEqual({ rate: GLIMMER_PARAMS.rate.default })
  })

  it('sets the Depth whose dip is under the hand, and stands on the water where the bands keep all of Depth', () => {
    const settings: Readonly<Record<string, number>>[] = [
      {},
      { soft: 0, vary: 0 },
      { soft: 1, vary: 1, lean: -0.5 },
      { mix: 0.8, lean: 1 },
    ]
    for (const size of SHAPES)
      for (const values of settings) {
        const { field, water, up } = glimmerLayout(size)
        const soft = valueOf(values, 'soft')
        const vary = valueOf(values, 'vary')
        const mix = valueOf(values, 'mix')
        for (const depth of [0, 0.1, 0.35, 0.65, 0.9, 1]) {
          const at = handlesAt({ ...values, depth }, size).depth
          // Where the ring stands is the dip of a band of that Depth, as the law has it.
          const lift = glimmerLift(depth, soft, vary)
          expect(at.y).toBeCloseTo(water - glimmerHeight(lift * (1 - depth), lift, mix) * up, 9)
          // Taken from anywhere and put there, the ring sets that Depth: one drag, one value.
          const from = handlesAt({ ...values, depth: 0.5 }, size).depth
          expect(from.drag(from.x + 30, at.y).depth).toBeCloseTo(depth, 5)
          // And it stands on the water's edge in its own column, as that is drawn.
          const drawn = drawDisplay(display, params, {
            values: { ...values, depth },
            ...size,
            meters: { clock: 0.4 },
          })
          const columns = columnsOf(drawn, size)
          const nearest = columns.reduce((best, each) =>
            Math.abs(each.x - at.x) < Math.abs(best.x - at.x) ? each : best,
          )
          expect(nearest.column.waterTop).toBeCloseTo(at.y, 6)
          // At the end where Lean leaves the bands all of Depth.
          expect(at.x).toBe(valueOf(values, 'lean') >= 0 ? field.x + field.w - 7 : field.x + 7)
        }
        // Past the picture the ring goes no further than Depth does.
        const ring = handlesAt({ ...values, depth: 0.5 }, size).depth
        expect(ring.drag(ring.x, -40).depth).toBe(0)
        expect(ring.drag(ring.x, size.height + 40).depth).toBe(1)
      }
  })

  it('leaves the Depth ring room to be set by hand when Mix is low, and solves the drag for the ring it draws', () => {
    for (const mix of [0, 0.3, DEPTH_TRAVEL_LEAST])
      for (const [soft, vary] of [
        [0, 0],
        [0.6, 0.35],
        [1, 0],
        [1, 1],
      ]) {
        const values = { mix, soft, vary }
        const { water, up } = glimmerLayout(SHAPES[0])
        const none = handlesAt({ ...values, depth: 0 }).depth
        const full = handlesAt({ ...values, depth: 1 }).depth
        // The ring travels as it would at this much Mix, never less: 20 px and more on the strip.
        expect(none.y).toBeCloseTo(water - up, 9)
        expect(full.y).toBeCloseTo(water - glimmerDip(1, soft, vary, DEPTH_TRAVEL_LEAST) * up, 9)
        expect(full.y - none.y).toBeGreaterThanOrEqual(20)
        for (const depth of [0.2, 0.5, 0.8]) {
          const at = handlesAt({ ...values, depth }).depth
          expect(none.drag(none.x, at.y).depth).toBeCloseTo(depth, 5)
        }
      }
    // The dip only falls while Depth rises, so one height is one Depth.
    for (const [soft, vary, mix] of [
      [0, 0, 1],
      [0.6, 0.35, 1],
      [1, 1, 0.75],
    ])
      for (let depth = 0.02; depth <= 1.0001; depth += 0.02) {
        expect(glimmerDip(depth, soft, vary, mix)).toBeLessThan(
          glimmerDip(depth - 0.02, soft, vary, mix),
        )
        expect(glimmerDepthAt(glimmerDip(depth, soft, vary, mix), soft, vary, mix)).toBeCloseTo(
          depth,
          6,
        )
      }
  })

  it('sets Rate along its ruler by equal steps for equal ratios, faster upward', () => {
    const { min, max } = GLIMMER_PARAMS.rate
    for (const size of SHAPES) {
      const lowest = handlesAt({ rate: min }, size).rate
      const highest = handlesAt({ rate: max }, size).rate
      expect(lowest.y).toBeGreaterThan(highest.y)
      expect(lowest.y - highest.y).toBeGreaterThanOrEqual(30)
      expect(lowest.y).toBeLessThanOrEqual(size.height - 5)
      expect(highest.y).toBeGreaterThanOrEqual(5)
      for (const rate of [min, 0.1, 0.6, 2.2, 7, max]) {
        const at = handlesAt({ rate }, size).rate
        const along = Math.log(rate / min) / Math.log(max / min)
        expect(at.y).toBeCloseTo(lowest.y + along * (highest.y - lowest.y), 9)
        expect(lowest.drag(lowest.x - 20, at.y).rate).toBeCloseTo(rate, 9)
        // The ruler stands beside the picture, not on it.
        const { field } = glimmerLayout(size)
        expect(at.x).toBeGreaterThan(field.x + field.w + 3)
      }
      expect(lowest.drag(0, -30).rate).toBeCloseTo(max, 9)
      expect(lowest.drag(0, size.height + 30).rate).toBeCloseTo(min, 9)
    }
  })

  it('lights the lamp in the Rate ring as a band that flashes once a cycle, and says the Rate while the ring is held', () => {
    const rate = 2
    const lampAt = (heard: number, options: { hot?: string; soft?: number } = {}) => {
      // The reading that puts the clock that is heard at `heard`.
      const clock = heard + (rate * HEARD_LATE) / RATE
      const soft = options.soft ?? 0.6
      const drawn = drawDisplay(display, params, {
        values: { rate, soft },
        ...SHAPES[0],
        meters: { clock },
        hot: options.hot ?? null,
      })
      const ring = handlesAt({ rate, soft }).rate
      const lamp = discs(drawn).find(
        (disc) => disc.colour === PLAIN_COLOURS.accent && disc.r === 2 && disc.x === ring.x,
      )
      if (lamp) expect(lamp.y).toBeCloseTo(ring.y, 9)
      return { lamp, drawn }
    }
    expect(lampAt(6.5).lamp?.alpha).toBe(1)
    expect(lampAt(6).lamp).toBeUndefined()
    for (const heard of [6.3, 6.42, 6.7]) {
      const lit = glimmerLight(heard, 0, CLOCK_WRAP, 0.6, 0)
      expect(lit).toBeGreaterThan(0)
      expect(lampAt(heard).lamp?.alpha).toBeCloseTo(lit, 6)
    }
    // A sudden flash is a short one: at Soft 0 the lamp is out a quarter of a cycle from its middle.
    expect(lampAt(6.25, { soft: 0 }).lamp).toBeUndefined()
    expect(lampAt(6.25, { soft: 1 }).lamp?.alpha).toBeCloseTo(0.5, 6)
    // In hand the ring is filled, and the Rate stands beside it in words, on a patch.
    const held = lampAt(6.5, { hot: 'rate' })
    expect(held.lamp).toBeUndefined()
    expect(held.drawn.words()).toEqual(['2.0 Hz'])
    expect(patchUnder(held.drawn, '2.0 Hz', PLAIN_COLOURS.plate)).not.toBeNull()
    expect(lampAt(6.5).drawn.words()).toEqual([])
    expect(lampAt(6.5, { hot: 'depth' }).drawn.words()).toEqual([])
  })
})
