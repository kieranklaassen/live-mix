import { describe, expect, it } from 'vitest'
import {
  benchSource,
  expectSoundLab,
  gainToDb,
  lab,
  peak,
  rms,
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

const RATE = 48_000
const NAME = '05-state-variable-filter'

/** One unit sample at the start of a loop: what comes out of a stage is its ring. */
function unitSample(frames = seconds(1)): Source {
  const source = silence(frames)
  source.left[0] = 1
  source.right[0] = 1
  return source
}

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

/** Where a curve the lab drew is highest, on its own axis, by a parabola through its top three points. */
function curvePeak(tap: { channels_data: Float32Array[]; x0: number; x1: number }): number {
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

describe('lesson 5: the state-variable filter', () => {
  it('is a sound lab on the noise: every tap says something, loops, and answers to every control', async () => {
    const filter = await lab(NAME)
    const noise = await benchSource('noise', seconds(4))
    const result = filter.render(noise, {})
    // The cutoff stands still until the oscillator or the envelope is given an amount.
    expectSoundLab(filter, noise, result, { quiet: ['sweep'] })
  })

  it('adds low, k times band and high back to the input, more than 130 dB under it (claim sum-is-input)', async () => {
    const filter = await lab(NAME)
    for (const id of ['noise', 'saw', 'drums']) {
      const source = await benchSource(id, seconds(4))
      expect(filter.render(source, {}).checks.sum).toBeLessThan(-130)
    }
    // And with everything against it: the highest Q, the cutoff jumping six octaves at 20 Hz.
    const noise = await benchSource('noise', seconds(4))
    // Shape 2 is the square.
    const hard = { resonance: 25, lfoAmount: 100, lfoShape: 2, lfoRate: 20 }
    expect(filter.render(noise, hard).checks.sum).toBeLessThan(-130)
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

  it('rises 12.0 dB an octave below the cutoff on the high-pass (claim high-slope)', async () => {
    const filter = await lab(NAME)
    const high = filter.render(unitSample(), { cutoff: 1000 }).taps.high!.channels_data[0]!
    const rise = levelDb(high, 250) - levelDb(high, 125)
    expect(rise).toBeGreaterThan(11.95)
    expect(rise).toBeLessThan(12.05)
  })

  it('falls 12.1 dB between 1 and 2 kHz on the low-pass with the cutoff at 250 Hz (claim low-slope)', async () => {
    const filter = await lab(NAME)
    const low = filter.render(unitSample(), { cutoff: 250 }).taps.low!.channels_data[0]!
    const fall = levelDb(low, 1000) - levelDb(low, 2000)
    expect(fall).toBeGreaterThan(12.05)
    expect(fall).toBeLessThan(12.15)
  })

  it('loses 6.0 dB an octave either side of the cutoff on the band-pass (claim band-slope)', async () => {
    const filter = await lab(NAME)
    const band = filter.render(unitSample(), { cutoff: 250 }).taps.band!.channels_data[0]!
    const above = levelDb(band, 1000) - levelDb(band, 2000)
    const below = levelDb(band, 62.5) - levelDb(band, 31.25)
    for (const slope of [above, below]) {
      expect(slope).toBeGreaterThan(5.95)
      expect(slope).toBeLessThan(6.05)
    }
  })

  it('measures the three responses the formulas give, within 0.01 dB (claim formula)', async () => {
    const filter = await lab(NAME)
    const settings = [
      {},
      { cutoff: 100, resonance: 4 },
      { cutoff: 250 },
      { cutoff: 1000, resonance: 10 },
      { cutoff: 8000, resonance: 4 },
      { cutoff: 16000, resonance: 2 },
    ]
    for (const values of settings)
      expect(filter.render(unitSample(), values).checks.formula).toBeLessThan(0.01)
  })

  it('peaks the band-pass within 0.01 % of the cutoff, from 100 Hz to 16 kHz (claim band-peak)', async () => {
    const filter = await lab(NAME)
    for (const cutoff of [100, 1000, 8000, 16000]) {
      for (const resonance of [0.7071, 4, 10]) {
        const band = filter.render(unitSample(), { cutoff, resonance }).taps.band!.channels_data[0]!
        const count = ringLength(cutoff, resonance)
        const at = peakHz(band, cutoff / 1.4, Math.min(23000, cutoff * 1.4), count)
        expect(Math.abs(at / cutoff - 1)).toBeLessThan(1e-4)
      }
    }
  })

  it('passes the cutoff at −3.01 dB on the low-pass and the high-pass at a Q of 0.7071 (claim minus-3)', async () => {
    const filter = await lab(NAME)
    const taps = filter.render(unitSample(), { cutoff: 1000, resonance: 0.7071 }).taps
    expect(levelDb(taps.low!.channels_data[0]!, 1000)).toBeCloseTo(-3.01, 2)
    expect(levelDb(taps.high!.channels_data[0]!, 1000)).toBeCloseTo(-3.01, 2)
    // And the band-pass, scaled by k, passes it whole.
    expect(levelDb(taps.band!.channels_data[0]!, 1000)).toBeCloseTo(0, 2)
  })

  it('lands 7.9 % flat, at 7.37 kHz, when asked for 8 kHz with the tangent left out (claim no-tangent)', async () => {
    const filter = await lab(NAME)
    // The close-up is measured at a Q of 4 whatever the resonance is set to.
    const taps = filter.render(unitSample(), { cutoff: 8000 }).taps
    const at = curvePeak(taps.plainTuned!)
    expect(at).toBeGreaterThan(0.918)
    expect(at).toBeLessThan(0.924)
    expect(at * 8).toBeGreaterThan(7.34)
    expect(at * 8).toBeLessThan(7.4)
    // The kit's own curve, read the same way, is on the cutoff.
    expect(Math.abs(curvePeak(taps.tuned!) - 1)).toBeLessThan(0.001)
  })

  it('peaks the late loop 4.9 % sharp at 4 kHz and a Q of 4 (claim late-sharp-4k)', async () => {
    const filter = await lab(NAME)
    const at = curvePeak(filter.render(unitSample(), { cutoff: 4000 }).taps.lateTuned!)
    expect(at).toBeGreaterThan(1.046)
    expect(at).toBeLessThan(1.052)
  })

  it('peaks the late loop 15 % sharp at 8 kHz and a Q of 4 (claim late-sharp-8k)', async () => {
    const filter = await lab(NAME)
    const at = curvePeak(filter.render(unitSample(), { cutoff: 8000 }).taps.lateTuned!)
    expect(at).toBeGreaterThan(1.14)
    expect(at).toBeLessThan(1.155)
  })

  it('has gain Q at the cutoff: +12.04 dB at a Q of 4 and +20.00 dB at 10 (claim peak-is-q)', async () => {
    const filter = await lab(NAME)
    for (const [resonance, db] of [
      [4, 12.04],
      [10, 20.0],
    ] as const) {
      const taps = filter.render(unitSample(), { cutoff: 1000, resonance }).taps
      expect(levelDb(taps.low!.channels_data[0]!, 1000)).toBeCloseTo(db, 2)
      expect(levelDb(taps.high!.channels_data[0]!, 1000)).toBeCloseTo(db, 2)
    }
  })

  it('peaks the low-pass 1.6 % under the cutoff at a Q of 4 (claim low-peak-under) and 6.5 % under at 2 (claim low-peak-q2)', async () => {
    const filter = await lab(NAME)
    const under = (resonance: number) => {
      const low = filter.render(unitSample(), { cutoff: 1000, resonance }).taps.low!
        .channels_data[0]!
      return 100 * (1 - peakHz(low, 700, 1300, ringLength(1000, resonance)) / 1000)
    }
    expect(under(4)).toBeGreaterThan(1.5)
    expect(under(4)).toBeLessThan(1.7)
    expect(under(2)).toBeGreaterThan(6.3)
    expect(under(2)).toBeLessThan(6.7)
  })

  it('rings 27 dB down after Q cycles (claim ring-27)', async () => {
    const filter = await lab(NAME)
    // 1 kHz is 48 samples a cycle. The largest sample of the first cycle against the largest of
    // the cycle that starts Q cycles later.
    for (const resonance of [5, 10, 20]) {
      const low = filter.render(unitSample(), { cutoff: 1000, resonance }).taps.low!
        .channels_data[0]!
      const later = 48 * resonance
      const down = gainToDb(peak(low.subarray(later, later + 48)) / peak(low.subarray(0, 48)))
      expect(down).toBeGreaterThan(-28.3)
      expect(down).toBeLessThan(-26.3)
    }
  })

  it('is 60 dB under its largest sample in 1.8 ms at a Q of 0.7071 (claim ring-flat) and after 22 cycles at 10 (claim ring-60)', async () => {
    const filter = await lab(NAME)
    const ring = (resonance: number) =>
      ringsFor(
        filter.render(unitSample(), { cutoff: 1000, resonance }).taps.low!.channels_data[0]!,
        60,
      )
    expect(ring(0.7071)).toBeGreaterThan(1.7)
    expect(ring(0.7071)).toBeLessThan(1.9)
    // At 1 kHz a millisecond is a cycle.
    expect(ring(10)).toBeGreaterThan(21.5)
    expect(ring(10)).toBeLessThan(22.5)
  })

  it('runs the late loop away once the cutoff passes 7.9 kHz at a Q of 0.7071 (claim late-blows-up)', async () => {
    const filter = await lab(NAME)
    const over = (cutoff: number) =>
      filter.render(unitSample(), { cutoff, resonance: 0.7071 }).checks.lateOver!
    // Under the limit its ring is within 20 dB of the kit's; over it, more than 100 dB above.
    expect(over(7800)).toBeLessThan(20)
    expect(over(8000)).toBeGreaterThan(100)
  })

  it('holds the late loop until 13.5 kHz at a Q of 4 (claim late-limit-q4)', async () => {
    const filter = await lab(NAME)
    const over = (cutoff: number) =>
      filter.render(unitSample(), { cutoff, resonance: 4 }).checks.lateOver!
    expect(over(13300)).toBeLessThan(20)
    expect(over(13700)).toBeGreaterThan(100)
  })

  it('answers a unit sample with nothing larger than the sample, at any cutoff and any Q (claim kit-stable)', async () => {
    const filter = await lab(NAME)
    for (const cutoff of [20, 100, 1000, 8000, 12000, 16000, 20000]) {
      for (const resonance of [0.5, 0.7071, 4, 25]) {
        // Long enough for the slowest ring to be gone before the loop comes round.
        const source = unitSample(seconds(cutoff < 100 ? 8 : 2))
        const result = filter.render(source, { cutoff, resonance })
        for (const id of ['low', 'band', 'high']) {
          expect(peak(result.taps[id]!.channels_data[0]!)).toBeLessThanOrEqual(1 + 1e-6)
        }
        expect(result.checks.sum).toBeLessThan(-130)
      }
    }
  })

  it('is the same filter as the direct form while the cutoff stands still, to more than 100 dB (claim direct-still)', async () => {
    const filter = await lab(NAME)
    const noise = await benchSource('noise', seconds(4))
    expect(filter.render(noise, {}).checks.directApart).toBeLessThan(-100)
  })

  it('stays within 0.1 dB of the largest sample going in when the cutoff jumps (claim svf-holds) where the direct form goes 27 dB above (claim direct-jump)', async () => {
    const filter = await lab(NAME)
    const noise = await benchSource('noise', seconds(4))
    const result = filter.render(noise, { lfoAmount: 100, lfoShape: 2, lfoRate: 20 })
    const kit = largest(result.taps.svfLevel!.channels_data[0]!)
    const direct = largest(result.taps.directLevel!.channels_data[0]!)
    expect(kit - gainToDb(peak(noise.left))).toBeLessThan(0.1)
    expect(kit - gainToDb(peak(noise.left))).toBeGreaterThan(-1)
    expect(direct - kit).toBeGreaterThan(25.5)
    expect(direct - kit).toBeLessThan(28.5)
    // The device, on the same jumps, keeps its output at the input's size too.
    expect(peak(result.taps.out!.channels_data[0]!)).toBeLessThan(1.05 * peak(noise.left))
  })

  it('reaches the same peaks as the direct form on a smooth sweep at 20 Hz, 29 dB apart (claim direct-smooth)', async () => {
    const filter = await lab(NAME)
    const noise = await benchSource('noise', seconds(4))
    const result = filter.render(noise, { lfoAmount: 100, lfoShape: 0, lfoRate: 20 })
    const kit = largest(result.taps.svfLevel!.channels_data[0]!)
    const direct = largest(result.taps.directLevel!.channels_data[0]!)
    expect(Math.abs(direct - kit)).toBeLessThan(0.1)
    expect(result.checks.directApart).toBeGreaterThan(-31.5)
    expect(result.checks.directApart).toBeLessThan(-27.5)
  })

  it('cuts the cutoff by more than 100 dB with the notch (claim notch-depth)', async () => {
    const filter = await lab(NAME)
    for (const resonance of [0.7071, 3, 10]) {
      const notch = filter.render(unitSample(), { cutoff: 1000, resonance }).taps.notch!
        .channels_data[0]!
      expect(levelDb(notch, 1000)).toBeLessThan(-100)
      // Far from the cutoff the notch leaves the sound alone.
      expect(Math.abs(levelDb(notch, 50))).toBeLessThan(0.1)
      expect(Math.abs(levelDb(notch, 15000))).toBeLessThan(0.1)
    }
  })

  it('takes 2.75 dB off an octave under the cutoff with the notch at a Q of 0.7071, and 0.21 dB at 3 (claim notch-width)', async () => {
    const filter = await lab(NAME)
    const octaveUnder = (resonance: number) =>
      levelDb(
        filter.render(unitSample(), { cutoff: 1000, resonance }).taps.notch!.channels_data[0]!,
        500,
      )
    expect(octaveUnder(0.7071)).toBeCloseTo(-2.75, 1)
    expect(octaveUnder(3)).toBeCloseTo(-0.21, 1)
  })

  it('lifts the cutoff by 2Q with the peak: +15.6 dB at a Q of 3 (claim peak-2q)', async () => {
    const filter = await lab(NAME)
    const lifted = filter.render(unitSample(), { cutoff: 1000, resonance: 3 }).taps.peak!
      .channels_data[0]!
    expect(levelDb(lifted, 1000)).toBeCloseTo(20 * Math.log10(6), 1)
    expect(levelDb(lifted, 1000)).toBeCloseTo(15.6, 1)
    expect(Math.abs(levelDb(lifted, 50))).toBeLessThan(0.2)
    expect(Math.abs(levelDb(lifted, 15000))).toBeLessThan(0.2)
  })

  it("cannot tell the device's own stage from the kit's at 1 kHz: the check is at its floor (claim same-stage)", async () => {
    const filter = await lab(NAME)
    const noise = await benchSource('noise', seconds(4))
    expect(filter.render(noise, {}).checks.sameStage).toBe(-140)
  })

  it("finds the device's stage 82 dB from the kit's at 8 kHz and a Q of 4 (claim same-stage-8k)", async () => {
    const filter = await lab(NAME)
    const noise = await benchSource('noise', seconds(4))
    const apart = filter.render(noise, { cutoff: 8000, resonance: 4 }).checks.sameStage!
    expect(apart).toBeGreaterThan(-84)
    expect(apart).toBeLessThan(-80)
  })

  it('is 31 samples late through the device (claim latency)', async () => {
    const filter = await lab(NAME)
    // A high-pass at 20 Hz lets the unit sample through whole: it comes out where the delay puts it.
    const out = filter.render(unitSample(), { type: 1, cutoff: 20 }).taps.out!.channels_data[0]!
    let at = 0
    for (let i = 0; i < 4800; i += 1) if (Math.abs(out[i]!) > Math.abs(out[at]!)) at = i
    expect(at).toBe(31)
    // The converters keep what is under 20 kHz, so the sample comes out a little rounded.
    expect(out[at]).toBeGreaterThan(0.95)
  })

  it('reads −54.8 dB at 20 kHz through the device and −70.2 dB through one stage at 48 kHz, for a 1 kHz low-pass (claim device-top)', async () => {
    const filter = await lab(NAME)
    const taps = filter.render(unitSample(), { cutoff: 1000 }).taps
    expect(levelDb(taps.out!.channels_data[0]!, 20000)).toBeCloseTo(-54.8, 1)
    expect(levelDb(taps.low!.channels_data[0]!, 20000)).toBeCloseTo(-70.2, 1)
    // The curves the page draws say the same at their last point, which is 20 kHz.
    const drawn = (id: string) => taps[id]!.channels_data[0]!.at(-1)!
    expect(drawn('deviceResponse')).toBeCloseTo(-54.8, 1)
    expect(drawn('oneStageResponse')).toBeCloseTo(-70.2, 1)
  })

  it('keeps the gain at the cutoff at Q on either slope: +20.0 dB at a Q of 10 (claim q-both-slopes)', async () => {
    const filter = await lab(NAME)
    for (const slope of [0, 1]) {
      const out = filter.render(unitSample(), { cutoff: 1000, resonance: 10, slope }).taps.out!
      expect(levelDb(out.channels_data[0]!, 1000)).toBeCloseTo(20, 1)
    }
  })

  it('falls 24.3 dB between 1 and 2 kHz through two stages with the cutoff at 250 Hz (claim slope-24)', async () => {
    const filter = await lab(NAME)
    const out = filter.render(unitSample(), { cutoff: 250, slope: 1 }).taps.out!.channels_data[0]!
    const fall = levelDb(out, 1000) - levelDb(out, 2000)
    expect(fall).toBeGreaterThan(24.2)
    expect(fall).toBeLessThan(24.4)
    // One stage of the device, the same way: 12 dB.
    const one = filter.render(unitSample(), { cutoff: 250, slope: 0 }).taps.out!.channels_data[0]!
    expect(levelDb(one, 1000) - levelDb(one, 2000)).toBeCloseTo(12.04, 1)
  })

  it("makes the band-pass, the notch and the peak from the device's own stage: 0.0 dB, under −100 dB and +15.6 dB at the cutoff at a Q of 3 (claim device-types)", async () => {
    const filter = await lab(NAME)
    const atCutoff = (type: number) =>
      levelDb(
        filter.render(unitSample(), { cutoff: 1000, resonance: 3, type }).taps.out!
          .channels_data[0]!,
        1000,
      )
    expect(atCutoff(2)).toBeCloseTo(0, 1)
    expect(atCutoff(3)).toBeLessThan(-100)
    expect(atCutoff(4)).toBeCloseTo(15.6, 1)
    // And the two plain ones: Q at the cutoff.
    expect(atCutoff(0)).toBeCloseTo(20 * Math.log10(3), 1)
    expect(atCutoff(1)).toBeCloseTo(20 * Math.log10(3), 1)
  })

  it('falls 13.3 dB between 4 and 8 kHz at 48 kHz with the cutoff at 1 kHz: the top octave bends (claim warp-slope)', async () => {
    const filter = await lab(NAME)
    const low = filter.render(unitSample(), { cutoff: 1000 }).taps.low!.channels_data[0]!
    const fall = levelDb(low, 4000) - levelDb(low, 8000)
    expect(fall).toBeGreaterThan(13.25)
    expect(fall).toBeLessThan(13.4)
  })

  it('passes a tone on the cutoff 28.0 dB up at a Q of 25 (claim gain-q)', async () => {
    const filter = await lab(NAME)
    const tone = sine(440, 0.1, seconds(2))
    const result = filter.render(tone, { cutoff: 440, resonance: 25 })
    for (const id of ['low', 'out']) {
      const gain = gainToDb(rms(result.taps[id]!.channels_data[0]!) / rms(tone.left))
      expect(gain).toBeCloseTo(27.96, 1)
    }
  })

  it('holds a full-scale tone on the cutoff at a Q of 25 to 0.24 of full scale with 6 dB of drive (claim drive-caps)', async () => {
    const filter = await lab(NAME)
    const tone = sine(440, 1, seconds(2))
    const settings = { cutoff: 440, resonance: 25 }
    // With no drive the device, like the kit's filter, puts out 25 times full scale.
    const plain = filter.render(tone, settings)
    expect(peak(plain.taps.out!.channels_data[0]!)).toBeGreaterThan(24.5)
    expect(peak(plain.taps.low!.channels_data[0]!)).toBeGreaterThan(24.5)
    const driven = peak(filter.render(tone, { ...settings, drive: 6 }).taps.out!.channels_data[0]!)
    expect(driven).toBeGreaterThan(0.22)
    expect(driven).toBeLessThan(0.26)
  })
})
