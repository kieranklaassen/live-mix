// The display of Coloured Noise: its arithmetic held to the device's (the
// compiled module is rendered at 48 kHz and its spectrum, its swells, its
// envelope and its width are compared with what the display draws), what it
// draws, and that nothing on it moves in time with a pulse.

import { describe, expect, it } from 'vitest'

import { COLOURED_NOISE_PARAMS } from '../../dsp/devices/coloured-noise.gen'
import { fft } from '../../dsp/__tests__/render-support'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { INK, PLAIN_COLOURS, fillRect, ground, hzOfX, xOfHz } from '../components/display-kit'
import {
  COLOURED_NOISE_DRIFT_FOOT_DB,
  COLOURED_NOISE_FACES,
  COLOURED_NOISE_FOOT_DB,
  COLOURED_NOISE_LEVEL_SEC,
  COLOURED_NOISE_RMS,
  COLOURED_NOISE_SPAN,
  COLOURED_NOISE_TOP_DB,
  COLOURED_NOISE_TOP_HZ,
  colouredNoiseAttack,
  colouredNoiseBands,
  colouredNoiseColour,
  colouredNoiseCurveY,
  colouredNoiseCut,
  colouredNoiseCutHz,
  colouredNoiseDb,
  colouredNoiseDriftLevel,
  colouredNoiseDriftPoints,
  colouredNoiseDriftTone,
  colouredNoiseDriftY,
  colouredNoiseKey,
  colouredNoiseLayout,
  colouredNoisePeak,
  colouredNoisePeakText,
  colouredNoiseRelease,
  colouredNoiseRun,
  colouredNoiseSideOverMid,
  colouredNoiseSlopeText,
  colouredNoiseSwell,
  colouredNoiseTimeText,
  colouredNoiseTint,
  colouredNoiseTrain,
  type ColouredNoiseBed,
  type ColouredNoiseKey,
} from '../components/displays/coloured-noise'
import {
  plateDisplay,
  type DisplayLevel,
  type DisplayNote,
  type DisplaySignal,
  type PlateDisplay,
} from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  runDisplay,
  type DrawnPath,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const RATE = 48000
const display = COLOURED_NOISE_FACES['coloured-noise'].display

type Values = Readonly<Record<string, number>>

const valueOf = (values: Values, name: string): number =>
  values[name] ?? COLOURED_NOISE_PARAMS[name as keyof typeof COLOURED_NOISE_PARAMS].default

const bedOf = (values: Values = {}): ColouredNoiseBed => ({
  colour: valueOf(values, 'colour'),
  lowCut: valueOf(values, 'lowCut'),
  highCut: valueOf(values, 'highCut'),
})

async function deviceAt(values: Values): Promise<WasmDeviceHarness> {
  const device = await loadWasmDevice('coloured-noise', RATE)
  for (const [name, value] of Object.entries(values))
    device.set(COLOURED_NOISE_PARAMS[name as keyof typeof COLOURED_NOISE_PARAMS], value)
  return device
}

interface Sides {
  left: Float32Array
  right: Float32Array
}

/** What the device puts out over `seconds`, a sample at a time: its two sides. */
function render(device: WasmDeviceHarness, seconds: number): Sides {
  const total = Math.round(seconds * RATE)
  const left = new Float32Array(total)
  const right = new Float32Array(total)
  const silence = new Float32Array(128)
  for (let done = 0; done < total; done += 128) {
    const frames = Math.min(128, total - done)
    device.processBlock(silence.subarray(0, frames))
    left.set(device.view(device.device.device_out_left(), frames), done)
    right.set(device.view(device.device.device_out_right(), frames), done)
  }
  return { left, right }
}

function strike(device: WasmDeviceHarness, hz: number, id = 1, gain = 1): void {
  const on = device.device.device_note_on
  if (!on) throw new Error('the device takes no notes')
  on(id, hz, gain)
}

function letGo(device: WasmDeviceHarness, id = 1): void {
  device.device.device_note_off?.(id)
}

/** The settings a steady bed is measured at: no drift, both sides the same noise, up at once. */
const STEADY: Values = { drift: 0, width: 0, attack: 0.01 }

/** Keys held from the first sample on; each is a pitch and, if it has one, a gain. */
async function held(
  values: Values,
  seconds: number,
  keys: readonly (readonly [number, number?])[] = [[261.63]],
): Promise<Sides> {
  const device = await deviceAt({ ...STEADY, ...values })
  keys.forEach(([hz, gain], n) => strike(device, hz, n + 1, gain ?? 1))
  return render(device, seconds)
}

function rmsOver(signal: Float32Array, from: number, to: number): number {
  let sum = 0
  for (let n = from; n < to; n++) sum += signal[n] * signal[n]
  return Math.sqrt(sum / (to - from))
}

const SIZE = 16384
const BIN_HZ = RATE / SIZE

/**
 * The power of a signal in each bin of a transform of 16384 samples (2.9 Hz a
 * bin), from `from` samples on: one window after another, each under a raised
 * cosine, averaged, and scaled so the bins add up to the mean square.
 */
function powerOf(signal: Float32Array, from = RATE / 2): Float64Array {
  const power = new Float64Array(SIZE / 2 + 1)
  const re = new Float64Array(SIZE)
  const im = new Float64Array(SIZE)
  let windows = 0
  for (let start = from; start + SIZE <= signal.length; start += SIZE) {
    for (let i = 0; i < SIZE; i++) {
      re[i] = signal[start + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / SIZE))
      im[i] = 0
    }
    fft(re, im)
    for (let bin = 0; bin <= SIZE / 2; bin++) power[bin] += re[bin] * re[bin] + im[bin] * im[bin]
    windows += 1
  }
  // The window's own power is 3/8; a bin and its mirror are one.
  const scale = 2 / (windows * SIZE * SIZE * 0.375)
  for (let bin = 0; bin <= SIZE / 2; bin++) power[bin] *= scale
  return power
}

/** The power between two frequencies. */
function bandOf(power: Float64Array, fromHz: number, toHz: number): number {
  let sum = 0
  for (let bin = Math.ceil(fromHz / BIN_HZ); bin * BIN_HZ < toHz; bin++) sum += power[bin]
  return sum
}

const toDb = (ratio: number): number => 10 * Math.log10(ratio)

/** Volume as the device takes it: -12 dB at its default. */
const VOLUME = Math.pow(10, COLOURED_NOISE_PARAMS.volume.default / 20)

/**
 * What the display's arithmetic says the power of the mid is between two
 * frequencies. Each of the two noises is white noise of mean square a third
 * through the bed; at Width 0 both sides are half of each, so the mid is too.
 */
function expectedBand(bed: ColouredNoiseBed, fromHz: number, toHz: number): number {
  const white = colouredNoiseColour(0, 1000, RATE)
  // Summed over steps of equal ratio, a twelfth of a semitone each at the widest.
  const steps = Math.max(64, Math.ceil(Math.log2(toHz / fromHz) * 144))
  const ratio = Math.pow(toHz / fromHz, 1 / steps)
  let sum = 0
  for (let i = 0; i < steps; i++) {
    const low = fromHz * Math.pow(ratio, i)
    const gain = white * Math.pow(10, colouredNoiseDb(bed, [], low * Math.sqrt(ratio), RATE) / 20)
    sum += gain * gain * low * (ratio - 1)
  }
  const perHz = 1 / 3 / (RATE / 2)
  return 2 * 0.25 * sum * perHz * VOLUME * VOLUME
}

/** Third-octave bands from 40 Hz to 16 kHz. */
const BANDS: [number, number][] = Array.from({ length: 27 }, (_, n) => {
  const centre = 40 * Math.pow(2, n / 3)
  return [centre / Math.pow(2, 1 / 6), centre * Math.pow(2, 1 / 6)]
})

