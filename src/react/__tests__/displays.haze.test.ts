// The truth of Haze's display: each figure it draws against the device.
//
// The constants are those of `cpp/devices/haze/haze.h`, copied into the
// display as `HAZE`; the first test reads the header and holds every one of
// them to it. The curve is then worked out here a second time the way the
// header does it (its table of 33 points over one cycle of 24), the tone the
// way the kit's two filters run, sample by sample, and the fall, the push and
// the wall's level are held to the compiled device itself (haze.wasm).

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS, gainToDb } from '../components/display-kit'
import {
  HAZE,
  HAZE_BODY_HZ,
  HAZE_FACES,
  HAZE_HIGH_HZ,
  HAZE_MEASURED,
  fastTanh,
  hazeBlurSeconds,
  hazeBoxes,
  hazeCurve,
  hazeCurveAt,
  hazeDecayFor,
  hazeDrive,
  hazeFall,
  hazeFallEnd,
  hazeFallThrough,
  hazeSeconds,
  hazeShare,
  hazeTailAt,
  hazeToneDb,
  hazeWallSeconds,
  hazeWetDb,
} from '../components/displays/haze'
import { type DisplayHandle } from '../components/plate-display'
import {
  drawDisplay,
  runDisplay,
  stockDescriptors,
  viewOf,
  type RecordingContext,
} from './display-harness'

const here = dirname(fileURLToPath(import.meta.url))
const header = readFileSync(join(here, '../../../cpp/devices/haze/haze.h'), 'utf8')

const descriptor = stockDescriptors().get('haze')
if (!descriptor) throw new Error('haze is not a stock device')
const params = descriptor.params
const display = HAZE_FACES.haze.display

/** A constant of the header by its name: `static constexpr float kName = 1.5f;`. */
function constant(name: string): number {
  const found = new RegExp(`constexpr (?:float|int|double) ${name} = (-?[0-9.e-]+)f?;`).exec(header)
  if (!found) throw new Error(`haze.h has no ${name}`)
  return Number(found[1])
}

/** A list of the header by its name: `kName[...] = {{1.0f, 2.0f}, ...};`, flat. */
function constants(name: string): number[] {
  const found = new RegExp(`constexpr float ${name}\\[[^=]*= ([^;]+);`).exec(header)
  if (!found) throw new Error(`haze.h has no ${name}`)
  return [...found[1].matchAll(/-?[0-9.]+(?=f)/g)].map((match) => Number(match[0]))
}

describe("the figures of Haze's display", () => {
  it('are the constants of haze.h', () => {
    expect(HAZE.driveMin).toBe(constant('kDriveMin'))
    expect(HAZE.driveMax).toBe(constant('kDriveMax'))
    expect(HAZE.floor).toBe(constant('kFloor'))
    expect(HAZE.foldSoft).toBe(constant('kFoldSoft'))
    expect(HAZE.foldGain).toBe(constant('kFoldGain'))
    expect(HAZE.foldMost).toBe(constant('kFoldMost'))
    expect(HAZE.tablePoints).toBe(constant('kTablePoints'))
    expect(HAZE.tiltHz).toBe(constant('kTiltHz'))
    expect(HAZE.toneLowHz).toBe(constant('kToneLowHz'))
    expect(HAZE.toneHighHz).toBe(constant('kToneHighHz'))
    expect(HAZE.tiltLowDb).toBe(constant('kTiltLowDb'))
    expect(HAZE.tiltHighDb).toBe(constant('kTiltHighDb'))
    expect(HAZE.minScale).toBe(constant('kMinScale'))
    expect(HAZE.maxScale).toBe(constant('kMaxScale'))
    expect(HAZE.dampingSlope).toBe(constant('kDampingSlope'))
    expect(HAZE.dampingMost).toBe(constant('kDampingMost'))
    expect(HAZE.lineShare).toBe(constant('kLineShare'))
    expect(HAZE.feedShare).toBe(constant('kFeedShare'))
    expect(HAZE.feedMost).toBe(constant('kFeedMost'))
    expect(HAZE.blurLoop).toBe(constant('kBlurLoop'))
    // The middle line of the eight is the one `derive()` takes the wall's loss from.
    const lines = constants('kLineSeconds')
    expect(lines).toHaveLength(8)
    expect(HAZE.lineSeconds).toBe(lines[4])
    expect(header).toContain('const float middle = gain_[kLines / 2];')
    // One trip round the first reverb: its loop's delay and its five allpasses, left side.
    const trip =
      constants('kBlurLoopDelay')[0] +
      constants('kBlurAllpass')
        .slice(0, 5)
        .reduce((a, b) => a + b)
    expect(HAZE.blurTrip).toBeCloseTo(trip / 48000, 9)
  })
})

// --- The curve, the way the header works it out ---------------------------------

const kTableSize = constant('kTableSize')
const kTablePoints = constant('kTablePoints')
const kFoldSoft = constant('kFoldSoft')
const kFoldGain = constant('kFoldGain')

const fold = (n: number): number => Math.sqrt(n * n + kFoldSoft * kFoldSoft) - kFoldSoft

/** `build_table()` of haze.h: hold / (1 + push) over push / (1 + push), 33 points. */
function headerTable(folded: number): number[] {
  const cycle = Array.from({ length: kTablePoints }, (_, j) =>
    Math.sin((2 * Math.PI * (j + 0.5)) / kTablePoints),
  )
  const mean = cycle.reduce((sum, n) => sum + fold(n), 0) / kTablePoints
  const mixed = cycle.map((n) => (1 - folded) * n + folded * kFoldGain * (fold(n) - mean))
  return Array.from({ length: kTableSize }, (_, i) => {
    const w = i / (kTableSize - 1)
    const push = i === 0 ? 1e-3 : i === kTableSize - 1 ? 1e4 : w / (1 - w)
    const out = mixed.map((n) => fastTanh(push * n))
    const sum = out.reduce((a, b) => a + b, 0) / kTablePoints
    const rms = Math.sqrt(
      Math.max(out.reduce((a, b) => a + b * b, 0) / kTablePoints - sum * sum, 1e-20),
    )
    const held = (push * Math.SQRT1_2) / rms
    return i === 0 ? held : held / (1 + push)
  })
}

