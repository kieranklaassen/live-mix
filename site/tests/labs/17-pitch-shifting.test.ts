import { describe, expect, it } from 'vitest'
import {
  benchSource,
  differenceDb,
  expectSoundLab,
  gainToDb,
  lab,
  mean,
  rms,
  seconds,
  sine,
  type Source,
} from './support.ts'

const RATE = 48_000
/** Control taps have a point every 16 samples: 3,000 a second. */
const POINTS = 3000

/** The loop's sine: 440 Hz, 12 dB under full scale, as the page plays it. */
const tone = () => benchSource('sine', seconds(4))

/**
 * The amplitude, in dB, of the line at exactly `hz` in the three seconds from 0.5 s: the sum the
 * Fourier transform is, at that one frequency, under a Hann window. Lines more than a hertz or
 * two away do not reach it.
 */
function lineDb(x: Float32Array, hz: number): number {
  const from = seconds(0.5)
  const count = seconds(3)
  let re = 0
  let im = 0
  let weight = 0
  for (let i = 0; i < count; i += 1) {
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / count)
    const phase = (2 * Math.PI * hz * i) / RATE
    re += window * x[from + i]! * Math.cos(phase)
    im -= window * x[from + i]! * Math.sin(phase)
    weight += window
  }
  return gainToDb((2 * Math.hypot(re, im)) / weight)
}

/** The tallest sample, in dB, of each stretch of `span` samples from 0.5 s to 3.5 s. */
function crests(x: Float32Array, span = 60): number[] {
  const out: number[] = []
  for (let i = seconds(0.5); i + span <= seconds(3.5); i += span) {
    let top = 0
    for (let j = i; j < i + span; j += 1) top = Math.max(top, Math.abs(x[j]!))
    out.push(gainToDb(top))
  }
  return out
}

const depth = (values: number[]) => Math.max(...values) - Math.min(...values)

/** How many times a second a value falls into the lower quarter of its range and climbs out. */
function dipsPerSecond(values: number[], perSecond: number): number {
  const lo = Math.min(...values)
  const span = Math.max(...values) - lo
  let down = false
  let count = 0
  for (const v of values) {
    if (!down && v < lo + 0.25 * span) down = true
    else if (down && v > lo + 0.75 * span) {
      down = false
      count += 1
    }
  }
  return (count * perSecond) / values.length
}

/** `x` moved `by` samples later, round the loop. */
function later(x: Float32Array, by: number): Float32Array {
  const out = new Float32Array(x.length)
  for (let i = 0; i < x.length; i += 1) out[i] = x[(i - by + x.length) % x.length]!
  return out
}

/** Where a click that went in at 1 s comes out of the voice: milliseconds after it, and how tall. */
function copies(voice: Float32Array): { ms: number; peak: number }[] {
  const found: { ms: number; peak: number }[] = []
  const from = seconds(1) - 100
  const to = seconds(2) - 200
  let i = from
  while (i < to) {
    if (Math.abs(voice[i]!) <= 0.01) {
      i += 1
      continue
    }
    // One copy: everything within a millisecond of its tallest sample.
    let top = 0
    let at = i
    let j = i
    for (; j < to && j - at < 48; j += 1) {
      if (Math.abs(voice[j]!) > top) {
        top = Math.abs(voice[j]!)
        at = j
      }
    }
    found.push({ ms: ((at - seconds(1)) * 1000) / RATE, peak: top })
    i = j
  }
  return found
}

const left = (source: Source, result: ReturnType<Awaited<ReturnType<typeof lab>>['render']>) => ({
  in: source.left,
  ring: result.taps.ring!.channels_data[0]!,
  voice: result.taps.voice!.channels_data[0]!,
  out: result.taps.out!.channels_data[0]!,
})

