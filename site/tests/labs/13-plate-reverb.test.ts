import { describe, expect, it } from 'vitest'
import {
  benchSource,
  expectSoundLab,
  gainToDb,
  lab,
  rms,
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

const NAME = '13-plate-reverb'

/** One unit sample on both channels, then silence. */
function oneSample(frames: number): Source {
  const source = silence(frames)
  source.left[0] = 1
  source.right[0] = 1
  return source
}

/** The place of the first sample that is not silence. */
const firstSound = (x: Float32Array) => x.findIndex((v) => Math.abs(v) > 1e-6)

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

/** The pictures of the input stages start 2 ms, 96 samples, before the sample arrives. */
const LEAD = 96

/**
 * Echoes in each whole 10 ms of a response, counted here as the lab counts them: samples larger
 * than both neighbours and within 60 dB of the largest of the same 10 ms.
 */
function countEchoes(h: Float32Array, windows: number): number[] {
  const counts: number[] = []
  for (let w = 0; w < windows; w += 1) {
    const from = w * 480
    let top = 0
    for (let i = from; i < from + 480; i += 1) top = Math.max(top, Math.abs(h[i]!))
    let count = 0
    for (let i = from; i < from + 480; i += 1) {
      const here = Math.abs(h[i]!)
      const before = i > 0 ? Math.abs(h[i - 1]!) : 0
      const after = Math.abs(h[i + 1] ?? 0)
      if (here > top * 0.001 && here > before && here >= after) count += 1
    }
    counts.push(count)
  }
  return counts
}

/** The level, in dB, of each 100 ms of a signal. */
function levels(x: Float32Array): number[] {
  const out: number[] = []
  for (let from = 0; from + 4800 <= x.length; from += 4800)
    out.push(gainToDb(rms(x, from, from + 4800)))
  return out
}

/**
 * The time a band of the tail's picture takes to fall 60 dB: a straight line through its level
 * (seventeen rows around `hz`, 0.8 kHz in all) from 0.3 s to 1.5 s after the sample went in.
 */
function bandFall(
  tail: { channels_data: Float32Array[]; columns: number; x1: number },
  hz: number,
): number {
  const data = tail.channels_data[0]!
  const rows = data.length / tail.columns
  const row = Math.round(hz / (24_000 / (rows - 1)))
  const times: number[] = []
  const dbs: number[] = []
  for (let column = 0; column < tail.columns; column += 1) {
    const time = (column * tail.x1) / tail.columns
    if (time < 0.3 || time > 1.5) continue
    let power = 0
    for (let k = -8; k <= 8; k += 1) power += 10 ** (data[column * rows + row + k]! / 10)
    times.push(time)
    dbs.push(10 * Math.log10(power / 17))
  }
  const meanTime = times.reduce((a, b) => a + b) / times.length
  const meanDb = dbs.reduce((a, b) => a + b) / dbs.length
  let over = 0
  let under = 0
  times.forEach((time, i) => {
    over += (time - meanTime) * (dbs[i]! - meanDb)
    under += (time - meanTime) ** 2
  })
  return -60 / (over / under)
}

const near = (value: number, wanted: number, part: number) => {
  expect(value).toBeGreaterThan(wanted * (1 - part))
  expect(value).toBeLessThan(wanted * (1 + part))
}

describe('lesson 13: plate reverb', () => {
  it('is a sound lab on the clicks: every tap says something, loops, and answers to every control', async () => {
    const plate = await lab(NAME)
    const clicks = await benchSource('clicks', seconds(4))
    const result = plate.render(clicks, {})
    // The lab starts with the tank's delays held still, so their traces are rightly flat.
    expectSoundLab(plate, clicks, result, { quiet: ['wobbleLeft', 'wobbleRight'] })
  })

  it('answers a click at a tenth of its height and at −47 dB over the loop (claim click-level), and the drums 26 dB louder (claim drums-level)', async () => {
    const plate = await lab(NAME)
    const answer = async (id: string) =>
      plate.render(await benchSource(id, seconds(4)), {}).taps.out!.channels_data[0]!
    const clicks = await answer('clicks')
    const peak = clicks.reduce((top, v) => Math.max(top, Math.abs(v)), 0)
    expect(peak).toBeGreaterThan(0.085)
    expect(peak).toBeLessThan(0.11)
    const level = gainToDb(rms(clicks))
    expect(level).toBeGreaterThan(-47.5)
    expect(level).toBeLessThan(-46.5)
    const louder = gainToDb(rms(await answer('drums'))) - level
    expect(louder).toBeGreaterThan(25)
    expect(louder).toBeLessThan(27)
  })

  it('gives a sound that is opposite in the two channels no reverb at all: it takes the mean of the two (claim one-channel)', async () => {
    const plate = await lab(NAME)
    const source = sine(440, 0.5, seconds(1))
    source.right = source.right.map((v) => -v)
    const out = plate.render(source, {})
    expect(out.taps.predelayed!.channels_data[0]!.every((v) => v === 0)).toBe(true)
    expect(out.taps.out!.channels_data[0]!.every((v) => v === 0)).toBe(true)
    // The same sound alike in both channels goes in whole.
    const alike = plate.render(sine(440, 0.5, seconds(1)), { predelay: 0 })
    near(rms(alike.taps.predelayed!.channels_data[0]!), 0.5 / Math.SQRT2, 0.001)
  })

  it('lets a sample through 959 samples later at a pre-delay of 20 ms, and at once at 0 ms (claim predelay-one-less)', async () => {
    const plate = await lab(NAME)
    const source = oneSample(seconds(2))
    // Decay at 0.1: nothing of the first pass is left to wrap into the second.
    const at20 = plate.render(source, { decay: 0.1 })
    expect(firstSound(at20.taps.predelayed!.channels_data[0]!)).toBe(959)
    const at0 = plate.render(source, { decay: 0.1, predelay: 0 })
    expect(firstSound(at0.taps.predelayed!.channels_data[0]!)).toBe(0)
    const at250 = plate.render(source, { decay: 0.1, predelay: 250 })
    expect(firstSound(at250.taps.predelayed!.channels_data[0]!)).toBe(11_999)
  })

  it('takes 0.008 dB off a 20 kHz tone in the bandwidth filter (claim bandwidth-loss)', async () => {
    const plate = await lab(NAME)
    const out = plate.render(sine(20_000, 0.5, seconds(1)), {})
    const loss = gainToDb(
      rms(out.taps.predelayed!.channels_data[0]!) / rms(out.taps.filtered!.channels_data[0]!),
    )
    expect(loss).toBeGreaterThan(0.007)
    expect(loss).toBeLessThan(0.009)
    // The lab's own figure for it, from the filter's answer to one sample.
    expect(out.checks.bandwidthLoss).toBeGreaterThan(0.007)
    expect(out.checks.bandwidthLoss).toBeLessThan(0.009)
  })

  it('turns one sample into −0.75 and then echoes of 0.44, 0.33 and 0.25, 229 samples apart, in its first all-pass (claim allpass-echoes)', async () => {
    const plate = await lab(NAME)
    const hit = plate.render(oneSample(seconds(1)), {}).taps.hit1!.channels_data[0]!
    // The bandwidth filter in front passes 0.9995 of the sample, so each is that much short.
    expect(hit.subarray(0, LEAD).every((v) => v === 0)).toBe(true)
    expect(hit[LEAD]!).toBeCloseTo(-0.75, 2)
    expect(hit[LEAD + 229]!).toBeCloseTo(0.4375, 2)
    expect(hit[LEAD + 458]!).toBeCloseTo(0.328, 2)
    expect(hit[LEAD + 687]!).toBeCloseTo(0.246, 2)
    // And nothing between them but the filter's own trace, 66 dB down.
    const between = hit.subarray(LEAD + 2, LEAD + 229)
    expect(between.every((v) => Math.abs(v) < 1e-6)).toBe(true)
  })

  it('leaves every frequency at its level through one all-pass, within 0.00001 dB (claim allpass-flat), and through all four (claim chain-flat)', async () => {
    const plate = await lab(NAME)
    const out = plate.render(oneSample(seconds(1)), {})
    // From 20 Hz to 20 kHz, at 241 frequencies: the furthest from the level that went in.
    expect(out.checks.flatOne).toBeLessThan(0.00001)
    expect(out.checks.flat).toBeLessThan(0.00001)
    // And the curve the lesson draws, every 2.5 Hz up to 2 kHz.
    const drawn = out.taps.responseAllpass!
    expect(drawn.length).toBe(801)
    expect([drawn.x0, drawn.x1]).toEqual([0, 2000])
    expect(Math.max(...Array.from(drawn.channels_data[0]!, Math.abs))).toBeLessThan(0.00001)
  })

  it('lifts some frequencies 12 dB and drops others 4.9 dB with one delay and feedback, a peak every 210 Hz (claim comb-peaks)', async () => {
    const plate = await lab(NAME)
    const tap = plate.render(oneSample(seconds(1)), {}).taps.responseComb!
    const comb = Array.from(tap.channels_data[0]!)
    // 1 / (1 - 0.75) is 12.04 dB and 1 / (1 + 0.75) is -4.86 dB.
    expect(Math.max(...comb)).toBeCloseTo(12.04, 1)
    expect(Math.min(...comb)).toBeCloseTo(-4.86, 1)
    const hzAt = (p: number) => tap.x0 + ((tap.x1 - tap.x0) * p) / (comb.length - 1)
    const peaks = comb.flatMap((v, p) =>
      p > 0 && p < comb.length - 1 && v > comb[p - 1]! && v >= comb[p + 1]! && v > 6
        ? [hzAt(p)]
        : [],
    )
    // 48000 / 229 is 209.6 Hz; the curve stands every 2.5 Hz.
    expect(peaks.length).toBe(9)
    peaks.forEach((hz, k) => expect(Math.abs(hz - (k + 1) * 209.6)).toBeLessThan(2.5))
  })

  it('counts 2, 23, 47 and 96 echoes in the 10 ms from 30 ms on, after one, two, three and four all-passes (claim density-stages)', async () => {
    const plate = await lab(NAME)
    const taps = plate.render(oneSample(seconds(1)), {}).taps
    const counted = [1, 2, 3, 4].map((n) => Array.from(taps[`density${n}`]!.channels_data[0]!))
    expect(counted.map((counts) => counts[3])).toEqual([2, 23, 47, 96])
    // From 10 ms on, every stage has more echoes in each 10 ms than the stage before it.
    for (let window = 1; window < 10; window += 1) {
      for (let stage = 1; stage < 4; stage += 1) {
        expect(counted[stage]![window]!).toBeGreaterThan(counted[stage - 1]![window]!)
      }
    }
    // The same count made here, from the echoes the lab drew.
    for (let stage = 0; stage < 4; stage += 1) {
      const hit = taps[`hit${stage + 1}`]!.channels_data[0]!.subarray(LEAD)
      expect(countEchoes(hit, 4)).toEqual(counted[stage]!.slice(0, 4))
    }
  })

  it('reaches 186 echoes in 10 ms after the fourth all-pass (claim density-four), and about 150 at the output from 100 ms on (claim density-ceiling)', async () => {
    const plate = await lab(NAME)
    const taps = plate.render(oneSample(seconds(1)), {}).taps
    expect(Math.max(...taps.density4!.channels_data[0]!)).toBe(186)
    const out = Array.from(taps.densityOut!.channels_data[0]!).slice(10, 50)
    const mean = out.reduce((a, b) => a + b) / out.length
    expect(mean).toBeGreaterThan(140)
    expect(mean).toBeLessThan(165)
    // In the tank it has got there too.
    const tank = Array.from(taps.densityTank!.channels_data[0]!).slice(10, 50)
    expect(Math.min(...tank)).toBeGreaterThan(100)
  })

  it('sets the four input all-passes to 229, 173, 611 and 447 samples at 48 kHz, no two sharing a factor (claim input-lengths)', async () => {
    const plate = await lab(NAME)
    const lengths = Array.from(
      plate.render(oneSample(seconds(1)), {}).taps.lengths!.channels_data[0]!,
    )
    const input = lengths.slice(0, 4)
    expect(input).toEqual([229, 173, 611, 447])
    for (let a = 0; a < 4; a += 1)
      for (let b = a + 1; b < 4; b += 1) expect(gcd(input[a]!, input[b]!)).toBe(1)
  })

  it('sets the tank to 1083.8, 7182, 2903 and 6000 samples on the left and 1464.5, 6801, 4284 and 5101 on the right (claim tank-lengths)', async () => {
    const plate = await lab(NAME)
    const lengths = Array.from(
      plate.render(oneSample(seconds(1)), {}).taps.lengths!.channels_data[0]!,
    )
    expect(lengths[4]!).toBeCloseTo(1083.8, 1)
    expect(lengths.slice(5, 8)).toEqual([7182, 2903, 6000])
    expect(lengths[8]!).toBeCloseTo(1464.5, 1)
    expect(lengths.slice(9, 12)).toEqual([6801, 4284, 5101])
  })

  it('delays by one sample less than a plain delay is long: 7181 for 7182 (claim one-less)', async () => {
    const plate = await lab(NAME)
    const source = oneSample(seconds(2))
    // With no decay nothing comes round, so the first sound at each point is the sample's own.
    const once = plate.render(source, { decay: 0, predelay: 0 }).taps
    expect(firstSound(once.tankA!.channels_data[0]!)).toBe(0)
    expect(firstSound(once.damped!.channels_data[0]!)).toBe(7181)
    expect(firstSound(once.damped!.channels_data[1]!)).toBe(6800)
    // With a little decay the second delay of each half has something to carry.
    const twice = plate.render(source, { decay: 0.1, predelay: 0 }).taps
    const leftB = firstSound(twice.tankB!.channels_data[0]!)
    const rightB = firstSound(twice.tankB!.channels_data[1]!)
    expect(leftB).toBe(7181)
    expect(firstSound(twice.crossing!.channels_data[0]!) - leftB).toBe(5999)
    expect(firstSound(twice.crossing!.channels_data[1]!) - rightB).toBe(5100)
  })

  it('goes once round both halves in 0.725 s (claim trip)', async () => {
    const plate = await lab(NAME)
    const out = plate.render(oneSample(seconds(1)), {})
    expect(out.checks.trip).toBeCloseTo(0.7253, 3)
  })

  it('brings what entered the right half round to the left 11,901 samples later, at 248 ms (claim crossing)', async () => {
    const plate = await lab(NAME)
    const source = oneSample(seconds(1))
    // With the decay at 0 nothing crosses: what differs from that is what came round.
    const round = plate.render(source, {}).taps.hitTank!
    const alone = plate.render(source, { decay: 0 }).taps.hitTank!.channels_data[0]!
    // The picture starts 20 ms, 960 samples, before the burst arrives.
    expect(round.x0).toBe(-20)
    const first = round.channels_data[0]!.findIndex((v, i) => Math.abs(v - alone[i]!) > 1e-9)
    // 6800 and 5100 samples of delay in the right half, and one for the crossing.
    expect(first - 960).toBe(11_901)
  })

  /** With no damping: the measured time and the formula's, each as the lesson rounds it. */
  async function fallAt(decay: number, measured: number, formula: number) {
    const plate = await lab(NAME)
    const checks = plate.render(oneSample(seconds(1)), { decay, damping: 0 }).checks
    near(checks.fall!, measured, 0.02)
    near(checks.fallFormula!, formula, 0.01)
    // The formula and the measurement are never more than a tenth apart.
    near(checks.fall!, checks.fallFormula!, 0.1)
  }

  it('falls 60 dB in 1.13 s at a decay of 0.3 with no damping (claim fall-03), where the formula gives 1.04 s (claim formula-03)', () =>
    fallAt(0.3, 1.13, 1.04))

  it('falls 60 dB in 1.77 s at a decay of 0.5 with no damping (claim fall-05), where the formula gives 1.81 s (claim formula-05)', () =>
    fallAt(0.5, 1.77, 1.81))

  it('falls 60 dB in 3.31 s at a decay of 0.7 with no damping (claim fall-07), where the formula gives 3.51 s (claim formula-07)', () =>
    fallAt(0.7, 3.31, 3.51))

  it('falls 60 dB in 10.8 s at a decay of 0.9 with no damping (claim fall-09), where the formula gives 11.9 s (claim formula-09)', () =>
    fallAt(0.9, 10.8, 11.9))

  it('dies away more slowly the higher the decay, from 0.47 s at 0 to 10.4 s at 0.9, twenty-two times as long (claim decay-range)', async () => {
    const plate = await lab(NAME)
    const source = oneSample(seconds(1))
    const times = [0, 0.1, 0.3, 0.5, 0.7, 0.9].map(
      (decay) => plate.render(source, { decay }).checks.fall!,
    )
    for (let i = 1; i < times.length; i += 1) expect(times[i]!).toBeGreaterThan(times[i - 1]!)
    near(times[0]!, 0.47, 0.03)
    near(times.at(-1)!, 10.4, 0.03)
    expect(times.at(-1)! / times[0]!).toBeGreaterThan(20)
    // The lab's starting point, a decay of 0.5 and a damping of 0.3.
    near(times[3]!, 1.69, 0.02)
  })

  it('reads the time to fall 60 dB off the decay curve: three times its time from −5 dB to −25 dB', async () => {
    const plate = await lab(NAME)
    const out = plate.render(oneSample(seconds(1)), {})
    const curve = out.taps.decayCurve!
    const data = curve.channels_data[0]!
    expect(data[0]).toBe(0)
    for (let p = 1; p < data.length; p += 1) expect(data[p]!).toBeLessThanOrEqual(data[p - 1]!)
    const timeAt = (level: number) => {
      const p = data.findIndex((v) => v <= level)
      const part = (data[p - 1]! - level) / (data[p - 1]! - data[p]!)
      return curve.x0 + ((p - 1 + part) * (curve.x1 - curve.x0)) / (data.length - 1)
    }
    expect(3 * (timeAt(-25) - timeAt(-5))).toBeCloseTo(out.checks.fall!, 3)
  })

  it('shortens the highs with damping and hardly the lows: at 0.7 the band at 5 kHz falls 60 dB in 1.27 s against 1.84 s with none, the band at 500 Hz in 1.86 s against 1.88 s (claim damping-bands)', async () => {
    const plate = await lab(NAME)
    const source = oneSample(seconds(1))
    const bright = plate.render(source, { damping: 0 }).checks
    const dark = plate.render(source, { damping: 0.7 }).checks
    near(bright.fallHigh!, 1.84, 0.02)
    near(dark.fallHigh!, 1.27, 0.02)
    near(bright.fallLow!, 1.88, 0.02)
    near(dark.fallLow!, 1.86, 0.02)
    const highsLost = 1 - dark.fallHigh! / bright.fallHigh!
    const lowsLost = 1 - dark.fallLow! / bright.fallLow!
    expect(highsLost).toBeGreaterThan(0.25)
    expect(lowsLost).toBeLessThan(0.03)
    // In between, the highs fall away in step with the control.
    const middle = plate.render(source, { damping: 0.3 }).checks
    expect(middle.fallHigh!).toBeLessThan(bright.fallHigh!)
    expect(middle.fallHigh!).toBeGreaterThan(dark.fallHigh!)
  })

  it('gives 1.8 s at 500 Hz and 1.2 s at 5 kHz by the formula at a decay of 0.5 and a damping of 0.7 (claim damping-formula), within a tenth of what is measured', async () => {
    const plate = await lab(NAME)
    const checks = plate.render(oneSample(seconds(1)), { damping: 0.7 }).checks
    const a = 0.7
    const formula = (hz: number) => {
      const w = (2 * Math.PI * hz) / 48_000
      const gain2 = (1 - a) ** 2 / (1 - 2 * a * Math.cos(w) + a * a)
      return (-3 * checks.trip!) / Math.log10(0.5 ** 4 * gain2)
    }
    expect(formula(500)).toBeCloseTo(1.79, 2)
    expect(formula(5000)).toBeCloseTo(1.19, 2)
    near(checks.fallLow!, formula(500), 0.1)
    near(checks.fallHigh!, formula(5000), 0.1)
  })

  it('passes its damping filter 3 dB down at 10.6 kHz with the damping at 0.3, and at 2.75 kHz at 0.7 (claim damping-cutoff)', async () => {
    const plate = await lab(NAME)
    // With no decay the left half holds the input alone: the filter's gain is what is after
    // the first delay against what went into it.
    const gainAt = (hz: number, damping: number) => {
      const taps = plate.render(sine(hz, 0.5, seconds(2)), { decay: 0, damping }).taps
      return gainToDb(rms(taps.damped!.channels_data[0]!) / rms(taps.tankA!.channels_data[0]!))
    }
    expect(gainAt(10_600, 0.3)).toBeCloseTo(-3.01, 1)
    expect(gainAt(2750, 0.7)).toBeCloseTo(-3.01, 1)
    expect(gainAt(500, 0.3)).toBeGreaterThan(-0.02)
  })

  it('loses its highs a little sooner even with no damping: 16 kHz falls 60 dB in 1.74 s where 500 Hz takes 1.98 s (claim still-loses-highs)', async () => {
    const plate = await lab(NAME)
    const tail = plate.render(oneSample(seconds(1)), { damping: 0 }).taps.tail!
    const low = bandFall(tail, 500)
    const high = bandFall(tail, 16_000)
    near(low, 1.98, 0.03)
    near(high, 1.74, 0.03)
    expect(high / low).toBeLessThan(0.92)
  })

  it('first sounds 428 samples after the pre-delay on the left and 568 on the right (claim first-out), the right repeating the left for its first 1083 samples (claim sides-early), and over the whole response the two sides are unrelated: a likeness under 0.01 (claim sides)', async () => {
    const plate = await lab(NAME)
    const out = plate.render(oneSample(seconds(1)), {})
    const left = out.taps.hitLeft!.channels_data[0]!
    const right = out.taps.hitRight!.channels_data[0]!
    expect(firstSound(left)).toBe(428)
    expect(firstSound(right)).toBe(568)
    // At first the right is the left again, 140 samples late: each side's first reading is of
    // the same burst going into the other half. It lasts until the left half's first all-pass
    // gives back what it took, 1083 samples on.
    for (let k = 0; k < 1083; k += 1) expect(right[568 + k]).toBe(left[428 + k])
    expect(right[568 + 1084]).not.toBe(left[428 + 1084])
    expect(Math.abs(out.checks.sides!)).toBeLessThan(0.01)
    expect(
      Math.abs(plate.render(oneSample(seconds(1)), { movement: 1 }).checks.sides!),
    ).toBeLessThan(0.01)
  })

  it('adds up to 19.35 samples to the delay of each half’s first all-pass, the left once a second and the right at 0.95 Hz (claim wobble-range), and nothing when held still', async () => {
    const plate = await lab(NAME)
    const source = sine(440, 0.25, seconds(4))
    const moving = plate.render(source, { movement: 1 }).taps
    const left = moving.wobbleLeft!.channels_data[0]!
    const right = moving.wobbleRight!.channels_data[0]!
    // The crossfade at the wrap blends the first 20 ms with what follows the loop: look past it.
    const from = 100
    for (const trace of [left, right]) {
      const kept = Array.from(trace.subarray(from))
      expect(Math.min(...kept)).toBeCloseTo(0, 1)
      expect(Math.max(...kept)).toBeCloseTo(19.35, 1)
    }
    // A point of a trace is 16 samples: 3000 points are a second. The left comes round in one.
    for (let k = from; k < 3000; k += 100) expect(left[k + 3000]!).toBeCloseTo(left[k]!, 1)
    // The right does not: it turns at 0.95 Hz, once in 3158 points.
    expect(Math.abs(right[1500 + 3000]! - right[1500]!)).toBeGreaterThan(1)
    for (let k = from; k < 3000; k += 100) expect(right[k + 3158]!).toBeCloseTo(right[k]!, 1)
    const held = plate.render(source, {}).taps
    expect(held.wobbleLeft!.channels_data[0]!.every((v) => v === 0)).toBe(true)
    expect(held.wobbleRight!.channels_data[0]!.every((v) => v === 0)).toBe(true)
  })

  it('holds a steady tone steady when still, within 0.1 dB (claim still-steady), and swings it over 20 dB when the delays move (claim moving-swings)', async () => {
    const plate = await lab(NAME)
    const source = sine(440, 0.25, seconds(8))
    const still = levels(plate.render(source, {}).taps.out!.channels_data[0]!)
    expect(Math.max(...still) - Math.min(...still)).toBeLessThan(0.1)
    const moving = levels(plate.render(source, { movement: 1 }).taps.out!.channels_data[0]!)
    expect(Math.max(...moving) - Math.min(...moving)).toBeGreaterThan(20)
    expect(Math.max(...moving) - Math.min(...moving)).toBeLessThan(22)
  })

  it('gives 441 Hz 3.5 dB more than 440 Hz when the delays are still (claim pitch-luck)', async () => {
    const plate = await lab(NAME)
    const level = (hz: number) =>
      gainToDb(rms(plate.render(sine(hz, 0.25, seconds(8)), {}).taps.out!.channels_data[0]!))
    const more = level(441) - level(440)
    expect(more).toBeGreaterThan(3.2)
    expect(more).toBeLessThan(3.8)
  })

  it("works out what each input all-pass put out from the device's own delays, more than 120 dB under what the next stage took in (claim rebuilt)", async () => {
    const plate = await lab(NAME)
    for (const id of ['clicks', 'drums', 'guitar']) {
      const source = await benchSource(id, seconds(4))
      expect(plate.render(source, {}).checks.rebuilt).toBeLessThan(-120)
      // With the delays moving, the fourth is held to the moving all-pass's own read.
      expect(plate.render(source, { movement: 1, decay: 0.9 }).checks.rebuilt).toBeLessThan(-120)
    }
  })

  it('is the input, sample for sample, with the mix at 0 (claim mix-zero)', async () => {
    const plate = await lab(NAME)
    const drums = await benchSource('drums', seconds(2))
    const out = plate.render(drums, { mix: 0, decay: 0.9 }).taps.out!
    expect(out.channels_data[0]!.every((v, i) => v === drums.left[i])).toBe(true)
    expect(out.channels_data[1]!.every((v, i) => v === drums.right[i])).toBe(true)
  })
})
