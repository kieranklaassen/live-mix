import { describe, expect, it } from 'vitest'
import {
  benchSource,
  dbToGain,
  differenceDb,
  expectSoundLab,
  gainToDb,
  lab,
  mean,
  peak,
  seconds,
  silence,
  sine,
} from './support.ts'

const SOFT = 0
const HARD = 1
const TUBE = 2
const TAPE = 3
const FOLD = 4
const X1 = 0
const X2 = 1
const X4 = 2

interface Points {
  channels_data: Float32Array[]
  x0: number
  x1: number
  log: boolean
}

/** The level of harmonic `k` of a tone at `hz`, in dB where a full-scale sine reads 0. */
function harmonicDb(x: Float32Array, hz: number, k: number): number {
  let re = 0
  let im = 0
  const w = (2 * Math.PI * hz * k) / 48_000
  for (let i = 0; i < x.length; i += 1) {
    re += x[i]! * Math.cos(w * i)
    im += x[i]! * Math.sin(w * i)
  }
  return 20 * Math.log10(Math.max((2 * Math.hypot(re, im)) / x.length, 1e-12))
}

/** What a curve or a spectrum the lab worked out reads at `x`. */
function at(tap: Points, x: number): number {
  const data = tap.channels_data[0]!
  const place = tap.log
    ? Math.log(x / tap.x0) / Math.log(tap.x1 / tap.x0)
    : (x - tap.x0) / (tap.x1 - tap.x0)
  return data[Math.round(place * (data.length - 1))]!
}

/** The tallest point of a spectrum within three bins of `hz`. */
function peakNear(tap: Points, hz: number): number {
  const data = tap.channels_data[0]!
  const k = Math.round(((hz - tap.x0) / (tap.x1 - tap.x0)) * (data.length - 1))
  let top = -Infinity
  for (let i = k - 3; i <= k + 3; i += 1) top = Math.max(top, data[i]!)
  return top
}

/** The least and the most of a response over the frequencies `keep` lets through. */
function span(tap: Points, keep: (hz: number) => boolean): [number, number] {
  const data = tap.channels_data[0]!
  let lo = Infinity
  let hi = -Infinity
  data.forEach((v, i) => {
    if (!keep(tap.x0 * (tap.x1 / tap.x0) ** (i / (data.length - 1)))) return
    lo = Math.min(lo, v)
    hi = Math.max(hi, v)
  })
  return [lo, hi]
}

// For what the lab measures beside the loop, the loop itself does not matter.
const nothing = silence(seconds(0.1))
/** A sine 12 dB under full scale, as the page's own, at a frequency that fits the loop exactly. */
const tone = () => sine(1000, 0.25, seconds(1))

