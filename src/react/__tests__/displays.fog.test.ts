// Fog's display against the device's own arithmetic. The cloud it draws is
// held three ways: to the header's figures (read from cpp/devices/fog/fog.h
// itself), to the closed forms of an allpass's answer, and to a click sent
// through the chain as `Fog::Stage::process` runs it. Then what is drawn is
// held to the cloud, each handle to the setting whose picture is under the
// hand, and each thing in the second colour to the reading it shows.

import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../core/params'
import { PLAIN_COLOURS } from '../components/display-kit'
import {
  FOG_BINS_PER_SIZE,
  FOG_FACES,
  FOG_LONG_GAIN_HIGH,
  FOG_LONG_GAIN_LOW,
  FOG_RATIO,
  FOG_SHORT_GAIN,
  FOG_SPAN_SEC,
  FOG_WINDOW_BINS,
  fogAcross,
  fogBox,
  fogCloud,
  fogEnergy,
  fogGains,
  fogLengthText,
  fogLevelAt,
  fogSecondsAt,
  fogStageGain,
} from '../components/displays/fog'
import { type DisplayHandle, type DisplaySignal } from '../components/plate-display'
import {
  drawDisplay,
  patchUnder,
  runDisplay,
  stockDescriptors,
  testLevel,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

// --- The device, from cpp/devices/fog/fog.h -----------------------------------

// `fog_layout::kRatio`: each stage's length as a share of Size. Four short
// stages, then six for each of three layers.
const K_RATIO = [
  0.0393, 0.026, 0.0159, 0.0092, 0.1197, 0.11, 0.1011, 0.0929, 0.0854, 0.0785, 0.1164, 0.107,
  0.0983, 0.0904, 0.083, 0.0763, 0.1132, 0.104, 0.0956, 0.0879, 0.0807, 0.0742,
]
// `Fog::kShortGain`, `kLongGainLow`, `kLongGainHigh`.
const K_SHORT_GAIN = 0.62
const K_LONG_GAIN_LOW = 0.45
const K_LONG_GAIN_HIGH = 0.6
// `Fog::kShortest`: no stage is shorter than two samples.
const K_SHORTEST = 2
const RATE = 48000

/** A stage's coefficient as `Fog::control` sets it: odd stages negative. */
function stageGain(stage: number, density: number): number {
  const magnitude =
    stage < 4
      ? K_SHORT_GAIN * Math.min(1, Math.max(0, density * 5 - stage))
      : K_LONG_GAIN_LOW + (K_LONG_GAIN_HIGH - K_LONG_GAIN_LOW) * density
  return stage % 2 === 1 ? -magnitude : magnitude
}

/**
 * A click through the left side's chain at rest (no drift), as
 * `Fog::Stage::process` runs each stage: v = x + g·delayed, out = delayed − g·v,
 * with every length the nearest whole sample to its share of Size.
 */
function chainClick(sizeMs: number, density: number, layers: number): Float64Array {
  const samples = Math.ceil((2.5 + 1.5 * (layers - 1)) * (sizeMs / 1000) * RATE)
  let x = new Float64Array(samples)
  x[0] = 1
  for (let s = 0; s < 4 + 6 * layers; s++) {
    const g = stageGain(s, density)
    const length = Math.max(K_SHORTEST, Math.floor(K_RATIO[s] * (sizeMs / 1000) * RATE + 0.5))
    const v = new Float64Array(samples)
    const out = new Float64Array(samples)
    for (let i = 0; i < samples; i++) {
      const delayed = i >= length ? v[i - length] : 0
      v[i] = x[i] + g * delayed
      out[i] = delayed - g * v[i]
    }
    x = out
  }
  return x
}

/** The level the display draws, of energies in bins of a 96th of Size: the root of the mean of eight around each. */
function levelOf(energy: ArrayLike<number>): number[] {
  const level: number[] = []
  for (let i = 0; i < energy.length; i++) {
    let sum = 0
    for (let j = i - 4; j < i + 4; j++) if (j >= 0 && j < energy.length) sum += energy[j]
    level.push(Math.sqrt(sum / 8))
  }
  return level
}

// --- The plate ------------------------------------------------------------------

const descriptor = stockDescriptors().get('fog')
if (!descriptor) throw new Error('fog is not a stock device')
const params: Record<string, ParamSpec> = descriptor.params
const { display } = FOG_FACES.fog

// A strip under four knobs is 224 by 48: the box is 212 across from x 6, from y 5 to its foot at y 36.
const STRIP = { width: 224, height: 48 }
const BOX = { x: 6, y: 5, w: 212, h: 31 }
const FOOT = BOX.y + BOX.h
const xOf = (seconds: number, box = BOX): number => box.x + Math.cbrt(seconds / 2.5) * box.w

interface Mark {
  kind: 'fill' | 'stroke'
  colour: string
  alpha: number
  width: number
  dashed: boolean
  points: [number, number][]
  arcs: [number, number, number][]
}

/** Every path that put ink down, with the colour, strength and width it was laid in. */
function marksOf(drawn: RecordingContext): Mark[] {
  const marks: Mark[] = []
  let fill = ''
  let stroke = ''
  let alpha = 1
  let width = 1
  let dashed = false
  let points: [number, number][] = []
  let arcs: [number, number, number][] = []
  for (const call of drawn.calls) {
    const args = call.args as number[]
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'set strokeStyle') stroke = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = args[0]
    else if (call.name === 'set lineWidth') width = args[0]
    else if (call.name === 'setLineDash') dashed = (call.args[0] as number[]).length > 0
    else if (call.name === 'beginPath') {
      points = []
      arcs = []
    } else if (call.name === 'moveTo' || call.name === 'lineTo') points.push([args[0], args[1]])
    else if (call.name === 'arc') arcs.push([args[0], args[1], args[2]])
    else if (call.name === 'fill' || call.name === 'stroke')
      marks.push({
        kind: call.name,
        colour: call.name === 'fill' ? fill : stroke,
        alpha,
        width,
        dashed,
        points: [...points],
        arcs: [...arcs],
      })
  }
  return marks
}

