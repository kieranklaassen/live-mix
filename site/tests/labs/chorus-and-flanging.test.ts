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
  noise,
  POINT_RATE,
  range,
  RATE,
  rms,
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

const NAME = 'chorus-and-flanging'

/** One point of a control tap, in seconds. */
const POINT = 1 / POINT_RATE

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings(NAME)!

/** A named set as its card plays it: on its own source, with `over` laid on its values. */
async function played(theLab: Lab, name: string, over: Record<string, number> = {}) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(theLab.description, set)
  return theLab.render(await benchSource(source!, seconds(4)), { ...values, ...over })
}

/** The values of a named set, every control filled in. */
function valuesOf(theLab: Lab, name: string) {
  return resolveSet(theLab.description, settings.sets[name]!).values
}

const tap = (result: RenderResult, id: string, channel = 0) =>
  result.taps[id]!.channels_data[channel]!

/** White noise, the same on both sides. */
function monoNoise(frames: number): Source {
  const { left } = noise(0.25, frames)
  return { left, right: left.slice() }
}

/** The level of `x` against the level of `reference`, in dB. */
const against = (x: Float32Array, reference: Float32Array) => gainToDb(rms(x) / rms(reference))

/** The frequency of the lowest bin within three bins of `hz`, and its level. */
function notchNear(spectrum: Float32Array, hz: number) {
  const centre = Math.round(hz / BIN)
  let at = centre
  for (let k = centre - 3; k <= centre + 3; k += 1) if (spectrum[k]! < spectrum[at]!) at = k
  return { hz: at * BIN, level: spectrum[at]! }
}

/** The seconds at which a control tap rises through `level`. */
function risings(x: Float32Array, level: number): number[] {
  const out: number[] = []
  for (let i = 1; i < x.length; i += 1) {
    if (x[i - 1]! < level && x[i]! >= level) {
      out.push((i - 1 + (level - x[i - 1]!) / (x[i]! - x[i - 1]!)) * POINT)
    }
  }
  return out
}

function correlation(a: Float32Array, b: Float32Array): number {
  let ab = 0
  let aa = 0
  let bb = 0
  for (let i = 0; i < a.length; i += 1) {
    ab += a[i]! * b[i]!
    aa += a[i]! * a[i]!
    bb += b[i]! * b[i]!
  }
  return ab / Math.sqrt(aa * bb)
}

/** The slowest and the fastest a sine comes back, in hertz, counted over twenty of its cycles at a time. */
function pitchRange(wave: Float32Array) {
  const crossings: number[] = []
  for (let i = 1; i < wave.length; i += 1) {
    if (wave[i - 1]! < 0 && wave[i]! >= 0)
      crossings.push(i - 1 - wave[i - 1]! / (wave[i]! - wave[i - 1]!))
  }
  let slowest = Infinity
  let fastest = -Infinity
  for (let i = 20; i < crossings.length; i += 1) {
    const hz = (20 * RATE) / (crossings[i]! - crossings[i - 20]!)
    slowest = Math.min(slowest, hz)
    fastest = Math.max(fastest, hz)
  }
  return { slowest, fastest }
}

/** The notches of a curve tap: each point lower than both its neighbours and under `below` dB. */
function notchesOf(result: RenderResult, id: string, below: number) {
  const curve = tap(result, id)
  const step = result.taps[id]!.x1 / (curve.length - 1)
  const found: { hz: number; db: number }[] = []
  for (let k = 1; k < curve.length - 1; k += 1) {
    if (curve[k]! < curve[k - 1]! && curve[k]! <= curve[k + 1]! && curve[k]! < below) {
      found.push({ hz: k * step, db: curve[k]! })
    }
  }
  return found
}

/** The highest point of a curve tap between two frequencies. */
function topBetween(result: RenderResult, id: string, from: number, to: number) {
  const curve = tap(result, id)
  const step = result.taps[id]!.x1 / (curve.length - 1)
  let top = Math.ceil(from / step)
  for (let k = top; k * step <= to; k += 1) if (curve[k]! > curve[top]!) top = k
  return { hz: top * step, db: curve[top]! }
}

/** The comb's measured curve: its points, and the highest and lowest of them up to `upTo` hertz. */
async function combAt(values: Record<string, number | undefined>, upTo = 1000) {
  const theLab = await lab(NAME)
  const out = theLab.render(silence(seconds(0.1)), values)
  const curve = tap(out, 'comb')
  const last = Math.floor(upTo / BIN)
  let top = 1
  let bottom = 1
  for (let k = 1; k <= last; k += 1) {
    if (curve[k]! > curve[top]!) top = k
    if (curve[k]! < curve[bottom]!) bottom = k
  }
  return {
    out,
    curve,
    wet: tap(out, 'combWet'),
    error: out.checks.combError!,
    top: { hz: top * BIN, db: curve[top]! },
    bottom: { hz: bottom * BIN, db: curve[bottom]! },
  }
}

/** True when two taps hold the same samples on both sides. */
const sameSamples = (result: RenderResult, a: string, b: string) =>
  [0, 1].every((c) => tap(result, a, c).every((v, i) => v === tap(result, b, c)[i]))

/** The largest distance between two control taps, point for point. */
function furthestApart(a: Float32Array, b: Float32Array) {
  let worst = 0
  for (let i = 0; i < a.length; i += 1) worst = Math.max(worst, Math.abs(a[i]! - b[i]!))
  return worst
}

const LOOPS = ['noise', 'chords', 'pad', 'drums', 'guitar', 'mix', 'saw', 'sine', 'clicks']

/** Settings that reach every piece of the build: both signs of feedback, every kind of shape. */
const TRIED = [
  {},
  { feedback: 80, depth: 100 },
  { feedback: -90, shape: 4, stereo: 180, delayMs: 0.5, mix: 0.3 },
  { shape: 5, rate: 3, delayMs: 10, feedback: 50 },
  { shape: 2, rate: 7.3, depth: 77, delayMs: 3.3, stereo: 0 },
]

