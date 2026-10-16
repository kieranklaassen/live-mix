import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  differenceDb,
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  peak,
  POINT_RATE,
  RATE,
  rms,
  seconds,
  silence,
} from './support.ts'

// Nothing goes in: the lab plays one key itself. The key goes down 10 ms into the loop.
const nothing = () => silence(seconds(4))
const DOWN = 480
/** The sample that stands `s` seconds after the key went down. */
const after = (s: number) => DOWN + seconds(s)

/** The first channel of a tap. */
const tap = (result: RenderResult, id: string) => result.taps[id]!.channels_data[0]!

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings('wavetables')!

/** The steps of the build path, as the lab numbers them. */
const STEP = { stored: 0, phase: 1, between: 2, octave: 3, morph: 4, voice: 5 }

/** The Sampler plays its recording at its own pitch on middle C. */
const MIDDLE_C = 261.6256

/** A named set as its card plays it, with `over` laid on its values. */
function played(table: Lab, name: string, over: Record<string, number> = {}): RenderResult {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values } = resolveSet(table.description, set)
  return table.render(nothing(), { ...values, ...over })
}

/** A transform in place: `re` and `im` are as long as a power of two. */
function transform(re: Float64Array, im: Float64Array) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      const [r, m] = [re[i]!, im[i]!]
      re[i] = re[j]!
      im[i] = im[j]!
      re[j] = r
      im[j] = m
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1
    const step = (-2 * Math.PI) / size
    for (let k = 0; k < half; k += 1) {
      const c = Math.cos(step * k)
      const s = Math.sin(step * k)
      for (let a = k; a < n; a += size) {
        const b = a + half
        const tr = re[b]! * c - im[b]! * s
        const ti = re[b]! * s + im[b]! * c
        re[b] = re[a]! - tr
        im[b] = im[a]! - ti
        re[a] = re[a]! + tr
        im[a] = im[a]! + ti
      }
    }
  }
}

/** The bins either side of each harmonic that count as the note itself. */
const NEAR = 12

/**
 * What a sound holds that is not on its note, in dB against the whole of it: the "folded back"
 * figure of this lesson. `size` samples from `from` are taken under a Hann window raised to the
 * fourth power, whose skirt is below any number written here from 12 bins out, and transformed.
 * Every bin more than 12 bins from all the multiples of `hz` is counted as off the note; the
 * rest is the note's own harmonics. With 65,536 samples a bin is 0.73 Hz, so "off the note" is
 * more than 8.8 Hz from every harmonic; with 8,192 it is more than 70 Hz.
 */
function offNote(x: Float32Array, hz: number, from: number, size: number): number {
  const re = new Float64Array(size)
  const im = new Float64Array(size)
  for (let n = 0; n < size; n += 1) {
    const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / size)
    re[n] = x[from + n]! * hann ** 4
  }
  transform(re, im)
  const bin = RATE / size
  let off = 0
  let all = 0
  for (let k = 1; k <= size / 2; k += 1) {
    const power = re[k]! * re[k]! + im[k]! * im[k]!
    all += power
    const f = k * bin
    if (Math.abs(f - Math.round(f / hz) * hz) > NEAR * bin) off += power
  }
  return 10 * Math.log10(Math.max(off, 1e-300) / all)
}

/** The Wavetable's held note, from half a second after the key: 65,536 samples, 1.37 s. */
const held = (x: Float32Array, hz: number) => offNote(x, hz, after(0.5), 65536)
/** The Sampler's note inside its first pass: 8,192 samples from 0.1 s after the key. */
const firstPass = (x: Float32Array, hz: number) => offNote(x, hz, after(0.1), 8192)

/** The pitch the Sampler plays at a Tune, in hertz. */
const tuned = (semitones: number) => MIDDLE_C * 2 ** (semitones / 12)

/** Seconds of the recording the read head covers in a second, from 0.1 s to 0.2 s after the key. */
function headSpeed(result: RenderResult): number {
  const head = tap(result, 'head')
  const at = (s: number) => head[Math.round((DOWN / RATE + s) * POINT_RATE)]!
  return (at(0.2) - at(0.1)) / 0.1
}

