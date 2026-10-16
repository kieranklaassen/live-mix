import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
  click,
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
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

/** Silence with one sample of 0.01 on both sides, 100 samples in. */
const smallClick = (frames: number) => click(frames, 100, 0.01)

/** Silence with a short burst of a sine under a Hann window, `at` samples in. */
function burst(frames: number, hz = 1000, length = 960, size = 0.05, at = 100): Source {
  const source = silence(frames)
  for (let i = 0; i < length; i += 1) {
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / length)
    const value = size * window * Math.sin((2 * Math.PI * hz * i) / RATE)
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

const cents = (ratio: number) => 1200 * Math.log2(ratio)

const tap = (result: RenderResult, id: string, channel = 0) =>
  result.taps[id]!.channels_data[channel]!

/** The level of both sides of a tap together, over the whole loop. */
function level(result: RenderResult, id: string): number {
  const [left, right] = result.taps[id]!.channels_data as [Float32Array, Float32Array]
  return Math.sqrt(
    (energy(left, 0, left.length) + energy(right, 0, right.length)) / (2 * left.length),
  )
}

/** How far under the input the echoes stand in the output, in dB, at a Mix: each at its own gain. */
const echoesUnder = (result: RenderResult, mix: number) =>
  gainToDb(Math.cos((mix * Math.PI) / 2) * level(result, 'in')) -
  gainToDb(Math.sin((mix * Math.PI) / 2) * level(result, 'heads'))

/** What a trip round the loop costs at a frequency, in dB: the second repeat under the first. */
const trip = (result: RenderResult, hz: number) =>
  at(tap(result, 'repeat1'), hz) - at(tap(result, 'repeat2'), hz)

/** When each sample that is not silence comes, in ms after a click 100 samples in, with its size. */
function returns(x: Float32Array, size = 0.01): [number, number][] {
  const out: [number, number][] = []
  x.forEach((v, i) => {
    if (Math.abs(v) > 1e-5) out.push([(i - 100) / 48, Math.round((v / size) * 100) / 100])
  })
  return out
}

// The heads alone, one repeat: what went in comes back once.
const once = { feedback: 0, mix: 1 }
// The device's own defaults for the loop's filters.
const filtered = { highCut: 4500, lowCut: 120 }
// Every piece of the build at work at once.
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

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings('delay-and-echo')!

/** A named set as its card plays it: on its own source, with `over` laid on its values. */
async function played(echo: Lab, name: string, over: Record<string, number> = {}) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(echo.description, set)
  return echo.render(await benchSource(source!, seconds(4)), { ...values, ...over })
}

