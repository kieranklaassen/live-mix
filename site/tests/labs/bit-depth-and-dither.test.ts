import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { decodeWav, encodeWav, readWavInfo } from '../../../src/core/render/encode.ts'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
  BIN,
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  mean,
  peak,
  points,
  range,
  RATE,
  rms,
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

const NAME = 'bit-depth-and-dither'

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings(NAME)!

/** A named set as its card plays it: on its own source, with `over` laid on its values. */
async function played(theLab: Lab, name: string, over: Record<string, number> = {}) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(theLab.description, set)
  return theLab.render(await benchSource(source!, seconds(4)), { ...values, ...over })
}

const loop = (id: string) => benchSource(id, seconds(4))

const tap = (result: RenderResult, id: string) => result.taps[id]!.channels_data[0]!
/** A tap's level over the loop, in dB against full scale. */
const levelOf = (result: RenderResult, id: string) => gainToDb(rms(tap(result, id)))
/** A tap's largest sample, in dB against full scale. */
const topOf = (result: RenderResult, id: string) => gainToDb(peak(tap(result, id)))
/** How far the sound stands over what the rounding added to it, in dB. */
const over = (result: RenderResult, error = 'error') =>
  levelOf(result, 'in') - levelOf(result, error)

/** How many different values a tap takes. */
const valuesOf = (x: Float32Array) => new Set(x).size

/** The share of a tap's samples that are exactly zero, in per cent. */
function zeroShare(x: Float32Array): number {
  let zeros = 0
  for (const v of x) if (v === 0) zeros += 1
  return (100 * zeros) / x.length
}

/** The longest run of samples that are exactly zero: where it starts, and how many there are. */
function longestSilence(x: Float32Array): { from: number; samples: number } {
  let best = { from: 0, samples: 0 }
  let run = 0
  for (let i = 0; i < x.length; i += 1) {
    run = x[i] === 0 ? run + 1 : 0
    if (run > best.samples) best = { from: i - run + 1, samples: run }
  }
  return best
}

/** The size of one frequency in a tap, in dB against full scale: the amplitude of the sine there. */
function tone(x: Float32Array, hz: number): number {
  let re = 0
  let im = 0
  for (let i = 0; i < x.length; i += 1) {
    const turn = (2 * Math.PI * hz * i) / RATE
    re += x[i]! * Math.cos(turn)
    im += x[i]! * Math.sin(turn)
  }
  return gainToDb((2 * Math.hypot(re, im)) / x.length)
}

/**
 * The power the page's spectrum of a tap finds between two frequencies, in dB. Its zero is the
 * spectrum's own, so two readings are compared and neither is stated alone.
 */
function band(theLab: Lab, id: string, from: number, to: number): number {
  const levels = theLab.spectrum(id)
  let sum = 0
  for (let k = Math.ceil(from / BIN); k * BIN < to; k += 1) sum += 10 ** (levels[k]! / 10)
  return 10 * Math.log10(Math.max(sum, 1e-30))
}

/** The highest and the lowest bin of the page's spectrum of a tap from 20 Hz to 20 kHz, in dB. */
function bins(theLab: Lab, id: string) {
  const levels = theLab.spectrum(id)
  return range(levels, Math.ceil(20 / BIN), Math.floor(20000 / BIN))
}

/** One level on every sample of both channels. */
function steady(value: number, frames: number): Source {
  return { left: new Float32Array(frames).fill(value), right: new Float32Array(frames).fill(value) }
}

/** The level out for a level in, read off a curve tap that runs from `x0` to `x1`. */
function readAt(result: RenderResult, id: string, x: number): number {
  const curve = result.taps[id]!
  const data = curve.channels_data[0]!
  return data[Math.round(((data.length - 1) * (x - curve.x0)) / (curve.x1 - curve.x0))]!
}

/** The levels a curve tap comes out at between two levels in, each once, in rising order. */
function treads(result: RenderResult, id: string, from: number, to: number): number[] {
  const curve = result.taps[id]!
  const data = curve.channels_data[0]!
  const found = new Set<number>()
  for (let p = 0; p < data.length; p += 1) {
    const x = curve.x0 + ((curve.x1 - curve.x0) * p) / (data.length - 1)
    if (x >= from - 1e-6 && x <= to + 1e-6) found.add(data[p]!)
  }
  return [...found].sort((a, b) => a - b)
}

const LOOPS = ['drums', 'guitar', 'chords', 'bass', 'pad', 'mix']

