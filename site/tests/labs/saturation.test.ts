import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
  dbToGain,
  differenceDb,
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  mean,
  peak,
  range,
  RATE,
  rms,
  seconds,
  silence,
  sine,
  type Source,
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
  const w = (2 * Math.PI * hz * k) / RATE
  for (let i = 0; i < x.length; i += 1) {
    re += x[i]! * Math.cos(w * i)
    im += x[i]! * Math.sin(w * i)
  }
  return 20 * Math.log10(Math.max((2 * Math.hypot(re, im)) / x.length, 1e-12))
}

/** How far harmonic `k` of a tone at `hz` stands over its fundamental, in dB. */
const over = (x: Float32Array, hz: number, k: number) => harmonicDb(x, hz, k) - harmonicDb(x, hz, 1)

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
const tone = (length = 1) => sine(1000, 0.25, seconds(length))

/** Two sines of one height, 100 Hz apart: the smallest chord there is. */
function twoTones(): Source {
  const frames = seconds(1)
  const source = silence(frames)
  for (let i = 0; i < frames; i += 1) {
    const v =
      0.125 * Math.sin((2 * Math.PI * 1000 * i) / RATE) +
      0.125 * Math.sin((2 * Math.PI * 1100 * i) / RATE)
    source.left[i] = v
    source.right[i] = v
  }
  return source
}

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings('saturation')!

/** A named set as its card plays it: on its own source, with `changed` laid on its values. */
async function played(sat: Lab, name: string, changed: Record<string, number> = {}) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(sat.description, set)
  return sat.render(await benchSource(source!, seconds(2)), { ...values, ...changed })
}

const tap = (result: RenderResult, id: string) => result.taps[id]!.channels_data[0]!
/** A tap's level over the loop, in dB against full scale. */
const levelOf = (result: RenderResult, id: string) => gainToDb(rms(tap(result, id)))
/** A tap's loudest sample, in dB against full scale. */
const topOf = (result: RenderResult, id: string) => gainToDb(peak(tap(result, id)))
/** How far the loudest sample stands over the level of the whole. */
const crest = (result: RenderResult, id: string) => topOf(result, id) - levelOf(result, id)

const LOOPS = ['guitar', 'bass', 'drums', 'chords', 'pad', 'mix']

