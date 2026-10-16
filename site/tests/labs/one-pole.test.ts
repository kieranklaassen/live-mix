import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
  BIN,
  click,
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  noise,
  peak,
  range,
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

const tap = (result: RenderResult, id: string) => result.taps[id]!.channels_data[0]!

/**
 * How far under the input a tap stands, in dB, on a steady tone: over the whole loop, or over a
 * stretch of it that leaves out the start, where a tone that does not come round with the loop
 * leaves a filter ringing.
 */
function downDb(result: RenderResult, id: string, from = 0, to?: number) {
  return -gainToDb(rms(tap(result, id), from, to) / rms(tap(result, 'in'), from, to))
}

/** The power of a spectrum between two frequencies, in dB. */
function bandDb(spectrum: Float32Array, from: number, to: number): number {
  let sum = 0
  for (let k = Math.round(from / BIN); k <= Math.round(to / BIN); k += 1)
    sum += 10 ** (spectrum[k]! / 10)
  return 10 * Math.log10(sum)
}

/** The largest move a signal makes from one sample to the next. */
function largestMove(x: Float32Array): number {
  let most = 0
  for (let i = 1; i < x.length; i += 1) most = Math.max(most, Math.abs(x[i]! - x[i - 1]!))
  return most
}

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings('one-pole')!

/** A named set as its card plays it: on its own source, or the lesson's first, with `over` laid on its values. */
async function played(pole: Lab, name: string, over: Record<string, number> = {}) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(pole.description, set)
  return pole.render(await benchSource(source ?? 'drums', seconds(4)), { ...values, ...over })
}

/** How far under the input a tap's band stands, in dB, on the render the lab made last. */
function bandDown(pole: Lab, id: string, from: number, to: number) {
  const dry = bandDb(pole.spectrum('in'), from, to)
  return dry - bandDb(pole.spectrum(id), from, to)
}

