import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
  BIN,
  click,
  differenceDb,
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  peak,
  range,
  RATE,
  rms,
  seconds,
  sine,
} from './support.ts'

const NAME = 'state-variable-filter'

/** One unit sample at the start of a second's loop: what comes out of a stage is its ring. */
const unitSample = () => click(seconds(1))

/** The level of a ring at one frequency, in dB: the sum the Fourier transform is, at exactly `hz`. */
function levelDb(h: Float32Array, hz: number, count = Math.min(h.length, RATE / 2)): number {
  const w = (2 * Math.PI * hz) / RATE
  let re = 0
  let im = 0
  for (let n = 0; n < count; n += 1) {
    re += h[n]! * Math.cos(w * n)
    im -= h[n]! * Math.sin(w * n)
  }
  return 10 * Math.log10(Math.max(re * re + im * im, 1e-30))
}

/** Where a ring's response is highest between two frequencies, to a thousandth of a percent. */
function peakHz(h: Float32Array, from: number, to: number, count?: number): number {
  let best = from
  let top = -Infinity
  const look = (a: number, b: number, steps: number) => {
    for (let s = 0; s <= steps; s += 1) {
      const hz = a * (b / a) ** (s / steps)
      const db = levelDb(h, hz, count)
      if (db > top) {
        top = db
        best = hz
      }
    }
  }
  look(from, to, 400)
  const step = (to / from) ** (1 / 400)
  look(best / step, best * step, 400)
  return best
}

interface Drawn {
  channels_data: Float32Array[]
  x0: number
  x1: number
}

/** Where a curve the lab drew is highest, on its own axis, by a parabola through its top three points. */
function curvePeak(tap: Drawn): number {
  const ys = tap.channels_data[0]!
  let at = 0
  for (let i = 1; i < ys.length; i += 1) if (ys[i]! > ys[at]!) at = i
  let shift = 0
  if (at > 0 && at < ys.length - 1) {
    const [a, b, c] = [ys[at - 1]!, ys[at]!, ys[at + 1]!]
    shift = (0.5 * (a - c)) / (a - 2 * b + c)
  }
  return tap.x0 * (tap.x1 / tap.x0) ** ((at + shift) / (ys.length - 1))
}

/** A curve the lab drew at even ratios of frequency, read at `hz` between its two nearest points. */
function curveAt(tap: Drawn, hz: number): number {
  const ys = tap.channels_data[0]!
  const at = (Math.log(hz / tap.x0) / Math.log(tap.x1 / tap.x0)) * (ys.length - 1)
  const under = Math.floor(at)
  return ys[under]! + (ys[under + 1]! - ys[under]!) * (at - under)
}

const largest = (x: Float32Array) => x.reduce((most, v) => Math.max(most, v), -Infinity)

/** Samples enough for a ring to have fallen 120 dB: its envelope falls by e every Q / (pi f) seconds. */
const ringLength = (cutoff: number, q: number) =>
  Math.min(RATE / 2, Math.ceil((14 * RATE * q) / (Math.PI * cutoff)) + 64)

/** The last instant a ring is within `db` of its largest sample, in milliseconds. */
function ringsFor(h: Float32Array, db: number): number {
  const floor = peak(h) * 10 ** (-db / 20)
  let last = 0
  for (let i = 0; i < h.length / 2; i += 1) if (Math.abs(h[i]!) > floor) last = i
  return (last * 1000) / RATE
}

const tap = (result: RenderResult, id: string, channel = 0) =>
  result.taps[id]!.channels_data[channel]!
/** A tap's level over the loop and both channels, in dB against full scale. */
const levelOf = (result: RenderResult, id: string) =>
  gainToDb(Math.sqrt((rms(tap(result, id)) ** 2 + rms(tap(result, id, 1)) ** 2) / 2))
/** A tap's largest sample on either channel, against full scale. */
const topOf = (result: RenderResult, id: string) =>
  Math.max(peak(tap(result, id)), peak(tap(result, id, 1)))

/** The power a spectrum holds from `lo` to `hi` hertz, in dB: its bins added. */
function band(spectrum: Float32Array, lo: number, hi: number): number {
  let sum = 0
  for (let k = Math.ceil(lo / BIN); k <= Math.floor(hi / BIN); k += 1)
    sum += 10 ** (spectrum[k]! / 10)
  return 10 * Math.log10(Math.max(sum, 1e-20))
}

/**
 * How much more of a band of frequencies there is in a tap of the lab's last render than in
 * the sound that went in, in dB: the band's power in the average spectrum of each, over the loop.
 */
const bandOver = (filter: Lab, lo: number, hi: number, of = 'out') =>
  band(filter.spectrum(of), lo, hi) - band(filter.spectrum('in'), lo, hi)

/** How far a control tap travels over the loop, up and down added together, from one of its points to the next. */
function travelled(x: Float32Array): number {
  let way = 0
  for (let i = 1; i < x.length; i += 1) way += Math.abs(x[i]! - x[i - 1]!)
  return way
}

/** The cutoff at which the late loop's ring first runs away, in hertz, by halving a span of them. */
function runsAwayAt(filter: Lab, resonance: number, from: number, to: number): number {
  let [lo, hi] = [from, to]
  for (let step = 0; step < 16; step += 1) {
    const mid = (lo + hi) / 2
    // Under the limit its ring is within 20 dB of the kit's; over it, more than 100 dB above.
    if (filter.render(unitSample(), { cutoff: mid, resonance }).checks.lateOver! > 60) hi = mid
    else lo = mid
  }
  return (lo + hi) / 2
}

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings(NAME)!

/** A named set as its card plays it: on its own source, with `over` laid on its values. */
async function played(filter: Lab, name: string, over: Record<string, number> = {}) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(filter.description, set)
  return filter.render(await benchSource(source!, seconds(4)), { ...values, ...over })
}

/** The lab's ids for the device's parameters, where the two differ. */
const DEVICE_KEY: Record<string, string> = {
  cutoff: 'cutoffHz',
  drive: 'driveDb',
  envAttack: 'envAttackMs',
  envRelease: 'envReleaseMs',
  lfoRate: 'lfoRateHz',
}