/** `hold()` of haze.h: the table read between its points. */
function headerHold(push: number, table: readonly number[]): number {
  const position = (push / (1 + push)) * (kTableSize - 1)
  const index = Math.min(Math.floor(position), kTableSize - 2)
  return (table[index] + (table[index + 1] - table[index]) * (position - index)) * (1 + push)
}

/**
 * `process()` and `curve()` of haze.h for a wave at full level (the level and
 * its floor are 1 together, so the push is the drive): what leaves for the
 * wave `q`, with the fold's mean the mean over a cycle of a sine, which is
 * what the device's slow mean of it settles on.
 */
function headerCurve(q: number, haze: number, octave: number): number {
  const drive =
    constant('kDriveMin') * Math.pow(constant('kDriveMax') / constant('kDriveMin'), haze)
  const folded = constant('kFoldMost') * octave
  const cycle = Array.from({ length: 4800 }, (_, j) => Math.sin((2 * Math.PI * (j + 0.5)) / 4800))
  const mean = cycle.reduce((sum, n) => sum + fold(n), 0) / cycle.length
  const driven = (n: number): number =>
    fastTanh(drive * ((1 - folded) * n + folded * kFoldGain * (fold(n) - mean)))
  // The DC blocker after the curve (`dc_`, 20 Hz) takes out the mean of what a held wave leaves.
  const dc = cycle.reduce((sum, n) => sum + driven(n), 0) / cycle.length
  return ((driven(q) - dc) * headerHold(drive, headerTable(folded))) / drive
}

describe("the curve of Haze's display", () => {
  it("is the kit's tanh", () => {
    // kit::fast_tanh (cpp/kit/math.h): x (27 + x²) / (27 + 9 x²), held to ±3.
    expect(fastTanh(0.5)).toBeCloseTo((0.5 * 27.25) / 29.25, 12)
    expect(fastTanh(3)).toBe(1)
    expect(fastTanh(-7)).toBe(-1)
  })

  it('is the drive the device has at each Haze', () => {
    expect(hazeDrive(0)).toBeCloseTo(0.25, 9)
    expect(hazeDrive(0.5)).toBeCloseTo(Math.sqrt(0.25 * 6), 9)
    expect(hazeDrive(1)).toBeCloseTo(6, 9)
    expect(header).toContain('kDriveMin * std::pow(kDriveMax / kDriveMin, value)')
  })

  it('is the curve the header works out, at every Haze and Octave', () => {
    let worst = 0
    for (const haze of [0, 0.25, 0.55, 0.8, 1]) {
      for (const octave of [0, 0.2, 0.6, 1]) {
        for (let q = -1; q <= 1.0001; q += 0.1) {
          worst = Math.max(
            worst,
            Math.abs(hazeCurve(q, haze, octave) - headerCurve(q, haze, octave)),
          )
        }
      }
    }
    // The display works the hold out at the drive itself and the two means
    // over fewer points; the header reads the hold between two points of its
    // table and the device's means are running ones: they part by under 0.02.
    expect(worst).toBeLessThan(0.02)
    expect(header).toContain('dc_[c].process(outer_[c].down(half[0], half[1])) * post')
  })

  it('leaves a sine as loud as it came, which is what the device was measured to do', () => {
    // haze_test.cpp: a sine in at -15.1 dB leaves at -15.3 to -14.7 dB over Haze.
    for (const haze of [0, 0.3, 0.55, 0.8, 1]) {
      for (const octave of [0, 0.5, 1]) {
        let sum = 0
        let squares = 0
        for (let j = 0; j < 480; j++) {
          const out = hazeCurve(Math.sin((2 * Math.PI * (j + 0.5)) / 480), haze, octave)
          sum += out / 480
          squares += (out * out) / 480
        }
        const db = 10 * Math.log10((squares - sum * sum) / 0.5)
        expect(Math.abs(db), `Haze ${haze}, Octave ${octave}: ${db.toFixed(2)} dB`).toBeLessThan(
          0.3,
        )
      }
    }
  })

  it('bends more with Haze and folds over with Octave', () => {
    // No drive to speak of: nearly the line of no change. Full drive: flat at the top.
    expect(hazeCurve(0.5, 0, 0) / hazeCurve(1, 0, 0)).toBeGreaterThan(0.49)
    expect(hazeCurve(0.5, 1, 0) / hazeCurve(1, 1, 0)).toBeGreaterThan(0.95)
    for (const haze of [0, 0.5, 1]) {
      expect(hazeCurve(-0.7, haze, 0)).toBeCloseTo(-hazeCurve(0.7, haze, 0), 9)
      // Folded, both halves of the wave go up: the octave above.
      expect(hazeCurve(-1, haze, 1)).toBeGreaterThan(0)
      expect(hazeCurve(1, haze, 1)).toBeGreaterThan(0)
      expect(hazeCurve(0, haze, 1)).toBeLessThan(0)
    }
  })
})

// --- Tone, the way the kit's filters run -----------------------------------------

/**
 * A sine through `process()`'s tone stage, sample by sample: kit::OnePole
 * splits it at kTiltHz, the two sides take the tilt's gains, and kit::Svf's
 * low-pass (Butterworth) follows. The level that leaves, in dB.
 */
