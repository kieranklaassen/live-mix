import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  benchSource,
  BIN,
  expectSoundLab,
  lab,
  noise,
  RATE,
  rms,
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

const SIXTY_THREE = 1 - Math.exp(-1)
/** One step of a 32-bit float just under 1. */
const FLOAT_STEP = 2 ** -24

/** The kit's coefficient for a cutoff (cpp/kit/filters.h), as a float holds it. */
const poleFor = (hz: number) => Math.fround(Math.exp((-2 * Math.PI * hz) / RATE))
/** The time constant of a cutoff, in samples. */
const tauSamples = (hz: number) => RATE / (2 * Math.PI * hz)

function constant(value: number, frames: number): Source {
  const source = silence(frames)
  source.left.fill(value)
  source.right.fill(value)
  return source
}

/** Half a second of silence, then half a second at 1: a step, far from the loop's wrap. */
function stepUp(): Source {
  const source = silence(seconds(1))
  source.left.fill(1, seconds(0.5))
  source.right.fill(1, seconds(0.5))
  return source
}

/** How many samples of the step have gone in when the tap first stands at `part` of the way. */
function samplesTo(tap: Float32Array, part: number): number {
  const from = seconds(0.5)
  let k = from
  while (k < tap.length && tap[k]! < part) k += 1
  return k - from + 1
}

/** The level of a tap against the input, in dB, over a whole loop of a steady tone. */
function levelDb(result: { taps: Record<string, { channels_data: Float32Array[] }> }, tap: string) {
  return (
    20 *
    Math.log10(rms(result.taps[tap]!.channels_data[0]!) / rms(result.taps.in!.channels_data[0]!))
  )
}

/** The power of a spectrum between two frequencies, in dB. */
function bandDb(spectrum: Float32Array, from: number, to: number): number {
  let sum = 0
  for (let k = Math.round(from / BIN); k <= Math.round(to / BIN); k += 1)
    sum += 10 ** (spectrum[k]! / 10)
  return 10 * Math.log10(sum)
}

