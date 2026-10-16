import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
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
  points,
  range,
  RATE,
  rms,
  seconds,
  silence,
  sine,
} from './support.ts'

const NAME = 'frequency-shifting'

/**
 * One frequency in `x`, under a Hann window: its level in dB (a full-scale sine reads 0) and
 * its phase in degrees, as the phase of a cosine.
 */
function tone(x: Float32Array, hz: number) {
  const n = x.length
  const window = hann(n)
  // A unit vector turned once a sample, in place of a cosine and a sine for every sample.
  const cw = Math.cos((2 * Math.PI * hz) / RATE)
  const sw = Math.sin((2 * Math.PI * hz) / RATE)
  let c = 1
  let s = 0
  let re = 0
  let im = 0
  for (let i = 0; i < n; i += 1) {
    const v = window[i]! * x[i]!
    re += v * c
    im -= v * s
    const next = c * cw - s * sw
    s = s * cw + c * sw
    c = next
  }
  // The window's values add up to half its length.
  const size = (2 * Math.hypot(re, im)) / (n / 2)
  return {
    db: 20 * Math.log10(Math.max(size, 1e-12)),
    degrees: (Math.atan2(im, re) * 180) / Math.PI,
  }
}

const windows = new Map<number, Float64Array>()
function hann(n: number): Float64Array {
  let window = windows.get(n)
  if (!window) {
    window = new Float64Array(n)
    for (let i = 0; i < n; i += 1) window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * (i + 0.5)) / n)
    windows.set(n, window)
  }
  return window
}

/**
 * The frequency from `lo` to `hi` hertz at which the first second of `x` is strongest, to
 * `step` hertz: looked for two steps at a time, then one step at a time about the best.
 */
function strongest(x: Float32Array, lo: number, hi: number, step = 1): number {
  const second = x.subarray(0, Math.min(x.length, RATE))
  let best = lo
  let top = -Infinity
  const look = (hz: number) => {
    const { db } = tone(second, hz)
    if (db > top) {
      top = db
      best = hz
    }
  }
  for (let hz = lo; hz <= hi; hz += 2 * step) look(hz)
  const near = best
  for (const hz of [near - step, near + step]) if (hz >= lo && hz <= hi) look(hz)
  return best
}

/** An angle brought between −180° and 180°. */
const turn = (degrees: number) => ((((degrees + 180) % 360) + 360) % 360) - 180

/** Where a frequency sent below zero or past half the sample rate comes out, in hertz. */
const folded = (hz: number) => (Math.abs(hz) > RATE / 2 ? RATE - Math.abs(hz) : Math.abs(hz))

/**
 * How far under the kept sideband the cancelled one is left, in dB, by a pair that is `degrees`
 * from a quarter turn: the tangent of half the angle, as the lesson's stage 3 gives it.
 */
const leak = (degrees: number) => -20 * Math.log10(Math.tan((Math.abs(degrees) * Math.PI) / 360))

/**
 * Crests of the pair's ripple, in hertz, from the bottom of the band to the top: worked out from
 * the kit's eight coefficients, apart from the lab.
 */
const CRESTS = [30.2, 61.9, 329.9, 1805, 8838, 15_162, 23_938.1]

/** A curve tap whose points stand in even ratios, read at a frequency. */
function curveAt(tap: { channels_data: Float32Array[]; x0: number; x1: number }, hz: number) {
  const ys = tap.channels_data[0]!
  const place = (Math.log(hz / tap.x0) / Math.log(tap.x1 / tap.x0)) * (ys.length - 1)
  const p = Math.min(ys.length - 2, Math.max(0, Math.floor(place)))
  return ys[p]! + (ys[p + 1]! - ys[p]!) * (place - p)
}

/** The largest sample in each stretch of `width` samples, every `hop`: a wave's outline. */
function outline(x: Float32Array, width: number, hop: number): { at: number; top: number }[] {
  const out = []
  for (let k = 0; k + width <= x.length; k += hop) {
    out.push({ at: (k + width / 2) / RATE, top: peak(x.subarray(k, k + width)) })
  }
  return out
}

/** When, in seconds, the outline of `x` is at its lowest. */
function lowestAt(x: Float32Array, width: number): number {
  return outline(x, width, 8).reduce((a, b) => (b.top < a.top ? b : a)).at
}

/** How much the lab's own spectrum of a tap of its last render holds from `lo` to `hi` hertz, in dB. */
function band(shifter: Lab, tap: string, lo: number, hi: number): number {
  const spectrum = shifter.spectrum(tap)
  let sum = 0
  for (let k = 0; k < spectrum.length; k += 1) {
    const hz = (k * RATE) / 4096
    if (hz >= lo && hz < hi) sum += 10 ** (spectrum[k]! / 10)
  }
  return 10 * Math.log10(Math.max(sum, 1e-20))
}

const first = (result: RenderResult, id: string) => result.taps[id]!.channels_data[0]!

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings(NAME)!

/** A named set as its card plays it: on its own source, with `over` laid on its values. */
async function played(shifter: Lab, name: string, over: Record<string, number> = {}) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(shifter.description, set)
  return shifter.render(await benchSource(source!, seconds(4)), { ...values, ...over })
}

/** The step of the build path at which each piece first runs. */
const STEP = { wire: 0, pair: 1, carrier: 2, sideBand: 3, feedback: 4, mix: 5 }

