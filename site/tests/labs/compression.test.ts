import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
  click,
  dbToGain,
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  mean,
  peak,
  POINT_RATE,
  points,
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

/** Milliseconds from the step until a gain in dB has gone `part` of the way to `final`. */
function riseMs(reduction: Float32Array, final: number, part = 1 - Math.exp(-1)): number {
  const from = reduction.length / 2
  let k = from
  while (k < reduction.length && reduction[k]! > final * part) k += 1
  return ((k - from) * 1000) / POINT_RATE
}

const hard = { threshold: -24, ratio: 4, knee: 0, attack: 10, release: 0.1 }

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings('compression')!

/** A named set as its card plays it: on its own source, with `over` laid on its values. */
async function played(comp: Lab, name: string, over: Record<string, number> = {}) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(comp.description, set)
  return comp.render(await benchSource(source!, seconds(4)), { ...values, ...over })
}

const tap = (result: RenderResult, id: string) => result.taps[id]!.channels_data[0]!
/** A tap's level over the loop, in dB against full scale. */
const levelOf = (result: RenderResult, id: string) => gainToDb(rms(tap(result, id)))
/** A tap's loudest sample, in dB against full scale. */
const topOf = (result: RenderResult, id: string) => gainToDb(peak(tap(result, id)))
/** How far the loudest sample stands over the level of the whole: the height of the hits. */
const crest = (result: RenderResult, id: string) => topOf(result, id) - levelOf(result, id)

/** The point of a control tap at which another is at its least. */
function quietest(x: Float32Array): number {
  let at = 0
  for (let k = 0; k < x.length; k += 1) if (x[k]! < x[at]!) at = k
  return at
}

/** The tops of a level's notes: the points that nothing within 120 ms either side stands over. */
function tops(level: Float32Array): number[] {
  const near = points(0.12)
  const found: number[] = []
  for (let k = 0; k < level.length; k += 1) {
    const around = range(level, Math.max(0, k - near), Math.min(level.length, k + near))
    if (level[k]! === around.hi && (found.length === 0 || k - found.at(-1)! > near)) found.push(k)
  }
  return found
}

/** The sample of a tap that stands furthest from zero, from `from` up to `to`. */
function loudest(x: Float32Array, from = 0, to = x.length): number {
  let at = from
  for (let i = from; i < to; i += 1) if (Math.abs(x[i]!) > Math.abs(x[at]!)) at = i
  return at
}

/** The gain the device has on one sample, in dB: what came out against what went in. */
const gainOn = (result: RenderResult, sample: number) =>
  gainToDb(Math.abs(tap(result, 'out')[sample]! / tap(result, 'in')[sample]!))

/** How much taller the loudest sample of a stretch comes out than the loudest that went in, in dB. */
function taller(result: RenderResult, fromSeconds: number, toSeconds: number): number {
  const [from, to] = [seconds(fromSeconds), seconds(toSeconds)]
  const dry = tap(result, 'in')
  const wet = tap(result, 'out')
  return (
    gainToDb(Math.abs(wet[loudest(wet, from, to)]!)) -
    gainToDb(Math.abs(dry[loudest(dry, from, to)]!))
  )
}

/** The gain the device has on the sound, sample by sample, in dB: the least and the most. */
function applied(result: RenderResult) {
  const dry = tap(result, 'in')
  const wet = tap(result, 'out')
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0; i < dry.length; i += 1) {
    if (Math.abs(dry[i]!) < 1e-3) continue
    lo = Math.min(lo, wet[i]! / dry[i]!)
    hi = Math.max(hi, wet[i]! / dry[i]!)
  }
  return { lo: gainToDb(lo), hi: gainToDb(hi) }
}