describe('the arithmetic of the Coloured Noise display against the device', () => {
  it('gives every Colour the RMS the device gives it', async () => {
    for (const colour of [0, 0.25, 0.5, 0.75, 1]) {
      const { left, right } = await held({ colour }, 12)
      // Width 0: the two sides are the same to the sample, half of each noise.
      expect(Array.from(left.subarray(0, 4096))).toEqual(Array.from(right.subarray(0, 4096)))
      const expected = (COLOURED_NOISE_RMS / Math.SQRT2) * VOLUME
      const measured = rmsOver(left, RATE / 2, left.length)
      expect(Math.abs(20 * Math.log10(measured / expected)), `Colour ${colour}`).toBeLessThan(0.4)
      // And the curve the display draws adds up to it.
      const drawn = Math.sqrt(expectedBand(bedOf({ colour }), 1, RATE / 2 - 1))
      expect(Math.abs(20 * Math.log10(drawn / expected)), `Colour ${colour} drawn`).toBeLessThan(
        0.15,
      )
    }
  })

  it.each([0, 0.3, 0.5, 1])(
    'draws the level in each third of an octave as the device makes it: Colour %s',
    async (colour) => {
      const power = powerOf((await held({ colour }, 30)).left)
      const bed = bedOf({ colour })
      for (const [from, to] of BANDS) {
        const off = toDb(bandOf(power, from, to) / expectedBand(bed, from, to))
        expect(Math.abs(off), `${Math.round(Math.sqrt(from * to))} Hz`).toBeLessThan(1)
      }
      // The slope itself: from 100 Hz to 6.4 kHz it falls by 6 dB times Colour an octave.
      const at = (hz: number): number => colouredNoiseDb(bed, [], hz, RATE)
      expect((at(100) - at(6400)) / 6).toBeGreaterThan(6 * colour - 0.2)
      expect((at(100) - at(6400)) / 6).toBeLessThan(6 * colour + 0.2)
    },
  )

  it('is flat white at 0 dB, and every Colour crosses it where one RMS puts it', () => {
    for (const hz of [50, 200, 1000, 5000, 15000])
      expect(Math.abs(colouredNoiseDb(bedOf({ colour: 0 }), [], hz, RATE))).toBeLessThan(0.25)
    const pink = (hz: number): number => colouredNoiseDb(bedOf({ colour: 0.5 }), [], hz, RATE)
    const brown = (hz: number): number => colouredNoiseDb(bedOf({ colour: 1 }), [], hz, RATE)
    expect(pink(100)).toBeGreaterThan(10)
    expect(pink(10000)).toBeLessThan(-3)
    expect(brown(40)).toBeGreaterThan(20)
    expect(brown(10000)).toBeLessThan(-20)
  })

  // What a change of setting does to the bed, read as the device's own change:
  // the same noise is rendered with and without it, and the two are compared
  // bin by bin.
  const changeAt = (changed: Float64Array, plain: Float64Array, hz: number): number => {
    const bin = Math.round(hz / BIN_HZ)
    return toDb(
      (changed[bin - 1] + changed[bin] + changed[bin + 1]) /
        (plain[bin - 1] + plain[bin] + plain[bin + 1]),
    )
  }

  const PLAIN_SECONDS = 12
  let plainPink: Promise<Float64Array> | null = null
  /** Steady pink noise under middle C, which every change below is read against. */
  const plainPower = (): Promise<Float64Array> => {
    plainPink ??= held({ colour: 0.5 }, PLAIN_SECONDS).then((sides) => powerOf(sides.left))
    return plainPink
  }

  it.each([0, 0.3, 0.8, 1])(
    'tilts the bed as the device tilts it, pole for pole: Colour %s against pink',
    async (colour) => {
      const plain = await plainPower()
      const tilted = powerOf((await held({ colour }, PLAIN_SECONDS)).left)
      let steepest = 0
      for (let hz = 40; hz < 16000; hz *= Math.pow(2, 1 / 6)) {
        const at = Math.round(hz / BIN_HZ) * BIN_HZ
        const drawn =
          20 *
          Math.log10(colouredNoiseColour(colour, at, RATE) / colouredNoiseColour(0.5, at, RATE))
        // The same noise through both, so this is the filter itself: within 0.05 dB as measured.
        expect(Math.abs(changeAt(tilted, plain, at) - drawn), `${Math.round(at)} Hz`).toBeLessThan(
          0.08,
        )
        steepest = Math.max(steepest, Math.abs(drawn))
      }
      // From end to end the two are far apart: 3 dB an octave for each half of Colour.
      expect(steepest).toBeGreaterThan(Math.abs(colour - 0.5) * 20)
    },
  )

  const CUTS: [string, Values][] = [
    ['a band in the middle', { lowCut: 200, highCut: 2000 }],
    ['both a third of an octave from their open ends', { lowCut: 25, highCut: 16000 }],
    ['both half an octave in, where the knob and the cut meet', { lowCut: 28.3, highCut: 14142 }],
    ['the low cut at its top', { lowCut: 2000 }],
    ['the high cut at its foot', { highCut: 500 }],
  ]

  it.each(CUTS)('cuts what the device cuts: %s', async (_what, values) => {
    const plain = await plainPower()
    const cut = powerOf((await held({ colour: 0.5, ...values }, PLAIN_SECONDS)).left)
    const lowCut = valueOf(values, 'lowCut')
    const highCut = valueOf(values, 'highCut')
    let compared = 0
    let deepest = 0
    const left = (hz: number): number =>
      colouredNoiseCut('low', lowCut, hz, RATE) * colouredNoiseCut('high', highCut, hz, RATE)
    for (let hz = 30; hz < 20000; hz *= Math.pow(2, 1 / 6)) {
      // The three bins the change is read from, as the display's arithmetic has them.
      const bin = Math.round(hz / BIN_HZ)
      const three = [bin - 1, bin, bin + 1].map((one) => left(one * BIN_HZ) ** 2)
      const drawn = toDb((three[0] + three[1] + three[2]) / 3)
      // Far down a cut the bins beside leak in; the display's foot is nearer than that.
      if (drawn < -45) continue
      // Under 100 Hz a bin is a tenth of an octave wide and a cut falls 2 dB across it.
      expect(Math.abs(changeAt(cut, plain, hz) - drawn), `${Math.round(hz)} Hz`).toBeLessThan(
        hz < 100 ? 1.2 : 0.6,
      )
      deepest = Math.min(deepest, drawn)
      compared += 1
    }
    expect(compared).toBeGreaterThan(12)
    expect(deepest).toBeLessThan(-3)
  })

  it('stands a cut where the device stands it', () => {
    // In the middle of its range a cut is where its knob is.
    expect(colouredNoiseCutHz('low', 200, RATE)).toBeCloseTo(200, 6)
    expect(colouredNoiseCutHz('high', 2000, RATE)).toBeCloseTo(2000, 6)
    // At the open ends it stands an octave outside, or as high as the rate lets it.
    expect(colouredNoiseCutHz('low', 20, RATE)).toBeCloseTo(10, 6)
    expect(colouredNoiseCutHz('high', 20000, RATE)).toBeCloseTo(0.49 * RATE, 6)
    expect(colouredNoiseCutHz('high', 20000, 96000)).toBeCloseTo(40000, 6)
    // Half an octave in the two meet, and between it runs ahead evenly in octaves.
    expect(colouredNoiseCutHz('low', 20 * Math.SQRT2, RATE)).toBeCloseTo(20 * Math.SQRT2, 6)
    expect(colouredNoiseCutHz('low', 20 * Math.pow(2, 0.25), RATE)).toBeCloseTo(
      10 * Math.pow(2, 0.75),
      6,
    )
    // Open, they take nothing the display could show.
    for (const hz of [30, 100, 1000, 10000]) {
      const left = colouredNoiseCut('low', 20, hz, RATE) * colouredNoiseCut('high', 20000, hz, RATE)
      expect(Math.abs(20 * Math.log10(left)), `${hz} Hz`).toBeLessThan(0.05)
    }
  })
})

