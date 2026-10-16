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
  POINT_RATE,
  range,
  RATE,
  rms,
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

const NAME = 'phasing'
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
 * The tops (`sign` 1) or the bottoms (−1) of a 361-point response: [hertz, dB] for each, placed
 * by the parabola through the point and its two neighbours. Good for counting them; where a
 * sentence states a frequency, `extremes` below finds it on the response itself.
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

/** The oscillator held still: every stage stays where Centre and Spread put it. */
const still = { depth: 0 }
const levelDb = (x: Float32Array, from = 0, to = x.length) => gainToDb(rms(x, from, to))

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings(NAME)!

/** A named set as its card plays it: on its own source, with `over` laid on its values. */
async function played(phasing: Lab, name: string, over: Record<string, number> = {}) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(phasing.description, set)
  return phasing.render(await benchSource(source!, seconds(4)), { ...values, ...over })
}

const tap = (result: RenderResult, id: string, channel = 0) =>
  result.taps[id]!.channels_data[channel]!

/** The level of a tap of the last render in a band of frequencies, over a stretch of the loop, in dB. */
function bandDb(phasing: Lab, id: string, from: number, count: number, lo: number, hi: number) {
  const spectrum = phasing.spectrum(id, 0, from, count)
  let sum = 0
  for (let k = Math.ceil(lo / BIN); k <= Math.floor(hi / BIN); k += 1)
    sum += 10 ** (spectrum[k]! / 10)
  return 10 * Math.log10(sum + 1e-30)
}

/**
 * How far a band of the last render's output stands from the same band of its input, in dB,
 * slice by slice of 8,192 samples (a sixth of a second) across the four seconds: the least and
 * the most.
 */
function swing(phasing: Lab, lo: number, hi: number) {
  const apart: number[] = []
  for (let from = 0; from + 8192 <= seconds(4); from += 8192) {
    apart.push(
      bandDb(phasing, 'out', from, 8192, lo, hi) - bandDb(phasing, 'in', from, 8192, lo, hi),
    )
  }
  return range(apart)
}

/**
 * The level of any signal in a band of frequencies over a stretch of it, in dB, as the lab's own
 * `spectrum` reads a tap: Hann frames of 4,096 samples, half overlapped. For a signal that is no
 * tap of the lab, such as the sum of an output's two sides.
 */
function bandOf(x: Float32Array, from: number, count: number, lo: number, hi: number): number {
  const size = 4096
  let sum = 0
  let frames = 0
  for (let start = from; start + size <= from + count; start += size / 2) {
    frames += 1
    for (let k = Math.ceil(lo / BIN); k <= Math.floor(hi / BIN); k += 1) {
      const w = (2 * Math.PI * k) / size
      let re = 0
      let im = 0
      for (let n = 0; n < size; n += 1) {
        const v = x[start + n]! * (0.5 - 0.5 * Math.cos((2 * Math.PI * n) / size))
        re += v * Math.cos(w * n)
        im -= v * Math.sin(w * n)
      }
      sum += re * re + im * im
    }
  }
  return 10 * Math.log10(sum / frames / (size / 4) ** 2 + 1e-30)
}

/** The settings the two claims of "sample for sample" are tried at. */
const TRIED: Record<string, number>[] = [
  {},
  { feedback: 40 },
  { stages: 1, spread: 30, feedback: 40, rate: 0.3, stereo: 90 },
  { stages: 4, spread: 100, feedback: 95, depth: 100, stereo: 180 },
  { feedback: -95, shape: 4, rate: 2 },
  { shape: 5, rate: 3, stereo: 90, mix: 0.8 },
  { centerHz: 5000, depth: 100, shape: 2 },
  { centerHz: 100, depth: 100, shape: 3, stages: 2, spread: 50, feedback: 70 },
]

/** The four octaves the pad has most of its sound in. */
const OCTAVES: [number, number][] = [
  [200, 400],
  [400, 800],
  [800, 1600],
  [1600, 3200],
]

/**
 * What the device answers to one sample of 0.1 (small, so the loop's limiter stays linear) with
 * its oscillator still: a tap's left side, up to where it has died away.
 */
function struck(phasing: Lab, values: Record<string, number>, id = 'out'): Float32Array {
  const heard = tap(phasing.render(click(seconds(2), 0, 0.1), { ...still, ...values }), id)
  let length = heard.length
  while (length > 1 && Math.abs(heard[length - 1]!) < 1e-9) length -= 1
  return heard.subarray(0, length)
}

/** The level of that answer at one frequency, in dB against the sample that went in. */
function levelAt(answer: Float32Array, hz: number): number {
  const w = (2 * Math.PI * hz) / RATE
  let re = 0
  let im = 0
  for (let n = 0; n < answer.length; n += 1) {
    re += answer[n]! * Math.cos(w * n)
    im -= answer[n]! * Math.sin(w * n)
  }
  return 10 * Math.log10((re * re + im * im) / 0.01 + 1e-30)
}

/**
 * The tops (`sign` 1) or the bottoms (−1) of that answer's level between 20 Hz and 20 kHz:
 * [hertz, dB] for each, found on 600 points and then closed in on.
 */
function extremes(answer: Float32Array, sign: 1 | -1): [number, number][] {
  const count = 600
  const hz = (i: number) => 20 * 1000 ** (i / (count - 1))
  const levels = Array.from({ length: count }, (_, i) => sign * levelAt(answer, hz(i)))
  const out: [number, number][] = []
  for (let i = 1; i < count - 1; i += 1) {
    if (!(levels[i]! > levels[i - 1]! && levels[i]! >= levels[i + 1]!)) continue
    let below = hz(i - 1)
    let above = hz(i + 1)
    for (let step = 0; step < 40; step += 1) {
      const first = below + (above - below) * 0.382
      const second = below + (above - below) * 0.618
      if (sign * levelAt(answer, first) > sign * levelAt(answer, second)) above = second
      else below = first
    }
    const found = 0.5 * (below + above)
    out.push([found, levelAt(answer, found)])
  }
  return out
}

/** A steady tone's level coming out against its level going in, over the middle second, in dB. */
function toneLevel(phasing: Lab, hz: number, values: Record<string, number>, id = 'out') {
  const tone = sine(hz, 0.5, seconds(2))
  const heard = tap(phasing.render(tone, values), id)
  return levelDb(heard, 24_000, 72_000) - levelDb(tone.left, 24_000, 72_000)
}

/** How far a tone at `hz` in a three-cycle curve of the lab lags the tone that went in, in degrees. */
function lagOf(copy: Float32Array, hz: number): number {
  const whole = Math.round((2 * RATE) / hz)
  let a = 0
  let b = 0
  for (let i = 0; i < whole; i += 1) {
    a += copy[i]! * Math.sin((2 * Math.PI * hz * i) / RATE)
    b += copy[i]! * Math.cos((2 * Math.PI * hz * i) / RATE)
  }
  return (-Math.atan2(b, a) * 180) / Math.PI
}

