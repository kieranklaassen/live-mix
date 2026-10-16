import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  BIN,
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  mean,
  peak,
  POINT_RATE,
  RATE,
  rms,
  seconds,
  silence,
} from './support.ts'

/** The lab plays by itself: nothing goes in. A key goes down on the loop's first sample. */
const nothing = silence(seconds(2))

/** A note on the middle of bin 40, 468.75 Hz, so that a line's level is read with no loss between bins. */
const ON_A_BIN = 40 * BIN

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings('frequency-modulation')!

/** The lab's Ratio, by the ratio each choice stands for. */
const RATIO = { half: 0, one: 1, two: 3, threeAndAHalf: 6, fourteen: 11 }

/** The steps of the build path, as the lab numbers them. */
const STEP = {
  carrier: 0,
  modulator: 1,
  index: 2,
  ratio: 3,
  bright: 4,
  level: 5,
  feedback: 6,
  second: 7,
  guard: 8,
}

/** The first channel of a tap. */
const tap = (result: RenderResult, id: string, channel = 0) =>
  result.taps[id]!.channels_data[channel]!

/**
 * The spectrum of a held tap of the last render, from 8,192 samples in: clear of the 20 ms at
 * the loop's start where the lab crosses the end of the tone over into its beginning.
 */
const heldSpectrum = (theLab: Lab, id = 'steady') => theLab.spectrum(id, 0, 8192, 65_536)
/** The spectrum of the first 85 ms of a tap of the last render, and of 171 ms from half a second in. */
const atTheStrike = (theLab: Lab, id: string, channel = 0) => theLab.spectrum(id, channel, 0, 4096)
const halfASecondIn = (theLab: Lab, id: string, channel = 0) =>
  theLab.spectrum(id, channel, 24_000, 8192)

/** The highest level within a bin of `hz`, in dB where a full-scale sine reads 0. */
function lineAt(spectrum: Float32Array, hz: number): number {
  const centre = Math.round(hz / BIN)
  return Math.max(spectrum[centre - 1] ?? -140, spectrum[centre]!, spectrum[centre + 1] ?? -140)
}

const strongest = (spectrum: Float32Array) => spectrum.reduce((top, v) => Math.max(top, v), -140)

/** The frequencies of the lines of a spectrum that stand above `floor` dB. */
function linesOver(spectrum: Float32Array, floor: number): number[] {
  const found: number[] = []
  for (let k = 1; k < spectrum.length - 1; k += 1) {
    const here = spectrum[k]!
    if (here > floor && here >= spectrum[k - 1]! && here > spectrum[k + 1]!) found.push(k * BIN)
  }
  return found
}

/** The lines of a spectrum that stand within `within` dB of its strongest. */
const linesWithin = (spectrum: Float32Array, within: number) =>
  linesOver(spectrum, strongest(spectrum) - within)

/** The loudest bin further than four bins from every one of `clear`, in hertz. */
function loudestAwayFrom(spectrum: Float32Array, clear: number[]): number {
  const centres = clear.map((hz) => Math.round(hz / BIN))
  let top = -Infinity
  for (let k = 0; k < spectrum.length; k += 1) {
    if (centres.every((centre) => Math.abs(k - centre) > 4)) top = Math.max(top, spectrum[k]!)
  }
  return top
}

/** The loudest bin above 0.47 of the sample rate, the device's band limit. */
function loudestOverTheLimit(spectrum: Float32Array): number {
  let top = -Infinity
  for (let k = Math.ceil((0.47 * RATE) / BIN); k < spectrum.length; k += 1) {
    top = Math.max(top, spectrum[k]!)
  }
  return top
}

/** Seconds from a control tap's peak until it has fallen to `part` of that peak. */
function fallTime(trace: Float32Array, part: number): number {
  const top = peak(trace)
  const from = trace.indexOf(top)
  let k = from
  while (k < trace.length && trace[k]! > top * part) k += 1
  return (k - from) / POINT_RATE
}

/** Where a curve against the index (0 to 8 rad) crosses zero, in radians. */
function zeroCrossings(curve: Float32Array): number[] {
  const step = 8 / (curve.length - 1)
  const found: number[] = []
  for (let p = 1; p < curve.length; p += 1) {
    const a = curve[p - 1]!
    const b = curve[p]!
    if (a * b < 0) found.push(step * (p - 1 + a / (a - b)))
  }
  return found
}

/**
 * The line of the carrier with nothing pushing it, held at `pitch`: what the levels of the
 * lessons' lines are read against. Every sound of the lab is written at the level of one voice
 * of the device (0.29 of full scale), so the bare carrier reads −10.75 dB and not 0.
 */
function bareCarrier(fm: Lab, pitch: number): number {
  fm.render(nothing, { index: 0, pitch })
  return strongest(heldSpectrum(fm))
}

/** How far the first pair of side bands of a note at 220 Hz and a Ratio of 3.5 stands under the carrier. */
const pairUnder = (spectrum: Float32Array) => ({
  lower: lineAt(spectrum, 220) - lineAt(spectrum, 550),
  upper: lineAt(spectrum, 220) - lineAt(spectrum, 990),
})

/** A named set as its card plays it, with `over` laid on its values. */
function played(fm: Lab, name: string, over: Record<string, number> = {}): RenderResult {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values } = resolveSet(fm.description, set)
  return fm.render(nothing, { ...values, ...over })
}

const sameSamples = (a: Float32Array, b: Float32Array) =>
  a.length === b.length && a.every((v, i) => v === b[i])