describe('frequency shifting', () => {
  it('is a sound lab on the saw: every tap says something, loops, and answers to every control', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('saw', seconds(4))
    const result = shifter.render(source, {})
    // With the LFO's depth at zero the shift in force is one flat value.
    expectSoundLab(shifter, source, result, { quiet: ['shiftNow'] })
  })

  it('has a build part: six steps, each changing a built tap and none the main path, the last held to the device', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('saw', seconds(4))
    // Feedback, Mix and Width start where their pieces do nothing to the sound.
    expectBuild(shifter, source, { feedback: 0.5, mix: 0.5, width: 0.5 })
  })

  // ---- Part 1: the note, and the three ways of moving its partials ------------------------

  it("finds the saw's first four partials at 110, 220, 330 and 440 Hz (claim saw-in)", async () => {
    const saw = await benchSource('saw', seconds(4))
    for (const hz of [110, 220, 330]) expect(strongest(saw.left, hz - 40, hz + 40)).toBe(hz)
    expectWritten(strongest(saw.left, 400, 480), '440 Hz')
  })

  it('played faster by the ratio that takes 110 Hz to 160 Hz, puts the four partials at 160, 320, 480 and 640 Hz, each at the level it had (claim pitched-lines)', async () => {
    const shifter = await lab(NAME)
    const saw = await benchSource('saw', seconds(4))
    const pitched = first(await played(shifter, 'faster'), 'pitched')
    for (const k of [1, 2, 3]) expect(strongest(pitched, 160 * k - 30, 160 * k + 30)).toBe(160 * k)
    expectWritten(strongest(pitched, 610, 670), '640 Hz')
    for (const k of [1, 2, 3, 4]) {
      expect(Math.abs(tone(pitched, 160 * k).db - tone(saw.left, 110 * k).db)).toBeLessThan(0.01)
    }
  })

  it("times a cosine at 50 Hz, splits the saw's lowest partial into lines at 60 Hz and 160 Hz, each 6.0 dB under it (claim ring-saw)", async () => {
    const shifter = await lab(NAME)
    const saw = await benchSource('saw', seconds(4))
    const ring = first(await played(shifter, 'ringed'), 'ring')
    const went = tone(saw.left, 110).db
    expectWritten(strongest(ring, 30, 100), '60 Hz')
    expectWritten(strongest(ring, 130, 165), '160 Hz')
    expectWritten(went - tone(ring, 60).db, '6.0 dB')
    expectWritten(went - tone(ring, 160).db, '6.0 dB')
    // And the line itself is gone.
    expect(went - tone(ring, 110).db).toBeGreaterThan(90)
  })

  it("with Shift at 50 Hz, moves the saw's partials from 110, 220, 330 and 440 Hz to 160, 270, 380 and 490 Hz, each at its own level (claim saw-partials)", async () => {
    const shifter = await lab(NAME)
    const saw = await benchSource('saw', seconds(4))
    const out = first(await played(shifter, 'shifted'), 'out')
    for (const partial of [110, 220, 330]) {
      expect(strongest(out, partial + 20, partial + 80)).toBe(partial + 50)
    }
    expectWritten(strongest(out, 460, 520), '490 Hz')
    for (const partial of [110, 220, 330, 440]) {
      expect(Math.abs(tone(out, partial + 50).db - tone(saw.left, partial).db)).toBeLessThan(0.01)
    }
  })

  it('shifted by its own 110 Hz, the saw has lines at 220, 330 and 440 Hz, each at the level of the partial below, and what is left at 110 Hz is more than 70 dB under the line at 220 Hz (claim whole-note)', async () => {
    const shifter = await lab(NAME)
    const saw = await benchSource('saw', seconds(4))
    const whole = first(await played(shifter, 'whole'), 'out')
    expect(strongest(whole, 180, 260)).toBe(220)
    expect(strongest(whole, 290, 370)).toBe(330)
    expectWritten(strongest(whole, 400, 480), '440 Hz')
    for (const hz of [220, 330, 440]) {
      expect(Math.abs(tone(whole, hz).db - tone(saw.left, hz - 110).db)).toBeLessThan(0.05)
    }
    expectWritten(tone(whole, 220).db - tone(whole, 110).db, 'more than 70 dB')
  })

  // ---- Part 2: the ruler -----------------------------------------------------------------

  it("at the starting settings puts the saw's first four lines at 210, 320, 430 and 540 Hz on the ruler, and the lines of the faster copy at 210, 420 and 630 Hz (claim ruler-reads)", async () => {
    const shifter = await lab(NAME)
    const saw = await benchSource('saw', seconds(4))
    const result = shifter.render(saw, {})
    const out = first(result, 'out')
    for (const hz of [210, 320, 430]) expect(strongest(out, hz - 30, hz + 30)).toBe(hz)
    expectWritten(strongest(out, 510, 570), '540 Hz')
    const pitched = first(result, 'pitched')
    for (const hz of [210, 420]) expect(strongest(pitched, hz - 30, hz + 30)).toBe(hz)
    expectWritten(strongest(pitched, 600, 660), '630 Hz')
    // The ruler's own points: its tallest point within 30 Hz of each line is within one point of it.
    const ruler = result.taps.rulerOut!
    const ys = ruler.channels_data[0]!
    const step = (ruler.x1 - ruler.x0) / (ys.length - 1)
    for (const hz of [210, 320, 430, 540]) {
      let best = Math.round((hz - 30) / step)
      for (let p = best; p <= Math.round((hz + 30) / step); p += 1) if (ys[p]! > ys[best]!) best = p
      expect(Math.abs(best * step - hz)).toBeLessThanOrEqual(step)
    }
  })

  // ---- Part 4: the build, a piece at a time ----------------------------------------------

  it('with the pair in, runs the first copy of a 440 Hz sine 78.5° behind it and the second 0.34° short of a quarter turn ahead of the first, each less than 0.001 dB from the level of the sine; without the pair there is no second copy and the first is the sine (claim build-pair)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const went = tone(source.left, 440)
    const measure = (build: number) => {
      const taps = shifter.render(source, { build }).taps
      const one = tone(taps.built!.channels_data[0]!, 440)
      const two = tone(taps.builtQuadrature!.channels_data[0]!, 440)
      return {
        behind: -turn(one.degrees - went.degrees),
        ahead: turn(two.degrees - one.degrees),
        first: Math.abs(one.db - went.db),
        second: Math.abs(two.db - went.db),
      }
    }
    const withPair = measure(STEP.pair)
    expectWritten(withPair.behind, '78.5°')
    expectWritten(90 - withPair.ahead, '0.34°')
    expectWritten(withPair.first, 'less than 0.001 dB')
    expectWritten(withPair.second, 'less than 0.001 dB')
    const without = measure(STEP.wire)
    expect(matchesWritten(without.behind, '78.5°')).toBe(false)
    expect(matchesWritten(without.second, 'less than 0.001 dB')).toBe(false)
    // The first copy is then the sine itself, and the second copy's tap holds nothing.
    const wire = shifter.render(source, { build: STEP.wire })
    const through = first(wire, 'in')
    expect(first(wire, 'built').every((v, k) => v === through[k])).toBe(true)
    expect(peak(first(wire, 'builtQuadrature'))).toBe(0)
  })

  it('with the carrier in and Shift at 100 Hz, turns the 440 Hz sine into lines at 340 Hz and 540 Hz, each 6.0 dB under it; without the carrier there is nothing at either (claim build-carrier)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const went = tone(source.left, 440).db
    const under = (build: number, hz: number) =>
      went - tone(shifter.render(source, { build }).taps.built!.channels_data[0]!, hz).db
    const built = shifter.render(source, { build: STEP.carrier }).taps.built!.channels_data[0]!
    expectWritten(strongest(built, 250, 430), '340 Hz')
    expectWritten(strongest(built, 450, 650), '540 Hz')
    for (const hz of [340, 540]) {
      expectWritten(under(STEP.carrier, hz), '6.0 dB')
      expect(matchesWritten(under(STEP.pair, hz), '6.0 dB')).toBe(false)
    }
    // The tone itself is gone from the product.
    expect(under(STEP.carrier, 440)).toBeGreaterThan(120)
  })

  it('with the two products added and Shift at 100 Hz, leaves the line of the 440 Hz sine at 340 Hz 50.5 dB under its line at 540 Hz, which stands 0.0 dB from the sine; with one product alone the two lines are level (claim build-sideband)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const went = tone(source.left, 440).db
    const lines = (build: number) => {
      const built = shifter.render(source, { build }).taps.built!.channels_data[0]!
      return { apart: tone(built, 540).db - tone(built, 340).db, kept: tone(built, 540).db - went }
    }
    const added = lines(STEP.sideBand)
    expectWritten(added.apart, '50.5 dB')
    expectWritten(added.kept, '0.0 dB')
    const one = lines(STEP.carrier)
    expect(matchesWritten(one.apart, '50.5 dB')).toBe(false)
    expect(matchesWritten(one.kept, '0.0 dB')).toBe(false)
    // Level: one product alone holds both sidebands at one height.
    expect(Math.abs(one.apart)).toBeLessThan(0.01)
  })

  it('with the feedback path in and Feedback at 0.5, adds to the 440 Hz sine shifted by 100 Hz a line at 640 Hz, 6.06 dB under the line at 540 Hz; without the path there is nothing at 640 Hz (claim build-feedback)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const under = (build: number) => {
      const built = shifter.render(source, { build, feedback: 0.5 }).taps.built!.channels_data[0]!
      return tone(built, 540).db - tone(built, 640).db
    }
    expectWritten(under(STEP.feedback), '6.06 dB')
    expect(matchesWritten(under(STEP.sideBand), '6.06 dB')).toBe(false)
    expect(under(STEP.sideBand)).toBeGreaterThan(120)
  })

  it('with the mix in and Mix at 0.5, brings the 440 Hz sine back at 440 Hz, 3.0 dB under what went in, beside the shifted line at 540 Hz, 3.0 dB under too; without the mix there is nothing at 440 Hz (claim build-mix)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const went = tone(source.left, 440).db
    const under = (build: number, hz: number) =>
      went - tone(shifter.render(source, { build, mix: 0.5 }).taps.built!.channels_data[0]!, hz).db
    expectWritten(under(STEP.mix, 440), '3.0 dB')
    expectWritten(under(STEP.mix, 540), '3.0 dB')
    expect(matchesWritten(under(STEP.feedback, 440), '3.0 dB')).toBe(false)
    expect(matchesWritten(under(STEP.feedback, 540), '3.0 dB')).toBe(false)
  })

  it("with all six pieces is the device's own output, sample for sample, and the reading is −140 dB, the floor of the measure, on every loop, in every mode and with every control turned (claim build-same)", async () => {
    const shifter = await lab(NAME)
    const tried: Record<string, number>[] = [
      {},
      { mode: 1 },
      { mode: 2, width: 1 },
      { mode: 3, shift: 0, feedback: 0.98 },
      { shift: 0, fine: 1.5, feedback: 0.85, delay: 12, tone: 7000, width: 1, mix: 0.5 },
      { feedback: 0.98, lfoDepth: 1, lfoRate: 3, width: 0.6, mix: 0.5, delay: 500, tone: 200 },
    ]
    for (const id of ['saw', 'sine', 'chords', 'guitar', 'pad', 'drums', 'bass', 'mix', 'noise']) {
      const source = await benchSource(id, seconds(4))
      for (const values of tried) {
        // The reading is of the whole build, whichever step the page shows.
        const { checks } = shifter.render(source, { ...values, build: STEP.wire })
        expectWritten(checks.builtDifference!, 'at most −140 dB')
        // At the last step the built taps hold the whole build: no sample of it differs.
        const { taps } = shifter.render(source, { ...values, build: STEP.mix })
        for (const side of [0, 1]) {
          const made = taps.out!.channels_data[side]!
          const built = taps.built!.channels_data[side]!
          expect(
            built.every((v, k) => v === made[k]),
            `${id}, ${JSON.stringify(values)}, side ${side}`,
          ).toBe(true)
        }
      }
    }
    // A sound with gaps longer than the device stays awake for: the build rests with it.
    const struck = shifter.render(click(seconds(4), 100), { feedback: 0.9, delay: 400 })
    expectWritten(struck.checks.builtDifference!, 'at most −140 dB')
    expect(peak(struck.taps.built!.channels_data[0]!)).toBeGreaterThan(0.5)
  })

  // ---- Part 5: the device, stage by stage -------------------------------------------------

  it('with a carrier at 100 Hz, splits the 440 Hz sine into lines at 340 Hz and 540 Hz, each 6.0 dB under it (claim ring-halves), and leaves what is at 440 Hz more than 120 dB down (claim ring-original-gone)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const ring = shifter.render(source, {}).taps.ring!.channels_data[0]!
    const went = tone(source.left, 440).db
    expect(strongest(ring, 250, 430)).toBe(340)
    expect(strongest(ring, 450, 650)).toBe(540)
    expectWritten(went - tone(ring, 340).db, '6.0 dB')
    expectWritten(went - tone(ring, 540).db, '6.0 dB')
    expectWritten(went - tone(ring, 440).db, 'more than 120 dB')
  })

  it('keeps the quadrature output a quarter turn ahead of the in-phase one, less than 0.71° out, from 22 Hz to 23,978 Hz (claim quarter-turn)', async () => {
    const shifter = await lab(NAME)
    // The lab's own search of the band, from the impulse responses of the kit's pair.
    const start = shifter.render(sine(1000, 0.5, seconds(0.5)), {})
    expectWritten(start.checks.quarterError!, 'less than 0.71°')
    expect(start.checks.quarterError).toBeGreaterThan(0.69)
    // The curve the page draws: every point of it inside the band.
    const curve = start.taps.phaseDifference!
    const ahead = curve.channels_data[0]!
    for (let p = 0; p < ahead.length; p += 1) {
      const hz = curve.x0 * Math.pow(curve.x1 / curve.x0, p / (ahead.length - 1))
      if (hz >= 22) expectWritten(Math.abs(ahead[p]! - 90), 'less than 0.71°')
    }
    // And the device's own pair as it runs, with a sine at the band's ends, between two crests
    // and at the ripple's crests: the crests are one height, to the last digit written.
    const apart = (hz: number) => {
      const taps = shifter.render(sine(hz, 0.5, seconds(2)), {}).taps
      const i = tone(taps.inPhase!.channels_data[0]!, hz).degrees
      const q = tone(taps.quadrature!.channels_data[0]!, hz).degrees
      return Math.abs(turn(q - i) - 90)
    }
    for (const hz of [22, 1000, 23_978]) expect(apart(hz), `at ${hz} Hz`).toBeLessThan(0.71)
    for (const hz of CRESTS) {
      expect(apart(hz), `at ${hz} Hz`).toBeLessThan(0.71)
      expect(apart(hz), `at ${hz} Hz`).toBeGreaterThan(0.7)
    }
  })

  it('is more than 1.6° from a quarter turn at 20 Hz, and under 1.7° (claim below-band), where a 20 Hz sine shifted by 100 Hz leaves the cancelled copy only 37 dB down (claim image-20)', async () => {
    const shifter = await lab(NAME)
    const taps = shifter.render(sine(20, 0.5, seconds(4)), { shift: 100 }).taps
    const i = tone(taps.inPhase!.channels_data[0]!, 20).degrees
    const q = tone(taps.quadrature!.channels_data[0]!, 20).degrees
    expectWritten(Math.abs(turn(q - i) - 90), 'more than 1.6°')
    expect(Math.abs(turn(q - i) - 90)).toBeLessThan(1.7)
    const out = taps.out!.channels_data[0]!
    expectWritten(tone(out, 120).db - tone(out, 80).db, '37 dB')
  })

  it('runs the in-phase output a turn and 78.5° behind the input at 440 Hz (claim lag-440)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const taps = shifter.render(source, {}).taps
    const behind = turn(
      tone(taps.inPhase!.channels_data[0]!, 440).degrees - tone(source.left, 440).degrees,
    )
    expectWritten(-behind, '78.5°')
    // The whole turn is in the curve, which follows the phase down from 5 Hz without a jump.
    expect(Math.abs(curveAt(taps.phaseI!, 440) - (behind - 360))).toBeLessThan(1)
  })

  it("passes each of the saw's first twenty harmonics through both chains less than 0.001 dB from the level it went in at (claim same-level)", async () => {
    const shifter = await lab(NAME)
    const saw = await benchSource('saw', seconds(4))
    const taps = shifter.render(saw, {}).taps
    for (let k = 1; k <= 20; k += 1) {
      const went = tone(saw.left, 110 * k).db
      const one = tone(taps.inPhase!.channels_data[0]!, 110 * k).db
      const two = tone(taps.quadrature!.channels_data[0]!, 110 * k).db
      expectWritten(Math.abs(one - went), 'less than 0.001 dB')
      expectWritten(Math.abs(two - went), 'less than 0.001 dB')
    }
  })

  it('with Width at 1 and Mode on Up brings sines at 110 Hz, 1 kHz and 5 kHz, each shifted by 100 Hz, out 90.0° ahead on the right (claim width-quarter)', async () => {
    const shifter = await lab(NAME)
    for (const hz of [110, 1000, 5000]) {
      const out = shifter.render(sine(hz, 0.5, seconds(2)), { width: 1 }).taps.out!
      const left = tone(out.channels_data[0]!, hz + 100)
      const right = tone(out.channels_data[1]!, hz + 100)
      expectWritten(turn(right.degrees - left.degrees), '90.0°')
      expect(right.db - left.db).toBeCloseTo(0, 3)
    }
    // Half the width is half the turn.
    const half = shifter.render(sine(1000, 0.5, seconds(2)), { width: 0.5 }).taps.out!
    const ahead =
      tone(half.channels_data[1]!, 1100).degrees - tone(half.channels_data[0]!, 1100).degrees
    expect(turn(ahead)).toBeCloseTo(45, 1)
  })

  it('with Width at 1, a shift of 1 Hz and Mix at 0.5, brings the quiet moment of the right side 0.25 s before that of the left; with Width at 0 they fall together (claim width-travels)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    // When, in each second of the loop, a side's level is lowest.
    const quiet = (level: Float32Array) =>
      [0, 1, 2, 3].map((second) => {
        let at = points(second)
        for (let k = at; k < points(second + 1); k += 1) if (level[k]! < level[at]!) at = k
        return at / POINT_RATE
      })
    const apart = (width: number) => {
      const taps = shifter.render(source, { shift: 0, fine: 1, mix: 0.5, width }).taps
      const left = quiet(taps.levelLeft!.channels_data[0]!)
      const right = quiet(taps.levelRight!.channels_data[0]!)
      return left.map((at, k) => at - right[k]!)
    }
    for (const gap of apart(1)) expectWritten(gap, '0.25 s')
    for (const gap of apart(0)) expect(matchesWritten(gap, '0.25 s')).toBe(false)
  })

  it("works the chosen sideband out again from the device's pair and carrier, at least 140 dB under it, the floor of the measure (claim rebuilt-exact)", async () => {
    const shifter = await lab(NAME)
    const chords = await benchSource('chords', seconds(4))
    const tried: Record<string, number>[] = [
      {},
      { mode: 1 },
      { mode: 2 },
      { mode: 3 },
      { shift: 0, fine: 1.5, feedback: 0.9, delay: 12, mix: 0.5 },
      { feedback: 0.98, lfoDepth: 1, width: 1 },
    ]
    for (const values of tried) {
      expectWritten(-shifter.render(chords, values).checks.rebuilt!, 'at least 140 dB')
    }
  })

  it('shifted by 100 Hz, moves a 1 kHz sine to 1.1 kHz, less than 0.01 dB from the level it went in at (claim shift-1k), with the copy at 900 Hz 49.0 dB below (claim image-1k)', async () => {
    const shifter = await lab(NAME)
    const source = sine(1000, 0.5, seconds(2))
    const out = shifter.render(source, { shift: 100 }).taps.out!.channels_data[0]!
    expectWritten(strongest(out, 800, 1300) / 1000, '1.1 kHz')
    expectWritten(Math.abs(tone(out, 1100).db - tone(source.left, 1000).db), 'less than 0.01 dB')
    expectWritten(tone(out, 1100).db - tone(out, 900).db, '49.0 dB')
  })

  it("leaves the cancelled copy of a sine at a crest of the ripple at least 44.2 dB under the kept one, shifted up by 100 Hz or down by 333 Hz, as the tangent of half the pair's error says (claim image-worst)", async () => {
    const shifter = await lab(NAME)
    for (const hz of CRESTS) {
      const found: number[] = []
      for (const shift of [100, -333]) {
        const taps = shifter.render(sine(hz, 0.5, seconds(4)), { shift }).taps
        const out = taps.out!.channels_data[0]!
        const image = tone(out, folded(hz + shift)).db - tone(out, folded(hz - shift)).db
        expectWritten(image, 'at least 44.2 dB')
        expect(image, `at ${hz} Hz, shifted ${shift} Hz`).toBeLessThan(44.3)
        // The formula, from the angle between the pair's two outputs at the frequency going in.
        const i = tone(taps.inPhase!.channels_data[0]!, hz).degrees
        const q = tone(taps.quadrature!.channels_data[0]!, hz).degrees
        expect(
          Math.abs(image - leak(turn(q - i) - 90)),
          `at ${hz} Hz, shifted ${shift} Hz`,
        ).toBeLessThan(0.05)
        found.push(image)
      }
      // The shift has no say in it.
      expect(Math.abs(found[0]! - found[1]!), `at ${hz} Hz`).toBeLessThan(0.05)
    }
  })

  it("fed the furthest from a quarter turn that the lab's search found, the formula gives at least 44.2 dB for a sine anywhere from 22 Hz to 23,978 Hz (claim image-band)", async () => {
    const shifter = await lab(NAME)
    const { checks } = shifter.render(sine(1000, 0.5, seconds(0.5)), {})
    expectWritten(leak(checks.quarterError!), 'at least 44.2 dB')
    expect(leak(checks.quarterError!)).toBeLessThan(44.3)
  })

  it('on a 1 kHz sine gives the same output for Down at +100 Hz as for Up at −100 Hz, the two more than 130 dB apart (claim down-is-negative)', async () => {
    const shifter = await lab(NAME)
    const source = sine(1000, 0.5, seconds(2))
    const down = shifter.render(source, { shift: 100, mode: 1 }).taps.out!.channels_data[0]!
    const negative = shifter.render(source, { shift: -100 }).taps.out!.channels_data[0]!
    expect(strongest(down, 800, 1300)).toBe(900)
    expectWritten(-differenceDb(down, negative), 'more than 130 dB')
  })

  it('in Stereo, shifted by 100 Hz, sends the 440 Hz sine out at 540 Hz on the left and 340 Hz on the right (claim stereo-split)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const out = shifter.render(source, { mode: 2 }).taps.out!
    expectWritten(strongest(out.channels_data[0]!, 250, 650), '540 Hz')
    expectWritten(strongest(out.channels_data[1]!, 250, 650), '340 Hz')
  })

  it('in Ring puts both sidebands of a 1 kHz sine out 3.0 dB under the input (claim ring-mode)', async () => {
    const shifter = await lab(NAME)
    const source = sine(1000, 0.5, seconds(2))
    const out = shifter.render(source, { shift: 100, mode: 3 }).taps.out!.channels_data[0]!
    const went = tone(source.left, 1000).db
    expectWritten(went - tone(out, 900).db, '3.0 dB')
    expectWritten(went - tone(out, 1100).db, '3.0 dB')
  })

  it('with Shift at 0, Fine at 1 Hz and Mix at 0.5, swells 3.0 dB over the sine (claim beat-crest) and dies more than 40 dB under it (claim beat-null), once a second (claim beat-rate)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const out = shifter.render(source, { shift: 0, fine: 1, mix: 0.5 }).taps.out!.channels_data[0]!
    // One cycle of 440 Hz is 109 samples.
    const shape = outline(out, 110, 10)
    const went = peak(source.left)
    const crest = Math.max(...shape.map((one) => one.top))
    const trough = Math.min(...shape.map((one) => one.top))
    expectWritten(gainToDb(crest / went), '3.0 dB')
    expectWritten(-gainToDb(trough / went), 'more than 40 dB')
    // The first instant of each stretch where the outline is under a hundredth of the input.
    const quiet = shape.filter((one) => one.top < went * 0.01).map((one) => one.at)
    const nulls = quiet.filter((at, k) => k === 0 || at - quiet[k - 1]! > 0.1)
    expect(nulls.length).toBe(4)
    for (let k = 1; k < nulls.length; k += 1) expect(nulls[k]! - nulls[k - 1]!).toBeCloseTo(1, 2)
  })

  it('at a shift of zero, mixed half and half, cancels a tone at 1,168 Hz by more than 60 dB (claim still-notch)', async () => {
    const shifter = await lab(NAME)
    const start = shifter.render(sine(1168, 0.5, seconds(2)), { shift: 0, mix: 0.5 })
    // The in-phase chain is a turn and a half behind there.
    expect(Math.abs(curveAt(start.taps.phaseI!, 1168) + 540)).toBeLessThan(1)
    const out = start.taps.out!.channels_data[0]!
    const went = start.taps.in!.channels_data[0]!
    expectWritten(-gainToDb(rms(out) / rms(went)), 'more than 60 dB')
  })

  it('at a shift of 0.5 Hz up, moves the notch from 1,168 Hz to 2 kHz in 0.3 s and to 4 kHz in 0.7 s (claim notch-climbs)', async () => {
    const shifter = await lab(NAME)
    const values = { shift: 0, fine: 0.5, mix: 0.5 }
    // When a tone is at its quietest in the two seconds, one beat, from `from`.
    const nullAt = (hz: number, over: Record<string, number>, from: number) => {
      const out = shifter.render(sine(hz, 0.25, seconds(4)), over).taps.out!.channels_data[0]!
      return from + lowestAt(out.subarray(from * RATE, (from + 2) * RATE), 48)
    }
    const start = nullAt(1168, values, 1)
    expect(start).toBeCloseTo(2, 2)
    expectWritten(nullAt(2000, values, 1.5) - start, '0.3 s')
    expectWritten(nullAt(4000, values, 1.5) - start, '0.7 s')
    // Down, the notch is at 2 kHz before it is at 1,168 Hz.
    const down = { ...values, mode: 1 }
    expectWritten(nullAt(1168, down, 1) - nullAt(2000, down, 0.5), '0.3 s')
  })

  it('with Feedback at 0.5, stacks on the 440 Hz sine shifted by 100 Hz lines at 540, 640, 740 and 840 Hz, each under the last, by 6.06 dB, then 6.08 dB, then 6.11 dB (claim feedback-steps)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const out = shifter.render(source, { feedback: 0.5 }).taps.out!.channels_data[0]!
    const levels = [540, 640, 740, 840].map((hz) => tone(out, hz).db)
    expect(levels[0]! - tone(source.left, 440).db).toBeCloseTo(0, 1)
    const written = ['6.06 dB', '6.08 dB', '6.11 dB']
    for (let k = 1; k < levels.length; k += 1)
      expectWritten(levels[k - 1]! - levels[k]!, written[k - 1]!)
    // With the loop's filter opened to the top, the feedback alone is left: 6.0 dB a pass.
    const open = shifter.render(source, { feedback: 0.5, tone: 16_000 }).taps.out!
    expect(tone(open.channels_data[0]!, 540).db - tone(open.channels_data[0]!, 640).db).toBeCloseTo(
      6.02,
      1,
    )
  })

  // ---- Parts 3 and 6: the cards -----------------------------------------------------------

  it('renders every named set on its own source: the tap its card plays is sound, and between 40 dB and 3 dB under full scale', async () => {
    const shifter = await lab(NAME)
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = await played(shifter, name)
      const tap = result.taps[set.tap ?? 'out']!
      expect(tap.kind, name).toBe('audio')
      for (const data of tap.channels_data) {
        expect(
          data.every((v) => Number.isFinite(v)),
          name,
        ).toBe(true)
        const level = gainToDb(rms(data))
        expect(level, `${name}, dB`).toBeGreaterThan(-40)
        expect(level, `${name}, dB`).toBeLessThan(-3)
        expect(peak(data), `${name}, its largest sample`).toBeLessThan(1)
      }
    }
  })

  it('on the chords at the device’s own defaults, lets the shift in force wander between 0.15 Hz and 0.69 Hz over the loop (claim use-drift)', async () => {
    const shifter = await lab(NAME)
    const result = await played(shifter, 'drift')
    const { lo, hi } = range(first(result, 'shiftNow'))
    expectWritten(lo, '0.15 Hz')
    expectWritten(hi, '0.69 Hz')
  })

  it('with a long delay, fed a 440 Hz sine, puts each echo 9 Hz higher and 3.1 dB quieter than the last (claim way-steps)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const { values } = resolveSet(shifter.description, settings.sets.steps!)
    const out = first(shifter.render(source, values), 'out')
    const lines = [449, 458, 467, 476]
    lines.forEach((hz, k) => {
      expect(strongest(out, hz - 4, hz + 4)).toBe(hz)
      if (k > 0) {
        expectWritten(hz - lines[k - 1]!, '9 Hz')
        expectWritten(tone(out, lines[k - 1]!).db - tone(out, hz).db, '3.1 dB')
      }
    })
  })

  it('with LFO Depth at 0.35, sways the shift in force between −6.1 Hz and 6.1 Hz (claim way-sway)', async () => {
    const shifter = await lab(NAME)
    const { lo, hi } = range(first(await played(shifter, 'sway'), 'shiftNow'))
    expectWritten(lo, '−6.1 Hz')
    expectWritten(hi, '6.1 Hz')
  })

  it("in Ring, shifted by its own 110 Hz, leaves the saw's three lowest lines at 110, 220 and 330 Hz and the output resting 0.10 below zero (claim way-both)", async () => {
    const shifter = await lab(NAME)
    const out = first(await played(shifter, 'both'), 'out')
    expect(strongest(out, 70, 150)).toBe(110)
    expect(strongest(out, 180, 260)).toBe(220)
    expectWritten(strongest(out, 290, 370), '330 Hz')
    // Nothing stands between the lines: half way from one to the next is more than 60 dB under.
    for (const hz of [165, 275]) expect(tone(out, 220).db - tone(out, hz).db).toBeGreaterThan(60)
    let sum = 0
    for (const v of out) sum += v
    expectWritten(-sum / out.length, '0.10')
    // Up, the same shift leaves no such offset.
    const up = first(await played(shifter, 'both', { mode: 0 }), 'out')
    let rest = 0
    for (const v of up) rest += v
    expect(Math.abs(rest / up.length)).toBeLessThan(0.005)
  })

  // ---- Part 7: what goes wrong ------------------------------------------------------------

  it("shifted by 30 Hz, puts the saw's first two partials at 140 Hz and 250 Hz: an octave has become 10.0 semitones (claim fault-apart)", async () => {
    const shifter = await lab(NAME)
    const saw = await benchSource('saw', seconds(4))
    const { values } = resolveSet(shifter.description, settings.sets.apart!)
    const out = first(shifter.render(saw, values), 'out')
    const low = strongest(out, 120, 160)
    const high = strongest(out, 230, 270)
    expectWritten(low, '140 Hz')
    expectWritten(high, '250 Hz')
    expectWritten(12 * Math.log2(high / low), '10.0 semitones')
  })

  it("shifted up 100 Hz, moves the bass's strongest low line from 55 Hz to 155 Hz and leaves 26 dB less below 100 Hz than went in, at the same level over the whole band (claim fault-thin)", async () => {
    const shifter = await lab(NAME)
    const result = await played(shifter, 'thin')
    const lowsOut = band(shifter, 'out', 0, 100)
    const lowsIn = band(shifter, 'in', 0, 100)
    expectWritten(strongest(first(result, 'in'), 30, 200), '55 Hz')
    expectWritten(strongest(first(result, 'out'), 30, 400), '155 Hz')
    expectWritten(lowsIn - lowsOut, '26 dB')
    expectWritten(
      Math.abs(gainToDb(rms(first(result, 'out')) / rms(first(result, 'in')))),
      'less than 0.1 dB',
    )
  })

  it('shifted down 300 Hz, brings the saw’s partial at 110 Hz out at 190 Hz and the one at 220 Hz at 80 Hz, each at its own level (claim fault-through)', async () => {
    const shifter = await lab(NAME)
    const saw = await benchSource('saw', seconds(4))
    const out = first(await played(shifter, 'through'), 'out')
    expectWritten(strongest(out, 170, 210), '190 Hz')
    expectWritten(strongest(out, 60, 100), '80 Hz')
    expect(Math.abs(tone(out, 190).db - tone(saw.left, 110).db)).toBeLessThan(0.01)
    expect(Math.abs(tone(out, 80).db - tone(saw.left, 220).db)).toBeLessThan(0.01)
  })

  it('brings a 440 Hz sine shifted down by 500 Hz out at 60 Hz (claim through-zero)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const out = shifter.render(source, { shift: -500 }).taps.out!.channels_data[0]!
    expectWritten(strongest(out, 20, 600), '60 Hz')
    expect(tone(out, 60).db - tone(source.left, 440).db).toBeCloseTo(0, 2)
  })

  it('folds a 23.6 kHz sine shifted up by 1 kHz back to 23.4 kHz (claim past-top)', async () => {
    const shifter = await lab(NAME)
    const source = sine(23_600, 0.5, seconds(1))
    const out = shifter.render(source, { shift: 1000 }).taps.out!.channels_data[0]!
    expectWritten(strongest(out, 23_000, 23_995, 5) / 1000, '23.4 kHz')
    expect(tone(out, 23_400).db - tone(source.left, 23_600).db).toBeCloseTo(0, 2)
  })

  it('in Ring at a shift of zero and a feedback of 0.98 builds until the limiter holds what comes back at 1.0 (claim ring-loop) and the output stands at 2.4 (claim ring-loop-out)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const taps = shifter.render(source, { shift: 0, mode: 3, feedback: 0.98 }).taps
    expect(peak(source.left)).toBeCloseTo(0.25, 2)
    expectWritten(peak(taps.back!.channels_data[0]!), '1.0')
    expect(peak(taps.back!.channels_data[0]!)).toBeLessThanOrEqual(1)
    expectWritten(peak(taps.out!.channels_data[0]!), '2.4')
    // A fuller sound at the same setting stands higher still.
    const full = shifter.render(await benchSource('mix', seconds(4)), {
      shift: 0,
      mode: 3,
      feedback: 0.98,
    }).taps
    expect(peak(full.out!.channels_data[0]!)).toBeGreaterThan(peak(taps.out!.channels_data[0]!))
    // The same feedback on Up, where the loop's gain is under 1, stays small.
    const up = shifter.render(source, { shift: 0, feedback: 0.98 }).taps
    expect(peak(up.back!.channels_data[0]!)).toBeLessThan(0.9)
  })

  it('puts out exact silence for silence (claim silence)', async () => {
    const shifter = await lab(NAME)
    const taps = shifter.render(silence(seconds(1)), { feedback: 0.9, lfoDepth: 1 }).taps
    for (const data of taps.out!.channels_data) expect(data.every((v) => v === 0)).toBe(true)
  })

  // ---- Part 8: what is often said ---------------------------------------------------------

  it('at a shift of 0 Hz gives the in-phase output, at least 140 dB under it apart (claim zero-shift), less than 0.001 dB from the level of the input (claim zero-level) and 524° behind it at 1 kHz (claim lag-1k)', async () => {
    const shifter = await lab(NAME)
    const source = sine(1000, 0.5, seconds(2))
    const taps = shifter.render(source, { shift: 0 }).taps
    const out = taps.out!.channels_data[0]!
    expectWritten(-differenceDb(out, taps.inPhase!.channels_data[0]!), 'at least 140 dB')
    expectWritten(Math.abs(gainToDb(rms(out) / rms(source.left))), 'less than 0.001 dB')
    // Not the input: the two differ by more than either is loud.
    expect(differenceDb(out, source.left)).toBeGreaterThan(0)
    const behind = turn(tone(out, 1000).degrees - tone(source.left, 1000).degrees)
    expectWritten(360 - behind, '524°')
    expect(Math.abs(curveAt(taps.phaseI!, 1000) - (behind - 360))).toBeLessThan(1)
  })

  it('at a shift of 0 Hz spreads a click: its largest sample is 0.79, three samples late (claim click-smear), and its energy is the same to one part in a million (claim click-energy)', async () => {
    const shifter = await lab(NAME)
    const out = shifter.render(click(seconds(1), 100), { shift: 0 }).taps.out!.channels_data[0]!
    let at = 0
    let energy = 0
    for (let k = 0; k < out.length; k += 1) {
      energy += out[k]! * out[k]!
      if (Math.abs(out[k]!) > Math.abs(out[at]!)) at = k
    }
    expect(at).toBe(103)
    expectWritten(-out[at]!, '0.79')
    expect(Math.abs(energy - 1)).toBeLessThan(1e-6)
  })

  // ---- Part 9: the device's own defaults --------------------------------------------------

  it("starts the page's device table from the device's own defaults: the settings file's defaults, laid over the lab's starting values, are device.json's", async () => {
    const shifter = await lab(NAME)
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/freq-shifter/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const { values } = resolveSet(shifter.description, { values: settings.defaults!.values })
    // The lab's controls are the device's ten parameters, by the same names.
    expect(Object.keys(values).sort()).toEqual(device.params.map((one) => one.key).sort())
    // A starting value comes out of the lab as the 32-bit number the device holds.
    for (const { key, default: start } of device.params) {
      expect(Math.fround(values[key]!), key).toBe(Math.fround(start))
    }
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(settings.defaults!.values)) {
      expect(shifter.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
  })
})
