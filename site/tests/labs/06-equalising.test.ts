import { describe, expect, it } from 'vitest'
import {
  benchSource,
  expectSoundLab,
  gainToDb,
  lab,
  noise,
  rms,
  seconds,
  sine,
  type Source,
} from './support.ts'
import type { Lab, RenderResult, TapData } from '../../src/lab/runner.ts'

const NAME = '06-equalising'

/** Every tone band at 0 dB and both cuts at their stops: nothing in circuit. */
const wire = { lowCut: 20, low: 0, body: 0, presence: 0, air: 0, highCut: 20000 }

/** A short tone, for a render whose curves are what is read. */
const short = () => sine(1000, 0.25, seconds(0.25))

/**
 * How much louder a sine at `hz` is at a stage than it went in, in dB: a second of the tone
 * through the lab, the stage's level over the input's. The taps hold the second pass of the
 * loop, so the filters have settled.
 */
function gainAt(theLab: Lab, tap: string, hz: number, values: Record<string, number>): number {
  const out = theLab.render(sine(hz, 0.25, seconds(1)), values)
  return gainToDb(rms(out.taps[tap]!.channels_data[0]!) / rms(out.taps.in!.channels_data[0]!))
}

/** A curve's value at `x`, between its two nearest points. */
function at(tap: TapData, x: number): number {
  const data = tap.channels_data[0]!
  const last = data.length - 1
  const place =
    (tap.log
      ? Math.log(x / tap.x0) / Math.log(tap.x1 / tap.x0)
      : (x - tap.x0) / (tap.x1 - tap.x0)) * last
  const i = Math.min(last - 1, Math.max(0, Math.floor(place)))
  return data[i]! + (data[i + 1]! - data[i]!) * (place - i)
}

/** The frequency a point of a curve from 20 Hz to 20 kHz stands at. */
const hzOf = (tap: TapData, p: number) =>
  tap.x0 * Math.pow(tap.x1 / tap.x0, p / (tap.channels_data[0]!.length - 1))

const lowest = (x: Float32Array) => x.reduce((a, b) => Math.min(a, b), Infinity)
const highest = (x: Float32Array) => x.reduce((a, b) => Math.max(a, b), -Infinity)

/** Where a curve crosses `level`: the frequencies, going up and coming down. */
function crossings(tap: TapData, level: number): number[] {
  const data = tap.channels_data[0]!
  const found: number[] = []
  for (let p = 1; p < data.length; p += 1) {
    const a = data[p - 1]! - level
    const b = data[p]! - level
    if (a < 0 !== b < 0) found.push(hzOf(tap, p - 1 + a / (a - b)))
  }
  return found
}

/**
 * The time a ring takes to fall to 1/e, in ms: the largest sample of each millisecond (one
 * cycle at 1 kHz), and the slope of a straight line through their logarithms.
 */
function ringMs(result: RenderResult): number {
  const ring = result.taps.bellRing!.channels_data[0]!
  let n = 0
  let sx = 0
  let sy = 0
  let sxx = 0
  let sxy = 0
  for (let cycle = 0; cycle < 30; cycle += 1) {
    let top = 0
    for (let i = cycle * 48; i < cycle * 48 + 48; i += 1) top = Math.max(top, Math.abs(ring[i]!))
    if (top < 1e-5) break
    const y = Math.log(top)
    n += 1
    sx += cycle
    sy += y
    sxx += cycle * cycle
    sxy += cycle * y
  }
  return -1 / ((n * sxy - sx * sy) / (n * sxx - sx * sx))
}

/** White noise with a 1 kHz tone standing out of it: a bed, and one thing ringing above it. */
function toneOnNoise(noisePeak: number, tonePeak: number): Source {
  const bed = noise(noisePeak, seconds(4))
  const tone = sine(1000, tonePeak, seconds(4))
  for (let i = 0; i < bed.left.length; i += 1) {
    bed.left[i]! += tone.left[i]!
    bed.right[i]! += tone.right[i]!
  }
  return bed
}

