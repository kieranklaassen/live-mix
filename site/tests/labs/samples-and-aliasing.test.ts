import { describe, expect, it } from 'vitest'
import { expectSoundLab, lab, peak, seconds, silence } from './support.ts'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'

const NAME = 'samples-and-aliasing'
const RATE = 48_000
/** A bin of the page's spectrum: 48,000 / 4,096 Hz. */
const BIN = RATE / 4096

// The lab plays by itself: nothing goes in.
const nothing = () => silence(seconds(2))

/** Where a frequency comes out once sampled: its distance to the nearest multiple of the rate. */
const folded = (hz: number) => Math.abs(hz - RATE * Math.round(hz / RATE))

/** The highest point of an audio tap's spectrum: where it stands and how high. */
function top(theLab: Lab, tap: string, from = 0, to = RATE / 2): { hz: number; db: number } {
  const levels = theLab.spectrum(tap)
  let best = Math.round(from / BIN)
  for (let k = best; k <= Math.round(to / BIN) && k < levels.length; k += 1) {
    if (levels[k]! > levels[best]!) best = k
  }
  return { hz: best * BIN, db: levels[best]! }
}

/** The partials of both saws, each with the frequency it has before folding and where it lands. */
function partials(result: RenderResult) {
  const naive = result.taps.partialsNaive!
  const kit = result.taps.partialsKit!.channels_data[0]!
  const taken = result.taps.reduction!.channels_data[0]!
  return Array.from(naive.channels_data[0]!, (level, index) => {
    const hz = naive.x0 * (index + 1)
    return {
      k: index + 1,
      hz,
      lands: folded(hz),
      naive: level,
      kit: kit[index]!,
      taken: taken[index]!,
    }
  })
}

/**
 * The level of one line of a loop, in dB where a full-scale sine reads 0: the Fourier sum at
 * exactly `hz` over one second, past the 20 ms where the loop's wrap is crossfaded. For a
 * frequency that is a whole number of hertz, a second holds whole cycles and nothing leaks.
 */
function line(x: Float32Array, hz: number): number {
  let re = 0
  let im = 0
  for (let i = 0; i < RATE; i += 1) {
    const angle = (2 * Math.PI * hz * i) / RATE
    re += x[960 + i]! * Math.cos(angle)
    im -= x[960 + i]! * Math.sin(angle)
  }
  return 20 * Math.log10(Math.max(1e-9, (2 / RATE) * Math.hypot(re, im)))
}

const power = (levels: number[]) =>
  10 * Math.log10(levels.reduce((sum, db) => sum + 10 ** (db / 10), 0))