function toneThroughFilters(hz: number, tone: number): number {
  const rate = 48000
  const a = Math.exp((-2 * Math.PI * constant('kTiltHz')) / rate)
  const tiltLow = Math.pow(10, ((1 - 2 * tone) * constant('kTiltLowDb')) / 20)
  const tiltHigh = Math.pow(10, ((2 * tone - 1) * constant('kTiltHighDb')) / 20)
  const cutoff =
    constant('kToneLowHz') * Math.pow(constant('kToneHighHz') / constant('kToneLowHz'), tone)
  const g = Math.tan((Math.PI * cutoff) / rate)
  const k = Math.SQRT2
  const a1 = 1 / (1 + g * (g + k))
  const a2 = g * a1
  const a3 = g * a2
  let state = 0
  let ic1 = 0
  let ic2 = 0
  let squares = 0
  const frames = rate
  for (let n = 0; n < frames; n++) {
    const x = Math.sin((2 * Math.PI * hz * n) / rate)
    state = x + (state - x) * a
    const tilted = tiltLow * state + tiltHigh * (x - state)
    const v3 = tilted - ic2
    const v1 = a1 * ic1 + a2 * v3
    const v2 = ic2 + a2 * ic1 + a3 * v3
    ic1 = 2 * v1 - ic1
    ic2 = 2 * v2 - ic2
    if (n >= frames / 2) squares += v2 * v2
  }
  return 10 * Math.log10(squares / (frames / 4))
}

describe("the highs of Haze's display", () => {
  it("stand where the device's tilt and low-pass put them", () => {
    for (const tone of [0, 0.25, 0.5, 0.75, 1]) {
      for (const hz of [100, HAZE_BODY_HZ, 1000, HAZE_HIGH_HZ, 8000]) {
        const filters = toneThroughFilters(hz, tone)
        expect(
          Math.abs(hazeToneDb(hz, tone) - filters),
          `${hz} Hz at Tone ${tone}: ${hazeToneDb(hz, tone).toFixed(2)} against ${filters.toFixed(2)} dB`,
        ).toBeLessThan(0.1)
      }
    }
  })

  it('are level with the body at the middle of Tone, under it below and over it above', () => {
    const high = (tone: number): number =>
      hazeToneDb(HAZE_HIGH_HZ, tone) - hazeToneDb(HAZE_BODY_HZ, tone)
    // The middle of Tone has no tilt; its low-pass (3.1 kHz) takes 3 kHz down some 3 dB.
    expect(high(0.5)).toBeGreaterThan(-4)
    expect(high(0.5)).toBeLessThan(-1)
    expect(high(0)).toBeLessThan(-25)
    expect(high(1)).toBeGreaterThan(5)
    for (let tone = 0.05; tone <= 1; tone += 0.05)
      expect(high(tone)).toBeGreaterThan(high(tone - 0.05))
  })

  it("fall sooner than the body, by the wall's damping", () => {
    // `derive()`: a line's gain is 10^e with e = -3 × its seconds / Decay, and
    // its one-pole's coefficient is kDampingSlope × e. By hand at Decay 2 s,
    // Size 0.6 (the middle line 79.1 ms): e = -0.1187, pole 0.359, the pole
    // takes 0.55 dB a pass at 3 kHz beside the gain's 2.37, so 60 dB take
    // 60 × 0.0791 / 2.92 = 1.62 s. The compiled device, a band about 3 kHz of
    // noise through it at the top of Tone: 1.62 s (and 6.4 s at Decay 8 s,
    // where this gives 7.1).
    expect(hazeFall(HAZE_HIGH_HZ, 2, 0.6)).toBeCloseTo(1.62, 1)
    expect(hazeFall(HAZE_HIGH_HZ, 8, 0.6)).toBeCloseTo(7.15, 1)
    // The bottom of the band falls in Decay itself.
    expect(hazeFall(20, 6, 0.6)).toBeCloseTo(6, 1)
    for (const decay of [0.5, 2, 6, 30]) {
      for (const size of [0, 0.6, 1]) {
        expect(hazeFall(HAZE_HIGH_HZ, decay, size)).toBeLessThan(decay)
        expect(hazeFall(8000, decay, size)).toBeLessThan(hazeFall(HAZE_HIGH_HZ, decay, size))
      }
    }
  })
})

// --- The fall, against the compiled device ---------------------------------------

/**
 * Measured from the compiled device (the native build of haze.h, which the
 * harness holds to the same output as haze.wasm): a noise under 800 Hz held
 * for two seconds, wet only, and the seconds from its end until the level of
 * the two sides (windows of 50 ms) is 60 dB under the level of its last
 * 200 ms, the mean of two noises. Decay (s), Size, Feed, Blur, Tone, seconds.
 * These are 53 of the 213 settings measured; `fallOf` below measures the same
 * way from haze.wasm, and a test holds a few of these to it.
 */
