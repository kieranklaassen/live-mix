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
  points,
  range,
  RATE,
  rms,
  seconds,
  silence,
} from './support.ts'

const ID = 'oscillators-and-subtractive-voice'

// Nothing goes in: the lab plays the note itself. Its key goes down 30 ms into the loop.
const nothing = () => silence(seconds(4))
const DOWN = 1440
/** The sample that stands `s` seconds after the key went down. */
const after = (s: number) => DOWN + seconds(s)
/** The point of a control tap that stands `s` seconds after the key went down. */
const tick = (s: number) => points(s + DOWN / RATE)

/** The first channel of a tap. */
const tap = (result: RenderResult, id: string) => result.taps[id]!.channels_data[0]!

/** The steps of the build path, as the lab numbers them. */
const STEP = { oscillator: 0, second: 1, sub: 2, filter: 3, level: 4, sweep: 5 }

/** The lab's starting Pitch, in hertz. */
const PITCH = 110

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

/** Harmonic `k` of a note at `hz`, in dB, over half a second from `s` seconds after the key. */
const harmonic = (x: Float32Array, hz: number, k: number, s: number, length = 24000) =>
  sizeDb(x, hz * k, after(s), length)

/** How far harmonic `k` stands under harmonic `under`, in dB, both read as `harmonic` reads them. */
const below = (x: Float32Array, hz: number, k: number, s: number, length = 24000, under = 1) =>
  harmonic(x, hz, under, s, length) - harmonic(x, hz, k, s, length)

/**
 * The moments, in seconds from `from`, at which the part of `x` at `hz` is at its weakest: each
 * a dip 12 dB or more under the strongest that part gets, read over four cycles at a time.
 */
function dips(x: Float32Array, hz: number, from: number, to: number) {
  const length = Math.round((4 * RATE) / hz)
  const sizes: number[] = []
  for (let at = from; at < to; at += 48) sizes.push(sizeDb(x, hz, at, length))
  const top = Math.max(...sizes)
  const found: number[] = []
  for (let i = 1; i < sizes.length - 1; i += 1) {
    if (sizes[i]! < top - 12 && sizes[i]! < sizes[i - 1]! && sizes[i]! <= sizes[i + 1]!)
      found.push((i * 48) / RATE)
  }
  const times = found.filter((t, i) => i === 0 || t - found[i - 1]! > 0.1)
  const depths = times.map((t) => top - sizes[Math.round((t * RATE) / 48)]!)
  return { times, depths }
}

/** How many dips a second: 0 where there are fewer than two. */
const perSecond = (times: number[]) =>
  times.length > 1 ? (times.length - 1) / (times[times.length - 1]! - times[0]!) : 0

/** The point at which a control tap first stands at its highest. */
function topOf(x: Float32Array): number {
  const top = range(x).hi
  let at = 0
  while (x[at]! < top) at += 1
  return at
}

/** The seconds a control tap takes, from the point `from`, to fall `db` under what it reads there. */
function fall(x: Float32Array, from: number, db: number): number {
  let i = from
  while (i < x.length - 1 && gainToDb(x[i]! / x[from]!) > -db) i += 1
  return ((i - from) * 16) / RATE
}

/** A filter's response tap, read at one frequency: its 121 points run in even ratios from 20 Hz to 20 kHz. */
function passes(result: RenderResult, hz: number): number {
  const response = tap(result, 'response')
  const place = (Math.log(hz / 20) / Math.log(1000)) * 120
  const i = Math.floor(place)
  return response[i]! + (response[Math.min(120, i + 1)]! - response[i]!) * (place - i)
}

const settings = readSettings(ID)!

/** A named set of the settings file, rendered as the page renders a card. */
function played(voice: Lab, name: string, over: Record<string, number> = {}): RenderResult {
  const set = settings.sets[name]
  if (!set) throw new Error(`The settings file has no set called "${name}".`)
  return voice.render(nothing(), { ...resolveSet(voice.description, set).values, ...over })
}

