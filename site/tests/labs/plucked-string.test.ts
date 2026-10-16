import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  peak,
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

/** The first channel of a tap. */
const tap = (result: RenderResult, id: string) => result.taps[id]!.channels_data[0]!

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings('plucked-string')!

/** The steps of the build path, as the lab numbers them. */
const STEP = { burst: 0, loop: 1, loss: 2, stiff: 3, tune: 4, pluck: 5, comb: 6, pickup: 7 }

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
 * then closed in on by golden section. With a window a second long this is a transform of
 * 48,000 points read between its bins.
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

const cents = (hz: number, reference: number) => 1200 * Math.log2(hz / reference)

/** How fast the part of `x` at `hz` falls, in dB a second, between two windows `apart` samples apart. */
const fall = (x: Float32Array, hz: number, from: number, apart: number, length = 4096) =>
  ((sizeDb(x, hz, from, length) - sizeDb(x, hz, from + apart, length)) * RATE) / apart

/**
 * The size of partial `k` of a note at `hz`, in dB, in the 85 ms from `from`: its peak is looked
 * for a little either side of `k` times the note, since a stiff string's partials stand sharp.
 */
const partial = (x: Float32Array, hz: number, k: number, from = DOWN + 480) =>
  sizeDb(x, peakHz(x, hz * k * 0.997, hz * k * 1.012, from, 4096), from, 4096)

/** The largest step between neighbouring points. */
const steepest = (x: Float32Array) => {
  let most = 0
  for (let i = 1; i < x.length; i += 1) most = Math.max(most, Math.abs(x[i]! - x[i - 1]!))
  return most
}

/** How many times a line passes from one side of zero to the other. */
const crossings = (x: Float32Array) => {
  let count = 0
  for (let i = 1; i < x.length; i += 1) if (x[i - 1]! < 0 !== x[i]! < 0) count += 1
  return count
}

const largest = (x: Float32Array) => {
  let at = 0
  x.forEach((v, i) => {
    if (Math.abs(v) > Math.abs(x[at]!)) at = i
  })
  return { at, value: x[at]! }
}

/** How far a sound's loudest sample stands over its level from 0.1 s to 0.6 s after the pick, in dB. */
const spike = (x: Float32Array) => gainToDb(peak(x)) - gainToDb(rms(x, after(0.1), after(0.6)))

/** A named set as its card plays it, with `over` laid on its values. Every set plays the lab's own note. */
function played(string: Lab, name: string, over: Record<string, number> = {}): RenderResult {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values } = resolveSet(string.description, set)
  return string.render(nothing(), { ...values, ...over })
}

