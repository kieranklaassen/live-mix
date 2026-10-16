import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
  BIN,
  differenceDb,
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  mean,
  peak,
  POINT_RATE,
  points,
  range,
  RATE,
  rms,
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

/** The loop's sine: 440 Hz, 12 dB under full scale, as the page plays it. */
const tone = () => benchSource('sine', seconds(4))

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings('pitch-shifting')!

/** A named set as its card plays it: on its own source, or on `on`, with `over` laid on its values. */
async function played(shifter: Lab, name: string, over: Record<string, number> = {}, on?: string) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(shifter.description, set)
  return shifter.render(await benchSource(on ?? source!, seconds(4)), { ...values, ...over })
}

const tap = (result: RenderResult, id: string, channel = 0) =>
  result.taps[id]!.channels_data[channel]!

/**
 * The amplitude, in dB, of the line at exactly `hz` in the three seconds from 0.5 s: the sum the
 * Fourier transform is, at that one frequency, under a Hann window. Lines more than a hertz or
 * two away do not reach it.
 */
function lineDb(x: Float32Array, hz: number): number {
  const from = seconds(0.5)
  const count = seconds(3)
  let re = 0
  let im = 0
  let weight = 0
  for (let i = 0; i < count; i += 1) {
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / count)
    const phase = (2 * Math.PI * hz * i) / RATE
    re += window * x[from + i]! * Math.cos(phase)
    im -= window * x[from + i]! * Math.sin(phase)
    weight += window
  }
  return gainToDb((2 * Math.hypot(re, im)) / weight)
}

/**
 * The frequency of the tallest line within a hertz of `near`, in hertz: `lineDb` at steps of
 * 0.04 Hz, and the top of the parabola through the tallest step and its two neighbours.
 */
function peakHz(x: Float32Array, near: number): number {
  const step = 0.04
  let best = -50
  let top = -Infinity
  for (let k = -25; k <= 25; k += 1) {
    const here = lineDb(x, near + k * step)
    if (here > top) {
      top = here
      best = k
    }
  }
  const before = lineDb(x, near + (best - 1) * step)
  const after = lineDb(x, near + (best + 1) * step)
  const curve = before - 2 * top + after
  return near + (best + (curve < 0 ? (0.5 * (before - after)) / curve : 0)) * step
}

/**
 * Every crest of a wave from 0.5 s to 3.5 s: each sample that stands further from zero than
 * both its neighbours, raised to the top of the parabola through the three, with the time it
 * stands at in seconds.
 */
function crests(x: Float32Array): { heights: number[]; times: number[] } {
  const heights: number[] = []
  const times: number[] = []
  for (let i = seconds(0.5); i < seconds(3.5); i += 1) {
    const [a, b, c] = [Math.abs(x[i - 1]!), Math.abs(x[i]!), Math.abs(x[i + 1]!)]
    if (b < a || b <= c || b < 1e-7) continue
    const curve = a - 2 * b + c
    heights.push(curve < 0 ? b - (0.125 * (a - c) * (a - c)) / curve : b)
    times.push(i / RATE)
  }
  return { heights, times }
}

/** How far the tallest of some heights stands over the least, in dB. */
function depth(heights: ArrayLike<number>): number {
  const { lo, hi } = range(heights)
  return gainToDb(hi) - gainToDb(lo)
}

/** How far a wave's level dips from 0.5 s to 3.5 s, in dB: its tallest crest over its least. */
const dip = (x: Float32Array) => depth(crests(x).heights)

/**
 * How many times a second a height dips: it falls into the lower quarter of its range and
 * climbs out into the upper quarter, and the climbs are counted from the first to the last.
 */
function dipRate(heights: ArrayLike<number>, times: ArrayLike<number>): number {
  const { lo, span } = range(heights)
  let down = false
  const climbs: number[] = []
  for (let k = 0; k < heights.length; k += 1) {
    const v = heights[k]!
    if (!down && v < lo + 0.25 * span) down = true
    else if (down && v > lo + 0.75 * span) {
      down = false
      climbs.push(times[k]!)
    }
  }
  return climbs.length < 2 ? 0 : (climbs.length - 1) / (climbs.at(-1)! - climbs[0]!)
}

/** How many times a second a wave's level dips, from its crests. */
function dipsOf(x: Float32Array): number {
  const { heights, times } = crests(x)
  return dipRate(heights, times)
}

/** `x` moved `by` samples later, round the loop. */
function later(x: Float32Array, by: number): Float32Array {
  const out = new Float32Array(x.length)
  for (let i = 0; i < x.length; i += 1) out[i] = x[(i - by + x.length) % x.length]!
  return out
}

/** The whole number of samples of lateness, from `from` to `to`, at which `x` is nearest `y` moved later. */
function lateness(x: Float32Array, y: Float32Array, from: number, to: number) {
  let best = from
  let least = Infinity
  for (let by = from; by <= to; by += 1) {
    const here = differenceDb(x, later(y, by))
    if (here < least) {
      least = here
      best = by
    }
  }
  return { by: best, db: least }
}

/** Where a click that went in at 1 s comes out of the voice: milliseconds after it, and how tall. */
function copies(voice: Float32Array): { ms: number; peak: number }[] {
  const found: { ms: number; peak: number }[] = []
  const from = seconds(1) - 100
  const to = seconds(2) - 200
  let i = from
  while (i < to) {
    if (Math.abs(voice[i]!) <= 0.01) {
      i += 1
      continue
    }
    // One copy: everything within a millisecond of its tallest sample.
    let top = 0
    let at = i
    let j = i
    for (; j < to && j - at < 48; j += 1) {
      if (Math.abs(voice[j]!) > top) {
        top = Math.abs(voice[j]!)
        at = j
      }
    }
    found.push({ ms: ((at - seconds(1)) * 1000) / RATE, peak: top })
    i = j
  }
  return found
}

/** The largest step between two neighbouring samples from 0.5 s to 3.5 s. */
function steepest(x: Float32Array): number {
  let most = 0
  for (let i = seconds(0.5); i < seconds(3.5); i += 1)
    most = Math.max(most, Math.abs(x[i]! - x[i - 1]!))
  return most
}

/** The time between two jumps back of a head, in ms, from its delay as a control tap. */
function sweepMs(delays: Float32Array, least = 5): number {
  const jumps: number[] = []
  for (let i = 300; i < delays.length - 1; i += 1) {
    if (Math.abs(delays[i + 1]! - delays[i]!) > least) jumps.push(i)
  }
  if (jumps.length < 2) return NaN
  return ((jumps.at(-1)! - jumps[0]!) / (jumps.length - 1) / POINT_RATE) * 1000
}

/** Two sines of one height on both channels. */
function pair(a: number, b: number, height: number, frames: number): Source {
  const one = sine(a, height, frames)
  const two = sine(b, height, frames)
  const left = one.left.map((v, i) => v + two.left[i]!)
  return { left, right: left.slice() }
}