const INK = PLAIN_COLOURS.ink
const ACCENT = PLAIN_COLOURS.accent

const draw = (options: FrameOptions = {}): RecordingContext =>
  drawDisplay(display, params, { ...STRIP, ...options })

/** The cloud's outline: the one long line stroked in the ink. */
function outlineOf(drawn: RecordingContext): [number, number][] {
  const lines = marksOf(drawn).filter(
    (mark) => mark.kind === 'stroke' && mark.colour === INK && mark.points.length > 8,
  )
  expect(lines.length, 'one outline').toBe(1)
  return lines[0].points
}

/** The readings of a device with nothing on its way through it. */
const AT_REST = { age: 60, hit: 0, taken: 0 }

function handlesOf(
  values: Record<string, number> = {},
  size = STRIP,
): Record<'size' | 'mix', DisplayHandle> {
  const handles = display.handles?.(viewOf(display, params, { values, ...size })) ?? []
  const byKey = new Map(handles.map((handle) => [handle.key, handle]))
  const size_ = byKey.get('size')
  const mix = byKey.get('mix')
  if (!size_ || !mix || handles.length !== 2) throw new Error('fog has a Size and a Mix handle')
  return { size: size_, mix }
}

const signalAt = (peak: number): DisplaySignal => ({
  input: testLevel(peak),
  output: testLevel(peak),
  spectrum: null,
  binHz: RATE / 2048,
  left: null,
  right: null,
})