describe('the keys, the sides and the swells of the Coloured Noise display against the device', () => {
  /** What Tint does to the bed at `hz`, in dB: the same keys and the same noise with Tint and without. */
  const tintAt = (tinted: Float64Array, plain: Float64Array, hz: number): number => {
    const bin = Math.round(hz / BIN_HZ)
    return toDb(tinted[bin] / plain[bin])
  }

  const KEYS: [string, number, readonly (readonly [number, number?])[]][] = [
    ['one key at full Tint', 1, [[440]]],
    ['one key at half Tint', 0.5, [[440]]],
    ['two keys of unlike gain', 1, [[300], [900, 0.5]]],
    ['two keys at one pitch and one apart', 1, [[500], [500, 0.7], [1500]]],
    ['a low fifth', 0.8, [[73.42], [110, 0.7]]],
  ]

  it.each(KEYS)('adds the bands the device adds: %s', async (_what, tint, keys) => {
    const plain = powerOf((await held({ colour: 0.5 }, 12, keys)).left)
    const tinted = powerOf((await held({ colour: 0.5, tint }, 12, keys)).left)
    const levels: ColouredNoiseKey[] = keys.map(([hz, gain]) => ({ hz, level: gain ?? 1 }))
    const bands = colouredNoiseBands(levels, tint)
    const drawn = (hz: number): number => 20 * Math.log10(colouredNoiseTint(bands, hz, RATE))
    // Across the whole bed, a sixth of an octave apart, and on each key and beside it.
    const places: number[] = []
    for (let hz = 40; hz < 16000; hz *= Math.pow(2, 1 / 6)) places.push(hz)
    for (const band of bands)
      for (const ratio of [0.96, 0.98, 1, 1.02, 1.04]) places.push(band.hz * ratio)
    for (const hz of places) {
      const at = Math.round(hz / BIN_HZ) * BIN_HZ
      // Low keys have bands a few bins wide: the transform blurs their peaks a little.
      expect(Math.abs(tintAt(tinted, plain, at) - drawn(at)), `${at.toFixed(0)} Hz`).toBeLessThan(
        at < 200 ? 1.5 : 0.6,
      )
    }
    // And the test is of something: a peak stands at each band.
    for (const band of bands) expect(drawn(band.hz)).toBeGreaterThan(5)
  })

  it("shares one key's lift between the keys, by the squares of their levels", () => {
    // One key: its band is added 4.6 times over at Tint 1, a peak 5.6 times the bed, 15 dB.
    expect(colouredNoisePeak(1)).toBeCloseTo(5.6, 9)
    expect(colouredNoisePeak(0)).toBe(1)
    const one = colouredNoiseBands([{ hz: 440, level: 0.8 }], 1)
    expect(one).toHaveLength(1)
    expect(one[0].lift).toBeCloseTo(4.6, 9)
    expect(colouredNoiseTint(one, 440, RATE)).toBeCloseTo(5.6, 6)
    // Ten keys at one pitch are one key; two apart share the power one key adds.
    const ten = colouredNoiseBands(
      Array.from({ length: 10 }, () => ({ hz: 440, level: 0.5 })),
      1,
    )
    expect(ten).toHaveLength(1)
    expect(ten[0].lift).toBeCloseTo(4.6, 9)
    const two = colouredNoiseBands(
      [
        { hz: 300, level: 1 },
        { hz: 900, level: 1 },
      ],
      1,
    )
    const added = two.map((band) => (1 + band.lift) ** 2 - 1)
    expect(added[0] + added[1]).toBeCloseTo(5.6 ** 2 - 1, 9)
    // No Tint, or no key: no band, and the bed is the bed.
    expect(colouredNoiseBands([{ hz: 440, level: 1 }], 0)).toEqual([])
    expect(colouredNoiseBands([], 1)).toEqual([])
    expect(colouredNoiseTint([], 440, RATE)).toBe(1)
  })

  it('opens one bed however many keys are held, as loud as the loudest', async () => {
    const one = (await held({}, 1, [[261.63]])).left
    const three = (await held({}, 1, [[261.63], [392, 0.6], [523.25, 0.3]])).left
    expect(Array.from(three.subarray(24000, 28000))).toEqual(Array.from(one.subarray(24000, 28000)))
    // A key at half gain opens it half as far.
    const soft = (await held({}, 1, [[261.63, 0.5]])).left
    expect(rmsOver(soft, 24000, 48000) / rmsOver(one, 24000, 48000)).toBeCloseTo(0.5, 3)
  })

  it('puts the sides as far apart as the device does: side over mid is Width', async () => {
    for (const width of [0, 0.3, 0.6, 0.8, 1]) {
      const { left, right } = await held({ width }, 8)
      const mid = new Float32Array(left.length)
      const side = new Float32Array(left.length)
      for (let n = 0; n < left.length; n++) {
        mid[n] = 0.5 * (left[n] + right[n])
        side[n] = 0.5 * (left[n] - right[n])
      }
      const measured = rmsOver(side, RATE / 2, side.length) / rmsOver(mid, RATE / 2, mid.length)
      expect(Math.abs(measured - colouredNoiseSideOverMid(width)), `Width ${width}`).toBeLessThan(
        0.03,
      )
    }
    expect(colouredNoiseSideOverMid(0.8)).toBe(0.8)
  })

  /** The level in stretches of 4096 samples against the same noise without the drift. */
  const sunkLevels = (drifting: Float32Array, steady: Float32Array): number[] => {
    const levels: number[] = []
    for (let from = 0; from + 4096 <= drifting.length; from += 4096)
      levels.push(rmsOver(drifting, from, from + 4096) / rmsOver(steady, from, from + 4096))
    return levels
  }

  const DRIFTS: [string, Values][] = [
    ['full, at the quickest', { drift: 1, driftTime: 2 }],
    ['half, at the quickest', { drift: 0.5, driftTime: 2 }],
    ['full, three and a half seconds', { drift: 1, driftTime: 3.5 }],
  ]

  it.each(DRIFTS)(
    'sinks the level as the device does, swell by swell: %s',
    async (_what, values) => {
      // Brown noise under 500 Hz, which the darkening leaves alone: the level is all that moves.
      const low = { colour: 1, highCut: 500, attack: 0.05 }
      const seconds = 14
      const steady = (await held({ ...low, drift: 0 }, seconds)).left
      const drifting = (await held({ ...low, ...values }, seconds)).left
      const drift = valueOf(values, 'drift')
      const driftTime = valueOf(values, 'driftTime')
      const levels = sunkLevels(drifting, steady)
      let lowest = 1
      // From the second stretch on: in the first the key is still rising in both.
      for (let n = 1; n < levels.length; n++) {
        const middle = ((n + 0.5) * 4096) / RATE
        const sunk = drift * colouredNoiseTrain(middle / driftTime).sunk
        const drawn = colouredNoiseDriftLevel(sunk) * colouredNoiseDriftTone(sunk, 60, RATE)
        expect(Math.abs(levels[n] - drawn), `at ${middle.toFixed(2)} s`).toBeLessThan(0.025)
        lowest = Math.min(lowest, levels[n])
      }
      // Several swells went by, and the deepest of them took what the display says.
      expect(colouredNoiseTrain(seconds / driftTime).index).toBeGreaterThanOrEqual(3)
      expect(lowest).toBeLessThan(1 - 0.5 * drift * 0.65)
    },
  )

  it('darkens the top as the device does at the bottom of a swell', async () => {
    // White noise over 2 kHz, far over the corner of the darkening.
    const high = { colour: 0, lowCut: 2000, attack: 0.05 }
    const steady = (await held({ ...high, drift: 0 }, 10)).left
    const drifting = (await held({ ...high, drift: 1, driftTime: 2 }, 10)).left
    const levels = sunkLevels(drifting, steady)
    // What the display's arithmetic leaves of that band: the level, and the tone over the band's own power.
    const bed = bedOf(high)
    const left = (sunk: number): number => {
      let power = 0
      let whole = 0
      for (let hz = 1000; hz < 23000; hz += 250) {
        const here = Math.pow(10, colouredNoiseDb(bed, [], hz, RATE) / 10)
        power += here * colouredNoiseDriftTone(sunk, hz, RATE) ** 2
        whole += here
      }
      return colouredNoiseDriftLevel(sunk) * Math.sqrt(power / whole)
    }
    let lowest = 1
    for (let n = 1; n < levels.length; n++) {
      const middle = ((n + 0.5) * 4096) / RATE
      const sunk = colouredNoiseTrain(middle / 2).sunk
      expect(Math.abs(levels[n] - left(sunk)), `at ${middle.toFixed(2)} s`).toBeLessThan(0.025)
      lowest = Math.min(lowest, levels[n])
    }
    // Further down than the level alone goes: 0.35 of it, and half of that far over the corner.
    expect(lowest).toBeLessThan(0.3)
    expect(colouredNoiseDriftLevel(1)).toBeCloseTo(0.35, 9)
    expect(colouredNoiseDriftTone(1, 20000, RATE)).toBeGreaterThan(0.49)
    expect(colouredNoiseDriftTone(1, 20000, RATE)).toBeLessThan(0.54)
    expect(colouredNoiseDriftTone(1, 40, RATE)).toBeGreaterThan(0.99)
    expect(colouredNoiseDriftTone(0, 5000, RATE)).toBeCloseTo(1, 9)
  })

  it('goes on from where the swell is when Drift time moves, at the new pace', async () => {
    const low = { colour: 1, highCut: 500, attack: 0.05 }
    const steady = (await held({ ...low, drift: 0 }, 9)).left
    const device = await deviceAt({ ...STEADY, ...low, drift: 1, driftTime: 4 })
    strike(device, 261.63)
    const before = render(device, 3).left
    device.set(COLOURED_NOISE_PARAMS.driftTime, 2)
    const after = render(device, 6).left
    const drifting = new Float32Array(before.length + after.length)
    drifting.set(before)
    drifting.set(after, before.length)
    const levels = sunkLevels(drifting, steady)
    for (let n = 1; n < levels.length; n++) {
      const middle = ((n + 0.5) * 4096) / RATE
      // In Drift times: three seconds of four, then the rest in twos.
      const turns = middle < 3 ? middle / 4 : 3 / 4 + (middle - 3) / 2
      const drawn = colouredNoiseDriftLevel(colouredNoiseTrain(turns).sunk)
      expect(Math.abs(levels[n] - drawn), `at ${middle.toFixed(2)} s`).toBeLessThan(0.03)
    }
  })

  it('draws the swells from the draws the device makes', () => {
    // Every swell lasts a half to one and a half Drift times and goes 0.4 to all the way down.
    let longest = 0
    let shortest = 2
    for (let index = 0; index < 400; index++) {
      const swell = colouredNoiseSwell(index)
      expect(swell.length).toBeGreaterThanOrEqual(0.5)
      expect(swell.length).toBeLessThan(1.5)
      expect(swell.depth).toBeGreaterThanOrEqual(0.4)
      expect(swell.depth).toBeLessThan(1)
      longest = Math.max(longest, swell.length)
      shortest = Math.min(shortest, swell.length)
    }
    expect(longest).toBeGreaterThan(1.45)
    expect(shortest).toBeLessThan(0.55)
    // A swell begins and ends at the crest and is at its depth half way.
    const first = colouredNoiseSwell(0)
    expect(colouredNoiseTrain(0)).toEqual({ index: 0, phase: 0, sunk: 0 })
    expect(colouredNoiseTrain(first.length / 2).sunk).toBeCloseTo(first.depth, 9)
    const next = colouredNoiseTrain(first.length)
    expect(next.index).toBe(1)
    expect(next.sunk).toBeCloseTo(0, 9)
    expect(
      colouredNoiseTrain(first.length + colouredNoiseSwell(1).length * 0.25).phase,
    ).toBeCloseTo(0.25, 9)
    // The same train every time it is asked for.
    expect(colouredNoiseSwell(0)).toEqual(first)
  })

  it("draws a key's rise and fall as the device's envelope goes", async () => {
    const up = (await held({}, 2)).left
    // Half way through an Attack of half a second: the same noise, so far open.
    const slow = (await held({ attack: 0.5 }, 1)).left
    const at = 0.25 * RATE
    expect(rmsOver(slow, at - 200, at + 200) / rmsOver(up, at - 200, at + 200)).toBeCloseTo(
      colouredNoiseAttack(0.5),
      2,
    )
    expect(colouredNoiseAttack(0)).toBe(0)
    expect(colouredNoiseAttack(1)).toBe(1)
    // Half way through a Release of a second.
    const device = await deviceAt({ ...STEADY, release: 1 })
    strike(device, 261.63)
    render(device, 1)
    letGo(device)
    const fall = render(device, 1).left
    const half = 0.5 * RATE
    const still = up.subarray(RATE)
    expect(
      rmsOver(fall, half - 200, half + 200) / rmsOver(still, half - 200, half + 200),
    ).toBeCloseTo(colouredNoiseRelease(0.5), 3)
    expect(colouredNoiseRelease(0)).toBe(1)
    expect(colouredNoiseRelease(1)).toBeCloseTo(0.001, 6)
  })

  /** A key struck `wait` seconds after another was let go: whether the device began again with it. */
  const beginsAgain = async (
    values: Values,
    heldFor: number,
    wait: number,
  ): Promise<{ again: boolean; notes: DisplayNote[] }> => {
    const fresh = (await held({ ...values }, 0.2, [[330]])).left
    const device = await deviceAt({ ...STEADY, ...values })
    strike(device, 220, 1)
    render(device, heldFor)
    letGo(device, 1)
    render(device, wait)
    strike(device, 330, 2)
    const second = render(device, 0.2).left
    let same = true
    for (let n = 0; n < fresh.length && same; n++) same = second[n] === fresh[n]
    return {
      again: same,
      notes: [
        { id: 1, frequency: 220, gain: 1, age: heldFor + wait, released: wait },
        { id: 2, frequency: 330, gain: 1, age: 0, released: null },
      ],
    }
  }

  it('starts the swells again where the device does: at the first key after every voice has ended', async () => {
    // A key at the top of its envelope goes on for 100 dB of its Release: 0.5 s of a Release of 0.3.
    const quick = { attack: 0.05, release: 0.3, drift: 1 }
    for (const [wait, again] of [
      [0.47, false],
      [0.53, true],
    ] as const) {
      const found = await beginsAgain(quick, 0.5, wait)
      expect(found.again, `struck ${wait} s after`).toBe(again)
      const run = colouredNoiseRun(found.notes, quick.attack, quick.release)
      expect(run?.age, `struck ${wait} s after`).toBeCloseTo(again ? 0 : 0.5 + wait, 9)
      expect(run?.broke).toBe(again)
    }
    // A key let go a fifth of the way up its Attack has less far to fall.
    const slow = { attack: 1, release: 0.3, drift: 1 }
    const top = colouredNoiseAttack(0.2)
    const tail = (0.3 * Math.log(top / 1e-5)) / Math.log(1000)
    expect(tail).toBeLessThan(0.47)
    for (const [wait, again] of [
      [tail - 0.03, false],
      [tail + 0.03, true],
    ] as const) {
      const found = await beginsAgain(slow, 0.2, wait)
      expect(found.again, `struck ${wait.toFixed(3)} s after`).toBe(again)
      const run = colouredNoiseRun(found.notes, slow.attack, slow.release)
      expect(run?.age).toBeCloseTo(again ? 0 : 0.2 + wait, 9)
    }
  })

  it('gives each note the level the device gives its voice', async () => {
    const note = (age: number, released: number | null, gain = 1): DisplayNote => ({
      id: 1,
      frequency: 440,
      gain,
      age,
      released,
    })
    // Rising, at the top, and falling from where it was let go.
    expect(colouredNoiseKey(note(1, null, 0.5), 2, 4)?.level).toBeCloseTo(
      0.5 * colouredNoiseAttack(0.5),
      9,
    )
    expect(colouredNoiseKey(note(9, null), 2, 4)).toEqual({ hz: 440, level: 1 })
    expect(colouredNoiseKey(note(9, 2), 2, 4)?.level).toBeCloseTo(colouredNoiseRelease(0.5), 9)
    expect(colouredNoiseKey(note(3, 2), 2, 4)?.level).toBeCloseTo(
      colouredNoiseAttack(0.5) * colouredNoiseRelease(0.5),
      9,
    )
    // Gone when its envelope is 100 dB down: five thirds of the Release.
    expect(colouredNoiseKey(note(20, 6.6), 2, 4)).not.toBeNull()
    expect(colouredNoiseKey(note(20, 6.7), 2, 4)).toBeNull()
    // A key outside what the device takes is held to its ends.
    expect(colouredNoiseKey({ ...note(9, null), frequency: 15000 }, 2, 4)?.hz).toBe(12000)
    expect(colouredNoiseKey({ ...note(9, null), frequency: 10 }, 2, 4)?.hz).toBe(20)
    // The device does the same: a key of 15 kHz rings where one of 12 kHz does.
    const high = powerOf((await held({ tint: 1 }, 6, [[15000]])).left)
    const held12 = powerOf((await held({ tint: 1 }, 6, [[12000]])).left)
    for (const hz of [11000, 12000, 13000, 15000])
      expect(
        Math.abs(toDb(bandOf(high, hz - 50, hz + 50) / bandOf(held12, hz - 50, hz + 50))),
      ).toBe(0)
  })
})