const LOOPS = ['drums', 'guitar', 'chords', 'bass', 'pad', 'mix']

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
    expect(tap(quiet, 'reduction').every((v) => v === 0)).toBe(true)
    expect(tap(quiet, 'gain').every((v) => v === 0)).toBe(true)
    expect(tap(quiet, 'out').every((v) => v === 0)).toBe(true)
  })

  it('turns a full-scale sine down', async () => {
    const comp = await lab('compression')
    const loud = comp.render(sine(1000, 1, seconds(1)), {})
    expect(mean(tap(loud, 'reduction'))).toBeLessThan(-6)
    expect(mean(tap(loud, 'gain'))).toBeLessThan(-6)
  })

  it('reads a full-scale sine on both channels as −3 dB (claim sine-reads), and one full-scale sample 36 dB under its own height (claim click-reads)', async () => {
    const comp = await lab('compression')
    const out = comp.render(sine(1000, 1, seconds(1)), { ratio: 1 })
    const level = tap(out, 'level')
    expectWritten(mean(level, level.length / 2), '−3 dB')
    const one = comp.render(click(seconds(1), seconds(0.5)), { ratio: 1 })
    expectWritten(range(tap(one, 'level')).hi, '−36 dB')
  })

  it('brings a tone 12 dB over the threshold at 4:1 out 3 dB over it (claim ratio-4), which the measured curve shows as −21 dB out for −12 dB in (claim curve-reads)', async () => {
    const comp = await lab('compression')
    // At the lesson's starting values, as the sentence says: Threshold −24 dB, Ratio 4.
    const out = comp.render(sineAt(-12, seconds(2)), {})
    expectWritten(12 + mean(tap(out, 'reduction')), '3 dB')
    // The curve has a point a dB from −60 to 0: the one at −12 dB in, at the starting values.
    const curve = tap(comp.render(sineAt(-12, seconds(0.5)), {}), 'curve')
    expect(curve.length).toBe(61)
    expectWritten(curve[48]!, '−21 dB')
  })

  it('does nothing below the bottom of the knee: the reduction is exactly 0 dB (claim below-knee)', async () => {
    const comp = await lab('compression')
    // Threshold −24, knee 6: the knee starts at −27. A tone at −28 is under it.
    const out = comp.render(sineAt(-28, seconds(1)), { threshold: -24, ratio: 4, knee: 6 })
    expect(tap(out, 'reduction').every((v) => v === 0)).toBe(true)
    const above = comp.render(sineAt(-26, seconds(1)), { threshold: -24, ratio: 4, knee: 6 })
    expect(mean(tap(above, 'reduction'))).toBeLessThan(0)
  })

  it('measures the curve the formula draws, within 0.01 dB (claim curve-error)', async () => {
    const comp = await lab('compression')
    const tried: Record<string, number>[] = [{}, hard, { threshold: -40, ratio: 10, knee: 24 }]
    for (const values of tried) {
      const out = comp.render(sineAt(-12, seconds(0.5)), values)
      expect(out.checks.curveError).toBeLessThan(0.01)
    }
  })

  it('draws the curve with make-up and mix as the level that comes out: the curve itself at 0 dB and 1, lifted by the make-up, and back on the diagonal at a mix of 0', async () => {
    const comp = await lab('compression')
    const tone = sineAt(-12, seconds(0.5))
    const plain = comp.render(tone, hard)
    const whole = tap(plain, 'curveWhole')
    const curve = tap(plain, 'curve')
    expect(whole.every((v, p) => Math.abs(v - curve[p]!) < 0.01)).toBe(true)
    const lifted = tap(comp.render(tone, { ...hard, makeup: 9 }), 'curveWhole')
    expect(lifted.every((v, p) => Math.abs(v - 9 - curve[p]!) < 0.01)).toBe(true)
    // With no compressed sound in the blend, what comes out is as loud as what went in.
    const dry = tap(comp.render(tone, { ...hard, makeup: 9, mix: 0 }), 'curveWhole')
    expect(dry.every((v, p) => Math.abs(v - (-60 + p)) < 0.01)).toBe(true)
  })

  it("works the reduction out again from the device's own numbers, within 0.001 dB (claim rebuilt-zero)", async () => {
    const comp = await lab('compression')
    const drums = await benchSource('drums', seconds(4))
    expectWritten(comp.render(drums, {}).checks.rebuilt!, 'less than 0.001 dB')
    // And with the tails held, where the release pauses.
    const chords = await benchSource('chords', seconds(4))
    expect(comp.render(chords, { tails: 0, release: 1 }).checks.rebuilt).toBeLessThan(0.001)
    expect(comp.render(step(-6), { ...hard, attack: 100 }).checks.rebuilt).toBeLessThan(0.001)
  })

  it('takes 39 ms to bring down 63 % of the reduction at the shortest attack, for a tone 18 dB over the threshold that starts from silence (claim attack-floor)', async () => {
    const comp = await lab('compression')
    // A tone at −6 dB against a threshold of −24 dB: 18 dB over, 13.5 dB of reduction at 4:1.
    const out = comp.render(step(-6), hard)
    expectWritten(riseMs(tap(out, 'reduction'), -13.5), '39 ms')
    // The time is the tone's as well as the control's: the level has further to climb to a
    // threshold it will stand less far over, so a tone 6 dB over takes longer.
    const nearer = comp.render(step(-18), hard)
    expect(riseMs(tap(nearer, 'reduction'), -4.5)).toBeGreaterThan(60)
  })

  it('takes 134 ms at an attack of 100 ms for the same tone, 18 dB over the threshold: the detector adds its own rise (claim attack-100)', async () => {
    const comp = await lab('compression')
    const out = comp.render(step(-6), { ...hard, attack: 100 })
    expectWritten(riseMs(tap(out, 'reduction'), -13.5), '134 ms')
  })

  it('leaves 0.42 dB of wobble after one pole at 55 Hz (claim ripple-one-pole) and 0.02 dB after two (claim ripple-two-poles)', async () => {
    const comp = await lab('compression')
    const out = comp.render(sineAt(-12, seconds(2), 55), { ratio: 1, scLowCut: 20 })
    const one = tap(out, 'levelOnePole')
    const two = tap(out, 'level')
    // The last 100 ms, eleven cycles of the wobble.
    const from = one.length - 300
    expectWritten(range(one, from, one.length).span, '0.42 dB')
    expectWritten(range(two, from, two.length).span, '0.02 dB')
  })

  it('on the saw wave of the bench ripples once a cycle after one pole, 110 times a second, and far less after two: what the still of stage 3 shows', async () => {
    const comp = await lab('compression')
    const result = comp.render(await benchSource('saw', seconds(4)), { ratio: 1, scLowCut: 20 })
    const one = tap(result, 'levelOnePole')
    const two = tap(result, 'level')
    // The 60 ms the still shows, from 3 s.
    const [from, to] = [points(3), points(3.06)]
    const middle = mean(one, from, to)
    let crests = 0
    for (let k = from + 1; k < to; k += 1)
      if (one[k - 1]! < middle && one[k]! >= middle) crests += 1
    // A saw at 110 Hz squared repeats 110 times a second, 6.6 times in 60 ms; a sine would
    // ripple at twice its frequency, 13 times.
    expect(crests).toBeGreaterThanOrEqual(6)
    expect(crests).toBeLessThanOrEqual(7)
    expect(range(two, from, to).span).toBeLessThan(0.1 * range(one, from, to).span)
  })

  it("lets a tone at the corner of the detector's high-pass through 3.0 dB down (claim corner-3db) and one an octave under it 12.3 dB down (claim octave-under)", async () => {
    const comp = await lab('compression')
    const heard = (hz: number) => {
      const out = comp.render(sine(hz, 0.5, seconds(2)), { ratio: 1, scLowCut: 90 })
      // The second half, once the filter has settled.
      const from = seconds(1)
      return gainToDb(rms(tap(out, 'sidechain'), from) / rms(tap(out, 'in'), from))
    }
    expectWritten(-heard(90), '3.0 dB')
    expectWritten(-heard(45), '12.3 dB')
    // The picture of it is the same filter: a point at the corner, on a scale of even ratios.
    const drawn = comp.render(sine(1000, 0.5, seconds(0.5)), { scLowCut: 90 }).taps
      .sidechainResponse!
    const at = (hz: number) =>
      Math.round(((drawn.length - 1) * Math.log(hz / drawn.x0)) / Math.log(drawn.x1 / drawn.x0))
    expect(drawn.channels_data[0]![at(1000)]!).toBeGreaterThan(-0.1)
    expect(drawn.channels_data[0]![at(90)]!).toBeGreaterThan(-4)
    expect(drawn.channels_data[0]![at(90)]!).toBeLessThan(-2)
    expect(drawn.channels_data[0]![at(45)]!).toBeLessThan(-11)
  })

  it('holds the gain down while a chord rings away with Tails on Hold, between 19 dB and 20 dB down all through the loop and 20.0 dB down just before the next strike, where on Release it has come back to 0.9 dB (claim tails-hold)', async () => {
    const comp = await lab('compression')
    const before = points(1.9)
    const held = tap(await played(comp, 'evened', { tails: 0 }), 'reduction')
    expectWritten(-range(held).hi, '19 dB')
    expectWritten(-range(held).lo, '20 dB')
    expectWritten(-held[before]!, '20.0 dB')
    expectWritten(-tap(await played(comp, 'evened', { tails: 1 }), 'reduction')[before]!, '0.9 dB')
  })

  it('with Release at 20 s keeps the gain 19.1 dB down just before the second strike of the chords, and the strike and the end of the ring come out 34.4 dB apart, no closer than the 34 dB they went in (claim way-tail)', async () => {
    const comp = await lab('compression')
    const long = await played(comp, 'evened', { release: 20 })
    expectWritten(-tap(long, 'reduction')[points(1.9)]!, '19.1 dB')
    expectWritten(range(tap(long, 'meterOut')).span, '34.4 dB')
    expectWritten(range(tap(long, 'meterIn')).span, '34 dB')
    // The card's own release, 0.3 s, is what brings them closer: 26.3 dB (claim evened-lift).
    expect(
      matchesWritten(range(tap(await played(comp, 'evened'), 'meterOut')).span, '34.4 dB'),
    ).toBe(false)
  })

  it('shows the gain between readings as the device holds its aim and as it ramps: the aim moves once in 16 samples, the ramp on every one, and they meet 16 samples on', async () => {
    const comp = await lab('compression')
    const result = comp.render(await benchSource('drums', seconds(4)), {})
    const held = tap(result, 'gainHeld')
    const ramped = tap(result, 'gainRamped')
    expect(held.length).toBe(128)
    let moves = 0
    for (let n = 1; n < held.length; n += 1) if (held[n] !== held[n - 1]) moves += 1
    expect(moves).toBeGreaterThanOrEqual(7)
    expect(moves).toBeLessThanOrEqual(8)
    let steps = 0
    for (let n = 1; n < ramped.length; n += 1) if (ramped[n] !== ramped[n - 1]) steps += 1
    expect(steps).toBeGreaterThan(120)
    // Where the aim moves, the ramp is where the aim was a reading ago, 16 samples later.
    for (let n = 17; n < held.length; n += 1) {
      if (held[n] !== held[n - 1])
        expect(Math.abs(ramped[n - 1]! - held[n - 1]!)).toBeLessThan(1e-4)
    }
  })

  it('is the input, sample for sample, with the mix at 0 (claim mix-zero)', async () => {
    const comp = await lab('compression')
    const drums = await benchSource('drums', seconds(2))
    const out = comp.render(drums, { mix: 0, threshold: -40, ratio: 10, makeup: 12 })
    const dry = tap(out, 'in')
    expect(tap(out, 'out').every((v, i) => v === dry[i])).toBe(true)
  })

  it('at a mix of one half brings a tone that is 12 dB down in the compressed copy out 4.1 dB down (claim mix-half)', async () => {
    const comp = await lab('compression')
    // 16 dB over the threshold at 4:1 with no knee: 12 dB of reduction.
    const tone = sineAt(-8, seconds(2))
    const down = (mix: number) => {
      const out = comp.render(tone, { ...hard, mix })
      const from = seconds(1)
      return -gainToDb(rms(tap(out, 'out'), from) / rms(tap(out, 'in'), from))
    }
    expectWritten(down(1), '12 dB')
    expectWritten(down(0.5), '4.1 dB')
  })

  it('takes away what its last tap says: the input less the output, sample for sample', async () => {
    const comp = await lab('compression')
    const result = comp.render(await benchSource('drums', seconds(2)), {})
    const dry = tap(result, 'in')
    const wet = tap(result, 'out')
    expect(tap(result, 'removed').every((v, i) => Math.abs(v - (dry[i]! - wet[i]!)) < 1e-6)).toBe(
      true,
    )
    // The last sound the main path writes is the output: a card with no tap of its own plays it.
    const sounds = comp.description.taps.filter(
      (one) => one.kind === 'audio' && !one.id.startsWith('built'),
    )
    expect(sounds.at(-1)!.id).toBe('out')
  })

  it('has a meter of its own on the input and on the output: a steady tone reads its level going in, and that level less the reduction coming out', async () => {
    const comp = await lab('compression')
    const result = comp.render(sineAt(-12, seconds(2)), hard)
    const from = points(1)
    expectWritten(mean(tap(result, 'meterIn'), from), '−12.0 dB')
    // 12 dB over the threshold at 4:1 is 9 dB of reduction.
    expectWritten(mean(tap(result, 'meterOut'), from), '−21.0 dB')
  })

  // ---- the build part ------------------------------------------------------------------------

  it('builds a compressor in seven pieces on taps of its own: at settings where every piece acts, every step changes one and none changes the main path', async () => {
    const comp = await lab('compression')
    expect(comp.description.controls.find((control) => control.id === 'build')!.choices).toEqual([
      'A wire',
      'Measure the level',
      'Threshold and ratio',
      'Knee',
      'Attack and release',
      'Make-up',
      'Mix',
    ])
    // At the lesson's starting values the make-up is 0 dB and the mix is 1, which are a gain of
    // exactly 1 and all of the compressed sound: the last two pieces are there and do nothing.
    // So the steps are held with those two controls turned.
    expectBuild(comp, await benchSource('drums', seconds(4)), { makeup: 6, mix: 0.5 })
  })

  it('changes the built sound at each of the first five steps at the starting values, and leaves it alone at the last two until Make-up or Mix is turned', async () => {
    const comp = await lab('compression')
    const drums = await benchSource('drums', seconds(4))
    const built = (values: Record<string, number>) => tap(comp.render(drums, values), 'built')
    const differs = (a: Float32Array, b: Float32Array) => a.some((v, i) => v !== b[i])
    const steps = [0, 1, 2, 3, 4, 5, 6].map((build) => built({ build }))
    // A wire with a meter on it is still a wire.
    expect(differs(steps[1]!, steps[0]!)).toBe(false)
    for (const step of [2, 3, 4]) expect(differs(steps[step]!, steps[step - 1]!)).toBe(true)
    expect(differs(steps[5]!, steps[4]!)).toBe(false)
    expect(differs(steps[6]!, steps[5]!)).toBe(false)
    expect(differs(built({ build: 5, makeup: 6 }), built({ build: 4, makeup: 6 }))).toBe(true)
    expect(differs(built({ build: 6, mix: 0.5 }), built({ build: 5, mix: 0.5 }))).toBe(true)
  })

  it("with all seven pieces is the device's own output: the last step is the one compared, the bound is −120 dB, and the two are the same sample for sample (claim build-same)", async () => {
    const comp = await lab('compression')
    const tried: Record<string, number>[] = [
      {},
      { tails: 0, release: 1 },
      { threshold: -40, ratio: 10, knee: 0, makeup: 9, mix: 0.4 },
      { scLowCut: 300, attack: 100, makeup: -6, mix: 0.5 },
    ]
    // Every loop the page offers, and the bench's clicks.
    for (const id of [...LOOPS, 'saw', 'noise', 'sine', 'clicks']) {
      const source = await benchSource(id, seconds(4))
      for (const values of tried) {
        const result = comp.render(source, { ...values, build: 6 })
        expect(result.checks.builtStep).toBe(6)
        expect(result.checks.builtBound).toBe(-120)
        expect(result.checks.builtDifference).toBeLessThan(-120)
        const out = tap(result, 'out')
        expect(tap(result, 'built').every((v, i) => v === out[i])).toBe(true)
        // Whatever step the reader is on, the build with every piece is what is compared.
        if (id === 'drums') {
          const earlier = comp.render(source, { ...values, build: 2 })
          expect(earlier.checks.builtStep).toBe(6)
          expect(earlier.checks.builtDifference).toBeLessThan(-120)
        }
      }
    }
    // A tone after a second of silence: the device rests in the silence and forgets what it
    // measured, and the build forgets with it.
    const rested = comp.render(step(-6), { build: 6 })
    expect(rested.checks.builtDifference).toBeLessThan(-120)
    expect(tap(rested, 'built').every((v, i) => v === tap(rested, 'out')[i])).toBe(true)
  })

  it('is a wire at the first step, and a wire with a meter on it at the second', async () => {
    const comp = await lab('compression')
    const drums = await benchSource('drums', seconds(4))
    const main = tap(comp.render(drums, {}), 'level')
    for (const build of [0, 1]) {
      const result = comp.render(drums, { build, threshold: -40, ratio: 10 })
      expect(tap(result, 'built').every((v, i) => v === drums.left[i])).toBe(true)
      expect(tap(result, 'builtGain').every((v) => v === 0)).toBe(true)
      expect(tap(result, 'builtTarget').every((v) => v === 0)).toBe(true)
      const level = tap(result, 'builtLevel')
      if (build === 0) expect(level.every((v) => v === -100)).toBe(true)
      // The built level is the level the main path reads off the device, point for point.
      else expect(level.every((v, i) => Math.abs(v - main[i]!) < 0.001)).toBe(true)
    }
  })

  /** How far the build so far turns a steady tone down, in dB, once it has settled. */
  const turnedDown = (comp: Lab, tone: Source, values: Record<string, number>) => {
    const result = comp.render(tone, values)
    const from = seconds(1)
    return -gainToDb(rms(tap(result, 'built'), from) / rms(tap(result, 'in'), from))
  }

  it('at the third step brings a tone 12 dB over the threshold down 9.0 dB at 4:1, and by nothing with the piece out (claim build-corner)', async () => {
    const comp = await lab('compression')
    const tone = sineAt(-12, seconds(2))
    const values = { threshold: -24, ratio: 4 }
    expectWritten(turnedDown(comp, tone, { ...values, build: 2 }), '9.0 dB')
    expectWritten(
      -mean(tap(comp.render(tone, { ...values, build: 2 }), 'builtGain'), points(1)),
      '9.0 dB',
    )
    // The piece switched out: the step before it turns nothing down.
    expect(Math.abs(turnedDown(comp, tone, { ...values, build: 1 }))).toBe(0)
    expect(matchesWritten(turnedDown(comp, tone, { ...values, build: 1 }), '9.0 dB')).toBe(false)
    // And it answers to its two controls: 12 dB over at 2:1 comes down 6 dB.
    expectWritten(turnedDown(comp, tone, { threshold: -24, ratio: 2, build: 2 }), '6.0 dB')
  })

  it('at the fourth step, with a knee of 6 dB at 4:1, takes 0.56 dB off a tone that stands exactly at the threshold, where the corner took nothing (claim build-knee)', async () => {
    const comp = await lab('compression')
    const tone = sineAt(-24, seconds(2))
    const values = { threshold: -24, ratio: 4, knee: 6 }
    // Half way through a knee of W dB the parabola asks for slope · W / 8: 0.75 · 6 / 8 dB.
    expectWritten(turnedDown(comp, tone, { ...values, build: 3 }), '0.56 dB')
    expect(matchesWritten(turnedDown(comp, tone, { ...values, build: 2 }), '0.56 dB')).toBe(false)
    expect(turnedDown(comp, tone, { ...values, build: 2 })).toBeLessThan(0.005)
    // Far over the threshold the knee is the corner: the same 9.0 dB.
    expectWritten(turnedDown(comp, sineAt(-12, seconds(2)), { ...values, build: 3 }), '9.0 dB')
  })

  it('at the fifth step takes 39 ms to bring a tone 18 dB over the threshold from silence 63 % of the way down, where the step before took 27 ms: the time the level takes to be read (claim build-times)', async () => {
    const comp = await lab('compression')
    const rise = (values: Record<string, number>) =>
      riseMs(tap(comp.render(step(-6), { ...hard, ...values }), 'builtGain'), -13.5)
    expectWritten(rise({ build: 4 }), '39 ms')
    expectWritten(rise({ build: 3 }), '27 ms')
    expect(matchesWritten(rise({ build: 3 }), '39 ms')).toBe(false)
    // It answers to Attack, and the step before does not.
    expectWritten(rise({ build: 4, attack: 100 }), '134 ms')
    expectWritten(rise({ build: 3, attack: 100 }), '27 ms')
    // And to Release: half a second after a tone stops, a release of 2 s has let go of less.
    const stopped = (release: number) => {
      const source = step(-6)
      source.left.fill(0, seconds(1.5))
      source.right.fill(0, seconds(1.5))
      // Noise far under the threshold keeps the device from resting.
      for (let i = seconds(1.5); i < source.left.length; i += 1) {
        source.left[i] = source.right[i] = i % 2 === 0 ? 1e-4 : -1e-4
      }
      const gain = tap(comp.render(source, { ...hard, release, build: 4 }), 'builtGain')
      return gain[gain.length - 1]!
    }
    expect(stopped(0.1)).toBeGreaterThan(-1)
    expect(stopped(2)).toBeLessThan(-8)
  })

  it('at the sixth step, with Make-up at 9 dB, brings that tone out as loud as it went in, 0.0 dB apart, where the step before left it 9.0 dB down (claim build-makeup)', async () => {
    const comp = await lab('compression')
    const tone = sineAt(-12, seconds(2))
    const values = { threshold: -24, ratio: 4, makeup: 9 }
    expectWritten(turnedDown(comp, tone, { ...values, build: 5 }), '0.0 dB')
    expectWritten(turnedDown(comp, tone, { ...values, build: 4 }), '9.0 dB')
    expect(matchesWritten(turnedDown(comp, tone, { ...values, build: 4 }), '0.0 dB')).toBe(false)
    // A tone under the threshold and its knee is only lifted: it comes out 9 dB louder.
    expectWritten(-turnedDown(comp, sineAt(-40, seconds(2)), { ...values, build: 5 }), '9.0 dB')
  })

  it('at the seventh step, with Mix at 0.5 and Make-up at 0 dB, leaves that tone 3.4 dB down, where the step before left it 9.0 dB down (claim build-mix)', async () => {
    const comp = await lab('compression')
    const tone = sineAt(-12, seconds(2))
    const values = { threshold: -24, ratio: 4, mix: 0.5 }
    // Half of the tone as it was and half of it at 9 dB down: 20 log10(0.5 + 0.5 · 10^(−9/20)).
    expectWritten(turnedDown(comp, tone, { ...values, build: 6 }), '3.4 dB')
    expectWritten(turnedDown(comp, tone, { ...values, build: 5 }), '9.0 dB')
    expect(matchesWritten(turnedDown(comp, tone, { ...values, build: 5 }), '3.4 dB')).toBe(false)
  })

  it('on the drums dips the built gain 5.9 dB at the third step and lets it back to 0 dB between hits, and at the fifth dips it 5.7 dB and never lets it back above 0.3 dB down (claim build-drums)', async () => {
    const comp = await lab('compression')
    const drums = await benchSource('drums', seconds(4))
    const built = (values: Record<string, number>) => tap(comp.render(drums, values), 'builtGain')
    const gain = (build: number) => range(built({ build }))
    expectWritten(-gain(2).lo, '5.9 dB')
    expect(gain(2).hi).toBe(0)
    // Back at 0 dB before the next hit: within a quarter of a second of its deepest point.
    const third = built({ build: 2 })
    const deepest = quietest(third)
    expect(range(third, deepest, deepest + points(0.25)).hi).toBe(0)
    expectWritten(-gain(4).lo, '5.7 dB')
    expectWritten(-gain(4).hi, '0.3 dB')
    // The piece out: at the step before, the fourth, both numbers are the third step's again.
    expect(matchesWritten(-gain(3).lo, '5.7 dB')).toBe(false)
    expect(matchesWritten(-gain(3).hi, '0.3 dB')).toBe(false)
    // With Release at its longest the gain stays down across the gaps, as the step's caption says.
    expect(range(built({ build: 4, release: 20 })).hi).toBeLessThan(-5)
  })

  // ---- the named sets: what each card plays, and the number its card states -------------------

  it('renders every named set on its own source, finite, and with its loudest sample under full scale wherever a card plays the output', async () => {
    const comp = await lab('compression')
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = await played(comp, name)
      const sound = set.tap ?? 'out'
      expect(
        tap(result, sound).every((v) => Number.isFinite(v)),
        name,
      ).toBe(true)
      expect(levelOf(result, sound), `${name} is heard`).toBeGreaterThan(-40)
      // "fader" is the failure the lesson opens on: it is over full scale, and its card says so.
      if (name !== 'fader') expect(topOf(result, sound), `${name} fits`).toBeLessThan(0)
    }
  })

  it('finds 34 dB between the strike of a chord and the end of its ring, which read −17.7 dB and −51.7 dB on the meter (claim chords-span)', async () => {
    const comp = await lab('compression')
    const level = range(tap(await played(comp, 'played'), 'meterIn'))
    expectWritten(level.hi, '−17.7 dB')
    expectWritten(level.lo, '−51.7 dB')
    expectWritten(level.span, '34 dB')
    // Two chords, two seconds apart: the meter is at its highest a tenth of a second or so after
    // each strike, and at its lowest just before the second.
    const meter = tap(await played(comp, 'played'), 'meterIn')
    const half = points(2)
    const top = (from: number) => {
      let at = from
      for (let k = from; k < from + half; k += 1) if (meter[k]! > meter[at]!) at = k
      return at
    }
    expect(Math.abs(top(half) - top(0) - half)).toBeLessThan(points(0.05))
    expect(Math.abs(quietest(meter) - half)).toBeLessThan(points(0.05))
  })

  it('turned up 10 dB by a fader alone, puts the loudest sample more than 4 dB over full scale and leaves the same 34 dB between loud and quiet (claim fader-over)', async () => {
    const comp = await lab('compression')
    const result = await played(comp, 'fader')
    expectWritten(levelOf(result, 'out') - levelOf(result, 'in'), '10 dB')
    expectWritten(topOf(result, 'out'), 'more than 4 dB')
    expectWritten(range(tap(result, 'meterOut')).span, '34 dB')
    // A ratio of 1 is a wire: nothing is turned down.
    expect(tap(result, 'reduction').every((v) => v === 0)).toBe(true)
  })

  it('compressed and then turned up the same 10 dB, brings the end of the ring out 9.2 dB higher and the strike 1.5 dB higher, 26.3 dB apart, with the loudest sample 1 dB under full scale (claim evened-lift)', async () => {
    const comp = await lab('compression')
    const result = await played(comp, 'evened')
    const going = tap(result, 'meterIn')
    const coming = tap(result, 'meterOut')
    const end = quietest(going)
    expectWritten(coming[end]! - going[end]!, '9.2 dB')
    expectWritten(range(coming).hi - range(going).hi, '1.5 dB')
    expectWritten(range(coming).span, '26.3 dB')
    expectWritten(-topOf(result, 'out'), '1 dB')
    // Between the two the picture's lines cross: half a second after the strike the gain is
    // still further down than the make-up lifts, and the ring comes out lower than it went in.
    expect(coming[points(0.5)]!).toBeLessThan(going[points(0.5)]! - 3)
    expect(coming[points(1.5)]!).toBeGreaterThan(going[points(1.5)]! + 3)
    // The piece out (a ratio of 1) is the fader of the claim before: nothing closer together.
    expect(
      matchesWritten(range(tap(await played(comp, 'fader'), 'meterOut')).span, '26.3 dB'),
    ).toBe(false)
  })

  it('with the make-up at 0 dB only turns down: the chords come out 11.7 dB quieter than they went in (claim quieter)', async () => {
    const comp = await lab('compression')
    const result = await played(comp, 'evened', { makeup: 0 })
    expectWritten(levelOf(result, 'in') - levelOf(result, 'out'), '11.7 dB')
    // No sample is made larger.
    const dry = tap(result, 'in')
    expect(tap(result, 'out').every((v, i) => Math.abs(v) <= Math.abs(dry[i]!))).toBe(true)
  })

  it('states the gain each card of part 3 rides through (claim use-drums, claim use-bass, claim use-line, claim use-mix, claim use-pad)', async () => {
    const comp = await lab('compression')
    const ridden = async (name: string) => range(tap(await played(comp, name), 'reduction'))
    const drums = await ridden('drums')
    expectWritten(-drums.lo, '9 dB')
    expectWritten(-drums.hi, 'less than 0.5 dB')
    // It is not back there before every hit: before the hit at 1 s it is still far down.
    const riding = tap(await played(comp, 'drums'), 'reduction')
    expect(riding[points(0.99)]!).toBeLessThan(-5)
    expect(riding[points(1.99)]!).toBeGreaterThan(-0.5)
    const bass = await ridden('bass')
    expectWritten(-bass.lo, '6.3 dB')
    expectWritten(-bass.hi, '0.8 dB')
    const line = await ridden('line')
    expectWritten(-line.lo, '4.9 dB')
    expectWritten(-line.hi, '2.5 dB')
    const mix = await ridden('mix')
    expectWritten(-mix.lo, '2.2 dB')
    expectWritten(-mix.hi, '1.5 dB')
    const pad = await ridden('pad')
    expectWritten(-pad.lo, '4.6 dB')
    expectWritten(-pad.hi, '4.1 dB')
  })

  it('on the bass card leans hardest on the loudest notes: their tops went in 5.4 dB apart and come out less than 4 dB apart (claim use-bass-evened)', async () => {
    const comp = await lab('compression')
    const result = await played(comp, 'bass')
    const going = tap(result, 'meterIn')
    const coming = tap(result, 'meterOut')
    const reduction = tap(result, 'reduction')
    const notes = tops(going)
    expect(notes.length).toBe(10)
    // A note's top coming out is looked for from 50 ms before its top going in to 100 ms after.
    const out = notes.map((k) => range(coming, Math.max(0, k - points(0.05)), k + points(0.1)).hi)
    expectWritten(range(notes.map((k) => going[k]!)).span, '5.4 dB')
    expectWritten(range(out).span, 'less than 4 dB')
    // The gain is lowest under the loudest notes: in the half second after the loudest top the
    // reduction is more than a decibel deeper than it is over the loop as a whole.
    const loudestTop = notes.reduce((a, b) => (going[b]! > going[a]! ? b : a))
    expect(mean(reduction, loudestTop, loudestTop + points(0.5))).toBeLessThan(mean(reduction) - 1)
  })

  it('on the line card takes most off the two notes the player digs into: the two loudest tops are followed by the two deepest dips of the gain', async () => {
    const comp = await lab('compression')
    const result = await played(comp, 'line')
    const going = tap(result, 'meterIn')
    const reduction = tap(result, 'reduction')
    const notes = tops(going)
    const dip = (k: number) => range(reduction, k, Math.min(reduction.length, k + points(0.15))).lo
    const byLevel = [...notes].sort((a, b) => going[b]! - going[a]!)
    const byDip = [...notes].sort((a, b) => dip(a) - dip(b))
    expect(new Set(byDip.slice(0, 2))).toEqual(new Set(byLevel.slice(0, 2)))
    // And the gain dips at every note: each top is followed by a dip at least 0.5 dB under the
    // gain's highest point.
    for (const k of notes) expect(dip(k)).toBeLessThan(range(reduction).hi - 0.5)
  })

  it('on the drums card lets the hit at 2 s, after the longest gap, out 2.6 dB taller than it went in, and the hit at 1 s, close behind another, 3.6 dB smaller (claim use-drums-fronts)', async () => {
    const comp = await lab('compression')
    const result = await played(comp, 'drums')
    expectWritten(taller(result, 2, 2.25), '2.6 dB')
    expectWritten(-taller(result, 1, 1.25), '3.6 dB')
    // What the card's still shows of its two seconds: the hits at the start and at 1 s come out
    // smaller, the three between and after them taller.
    expect(taller(result, 0, 0.25)).toBeLessThan(-1)
    for (const at of [0.5, 0.75, 1.5]) expect(taller(result, at, at + 0.25)).toBeGreaterThan(1)
    // The front of a hit goes through at the gain the hit before it left: on the loudest sample
    // of each of those two hits the gain is within 0.1 dB of what it was 2 ms before the hit.
    const gain = tap(result, 'gain')
    const makeup = settings.sets.drums!.values!.makeup!
    for (const at of [1, 2]) {
      const peak = loudest(tap(result, 'in'), seconds(at), seconds(at + 0.01))
      const before = gain[points(at - 0.002)]!
      expect(Math.abs(gainOn(result, peak) - makeup - before)).toBeLessThan(0.1)
    }
  })

  it('with a slower attack lets more of each hit through: the gain dips 9.3 dB at 60 ms and 11.3 dB at 10 ms (claim way-hit)', async () => {
    const comp = await lab('compression')
    expectWritten(-range(tap(await played(comp, 'hit'), 'reduction')).lo, '9.3 dB')
    expectWritten(-range(tap(await played(comp, 'hit', { attack: 10 }), 'reduction')).lo, '11.3 dB')
  })

  it('beside the sound moves the gain on the whole through 5.7 dB, where the compressed copy alone moves through 19.7 dB (claim way-beside)', async () => {
    const comp = await lab('compression')
    const blended = applied(await played(comp, 'beside'))
    expectWritten(blended.hi - blended.lo, '5.7 dB')
    expectWritten(-blended.lo, 'less than 3 dB')
    expectWritten(blended.hi, 'less than 3 dB')
    const alone = applied(await played(comp, 'beside', { mix: 1 }))
    expectWritten(alone.hi - alone.lo, '19.7 dB')
  })

  it('with the lows kept out of the detector, Ignore below at 300 Hz, dips 6.2 dB on the mix, where a detector that hears everything, at 20 Hz, dips 11.1 dB (claim way-lows)', async () => {
    const comp = await lab('compression')
    expectWritten(-range(tap(await played(comp, 'lows'), 'reduction')).lo, '6.2 dB')
    expectWritten(
      -range(tap(await played(comp, 'lows', { scLowCut: 20 }), 'reduction')).lo,
      '11.1 dB',
    )
  })

  it('pumps: the gain swings between 0.6 dB and 20.6 dB down on every hit, and with the release at 1 s never comes back above 10.1 dB down (claim fault-pump)', async () => {
    const comp = await lab('compression')
    const short = range(tap(await played(comp, 'pump'), 'reduction'))
    expectWritten(-short.hi, '0.6 dB')
    expectWritten(-short.lo, '20.6 dB')
    const long = range(tap(await played(comp, 'pump', { release: 1 }), 'reduction'))
    expectWritten(-long.hi, '10.1 dB')
    expectWritten(-long.lo, '20.6 dB')
  })

  it('lets the front of a hit through: the gain goes as far as 11.3 dB down, the loudest sample that comes out stands 0.5 dB under the loudest that went in, and the loudest that went in, close behind another hit, comes out 6.4 dB down (claim fault-front)', async () => {
    const comp = await lab('compression')
    const result = await played(comp, 'front')
    expectWritten(-range(tap(result, 'reduction')).lo, '11.3 dB')
    // The loudest sample coming out is the front of a hit that follows a gap.
    const through = loudest(tap(result, 'out'))
    expectWritten(-gainOn(result, through), 'less than 0.5 dB')
    expectWritten(topOf(result, 'in') - topOf(result, 'out'), '0.5 dB')
    // The loudest sample going in is the front of another hit, which follows one closely.
    const met = loudest(tap(result, 'in'))
    expect(Math.abs(met - through)).toBeGreaterThan(seconds(0.5))
    expectWritten(-gainOn(result, met), '6.4 dB')
    // Neither front was turned down by its own hit: 2 ms before each, the gain was already
    // within 0.1 dB of what the front met.
    const gain = tap(result, 'gain')
    for (const sample of [through, met]) {
      const before = gain[(Math.floor(sample / 16) - 6 + gain.length) % gain.length]!
      expect(Math.abs(gainOn(result, sample) - before)).toBeLessThan(0.1)
    }
  })

  it('with the threshold under everything never lets go: the gain is never less than 9.0 dB down, and the loudest sample stands 26.8 dB over the level where it stood 18.4 dB over it (claim fault-flat)', async () => {
    const comp = await lab('compression')
    const result = await played(comp, 'flat')
    expectWritten(-range(tap(result, 'reduction')).hi, '9.0 dB')
    expectWritten(crest(result, 'in'), '18.4 dB')
    expectWritten(crest(result, 'out'), '26.8 dB')
    // The loudest sample coming out is the front of the hit that met the least reduction of the
    // loop: 9.0 dB down, under 12 dB of make-up.
    const makeup = settings.sets.flat!.values!.makeup!
    expectWritten(makeup - gainOn(result, loudest(tap(result, 'out'))), '9.0 dB')
  })

  it("starts the page's device table from the device's own defaults: the settings file's defaults, laid over the lab's starting values, are device.json's", async () => {
    const comp = await lab('compression')
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/ambient-comp/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const { values } = resolveSet(comp.description, { values: settings.defaults!.values })
    expect(values).toEqual(Object.fromEntries(device.params.map((one) => [one.key, one.default])))
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(settings.defaults!.values)) {
      expect(comp.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
  })
})