describe('the plucked string', () => {
  it('is a sound lab playing its own note: every tap says something, loops, and answers to every control', async () => {
    const string = await lab('plucked-string')
    const result = string.render(nothing(), {})
    expectSoundLab(string, nothing(), result)
  })

  it('has a build path of eight steps, each changing a built tap and none the main path, the last held to the device', async () => {
    const string = await lab('plucked-string')
    expectBuild(string, nothing())
    expect(string.description.controls.find((one) => one.id === 'build')!.choices).toEqual([
      'A burst of noise',
      'A delay loop',
      'The loss filter',
      'Stiffness',
      'Fine tuning',
      'A shaped pluck',
      'Pick position',
      'Two strings and a pickup',
    ])
    expect(string.render(nothing(), {}).checks.builtStep).toBe(STEP.pickup)
  })

  // ---- part 1: why a fade is not enough, and what a loop of noise does -------------------------

  it('fades every partial of the fixed wave at one rate, the tenth at 17.1 dB a second like the first (claim fixed-together)', async () => {
    const string = await lab('plucked-string')
    const fixed = tap(string.render(nothing(), {}), 'fixed')
    // The same windows as the string's fundamental is measured in: 50 ms to 250 ms after the pick.
    expectWritten(fall(fixed, 220, after(0.05), 9600), '17.1 dB')
    expectWritten(fall(fixed, 2200, after(0.05), 9600), '17.1 dB')
  })

  it('starts the tenth partial of the string 22 dB under its fundamental and has it 75 dB under half a second later (claim darkens)', async () => {
    const string = await lab('plucked-string')
    const x = tap(string.render(nothing(), {}), 'string')
    const under = (from: number) => {
      const tenth = peakHz(x, 2190, 2225, from, 4096)
      return sizeDb(x, 220, from, 4096) - sizeDb(x, tenth, from, 4096)
    }
    // Two windows of 85 ms: from 30 ms after the pick, and from half a second after it.
    expectWritten(under(after(0.03)), '22 dB')
    expectWritten(under(after(0.5)), '75 dB')
  })

  it('makes a note of the noise: the plain string stands less than 0.001 cents from 220 Hz (claim noise-pitch)', async () => {
    const string = await lab('plucked-string')
    const out = string.render(nothing(), {})
    // A second of it from 0.1 s after the noise went in.
    const hz = peakHz(tap(out, 'plain'), 218, 222, after(0.1), RATE)
    expectWritten(Math.abs(cents(hz, 220)), 'less than 0.001 cents')
    // The noise is one period long, to the sample, and is gone before the loop has gone round twice.
    const burst = tap(out, 'burst')
    expect(peak(burst.subarray(0, DOWN))).toBe(0)
    expect(burst[DOWN + 217]).not.toBe(0)
    expect(peak(burst.subarray(DOWN + 218))).toBe(0)
  })

  // ---- part 2: one period of noise going round, smoother each pass -----------------------------

  it('crosses zero 106 times in the period the noise went in on and 8 times twenty trips later (claim noise-crossings)', async () => {
    const string = await lab('plucked-string')
    const out = string.render(nothing(), {})
    expect(out.taps.plainStart!.length).toBe(218)
    expectWritten(crossings(tap(out, 'plainStart')), '106')
    expectWritten(crossings(tap(out, 'plainLater')), '8')
    // And fewer the longer it goes round.
    const far = string.render(nothing(), { trips: 200 })
    expect(crossings(tap(far, 'plainLater'))).toBeLessThan(8)
  })

  it('lets the largest sample of the period fall from 0.83 to 0.19 in those twenty trips, and its steepest step from 1.26 to 0.028 (claim noise-shrinks)', async () => {
    const string = await lab('plucked-string')
    const out = string.render(nothing(), {})
    expectWritten(peak(tap(out, 'plainStart')), '0.83')
    expectWritten(peak(tap(out, 'plainLater')), '0.19')
    expectWritten(steepest(tap(out, 'plainStart')), '1.26')
    expectWritten(steepest(tap(out, 'plainLater')), '0.028')
  })

  // ---- part 3: the cards of what it is used on -------------------------------------------------

  it('renders every named set, finite and heard', async () => {
    const string = await lab('plucked-string')
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = played(string, name)
      const sound = tap(result, set.tap ?? 'out')
      expect(
        sound.every((v) => Number.isFinite(v)),
        name,
      ).toBe(true)
      expect(gainToDb(rms(sound)), `${name} is heard`).toBeGreaterThan(-40)
      // The lesson lists no source: every card plays the lab's own note.
      expect(set.source, name).toBeUndefined()
    }
  })

  it('stands the peak of the picked note 16 dB over its level from 0.1 s to 0.6 s after the pick (claim use-picked)', async () => {
    const string = await lab('plucked-string')
    expectWritten(spike(tap(played(string, 'picked'), 'out')), '16 dB')
  })

  it('loses the fundamental of the low string at 6.7 dB a second (claim use-low) and of the high string at 34 dB a second (claim use-high)', async () => {
    const string = await lab('plucked-string')
    expectWritten(fall(tap(played(string, 'low'), 'string'), 82.41, after(0.05), 9600), '6.7 dB')
    expectWritten(fall(tap(played(string, 'high'), 'string'), 880, after(0.05), 9600), '34 dB')
  })

  it('has the muted note 50 dB down a tenth of a second after the key is let go (claim use-muted)', async () => {
    const string = await lab('plucked-string')
    const level = tap(played(string, 'muted'), 'level')
    expectWritten(level[tick(0.25)]! - level[tick(0.35)]!, '50 dB')
    // Held, the same note has lost little in that tenth of a second.
    const held = tap(played(string, 'muted', { hold: 3 }), 'level')
    expect(held[tick(0.25)]! - held[tick(0.35)]!).toBeLessThan(3)
  })

  // ---- part 4: the build path ------------------------------------------------------------------

  it('goes round for ever in the bare loop, its level less than 0.01 dB apart two seconds on (claim built-forever), and 1.4 cents sharp (claim built-sharp)', async () => {
    const string = await lab('plucked-string')
    const loop = string.render(nothing(), { build: STEP.loop })
    const level = tap(loop, 'builtLevel')
    expectWritten(Math.abs(level[tick(0.5)]! - level[tick(2.5)]!), 'less than 0.01 dB')
    expectWritten(loop.checks.builtCents!, '1.4 cents')
    // The burst alone, the step before, is over in one period: nothing is left to have a level.
    const burst = tap(string.render(nothing(), { build: STEP.burst }), 'builtLevel')
    expect(burst[tick(0.5)]).toBe(-120)
  })

  it('falls 20 dB between 0.5 s and 1.5 s once the loss filter is in the loop, and not at all without it (claim built-loss); the loop is then 5.1 cents flat (claim built-loss-flat)', async () => {
    const string = await lab('plucked-string')
    const fallen = (build: number) => {
      const level = tap(string.render(nothing(), { build }), 'builtLevel')
      return level[tick(0.5)]! - level[tick(1.5)]!
    }
    expectWritten(fallen(STEP.loss), '20 dB')
    // The piece switched off: the step before.
    expect(matchesWritten(fallen(STEP.loop), '20 dB')).toBe(false)
    expectWritten(-string.render(nothing(), { build: STEP.loss }).checks.builtCents!, '5.1 cents')
    expect(
      matchesWritten(
        -string.render(nothing(), { build: STEP.loop }).checks.builtCents!,
        '5.1 cents',
      ),
    ).toBe(false)
  })

  it('is 46.5 cents flat with the stiffness filters in a loop nothing has shortened (claim built-flat)', async () => {
    const string = await lab('plucked-string')
    expectWritten(-string.render(nothing(), { build: STEP.stiff }).checks.builtCents!, '46.5 cents')
    expect(
      matchesWritten(
        -string.render(nothing(), { build: STEP.loss }).checks.builtCents!,
        '46.5 cents',
      ),
    ).toBe(false)
  })

  it('is less than 0.001 cents from the note once the line is cut and the tuning all-pass added, and not before (claim built-tuned)', async () => {
    const string = await lab('plucked-string')
    const off = (build: number) => Math.abs(string.render(nothing(), { build }).checks.builtCents!)
    expectWritten(off(STEP.tune), 'less than 0.001 cents')
    // The piece switched off: the step before.
    expect(matchesWritten(off(STEP.stiff), 'less than 0.001 cents')).toBe(false)
    // By a transform of the built sound itself, a second long, from 0.1 s after the noise went in.
    const built = tap(string.render(nothing(), { build: STEP.tune }), 'built')
    expect(Math.abs(cents(peakHz(built, 218, 222, after(0.1), RATE), 220))).toBeLessThan(0.005)
  })

  it('is 19.6 dB louder half a second on with the shaped pluck than with the noise (claim built-pluck)', async () => {
    const string = await lab('plucked-string')
    const level = (build: number) =>
      tap(string.render(nothing(), { build }), 'builtLevel')[tick(0.5)]!
    expectWritten(level(STEP.pluck) - level(STEP.tune), '19.6 dB')
    // The piece switched off: the step before against itself is no louder.
    expect(matchesWritten(level(STEP.tune) - level(STEP.tune), '19.6 dB')).toBe(false)
    // What goes into the loop is now the device's own pluck, sample for sample.
    const out = string.render(nothing(), { build: STEP.pluck })
    expect(tap(out, 'builtPluck').every((v, i) => v === tap(out, 'pluck')[i])).toBe(true)
  })

  it('takes 12.8 dB off the thirteenth partial and adds 4.4 dB to the second when the pick is given a place (claim built-comb)', async () => {
    const string = await lab('plucked-string')
    const sizes = (build: number) => {
      const built = tap(string.render(nothing(), { build }), 'built')
      return { second: partial(built, 220, 2), thirteenth: partial(built, 220, 13) }
    }
    const without = sizes(STEP.pluck)
    const placed = sizes(STEP.comb)
    expectWritten(without.thirteenth - placed.thirteenth, '12.8 dB')
    expectWritten(placed.second - without.second, '4.4 dB')
    // The piece switched off: the step before against itself moves neither.
    expect(matchesWritten(without.thirteenth - without.thirteenth, '12.8 dB')).toBe(false)
  })

  it('is the device at the pickup, sample for sample, with every piece in, at any setting (claim built-exact)', async () => {
    const string = await lab('plucked-string')
    for (const values of [
      {},
      { hold: 4 },
      { note: 82.41 },
      { note: 880, shimmer: 1.5 },
      { swell: 1 },
      { sustain: 1, hold: 0.25 },
      { pickup: 0, position: 0.35, hardness: 1 },
    ]) {
      const out = string.render(nothing(), { ...values, build: STEP.pickup })
      expect(out.checks.builtDifference).toBe(-140)
      // From the pick onward the built sound is the tap at the pickup itself.
      const built = tap(out, 'built')
      const device = tap(out, 'pickup')
      const from = after(0.02)
      expect(built.subarray(from).every((v, i) => v === device[from + i])).toBe(true)
    }
    // A piece short it is not: the step before is heard before the pickup.
    const short = string.render(nothing(), { build: STEP.comb })
    expect(tap(short, 'built').every((v, i) => v === tap(short, 'pickup')[i])).toBe(false)
    // The bound the lab states.
    expectWritten(short.checks.builtBound!, '−120 dB')
  })

  // ---- part 5: the device, stage by stage ------------------------------------------------------

  it('plays a note at 220 Hz: the string less than 0.001 cents off it, the output less than 0.02 cents (claim in-tune)', async () => {
    const string = await lab('plucked-string')
    const out = string.render(nothing(), {})
    // A second of each from 0.1 s after the pluck, the peak of its transform found between the bins.
    const ofString = peakHz(tap(out, 'string'), 218, 222, after(0.1), RATE)
    const ofOutput = peakHz(tap(out, 'out'), 218, 222, after(0.1), RATE)
    expectWritten(Math.abs(cents(ofString, 220)), 'less than 0.001 cents')
    expectWritten(Math.abs(cents(ofOutput, 220)), 'less than 0.02 cents')
    // The lab's own measure, by the turn of the phase, agrees.
    expectWritten(Math.abs(out.checks.cents!), 'less than 0.001 cents')
  })

  it('is in tune at every note from 82 Hz to 880 Hz, less than 0.02 cents off (claim tuned-everywhere)', async () => {
    const string = await lab('plucked-string')
    const out = string.render(nothing(), {})
    const kit = out.taps.tuneKit!
    expect(kit.length).toBe(42)
    expect(kit.x0).toBeCloseTo(82.407, 2)
    expect(kit.x1).toBeCloseTo(880, 0)
    expectWritten(Math.abs(largest(kit.channels_data[0]!).value), 'less than 0.02 cents')
    for (const note of [82.41, 123.47, 311.13, 880]) {
      expectWritten(
        Math.abs(string.render(nothing(), { note }).checks.cents!),
        'less than 0.02 cents',
      )
    }
  })

  it('would be as much as 12.7 cents out with a line of whole samples (claim whole-samples), and 48 cents flat at 220 Hz with a line one period long, at least 36 cents flat at every note (claim period-long)', async () => {
    const string = await lab('plucked-string')
    const out = string.render(nothing(), {})
    const whole = largest(tap(out, 'tuneWhole'))
    expect(whole.at).toBe(40) // the G sharp under the top A
    expectWritten(whole.value, '12.7 cents')
    const flat = tap(out, 'tuneFlat')
    // Seventeen semitones over the low E is the A at 220 Hz.
    expectWritten(-flat[17]!, '48 cents')
    expectWritten(-Math.max(...flat), 'at least 36 cents')
  })

  it('adds the line, its all-pass and the filters up to one period, less than 0.0001 samples out (claim loop-adds-up)', async () => {
    const string = await lab('plucked-string')
    for (const values of [{}, { note: 82.41 }, { note: 880 }, { sustain: 1 }, { sustain: 30 }]) {
      expectWritten(
        Math.abs(string.render(nothing(), values).checks.loopError!),
        'less than 0.0001 samples',
      )
    }
  })

  it('takes 0.83 samples for the loop filter and 5.29 samples for the stiffness filters off a period of 218.18 samples at 220 Hz, which leaves a line of 212.06 samples (claim delays-220)', async () => {
    const string = await lab('plucked-string')
    const { checks } = string.render(nothing(), {})
    expectWritten(checks.lossDelay!, '0.83 samples')
    expectWritten(checks.stiffDelay!, '5.29 samples')
    expectWritten(checks.lineLength!, '212.06 samples')
    expectWritten(checks.lossDelay! + checks.stiffDelay! + checks.lineLength!, '218.18 samples')
  })

  it('solves a pole of 0.453 and a gain of 0.9917 for the loop filter at 220 Hz: a trip costs 0.08 dB at the note and 8.3 dB at 20 kHz (claim filter-220)', async () => {
    const string = await lab('plucked-string')
    const out = string.render(nothing(), {})
    expectWritten(out.checks.lossPole!, '0.453')
    expectWritten(out.checks.lossGain!, '0.9917')
    const curve = tap(out, 'loss')
    expectWritten(-curve[curve.length - 1]!, '8.3 dB')
    const at220 = Math.round((Math.log(220 / 20) / Math.log(1000)) * (curve.length - 1))
    expectWritten(-curve[at220]!, '0.08 dB')
  })

  it('loses the fundamental at 17.1 dB a second (claim fall-first) and the tenth partial at 130 dB a second (claim fall-tenth)', async () => {
    const string = await lab('plucked-string')
    const out = string.render(nothing(), {})
    const x = tap(out, 'string')
    // The fundamental from 50 ms after the pluck to 250 ms; the tenth partial, which is soon gone, from 30 ms to 80 ms.
    const first = fall(x, 220, after(0.05), 9600)
    const tenthHz = peakHz(x, 2190, 2225, after(0.03), 4096)
    const tenth = fall(x, tenthHz, after(0.03), 2400)
    expectWritten(first, '17.1 dB')
    expectWritten(tenth, '130 dB')
    // The lab's own measure of both.
    const measured = tap(out, 'decayMeasured')
    expectWritten(measured[0]!, '17.1 dB')
    expectWritten(measured[9]!, '130 dB')
  })

  it("measures each partial's fall less than 0.01 % from what the loop filter and the trip's length give (claim fall-formula)", async () => {
    const string = await lab('plucked-string')
    const out = string.render(nothing(), {})
    expect(out.taps.decayMeasured!.length).toBe(16)
    expectWritten(out.checks.decayError!, 'less than 0.01 %')
    // Every later partial falls faster than the one before.
    const measured = tap(out, 'decayMeasured')
    expect(measured.every((v, k) => k === 0 || v > measured[k - 1]!)).toBe(true)
    // Elsewhere on the neck and with other settings, within 0.2 %.
    for (const values of [
      { note: 82.41 },
      { note: 110, position: 0.2 },
      { note: 440 },
      { sustain: 3 },
    ]) {
      expect(string.render(nothing(), values).checks.decayError).toBeLessThan(0.2)
    }
  })

  it('stands its tenth partial 6.3 cents above ten times the note, where the law says 6.5 cents (claim stretch-tenth)', async () => {
    const string = await lab('plucked-string')
    const out = string.render(nothing(), {})
    const tenthHz = peakHz(tap(out, 'string'), 2190, 2225, after(0.03), 4096)
    expectWritten(cents(tenthHz, 2200), '6.3 cents')
    expectWritten(tap(out, 'stretchMeasured')[9]!, '6.3 cents')
    // The law's line has ten points to a partial: the tenth partial is its 91st point.
    expectWritten(tap(out, 'stretchLaw')[90]!, '6.5 cents')
    expect(Math.abs(tap(out, 'stretchMeasured')[0]!)).toBeLessThan(0.01)
  })

  it("holds the fifth partial 8 cents sharp with Sustain at 1 s, where the stiff string's law puts it under 2 cents (claim loss-sharpens)", async () => {
    const string = await lab('plucked-string')
    const out = string.render(nothing(), { sustain: 1 })
    // At a Sustain of 1 s only the first five partials ring long enough to be measured.
    const measured = out.taps.stretchMeasured!
    expect(measured.length).toBe(5)
    expectWritten(measured.channels_data[0]![4]!, '8 cents')
    expectWritten(tap(out, 'stretchLaw')[40]!, 'under 2 cents')
    // By a transform of the string itself: the fifth partial stands above 1100 Hz by as much.
    const hz = peakHz(tap(out, 'string'), 1100, 1112, after(0.03), 4096)
    expectWritten(cents(hz, 1100), '8 cents')
  })

  it('plucks with a rounded pulse: highest 8 samples after it starts, half gone after 36 samples, under a hundredth of its height from 4.2 ms on (claim pluck-shape)', async () => {
    const string = await lab('plucked-string')
    const whole = tap(string.render(nothing(), {}), 'pluck')
    // Nothing before the key goes down.
    expect(peak(whole.subarray(0, DOWN))).toBe(0)
    const pluck = whole.subarray(DOWN)
    const top = largest(pluck.subarray(0, 2000))
    expectWritten(top.at, '8 samples')
    expect(top.value).toBeGreaterThan(1.9)
    expect(top.value).toBeLessThan(2)
    let half = top.at
    while (pluck[half]! > top.value / 2) half += 1
    expectWritten(half, '36 samples')
    // The first sample from which it stays under a hundredth of its height.
    let under = 0
    for (let i = 0; i < 4000; i += 1) if (Math.abs(pluck[i]!) > 0.01 * top.value) under = i + 1
    expectWritten((under * 1000) / RATE, '4.2 ms')
    // It pushes one way: what there is below zero is the pick's noise, under a two-hundredth of its height.
    expect(Math.min(...pluck.subarray(0, 2000))).toBeGreaterThan(-0.005 * top.value)
    // Nothing of it after 30 ms, when the exciter has stopped.
    expect(peak(pluck.subarray(1500))).toBe(0)
  })

  it('puts the second pluck 34 samples ahead of the first at the starting settings (claim pick-34), and the line grows smoother: its steepest step falls from 0.655 to 0.114 in twenty trips (claim smoother)', async () => {
    const string = await lab('plucked-string')
    const out = string.render(nothing(), {})
    expectWritten(out.checks.pickSamples!, '34 samples')
    const start = tap(out, 'lineStart')
    const later = tap(out, 'lineLater')
    expect(start.length).toBe(211)
    // The pluck's crest and its upside-down copy's stand a little over 34 samples apart.
    let crest = 0
    let trough = 0
    start.forEach((v, i) => {
      if (v > start[crest]!) crest = i
      if (v < start[trough]!) trough = i
    })
    expect(trough - crest).toBeGreaterThanOrEqual(34)
    expect(trough - crest).toBeLessThan(40)
    expectWritten(steepest(start), '0.655')
    expectWritten(steepest(later), '0.114')
    // And more trips, smoother still.
    const far = tap(string.render(nothing(), { trips: 200 }), 'lineLater')
    expect(steepest(far)).toBeLessThan(steepest(later) / 2)
  })

  it('puts the second pluck 87 samples ahead with the pick a fifth of the way along the open string at 110 Hz, and leaves the fifth partial 41 dB under the fourth (claim pick-fifth)', async () => {
    const string = await lab('plucked-string')
    // The open A string, 110 Hz, where Position is the fraction of the sounding length.
    const out = string.render(nothing(), { note: 110, position: 0.2 })
    // A fifth of a period of 436.4 samples, to the nearest sample.
    expectWritten(out.checks.pickSamples!, '87 samples')
    const x = tap(out, 'string')
    const size = (k: number) => {
      const hz = peakHz(x, 110 * k * 0.997, 110 * k * 1.006, DOWN, 4096)
      return sizeDb(x, hz, DOWN, 4096)
    }
    expectWritten(size(4) - size(5), '41 dB')
    expect(size(6) - size(5)).toBeGreaterThan(30)
    // The tenth goes with it; the partials between do not.
    expect(size(9) - size(10)).toBeGreaterThan(30)
    for (const k of [2, 3, 6, 7, 8]) expect(size(1) - size(k)).toBeLessThan(15)
  })

  it("works the pickup's signal out again from the two strings, sample for sample (claim rebuilt-exact)", async () => {
    const string = await lab('plucked-string')
    for (const values of [
      {},
      { shimmer: 0.3 },
      { hold: 4 },
      { pickup: 0 },
      { swell: 1 },
      { note: 311.13, shimmer: 1.5 },
    ]) {
      expect(string.render(nothing(), values).checks.rebuilt).toBe(-140)
    }
  })

  it('falls slower as it rings, 16.6 dB a second and then 11.7 dB, where the first string alone keeps to at least 18 dB (claim two-slopes)', async () => {
    const string = await lab('plucked-string')
    const out = string.render(nothing(), {})
    const note = tap(out, 'level')
    const first = tap(out, 'levelOne')
    const slope = (x: Float32Array, from: number, to: number) =>
      (x[tick(from)]! - x[tick(to)]!) / (to - from)
    expectWritten(slope(note, 0.2, 0.7), '16.6 dB')
    expectWritten(slope(note, 2, 2.9), '11.7 dB')
    expectWritten(slope(first, 0.2, 0.7), 'at least 18 dB')
    expectWritten(slope(first, 2, 2.9), 'at least 18 dB')
  })

  it('tunes the first string to 219.85 Hz with Shimmer at 0.3 Hz (claim shimmer-apart), and the note dips up to 6 dB under its in-tune self (claim beat)', async () => {
    const string = await lab('plucked-string')
    const still = string.render(nothing(), { hold: 4 })
    const beating = string.render(nothing(), { hold: 4, shimmer: 0.3 })
    const hz = peakHz(tap(beating, 'string'), 219, 221, after(0.1), RATE)
    expectWritten(hz, '219.85 Hz')
    const a = tap(still, 'level')
    const b = tap(beating, 'level')
    let deepest = 0
    for (let i = tick(0.2); i < tick(3.8); i += 1) deepest = Math.min(deepest, b[i]! - a[i]!)
    expectWritten(-deepest, '6 dB')
    // One whole beat of the fundamental later, 3.33 s, the two strings are together again.
    expect(Math.abs(b[tick(3.333)]! - a[tick(3.333)]!)).toBeLessThan(0.3)
  })

  it('falls at over 400 dB a second once the key is let go (claim damped)', async () => {
    const string = await lab('plucked-string')
    const out = string.render(nothing(), { hold: 3 })
    const note = tap(out, 'level')
    expectWritten((note[tick(3.03)]! - note[tick(3.08)]!) / 0.05, 'over 400 dB')
    // Held to the loop's end it is still ringing there.
    const held = tap(string.render(nothing(), { hold: 4 }), 'level')
    expect(held[tick(3.5)]!).toBeGreaterThan(-65)
    expect(note[tick(3.5)]!).toBe(-120)
  })

  it('comes out the same on both sides (claim mono)', async () => {
    const string = await lab('plucked-string')
    const out = string.render(nothing(), {}).taps.out!
    expect(out.channels_data[0]!.every((v, i) => v === out.channels_data[1]![i])).toBe(true)
  })

  // ---- parts 6 and 7: the cards of ways to use it, and of what goes wrong -----------------------

  it('puts the second pluck 12 samples ahead when picked by the bridge, and the fundamental comes out 8.7 dB lower than in the picked note (claim way-bridge)', async () => {
    const string = await lab('plucked-string')
    const bridge = played(string, 'bridge')
    expectWritten(bridge.checks.pickSamples!, '12 samples')
    const picked = played(string, 'picked')
    expectWritten(
      partial(tap(picked, 'out'), 220, 1) - partial(tap(bridge, 'out'), 220, 1),
      '8.7 dB',
    )
  })

  it('leaves the tenth partial of the output 27 dB under the first under a soft thumb, where the picked note has it 9 dB under (claim way-thumb)', async () => {
    const string = await lab('plucked-string')
    const under = (name: string) => {
      const out = tap(played(string, name), 'out')
      return partial(out, 220, 1) - partial(out, 220, 10)
    }
    expectWritten(under('thumb'), '27 dB')
    expectWritten(under('picked'), '9 dB')
  })

  it('loses the fundamental at 5.1 dB a second when left to ring (claim way-ring)', async () => {
    const string = await lab('plucked-string')
    expectWritten(fall(tap(played(string, 'ring'), 'string'), 220, after(0.05), 9600), '5.1 dB')
  })

  it('brings the first 20 ms of the swelled note out 41 dB under those of the picked note (claim way-swell)', async () => {
    const string = await lab('plucked-string')
    const first = (name: string) =>
      gainToDb(peak(tap(played(string, name), 'out').subarray(DOWN, after(0.02))))
    expectWritten(first('picked') - first('swell'), '41 dB')
  })

  it('loses the fundamental of the dull note at 109 dB a second (claim fault-dull)', async () => {
    const string = await lab('plucked-string')
    expectWritten(fall(tap(played(string, 'dull'), 'string'), 110, after(0.05), 9600), '109 dB')
  })

  it('dips the wobbling note 6.4 dB under its in-tune self (claim fault-wobble)', async () => {
    const string = await lab('plucked-string')
    const wobble = tap(played(string, 'wobble'), 'level')
    const still = tap(played(string, 'wobble', { shimmer: 0 }), 'level')
    let deepest = 0
    for (let i = tick(0.2); i < tick(3.8); i += 1)
      deepest = Math.min(deepest, wobble[i]! - still[i]!)
    expectWritten(-deepest, '6.4 dB')
  })

  it('stands the peak of the hardest pluck 23.6 dB over its level from 0.1 s to 0.6 s after the pick (claim fault-spike)', async () => {
    const string = await lab('plucked-string')
    expectWritten(spike(tap(played(string, 'spike'), 'out')), '23.6 dB')
  })

  // ---- part 9: the device's own defaults -------------------------------------------------------

  it("starts the page's device table from the device's own defaults: for every control that is a parameter of the device, the settings file's defaults laid over the lab's starting values are device.json's", async () => {
    const string = await lab('plucked-string')
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/guitar/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const { values } = resolveSet(string.description, { values: settings.defaults!.values })
    const shared = device.params.filter((one) => one.key in values)
    // Every parameter of the device is a control of the lab but Strum, which spaces a chord.
    expect(device.params.filter((one) => !(one.key in values)).map((one) => one.key)).toEqual([
      'strum',
    ])
    // The lab holds a starting value as a single-precision number and the settings file a
    // double, so both sides are compared as single precision.
    for (const one of shared)
      expect(Math.fround(values[one.key]!), one.key).toBe(Math.fround(one.default))
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(settings.defaults!.values)) {
      expect(string.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
  })
})