/** A second of silence, then a second of a tone. */
function burst(hz: number): Source {
  const frames = seconds(2)
  const source = silence(frames)
  const whole = sine(hz, 0.25, frames)
  source.left.set(whole.left.subarray(0, frames / 2), frames / 2)
  source.right.set(whole.right.subarray(0, frames / 2), frames / 2)
  return source
}

/** The frequency under which a tone is recorded 3.01 dB down, in Hz, at an interval: found by halving. */
function cornerHz(shifter: Lab, pitchA: number, guess: number): number {
  const loss = (hz: number) => {
    const source = sine(hz, 0.25, seconds(1))
    const ring = tap(shifter.render(source, { pitchA }), 'ring')
    return gainToDb(rms(ring, 24_000) / rms(source.left, 24_000))
  }
  let lo = 0.8 * guess
  let hi = Math.min(1.2 * guess, 23_900)
  for (let k = 0; k < 14; k += 1) {
    const mid = 0.5 * (lo + hi)
    if (loss(mid) > -3.0103) lo = mid
    else hi = mid
  }
  return 0.5 * (lo + hi)
}

const SMOOTH = 0
const GRAIN = 1
const VINTAGE = 2
const CHORDS = 3

/** The largest distance between two taps' samples. */
function apart(a: Float32Array, b: Float32Array): number {
  let most = 0
  for (let i = 0; i < a.length; i += 1) most = Math.max(most, Math.abs(a[i]! - b[i]!))
  return most
}

/** How far a tap's level over the loop stands under another's, in dB. */
const under = (x: Float32Array, y: Float32Array) => gainToDb(rms(y)) - gainToDb(rms(x))

/**
 * What a voice keeps of what was recorded, over the whole loop, in dB. A voice comes out late,
 * by up to a Size in Vintage and by 193 ms in Chords, so a stretch of the loop cut out of both
 * would hold different hits and chords of each. The loop comes round, and the whole of it holds
 * the same of both.
 */
const kept = (result: RenderResult) =>
  gainToDb(rms(tap(result, 'voice')) / rms(tap(result, 'ring')))

/** The same from 0.5 s to 3.5 s, for a steady tone, which is the same sound wherever it is cut. */
const keptOfTone = (result: RenderResult) =>
  gainToDb(
    rms(tap(result, 'voice'), seconds(0.5), seconds(3.5)) /
      rms(tap(result, 'ring'), seconds(0.5), seconds(3.5)),
  )