describe('saturation and oversampling', () => {
  it('is a sound lab on the guitar: every tap says something, loops, and answers to every control', async () => {
    const sat = await lab('saturation')
    const guitar = await benchSource('guitar', seconds(2))
    const result = sat.render(guitar, {})
    // With Tone at 0 dB the tilt is a wire, and its response is rightly one flat line.
    expectSoundLab(sat, guitar, result, { quiet: ['toneResponse'] })
  })

  it('builds a saturator in seven pieces on taps of its own: at settings where every piece acts, every step changes one and none changes the main path', async () => {
    const sat = await lab('saturation')
    expect(sat.description.controls.find((control) => control.id === 'build')!.choices).toEqual([
      'A curve',
      'Gain before and after',
      'A lean to one side',
      'A higher rate',
      'The mean of the curve',
      'The DC block',
      'A tilt and a blend',
    ])
    // At the lesson's starting values Bias is 0, ADAA and DC Block are off, Tone is 0 dB and Mix
    // is 1: those pieces are there and do nothing. So the steps are held with them turned.
    expectBuild(sat, await benchSource('guitar', seconds(2)), {
      bias: 0.3,
      adaa: 1,
      dcBlock: 1,
      toneDb: 3,
      mix: 0.5,
    })
  })

  // ---- part 1: why ---------------------------------------------------------------------------

  it('brings the guitar line out denser: its loudest sample stood 17.1 dB over its level and comes out 8.4 dB over it, the level more than 6 dB higher and the loudest sample 2.0 dB lower (claim guitar-dense)', async () => {
    const sat = await lab('saturation')
    const result = await played(sat, 'bent')
    expectWritten(crest(result, 'in'), '17.1 dB')
    expectWritten(crest(result, 'out'), '8.4 dB')
    expectWritten(levelOf(result, 'out') - levelOf(result, 'in'), 'more than 6 dB')
    expectWritten(topOf(result, 'in') - topOf(result, 'out'), '2.0 dB')
    // The card that plays the line as it was plays the input, untouched.
    const dry = await played(sat, 'played')
    const guitar = await benchSource('guitar', seconds(2))
    expect(tap(dry, 'in').every((v, i) => v === guitar.left[i])).toBe(true)
  })

  it("puts harmonics on the page's sine that were not in it: the third 15.5 dB under the fundamental, the fifth 28 dB, the seventh 41 dB (claim sine-harmonics)", async () => {
    const sat = await lab('saturation')
    const result = sat.render(await benchSource('sine', seconds(2)), {})
    const out = tap(result, 'out')
    expectWritten(-over(out, 440, 3), '15.5 dB')
    expectWritten(-over(out, 440, 5), '28 dB')
    expectWritten(-over(out, 440, 7), '41 dB')
    // Going in, it had none: every one of them is more than 120 dB under.
    const dry = tap(result, 'in')
    for (const k of [2, 3, 5, 7]) expect(over(dry, 440, k)).toBeLessThan(-120)
  })

  it('at 1x keeps the third harmonic of a 5 kHz tone at 15 kHz and brings back the fifth, asked for at 25 kHz, at 23 kHz, the seventh, asked for at 35 kHz, at 13 kHz, and the ninth, asked for at 45 kHz, at 3 kHz, 31 dB under full scale (claim ninth)', async () => {
    const sat = await lab('saturation')
    const folded = sat.render(nothing, { probe: 5000 }).taps.folded1x!
    expectWritten(-peakNear(folded, 3000), '31 dB')
    // The fifth comes back at 23 kHz, the seventh at 13: 48 less 25 and 48 less 35.
    expect(peakNear(folded, 23_000)).toBeGreaterThan(-20)
    expect(peakNear(folded, 13_000)).toBeGreaterThan(-27)
    // The tone and its third harmonic stand in the whole, and nothing of them is left in what
    // folded.
    const whole = sat.render(nothing, { probe: 5000 }).taps.tone1x!
    expect(peakNear(whole, 5000)).toBeGreaterThan(-6)
    expect(peakNear(whole, 15_000)).toBeGreaterThan(-20)
    expect(peakNear(folded, 5000)).toBeLessThan(-120)
    expect(peakNear(folded, 15_000)).toBeLessThan(-120)
  })

  it('moves a folded partial down as the tone moves up, and counts nothing where every one lands on a harmonic', async () => {
    const sat = await lab('saturation')
    // Nine times 5.1 kHz is 45.9 kHz, which comes back at 2.1 kHz.
    const higher = sat.render(nothing, { probe: 5100 }).taps.folded1x!
    expect(peakNear(higher, 2100)).toBeGreaterThan(-33)
    expect(peakNear(higher, 3000)).toBeLessThan(-80)
    // 6 kHz divides 48 kHz: every folded partial is on a multiple of 6 kHz.
    expect(sat.render(nothing, { probe: 6000, oversample: X1 }).checks.alias1x).toBe(-140)
  })

  it('on the rising sine, has at 1x a sound 24 dB under the whole that 4x does not have: what folded (claim sweep-folded)', async () => {
    const sat = await lab('saturation')
    const result = await played(sat, 'sweepFolded')
    expectWritten(levelOf(result, 'shaped1x') - levelOf(result, 'foldedSound'), '24 dB')
    // The tap is the one less the other, sample for sample.
    const once = tap(result, 'shaped1x')
    const set = tap(result, 'shaped')
    expect(
      tap(result, 'foldedSound').every((v, i) => Math.abs(v - (once[i]! - set[i]!)) < 1e-6),
    ).toBe(true)
    // Set to 1x, the device is the device at 1x, and nothing is left over.
    expect(tap(await played(sat, 'sweep1x'), 'foldedSound').every((v) => v === 0)).toBe(true)
    // The cards of the three play the same sine through the same curve.
    expect(levelOf(await played(sat, 'sweep4x'), 'out')).toBeGreaterThan(-12)
  })

  // ---- part 2: the picture -------------------------------------------------------------------

  it('reads off the measured curve at the starting settings: a sample of 0.25 comes out at 0.96 and one of 0.125 at 0.76 (claim curve-reads)', async () => {
    const sat = await lab('saturation')
    const transfer = sat.render(nothing, {}).taps.transfer!
    expectWritten(at(transfer, 0.25), '0.96')
    expectWritten(at(transfer, 0.125), '0.76')
    // The curve is the Soft one on the input times the drive: tanh(0.25 · 10^(18/20)).
    expect(Math.abs(at(transfer, 0.25) - Math.tanh(0.25 * dbToGain(18)))).toBeLessThan(1e-4)
    // With no drive, the same sample comes out nearly as it went in.
    expectWritten(at(sat.render(nothing, { driveDb: 0 }).taps.transfer!, 0.25), '0.24')
  })

  // ---- part 5: the engine, stage by stage ----------------------------------------------------

  it('passes a quiet sine at low drive as the input doubled, 60 dB under it on the Soft curve (claim low-drive) and 38.5 dB on Tape (claim tape-null)', async () => {
    const sat = await lab('saturation')
    const quiet = sine(440, dbToGain(-30), seconds(1))
    const doubled = quiet.left.map((v) => v * dbToGain(6))
    const left = (values: Record<string, number>, id: string) =>
      differenceDb(tap(sat.render(quiet, { driveDb: 6, ...values }), id), doubled)
    const soft = left({ curve: SOFT }, 'shaped1x')
    expectWritten(-soft, '60 dB')
    // Through the filters of the 4x path it is the same to half a decibel.
    expect(Math.abs(left({ curve: SOFT }, 'shaped') - soft)).toBeLessThan(0.5)
    // The lab's own driven signal is the input times the device's gain.
    expect(left({ curve: SOFT }, 'driven')).toBeLessThan(-120)
    for (const curve of [HARD, TUBE, FOLD]) expect(left({ curve }, 'shaped1x')).toBeLessThan(-40)
    // Tape's low-pass holds the sine a fifth of a sample back, which is all of its 38.5 dB.
    expectWritten(-left({ curve: TAPE }, 'shaped1x'), '38.5 dB')
  })

  it('puts the third harmonic 34 dB under the fundamental with the peaks at one half on the Soft curve (claim third-small)', async () => {
    const sat = await lab('saturation')
    // 0.25 driven by 6.02 dB reaches 0.5.
    const x = tap(sat.render(tone(), { curve: SOFT, driveDb: 6.0206 }), 'shaped1x')
    expectWritten(-over(x, 1000, 3), '34 dB')
    // The first term of the series alone: A³/12 against A.
    expect(Math.abs(over(x, 1000, 3) - gainToDb(0.5 ** 2 / 12))).toBeLessThan(0.7)
  })

  it('makes only odd harmonics on the four symmetric curves: every even one more than 120 dB under the fundamental (claim odd-only)', async () => {
    const sat = await lab('saturation')
    for (const curve of [SOFT, HARD, TAPE, FOLD]) {
      const result = sat.render(tone(), { curve })
      for (const id of ['shaped1x', 'shaped']) {
        const x = tap(result, id)
        for (const k of [2, 4, 6, 8]) expectWritten(-over(x, 1000, k), 'more than 120 dB')
        // And the odd ones are there.
        expect(over(x, 1000, 3)).toBeGreaterThan(-20)
      }
    }
  })

  it('makes a second harmonic 22.5 dB under the fundamental on Tube (claim tube-second) and lifts the wave by 0.097 (claim tube-offset)', async () => {
    const sat = await lab('saturation')
    const x = tap(sat.render(tone(), { curve: TUBE }), 'shaped1x')
    expectWritten(-over(x, 1000, 2), '22.5 dB')
    expectWritten(mean(x), '0.097')
    // The lab's own meter of the middle reads the same on the path as set.
    const lies = tap(sat.render(tone(2), { curve: TUBE }), 'offset')
    expectWritten(mean(lies, lies.length / 2), '0.097')
  })

  it('takes the offset of Tube below one millionth with DC Block on (claim dc-blocked)', async () => {
    const sat = await lab('saturation')
    const x = tap(sat.render(tone(2), { curve: TUBE, dcBlock: 1 }), 'shaped')
    expect(Math.abs(mean(x))).toBeLessThan(1e-6)
  })

  it('puts out exact silence for silence on every curve with a bias set (claim silence)', async () => {
    const sat = await lab('saturation')
    for (const curve of [SOFT, HARD, TUBE, TAPE, FOLD]) {
      for (const adaa of [0, 1]) {
        const quiet = sat.render(silence(seconds(0.5)), { curve, adaa, bias: 0.5 })
        expect(tap(quiet, 'shaped').every((v) => v === 0)).toBe(true)
        expect(tap(quiet, 'out').every((v) => v === 0)).toBe(true)
      }
    }
  })

  it('works the 1x path out by hand to the same numbers as the device: the check reads its floor, −140 dB (claim rebuilt-exact)', async () => {
    const sat = await lab('saturation')
    const tried: Record<string, number>[] = [
      {},
      { curve: TAPE, driveDb: 30 },
      { curve: TUBE, dcBlock: 1, bias: 0.4 },
      { curve: FOLD, driveDb: 36, dcBlock: 1, bias: -0.7 },
      { curve: HARD, adaa: 1, oversample: X1 },
    ]
    for (const id of ['sine', 'guitar', 'drums']) {
      const source = await benchSource(id, seconds(2))
      for (const values of tried)
        expectWritten(sat.render(source, values).checks.rebuilt!, '−140 dB')
    }
  })

  it('counts the folded partials of the 5 kHz tone below 20 kHz at −23 dB at 1x (claim fold-1x)', async () => {
    const sat = await lab('saturation')
    const result = sat.render(nothing, { probe: 5000, oversample: X1 })
    expectWritten(result.checks.alias1x!, '−23 dB')
    // Set to 1x with no remedy, the device as set is the device at 1x.
    expect(result.checks.aliasSet).toBe(result.checks.alias1x)
    expect(result.checks.aliasDrop).toBe(0)
  })

  it('brings them down 34 dB at 2x (claim fold-2x) and 88 dB at 4x, to −111 dB (claim fold-4x)', async () => {
    const sat = await lab('saturation')
    expectWritten(sat.render(nothing, { probe: 5000, oversample: X2 }).checks.aliasDrop!, '34 dB')
    const four = sat.render(nothing, { probe: 5000, oversample: X4 }).checks
    expectWritten(four.aliasDrop!, '88 dB')
    expectWritten(four.aliasSet!, '−111 dB')
  })

  it('brings them down 12 dB with the mean of the curve alone at 1x (claim fold-adaa) and 92 dB with 4x as well (claim fold-both)', async () => {
    const sat = await lab('saturation')
    const alone = sat.render(nothing, { probe: 5000, oversample: X1, adaa: 1 }).checks
    expectWritten(alone.aliasDrop!, '12 dB')
    const both = sat.render(nothing, { probe: 5000, oversample: X4, adaa: 1 }).checks
    expectWritten(both.aliasDrop!, '92 dB')
    // On a curve with no antiderivative ADAA changes nothing.
    for (const curve of [TUBE, TAPE, FOLD]) {
      const off = sat.render(nothing, { curve, oversample: X1 }).checks.aliasSet
      expect(sat.render(nothing, { curve, oversample: X1, adaa: 1 }).checks.aliasSet).toBe(off)
    }
  })

  it('gains 30 dB on the Hard curve at 4x (claim hard-4x) and 55 dB with the mean of the curve as well (claim hard-both), from −18 dB at 1x (claim fault-alias)', async () => {
    const sat = await lab('saturation')
    const four = sat.render(nothing, { curve: HARD, probe: 5000, oversample: X4 }).checks
    expectWritten(four.alias1x!, '−18 dB')
    expectWritten(four.aliasDrop!, '30 dB')
    const both = sat.render(nothing, { curve: HARD, probe: 5000, oversample: X4, adaa: 1 }).checks
    expectWritten(both.aliasDrop!, '55 dB')
  })

  it('gains only 16 dB at 4x with Drive at 36 dB on the Soft curve (claim hardest-4x), 40 dB with the mean of the curve as well (claim hardest-both)', async () => {
    const sat = await lab('saturation')
    const four = sat.render(nothing, { driveDb: 36, probe: 5000, oversample: X4 }).checks
    expectWritten(four.aliasDrop!, '16 dB')
    const both = sat.render(nothing, { driveDb: 36, probe: 5000, oversample: X4, adaa: 1 }).checks
    expectWritten(both.aliasDrop!, '40 dB')
  })

  it('still brings the fifth harmonic of the 5 kHz tone back at 23 kHz at 4x, 30 dB under full scale where 1x has it 18 dB under: it sits on the slope of the filter (claim slope)', async () => {
    const sat = await lab('saturation')
    const result = sat.render(nothing, { probe: 5000, oversample: X4 })
    expectWritten(-peakNear(result.taps.foldedSet!, 23_000), '30 dB')
    expectWritten(-peakNear(result.taps.folded1x!, 23_000), '18 dB')
  })

  it('leaves below 20 kHz at 4x the harmonics that reach 192 kHz: the 35th of the 5 kHz tone comes back at 17 kHz, 118 dB under full scale (claim fold-high)', async () => {
    const sat = await lab('saturation')
    const result = sat.render(nothing, { probe: 5000, oversample: X4 })
    const set = result.taps.foldedSet!
    // 35 times 5 kHz is 175 kHz, 17 under 192. The 37th, at 185 kHz, lands at 7 kHz, weaker.
    expectWritten(-peakNear(set, 17_000), '118 dB')
    expect(peakNear(set, 7000)).toBeLessThan(peakNear(set, 17_000) - 4)
    expect(peakNear(set, 7000)).toBeGreaterThan(-127)
    // What folded about 48 kHz and about 96 kHz at 1x and landed anywhere else is gone.
    for (const hz of [1000, 9000, 11_000, 19_000]) {
      expect(peakNear(result.taps.folded1x!, hz)).toBeGreaterThan(-90)
      expect(peakNear(set, hz)).toBe(-140)
    }
  })

  it('has a 63-tap half-band flat within less than 0.001 dB to 20 kHz (claim outer-flat) and more than 81 dB down from 27.8 kHz (claim outer-stop)', async () => {
    const sat = await lab('saturation')
    const outer = sat.render(nothing, {}).taps.outerResponse!
    const [low, high] = span(outer, (hz) => hz <= 20_000)
    expectWritten(Math.max(-low, high), 'less than 0.001 dB')
    // 0.58 of 48 kHz, as oversample.h has it.
    const [, stop] = span(outer, (hz) => hz >= 27_840)
    expectWritten(-stop, 'more than 81 dB')
    expect(stop).toBeGreaterThan(-82.5)
    // A half-band passes half the amplitude at a quarter of its rate.
    expect(Math.abs(at(outer, 24_000) + 6.02)).toBeLessThan(0.1)
  })

  it('has a 31-tap half-band more than 98 dB down from 68 kHz (claim inner-stop), flat to 27.8 kHz', async () => {
    const sat = await lab('saturation')
    const inner = sat.render(nothing, {}).taps.innerResponse!
    // 0.355 of 192 kHz, as saturator.h has it.
    const [, stop] = span(inner, (hz) => hz >= 68_160)
    expectWritten(-stop, 'more than 98 dB')
    expect(stop).toBeGreaterThan(-99.5)
    const [low, high] = span(inner, (hz) => hz <= 27_840)
    expect(low).toBeGreaterThan(-0.001)
    expect(high).toBeLessThan(0.001)
  })

  it('lands a click after 39 samples at 1x, 2x and 4x, with and without the mean of the curve (claim latency)', async () => {
    const sat = await lab('saturation')
    for (const oversample of [X1, X2, X4]) {
      for (const adaa of [0, 1]) {
        for (const curve of [SOFT, HARD, FOLD]) {
          const result = sat.render(nothing, { oversample, adaa, curve })
          expectWritten(result.checks.latency!, '39 samples')
          expect(result.checks.latency).toBe(39)
        }
      }
    }
    // At 1x the click is one sample and nothing else.
    const click = tap(sat.render(nothing, { oversample: X1, curve: HARD }), 'arrival')
    expect(click[39]).toBeCloseTo(1, 5)
    expect(click.every((v, n) => n === 39 || v === 0)).toBe(true)
    // With the mean of the curve it is the mean of two: half now, half one sample on.
    const halves = tap(sat.render(nothing, { oversample: X1, curve: HARD, adaa: 1 }), 'arrival')
    expect(halves[39]).toBeCloseTo(0.5, 5)
    expect(halves[40]).toBeCloseTo(0.5, 5)
  })

  it('writes the mean of the curve out again to the same numbers as the device: the check reads its floor, −140 dB (claim adaa-exact)', async () => {
    const sat = await lab('saturation')
    for (const curve of [SOFT, HARD, TUBE, TAPE, FOLD]) {
      for (const values of [
        {},
        { driveDb: 36, probe: 7770 },
        { driveDb: 3, bias: 0.6, probe: 1230 },
      ]) {
        expectWritten(sat.render(nothing, { curve, ...values }).checks.adaaRebuilt!, '−140 dB')
      }
    }
  })

  it('costs a quiet signal 2 dB at 10 kHz and 11.7 dB at 20 kHz through the mean of the curve at 1x (claim droop-1x), 0.5 dB at 20 kHz at 4x (claim droop-4x)', async () => {
    const sat = await lab('saturation')
    const result = sat.render(nothing, { curve: HARD })
    const once = result.taps.smallAdaa1x!
    expectWritten(-at(once, 10_000), '2 dB')
    expectWritten(-at(once, 20_000), '11.7 dB')
    const four = result.taps.smallAdaa4x!
    expectWritten(-at(four, 20_000), '0.5 dB')
    // The mean of two samples is a cosine of the frequency against the rate the curve runs at.
    const law = (hz: number, rate: number) => gainToDb(Math.cos((Math.PI * hz) / rate))
    for (const hz of [2000, 5000, 10_000, 15_000, 20_000]) {
      expect(Math.abs(at(once, hz) - law(hz, RATE))).toBeLessThan(0.05)
      expect(Math.abs(at(result.taps.smallAdaa2x!, hz) - law(hz, 96_000))).toBeLessThan(0.05)
      expect(Math.abs(at(four, hz) - law(hz, 192_000))).toBeLessThan(0.05)
      // The plain curve leaves a quiet signal alone.
      expect(Math.abs(at(result.taps.smallPlain!, hz))).toBeLessThan(0.01)
    }
  })

  it('closes the high cut of Tape as Drive rises: a quiet signal is 2.0 dB down at 20 kHz with Drive at 0 dB and 8.3 dB down with it at 36 dB (claim tape-cut)', async () => {
    const sat = await lab('saturation')
    const down = (driveDb: number) =>
      -at(sat.render(nothing, { curve: TAPE, driveDb }).taps.smallPlain!, 20_000)
    expectWritten(down(0), '2.0 dB')
    expectWritten(down(36), '8.3 dB')
    // No other curve has the cut.
    expect(
      Math.abs(at(sat.render(nothing, { curve: SOFT, driveDb: 36 }).taps.smallPlain!, 20_000)),
    ).toBeLessThan(0.01)
  })

  it('tilts about 1 kHz: with Tone at 6 dB a tone at 100 Hz comes out 5.8 dB lower, one at 10 kHz 5.9 dB higher and one at 1 kHz 0.0 dB from where it was (claim tone-tilt)', async () => {
    const sat = await lab('saturation')
    const tilt = sat.render(nothing, { toneDb: 6 }).taps.toneResponse!
    expectWritten(-at(tilt, 100), '5.8 dB')
    expectWritten(at(tilt, 10_000), '5.9 dB')
    expectWritten(at(tilt, 1000), '0.0 dB')
    // Down is the same picture turned over.
    const dark = sat.render(nothing, { toneDb: -6 }).taps.toneResponse!
    expectWritten(at(dark, 100), '5.8 dB')
    expectWritten(-at(dark, 10_000), '5.9 dB')
    // The tap after Tone is that filter on the curve's output: at 0 dB the two are the same to
    // the last bit but one.
    const flat = sat.render(tone(), {})
    expect(differenceDb(tap(flat, 'toned'), tap(flat, 'shaped'))).toBeLessThan(-120)
  })

  it('is the input, sample for sample, with the mix at 0 (claim mix-zero)', async () => {
    const sat = await lab('saturation')
    const drums = await benchSource('drums', seconds(2))
    const result = sat.render(drums, { mix: 0, driveDb: 30, curve: FOLD, outputDb: 12 })
    for (const c of [0, 1]) {
      const dry = result.taps.in!.channels_data[c]!
      expect(result.taps.out!.channels_data[c]!.every((v, i) => v === dry[i])).toBe(true)
    }
  })

  it('at a mix of one half brings the third harmonic of a 1 kHz tone out 6.0 dB lower and the fundamental less than 2 dB lower (claim mix-half)', async () => {
    const sat = await lab('saturation')
    const whole = tap(sat.render(tone(), {}), 'out')
    const half = tap(sat.render(tone(), { mix: 0.5 }), 'out')
    expectWritten(harmonicDb(whole, 1000, 3) - harmonicDb(half, 1000, 3), '6.0 dB')
    expectWritten(harmonicDb(whole, 1000, 1) - harmonicDb(half, 1000, 1), 'less than 2 dB')
    expect(harmonicDb(whole, 1000, 1) - harmonicDb(half, 1000, 1)).toBeGreaterThan(1)
  })

  it('has a meter of its own on the input and on the output, and takes away what its difference tap says', async () => {
    const sat = await lab('saturation')
    // A sine of peak 0.25 on both channels has a mean square of 1/32: −15.05 dB.
    const result = sat.render(tone(2), { driveDb: 0, curve: HARD, outputDb: 0 })
    const going = tap(result, 'meterIn')
    expectWritten(mean(going, going.length / 2), '−15.1 dB')
    // Hard at no drive is a wire for a sound under full scale: the same level comes out.
    const coming = tap(result, 'meterOut')
    expectWritten(mean(coming, coming.length / 2), '−15.1 dB')
    // The last sound the main path writes is the output: a card with no tap of its own plays it.
    const sounds = sat.description.taps.filter(
      (one) => one.kind === 'audio' && !one.id.startsWith('built'),
    )
    expect(sounds.at(-1)!.id).toBe('out')
  })

  // ---- the build part ------------------------------------------------------------------------

  it("with all seven pieces is the device's own output: the last step is the one compared, the bound is −120 dB, and the two are the same sample for sample (claim build-same)", async () => {
    const sat = await lab('saturation')
    const tried: Record<string, number>[] = [
      {},
      { curve: HARD, adaa: 1, dcBlock: 1, bias: 0.3, toneDb: 6, mix: 0.5 },
      { curve: TUBE, oversample: X2, dcBlock: 1, toneDb: -6, outputDb: 3 },
      { curve: TAPE, driveDb: 30, oversample: X1, bias: -0.5, mix: 0.3 },
      { curve: FOLD, driveDb: 36, dcBlock: 1, bias: 0.7, toneDb: 12 },
    ]
    // Every loop the page offers, and the bench's test signals.
    for (const id of [...LOOPS, 'sine', 'saw', 'sweep', 'clicks', 'noise']) {
      const source = await benchSource(id, seconds(2))
      for (const values of tried) {
        const result = sat.render(source, { ...values, build: 6 })
        expect(result.checks.builtStep).toBe(6)
        expect(result.checks.builtBound).toBe(-120)
        expect(result.checks.builtDifference).toBeLessThan(-120)
        const out = tap(result, 'out')
        expect(tap(result, 'built').every((v, i) => v === out[i])).toBe(true)
        // Whatever step the reader is on, the build with every piece is what is compared.
        if (id === 'guitar') {
          const earlier = sat.render(source, { ...values, build: 2 })
          expect(earlier.checks.builtStep).toBe(6)
          expect(earlier.checks.builtDifference).toBeLessThan(-120)
        }
      }
    }
    // A tone after a silence: the device sleeps in the silence and forgets, and the build
    // forgets with it.
    const rested = silence(seconds(2))
    rested.left.set(tone().left, seconds(1))
    rested.right.set(tone().right, seconds(1))
    const woken = sat.render(rested, { build: 6, bias: 0.4, adaa: 1, dcBlock: 1, toneDb: 6 })
    expect(woken.checks.builtDifference).toBeLessThan(-120)
    expect(tap(woken, 'built').every((v, i) => v === tap(woken, 'out')[i])).toBe(true)
  })

  it('is the Soft curve and nothing else at the first step: the guitar comes out a sample for a sample as tanh of what went in, 39 samples on', async () => {
    const sat = await lab('saturation')
    const guitar = await benchSource('guitar', seconds(2))
    // Drive, Output and every later control turned: none of them is built yet.
    const result = sat.render(guitar, { build: 0, driveDb: 30, outputDb: -20, bias: 0.5, mix: 0.2 })
    const dry = tap(result, 'in')
    expect(tap(result, 'built').every((v, i) => Math.abs(v - Math.tanh(dry[i]!)) < 1e-6)).toBe(true)
    // The guitar hardly reaches the bend: it comes out less than 1 dB lower at its loudest.
    expect(topOf(result, 'in') - topOf(result, 'built')).toBeLessThan(1)
    expect(Math.abs(levelOf(result, 'in') - levelOf(result, 'built'))).toBeLessThan(0.1)
  })

  it('at the second step, with Drive at 18 dB and Output at −9 dB, brings the guitar out more than 6 dB higher in level with its loudest sample 2.0 dB lower, where the step before changed the level by less than 0.1 dB (claim build-drive)', async () => {
    const sat = await lab('saturation')
    const guitar = await benchSource('guitar', seconds(2))
    const lifted = (build: number) => {
      const result = sat.render(guitar, { build, driveDb: 18, outputDb: -9 })
      return {
        level: levelOf(result, 'built') - levelOf(result, 'in'),
        top: topOf(result, 'in') - topOf(result, 'built'),
      }
    }
    expectWritten(lifted(1).level, 'more than 6 dB')
    expectWritten(lifted(1).top, '2.0 dB')
    // The piece out: the step before leaves the level where it was and the top less far down.
    expectWritten(Math.abs(lifted(0).level), 'less than 0.1 dB')
    expect(matchesWritten(lifted(0).level, 'more than 6 dB')).toBe(false)
    expect(matchesWritten(lifted(0).top, '2.0 dB')).toBe(false)
    // The picture of the step: a level held at 0.25 comes out of the build at 0.34, which is
    // the 0.96 of the curve times the Output.
    expectWritten(at(sat.render(nothing, { build: 1 }).taps.builtCurve!, 0.25), '0.34')
  })

  it('at the third step, with Bias at 0.3, puts a second harmonic 19.3 dB under the fundamental of a 1 kHz tone and moves the middle of the wave to −0.065, where the step before had neither (claim build-bias)', async () => {
    const sat = await lab('saturation')
    const made = (build: number) => {
      const result = sat.render(tone(2), { build, bias: 0.3 })
      const lies = tap(result, 'builtOffset')
      return {
        second: -over(tap(result, 'built'), 1000, 2),
        middle: mean(tap(result, 'built')),
        metered: mean(lies, lies.length / 2),
      }
    }
    expectWritten(made(2).second, '19.3 dB')
    expectWritten(made(2).middle, '−0.065')
    expectWritten(made(2).metered, '−0.065')
    // The piece out: no second harmonic at all, and a wave that lies about zero.
    expect(matchesWritten(made(1).second, '19.3 dB')).toBe(false)
    expect(made(1).second).toBeGreaterThan(120)
    expect(matchesWritten(made(1).middle, '−0.065')).toBe(false)
    expect(Math.abs(made(1).middle)).toBeLessThan(1e-6)
    // Silence in is still silence out: what the curve makes of the bias alone is taken off.
    const quiet = sat.render(silence(seconds(0.5)), { build: 2, bias: 0.3 })
    expect(tap(quiet, 'built').every((v) => v === 0)).toBe(true)
  })

  it('at the fourth step brings what folds of the 5 kHz probe back below 20 kHz from −23 dB to −111 dB at 4x, and to −56.5 dB at 2x, where the step before reads −23 dB whatever Oversampling says (claim build-oversample)', async () => {
    const sat = await lab('saturation')
    const folds = (build: number, oversample: number) =>
      sat.render(nothing, { build, oversample, probe: 5000 }).checks.builtAlias!
    expectWritten(folds(3, X1), '−23 dB')
    expectWritten(folds(3, X2), '−56.5 dB')
    expectWritten(folds(3, X4), '−111 dB')
    // The piece out: the control is there and nothing reads it.
    for (const oversample of [X1, X2, X4]) {
      expectWritten(folds(2, oversample), '−23 dB')
      expect(matchesWritten(folds(2, oversample), '−111 dB')).toBe(false)
      expect(matchesWritten(folds(2, oversample), '−56.5 dB')).toBe(false)
    }
    // The build's count is the device's own: the same tone through the device reads the same.
    const device = sat.render(nothing, { build: 3, oversample: X4, probe: 5000 }).checks
    expect(Math.abs(device.aliasSet! - folds(3, X4))).toBeLessThan(0.01)
  })

  it('at the fifth step, on the Hard curve at 4x with ADAA on, brings what folds of the 5 kHz probe from −48.5 dB to −73 dB (claim build-mean)', async () => {
    const sat = await lab('saturation')
    const folds = (build: number, adaa: number) =>
      sat.render(nothing, { build, curve: HARD, oversample: X4, adaa, probe: 5000 }).checks
        .builtAlias!
    expectWritten(folds(4, 1), '−73 dB')
    expectWritten(folds(4, 0), '−48.5 dB')
    // The piece out: ADAA is on and nothing reads it.
    expectWritten(folds(3, 1), '−48.5 dB')
    expect(matchesWritten(folds(3, 1), '−73 dB')).toBe(false)
  })

  it('at the sixth step, with DC Block on, brings the middle of a 1 kHz tone through Tube from 0.034 to less than 0.000001 (claim build-dc)', async () => {
    const sat = await lab('saturation')
    const middle = (build: number, dcBlock: number) =>
      mean(tap(sat.render(tone(2), { build, curve: TUBE, dcBlock }), 'built'))
    expectWritten(middle(5, 0), '0.034')
    expectWritten(Math.abs(middle(5, 1)), 'less than 0.000001')
    // The piece out: DC Block is on and the middle stays where the curve put it.
    expectWritten(middle(4, 1), '0.034')
    expect(matchesWritten(Math.abs(middle(4, 1)), 'less than 0.000001')).toBe(false)
  })

  it("at the seventh step, with Tone at 6 dB, brings the fundamental of the page's sine out 3.7 dB lower and its seventh harmonic 4.6 dB higher, where the step before moved neither (claim build-tone)", async () => {
    const sat = await lab('saturation')
    const sineWave = await benchSource('sine', seconds(2))
    const flat = tap(sat.render(sineWave, { build: 6 }), 'built')
    const moved = (build: number) => {
      const built = tap(sat.render(sineWave, { build, toneDb: 6 }), 'built')
      return {
        first: harmonicDb(flat, 440, 1) - harmonicDb(built, 440, 1),
        seventh: harmonicDb(built, 440, 7) - harmonicDb(flat, 440, 7),
      }
    }
    expectWritten(moved(6).first, '3.7 dB')
    expectWritten(moved(6).seventh, '4.6 dB')
    // The piece out: Tone is turned and nothing reads it.
    expect(matchesWritten(moved(5).first, '3.7 dB')).toBe(false)
    expect(matchesWritten(moved(5).seventh, '4.6 dB')).toBe(false)
    expect(Math.abs(moved(5).first)).toBeLessThan(1e-6)
    // And Mix: at 0 the last step is the sound as it went in, and the step before is not.
    const dry = tap(sat.render(sineWave, { build: 6, mix: 0 }), 'in')
    expect(
      tap(sat.render(sineWave, { build: 6, mix: 0 }), 'built').every((v, i) => v === dry[i]),
    ).toBe(true)
    expect(
      tap(sat.render(sineWave, { build: 5, mix: 0 }), 'built').some((v, i) => v !== dry[i]),
    ).toBe(true)
  })

  // ---- the named sets: what each card plays, and the number its card states -------------------

  it('renders every named set on its own source, finite, heard, and with its loudest sample under full scale', async () => {
    const sat = await lab('saturation')
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = await played(sat, name)
      const sound = set.tap ?? 'out'
      expect(
        tap(result, sound).every((v) => Number.isFinite(v)),
        name,
      ).toBe(true)
      expect(levelOf(result, sound), `${name} is heard`).toBeGreaterThan(-40)
      expect(topOf(result, sound), `${name} fits`).toBeLessThan(0)
    }
  })

  it('states what each card of part 3 does to the height of its sound over its level: 17.1 dB to 12.2 dB on the line (claim use-lead), 17.4 dB to 10.8 dB on the bass (claim use-bass), 19.2 dB to 14.1 dB on the drums with the loudest sample 2.0 dB lower (claim use-drums), more than 17 dB to 14.0 dB on the mix with the level 3.6 dB and the loudest sample 0.1 dB higher (claim use-mix)', async () => {
    const sat = await lab('saturation')
    const lead = await played(sat, 'lead')
    expectWritten(crest(lead, 'in'), '17.1 dB')
    expectWritten(crest(lead, 'out'), '12.2 dB')
    const bass = await played(sat, 'bass')
    expectWritten(crest(bass, 'in'), '17.4 dB')
    expectWritten(crest(bass, 'out'), '10.8 dB')
    const drums = await played(sat, 'drums')
    expectWritten(crest(drums, 'in'), '19.2 dB')
    expectWritten(crest(drums, 'out'), '14.1 dB')
    expectWritten(topOf(drums, 'in') - topOf(drums, 'out'), '2.0 dB')
    const bus = await played(sat, 'bus')
    expectWritten(crest(bus, 'in'), 'more than 17 dB')
    expectWritten(crest(bus, 'out'), '14.0 dB')
    expectWritten(levelOf(bus, 'out') - levelOf(bus, 'in'), '3.6 dB')
    expectWritten(topOf(bus, 'out') - topOf(bus, 'in'), '0.1 dB')
  })

  it('folds a plain tone into another: with Drive at 18 dB the third harmonic stands 1.9 dB over the fundamental, at 20 dB 25.6 dB over it, and at 12 dB, where the tone stays under the fold, every harmonic is more than 120 dB under (claim use-fold)', async () => {
    const sat = await lab('saturation')
    expectWritten(over(tap(await played(sat, 'folded'), 'out'), 440, 3), '1.9 dB')
    expectWritten(over(tap(await played(sat, 'folded', { driveDb: 20 }), 'out'), 440, 3), '25.6 dB')
    const under = tap(await played(sat, 'folded', { driveDb: 12 }), 'out')
    for (const k of [2, 3, 5, 7, 9]) expectWritten(-over(under, 440, k), 'more than 120 dB')
  })

  it('with Output at −15.6 dB brings the guitar out less than 0.1 dB from the level it went in at, its loudest sample 8.6 dB lower (claim way-matched)', async () => {
    const sat = await lab('saturation')
    const result = await played(sat, 'matched')
    expectWritten(Math.abs(levelOf(result, 'out') - levelOf(result, 'in')), 'less than 0.1 dB')
    expectWritten(topOf(result, 'in') - topOf(result, 'out'), '8.6 dB')
  })

  it('blended under the drums at a mix of 0.3, leaves the loudest sample 1.2 dB lower and standing 15.8 dB over the level where it stood 19.2 dB over it; the bent copy alone stands 9.4 dB over its level (claim way-under)', async () => {
    const sat = await lab('saturation')
    const result = await played(sat, 'under')
    expectWritten(topOf(result, 'in') - topOf(result, 'out'), '1.2 dB')
    expectWritten(crest(result, 'in'), '19.2 dB')
    expectWritten(crest(result, 'out'), '15.8 dB')
    expectWritten(crest(await played(sat, 'under', { mix: 1 }), 'out'), '9.4 dB')
  })

  it("with Bias at 0.3 gives the page's sine a second harmonic 20.0 dB under the fundamental, where at 0 it has none (claim way-lean)", async () => {
    const sat = await lab('saturation')
    expectWritten(-over(tap(await played(sat, 'lean'), 'out'), 440, 2), '20.0 dB')
    expect(over(tap(await played(sat, 'lean', { bias: 0 }), 'out'), 440, 2)).toBeLessThan(-120)
    // DC Block on: the wave lies about zero again.
    expect(Math.abs(mean(tap(await played(sat, 'lean'), 'out')))).toBeLessThan(1e-4)
  })

  it('makes of two tones 100 Hz apart, at 1,000 Hz and 1,100 Hz, tones that neither is: on Soft, at 900 Hz and 1,200 Hz, 17.5 dB under each; on Tube also at 100 Hz, 21 dB under (claim imd)', async () => {
    const sat = await lab('saturation')
    const chord = twoTones()
    const soft = tap(sat.render(chord, { curve: SOFT }), 'shaped')
    const under = (x: Float32Array, hz: number) => harmonicDb(x, 1000, 1) - harmonicDb(x, hz, 1)
    expectWritten(under(soft, 900), '17.5 dB')
    expectWritten(under(soft, 1200), '17.5 dB')
    // A curve that treats both signs alike makes no tone at the difference of the two.
    expect(under(soft, 100)).toBeGreaterThan(120)
    const tube = tap(sat.render(chord, { curve: TUBE }), 'shaped')
    expectWritten(under(tube, 100), '21 dB')
    // Going in there was nothing at any of the three.
    for (const hz of [100, 900, 1200]) expect(under(chord.left, hz)).toBeGreaterThan(120)
  })

  it('peaks 1.1 dB over the ceiling on the saw through the Hard curve at 4x, and at exactly 1 at 1x (claim overshoot)', async () => {
    const sat = await lab('saturation')
    const four = await played(sat, 'over')
    expectWritten(topOf(four, 'shaped'), '1.1 dB')
    expect(peak(tap(four, 'shaped1x'))).toBe(1)
  })

  it('peaks 2.4 dB over on the drums at 36 dB of drive through the Hard curve at 4x (claim overshoot-drums)', async () => {
    const sat = await lab('saturation')
    const drums = await benchSource('drums', seconds(2))
    const four = sat.render(drums, { curve: HARD, driveDb: 36, oversample: X4 })
    expectWritten(topOf(four, 'shaped'), '2.4 dB')
    expect(peak(tap(four, 'shaped1x'))).toBe(1)
  })

  it('puts its tile inside the band on every loop: between −36 dB and −5 dB at the settings the tile plays', async () => {
    const sat = await lab('saturation')
    const { values } = resolveSet(sat.description, { values: settings.tile!.values })
    for (const id of LOOPS) {
      const result = sat.render(await benchSource(id, seconds(2)), values)
      const level = levelOf(result, settings.tile!.tap)
      expect(level, id).toBeGreaterThan(-36)
      expect(level, id).toBeLessThan(-5)
    }
    // The tile's picture is the rising sine at the base rate, whatever Oversampling says: the
    // same picture the device as set draws at 1x, and not the one it draws at 4x.
    const same = (a: Float32Array, b: Float32Array) => a.every((v, i) => v === b[i])
    const tile = tap(sat.render(nothing, values), 'rising1x')
    expect(settings.tile!.picture.taps).toEqual(['rising1x'])
    expect(same(tile, tap(sat.render(nothing, { oversample: X1 }), 'rising'))).toBe(true)
    expect(same(tile, tap(sat.render(nothing, { oversample: X4 }), 'rising'))).toBe(false)
  })

  it("starts the page's device table from the device's own defaults: the settings file's defaults, laid over the lab's starting values, are device.json's", async () => {
    const sat = await lab('saturation')
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/saturator/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const { values } = resolveSet(sat.description, { values: settings.defaults!.values })
    // The probe tone is the lab's own and no parameter of the device.
    const { probe: _probe, ...own } = values
    expect(own).toEqual(Object.fromEntries(device.params.map((one) => [one.key, one.default])))
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(settings.defaults!.values)) {
      expect(sat.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
  })
})
