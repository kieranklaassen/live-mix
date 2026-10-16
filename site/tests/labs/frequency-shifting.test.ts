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

/** A single sample of height 1 in a second of silence, at sample 100. */
function click(): Source {
  const source = silence(seconds(1))
  source.left[100] = 1
  source.right[100] = 1
  return source
}

describe('frequency shifting', () => {
  it('is a sound lab on the sine: every tap says something, loops, and answers to every control', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const result = shifter.render(source, {})
    expectSoundLab(shifter, source, result)
  })

  it('moves a 1 kHz sine to 1.1 kHz at the level it went in at (claim shift-1k), with the copy at 900 Hz 49.0 dB below (claim image-1k)', async () => {
    const shifter = await lab(NAME)
    const source = sine(1000, 0.5, seconds(2))
    const out = shifter.render(source, { shift: 100 }).taps.out!.channels_data[0]!
    expect(strongest(out, 800, 1300)).toBe(1100)
    expect(tone(out, 1100).db - tone(source.left, 1000).db).toBeCloseTo(0, 2)
    const image = tone(out, 1100).db - tone(out, 900).db
    expect(image).toBeGreaterThan(48.5)
    expect(image).toBeLessThan(49.5)
  })

  it('keeps the quadrature output 90° ahead of the in-phase one, within 0.71°, from 22 Hz to 23,978 Hz (claim quarter-turn)', async () => {
    const shifter = await lab(NAME)
    // The lab's own search of the band, from the impulse responses of the kit's pair.
    const first = shifter.render(sine(1000, 0.5, seconds(0.5)), {})
    expect(first.checks.quarterError).toBeLessThan(0.71)
    expect(first.checks.quarterError).toBeGreaterThan(0.69)
    // The curve the page draws: every point of it inside the band.
    const curve = first.taps.phaseDifference!
    const ahead = curve.channels_data[0]!
    for (let p = 0; p < ahead.length; p += 1) {
      const hz = curve.x0 * Math.pow(curve.x1 / curve.x0, p / (ahead.length - 1))
      if (hz >= 22) expect(Math.abs(ahead[p]! - 90)).toBeLessThan(0.71)
    }
    // And the device's own pair as it runs, with a sine at the band's ends and the ripple's crests.
    for (const hz of [22, 30.2, 62, 1000, 8863, 15_200, 23_734, 23_978]) {
      const taps = shifter.render(sine(hz, 0.5, seconds(2)), {}).taps
      const i = tone(taps.inPhase!.channels_data[0]!, hz).degrees
      const q = tone(taps.quadrature!.channels_data[0]!, hz).degrees
      expect(Math.abs(turn(q - i) - 90), `at ${hz} Hz`).toBeLessThan(0.71)
    }
  })

  it('is 1.6° from a quarter turn at 20 Hz (claim below-band), where the cancelled copy is only 37 dB down (claim image-20)', async () => {
    const shifter = await lab(NAME)
    const taps = shifter.render(sine(20, 0.5, seconds(4)), { shift: 100 }).taps
    const i = tone(taps.inPhase!.channels_data[0]!, 20).degrees
    const q = tone(taps.quadrature!.channels_data[0]!, 20).degrees
    expect(Math.abs(turn(q - i) - 90)).toBeGreaterThan(1.55)
    expect(Math.abs(turn(q - i) - 90)).toBeLessThan(1.75)
    const out = taps.out!.channels_data[0]!
    const image = tone(out, 120).db - tone(out, 80).db
    expect(image).toBeGreaterThan(36.5)
    expect(image).toBeLessThan(37.5)
  })

  it('leaves the cancelled copy 44.2 dB down at the crests of the ripple, its worst in the band (claim image-worst)', async () => {
    const shifter = await lab(NAME)
    for (const hz of [30.2, 62, 330.6, 8863, 15_200]) {
      const out = shifter.render(sine(hz, 0.5, seconds(4)), { shift: 100 }).taps.out!
      const image =
        tone(out.channels_data[0]!, hz + 100).db -
        tone(out.channels_data[0]!, Math.abs(hz - 100)).db
      expect(image, `at ${hz} Hz`).toBeGreaterThan(44.1)
      expect(image, `at ${hz} Hz`).toBeLessThan(44.4)
    }
  })

  it('splits the 440 Hz sine into lines at 340 and 540 Hz, each 6.0 dB under it (claim ring-halves), and leaves nothing at 440 Hz (claim ring-original-gone)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const ring = shifter.render(source, {}).taps.ring!.channels_data[0]!
    const went = tone(source.left, 440).db
    expect(strongest(ring, 250, 430)).toBe(340)
    expect(strongest(ring, 450, 650)).toBe(540)
    expect(tone(ring, 340).db - went).toBeCloseTo(-6.02, 1)
    expect(tone(ring, 540).db - went).toBeCloseTo(-6.02, 1)
    expect(tone(ring, 440).db - went).toBeLessThan(-120)
  })

  it("passes each of the saw's first twenty harmonics through both chains within 0.001 dB (claim same-level)", async () => {
    const shifter = await lab(NAME)
    const saw = await benchSource('saw', seconds(4))
    const taps = shifter.render(saw, {}).taps
    for (let k = 1; k <= 20; k += 1) {
      const went = tone(saw.left, 110 * k).db
      const first = tone(taps.inPhase!.channels_data[0]!, 110 * k).db
      const second = tone(taps.quadrature!.channels_data[0]!, 110 * k).db
      expect(Math.abs(first - went)).toBeLessThan(0.001)
      expect(Math.abs(second - went)).toBeLessThan(0.001)
    }
  })

  it('runs the in-phase output a turn and 78.5° behind the input at 440 Hz (claim lag-440)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const taps = shifter.render(source, {}).taps
    const behind = turn(
      tone(taps.inPhase!.channels_data[0]!, 440).degrees - tone(source.left, 440).degrees,
    )
    expect(behind).toBeCloseTo(-78.5, 0)
    // The whole turn is in the curve, which follows the phase down from 5 Hz without a jump.
    expect(Math.abs(curveAt(taps.phaseI!, 440) - (behind - 360))).toBeLessThan(1)
  })

  it("works the chosen side band out again from the device's pair and carrier, to the floor of the measure (claim rebuilt-exact)", async () => {
    const shifter = await lab(NAME)
    const chords = await benchSource('chords', seconds(4))
    const settings: Record<string, number>[] = [
      {},
      { mode: 1 },
      { mode: 2 },
      { mode: 3 },
      { shift: 0, fine: 1.5, feedback: 0.9, delay: 12, mix: 0.5 },
      { feedback: 0.98, lfoDepth: 1, width: 1 },
    ]
    for (const values of settings) {
      expect(shifter.render(chords, values).checks.rebuilt, JSON.stringify(values)).toBe(-140)
    }
  })

  it('gives the same output for Down at +100 Hz as for Up at −100 Hz, to 130 dB (claim down-is-negative)', async () => {
    const shifter = await lab(NAME)
    const source = sine(1000, 0.5, seconds(2))
    const down = shifter.render(source, { shift: 100, mode: 1 }).taps.out!.channels_data[0]!
    const negative = shifter.render(source, { shift: -100 }).taps.out!.channels_data[0]!
    expect(strongest(down, 800, 1300)).toBe(900)
    expect(differenceDb(down, negative)).toBeLessThan(-130)
  })

  it('in Stereo sends the sine out at 540 Hz on the left and 340 Hz on the right (claim stereo-split)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const out = shifter.render(source, { mode: 2 }).taps.out!
    expect(strongest(out.channels_data[0]!, 250, 650)).toBe(540)
    expect(strongest(out.channels_data[1]!, 250, 650)).toBe(340)
  })

  it('in Ring puts both side bands out 3.0 dB under the input (claim ring-mode)', async () => {
    const shifter = await lab(NAME)
    const source = sine(1000, 0.5, seconds(2))
    const out = shifter.render(source, { shift: 100, mode: 3 }).taps.out!.channels_data[0]!
    const went = tone(source.left, 1000).db
    expect(tone(out, 900).db - went).toBeCloseTo(-3.01, 1)
    expect(tone(out, 1100).db - went).toBeCloseTo(-3.01, 1)
  })

  it('with Width at 1 and Mode on Up puts the right output 90.0° ahead of the left (claim width-quarter)', async () => {
    const shifter = await lab(NAME)
    for (const hz of [110, 1000, 5000]) {
      const out = shifter.render(sine(hz, 0.5, seconds(2)), { width: 1 }).taps.out!
      const left = tone(out.channels_data[0]!, hz + 100)
      const right = tone(out.channels_data[1]!, hz + 100)
      expect(turn(right.degrees - left.degrees)).toBeCloseTo(90, 1)
      expect(right.db - left.db).toBeCloseTo(0, 3)
    }
    // Half the width is half the turn.
    const half = shifter.render(sine(1000, 0.5, seconds(2)), { width: 0.5 }).taps.out!
    const ahead =
      tone(half.channels_data[1]!, 1100).degrees - tone(half.channels_data[0]!, 1100).degrees
    expect(turn(ahead)).toBeCloseTo(45, 1)
  })

  it("moves the saw's partials from 110, 220, 330 and 440 Hz to 160, 270, 380 and 490 Hz, each at its own level (claim saw-partials)", async () => {
    const shifter = await lab(NAME)
    const saw = await benchSource('saw', seconds(4))
    const out = shifter.render(saw, { shift: 50 }).taps.out!.channels_data[0]!
    for (const partial of [110, 220, 330, 440]) {
      expect(strongest(out, partial + 20, partial + 80)).toBe(partial + 50)
      expect(tone(out, partial + 50).db - tone(saw.left, partial).db).toBeCloseTo(0, 2)
    }
    // Shifted by its own fundamental, the saw is a harmonic series again, with no fundamental.
    const whole = shifter.render(saw, { shift: 110 }).taps.out!.channels_data[0]!
    expect(strongest(whole, 180, 260)).toBe(220)
    expect(tone(whole, 110).db).toBeLessThan(tone(whole, 220).db - 60)
  })

  it('mixed half and half at a shift of 1 Hz, swells 3.0 dB over the sine (claim beat-crest) and dies 40 dB under it (claim beat-null), once a second (claim beat-rate)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const out = shifter.render(source, { shift: 0, fine: 1, mix: 0.5 }).taps.out!.channels_data[0]!
    // One cycle of 440 Hz is 109 samples.
    const shape = outline(out, 110, 10)
    const went = peak(source.left)
    const crest = Math.max(...shape.map((one) => one.top))
    const trough = Math.min(...shape.map((one) => one.top))
    expect(gainToDb(crest / went)).toBeCloseTo(3.01, 1)
    expect(gainToDb(trough / went)).toBeLessThan(-40)
    // The first instant of each stretch where the outline is under a hundredth of the input.
    const quiet = shape.filter((one) => one.top < went * 0.01).map((one) => one.at)
    const nulls = quiet.filter((at, k) => k === 0 || at - quiet[k - 1]! > 0.1)
    expect(nulls.length).toBe(4)
    for (let k = 1; k < nulls.length; k += 1) expect(nulls[k]! - nulls[k - 1]!).toBeCloseTo(1, 2)
  })

  it('at a shift of zero, mixed half and half, cancels a tone at 1,168 Hz by more than 60 dB (claim still-notch)', async () => {
    const shifter = await lab(NAME)
    const first = shifter.render(sine(1168, 0.5, seconds(2)), { shift: 0, mix: 0.5 })
    // The in-phase chain is a turn and a half behind there.
    expect(Math.abs(curveAt(first.taps.phaseI!, 1168) + 540)).toBeLessThan(1)
    const out = first.taps.out!.channels_data[0]!
    const went = first.taps.in!.channels_data[0]!
    expect(gainToDb(rms(out) / rms(went))).toBeLessThan(-60)
  })

  it('at a shift of 0.5 Hz up, moves the notch from 1,168 Hz to 2 kHz in 0.32 s and to 4 kHz in 0.73 s (claim notch-climbs)', async () => {
    const shifter = await lab(NAME)
    const settings = { shift: 0, fine: 0.5, mix: 0.5 }
    // When a tone is at its quietest in the two seconds, one beat, from `from`.
    const nullAt = (hz: number, values: Record<string, number>, from: number) => {
      const out = shifter.render(sine(hz, 0.25, seconds(4)), values).taps.out!.channels_data[0]!
      return from + lowestAt(out.subarray(from * RATE, (from + 2) * RATE), 48)
    }
    const start = nullAt(1168, settings, 1)
    expect(start).toBeCloseTo(2, 2)
    expect(nullAt(2000, settings, 1.5) - start).toBeCloseTo(0.32, 2)
    expect(nullAt(4000, settings, 1.5) - start).toBeCloseTo(0.73, 2)
    // Down, the notch is at 2 kHz before it is at 1,168 Hz.
    const down = { ...settings, mode: 1 }
    expect(nullAt(1168, down, 1) - nullAt(2000, down, 0.5)).toBeCloseTo(0.32, 2)
  })

  it('at a feedback of 0.5 stacks lines at 540, 640, 740 and 840 Hz, each about 6.1 dB under the last (claim feedback-steps)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const out = shifter.render(source, { feedback: 0.5 }).taps.out!.channels_data[0]!
    const levels = [540, 640, 740, 840].map((hz) => tone(out, hz).db)
    expect(levels[0]! - tone(source.left, 440).db).toBeCloseTo(0, 1)
    for (let k = 1; k < levels.length; k += 1) {
      expect(levels[k - 1]! - levels[k]!).toBeGreaterThan(6.02)
      expect(levels[k - 1]! - levels[k]!).toBeLessThan(6.15)
    }
  })

  it('in Ring at a shift of zero and a feedback of 0.98 builds until the limiter holds what comes back at 1.0 (claim ring-loop) and the output stands at 2.4 (claim ring-loop-out)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const taps = shifter.render(source, { shift: 0, mode: 3, feedback: 0.98 }).taps
    expect(peak(source.left)).toBeCloseTo(0.25, 2)
    expect(peak(taps.back!.channels_data[0]!)).toBeGreaterThan(0.99)
    expect(peak(taps.back!.channels_data[0]!)).toBeLessThanOrEqual(1)
    expect(peak(taps.out!.channels_data[0]!)).toBeCloseTo(2.4, 1)
    // The same feedback on Up, where the loop's gain is under 1, stays small.
    const up = shifter.render(source, { shift: 0, feedback: 0.98 }).taps
    expect(peak(up.back!.channels_data[0]!)).toBeLessThan(0.9)
  })

  it('at a shift of 0 Hz gives the in-phase output, to the floor of the measure (claim zero-shift), at the level of the input within 0.001 dB (claim zero-level) and 524° behind it at 1 kHz (claim lag-1k)', async () => {
    const shifter = await lab(NAME)
    const source = sine(1000, 0.5, seconds(2))
    const taps = shifter.render(source, { shift: 0 }).taps
    const out = taps.out!.channels_data[0]!
    expect(differenceDb(out, taps.inPhase!.channels_data[0]!)).toBe(-140)
    expect(Math.abs(gainToDb(rms(out) / rms(source.left)))).toBeLessThan(0.001)
    // Not the input: the two differ by more than either is loud.
    expect(differenceDb(out, source.left)).toBeGreaterThan(0)
    const behind = turn(tone(out, 1000).degrees - tone(source.left, 1000).degrees)
    expect(behind - 360).toBeCloseTo(-523.9, 0)
    expect(Math.abs(curveAt(taps.phaseI!, 1000) - (behind - 360))).toBeLessThan(1)
  })

  it('at a shift of 0 Hz spreads a click: its largest sample is 0.79, three samples late (claim click-smear), and its energy is the same to one part in a million (claim click-energy)', async () => {
    const shifter = await lab(NAME)
    const out = shifter.render(click(), { shift: 0 }).taps.out!.channels_data[0]!
    let at = 0
    let energy = 0
    for (let k = 0; k < out.length; k += 1) {
      energy += out[k]! * out[k]!
      if (Math.abs(out[k]!) > Math.abs(out[at]!)) at = k
    }
    expect(at).toBe(103)
    expect(out[at]!).toBeCloseTo(-0.787, 2)
    expect(Math.abs(energy - 1)).toBeLessThan(1e-6)
  })

  it('brings a 440 Hz sine shifted down by 500 Hz out at 60 Hz (claim through-zero)', async () => {
    const shifter = await lab(NAME)
    const source = await benchSource('sine', seconds(4))
    const out = shifter.render(source, { shift: -500 }).taps.out!.channels_data[0]!
    expect(strongest(out, 20, 600)).toBe(60)
    expect(tone(out, 60).db - tone(source.left, 440).db).toBeCloseTo(0, 2)
  })

  it('folds a 23.6 kHz sine shifted up by 1 kHz back to 23.4 kHz (claim past-top)', async () => {
    const shifter = await lab(NAME)
    const source = sine(23_600, 0.5, seconds(1))
    const out = shifter.render(source, { shift: 1000 }).taps.out!.channels_data[0]!
    expect(strongest(out, 23_000, 23_995, 5)).toBe(23_400)
    expect(tone(out, 23_400).db - tone(source.left, 23_600).db).toBeCloseTo(0, 2)
  })

  it('puts out exact silence for silence (claim silence)', async () => {
    const shifter = await lab(NAME)
    const taps = shifter.render(silence(seconds(1)), { feedback: 0.9, lfoDepth: 1 }).taps
    for (const data of taps.out!.channels_data) expect(data.every((v) => v === 0)).toBe(true)
  })
})