describe('samples, sine waves and aliasing', () => {
  it('is a sound lab with nothing going in: every tap says something, loops, and answers to every control', async () => {
    const osc = await lab(NAME)
    const result = osc.render(nothing(), {})
    expectSoundLab(osc, nothing(), result)
  })

  it("reads the kit's table 133 dB under the sine it stands for (claim table-error)", async () => {
    const osc = await lab(NAME)
    for (const freq of [440, 1000, 2000, 20_000]) {
      const error = osc.render(nothing(), { freq }).checks.tableError!
      expect(error).toBeLessThan(-131)
      expect(error).toBeGreaterThan(-135)
    }
  })

  it('puts the samples on the wave they were taken from, and on the lowest wave through them', async () => {
    const osc = await lab(NAME)
    for (const freq of [2000, 20_000, 30_000, 47_000]) {
      const out = osc.render(nothing(), { freq })
      const samples = out.taps.samples!.channels_data[0]!
      const wave = out.taps.wave!.channels_data[0]!
      const alias = out.taps.alias!.channels_data[0]!
      expect(samples.length).toBe(25)
      for (let n = 0; n < samples.length; n += 1) {
        // 1e-5 is the rounding of a phase kept in a float, 24 steps on.
        expect(Math.abs(samples[n]! - wave[40 * n]!)).toBeLessThan(1e-5)
        expect(Math.abs(samples[n]! - alias[40 * n]!)).toBeLessThan(1e-5)
      }
    }
  })

  it('keeps a sine with 2.004 samples to a cycle whole: 23,952 Hz peaks within a bin of itself, at full level (claim near-nyquist)', async () => {
    const osc = await lab(NAME)
    osc.render(nothing(), { freq: 23_952 })
    const found = top(osc, 'sine')
    expect(Math.abs(found.hz - 23_952)).toBeLessThan(BIN)
    expect(found.db).toBeGreaterThan(-0.2)
    expect(found.db).toBeLessThan(0.05)
  })

  it('brings a sine at 30 kHz out at 18 kHz, at full level (claim fold-30k)', async () => {
    const osc = await lab(NAME)
    const out = osc.render(nothing(), { freq: 30_000 })
    const found = top(osc, 'sine')
    expect(found.hz).toBe(18_000)
    expect(Math.abs(found.db)).toBeLessThan(0.01)
    expect(out.checks.lands).toBe(18_000)
  })

  it('takes the same samples from 30 kHz as from 18 kHz, with the sign turned (claim fold-same-samples)', async () => {
    const osc = await lab(NAME)
    const high = osc.render(nothing(), { freq: 30_000 }).taps.sine!.channels_data[0]!
    const low = osc.render(nothing(), { freq: 18_000 }).taps.sine!.channels_data[0]!
    expect(peak(high)).toBeGreaterThan(0.99)
    let worst = 0
    for (let i = 0; i < high.length; i += 1) worst = Math.max(worst, Math.abs(high[i]! + low[i]!))
    expect(worst).toBeLessThan(1e-6)
  })

  it('brings 47 kHz out at 1 kHz (claim fold-47k)', async () => {
    const osc = await lab(NAME)
    const out = osc.render(nothing(), { freq: 47_000 })
    expect(Math.abs(top(osc, 'sine').hz - 1000)).toBeLessThan(BIN)
    expect(out.checks.lands).toBe(1000)
  })

  it('measures the peak where the folding formula puts it, within 0.2 Hz, from 500 Hz to 47.5 kHz (claim fold-curve)', async () => {
    const osc = await lab(NAME)
    const out = osc.render(nothing(), {})
    expect(out.checks.foldError).toBeLessThan(0.25)
    const measured = out.taps.folding!
    expect(measured.length).toBe(48)
    // Rising to 23.5 kHz at the 24th point, and falling from there.
    const data = measured.channels_data[0]!
    for (let p = 0; p < 48; p += 1)
      expect(Math.abs(data[p]! - folded(500 + 1000 * p))).toBeLessThan(0.25)
    expect(data[23]!).toBeGreaterThan(23_499)
    expect(data[47]!).toBeLessThan(501)
  })

  it('shows a sine at 23,952 Hz as dots that turn sign each sample and stay under a sixth of full level (claim near-nyquist-dots)', async () => {
    const osc = await lab(NAME)
    const dots = osc.render(nothing(), { freq: 23_952 }).taps.samples!.channels_data[0]!
    expect(dots.length).toBe(25)
    expect(peak(dots)).toBeLessThan(1 / 6)
    expect(peak(dots)).toBeGreaterThan(0.14)
    for (let n = 2; n < 25; n += 1) expect(dots[n]! * dots[n - 1]!).toBeLessThan(0)
  })

  it('samples a sine at exactly 24 kHz, started at zero, as silence (claim nyquist-silence)', async () => {
    const osc = await lab(NAME)
    const out = osc.render(nothing(), { freq: 24_000 })
    expect(peak(out.taps.sine!.channels_data[0]!)).toBeLessThan(1e-12)
    // A bin's width under it, the sine is all there.
    const under = osc.render(nothing(), { freq: 24_000 - 48 })
    expect(peak(under.taps.sine!.channels_data[0]!)).toBeGreaterThan(0.99)
  })

  it('finds the naive saw at 2/(πk): −3.9 dB at the fundamental, 6 dB less at twice it (claim naive-levels)', async () => {
    const osc = await lab(NAME)
    const found = partials(osc.render(nothing(), {}))
    for (const { k, naive } of found.slice(0, 27)) {
      expect(Math.abs(naive - 20 * Math.log10(2 / (Math.PI * k)))).toBeLessThan(0.01)
    }
    expect(found[0]!.naive).toBeCloseTo(-3.92, 1)
    expect(found[0]!.naive - found[1]!.naive).toBeCloseTo(6.02, 1)
  })

  it('finds partial 12 of the saw the lab starts on at 46,072 Hz, landing near 1,920 Hz, at −25.5 dB in the naive saw (claim naive-fold-12)', async () => {
    const osc = await lab(NAME)
    const twelfth = partials(osc.render(nothing(), {}))[11]!
    // The measuring frame's nearest frequency to 3,840 Hz is 3,839.4 Hz.
    expect(Math.abs(twelfth.hz - 46_080)).toBeLessThan(10)
    expect(Math.abs(twelfth.lands - 1920)).toBeLessThan(10)
    expect(twelfth.naive).toBeCloseTo(-25.5, 1)
  })

  it('finds six lines of folds between the harmonics of the naive loop, each from −19.7 to −21.9 dB (claim naive-lines)', async () => {
    const osc = await lab(NAME)
    const plain = osc.render(nothing(), {}).taps.naive!.channels_data[0]!
    const lines = [1920, 5760, 9600, 13_440, 17_280, 21_120].map((hz) => line(plain, hz))
    expect(lines[0]!).toBeCloseTo(-21.9, 1)
    expect(lines[5]!).toBeCloseTo(-19.7, 1)
    for (const level of lines) {
      expect(level).toBeGreaterThan(-22)
      expect(level).toBeLessThan(-19.6)
    }
    // And nothing anywhere else: the loop is one pattern of 25 samples.
    const levels = osc.spectrum('naive')
    for (let k = 0; k < levels.length; k += 1) {
      const hz = k * BIN
      if (Math.abs(hz - 1920 * Math.round(hz / 1920)) > 400) expect(levels[k]!).toBeLessThan(-90)
    }
  })

  it('shows 13 peaks above −60 dB in the naive loop at 3,840 Hz and more than fifty once the saw moves off it (claim thicket)', async () => {
    const osc = await lab(NAME)
    const lines = (note: number) => {
      osc.render(nothing(), { note })
      const levels = osc.spectrum('naive')
      let count = levels[0]! > -60 && levels[0]! > levels[1]! ? 1 : 0
      for (let k = 1; k < levels.length - 1; k += 1)
        if (levels[k]! > -60 && levels[k]! > levels[k - 1]! && levels[k]! >= levels[k + 1]!)
          count += 1
      return count
    }
    // Six harmonics, six lines of folds and the one at 0 Hz.
    expect(lines(3840)).toBe(13)
    for (const note of [3520, 3700, 3800, 3880]) expect(lines(note)).toBeGreaterThan(50)
  })

  it("leaves partial 12 at −80.7 dB in the kit's saw, 55.2 dB lower (claim kit-fold-12)", async () => {
    const osc = await lab(NAME)
    const twelfth = partials(osc.render(nothing(), {}))[11]!
    expect(twelfth.kit).toBeCloseTo(-80.7, 1)
    expect(twelfth.taken).toBeCloseTo(-55.2, 1)
  })

  it("reads the line at 1,920 Hz at −76.0 dB in the kit's loop against −21.9 dB in the naive one (claim kit-line-low)", async () => {
    const osc = await lab(NAME)
    const out = osc.render(nothing(), {})
    expect(line(out.taps.saw!.channels_data[0]!, 1920)).toBeCloseTo(-76.0, 0)
    expect(line(out.taps.naive!.channels_data[0]!, 1920)).toBeCloseTo(-21.9, 1)
  })

  it("reads the line at 21,120 Hz at −30.6 dB in the kit's loop, 10.9 dB under the naive one (claim kit-line-top)", async () => {
    const osc = await lab(NAME)
    const out = osc.render(nothing(), {})
    const band = line(out.taps.saw!.channels_data[0]!, 21_120)
    const plain = line(out.taps.naive!.channels_data[0]!, 21_120)
    expect(band).toBeCloseTo(-30.6, 1)
    expect(plain - band).toBeCloseTo(10.9, 1)
    // Between the two, the kit's lines fall the lower they land.
    const lines = [1920, 5760, 9600, 13_440, 17_280, 21_120].map((hz) =>
      line(out.taps.saw!.channels_data[0]!, hz),
    )
    for (let i = 1; i < lines.length; i += 1) expect(lines[i]!).toBeGreaterThan(lines[i - 1]! + 4)
  })

  it("adds the correction to the naive saw and gets the kit's saw, to the last bit (claim sum-exact)", async () => {
    const osc = await lab(NAME)
    for (const note of [55, 440, 3520, 8000]) {
      expect(osc.render(nothing(), { note }).checks.sumError).toBe(-140)
    }
  })

  it('corrects two samples in each cycle and no more, by 1 at most (claim two-samples)', async () => {
    const osc = await lab(NAME)
    for (const note of [110, 440, 3840, 8000]) {
      const fix = osc.render(nothing(), { note }).taps.correction!.channels_data[0]!
      expect(peak(fix)).toBeLessThanOrEqual(1)
      // Past the 20 ms where the loop's wrap is crossfaded.
      let moved = 0
      for (let i = 960; i < fix.length; i += 1) if (fix[i] !== 0) moved += 1
      const perCycle = moved / (((fix.length - 960) * note) / RATE)
      expect(perCycle).toBeGreaterThan(1.98)
      expect(perCycle).toBeLessThan(2.02)
    }
  })

  it('pulls the sample before the edge down by 0.42 and the one after it up by 0.12 in the picture of the edge (claim edge-pull)', async () => {
    const osc = await lab(NAME)
    const out = osc.render(nothing(), {})
    const plain = out.taps.edgeNaive!.channels_data[0]!
    const band = out.taps.edgeKit!.channels_data[0]!
    expect(plain.length).toBe(17)
    for (let n = 0; n < 17; n += 1) {
      if (n === 7) expect(plain[n]! - band[n]!).toBeCloseTo(0.4225, 3)
      else if (n === 8) expect(band[n]! - plain[n]!).toBeCloseTo(0.1225, 3)
      else expect(band[n]).toBe(plain[n])
    }
    // The kit's samples lie on the saw with its edge spread.
    const smooth = out.taps.edgeSmooth!.channels_data[0]!
    for (let n = 0; n < 17; n += 1) expect(Math.abs(band[n]! - smooth[40 * n]!)).toBeLessThan(1e-5)
  })

  it('measures every partial where the triangle formula puts it, within 0.1 dB (claim smooth-error)', async () => {
    const osc = await lab(NAME)
    for (const note of [55, 110, 440, 1760, 3520, 4000, 8000]) {
      expect(osc.render(nothing(), { note }).checks.smoothError).toBeLessThan(0.1)
    }
  })

  it('at 4 kHz, takes 41.9 dB or more off the folds that land at or under the fundamental (claim fold-4k-low), and 13.1 dB off all the folds together (claim fold-4k-all)', async () => {
    const osc = await lab(NAME)
    const out = osc.render(nothing(), { note: 4000 })
    // The measuring frame's nearest frequency: 4,000.5 Hz.
    expect(Math.abs(out.taps.reduction!.x0 - 4000)).toBeLessThan(1)
    const folds = partials(out).filter((one) => one.hz > RATE / 2)
    const low = folds.filter((one) => one.lands <= 4010)
    expect(low.map((one) => one.k)).toEqual([11, 12, 13, 23])
    const least = Math.max(...low.map((one) => one.taken))
    expect(least).toBeLessThan(-41.5)
    expect(least).toBeGreaterThan(-42.3)
    const all = power(folds.map((one) => one.kit)) - power(folds.map((one) => one.naive))
    expect(all).toBeLessThan(-12.8)
    expect(all).toBeGreaterThan(-13.4)
    // The scenario this lesson was given, 40 dB off every fold, does not hold: the fold that
    // lands highest loses 7.8 dB.
    const highest = folds.reduce((a, b) => (b.lands > a.lands ? b : a))
    expect(highest.taken).toBeGreaterThan(-8.2)
  })

  it("dulls the saw's own partials: 0.18 dB at the fundamental (claim droop-fundamental), 7.2 dB at the sixth, 23,036 Hz (claim droop-top)", async () => {
    const osc = await lab(NAME)
    const found = partials(osc.render(nothing(), {}))
    expect(found[0]!.taken).toBeCloseTo(-0.18, 2)
    expect(Math.abs(found[5]!.hz - 23_036)).toBeLessThan(1)
    expect(found[5]!.taken).toBeCloseTo(-7.2, 1)
  })

  it('at 440 Hz, keeps every fold that lands under 12 kHz below −63 dB (claim promise-low) and leaves the strongest at −46.8 dB near 23,750 Hz (claim promise-top)', async () => {
    const osc = await lab(NAME)
    const folds = partials(osc.render(nothing(), { note: 440 })).filter((one) => one.hz > RATE / 2)
    const low = folds.filter((one) => one.lands < 12_000)
    expect(Math.max(...low.map((one) => one.kit))).toBeLessThan(-63)
    const strongest = folds.reduce((a, b) => (b.kit > a.kit ? b : a))
    expect(strongest.kit).toBeCloseTo(-46.8, 1)
    expect(Math.abs(strongest.lands - 23_750)).toBeLessThan(5)
    // The naive saw's strongest fold, for the comparison the lesson makes.
    expect(Math.max(...folds.map((one) => one.naive))).toBeCloseTo(-38.7, 1)
  })

  it('at exactly 4 kHz, makes the naive saw one pattern of 12 samples, its folds all on its harmonics (claim hidden-4k)', async () => {
    const osc = await lab(NAME)
    const plain = osc.render(nothing(), { note: 4000 }).taps.naive!.channels_data[0]!
    let worst = 0
    for (let i = 960; i + 12 < plain.length; i += 1) {
      worst = Math.max(worst, Math.abs(plain[i + 12]! - plain[i]!))
    }
    expect(worst).toBeLessThan(1e-3)
    // Nothing stands between the harmonics: half way from each to the next the spectrum is empty.
    const levels = osc.spectrum('naive')
    for (let harmonic = 0; harmonic < 6; harmonic += 1) {
      const between = Math.round((4000 * harmonic + 2000) / BIN)
      expect(levels[between]!).toBeLessThan(-90)
    }
  })
})
