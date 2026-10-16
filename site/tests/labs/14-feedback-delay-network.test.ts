import { describe, expect, it } from 'vitest'
import {
  benchSource,
  dbToGain,
  expectSoundLab,
  lab,
  seconds,
  silence,
  type Source,
} from './support.ts'

const NAME = '14-feedback-delay-network'
const RATE = 48_000

/** The line lengths in fdn_reverb.h, at its reference rate of 44.1 kHz. */
const REFERENCE = [4799, 5399, 5801, 6199, 6599, 6997, 7393, 7789]
/** What they come to at 48 kHz: each times 48000 / 44100, cut to a whole number. */
const LENGTHS = [5223, 5876, 6314, 6747, 7182, 7615, 8046, 8477]
const MEAN = LENGTHS.reduce((sum, length) => sum + length, 0) / LENGTHS.length

/** One unit sample at the start of `length` seconds of silence. */
function click(length: number, peak = 1): Source {
  const source = silence(seconds(length))
  source.left[0] = peak
  source.right[0] = peak
  return source
}

interface Curve {
  channels_data: Float32Array[]
  x0: number
  x1: number
}

/** The least-squares line through points (x, y): its slope. */
function slope(points: [number, number][]): number {
  let n = 0
  let sx = 0
  let sy = 0
  let sxx = 0
  let sxy = 0
  for (const [x, y] of points) {
    n += 1
    sx += x
    sy += y
    sxx += x * x
    sxy += x * y
  }
  return (n * sxy - sx * sy) / (n * sxx - sx * sx)
}

/**
 * Seconds to fall 60 dB, from the line fitted to an energy decay curve between 5 dB and
 * 35 dB down: the usual way a decay time is read off such a curve.
 */
function decayTime(curve: Curve, from = -5, to = -35): number {
  const data = curve.channels_data[0]!
  const points: [number, number][] = []
  for (let i = 0; i < data.length; i += 1) {
    const y = data[i]!
    if (y > from) continue
    if (y < to) break
    points.push([curve.x0 + ((curve.x1 - curve.x0) * i) / (data.length - 1), y])
  }
  return -60 / slope(points)
}

/** Seconds to fall 60 dB, from the energy of a response in quarter-second windows from `from` to `to` seconds. */
function lateDecayTime(response: Float32Array, from = 0.5, to = 2): number {
  const points: [number, number][] = []
  for (let t = from; t + 0.25 <= to + 1e-9; t += 0.25) {
    let sum = 0
    for (let i = Math.round(t * RATE); i < Math.round((t + 0.25) * RATE); i += 1)
      sum += response[i]! ** 2
    points.push([t, 10 * Math.log10(sum)])
  }
  return -60 / slope(points)
}

/** The value of a curve whose points stand in even ratios from x0 to x1, at `x`. */
function atRatio(curve: Curve, x: number): number {
  const data = curve.channels_data[0]!
  const place = (Math.log(x / curve.x0) / Math.log(curve.x1 / curve.x0)) * (data.length - 1)
  return data[Math.round(place)]!
}