describe('the subtractive voice', () => {
  it('is a sound lab playing its own note: every tap says something, loops, and answers to every control', async () => {
    const voice = await lab(ID)
    const result = voice.render(nothing(), {})
    expectSoundLab(voice, nothing(), result)
  })

  it('has a build path of six steps, each changing a built tap and none the main path, the last held to the device', async () => {
    const voice = await lab(ID)
    expectBuild(voice, nothing(), { beat: 6, sub: 0.3 })
    expect(voice.description.controls.find((one) => one.id === 'build')!.choices).toEqual([
      'An oscillator',
      'A second, detuned',
      'A sine an octave under',
      'A filter',
      'The contour on the level',
      'The contour on the filter',
    ])
    expect(voice.render(nothing(), {}).checks.builtStep).toBe(STEP.sweep)
  })

  // ---- part 1: why ------------------------------------------------------------------------------

  it("holds the kit's saw alone at one colour and one level: its tenth harmonic 20.0 dB under its first early and late, its level the same (claim raw-steady)", async () => {
    const voice = await lab(ID)
    const raw = tap(voice.render(nothing(), {}), 'raw')
    expectWritten(below(raw, PITCH, 10, 0.1, 4800), '20.0 dB')
    expectWritten(below(raw, PITCH, 10, 0.8, 4800), '20.0 dB')
    const level = (s: number) => gainToDb(rms(raw, after(s), after(s) + 4800))
    expectWritten(Math.abs(level(0.1) - level(0.8)), 'less than 0.01 dB')
  })

  it('takes the tenth harmonic of the bass from 19 dB under the first at 10 ms to 36 dB under it at 300 ms, the first falling 28.8 dB between (claim voice-moves)', async () => {
    const voice = await lab(ID)
    const out = tap(voice.render(nothing(), {}), 'out')
    // Four cycles of the note from each moment.
    const cycles = Math.round((4 * RATE) / PITCH)
    expectWritten(below(out, PITCH, 10, 0.01, cycles), '19 dB')
    expectWritten(below(out, PITCH, 10, 0.3, cycles), '36 dB')
    expectWritten(
      harmonic(out, PITCH, 1, 0.01, cycles) - harmonic(out, PITCH, 1, 0.3, cycles),
      '28.8 dB',
    )
  })

  it("leaves little but the first harmonic when the filter stands at the note's own frequency (claim closed-sine)", async () => {
    const voice = await lab(ID)
    const result = played(voice, 'closed')
    // The set's Cutoff puts the filter at the note: Cutoff is moved half as far as the key is from its pivot.
    expect(result.checks.cutoffNow!).toBeCloseTo(PITCH, 0)
    expectWritten(below(tap(result, 'out'), PITCH, 2, 0.5), '22 dB')
    expectWritten(below(tap(result, 'out'), PITCH, 3, 0.5), 'more than 38 dB')
    expectWritten(below(tap(result, 'mix'), PITCH, 2, 0.5), '6.3 dB')
  })

  // ---- part 2: the picture ----------------------------------------------------------------------

  it('adds two oscillators in step to a first bar 6.0 dB over one oscillator alone (claim row-mix)', async () => {
    const voice = await lab(ID)
    const result = voice.render(nothing(), {})
    expectWritten(tap(result, 'mixHarmonics')[0]! - tap(result, 'oscHarmonics')[0]!, '6.0 dB')
  })

  it('takes 7 dB from the first bar through the filter and more than 19 dB from the thirty-second, at the starting settings (claim row-filter)', async () => {
    const voice = await lab(ID)
    const result = voice.render(nothing(), {})
    const mixed = tap(result, 'mixHarmonics')
    const filtered = tap(result, 'filteredHarmonics')
    expect(mixed.length).toBe(32)
    expectWritten(mixed[0]! - filtered[0]!, '7 dB')
    expectWritten(mixed[31]! - filtered[31]!, 'more than 19 dB')
  })

  it('finds the tenth bar after the filter 17.5 dB lower at 0.3 s than at the starting moment, the first within 0.2 dB (claim row-later)', async () => {
    const voice = await lab(ID)
    const early = tap(voice.render(nothing(), {}), 'filteredHarmonics')
    const late = tap(voice.render(nothing(), { look: 0.3 }), 'filteredHarmonics')
    expectWritten(early[9]! - late[9]!, '17.5 dB')
    expectWritten(Math.abs(early[0]! - late[0]!), '0.2 dB')
  })

  // ---- part 3: uses -----------------------------------------------------------------------------

  it('puts the sine an octave under 12 dB over the note itself in the soft sub (claim use-sub)', async () => {
    const voice = await lab(ID)
    const out = tap(played(voice, 'sub'), 'out')
    expectWritten(harmonic(out, PITCH / 2, 1, 0.5) - harmonic(out, PITCH, 1, 0.5), '12 dB')
  })

  it("plays the pad's three keys on three voices, the first one's envelope at its top after 0.60 s with its cutoff at 5,945 Hz, 1.5 octaves over its rest (claim use-pad)", async () => {
    const voice = await lab(ID)
    const result = played(voice, 'pad')
    expect(result.checks.padHeld).toBe(3)
    const envelope = tap(result, 'padEnv')
    expectWritten((topOf(envelope) * 16 - DOWN) / RATE, '0.60 s')
    const cutoff = tap(result, 'padCorner')
    expectWritten(range(cutoff).hi, '5,945 Hz')
    // Where the cutoff rests: the same chord with the envelope kept off the filter.
    const rest = range(tap(played(voice, 'pad', { padEnvelope: 0 }), 'padCorner'))
    expect(rest.span).toBe(0)
    expectWritten(Math.log2(range(cutoff).hi / rest.hi), '1.5 octaves')
  })

  // ---- part 4: the build ------------------------------------------------------------------------

  it('makes two oscillators 25 cents apart pass each other 1.6 times a second, and one oscillator never (claim build-beat)', async () => {
    const voice = await lab(ID)
    const passing = (step: number) => {
      const built = tap(voice.render(nothing(), { beat: 25, hold: 3.5, build: step }), 'built')
      return perSecond(dips(built, PITCH, after(0.05), after(3.4)).times)
    }
    expectWritten(passing(STEP.second), '1.6')
    // With the piece switched off there is one oscillator, and its first harmonic never dips.
    expect(passing(STEP.oscillator)).toBe(0)
    expect(matchesWritten(passing(STEP.oscillator), '1.6')).toBe(false)
  })

  it('adds a line an octave under the note, 2.1 dB under the note at Sub 0.5, which is not there a step earlier (claim build-sub)', async () => {
    const voice = await lab(ID)
    const under = (step: number) => {
      const built = tap(voice.render(nothing(), { sub: 0.5, build: step }), 'built')
      return harmonic(built, PITCH, 1, 0.1) - harmonic(built, PITCH / 2, 1, 0.1)
    }
    expectWritten(under(STEP.sub), '2.1 dB')
    expect(matchesWritten(under(STEP.second), '2.1 dB')).toBe(false)
    expect(under(STEP.second)).toBeGreaterThan(90)
  })

  it('takes the tenth harmonic from 20.1 dB under the first to 37.6 dB under it when the filter goes in (claim build-filter)', async () => {
    const voice = await lab(ID)
    const tenth = (step: number) =>
      below(tap(voice.render(nothing(), { build: step }), 'built'), PITCH, 10, 0.1)
    expectWritten(tenth(STEP.sub), '20.1 dB')
    expectWritten(tenth(STEP.filter), '37.6 dB')
    expect(matchesWritten(tenth(STEP.sub), '37.6 dB')).toBe(false)
  })

  it('brings the level to 1.00 at 2 ms and 60 dB under that 0.600 s later, where the step before holds it until the key comes up (claim build-level)', async () => {
    const voice = await lab(ID)
    const level = (step: number) => tap(voice.render(nothing(), { build: step }), 'builtLevel')
    const shaped = level(STEP.level)
    expectWritten(shaped[tick(0.002)]!, '1.00')
    expect(topOf(shaped)).toBe(tick(0.002))
    expectWritten(fall(shaped, topOf(shaped), 60), '0.600 s')
    // With the piece switched off the level is a gate: full until the key comes up, a second after it went down.
    const gated = level(STEP.filter)
    expect(range(gated, tick(0.002), tick(0.9)).lo).toBe(1)
    expect(matchesWritten(fall(gated, tick(0.002), 60), '0.600 s')).toBe(false)
  })

  it('starts the cutoff at 5,185 Hz, 3.0 octaves over the 648 Hz it rests at, where the step before leaves it at rest (claim build-sweep)', async () => {
    const voice = await lab(ID)
    const cutoff = (step: number) => tap(voice.render(nothing(), { build: step }), 'builtCorner')
    const swept = cutoff(STEP.sweep)
    expectWritten(range(swept).hi, '5,185 Hz')
    expectWritten(swept[tick(1.5)]!, '648 Hz')
    expectWritten(Math.log2(range(swept).hi / swept[tick(1.5)]!), '3.0 octaves')
    const still = cutoff(STEP.level)
    expect(range(still).span).toBe(0)
    expect(matchesWritten(Math.log2(range(still).hi / still[tick(1.5)]!), '3.0 octaves')).toBe(
      false,
    )
  })

  it("builds the device's output again with all six pieces: all 192,000 samples of the loop the same, at three settings (claim build-same)", async () => {
    const voice = await lab(ID)
    for (const values of [
      {},
      settings.defaults!.values,
      { pattern: 1, beat: 12, sub: 1, drive: 1, emphasis: 1, decay: 10 },
    ]) {
      const result = voice.render(nothing(), { ...values, build: STEP.sweep })
      const built = tap(result, 'built')
      const out = tap(result, 'out')
      expect(built.length).toBe(192000)
      let differing = 0
      for (let i = 0; i < built.length; i += 1) differing += built[i] === out[i] ? 0 : 1
      expect(differing).toBe(0)
      expect(result.checks.builtDifference).toBeLessThanOrEqual(result.checks.builtBound!)
    }
  })

  // ---- part 5: the engine -----------------------------------------------------------------------

  it("reads the saw's recipe off one oscillator: the second harmonic 6.0 dB under the first, the tenth 20.0 dB under (claim osc-recipe)", async () => {
    const voice = await lab(ID)
    const bars = tap(voice.render(nothing(), {}), 'oscHarmonics')
    expectWritten(bars[0]! - bars[1]!, '6.0 dB')
    expectWritten(bars[0]! - bars[9]!, '20.0 dB')
  })

  it('leaves the square its odd harmonics alone: the fifth 14.0 dB under the first, every even one more than 100 dB under (claim osc-square)', async () => {
    const voice = await lab(ID)
    const osc = tap(voice.render(nothing(), { wave: 1 }), 'osc')
    expectWritten(below(osc, PITCH, 5, 0.1), '14.0 dB')
    for (const even of [2, 4, 6, 8]) expectWritten(below(osc, PITCH, even, 0.1), 'more than 100 dB')
  })

  it("draws the kit oscillator's four shapes with the harmonics each should have (claim shapes)", async () => {
    const voice = await lab(ID)
    const result = voice.render(nothing(), {})
    const under = (id: string, k: number) => tap(result, id)[0]! - tap(result, id)[k - 1]!
    expectWritten(under('triangleHarmonics', 3), '19.1 dB')
    expectWritten(under('triangleHarmonics', 5), '28.0 dB')
    expectWritten(under('squareHarmonics', 5), '14.0 dB')
    // The bars a shape should not have: every one above the first in the sine, the even ones in the other two.
    for (let k = 2; k <= 32; k += 1) expectWritten(under('sineHarmonics', k), 'more than 90 dB')
    for (let k = 2; k <= 32; k += 2) {
      expectWritten(under('triangleHarmonics', k), 'more than 90 dB')
      expectWritten(under('squareHarmonics', k), 'more than 90 dB')
    }
  })

  it('lets two oscillators at Beat 0 wander: over a held note the first harmonic of the mix moves less than 0.2 dB and the eighth more than 60 dB (claim mix-drift)', async () => {
    const voice = await lab(ID)
    const mix = tap(
      voice.render(nothing(), { beat: 0, contour: 0, decay: 10, hold: 3.5, cutoff: 12000 }),
      'mix',
    )
    const cycles = Math.round((4 * RATE) / PITCH)
    const sizes = (k: number) => {
      const all: number[] = []
      for (let at = after(0.05); at < after(3.4); at += 480)
        all.push(sizeDb(mix, PITCH * k, at, cycles))
      return Math.max(...all) - Math.min(...all)
    }
    expectWritten(sizes(1), 'less than 0.2 dB')
    expectWritten(sizes(8), 'more than 60 dB')
  })

  it('times the contour by Decay: with Decay at 0.2 s, 0.6 s and 2 s it is 60 dB down 0.200 s, 0.600 s and 2.000 s after its top (claim contour-decay)', async () => {
    const voice = await lab(ID)
    const down = (decay: number) => {
      const contour = tap(voice.render(nothing(), { decay, hold: 3.5 }), 'env')
      expect(topOf(contour)).toBe(tick(0.002))
      return fall(contour, topOf(contour), 60)
    }
    expectWritten(down(0.2), '0.200 s')
    expectWritten(down(0.6), '0.600 s')
    expectWritten(down(2), '2.000 s')
  })

  it('holds the contour at 1.00 with Decay at its top while the key is down, and brings it 60 dB down 0.800 s after the key comes up (claim contour-release)', async () => {
    const voice = await lab(ID)
    const contour = tap(voice.render(nothing(), { decay: 10 }), 'env')
    const held = range(contour, tick(0.003), tick(1.0))
    expectWritten(held.lo, '1.00')
    expectWritten(held.hi, '1.00')
    expectWritten(fall(contour, tick(1.0), 60), '0.800 s')
    // A Decay over the release's limit releases at the limit too.
    const long = tap(voice.render(nothing(), { decay: 2, hold: 0.5 }), 'env')
    expectWritten(fall(long, tick(0.5), 60), '0.800 s')
  })

  it('moves the cutoff half as far as the key: 648 Hz, 917 Hz and 1,297 Hz on keys an octave apart, 0.50 octaves each (claim cutoff-track)', async () => {
    const voice = await lab(ID)
    const at = (note: number) => voice.render(nothing(), { note, contour: 0 }).checks.cutoffNow!
    expectWritten(at(110), '648 Hz')
    expectWritten(at(220), '917 Hz')
    expectWritten(at(440), '1,297 Hz')
    for (const note of [55, 110, 220])
      expectWritten(Math.log2(at(2 * note) / at(note)), '0.50 octaves')
  })

  it('works the cutoff out again to the coefficient the filter holds, at four settings', async () => {
    const voice = await lab(ID)
    for (const values of [
      {},
      settings.defaults!.values,
      { pattern: 1, contour: 1, cutoff: 12000 },
      { note: 32.7, cutoff: 30, contour: 0 },
    ]) {
      expect(voice.render(nothing(), values).checks.cutoffError).toBeLessThan(0.001)
    }
  })

  it('measures the ladder with Emphasis at 0: 12.0 dB down at the cutoff, 28.0 dB an octave over it, and a further 24.0 dB between eight and sixteen times it (claim ladder-slope)', async () => {
    const voice = await lab(ID)
    // On the key the filter pivots on, with the contour off it, Cutoff is the cutoff: 500 Hz.
    const result = voice.render(nothing(), { emphasis: 0, contour: 0, note: 65.40639 })
    expect(result.checks.cutoffNow!).toBeCloseTo(500, 1)
    expectWritten(-passes(result, 500), '12.0 dB')
    expectWritten(-passes(result, 1000), '28.0 dB')
    expectWritten(passes(result, 4000) - passes(result, 8000), '24.0 dB')
  })

  it('pays for Emphasis in the pass band: a tone at 40 Hz comes out 6.8 dB down at 0.3 and 13.2 dB down at 0.9, where the peak stands 21.6 dB over that (claim ladder-emphasis)', async () => {
    const voice = await lab(ID)
    const at = (emphasis: number) =>
      voice.render(nothing(), { emphasis, contour: 0, note: 65.40639 })
    expectWritten(-passes(at(0.3), 40), '6.8 dB')
    const sharp = at(0.9)
    expectWritten(-passes(sharp, 40), '13.2 dB')
    expectWritten(range(tap(sharp, 'response')).hi - passes(sharp, 40), '21.6 dB')
  })

  it('squares the wave with Drive: the second harmonic goes from 7 dB under the first to more than 26 dB under it (claim drive-square)', async () => {
    const voice = await lab(ID)
    const second = (drive: number) =>
      below(
        tap(
          voice.render(nothing(), {
            drive,
            contour: 0,
            decay: 10,
            hold: 3,
            cutoff: 12000,
            emphasis: 0,
          }),
          'out',
        ),
        PITCH,
        2,
        1,
      )
    expectWritten(second(0), '7 dB')
    expectWritten(second(1), 'more than 26 dB')
  })

  it("brings the pad's envelope to its top 0.60 s after the keys and lets it sink to 0.80 by the time they come up (claim pad-envelope)", async () => {
    const voice = await lab(ID)
    const envelope = tap(voice.render(nothing(), {}), 'padEnv')
    expectWritten((topOf(envelope) * 16 - DOWN) / RATE, '0.60 s')
    expectWritten(envelope[tick(1.0) - 1]!, '0.80')
  })

  it("closes the pad's filter by 6.0 octaves with Pad envelope at its lowest (claim pad-closing)", async () => {
    const voice = await lab(ID)
    const rest = range(tap(voice.render(nothing(), { padEnvelope: 0 }), 'padCorner')).hi
    const closing = range(tap(voice.render(nothing(), { padEnvelope: -1 }), 'padCorner')).lo
    expectWritten(Math.log2(rest / closing), '6.0 octaves')
  })

  // ---- part 6: ways -----------------------------------------------------------------------------

  it('makes a pluck of a short Decay: the contour 60 dB down 0.150 s after its top (claim way-pluck)', async () => {
    const voice = await lab(ID)
    const contour = tap(played(voice, 'pluck'), 'env')
    expectWritten(fall(contour, topOf(contour), 60), '0.150 s')
  })

  it("closes the pad's filter by 3.6 octaves at the top of its envelope in the closing set (claim way-dim)", async () => {
    const voice = await lab(ID)
    const rest = range(tap(played(voice, 'dim', { padEnvelope: 0 }), 'padCorner')).hi
    const lowest = range(tap(played(voice, 'dim'), 'padCorner')).lo
    expectWritten(Math.log2(rest / lowest), '3.6 octaves')
  })

  // ---- part 7: what goes wrong ------------------------------------------------------------------

  it('loses 17 dB of the first harmonic of a high note to a low Cutoff that no contour opens (claim fault-choked)', async () => {
    const voice = await lab(ID)
    const shut = tap(played(voice, 'choked'), 'out')
    const opened = tap(played(voice, 'choked', { contour: 0.6 }), 'out')
    expectWritten(harmonic(opened, 440, 1, 0.5) - harmonic(shut, 440, 1, 0.5), '17 dB')
  })

  it('empties a low note every 1.3 s with Beat at its top, the first harmonic more than 50 dB down each time (claim fault-hollow)', async () => {
    const voice = await lab(ID)
    const out = tap(played(voice, 'hollow'), 'out')
    const found = dips(out, 55, after(0.05), after(3.4))
    expect(found.times.length).toBe(3)
    expectWritten(1 / perSecond(found.times), '1.3 s')
    for (const depth of found.depths) expectWritten(depth, 'more than 50 dB')
  })

  it('takes 13 dB off the first harmonic of a low note with Emphasis at 0.9 (claim fault-thin)', async () => {
    const voice = await lab(ID)
    const sharp = tap(played(voice, 'thin'), 'out')
    const plain = tap(played(voice, 'thin', { emphasis: 0 }), 'out')
    expectWritten(harmonic(plain, 55, 1, 0.5) - harmonic(sharp, 55, 1, 0.5), '13 dB')
  })

  it('all but loses the first harmonic of an oscillator with Wave at 0.42: 31 dB under its second (claim fault-octave)', async () => {
    const voice = await lab(ID)
    const osc = tap(played(voice, 'octave'), 'osc')
    expectWritten(below(osc, PITCH, 1, 0.5, 24000, 2), '31 dB')
  })

  // ---- the settings file ------------------------------------------------------------------------

  it('renders every named set, each within the bound of the build and with sound on the tap it plays', async () => {
    const voice = await lab(ID)
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = played(voice, name)
      const sound = tap(result, set.tap ?? 'out')
      expect(rms(sound), name).toBeGreaterThan(0.001)
      expect(range(sound).hi, name).toBeLessThan(1)
      expect(result.checks.builtDifference, name).toBeLessThanOrEqual(result.checks.builtBound!)
      expect(result.checks.cutoffError, name).toBeLessThan(0.001)
    }
  })

  // ---- part 9: the device's own defaults --------------------------------------------------------

  it("starts the page's device table from the device's own defaults: for every control that is a parameter of the device, the settings file's defaults laid over the lab's starting values are device.json's", async () => {
    const voice = await lab(ID)
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/ladder-bass/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const { values } = resolveSet(voice.description, { values: settings.defaults!.values })
    const shared = device.params.filter((one) => one.key in values)
    // Every parameter of the device is a control of the lab but Glide, which slides between
    // overlapping keys: the lab's keys do not overlap.
    expect(device.params.filter((one) => !(one.key in values)).map((one) => one.key)).toEqual([
      'glide',
    ])
    // The lab holds a starting value as a single-precision number and the settings file a
    // double, so both sides are compared as single precision.
    for (const one of shared)
      expect(Math.fround(values[one.key]!), one.key).toBe(Math.fround(one.default))
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(settings.defaults!.values)) {
      expect(voice.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
  })
})
