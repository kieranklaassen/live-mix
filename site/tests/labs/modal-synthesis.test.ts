import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  expectBuild,
  expectSoundLab,
  expectWritten,
  FADE,
  gainToDb,
  lab,
  largestDifference,
  matchesWritten,
  peak,
  POINT_RATE,
  points,
  RATE,
  rms,
  seconds,
  silence,
} from './support.ts'

// Nothing goes in: the lab plays the note itself. Its key goes down 10 ms into the loop.
const nothing = () => silence(seconds(4))
const DOWN = 480
/** The point of a control tap that stands `s` seconds after the key went down. */
const tick = (s: number) => points(s + DOWN / RATE)
/** The sample that stands `s` seconds after the key went down. */
const after = (s: number) => DOWN + seconds(s)

/** A channel of a tap: the first, or the right-hand one. */
const tap = (result: RenderResult, id: string, channel = 0) =>
  result.taps[id]!.channels_data[channel]!

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings('modal-synthesis')!

/** The steps of the build path, as the lab numbers them. */
const STEP = { one: 0, mallet: 1, several: 2, ratios: 3, decays: 4, where: 5, sides: 6 }

/** The size, in dB, of the part of `x` that turns at `hz`, under a Hann window `length` long. */
function sizeDb(x: Float32Array, hz: number, from: number, length: number): number {
  const w = (2 * Math.PI * hz) / RATE
  let re = 0
  let im = 0
  for (let n = 0; n < length; n += 1) {
    const v = x[from + n]! * (0.5 - 0.5 * Math.cos((2 * Math.PI * n) / length))
    re += v * Math.cos(w * n)
    im -= v * Math.sin(w * n)
  }
  return 10 * Math.log10(Math.max(re * re + im * im, 1e-300)) - 20 * Math.log10(length / 4)
}

/**
 * The frequency between `lo` and `hi` at which the window holds the most: forty steps across,
 * then closed in on by golden section.
 */
function peakHz(x: Float32Array, lo: number, hi: number, from: number, length: number): number {
  const step = (hi - lo) / 40
  let best = lo
  let top = -Infinity
  for (let hz = lo; hz <= hi; hz += step) {
    const size = sizeDb(x, hz, from, length)
    if (size > top) {
      top = size
      best = hz
    }
  }
  let a = best - step
  let b = best + step
  const golden = (Math.sqrt(5) - 1) / 2
  for (let i = 0; i < 40; i += 1) {
    const c = b - golden * (b - a)
    const d = a + golden * (b - a)
    if (sizeDb(x, c, from, length) > sizeDb(x, d, from, length)) b = d
    else a = c
  }
  return (a + b) / 2
}

/** How fast a level tap falls, in dB a second, between two times after the key went down. */
const slope = (x: Float32Array, from: number, to: number) =>
  (x[tick(from)]! - x[tick(to)]!) / (to - from)

/**
 * The times, in seconds after the key went down, at which a level tap dips: the level with a
 * steady fall of `fall` dB a second added back, searched from `from` to `to`. A dip is the lowest
 * point within `reach` seconds either side of itself, at least `deep` dB under the highest there.
 */
function dips(
  x: Float32Array,
  from: number,
  to: number,
  fall: number,
  reach: number,
  deep: number,
): number[] {
  const found: number[] = []
  const width = Math.round(reach * POINT_RATE)
  const at = (i: number) => x[i]! + fall * (i / POINT_RATE)
  for (let i = tick(from); i <= tick(to); i += 1) {
    let lowest = true
    let top = -Infinity
    for (let j = i - width; j <= i + width && lowest; j += 1) {
      if (j < 0 || j >= x.length) continue
      if (at(j) < at(i) || (at(j) === at(i) && j < i)) lowest = false
      top = Math.max(top, at(j))
    }
    if (lowest && top - at(i) >= deep) found.push(i / POINT_RATE - DOWN / RATE)
  }
  return found
}

/** The mean time between one dip and the next. */
const apart = (times: number[]) => (times.at(-1)! - times[0]!) / (times.length - 1)

/** How many samples of `a` are the same number as the sample of `b` at the same place. */
function same(a: Float32Array, b: Float32Array): number {
  let count = 0
  for (let i = 0; i < a.length; i += 1) if (a[i] === b[i]) count += 1
  return count
}

/** The samples of the loop: four seconds of them. */
const LOOP = seconds(4)

/** How far a tap's values lie apart between two times after the key went down. */
function spanOf(x: Float32Array, from: number, to: number): number {
  let lo = Infinity
  let hi = -Infinity
  for (let i = tick(from); i <= tick(to); i += 1) {
    lo = Math.min(lo, x[i]!)
    hi = Math.max(hi, x[i]!)
  }
  return hi - lo
}

/** A curve tap read at `x`, between its points: `log` for a curve laid out in even ratios. */
function readCurve(result: RenderResult, id: string, x: number): number {
  const found = result.taps[id]!
  const ys = found.channels_data[0]!
  const place = found.log
    ? (Math.log(x / found.x0) / Math.log(found.x1 / found.x0)) * (ys.length - 1)
    : ((x - found.x0) / (found.x1 - found.x0)) * (ys.length - 1)
  const i = Math.min(Math.floor(place), ys.length - 2)
  return ys[i]! + (ys[i + 1]! - ys[i]!) * (place - i)
}