const MEASURED: readonly (readonly [number, number, number, number, number, number])[] = [
  [0.5, 0.6, 0, 0.6, 0.5, 1.23],
  [0.5, 0.6, 0.5, 0.6, 0.5, 1.35],
  [0.5, 0.6, 1, 0.6, 0.5, 1.88],
  [1, 0.6, 0, 0.6, 0.5, 1.75],
  [1, 0.6, 0.5, 0.6, 0.5, 1.95],
  [1, 0.6, 1, 0.6, 0.5, 2.73],
  [2, 0.6, 0, 0.6, 0.5, 2.15],
  [2, 0.6, 0.5, 0.6, 0.5, 2.62],
  [2, 0.6, 1, 0.6, 0.5, 5.03],
  [4, 0.6, 0, 0.6, 0.5, 4.03],
  [4, 0.6, 0.5, 0.6, 0.5, 4.78],
  [4, 0.6, 1, 0.6, 0.5, 10.12],
  [8, 0.6, 0, 0.6, 0.5, 7.9],
  [8, 0.6, 0.5, 0.6, 0.5, 9.1],
  [8, 0.6, 1, 0.6, 0.5, 16.77],
  [0.5, 0.6, 0, 0, 0.5, 0.57],
  [0.5, 0.6, 0, 1, 0.5, 1.25],
  [0.5, 0.6, 1, 0, 0.5, 1.1],
  [0.5, 0.6, 1, 1, 0.5, 2.2],
  [2, 0.6, 0, 0, 0.5, 1.98],
  [2, 0.6, 0, 1, 0.5, 3.42],
  [2, 0.6, 1, 0, 0.5, 4.0],
  [2, 0.6, 1, 1, 0.5, 6.17],
  [8, 0.6, 0, 0, 0.5, 7.8],
  [8, 0.6, 0, 1, 0.5, 8.0],
  [8, 0.6, 1, 0, 0.5, 16.3],
  [8, 0.6, 1, 1, 0.5, 22.38],
  [30, 0.6, 0, 0, 0.5, 28.55],
  [30, 0.6, 0, 1, 0.5, 28.88],
  [30, 0.6, 1, 0, 0.5, 54.15],
  [30, 0.6, 1, 1, 0.5, 63.58],
  [1, 0.6, 1, 0, 0, 1.7],
  [1, 0.6, 1, 0, 1, 1.3],
  [4, 0.6, 1, 0, 0, 7.58],
  [4, 0.6, 1, 0, 1, 5.92],
  [16, 0.6, 1, 0, 0, 25.7],
  [16, 0.6, 1, 0, 1, 20.12],
  [2, 0.6, 0.5, 1, 0, 3.67],
  [2, 0.6, 0.5, 1, 1, 3.67],
  [30, 0.6, 0.5, 1, 0, 32.77],
  [30, 0.6, 0.5, 1, 1, 29.12],
  [0.5, 0, 1, 0.6, 0.5, 2.7],
  [0.5, 1, 1, 0.6, 0.5, 2.0],
  [2, 0, 1, 0.6, 0.5, 7.92],
  [2, 1, 1, 0.6, 0.5, 4.33],
  [8, 0, 1, 0.6, 0.5, 17.02],
  [8, 1, 1, 0.6, 0.5, 17.15],
  [30, 0, 1, 0.6, 0.5, 52.62],
  [30, 1, 1, 0.6, 0.5, 55.15],
  [1, 0, 0, 0.6, 0.5, 1.77],
  [1, 1, 0, 0.6, 0.5, 1.77],
  [16, 0, 0, 0.6, 0.5, 15.32],
  [16, 1, 0, 0.6, 0.5, 15.57],
]

/** haze.wasm at a setting (the rest at their defaults). */
async function deviceAt(values: Readonly<Record<string, number>>): Promise<WasmDeviceHarness> {
  const device = await loadWasmDevice('haze')
  for (const [name, value] of Object.entries(values)) device.set(params[name], value)
  return device
}

/** The seconds haze.wasm takes to fall 60 dB after a held noise, measured as the table above was. */
async function fallOf(values: Readonly<Record<string, number>>): Promise<number> {
  const rate = 48000
  const block = 128
  const held = 2
  const decay = values.decay ?? params.decay.default
  let total = 0
  for (const seed of [0xfeed, 0xbeef]) {
    const device = await deviceAt({ ...values, mix: 1 })
    let state = seed
    let low = 0
    const a = Math.exp((-2 * Math.PI * 800) / rate)
    const input = new Float32Array(block)
    const blocks = Math.ceil(((held + decay * 5 + 5) * rate) / block)
    const heldBlocks = Math.round((held * rate) / block)
    // The power of the two sides in windows of 50 ms (18 blocks and a bit: by blocks of 128, 2400 frames is 18.75).
    const power: number[] = []
    let reference = 0
    for (let n = 0; n < blocks; n++) {
      for (let i = 0; i < block; i++) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0
        const white = n < heldBlocks ? state / 2147483648 - 1 : 0
        low = white + (low - white) * a
        input[i] = low * 1.65
      }
      device.processBlock(input)
      const left = device.view(device.device.device_out_left(), block)
      const right = device.view(device.device.device_out_right(), block)
      let sum = 0
      for (let i = 0; i < block; i++) sum += left[i] * left[i] + right[i] * right[i]
      if (n < heldBlocks) {
        if (n >= heldBlocks - 75) reference += sum / 75
      } else power.push(sum)
    }
    // 60 dB under the level at the end of the noise, in windows of 19 blocks (51 ms).
    let seconds = Number.POSITIVE_INFINITY
    for (let w = 0; (w + 1) * 19 <= power.length; w++) {
      let sum = 0
      for (let k = 0; k < 19; k++) sum += power[w * 19 + k] / 19
      if (sum < reference * 1e-6) {
        seconds = ((w + 0.5) * 19 * block) / rate
        break
      }
    }
    total += seconds / 2
  }
  return total
}