/** Milliseconds a sound stays over 60 dB under a click of `size` that was put in at sample `from`. */
function ringMs(heard: Float32Array, from: number, size: number): number {
  let last = from
  for (let i = from; i < heard.length; i += 1) if (Math.abs(heard[i]!) > size * 1e-3) last = i
  return ((last - from) * 1000) / RATE
}

/** How many times a looped control tap rises through a level in one turn of the loop. */
function risings(x: Float32Array, level: number): number {
  let count = 0
  for (let i = 0; i < x.length; i += 1) {
    const before = x[(i + x.length - 1) % x.length]!
    if (before < level && x[i]! >= level) count += 1
  }
  return count
}

/** A sound's level in stretches of 10 ms, in dB against a steady tone of amplitude 0.5. */
function stretches(x: Float32Array): number[] {
  const full = gainToDb(0.5 / Math.SQRT2)
  const levels: number[] = []
  for (let from = 0; from + 480 <= x.length; from += 480)
    levels.push(levelDb(x, from, from + 480) - full)
  return levels
}

/** The stretches at which those levels bottom out more than 20 dB down, the loop taken as a ring. */
function dipsOf(levels: number[]): number[] {
  return levels.flatMap((level, k) => {
    const before = levels[(k + levels.length - 1) % levels.length]!
    const after = levels[(k + 1) % levels.length]!
    return level < before && level <= after && level < -20 ? [k] : []
  })
}