/** How long after the key the read head first goes back, in seconds. */
function firstReturn(result: RenderResult): number {
  const head = tap(result, 'head')
  const from = Math.round((DOWN / RATE) * POINT_RATE) + 1
  for (let i = from + 1; i < head.length; i += 1) {
    if (head[i]! < head[i - 1]!) return (i - from + 1) / POINT_RATE
  }
  return Infinity
}

/** The mean of two curves, point by point. */
const meanOf = (a: Float32Array, b: Float32Array) => a.map((v, i) => 0.5 * (v + b[i]!))

/** How many points of a curve of bars stand over the floor the lab draws between bars. */
const barsIn = (x: Float32Array) => x.reduce((count, v) => count + (v > -99 ? 1 : 0), 0)

describe('wavetables and sample playback', () => {
  it('is a sound lab playing its own key: every tap says something, loops, and answers to every control', async () => {
    const table = await lab('wavetables')
    const result = table.render(nothing(), {})
    // With Motion at 0, where the lab starts, the place in the row is Position and nothing else.
    expectSoundLab(table, nothing(), result, { quiet: ['place'] })
    expect(result.ms).toBeLessThan(1500)
  })

  it('has a build path of six steps, each changing a built tap and none the main path, the last held to the device', async () => {
    const table = await lab('wavetables')
    // Morphing does nothing where the lab starts, at the end of the row: Position is turned.
    expectBuild(table, nothing(), { position: 0.45 })
    expectBuild(table, nothing(), {
      position: 0.45,
      pitch: 3000,
      detune: 30,
      sub: 0.6,
      motion: 1,
      rate: 3,
    })
    expect(table.description.controls.find((one) => one.id === 'build')!.choices).toEqual([
      'One cycle in a table',
      'A phase that reads it',
      'Reading between entries',
      'A table for each octave',
      'Morphing',
      'The rest of the voice',
    ])
    expect(table.render(nothing(), {}).checks.builtStep).toBe(STEP.voice)
  })

  it('holds the build to the device with every control moved and a long release ringing over the wrap', async () => {
    const table = await lab('wavetables')
    for (const values of [
      { release: 8, hold: 3.9, detune: 50, motion: 1, rate: 10, sub: 1, spread: 1 },
      { table: 4, position: 0.2, cutoff: 500, resonance: 1, volume: 6, pitch: 55 },
      { table: 1, attack: 2, pitch: 4186, detune: 25 },
    ]) {
      const result = table.render(nothing(), values)
      expect(result.checks.builtDifference).toBeLessThanOrEqual(result.checks.builtBound!)
    }
  })

  // ---- part 1: one cycle, and what goes wrong when it is read fast -------------------------------

  it('goes round the stored cycle 23.4 Hz with Pitch at 220 Hz and at 880 Hz alike, when the entries are read one a sample (claim one-pitch)', async () => {
    const table = await lab('wavetables')
    for (const pitch of [220, 880]) {
      expectWritten(
        table.render(nothing(), { build: STEP.stored, pitch }).checks.builtHz!,
        '23.4 Hz',
      )
    }
  })

  it('fits 54 of the 512 harmonics of the full cycle under half the rate at 440 Hz, and 109 at the 220 Hz the lab starts on (claim fits-440)', async () => {
    const table = await lab('wavetables')
    expect(table.render(nothing(), { pitch: 440 }).checks.fits).toBe(54)
    expect(table.render(nothing(), {}).checks.fits).toBe(109)
    // The bars the picture draws are those harmonics: 13 of them at 1,760 Hz.
    const high = played(table, 'full')
    expect(high.checks.fits).toBe(13)
    expect(barsIn(tap(high, 'barsKept'))).toBe(13)
  })

  it('leaves −13.4 dB of the full cycle off the note at 1,760 Hz, and −107.8 dB of the Wavetable oscillator on the same key (claim full-folds)', async () => {
    const table = await lab('wavetables')
    const result = played(table, 'full')
    expectWritten(held(tap(result, 'naive'), 1760), '−13.4 dB')
    expectWritten(held(tap(result, 'osc'), 1760), '−107.8 dB')
  })

  it('counts as off the note everything more than 8.8 Hz from every multiple of its pitch, in 65,536 samples of the held note, 1.37 s of it from 0.5 s after the key (claim band)', () => {
    expectWritten((NEAR * RATE) / 65536, '8.8 Hz')
    expectWritten(65536 / RATE, '1.37 s')
    // The measure itself, on a sound whose answer is known: a note of three harmonics, and beside
    // it a tone a hundredth of the note's size that stands between two of them.
    const hz = 1760
    const note = new Float32Array(seconds(4))
    const stray = new Float32Array(seconds(4))
    for (let n = 0; n < note.length; n += 1) {
      const turn = (2 * Math.PI * hz * n) / RATE
      note[n] = 0.2 * Math.sin(turn) + 0.1 * Math.sin(2 * turn) + 0.05 * Math.sin(3 * turn)
      stray[n] = note[n]! + 0.01 * Math.sin(1.5 * turn)
    }
    expect(held(note, hz)).toBeLessThan(-120)
    // 0.01 against the note's 0.229: 27.2 dB under it.
    expect(held(stray, hz)).toBeCloseTo(-27.2, 1)
    // A tone well inside the 8.8 Hz is the note's own, and one well outside it is not. (A tone
    // near the edge is spread by the window over five bins either side, and is counted in part.)
    const beside = (apart: number) =>
      note.map((v, n) => v + 0.01 * Math.sin((2 * Math.PI * (hz + apart) * n) / RATE))
    expect(held(beside(3), hz)).toBeLessThan(-100)
    expect(held(beside(14), hz)).toBeCloseTo(-27.2, 1)
  })

  it('reads the full cycle as the device reads it wherever the device itself reads copy 0: at 27.5 Hz the two oscillators are one', async () => {
    const table = await lab('wavetables')
    const result = table.render(nothing(), { pitch: 27.5, position: 0.45 })
    expect(result.checks.copyRead).toBe(0)
    expect(result.checks.copyFade).toBe(0)
    expect(differenceDb(tap(result, 'naive'), tap(result, 'osc'))).toBeLessThan(-130)
    expect(peak(tap(result, 'removed'))).toBe(0)
  })

  // ---- part 2: the cycle beside its bars -----------------------------------------------------------

  it('fits all 512 harmonics up to 46.8 Hz, and 510 of them at 47 Hz (claim first-fold)', async () => {
    const table = await lab('wavetables')
    const fits = (pitch: number) => table.render(nothing(), { pitch }).checks.fits
    expect(fits(27.5)).toBe(512)
    expect(fits(46.8)).toBe(512)
    expect(fits(47)).toBe(510)
    // With every harmonic under half the rate nothing is drawn as folded.
    expect(barsIn(tap(table.render(nothing(), { pitch: 46.8 }), 'barsFolded'))).toBe(0)
    expect(barsIn(tap(table.render(nothing(), { pitch: 47 }), 'barsFolded'))).toBe(2)
  })

  // ---- part 4: the build, a piece at a time --------------------------------------------------------

  it('goes round 880.0 Hz with the phase and Pitch at 880 Hz, and not before (claim phase-pitch)', async () => {
    const table = await lab('wavetables')
    const at = (build: number) => table.render(nothing(), { build, pitch: 880 }).checks.builtHz!
    expectWritten(at(STEP.phase), '880.0 Hz')
    expect(matchesWritten(at(STEP.stored), '880.0 Hz')).toBe(false)
  })

  it('reads the saw between its entries −46.4 dB from the cycle itself, against −30.0 dB at the entry below (claim between)', async () => {
    const table = await lab('wavetables')
    const at = (build: number) => table.render(nothing(), { build, pitch: 880 }).checks.builtError!
    expectWritten(at(STEP.between), '−46.4 dB')
    expectWritten(at(STEP.phase), '−30.0 dB')
    expect(matchesWritten(at(STEP.phase), '−46.4 dB')).toBe(false)
    // The main path's two checks are the same reads of the same cycle.
    const result = table.render(nothing(), {})
    expectWritten(result.checks.lineError!, '−46.4 dB')
    expectWritten(result.checks.stepError!, '−30.0 dB')
  })

  it('hardly moves the folding when the read goes between entries: −16.5 dB off the note at 880 Hz before, −16.8 dB after (claim between-folds)', async () => {
    const table = await lab('wavetables')
    const at = (build: number) =>
      held(tap(table.render(nothing(), { build, pitch: 880 }), 'built'), 880)
    expectWritten(at(STEP.phase), '−16.5 dB')
    expectWritten(at(STEP.between), '−16.8 dB')
  })

  it('brings what is off the note at 880 Hz down to −99 dB with a copy for the octave, from the −16.8 dB of the step before (claim octave)', async () => {
    const table = await lab('wavetables')
    const at = (build: number) =>
      held(tap(table.render(nothing(), { build, pitch: 880 }), 'built'), 880)
    expectWritten(at(STEP.octave), '−99 dB')
    expect(matchesWritten(at(STEP.between), '−99 dB')).toBe(false)
    // The copy the build chose is the device's: 16 harmonics at this key.
    const result = table.render(nothing(), { pitch: 880 })
    expect(result.checks.copyRead).toBe(5)
    expect(result.checks.copyHolds).toBe(16)
  })

  it('reads the mean of two stored frames halfway between them, to under −120 dB, where the step before reads one frame, −29.8 dB from that mean (claim morph)', async () => {
    const table = await lab('wavetables')
    // At 27.5 Hz the copy read is copy 0, the frames as the two taps draw them.
    const at = (build: number) => {
      const result = table.render(nothing(), { build, pitch: 27.5, position: 0.4375 })
      const mean = meanOf(tap(result, 'frameBelow'), tap(result, 'frameAbove'))
      return differenceDb(tap(result, 'builtCycle'), mean)
    }
    expectWritten(at(STEP.morph), 'under −120 dB')
    expect(matchesWritten(at(STEP.octave), 'under −120 dB')).toBe(false)
    expectWritten(at(STEP.octave), '−29.8 dB')
    // The sound says the same as the picture. A step sooner, the build at 0.375 and at 0.5 plays
    // each of the two frames alone, from the same place in the cycle under the same envelope:
    // with the piece in, the sound halfway is the mean of those two sounds, and a step sooner
    // it is not.
    const sound = (build: number, position: number) =>
      tap(table.render(nothing(), { build, pitch: 27.5, position }), 'built')
    const mean = meanOf(sound(STEP.octave, 0.375), sound(STEP.octave, 0.5))
    expectWritten(differenceDb(sound(STEP.morph, 0.4375), mean), 'under −120 dB')
    expectWritten(differenceDb(sound(STEP.octave, 0.4375), mean), '−29.8 dB')
  })

  it('is less than 1 dB quieter halfway between two neighbouring frames than on a stored frame, in all five tables; only in Hollow do harmonics stand upside down from one frame to the next; every stored cycle stands at 0.25 RMS and none peaks past 0.95 (claim blend-level)', async () => {
    const table = await lab('wavetables')
    // The oscillator over two seconds of the held note, which is 55 cycles at 27.5 Hz, where the
    // copy read is the fullest.
    const level = (result: RenderResult) =>
      gainToDb(rms(tap(result, 'osc'), after(0.5), after(2.5)))
    /** The harmonics of a stored cycle, as the real and imaginary parts of a transform. */
    const harmonics = (cycle: Float32Array) => {
      const re = Float64Array.from(cycle.subarray(0, 2048))
      const im = new Float64Array(2048)
      transform(re, im)
      return { re, im }
    }
    const worst: number[] = []
    const upsideDown: number[] = []
    for (const set of [0, 1, 2, 3, 4]) {
      const stored = level(table.render(nothing(), { table: set, position: 0, pitch: 27.5 }))
      let dip = 0
      let turned = 0
      for (let frame = 0; frame < 8; frame += 1) {
        const result = table.render(nothing(), {
          table: set,
          position: (frame + 0.5) / 8,
          pitch: 27.5,
        })
        expect(result.checks.copyRead).toBe(0)
        dip = Math.max(dip, stored - level(result))
        // Each stored cycle is at the level the device scales it to, and none comes near the
        // peak at which the device would turn it down further: all nine of every row pass here.
        for (const id of ['frameBelow', 'frameAbove']) {
          const cycle = tap(result, id).subarray(0, 2048)
          expect(rms(cycle), `table ${set}, ${id} of place ${frame}`).toBeCloseTo(0.25, 5)
          expect(peak(cycle)).toBeLessThan(0.95)
        }
        // A harmonic that stands upside down in the next frame: the two have opposite signs, and
        // neither is too small to tell (a hundred-millionth of the two cycles' power).
        const below = harmonics(tap(result, 'frameBelow'))
        const above = harmonics(tap(result, 'frameAbove'))
        let power = 0
        for (let n = 1; n <= 512; n += 1)
          power += below.re[n]! ** 2 + below.im[n]! ** 2 + above.re[n]! ** 2 + above.im[n]! ** 2
        for (let n = 1; n <= 512; n += 1) {
          const along = below.re[n]! * above.re[n]! + below.im[n]! * above.im[n]!
          const least = Math.min(
            below.re[n]! ** 2 + below.im[n]! ** 2,
            above.re[n]! ** 2 + above.im[n]! ** 2,
          )
          if (along < 0 && least > 1e-8 * power) turned += 1
        }
      }
      worst.push(dip)
      upsideDown.push(turned)
    }
    for (const dip of worst) expectWritten(dip, 'less than 1 dB')
    // The largest is in Vowels, and it is not nothing: a blend of two different cycles is quieter.
    expect(Math.max(...worst)).toBeGreaterThan(0.5)
    expect(upsideDown.slice(0, 3)).toEqual([0, 0, 0])
    expect(upsideDown[4]).toBe(0)
    expect(upsideDown[3]).toBeGreaterThan(100)
  }, 120_000)

  it('is the Wavetable output with every piece in, to under −120 dB on both channels, and not a piece sooner (claim voice)', async () => {
    const table = await lab('wavetables')
    const apart = (build: number) => {
      const result = table.render(nothing(), { build, position: 0.45, detune: 9, sub: 0.25 })
      return Math.max(
        ...[0, 1].map((c) =>
          differenceDb(result.taps.built!.channels_data[c]!, result.taps.out!.channels_data[c]!),
        ),
      )
    }
    expectWritten(apart(STEP.voice), 'under −120 dB')
    expect(matchesWritten(apart(STEP.morph), 'under −120 dB')).toBe(false)
    expectWritten(table.render(nothing(), {}).checks.builtDifference!, 'under −120 dB')
    // The check reads −140 dB for any difference more than 140 dB down. The step's picture says
    // the two are the same, so the samples themselves are compared: where the lab starts, at the
    // device's own defaults, and with every control of the voice moved.
    const device = { ...settings.defaults!.values, build: STEP.voice }
    const moved = {
      build: STEP.voice,
      detune: 50,
      motion: 1,
      rate: 10,
      sub: 1,
      spread: 1,
      pitch: 1760,
    }
    for (const values of [{ build: STEP.voice }, device, moved]) {
      const result = table.render(nothing(), values)
      for (const c of [0, 1]) {
        const built = result.taps.built!.channels_data[c]!
        const out = result.taps.out!.channels_data[c]!
        expect(peak(out)).toBeGreaterThan(0.05)
        expect(built.every((v, i) => v === out[i])).toBe(true)
      }
    }
  })

  // ---- part 5: inside the engine ---------------------------------------------------------------------

  it('finds every stored cycle under −130 dB from the sum of its recipe: five tables, the frames at both ends and in the middle (claim recipe)', async () => {
    const table = await lab('wavetables')
    for (const set of [0, 1, 2, 3, 4]) {
      for (const position of [0, 0.5, 1]) {
        const result = table.render(nothing(), { table: set, position })
        expectWritten(result.checks.tableError!, 'under −130 dB')
      }
    }
  })

  it('reads the sine table of the kit −129.1 dB from the sine at worst, and −57.4 dB at the entry below (claim sine-line)', async () => {
    const table = await lab('wavetables')
    const result = table.render(nothing(), {})
    expectWritten(result.checks.sineLine!, '−129.1 dB')
    expectWritten(result.checks.sineStep!, '−57.4 dB')
  })

  it('keeps the top harmonic of the copy read at least 12 kHz and under 24 kHz at every pitch from 27.5 Hz to 4,186 Hz (claim top-harmonic)', async () => {
    const table = await lab('wavetables')
    const result = table.render(nothing(), {})
    const top = result.taps.copyTop!
    expect([top.x0, top.x1].map((hz) => Math.round(hz * 10) / 10)).toEqual([27.5, 4186])
    const tops = tap(result, 'copyTop')
    expectWritten(Math.min(...tops) / 1000, 'at least 12 kHz')
    expectWritten(Math.max(...tops) / 1000, 'under 24 kHz')
  })

  it('moves along the row the same at 220 Hz and at 880 Hz, with Motion at 1 and Rate at 1 Hz: the place is the same line, point for point (claim same-motion)', async () => {
    const table = await lab('wavetables')
    const moving = { motion: 1, rate: 1, position: 0.5 }
    const low = tap(table.render(nothing(), { ...moving, pitch: 220 }), 'place')
    const high = tap(table.render(nothing(), { ...moving, pitch: 880 }), 'place')
    expect(low.every((v, i) => v === high[i])).toBe(true)
    // And it does move: from one end of the row to the other.
    expect(Math.min(...low)).toBeLessThan(0.01)
    expect(Math.max(...low)).toBeGreaterThan(0.99)
    // The motion LFO is the sine of the kit: one turn a second at Rate 1.
    const lfo = tap(table.render(nothing(), { ...moving }), 'lfo')
    expect(Math.max(...lfo)).toBeGreaterThan(0.999)
    expect(Math.min(...lfo)).toBeLessThan(-0.999)
  })

  it('plays the recording from 0.30 s to 1.70 s: where the read head starts, and the furthest it gets (claim stretch)', async () => {
    const table = await lab('wavetables')
    const head = tap(table.render(nothing(), {}), 'head')
    const first = Math.round((DOWN / RATE) * POINT_RATE) + 1
    expectWritten(head[first]!, '0.30 s')
    expectWritten(Math.max(...head), '1.70 s')
  })

  it('moves the read head 1.00 s of the recording a second at Tune 0, and 2.00 s a second 12 semitones up (claim head-speed)', async () => {
    const table = await lab('wavetables')
    expectWritten(headSpeed(table.render(nothing(), {})), '1.00 s')
    expectWritten(headSpeed(table.render(nothing(), { tune: 12 })), '2.00 s')
  })

  it('loses 3.0 dB at 12 kHz to a read halfway between two frames, and 1.1 dB with the four weights of the Sampler (claim halfway)', async () => {
    const table = await lab('wavetables')
    const result = table.render(nothing(), {})
    const two = tap(result, 'twoPoint')
    const four = tap(result, 'fourPoint')
    expect(two.length).toBe(241)
    expectWritten(-two[120]!, '3.0 dB')
    expectWritten(-four[120]!, '1.1 dB')
    // The four weights the device gave are the cubic's: -1/16, 9/16, 9/16, -1/16.
    for (let p = 0; p < 200; p += 10) {
      const w = (Math.PI * p) / 240
      const size = Math.abs(1.125 * Math.cos(w / 2) - 0.125 * Math.cos((3 * w) / 2))
      expect(four[p]!).toBeCloseTo(gainToDb(size), 3)
      expect(two[p]!).toBeCloseTo(gainToDb(Math.cos(w / 2)), 3)
    }
  })

  it('reads the full-rate recording at Tune 0 and 1, the half-rate copy from 2 to 13 and the quarter-rate copy from 14 semitones up (claim copies)', async () => {
    const table = await lab('wavetables')
    const copy = (tune: number) => table.render(nothing(), { tune }).checks.samplerCopy
    expect([0, 1].map(copy)).toEqual([0, 0])
    expect([2, 13].map(copy)).toEqual([1, 1])
    expect([14, 24].map(copy)).toEqual([2, 2])
    expect(copy(-24)).toBe(0)
  })

  it('leaves −31.6 dB off the note at Tune 12 semitones from the full-rate recording, and −47.8 dB from the half-rate copy the Sampler reads: over 8,192 samples from 0.1 s after the key, more than 70 Hz from every harmonic (claim guard-octave)', async () => {
    const table = await lab('wavetables')
    const result = played(table, 'shrunk')
    expectWritten(firstPass(tap(result, 'sampledFull'), tuned(12)), '−31.6 dB')
    expectWritten(firstPass(tap(result, 'sampled'), tuned(12)), '−47.8 dB')
    expectWritten((NEAR * RATE) / 8192, '70 Hz')
  })

  it("runs the Sampler's voices again on the copy the device reads and lands on the Sampler's own sound, to under −120 dB, on every copy and in every loop mode (claim twin)", async () => {
    const table = await lab('wavetables')
    for (const values of [
      {},
      { tune: 2 },
      { tune: 12 },
      { tune: 24, loop: 2 },
      { tune: -7, loop: 0, hold: 3.9 },
      { tune: 5, crossfade: 500, wobble: 1 },
    ]) {
      expectWritten(table.render(nothing(), values).checks.twin!, 'under −120 dB')
    }
    // Where the Sampler reads the full-rate recording, the two sounds are one.
    const plain = table.render(nothing(), {})
    expect(tap(plain, 'sampledFull').every((v, i) => v === tap(plain, 'sampled')[i])).toBe(true)
  })

  it('hands the Sampler a recording that stays under the soft clip of the Wavetable, and starts and ends at nothing', async () => {
    const table = await lab('wavetables')
    const recording = tap(table.render(nothing(), {}), 'recording')
    expect(peak(recording)).toBeLessThan(0.5)
    expect(peak(recording)).toBeGreaterThan(0.3)
    expect(Math.abs(recording[DOWN]!)).toBeLessThan(0.01)
    expect(peak(recording.subarray(after(1.99), after(2.0)))).toBeLessThan(1e-3)
  })

  // ---- part 7: what goes wrong ---------------------------------------------------------------------

  it('reaches the end of its stretch 1.40 s after the key at Tune 0, and 0.70 s after it 12 semitones up (claim sample-shrinks)', async () => {
    const table = await lab('wavetables')
    expectWritten(firstReturn(table.render(nothing(), {})), '1.40 s')
    expectWritten(firstReturn(played(table, 'shrunk')), '0.70 s')
  })

  it('leaves −40.8 dB off the note at Tune 2 semitones from the half-rate copy, where the full-rate recording leaves −92.5 dB, and both leave −104.1 dB at Tune 0 (claim guard-cost)', async () => {
    const table = await lab('wavetables')
    const result = played(table, 'justOver')
    expect(result.checks.samplerCopy).toBe(1)
    expectWritten(firstPass(tap(result, 'sampled'), tuned(2)), '−40.8 dB')
    expectWritten(firstPass(tap(result, 'sampledFull'), tuned(2)), '−92.5 dB')
    const plain = table.render(nothing(), {})
    expect(plain.checks.samplerCopy).toBe(0)
    expectWritten(firstPass(tap(plain, 'sampled'), tuned(0)), '−104.1 dB')
    expectWritten(firstPass(tap(plain, 'sampledFull'), tuned(0)), '−104.1 dB')
  })

  it('leaves between −38.6 dB and −40.8 dB off the note from the half-rate copy at every whole Tune from 2 to 7 semitones, and less from the full-rate recording each time, −44.2 dB at 7 semitones being the nearest, and the other way round at 8 semitones; at Tune 2.5 the two are −40.7 dB and −51.7 dB (claim guard-range)', async () => {
    const table = await lab('wavetables')
    const at = (tune: number) => {
      const result = table.render(nothing(), { tune })
      expect(result.checks.samplerCopy).toBe(1)
      return {
        copy: firstPass(tap(result, 'sampled'), tuned(tune)),
        full: firstPass(tap(result, 'sampledFull'), tuned(tune)),
      }
    }
    const whole = [2, 3, 4, 5, 6, 7].map(at)
    expectWritten(Math.max(...whole.map((one) => one.copy)), '−38.6 dB')
    expectWritten(Math.min(...whole.map((one) => one.copy)), '−40.8 dB')
    // The full-rate read leaves less at each of the six, and comes nearest at 7 semitones.
    const gaps = whole.map((one) => one.copy - one.full)
    expect(Math.min(...gaps)).toBeGreaterThan(5)
    expect(gaps.indexOf(Math.min(...gaps))).toBe(5)
    expectWritten(whole[5]!.full, '−44.2 dB')
    // Its figure at 2 semitones is the lowest of the six by far, and half a semitone on it is
    // 40 dB higher, while the half-rate copy's has not moved: the count, not the read.
    expect(Math.min(...whole.map((one) => one.full))).toBe(whole[0]!.full)
    const between = at(2.5)
    expectWritten(between.copy, '−40.7 dB')
    expectWritten(between.full, '−51.7 dB')
    // A semitone further the count turns round: the full-rate recording leaves the more.
    const eight = at(8)
    expect(eight.full).toBeGreaterThan(eight.copy)
  })

  it('stands on a frame of the half-rate copy at every sample with Tune at 12 semitones, so that nothing is read between frames there; at Tune 11 the half-rate copy leaves −39 dB and the full-rate recording −34 dB (claim guard-eleven)', async () => {
    const table = await lab('wavetables')
    // The head starts on an even frame and moves two frames a sample: every point of the first
    // pass is an even frame of the recording, which is a whole frame of the copy at half the rate.
    const head = tap(played(table, 'shrunk'), 'head')
    const first = Math.round((DOWN / RATE) * POINT_RATE) + 1
    for (let i = first; i < first + Math.round(0.6 * POINT_RATE); i += 1) {
      const frame = head[i]! * RATE
      expect(Math.abs(frame / 2 - Math.round(frame / 2))).toBeLessThan(0.01)
      if (i > first) expect((head[i]! - head[i - 1]!) * RATE).toBeCloseTo(32, 1)
    }
    const result = table.render(nothing(), { tune: 11 })
    expect(result.checks.samplerCopy).toBe(1)
    expectWritten(firstPass(tap(result, 'sampled'), tuned(11)), '−39 dB')
    expectWritten(firstPass(tap(result, 'sampledFull'), tuned(11)), '−34 dB')
  })

  // ---- part 8: misconceptions ----------------------------------------------------------------------

  it('reads the copy of the saw for 880 Hz between its entries −92 dB from that copy itself, where the fullest copy lay −46.4 dB from itself (claim line-fine)', async () => {
    const table = await lab('wavetables')
    const result = table.render(nothing(), { build: STEP.voice, pitch: 880 })
    expect(result.checks.copyHolds).toBe(16)
    expectWritten(result.checks.builtError!, '−92 dB')
    // The fullest copy, read the same way: the figure of step 3.
    expectWritten(
      table.render(nothing(), { build: STEP.voice, pitch: 27.5 }).checks.builtError!,
      '−46.4 dB',
    )
  })

  // ---- the cards -------------------------------------------------------------------------------------

  it('renders every named set: its tap sounds, stays under full scale, and the tile sits where a tile may', async () => {
    const table = await lab('wavetables')
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = played(table, name)
      const id = set.tap ?? 'out'
      for (const data of result.taps[id]!.channels_data) {
        expect(
          data.every((v) => Number.isFinite(v)),
          name,
        ).toBe(true)
        expect(gainToDb(rms(data)), `${name} is heard`).toBeGreaterThan(-40)
        expect(peak(data), `${name} stays under the soft clip`).toBeLessThan(0.5)
      }
      expect(result.checks.builtDifference, name).toBeLessThanOrEqual(result.checks.builtBound!)
    }
  })

  // ---- part 9: the device's own defaults ---------------------------------------------------------

  it("starts the page's device table from the device's own defaults: for every control that is a parameter of the Wavetable, the settings file's defaults laid over the lab's starting values are device.json's", async () => {
    const table = await lab('wavetables')
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/wavetable/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const { values } = resolveSet(table.description, { values: settings.defaults!.values })
    // Every parameter of the Wavetable is a control of the lab.
    expect(device.params.filter((one) => !(one.key in values)).map((one) => one.key)).toEqual([])
    // The lab holds a starting value as a single-precision number and the settings file a
    // double, so both sides are compared as single precision.
    for (const one of device.params)
      expect(Math.fround(values[one.key]!), one.key).toBe(Math.fround(one.default))
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(settings.defaults!.values)) {
      expect(table.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
  })
})