function range(x: Float32Array, from = 0, to = x.length): number {
  let lo = Infinity
  let hi = -Infinity
  for (let i = from; i < to; i += 1) {
    lo = Math.min(lo, x[i]!)
    hi = Math.max(hi, x[i]!)
  }
  return hi - lo
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

describe('lesson 14: the feedback delay network', () => {
  it('is a sound lab on the clicks: every tap says something, loops, and answers to every control', async () => {
    const fdn = await lab(NAME)
    const clicks = await benchSource('clicks', seconds(2))
    const result = fdn.render(clicks, {})
    // With the breath at 0 its gain on the input is 1 throughout.
    expectSoundLab(fdn, clicks, result, { quiet: ['gate'] })
  })

  it("keeps energy in both of the kit's mixing matrices: every column of unit length and at right angles to the others, within 1e-5 (claim matrix-keeps)", async () => {
    const fdn = await lab(NAME)
    const { checks } = fdn.render(click(1), {})
    expect(checks.keeps).toBeLessThan(1e-5)
    expect(checks.keepsHouseholder).toBeLessThan(1e-5)
  })

  it("finds the device's own matrix to be the kit's Hadamard, entry for entry (claim same-matrix)", async () => {
    const fdn = await lab(NAME)
    expect(fdn.render(click(1), {}).checks.sameMatrix).toBe(0)
  })

  it('runs the eight lines at 5,223 to 8,477 samples at 48 kHz, 108.8 ms to 176.6 ms (claim lengths-48k)', async () => {
    const fdn = await lab(NAME)
    const ms = fdn.render(click(1), {}).taps.lengths!.channels_data[0]!
    expect(Array.from(ms, (v) => Math.round((v * RATE) / 1000))).toEqual(LENGTHS)
    expect(LENGTHS).toEqual(REFERENCE.map((length) => Math.floor((length * 48000) / 44100)))
    expect(ms[0]!).toBeCloseTo(108.8, 1)
    expect(ms[7]!).toBeCloseTo(176.6, 1)
    // Size scales every one of them.
    const doubled = fdn.render(click(1), { size: 2 }).taps.lengths!.channels_data[0]!
    doubled.forEach((v, i) => expect(v).toBeCloseTo(2 * ms[i]!, 3))
  })

  it('hears nothing from line 1 until 5,223 samples after a click, and from line 8 until 8,477 (claim first-out)', async () => {
    const fdn = await lab(NAME)
    // A decay so short that the tail of the pass before is over. "Nothing" is under −120 dB:
    // see the residue test below for what is left.
    const out = fdn.render(click(2), { decay: 0.1 })
    const first = (x: Float32Array) => x.findIndex((v) => Math.abs(v) > 1e-6)
    expect(first(out.taps.diffused!.channels_data[0]!)).toBe(0)
    expect(first(out.taps.written!.channels_data[0]!)).toBe(0)
    expect(first(out.taps.line1!.channels_data[0]!)).toBe(5223)
    expect(first(out.taps.line8!.channels_data[0]!)).toBe(8477)
  })

  it('leaves a residue of about 1e-7 that changes sign every sample when the lines stand still at a whole number of samples, and exact zeros at any other length (claim still-residue)', async () => {
    const fdn = await lab(NAME)
    const still = fdn.render(click(2), { decay: 0.1, size: 1 }).taps.line1!.channels_data[0]!
    // Two seconds after the click before, long after its tail: not zero, and alternating.
    for (let i = 1000; i < 1100; i += 1) {
      expect(Math.abs(still[i]!)).toBeGreaterThan(2e-8)
      expect(Math.abs(still[i]!)).toBeLessThan(5e-7)
      expect(Math.sign(still[i]!)).toBe(-Math.sign(still[i - 1]!))
    }
    const between = fdn.render(click(2), { decay: 0.1, size: 1.01 }).taps.line1!.channels_data[0]!
    expect(between.subarray(0, 5000).every((v) => v === 0)).toBe(true)
    const moving = fdn.render(click(2), { decay: 0.1, wander: 1 }).taps.line1!.channels_data[0]!
    expect(moving.subarray(0, 5000).every((v) => v === 0)).toBe(true)
  })

  it('makes one line alone a comb: an echo every 5,223 samples, each 5.78 dB under the last (claim comb-step), gone 60 dB in 1.13 s (claim comb-alone), with a tooth every 9.19 Hz (claim comb-teeth)', async () => {
    const fdn = await lab(NAME)
    const out = fdn.render(click(1), { decay: 1.5 })
    const comb = out.taps.comb!.channels_data[0]!
    const echoes: number[] = []
    comb.forEach((v, i) => v !== 0 && echoes.push(i))
    expect(echoes.slice(0, 4)).toEqual([5223, 10446, 15669, 20892])
    const step = 20 * Math.log10(comb[10446]! / comb[5223]!)
    expect(step).toBeGreaterThan(-5.79)
    expect(step).toBeLessThan(-5.77)
    const alone = ((60 / -step) * 5223) / RATE
    expect(alone).toBeGreaterThan(1.12)
    expect(alone).toBeLessThan(1.14)

    const teeth = out.taps.combTeeth!
    const data = teeth.channels_data[0]!
    const peaks: number[] = []
    for (let i = 1; i < data.length - 1; i += 1) {
      if (data[i]! > data[i - 1]! && data[i]! >= data[i + 1]!)
        peaks.push((teeth.x1 * i) / (data.length - 1))
    }
    expect(peaks.length).toBe(6)
    const apart = (peaks[5]! - peaks[0]!) / 5
    expect(apart).toBeGreaterThan(9.19 - 0.05)
    expect(apart).toBeLessThan(9.19 + 0.05)
  })

  it('gives a line alone the set decay time when its gain comes from its own length: 4.35 dB a trip for line 1 at 1.5 s (claim comb-own)', async () => {
    const fdn = await lab(NAME)
    const comb = fdn.render(click(1), { decay: 1.5, gains: 1 }).taps.comb!.channels_data[0]!
    const step = 20 * Math.log10(comb[10446]! / comb[5223]!)
    expect(step).toBeGreaterThan(-4.36)
    expect(step).toBeLessThan(-4.34)
    expect(((60 / -step) * 5223) / RATE).toBeCloseTo(1.5, 2)
  })

  it('has lengths with no factor in common at 44.1 kHz, and some at 48 kHz, where the first two lines to bring an echo round together do so after 6.9 s (claim shared-factors)', () => {
    const shared = (lengths: number[]) => {
      const pairs: [number, number, number][] = []
      for (let a = 0; a < lengths.length; a += 1) {
        for (let b = a + 1; b < lengths.length; b += 1) {
          const common = gcd(lengths[a]!, lengths[b]!)
          if (common > 1) pairs.push([lengths[a]!, lengths[b]!, common])
        }
      }
      return pairs
    }
    expect(shared(REFERENCE)).toEqual([])
    // More than that: each of the eight is a prime.
    const prime = (n: number) => {
      for (let d = 2; d * d <= n; d += 1) if (n % d === 0) return false
      return true
    }
    expect(REFERENCE.every(prime)).toBe(true)
    expect(LENGTHS.filter((length) => length % 2 === 0)).toHaveLength(4)
    const pairs = shared(LENGTHS)
    expect(pairs).toContainEqual([6747, 8477, 173])
    // Two lines' echoes land together first at the least common multiple of their lengths.
    let soonest = Infinity
    for (let a = 0; a < LENGTHS.length; a += 1) {
      for (let b = a + 1; b < LENGTHS.length; b += 1) {
        soonest = Math.min(soonest, (LENGTHS[a]! * LENGTHS[b]!) / gcd(LENGTHS[a]!, LENGTHS[b]!))
      }
    }
    expect(soonest).toBe((6747 * 8477) / 173)
    expect(soonest / RATE).toBeGreaterThan(6.8)
    expect(soonest / RATE).toBeLessThan(7.0)
    // At 44.1 kHz the soonest is the product of the two shortest: nearly ten minutes.
    expect((4799 * 5399) / 44100 / 60).toBeGreaterThan(9.7)
  })

  it('multiplies the echoes when the lines are mixed: 117 in the first half second and 1,979 in the second, against 12 and 15 unmixed (claim echo-density)', async () => {
    const fdn = await lab(NAME)
    const mixed = fdn.render(click(1), { matrix: 1 }).checks
    expect(mixed.densityFirst).toBe(117)
    expect(mixed.densitySecond).toBe(1979)
    expect(mixed.densitySecond!).toBeGreaterThan(10 * mixed.densityFirst!)
    const unmixed = fdn.render(click(1), { matrix: 0 }).checks
    expect(unmixed.densityFirst).toBe(12)
    expect(unmixed.densitySecond).toBe(15)
    // And the count goes on growing across the two seconds the lab counts over.
    const curve = fdn.render(click(1), { matrix: 1 }).taps.densityMixed!.channels_data[0]!
    for (let i = 8; i < curve.length; i += 4) expect(curve[i]!).toBeGreaterThan(curve[i - 4]!)
  })

  it('sets one gain for all eight lines from their mean length: 5.78 dB a trip at 1.5 s (claim trip-gain), never nearer 1 than 0.975 (claim gain-cap)', async () => {
    const fdn = await lab(NAME)
    const gain = fdn.render(click(1), { decay: 1.5 }).checks.tripGain!
    expect(gain).toBeCloseTo((-60 * MEAN) / RATE / 1.5, 2)
    expect(gain).toBeGreaterThan(-5.79)
    expect(gain).toBeLessThan(-5.77)
    // The longest decay with the shortest lines is the nearest the controls bring it to 1.
    const nearest = dbToGain(fdn.render(click(1), { decay: 20, size: 0.5 }).checks.tripGain!)
    expect(nearest).toBeGreaterThan(0.975)
    expect(nearest).toBeLessThan(0.976)
    // Size leaves the gain's decay time alone: twice the length, twice the loss a trip.
    expect(fdn.render(click(1), { decay: 1.5, size: 2 }).checks.tripGain!).toBeCloseTo(2 * gain, 2)
  })

  it('decays, with the damping at 0, within 15 % of the time set: 0.97 s for 1 s, 1.34 s for 1.5 s, 1.77 s for 2 s (claim decay-set)', async () => {
    const fdn = await lab(NAME)
    const measured: Record<string, number> = {}
    for (const set of [1, 1.5, 2]) {
      const time = decayTime(fdn.render(click(1), { decay: set, damping: 0 }).taps.decayCurve!)
      measured[set] = time
      expect(time).toBeGreaterThan(set * 0.85)
      expect(time).toBeLessThan(set * 1.15)
      // And always on the short side.
      expect(time).toBeLessThan(set)
    }
    expect(measured[1]).toBeCloseTo(0.97, 1)
    expect(Math.abs(measured[1.5]! - 1.34)).toBeLessThan(0.03)
    expect(Math.abs(measured[2]! - 1.77)).toBeLessThan(0.03)
  })

  it('decays in 1.46 s as a bare network with one gain for all at 1.5 s, and in 1.50 s with a gain for each line (claim bare-decay)', async () => {
    const fdn = await lab(NAME)
    const one = lateDecayTime(
      fdn.render(click(1), { decay: 1.5, matrix: 1, gains: 0 }).taps.mixed!.channels_data[0]!,
    )
    const each = lateDecayTime(
      fdn.render(click(1), { decay: 1.5, matrix: 1, gains: 1 }).taps.mixed!.channels_data[0]!,
    )
    expect(Math.abs(one - 1.46)).toBeLessThan(0.02)
    expect(Math.abs(each - 1.5)).toBeLessThan(0.02)
  })

  it('falls short of a long decay time: 15.7 s measured for 20 s set (claim decay-long)', async () => {
    const fdn = await lab(NAME)
    const level = fdn.render(click(8), { decay: 20 }).taps.level!.channels_data[0]!
    // The level's fall from 1 s to 7 s after the click, one point every 16 samples.
    const points: [number, number][] = []
    for (let i = 3000; i < 21000; i += 1) points.push([i / 3000, level[i]!])
    const time = -60 / slope(points)
    expect(Math.abs(time - 15.7)).toBeLessThan(0.4)
  })

  it("works the feedback path out again with the kit's matrix and lands on the device's own state, under −120 dB (claim loop-rebuilt)", async () => {
    const fdn = await lab(NAME)
    const clicks = await benchSource('clicks', seconds(2))
    const drums = await benchSource('drums', seconds(2))
    expect(fdn.render(clicks, {}).checks.loop).toBeLessThan(-120)
    expect(fdn.render(drums, {}).checks.loop).toBeLessThan(-120)
    const moved = { decay: 6, size: 1.37, damping: 0.7, wander: 1, breathDepth: 0.6, mix: 0.5 }
    expect(fdn.render(drums, moved).checks.loop).toBeLessThan(-120)
  })

  it('loses 9.75 dB a trip at 8 kHz against 5.81 dB at 500 Hz with the damping at 0.4 (claim damping-trip), and a click dies in 0.90 s around 8 kHz against 1.34 s around 500 Hz (claim damping-bands)', async () => {
    const fdn = await lab(NAME)
    const out = fdn.render(click(1), { decay: 1.5, damping: 0.4 })
    const low = atRatio(out.taps.passGain!, 500)
    const high = atRatio(out.taps.passGain!, 8000)
    expect(low).toBeCloseTo(-5.81, 1)
    expect(high).toBeCloseTo(-9.75, 1)
    const lowTime = decayTime(out.taps.decayLow!)
    const highTime = decayTime(out.taps.decayHigh!)
    expect(Math.abs(lowTime - 1.34)).toBeLessThan(0.03)
    expect(Math.abs(highTime - 0.9)).toBeLessThan(0.03)
    // What the loss a trip foretells for 8 kHz: 60 dB, at that many dB a trip of the mean length.
    const foretold = ((60 / -high) * MEAN) / RATE
    expect(foretold).toBeCloseTo(0.89, 2)
    expect(Math.abs(highTime - foretold) / foretold).toBeLessThan(0.05)
  })

  it('still loses 0.33 dB more a trip at 8 kHz and 2 dB more at 50 Hz than the gain alone, with the damping at 0 (claim damping-off)', async () => {
    const fdn = await lab(NAME)
    const out = fdn.render(click(1), { decay: 1.5, damping: 0 })
    const gain = out.checks.tripGain!
    expect(atRatio(out.taps.passGain!, 8000) - gain).toBeCloseTo(-0.33, 1)
    expect(atRatio(out.taps.passGain!, 50) - gain).toBeCloseTo(-1.97, 1)
    expect(Math.abs(atRatio(out.taps.passGain!, 1000) - gain)).toBeLessThan(0.02)
  })

  it('holds a steady sine at a level that moves 0.01 dB with the lines still (claim wander-still) and 4.2 dB with them moving (claim wander-moving)', async () => {
    const fdn = await lab(NAME)
    const tone = await benchSource('sine', seconds(2))
    const still = range(fdn.render(tone, { wander: 0 }).taps.level!.channels_data[0]!)
    const moving = range(fdn.render(tone, { wander: 1 }).taps.level!.channels_data[0]!)
    expect(still).toBeLessThan(0.02)
    expect(moving).toBeGreaterThan(3.7)
    expect(moving).toBeLessThan(4.7)
  })

  it('answers two clicks a second apart alike with the lines still, to 100 dB under the tail, and as differently as two unrelated sounds with them moving (claim wander-clicks)', async () => {
    const fdn = await lab(NAME)
    const clicks = await benchSource('clicks', seconds(2))
    const apart = (values: Record<string, number>) => {
      const out = fdn.render(clicks, values).taps.out!.channels_data[0]!
      let differ = 0
      let whole = 0
      for (let i = 0; i < RATE; i += 1) {
        differ += (out[i]! - out[i + RATE]!) ** 2
        whole += out[i]! ** 2
      }
      return 10 * Math.log10(differ / whole)
    }
    // A decay short enough that each tail is over before the next click.
    expect(apart({ decay: 0.3, wander: 0 })).toBeLessThan(-100)
    const moving = apart({ decay: 0.3, wander: 1 })
    expect(moving).toBeGreaterThan(2)
    expect(moving).toBeLessThan(4)
  })

  it('opens and closes the input between 0.6 and 1 with the breath at 0.4, and leaves it at exactly 1 with the breath at 0 (claim breath)', async () => {
    const fdn = await lab(NAME)
    const drums = await benchSource('drums', seconds(4))
    const off = fdn.render(drums, { breathDepth: 0 }).taps.gate!.channels_data[0]!
    expect(off.every((v) => v === 1)).toBe(true)
    const on = fdn.render(drums, { breathDepth: 0.4 }).taps.gate!.channels_data[0]!
    let lo = Infinity
    let hi = -Infinity
    for (const v of on) {
      lo = Math.min(lo, v)
      hi = Math.max(hi, v)
    }
    expect(lo).toBeCloseTo(0.6, 2)
    expect(hi).toBeCloseTo(1, 2)
  })

  it('puts out two sides that have little to do with each other: a correlation of 0.13 on the clicks (claim stereo)', async () => {
    const fdn = await lab(NAME)
    const clicks = await benchSource('clicks', seconds(2))
    const out = fdn.render(clicks, {}).taps.out!
    const left = out.channels_data[0]!
    const right = out.channels_data[1]!
    let ll = 0
    let rr = 0
    let lr = 0
    for (let i = 0; i < left.length; i += 1) {
      ll += left[i]! ** 2
      rr += right[i]! ** 2
      lr += left[i]! * right[i]!
    }
    expect(lr / Math.sqrt(ll * rr)).toBeCloseTo(0.13, 2)
  })

  it('is the input, sample for sample, with the mix at 0 (claim mix-zero)', async () => {
    const fdn = await lab(NAME)
    const drums = await benchSource('drums', seconds(2))
    const out = fdn.render(drums, { mix: 0, decay: 5 }).taps.out!
    expect(out.channels_data[0]!.every((v, i) => v === drums.left[i])).toBe(true)
    expect(out.channels_data[1]!.every((v, i) => v === drums.right[i])).toBe(true)
  })

  it('answers silence with exact silence (claim silence)', async () => {
    const fdn = await lab(NAME)
    const out = fdn.render(silence(seconds(1)), {})
    for (const id of ['diffused', 'written', 'line1', 'line8', 'out']) {
      expect(out.taps[id]!.channels_data[0]!.every((v) => v === 0)).toBe(true)
    }
  })
})
