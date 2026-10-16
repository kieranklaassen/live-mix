import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
  differenceDb,
  expectBuild,
  expectSoundLab,
  expectWritten,
  FADE,
  gainToDb,
  lab,
  matchesWritten,
  noise,
  peak,
  RATE,
  rms,
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

// SAY=1 prints what each test measured: the numbers the lesson states.
const SAY = process.env.SAY === '1'
const say = (...words: unknown[]) => SAY && console.log(...words)

type Tap = {
  channels_data: Float32Array[]
  x0: number
  x1: number
  columns: number
  length: number
}

const left = (tap: Tap | undefined) => tap!.channels_data[0]!

const NAME = 'granular'

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings(NAME)!

/** A named set as its card plays it: on its own source, with `over` laid on its values. */
async function played(grain: Lab, name: string, over: Record<string, number> = {}) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(grain.description, set)
  return grain.render(await benchSource(source!, seconds(4)), { ...values, ...over })
}

/** The device's own defaults, as the settings file holds them for the lab. */
const DEFAULTS = settings.defaults!.values

/** The lab's eight dice: the first is the device's own seed. */
const DICE = [0, 1, 2, 3, 4, 5, 6, 7]

/** The level of `a` against `b` read `lag` samples earlier, in dB, from `from` on. */
function againstEarlier(a: Float32Array, b: Float32Array, lag: number, from = lag + FADE): number {
  let diff = 0
  let ref = 0
  for (let i = from; i < a.length; i += 1) {
    const y = b[i - lag]!
    diff += (a[i]! - y) ** 2
    ref += y * y
  }
  return 10 * Math.log10(Math.max(diff / Math.max(ref, 1e-30), 1e-14))
}

/** The grains of a render, as the lab's cloud taps lay them out: six numbers a grain. */
interface Grain {
  start: number // seconds into the loop
  length: number // seconds
  behind: number // ms behind the write point at its first sample
  /** How far behind the write point its middle reads, in ms: what the device calls the delay. */
  middle: number
  rate: number // ring samples per output sample; below zero backwards
  gain: number
  mark: number // 1 for the grain looked at, 2 for a read head that is no grain
}
function grainsOf(tap: Tap | undefined): Grain[] {
  const data = left(tap)
  const out: Grain[] = []
  for (let g = 0; g < tap!.columns; g += 1) {
    const [start, length, behind, rate, gain, mark] = data.subarray(g * 6, g * 6 + 6)
    out.push({
      start: start!,
      length: length!,
      behind: behind!,
      middle: behind! - ((rate! - 1) * length! * 1000) / 2,
      rate: rate!,
      gain: gain!,
      mark: mark!,
    })
  }
  return out
}
const waitsMs = (grains: Grain[]) =>
  grains.slice(1).map((g, i) => (g.start - grains[i]!.start) * 1000)
const least = (values: number[]) => values.reduce((a, b) => Math.min(a, b), Infinity)
const most = (values: number[]) => values.reduce((a, b) => Math.max(a, b), -Infinity)

/** The most grains that sound at one moment. */
function mostAtOnce(all: Grain[]): number {
  let top = 0
  for (const one of all) {
    const sounding = all.filter(
      (g) => g.start <= one.start && g.start + g.length > one.start,
    ).length
    top = Math.max(top, sounding)
  }
  return top
}

/**
 * The power between `lo` and `hi` hertz (from the shifted pitch) of one of the lab's line
 * spectra, in dB against the sine that went in. A line's power under a Hann window is spread
 * over its neighbouring bins, 1.5 times its own in all, whether or not it stands on a bin.
 */
function bandDb(tap: Tap | undefined, lo: number, hi: number): number {
  const data = left(tap)
  let power = 0
  for (let i = 0; i < data.length; i += 1) {
    const hz = tap!.x0 + ((tap!.x1 - tap!.x0) * i) / (data.length - 1)
    if (hz >= lo && hz <= hi) power += 10 ** (data[i]! / 10)
  }
  return 10 * Math.log10(Math.max(power / 1.5, 1e-20))
}
/** One line: the power within 4.4 Hz (three bins) of `hz`. */
const lineDb = (tap: Tap | undefined, hz: number) => bandDb(tap, hz - 4.4, hz + 4.4)
/** Where a line stands, in hertz from the shifted pitch: the middle of the power within 4.4 Hz of `near`. */
function lineHz(tap: Tap | undefined, near: number): number {
  const data = left(tap)
  let power = 0
  let weighed = 0
  for (let i = 0; i < data.length; i += 1) {
    const hz = tap!.x0 + ((tap!.x1 - tap!.x0) * i) / (data.length - 1)
    if (Math.abs(hz - near) > 4.4) continue
    power += 10 ** (data[i]! / 10)
    weighed += hz * 10 ** (data[i]! / 10)
  }
  return weighed / power
}

/** The mean level of a spectrum (dB a bin, to 24 kHz) between two frequencies. */
function meanDb(spectrum: Float32Array, lo: number, hi: number): number {
  const at = (hz: number) => Math.round((hz / 24_000) * (spectrum.length - 1))
  let power = 0
  for (let k = at(lo); k <= at(hi); k += 1) power += 10 ** (spectrum[k]! / 10)
  return 10 * Math.log10(power / (at(hi) - at(lo) + 1))
}

/** The power of a stretch of sound at one frequency, under a Hann window. */
function powerAt(x: Float32Array, from: number, to: number, hz: number): number {
  let re = 0
  let im = 0
  for (let i = from; i < to; i += 1) {
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * (i - from)) / (to - from))
    const turn = (2 * Math.PI * hz * i) / RATE
    re += x[i]! * window * Math.cos(turn)
    im -= x[i]! * window * Math.sin(turn)
  }
  return re * re + im * im
}

/** The frequency of the strongest of `candidates` in a stretch of sound. */
function strongest(x: Float32Array, from: number, to: number, candidates: number[]): number {
  let best = 0
  let top = -1
  for (const hz of candidates) {
    const power = powerAt(x, from, to, hz)
    if (power > top) {
      top = power
      best = hz
    }
  }
  return best
}

/** Every semitone from 110 Hz to 7 kHz. */
const SEMITONES = Array.from({ length: 73 }, (_, k) => 110 * 2 ** (k / 12))

/**
 * The frequency of a sine by its upward crossings of zero, each placed between its two samples,
 * over the middle four fifths of `x`: one less than their number over the time from the first
 * to the last.
 */
function crossingsHz(x: Float32Array): number {
  const places: number[] = []
  for (let i = Math.floor(x.length * 0.1) + 1; i < x.length * 0.9; i += 1) {
    const before = x[i - 1]!
    const after = x[i]!
    if (before < 0 && after >= 0) places.push(i - 1 + before / (before - after))
  }
  return ((places.length - 1) * RATE) / (places[places.length - 1]! - places[0]!)
}

/** A quarter of a second of a 220 Hz sine, faded at both ends, then silence. */
function burst(frames: number): Source {
  const source = silence(frames)
  const length = seconds(0.25)
  for (let i = 0; i < length; i += 1) {
    const fade = Math.min(1, i / 480, (length - i) / 480)
    source.left[i] = source.right[i] = 0.25 * fade * Math.sin((2 * Math.PI * 220 * i) / RATE)
  }
  return source
}