describe('phasing', () => {
  it('is a sound lab on the pad: every tap says something, loops, and answers to every control', async () => {
    const phasing = await lab(NAME)
    const pad = await benchSource('pad', seconds(4))
    expectSoundLab(phasing, pad, phasing.render(pad, {}))
  })

  it('is a sound lab on the noise, the saw and the guitar chords too', async () => {
    const phasing = await lab(NAME)
    for (const id of ['noise', 'saw', 'chords']) {
      const source = await benchSource(id, seconds(4))
      expectSoundLab(phasing, source, phasing.render(source, {}))
    }
  })

  it('builds a phaser a piece at a time: every step changes a built tap, leaves the main path alone, and the last is held to the device', async () => {
    const phasing = await lab(NAME)
    const pad = await benchSource('pad', seconds(4))
    // Feedback starts at 0 %, where the last piece adds nothing: it is turned up for every step.
    expectBuild(phasing, pad, { feedback: 40 })
    expect(phasing.description.controls.find((one) => one.id === 'build')!.choices).toEqual([
      'One all-pass',
      'A chain',
      'Add the input',
      'The sweep',
      'Feedback',
    ])
  })

  // ---- part 1: why ------------------------------------------------------------------------------

  it('leaves the pad as loud as it was through the all-passed copy alone: less than 0.001 dB as a whole, and less than 0.2 dB in any of the four octaves from 200 Hz to 3,200 Hz at any moment (claim why-copy)', async () => {
    const phasing = await lab(NAME)
    const copy = await played(phasing, 'copy')
    expectWritten(
      Math.abs(levelDb(tap(copy, 'out')) - levelDb(tap(copy, 'in'))),
      'less than 0.001 dB',
    )
    let worst = 0
    for (const [lo, hi] of OCTAVES) {
      const { lo: least, hi: most } = swing(phasing, lo, hi)
      worst = Math.max(worst, -least, most)
    }
    expectWritten(worst, 'less than 0.2 dB')
    // The set that plays the pad as it is leaves it alone: its tap is the input.
    expect(settings.sets.held!.tap).toBe('in')
  })

  it('brings the pad out 4.2 dB quieter when the copy is mixed with it and nothing moves (claim why-stopped)', async () => {
    const phasing = await lab(NAME)
    const stopped = await played(phasing, 'stopped')
    expectWritten(levelDb(tap(stopped, 'in')) - levelDb(tap(stopped, 'out')), '4.2 dB')
    // Nothing moves: the corner stays on Centre, and the four octaves each lose their own share.
    expect(range(tap(stopped, 'corner')).span).toBe(0)
    const lost = OCTAVES.map(([lo, hi]) => -swing(phasing, lo, hi).hi)
    expect(lost[0]!).toBeGreaterThan(7)
    expect(lost[1]!).toBeLessThan(1.5)
  })

  it('swings the octave from 800 Hz to 1,600 Hz of the pad between 0.6 dB and 11.2 dB down across the loop once the corner moves (claim why-swept)', async () => {
    const phasing = await lab(NAME)
    await played(phasing, 'swept')
    const { lo, hi } = swing(phasing, 800, 1600)
    expectWritten(-hi, '0.6 dB')
    expectWritten(-lo, '11.2 dB')
    // With the oscillator still the same octave moves by less than 2 dB.
    await played(phasing, 'stopped')
    expect(swing(phasing, 800, 1600).span).toBeLessThan(2)
  })

  // ---- part 2: the picture ----------------------------------------------------------------------

  it('draws a 200 Hz tone and its copy 112° apart, and their mix 0.56 times as tall as the tone (claim tone-start)', async () => {
    const phasing = await lab(NAME)
    const pad = await benchSource('pad', seconds(1))
    const out = phasing.render(pad, {})
    expect(phasing.description.controls.find((one) => one.id === 'tone')!.initial).toBe(200)
    // Three cycles, starting at nothing on the way up, as tall as full scale.
    expect(out.taps.toneIn!.x1).toBeCloseTo(3, 1)
    expect(peak(tap(out, 'toneIn'))).toBeCloseTo(1, 3)
    expect(peak(tap(out, 'toneCopy'))).toBeCloseTo(1, 3)
    const lag = lagOf(tap(out, 'toneCopy'), 200)
    expectWritten(lag, '112°')
    expectWritten(peak(tap(out, 'toneSum')), '0.56')
    // The height is the cosine of half the lag.
    expect(peak(tap(out, 'toneSum'))).toBeCloseTo(Math.cos((lag * Math.PI) / 360), 3)
    // The lag is the phase of the whole chain at that frequency.
    expect(-at(tap(out, 'chainPhase'), 200)).toBeCloseTo(lag, 1)
  })

  it('draws the copy 180° behind a tone at the first notch, 331.6 Hz, and their mix under a thousandth of the tone (claim tone-cancel)', async () => {
    const phasing = await lab(NAME)
    const pad = await benchSource('pad', seconds(1))
    const hz = notchHz(800, 4, 1)
    expectWritten(hz, '331.6 Hz')
    const out = phasing.render(pad, { tone: hz })
    expectWritten(lagOf(tap(out, 'toneCopy'), hz), '180°')
    expectWritten(peak(tap(out, 'toneSum')), 'less than 0.001')
    expect(peak(tap(out, 'toneCopy'))).toBeCloseTo(1, 3)
  })

  it('draws the copy of a tone at Centre, 800 Hz, on top of the tone, and their mix as tall as the tone, 1.00 (claim tone-whole)', async () => {
    const phasing = await lab(NAME)
    const pad = await benchSource('pad', seconds(1))
    const out = phasing.render(pad, { tone: 800 })
    const copy = tap(out, 'toneCopy')
    const tone = tap(out, 'toneIn')
    expect(copy.every((v, i) => Math.abs(v - tone[i]!) < 1e-4)).toBe(true)
    expectWritten(peak(tap(out, 'toneSum')), '1.00')
    // A whole turn behind, which looks like no turn at all.
    expectWritten(at(tap(out, 'chainPhase'), 800), '−360°')
  })

  // ---- part 3: what it is used on ---------------------------------------------------------------

  it('swings the octave from 800 Hz to 1,600 Hz of the held pad between 15.0 dB down and 1.1 dB up at the settings of its card (claim use-strings)', async () => {
    const phasing = await lab(NAME)
    await played(phasing, 'strings')
    const { lo, hi } = swing(phasing, 800, 1600)
    expectWritten(-lo, '15.0 dB')
    expectWritten(hi, '1.1 dB')
  })

  it('sweeps the corner between 177 Hz and 1,414 Hz twice in the loop under the strummed chords (claim use-strum)', async () => {
    const phasing = await lab(NAME)
    const corner = tap(await played(phasing, 'strum'), 'corner')
    expectWritten(range(corner).lo, '177 Hz')
    expectWritten(range(corner).hi, '1,414 Hz')
    expect(risings(corner, 500)).toBe(2)
  })

  it('sweeps the corner between 210 Hz and 1,189 Hz four times in the loop under the guitar line (claim use-line)', async () => {
    const phasing = await lab(NAME)
    const corner = tap(await played(phasing, 'line'), 'corner')
    expectWritten(range(corner).lo, '210 Hz')
    expectWritten(range(corner).hi, '1,189 Hz')
    expect(risings(corner, 500)).toBe(4)
  })

  it('carries four notches across the noise with eight stages, the corner going from 200 Hz to 3,200 Hz (claim use-hiss)', async () => {
    const phasing = await lab(NAME)
    const hiss = await played(phasing, 'hiss')
    expectWritten(range(tap(hiss, 'corner')).lo, '200 Hz')
    expectWritten(range(tap(hiss, 'corner')).hi, '3,200 Hz')
    // Four places where the chain's phase crosses an odd half turn, at any corner.
    expect(hiss.taps.crossings!.length).toBe(4)
    // And four dips in the measured response of the sum, with the oscillator held still.
    const stopped = await played(phasing, 'hiss', still)
    expect(turns(tap(stopped, 'plain'), -1).filter(([, db]) => db < -20).length).toBe(4)
  })

  // ---- part 4: the build ------------------------------------------------------------------------

  it('at the first step turns a tone at Centre 90° and keeps every level within 0.001 dB (claim build-stage); with Centre moved an octave down the same tone is turned further', async () => {
    const phasing = await lab(NAME)
    const pad = await benchSource('pad', seconds(1))
    const first = phasing.render(pad, { build: 0 })
    expectWritten(-at(tap(first, 'builtPhase'), 800), '90°')
    expectWritten(peak(tap(first, 'builtResponse')), 'less than 0.001 dB')
    // The quarter turn belongs to the corner: tuned to 400 Hz, the stage turns 800 Hz by 127°.
    const moved = -at(tap(phasing.render(pad, { build: 0, centerHz: 400 }), 'builtPhase'), 800)
    expect(matchesWritten(moved, '90°')).toBe(false)
    expect(moved).toBeGreaterThan(126)
    expect(moved).toBeLessThan(128)
  })

  it('at the second step turns a tone at Centre 360° through four stages, where the one stage of the step before turned it 90° (claim build-chain)', async () => {
    const phasing = await lab(NAME)
    const pad = await benchSource('pad', seconds(1))
    const turned = (build: number, values = {}) =>
      -at(tap(phasing.render(pad, { build, ...values }), 'builtPhase'), 800)
    expectWritten(turned(1), '360°')
    // The piece off: one stage.
    expect(matchesWritten(turned(0), '360°')).toBe(false)
    expectWritten(turned(0), '90°')
    // Every stage adds its quarter: twelve of them turn the tone three whole turns.
    expect(turned(1, { stages: 4 })).toBeCloseTo(1080, 0)
    // And the chain alone still changes no level.
    expect(peak(tap(phasing.render(pad, { build: 1 }), 'builtResponse'))).toBeLessThan(0.001)
  })

  it('at the third step brings a tone at the first notch out more than 130 dB down, where the step before left it within 0.01 dB (claim build-sum)', async () => {
    const phasing = await lab(NAME)
    const hz = notchHz(800, 4, 1)
    const down = (build: number) => -toneLevel(phasing, hz, { build }, 'built')
    expectWritten(down(2), 'more than 130 dB')
    // The piece off: the chain alone.
    expect(matchesWritten(down(1), 'more than 130 dB')).toBe(false)
    expectWritten(Math.abs(down(1)), 'less than 0.01 dB')
    // The step's two curves are this step and the one before it.
    const pad = await benchSource('pad', seconds(1))
    const third = phasing.render(pad, { build: 2 })
    const second = phasing.render(pad, { build: 1 })
    expect(Math.min(...tap(third, 'builtResponse'))).toBeLessThan(-40)
    expect(tap(third, 'builtBefore').every((v, i) => v === tap(second, 'builtResponse')[i])).toBe(
      true,
    )
  })

  it('at the fourth step, at a Depth of 60 %, carries the corner from 283 Hz to 2,263 Hz, where the step before left it at 800 Hz (claim build-sweep)', async () => {
    const phasing = await lab(NAME)
    const pad = await benchSource('pad', seconds(4))
    const corner = (build: number) => range(tap(phasing.render(pad, { build }), 'builtCorner'))
    expectWritten(corner(3).lo, '283 Hz')
    expectWritten(corner(3).hi, '2,263 Hz')
    // The piece off: nothing moves.
    expect(matchesWritten(corner(2).lo, '283 Hz')).toBe(false)
    expect(matchesWritten(corner(2).hi, '2,263 Hz')).toBe(false)
    expectWritten(corner(2).lo, '800 Hz')
    expectWritten(corner(2).hi, '800 Hz')
    // The built corner is the device's own, point for point.
    const whole = phasing.render(pad, { build: 3 })
    const built = tap(whole, 'builtCorner')
    const device = tap(whole, 'corner')
    expect(built.every((v, i) => Math.abs(v / device[i]! - 1) < 1e-5)).toBe(true)
    // A tone at the first notch is back within 3 dB over the loop once the notch moves on.
    const hz = notchHz(800, 4, 1)
    const tone = sine(hz, 0.5, seconds(4))
    const moving = levelDb(tap(phasing.render(tone, { build: 3 }), 'built')) - levelDb(tone.left)
    expect(moving).toBeGreaterThan(-3)
  })

  it('at the fifth step, with Feedback at 40 %, lifts a peak of 2.5 dB between the notches, where the step before had nothing over 0.0 dB (claim build-loop)', async () => {
    const phasing = await lab(NAME)
    const pad = await benchSource('pad', seconds(1))
    const top = (build: number) =>
      Math.max(...tap(phasing.render(pad, { build, feedback: 40 }), 'builtResponse'))
    expectWritten(top(4), '2.5 dB')
    // The piece off: the Feedback control is there and nothing reads it.
    expect(matchesWritten(top(3), '2.5 dB')).toBe(false)
    expectWritten(top(3), '0.0 dB')
    // The top stands between the two notches, and not above them.
    const curve = tap(phasing.render(pad, { build: 4, feedback: 40 }), 'builtResponse')
    const where = curveHz(curve.indexOf(Math.max(...curve)), curve.length)
    expect(where).toBeGreaterThan(notchHz(800, 4, 1))
    expect(where).toBeLessThan(notchHz(800, 4, 2))
    // The built curve is the device's own response at the same setting.
    const whole = phasing.render(pad, { build: 4, feedback: 40, depth: 0 })
    const built = tap(whole, 'builtResponse')
    const device = tap(whole, 'response')
    expect(built.every((v, i) => Math.abs(v - device[i]!) < 0.01)).toBe(true)
  })

  it('makes, with all five pieces, what the device makes, sample for sample, on every loop and at every setting tried, and after a silence (claim build-same)', async () => {
    const phasing = await lab(NAME)
    expect(TRIED.length).toBe(8)
    for (const id of ['pad', 'chords', 'drums', 'guitar', 'mix', 'noise']) {
      const source = await benchSource(id, seconds(4))
      for (const values of TRIED) {
        const out = phasing.render(source, { ...values, build: 4 })
        expect(out.checks.builtDifference, id).toBeLessThanOrEqual(out.checks.builtBound!)
        for (const channel of [0, 1]) {
          const device = tap(out, 'out', channel)
          expect(
            tap(out, 'built', channel).every((v, i) => v === device[i]),
            `${id} ${JSON.stringify(values)}`,
          ).toBe(true)
        }
      }
    }
    // Two seconds of silence and then a tone: the device sleeps, and the build with it.
    const waking = silence(seconds(4))
    const tone = sine(440, 0.5, seconds(4))
    waking.left.set(tone.left.subarray(0, seconds(2)), seconds(2))
    waking.right.set(tone.right.subarray(0, seconds(2)), seconds(2))
    const out = phasing.render(waking, { build: 4, feedback: 80 })
    expect(tap(out, 'built').every((v, i) => v === tap(out, 'out')[i])).toBe(true)
    expect(out.checks.builtBound).toBe(-120)
    expect(out.checks.builtStep).toBe(4)
  })

  // ---- part 5: the engine, stage by stage -------------------------------------------------------

  it('turns one stage a quarter turn, −90°, at its corner (claim quarter-turn), 2.9° at 20 Hz and 178° at 20 kHz (claim phase-ends)', async () => {
    const phasing = await lab(NAME)
    const noise = await benchSource('noise', seconds(1))
    const phase = tap(phasing.render(noise, {}), 'phase')
    expectWritten(at(phase, 800), '−90°')
    expectWritten(-phase[0]!, '2.9°')
    expectWritten(-phase[phase.length - 1]!, '178°')
    // It only ever falls: more turn the higher the frequency.
    expect(phase.every((v, i) => i === 0 || v < phase[i - 1]!)).toBe(true)
  })

  it('measures the phase the formula gives, less than 0.001° apart at any Centre (claim phase-formula)', async () => {
    const phasing = await lab(NAME)
    const noise = await benchSource('noise', seconds(1))
    for (const centerHz of [100, 283, 800, 2263, 5000]) {
      expectWritten(phasing.render(noise, { centerHz }).checks.phaseError!, 'less than 0.001°')
    }
  })

  it('keeps every frequency at its level through the chain alone, less than 0.001 dB away (claim flat-level)', async () => {
    const phasing = await lab(NAME)
    const noise = await benchSource('noise', seconds(1))
    for (const stages of [0, 1, 2, 3, 4]) {
      for (const spread of [0, 30, 100]) {
        for (const centerHz of [100, 800, 5000]) {
          expectWritten(
            phasing.render(noise, { stages, spread, centerHz }).checks.flat!,
            'less than 0.001 dB',
          )
        }
      }
    }
  })

  it("gives the all-passed copy the noise's spectrum: bin for bin less than 0.2 dB away, and as a whole less than 0.001 dB (claim same-spectrum)", async () => {
    const phasing = await lab(NAME)
    const noise = await benchSource('noise', seconds(4))
    for (const values of [{}, still]) {
      const out = phasing.render(noise, values)
      const before = phasing.spectrum('in')
      const after = phasing.spectrum('wet')
      let worst = 0
      // Bins from 23 Hz to 20 kHz, 11.7 Hz apart.
      for (let k = 2; k <= 1706; k += 1) worst = Math.max(worst, Math.abs(after[k]! - before[k]!))
      expectWritten(worst, 'less than 0.2 dB')
      expectWritten(
        Math.abs(levelDb(tap(out, 'wet')) - levelDb(tap(out, 'in'))),
        'less than 0.001 dB',
      )
    }
  })

  it('holds a 50 Hz tone back 1.59 ms through four stages at 800 Hz and leaves its level alone (claim low-delay)', async () => {
    const phasing = await lab(NAME)
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
    const wet = tap(out, 'wet')
    const dry = tap(out, 'in')
    expectWritten(((angle(dry) - angle(wet)) / (2 * Math.PI * 50)) * 1000, '1.59 ms')
    expect(Math.abs(levelDb(wet, 24_000, 72_000) - levelDb(dry, 24_000, 72_000))).toBeLessThan(
      0.001,
    )
  })

  it('counts the turn of four stages at 800 Hz as a delay that grows less at every step up the spectrum, from 1.59 ms at 50 Hz to 0.19 ms at 10 kHz (claim high-delay)', async () => {
    const phasing = await lab(NAME)
    const noise = await benchSource('noise', seconds(1))
    const turn = tap(phasing.render(noise, still), 'chainPhase')
    // A turn of so many degrees is that many 360ths of one cycle of the tone.
    const ms = (hz: number) => (-at(turn, hz) / 360 / hz) * 1000
    expectWritten(ms(50), '1.59 ms')
    expectWritten(ms(10_000), '0.19 ms')
    const delays = Array.from(turn, (v, i) => -v / curveHz(i, turn.length))
    expect(delays.every((delay, i) => i === 0 || delay < delays[i - 1]!)).toBe(true)
  })

  it('brings a tone at the corner out of four stages as it went in, −360° on: what is left between the two is more than 130 dB under the tone (claim whole-turn)', async () => {
    const phasing = await lab(NAME)
    const out = phasing.render(sine(800, 0.5, seconds(2)), still)
    expectWritten(at(tap(out, 'chainPhase'), 800), '−360°')
    expectWritten(-differenceDb(tap(out, 'wet'), tap(out, 'in')), 'more than 130 dB')
  })

  it('has half as many notches as stages when the oscillator is still (claim notch-count)', async () => {
    const phasing = await lab(NAME)
    const noise = await benchSource('noise', seconds(4))
    for (const [choice, stages] of STAGES.entries()) {
      for (const spread of [0, 30]) {
        const out = phasing.render(noise, { ...still, stages: choice, spread })
        // Counted three ways. Where the chain's phase crosses an odd half turn:
        expect(out.taps.crossings!.length).toBe(stages / 2)
        // the dips of the sum's measured response:
        const dips = turns(tap(out, 'plain'), -1).filter(([, db]) => db < -20)
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

  it('puts the notches of four stages at 800 Hz on 331.6 Hz (claim first-notch) and 1,923 Hz, less than 0.01 Hz from the formula at every count of stages (claim second-notch)', async () => {
    const phasing = await lab(NAME)
    const noise = await benchSource('noise', seconds(1))
    const four = tap(phasing.render(noise, still), 'crossings')
    expectWritten(four[0]!, '331.6 Hz')
    expectWritten(four[1]!, '1,923 Hz')
    // The formula, for every count of stages and three centres.
    let worst = 0
    for (const [choice, stages] of STAGES.entries()) {
      for (const centerHz of [283, 800, 2263]) {
        const found = tap(
          phasing.render(noise, { ...still, stages: choice, centerHz }),
          'crossings',
        )
        const written = Array.from({ length: stages / 2 }, (_, i) =>
          notchHz(centerHz, stages, i + 1),
        )
        const shown = written.filter((hz) => hz >= 20 && hz <= 20_000)
        expect(found.length).toBe(shown.length)
        shown.forEach((hz, i) => (worst = Math.max(worst, Math.abs(found[i]! - hz))))
      }
    }
    expectWritten(worst, 'less than 0.01 Hz')
  })

  it('brings a tone at the first notch out more than 130 dB down (claim notch-null), and one a hundredth higher only 37 dB down (claim notch-side)', async () => {
    const phasing = await lab(NAME)
    expectWritten(-toneLevel(phasing, notchHz(800, 4, 1), still), 'more than 130 dB')
    expectWritten(-toneLevel(phasing, notchHz(800, 4, 2), still), 'more than 130 dB')
    expectWritten(-toneLevel(phasing, notchHz(800, 4, 1) * 1.01, still), '37 dB')
  })

  it('reads the sum at half mix under −100 dB at every frequency where the phase crosses an odd half turn (claim null-depth)', async () => {
    const phasing = await lab(NAME)
    const noise = await benchSource('noise', seconds(1))
    for (const stages of [0, 1, 2, 3, 4]) {
      for (const spread of [0, 30, 100]) {
        for (const centerHz of [100, 800, 5000]) {
          expectWritten(
            phasing.render(noise, { stages, spread, centerHz }).checks.nullDepth!,
            'under −100 dB',
          )
        }
      }
    }
  })

  it('makes notches 6 dB deep at a mix of a quarter or three quarters (claim mix-quarter) and none at all at a mix of 1 (claim mix-one)', async () => {
    const phasing = await lab(NAME)
    const noise = await benchSource('noise', seconds(2))
    for (const mix of [0.25, 0.75]) {
      const plain = tap(phasing.render(noise, { ...still, mix }), 'plain')
      expectWritten(-Math.min(...plain), '6 dB')
      expect(Math.max(...plain)).toBeCloseTo(0, 2)
    }
    const wet = phasing.render(noise, { ...still, mix: 1 })
    expectWritten(range(tap(wet, 'plain')).span, 'less than 0.001 dB')
    // The output is then the all-passed copy, to the last bit but one.
    const allPassed = tap(wet, 'wet')
    expect(tap(wet, 'out').every((v, i) => Math.abs(v - allPassed[i]!) < 1e-6)).toBe(true)
  })

  it('is the input, sample for sample, at a mix of 0, on three loops, on both sides and at each of the eight settings of the other controls tried (claim mix-zero)', async () => {
    const phasing = await lab(NAME)
    for (const id of ['pad', 'drums', 'noise']) {
      const source = await benchSource(id, seconds(4))
      for (const values of TRIED) {
        const out = phasing.render(source, { ...values, mix: 0 })
        for (const channel of [0, 1]) {
          const dry = tap(out, 'in', channel)
          expect(
            tap(out, 'out', channel).every((v, i) => v === dry[i]),
            `${id} ${JSON.stringify(values)}`,
          ).toBe(true)
        }
      }
    }
    // The comparison can fail: a hundredth of the copy let in is not the input.
    const noise = await benchSource('noise', seconds(1))
    const out = phasing.render(noise, { mix: 0.01 })
    const dry = tap(out, 'in')
    expect(tap(out, 'out').every((v, i) => v === dry[i])).toBe(false)
  })

  it("stands the comb's notches 667 Hz apart, eighteen of them under 12 kHz (claim comb-even), where four stages have two, the second 5.8 times the first (claim notch-ratio)", async () => {
    const phasing = await lab(NAME)
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
    // Every gap the same, to the 2.5 Hz between two points of the curve.
    for (let i = 1; i < notches.length; i += 1) {
      expect(Math.abs(notches[i]! - notches[i - 1]! - RATE / 72)).toBeLessThan(5.1)
    }
    expectWritten((notches[17]! - notches[0]!) / 17, '667 Hz')
    const four = tap(out, 'crossings')
    expect(four.length).toBe(2)
    expectWritten(four[1]! / four[0]!, '5.8 times')
    // No whole number, and no two gaps alike with more stages: the six notches of twelve stages.
    const twelve = Array.from(tap(phasing.render(noise, { ...still, stages: 4 }), 'crossings'))
    const gaps = twelve.slice(1).map((hz, i) => hz - twelve[i]!)
    expect(gaps.every((gap, i) => i === 0 || gap > 1.2 * gaps[i - 1]!)).toBe(true)
  })

  it('moves the notches of four stages to 329 Hz and 1,939 Hz at a spread of 30 % (claim spread-30) and to 303 Hz and 2,106 Hz at 100 % (claim spread-100)', async () => {
    const phasing = await lab(NAME)
    const noise = await benchSource('noise', seconds(1))
    const at30 = tap(phasing.render(noise, { ...still, spread: 30 }), 'crossings')
    expectWritten(at30[0]!, '329 Hz')
    expectWritten(at30[1]!, '1,939 Hz')
    const at100 = tap(phasing.render(noise, { ...still, spread: 100 }), 'crossings')
    expectWritten(at100[0]!, '303 Hz')
    expectWritten(at100[1]!, '2,106 Hz')
  })

  it('brings the oscillator round once in the four-second loop at 0.25 Hz, up first (claim one-cycle)', async () => {
    const phasing = await lab(NAME)
    const noise = await benchSource('noise', seconds(4))
    const lfo = tap(phasing.render(noise, {}), 'lfo')
    // A point every 16 samples: 3,000 a second.
    expect(lfo[3000]!).toBeCloseTo(1, 4)
    expect(lfo[9000]!).toBeCloseTo(-1, 4)
    expect(risings(lfo, 0)).toBe(1)
  })

  it('sweeps the corner from 283 Hz to 2,263 Hz at a depth of 60 % (claim sweep-range) and from 141 Hz to 4,525 Hz at 100 % (claim full-depth)', async () => {
    const phasing = await lab(NAME)
    const noise = await benchSource('noise', seconds(4))
    const at60 = range(tap(phasing.render(noise, {}), 'corner'))
    expectWritten(at60.lo, '283 Hz')
    expectWritten(at60.hi, '2,263 Hz')
    expect(at60.lo).toBeCloseTo(800 * 2 ** -1.5, 0)
    expect(at60.hi).toBeCloseTo(800 * 2 ** 1.5, 0)
    const at100 = range(tap(phasing.render(noise, { depth: 100 }), 'corner'))
    expectWritten(at100.lo, '141 Hz')
    expectWritten(at100.hi, '4,525 Hz')
  })

  it('sweeps the first notch through a 331.5 Hz tone twice a cycle, more than 40 dB down each time the corner passes 800 Hz, and less than 2 dB down at the top of the sweep and at the bottom (claim sweep-null)', async () => {
    const phasing = await lab(NAME)
    const tone = sine(331.5, 0.5, seconds(4))
    const out = phasing.render(tone, {})
    const corner = tap(out, 'corner')
    const levels = stretches(tap(out, 'out'))
    const dips = dipsOf(levels)
    expect(dips.length).toBe(2)
    for (const k of dips) {
      expectWritten(-levels[k]!, 'more than 40 dB')
      // The corner in the middle of that stretch: 800 Hz, within 3 %.
      const there = corner[Math.round(((k + 0.5) * 480) / 16) % corner.length]! / 800
      expect(there).toBeGreaterThan(0.97)
      expect(there).toBeLessThan(1.03)
    }
    // With the corner at the top of its sweep, one second in, and at the bottom, three seconds in.
    expect(corner[3000]! / range(corner).hi).toBeCloseTo(1, 3)
    expect(corner[9000]! / range(corner).lo).toBeCloseTo(1, 3)
    expectWritten(Math.abs(levels[100]!), 'less than 2 dB')
    expectWritten(Math.abs(levels[300]!), 'less than 2 dB')
    // Not everywhere between the two: for a good part of the loop the tone is further down.
    expect(levels.filter((level) => level < -2).length).toBeGreaterThan(100)
  })

  it('lets the corner cover 63 % of a jump of the square wave, in octaves, in 3 ms (claim sweep-lag)', async () => {
    const phasing = await lab(NAME)
    const noise = await benchSource('noise', seconds(4))
    // Shape 4 of the device's six is the square.
    expect(phasing.description.controls.find((one) => one.id === 'shape')!.choices[4]).toBe(
      'Square',
    )
    const corner = tap(phasing.render(noise, { shape: 4 }), 'corner')
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
    // A point of the tap is a third of a millisecond.
    expectWritten(((k - start) * 1000) / POINT_RATE, '3 ms')
  })

  it('puts the right side a quarter of a cycle, one second at 0.25 Hz, ahead of the left at a stereo offset of 90 degrees (claim stereo-quarter)', async () => {
    const phasing = await lab(NAME)
    const noise = await benchSource('noise', seconds(4))
    const out = phasing.render(noise, { stereo: 90 })
    const top = (x: Float32Array) => x.indexOf(Math.max(...x)) / POINT_RATE
    const left = top(tap(out, 'corner'))
    const right = top(tap(out, 'cornerRight'))
    expect(left).toBeCloseTo(1, 1)
    expect((left - right + 4) % 4).toBeCloseTo(1, 1)
    // With no offset the two sides are one.
    const together = phasing.render(noise, {})
    const one = tap(together, 'corner')
    expect(tap(together, 'cornerRight').every((v, i) => v === one[i])).toBe(true)
  })

  it('lifts a peak of 2.5 dB between the notches at a feedback of 40 %, fills the notches to −17 dB and moves the upper one from 1,923 Hz to 2,034 Hz (claim feedback-40)', async () => {
    const phasing = await lab(NAME)
    const answer = struck(phasing, { feedback: 40 })
    const tops = extremes(answer, 1)
    const bottoms = extremes(answer, -1)
    // One peak between the notches and one above them.
    expect(tops.length).toBe(2)
    expect(tops[0]![0]).toBeGreaterThan(770)
    expect(tops[0]![0]).toBeLessThan(800)
    expectWritten(tops[0]![1], '2.5 dB')
    expect(tops[1]![0]).toBeGreaterThan(7000)
    expect(bottoms.length).toBe(2)
    expectWritten(bottoms[0]![1], '−17 dB')
    expectWritten(bottoms[1]![1], '−17 dB')
    expectWritten(bottoms[1]![0], '2,034 Hz')
    // Without feedback the same search finds the notch where the chain's phase crosses.
    expectWritten(extremes(struck(phasing, {}), -1)[1]![0], '1,923 Hz')
    // The lab's own curve of the response agrees with the search.
    const response = tap(
      phasing.render(await benchSource('noise', seconds(1)), { ...still, feedback: 40 }),
      'response',
    )
    expect(Math.max(...response)).toBeCloseTo(tops[0]![1], 1)
  })

  it('lifts the peaks to 20 dB at a feedback of 95 %, at 780 Hz and at 6.75 kHz (claim feedback-95)', async () => {
    const phasing = await lab(NAME)
    const tops = extremes(struck(phasing, { feedback: 95 }), 1)
    expect(tops.length).toBe(2)
    expectWritten(tops[0]![0], '780 Hz')
    expectWritten(tops[0]![1], '20 dB')
    expectWritten(tops[1]![0] / 1000, '6.75 kHz')
    expectWritten(tops[1]![1], '20 dB')
  })

  it('turns the notches into peaks of 3.5 dB and 3.7 dB at a feedback of −75 %, at 326 Hz and 1,754 Hz (claim feedback-negative)', async () => {
    const phasing = await lab(NAME)
    const answer = struck(phasing, { feedback: -75 })
    const tops = extremes(answer, 1)
    expect(tops.length).toBe(2)
    expectWritten(tops[0]![0], '326 Hz')
    expectWritten(tops[0]![1], '3.5 dB')
    expectWritten(tops[1]![0], '1,754 Hz')
    expectWritten(tops[1]![1], '3.7 dB')
    // What is left between them is shallow: nothing under −3.1 dB.
    expect(Math.min(...extremes(answer, -1).map(([, db]) => db))).toBeGreaterThan(-3.1)
  })

  it('all but cancels the notches at a feedback of −62 %: from 20 Hz to 20 kHz the response stays between −3.5 dB and +1.7 dB (claim feedback-flat)', async () => {
    const phasing = await lab(NAME)
    const answer = struck(phasing, { feedback: -62 })
    const levels = Array.from({ length: 600 }, (_, i) => levelAt(answer, 20 * 1000 ** (i / 599)))
    expectWritten(Math.min(...levels), '−3.5 dB')
    expectWritten(Math.max(...levels), '+1.7 dB')
  })

  it('brings a quiet tone at the lower peak, 780 Hz, up 20.0 times at a feedback of 95 % (claim loop-gain) and holds a full-scale one to 3.4 times (claim loop-limit)', async () => {
    const phasing = await lab(NAME)
    // The peak is where the search of claim feedback-95 finds it.
    const hz = extremes(struck(phasing, { feedback: 95 }), 1)[0]![0]
    expectWritten(hz, '780 Hz')
    const quiet = phasing.render(sine(780, 0.01, seconds(2)), { ...still, feedback: 95 })
    expectWritten(peak(tap(quiet, 'wet')) / 0.01, '20.0 times')
    const loud = phasing.render(sine(780, 1, seconds(2)), { ...still, feedback: 95 })
    expectWritten(peak(tap(loud, 'wet')), '3.4 times')
  })

  it('gives exact silence for silence while its oscillator goes on turning (claim sleeps)', async () => {
    const phasing = await lab(NAME)
    const nothing: Source = silence(seconds(4))
    const out = phasing.render(nothing, { feedback: 95 })
    expect(tap(out, 'out').every((v) => v === 0)).toBe(true)
    expect(tap(out, 'wet').every((v) => v === 0)).toBe(true)
    const lfo = tap(out, 'lfo')
    expect(Math.max(...lfo)).toBeGreaterThan(0.999)
    expect(Math.min(...lfo)).toBeLessThan(-0.999)
  })

  // ---- part 6: ways to use it -------------------------------------------------------------------

  it('lifts a peak of 9.5 dB between the notches and one of 9.1 dB above them at a feedback of 80 %, oscillator still (claim way-vowel)', async () => {
    const phasing = await lab(NAME)
    expect(settings.sets.vowel!.values).toEqual({ feedback: 80 })
    const tops = extremes(struck(phasing, { feedback: 80 }), 1)
    expect(tops.length).toBe(2)
    expectWritten(tops[0]![1], '9.5 dB')
    expect(tops[0]![0]).toBeGreaterThan(770)
    expect(tops[0]![0]).toBeLessThan(800)
    expectWritten(tops[1]![1], '9.1 dB')
    expect(tops[1]![0]).toBeGreaterThan(notchHz(800, 4, 2))
  })

  it('keeps every one of four octaves of the pad less than 3 dB from where it went in at a feedback of −75 %, where no feedback takes one more than 14 dB down, and still moves each of them by more than 3 dB across the loop (claim way-inverted)', async () => {
    const phasing = await lab(NAME)
    const octaves = async (name: string) => {
      await played(phasing, name)
      return OCTAVES.map(([lo, hi]) => swing(phasing, lo, hi))
    }
    const furthest = (swings: { lo: number; hi: number }[]) =>
      Math.max(...swings.map((one) => Math.max(-one.lo, one.hi)))
    const inverted = await octaves('inverted')
    expectWritten(furthest(inverted), 'less than 3 dB')
    expectWritten(Math.min(...inverted.map((one) => one.span)), 'more than 3 dB')
    expectWritten(furthest(await octaves('swept')), 'more than 14 dB')
  })

  it('holds the corner on eight values in the four seconds with Shape on Random and Rate at 2 Hz (claim way-steps)', async () => {
    const phasing = await lab(NAME)
    const corner = tap(await played(phasing, 'steps'), 'corner')
    // A cycle is half a second, 1,500 points. In the middle fifth of each the corner holds still.
    const held: number[] = []
    for (let cycle = 0; cycle < 8; cycle += 1) {
      const middle = range(corner, cycle * 1500 + 600, cycle * 1500 + 900)
      expect(middle.span / middle.lo).toBeLessThan(1e-4)
      held.push(middle.lo)
    }
    // Eight different places.
    expect(new Set(held.map((hz) => Math.round(hz))).size).toBe(8)
  })

  it('puts the six notches of twelve stages from 96 Hz to 6.28 kHz at a spread of 100 %, oscillator still (claim way-dense)', async () => {
    const phasing = await lab(NAME)
    const noise = await benchSource('noise', seconds(1))
    const { stages, spread } = settings.sets.dense!.values
    const found = tap(
      phasing.render(noise, { ...still, stages: stages!, spread: spread! }),
      'crossings',
    )
    expect(found.length).toBe(6)
    expectWritten(found[0]!, '96 Hz')
    expectWritten(found[5]! / 1000, '6.28 kHz')
  })

  // ---- part 7: what goes wrong ------------------------------------------------------------------

  it('rings 72 ms after one click, counted to 60 dB under it, at a feedback of 95 %, where at 0 % it is over in 2.3 ms, and puts the loudest sample of the drums 2.4 dB higher (claim fault-rings)', async () => {
    const phasing = await lab(NAME)
    const one = click(seconds(2), 100, 0.5)
    // How long the output stays over 60 dB under the click, oscillator still.
    const ring = (feedback: number) =>
      ringMs(tap(phasing.render(one, { ...still, feedback }), 'out'), 100, 0.5)
    expectWritten(ring(95), '72 ms')
    expectWritten(ring(0), '2.3 ms')
    const rings = await played(phasing, 'rings')
    const loudest = (id: string) =>
      gainToDb(Math.max(peak(tap(rings, id, 0)), peak(tap(rings, id, 1))))
    expectWritten(loudest('out') - loudest('in'), '2.4 dB')
    // Still under full scale on this loop.
    expect(loudest('out')).toBeLessThan(0)
  })

  it('reads a corner of 28 kHz, over half the sample rate, at the top of a full sweep from 5 kHz (claim corner-over)', async () => {
    const phasing = await lab(NAME)
    const top = range(tap(await played(phasing, 'top'), 'corner')).hi
    expectWritten(top / 1000, '28 kHz')
    expect(top).toBeGreaterThan(24_000)
    expect(top / (5000 * 2 ** 2.5)).toBeCloseTo(1, 3)
  })

  it('reads a corner over the limit of the stages, 21.6 kHz, for 0.72 s of every cycle of a full sweep from 5 kHz (claim parked), and holds a tone at 18.42 kHz, on the lower notch of stages standing at that limit, more than 80 dB down all that time but for its first and last hundredth of a second (claim parked-tone)', async () => {
    const phasing = await lab(NAME)
    const limit = 0.45 * RATE
    expectWritten(limit / 1000, '21.6 kHz')
    const hz = notchHz(limit, 4, 1)
    expectWritten(hz / 1000, '18.42 kHz')
    const { values } = resolveSet(phasing.description, settings.sets.top!)
    const out = phasing.render(sine(hz, 0.5, seconds(4)), values)
    const corner = tap(out, 'corner')
    const over = Array.from(corner, (v) => v > limit)
    const first = over.indexOf(true)
    const last = over.lastIndexOf(true)
    const points = over.filter(Boolean).length
    // One unbroken stretch of the four-second cycle.
    expect(points).toBe(last - first + 1)
    expectWritten(points / POINT_RATE, '0.72 s')
    // The stretches of 10 ms that lie in it with 10 ms to spare at either end: a point of the
    // corner is 16 samples, so 30 of them are one stretch.
    const levels = stretches(tap(out, 'out'))
    const inside = levels.filter((_, k) => (k - 1) * 30 >= first && (k + 2) * 30 <= last)
    expect(inside.length).toBeGreaterThan(65)
    expectWritten(-Math.max(...inside), 'more than 80 dB')
    // The same tone outside that time comes through: the notch is elsewhere.
    expect(Math.max(...levels)).toBeGreaterThan(-3)
    // At a Depth of 60 % the corner never reaches the limit.
    const lower = tap(phasing.render(sine(hz, 0.5, seconds(4)), { ...values, depth: 60 }), 'corner')
    expect(Math.max(...lower)).toBeLessThan(limit)
  })

  it('dips a 331.5 Hz tone 43 dB on each side at a stereo offset of 90°, and only 8.3 dB in the sum of the two sides (claim fault-mono)', async () => {
    const phasing = await lab(NAME)
    const tone = sine(331.5, 0.5, seconds(4))
    const deepest = (stereo: number) => {
      const out = phasing.render(tone, { stereo })
      const left = tap(out, 'out', 0)
      const right = tap(out, 'out', 1)
      const mono = left.map((v, i) => 0.5 * (v + right[i]!))
      return [left, right, mono].map((x) => -Math.min(...stretches(x)))
    }
    const [left, right, mono] = deepest(90)
    expectWritten(left!, '43 dB')
    expectWritten(right!, '43 dB')
    expectWritten(mono!, '8.3 dB')
    // With no offset the sum is either side.
    const together = deepest(0)
    expect(together[2]!).toBeCloseTo(together[0]!, 3)
  })

  it('takes the octave from 800 Hz to 1,600 Hz of the pad between 0.6 dB and 11.2 dB down on the left side at a stereo offset of 90°, and between 2.4 dB and 9.8 dB down in the sum of the two sides (claim fault-mono-pad)', async () => {
    const phasing = await lab(NAME)
    const out = await played(phasing, 'across')
    expect(settings.sets.across!.values).toEqual({ stereo: 90 })
    const left = swing(phasing, 800, 1600)
    expectWritten(-left.hi, '0.6 dB')
    expectWritten(-left.lo, '11.2 dB')
    // The sum of the two sides is no tap of the lab, so its band is read here, slice by slice as
    // `swing` reads the left side.
    const summed = (id: string) => {
      const right = tap(out, id, 1)
      return tap(out, id, 0).map((v, i) => 0.5 * (v + right[i]!))
    }
    const apart = (after: Float32Array, before: Float32Array) => {
      const levels: number[] = []
      for (let from = 0; from + 8192 <= seconds(4); from += 8192)
        levels.push(bandOf(after, from, 8192, 800, 1600) - bandOf(before, from, 8192, 800, 1600))
      return range(levels)
    }
    const mono = apart(summed('out'), summed('in'))
    expectWritten(-mono.hi, '2.4 dB')
    expectWritten(-mono.lo, '9.8 dB')
    // The reading made here is the lab's own: on the left side alone the two agree.
    const again = apart(tap(out, 'out'), tap(out, 'in'))
    expect(again.lo).toBeCloseTo(left.lo, 3)
    expect(again.hi).toBeCloseTo(left.hi, 3)
  })

  // ---- part 8: what is often said ---------------------------------------------------------------

  it('spreads one sample over 2.5 ms through four stages: its tallest sample comes out 0.66 times as tall, with all of its energy, within 0.001 dB (claim myth-click)', async () => {
    const phasing = await lab(NAME)
    const one = click(seconds(2), 100, 0.5)
    const copy = tap(phasing.render(one, { ...still, mix: 1 }), 'out')
    expectWritten(ringMs(copy, 100, 0.5), '2.5 ms')
    expectWritten(peak(copy) / 0.5, '0.66')
    let energy = 0
    for (const v of copy) energy += v * v
    expectWritten(Math.abs(10 * Math.log10(energy / 0.25)), 'less than 0.001 dB')
  })

  it('puts the middle notch of six stages at 800 Hz, on Centre, where four stages and eight have none there (claim myth-centre)', async () => {
    const phasing = await lab(NAME)
    const noise = await benchSource('noise', seconds(1))
    const found = (stages: number) =>
      Array.from(tap(phasing.render(noise, { ...still, stages }), 'crossings'))
    const six = found(1)
    expect(six.length).toBe(3)
    expectWritten(six[1]!, '800 Hz')
    // Four stages and eight: no crossing within a third of an octave of Centre, and the level
    // of the mix there is the input's.
    for (const stages of [0, 2]) {
      expect(found(stages).every((hz) => Math.abs(Math.log2(hz / 800)) > 1 / 3)).toBe(true)
      const level = at(tap(phasing.render(noise, { ...still, stages }), 'plain'), 800)
      expect(Math.abs(level)).toBeLessThan(0.01)
    }
  })

  // ---- the settings file ------------------------------------------------------------------------

  it('renders every named set on its own source and tap: what plays is sound, between −36 dB and −5 dB over the loop, and under full scale', async () => {
    const phasing = await lab(NAME)
    for (const [name, set] of Object.entries(settings.sets)) {
      const { tap: sounding } = resolveSet(phasing.description, set)
      const result = await played(phasing, name)
      const heard = tap(result, sounding ?? 'out')
      expect(
        heard.every((v) => Number.isFinite(v)),
        name,
      ).toBe(true)
      expect(levelDb(heard), name).toBeGreaterThan(-36)
      expect(levelDb(heard), name).toBeLessThan(-5)
      expect(gainToDb(peak(heard)), name).toBeLessThan(0)
    }
  })

  it("starts the page's device table from the device's own defaults: the settings file's defaults are device.json's, and the lab's one other control is the Tone of its picture", async () => {
    const phasing = await lab(NAME)
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/phaser/device.json', import.meta.url)),
        'utf8',
      ),
    ) as {
      params: { key: string; default: number; min?: number; max?: number; choices?: string[] }[]
    }
    expect(settings.defaults!.values).toEqual(
      Object.fromEntries(device.params.map((one) => [one.key, one.default])),
    )
    // Every parameter of the device is a control of the lab, with the device's range or choices.
    for (const param of device.params) {
      const control = phasing.description.controls.find((one) => one.id === param.key)!
      expect(control, param.key).toBeDefined()
      if (param.choices) {
        expect(control.choices, param.key).toEqual(param.choices)
      } else {
        expect(control.min, param.key).toBeCloseTo(param.min!, 6)
        expect(control.max, param.key).toBeCloseTo(param.max!, 6)
      }
    }
    const { values } = resolveSet(phasing.description, { values: settings.defaults!.values })
    expect(Object.keys(values).filter((id) => !(id in settings.defaults!.values))).toEqual(['tone'])
  })
})