describe('the one-pole filter and smoothing', () => {
  it('is a sound lab on the drums: every tap says something, loops, and answers to every control', async () => {
    const pole = await lab('one-pole')
    const drums = await benchSource('drums', seconds(4))
    const result = pole.render(drums, {})
    // The 63 % line is a level to read the curves against: flat by design. The stepped fader
    // steps as the loop starts, as it does ten times a second: that step is the lesson's subject.
    expectSoundLab(pole, drums, result, { quiet: ['sixtyThree'], steps: ['zipper'] })
  })

  it('builds the filter in six pieces on taps of its own: every step changes one and none changes the main path', async () => {
    const pole = await lab('one-pole')
    expect(pole.description.controls.find((control) => control.id === 'build')!.choices).toEqual([
      'A running average',
      'One number of memory',
      'The share from a time',
      'The high-pass',
      'A fader between the halves',
      'Smooth the fader',
    ])
    expectBuild(pole, await benchSource('drums', seconds(4)))
  })

  // ---- the filter on a sound -----------------------------------------------------------------

  it('gives the newest sample a weight of 0.063 at 500 Hz (claim newest-weight), and each older one 0.937 of the one after it, which is the pole (claim weight-ratio)', async () => {
    const pole = await lab('one-pole')
    const h = tap(pole.render(noise(0.25, seconds(0.5)), { cutoff: 500 }), 'impulse')
    const a = poleFor(500)
    expectWritten(a, '0.937')
    expectWritten(h[0]!, '0.063')
    expect(h[0]).toBeCloseTo(1 - a, 6)
    for (let n = 1; n < h.length; n += 1) expectWritten(h[n]! / h[n - 1]!, '0.937')
  })

  it('has a time constant of 0.32 ms, 15.3 samples, at 500 Hz, read from how fast its weights fall (claim tau-500)', async () => {
    const pole = await lab('one-pole')
    const h = tap(pole.render(noise(0.25, seconds(0.5)), { cutoff: 500 }), 'impulse')
    // Each weight is a times the one before, and a = exp(−1/(τ·fs)).
    const samples = -1 / Math.log(h[1]! / h[0]!)
    expectWritten(samples, '15.3 samples')
    expectWritten((samples * 1000) / RATE, '0.32 ms')
  })

  it('reads out (1 − a)·aⁿ for one unit sample, to less than 0.0000001 at any cutoff (claim impulse-error)', async () => {
    const pole = await lab('one-pole')
    for (const cutoff of [20, 100, 500, 2000, 8000, 20000]) {
      const out = pole.render(noise(0.25, seconds(0.5)), { cutoff })
      expectWritten(out.checks.impulseError!, 'less than 0.0000001')
    }
  })

  it('moves a fixed share of the way on every sample: sixteen samples after the input goes up it stands at 0.65 with the cutoff at 500 Hz, and at 0.41 with it at 250 Hz (claim chase)', async () => {
    const pole = await lab('one-pole')
    const chased = (cutoff: number) => pole.render(noise(0.25, seconds(0.25)), { cutoff })
    const at500 = chased(500)
    const target = tap(at500, 'chaseTarget')
    const output = tap(at500, 'chase')
    expect(target.length).toBe(33)
    // The input stands at 0, then at 1 for sixteen samples, then at 0 again.
    expect([...target].map((v) => v).join('')).toBe(`0${'1'.repeat(16)}${'0'.repeat(16)}`)
    expectWritten(output[16]!, '0.65')
    expectWritten(tap(chased(250), 'chase')[16]!, '0.41')
    // Every sample covers the same share of what is left, up and down: 1 − a.
    const a = poleFor(500)
    for (let n = 1; n < output.length; n += 1) {
      const left = target[n]! - output[n - 1]!
      expect((output[n]! - output[n - 1]!) / left).toBeCloseTo(1 - a, 4)
    }
  })

  it('reaches 63 % of a step less than 1 sample after the time constant 1/(2π·cutoff) (claim step-63)', async () => {
    const pole = await lab('one-pole')
    for (const cutoff of [20, 50, 200, 500, 1000, 5000, 20000]) {
      const out = pole.render(stepUp(), { cutoff })
      const taken = samplesTo(tap(out, 'low'), SIXTY_THREE)
      // The first sample at or above 63 % is the one the time constant falls in.
      expect(taken - tauSamples(cutoff)).toBeGreaterThanOrEqual(0)
      expectWritten(taken - tauSamples(cutoff), 'less than 1 sample')
      // The lab measures the same on every render, for the page.
      expect(out.checks.stepTime).toBeCloseTo(taken - tauSamples(cutoff), 3)
    }
  })

  it('with the cutoff at 20 Hz has covered 86.5 % after two time constants, 95 % after three and 99.3 % after five (claim step-two-three)', async () => {
    const pole = await lab('one-pole')
    // At 20 Hz a time constant is 382 samples, so a sample is a small part of one.
    const covered = (cutoff: number) => {
      const low = tap(pole.render(stepUp(), { cutoff }), 'low')
      return (constants: number) =>
        100 * low[seconds(0.5) + Math.round(constants * tauSamples(cutoff)) - 1]!
    }
    const at = covered(20)
    expectWritten(at(1), '63 %')
    expectWritten(at(2), '86.5 %')
    expectWritten(at(3), '95 %')
    expectWritten(at(5), '99.3 %')
    // Set high, a time constant is a sample or two and the count of whole samples misses it: the
    // sentence names its cutoff.
    expect(matchesWritten(covered(5000)(2), '86.5 %')).toBe(false)
  })

  it('with the cutoff at 500 Hz passes a tone at the cutoff 3.0 dB down (claim minus-3)', async () => {
    const pole = await lab('one-pole')
    const down = (cutoff: number) =>
      downDb(pole.render(sine(cutoff, 0.5, seconds(1)), { cutoff }), 'low')
    expectWritten(down(500), '3.0 dB')
    // Set high it is less: the sentence names its cutoff.
    expect(matchesWritten(down(8000), '3.0 dB')).toBe(false)
  })

  it('with the cutoff at 20 Hz falls 6.0 dB over the octave from 500 Hz to 1 kHz (claim octave), which is the higher tone 0.50 of the size of the lower (claim octave-half), and 20 dB over the decade from 200 Hz to 2 kHz (claim decade)', async () => {
    const pole = await lab('one-pole')
    const down = (hz: number, cutoff: number) =>
      downDb(pole.render(sine(hz, 0.5, seconds(1)), { cutoff }), 'low')
    // An octave is a doubling of the frequency: 500 Hz to 1 kHz, with the cutoff far under both
    // and the top of the band far over them.
    const octave = down(1000, 20) - down(500, 20)
    expectWritten(octave, '6.0 dB')
    // Half the size is 6 dB: the two say the same thing.
    expectWritten(octave, '6 dB')
    expectWritten(10 ** (-octave / 20), '0.50')
    // A decade is ten times the frequency: 200 Hz to 2 kHz.
    expectWritten(down(2000, 20) - down(200, 20), '20 dB')
    // The first decade above the cutoff holds the bend, so it falls less.
    expect(down(1000, 100) - down(100, 100)).toBeGreaterThan(16.5)
    expect(down(1000, 100) - down(100, 100)).toBeLessThan(17.5)
    // And towards the top of the band an octave falls less than that: the sentence names its octave.
    expect(matchesWritten(down(8000, 100) - down(4000, 100), '6.0 dB')).toBe(false)
  })

  it('flattens towards the top of the band: with the cutoff at 100 Hz the last octave, 10 kHz to 20 kHz, falls 4.0 dB (claim top-octave)', async () => {
    const pole = await lab('one-pole')
    const down = (hz: number) =>
      downDb(pole.render(sine(hz, 0.5, seconds(1)), { cutoff: 100 }), 'low')
    expectWritten(down(20000) - down(10000), '4.0 dB')
  })

  it('passes (1 − a)/(1 + a) at half the sample rate (claim top-level)', async () => {
    const pole = await lab('one-pole')
    for (const cutoff of [3000, 5000, 12000]) {
      // Short enough a memory that the 2 ms kept is all of the response.
      const h = tap(pole.render(noise(0.25, seconds(0.25)), { cutoff }), 'impulse')
      // At half the rate a tone is +1, −1, +1: its level out is the weights summed with those signs.
      let level = 0
      for (let n = 0; n < h.length; n += 1) level += n % 2 === 0 ? h[n]! : -h[n]!
      const a = poleFor(cutoff)
      expect(level, `${cutoff} Hz`).toBeCloseTo((1 - a) / (1 + a), 6)
    }
  })

  it('is 3 dB down at the corner asked for when its pole is a = b − √(b² − 1), b = 2 − cos ω₀ (claim exact-pole)', async () => {
    const pole = await lab('one-pole')
    for (const wanted of [100, 500, 3600, 8000, 13500, 20000]) {
      const w = (2 * Math.PI * wanted) / RATE
      const b = 2 - Math.cos(w)
      const a = b - Math.sqrt(b * b - 1)
      // The kit takes its pole from a cutoff, so the kit's filter is given the cutoff that comes
      // to that pole, and the corner is measured through it.
      const cutoff = (-Math.log(a) * RATE) / (2 * Math.PI)
      const out = pole.render(noise(0.25, seconds(0.25)), { cutoff })
      expect(out.checks.corner! / wanted, `${wanted} Hz`).toBeCloseTo(1, 5)
    }
    // Set to the corner itself, the kit's filter is not 3 dB down there.
    const plain = pole.render(noise(0.25, seconds(0.25)), { cutoff: 8000 })
    expect(plain.checks.corner! / 8000).toBeGreaterThan(1.1)
  })

  it('with the cutoff at 500 Hz stands 2.6 dB above the textbook pole at 20 kHz, and within 0.1 dB of it up to 3 kHz (claim bend)', async () => {
    const pole = await lab('one-pole')
    const out = pole.render(noise(0.25, seconds(0.5)), { cutoff: 500 })
    const measured = tap(out, 'response')
    const textbook = tap(out, 'responseTextbook')
    const hzAt = (p: number) => 20 * 1000 ** (p / 240)
    let worst = 0
    for (let p = 0; p < 241; p += 1)
      if (hzAt(p) <= 3000) worst = Math.max(worst, Math.abs(measured[p]! - textbook[p]!))
    expectWritten(worst, 'less than 0.1 dB')
    expectWritten(measured[240]! - textbook[240]!, '2.6 dB')
  })

  it('measures 3 dB down at 500.2 Hz with the cutoff at 500 Hz (claim corner-500)', async () => {
    const pole = await lab('one-pole')
    const out = pole.render(noise(0.25, seconds(0.5)), { cutoff: 500 })
    expectWritten(out.checks.corner!, '500.2 Hz')
  })

  it('measures 3 dB down within 2 % of the cutoff for every cutoff up to 3.6 kHz, and not at 3.7 kHz (claim corner-2pc)', async () => {
    const pole = await lab('one-pole')
    const error = (cutoff: number) =>
      100 * (pole.render(noise(0.25, seconds(0.25)), { cutoff }).checks.corner! / cutoff - 1)
    for (let cutoff = 20; cutoff <= 3600; cutoff *= 1.25) {
      expect(matchesWritten(Math.abs(error(cutoff)), 'less than 2 %'), `${cutoff} Hz`).toBe(true)
    }
    expectWritten(error(3600), 'less than 2 %')
    expectWritten(error(3700), 'more than 2 %')
  })

  it('measures 3 dB down at 8.86 kHz when set to 8 kHz (claim corner-8k)', async () => {
    const pole = await lab('one-pole')
    const out = pole.render(noise(0.25, seconds(0.25)), { cutoff: 8000 })
    expectWritten(out.checks.corner! / 1000, '8.86 kHz')
  })

  it('puts the −3 dB point where cos ω = 2 − cosh ω₀ says, to less than 0.001 % (claim corner-formula)', async () => {
    const pole = await lab('one-pole')
    // Every cutoff that has a corner under half the sample rate, in steps of about a sixth of an octave.
    for (let cutoff = 20; cutoff < 13000; cutoff *= 1.13) {
      const out = pole.render(noise(0.25, seconds(0.25)), { cutoff })
      const w0 = (2 * Math.PI * cutoff) / RATE
      const predicted = (Math.acos(2 - Math.cosh(w0)) * RATE) / (2 * Math.PI)
      expectWritten(100 * Math.abs(out.checks.corner! / predicted - 1), 'less than 0.001 %')
    }
  })

  it('set to 13.5 kHz or higher does not fall 3 dB anywhere under half the sample rate (claim corner-never): set to 20 kHz it is 1.2 dB down at 20 kHz (claim corner-20k)', async () => {
    const pole = await lab('one-pole')
    const reaches = (cutoff: number) =>
      pole.render(noise(0.25, seconds(0.25)), { cutoff }).checks.corner! < 24000
    expect(reaches(13400)).toBe(true)
    expect(reaches(13500)).toBe(false)
    expect(reaches(20000)).toBe(false)
    const out = pole.render(sine(20000, 0.5, seconds(1)), { cutoff: 20000 })
    expectWritten(downDb(out, 'low'), '1.2 dB')
  })

  it('gives back the input when low and high are added: exactly on the noise, and to one rounding of a float, 7.45 billionths of full scale, on the drums (claim complement)', async () => {
    const pole = await lab('one-pole')
    const apartOn = async (id: string) => {
      const out = pole.render(await benchSource(id, seconds(4)), {})
      const dry = tap(out, 'in')
      const lows = tap(out, 'low')
      const highs = tap(out, 'high')
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
    // One step of a float between a sixteenth and an eighth of full scale: 2 to the −27th.
    expect(drums.worst).toBe(2 ** -27)
    expectWritten(drums.worst * 1e9, '7.45 billionths')
    for (const id of ['saw', 'guitar', 'sweep'])
      expect((await apartOn(id)).worst, id).toBeLessThan(1e-8)
  })

  it('with the cutoff at 500 Hz passes a tone at the cutoff 3.3 dB down through the high-pass, not 3.0 (claim high-at-cutoff), and far below the cutoff rises 6.0 dB an octave (claim high-octave)', async () => {
    const pole = await lab('one-pole')
    const down = (hz: number, cutoff: number) =>
      downDb(pole.render(sine(hz, 0.5, seconds(1)), { cutoff }), 'high')
    expectWritten(down(500, 500), '3.3 dB')
    expect(matchesWritten(down(500, 500), '3.0 dB')).toBe(false)
    // Far below: from 100 Hz to 200 Hz, with the cutoff at 2 kHz.
    expectWritten(down(100, 2000) - down(200, 2000), '6.0 dB')
    // The higher the cutoff, the further the high-pass at the cutoff is under the low-pass there.
    const under = (cutoff: number) =>
      down(cutoff, cutoff) - downDb(pole.render(sine(cutoff, 0.5, seconds(1)), { cutoff }), 'low')
    expect(under(500)).toBeGreaterThan(under(100))
    expect(under(2000)).toBeGreaterThan(under(500))
    expect(under(8000)).toBeGreaterThan(under(2000))
  })

  it('crosses its high-pass beside the cutoff while the cutoff is low, further above it as the cutoff rises, and nowhere with the cutoff at its highest', async () => {
    const pole = await lab('one-pole')
    // Where the two measured responses cross, as a multiple of the cutoff; 0 where they do not.
    const crossing = (cutoff: number) => {
      const out = pole.render(noise(0.25, seconds(0.25)), { cutoff })
      const lows = tap(out, 'response')
      const highs = tap(out, 'responseHigh')
      for (let p = 1; p < lows.length; p += 1) {
        if (lows[p]! > highs[p]!) continue
        return (20 * 1000 ** (p / (lows.length - 1))) / cutoff
      }
      return 0
    }
    // The curves have 80 points a decade, so a crossing is found to within 3 %.
    for (const cutoff of [50, 100, 500]) {
      expect(crossing(cutoff), `${cutoff} Hz`).toBeGreaterThan(0.97)
      expect(crossing(cutoff), `${cutoff} Hz`).toBeLessThan(1.08)
    }
    expect(crossing(5000)).toBeGreaterThan(1.4)
    expect(crossing(20000)).toBe(0)
  })

  it('parts from the textbook pole in the same place whatever the cutoff: within 1 dB of it up to 10 kHz, and more than 2 dB above it at 20 kHz', async () => {
    const pole = await lab('one-pole')
    for (const cutoff of [50, 100, 500, 2000, 5000]) {
      const out = pole.render(noise(0.25, seconds(0.25)), { cutoff })
      const measured = tap(out, 'response')
      const textbook = tap(out, 'responseTextbook')
      const hzAt = (p: number) => 20 * 1000 ** (p / 240)
      for (let p = 0; p < 241 && hzAt(p) <= 10000; p += 1)
        expect(Math.abs(measured[p]! - textbook[p]!), `${cutoff} Hz`).toBeLessThan(1)
      expect(measured[240]! - textbook[240]!, `${cutoff} Hz`).toBeGreaterThan(2)
    }
  })

  it('stops 7 float steps short of a steady 1 at 500 Hz, and leaves that in the high-pass, 128 dB down (claim never-arrives) (claim never-silent)', async () => {
    const pole = await lab('one-pole')
    const out = pole.render(constant(1, seconds(1)), { cutoff: 500 })
    const low = tap(out, 'low')
    const high = tap(out, 'high')
    const short = 1 - low[low.length - 1]!
    expectWritten(short / FLOAT_STEP, '7 float steps')
    expect(short / FLOAT_STEP).toBeCloseTo(7, 5)
    expect(high[high.length - 1]).toBe(Math.fround(short))
    expectWritten(-20 * Math.log10(short), '128 dB')
  })

  it("is the filter inside the Tremolo: the device's low band, read out of it sample by sample, and the lab's own one-pole are the same, sample for sample (claim split)", async () => {
    const pole = await lab('one-pole')
    for (const id of ['noise', 'drums', 'clicks', 'saw']) {
      const source = await benchSource(id, seconds(4))
      for (const cutoff of [100, 500, 4000]) {
        const out = pole.render(source, { cutoff })
        expect(out.checks.split, `${id} at ${cutoff} Hz`).toBe(-140)
        // And where the device is awake the whole loop through, its band is the lesson's low-pass.
        if (id !== 'noise' && id !== 'saw') continue
        const band = tap(out, 'deviceLow')
        const low = tap(out, 'low')
        expect(band.every((v, i) => v === low[i])).toBe(true)
      }
    }
    // The device's crossover stops at 100 Hz and at 4 kHz; the lesson's cutoff goes on.
    const beyond = pole.render(await benchSource('noise', seconds(1)), { cutoff: 8000 })
    expect(beyond.checks.split).toBe(-140)
    expect(tap(beyond, 'deviceLow').some((v, i) => v !== tap(beyond, 'low')[i])).toBe(true)
  })

  it('set as the bench sets it, the Tremolo passes one band at a time: its output and its low band for half of each cycle, or the rest of the sound for the other half, are more than 100 dB apart on every loop of the page (claim trades)', async () => {
    const pole = await lab('one-pole')
    for (const id of [
      'drums',
      'chords',
      'mix',
      'pad',
      'saw',
      'noise',
      'clicks',
      'sweep',
      'guitar',
    ]) {
      const source = await benchSource(id, seconds(4))
      for (const cutoff of [100, 500, 4000]) {
        const out = pole.render(source, { cutoff })
        // The check is the difference under the band, in dB: a level below 0.
        expectWritten(-out.checks.trades!, 'more than 100 dB')
      }
    }
  })

  // ---- the filter on a control ----------------------------------------------------------------

  it('brings the smoother 63 % of the way in its time, at most 1 sample out (claim smoother-63)', async () => {
    const pole = await lab('one-pole')
    for (const smoothing of [1, 5, 12.5, 20]) {
      const glide = tap(pole.render(noise(0.25, seconds(0.25)), { smoothing }), 'glide')
      let calls = 0
      while (calls < glide.length && glide[calls]! < SIXTY_THREE) calls += 1
      expectWritten(Math.abs(calls - (smoothing * RATE) / 1000), 'at most 1 sample')
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
    expectWritten(cutoff, '31.8 Hz')
    const apart = (hz: number) => {
      const out = pole.render(noise(0.25, seconds(0.25)), { cutoff: hz, smoothing: 5 })
      const step = tap(out, 'step')
      const glide = tap(out, 'glide')
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
    const glide = tap(pole.render(noise(0.25, seconds(0.25)), { smoothing: 5 }), 'glide')
    expectWritten(100 * glide[seconds(0.015)]!, '95 %')
  })

  it('lands the smoother exactly on a target of 1, from 0, 58.7 ms after the step at 5 ms: 11.7 time constants (claim landing)', async () => {
    const pole = await lab('one-pole')
    const out = pole.render(noise(0.25, seconds(0.25)), { smoothing: 5 })
    expectWritten(out.checks.landing!, '58.7 ms')
    expectWritten(out.checks.landing! / 5, '11.7 time constants')
    const glide = tap(pole.render(noise(0.25, seconds(0.25)), { smoothing: 2 }), 'glide')
    // Inside the 30 ms the curve shows, at a shorter time: under 1, then 1 for good.
    const landed = glide.findIndex((v) => v === 1)
    expect(landed).toBeGreaterThan(0)
    expect(glide.subarray(landed).every((v) => v === 1)).toBe(true)
  })

  it('takes 100 ms to land on nothing from 0.5 at 5 ms: towards zero only the distance of a billionth stops it (claim landing-zero)', async () => {
    const pole = await lab('one-pole')
    // A source of 1 under the fader is the gain itself. At two values a second the fader
    // steps from 0.5 to 0 half a second in and stays there for half a second.
    const gain = tap(
      pole.render(constant(1, seconds(4)), { rides: 1, updates: 2, smoothing: 5 }),
      'out',
    )
    const from = seconds(0.5)
    expect(gain[from - 1]).toBe(0.5)
    let k = from
    while (gain[k] !== 0) k += 1
    expect(gain[k - 1]).toBeGreaterThan(0)
    expect(gain[k - 1]).toBeLessThan(2e-9)
    expectWritten(((k - from + 1) * 1000) / RATE, '100 ms')
  })

  it('leaves the bare one-pole at 5 ms 120 float steps short of a steady 1 for good, 103 dB down (claim stall)', async () => {
    const pole = await lab('one-pole')
    const out = pole.render(noise(0.25, seconds(0.25)), { smoothing: 5 })
    // The lab counts the distance in steps of a float just under 1.
    expectWritten(out.checks.stall!, '120 float steps')
    expect(out.checks.stall!).toBeCloseTo(120, 5)
    expectWritten(-20 * Math.log10(out.checks.stall! * FLOAT_STEP), '103 dB')
    // With no smoothing time there is no filter to stop short.
    expect(pole.render(noise(0.25, seconds(0.25)), { smoothing: 0 }).checks.stall).toBe(0)
  })

  it('brings the linear ramp exactly to its target in its time, 240 samples at 5 ms, and no sooner (claim ramp-arrives)', async () => {
    const pole = await lab('one-pole')
    const out = pole.render(noise(0.25, seconds(0.25)), { smoothing: 5 })
    const ramp = tap(out, 'glideRamp')
    expect(ramp[240]).toBe(1)
    expect(ramp[239]).toBeLessThan(1)
    expect(ramp[120]).toBeCloseTo(0.5, 5)
    expectWritten(
      ramp.findIndex((v) => v === 1),
      '240 samples',
    )
    // Where the ramp has arrived, the smoother is 63 % of the way.
    expectWritten(100 * tap(out, 'glide')[240]!, '63 %')
  })

  it('puts a 220 Hz tone under the fader: 110 cycles in half a second (claim tone-220)', async () => {
    const pole = await lab('one-pole')
    // At two values a second the fader holds 0.5 for the first half second.
    const tone = tap(pole.render(silence(seconds(4)), { updates: 2 }), 'zipper')
    let cycles = 0
    for (let i = 1; i < seconds(0.5); i += 1) if (tone[i - 1]! < 0 && tone[i]! >= 0) cycles += 1
    expectWritten(cycles / 0.5, '220 Hz')
  })

  it('moves the gain 0.1 in one sample as the fader arrives, and less than a 240th of that through the smoother at 5 ms (claim gain-step)', async () => {
    const pole = await lab('one-pole')
    const out = pole.render(constant(1, seconds(4)), { rides: 1 })
    const stepped = largestMove(tap(out, 'zipper'))
    const smooth = largestMove(tap(out, 'out'))
    expectWritten(stepped, '0.1')
    expectWritten(stepped / smooth, 'more than 240')
    expect(stepped / smooth).toBeLessThan(241)
  })

  it('carries 40 dB less from 2 kHz up under the smoothed fader than under the stepped one, on the tone (claim click-level)', async () => {
    const pole = await lab('one-pole')
    pole.render(silence(seconds(4)), {})
    const stepped = bandDb(pole.spectrum('zipper'), 2000, 20000)
    const smooth = bandDb(pole.spectrum('out'), 2000, 20000)
    // The tone itself is at 220 Hz, far under the band.
    expectWritten(stepped - smooth, '40 dB')
  })

  it('carries only 16 dB less from 2 kHz up when the unsmoothed fader sends 200 values a second in place of 10 (claim more-often)', async () => {
    const pole = await lab('one-pole')
    const clicks = (updates: number) => {
      pole.render(silence(seconds(4)), { updates })
      return bandDb(pole.spectrum('zipper'), 2000, 20000)
    }
    expectWritten(clicks(10) - clicks(200), '16 dB')
  })

  it('is on the controls of more than 100 devices, counted as those whose headers declare a kit::Smoother (claim smoothed-devices)', () => {
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
    expectWritten(smoothed.length, 'more than 100')
  })

  it('is the stepped fader exactly with the smoothing at 0 (claim smoothing-zero)', async () => {
    const pole = await lab('one-pole')
    const hiss = await benchSource('noise', seconds(2))
    for (const rides of [0, 1]) {
      const out = pole.render(hiss, { smoothing: 0, rides })
      const stepped = tap(out, 'zipper')
      expect(tap(out, 'out').every((v, i) => v === stepped[i])).toBe(true)
    }
  })

  // ---- the build, a piece at a time ----------------------------------------------------------

  it('with the cutoff at 500 Hz the running average spans 31 samples: one sample in comes out as 31 equal samples and then nothing, and with one number of memory in its place the answer does not stop there (claim build-window)', async () => {
    const pole = await lab('one-pole')
    const answer = (build: number) => {
      const out = pole.render(click(seconds(1), seconds(0.5)), { build, cutoff: 500 })
      return [...tap(out, 'built')].filter((v) => v !== 0)
    }
    const average = answer(0)
    expectWritten(average.length, '31 samples')
    expect(average.every((v) => v === Math.fround(1 / 31))).toBe(true)
    // The piece after it, in its place: the newest sample gets 2/(31 + 1), and the rest tails off.
    const number = answer(1)
    expect(matchesWritten(number.length, '31 samples')).toBe(false)
    expect(number.length).toBeGreaterThan(400)
    expect(number[0]).toBeCloseTo(2 / 32, 6)
    expect(number.every((v, n) => n === 0 || v < number[n - 1]!)).toBe(true)
  })

  it('the running average of 31 samples takes a tone at 1,548 Hz out, more than 60 dB down, and lets a higher one at 2,323 Hz through 13.4 dB down (claim build-holes); one number of memory passes the first 10.3 dB down and the second 13.6 dB down (claim build-one-number)', async () => {
    const pole = await lab('one-pole')
    // 1,548 Hz is the tone that fits the 31 samples exactly once: 48,000 / 31.
    const fits = RATE / 31
    const down = (build: number, hz: number) =>
      downDb(
        pole.render(sine(hz, 0.5, seconds(1)), { build, cutoff: 500 }),
        'built',
        seconds(0.1),
        seconds(0.9),
      )
    expectWritten(fits, '1,548 Hz')
    expectWritten(1.5 * fits, '2,323 Hz')
    expectWritten(down(0, fits), 'more than 60 dB')
    expectWritten(down(0, 1.5 * fits), '13.4 dB')
    expectWritten(down(1, fits), '10.3 dB')
    expectWritten(down(1, 1.5 * fits), '13.6 dB')
    // Each number goes with its piece: at the other step neither is what is measured.
    expect(matchesWritten(down(1, fits), 'more than 60 dB')).toBe(false)
    expect(matchesWritten(down(0, fits), '10.3 dB')).toBe(false)
    expect(matchesWritten(down(0, 1.5 * fits), '13.6 dB')).toBe(false)
  })

  it('worked out from a time, the share gives the weights a time constant of 15.3 samples at 500 Hz, where the share worked out from the count of samples gave 15.5 samples and made one filter of 5 kHz and 6 kHz (claim build-exact)', async () => {
    const pole = await lab('one-pole')
    const weights = (build: number, cutoff: number) =>
      tap(pole.render(click(seconds(1), seconds(0.5)), { build, cutoff }), 'built').slice(
        seconds(0.5),
      )
    const constantOf = (build: number) => {
      const h = weights(build, 500)
      return -1 / Math.log(h[1]! / h[0]!)
    }
    expectWritten(constantOf(2), '15.3 samples')
    expectWritten(constantOf(1), '15.5 samples')
    expect(matchesWritten(constantOf(1), '15.3 samples')).toBe(false)
    // A count of samples is a whole number: 5 kHz and 6 kHz both come to three samples, so the
    // step before made one filter of the two. A time tells them apart.
    const same = (build: number) => {
      const a = weights(build, 5000)
      const b = weights(build, 6000)
      return a.every((v, n) => v === b[n])
    }
    expect(same(1)).toBe(true)
    expect(same(2)).toBe(false)
    // The span itself, read off the running average of the first step: three samples at both.
    for (const cutoff of [5000, 6000])
      expectWritten(weights(0, cutoff).filter((v) => v !== 0).length, '3 samples')
  })

  it('the high-pass passes a 50 Hz tone 20.3 dB down with the cutoff at 500 Hz, where the low-pass of the step before passed it less than 0.1 dB down (claim build-high)', async () => {
    const pole = await lab('one-pole')
    const down = (build: number) =>
      downDb(
        pole.render(sine(50, 0.5, seconds(1)), { build, cutoff: 500 }),
        'built',
        seconds(0.1),
        seconds(0.9),
      )
    expectWritten(down(3), '20.3 dB')
    expectWritten(down(2), 'less than 0.1 dB')
    expect(matchesWritten(down(2), '20.3 dB')).toBe(false)
  })

  it('with the fader at one half, as it is for the first tenth of a second, the halves add back to the sound at half its size: a 750 Hz tone comes out 6.0 dB down, where the high-pass alone passed it 1.9 dB down (claim build-fader)', async () => {
    const pole = await lab('one-pole')
    const from = seconds(0.03)
    const to = seconds(0.09)
    const render = (build: number) => pole.render(sine(750, 0.5, seconds(4)), { build })
    const faded = render(4)
    // The fader holds one half until a tenth of a second in.
    const held = tap(faded, 'builtFader')
    expect(held[Math.round(from / 16)]).toBe(0.5)
    expect(held[Math.round(to / 16)]).toBe(0.5)
    expectWritten(downDb(faded, 'built', from, to), '6.0 dB')
    expectWritten(downDb(render(3), 'built', from, to), '1.9 dB')
    expect(matchesWritten(downDb(render(3), 'built', from, to), '6.0 dB')).toBe(false)
    // At its ends the fader gives one half alone: the low half at 1, the high half at 0.
    const ends = pole.render(sine(1000, 0.5, seconds(4)), { build: 4, updates: 2 })
    const out = tap(ends, 'built')
    const lows = tap(ends, 'builtLow')
    const dry = tap(ends, 'in')
    // Two values a second: nothing from half a second in, and all the way up from a second and a half.
    for (let i = seconds(0.6); i < seconds(0.9); i += 97)
      expect(out[i]).toBe(Math.fround(dry[i]! - lows[i]!))
    for (let i = seconds(1.6); i < seconds(1.9); i += 97) expect(out[i]).toBeCloseTo(lows[i]!, 6)
  })

  it('smoothing the fader takes its largest move in one sample from 0.1 to less than 0.001, and what its steps put above 2 kHz on a 220 Hz tone down by 40 dB (claim build-smooth)', async () => {
    const pole = await lab('one-pole')
    // A steady 1 through the build comes out as the fader itself, all but the last few float steps.
    const moves = (build: number) =>
      largestMove(tap(pole.render(constant(1, seconds(4)), { build }), 'built'))
    expectWritten(moves(4), '0.1')
    expectWritten(moves(5), 'less than 0.001')
    expect(matchesWritten(moves(4), 'less than 0.001')).toBe(false)
    const clicks = (build: number) => {
      pole.render(sine(220, 0.5, seconds(4)), { build })
      return bandDb(pole.spectrum('built'), 2000, 20000)
    }
    expectWritten(clicks(4) - clicks(5), '40 dB')
  })

  it('with all six pieces the build is the blend made from the kit’s own filter and smoother: the difference reads −140 dB, its floor, on every loop and at every setting tried (claim build-same)', async () => {
    const pole = await lab('one-pole')
    const tried = [
      {},
      { cutoff: 60, updates: 200, smoothing: 20 },
      { cutoff: 8000, updates: 2, smoothing: 0.3 },
      { smoothing: 0 },
    ]
    // The loops the page offers, as its front matter lists them.
    const loops = ['drums', 'chords', 'mix', 'pad', 'saw', 'noise', 'clicks', 'sweep', 'guitar']
    for (const id of loops) {
      const source = await benchSource(id, seconds(4))
      for (const values of tried) {
        const out = pole.render(source, values)
        expect(out.checks.builtStep).toBe(5)
        expect(out.checks.builtBound).toBe(-120)
        expectWritten(out.checks.builtDifference!, '−140 dB')
      }
    }
    // The same at whichever step is shown: the whole build runs beside it on every render.
    const drums = await benchSource('drums', seconds(4))
    for (let build = 0; build < 6; build += 1)
      expect(pole.render(drums, { build }).checks.builtDifference).toBe(-140)
  })

  // ---- the named sets: what each card plays, and the number its card states -------------------

  it('renders every named set as its card plays it: finite, heard, and under full scale', async () => {
    const pole = await lab('one-pole')
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = await played(pole, name)
      const sound = tap(result, set.tap ?? 'low')
      expect(
        sound.every((v) => Number.isFinite(v)),
        name,
      ).toBe(true)
      expect(gainToDb(rms(sound)), `${name} is heard`).toBeGreaterThan(-40)
      expect(gainToDb(peak(sound)), `${name} fits`).toBeLessThan(0)
    }
  })

  it('takes the top off the drums and leaves the bottom: what is above 2 kHz comes out 24 dB lower, and what is below 150 Hz 0.6 dB lower (claim use-kick)', async () => {
    const pole = await lab('one-pole')
    await played(pole, 'kick')
    expectWritten(bandDown(pole, 'low', 2000, 20000), '24 dB')
    expectWritten(bandDown(pole, 'low', 20, 150), '0.6 dB')
  })

  it('takes the bottom out of a mix and leaves the top: through the high-pass what is below 150 Hz comes out 11 dB lower, and what is above 2 kHz 0.2 dB lower (claim use-thin)', async () => {
    const pole = await lab('one-pole')
    await played(pole, 'thin')
    expectWritten(bandDown(pole, 'high', 20, 150), '11 dB')
    expectWritten(bandDown(pole, 'high', 2000, 20000), '0.2 dB')
  })

  it('splits the chords in two inside the Tremolo: its low band comes out 1.3 dB under the chords and the rest 6.2 dB under them, and the two add back to the chords (claim use-bands)', async () => {
    const pole = await lab('one-pole')
    const out = await played(pole, 'bands')
    expectWritten(downDb(out, 'deviceLow'), '1.3 dB')
    expectWritten(downDb(out, 'high'), '6.2 dB')
    const band = tap(out, 'deviceLow')
    const highs = tap(out, 'high')
    const dry = tap(out, 'in')
    // The device's band is the lesson's low-pass, and with the high-pass it gives the chords back.
    expect(band.every((v, i) => v === tap(out, 'low')[i])).toBe(true)
    let worst = 0
    for (let i = 0; i < dry.length; i += 1)
      worst = Math.max(worst, Math.abs(Math.fround(band[i]! + highs[i]!) - dry[i]!))
    expect(worst).toBeLessThan(1e-8)
  })

  it('takes the edge off the saw: what is above 5 kHz comes out 8.1 dB lower, and what is below 1 kHz less than 0.1 dB lower (claim way-soften)', async () => {
    const pole = await lab('one-pole')
    await played(pole, 'soften')
    expectWritten(bandDown(pole, 'low', 5000, 20000), '8.1 dB')
    expectWritten(bandDown(pole, 'low', 20, 1000), 'less than 0.1 dB')
  })

  it('plays what the low-pass took away from the drums: the high-pass alone comes out 11 dB under the drums, and the low-pass less than 0.5 dB under them (claim way-removed)', async () => {
    const pole = await lab('one-pole')
    const out = await played(pole, 'removed')
    expectWritten(downDb(out, 'high'), '11 dB')
    expectWritten(downDb(out, 'low'), 'less than 0.5 dB')
  })

  it('makes swells of jumps: with two values a second and the smoothing at 20 ms, 95 % of a jump of the gain is covered 60 ms after it (claim way-swell)', async () => {
    const pole = await lab('one-pole')
    // The gain itself: the set's values under a steady 1 in place of the pad.
    const { values } = resolveSet(pole.description, settings.sets.swell!)
    const gain = tap(pole.render(constant(1, seconds(4)), values), 'out')
    // At two values a second the fader jumps from 0 to one half a second in.
    expect(gain[seconds(1) - 1]).toBe(0)
    expectWritten((100 * gain[seconds(1.06)]!) / 0.5, '95 %')
    expectWritten((100 * gain[seconds(1.02)]!) / 0.5, '63 %')
  })

  it('with 200 values a second and the smoothing at 5 ms, what the fader leaves above 2 kHz on the tone is 50 dB lower than the unsmoothed fader left at 10 a second, and 10 dB lower than the smoothing alone left (claim way-fine)', async () => {
    const pole = await lab('one-pole')
    const clicks = async (id: string, name?: string) => {
      if (name) await played(pole, name)
      else pole.render(silence(seconds(4)), {})
      return bandDb(pole.spectrum(id), 2000, 20000)
    }
    const fine = await clicks('out', 'fine')
    expectWritten((await clicks('zipper')) - fine, '50 dB')
    expectWritten((await clicks('out')) - fine, '10 dB')
  })

  it('with four values a second and the smoothing at 5 ms the smoothed gain stands exactly on a stair 76 % of the time, and what the stairs leave above 2 kHz on the tone is 40 dB lower than unsmoothed (claim fault-stairs)', async () => {
    const pole = await lab('one-pole')
    const { values } = resolveSet(pole.description, settings.sets.stairs!)
    const steady = pole.render(constant(1, seconds(4)), { ...values, rides: 1 })
    const stepped = tap(steady, 'zipper')
    const gain = tap(steady, 'out')
    let standing = 0
    for (let i = 0; i < gain.length; i += 1) if (gain[i] === stepped[i]) standing += 1
    expectWritten((100 * standing) / gain.length, '76 %')
    await played(pole, 'stairs')
    const rough = bandDb(pole.spectrum('zipper'), 2000, 20000)
    expectWritten(rough - bandDb(pole.spectrum('out'), 2000, 20000), '40 dB')
  })

  it('with 200 values a second and the smoothing at 20 ms the gain gets no lower than 37 dB down where the fader reaches nothing; with it at 5 ms it gets 51 dB down (claim fault-late)', async () => {
    const pole = await lab('one-pole')
    const { values } = resolveSet(pole.description, settings.sets.late!)
    const lowest = (over: Record<string, number>) =>
      -gainToDb(
        range(tap(pole.render(constant(1, seconds(4)), { ...values, rides: 1, ...over }), 'out'))
          .lo,
      )
    expectWritten(lowest({}), '37 dB')
    expectWritten(lowest({ smoothing: 5 }), '51 dB')
  })

  it('is no wall: with the cutoff at 200 Hz the drums above 2 kHz come out 26 dB lower, and with it an octave lower, at 100 Hz, 6 dB lower still (claim fault-gentle)', async () => {
    const pole = await lab('one-pole')
    await played(pole, 'gentle')
    const at200 = bandDown(pole, 'low', 2000, 20000)
    expectWritten(at200, '26 dB')
    await played(pole, 'gentle', { cutoff: 100 })
    expectWritten(bandDown(pole, 'low', 2000, 20000) - at200, '6 dB')
  })
})
