import { describe, expect, it } from 'vitest'
import { expectSoundLab, lab, peak, seconds, silence } from './support.ts'

const RATE = 48_000

// Nothing goes in: the lab plays the note itself. Its key goes down 10 ms into the loop.
const nothing = () => silence(seconds(4))
const DOWN = 480
/** The point of a control tap that stands `s` seconds after the key went down. */
const tick = (s: number) => Math.round((s * RATE + DOWN) / 16)

/** The size, in dB, of the part of `x` that turns at `hz`, under a Hann window `length` long. */
function sizeDb(x: Float32Array, hz: number, from: number, length: number): number {
  const w = (2 * Math.PI * hz) / RATE
  let re = 0
  let im = 0
  for (let n = 0; n < length; n += 1) {
    const v = x[from + n]! * (0.5 - 0.5 * Math.cos((2 * Math.PI * n) / length))
    re += v * Math.cos(w * n)
    im -= v * Math.sin(w * n)
  }
  return 10 * Math.log10(Math.max(re * re + im * im, 1e-300)) - 20 * Math.log10(length / 4)
}

/**
 * The frequency between `lo` and `hi` at which the window holds the most: forty steps across,
 * then closed in on by golden section. With a window a second long this is a transform of
 * 48,000 points read between its bins.
 */
function peakHz(x: Float32Array, lo: number, hi: number, from: number, length: number): number {
  const step = (hi - lo) / 40
  let best = lo
  let top = -Infinity
  for (let hz = lo; hz <= hi; hz += step) {
    const size = sizeDb(x, hz, from, length)
    if (size > top) {
      top = size
      best = hz
    }
  }
  let a = best - step
  let b = best + step
  const golden = (Math.sqrt(5) - 1) / 2
  for (let i = 0; i < 40; i += 1) {
    const c = b - golden * (b - a)
    const d = a + golden * (b - a)
    if (sizeDb(x, c, from, length) > sizeDb(x, d, from, length)) b = d
    else a = c
  }
  return (a + b) / 2
}

const cents = (hz: number, reference: number) => 1200 * Math.log2(hz / reference)

/** How fast the part of `x` at `hz` falls, in dB a second, between two windows `apart` samples apart. */
const fall = (x: Float32Array, hz: number, from: number, apart: number, length = 4096) =>
  ((sizeDb(x, hz, from, length) - sizeDb(x, hz, from + apart, length)) * RATE) / apart

/** The largest step between neighbouring points. */
const steepest = (x: Float32Array) => {
  let most = 0
  for (let i = 1; i < x.length; i += 1) most = Math.max(most, Math.abs(x[i]! - x[i - 1]!))
  return most
}

const largest = (x: Float32Array) => {
  let at = 0
  x.forEach((v, i) => {
    if (Math.abs(v) > Math.abs(x[at]!)) at = i
  })
  return { at, value: x[at]! }
}