/** How far each repeat of the burst lies under the one before, in dB: the second against the first, and on. */
function repeatSteps(out: Float32Array, count = 4): number[] {
  const level = (n: number) => {
    const from = seconds(n * 0.5 + 0.03)
    return gainToDb(rms(out, from, from + seconds(0.2)))
  }
  return Array.from({ length: count }, (_, k) => level(k + 1) - level(k + 2))
}

const tapOf = (result: RenderResult, id: string) => result.taps[id]!.channels_data[0]!
const levelOf = (result: RenderResult, id: string) => gainToDb(rms(tapOf(result, id)))

describe('granular sound', () => {
  it('is a sound lab on the guitar: every tap says something, loops, and answers to every control', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const result = grain.render(guitar, {})
    say('a render of four seconds at the starting values took', result.ms.toFixed(0), 'ms')
    expectSoundLab(grain, guitar, result)
  })

  it('builds a grain delay in six steps on the guitar, at the device’s own defaults: every step changes the built sound, leaves the main path alone, and the last is the device’s output', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    expectBuild(grain, guitar, DEFAULTS)
    const whole = grain.render(guitar, { ...DEFAULTS, build: 5 })
    say(
      'the build, all six pieces, against the device’s output:',
      whole.checks.builtDifference,
      'dB, in',
      whole.ms.toFixed(0),
      'ms',
    )
    expect(whole.checks.builtStep).toBe(5)
  })

  // ---- the build part: each step's number, and the same number with the piece taken out --------

  it('makes the build with all six pieces the device’s output sample for sample, at the starting values, at the defaults, backwards, with every spray full, and across a silence (claim build-same)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(2))
    const drums = await benchSource('drums', seconds(2))
    for (const [source, values] of [
      [guitar, {}],
      [guitar, DEFAULTS],
      [drums, { ...DEFAULTS, reverse: 0.5, dice: 3 }],
      [
        drums,
        { spray: 1, pitch: -7, pitchSpray: 1, density: 8, reverse: 0.5, spread: 1, size: 37 },
      ],
      [guitar, { size: 10, density: 8, pitch: -24, feedback: 0.9, tone: 900, mix: 0.2 }],
      [burst(seconds(4)), { time: 500, pitch: 12, feedback: 0.5, size: 100, density: 4 }],
    ] as const) {
      const result = grain.render(source, { ...values, build: 5 })
      let apart = 0
      for (const c of [0, 1]) {
        const built = result.taps.built!.channels_data[c]!
        const out = result.taps.out!.channels_data[c]!
        for (let i = 0; i < out.length; i += 1)
          apart = Math.max(apart, Math.abs(built[i]! - out[i]!))
      }
      say('build 5 against the device, the largest difference of any sample:', apart, values)
      expect(apart).toBe(0)
      expect(result.checks.builtDifference).toBe(-140)
      // And the grains the build started are the grains the device started.
      const own = grainsOf(result.taps.cloud)
      const made = grainsOf(result.taps.builtCloud)
      expect(made.length).toBe(own.length)
      made.forEach((one, k) => {
        expect(one.start).toBe(own[k]!.start)
        expect(one.behind).toBe(own[k]!.behind)
        expect(one.rate).toBe(own[k]!.rate)
      })
    }
  })

  it('step 1: what was recorded comes back 250 ms late, sample for sample (claim build-late)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const result = grain.render(guitar, { build: 0 })
    const built = tapOf(result, 'built')
    const input = tapOf(result, 'in')
    // The lag at which the built sound is the input: the best of every lag from 0 to half a second.
    let best = 0
    let bestMiss = Infinity
    for (let lag = 0; lag <= seconds(0.5); lag += 1) {
      let miss = 0
      for (let i = seconds(1); i < seconds(1.2); i += 7)
        miss += Math.abs(built[i]! - input[i - lag]!)
      if (miss < bestMiss) {
        bestMiss = miss
        best = lag
      }
    }
    say('step 1: the built sound is the input', (best * 1000) / RATE, 'ms late')
    expectWritten((best * 1000) / RATE, '250 ms')
    let unlike = 0
    for (let i = best + FADE; i < seconds(4); i += 1) unlike += built[i] === input[i - best] ? 0 : 1
    expect(unlike).toBe(0)
    // One read head and no grain.
    const head = grainsOf(result.taps.builtCloud)
    expect(head.length).toBe(1)
    expect(head[0]!.mark).toBe(2)
    expect(head[0]!.behind).toBe(250)
  })

  it('step 2: one grain at a time under its window leaves white noise 4.2 dB under what was recorded (claim build-window), and with the window out it is as loud as it was', async () => {
    const grain = await lab(NAME)
    const hiss = noise(0.25, seconds(4))
    const level = (build: number) => {
      const result = grain.render(hiss, { build })
      return gainToDb(rms(tapOf(result, 'built')) / rms(tapOf(result, 'in')))
    }
    say(
      'white noise, built against the input: step 1',
      level(0).toFixed(2),
      'dB, step 2',
      level(1).toFixed(2),
      'dB',
    )
    expectWritten(-level(1), '4.2 dB')
    // The piece out: at the step before, the noise is as loud as it went in.
    expect(matchesWritten(-level(0), '4.2 dB')).toBe(false)
    expect(Math.abs(level(0))).toBeLessThan(0.01)
    // The windows stand end to end: their sum runs from nothing to one.
    const cover = tapOf(grain.render(hiss, { build: 1 }), 'builtCover')
    expect(least(Array.from(cover))).toBeLessThan(0.001)
    expect(most(Array.from(cover))).toBeCloseTo(1, 3)
  })

  it('step 3: the gain puts white noise back within 0.1 dB of what was recorded at Density 1 (claim build-level), and two grains overlapping are the recording again, 250 ms late (claim build-plain); with the piece out neither holds', async () => {
    const grain = await lab(NAME)
    const hiss = noise(0.25, seconds(4))
    const level = (build: number, density = 1) => {
      const result = grain.render(hiss, { build, density })
      return gainToDb(rms(tapOf(result, 'built')) / rms(tapOf(result, 'in')))
    }
    for (const density of [1, 2, 4, 8]) {
      say(
        'white noise, step 3, Density',
        density,
        'built against the input:',
        level(2, density).toFixed(3),
        'dB',
      )
    }
    expectWritten(Math.abs(level(2)), 'less than 0.1 dB')
    expect(matchesWritten(Math.abs(level(1)), 'less than 0.1 dB')).toBe(false)

    const guitar = await benchSource('guitar', seconds(4))
    const miss = (build: number) => {
      const result = grain.render(guitar, { build, density: 2 })
      return againstEarlier(tapOf(result, 'built'), tapOf(result, 'in'), seconds(0.25))
    }
    say(
      'guitar, Density 2, built against the input 250 ms late: step 3',
      miss(2).toFixed(1),
      'dB, step 2',
      miss(1).toFixed(1),
      'dB',
    )
    expectWritten(-miss(2), 'more than 85 dB')
    expect(matchesWritten(-miss(1), 'more than 85 dB')).toBe(false)
    // And the windows of step 3 add up to one, where those of step 2 fall to nothing.
    const cover = tapOf(grain.render(guitar, { build: 2, density: 2 }), 'builtCover')
    expect(most(Array.from(cover.subarray(FADE / 16), (v) => Math.abs(v - 1)))).toBeLessThan(1e-4)
  })

  it('step 4: with Spray at 0.5, Time at 350 ms, Size at 100 ms and Density at 4 the grains read from 350 ms to 600 ms behind on every one of the eight dice, and as far as 599.5 ms on the first (claim build-scatter); with the piece out every grain reads 350 ms behind', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const values = { spray: 0.5, size: 100, density: 4, time: 350 }
    const reach = (build: number, dice: number) => {
      const middles = grainsOf(
        grain.render(guitar, { ...values, build, dice }).taps.builtCloud,
      ).map((g) => g.middle)
      return { nearest: least(middles), furthest: most(middles), count: middles.length }
    }
    for (const dice of DICE) {
      const { nearest, furthest, count } = reach(3, dice)
      say(
        'step 4, Dice',
        dice + 1,
        ':',
        count,
        'grains read from',
        nearest.toFixed(1),
        'to',
        furthest.toFixed(1),
        'ms behind',
      )
      expectWritten(nearest, 'at least 350 ms')
      expectWritten(furthest, 'at most 600 ms')
      // The dice were thrown: the grains are spread over most of the quarter second.
      expect(furthest - nearest).toBeGreaterThan(200)
    }
    expectWritten(reach(3, 0).furthest, '599.5 ms')
    // The piece out: at the step before, Spray does nothing and every grain reads Time behind.
    const before = reach(2, 0)
    expect(matchesWritten(before.furthest, '599.5 ms')).toBe(false)
    expect(before.furthest).toBeCloseTo(350, 2)
    expect(before.nearest).toBeCloseTo(350, 2)
  })

  it('step 5: with Pitch at +12 semitones a 440 Hz sine comes out strongest at 880 Hz, of every semitone from 110 Hz to 7 kHz (claim build-pitch); with the piece out it is strongest at 440 Hz', async () => {
    const grain = await lab(NAME)
    const tone = sine(440, 0.5, seconds(4))
    const values = { pitch: 12, density: 4 }
    const built = (build: number) => tapOf(grain.render(tone, { ...values, build }), 'built')
    const up = strongest(built(4), seconds(1), seconds(3), SEMITONES)
    say('step 5: the built sound is strongest at', up.toFixed(1), 'Hz')
    expectWritten(up, '880 Hz')
    // The piece out: at the step before, Pitch does nothing.
    const stays = strongest(built(3), seconds(1), seconds(3), SEMITONES)
    say('step 4: the built sound is strongest at', stays.toFixed(1), 'Hz')
    expectWritten(stays, '440 Hz')
    expect(matchesWritten(stays, '880 Hz')).toBe(false)
  })

  it('step 6: at a Feedback of 0.5, Time 500 ms, Size 100 ms and Density 2 each repeat of a short note comes back 6.1 dB under the last (claim build-repeats); with the piece out there is one repeat and no second', async () => {
    const grain = await lab(NAME)
    const values = { time: 500, feedback: 0.5, size: 100, density: 2 }
    const built = (build: number) =>
      tapOf(grain.render(burst(seconds(4)), { ...values, build }), 'built')
    const steps = repeatSteps(built(5))
    say(
      'step 6: each repeat under the last:',
      steps.map((v) => v.toFixed(2)),
      'dB',
    )
    for (const step of steps) expectWritten(step, '6.1 dB')
    // The piece out: at the step before, nothing comes round again.
    const before = repeatSteps(built(4), 1)[0]!
    say('step 5: the second repeat under the first:', before.toFixed(1), 'dB')
    expect(matchesWritten(before, '6.1 dB')).toBe(false)
    expect(before).toBeGreaterThan(100)
  })

  // ---- the stages of the device ---------------------------------------------------------------

  it('makes one grain of what it read times its window, more than 130 dB under the grain, at any speed, direction and shape (claim one-grain)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(2))
    const settings = [
      {},
      { pitch: 12 },
      { pitch: -12, reverse: 1 },
      { shape: 0.3 },
      { size: 500, pitch: 24 },
    ]
    for (const values of settings) {
      const out = grain.render(guitar, values)
      const piece = left(out.taps.piece)
      const window = left(out.taps.window)
      const product = piece.map((v, i) => v * window[i]!)
      const miss = differenceDb(left(out.taps.grain), product)
      say(
        'one grain against piece × window',
        values,
        miss.toFixed(1),
        'dB over',
        piece.length,
        'samples',
      )
      expect(piece.length).toBeGreaterThan(400)
      expectWritten(-miss, 'more than 130 dB')
    }
    // The grain the lesson looks at is one of the device's own, and the picture marks it.
    const marked = grainsOf(grain.render(guitar, {}).taps.cloud).filter((g) => g.mark === 1)
    expect(marked.length).toBe(1)
    expect(marked[0]!.start).toBeGreaterThanOrEqual(1)
    expect(marked[0]!.start).toBeLessThan(1.12)
  })

  it('opens the window as the kit writes it: a Hann bell at Shape 1, and at its least a flat top that is fully open for 98 % of the grain (claim shape-least)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const bell = left(grain.render(guitar, {}).taps.window)
    const n = bell.length
    for (const k of [0, 100, n / 4, n / 2, n - 300]) {
      expect(bell[k]!).toBeCloseTo(0.5 - 0.5 * Math.cos((2 * Math.PI * k) / n), 3)
    }
    const flat = left(grain.render(guitar, { shape: 0.02 }).taps.window)
    // Fully open from a hundredth of the way in to a hundredth from the end.
    const open = flat.reduce((count, v) => count + (v === 1 ? 1 : 0), 0)
    say('Shape 0.02: fully open for', ((100 * open) / flat.length).toFixed(2), '% of the grain')
    expectWritten((100 * open) / flat.length, '98 %')
    expect(flat[0]).toBe(0)
  })

  it('leaves a cut piece of a 440 Hz sine 65 dB under its peak between 8 and 12 kHz (claim click), and under the window less than −135 dB a bin there (claim windowed)', async () => {
    const grain = await lab(NAME)
    const tone = sine(440, 0.5, seconds(4))
    const out = grain.render(tone, {})
    const cut = left(out.taps.cutSpectrum)
    const windowed = left(out.taps.grainSpectrum)
    const top = most(Array.from(cut))
    const cutHigh = meanDb(cut, 8000, 12_000)
    const windowedHigh = meanDb(windowed, 8000, 12_000)
    say(
      'cut piece: peak',
      top.toFixed(1),
      'dB, 8 to 12 kHz',
      cutHigh.toFixed(1),
      'dB; windowed',
      windowedHigh.toFixed(1),
    )
    expectWritten(top - cutHigh, '65 dB')
    expectWritten(windowedHigh, 'under −135 dB')
    // The kit's least Shape is between the two.
    const flat = meanDb(left(grain.render(tone, { shape: 0.02 }).taps.grainSpectrum), 8000, 12_000)
    expect(flat).toBeLessThan(cutHigh - 30)
    expect(flat).toBeGreaterThan(windowedHigh)
  })

  it('starts 40 grains in four seconds at Size 100 ms and Density 1, 80 at 2, 160 at 4: doubling Density doubles the count (claim count-doubles)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const count = (density: number, size = 100) =>
      grain.render(guitar, { size, density }).taps.cloud!.columns
    const counts = [1, 2, 4, 8].map((density) => count(density))
    say('grains in 4 s at Size 100 ms, Density 1, 2, 4, 8:', counts)
    expectWritten(counts[0]!, '40')
    expectWritten(counts[1]!, '80')
    expectWritten(counts[2]!, '160')
    expectWritten(counts[3]!, '320')
    // And at the size the lab starts on, where the wait is not a whole number of grains to the loop.
    say('grains in 4 s at the starting values:', count(1, 120))
    expect(Math.abs(count(2, 120) - 2 * count(1, 120))).toBeLessThanOrEqual(1)
    expect(Math.abs(count(4, 120) - 2 * count(2, 120))).toBeLessThanOrEqual(1)
  })

  it('waits Size / Density between grains that read the same sound, 25 ms at Size 100 ms and Density 4 (claim steady-wait); once they do not, over the eight dice the shortest wait is 12.5 ms and the longest 37.5 ms (claim wait-range)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const steady = waitsMs(grainsOf(grain.render(guitar, { size: 100, density: 4 }).taps.cloud))
    expectWritten(least(steady), '25 ms')
    expectWritten(most(steady), '25 ms')
    expect(least(steady)).toBeCloseTo(25, 3)
    expect(most(steady)).toBeCloseTo(25, 3)
    for (const values of [{ pitch: 12 }, { spray: 0.5 }, { pitchSpray: 0.5 }, { reverse: 1 }]) {
      let shortest = Infinity
      let longest = 0
      for (const dice of DICE) {
        const loose = waitsMs(
          grainsOf(grain.render(guitar, { size: 100, density: 4, dice, ...values }).taps.cloud),
        )
        // On every one of the dice: never under half, never over one and a half and a sample.
        expect(least(loose)).toBeGreaterThanOrEqual(12.5)
        expect(most(loose)).toBeLessThanOrEqual(37.5 + 1000 / RATE + 1e-6)
        shortest = Math.min(shortest, least(loose))
        longest = Math.max(longest, most(loose))
      }
      say(
        'waits at',
        values,
        'over the eight dice:',
        shortest.toFixed(3),
        'to',
        longest.toFixed(3),
        'ms',
      )
      expectWritten(shortest, '12.5 ms')
      expectWritten(longest, '37.5 ms')
    }
  })

  it('reads the device’s own counter to its next grain: with steady grains at Size 100 ms and Density 4 it comes down from just under 25 ms to nothing, once for each grain', async () => {
    const grain = await lab(NAME)
    const out = grain.render(await benchSource('guitar', seconds(4)), { size: 100, density: 4 })
    const wait = tapOf(out, 'wait')
    // The tap is kept once every few samples, so its highest point is within a third of a
    // millisecond of the whole wait.
    expect(most(Array.from(wait))).toBeLessThan(25)
    expect(most(Array.from(wait))).toBeGreaterThan(24.6)
    expect(least(Array.from(wait))).toBeLessThan(0.4)
    let teeth = 0
    for (let k = 1; k < wait.length; k += 1) if (wait[k]! > wait[k - 1]!) teeth += 1
    const started = out.taps.cloud!.columns
    expect(started).toBe(160)
    expect(Math.abs(teeth - started)).toBeLessThanOrEqual(1)
  })

  it('keeps the pool far from full: at Density 8 with the waits scattered, 11 grains at once of its 20 with the device’s own dice, and never more than 12 on any of the eight (claim most-grains)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const counts = DICE.map((dice) =>
      mostAtOnce(
        grainsOf(grain.render(guitar, { size: 100, density: 8, pitch: 12, dice }).taps.cloud),
      ),
    )
    say('most grains at once at Density 8, scattered, on each of the dice:', counts)
    expectWritten(counts[0]!, '11')
    for (const count of counts) expectWritten(count, 'at most 12')
  })

  it('at Density 1 the windows stand end to end, their sum falling to nothing and rising to 1.63 (claim bells-peak), and the grains are the recording, 250 ms late, times that sum: more than 130 dB under (claim grain-in-device)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const out = grain.render(guitar, { density: 1, time: 250 })
    const cover = left(out.taps.cover)
    const top = most(Array.from(cover))
    const low = least(Array.from(cover))
    say('Density 1: the windows’ sum runs from', low.toFixed(4), 'to', top.toFixed(4))
    expectWritten(top, '1.63')
    expect(top).toBeCloseTo(Math.sqrt(8 / 3), 3)
    expect(low).toBeLessThan(0.001)
    // Sample for sample where the window's sum was kept, one point in sixteen.
    const lag = seconds(0.25)
    const sum = left(out.taps.grains)
    const recorded = left(out.taps.recorded)
    let diff = 0
    let ref = 0
    for (let k = (lag + FADE) / 16; k < cover.length; k += 1) {
      const expected = recorded[16 * k - lag]! * cover[k]!
      diff += (sum[16 * k]! - expected) ** 2
      ref += expected ** 2
    }
    const miss = 10 * Math.log10(Math.max(diff / ref, 1e-14))
    say(
      'Density 1: grains against the recording 250 ms late × the windows’ sum:',
      miss.toFixed(1),
      'dB',
    )
    expectWritten(-miss, 'more than 130 dB')
  })

  it('from Density 2 up, whole, the grains add up to the recording, 250 ms late: more than 85 dB under it on the guitar (claim plain-delay)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    for (const density of [2, 3, 4, 8]) {
      const out = grain.render(guitar, { density, time: 250 })
      const miss = againstEarlier(left(out.taps.grains), left(out.taps.recorded), seconds(0.25))
      const cover = left(out.taps.cover).subarray(FADE / 16)
      say('Density', density, 'grains against the recording 250 ms late:', miss.toFixed(2), 'dB')
      expectWritten(-miss, 'more than 85 dB')
      expect(most(Array.from(cover, (v) => Math.abs(v - 1)))).toBeLessThan(1e-4)
    }
    // Between whole numbers the sum ripples and the delay is no longer plain.
    const between = grain.render(guitar, { density: 2.5, time: 250 })
    expect(
      againstEarlier(left(between.taps.grains), left(between.taps.recorded), seconds(0.25)),
    ).toBeGreaterThan(-40)
  })

  it('holds the level of white noise from Density 1 to 8, at Pitch 0 and an octave up, on every one of the eight dice: less than 1 dB from what was recorded (claim level-holds)', async () => {
    const grain = await lab(NAME)
    const hiss = noise(0.25, seconds(4))
    let worst = 0
    for (const pitch of [0, 12]) {
      for (const density of [1, 2, 4, 8]) {
        // At Pitch 0 the grains are steady and the dice change nothing: one of them is all.
        for (const dice of pitch === 0 ? [0] : DICE) {
          const out = grain.render(hiss, { pitch, density, dice })
          const change = gainToDb(rms(left(out.taps.grains)) / rms(left(out.taps.recorded)))
          say(
            'noise, Pitch',
            pitch,
            'Density',
            density,
            'Dice',
            dice + 1,
            'grains against the recording:',
            change.toFixed(3),
            'dB',
          )
          worst = Math.max(worst, Math.abs(change))
        }
      }
    }
    say('the furthest the level moved:', worst.toFixed(3), 'dB')
    expectWritten(worst, 'less than 1 dB')
  })

  it('loses more than 5 dB of white noise at Density 4 when the grains are a fiftieth of a semitone off pitch, with the device’s own dice: the guess of how alike they are is made for duller sound (claim level-model)', async () => {
    const grain = await lab(NAME)
    const result = await played(grain, 'dip')
    const change = gainToDb(rms(tapOf(result, 'grains')) / rms(tapOf(result, 'recorded')))
    say('white noise, Pitch 0.02, Density 4:', change.toFixed(2), 'dB')
    expectWritten(-change, 'more than 5 dB')
    // On pitch, nothing is lost.
    const on = await played(grain, 'dip', { pitch: 0 })
    expect(Math.abs(gainToDb(rms(tapOf(on, 'grains')) / rms(tapOf(on, 'recorded'))))).toBeLessThan(
      0.1,
    )
  })

  it('places a grain so that its middle is 350 ms old at a Time of 350 ms: at +12 semitones and Size 100 ms it starts 50 ms further back and reads at twice the speed (claim middle)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const up = grainsOf(
      grain.render(guitar, { pitch: 12, size: 100, time: 350, density: 2 }).taps.cloud,
    )
    for (const one of up) {
      expect(one.rate).toBeCloseTo(2, 5)
      expectWritten(one.behind - 350, '50 ms')
      // Half way through, it has read 100 ms of the ring in 50 ms: 350 ms behind.
      expectWritten(one.middle, '350 ms')
      expect(one.middle).toBeCloseTo(350, 2)
    }
    const down = grainsOf(
      grain.render(guitar, { pitch: -12, size: 100, time: 350, density: 2 }).taps.cloud,
    )
    expect(down[0]!.rate).toBeCloseTo(0.5, 5)
    expect(down[0]!.behind).toBeCloseTo(325, 2)
    // Backwards at speed 1: it starts 100 ms nearer the write point and falls behind at twice real time.
    const back = grainsOf(
      grain.render(guitar, { reverse: 1, size: 100, time: 350, density: 2 }).taps.cloud,
    )
    expect(back[0]!.rate).toBeCloseTo(-1, 5)
    expect(back[0]!.behind).toBeCloseTo(250, 2)
    expect(back[0]!.middle).toBeCloseTo(350, 2)
  })

  it('will not let a fast grain reach the write point: at Time 10 ms, Size 500 ms and +12 semitones the grains start 500.08 ms behind (claim time-floor) and their middles are 250 ms old, not 10 (claim floor-middle)', async () => {
    const grain = await lab(NAME)
    const all = grainsOf((await played(grain, 'floor')).taps.cloud)
    say(
      'Time 10 ms, Size 500 ms, +12: grains start',
      all[0]!.behind.toFixed(3),
      'ms behind; middle',
      all[0]!.middle.toFixed(3),
    )
    expect(all.length).toBeGreaterThan(10)
    for (const one of all) {
      expectWritten(one.behind, '500.08 ms')
      expectWritten(one.middle, '250 ms')
      // Its last sample is read 4 samples behind the write point, and no nearer.
      expect(one.behind - (one.rate - 1) * one.length * 1000).toBeCloseTo(4000 / RATE, 2)
    }
  })

  it('throws grains at least 350 ms and at most 600 ms behind at Time 350 ms and Spray 0.5 (claim spray-reach), and at most 3 semitones either way at a Pitch Spray of 0.5 (claim pitch-spray-reach), on every one of the eight dice', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    for (const dice of DICE) {
      const late = grainsOf(
        grain.render(guitar, { spray: 0.5, size: 100, density: 4, time: 350, dice }).taps.cloud,
      )
      const behind = late.map((g) => g.behind)
      say(
        'Dice',
        dice + 1,
        'Spray 0.5: grains read from',
        least(behind).toFixed(1),
        'to',
        most(behind).toFixed(1),
        'ms behind',
      )
      expectWritten(least(behind), 'at least 350 ms')
      expectWritten(most(behind), 'at most 600 ms')
      // And they use the room: within 15 ms of each end.
      expect(least(behind)).toBeLessThan(365)
      expect(most(behind)).toBeGreaterThan(585)
      const detuned = grainsOf(
        grain.render(guitar, { pitchSpray: 0.5, size: 100, density: 4, dice }).taps.cloud,
      )
      const semitones = detuned.map((g) => 12 * Math.log2(g.rate))
      say(
        'Dice',
        dice + 1,
        'Pitch Spray 0.5: from',
        least(semitones).toFixed(2),
        'to',
        most(semitones).toFixed(2),
        'semitones',
      )
      expectWritten(most(semitones), 'at most 3 semitones')
      expectWritten(-least(semitones), 'at most 3 semitones')
      expect(most(semitones)).toBeGreaterThan(2.7)
      expect(least(semitones)).toBeLessThan(-2.7)
    }
  })

  it('gives each grain a number for its place that is its own: the same Dice makes the same grains, another makes others, and over a loop the throws fill 0 to 1 (claim throws)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const values = { spray: 0.5, size: 100, density: 4, time: 350 }
    const first = grain.render(guitar, values)
    const again = grain.render(guitar, values)
    expect(Array.from(left(again.taps.cloud))).toEqual(Array.from(left(first.taps.cloud)))
    expect(Array.from(left(again.taps.out))).toEqual(Array.from(left(first.taps.out)))
    const thrown = Array.from(left(first.taps.throws))
    say(
      'the throws for place, Dice 1:',
      thrown.length,
      'of them, from',
      least(thrown).toFixed(4),
      'to',
      most(thrown).toFixed(4),
      'mean',
      (thrown.reduce((a, b) => a + b, 0) / thrown.length).toFixed(3),
    )
    expect(least(thrown)).toBeGreaterThanOrEqual(0)
    expect(most(thrown)).toBeLessThan(1)
    expect(least(thrown)).toBeLessThan(0.05)
    expect(most(thrown)).toBeGreaterThan(0.95)
    // Each grain's middle is Time and its throw of the quarter second behind.
    const grains = grainsOf(first.taps.cloud)
    grains.forEach((one, k) => expect(one.middle).toBeCloseTo(350 + 250 * thrown[k]!, 1))
    for (const dice of DICE.slice(1)) {
      const other = Array.from(left(grain.render(guitar, { ...values, dice }).taps.throws))
      expect(other.slice(0, 8)).not.toEqual(thrown.slice(0, 8))
    }
  })

  it('brings a 440 Hz sine out at 880 Hz with the Pitch at +12 semitones: one grain of it, looked at alone, crosses zero 880 times a second, and the output is strongest at that semitone (claim octave)', async () => {
    const grain = await lab(NAME)
    const result = grain.render(sine(440, 0.5, seconds(4)), { pitch: 12, density: 4 })
    const hz = crossingsHz(tapOf(result, 'grain'))
    say('440 Hz at +12: the grain looked at is a sine at', hz.toFixed(3), 'Hz')
    expectWritten(hz, '880 Hz')
    expect(hz).toBeCloseTo(880, 1)
    expect(strongest(tapOf(result, 'out'), seconds(1), seconds(3), SEMITONES)).toBeCloseTo(880, 3)
  })

  it('draws three lines from a sine at Size 20 ms and Density 1: a grain every 20 ms puts a line 50 Hz either side, 6 dB under the middle one (claim three-lines)', async () => {
    const grain = await lab(NAME)
    const out = grain.render(sine(440, 0.5, seconds(1)), { size: 20, density: 1 })
    for (const tap of [out.taps.linesDevice, out.taps.linesSteady]) {
      const middle = lineDb(tap, 0)
      const below = lineDb(tap, -50)
      const above = lineDb(tap, 50)
      say(
        'Size 20 ms, Density 1: lines at',
        lineHz(tap, -50).toFixed(2),
        lineHz(tap, 0).toFixed(2),
        lineHz(tap, 50).toFixed(2),
        'Hz:',
        below.toFixed(2),
        middle.toFixed(2),
        above.toFixed(2),
        'dB',
      )
      expect(middle).toBeCloseTo(-1.76, 0)
      expectWritten(lineHz(tap, 50), '50 Hz')
      expectWritten(-lineHz(tap, -50), '50 Hz')
      expectWritten(middle - below, '6 dB')
      expectWritten(middle - above, '6 dB')
      // Nothing between the lines, and nothing at twice the rate.
      expect(bandDb(tap, 15, 35)).toBeLessThan(-50)
      expect(bandDb(tap, -35, -15)).toBeLessThan(-50)
      expect(lineDb(tap, 100)).toBeLessThan(-50)
      expect(lineDb(tap, -100)).toBeLessThan(-50)
    }
    // Other rates, other spacings: 25 grains a second, and 75 from a Density of 1.5.
    const slower = grain.render(sine(440, 0.5, seconds(1)), { size: 40, density: 1 })
    expect(lineDb(slower.taps.linesDevice, 25)).toBeGreaterThan(-9)
    expect(lineDb(slower.taps.linesDevice, 50)).toBeLessThan(-50)
    const between = grain.render(sine(440, 0.5, seconds(1)), { size: 20, density: 1.5 })
    expect(lineDb(between.taps.linesDevice, 75)).toBeGreaterThan(-20)
    expect(lineDb(between.taps.linesDevice, 50)).toBeLessThan(-50)
  })

  it('draws one line at Density 2: the windows add up to one and what is left beside the sine is 55.6 dB under it (claim no-lines)', async () => {
    const grain = await lab(NAME)
    const out = grain.render(sine(440, 0.5, seconds(1)), { size: 20, density: 2 })
    const beside = Math.max(
      bandDb(out.taps.linesDevice, -250, -8),
      bandDb(out.taps.linesDevice, 8, 250),
    )
    const middle = lineDb(out.taps.linesDevice, 0)
    say(
      'Size 20 ms, Density 2: the sine',
      middle.toFixed(2),
      'dB, all else',
      beside.toFixed(2),
      'dB',
    )
    expect(middle).toBeCloseTo(0, 0)
    expectWritten(middle - beside, '55.6 dB')
  })

  it('locks a sine shifted seven semitones to the grain rate when the starts are steady, at Size 100 ms and Density 4: lines 40 Hz apart, 18 Hz under and 22 Hz over the pitch (claim comb-lines), all of it 23 dB down (claim comb-level)', async () => {
    const grain = await lab(NAME)
    const out = grain.render(sine(440, 0.5, seconds(1)), {
      pitch: 7,
      size: 100,
      density: 4,
      scatter: 0,
    })
    const tap = out.taps.linesSteady
    // 1 kHz up seven semitones is 1498.3 Hz; the lines stand at 1000 + 40 m: 1480 and 1520.
    const under = lineDb(tap, 1480 - 1498.31)
    const over = lineDb(tap, 1520 - 1498.31)
    const onPitch = bandDb(tap, -9, 9)
    const all = bandDb(tap, -250, 250)
    const underHz = -lineHz(tap, 1480 - 1498.31)
    const overHz = lineHz(tap, 1520 - 1498.31)
    say(
      'steady, +7, 40 grains a second: lines',
      underHz.toFixed(2),
      'Hz under and',
      overHz.toFixed(2),
      'Hz over,',
      under.toFixed(1),
      over.toFixed(1),
      'dB; within 9 Hz of the pitch',
      onPitch.toFixed(1),
      'dB; in all',
      all.toFixed(2),
      'dB',
    )
    expectWritten(underHz, '18 Hz')
    expectWritten(overHz, '22 Hz')
    expectWritten(underHz + overHz, '40 Hz')
    expect(onPitch).toBeLessThan(under - 20)
    // The two lines are all there is.
    expectWritten(-all, '23 dB')
    expect(10 ** (under / 10) + 10 ** (over / 10)).toBeGreaterThan(0.95 * 10 ** (all / 10))
    // A control on the page stops a hair off these values (Size 100.2 ms, Pitch 7.008, Density
    // 4.003). The lines then stand elsewhere against the gaps in the bell's spectrum, and the
    // sine is still all but gone.
    const beside = grain.render(sine(440, 0.5, seconds(1)), {
      pitch: 7.008,
      size: 100.2,
      density: 4.003,
      scatter: 0,
    }).taps.linesSteady
    say('steady, at the page’s own values: in all', bandDb(beside, -250, 250).toFixed(1), 'dB')
    expect(bandDb(beside, -250, 250)).toBeLessThan(-20)
  })

  it('lands a shifted sine on its pitch when the starts are scattered: less than 1 % of its power further than 20 Hz from the pitch, from the lab’s pool and from the device, on every one of the eight dice (claim scattered)', async () => {
    const grain = await lab(NAME)
    for (const dice of DICE) {
      const out = grain.render(sine(440, 0.5, seconds(1)), {
        pitch: 7,
        size: 100,
        density: 4,
        scatter: 1,
        dice,
      })
      for (const tap of [out.taps.linesSteady, out.taps.linesDevice]) {
        const near = bandDb(tap, -20, 20)
        const all = bandDb(tap, -250, 250)
        const outside = 1 - 10 ** ((near - all) / 10)
        say(
          'Dice',
          dice + 1,
          'scattered, +7: in all',
          all.toFixed(2),
          'dB;',
          (100 * outside).toFixed(3),
          '% of it further than 20 Hz from the pitch',
        )
        // As much power as went in, within 2 dB: a second and a half of grains thrown at random.
        expect(Math.abs(all)).toBeLessThan(2)
        expectWritten(100 * outside, 'less than 1 %')
      }
    }
  })

  it('makes the lab’s pool the device’s own when the device’s grains are steady and the lab’s window is the bell: the two sums differ by more than 130 dB under (claim same-pool)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(2))
    for (const density of [1, 2.5, 4]) {
      const out = grain.render(guitar, { density, scatter: 0 })
      for (const c of [0, 1]) {
        const miss = differenceDb(
          out.taps.steady!.channels_data[c]!,
          out.taps.grains!.channels_data[c]!,
        )
        say(
          'Density',
          density,
          'channel',
          c,
          'the lab’s pool against the device’s grains:',
          miss.toFixed(1),
          'dB',
        )
        expectWritten(-miss, 'more than 130 dB')
      }
    }
    // With the device's grains scattered and the lab's steady, they are two different sounds.
    const apart = grain.render(guitar, { pitch: 7, density: 4, scatter: 0 })
    expect(differenceDb(left(apart.taps.steady), left(apart.taps.grains))).toBeGreaterThan(-10)
    // And with the lab's pieces cut square they are two different sounds again.
    const square = grain.render(guitar, { density: 2, shape: 0.02 })
    expect(differenceDb(left(square.taps.steady), left(square.taps.grains))).toBeGreaterThan(-60)
  })

  it('low-passes what it records to what the pitch can carry: at +12 semitones white noise is 3 dB down at 10.8 kHz and 10 dB down at 15 kHz (claim guard)', async () => {
    const grain = await lab(NAME)
    const hiss = noise(0.25, seconds(4))
    const drop = (hz: number) => {
      const before = meanDb(grain.spectrum('in'), hz * 0.97, hz * 1.03)
      return meanDb(grain.spectrum('recorded'), hz * 0.97, hz * 1.03) - before
    }
    grain.render(hiss, { pitch: 12 })
    say(
      '+12: recorded against the input at 10.8 kHz',
      drop(10_800).toFixed(2),
      'dB, at 15 kHz',
      drop(15_000).toFixed(2),
      'dB',
    )
    expectWritten(-drop(10_800), '3 dB')
    expectWritten(-drop(15_000), '10 dB')
    // Down, or not at all, nothing is taken.
    for (const pitch of [0, -12]) {
      grain.render(hiss, { pitch })
      expect(Math.abs(drop(15_000))).toBeLessThan(0.2)
    }
  })

  it('brings each repeat of a short 220 Hz note back 6.1 dB under the last at a Feedback of 0.5, Time 500 ms, Size 100 ms and Density 2 (claim repeat-level)', async () => {
    const grain = await lab(NAME)
    const out = left(
      grain.render(burst(seconds(4)), { time: 500, feedback: 0.5, size: 100, density: 2 }).taps.out,
    )
    const steps = repeatSteps(out)
    say(
      'each repeat under the last:',
      steps.map((v) => v.toFixed(3)),
      'dB',
    )
    for (const step of steps) expectWritten(step, '6.1 dB')
  })

  it('shifts every repeat again: at Time 500 ms, Size 100 ms, Density 4 and a Feedback of 0.5 a short 220 Hz note at +12 semitones comes back at 440 Hz, 880 Hz and 1,760 Hz, to the nearest semitone (claim octave-stair)', async () => {
    const grain = await lab(NAME)
    const out = left(
      grain.render(burst(seconds(4)), {
        time: 500,
        pitch: 12,
        feedback: 0.5,
        size: 100,
        density: 4,
      }).taps.out,
    )
    // Every semitone from 110 Hz to 7 kHz.
    const candidates = Array.from({ length: 73 }, (_, k) => 110 * 2 ** (k / 12))
    const found = [1, 2, 3].map((n) => {
      const from = seconds(n * 0.5 + 0.03)
      return strongest(out, from, from + seconds(0.2), candidates)
    })
    say(
      'the three repeats are strongest at',
      found.map((hz) => hz.toFixed(1)),
      'Hz',
    )
    expectWritten(found[0]!, '440 Hz')
    expectWritten(found[1]!, '880 Hz')
    expectWritten(found[2]!, '1,760 Hz')
  })

  it('adds the grains up again from the pool to the device’s own output: more than 130 dB under it (claim rebuilt)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(2))
    const drums = await benchSource('drums', seconds(2))
    for (const [source, values] of [
      [guitar, {}],
      [guitar, DEFAULTS],
      [drums, { ...DEFAULTS, reverse: 0.5 }],
      [guitar, { size: 10, density: 8, pitch: -24, feedback: 0.9 }],
    ] as const) {
      const out = grain.render(source, values)
      say('rebuilt', out.checks.rebuilt, 'dB; rule', out.checks.rule, 'samples')
      expectWritten(-out.checks.rebuilt!, 'more than 130 dB')
    }
  })

  it('works out every grain’s start, speed, length, gain and wait as the device does: 0 samples between them (claim rule)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(2))
    const drums = await benchSource('drums', seconds(2))
    for (const [source, values] of [
      [guitar, {}],
      [
        guitar,
        { spray: 0.15, pitch: 12, pitchSpray: 0.08, density: 4, feedback: 0.45, spread: 0.6 },
      ],
      [
        drums,
        {
          spray: 1,
          pitch: -7,
          pitchSpray: 1,
          density: 8,
          reverse: 0.5,
          spread: 1,
          size: 37,
          time: 10,
          dice: 5,
        },
      ],
      [guitar, { pitch: 24, reverse: 1, size: 500, time: 10 }],
    ] as const) {
      const rule = grain.render(source, values).checks.rule!
      expectWritten(rule, '0 samples')
      expect(rule).toBe(0)
    }
  })

  it('stays asleep on silence: no grain starts and every sound is exact silence, the built one too', async () => {
    const grain = await lab(NAME)
    const out = grain.render(silence(seconds(1)), { pitch: 12, feedback: 0.5, build: 5 })
    for (const id of ['recorded', 'grains', 'out', 'steady', 'built']) {
      expect(out.taps[id]!.channels_data[0]!.every((v) => v === 0)).toBe(true)
    }
    expect(out.taps.cloud!.length).toBe(0)
  })

  it('plays into the device only as much of the pass it throws away as the device can remember: the loop played twice over as one loop of eight seconds ends as the loop of four does', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const twice: Source = {
      left: Float32Array.from([...guitar.left, ...guitar.left]),
      right: Float32Array.from([...guitar.right, ...guitar.right]),
    }
    // Repeats 50 ms apart, each half the last: 100 dB down in under a second. The four-second
    // render plays the device the last two and a half seconds of the pass it throws away; in
    // the eight-second render the same four seconds follow four more that were played in full.
    const values = { time: 50, size: 20, density: 2, feedback: 0.5 }
    const short = tapOf(grain.render(guitar, values), 'out')
    const long = tapOf(grain.render(twice, values), 'out')
    let diff = 0
    let ref = 0
    for (let i = FADE; i < seconds(4); i += 1) {
      diff += (short[i]! - long[seconds(4) + i]!) ** 2
      ref += short[i]! ** 2
    }
    const miss = 10 * Math.log10(Math.max(diff / ref, 1e-14))
    say(
      'the loop of four seconds against the second half of the loop of eight:',
      miss.toFixed(1),
      'dB',
    )
    expect(miss).toBeLessThan(-70)
  })

  // ---- the named sets: what each card plays ---------------------------------------------------

  it('renders every named set on its own source, finite, heard, and with its loudest sample under full scale', async () => {
    const grain = await lab(NAME)
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = await played(grain, name)
      const sound = set.tap ?? 'out'
      const data = tapOf(result, sound)
      say(
        'set',
        name,
        'on',
        set.source,
        ':',
        sound,
        levelOf(result, sound).toFixed(1),
        'dB RMS, peak',
        gainToDb(peak(data)).toFixed(1),
        'dB;',
        result.taps.cloud!.columns,
        'grains, at most',
        mostAtOnce(grainsOf(result.taps.cloud)),
        'at once;',
        result.ms.toFixed(0),
        'ms',
      )
      expect(
        data.every((v) => Number.isFinite(v)),
        name,
      ).toBe(true)
      // "locked" is the fault its card is about: the note all but goes, and its card says so.
      if (name !== 'locked') {
        expect(levelOf(result, sound), `${name} is heard`).toBeGreaterThan(-40)
      }
      expect(gainToDb(peak(data)), `${name} fits`).toBeLessThan(0)
      expect(set.values && 'build' in set.values, `${name} leaves the build alone`).toBeFalsy()
    }
  })

  it('with steady starts a 440 Hz sine shifted seven semitones comes out 31 dB under the same note with the starts scattered and the device’s own dice, and more than 30 dB under it on every one of the eight, at Size 100 ms and Density 4 (claim fault-locked)', async () => {
    const grain = await lab(NAME)
    const locked = levelOf(await played(grain, 'locked'), 'steady')
    const levels = []
    for (const dice of DICE)
      levels.push(levelOf(await played(grain, 'unlocked', { dice }), 'steady'))
    say(
      'the lab’s pool on the sine, +7: steady',
      locked.toFixed(2),
      'dB; scattered, on each of the dice',
      levels.map((v) => v.toFixed(2)),
    )
    expectWritten(levels[0]! - locked, '31 dB')
    for (const level of levels) expectWritten(level - locked, 'more than 30 dB')
  })

  it('opens on 33 grains in the loop, one every 120 ms, each reading 250 ms behind the write point (claim open-count)', async () => {
    const grain = await lab(NAME)
    const all = grainsOf(grain.render(await benchSource('guitar', seconds(4)), {}).taps.cloud)
    expectWritten(all.length, '33')
    const waits = waitsMs(all)
    expectWritten(least(waits), '120 ms')
    expectWritten(most(waits), '120 ms')
    for (const one of all) expectWritten(one.behind, '250 ms')
  })

  it('the wash on the pad: with the device’s own dice 79 grains in the loop and at most 8 at once, their middles at least 200 ms and at most 840 ms behind on every one of the eight dice (claim use-wash)', async () => {
    const grain = await lab(NAME)
    const first = grainsOf((await played(grain, 'wash')).taps.cloud)
    say('wash, Dice 1:', first.length, 'grains, at most', mostAtOnce(first), 'at once')
    expectWritten(first.length, '79')
    expectWritten(mostAtOnce(first), '8')
    for (const dice of DICE) {
      const middles = grainsOf((await played(grain, 'wash', { dice })).taps.cloud).map(
        (g) => g.middle,
      )
      say(
        'wash, Dice',
        dice + 1,
        ': middles from',
        least(middles).toFixed(1),
        'to',
        most(middles).toFixed(1),
        'ms behind',
      )
      expectWritten(least(middles), 'at least 200 ms')
      expectWritten(most(middles), 'at most 840 ms')
    }
  })

  it('the drums thrown about: with the device’s own dice 296 grains of 40 ms in the loop, at most 5 at once (claim use-shatter)', async () => {
    const grain = await lab(NAME)
    const all = grainsOf((await played(grain, 'shatter')).taps.cloud)
    say('shatter, Dice 1:', all.length, 'grains, at most', mostAtOnce(all), 'at once')
    expectWritten(all.length, '296')
    expectWritten(mostAtOnce(all), '5')
    for (const one of all) expectWritten(one.length * 1000, '40 ms')
  })

  it('repeats a fifth apart: on the card’s settings a short 220 Hz note comes back strongest at 330 Hz and then at 494 Hz, of every semitone (claim way-fifth)', async () => {
    const grain = await lab(NAME)
    const { values } = resolveSet(grain.description, settings.sets.fifth!)
    const out = tapOf(grain.render(burst(seconds(4)), values), 'out')
    const found = [1, 2].map((n) => {
      const from = seconds(n * 0.375 + 0.03)
      return strongest(out, from, from + seconds(0.2), SEMITONES)
    })
    say(
      'fifths: the first two repeats are strongest at',
      found.map((hz) => hz.toFixed(2)),
      'Hz',
    )
    expectWritten(found[0]!, '330 Hz')
    expectWritten(found[1]!, '494 Hz')
  })

  it('grains you can count: on the pad at Density 1 the windows’ sum falls to nothing 33 times in the loop, and at Density 2 it stays at one (claim fault-single)', async () => {
    const grain = await lab(NAME)
    const cover = tapOf(await played(grain, 'single'), 'cover')
    // A gap is a stretch where the sum is under a hundredth: count the stretches.
    let gaps = 0
    for (let k = 1; k < cover.length; k += 1)
      if (cover[k]! < 0.01 && cover[k - 1]! >= 0.01) gaps += 1
    say('single: the windows’ sum falls under a hundredth', gaps, 'times')
    expectWritten(gaps, '33')
    const closed = tapOf(await played(grain, 'closed'), 'cover').subarray(FADE / 16)
    expect(most(Array.from(closed, (v) => Math.abs(v - 1)))).toBeLessThan(1e-4)
  })

  it('the card of short grains starts 200 grains in the loop, one every 20 ms (claim way-rattle), and the card of a plain repeat is the recording again (set echo)', async () => {
    const grain = await lab(NAME)
    const rattle = await played(grain, 'rattle')
    const short = grainsOf(rattle.taps.cloud)
    expectWritten(short.length, '200')
    for (const wait of waitsMs(short)) expectWritten(wait, '20 ms')
    const echo = await played(grain, 'echo')
    const miss = againstEarlier(tapOf(echo, 'grains'), tapOf(echo, 'recorded'), seconds(0.25))
    expect(miss).toBeLessThan(-80)
  })

  it("starts the page's device table from the device's own defaults: the settings file's defaults, laid over the lab's starting values, are device.json's", async () => {
    const grain = await lab(NAME)
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/grain-delay/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const { values } = resolveSet(grain.description, { values: DEFAULTS })
    // The lab has four controls the device does not: where to look, the lab's own window and
    // scatter, and which dice. They stay where the lab starts them.
    const own = ['look', 'shape', 'scatter', 'dice', 'build']
    const devices = Object.fromEntries(Object.entries(values).filter(([id]) => !own.includes(id)))
    expect(devices).toEqual(Object.fromEntries(device.params.map((one) => [one.key, one.default])))
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(DEFAULTS)) {
      expect(grain.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
  })
})
