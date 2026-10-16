import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
  click,
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  peak,
  range,
  RATE,
  rms,
  seconds,
  sine,
  type Source,
} from './support.ts'

const NAME = 'short-time-fourier'
/** The sizes the "Frame" choice offers, in its order. */
const SIZES = [512, 1024, 2048, 4096]
/** Glimmer's latency, and the kit's at a frame of 2,048: a frame and half a hop. */
const LATENCY = 2048 + 256
/** The steps of the build part, by the piece each adds. */
const STEP = { frame: 0, window: 1, hops: 2, overlapAdd: 3, change: 4 }

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings(NAME)!

/**
 * A named set as its card plays it: on its own source, or on `on` where a measurement needs a
 * signal of its own, with `over` laid on its values.
 */
async function played(stft: Lab, name: string, over: Record<string, number> = {}, on?: Source) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(stft.description, set)
  return stft.render(on ?? (await benchSource(source!, seconds(4))), { ...values, ...over })
}

const tap = (result: RenderResult, id: string) => result.taps[id]!.channels_data[0]!

/** Two sources added, sample by sample. */
function both(a: Source, b: Source): Source {
  return {
    left: a.left.map((v, i) => v + b.left[i]!),
    right: a.right.map((v, i) => v + b.right[i]!),
  }
}

const loudestAt = (x: Float32Array) => {
  let best = 0
  for (let i = 1; i < x.length; i += 1) if (Math.abs(x[i]!) > Math.abs(x[best]!)) best = i
  return best
}

/**
 * The level of `out`, taken `delay` samples late, against `source`, in dB: over the loop but
 * for its first 20 ms, which a tap crossfades into the loop's end.
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

/** The bins of a spectrum tap that stand over their neighbours and over `floor` dB, in hertz. */
function peaksOf(bins: Float32Array, floor: number): number[] {
  const hz = RATE / 2 / (bins.length - 1)
  const found: number[] = []
  for (let k = 1; k < bins.length - 1; k += 1) {
    if (bins[k]! > floor && bins[k]! > bins[k - 1]! && bins[k]! >= bins[k + 1]!) found.push(k * hz)
  }
  return found
}

/** How many times a pass opens over a loop, and for what share of it. */
function opened(pass: Float32Array): { times: number; share: number } {
  let times = 0
  let open = 0
  pass.forEach((value, k) => {
    if (value > 0) open += 1
    if (value > 0 && (k === 0 || pass[k - 1] === 0)) times += 1
  })
  return { times, share: open / pass.length }
}

/** The level of a tap over the loop against the source's, in dB. */
const levelOver = (result: RenderResult, id: string, source: Source) =>
  gainToDb(rms(tap(result, id))) - gainToDb(rms(source.left))
/** The highest sample of a tap against the source's, in dB. */
const peakOver = (result: RenderResult, id: string, source: Source) =>
  gainToDb(peak(tap(result, id))) - gainToDb(peak(source.left))

/**
 * One unit sample as it comes out of frames, about its own moment: the largest sample and the
 * share of the energy that lie more than `beyond` samples from it, in dB.
 */
function farFrom(curve: Float32Array, beyond: number): { top: number; share: number } {
  const middle = (curve.length - 1) / 2
  let top = 0
  let far = 0
  let whole = 0
  curve.forEach((value, i) => {
    whole += value * value
    if (Math.abs(i - middle) > beyond) {
      top = Math.max(top, Math.abs(value))
      far += value * value
    }
  })
  return { top: gainToDb(top), share: 10 * Math.log10(Math.max(far / whole, 1e-20)) }
}

/** How far a spectrum falls from its tallest bin to the bin `away` bins above it, in dB. */
function fallFromPeak(bins: Float32Array, away: number): number {
  let top = 1
  for (let k = 1; k < bins.length; k += 1) if (bins[k]! > bins[top]!) top = k
  return bins[top]! - bins[top + away]!
}