describe("the fall of Haze's display", () => {
  it('is the share of its loss that the device sets Feed to make good', () => {
    // `derive()` by hand at Decay 2 s, Size 0.6: the middle line is 0.071938 × 1.1
    // = 79.1 ms, its gain 10^(-3 × 0.0791 / 2) = 0.761, the loss 1 − 0.761² = 0.421.
    // Feed 1 would return √(0.65 × 0.421 / 0.25) = 1.05, held to kFeedMost 0.9:
    // the share is 0.9² × 0.25 / 0.421 = 0.481. At Decay 8 s the loss is 0.128,
    // the return 0.576 and the share kFeedShare itself.
    expect(hazeShare(2, 0.6, 1)).toBeCloseTo(0.481, 2)
    expect(hazeShare(8, 0.6, 1)).toBeCloseTo(0.65, 6)
    expect(hazeShare(8, 0.6, 0.5)).toBeCloseTo(0.65 / 4, 6)
    expect(hazeShare(8, 0.6, 0)).toBe(0)
    expect(header).toContain(
      'feed * kit::min(std::sqrt(kFeedShare * loss / kLineShare), kFeedMost)',
    )
    expect(header).toContain('back * back * kLineShare / loss')
  })

  it("rings the first reverb by its loop's gain, held under Decay's", () => {
    // `derive()`: the loop's gain is kBlurLoop × Blur, and no more than the gain
    // that takes Decay to fall 60 dB over a trip (120.2 ms). Full Blur at a long
    // Decay: 0.6, which alone is -3 × 0.1202 / log10(0.6) = 1.63 s, and 2.3 times
    // that as measured. At Decay 0.5 s the gain is held to 0.19: 0.5 s, times 2.3.
    expect(header).toContain(
      'kit::min(kBlurLoop * param(kBlur), kit::rt60_gain(blur_seconds_ * sr, decay, sr))',
    )
    expect(hazeBlurSeconds(30, 1)).toBeCloseTo(HAZE_MEASURED.ring * 1.626, 2)
    expect(hazeBlurSeconds(0.5, 1)).toBeCloseTo(HAZE_MEASURED.ring * 0.5, 6)
    expect(hazeBlurSeconds(6, 0)).toBe(0)
    expect(hazeBlurSeconds(6, 0.6)).toBeGreaterThan(hazeBlurSeconds(6, 0.3))
  })

  it('takes as long as the compiled device was measured to, within a quarter everywhere', () => {
    let squares = 0
    let within = 0
    for (const [decay, size, feed, blur, tone, measured] of MEASURED) {
      const drawn = hazeSeconds(decay, size, feed, blur, tone)
      const off = Math.log(drawn / measured)
      squares += off * off
      if (Math.abs(off) < Math.log(1.1)) within += 1
      expect(
        Math.abs(off),
        `Decay ${decay}, Size ${size}, Feed ${feed}, Blur ${blur}, Tone ${tone}: ${drawn.toFixed(2)} s drawn, ${measured} s measured`,
      ).toBeLessThan(Math.log(1.28))
    }
    // A tenth off on the whole, and within a tenth for more than half of them.
    expect(Math.sqrt(squares / MEASURED.length)).toBeLessThan(0.1)
    expect(within / MEASURED.length).toBeGreaterThan(0.5)
  })

  it('takes as long as the wall alone does where nothing is fed back and nothing blurred', () => {
    for (const [decay, size, feed, blur, tone, measured] of MEASURED) {
      if (feed > 0 || blur > 0 || decay < 1) continue
      expect(Math.abs(hazeSeconds(decay, size, feed, blur, tone) / measured - 1)).toBeLessThan(0.1)
      expect(hazeSeconds(decay, size, feed, blur, tone)).toBeCloseTo(HAZE_MEASURED.wall * decay, 9)
      expect(hazeWallSeconds(decay, size, feed, blur, tone)).toBeCloseTo(
        HAZE_MEASURED.wall * decay,
        9,
      )
    }
  })

  it('takes as long as haze.wasm does now', async () => {
    const settings: Record<string, number>[] = [
      { decay: 1, feed: 0, blur: 0 },
      { decay: 2, feed: 0, blur: 1 },
      { decay: 2, feed: 1, blur: 0.6 },
      { decay: 4, feed: 0.5, blur: 0, tone: 1 },
      {},
    ]
    for (const values of settings) {
      const at = (name: string): number => values[name] ?? params[name].default
      const drawn = hazeSeconds(at('decay'), at('size'), at('feed'), at('blur'), at('tone'))
      const measured = await fallOf(values)
      expect(
        Math.abs(Math.log(drawn / measured)),
        `${JSON.stringify(values)}: ${drawn.toFixed(2)} s drawn, ${measured.toFixed(2)} s from haze.wasm`,
      ).toBeLessThan(Math.log(1.25))
    }
  })

  it('grows with Decay, with Feed and with Blur over the whole of each', () => {
    for (let step = 0; step < 20; step++) {
      const t = step / 20
      const decay = 0.5 * Math.pow(60, t)
      expect(hazeSeconds(decay * 1.2, 0.6, 0.25, 0.6, 0.5)).toBeGreaterThan(
        hazeSeconds(decay, 0.6, 0.25, 0.6, 0.5),
      )
      expect(hazeSeconds(6, 0.6, t + 0.05, 0.6, 0.5)).toBeGreaterThan(
        hazeSeconds(6, 0.6, t, 0.6, 0.5),
      )
      expect(hazeSeconds(2, 0.6, 0.25, t + 0.05, 0.5)).toBeGreaterThan(
        hazeSeconds(2, 0.6, 0.25, t, 0.5),
      )
    }
  })
})

// --- What is drawn --------------------------------------------------------------

interface Stroke {
  colour: string
  width: number
  points: [number, number][]
}

/** Every line stroked, with its colour and width, and every circle drawn. */
function linesOf(drawn: RecordingContext): {
  strokes: Stroke[]
  circles: { x: number; y: number; r: number }[]
} {
  const strokes: Stroke[] = []
  const circles: { x: number; y: number; r: number }[] = []
  let colour = ''
  let width = 1
  let points: [number, number][] = []
  for (const call of drawn.calls) {
    const args = call.args as number[]
    if (call.name === 'set strokeStyle') colour = String(call.args[0])
    else if (call.name === 'set lineWidth') width = Number(call.args[0])
    else if (call.name === 'beginPath') points = []
    else if (call.name === 'moveTo' || call.name === 'lineTo') points.push([args[0], args[1]])
    else if (call.name === 'arc') circles.push({ x: args[0], y: args[1], r: args[2] })
    else if (call.name === 'stroke' && points.length > 1) strokes.push({ colour, width, points })
  }
  return { strokes, circles }
}

/** The height of a traced line at `x`, between its two points either side. */
function heightAt(points: readonly (readonly [number, number])[], x: number): number {
  for (let n = 1; n < points.length; n++) {
    const [x0, y0] = points[n - 1]
    const [x1, y1] = points[n]
    if (x >= x0 && x <= x1) return x1 === x0 ? y0 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
  }
  return Number.NaN
}