describe('lesson 9: saturation and oversampling', () => {
  it('is a sound lab on the sine: every tap says something, loops, and answers to every control', async () => {
    const sat = await lab('09-saturation')
    const source = await benchSource('sine', seconds(2))
    const result = sat.render(source, {})
    expectSoundLab(sat, source, result)
  })

  it('passes a quiet sine at low drive as the input doubled, 59 dB under it on the Soft curve (claim low-drive) and 38.5 dB on Tape (claim tape-null)', async () => {
    const sat = await lab('09-saturation')
    const quiet = sine(440, dbToGain(-30), seconds(1))
    const doubled = quiet.left.map((v) => v * dbToGain(6))
    const left = (values: Record<string, number>, tap: string) =>
      differenceDb(sat.render(quiet, { drive: 6, ...values }).taps[tap]!.channels_data[0]!, doubled)
    const soft = left({ curve: SOFT }, 'shaped1x')
    expect(soft).toBeGreaterThan(-60.6)
    expect(soft).toBeLessThan(-58.6)
    // Through the filters of the 4x path it is the same to half a decibel.
    expect(Math.abs(left({ curve: SOFT }, 'shaped') - soft)).toBeLessThan(0.5)
    // The lab's own driven signal is the input times the device's gain.
    expect(left({ curve: SOFT }, 'driven')).toBeLessThan(-120)
    for (const curve of [HARD, TUBE, FOLD]) expect(left({ curve }, 'shaped1x')).toBeLessThan(-40)
    // Tape's low-pass holds the sine a fifth of a sample back, which is all of its −38.5 dB.
    const tape = left({ curve: TAPE }, 'shaped1x')
    expect(tape).toBeGreaterThan(-39)
    expect(tape).toBeLessThan(-38)
  })

  it('puts the third harmonic 34 dB under the fundamental with the peaks at one half on the Soft curve (claim third-small)', async () => {
    const sat = await lab('09-saturation')
    // 0.25 driven by 6.02 dB reaches 0.5.
    const x = sat.render(tone(), { curve: SOFT, drive: 6.0206 }).taps.shaped1x!.channels_data[0]!
    const third = harmonicDb(x, 1000, 3) - harmonicDb(x, 1000, 1)
    expect(third).toBeGreaterThan(-34.6)
    expect(third).toBeLessThan(-33.6)
    // The first term of the series alone: A³/12 against A.
    expect(Math.abs(third - gainToDb(0.5 ** 2 / 12))).toBeLessThan(0.7)
  })

  it('makes only odd harmonics on the four symmetric curves: every even one more than 120 dB under the fundamental (claim odd-only)', async () => {
    const sat = await lab('09-saturation')
    for (const curve of [SOFT, HARD, TAPE, FOLD]) {
      const result = sat.render(tone(), { curve })
      for (const tap of ['shaped1x', 'shaped']) {
        const x = result.taps[tap]!.channels_data[0]!
        const fundamental = harmonicDb(x, 1000, 1)
        for (const k of [2, 4, 6, 8])
          expect(harmonicDb(x, 1000, k) - fundamental).toBeLessThan(-120)
        // And the odd ones are there.
        expect(harmonicDb(x, 1000, 3) - fundamental).toBeGreaterThan(-20)
      }
    }
  })

  it('makes a second harmonic 22.5 dB under the fundamental on Tube (claim tube-second) and lifts the wave by 0.097 (claim tube-offset)', async () => {
    const sat = await lab('09-saturation')
    const x = sat.render(tone(), { curve: TUBE }).taps.shaped1x!.channels_data[0]!
    const second = harmonicDb(x, 1000, 2) - harmonicDb(x, 1000, 1)
    expect(second).toBeGreaterThan(-22.8)
    expect(second).toBeLessThan(-22.2)
    expect(mean(x)).toBeGreaterThan(0.0947)
    expect(mean(x)).toBeLessThan(0.0987)
    // A bias does the same to a symmetric curve.
    const biased = sat.render(tone(), { curve: SOFT, bias: 0.3 }).taps.shaped1x!.channels_data[0]!
    expect(harmonicDb(biased, 1000, 2) - harmonicDb(biased, 1000, 1)).toBeGreaterThan(-25)
  })

  it('takes the offset of Tube below one millionth with DC Block on (claim dc-blocked)', async () => {
    const sat = await lab('09-saturation')
    const x = sat.render(sine(1000, 0.25, seconds(2)), { curve: TUBE, dcBlock: 1 }).taps.shaped!
      .channels_data[0]!
    expect(Math.abs(mean(x))).toBeLessThan(1e-6)
  })

  it('puts out exact silence for silence on every curve with a bias set (claim silence)', async () => {
    const sat = await lab('09-saturation')
    for (const curve of [SOFT, HARD, TUBE, TAPE, FOLD]) {
      for (const adaa of [0, 1]) {
        const quiet = sat.render(silence(seconds(0.5)), { curve, adaa, bias: 0.5 })
        expect(quiet.taps.shaped!.channels_data[0]!.every((v) => v === 0)).toBe(true)
        expect(quiet.taps.out!.channels_data[0]!.every((v) => v === 0)).toBe(true)
      }
    }
  })

  it('works the 1x path out by hand to the same numbers as the device: the check reads its floor, −140 dB (claim rebuilt-exact)', async () => {
    const sat = await lab('09-saturation')
    const settings: Record<string, number>[] = [
      {},
      { curve: TAPE, drive: 30 },
      { curve: TUBE, dcBlock: 1, bias: 0.4 },
      { curve: FOLD, drive: 36, dcBlock: 1, bias: -0.7 },
      { curve: HARD, adaa: 1, oversample: X1 },
    ]
    for (const id of ['sine', 'guitar', 'drums']) {
      const source = await benchSource(id, seconds(2))
      for (const values of settings) expect(sat.render(source, values).checks.rebuilt).toBe(-140)
    }
  })

  it('brings the ninth harmonic of a 5 kHz tone back at 3 kHz, 31 dB under full scale, at 1x (claim ninth)', async () => {
    const sat = await lab('09-saturation')
    const folded = sat.render(nothing, { probe: 5000 }).taps.folded1x!
    expect(peakNear(folded, 3000)).toBeGreaterThan(-31.7)
    expect(peakNear(folded, 3000)).toBeLessThan(-29.7)
    // The fifth comes back at 23 kHz, the seventh at 13: 48 less 25 and 48 less 35.
    expect(peakNear(folded, 23_000)).toBeGreaterThan(-20)
    expect(peakNear(folded, 13_000)).toBeGreaterThan(-27)
    // Nothing of the tone and its true harmonics is left in what folded.
    expect(peakNear(folded, 5000)).toBeLessThan(-120)
    expect(peakNear(folded, 15_000)).toBeLessThan(-120)
  })

  it('moves a folded partial down as the tone moves up, and counts nothing where every one lands on a harmonic', async () => {
    const sat = await lab('09-saturation')
    // Nine times 5.1 kHz is 45.9 kHz, which comes back at 2.1 kHz.
    const higher = sat.render(nothing, { probe: 5100 }).taps.folded1x!
    expect(peakNear(higher, 2100)).toBeGreaterThan(-33)
    expect(peakNear(higher, 3000)).toBeLessThan(-80)
    // 6 kHz divides 48 kHz: every folded partial is on a multiple of 6 kHz.
    expect(sat.render(nothing, { probe: 6000, oversample: X1 }).checks.alias1x).toBe(-140)
  })

  it('counts the folded partials of the 5 kHz tone below 20 kHz at −23 dB at 1x (claim fold-1x)', async () => {
    const sat = await lab('09-saturation')
    const result = sat.render(nothing, { probe: 5000, oversample: X1 })
    expect(result.checks.alias1x).toBeGreaterThan(-23.4)
    expect(result.checks.alias1x).toBeLessThan(-22.4)
    // Set to 1x with no remedy, the device as set is the device at 1x.
    expect(result.checks.aliasSet).toBe(result.checks.alias1x)
    expect(result.checks.aliasDrop).toBe(0)
  })

  it('brings them down 34 dB at 2x (claim fold-2x) and 88 dB at 4x, to −111 dB (claim fold-4x)', async () => {
    const sat = await lab('09-saturation')
    const twice = sat.render(nothing, { probe: 5000, oversample: X2 }).checks
    expect(twice.aliasDrop).toBeGreaterThan(32.6)
    expect(twice.aliasDrop).toBeLessThan(34.6)
    const four = sat.render(nothing, { probe: 5000, oversample: X4 }).checks
    expect(four.aliasDrop).toBeGreaterThan(86.9)
    expect(four.aliasDrop).toBeLessThan(89.9)
    expect(four.aliasSet).toBeGreaterThan(-112.8)
    expect(four.aliasSet).toBeLessThan(-109.8)
  })

  it('brings them down 12 dB with the antiderivative alone at 1x (claim fold-adaa) and 92 dB with 4x as well (claim fold-both)', async () => {
    const sat = await lab('09-saturation')
    const alone = sat.render(nothing, { probe: 5000, oversample: X1, adaa: 1 }).checks
    expect(alone.aliasDrop).toBeGreaterThan(11.4)
    expect(alone.aliasDrop).toBeLessThan(12.8)
    const both = sat.render(nothing, { probe: 5000, oversample: X4, adaa: 1 }).checks
    expect(both.aliasDrop).toBeGreaterThan(90.6)
    expect(both.aliasDrop).toBeLessThan(93.6)
    // On a curve with no antiderivative the switch changes nothing.
    for (const curve of [TUBE, TAPE, FOLD]) {
      const off = sat.render(nothing, { curve, oversample: X1 }).checks.aliasSet
      expect(sat.render(nothing, { curve, oversample: X1, adaa: 1 }).checks.aliasSet).toBe(off)
    }
  })

  it('gains 30 dB on the Hard curve at 4x (claim hard-4x) and 55 dB with the antiderivative as well (claim hard-both)', async () => {
    const sat = await lab('09-saturation')
    const four = sat.render(nothing, { curve: HARD, probe: 5000, oversample: X4 }).checks
    expect(four.aliasDrop).toBeGreaterThan(30)
    expect(four.aliasDrop).toBeLessThan(30.8)
    const both = sat.render(nothing, { curve: HARD, probe: 5000, oversample: X4, adaa: 1 }).checks
    expect(both.aliasDrop).toBeGreaterThan(53.8)
    expect(both.aliasDrop).toBeLessThan(55.8)
  })

  it('gains only 16 dB at 4x with the drive at 36 dB on the Soft curve (claim hardest-4x), 40 dB with the antiderivative as well (claim hardest-both)', async () => {
    const sat = await lab('09-saturation')
    const four = sat.render(nothing, { drive: 36, probe: 5000, oversample: X4 }).checks
    expect(four.aliasDrop).toBeGreaterThan(14.9)
    expect(four.aliasDrop).toBeLessThan(16.9)
    const both = sat.render(nothing, { drive: 36, probe: 5000, oversample: X4, adaa: 1 }).checks
    expect(both.aliasDrop).toBeGreaterThan(38.7)
    expect(both.aliasDrop).toBeLessThan(40.7)
  })

  it('still brings the fifth harmonic back at 23 kHz at 4x, 30 dB under full scale where 1x has it 18 under: it sits on the slope of the filter (claim slope)', async () => {
    const sat = await lab('09-saturation')
    const result = sat.render(nothing, { probe: 5000, oversample: X4 })
    expect(peakNear(result.taps.foldedSet!, 23_000)).toBeGreaterThan(-31.4)
    expect(peakNear(result.taps.foldedSet!, 23_000)).toBeLessThan(-29.4)
    expect(peakNear(result.taps.folded1x!, 23_000)).toBeGreaterThan(-18.7)
    expect(peakNear(result.taps.folded1x!, 23_000)).toBeLessThan(-16.7)
  })

  it('leaves below 20 kHz at 4x the harmonics that reach 192 kHz: the 35th of the 5 kHz tone comes back at 17 kHz, 118 dB under full scale (claim fold-high)', async () => {
    const sat = await lab('09-saturation')
    const result = sat.render(nothing, { probe: 5000, oversample: X4 })
    const set = result.taps.foldedSet!
    // 35 times 5 kHz is 175 kHz, 17 under 192. The 37th, at 185 kHz, lands at 7 kHz, weaker.
    expect(peakNear(set, 17_000)).toBeGreaterThan(-119.1)
    expect(peakNear(set, 17_000)).toBeLessThan(-116.1)
    expect(peakNear(set, 7000)).toBeLessThan(peakNear(set, 17_000) - 4)
    expect(peakNear(set, 7000)).toBeGreaterThan(-127)
    // What folded about 48 kHz and about 96 kHz at 1x and landed anywhere else is gone.
    for (const hz of [1000, 9000, 11_000, 19_000]) {
      expect(peakNear(result.taps.folded1x!, hz)).toBeGreaterThan(-90)
      expect(peakNear(set, hz)).toBe(-140)
    }
  })

  it('has a 63-tap half-band flat within 0.001 dB to 20 kHz (claim outer-flat) and 81 dB down from 27.8 kHz (claim outer-stop)', async () => {
    const sat = await lab('09-saturation')
    const outer = sat.render(nothing, {}).taps.outerResponse!
    const [low, high] = span(outer, (hz) => hz <= 20_000)
    expect(low).toBeGreaterThan(-0.001)
    expect(high).toBeLessThan(0.001)
    // 0.58 of 48 kHz, as oversample.h has it.
    const [, stop] = span(outer, (hz) => hz >= 27_840)
    expect(stop).toBeLessThan(-80)
    expect(stop).toBeGreaterThan(-82.5)
    // A half-band passes half the amplitude at a quarter of its rate.
    expect(Math.abs(at(outer, 24_000) + 6.02)).toBeLessThan(0.1)
  })

  it('has a 31-tap half-band 98 dB down from 68 kHz (claim inner-stop), flat to 27.8 kHz', async () => {
    const sat = await lab('09-saturation')
    const inner = sat.render(nothing, {}).taps.innerResponse!
    // 0.355 of 192 kHz, as saturator.h has it.
    const [, stop] = span(inner, (hz) => hz >= 68_160)
    expect(stop).toBeLessThan(-98)
    expect(stop).toBeGreaterThan(-99.5)
    const [low, high] = span(inner, (hz) => hz <= 27_840)
    expect(low).toBeGreaterThan(-0.001)
    expect(high).toBeLessThan(0.001)
  })

  it('lands a click on sample 39 at 1x, 2x and 4x, with and without the antiderivative (claim latency)', async () => {
    const sat = await lab('09-saturation')
    for (const oversample of [X1, X2, X4]) {
      for (const adaa of [0, 1]) {
        for (const curve of [SOFT, HARD, FOLD]) {
          const result = sat.render(nothing, { oversample, adaa, curve })
          expect(result.checks.latency).toBe(39)
        }
      }
    }
    // At 1x the click is one sample and nothing else.
    const click = sat.render(nothing, { oversample: X1, curve: HARD }).taps.arrival!
      .channels_data[0]!
    expect(click[39]).toBeCloseTo(1, 5)
    expect(click.every((v, n) => n === 39 || v === 0)).toBe(true)
    // With the antiderivative it is the mean of two: half now, half one sample on.
    const halves = sat.render(nothing, { oversample: X1, curve: HARD, adaa: 1 }).taps.arrival!
      .channels_data[0]!
    expect(halves[39]).toBeCloseTo(0.5, 5)
    expect(halves[40]).toBeCloseTo(0.5, 5)
  })

  it('writes the antiderivative step out again to the same numbers as the device: the check reads its floor, −140 dB (claim adaa-exact)', async () => {
    const sat = await lab('09-saturation')
    for (const curve of [SOFT, HARD, TUBE, TAPE, FOLD]) {
      for (const values of [{}, { drive: 36, probe: 7770 }, { drive: 3, bias: 0.6, probe: 1230 }]) {
        expect(sat.render(nothing, { curve, ...values }).checks.adaaRebuilt).toBe(-140)
      }
    }
  })

  it('costs a quiet signal 2 dB at 10 kHz and 11.7 dB at 20 kHz through the antiderivative at 1x (claim droop-1x), 0.5 dB at 20 kHz at 4x (claim droop-4x)', async () => {
    const sat = await lab('09-saturation')
    const result = sat.render(nothing, { curve: HARD })
    const once = result.taps.smallAdaa1x!
    expect(at(once, 10_000)).toBeGreaterThan(-2.12)
    expect(at(once, 10_000)).toBeLessThan(-1.92)
    expect(at(once, 20_000)).toBeGreaterThan(-11.9)
    expect(at(once, 20_000)).toBeLessThan(-11.6)
    const four = result.taps.smallAdaa4x!
    expect(at(four, 20_000)).toBeGreaterThan(-0.52)
    expect(at(four, 20_000)).toBeLessThan(-0.42)
    // The mean of two samples is a cosine of the frequency against the rate the curve runs at.
    const law = (hz: number, rate: number) => gainToDb(Math.cos((Math.PI * hz) / rate))
    for (const hz of [2000, 5000, 10_000, 15_000, 20_000]) {
      expect(Math.abs(at(once, hz) - law(hz, 48_000))).toBeLessThan(0.05)
      expect(Math.abs(at(result.taps.smallAdaa2x!, hz) - law(hz, 96_000))).toBeLessThan(0.05)
      expect(Math.abs(at(four, hz) - law(hz, 192_000))).toBeLessThan(0.05)
      // The plain curve leaves a quiet signal alone.
      expect(Math.abs(at(result.taps.smallPlain!, hz))).toBeLessThan(0.01)
    }
  })

  it('is the input, sample for sample, with the mix at 0 (claim mix-zero)', async () => {
    const sat = await lab('09-saturation')
    const drums = await benchSource('drums', seconds(2))
    const result = sat.render(drums, { mix: 0, drive: 30, curve: FOLD, output: 12 })
    for (const c of [0, 1]) {
      const dry = result.taps.in!.channels_data[c]!
      expect(result.taps.out!.channels_data[c]!.every((v, i) => v === dry[i])).toBe(true)
    }
  })

  it('peaks 1.1 dB over the ceiling on the saw through the Hard curve at 4x, and at exactly 1 at 1x (claim overshoot)', async () => {
    const sat = await lab('09-saturation')
    const saw = await benchSource('saw', seconds(2))
    const four = sat.render(saw, { curve: HARD, oversample: X4 })
    const over = gainToDb(peak(four.taps.shaped!.channels_data[0]!))
    expect(over).toBeGreaterThan(0.95)
    expect(over).toBeLessThan(1.25)
    expect(peak(four.taps.shaped1x!.channels_data[0]!)).toBe(1)
  })

  it('peaks 2.4 dB over on the drums at 36 dB of drive through the Hard curve at 4x (claim overshoot-drums)', async () => {
    const sat = await lab('09-saturation')
    const drums = await benchSource('drums', seconds(2))
    const four = sat.render(drums, { curve: HARD, drive: 36, oversample: X4 })
    const over = gainToDb(peak(four.taps.shaped!.channels_data[0]!))
    expect(over).toBeGreaterThan(2.2)
    expect(over).toBeLessThan(2.6)
    expect(peak(four.taps.shaped1x!.channels_data[0]!)).toBe(1)
  })
})
