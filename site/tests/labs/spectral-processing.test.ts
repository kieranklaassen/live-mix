import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
  click,
  differenceDb,
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  noise,
  peak,
  points,
  RATE,
  rms,
  seconds,
  sine,
  type Source,
} from './support.ts'

const NAME = 'spectral-processing'
/** Spectral Blur's frame and hop, and its latency: a frame and half a hop. */
const FRAME = 2048
const HOP = 512
const LATENCY = FRAME + HOP / 2
/** Sift's latency: the same, and the four frames it looks ahead. */
const SIFT_LATENCY = LATENCY + 4 * HOP
/** One bin of a frame of 2,048 samples, in hertz. */
const BIN_HZ = RATE / FRAME
/** The device drops a bin under a millionth; as the bar pictures count sizes, that is this. */
const FLOOR_BAR = 1e-6 / (FRAME / 4)
/** The steps of the build part, by the piece each adds. */
const STEP = { split: 0, hold: 1, turn: 2, smear: 3, fall: 4, octave: 5, shape: 6 }
const LOOP = seconds(4)
const SAY = !!process.env.SAY

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings(NAME)!

/**
 * A named set as its card plays it: on its own source, or on `on` where a measurement needs a
 * signal of its own, with `over` laid on its values.
 */
async function played(blur: Lab, name: string, over: Record<string, number> = {}, on?: Source) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(blur.description, set)
  return blur.render(on ?? (await benchSource(source!, LOOP)), { ...values, ...over })
}

const tap = (result: RenderResult, id: string, channel = 0) =>
  result.taps[id]!.channels_data[channel]!

/** A measurement, said aloud when SAY is set: how a number is read before a sentence states it. */
function say<T>(what: string, value: T): T {
  if (SAY) console.log(what, value)
  return value
}

const levelDb = (x: Float32Array, from = 0, to = x.length) => gainToDb(rms(x, from, to))

/**
 * The size of the component at `hz` in a stretch of a sound, in dB where a sine of amplitude 1
 * reads 0: the sum of lesson 05, under a Hann window.
 */
function lineDb(x: Float32Array, hz: number, from: number, to: number): number {
  let re = 0
  let im = 0
  let sum = 0
  const count = to - from
  for (let i = 0; i < count; i += 1) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / count)
    const angle = (2 * Math.PI * hz * i) / RATE
    re += w * x[from + i]! * Math.cos(angle)
    im -= w * x[from + i]! * Math.sin(angle)
    sum += w
  }
  return gainToDb((2 * Math.hypot(re, im)) / sum)
}

/** The frequency of a tone, from its upward zero crossings: how many, over how long. */
function pitchOf(x: Float32Array, from: number, to: number): number {
  let first = -1
  let last = -1
  let count = 0
  for (let i = from + 1; i < to; i += 1) {
    if (x[i - 1]! < 0 && x[i]! >= 0) {
      const at = i - 1 - x[i - 1]! / (x[i]! - x[i - 1]!)
      if (first < 0) first = at
      last = at
      count += 1
    }
  }
  return ((count - 1) * RATE) / (last - first)
}

/** The level of a sound read every `window` samples: the lowest reading, the highest, and how far apart. */
function levels(x: Float32Array, from: number, to: number, window = 2400) {
  let lo = Infinity
  let hi = -Infinity
  for (let at = from; at + window <= to; at += window) {
    const db = levelDb(x, at, at + window)
    lo = Math.min(lo, db)
    hi = Math.max(hi, db)
  }
  return { lo, hi, span: hi - lo }
}

/**
 * How far `out`, taken `delay` samples late, stands from `source`, in dB under it: over the
 * loop but for its first 20 ms, which a tap crossfades into the loop's end.
 */
function lateDifferenceDb(out: Float32Array, source: Float32Array, delay: number): number {
  let diff = 0
  let ref = 0
  for (let i = delay + 960; i < out.length; i += 1) {
    diff += (out[i]! - source[i - delay]!) ** 2
    ref += source[i - delay]! ** 2
  }
  return 10 * Math.log10(Math.max(diff / ref, 1e-14))
}

/** How alike two sounds are over a stretch: 1 the same, 0 nothing in common, -1 upside down. */
function alike(a: Float32Array, b: Float32Array, from: number, to: number): number {
  let ab = 0
  let aa = 0
  let bb = 0
  for (let i = from; i < to; i += 1) {
    ab += a[i]! * b[i]!
    aa += a[i]! ** 2
    bb += b[i]! ** 2
  }
  return ab / Math.sqrt(aa * bb)
}

/** The bars of a bar picture, tallest first, as [bin, size]. */
function tallest(bars: Float32Array, count: number): [number, number][] {
  return Array.from(bars.keys())
    .sort((a, b) => bars[b]! - bars[a]!)
    .slice(0, count)
    .map((k) => [k, bars[k]!])
}

/** Two sources added, sample by sample. */
function both(a: Source, b: Source): Source {
  return {
    left: a.left.map((v, i) => v + b.left[i]!),
    right: a.right.map((v, i) => v + b.right[i]!),
  }
}

/**
 * A 440 Hz tone that is on from 0.05 s to 1 s of the loop and fades in and out over 50 ms, so
 * that nothing in it is a click: what a bin does when its input goes away.
 */
function burst(): Source {
  const tone = sine(440, 0.5, LOOP)
  const gain = (i: number) => {
    const t = i / RATE
    if (t < 0.05 || t >= 1.05) return 0
    if (t < 0.1) return 0.5 - 0.5 * Math.cos((Math.PI * (t - 0.05)) / 0.05)
    if (t < 1.0) return 1
    return 0.5 + 0.5 * Math.cos((Math.PI * (t - 1.0)) / 0.05)
  }
  return {
    left: tone.left.map((v, i) => v * gain(i)),
    right: tone.right.map((v, i) => v * gain(i)),
  }
}

/** The latency a device's manifest states, in samples. */
function statedLatency(device: string): number {
  return (
    JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL(`../../../cpp/devices/${device}/device.json`, import.meta.url)),
        'utf8',
      ),
    ) as { latencySamples: number }
  ).latencySamples
}

/** The sample at which a sound is largest. */
const loudestAt = (x: Float32Array) =>
  x.reduce((best, v, i) => (Math.abs(v) > Math.abs(x[best]!) ? i : best), 0)

