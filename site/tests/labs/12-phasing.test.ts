import { describe, expect, it } from 'vitest'
import {
  benchSource,
  differenceDb,
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
const STAGES = [4, 6, 8, 10, 12]

/** The frequency point `i` of an `n`-point curve stands at: even ratios from 20 Hz to 20 kHz. */
const curveHz = (i: number, n: number) => 20 * 1000 ** (i / (n - 1))

/** A curve's value at a frequency, read between its two nearest points. */
function at(curve: Float32Array, hz: number): number {
  const place = ((curve.length - 1) * Math.log(hz / 20)) / Math.log(1000)
  const i = Math.min(curve.length - 2, Math.max(0, Math.floor(place)))
  return curve[i]! + (curve[i + 1]! - curve[i]!) * (place - i)
}

/**
 * The tops (`sign` 1) or the bottoms (−1) of a response: [hertz, dB] for each, placed by the
 * parabola through the point and its two neighbours.
 */
function turns(curve: Float32Array, sign: 1 | -1): [number, number][] {
  const out: [number, number][] = []
  for (let i = 1; i < curve.length - 1; i += 1) {
    const a = sign * curve[i - 1]!
    const b = sign * curve[i]!
    const c = sign * curve[i + 1]!
    if (!(b > a && b >= c)) continue
    const shift = (0.5 * (a - c)) / (a - 2 * b + c)
    out.push([curveHz(i + shift, curve.length), sign * (b - 0.25 * (a - c) * shift)])
  }
  return out
}

/** Where N stages on one corner put their notches: the formula of the lesson, with the bilinear warp. */
function notchHz(corner: number, stages: number, k: number): number {
  const t = Math.tan((Math.PI * corner) / RATE)
  return (RATE / Math.PI) * Math.atan(t * Math.tan(((2 * k - 1) * Math.PI) / (2 * stages)))
}

const still = { depth: 0 }
const levelDb = (x: Float32Array, from: number, to: number) => gainToDb(rms(x, from, to))

describe('lesson 12: phasing', () => {
  it('is a sound lab on the noise: every tap says something, loops, and answers to every control', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(4))
    const result = phasing.render(noise, {})
    expectSoundLab(phasing, noise, result)
  })

  it('is a sound lab on the saw and on the guitar chords too', async () => {
    const phasing = await lab('12-phasing')
    for (const id of ['saw', 'chords']) {
      const source = await benchSource(id, seconds(4))
      expectSoundLab(phasing, source, phasing.render(source, {}))
    }
  })

  it('turns one stage a quarter turn at its corner (claim quarter-turn), under 3 degrees at 20 Hz and 178 at 20 kHz (claim phase-ends)', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(1))
    const phase = phasing.render(noise, {}).taps.phase!.channels_data[0]!
    expect(at(phase, 800)).toBeCloseTo(-90, 2)
    expect(phase[0]!).toBeCloseTo(-2.86, 1)
    expect(phase[phase.length - 1]!).toBeCloseTo(-178.4, 1)
    // It only ever falls: more turn the higher the frequency.
    expect(phase.every((v, i) => i === 0 || v < phase[i - 1]!)).toBe(true)
  })

  it('measures the phase the formula gives, within a thousandth of a degree at any centre (claim phase-formula)', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(1))
    for (const centre of [100, 283, 800, 2263, 5000]) {
      expect(phasing.render(noise, { centre }).checks.phaseError).toBeLessThan(0.001)
    }
  })

  it('keeps every frequency at its level through the chain alone, within 0.001 dB (claim flat-level)', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(1))
    for (const stages of [0, 1, 2, 3, 4]) {
      for (const spread of [0, 30, 100]) {
        for (const centre of [100, 800, 5000]) {
          expect(phasing.render(noise, { stages, spread, centre }).checks.flat).toBeLessThan(0.001)
        }
      }
    }
  })

  it("gives the all-passed signal the input's spectrum: on the noise, bin for bin within 0.2 dB and as a whole within 0.001 dB (claim same-spectrum)", async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(4))
    for (const values of [{}, still]) {
      const out = phasing.render(noise, values)
      const before = phasing.spectrum('in')
      const after = phasing.spectrum('wet')
      let worst = 0
      // Bins from 23 Hz to 20 kHz, 11.7 Hz apart.
      for (let k = 2; k <= 1706; k += 1) worst = Math.max(worst, Math.abs(after[k]! - before[k]!))
      expect(worst).toBeLessThan(0.2)
      const whole =
        gainToDb(rms(out.taps.wet!.channels_data[0]!)) -
        gainToDb(rms(out.taps.in!.channels_data[0]!))
      expect(Math.abs(whole)).toBeLessThan(0.001)
    }
  })

  it('holds a 50 Hz tone back 1.59 ms through four stages at 800 Hz and leaves its level alone (claim low-delay)', async () => {
    const phasing = await lab('12-phasing')
    const tone = sine(50, 0.5, seconds(2))
    const out = phasing.render(tone, still)
    // The phase of each, by its sum against a sine and a cosine over 50 whole cycles.
    const angle = (x: Float32Array) => {
      let a = 0
      let b = 0
      for (let i = 24_000; i < 72_000; i += 1) {
        a += x[i]! * Math.sin((2 * Math.PI * 50 * i) / RATE)
        b += x[i]! * Math.cos((2 * Math.PI * 50 * i) / RATE)
      }
      return Math.atan2(b, a)
    }
    const wet = out.taps.wet!.channels_data[0]!
    const dry = out.taps.in!.channels_data[0]!
    const ms = ((angle(dry) - angle(wet)) / (2 * Math.PI * 50)) * 1000
    expect(ms).toBeGreaterThan(1.58)
    expect(ms).toBeLessThan(1.6)
    expect(Math.abs(levelDb(wet, 24_000, 72_000) - levelDb(dry, 24_000, 72_000))).toBeLessThan(
      0.001,
    )
  })

  it('brings a tone at the corner out of four stages as it went in, a whole turn on (claim whole-turn)', async () => {
    const phasing = await lab('12-phasing')
    const out = phasing.render(sine(800, 0.5, seconds(2)), still)
    const chain = out.taps.chainPhase!.channels_data[0]!
    expect(at(chain, 800)).toBeCloseTo(-360, 1)
    // The difference between the all-passed tone and the tone, against the tone: under −100 dB.
    expect(
      differenceDb(out.taps.wet!.channels_data[0]!, out.taps.in!.channels_data[0]!),
    ).toBeLessThan(-100)
  })

  it('has half as many notches as stages when the oscillator is still (claim notch-count)', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(4))
    for (const [choice, stages] of STAGES.entries()) {
      for (const spread of [0, 30]) {
        const out = phasing.render(noise, { ...still, stages: choice, spread })
        // Counted three ways. Where the chain's phase crosses an odd half turn:
        expect(out.taps.crossings!.length).toBe(stages / 2)
        // the dips of the sum's measured response:
        const dips = turns(out.taps.plain!.channels_data[0]!, -1).filter(([, db]) => db < -20)
        expect(dips.length).toBe(stages / 2)
        // and the stretches of the noise's own spectrum that come out more than 12 dB down.
        const before = phasing.spectrum('in')
        const after = phasing.spectrum('out')
        let runs = 0
        let inside = false
        for (let k = 2; k <= 1706; k += 1) {
          const under = after[k]! - before[k]! < -12
          if (under && !inside) runs += 1
          inside = under
        }
        expect(runs).toBe(stages / 2)
      }
    }
  })

  it('puts the notches of four stages at 800 Hz on 331.6 Hz (claim first-notch) and 1,923 Hz (claim second-notch), where the formula says', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(1))
    const four = phasing.render(noise, still).taps.crossings!.channels_data[0]!
    expect(four[0]!).toBeCloseTo(331.6, 1)
    expect(four[1]!).toBeCloseTo(1922.9, 1)
    // The formula, for every count of stages and three centres: within a hundredth of a hertz.
    for (const [choice, stages] of STAGES.entries()) {
      for (const centre of [283, 800, 2263]) {
        const found = phasing.render(noise, { ...still, stages: choice, centre }).taps.crossings!
          .channels_data[0]!
        const written = Array.from({ length: stages / 2 }, (_, i) => notchHz(centre, stages, i + 1))
        const shown = written.filter((hz) => hz >= 20 && hz <= 20_000)
        expect(found.length).toBe(shown.length)
        shown.forEach((hz, i) => expect(Math.abs(found[i]! - hz)).toBeLessThan(0.01))
      }
    }
  })

  it('brings a tone at the first notch out more than 90 dB down (claim notch-null), and one a hundredth higher only 37 dB down (claim notch-side)', async () => {
    const phasing = await lab('12-phasing')
    const level = (hz: number) => {
      const tone = sine(hz, 0.5, seconds(2))
      const out = phasing.render(tone, still).taps.out!.channels_data[0]!
      // The middle second, clear of the loop's join.
      return levelDb(out, 24_000, 72_000) - levelDb(tone.left, 24_000, 72_000)
    }
    expect(level(notchHz(800, 4, 1))).toBeLessThan(-90)
    expect(level(notchHz(800, 4, 2))).toBeLessThan(-90)
    const beside = level(notchHz(800, 4, 1) * 1.01)
    expect(beside).toBeGreaterThan(-38)
    expect(beside).toBeLessThan(-36)
  })

  it('reads the sum at half mix under −100 dB at every frequency where the phase crosses an odd half turn (claim null-depth)', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(1))
    for (const stages of [0, 1, 2, 3, 4]) {
      for (const spread of [0, 30, 100]) {
        expect(phasing.render(noise, { stages, spread }).checks.nullDepth).toBeLessThan(-100)
      }
    }
  })

  it('makes notches 6 dB deep at a mix of a quarter or three quarters (claim mix-quarter) and none at all at a mix of 1 (claim mix-one)', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(2))
    for (const mix of [0.25, 0.75]) {
      const plain = phasing.render(noise, { ...still, mix }).taps.plain!.channels_data[0]!
      expect(Math.min(...plain)).toBeCloseTo(-6.02, 1)
      expect(Math.max(...plain)).toBeCloseTo(0, 2)
    }
    const wet = phasing.render(noise, { ...still, mix: 1 })
    const plain = wet.taps.plain!.channels_data[0]!
    expect(Math.max(...plain) - Math.min(...plain)).toBeLessThan(0.001)
    // The output is then the all-passed signal, to the last bit but one.
    const out = wet.taps.out!.channels_data[0]!
    const allPassed = wet.taps.wet!.channels_data[0]!
    expect(out.every((v, i) => Math.abs(v - allPassed[i]!) < 1e-6)).toBe(true)
  })

  it('is the input, sample for sample, at a mix of 0 (claim mix-zero)', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(2))
    const out = phasing.render(noise, { mix: 0, feedback: 95, stages: 4 })
    const dry = out.taps.in!.channels_data[0]!
    expect(out.taps.out!.channels_data[0]!.every((v, i) => v === dry[i])).toBe(true)
  })

  it("stands the comb's notches 667 Hz apart, eighteen of them under 12 kHz (claim comb-even), where four stages have two, the second 5.8 times the first (claim notch-ratio)", async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(1))
    const out = phasing.render(noise, still)
    const comb = out.taps.comb!
    const levels = comb.channels_data[0]!
    const step = (comb.x1 - comb.x0) / (comb.length - 1)
    const notches: number[] = []
    for (let i = 1; i < levels.length - 1; i += 1) {
      if (levels[i]! < levels[i - 1]! && levels[i]! <= levels[i + 1]! && levels[i]! < -30)
        notches.push(comb.x0 + i * step)
    }
    expect(notches.length).toBe(18)
    // The first on the phaser's first, as near as a whole number of samples of delay allows.
    expect(Math.abs(notches[0]! - 331.6)).toBeLessThan(5)
    for (let i = 1; i < notches.length; i += 1) {
      expect(Math.abs(notches[i]! - notches[i - 1]! - 48_000 / 72)).toBeLessThan(5.1)
    }
    const four = out.taps.crossings!.channels_data[0]!
    expect(four.length).toBe(2)
    expect(four[1]! / four[0]!).toBeCloseTo(5.8, 2)
  })

  it('moves the notches of four stages to 329 and 1,939 Hz at a spread of 30 % (claim spread-30) and to 303 and 2,106 Hz at 100 % (claim spread-100)', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(1))
    const at30 = phasing.render(noise, { ...still, spread: 30 }).taps.crossings!.channels_data[0]!
    expect(Math.abs(at30[0]! - 329)).toBeLessThan(1)
    expect(Math.abs(at30[1]! - 1939)).toBeLessThan(1)
    const at100 = phasing.render(noise, { ...still, spread: 100 }).taps.crossings!.channels_data[0]!
    expect(Math.abs(at100[0]! - 303)).toBeLessThan(1)
    expect(Math.abs(at100[1]! - 2106)).toBeLessThan(1)
  })

  it('sweeps the corner from 283 Hz to 2,263 Hz at a depth of 60 % (claim sweep-range) and from 141 Hz to 4,525 Hz at 100 % (claim full-depth)', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(4))
    const at60 = phasing.render(noise, {}).taps.corner!.channels_data[0]!
    expect(Math.min(...at60)).toBeCloseTo(800 * 2 ** -1.5, 0)
    expect(Math.max(...at60)).toBeCloseTo(800 * 2 ** 1.5, 0)
    expect(Math.min(...at60)).toBeCloseTo(282.8, 0)
    expect(Math.max(...at60)).toBeCloseTo(2262.7, 0)
    const at100 = phasing.render(noise, { depth: 100 }).taps.corner!.channels_data[0]!
    expect(Math.min(...at100)).toBeCloseTo(141.4, 0)
    expect(Math.max(...at100) / 4525.5).toBeCloseTo(1, 3)
  })

  it('reads a corner of 28 kHz, over half the sample rate, at the top of a full sweep from 5 kHz (claim corner-over)', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(4))
    const corner = phasing.render(noise, { centre: 5000, depth: 100 }).taps.corner!
      .channels_data[0]!
    const top = Math.max(...corner)
    expect(top).toBeGreaterThan(24_000)
    expect(top / (5000 * 2 ** 2.5)).toBeCloseTo(1, 3)
    expect(Math.abs(top - 28_284)).toBeLessThan(30)
  })

  it('brings the oscillator round once in the four-second loop at 0.25 Hz, up first (claim one-cycle)', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(4))
    const lfo = phasing.render(noise, {}).taps.lfo!.channels_data[0]!
    // A point every 16 samples: 3,000 a second.
    expect(lfo[3000]!).toBeCloseTo(1, 4)
    expect(lfo[9000]!).toBeCloseTo(-1, 4)
    let risings = 0
    for (let i = 1; i < lfo.length; i += 1) if (lfo[i - 1]! < 0 && lfo[i]! >= 0) risings += 1
    expect(risings + (lfo[lfo.length - 1]! < 0 && lfo[0]! >= 0 ? 1 : 0)).toBe(1)
  })

  it('sweeps the first notch through a 331.5 Hz tone twice a cycle, each time the corner passes 800 Hz (claim sweep-null)', async () => {
    const phasing = await lab('12-phasing')
    const tone = sine(331.5, 0.5, seconds(4))
    const out = phasing.render(tone, {})
    const sound = out.taps.out!.channels_data[0]!
    const corner = out.taps.corner!.channels_data[0]!
    const full = gainToDb(0.5 / Math.SQRT2)
    // The level in stretches of 10 ms.
    const levels: number[] = []
    for (let from = 0; from + 480 <= sound.length; from += 480)
      levels.push(levelDb(sound, from, from + 480) - full)
    const dips = levels.flatMap((level, k) => {
      const before = levels[(k + levels.length - 1) % levels.length]!
      const after = levels[(k + 1) % levels.length]!
      return level < before && level <= after && level < -20 ? [k] : []
    })
    expect(dips.length).toBe(2)
    for (const k of dips) {
      expect(levels[k]!).toBeLessThan(-30)
      // The corner in the middle of that stretch: 800 Hz, within 3 %.
      expect(corner[Math.round(((k + 0.5) * 480) / 16) % corner.length]! / 800).toBeGreaterThan(
        0.97,
      )
      expect(corner[Math.round(((k + 0.5) * 480) / 16) % corner.length]! / 800).toBeLessThan(1.03)
    }
    // Between the two, with the corner at either end of its sweep, the tone is back within 2 dB.
    expect(Math.abs(levels[100]!)).toBeLessThan(2)
    expect(Math.abs(levels[300]!)).toBeLessThan(2)
  })

  it('lets the corner cover 63 % of a jump of the square wave, in octaves, in 3 ms (claim sweep-lag)', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(4))
    // Shape 2 of the lab's four is the square.
    const corner = phasing.render(noise, { shape: 2 }).taps.corner!.channels_data[0]!
    // The square falls half way through the loop, at point 6,000.
    const high = corner[5900]!
    const low = corner[6600]!
    expect(high).toBeCloseTo(2262.7, 0)
    expect(low).toBeCloseTo(282.8, 0)
    const covered = (k: number) => Math.log2(high / corner[k]!) / Math.log2(high / low)
    let start = 5990
    while (covered(start) < 1e-3) start += 1
    let k = start
    while (covered(k) < 1 - Math.exp(-1)) k += 1
    const ms = ((k - start) * 16 * 1000) / RATE
    // A point of the tap is a third of a millisecond.
    expect(ms).toBeGreaterThan(2.6)
    expect(ms).toBeLessThan(3.4)
  })

  it('puts the right side a quarter of a cycle, one second at 0.25 Hz, ahead of the left at a stereo offset of 90 degrees (claim stereo-quarter)', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(4))
    const out = phasing.render(noise, { stereo: 90 })
    const top = (x: Float32Array) => (x.indexOf(Math.max(...x)) * 16) / RATE
    const left = top(out.taps.corner!.channels_data[0]!)
    const right = top(out.taps.cornerRight!.channels_data[0]!)
    expect(left).toBeCloseTo(1, 1)
    expect((left - right + 4) % 4).toBeCloseTo(1, 1)
    // With no offset the two sides are one.
    const together = phasing.render(noise, {})
    const one = together.taps.corner!.channels_data[0]!
    expect(together.taps.cornerRight!.channels_data[0]!.every((v, i) => v === one[i])).toBe(true)
  })

  it('lifts a peak of 2.5 dB between the notches at a feedback of 40 %, fills the notches to −17 dB and moves the upper one to 2,034 Hz (claim feedback-40)', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(1))
    const response = phasing.render(noise, { ...still, feedback: 40 }).taps.response!
      .channels_data[0]!
    const tops = turns(response, 1)
    const bottoms = turns(response, -1)
    // One peak between the notches and one above them.
    expect(tops.length).toBe(2)
    expect(tops[0]![0]).toBeGreaterThan(770)
    expect(tops[0]![0]).toBeLessThan(800)
    expect(tops[0]![1]).toBeCloseTo(2.49, 1)
    expect(tops[1]![0]).toBeGreaterThan(7000)
    expect(bottoms.length).toBe(2)
    expect(bottoms[0]![1]).toBeCloseTo(-16.9, 0)
    expect(bottoms[1]![1]).toBeCloseTo(-17.2, 0)
    expect(bottoms[0]![0] / 334.6).toBeCloseTo(1, 2)
    expect(bottoms[1]![0] / 2034).toBeCloseTo(1, 2)
  })

  it('lifts the peaks to 20 dB at a feedback of 95 %, at 780 Hz and at 6.75 kHz (claim feedback-95)', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(1))
    const response = phasing.render(noise, { ...still, feedback: 95 }).taps.response!
      .channels_data[0]!
    const tops = turns(response, 1)
    expect(tops.length).toBe(2)
    expect(tops[0]![0] / 780).toBeCloseTo(1, 2)
    expect(tops[0]![1]).toBeGreaterThan(19.9)
    expect(tops[0]![1]).toBeLessThan(20.5)
    expect(tops[1]![0] / 6750).toBeCloseTo(1, 1)
    expect(tops[1]![1]).toBeGreaterThan(19.5)
    expect(tops[1]![1]).toBeLessThan(20.5)
  })

  it('turns the notches into peaks of 3.5 and 3.7 dB at a feedback of −75 %, at 326 and 1,753 Hz (claim feedback-negative)', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(1))
    const response = phasing.render(noise, { ...still, feedback: -75 }).taps.response!
      .channels_data[0]!
    const tops = turns(response, 1)
    expect(tops.length).toBe(2)
    expect(tops[0]![0] / 326).toBeCloseTo(1, 2)
    expect(tops[0]![1]).toBeCloseTo(3.5, 1)
    expect(tops[1]![0] / 1753).toBeCloseTo(1, 2)
    expect(tops[1]![1]).toBeCloseTo(3.7, 1)
    // What is left between them is shallow: nothing under −3.1 dB.
    expect(Math.min(...response)).toBeGreaterThan(-3.1)
  })

  it('all but cancels the notches at a feedback of −62 %: the response stays between −3.5 and +1.8 dB (claim feedback-flat)', async () => {
    const phasing = await lab('12-phasing')
    const noise = await benchSource('noise', seconds(1))
    const response = phasing.render(noise, { ...still, feedback: -62 }).taps.response!
      .channels_data[0]!
    expect(Math.min(...response)).toBeGreaterThan(-3.5)
    expect(Math.max(...response)).toBeLessThan(1.8)
  })

  it('brings a quiet tone at the peak up 19.9 times at a feedback of 95 % (claim loop-gain) and holds a full-scale one to 3.4 (claim loop-limit)', async () => {
    const phasing = await lab('12-phasing')
    const quiet = phasing.render(sine(781, 0.01, seconds(2)), { ...still, feedback: 95 })
    const gain = peak(quiet.taps.wet!.channels_data[0]!) / 0.01
    expect(gain).toBeGreaterThan(19.5)
    expect(gain).toBeLessThan(20)
    const loud = phasing.render(sine(781, 1, seconds(2)), { ...still, feedback: 95 })
    const top = peak(loud.taps.wet!.channels_data[0]!)
    expect(top).toBeGreaterThan(3.2)
    expect(top).toBeLessThan(3.6)
  })

  it('gives exact silence for silence while its oscillator goes on turning (claim sleeps)', async () => {
    const phasing = await lab('12-phasing')
    const nothing: Source = silence(seconds(4))
    const out = phasing.render(nothing, { feedback: 95 })
    expect(out.taps.out!.channels_data[0]!.every((v) => v === 0)).toBe(true)
    expect(out.taps.wet!.channels_data[0]!.every((v) => v === 0)).toBe(true)
    const lfo = out.taps.lfo!.channels_data[0]!
    expect(Math.max(...lfo)).toBeGreaterThan(0.999)
    expect(Math.min(...lfo)).toBeLessThan(-0.999)
  })
})