// --- What is drawn ---------------------------------------------------------------

const INK_COLOUR = PLAIN_COLOURS.ink
const ACCENT_COLOUR = PLAIN_COLOURS.accent

const strokes = (drawn: RecordingContext): DrawnPath[] =>
  drawnPaths(drawn).filter((path) => path.kind === 'stroke')

/** The bed's curve: the first line drawn 1.5 wide in the ink. */
function curveOf(drawn: RecordingContext): DrawnPath {
  const lines = strokes(drawn).filter((path) => path.width === 1.5 && path.colour === INK_COLOUR)
  expect(lines.length).toBeGreaterThanOrEqual(1)
  return lines[0]
}

/** The drift's two lines: the level, 1.25 wide, and the level of the top behind it, if it is drawn. */
function driftOf(drawn: RecordingContext): { level: DrawnPath; top: DrawnPath | undefined } {
  const level = strokes(drawn).filter((path) => path.width === 1.25)
  expect(level).toHaveLength(1)
  const top = strokes(drawn).filter(
    (path) => path.width === 1 && path.alpha === INK.back && path.points.length > 2,
  )
  expect(top.length).toBeLessThanOrEqual(1)
  return { level: level[0], top: top[0] }
}

/** Every dot drawn: where it stands and how large it is. */
function dotsOf(drawn: RecordingContext): { x: number; y: number; r: number }[] {
  return drawn.calls
    .filter((call) => call.name === 'arc')
    .map((call) => ({
      x: call.args[0] as number,
      y: call.args[1] as number,
      r: call.args[2] as number,
    }))
}

/** The dot at the drift's place, and the dots on the keys' peaks. */
const placeOf = (drawn: RecordingContext) => dotsOf(drawn).filter((one) => one.r === 2.5)
const peaksOf = (drawn: RecordingContext) => dotsOf(drawn).filter((one) => one.r === 2)