describe('the one-pole filter and smoothing', () => {
  it('is a sound lab on the noise: every tap says something, loops, and answers to every control', async () => {
    const pole = await lab('one-pole')
    const hiss = await benchSource('noise', seconds(4))
    const result = pole.render(hiss, {})
    // The 63 % line is a level to read the curves against: flat by design. The stepped fader
    // steps as the loop starts, as it does ten times a second: that step is the lesson's subject.
    expectSoundLab(pole, hiss, result, { quiet: ['sixtyThree'], steps: ['zipper'] })
  })

  it('gives the newest sample a weight of 1 − a, 0.063 at 500 Hz (claim newest-weight), and each older one 0.937 of the next (claim weight-ratio)', async () => {
    const pole = await lab('one-pole')
    const out = pole.render(noise(0.25, seconds(0.5)), { cutoff: 500 })
    const h = out.taps.impulse!.channels_data[0]!
    const a = poleFor(500)
    expect(a).toBeCloseTo(0.937, 3)
    expect(h[0]).toBeCloseTo(0.063, 3)
    expect(h[0]).toBeCloseTo(1 - a, 6)
    for (let n = 1; n < h.length; n += 1) expect(h[n]! / h[n - 1]!).toBeCloseTo(0.937, 3)
  })

  it('has a time constant of 0.32 ms, 15.3 samples, at 500 Hz, read from how fast its weights fall (claim tau-500)', async () => {
    const pole = await lab('one-pole')
    const h = pole.render(noise(0.25, seconds(0.5)), { cutoff: 500 }).taps.impulse!
      .channels_data[0]!
    // Each weight is a times the one before, and a = exp(−1/(τ·fs)).
    const samples = -1 / Math.log(h[1]! / h[0]!)
    expect(samples).toBeCloseTo(15.3, 1)
    expect((samples * 1000) / RATE).toBeCloseTo(0.32, 2)
  })

  it('reads out (1 − a)·aⁿ for one unit sample, within a ten-millionth at any cutoff (claim impulse-error)', async () => {
    const pole = await lab('one-pole')
    for (const cutoff of [20, 100, 500, 2000, 8000, 20000]) {
      const out = pole.render(noise(0.25, seconds(0.5)), { cutoff })
      expect(out.checks.impulseError).toBeLessThan(1e-7)
    }
  })

  it('reaches 63 % of a step at the time constant 1/(2π·cutoff), within one sample (claim step-63)', async () => {
    const pole = await lab('one-pole')
    for (const cutoff of [20, 50, 200, 500, 1000, 5000, 20000]) {
      const out = pole.render(stepUp(), { cutoff })
      const taken = samplesTo(out.taps.low!.channels_data[0]!, SIXTY_THREE)
      // The first sample at or above 63 % is the one the time constant falls in.
      expect(taken - tauSamples(cutoff)).toBeGreaterThanOrEqual(0)
      expect(taken - tauSamples(cutoff)).toBeLessThan(1)
      // The lab measures the same on every render, for the page.
      expect(out.checks.stepTime).toBeCloseTo(taken - tauSamples(cutoff), 3)
    }
  })

  it('has covered 86 % after two time constants, 95 % after three and 99.3 % after five (claim step-two-three)', async () => {
    const pole = await lab('one-pole')
    // At 20 Hz a time constant is 382 samples, so a sample is a small part of one.
    const out = pole.render(stepUp(), { cutoff: 20 })
    const low = out.taps.low!.channels_data[0]!
    const at = (constants: number) =>
      low[seconds(0.5) + Math.round(constants * tauSamples(20)) - 1]!
    expect(at(1)).toBeCloseTo(0.632, 3)
    expect(at(2)).toBeCloseTo(0.865, 3)
    expect(at(3)).toBeCloseTo(0.95, 3)
    expect(at(5)).toBeCloseTo(0.993, 3)
  })

  it('passes a tone at its cutoff 3.0 dB down (claim minus-3)', async () => {
    const pole = await lab('one-pole')
    const out = pole.render(sine(500, 0.5, seconds(1)), { cutoff: 500 })
    expect(levelDb(out, 'low')).toBeCloseTo(-3.0, 1)
  })

  it('falls 6.0 dB an octave (claim octave) and 20 dB a decade (claim decade) well above the cutoff', async () => {
    const pole = await lab('one-pole')
    const at = (hz: number) =>
      levelDb(pole.render(sine(hz, 0.5, seconds(1)), { cutoff: 100 }), 'low')
    expect(at(1000) - at(2000)).toBeCloseTo(6.0, 1)
    expect(at(1000)).toBeCloseTo(-20.0, 0)
    expect(at(100) - at(1000)).toBeGreaterThan(16.5)
  })

  it('flattens towards the top of the band: the last octave, 10 kHz to 20 kHz, falls 4.0 dB (claim top-octave)', async () => {
    const pole = await lab('one-pole')
    const at = (hz: number) =>
      levelDb(pole.render(sine(hz, 0.5, seconds(1)), { cutoff: 100 }), 'low')
    expect(at(10000) - at(20000)).toBeCloseTo(4.0, 1)
  })

  it('passes (1 − a)/(1 + a) at half the sample rate (claim top-level)', async () => {
    const pole = await lab('one-pole')
    for (const cutoff of [3000, 5000, 12000]) {
      // Short enough a memory that the 2 ms kept is all of the response.
      const h = pole.render(noise(0.25, seconds(0.25)), { cutoff }).taps.impulse!.channels_data[0]!
      // At half the rate a tone is +1, −1, +1: its level out is the weights summed with those signs.
      let level = 0
      for (let n = 0; n < h.length; n += 1) level += n % 2 === 0 ? h[n]! : -h[n]!
      const a = poleFor(cutoff)
      expect(level, `${cutoff} Hz`).toBeCloseTo((1 - a) / (1 + a), 6)
    }
  })

  it('would be 3 dB down at the cutoff itself with the pole a = b − √(b² − 1), b = 2 − cos ω (claim exact-pole)', () => {
    // Arithmetic on the formula alone: the kit does not place its pole this way.
    for (const cutoff of [100, 500, 3600, 8000, 13500, 20000]) {
      const w = (2 * Math.PI * cutoff) / RATE
      const b = 2 - Math.cos(w)
      const a = b - Math.sqrt(b * b - 1)
      const level = (1 - a) / Math.sqrt(1 - 2 * a * Math.cos(w) + a * a)
      expect(20 * Math.log10(level), `${cutoff} Hz`).toBeCloseTo(-3.0103, 4)
    }
  })

  it('stands 2.6 dB above the textbook pole at 20 kHz with the cutoff at 500 Hz, and within 0.1 dB of it up to 3 kHz (claim bend)', async () => {
    const pole = await lab('one-pole')
    const out = pole.render(noise(0.25, seconds(0.5)), { cutoff: 500 })
    const measured = out.taps.response!.channels_data[0]!
    const textbook = out.taps.responseTextbook!.channels_data[0]!
    const hzAt = (p: number) => 20 * 1000 ** (p / 240)
    let worst = 0
    for (let p = 0; p < 241; p += 1)
      if (hzAt(p) <= 3000) worst = Math.max(worst, Math.abs(measured[p]! - textbook[p]!))
    expect(worst).toBeLessThan(0.1)
    expect(measured[240]! - textbook[240]!).toBeCloseTo(2.6, 1)
  })

  it('measures 3 dB down at 500.2 Hz with the cutoff at 500 Hz, 0.04 % high (claim corner-500)', async () => {
    const pole = await lab('one-pole')
    const out = pole.render(noise(0.25, seconds(0.5)), { cutoff: 500 })
    expect(out.checks.corner).toBeCloseTo(500.2, 1)
  })

  it('measures 3 dB down within 2 % of the cutoff for every cutoff up to 3.6 kHz, and not at 3.7 kHz (claim corner-2pc)', async () => {
    const pole = await lab('one-pole')
    const error = (cutoff: number) =>
      pole.render(noise(0.25, seconds(0.25)), { cutoff }).checks.corner! / cutoff - 1
    for (let cutoff = 20; cutoff <= 3600; cutoff *= 1.25) {
      expect(Math.abs(error(cutoff)), `${cutoff} Hz`).toBeLessThan(0.02)
    }
    expect(error(3600)).toBeLessThan(0.02)
    expect(error(3700)).toBeGreaterThan(0.02)
  })

  it('measures 3 dB down at 8.86 kHz when set to 8 kHz, 11 % high (claim corner-8k)', async () => {
    const pole = await lab('one-pole')
    const out = pole.render(noise(0.25, seconds(0.25)), { cutoff: 8000 })
    expect(out.checks.corner! / 1000).toBeCloseTo(8.86, 2)
  })

  it('puts the −3 dB point where cos ω = 2 − cosh ω₀ says, within 0.01 % (claim corner-formula)', async () => {
    const pole = await lab('one-pole')
    for (const cutoff of [100, 500, 2000, 5000, 8000, 12000]) {
      const out = pole.render(noise(0.25, seconds(0.25)), { cutoff })
      const w0 = (2 * Math.PI * cutoff) / RATE
      const predicted = (Math.acos(2 - Math.cosh(w0)) * RATE) / (2 * Math.PI)
      expect(Math.abs(out.checks.corner! / predicted - 1), `${cutoff} Hz`).toBeLessThan(1e-4)
    }
  })

  it('never falls 3 dB from 13.5 kHz up (claim corner-never): set to 20 kHz it is 1.2 dB down at 20 kHz (claim corner-20k)', async () => {
    const pole = await lab('one-pole')
    const reaches = (cutoff: number) =>
      pole.render(noise(0.25, seconds(0.25)), { cutoff }).checks.corner! < 24000
    expect(reaches(13400)).toBe(true)
    expect(reaches(13500)).toBe(false)
    expect(reaches(20000)).toBe(false)
    const out = pole.render(sine(20000, 0.5, seconds(1)), { cutoff: 20000 })
    expect(levelDb(out, 'low')).toBeCloseTo(-1.2, 1)
  })

  it('gives back the input when low and high are added: exactly on the noise, and within one rounding of a float, 7.5e-9, on the drums (claim complement)', async () => {
    const pole = await lab('one-pole')
    const apartOn = async (id: string) => {
      const out = pole.render(await benchSource(id, seconds(4)), {})
      const dry = out.taps.in!.channels_data[0]!
      const lows = out.taps.low!.channels_data[0]!
      const highs = out.taps.high!.channels_data[0]!
      let count = 0
      let worst = 0
      for (let i = 0; i < dry.length; i += 1) {
        const sum = Math.fround(lows[i]! + highs[i]!)
        if (sum !== dry[i]) count += 1
        worst = Math.max(worst, Math.abs(sum - dry[i]!))
      }
      return { count, worst }
    }
    expect((await apartOn('noise')).count).toBe(0)
    const drums = await apartOn('drums')
    // (x − low) + low is rounded twice. One sample in thirty comes back one step of a float off.
    expect(drums.count).toBeGreaterThan(0)
    expect(drums.count / seconds(4)).toBeLessThan(0.05)
    expect(drums.worst).toBeCloseTo(7.5e-9, 10)
    for (const id of ['saw', 'guitar', 'sweep'])
      expect((await apartOn(id)).worst, id).toBeLessThan(1e-8)
  })

  it('passes a tone at the cutoff 3.3 dB down through the high-pass, not 3.0 (claim high-at-cutoff), and rises 6.0 dB an octave below it (claim high-octave)', async () => {
    const pole = await lab('one-pole')
    const at = (hz: number, cutoff: number) =>
      levelDb(pole.render(sine(hz, 0.5, seconds(1)), { cutoff }), 'high')
    expect(at(500, 500)).toBeCloseTo(-3.3, 1)
    expect(at(200, 2000) - at(100, 2000)).toBeCloseTo(6.0, 1)
  })

  it('stops 7 float steps short of a steady 1 at 500 Hz, and leaves that in the high-pass, 128 dB down (claim never-arrives) (claim never-silent)', async () => {
    const pole = await lab('one-pole')
    const out = pole.render(constant(1, seconds(1)), { cutoff: 500 })
    const low = out.taps.low!.channels_data[0]!
    const high = out.taps.high!.channels_data[0]!
    const short = 1 - low[low.length - 1]!
    expect(short / FLOAT_STEP).toBeCloseTo(7, 5)
    expect(high[high.length - 1]).toBe(Math.fround(short))
    expect(20 * Math.log10(short)).toBeCloseTo(-127.6, 1)
  })

  it("is the filter inside the Tremolo: the device's low band and the lab's own one-pole are the same, sample for sample (claim split)", async () => {
    const pole = await lab('one-pole')
    for (const id of ['noise', 'drums', 'clicks', 'saw']) {
      const source = await benchSource(id, seconds(4))
      for (const cutoff of [100, 500, 4000]) {
        expect(pole.render(source, { cutoff }).checks.split, `${id} at ${cutoff} Hz`).toBe(-140)
      }
    }
  })

  it('brings the smoother 63 % of the way in its time, within one sample (claim smoother-63)', async () => {
    const pole = await lab('one-pole')
    for (const smoothing of [1, 5, 12.5, 20]) {
      const out = pole.render(noise(0.25, seconds(0.25)), { smoothing })
      const glide = out.taps.glide!.channels_data[0]!
      let calls = 0
      while (calls < glide.length && glide[calls]! < SIXTY_THREE) calls += 1
      expect(Math.abs(calls - (smoothing * RATE) / 1000)).toBeLessThanOrEqual(1)
    }
  })

  it('is the bare one-pole at the cutoff 1/(2π·time), sample for sample at 5 ms and within a millionth at any time, until it lands (claim same-filter)', async () => {
    const pole = await lab('one-pole')
    expect(pole.render(noise(0.25, seconds(0.25)), { smoothing: 5 }).checks.sameFilter).toBe(0)
    let worst = 0
    for (let smoothing = 0.3; smoothing <= 20; smoothing *= 1.37) {
      worst = Math.max(
        worst,
        pole.render(noise(0.25, seconds(0.25)), { smoothing }).checks.sameFilter!,
      )
    }
    expect(worst).toBeLessThan(1e-6)
  })

  it('answers a step at 5 ms as the filter at a cutoff of 31.8 Hz does, and not as one at 35 Hz (claim smoothing-cutoff)', async () => {
    const pole = await lab('one-pole')
    const cutoff = 1 / (2 * Math.PI * 0.005)
    expect(cutoff).toBeCloseTo(31.8, 1)
    const apart = (hz: number) => {
      const out = pole.render(noise(0.25, seconds(0.25)), { cutoff: hz, smoothing: 5 })
      const step = out.taps.step!.channels_data[0]!
      const glide = out.taps.glide!.channels_data[0]!
      let worst = 0
      for (let p = 0; p < step.length; p += 1)
        worst = Math.max(worst, Math.abs(step[p]! - glide[p]!))
      return worst
    }
    expect(apart(cutoff)).toBeLessThan(1e-6)
    expect(apart(35)).toBeGreaterThan(1e-2)
  })

  it('is 95 % of the way 15 ms after a value arrives, at 5 ms (claim lag-15)', async () => {
    const pole = await lab('one-pole')
    const glide = pole.render(noise(0.25, seconds(0.25)), { smoothing: 5 }).taps.glide!
      .channels_data[0]!
    expect(glide[seconds(0.015)]).toBeCloseTo(0.95, 3)
  })

  it('lands the smoother exactly on a target of 1, from 0, 58.7 ms after the step at 5 ms: 11.7 time constants (claim landing)', async () => {
    const pole = await lab('one-pole')
    const out = pole.render(noise(0.25, seconds(0.25)), { smoothing: 5 })
    expect(out.checks.landing).toBeCloseTo(58.7, 1)
    expect(out.checks.landing! / 5).toBeCloseTo(11.7, 1)
    const glide = pole.render(noise(0.25, seconds(0.25)), { smoothing: 2 }).taps.glide!
      .channels_data[0]!
    // Inside the 30 ms the curve shows, at a shorter time: under 1, then 1 for good.
    const landed = glide.findIndex((v) => v === 1)
    expect(landed).toBeGreaterThan(0)
    expect(glide.subarray(landed).every((v) => v === 1)).toBe(true)
  })

  it('takes 100 ms to land on nothing from 0.5 at 5 ms: towards zero only the epsilon of a billionth stops it (claim landing-zero)', async () => {
    const pole = await lab('one-pole')
    // A source of 1 under the fader is the gain itself. At two values a second the fader
    // steps from 0.5 to 0 half a second in and stays there for half a second.
    const gain = pole.render(constant(1, seconds(4)), { rides: 1, updates: 2, smoothing: 5 }).taps
      .out!.channels_data[0]!
    const from = seconds(0.5)
    expect(gain[from - 1]).toBe(0.5)
    let k = from
    while (gain[k] !== 0) k += 1
    expect(gain[k - 1]).toBeGreaterThan(0)
    expect(gain[k - 1]).toBeLessThan(2e-9)
    expect(((k - from + 1) * 1000) / RATE).toBeCloseTo(100, 0)
  })

  it('leaves the bare one-pole at 5 ms 120 float steps short of a steady 1 for good, 103 dB down (claim stall)', async () => {
    const pole = await lab('one-pole')
    const out = pole.render(noise(0.25, seconds(0.25)), { smoothing: 5 })
    expect(out.checks.stall! / FLOAT_STEP).toBeCloseTo(120, 5)
    expect(20 * Math.log10(out.checks.stall!)).toBeCloseTo(-103, 0)
  })

  it('brings the linear ramp exactly to its target in its time, 240 samples at 5 ms, and no sooner (claim ramp-arrives)', async () => {
    const pole = await lab('one-pole')
    const out = pole.render(noise(0.25, seconds(0.25)), { smoothing: 5 })
    const ramp = out.taps.glideRamp!.channels_data[0]!
    expect(ramp[240]).toBe(1)
    expect(ramp[239]).toBeLessThan(1)
    expect(ramp[120]).toBeCloseTo(0.5, 5)
    // Where the ramp has arrived, the smoother is 63 % of the way.
    expect(out.taps.glide!.channels_data[0]![240]).toBeCloseTo(0.632, 3)
  })

  it('puts a 220 Hz tone under the fader: 110 cycles in half a second (claim tone-220)', async () => {
    const pole = await lab('one-pole')
    // At two values a second the fader holds 0.5 for the first half second.
    const tone = pole.render(silence(seconds(4)), { updates: 2 }).taps.zipper!.channels_data[0]!
    let cycles = 0
    for (let i = 1; i < seconds(0.5); i += 1) if (tone[i - 1]! < 0 && tone[i]! >= 0) cycles += 1
    expect(cycles).toBe(110)
  })

  it('moves the gain 0.1 in one sample as the fader arrives, and a 240th of that through the smoother (claim gain-step)', async () => {
    const pole = await lab('one-pole')
    const out = pole.render(constant(1, seconds(4)), { rides: 1 })
    const jump = (x: Float32Array) => {
      let most = 0
      for (let i = 1; i < x.length; i += 1) most = Math.max(most, Math.abs(x[i]! - x[i - 1]!))
      return most
    }
    const stepped = jump(out.taps.zipper!.channels_data[0]!)
    const smooth = jump(out.taps.out!.channels_data[0]!)
    expect(stepped).toBeCloseTo(0.1, 5)
    expect(stepped / smooth).toBeGreaterThan(235)
    expect(stepped / smooth).toBeLessThan(245)
  })

  it('carries 40 dB less from 2 kHz up under the smoothed fader than under the stepped one, on the tone (claim click-level)', async () => {
    const pole = await lab('one-pole')
    const hiss = await benchSource('noise', seconds(4))
    pole.render(hiss, {})
    const stepped = bandDb(pole.spectrum('zipper'), 2000, 20000)
    const smooth = bandDb(pole.spectrum('out'), 2000, 20000)
    // 40.1 dB measured: the tone itself is at 220 Hz, far under the band.
    expect(stepped - smooth).toBeGreaterThan(38)
    expect(stepped - smooth).toBeLessThan(42)
  })

  it('is on the knobs of more than a hundred devices: 136 of them declare a kit::Smoother (claim smoothed-devices)', () => {
    const devices = fileURLToPath(new URL('../../../cpp/devices/', import.meta.url))
    const smoothed = readdirSync(devices, { withFileTypes: true }).filter(
      (entry) =>
        entry.isDirectory() &&
        readdirSync(devices + entry.name)
          .filter((name) => name.endsWith('.h'))
          .some((name) =>
            readFileSync(`${devices}${entry.name}/${name}`, 'utf8').includes('kit::Smoother'),
          ),
    )
    expect(smoothed.length).toBeGreaterThan(100)
  })

  it('is the stepped fader exactly with the smoothing at 0 (claim smoothing-zero)', async () => {
    const pole = await lab('one-pole')
    const hiss = await benchSource('noise', seconds(2))
    for (const rides of [0, 1]) {
      const out = pole.render(hiss, { smoothing: 0, rides })
      const stepped = out.taps.zipper!.channels_data[0]!
      expect(out.taps.out!.channels_data[0]!.every((v, i) => v === stepped[i])).toBe(true)
    }
  })
})