describe('delay and echo', () => {
  it('is a sound lab on the clicks: every tap says something, loops, and answers to every control', async () => {
    const echo = await lab('delay-and-echo')
    const clicks = await benchSource('clicks', seconds(4))
    const result = echo.render(clicks, {})
    // A steady transport is a level line, and the first repeat has not met the filter.
    expectSoundLab(echo, clicks, result, { quiet: ['delay', 'speed', 'repeat1'] })
  })

  it("builds the echo a piece at a time, and with all eight pieces lands on the device's own output", async () => {
    const echo = await lab('delay-and-echo')
    const clicks = await benchSource('clicks', seconds(4))
    // A Time between samples, an unsteady transport, three heads, two sides and the loop's
    // filters: values at which every piece does something.
    expectBuild(echo, clicks, {
      time: 100.01,
      wow: 1,
      flutter: 1,
      heads: 2,
      spread: 0.6,
      ...filtered,
    })
  })

  // ---- part 1: one copy, then a trail ----------------------------------------------------------

  it('gives a click back once at a Feedback of 0, 12,000 samples later with Time at 250 ms, and to the sample at any Time that is a whole number of them (claim returns)', async () => {
    const echo = await lab('delay-and-echo')
    for (const time of [30, 250, 1000, 2000]) {
      const heads = tap(echo.render(smallClick(seconds(4)), { ...once, time }), 'heads')
      expect(peakAt(heads)).toBe(100 + time * 48)
      // One sample comes back, and nothing after it.
      expect(heads.filter((v) => v !== 0).length).toBe(1)
    }
    const heads = tap(echo.render(smallClick(seconds(4)), once), 'heads')
    expectWritten(peakAt(heads) - 100, '12,000 samples')
    // 380 ms, the device's default, and a time that is not a whole number of samples: within one.
    for (const time of [380, 100.01]) {
      const late = tap(echo.render(smallClick(seconds(4)), { ...once, time }), 'heads')
      expect(Math.abs(peakAt(late) - (100 + time * 48))).toBeLessThan(1)
    }
  })

  it('brings each repeat of a 1 kHz burst back 6.04 dB under the last at a feedback of 0.5, within 0.5 dB of the gain alone (claim burst-step), and ten repeats on it is 60.4 dB down (claim t60)', async () => {
    const echo = await lab('delay-and-echo')
    const source = burst(seconds(4))
    const heads = tap(echo.render(source, { mix: 1, time: 250, feedback: 0.5 }), 'heads')
    const sent = energy(source.left, 0, 2000)
    const levelOf = (k: number) => energyDb(heads, 12_000 * k, 12_000 * (k + 1), sent)
    expect(Math.abs(levelOf(1))).toBeLessThan(0.02)
    const gain = 20 * Math.log10(0.5)
    for (let k = 2; k <= 12; k += 1) {
      const step = levelOf(k) - levelOf(k - 1)
      expectWritten(-step, '6.04 dB')
      expect(Math.abs(step - gain)).toBeLessThan(0.5)
    }
    expectWritten(levelOf(1) - levelOf(11), '60.4 dB')
    // The lab's own measure of the same thing, on the second copy of the device: the curve the
    // answer to the prediction draws.
    const drawn = tap(echo.render(source, { feedback: 0.5 }), 'repeats')
    expectWritten(drawn[0]! - drawn[1]!, '6.04 dB')
    expectWritten(drawn[0]! - drawn[10]!, '60.4 dB')
    // The ninth repeat on is not there yet.
    expect(drawn[0]! - drawn[9]!).toBeLessThan(60)
  })

  // ---- part 2: the ring ------------------------------------------------------------------------

  it('reads a click 5 samples after it was written, with the read head 5 slots behind, and writes it again at 0.5 (claim ring-returns)', async () => {
    const echo = await lab('delay-and-echo')
    for (const back of [2, 5, 8]) {
      const result = echo.render(smallClick(seconds(0.5)), { ringBack: back, feedback: 0.5 })
      const [where, written] = result.taps.ringWrite!.channels_data as [Float32Array, Float32Array]
      const [slot, read] = result.taps.ringRead!.channels_data as [Float32Array, Float32Array]
      expect(written[0]).toBe(1)
      // Nothing is read until the read head reaches the slot the click lies in.
      const first = read.findIndex((v) => v !== 0)
      expect(first).toBe(back)
      expect(read[first]).toBe(1)
      expect(slot[first]).toBe(0)
      expect(written[first]).toBe(0.5)
      expect(where[first]).toBe(back)
      // And again, at half of that, the same number of steps on: read from the slot the copy
      // was written to, and written twice as far round.
      expect(read[2 * back]).toBe(0.5)
      expect(slot[2 * back]).toBe(back)
      expect(written[2 * back]).toBe(0.25)
      expect(where[2 * back]).toBe((2 * back) % 16)
      if (back === 5) {
        expectWritten(first, '5 samples')
        expectWritten(written[first]!, '0.5')
      }
    }
    // The delay is the distance between the heads and nothing else: with Feedback at 0 the
    // click is read once and the ring holds only the click.
    const plain = echo.render(smallClick(seconds(0.5)), { ringBack: 5, feedback: 0 })
    expect(Array.from(plain.taps.ringRead!.channels_data[1]!).filter((v) => v !== 0)).toEqual([1])
  })

  it('comes round: the write head is back on slot 0 on step 16 and writes over the click (claim ring-round)', async () => {
    const echo = await lab('delay-and-echo')
    const result = echo.render(smallClick(seconds(0.5)), { ringBack: 5, feedback: 0.5 })
    const ring = result.taps.ring!
    expect(ring.columns).toBe(49)
    const slots = ring.channels_data[0]!
    const holds = (step: number, slot: number) => slots[step * 16 + slot]!
    const where = result.taps.ringWrite!.channels_data[0]!
    for (let step = 0; step < 49; step += 1) expect(where[step]).toBe(step % 16)
    expectWritten(
      where.findIndex((slot, step) => step > 0 && slot === 0),
      '16',
    )
    // Until then the click lies where it was written, with its repeats 5 slots apart.
    for (let step = 0; step < 16; step += 1) expect(holds(step, 0)).toBe(1)
    expect([holds(15, 5), holds(15, 10), holds(15, 15)]).toEqual([0.5, 0.25, 0.125])
    expect(holds(16, 0)).toBe(0)
    // Nothing in the ring moves: a slot changes only on the step that writes it.
    for (let step = 1; step < 49; step += 1) {
      for (let slot = 0; slot < 16; slot += 1) {
        if (slot !== step % 16) expect(holds(step, slot)).toBe(holds(step - 1, slot))
      }
    }
  })

  // ---- part 5: the device, stage by stage ------------------------------------------------------

  it("reads the heads and the record path again from the device's own numbers and lands −140 dB from the device, the floor of the lab's scale (claim rebuilt)", async () => {
    const echo = await lab('delay-and-echo')
    const drums = await benchSource('drums', seconds(4))
    for (const values of [{}, busy]) {
      const result = echo.render(drums, values)
      // −140 dB is as far down as the lab reads: no difference, or one further down than that.
      expectWritten(result.checks.heads!, '−140 dB')
      expectWritten(result.checks.record!, '−140 dB')
    }
  })

  it('drops the tape to 0.5 of its speed when Time is lengthened by 60 ms, stops it at 120 ms and runs it backwards past that, and has gone 63 % of the way 120 ms later (claim motor)', async () => {
    const echo = await lab('delay-and-echo')
    const tone = sine(1000, 0.25, seconds(4))
    const turned = (nudge: number) => {
      const taps = echo.render(tone, { ...once, nudge }).taps
      const speed = taps.speed!.channels_data[0]!
      const delay = taps.delay!.channels_data[0]!
      const half = speed.length / 2
      // One time constant on, the head has gone 63 % of the way.
      expectWritten((100 * (delay[half + (0.12 * RATE) / 16]! - 250)) / nudge, '63 %')
      expect(delay[delay.length - 1]).toBeCloseTo(250 + nudge, 2)
      return speed[half]!
    }
    expectWritten(turned(60), '0.5')
    expect(turned(60)).toBeCloseTo(0.5, 2)
    expect(turned(-60)).toBeCloseTo(1.5, 2)
    expect(turned(120)).toBeCloseTo(0, 2)
    expect(turned(200)).toBeCloseTo(1 - 200 / 120, 2)
    // The two stills of stages 1 and 2, on the page's own loop: Time is turned back at the start
    // of the loop and lengthened half way, and the place read never jumps. Its largest move from
    // one point to the next is 0.17 ms, where a jump would be the whole 60 ms.
    const still = echo.render(await benchSource('clicks', seconds(4)), { nudge: 60 }).taps
    const place = still.delay!.channels_data[0]!
    const speed = still.speed!.channels_data[0]!
    const half = place.length / 2
    expect(place[0]).toBeGreaterThan(309)
    expect(place[half - 1]).toBeCloseTo(250, 2)
    expect(place[place.length - 1]).toBeCloseTo(310, 2)
    expect(
      Math.max(...Array.from(place.subarray(1), (v, i) => Math.abs(v - place[i]!))),
    ).toBeLessThan(0.2)
    expect(speed[0]).toBeCloseTo(1.5, 2)
    expect(speed[half]).toBeCloseTo(0.5, 2)
    expect(speed[half - 1]).toBeCloseTo(1, 3)
    expect(speed[speed.length - 1]).toBeCloseTo(1, 3)
  })

  it('moves the read point up to 1.45 ms and the pitch from 6.5 cents flat to 7.8 cents sharp with Wow at 1 (claim wow-range), and 0.07 ms and from 4.2 cents flat to 4.1 cents sharp with Flutter at 1 (claim flutter-range), over the second pass of an 8 s loop', async () => {
    const echo = await lab('delay-and-echo')
    // A render plays its loop twice and keeps the second pass: seconds 8 to 16 of the device.
    const tone = sine(1000, 0.25, seconds(8))
    const wow = echo.render(tone, { ...once, wow: 1 }).taps
    const wowDelay = range(wow.delay!.channels_data[0]!)
    const wowSpeed = range(wow.speed!.channels_data[0]!)
    expectWritten(Math.max(250 - wowDelay.lo, wowDelay.hi - 250), '1.45 ms')
    expectWritten(-cents(wowSpeed.lo), '6.5 cents')
    expectWritten(cents(wowSpeed.hi), '7.8 cents')
    // Never past what three sines in step would give: 0.52 %, 9 cents.
    expect(Math.max(-cents(wowSpeed.lo), cents(wowSpeed.hi))).toBeLessThan(9)

    const flutter = echo.render(tone, { ...once, flutter: 1 }).taps
    const flutterDelay = range(flutter.delay!.channels_data[0]!)
    const flutterSpeed = range(flutter.speed!.channels_data[0]!)
    expectWritten(Math.max(250 - flutterDelay.lo, flutterDelay.hi - 250), '0.07 ms')
    expectWritten(-cents(flutterSpeed.lo), '4.2 cents')
    expectWritten(cents(flutterSpeed.hi), '4.1 cents')

    // Off, the transport is steady: the delay is Time and the speed exactly 1.
    const steady = echo.render(tone, once).taps
    expect(steady.speed!.channels_data[0]!.every((v) => v === 1)).toBe(true)
    expect(steady.delay!.channels_data[0]!.every((v) => v === 250)).toBe(true)
  })

  it('bends the pitch by the same amount whatever Time is: the speed meter reads the same, point for point, with Time at its shortest, at its longest and at two places between (claim same-wobble)', async () => {
    const echo = await lab('delay-and-echo')
    const tone = sine(1000, 0.25, seconds(4))
    const short = tap(echo.render(tone, { wow: 1, flutter: 1, time: 100 }), 'speed')
    expect(short.some((v) => v !== 1)).toBe(true)
    // From the shortest Time to the longest, the meter reads the same at every point.
    for (const time of [30, 250, 1000, 2000]) {
      const other = tap(echo.render(tone, { wow: 1, flutter: 1, time }), 'speed')
      expect(
        short.every((v, i) => v === other[i]),
        `Time at ${time} ms`,
      ).toBe(true)
    }
  })

  it("plays a 1 kHz sine at the pitch the device's speed meter says, less than 0.1 cent apart, counted from its zero crossings (claim pitch-formula)", async () => {
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
    expectWritten(worst, 'less than 0.1 cent')
  })

  it('turns one sample into −0.06, 0.56, 0.56 and −0.06 of itself when Time ends in half a sample: the device reads by Hermite (claim device-hermite)', async () => {
    const echo = await lab('delay-and-echo')
    const result = echo.render(smallClick(seconds(1)), { ...once, time: 12000.5 / 48 })
    const heads = result.taps.heads!.channels_data[0]!
    const four = Array.from(heads.subarray(12_099, 12_103), (v) => v / 0.01)
    // Time is a float: the delay is 12,000.501 samples, so the middle two are 0.561 and 0.564.
    const want = [-1 / 16, 9 / 16, 9 / 16, -1 / 16]
    four.forEach((value, i) => expect(Math.abs(value - want[i]!)).toBeLessThan(0.003))
    expectWritten(four[0]!, '−0.06')
    expectWritten(four[1]!, '0.56')
    expectWritten(four[2]!, '0.56')
    expectWritten(four[3]!, '−0.06')
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

  it('loses 2.0 dB at 10 kHz and 11.7 dB at 20 kHz to a linear read half way between samples (claim linear-half), and 0.5 dB at 10 kHz and 8.4 dB at 20 kHz to a Hermite read (claim hermite-half)', async () => {
    const echo = await lab('delay-and-echo')
    const half = echo.render(smallClick(seconds(0.5)), { fraction: 0.5 })
    const linear = half.taps.responseLinear!.channels_data[0]!
    const hermite = half.taps.responseHermite!.channels_data[0]!
    expectWritten(-at(linear, 10_000), '2.0 dB')
    expectWritten(-at(linear, 20_000), '11.7 dB')
    // 0.534 dB, read between two points of the lab's curve: one decimal is what that supports.
    expectWritten(-at(hermite, 10_000), '0.5 dB')
    expectWritten(-at(hermite, 20_000), '8.4 dB')
    // The mean of two neighbours is cos(π f / fs).
    expect(at(linear, 10_000)).toBeCloseTo(20 * Math.log10(Math.cos((Math.PI * 10_000) / RATE)), 2)
    // Half way is the worst there is: nearer either sample, both reads lose less.
    for (const fraction of [0.25, 0.4, 0.6, 0.75]) {
      const off = echo.render(smallClick(seconds(0.5)), { fraction })
      for (const [id, worst] of [
        ['responseLinear', linear],
        ['responseHermite', hermite],
      ] as const) {
        for (const hz of [10_000, 20_000]) {
          expect(at(tap(off, id), hz), `${id} at ${fraction}, ${hz} Hz`).toBeGreaterThan(
            at(worst, hz),
          )
        }
      }
    }
    // On a stored sample, at either end, both reads are flat.
    for (const fraction of [0, 1]) {
      const whole = echo.render(smallClick(seconds(0.5)), { fraction })
      for (const id of ['responseLinear', 'responseHermite']) {
        const { lo, hi } = range(whole.taps[id]!.channels_data[0]!)
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

  it('reads the tape at 200 ms, 400 ms and 600 ms with three heads and Time at 600 ms (claim three-heads)', async () => {
    const echo = await lab('delay-and-echo')
    const found = (heads: number) =>
      returns(tap(echo.render(smallClick(seconds(4)), { ...once, heads, time: 600 }), 'heads'))
    expect(found(0)).toEqual([[600, 1]])
    expect(found(1)).toEqual([
      [200, 0.5],
      [600, 0.6],
    ])
    const three = found(2)
    expect(three).toEqual([
      [200, 0.35],
      [400, 0.35],
      [600, 0.45],
    ])
    expectWritten(three[0]![0], '200 ms')
    expectWritten(three[1]![0], '400 ms')
    expectWritten(three[2]![0], '600 ms')
    expect(found(3)).toEqual([
      [400, 0.5],
      [600, 0.6],
    ])
  })

  it("takes 6.3 dB a trip at 1 kHz (claim trip-1k), 10.5 dB at the high cut's 4.5 kHz (claim trip-corner) and 20.6 dB at 9 kHz (claim trip-9k), at a Feedback of 0.5 and the device's default filters", async () => {
    const echo = await lab('delay-and-echo')
    const result = echo.render(smallClick(seconds(0.5)), { feedback: 0.5, ...filtered })
    const repeat = (k: number, hz: number) => at(tap(result, `repeat${k}`), hz)
    for (const [hz, written] of [
      [1000, '6.3 dB'],
      [4500, '10.5 dB'],
      [9000, '20.6 dB'],
    ] as const) {
      // The first repeat has not met the filter; every one after it is the same step down.
      expect(Math.abs(repeat(1, hz))).toBeLessThan(0.01)
      expectWritten(repeat(1, hz) - repeat(2, hz), written)
      expectWritten(repeat(2, hz) - repeat(3, hz), written)
      const step = repeat(2, hz) - repeat(1, hz)
      expect(repeat(5, hz) - repeat(1, hz)).toBeGreaterThan(4 * step - 0.2)
      expect(repeat(5, hz) - repeat(1, hz)).toBeLessThan(4 * step + 0.2)
    }
    // At its corner a low-pass of this Q passes 0.6, which is 4.4 dB, beside the feedback's 6.0.
    expect(repeat(2, 4500) - 20 * Math.log10(0.5 * 0.6)).toBeGreaterThan(-0.15)
    expect(repeat(2, 4500) - 20 * Math.log10(0.5 * 0.6)).toBeLessThan(0.05)
  })

  it('takes 8.4 dB from one sample on its first trip with the filters open, and less each trip after, 6.2 dB by the eleventh (claim click-step)', async () => {
    const echo = await lab('delay-and-echo')
    const levels = tap(echo.render(smallClick(seconds(0.5)), { feedback: 0.5 }), 'repeatsClick')
    const stepsDown = Array.from(levels.subarray(1), (v, i) => levels[i]! - v)
    expectWritten(stepsDown[0]!, '8.4 dB')
    expectWritten(stepsDown[10]!, '6.2 dB')
    for (let i = 1; i < stepsDown.length; i += 1) {
      expect(stepsDown[i]!).toBeLessThanOrEqual(stepsDown[i - 1]! + 0.005)
    }
  })

  it("leaves a click's peak half a sample later each trip through the open filter: 4 samples late by the eighth repeat (claim late)", async () => {
    const echo = await lab('delay-and-echo')
    const heads = tap(
      echo.render(smallClick(seconds(4)), { mix: 1, time: 250, feedback: 0.5 }),
      'heads',
    )
    const late = [1, 2, 3, 4, 5, 6, 7, 8].map(
      (k) => peakAt(heads, 100 + 12_000 * k - 20, 100 + 12_000 * k + 200) - (100 + 12_000 * k),
    )
    expect(late).toEqual([0, 1, 1, 2, 2, 3, 3, 4])
    expectWritten(late[7]!, '4 samples')
  })

  it("makes the loop again from the kit's filters and tanh and lands −140 dB from the device's repeats, the floor of the lab's scale, at each Feedback, filter setting and Drive tried (claim loop-rebuilt)", async () => {
    const echo = await lab('delay-and-echo')
    for (const feedback of [0.3, 0.5, 0.9, 1.1]) {
      for (const values of [{}, filtered, { highCut: 4500 }, { ...filtered, drive: 1 }]) {
        const { loop } = echo.render(smallClick(seconds(0.5)), { feedback, ...values }).checks
        expectWritten(loop!, '−140 dB')
      }
    }
  })

  it('sends the repeats to the left and the right in turn with Ping pong at 1, left first (claim ping-pong)', async () => {
    const echo = await lab('delay-and-echo')
    const taps = echo.render(smallClick(seconds(4)), { mix: 1, feedback: 0.5, spread: 1 }).taps
    const [left, right] = taps.heads!.channels_data as [Float32Array, Float32Array]
    for (let k = 1; k <= 6; k += 1) {
      const from = 100 + 12_000 * k - 50
      const here = k % 2 === 1 ? left : right
      const there = k % 2 === 1 ? right : left
      expect(energy(here, from, from + 6000)).toBeGreaterThan(0)
      expect(energy(there, from, from + 6000)).toBe(0)
    }
  })

  it('records a full-scale click at 0.778, 2.2 dB down, with Drive at 0 (claim tape-click)', async () => {
    const echo = await lab('delay-and-echo')
    const clicks = await benchSource('clicks', seconds(4))
    const taps = echo.render(clicks, { feedback: 0 }).taps
    expect(taps.sum!.channels_data[0]![0]).toBe(1)
    expect(taps.tape!.channels_data[0]![0]).toBeCloseTo(7 / 9, 6)
    expectWritten(taps.tape!.channels_data[0]![0]!, '0.778')
    expectWritten(-gainToDb(taps.tape!.channels_data[0]![0]!), '2.2 dB')
    // And the curve the lesson draws passes through the same point.
    const curve = taps.saturate!.channels_data[0]!
    expect(curve[100]).toBeCloseTo(7 / 9, 6)
    expect(curve[200]).toBeLessThanOrEqual(1)
  })

  it('holds a 1 kHz burst at a feedback of 1.1 and a Time of 30 ms: in the last second of an 8 s loop its peaks on the tape stand at 0.63 with Drive at 0, and at 0.16, a quarter of that, with Drive at 1, each less than 1 % from the second before (claim settles)', async () => {
    const echo = await lab('delay-and-echo')
    const source = burst(seconds(8))
    const last = (drive: number) => {
      const tape = tap(echo.render(source, { feedback: 1.1, time: 30, drive }), 'tape')
      // The last second, and the second before it. The peaks are still easing down there, by
      // half a percent a second (0.6371 then 0.6336 with Drive at 0), so the number is the last
      // second's and no later one's.
      const now = peak(tape.subarray(seconds(7)))
      const before = peak(tape.subarray(seconds(6), seconds(7)))
      expectWritten((100 * Math.abs(now - before)) / before, 'less than 1 %')
      return now
    }
    const straight = last(0)
    const driven = last(1)
    expectWritten(straight, '0.63')
    expectWritten(driven, '0.16')
    expect(straight / driven).toBeCloseTo(4, 1)
  })

  it('puts no more than 0.25 on the tape with Drive at 1 and Feedback at 1.1, on the drums and on the clicks (claim ceiling)', async () => {
    const echo = await lab('delay-and-echo')
    for (const id of ['drums', 'clicks']) {
      const source = await benchSource(id, seconds(4))
      const taps = echo.render(source, { feedback: 1.1, drive: 1 }).taps
      const top = Math.max(peak(taps.tape!.channels_data[0]!), peak(taps.tape!.channels_data[1]!))
      // A quarter, to the last bit of a float.
      expect(top).toBeLessThan(0.25 + 1e-6)
      expectWritten(top, '0.25')
      // It was sent more than that.
      expect(peak(taps.sum!.channels_data[0]!)).toBeGreaterThan(0.5)
    }
  })

  it('has its ceiling on the tape and not on the sum: a 1 kHz tone at full scale, at a Time of 30 ms with Feedback at 1.1 and Drive at 0, makes a sum that peaks at 2.09 times full scale, on a tape that peaks at 0.99 and an output at 1.4 (claim sum-loud)', async () => {
    const echo = await lab('delay-and-echo')
    const tone = sine(1000, 1, seconds(4))
    const most = (result: RenderResult, id: string) =>
      Math.max(peak(tap(result, id)), peak(tap(result, id, 1)))
    const loud = echo.render(tone, { feedback: 1.1, drive: 0, time: 30 })
    expectWritten(most(loud, 'sum'), '2.09')
    expectWritten(most(loud, 'tape'), '0.99')
    expectWritten(most(loud, 'out'), '1.4')
    // The sum is past twice full scale because Feedback is over 1: under 1, on the same tone,
    // it is not.
    const dying = echo.render(tone, { feedback: 0.9, drive: 0, time: 30 })
    expect(most(dying, 'sum')).toBeLessThan(2)
    expect(matchesWritten(most(dying, 'sum'), '2.09')).toBe(false)
  })

  it("lets the lab's burst, a tenth of full scale, die slowly at a feedback of exactly 1: its 24th repeat is 0.7 dB under its first (claim unity)", async () => {
    const echo = await lab('delay-and-echo')
    // The lab plays its own burst into the second copy of the device, whatever goes in here.
    const levels = tap(echo.render(smallClick(seconds(0.5)), { feedback: 1 }), 'repeats')
    expectWritten(levels[0]! - levels[23]!, '0.7 dB')
    // Past 1 the same burst grows: 0.8 dB a repeat at first.
    const grown = tap(echo.render(smallClick(seconds(0.5)), { feedback: 1.1 }), 'repeats')
    expect(grown[1]! - grown[0]!).toBeGreaterThan(0.7)
    expect(grown[1]! - grown[0]!).toBeLessThan(0.83)
  })

  it('holds 5.46 s of sound on each side of its tape (claim tape-seconds)', async () => {
    const echo = await lab('delay-and-echo')
    const memory = echo.render(smallClick(seconds(0.5)), {}).taps.memory!
    // The lab draws the device's whole tape, the largest of every 32 slots a point.
    expect(memory.length * 32).toBe(262_144)
    expectWritten((memory.length * 32) / RATE, '5.46 s')
  })

  it('mixes the input and the heads at 0.707 each at a Mix of 0.5 (claim mix-half) and is the input, sample for sample, at 0 (claim mix-zero)', async () => {
    const echo = await lab('delay-and-echo')
    const out = tap(echo.render(smallClick(seconds(4)), { feedback: 0, mix: 0.5 }), 'out')
    expectWritten(out[100]! / 0.01, '0.707')
    expectWritten(out[12_100]! / 0.01, '0.707')
    const drums = await benchSource('drums', seconds(4))
    const dry = echo.render(drums, { mix: 0, feedback: 0.9 })
    expect(tap(dry, 'out').every((v, i) => v === tap(dry, 'in')[i])).toBe(true)
    expect(tap(dry, 'out', 1).every((v, i) => v === tap(dry, 'in', 1)[i])).toBe(true)
  })

  it('changes only the output when Mix moves, and every stage after the input when Wow does: what the caption of all the stages at once says', async () => {
    const echo = await lab('delay-and-echo')
    const drums = await benchSource('drums', seconds(4))
    const stages = ['in', 'delay', 'speed', 'heads', 'back', 'sum', 'tape', 'out']
    const start = echo.render(drums, {})
    const changed = (values: Record<string, number>) => {
      const result = echo.render(drums, values)
      return stages.filter((id) =>
        result.taps[id]!.channels_data.some((data, side) =>
          data.some((v, i) => v !== start.taps[id]!.channels_data[side]![i]),
        ),
      )
    }
    expect(changed({ mix: 0.8 })).toEqual(['out'])
    expect(changed({ wow: 1 })).toEqual(stages.slice(1))
  })

  it('sleeps on silence: nothing on the tape and exact silence out (claim silence)', async () => {
    const echo = await lab('delay-and-echo')
    const taps = echo.render(silence(seconds(1)), { feedback: 1.1 }).taps
    expect(taps.out!.channels_data[0]!.every((v) => v === 0)).toBe(true)
    expect(taps.tape!.channels_data[0]!.every((v) => v === 0)).toBe(true)
    expect(taps.speed!.channels_data[0]!.every((v) => v === 1)).toBe(true)
  })

  // ---- part 4: the build, a piece at a time, each with its piece switched off -----------------

  it('step 2, a read head: with Time at 250 ms a click comes back 12,000 samples later, and at the step before nothing comes back (claim build-head)', async () => {
    const echo = await lab('delay-and-echo')
    const first = (step: number) => {
      const read = tap(
        echo.render(smallClick(seconds(4)), { build: step, feedback: 0 }),
        'builtHeads',
      )
      const found = read.findIndex((v) => v !== 0)
      return found < 0 ? Number.NaN : found - 100
    }
    expectWritten(first(1), '12,000 samples')
    expect(matchesWritten(first(0), '12,000 samples')).toBe(false)
    // What comes out is the click and its copy, mixed as Mix says, and no more.
    const out = tap(echo.render(smallClick(seconds(4)), { build: 1, mix: 1 }), 'built')
    expect(returns(out)).toEqual([[250, 1]])
  })

  it('step 3, feedback: the second repeat of a click is 6.0 dB under the first at a Feedback of 0.5, and at the step before there is no second repeat (claim build-feedback)', async () => {
    const echo = await lab('delay-and-echo')
    const under = (step: number) => {
      const read = tap(
        echo.render(smallClick(seconds(4)), { build: step, feedback: 0.5 }),
        'builtHeads',
      )
      return gainToDb(Math.abs(read[12_100]!)) - gainToDb(Math.abs(read[24_100]!))
    }
    expectWritten(under(2), '6.0 dB')
    expect(matchesWritten(under(1), '6.0 dB')).toBe(false)
    // With no filter in the loop yet, every repeat is exactly the last times the gain.
    const read = tap(echo.render(smallClick(seconds(4)), { build: 2, feedback: 0.5 }), 'builtHeads')
    expect(returns(read).slice(0, 4)).toEqual([
      [250, 1],
      [500, 0.5],
      [750, 0.25],
      [1000, 0.13],
    ])
  })

  it('step 4, between samples: with Time at 100.01 ms a click comes back as four samples whose centre is 4,800.48 samples late, and at the step before as one sample 4,800 late (claim build-between)', async () => {
    const echo = await lab('delay-and-echo')
    const back = (step: number) => {
      const read = tap(
        echo.render(smallClick(seconds(1)), { build: step, time: 100.01, feedback: 0 }),
        'builtHeads',
      )
      let total = 0
      let weighed = 0
      let count = 0
      read.forEach((v, i) => {
        if (v === 0) return
        total += v
        weighed += v * (i - 100)
        count += 1
      })
      return { centre: weighed / total, count }
    }
    expectWritten(back(3).centre, '4,800.48 samples')
    expect(back(3).count).toBe(4)
    expect(matchesWritten(back(2).centre, '4,800.48 samples')).toBe(false)
    expect(back(2)).toEqual({ centre: 4800, count: 1 })
    // The step's picture: one stored sample read all round. Before this piece the read takes
    // the nearest slot whole; with it, half way between two slots, it takes 9/16 of each.
    const kernel = (step: number) =>
      tap(echo.render(smallClick(seconds(0.5)), { build: step }), 'builtKernel')
    const middle = 48
    expect(kernel(0).every((v) => v === 0)).toBe(true)
    expect([kernel(2)[middle], kernel(2)[middle + 4], kernel(2)[middle + 12]]).toEqual([1, 1, 0])
    expect(kernel(3)[middle]).toBe(1)
    expect(kernel(3)[middle + 8]).toBeCloseTo(9 / 16, 6)
    expect(kernel(3)[middle + 24]).toBeCloseTo(-1 / 16, 6)
    // And it is the kit's own read.
    const kit = tap(echo.render(smallClick(seconds(0.5)), {}), 'kernelHermite')
    expect(Array.from(kernel(3))).toEqual(Array.from(kit))
  })

  it('step 5, filters in the loop: with High cut at 4.5 kHz and Low cut at 120 Hz a 20 ms burst of 4.5 kHz comes back 10.5 dB down on its second repeat, and at the step before 6.0 dB down (claim build-filters)', async () => {
    const echo = await lab('delay-and-echo')
    const source = burst(seconds(4), 4500)
    const under = (step: number) => {
      const read = tap(
        echo.render(source, { build: step, feedback: 0.5, ...filtered }),
        'builtHeads',
      )
      return energyDb(read, 12_000, 24_000, 1) - energyDb(read, 24_000, 36_000, 1)
    }
    expectWritten(under(4), '10.5 dB')
    expect(matchesWritten(under(3), '10.5 dB')).toBe(false)
    expectWritten(under(3), '6.0 dB')
    // The first repeat has not met the filters: it is the burst that went in.
    const read = tap(echo.render(source, { build: 4, feedback: 0.5, ...filtered }), 'builtHeads')
    expect(Math.abs(energyDb(read, 12_000, 24_000, energy(source.left, 0, 2000)))).toBeLessThan(
      0.01,
    )
  })

  it('step 6, a soft ceiling: at a Feedback of 1.1 and a Time of 30 ms a 1 kHz burst is held with its peaks at 0.63 on the ring in the last second of an 8 s loop, and at the step before it is cut off flat at 1.00 (claim build-ceiling)', async () => {
    const echo = await lab('delay-and-echo')
    const source = burst(seconds(8))
    const last = (step: number) => {
      const ring = tap(echo.render(source, { build: step, feedback: 1.1, time: 30 }), 'builtTape')
      return peak(ring.subarray(seconds(7)))
    }
    expectWritten(last(5), '0.63')
    expect(matchesWritten(last(4), '0.63')).toBe(false)
    expectWritten(last(4), '1.00')
  })

  it('step 7, an unsteady transport: Time is lengthened by 60 ms and 120 ms later the head has gone 63 % of the way, where at the step before it had gone 100 % at once (claim build-motor)', async () => {
    const echo = await lab('delay-and-echo')
    const tone = sine(1000, 0.25, seconds(4))
    const gone = (step: number, after: number) => {
      const stands = tap(echo.render(tone, { build: step, nudge: 60 }), 'builtDelay')
      return (100 * (stands[stands.length / 2 + (after * RATE) / 16]! - 250)) / 60
    }
    expectWritten(gone(6, 0.12), '63 %')
    expect(matchesWritten(gone(5, 0.12), '63 %')).toBe(false)
    expectWritten(gone(5, 0.12), '100 %')
    expectWritten(gone(5, 0), '100 %')
    // Wow and Flutter come with the same piece: before it the head stands still.
    const wanders = (step: number) =>
      range(tap(echo.render(tone, { build: step, wow: 1, flutter: 1 }), 'builtDelay')).span
    expect(wanders(5)).toBe(0)
    expect(wanders(6)).toBeGreaterThan(1)
  })

  it('step 8, more heads and two sides: with Heads on Three and Time at 600 ms a click comes back at 200 ms, 400 ms and 600 ms, and at the step before at 600 ms only (claim build-heads)', async () => {
    const echo = await lab('delay-and-echo')
    const found = (step: number, values: Record<string, number> = {}) =>
      returns(
        tap(
          echo.render(smallClick(seconds(4)), {
            build: step,
            ...once,
            heads: 2,
            time: 600,
            ...values,
          }),
          'builtHeads',
        ),
      )
    const three = found(7)
    expect(three).toEqual([
      [200, 0.35],
      [400, 0.35],
      [600, 0.45],
    ])
    expectWritten(three[0]![0], '200 ms')
    expectWritten(three[1]![0], '400 ms')
    expectWritten(three[2]![0], '600 ms')
    expect(found(6)).toEqual([[600, 1]])
    expect(matchesWritten(found(6)[0]![0], '200 ms')).toBe(false)
    // Two sides: with Ping pong at 1 the right side's first repeat is silent, and before this
    // piece the two sides are alike.
    const sides = (step: number) => {
      const result = echo.render(smallClick(seconds(4)), {
        build: step,
        mix: 1,
        feedback: 0.5,
        spread: 1,
      })
      return [tap(result, 'builtHeads')[12_100]!, tap(result, 'builtRight')[12_100]!]
    }
    expect(sides(7)[0]).toBeGreaterThan(0)
    expect(sides(7)[1]).toBe(0)
    expect(sides(6)[1]).toBe(sides(6)[0])
  })

  it('with all eight pieces the build is the device, sample for sample: every sample of both sides of its output is the same number as the device puts out, on every loop and at every setting tried (claim build-same)', async () => {
    const echo = await lab('delay-and-echo')
    for (const id of ['clicks', 'drums', 'guitar', 'pad']) {
      const source = await benchSource(id, seconds(4))
      for (const values of [
        {},
        busy,
        { feedback: 1.1, time: 30 },
        { time: 100.01, heads: 3, spread: 1 },
      ]) {
        // The last step shows the whole build: its output against the device's, a sample at a time.
        const result = echo.render(source, { ...values, build: 7 })
        for (const side of [0, 1]) {
          const built = tap(result, 'built', side)
          const device = tap(result, 'out', side)
          expect(built.length).toBe(seconds(4))
          expect(
            built.findIndex((v, i) => v !== device[i]),
            `${id}, side ${side}, ${JSON.stringify(values)}: the first sample that differs`,
          ).toBe(-1)
        }
        // The lab's own reading of the same comparison is then at its floor, which is all −140
        // can say: no difference, or one further down than that.
        expectWritten(result.checks.builtDifference!, '−140 dB')
      }
    }
    // The comparison is of the whole build whichever step is shown, and it is a comparison: a
    // build with a piece missing is not the device.
    const drums = await benchSource('drums', seconds(4))
    const shown = echo.render(drums, { ...busy, build: 3 })
    expectWritten(shown.checks.builtDifference!, '−140 dB')
    expect(tap(shown, 'built').some((v, i) => v !== tap(shown, 'out')[i])).toBe(true)
    // Asleep on silence, as the device is: both put out exact zeros.
    const asleep = echo.render(silence(seconds(1)), { ...busy, build: 7 })
    expect(tap(asleep, 'built').every((v) => v === 0)).toBe(true)
    expect(tap(asleep, 'out').every((v) => v === 0)).toBe(true)
  })

  // ---- the named sets: what each card plays, and the number its card states -------------------

  it('renders every named set on its own source, finite, heard and under full scale', async () => {
    const echo = await lab('delay-and-echo')
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = await played(echo, name)
      const sound = set.tap ?? 'out'
      for (const data of result.taps[sound]!.channels_data) {
        expect(
          data.every((v) => Number.isFinite(v)),
          name,
        ).toBe(true)
        expect(peak(data), `${name} fits`).toBeLessThan(1)
      }
      expect(gainToDb(level(result, sound)), `${name} is heard`).toBeGreaterThan(-50)
      // No card moves the build.
      expect(set.values?.build, name).toBeUndefined()
    }
  })

  it('answers a picked line between its notes: over the loop the echoes stand 3.8 dB under the line (claim use-line)', async () => {
    const echo = await lab('delay-and-echo')
    const result = await played(echo, 'line')
    expectWritten(echoesUnder(result, settings.sets.line!.values!.mix!), '3.8 dB')
    // Three sixteenths of the loop: the bench's sixteenth is 6,000 samples.
    expect(settings.sets.line!.values!.time! * 48).toBe(3 * 6000)
  })

  it('gives each drum hit one close repeat and no second: the heads read 6.1 dB under the dry drums in the output (claim use-slap)', async () => {
    const echo = await lab('delay-and-echo')
    const result = await played(echo, 'slap')
    expectWritten(echoesUnder(result, settings.sets.slap!.values!.mix!), '6.1 dB')
    // One repeat: a click through the same setting comes back once.
    const { values } = resolveSet(echo.description, settings.sets.slap!)
    const read = tap(echo.render(smallClick(seconds(4)), values), 'heads')
    expect(returns(read).length).toBe(1)
    expect(returns(read)[0]![0]).toBe(110)
  })

  it('darkens a long trail: on the wash a trip costs 3.4 dB at 1 kHz and 12.6 dB at 4 kHz (claim use-wash)', async () => {
    const echo = await lab('delay-and-echo')
    const result = await played(echo, 'wash')
    expectWritten(trip(result, 1000), '3.4 dB')
    expectWritten(trip(result, 4000), '12.6 dB')
    // The card's picture: the first repeat is flat, and each later one has lost more at both ends
    // than in the middle, and most at the top.
    for (const hz of [50, 1000, 16_000])
      expect(Math.abs(at(tap(result, 'repeat1'), hz))).toBeLessThan(0.01)
    for (const id of ['repeat2', 'repeat3', 'repeat5']) {
      const middle = at(tap(result, id), 1000)
      expect(at(tap(result, id), 50)).toBeLessThan(middle - 10)
      expect(at(tap(result, id), 16_000)).toBeLessThan(at(tap(result, id), 50))
    }
  })

  it('keeps the lows out of the loop: on the bass setting a trip costs 18.6 dB at 100 Hz and 7.3 dB at 1 kHz (claim use-low)', async () => {
    const echo = await lab('delay-and-echo')
    const result = await played(echo, 'low')
    expectWritten(trip(result, 100), '18.6 dB')
    expectWritten(trip(result, 1000), '7.3 dB')
    // The first repeat has all its lows: only what goes round again loses them.
    expect(Math.abs(at(tap(result, 'repeat1'), 100))).toBeLessThan(0.01)
  })

  it('loses 3 dB a trip at 1 kHz and 15.3 dB at 4 kHz with High cut at 2 kHz and Feedback at 0.8 (claim way-dark)', async () => {
    const echo = await lab('delay-and-echo')
    const result = await played(echo, 'dark')
    expectWritten(trip(result, 1000), '3 dB')
    expectWritten(trip(result, 4000), '15.3 dB')
  })

  it('reads a click at 250 ms, 500 ms and 750 ms on the three-heads card (claim way-three)', async () => {
    const echo = await lab('delay-and-echo')
    const { values } = resolveSet(echo.description, settings.sets.three!)
    const found = returns(tap(echo.render(smallClick(seconds(4)), { ...values, ...once }), 'heads'))
    expect(found.map(([, size]) => size)).toEqual([0.35, 0.35, 0.45])
    expectWritten(found[0]![0], '250 ms')
    expectWritten(found[1]![0], '500 ms')
    expectWritten(found[2]![0], '750 ms')
  })

  it('bends the repeats between 8.7 cents flat and 6.8 cents sharp over the 4 s loop on the worn card (claim way-worn)', async () => {
    const echo = await lab('delay-and-echo')
    const speed = range(tap(await played(echo, 'worn'), 'speed'))
    expectWritten(-cents(speed.lo), '8.7 cents')
    expectWritten(cents(speed.hi), '6.8 cents')
  })

  it('lets a trail build and holds it: on the swell card the heads read 3.0 dB more than the line going in, and the largest sample on the tape is 0.25 (claim way-swell)', async () => {
    const echo = await lab('delay-and-echo')
    const result = await played(echo, 'swell')
    expectWritten(gainToDb(level(result, 'heads')) - gainToDb(level(result, 'in')), '3.0 dB')
    expectWritten(Math.max(peak(tap(result, 'tape')), peak(tap(result, 'tape', 1))), '0.25')
    // At this card's Mix the swell stays under the playing in the output.
    expect(echoesUnder(result, settings.sets.swell!.values!.mix!)).toBeGreaterThan(0)
  })

  it('starts the tape at 2.67 times its speed, 17 semitones up, when Time is shortened by 200 ms on the dive card (claim way-dive)', async () => {
    const echo = await lab('delay-and-echo')
    const speed = tap(await played(echo, 'dive'), 'speed')
    const fastest = range(speed).hi
    expect(speed[speed.length / 2]).toBe(fastest)
    expectWritten(fastest, '2.67')
    expectWritten(12 * Math.log2(fastest), '17 semitones')
    // Before the turn the transport is steady.
    expect(speed[speed.length / 2 - 1]).toBe(1)
    // At the loop's start Time is turned back by 200 ms, more than the motor's 120: the tape
    // runs backwards at first, and that is the slowest it goes.
    expect(speed[0]).toBeCloseTo(1 - 200 / 120, 2)
    expect(range(speed).lo).toBe(speed[0])
  })

  it('grows until the ceiling holds it: on the runaway card the heads read 7.0 dB more than the drums going in, and the largest sample on the tape is 0.52 (claim fault-runaway)', async () => {
    const echo = await lab('delay-and-echo')
    const result = await played(echo, 'runaway')
    expectWritten(gainToDb(level(result, 'heads')) - gainToDb(level(result, 'in')), '7.0 dB')
    expectWritten(Math.max(peak(tap(result, 'tape')), peak(tap(result, 'tape', 1))), '0.52')
    // The ceiling of that Drive: one over 1 + 3 × 0.3.
    expect(peak(tap(result, 'tape'))).toBeLessThan(1 / 1.9)
  })

  it('buries the mix: on the mud card the echoes stand 4.5 dB over the mix itself in the output (claim fault-mud)', async () => {
    const echo = await lab('delay-and-echo')
    const result = await played(echo, 'mud')
    expectWritten(-echoesUnder(result, settings.sets.mud!.values!.mix!), '4.5 dB')
  })

  it('repeats a click 33 times in a second with Time at 30 ms, 1,440 samples apart (claim fault-buzz)', async () => {
    const echo = await lab('delay-and-echo')
    const read = tap(await played(echo, 'buzz'), 'heads')
    // The clicks of the bench come once a second, the first at the loop's first sample.
    let count = 0
    for (let k = 1; k * 1440 < RATE; k += 1) {
      const from = k * 1440 - 20
      const found = peakAt(read, from, from + 200)
      if (Math.abs(read[found]!) > 0 && found - k * 1440 < 20) count += 1
    }
    expectWritten(count, '33')
    // The first is to the sample; the later ones are a little late, as the claim "late" says.
    expectWritten(peakAt(read, 1000, 2000), '1,440 samples')
  })

  it('takes 2.5 dB from each repeat of a burst at a Feedback of 0.75 (claim myth-feedback)', async () => {
    const echo = await lab('delay-and-echo')
    const levels = tap(echo.render(smallClick(seconds(0.5)), { feedback: 0.75 }), 'repeats')
    for (let k = 1; k < 12; k += 1) expectWritten(levels[k - 1]! - levels[k]!, '2.5 dB')
    // Twenty-three repeats on it has not yet fallen 60 dB, where a Feedback of 0.5 took ten.
    expect(levels[0]! - levels[23]!).toBeLessThan(60)
    expect(levels[0]! - levels[23]!).toBeGreaterThan(57)
  })

  it("starts the page's device table from the device's own defaults: the settings file's defaults, laid over the lab's starting values, are device.json's", async () => {
    const echo = await lab('delay-and-echo')
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/tape-echo/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const { values } = resolveSet(echo.description, { values: settings.defaults!.values })
    for (const one of device.params) expect(values[one.key], one.key).toBe(one.default)
    // The controls the lesson adds for itself are no parameter of the device, and stay put.
    const own = echo.description.controls.filter(
      (one) => one.id !== 'build' && !device.params.some((param) => param.key === one.id),
    )
    expect(own.map((one) => one.id).sort()).toEqual(['fraction', 'nudge', 'ringBack'])
    for (const one of own) expect(values[one.id], one.id).toBe(one.initial)
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(settings.defaults!.values)) {
      expect(echo.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
  })
})
