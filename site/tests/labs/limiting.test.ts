import { describe, expect, it } from 'vitest'
import { TruePeakDetector } from '../../../src/core/analysis/loudness.ts'
import {
  benchSource,
  click,
  dbToGain,
  expectSoundLab,
  gainToDb,
  lab,
  peak,
  POINT_RATE,
  RATE,
  rms,
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

/** With SAY=1 a test prints what it measured: the numbers the lesson states were read here. */
const SAY = process.env.SAY === '1'
const say = (...words: unknown[]) => SAY && console.log(...words)

const most = (x: Float32Array) => x.reduce((top, v) => Math.max(top, v), -Infinity)
const least = (x: Float32Array) => x.reduce((low, v) => Math.min(low, v), Infinity)

/** The true peak of a loop as the engine's own meter reads it (src/core/analysis/loudness.ts), in dB. */
function meterDb(channels: Float32Array[]): number {
  let top = 0
  for (const x of channels) {
    const detector = new TruePeakDetector(RATE)
    // Twice round, so the filter's memory at the loop's start holds the loop's end.
    for (const v of x) detector.push(v)
    for (const v of x) top = Math.max(top, detector.push(v))
  }
  return gainToDb(top)
}

/**
 * The largest size of a loop's wave at `factor` points to the sample, in dB, by a ruler that owes
 * the device nothing: a sinc 32 samples long either side, under a Hann window.
 */
function sincDb(channels: Float32Array[], factor: number): number {
  const half = 32
  const tables = Array.from({ length: factor }, (_, p) => {
    const h = new Float64Array(2 * half)
    for (let k = -half + 1; k <= half; k += 1) {
      const t = k - p / factor
      const window = Math.abs(t) < half ? 0.5 + 0.5 * Math.cos((Math.PI * t) / half) : 0
      h[k + half - 1] = (t === 0 ? 1 : Math.sin(Math.PI * t) / (Math.PI * t)) * window
    }
    return h
  })
  let top = 0
  for (const x of channels) {
    const n = x.length
    // The loop, with its end before its start and its start after its end.
    const round = new Float32Array(n + 2 * half)
    for (let i = 0; i < round.length; i += 1) round[i] = x[(i - half + n) % n]!
    for (let i = 0; i < n; i += 1) {
      for (const h of tables) {
        let y = 0
        for (let k = 0; k < 2 * half; k += 1) y += round[i + 1 + k]! * h[k]!
        top = Math.max(top, Math.abs(y))
      }
    }
  }
  return gainToDb(top)
}

/** The mean power of both channels, in dB. */
const levelDb = (channels: Float32Array[]) =>
  gainToDb(Math.sqrt(channels.reduce((sum, x) => sum + rms(x) ** 2, 0) / channels.length))

const sampleDb = (channels: Float32Array[]) => gainToDb(Math.max(...channels.map(peak)))

/** A sine at a quarter of the sample rate, 12 kHz, sampled 45 degrees from its crests. */
function quarterTone(frames: number): Source {
  const source = silence(frames)
  for (let i = 0; i < frames; i += 1) {
    source.left[i] = Math.sin(2 * Math.PI * (0.25 * i + 0.125))
    source.right[i] = source.left[i]!
  }
  return source
}

/** A close view's points by their place in samples: 0 is the sample the peak comes out on. */
function near(tap: { channels_data: Float32Array[] }) {
  const data = tap.channels_data[0]!
  return (place: number) => data[place + 144]!
}

describe('limiting and true peaks', () => {
  it('is a sound lab on the drums: every tap says something, loops, and answers to every control', async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const result = limiter.render(drums, {})
    // The ceiling drawn across the close view is one value: that is what a ceiling is.
    expectSoundLab(limiter, drums, result, { quiet: ['nearCeiling'] })
  })

  it("holds the drums pushed 12 dB to the ceiling on the engine's own meter, within 0.01 dB (claim ceiling-held): a thousandth over (claim own-ruler-over)", async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const out = limiter.render(drums, { push: 12, ceiling: -1 })
    const read = meterDb(out.taps.out!.channels_data)
    say('ceiling-held: meter', read, 'samples', sampleDb(out.taps.out!.channels_data))
    expect(read).toBeLessThanOrEqual(-1 + 0.01)
    // It is a thousandth of a decibel over, not under.
    expect(read + 1).toBeGreaterThan(0.0005)
    expect(read + 1).toBeLessThan(0.0015)
    expect(sampleDb(out.taps.out!.channels_data)).toBeLessThanOrEqual(-1)
    // The lab's own trace of the output's true peak says the same.
    expect(most(out.taps.outPeak!.channels_data[0]!)).toBeLessThanOrEqual(-1 + 0.01)
    // And at other ceilings, on other sounds.
    for (const [id, ceiling] of [
      ['guitar', -6],
      ['noise', -1],
      ['saw', -12],
    ] as const) {
      const source = await benchSource(id, seconds(2))
      const other = limiter.render(source, { push: 18, ceiling })
      expect(meterDb(other.taps.out!.channels_data)).toBeLessThanOrEqual(ceiling + 0.01)
    }
  })

  it('reads 0.14 dB over the ceiling on those drums by a long sinc at 4 points to the sample (claim sharper-ruler-4) and 0.17 dB at 16 (claim sharper-ruler-16)', async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const out = limiter.render(drums, { push: 12, ceiling: -1 }).taps.out!.channels_data
    const four = sincDb(out, 4) + 1
    const sixteen = sincDb(out, 16) + 1
    say('sharper-ruler', four, sixteen)
    expect(four).toBeGreaterThan(0.14 - 0.03)
    expect(four).toBeLessThan(0.14 + 0.03)
    expect(sixteen).toBeGreaterThan(0.17 - 0.03)
    expect(sixteen).toBeLessThan(0.17 + 0.03)
  })

  it('delays a click by 77 samples, the latency the device reports (claim delay-77)', async () => {
    const limiter = await lab('limiting')
    // Half full scale under a ceiling of 0 dB: nothing to turn down.
    const out = limiter.render(click(seconds(0.5), 5000, 0.5), { push: 0, ceiling: 0 })
    for (const data of out.taps.out!.channels_data) {
      expect(data[5077]).toBe(0.5)
      expect(data.filter((v) => v !== 0).length).toBe(1)
    }
    expect(out.checks.latency).toBe(77)
  })

  it('passes drums that stay under the ceiling unchanged but for the delay, sample for sample (claim under-unchanged)', async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const out = limiter.render(drums, { push: 0, ceiling: 0 })
    const frames = drums.left.length
    const late = (x: Float32Array) => (_: number, i: number) => x[(i - 77 + frames) % frames]!
    expect(out.taps.out!.channels_data[0]).toEqual(drums.left.map(late(drums.left)))
    expect(out.taps.out!.channels_data[1]).toEqual(drums.right.map(late(drums.right)))
    expect(out.taps.gain!.channels_data[0]!.every((v) => v === 0)).toBe(true)
  })

  it('turns the loudest hit of the drums pushed 12 dB down 9.3 dB (claim deepest), and brings the loop out 6.1 dB higher in mean power (claim louder) with its highest sample 2.8 dB higher (claim peak-rise)', async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const out = limiter.render(drums, { push: 12, ceiling: -1 })
    const deepest = least(out.taps.gain!.channels_data[0]!)
    const louder = levelDb(out.taps.out!.channels_data) - levelDb([drums.left, drums.right])
    const rise = sampleDb(out.taps.out!.channels_data) - sampleDb([drums.left, drums.right])
    say('deepest', deepest, 'louder', louder, 'rise', rise)
    expect(deepest).toBeCloseTo(-9.3, 1)
    expect(louder).toBeCloseTo(6.1, 1)
    expect(rise).toBeCloseTo(2.8, 1)
  })

  it('finds a 12 kHz sine sampled 45 degrees off its crests 3.01 dB over its samples by trigonometry (claim quarter-rate), reads it 3.05 dB over them (claim detector-reads), and turns it down 1.04 dB under a ceiling 2 dB above every sample (claim unseen)', async () => {
    const limiter = await lab('limiting')
    const tone = quarterTone(seconds(0.5))
    expect(gainToDb(peak(tone.left))).toBeCloseTo(-3.01, 2)
    // The crest is at 0 dB: the long sinc finds it.
    expect(sincDb([tone.left], 16)).toBeCloseTo(0, 2)
    const open = limiter.render(tone, { push: 0, ceiling: 0 })
    const reads = most(open.taps.peak!.channels_data[0]!) - gainToDb(peak(tone.left))
    say('detector-reads', reads, 'overshoot check', open.checks.overshoot)
    expect(reads).toBeCloseTo(3.05, 2)
    expect(open.checks.overshoot).toBeCloseTo(3.05, 2)
    const shut = limiter.render(tone, { push: 0, ceiling: -1 })
    const gain = shut.taps.gain!.channels_data[0]!
    say('unseen', least(gain), most(gain))
    expect(sampleDb([tone.left])).toBeLessThan(-1 - 2)
    expect(least(gain)).toBeCloseTo(-1.04, 2)
    expect(most(gain)).toBeCloseTo(-1.04, 2)
  })

  it('puts its four points an eighth, three, five and seven eighths of the way across each gap', async () => {
    const limiter = await lab('limiting')
    const out = limiter.render(quarterTone(seconds(0.5)), { push: 0, ceiling: 0 })
    const points = out.taps.toneBetween!.channels_data[0]!
    const samples = out.taps.toneSamples!.channels_data[0]!
    expect(samples[0]).toBeCloseTo(Math.SQRT1_2, 5)
    expect(samples[1]).toBeCloseTo(Math.SQRT1_2, 5)
    // Between two equal samples the four are a mirror of themselves, and each is the sine there.
    expect(points[0]).toBeCloseTo(points[3]!, 5)
    expect(points[1]).toBeCloseTo(points[2]!, 5)
    for (let q = 0; q < 8; q += 1) {
      const exact = Math.sin(2 * Math.PI * (0.25 * (0.125 + q / 4) + 0.125))
      expect(Math.abs(points[q]! - exact)).toBeLessThan(0.03)
    }
  })

  it('reads twelve samples of size 1, their signs chosen against it, 6.12 dB over them (claim worst-case)', async () => {
    const limiter = await lab('limiting')
    // The signs of the second row of the filter's table, latest sample first.
    const signs = [-1, 1, -1, 1, -1, 1, 1, -1, 1, -1, 1, -1]
    const source = silence(seconds(0.5))
    signs.forEach((sign, i) => {
      source.left[4011 - i] = sign
      source.right[4011 - i] = sign
    })
    const out = limiter.render(source, { push: 0, ceiling: 0 })
    say('worst-case', most(out.taps.peak!.channels_data[0]!))
    expect(most(out.taps.peak!.channels_data[0]!)).toBeCloseTo(6.12, 2)
  })

  it('gives both channels one gain: a loud left turns a quiet right down by as much (claim linked)', async () => {
    const limiter = await lab('limiting')
    const frames = seconds(1)
    const source: Source = {
      left: sine(1000, dbToGain(5), frames).left,
      right: sine(300, dbToGain(-20), frames).left,
    }
    const out = limiter.render(source, { push: 0, ceiling: -1 })
    // The left is 6 dB over the ceiling. The right, alone, is 19 dB under it.
    const gain = out.taps.gain!.channels_data[0]!
    const right = gainToDb(peak(out.taps.out!.channels_data[1]!)) + 20
    say('linked', right, least(gain), most(gain))
    expect(least(gain)).toBeCloseTo(-6, 1)
    expect(right).toBeCloseTo(least(gain), 2)
  })

  it('brings a 1 kHz tone 12 dB over the ceiling out at the ceiling, within 0.01 dB (claim at-the-ceiling)', async () => {
    const limiter = await lab('limiting')
    const out = limiter.render(sine(1000, dbToGain(11), seconds(1)), { push: 0, ceiling: -1 })
    const at = sampleDb(out.taps.out!.channels_data)
    say('at-the-ceiling', at)
    expect(at).toBeLessThanOrEqual(-1)
    expect(at).toBeGreaterThan(-1.01)
  })

  it('measures the curve the formula draws, within 0.01 dB (claim curve-error)', async () => {
    const limiter = await lab('limiting')
    const quiet = silence(seconds(0.25))
    for (const values of [{}, { ceiling: -12, release: 10 }, { ceiling: 0, release: 2000 }]) {
      expect(limiter.render(quiet, values).checks.curveError).toBeLessThan(0.01)
    }
  })

  it('has the gain 63 % of the way back 101 ms after its lowest, at a release of 100 ms (claim release-100)', async () => {
    const limiter = await lab('limiting')
    const out = limiter.render(click(seconds(4), seconds(1)), {
      push: 12,
      ceiling: -1,
      release: 100,
    })
    const gain = Array.from(out.taps.gain!.channels_data[0]!, dbToGain)
    const lowest = gain.indexOf(Math.min(...gain))
    const back = 1 - (1 - gain[lowest]!) * Math.exp(-1)
    let k = lowest
    while (k < gain.length && gain[k]! < back) k += 1
    const ms = ((k - lowest) * 1000) / POINT_RATE
    say('release-100', ms)
    expect(ms).toBeGreaterThan(101 - 1)
    expect(ms).toBeLessThan(101 + 1)
  })

  it('comes to rest 0.0012 dB short of no reduction at a release of 100 ms (claim rests-short)', async () => {
    const limiter = await lab('limiting')
    const out = limiter.render(click(seconds(4), seconds(1)), {
      push: 12,
      ceiling: -1,
      release: 100,
    })
    const gain = out.taps.gain!.channels_data[0]!
    const rest = gain[gain.length - 1]!
    say('rests-short', rest)
    expect(rest).toBeLessThan(-0.0011)
    expect(rest).toBeGreaterThan(-0.0013)
    // It has stopped: the last second is one value.
    expect(gain.subarray(gain.length - 3000).every((v) => v === rest)).toBe(true)
  })

  it('holds the lowest gain a click asks for through 73 samples (claim held-73)', async () => {
    const limiter = await lab('limiting')
    // A loop long enough for the gain to be at rest again when the click comes round.
    const out = limiter.render(click(seconds(2), 5000), { push: 12, ceiling: -1 })
    // In the loop, and in the lab's own view of one click through a second device.
    for (const id of ['nearMinimum', 'clickMinimum']) {
      const minimum = out.taps[id]!.channels_data[0]!
      const lowest = least(minimum)
      const held = Array.from(minimum.keys()).filter((p) => minimum[p] === lowest)
      say('held-73', id, held.length, held[0]! - 144, held[held.length - 1]! - 144)
      expect(held.length).toBe(73)
      expect(held[0]! - 144).toBe(-71)
      expect(held[held.length - 1]! - 144).toBe(1)
    }
  })

  it('starts the gain down 72 samples before a click comes out (claim ramp-72), in a straight line (claim ramp-straight), and reaches the lowest on the sample it comes out and the one after (claim bottom-on-peak)', async () => {
    const limiter = await lab('limiting')
    const out = limiter.render(click(seconds(2), 5000), { push: 12, ceiling: -1 })
    // The click goes in 77 samples before it comes out, four times its size after the push.
    expect(near(out.taps.nearPushed!)(-77)).toBeCloseTo(dbToGain(12), 4)
    expect(near(out.taps.nearDelayed!)(0)).toBeCloseTo(dbToGain(12), 4)
    // It comes out on the ceiling.
    expect(near(out.taps.nearOut!)(0)).toBeCloseTo(dbToGain(-1), 6)
    // In the loop the click is 13 dB over the ceiling; the lab's own click is four times it.
    for (const [id, depth] of [
      ['nearGain', dbToGain(-13)],
      ['clickGain', 0.25],
    ] as const) {
      const gain = near(out.taps[id]!)
      // Before the ramp the gain stands still; from 72 before, every sample is lower than the last.
      expect(gain(-73)).toBe(gain(-74))
      for (let n = -72; n <= 0; n += 1) expect(gain(n)).toBeLessThan(gain(n - 1))
      // The lowest is what the click asks for: on the sample it comes out, and on the next.
      const lowest = least(out.taps[id]!.channels_data[0]!)
      expect(lowest).toBeCloseTo(depth, 5)
      expect(gain(0)).toBe(lowest)
      expect(gain(1)).toBe(lowest)
      expect(gain(-1)).toBeGreaterThan(lowest)
      expect(gain(2)).toBeGreaterThan(lowest)
      // A straight line in gain: of the 70 steps between, none differs from their mean by 1 %.
      // (The detector catches the click a step early and a little short, through the last
      // point of the gap before it, so the first step and the last are smaller ones.)
      const mean = (gain(-71) - gain(-1)) / 70
      for (let n = -70; n <= -1; n += 1) {
        expect(Math.abs(gain(n - 1) - gain(n) - mean)).toBeLessThan(0.01 * mean)
      }
      expect(mean).toBeCloseTo((1 - lowest) / 72, 4)
      say('ramp', id, gain(-73), gain(-72), gain(-71), gain(-36), lowest, mean)
    }
  })

  it("works the gain out again from the detector's reading with no difference from the device's (claim rebuilt-zero)", async () => {
    const limiter = await lab('limiting')
    for (const id of ['drums', 'noise', 'clicks', 'chords']) {
      const source = await benchSource(id, seconds(4))
      expect(limiter.render(source, {}).checks.rebuilt).toBe(0)
      expect(limiter.render(source, { push: 24, ceiling: -12, release: 10 }).checks.rebuilt).toBe(0)
    }
  })

  it('never needs its last clip on the drums pushed 12 dB: it changes no sample (claim clip-idle)', async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const out = limiter.render(drums, { push: 12, ceiling: -1 })
    expect(out.checks.clipped).toBe(0)
    // The gain did the work: there was plenty to turn down.
    expect(least(out.taps.gain!.channels_data[0]!)).toBeLessThan(-9)
  })

  it('swings the gain 3.0 dB inside each half cycle of a 55 Hz tone 7 dB over the ceiling at a release of 10 ms (claim low-10), and 0.57 dB at 100 ms (claim low-100)', async () => {
    const limiter = await lab('limiting')
    const tone = sine(55, dbToGain(6), seconds(2))
    const swing = (release: number) => {
      const gain = limiter.render(tone, { push: 0, ceiling: -1, release }).taps.gain!
        .channels_data[0]!
      const settled = gain.subarray(gain.length / 2)
      return most(settled) - least(settled)
    }
    say('low', swing(10), swing(100))
    expect(swing(10)).toBeCloseTo(3.0, 1)
    expect(swing(100)).toBeGreaterThan(0.57 - 0.03)
    expect(swing(100)).toBeLessThan(0.57 + 0.03)
  })

  it('lets white noise pushed 12 dB read 1.8 dB over the ceiling on the long sinc while its own detector reads the ceiling (claim noise-over)', async () => {
    const limiter = await lab('limiting')
    const source = await benchSource('noise', seconds(4))
    const out = limiter.render(source, { push: 12, ceiling: -1 }).taps.out!.channels_data
    const over = sincDb(out, 16) + 1
    say('noise-over', over, meterDb(out))
    expect(over).toBeGreaterThan(1.8 - 0.1)
    expect(over).toBeLessThan(1.8 + 0.1)
    expect(meterDb(out)).toBeLessThanOrEqual(-1 + 0.01)
  })

  it('keeps a tone whole to 20 kHz in its two middle points and loses 3.0 dB of it at 22 kHz (claim inner-22k), and 0.5 dB in the two nearest a sample (claim outer-22k)', async () => {
    const limiter = await lab('limiting')
    const out = limiter.render(silence(seconds(0.25)), {})
    const inner = out.taps.responseInner!
    const outer = out.taps.responseOuter!
    expect(inner.x1).toBe(24)
    // A point every 250 Hz: 22 kHz is the 88th.
    say(
      'response',
      inner.channels_data[0]![88],
      outer.channels_data[0]![88],
      most(inner.channels_data[0]!.subarray(0, 81)),
      least(inner.channels_data[0]!.subarray(0, 81)),
    )
    expect(inner.channels_data[0]![88]).toBeCloseTo(-3.0, 1)
    expect(outer.channels_data[0]![88]).toBeCloseTo(-0.5, 1)
    for (const row of [inner, outer]) {
      const upTo20k = row.channels_data[0]!.subarray(0, 81)
      expect(most(upTo20k)).toBeLessThan(0.3)
      expect(least(upTo20k)).toBeGreaterThan(-0.3)
    }
  })
  it('meets only rounding at its last clip on the drums pushed 24 dB: one sample, less than a millionth of a decibel over (claim clip-rounding)', async () => {
    const limiter = await lab('limiting')
    const drums = await benchSource('drums', seconds(4))
    const out = limiter.render(drums, { push: 24, ceiling: -1 })
    say('clip-rounding', out.checks.clipped, out.checks.clipDepth)
    expect(out.checks.clipped).toBe(1)
    expect(out.checks.clipDepth).toBeGreaterThan(0)
    expect(out.checks.clipDepth).toBeLessThan(1e-6)
  })
})