const sizes: readonly (readonly [number, number])[] = [
  [224, 48],
  [204, 100],
  [184, 48],
  [405, 48],
]

describe("what Haze's display draws", () => {
  it('lays the curve and the wall side by side at every size, inside the canvas', () => {
    for (const [width, height] of sizes) {
      const { curve, tail } = hazeBoxes({ width, height })
      expect(curve.x).toBeGreaterThanOrEqual(3)
      expect(curve.w).toBeGreaterThanOrEqual(44)
      expect(tail.x).toBeGreaterThan(curve.x + curve.w)
      expect(tail.x + tail.w).toBeLessThanOrEqual(width - 3)
      expect(tail.w).toBeGreaterThan(curve.w)
      expect(curve.y + curve.h).toBeLessThanOrEqual(height - 3)
      expect(tail.h).toBe(curve.h)
    }
  })

  it('draws the curve itself and the fall to where it ends', () => {
    for (const [width, height] of sizes) {
      for (const values of [
        {},
        { haze: 1, octave: 1, decay: 2, feed: 1 },
        { haze: 0, decay: 30, blur: 1 },
      ]) {
        const view = viewOf(display, params, { values, width, height })
        const { curve, tail } = hazeBoxes(view)
        const { strokes } = linesOf(drawDisplay(display, params, { values, width, height }))
        const ink = strokes.filter((stroke) => stroke.colour === PLAIN_COLOURS.ink)
        // The curve: a point for every pixel across its box, each on the device's curve.
        const bent = ink.find((stroke) => stroke.points.length === curve.w + 1)
        expect(bent, 'the curve is drawn').toBeDefined()
        for (const q of [-1, -0.5, 0, 0.5, 1]) {
          const [x, y] = hazeCurveAt(curve, q, view.value('haze'), view.value('octave'))
          // Between two pixels the drawn curve is straight: half a pixel of a steep stretch.
          expect(Math.abs(heightAt(bent!.points, x) - y), `the curve at ${q}`).toBeLessThan(0.6)
        }
        // The fall: from the wall's own level at the stop to 60 dB under it at the seconds it takes.
        const seconds = hazeSeconds(
          view.value('decay'),
          view.value('size'),
          view.value('feed'),
          view.value('blur'),
          view.value('tone'),
        )
        const [fromX, fromY] = hazeTailAt(tail, 0, 0)
        const [toX, toY] = hazeFallEnd(tail, seconds)
        const fall = ink.find(
          (stroke) =>
            stroke.points.length === 2 &&
            Math.abs(stroke.points[0][0] - fromX) < 0.01 &&
            Math.abs(stroke.points[0][1] - fromY) < 0.01 &&
            Math.abs(stroke.points[1][0] - toX) < 0.01 &&
            Math.abs(stroke.points[1][1] - toY) < 0.01,
        )
        expect(fall, `the fall at ${JSON.stringify(values)}, ${width} by ${height}`).toBeDefined()
        // The same fall as Mix lets it out, that much lower.
        const [, wetY] = hazeTailAt(tail, 0, hazeWetDb(view.value('mix')))
        expect(
          ink.some(
            (stroke) => stroke.points.length === 2 && Math.abs(stroke.points[0][1] - wetY) < 0.01,
          ),
        ).toBe(true)
      }
    }
  })

  it('ends the fall on the foot at its seconds, or on the right edge where it is longer than the picture', () => {
    const { tail } = hazeBoxes({ width: 224, height: 48 })
    const foot = tail.y + tail.h
    expect(hazeFallEnd(tail, 6)).toEqual([hazeTailAt(tail, 6, 0)[0], foot])
    expect(hazeFallEnd(tail, 12)).toEqual([tail.x + tail.w, foot])
    // 24 s: half of its 60 dB are gone at the picture's 12 s.
    const [x, y] = hazeFallEnd(tail, 24)
    expect(x).toBe(tail.x + tail.w)
    expect(y).toBeCloseTo(hazeTailAt(tail, 12, -30)[1], 9)
    // And back: the fall through a point is the one that ends there.
    expect(hazeFallThrough(tail, x, y)).toBeCloseTo(24, 6)
    expect(hazeFallThrough(tail, hazeTailAt(tail, 3, 0)[0], foot)).toBeCloseTo(3, 6)
    expect(hazeFallThrough(tail, ...hazeTailAt(tail, 2, -20))).toBeCloseTo(6, 6)
  })

  it('writes the seconds of the fall', () => {
    const words = (values: Record<string, number>): string[] =>
      drawDisplay(display, params, { values }).words()
    const at = (decay: number, feed: number): string =>
      `${hazeSeconds(decay, params.size.default, feed, params.blur.default, params.tone.default).toFixed(1)} s`
    expect(words({})).toContain(at(params.decay.default, params.feed.default))
    expect(words({ decay: 2, feed: 1 })).toContain(at(2, 1))
    expect(words({ decay: 30, feed: 0 })).toContain(at(30, 0))
  })
})

// --- The handles ----------------------------------------------------------------

function handlesAt(
  values: Record<string, number>,
  width = 224,
  height = 48,
): Record<string, DisplayHandle> {
  const view = viewOf(display, params, { values, width, height })
  return Object.fromEntries((display.handles?.(view) ?? []).map((handle) => [handle.key, handle]))
}

