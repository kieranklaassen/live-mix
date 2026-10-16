import { describe, expect, it } from 'vitest'
import {
  benchSource,
  expectSoundLab,
  lab,
  mean,
  peak,
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

const RATE = 48_000

/** Silence with one sample of `size` on both sides, `at` samples in. */
function click(frames: number, size = 0.01, at = 100): Source {
  const source = silence(frames)
  source.left[at] = size
  source.right[at] = size
  return source
}

/** Silence with 20 ms of a 1 kHz sine under a Hann window, `at` samples in. */
function burst(frames: number, size = 0.05, at = 100, length = 960): Source {
  const source = silence(frames)
  for (let i = 0; i < length; i += 1) {
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / length)
    const value = size * window * Math.sin((2 * Math.PI * 1000 * i) / RATE)
    source.left[at + i] = value
    source.right[at + i] = value
  }
  return source
}

function energy(x: Float32Array, from: number, to: number): number {
  let sum = 0
  for (let i = from; i < to; i += 1) sum += x[i]! * x[i]!
  return sum
}

const energyDb = (x: Float32Array, from: number, to: number, against: number) =>
  10 * Math.log10(Math.max(energy(x, from, to), 1e-30) / against)

/** Where the largest sample between `from` and `to` is. */
function peakAt(x: Float32Array, from = 0, to = x.length): number {
  let at = from
  for (let i = from; i < to; i += 1) if (Math.abs(x[i]!) > Math.abs(x[at]!)) at = i
  return at
}

/** A response the lab drew from 20 Hz to 20 kHz, read at one frequency. */
function at(curve: Float32Array, hz: number): number {
  const place = (Math.log(hz / 20) / Math.log(1000)) * (curve.length - 1)
  const i = Math.min(curve.length - 2, Math.floor(place))
  return curve[i]! + (curve[i + 1]! - curve[i]!) * (place - i)
}

const range = (x: Float32Array, from = 0, to = x.length) => {
  let lo = Infinity
  let hi = -Infinity
  for (let i = from; i < to; i += 1) {
    lo = Math.min(lo, x[i]!)
    hi = Math.max(hi, x[i]!)
  }
  return { lo, hi }
}

const cents = (ratio: number) => 1200 * Math.log2(ratio)

// The heads alone, one repeat: what went in comes back once.
const once = { feedback: 0, mix: 1 }
// The device's own defaults for the loop's filters.
const filtered = { highCut: 4500, lowCut: 120 }