/** How wide the lit part of the level's bar is; 0 when none is lit. */
function litLevel(drawn: RecordingContext): number {
  let fill = ''
  let wide = 0
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'fillRect' && fill === ACCENT_COLOUR) wide = call.args[2] as number
  }
  return wide
}

/** The lines drawn in the accent: a key that is held, and one that is falling. */
const litLines = (drawn: RecordingContext): DrawnPath[] =>
  strokes(drawn).filter((path) => path.colour === ACCENT_COLOUR)

function levelOf(samples: Float32Array): DisplayLevel {
  let peak = 0
  let sum = 0
  for (const sample of samples) {
    peak = Math.max(peak, Math.abs(sample))
    sum += sample * sample
  }
  return { peak, rms: Math.sqrt(sum / samples.length), wave: samples }
}

const steady = (rms: number): DisplaySignal => {
  const level: DisplayLevel = { peak: rms * Math.SQRT2, rms, wave: new Float32Array(2048) }
  return {
    input: null,
    output: level,
    spectrum: null,
    binHz: RATE / 2048,
    left: level,
    right: level,
  }
}

const FPS = 30

/** A display run as the plate runs it, frame after frame on one state: every frame's drawing. */
function framesOf(
  shown: PlateDisplay,
  seconds: number,
  options: FrameOptions = {},
  each?: (time: number) => Partial<FrameOptions>,
): RecordingContext[] {
  const state: unknown = shown.init?.()
  const frames: RecordingContext[] = []
  for (let n = 0; n < Math.round(seconds * FPS); n++) {
    const time = n / FPS
    frames.push(
      drawDisplay(shown, COLOURED_NOISE_PARAMS, {
        ...options,
        ...each?.(time),
        state,
        now: 10 + time,
        dt: n === 0 ? 0 : 1 / FPS,
      }),
    )
  }
  return frames
}

/** Keys struck `age` seconds ago and still held, `since` seconds later. */
const heldNotes = (age: number, since = 0): DisplayNote[] => [
  { id: 60, frequency: 261.63, gain: 0.8, age: age + since, released: null },
  { id: 67, frequency: 392, gain: 0.8, age: age + since, released: null },
]