describe('pitch shifting', () => {
  it('is a sound lab on the sine: every tap says something, loops, and answers to every control', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    const result = shifter.render(source, {})
    // In Vintage no splice is searched for, and one voice sounds, at one interval, in the middle.
    expectSoundLab(shifter, source, result, {
      quiet: ['match', 'ratioA', 'ratioB', 'panA', 'panB'],
    })
  })

  it('builds the plain method in five pieces on taps of its own: every step changes one, none changes the main path, and the last is within the bound of the Vintage voice', async () => {
    const shifter = await lab('pitch-shifting')
    expectBuild(shifter, await tone())
    expectBuild(shifter, await benchSource('guitar', seconds(4)), { pitchA: 7, size: 35 })
    expectBuild(shifter, await benchSource('drums', seconds(4)), { pitchA: -12 })
  })

  it('reads the recording at twice the speed as a tape would: the same samples, two at a time, and through the whole loop after 2.00 s (claim tape-half)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await benchSource('guitar', seconds(4))
    const result = await played(shifter, 'tape', { build: 0 })
    const tape = tap(result, 'tape')
    // Past the 20 ms at the loop's start, where the lab crosses two passes over.
    for (let i = 960; i < seconds(2); i += 1) {
      if (tape[i] !== source.left[2 * i]) throw new Error(`the tape is not the loop at ${i}`)
      if (tape[i] !== tape[i + seconds(2)]) throw new Error(`the tape does not come round at ${i}`)
    }
    // The first step of the build is the same tape, and says how far ahead of the present it reads.
    expect(tap(result, 'built').every((v, i) => v === tape[i])).toBe(true)
    const ahead = tap(result, 'builtAhead')
    let reached = points(0.1)
    while (reached < ahead.length && reached / POINT_RATE + ahead[reached]! < 4) reached += 1
    expectWritten(reached / POINT_RATE, '2.00 s')
    // A fifth up it takes two thirds of the loop.
    const fifth = tap(shifter.render(source, { build: 0, pitchA: 7 }), 'builtAhead')
    let later7 = points(0.1)
    while (later7 < fifth.length && later7 / POINT_RATE + fifth[later7]! < 4) later7 += 1
    expect(later7 / POINT_RATE).toBeCloseTo(4 / 2 ** (7 / 12), 2)
  })

  it('puts a 440 Hz sine at +12 semitones out with its peak in the bin that holds 880 Hz of the 4096-point spectrum, in Vintage and in Smooth (claim octave-bin)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    for (const mode of [VINTAGE, SMOOTH]) {
      shifter.render(source, { mode })
      const spectrum = shifter.spectrum('out')
      let best = 0
      for (let k = 0; k < spectrum.length; k += 1) if (spectrum[k]! > spectrum[best]!) best = k
      expect(best).toBe(Math.round(880 / BIN))
    }
  })

  it('at 0 semitones in Vintage plays what it recorded 1,512 samples earlier, with less than −130 dB between them (claim unison-voice)', async () => {
    const shifter = await lab('pitch-shifting')
    for (const id of ['sine', 'guitar', 'drums']) {
      const source = await benchSource(id, seconds(4))
      const result = shifter.render(source, { pitchA: 0 })
      const found = lateness(tap(result, 'voice'), tap(result, 'ring'), 1505, 1520)
      expectWritten(found.by, '1,512 samples')
      expectWritten(found.db, 'under −130 dB')
      // One sample to either side is no match at all.
      expect(differenceDb(tap(result, 'voice'), later(tap(result, 'ring'), 1511))).toBeGreaterThan(
        -40,
      )
      // The head that sounds stands still, 31.5 ms behind, at a gain of 1; the other is silent.
      expect(tap(result, 'delayB').every((v) => v === 31.5)).toBe(true)
      expect(tap(result, 'gainB').every((v) => v === 1)).toBe(true)
      expect(tap(result, 'gainA').every((v) => v === 0)).toBe(true)
    }
  })

  it('at 0 semitones puts the guitar out nearest its input 1,513 samples later, with −30 dB between them: the 1,512 samples of the voice, and the part of a sample each of the two filters on the way holds it back (claim unison-out)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await benchSource('guitar', seconds(4))
    const result = shifter.render(source, { pitchA: 0 })
    const out = tap(result, 'out')
    const found = lateness(out, source.left, 1508, 1518)
    expectWritten(found.by, '1,513 samples')
    expectWritten(found.db, '−30 dB')
    // The sample over 1,512 is the two filters'. Each puts its sound out nearest what went into
    // it with no whole sample between them, and nearer that a sample later than a sample earlier.
    for (const [after, before] of [
      [tap(result, 'ring'), source.left],
      [out, tap(result, 'voice')],
    ] as const) {
      expect(lateness(after, before, 0, 3).by).toBe(0)
      expect(differenceDb(after, later(before, 1))).toBeLessThan(
        differenceDb(after, later(before, -1)),
      )
    }
  })

  it("reads the heads again from the device's own numbers and lands under −120 dB from its voice, in Smooth, Grain and Vintage (claim heads-rebuilt)", async () => {
    const shifter = await lab('pitch-shifting')
    for (const id of ['sine', 'guitar', 'drums', 'noise']) {
      const source = await benchSource(id, seconds(4))
      for (const mode of [SMOOTH, GRAIN, VINTAGE]) {
        for (const more of [
          { pitchA: 12 },
          { pitchA: -12 },
          { pitchA: 7 },
          { pitchA: 7, jitter: 0.5, delay: 20 },
        ]) {
          const result = shifter.render(source, { mode, ...more })
          expectWritten(result.checks.heads!, 'under −120 dB')
          // And the two taps of the heads alone add up to the voice.
          const a = tap(result, 'headA')
          const b = tap(result, 'headB')
          const sum = a.map((v, i) => v + b[i]!)
          expectWritten(differenceDb(sum, tap(result, 'voice')), 'under −120 dB')
        }
      }
    }
    // Chords has no heads, and the check says so.
    expect(shifter.render(await tone(), { mode: CHORDS }).checks.heads).toBe(0)
  })

  it("runs the kit's own shifter on what a Pitch Shifter kept in Vintage recorded and, at a Size of 60 ms, lands under −100 dB from its voice on the sine, the guitar and the drums (claim kit-same), under −75 dB on the noise and the clicks (claim kit-noise)", async () => {
    const shifter = await lab('pitch-shifting')
    for (const id of ['sine', 'guitar', 'drums']) {
      const source = await benchSource(id, seconds(4))
      for (const pitchA of [12, -12, 7]) {
        expectWritten(shifter.render(source, { pitchA }).checks.kit!, 'under −100 dB')
      }
    }
    for (const id of ['noise', 'clicks']) {
      const source = await benchSource(id, seconds(4))
      for (const pitchA of [12, -12, 7]) {
        expectWritten(shifter.render(source, { pitchA }).checks.kit!, 'under −75 dB')
      }
    }
    // The check is held to the second device, so the page's Mode does not move it.
    const source = await tone()
    expect(shifter.render(source, { mode: SMOOTH }).checks.kit).toBe(
      shifter.render(source, {}).checks.kit,
    )
    // The two land further apart as Size grows: those bounds are for 60 ms and no further.
    for (const id of ['guitar', 'noise']) {
      const other = await benchSource(id, seconds(4))
      const at = (size: number) => shifter.render(other, { size }).checks.kit!
      expect(at(400)).toBeGreaterThan(at(60) + 10)
      expect(at(10)).toBeLessThan(at(60) - 10)
    }
  })

  it('moves a head 1.000 ms nearer for every millisecond at +12 (claim slope-up) and 0.500 ms further behind at −12 (claim slope-down)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    // The steepest step between neighbouring points is the jump back; the commonest is the slope.
    const slope = (pitchA: number) => {
      const delays = tap(shifter.render(source, { pitchA }), 'delayA')
      const steps: number[] = []
      for (let i = POINT_RATE; i < 3 * POINT_RATE; i += 1) steps.push(delays[i + 1]! - delays[i]!)
      steps.sort((a, b) => a - b)
      return (steps[Math.floor(steps.length / 2)]! * POINT_RATE) / 1000
    }
    expectWritten(-slope(12), '1.000 ms')
    expectWritten(slope(-12), '0.500 ms')
    expect(-slope(24)).toBeCloseTo(3, 3)
    expect(-slope(7)).toBeCloseTo(2 ** (7 / 12) - 1, 3)
  })

  it('at +12 and a Size of 60 ms keeps both heads between 1.5 ms and 61.5 ms behind (claim delay-span), 30.00 ms apart (claim half-apart)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    const result = shifter.render(source, {})
    const a = tap(result, 'delayA')
    const b = tap(result, 'delayB')
    for (const delays of [a, b]) {
      const { lo, hi } = range(delays, POINT_RATE)
      expectWritten(lo, '1.5 ms')
      expectWritten(hi, '61.5 ms')
      // The floor is the floor: no head comes nearer.
      expect(lo).toBeGreaterThanOrEqual(1.5)
    }
    for (let i = POINT_RATE; i < 3 * POINT_RATE; i += 1) {
      expectWritten(Math.abs(a[i]! - b[i]!), '30.00 ms')
    }
    // Half a Size apart at other intervals too.
    for (const pitchA of [-12, 7]) {
      const other = shifter.render(source, { pitchA })
      const [c, d] = [tap(other, 'delayA'), tap(other, 'delayB')]
      for (let i = POINT_RATE; i < 3 * POINT_RATE; i += 1) {
        expect(Math.abs(Math.abs(c[i]! - d[i]!) - 30)).toBeLessThan(0.005)
      }
    }
  })

  it('takes 60 ms over one ramp at +12 (claim sweep-octave), 120 ms at −12 (claim sweep-down) and 1.01 s at +1 (claim sweep-semitone)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    const sweep = (pitchA: number) => sweepMs(tap(shifter.render(source, { pitchA }), 'delayA'))
    expectWritten(sweep(12), '60 ms')
    expectWritten(sweep(-12), '120 ms')
    expectWritten(sweep(1) / 1000, '1.01 s')
  })

  it('gives the two heads gains that add to 1 at every instant (claim gains-sum)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    for (const pitchA of [12, -5]) {
      const result = shifter.render(source, { pitchA })
      const a = tap(result, 'gainA')
      const b = tap(result, 'gainB')
      expect(a.every((v, i) => Math.abs(v + b[i]! - 1) < 1e-6)).toBe(true)
      expect(range(a).hi).toBeGreaterThan(0.999)
      expect(range(a).lo).toBeLessThan(0.001)
    }
  })

  it('dips the sine 1.84 dB where the heads cross at +12 and 60 ms (claim ripple-depth), 33.3 times a second (claim ripple-rate)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    const result = shifter.render(source, {})
    const voice = tap(result, 'voice')
    // What the two heads' sum should fall to: cos(π f W / 2), with f = 440 Hz and W = 60 ms.
    expect(-gainToDb(Math.abs(Math.cos(Math.PI * 440 * 0.03)))).toBeCloseTo(1.841, 3)
    expectWritten(dip(voice), '1.84 dB')
    expectWritten(dipsOf(voice), '33.3 times a second')
    // The same is heard: nothing after the voice evens it out.
    expectWritten(dip(tap(result, 'out')), '1.84 dB')
    // The lab's own meter, which the page draws, agrees to within its ripple.
    const level = range(tap(result, 'level'), 1500, 10_500)
    expect(level.span).toBeGreaterThan(1.7)
    expect(level.span).toBeLessThan(2.1)
    // Down an octave the heads move half as fast and cross half as often.
    expect(dipsOf(tap(shifter.render(source, { pitchA: -12 }), 'voice'))).toBeCloseTo(16.67, 1)
  })

  it('puts the sine out as lines counted from 440 Hz: the tallest at 873.3 Hz, 13 cents under the octave and 0.9 dB under the input (claim grid-line), the next 17.4 dB under it (claim side-band), and at 880 Hz itself a line more than 90 dB under the tallest (claim no-octave)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    const voice = tap(shifter.render(source, {}), 'voice')
    const input = lineDb(source.left, 440)
    const spacing = 2 / 0.06
    const at = peakHz(voice, 440 + 13 * spacing)
    const tallest = lineDb(voice, at)
    expectWritten(at, '873.3 Hz')
    expectWritten(1200 * Math.log2(880 / at), '13 cents')
    expectWritten(input - tallest, '0.9 dB')
    expectWritten(tallest - lineDb(voice, peakHz(voice, 440 + 14 * spacing)), '17.4 dB')
    // No line of the grid is taller, and between the lines there is nothing.
    for (let k = 5; k <= 25; k += 1) {
      expect(lineDb(voice, 440 + k * spacing)).toBeLessThanOrEqual(tallest)
    }
    expectWritten(tallest - lineDb(voice, 880), 'more than 90 dB')
  })

  it('has less than 0.05 dB of ripple at a Size of 59.09 ms, where the heads are 13 whole cycles apart (claim window-best), and dips more than 40 dB at each crossing at 61.36 ms, 13½ apart (claim window-worst)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    const best = tap(shifter.render(source, { size: 26_000 / 440 }), 'voice')
    expectWritten(dip(best), 'less than 0.05 dB')
    expect(Math.abs(lineDb(best, 880) - lineDb(source.left, 440))).toBeLessThan(0.05)
    const worst = tap(shifter.render(source, { size: 27_000 / 440 }), 'voice')
    expectWritten(dip(worst), 'more than 40 dB')
    // Two lines of the same height either side of 880 Hz, each half the input: a beat.
    const spacing = 2 / (27 / 440)
    const below = lineDb(worst, 880 - spacing / 2) - lineDb(source.left, 440)
    const above = lineDb(worst, 880 + spacing / 2) - lineDb(source.left, 440)
    expect(below).toBeCloseTo(-6.0, 0)
    expect(above).toBeCloseTo(-6.0, 0)
    expect(Math.abs(below - above)).toBeLessThan(0.5)
    // The saw's fifth harmonic, 550 Hz, is 16½ cycles apart at 60 ms: it cancels as well.
    const fifth = tap(shifter.render(sine(550, 0.25, seconds(4)), {}), 'voice')
    expect(dip(fifth)).toBeGreaterThan(40)
  })

  it('on the flutter card, the sine at a Size of 61.36 ms, falls more than 40 dB at each crossing, 32.6 times a second (claim fault-flutter)', async () => {
    const shifter = await lab('pitch-shifting')
    const voice = tap(await played(shifter, 'flutter'), 'voice')
    expectWritten(dip(voice), 'more than 40 dB')
    expectWritten(dipsOf(voice), '32.6 times a second')
  })

  it('in Smooth puts the sine out as one line at 880.0 Hz at the level it went in (claim smooth-line), every other line tried more than 80 dB under it (claim smooth-clean), with less than 0.05 dB of dip at a Size of 60 ms and at four others from 10 ms to 200 ms (claim smooth-ripple)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    const result = shifter.render(source, { mode: SMOOTH })
    const voice = tap(result, 'voice')
    const input = lineDb(source.left, 440)
    const line = lineDb(voice, 880)
    expectWritten(peakHz(voice, 880), '880.0 Hz')
    expect(Math.abs(line - input)).toBeLessThan(0.05)
    for (const away of [
      -100, -66.67, -33.33, -16.67, -6.67, 6.67, 16.67, 26.67, 33.33, 66.67, 100,
    ]) {
      expectWritten(line - lineDb(voice, 880 + away), 'more than 80 dB')
    }
    expectWritten(dip(voice), 'less than 0.05 dB')
    // The two Sizes at which Vintage is at its best and its worst among them.
    for (const size of [10, 26_000 / 440, 27_000 / 440, 200]) {
      const other = tap(shifter.render(source, { mode: SMOOTH, size }), 'voice')
      expectWritten(peakHz(other, 880), '880.0 Hz')
      expectWritten(dip(other), 'less than 0.05 dB')
    }
  })

  it('makes +7 semitones a ratio of 1.4983 on the sine in Smooth (claim fifth), and in Vintage puts the tallest line at 655.9 Hz, 9 cents under that (claim fifth-grid)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    const input = lineDb(source.left, 440)
    const smooth = tap(shifter.render(source, { pitchA: 7, mode: SMOOTH }), 'voice')
    const fifth = peakHz(smooth, 440 * 2 ** (7 / 12))
    expectWritten(fifth / 440, '1.4983')
    expect(Math.abs(lineDb(smooth, fifth) - input)).toBeLessThan(0.05)
    const vintage = tap(shifter.render(source, { pitchA: 7 }), 'voice')
    const line = peakHz(vintage, 440 + 13 * ((2 * (2 ** (7 / 12) - 1)) / 0.06))
    expectWritten(line, '655.9 Hz')
    expectWritten(1200 * Math.log2(fifth / line), '9 cents')
    expect(lineDb(vintage, line) - input).toBeGreaterThan(-1.0)
    expect(lineDb(vintage, fifth) - input).toBeLessThan(-60)
  })

  it('keeps the harmonics of the saw whole multiples of one note at +7 in Smooth, at a Size of 60 ms: each of the first three comes out multiplied by 1.4987, so the second and the third at 2.000 and 3.000 times the first, and where adding the same number of hertz to each would put them stands a line more than 90 dB under (claim harmonics)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await benchSource('saw', seconds(4))
    const voice = tap(shifter.render(source, { pitchA: 7, mode: SMOOTH }), 'voice')
    const went = [1, 2, 3].map((k) => peakHz(source.left, 110 * k))
    const first = peakHz(voice, went[0]! * 2 ** (7 / 12))
    const came = [first, peakHz(voice, 2 * first), peakHz(voice, 3 * first)]
    expectWritten(came[1]! / came[0]!, '2.000')
    expectWritten(came[2]! / came[0]!, '3.000')
    // Each was multiplied by one number. It is not quite the 1.4983 the sine is multiplied by:
    // the saw comes out half a cent sharp of the interval asked for.
    for (const k of [0, 1, 2]) expectWritten(came[k]! / went[k]!, '1.4987')
    expect(1200 * Math.log2(came[0]! / went[0]! / 2 ** (7 / 12))).toBeCloseTo(0.5, 1)
    // A shift by a fixed number of hertz would move each by what the first moved.
    const moved = came[0]! - went[0]!
    for (const k of [1, 2]) {
      expectWritten(lineDb(voice, came[k]!) - lineDb(voice, went[k]! + moved), 'more than 90 dB')
    }
  })

  it('records a tone 3.0 dB down at 10.8 kHz when the shift is +12 (claim band-limit), at 21.6 kHz when it is 0 or below (claim band-open), at 5.4 kHz when it is +24 (claim band-two-octaves)', async () => {
    const shifter = await lab('pitch-shifting')
    const loss = (hz: number, pitchA: number) => {
      const source = sine(hz, 0.25, seconds(1))
      const ring = tap(shifter.render(source, { pitchA }), 'ring')
      return gainToDb(rms(ring, 24_000) / rms(source.left, 24_000))
    }
    expectWritten(cornerHz(shifter, 12, 10_800) / 1000, '10.8 kHz')
    expectWritten(-loss(10_800, 12), '3.0 dB')
    expect(loss(5400, 12)).toBeGreaterThan(-0.1)
    expectWritten(cornerHz(shifter, 0, 21_600) / 1000, '21.6 kHz')
    expectWritten(cornerHz(shifter, -12, 21_600) / 1000, '21.6 kHz')
    expect(loss(10_800, 0)).toBeGreaterThan(-0.1)
    expectWritten(cornerHz(shifter, 24, 5400) / 1000, '5.4 kHz')
    // Chords alone needs no limit: at +12 the corner stays at the top.
    const inChords = (hz: number) => {
      const source = sine(hz, 0.25, seconds(1))
      const ring = tap(shifter.render(source, { mode: CHORDS }), 'ring')
      return gainToDb(rms(ring, 24_000) / rms(source.left, 24_000))
    }
    expect(inChords(10_800)).toBeGreaterThan(-0.1)
    expectWritten(-inChords(21_600), '3.0 dB')
  })

  it('on the buzz card, a Size of 10 ms at +12, jumps each head every 10 ms, and on the sine in place of the guitar dips 200 times a second (claim buzz-rate)', async () => {
    const shifter = await lab('pitch-shifting')
    expect(sweepMs(tap(await played(shifter, 'buzz'), 'delayA'))).toBeCloseTo(10, 1)
    const result = await played(shifter, 'buzz', {}, 'sine')
    const level = tap(result, 'level').subarray(1500, 10_500)
    const heights = Array.from(level, (db) => 10 ** (db / 20))
    const times = heights.map((_, k) => k / POINT_RATE)
    expectWritten(dipRate(heights, times), '200 times a second')
    // And the comb's teeth are 200 Hz apart: 440 + 2 × 200 is the tallest.
    const voice = tap(result, 'voice')
    expect(lineDb(voice, 840)).toBeGreaterThan(lineDb(voice, 880) + 60)
    expect(lineDb(voice, 840)).toBeGreaterThan(lineDb(voice, 1040))
    expect(lineDb(voice, 840)).toBeGreaterThan(lineDb(voice, 640))
  })

  it('plays one click 4 times, 15.0 ms apart, at +12 and 60 ms in Vintage (claim click-copies), 100 ms apart at 400 ms (claim click-long), and 4 times in Smooth too (claim click-smooth)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await benchSource('clicks', seconds(4))
    const at = (values: Record<string, number>) =>
      copies(tap(shifter.render(source, values), 'voice'))
    const plain = at({})
    expectWritten(plain.length, '4')
    for (let k = 1; k < 4; k += 1) expectWritten(plain[k]!.ms - plain[k - 1]!.ms, '15.0 ms')
    const long = at({ size: 400 })
    expect(long.length).toBeGreaterThanOrEqual(3)
    for (let k = 1; k < long.length; k += 1) expectWritten(long[k]!.ms - long[k - 1]!.ms, '100 ms')
    expectWritten(at({ mode: SMOOTH }).length, '4')
    // A fifth up, 2 × 1.5 = 3 copies.
    expect(at({ pitchA: 7 }).length).toBe(3)
  })

  it('at −12 in Vintage plays a click once at most, and 2 of the 4 in the loop at less than a hundredth of their height: they fell where a head was jumping (claim click-down)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await benchSource('clicks', seconds(4))
    const voice = tap(shifter.render(source, { pitchA: -12 }), 'voice')
    expect(copies(voice).length).toBe(1)
    // The tallest sample of the voice in the second after each click, which went in at a height of 1.
    const tallest = [0, 1, 2, 3].map((k) => peak(voice.subarray(seconds(k), seconds(k + 1))))
    expect(peak(source.left)).toBe(1)
    expectWritten(tallest.filter((top) => matchesWritten(top, 'under 0.01')).length, '2')
    expect(tallest.filter((top) => top > 0.4).length).toBe(2)
    // It is the octave that reads each moment once at most. A fifth down some are read twice.
    expect(copies(tap(shifter.render(source, { pitchA: -7 }), 'voice')).length).toBe(2)
  })

  it('on the card for a voice an octave under, with the clicks in place of the guitar, plays no click more than once (claim below-once)', async () => {
    const shifter = await lab('pitch-shifting')
    const voice = tap(await played(shifter, 'below', {}, 'clicks'), 'voice')
    let heard = 0
    for (let k = 0; k < 4; k += 1) {
      // The second after a click: its tallest sample, and the tallest more than 2 ms from that.
      const second = voice.subarray(seconds(k) + 48, seconds(k + 1) - 48)
      let at = 0
      for (let i = 0; i < second.length; i += 1)
        if (Math.abs(second[i]!) > Math.abs(second[at]!)) at = i
      const top = Math.abs(second[at]!)
      let next = 0
      for (let i = 0; i < second.length; i += 1) {
        if (Math.abs(i - at) > 96) next = Math.max(next, Math.abs(second[i]!))
      }
      expect(next).toBeLessThan(0.01)
      if (top > 0.1) heard += 1
    }
    // Three of the four come through, each once, and one hardly at all: part 7's fault.
    expect(heard).toBe(3)
  })

  it('in Smooth at +12 and a Size of 60 ms finds a match of more than 0.999 on the sine, 0.5 on average on the noise, and on the strummed chords 0.9 on average with a least under 0.3 (claim match-found)', async () => {
    const shifter = await lab('pitch-shifting')
    const found = async (id: string) =>
      tap(shifter.render(await benchSource(id, seconds(4)), { mode: SMOOTH }), 'match')
    expectWritten(range(await found('sine')).lo, 'more than 0.999')
    expectWritten(mean(await found('noise')), '0.5')
    const chords = await found('chords')
    expectWritten(mean(chords), '0.9')
    expectWritten(range(chords).lo, 'under 0.3')
    // A single line does better than a chord, and still falls at each new note.
    const guitar = await found('guitar')
    expect(mean(guitar)).toBeGreaterThan(mean(chords))
    expect(range(guitar).lo).toBeLessThan(0.5)
    // The sine is matched as well at other Sizes and intervals.
    for (const more of [{ size: 10 }, { size: 200 }, { pitchA: 7 }, { pitchA: -12 }]) {
      const match = tap(shifter.render(await tone(), { mode: SMOOTH, ...more }), 'match')
      expectWritten(range(match).lo, 'more than 0.999')
    }
  })

  it('loses 1.3 dB of the noise to the crossfade in Vintage (claim crossfade-loss), and over the whole loop loses 1.2 dB of the strummed chords in Vintage and 0.2 dB in Smooth, where the noise still loses 0.8 dB (claim lift)', async () => {
    const shifter = await lab('pitch-shifting')
    const noise = await benchSource('noise', seconds(4))
    expectWritten(-kept(shifter.render(noise, {})), '1.3 dB')
    const chords = await benchSource('chords', seconds(4))
    expectWritten(-kept(shifter.render(chords, {})), '1.2 dB')
    expectWritten(-kept(shifter.render(chords, { mode: SMOOTH })), '0.2 dB')
    expectWritten(-kept(shifter.render(noise, { mode: SMOOTH })), '0.8 dB')
  })

  it('is the input, sample for sample, with Mix at 0 (claim mix-zero), and has the dry and the shifted sine each 3.0 dB down at 0.5 (claim mix-half)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    const dry = tap(shifter.render(source, { mix: 0 }), 'out')
    expect(dry.every((v, i) => v === source.left[i])).toBe(true)
    // And on the guitar, with two voices, a Delay and Feedback running under it.
    const guitar = await benchSource('guitar', seconds(4))
    const busy = { mix: 0, mode: SMOOTH, pitchA: 7, levelB: 1, delay: 200, feedback: 0.5 }
    expect(tap(shifter.render(guitar, busy), 'out').every((v, i) => v === guitar.left[i])).toBe(
      true,
    )
    const half = tap(shifter.render(source, { mix: 0.5, mode: SMOOTH }), 'out')
    const input = lineDb(source.left, 440)
    expectWritten(input - lineDb(half, 440), '3.0 dB')
    expectWritten(input - lineDb(half, 880), '3.0 dB')
  })

  it('on the triad card makes a chord of one sine: three lines, at 440 Hz and 4 and 7 semitones over it, each 3.0 dB under the sine that went in (claim triad)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    const out = tap(await played(shifter, 'triad'), 'out')
    const input = lineDb(source.left, 440)
    for (const semitones of [0, 4, 7]) {
      const at = semitones === 0 ? 440 : peakHz(out, 440 * 2 ** (semitones / 12))
      expect(at / 440).toBeCloseTo(2 ** (semitones / 12), 4)
      expectWritten(input - lineDb(out, at), '3.0 dB')
    }
  })

  it('with Spread at 1 and Voice B at 1 puts voice A in the left channel alone and voice B in the right alone, each more than 100 dB under in the other; a voice alone stays in the middle (claim placed)', async () => {
    const shifter = await lab('pitch-shifting')
    const wide = await played(shifter, 'triad', { spread: 1 })
    const [left, right] = [tap(wide, 'out', 0), tap(wide, 'out', 1)]
    const [a, b] = [440 * 2 ** (4 / 12), 440 * 2 ** (7 / 12)]
    expectWritten(lineDb(left, a) - lineDb(right, a), 'more than 100 dB')
    expectWritten(lineDb(right, b) - lineDb(left, b), 'more than 100 dB')
    expect(tap(wide, 'panA').every((v) => v === -1)).toBe(true)
    expect(tap(wide, 'panB').every((v) => v === 1)).toBe(true)
    // Half way, each voice is in both channels, louder on its own side.
    const half = await played(shifter, 'triad', { spread: 0.5 })
    expect(lineDb(tap(half, 'out', 0), a) - lineDb(tap(half, 'out', 1), a)).toBeGreaterThan(6)
    // With Voice B at 0 voice A is not moved, wherever Spread stands.
    const one = shifter.render(await tone(), { spread: 1, mode: SMOOTH })
    expect(tap(one, 'out', 0).every((v, i) => v === tap(one, 'out', 1)[i])).toBe(true)
    expect(tap(one, 'panA').every((v) => v === 0)).toBe(true)
  })

  it('with Delay at 300 ms and Feedback at 0.5 in Smooth, at +12, sends the sine round again an octave higher each time: lines at 1,760 Hz, 3,520 Hz and 7,040 Hz stand 6 dB, 12 dB and 18 dB under the line at 880 Hz (claim feedback-climb)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    const voice = tap(shifter.render(source, { mode: SMOOTH, delay: 300, feedback: 0.5 }), 'out')
    const first = lineDb(voice, 880)
    expect(Math.abs(first - lineDb(source.left, 440))).toBeLessThan(0.05)
    expectWritten(first - lineDb(voice, 1760), '6 dB')
    expectWritten(first - lineDb(voice, 3520), '12 dB')
    expectWritten(first - lineDb(voice, 7040), '18 dB')
    // With Feedback at 0 none of them is there.
    const once = tap(shifter.render(source, { mode: SMOOTH, delay: 300 }), 'out')
    expect(lineDb(once, 880) - lineDb(once, 1760)).toBeGreaterThan(60)
  })

  it('holds the voices under twice full scale on their way out: on the sine, in Grain with Jitter at 0, Size at 45 ms, Voice B at 1, both voices at +12 and Feedback at 0.95, the output peaks at more than 1.9 times full scale, and no sample of it passes 2 (claim wet-limit)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    const most = (result: RenderResult) =>
      Math.max(peak(tap(result, 'out')), peak(tap(result, 'out', 1)))
    const piled = { mode: GRAIN, jitter: 0, size: 45, pitchA: 12, pitchB: 12, levelB: 1 }
    const loud = most(shifter.render(source, { ...piled, feedback: 0.95 }))
    expectWritten(loud, 'more than 1.9')
    expect(loud).toBeLessThanOrEqual(2)
    // It is the loop that piles the sound up so far: the same two voices with no Feedback are
    // under full scale, where the limit is a straight line and does nothing.
    const plain = most(shifter.render(source, piled))
    expect(plain).toBeLessThan(1)
    expect(matchesWritten(plain, 'more than 1.9')).toBe(false)
  })

  it('in Chords brings a tone that starts from silence to half its height 193 ms after it began, where Smooth at +12 and a Size of 60 ms takes 25 ms (claim chords-late)', async () => {
    const shifter = await lab('pitch-shifting')
    const halfMs = (hz: number, mode: number, more: Record<string, number> = {}) => {
      const voice = tap(shifter.render(burst(hz), { mode, ...more }), 'voice')
      const full = peak(voice.subarray(seconds(1.6), seconds(1.9)))
      let half = seconds(1)
      while (half < voice.length && Math.abs(voice[half]!) < 0.5 * full) half += 1
      return ((half - seconds(1)) * 1000) / RATE
    }
    // One tone above the frequency where Chords divides its work, and one below.
    for (const hz of [2000, 440]) {
      expectWritten(halfMs(hz, CHORDS), '193 ms')
      expectWritten(halfMs(hz, SMOOTH), '25 ms')
      // Chords is as late at other intervals. Smooth is as late as its heads stand back, which
      // goes with Size.
      expectWritten(halfMs(hz, CHORDS, { pitchA: 7 }), '193 ms')
      expectWritten(halfMs(hz, CHORDS, { pitchA: -12 }), '193 ms')
      expect(halfMs(hz, SMOOTH, { size: 20 })).toBeLessThan(10)
      expect(halfMs(hz, SMOOTH, { size: 200 })).toBeGreaterThan(90)
    }
  })

  it('moves two notes at once to their places only in Chords: of two sines, at 440 Hz and a major third over it, at +12, Smooth puts the upper one out 0.2 Hz flat at a Size of 60 ms and 0.5 Hz sharp at 90 ms, and Chords puts both out less than 0.01 Hz from their place and less than 0.1 dB from their level (claim two-notes)', async () => {
    const shifter = await lab('pitch-shifting')
    const two = pair(440, 440 * 2 ** (4 / 12), 0.2, seconds(4))
    const went = lineDb(two.left, 440)
    const [a, b] = [880, 880 * 2 ** (4 / 12)]
    const smooth = (size: number) => tap(shifter.render(two, { mode: SMOOTH, size }), 'voice')
    expectWritten(b - peakHz(smooth(60), b), '0.2 Hz')
    expectWritten(peakHz(smooth(90), b) - b, '0.5 Hz')
    // The line is there, at very nearly its level: it is its place that is off.
    const flat = peakHz(smooth(60), b)
    expect(Math.abs(went - lineDb(smooth(60), flat))).toBeLessThan(0.5)
    for (const size of [60, 90]) {
      const chords = tap(shifter.render(two, { mode: CHORDS, size }), 'voice')
      for (const hz of [a, b]) {
        expectWritten(Math.abs(peakHz(chords, hz) - hz), 'less than 0.01 Hz')
        expectWritten(Math.abs(went - lineDb(chords, hz)), 'less than 0.1 dB')
      }
    }
  })

  it('in Chords at +12 keeps 3.9 dB less of the noise than was recorded and 2.3 dB less of the drums, over the whole loop, and the strummed chords and the pad within 0.2 dB (claim chords-noise)', async () => {
    const shifter = await lab('pitch-shifting')
    const loss = async (id: string, pitchA = 12) =>
      -kept(shifter.render(await benchSource(id, seconds(4)), { mode: CHORDS, pitchA }))
    expectWritten(await loss('noise'), '3.9 dB')
    expectWritten(await loss('drums'), '2.3 dB')
    expectWritten(Math.abs(await loss('chords')), 'less than 0.2 dB')
    expectWritten(Math.abs(await loss('pad')), 'less than 0.2 dB')
    // It is the loss at +12: a smaller interval loses less of the noise, and none loses nothing.
    expect(await loss('noise', 7)).toBeLessThan((await loss('noise')) - 1)
    expect(Math.abs(await loss('noise', 0))).toBeLessThan(0.05)
  })

  it('in Grain at +12 with Jitter at 0 is a comb: the sine comes out 14 dB quieter than it was recorded at a Size of 60 ms and 4.0 dB louder at 45 ms, and with Jitter at 0.2 less than 0.5 dB from its level at both (claim grain-comb)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    const at = (size: number, jitter: number, pitchA = 12) =>
      keptOfTone(shifter.render(source, { mode: GRAIN, size, jitter, pitchA }))
    expectWritten(-at(60, 0), '14 dB')
    expectWritten(at(45, 0), '4.0 dB')
    expectWritten(Math.abs(at(60, 0.2)), 'less than 0.5 dB')
    expectWritten(Math.abs(at(45, 0.2)), 'less than 0.5 dB')
    // The comb is there at other Sizes and intervals, with its teeth elsewhere.
    expect(at(50, 0)).toBeLessThan(-40)
    expect(at(45, 0, 7)).toBeLessThan(-20)
    expect(at(55, 0, 7)).toBeGreaterThan(3)
  })

  it('on the card for a voice an octave under, with the sine in place of the guitar, puts out the sine and its octave below, each 3.0 dB under the sine that went in (claim use-below)', async () => {
    const shifter = await lab('pitch-shifting')
    const out = tap(await played(shifter, 'below', {}, 'sine'), 'out')
    const input = lineDb((await tone()).left, 440)
    expectWritten(input - lineDb(out, 440), '3.0 dB')
    expectWritten(input - lineDb(out, peakHz(out, 220)), '3.0 dB')
  })

  it('on the harmony card, with the sine in place of the guitar, puts the note a fifth over 2.8 dB under the note played (claim use-harmony)', async () => {
    const shifter = await lab('pitch-shifting')
    const out = tap(await played(shifter, 'harmony', {}, 'sine'), 'out')
    const fifth = peakHz(out, 440 * 2 ** (7 / 12))
    expect(fifth / 440).toBeCloseTo(2 ** (7 / 12), 4)
    expectWritten(lineDb(out, 440) - lineDb(out, fifth), '2.8 dB')
  })

  it('on the doubler card, with the sine in place of the chords, puts voice A out 2.3 Hz above the tone, in the left channel, and voice B 2.3 Hz below it, in the right (claim use-doubler)', async () => {
    const shifter = await lab('pitch-shifting')
    const result = await played(shifter, 'doubler', {}, 'sine')
    expectWritten(peakHz(tap(result, 'out', 0), 442.3) - 440, '2.3 Hz')
    expectWritten(440 - peakHz(tap(result, 'out', 1), 437.7), '2.3 Hz')
    // Each voice is on its own side: the other side has the dry tone and the other voice.
    const [left, right] = [tap(result, 'out', 0), tap(result, 'out', 1)]
    expect(lineDb(left, 442.3) - lineDb(right, 442.3)).toBeGreaterThan(20)
    expect(lineDb(right, 437.7) - lineDb(left, 437.7)).toBeGreaterThan(20)
  })

  it('on the card for octaves on held chords, with the sine in place of the pad, puts the octave below 1.9 dB under the octave above (claim use-octaves)', async () => {
    const shifter = await lab('pitch-shifting')
    const result = await played(shifter, 'octaves', {}, 'sine')
    // Both channels together: Spread sets the two voices apart.
    const [left, right] = [tap(result, 'out', 0), tap(result, 'out', 1)]
    const both = (hz: number) =>
      10 * Math.log10(10 ** (lineDb(left, hz) / 10) + 10 ** (lineDb(right, hz) / 10))
    expectWritten(both(880) - both(220), '1.9 dB')
  })

  it('at the second step keeps the head between 1.5 ms and 61.5 ms behind, where the tape of the first has no such distance (claim build-saw)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    const behind = (build: number) =>
      range(tap(shifter.render(source, { build }), 'builtDelay'), POINT_RATE)
    expectWritten(behind(1).lo, '1.5 ms')
    expectWritten(behind(1).hi, '61.5 ms')
    expect(matchesWritten(behind(0).lo, '1.5 ms')).toBe(false)
    expect(matchesWritten(behind(0).hi, '61.5 ms')).toBe(false)
  })

  it('at the second step jumps 16.7 times a second on the sine, and its largest step between two samples is 0.47 of full scale, which the tape of the first step does not have (claim build-click)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    const at = (build: number) => shifter.render(source, { build })
    expectWritten(1000 / sweepMs(tap(at(1), 'builtDelay')), '16.7 times a second')
    expectWritten(steepest(tap(at(1), 'built')), '0.47')
    expect(matchesWritten(steepest(tap(at(0), 'built')), '0.47')).toBe(false)
    expect(Number.isNaN(sweepMs(tap(at(0), 'builtDelay')))).toBe(true)
  })

  it('at the third step, with the window, brings the largest step between two samples of the sine from 0.47 down to 0.029 of full scale (claim build-window), and dips its level more than 40 dB at each jump where the step before held it within 1 dB (claim build-gap)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    const built = (build: number) => tap(shifter.render(source, { build }), 'built')
    expectWritten(steepest(built(1)), '0.47')
    expectWritten(steepest(built(2)), '0.029')
    expect(matchesWritten(steepest(built(1)), '0.029')).toBe(false)
    expectWritten(dip(built(2)), 'more than 40 dB')
    expectWritten(dip(built(1)), 'less than 1 dB')
    expect(matchesWritten(dip(built(1)), 'more than 40 dB')).toBe(false)
    // Once for each jump.
    expect(dipsOf(built(2))).toBeCloseTo(16.67, 1)
  })

  it('at the fourth step, with the second head, dips the level of the sine 1.84 dB at each handing over, where one head fell to nothing (claim build-second)', async () => {
    const shifter = await lab('pitch-shifting')
    const source = await tone()
    const built = (build: number) => tap(shifter.render(source, { build }), 'built')
    expectWritten(dip(built(3)), '1.84 dB')
    expect(matchesWritten(dip(built(2)), '1.84 dB')).toBe(false)
    // The two gains add up to 1.
    const result = shifter.render(source, { build: 3 })
    const [a, b] = [tap(result, 'builtGain'), tap(result, 'builtGainB')]
    expect(a.every((v, i) => i < POINT_RATE || Math.abs(v + b[i]! - 1) < 1e-6)).toBe(true)
  })

  it('at the fifth step, with the band limit, puts a tone at 20 kHz read an octave up out at 8.0 kHz 54 dB under the level it went in, where the step before put it out 2.5 dB under (claim build-limit)', async () => {
    const shifter = await lab('pitch-shifting')
    const high = sine(20_000, 0.25, seconds(4))
    const built = (build: number) => tap(shifter.render(high, { build }), 'built')
    const at = peakHz(built(3), 8000.5)
    expectWritten(at / 1000, '8.0 kHz')
    expectWritten(under(built(3), high.left), '2.5 dB')
    // What came out is that one tone: the line alone is within 1 dB of the whole sound.
    const line = lineDb(high.left, 20_000) - lineDb(built(3), at)
    expect(line - under(built(3), high.left)).toBeLessThan(1)
    expectWritten(under(built(4), high.left), '54 dB')
    expect(matchesWritten(under(built(3), high.left), '54 dB')).toBe(false)
  })

  it("with all five pieces lands on the Vintage voice of a Pitch Shifter: the last step is the one compared, the bound is −130 dB, the check reads −140 dB, and no sample is further than 0.000001 from the device's voice (claim build-same)", async () => {
    const shifter = await lab('pitch-shifting')
    for (const id of ['sine', 'guitar', 'drums', 'chords', 'noise', 'clicks', 'saw']) {
      const source = await benchSource(id, seconds(4))
      for (const more of [
        {},
        { pitchA: -12 },
        { pitchA: 7, size: 35 },
        { pitchA: 19, size: 200 },
      ]) {
        const result = shifter.render(source, { build: 4, ...more })
        expect(result.checks.builtStep).toBe(4)
        expect(result.checks.builtBound).toBe(-130)
        expectWritten(result.checks.builtDifference!, '−140 dB')
        // At the lab's starting settings the page's own device is in Vintage with nothing else
        // in the way, so its voice is the one the build is held to.
        expectWritten(apart(tap(result, 'built'), tap(result, 'voice')), 'less than 0.000001')
        expect(differenceDb(tap(result, 'builtRing'), tap(result, 'ring'))).toBe(-140)
      }
    }
    // Whatever step the reader is on, the build with every piece is what is compared.
    const earlier = shifter.render(await tone(), { build: 1 })
    expect(earlier.checks.builtStep).toBe(4)
    expectWritten(earlier.checks.builtDifference!, '−140 dB')
    // And with the page's device in another mode the build is still held to Vintage.
    expectWritten(
      shifter.render(await tone(), { build: 4, mode: SMOOTH }).checks.builtDifference!,
      '−140 dB',
    )
  })

  it('renders every named set on its own source, finite, heard, and with its loudest sample under full scale', async () => {
    const shifter = await lab('pitch-shifting')
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = await played(shifter, name)
      const sound = tap(result, set.tap ?? 'out')
      expect(
        sound.every((v) => Number.isFinite(v)),
        name,
      ).toBe(true)
      expect(gainToDb(rms(sound)), `${name} is heard`).toBeGreaterThan(-40)
      expect(gainToDb(peak(sound)), `${name} fits`).toBeLessThan(0)
    }
  })

  it("starts the page's device table from the device's own defaults: the settings file's defaults, laid over the lab's starting values, are device.json's", async () => {
    const shifter = await lab('pitch-shifting')
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/pitch-shifter/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const { values } = resolveSet(shifter.description, { values: settings.defaults!.values })
    expect(values).toEqual(Object.fromEntries(device.params.map((one) => [one.key, one.default])))
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(settings.defaults!.values)) {
      expect(shifter.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
  })
})
