import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  onsetMs,
  peak,
  points,
  POINT_RATE,
  range,
  RATE,
  rms,
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

const NAME = 'tremolo-and-ring-modulation'
const LOOP = seconds(4)

const tap = (result: RenderResult, id: string, channel = 0) =>
  result.taps[id]!.channels_data[channel]!

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings(NAME)!

/** A named set as its card plays it: on its own source, with `over` laid on its values. */
async function played(theLab: Lab, name: string, over: Record<string, number> = {}) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(theLab.description, set)
  return theLab.render(await benchSource(source!, LOOP), { ...values, ...over })
}

/** The steady tone most of the numbers are measured on: 440 Hz, the same on both sides. */
const TONE_HZ = 440
const TONE_PEAK = 0.5
const tone = (hz = TONE_HZ) => sine(hz, TONE_PEAK, LOOP)

/** A sound that holds one value: what comes out of a gain is then the gain itself, times it. */
function steady(value: number): Source {
  const source = silence(LOOP)
  source.left.fill(value)
  source.right.fill(value)
  return source
}

/**
 * The size of one frequency in a stretch of sound, in dB against a sine of peak 1: the sound
 * laid against a sine and a cosine at that frequency and summed. Over a whole number of seconds
 * every frequency that is a whole number of hertz comes round a whole number of times, so one
 * such line leaves nothing in the sum of another.
 */
function lineDb(x: Float32Array, hz: number, from = seconds(1), to = seconds(3)): number {
  let re = 0
  let im = 0
  const w = (2 * Math.PI * hz) / RATE
  for (let i = from; i < to; i += 1) {
    re += x[i]! * Math.cos(w * i)
    im += x[i]! * Math.sin(w * i)
  }
  return gainToDb((2 * Math.hypot(re, im)) / (to - from))
}

/** How far a line of a sound made from the test's tone stands under that tone, in dB. */
const under = (x: Float32Array, hz: number) => gainToDb(TONE_PEAK) - lineDb(x, hz)

/** The frequency between two, in steps of 1 Hz, at which a stretch of sound holds the most. */
function loudestHz(x: Float32Array, lo: number, hi: number, from = seconds(1), to = seconds(3)) {
  let best = lo
  let most = -Infinity
  for (let hz = lo; hz <= hi; hz += 1) {
    const level = lineDb(x, hz, from, to)
    if (level > most) [best, most] = [hz, level]
  }
  return { hz: best, level: most }
}

/** The largest jump from one sample to the next. */
function largestJump(x: Float32Array): number {
  let most = 0
  for (let i = 1; i < x.length; i += 1) most = Math.max(most, Math.abs(x[i]! - x[i - 1]!))
  return most
}

/** The largest jump from one sample to the next on either side of a sound. */
const largestJumpOf = (result: RenderResult, id: string) =>
  Math.max(largestJump(tap(result, id, 0)), largestJump(tap(result, id, 1)))

/** The level of a sound over the loop, both sides together, in dB against full scale. */
function levelOf(result: RenderResult, id: string): number {
  const left = rms(tap(result, id, 0))
  const right = rms(tap(result, id, 1))
  return gainToDb(Math.sqrt(0.5 * (left * left + right * right)))
}

/** The least and the most of one value worked out of two taps, point by point. */
function together(a: Float32Array, b: Float32Array, of: (a: number, b: number) => number) {
  let lo = Infinity
  let hi = -Infinity
  for (let k = 0; k < a.length; k += 1) {
    const value = of(a[k]!, b[k]!)
    lo = Math.min(lo, value)
    hi = Math.max(hi, value)
  }
  return { lo, hi }
}

/** Half the sum of the two sides: what one speaker plays. */
function mono(result: RenderResult, id: string): Float32Array {
  const left = tap(result, id, 0)
  const right = tap(result, id, 1)
  return left.map((value, i) => 0.5 * (value + right[i]!))
}

/**
 * Milliseconds a gain takes to fall from 90 % to 10 % of `top`, at its first fall after one
 * second, read off a steady sound that the gain was put on.
 */
function fallMs(y: Float32Array, top: number): number {
  let i = seconds(1)
  while (y[i]! < 0.9 * top) i += 1
  while (y[i]! >= 0.9 * top) i += 1
  const from = i
  while (y[i]! > 0.1 * top) i += 1
  return ((i - from) * 1000) / RATE
}