describe('lesson 19: the plucked string', () => {
  it('is a sound lab playing its own note: every tap says something, loops, and answers to every control', async () => {
    const string = await lab('19-plucked-string')
    const result = string.render(nothing(), {})
    expectSoundLab(string, nothing(), result)
  })

  it('plays a note at 220 Hz within 5 cents: the string 0.0005 cents off, the output 0.01 (claim in-tune)', async () => {
    const string = await lab('19-plucked-string')
    const out = string.render(nothing(), {})
    // A second of each from 0.1 s after the pluck, the peak of its transform found between the bins.
    const ofString = peakHz(out.taps.string!.channels_data[0]!, 218, 222, DOWN + 4800, RATE)
    const ofOutput = peakHz(out.taps.out!.channels_data[0]!, 218, 222, DOWN + 4800, RATE)
    expect(Math.abs(cents(ofString, 220))).toBeLessThan(0.005)
    expect(Math.abs(cents(ofOutput, 220))).toBeLessThan(0.05)
    // The lab's own measure, by the turn of the phase, agrees.
    expect(Math.abs(out.checks.cents!)).toBeLessThan(0.005)
  })

  it('is in tune at every note from 82 Hz to 880 Hz, within 0.02 cents (claim tuned-everywhere)', async () => {
    const string = await lab('19-plucked-string')
    const out = string.render(nothing(), {})
    const kit = out.taps.tuneKit!
    expect(kit.length).toBe(42)
    expect(kit.x0).toBeCloseTo(82.407, 2)
    expect(kit.x1).toBeCloseTo(880, 0)
    expect(Math.abs(largest(kit.channels_data[0]!).value)).toBeLessThan(0.02)
    for (const note of [82.41, 123.47, 311.13, 880]) {
      expect(Math.abs(string.render(nothing(), { note }).checks.cents!)).toBeLessThan(0.02)
    }
  })

  it('would be as much as 12.7 cents out with a line of whole samples (claim whole-samples), and 48 cents flat at 220 Hz with a line one period long (claim period-long)', async () => {
    const string = await lab('19-plucked-string')
    const out = string.render(nothing(), {})
    const whole = largest(out.taps.tuneWhole!.channels_data[0]!)
    expect(whole.at).toBe(40) // the G sharp under the top A
    expect(whole.value).toBeGreaterThan(12.4)
    expect(whole.value).toBeLessThan(13)
    const flat = out.taps.tuneFlat!.channels_data[0]!
    // Seventeen semitones over the low E is the A at 220 Hz.
    expect(flat[17]!).toBeGreaterThan(-48.5)
    expect(flat[17]!).toBeLessThan(-47.5)
    expect(flat.every((v) => v < -30)).toBe(true)
  })

  it('adds the line, its all-pass and the filters up to one period within 0.0001 of a sample (claim loop-adds-up)', async () => {
    const string = await lab('19-plucked-string')
    for (const values of [{}, { note: 82.41 }, { note: 880 }, { sustain: 1 }, { sustain: 30 }]) {
      expect(Math.abs(string.render(nothing(), values).checks.loopError!)).toBeLessThan(1e-4)
    }
  })

  it('takes 0.83 samples for the loop filter and 5.29 for the stiffness filter off a line of 212.06 at 220 Hz (claim delays-220)', async () => {
    const string = await lab('19-plucked-string')
    const { checks } = string.render(nothing(), {})
    expect(checks.lossDelay).toBeCloseTo(0.828, 2)
    expect(checks.stiffDelay).toBeCloseTo(5.293, 2)
    expect(checks.lineLength).toBeCloseTo(212.06, 1)
    // 48000 / 220 = 218.18 samples is the period they add up to.
    expect(checks.lossDelay! + checks.stiffDelay! + checks.lineLength!).toBeCloseTo(218.18, 1)
  })

  it('solves a pole of 0.453 and a gain of 0.9917 for the loop filter at 220 Hz (claim filter-220)', async () => {
    const string = await lab('19-plucked-string')
    const { checks, taps } = string.render(nothing(), {})
    expect(checks.lossPole).toBeCloseTo(0.453, 2)
    expect(checks.lossGain).toBeCloseTo(0.9917, 3)
    // One trip costs 0.078 dB at the note and 8.3 dB at 20 kHz.
    const curve = taps.loss!.channels_data[0]!
    expect(curve[curve.length - 1]!).toBeCloseTo(-8.3, 1)
    const at220 = Math.round((Math.log(220 / 20) / Math.log(1000)) * (curve.length - 1))
    expect(curve[at220]!).toBeCloseTo(-0.078, 2)
  })

  it('loses the fundamental at 17.1 dB a second (claim fall-first) and the tenth partial at 130 dB a second (claim fall-tenth)', async () => {
    const string = await lab('19-plucked-string')
    const out = string.render(nothing(), {})
    const x = out.taps.string!.channels_data[0]!
    // The fundamental from 50 ms after the pluck to 250 ms; the tenth partial, which is soon gone, from 30 ms to 80 ms.
    const first = fall(x, 220, DOWN + 2400, 9600)
    const tenthHz = peakHz(x, 2190, 2225, DOWN + 1440, 4096)
    const tenth = fall(x, tenthHz, DOWN + 1440, 2400)
    expect(first).toBeGreaterThan(16.9)
    expect(first).toBeLessThan(17.4)
    expect(tenth).toBeGreaterThan(128)
    expect(tenth).toBeLessThan(133)
    expect(tenth).toBeGreaterThan(7 * first)
    // The lab's own measure of both.
    const measured = out.taps.decayMeasured!.channels_data[0]!
    expect(measured[0]!).toBeCloseTo(first, 1)
    expect(measured[9]!).toBeCloseTo(tenth, 0)
  })

  it("measures each partial's fall within 0.01 % of what the loop filter and the trip's length give (claim fall-formula)", async () => {
    const string = await lab('19-plucked-string')
    const out = string.render(nothing(), {})
    expect(out.taps.decayMeasured!.length).toBe(16)
    expect(out.checks.decayError).toBeLessThan(0.01)
    // Every later partial falls faster than the one before.
    const measured = out.taps.decayMeasured!.channels_data[0]!
    expect(measured.every((v, k) => k === 0 || v > measured[k - 1]!)).toBe(true)
    // Elsewhere on the neck and with other settings, within 0.2 %.
    for (const values of [
      { note: 82.41 },
      { note: 110, position: 0.2 },
      { note: 440 },
      { sustain: 3 },
    ]) {
      expect(string.render(nothing(), values).checks.decayError).toBeLessThan(0.2)
    }
  })

  it('stands its tenth partial 6.3 cents above ten times the note, where the law says 6.5 (claim stretch-tenth)', async () => {
    const string = await lab('19-plucked-string')
    const out = string.render(nothing(), {})
    const tenthHz = peakHz(out.taps.string!.channels_data[0]!, 2190, 2225, DOWN + 1440, 4096)
    expect(cents(tenthHz, 2200)).toBeGreaterThan(6.1)
    expect(cents(tenthHz, 2200)).toBeLessThan(6.6)
    expect(out.taps.stretchMeasured!.channels_data[0]![9]!).toBeCloseTo(6.34, 1)
    // The law's line has ten points to a partial: the tenth partial is its 91st point.
    expect(out.taps.stretchLaw!.channels_data[0]![90]!).toBeCloseTo(6.45, 1)
    expect(Math.abs(out.taps.stretchMeasured!.channels_data[0]![0]!)).toBeLessThan(0.01)
  })

  it("holds the fifth partial 8 cents sharp with Sustain at 1 s, where the stiff string's law says 1.6 (claim loss-sharpens)", async () => {
    const string = await lab('19-plucked-string')
    const out = string.render(nothing(), { sustain: 1 })
    // At a Sustain of 1 s only the first five partials ring long enough to be measured.
    const measured = out.taps.stretchMeasured!
    expect(measured.length).toBe(5)
    expect(measured.channels_data[0]![4]!).toBeGreaterThan(7.5)
    expect(measured.channels_data[0]![4]!).toBeLessThan(9.5)
    expect(out.taps.stretchLaw!.channels_data[0]![40]!).toBeCloseTo(1.6, 1)
    // By a transform of the string itself: the fifth partial stands above 1100 Hz by as much.
    const hz = peakHz(out.taps.string!.channels_data[0]!, 1100, 1112, DOWN + 1440, 4096)
    expect(cents(hz, 1100)).toBeGreaterThan(7)
    expect(cents(hz, 1100)).toBeLessThan(10)
  })

  it('plucks with a rounded pulse: highest after 8 samples, half gone at 36, under a hundredth after 4.2 ms (claim pluck-shape)', async () => {
    const string = await lab('19-plucked-string')
    const whole = string.render(nothing(), {}).taps.pluck!.channels_data[0]!
    // Nothing before the key goes down.
    expect(peak(whole.subarray(0, DOWN))).toBe(0)
    const pluck = whole.subarray(DOWN)
    const top = largest(pluck.subarray(0, 2000))
    expect(top.at).toBe(8)
    expect(top.value).toBeGreaterThan(1.9)
    expect(top.value).toBeLessThan(2)
    let half = top.at
    while (pluck[half]! > top.value / 2) half += 1
    expect(half).toBe(36)
    let last = 0
    for (let i = 0; i < 4000; i += 1) if (Math.abs(pluck[i]!) > 0.01 * top.value) last = i
    expect(last).toBeGreaterThan(190)
    expect(last).toBeLessThan(205)
    // It pushes one way: what there is below zero is the pick's noise, under a two-hundredth of its height.
    expect(Math.min(...pluck.subarray(0, 2000))).toBeGreaterThan(-0.005 * top.value)
    // Nothing of it after 30 ms, when the exciter has stopped.
    expect(peak(pluck.subarray(1500))).toBe(0)
  })

  it('puts the second pluck 34 samples ahead of the first at the starting settings (claim pick-34), and the line grows smoother: its steepest step falls from 0.66 to 0.11 in twenty trips (claim smoother)', async () => {
    const string = await lab('19-plucked-string')
    const out = string.render(nothing(), {})
    expect(out.checks.pickSamples).toBe(34)
    const start = out.taps.lineStart!.channels_data[0]!
    const later = out.taps.lineLater!.channels_data[0]!
    expect(start.length).toBe(211)
    // The pluck's crest and its upside-down copy's stand a little over 34 samples apart.
    let crest = 0
    let trough = 0
    start.forEach((v, i) => {
      if (v > start[crest]!) crest = i
      if (v < start[trough]!) trough = i
    })
    expect(trough - crest).toBeGreaterThanOrEqual(34)
    expect(trough - crest).toBeLessThan(40)
    expect(steepest(start)).toBeCloseTo(0.66, 1)
    expect(steepest(later)).toBeCloseTo(0.11, 1)
    // And more trips, smoother still.
    const far = string.render(nothing(), { trips: 200 }).taps.lineLater!.channels_data[0]!
    expect(steepest(far)).toBeLessThan(steepest(later) / 2)
  })

  it('leaves the fifth partial 41 dB under the fourth with the pick a fifth of the way along an open string (claim pick-fifth)', async () => {
    const string = await lab('19-plucked-string')
    // The open A string, 110 Hz, where Position is the fraction of the sounding length.
    const out = string.render(nothing(), { note: 110, position: 0.2 })
    // A fifth of a period of 436.4 samples, to the nearest sample.
    expect(out.checks.pickSamples).toBe(87)
    const x = out.taps.string!.channels_data[0]!
    const size = (k: number) => {
      const hz = peakHz(x, 110 * k * 0.997, 110 * k * 1.006, DOWN, 4096)
      return sizeDb(x, hz, DOWN, 4096)
    }
    expect(size(4) - size(5)).toBeGreaterThan(38)
    expect(size(4) - size(5)).toBeLessThan(44)
    expect(size(6) - size(5)).toBeGreaterThan(30)
    // The tenth goes with it; the partials between do not.
    expect(size(9) - size(10)).toBeGreaterThan(30)
    for (const k of [2, 3, 6, 7, 8]) expect(size(1) - size(k)).toBeLessThan(15)
  })

  it("works the pickup's signal out again from the two strings, sample for sample (claim rebuilt-exact)", async () => {
    const string = await lab('19-plucked-string')
    for (const values of [
      {},
      { shimmer: 0.3 },
      { hold: 4 },
      { pickup: 0 },
      { note: 311.13, shimmer: 1.5 },
    ]) {
      expect(string.render(nothing(), values).checks.rebuilt).toBe(-140)
    }
  })

  it('falls slower as it rings, 16.6 dB a second and then 11.7, where the first string alone keeps to 18 and over (claim two-slopes)', async () => {
    const string = await lab('19-plucked-string')
    const out = string.render(nothing(), {})
    const note = out.taps.level!.channels_data[0]!
    const first = out.taps.levelOne!.channels_data[0]!
    const slope = (x: Float32Array, from: number, to: number) =>
      (x[tick(from)]! - x[tick(to)]!) / (to - from)
    expect(slope(note, 0.2, 0.7)).toBeCloseTo(16.6, 0)
    expect(slope(note, 2, 2.9)).toBeCloseTo(11.7, 0)
    expect(slope(first, 0.2, 0.7)).toBeCloseTo(20.2, 0)
    expect(slope(first, 2, 2.9)).toBeCloseTo(18.0, 0)
  })

  it('tunes the first string 0.15 Hz under the note with Shimmer at 0.3 Hz (claim shimmer-apart), and the note dips up to 6 dB under its in-tune self (claim beat)', async () => {
    const string = await lab('19-plucked-string')
    const still = string.render(nothing(), { hold: 4 })
    const beating = string.render(nothing(), { hold: 4, shimmer: 0.3 })
    const hz = peakHz(beating.taps.string!.channels_data[0]!, 219, 221, DOWN + 4800, RATE)
    expect(hz).toBeCloseTo(219.85, 2)
    const a = still.taps.level!.channels_data[0]!
    const b = beating.taps.level!.channels_data[0]!
    let deepest = 0
    for (let i = tick(0.2); i < tick(3.8); i += 1) deepest = Math.min(deepest, b[i]! - a[i]!)
    expect(deepest).toBeLessThan(-5.5)
    expect(deepest).toBeGreaterThan(-7)
    // One whole beat of the fundamental later, 3.33 s, the two strings are together again.
    expect(Math.abs(b[tick(3.333)]! - a[tick(3.333)]!)).toBeLessThan(0.3)
  })

  it('falls at about 450 dB a second once the key is let go (claim damped)', async () => {
    const string = await lab('19-plucked-string')
    const out = string.render(nothing(), { hold: 3 })
    const note = out.taps.level!.channels_data[0]!
    const rate = (note[tick(3.03)]! - note[tick(3.08)]!) / 0.05
    expect(rate).toBeGreaterThan(400)
    expect(rate).toBeLessThan(500)
    // Held to the loop's end it is still ringing there.
    const held = string.render(nothing(), { hold: 4 }).taps.level!.channels_data[0]!
    expect(held[tick(3.5)]!).toBeGreaterThan(-65)
    expect(note[tick(3.5)]!).toBe(-120)
  })

  it('comes out the same on both sides (claim mono)', async () => {
    const string = await lab('19-plucked-string')
    const out = string.render(nothing(), {}).taps.out!
    expect(out.channels_data[0]!.every((v, i) => v === out.channels_data[1]![i])).toBe(true)
  })
})