// The oscillator's shapes, in the device's order.
const SINE = 0
const SQUARE = 4
const RANDOM_STEPS = 5

describe('the state-variable filter', () => {
  it('is a sound lab on the saw: every tap says something, loops, and answers to every control', async () => {
    const filter = await lab(NAME)
    const saw = await benchSource('saw', seconds(4))
    const result = filter.render(saw, {})
    // The cutoff stands still until the oscillator or the envelope is given an amount.
    expectSoundLab(filter, saw, result, { quiet: ['sweep'] })
  })

  it('builds the filter a piece at a time, and the whole build lands within its bound of the kit’s filter at every step', async () => {
    const filter = await lab(NAME)
    // Resonance, Type and the oscillator each start where their piece changes nothing.
    const turned = { resonance: 4, type: 2, lfoAmount: 50 }
    for (const id of ['saw', 'drums']) {
      expectBuild(filter, await benchSource(id, seconds(4)), turned)
    }
    // The clicks leave the device asleep between them, and with Random steps it draws a new
    // held value on the sample that wakes it. The build has to read the oscillator as the
    // device is about to, on that sample too: read a sample early, it lands above the kit.
    const clicks = await benchSource('clicks', seconds(4))
    for (const values of [
      { resonance: 25, lfoAmount: 100, lfoShape: RANDOM_STEPS, lfoRate: 20 },
      { resonance: 6, lfoAmount: 80, lfoShape: RANDOM_STEPS, lfoRate: 8 },
      { resonance: 25, lfoAmount: 100, lfoShape: SQUARE, lfoRate: 20 },
    ]) {
      const check = filter.render(clicks, values).checks
      expect(check.builtDifference!, JSON.stringify(values)).toBeLessThanOrEqual(check.builtBound!)
    }
  })

  // ── Part 1: why ────────────────────────────────────────────────────────────────────────────

  it('takes 16.2 dB off the band from 2 to 5 kHz of the saw with one pole at 440 Hz (claim one-pole-short), and 31.5 dB with the loop (claim loop-steeper)', async () => {
    const filter = await lab(NAME)
    await played(filter, 'onepole')
    expectWritten(-bandOver(filter, 2000, 5000, 'onePole'), '16.2 dB')
    await played(filter, 'loop')
    expectWritten(-bandOver(filter, 2000, 5000, 'low'), '31.5 dB')
  })

  it('falls 5.8 dB between 1 and 2 kHz through the kit’s one-pole with the cutoff at 250 Hz (claim one-pole-slope)', async () => {
    const filter = await lab(NAME)
    const one = tap(filter.render(unitSample(), { cutoff: 250 }), 'onePole')
    expectWritten(levelDb(one, 1000) - levelDb(one, 2000), '5.8 dB')
  })

  it('brings the saw’s harmonic at 440 Hz out 12.0 dB up with the cutoff on it and Resonance at 4 (claim sing-harmonic)', async () => {
    const filter = await lab(NAME)
    const result = await played(filter, 'sing')
    const [out, into] = [tap(result, 'low'), tap(result, 'in')]
    // The whole loop holds a whole number of cycles of 440 Hz, so the sum is that harmonic alone.
    expectWritten(levelDb(out, 440, out.length) - levelDb(into, 440, into.length), '12.0 dB')
  })

  // ── The kit's filter ───────────────────────────────────────────────────────────────────────

  it('adds low, k times band and high back to the input, more than 130 dB under it (claim sum-is-input)', async () => {
    const filter = await lab(NAME)
    for (const id of ['noise', 'saw', 'drums']) {
      const source = await benchSource(id, seconds(4))
      expectWritten(-filter.render(source, {}).checks.sum!, 'more than 130 dB')
    }
    // And with everything against it: the highest Q, the cutoff jumping six octaves at 20 Hz.
    const noise = await benchSource('noise', seconds(4))
    const hard = { resonance: 25, lfoAmount: 100, lfoShape: SQUARE, lfoRate: 20 }
    expectWritten(-filter.render(noise, hard).checks.sum!, 'more than 130 dB')
    // The taps themselves say the same: band is already band times k.
    const taps = filter.render(noise, { resonance: 4 }).taps
    const [low, band, high] = ['low', 'band', 'high'].map((id) => taps[id]!.channels_data[0]!)
    const left = taps.in!.channels_data[0]!
    // Skip the 20 ms where the loop's wrap is crossfaded: a blend of two passes is not one filter.
    let worst = 0
    for (let i = 960; i < left.length; i += 1)
      worst = Math.max(worst, Math.abs(low![i]! + band![i]! + high![i]! - left[i]!))
    expect(worst).toBeLessThan(1e-6)
  })

  it('rises 12.0 dB an octave below the cutoff on the high-pass, from 125 to 250 Hz with the cutoff at 1 kHz (claim high-slope)', async () => {
    const filter = await lab(NAME)
    const high = tap(filter.render(unitSample(), { cutoff: 1000 }), 'high')
    // From 125 to 250 Hz, two octaves and more under a cutoff of 1 kHz.
    expectWritten(levelDb(high, 250) - levelDb(high, 125), '12.0 dB')
  })

  it('falls 12.1 dB between 1 and 2 kHz on the low-pass with the cutoff at 250 Hz (claim low-slope)', async () => {
    const filter = await lab(NAME)
    const low = tap(filter.render(unitSample(), { cutoff: 250 }), 'low')
    expectWritten(levelDb(low, 1000) - levelDb(low, 2000), '12.1 dB')
  })

  it('loses 6.0 dB an octave either side of the cutoff on the band-pass, from 1 to 2 kHz above a cutoff of 250 Hz and from 31.25 to 62.5 Hz below it (claim band-slope)', async () => {
    const filter = await lab(NAME)
    const band = tap(filter.render(unitSample(), { cutoff: 250 }), 'band')
    expectWritten(levelDb(band, 1000) - levelDb(band, 2000), '6.0 dB')
    expectWritten(levelDb(band, 62.5) - levelDb(band, 31.25), '6.0 dB')
  })

  it('measures the three responses the formulas give, within 0.01 dB, at six settings from a cutoff of 100 Hz to one of 16 kHz (claim formula)', async () => {
    const filter = await lab(NAME)
    const tried = [
      {},
      { cutoff: 100, resonance: 4 },
      { cutoff: 250 },
      { cutoff: 1000, resonance: 10 },
      { cutoff: 8000, resonance: 4 },
      { cutoff: 16000, resonance: 2 },
    ]
    for (const values of tried)
      expectWritten(filter.render(unitSample(), values).checks.formula!, 'less than 0.01 dB')
  })

  it('peaks the band-pass within 0.01 % of the cutoff, from 100 Hz to 16 kHz (claim band-peak)', async () => {
    const filter = await lab(NAME)
    for (const cutoff of [100, 1000, 8000, 16000]) {
      for (const resonance of [0.7071, 4, 10]) {
        const band = tap(filter.render(unitSample(), { cutoff, resonance }), 'band')
        const count = ringLength(cutoff, resonance)
        const at = peakHz(band, cutoff / 1.4, Math.min(23000, cutoff * 1.4), count)
        expectWritten(100 * Math.abs(at / cutoff - 1), 'less than 0.01 %')
      }
    }
  })

  it('passes the cutoff at −3.01 dB on the low-pass and the high-pass at a Q of 0.7071 (claim minus-3)', async () => {
    const filter = await lab(NAME)
    const result = filter.render(unitSample(), { cutoff: 1000, resonance: 0.7071 })
    expectWritten(levelDb(tap(result, 'low'), 1000), '−3.01 dB')
    expectWritten(levelDb(tap(result, 'high'), 1000), '−3.01 dB')
    // And the band-pass, scaled by k, passes it whole.
    expectWritten(levelDb(tap(result, 'band'), 1000), '0.00 dB')
  })

  it('is 12.4 dB down at 2 kHz, an octave past a cutoff of 1 kHz, on the kit’s low-pass (claim octave-on)', async () => {
    const filter = await lab(NAME)
    const low = tap(filter.render(unitSample(), { cutoff: 1000 }), 'low')
    expectWritten(-levelDb(low, 2000), '12.4 dB')
  })

  it('answers each step of the saw with one short pulse on the band output, one that lasts longer with the cutoff lower: what the picture of stage 2 says', async () => {
    const filter = await lab(NAME)
    const saw = await benchSource('saw', seconds(4))
    // The stretch the picture draws: three hundredths of a second from 1 s.
    const drawn = (cutoff: number) =>
      tap(filter.render(saw, { cutoff }), 'band').subarray(RATE, RATE + 0.03 * RATE)
    /** The share of the stretch on which the band output is over a fifth of its largest sample. */
    const share = (x: Float32Array) =>
      x.filter((v) => Math.abs(v) > 0.2 * peak(x)).length / x.length
    const at1k = drawn(1000)
    // A pulse and no ring: over a fifth of its size the band output is all on one side of zero.
    const sides = new Set([...at1k].filter((v) => Math.abs(v) > 0.2 * peak(at1k)).map(Math.sign))
    expect(sides.size).toBe(1)
    expect(share(at1k)).toBeLessThan(0.1)
    expect(share(drawn(500))).toBeGreaterThan(1.8 * share(at1k))
    expect(share(drawn(250))).toBeGreaterThan(1.8 * share(drawn(500)))
  })

  it('draws the three close-up curves almost on each other at 1 kHz, and at 8 kHz the late loop to the right of the cutoff and higher than the kit’s: what the pictures of stage 2 say', async () => {
    const filter = await lab(NAME)
    const curves = (cutoff: number) => {
      const taps = filter.render(unitSample(), { cutoff }).taps
      return [taps.tuned!, taps.plainTuned!, taps.lateTuned!] as const
    }
    const [kit, plain, late] = curves(1000).map((one) => one.channels_data[0]!)
    let apart = 0
    for (let i = 0; i < kit!.length; i += 1) {
      apart = Math.max(apart, Math.abs(plain![i]! - kit![i]!), Math.abs(late![i]! - kit![i]!))
    }
    // Under half a decibel, on a picture 42 dB tall.
    expect(apart).toBeLessThan(0.5)
    const [kit8, plain8, late8] = curves(8000)
    expect(curvePeak(plain8)).toBeLessThan(0.95)
    expect(curvePeak(late8)).toBeGreaterThan(1.1)
    expect(largest(late8.channels_data[0]!) - largest(kit8.channels_data[0]!)).toBeGreaterThan(1)
  })

  it('lands 7.9 % flat, at 7.37 kHz, when asked for 8 kHz with the tangent left out (claim no-tangent)', async () => {
    const filter = await lab(NAME)
    // The close-up is measured at a Q of 4 whatever the resonance is set to.
    const taps = filter.render(unitSample(), { cutoff: 8000 }).taps
    const at = curvePeak(taps.plainTuned!)
    expectWritten(100 * (1 - at), '7.9 %')
    expectWritten(at * 8, '7.37 kHz')
    // The kit's own curve, read the same way, is on the cutoff.
    expect(Math.abs(curvePeak(taps.tuned!) - 1)).toBeLessThan(0.001)
  })

  it('peaks the late loop 4.9 % sharp at 4 kHz and a Q of 4 (claim late-sharp-4k)', async () => {
    const filter = await lab(NAME)
    const at = curvePeak(filter.render(unitSample(), { cutoff: 4000 }).taps.lateTuned!)
    expectWritten(100 * (at - 1), '4.9 %')
  })

  it('peaks the late loop 15 % sharp at 8 kHz and a Q of 4 (claim late-sharp-8k)', async () => {
    const filter = await lab(NAME)
    const at = curvePeak(filter.render(unitSample(), { cutoff: 8000 }).taps.lateTuned!)
    expectWritten(100 * (at - 1), '15 %')
  })

  it('has gain Q at the cutoff: +12.04 dB at a Q of 4 and +20.00 dB at 10 (claim peak-is-q)', async () => {
    const filter = await lab(NAME)
    for (const [resonance, written] of [
      [4, '+12.04 dB'],
      [10, '+20.00 dB'],
    ] as const) {
      const result = filter.render(unitSample(), { cutoff: 1000, resonance })
      expectWritten(levelDb(tap(result, 'low'), 1000), written)
      expectWritten(levelDb(tap(result, 'high'), 1000), written)
    }
  })

  it('peaks the low-pass 1.6 % under a cutoff of 1 kHz at a Q of 4 (claim low-peak-under) and 6.4 % under at 2 (claim low-peak-q2)', async () => {
    const filter = await lab(NAME)
    const under = (resonance: number) => {
      const low = tap(filter.render(unitSample(), { cutoff: 1000, resonance }), 'low')
      return 100 * (1 - peakHz(low, 700, 1300, ringLength(1000, resonance)) / 1000)
    }
    expectWritten(under(4), '1.6 %')
    expectWritten(under(2), '6.4 %')
  })

  it('rings 27 dB down after Q cycles, with the cutoff at 1 kHz (claim ring-27)', async () => {
    const filter = await lab(NAME)
    // 1 kHz is 48 samples a cycle. The largest sample of the first cycle against the largest of
    // the cycle that starts Q cycles later.
    for (const resonance of [5, 10, 20]) {
      const low = tap(filter.render(unitSample(), { cutoff: 1000, resonance }), 'low')
      const later = 48 * resonance
      const down = gainToDb(peak(low.subarray(later, later + 48)) / peak(low.subarray(0, 48)))
      expectWritten(-down, '27 dB')
    }
  })

  it('is 60 dB under its largest sample in 1.8 ms at a Q of 0.7071 (claim ring-flat) and after 22 cycles at 10 (claim ring-60)', async () => {
    const filter = await lab(NAME)
    const ring = (resonance: number) =>
      ringsFor(tap(filter.render(unitSample(), { cutoff: 1000, resonance }), 'low'), 60)
    expectWritten(ring(0.7071), '1.8 ms')
    // At 1 kHz a millisecond is a cycle.
    expectWritten(ring(10), '22 cycles')
  })

  it('runs the late loop away once the cutoff passes 7.9 kHz at a Q of 0.7071 (claim late-blows-up)', async () => {
    const filter = await lab(NAME)
    expectWritten(runsAwayAt(filter, 0.7071, 5000, 12000) / 1000, '7.9 kHz')
    const over = (cutoff: number) =>
      filter.render(unitSample(), { cutoff, resonance: 0.7071 }).checks.lateOver!
    // Under the limit its ring is within 20 dB of the kit's; over it, more than 100 dB above.
    expect(over(7800)).toBeLessThan(20)
    expect(over(8000)).toBeGreaterThan(100)
  })

  it('holds the late loop until 13.5 kHz at a Q of 4 (claim late-limit-q4)', async () => {
    const filter = await lab(NAME)
    expectWritten(runsAwayAt(filter, 4, 9000, 18000) / 1000, '13.5 kHz')
  })

  it('answers a unit sample with nothing larger than the sample on each of its three outputs, at every setting tried, cutoffs from 20 Hz to 20 kHz and Q from 0.5 to 25 (claim kit-stable)', async () => {
    const filter = await lab(NAME)
    for (const cutoff of [20, 100, 1000, 8000, 12000, 16000, 20000]) {
      for (const resonance of [0.5, 0.7071, 4, 25]) {
        // Long enough for the slowest ring to be gone before the loop comes round.
        const source = click(seconds(cutoff < 100 ? 8 : 2))
        const result = filter.render(source, { cutoff, resonance })
        for (const id of ['low', 'band', 'high']) {
          expect(peak(tap(result, id))).toBeLessThanOrEqual(1 + 1e-6)
        }
        expectWritten(-result.checks.sum!, 'more than 130 dB')
      }
    }
  })

  it('is the same filter as the direct form while the cutoff stands still, to more than 100 dB (claim direct-still)', async () => {
    const filter = await lab(NAME)
    for (const id of ['noise', 'saw', 'drums']) {
      const source = await benchSource(id, seconds(4))
      expectWritten(-filter.render(source, {}).checks.directApart!, 'more than 100 dB')
    }
  })

  it('stays within 0.1 dB of the largest sample going in when the cutoff jumps (claim svf-holds) where the direct form goes 27 dB above (claim direct-jump)', async () => {
    const filter = await lab(NAME)
    const noise = await benchSource('noise', seconds(4))
    const result = filter.render(noise, { lfoAmount: 100, lfoShape: SQUARE, lfoRate: 20 })
    const kit = largest(tap(result, 'svfLevel'))
    const direct = largest(tap(result, 'directLevel'))
    expectWritten(Math.abs(kit - gainToDb(peak(noise.left))), 'less than 0.1 dB')
    expectWritten(direct - kit, '27 dB')
    // The device, on the same jumps, keeps its output at the input's size too.
    expect(peak(tap(result, 'out'))).toBeLessThan(1.05 * peak(noise.left))
  })

  it('reaches the same peaks as the direct form on a smooth sweep at 20 Hz, 29 dB apart (claim direct-smooth)', async () => {
    const filter = await lab(NAME)
    const noise = await benchSource('noise', seconds(4))
    const result = filter.render(noise, { lfoAmount: 100, lfoShape: SINE, lfoRate: 20 })
    const kit = largest(tap(result, 'svfLevel'))
    const direct = largest(tap(result, 'directLevel'))
    expect(Math.abs(direct - kit)).toBeLessThan(0.1)
    expectWritten(-result.checks.directApart!, '29 dB')
  })

  it('cuts a cutoff of 1 kHz by more than 100 dB with the notch (claim notch-depth)', async () => {
    const filter = await lab(NAME)
    for (const resonance of [0.7071, 3, 10]) {
      const notch = tap(filter.render(unitSample(), { cutoff: 1000, resonance }), 'notch')
      expectWritten(-levelDb(notch, 1000), 'more than 100 dB')
      // Far from the cutoff the notch leaves the sound alone.
      expect(Math.abs(levelDb(notch, 50))).toBeLessThan(0.1)
      expect(Math.abs(levelDb(notch, 15000))).toBeLessThan(0.1)
    }
  })

  it('takes 2.8 dB off an octave under the cutoff, at 500 Hz, with the notch at a Q of 0.7071, and 0.2 dB at 3 (claim notch-width)', async () => {
    const filter = await lab(NAME)
    const octaveUnder = (resonance: number) =>
      levelDb(tap(filter.render(unitSample(), { cutoff: 1000, resonance }), 'notch'), 500)
    expectWritten(-octaveUnder(0.7071), '2.8 dB')
    expectWritten(-octaveUnder(3), '0.2 dB')
  })

  it('lifts a cutoff of 1 kHz by 2Q with the peak: +15.6 dB at a Q of 3 (claim peak-2q)', async () => {
    const filter = await lab(NAME)
    const lifted = tap(filter.render(unitSample(), { cutoff: 1000, resonance: 3 }), 'peak')
    expectWritten(levelDb(lifted, 1000), '+15.6 dB')
    expect(levelDb(lifted, 1000)).toBeCloseTo(20 * Math.log10(6), 1)
    expect(Math.abs(levelDb(lifted, 50))).toBeLessThan(0.2)
    expect(Math.abs(levelDb(lifted, 15000))).toBeLessThan(0.2)
  })

  // ── The device ─────────────────────────────────────────────────────────────────────────────

  it("reads its floor, −140 dB, between the device's own stage and the kit's with the cutoff at 1 kHz: more than 140 dB under (claim same-stage)", async () => {
    const filter = await lab(NAME)
    const noise = await benchSource('noise', seconds(4))
    // The floor is what the check reads for any difference 140 dB under the sound or further.
    expect(filter.render(noise, {}).checks.sameStage!).toBe(-140)
    expectWritten(filter.render(noise, {}).checks.sameStage!, '−140 dB')
  })

  it("finds the difference between the device's stage and the kit's 82 dB under the kit's three outputs at 8 kHz and a Q of 4, on the noise (claim same-stage-8k), and the tangent alone accounts for it", async () => {
    const filter = await lab(NAME)
    const noise = await benchSource('noise', seconds(4))
    expectWritten(-filter.render(noise, { cutoff: 8000, resonance: 4 }).checks.sameStage!, '82 dB')
    // The kit's loop written out here in a sample's own arithmetic, once with the kit's short
    // tangent and once with the library's, and nothing else changed between the two.
    const f = Math.fround
    const loop = (g: number, k: number, x: Float32Array) => {
      const a1 = f(1 / f(1 + f(g * f(g + k))))
      const a2 = f(g * a1)
      const a3 = f(g * a2)
      const out = new Float32Array(3 * x.length)
      let [ic1, ic2] = [0, 0]
      for (let i = 0; i < x.length; i += 1) {
        const v3 = f(x[i]! - ic2)
        const v1 = f(f(a1 * ic1) + f(a2 * v3))
        const v2 = f(f(ic2 + f(a2 * ic1)) + f(a3 * v3))
        ic1 = f(f(2 * v1) - ic1)
        ic2 = f(f(2 * v2) - ic2)
        out[3 * i] = v2
        out[3 * i + 1] = v1
        out[3 * i + 2] = f(f(x[i]! - f(k * v1)) - v2)
      }
      return out
    }
    const angle = f(f(f(Math.PI) * 8000) / RATE)
    const squared = f(angle * angle)
    const short = f(f(angle * f(15 - squared)) / f(15 - f(6 * squared)))
    const k = f(1 / 4)
    const withLibrary = loop(f(Math.tan(angle)), k, noise.left)
    const withShort = loop(short, k, noise.left)
    expectWritten(-differenceDb(withLibrary, withShort), '82 dB')
  })

  it('is 31 samples late through the device (claim latency)', async () => {
    const filter = await lab(NAME)
    // A high-pass at 20 Hz lets the unit sample through whole: it comes out where the delay puts it.
    const out = tap(filter.render(unitSample(), { type: 1, cutoff: 20 }), 'out')
    let at = 0
    for (let i = 0; i < 4800; i += 1) if (Math.abs(out[i]!) > Math.abs(out[at]!)) at = i
    expectWritten(at, '31 samples')
    expect(at).toBe(31)
    // The converters keep what is under 20 kHz, so the sample comes out a little rounded.
    expect(out[at]).toBeGreaterThan(0.95)
  })

  it('hands the input on 31 samples late and otherwise whole with Mix at 0, to more than 120 dB (claim mix-dry)', async () => {
    const filter = await lab(NAME)
    const drums = await benchSource('drums', seconds(4))
    const result = filter.render(drums, { mix: 0, resonance: 10 })
    const [out, into] = [tap(result, 'out'), tap(result, 'in')]
    // The taps are a loop, so the input 31 samples late is the input turned round by 31.
    const late = new Float32Array(into.length)
    for (let i = 0; i < into.length; i += 1) late[(i + 31) % into.length] = into[i]!
    expectWritten(-differenceDb(out, late), 'more than 120 dB')
  })

  it('reads −54.8 dB at 20 kHz through the device and −70.2 dB through one stage at 48 kHz, for a 1 kHz low-pass (claim device-top)', async () => {
    const filter = await lab(NAME)
    const result = filter.render(unitSample(), { cutoff: 1000 })
    expectWritten(levelDb(tap(result, 'out'), 20000), '−54.8 dB')
    expectWritten(levelDb(tap(result, 'low'), 20000), '−70.2 dB')
    // The curves the page draws say the same at their last point, which is 20 kHz.
    expectWritten(tap(result, 'deviceResponse').at(-1)!, '−54.8 dB')
    expectWritten(tap(result, 'oneStageResponse').at(-1)!, '−70.2 dB')
  })

  it('keeps the gain at a cutoff of 1 kHz at Q on either slope: +20.0 dB at a Q of 10 (claim q-both-slopes)', async () => {
    const filter = await lab(NAME)
    for (const slope of [0, 1]) {
      const out = tap(filter.render(unitSample(), { cutoff: 1000, resonance: 10, slope }), 'out')
      expectWritten(levelDb(out, 1000), '+20.0 dB')
    }
  })

  it('falls 24.3 dB between 1 and 2 kHz through two stages, Slope at 24 dB, with the cutoff at 250 Hz (claim slope-24)', async () => {
    const filter = await lab(NAME)
    const out = tap(filter.render(unitSample(), { cutoff: 250, slope: 1 }), 'out')
    expectWritten(levelDb(out, 1000) - levelDb(out, 2000), '24.3 dB')
    // One stage of the device, the same way: 12 dB.
    const one = tap(filter.render(unitSample(), { cutoff: 250, slope: 0 }), 'out')
    expect(levelDb(one, 1000) - levelDb(one, 2000)).toBeCloseTo(12.04, 1)
  })

  it("makes the band-pass, the notch and the peak from the device's own stage: 0.0 dB, more than 100 dB down and +15.6 dB at a cutoff of 1 kHz at a Q of 3 (claim device-types)", async () => {
    const filter = await lab(NAME)
    const atCutoff = (type: number) =>
      levelDb(tap(filter.render(unitSample(), { cutoff: 1000, resonance: 3, type }), 'out'), 1000)
    expectWritten(atCutoff(2), '0.0 dB')
    expectWritten(-atCutoff(3), 'more than 100 dB')
    expectWritten(atCutoff(4), '+15.6 dB')
    // And the two plain ones: Q at the cutoff.
    expect(atCutoff(0)).toBeCloseTo(20 * Math.log10(3), 1)
    expect(atCutoff(1)).toBeCloseTo(20 * Math.log10(3), 1)
  })

  it('falls 13.3 dB between 4 and 8 kHz at 48 kHz with the cutoff at 1 kHz: the top octave bends (claim warp-slope)', async () => {
    const filter = await lab(NAME)
    const low = tap(filter.render(unitSample(), { cutoff: 1000 }), 'low')
    expectWritten(levelDb(low, 4000) - levelDb(low, 8000), '13.3 dB')
  })

  it('passes a tone on the cutoff 28.0 dB up at a Q of 25 (claim gain-q)', async () => {
    const filter = await lab(NAME)
    const tone = sine(440, 0.1, seconds(2))
    const result = filter.render(tone, { cutoff: 440, resonance: 25 })
    for (const id of ['low', 'out']) {
      expectWritten(gainToDb(rms(tap(result, id)) / rms(tone.left)), '28.0 dB')
    }
  })

  it('holds a full-scale tone on the cutoff at a Q of 25 to 0.24 of full scale with 6 dB of drive, where without it the tone comes out at 25 times full scale (claim drive-caps)', async () => {
    const filter = await lab(NAME)
    const tone = sine(440, 1, seconds(2))
    const values = { cutoff: 440, resonance: 25 }
    // With no drive the device, like the kit's filter, puts out 25 times full scale.
    const plain = filter.render(tone, values)
    expectWritten(peak(tap(plain, 'out')), '25.0')
    expectWritten(peak(tap(plain, 'low')), '25.0')
    expectWritten(peak(tap(filter.render(tone, { ...values, drive: 6 }), 'out')), '0.24')
  })

  it('opens the cutoff 1.56 octaves on the loudest hit of the drums with Envelope amount at 100, five times the envelope’s 0.311 (claim env-opens)', async () => {
    const filter = await lab(NAME)
    const drums = await benchSource('drums', seconds(4))
    const result = filter.render(drums, { envAmount: 100 })
    const opened = range(tap(result, 'sweep')).hi
    const envelope = range(tap(result, 'envelope')).hi
    expectWritten(opened, '1.56 octaves')
    expectWritten(envelope, '0.311')
    expect(opened).toBeCloseTo(5 * envelope, 3)
    // The envelope is read before Drive: with Drive at its highest it is the same line.
    const driven = filter.render(drums, { envAmount: 100, drive: 24 })
    expect([...tap(driven, 'envelope')]).toEqual([...tap(result, 'envelope')])
    // On the saw, whose size does not change, it lies level.
    const saw = await benchSource('saw', seconds(4))
    const level = tap(filter.render(saw, {}), 'envelope')
    expect(range(level.subarray(level.length / 4)).span).toBeLessThan(0.01)
  })

  it('swings the cutoff 3.00 octaves each way with Oscillator amount at 100 (claim osc-swing)', async () => {
    const filter = await lab(NAME)
    const saw = await benchSource('saw', seconds(4))
    const swing = range(tap(filter.render(saw, { lfoAmount: 100 }), 'sweep'))
    expectWritten(swing.hi, '3.00 octaves')
    expectWritten(-swing.lo, '3.00 octaves')
  })

  it('passes a cutoff of 1 kHz at −6.0 dB through two one-poles in a row, whatever Resonance is (claim two-poles)', async () => {
    const filter = await lab(NAME)
    const flat = filter.render(unitSample(), { cutoff: 1000 }).taps.twoPoleResponse!
    expectWritten(curveAt(flat, 1000), '−6.0 dB')
    const sharp = filter.render(unitSample(), { cutoff: 1000, resonance: 25 }).taps
    // Resonance has nothing in two one-poles to move: the curve is the same one, and nowhere over 0 dB.
    expect([...sharp.twoPoleResponse!.channels_data[0]!]).toEqual([...flat.channels_data[0]!])
    expect(largest(flat.channels_data[0]!)).toBeLessThanOrEqual(0)
    // The loop on the same cutoff, at the same setting, is 28 dB up there.
    expect(largest(sharp.lowResponse!.channels_data[0]!)).toBeGreaterThan(27)
  })

  // ── Part 4: the build, a piece at a time ───────────────────────────────────────────────────

  /** How far a unit sample through the build so far falls between 1 and 2 kHz, with the cutoff at 250 Hz. */
  const builtFall = (filter: Lab, build: number) => {
    const built = tap(filter.render(unitSample(), { cutoff: 250, build }), 'built')
    return levelDb(built, 1000) - levelDb(built, 2000)
  }
  /** The level of the build so far at one frequency, with the cutoff at 1 kHz. */
  const builtAt = (filter: Lab, hz: number, values: Record<string, number>) =>
    levelDb(tap(filter.render(unitSample(), { cutoff: 1000, ...values }), 'built'), hz)

  it('puts a tone at 2 kHz out 5.9 dB under a tone at 1 kHz with one integrator and the cutoff at 250 Hz (claim build-one)', async () => {
    const filter = await lab(NAME)
    expectWritten(builtFall(filter, 0), '5.9 dB')
    // The first step has no step before it. The next one moves the number.
    expect(matchesWritten(builtFall(filter, 1), '5.9 dB')).toBe(false)
  })

  it('puts a tone at 2 kHz out 12.1 dB under a tone at 1 kHz with the second integrator and the cutoff at 250 Hz (claim build-two), and not without it', async () => {
    const filter = await lab(NAME)
    expectWritten(builtFall(filter, 1), '12.1 dB')
    expect(matchesWritten(builtFall(filter, 0), '12.1 dB')).toBe(false)
  })

  it('passes a cutoff of 1 kHz at +12.04 dB with Resonance at 4 once the brake is Resonance (claim build-brake), and at −3.01 dB before', async () => {
    const filter = await lab(NAME)
    expectWritten(builtAt(filter, 1000, { resonance: 4, build: 2 }), '+12.04 dB')
    const before = builtAt(filter, 1000, { resonance: 4, build: 1 })
    expect(matchesWritten(before, '+12.04 dB')).toBe(false)
    expectWritten(before, '−3.01 dB')
  })

  it('brings a tone at 250 Hz out 24.1 dB down with Type at High-pass and the cutoff at 1 kHz once the outputs are there (claim build-outputs), and not before', async () => {
    const filter = await lab(NAME)
    expectWritten(-builtAt(filter, 250, { type: 1, build: 3 }), '24.1 dB')
    // One step back Type does nothing yet: the build plays its low-pass, and 250 Hz passes.
    const before = -builtAt(filter, 250, { type: 1, build: 2 })
    expect(matchesWritten(before, '24.1 dB')).toBe(false)
    expect(before).toBeLessThan(0.1)
  })

  it('moves the build’s cutoff 3.00 octaves each way with Oscillator amount at 100 at the last step (claim build-moves), and not at all one step back', async () => {
    const filter = await lab(NAME)
    const saw = await benchSource('saw', seconds(4))
    const swing = (build: number) =>
      range(tap(filter.render(saw, { lfoAmount: 100, build }), 'builtCutoff'))
    expectWritten(swing(4).hi, '3.00 octaves')
    expectWritten(-swing(4).lo, '3.00 octaves')
    expect(matchesWritten(swing(3).hi, '3.00 octaves')).toBe(false)
    expect(swing(3).span).toBe(0)
  })

  it('lands the whole build more than 120 dB under the kit’s filter at the starting values, on the saw, the drums, the bass and the noise (claim build-same)', async () => {
    const filter = await lab(NAME)
    for (const id of ['saw', 'drums', 'noise', 'bass']) {
      const source = await benchSource(id, seconds(4))
      expectWritten(-filter.render(source, {}).checks.builtDifference!, 'more than 120 dB')
    }
  })

  it('lands the build 76 dB under the kit’s filter on the drums with the cutoff at 59 Hz and Resonance at 25 (claim build-worst)', async () => {
    const filter = await lab(NAME)
    const drums = await benchSource('drums', seconds(4))
    expectWritten(
      -filter.render(drums, { cutoff: 59, resonance: 25 }).checks.builtDifference!,
      '76 dB',
    )
  })

  it('finds the build nearest the kit’s filter, 74 dB under, on a tone at 60 Hz with the cutoff on it and Resonance at 25, among the cutoffs from 20 to 130 Hz, and nowhere nearer than the bound of 70 dB (claim build-bound)', async () => {
    const filter = await lab(NAME)
    const on = (hz: number) =>
      filter.render(sine(hz, 0.5, seconds(2)), { cutoff: hz, resonance: 25 }).checks
        .builtDifference!
    const worst = on(60)
    expectWritten(-worst, '74 dB')
    expect(filter.render(sine(60, 0.5, seconds(2)), {}).checks.builtBound).toBe(-70)
    // Tones on other cutoffs of the span, and the settings that move the cutoff furthest and
    // fastest, all lie under it.
    for (const hz of [20, 30, 45, 55, 58, 59, 61, 65, 80, 100, 130]) {
      expect(on(hz), `a tone at ${hz} Hz`).toBeLessThan(worst)
    }
    const drums = await benchSource('drums', seconds(4))
    const noise = await benchSource('noise', seconds(4))
    for (const [source, values] of [
      [drums, { cutoff: 20, resonance: 25 }],
      [noise, { cutoff: 20, resonance: 25 }],
      [noise, { resonance: 25, lfoAmount: 100, lfoShape: SQUARE, lfoRate: 20 }],
      [noise, { cutoff: 59, resonance: 25, lfoAmount: 100, lfoShape: RANDOM_STEPS, lfoRate: 20 }],
      [drums, { cutoff: 20000, resonance: 25, envAmount: -100 }],
      [drums, { cutoff: 59, resonance: 25, envAmount: 100 }],
    ] as const) {
      expect(
        filter.render(source, values).checks.builtDifference!,
        JSON.stringify(values),
      ).toBeLessThan(worst)
    }
  })

  // ── The cards ──────────────────────────────────────────────────────────────────────────────

  it('renders every named set on its own source, finite, heard, and with its loudest sample under full scale', async () => {
    const filter = await lab(NAME)
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = await played(filter, name)
      const sound = set.tap ?? 'out'
      expect(
        tap(result, sound).every((v) => Number.isFinite(v)),
        name,
      ).toBe(true)
      // The clicks are one sample a second: a filter's answer to them is quiet over the loop.
      expect(levelOf(result, sound), `${name} is heard`).toBeGreaterThan(
        name === 'ping' ? -50 : -36,
      )
      expect(topOf(result, sound), `${name} fits`).toBeLessThan(1)
    }
  })

  it('takes 43 dB off the band from 2 to 5 kHz of the saw with the low-pass at 700 Hz and 24 dB (claim use-dark)', async () => {
    const filter = await lab(NAME)
    await played(filter, 'dark')
    expectWritten(-bandOver(filter, 2000, 5000), '43 dB')
  })

  it('opens the cutoff as far as 0.9 octaves on the bass line’s loudest note (claim use-pluck)', async () => {
    const filter = await lab(NAME)
    expectWritten(range(tap(await played(filter, 'pluck'), 'sweep')).hi, '0.9 octaves')
  })

  it('sweeps the cutoff 2.1 octaves each way under the held chords (claim use-drift)', async () => {
    const filter = await lab(NAME)
    const swing = range(tap(await played(filter, 'drift'), 'sweep'))
    expectWritten(swing.hi, '2.1 octaves')
    expectWritten(-swing.lo, '2.1 octaves')
  })

  it('brings what the mix holds from 1 to 12 kHz out 52 dB down and what it holds from 20 to 300 Hz out 0.4 dB up (claim use-wall)', async () => {
    const filter = await lab(NAME)
    await played(filter, 'wall')
    expectWritten(-bandOver(filter, 1000, 12000), '52 dB')
    expectWritten(bandOver(filter, 20, 300), '0.4 dB')
  })

  it('opens the band-pass as far as 0.7 octaves on the guitar’s loudest note (claim way-wah)', async () => {
    const filter = await lab(NAME)
    expectWritten(range(tap(await played(filter, 'wah'), 'sweep')).hi, '0.7 octaves')
  })

  it('says what the slow sweep and the moving hole do, on the saw and on the noise: the cutoff is highest at 1 s and lowest at 3 s, and the notch takes out the sound where it stands and not an octave off', async () => {
    const filter = await lab(NAME)
    /** The moments, in seconds, at which a line over the loop is highest and lowest. */
    const turns = (x: Float32Array) => {
      let [hi, lo] = [0, 0]
      for (let i = 1; i < x.length; i += 1) {
        if (x[i]! > x[hi]!) hi = i
        if (x[i]! < x[lo]!) lo = i
      }
      return { hi: (4 * hi) / x.length, lo: (4 * lo) / x.length, most: x[hi]!, least: x[lo]! }
    }
    for (const [name, octaves] of [
      ['slow', 1.5],
      ['hole', 2.7],
    ] as const) {
      const swept = turns(tap(await played(filter, name), 'sweep'))
      expect(swept.hi, name).toBeCloseTo(1, 1)
      expect(swept.lo, name).toBeCloseTo(3, 1)
      expect(swept.most, name).toBeCloseTo(octaves, 2)
      expect(swept.least, name).toBeCloseTo(-octaves, 2)
    }
    // The hole at 1 s, at the top of its climb: a fifth of an octave of the noise round the
    // notch, in the device's output and in the sound that went in 31 samples before.
    const result = await played(filter, 'hole')
    const around = (id: string, late: number) =>
      tap(result, id).subarray(0.98 * RATE + late, 1.02 * RATE + late)
    const held = (x: Float32Array, hz: number) => {
      let sum = 0
      for (let step = -3; step <= 3; step += 1)
        sum += 10 ** (levelDb(x, hz * 2 ** (step / 60), x.length) / 10)
      return 10 * Math.log10(sum)
    }
    const notch = 900 * 2 ** 2.7
    const taken = (hz: number) => held(around('in', 0), hz) - held(around('out', 31), hz)
    expect(taken(notch)).toBeGreaterThan(15)
    expect(taken(notch * 2)).toBeLessThan(3)
  })

  it('falls only part of the way back between the guitar’s notes on the band the playing opens: what the picture of that card says', async () => {
    const filter = await lab(NAME)
    const sweep = tap(await played(filter, 'wah'), 'sweep')
    // After the first note the band never comes back to its setting.
    expect(range(sweep.subarray(sweep.length / 8)).lo).toBeGreaterThan(0.1)
  })

  it('has the high output largest while the cutoff is low and the low output largest while it is high: what the picture of all the stages says', async () => {
    const filter = await lab(NAME)
    const saw = await benchSource('saw', seconds(4))
    // The oscillator at its starting rate, one cycle a second: highest at 0.25 s, lowest at 0.75 s.
    const result = filter.render(saw, { lfoAmount: 100 })
    const round = (id: string, at: number) =>
      rms(tap(result, id).subarray((at - 0.05) * RATE, (at + 0.05) * RATE))
    expect(round('high', 0.75)).toBeGreaterThan(5 * round('high', 0.25))
    expect(round('low', 0.25)).toBeGreaterThan(1.3 * round('low', 0.75))
  })

  it('pushes the cutoff down as far as 0.8 octaves on the loudest hit of the drums with Envelope amount under zero (claim way-duck)', async () => {
    const filter = await lab(NAME)
    expectWritten(-range(tap(await played(filter, 'duck'), 'sweep')).lo, '0.8 octaves')
  })

  it('puts the saw out 7.2 dB louder with Resonance at 10 on its harmonic at 440 Hz (claim fault-howl), and 0.3 dB quieter than it went in with 6 dB of Drive as well (claim fault-tamed)', async () => {
    const filter = await lab(NAME)
    const level = async (name: string) => {
      const result = await played(filter, name)
      return levelOf(result, 'out') - levelOf(result, 'in')
    }
    expectWritten(await level('howl'), '7.2 dB')
    expectWritten(-(await level('tamed')), '0.3 dB')
  })

  it('takes the cutoff 83 octaves up and down over the four seconds of the bass with Envelope release at 10 ms, and 19 octaves at 200 ms (claim fault-chatter)', async () => {
    const filter = await lab(NAME)
    expectWritten(travelled(tap(await played(filter, 'chatter'), 'sweep')), '83 octaves')
    const calm = await played(filter, 'chatter', { envRelease: 200 })
    expectWritten(travelled(tap(calm, 'sweep')), '19 octaves')
  })

  it("starts the page's device table from the device's own defaults: the settings file's defaults are device.json's, and so are the lab's starting values", async () => {
    const filter = await lab(NAME)
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/auto-filter/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const own = Object.fromEntries(device.params.map((one) => [one.key, one.default]))
    const byDeviceKey = (values: Record<string, number>) =>
      Object.fromEntries(
        Object.entries(values)
          .filter(([id]) => id !== 'build')
          .map(([id, value]) => [DEVICE_KEY[id] ?? id, value]),
      )
    // Every parameter of the device is written down, each at the device's default.
    expect(byDeviceKey(settings.defaults!.values)).toEqual(own)
    // Laid over the lab's starting values they change nothing: the lesson starts where the device does.
    const { values } = resolveSet(filter.description, { values: settings.defaults!.values })
    expect(byDeviceKey(values)).toEqual(own)
    for (const control of filter.description.controls) {
      if (control.id === 'build') continue
      expect(control.initial, control.id).toBeCloseTo(own[DEVICE_KEY[control.id] ?? control.id]!, 6)
    }
  })
})