/** A named set as its card plays it, with `over` laid on its values. Every set plays the lab's own note. */
function played(bank: Lab, name: string, over: Record<string, number> = {}): RenderResult {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values } = resolveSet(bank.description, set)
  return bank.render(nothing(), { ...values, ...over })
}

/** The Bar's ratios, mode by mode, as the device's table has them. */
const BAR = [1, 2.757, 5.404, 8.933, 13.345, 18.64, 24.81]

describe('modal synthesis', () => {
  it('is a sound lab playing its own note: every tap says something, loops, and answers to every control', async () => {
    const bank = await lab('modal-synthesis')
    const result = bank.render(nothing(), {})
    expectSoundLab(bank, nothing(), result, {
      // At the lab's starting Decay a released key is damped only by a Release well above its
      // starting value, so how long the key is held shows once Release is up.
      when: { hold: { release: 1 } },
    })
  })

  it('has a build path of seven steps, each changing a built tap and none the main path, the last held to the device', async () => {
    const bank = await lab('modal-synthesis')
    expectBuild(bank, nothing())
    expect(bank.description.controls.find((one) => one.id === 'build')!.choices).toEqual([
      'One resonator',
      'A mallet',
      'Several modes',
      'Their ratios',
      'A decay for each',
      'Where it is struck',
      'Pairs and two sides',
    ])
    expect(bank.render(nothing(), {}).checks.builtStep).toBe(STEP.sides)
  })

  it('renders every named set, finite and heard, and with every piece all 192,000 samples of the build are the device there too, on each side (claim built-exact)', async () => {
    const bank = await lab('modal-synthesis')
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = played(bank, name, { build: STEP.sides })
      const sound = tap(result, set.tap ?? 'out')
      expect(
        sound.every((v) => Number.isFinite(v)),
        name,
      ).toBe(true)
      expect(gainToDb(rms(sound)), `${name} is heard`).toBeGreaterThan(-40)
      // The lesson lists no source: every card plays the lab's own note.
      expect(set.source, name).toBeUndefined()
      expect(set.values?.build, name).toBeUndefined()
      // Sample against sample, on each side: every one of the loop's samples is the same number.
      for (const side of [0, 1]) {
        expect(tap(result, 'out', side).length, name).toBe(LOOP)
        expect(same(tap(result, 'built', side), tap(result, 'out', side)), name).toBe(LOOP)
        expect(largestDifference(tap(result, 'built', side), tap(result, 'out', side)), name).toBe(
          0,
        )
      }
      // The two checks read their floor, which says no more than "over 140 dB apart in level".
      expect(result.checks.rebuilt, name).toBeLessThanOrEqual(-140)
      expect(result.checks.pulseAgain, name).toBeLessThanOrEqual(-140)
    }
  })

  // ---- part 1: why ------------------------------------------------------------------------------

  it("finds the bar's partials where its table puts them: 606.5 Hz and 1,188.9 Hz over a note of 220 Hz, in a second of the output from 50 ms after the strike (claim bar-partials)", async () => {
    const bank = await lab('modal-synthesis')
    const out = tap(bank.render(nothing(), {}), 'out')
    expectWritten(peakHz(out, 215, 225, after(0.05), RATE), '220.0 Hz')
    expectWritten(peakHz(out, 600, 612, after(0.05), RATE), '606.5 Hz')
    expectWritten(peakHz(out, 1180, 1198, after(0.05), RATE), '1,188.9 Hz')
    // Where the table says: the ratio times the note, to a hundredth of a hertz.
    BAR.forEach((ratio) => {
      const hz = 220 * ratio
      expect(peakHz(out, hz * 0.995, hz * 1.005, after(0.05), RATE)).toBeCloseTo(hz, 2)
    })
  })

  it('finds the comparison, the same modes moved to whole multiples, at 440.0 Hz and 660.0 Hz (claim whole-partials)', async () => {
    const bank = await lab('modal-synthesis')
    const whole = tap(bank.render(nothing(), {}), 'whole')
    expectWritten(peakHz(whole, 430, 450, after(0.05), RATE), '440.0 Hz')
    expectWritten(peakHz(whole, 650, 670, after(0.05), RATE), '660.0 Hz')
    // And the bar has nothing there: its output at 440 Hz stands far under its own second partial.
    const out = tap(bank.render(nothing(), {}), 'out')
    expect(sizeDb(out, 440, after(0.05), RATE)).toBeLessThan(
      sizeDb(out, 606.54, after(0.05), RATE) - 80,
    )
    // Each partial dies at the rate it had in the bar: the fall from 50 ms to 250 ms after the
    // strike, partial by partial, is the same to a tenth of a decibel a second.
    const level = (x: Float32Array, hz: number, s: number) => sizeDb(x, hz, after(s), 4096)
    const fall = (x: Float32Array, hz: number) => (level(x, hz, 0.05) - level(x, hz, 0.25)) / 0.2
    BAR.forEach((ratio, k) => {
      expect(
        Math.abs(fall(whole, 220 * (k + 1)) - fall(out, 220 * ratio)),
        `partial ${k + 1}`,
      ).toBeLessThan(0.1)
    })
    // And the upper ones are louder than they were: the second by more than 5 dB, the seventh
    // by more than 20 dB, 30 ms after the strike.
    expect(level(whole, 440, 0.03) - level(out, 220 * BAR[1]!, 0.03)).toBeGreaterThan(5)
    expect(level(whole, 1540, 0.03) - level(out, 220 * BAR[6]!, 0.03)).toBeGreaterThan(20)
  })

  it('has the high modes die first: from 0.1 s to 0.6 s after the strike mode 1 falls at 20.0 dB a second and mode 6 at 64.5 dB a second (claim high-first)', async () => {
    const bank = await lab('modal-synthesis')
    const result = bank.render(nothing(), {})
    expectWritten(slope(tap(result, 'level1'), 0.1, 0.6), '20.0 dB')
    expectWritten(slope(tap(result, 'level6'), 0.1, 0.6), '64.5 dB')
  })

  it('struck at its middle, Position at 1, the bar loses every second mode: the second partial stands more than 100 dB under where it was, and mode 1 starts 3.0 dB higher (claim middle)', async () => {
    const bank = await lab('modal-synthesis')
    const end = bank.render(nothing(), {})
    const middle = played(bank, 'middle')
    expect(settings.sets.middle!.values).toEqual({ position: 1 })
    const second = (result: RenderResult) => sizeDb(tap(result, 'out'), 606.54, after(0.03), 4096)
    expectWritten(second(end) - second(middle), 'more than 100 dB')
    expectWritten(tap(middle, 'level1')[tick(0.05)]! - tap(end, 'level1')[tick(0.05)]!, '3.0 dB')
    // Modes 2, 4 and 6 are never started; 1, 3 and 5 all are.
    for (const n of [2, 4, 6]) expect(tap(middle, `level${n}`)[tick(0.05)], `mode ${n}`).toBe(-120)
    for (const n of [1, 3, 5])
      expect(tap(middle, `level${n}`)[tick(0.05)], `mode ${n}`).toBeGreaterThan(-40)
  })

  // ---- part 2: the picture ----------------------------------------------------------------------

  it('half a second after the strike, at the starting settings, mode 1 stands at −25 dB and mode 6 at −72 dB (claim half-second)', async () => {
    const bank = await lab('modal-synthesis')
    const result = bank.render(nothing(), {})
    expectWritten(tap(result, 'level1')[tick(0.5)]!, '−25 dB')
    expectWritten(tap(result, 'level6')[tick(0.5)]!, '−72 dB')
  })

  it('Damping spreads the modes and leaves the lowest alone: from 0.1 s to 0.6 s mode 2 falls at 20.7 dB a second with Damping at 0 and at 90.3 dB a second with Damping at 1, and mode 1 at 20.0 dB a second at both (claim damping-ends)', async () => {
    const bank = await lab('modal-synthesis')
    const metal = bank.render(nothing(), { damping: 0 })
    const wood = bank.render(nothing(), { damping: 1 })
    expectWritten(slope(tap(metal, 'level2'), 0.1, 0.6), '20.7 dB')
    expectWritten(slope(tap(wood, 'level2'), 0.1, 0.6), '90.3 dB')
    expectWritten(slope(tap(metal, 'level1'), 0.1, 0.6), '20.0 dB')
    expectWritten(slope(tap(wood, 'level1'), 0.1, 0.6), '20.0 dB')
  })

  it('Decay is the time mode 1 takes to fall 60 dB: with Decay at 6 s it falls at 10.0 dB a second (claim decay-six)', async () => {
    const bank = await lab('modal-synthesis')
    const result = bank.render(nothing(), { decay: 6 })
    expectWritten(slope(tap(result, 'level1'), 0.1, 0.6), '10.0 dB')
  })

  // ---- part 3: what it is used on ---------------------------------------------------------------

  it("the bar's highest partial stands at 5,458 Hz (claim use-bar)", async () => {
    const bank = await lab('modal-synthesis')
    const result = played(bank, 'bar')
    expectWritten(peakHz(tap(result, 'out'), 5440, 5476, after(0.05), RATE), '5,458 Hz')
    expect(result.checks.modeCount).toBe(11)
  })

  it('the bell has a partial at 110.0 Hz, an octave under its note, and one at 264.0 Hz, a minor third over it (claim use-bell)', async () => {
    const bank = await lab('modal-synthesis')
    const result = played(bank, 'bell')
    const out = tap(result, 'out')
    expectWritten(peakHz(out, 105, 115, after(0.05), RATE), '110.0 Hz')
    expectWritten(peakHz(out, 259, 269, after(0.05), RATE), '264.0 Hz')
    expect(result.checks.modeCount).toBe(16)
  })

  it("the bowl's level dips 1.0 s apart, from 0.2 s to 3.6 s after the strike (claim use-bowl)", async () => {
    const bank = await lab('modal-synthesis')
    const result = played(bank, 'bowl')
    // The bowl's lowest mode falls at 5 dB a second: that fall is added back before the dips are sought.
    const found = dips(tap(result, 'level'), 0.2, 3.6, 5, 0.3, 3)
    expect(found.length).toBe(4)
    expectWritten(apart(found), '1.0 s')
    // With its two halves at one pitch there is no dip to find.
    expect(dips(tap(played(bank, 'bowl', { detune: 0 }), 'level'), 0.2, 3.6, 5, 0.3, 3)).toEqual([])
  })

  it("the tine's second partial stands at 1,378 Hz and falls at 107 dB a second, from 50 ms to 200 ms after the strike, where its first falls at 40 dB a second (claim use-tine)", async () => {
    const bank = await lab('modal-synthesis')
    const result = played(bank, 'tine')
    expectWritten(peakHz(tap(result, 'out'), 1360, 1396, after(0.02), RATE / 2), '1,378 Hz')
    expectWritten(slope(tap(result, 'level2'), 0.05, 0.2), '107 dB')
    expectWritten(slope(tap(result, 'level1'), 0.1, 0.4), '40 dB')
  })

  // ---- part 4: the build ------------------------------------------------------------------------

  it('step 1, one resonator: it rings at 220.0 Hz and falls at 20.0 dB a second (claim built-one)', async () => {
    const bank = await lab('modal-synthesis')
    const one = bank.render(nothing(), { build: STEP.one })
    expectWritten(peakHz(tap(one, 'built'), 215, 225, after(0.05), RATE), '220.0 Hz')
    expectWritten(slope(tap(one, 'builtLow'), 0.1, 0.6), '20.0 dB')
    // One mode and no more: the lanes of the others lie on the floor.
    expect(tap(one, 'builtMid')[tick(0.05)]).toBe(-120)
  })

  it('step 2, a mallet: the push lasts 16 samples, where the step before gave it all in one (claim built-mallet)', async () => {
    const bank = await lab('modal-synthesis')
    const lasting = (step: number) =>
      tap(bank.render(nothing(), { build: step }), 'builtPush').filter((v) => v !== 0).length
    expectWritten(lasting(STEP.mallet), '16 samples')
    // The piece switched off: one sample.
    expect(lasting(STEP.one)).toBe(1)
    expect(matchesWritten(lasting(STEP.one), '16 samples')).toBe(false)
  })

  it('step 3, several modes: a second partial stands at 440.0 Hz, where the step before had nothing (claim built-several)', async () => {
    const bank = await lab('modal-synthesis')
    const several = tap(bank.render(nothing(), { build: STEP.several }), 'built')
    const before = tap(bank.render(nothing(), { build: STEP.mallet }), 'built')
    expectWritten(peakHz(several, 430, 450, after(0.05), RATE), '440.0 Hz')
    // The piece switched off: nothing stands there, and the search finds no peak at that place.
    expect(sizeDb(before, 440, after(0.05), RATE)).toBeLessThan(
      sizeDb(several, 440, after(0.05), RATE) - 100,
    )
    expect(matchesWritten(peakHz(before, 430, 450, after(0.05), RATE), '440.0 Hz')).toBe(false)
  })

  it('step 4, their ratios: the second partial moves to 606.5 Hz (claim built-ratios)', async () => {
    const bank = await lab('modal-synthesis')
    const ratios = tap(bank.render(nothing(), { build: STEP.ratios }), 'built')
    const before = tap(bank.render(nothing(), { build: STEP.several }), 'built')
    expectWritten(peakHz(ratios, 600, 612, after(0.05), RATE), '606.5 Hz')
    // The piece switched off: the partial is back at twice the note, and nothing stands here.
    expect(matchesWritten(peakHz(before, 600, 612, after(0.05), RATE), '606.5 Hz')).toBe(false)
    expect(sizeDb(before, 606.54, after(0.05), RATE)).toBeLessThan(
      sizeDb(ratios, 606.54, after(0.05), RATE) - 100,
    )
    expect(sizeDb(ratios, 440, after(0.05), RATE)).toBeLessThan(
      sizeDb(before, 440, after(0.05), RATE) - 100,
    )
  })

  it('step 5, a decay for each: from 50 ms to 300 ms after the strike mode 3 falls at 31.1 dB a second and mode 6 at 64.5 dB a second, where both fell at 20.0 dB a second (claim built-decays)', async () => {
    const bank = await lab('modal-synthesis')
    const decays = bank.render(nothing(), { build: STEP.decays })
    const before = bank.render(nothing(), { build: STEP.ratios })
    expectWritten(slope(tap(decays, 'builtMid'), 0.05, 0.3), '31.1 dB')
    expectWritten(slope(tap(decays, 'builtHigh'), 0.05, 0.3), '64.5 dB')
    // The piece switched off: every mode falls as the lowest does.
    expectWritten(slope(tap(before, 'builtMid'), 0.05, 0.3), '20.0 dB')
    expectWritten(slope(tap(before, 'builtHigh'), 0.05, 0.3), '20.0 dB')
    expect(matchesWritten(slope(tap(before, 'builtMid'), 0.05, 0.3), '31.1 dB')).toBe(false)
    expect(matchesWritten(slope(tap(before, 'builtHigh'), 0.05, 0.3), '64.5 dB')).toBe(false)
  })

  it('step 6, where it is struck: 50 ms after the strike mode 6 stands 27 dB under mode 1, where the step before had it 7 dB under (claim built-where)', async () => {
    const bank = await lab('modal-synthesis')
    const under = (step: number) => {
      const result = bank.render(nothing(), { build: step })
      return tap(result, 'builtLow')[tick(0.05)]! - tap(result, 'builtHigh')[tick(0.05)]!
    }
    expectWritten(under(STEP.where), '27 dB')
    // The piece switched off.
    expectWritten(under(STEP.decays), '7 dB')
    expect(matchesWritten(under(STEP.decays), '27 dB')).toBe(false)
  })

  it("step 7, pairs and two sides: all 192,000 samples of the build are the device's output on each side, at the start and at the ends of the controls, where the lab allows −120 dB (claim built-exact)", async () => {
    const bank = await lab('modal-synthesis')
    const whole = bank.render(nothing(), { build: STEP.sides })
    /** How many samples of the build are the device's, on the left and on the right. */
    const alike = (result: RenderResult) =>
      [0, 1].map((side) => same(tap(result, 'built', side), tap(result, 'out', side)))
    for (const count of alike(whole)) expectWritten(count, '192,000 samples')
    expect(LOOP).toBe(192000)
    expect(largestDifference(tap(whole, 'built'), tap(whole, 'out'))).toBe(0)
    expect(largestDifference(tap(whole, 'built', 1), tap(whole, 'out', 1))).toBe(0)
    // The test of every named set, above, counts the same at each of them. Here: at both ends
    // of every control of the lab but the step itself, and at each material.
    for (const control of bank.description.controls) {
      if (control.id === 'build') continue
      const stops =
        control.choices.length > 0 ? control.choices.map((_, i) => i) : [control.min, control.max]
      for (const value of stops) {
        const result = bank.render(nothing(), { [control.id]: value, build: STEP.sides })
        expect(alike(result), `${control.id} at ${value}`).toEqual([LOOP, LOOP])
      }
    }
    expectWritten(whole.checks.builtBound!, '−120 dB')
    expect(whole.checks.builtDifference).toBeLessThanOrEqual(-140)
    // The two sides differ, as the device's do.
    expect(largestDifference(tap(whole, 'built'), tap(whole, 'built', 1))).toBeGreaterThan(0.01)
    // The piece switched off: one sound on both sides, and not the device's.
    const before = bank.render(nothing(), { build: STEP.where })
    expect(largestDifference(tap(before, 'built'), tap(before, 'built', 1))).toBe(0)
    expect(largestDifference(tap(before, 'built'), tap(before, 'out'))).toBeGreaterThan(0.1)
  })

  // ---- part 5: the engine, stage by stage -------------------------------------------------------

  it("stage 1, the mallet: the push is 15.6 samples long at the starting Hardness, 69 samples at the device's own 0.45 and 137 samples at 0 (claim pulse-length)", async () => {
    const bank = await lab('modal-synthesis')
    const length = (hardness: number) => bank.render(nothing(), { hardness }).checks.pulseSamples!
    expectWritten(bank.render(nothing(), {}).checks.pulseSamples!, '15.6 samples')
    expectWritten(length(0.45), '69 samples')
    expectWritten(length(0), '137 samples')
    // What the device's lines work out, from its constants: 0.9 periods of the note for the
    // softest mallet, 0.03 for the hardest, by the square of Hardness, times 1.5 less the strike.
    for (const hardness of [0, 0.45, 0.8, 1]) {
      const periods = 0.9 * (0.03 / 0.9) ** (hardness * hardness) * (1.5 - 0.8)
      expect(length(hardness)).toBeCloseTo((periods * RATE) / 220, 1)
    }
    // And the push the lab works out again is the one the device put into its first mode.
    expect(bank.render(nothing(), {}).checks.pulseAgain).toBeLessThanOrEqual(-140)
  })

  it('stage 2, what a push leaves in a mode: at 3,079 Hz, where the starting push lasts one period, the curve reads −6.0 dB, and it is the textbook formula to less than 0.01 dB wherever it stands above −80 dB, where the lab stops it (claim mallet-half)', async () => {
    const bank = await lab('modal-synthesis')
    const result = bank.render(nothing(), {})
    const length = result.checks.pulseSamples!
    expectWritten(RATE / length, '3,079 Hz')
    expectWritten(readCurve(result, 'mallet', RATE / length), '−6.0 dB')
    // The transform of a raised cosine `length` samples long, at each point of the curve.
    const curve = result.taps.mallet!
    const ys = curve.channels_data[0]!
    let worst = 0
    let compared = 0
    ys.forEach((value, i) => {
      const hz = curve.x0 * (curve.x1 / curve.x0) ** (i / (ys.length - 1))
      const periods = (hz * length) / RATE
      const size = Math.abs(Math.sin(Math.PI * periods) / (Math.PI * periods * (1 - periods ** 2)))
      if (value > -80) {
        worst = Math.max(worst, Math.abs(gainToDb(size) - value))
        compared += 1
      }
      // Nothing is drawn under the floor: the gaps between the lobes are cut off there.
      expect(value).toBeGreaterThanOrEqual(-80)
    })
    expectWritten(worst, 'less than 0.01 dB')
    // Nearly all of the curve stands above the floor and is compared.
    expect(compared / ys.length).toBeGreaterThan(0.95)
  })

  it('stage 2 on the device: with Hardness at 0, 50 ms after the strike mode 2 stands 26 dB lower than at the starting Hardness and mode 1 2.8 dB lower (claim soft-mallet)', async () => {
    const bank = await lab('modal-synthesis')
    const start = bank.render(nothing(), {})
    const soft = played(bank, 'soft')
    expect(settings.sets.soft!.values).toEqual({ hardness: 0 })
    const lower = (id: string) => tap(start, id)[tick(0.05)]! - tap(soft, id)[tick(0.05)]!
    expectWritten(lower('level2'), '26 dB')
    expectWritten(lower('level1'), '2.8 dB')
  })

  it("stage 3, where it is struck: at the end of the bar every mode's shape is 0.707 in size, and mode 1's passes through nothing at a Position of 0.333 (claim shape-node)", async () => {
    const bank = await lab('modal-synthesis')
    const result = bank.render(nothing(), {})
    for (const id of ['shape1', 'shape2', 'shape3', 'shape4'])
      expectWritten(Math.abs(tap(result, id)[0]!), '0.707')
    const shape = tap(result, 'shape1')
    const crossing = shape.findIndex((v, i) => i > 0 && shape[i - 1]! < 0 !== v < 0)
    const where =
      (crossing - 1 + shape[crossing - 1]! / (shape[crossing - 1]! - shape[crossing]!)) /
      (shape.length - 1)
    expectWritten(where, '0.333')
    // At the middle the even modes' shapes are nothing and the odd modes' are whole.
    expect(Math.abs(tap(result, 'shape2').at(-1)!)).toBeLessThan(1e-6)
    expect(Math.abs(tap(result, 'shape4').at(-1)!)).toBeLessThan(1e-6)
    expect(Math.abs(tap(result, 'shape1').at(-1)!)).toBeCloseTo(1, 6)
    expect(Math.abs(tap(result, 'shape3').at(-1)!)).toBeCloseTo(1, 6)
  })

  it("stage 5, a decay for each: from 0.1 s to 0.6 s after the strike modes 1 to 4 fall at 20.0, 24.4, 31.1 and 40.0 dB a second and mode 6 at 64.5 dB a second, each less than 0.02 dB a second from the device's law (claim fall-law)", async () => {
    const bank = await lab('modal-synthesis')
    const result = bank.render(nothing(), {})
    const measured = [1, 2, 3, 4, 5, 6].map((n) => slope(tap(result, `level${n}`), 0.1, 0.6))
    expectWritten(measured[0]!, '20.0 dB')
    expectWritten(measured[1]!, '24.4 dB')
    expectWritten(measured[2]!, '31.1 dB')
    expectWritten(measured[3]!, '40.0 dB')
    expectWritten(measured[5]!, '64.5 dB')
    // The law, from the lab's starting Decay of 3 s and Damping of 0.4 and the device's two
    // constants: 60 dB in Decay seconds, times 1 + 0.02 · 100^Damping · (ratio − 1).
    measured.forEach((rate, k) => {
      const law = (60 / 3) * (1 + 0.02 * 100 ** 0.4 * (BAR[k]! - 1))
      expectWritten(Math.abs(rate - law), 'less than 0.02 dB')
    })
  })

  it('stage 6, two sides: half a second after the strike the left side stands 3.6 dB over the right at the starting Spread and 5.6 dB over it with Spread at 1, and with Spread at 0 all 192,000 samples of the left are the same as the right (claim sides)', async () => {
    const bank = await lab('modal-synthesis')
    const over = (result: RenderResult) =>
      tap(result, 'levelLeft')[tick(0.5)]! - tap(result, 'levelRight')[tick(0.5)]!
    expectWritten(over(bank.render(nothing(), {})), '3.6 dB')
    expectWritten(over(bank.render(nothing(), { spread: 1 })), '5.6 dB')
    const middle = bank.render(nothing(), { spread: 0 })
    expectWritten(same(tap(middle, 'out'), tap(middle, 'out', 1)), '192,000 samples')
    expect(largestDifference(tap(middle, 'out'), tap(middle, 'out', 1))).toBe(0)
    // At the starting Spread they are not: the count is no formality.
    const start = bank.render(nothing(), {})
    expect(same(tap(start, 'out'), tap(start, 'out', 1))).toBeLessThan(LOOP / 2)
  })

  it('stage 6, the modes added: at the starting settings all 192,000 samples of the sum of the modes with their gains are the output, on each side (claim sum-exact)', async () => {
    const bank = await lab('modal-synthesis')
    const result = bank.render(nothing(), {})
    // Volume is at 0 dB and the sum stays under the clip's knee, so nothing is done to it.
    expect(peak(tap(result, 'sum'))).toBeLessThan(0.5)
    for (const side of [0, 1]) {
      expectWritten(same(tap(result, 'sum', side), tap(result, 'out', side)), '192,000 samples')
      expect(largestDifference(tap(result, 'sum', side), tap(result, 'out', side))).toBe(0)
    }
    expect(result.checks.rebuilt).toBeLessThanOrEqual(-140)
    // With Volume off 0 dB the sum is no longer the output, and the count says so.
    const louder = bank.render(nothing(), { volume: 6 })
    expect(same(tap(louder, 'sum'), tap(louder, 'out'))).toBeLessThan(LOOP / 2)
  })

  it('stage 6, a pair that beats turns between the sides: with the halves 1 Hz apart and Spread at 1, the right side stands 7 dB over the left half a second after the strike and the left 8 dB over the right a second after it (claim turns)', async () => {
    const bank = await lab('modal-synthesis')
    const result = played(bank, 'turning')
    expect(settings.sets.turning!.values).toMatchObject({ detune: 1, spread: 1 })
    const left = tap(result, 'levelLeft')
    const right = tap(result, 'levelRight')
    expectWritten(right[tick(0.5)]! - left[tick(0.5)]!, '7 dB')
    expectWritten(left[tick(1)]! - right[tick(1)]!, '8 dB')
  })

  it('stage 7, rubbing: with Sustain at 1 mode 1 stands at −13.8 dB at 2.9 s after the strike, having moved less than 0.1 dB since 1.5 s, the push is 20 dB smaller, and mode 3 still falls at 31.1 dB a second (claim rub-holds)', async () => {
    const bank = await lab('modal-synthesis')
    const start = bank.render(nothing(), {})
    const rubbed = bank.render(nothing(), { sustain: 1 })
    const low = tap(rubbed, 'level1')
    expectWritten(low[tick(2.9)]!, '−13.8 dB')
    expectWritten(spanOf(low, 1.5, 2.9), 'less than 0.1 dB')
    expectWritten(gainToDb(peak(tap(start, 'pulse')) / peak(tap(rubbed, 'pulse'))), '20 dB')
    expectWritten(slope(tap(rubbed, 'level3'), 0.1, 0.6), '31.1 dB')
    // The level it is held at, from the device's numbers: the mode's own share, 0.6, of
    // 0.4 · Sustain · (0.25 + 0.75 · the strike of 0.8).
    expect(low[tick(2.9)]!).toBeCloseTo(gainToDb(0.6 * 0.4 * (0.25 + 0.75 * 0.8)), 1)
    // Without Sustain the same mode has fallen far under that by then.
    expect(tap(start, 'level1')[tick(2.9)]!).toBeLessThan(-70)
  })

  it('stage 8, key up: with the key held for 1 s and Release at 1, mode 1 falls at 600 dB a second from 20 ms to 70 ms after key up; with Release at 0.5 it falls at 30 dB a second; at the starting 0.25 it keeps its 20.0 dB a second (claim choke)', async () => {
    const bank = await lab('modal-synthesis')
    const fall = (release: number, from: number, to: number) =>
      slope(tap(bank.render(nothing(), { hold: 1, release }), 'level1'), from, to)
    expectWritten(fall(1, 1.02, 1.07), '600 dB')
    expectWritten(fall(0.5, 1.05, 1.55), '30 dB')
    expectWritten(fall(0.25, 1.05, 1.55), '20.0 dB')
    expect(settings.sets.stopped!.values).toEqual({ hold: 1, release: 1 })
    // A mode that already dies faster than the limit is left alone: mode 3 at Release 0.5.
    expectWritten(
      slope(tap(bank.render(nothing(), { hold: 1, release: 0.5 }), 'level3'), 1.05, 1.3),
      '31.1 dB',
    )
  })

  it('stage 10, two bars a Beat apart: at the starting Beat of 4 Hz the two bars ring at 218.0 Hz and 222.0 Hz and their level dips 0.25 s apart; with Beat at 1 Hz it dips 1.0 s apart (claim twin-apart)', async () => {
    const bank = await lab('modal-synthesis')
    const result = played(bank, 'twins')
    expect(settings.sets.twins!.tap).toBe('twin')
    // The second bar, the higher, is the one the left side hears most of.
    expectWritten(peakHz(tap(result, 'twin'), 220.5, 223.5, after(0.05), RATE), '222.0 Hz')
    expectWritten(peakHz(tap(result, 'twin', 1), 216.5, 219.5, after(0.05), RATE), '218.0 Hz')
    // The bars' low tone falls at 20 dB a second, which is added back before the dips are sought.
    const four = dips(tap(result, 'twinLevel'), 0.05, 2, 20, 0.1, 3)
    expect(four.length).toBe(8)
    expectWritten(apart(four), '0.25 s')
    const one = dips(tap(bank.render(nothing(), { beat: 1 }), 'twinLevel'), 0.05, 3, 20, 0.3, 3)
    expect(one.length).toBe(3)
    expectWritten(apart(one), '1.0 s')
  })

  it("stage 9, the clip: with Volume at +6 dB, the hardest mallet and Brightness at 1 what goes into the clip, the modes added times Volume, peaks 6.0 dB over full scale, and the output's largest sample is 0.0 dB (claim clipped)", async () => {
    const bank = await lab('modal-synthesis')
    const result = played(bank, 'hot')
    expect(settings.sets.hot!.values).toEqual({ volume: 6, hardness: 1, brightness: 1 })
    expectWritten(gainToDb(peak(tap(result, 'sum'))) + 6, '6.0 dB')
    expectWritten(gainToDb(peak(tap(result, 'out'))), '0.0 dB')
    expect(peak(tap(result, 'out'))).toBeLessThanOrEqual(1)
    // The clip is at work: without it the output would be the sum times Volume, twice as tall.
    expect(peak(tap(result, 'sum')) * 10 ** (6 / 20)).toBeGreaterThan(1.9)
  })

  it("stage 9, the clip lands on full scale: with the loud card's settings and Position at 1, every sample that goes in at twice full scale or more comes out at 1 exactly, and none comes out larger (claim clip-lands)", async () => {
    const bank = await lab('modal-synthesis')
    const result = played(bank, 'hot', { position: 1 })
    const volume = 10 ** (6 / 20)
    let reached = 0
    let short = 0
    let larger = 0
    for (const side of [0, 1]) {
      const sum = tap(result, 'sum', side)
      const out = tap(result, 'out', side)
      // The loop's first samples are a blend of two passes of the note, so they are left out.
      for (let i = FADE; i < sum.length; i += 1) {
        if (Math.abs(out[i]!) > 1) larger += 1
        // A hair over twice full scale, so that the rounding of Volume cannot decide it.
        if (Math.abs(sum[i]!) * volume >= 2.001) {
          reached += 1
          if (out[i] !== Math.sign(sum[i]!)) short += 1
        }
      }
    }
    expect(reached).toBeGreaterThan(10)
    expect(short).toBe(0)
    expect(larger).toBe(0)
    // At the loud card itself nothing goes in that far over, and no sample is 1 exactly.
    const hot = played(bank, 'hot')
    expect(tap(hot, 'out').filter((v) => Math.abs(v) === 1).length).toBe(0)
  })

  // ---- part 6: ways to use it -------------------------------------------------------------------

  it('a rubbed bowl holds: mode 1 stands at −13.8 dB at 2.9 s after the strike, and the level of the note dips 1.0 s apart from 0.5 s on (claim way-rubbed)', async () => {
    const bank = await lab('modal-synthesis')
    const result = played(bank, 'rubbed')
    expectWritten(tap(result, 'level1')[tick(2.9)]!, '−13.8 dB')
    const found = dips(tap(result, 'level'), 0.5, 2.9, 0, 0.3, 1)
    expect(found.length).toBe(3)
    expectWritten(apart(found), '1.0 s')
  })

  it("with Stretch at 1.3 the bar's second partial stands at 822 Hz and its third at 1,972 Hz (claim way-stretched)", async () => {
    const bank = await lab('modal-synthesis')
    const out = tap(played(bank, 'stretched'), 'out')
    expect(settings.sets.stretched!.values).toEqual({ stretch: 1.3 })
    expectWritten(peakHz(out, 810, 834, after(0.05), RATE), '822 Hz')
    expectWritten(peakHz(out, 1950, 1995, after(0.05), RATE), '1,972 Hz')
    // The ratio to the power of Stretch, as the device's line has it.
    expect(peakHz(out, 810, 834, after(0.05), RATE)).toBeCloseTo(220 * 2.757 ** 1.3, 1)
  })

  it('the bar tuned to 1 : 4 : 10 has its second partial at 880.0 Hz and its third at 2,200.0 Hz (claim way-tuned)', async () => {
    const bank = await lab('modal-synthesis')
    const out = tap(played(bank, 'tuned'), 'out')
    expectWritten(peakHz(out, 870, 890, after(0.05), RATE), '880.0 Hz')
    expectWritten(peakHz(out, 2180, 2220, after(0.05), RATE), '2,200.0 Hz')
  })

  // ---- part 7: what goes wrong ------------------------------------------------------------------

  it("struck on mode 1's still point, Position at 0.333, mode 1 starts 59 dB lower than at the end of the bar (claim fault-node)", async () => {
    const bank = await lab('modal-synthesis')
    const end = bank.render(nothing(), {})
    const node = played(bank, 'node')
    expect(settings.sets.node!.values).toEqual({ position: 0.333 })
    expectWritten(tap(end, 'level1')[tick(0.05)]! - tap(node, 'level1')[tick(0.05)]!, '59 dB')
    // The 59 dB is how near 0.333 comes to a third: a Position nearer still takes mode 1 lower,
    // and one further off leaves more of it.
    const lower = (position: number) =>
      tap(end, 'level1')[tick(0.05)]! -
      tap(bank.render(nothing(), { position }), 'level1')[tick(0.05)]!
    expect(lower(0.3333)).toBeGreaterThan(75)
    expect(lower(0.33)).toBeLessThan(45)
    expect(lower(0.34)).toBeLessThan(40)
    // The others are still there: mode 2 is within a few decibels of where it was.
    expect(
      Math.abs(tap(end, 'level2')[tick(0.05)]! - tap(node, 'level2')[tick(0.05)]!),
    ).toBeLessThan(4)
  })

  it('with Detune at 6 Hz the level of the note dips 0.17 s apart over the first second and a half (claim fault-wobble)', async () => {
    const bank = await lab('modal-synthesis')
    const result = played(bank, 'wobble')
    expect(settings.sets.wobble!.values).toMatchObject({ detune: 6 })
    const found = dips(tap(result, 'level'), 0.05, 1.5, 20, 0.06, 3)
    expect(found.length).toBe(9)
    expectWritten(apart(found), '0.17 s')
  })

  // ---- part 9: the device's own defaults --------------------------------------------------------

  it("starts the page's device table from the device's own defaults: for every control that is a parameter of the device, the settings file's defaults laid over the lab's starting values are device.json's", async () => {
    const bank = await lab('modal-synthesis')
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/modal-bells/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const { values } = resolveSet(bank.description, { values: settings.defaults!.values })
    // Every parameter of the device is a control of the lab.
    expect(device.params.filter((one) => !(one.key in values)).map((one) => one.key)).toEqual([])
    // The lab holds a starting value as a single-precision number and the settings file a
    // double, so both sides are compared as single precision.
    for (const one of device.params)
      expect(Math.fround(values[one.key]!), one.key).toBe(Math.fround(one.default))
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(settings.defaults!.values)) {
      expect(bank.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
  })
})
