import { describe, expect, it } from 'vitest'
import {
  benchSource,
  dbToGain,
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  mean,
  POINT_RATE,
  range,
  rms,
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

// A sine on both channels reads 3.01 dB under its peak on the device's detector.
const sineAt = (levelDb: number, frames: number, hz = 1000) =>
  sine(hz, dbToGain(levelDb + 3.0103), frames)

/** A second of silence, then a second of a tone at `levelDb`: a step up from rest. */
function step(levelDb: number): Source {
  const frames = seconds(2)
  const tone = sineAt(levelDb, frames)
  const source = silence(frames)
  source.left.set(tone.left.subarray(0, frames / 2), frames / 2)
  source.right.set(tone.right.subarray(0, frames / 2), frames / 2)
  return source
}

/** Milliseconds from the step until the reduction has gone `part` of the way to `final`. */
function riseMs(reduction: Float32Array, final: number, part = 1 - Math.exp(-1)): number {
  const from = reduction.length / 2
  let k = from
  while (k < reduction.length && reduction[k]! > final * part) k += 1
  return ((k - from) * 1000) / POINT_RATE
}

const hard = { threshold: -24, ratio: 4, knee: 0, attack: 10, release: 0.1 }

describe('compression', () => {
  it('is a sound lab on the drums: every tap says something, loops, and answers to every control', async () => {
    const comp = await lab('compression')
    const drums = await benchSource('drums', seconds(4))
    const result = comp.render(drums, {})
    expectSoundLab(comp, drums, result)
  })

  it('leaves silence alone: the gain is exactly 0 dB and the output exact silence (claim silence)', async () => {
    const comp = await lab('compression')
    const quiet = comp.render(silence(seconds(1)), {})
    expect(quiet.taps.reduction!.channels_data[0]!.every((v) => v === 0)).toBe(true)
    expect(quiet.taps.gain!.channels_data[0]!.every((v) => v === 0)).toBe(true)
    expect(quiet.taps.out!.channels_data[0]!.every((v) => v === 0)).toBe(true)
  })

  it('turns a full-scale sine down', async () => {
    const comp = await lab('compression')
    const loud = comp.render(sine(1000, 1, seconds(1)), {})
    expect(mean(loud.taps.reduction!.channels_data[0]!)).toBeLessThan(-6)
    expect(mean(loud.taps.gain!.channels_data[0]!)).toBeLessThan(-6)
  })

  it('reads a full-scale sine on both channels as −3 dB (claim sine-reads)', async () => {
    const comp = await lab('compression')
    const out = comp.render(sine(1000, 1, seconds(1)), { ratio: 1 })
    const level = out.taps.level!.channels_data[0]!
    expect(mean(level, level.length / 2)).toBeCloseTo(-3.01, 1)
  })

  it('brings a tone 12 dB over the threshold at 4:1 out 3 dB over it (claim ratio-4)', async () => {
    const comp = await lab('compression')
    const out = comp.render(sineAt(-12, seconds(2)), hard)
    const reduction = mean(out.taps.reduction!.channels_data[0]!)
    // 12 dB over, less 9 dB of reduction, is 3 dB over: within 0.5 dB.
    expect(12 + reduction).toBeGreaterThan(2.5)
    expect(12 + reduction).toBeLessThan(3.5)
  })

  it('does nothing below the bottom of the knee (claim below-knee)', async () => {
    const comp = await lab('compression')
    // Threshold −24, knee 6: the knee starts at −27. A tone at −28 is under it.
    const out = comp.render(sineAt(-28, seconds(1)), { threshold: -24, ratio: 4, knee: 6 })
    expect(out.taps.reduction!.channels_data[0]!.every((v) => v === 0)).toBe(true)
    const above = comp.render(sineAt(-26, seconds(1)), { threshold: -24, ratio: 4, knee: 6 })
    expect(mean(above.taps.reduction!.channels_data[0]!)).toBeLessThan(0)
  })

  it('measures the curve the formula draws, within 0.01 dB (claim curve-error)', async () => {
    const comp = await lab('compression')
    const settings: Record<string, number>[] = [{}, hard, { threshold: -40, ratio: 10, knee: 24 }]
    for (const values of settings) {
      const out = comp.render(sineAt(-12, seconds(0.5)), values)
      expect(out.checks.curveError).toBeLessThan(0.01)
    }
  })

  it("works the reduction out again from the device's own numbers, within 0.001 dB (claim rebuilt-zero)", async () => {
    const comp = await lab('compression')
    const drums = await benchSource('drums', seconds(4))
    expect(comp.render(drums, {}).checks.rebuilt).toBeLessThan(0.001)
    // And with the tails held, where the release pauses.
    const chords = await benchSource('chords', seconds(4))
    expect(comp.render(chords, { tails: 0, release: 1 }).checks.rebuilt).toBeLessThan(0.001)
    expect(comp.render(step(-6), { ...hard, attack: 100 }).checks.rebuilt).toBeLessThan(0.1)
  })

  it('takes about 39 ms to bring down 63 % of the reduction at the shortest attack (claim attack-floor)', async () => {
    const comp = await lab('compression')
    const out = comp.render(step(-6), hard)
    const ms = riseMs(out.taps.reduction!.channels_data[0]!, -13.5)
    expect(ms).toBeGreaterThan(39 * 0.8)
    expect(ms).toBeLessThan(39 * 1.2)
  })

  it('takes about 134 ms at an attack of 100 ms: the detector adds its own rise (claim attack-100)', async () => {
    const comp = await lab('compression')
    const out = comp.render(step(-6), { ...hard, attack: 100 })
    const ms = riseMs(out.taps.reduction!.channels_data[0]!, -13.5)
    expect(ms).toBeGreaterThan(134 * 0.8)
    expect(ms).toBeLessThan(134 * 1.2)
  })

  it('leaves 0.42 dB of wobble after one pole at 55 Hz (claim ripple-one-pole) and 0.02 dB after two (claim ripple-two-poles)', async () => {
    const comp = await lab('compression')
    const out = comp.render(sineAt(-12, seconds(2), 55), { ratio: 1, scLowCut: 20 })
    const one = out.taps.levelOnePole!.channels_data[0]!
    const two = out.taps.level!.channels_data[0]!
    // The last 100 ms, eleven cycles of the wobble.
    const from = one.length - 300
    expect(range(one, from, one.length).span).toBeGreaterThan(0.36)
    expect(range(one, from, one.length).span).toBeLessThan(0.48)
    expect(range(two, from, two.length).span).toBeGreaterThan(0.012)
    expect(range(two, from, two.length).span).toBeLessThan(0.028)
  })

  it("builds a compressor a piece at a time on taps of its own: every step changes one, none changes the main path, and the level the build measures is within −100 dB of the power in the device's detector", async () => {
    const comp = await lab('compression')
    expect(comp.description.controls.find((control) => control.id === 'build')!.choices).toEqual([
      'A wire',
      'Measure the level',
      'Threshold and ratio',
    ])
    expectBuild(comp, await benchSource('drums', seconds(4)))
    // A click a second, and a tone after a second of silence, leave the device half a second
    // of silence at a time, in which it rests and forgets its level: the build has to forget
    // with it to stay within the bound.
    const clicks = await benchSource('clicks', seconds(4))
    expect(comp.render(clicks, {}).checks.builtDifference).toBeLessThan(-100)
    expect(comp.render(step(-6), { build: 2 }).checks.builtDifference).toBeLessThan(-100)
    const result = comp.render(await benchSource('chords', seconds(4)), { build: 2, scLowCut: 300 })
    expect(result.checks.builtStep).toBe(1)
    expect(result.checks.builtBound).toBe(-100)
    expect(result.checks.builtDifference).toBeLessThan(-100)
  })

  it('is a wire at the first step, and a wire with a meter on it at the second', async () => {
    const comp = await lab('compression')
    const drums = await benchSource('drums', seconds(4))
    const main = comp.render(drums, {}).taps.level!.channels_data[0]!
    for (const build of [0, 1]) {
      const taps = comp.render(drums, { build, threshold: -40, ratio: 10 }).taps
      expect(taps.built!.channels_data[0]!.every((v, i) => v === drums.left[i])).toBe(true)
      expect(taps.builtGain!.channels_data[0]!.every((v) => v === 0)).toBe(true)
      const level = taps.builtLevel!.channels_data[0]!
      if (build === 0) expect(level.every((v) => v === -100)).toBe(true)
      // The built level is the level the main path reads off the device, point for point.
      else expect(level.every((v, i) => Math.abs(v - main[i]!) < 0.001)).toBe(true)
    }
  })

  it('at the third step brings a tone 12 dB over the threshold down 9 dB at 4:1, and by nothing with the piece out', async () => {
    const comp = await lab('compression')
    const tone = sineAt(-12, seconds(2))
    const values = { threshold: -24, ratio: 4 }
    const turnedDown = (build: number) => {
      const taps = comp.render(tone, { ...values, build }).taps
      return -gainToDb(rms(taps.built!.channels_data[0]!) / rms(taps.in!.channels_data[0]!))
    }
    expectWritten(turnedDown(2), '9 dB')
    expectWritten(
      -mean(comp.render(tone, { ...values, build: 2 }).taps.builtGain!.channels_data[0]!),
      '9.0 dB',
    )
    // The piece switched out: the step before it turns nothing down.
    expect(Math.abs(turnedDown(1))).toBe(0)
    expect(matchesWritten(turnedDown(1), '9 dB')).toBe(false)
    // And it answers to its two controls: 12 dB over at 2:1 comes down 6 dB.
    const halved = comp.render(tone, { threshold: -24, ratio: 2, build: 2 }).taps
    expectWritten(-mean(halved.builtGain!.channels_data[0]!), '6.0 dB')
  })

  it('is the input, sample for sample, with the mix at 0 (claim mix-zero)', async () => {
    const comp = await lab('compression')
    const drums = await benchSource('drums', seconds(2))
    const out = comp.render(drums, { mix: 0, threshold: -40, ratio: 10, makeup: 12 })
    const dry = out.taps.in!.channels_data[0]!
    expect(out.taps.out!.channels_data[0]!.every((v, i) => v === dry[i])).toBe(true)
  })
})