describe('the cloud Fog draws, against the device', () => {
  it('is worked out from the lengths and coefficients in the header', () => {
    const header = readFileSync('cpp/devices/fog/fog.h', 'utf8')
    const ratios = /kRatio\[kStageCount\] = \{([^}]*)\}/.exec(header)?.[1] ?? ''
    const inHeader = [...ratios.matchAll(/(\d+\.\d+)f/g)].map((match) => Number(match[1]))
    expect(inHeader).toEqual(K_RATIO)
    expect([...FOG_RATIO]).toEqual(inHeader)
    const constant = (name: string): number =>
      Number(new RegExp(`${name} = (\\d+\\.\\d+)f`).exec(header)?.[1])
    expect(constant('kShortGain')).toBe(K_SHORT_GAIN)
    expect(constant('kLongGainLow')).toBe(K_LONG_GAIN_LOW)
    expect(constant('kLongGainHigh')).toBe(K_LONG_GAIN_HIGH)
    expect([FOG_SHORT_GAIN, FOG_LONG_GAIN_LOW, FOG_LONG_GAIN_HIGH]).toEqual([
      K_SHORT_GAIN,
      K_LONG_GAIN_LOW,
      K_LONG_GAIN_HIGH,
    ])
    // The Density law: the short stages come in one after another, the long ones go from 0.45 to 0.6.
    for (const density of [0, 0.1, 0.3, 0.5, 0.8, 1])
      for (let s = 0; s < 22; s++)
        expect(fogStageGain(s, density)).toBeCloseTo(Math.abs(stageGain(s, density)), 12)
    expect(fogStageGain(0, 0.1)).toBeCloseTo(0.31, 12)
    expect(fogStageGain(3, 0.7)).toBeCloseTo(0.31, 12)
    expect(fogStageGain(3, 0.6)).toBe(0)
    expect(fogStageGain(9, 0.8)).toBeCloseTo(0.57, 12)
  })

  it('keeps all of the click, and puts its middle where the lengths add up to', () => {
    // An allpass delays energy by its length on average whatever its
    // coefficient, and spreads it by length² · 2g² / (1 − g²).
    for (const [density, layers] of [
      [0.8, 1],
      [0, 1],
      [0.3, 2],
      [1, 3],
    ]) {
      const energy = fogEnergy(density, layers)
      let total = 0
      let mean = 0
      for (let i = 0; i < energy.length; i++) {
        total += energy[i]
        mean += energy[i] * (i / FOG_BINS_PER_SIZE)
      }
      let spread = 0
      for (let i = 0; i < energy.length; i++)
        spread += energy[i] * (i / FOG_BINS_PER_SIZE - mean / total) ** 2
      let lengths = 0
      let variance = 0
      for (let s = 0; s < 4 + 6 * layers; s++) {
        const g2 = stageGain(s, density) ** 2
        lengths += K_RATIO[s]
        variance += (K_RATIO[s] ** 2 * 2 * g2) / (1 - g2)
      }
      expect(total, `Density ${density}, ${layers} layers: energy`).toBeGreaterThan(0.9995)
      expect(total).toBeLessThanOrEqual(1 + 1e-9)
      expect(mean / total, `Density ${density}, ${layers} layers: middle`).toBeCloseTo(lengths, 2)
      expect(spread / total / variance, `Density ${density}, ${layers} layers: spread`).toBeCloseTo(
        1,
        1,
      )
    }
    // One layer's lengths add up to 0.68 of Size, as the header says.
    expect(K_RATIO.slice(0, 10).reduce((sum, ratio) => sum + ratio, 0)).toBeCloseTo(0.678, 3)
  })

  it('is the level of a click sent through the chain itself', () => {
    // The device's harness holds its own click to this curve within 0.053 of
    // the peak (0.106 at Density 0); the chain written out here does as well.
    for (const [sizeMs, density, layers, within] of [
      [300, 0.8, 1, 0.07],
      [600, 1, 3, 0.07],
      [150, 0.3, 2, 0.07],
      [600, 0, 1, 0.13],
    ]) {
      const click = chainClick(sizeMs, density, layers)
      const bins = fogEnergy(density, layers).length
      const heard = new Float64Array(bins)
      const perBin = ((sizeMs / 1000) * RATE) / FOG_BINS_PER_SIZE
      let whole = 0
      for (let i = 0; i < click.length; i++) {
        whole += click[i] * click[i]
        const bin = Math.floor(i / perBin)
        if (bin < bins) heard[bin] += click[i] * click[i]
      }
      // The chain is an allpass: it loses none of the click.
      expect(whole).toBeGreaterThan(0.999)
      const top = Math.max(...levelOf(fogEnergy(density, layers)))
      const real = levelOf(heard)
      const cloud = fogCloud(density, layers)
      let worst = 0
      for (let i = 0; i < bins; i++)
        worst = Math.max(worst, Math.abs(real[i] / top - cloud.level[i]))
      expect(worst, `Size ${sizeMs}, Density ${density}, ${layers} layers`).toBeLessThan(within)
      // Nine tenths of the click's energy is out where the cloud says.
      let passed = 0
      let ninety = 0
      for (let i = 0; i < click.length && passed < 0.9 * whole; i++) {
        passed += click[i] * click[i]
        ninety = i / RATE / (sizeMs / 1000)
      }
      expect(ninety / cloud.ninety).toBeGreaterThan(0.97)
      expect(ninety / cloud.ninety).toBeLessThan(1.03)
    }
    expect(FOG_BINS_PER_SIZE).toBe(96)
    expect(FOG_WINDOW_BINS).toBe(8)
  })

  it('is as long as Size at the default Density, and longer by the layer', () => {
    // Measured on the device by its harness: nine tenths out after 0.997 to
    // 1.009 Sizes with one layer, 1.69 and 2.34 with two and three, 0.90 at
    // Density 0 and 1.025 at Density 1.
    expect(fogCloud(0.8, 1).ninety).toBeCloseTo(1.0, 1)
    expect(Math.abs(fogCloud(0.8, 1).ninety - 1)).toBeLessThan(0.01)
    expect(fogCloud(0.8, 2).ninety).toBeCloseTo(1.69, 1)
    expect(fogCloud(0.8, 3).ninety).toBeCloseTo(2.34, 1)
    expect(fogCloud(0, 1).ninety).toBeCloseTo(0.9, 1)
    expect(fogCloud(1, 1).ninety).toBeCloseTo(1.025, 1)
    // The peak is the top of the curve and the end is where a hundredth of it is left.
    for (const layers of [1, 2, 3]) {
      const cloud = fogCloud(0.8, layers)
      expect(fogLevelAt(cloud, cloud.peak)).toBe(1)
      expect(Math.max(...cloud.level)).toBe(1)
      expect(cloud.peak).toBeLessThan(cloud.ninety)
      expect(cloud.end).toBeGreaterThan(cloud.ninety)
      expect(fogLevelAt(cloud, cloud.end + 0.02)).toBeLessThan(0.01)
      // The longest cloud ends inside the picture: three layers at the top of Size.
      expect(cloud.ninety * 0.6).toBeLessThan(FOG_SPAN_SEC)
    }
    expect(fogLevelAt(fogCloud(0.8, 1), -1)).toBe(0)
    expect(fogLevelAt(fogCloud(0.8, 1), 99)).toBe(0)
  })

  it('is a spray of separate echoes at Density 0 and one smooth rise and fall at 1', () => {
    // How often the level falls by a fiftieth of the peak and then rises by as much again.
    const dips = (level: Float32Array): number => {
      let count = 0
      let falling = false
      let high = 0
      let low = 0
      for (const value of level) {
        if (!falling) {
          if (value > high) high = value
          else if (value < high - 0.02) {
            falling = true
            low = value
          }
        } else if (value < low) low = value
        else if (value > low + 0.02) {
          falling = false
          high = value
          count += 1
        }
      }
      return count
    }
    expect(dips(fogCloud(1, 1).level)).toBe(0)
    expect(dips(fogCloud(0.8, 1).level)).toBe(0)
    expect(dips(fogCloud(0.8, 3).level)).toBe(0)
    expect(dips(fogCloud(0, 1).level)).toBeGreaterThanOrEqual(2)
  })
})