describe('frequency modulation', () => {
  it('is a sound lab on its own notes: every tap says something, loops, and answers to every control', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, {})
    expectSoundLab(fm, nothing, result)
  })

  it('has a build path of nine steps, each changing a built tap and none the main path, the last held to the device', async () => {
    const fm = await lab('frequency-modulation')
    // Feedback is 0 where the lab starts, and its piece would then change nothing.
    expectBuild(fm, nothing, { feedback: 0.5 })
    expect(fm.description.controls.find((one) => one.id === 'build')!.choices).toEqual([
      'A carrier',
      'A modulator into its phase',
      'The index',
      'The ratio',
      'An envelope on the index',
      'An envelope on the level',
      'Feedback',
      'A second pair',
      'A guard on the way out',
    ])
    const result = fm.render(nothing, {})
    expect(result.checks.builtStep).toBe(STEP.guard)
    expect(result.checks.builtBound).toBe(-120)
  })

  // ---- part 1: why ---------------------------------------------------------------------------

  it('adds two sines to 2 lines and nothing else: every other bin is more than 100 dB under them (claim added-two)', async () => {
    const fm = await lab('frequency-modulation')
    fm.render(nothing, { pitch: ON_A_BIN })
    const added = heldSpectrum(fm, 'added')
    expectWritten(linesWithin(added, 100).length, '2')
    const elsewhere = loudestAwayFrom(added, [ON_A_BIN, 3.5 * ON_A_BIN])
    expectWritten(strongest(added) - elsewhere, 'more than 100 dB')
  })

  it('makes 13 lines within 60 dB of the strongest when the same modulator goes into the phase at an Index of 2 (claim lines-thirteen)', async () => {
    const fm = await lab('frequency-modulation')
    fm.render(nothing, { pitch: ON_A_BIN })
    expectWritten(linesWithin(heldSpectrum(fm), 60).length, '13')
    // The same two sines, the same loudness of modulator: only where it is put differs.
    fm.render(nothing, { pitch: ON_A_BIN, index: 0 })
    expect(linesWithin(heldSpectrum(fm), 60)).toHaveLength(1)
  })

  it('all but loses the carrier at an Index of 2.405: its line is 81 dB under the bare carrier (claim carrier-null)', async () => {
    const fm = await lab('frequency-modulation')
    const bare = bareCarrier(fm, ON_A_BIN)
    fm.render(nothing, { index: 2.405, pitch: ON_A_BIN })
    expectWritten(bare - lineAt(heldSpectrum(fm), ON_A_BIN), '81 dB')
  })

  it('holds the level of the held tone the same from an Index of 0 to 8, on a note at 117.19 Hz that is granted all of it: less than 0.01 dB apart (claim power-same)', async () => {
    const fm = await lab('frequency-modulation')
    // On bin 10. At 468.75 Hz the key scaling grants no more than 5.98 rad, and the last
    // four steps of the Index would all be one tone.
    const pitch = 10 * BIN
    const levels: number[] = []
    for (let index = 0; index <= 8; index += 0.5) {
      const result = fm.render(nothing, { index, pitch })
      expect(result.checks.granted).toBeCloseTo(index, 3)
      levels.push(gainToDb(rms(tap(result, 'steady'), 2000, 90_000)))
    }
    expectWritten(Math.max(...levels) - Math.min(...levels), 'less than 0.01 dB')
  })

  // ---- part 2: one picture -------------------------------------------------------------------

  it('is one sine at an Index of 0: every other line of the held tone is more than 125 dB under it (claim one-sine)', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, { index: 0, pitch: ON_A_BIN })
    const held = heldSpectrum(fm)
    // 129 dB is as far as the lab's measure reaches under a line at this level.
    expectWritten(lineAt(held, ON_A_BIN) - loudestAwayFrom(held, [ON_A_BIN]), 'more than 125 dB')
    // And in the device: the carrier with its phase modulated is the carrier alone, sample for sample.
    expect(sameSamples(tap(result, 'modulated'), tap(result, 'carrier'))).toBe(true)
  })

  it('stands the first lines over the carrier at 2.5, 4.5, 6 and 8 times the note at a Ratio of 3.5 (claim ladder)', async () => {
    const fm = await lab('frequency-modulation')
    fm.render(nothing, { pitch: ON_A_BIN })
    const lines = linesWithin(heldSpectrum(fm), 60).map((hz) => hz / ON_A_BIN)
    expectWritten(lines[1]!, '2.5')
    expectWritten(lines[2]!, '4.5')
    expectWritten(lines[3]!, '6')
    expectWritten(lines[4]!, '8')
    expect(lines[0]).toBe(1)
    // The whole ladder: the upper side bands at 4.5, 8, 11.5 ..., the lower ones come back at 2.5, 6, 9.5 ...
    expect(lines).toEqual([1, 2.5, 4.5, 6, 8, 9.5, 11.5, 13, 15, 16.5, 18.5, 20, 22])
  })

  it('puts every line within one bin, 11.7 Hz, of the carrier plus or minus a whole number of modulators (claim sidebands-where)', async () => {
    const fm = await lab('frequency-modulation')
    // The device counts its ratio as modulator over carrier: 2 is a modulator at twice the note.
    let worst = 0
    for (const [position, ratio] of [
      [RATIO.one, 1],
      [RATIO.two, 2],
      [RATIO.threeAndAHalf, 3.5],
    ] as const) {
      fm.render(nothing, { ratio: position, pitch: ON_A_BIN })
      const lines = linesWithin(heldSpectrum(fm), 60)
      expect(lines.length).toBeGreaterThan(5)
      for (const hz of lines) {
        const k = Math.round((hz - ON_A_BIN) / (ratio * ON_A_BIN))
        const upper = ON_A_BIN + k * ratio * ON_A_BIN
        // A lower side band below zero comes back up at the same distance above it.
        const j = Math.round((hz + ON_A_BIN) / (ratio * ON_A_BIN))
        const reflected = j * ratio * ON_A_BIN - ON_A_BIN
        worst = Math.max(worst, Math.min(Math.abs(hz - upper), Math.abs(hz - reflected)))
      }
    }
    expectWritten(worst, 'at most 11.7 Hz')
    const bare = bareCarrier(fm, ON_A_BIN)
    // At a Ratio of 2 that is the odd multiples of the note and nothing on the even ones.
    fm.render(nothing, { ratio: RATIO.two, pitch: ON_A_BIN })
    const odd = heldSpectrum(fm)
    for (const multiple of [1, 3, 5, 7])
      expect(lineAt(odd, multiple * ON_A_BIN) - bare).toBeGreaterThan(-30)
    for (const multiple of [2, 4, 6, 8])
      expect(lineAt(odd, multiple * ON_A_BIN) - bare).toBeLessThan(-90)
    // At a Ratio of 1 there is a line on every multiple of the note.
    fm.render(nothing, { ratio: RATIO.one, pitch: ON_A_BIN })
    const every = heldSpectrum(fm)
    for (const multiple of [1, 2, 3, 4])
      expect(lineAt(every, multiple * ON_A_BIN) - bare).toBeGreaterThan(-30)
    // At 3.5 nothing stands on the note's second, third, fourth, fifth or seventh harmonic.
    fm.render(nothing, { pitch: ON_A_BIN })
    const uneven = heldSpectrum(fm)
    for (const multiple of [2, 3, 4, 5, 7])
      expect(lineAt(uneven, multiple * ON_A_BIN) - bare).toBeLessThan(-90)
    // The ratio moves the lines and leaves their heights, where none lands on another: with the
    // Index at 2 on a note at 222.66 Hz (bin 19, low enough for every Ratio to be granted it) the
    // carrier's line stands J0(2) = 0.2239, 13.0 dB, under the bare carrier at every Ratio but
    // 0.5, 1 and 2, where a side band that comes back from below zero lands on it.
    const low = 19 * BIN
    const bareLow = bareCarrier(fm, low)
    for (let position = 0; position < 12; position += 1) {
      const result = fm.render(nothing, { ratio: position, pitch: low })
      expect(result.checks.granted, `Ratio ${position}`).toBeCloseTo(2, 3)
      const under = bareLow - lineAt(heldSpectrum(fm), low)
      if ([RATIO.half, RATIO.one, RATIO.two].includes(position))
        expect(Math.abs(under - 13), `Ratio ${position}`).toBeGreaterThan(0.5)
      else expect(under, `Ratio ${position}`).toBeCloseTo(13.0, 1)
    }
  })

  // ---- part 3: what it is used on ------------------------------------------------------------

  it('renders every named set: the tap its card plays is finite and sounds, and no card is louder than the note at full level', async () => {
    const fm = await lab('frequency-modulation')
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = played(fm, name)
      const { tap: plays } = resolveSet(fm.description, set)
      for (const data of result.taps[plays ?? 'out']!.channels_data) {
        expect(
          data.every((v) => Number.isFinite(v)),
          `${name} is finite`,
        ).toBe(true)
        expect(gainToDb(rms(data)), `${name} sounds`).toBeGreaterThan(-40)
        expect(peak(data), `${name} stays under full scale`).toBeLessThan(0.5)
      }
    }
  })

  it("leaves the bell's line at the note 20 dB under the bare carrier, with the lines at 2.5 and 4.5 times the note 6.54 dB under it (claim use-bell)", async () => {
    const fm = await lab('frequency-modulation')
    const bare = bareCarrier(fm, ON_A_BIN)
    // The card's Ratio and Index, held, on a note that stands on a bin: Detune would move it off.
    played(fm, 'bell', { pitch: ON_A_BIN, detune: 0 })
    const held = heldSpectrum(fm)
    expectWritten(bare - lineAt(held, ON_A_BIN), '20 dB')
    expectWritten(bare - lineAt(held, 2.5 * ON_A_BIN), '6.54 dB')
    expectWritten(bare - lineAt(held, 4.5 * ON_A_BIN), '6.54 dB')
  })

  it("puts the tine's lines on the note's harmonics, the fifth of them 39 dB under the bare carrier (claim use-tine)", async () => {
    const fm = await lab('frequency-modulation')
    const bare = bareCarrier(fm, ON_A_BIN)
    played(fm, 'tine', { pitch: ON_A_BIN, detune: 0 })
    const held = heldSpectrum(fm)
    expectWritten(bare - lineAt(held, 5 * ON_A_BIN), '39 dB')
    expect(linesWithin(held, 40).map((hz) => hz / ON_A_BIN)).toEqual([1, 2, 3, 4, 5])
  })

  it("gives the bass note's held tone 11 harmonics within 40 dB of its strongest, where it has 7 with no Feedback (claim use-bass)", async () => {
    const fm = await lab('frequency-modulation')
    played(fm, 'bass', { pitch: ON_A_BIN })
    expectWritten(linesWithin(heldSpectrum(fm), 40).length, '11')
    played(fm, 'bass', { pitch: ON_A_BIN, feedback: 0 })
    expectWritten(linesWithin(heldSpectrum(fm), 40).length, '7')
  })

  it('gives the hollow tone odd harmonics only: the third and fifth 10 and 11 dB under the bare carrier, the even ones more than 120 dB under (claim use-reed)', async () => {
    const fm = await lab('frequency-modulation')
    const bare = bareCarrier(fm, ON_A_BIN)
    played(fm, 'reed', { pitch: ON_A_BIN })
    const held = heldSpectrum(fm)
    expectWritten(bare - lineAt(held, 3 * ON_A_BIN), '10 dB')
    expectWritten(bare - lineAt(held, 5 * ON_A_BIN), '11 dB')
    for (const even of [2, 4, 6])
      expectWritten(bare - lineAt(held, even * ON_A_BIN), 'more than 120 dB')
  })

  // ---- part 4: the build ---------------------------------------------------------------------

  /** The lines of the built tone within 60 dB of its strongest, at a step, on a note on a bin. */
  const builtLines = (fm: Lab, step: number) => {
    fm.render(nothing, { build: step, pitch: ON_A_BIN })
    return linesWithin(heldSpectrum(fm, 'built'), 60).length
  }

  it('makes 13 lines of the carrier with the bare modulator in its phase (claim build-ladder)', async () => {
    const fm = await lab('frequency-modulation')
    expectWritten(builtLines(fm, STEP.modulator), '13')
    // The piece switched off: the step before is one line.
    expect(matchesWritten(builtLines(fm, STEP.carrier), '13')).toBe(false)
    expect(builtLines(fm, STEP.carrier)).toBe(1)
  })

  it('leaves 7 lines with the Index at 2 (claim build-index)', async () => {
    const fm = await lab('frequency-modulation')
    expectWritten(builtLines(fm, STEP.index), '7')
    // The piece switched off: the step before pushes a whole cycle whatever the Index says.
    expect(matchesWritten(builtLines(fm, STEP.modulator), '7')).toBe(false)
    // And the piece answers to its control: fewer lines for less Index, more for more.
    const at = (index: number) => {
      fm.render(nothing, { build: STEP.index, pitch: ON_A_BIN, index })
      return linesWithin(heldSpectrum(fm, 'built'), 60).length
    }
    expect([at(0.5), at(1), at(4)]).toEqual([4, 5, 10])
  })

  it('takes the line at twice the note, the strongest a step before, more than 120 dB under the strongest (claim build-ratio)', async () => {
    const fm = await lab('frequency-modulation')
    const under = (step: number) => {
      fm.render(nothing, { build: step, pitch: ON_A_BIN })
      const built = heldSpectrum(fm, 'built')
      return strongest(built) - lineAt(built, 2 * ON_A_BIN)
    }
    expectWritten(under(STEP.ratio), 'more than 120 dB')
    // The piece switched off: at the step before that line is the strongest there is.
    expect(matchesWritten(under(STEP.index), 'more than 120 dB')).toBe(false)
    expect(under(STEP.index)).toBe(0)
  })

  it('stands the first pair 4 and 5 dB under the carrier in the first 85 ms and 79 and 80 dB under it half a second in (claim build-bright)', async () => {
    const fm = await lab('frequency-modulation')
    fm.render(nothing, { build: STEP.bright })
    const first = pairUnder(atTheStrike(fm, 'built'))
    const later = pairUnder(halfASecondIn(fm, 'built'))
    expectWritten(first.lower, '4 dB')
    expectWritten(first.upper, '5 dB')
    expectWritten(later.lower, '79 dB')
    expectWritten(later.upper, '80 dB')
    // The piece switched off: at the step before the pair stands over the carrier, then as now.
    fm.render(nothing, { build: STEP.ratio })
    const held = pairUnder(halfASecondIn(fm, 'built'))
    expect(matchesWritten(held.lower, '79 dB')).toBe(false)
    expect(matchesWritten(held.upper, '80 dB')).toBe(false)
    expect(held.lower).toBeLessThan(0)
    expect(pairUnder(atTheStrike(fm, 'built')).lower).toBeLessThan(0)
  })

  it('brings the built note 35 dB down a second after the strike (claim build-level)', async () => {
    const fm = await lab('frequency-modulation')
    // The level of the 85 ms from a second in, under that of the first 85 ms.
    const fallen = (step: number) => {
      const built = tap(fm.render(nothing, { build: step }), 'built')
      return gainToDb(rms(built, 0, 4096)) - gainToDb(rms(built, seconds(1), seconds(1) + 4096))
    }
    expectWritten(fallen(STEP.level), '35 dB')
    // The piece switched off: the step before is a held tone.
    expect(matchesWritten(fallen(STEP.bright), '35 dB')).toBe(false)
    expect(Math.abs(fallen(STEP.bright))).toBeLessThan(0.5)
  })

  it('bends the built modulator at full Feedback: its second harmonic 10 dB under its first in the first 85 ms (claim build-feedback)', async () => {
    const fm = await lab('frequency-modulation')
    // The starting note moved 1 Hz, to 220.98 Hz, so that its modulator stands on bin 66 (773 Hz).
    const pitch = (66 * BIN) / 3.5
    const second = (step: number) => {
      fm.render(nothing, { build: step, feedback: 1, pitch })
      const bent = atTheStrike(fm, 'builtModulator')
      return lineAt(bent, 66 * BIN) - lineAt(bent, 132 * BIN)
    }
    expectWritten(second(STEP.feedback), '10 dB')
    // The piece switched off: at the step before the modulator is the table's sine.
    expect(matchesWritten(second(STEP.level), '10 dB')).toBe(false)
    expect(second(STEP.level)).toBeGreaterThan(100)
  })

  it('voices the right channel duller: its first pair between 11 and 13 dB under the carrier at the strike, where the left has 4 and 5 dB (claim build-second)', async () => {
    const fm = await lab('frequency-modulation')
    fm.render(nothing, { build: STEP.second })
    const left = pairUnder(atTheStrike(fm, 'built', 0))
    const right = pairUnder(atTheStrike(fm, 'built', 1))
    // 11.27 and 12.45 dB: the second stands on the edge between "12 dB" and "13 dB", so the
    // sentence gives the two bounds both lines lie between.
    for (const line of [right.lower, right.upper]) {
      expectWritten(line, 'more than 11 dB')
      expectWritten(line, 'less than 13 dB')
    }
    expectWritten(left.lower, '4 dB')
    expectWritten(left.upper, '5 dB')
    // The piece switched off: at the step before the right channel is the left.
    const before = fm.render(nothing, { build: STEP.feedback })
    expect(sameSamples(tap(before, 'built', 0), tap(before, 'built', 1))).toBe(true)
    const alike = pairUnder(atTheStrike(fm, 'built', 1))
    expect(matchesWritten(alike.lower, 'more than 11 dB')).toBe(false)
    expect(matchesWritten(alike.upper, 'more than 11 dB')).toBe(false)
  })

  it('takes the standing part of a held note from 36 dB under the note to more than 120 dB under it (claim build-guard)', async () => {
    const fm = await lab('frequency-modulation')
    // A held note at a Ratio of 1 with full Feedback: the mean of the left channel from half a
    // second in, under the level of the same stretch.
    const under = (step: number) => {
      const built = tap(
        fm.render(nothing, { build: step, ratio: RATIO.one, feedback: 1, sustain: 1 }),
        'built',
      )
      const from = seconds(0.5)
      return gainToDb(rms(built, from)) - gainToDb(Math.abs(mean(built, from)))
    }
    expectWritten(under(STEP.guard), 'more than 120 dB')
    // The piece switched off: the step before.
    expectWritten(under(STEP.second), '36 dB')
    expect(matchesWritten(under(STEP.second), 'more than 120 dB')).toBe(false)
  })

  it("is the device's two channels, sample for sample, with all nine pieces, at every setting tried (claim built-exact)", async () => {
    const fm = await lab('frequency-modulation')
    const tried: Record<string, number>[] = [
      {},
      { feedback: 1, index: 6 },
      { ratio: RATIO.fourteen, index: 8 },
      { decay: 20, index: 8, pitch: 55 },
      { decay: 0.05, pitch: 1760, ratio: RATIO.half },
      { detune: 30, spread: 0.3, feedback: 0.4, decay: 2.5 },
      { attack: 0.8, sustain: 0.7, ratio: RATIO.one, index: 4 },
    ]
    for (const values of tried) {
      const result = fm.render(nothing, { ...values, build: STEP.guard })
      for (const channel of [0, 1]) {
        expect(
          sameSamples(tap(result, 'built', channel), tap(result, 'out', channel)),
          `channel ${channel} at ${JSON.stringify(values)}`,
        ).toBe(true)
      }
      expectWritten(-result.checks.builtDifference!, 'at least 140 dB')
    }
    // A piece short it is not: without the guard the samples differ.
    const short = fm.render(nothing, { build: STEP.second })
    expect(sameSamples(tap(short, 'built'), tap(short, 'out'))).toBe(false)
  })

  // ---- part 5: inside the engine -------------------------------------------------------------

  it('grants the index the control asks for: 2.00 rad for 2 at the starting settings (claim index-strike)', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, {})
    expectWritten(result.checks.granted!, '2.00 rad')
    // The trace of the note's index reaches it at the strike (a point every 16 samples).
    expect(peak(tap(result, 'indexNow'))).toBeGreaterThan(1.98)
    expect(peak(tap(result, 'indexNow'))).toBeLessThanOrEqual(2.0001)
    // Under 133 Hz the key scaling stands at its upper bound, 1.4: the same Index takes the same
    // Brightness at 55 Hz and at 110 Hz, and a lower one than at 220 Hz.
    const low = fm.render(nothing, { pitch: 55 }).checks.brightness!
    expect(fm.render(nothing, { pitch: 110 }).checks.brightness).toBe(low)
    expect(low).toBeCloseTo((2 / (8 * 1.4)) ** (2 / 3), 4)
    expect(low).toBeLessThan(result.checks.brightness!)
  })

  it("takes 0.43 s off the modulator's envelope for 60 dB (claim mod-decay) and 1.7 s off the carrier's (claim amp-decay)", async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, {})
    // Decay 0.4 s, stretched by key_time_scale(220 Hz) = 1.072; the carrier four times as long.
    expectWritten(fallTime(tap(result, 'modEnv'), 0.001), '0.43 s')
    expectWritten(fallTime(tap(result, 'ampEnv'), 0.001), '1.7 s')
  })

  it('leaves the difference between a sine whose frequency is swung and the sine whose phase is pushed between 64 and 65 dB under that sine (claim as-frequency)', async () => {
    const fm = await lab('frequency-modulation')
    const under = -fm.render(nothing, {}).checks.asFrequency!
    expectWritten(under, 'more than 64 dB')
    expectWritten(under, 'less than 65 dB')
  })

  it('reads the carrier 2.3 dB and the first pair 7.1 dB under the bare carrier at an Index of 1 (claim bessel-one)', async () => {
    const fm = await lab('frequency-modulation')
    const bare = bareCarrier(fm, ON_A_BIN)
    const result = fm.render(nothing, { index: 1, pitch: ON_A_BIN })
    const held = heldSpectrum(fm)
    // J0(1) = 0.7652 and J1(1) = 0.4401.
    expectWritten(bare - lineAt(held, ON_A_BIN), '2.3 dB')
    expectWritten(bare - lineAt(held, 4.5 * ON_A_BIN), '7.1 dB')
    // The curves measured from the kit's table sines give the same two numbers.
    expect(tap(result, 'line0')[20]).toBeCloseTo(0.7652, 3)
    expect(tap(result, 'line1')[20]).toBeCloseTo(0.4401, 3)
  })

  it('brings the first lower side band back up from below zero 7.1 dB under the bare carrier, the level of the upper one (claim reflected-level)', async () => {
    const fm = await lab('frequency-modulation')
    const bare = bareCarrier(fm, ON_A_BIN)
    fm.render(nothing, { ratio: RATIO.threeAndAHalf, index: 1, pitch: ON_A_BIN })
    const held = heldSpectrum(fm)
    expectWritten(bare - lineAt(held, 3.5 * ON_A_BIN - ON_A_BIN), '7.1 dB')
    expectWritten(bare - lineAt(held, ON_A_BIN + 3.5 * ON_A_BIN), '7.1 dB')
  })

  it('adds the reflected side band to the carrier at a Ratio of 2: 1.6 dB over the bare carrier at an Index of 1 (claim ratio-two)', async () => {
    const fm = await lab('frequency-modulation')
    const bare = bareCarrier(fm, ON_A_BIN)
    fm.render(nothing, { ratio: RATIO.two, index: 1, pitch: ON_A_BIN })
    // J0(1) + J1(1) = 1.205, which is +1.62 dB.
    expectWritten(lineAt(heldSpectrum(fm), ON_A_BIN) - bare, '1.6 dB')
  })

  it('crosses zero where the Bessel functions do: 2.405 rad and 5.520 rad, 3.832 rad and 7.016 rad, 5.136 rad (claim line-zeros)', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, {})
    const zeros = (id: string) => zeroCrossings(tap(result, id)).filter((at) => at > 0.5)
    const carrier = zeros('line0')
    const first = zeros('line1')
    const second = zeros('line2')
    expect(carrier).toHaveLength(2)
    expectWritten(carrier[0]!, '2.405 rad')
    expectWritten(carrier[1]!, '5.520 rad')
    expect(first).toHaveLength(2)
    expectWritten(first[0]!, '3.832 rad')
    expectWritten(first[1]!, '7.016 rad')
    expect(second).toHaveLength(1)
    expectWritten(second[0]!, '5.136 rad')
    // The curves do not move with the controls: they are a property of the operator.
    const other = fm.render(nothing, { index: 7, pitch: 880, ratio: RATIO.one })
    expect(tap(other, 'line0')).toEqual(tap(result, 'line0'))
  })

  it('holds all but 0.24 % of the power in the carrier and three pairs at an Index of 2 (claim carson)', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, {})
    // Point 40 of 161 stands at 2 rad. The index plus one is three pairs.
    const at = (id: string) => tap(result, id)[40]!
    const power = at('line0') ** 2 + 2 * (at('line1') ** 2 + at('line2') ** 2 + at('line3') ** 2)
    expectWritten(100 * (1 - power), '0.24 %')
  })

  it('draws the picture of the growing side bands from the same pair: the carrier on row 128, a side band every eighth row, each as strong as its curve says', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, {})
    const growth = result.taps.growth!
    const rows = growth.length / 161
    expect(rows).toBe(513)
    const column = (index: number) =>
      tap(result, 'growth').subarray(
        Math.round(index / 0.05) * rows,
        (Math.round(index / 0.05) + 1) * rows,
      )
    // At an index of 0 the carrier's row is at full level and its neighbours a side band away are silent.
    expect(column(0)[128]).toBeGreaterThan(-0.1)
    expect(column(0)[136]).toBeLessThan(-100)
    // At 2 rad each row reads what its curve reads there.
    for (const [k, id] of [
      [0, 'line0'],
      [1, 'line1'],
      [2, 'line2'],
      [3, 'line3'],
    ] as const) {
      const curve = gainToDb(Math.abs(tap(result, id)[40]!))
      expect(column(2)[128 + 8 * k]).toBeCloseTo(curve, 1)
      expect(column(2)[128 - 8 * k]).toBeCloseTo(curve, 1)
    }
  })

  it('is bright at the strike and pure as it rings: the first pair 4 and 5 dB under the carrier, then 78 and 79 dB under (claim bright-then-pure)', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, {})
    // 220 Hz at a Ratio of 3.5: the first pair is at 550 Hz (reflected) and 990 Hz.
    const first = pairUnder(atTheStrike(fm, 'out'))
    const later = pairUnder(halfASecondIn(fm, 'out'))
    expectWritten(first.lower, '4 dB')
    expectWritten(first.upper, '5 dB')
    expectWritten(later.lower, '78 dB')
    expectWritten(later.upper, '79 dB')
    // The two spectra the lab writes out are those two stretches of the left channel.
    expect(pairUnder(tap(result, 'strike')).lower).toBeCloseTo(first.lower, 3)
    expect(pairUnder(tap(result, 'ringing')).upper).toBeCloseTo(later.upper, 3)
  })

  it('gives the second pair 0.70 times the index, gone in 0.26 s against 0.43 s (claim pair-b)', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, {})
    const first = tap(result, 'indexNow')
    const second = tap(result, 'indexB')
    expectWritten(peak(second) / peak(first), '0.70')
    expectWritten(fallTime(second, 0.001), '0.26 s')
    expectWritten(fallTime(first, 0.001), '0.43 s')
    // Spread 1 puts it alone on the right, at the level the first pair has on the left.
    expect(peak(tap(result, 'out', 1))).toBeCloseTo(peak(tap(result, 'out', 0)), 2)
    // And the right channel is the second pair's tap, a guard apart.
    expect(peak(tap(result, 'pairB'))).toBeCloseTo(peak(tap(result, 'out', 1)), 2)
  })

  it('adds the two carriers in the middle when Detune is 0: from half a second in the note is 3.0 dB stronger at a Spread of 0 than at 1 (claim spread-power)', async () => {
    const fm = await lab('frequency-modulation')
    // The power of both channels over the second from half a second in, where the index has died
    // and each pair is its carrier alone.
    const power = (spread: number, detune = 0) => {
      const result = fm.render(nothing, { spread, detune })
      const from = seconds(0.5)
      const to = seconds(1.5)
      const left = rms(tap(result, 'out', 0), from, to)
      const right = rms(tap(result, 'out', 1), from, to)
      return gainToDb(Math.sqrt(left * left + right * right))
    }
    expectWritten(power(0) - power(1), '3.0 dB')
  })

  it('bends the modulator towards a sawtooth: at full Feedback its second harmonic is 10 dB under its first (claim feedback-saw)', async () => {
    const fm = await lab('frequency-modulation')
    // The starting note moved 1 Hz, to 220.98 Hz, so that its modulator stands on bin 66 (773 Hz).
    const pitch = (66 * BIN) / 3.5
    fm.render(nothing, { feedback: 1, pitch })
    const bent = heldSpectrum(fm, 'steadyModulator')
    expectWritten(lineAt(bent, 66 * BIN) - lineAt(bent, 132 * BIN), '10 dB')
    // With no feedback it is the table's sine and has no second harmonic.
    fm.render(nothing, { feedback: 0, pitch })
    const plain = heldSpectrum(fm, 'steadyModulator')
    expect(lineAt(plain, 66 * BIN) - lineAt(plain, 132 * BIN)).toBeGreaterThan(100)
    // Where a bent modulator's harmonics would not fit under the band limit the device
    // withholds the Feedback: at 878.9 Hz and a Ratio of 14 the modulator stands on bin 1,050
    // (12.3 kHz), and at full Feedback it is still the table's sine.
    fm.render(nothing, { feedback: 1, ratio: RATIO.fourteen, pitch: (1050 * BIN) / 14 })
    const high = heldSpectrum(fm, 'steadyModulator')
    expect(lineAt(high, 1050 * BIN) - loudestAwayFrom(high, [1050 * BIN])).toBeGreaterThan(100)
  })

  it("works both channels out again from the device's own state: the difference at least 140 dB under the device's output, the floor of the measure (claim rebuilt-exact)", async () => {
    const fm = await lab('frequency-modulation')
    const tried: Record<string, number>[] = [
      {},
      { feedback: 1, index: 6 },
      { ratio: RATIO.fourteen, index: 8 },
      { decay: 20, index: 8, pitch: 55 },
      { decay: 0.05, pitch: 1760, ratio: RATIO.half },
      { detune: 30, spread: 0.3, feedback: 0.4, decay: 2.5 },
    ]
    for (const values of tried)
      expectWritten(-fm.render(nothing, values).checks.rebuilt!, 'at least 140 dB')
  })

  // ---- part 6: ways to use it ----------------------------------------------------------------

  it("leaves the tick's carrier 0.55 dB under the bare carrier on a note at 222.66 Hz, and puts one pair, at 13 and 15 times the note, 12.3 dB under it and the next pair 30 dB under it (claim way-tick)", async () => {
    const fm = await lab('frequency-modulation')
    // On bin 19, 222.66 Hz. At a Ratio of 14 a note at 468.75 Hz is granted less than half of
    // the card's Index, and its lines would be those of another setting.
    const pitch = 19 * BIN
    const bare = bareCarrier(fm, pitch)
    const result = played(fm, 'tick', { pitch })
    expect(result.checks.granted).toBeCloseTo(settings.sets.tick!.values!.index!, 3)
    const held = heldSpectrum(fm)
    expectWritten(bare - lineAt(held, pitch), '0.55 dB')
    expectWritten(bare - lineAt(held, 13 * pitch), '12.3 dB')
    expectWritten(bare - lineAt(held, 15 * pitch), '12.3 dB')
    expectWritten(bare - lineAt(held, 27 * pitch), '30 dB')
    expectWritten(bare - lineAt(held, 29 * pitch), '30 dB')
    // In the note itself the pair is gone a quarter of a second in.
    played(fm, 'tick')
    const later = fm.spectrum('out', 0, 12_000, 8192)
    expect(lineAt(later, 220) - lineAt(later, 13 * 220)).toBeGreaterThan(90)
  })

  it('keeps the first pair 9 and 10 dB under the carrier half a second into the lingering note (claim way-linger)', async () => {
    const fm = await lab('frequency-modulation')
    played(fm, 'linger')
    const later = pairUnder(halfASecondIn(fm, 'out'))
    expectWritten(later.lower, '9 dB')
    expectWritten(later.upper, '10 dB')
  })

  it("lifts the tenth harmonic of the held tone to 19 dB under its strongest line with the modulator's Feedback full, from more than 100 dB under it with none (claim way-edge)", async () => {
    const fm = await lab('frequency-modulation')
    const tenth = (over: Record<string, number>) => {
      played(fm, 'edge', { pitch: ON_A_BIN, ...over })
      const held = heldSpectrum(fm)
      return strongest(held) - lineAt(held, 10 * ON_A_BIN)
    }
    expectWritten(tenth({}), '19 dB')
    expectWritten(tenth({ feedback: 0 }), 'more than 100 dB')
  })

  // ---- part 7: what goes wrong ---------------------------------------------------------------

  it('caps the index at 2.78 rad of the 8 asked at 220 Hz and a Ratio of 14 (claim cap-granted)', async () => {
    const fm = await lab('frequency-modulation')
    expectWritten(played(fm, 'fold').checks.granted!, '2.78 rad')
    // Below the cap the control is granted in full: a Ratio of 3.5 leaves room for 8 rad at 110 Hz.
    expect(fm.render(nothing, { index: 8, pitch: 110 }).checks.granted).toBeCloseTo(8, 3)
  })

  it('keeps the capped tone 71 dB under the bare carrier above 0.47 of the sample rate, where the uncapped tone folds back 13 dB under it (claim cap-clean)', async () => {
    const fm = await lab('frequency-modulation')
    const bare = bareCarrier(fm, 220)
    played(fm, 'fold')
    const capped = heldSpectrum(fm)
    const free = heldSpectrum(fm, 'uncapped')
    expectWritten(bare - loudestOverTheLimit(capped), '71 dB')
    expectWritten(bare - loudestOverTheLimit(free), '13 dB')
    // A folded line stands between the rungs of the ladder: 220 + 9 × 3,080 Hz comes back at 20,060 Hz.
    const folded = RATE - (220 + 9 * 3080)
    expect(lineAt(free, folded) - bare).toBeGreaterThan(-20)
    expect(lineAt(capped, folded) - bare).toBeLessThan(-80)
  })

  it('grants a note at 880 Hz no more than 2.64 rad at a Ratio of 3.5 (claim key-scale)', async () => {
    const fm = await lab('frequency-modulation')
    expectWritten(fm.render(nothing, { pitch: 880, index: 8 }).checks.granted!, '2.64 rad')
    // With room to spare (a Ratio of 1) the key scaling alone decides: 8 × sqrt(261.63 / 880).
    const scaled = fm.render(nothing, { pitch: 880, index: 8, ratio: RATIO.one }).checks.granted
    expect(scaled).toBeCloseTo(8 * Math.sqrt(261.63 / 880), 2)
  })

  it('grants the high note between 0.47 and 0.48 rad of the 8 asked (claim fault-high)', async () => {
    const fm = await lab('frequency-modulation')
    const granted = played(fm, 'high').checks.granted!
    expectWritten(granted, 'more than 0.47 rad')
    expectWritten(granted, 'less than 0.48 rad')
  })

  it('does not run a modulator that would sit above the limit: at 1,760 Hz and a Ratio of 14 the note is one sine (claim modulator-silent)', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, { pitch: 1760, ratio: RATIO.fourteen, index: 8 })
    expect(result.checks.granted).toBe(0)
    expect(sameSamples(tap(result, 'steady'), tap(result, 'steadyCarrier'))).toBe(true)
    expect(peak(tap(result, 'modulator'))).toBe(0)
    expect(sameSamples(tap(result, 'modulated'), tap(result, 'carrier'))).toBe(true)
  })

  it('stands the first pair 5.7 dB under the bare carrier in the tone that has lost its own line (claim fault-hollow)', async () => {
    const fm = await lab('frequency-modulation')
    const bare = bareCarrier(fm, ON_A_BIN)
    played(fm, 'hollow', { pitch: ON_A_BIN })
    const held = heldSpectrum(fm)
    expectWritten(bare - lineAt(held, 2.5 * ON_A_BIN), '5.7 dB')
    expectWritten(bare - lineAt(held, 4.5 * ON_A_BIN), '5.7 dB')
    expect(bare - lineAt(held, ON_A_BIN)).toBeGreaterThan(75)
  })

  it("opens the fan wide at an index of 8: the carrier's line 15.3 dB under the bare carrier, and the third pair, 10.7 dB under, the strongest of the first four (claim fault-harsh)", async () => {
    const fm = await lab('frequency-modulation')
    // The measured curves' last point stands at 8 rad, the index the card's note is granted.
    const result = played(fm, 'harsh')
    expect(result.checks.granted).toBeCloseTo(8, 3)
    const under = (id: string) => -gainToDb(Math.abs(tap(result, id).at(-1)!))
    expectWritten(under('line0'), '15.3 dB')
    expectWritten(under('line3'), '10.7 dB')
    expect(under('line3')).toBeLessThan(Math.min(under('line0'), under('line1'), under('line2')))
  })

  it('leaves the held tone 1.3 % of its height below centre at a Ratio of 1 and an Index of 2 with full Feedback, and less than 0.1 % with none (claim dc-offset)', async () => {
    const fm = await lab('frequency-modulation')
    const below = (feedback: number, index = 2) => {
      const held = tap(fm.render(nothing, { ratio: RATIO.one, feedback, index }), 'steady')
      return (-100 * mean(held, 2000, 90_000)) / peak(held)
    }
    expectWritten(below(1), '1.3 %')
    expectWritten(Math.abs(below(0)), 'less than 0.1 %')
    // The size, and the side, go with the index: at 4 rad the tone stands above centre.
    expect(below(1, 4)).toBeLessThan(-0.5)
  })

  // ---- part 9: the device's own defaults -----------------------------------------------------

  it("starts the page's device table from the device's own defaults: for every control that is a parameter of the device, the settings file's defaults laid over the lab's starting values are device.json's, and the Index is the one its Brightness of 0.45 gives", async () => {
    const fm = await lab('frequency-modulation')
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/fm-glass/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const { values } = resolveSet(fm.description, { values: settings.defaults!.values })
    const shared = device.params.filter((one) => one.key in values)
    // The lab sets the Algorithm, the Velocity and the Volume itself, never lets a key up, and
    // has the Index where the device has Brightness.
    expect(device.params.filter((one) => !(one.key in values)).map((one) => one.key)).toEqual([
      'algorithm',
      'brightness',
      'release',
      'velocity',
      'volume',
    ])
    // The lab holds a starting value as a single-precision number and the settings file a
    // double, so both sides are compared as single precision.
    for (const one of shared)
      expect(Math.fround(values[one.key]!), one.key).toBe(Math.fround(one.default))
    const brightness = device.params.find((one) => one.key === 'brightness')!.default
    expect(brightness).toBe(0.45)
    expectWritten(fm.render(nothing, values).checks.brightness!, '0.450')
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(settings.defaults!.values)) {
      expect(fm.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
  })
})
