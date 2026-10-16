import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { LOOPS } from '../../src/lab/tiles.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
  click,
  dbToGain,
  expectBuild,
  expectSoundLab,
  expectWritten,
  FADE,
  gainToDb,
  lab,
  matchesWritten,
  range,
  RATE,
  rms,
  seconds,
  silence,
  type Source,
} from './support.ts'

const NAME = 'feedback-delay-network'

/** The line lengths in fdn_reverb.h, at its reference rate of 44.1 kHz. */
const REFERENCE = [4799, 5399, 5801, 6199, 6599, 6997, 7393, 7789]
/** What they come to at 48 kHz: each times 48000 / 44100, cut to a whole number. */
const LENGTHS = [5223, 5876, 6314, 6747, 7182, 7615, 8046, 8477]
const MEAN = LENGTHS.reduce((sum, length) => sum + length, 0) / LENGTHS.length

/** The build's steps, as the lab's build path numbers them. */
const STEP = { comb: 0, eight: 1, matrix: 2, damping: 3, diffusion: 4, movement: 5, guards: 6 }

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

/** Seconds to fall 60 dB, from the energy of an answer in quarter-second windows from `from` to `to` seconds. */
function lateDecayTime(response: ArrayLike<number>, from = 0.5, to = 2): number {
  const points: [number, number][] = []
  for (let t = from; t + 0.25 <= to + 1e-9; t += 0.25) {
    let sum = 0
    for (let i = Math.round(t * RATE); i < Math.round((t + 0.25) * RATE); i += 1)
      sum += response[i]! ** 2
    points.push([t, 10 * Math.log10(sum)])
  }
  return -60 / slope(points)
}

/**
 * The value of a curve whose points stand in even ratios from x0 to x1, at `x`: on the straight
 * line between the two points either side of it. The nearest point alone can stand 1.5 % away
 * in frequency, which at 8 kHz is 0.02 dB of a trip's loss.
 */
