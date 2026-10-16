import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  BIN,
  FADE,
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  peak,
  RATE,
  rms,
  seconds,
  silence,
} from './support.ts'

const NAME = 'samples-and-aliasing'

// The lab plays by itself: nothing goes in.
const nothing = () => silence(seconds(2))

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings(NAME)!

/** The steps of the build path, as the lab numbers them. */
const STEP = { phase: 0, ramp: 1, step: 2, fold: 3, slope: 4 }

/** The first channel of a tap. */
const tap = (result: RenderResult, id: string) => result.taps[id]!.channels_data[0]!

/** A named set, rendered as its card plays it. */
function played(theLab: Lab, name: string): RenderResult {
  const { values } = resolveSet(theLab.description, settings.sets[name]!)
  return theLab.render(nothing(), values)
}

/** Where a frequency comes out once sampled: its distance to the nearest multiple of the rate. */
const folded = (hz: number) => Math.abs(hz - RATE * Math.round(hz / RATE))

/** The highest point of an audio tap's spectrum: where it stands and how high. */
function top(theLab: Lab, id: string, from = 0, to = RATE / 2): { hz: number; db: number } {
  const levels = theLab.spectrum(id)
  let best = Math.round(from / BIN)
  for (let k = best; k <= Math.round(to / BIN) && k < levels.length; k += 1) {
    if (levels[k]! > levels[best]!) best = k
  }
  return { hz: best * BIN, db: levels[best]! }
}

/**
 * What an audio tap of the lab's last render holds from `from` to `to` hertz, in dB where a
 * full-scale sine reads 0: the bins of the lab's spectrum between the two, added up. A sine
 * under the lab's Hann window is spread over bins that add up to 1.5 times its own power.
 */
function band(theLab: Lab, id: string, from: number, to: number): number {
  const levels = theLab.spectrum(id)
  let sum = 0
  for (let k = Math.ceil(from / BIN); k * BIN < to; k += 1) sum += 10 ** (levels[k]! / 10)
  return 10 * Math.log10(sum / 1.5)
}