describe('the Coloured Noise display', () => {
  it('is laid out from the size it is given', () => {
    for (const [width, height] of [
      [128, 100],
      [204, 100],
      [293, 100],
    ]) {
      const lay = colouredNoiseLayout({ width, height })
      // Each part under the one before it, and all of it on the display.
      expect(lay.curve.y).toBeGreaterThan(lay.words)
      expect(lay.curve.x).toBeGreaterThanOrEqual(4)
      expect(lay.curve.x + lay.curve.w).toBeLessThanOrEqual(width - 4)
      expect(lay.drift.y).toBeGreaterThanOrEqual(lay.curve.y + lay.curve.h + 3)
      expect(lay.drift.x + lay.drift.w).toBeLessThanOrEqual(width - 24)
      expect(lay.envelope.y).toBeGreaterThanOrEqual(lay.drift.y + lay.drift.h + 3)
      expect(lay.sides.x).toBeGreaterThan(lay.envelope.x + lay.envelope.w)
      expect(lay.sides.x + lay.sides.w).toBeLessThanOrEqual(width - 4)
      expect(lay.sides.w).toBeGreaterThanOrEqual(30)
      expect(lay.foot.y).toBeGreaterThanOrEqual(lay.envelope.y + lay.envelope.h + 2)
      expect(lay.foot.y + lay.foot.h).toBeLessThanOrEqual(height - 3)
    }
  })

  it('draws the bed over frequency as the device colours and cuts it', () => {
    const settings: Values[] = [
      {},
      { colour: 0 },
      { colour: 1 },
      { colour: 0.5, lowCut: 300, highCut: 2500 },
      { colour: 1, highCut: 700 },
      { colour: 0, lowCut: 2000 },
    ]
    for (const values of settings) {
      for (const width of [128, 204]) {
        const lay = colouredNoiseLayout({ width, height: 100 })
        const curve = curveOf(drawDisplay(display, COLOURED_NOISE_PARAMS, { values, width }))
        const bed = bedOf(values)
        // Every point is the bed at its pitch, from 20 Hz at one end to 20 kHz at the other.
        for (const [x, y] of curve.points)
          expect(y).toBeCloseTo(
            colouredNoiseCurveY(colouredNoiseDb(bed, [], hzOfX(x, lay.curve), RATE), lay.curve),
            6,
          )
        expect(curve.points[0][0]).toBeCloseTo(lay.curve.x, 6)
        expect(curve.points[curve.points.length - 1][0]).toBeCloseTo(lay.curve.x + lay.curve.w, 6)
        expect(curve.points.length).toBeGreaterThan(lay.curve.w / 2)
        for (const [, y] of curve.points) {
          expect(y).toBeGreaterThanOrEqual(lay.curve.y)
          expect(y).toBeLessThanOrEqual(lay.curve.y + lay.curve.h)
        }
      }
    }
    // White lies level on the line of 0 dB; brown stands over it in the bass and under it in the treble.
    const lay = colouredNoiseLayout({ width: 128, height: 100 })
    const zero = colouredNoiseCurveY(0, lay.curve)
    expect(zero).toBeCloseTo(lay.curve.y + lay.curve.h / 2, 6)
    expect(COLOURED_NOISE_TOP_DB).toBe(-COLOURED_NOISE_FOOT_DB)
    const yAt = (values: Values, hz: number): number => {
      const { points } = curveOf(drawDisplay(display, COLOURED_NOISE_PARAMS, { values }))
      const x = xOfHz(hz, lay.curve)
      return points.reduce((best, point) =>
        Math.abs(point[0] - x) < Math.abs(best[0] - x) ? point : best,
      )[1]
    }
    expect(Math.abs(yAt({ colour: 0 }, 1000) - zero)).toBeLessThan(0.2)
    expect(yAt({ colour: 1 }, 50)).toBeLessThan(zero - 8)
    expect(yAt({ colour: 1 }, 8000)).toBeGreaterThan(zero + 8)
    // A cut takes the curve to the foot.
    expect(yAt({ colour: 0.5, highCut: 700 }, 8000)).toBeCloseTo(lay.curve.y + lay.curve.h, 6)
    expect(yAt({ colour: 0.5, lowCut: 2000 }, 100)).toBeCloseTo(lay.curve.y + lay.curve.h, 6)
  })

  it('stands a peak at each sounding key when Tint is up, and lights the held ones', () => {
    const lay = colouredNoiseLayout({ width: 128, height: 100 })
    const notes = heldNotes(9)
    // No Tint: the keys only open the bed, and the curve is the bed.
    const plain = drawDisplay(display, COLOURED_NOISE_PARAMS, { notes })
    expect(curveOf(plain).points).toEqual(
      curveOf(drawDisplay(display, COLOURED_NOISE_PARAMS)).points,
    )
    expect(peaksOf(plain)).toHaveLength(0)
    // Tint up: a peak at each key, as high as the device makes it for two keys of one gain.
    const values = { tint: 1 }
    const tinted = drawDisplay(display, COLOURED_NOISE_PARAMS, { values, notes })
    const bands = colouredNoiseBands(
      notes.map((note) => ({ hz: note.frequency, level: note.gain })),
      1,
    )
    const bed = bedOf(values)
    const curve = curveOf(tinted)
    for (const [x, y] of curve.points)
      expect(y).toBeCloseTo(
        colouredNoiseCurveY(colouredNoiseDb(bed, bands, hzOfX(x, lay.curve), RATE), lay.curve),
        6,
      )
    const peaks = peaksOf(tinted)
    expect(peaks).toHaveLength(2)
    notes.forEach((note, n) => {
      const x = xOfHz(note.frequency, lay.curve)
      const top = colouredNoiseCurveY(colouredNoiseDb(bed, bands, note.frequency, RATE), lay.curve)
      expect(peaks[n].x).toBeCloseTo(x, 6)
      expect(peaks[n].y).toBeCloseTo(top, 6)
      // The key itself is a point of the curve, so a peak a pixel wide is drawn as high as it stands.
      expect(curve.points.some((point) => Math.abs(point[0] - x) < 1e-6)).toBe(true)
      // It stands well over the bed beside it: 11.6 dB for two keys, 4 dB a pixel.
      const beside = colouredNoiseCurveY(colouredNoiseDb(bed, [], note.frequency, RATE), lay.curve)
      expect(beside - top).toBeGreaterThan(4)
    })
    // A key that was let go keeps its peak while it falls, unlit; switched off, no key is drawn.
    const falling: DisplayNote[] = [{ ...notes[0], released: 1 }]
    const after = drawDisplay(display, COLOURED_NOISE_PARAMS, { values, notes: falling })
    expect(peaksOf(after)).toHaveLength(0)
    expect(curveOf(after).points).not.toEqual(curveOf(plain).points)
    const off = drawDisplay(display, COLOURED_NOISE_PARAMS, { values, notes, powered: false })
    expect(peaksOf(off)).toHaveLength(0)
    expect(curveOf(off).points).toEqual(
      curveOf(drawDisplay(display, COLOURED_NOISE_PARAMS, { values })).points,
    )
  })

  it('writes the slope, the peak of a key and the time across the drift', () => {
    expect(colouredNoiseSlopeText(0)).toBe('0.0 dB/oct')
    expect(colouredNoiseSlopeText(0.5)).toBe('−3.0 dB/oct')
    expect(colouredNoiseSlopeText(1)).toBe('−6.0 dB/oct')
    expect(colouredNoisePeakText(1)).toBe('key +15 dB')
    expect(colouredNoisePeakText(0.5)).toBe('key +10 dB')
    expect(colouredNoiseTimeText(8)).toBe('8.0 s')
    expect(colouredNoiseTimeText(36)).toBe('36 s')
    expect(colouredNoiseTimeText(120)).toBe('120 s')
    expect(drawDisplay(display, COLOURED_NOISE_PARAMS).words()).toEqual([
      '−3.0 dB/oct',
      '36 s',
      'L',
      'R',
    ])
    const words = drawDisplay(display, COLOURED_NOISE_PARAMS, {
      values: { colour: 1, tint: 1, driftTime: 2 },
    }).words()
    expect(words).toEqual(['−6.0 dB/oct', 'key +15 dB', '8.0 s', 'L', 'R'])
  })

  it('draws the swells of the drift over four Drift times, the level and the level of the top', () => {
    for (const values of [
      {},
      { drift: 1, driftTime: 2 },
      { drift: 0.6, driftTime: 30 },
    ] as Values[]) {
      for (const width of [128, 204]) {
        const lay = colouredNoiseLayout({ width, height: 100 })
        const box = lay.drift
        const drift = valueOf(values, 'drift')
        const { level, top } = driftOf(
          drawDisplay(display, COLOURED_NOISE_PARAMS, { values, width }),
        )
        const turnsOf = (x: number): number => ((x - box.x) / box.w) * COLOURED_NOISE_SPAN
        // Every point of both lines is the train at its time, from the key from silence on.
        for (const [x, y] of level.points) {
          const sunk = drift * colouredNoiseTrain(turnsOf(x)).sunk
          expect(y).toBeCloseTo(colouredNoiseDriftY(colouredNoiseDriftLevel(sunk), box), 5)
        }
        expect(top).toBeDefined()
        for (const [x, y] of top?.points ?? []) {
          const sunk = drift * colouredNoiseTrain(turnsOf(x)).sunk
          const left =
            colouredNoiseDriftLevel(sunk) *
            colouredNoiseDriftTone(sunk, COLOURED_NOISE_TOP_HZ, RATE)
          expect(y).toBeCloseTo(colouredNoiseDriftY(left, box), 5)
        }
        for (const line of [level, top]) {
          expect(line?.colour).toBe(INK_COLOUR)
          expect(line?.points[0][0]).toBeCloseTo(box.x, 6)
          expect(line?.points[line.points.length - 1][0]).toBeCloseTo(box.x + box.w, 6)
        }
        // The crest between two swells is a point of the line, and it is at the top there.
        const crest = box.x + (colouredNoiseSwell(0).length / COLOURED_NOISE_SPAN) * box.w
        const at = level.points.find((point) => Math.abs(point[0] - crest) < 1e-6)
        expect(at?.[1]).toBeCloseTo(box.y + 1, 6)
        // The top sinks further than the level wherever the bed is sunk at all.
        const deepest = Math.max(...level.points.map((point) => point[1]))
        expect(Math.max(...(top?.points ?? []).map((point) => point[1]))).toBeGreaterThan(deepest)
      }
    }
    // The scale: a full swell's 9 dB of level and 15 dB of top both stand inside the box.
    const box = colouredNoiseLayout({ width: 128, height: 100 }).drift
    expect(colouredNoiseDriftY(1, box)).toBe(box.y + 1)
    expect(colouredNoiseDriftY(0.35, box)).toBeCloseTo(
      box.y + 1 + ((20 * Math.log10(0.35)) / COLOURED_NOISE_DRIFT_FOOT_DB) * (box.h - 2),
      9,
    )
    expect(colouredNoiseDriftY(0.35 * 0.5, box)).toBeLessThan(box.y + box.h - 1)
    // No Drift: one level line at the top, and no second line.
    const still = driftOf(drawDisplay(display, COLOURED_NOISE_PARAMS, { values: { drift: 0 } }))
    expect(still.top).toBeUndefined()
    for (const [, y] of still.level.points) expect(y).toBe(box.y + 1)
    // The points a page is drawn from: its ends, and every crest inside it.
    const points = colouredNoiseDriftPoints(4, 1, 90)
    expect(points[0][0]).toBe(4)
    expect(points[points.length - 1][0]).toBe(8)
    for (let n = 1; n < points.length; n++)
      expect(points[n][0]).toBeGreaterThanOrEqual(points[n - 1][0])
    expect(points.filter(([, sunk]) => sunk === 0).length).toBeGreaterThanOrEqual(2)
  })

  it('stands a dot where the device is in its swells, from the key that began them', () => {
    const lay = colouredNoiseLayout({ width: 128, height: 100 })
    const box = lay.drift
    const values = { drift: 1, driftTime: 2 }
    const xOf = (turns: number): number =>
      box.x + ((turns % COLOURED_NOISE_SPAN) / COLOURED_NOISE_SPAN) * box.w
    const yOf = (turns: number): number =>
      colouredNoiseDriftY(colouredNoiseDriftLevel(colouredNoiseTrain(turns).sunk), box)
    // No key, switched off, or no Drift: no dot.
    expect(placeOf(drawDisplay(display, COLOURED_NOISE_PARAMS, { values }))).toHaveLength(0)
    expect(
      placeOf(
        drawDisplay(display, COLOURED_NOISE_PARAMS, {
          values,
          notes: heldNotes(3),
          powered: false,
        }),
      ),
    ).toHaveLength(0)
    expect(
      placeOf(
        drawDisplay(display, COLOURED_NOISE_PARAMS, { values: { drift: 0 }, notes: heldNotes(3) }),
      ),
    ).toHaveLength(0)
    // A key held for three seconds at a Drift time of two: one and a half Drift times in.
    const [dot] = placeOf(
      drawDisplay(display, COLOURED_NOISE_PARAMS, { values, notes: heldNotes(3) }),
    )
    expect(dot.x).toBeCloseTo(xOf(1.5), 6)
    expect(dot.y).toBeCloseTo(yOf(1.5), 6)
    // Past four Drift times the next four are drawn, and the dot is on them.
    const later = drawDisplay(display, COLOURED_NOISE_PARAMS, { values, notes: heldNotes(10.6) })
    expect(placeOf(later)[0].x).toBeCloseTo(xOf(5.3), 6)
    expect(placeOf(later)[0].y).toBeCloseTo(yOf(5.3), 6)
    const page = driftOf(later).level
    expect(page.points[0][1]).toBeCloseTo(yOf(4), 6)
    expect(page.points[page.points.length - 1][1]).toBeCloseTo(yOf(8 - 1e-9), 4)
    // It goes on while the keys are held, frame by frame, and never turns back inside a page.
    const frames = framesOf(display, 2, { values }, (time) => ({ notes: heldNotes(3, time) }))
    const places = frames.map((drawn) => placeOf(drawn)[0].x)
    for (let n = 1; n < places.length; n++) expect(places[n]).toBeGreaterThan(places[n - 1])
    expect(places[59]).toBeCloseTo(xOf(1.5 + 59 / FPS / 2), 5)
    // The fall of a key keeps it going until the voice has ended, a Release and two thirds on.
    const falling = (released: number): DisplayNote[] => [
      { id: 60, frequency: 261.63, gain: 0.8, age: 5 + released, released },
    ]
    const release = COLOURED_NOISE_PARAMS.release.default
    expect(
      placeOf(
        drawDisplay(display, COLOURED_NOISE_PARAMS, { values, notes: falling(1.6 * release) }),
      ),
    ).toHaveLength(1)
    expect(
      placeOf(
        drawDisplay(display, COLOURED_NOISE_PARAMS, { values, notes: falling(1.7 * release) }),
      ),
    ).toHaveLength(0)
  })

  it('follows the device through a moved Drift time, a new start and a note that drops off the list', () => {
    const lay = colouredNoiseLayout({ width: 128, height: 100 })
    const box = lay.drift
    const xOf = (turns: number): number =>
      box.x + ((turns % COLOURED_NOISE_SPAN) / COLOURED_NOISE_SPAN) * box.w
    // Drift time moved from four seconds to two after a second: on from where it was, twice as fast.
    const moved = framesOf(display, 2, {}, (time) => ({
      values: { drift: 1, driftTime: time < 1 ? 4 : 2 },
      notes: heldNotes(2, time),
    }))
    expect(placeOf(moved[29])[0].x).toBeCloseTo(xOf((2 + 29 / FPS) / 4), 5)
    expect(placeOf(moved[59])[0].x).toBeCloseTo(xOf((2 + 29 / FPS) / 4 + 30 / FPS / 2), 5)
    // The keys are let go, the voices end, and a new key starts the swells again at the crest.
    const values = { drift: 1, driftTime: 2, release: 0.3 }
    const again = framesOf(display, 3, { values }, (time): Partial<FrameOptions> => {
      const first: DisplayNote = {
        id: 60,
        frequency: 261.63,
        gain: 0.8,
        age: 3 + time,
        released: time < 0.5 ? null : time - 0.5,
      }
      // The first voice ends half a second after it is let go; the second key comes at two seconds.
      return {
        notes:
          time < 2
            ? [first]
            : [first, { id: 64, frequency: 329.63, gain: 0.8, age: time - 2, released: null }],
      }
    })
    expect(placeOf(again[20])).toHaveLength(1)
    expect(placeOf(again[40])).toHaveLength(0)
    expect(placeOf(again[75])[0].x).toBeCloseTo(xOf((75 / FPS - 2) / 2), 5)
    // A second key that joins while the first still sounds starts nothing.
    const joined = framesOf(display, 2, { values: { drift: 1, driftTime: 2 } }, (time) => ({
      notes: [
        ...heldNotes(3, time),
        ...(time < 1
          ? []
          : [{ id: 72, frequency: 523.25, gain: 0.8, age: time - 1, released: null }]),
      ],
    }))
    expect(placeOf(joined[59])[0].x).toBeCloseTo(xOf(1.5 + 59 / FPS / 2), 5)
    // The first note drops off the list (let go a minute ago) while another holds the bed up: it goes on.
    const dropped = framesOf(display, 2, { values: { drift: 1, driftTime: 2 } }, (time) => {
      const second: DisplayNote = {
        id: 64,
        frequency: 329.63,
        gain: 0.8,
        age: 59 + time,
        released: null,
      }
      const first: DisplayNote = {
        id: 60,
        frequency: 261.63,
        gain: 0.8,
        age: 61 + time,
        released: 59.5 + time,
      }
      return { notes: time < 1 ? [first, second] : [second] }
    })
    expect(placeOf(dropped[29])[0].x).toBeCloseTo(xOf((61 + 29 / FPS) / 2), 4)
    expect(placeOf(dropped[59])[0].x).toBeCloseTo(xOf((61 + 59 / FPS) / 2), 4)
  })

  it('lights the rise of a key for as long as one is held, and its fall for as long as it takes', () => {
    const lay = colouredNoiseLayout({ width: 128, height: 100 })
    expect(litLines(drawDisplay(display, COLOURED_NOISE_PARAMS))).toHaveLength(0)
    // Held: the rise, lit on every frame whatever the sound does.
    const frames = framesOf(display, 2, { values: { drift: 0 } }, (time) => ({
      notes: heldNotes(9, time),
      signal: steady(time % 0.2 < 0.1 ? 0.2 : 0.01),
    }))
    const first = litLines(frames[0])
    expect(first).toHaveLength(1)
    expect(first[0].points[0][0]).toBeCloseTo(lay.envelope.x, 6)
    for (const drawn of frames) expect(litLines(drawn)).toEqual(first)
    // Let go: the fall, until the Release is over (4 s at the defaults).
    const letGoFor = (released: number): readonly DisplayNote[] => [
      { id: 60, frequency: 261.63, gain: 0.8, age: 3 + released, released },
    ]
    const falling = litLines(drawDisplay(display, COLOURED_NOISE_PARAMS, { notes: letGoFor(0.4) }))
    expect(falling).toHaveLength(1)
    expect(falling[0].points[falling[0].points.length - 1][0]).toBeCloseTo(
      lay.envelope.x + lay.envelope.w,
      6,
    )
    expect(
      litLines(drawDisplay(display, COLOURED_NOISE_PARAMS, { notes: letGoFor(4.1) })),
    ).toHaveLength(0)
    expect(
      litLines(
        drawDisplay(display, COLOURED_NOISE_PARAMS, { notes: heldNotes(3), powered: false }),
      ),
    ).toHaveLength(0)
    // The rise and the fall drawn are the device's: half way up, and 60 dB down at the end.
    const whole = strokes(drawDisplay(display, COLOURED_NOISE_PARAMS)).filter(
      (path) => path.width === 1 && path.points.length === 26,
    )
    expect(whole).toHaveLength(1)
    const foot = lay.envelope.y + lay.envelope.h - 0.5
    const top = lay.envelope.y + 1.5
    expect(whole[0].points[6][1]).toBeCloseTo(foot - colouredNoiseAttack(0.5) * (foot - top), 6)
    expect(whole[0].points[12][1]).toBeCloseTo(top, 6)
    expect(whole[0].points[19][1]).toBeCloseTo(foot - colouredNoiseRelease(0.5) * (foot - top), 6)
    expect(foot - whole[0].points[25][1]).toBeCloseTo(0.001 * (foot - top), 6)
    // A longer Attack is a wider rise.
    const riseOf = (attack: number): number => {
      const rise = strokes(
        drawDisplay(display, COLOURED_NOISE_PARAMS, { values: { attack } }),
      ).find((path) => path.width === 1 && path.points.length === 26)
      return rise ? rise.points[12][0] : Number.NaN
    }
    expect(riseOf(10)).toBeGreaterThan(riseOf(0.01) + 10)
  })

  it('draws the sides as far apart as Width puts them', () => {
    const lay = colouredNoiseLayout({ width: 128, height: 100 })
    const middle = lay.sides.x + lay.sides.w / 2
    const half = lay.sides.w / 2 - 9
    const barOf = (width: number): DrawnPath[] =>
      strokes(drawDisplay(display, COLOURED_NOISE_PARAMS, { values: { width } })).filter(
        (path) => path.width === 2,
      )
    // Nothing at 0, where both sides are the same noise; from end to end at 1.
    expect(barOf(0)).toHaveLength(0)
    for (const width of [0.3, 0.6, 1]) {
      const [bar] = barOf(width)
      expect(bar.points[0][0]).toBeCloseTo(middle - colouredNoiseSideOverMid(width) * half, 6)
      expect(bar.points[1][0]).toBeCloseTo(middle + colouredNoiseSideOverMid(width) * half, 6)
      expect(bar.points[0][1]).toBe(bar.points[1][1])
    }
    expect(barOf(1)[0].points[1][0] - barOf(1)[0].points[0][0]).toBeCloseTo(2 * half, 6)
  })

  it('shows the level over the last second, and holds it still under a small change', () => {
    const lay = colouredNoiseLayout({ width: 128, height: 100 })
    const shareOf = (meanSquare: number): number =>
      Math.min(1, Math.max(0, 1 + (10 * Math.log10(meanSquare)) / 60))
    // A steady sound of -20 dBFS: the bar comes up over a second and never falls on the way.
    const rising = framesOf(display, 2, { signal: steady(0.1) }).map(litLevel)
    expect(rising[0]).toBe(0)
    for (let n = 1; n < rising.length; n++) expect(rising[n]).toBeGreaterThanOrEqual(rising[n - 1])
    // Half a second in, half of the second is still silence: 3 dB less.
    expect(Math.abs(rising[15] / lay.foot.w - shareOf(0.005))).toBeLessThanOrEqual(0.021)
    for (const n of [30, 45, 59])
      expect(Math.abs(rising[n] / lay.foot.w - shareOf(0.01))).toBeLessThanOrEqual(0.021)
    expect(new Set(rising.slice(31)).size).toBe(1)
    // The sound stops: it goes down, and is gone when the second is over.
    const falling = framesOf(display, 3, {}, (time) => ({
      signal: steady(time <= 1.5 ? 0.1 : 0),
    })).map(litLevel)
    for (let n = 47; n < falling.length; n++) expect(falling[n]).toBeLessThanOrEqual(falling[n - 1])
    expect(falling[60]).toBeGreaterThan(0)
    expect(falling[60]).toBeLessThan(falling[45])
    expect(falling[77]).toBe(0)
    // A level that goes up and down by half a decibel from frame to frame does not move the bar.
    let frame = 0
    const wobbling = framesOf(display, 3, {}, () => ({
      signal: steady(frame++ % 2 === 0 ? 0.1 : 0.106),
    })).map(litLevel)
    expect(new Set(wobbling.slice(32)).size).toBe(1)
    // Loud is a full bar, and one frame is the same as the run that ends on it.
    expect(COLOURED_NOISE_LEVEL_SEC).toBe(1)
    const full = runDisplay(display, COLOURED_NOISE_PARAMS, 1.5, { signal: steady(1) })
    expect(litLevel(full)).toBeCloseTo(lay.foot.w, 6)
    // Switched off, or with no sound to read, nothing is lit.
    expect(
      litLevel(
        runDisplay(display, COLOURED_NOISE_PARAMS, 1.5, { signal: steady(0.5), powered: false }),
      ),
    ).toBe(0)
    expect(litLevel(runDisplay(display, COLOURED_NOISE_PARAMS, 1.5, {}))).toBe(0)
  })
})

