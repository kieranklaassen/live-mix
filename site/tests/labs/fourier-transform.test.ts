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
  RATE,
  rms,
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

const NAME = 'fourier-transform'
/** The lengths the "Frame length" choice offers, in its order. */
const SIZES = [64, 256, 1024, 4096]
/** More bins than any frame has: every bin is kept. */
const ALL = 2049
/** The steps of the build part, by the piece each adds. */
const STEP = { probe: 0, bank: 1, window: 2, back: 3 }
/** The device's latency: its frame of 2,048 and the 256 it staggers its channels by. */
const LATENCY = 2048 + 256

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings(NAME)!

/** A named set as its card plays it, on its own source, with `over` laid on its values. */
async function played(fourier: Lab, name: string, over: Record<string, number> = {}) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source, tap } = resolveSet(fourier.description, set)
  const result = fourier.render(await benchSource(source!, seconds(4)), { ...values, ...over })
  return { result, tap: tap ?? 'out' }
}

const first = (tap: { channels_data: Float32Array[] } | undefined) => tap!.channels_data[0]!
const lowest = (x: Float32Array, from = 0, to = x.length) => Math.min(...x.subarray(from, to))
const highest = (x: Float32Array, from = 0, to = x.length) => Math.max(...x.subarray(from, to))
const loudestAt = (x: Float32Array, from = 0, to = x.length) => {
  let best = from
  for (let i = from; i < to; i += 1) if (Math.abs(x[i]!) > Math.abs(x[best]!)) best = i
  return best
}

/** A sine exactly on bin `bin` of a frame of `size`. */
const onBin = (bin: number, size: number, peak = 0.5) => sine((bin * RATE) / size, peak, seconds(1))

/** One unit sample, `after` samples into a frame that starts a quarter of a second in. */
const clickIn = (after: number) => click(seconds(1), RATE / 4 + after)

/** How far apart the bins of a result stand, in hertz: read off the tap, not worked out. */
const spacing = (out: RenderResult) => out.taps.magnitude!.x1 / (out.taps.magnitude!.length - 1)

/** The level of one frequency in a stretch of sound, in dB, where a full-scale sine reads 0. */
function toneDb(x: Float32Array, hz: number, from: number, to: number) {
  const w = (2 * Math.PI * hz) / RATE
  let withCos = 0
  let withSin = 0
  for (let i = from; i < to; i += 1) {
    withCos += x[i]! * Math.cos(w * i)
    withSin += x[i]! * Math.sin(w * i)
  }
  return gainToDb((2 * Math.hypot(withCos, withSin)) / (to - from))
}

/**
 * How many of a frame's bins, taken largest first, hold nine tenths of its energy. A bin between
 * the first and the last stands for its mirror too, so it counts twice.
 */
function binsHoldingMost(out: RenderResult, part = 0.9) {
  const re = first(out.taps.real)
  const im = first(out.taps.imag)
  const energy = Array.from(
    re,
    (v, k) => (v * v + im[k]! * im[k]!) * (k === 0 || k === re.length - 1 ? 1 : 2),
  ).sort((a, b) => b - a)
  const whole = energy.reduce((sum, v) => sum + v, 0)
  let held = 0
  let count = 0
  while (count < energy.length && held < part * whole) held += energy[count++]!
  return count
}

/** The bin of the build that reads highest, and how far under it the bin `away` bins on reads. */
function skirt(out: RenderResult, away: number) {
  const bins = first(out.taps.builtBins)
  const top = bins.indexOf(highest(bins))
  return bins[top]! - bins[top + away]!
}