describe("the handles of Haze's display", () => {
  it('stand on the curve for Haze and on the end of the fall for Decay', () => {
    for (const [width, height] of sizes) {
      for (const values of [
        {},
        { haze: 0 },
        { haze: 1, octave: 1 },
        { decay: 0.5 },
        { decay: 30, feed: 1 },
      ]) {
        const view = viewOf(display, params, { values, width, height })
        const { curve, tail } = hazeBoxes(view)
        const { haze, decay } = handlesAt(values, width, height)
        // On the curve: the level the point stands at is read back from where it stands.
        const bent = linesOf(drawDisplay(display, params, { values, width, height })).strokes.find(
          (stroke) => stroke.colour === PLAIN_COLOURS.ink && stroke.points.length === curve.w + 1,
        )
        expect(
          Math.abs(heightAt(bent!.points, haze.x) - haze.y),
          'the Haze point is on the curve',
        ).toBeLessThan(0.6)
        const seconds = hazeSeconds(
          view.value('decay'),
          view.value('size'),
          view.value('feed'),
          view.value('blur'),
          view.value('tone'),
        )
        expect([decay.x, decay.y]).toEqual(hazeFallEnd(tail, seconds))
      }
    }
  })

  it('have room to be set by hand at both shapes', () => {
    for (const [width, height] of sizes) {
      const travel =
        handlesAt({ haze: 0 }, width, height).haze.x - handlesAt({ haze: 1 }, width, height).haze.x
      expect(
        travel,
        `Haze travels ${travel.toFixed(1)} px at ${width} by ${height}`,
      ).toBeGreaterThanOrEqual(20)
      const short = handlesAt({ decay: 0.5, feed: 0, blur: 0 }, width, height).decay
      const long = handlesAt({ decay: 30, feed: 0, blur: 0 }, width, height).decay
      expect(Math.hypot(long.x - short.x, long.y - short.y)).toBeGreaterThan(100)
    }
  })

  it('set Haze to the value whose point is under the hand', () => {
    for (const [width, height] of sizes) {
      const { curve } = hazeBoxes({ width, height })
      for (const start of [0, 0.55, 1]) {
        for (const wanted of [0, 0.2, 0.5, 0.8, 1]) {
          const targetX = handlesAt({ haze: wanted }, width, height).haze.x
          const set = handlesAt({ haze: start }, width, height).haze.drag(targetX, curve.y + 3)
          expect(Object.keys(set)).toEqual(['haze'])
          // One drag is one value: the point then stands under the hand.
          if (Math.abs(start - wanted) > 1e-9) expect(set.haze).toBeCloseTo(wanted, 6)
          expect(handlesAt({ haze: set.haze }, width, height).haze.x).toBeCloseTo(targetX, 6)
        }
      }
      // Past either end of its travel it stops at the end.
      expect(handlesAt({}, width, height).haze.drag(-100, 0).haze).toBe(1)
      expect(handlesAt({}, width, height).haze.drag(width + 100, 0).haze).toBe(0)
    }
  })

  it('set Decay to the value whose fall passes under the hand, whatever Feed and Blur add', () => {
    for (const [width, height] of sizes) {
      const { tail } = hazeBoxes({ width, height })
      const foot = tail.y + tail.h
      for (const rest of [
        {},
        { feed: 1, blur: 1 },
        { feed: 0, blur: 0, size: 0 },
        { feed: 0.6, tone: 0 },
      ]) {
        const at = (name: string): number =>
          (rest as Record<string, number>)[name] ?? params[name].default
        const fallOfDecay = (decay: number): number =>
          hazeSeconds(decay, at('size'), at('feed'), at('blur'), at('tone'))
        for (const seconds of [3, 5, 8, 11]) {
          // Along the foot: the fall ends where the hand is.
          const [x] = hazeTailAt(tail, seconds, 0)
          const set = handlesAt({ ...rest, decay: 1 }, width, height).decay.drag(x, foot)
          expect(Object.keys(set)).toEqual(['decay'])
          if (fallOfDecay(params.decay.min) < seconds && fallOfDecay(params.decay.max) > seconds) {
            expect(fallOfDecay(set.decay)).toBeCloseTo(seconds, 3)
            const moved = handlesAt({ ...rest, decay: set.decay }, width, height).decay
            expect(moved.x).toBeCloseTo(x, 2)
            expect(moved.y).toBeCloseTo(foot, 6)
          }
        }
        // On the right edge: a fall longer than the picture, taken where it leaves it.
        const [edgeX, edgeY] = hazeTailAt(tail, 12, -40)
        const long = handlesAt({ ...rest, decay: 1 }, width, height).decay.drag(edgeX, edgeY).decay
        if (fallOfDecay(params.decay.max) > 18) {
          expect(fallOfDecay(long)).toBeCloseTo(18, 3)
          const moved = handlesAt({ ...rest, decay: long }, width, height).decay
          expect(moved.x).toBeCloseTo(edgeX, 6)
          expect(moved.y).toBeCloseTo(edgeY, 2)
        }
      }
      // Past what Decay can do it stops at its ends.
      expect(handlesAt({}, width, height).decay.drag(tail.x, foot).decay).toBe(params.decay.min)
      expect(handlesAt({}, width, height).decay.drag(tail.x + tail.w, tail.y).decay).toBe(
        params.decay.max,
      )
    }
  })

  it('solve Decay for a fall', () => {
    const rest = { size: 0.6, feed: 0.5, blur: 0.6, tone: 0.5 }
    for (const decay of [0.7, 2, 6, 19]) {
      const seconds = hazeSeconds(decay, rest.size, rest.feed, rest.blur, rest.tone)
      expect(hazeDecayFor(seconds, rest, 0.5, 30)).toBeCloseTo(decay, 4)
    }
    expect(hazeDecayFor(0.01, rest, 0.5, 30)).toBe(0.5)
    expect(hazeDecayFor(500, rest, 0.5, 30)).toBe(30)
  })

  it('go back to the defaults when asked', () => {
    const { haze, decay } = handlesAt({ haze: 0.9, decay: 20 })
    expect(haze.reset?.()).toEqual({ haze: params.haze.default })
    expect(decay.reset?.()).toEqual({ decay: params.decay.default })
  })
})

// --- What is lit ----------------------------------------------------------------

