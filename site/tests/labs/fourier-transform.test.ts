import { describe, expect, it } from 'vitest'
import {
  benchSource,
  differenceDb,
  expectSoundLab,
  gainToDb,
  lab,
  noise,
  rms,
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

const RATE = 48_000
const SIZES = [64, 256, 1024, 4096]
const ALL = 2049 // more bins than any frame has: every bin is kept

const first = (tap: { channels_data: Float32Array[] } | undefined) => tap!.channels_data[0]!
const lowest = (x: Float32Array, from = 0, to = x.length) => Math.min(...x.subarray(from, to))
const highest = (x: Float32Array, from = 0, to = x.length) => Math.max(...x.subarray(from, to))

/** A sine exactly on bin `bin` of a frame of `size`. */
const onBin = (bin: number, size: number, peak = 0.5) => sine((bin * RATE) / size, peak, seconds(1))

/** One unit sample, `after` samples into a frame that starts a quarter of a second in. */
function click(after: number): Source {
  const source = silence(seconds(1))
  source.left[RATE / 4 + after] = 1
  source.right[RATE / 4 + after] = 1
  return source
}

describe('the Fourier transform', () => {
  it('is a sound lab on the saw: every tap says something, loops, and answers to every control', async () => {
    const fourier = await lab('fourier-transform')
    const saw = await benchSource('saw', seconds(4))
    const result = fourier.render(saw, {})
    expectSoundLab(fourier, saw, result)
  })

  it('keeps the energy: the squares of the bins add up to N times the squares of the samples, to one part in a million (claim parseval)', async () => {
    const fourier = await lab('fourier-transform')
    const hiss = noise(0.5, seconds(1))
    for (const size of [0, 1, 2, 3]) {
      for (const window of [0, 1]) {
        const out = fourier.render(hiss, { size, window })
        // The task's bound, and the tighter one the lesson states.
        expect(out.checks.parseval).toBeLessThan(1e-4)
        expect(out.checks.parseval).toBeLessThan(1e-6)
      }
    }
  })

  it('gives a sine of amplitude 0.5 on bin 100 of 4,096 one bin of size 1,024, half its amplitude times N (claim scaling)', async () => {
    const fourier = await lab('fourier-transform')
    const out = fourier.render(onBin(100, 4096), { window: 0, position: 0.25 })
    const size = Math.hypot(first(out.taps.real)[100]!, first(out.taps.imag)[100]!)
    expect(size).toBeGreaterThan(1024 * 0.9999)
    expect(size).toBeLessThan(1024 * 1.0001)
    const level = first(out.taps.magnitude)
    expect(level[100]).toBeCloseTo(-6.02, 2)
    expect(highest(level, 0, 100)).toBeLessThan(-120)
    expect(highest(level, 101)).toBeLessThan(-120)
  })

  it('puts a probe sine exactly on a bin into that bin alone: the rest are more than 120 dB down (claim on-bin-plain)', async () => {
    const fourier = await lab('fourier-transform')
    const out = fourier.render(silence(seconds(0.5)), { probe: 8 })
    const bins = first(out.taps.leakPlain)
    expect(bins[8]).toBeCloseTo(0, 2)
    expect(highest(bins, 0, 8)).toBeLessThan(-120)
    expect(highest(bins, 9)).toBeLessThan(-120)
  })

  it('spreads the same sine over three bins under the Hann window, the neighbours 6.0 dB down (claim on-bin-hann)', async () => {
    const fourier = await lab('fourier-transform')
    const out = fourier.render(silence(seconds(0.5)), { probe: 8 })
    const bins = first(out.taps.leakHann)
    expect(bins[8]).toBeCloseTo(0, 2)
    expect(bins[7]).toBeCloseTo(-6.02, 1)
    expect(bins[9]).toBeCloseTo(-6.02, 1)
    expect(highest(bins, 0, 7)).toBeLessThan(-120)
    expect(highest(bins, 10)).toBeLessThan(-120)
  })

  it('leaks a sine half way between two bins everywhere with no window: 3.7 and 4.1 dB down either side, 24 dB down at bin 13, no bin under -38 dB (claim between-plain)', async () => {
    const fourier = await lab('fourier-transform')
    const out = fourier.render(silence(seconds(0.5)), { probe: 8.5 })
    const bins = first(out.taps.leakPlain)
    expect(bins[8]).toBeGreaterThan(-3.8)
    expect(bins[8]).toBeLessThan(-3.6)
    expect(bins[9]).toBeGreaterThan(-4.2)
    expect(bins[9]).toBeLessThan(-4.0)
    expect(bins[13]).toBeGreaterThan(-24.8)
    expect(bins[13]).toBeLessThan(-23.8)
    expect(lowest(bins)).toBeGreaterThan(-38)
  })

  it('holds the leak down under the Hann window: 1.4 dB down either side, 49 dB down at bin 13 (claim between-hann)', async () => {
    const fourier = await lab('fourier-transform')
    const out = fourier.render(silence(seconds(0.5)), { probe: 8.5 })
    const bins = first(out.taps.leakHann)
    expect(bins[8]).toBeGreaterThan(-1.5)
    expect(bins[8]).toBeLessThan(-1.3)
    expect(bins[9]).toBeGreaterThan(-1.5)
    expect(bins[9]).toBeLessThan(-1.3)
    expect(bins[13]).toBeGreaterThan(-49.3)
    expect(bins[13]).toBeLessThan(-48.3)
  })

  it('finds a sine by a cosine and a sine together: a quarter of a cycle later the two sums have changed places and the length has not (claim quarter-turn)', async () => {
    const fourier = await lab('fourier-transform')
    // 750 Hz is bin 64 of 4,096: one cycle is 64 samples, a quarter of it 16.
    const tone = sine(750, 0.5, seconds(1))
    for (const window of [0, 1]) {
      const here = fourier.render(tone, { position: 0.25, window, compare: 750 })
      const later = fourier.render(tone, { position: 0.25 + 16 / RATE, window, compare: 750 })
      const end = (out: typeof here, tap: string) => first(out.taps[tap]).at(-1)!
      expect(end(here, 'runCos')).toBeCloseTo(0, 4)
      expect(end(here, 'runSin')).toBeCloseTo(-0.5, 4)
      expect(end(later, 'runCos')).toBeCloseTo(-0.5, 4)
      expect(end(later, 'runSin')).toBeCloseTo(0, 4)
      expect(here.checks.match).toBeCloseTo(-6.02, 2)
      expect(later.checks.match).toBeCloseTo(-6.02, 2)
      // The kit's bin says the same: its angle is a quarter turn on, its level where it was.
      const turned = first(later.taps.phase)[64]! - first(here.taps.phase)[64]!
      const wrapped = Math.atan2(Math.sin(turned), Math.cos(turned))
      expect(wrapped).toBeCloseTo(Math.PI / 2, 4)
      expect(first(later.taps.magnitude)[64]! - first(here.taps.magnitude)[64]!).toBeCloseTo(0, 3)
    }
  })

  it('finds nothing of a frequency the frame does not hold: a 750 Hz sine against 1,500 Hz sums to under -120 dB (claim no-match)', async () => {
    const fourier = await lab('fourier-transform')
    const out = fourier.render(sine(750, 0.5, seconds(1)), { position: 0.25, compare: 1500 })
    expect(out.checks.match).toBeLessThan(-120)
  })

  it("writes the sum out for one bin and lands on the kit's bin, within -130 dB of the largest bin (claim direct)", async () => {
    const fourier = await lab('fourier-transform')
    for (const id of ['saw', 'drums', 'noise']) {
      const source = await benchSource(id, seconds(4))
      for (const size of [0, 1, 2, 3]) {
        for (const compare of [20, 110, 1234, 5000]) {
          expect(fourier.render(source, { size, compare }).checks.direct).toBeLessThan(-130)
        }
      }
    }
  })

  it('separates the first two harmonics of the 110 Hz saw by 60 dB in a frame of 4,096 (claim saw-resolved) and not at all in one of 1,024 (claim saw-blurred)', async () => {
    const fourier = await lab('fourier-transform')
    const saw = await benchSource('saw', seconds(4))
    const between = (size: number) => {
      const level = first(fourier.render(saw, { size: SIZES.indexOf(size) }).taps.magnitude)
      const one = Math.round((110 * size) / RATE)
      const two = Math.round((220 * size) / RATE)
      return { second: level[two]!, gap: lowest(level, one + 1, two) }
    }
    const long = between(4096)
    expect(long.second - long.gap).toBeGreaterThan(60)
    const short = between(1024)
    expect(short.gap).toBeGreaterThan(short.second)
  })

  it('reads one sample alone as every frequency at once: all bins within 0.001 dB of each other (claim click-flat)', async () => {
    const fourier = await lab('fourier-transform')
    for (const window of [0, 1]) {
      const level = first(fourier.render(click(1000), { position: 0.25, window }).taps.magnitude)
      expect(highest(level) - lowest(level)).toBeLessThan(0.001)
    }
  })

  it('loses a click on the first sample of a Hann-windowed frame altogether (claim edge-click)', async () => {
    const fourier = await lab('fourier-transform')
    const out = fourier.render(click(0), { position: 0.25 })
    expect(first(out.taps.frame)[0]).toBe(1)
    expect(first(out.taps.windowed).every((v) => v === 0)).toBe(true)
    expect(highest(first(out.taps.magnitude))).toBe(-140)
  })

  it('gets the frame back N times as large from forward then inverse (claim inverse-times-n), and within -130 dB once divided by N (claim round-trip)', async () => {
    const fourier = await lab('fourier-transform')
    const hiss = noise(0.5, seconds(1))
    for (const index of SIZES.keys()) {
      for (const window of [0, 1]) {
        const out = fourier.render(hiss, { size: index, window })
        // The check is the gain over N: the samples themselves come back N times as large.
        expect(out.checks.unscaled).toBeGreaterThan(1 - 1e-4)
        expect(out.checks.unscaled).toBeLessThan(1 + 1e-4)
        expect(out.checks.roundTrip).toBeLessThan(-130)
      }
    }
  })

  it('rebuilds the frame from all of its bins to more than 130 dB under it, and the loop likewise (claim null-all)', async () => {
    const fourier = await lab('fourier-transform')
    for (const id of ['saw', 'noise', 'drums']) {
      const source = await benchSource(id, seconds(4))
      for (const size of [0, 1, 2, 3]) {
        for (const window of [0, 1]) {
          const out = fourier.render(source, { size, window, keep: ALL })
          // The task's bound, and the one the lesson states.
          expect(out.checks.rebuildNull).toBeLessThan(-100)
          expect(out.checks.rebuildNull).toBeLessThan(-130)
          expect(differenceDb(first(out.taps.out), first(out.taps.in))).toBeLessThan(-130)
        }
      }
    }
  })

  it('comes closer to the saw with every bin kept: the difference is 9.7 dB under the frame at 48 bins (claim keep-48) and 20.5 dB under at 400 (claim keep-400)', async () => {
    const fourier = await lab('fourier-transform')
    const saw = await benchSource('saw', seconds(4))
    let before = 1
    for (const keep of [2, 10, 20, 48, 100, 400, ALL]) {
      const now = fourier.render(saw, { keep }).checks.rebuildNull!
      expect(now).toBeLessThan(before)
      before = now
    }
    const at48 = fourier.render(saw, { keep: 48 }).checks.rebuildNull!
    expect(at48).toBeGreaterThan(-9.9)
    expect(at48).toBeLessThan(-9.5)
    const at400 = fourier.render(saw, { keep: 400 }).checks.rebuildNull!
    expect(at400).toBeGreaterThan(-20.8)
    expect(at400).toBeLessThan(-20.2)
  })

  it('passes a 440 Hz sine through 48 bins of 4,096 within 0.01 dB and stops a 1 kHz sine by more than 95 dB under the Hann window (claim cut-hann); with no window the 1 kHz sine is only 29 dB down (claim cut-plain)', async () => {
    const fourier = await lab('fourier-transform')
    const through = (hz: number, window: number) => {
      const out = fourier.render(sine(hz, 0.5, seconds(1)), { window, keep: 48 })
      return gainToDb(rms(first(out.taps.out)) / rms(first(out.taps.in)))
    }
    expect(Math.abs(through(440, 1))).toBeLessThan(0.01)
    expect(through(1000, 1)).toBeLessThan(-95)
    expect(through(1000, 0)).toBeGreaterThan(-30)
    expect(through(1000, 0)).toBeLessThan(-28)
  })

  it('gets the same bins from the real-signal transform as from the complex one, within -130 dB of the largest (claim real-same)', async () => {
    const fourier = await lab('fourier-transform')
    for (const id of ['saw', 'noise', 'guitar']) {
      const source = await benchSource(id, seconds(4))
      for (const size of [0, 1, 2, 3]) {
        expect(fourier.render(source, { size }).checks.realSame).toBeLessThan(-130)
      }
    }
  })

  it('spreads a click ahead of itself in a long frame: cut at 562 Hz in frames of 4,096 it sounds 73 ms early, 43 dB under its peak 20 to 40 ms ahead (claim pre-echo); in frames of 256 it is 4 ms early at most (claim pre-echo-short)', async () => {
    const fourier = await lab('fourier-transform')
    const at = RATE / 2
    const source = silence(seconds(1))
    source.left[at] = 1
    source.right[at] = 1
    // Bin 48 of 4,096 and bin 3 of 256 both stand at 562.5 Hz: the same cut, two frame lengths.
    const long = first(fourier.render(source, { size: 3, keep: 48 }).taps.out)
    const short = first(fourier.render(source, { size: 1, keep: 3 }).taps.out)
    const earlyMs = (out: Float32Array) => ((at - out.findIndex((v) => v !== 0)) * 1000) / RATE
    expect(earlyMs(long)).toBeGreaterThan(72)
    expect(earlyMs(long)).toBeLessThan(74.5)
    expect(earlyMs(short)).toBeGreaterThan(3.5)
    expect(earlyMs(short)).toBeLessThanOrEqual(4)
    const ahead = gainToDb(rms(long, at - 1920, at - 960) / highest(long.map(Math.abs)))
    expect(ahead).toBeGreaterThan(-44.5)
    expect(ahead).toBeLessThan(-41.5)
  })

  it('rebuilds the frame from bin 0 alone as a flat line at its average', async () => {
    const fourier = await lab('fourier-transform')
    const out = fourier.render(await benchSource('drums', seconds(4)), { keep: 1 })
    const flat = first(out.taps.rebuilt)
    const frame = first(out.taps.windowed)
    const average = frame.reduce((sum, v) => sum + v, 0) / frame.length
    expect(highest(flat) - lowest(flat)).toBeLessThan(1e-6)
    expect(flat[0]).toBeCloseTo(average, 6)
  })

  it('turns the neighbours of a bin half a turn from it under the Hann window, whose bulk sits half a frame in', async () => {
    const fourier = await lab('fourier-transform')
    const out = fourier.render(onBin(100, 4096), { position: 0.25 })
    const angle = first(out.taps.phase)
    for (const k of [99, 101]) {
      const apart = angle[k]! - angle[100]!
      expect(Math.abs(Math.atan2(Math.sin(apart), Math.cos(apart)))).toBeCloseTo(Math.PI, 3)
    }
  })
})