describe('the Fourier transform', () => {
  it('is a sound lab on the strummed chords: every tap says something, loops, and answers to every control', async () => {
    const fourier = await lab(NAME)
    const chords = await benchSource('chords', seconds(4))
    const result = fourier.render(chords, {})
    expectSoundLab(fourier, chords, result)
  })

  it("builds the transform a piece at a time, and with every piece is the kit's forward and inverse transform", async () => {
    const fourier = await lab(NAME)
    expectBuild(fourier, await benchSource('chords', seconds(4)))
  })

  // --- part 1: the chord ------------------------------------------------------------------

  it('finds the four strings of the chord as four peaks, in the bins at 105 Hz, 164 Hz, 223 Hz and 258 Hz (claim chord-strings)', async () => {
    const fourier = await lab(NAME)
    const out = fourier.render(await benchSource('chords', seconds(4)), {})
    const level = first(out.taps.magnitude)
    // The strings are 110, 164.81, 220 and 261.63 Hz: each is nearest one of these bins.
    const bins = [110, 164.81, 220, 261.63].map((hz) => Math.round(hz / spacing(out)))
    expect(bins).toEqual([9, 14, 19, 22])
    for (const k of bins) {
      expect(level[k]).toBeGreaterThan(level[k - 1]!)
      expect(level[k]).toBeGreaterThan(level[k + 1]!)
    }
    expectWritten(bins[0]! * spacing(out), '105 Hz')
    expectWritten(bins[1]! * spacing(out), '164 Hz')
    expectWritten(bins[2]! * spacing(out), '223 Hz')
    expectWritten(bins[3]! * spacing(out), '258 Hz')
  })

  it('leaves two strings of the chord from its 16 lowest bins: over the first bar those at 110 Hz and 165 Hz come through within 0.1 dB, and those at 220 Hz and 262 Hz more than 35 dB down (claim two-strings)', async () => {
    const fourier = await lab(NAME)
    const { result } = await played(fourier, 'lower')
    const went = first(result.taps.in)
    const came = first(result.taps.out)
    const through = (hz: number) =>
      toneDb(came, hz, 0, seconds(2)) - toneDb(went, hz, 0, seconds(2))
    expectWritten(Math.abs(through(110)), 'less than 0.1 dB')
    expectWritten(Math.abs(through(164.81)), 'less than 0.1 dB')
    expectWritten(-through(220), 'more than 35 dB')
    expectWritten(-through(261.63), 'more than 35 dB')
  })

  it('gives back the chord when the two halves are added: the 16 lowest bins and all the others differ from it by more than 130 dB (claim parts-sum)', async () => {
    const fourier = await lab(NAME)
    const lower = await played(fourier, 'lower')
    const upper = await played(fourier, 'upper')
    expect([lower.tap, upper.tap]).toEqual(['out', 'removed'])
    const kept = first(lower.result.taps.out)
    const rest = first(upper.result.taps.removed)
    const sum = kept.map((v, i) => v + rest[i]!)
    expectWritten(-differenceDb(sum, first(lower.result.taps.in)), 'more than 130 dB')
  })

  // --- part 2: the bins kept ---------------------------------------------------------------

  it('comes closer to the chord with every bin kept: the difference is 9.1 dB under the frame at 48 bins, 21 dB under at 100 and 82 dB under at 400 (claim chord-kept)', async () => {
    const fourier = await lab(NAME)
    const chords = await benchSource('chords', seconds(4))
    let before = 1
    for (const keep of [2, 16, 30, 48, 100, 400, ALL]) {
      const now = fourier.render(chords, { keep }).checks.rebuildNull!
      expect(now).toBeLessThan(before)
      before = now
    }
    expectWritten(-fourier.render(chords, { keep: 48 }).checks.rebuildNull!, '9.1 dB')
    expectWritten(-fourier.render(chords, { keep: 100 }).checks.rebuildNull!, '21 dB')
    expectWritten(-fourier.render(chords, { keep: 400 }).checks.rebuildNull!, '82 dB')
  })

  it('rebuilds the frame from bin 0 alone as a flat line at its average', async () => {
    const fourier = await lab(NAME)
    const out = fourier.render(await benchSource('drums', seconds(4)), { keep: 1 })
    const flat = first(out.taps.rebuilt)
    const frame = first(out.taps.windowed)
    const average = frame.reduce((sum, v) => sum + v, 0) / frame.length
    expect(highest(flat) - lowest(flat)).toBeLessThan(1e-6)
    expect(flat[0]).toBeCloseTo(average, 6)
  })

  // --- part 3: what it is used on ----------------------------------------------------------

  it('holds nine tenths of a frame of the held chord in 17 of its 2,049 bins (claim held-share), and of a frame of the bass line in 9 (claim bass-share)', async () => {
    const fourier = await lab(NAME)
    const held = await played(fourier, 'held')
    expect(first(held.result.taps.real).length).toBe(2049)
    expectWritten(binsHoldingMost(held.result), '17')
    const lows = await played(fourier, 'lows')
    expectWritten(binsHoldingMost(lows.result), '9')
  })

  it('needs 1,213 of the 2,049 bins for nine tenths of a frame of noise (claim noise-share)', async () => {
    const fourier = await lab(NAME)
    const { result } = await played(fourier, 'hiss')
    expectWritten(binsHoldingMost(result), '1,213')
  })

  it('spreads a drum hit over 625 of 2,049 bins in a frame of 4,096 and over 20 of 129 in a frame of 256 (claim hit-share)', async () => {
    const fourier = await lab(NAME)
    const short = await played(fourier, 'hit')
    expect(first(short.result.taps.real).length).toBe(129)
    expectWritten(binsHoldingMost(short.result), '20')
    const long = await played(fourier, 'hit', { size: 3 })
    expect(first(long.result.taps.real).length).toBe(2049)
    expectWritten(binsHoldingMost(long.result), '625')
  })

  // --- part 4: the build -------------------------------------------------------------------

  it('finds every string with a bank of probes: −29.9 dB at 105 Hz, −26.2 dB at 164 Hz, −39.8 dB at 223 Hz and −29.9 dB at 258 Hz (claim built-bank), where one probe found the first alone', async () => {
    const fourier = await lab(NAME)
    const chords = await benchSource('chords', seconds(4))
    const bank = fourier.render(chords, { build: STEP.bank })
    const found = first(bank.taps.builtBins)
    const hz = (k: number) => k * spacing(bank)
    expectWritten(hz(9), '105 Hz')
    expectWritten(found[9]!, '−29.9 dB')
    expectWritten(hz(14), '164 Hz')
    expectWritten(found[14]!, '−26.2 dB')
    expectWritten(hz(19), '223 Hz')
    expectWritten(found[19]!, '−39.8 dB')
    expectWritten(hz(22), '258 Hz')
    expectWritten(found[22]!, '−29.9 dB')
    // The piece switched off: one probe, at the bin nearest "Compare with", and no other answer.
    const one = first(fourier.render(chords, { build: STEP.probe }).taps.builtBins)
    expectWritten(one[9]!, '−29.9 dB')
    expect(matchesWritten(one[14]!, '−26.2 dB')).toBe(false)
    expect(matchesWritten(one[19]!, '−39.8 dB')).toBe(false)
    expect(matchesWritten(one[22]!, '−29.9 dB')).toBe(false)
    expect(highest(one, 10)).toBe(-140)
  })

  it("finds the kit's own bins with the bank of slow sums, more than 130 dB under the largest (claim built-bins)", async () => {
    const fourier = await lab(NAME)
    for (const id of ['chords', 'drums', 'noise', 'saw']) {
      const source = await benchSource(id, seconds(4))
      for (const size of [0, 1, 2, 3]) {
        for (const build of [STEP.probe, STEP.back]) {
          expectWritten(-fourier.render(source, { size, build }).checks.bank!, 'more than 130 dB')
        }
      }
    }
  })

  it('leaks the 440 Hz sine across the bank with no window, 28 dB under its peak ten bins up (claim built-leak-bare), and holds it 70 dB under with the window (claim built-leak-windowed)', async () => {
    const fourier = await lab(NAME)
    const tone = await benchSource('sine', seconds(4))
    const bare = skirt(fourier.render(tone, { build: STEP.bank }), 10)
    const windowed = skirt(fourier.render(tone, { build: STEP.window }), 10)
    expectWritten(bare, '28 dB')
    expectWritten(windowed, '70 dB')
    // The piece switched off: the step before the window does not hold the leak there.
    expect(matchesWritten(bare, '70 dB')).toBe(false)
  })

  it('adds the answers of every probe back up to the frame, more than 130 dB under it (claim built-back), where one answer alone is not the frame', async () => {
    const fourier = await lab(NAME)
    for (const id of ['chords', 'drums', 'noise']) {
      const source = await benchSource(id, seconds(4))
      const apart = (build: number) => {
        const out = fourier.render(source, { build, keep: ALL })
        return -differenceDb(first(out.taps.builtAnswer), first(out.taps.builtFrame))
      }
      expectWritten(apart(STEP.back), 'more than 130 dB')
      // The piece switched off: the one probe's answer is a single sine, far from the frame.
      expect(matchesWritten(apart(STEP.window), 'more than 130 dB')).toBe(false)
      expect(apart(STEP.window)).toBeLessThan(20)
    }
  })

  it("lands on the kit's forward and inverse transform with all four pieces, more than 130 dB under the frame (claim built-same)", async () => {
    const fourier = await lab(NAME)
    for (const id of ['chords', 'pad', 'drums', 'noise', 'saw', 'sine', 'clicks']) {
      const source = await benchSource(id, seconds(4))
      for (const size of [0, 1, 2, 3]) {
        const out = fourier.render(source, { size, build: STEP.back })
        expectWritten(-out.checks.builtDifference!, 'more than 130 dB')
        expect(out.checks.builtStep).toBe(STEP.back)
      }
    }
  })

  // --- part 5: the stages ------------------------------------------------------------------

  it('cuts frames that last 1.3 ms, 5.3 ms, 21.3 ms and 85.3 ms (claim frame-lengths), with bins 750 Hz, 187.5 Hz, 46.9 Hz and 11.7 Hz apart (claim bin-spacings)', async () => {
    const fourier = await lab(NAME)
    const chords = await benchSource('chords', seconds(4))
    const lengths = ['1.3 ms', '5.3 ms', '21.3 ms', '85.3 ms']
    const apart = ['750 Hz', '187.5 Hz', '46.9 Hz', '11.7 Hz']
    for (const [index, size] of SIZES.entries()) {
      const out = fourier.render(chords, { size: index })
      expect(out.taps.frame!.length).toBe(size)
      expect(out.taps.magnitude!.length).toBe(size / 2 + 1)
      expectWritten((out.taps.frame!.length * 1000) / RATE, lengths[index]!)
      expectWritten(spacing(out), apart[index]!)
    }
  })

  it('puts a probe sine exactly on a bin into that bin alone: the rest are more than 120 dB down (claim on-bin-plain)', async () => {
    const fourier = await lab(NAME)
    const out = fourier.render(silence(seconds(0.5)), { probe: 8 })
    const bins = first(out.taps.leakPlain)
    expect(bins[8]).toBeCloseTo(0, 2)
    expectWritten(-highest(bins, 0, 8), 'more than 120 dB')
    expectWritten(-highest(bins, 9), 'more than 120 dB')
  })

  it('spreads the same sine over three bins under the Hann window, the neighbours 6.0 dB down (claim on-bin-hann)', async () => {
    const fourier = await lab(NAME)
    const out = fourier.render(silence(seconds(0.5)), { probe: 8 })
    const bins = first(out.taps.leakHann)
    expect(bins[8]).toBeCloseTo(0, 2)
    expectWritten(bins[8]! - bins[7]!, '6.0 dB')
    expectWritten(bins[8]! - bins[9]!, '6.0 dB')
    expect(highest(bins, 0, 7)).toBeLessThan(-120)
    expect(highest(bins, 10)).toBeLessThan(-120)
  })

  it('leaks a sine half way between two bins everywhere with no window: 3.7 dB and 4.1 dB down either side, 24 dB down at bin 13, no bin under −38 dB (claim between-plain)', async () => {
    const fourier = await lab(NAME)
    const out = fourier.render(silence(seconds(0.5)), { probe: 8.5 })
    const bins = first(out.taps.leakPlain)
    expectWritten(-bins[8]!, '3.7 dB')
    expectWritten(-bins[9]!, '4.1 dB')
    expectWritten(-bins[13]!, '24 dB')
    expectWritten(lowest(bins), 'more than −38 dB')
  })

  it('holds the leak down under the Hann window: 1.4 dB down either side, 49 dB down at bin 13 (claim between-hann)', async () => {
    const fourier = await lab(NAME)
    const out = fourier.render(silence(seconds(0.5)), { probe: 8.5 })
    const bins = first(out.taps.leakHann)
    expectWritten(-bins[8]!, '1.4 dB')
    expectWritten(-bins[9]!, '1.4 dB')
    expectWritten(-bins[13]!, '49 dB')
  })

  it('loses a click on the first sample of a Hann-windowed frame altogether (claim edge-click)', async () => {
    const fourier = await lab(NAME)
    const out = fourier.render(clickIn(0), { position: 0.25 })
    expect(first(out.taps.frame)[0]).toBe(1)
    expect(first(out.taps.windowed).every((v) => v === 0)).toBe(true)
    expect(highest(first(out.taps.magnitude))).toBe(-140)
  })

  it('finds a 750 Hz sine by a cosine and a sine together: a quarter of a cycle later the two sums have changed places and the length has not (claim quarter-turn)', async () => {
    const fourier = await lab(NAME)
    // 750 Hz is bin 64 of 4,096: one cycle is 64 samples, a quarter of it 16.
    const tone = sine(750, 0.5, seconds(1))
    for (const window of [0, 1]) {
      const here = fourier.render(tone, { position: 0.25, window, compare: 750 })
      const later = fourier.render(tone, { position: 0.25 + 16 / RATE, window, compare: 750 })
      const end = (out: typeof here, tap: string) => first(out.taps[tap]).at(-1)!
      expectWritten(end(here, 'runCos'), '0.00')
      expectWritten(end(here, 'runSin'), '−0.50')
      expectWritten(end(later, 'runCos'), '−0.50')
      expectWritten(end(later, 'runSin'), '0.00')
      expect(here.checks.match).toBeCloseTo(-6.02, 2)
      expect(later.checks.match).toBeCloseTo(-6.02, 2)
      // The kit's bin says the same: its angle is a quarter turn on, its level where it was.
      const turned = first(later.taps.phase)[64]! - first(here.taps.phase)[64]!
      const wrapped = Math.atan2(Math.sin(turned), Math.cos(turned))
      expect(wrapped).toBeCloseTo(Math.PI / 2, 4)
      expect(first(later.taps.magnitude)[64]! - first(here.taps.magnitude)[64]!).toBeCloseTo(0, 3)
    }
  })

  it('finds nothing of a frequency the frame does not hold: a 750 Hz sine against 1,500 Hz sums to more than 120 dB down (claim no-match)', async () => {
    const fourier = await lab(NAME)
    const out = fourier.render(sine(750, 0.5, seconds(1)), { position: 0.25, compare: 1500 })
    expectWritten(-out.checks.match!, 'more than 120 dB')
  })

  it("writes the sum out for one bin and lands on the kit's bin, more than 130 dB under the largest bin (claim direct)", async () => {
    const fourier = await lab(NAME)
    for (const id of ['chords', 'saw', 'drums', 'noise']) {
      const source = await benchSource(id, seconds(4))
      for (const size of [0, 1, 2, 3]) {
        for (const compare of [20, 110, 1234, 5000]) {
          expectWritten(
            -fourier.render(source, { size, compare }).checks.direct!,
            'more than 130 dB',
          )
        }
      }
    }
  })

  it('gives a sine of amplitude 0.5 on bin 100 of 4,096 one bin of size 1,024, half its amplitude times N (claim scaling)', async () => {
    const fourier = await lab(NAME)
    const out = fourier.render(onBin(100, 4096), { window: 0, position: 0.25 })
    const size = Math.hypot(first(out.taps.real)[100]!, first(out.taps.imag)[100]!)
    expectWritten(size, '1,024')
    expect(size).toBeGreaterThan(1024 * 0.9999)
    expect(size).toBeLessThan(1024 * 1.0001)
    const level = first(out.taps.magnitude)
    expect(level[100]).toBeCloseTo(-6.02, 2)
    expect(highest(level, 0, 100)).toBeLessThan(-120)
    expect(highest(level, 101)).toBeLessThan(-120)
  })

  it('gets the same bins from the real-signal transform as from the complex one, more than 130 dB under the largest (claim real-same)', async () => {
    const fourier = await lab(NAME)
    for (const id of ['chords', 'saw', 'noise', 'guitar']) {
      const source = await benchSource(id, seconds(4))
      for (const size of [0, 1, 2, 3]) {
        expectWritten(-fourier.render(source, { size }).checks.realSame!, 'more than 130 dB')
      }
    }
  })

  it('keeps the energy: the squares of the bins add up to N times the squares of the samples, apart by less than 0.0001 % (claim parseval)', async () => {
    const fourier = await lab(NAME)
    const hiss = noise(0.5, seconds(1))
    for (const size of [0, 1, 2, 3]) {
      for (const window of [0, 1]) {
        const out = fourier.render(hiss, { size, window })
        expectWritten(out.checks.parseval! * 100, 'less than 0.0001 %')
      }
    }
  })

  it('separates the first two harmonics of the 110 Hz saw by more than 40 dB in a frame of 4,096, wherever the frame is cut (claim saw-resolved), and by less than 6 dB in one of 1,024 (claim saw-blurred)', async () => {
    const fourier = await lab(NAME)
    const saw = await benchSource('saw', seconds(4))
    // How far the lowest bin between the two harmonics lies under the second of them.
    const dip = (size: number, position: number) => {
      const level = first(
        fourier.render(saw, { size: SIZES.indexOf(size), position }).taps.magnitude,
      )
      const one = Math.round((110 * size) / RATE)
      const two = Math.round((220 * size) / RATE)
      return level[two]! - lowest(level, one + 1, two)
    }
    // One cycle of the saw is 9.1 ms: forty cuts a quarter of a millisecond apart cover it.
    for (let cut = 0; cut < 40; cut += 1) {
      const position = 0.1 + cut * 0.00025
      expectWritten(dip(4096, position), 'more than 40 dB')
      expectWritten(dip(1024, position), 'less than 6 dB')
    }
  })

  it('reads one sample alone as every frequency at once: all bins within 0.001 dB of each other (claim click-flat)', async () => {
    const fourier = await lab(NAME)
    for (const window of [0, 1]) {
      const level = first(fourier.render(clickIn(1000), { position: 0.25, window }).taps.magnitude)
      expectWritten(highest(level) - lowest(level), 'less than 0.001 dB')
    }
  })

  it('turns the neighbours of a bin half a turn from it under the Hann window, whose bulk sits half a frame in', async () => {
    const fourier = await lab(NAME)
    const out = fourier.render(onBin(100, 4096), { position: 0.25 })
    const angle = first(out.taps.phase)
    for (const k of [99, 101]) {
      const apart = angle[k]! - angle[100]!
      expect(Math.abs(Math.atan2(Math.sin(apart), Math.cos(apart)))).toBeCloseTo(Math.PI, 3)
    }
  })

  it('gets the frame back N times as large from forward then inverse (claim inverse-times-n), and once divided by N more than 130 dB under it (claim round-trip)', async () => {
    const fourier = await lab(NAME)
    const hiss = noise(0.5, seconds(1))
    for (const index of SIZES.keys()) {
      for (const window of [0, 1]) {
        const out = fourier.render(hiss, { size: index, window })
        // The check is the gain over N: the samples themselves come back N times as large.
        expectWritten(out.checks.unscaled!, '1.0000')
        expectWritten(-out.checks.roundTrip!, 'more than 130 dB')
      }
    }
  })

  it('rebuilds the frame from all of its bins to more than 130 dB under it, and the loop likewise (claim null-all)', async () => {
    const fourier = await lab(NAME)
    for (const id of ['chords', 'saw', 'noise', 'drums']) {
      const source = await benchSource(id, seconds(4))
      for (const size of [0, 1, 2, 3]) {
        for (const window of [0, 1]) {
          const out = fourier.render(source, { size, window, keep: ALL })
          expectWritten(-out.checks.rebuildNull!, 'more than 130 dB')
          expectWritten(-differenceDb(first(out.taps.out), first(out.taps.in)), 'more than 130 dB')
        }
      }
    }
  })

  it('comes closer to the saw with every bin kept: the difference is 9.7 dB under the frame at 48 bins (claim keep-48) and 20.5 dB under at 400 (claim keep-400), wherever the frame is cut', async () => {
    const fourier = await lab(NAME)
    const saw = await benchSource('saw', seconds(4))
    let before = 1
    for (const keep of [2, 10, 20, 48, 100, 400, ALL]) {
      const now = fourier.render(saw, { keep }).checks.rebuildNull!
      expect(now).toBeLessThan(before)
      before = now
    }
    for (const position of [0.1, 0.103, 0.98]) {
      expectWritten(-fourier.render(saw, { keep: 48, position }).checks.rebuildNull!, '9.7 dB')
      expectWritten(-fourier.render(saw, { keep: 400, position }).checks.rebuildNull!, '20.5 dB')
    }
  })

  it('passes a 440 Hz sine through 48 bins of 4,096, which reach 562.5 Hz, within 0.01 dB and stops a 1 kHz sine by more than 95 dB under the Hann window (claim cut-hann); with no window the 1 kHz sine is only 29 dB down (claim cut-plain)', async () => {
    const fourier = await lab(NAME)
    const through = (hz: number, window: number) => {
      const out = fourier.render(sine(hz, 0.5, seconds(1)), { window, keep: 48 })
      return gainToDb(rms(first(out.taps.out)) / rms(first(out.taps.in)))
    }
    const chords = await benchSource('chords', seconds(4))
    expectWritten(48 * spacing(fourier.render(chords, { keep: 48 })), '562.5 Hz')
    expectWritten(Math.abs(through(440, 1)), 'less than 0.01 dB')
    expectWritten(-through(1000, 1), 'more than 95 dB')
    expectWritten(-through(1000, 0), '29 dB')
  })

  it("reads the device's own bins of the frame as the kit's plain transform of the same samples, more than 130 dB under the largest (claim device-bins)", async () => {
    const fourier = await lab(NAME)
    for (const id of ['chords', 'pad', 'drums', 'noise', 'saw']) {
      const source = await benchSource(id, seconds(4))
      for (const position of [0.1, 0.5, 2.345]) {
        const out = fourier.render(source, { position })
        // The device's frame begins on the very sample the lesson's does.
        expect(out.checks.deviceFrame).toBe(0)
        expectWritten(-out.checks.deviceBins!, 'more than 130 dB')
      }
    }
  })

  it('gets the sound back from Spectral Blur with nothing altered, more than 130 dB under it (claim device-wire), 2,304 samples late, which is 48 ms (claim device-late)', async () => {
    const fourier = await lab(NAME)
    for (const id of ['chords', 'pad', 'drums', 'noise', 'saw']) {
      const out = fourier.render(await benchSource(id, seconds(4)), {})
      expectWritten(-out.checks.deviceWire!, 'more than 130 dB')
    }
    const at = RATE / 2
    const came = first(fourier.render(click(seconds(1), at), {}).taps.device)
    expectWritten(loudestAt(came) - at, '2,304 samples')
    expectWritten(((loudestAt(came) - at) * 1000) / RATE, '48 ms')
    expect(loudestAt(came) - at).toBe(LATENCY)
    expect(came[at + LATENCY]).toBeCloseTo(1, 5)
  })

  // --- parts 6 and 7: ways and faults ------------------------------------------------------

  it('reads one string off the chord with "Compare with": −26.1 dB at 165 Hz, and −68.5 dB at 140 Hz, between two strings (claim second-string)', async () => {
    const fourier = await lab(NAME)
    const { result } = await played(fourier, 'second')
    expectWritten(result.checks.match!, '−26.1 dB')
    const between = await played(fourier, 'second', { compare: 140 })
    expectWritten(between.result.checks.match!, '−68.5 dB')
  })

  it('lets the rising sine through the cut with no window, 40 dB under itself over the last second of the loop, where the Hann window holds it more than 90 dB under (claim sweep-bare)', async () => {
    const fourier = await lab(NAME)
    const through = (out: RenderResult) =>
      gainToDb(
        rms(first(out.taps.out), seconds(3), seconds(4)) /
          rms(first(out.taps.in), seconds(3), seconds(4)),
      )
    const bare = await played(fourier, 'bare')
    expectWritten(-through(bare.result), '40 dB')
    const windowed = await played(fourier, 'bare', { window: 1 })
    expectWritten(-through(windowed.result), 'more than 90 dB')
  })

  it('cannot cut the chord apart in frames of 256: from its 2 lowest bins the string at 220 Hz comes through less than 2 dB down and the one at 262 Hz less than 5 dB down (claim blunt)', async () => {
    const fourier = await lab(NAME)
    const { result } = await played(fourier, 'blunt')
    expect(first(result.taps.real).length).toBe(129)
    const went = first(result.taps.in)
    const came = first(result.taps.out)
    const through = (hz: number) =>
      toneDb(came, hz, 0, seconds(2)) - toneDb(went, hz, 0, seconds(2))
    expectWritten(-through(220), 'less than 2 dB')
    expectWritten(-through(261.63), 'less than 5 dB')
    // The two strings the long frame kept are still there.
    expect(Math.abs(through(110))).toBeLessThan(1)
    expect(Math.abs(through(164.81))).toBeLessThan(1)
  })

  it('spreads a click ahead of itself in a long frame: cut at 562 Hz in frames of 4,096 it sounds 73 ms early, 43 dB under its peak between 20 ms and 40 ms ahead (claim pre-echo); in frames of 256 it is at most 4 ms early (claim pre-echo-short)', async () => {
    const fourier = await lab(NAME)
    const at = RATE / 2
    const source = click(seconds(1), at)
    // The settings of the two cards: bin 48 of 4,096 and bin 3 of 256 both stand at 562.5 Hz.
    const early = resolveSet(fourier.description, settings.sets.early!).values
    const brief = resolveSet(fourier.description, settings.sets.short!).values
    expect([early.size, early.keep, brief.size, brief.keep]).toEqual([3, 48, 1, 3])
    const long = first(fourier.render(source, early).taps.out)
    const short = first(fourier.render(source, brief).taps.out)
    const earlyMs = (out: Float32Array) => ((at - out.findIndex((v) => v !== 0)) * 1000) / RATE
    expectWritten(earlyMs(long), '73 ms')
    expectWritten(earlyMs(short), 'at most 4 ms')
    expect(earlyMs(short)).toBeGreaterThan(3.5)
    const ahead = gainToDb(
      rms(long, at - seconds(0.04), at - seconds(0.02)) / highest(long.map(Math.abs)),
    )
    expectWritten(-ahead, '43 dB')
  })

  // --- the settings file -------------------------------------------------------------------

  it('renders every named set: the sound its card plays is there and is not silence', async () => {
    const fourier = await lab(NAME)
    for (const name of Object.keys(settings.sets)) {
      const { result, tap } = await played(fourier, name)
      const sound = result.taps[tap]
      expect(sound?.kind, `the set ${name} plays a sound`).toBe('audio')
      for (const data of sound!.channels_data) {
        expect(
          data.every((v) => Number.isFinite(v)),
          `the set ${name} is finite`,
        ).toBe(true)
      }
      expect(rms(first(sound)), `the set ${name} is not silence`).toBeGreaterThan(1e-5)
    }
  })
})