describe('what Fog draws', () => {
  it('lays time out as its cube root, 2.5 seconds across', () => {
    expect(FOG_SPAN_SEC).toBe(2.5)
    expect(fogAcross(0)).toBe(0)
    expect(fogAcross(2.5)).toBe(1)
    expect(fogAcross(0.02)).toBeCloseTo(0.2, 12)
    expect(fogAcross(0.3125)).toBeCloseTo(0.5, 12)
    expect(fogAcross(9)).toBe(1)
    for (const seconds of [0.004, 0.05, 0.6, 2.2])
      expect(fogSecondsAt(fogAcross(seconds))).toBeCloseTo(seconds, 10)
    expect(fogBox(STRIP)).toEqual(BOX)
    expect(fogBox({ width: 204, height: 100 })).toEqual({ x: 6, y: 5, w: 192, h: 83 })

    // A line up the box at 10 ms, 100 ms and 1 s with the time under it, and fainter ones between.
    const drawn = draw()
    const uprights = marksOf(drawn)
      .filter((mark) => mark.points.length === 2 && mark.points[0][0] === mark.points[1][0])
      .map((mark) => mark.points[0][0])
    for (const seconds of [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2])
      expect(uprights).toContain(Math.floor(xOf(seconds)) + 0.5)
    const words = drawn.calls.filter((call) => call.name === 'fillText')
    for (const [said, seconds] of [
      ['10 ms', 0.01],
      ['100 ms', 0.1],
      ['1 s', 1],
    ] as const) {
      const word = words.find((call) => call.args[0] === said)
      expect(word?.args[1], said).toBeCloseTo(xOf(seconds), 6)
      expect(word?.args[2], said).toBe(STRIP.height - 3)
    }
  })

  it('draws the cloud at its level against time, as high as Mix lets it be heard', () => {
    for (const values of [
      {},
      { size: 20 },
      { size: 600, layers: 3, density: 1 },
      { size: 400, density: 0, mix: 0.5 },
      { size: 90, layers: 2, mix: 0.2 },
    ] as Record<string, number>[]) {
      const size = (values.size ?? 150) / 1000
      const cloud = fogCloud(values.density ?? 0.8, values.layers ?? 1)
      const wet = Math.sin(((values.mix ?? 1) * Math.PI) / 2)
      const outline = outlineOf(draw({ values, meters: AT_REST }))
      // It starts at the click and runs to the cloud's end, or the picture's.
      expect(outline[0][0]).toBeCloseTo(BOX.x, 6)
      expect(outline[outline.length - 1][0]).toBeCloseTo(
        Math.min(BOX.x + BOX.w, xOf(cloud.end * size)),
        6,
      )
      let top = FOOT
      for (const [x, y] of outline) {
        const seconds = 2.5 * ((x - BOX.x) / BOX.w) ** 3
        expect(y, `at ${seconds} s`).toBeCloseTo(
          FOOT - wet * fogLevelAt(cloud, seconds / size) * BOX.h,
          6,
        )
        top = Math.min(top, y)
      }
      // No two points are further apart than two pixels, so the peak is not stepped over.
      for (let i = 1; i < outline.length; i++)
        expect(outline[i][0] - outline[i - 1][0]).toBeLessThan(2)
      expect((FOOT - top) / BOX.h, 'the top of the cloud').toBeGreaterThan(wet * 0.985)
      expect((FOOT - top) / BOX.h).toBeLessThanOrEqual(wet + 1e-9)
    }
  })

  it('shows the click as it goes in, and as much of it as Mix leaves dry', () => {
    const spikes = (drawn: RecordingContext): Mark[] =>
      marksOf(drawn).filter(
        (mark) =>
          mark.kind === 'stroke' &&
          mark.points.length === 2 &&
          mark.points[0][0] === mark.points[1][0] &&
          Math.abs(mark.points[0][0] - BOX.x) <= 0.5,
      )
    // Fully up there is only cloud: the click is the dashed line, and nothing of it is solid.
    const wetOnly = spikes(draw())
    expect(wetOnly.map((mark) => mark.dashed)).toEqual([true])
    expect(wetOnly[0].points.map((point) => point[1])).toEqual([FOOT, BOX.y])
    // Half way both are 3 dB down: cos and sin of a quarter turn.
    const half = spikes(draw({ values: { mix: 0.5 } })).find((mark) => !mark.dashed)
    expect(half?.width).toBe(2)
    expect(half?.points[1][1]).toBeCloseTo(FOOT - Math.SQRT1_2 * BOX.h, 6)
    for (const mix of [0, 0.25, 0.8]) {
      const solid = spikes(draw({ values: { mix } })).find((mark) => !mark.dashed)
      expect(solid?.points[1][1]).toBeCloseTo(FOOT - Math.cos((mix * Math.PI) / 2) * BOX.h, 6)
    }
    expect(fogGains(1)).toEqual({ dry: 0, wet: 1 })
    expect(fogGains(0)).toEqual({ dry: 1, wet: 0 })
    // Mix 0 is the dry sound alone: the cloud lies flat on the foot, and the handles with it.
    const flat = outlineOf(draw({ values: { mix: 0 } }))
    for (const [, y] of flat) expect(y).toBe(FOOT)
    const handles = handlesOf({ mix: 0 })
    expect(handles.size.y).toBe(FOOT)
    expect(handles.mix.y).toBe(FOOT)
  })

  it('says how long the cloud is, to two figures, on a patch of the plate', () => {
    expect(fogLengthText(0.1493)).toBe('150 ms')
    expect(fogLengthText(0.0098)).toBe('10 ms')
    expect(fogLengthText(0.0394)).toBe('39 ms')
    expect(fogLengthText(0.674)).toBe('670 ms')
    expect(fogLengthText(0.997)).toBe('1.0 s')
    expect(fogLengthText(1.404)).toBe('1.4 s')
    const said = (values: Record<string, number>, hot: string | null = null): string => {
      const drawn = draw({ values, hot })
      const words = drawn.words().filter((word) => !['10 ms', '100 ms', '1 s'].includes(word))
      expect(words.length).toBe(1)
      expect(patchUnder(drawn, words[0], PLAIN_COLOURS.plate), words[0]).not.toBeNull()
      return words[0]
    }
    expect(said({})).toBe('150 ms')
    expect(said({ size: 600 })).toBe('600 ms')
    // The cloud of three layers is 2.34 Sizes long.
    expect(said({ size: 600, layers: 3 })).toBe('1.4 s')
    expect(said({ size: 40, density: 0.6 })).toBe(fogLengthText(0.04 * fogCloud(0.6, 1).ninety))
    // With its top in hand it says the share of cloud.
    expect(said({ mix: 0.7 }, 'mix')).toBe('70%')
    expect(said({ mix: 0.7 }, 'size')).toBe('150 ms')
  })

  it('marks beside the click how much Soften can take off, as far as the cloud is heard', () => {
    const ticks = (values: Record<string, number>): number[] =>
      marksOf(draw({ values }))
        .filter(
          (mark) =>
            mark.colour === INK &&
            mark.points.length === 2 &&
            mark.points[0][1] === mark.points[1][1] &&
            mark.points[1][0] < BOX.x,
        )
        .map((mark) => mark.points[0][1])
    // `duck = 1 − soften · (1 − kept)` is never under 1 − soften: Soften 0.3 takes three tenths at the most.
    expect(ticks({})).toEqual([Math.floor(BOX.y + 0.3 * BOX.h) + 0.5])
    expect(ticks({ soften: 1 })).toEqual([Math.floor(BOX.y + BOX.h) + 0.5])
    expect(ticks({ soften: 1, mix: 0.5 })).toEqual([Math.floor(BOX.y + Math.SQRT1_2 * BOX.h) + 0.5])
    expect(ticks({ soften: 0 })).toEqual([])
    expect(ticks({ soften: 1, mix: 0 })).toEqual([])
  })

  it('is laid out from the size it is given', () => {
    // Upright it is 204 by 100: the same picture in a box 192 by 83.
    const size = { width: 204, height: 100 }
    const box = { x: 6, y: 5, w: 192, h: 83 }
    const foot = box.y + box.h
    const cloud = fogCloud(0.8, 1)
    const outline = outlineOf(drawDisplay(display, params, { ...size, meters: AT_REST }))
    for (const [x, y] of outline) {
      const seconds = 2.5 * ((x - box.x) / box.w) ** 3
      expect(y).toBeCloseTo(foot - fogLevelAt(cloud, seconds / 0.15) * box.h, 6)
    }
    const handles = handlesOf({}, size)
    expect(handles.size.x).toBeCloseTo(xOf(0.15 * cloud.ninety, box), 6)
    expect(handles.mix.y).toBe(box.y)
    expect(handles.mix.x).toBeCloseTo(xOf(0.15 * cloud.peak, box), 6)
    // And in the wider strip of an opened plate.
    const wide = handlesOf({}, { width: 405, height: 48 })
    expect(wide.size.x).toBeCloseTo(xOf(0.15 * cloud.ninety, { x: 6, y: 5, w: 393, h: 31 }), 6)
  })
})