describe('lesson 6: equalising with biquads', () => {
  it('is a sound lab on the drums: every tap says something, loops, and answers to every control', async () => {
    const eq = await lab(NAME)
    const drums = await benchSource('drums', seconds(4))
    const result = eq.render(drums, {})
    // With Clear at 0, where the lab starts, it cuts nothing: both of its taps are rightly flat.
    expectSoundLab(eq, drums, result, { quiet: ['clearDepth', 'respClear'] })
  })

  // --- One biquad ---------------------------------------------------------

  it('runs the difference equation as written and the form the kit runs to within rounding, about 110 dB under the sound (claim forms-agree)', async () => {
    const eq = await lab(NAME)
    const drums = await benchSource('drums', seconds(4))
    const forms = eq.render(drums, {}).checks.forms!
    expect(forms).toBeLessThan(-105)
    expect(forms).toBeGreaterThan(-118)
  })

  it('puts the poles of a +6 dB bell at 1 kHz and Q 2 at 0.977 from the centre and its zeros at 0.955 (claim pole-radius)', async () => {
    const eq = await lab(NAME)
    const { checks } = eq.render(short(), {})
    expect(checks.poleRadius).toBeCloseTo(0.9772, 3)
    expect(checks.zeroRadius).toBeCloseTo(0.9549, 3)
    // A cut swaps them.
    const cut = eq.render(short(), { bellGain: -6 }).checks
    expect(cut.poleRadius).toBeCloseTo(0.9549, 3)
    expect(cut.zeroRadius).toBeCloseTo(0.9772, 3)
  })

  it('adds the curve of the zeros alone and the curve of the poles alone to the bell, within 0.001 dB; at 20 Hz they are 35.5 dB down and 35.5 dB up (claim halves-add)', async () => {
    const eq = await lab(NAME)
    const { taps } = eq.render(short(), {})
    const zeros = taps.bellZeros!.channels_data[0]!
    const poles = taps.bellPoles!.channels_data[0]!
    const bell = taps.bellResponse!.channels_data[0]!
    let worst = 0
    bell.forEach((v, p) => (worst = Math.max(worst, Math.abs(zeros[p]! + poles[p]! - v))))
    expect(worst).toBeLessThan(0.001)
    expect(zeros[0]).toBeCloseTo(-35.5, 1)
    expect(poles[0]).toBeCloseTo(35.5, 1)
  })

  // --- The bell -----------------------------------------------------------

  it('measures a +6 dB bell at 1 kHz as +6.00 dB at 1 kHz (claim bell-centre)', async () => {
    const eq = await lab(NAME)
    expect(gainAt(eq, 'bell', 1000, {})).toBeCloseTo(6, 2)
    expect(gainAt(eq, 'bell', 1000, { bellQ: 0.7 })).toBeCloseTo(6, 2)
    expect(gainAt(eq, 'bell', 1000, { bellQ: 10 })).toBeCloseTo(6, 2)
  })

  it('leaves 0.11 dB two octaves either side of that bell at Q 2 (claim bell-two-octaves) and 0.8 dB at Q 0.7 (claim bell-two-octaves-broad)', async () => {
    const eq = await lab(NAME)
    for (const hz of [250, 4000]) {
      const narrow = gainAt(eq, 'bell', hz, {})
      expect(narrow).toBeGreaterThan(0.09)
      expect(narrow).toBeLessThan(0.13)
      const broad = gainAt(eq, 'bell', hz, { bellQ: 0.7 })
      expect(broad).toBeGreaterThan(0.75)
      expect(broad).toBeLessThan(0.82)
    }
  })

  it('is half its decibels up at 781 Hz and 1,280 Hz at Q 2: 499 Hz apart, the centre over Q (claim bell-width)', async () => {
    const eq = await lab(NAME)
    const [lo, hi] = crossings(eq.render(short(), {}).taps.bellResponse!, 3)
    expect(lo).toBeGreaterThan(778)
    expect(lo).toBeLessThan(784)
    expect(hi).toBeGreaterThan(1277)
    expect(hi).toBeLessThan(1283)
    expect(hi! - lo!).toBeGreaterThan(496)
    expect(hi! - lo!).toBeLessThan(502)
  })

  it('undoes a boost with the same cut: the two curves add to 0 dB within 0.001 dB everywhere (claim bell-mirror)', async () => {
    const eq = await lab(NAME)
    const up = eq.render(short(), { bellGain: 6 }).taps.bellResponse!.channels_data[0]!
    const down = eq.render(short(), { bellGain: -6 }).taps.bellResponse!.channels_data[0]!
    let worst = 0
    up.forEach((v, p) => (worst = Math.max(worst, Math.abs(v + down[p]!))))
    expect(worst).toBeLessThan(0.001)
  })

  // --- Shelves and cuts ---------------------------------------------------

  it('lifts +3.00 dB at 120 Hz with Low at +6, +5.63 dB an octave under and +0.37 dB an octave over (claim shelf-low)', async () => {
    const eq = await lab(NAME)
    const values = { ...wire, low: 6 }
    expect(gainAt(eq, 'afterLow', 120, values)).toBeCloseTo(3, 2)
    expect(gainAt(eq, 'afterLow', 60, values)).toBeCloseTo(5.63, 1)
    expect(gainAt(eq, 'afterLow', 240, values)).toBeCloseTo(0.37, 1)
    expect(gainAt(eq, 'afterLow', 30, values)).toBeCloseTo(5.99, 1)
  })

  it('lifts +3.00 dB at 9 kHz with Air at +6 and +5.99 dB at 20 kHz (claim shelf-air)', async () => {
    const eq = await lab(NAME)
    const values = { ...wire, air: 6 }
    expect(gainAt(eq, 'afterAir', 9000, values)).toBeCloseTo(3, 2)
    expect(gainAt(eq, 'afterAir', 20000, values)).toBeCloseTo(5.99, 1)
    expect(gainAt(eq, 'afterAir', 4500, values)).toBeCloseTo(0.26, 1)
  })

  it('draws shelves with no bump: at +12 dB neither rises above 12 dB nor dips under 0 (claim shelf-flat-top)', async () => {
    const eq = await lab(NAME)
    const { taps } = eq.render(short(), { low: 12, air: 12 })
    for (const id of ['respLow', 'respAir']) {
      const curve = taps[id]!.channels_data[0]!
      expect(highest(curve)).toBeLessThanOrEqual(12)
      expect(highest(curve)).toBeGreaterThan(11.9)
      expect(lowest(curve)).toBeGreaterThan(-0.001)
    }
  })

  it('is 3.01 dB down at the low cut and 24.1 dB down an octave under it (claim low-cut)', async () => {
    const eq = await lab(NAME)
    const values = { ...wire, lowCut: 100 }
    expect(gainAt(eq, 'afterLowCut', 100, values)).toBeCloseTo(-3.01, 1)
    expect(gainAt(eq, 'afterLowCut', 50, values)).toBeCloseTo(-24.1, 1)
    expect(gainAt(eq, 'afterLowCut', 200, values)).toBeGreaterThan(-0.05)
  })

  it('is 3.01 dB down at the high cut; an octave over it 12.4 dB down from 1 kHz and 14.3 dB down from 5 kHz (claim high-cut)', async () => {
    const eq = await lab(NAME)
    expect(gainAt(eq, 'afterHighCut', 5000, { ...wire, highCut: 5000 })).toBeCloseTo(-3.01, 1)
    expect(gainAt(eq, 'afterHighCut', 10000, { ...wire, highCut: 5000 })).toBeCloseTo(-14.3, 1)
    expect(gainAt(eq, 'afterHighCut', 1000, { ...wire, highCut: 1000 })).toBeCloseTo(-3.01, 1)
    expect(gainAt(eq, 'afterHighCut', 2000, { ...wire, highCut: 1000 })).toBeCloseTo(-12.4, 1)
  })

  it('builds the low cut from two biquads 0.11 dB off at 20 Hz when set to 30 Hz, and 1.1 dB off when set to 100 Hz, where the pair the device uses lands on the textbook curve (claim cut-forms)', async () => {
    const eq = await lab(NAME)
    const butterworth = (hz: number, corner: number) =>
      -10 * Math.log10(1 + Math.pow(corner / hz, 8))
    const at30 = eq.render(short(), { lowCut: 30 })
    expect(at(at30.taps.respLowCut!, 20)).toBeCloseTo(butterworth(20, 30), 2)
    expect(at(at30.taps.respLowCut!, 20) - at(at30.taps.respCutBiquad!, 20)).toBeCloseTo(0.11, 2)
    const at100 = eq.render(short(), { lowCut: 100 })
    expect(at(at100.taps.respLowCut!, 20)).toBeCloseTo(butterworth(20, 100), 2)
    expect(at(at100.taps.respLowCut!, 20) - at(at100.taps.respCutBiquad!, 20)).toBeCloseTo(1.07, 1)
    expect(at100.checks.cutForms).toBeCloseTo(1.07, 1)
  })

  // --- Bands in a row -----------------------------------------------------

  it('reads Body at −5 as −5.00 dB at 320 Hz and −2.38 dB an octave either side (claim body-centre)', async () => {
    const eq = await lab(NAME)
    const values = { ...wire, body: -5 }
    expect(gainAt(eq, 'afterBody', 320, values)).toBeCloseTo(-5, 2)
    expect(gainAt(eq, 'afterBody', 160, values)).toBeCloseTo(-2.38, 1)
    expect(gainAt(eq, 'afterBody', 640, values)).toBeCloseTo(-2.38, 1)
  })

  it('measures the device within 0.03 dB of its bands added, wherever the curve is above −20 dB (claim curves-add)', async () => {
    const eq = await lab(NAME)
    const settings: Record<string, number>[] = [
      {},
      wire,
      { lowCut: 500, highCut: 1000 },
      { lowCut: 100, low: 12, air: 12 },
      { lowCut: 500, highCut: 1000, low: -12, body: -12, presence: -12, air: -12 },
      { lowCut: 20.5, highCut: 19000, low: 12, body: 12, presence: 12, air: 12 },
      { lowCut: 133, highCut: 4376, low: -7.8, body: -1.6, presence: -7.7, air: -12 },
      { lowCut: 251, highCut: 17593, low: -4.2, body: 9.2, presence: -7, air: -5.3 },
      { lowCut: 50, highCut: 12674, low: 7.5, body: 11.6, presence: 10.9, air: -11.3 },
    ]
    for (const values of settings) {
      expect(eq.render(short(), values).checks.curveError).toBeLessThan(0.03)
    }
    // Where the lab starts, 0.013 dB.
    expect(eq.render(short(), {}).checks.curveError).toBeLessThan(0.02)
  })

  it("builds the chain from the kit's filters to the very samples the device made (claim rebuilt)", async () => {
    const eq = await lab(NAME)
    const drums = await benchSource('drums', seconds(4))
    expect(eq.render(drums, {}).checks.rebuilt).toBe(-140)
    const chords = await benchSource('chords', seconds(4))
    const busy = { lowCut: 250, highCut: 3000, low: -8, body: 9, presence: -7, air: 5 }
    expect(eq.render(chords, busy).checks.rebuilt).toBe(-140)
    // With Clear cutting, the chain still matches what the device hands to Clear.
    expect(eq.render(drums, { clear: 1 }).checks.rebuilt).toBe(-140)
  })

  it('is the input, sample for sample, with every band at 0 dB, both cuts at their stops and Clear at 0 (claim flat-is-wire)', async () => {
    const eq = await lab(NAME)
    const drums = await benchSource('drums', seconds(4))
    const { taps } = eq.render(drums, wire)
    for (const c of [0, 1]) {
      const dry = taps.in!.channels_data[c]!
      expect(taps.out!.channels_data[c]!.every((v, i) => v === dry[i])).toBe(true)
    }
  })

  // --- Phase ---------------------------------------------------------------

  it('turns the phase 19.4° forward at 774 Hz and 19.4° back at 1,262 Hz for the +6 dB bell, nothing at its centre, and 36.7° at +12 dB (claim bell-phase)', async () => {
    const eq = await lab(NAME)
    const phase = eq.render(short(), {}).taps.bellPhase!
    const data = phase.channels_data[0]!
    expect(highest(data)).toBeCloseTo(19.4, 1)
    expect(lowest(data)).toBeCloseTo(-19.4, 1)
    expect(hzOf(phase, data.indexOf(highest(data)))).toBeGreaterThan(760)
    expect(hzOf(phase, data.indexOf(highest(data)))).toBeLessThan(790)
    expect(hzOf(phase, data.indexOf(lowest(data)))).toBeGreaterThan(1245)
    expect(hzOf(phase, data.indexOf(lowest(data)))).toBeLessThan(1285)
    expect(Math.abs(at(phase, 1000))).toBeLessThan(0.05)
    const louder = eq.render(short(), { bellGain: 12 }).taps.bellPhase!.channels_data[0]!
    expect(highest(louder)).toBeCloseTo(36.7, 1)
  })

  it('rings for 6.4 ms after a +12 dB bell at 1 kHz and Q 10 (claim ring-boost) and 1.6 ms after the −12 dB one (claim ring-cut)', async () => {
    const eq = await lab(NAME)
    const boost = ringMs(eq.render(short(), { bellQ: 10, bellGain: 12 }))
    expect(boost).toBeGreaterThan(6.2)
    expect(boost).toBeLessThan(6.6)
    const cut = ringMs(eq.render(short(), { bellQ: 10, bellGain: -12 }))
    expect(cut).toBeGreaterThan(1.5)
    expect(cut).toBeLessThan(1.7)
  })

  // --- Clear ---------------------------------------------------------------

  it('cuts a tone that stands out of a bed of noise by 12 dB at Clear 1 and never more (claim clear-cap), and by 4.8 dB at Clear 0.4 (claim clear-share)', async () => {
    const eq = await lab(NAME)
    const source = toneOnNoise(0.2, 0.16)
    const full = eq.render(source, { ...wire, clear: 1 })
    expect(lowest(full.taps.clearDepth!.channels_data[0]!)).toBeCloseTo(-12, 1)
    expect(lowest(full.taps.clearDepth!.channels_data[0]!)).toBeGreaterThanOrEqual(-12)
    // The cut is a bell one band wide: deep at the tone, 0.35 dB an octave either side.
    expect(at(full.taps.respClear!, 1000)).toBeLessThan(-11)
    expect(at(full.taps.respClear!, 500)).toBeGreaterThan(-0.5)
    expect(at(full.taps.respClear!, 2000)).toBeGreaterThan(-0.5)
    const part = eq.render(source, { ...wire, clear: 0.4 })
    expect(lowest(part.taps.clearDepth!.channels_data[0]!)).toBeCloseTo(-4.8, 1)
  })

  it('leaves a lone note alone at Clear 1: a sine, a saw and plain noise are cut by exactly 0 dB (claim clear-lone-note)', async () => {
    const eq = await lab(NAME)
    for (const id of ['sine', 'saw', 'noise']) {
      const source = await benchSource(id, seconds(4))
      const depth = eq.render(source, { clear: 1 }).taps.clearDepth!.channels_data[0]!
      expect(depth.every((v) => v === 0)).toBe(true)
    }
  })

  it('finds 1.1 dB to cut in the drum loop at Clear 1, near 106 Hz (claim clear-on-drums)', async () => {
    const eq = await lab(NAME)
    const drums = await benchSource('drums', seconds(4))
    const { taps } = eq.render(drums, { clear: 1 })
    expect(lowest(taps.clearDepth!.channels_data[0]!)).toBeCloseTo(-1.1, 1)
    const cuts = taps.respClear!
    const data = cuts.channels_data[0]!
    expect(hzOf(cuts, data.indexOf(lowest(data)))).toBeGreaterThan(95)
    expect(hzOf(cuts, data.indexOf(lowest(data)))).toBeLessThan(118)
  })

  // --- What goes wrong -----------------------------------------------------

  it('squeezes a bell near half the sample rate: half an octave over its centre a +6 dB bell of Q 2 holds 2.02 dB at 1 kHz and 0.62 dB at 12 kHz, and an octave over, 0.63 dB and exactly nothing (claim cramp)', async () => {
    const eq = await lab(NAME)
    const { taps } = eq.render(short(), {})
    expect(at(taps.bellAtOne!, 0.5)).toBeCloseTo(2.02, 1)
    expect(at(taps.bellHigh!, 0.5)).toBeCloseTo(0.62, 1)
    expect(at(taps.bellAtOne!, 1)).toBeCloseTo(0.63, 1)
    expect(Math.abs(at(taps.bellHigh!, 1))).toBeLessThan(0.001)
    // The side under the centre narrows too.
    expect(at(taps.bellAtOne!, -1)).toBeCloseTo(0.63, 1)
    expect(at(taps.bellHigh!, -1)).toBeCloseTo(0.38, 1)
  })

  it('leaves Presence at +6 lopsided by 0.14 dB: 2.81 dB at 1.5 kHz and 2.67 dB at 6 kHz (claim presence-lopsided)', async () => {
    const eq = await lab(NAME)
    const values = { ...wire, presence: 6 }
    expect(gainAt(eq, 'afterPresence', 3000, values)).toBeCloseTo(6, 2)
    expect(gainAt(eq, 'afterPresence', 1500, values)).toBeCloseTo(2.81, 1)
    expect(gainAt(eq, 'afterPresence', 6000, values)).toBeCloseTo(2.67, 1)
  })

  it('stops at a floor of rounding: with the low cut at 500 Hz the device measures −70 dB at 44 Hz where its bands add to −81 dB (claim rounding-floor)', async () => {
    const eq = await lab(NAME)
    const { taps } = eq.render(short(), { lowCut: 500 })
    expect(at(taps.curveDevice!, 44)).toBeGreaterThan(-71.5)
    expect(at(taps.curveDevice!, 44)).toBeLessThan(-68.5)
    expect(at(taps.curveSum!, 44)).toBeCloseTo(-80.7, 0)
    // With no biquad in circuit there is no floor: the low cut alone goes all the way down.
    const bare = eq.render(short(), { ...wire, lowCut: 500 }).taps
    expect(Math.abs(at(bare.curveDevice!, 44) - at(bare.curveSum!, 44))).toBeLessThan(0.1)
  })
})