describe('the short-time Fourier transform', () => {
  it('is a sound lab on the guitar: every tap says something, loops, and answers to every control', async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const result = stft.render(guitar, {})
    // At the kit's own hop the windows add up to one flat line, as they should.
    expectSoundLab(stft, guitar, result, { quiet: ['windowSum'] })
  })

  it("has a build path: five steps that each change what is built, leave the main path alone, and end within the lab's bound of Glimmer's own frames", async () => {
    const stft = await lab(NAME)
    expectBuild(stft, await benchSource('guitar', seconds(4)))
  })

  // ---- the frames, looked at ------------------------------------------------------------------

  it('finds the note that sounds at 1.1 s of the guitar in one frame: lines at 328 Hz, 656 Hz and 984 Hz (claim note-at)', async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const bins = tap(stft.render(guitar, { at: 1.1 }), 'bins')
    const hz = RATE / 2 / (bins.length - 1)
    // The three tallest peaks of the frame, lowest first.
    const tallest = peaksOf(bins, -60)
      .sort((a, b) => bins[Math.round(b / hz)]! - bins[Math.round(a / hz)]!)
      .slice(0, 3)
      .sort((a, b) => a - b)
    expectWritten(tallest[0]!, '328 Hz')
    expectWritten(tallest[1]!, '656 Hz')
    expectWritten(tallest[2]!, '984 Hz')
    // Another frame, another note: a second later the lowest line is somewhere else.
    const later = tap(stft.render(guitar, { at: 2.1 }), 'bins')
    const first = peaksOf(later, -30)[0]!
    expect(matchesWritten(first, '328 Hz')).toBe(false)
  })

  it('reads a full-scale sine on a bin as 0 dB there, −6.02 dB in each neighbour and nothing elsewhere (claim on-a-bin)', async () => {
    const stft = await lab(NAME)
    // Bin 20 of a frame of 2,048 is 468.75 Hz.
    const result = stft.render(sine((20 * RATE) / 2048, 1, seconds(1)), { at: 0.5 })
    const bins = tap(result, 'bins')
    expectWritten(bins[20]!, '0 dB')
    expect(bins[20]).toBeCloseTo(0, 3)
    expectWritten(bins[19]!, '−6.02 dB')
    expectWritten(bins[21]!, '−6.02 dB')
    bins.forEach((level, k) => {
      if (k < 19 || k > 21) expect(level).toBeLessThan(-120)
    })
  })

  it('hands over the bins the plain transform makes of the windowed frame, to the last digit (claim transformed)', async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    for (const values of [{}, { size: 0, at: 0.3 }, { size: 3, at: 2.9 }, { size: 1, at: 0 }]) {
      // −140 dB is where the lab stops counting: the difference is under one part in 10¹⁴.
      expect(stft.render(guitar, values).checks.transformed).toBe(-140)
    }
  })

  it('cuts frames 42.7 ms long at 2,048 samples (claim frame-length), with bins 23.4 Hz apart (claim bin-spacing): 93.75 Hz at 512 and 11.7 Hz at 4,096 (claim row-heights)', async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(1))
    const sized = SIZES.map((_, size) => stft.render(guitar, { size }))
    // A frame's length from the lab's own axis: its first sample to its last, and one more.
    const frame = sized[2]!.taps.frame!
    expect(frame.length).toBe(2048)
    expectWritten(((frame.x1 - frame.x0) * 1000 * frame.length) / (frame.length - 1), '42.7 ms')
    // The bins run from 0 Hz to half the rate, ends included.
    const spacing = sized.map((result) => RATE / 2 / (result.taps.bins!.length - 1))
    expectWritten(spacing[0]!, '93.75 Hz')
    expectWritten(spacing[2]!, '23.4 Hz')
    expectWritten(spacing[3]!, '11.7 Hz')
    // And the picture's rows are those bins.
    sized.forEach((result) => {
      const picture = result.taps.picture!
      expect(picture.length / picture.columns).toBe(result.taps.bins!.length)
    })
  })

  it('takes 375 frames of the four-second loop at a frame of 2,048 (claim frames-count)', async () => {
    const stft = await lab(NAME)
    const result = stft.render(await benchSource('guitar', seconds(4)), {})
    expect(result.taps.picture!.columns).toBe(375)
    expect(result.taps.pictureOut!.columns).toBe(375)
  })

  it('shows two tones 30 Hz apart as two peaks at a frame of 4,096 and as one at 2,048 and under (claim two-tones)', async () => {
    const stft = await lab(NAME)
    const pair = both(sine(440, 0.25, seconds(2)), sine(470, 0.25, seconds(2)))
    for (const at of [0.3, 0.71, 1.234]) {
      const counts = SIZES.map((_, size) => {
        const bins = tap(stft.render(pair, { size, at }), 'bins')
        return peaksOf(bins, -40).filter((hz) => hz > 300 && hz < 600).length
      })
      expect(counts).toEqual([1, 1, 1, 2])
    }
  })

  it('shows a unit sample in four columns, a frame wide: 10.7 ms at 512 and 85.3 ms at 4,096 (claim click-width)', async () => {
    const stft = await lab(NAME)
    const widths = SIZES.map((_, size) => {
      const found = stft.render(click(seconds(1), 24_000), { size }).taps.picture!
      const rows = found.length / found.columns
      const data = found.channels_data[0]!
      let lit = 0
      for (let c = 0; c < found.columns; c += 1) {
        if (range(data, c * rows, (c + 1) * rows).hi > -120) lit += 1
      }
      expect(lit).toBe(4)
      return (lit * (found.x1 - found.x0) * 1000) / found.columns
    })
    expectWritten(widths[0]!, '10.7 ms')
    expect(widths[1]).toBeCloseTo(21.33, 1)
    expect(widths[2]).toBeCloseTo(42.67, 1)
    expectWritten(widths[3]!, '85.3 ms')
  })

  // ---- the way back ---------------------------------------------------------------------------

  it('adds the squared windows up to 1.5 at a quarter hop and 3 at an eighth (claim hann-squared-sum), which the scale makes 1 (claim window-sum)', async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(1))
    const plain = [1.5, 3]
    for (const size of [0, 2, 3]) {
      plain.forEach((wanted, index) => {
        const result = stft.render(guitar, { size, hop: index + 1 })
        const windows = result.taps.windows!
        const each = windows.channels_data[0]!
        const points = each.length / windows.columns
        for (let p = 0; p < points; p += 1) {
          let sum = 0
          for (let m = 0; m < windows.columns; m += 1) sum += each[m * points + p]!
          expect(Math.abs(sum - wanted)).toBeLessThan(1e-5)
        }
        const scaled = range(tap(result, 'windowSum'))
        expect(scaled.lo).toBeGreaterThan(1 - 1e-6)
        expect(scaled.hi).toBeLessThan(1 + 1e-6)
      })
    }
  })

  it('swings between two thirds and four thirds at a hop of half a frame (claim half-hop-swing)', async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(1))
    for (const size of [0, 2, 3]) {
      const swing = range(tap(stft.render(guitar, { size, hop: 0 }), 'windowSum'))
      expect(swing.lo).toBeCloseTo(2 / 3, 5)
      expect(swing.hi).toBeCloseTo(4 / 3, 5)
    }
  })

  it("overlap-adds by hand to the kit's own output, more than 130 dB under it, at a quarter hop and at an eighth (claim by-hand)", async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    for (const size of [0, 1, 2, 3]) {
      for (const hop of [1, 2]) {
        expectWritten(-stft.render(guitar, { size, hop }).checks.byHand!, 'more than 130 dB')
      }
    }
  })

  it('returns the input more than 135 dB under itself when nothing is altered, after the latency (claim returned)', async () => {
    const stft = await lab(NAME)
    for (const id of ['guitar', 'drums', 'noise']) {
      const source = await benchSource(id, seconds(4))
      const result = stft.render(source, {})
      // The lab's own figure, and the same worked out here from the two taps.
      expectWritten(-result.checks.returned!, 'more than 135 dB')
      expectWritten(
        -lateDifferenceDb(tap(result, 'through'), source.left, LATENCY),
        'more than 135 dB',
      )
    }
    // At every size of frame, each with its own latency.
    const guitar = await benchSource('guitar', seconds(4))
    SIZES.forEach((frame, size) => {
      const result = stft.render(guitar, { size })
      const through = tap(result, 'through')
      expectWritten(-result.checks.returned!, 'more than 135 dB')
      expectWritten(-lateDifferenceDb(through, guitar.left, frame + frame / 8), 'more than 135 dB')
      // One sample out of step and nothing cancels: the latency is that number and no other.
      expect(lateDifferenceDb(through, guitar.left, frame + frame / 8 + 1)).toBeGreaterThan(-40)
    })
  })

  it('puts a unit sample out 2,304 samples later at a frame of 2,048 (claim latency)', async () => {
    const stft = await lab(NAME)
    const through = tap(stft.render(click(seconds(1), 12_000), {}), 'through')
    expectWritten(loudestAt(through) - 12_000, '2,304 samples')
    expectWritten(((loudestAt(through) - 12_000) * 1000) / RATE, '48 ms')
    expect(loudestAt(through)).toBe(12_000 + 2304)
    expect(through[12_000 + 2304]).toBeCloseTo(1, 5)
  })

  it('is a frame and an eighth late at every size: 576, 1,152 and 4,608 samples at the others (claim latency-sizes)', async () => {
    const stft = await lab(NAME)
    const late = SIZES.map(
      (_, size) =>
        loudestAt(tap(stft.render(click(seconds(1), 12_000), { size }), 'through')) - 12_000,
    )
    expect(late).toEqual(SIZES.map((frame) => frame + frame / 8))
    expect(late.slice(0, 2)).toEqual([576, 1152])
    expectWritten(late[3]!, '4,608 samples')
  })

  // ---- the frames, altered --------------------------------------------------------------------

  it("works Glimmer's gain per bin out again from its bands, within 0.001 dB of what its frames show (claim gain-rebuilt)", async () => {
    const stft = await lab(NAME)
    const tried: Record<string, number>[] = [
      {},
      { pattern: 0 },
      { pattern: 3, grain: 0.2, rate: 5 },
      { depth: 0.4, grain: 1 },
      { depth: 0.65, pattern: 0, lean: 0.5, vary: 0.35, apart: 0.5 },
      { soft: 0, mix: 0.5 },
    ]
    for (const id of ['guitar', 'chords', 'noise']) {
      const source = await benchSource(id, seconds(4))
      for (const values of tried) {
        expectWritten(stft.render(source, values).checks.gainRebuilt!, 'less than 0.001 dB')
      }
    }
  })

  it('is the input 2,304 samples late with Depth at 0, more than 135 dB under it (claim depth-zero)', async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const result = stft.render(guitar, { depth: 0 })
    expectWritten(-lateDifferenceDb(tap(result, 'out'), guitar.left, LATENCY), 'more than 135 dB')
    expectWritten(
      -lateDifferenceDb(result.taps.out!.channels_data[1]!, guitar.right, LATENCY),
      'more than 135 dB',
    )
    // Every gain is 1.
    const gains = range(tap(result, 'gains'))
    expect(gains.lo).toBe(0)
    expect(gains.hi).toBe(0)
  })

  it('holds the level of white noise within 0.1 dB while its bands fall to silence and come back (claim level-held)', async () => {
    const stft = await lab(NAME)
    const hiss = await benchSource('noise', seconds(4))
    const tried: Record<string, number>[] = [
      {},
      { pattern: 0 },
      { pattern: 3 },
      { grain: 0 },
      { grain: 1 },
      { rate: 0.25 },
      resolveSet(stft.description, settings.sets.wash!).values,
    ]
    for (const values of tried) {
      const result = stft.render(hiss, values)
      expectWritten(Math.abs(levelOver(result, 'out', hiss)), 'less than 0.1 dB')
      // The bands do go dark: the lowest gain is silence.
      expect(range(tap(result, 'gains')).lo).toBeLessThan(-100)
    }
  })

  it('stands a band 4.9 dB over its input at the top of its flash (claim flash), and a lone sine 4.7 dB over its own peak (claim sine-swells)', async () => {
    const stft = await lab(NAME)
    const tone = await benchSource('sine', seconds(4))
    const result = await played(stft, 'lone')
    expectWritten(range(tap(result, 'gains')).hi, '4.9 dB')
    expectWritten(peakOver(result, 'out', tone), '4.7 dB')
    // Over the loop the level is the input's.
    expect(Math.abs(levelOver(result, 'out', tone))).toBeLessThan(0.2)
  })

  it('reads a 440 Hz sine as 440.0 Hz from the turn of its phase, in a bin centred on 445.3 Hz (claim phase-440)', async () => {
    const stft = await lab(NAME)
    const result = stft.render(await benchSource('sine', seconds(4)), {})
    const turning = range(tap(result, 'turning'))
    expectWritten(turning.lo, '440.0 Hz')
    expectWritten(turning.hi, '440.0 Hz')
    const loudest = range(tap(result, 'loudest'))
    expectWritten(loudest.lo, '445.3 Hz')
    expectWritten(loudest.hi, '445.3 Hz')
    // And anywhere else between two bins.
    for (const hz of [100, 1000, 3000.5]) {
      const found = range(tap(stft.render(sine(hz, 0.5, seconds(2)), {}), 'turning'))
      expect(found.lo).toBeGreaterThan(hz - 0.05)
      expect(found.hi).toBeLessThan(hz + 0.05)
    }
  })

  // ---- attacks --------------------------------------------------------------------------------

  it("leaves a unit sample 0.77 high in Glimmer's frames with a fifth of its energy ahead of it and as much behind (claim click-smear)", async () => {
    const stft = await lab(NAME)
    const result = stft.render(await benchSource('guitar', seconds(1)), {})
    const smeared = tap(result, 'clickWet')
    const middle = (smeared.length - 1) / 2
    expect(smeared[middle]).toBeGreaterThan(0.765)
    expect(smeared[middle]).toBeLessThan(0.775)
    let ahead = 0
    let behind = 0
    for (let i = 0; i < middle; i += 1) {
      ahead += smeared[i]! ** 2
      behind += smeared[smeared.length - 1 - i]! ** 2
    }
    const whole = ahead + behind + smeared[middle]! ** 2
    expect(ahead / whole).toBeGreaterThan(0.19)
    expect(ahead / whole).toBeLessThan(0.23)
    // A gain per bin turns no phase, so what it adds lies evenly about the sample.
    expect(Math.abs(ahead - behind) / whole).toBeLessThan(0.001)
  })

  it('puts the largest of what lies ahead 14.5 dB under the unit sample that went in (claim click-ahead)', async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(1))
    const smeared = tap(stft.render(guitar, {}), 'clickWet')
    const middle = (smeared.length - 1) / 2
    expectWritten(-gainToDb(peak(smeared.subarray(0, middle))), '14.5 dB')
    // And nothing of it is left once Depth is 0: the frames add back to the one sample.
    const whole = tap(stft.render(guitar, { depth: 0 }), 'clickWet')
    expect(whole[middle]).toBeCloseTo(1, 5)
    expect(gainToDb(peak(whole.subarray(0, middle)))).toBeLessThan(-120)
  })

  it('puts the unit sample out whole and nothing ahead of it over −80 dB (claim click-passed)', async () => {
    const stft = await lab(NAME)
    const passed = tap(stft.render(await benchSource('guitar', seconds(1)), {}), 'clickOut')
    const middle = (passed.length - 1) / 2
    expect(passed[middle]).toBe(1)
    expectWritten(gainToDb(peak(passed.subarray(0, middle))), 'under −80 dB')
    // From 1,024 samples ahead of it to 256 behind, the device is on the dry sound alone.
    for (let i = middle - 1024; i <= middle + 256; i += 1) {
      if (i !== middle) expect(passed[i]).toBe(0)
    }
  })

  it('is the input sample for sample, 2,304 late, from 21 ms ahead of an attack to 6 ms after it (claim attack-dry)', async () => {
    const stft = await lab(NAME)
    // In the loop, on a click: where the pass is full.
    const at = 24_000 + LATENCY
    const pass = tap(stft.render(click(seconds(1), 24_000), {}), 'pass')
    const full: number[] = []
    pass.forEach((value, k) => {
      if (value >= 1) full.push(k * 16 - at)
    })
    // A point of the pass every 16 samples, an attack placed to the nearest segment of 64.
    expectWritten((-full[0]! * 1000) / RATE, '21 ms')
    expectWritten((full[full.length - 1]! * 1000) / RATE, '6 ms')

    // And on the guitar: wherever the pass is full, the output is the dry sound and the frames' sum is not.
    const guitar = await benchSource('guitar', seconds(4))
    const loop = stft.render(guitar, {})
    const out = tap(loop, 'out')
    const wet = tap(loop, 'wet')
    const turned = tap(loop, 'pass')
    let dry = 0
    let altered = 0
    for (let i = LATENCY + 960; i < out.length - 16; i += 1) {
      const k = Math.floor(i / 16)
      if (turned[k]! < 1 || turned[k + 1]! < 1) continue
      dry += 1
      expect(out[i]).toBe(guitar.left[i - LATENCY])
      if (wet[i] !== guitar.left[i - LATENCY]) altered += 1
    }
    expect(dry).toBeGreaterThan(10_000)
    expect(altered / dry).toBeGreaterThan(0.99)
  })

  it('never opens the pass on a steady sine, saw or noise (claim steady-never)', async () => {
    const stft = await lab(NAME)
    for (const id of ['sine', 'saw', 'noise']) {
      const result = stft.render(await benchSource(id, seconds(4)), {})
      expect(range(tap(result, 'pass')).hi).toBe(0)
    }
  })

  it('puts 3 % of the unit sample ahead of it at Depth 0.5 and 21 % at full Depth (claim smear-depth), 5 samples ahead on average at Grain 0 and 62 at Grain 1 (claim smear-grain)', async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(1))
    // The share of the energy that lies ahead of the sample, and how far ahead it lies on average.
    const ahead = (values: Record<string, number>) => {
      const smeared = tap(stft.render(guitar, values), 'clickWet')
      const middle = (smeared.length - 1) / 2
      let whole = 0
      let before = 0
      let reach = 0
      smeared.forEach((value, i) => {
        whole += value ** 2
        if (i < middle) {
          before += value ** 2
          reach += value ** 2 * (middle - i)
        }
      })
      return { share: before / whole, samples: reach / before }
    }
    const half = ahead({ depth: 0.5 })
    const full = ahead({ depth: 1 })
    expectWritten(100 * half.share, '3 %')
    expectWritten(100 * full.share, '21 %')
    // Depth moves how much, and not how far.
    expect(Math.abs(half.samples - full.samples)).toBeLessThan(0.5)
    expectWritten(ahead({ grain: 0 }).samples, '5 samples')
    expectWritten(ahead({ grain: 1 }).samples, '62 samples')
  })

  // ---- a hop too long -------------------------------------------------------------------------

  it('is 12.5 dB under the signal wrong on the guitar at a hop of half a frame (claim half-hop-error)', async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    expectWritten(-stft.render(guitar, { hop: 0 }).checks.byHand!, '12.5 dB')
    // A steady tone is as wrong, to a tenth of a decibel, as the set its card plays.
    expect(stft.render(sine(937.5, 0.5, seconds(2)), { hop: 0 }).checks.byHand).toBeCloseTo(
      -12.5,
      0,
    )
    expect((await played(stft, 'halfhop')).checks.byHand).toBeCloseTo(-12.5, 0)
    // At the kit's hop it is not wrong at all.
    expect(matchesWritten(-stft.render(guitar, { hop: 1 }).checks.byHand!, '12.5 dB')).toBe(false)
  })

  it('gives a sine a side tone 46.9 Hz either side, 15.6 dB under it, at a hop of half a frame of 2,048 (claim half-hop-sidebands)', async () => {
    const stft = await lab(NAME)
    // 937.5 Hz is bin 80 of the page's spectrum (4,096 points, 11.72 Hz apart) and goes a whole
    // number of times into the loop; a hop of 1,024 samples comes round every four bins.
    const tone = sine(937.5, 0.5, seconds(2))
    expectWritten((4 * RATE) / 4096, '46.9 Hz')
    expectWritten(RATE / 1024, '46.9 Hz')
    await played(stft, 'halfhop', {}, tone)
    const halved = stft.spectrum('added')
    expectWritten(halved[80]! - halved[76]!, '15.6 dB')
    expectWritten(halved[80]! - halved[84]!, '15.6 dB')
    // At the kit's hop there is none.
    await played(stft, 'halfhop', { hop: 1 }, tone)
    const whole = stft.spectrum('added')
    expect(whole[76]! - whole[80]!).toBeLessThan(-90)
    expect(whole[84]! - whole[80]!).toBeLessThan(-90)
    expect(matchesWritten(whole[80]! - whole[76]!, '15.6 dB')).toBe(false)
  })

  // ---- the build part: a piece at a time, and each number with its piece off ------------------

  it('lays frames cut end to end back down as the sound that went in, 2,304 samples late and more than 130 dB under it (claim built-wire), 93 frames to the loop (claim end-to-end)', async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const result = stft.render(guitar, { build: STEP.frame })
    expectWritten(-lateDifferenceDb(tap(result, 'built'), guitar.left, LATENCY), 'more than 130 dB')
    // 192,000 samples in frames of 2,048: 93 whole frames, and 1,536 samples of a 94th.
    expect(result.taps.builtPicture!.columns).toBe(93)
    // Each frame's share is the whole of it, and the shares add up to 1 everywhere.
    const shares = range(tap(result, 'builtWindowSum'))
    expect(shares.lo).toBe(1)
    expect(shares.hi).toBe(1)
  })

  it('leaks a 440 Hz sine only 32 dB under its peak ten bins away when the frame is cut square (claim leak-square), and 74 dB under once the window is on (claim leak-windowed)', async () => {
    const stft = await lab(NAME)
    const tone = await benchSource('sine', seconds(4))
    const fall = (build: number) => fallFromPeak(tap(stft.render(tone, { build }), 'builtBins'), 10)
    expectWritten(fall(STEP.frame), '32 dB')
    expectWritten(fall(STEP.window), '74 dB')
    // With the piece off the number is not the one the step states.
    expect(matchesWritten(fall(STEP.frame), '74 dB')).toBe(false)
    // The windowed frame begins and ends at nothing; the square one does not.
    const ends = (build: number) => {
      const frame = tap(stft.render(tone, { build }), 'builtFrame')
      return Math.max(Math.abs(frame[0]!), Math.abs(frame[frame.length - 1]!))
    }
    expect(ends(STEP.window)).toBeLessThan(1e-5)
    expect(ends(STEP.frame)).toBeGreaterThan(0.1)
  })

  it('comes back 4.3 dB quieter through windowed frames laid end to end, falling to nothing between them (claim window-dip)', async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const level = (build: number) => levelOver(stft.render(guitar, { build }), 'built', guitar)
    expectWritten(-level(STEP.window), '4.3 dB')
    expect(matchesWritten(-level(STEP.frame), '4.3 dB')).toBe(false)
    // The shares: one window after another, from 0 to 1 and back.
    const shares = range(tap(stft.render(guitar, { build: STEP.window }), 'builtWindowSum'))
    expect(shares.lo).toBe(0)
    expect(shares.hi).toBeCloseTo(1, 4)
  })

  it('comes back 6.0 dB louder than it went in once the frames are a quarter of a frame apart (claim hops-double), in 375 frames (claim hops-frames)', async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const at = (build: number) => stft.render(guitar, { build })
    expectWritten(levelOver(at(STEP.hops), 'built', guitar), '6.0 dB')
    expect(matchesWritten(levelOver(at(STEP.window), 'built', guitar), '6.0 dB')).toBe(false)
    expect(at(STEP.hops).taps.builtPicture!.columns).toBe(375)
    expect(at(STEP.window).taps.builtPicture!.columns).toBe(93)
    // Four windows lie over every sample, and they add up to 2.
    const shares = range(tap(at(STEP.hops), 'builtWindowSum'))
    expect(shares.lo).toBeCloseTo(2, 5)
    expect(shares.hi).toBeCloseTo(2, 5)
  })

  it("returns the input more than 130 dB under itself once the frames are windowed twice and scaled (claim built-back), which is the kit's own overlap-add more than 130 dB under it (claim built-kit)", async () => {
    const stft = await lab(NAME)
    for (const id of ['guitar', 'drums', 'noise']) {
      const source = await benchSource(id, seconds(4))
      const whole = stft.render(source, { build: STEP.overlapAdd })
      expectWritten(
        -lateDifferenceDb(tap(whole, 'built'), source.left, LATENCY),
        'more than 130 dB',
      )
      const kit = tap(whole, 'through')
      expectWritten(-lateDifferenceDb(tap(whole, 'built'), kit, 0), 'more than 130 dB')
      // With the piece off, the frames a hop apart do not add back to what went in.
      const before = stft.render(source, { build: STEP.hops })
      expect(
        matchesWritten(
          -lateDifferenceDb(tap(before, 'built'), source.left, LATENCY),
          'more than 130 dB',
        ),
      ).toBe(false)
      expect(
        matchesWritten(-lateDifferenceDb(tap(before, 'built'), kit, 0), 'more than 130 dB'),
      ).toBe(false)
    }
    const shares = range(
      tap(
        stft.render(await benchSource('guitar', seconds(1)), { build: STEP.overlapAdd }),
        'builtWindowSum',
      ),
    )
    expect(shares.lo).toBeCloseTo(1, 5)
    expect(shares.hi).toBeCloseTo(1, 5)
  })

  it("is Glimmer's own frames, more than 130 dB under them, once every bin is multiplied by its gain (claim built-same)", async () => {
    const stft = await lab(NAME)
    const tried: Record<string, number>[] = [
      {},
      { pattern: 0, grain: 1 },
      { depth: 0.65, pattern: 0, lean: 0.5, vary: 0.35, apart: 0.5 },
      { rate: 6, soft: 0.1, pattern: 3 },
    ]
    for (const id of ['guitar', 'drums', 'pad', 'noise', 'sine']) {
      const source = await benchSource(id, seconds(4))
      for (const values of tried) {
        const result = stft.render(source, { ...values, build: STEP.change })
        expectWritten(-result.checks.builtDifference!, 'more than 130 dB')
        // The lab's figure, and the same worked out here from the two taps.
        expectWritten(
          -lateDifferenceDb(tap(result, 'built'), tap(result, 'wet'), 0),
          'more than 130 dB',
        )
      }
      // With the piece off the frames come back as they went in, which Glimmer's do not.
      const before = stft.render(source, { build: STEP.overlapAdd })
      expect(
        matchesWritten(
          -lateDifferenceDb(tap(before, 'built'), tap(before, 'wet'), 0),
          'more than 130 dB',
        ),
      ).toBe(false)
    }
  })

  it("lifts a lone sine's highest sample 4.7 dB over the input's once its bins are changed (claim built-swell)", async () => {
    const stft = await lab(NAME)
    const tone = await benchSource('sine', seconds(4))
    const over = (build: number) => peakOver(stft.render(tone, { build }), 'built', tone)
    expectWritten(over(STEP.change), '4.7 dB')
    expect(matchesWritten(over(STEP.overlapAdd), '4.7 dB')).toBe(false)
    // The bins that go back are the bins that came, times a gain: lower here, by more than 20 dB.
    const result = stft.render(tone, { build: STEP.change })
    const came = tap(result, 'builtBins')
    const went = tap(result, 'builtChanged')
    let top = 1
    for (let k = 1; k < came.length; k += 1) if (came[k]! > came[top]!) top = k
    expect(came[top]! - went[top]!).toBeGreaterThan(20)
    const plain = stft.render(tone, { build: STEP.overlapAdd })
    expect(tap(plain, 'builtChanged')[top]).toBe(tap(plain, 'builtBins')[top])
  })

  it("puts a unit sample through the build's frames as Glimmer's own do, more than 130 dB under them (claim click-rebuilt)", async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(1))
    for (const values of [{}, { grain: 1 }, { grain: 0 }, { pattern: 0 }, { depth: 0.5 }]) {
      expectWritten(-stft.render(guitar, values).checks.clickRebuilt!, 'more than 130 dB')
    }
  })

  it('keeps what a changed frame throws further than 21 ms from a unit sample under −79 dB with the second window, against −64 dB without it (claim second-window)', async () => {
    const stft = await lab(NAME)
    const result = stft.render(await benchSource('guitar', seconds(1)), {})
    // 1,024 samples: half a frame, and 21.3 ms.
    expectWritten((1024 * 1000) / RATE, '21 ms')
    const twice = farFrom(tap(result, 'clickWet'), 1024)
    const once = farFrom(tap(result, 'clickBare'), 1024)
    expectWritten(twice.top, '−79 dB')
    expectWritten(once.top, '−64 dB')
    expect(matchesWritten(once.top, '−79 dB')).toBe(false)
    // At the sample itself the two are one: four windows add up to 2 there, and half of it is 1.
    const middle = (tap(result, 'clickWet').length - 1) / 2
    expect(tap(result, 'clickBare')[middle]).toBeCloseTo(tap(result, 'clickWet')[middle]!, 3)
    // With no gain to change the bins, neither throws anything anywhere.
    const plain = stft.render(await benchSource('guitar', seconds(1)), { depth: 0 })
    expect(farFrom(tap(plain, 'clickBare'), 2).top).toBeLessThan(-120)
  })

  // ---- the named sets: what each card plays, and the number its card states -------------------

  it('renders every named set on its own source: finite, heard, and under full scale', async () => {
    const stft = await lab(NAME)
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = await played(stft, name)
      const sound = tap(result, set.tap ?? 'out')
      expect(
        sound.every((v) => Number.isFinite(v)),
        name,
      ).toBe(true)
      expect(gainToDb(rms(sound)), `${name} is heard`).toBeGreaterThan(-40)
      expect(gainToDb(peak(sound)), `${name} fits`).toBeLessThan(0)
    }
  })

  it('opens the pass 16 times on the picked guitar (claim picked-pass) and 19 times on the drums (claim hits-pass), and never on the held chords (claim held-never)', async () => {
    const stft = await lab(NAME)
    expect(opened(tap(await played(stft, 'picked'), 'pass')).times).toBe(16)
    expect(opened(tap(await played(stft, 'hits'), 'pass')).times).toBe(19)
    expect(opened(tap(await played(stft, 'held'), 'pass')).times).toBe(0)
  })

  it('moves every band between 3.4 dB under its input and 2.6 dB over it at half Depth (claim half-depth)', async () => {
    const stft = await lab(NAME)
    const gains = range(tap(await played(stft, 'shade'), 'gains'))
    expectWritten(-gains.lo, '3.4 dB')
    expectWritten(gains.hi, '2.6 dB')
  })

  it("starts the page's device table from the device's own defaults: the settings file's defaults, laid over the lab's starting values, are device.json's", async () => {
    const stft = await lab(NAME)
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/glimmer/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[]; latencySamples: number }
    const { values } = resolveSet(stft.description, { values: settings.defaults!.values })
    // The lab has three controls the device does not: the frame's size, where one frame is
    // looked at, and the hop of the overlap-add by hand. Every other control is a parameter.
    const own = ['size', 'at', 'hop']
    const parameters = Object.fromEntries(
      Object.entries(values).filter(([id]) => !own.includes(id)),
    )
    // A value the settings file writes is a double; a starting value the lab keeps (Grain's
    // 0.7) is a 32-bit float. Both are held as floats, which is what the lab is handed.
    const asFloats = (given: Record<string, number>) =>
      Object.fromEntries(Object.entries(given).map(([id, value]) => [id, Math.fround(value)]))
    expect(asFloats(parameters)).toEqual(
      asFloats(Object.fromEntries(device.params.map((one) => [one.key, one.default]))),
    )
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(settings.defaults!.values)) {
      expect(stft.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
    // And the device states the latency this lesson measures.
    expect(device.latencySamples).toBe(LATENCY)
  })
})