describe('chorus and flanging', () => {
  it('is a sound lab on noise: every tap says something, loops, and answers to every control', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const result = theLab.render(source, {})
    expectSoundLab(theLab, source, result)
  })

  it('has a build path of five steps that is held to the Flanger at every step, on noise and on single samples, with Feedback at 50 % so that its piece does something', async () => {
    const theLab = await lab(NAME)
    expectBuild(theLab, await benchSource('noise', seconds(4)), { feedback: 50 })
    expectBuild(theLab, await benchSource('clicks', seconds(4)), { feedback: 50 })
  })

  // ── The comb, held still ────────────────────────────────────────────────

  it('puts the notches of white noise where the formula does for a delay of 2.5 ms: 200 Hz, 600 Hz and 1,000 Hz by the formula, 199 Hz, 598 Hz and 996 Hz as found, each within one bin (claim notch-first)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    theLab.render(source, {})
    const through = theLab.spectrum('still')
    const before = theLab.spectrum('in')
    for (let k = 0; k < 10; k += 1) {
      const expected = (2 * k + 1) / (2 * 0.0025)
      const found = notchNear(through, expected)
      expect(Math.abs(found.hz - expected)).toBeLessThanOrEqual(BIN)
      // And it is a notch: 20 dB or more under the noise that went in.
      expect(found.level).toBeLessThan(before[Math.round(expected / BIN)]! - 20)
    }
    expectWritten(1 / (2 * 0.0025), '200 Hz')
    expectWritten(3 / (2 * 0.0025), '600 Hz')
    expectWritten(5 / (2 * 0.0025), '1,000 Hz')
    expectWritten(notchNear(through, 200).hz, '199 Hz')
    expectWritten(notchNear(through, 600).hz, '598 Hz')
    expectWritten(notchNear(through, 1000).hz, '996 Hz')
  })

  it('moves the notches when the delay moves: at 5 ms the first stands at 100 Hz and the rest at its odd multiples, on noise and on the measured comb (claim notch-moves)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const out = theLab.render(source, { delayMs: 5 })
    const through = theLab.spectrum('still')
    for (let k = 0; k < 10; k += 1) {
      const expected = (2 * k + 1) * 100
      expect(Math.abs(notchNear(through, expected).hz - expected)).toBeLessThanOrEqual(BIN)
    }
    const teeth = notchesOf(out, 'teethFlanger', -10)
    expect(teeth).toHaveLength(5)
    expectWritten(teeth[0]!.hz, '100 Hz')
    teeth.forEach((tooth, k) => expect(Math.abs(tooth.hz - (2 * k + 1) * 100)).toBeLessThan(3))
  })

  it('counts the teeth as the delay grows: one notch under 1 kHz at a delay of 1 ms, twelve at 12 ms and thirty at 30 ms (claim teeth-count)', async () => {
    const theLab = await lab(NAME)
    const quiet = silence(seconds(0.1))
    const short = notchesOf(theLab.render(quiet, { delayMs: 1 }), 'teethFlanger', -10)
    expect(short).toHaveLength(1)
    expectWritten(short[0]!.hz, '501 Hz')
    const medium = notchesOf(theLab.render(quiet, { chorusDelay: 12 }), 'teethChorus', -3)
    expect(medium).toHaveLength(12)
    const long = notchesOf(theLab.render(quiet, { chorusDelay: 30 }), 'teethChorus', -3)
    expect(long).toHaveLength(30)
    // And at the Flanger's longest, ten.
    expect(notchesOf(theLab.render(quiet, { delayMs: 10 }), 'teethFlanger', -10)).toHaveLength(10)
  })

  it('takes a 200 Hz sine out altogether at equal parts, more than 120 dB down (claim notch-depth), and leaves a 400 Hz one less than 0.01 dB from where it was (claim tooth-top)', async () => {
    const theLab = await lab(NAME)
    const atNotch = theLab.render(sine(200, 0.5, seconds(1)), {})
    expectWritten(-against(tap(atNotch, 'still'), tap(atNotch, 'in')), 'more than 120 dB')
    const atTooth = theLab.render(sine(400, 0.5, seconds(1)), {})
    expectWritten(Math.abs(against(tap(atTooth, 'still'), tap(atTooth, 'in'))), 'less than 0.01 dB')
  })

  it('makes the notch only 6.0 dB deep with Mix at 0.25 (claim notch-quarter) and no notch at all with Mix at 1: the comb is flat to less than 0.01 dB up to 3,990 Hz (claim mix-one)', async () => {
    const theLab = await lab(NAME)
    const quarter = theLab.render(sine(200, 0.5, seconds(1)), { mix: 0.25 })
    expectWritten(-against(tap(quarter, 'still'), tap(quarter, 'in')), '6.0 dB')
    const wetOnly = await combAt({ mix: 1 }, 3990)
    expectWritten(
      Math.max(Math.abs(wetOnly.top.db), Math.abs(wetOnly.bottom.db)),
      'less than 0.01 dB',
    )
  })

  it('lets half the power of white noise through the comb at equal parts: 3.0 dB down (claim comb-power)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const out = theLab.render(source, {})
    expectWritten(-against(tap(out, 'still'), tap(out, 'in')), '3.0 dB')
  })

  it('measures the comb the formula draws when the delay is a whole number of samples, less than −120 dB from it against a gain of 1 (claim comb-error)', async () => {
    for (const values of [
      {},
      { feedback: 50 },
      { feedback: -50, mix: 0.3 },
      { delayMs: 1 },
      { delayMs: 5, feedback: 30 },
    ]) {
      expectWritten((await combAt(values)).error, 'less than −120 dB')
    }
  })

  it('lands 58 dB under a gain of 1 from the formula when the delay falls between samples, at 2.6 ms (claim comb-error-between)', async () => {
    const between = await combAt({ delayMs: 2.6 })
    expectWritten(-between.error, '58 dB')
  })

  // ── Feedback ────────────────────────────────────────────────────────────

  it('raises the peaks to +3.5 dB at 50 % feedback (claim feedback-peak) and fills the notches to −15.6 dB (claim feedback-trough)', async () => {
    const half = await combAt({ feedback: 50 })
    expectWritten(half.curve[0]!, '+3.5 dB')
    expectWritten(half.top.db, '+3.5 dB')
    expect(Math.abs(half.top.hz - 400)).toBeLessThanOrEqual(BIN)
    expectWritten(half.bottom.db, '−15.6 dB')
    expect(Math.abs(half.bottom.hz - 200)).toBeLessThanOrEqual(BIN)
    // With none, the peaks stand at 0 dB.
    const none = await combAt({})
    expect(Math.abs(none.top.db)).toBeLessThan(0.01)
  })

  it('reaches +20.4 dB at 95 % feedback (claim feedback-95), where the delayed path alone is at +26 dB (claim loop-26)', async () => {
    const most = await combAt({ feedback: 95 })
    expectWritten(most.curve[0]!, '+20.4 dB')
    expectWritten(most.wet[0]!, '+26 dB')
  })

  it('puts the first peak at 1,922 Hz, not 2,000 Hz, at the shortest delay, 0.5 ms, with Feedback at 90 %: the loop is one sample longer than the delay (claim loop-sample)', async () => {
    const short = await combAt({ delayMs: 0.5, feedback: 90 }, 3990)
    // Above 1 kHz, so the peak at 0 Hz is not the one found.
    let top = Math.ceil(1000 / BIN)
    for (let k = top; k * BIN < 3000; k += 1) if (short.curve[k]! > short.curve[top]!) top = k
    expect(Math.abs(top * BIN - RATE / 25)).toBeLessThanOrEqual(BIN)
    expectWritten(top * BIN, '1,922 Hz')
    expect(matchesWritten(top * BIN, '2,000 Hz')).toBe(false)
  })

  it('leaves −6.1 dB at the odd multiples with Feedback at −50 % (claim negative-half), a ripple of 1.1 dB under 1 kHz at −62 % (claim negative-flat), and peaks of +13.0 dB there at −90 % (claim negative-peaks)', async () => {
    const half = await combAt({ feedback: -50 })
    expectWritten(half.bottom.db, '−6.1 dB')
    const flat = await combAt({ feedback: -62 })
    expectWritten(flat.top.db - flat.bottom.db, '1.1 dB')
    const strong = await combAt({ feedback: -90 })
    expectWritten(strong.top.db, '+13.0 dB')
    expect(Math.abs(strong.top.hz - 200)).toBeLessThanOrEqual(BIN)
    // The delayed path by itself peaks at the odd multiples at any negative setting.
    const wet = half.wet
    let top = 1
    for (let k = 1; k * BIN < 390; k += 1) if (wet[k]! > wet[top]!) top = k
    expect(Math.abs(top * BIN - 200)).toBeLessThanOrEqual(BIN)
  })

  // ── The oscillator and the read point ───────────────────────────────────

  it('sweeps the read point from 1.31 ms to 3.69 ms at the starting settings (claim depth-half) and from 0.125 ms to 4.875 ms at full depth (claim depth-full)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const half = range(tap(theLab.render(source, {}), 'delayMs'))
    expectWritten(half.lo, '1.31 ms')
    expectWritten(half.hi, '3.69 ms')
    const full = range(tap(theLab.render(source, { depth: 100 }), 'delayMs'))
    expectWritten(full.lo, '0.125 ms')
    expectWritten(full.hi, '4.875 ms')
  })

  it("reads the right side's oscillator a quarter of a cycle ahead at Stereo 90°: at 0.25 Hz its read point rises through the centre 1.00 s sooner than the left's, and at Stereo 0° the two are one (claim stereo-ahead)", async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const out = theLab.render(source, {})
    // The left side's read point rises through the centre just after the loop's start, and the
    // right side's a second before the loop's end: a second sooner, counted round the loop.
    const left = risings(tap(out, 'delayMs'), 2.5)[0]!
    const right = risings(tap(out, 'delayMsRight'), 2.5)[0]!
    expect(left).toBeLessThan(0.1)
    expectWritten((left - right + 4) % 4, '1.00 s')
    const together = theLab.render(source, { stereo: 0 })
    expect(furthestApart(tap(together, 'delayMs'), tap(together, 'delayMsRight'))).toBe(0)
  })

  it('sweeps the lowest notch of noise between 136 Hz, where the delay is longest, and 381 Hz, where it is shortest, by the formula, and finds it less than 12 Hz from each (claim sweep-notch)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    theLab.render(source, {})
    // The read point is at its longest a second into the loop and at its shortest at three.
    for (const [at, delayMs, written] of [
      [1, 3.6875, '136 Hz'],
      [3, 1.3125, '381 Hz'],
    ] as const) {
      const expected = 1000 / (2 * delayMs)
      expectWritten(expected, written)
      const around = theLab.spectrum('flanger', 0, seconds(at - 0.15), seconds(0.3))
      const centre = Math.round(expected / BIN)
      let lowest = centre - 4
      for (let k = centre - 4; k <= centre + 4; k += 1) if (around[k]! < around[lowest]!) lowest = k
      expectWritten(Math.abs(lowest * BIN - expected), 'less than 12 Hz')
    }
  })

  it("takes out the saw's odd harmonics with the delay at 4.55 ms: the 110 Hz fundamental more than 50 dB down, 220 Hz and 440 Hz less than 0.1 dB from where they were (claim saw-odd)", async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('saw', seconds(4))
    // 4.55 ms as the card sets it, and the nearest place the page's control stops at.
    for (const delayMs of [valuesOf(theLab, 'late').delayMs!, 0.5 * 20 ** 0.737]) {
      theLab.render(source, { delayMs, depth: 0 })
      const through = theLab.spectrum('still')
      const before = theLab.spectrum('in')
      const change = (hz: number) => through[Math.round(hz / BIN)]! - before[Math.round(hz / BIN)]!
      expectWritten(-change(110), 'more than 50 dB')
      expect(change(330)).toBeLessThan(-40)
      expectWritten(Math.abs(change(220)), 'less than 0.1 dB')
      expectWritten(Math.abs(change(440)), 'less than 0.1 dB')
    }
    expect(valuesOf(theLab, 'late').delayMs).toBe(4.55)
    // The card plays the Flanger with its Depth at 0, which is the comb held still.
    const card = await played(theLab, 'late')
    expect(sameSamples(card, 'flanger', 'still')).toBe(true)
  })

  it('never reads closer than two samples, 0.042 ms, even at 0.5 ms and full depth (claim shortest-read)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const out = theLab.render(source, { delayMs: 0.5, depth: 100 })
    const shortest = range(tap(out, 'delayMs')).lo
    expect(shortest).toBeCloseTo(2000 / RATE, 5)
    expectWritten(shortest, '0.042 ms')
  })

  it('draws each shape as the oscillator makes it: a sine from 0, a triangle from −1 to +1 at half way, ramps, a square, one held value', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    // At 0.25 Hz the loop is one cycle: points 0, 3000, 6000 and 9000 are its quarters.
    const quarters = (shape: number) => {
      const wave = tap(theLab.render(source, { shape }), 'lfo')
      return [wave[0]!, wave[3000]!, wave[6000]!, wave[9000]!]
    }
    const near = (found: number[], wanted: number[]) =>
      found.forEach((value, i) => expect(value).toBeCloseTo(wanted[i]!, 3))
    near(quarters(0), [0, 1, 0, -1])
    near(quarters(1), [-1, 0, 1, 0])
    near(quarters(2), [-1, -0.5, 0, 0.5])
    near(quarters(3), [1, 0.5, 0, -0.5])
    near(quarters(4), [1, 1, -1, -1])
    const held = tap(theLab.render(source, { shape: 5 }), 'lfo')
    // Random holds one value for a whole cycle.
    expect(range(held, 100, 11_900).span).toBe(0)
  })

  it('takes 3 ms to cover 63 % of a jump in the delay, with the Square shape (claim lag)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const out = theLab.render(source, { shape: 4 })
    const wave = tap(out, 'lfo')
    const read = tap(out, 'delayMs')
    let jump = 1000
    while (wave[jump] === wave[jump - 1]) jump += 1
    const from = read[jump - 1]!
    const to = read[jump + 600]!
    expect(from).toBeCloseTo(3.6875, 2)
    expect(to).toBeCloseTo(1.3125, 2)
    let k = jump
    while (read[k]! > from + (to - from) * (1 - Math.exp(-1))) k += 1
    const ms = (k - jump) * POINT * 1000
    expectWritten(ms, '3 ms')
    expect(ms).toBeGreaterThan(2.6)
    expect(ms).toBeLessThan(3.4)
  })

  it("bends the Flanger's delayed copy by 3.2 cents at most at its starting settings (claim flanger-cents)", async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const read = tap(theLab.render(source, {}), 'delayMs')
    let steepest = 0
    for (let i = 1; i < read.length; i += 1) {
      steepest = Math.max(steepest, Math.abs(read[i]! - read[i - 1]!) / 1000 / POINT)
    }
    expectWritten(1200 * Math.log2(1 + steepest), '3.2 cents')
  })

  // ── The Chorus ──────────────────────────────────────────────────────────

  it('bends each voice of the Chorus 21.6 cents sharp and 21.9 cents flat at its starting settings (claim chorus-cents)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const out = theLab.render(source, {})
    for (const id of ['cents1', 'cents2', 'cents3']) {
      const { lo: down, hi: up } = range(tap(out, id))
      expectWritten(up, '21.6 cents')
      expectWritten(-down, '21.9 cents')
    }
    // The slope the formula gives: 2π × 0.8 Hz × 2.5 ms.
    const slope = 2 * Math.PI * 0.8 * 0.0025
    expectWritten(1200 * Math.log2(1 + slope), '21.6 cents')
    expectWritten(-1200 * Math.log2(1 - slope), '21.9 cents')
  })

  it('plays a 1 kHz sine back from one voice at 987.4 Hz to 1,012.6 Hz, counted from its zero crossings (claim chorus-cents-heard)', async () => {
    const theLab = await lab(NAME)
    const out = theLab.render(sine(1000, 0.5, seconds(4)), {})
    // Twenty cycles at a time, 20 ms: short against the oscillator's 1.25 s.
    const { slowest, fastest } = pitchRange(tap(out, 'voice'))
    expectWritten(slowest, '987.4 Hz')
    expectWritten(fastest, '1,012.6 Hz')
  })

  it('reads three voices from 9.5 ms to 14.5 ms (claim voice-range), a third of a cycle apart, 0.417 s (claim voices-third), their delays adding to 36 ms at every instant (claim voices-sum)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const out = theLab.render(source, {})
    const one = tap(out, 'voice1Ms')
    const two = tap(out, 'voice2Ms')
    const three = tap(out, 'voice3Ms')
    for (const voice of [one, two, three]) {
      expectWritten(range(voice).lo, '9.5 ms')
      expectWritten(range(voice).hi, '14.5 ms')
    }
    // Each voice is ahead of the one before: it rises through the centre a third of 1.25 s sooner.
    const first = risings(one, 12).find((t) => t > 0.9)!
    const second = risings(two, 12).find((t) => t > first - 0.6)!
    const third = risings(three, 12).find((t) => t > first - 1.0)!
    expectWritten(first - second, '0.417 s')
    expectWritten((first - third) / 2, '0.417 s')
    const sum = one.map((v, i) => v + two[i]! + three[i]!)
    expectWritten(range(sum).lo, '36 ms')
    expectWritten(range(sum).hi, '36 ms')
    expect(range(sum).span).toBeLessThan(0.0002)
  })

  it('sets two voices half a cycle apart, 0.625 s (claim voices-half), and caps the sweep at 4 ms either way when the delay is 5 ms: from 1.0 ms to 9.0 ms at full depth (claim chorus-cap)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const pair = theLab.render(source, { voices: 0 })
    const one = tap(pair, 'voice1Ms')
    const two = tap(pair, 'voice2Ms')
    const first = risings(one, 12).find((t) => t > 0.9)!
    const second = risings(two, 12).find((t) => t > first - 0.9)!
    expectWritten(first - second, '0.625 s')
    expect(
      furthestApart(
        one.map((v, i) => v + two[i]!),
        new Float32Array(one.length).fill(24),
      ),
    ).toBeLessThan(0.0001)

    const short = theLab.render(source, { chorusDelay: 5, chorusDepth: 100 })
    const { lo: nearest, hi: furthest } = range(tap(short, 'voice1Ms'))
    expectWritten(nearest, '1.0 ms')
    expectWritten(furthest, '9.0 ms')
    expectWritten((furthest - nearest) / 2, '4 ms')
  })

  it("reads the voices again and lands at −140 dB against the Chorus's own output, the floor of the reading, on three loops and at another setting (claim rebuilt)", async () => {
    const theLab = await lab(NAME)
    for (const id of ['noise', 'saw', 'chords']) {
      const source = await benchSource(id, seconds(4))
      expectWritten(theLab.render(source, {}).checks.rebuilt!, 'at most −140 dB')
    }
    const source = await benchSource('chords', seconds(4))
    const other = {
      voices: 0,
      spread: 100,
      chorusDelay: 7.3,
      chorusDepth: 80,
      chorusRate: 3,
      chorusMix: 0.8,
    }
    expectWritten(theLab.render(source, other).checks.rebuilt!, 'at most −140 dB')
  })

  it('has twelve notches under 1 kHz with the Chorus held still at 12 ms, 83 Hz apart, the first found at 41 Hz, where the formula puts it at 42 Hz (claim chorus-teeth)', async () => {
    const theLab = await lab(NAME)
    const out = theLab.render(silence(seconds(0.1)), { chorusDepth: 0 })
    const teeth = notchesOf(out, 'teethChorus', -3)
    expect(teeth).toHaveLength(12)
    expectWritten(teeth[0]!.hz, '41 Hz')
    expectWritten(1 / (2 * 0.012), '42 Hz')
    expectWritten((teeth[11]!.hz - teeth[0]!.hz) / 11, '83 Hz')
    // One point of the curve is 2.93 Hz: each notch is found within a point of the formula.
    teeth.forEach((tooth, k) => expect(Math.abs(tooth.hz - (2 * k + 1) / 0.024)).toBeLessThan(2.93))
    // And on noise through the running device, within a bin of the spectrum.
    theLab.render(await benchSource('noise', seconds(4)), { chorusDepth: 0 })
    const through = theLab.spectrum('chorus')
    for (let k = 0; k < 12; k += 1) {
      const expected = (2 * k + 1) / 0.024
      const centre = Math.round(expected / BIN)
      let at = centre
      for (let j = centre - 2; j <= centre + 2; j += 1) if (through[j]! < through[at]!) at = j
      expect(Math.abs(at * BIN - expected)).toBeLessThanOrEqual(BIN)
    }
  })

  it('sums three voices that coincide 4.8 dB over one (claim together) and voices that have drifted apart level with one, less than 0.05 dB from it, with two voices and with three (claim apart)', async () => {
    const theLab = await lab(NAME)
    const source = monoNoise(seconds(4))
    const together = theLab.render(source, { chorusDepth: 0, spread: 0 })
    expectWritten(against(tap(together, 'chorusWet'), tap(together, 'voice')), '4.8 dB')
    for (const values of [{ spread: 0 }, {}, { spread: 100 }, { voices: 0 }]) {
      const apart = theLab.render(source, values)
      expectWritten(
        Math.abs(against(tap(apart, 'chorusWet'), tap(apart, 'voice'))),
        'less than 0.05 dB',
      )
    }
  })

  it('loses 0.9 dB of white noise in a voice read between samples, and less than 0.01 dB in one read on them (claim between-samples)', async () => {
    const theLab = await lab(NAME)
    const source = monoNoise(seconds(4))
    const moving = theLab.render(source, {})
    expectWritten(-against(tap(moving, 'voice'), tap(moving, 'in')), '0.9 dB')
    const still = theLab.render(source, { chorusDepth: 0 })
    expectWritten(Math.abs(against(tap(still, 'voice'), tap(still, 'in'))), 'less than 0.01 dB')
  })

  it('brings white noise out of the Chorus 3.4 dB quieter at a Chorus mix of 0.5: the dry and the delayed no longer add as one (claim mix-dip)', async () => {
    const theLab = await lab(NAME)
    const source = monoNoise(seconds(4))
    const out = theLab.render(source, {})
    expectWritten(-against(tap(out, 'chorus'), tap(out, 'in')), '3.4 dB')
  })

  it('gives both sides the same samples at Spread 0 (claim spread-zero) and delayed halves whose correlation is under 0.02 from a Spread of 35 % up (claim spread-apart)', async () => {
    const theLab = await lab(NAME)
    const source = monoNoise(seconds(4))
    for (const voiceChoice of [0, 1]) {
      const centre = theLab.render(source, { spread: 0, voices: voiceChoice })
      expect(tap(centre, 'chorus', 0).every((v, i) => v === tap(centre, 'chorus', 1)[i])).toBe(true)
      for (const amount of [35, 70, 100]) {
        const wide = theLab.render(source, { spread: amount, voices: voiceChoice })
        expectWritten(
          Math.abs(correlation(tap(wide, 'chorusWet', 0), tap(wide, 'chorusWet', 1))),
          'under 0.02',
        )
      }
    }
  })

  it('gives each ear one voice at full Spread with two voices (claim one-each), the right ear a quarter of a cycle, 0.31 s, behind the left (claim two-sides)', async () => {
    const theLab = await lab(NAME)
    const source = monoNoise(seconds(4))
    const out = await played(theLab, 'wide')
    expect(valuesOf(theLab, 'wide')).toMatchObject({ voices: 0, spread: 100 })
    const mono = theLab.render(source, valuesOf(theLab, 'wide'))
    // The left side is voice 1 and nothing else: the summed voices there are that one voice.
    for (const result of [out, mono]) {
      expect(differenceDb(tap(result, 'chorusWet'), tap(result, 'voice'))).toBeLessThan(-120)
    }
    // Voice 2 as the right side reads it rises through the centre a quarter of 1.25 s after voice 1 on the left.
    const left = risings(tap(out, 'voice1Ms'), 12).find((t) => t > 0.9)!
    const right = risings(tap(out, 'voice2MsRight'), 12).find((t) => t > left)!
    expectWritten(right - left, '0.31 s')
    expect(right - left).toBeCloseTo(1.25 / 4, 3)
  })

  it("runs the right side's oscillator 63° ahead at a Spread of 70 %: it rises 0.219 s sooner (claim right-ahead)", async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const out = theLab.render(source, {})
    const left = risings(tap(out, 'voice1Ms'), 12).find((t) => t > 0.9)!
    const right = risings(tap(out, 'voice1MsRight'), 12).find((t) => t > left - 0.6)!
    expectWritten(0.7 * 90, '63°')
    expectWritten(left - right, '0.219 s')
    expect(left - right).toBeCloseTo((0.7 * 90) / 360 / 0.8, 3)
    const full = theLab.render(source, { spread: 100 })
    const leftFull = risings(tap(full, 'voice1Ms'), 12).find((t) => t > 0.9)!
    const rightFull = risings(tap(full, 'voice1MsRight'), 12).find((t) => t > leftFull - 0.6)!
    expect(leftFull - rightFull).toBeCloseTo(1.25 / 4, 3)
  })

  // ── The build, a piece at a time ────────────────────────────────────────

  it('moves the read point at step 2: from 1.31 ms to 3.69 ms at the starting settings, and a 1 kHz sine comes back from the delay at anything from 998.1 Hz to 1,001.9 Hz; with the piece off the read point stands at 2.5 ms and the sine comes back at 1,000.0 Hz (claim build-move)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const tone = sine(1000, 0.5, seconds(4))
    const reads = (build: number) => range(tap(theLab.render(source, { build }), 'builtDelay'))
    const heard = (build: number) => pitchRange(tap(theLab.render(tone, { build }), 'built'))
    expectWritten(reads(1).lo, '1.31 ms')
    expectWritten(reads(1).hi, '3.69 ms')
    expectWritten(heard(1).slowest, '998.1 Hz')
    expectWritten(heard(1).fastest, '1,001.9 Hz')
    // The piece off: the step before.
    expect(matchesWritten(reads(0).lo, '1.31 ms')).toBe(false)
    expect(matchesWritten(reads(0).hi, '3.69 ms')).toBe(false)
    expect(matchesWritten(heard(0).slowest, '998.1 Hz')).toBe(false)
    expect(matchesWritten(heard(0).fastest, '1,001.9 Hz')).toBe(false)
    expectWritten(reads(0).lo, '2.5 ms')
    expectWritten(reads(0).hi, '2.5 ms')
    expectWritten(heard(0).slowest, '1,000.0 Hz')
    expectWritten(heard(0).fastest, '1,000.0 Hz')
  })

  it('makes the comb at step 3: with Depth at 0 a 200 Hz sine comes out more than 120 dB down, where the step before let it through less than 0.01 dB from where it was (claim build-comb)', async () => {
    const theLab = await lab(NAME)
    const tone = sine(200, 0.5, seconds(1))
    const down = (build: number) => {
      const out = theLab.render(tone, { build, depth: 0 })
      return -against(tap(out, 'built'), tap(out, 'in'))
    }
    expectWritten(down(2), 'more than 120 dB')
    // The piece off: the step before.
    expect(matchesWritten(down(1), 'more than 120 dB')).toBe(false)
    expectWritten(Math.abs(down(1)), 'less than 0.01 dB')
  })

  it('sharpens the comb at step 4: with Feedback at 50 % and Depth at 0 a 400 Hz sine comes out 3.5 dB louder than it went in, where the step before let it through less than 0.01 dB from where it was (claim build-feedback)', async () => {
    const theLab = await lab(NAME)
    const tone = sine(400, 0.5, seconds(1))
    const up = (build: number) => {
      const out = theLab.render(tone, { build, depth: 0, feedback: 50 })
      return against(tap(out, 'built'), tap(out, 'in'))
    }
    expectWritten(up(3), '3.5 dB')
    // The piece off: the step before.
    expect(matchesWritten(up(2), '3.5 dB')).toBe(false)
    expectWritten(Math.abs(up(2)), 'less than 0.01 dB')
  })

  it("is the Flanger at step 4, sample for sample: on every loop of the page, at five settings each, the build's output and the device's hold the same numbers, and the check reads −140 dB (claim build-same)", async () => {
    const theLab = await lab(NAME)
    for (const id of LOOPS) {
      const source = await benchSource(id, seconds(4))
      for (const values of TRIED) {
        const out = theLab.render(source, { ...values, build: 3 })
        expect(sameSamples(out, 'built', 'flanger'), `${id} at ${JSON.stringify(values)}`).toBe(
          true,
        )
        expectWritten(out.checks.builtDifference!, 'at most −140 dB')
        // The check does not move with the step the reader chose.
        expect(theLab.render(source, { ...values, build: 0 }).checks.builtDifference).toBe(-140)
      }
    }
    // The step before is not the Flanger once Feedback is turned: the comparison is not empty.
    const source = await benchSource('noise', seconds(4))
    const before = theLab.render(source, { feedback: 80, depth: 100, build: 2 })
    expect(sameSamples(before, 'built', 'flanger')).toBe(false)
  }, 120_000)

  it('reads at three points at step 5, evenly round the cycle: their delays add to 7.5 ms at every instant, less than 0.001 ms from it, where at the step before the sum swings 1.19 ms either way (claim build-voices)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const sum = (build: number, voices = 1) => {
      const out = theLab.render(source, { build, voices })
      const [one, two, three] = ['builtDelay', 'builtDelay2', 'builtDelay3'].map((id) =>
        tap(out, id),
      )
      return range(one!.map((v, i) => v + two![i]! + three![i]!))
    }
    const three = sum(4)
    expectWritten((three.lo + three.hi) / 2, '7.5 ms')
    expectWritten(Math.max(7.5 - three.lo, three.hi - 7.5), 'less than 0.001 ms')
    // The piece off: one point moves, and nothing balances it.
    const one = sum(3)
    expect(matchesWritten(Math.max(7.5 - one.lo, one.hi - 7.5), 'less than 0.001 ms')).toBe(false)
    expectWritten(7.5 - one.lo, '1.19 ms')
    expectWritten(one.hi - 7.5, '1.19 ms')
    // Two points, half a cycle apart, balance as well: the third stays at the Delay.
    const two = sum(4, 0)
    expect(Math.max(7.5 - two.lo, two.hi - 7.5)).toBeLessThan(0.001)
  })

  it('scales the sum of the read points at step 5: on white noise with Mix at 1, three that have drifted apart are less than 0.05 dB from the one of the step before, and three held still at Depth 0 are 4.8 dB over it (claim build-level)', async () => {
    const theLab = await lab(NAME)
    const source = monoNoise(seconds(4))
    const over = (values: Record<string, number>, build: number) => {
      const one = theLab.render(source, { ...values, mix: 1, build: 3 })
      const several = theLab.render(source, { ...values, mix: 1, build })
      return against(tap(several, 'built'), tap(one, 'built'))
    }
    expectWritten(Math.abs(over({}, 4)), 'less than 0.05 dB')
    expectWritten(Math.abs(over({ voices: 0 }, 4)), 'less than 0.05 dB')
    expectWritten(over({ depth: 0 }, 4), '4.8 dB')
    // The piece off: one read point is as loud as itself.
    expect(matchesWritten(over({ depth: 0 }, 3), '4.8 dB')).toBe(false)
  })

  it("lands on the engine's Chorus where the two can be set alike: held still at 10 ms with no Spread, the build's fifth step is more than 130 dB under the Chorus's output from it, and moving, its read points stand 0.03 ms from the Chorus's voices at most (claim build-chorus)", async () => {
    const theLab = await lab(NAME)
    const alike = { build: 4, delayMs: 10, stereo: 0, chorusDelay: 10, spread: 0 }
    for (const voices of [0, 1]) {
      for (const id of ['noise', 'chords', 'drums']) {
        const source = await benchSource(id, seconds(4))
        const still = theLab.render(source, { ...alike, voices, depth: 0, chorusDepth: 0 })
        for (const c of [0, 1]) {
          expectWritten(
            -differenceDb(tap(still, 'built', c), tap(still, 'chorus', c)),
            'more than 130 dB',
          )
        }
        // The Flanger's Depth is a share of the delay and the Chorus's a share of 5 ms:
        // 20 % of 0.95 × 10 ms and 38 % of 5 ms are both 1.9 ms.
        const moving = theLab.render(source, {
          ...alike,
          voices,
          depth: 20,
          rate: 0.8,
          chorusDepth: 38,
          chorusRate: 0.8,
        })
        const pairs = [
          ['builtDelay', 'voice1Ms'],
          ['builtDelay2', 'voice2Ms'],
          ...(voices === 1 ? [['builtDelay3', 'voice3Ms']] : []),
        ] as const
        const worst = Math.max(
          ...pairs.map(([built, voice]) => furthestApart(tap(moving, built!), tap(moving, voice!))),
        )
        expectWritten(worst, '0.03 ms')
      }
    }
  })

  // ── The cards ───────────────────────────────────────────────────────────

  it('renders every named set: the sound its card plays is finite, is not silence and stays under full scale', async () => {
    const theLab = await lab(NAME)
    const sounds = theLab.description.taps
      .filter((one) => one.kind === 'audio')
      .map((one) => one.id)
    for (const [name, set] of Object.entries(settings.sets)) {
      const out = await played(theLab, name)
      const sounding = set.tap ?? 'flanger'
      expect(sounds, name).toContain(sounding)
      for (const c of [0, 1]) {
        const data = tap(out, sounding, c)
        expect(
          data.every((v) => Number.isFinite(v)),
          name,
        ).toBe(true)
        expect(rms(data), name).toBeGreaterThan(0.001)
        expect(range(data).hi, name).toBeLessThan(1)
        expect(range(data).lo, name).toBeGreaterThan(-1)
      }
      expect(Object.keys(set.values ?? {}), name).not.toContain('build')
    }
  })

  it('on the strummed chords reads each voice between 12.0 ms and 16.0 ms behind and bends it 13 cents either way (claim use-strum)', async () => {
    const theLab = await lab(NAME)
    const out = await played(theLab, 'strum')
    for (const [ms, cents] of [
      ['voice1Ms', 'cents1'],
      ['voice2Ms', 'cents2'],
      ['voice3Ms', 'cents3'],
    ] as const) {
      expectWritten(range(tap(out, ms)).lo, '12.0 ms')
      expectWritten(range(tap(out, ms)).hi, '16.0 ms')
      expectWritten(range(tap(out, cents)).hi, '13 cents')
      expectWritten(-range(tap(out, cents)).lo, '13 cents')
    }
  })

  it('on the picked line gives each side one voice, between 29.4 ms and 30.6 ms behind and 1.6 cents off at most (claim use-line)', async () => {
    const theLab = await lab(NAME)
    const out = await played(theLab, 'line')
    expect(differenceDb(tap(out, 'chorusWet'), tap(out, 'voice'))).toBeLessThan(-120)
    for (const id of ['voice1Ms', 'voice2MsRight']) {
      expectWritten(range(tap(out, id)).lo, '29.4 ms')
      expectWritten(range(tap(out, id)).hi, '30.6 ms')
    }
    expectWritten(range(tap(out, 'cents1')).hi, '1.6 cents')
    expectWritten(-range(tap(out, 'cents1')).lo, '1.6 cents')
  })

  it('on the pad sweeps the read point from 0.97 ms to 7.03 ms along a triangle (claim use-pad)', async () => {
    const theLab = await lab(NAME)
    const out = await played(theLab, 'padSweep')
    expect(valuesOf(theLab, 'padSweep').shape).toBe(1)
    expectWritten(range(tap(out, 'delayMs')).lo, '0.97 ms')
    expectWritten(range(tap(out, 'delayMs')).hi, '7.03 ms')
  })

  it('on the drums sweeps the read point from 0.50 ms to 2.50 ms (claim use-drums)', async () => {
    const theLab = await lab(NAME)
    const out = await played(theLab, 'drumJet')
    expectWritten(range(tap(out, 'delayMs')).lo, '0.50 ms')
    expectWritten(range(tap(out, 'delayMs')).hi, '2.50 ms')
  })

  it('on the mix, with Stereo at 0°, reads both sides at the same place at every instant, from 0.36 ms to 4.64 ms (claim use-mix)', async () => {
    const theLab = await lab(NAME)
    const out = await played(theLab, 'mixSweep')
    expect(valuesOf(theLab, 'mixSweep').stereo).toBe(0)
    expect(furthestApart(tap(out, 'delayMs'), tap(out, 'delayMsRight'))).toBe(0)
    expectWritten(range(tap(out, 'delayMs')).lo, '0.36 ms')
    expectWritten(range(tap(out, 'delayMs')).hi, '4.64 ms')
  })

  it('as a jet sweeps the read point from 0.05 ms to 1.95 ms (claim way-jet)', async () => {
    const theLab = await lab(NAME)
    const out = await played(theLab, 'jet')
    expectWritten(range(tap(out, 'delayMs')).lo, '0.05 ms')
    expectWritten(range(tap(out, 'delayMs')).hi, '1.95 ms')
  })

  it("turned over, peaks beside the place a plain comb has its first notch: with the sweep stopped at 1.5 ms and Feedback at −90 %, the first top stands at 328 Hz, at +13 dB, and the plain comb's first notch at 333 Hz (claim way-hollow)", async () => {
    const theLab = await lab(NAME)
    expect(valuesOf(theLab, 'hollow')).toMatchObject({ delayMs: 1.5, feedback: -90 })
    const out = await played(theLab, 'hollow', { depth: 0 })
    const top = topBetween(out, 'teethFlanger', 100, 600)
    expectWritten(top.hz, '328 Hz')
    expectWritten(top.db, '+13 dB')
    expectWritten(1000 / (2 * 1.5), '333 Hz')
    // The loop is one sample longer than the delay: 73 samples, half a cycle of 328.8 Hz.
    expect(Math.abs(top.hz - RATE / (2 * 73))).toBeLessThan(2.93)
    // With no Feedback the same place is a notch.
    const plain = await played(theLab, 'hollow', { depth: 0, feedback: 0 })
    expect(notchesOf(plain, 'teethFlanger', -10)[0]!.hz).toBeGreaterThan(325)
    expect(notchesOf(plain, 'teethFlanger', -10)[0]!.hz).toBeLessThan(340)
  })

  it('tuned, rings at 440 Hz: with the delay at 2.25 ms the loop is 109 samples long (claim way-tuned)', async () => {
    const theLab = await lab(NAME)
    const values = valuesOf(theLab, 'tuned')
    const out = theLab.render(click(seconds(1), 0, 0.5), values)
    // The copy after a single sample: the lag at which it most resembles itself.
    const wet = tap(out, 'flangerWet')
    let best = 50
    let most = -Infinity
    for (let lag = 50; lag < 400; lag += 1) {
      let sum = 0
      for (let i = 0; i + lag < 4000; i += 1) sum += wet[i]! * wet[i + lag]!
      if (sum > most) {
        most = sum
        best = lag
      }
    }
    expectWritten(best, '109 samples')
    expectWritten(RATE / best, '440 Hz')
  })

  it('as vibrato bends the one voice 35.5 cents sharp and 36.3 cents flat (claim way-vibrato)', async () => {
    const theLab = await lab(NAME)
    const out = await played(theLab, 'vibrato')
    expect(settings.sets.vibrato!.tap).toBe('voice')
    expectWritten(range(tap(out, 'cents1')).hi, '35.5 cents')
    expectWritten(-range(tap(out, 'cents1')).lo, '36.3 cents')
  })

  it('kept faint, with Mix at 0.2, cuts notches only 4.4 dB deep (claim way-faint)', async () => {
    const theLab = await lab(NAME)
    const out = await played(theLab, 'faint')
    expect(valuesOf(theLab, 'faint').mix).toBe(0.2)
    expectWritten(-range(tap(out, 'comb')).lo, '4.4 dB')
    expectWritten(-gainToDb(1 - 2 * 0.2), '4.4 dB')
  })

  it('too fast and too deep, bends each voice 252.6 cents sharp and 295.8 cents flat (claim fault-seasick)', async () => {
    const theLab = await lab(NAME)
    const out = await played(theLab, 'seasick')
    expectWritten(range(tap(out, 'cents1')).hi, '252.6 cents')
    expectWritten(-range(tap(out, 'cents1')).lo, '295.8 cents')
  })

  it('with Feedback at 95 %, rings on: 0.61 s after a single sample goes in, its returns are still a thousandth of the size of the first, 60 dB under it (claim fault-ring)', async () => {
    const theLab = await lab(NAME)
    const values = valuesOf(theLab, 'ringing')
    expect(values.feedback).toBe(95)
    const out = theLab.render(click(seconds(4), 0, 0.5), values)
    const wet = tap(out, 'flangerWet')
    const first = range(wet, 0, 400)
    const top = Math.max(first.hi, -first.lo)
    let last = 0
    for (let i = 0; i < wet.length; i += 1) if (Math.abs(wet[i]!) > top / 1000) last = i
    expectWritten(last / RATE, '0.61 s')
    expectWritten(-gainToDb(1 / 1000), '60 dB')
    // With Feedback at half, the same returns are gone in a twentieth of a second.
    const half = theLab.render(click(seconds(4), 0, 0.5), { ...values, feedback: 50 })
    const mild = tap(half, 'flangerWet')
    let gone = 0
    for (let i = 0; i < mild.length; i += 1) if (Math.abs(mild[i]!) > top / 1000) gone = i
    expect(gone / RATE).toBeLessThan(0.06)
  })

  it("starts the page's device table from the Flanger's own defaults: the settings file's defaults, laid over the lab's starting values, are device.json's for each of its seven parameters", async () => {
    const theLab = await lab(NAME)
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/flanger/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const { values } = resolveSet(theLab.description, { values: settings.defaults!.values })
    expect(device.params).toHaveLength(7)
    for (const one of device.params) expect(values[one.key], one.key).toBe(one.default)
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(settings.defaults!.values)) {
      expect(theLab.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
  })

  it("starts its six Chorus controls where the Chorus's own device.json starts them", async () => {
    const theLab = await lab(NAME)
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/chorus/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const start = (id: string) => theLab.description.controls.find((one) => one.id === id)!.initial
    const theirs = Object.fromEntries(device.params.map((one) => [one.key, one.default]))
    const ours: Record<string, number> = {
      voices: start('voices'),
      rate: start('chorusRate'),
      depth: start('chorusDepth'),
      delayMs: start('chorusDelay'),
      spread: start('spread'),
      mix: start('chorusMix'),
    }
    // A control's start is a float, so 0.8 is held as a float holds it.
    for (const [key, value] of Object.entries(ours)) expect(value, key).toBeCloseTo(theirs[key]!, 6)
  })
})