describe("Fog's handles", () => {
  it('stand on the cloud: Size where nine tenths of it are out, Mix on its top', () => {
    for (const values of [
      {},
      { size: 10 },
      { size: 600, layers: 3, density: 1 },
      { size: 320, layers: 2, density: 0.2, mix: 0.4 },
    ] as Record<string, number>[]) {
      const size = (values.size ?? 150) / 1000
      const cloud = fogCloud(values.density ?? 0.8, values.layers ?? 1)
      const wet = Math.sin(((values.mix ?? 1) * Math.PI) / 2)
      const handles = handlesOf(values)
      expect(handles.size.name).toBe('Size')
      expect(handles.mix.name).toBe('Mix')
      expect(handles.size.x).toBeCloseTo(xOf(cloud.ninety * size), 6)
      expect(handles.size.y).toBeCloseTo(FOOT - wet * fogLevelAt(cloud, cloud.ninety) * BOX.h, 6)
      expect(handles.mix.x).toBeCloseTo(xOf(cloud.peak * size), 6)
      expect(handles.mix.y).toBeCloseTo(FOOT - wet * BOX.h, 6)
      // Both are inside the picture, and the line under Size runs from the foot to it.
      for (const handle of [handles.size, handles.mix]) {
        expect(handle.x).toBeGreaterThanOrEqual(BOX.x)
        expect(handle.x).toBeLessThanOrEqual(BOX.x + BOX.w)
      }
      const under = marksOf(draw({ values, meters: AT_REST })).find(
        (mark) =>
          mark.colour === INK &&
          mark.points.length === 2 &&
          mark.points[0][0] === Math.floor(handles.size.x) + 0.5 &&
          mark.points[0][1] === FOOT,
      )
      expect(under?.points[1][1], 'the line under Size').toBeCloseTo(handles.size.y, 6)
    }
  })

  it('Size: dragged to a time, the cloud has nine tenths of itself out at that time', () => {
    for (const values of [
      {},
      { layers: 3, density: 1 },
      { layers: 2, density: 0.1, mix: 0.3 },
    ] as Record<string, number>[]) {
      const cloud = fogCloud(values.density ?? 0.8, values.layers ?? 1)
      const from = handlesOf(values).size
      for (const seconds of [0.03, 0.1, 0.25, 0.5]) {
        const set = from.drag(xOf(seconds), 3)
        expect(Object.keys(set)).toEqual(['size'])
        expect(set.size).toBeCloseTo((1000 * seconds) / cloud.ninety, 6)
        // The handle is then under the hand, wherever up or down the hand is.
        expect(handlesOf({ ...values, size: set.size }).size.x).toBeCloseTo(xOf(seconds), 6)
        expect(from.drag(xOf(seconds), 40)).toEqual(set)
      }
    }
    const size = handlesOf().size
    // One layer at the default Density: the time under the hand is Size itself, within a hundredth.
    expect(size.drag(xOf(0.3), FOOT).size / 300).toBeCloseTo(1, 1)
    expect(size.drag(size.x, size.y).size).toBeCloseTo(150, 9)
    // Past either end of the knob the handle stops with it.
    expect(size.drag(BOX.x - 20, FOOT).size).toBe(10)
    expect(size.drag(BOX.x + BOX.w + 20, FOOT).size).toBe(600)
    expect(handlesOf({ layers: 3 }).size.drag(BOX.x + BOX.w, FOOT).size).toBe(600)
    expect(size.reset?.()).toEqual({ size: 150 })
  })

  it('Mix: dragged to a height, the cloud is heard that high', () => {
    for (const values of [{}, { size: 500, layers: 2 }, { mix: 0.2, density: 0 }] as Record<
      string,
      number
    >[]) {
      const from = handlesOf(values).mix
      for (const share of [0.1, 0.35, 0.7071, 0.95]) {
        const y = FOOT - share * BOX.h
        const set = from.drag(from.x + 30, y)
        expect(Object.keys(set)).toEqual(['mix'])
        // The cloud's gain is the sine of Mix a quarter turn round.
        expect(Math.sin((set.mix * Math.PI) / 2)).toBeCloseTo(share, 9)
        const then = handlesOf({ ...values, mix: set.mix }).mix
        expect(then.y).toBeCloseTo(y, 6)
        expect(then.x).toBeCloseTo(from.x, 9)
      }
    }
    const mix = handlesOf({ mix: 0.5 }).mix
    expect(mix.drag(mix.x, mix.y).mix).toBeCloseTo(0.5, 9)
    expect(mix.drag(mix.x, FOOT + 9).mix).toBe(0)
    expect(mix.drag(mix.x, BOX.y - 9).mix).toBe(1)
    expect(mix.drag(mix.x, FOOT - 0.5 * BOX.h).mix).toBeCloseTo(1 / 3, 9)
    expect(mix.reset?.()).toEqual({ mix: 1 })
  })

  it('are drawn where they stand, and filled with the second colour in hand', () => {
    const handles = handlesOf({ mix: 0.6 })
    for (const hot of [null, 'size', 'mix']) {
      const rings = marksOf(draw({ values: { mix: 0.6 }, hot, meters: AT_REST })).filter(
        (mark) => mark.kind === 'fill' && mark.arcs.length === 1 && mark.arcs[0][2] >= 3.5,
      )
      expect(rings.length).toBe(2)
      for (const handle of [handles.size, handles.mix]) {
        const ring = rings.find(
          (mark) =>
            Math.abs(mark.arcs[0][0] - handle.x) < 1e-6 &&
            Math.abs(mark.arcs[0][1] - handle.y) < 1e-6,
        )
        expect(ring?.colour).toBe(hot === handle.key ? ACCENT : PLAIN_COLOURS.plate)
      }
    }
  })
})