describe('lesson 17: pitch shifting', () => {
  it('is a sound lab on the sine: every tap says something, loops, and answers to every control', async () => {
    const shifter = await lab('17-pitch-shifting')
    const source = await tone()
    const result = shifter.render(source, {})
    // No splice is searched for in Vintage: the match stays at 1.
    expectSoundLab(shifter, source, result, { quiet: ['match'] })
  })

  it('puts a 440 Hz sine at +12 semitones out with its peak at 880 Hz, within one bin of the 4096-point spectrum (claim octave-bin)', async () => {
    const shifter = await lab('17-pitch-shifting')
    const source = await tone()
    for (const mode of [0, 1]) {
      shifter.render(source, { semitones: 12, mode })
      const spectrum = shifter.spectrum('out')
      let best = 0
      for (let k = 0; k < spectrum.length; k += 1) if (spectrum[k]! > spectrum[best]!) best = k
      const bin = RATE / 4096
      expect(Math.abs(best * bin - 880)).toBeLessThanOrEqual(bin)
    }
  })

  it('at 0 semitones plays what it recorded 1,512 samples earlier, sample for sample (claim unison-voice)', async () => {
    const shifter = await lab('17-pitch-shifting')
    for (const id of ['sine', 'guitar', 'drums']) {
      const source = await benchSource(id, seconds(4))
      const result = shifter.render(source, { semitones: 0 })
      const { ring, voice } = left(source, result)
      expect(differenceDb(voice, later(ring, 1512))).toBeLessThan(-130)
      // One sample to either side is no match at all.
      expect(differenceDb(voice, later(ring, 1511))).toBeGreaterThan(-40)
      expect(differenceDb(voice, later(ring, 1513))).toBeGreaterThan(-40)
      // The head that sounds stands still, 31.5 ms behind, at a gain of 1; the other is silent.
      const delays = result.taps.delayB!.channels_data[0]!
      const gains = result.taps.gainB!.channels_data[0]!
      expect(delays.every((v) => v === 31.5)).toBe(true)
      expect(gains.every((v) => v === 1)).toBe(true)
      expect(result.taps.gainA!.channels_data[0]!.every((v) => v === 0)).toBe(true)
    }
  })

  it('at 0 semitones puts out the guitar 1,513 samples late with 30 dB less left over: the filters on the way are the rest (claim unison-out)', async () => {
    const shifter = await lab('17-pitch-shifting')
    const source = await benchSource('guitar', seconds(4))
    const { out } = left(source, shifter.render(source, { semitones: 0 }))
    const at = (by: number) => differenceDb(out, later(source.left, by))
    expect(at(1513)).toBeGreaterThan(-32)
    expect(at(1513)).toBeLessThan(-28)
    // No other whole number of samples does better.
    expect(at(1512)).toBeGreaterThan(at(1513))
    expect(at(1514)).toBeGreaterThan(at(1513))
  })

  it("reads the two heads again from the device's own numbers and lands on its voice (claim heads-rebuilt)", async () => {
    const shifter = await lab('17-pitch-shifting')
    for (const id of ['sine', 'guitar', 'drums', 'noise']) {
      const source = await benchSource(id, seconds(4))
      for (const mode of [0, 1]) {
        for (const semitones of [12, -12, 7]) {
          const result = shifter.render(source, { mode, semitones })
          expect(result.checks.heads).toBeLessThan(-120)
          // And the two taps of the heads alone add up to the voice.
          const a = result.taps.headA!.channels_data[0]!
          const b = result.taps.headB!.channels_data[0]!
          const sum = a.map((v, i) => v + b[i]!)
          expect(differenceDb(sum, result.taps.voice!.channels_data[0]!)).toBeLessThan(-120)
        }
      }
    }
  })

  it("runs the kit's own shifter on the same recording and lands within −100 dB of the Vintage voice on the sine and the guitar (claim kit-same), within −75 dB on noise (claim kit-noise)", async () => {
    const shifter = await lab('17-pitch-shifting')
    for (const id of ['sine', 'guitar']) {
      const source = await benchSource(id, seconds(4))
      for (const semitones of [12, -12, 7]) {
        expect(shifter.render(source, { semitones }).checks.kit).toBeLessThan(-100)
      }
    }
    for (const id of ['noise', 'clicks']) {
      const source = await benchSource(id, seconds(4))
      for (const semitones of [12, -12, 7]) {
        expect(shifter.render(source, { semitones }).checks.kit).toBeLessThan(-75)
      }
    }
    // Smooth is another method: the kit's shifter no longer follows it.
    const source = await tone()
    expect(shifter.render(source, { mode: 1 }).checks.kit).toBeGreaterThan(-10)
  })

  it('moves a head 1 ms nearer for every millisecond at +12 (claim slope-up), 0.5 ms further at −12 (claim slope-down), 3 ms nearer at +24 (claim slope-two-octaves)', async () => {
    const shifter = await lab('17-pitch-shifting')
    const source = await tone()
    // The steepest step between neighbouring points is the jump back; the commonest is the slope.
    const slope = (delays: Float32Array) => {
      const steps: number[] = []
      for (let i = POINTS; i < 3 * POINTS; i += 1) steps.push(delays[i + 1]! - delays[i]!)
      steps.sort((a, b) => a - b)
      return (steps[Math.floor(steps.length / 2)]! * POINTS) / 1000
    }
    const at = (semitones: number) =>
      slope(shifter.render(source, { semitones }).taps.delayA!.channels_data[0]!)
    expect(at(12)).toBeCloseTo(-1, 3)
    expect(at(-12)).toBeCloseTo(0.5, 3)
    expect(at(24)).toBeCloseTo(-3, 3)
    expect(at(7)).toBeCloseTo(1 - 2 ** (7 / 12), 3)
  })

  it('keeps both heads between 1.5 ms and 61.5 ms behind at a Size of 60 ms (claim delay-span), half a window apart (claim half-apart)', async () => {
    const shifter = await lab('17-pitch-shifting')
    const source = await tone()
    for (const semitones of [12, -12, 7]) {
      const result = shifter.render(source, { semitones })
      const a = result.taps.delayA!.channels_data[0]!
      const b = result.taps.delayB!.channels_data[0]!
      for (const delays of [a, b]) {
        expect(Math.min(...delays.subarray(POINTS))).toBeGreaterThanOrEqual(1.5)
        expect(Math.min(...delays.subarray(POINTS))).toBeLessThan(1.7)
        expect(Math.max(...delays.subarray(POINTS))).toBeLessThanOrEqual(61.5)
        expect(Math.max(...delays.subarray(POINTS))).toBeGreaterThan(61.2)
      }
      for (let i = POINTS; i < 3 * POINTS; i += 1) {
        expect(Math.abs(Math.abs(a[i]! - b[i]!) - 30)).toBeLessThan(0.001)
      }
    }
  })

  it('takes 60 ms over one sweep at +12 (claim sweep-octave) and 1,009 ms at +1 (claim sweep-semitone)', async () => {
    const shifter = await lab('17-pitch-shifting')
    const source = await tone()
    // The time between two jumps back of head A.
    const sweep = (semitones: number) => {
      const delays = shifter.render(source, { semitones }).taps.delayA!.channels_data[0]!
      const jumps: number[] = []
      for (let i = 300; i < delays.length - 1; i += 1) {
        if (delays[i + 1]! - delays[i]! > 30) jumps.push(i)
      }
      expect(jumps.length).toBeGreaterThan(1)
      return ((jumps[jumps.length - 1]! - jumps[0]!) / (jumps.length - 1) / POINTS) * 1000
    }
    expect(sweep(12)).toBeCloseTo(60, 0)
    expect(sweep(1)).toBeGreaterThan(1009 - 2)
    expect(sweep(1)).toBeLessThan(1009 + 2)
  })

  it('gives the two heads gains that add to 1 at every instant (claim gains-sum)', async () => {
    const shifter = await lab('17-pitch-shifting')
    const source = await tone()
    for (const semitones of [12, -5]) {
      const result = shifter.render(source, { semitones })
      const a = result.taps.gainA!.channels_data[0]!
      const b = result.taps.gainB!.channels_data[0]!
      expect(a.every((v, i) => Math.abs(v + b[i]! - 1) < 1e-6)).toBe(true)
      expect(Math.max(...a)).toBeGreaterThan(0.999)
      expect(Math.min(...a)).toBeLessThan(0.001)
    }
  })

  it('dips the sine 1.8 dB where the heads cross at +12 and 60 ms (claim ripple-depth), 33.3 times a second (claim ripple-rate)', async () => {
    const shifter = await lab('17-pitch-shifting')
    const source = await tone()
    const result = shifter.render(source, {})
    const { voice } = left(source, result)
    // What the two heads' sum should fall to: cos(π f W / 2), with f = 440 Hz and W = 60 ms.
    const predicted = -gainToDb(Math.abs(Math.cos(Math.PI * 440 * 0.06 * 0.5)))
    expect(predicted).toBeCloseTo(1.84, 2)
    expect(depth(crests(voice))).toBeGreaterThan(1.7)
    expect(depth(crests(voice))).toBeLessThan(1.95)
    // The lab's own meter, which the page draws, agrees to within its ripple.
    const level = Array.from(result.taps.level!.channels_data[0]!.subarray(1500, 10_500))
    expect(depth(level)).toBeGreaterThan(1.7)
    expect(depth(level)).toBeLessThan(2.1)
    expect(dipsPerSecond(crests(voice), RATE / 60)).toBeCloseTo(33.3, 0)
    // Down an octave the heads move half as fast and cross half as often. The wave is four
    // times as long there, so the crests are taken over longer stretches.
    const down = left(source, shifter.render(source, { semitones: -12 }))
    expect(dipsPerSecond(crests(down.voice, 480), RATE / 480)).toBeCloseTo(16.7, 0)
  })

  it('puts the sine out as lines 33.3 Hz apart counted from 440 Hz: the tallest at 873.3 Hz, 0.9 dB under the input (claim grid-line), the next at 906.7 Hz, 17.4 dB under that (claim side-band), and nothing at 880 Hz (claim no-octave)', async () => {
    const shifter = await lab('17-pitch-shifting')
    const source = await tone()
    const { voice } = left(source, shifter.render(source, {}))
    const input = lineDb(source.left, 440)
    const spacing = (2 * (2 - 1)) / 0.06
    const tallest = lineDb(voice, 440 + 13 * spacing)
    const next = lineDb(voice, 440 + 14 * spacing)
    expect(440 + 13 * spacing).toBeCloseTo(873.33, 2)
    expect(tallest - input).toBeGreaterThan(-1.0)
    expect(tallest - input).toBeLessThan(-0.8)
    expect(next - tallest).toBeGreaterThan(-17.7)
    expect(next - tallest).toBeLessThan(-17.1)
    // No line of the grid is taller, and between the lines there is nothing.
    for (let k = 5; k <= 25; k += 1) {
      expect(lineDb(voice, 440 + k * spacing)).toBeLessThanOrEqual(tallest)
    }
    expect(lineDb(voice, 880) - tallest).toBeLessThan(-90)
    // 873.3 Hz is 13 cents under the octave.
    expect(1200 * Math.log2(873.33 / 880)).toBeCloseTo(-13.2, 1)
  })

  it('has no ripple at a Size of 59.09 ms, where the heads are 13 whole cycles apart (claim window-best), and falls silent at each crossing at 61.36 ms, 13½ apart (claim window-worst)', async () => {
    const shifter = await lab('17-pitch-shifting')
    const source = await tone()
    const best = left(source, shifter.render(source, { size: 26_000 / 440 }))
    expect(depth(crests(best.voice))).toBeLessThan(0.05)
    expect(lineDb(best.voice, 880) - lineDb(source.left, 440)).toBeGreaterThan(-0.05)
    const worst = shifter.render(source, { size: 27_000 / 440 })
    const level = Array.from(worst.taps.level!.channels_data[0]!.subarray(1500, 10_500))
    expect(depth(level)).toBeGreaterThan(40)
    // Two lines of the same height either side of 880 Hz, each half the input: a beat.
    const spacing = 2 / (27 / 440)
    const voice = worst.taps.voice!.channels_data[0]!
    const below = lineDb(voice, 880 - spacing / 2) - lineDb(source.left, 440)
    const above = lineDb(voice, 880 + spacing / 2) - lineDb(source.left, 440)
    expect(below).toBeCloseTo(-6.0, 0)
    expect(above).toBeCloseTo(-6.0, 0)
    expect(Math.abs(below - above)).toBeLessThan(0.5)
  })

  it('in Smooth puts the sine out as one line at 880.0 Hz at the level it went in (claim smooth-line), every other line more than 80 dB under it (claim smooth-clean), with no dip (claim smooth-ripple)', async () => {
    const shifter = await lab('17-pitch-shifting')
    const source = await tone()
    const result = shifter.render(source, { mode: 1 })
    const { voice } = left(source, result)
    const input = lineDb(source.left, 440)
    const line = lineDb(voice, 880)
    expect(Math.abs(line - input)).toBeLessThan(0.05)
    for (const away of [
      -100, -66.67, -33.33, -16.67, -6.67, 6.67, 16.67, 26.67, 33.33, 66.67, 100,
    ]) {
      expect(lineDb(voice, 880 + away) - line).toBeLessThan(-80)
    }
    expect(depth(crests(voice))).toBeLessThan(0.05)
    // The search found the two heads alike.
    const match = result.taps.match!.channels_data[0]!
    expect(Math.min(...match)).toBeGreaterThan(0.999)
  })

  it('makes +7 semitones a ratio of 1.4983: 659.26 Hz from 440 Hz in Smooth (claim fifth), and 655.9 Hz, 9 cents under, on the Vintage grid (claim fifth-grid)', async () => {
    const shifter = await lab('17-pitch-shifting')
    const source = await tone()
    const ratio = 2 ** (7 / 12)
    expect(ratio).toBeCloseTo(1.4983, 4)
    const input = lineDb(source.left, 440)
    const smooth = left(source, shifter.render(source, { semitones: 7, mode: 1 }))
    expect(Math.abs(lineDb(smooth.voice, 440 * ratio) - input)).toBeLessThan(0.05)
    const vintage = left(source, shifter.render(source, { semitones: 7 }))
    const spacing = (2 * (ratio - 1)) / 0.06
    const line = 440 + 13 * spacing
    expect(line).toBeCloseTo(655.9, 1)
    expect(1200 * Math.log2(line / (440 * ratio))).toBeCloseTo(-8.7, 1)
    expect(lineDb(vintage.voice, line) - input).toBeGreaterThan(-1.0)
    expect(lineDb(vintage.voice, 440 * ratio) - input).toBeLessThan(-60)
  })

  it('records 3 dB less at 10.8 kHz when the shift is +12 (claim band-limit), at 21.6 kHz when it is 0 or below (claim band-open), at 5.4 kHz when it is +24 (claim band-two-octaves)', async () => {
    const shifter = await lab('17-pitch-shifting')
    const loss = (hz: number, semitones: number) => {
      const source = sine(hz, 0.25, seconds(1))
      const result = shifter.render(source, { semitones })
      const ring = result.taps.ring!.channels_data[0]!
      return gainToDb(rms(ring, 24_000) / rms(source.left, 24_000))
    }
    expect(loss(10_800, 12)).toBeCloseTo(-3.0, 1)
    expect(loss(5400, 12)).toBeGreaterThan(-0.1)
    expect(loss(21_600, 0)).toBeCloseTo(-3.0, 1)
    expect(loss(21_600, -12)).toBeCloseTo(-3.0, 1)
    expect(loss(10_800, 0)).toBeGreaterThan(-0.1)
    // Two octaves up the limit is at a quarter of 21.6 kHz.
    expect(loss(5400, 24)).toBeCloseTo(-3.0, 1)
  })

  it('crosses 200 times a second at +12 and a Size of 10 ms (claim buzz-rate)', async () => {
    const shifter = await lab('17-pitch-shifting')
    const source = await tone()
    const result = shifter.render(source, { size: 10 })
    const level = Array.from(result.taps.level!.channels_data[0]!.subarray(1500, 10_500))
    expect(dipsPerSecond(level, POINTS)).toBeCloseTo(200, 0)
    // And the comb's teeth are 200 Hz apart: 440 + 2 × 200 is the tallest.
    const voice = result.taps.voice!.channels_data[0]!
    expect(lineDb(voice, 840)).toBeGreaterThan(lineDb(voice, 880) + 60)
    expect(lineDb(voice, 840)).toBeGreaterThan(lineDb(voice, 1040))
  })

  it('plays one click four times, 15 ms apart, at +12 and 60 ms (claim click-copies), 100 ms apart at 400 ms (claim click-long), and four times in Smooth too (claim click-smooth)', async () => {
    const shifter = await lab('17-pitch-shifting')
    const source = await benchSource('clicks', seconds(4))
    const at = (values: Record<string, number>) =>
      copies(shifter.render(source, values).taps.voice!.channels_data[0]!)
    const plain = at({})
    expect(plain.length).toBe(4)
    for (let k = 1; k < 4; k += 1) expect(plain[k]!.ms - plain[k - 1]!.ms).toBeCloseTo(15, 1)
    expect(plain[3]!.ms - plain[0]!.ms).toBeCloseTo(45, 1)
    const long = at({ size: 400 })
    expect(long.length).toBeGreaterThanOrEqual(3)
    for (let k = 1; k < long.length; k += 1)
      expect(long[k]!.ms - long[k - 1]!.ms).toBeCloseTo(100, 0)
    const smooth = at({ mode: 1 })
    expect(smooth.length).toBe(4)
    // A fifth up, 2 × 1.5 = 3 copies.
    expect(at({ semitones: 7 }).length).toBe(3)
  })

  it('loses 1.3 dB of noise to the crossfade in Vintage (claim crossfade-loss), and in Smooth keeps the chords within 0.3 dB where Vintage loses 1.6 dB (claim lift)', async () => {
    const shifter = await lab('17-pitch-shifting')
    const kept = (source: Source, mode: number) => {
      const result = shifter.render(source, { mode })
      const from = seconds(0.5)
      const to = seconds(3.5)
      const { ring, voice } = left(source, result)
      return gainToDb(rms(voice, from, to) / rms(ring, from, to))
    }
    const noise = await benchSource('noise', seconds(4))
    expect(kept(noise, 0)).toBeGreaterThan(-1.5)
    expect(kept(noise, 0)).toBeLessThan(-1.15)
    const chords = await benchSource('chords', seconds(4))
    expect(kept(chords, 0)).toBeGreaterThan(-1.8)
    expect(kept(chords, 0)).toBeLessThan(-1.4)
    expect(Math.abs(kept(chords, 1))).toBeLessThan(0.3)
    // On noise the search finds little alike, and says so.
    const match = shifter.render(noise, { mode: 1 }).taps.match!.channels_data[0]!
    expect(mean(match)).toBeLessThan(0.75)
  })

  it('is the input, sample for sample, with the mix at 0 (claim mix-zero), and has the dry and the shifted sine each 3 dB down at 0.5 (claim mix-half)', async () => {
    const shifter = await lab('17-pitch-shifting')
    const source = await tone()
    const dry = shifter.render(source, { mix: 0 }).taps.out!.channels_data[0]!
    expect(dry.every((v, i) => v === source.left[i])).toBe(true)
    const half = shifter.render(source, { mix: 0.5, mode: 1 }).taps.out!.channels_data[0]!
    const input = lineDb(source.left, 440)
    expect(lineDb(half, 440) - input).toBeCloseTo(-3.01, 1)
    expect(lineDb(half, 880) - input).toBeCloseTo(-3.01, 1)
  })

  it('makes a major triad of one sine: 440 Hz, 554.4 Hz and 659.3 Hz at one level, with voice A at +4, voice B up and the mix at 0.5 (claim triad)', async () => {
    const shifter = await lab('17-pitch-shifting')
    const source = await tone()
    const out = shifter.render(source, { semitones: 4, levelB: 1, mix: 0.5, mode: 1 }).taps.out!
      .channels_data[0]!
    const input = lineDb(source.left, 440)
    expect(440 * 2 ** (4 / 12)).toBeCloseTo(554.4, 1)
    expect(440 * 2 ** (7 / 12)).toBeCloseTo(659.3, 1)
    for (const semitones of [0, 4, 7]) {
      expect(lineDb(out, 440 * 2 ** (semitones / 12)) - input).toBeCloseTo(-3.01, 1)
    }
  })
})