// --- R10: nothing flashes ----------------------------------------------------------

/**
 * How much a run of frames flickers: the most times, in any one second, that
 * one thing drawn turns back on itself. Every number handed to the canvas is
 * followed from frame to frame (a place, a size, a strength of ink), and it
 * turns back when it goes down after going up or up after going down. A word
 * or a colour that changes counts once each time, and so does a frame that
 * draws other things than the one before it.
 */
function flicker(frames: readonly RecordingContext[]): { most: number; what: string } {
  const turns = new Map<string, number[]>()
  const note = (what: string, frame: number): void => {
    turns.set(what, [...(turns.get(what) ?? []), frame])
  }
  let shape = ''
  let before: (number | string)[] = []
  let going: number[] = []
  frames.forEach((drawn, frame) => {
    const names: string[] = []
    const values: (number | string)[] = []
    for (const call of drawn.calls) {
      for (const arg of call.args.flatMap((one) =>
        Array.isArray(one) ? (one as unknown[]) : [one],
      )) {
        if (typeof arg !== 'number' && typeof arg !== 'string') continue
        names.push(call.name)
        values.push(arg)
      }
    }
    const drawnShape = drawn.calls.map((call) => call.name).join(',')
    if (frame > 0 && drawnShape !== shape) {
      note('what is drawn at all', frame)
      going = []
    } else if (frame > 0) {
      values.forEach((value, slot) => {
        const last = before[slot]
        const what = `${names[slot]} (value ${slot})`
        if (typeof value === 'number' && typeof last === 'number') {
          const way = Math.abs(value - last) < 1e-6 ? 0 : Math.sign(value - last)
          if (way === 0) return
          if (going[slot] && going[slot] !== way) note(what, frame)
          going[slot] = way
        } else if (value !== last) note(what, frame)
      })
    }
    shape = drawnShape
    before = values
  })
  let most = 0
  let worst = 'nothing'
  for (const [what, at] of turns) {
    for (let i = 0; i < at.length; i++) {
      let count = 0
      for (let j = i; j < at.length && at[j] - at[i] < FPS; j++) count += 1
      if (count > most) [most, worst] = [count, what]
    }
  }
  return { most, what: worst }
}