describe('what happens now, in the second colour', () => {
  const accents = (drawn: RecordingContext): Mark[] =>
    marksOf(drawn).filter((mark) => mark.colour === ACCENT)

  it('is nothing while nothing sounds, and nothing on a plate switched off', () => {
    expect(accents(draw({ meters: AT_REST }))).toEqual([])
    expect(accents(draw({ meters: { age: 0.05, hit: 0.5, taken: 0.6 }, powered: false }))).toEqual(
      [],
    )
    const silent = runDisplay(display, params, 0.5, {
      ...STRIP,
      meters: AT_REST,
      signal: signalAt(0),
    })
    expect(accents(silent)).toEqual([])
    // Before the first readings arrive every meter says 0: still nothing.
    expect(accents(draw({ meters: { age: 0, hit: 0, taken: 0 } }))).toEqual([])
  })

  it('marks where the last attack has got to in the cloud', () => {
    const mark = (
      age: number,
      hit: number,
      values: Record<string, number> = {},
    ): { x: number; y: number; alpha: number } | null => {
      const dots = accents(draw({ values, meters: { age, hit, taken: 0 } })).filter(
        (each) => each.kind === 'fill' && each.arcs.length === 1,
      )
      expect(dots.length).toBeLessThanOrEqual(1)
      return dots.length
        ? { x: dots[0].arcs[0][0], y: dots[0].arcs[0][1], alpha: dots[0].alpha }
        : null
    }
    const cloud = fogCloud(0.8, 1)
    for (const age of [0, 0.01, 0.07, 0.15, 0.3]) {
      const at = mark(age, 0.5)
      expect(at?.x, `${age} s on`).toBeCloseTo(xOf(age), 6)
      expect(at?.y, `${age} s on`).toBeCloseTo(FOOT - fogLevelAt(cloud, age / 0.15) * BOX.h, 6)
    }
    // Once the cloud is over the attack is gone: the meter runs on, the mark does not.
    expect(mark(cloud.end * 0.15 + 0.01, 0.5)).toBeNull()
    expect(mark(60, 0.5)).toBeNull()
    expect(mark(0.07, 0)).toBeNull()
    // A longer cloud is crossed for longer, and the mark rides lower when Mix has the cloud lower.
    const long = fogCloud(1, 3)
    const late = mark(1.2, 0.5, { size: 600, layers: 3, density: 1, mix: 0.5 })
    expect(late?.x).toBeCloseTo(xOf(1.2), 6)
    expect(late?.y).toBeCloseTo(FOOT - Math.SQRT1_2 * fogLevelAt(long, 1.2 / 0.6) * BOX.h, 6)
    // At Mix 0 nothing of the cloud is heard, and the device still says where the attack is.
    expect(mark(0.07, 0.5, { mix: 0 })?.y).toBe(FOOT)
    // A louder attack leaves a stronger mark: full at full scale, faintest from 40 dB under it down.
    expect(mark(0.07, 1)?.alpha).toBe(1)
    expect(mark(0.07, 0.1)?.alpha).toBeCloseTo(0.35 + 0.65 * 0.5, 6)
    expect(mark(0.07, 0.01)?.alpha).toBeCloseTo(0.35, 6)
    expect(mark(0.07, 0.0001)?.alpha).toBe(0.35)
    // A line stands under it from the foot.
    const line = accents(draw({ meters: { age: 0.07, hit: 0.5, taken: 0 } })).find(
      (each) => each.kind === 'stroke' && each.points.length === 2,
    )
    expect(line?.points[0]).toEqual([Math.floor(xOf(0.07)) + 0.5, FOOT])
  })

  it('hangs what Soften has off the attack from the top, beside the click', () => {
    const hung = (drawn: RecordingContext): number => {
      const bars = accents(drawn).filter(
        (each) => each.kind === 'stroke' && each.points.length === 2 && each.points[0][0] < BOX.x,
      )
      expect(bars.length).toBeLessThanOrEqual(1)
      if (!bars.length) return 0
      expect(bars[0].points[0][1]).toBe(BOX.y)
      return bars[0].points[1][1] - BOX.y
    }
    const reading = (taken: number, values: Record<string, number> = {}): number =>
      hung(draw({ values, meters: { age: 60, hit: 0, taken } }))
    expect(reading(0)).toBe(0)
    expect(reading(0.5)).toBeCloseTo(0.5 * BOX.h, 6)
    expect(reading(1)).toBeCloseTo(BOX.h, 6)
    // The dry sound is turned down by `(1 − duck) · wet`, the cloud's feed by 1 − duck heard through wet.
    expect(reading(0.5, { mix: 0.5 })).toBeCloseTo(0.5 * Math.SQRT1_2 * BOX.h, 6)
    expect(reading(1, { mix: 0 })).toBe(0)
    // The dip lasts a few hundredths of a second: it is held, and let go over a quarter of a second.
    const after = (seconds: number): number =>
      hung(
        runDisplay(
          display,
          params,
          seconds,
          { ...STRIP, meters: AT_REST, signal: signalAt(0.3) },
          (time) => ({ meters: { age: 60, hit: 0, taken: time < 0.04 ? 0.8 : 0 } }),
        ),
      )
    expect(after(0.04)).toBeCloseTo(0.8 * BOX.h, 4)
    expect(after(0.3)).toBeLessThan(0.8 * BOX.h * 0.5)
    expect(after(0.3)).toBeGreaterThan(0.8 * BOX.h * 0.2)
    expect(after(2)).toBe(0)
  })

  it('lights the cloud with the level coming out', () => {
    const glow = (peak: number, seconds = 1): number => {
      const drawn = runDisplay(display, params, seconds, {
        ...STRIP,
        meters: AT_REST,
        signal: signalAt(peak),
      })
      const fills = accents(drawn).filter((each) => each.kind === 'fill' && each.points.length > 8)
      expect(fills.length).toBeLessThanOrEqual(1)
      return fills.length ? fills[0].alpha : 0
    }
    // Nothing under −60 dB, as far as it goes from −6 dB up, and by the decibel between.
    expect(glow(0)).toBe(0)
    expect(glow(0.0005)).toBe(0)
    expect(glow(0.5)).toBeCloseTo(0.5, 2)
    expect(glow(1)).toBeCloseTo(0.5, 2)
    expect(glow(0.0158)).toBeCloseTo((0.5 * (60 - 36)) / 54, 2)
    expect(glow(0.1)).toBeGreaterThan(glow(0.0158))
    // It is the cloud that is lit: the fill is the outline's own.
    const drawn = runDisplay(display, params, 1, {
      ...STRIP,
      meters: AT_REST,
      signal: signalAt(0.3),
    })
    const lit = accents(drawn).find((each) => each.kind === 'fill' && each.points.length > 8)
    const outline = outlineOf(drawn)
    expect(lit?.points.slice(0, outline.length)).toEqual(outline)
    // When the sound stops it goes out over a few tenths of a second.
    const state = display.init?.()
    runDisplay(display, params, 1, { ...STRIP, meters: AT_REST, signal: signalAt(0.5), state })
    const fading = runDisplay(display, params, 0.3, {
      ...STRIP,
      meters: AT_REST,
      signal: signalAt(0),
      state,
      now: 11,
    })
    const left = accents(fading).find((each) => each.kind === 'fill' && each.points.length > 8)
    expect(left?.alpha).toBeGreaterThan(0.1)
    expect(left?.alpha).toBeLessThan(0.3)
  })
})