describe('delay and echo', () => {
  it('is a sound lab on the clicks: every tap says something, loops, and answers to every control', async () => {
    const echo = await lab('delay-and-echo')
    const clicks = await benchSource('clicks', seconds(4))
    const result = echo.render(clicks, {})
    // A steady transport is a level line, and the first repeat has not met the filter.
    expectSoundLab(echo, clicks, result, { quiet: ['delay', 'speed', 'repeat1'] })
  })

  it('gives a sample back after Time, to the sample where Time is a whole number of them (claim returns)', async () => {
    const echo = await lab('delay-and-echo')
    for (const time of [30, 250, 1000, 2000]) {
      const heads = echo.render(click(seconds(4)), { ...once, time }).taps.heads!.channels_data[0]!
      expect(peakAt(heads)).toBe(100 + time * 48)
    }
    // 380 ms, the device's default, and a time that is not a whole number of samples: within one.
    for (const time of [380, 100.01]) {
      const heads = echo.render(click(seconds(4)), { ...once, time }).taps.heads!.channels_data[0]!
      expect(Math.abs(peakAt(heads) - (100 + time * 48))).toBeLessThan(1)
    }
  })

  it("reads the heads and the record path again from the device's own numbers, to the last bit (claim rebuilt)", async () => {
    const echo = await lab('delay-and-echo')
    const drums = await benchSource('drums', seconds(4))
    const busy = {
      heads: 2,
      spread: 0.6,
      wow: 1,
      flutter: 1,
      drive: 0.7,
      nudge: 80,
      feedback: 0.8,
      mix: 0.3,
      ...filtered,
    }
    for (const values of [{}, busy]) {
      const result = echo.render(drums, values)
      // −140 dB is the lab's word for "the same".
      expect(result.checks.heads).toBe(-140)
      expect(result.checks.record).toBe(-140)
    }
  })

  it('turns one sample into −1/16, 9/16, 9/16, −1/16 when Time ends in half a sample: the device reads by Hermite (claim device-hermite)', async () => {
    const echo = await lab('delay-and-echo')
    const result = echo.render(click(seconds(1)), { ...once, time: 12000.5 / 48 })
    const heads = result.taps.heads!.channels_data[0]!
    const four = Array.from(heads.subarray(12_099, 12_103), (v) => v / 0.01)
    // Time is a float: the delay is 12,000.501 samples, so the middle two are 0.561 and 0.564.
    const want = [-1 / 16, 9 / 16, 9 / 16, -1 / 16]
    four.forEach((value, i) => expect(Math.abs(value - want[i]!)).toBeLessThan(0.003))
    expect(peak(heads.subarray(0, 12_099))).toBe(0)
    expect(peak(heads.subarray(12_103))).toBe(0)
    // And as a filter, those four are the kit's half-sample curve: the same loss at 10 kHz.
    let re = 0
    let im = 0
    four.forEach((value, n) => {
      re += value * Math.cos((2 * Math.PI * 10_000 * n) / RATE)
      im -= value * Math.sin((2 * Math.PI * 10_000 * n) / RATE)
    })
    const loss = 10 * Math.log10(re * re + im * im)
    expect(
      Math.abs(loss - at(result.taps.responseHermite!.channels_data[0]!, 10_000)),
    ).toBeLessThan(0.02)
  })

  it('loses 2.0 dB at 10 kHz and 11.7 dB at 20 kHz to a linear read half way between samples (claim linear-half), and 0.53 dB and 8.4 dB to a Hermite read (claim hermite-half)', async () => {
    const echo = await lab('delay-and-echo')
    const half = echo.render(click(seconds(0.5)), { fraction: 0.5 })
    const linear = half.taps.responseLinear!.channels_data[0]!
    const hermite = half.taps.responseHermite!.channels_data[0]!
    expect(at(linear, 10_000)).toBeCloseTo(-2.01, 1)
    expect(at(linear, 20_000)).toBeCloseTo(-11.74, 1)
    expect(at(hermite, 10_000)).toBeCloseTo(-0.534, 2)
    expect(at(hermite, 20_000)).toBeCloseTo(-8.41, 1)
    // The mean of two neighbours is cos(π f / fs).
    expect(at(linear, 10_000)).toBeCloseTo(20 * Math.log10(Math.cos((Math.PI * 10_000) / RATE)), 2)
    // On a stored sample, at either end, both reads are flat.
    for (const fraction of [0, 1]) {
      const whole = echo.render(click(seconds(0.5)), { fraction })
      for (const tap of ['responseLinear', 'responseHermite']) {
        const { lo, hi } = range(whole.taps[tap]!.channels_data[0]!)
        expect(Math.max(Math.abs(lo), Math.abs(hi))).toBeLessThan(0.001)
      }
    }
    // Half way the Hermite read weighs the four samples around it −1/16, 9/16, 9/16, −1/16.
    const kernel = half.taps.kernelHermite!.channels_data[0]!
    const middle = (kernel.length - 1) / 2
    expect(kernel[middle + 8]).toBeCloseTo(9 / 16, 6)
    expect(kernel[middle - 8]).toBeCloseTo(9 / 16, 6)
    expect(kernel[middle + 24]).toBeCloseTo(-1 / 16, 6)
    expect(kernel[middle - 24]).toBeCloseTo(-1 / 16, 6)
  })

  it('brings each repeat of a 1 kHz burst back 6.04 dB under the last at a feedback of 0.5, within 0.5 dB of the gain alone (claim burst-step), and ten repeats on it is 60.4 dB down (claim t60)', async () => {
    const echo = await lab('delay-and-echo')
    const source = burst(seconds(4))
    const heads = echo.render(source, { mix: 1, time: 250, feedback: 0.5 }).taps.heads!
      .channels_data[0]!
    const sent = energy(source.left, 0, 2000)
    const level = (k: number) => energyDb(heads, 12_000 * k, 12_000 * (k + 1), sent)
    expect(Math.abs(level(1))).toBeLessThan(0.02)
    const gain = 20 * Math.log10(0.5)
    for (let k = 2; k <= 12; k += 1) {
      const step = level(k) - level(k - 1)
      expect(step).toBeGreaterThan(-6.06)
      expect(step).toBeLessThan(-6.02)
      expect(Math.abs(step - gain)).toBeLessThan(0.5)
    }
    expect(level(11) - level(1)).toBeGreaterThan(-60.6)
    expect(level(11) - level(1)).toBeLessThan(-60.2)
    // The lab's own measure of the same thing, on the second copy of the device.
    const drawn = echo.render(source, { feedback: 0.5 }).taps.repeats!.channels_data[0]!
    expect(drawn[1]! - drawn[0]!).toBeCloseTo(-6.04, 1)
  })

  it("makes the loop again from the kit's filters and tanh and lands on the device's repeats to the last bit, at any Feedback, filter setting and Drive (claim loop-rebuilt)", async () => {
    const echo = await lab('delay-and-echo')
    for (const feedback of [0.3, 0.5, 0.9, 1.1]) {
      for (const values of [{}, filtered, { highCut: 4500 }, { ...filtered, drive: 1 }]) {
        expect(echo.render(click(seconds(0.5)), { feedback, ...values }).checks.loop).toBe(-140)
      }
    }
  })

  it("takes 6.3 dB a trip at 1 kHz (claim trip-1k), 10.5 dB at the high cut's 4.5 kHz (claim trip-corner) and 20.6 dB at 9 kHz (claim trip-9k), at the device's default filters", async () => {
    const echo = await lab('delay-and-echo')
    const taps = echo.render(click(seconds(0.5)), { feedback: 0.5, ...filtered }).taps
    const repeat = (k: number, hz: number) => at(taps[`repeat${k}`]!.channels_data[0]!, hz)
    for (const [hz, step] of [
      [1000, -6.32],
      [4500, -10.53],
      [9000, -20.61],
    ] as const) {
      // The first repeat has not met the filter; every one after it is the same step down.
      expect(Math.abs(repeat(1, hz))).toBeLessThan(0.01)
      expect(repeat(2, hz) - repeat(1, hz)).toBeCloseTo(step, 1)
      expect(repeat(3, hz) - repeat(2, hz)).toBeCloseTo(step, 1)
      expect(repeat(5, hz) - repeat(1, hz)).toBeGreaterThan(4 * step - 0.2)
      expect(repeat(5, hz) - repeat(1, hz)).toBeLessThan(4 * step + 0.2)
    }
    // At its corner a low-pass of this Q passes 0.6, which is 4.4 dB, beside the feedback's 6.0.
    expect(repeat(2, 4500) - 20 * Math.log10(0.5 * 0.6)).toBeGreaterThan(-0.15)
    expect(repeat(2, 4500) - 20 * Math.log10(0.5 * 0.6)).toBeLessThan(0.05)
  })

  it('takes 8.4 dB from one sample on its first trip with the filters open, and less each trip after, 6.2 dB by the eleventh (claim click-step)', async () => {
    const echo = await lab('delay-and-echo')
    const levels = echo.render(click(seconds(0.5)), { feedback: 0.5 }).taps.repeatsClick!
      .channels_data[0]!
    const stepsDown = Array.from(levels.subarray(1), (v, i) => levels[i]! - v)
    expect(stepsDown[0]).toBeCloseTo(8.36, 1)
    expect(stepsDown[10]).toBeCloseTo(6.2, 1)
    for (let i = 1; i < stepsDown.length; i += 1) {
      expect(stepsDown[i]!).toBeLessThanOrEqual(stepsDown[i - 1]! + 0.005)
    }
  })

  it("leaves a click's peak half a sample later each trip through the open filter: four samples late by the eighth repeat (claim late)", async () => {
    const echo = await lab('delay-and-echo')
    const heads = echo.render(click(seconds(4)), { mix: 1, time: 250, feedback: 0.5 }).taps.heads!
      .channels_data[0]!
    const late = [1, 2, 3, 4, 5, 6, 7, 8].map(
      (k) => peakAt(heads, 100 + 12_000 * k - 20, 100 + 12_000 * k + 200) - (100 + 12_000 * k),
    )
    expect(late).toEqual([0, 1, 1, 2, 2, 3, 3, 4])
  })

  it('records a full-scale click at 0.778, 2.2 dB down, with Drive at 0 (claim tape-click)', async () => {
    const echo = await lab('delay-and-echo')
    const clicks = await benchSource('clicks', seconds(4))
    const taps = echo.render(clicks, { feedback: 0 }).taps
    expect(taps.sum!.channels_data[0]![0]).toBe(1)
    expect(taps.tape!.channels_data[0]![0]).toBeCloseTo(7 / 9, 6)
    expect(20 * Math.log10(taps.tape!.channels_data[0]![0]!)).toBeCloseTo(-2.18, 2)
    // And the curve the lesson draws passes through the same point.
    const curve = taps.saturate!.channels_data[0]!
    expect(curve[100]).toBeCloseTo(7 / 9, 6)
    expect(curve[200]).toBeLessThanOrEqual(1)
  })

  it('settles a burst at a feedback of 1.1 with its peaks at 0.63 on the tape with Drive at 0, and at 0.16, a quarter of that, with Drive at 1 (claim settles)', async () => {
    const echo = await lab('delay-and-echo')
    const source = burst(seconds(8))
    const last = (drive: number) => {
      const tape = echo.render(source, { feedback: 1.1, time: 30, drive }).taps.tape!
        .channels_data[0]!
      // The last second, and the second before it: it has stopped growing.
      const now = peak(tape.subarray(seconds(7)))
      expect(Math.abs(now - peak(tape.subarray(seconds(6), seconds(7))))).toBeLessThan(0.01 * now)
      return now
    }
    const straight = last(0)
    const driven = last(1)
    expect(straight).toBeGreaterThan(0.61)
    expect(straight).toBeLessThan(0.65)
    expect(driven).toBeGreaterThan(0.155)
    expect(driven).toBeLessThan(0.165)
    expect(straight / driven).toBeCloseTo(4, 1)
  })

  it('never puts more than 0.25 on the tape with Drive at 1, whatever the feedback (claim ceiling)', async () => {
    const echo = await lab('delay-and-echo')
    for (const id of ['drums', 'clicks']) {
      const source = await benchSource(id, seconds(4))
      const taps = echo.render(source, { feedback: 1.1, drive: 1 }).taps
      const top = Math.max(peak(taps.tape!.channels_data[0]!), peak(taps.tape!.channels_data[1]!))
      // A quarter, to the last bit of a float.
      expect(top).toBeLessThan(0.25 + 1e-6)
      expect(top).toBeGreaterThan(0.24)
      // It was sent more than that.
      expect(peak(taps.sum!.channels_data[0]!)).toBeGreaterThan(0.5)
    }
  })

  it('lets a burst die slowly at a feedback of exactly 1: its 24th repeat is 0.7 dB under its first (claim unity)', async () => {
    const echo = await lab('delay-and-echo')
    const levels = echo.render(click(seconds(0.5)), { feedback: 1 }).taps.repeats!.channels_data[0]!
    const fall = levels[0]! - levels[23]!
    expect(fall).toBeGreaterThan(0.6)
    expect(fall).toBeLessThan(0.8)
    // Past 1 the same burst grows: 0.83 dB a repeat at first.
    const grown = echo.render(click(seconds(0.5)), { feedback: 1.1 }).taps.repeats!
      .channels_data[0]!
    expect(grown[1]! - grown[0]!).toBeGreaterThan(0.7)
    expect(grown[1]! - grown[0]!).toBeLessThan(0.83)
  })

  it('moves the read point up to 1.45 ms and the pitch from 6.5 cents flat to 7.8 sharp with Wow at 1 (claim wow-range), and 0.07 ms and 4.2 cents each way with Flutter at 1 (claim flutter-range)', async () => {
    const echo = await lab('delay-and-echo')
    const tone = sine(1000, 0.25, seconds(8))
    const wow = echo.render(tone, { ...once, wow: 1 }).taps
    const wowDelay = range(wow.delay!.channels_data[0]!)
    const wowSpeed = range(wow.speed!.channels_data[0]!)
    expect(Math.max(250 - wowDelay.lo, wowDelay.hi - 250)).toBeGreaterThan(1.4)
    expect(Math.max(250 - wowDelay.lo, wowDelay.hi - 250)).toBeLessThan(1.5)
    expect(cents(wowSpeed.lo)).toBeCloseTo(-6.5, 0)
    expect(cents(wowSpeed.hi)).toBeCloseTo(7.8, 0)
    // Never past what three sines in step would give: 0.52 %, 9 cents.
    expect(Math.max(-cents(wowSpeed.lo), cents(wowSpeed.hi))).toBeLessThan(9)

    const flutter = echo.render(tone, { ...once, flutter: 1 }).taps
    const flutterDelay = range(flutter.delay!.channels_data[0]!)
    const flutterSpeed = range(flutter.speed!.channels_data[0]!)
    expect(Math.max(250 - flutterDelay.lo, flutterDelay.hi - 250)).toBeGreaterThan(0.064)
    expect(Math.max(250 - flutterDelay.lo, flutterDelay.hi - 250)).toBeLessThan(0.07)
    expect(cents(flutterSpeed.lo)).toBeCloseTo(-4.2, 0)
    expect(cents(flutterSpeed.hi)).toBeCloseTo(4.2, 0)

    // Off, the transport is steady: the delay is Time and the speed exactly 1.
    const steady = echo.render(tone, once).taps
    expect(steady.speed!.channels_data[0]!.every((v) => v === 1)).toBe(true)
    expect(steady.delay!.channels_data[0]!.every((v) => v === 250)).toBe(true)
  })

  it('bends the pitch by the same amount at any Time (claim same-wobble)', async () => {
    const echo = await lab('delay-and-echo')
    const tone = sine(1000, 0.25, seconds(4))
    const short = echo.render(tone, { wow: 1, flutter: 1, time: 100 }).taps.speed!.channels_data[0]!
    const long = echo.render(tone, { wow: 1, flutter: 1, time: 1000 }).taps.speed!.channels_data[0]!
    expect(short.some((v) => v !== 1)).toBe(true)
    expect(short.every((v, i) => v === long[i])).toBe(true)
  })

  it("plays a 1 kHz sine at the pitch the device's speed meter says, within 0.1 cent, counted from its zero crossings (claim pitch-formula)", async () => {
    const echo = await lab('delay-and-echo')
    const taps = echo.render(sine(1000, 0.25, seconds(8)), { ...once, wow: 1, flutter: 1 }).taps
    const heads = taps.heads!.channels_data[0]!
    const speed = taps.speed!.channels_data[0]!
    const crossings: number[] = []
    for (let i = 1; i < heads.length; i += 1) {
      const a = heads[i - 1]!
      const b = heads[i]!
      if (a < 0 && b >= 0) crossings.push(i - 1 + -a / (b - a))
    }
    // Windows of 50 ms, from 100 ms in: the loop's first 20 ms are a crossfade of two passes.
    let worst = 0
    let widest = 0
    for (let from = 4800; from + 2400 <= heads.length; from += 2400) {
      const inside = crossings.filter((c) => c >= from && c < from + 2400)
      const first = inside[0]!
      const last = inside[inside.length - 1]!
      const heard = ((inside.length - 1) * RATE) / (last - first)
      const said = 1000 * mean(speed, Math.round(first / 16), Math.round(last / 16))
      worst = Math.max(worst, Math.abs(cents(heard / said)))
      widest = Math.max(widest, Math.abs(cents(heard / 1000)))
    }
    expect(widest).toBeGreaterThan(5)
    expect(worst).toBeLessThan(0.1)
  })

  it('drops the tape to half speed when Time is lengthened by 60 ms, stops it at 120 ms and runs it backwards past that, on a 120 ms lag (claim motor)', async () => {
    const echo = await lab('delay-and-echo')
    const tone = sine(1000, 0.25, seconds(4))
    const turned = (nudge: number) => {
      const taps = echo.render(tone, { ...once, nudge }).taps
      const speed = taps.speed!.channels_data[0]!
      const delay = taps.delay!.channels_data[0]!
      const half = speed.length / 2
      // One time constant on, the head has gone 63 % of the way.
      const part = (delay[half + (0.12 * RATE) / 16]! - 250) / nudge
      expect(part).toBeCloseTo(1 - Math.exp(-1), 2)
      expect(delay[delay.length - 1]).toBeCloseTo(250 + nudge, 2)
      return speed[half]!
    }
    expect(turned(60)).toBeCloseTo(0.5, 2)
    expect(turned(-60)).toBeCloseTo(1.5, 2)
    expect(turned(120)).toBeCloseTo(0, 2)
    expect(turned(200)).toBeCloseTo(1 - 200 / 120, 2)
  })

  it('reads the tape at 200, 400 and 600 ms with three heads and Time at 600 ms (claim three-heads)', async () => {
    const echo = await lab('delay-and-echo')
    const found = (heads: number) => {
      const read = echo.render(click(seconds(4)), { ...once, heads, time: 600 }).taps.heads!
        .channels_data[0]!
      const out: [number, number][] = []
      read.forEach((v, i) => {
        if (Math.abs(v) > 1e-5) out.push([(i - 100) / 48, Math.round((v / 0.01) * 100) / 100])
      })
      return out
    }
    expect(found(0)).toEqual([[600, 1]])
    expect(found(1)).toEqual([
      [200, 0.5],
      [600, 0.6],
    ])
    expect(found(2)).toEqual([
      [200, 0.35],
      [400, 0.35],
      [600, 0.45],
    ])
    expect(found(3)).toEqual([
      [400, 0.5],
      [600, 0.6],
    ])
  })

  it('sends the repeats to the left and the right in turn with Ping pong at 1, left first (claim ping-pong)', async () => {
    const echo = await lab('delay-and-echo')
    const taps = echo.render(click(seconds(4)), { mix: 1, feedback: 0.5, spread: 1 }).taps
    const [left, right] = taps.heads!.channels_data as [Float32Array, Float32Array]
    for (let k = 1; k <= 6; k += 1) {
      const from = 100 + 12_000 * k - 50
      const here = k % 2 === 1 ? left : right
      const there = k % 2 === 1 ? right : left
      expect(energy(here, from, from + 6000)).toBeGreaterThan(0)
      expect(energy(there, from, from + 6000)).toBe(0)
    }
  })

  it('mixes the input and the heads at 0.707 each at a Mix of 0.5 (claim mix-half) and is the input, sample for sample, at 0 (claim mix-zero)', async () => {
    const echo = await lab('delay-and-echo')
    const out = echo.render(click(seconds(4)), { feedback: 0, mix: 0.5 }).taps.out!
      .channels_data[0]!
    expect(out[100]! / 0.01).toBeCloseTo(Math.SQRT1_2, 4)
    expect(out[12_100]! / 0.01).toBeCloseTo(Math.SQRT1_2, 4)
    const drums = await benchSource('drums', seconds(4))
    const dry = echo.render(drums, { mix: 0, feedback: 0.9 }).taps
    expect(dry.out!.channels_data[0]!.every((v, i) => v === dry.in!.channels_data[0]![i])).toBe(
      true,
    )
    expect(dry.out!.channels_data[1]!.every((v, i) => v === dry.in!.channels_data[1]![i])).toBe(
      true,
    )
  })

  it('sleeps on silence: nothing on the tape and exact silence out (claim silence)', async () => {
    const echo = await lab('delay-and-echo')
    const taps = echo.render(silence(seconds(1)), { feedback: 1.1 }).taps
    expect(taps.out!.channels_data[0]!.every((v) => v === 0)).toBe(true)
    expect(taps.tape!.channels_data[0]!.every((v) => v === 0)).toBe(true)
    expect(taps.speed!.channels_data[0]!.every((v) => v === 1)).toBe(true)
  })
})