describe('tremolo and ring modulation', () => {
  it('is a sound lab on the pad: every tap says something, loops, and answers to every control', async () => {
    const theLab = await lab(NAME)
    const pad = await benchSource('pad', LOOP)
    const result = theLab.render(pad, {})
    // With Ring Drift at 0 the carrier holds one frequency, and on Tremolo, the mode the lab
    // starts in, Harmonic puts no gain on the highs.
    expectSoundLab(theLab, pad, result, { quiet: ['carrierHz', 'gainHigh'] })
  })

  it('builds the two in six pieces on taps of its own: every step changes one and none changes the main path', async () => {
    const theLab = await lab(NAME)
    // Stereo Phase starts at 0, where the fourth piece is there and does nothing.
    expectBuild(theLab, await benchSource('pad', LOOP), { phase: 90 })
  })

  // ---------------------------------------------------------------------------------------
  // Part 1: why.

  it('switched on and off, the pad jumps: on both sides the largest jump from one sample to the next is 8.1 dB larger than any in the pad as played (claim switch-jump)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'switched')
    const before = largestJumpOf(result, 'in')
    expectWritten(gainToDb(largestJumpOf(result, 'unslewed') / before), '8.1 dB')
    // The device at the same settings, its slew in place, makes no jump larger than the pad's.
    expect(largestJumpOf(result, 'tremolo')).toBeLessThan(before)
  })

  it('ridden up and down, the gain moves between 0.25 and 1.00, a swing of 12.0 dB, and no jump is larger than the largest in the pad (claim ridden)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'swayed')
    const gain = range(tap(result, 'gain'))
    expectWritten(gain.lo, '0.25')
    expectWritten(gain.hi, '1.00')
    expectWritten(gainToDb(gain.hi / gain.lo), '12.0 dB')
    expect(largestJumpOf(result, 'tremolo')).toBeLessThan(largestJumpOf(result, 'in'))
  })

  it('at 4 Hz the tone has lines at 436 Hz and 444 Hz beside it, each 6.0 dB under the one at 440 Hz (claim pred-slow)', async () => {
    const theLab = await lab(NAME)
    const out = tap(await played(theLab, 'toneSlow'), 'ring')
    expectWritten(loudestHz(out, 430, 450).hz, '440 Hz')
    expectWritten(lineDb(out, 440) - lineDb(out, 436), '6.0 dB')
    expectWritten(lineDb(out, 440) - lineDb(out, 444), '6.0 dB')
    // And nothing further off: a line at 340 Hz is more than 100 dB under the tone.
    expect(lineDb(out, 440) - lineDb(out, 340)).toBeGreaterThan(100)
  })

  it('at 100 Hz the tone comes out as three: 340 Hz and 540 Hz, each 6.0 dB under the tone that went in, and 440 Hz itself, 3.0 dB under (claim pred-lines)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'toneFast')
    const out = tap(result, 'ring')
    const went = lineDb(tap(result, 'in'), 440)
    expectWritten(loudestHz(out, 300, 400).hz, '340 Hz')
    expectWritten(loudestHz(out, 500, 600).hz, '540 Hz')
    expectWritten(loudestHz(out, 420, 460).hz, '440 Hz')
    expectWritten(went - lineDb(out, 340), '6.0 dB')
    expectWritten(went - lineDb(out, 540), '6.0 dB')
    expectWritten(went - lineDb(out, 440), '3.0 dB')
  })

  // ---------------------------------------------------------------------------------------
  // Part 2: the picture.

  it('ends the sweep on three lines, at 220 Hz, 880 Hz and 1,540 Hz, the outer two each 3.0 dB under the middle one (claim fan-lines)', async () => {
    const theLab = await lab(NAME)
    const result = theLab.render(tone(), {})
    const sweep = tap(result, 'sweep')
    // The stretch where the Ring's Frequency holds, short of the fade at the very end.
    const [from, to] = [seconds(3.5), seconds(3.9)]
    const low = loudestHz(sweep, 100, 400, from, to)
    const middle = loudestHz(sweep, 700, 1100, from, to)
    const high = loudestHz(sweep, 1300, 1800, from, to)
    expectWritten(low.hz, '220 Hz')
    expectWritten(middle.hz, '880 Hz')
    expectWritten(high.hz, '1,540 Hz')
    expectWritten(middle.level - low.level, '3.0 dB')
    expectWritten(middle.level - high.level, '3.0 dB')
    // The picture is of that sound: a late column is loud in the rows of those three and
    // empty between them.
    const fan = result.taps.fan!
    const rows = fan.channels_data[0]!.length / fan.columns
    const at = fan.columns - 12
    const column = fan.channels_data[0]!.subarray(at * rows, (at + 1) * rows)
    const row = (hz: number) => Math.round((hz / (RATE / 2)) * (rows - 1))
    for (const hz of [220, 880, 1540]) expect(column[row(hz)]!).toBeGreaterThan(-30)
    for (const hz of [550, 1210, 3000]) expect(column[row(hz)]!).toBeLessThan(-80)
  })

  it('with Ring Mix at 1 the middle line of the sweep is more than 50 dB under the other two (claim fan-middle)', async () => {
    const theLab = await lab(NAME)
    const sweep = tap(theLab.render(tone(), { ringMix: 1 }), 'sweep')
    const [from, to] = [seconds(3.5), seconds(3.9)]
    const middle = loudestHz(sweep, 780, 980, from, to).level
    expectWritten(lineDb(sweep, 220, from, to) - middle, 'more than 50 dB')
    expectWritten(lineDb(sweep, 1540, from, to) - middle, 'more than 50 dB')
  })

  it('the sweep answers to Wave and Ring Mix and to nothing else, and is the same on every source', async () => {
    const theLab = await lab(NAME)
    const source = tone()
    const first = tap(theLab.render(source, {}), 'sweep').slice()
    const same = (values: Record<string, number>, from: Source = source) =>
      tap(theLab.render(from, values), 'sweep').every((value, i) => value === first[i])
    expect(same({ frequency: 1000, rate: 9, depth: 0.2, lowCut: 500, width: 1, second: 2 })).toBe(
      true,
    )
    expect(same({}, await benchSource('drums', LOOP))).toBe(true)
    expect(same({ wave: 2 })).toBe(false)
    expect(same({ ringMix: 0.9 })).toBe(false)
  })

  // ---------------------------------------------------------------------------------------
  // Part 3: what it is used on.

  it('pulses a held chord: the gain moves between 0.405 and 0.995, a swing of 7.8 dB (claim use-organ)', async () => {
    const theLab = await lab(NAME)
    const gain = range(tap(await played(theLab, 'organ'), 'gain'))
    expectWritten(gain.lo, '0.405')
    expectWritten(gain.hi, '0.995')
    expectWritten(gainToDb(gain.hi / gain.lo), '7.8 dB')
  })

  it('shakes a ringing guitar with a triangle: the gain moves through 13.5 dB (claim use-strum)', async () => {
    const theLab = await lab(NAME)
    const gain = range(tap(await played(theLab, 'strum'), 'gain'))
    expectWritten(gainToDb(gain.hi / gain.lo), '13.5 dB')
  })

  it('chops a pad with a square whose every closing takes 7.4 ms, where with Smooth at 0 it takes 3.4 ms (claim use-chop)', async () => {
    const theLab = await lab(NAME)
    const { values } = resolveSet(theLab.description, settings.sets.chop!)
    const closing = (over: Record<string, number>) =>
      fallMs(tap(theLab.render(steady(0.5), { ...values, ...over }), 'tremolo'), 0.5)
    expectWritten(closing({}), '7.4 ms')
    expectWritten(closing({ smooth: 0 }), '3.4 ms')
    // On the pad, the card's own sound, the gain goes all the way: shut, and wide open.
    const gain = range(tap(await played(theLab, 'chop'), 'gain'))
    expect(gain.lo).toBeLessThan(0.001)
    expect(gain.hi).toBeGreaterThan(0.999)
  })

  it('moves a line from ear to ear: at every moment the two gains add up to 1.00 (claim use-ears)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'ears')
    const sum = together(tap(result, 'gain'), tap(result, 'gainRight'), (a, b) => a + b)
    expectWritten(sum.lo, '1.00')
    expectWritten(sum.hi, '1.00')
    // Each side by itself goes all the way down and all the way up.
    expect(range(tap(result, 'gain')).span).toBeGreaterThan(0.99)
  })

  it('rings a picked line at the device own settings and brings it out 0.1 dB quieter than it went in (claim use-bell)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'bell')
    expectWritten(levelOf(result, 'in') - levelOf(result, 'ring'), '0.1 dB')
  })

  it('turns the drums to metal and brings them out 4.1 dB quieter: the multiplying takes 0.24 dB and the two filters the rest (claim use-clang)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'clang')
    expectWritten(levelOf(result, 'in') - levelOf(result, 'ring'), '4.1 dB')
    expectWritten(levelOf(result, 'in') - levelOf(result, 'product'), '0.24 dB')
    // The timing is untouched: three hits of the loop speak within a quarter of a millisecond
    // of where they spoke going in.
    for (const from of [0, seconds(0.45), seconds(0.95)]) {
      const apart = onsetMs(tap(result, 'ring'), from) - onsetMs(tap(result, 'in'), from)
      expect(Math.abs(apart)).toBeLessThan(0.25)
    }
  })

  // ---------------------------------------------------------------------------------------
  // Part 4: the build. Steps count from 0: a wire, a slow wave, depth and shape, a phase
  // between the ears, audio rate, the offset taken away.

  /** How much quieter the built sound is than the tone that went in, over the loop. */
  const quieter = (result: RenderResult) =>
    gainToDb(rms(tap(result, 'in')) / rms(tap(result, 'built')))

  it('a slow wave brings a steady tone out 4.26 dB quieter, where the wire brings it out 0.0 dB quieter (claim build-slow)', async () => {
    const theLab = await lab(NAME)
    const wire = quieter(theLab.render(tone(), { build: 0 }))
    const slow = theLab.render(tone(), { build: 1 })
    expectWritten(quieter(slow), '4.26 dB')
    expectWritten(wire, '0.0 dB')
    expect(matchesWritten(wire, '4.26 dB')).toBe(false)
    // The gain of the slow wave goes from silence to the sound as it was.
    const gain = range(tap(slow, 'builtGain'))
    expect(gain.lo).toBeLessThan(0.001)
    expect(gain.hi).toBeGreaterThan(0.999)
  })

  it('with Depth at 0.5 the gain no longer reaches silence: at its lowest it is 0.50, which is 6.0 dB down (claim build-depth)', async () => {
    const theLab = await lab(NAME)
    const lowest = (step: number) =>
      range(tap(theLab.render(tone(), { build: step, depth: 0.5 }), 'builtGain')).lo
    const [before, dipped] = [lowest(1), lowest(2)]
    expectWritten(dipped, '0.50')
    expectWritten(-gainToDb(dipped), '6.0 dB')
    // The step before has no Depth: its gain still goes to silence.
    expect(matchesWritten(before, '0.50')).toBe(false)
    expect(matchesWritten(-gainToDb(before), '6.0 dB')).toBe(false)
  })

  it('a square closes in 3.4 ms once it has its slew, measured on a steady sound at the third step (claim build-slew)', async () => {
    const theLab = await lab(NAME)
    const fall = (step: number) =>
      fallMs(tap(theLab.render(steady(0.5), { build: step, rate: 4, shape: 2 }), 'built'), 0.5)
    expectWritten(fall(2), '3.4 ms')
    // The step before has neither the square nor the slew: its sine takes far longer to fall.
    expect(matchesWritten(fall(1), '3.4 ms')).toBe(false)
    expect(fall(1)).toBeGreaterThan(50)
  })

  it('with Stereo Phase at 180 the two gains add up to 1.00 at every moment, and without the piece they do not (claim build-ears)', async () => {
    const theLab = await lab(NAME)
    const sum = (step: number) => {
      const result = theLab.render(tone(), { build: step, phase: 180 })
      return together(tap(result, 'builtGain'), tap(result, 'builtGainRight'), (a, b) => a + b)
    }
    const [before, parted] = [sum(2), sum(3)]
    expectWritten(parted.lo, '1.00')
    expectWritten(parted.hi, '1.00')
    // At the step before, the right side reads the wave where the left does: the two gains
    // rise and fall together, and their sum goes from nothing to 2.
    expect(matchesWritten(before.lo, '1.00')).toBe(false)
    expect(matchesWritten(before.hi, '1.00')).toBe(false)
    expect(before.lo).toBeLessThan(0.01)
    expect(before.hi).toBeGreaterThan(1.99)
  })

  it('the fourth step is the engine tremolo: the two read −140 dB apart, the floor of the reading, on every loop and at every shape (claim build-same)', async () => {
    const theLab = await lab(NAME)
    const tried: Record<string, number>[] = [
      {},
      { phase: 90 },
      { shape: 1, depth: 0.55, smooth: 0.2 },
      { shape: 2, rate: 8, phase: 180 },
      { shape: 3, rate: 2.3, smooth: 1, phase: 45 },
      // None of these is in what the build builds: the device beside it is held without them.
      { mode: 2, drift: 1, mix: 0.3, frequency: 800, ringMix: 1 },
    ]
    for (const id of [
      'chords',
      'pad',
      'guitar',
      'bass',
      'drums',
      'mix',
      'sine',
      'saw',
      'noise',
      'clicks',
    ]) {
      const source = await benchSource(id, LOOP)
      for (const values of tried) {
        const { builtDifference } = theLab.render(source, values).checks
        expectWritten(builtDifference!, '−140 dB')
      }
    }
    // The comparison is made at the fourth step whichever step is shown (the second test of
    // this file holds that on the pad): here, at the last step on a loop with silences in it.
    const last = theLab.render(await benchSource('clicks', LOOP), { phase: 90, build: 5 })
    expectWritten(last.checks.builtDifference!, '−140 dB')
  })

  it('at audio rate the build makes new tones: 340 Hz and 540 Hz, each 12.04 dB under the tone that went in, with the tone itself at 440 Hz 6.0 dB under (claim build-fast)', async () => {
    const theLab = await lab(NAME)
    const built = (step: number) => tap(theLab.render(tone(), { build: step }), 'built')
    const fast = built(4)
    expectWritten(loudestHz(fast, 300, 400).hz, '340 Hz')
    expectWritten(loudestHz(fast, 500, 600).hz, '540 Hz')
    expectWritten(under(fast, 340), '12.04 dB')
    expectWritten(under(fast, 540), '12.04 dB')
    expectWritten(under(fast, 440), '6.0 dB')
    // At the step before, the wave turns at Rate: nothing stands at either frequency.
    expect(matchesWritten(under(built(3), 340), '12.04 dB')).toBe(false)
    expect(matchesWritten(under(built(3), 540), '12.04 dB')).toBe(false)
    expect(under(built(3), 340)).toBeGreaterThan(60)
  })

  it('with the offset taken away the two new tones stand 3.0 dB under the tone that went in and the tone itself is more than 100 dB under: the whole is 0.0 dB quieter (claim build-ring)', async () => {
    const theLab = await lab(NAME)
    const render = (step: number) => theLab.render(tone(), { build: step })
    const ring = tap(render(5), 'built')
    expectWritten(under(ring, 340), '3.0 dB')
    expectWritten(under(ring, 540), '3.0 dB')
    expectWritten(under(ring, 440), 'more than 100 dB')
    expectWritten(quieter(render(5)), '0.0 dB')
    // With the offset still in, the tone itself is there and the new ones are smaller.
    const before = tap(render(4), 'built')
    expect(matchesWritten(under(before, 340), '3.0 dB')).toBe(false)
    expect(matchesWritten(under(before, 440), 'more than 100 dB')).toBe(false)
  })

  it('the last step is what the Ring of the engine does at Ring Mix 1: the two are less than 0.001 dB apart at 340 Hz and at 540 Hz (claim build-ring-device)', async () => {
    const theLab = await lab(NAME)
    const result = theLab.render(tone(), { build: 5, ringMix: 1 })
    for (const hz of [340, 540]) {
      expectWritten(
        Math.abs(lineDb(tap(result, 'built'), hz) - lineDb(tap(result, 'ring'), hz)),
        'less than 0.001 dB',
      )
    }
    // The device's two lines are where the build's are, and the tone itself is in neither.
    expectWritten(loudestHz(tap(result, 'ring'), 300, 400).hz, '340 Hz')
    expectWritten(loudestHz(tap(result, 'ring'), 500, 600).hz, '540 Hz')
    expectWritten(under(tap(result, 'ring'), 440), 'more than 100 dB')
    expectWritten(under(tap(result, 'built'), 440), 'more than 100 dB')
  })

  // ---------------------------------------------------------------------------------------
  // Part 5: the engine's Tremolo. Nothing under cpp/ can be switched off, so these are
  // measured on the running device and held.

  it('the slew rounds a square: each fall of the gain takes 3.4 ms with Smooth at 0, 16.8 ms at 0.2 and 71 ms at 1 (claim slew-fall)', async () => {
    const theLab = await lab(NAME)
    const fall = (smooth: number) =>
      fallMs(tap(theLab.render(steady(0.5), { rate: 4, shape: 2, smooth }), 'tremolo'), 0.5)
    expectWritten(fall(0), '3.4 ms')
    expectWritten(fall(0.2), '16.8 ms')
    expectWritten(fall(1), '71 ms')
    // With the slew left out, the lesson's own tap, the gain gets there in one sample.
    const sudden = tap(theLab.render(steady(0.5), { rate: 4, shape: 2 }), 'unslewed')
    expect(largestJump(sudden)).toBe(0.5)
  })

  it('at the device own Depth of 0.55 the gain at its lowest is 0.45, which is 6.9 dB down (claim depth-055)', async () => {
    const theLab = await lab(NAME)
    const gain = range(tap(theLab.render(tone(), { rate: 5, depth: 0.55 }), 'gain'))
    expectWritten(gain.lo, '0.45')
    expectWritten(-gainToDb(gain.lo), '6.9 dB')
    expectWritten(gain.hi, '1.00')
  })

  it('a tremolo at 5 Hz puts lines at 435 Hz and 445 Hz beside a tone at 440 Hz, each 6.0 dB under it (claim trem-lines)', async () => {
    const theLab = await lab(NAME)
    const out = tap(theLab.render(tone(), { rate: 5 }), 'tremolo')
    expectWritten(loudestHz(out, 425, 455).hz, '440 Hz')
    expectWritten(lineDb(out, 440) - lineDb(out, 435), '6.0 dB')
    expectWritten(lineDb(out, 440) - lineDb(out, 445), '6.0 dB')
  })

  it('with Stereo Phase at a quarter of a cycle and Rate at 5 Hz the right side peaks 50 ms before the left (claim ears-quarter)', async () => {
    const theLab = await lab(NAME)
    const result = theLab.render(tone(), { rate: 5, phase: 90 })
    const top = (x: Float32Array) => {
      let at = points(1)
      for (let k = points(1); k < points(1.2); k += 1) if (x[k]! > x[at]!) at = k
      return at
    }
    const apart = top(tap(result, 'gain')) - top(tap(result, 'gainRight'))
    expectWritten((apart * 1000) / POINT_RATE, '50 ms')
  })

  it('Pan trades the sides at one power: the squares of the two gains add up to 2.00 at every moment (claim pan-power)', async () => {
    const theLab = await lab(NAME)
    const result = theLab.render(tone(), { mode: 1, rate: 5 })
    const power = together(tap(result, 'gain'), tap(result, 'gainRight'), (a, b) => a * a + b * b)
    expectWritten(power.lo, '2.00')
    expectWritten(power.hi, '2.00')
    // And each side by itself goes from nothing to the square root of two.
    expect(range(tap(result, 'gain')).lo).toBeLessThan(0.01)
    expect(range(tap(result, 'gain')).hi).toBeCloseTo(Math.SQRT2, 3)
  })

  it('Harmonic moves the lows and the highs against each other: at Depth 1 their two gains add up to 1.00 at every moment (claim harmonic-sum)', async () => {
    const theLab = await lab(NAME)
    const result = theLab.render(tone(), { mode: 2, rate: 5 })
    const sum = together(tap(result, 'gain'), tap(result, 'gainHigh'), (a, b) => a + b)
    expectWritten(sum.lo, '1.00')
    expectWritten(sum.hi, '1.00')
    // A tone under the crossover and a tone over it are each turned down by its own band's
    // gain: the low one is at its loudest where the high one is at its quietest.
    const size = (hz: number, from: number) =>
      rms(tap(theLab.render(tone(hz), { mode: 2, rate: 5 }), 'tremolo'), from, from + seconds(0.02))
    const gain = tap(result, 'gain')
    let crest = points(1)
    for (let k = points(1); k < points(1.2); k += 1) if (gain[k]! > gain[crest]!) crest = k
    const at = crest * 16 - seconds(0.01)
    const trough = at + seconds(0.1)
    expect(size(100, at)).toBeGreaterThan(4 * size(100, trough))
    expect(size(5000, trough)).toBeGreaterThan(4 * size(5000, at))
  })

  it('Vibrato bends a tone of 1,000 Hz between 980 Hz and 1,020 Hz at Rate 5 and leaves its level 0.0 dB from where it was (claim vibrato-bend)', async () => {
    const theLab = await lab(NAME)
    const result = theLab.render(tone(1000), { mode: 3, rate: 5 })
    const out = tap(result, 'tremolo')
    // The tone's phase against a steady 1,000 Hz, read every 2 ms: how fast that phase
    // turns is how far the pitch stands from 1,000 Hz.
    const box = 96
    const w = (2 * Math.PI * 1000) / RATE
    const phases: number[] = []
    for (let i = seconds(0.5); i < seconds(3.5); i += box) {
      let re = 0
      let im = 0
      for (let j = i; j < i + box; j += 1) {
        re += out[j]! * Math.cos(w * j)
        im -= out[j]! * Math.sin(w * j)
      }
      phases.push(Math.atan2(im, re))
    }
    let lowest = Infinity
    let highest = -Infinity
    for (let k = 1; k < phases.length; k += 1) {
      let turned = phases[k]! - phases[k - 1]!
      if (turned > Math.PI) turned -= 2 * Math.PI
      if (turned < -Math.PI) turned += 2 * Math.PI
      const hz = 1000 + (turned / (2 * Math.PI)) * (RATE / box)
      lowest = Math.min(lowest, hz)
      highest = Math.max(highest, hz)
    }
    expectWritten(lowest, '980 Hz')
    expectWritten(highest, '1,020 Hz')
    expectWritten(gainToDb(rms(out) / rms(tap(result, 'in'))), '0.0 dB')
  })

  it('Tremolo Mix is a straight blend: at 0.5 with Depth at 1 the gain at its lowest is 0.50, and at 0 the input comes out sample for sample (claim mix-linear)', async () => {
    const theLab = await lab(NAME)
    expectWritten(range(tap(theLab.render(tone(), { rate: 5, mix: 0.5 }), 'gain')).lo, '0.50')
    const dry = theLab.render(tone(), { rate: 5, mix: 0 })
    expect(tap(dry, 'tremolo').every((value, i) => value === tap(dry, 'in')[i])).toBe(true)
  })

  // ---------------------------------------------------------------------------------------
  // Part 5: the engine's Ring.

  it('the Ring at Ring Mix 1 turns a tone into two, at 340 Hz and 540 Hz, each 3.0 dB under it, leaves the tone at 440 Hz more than 100 dB under, and brings the whole out less than 0.001 dB from the level it went in (claim ring-lines)', async () => {
    const theLab = await lab(NAME)
    const result = theLab.render(tone(), { ringMix: 1 })
    for (const id of ['product', 'ring']) {
      const out = tap(result, id)
      expectWritten(loudestHz(out, 300, 400).hz, '340 Hz')
      expectWritten(loudestHz(out, 500, 600).hz, '540 Hz')
      expectWritten(under(out, 340), '3.0 dB')
      expectWritten(under(out, 540), '3.0 dB')
      expectWritten(under(out, 440), 'more than 100 dB')
      expectWritten(Math.abs(gainToDb(rms(out) / rms(tap(result, 'in')))), 'less than 0.001 dB')
    }
  })

  it('at Ring Mix 1, on a tone at half of full scale, the other shapes add a pair at 140 Hz and 740 Hz: 19.1 dB under the first pair for Triangle, 12.56 dB for Soft square and 19.3 dB for Diode, which also comes out 1 dB quieter (claim ring-shapes)', async () => {
    const theLab = await lab(NAME)
    const third = (wave: number) => {
      const out = tap(theLab.render(tone(), { ringMix: 1, wave }), 'ring')
      // The two of a pair are the same height to within 0.01 dB, where there is a pair.
      if (wave > 0) expect(Math.abs(lineDb(out, 140) - lineDb(out, 740))).toBeLessThan(0.01)
      return lineDb(out, 340) - lineDb(out, 140)
    }
    expectWritten(third(1), '19.1 dB')
    expectWritten(third(2), '12.56 dB')
    expectWritten(third(3), '19.3 dB')
    // A sine has no such pair.
    expect(third(0)).toBeGreaterThan(100)
    const diode = theLab.render(tone(), { ringMix: 1, wave: 3 })
    expectWritten(gainToDb(rms(tap(diode, 'in')) / rms(tap(diode, 'ring'))), '1 dB')
  })

  it('a slow carrier is a gain and no louder than the sound: at 2 Hz the largest sample comes out 0.0 dB over the largest that went in, at 100 Hz 4.6 dB over (claim ring-slow)', async () => {
    const theLab = await lab(NAME)
    const over = (frequency: number) =>
      gainToDb(peak(tap(theLab.render(tone(), { frequency }), 'ring')) / TONE_PEAK)
    expectWritten(over(2), '0.0 dB')
    expectWritten(over(100), '4.6 dB')
  })

  it('Low Cut takes out a difference tone: one at 10 Hz comes out 12.3 dB lower than it was made with Low Cut at 20 Hz, and 47 dB lower with it at 150 Hz (claim ring-low-cut)', async () => {
    const theLab = await lab(NAME)
    // A tone at 110 Hz against a carrier at 100 Hz: the difference is 10 Hz, the sum 210 Hz.
    const taken = (lowCut: number) => {
      const result = theLab.render(tone(110), { ringMix: 1, lowCut })
      return lineDb(tap(result, 'product'), 10) - lineDb(tap(result, 'ring'), 10)
    }
    expectWritten(taken(20), '12.3 dB')
    expectWritten(taken(150), '47 dB')
  })

  it('Ring Mix is equal power: at 0.5 the tone is 3.0 dB under what went in, the two new tones 6.0 dB under, and the whole less than 0.001 dB from the level it went in (claim ring-mix)', async () => {
    const theLab = await lab(NAME)
    const result = theLab.render(tone(), {})
    const out = tap(result, 'ring')
    expectWritten(under(out, 440), '3.0 dB')
    expectWritten(under(out, 340), '6.0 dB')
    expectWritten(under(out, 540), '6.0 dB')
    expectWritten(Math.abs(gainToDb(rms(out) / rms(tap(result, 'in')))), 'less than 0.001 dB')
  })

  it('at Width 1 the two sides are a quarter of a cycle apart: as loud as each other, and 3.0 dB quieter summed to one speaker (claim ring-width)', async () => {
    const theLab = await lab(NAME)
    const result = theLab.render(tone(), { ringMix: 1, width: 1 })
    const left = rms(tap(result, 'ring', 0))
    const right = rms(tap(result, 'ring', 1))
    expect(Math.abs(gainToDb(left / right))).toBeLessThan(0.01)
    expectWritten(gainToDb(left / rms(mono(result, 'ring'))), '3.0 dB')
    // At Width 0 the two sides are the same, and summing them changes nothing.
    const narrow = theLab.render(tone(), { ringMix: 1 })
    expect(
      matchesWritten(gainToDb(rms(tap(narrow, 'ring')) / rms(mono(narrow, 'ring'))), '3.0 dB'),
    ).toBe(false)
  })

  it('Second on Octave adds a pair at 240 Hz and 640 Hz, 2.5 dB under the first pair (claim ring-second)', async () => {
    const theLab = await lab(NAME)
    const result = theLab.render(tone(), { ringMix: 1, second: 2 })
    const out = tap(result, 'ring')
    // The two gains' squares add up to 1: the level holds.
    expect(Math.abs(gainToDb(rms(out) / rms(tap(result, 'in'))))).toBeLessThan(0.01)
    expectWritten(loudestHz(out, 200, 280).hz, '240 Hz')
    expectWritten(loudestHz(out, 600, 680).hz, '640 Hz')
    expectWritten(lineDb(out, 340) - lineDb(out, 240), '2.5 dB')
    expectWritten(lineDb(out, 540) - lineDb(out, 640), '2.5 dB')
    // With Second off there is nothing there.
    const one = tap(theLab.render(tone(), { ringMix: 1 }), 'ring')
    expect(lineDb(one, 340) - lineDb(one, 240)).toBeGreaterThan(100)
  })

  it('with Ring Drift at 1 the carrier wanders between 97.8 Hz and 100.34 Hz over a loop with no silence in it (claim drift-range)', async () => {
    const theLab = await lab(NAME)
    const wandered = range(tap(theLab.render(tone(), { ringDrift: 1 }), 'carrierHz'))
    expectWritten(wandered.lo, '97.8 Hz')
    expectWritten(wandered.hi, '100.34 Hz')
    // The same on a loop of music: the wander does not listen to the sound.
    const onChords = range(
      tap(theLab.render(await benchSource('chords', LOOP), { ringDrift: 1 }), 'carrierHz'),
    )
    expectWritten(onChords.lo, '97.8 Hz')
    expectWritten(onChords.hi, '100.34 Hz')
  })

  it('reads both devices rightly: each worked out again reads −140 dB from what the device wrote, the floor of the reading, in every mode, with every wave, on every loop (claim rebuilt-same)', async () => {
    const theLab = await lab(NAME)
    // The two devices do not hear each other, so one render tries a setting of each.
    const tremolos: Record<string, number>[] = [
      {},
      { mode: 1, shape: 1, depth: 0.8, drift: 1 },
      { mode: 2, shape: 2, rate: 7, crossover: 300, smooth: 0.5, phase: 120 },
      { mode: 3, shape: 3, rate: 0.5, mix: 0.6 },
      {},
      {},
    ]
    const rings: Record<string, number>[] = [
      {},
      { wave: 1, second: 1, width: 1, ringMix: 1, lowCut: 200, tone: 4000 },
      { wave: 2, second: 3, frequency: 3000, ringDrift: 1 },
      { wave: 3, frequency: 250, ringMix: 0.8, width: 0.4 },
      { wave: 3, second: 2, frequency: 2, width: 1, ringMix: 0.7 },
      { frequency: 9, second: 2, width: 0.6 },
    ]
    const tried = tremolos.map((values, index) => ({ ...values, ...rings[index] }))
    for (const id of [
      'chords',
      'pad',
      'guitar',
      'bass',
      'drums',
      'mix',
      'sine',
      'saw',
      'noise',
      'clicks',
    ]) {
      const source = await benchSource(id, LOOP)
      for (const values of tried) {
        const { tremoloRebuilt, ringRebuilt } = theLab.render(source, values).checks
        expectWritten(tremoloRebuilt!, '−140 dB')
        expectWritten(ringRebuilt!, '−140 dB')
      }
    }
  })

  // ---------------------------------------------------------------------------------------
  // Part 6: ways to use it.

  /**
   * How far the level of a sound moves against the level of what went in: both measured in
   * windows of 20 ms across the loop, each window where something sounds, as the most of
   * out over in less the least, in dB. `side` is 0 or 1, or both sides together when left out.
   */
  function travel(result: RenderResult, id: string, side?: number): number {
    const window = seconds(0.02)
    const power = (name: string, from: number) => {
      const sides = side === undefined ? [0, 1] : [side]
      let sum = 0
      for (const c of sides) sum += rms(tap(result, name, c), from, from + window) ** 2
      return sum / sides.length
    }
    let lo = Infinity
    let hi = -Infinity
    for (let from = 0; from + window <= LOOP; from += window) {
      const went = power('in', from)
      if (went < 1e-6) continue
      const ratio = 10 * Math.log10(Math.max(power(id, from), 1e-12) / went)
      lo = Math.min(lo, ratio)
      hi = Math.max(hi, ratio)
    }
    return hi - lo
  }

  it('in time with the bar: at 4 Hz the gain dips 16 times in the 4 s of the loop, twice a beat (claim way-intime)', async () => {
    const theLab = await lab(NAME)
    const gain = tap(await played(theLab, 'intime'), 'gain')
    const middle = 0.5 * (range(gain).lo + range(gain).hi)
    let dips = 0
    for (let k = 0; k < gain.length; k += 1) {
      const before = gain[(k + gain.length - 1) % gain.length]!
      if (before >= middle && gain[k]! < middle) dips += 1
    }
    expectWritten(dips, '16')
    expectWritten(gain.length / POINT_RATE, '4 s')
  })

  it('Harmonic moves the tone more than the level: on the pad the level travels 6.3 dB, where Tremolo at the same settings travels 15.9 dB (claim way-shimmer)', async () => {
    const theLab = await lab(NAME)
    expectWritten(travel(await played(theLab, 'shimmer'), 'tremolo'), '6.3 dB')
    expectWritten(travel(await played(theLab, 'shimmer', { mode: 0 }), 'tremolo'), '15.9 dB')
  })

  it('Pan moves a line from side to side: each side travels 15.2 dB while the two together travel less than 0.001 dB (claim way-pan)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'pan')
    expectWritten(travel(result, 'tremolo', 0), '15.2 dB')
    expectWritten(travel(result, 'tremolo', 1), '15.2 dB')
    expectWritten(travel(result, 'tremolo'), 'less than 0.001 dB')
  })

  it('a little of the ringing sound over a pad leaves its level less than 0.1 dB from where it was (claim way-halo)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'halo')
    expectWritten(Math.abs(levelOf(result, 'ring') - levelOf(result, 'in')), 'less than 0.1 dB')
    // And the pad is still in it: what comes out is not the ringing sound alone.
    expect(tap(result, 'ring').some((value, i) => value !== tap(result, 'wet')[i])).toBe(true)
  })

  it('a slow carrier at full Width is a pan: each side travels 30 dB while the two together travel 2.1 dB (claim way-sides)', async () => {
    const theLab = await lab(NAME)
    const result = await played(theLab, 'sides')
    expectWritten(travel(result, 'ring', 0), '30 dB')
    expectWritten(travel(result, 'ring', 1), '30 dB')
    expectWritten(travel(result, 'ring'), '2.1 dB')
    expectWritten(Math.abs(levelOf(result, 'ring') - levelOf(result, 'in')), 'less than 0.1 dB')
  })

  // ---------------------------------------------------------------------------------------
  // Part 7: what goes wrong.

  it('a square at 20 Hz is a buzz: beside a tone at 440 Hz it puts lines at 420 Hz and 460 Hz, between 4.0 dB and 4.1 dB under it, and at 380 Hz and 500 Hz, between 14.6 dB and 14.7 dB under it (claim fault-buzz)', async () => {
    const theLab = await lab(NAME)
    const { values } = resolveSet(theLab.description, settings.sets.buzz!)
    const out = tap(theLab.render(tone(), values), 'tremolo')
    for (const hz of [420, 460]) {
      expectWritten(lineDb(out, 440) - lineDb(out, hz), 'more than 4.0 dB')
      expectWritten(lineDb(out, 440) - lineDb(out, hz), 'less than 4.1 dB')
    }
    for (const hz of [380, 500]) {
      expectWritten(lineDb(out, 440) - lineDb(out, hz), 'more than 14.6 dB')
      expectWritten(lineDb(out, 440) - lineDb(out, hz), 'less than 14.7 dB')
    }
    // With Shape on Sine at the same Rate there is one pair of lines and no more.
    const sine = tap(theLab.render(tone(), { ...values, shape: 0 }), 'tremolo')
    expect(lineDb(sine, 440) - lineDb(sine, 420)).toBeLessThan(7)
    for (const hz of [400, 380, 480, 500]) {
      expect(lineDb(sine, 440) - lineDb(sine, hz)).toBeGreaterThan(100)
    }
  })

  it('the Ring at Ring Mix 0.5 stands the peaks of the mix 3.8 dB taller while its level moves less than 0.5 dB (claim fault-peaks)', async () => {
    const theLab = await lab(NAME)
    const result = theLab.render(await benchSource('mix', LOOP), {})
    const tallest = (id: string) => Math.max(peak(tap(result, id, 0)), peak(tap(result, id, 1)))
    expectWritten(gainToDb(tallest('ring') / tallest('in')), '3.8 dB')
    expectWritten(Math.abs(levelOf(result, 'ring') - levelOf(result, 'in')), 'less than 0.5 dB')
  })

  it('at Stereo Phase 180 the tremolo is gone from one speaker: summed, the lines beside the tone are more than 100 dB under it and the tone is 6.0 dB down (claim fault-mono)', async () => {
    const theLab = await lab(NAME)
    const result = theLab.render(tone(), { rate: 5, phase: 180 })
    const summed = mono(result, 'tremolo')
    expectWritten(lineDb(summed, 440) - lineDb(summed, 435), 'more than 100 dB')
    expectWritten(lineDb(summed, 440) - lineDb(summed, 445), 'more than 100 dB')
    expectWritten(under(summed, 440), '6.0 dB')
    // On either side by itself the lines are there.
    expect(lineDb(tap(result, 'tremolo'), 440) - lineDb(tap(result, 'tremolo'), 435)).toBeLessThan(
      7,
    )
  })

  it('the Tremolo oscillator stands still in a silence: on single clicks a second apart it turns for 10 % of the loop (claim fault-sleep)', async () => {
    const theLab = await lab(NAME)
    const clicks = await benchSource('clicks', LOOP)
    const phase = tap(theLab.render(clicks, {}), 'lfoPhase')
    let moved = 0
    for (let k = 1; k < phase.length; k += 1) if (phase[k] !== phase[k - 1]) moved += 1
    expectWritten((100 * moved) / phase.length, '10 %')
    // On a loop with no silence in it, it turns all the time.
    const turning = tap(theLab.render(tone(), {}), 'lfoPhase')
    let still = 0
    for (let k = 1; k < turning.length; k += 1) if (turning[k] === turning[k - 1]) still += 1
    expect(still).toBe(0)
    // The Ring on the same clicks rests too, and catches up: each click comes out as large as
    // a carrier that never stopped would make it. The carrier starts on its crest, a quarter
    // of a cycle in (ring.h), and the kept pass of the loop is the second.
    const hz = 100.3
    const rung = tap(theLab.render(clicks, { frequency: hz, ringMix: 1 }), 'ring')
    const free = (n: number) => Math.sin(2 * Math.PI * (0.25 + (hz * (LOOP + n)) / RATE))
    for (const n of [seconds(2), seconds(3)]) {
      expect(rung[n]! / rung[seconds(1)]!).toBeCloseTo(free(n) / free(seconds(1)), 3)
    }
  })

  // ---------------------------------------------------------------------------------------
  // The settings file.

  it('renders every named set on its own source: its sound is finite, sounds, and both devices worked out again agree with themselves', async () => {
    const theLab = await lab(NAME)
    for (const [name, set] of Object.entries(settings.sets)) {
      const { tap: sound } = resolveSet(theLab.description, set)
      const result = await played(theLab, name)
      const data = tap(result, sound!)
      expect(
        data.every((value) => Number.isFinite(value)),
        `${name} is finite`,
      ).toBe(true)
      expect(rms(data), `${name} sounds`).toBeGreaterThan(0.001)
      expect(result.checks.tremoloRebuilt, `${name}: the Tremolo read rightly`).toBeLessThan(-120)
      expect(result.checks.ringRebuilt, `${name}: the Ring read rightly`).toBeLessThan(-120)
    }
  })

  it("plays the bell card at the Ring's own defaults: the set's values are device.json's, with the carrier on the note the device starts on", async () => {
    const theLab = await lab(NAME)
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/ring/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const own = Object.fromEntries(device.params.map((one) => [one.key, one.default]))
    const { values } = resolveSet(theLab.description, settings.sets.bell!)
    // The lab calls two of the Ring's controls by other ids, beside the Tremolo's of the same name.
    const ids: Record<string, string> = { ringDrift: 'drift', ringMix: 'mix' }
    for (const id of ['wave', 'second', 'ringDrift', 'lowCut', 'tone', 'width', 'ringMix']) {
      expect(values[id], id).toBe(own[ids[id] ?? id])
    }
    // The device starts on a note, root 0 in octave 4: middle C, by the formula of its header.
    const note = 440 * 2 ** ((12 * (own.octave! + 1) + own.root! - 69) / 12)
    expect(values.frequency).toBeCloseTo(note, 2)
  })

  it("starts the page's device table from the Tremolo's own defaults: the settings file's defaults, laid over the lab's starting values, are device.json's", async () => {
    const theLab = await lab(NAME)
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/tremolo/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const { values } = resolveSet(theLab.description, { values: settings.defaults!.values })
    // The lab has the Tremolo's nine parameters by the device's own ids, and the Ring's beside them.
    for (const one of device.params) expect(values[one.key], one.key).toBe(one.default)
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(settings.defaults!.values)) {
      expect(
        device.params.some((one) => one.key === id),
        id,
      ).toBe(true)
      expect(theLab.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
  })
})
