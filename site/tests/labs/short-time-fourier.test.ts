import { describe, expect, it } from 'vitest'
import {
  benchSource,
  click,
  expectSoundLab,
  gainToDb,
  lab,
  peak,
  range,
  RATE,
  rms,
  seconds,
  sine,
  type Source,
} from './support.ts'

const NAME = 'short-time-fourier'
/** The sizes the "Frame" switch offers, in its order. */
const SIZES = [512, 1024, 2048, 4096]
/** Glimmer's latency, and the kit's at a frame of 2,048: a frame and half a hop. */
const LATENCY = 2048 + 256

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

describe('the short-time Fourier transform', () => {
  it('is a sound lab on the guitar: every tap says something, loops, and answers to every control', async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const result = stft.render(guitar, {})
    // At the kit's own hop the windows add up to one flat line, as they should.
    expectSoundLab(stft, guitar, result, { quiet: ['windowSum'] })
  })

  it('returns the input more than 135 dB under itself when nothing is altered, after the latency (claim returned)', async () => {
    const stft = await lab(NAME)
    for (const id of ['guitar', 'drums', 'noise']) {
      const source = await benchSource(id, seconds(4))
      const result = stft.render(source, {})
      // The lab's own figure, and the same worked out here from the two taps.
      expect(result.checks.returned).toBeLessThan(-135)
      const through = result.taps.through!.channels_data[0]!
      expect(lateDifferenceDb(through, source.left, LATENCY)).toBeLessThan(-135)
    }
    // At every size of frame, each with its own latency.
    const guitar = await benchSource('guitar', seconds(4))
    SIZES.forEach((frame, size) => {
      const result = stft.render(guitar, { size })
      const through = result.taps.through!.channels_data[0]!
      expect(result.checks.returned).toBeLessThan(-135)
      expect(lateDifferenceDb(through, guitar.left, frame + frame / 8)).toBeLessThan(-135)
      // One sample out of step and nothing cancels: the latency is that number and no other.
      expect(lateDifferenceDb(through, guitar.left, frame + frame / 8 + 1)).toBeGreaterThan(-40)
    })
  })

  it('puts a unit sample out 2,304 samples later at a frame of 2,048 (claim latency)', async () => {
    const stft = await lab(NAME)
    const result = stft.render(click(seconds(1), 12_000), {})
    const through = result.taps.through!.channels_data[0]!
    expect(loudestAt(through)).toBe(12_000 + 2304)
    expect(through[12_000 + 2304]).toBeCloseTo(1, 5)
  })

  it('is a frame and an eighth late at every size: 576, 1,152 and 4,608 samples at the others (claim latency-sizes)', async () => {
    const stft = await lab(NAME)
    SIZES.forEach((frame, size) => {
      const result = stft.render(click(seconds(1), 12_000), { size })
      expect(loudestAt(result.taps.through!.channels_data[0]!) - 12_000).toBe(frame + frame / 8)
    })
    expect(SIZES.map((frame) => frame + frame / 8)).toEqual([576, 1152, 2304, 4608])
  })

  it('reads a full-scale sine on a bin as 0 dB there, −6.02 dB in each neighbour and nothing elsewhere (claim on-a-bin)', async () => {
    const stft = await lab(NAME)
    // Bin 20 of a frame of 2,048 is 468.75 Hz.
    const result = stft.render(sine((20 * RATE) / 2048, 1, seconds(1)), { at: 0.5 })
    const bins = result.taps.bins!.channels_data[0]!
    expect(bins[20]).toBeCloseTo(0, 3)
    expect(bins[19]).toBeCloseTo(-6.0206, 3)
    expect(bins[21]).toBeCloseTo(-6.0206, 3)
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

  it('shows two tones 30 Hz apart as two peaks at a frame of 4,096 and as one at 2,048 and under (claim two-tones)', async () => {
    const stft = await lab(NAME)
    const pair = both(sine(440, 0.25, seconds(2)), sine(470, 0.25, seconds(2)))
    for (const at of [0.3, 0.71, 1.234]) {
      const counts = SIZES.map((_, size) => {
        const bins = stft.render(pair, { size, at }).taps.bins!.channels_data[0]!
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
    expect(widths[0]).toBeCloseTo(10.67, 1)
    expect(widths[1]).toBeCloseTo(21.33, 1)
    expect(widths[2]).toBeCloseTo(42.67, 1)
    expect(widths[3]).toBeCloseTo(85.33, 1)
  })

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
        const scaled = range(result.taps.windowSum!.channels_data[0]!)
        expect(scaled.lo).toBeGreaterThan(1 - 1e-6)
        expect(scaled.hi).toBeLessThan(1 + 1e-6)
      })
    }
  })

  it('swings between two thirds and four thirds at a hop of half a frame (claim half-hop-swing)', async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(1))
    for (const size of [0, 2, 3]) {
      const swing = range(stft.render(guitar, { size, hop: 0 }).taps.windowSum!.channels_data[0]!)
      expect(swing.lo).toBeCloseTo(2 / 3, 5)
      expect(swing.hi).toBeCloseTo(4 / 3, 5)
    }
  })

  it("overlap-adds by hand to the kit's own output, more than 130 dB under it, at a quarter hop and at an eighth (claim by-hand)", async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    for (const size of [0, 1, 2, 3]) {
      for (const hop of [1, 2]) {
        expect(stft.render(guitar, { size, hop }).checks.byHand).toBeLessThan(-130)
      }
    }
  })

  it('is 12.5 dB under the signal wrong at a hop of half a frame (claim half-hop-error)', async () => {
    const stft = await lab(NAME)
    const tone = stft.render(sine(937.5, 0.5, seconds(2)), { hop: 0 })
    expect(tone.checks.byHand).toBeGreaterThan(-12.8)
    expect(tone.checks.byHand).toBeLessThan(-12.3)
    const guitar = await benchSource('guitar', seconds(4))
    const loop = stft.render(guitar, { hop: 0 })
    expect(loop.checks.byHand).toBeGreaterThan(-13)
    expect(loop.checks.byHand).toBeLessThan(-12)
  })

  it('gives a sine a side tone 46.9 Hz either side, 15.6 dB under it, at a hop of half a frame of 2,048 (claim half-hop-sidebands)', async () => {
    const stft = await lab(NAME)
    // 937.5 Hz is bin 80 of the page's spectrum (4,096 points, 11.72 Hz apart) and goes a whole
    // number of times into the loop; 46.875 Hz is four bins.
    const tone = sine(937.5, 0.5, seconds(2))
    stft.render(tone, { hop: 0 })
    const halved = stft.spectrum('added')
    expect(halved[76]! - halved[80]!).toBeGreaterThan(-15.9)
    expect(halved[76]! - halved[80]!).toBeLessThan(-15.3)
    expect(halved[84]! - halved[80]!).toBeGreaterThan(-15.9)
    expect(halved[84]! - halved[80]!).toBeLessThan(-15.3)
    // At the kit's hop there is none.
    stft.render(tone, { hop: 1 })
    const whole = stft.spectrum('added')
    expect(whole[76]! - whole[80]!).toBeLessThan(-90)
    expect(whole[84]! - whole[80]!).toBeLessThan(-90)
  })

  it('reads a 440 Hz sine as 440.0 Hz from the turn of its phase, in a bin centred on 445.3 Hz (claim phase-440)', async () => {
    const stft = await lab(NAME)
    const result = stft.render(await benchSource('sine', seconds(4)), {})
    const turning = range(result.taps.turning!.channels_data[0]!)
    expect(turning.lo).toBeGreaterThan(439.95)
    expect(turning.hi).toBeLessThan(440.05)
    const loudest = range(result.taps.loudest!.channels_data[0]!)
    expect(loudest.lo).toBeCloseTo(445.3125, 3)
    expect(loudest.hi).toBeCloseTo(445.3125, 3)
    // And anywhere else between two bins.
    for (const hz of [100, 1000, 3000.5]) {
      const found = range(
        stft.render(sine(hz, 0.5, seconds(2)), {}).taps.turning!.channels_data[0]!,
      )
      expect(found.lo).toBeGreaterThan(hz - 0.05)
      expect(found.hi).toBeLessThan(hz + 0.05)
    }
  })

  it("works Glimmer's gain per bin out again from its bands, within 0.001 dB of what its frames show (claim gain-rebuilt)", async () => {
    const stft = await lab(NAME)
    const settings: Record<string, number>[] = [
      {},
      { pattern: 0 },
      { pattern: 3, grain: 0.2, rate: 5 },
      { depth: 0.4, grain: 1 },
    ]
    for (const id of ['guitar', 'chords', 'noise']) {
      const source = await benchSource(id, seconds(4))
      for (const values of settings) {
        expect(stft.render(source, values).checks.gainRebuilt).toBeLessThan(0.001)
      }
    }
  })

  it('is the input 2,304 samples late with Depth at 0, more than 135 dB under it (claim depth-zero)', async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const result = stft.render(guitar, { depth: 0 })
    expect(lateDifferenceDb(result.taps.out!.channels_data[0]!, guitar.left, LATENCY)).toBeLessThan(
      -135,
    )
    expect(
      lateDifferenceDb(result.taps.out!.channels_data[1]!, guitar.right, LATENCY),
    ).toBeLessThan(-135)
    // Every gain is 1.
    const gains = range(result.taps.gains!.channels_data[0]!)
    expect(gains.lo).toBe(0)
    expect(gains.hi).toBe(0)
  })

  it('holds the level of white noise within 0.1 dB while its bands fall to silence and come back (claim level-held)', async () => {
    const stft = await lab(NAME)
    const hiss = await benchSource('noise', seconds(4))
    for (const values of [
      {},
      { pattern: 0 },
      { pattern: 3 },
      { grain: 0 },
      { grain: 1 },
      { rate: 0.25 },
    ]) {
      const result = stft.render(hiss, values)
      const out = result.taps.out!.channels_data[0]!
      expect(Math.abs(gainToDb(rms(out)) - gainToDb(rms(hiss.left)))).toBeLessThan(0.1)
      // The bands do go dark: the lowest gain is silence.
      expect(range(result.taps.gains!.channels_data[0]!).lo).toBeLessThan(-100)
    }
  })

  it('stands a band 4.9 dB over its input at the top of its flash (claim flash), and a lone sine 4.7 dB over its own peak (claim sine-swells)', async () => {
    const stft = await lab(NAME)
    const tone = await benchSource('sine', seconds(4))
    const result = stft.render(tone, {})
    const highest = range(result.taps.gains!.channels_data[0]!).hi
    expect(highest).toBeGreaterThan(4.7)
    expect(highest).toBeLessThan(5.0)
    const out = result.taps.out!.channels_data[0]!
    const over = gainToDb(peak(out)) - gainToDb(peak(tone.left))
    expect(over).toBeGreaterThan(4.5)
    expect(over).toBeLessThan(4.9)
    // Over the loop the level is the input's.
    expect(Math.abs(gainToDb(rms(out)) - gainToDb(rms(tone.left)))).toBeLessThan(0.2)
  })

  it("leaves a unit sample 0.77 high in Glimmer's frames with a fifth of its energy ahead of it and as much behind (claim click-smear)", async () => {
    const stft = await lab(NAME)
    const result = stft.render(await benchSource('guitar', seconds(1)), {})
    const smeared = result.taps.clickWet!.channels_data[0]!
    const middle = (smeared.length - 1) / 2
    expect(smeared[middle]).toBeGreaterThan(0.75)
    expect(smeared[middle]).toBeLessThan(0.79)
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
    const result = stft.render(await benchSource('guitar', seconds(1)), {})
    const smeared = result.taps.clickWet!.channels_data[0]!
    const middle = (smeared.length - 1) / 2
    const before = gainToDb(peak(smeared.subarray(0, middle)))
    expect(before).toBeGreaterThan(-15)
    expect(before).toBeLessThan(-14)
    // And nothing of it is left once Depth is 0: the frames add back to the one sample.
    const plain = stft.render(await benchSource('guitar', seconds(1)), { depth: 0 })
    const whole = plain.taps.clickWet!.channels_data[0]!
    expect(whole[middle]).toBeCloseTo(1, 5)
    expect(gainToDb(peak(whole.subarray(0, middle)))).toBeLessThan(-120)
  })

  it('puts the unit sample out whole and nothing ahead of it over −80 dB (claim click-passed)', async () => {
    const stft = await lab(NAME)
    const result = stft.render(await benchSource('guitar', seconds(1)), {})
    const passed = result.taps.clickOut!.channels_data[0]!
    const middle = (passed.length - 1) / 2
    expect(passed[middle]).toBe(1)
    expect(gainToDb(peak(passed.subarray(0, middle)))).toBeLessThan(-80)
    // From 1,024 samples ahead of it to 256 behind, the device is on the dry sound alone.
    for (let i = middle - 1024; i <= middle + 256; i += 1) {
      if (i !== middle) expect(passed[i]).toBe(0)
    }
  })

  it('is the input sample for sample, 2,304 late, from 21 ms ahead of an attack to 6 ms after it (claim attack-dry)', async () => {
    const stft = await lab(NAME)
    // In the loop, on a click: where the pass is full.
    const at = 24_000 + LATENCY
    const one = stft.render(click(seconds(1), 24_000), {})
    const pass = one.taps.pass!.channels_data[0]!
    const full: number[] = []
    pass.forEach((value, k) => {
      if (value >= 1) full.push(k * 16 - at)
    })
    // A point of the pass every 16 samples, an attack placed to the nearest segment of 64.
    expect(Math.abs(full[0]! + 1024)).toBeLessThanOrEqual(64)
    expect(Math.abs(full[full.length - 1]! - 304)).toBeLessThanOrEqual(64)

    // And on the guitar: wherever the pass is full, the output is the dry sound and the frames' sum is not.
    const guitar = await benchSource('guitar', seconds(4))
    const loop = stft.render(guitar, {})
    const out = loop.taps.out!.channels_data[0]!
    const wet = loop.taps.wet!.channels_data[0]!
    const turned = loop.taps.pass!.channels_data[0]!
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

  it('takes 375 frames of the four-second loop at a frame of 2,048 (claim frames-count)', async () => {
    const stft = await lab(NAME)
    const result = stft.render(await benchSource('guitar', seconds(4)), {})
    expect(result.taps.picture!.columns).toBe(375)
    expect(result.taps.pictureOut!.columns).toBe(375)
  })

  it('puts 3 % of the unit sample ahead of it at Depth 0.5 and 21 % at full Depth (claim smear-depth), 5 samples ahead on average at Grain 0 and 62 at Grain 1 (claim smear-grain)', async () => {
    const stft = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(1))
    // The share of the energy that lies ahead of the sample, and how far ahead it lies on average.
    const ahead = (values: Record<string, number>) => {
      const smeared = stft.render(guitar, values).taps.clickWet!.channels_data[0]!
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
    expect(half.share).toBeGreaterThan(0.025)
    expect(half.share).toBeLessThan(0.035)
    expect(full.share).toBeGreaterThan(0.2)
    expect(full.share).toBeLessThan(0.22)
    // Depth moves how much, and not how far.
    expect(Math.abs(half.samples - full.samples)).toBeLessThan(0.5)
    const broad = ahead({ grain: 0 })
    const narrow = ahead({ grain: 1 })
    expect(broad.samples).toBeGreaterThan(4.5)
    expect(broad.samples).toBeLessThan(5.5)
    expect(narrow.samples).toBeGreaterThan(60)
    expect(narrow.samples).toBeLessThan(63)
  })

  it('never opens the pass on a steady sine, saw or noise (claim steady-never)', async () => {
    const stft = await lab(NAME)
    for (const id of ['sine', 'saw', 'noise']) {
      const result = stft.render(await benchSource(id, seconds(4)), {})
      expect(range(result.taps.pass!.channels_data[0]!).hi).toBe(0)
    }
  })
})