describe('bit depth and dither', () => {
  it('is a sound lab on the chords: every tap says something, loops, and answers to every control', async () => {
    const theLab = await lab(NAME)
    const chords = await loop('chords')
    const result = theLab.render(chords, {})
    expectSoundLab(theLab, chords, result)
  })

  it('builds a quantiser in five pieces on taps of its own: every step changes one and none changes the main path', async () => {
    const theLab = await lab(NAME)
    expect(theLab.description.controls.find((control) => control.id === 'build')!.choices).toEqual([
      'A wire',
      'Round to the step',
      'The error',
      'Add dither',
      'Shape the noise',
    ])
    expectBuild(theLab, await loop('chords'))
  })

  // ---- part 1: the ring that stops ------------------------------------------------------------

  it('at 6 bits writes 72 % of the samples of the chords as exactly zero, and puts out exact silence from 1.43 s until the second chord is struck, 583 ms later (claim ring-stops)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'ring')
    const out = tap(result, 'rounded')
    expectWritten(zeroShare(out), '72 %')
    // The last sample before 2 s that is not zero, and the first after it that is not.
    let last = seconds(2)
    while (out[last] === 0) last -= 1
    let next = last + 1
    while (out[next] === 0) next += 1
    expectWritten((last + 1) / RATE, '1.43 s')
    expectWritten(((next - last - 1) * 1000) / RATE, '583 ms')
    // That is the second strike: the largest sample of the next tenth of a second is a chord.
    expect(peak(out.subarray(next, next + seconds(0.1)))).toBeGreaterThan(0.25)
    // And the chord that went in is sounding all through it.
    expect(peak(tap(result, 'in').subarray(last + 1, next))).toBeGreaterThan(0.005)
    // With dither there is no such stretch: no tenth of a second of the output is silent.
    expect(longestSilence(tap(result, 'dithered')).samples).toBeLessThan(seconds(0.001))
  })

  it('finds the chord still there: at 1.5 s the level of the input reads −44.7 dB and at 1.95 s −51.4 dB (claim ring-there)', async () => {
    const theLab = await lab(NAME)
    const level = tap(await played(theLab, 'ring'), 'inLevel')
    expectWritten(level[points(1.5)]!, '−44.7 dB')
    expectWritten(level[points(1.95)]!, '−51.4 dB')
  })

  it('lets the level of the error follow the chords through 12.4 dB at 6 bits (claim ring-follows), and with dither holds it within 0.6 dB, at −36.1 dB over the loop (claim ring-dithered)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'ring')
    expectWritten(range(tap(result, 'errorLevel')).span, '12.4 dB')
    expectWritten(range(tap(result, 'ditheredLevel')).span, '0.6 dB')
    expectWritten(levelOf(result, 'ditheredError'), '−36.1 dB')
    // It is higher than the error of plain rounding at its highest.
    expect(range(tap(result, 'ditheredLevel')).lo).toBeGreaterThan(
      range(tap(result, 'errorLevel')).hi + 3,
    )
    // From 1.5 s on the rounded output is silence, so the error is the chord itself, turned over.
    const [error, level] = [tap(result, 'errorLevel'), tap(result, 'inLevel')]
    // The meter still remembers a little of the error from before the output stopped.
    for (const at of [1.5, 1.8, 1.95]) {
      expect(Math.abs(error[points(at)]! - level[points(at)]!)).toBeLessThan(0.01)
    }
  })

  it('with two bits more only moves the trouble down: at 8 bits 30.6 % of the samples of the chords are still exactly zero and the level of the error still moves through 2.5 dB (claim more-bits)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'ring', { bits: 8 })
    expectWritten(zeroShare(tap(result, 'rounded')), '30.6 %')
    expectWritten(range(tap(result, 'errorLevel')).span, '2.5 dB')
  })

  it('rounds a 440 Hz tone 0.254 of a step tall, Level in at −30 dB at 6 bits, to exact silence (claim small-gone)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'small')
    // Its largest sample is a quarter of a step from zero: under the half step that rounds up.
    expectWritten(peak(tap(result, 'in')) / 2 ** -5, '0.254')
    expect(tap(result, 'rounded').every((v) => v === 0)).toBe(true)
    // Twice as tall, it would cross the half step and come out.
    expect(peak(tap(await played(theLab, 'small', { level: -24 }), 'rounded'))).toBeGreaterThan(0)
  })

  it('with dither brings that tone out with its peaks at −42 dB, less than 0.1 dB from where they went in, a level of −45 dB, in a hiss whose level reads −36.1 dB (claim small-kept)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'smallDithered')
    const [went, came] = [tone(tap(result, 'in'), 440), tone(tap(result, 'dithered'), 440)]
    expectWritten(went, '−42 dB')
    expectWritten(came, '−42 dB')
    expectWritten(Math.abs(came - went), 'less than 0.1 dB')
    // The tone's level, as every level on the page is read: 3 dB under its peaks.
    expectWritten(levelOf(result, 'in'), '−45 dB')
    // The hiss is what came out less what went in. The tone is no part of it.
    expectWritten(levelOf(result, 'ditheredError'), '−36.1 dB')
    expect(tone(tap(result, 'ditheredError'), 440)).toBeLessThan(came - 20)
  })

  // ---- part 2: the stair ----------------------------------------------------------------------

  it('draws the stair of the device: at 4 bits a level of 0.3 comes out as 0.25, and there are 8 risers between 0 and 1 (claim stairs-reads)', async () => {
    const theLab = await lab(NAME)
    const result = theLab.render(await loop('chords'), { bits: 4 })
    expectWritten(readAt(result, 'stairs', 0.3), '0.25')
    // Nine treads from 0 to 1, with eight risers between them, each an eighth high.
    const found = treads(result, 'stairs', 0, 1)
    expectWritten(found.length - 1, '8')
    found.forEach((level, k) => expect(level).toBe(k / 8))
    // At the 6 bits the page starts on there are four times as many.
    expect(treads(theLab.render(await loop('chords'), {}), 'stairs', 0, 1).length - 1).toBe(32)
    // The error against the level going in never passes half a step.
    expectWritten(peak(tap(result, 'stairsError').subarray(100, 900)), '0.0625')
  })

  // ---- part 4: the build ----------------------------------------------------------------------

  it('is a wire at the first step: the input, sample for sample (claim build-wire)', async () => {
    const theLab = await lab(NAME)
    const chords = await loop('chords')
    const result = theLab.render(chords, { build: 0 })
    expect(tap(result, 'built').every((v, i) => v === chords.left[i])).toBe(true)
    expect(tap(result, 'builtError').every((v) => v === 0)).toBe(true)
  })

  it('at the second step writes the chords, which went in on 191,790 different values, on 32 (claim build-round)', async () => {
    const theLab = await lab(NAME)
    const chords = await loop('chords')
    const values = (build: number) => valuesOf(tap(theLab.render(chords, { build }), 'built'))
    expectWritten(values(1), '32')
    // The piece out: the wire lets every value through.
    expectWritten(values(0), '191,790')
    expect(matchesWritten(values(0), '32')).toBe(false)
    // And it answers to Bits: 4 bits leave nine.
    expect(valuesOf(tap(theLab.render(chords, { build: 1, bits: 4 }), 'built'))).toBe(9)
  })

  it('at the third step finds an error on the chords at 6 bits whose largest sample stands at −36.1 dB, half a step, and whose level over the loop is −42.3 dB (claim build-error)', async () => {
    const theLab = await lab(NAME)
    const chords = await loop('chords')
    const result = theLab.render(chords, { build: 2 })
    expectWritten(topOf(result, 'builtError'), '−36.1 dB')
    expectWritten(levelOf(result, 'builtError'), '−42.3 dB')
    // Half a step of 2^(1 − 6) is 2^−6.
    expect(peak(tap(result, 'builtError'))).toBeLessThanOrEqual(2 ** -6)
    // It is the output less the input, and nothing else.
    const [out, error] = [tap(result, 'built'), tap(result, 'builtError')]
    expect(error.every((v, i) => v === Math.fround(out[i]! - chords.left[i]!))).toBe(true)
    // The piece out: the step before works no error out.
    const before = theLab.render(chords, { build: 1 })
    expect(matchesWritten(topOf(before, 'builtError'), '−36.1 dB')).toBe(false)
    expect(matchesWritten(levelOf(before, 'builtError'), '−42.3 dB')).toBe(false)
  })

  it('at the fourth step holds the level of the error on the chords between −36.4 dB and −35.8 dB, where the step before let it move through 12.4 dB (claim build-dither)', async () => {
    const theLab = await lab(NAME)
    const chords = await loop('chords')
    const level = (build: number) => range(tap(theLab.render(chords, { build }), 'builtLevel'))
    expectWritten(level(3).lo, '−36.4 dB')
    expectWritten(level(3).hi, '−35.8 dB')
    expectWritten(level(2).span, '12.4 dB')
    // The piece out: neither end of that range is where the step before leaves it.
    expect(matchesWritten(level(2).lo, '−36.4 dB')).toBe(false)
    expect(matchesWritten(level(2).hi, '−35.8 dB')).toBe(false)
    expect(matchesWritten(level(3).span, '12.4 dB')).toBe(false)
  })

  it('at the fourth step brings the 440 Hz tone a quarter of a step tall, Level in at −30 dB, out at −42 dB, where the step before put out silence (claim build-small)', async () => {
    const theLab = await lab(NAME)
    const small = await loop('sine')
    const built = (build: number) => tap(theLab.render(small, { level: -30, build }), 'built')
    expectWritten(tone(built(3), 440), '−42 dB')
    expect(built(2).every((v) => v === 0)).toBe(true)
    expect(matchesWritten(tone(built(2), 440), '−42 dB')).toBe(false)
  })

  it('at the fourth step keeps the average of a steady level: 0.3 at 6 bits comes out as 0.3125 on every sample from the rounding alone, and with dither on three values whose mean over a second is 0.3001 (claim mean-kept)', async () => {
    const theLab = await lab(NAME)
    const level = steady(0.3, seconds(1))
    const built = (build: number) => tap(theLab.render(level, { build }), 'built')
    expect(built(2).every((v) => v === 0.3125)).toBe(true)
    expect([...new Set(built(3))].sort()).toEqual([0.28125, 0.3125, 0.34375])
    expectWritten(mean(built(3)), '0.3001')
    expect(matchesWritten(mean(built(2)), '0.3001')).toBe(false)
    // The nearest level is written most often, the next nearest less often, the third least.
    const share = (value: number) => built(3).filter((v) => v === value).length / seconds(1)
    expect(share(0.3125)).toBeGreaterThan(share(0.28125))
    expect(share(0.28125)).toBeGreaterThan(share(0.34375))
    expect(share(0.34375)).toBeGreaterThan(0)
    // The engine's own quantiser, on the main path, does the same.
    expectWritten(mean(tap(theLab.render(level, {}), 'dithered')), '0.3001')
  })

  it('at the fifth step, on the chords at 6 bits, leaves 10.4 dB less error below 4 kHz than the step before and 5.1 dB more above 12 kHz, and over the whole band −33.1 dB where the step before left −36.1 dB (claim build-shape)', async () => {
    const theLab = await lab(NAME)
    const chords = await loop('chords')
    const measured = (build: number) => {
      const result = theLab.render(chords, { build })
      return {
        low: band(theLab, 'builtError', 20, 4000),
        high: band(theLab, 'builtError', 12000, 24000),
        all: levelOf(result, 'builtError'),
      }
    }
    const [dithered, shaped] = [measured(3), measured(4)]
    expectWritten(dithered.low - shaped.low, '10.4 dB')
    expectWritten(shaped.high - dithered.high, '5.1 dB')
    expectWritten(shaped.all, '−33.1 dB')
    expectWritten(dithered.all, '−36.1 dB')
    // The piece out: the step before has the level the shaping raised, and no tilt. Its error
    // below 4 kHz stands under its error above 12 kHz only by the widths of the two bands.
    expect(matchesWritten(dithered.all, '−33.1 dB')).toBe(false)
    expectWritten(dithered.high - dithered.low, '4.8 dB')
    expect(matchesWritten(shaped.high - shaped.low, '4.8 dB')).toBe(false)
    expect(shaped.high - shaped.low).toBeGreaterThan(20)
    // What the shaping adds to the sound is each sample's error less the one before it: the
    // steady level of the claim before comes out with its mean exact.
    const level = steady(0.3, seconds(1))
    expect(mean(tap(theLab.render(level, { build: 4 }), 'built'))).toBeCloseTo(0.3, 5)
  })

  it("with rounding and dither is the engine's own 16-bit store at the store's step: the fourth step is the one compared, the bound is −120 dB, and the two differ on 0 samples (claim build-same)", async () => {
    const theLab = await lab(NAME)
    const tried: Record<string, number>[] = [
      {},
      { bits: 16 },
      { level: -30, bits: 4 },
      { build: 1 },
    ]
    for (const id of [...LOOPS, 'saw', 'noise', 'sine', 'clicks']) {
      const source = await loop(id)
      for (const values of tried) {
        const result = theLab.render(source, values)
        expect(result.checks.builtStep).toBe(3)
        expect(result.checks.builtBound).toBe(-120)
        // −140 dB is the floor of the reading: a difference more than 140 dB down, or none.
        expect(result.checks.builtDifference).toBe(-140)
        // So the lab counts the samples on which the two are not the same number.
        expectWritten(result.checks.storeApart!, '0')
      }
    }
    // The main path's `dithered` is that store too, with one of its steps standing for one of
    // the page's: the build's fourth step at the page's Bits lands on it.
    for (const id of ['chords', 'sine', 'drums']) {
      const result = theLab.render(await loop(id), { build: 3 })
      const [main, own] = [tap(result, 'dithered'), tap(result, 'built')]
      let apart = 0
      for (let i = 0; i < main.length; i += 1) if (main[i] !== own[i]) apart += 1
      expect(apart).toBeLessThan(5)
    }
  })

  // ---- part 5: the stages ---------------------------------------------------------------------

  it("reads the device's output as the input rounded: on every loop it stands more than 150 dB over what separates it from the build's rounding (claim device-rounds)", async () => {
    const theLab = await lab(NAME)
    for (const id of [...LOOPS, 'sine', 'saw', 'noise']) {
      for (const values of [{}, { bits: 12 }, { level: -18, bits: 9 }]) {
        const result = theLab.render(await loop(id), { ...values, build: 1 })
        const [device, own] = [tap(result, 'rounded'), tap(result, 'built')]
        let apart = 0
        let whole = 0
        for (let i = 0; i < device.length; i += 1) {
          apart += (device[i]! - own[i]!) ** 2
          whole += device[i]! ** 2
        }
        expectWritten(10 * Math.log10(whole / apart), 'more than 150 dB')
        // The build's rounding function against the device's own, on the same samples.
        expect(result.checks.rounding).toBe(-140)
      }
    }
  })

  it('steps the Mu-law stair unevenly: at 4 bits its first tread over zero stands at 0.0039 and its last at 1, each riser about twice the one before, where the Linear stair has its first at 0.125 (claim mu-steps)', async () => {
    const theLab = await lab(NAME)
    const chords = await loop('chords')
    const found = treads(theLab.render(chords, { bits: 4, companding: 1 }), 'stairs', 0, 1)
    expect(found.length).toBe(9)
    expectWritten(found[1]!, '0.0039')
    expectWritten(found[8]!, '1')
    // Tread k stands at (2^k − 1) / 255.
    found.forEach((level, k) => expect(level).toBeCloseTo((2 ** k - 1) / 255, 5))
    expectWritten(treads(theLab.render(chords, { bits: 4 }), 'stairs', 0, 1)[1]!, '0.125')
  })

  it('cuts a level past the top off flat: 1.25 in comes out as 1.125 (claim over-top)', async () => {
    const theLab = await lab(NAME)
    const result = theLab.render(await loop('chords'), {})
    expectWritten(readAt(result, 'stairs', 1.25), '1.125')
    expectWritten(readAt(result, 'stairs', -1.25), '−1.125')
    expectWritten(readAt(result, 'stairs', 1), '1')
  })

  it("bends a level over the top in the device's input stage before the stair gets it: a steady 1.25 comes out of the running device at 6 bits as 1.0625 (claim device-top)", async () => {
    const theLab = await lab(NAME)
    const out = tap(theLab.render(steady(1.25, seconds(1)), {}), 'rounded')
    expectWritten(out[0]!, '1.0625')
    expect(out.every((v) => v === out[0])).toBe(true)
    // Full scale itself goes through as it is.
    expect(tap(theLab.render(steady(1, seconds(1)), {}), 'rounded').every((v) => v === 1)).toBe(
      true,
    )
  })

  it('measures the error of plain rounding on white noise at 6 bits at −40.9 dB (claim error-size), and with dither at −36.1 dB, 4.8 dB more (claim dither-cost)', async () => {
    const theLab = await lab(NAME)
    const result = theLab.render(await loop('noise'), {})
    expectWritten(levelOf(result, 'error'), '−40.9 dB')
    expectWritten(levelOf(result, 'ditheredError'), '−36.1 dB')
    expectWritten(levelOf(result, 'ditheredError') - levelOf(result, 'error'), '4.8 dB')
    // A step over the square root of 12, and half a step.
    expect(Math.abs(levelOf(result, 'error') - gainToDb(2 ** -5 / Math.sqrt(12)))).toBeLessThan(
      0.05,
    )
    expect(Math.abs(levelOf(result, 'ditheredError') - gainToDb(2 ** -6))).toBeLessThan(0.05)
    // The cost is the same at other numbers of bits, on a sound that crosses many treads.
    for (const bits of [4, 8, 12, 16]) {
      const other = theLab.render(await loop('noise'), { bits })
      expectWritten(levelOf(other, 'ditheredError') - levelOf(other, 'error'), '4.8 dB')
    }
  })

  it('gains 6.0 dB for each bit: a full-scale sine at 997 Hz stands 38.1 dB over the error at 6 bits, 50.0 dB at 8 bits and 98.1 dB at 16 bits (claim six-a-bit)', async () => {
    const theLab = await lab(NAME)
    const full = sine(997, 1, seconds(4))
    const at = (bits: number) => over(theLab.render(full, { bits }))
    expectWritten(at(6), '38.1 dB')
    expectWritten(at(8), '50.0 dB')
    expectWritten(at(16), '98.1 dB')
    expectWritten((at(16) - at(6)) / 10, '6.0 dB')
  })

  it('works the two numbers of the formula out: twenty times the logarithm of 2 is 6.02 dB, and ten times the logarithm of three halves is 1.76 dB (claim formula-numbers)', () => {
    expectWritten(20 * Math.log10(2), '6.02 dB')
    expectWritten(10 * Math.log10(1.5), '1.76 dB')
  })

  it('finds the error of the 440 Hz tone at 4 bits made of its harmonics: the strongest, the 11th at 4,840 Hz, stands at −31.1 dB, 19.4 dB under the tone (claim error-lines)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'stair')
    const out = tap(result, 'rounded')
    const harmonic = (n: number) => tone(out, 440 * n)
    expectWritten(harmonic(11), '−31.1 dB')
    expectWritten(harmonic(1) - harmonic(11), '19.4 dB')
    // The loop repeats every fortieth of a second, so every line it can hold stands on a multiple
    // of 40 Hz, the harmonics that fold back among them. None but the tone is stronger.
    for (let hz = 40; hz < RATE / 2; hz += 40) {
      if (hz !== 440 && hz !== 4840) expect(tone(out, hz), `${hz} Hz`).toBeLessThan(harmonic(11))
    }
    // The even harmonics are not there at all.
    for (const n of [2, 4, 6]) expect(harmonic(n)).toBeLessThan(-90)
  })

  it('plays that tone at 4 bits at a level 12.8 dB over the chords of part 1 in 6 bits (claim stair-loud)', async () => {
    const theLab = await lab(NAME)
    const [stair, ring] = [await played(theLab, 'stair'), await played(theLab, 'ring')]
    expectWritten(levelOf(stair, 'rounded') - levelOf(ring, 'rounded'), '12.8 dB')
  })

  it('with dither takes that harmonic away: at 4,840 Hz the output holds more than 35 dB less, and the bins of the spectrum of the error from 20 Hz to 20 kHz lie within 3.4 dB of each other (claim floor-flat)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'stair')
    const drop = tone(tap(result, 'rounded'), 4840) - tone(tap(result, 'dithered'), 4840)
    expectWritten(drop, 'more than 35 dB')
    expectWritten(bins(theLab, 'ditheredError').span, '3.4 dB')
    // Nothing stands out of the hiss there: the output holds no more at 4,840 Hz than at the
    // strongest of forty frequencies beside it, 7 Hz apart, where no harmonic can fall.
    let beside = -Infinity
    for (let k = -20; k <= 20; k += 1) {
      if (k !== 0) beside = Math.max(beside, tone(tap(result, 'dithered'), 4840 + 7 * k))
    }
    expect(tone(tap(result, 'dithered'), 4840)).toBeLessThan(beside)
    // Without dither the same bins are spread over far more.
    expect(bins(theLab, 'error').span).toBeGreaterThan(60)
  })

  it('draws a dither of one random number less another: alone it reads −37.9 dB at 6 bits and its largest sample −30.1 dB, one step (claim dither-size)', async () => {
    const theLab = await lab(NAME)
    for (const id of ['chords', 'noise']) {
      const result = theLab.render(await loop(id), {})
      expectWritten(levelOf(result, 'dither'), '−37.9 dB')
      expectWritten(topOf(result, 'dither'), '−30.1 dB')
      expect(peak(tap(result, 'dither'))).toBeLessThanOrEqual(2 ** -5)
    }
  })

  it('spreads the dither as a triangle: a draw near zero is twice as likely as one half a step out, 1.0 against 0.5 on the curve, and one random number alone is spread flat (claim dither-shape)', async () => {
    const theLab = await lab(NAME)
    const result = theLab.render(await loop('chords'), {})
    const two = tap(result, 'ditherSpread')
    const one = tap(result, 'ditherOne')
    expect(two.length).toBe(40)
    // The two bins either side of zero, and the two either side of half a step each way.
    expectWritten((two[19]! + two[20]!) / 2, '1.0')
    expectWritten((two[9]! + two[10]! + two[29]! + two[30]!) / 4, '0.5')
    // One number alone: flat at 1 over the step it covers, and nothing outside it.
    for (let k = 10; k < 30; k += 1) expect(Math.abs(one[k]! - 1)).toBeLessThan(0.05)
    for (const k of [0, 5, 9, 30, 35, 39]) expect(one[k]).toBe(0)
  })

  it('makes the error as large wherever the sound sits on its tread: a steady level on a level of the stair, one half way between two, and one at 0.3 each come out with an error of −36.1 dB at 6 bits (claim dither-even)', async () => {
    const theLab = await lab(NAME)
    // At 6 bits a step is a thirty-second: 0.3125 is ten steps, 0.296875 nine and a half.
    for (const level of [0.3125, 0.296875, 0.3]) {
      const result = theLab.render(steady(level, seconds(4)), {})
      expectWritten(levelOf(result, 'ditheredError'), '−36.1 dB')
    }
    // Plain rounding is as far out as the level is from its tread: nothing, half a step, less.
    const plain = (level: number) =>
      peak(tap(theLab.render(steady(level, seconds(1)), {}), 'error'))
    expect(plain(0.3125)).toBe(0)
    expect(plain(0.296875)).toBe(2 ** -6)
  })

  it("works the store's dither out again and finds its answer not the nearest step on 0 samples (claim dither-held), and reads the store's own floor at −90.3 dB, as the page's error with dither reads at 15 bits (claim store-floor)", async () => {
    const theLab = await lab(NAME)
    for (const id of [...LOOPS, 'sine', 'saw', 'noise']) {
      for (const values of [{}, { bits: 16 }, { bits: 4, level: -30 }]) {
        const result = theLab.render(await loop(id), values)
        expectWritten(result.checks.ditherHeld!, '0')
        expectWritten(result.checks.storeFloor!, '−90.3 dB')
      }
      // The store's step is the page's step at 15 bits, to one part in 32,767.
      expectWritten(
        levelOf(theLab.render(await loop(id), { bits: 15 }), 'ditheredError'),
        '−90.3 dB',
      )
    }
  })

  it('on the chords at 6 bits, with the shaping, leaves 22 dB less error below 1 kHz than dither alone, and 3.0 dB more over the whole band (claim shape-low)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'ring')
    const low = (id: string) => band(theLab, id, 20, 1000)
    expectWritten(low('ditheredError') - low('shapedError'), '22 dB')
    expectWritten(levelOf(result, 'shapedError') - levelOf(result, 'ditheredError'), '3.0 dB')
    // The same sound comes out of both: the tone of the prediction is as large either way.
    const small = await played(theLab, 'smallDithered')
    expect(Math.abs(tone(tap(small, 'shaped'), 440) - tone(tap(small, 'in'), 440))).toBeLessThan(
      0.1,
    )
    // The card that plays the shaped sound, at 8 bits: more error than dither alone over the
    // whole band, less of it below 4 kHz and more above 12 kHz.
    const lifted = await played(theLab, 'lifted')
    expect(levelOf(lifted, 'shapedError')).toBeGreaterThan(levelOf(lifted, 'ditheredError') + 2.5)
    expect(band(theLab, 'shapedError', 20, 4000)).toBeLessThan(
      band(theLab, 'ditheredError', 20, 4000) - 9,
    )
    expect(band(theLab, 'shapedError', 12000, 24000)).toBeGreaterThan(
      band(theLab, 'ditheredError', 12000, 24000) + 4,
    )
  })

  // ---- the named sets: what each card plays, and the number its card states -------------------

  it('renders every named set on its own source, finite, and heard wherever its card does not play silence on purpose', async () => {
    const theLab = await lab(NAME)
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = await played(theLab, name)
      const sound = set.tap ?? 'rounded'
      expect(
        tap(result, sound).every((v) => Number.isFinite(v)),
        name,
      ).toBe(true)
      expect(topOf(result, sound), `${name} fits`).toBeLessThan(0)
      // "small" is the tone that rounds to nothing: its card plays silence, and says so.
      // "ringError" is the error alone, which is small by its nature.
      if (name === 'small') expect(peak(tap(result, sound)), name).toBe(0)
      else expect(levelOf(result, sound), `${name} is heard`).toBeGreaterThan(-50)
      // No set moves the build step.
      expect(set.values?.build).toBeUndefined()
    }
  })

  it('on the tail card holds the error with dither between −48.4 dB and −47.8 dB while the chord falls to −51.4 dB at 1.95 s, under it, and its strongest partial there comes out less than 1 dB from its size (claim use-tail)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'tail')
    const hiss = range(tap(result, 'ditheredLevel'))
    expectWritten(hiss.lo, '−48.4 dB')
    expectWritten(hiss.hi, '−47.8 dB')
    expectWritten(tap(result, 'inLevel')[points(1.95)]!, '−51.4 dB')
    // The second ring passes under the hiss too, at the loop's end.
    expect(tap(result, 'inLevel')[points(3.99)]!).toBeLessThan(hiss.lo)
    // And the chord is still in what comes out: its strongest partial there, found in the input,
    // is in the dithered output at the same size.
    const from = seconds(1.5)
    const to = seconds(1.95)
    const [went, came] = [
      tap(result, 'in').subarray(from, to),
      tap(result, 'dithered').subarray(from, to),
    ]
    let best = 80
    for (let hz = 80; hz <= 1000; hz += 1) if (tone(went, hz) > tone(went, best)) best = hz
    expectWritten(Math.abs(tone(came, best) - tone(went, best)), 'less than 1 dB')
    // It is a partial and not the hiss: it stands well over the hiss in that band.
    expect(tone(came, best)).toBeGreaterThan(tone(came, best + 7) + 10)
  })

  it('on the gaps card finds the longest gap of the drums exact silence for 236 ms when rounded alone at 8 bits, and a hiss at −48.2 dB there with dither (claim use-gaps)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'gaps')
    const gap = longestSilence(tap(result, 'rounded'))
    expectWritten((gap.samples * 1000) / RATE, '236 ms')
    expectWritten(
      gainToDb(rms(tap(result, 'dithered'), gap.from, gap.from + gap.samples)),
      '−48.2 dB',
    )
  })

  it('on the quiet card, with Level in at −24 dB at 8 bits, writes a pad whose largest sample is 2.9 steps tall on 7 levels, three either side of zero, with 55 % of the samples exactly zero, and the pad stands 7.2 dB over the error (claim use-quiet)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'quiet')
    expectWritten(peak(tap(result, 'in')) / 2 ** -7, '2.9')
    // Counted as levels of the stair. The device's output can stand the last digit of a float
    // off a level, which a count of different floats would take for a level of its own.
    const step = 2 ** -7
    const levels = new Set<number>()
    let off = 0
    for (const v of tap(result, 'rounded')) {
      const level = Math.round(v / step)
      levels.add(level)
      off = Math.max(off, Math.abs(v - level * step))
    }
    expectWritten(levels.size, '7')
    expect([...levels].sort((a, b) => a - b)).toEqual([-3, -2, -1, 0, 1, 2, 3])
    expect(off).toBeLessThan(step * 1e-6)
    expectWritten(zeroShare(tap(result, 'rounded')), '55 %')
    expectWritten(over(result), '7.2 dB')
  })

  it('on the mix card at 16 bits reads the error of rounding at −101.1 dB and the error with dither at −96.3 dB (claim use-master)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'master')
    expectWritten(levelOf(result, 'error'), '−101.1 dB')
    expectWritten(levelOf(result, 'ditheredError'), '−96.3 dB')
  })

  it('loses a bit for every 6 dB the sound is turned down: the guitar at 8 bits stands 28.9 dB over the error with Level in at 0 dB and 5.9 dB over it at −24 dB (claim way-level)', async () => {
    const theLab = await lab(NAME)
    expectWritten(over(await played(theLab, 'low', { level: 0 })), '28.9 dB')
    expectWritten(over(await played(theLab, 'low')), '5.9 dB')
  })

  it('on Mu-law keeps the quiet guitar 33 dB over the error at −24 dB, and 38 dB over it at 0 dB (claim way-mulaw)', async () => {
    const theLab = await lab(NAME)
    expectWritten(over(await played(theLab, 'mulaw')), '33 dB')
    expectWritten(over(await played(theLab, 'mulaw', { level: 0 })), '38 dB')
    // The card before it is the same guitar on the Linear stair.
    expect(settings.sets.mulaw!.values).toEqual({ ...settings.sets.low!.values, companding: 1 })
  })

  it('pays for Mu-law at the loud end: a full-scale sine at 997 Hz at 8 bits stands 50.0 dB over the error on the Linear stair and 38.5 dB over it on Mu-law (claim mulaw-top)', async () => {
    const theLab = await lab(NAME)
    const full = sine(997, 1, seconds(4))
    expectWritten(over(theLab.render(full, { bits: 8, companding: 0 })), '50.0 dB')
    expectWritten(over(theLab.render(full, { bits: 8, companding: 1 })), '38.5 dB')
  })

  it('on the hiss card finds the longest gap of the drums exact silence for 240 ms when rounded alone at 6 bits, and a hiss at −36 dB there with dither (claim fault-hiss)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'hiss')
    const gap = longestSilence(tap(result, 'rounded'))
    expectWritten((gap.samples * 1000) / RATE, '240 ms')
    expectWritten(
      gainToDb(rms(tap(result, 'dithered'), gap.from, gap.from + gap.samples)),
      '−36 dB',
    )
    // Silence in is exact silence out of the rounding, and three values out of the dither.
    const quiet = theLab.render(silence(seconds(1)), {})
    expect(tap(quiet, 'rounded').every((v) => v === 0)).toBe(true)
    expect([...new Set(tap(quiet, 'dithered'))].sort()).toEqual([-0.03125, 0, 0.03125])
  })

  it('finds the error of plain rounding already steady on a sound many steps tall: on the chords at 12 bits its level holds within 0.5 dB, and the level of the error with dither within 0.6 dB (claim myth-steady)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'ring', { bits: 12 })
    expectWritten(range(tap(result, 'errorLevel')).span, '0.5 dB')
    expectWritten(range(tap(result, 'ditheredLevel')).span, '0.6 dB')
  })

  it("reads the engine's file writer: 16 bits unless asked for more, one rounding and no dither, so that the end of a fade under half a step is written as exact silence (claim file-fade)", () => {
    // A 440 Hz tone that dies away over a second, from a hundredth of full scale to a millionth.
    const fade = new Float32Array(RATE)
    for (let i = 0; i < RATE; i += 1) {
      fade[i] = 0.01 * 10 ** ((-4 * i) / RATE) * Math.sin((2 * Math.PI * 440 * i) / RATE)
    }
    const audio = { channels: [fade], sampleRate: RATE }
    const file = encodeWav(audio)
    expect(readWavInfo(file).bitDepth).toBe(16)
    expect(readWavInfo(file).format).toBe('pcm')
    // Each sample is the nearest whole number of 32,767ths, and nothing is added first: the
    // numbers in the file are the rounding of the float, and the same every time.
    const written = new Int16Array(file, readWavInfo(file).dataOffset, RATE)
    expect(written.every((code, i) => code === Math.round(fade[i]! * 32767))).toBe(true)
    expect(new Uint8Array(encodeWav(audio))).toEqual(new Uint8Array(file))
    // Half a step of that file. Every sample of the fade under it is written as zero, and from
    // the last sample over it to the end the file is exact silence while the fade goes on.
    const half = 0.5 / 32767
    const back = decodeWav(file).channels[0]!
    let last = RATE - 1
    while (Math.abs(fade[last]!) < half) last -= 1
    expect(last).toBeLessThan(RATE - seconds(0.2))
    expect(back.subarray(last + 1).every((v) => v === 0)).toBe(true)
    expect(peak(fade.subarray(last + 1))).toBeGreaterThan(0)
    expect(fade.every((v, i) => Math.abs(v) >= half || back[i] === 0)).toBe(true)
    // Asked for 24 bits it writes them, with the same plain rounding; asked for 32, floats.
    const fine = encodeWav(audio, { bitDepth: 24 })
    expect(readWavInfo(fine).bitDepth).toBe(24)
    expect(
      decodeWav(fine).channels[0]!.every(
        (v, i) => v === Math.fround(Math.round(fade[i]! * 8388607) / 8388608),
      ),
    ).toBe(true)
    expect(readWavInfo(encodeWav(audio, { bitDepth: 32 })).format).toBe('float')
    expect(decodeWav(encodeWav(audio, { bitDepth: 32 })).channels[0]).toEqual(fade)
  })

  it("starts the page's device table from the device's own defaults: the settings file's defaults are device.json's for the three controls the lab takes from the device", async () => {
    const theLab = await lab(NAME)
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/vintage-digital/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    // Level in is the lab's own and is not the device's Drive: it has no row.
    expect(Object.keys(settings.defaults!.values).sort()).toEqual(['bits', 'companding', 'rate'])
    const { values } = resolveSet(theLab.description, { values: settings.defaults!.values })
    for (const id of ['rate', 'bits', 'companding']) {
      expect(values[id], id).toBe(device.params.find((one) => one.key === id)!.default)
    }
    // The lesson starts two of them elsewhere, and says so in its bench note.
    const start = (id: string) => theLab.description.controls.find((one) => one.id === id)!.initial
    expect([start('rate'), start('bits'), start('companding')]).toEqual([48000, 6, 0])
  })
})