function atRatio(curve: Curve, x: number): number {
  const data = curve.channels_data[0]!
  const place = (Math.log(x / curve.x0) / Math.log(curve.x1 / curve.x0)) * (data.length - 1)
  const below = Math.min(Math.max(Math.floor(place), 0), data.length - 2)
  return data[below]! + (data[below + 1]! - data[below]!) * (place - below)
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

/** A signal through a two-pole band-pass at `hz`, twice, so that the bands beside it stay out. */
function band(x: ArrayLike<number>, hz: number, q = 4): Float64Array {
  const w = (2 * Math.PI * hz) / RATE
  const alpha = Math.sin(w) / (2 * q)
  const a0 = 1 + alpha
  const b0 = alpha / a0
  const a1 = (-2 * Math.cos(w)) / a0
  const a2 = (1 - alpha) / a0
  const once = (input: ArrayLike<number>) => {
    const y = new Float64Array(input.length)
    let x1 = 0
    let x2 = 0
    let y1 = 0
    let y2 = 0
    for (let i = 0; i < input.length; i += 1) {
      const v = b0 * input[i]! - b0 * x2 - a1 * y1 - a2 * y2
      x2 = x1
      x1 = input[i]!
      y2 = y1
      y1 = v
      y[i] = v
    }
    return y
  }
  return once(once(x))
}

/**
 * How fast a click's answer falls in the band at `hz`, in dB a second: the line through the
 * band's energy in eighth-second windows from a quarter second to one second after the click.
 */
function fall(answer: Float32Array, hz: number): number {
  const y = band(answer, hz)
  const points: [number, number][] = []
  for (let t = 0.25; t + 0.125 <= 1.0001; t += 0.125) {
    let sum = 0
    for (let i = Math.round(t * RATE); i < Math.round((t + 0.125) * RATE); i += 1) sum += y[i]! ** 2
    points.push([t + 0.0625, 10 * Math.log10(sum)])
  }
  return -slope(points)
}

/** How many samples from `from` up to `to` are not exactly zero: each is an echo arriving. */
function echoes(x: Float32Array, from: number, to: number): number {
  let count = 0
  for (let i = from; i < to; i += 1) if (x[i] !== 0) count += 1
  return count
}

/** The largest sample, as a size. */
function top(x: Float32Array): number {
  let most = 0
  for (const v of x) most = Math.max(most, Math.abs(v))
  return most
}

/** The level of a sound in windows of 50 ms, in dB: how far apart the quietest and loudest are. */
function levelSpan(x: Float32Array): number {
  const levels: number[] = []
  for (let i = 0; i + 2400 <= x.length; i += 2400) levels.push(gainToDb(rms(x, i, i + 2400)))
  return range(levels).span
}

/** The level of `a − b` against the level of `a`, from `from` up to `to`, in dB. */
function apartDb(a: Float32Array, b: Float32Array, from: number, to: number): number {
  let differ = 0
  let whole = 0
  for (let i = from; i < to; i += 1) {
    differ += (a[i]! - b[i]!) ** 2
    whole += a[i]! ** 2
  }
  return 10 * Math.log10(differ / whole)
}

/** The level of a tap over the whole loop and every channel, in dB against full scale. */
function levelOf(tap: { channels_data: Float32Array[] }): number {
  let sum = 0
  let count = 0
  for (const data of tap.channels_data) {
    for (const v of data) sum += v * v
    count += data.length
  }
  return 10 * Math.log10(sum / count)
}

/** One source after another, as one longer source. */
function joined(...parts: Source[]): Source {
  const frames = parts.reduce((sum, part) => sum + part.left.length, 0)
  const left = new Float32Array(frames)
  const right = new Float32Array(frames)
  let at = 0
  for (const part of parts) {
    left.set(part.left, at)
    right.set(part.right, at)
    at += part.left.length
  }
  return { left, right }
}

const same = (a: Float32Array, b: Float32Array) => a.every((v, i) => v === b[i])

describe('the feedback delay network', () => {
  it('is a sound lab on the drums: every tap says something, loops, and answers to every control', async () => {
    const fdn = await lab(NAME)
    const drums = await benchSource('drums', seconds(2))
    const result = fdn.render(drums, {})
    // With the breath at 0 its gain on the input is 1 throughout, and with the lines still no
    // read sways.
    expectSoundLab(fdn, drums, result, { quiet: ['gate', 'sway1', 'sway8'] })
  })

  it('has a build path of seven steps, the last of them held to the device', async () => {
    const fdn = await lab(NAME)
    const drums = await benchSource('drums', seconds(2))
    // The sixth piece moves the lines only when Wander lets them move.
    expectBuild(fdn, drums, { wander: 1 })
  })

  it('builds the network again with not one sample of any line different from the device (claim built-same)', async () => {
    const fdn = await lab(NAME)
    const settings: Record<string, number>[] = [
      {},
      { wander: 1 },
      { decay: 6, size: 1.37, damping: 0.7, wander: 1, breathDepth: 0.6, mix: 0.5, predelay: 33 },
      { decay: 0.3, size: 0.5, damping: 1, breathRate: 2, breathDepth: 1 },
    ]
    for (const id of ['drums', 'clicks', 'sine', 'pad']) {
      const source = await benchSource(id, seconds(2))
      for (const values of settings) {
        for (const step of [STEP.comb, STEP.guards]) {
          const out = fdn.render(source, { ...values, build: step })
          expect(out.checks.builtWorst, `${id}, step ${step}`).toBe(0)
          expect(out.checks.builtDifference, `${id}, step ${step}`).toBe(-140)
          expectWritten(out.checks.builtDifference!, 'under −120 dB')
          if (step !== STEP.guards) continue
          // The two sides of the last step are the device's wet signal. The lab makes that
          // from the line outputs where the device keeps them, which is after anything under
          // 1e-15 has been written as zero; the build, like the device, sums them before. So
          // the two may part by that much in a sample where a line is dying out, and no more.
          const built = out.taps.built!.channels_data
          const wet = out.taps.wet!.channels_data
          for (const side of [0, 1]) {
            const apart = built[side]!.reduce(
              (most, v, i) => Math.max(most, Math.abs(v - wet[side]![i]!)),
              0,
            )
            expect(apart, `${id}: side ${side}`).toBeLessThan(1e-15)
          }
        }
      }
    }
    // The finished build's two sides against what the device itself puts out. With Mix at 1
    // the output is the wet signal wherever nothing is going in (where something is, the dry
    // sound comes through at the cosine of a quarter turn, which a float holds as −0.00000004
    // and not as nothing), so there the two are compared sample for sample.
    const quiet = joined(await benchSource('drums', seconds(2)), silence(seconds(2)))
    for (const source of [await benchSource('clicks', seconds(2)), quiet]) {
      for (const values of settings) {
        const out = fdn.render(source, { ...values, mix: 1, build: STEP.guards })
        const dry = [source.left, source.right]
        let compared = 0
        let differing = 0
        let leak = 0
        for (const side of [0, 1]) {
          const built = out.taps.built!.channels_data[side]!
          const device = out.taps.out!.channels_data[side]!
          for (let i = FADE; i < built.length; i += 1) {
            if (dry[side]![i] !== 0) {
              leak = Math.max(leak, Math.abs(built[i]! - device[i]!))
              continue
            }
            compared += 1
            if (built[i] !== device[i]) differing += 1
          }
        }
        expect(compared, JSON.stringify(values)).toBeGreaterThan(seconds(3.9))
        expect(differing, JSON.stringify(values)).toBe(0)
        // Where the dry sound is not nothing, a trace of it is all that parts the two.
        expect(leak, JSON.stringify(values)).toBeGreaterThan(0)
        expectWritten(leak, 'less than 0.000001')
      }
    }
  })

  it('counts 12 echoes on the left in the first half second of eight lines, where one comb gave 4 (claim build-eight)', async () => {
    const fdn = await lab(NAME)
    const answer = (step: number) =>
      fdn.render(click(seconds(1)), { build: step }).taps.builtClick!.channels_data[0]!
    const eight = echoes(answer(STEP.eight), 0, seconds(0.5))
    expect(eight).toBe(12)
    expectWritten(eight, '12 echoes')
    // The piece switched off: one comb.
    const before = echoes(answer(STEP.comb), 0, seconds(0.5))
    expect(before).toBe(4)
    expect(matchesWritten(before, '12 echoes')).toBe(false)
  })

  it('counts 117 echoes in the first half second once the build mixes its lines, where it counted 12 (claim build-matrix)', async () => {
    const fdn = await lab(NAME)
    const answer = (step: number) =>
      fdn.render(click(seconds(1)), { build: step }).taps.builtClick!.channels_data[0]!
    const mixed = echoes(answer(STEP.matrix), 0, seconds(0.5))
    expectWritten(mixed, '117 echoes')
    // The piece switched off: eight lines, each to itself.
    expect(matchesWritten(echoes(answer(STEP.eight), 0, seconds(0.5)), '117 echoes')).toBe(false)
  })

  it('makes the answer fall 22 dB a second faster around 8 kHz than around 500 Hz once the build damps, with Damping at 0.4 (claim build-damping)', async () => {
    const fdn = await lab(NAME)
    const faster = (step: number) => {
      const answer = fdn.render(click(seconds(1)), { build: step, damping: 0.4 }).taps.builtClick!
        .channels_data[0]!
      return fall(answer, 8000) - fall(answer, 500)
    }
    expectWritten(faster(STEP.damping), '22 dB')
    // The piece switched off: no band falls faster than another by anything like that.
    const before = faster(STEP.matrix)
    expect(Math.abs(before)).toBeLessThan(6)
    expect(matchesWritten(before, '22 dB')).toBe(false)
  })

  it("brings the tallest sample of the build's answer to a click down to −24.8 dB, from −12.7 dB, with the energy of the second after it within 0.01 dB (claim build-diffusion)", async () => {
    const fdn = await lab(NAME)
    const answer = (step: number) =>
      fdn.render(click(seconds(1)), { build: step }).taps.builtClick!.channels_data[0]!
    const energy = (x: Float32Array) => 10 * Math.log10(x.reduce((sum, v) => sum + v * v, 0))
    const diffused = answer(STEP.diffusion)
    const before = answer(STEP.damping)
    expectWritten(gainToDb(top(diffused)), '−24.8 dB')
    expectWritten(gainToDb(top(before)), '−12.7 dB')
    expectWritten(Math.abs(energy(diffused) - energy(before)), 'less than 0.01 dB')
    // The piece switched off.
    expect(matchesWritten(gainToDb(top(before)), '−24.8 dB')).toBe(false)
    // And where 1,073 samples of the first half second held something, 18,330 now do.
    expect(echoes(before, 0, seconds(0.5))).toBe(1073)
    expect(echoes(diffused, 0, seconds(0.5))).toBe(18330)
  })

  it('lets the level of a 440 Hz tone through the build wander over 4.8 dB once the lines move, with Wander on Moving (claim build-movement)', async () => {
    const fdn = await lab(NAME)
    const tone = await benchSource('sine', seconds(2))
    const span = (step: number, wander: number) =>
      levelSpan(fdn.render(tone, { build: step, wander }).taps.built!.channels_data[0]!)
    expectWritten(span(STEP.movement, 1), '4.8 dB')
    // The piece switched off, and the piece there with Wander on Still.
    expect(span(STEP.diffusion, 1)).toBeLessThan(0.01)
    expect(matchesWritten(span(STEP.diffusion, 1), '4.8 dB')).toBe(false)
    expect(span(STEP.movement, 0)).toBeLessThan(0.01)
  })

  it('takes a steady offset out of the build: the left side stands at less than 0.000001 where it stood at 0.185 (claim build-guards), and with Decay at 20 s gives back no sample of 1 or more where it gave 8 (claim build-limit)', async () => {
    const fdn = await lab(NAME)
    const frames = seconds(2)
    const offset = {
      left: new Float32Array(frames).fill(0.1),
      right: new Float32Array(frames).fill(0.1),
    }
    const standing = (step: number) => {
      const left = fdn.render(offset, { build: step }).taps.built!.channels_data[0]!
      return Math.abs(left.reduce((sum, v) => sum + v, 0) / left.length)
    }
    expectWritten(standing(STEP.guards), 'less than 0.000001')
    // The piece switched off.
    expectWritten(standing(STEP.movement), '0.185')
    expect(matchesWritten(standing(STEP.movement), 'less than 0.000001')).toBe(false)

    // The drums at eight times their level, with the longest decay.
    const drums = await benchSource('drums', seconds(2))
    const loud = { left: drums.left.map((v) => 8 * v), right: drums.right.map((v) => 8 * v) }
    const tallest = (step: number) =>
      top(fdn.render(loud, { build: step, decay: 20 }).taps.builtFirst!.channels_data[0]!)
    expectWritten(tallest(STEP.guards), 'less than 1')
    expectWritten(tallest(STEP.movement), '8')
    expect(matchesWritten(tallest(STEP.movement), 'less than 1')).toBe(false)
  })

  it("keeps energy in both of the kit's mixing matrices: every column of unit length and at right angles to the others, to within 0.0000001 (claim matrix-keeps)", async () => {
    const fdn = await lab(NAME)
    const { checks } = fdn.render(click(seconds(1)), {})
    // Measured: 0.00000006 for the Hadamard matrix, one step of a float at 1, and 0 for the
    // Householder.
    expectWritten(checks.keeps!, 'less than 0.0000001')
    expectWritten(checks.keepsHouseholder!, 'less than 0.0000001')
  })

  it("finds the device's own matrix to be the kit's Hadamard, entry for entry (claim same-matrix)", async () => {
    const fdn = await lab(NAME)
    expect(fdn.render(click(seconds(1)), {}).checks.sameMatrix).toBe(0)
  })

  it('runs the eight lines at 5,223 to 8,477 samples at 48 kHz, 108.8 ms to 176.6 ms (claim lengths-48k)', async () => {
    const fdn = await lab(NAME)
    const ms = fdn.render(click(seconds(1)), {}).taps.lengths!.channels_data[0]!
    expect(Array.from(ms, (v) => Math.round((v * RATE) / 1000))).toEqual(LENGTHS)
    expect(LENGTHS).toEqual(REFERENCE.map((length) => Math.floor((length * 48000) / 44100)))
    expectWritten(ms[0]!, '108.8 ms')
    expectWritten(ms[7]!, '176.6 ms')
    // Size scales every one of them.
    const doubled = fdn.render(click(seconds(1)), { size: 2 }).taps.lengths!.channels_data[0]!
    doubled.forEach((v, i) => expect(v).toBeCloseTo(2 * ms[i]!, 3))
  })

  it('has lines of 6,935 samples, 144.5 ms, in the mean, which is the one length its gain is worked out for (claim mean-length)', async () => {
    const fdn = await lab(NAME)
    expectWritten(MEAN, '6,935 samples')
    expectWritten((1000 * MEAN) / RATE, '144.5 ms')
    // The gain the lab reads from the device is the formula at that length, and at no line's own.
    const gain = fdn.render(click(seconds(1)), { decay: 1.5 }).checks.tripGain!
    expect(gain).toBeCloseTo((-60 * MEAN) / RATE / 1.5, 3)
    expect(Math.abs(gain - (-60 * LENGTHS[0]!) / RATE / 1.5)).toBeGreaterThan(1)
  })

  it('lets half the energy of a click out of the diffusers 18 ms after it went in, and nine tenths of it after 39 ms (claim diffusion-burst)', async () => {
    const fdn = await lab(NAME)
    const taps = fdn.render(click(seconds(1)), {}).taps
    const burst = taps.diffused!.channels_data[0]!.subarray(0, seconds(0.25))
    // One sample went in, and the diffusers answer it at once.
    const fed = taps.fed!.channels_data[0]!
    expect(fed[0]).not.toBe(0)
    expect(fed.subarray(1, seconds(0.25)).every((v) => v === 0)).toBe(true)
    expect(burst[0]).not.toBe(0)
    let whole = 0
    for (const v of burst) whole += v * v
    const after = (share: number) => {
      let sum = 0
      for (let i = 0; i < burst.length; i += 1) {
        sum += burst[i]! ** 2
        if (sum >= share * whole) return (1000 * i) / RATE
      }
      return Infinity
    }
    expectWritten(after(0.5), '18 ms')
    expectWritten(after(0.9), '39 ms')
    // All-passes: what comes out has the energy of what went in.
    expect(Math.abs(10 * Math.log10(whole / fed[0]! ** 2))).toBeLessThan(0.01)
  })

  it('hears nothing over −120 dB from line 1 until 5,223 samples after a click, and from line 8 until 8,477 samples (claim first-out)', async () => {
    const fdn = await lab(NAME)
    // A decay so short that the tail of the pass before is over. "Nothing" is under −120 dB:
    // see the residue test below for what is left.
    const out = fdn.render(click(seconds(2)), { decay: 0.1 })
    const first = (x: Float32Array) => x.findIndex((v) => Math.abs(v) > 1e-6)
    expect(first(out.taps.fed!.channels_data[0]!)).toBe(0)
    expect(first(out.taps.diffused!.channels_data[0]!)).toBe(0)
    expect(first(out.taps.written!.channels_data[0]!)).toBe(0)
    expectWritten(first(out.taps.line1!.channels_data[0]!), '5,223 samples')
    expectWritten(first(out.taps.line8!.channels_data[0]!), '8,477 samples')
  })

  it('with the lines still, says nothing over −120 dB for 217.6 ms after a click with Size at 2, and for 54.4 ms with Size at 0.5 (claim late-start)', async () => {
    const fdn = await lab(NAME)
    const first = (size: number, wander = 0) =>
      fdn
        .render(click(seconds(2)), { decay: 0.1, size, wander })
        .taps.out!.channels_data[0]!.findIndex((v) => Math.abs(v) > 1e-6)
    expectWritten((1000 * first(2)) / RATE, '217.6 ms')
    expectWritten((1000 * first(0.5)) / RATE, '54.4 ms')
    // With the lines moving, as the device always has them, the first sound comes within the
    // 12 samples of sway of that: a quarter of a millisecond either way.
    for (const size of [0.5, 2]) {
      const moving = first(size, 1)
      expect(moving).not.toBe(first(size))
      expect(Math.abs(moving - LENGTHS[0]! * size)).toBeLessThanOrEqual(13)
    }
  })

  it('holds the sound back 479 samples with the Pre-delay at 10 ms, one short of the 480 samples that 10 ms is, and one short at 1 ms, 25 ms, 100 ms and 250 ms too (claim predelay-short)', async () => {
    const fdn = await lab(NAME)
    const first = (values: Record<string, number>) =>
      fdn
        .render(click(seconds(2)), { decay: 0.1, ...values })
        .taps.fed!.channels_data[0]!.findIndex((v) => v !== 0)
    expect(first({})).toBe(0)
    expectWritten(first({ predelay: 10 }), '479 samples')
    expect(seconds(0.01)).toBe(480)
    // One short at each other setting tried, the longest among them.
    for (const ms of [1, 25, 100, 250]) {
      expect(first({ predelay: ms }), `${ms} ms`).toBe(seconds(ms / 1000) - 1)
    }
    // And the lines hear it that much later.
    const line = fdn.render(click(seconds(2)), { decay: 0.1, predelay: 10 }).taps.line1!
    expect(line.channels_data[0]!.findIndex((v) => Math.abs(v) > 1e-6)).toBe(5223 + 479)
  })

  it('is left holding 0.00000005 on line 1 after a click with Decay at 0.1 s, its sign changing every sample, when the lines stand still at whole numbers of samples; is still putting it out 7.9 s after the click; holds under 0.000001 after the drums; and holds exact zeros where no length is whole or the lines move (claim still-residue)', async () => {
    const fdn = await lab(NAME)
    // 1.9 s after the click, long after its tail: the same size on every sample, the sign
    // turned each time.
    const at = seconds(1.9)
    const end = (source: Source, values: Record<string, number>, id = 'line1') =>
      fdn.render(source, { decay: 0.1, ...values }).taps[id]!.channels_data[0]!
    const alternates = (x: Float32Array, from: number) => {
      for (let i = from; i < from + 100; i += 1) {
        expect(x[i]).toBe(-x[i - 1]!)
      }
      return Math.abs(x[from]!)
    }
    const still = alternates(end(click(seconds(2)), { size: 1 }), at)
    expectWritten(still, '0.00000005')
    expectWritten(gainToDb(still), 'under −140 dB')
    // Size at 2 leaves every length whole too. At 0.5 and at 1.5 the four even lengths are
    // whole, and the output still carries what those lines hold.
    expect(alternates(end(click(seconds(2)), { size: 2 }), at)).toBeGreaterThan(1e-8)
    for (const size of [0.5, 1.5]) {
      expect(alternates(end(click(seconds(2)), { size }, 'out'), at)).toBeGreaterThan(1e-8)
    }
    // It keeps the device awake: 7.9 s after a click, long past the 2 s of exact silence the
    // device waits for, the output still carries it.
    const late = alternates(end(click(seconds(8)), { size: 1 }, 'out'), seconds(7.9))
    expect(late).toBeGreaterThan(1e-8)
    // After the drums and six seconds of nothing it is of the same order, at two decays.
    const drums = await benchSource('drums', seconds(2))
    const after = joined(drums, silence(seconds(6)))
    for (const decay of [0.1, 0.3]) {
      const left = alternates(end(after, { decay }), seconds(7.9))
      expect(left, `Decay at ${decay} s`).toBeGreaterThan(1e-9)
      expectWritten(left, 'under 0.000001')
    }
    // Where no length is a whole number of samples, or the lines move, every line empties.
    expect(
      end(click(seconds(2)), { size: 1.01 })
        .subarray(at)
        .every((v) => v === 0),
    ).toBe(true)
    expect(
      end(click(seconds(2)), { wander: 1 })
        .subarray(at)
        .every((v) => v === 0),
    ).toBe(true)
    expect(
      end(after, { size: 1.01 }, 'out')
        .subarray(seconds(7.9))
        .every((v) => v === 0),
    ).toBe(true)
  })

  it('makes one line alone a comb: an echo every 5,223 samples, each 5.78 dB under the last (claim comb-step), gone 60 dB in 1.13 s (claim comb-alone), with a tooth every 9.19 Hz (claim comb-teeth)', async () => {
    const fdn = await lab(NAME)
    const out = fdn.render(click(seconds(1)), { decay: 1.5 })
    const comb = out.taps.comb!.channels_data[0]!
    const places: number[] = []
    comb.forEach((v, i) => v !== 0 && places.push(i))
    expect(places.slice(0, 4)).toEqual([5223, 10446, 15669, 20892])
    const step = 20 * Math.log10(comb[10446]! / comb[5223]!)
    expectWritten(-step, '5.78 dB')
    expectWritten(((60 / -step) * 5223) / RATE, '1.13 s')

    // The teeth of its response: where each peak stands, from the three points round its top.
    const teeth = out.taps.combTeeth!
    const data = teeth.channels_data[0]!
    const peaks: number[] = []
    for (let i = 1; i < data.length - 1; i += 1) {
      if (data[i]! > data[i - 1]! && data[i]! >= data[i + 1]!) {
        const bend = data[i - 1]! - 2 * data[i]! + data[i + 1]!
        const shift = bend === 0 ? 0 : (0.5 * (data[i - 1]! - data[i + 1]!)) / bend
        peaks.push((teeth.x1 * (i + shift)) / (data.length - 1))
      }
    }
    expect(peaks.length).toBe(6)
    expectWritten((peaks[5]! - peaks[0]!) / 5, '9.19 Hz')
  })

  it('gives a line alone the set decay time when its gain comes from its own length: 4.35 dB a trip for line 1 at 1.5 s (claim comb-own)', async () => {
    const fdn = await lab(NAME)
    const comb = fdn.render(click(seconds(1)), { decay: 1.5, gains: 1 }).taps.comb!
      .channels_data[0]!
    const step = 20 * Math.log10(comb[10446]! / comb[5223]!)
    expectWritten(-step, '4.35 dB')
    expectWritten(((60 / -step) * 5223) / RATE, '1.50 s')
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
    expectWritten(soonest / RATE, '6.9 s')
    // At 44.1 kHz the soonest is the product of the two shortest: nearly ten minutes.
    expect((4799 * 5399) / 44100 / 60).toBeGreaterThan(9.7)
  })

  it('multiplies the echoes when the lines are mixed: 117 in the first half second and 1,979 in the second (claim echo-density), against 12 and 15 unmixed (claim echo-apart)', async () => {
    const fdn = await lab(NAME)
    const mixed = fdn.render(click(seconds(1)), { matrix: 1 }).checks
    expect(mixed.densityFirst).toBe(117)
    expect(mixed.densitySecond).toBe(1979)
    const unmixed = fdn.render(click(seconds(1)), { matrix: 0 }).checks
    expect(unmixed.densityFirst).toBe(12)
    expect(unmixed.densitySecond).toBe(15)
    // And the count goes on growing across the two seconds the lab counts over.
    const curve = fdn.render(click(seconds(1)), { matrix: 1 }).taps.densityMixed!.channels_data[0]!
    for (let i = 8; i < curve.length; i += 4) expect(curve[i]!).toBeGreaterThan(curve[i - 4]!)
  })

  it('counts 26 echoes a millisecond two seconds after the click with the lines mixed at Size 1 (claim density-climb), and every sample an echo, 48 a millisecond, from 1.8 s on at Size 0.5 (claim density-full)', async () => {
    const fdn = await lab(NAME)
    const one = fdn.render(click(seconds(1)), { matrix: 1, size: 1 })
    const mixed = one.taps.densityMixed!.channels_data[0]!
    expectWritten(mixed[mixed.length - 1]!, '26')
    // Unmixed the count stays where it began: never more than 4 echoes in a window of 50 ms.
    expect(range(one.taps.densityApart!.channels_data[0]!).hi * 50).toBeLessThanOrEqual(4.001)
    const half = fdn.render(click(seconds(1)), { matrix: 1, size: 0.5 }).taps.densityMixed!
    const data = half.channels_data[0]!
    const full = data.findIndex((v) => v === 48)
    expect(full).toBeGreaterThan(0)
    expect(data.subarray(full).every((v) => v === 48)).toBe(true)
    expectWritten(half.x0 + ((half.x1 - half.x0) * full) / (data.length - 1), '1.8 s')
    // At Size 2 the two seconds end with under 4 a millisecond.
    const large = fdn.render(click(seconds(1)), { matrix: 1, size: 2 }).taps.densityMixed!
    expect(range(large.channels_data[0]!).hi).toBeLessThan(4.1)
  })

  it('sets one gain for all eight lines from their mean length: 5.78 dB a trip at 1.5 s (claim trip-gain), never nearer 1 than 0.975 (claim gain-cap)', async () => {
    const fdn = await lab(NAME)
    const gain = fdn.render(click(seconds(1)), { decay: 1.5 }).checks.tripGain!
    expect(gain).toBeCloseTo((-60 * MEAN) / RATE / 1.5, 2)
    expectWritten(-gain, '5.78 dB')
    // The longest decay with the shortest lines is the nearest the controls bring it to 1.
    const nearest = dbToGain(
      fdn.render(click(seconds(1)), { decay: 20, size: 0.5 }).checks.tripGain!,
    )
    expectWritten(nearest, '0.975')
    // Size leaves the gain's decay time alone: twice the length, twice the loss a trip.
    expect(fdn.render(click(seconds(1)), { decay: 1.5, size: 2 }).checks.tripGain!).toBeCloseTo(
      2 * gain,
      2,
    )
  })

  it('decays, with the damping at 0, within 15 % of the time set: 0.97 s for 1 s, 1.34 s for 1.5 s, 1.77 s for 2 s (claim decay-set)', async () => {
    const fdn = await lab(NAME)
    const measured: Record<string, number> = {}
    for (const set of [1, 1.5, 2]) {
      const time = decayTime(
        fdn.render(click(seconds(1)), { decay: set, damping: 0 }).taps.decayCurve!,
      )
      measured[set] = time
      expect(time).toBeGreaterThan(set * 0.85)
      // And always on the short side.
      expect(time).toBeLessThan(set)
    }
    expectWritten(measured[1]!, '0.97 s')
    expectWritten(measured[1.5]!, '1.34 s')
    expectWritten(measured[2]!, '1.77 s')
  })

  it('reads long, not short, by the same fitted line with Size at 2: 1.6 s for 1.5 s set (claim decay-size)', async () => {
    const fdn = await lab(NAME)
    const time = decayTime(
      fdn.render(click(seconds(1)), { decay: 1.5, damping: 0, size: 2 }).taps.decayCurve!,
    )
    expectWritten(time, '1.6 s')
    expect(time).toBeGreaterThan(1.5)
  })

  it("falls at the rate of 60 dB in 1.48 s, with 1.5 s set, in the band around 500 Hz of the device's answer from half a second after the click on (claim decay-late)", async () => {
    const fdn = await lab(NAME)
    const answer = fdn.render(click(seconds(1)), { decay: 1.5, damping: 0 }).taps.answer!
    // Measured: 1.482 s. The same answer read by the line fitted between 5 dB and 35 dB down
    // is the 1.34 s of the test above.
    expectWritten(lateDecayTime(band(answer.channels_data[0]!, 500)), '1.48 s')
  })

  it('decays in 1.46 s as a bare network with one gain for all at 1.5 s, and in 1.50 s with a gain for each line (claim bare-decay)', async () => {
    const fdn = await lab(NAME)
    const one = lateDecayTime(
      fdn.render(click(seconds(1)), { decay: 1.5, matrix: 1, gains: 0 }).taps.mixed!
        .channels_data[0]!,
    )
    const each = lateDecayTime(
      fdn.render(click(seconds(1)), { decay: 1.5, matrix: 1, gains: 1 }).taps.mixed!
        .channels_data[0]!,
    )
    expectWritten(one, '1.46 s')
    expectWritten(each, '1.50 s')
  })

  it("falls short of a long decay time: with 20 s set, the level of a click's tail falls between 1 s and 7 s after it at the rate of 60 dB in 15.7 s (claim decay-long); around 1 kHz the same tail falls at the rate of 60 dB in 19.2 s and around 8 kHz in 10.8 s (claim decay-long-bands)", async () => {
    const fdn = await lab(NAME)
    const out = fdn.render(click(seconds(8)), { decay: 20, damping: 0 })
    // Eight seconds of every tap fit in the lab's room.
    for (const tap of Object.values(out.taps)) expect(tap.length, tap.id).toBeGreaterThan(0)
    // The level's fall from 1 s to 7 s after the click, one point every 16 samples.
    const whole = (level: Float32Array) => {
      const points: [number, number][] = []
      for (let i = 3000; i < 21000; i += 1) points.push([i / 3000, level[i]!])
      return -60 / slope(points)
    }
    const twenty = whole(out.taps.level!.channels_data[0]!)
    expectWritten(twenty, '15.7 s')
    // The same seven seconds band by band: the middle of the spectrum keeps nearly the time
    // set, and the top falls far short of it.
    const tail = out.taps.out!.channels_data[0]!
    expectWritten(lateDecayTime(band(tail, 1000), 1, 7), '19.2 s')
    expectWritten(lateDecayTime(band(tail, 8000), 1, 7), '10.8 s')
    // And less well the longer Decay is: 5 s set comes nearer to 5 s than 20 s set to 20 s.
    const five = whole(
      fdn.render(click(seconds(8)), { decay: 5, damping: 0 }).taps.level!.channels_data[0]!,
    )
    expect(five).toBeLessThan(5)
    expect(five / 5).toBeGreaterThan(twenty / 20 + 0.05)
  })

  it("works the feedback path out again with the kit's matrix and lands on the device's own state, under −120 dB (claim loop-rebuilt), and the wet signal on its output", async () => {
    const fdn = await lab(NAME)
    const clicks = await benchSource('clicks', seconds(2))
    const drums = await benchSource('drums', seconds(2))
    const moved = { decay: 6, size: 1.37, damping: 0.7, wander: 1, breathDepth: 0.6, mix: 0.5 }
    for (const out of [fdn.render(clicks, {}), fdn.render(drums, {}), fdn.render(drums, moved)]) {
      expectWritten(out.checks.loop!, 'under −120 dB')
      expect(out.checks.wetAgain).toBeLessThan(-120)
    }
  })

  it('loses 9.8 dB a trip at 8 kHz against 5.8 dB at 500 Hz with the damping at 0.4 (claim damping-trip), which foretells a tail of 0.89 s at 8 kHz and of 1.49 s at 500 Hz (claim damping-foretold), and a click dies in 0.90 s around 8 kHz against 1.34 s around 500 Hz (claim damping-bands)', async () => {
    const fdn = await lab(NAME)
    const out = fdn.render(click(seconds(1)), { decay: 1.5, damping: 0.4 })
    const low = atRatio(out.taps.passGain!, 500)
    const high = atRatio(out.taps.passGain!, 8000)
    // Measured: 5.811 dB and 9.775 dB. The second stands on the edge between two numbers of
    // two places, so the lesson writes one.
    expectWritten(-low, '5.8 dB')
    expectWritten(-high, '9.8 dB')
    // What a loss a trip foretells: 60 dB, at that many dB a trip of the mean length.
    const foretold = (loss: number) => ((60 / loss) * MEAN) / RATE
    expectWritten(foretold(-low), '1.49 s')
    expectWritten(foretold(-high), '0.89 s')
    const lowTime = decayTime(out.taps.decayLow!)
    const highTime = decayTime(out.taps.decayHigh!)
    expectWritten(lowTime, '1.34 s')
    expectWritten(highTime, '0.90 s')
    // The high band lands on what was foretold; the low band reads a tenth short of it.
    expect(Math.abs(highTime - foretold(-high)) / foretold(-high)).toBeLessThan(0.05)
    expect(lowTime / foretold(-low)).toBeGreaterThan(0.85)
    expect(lowTime / foretold(-low)).toBeLessThan(0.95)
  })

  it('still loses 0.33 dB more a trip at 8 kHz and 2 dB more at 50 Hz than the gain alone, with the damping at 0 (claim damping-off)', async () => {
    const fdn = await lab(NAME)
    const out = fdn.render(click(seconds(1)), { decay: 1.5, damping: 0 })
    const gain = out.checks.tripGain!
    expectWritten(gain - atRatio(out.taps.passGain!, 8000), '0.33 dB')
    expectWritten(gain - atRatio(out.taps.passGain!, 50), '2 dB')
    expect(Math.abs(atRatio(out.taps.passGain!, 1000) - gain)).toBeLessThan(0.02)
  })

  it('has lost half its power on each trip, 3.01 dB more than the gain alone, at 38 Hz: the corner of the filter that keeps a steady offset out of the loop (claim dc-corner)', async () => {
    const fdn = await lab(NAME)
    const out = fdn.render(click(seconds(1)), { decay: 1.5, damping: 0 })
    const curve = out.taps.passGain!
    const data = curve.channels_data[0]!
    const under = (i: number) => data[i]! - out.checks.tripGain!
    const hz = (place: number) => curve.x0 * (curve.x1 / curve.x0) ** (place / (data.length - 1))
    const half = 10 * Math.log10(0.5)
    let corner = 0
    for (let i = 0; i + 1 < data.length; i += 1) {
      if (under(i) < half && under(i + 1) >= half) {
        corner = hz(i + (half - under(i)) / (under(i + 1) - under(i)))
        break
      }
    }
    expectWritten(corner, '38 Hz')
    // No control moves it: at that frequency a trip costs the same 3.01 dB more than the gain,
    // to within 0.01 dB, whatever Decay, Size and Damping say.
    for (const values of [
      { decay: 1.5, damping: 0.4 },
      { decay: 20, damping: 1 },
      { decay: 0.3, damping: 0.4, size: 2 },
      { decay: 5, damping: 0.7, size: 0.5 },
    ]) {
      const other = fdn.render(click(seconds(1)), values)
      const cost = other.checks.tripGain! - atRatio(other.taps.passGain!, corner)
      expect(Math.abs(cost - 3.01), JSON.stringify(values)).toBeLessThan(0.01)
    }
  })

  it("loses the bottom of the device's answer sooner than Decay says, whatever Damping says: with 1.5 s set the band around 40 Hz falls at the rate of 60 dB in 0.9 s where the band around 500 Hz takes 1.4 s (claim bass-short)", async () => {
    const fdn = await lab(NAME)
    // From half a second to a second and a half after the click, where both bands are well
    // over the floor.
    const time = (damping: number, hz: number) =>
      lateDecayTime(
        band(
          fdn.render(click(seconds(1)), { decay: 1.5, damping }).taps.answer!.channels_data[0]!,
          hz,
        ),
        0.5,
        1.5,
      )
    for (const damping of [0, 0.4]) {
      expectWritten(time(damping, 40), '0.9 s')
      expectWritten(time(damping, 500), '1.4 s')
    }
    // At 1 the damping filter reaches down to 500 Hz too; the bottom is where it was.
    expectWritten(time(1, 40), '0.9 s')
  })

  it('holds a steady 440 Hz sine at a level that moves less than 0.01 dB with the lines still (claim wander-still) and 4.2 dB with them moving (claim wander-moving)', async () => {
    const fdn = await lab(NAME)
    const tone = await benchSource('sine', seconds(2))
    const still = range(fdn.render(tone, { wander: 0 }).taps.level!.channels_data[0]!).span
    const moving = range(fdn.render(tone, { wander: 1 }).taps.level!.channels_data[0]!).span
    expectWritten(still, 'less than 0.01 dB')
    expectWritten(moving, '4.2 dB')
  })

  it('sways each read by 12 samples either way, which bends the pitch of line 8 by at most 2 cents (claim sway-pitch)', async () => {
    const fdn = await lab(NAME)
    const tone = await benchSource('sine', seconds(2))
    const out = fdn.render(tone, { wander: 1 })
    const sway = out.taps.sway8!.channels_data[0]!
    // The read is at most 12 samples from the line's length; over two seconds line 8 gets there.
    expect(range(sway).hi).toBeLessThanOrEqual(12)
    expect(range(sway).hi).toBeGreaterThan(11.9)
    // How fast the read slides, in samples a second: one point of the tap every 16 samples.
    let fastest = 0
    for (let i = 1; i < sway.length; i += 1)
      fastest = Math.max(fastest, Math.abs(sway[i]! - sway[i - 1]!) * (RATE / 16))
    expectWritten(1200 * Math.log2(1 + fastest / RATE), '2 cents')
    // With the lines still nothing sways.
    expect(fdn.render(tone, {}).taps.sway8!.channels_data[0]!.every((v) => v === 0)).toBe(true)
  })

  it('answers two clicks a second apart alike with the lines still and Decay at 0.3 s, more than 100 dB under the tail, and as differently as two unrelated sounds with them moving, 3 dB over it (claim wander-clicks)', async () => {
    const fdn = await lab(NAME)
    const clicks = await benchSource('clicks', seconds(2))
    const apart = (values: Record<string, number>) => {
      const out = fdn.render(clicks, values).taps.out!.channels_data[0]!
      return apartDb(out.subarray(0, RATE), out.subarray(RATE), 0, RATE)
    }
    // A decay short enough that each tail is over before the next click.
    expectWritten(-apart({ decay: 0.3, wander: 0 }), 'more than 100 dB')
    expectWritten(apart({ decay: 0.3, wander: 1 }), '3 dB')
  })

  it('opens and closes the input between 0.6 and 1 with the breath at 0.4, and leaves it at exactly 1 with the breath at 0 (claim breath)', async () => {
    const fdn = await lab(NAME)
    const drums = await benchSource('drums', seconds(4))
    const off = fdn.render(drums, { breathDepth: 0 }).taps.gate!.channels_data[0]!
    expect(off.every((v) => v === 1)).toBe(true)
    const on = range(fdn.render(drums, { breathDepth: 0.4 }).taps.gate!.channels_data[0]!)
    expectWritten(on.lo, '0.6')
    expectWritten(on.hi, '1.0')
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
    expectWritten(lr / Math.sqrt(ll * rr), '0.13')
    // That is one loop at one setting. On the drums too, and with the lines moving, a longer
    // Decay and a smaller Size, it stays under 0.3.
    const drums = await benchSource('drums', seconds(2))
    for (const source of [clicks, drums]) {
      for (const values of [{}, { wander: 1 }, { decay: 3 }, { size: 0.5 }]) {
        const [a, b] = fdn.render(source, values).taps.out!.channels_data as [
          Float32Array,
          Float32Array,
        ]
        let aa = 0
        let bb = 0
        let ab = 0
        for (let i = 0; i < a.length; i += 1) {
          aa += a[i]! ** 2
          bb += b[i]! ** 2
          ab += a[i]! * b[i]!
        }
        expectWritten(Math.abs(ab / Math.sqrt(aa * bb)), 'under 0.3')
      }
    }
  })

  it('is the input, sample for sample, with the mix at 0 (claim mix-zero)', async () => {
    const fdn = await lab(NAME)
    const drums = await benchSource('drums', seconds(2))
    const out = fdn.render(drums, { mix: 0, decay: 5 }).taps.out!
    expect(same(out.channels_data[0]!, drums.left)).toBe(true)
    expect(same(out.channels_data[1]!, drums.right)).toBe(true)
  })

  it('answers a click with a quiet tail, 25 dB under the click at its loudest (claim tail-quiet)', async () => {
    const fdn = await lab(NAME)
    const clicks = await benchSource('clicks', seconds(2))
    const out = fdn.render(clicks, {}).taps.out!
    // The click itself is 1, full scale.
    expectWritten(-gainToDb(Math.max(...out.channels_data.map(top))), '25 dB')
  })

  it('answers silence with exact silence (claim silence)', async () => {
    const fdn = await lab(NAME)
    const out = fdn.render(silence(seconds(1)), {})
    for (const id of [
      'fed',
      'diffused',
      'written',
      'line1',
      'line8',
      'wet',
      'out',
      'bare',
      'lone',
    ]) {
      expect(out.taps[id]!.channels_data[0]!.every((v) => v === 0)).toBe(true)
    }
  })

  it('starts the kept pass with the tail of the pass before, 23.5 dB under the output over the first half second of the drums (claim second-pass); passes before that one would add a part more than 100 dB under it with Decay at 1.5 s and 19 dB under it at 20 s (claim older-passes)', async () => {
    const fdn = await lab(NAME)
    const frames = seconds(2)
    const drums = await benchSource('drums', frames)
    // The loop after two seconds of nothing: the kept pass's second half has no pass before it.
    const fresh = joined(silence(frames), drums)
    // The loop twice over: three passes come before the second half of the kept pass.
    const twice = joined(drums, drums)
    const outputs = (values: Record<string, number>) => ({
      page: fdn.render(drums, values).taps.out!.channels_data[0]!,
      alone: fdn.render(fresh, values).taps.out!.channels_data[0]!.subarray(frames),
      longer: fdn.render(twice, values).taps.out!.channels_data[0]!.subarray(frames),
    })
    // From the end of the 20 ms crossfade at the loop's start.
    const start = outputs({})
    expectWritten(-apartDb(start.page, start.alone, 960, seconds(0.5)), '23.5 dB')
    expectWritten(-apartDb(start.longer, start.page, 960, frames), 'more than 100 dB')
    const long = outputs({ decay: 20 })
    expectWritten(-apartDb(long.longer, long.page, 960, frames), '19 dB')
  })

  it('plays no more of the first pass than the lines remember: with Decay at 0.3 s the kept pass is the same to within 100 dB whether the loop ran once before it or three times', async () => {
    const fdn = await lab(NAME)
    const frames = seconds(2)
    const drums = await benchSource('drums', frames)
    for (const values of [
      { decay: 0.3 },
      { decay: 0.3, matrix: 0 },
      { decay: 0.5, size: 2, predelay: 250 },
    ]) {
      const page = fdn.render(drums, values).taps
      const longer = fdn.render(joined(drums, drums), values).taps
      for (const id of ['out', 'bare', 'lone', 'line8']) {
        const a = page[id]!.channels_data[0]!
        const b = longer[id]!.channels_data[0]!.subarray(frames)
        expect(apartDb(b, a, 960, frames), `${id} at ${JSON.stringify(values)}`).toBeLessThan(-100)
      }
    }
  })

  it('renders every named set, and its tile at a level inside the band on every loop', async () => {
    const fdn = await lab(NAME)
    const settings = readSettings(NAME)!
    for (const [name, set] of Object.entries(settings.sets ?? {})) {
      const source = await benchSource(set.source ?? 'drums', seconds(2))
      const out = fdn.render(source, resolveSet(fdn.description, set).values)
      const tap = out.taps[set.tap ?? 'out']!
      expect(tap.kind, name).toBe('audio')
      expect(levelOf(tap), `${name}: the level of what its card plays`).toBeGreaterThan(-45)
      expect(levelOf(tap), name).toBeLessThan(-5)
      expect(out.checks.builtWorst, name).toBe(0)
    }
    const tile = settings.tile!
    for (const loop of LOOPS) {
      const out = fdn.render(await benchSource(loop, seconds(2)), tile.values ?? {})
      const level = levelOf(out.taps[tile.tap ?? 'out']!)
      expect(level, loop).toBeGreaterThanOrEqual(-36)
      expect(level, loop).toBeLessThanOrEqual(-5)
    }
  })

  it("keeps the settings file's defaults equal to the device's own, as its headers and its descriptor give them", async () => {
    const fdn = await lab(NAME)
    const read = (file: string) =>
      readFileSync(fileURLToPath(new URL(`../../../${file}`, import.meta.url)), 'utf8')
    const header = read('cpp/devices/fdn-reverb/fdn_reverb.h')
    const wrapper = read('cpp/devices/fdn-reverb/fdn_reverb_device.h')
    const constant = (text: string, name: string) => {
      const found = new RegExp(`${name} = ([0-9.]+)f;`).exec(text)
      if (!found) throw new Error(`No constant ${name}`)
      return Number(found[1])
    }
    const device: Record<string, number> = {
      mix: constant(wrapper, 'kDefaultMix'),
      decay: constant(header, 'kDefaultDecaySeconds'),
      damping: constant(header, 'kDefaultDamping'),
      predelay: constant(header, 'kDefaultPredelayMs'),
      size: constant(header, 'kDefaultSize'),
      breathRate: constant(header, 'kDefaultBreathRateHz'),
      breathDepth: constant(header, 'kDefaultBreathDepth'),
    }
    // The descriptor the plate is drawn from says the same.
    const descriptor = read('src/dsp/devices/fdn-reverb.ts')
    for (const [id, value] of Object.entries({ ...device, predelayMs: device.predelay })) {
      if (id === 'predelay') continue
      expect(descriptor, id).toMatch(new RegExp(`${id}: \\{[^}]*default: ${value}[,\\s]`))
    }
    // The device has no control for its lines' sway, which always runs: Wander on Moving.
    const defaults = readSettings(NAME)!.defaults!.values
    const whole = resolveSet(fdn.description, { values: defaults }).values
    for (const [id, value] of Object.entries(device)) expect(whole[id], id).toBeCloseTo(value, 6)
    expect(whole.wander).toBe(1)
    // A control the file leaves out starts where the device does already.
    for (const control of fdn.description.controls) {
      // The build's step is the page's, not a setting: no set carries it.
      if (control.id in defaults || control.id in device || control.id === 'build') continue
      expect(whole[control.id], control.id).toBe(control.initial)
    }
    // And the ranges are the device's own.
    const ranges: Record<string, [number, number]> = {
      decay: [constant(header, 'kMinDecaySeconds'), constant(header, 'kMaxDecaySeconds')],
      size: [constant(header, 'kMinSize'), constant(header, 'kMaxSize')],
      predelay: [0, constant(header, 'kMaxPredelayMs')],
      breathRate: [constant(header, 'kMinBreathRateHz'), constant(header, 'kMaxBreathRateHz')],
    }
    for (const [id, [min, max]] of Object.entries(ranges)) {
      const control = fdn.description.controls.find((one) => one.id === id)!
      expect([control.min, control.max], id).toEqual([Math.fround(min), Math.fround(max)])
    }
  })
})