describe("the live marks of Haze's display", () => {
  const accentOf = (
    drawn: RecordingContext,
  ): { strokes: Stroke[]; dots: { x: number; y: number }[] } => {
    const { strokes, circles } = linesOf(drawn)
    return {
      strokes: strokes.filter((stroke) => stroke.colour === PLAIN_COLOURS.accent),
      dots: circles.filter((circle) => circle.r === 2.5),
    }
  }

  it('reads the push and the wall from the device, which reports what its header says', async () => {
    // `process()`: push = drive × level / (level + kFloor), the level a sine's
    // peak; the wall is the peak that leaves before Mix. A 220 Hz sine at 0.25
    // with nothing blurred: the level is 0.25 (the 5 kHz low-pass before the
    // fuzz takes a thousandth), so the push is 0.9615 of the drive.
    for (const haze of [0, 0.55, 1]) {
      const device = await deviceAt({ haze, blur: 0, mix: 1 })
      const peak = device.feedTone(1.5, 220, 0.25, 1.4)
      const push = device.device.device_meter?.(0) ?? Number.NaN
      const wall = device.device.device_meter?.(1) ?? Number.NaN
      expect(push / hazeDrive(haze), `the push at Haze ${haze}`).toBeGreaterThan(0.94)
      expect(push / hazeDrive(haze), `the push at Haze ${haze}`).toBeLessThan(0.98)
      // The wall's meter is its peak over the last tenth of a second; Mix is at 1, so that is what left.
      expect(wall).toBeGreaterThan(0)
      expect(Math.abs(gainToDb(wall) - gainToDb(peak))).toBeLessThan(1.5)

      // Drawn: the dots stand on the curve where the peaks reach, 0.96 of the way out.
      const values = { haze, blur: 0, mix: 1 }
      const view = viewOf(display, params, { values, width: 224, height: 48 })
      const { curve, tail } = hazeBoxes(view)
      const lit = accentOf(
        drawDisplay(display, params, { values, width: 224, height: 48, meters: { push, wall } }),
      )
      const reach = push / hazeDrive(haze)
      expect(lit.dots).toHaveLength(2)
      for (const [n, side] of [-1, 1].entries()) {
        const [x, y] = hazeCurveAt(curve, side * reach, haze, view.value('octave'))
        expect(lit.dots[n].x).toBeCloseTo(x, 6)
        expect(lit.dots[n].y).toBeCloseTo(y, 6)
      }
      // And the wall is lit from its level now, falling as the wall falls.
      const [x0, y0] = hazeTailAt(tail, 0, gainToDb(wall))
      const wedge = lit.strokes.find(
        (stroke) => stroke.points.length === 2 && Math.abs(stroke.points[0][0] - x0) < 0.01,
      )
      expect(wedge, 'the lit fall').toBeDefined()
      expect(wedge!.points[0][1]).toBeCloseTo(y0, 6)
    }
  })

  it("lights the wall as loud as Mix lets it out, and the fall from there is the wall's own", () => {
    const values = { mix: 0.45, decay: 6 }
    const view = viewOf(display, params, { values, width: 224, height: 48 })
    const { tail } = hazeBoxes(view)
    const seconds = hazeSeconds(
      6,
      view.value('size'),
      view.value('feed'),
      view.value('blur'),
      view.value('tone'),
    )
    const wet = hazeWetDb(0.45)
    // kit::equal_power: the wet gain is the sine of a quarter turn of Mix.
    expect(wet).toBeCloseTo(20 * Math.log10(Math.sin((Math.PI / 2) * 0.45)), 9)
    const lit = accentOf(
      drawDisplay(display, params, {
        values,
        width: 224,
        height: 48,
        meters: { push: 0.5, wall: 0.25 },
      }),
    )
    const wedge = lit.strokes.find((stroke) => stroke.points.length === 2 && stroke.width === 1.5)
    const level = gainToDb(0.25) + wet
    expect(wedge!.points[0]).toEqual(hazeTailAt(tail, 0, level))
    // It reaches the foot after the share of the fall that is left to it.
    const [endX, endY] = hazeTailAt(tail, (seconds * (level + 60)) / 60, -60)
    expect(wedge!.points[1][0]).toBeCloseTo(endX, 6)
    expect(wedge!.points[1][1]).toBeCloseTo(endY, 6)
  })

  it('lights nothing in silence, switched off, or with Mix at nothing', () => {
    const none = (options: Parameters<typeof drawDisplay>[2]): void => {
      const lit = accentOf(drawDisplay(display, params, options))
      expect(lit.strokes).toEqual([])
      expect(lit.dots).toEqual([])
    }
    none({ meters: { push: 0, wall: 0 } })
    none({ meters: { push: 1.2, wall: 0.5 }, powered: false })
    none({ meters: { push: 1.2, wall: 0.5 }, values: { mix: 0 } })
    // A device that reports nothing (an older build) lights nothing either.
    none({})
    // Mix at nothing still draws the curve and the fall it is set to.
    const still = linesOf(
      drawDisplay(display, params, { values: { mix: 0 }, meters: { push: 1.2, wall: 0.5 } }),
    )
    expect(
      still.strokes.filter((stroke) => stroke.colour === PLAIN_COLOURS.ink).length,
    ).toBeGreaterThan(3)
  })

  it('follows the readings as it runs: up at once, down over a few frames', () => {
    // Sound for a third of a second, then none: the dots after so many seconds in all.
    const dots = (seconds: number): number =>
      accentOf(
        runDisplay(display, params, seconds, {}, (time) => ({
          meters: time < 0.3 ? { push: 1.4, wall: 0.3 } : { push: 0, wall: 0 },
        })),
      ).dots.length
    expect(dots(0.25)).toBe(2)
    // The sound stops: the marks are still falling a tenth of a second on, and gone in two seconds.
    expect(dots(0.4)).toBe(2)
    expect(dots(2.5)).toBe(0)
  })
})