// Found by the second check. The dry sound and the cloud are the same sound,
// one of them through a chain of allpasses, so at every pitch they add or
// cancel by where the cloud's phase lies: a held note comes out anywhere
// between the sum of the two gains and their difference. Six presets left Mix
// near the middle, where the difference is small or nothing (Pad softener at
// 0.5 lost a note altogether; the device measured 71 dB down).
describe("where Fog's presets leave Mix", () => {
  it('none leaves it where the dry sound and the cloud can take a held note out', () => {
    const manifest = JSON.parse(readFileSync('cpp/devices/fog/device.json', 'utf8')) as {
      params: { key: string; default: number }[]
      presets: Record<string, Record<string, number>>
    }
    const usual = manifest.params.find((param) => param.key === 'mix')?.default ?? 1
    expect(Object.keys(manifest.presets)).toHaveLength(16)
    for (const [name, values] of Object.entries(manifest.presets)) {
      const { dry, wet } = fogGains(values.mix ?? usual)
      const least = 20 * Math.log10(Math.abs(wet - dry))
      expect(least, `${name}: the most a held note can lose`).toBeGreaterThan(-4)
    }
    // The same law says what the middle of the knob does.
    const middle = fogGains(0.5)
    expect(Math.abs(middle.wet - middle.dry)).toBeLessThan(1e-9)
  })
})