/** The partials of both saws, each with the frequency it has before folding and where it lands. */
function partials(result: RenderResult) {
  const naive = result.taps.partialsNaive!
  const kit = tap(result, 'partialsKit')
  const taken = tap(result, 'reduction')
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

/** The odd partials of both triangles, the same way. */
function corners(result: RenderResult) {
  const naive = result.taps.cornerNaive!
  const kit = tap(result, 'cornerKit')
  const taken = tap(result, 'cornerTaken')
  return Array.from(naive.channels_data[0]!, (level, index) => {
    const k = 2 * index + 1
    return { k, hz: naive.x0 * k, naive: level, kit: kit[index]!, taken: taken[index]! }
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

/**
 * Where the sound stands at a moment, in hertz: the middle of what a Hann window 1,024 samples
 * long holds, centred `at` seconds in, each of its 513 frequencies weighed by its power. For
 * one sine that glides, that is the frequency it has at the window's middle.
 */
function standsAt(x: Float32Array, at: number): number {
  const size = 1024
  const from = seconds(at) - size / 2
  let weighed = 0
  let whole = 0
  for (let k = 0; k <= size / 2; k += 1) {
    let re = 0
    let im = 0
    for (let n = 0; n < size; n += 1) {
      const v = x[from + n]! * (0.5 - 0.5 * Math.cos((2 * Math.PI * n) / size))
      re += v * Math.cos((2 * Math.PI * k * n) / size)
      im -= v * Math.sin((2 * Math.PI * k * n) / size)
    }
    const power = re * re + im * im
    weighed += power * ((k * RATE) / size)
    whole += power
  }
  return weighed / whole
}

const power = (levels: number[]) =>
  10 * Math.log10(levels.reduce((sum, db) => sum + 10 ** (db / 10), 0))

/** Where the folds of a saw at 3,840 Hz land between its own partials: half way from each to the next. */
const BETWEEN = [1920, 5760, 9600, 13_440, 17_280, 21_120]

/**
 * What a whole loop holds from `from` to `to` hertz, in dB where a full-scale sine reads 0: the
 * Fourier sum over all of the loop under a Hann window, at every half hertz between the two,
 * added up. Half a hertz is one bin of a two-second loop, and a sine under a Hann window is
 * spread over bins that add up to 1.5 times its own power, wherever between two bins it lies.
 */
function loopBand(x: Float32Array, from: number, to: number): number {
  const windowed = Float64Array.from(
    x,
    (v, i) => v * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / x.length)),
  )
  let sum = 0
  for (let hz = from; hz <= to; hz += 0.5) {
    let re = 0
    let im = 0
    for (let i = 0; i < windowed.length; i += 1) {
      const angle = (2 * Math.PI * hz * i) / RATE
      re += windowed[i]! * Math.cos(angle)
      im -= windowed[i]! * Math.sin(angle)
    }
    sum += ((4 / windowed.length) * Math.hypot(re, im)) ** 2
  }
  return 10 * Math.log10(sum / 1.5)
}

/** How many peaks an audio tap's spectrum has above `floor` dB, the one at 0 Hz among them. */
function peaksAbove(theLab: Lab, id: string, floor: number): number {
  const levels = theLab.spectrum(id)
  let count = levels[0]! > floor && levels[0]! > levels[1]! ? 1 : 0
  for (let k = 1; k < levels.length - 1; k += 1)
    if (levels[k]! > floor && levels[k]! > levels[k - 1]! && levels[k]! >= levels[k + 1]!)
      count += 1
  return count
}

describe('samples, sine waves and aliasing', () => {
  it('is a sound lab with nothing going in: every tap says something, loops, and answers to every control', async () => {
    const osc = await lab(NAME)
    const result = osc.render(nothing(), {})
    expectSoundLab(osc, nothing(), result)
  })

  it('has a build path of five steps, each changing a built tap and none the main path, the last held to the kit', async () => {
    const osc = await lab(NAME)
    expectBuild(osc, nothing())
    // On a note that glides too.
    expectBuild(osc, nothing(), { note: 880, glide: 2 })
  })

  it('renders every named set, finite and heard', async () => {
    const osc = await lab(NAME)
    for (const [name, set] of Object.entries(settings.sets)) {
      const sound = tap(played(osc, name), set.tap!)
      expect(
        sound.every((v) => Number.isFinite(v)),
        name,
      ).toBe(true)
      expect(gainToDb(rms(sound)), `${name} is heard`).toBeGreaterThan(-20)
      // The lesson lists no source: every card plays the lab's own oscillators.
      expect(set.source, name).toBeUndefined()
    }
  })

  // ---- part 1 -------------------------------------------------------------------------------

  it('keeps a loop of two seconds as 96,000 samples (claim loop-samples)', async () => {
    const osc = await lab(NAME)
    const out = osc.render(nothing(), {})
    for (const id of ['sweep', 'sine', 'naive', 'saw']) {
      expectWritten(out.taps[id]!.length, '96,000 samples')
    }
  })

  it('finds the rising sine at 12 kHz half a second in, where it was asked for 12 kHz, and at 12 kHz again a second later, where it was asked for 36 kHz (claim sweep-mirror)', async () => {
    const osc = await lab(NAME)
    const sweep = tap(played(osc, 'rising'), 'sweep')
    expectWritten(standsAt(sweep, 0.5) / 1000, '12 kHz')
    expectWritten(standsAt(sweep, 1.5) / 1000, '12 kHz')
    // Both measure within a thousandth of a hertz of 12 kHz: a hertz is room enough.
    expect(Math.abs(standsAt(sweep, 0.5) - 12_000)).toBeLessThan(1)
    expect(Math.abs(standsAt(sweep, 1.5) - 12_000)).toBeLessThan(1)
    // What was asked for at those two moments: the step grows evenly to a whole cycle a sample.
    expect((RATE * 0.5) / 2).toBe(12_000)
    expect((RATE * 1.5) / 2).toBe(36_000)
  })

  it('shows the rising sine climb for a second to 24 kHz, and fall for a second (claim sweep-turns)', async () => {
    const osc = await lab(NAME)
    const picture = osc.render(nothing(), {}).taps.sweepPicture!
    const data = picture.channels_data[0]!
    const rows = data.length / picture.columns
    const peaks = Array.from({ length: picture.columns }, (_, column) => {
      let best = 0
      for (let row = 1; row < rows; row += 1) {
        if (data[column * rows + row]! > data[column * rows + best]!) best = row
      }
      return (best * (RATE / 2)) / (rows - 1)
    })
    const highest = peaks.indexOf(Math.max(...peaks))
    expectWritten(peaks[highest]! / 1000, '24 kHz')
    // The column that starts 10 ms before the loop's middle is the one centred on it.
    expect(Math.abs(highest - picture.columns / 2)).toBeLessThanOrEqual(1)
    for (let c = 1; c < picture.columns; c += 1) {
      if (c <= highest) expect(peaks[c]!, `column ${c}`).toBeGreaterThanOrEqual(peaks[c - 1]!)
      else expect(peaks[c]!, `column ${c}`).toBeLessThanOrEqual(peaks[c - 1]!)
    }
    // Played at a quarter of full scale.
    expect(peak(tap(osc.render(nothing(), {}), 'sweep'))).toBeCloseTo(0.25, 4)
  })

  it('finds a tone at 1,920 Hz in the naive saw, 18 dB under the fundamental of its note (claim under-naive), and 72 dB under it in the kit’s saw (claim under-kit)', async () => {
    const osc = await lab(NAME)
    const plain = tap(played(osc, 'naive'), 'naive')
    expectWritten(line(plain, 3840) - line(plain, 1920), '18 dB')
    const kit = tap(played(osc, 'kit'), 'saw')
    expectWritten(line(kit, 3840) - line(kit, 1920), '72 dB')
  })

  // ---- part 2 -------------------------------------------------------------------------------

  it('puts the samples on the wave they were taken from, and on the lowest wave through them', async () => {
    const osc = await lab(NAME)
    for (const freq of [2000, 20_000, 30_000, 47_000]) {
      const out = osc.render(nothing(), { freq })
      const samples = tap(out, 'samples')
      const wave = tap(out, 'wave')
      const alias = tap(out, 'alias')
      expect(samples.length).toBe(25)
      for (let n = 0; n < samples.length; n += 1) {
        // 1e-5 is the rounding of a phase kept in a float, 24 steps on.
        expect(Math.abs(samples[n]! - wave[40 * n]!)).toBeLessThan(1e-5)
        expect(Math.abs(samples[n]! - alias[40 * n]!)).toBeLessThan(1e-5)
      }
    }
  })

  it('brings a sine at 30 kHz out at 18 kHz, at full level (claim fold-30k)', async () => {
    const osc = await lab(NAME)
    const out = osc.render(nothing(), { freq: 30_000 })
    const found = top(osc, 'sine')
    expect(found.hz).toBe(18_000)
    expectWritten(found.hz / 1000, '18 kHz')
    expect(Math.abs(found.db)).toBeLessThan(0.01)
    expect(out.checks.lands).toBe(18_000)
  })

  it('takes the same samples from 30 kHz as from 18 kHz, with the sign turned (claim fold-same-samples)', async () => {
    const osc = await lab(NAME)
    const high = tap(osc.render(nothing(), { freq: 30_000 }), 'sine')
    const low = tap(osc.render(nothing(), { freq: 18_000 }), 'sine')
    expect(peak(high)).toBeGreaterThan(0.99)
    // Sample by sample: each is the other with its sign turned, or the two stand at the table's
    // own zero, which the table holds as one number, 1.2e-16, for both.
    let turned = 0
    let atZero = 0
    for (let i = 0; i < high.length; i += 1) {
      if (high[i] === -low[i]!) turned += 1
      else if (high[i] === low[i] && Math.abs(high[i]!) < 1e-15) atZero += 1
    }
    expect(turned + atZero).toBe(high.length)
    expect(turned).toBeGreaterThan(0.8 * high.length)
    expect(atZero).toBeGreaterThan(0)
  })

  it('brings 47 kHz out at 1 kHz (claim fold-47k)', async () => {
    const osc = await lab(NAME)
    const out = osc.render(nothing(), { freq: 47_000 })
    expect(Math.abs(top(osc, 'sine').hz - 1000)).toBeLessThan(BIN)
    expectWritten(out.checks.lands! / 1000, '1 kHz')
    expect(out.checks.lands).toBe(1000)
  })

  it('measures the peak where the folding formula puts it, within 0.2 Hz, from 500 Hz to 47.5 kHz (claim fold-curve)', async () => {
    const osc = await lab(NAME)
    const out = osc.render(nothing(), {})
    expectWritten(out.checks.foldError!, 'under 0.2 Hz')
    const measured = out.taps.folding!
    expect(measured.length).toBe(48)
    // Rising to 23.5 kHz at the 24th point, and falling from there.
    const data = measured.channels_data[0]!
    for (let p = 0; p < 48; p += 1)
      expect(Math.abs(data[p]! - folded(500 + 1000 * p))).toBeLessThan(0.2)
    expect(data[23]!).toBeGreaterThan(23_499)
    expect(data[47]!).toBeLessThan(501)
  })

  // ---- part 3 -------------------------------------------------------------------------------

  it('at 110 Hz, fits 218 partials under half the rate, has its strongest fold at −50.7 dB, and holds −51.6 dB under the note, from 5 Hz to 105 Hz (claim use-low)', async () => {
    const osc = await lab(NAME)
    const out = played(osc, 'low')
    const found = partials(out)
    expect(found.filter((one) => one.hz < RATE / 2).length).toBe(218)
    // At exactly 110 Hz too, which the measuring frame's 109.9 Hz stands for.
    expect(Math.floor(RATE / 2 / 110)).toBe(218)
    const folds = found.filter((one) => one.hz > RATE / 2)
    expectWritten(Math.max(...folds.map((one) => one.naive)), '−50.7 dB')
    // Under the note a saw has nothing of its own, so what the loop holds there is folds: all
    // of them, however high they were asked for. The band stops short of 0 Hz and of the note.
    expectWritten(loopBand(tap(out, 'naive'), 5, 105), '−51.6 dB')
    // The partials the measuring frame counts, up to twice the sample rate, are most of it.
    const counted = power(folds.filter((one) => one.lands < 110).map((one) => one.naive))
    expect(counted).toBeGreaterThan(-53.5)
    expect(counted).toBeLessThan(-51.6)
  })

  it('at 3,840 Hz, fits six partials under half the rate, and adds the six lines of folds between them up to −13.2 dB in the naive saw and −28.9 dB in the kit’s (claim use-high)', async () => {
    const osc = await lab(NAME)
    const out = played(osc, 'naive')
    // The measuring frame reaches twice the sample rate: six of its partials are under half of it.
    expect(partials(out).filter((one) => one.hz < RATE / 2).length).toBe(6)
    // In the loop as it sounds, each line holds everything that lands there, from however high.
    expectWritten(power(BETWEEN.map((hz) => line(tap(out, 'naive'), hz))), '−13.2 dB')
    expectWritten(power(BETWEEN.map((hz) => line(tap(out, 'saw'), hz))), '−28.9 dB')
    // The card called "kit" plays the same settings.
    expect(resolveSet(osc.description, settings.sets.kit!).values).toEqual(
      resolveSet(osc.description, settings.sets.naive!).values,
    )
  })

  it('under a note gliding from 880 Hz, holds −30.4 dB below 800 Hz in the naive saw (claim use-moving) and −71 dB in the kit’s (claim way-watched)', async () => {
    const osc = await lab(NAME)
    played(osc, 'moving')
    expectWritten(band(osc, 'naive', 3 * BIN, 800), '−30.4 dB')
    played(osc, 'watched')
    expectWritten(band(osc, 'saw', 3 * BIN, 800), '−71 dB')
    // The two cards differ only in the tap they play.
    expect(settings.sets.moving!.values).toEqual(settings.sets.watched!.values)
    expect(settings.sets.moving!.values).toEqual({ note: 880, glide: 2 })
  })

  it('samples a sine at 12 kHz as one line at 12 kHz, with nothing else over −120 dB (claim use-pure)', async () => {
    const osc = await lab(NAME)
    played(osc, 'pure')
    const levels = osc.spectrum('sine')
    const found = top(osc, 'sine')
    expectWritten(found.hz / 1000, '12 kHz')
    expect(Math.abs(found.db)).toBeLessThan(0.01)
    let other = -Infinity
    for (let k = 0; k < levels.length; k += 1) {
      if (Math.abs(k * BIN - found.hz) > 4 * BIN) other = Math.max(other, levels[k]!)
    }
    expectWritten(other, 'under −120 dB')
  })

  // ---- part 4: the build ----------------------------------------------------------------------

  it('builds a line at 1,920 Hz into the sound with the naive saw: −21.9 dB, where the step before had none (claim build-ramp)', async () => {
    const osc = await lab(NAME)
    const at = (build: number) => line(tap(osc.render(nothing(), { build }), 'built'), 1920)
    expectWritten(at(STEP.ramp), '−21.9 dB')
    // With the piece switched off: a sine has one line, and it is not this one.
    expect(matchesWritten(at(STEP.phase), '−21.9 dB')).toBe(false)
    expect(at(STEP.phase)).toBeLessThan(-120)
  })

  it('takes that line down to −76.0 dB with the step correction (claim build-step)', async () => {
    const osc = await lab(NAME)
    const at = (build: number) => line(tap(osc.render(nothing(), { build }), 'built'), 1920)
    expectWritten(at(STEP.step), '−76.0 dB')
    // With the piece switched off.
    expect(matchesWritten(at(STEP.ramp), '−76.0 dB')).toBe(false)
  })

  it('folds the ramp into a triangle whose line at 1,920 Hz reads −44.9 dB and whose line at 21,120 Hz reads −35.2 dB (claim build-fold)', async () => {
    const osc = await lab(NAME)
    const at = (build: number, hz: number) =>
      line(tap(osc.render(nothing(), { build }), 'built'), hz)
    expectWritten(at(STEP.fold, 1920), '−44.9 dB')
    expectWritten(at(STEP.fold, 21_120), '−35.2 dB')
    // With the piece switched off, the build is the corrected saw.
    expect(matchesWritten(at(STEP.step, 1920), '−44.9 dB')).toBe(false)
    expect(matchesWritten(at(STEP.step, 21_120), '−35.2 dB')).toBe(false)
  })

  it('takes those two lines down to −102.9 dB and −45.74 dB with the slope correction (claim build-slope)', async () => {
    const osc = await lab(NAME)
    const at = (build: number, hz: number) =>
      line(tap(osc.render(nothing(), { build }), 'built'), hz)
    expectWritten(at(STEP.slope, 1920), '−102.9 dB')
    expectWritten(at(STEP.slope, 21_120), '−45.74 dB')
    // With the piece switched off.
    expect(matchesWritten(at(STEP.fold, 1920), '−102.9 dB')).toBe(false)
    expect(matchesWritten(at(STEP.fold, 21_120), '−45.74 dB')).toBe(false)
  })

  it('builds the kit’s triangle, sample for sample (claim build-same), and on the way the kit’s saw (claim build-saw-same)', async () => {
    const osc = await lab(NAME)
    for (const values of [
      {},
      { note: 55 },
      { note: 440 },
      { note: 8000 },
      { note: 880, glide: 2 },
    ]) {
      for (const build of [STEP.phase, STEP.step, STEP.slope]) {
        const out = osc.render(nothing(), { ...values, build })
        // −140 dB is the floor of the lab's reading: nothing differs, or less than that.
        expect(out.checks.builtDifference).toBe(-140)
        expect(out.checks.builtSaw).toBe(-140)
      }
      // So the taps are compared too, every sample of each: at the last step the build is the
      // kit's triangle, and at the third its saw and its correction.
      const last = osc.render(nothing(), { ...values, build: STEP.slope })
      expect(tap(last, 'built'), JSON.stringify(values)).toEqual(tap(last, 'triangle'))
      const third = osc.render(nothing(), { ...values, build: STEP.step })
      expect(tap(third, 'built'), JSON.stringify(values)).toEqual(tap(third, 'saw'))
      expect(tap(third, 'builtFix'), JSON.stringify(values)).toEqual(tap(third, 'correction'))
    }
    const last = osc.render(nothing(), { build: STEP.slope })
    // The phase the build keeps is the kit's.
    expect(tap(last, 'builtPhase')).toEqual(tap(last, 'phase'))
  })

  // ---- part 5: the kit, stage by stage --------------------------------------------------------

  it('steps the phase by the same amount each sample and takes a whole cycle off when it passes 1', async () => {
    const osc = await lab(NAME)
    const out = osc.render(nothing(), {})
    const dots = tap(out, 'phase')
    const ramp = tap(out, 'phaseLine')
    expect(dots.length).toBe(25)
    const step = 3840 / RATE
    for (let n = 0; n < dots.length; n += 1) {
      expect(dots[n]!).toBeGreaterThanOrEqual(0)
      expect(dots[n]!).toBeLessThan(1)
      expect(Math.abs(dots[n]! - ramp[40 * n]!)).toBeLessThan(1e-5)
      if (n > 0) {
        const moved = dots[n]! - dots[n - 1]!
        expect(Math.abs((moved < 0 ? moved + 1 : moved) - step)).toBeLessThan(1e-6)
      }
    }
  })

  it("reads the kit's table 133 dB under the sine it stands for (claim table-error)", async () => {
    const osc = await lab(NAME)
    for (const freq of [440, 1000, 2000, 20_000]) {
      expectWritten(-osc.render(nothing(), { freq }).checks.tableError!, '133 dB')
    }
  })

  it('finds the naive saw at 2/(πk): −3.9 dB at the fundamental, 6 dB less at twice it (claim naive-levels)', async () => {
    const osc = await lab(NAME)
    const found = partials(osc.render(nothing(), {}))
    for (const { k, naive } of found.slice(0, 27)) {
      expect(Math.abs(naive - 20 * Math.log10(2 / (Math.PI * k)))).toBeLessThan(0.01)
    }
    expectWritten(found[0]!.naive, '−3.9 dB')
    expectWritten(found[0]!.naive - found[1]!.naive, '6 dB')
  })

  it('finds partial 12 of the saw the lab starts on at 46,072 Hz, landing near 1,920 Hz, at −25.5 dB in the naive saw (claim naive-fold-12)', async () => {
    const osc = await lab(NAME)
    const twelfth = partials(osc.render(nothing(), {}))[11]!
    // The measuring frame's nearest frequency to 3,840 Hz is 3,839.4 Hz.
    expect(Math.abs(twelfth.hz - 46_080)).toBeLessThan(10)
    expect(Math.abs(twelfth.lands - 1920)).toBeLessThan(10)
    expectWritten(twelfth.naive, '−25.5 dB')
  })

  it('finds six lines of folds between the harmonics of the naive loop, from 1,920 Hz up to 21,120 Hz, each from −19.7 dB to −21.9 dB (claim naive-lines)', async () => {
    const osc = await lab(NAME)
    const plain = tap(osc.render(nothing(), {}), 'naive')
    const lines = BETWEEN.map((hz) => line(plain, hz))
    expectWritten(lines[0]!, '−21.9 dB')
    expectWritten(lines[5]!, '−19.7 dB')
    // The lowest reads least and the highest most, and each of the rest lies between its neighbours.
    for (let i = 1; i < lines.length; i += 1) expect(lines[i]!).toBeGreaterThan(lines[i - 1]!)
    // And nothing anywhere else: the loop is one pattern of 25 samples.
    const levels = osc.spectrum('naive')
    for (let k = 0; k < levels.length; k += 1) {
      const hz = k * BIN
      if (Math.abs(hz - 1920 * Math.round(hz / 1920)) > 400) expect(levels[k]!).toBeLessThan(-90)
    }
  })

  it('pulls the sample before the edge down by 0.42 and the one after it up by 0.12 in the picture of the edge (claim edge-pull)', async () => {
    const osc = await lab(NAME)
    const out = osc.render(nothing(), {})
    const plain = tap(out, 'edgeNaive')
    const band = tap(out, 'edgeKit')
    expect(plain.length).toBe(17)
    for (let n = 0; n < 17; n += 1) {
      if (n === 7) expectWritten(plain[n]! - band[n]!, '0.42')
      else if (n === 8) expectWritten(band[n]! - plain[n]!, '0.12')
      else expect(band[n]).toBe(plain[n])
    }
    // The two are the squares of how far the drop is from each sample: 0.65 and 0.35 of a sample.
    expect(plain[7]! - band[7]!).toBeCloseTo(0.65 ** 2, 4)
    expect(band[8]! - plain[8]!).toBeCloseTo(0.35 ** 2, 4)
    // The kit's samples lie on the saw with its edge spread.
    const smooth = tap(out, 'edgeSmooth')
    for (let n = 0; n < 17; n += 1) expect(Math.abs(band[n]! - smooth[40 * n]!)).toBeLessThan(1e-5)
  })

  it('corrects two samples in each cycle and no more, by 1 at most (claim two-samples)', async () => {
    const osc = await lab(NAME)
    for (const note of [110, 440, 3840, 8000]) {
      const fix = tap(osc.render(nothing(), { note }), 'correction')
      expect(peak(fix)).toBeLessThanOrEqual(1)
      // Past the 20 ms where the loop's wrap is crossfaded.
      let moved = 0
      for (let i = 960; i < fix.length; i += 1) if (fix[i] !== 0) moved += 1
      const perCycle = moved / (((fix.length - 960) * note) / RATE)
      expect(perCycle).toBeGreaterThan(1.98)
      expect(perCycle).toBeLessThan(2.02)
    }
  })

  it("adds the correction to the naive saw and gets the kit's saw, to the last bit (claim sum-exact)", async () => {
    const osc = await lab(NAME)
    for (const values of [
      { note: 55 },
      { note: 440 },
      { note: 3520 },
      { note: 8000 },
      { note: 880, glide: 2 },
    ]) {
      const out = osc.render(nothing(), values)
      // −140 dB is the floor of the lab's reading, so the samples are added here as well, in
      // the 32 bits the lab keeps them in. Past the 20 ms where the loop's wrap is crossfaded:
      // there each tap is a mix of two passes, rounded once more.
      expect(out.checks.sumError).toBe(-140)
      const plain = tap(out, 'naive')
      const fix = tap(out, 'correction')
      const kit = tap(out, 'saw')
      let apart = 0
      for (let i = FADE; i < kit.length; i += 1)
        if (Math.fround(plain[i]! + fix[i]!) !== kit[i]) apart += 1
      expect(apart, JSON.stringify(values)).toBe(0)
    }
  })

  it('measures every partial where the triangle formula puts it, within 0.1 dB (claim smooth-error)', async () => {
    const osc = await lab(NAME)
    for (const note of [55, 110, 440, 1760, 3520, 4000, 8000]) {
      expectWritten(osc.render(nothing(), { note }).checks.smoothError!, 'under 0.1 dB')
    }
  })

  it("leaves partial 12 at −80.7 dB in the kit's saw, 55.2 dB lower (claim kit-fold-12)", async () => {
    const osc = await lab(NAME)
    const twelfth = partials(osc.render(nothing(), {}))[11]!
    expectWritten(twelfth.kit, '−80.7 dB')
    expectWritten(-twelfth.taken, '55.2 dB')
  })

  it("reads the line at 1,920 Hz at −76.0 dB in the kit's loop against −21.9 dB in the naive one (claim kit-line-low)", async () => {
    const osc = await lab(NAME)
    const out = osc.render(nothing(), {})
    expectWritten(line(tap(out, 'saw'), 1920), '−76.0 dB')
    expectWritten(line(tap(out, 'naive'), 1920), '−21.9 dB')
  })

  it('measures the odd partials of the triangle on the same formula, within 0.1 dB (claim corner-error)', async () => {
    const osc = await lab(NAME)
    // Every second semitone from 55 Hz to 8 kHz.
    for (let note = 55; note <= 8000; note *= 2 ** (1 / 6)) {
      expectWritten(osc.render(nothing(), { note }).checks.cornerError!, 'under 0.1 dB')
    }
  })

  it('takes 56.7 dB off partial 13, at 49,912 Hz, in the triangle and in the saw alike (claim corner-13)', async () => {
    const osc = await lab(NAME)
    const out = osc.render(nothing(), {})
    const ofTriangle = corners(out).find((one) => one.k === 13)!
    const ofSaw = partials(out)[12]!
    expectWritten(ofTriangle.hz, '49,912 Hz')
    expect(ofSaw.hz).toBe(ofTriangle.hz)
    expectWritten(-ofTriangle.taken, '56.7 dB')
    expectWritten(-ofSaw.taken, '56.7 dB')
    // The triangle's partials fall as the square of their number: 8/(πk)².
    for (const { k, naive } of corners(out)) {
      expect(Math.abs(naive - 20 * Math.log10(8 / (Math.PI * k) ** 2))).toBeLessThan(0.01)
    }
  })

  // ---- part 6: ways to use it -----------------------------------------------------------------

  it('at 440 Hz, keeps every fold that lands under 12 kHz below −63 dB (claim promise-low) and leaves the strongest at −46.76 dB near 23.75 kHz, against −38.7 dB in the naive saw (claim promise-top)', async () => {
    const osc = await lab(NAME)
    const folds = partials(played(osc, 'promise')).filter((one) => one.hz > RATE / 2)
    const low = folds.filter((one) => one.lands < 12_000)
    expectWritten(Math.max(...low.map((one) => one.kit)), 'under −63 dB')
    const strongest = folds.reduce((a, b) => (b.kit > a.kit ? b : a))
    expectWritten(strongest.kit, '−46.76 dB')
    expectWritten(strongest.lands / 1000, '23.75 kHz')
    // The naive saw's strongest fold, for the comparison the lesson makes.
    expectWritten(Math.max(...folds.map((one) => one.naive)), '−38.7 dB')
  })

  it('finds the strongest fold of the naive triangle at −35.2 dB, at 21,120 Hz, where the naive saw has −19.7 dB and the kit’s triangle −45.74 dB (claim way-soft)', async () => {
    const osc = await lab(NAME)
    const out = played(osc, 'soft')
    const folds = BETWEEN.map((hz) => line(tap(out, 'triangleNaive'), hz))
    expect(folds.indexOf(Math.max(...folds))).toBe(5)
    expectWritten(folds[5]!, '−35.2 dB')
    expectWritten(line(tap(out, 'naive'), 21_120), '−19.7 dB')
    expectWritten(line(tap(out, 'triangle'), 21_120), '−45.74 dB')
  })

  // ---- part 7: what goes wrong ----------------------------------------------------------------

  it("reads the line at 21,120 Hz at −30.6 dB in the kit's loop, 10.9 dB under the naive one (claim kit-line-top)", async () => {
    const osc = await lab(NAME)
    const out = played(osc, 'kit')
    const band = line(tap(out, 'saw'), 21_120)
    const plain = line(tap(out, 'naive'), 21_120)
    expectWritten(band, '−30.6 dB')
    expectWritten(plain - band, '10.9 dB')
    // Between the two, the kit's lines fall the lower they land.
    const lines = BETWEEN.map((hz) => line(tap(out, 'saw'), hz))
    for (let i = 1; i < lines.length; i += 1) expect(lines[i]!).toBeGreaterThan(lines[i - 1]! + 4)
  })

  it('at 3,840 Hz, reads the line at 1,920 Hz 54.1 dB lower in the kit’s loop than in the naive one (claim fold-low), and the six lines of folds together 15.7 dB lower (claim fold-all)', async () => {
    const osc = await lab(NAME)
    const out = played(osc, 'kit')
    const plain = BETWEEN.map((hz) => line(tap(out, 'naive'), hz))
    const band = BETWEEN.map((hz) => line(tap(out, 'saw'), hz))
    expectWritten(plain[0]! - band[0]!, '54.1 dB')
    expectWritten(power(plain) - power(band), '15.7 dB')
    // The line that lands highest carries most of what the kit's saw has left: more than half.
    expect(band[5]! - power(band)).toBeGreaterThan(-3)
  })

  it("dulls the saw's own partials: 0.18 dB at the fundamental (claim droop-fundamental), 7.2 dB at the sixth, 23,036 Hz (claim droop-top)", async () => {
    const osc = await lab(NAME)
    const found = partials(osc.render(nothing(), {}))
    expectWritten(-found[0]!.taken, '0.18 dB')
    expectWritten(found[5]!.hz, '23,036 Hz')
    expectWritten(-found[5]!.taken, '7.2 dB')
  })

  it('samples a sine at exactly 24 kHz, started at zero, as silence (claim nyquist-silence)', async () => {
    const osc = await lab(NAME)
    const out = osc.render(nothing(), { freq: 24_000 })
    expect(peak(tap(out, 'sine'))).toBeLessThan(1e-12)
    // A bin's width under it, the sine is all there.
    const under = osc.render(nothing(), { freq: 24_000 - 48 })
    expect(peak(tap(under, 'sine'))).toBeGreaterThan(0.99)
  })

  it('at exactly 4 kHz, makes the naive saw one pattern of 12 samples, its folds all on its harmonics (claim hidden-4k)', async () => {
    const osc = await lab(NAME)
    const plain = tap(played(osc, 'hidden'), 'naive')
    let worst = 0
    for (let i = 960; i + 12 < plain.length; i += 1) {
      worst = Math.max(worst, Math.abs(plain[i + 12]! - plain[i]!))
    }
    // A step of a twelfth of a cycle is not exact in 32 bits: the pattern holds to their rounding.
    expect(worst).toBeLessThan(1e-6)
    // Nothing stands between the harmonics: half way from each to the next the spectrum is empty.
    const levels = osc.spectrum('naive')
    for (let harmonic = 0; harmonic < 6; harmonic += 1) {
      const between = Math.round((4000 * harmonic + 2000) / BIN)
      expect(levels[between]!).toBeLessThan(-90)
    }
  })

  it('shows 13 peaks above −60 dB in the naive loop at 3,840 Hz, one of them at 0 Hz, and more than fifty once the saw moves off it (claim thicket)', async () => {
    const osc = await lab(NAME)
    const lines = (note: number) => {
      osc.render(nothing(), { note })
      return peaksAbove(osc, 'naive', -60)
    }
    // Six harmonics, six lines of folds and the one at 0 Hz, where the 25th partial lands
    // (25 times 3,840 Hz is twice the sample rate).
    expect(lines(3840)).toBe(13)
    const low = osc.spectrum('naive')
    expect(low[0]).toBeGreaterThan(-60)
    expect(low[0]).toBeGreaterThan(low[1]!)
    for (const note of [3520, 3700, 3800, 3880]) expect(lines(note)).toBeGreaterThan(50)
    expect(settings.sets.thicket!.values).toEqual({ note: 3800 })
  })

  // ---- part 8: what people get wrong ----------------------------------------------------------

  it('keeps a sine with 2.004 samples to a cycle whole: 23,952 Hz peaks within a bin of itself, at full level (claim near-nyquist)', async () => {
    const osc = await lab(NAME)
    osc.render(nothing(), { freq: 23_952 })
    const found = top(osc, 'sine')
    expect(Math.abs(found.hz - 23_952)).toBeLessThan(BIN)
    // It measures −0.05 dB: the sine stands a tenth of a bin off the bin that reads it.
    expect(Math.abs(found.db)).toBeLessThan(0.1)
    // One line: the spectrum has no other peak above −100 dB.
    expect(peaksAbove(osc, 'sine', -100)).toBe(1)
  })

  it('shows a sine at 23,952 Hz as dots that turn sign each sample and stay under a sixth of full level (claim near-nyquist-dots)', async () => {
    const osc = await lab(NAME)
    const dots = tap(osc.render(nothing(), { freq: 23_952 }), 'samples')
    expect(dots.length).toBe(25)
    expect(peak(dots)).toBeLessThan(1 / 6)
    expect(peak(dots)).toBeGreaterThan(0.14)
    for (let n = 2; n < 25; n += 1) expect(dots[n]! * dots[n - 1]!).toBeLessThan(0)
  })
})
