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
  HAZE_STEP,
  fastTanh,
  hazeBendAt,
  hazeBoxes,
  hazeCurve,
  hazeCurveAt,
  hazeDecayFor,
  hazeDrive,
  hazeDriveAt,
  hazeFall,
  hazeFallEnd,
  hazeFallNear,
  hazeFollow,
  hazeLevelOf,
  hazeNowAt,
  hazePush,
  hazeTailAt,
  hazeToneDb,
  hazeTrace,
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
    expect(HAZE.driveMax).toBe(constant('kDriveMax'))
    expect(HAZE.driveCurve).toBe(constant('kDriveCurve'))
    expect(HAZE.driveLeast).toBe(constant('kDriveLeast'))
    expect(HAZE.followLevel).toBe(constant('kFollowLevel'))
    expect(HAZE.followMost).toBe(constant('kFollowMost'))
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
    // The middle line of the eight is the one the fall is worked out for.
    const lines = constants('kLineSeconds')
    expect(lines).toHaveLength(8)
    expect(HAZE.lineSeconds).toBe(lines[4])
    expect(header).toContain('const float middle = gain_to_[kLines / 2];')
  })

  it('draws nothing that the header has no sum for', () => {
    // Feed and Blur hold the wall up by an amount that was once a fit to
    // measurements (within a quarter): the display has no figure for either now.
    expect(display.params).not.toContain('feed')
    expect(display.params).not.toContain('blur')
    expect(Object.keys(HAZE).join(' ')).not.toMatch(/feed|blur/i)
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
function headerCurve(q: number, haze: number, octave: number, level = 1): number {
  // `apply()` and `render()`: Haze's drive, the share of it this level is given, never quite nothing.
  const asked =
    (constant('kDriveMax') * (Math.pow(constant('kDriveCurve'), haze) - 1)) /
    (constant('kDriveCurve') - 1)
  const follow = Math.sqrt(
    ((1 + constant('kFollowLevel')) * level) / (level + constant('kFollowLevel')),
  )
  const drive = Math.max(asked * Math.min(follow, constant('kFollowMost')), constant('kDriveLeast'))
  const folded = constant('kFoldMost') * octave
  const cycle = Array.from({ length: 4800 }, (_, j) => Math.sin((2 * Math.PI * (j + 0.5)) / 4800))
  const mean = cycle.reduce((sum, n) => sum + fold(n), 0) / cycle.length
  const driven = (n: number): number =>
    fastTanh(drive * ((1 - folded) * n + folded * kFoldGain * (fold(n) - mean)))
  // The DC blocker after the curve (`dc_`, 20 Hz) takes out the mean of what a held wave leaves.
  const dc = cycle.reduce((sum, n) => sum + driven(n), 0) / cycle.length
  // `curve()` takes 1 / drive on the spot, and `post_` keeps the hold of the push.
  return ((driven(q) - dc) / drive) * headerHold(drive, headerTable(folded))
}

describe("the curve of Haze's display", () => {
  it("is the kit's tanh", () => {
    // kit::fast_tanh (cpp/kit/math.h): x (27 + x²) / (27 + 9 x²), held to ±3.
    expect(fastTanh(0.5)).toBeCloseTo((0.5 * 27.25) / 29.25, 12)
    expect(fastTanh(3)).toBe(1)
    expect(fastTanh(-7)).toBe(-1)
  })

  it('is the drive the device has at each Haze: none at the bottom', () => {
    expect(hazeDrive(0)).toBe(0)
    expect(hazeDrive(0.5)).toBeCloseTo((8 * (Math.sqrt(24) - 1)) / 23, 9)
    expect(hazeDrive(1)).toBeCloseTo(8, 9)
    expect(header).toContain(
      'drive_.set(kDriveMax * (std::pow(kDriveCurve, value) - 1.0f) / (kDriveCurve - 1.0f), primed());',
    )
  })

  it('gives a softer sound less of that drive, as the device does', () => {
    expect(header).toContain(
      'const float follow = std::sqrt((1.0f + kFollowLevel) * level / (level + kFollowLevel));',
    )
    expect(header).toContain(
      'const float drive = kit::max(glide(drive_) * kit::min(follow, kFollowMost), kDriveLeast);',
    )
    expect(header).toContain('const float push = drive * level * norm;')
    expect(hazeFollow(1)).toBeCloseTo(1, 12)
    expect(hazeFollow(0.25)).toBeCloseTo(Math.sqrt(1.25 * 0.5), 12)
    expect(hazeFollow(4)).toBe(1)
    expect(hazeFollow(0)).toBe(0)
    expect(hazeDriveAt(0.55, 1)).toBeCloseTo(hazeDrive(0.55), 12)
    expect(hazeDriveAt(0.55, 0.05)).toBeCloseTo(
      hazeDrive(0.55) * Math.sqrt((1.25 * 0.05) / 0.3),
      12,
    )
    // Never quite nothing: the curve is a wire by then.
    expect(hazeDriveAt(0, 1)).toBe(HAZE.driveLeast)
    expect(hazePush(0.55, 0.5)).toBeCloseTo((hazeDriveAt(0.55, 0.5) * 0.5) / 0.51, 12)
  })

  it('works the level back out of the push it reads, at every Haze', () => {
    for (const haze of [0, 0.1, 0.55, 1]) {
      for (const level of [0.001, 0.01, 0.06, 0.25, 0.7, 1, 1.6]) {
        const back = hazeLevelOf(hazePush(haze, level), haze)
        expect(back / level, `Haze ${haze}, level ${level}`).toBeGreaterThan(0.999)
        expect(back / level, `Haze ${haze}, level ${level}`).toBeLessThan(1.001)
      }
    }
    expect(hazeLevelOf(0, 0.55)).toBe(0)
  })

  it('is the curve the header works out, at every Haze, Octave and level', () => {
    let worst = 0
    for (const haze of [0, 0.25, 0.55, 0.8, 1]) {
      for (const octave of [0, 0.2, 0.6, 1]) {
        for (let q = -1; q <= 1.0001; q += 0.1) {
          worst = Math.max(
            worst,
            Math.abs(hazeCurve(q, haze, octave) - headerCurve(q, haze, octave)),
          )
          for (const level of [0.03, 0.2]) {
            const now = hazeBendAt(hazeDriveAt(haze, level), octave)
            worst = Math.max(worst, Math.abs(now(q) - headerCurve(q, haze, octave, level)))
          }
        }
      }
    }
    // The display works the hold out at the drive itself and the two means
    // over fewer points; the header reads the hold between two points of its
    // table and the device's means are running ones: they part by under 0.02.
    expect(worst).toBeLessThan(0.02)
    expect(header).toContain('dc_[c].process(outer_[c].down(half[0], half[1])) * post')
    expect(header).toContain(
      'return gain * kit::fast_tanh(drive * (keep * q + fold * kFoldGain * (folded - *mean)));',
    )
  }, 60000)

  it('leaves a sine as loud as it came, which is what the device was measured to do', () => {
    // haze_test.cpp: a sine in at -15.1 dB leaves at -16.2 to -15.8 dB over Haze.
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

  it('is straight at Haze 0, bends more with Haze, less for a softer sound, and folds over with Octave', () => {
    // No drive: the line of no change. Full drive: flat at the top.
    for (const q of [-1, -0.4, 0.3, 1]) expect(hazeCurve(q, 0, 0)).toBeCloseTo(q, 5)
    expect(hazeCurve(0.5, 1, 0) / hazeCurve(1, 1, 0)).toBeGreaterThan(0.95)
    // A sound 26 dB under full scale is on a straighter curve than a full one.
    const soft = hazeBendAt(hazeDriveAt(0.8, 0.05), 0)
    const full = hazeBendAt(hazeDriveAt(0.8, 1), 0)
    expect(soft(0.5) / soft(1)).toBeLessThan(full(0.5) / full(1) - 0.1)
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
  // `derive()`: below the middle of Tone the lows stay and the highs go; above it both turn.
  const turn = 2 * tone - 1
  const tiltLow = Math.pow(10, (-Math.max(turn, 0) * constant('kTiltLowDb')) / 20)
  const tiltHigh = Math.pow(
    10,
    (turn > 0
      ? turn * constant('kTiltHighDb')
      : turn * (constant('kTiltHighDb') + constant('kTiltLowDb'))) / 20,
  )
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
    expect(header).toContain(
      'const float tilt_low = kit::db_to_gain(-kit::max(turn, 0.0f) * kTiltLowDb);',
    )
    expect(header).toContain(
      'kit::db_to_gain(turn > 0.0f ? turn * kTiltHighDb : turn * (kTiltHighDb + kTiltLowDb));',
    )
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

  it('leave the lows where they were below the middle of Tone', () => {
    // A dark wall is not a louder one: the tilt adds nothing under the middle.
    for (const tone of [0, 0.2, 0.4, 0.5]) expect(Math.abs(hazeToneDb(60, tone))).toBeLessThan(0.1)
    expect(hazeToneDb(60, 1)).toBeLessThan(-2.5)
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
    // takes 0.55 dB a pass at 3 kHz beside the gain's 2.37, and the read
    // between two samples 0.11 more (the lines stand still, each at its own
    // place between two samples: 1 − (1 − cos w) / 3 of the power over the
    // eight of them, w = 0.393), so 60 dB take 60 × 0.0791 / 3.03 = 1.57 s.
    expect(header).toContain(
      'v[n] = line_[n].read_linear(kit::clamp(length_[n] * size, 2.0f, max_line));',
    )
    expect(hazeFall(HAZE_HIGH_HZ, 2, 0.6)).toBeCloseTo(1.57, 2)
    expect(hazeFall(HAZE_HIGH_HZ, 8, 0.6)).toBeCloseTo(6.12, 2)
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

async function deviceAt(values: Readonly<Record<string, number>>): Promise<WasmDeviceHarness> {
  const device = await loadWasmDevice('haze')
  for (const [name, value] of Object.entries(values)) device.set(params[name], value)
  return device
}

/**
 * The seconds haze.wasm takes to fall 60 dB about a frequency: a band of noise
 * about `hz` held for two seconds through the wall alone, clean (Haze and
 * Octave at nothing, so what rings is what went in), and the seconds from its
 * end until the level of the two sides (windows of 51 ms) is 60 dB under the
 * level of its last 200 ms. The mean of two noises.
 */
async function fallOf(values: Readonly<Record<string, number>>, hz: number): Promise<number> {
  const rate = 48000
  const block = 128
  const held = 2
  const decay = values.decay ?? params.decay.default
  let total = 0
  for (const seed of [0xfeed, 0xbeef]) {
    const device = await deviceAt({ haze: 0, octave: 0, ...values, mix: 1 })
    let state = seed
    // A resonator about `hz`, some 75 Hz wide.
    const r = 0.995
    const turn = 2 * r * Math.cos((2 * Math.PI * hz) / rate)
    let y1 = 0
    let y2 = 0
    const input = new Float32Array(block)
    const blocks = Math.ceil(((held + decay * 3 + 3) * rate) / block)
    const heldBlocks = Math.round((held * rate) / block)
    const power: number[] = []
    let reference = 0
    for (let n = 0; n < blocks; n++) {
      for (let i = 0; i < block; i++) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0
        const white = n < heldBlocks ? state / 2147483648 - 1 : 0
        const y = white + turn * y1 - r * r * y2
        y2 = y1
        y1 = y
        input[i] = n < heldBlocks ? y * 0.02 * Math.sqrt(hz / 250) : 0
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
  it("is the middle line's gain a pass and the damping on top of it", () => {
    expect(header).toContain(
      'const float exponent = -3.0f * length_[n] * size / (decay * sr);  // log10 of the gain',
    )
    expect(header).toContain('gain_to_[n] = std::pow(10.0f, exponent);')
    expect(header).toContain('damping_[n].a = kit::min(kDampingSlope * exponent, kDampingMost);')
    // By hand at Decay 6 s, Size 0.6: a pass of 79.1 ms loses 60 × 0.0791 / 6 = 0.791 dB,
    // and the damping (pole 0.12) takes 0.001 dB more at 250 Hz: 6.0 s all but a hundredth.
    expect(hazeFall(HAZE_BODY_HZ, 6, 0.6)).toBeGreaterThan(5.98)
    expect(hazeFall(HAZE_BODY_HZ, 6, 0.6)).toBeLessThan(6)
  })

  it('takes as long as haze.wasm does about 250 Hz with nothing fed back and nothing blurred', async () => {
    const settings: Record<string, number>[] = [
      { decay: 1, size: 0.6 },
      { decay: 2, size: 0 },
      { decay: 4, size: 1 },
      { decay: 6, size: 0.6, tone: 0 },
    ]
    for (const values of settings) {
      const drawn = hazeFall(HAZE_BODY_HZ, values.decay, values.size)
      const measured = await fallOf({ ...values, feed: 0, blur: 0 }, HAZE_BODY_HZ)
      expect(
        Math.abs(drawn / measured - 1),
        `${JSON.stringify(values)}: ${drawn.toFixed(2)} s drawn, ${measured.toFixed(2)} s from haze.wasm`,
      ).toBeLessThan(0.08)
    }
  }, 60000)

  it('and its highs as long as haze.wasm does about 3 kHz', async () => {
    for (const decay of [2, 6]) {
      const drawn = hazeFall(HAZE_HIGH_HZ, decay, 0.6)
      const measured = await fallOf({ decay, size: 0.6, feed: 0, blur: 0, tone: 1 }, HAZE_HIGH_HZ)
      expect(
        Math.abs(drawn / measured - 1),
        `Decay ${decay}: ${drawn.toFixed(2)} s drawn, ${measured.toFixed(2)} s from haze.wasm`,
      ).toBeLessThan(0.1)
    }
  }, 60000)

  it('grows with Decay over the whole of it, and a Decay is found again from its fall', () => {
    for (const size of [0, 0.6, 1]) {
      let before = 0
      for (let decay = 0.5; decay <= 30; decay *= 1.25) {
        const seconds = hazeFall(HAZE_BODY_HZ, decay, size)
        expect(seconds).toBeGreaterThan(before)
        before = seconds
        expect(hazeDecayFor(seconds, size, 0.5, 30)).toBeCloseTo(decay, 6)
      }
      expect(hazeDecayFor(0.01, size, 0.5, 30)).toBe(0.5)
      expect(hazeDecayFor(500, size, 0.5, 30)).toBe(30)
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

/** What a search found, or the test stops here saying what it did not find. */
function found<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`${what} is not drawn`)
  return value
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
      const settings: Record<string, number>[] = [
        {},
        { haze: 1, octave: 1, decay: 2, feed: 1 },
        { haze: 0, decay: 30, blur: 1 },
      ]
      for (const values of settings) {
        const view = viewOf(display, params, { values, width, height })
        const { curve, tail } = hazeBoxes(view)
        const { strokes } = linesOf(drawDisplay(display, params, { values, width, height }))
        const ink = strokes.filter((stroke) => stroke.colour === PLAIN_COLOURS.ink)
        // The curve: a point for every pixel across its box, each on the device's curve.
        const bent = found(
          ink.find((stroke) => stroke.points.length === curve.w + 1),
          'the curve',
        )
        for (const q of [-1, -0.5, 0, 0.5, 1]) {
          const [x, y] = hazeCurveAt(curve, q, view.value('haze'), view.value('octave'))
          // Between two pixels the drawn curve is straight: half a pixel of a steep stretch.
          expect(Math.abs(heightAt(bent.points, x) - y), `the curve at ${q}`).toBeLessThan(0.6)
        }
        // The fall: from the wall's own level at the stop to 60 dB under it at the seconds
        // the wall itself takes about 250 Hz, whatever Feed and Blur are.
        const seconds = hazeFall(HAZE_BODY_HZ, view.value('decay'), view.value('size'))
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
    // And back: the fall whose end is the point of the end's path nearest a hand.
    expect(hazeFallNear(tail, x, y)).toBeCloseTo(24, 6)
    expect(hazeFallNear(tail, hazeTailAt(tail, 3, 0)[0], foot)).toBeCloseTo(3, 6)
    // A hand that strays up off the foot still has the end under it, across.
    expect(hazeFallNear(tail, hazeTailAt(tail, 3, 0)[0], foot - 9)).toBeCloseTo(3, 6)
    // And one that strays in from the right edge has it level with it.
    expect(hazeFallNear(tail, x - 6, y)).toBeCloseTo(24, 6)
    // Past the box on either side the end stops at the corner or the edge.
    expect(hazeFallNear(tail, tail.x + tail.w + 40, foot + 30)).toBeCloseTo(12, 6)
    expect(hazeFallNear(tail, tail.x - 30, foot + 5)).toBeCloseTo(0.01, 6)
  })

  it('draws the highs from where Tone puts them, falling as the damping has them', () => {
    for (const tone of [0.5, 1]) {
      const values = { tone, decay: 4 }
      const view = viewOf(display, params, { values })
      const { tail } = hazeBoxes(view)
      const { strokes } = linesOf(drawDisplay(display, params, { values }))
      const highDb = hazeToneDb(HAZE_HIGH_HZ, tone) - hazeToneDb(HAZE_BODY_HZ, tone)
      const seconds = hazeFall(HAZE_HIGH_HZ, 4, view.value('size'))
      const [fromX, fromY] = hazeTailAt(tail, 0, highDb)
      const [toX, toY] = hazeTailAt(tail, (seconds * (highDb + 60)) / 60, -60)
      const highs = strokes.find(
        (stroke) =>
          stroke.points.length === 2 &&
          Math.abs(stroke.points[0][0] - fromX) < 0.01 &&
          Math.abs(stroke.points[0][1] - fromY) < 0.01 &&
          Math.abs(stroke.points[1][0] - toX) < 0.01 &&
          Math.abs(stroke.points[1][1] - toY) < 0.01,
      )
      expect(highs, `the highs at Tone ${tone}`).toBeDefined()
    }
  })

  it('writes the seconds of the fall', () => {
    const words = (values: Record<string, number>): string[] =>
      drawDisplay(display, params, { values }).words()
    const at = (decay: number): string =>
      `${hazeFall(HAZE_BODY_HZ, decay, params.size.default).toFixed(1)} s`
    expect(words({})).toContain(at(params.decay.default))
    expect(words({})).toContain('6.0 s')
    // The wall's own, with Feed up or not: no figure is claimed for what Feed adds.
    expect(words({ decay: 2, feed: 1 })).toContain(at(2))
    expect(words({ decay: 30, feed: 0 })).toContain(at(30))
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
      const settings: Record<string, number>[] = [
        {},
        { haze: 0 },
        { haze: 1, octave: 1 },
        { decay: 0.5 },
        { decay: 30, feed: 1 },
      ]
      for (const values of settings) {
        const view = viewOf(display, params, { values, width, height })
        const { curve, tail } = hazeBoxes(view)
        const { haze, decay } = handlesAt(values, width, height)
        // On the curve: the level the point stands at is read back from where it stands.
        const bent = found(
          linesOf(drawDisplay(display, params, { values, width, height })).strokes.find(
            (stroke) => stroke.colour === PLAIN_COLOURS.ink && stroke.points.length === curve.w + 1,
          ),
          'the curve',
        )
        expect(
          Math.abs(heightAt(bent.points, haze.x) - haze.y),
          'the Haze point is on the curve',
        ).toBeLessThan(0.6)
        const seconds = hazeFall(HAZE_BODY_HZ, view.value('decay'), view.value('size'))
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

  it('set Decay to the value whose fall ends under the hand, along the foot and up the right edge', () => {
    for (const [width, height] of sizes) {
      const { tail } = hazeBoxes({ width, height })
      const foot = tail.y + tail.h
      const others: Record<string, number>[] = [{}, { feed: 1, blur: 1 }, { size: 0 }, { size: 1 }]
      for (const rest of others) {
        const size = rest.size ?? params.size.default
        const fallOfDecay = (decay: number): number => hazeFall(HAZE_BODY_HZ, decay, size)
        for (const seconds of [1, 3, 5, 8, 11]) {
          // Along the foot, and with the hand strayed up off it: the fall ends under the hand.
          for (const stray of [0, 4, 11]) {
            const [x] = hazeTailAt(tail, seconds, 0)
            // (Nearer the right edge than the foot, the end is on the edge: not this hand.)
            if (stray > tail.x + tail.w - x - 0.5) continue
            const set = handlesAt({ ...rest, decay: 1.3 }, width, height).decay.drag(
              x,
              foot - stray,
            )
            expect(Object.keys(set)).toEqual(['decay'])
            expect(fallOfDecay(set.decay)).toBeCloseTo(seconds, 6)
            const moved = handlesAt({ ...rest, decay: set.decay }, width, height).decay
            expect(moved.x).toBeCloseTo(x, 6)
            expect(moved.y).toBeCloseTo(foot, 6)
          }
        }
        // On the right edge, and strayed in from it: a fall longer than the picture, ending level with the hand.
        for (const seconds of [14, 18, 26]) {
          for (const stray of [0, 3, 8]) {
            const [edgeX, edgeY] = hazeFallEnd(tail, seconds)
            // (Nearer the foot than the edge, the end is on the foot: not this hand.)
            if (stray > foot - edgeY - 0.5) continue
            const long = handlesAt({ ...rest, decay: 1.3 }, width, height).decay.drag(
              edgeX - stray,
              edgeY,
            ).decay
            expect(fallOfDecay(long)).toBeCloseTo(seconds, 6)
            const moved = handlesAt({ ...rest, decay: long }, width, height).decay
            expect(moved.x).toBeCloseTo(edgeX, 6)
            expect(moved.y).toBeCloseTo(edgeY, 6)
          }
        }
      }
      // Past what Decay can do it stops at its ends.
      expect(handlesAt({}, width, height).decay.drag(tail.x, foot).decay).toBe(params.decay.min)
      expect(handlesAt({}, width, height).decay.drag(tail.x + tail.w, tail.y).decay).toBe(
        params.decay.max,
      )
      expect(handlesAt({}, width, height).decay.drag(tail.x - 50, foot + 20).decay).toBe(
        params.decay.min,
      )
    }
  })

  it('leave a handle where it is when the hand has not moved', () => {
    const { haze, decay } = handlesAt({ haze: 0.37, decay: 7.3 })
    expect(haze.drag(haze.x, haze.y)).toEqual({ haze: 0.37 })
    expect(decay.drag(decay.x, decay.y)).toEqual({ decay: 7.3 })
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
  ): { strokes: Stroke[]; dots: { x: number; y: number }[]; now: { x: number; y: number }[] } => {
    const { strokes, circles } = linesOf(drawn)
    return {
      strokes: strokes.filter((stroke) => stroke.colour === PLAIN_COLOURS.accent),
      dots: circles.filter((circle) => circle.r === 2.5),
      now: circles.filter((circle) => circle.r === 2),
    }
  }

  it('reads the push and the wall from the device, which reports what its header says', async () => {
    // `render()`: push = the drive in use × level / (level + kFloor), the level
    // a sine's peak; the wall is the peak that leaves before Mix. A 220 Hz sine
    // at 0.25 with nothing blurred: the level is 0.25 (the 5 kHz low-pass
    // before the fuzz takes a thousandth).
    for (const haze of [0, 0.55, 1]) {
      const device = await deviceAt({ haze, blur: 0, mix: 1 })
      const peak = device.feedTone(1.5, 220, 0.25, 1.4)
      const push = device.device.device_meter?.(0) ?? Number.NaN
      const wall = device.device.device_meter?.(1) ?? Number.NaN
      expect(push / hazePush(haze, 0.25), `the push at Haze ${haze}`).toBeGreaterThan(0.97)
      expect(push / hazePush(haze, 0.25), `the push at Haze ${haze}`).toBeLessThan(1.03)
      // The wall's meter is its peak over the last tenth of a second; Mix is at 1, so that is what left.
      expect(wall).toBeGreaterThan(0)
      expect(Math.abs(gainToDb(wall) - gainToDb(peak))).toBeLessThan(1.5)

      // Drawn: the dots stand at the ends of the curve this level is on, 0.96 of the way out.
      const values = { haze, blur: 0, mix: 1 }
      const view = viewOf(display, params, { values, width: 224, height: 48 })
      const { curve, tail } = hazeBoxes(view)
      const lit = accentOf(
        drawDisplay(display, params, { values, width: 224, height: 48, meters: { push, wall } }),
      )
      const level = hazeLevelOf(push, haze)
      const reach = level / (level + HAZE.floor)
      expect(reach).toBeGreaterThan(0.95)
      expect(reach).toBeLessThan(0.975)
      expect(lit.dots).toHaveLength(2)
      for (const [n, side] of [-1, 1].entries()) {
        const [x, y] = hazeNowAt(curve, side * reach, haze, view.value('octave'), level)
        expect(lit.dots[n].x).toBeCloseTo(x, 6)
        expect(lit.dots[n].y).toBeCloseTo(y, 6)
      }
      // A sound at a quarter of full scale is on a straighter curve than the ink one.
      if (haze > 0) {
        const octave = view.value('octave')
        const ink = hazeBendAt(hazeDriveAt(haze, 1), octave)
        const now = hazeBendAt(hazeDriveAt(haze, level), octave)
        expect(now(0.25) / now(1)).toBeLessThan(ink(0.25) / ink(1) - 0.01)
        expect(hazeNowAt(curve, 0.25, haze, octave, level)[1]).toBeGreaterThan(
          hazeCurveAt(curve, 0.25, haze, octave)[1],
        )
      }
      // And the wall is lit from its level now, falling as the wall falls.
      const [x0, y0] = hazeTailAt(tail, 0, gainToDb(wall))
      const wedge = found(
        lit.strokes.find(
          (stroke) => stroke.points.length === 2 && Math.abs(stroke.points[0][0] - x0) < 0.01,
        ),
        'the lit fall',
      )
      expect(wedge.points[0][1]).toBeCloseTo(y0, 6)
    }
  })

  it("lights the wall as loud as Mix lets it out, and the fall from there is the wall's own", () => {
    const values = { mix: 0.45, decay: 6 }
    const view = viewOf(display, params, { values, width: 224, height: 48 })
    const { tail } = hazeBoxes(view)
    const seconds = hazeFall(HAZE_BODY_HZ, 6, view.value('size'))
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
    const wedge = found(
      lit.strokes.find((stroke) => stroke.points.length === 2 && stroke.width === 1.5),
      'the lit fall',
    )
    const level = gainToDb(0.25) + wet
    expect(wedge.points[0]).toEqual(hazeTailAt(tail, 0, level))
    // It reaches the foot after the share of the fall that is left to it.
    const [endX, endY] = hazeTailAt(tail, (seconds * (level + 60)) / 60, -60)
    expect(wedge.points[1][0]).toBeCloseTo(endX, 6)
    expect(wedge.points[1][1]).toBeCloseTo(endY, 6)
    // A still picture has no past: no point for "now" on the way down.
    expect(lit.now).toEqual([])
  })

  it('lights nothing in silence, switched off, or with Mix at nothing', () => {
    const none = (options: Parameters<typeof drawDisplay>[2]): void => {
      const lit = accentOf(drawDisplay(display, params, options))
      expect(lit.strokes).toEqual([])
      expect(lit.dots).toEqual([])
      expect(lit.now).toEqual([])
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

  it('keeps the wall as it reads on the way down: one point while it stands, a level every step once it falls', () => {
    const state = { past: [] as number[], clock: 0, top: Number.NEGATIVE_INFINITY }
    const frame = 1 / 30
    // Standing at its height, a little up and down: one point at 0 s.
    for (const db of [-12, -11.4, -12.3, -11.8, -12.6]) hazeTrace(state, db, frame)
    expect(state.past).toEqual([-12.6])
    expect(state.clock).toBe(0)
    expect(state.top).toBe(-11.4)
    // Falling 6 dB a second for four seconds: the level at every step since it left its height.
    let db = -12.6
    for (let n = 0; n < 120; n++) {
      db -= 6 * frame
      hazeTrace(state, db, frame)
    }
    expect(state.clock).toBeGreaterThan(3.9)
    expect(state.past.length).toBe(Math.floor(state.clock / HAZE_STEP) + 1)
    for (let k = 1; k < state.past.length; k++) {
      // The level put down at step k is the level a frame at most after k steps of the fall.
      const since = state.past[0] - state.past[k]
      expect(since).toBeGreaterThan(6 * k * HAZE_STEP - 0.01)
      expect(since).toBeLessThan(6 * (k * HAZE_STEP + frame) + 0.01)
    }
    // New playing: a rise of 3 dB begins it again at 0 s, from the new level.
    hazeTrace(state, db + 5, frame)
    expect(state.past).toEqual([db + 5])
    expect(state.clock).toBe(0)
    expect(state.top).toBe(db + 5)
    // A level that stops falling (a held sound, softer than before) is no fall: again from there.
    for (let n = 0; n < 20; n++) hazeTrace(state, (db -= 0.4), frame)
    expect(state.past.length).toBeGreaterThan(1)
    for (let n = 0; n < 60; n++) hazeTrace(state, db, frame)
    expect(state.past).toEqual([db])
    expect(state.clock).toBe(0)
    // Under the quiet line nothing is kept.
    hazeTrace(state, -70, frame)
    expect(state.past).toEqual([])
    hazeTrace(state, Number.NEGATIVE_INFINITY, frame)
    expect(state.past).toEqual([])
    expect(state.top).toBe(Number.NEGATIVE_INFINITY)
  })

  it("draws that past in the second ink, and from now on down at the wall's own rate", () => {
    // The wall stands for a second, then falls 5 dB a second: half as fast as
    // the wall's own 6 s would have it, as it does with Feed up.
    const values = { mix: 1, decay: 6 }
    const view = viewOf(display, params, { values, width: 224, height: 48 })
    const { tail } = hazeBoxes(view)
    const own = hazeFall(HAZE_BODY_HZ, 6, view.value('size'))
    const top = gainToDb(0.5)
    const wallAt = (time: number): number => 0.5 * Math.pow(10, (-5 * Math.max(0, time - 1)) / 20)
    const drawn = accentOf(
      runDisplay(display, params, 5, { values, width: 224, height: 48 }, (time) => ({
        meters: { push: 1.4, wall: wallAt(time) },
      })),
    )
    const lit = found(
      drawn.strokes.find((stroke) => stroke.width === 1.5),
      'the lit fall',
    )
    // It began when the wall had left its height by 1.5 dB (0.3 s into the fall), so 3.7 s are kept.
    const now = found(drawn.now[0], 'the point for now')
    const [nowX] = hazeTailAt(tail, 3.7, 0)
    expect(Math.abs(now.x - nowX)).toBeLessThan(tail.w / 60)
    // Each second of it stands where the level was read: 5 dB lower each, not the wall's own 10.
    const dbPerPx = 70 / tail.h
    for (const seconds of [1, 2, 3]) {
      const [x, y] = hazeTailAt(tail, seconds, top - 1.5 - 5 * seconds)
      expect(
        Math.abs(heightAt(lit.points, x) - y) * dbPerPx,
        `${seconds} s into the fall`,
      ).toBeLessThan(1)
    }
    // From now on down: straight to the foot at the wall's own rate.
    const end = lit.points[lit.points.length - 1]
    const level = top - 5 * 4
    const [endX, endY] = hazeTailAt(tail, 3.7 + (own * (level + 60)) / 60, -60)
    expect(end[1]).toBeCloseTo(endY, 6)
    expect(Math.abs(end[0] - endX)).toBeLessThan(tail.w / 40)
    // Nothing of it is left once the wall is silent.
    const after = accentOf(
      runDisplay(display, params, 6, { values, width: 224, height: 48 }, (time) => ({
        meters: time < 5 ? { push: 1.4, wall: wallAt(time) } : { push: 0, wall: 0 },
      })),
    )
    expect(after.strokes.filter((stroke) => stroke.width === 1.5)).toEqual([])
    expect(after.now).toEqual([])
  })
})