/**
 * The sound as the plate's taps read it at `time`: the 2048 samples before
 * it, noise that is let through and shut off `rate` times a second, so the
 * level read on one frame is not the level read on the next.
 */
function pulsedSignal(time: number, rate: number, size = 0.25): DisplaySignal {
  const both = new Float32Array(2048)
  for (let i = 0; i < 2048; i++) {
    const at = time - (2048 - i) / RATE
    const open = Math.sin(2 * Math.PI * rate * at) > 0 ? 1 : 0.05
    both[i] = open * size * Math.sin(2 * Math.PI * 997 * at + 3 * Math.sin(40 * at))
  }
  const level = levelOf(both)
  return {
    input: null,
    output: level,
    spectrum: null,
    binHz: RATE / 2048,
    left: level,
    right: level,
  }
}

/** The rates the timed draw is held at: the slowest, two where a flash is felt most, and the fastest. */
const TIMED_RATES = [0.5, 6, 10, 40]
/** The most times in a second anything drawn may turn back on itself. */
const MOST_TURNS = 6

/** A display that does what this one must not: a patch as wide as the sound is loud on each frame. */
const flasher = plateDisplay({
  place: 'window',
  columns: 2,
  params: ['drift'],
  live: { signal: true, notes: true },
  info: 'A patch that goes on and off with the sound, which is what the display of Coloured Noise may not do.',
  draw(frame) {
    ground(frame)
    const rms = frame.signal ? frame.signal.output.rms : 0
    fillRect(
      frame.ctx,
      { x: 4, y: 4, w: 4 + 400 * rms, h: 20 },
      frame.colours.accent,
      0.2 + 3 * rms,
    )
  },
})

describe('the Coloured Noise display over time (R10)', () => {
  /**
   * Two seconds at 30 frames a second with keys held and a sound that pulses
   * at `rate`. This device has no rate of its own to set: its quickest motion
   * is a swell of one second at a Drift time of two, and the cases below set
   * that. The keys were struck `age` seconds before the first frame.
   */
  const pulsing = (
    shown: PlateDisplay,
    rate: number,
    values: Values = {},
    age = 3,
  ): { frames: RecordingContext[]; levels: number[] } => {
    const levels: number[] = []
    const frames = framesOf(shown, 2, { values }, (time) => {
      const signal = pulsedSignal(time, rate)
      levels.push(signal.output.rms)
      return { signal, notes: heldNotes(age, time) }
    })
    return { frames, levels }
  }

  it('is handed a sound that does pulse', () => {
    for (const rate of TIMED_RATES) {
      const { frames, levels } = pulsing(display, rate)
      expect(frames).toHaveLength(60)
      const most = Math.max(...levels)
      const least = Math.min(...levels)
      // At forty a second the plate's tap is longer than a period, so it reads less of the pulse.
      expect(most / Math.max(least, 1e-9)).toBeGreaterThan(rate < 40 ? 10 : 1.05)
    }
  })

  it('catches a display that flashes', () => {
    for (const rate of [6, 10, 40]) {
      const { most, what } = flicker(pulsing(flasher, rate).frames)
      expect(most, `at ${rate} a second: ${what}`).toBeGreaterThan(MOST_TURNS)
    }
    // A thing that goes on and off is caught as well as one that changes size.
    const lit = Array.from({ length: 60 }, (_, n) =>
      drawDisplay(n % 4 < 2 ? flasher : display, COLOURED_NOISE_PARAMS),
    )
    expect(flicker(lit).most).toBeGreaterThan(MOST_TURNS)
    // And a display that stands still is not.
    const still = Array.from({ length: 60 }, () => drawDisplay(display, COLOURED_NOISE_PARAMS))
    expect(flicker(still)).toEqual({ most: 0, what: 'nothing' })
  })

  for (const rate of TIMED_RATES) {
    it(`draws nothing that turns back more than six times a second under a sound pulsing ${rate} times a second`, () => {
      const cases: [string, Values, number][] = [
        ['at its defaults', {}, 3],
        ['the quickest swells at full Drift', { drift: 1, driftTime: 2 }, 3],
        ['the quickest swells, across a turn of the page', { drift: 1, driftTime: 2 }, 6.9],
        ['the slowest swells', { drift: 1, driftTime: 30 }, 3],
        ['Tint up while the keys rise', { tint: 1, attack: 3, drift: 1, driftTime: 2 }, 0],
        ['no Drift, the sides apart', { drift: 0, width: 1, tint: 0.5 }, 3],
      ]
      for (const [what, values, age] of cases) {
        const found = flicker(pulsing(display, rate, values, age).frames)
        expect(found.most, `${what}: ${found.what}`).toBeLessThanOrEqual(MOST_TURNS)
      }
    })
  }

  it('moves only its dot and its level while keys are held, and nothing at all at rest', () => {
    // Held keys, a steady sound, no Drift: after the level has come up every frame is the same picture.
    const quiet = framesOf(display, 2, { values: { drift: 0 }, signal: steady(0.1) }, (time) => ({
      notes: heldNotes(9, time),
    })).map((drawn) => drawn.print())
    expect(new Set(quiet.slice(31)).size).toBe(1)
    // With Drift the dot goes on along its line and never back: one path, far under three times a second.
    const moving = framesOf(
      display,
      2,
      { values: { drift: 1, driftTime: 2 }, signal: steady(0.1) },
      (time) => ({ notes: heldNotes(0.2, time) }),
    )
    expect(flicker(moving).most).toBeLessThanOrEqual(3)
    // No swell is shorter than a second, so the dot is never down and up again inside one.
    expect(0.5 * COLOURED_NOISE_PARAMS.driftTime.min).toBeGreaterThanOrEqual(1)
    // At rest nothing moves.
    const rest = framesOf(display, 1).map((drawn) => drawn.print())
    expect(new Set(rest).size).toBe(1)
  })
})