describe('the spectral processing lab', () => {
  it('is sound: every tap says something, loops, and every control moves one', async () => {
    const blur = await lab(NAME)
    const source = await benchSource('chords', LOOP)
    const result = blur.render(source, {})
    say('render ms', result.ms)
    // The squared windows add up to one number, and with Tilt and the cuts at rest every bin's gain is 1.
    expectSoundLab(blur, source, result, { quiet: ['windowSum', 'shape'] })
  })

  it('builds the frame a piece at a time, and the whole build is the device', async () => {
    const blur = await lab(NAME)
    const source = await benchSource('chords', LOOP)
    // Freeze on, as the page opens, and every other piece given something to do.
    expectBuild(blur, source, { blur: 0.45, smear: 0.3, shimmer: 0.4, tilt: -2, lowCut: 100 })
  })

  // --- part 1 ------------------------------------------------------------------------------------

  it('plays a chord that is 35 dB down two seconds later, when the next is struck (claim chord-dies)', async () => {
    const chords = (await benchSource('chords', LOOP)).left
    // The loudest 50 ms of the first chord are its first, and the last 50 ms before the second.
    const first = levelDb(chords, 0, seconds(0.05))
    for (let t = 0.05; t < 2; t += 0.05) {
      expect(levelDb(chords, seconds(t), seconds(t + 0.05))).toBeLessThan(first)
    }
    expectWritten(first - levelDb(chords, seconds(1.95), seconds(2)), '35 dB')
    // The second chord is struck two seconds after the first: the level jumps back up there.
    expect(
      levelDb(chords, seconds(2), seconds(2.05)) - levelDb(chords, seconds(1.95), seconds(2)),
    ).toBeGreaterThan(30)
  })

  it('repeats a slice of 2,048 samples, which is 42.7 ms long (claim slice)', async () => {
    const blur = await lab(NAME)
    const result = await played(blur, 'loop')
    const x = tap(result, 'looped')
    // From a second in to the loop's end the slice comes round, sample for sample.
    for (let n = seconds(1); n < seconds(3.9) - FRAME; n += 1) expect(x[n]).toBe(x[n + FRAME])
    // It does not join itself smoothly: once in each turn there is a step from one sample to
    // the next many times the largest anywhere else in the slice.
    const steps = Array.from({ length: FRAME }, (_, n) =>
      Math.abs(x[seconds(1) + n + 1]! - x[seconds(1) + n]!),
    ).sort((a, b) => b - a)
    expect(say('slice step', steps[0]!)).toBeGreaterThan(10 * say('next step', steps[1]!))
    expectWritten((FRAME * 1000) / RATE, '42.7 ms')
    expect(FRAME).toBe(2048)
  })

  it('turns a 440 Hz tone, looped as a slice, into lines 23.4 Hz apart, the strongest at 445.3 Hz and its neighbours 10.7 dB and 14.6 dB under it (claim loop-lines)', async () => {
    const blur = await lab(NAME)
    const result = await played(blur, 'loop', {}, sine(440, 0.5, LOOP))
    const x = tap(result, 'looped')
    const line = (k: number) => lineDb(x, k * BIN_HZ, seconds(2), seconds(3.5))
    let top = 13
    for (let k = 13; k <= 25; k += 1) if (line(k) > line(top)) top = k
    expectWritten(BIN_HZ, '23.4 Hz')
    expectWritten(top * BIN_HZ, '445.3 Hz')
    expectWritten(say('loop below', line(top) - line(top - 1)), '10.7 dB')
    expectWritten(say('loop above', line(top) - line(top + 1)), '14.6 dB')
    // Nothing is left at 440 Hz itself.
    expect(line(top) - lineDb(x, 440, seconds(2), seconds(3.5))).toBeGreaterThan(60)
  })

  it('turns a 440 Hz tone, held as one frame laid down every 512 samples, into 468.75 Hz, the fifth multiple of 93.75 Hz, 5.4 dB quieter (claim stuck-pitch)', async () => {
    const blur = await lab(NAME)
    const tone = sine(440, 0.5, LOOP)
    const result = await played(blur, 'stuck', {}, tone)
    const x = tap(result, 'stuck')
    expect(HOP).toBe(512)
    expectWritten(RATE / HOP, '93.75 Hz')
    expectWritten(say('stuck pitch', pitchOf(x, seconds(2), seconds(3.5))), '468.75 Hz')
    expectWritten(
      say('stuck drop', levelDb(tone.left) - levelDb(x, seconds(2), seconds(3.5))),
      '5.4 dB',
    )
    expect(5 * (RATE / HOP)).toBe(468.75)
    // "A semitone sharp": 110 cents.
    expect(1200 * Math.log2(468.75 / 440)).toBeCloseTo(110, 0)
    // The card plays the same tap on the sine.
    expect(settings.sets.stuck!.source).toBe('sine')
  })

  it("draws part 1's three sounds as fine lines: one for the tone, a comb for the slice, one moved for the frame", async () => {
    const blur = await lab(NAME)
    const result = blur.render(sine(440, 0.5, LOOP), {})
    const fine = (id: string, within = 60) => {
      const found = result.taps[id]!
      const ys = found.channels_data[0]!
      const hz = (k: number) => found.x0 + ((found.x1 - found.x0) * k) / (ys.length - 1)
      // Every point that stands over both its neighbours, within so many decibels of the tallest.
      const top = ys.reduce((best, v, k) => (v > ys[best]! ? k : best), 0)
      const peaks: number[] = []
      for (let k = 1; k < ys.length - 1; k += 1) {
        if (ys[k]! > ys[k - 1]! && ys[k]! >= ys[k + 1]! && ys[k]! > ys[top]! - within)
          peaks.push(hz(k))
      }
      return { kind: found.kind, step: hz(1) - hz(0), top: hz(top), level: ys[top]!, peaks }
    }
    const tone = fine('linesIn')
    const slice = fine('linesLooped')
    const frame = fine('linesStuck', 30)
    expect(tone.kind).toBe('spectrum')
    // A point every 1.46 Hz, where the page's ordinary spectrum has one every 11.7 Hz.
    expect(tone.step).toBeCloseTo(RATE / 32768, 3)
    expect(Math.abs(tone.top - 440)).toBeLessThan(tone.step)
    expect(tone.peaks.length).toBe(1)
    // A full-scale sine reads 0 dB: this one has a peak of a half, and stands between two points.
    expect(tone.level).toBeGreaterThan(-7.5)
    expect(tone.level).toBeLessThan(-6)
    // The slice is a comb with a tooth at every multiple of 23.4 Hz, the tallest at 445.3 Hz.
    expect(Math.abs(slice.top - 19 * BIN_HZ)).toBeLessThan(slice.step)
    expect(slice.peaks.length).toBeGreaterThan(30)
    slice.peaks.forEach((at) =>
      expect(Math.abs(at / BIN_HZ - Math.round(at / BIN_HZ)) * BIN_HZ).toBeLessThan(slice.step),
    )
    // The frame laid down again is one line, at 468.75 Hz, with nothing within 30 dB of it.
    expect(Math.abs(frame.top - 468.75)).toBeLessThan(frame.step)
    expect(frame.peaks.filter((at) => Math.abs(at - 468.75) > frame.step).length).toBe(0)
  })

  // --- part 2 ------------------------------------------------------------------------------------

  it('holds one chord while another comes in: the tallest bar coming in stands at 258 Hz and the tallest held bar at 328 Hz (claim held-bars)', async () => {
    const blur = await lab(NAME)
    const result = blur.render(await benchSource('chords', LOOP), {})
    say('held bars', tallest(tap(result, 'held'), 6))
    say('later bars', tallest(tap(result, 'later'), 6))
    expectWritten(tallest(tap(result, 'later'), 1)[0]![0] * BIN_HZ, '258 Hz')
    expectWritten(tallest(tap(result, 'held'), 1)[0]![0] * BIN_HZ, '328 Hz')
    // The bar pictures show the bins up to 1.5 kHz.
    expect(result.taps.held!.x1).toBe(1500)
    expect(tap(result, 'held').length).toBe(65)
    // "Three tenths of a second in": where "Frame at" starts.
    expect(blur.description.controls.find((one) => one.id === 'at')!.initial).toBeCloseTo(0.3, 6)
    // "Two seconds later": with nothing held, the row shown as coming in is the row "Frame at"
    // picks when it stands two seconds further on.
    const source = await benchSource('chords', LOOP)
    const bars = (at: number, id: string) => tap(blur.render(source, { freeze: 0, at }), id)
    const ahead = bars(0.3, 'later')
    const there = bars(2.3, 'caught')
    for (let k = 0; k < ahead.length; k += 1) expect(ahead[k]).toBe(there[k])
    // Where less than two seconds of the loop are left, it is the loop's last whole frame.
    const late = bars(3, 'later')
    const last = bars(4, 'caught')
    for (let k = 0; k < late.length; k += 1) expect(late[k]).toBe(last[k])
    expect(Array.from(late)).not.toEqual(Array.from(ahead))
  })

  it('holds every bin at exactly the size it had in the frame Freeze caught (claim held-same)', async () => {
    const blur = await lab(NAME)
    for (const id of ['chords', 'guitar', 'pad']) {
      const result = blur.render(await benchSource(id, LOOP), {})
      const caught = tap(result, 'caught')
      const held = tap(result, 'held')
      const later = tap(result, 'later')
      let moved = 0
      for (let k = 0; k < caught.length; k += 1) {
        // The device drops a bin under a millionth: nothing that small is in these loops' bars.
        if (caught[k]! >= FLOOR_BAR) expect(held[k]).toBe(caught[k])
        else expect(held[k]).toBe(0)
        if (later[k] !== caught[k]) moved += 1
      }
      // And the input has moved on meanwhile.
      expect(moved).toBeGreaterThan(30)
    }
    // With Freeze off and Blur at 0 a bin holds what comes in, and nothing else.
    const off = blur.render(await benchSource('chords', LOOP), { freeze: 0 })
    const later = tap(off, 'later')
    const held = tap(off, 'held')
    for (let k = 0; k < later.length; k += 1) {
      if (later[k]! >= FLOOR_BAR) expect(held[k]).toBe(later[k])
    }
  })

  // --- part 3: the cards ---------------------------------------------------------------------------

  it('holds the frozen chord level: over three stretches of 1.1 s from 0.6 s on it stays within 0.7 dB while the chords going in differ by 16.7 dB (claim freeze-steady)', async () => {
    const blur = await lab(NAME)
    const result = await played(blur, 'drone')
    const each = (x: Float32Array) =>
      [0.6, 1.7, 2.8].map((t) => levelDb(x, seconds(t), seconds(t + 1.1)))
    const spread = (v: number[]) => Math.max(...v) - Math.min(...v)
    expectWritten(say('frozen thirds', spread(each(tap(result, 'out')))), 'less than 0.7 dB')
    expectWritten(say('input thirds', spread(each(tap(result, 'in')))), '16.7 dB')
  })

  it("reads the hang behind the guitar: the device's held share of the band from 200 to 630 Hz is 90 % on average (claim hang-share)", async () => {
    const blur = await lab(NAME)
    const share = tap(await played(blur, 'hang'), 'hang')
    expectWritten(
      say('hang share', (100 * share.reduce((a, b) => a + b, 0)) / share.length),
      '90 %',
    )
    for (const value of share) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(1)
    }
  })

  it('fills the gaps between the drum hits: the quietest 50 ms of the wash stand at −33 dB (claim wash-gaps)', async () => {
    const blur = await lab(NAME)
    const result = await played(blur, 'wash')
    expectWritten(say('wash quietest', levels(tap(result, 'out'), 0, LOOP).lo), '−33 dB')
    // Going in, the quietest stretch is silence.
    expect(levels(tap(result, 'in'), 0, LOOP).lo).toBeLessThan(-100)
  })

  it('sorts the mix: the tones alone come out 4.2 dB under it and the attacks alone 6.06 dB under it (claim sift-mix)', async () => {
    const blur = await lab(NAME)
    const under = async (name: string) => {
      const result = await played(blur, name)
      return levelDb(tap(result, 'in')) - levelDb(tap(result, 'sifted'))
    }
    expectWritten(say('mix tones', await under('tones')), '4.2 dB')
    expectWritten(say('mix attacks', await under('hits')), '6.06 dB')
  })

  it('holds a guitar note with Sustain: read every tenth of a second from 1.5 s to 3.6 s its level moves less than 0.05 dB while the guitar going in moves over 10 dB (claim note-steady)', async () => {
    const blur = await lab(NAME)
    const result = await played(blur, 'note')
    expectWritten(
      say('note span', levels(tap(result, 'sustained'), seconds(1.5), seconds(3.6), 4800).span),
      'less than 0.05 dB',
    )
    expectWritten(
      say('guitar span', levels(tap(result, 'in'), seconds(1.5), seconds(3.6), 4800).span),
      'over 10 dB',
    )
  })

  // --- part 4: the build ---------------------------------------------------------------------------

  it('returns the sound 2,304 samples late from sizes and angles joined again, more than 130 dB under it (claim built-wire)', async () => {
    const blur = await lab(NAME)
    for (const id of ['chords', 'drums']) {
      const source = await benchSource(id, LOOP)
      const result = blur.render(source, { build: STEP.split })
      expectWritten(
        say('wire', -lateDifferenceDb(tap(result, 'built'), source.left, LATENCY)),
        'more than 130 dB',
      )
    }
    expect(LATENCY).toBe(2304)
  })

  it('with the frame held, repeats every 512 samples, more than 120 dB under the sound; with the piece off it does not (claim hold-repeats)', async () => {
    const blur = await lab(NAME)
    const source = await benchSource('chords', LOOP)
    const repeats = (build: number) => {
      const x = tap(blur.render(source, { build }), 'built')
      const from = seconds(1)
      const to = seconds(3.5)
      return -differenceDb(x.subarray(from + HOP, to + HOP), x.subarray(from, to))
    }
    expectWritten(say('hold repeats', repeats(STEP.hold)), 'more than 120 dB')
    expect(matchesWritten(say('split repeats', repeats(STEP.split)), 'more than 120 dB')).toBe(
      false,
    )
    // Step 3 says the output no longer comes round every hop: with the turn it differs from
    // itself a hop on by more than the sound's own level.
    expect(say('turn repeats', repeats(STEP.turn))).toBeLessThan(0)
  })

  it("holds the lesson's own frame laid down again to the build's second step, more than 130 dB under the sound (claim stuck-built)", async () => {
    const blur = await lab(NAME)
    for (const source of [await benchSource('chords', LOOP), sine(440, 0.5, LOOP)]) {
      const apart = (build: number) => {
        const result = blur.render(source, { build })
        return -differenceDb(tap(result, 'stuck'), tap(result, 'built'))
      }
      expectWritten(say('stuck vs built', apart(STEP.hold)), 'more than 130 dB')
      // With the piece off the build is the sound going on, and nothing like the frame laid down.
      expect(matchesWritten(say('stuck vs split', apart(STEP.split)), 'more than 130 dB')).toBe(
        false,
      )
      expect(apart(STEP.split)).toBeLessThan(3)
    }
  })

  it('with every bin kept turning, holds a 440 Hz tone at 440.0 Hz, more than 75 dB from the tone itself; with the piece off it is at 468.75 Hz (claim turn-440)', async () => {
    const blur = await lab(NAME)
    const tone = sine(440, 0.5, LOOP)
    const held = (build: number) => tap(blur.render(tone, { build }), 'built')
    expectWritten(say('turn pitch', pitchOf(held(STEP.turn), seconds(2), seconds(3.5))), '440.0 Hz')
    expect(matchesWritten(pitchOf(held(STEP.hold), seconds(2), seconds(3.5)), '440.0 Hz')).toBe(
      false,
    )
    expectWritten(pitchOf(held(STEP.hold), seconds(2), seconds(3.5)), '468.75 Hz')
    // The held tone is the tone that went in, carried on.
    expectWritten(
      say('turn vs tone', -lateDifferenceDb(held(STEP.turn), tone.left, LATENCY)),
      'more than 75 dB',
    )
    expect(
      matchesWritten(-lateDifferenceDb(held(STEP.hold), tone.left, LATENCY), 'more than 75 dB'),
    ).toBe(false)
  })

  it('with the angles smeared, moves the level of the held 440 Hz sine, read every 50 ms from 1.6 s on, across a span of 9 dB; with the piece off, less than 0.01 dB (claim drift-span)', async () => {
    const blur = await lab(NAME)
    const tone = sine(440, 0.5, LOOP)
    const span = (build: number) =>
      levels(tap(blur.render(tone, { build }), 'built'), seconds(1.6), seconds(3.9)).span
    expectWritten(say('drift span', span(STEP.smear)), '9 dB')
    expect(matchesWritten(span(STEP.turn), '9 dB')).toBe(false)
    expectWritten(span(STEP.turn), 'less than 0.01 dB')
  })

  it('with the fall, lets a bin the input has left fall 24 dB a second at Blur 0.5; with the piece off it is empty by the next frame (claim fall-24)', async () => {
    const blur = await lab(NAME)
    const source = burst()
    const bin = (build: number) =>
      tap(blur.render(source, { build, freeze: 0, blur: 0.5, at: 0.5 }), 'builtBin')
    const fallen = (build: number) => bin(build)[points(1.3)]! - bin(build)[points(2.3)]!
    expectWritten(say('fall per second', fallen(STEP.fall)), '24 dB')
    expect(matchesWritten(fallen(STEP.smear), '24 dB')).toBe(false)
    // Without the fall the bin is at the floor of its lane a frame after the tone has gone.
    expect(bin(STEP.smear)[points(1.05 + (LATENCY + 2 * HOP) / RATE)]).toBe(-140)
    expect(bin(STEP.fall)[points(1.05 + (LATENCY + 2 * HOP) / RATE)]).toBeGreaterThan(-20)
  })

  it('with the octave, puts a line at 880 Hz, 4.9 dB under the 440 Hz tone at Shimmer 0.5; with the piece off there is none (claim octave-880)', async () => {
    const blur = await lab(NAME)
    const tone = sine(440, 0.5, LOOP)
    const under = (build: number) => {
      const x = tap(blur.render(tone, { build, freeze: 0, shimmer: 0.5 }), 'built')
      return lineDb(x, 440, seconds(1), seconds(3)) - lineDb(x, 880, seconds(1), seconds(3))
    }
    expectWritten(say('octave under', under(STEP.octave)), '4.9 dB')
    expect(matchesWritten(under(STEP.fall), '4.9 dB')).toBe(false)
    expect(under(STEP.fall)).toBeGreaterThan(100)
  })

  it('with the gain for every bin, brings a 2 kHz tone out 3.0 dB down at a Tilt of −3 dB an octave; with the piece off, unchanged (claim tilt-3)', async () => {
    const blur = await lab(NAME)
    const tone = sine(2000, 0.25, LOOP)
    const down = (build: number) =>
      levelDb(tone.left) -
      levelDb(
        tap(blur.render(tone, { build, freeze: 0, tilt: -3 }), 'built'),
        seconds(1),
        seconds(3),
      )
    expectWritten(say('tilt down', down(STEP.shape)), '3.0 dB')
    expect(matchesWritten(down(STEP.octave), '3.0 dB')).toBe(false)
    expectWritten(Math.abs(down(STEP.octave)), 'less than 0.01 dB')
  })

  it("is the device's own frames with all seven pieces: the comparison reads −140 dB, the lab's floor, and the two are the same sample for sample (claim built-same)", async () => {
    const blur = await lab(NAME)
    for (const [id, values] of [
      ['chords', {}],
      [
        'drums',
        {
          freeze: 0,
          blur: 0.6,
          smear: 0.7,
          shimmer: 0.15,
          tilt: -0.5,
          highCut: 12000,
          width: 1,
          mix: 0.5,
        },
      ],
      ['guitar', { blur: 0.3, smear: 1, shimmer: 1, tilt: 6, lowCut: 200, highCut: 3000 }],
      ['clicks', { freeze: 0, smear: 0.5 }],
    ] as [string, Record<string, number>][]) {
      const result = blur.render(await benchSource(id, LOOP), values)
      expectWritten(say(`built same ${id}`, result.checks.builtDifference!), '−140 dB')
      expect(result.checks.builtDifference).toBe(-140)
      expect(result.checks.builtStep).toBe(STEP.shape)
      // −140 dB is only the floor of the lab's reading. The samples themselves: the build's
      // frames added up, beside the device's left channel before its limiter and its mix.
      const whole = blur.render(await benchSource(id, LOOP), { ...values, build: STEP.shape })
      const built = tap(whole, 'built')
      const device = tap(whole, 'wet')
      let unequal = 0
      for (let i = 0; i < built.length; i += 1) if (built[i] !== device[i]) unequal += 1
      expect(unequal, `${id}: samples of the build that are not the device's`).toBe(0)
      expect(peak(device)).toBeGreaterThan(0.01)
    }
  })

  // --- part 5: the engine's stages -----------------------------------------------------------------

  it('reads a full-scale sine that lies on a bin as a bar of 1.00 there and 0.50 on the bin either side, and one halfway between two bins as 0.85 on each and 0.17 on the next bin out (claim on-a-bin)', async () => {
    const blur = await lab(NAME)
    const row = (bin: number) =>
      tap(blur.render(sine(bin * BIN_HZ, 1, LOOP), { freeze: 0 }), 'caught')
    for (const k of [19, 30, 45]) {
      const bars = row(k)
      expectWritten(bars[k]!, '1.00')
      expectWritten(bars[k - 1]!, '0.50')
      expectWritten(bars[k + 1]!, '0.50')
      expect(bars[k - 2]).toBeLessThan(0.001)
      expect(bars[k + 2]).toBeLessThan(0.001)
      // Halfway to the next bin: two tall bars and a short one either side of them.
      const between = row(k + 0.5)
      expectWritten(between[k]!, '0.85')
      expectWritten(between[k + 1]!, '0.85')
      expectWritten(between[k - 1]!, '0.17')
      expectWritten(between[k + 2]!, '0.17')
      expect(between[k - 2]).toBeLessThan(0.03)
      expect(between[k + 3]).toBeLessThan(0.03)
    }
  })

  it('lets a held bin fall 60 dB in 2.5 s at Blur 0.5, which is 24 dB a second, and in 6.9 s at Blur 0.7 (claim blur-times)', async () => {
    const blur = await lab(NAME)
    const source = burst()
    const slope = (amount: number) => {
      const bin = tap(blur.render(source, { freeze: 0, blur: amount, at: 0.5 }), 'binHeld')
      return bin[points(1.3)]! - bin[points(2.3)]!
    }
    expectWritten(20 * 0.5 ** 3, '2.5 s')
    expectWritten(say('blur 0.5 slope', slope(0.5)), '24 dB')
    expectWritten(60 / slope(0.5), '2.5 s')
    expectWritten(say('blur 0.7 time', 60 / slope(0.7)), '6.9 s')
    expectWritten(20 * 0.7 ** 3, '6.9 s')
  })

  it('keeps a bin the input has left turning at 440.1 Hz, less than 1 cent from the tone it held (claim turn-kept)', async () => {
    const blur = await lab(NAME)
    const result = blur.render(burst(), { freeze: 0, blur: 0.7, at: 0.5 })
    const hz = tap(result, 'pitchOut')
    const cents = (f: number) => Math.abs(1200 * Math.log2(f / 440))
    // For the two seconds after the tone has gone.
    for (let p = points(1.3); p < points(3.3); p += 1) {
      expectWritten(hz[p]!, '440.1 Hz')
      expectWritten(cents(hz[p]!), 'less than 1 cent')
    }
    // The sound itself: the tail, after the tone has stopped coming in.
    expectWritten(
      say('tail cents', cents(pitchOf(tap(result, 'out'), seconds(1.5), seconds(2.5)))),
      'less than 1 cent',
    )
    // The bin is held: nothing is coming in.
    expect(tap(result, 'binIn')[points(2)]).toBe(-140)
    expect(tap(result, 'binHeld')[points(2)]).toBeGreaterThan(-30)
  })

  it("goes on taking a frozen bin's turn from the input: on the chords the bin caught turning at 330 Hz goes out at 349 Hz once the second chord is struck (claim chord-retuned)", async () => {
    const blur = await lab(NAME)
    const result = blur.render(await benchSource('chords', LOOP), {})
    const mean = (id: string, from: number, to: number) => {
      const hz = tap(result, id)
      let sum = 0
      for (let p = points(from); p < points(to); p += 1) sum += hz[p]!
      return sum / (points(to) - points(from))
    }
    // While the first chord rings, and once the second has been struck over the frozen one.
    expectWritten(mean('pitchOut', 1, 1.9), '330 Hz')
    expectWritten(mean('pitchOut', 2.4, 3.9), '349 Hz')
    // It is the input's own frequency in that bin that the held bin has taken.
    expect(Math.abs(mean('pitchIn', 2.4, 3.9) - mean('pitchOut', 2.4, 3.9))).toBeLessThan(1)
    // The size it holds has not moved.
    expect(tap(result, 'binHeld')[points(3.5)]).toBe(tap(result, 'binHeld')[points(1.5)])
    // The card of part 7 plays this: the chords, frozen as the page opens.
    expect(resolveSet(blur.description, settings.sets.retuned!).source).toBe('chords')
  })

  /**
   * One tone, caught at 0.3 s, and from 1.5 s on a second tone in its place, `later` times as
   * large: what is played into a device that is already holding something.
   */
  function tonePair(first: number, second: number, later: number): Source {
    const left = new Float32Array(LOOP)
    for (let i = 0; i < LOOP; i += 1) {
      const t = i / RATE
      left[i] =
        t < 1.5
          ? 0.25 * Math.sin(2 * Math.PI * first * t)
          : 0.25 * later * Math.sin(2 * Math.PI * second * t)
    }
    return { left, right: left.slice() }
  }

  /** The pairs of stage 4: a caught tone and one played in after it, less than a bin away. */
  const PAIRS: [number, number, string, string][] = [
    [440, 452, '440 Hz', '452 Hz'],
    [440, 430, '440 Hz', '430 Hz'],
    [220, 233, '220 Hz', '233 Hz'],
    [330, 349.2, '330 Hz', '349.2 Hz'],
    [110, 116.5, '110 Hz', '116.5 Hz'],
    [1000, 1012, '1,000 Hz', '1,012 Hz'],
  ]

  it('retunes a frozen tone to within 1 Hz of a second tone of the same level played in afterwards: 440 Hz by 452 Hz, 440 Hz by 430 Hz, 220 Hz by 233 Hz, 330 Hz by 349.2 Hz, 110 Hz by 116.5 Hz and 1,000 Hz by 1,012 Hz; leaves each alone when the second is 30 dB quieter; at 20 dB quieter moves one and not another; and leaves 1,000 Hz alone under 1,059.5 Hz (claim freeze-retuned)', async () => {
    const blur = await lab(NAME)
    const held = (first: number, second: number, later: number) =>
      pitchOf(
        tap(blur.render(tonePair(first, second, later), {}), 'out'),
        seconds(2.5),
        seconds(3.9),
      )
    const quieter = (db: number) => 10 ** (-db / 20)
    expectWritten(-gainToDb(quieter(30)), '30 dB')
    expectWritten(-gainToDb(quieter(20)), '20 dB')
    for (const [first, second, firstWritten, secondWritten] of PAIRS) {
      expectWritten(first, firstWritten)
      expectWritten(second, secondWritten)
      // Less than a bin apart.
      expect(Math.abs(second - first)).toBeLessThan(BIN_HZ)
      expectWritten(
        say(`retuned ${first} by ${second}`, Math.abs(held(first, second, 1) - second)),
        'less than 1 Hz',
      )
      expectWritten(
        say(`not retuned ${first}`, Math.abs(held(first, second, quieter(30)) - first)),
        'less than 1 Hz',
      )
    }
    // In between, a bin at a time: the same 20 dB leave one tone and move another.
    expectWritten(Math.abs(held(440, 452, quieter(20)) - 440), 'less than 1 Hz')
    expectWritten(Math.abs(held(1000, 1012, quieter(20)) - 1012), 'less than 1 Hz')
    // A second tone more than two bins off does nothing, at the same level or twice it.
    expectWritten(1059.5, '1,059.5 Hz')
    expect(1059.5 - 1000).toBeGreaterThan(2 * BIN_HZ)
    expectWritten(Math.abs(held(1000, 1059.5, 1) - 1000), 'less than 1 Hz')
    expectWritten(Math.abs(held(1000, 1059.5, 2) - 1000), 'less than 1 Hz')
  })

  it('holds with Sustain, on the same pairs of tones, within 0.01 Hz of the pitch it caught (claim sustain-deaf)', async () => {
    const blur = await lab(NAME)
    for (const [first, second] of PAIRS) {
      for (const later of [1, 2]) {
        const held = tap(blur.render(tonePair(first, second, later), {}), 'sustained')
        expectWritten(
          say(
            `sustained ${first} under ${second}`,
            Math.abs(pitchOf(held, seconds(2.5), seconds(3.5)) - first),
          ),
          'less than 0.01 Hz',
        )
        // And it is still sounding: the same level before the second tone and after.
        expect(levelDb(held, seconds(2.5), seconds(3.5))).toBeGreaterThan(-20)
        expect(
          Math.abs(
            levelDb(held, seconds(2.5), seconds(3.5)) - levelDb(held, seconds(0.8), seconds(1.4)),
          ),
        ).toBeLessThan(0.05)
      }
    }
  })

  it('spreads a single sample over 62 ms at Smear 1, its highest point 20.8 dB down and 51 % of its energy ahead of its own moment, all of its energy within 0.2 dB of what went in (claim click-smear)', async () => {
    const blur = await lab(NAME)
    const at = seconds(1)
    const result = blur.render(click(LOOP, at, 1), { freeze: 0, smear: 1 })
    const out = tap(result, 'out')
    const top = peak(out)
    let first = -1
    let last = -1
    let energy = 0
    let ahead = 0
    for (let i = 0; i < out.length; i += 1) {
      if (Math.abs(out[i]!) > top * 0.001) {
        if (first < 0) first = i
        last = i
      }
      energy += out[i]! ** 2
      if (i < at + LATENCY) ahead += out[i]! ** 2
    }
    expectWritten(say('click peak', -gainToDb(top)), '20.8 dB')
    expectWritten(say('click length', ((last - first) * 1000) / RATE), '62 ms')
    expectWritten(say('click ahead', (100 * ahead) / energy), '51 %')
    // Its energy is still there: one sample of height 1 went in, an energy of 1.
    expectWritten(say('click energy', Math.abs(10 * Math.log10(energy))), 'less than 0.2 dB')
    // With Smear at 0 it comes out as it went in, a latency late.
    const plain = tap(blur.render(click(LOOP, at, 1), { freeze: 0 }), 'out')
    expect(plain[at + LATENCY]).toBeCloseTo(1, 5)
  })

  it('keeps the level of the chords within 0.5 dB at any Smear while the input drives the bins (claim smear-level)', async () => {
    const blur = await lab(NAME)
    const source = await benchSource('chords', LOOP)
    for (const smear of [0.25, 0.5, 0.75, 1]) {
      const out = tap(blur.render(source, { freeze: 0, smear }), 'out')
      expectWritten(
        say(`smear ${smear}`, Math.abs(levelDb(out) - levelDb(source.left))),
        'less than 0.5 dB',
      )
    }
  })

  it('wanders the bin of a frozen 440 Hz sine between 434.5 Hz and 445.6 Hz, frame by frame, with Smear at 0 (claim drift)', async () => {
    const blur = await lab(NAME)
    const result = blur.render(sine(440, 0.5, LOOP), {})
    const hz = tap(result, 'pitchOut')
    let lo = Infinity
    let hi = -Infinity
    for (let p = points(1); p < points(3.9); p += 1) {
      lo = Math.min(lo, hz[p]!)
      hi = Math.max(hi, hz[p]!)
    }
    expectWritten(say('drift lo', lo), '434.5 Hz')
    expectWritten(say('drift hi', hi), '445.6 Hz')
    // What comes in stays where it is.
    const arriving = tap(result, 'pitchIn')
    for (let p = points(1); p < points(3.9); p += 300) expectWritten(arriving[p]!, '440.0 Hz')
  })

  it('moves the two sides of a held sound apart with Width: alike to 1.00 at Width 0 and to less than 0.1 at Width 1 (claim width-apart)', async () => {
    const blur = await lab(NAME)
    const source = await benchSource('chords', LOOP)
    const sides = (values: Record<string, number>) => {
      const result = blur.render(source, values)
      return alike(tap(result, 'out', 0), tap(result, 'out', 1), seconds(1), seconds(3.9))
    }
    expectWritten(sides({ width: 0 }), '1.00')
    expectWritten(Math.abs(say('width 1 held', sides({ width: 1 }))), 'less than 0.1')
    // And a driven sound, with Smear at its top.
    expectWritten(
      Math.abs(say('width 1 driven', sides({ width: 1, freeze: 0, smear: 1 }))),
      'less than 0.1',
    )
  })

  it('puts the octave of a 440 Hz sine 4.9 dB under it at Shimmer 0.5 and 1.1 dB over it at Shimmer 1, and nothing two octaves up (claim shimmer-levels)', async () => {
    const blur = await lab(NAME)
    const tone = sine(440, 0.5, LOOP)
    const lines = (shimmer: number) => {
      const out = tap(blur.render(tone, { freeze: 0, shimmer }), 'out')
      const line = (hz: number) => lineDb(out, hz, seconds(1), seconds(3))
      return { octave: line(880) - line(440), two: line(1760) - line(440) }
    }
    expectWritten(-lines(0.5).octave, '4.9 dB')
    expectWritten(say('shimmer 1', lines(1).octave), '1.1 dB')
    expect(lines(1).two).toBeLessThan(-90)
  })

  it('leans the spectrum about 1 kHz by Tilt, 3.0 dB an octave at a Tilt of −3 dB an octave and no more than 12.0 dB up, and takes 6 dB off a sine that stands on a cut (claim shape)', async () => {
    const blur = await lab(NAME)
    const gain = (hz: number, values: Record<string, number>) => {
      const tone = sine(hz, 0.05, LOOP)
      return (
        levelDb(tap(blur.render(tone, { freeze: 0, ...values }), 'out'), seconds(1), seconds(3)) -
        levelDb(tone.left)
      )
    }
    expectWritten(-gain(2000, { tilt: -3 }), '3.0 dB')
    expectWritten(gain(500, { tilt: -3 }), '3.0 dB')
    expectWritten(Math.abs(gain(1000, { tilt: -3 })), 'less than 0.01 dB')
    expectWritten(gain(8000, { tilt: 6 }), '12.0 dB')
    expectWritten(gain(16000, { tilt: 6 }), '12.0 dB')
    const half = Math.SQRT2 // half an octave
    expectWritten(-say('low cut on the tone', gain(440, { lowCut: 440 })), '6 dB')
    expectWritten(-say('high cut on the tone', gain(1000, { highCut: 1000 })), '6 dB')
    expectWritten(
      Math.abs(say('inside the low cut', gain(440, { lowCut: 440 / half }))),
      'less than 0.01 dB',
    )
    expectWritten(
      Math.abs(say('inside the high cut', gain(1000, { highCut: 1000 * half }))),
      'less than 0.01 dB',
    )
    expectWritten(
      -say('outside the low cut', gain(440, { lowCut: 440 * half })),
      'more than 100 dB',
    )
    expectWritten(
      -say('outside the high cut', gain(1000, { highCut: 1000 / half })),
      'more than 100 dB',
    )
    // The curve the page draws is the same gain: -3 dB at 2 kHz.
    const curve = blur.render(sine(440, 0.1, LOOP), { freeze: 0, tilt: -3 }).taps.shape!
    const bin = Math.round((2000 / (RATE / 2)) * (curve.length - 1))
    expect(curve.channels_data[0]![bin]).toBeCloseTo(-3, 1)
  })

  it('adds the squared windows over any one sample up to 1.5 (claim sum)', async () => {
    const blur = await lab(NAME)
    const sum = tap(blur.render(sine(440, 0.1, seconds(1)), {}), 'windowSum')
    for (const value of sum) expectWritten(value, '1.5')
    expect(Math.max(...sum) - Math.min(...sum)).toBeLessThan(1e-6)
  })

  it("states the latency the device's manifest states: 2,304 samples, which is 48 ms (claim latency)", async () => {
    expect(statedLatency('spectral-blur')).toBe(LATENCY)
    expect(LATENCY).toBe(2304)
    expectWritten((LATENCY * 1000) / RATE, '48 ms')
    // A single sample comes out that much later.
    const blur = await lab(NAME)
    const at = seconds(1)
    const result = blur.render(click(LOOP, at, 1), { freeze: 0 })
    expect(loudestAt(tap(result, 'out')) - at).toBe(LATENCY)
  })

  it('with every control at rest is the input 2,304 samples late, more than 130 dB under it (claim through)', async () => {
    const blur = await lab(NAME)
    for (const id of ['chords', 'drums', 'noise']) {
      const source = await benchSource(id, LOOP)
      const result = blur.render(source, { freeze: 0 })
      expectWritten(
        say(`through ${id}`, -lateDifferenceDb(tap(result, 'wet'), source.left, LATENCY)),
        'more than 130 dB',
      )
      expectWritten(-lateDifferenceDb(tap(result, 'out'), source.left, LATENCY), 'more than 130 dB')
    }
  })

  it('at Mix 0 puts out the input sample for sample, 2,304 samples late (claim mix)', async () => {
    const blur = await lab(NAME)
    const source = await benchSource('chords', LOOP)
    // Whatever the frames are doing: Freeze on, and Freeze off with everything turned up.
    for (const values of [
      { mix: 0 },
      { mix: 0, freeze: 0, blur: 0.8, smear: 1, shimmer: 1, tilt: 6 },
    ]) {
      const dry = tap(blur.render(source, values), 'out')
      for (let i = LATENCY + 960; i < dry.length; i += 1)
        expect(dry[i]).toBe(source.left[i - LATENCY])
    }
  })

  it('sorts with Sift: the tones keep a sine whole, and of white noise the tones pass 13.15 dB less than went in, the attacks 17.55 dB less and the air 2.345 dB less (claim sift-parts)', async () => {
    const blur = await lab(NAME)
    const tone = sine(440, 0.5, LOOP)
    const hiss = noise(0.25, LOOP)
    const less = (source: Source, keep: number) =>
      levelDb(source.left) -
      levelDb(tap(blur.render(source, { keep }), 'sifted'), seconds(1), seconds(3))
    expectWritten(Math.abs(less(tone, 1)), 'less than 0.01 dB')
    expect(less(tone, 2)).toBeGreaterThan(100)
    expect(less(tone, 3)).toBeGreaterThan(100)
    expectWritten(say('noise in tones', less(hiss, 1)), '13.15 dB')
    expectWritten(say('noise in attacks', less(hiss, 2)), '17.55 dB')
    expectWritten(say('noise in air', less(hiss, 3)), '2.345 dB')
  })

  it('moves the first moment of a note from the tones to the attacks with Edge', async () => {
    const blur = await lab(NAME)
    const note = burst()
    // The first 30 ms of a note that begins without a click, as the attacks alone keep it.
    const start = (edge: number) => {
      const kept = tap(blur.render(note, { keep: 2, edge }), 'sifted')
      return (
        levelDb(kept, seconds(0.07) + SIFT_LATENCY, seconds(0.1) + SIFT_LATENCY) -
        levelDb(note.left, seconds(0.07), seconds(0.1))
      )
    }
    expect(say('edge 0 start', start(0))).toBeLessThan(-60)
    expect(say('edge 1 start', start(1))).toBeGreaterThan(-6)
  })

  it('with Sift keeping everything is the input 4,352 samples late, more than 130 dB under it (claim sift-sum)', async () => {
    const blur = await lab(NAME)
    for (const id of ['chords', 'mix']) {
      const source = await benchSource(id, LOOP)
      const result = blur.render(source, { keep: 0 })
      expectWritten(
        say(`sift sum ${id}`, -lateDifferenceDb(tap(result, 'sifted'), source.left, SIFT_LATENCY)),
        'more than 130 dB',
      )
    }
  })

  it("states the latency Sift's manifest states: 4,352 samples, which is 90.7 ms (claim sift-latency)", async () => {
    expect(statedLatency('sift')).toBe(SIFT_LATENCY)
    expect(SIFT_LATENCY).toBe(4352)
    expectWritten((SIFT_LATENCY * 1000) / RATE, '90.7 ms')
    const blur = await lab(NAME)
    const at = seconds(1)
    const result = blur.render(click(LOOP, at, 1), { keep: 0 })
    expect(loudestAt(tap(result, 'sifted')) - at).toBe(SIFT_LATENCY)
  })

  it("gives Sift's bars: the kept bars are the frame's bars times the share, and the three shares add up to one", async () => {
    const blur = await lab(NAME)
    const source = await benchSource('mix', LOOP)
    const shares: Float32Array[] = []
    for (const keep of [1, 2, 3]) {
      const result = blur.render(source, { keep, at: 0.5 })
      const sizes = tap(result, 'gateSizes')
      const share = tap(result, 'gateShare')
      const kept = tap(result, 'gateKept')
      for (let k = 0; k < sizes.length; k += 1) {
        expect(share[k]).toBeGreaterThanOrEqual(0)
        expect(share[k]).toBeLessThanOrEqual(1)
        expect(kept[k]).toBeCloseTo(sizes[k]! * share[k]!, 6)
      }
      shares.push(share)
    }
    for (let k = 0; k < shares[0]!.length; k += 1) {
      expect(shares[0]![k]! + shares[1]![k]! + shares[2]![k]!).toBeCloseTo(1, 5)
    }
    // On Everything every share is 1.
    for (const share of tap(blur.render(source, { keep: 0, at: 0.5 }), 'gateShare'))
      expect(share).toBe(1)
  })

  it('holds a 440 Hz sine with Sustain at 440.0 Hz, 2.5 dB under the level it went in at, its level read every 50 ms moving less than 0.01 dB (claim sustain-level)', async () => {
    const blur = await lab(NAME)
    const tone = sine(440, 0.5, LOOP)
    const held = tap(blur.render(tone, {}), 'sustained')
    expectWritten(
      say('sustain under', levelDb(tone.left) - levelDb(held, seconds(1.5), seconds(3.5))),
      '2.5 dB',
    )
    expectWritten(say('sustain pitch', pitchOf(held, seconds(1.5), seconds(3.5))), '440.0 Hz')
    expectWritten(
      say('sustain span', levels(held, seconds(1.5), seconds(3.5)).span),
      'less than 0.01 dB',
    )
  })

  it('catches two sines 10 Hz apart at five moments 25 ms apart: Freeze holds them at levels that span 16 dB, Sustain within 0.1 dB (claim close-tones)', async () => {
    const blur = await lab(NAME)
    const two = both(sine(440, 0.25, LOOP), sine(450, 0.25, LOOP))
    const frozen: number[] = []
    const sustained: number[] = []
    for (const at of [0.3, 0.325, 0.35, 0.375, 0.4]) {
      const result = blur.render(two, { at })
      frozen.push(levelDb(tap(result, 'out'), seconds(1.5), seconds(3.5)))
      sustained.push(levelDb(tap(result, 'sustained'), seconds(1.5), seconds(3.5)))
    }
    const spread = (v: number[]) => Math.max(...v) - Math.min(...v)
    expectWritten(say('close tones frozen', spread(frozen)), '16 dB')
    expectWritten(say('close tones sustained', spread(sustained)), 'less than 0.1 dB')
  })

  // --- part 7: the faults --------------------------------------------------------------------------

  it('freezes a drum hit by the moment: caught at 0.5 s it stands at −19.5 dB, at 0.55 s 24.6 dB lower, and at 0.4 s there is nothing to hold (claim catch-moment)', async () => {
    const blur = await lab(NAME)
    const heldAt = async (at: number) =>
      levelDb(tap(await played(blur, 'caughtHit', { at }), 'out'), seconds(2), seconds(3.5))
    // The card plays the first of the three.
    expect(settings.sets.caughtHit!.values!.at).toBe(0.5)
    const onTheHit = await heldAt(0.5)
    expectWritten(say('hit at 0.5', onTheHit), '−19.5 dB')
    expectWritten(say('hit at 0.55', onTheHit - (await heldAt(0.55))), '24.6 dB')
    expect(say('hit at 0.4', await heldAt(0.4))).toBeLessThan(-90)
  })

  it('at Mix a half with nothing held brings the chords out 3.0 dB over the level they went in at (claim loud)', async () => {
    const blur = await lab(NAME)
    const result = await played(blur, 'loud')
    expectWritten(say('loud', levelDb(tap(result, 'out')) - levelDb(tap(result, 'in'))), '3.0 dB')
  })

  it('piles the frames of the drums up to peaks 6.2 times full scale with Freeze off, Blur and Shimmer at their tops and Tilt at −6 dB an octave, where the limiter holds the output at 2.0 times (claim pile-up)', async () => {
    const blur = await lab(NAME)
    const drums = await benchSource('drums', seconds(4))
    const values = { freeze: 0, blur: 1, shimmer: 1, tilt: -6 }
    const result = blur.render(drums, values)
    expectWritten(say('pile-up, frames', peak(tap(result, 'wet'))), '6.2')
    // The limiter's ceiling is twice full scale, and the louder side of the output stands on it.
    const out = Math.max(peak(tap(result, 'out', 0)), peak(tap(result, 'out', 1)))
    expectWritten(say('pile-up, out', out), '2.0')
    expect(out).toBeLessThanOrEqual(2)
    // The build's sound is those frames, before the limiter.
    expectWritten(peak(tap(blur.render(drums, { ...values, build: STEP.shape }), 'built')), '6.2')
  })

  // --- the settings file ---------------------------------------------------------------------------

  it('renders every named set as its card plays it, on a tap that is sound and says something', async () => {
    const blur = await lab(NAME)
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = await played(blur, name)
      const id = set.tap ?? 'out'
      const data = tap(result, id)
      expect(result.taps[id]!.kind, `${name} plays a sound`).toBe('audio')
      expect(
        data.every((v) => Number.isFinite(v)),
        `${name} is finite`,
      ).toBe(true)
      say(`set ${name} level`, levelDb(data).toFixed(1))
      expect(levelDb(data), `${name} can be heard`).toBeGreaterThan(-40)
      expect(levelDb(data), `${name} is not too loud`).toBeLessThan(-10)
    }
  })

  it("starts the page's device table from the device's own defaults: the settings file's defaults, laid over the lab's starting values, are device.json's", async () => {
    const blur = await lab(NAME)
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/spectral-blur/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const { values } = resolveSet(blur.description, { values: settings.defaults!.values })
    // The lab has five controls the device does not: where the frame is taken, and the controls
    // of the two other devices. Every other control is a parameter of Spectral Blur.
    const own = ['at', 'keep', 'sharpness', 'edge', 'motion']
    const parameters = Object.fromEntries(
      Object.entries(values).filter(([id]) => !own.includes(id)),
    )
    const asFloats = (given: Record<string, number>) =>
      Object.fromEntries(Object.entries(given).map(([id, value]) => [id, Math.fround(value)]))
    expect(asFloats(parameters)).toEqual(
      asFloats(Object.fromEntries(device.params.map((one) => [one.key, one.default]))),
    )
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(settings.defaults!.values)) {
      expect(blur.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
  })
})
