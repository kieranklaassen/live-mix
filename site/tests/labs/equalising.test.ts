import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult, TapData } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
  BIN,
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  noise,
  peak,
  POINT_RATE,
  RATE,
  rms,
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

const NAME = 'equalising'

/** Every tone band at 0 dB and both cuts at their stops: nothing in circuit. */
const wire = { lowCut: 20, low: 0, body: 0, presence: 0, air: 0, highCut: 20000 }

/** A short tone, for a render whose curves are what is read. */
const short = () => sine(1000, 0.25, seconds(0.25))

/**
 * How much louder a sine at `hz` is at a stage than it went in, in dB: a second of the tone
 * through the lab, the stage's level over the input's. The taps hold the second pass of the
 * loop, so the filters have settled.
 */
function gainAt(theLab: Lab, tap: string, hz: number, values: Record<string, number>): number {
  const out = theLab.render(sine(hz, 0.25, seconds(1)), values)
  return gainToDb(rms(out.taps[tap]!.channels_data[0]!) / rms(out.taps.in!.channels_data[0]!))
}

/** A curve's value at `x`, between its two nearest points. */
function at(tap: TapData, x: number): number {
  const data = tap.channels_data[0]!
  const last = data.length - 1
  const place =
    (tap.log
      ? Math.log(x / tap.x0) / Math.log(tap.x1 / tap.x0)
      : (x - tap.x0) / (tap.x1 - tap.x0)) * last
  const i = Math.min(last - 1, Math.max(0, Math.floor(place)))
  return data[i]! + (data[i + 1]! - data[i]!) * (place - i)
}

/** The frequency a point of a curve from 20 Hz to 20 kHz stands at; `p` may lie between two. */
const hzOf = (tap: TapData, p: number) =>
  tap.x0 * Math.pow(tap.x1 / tap.x0, p / (tap.channels_data[0]!.length - 1))

const lowest = (x: Float32Array) => x.reduce((a, b) => Math.min(a, b), Infinity)
const highest = (x: Float32Array) => x.reduce((a, b) => Math.max(a, b), -Infinity)

/**
 * Where a curve is lowest, in hertz: the lowest point and its two neighbours, and the bottom of
 * the parabola through the three, so the answer is not held to the curve's own steps.
 */
function bottomHz(tap: TapData): number {
  const data = tap.channels_data[0]!
  const p = Math.min(data.length - 2, Math.max(1, data.indexOf(lowest(data))))
  const [a, b, c] = [data[p - 1]!, data[p]!, data[p + 1]!]
  return hzOf(tap, p + (0.5 * (a - c)) / (a - 2 * b + c))
}

/**
 * The response of the one bell at a frequency, worked out from where its zeros and poles stand
 * (the lab's bellRoots): b0 times the distances from the frequency's point on the circle to the
 * two zeros, over the distances to the two poles, and the angles the same way.
 */
function fromRoots(roots: Float32Array, hz: number): { db: number; degrees: number } {
  const w = (2 * Math.PI * hz) / RATE
  const point = [Math.cos(w), Math.sin(w)] as const
  let size = Math.abs(roots[8]!)
  let angle = roots[8]! < 0 ? Math.PI : 0
  for (let k = 0; k < 4; k += 1) {
    const across = point[0] - roots[2 * k]!
    const up = point[1] - roots[2 * k + 1]!
    const zero = k < 2
    size = zero ? size * Math.hypot(across, up) : size / Math.hypot(across, up)
    angle += (zero ? 1 : -1) * Math.atan2(up, across)
  }
  return {
    db: 20 * Math.log10(size),
    degrees: (Math.atan2(Math.sin(angle), Math.cos(angle)) * 180) / Math.PI,
  }
}

/** The frequency between `lo` and `hi` at which `value` crosses `level`, by halving. */
function crossing(value: (hz: number) => number, lo: number, hi: number, level: number): number {
  const rising = value(lo) < level
  for (let i = 0; i < 50; i += 1) {
    const mid = (lo + hi) / 2
    if (value(mid) < level === rising) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/** The frequency between `lo` and `hi`, in steps of 0.05 Hz, at which `value` is greatest. */
function greatest(value: (hz: number) => number, lo: number, hi: number) {
  let best = { hz: lo, value: value(lo) }
  for (let hz = lo; hz <= hi; hz += 0.05) {
    const v = value(hz)
    if (v > best.value) best = { hz, value: v }
  }
  return best
}

/**
 * The time a ring takes to fall to 1/e, in ms: the largest sample of each millisecond (one
 * cycle at 1 kHz), and the slope of a straight line through their logarithms.
 */
function ringMs(result: RenderResult): number {
  const ring = result.taps.bellRing!.channels_data[0]!
  let n = 0
  let sx = 0
  let sy = 0
  let sxx = 0
  let sxy = 0
  for (let cycle = 0; cycle < 30; cycle += 1) {
    let top = 0
    for (let i = cycle * 48; i < cycle * 48 + 48; i += 1) top = Math.max(top, Math.abs(ring[i]!))
    if (top < 1e-5) break
    const y = Math.log(top)
    n += 1
    sx += cycle
    sy += y
    sxx += cycle * cycle
    sxy += cycle * y
  }
  return -1 / ((n * sxy - sx * sy) / (n * sxx - sx * sx))
}

/** White noise with a 1 kHz tone standing out of it: a bed, and one thing ringing above it. */
function toneOnNoise(noisePeak: number, tonePeak: number, frames = seconds(4), from = 0): Source {
  const bed = noise(noisePeak, frames)
  const tone = sine(1000, tonePeak, frames)
  const source = silence(frames)
  for (let i = from; i < frames; i += 1) {
    source.left[i] = bed.left[i]! + tone.left[i]!
    source.right[i] = bed.right[i]! + tone.right[i]!
  }
  return source
}

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings(NAME)!

/** A named set as its card plays it: on its own source, with `over` laid on its values. */
async function played(eq: Lab, name: string, over: Record<string, number> = {}) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(eq.description, set)
  return eq.render(await benchSource(source!, seconds(4)), { ...values, ...over })
}

const tap = (result: RenderResult, id: string) => result.taps[id]!.channels_data[0]!
/** A tap's level over the loop, in dB against full scale. */
const levelOf = (result: RenderResult, id: string) => gainToDb(rms(tap(result, id)))
/** A tap's loudest sample, in dB against full scale. */
const topOf = (result: RenderResult, id: string) => gainToDb(peak(tap(result, id)))

/** The power a spectrum holds from `lo` to `hi` hertz, in dB: its bins added. */
function band(spectrum: Float32Array, lo: number, hi: number): number {
  let sum = 0
  for (let k = Math.ceil(lo / BIN); k <= Math.floor(hi / BIN); k += 1)
    sum += 10 ** (spectrum[k]! / 10)
  return 10 * Math.log10(Math.max(sum, 1e-20))
}

/**
 * How much more of a band of frequencies there is in a tap of the lab's last render than in
 * another, in dB: the band's power in the average spectrum of each, over the whole loop.
 */
const bandOver = (eq: Lab, lo: number, hi: number, of = 'out', against = 'in') =>
  band(eq.spectrum(of), lo, hi) - band(eq.spectrum(against), lo, hi)

const LOOPS = ['drums', 'guitar', 'chords', 'bass', 'pad', 'mix']
/** Every sound the page offers in its play bar (the lesson's `sources`). */
const SOUNDS = ['mix', 'drums', 'bass', 'chords', 'pad', 'guitar', 'noise', 'saw', 'clicks']

/** Whether two taps hold the very same samples, on both channels. */
function sameSamples(result: RenderResult, one: string, other: string): boolean {
  return [0, 1].every((c) => {
    const a = result.taps[one]!.channels_data[c]!
    const b = result.taps[other]!.channels_data[c]!
    return a.length === b.length && a.every((v, i) => v === b[i])
  })
}

/**
 * Clear's bands as the lab draws them: the two curves are steps, one step to a band, so a band
 * is a run of points over which neither curve changes. Each with the frequencies it runs over.
 */
function heardBands(result: RenderResult) {
  const heard = result.taps.bandPower!
  const power = heard.channels_data[0]!
  const line = result.taps.bandMargin!.channels_data[0]!
  const bands: { from: number; to: number; power: number; line: number }[] = []
  power.forEach((v, p) => {
    const last = bands.at(-1)
    if (last && last.power === v && last.line === line[p]) last.to = hzOf(heard, p)
    else bands.push({ from: hzOf(heard, p), to: hzOf(heard, p), power: v, line: line[p]! })
  })
  return bands
}

/** How many separate dips deeper than `depth` dB a curve has. */
function dips(tap: TapData, depth: number): number {
  const data = tap.channels_data[0]!
  let count = 0
  for (let p = 1; p < data.length - 1; p += 1)
    if (data[p]! < -depth && data[p]! < data[p - 1]! && data[p]! <= data[p + 1]!) count += 1
  return count
}

/**
 * The low cut from two biquads worked again here, away from the lab: the kit's recipe for a
 * high-pass in single precision, as the kit works it, then one unit sample through the two in
 * transposed direct form II, and the level of 20 Hz in what comes out, in dB. `round` is what
 * each sum is rounded to: Math.fround for the single precision the kit runs in, or nothing,
 * which leaves the memories the double precision of a JavaScript number.
 */
function cutPairAt20(corner: number, round: (v: number) => number): number {
  const f = Math.fround
  const design = (q: number) => {
    const w = f(f(f(2 * Math.PI) * corner) / RATE)
    const cosw = f(Math.cos(w))
    const alpha = f(f(Math.sin(w)) / f(2 * f(q)))
    const inverse = f(1 / f(1 + alpha))
    const edge = f(1 + cosw)
    return {
      b0: f(f(edge * 0.5) * inverse),
      b1: f(-edge * inverse),
      b2: f(f(edge * 0.5) * inverse),
      a1: f(f(-2 * cosw) * inverse),
      a2: f(f(1 - alpha) * inverse),
      z1: 0,
      z2: 0,
    }
  }
  const pair = [design(0.5412), design(1.3066)]
  const w = (2 * Math.PI * 20) / RATE
  let re = 0
  let im = 0
  for (let n = 0; n < 16384; n += 1) {
    let x = n === 0 ? 1 : 0
    for (const one of pair) {
      const y = round(round(one.b0 * x) + one.z1)
      one.z1 = round(round(round(one.b1 * x) - round(one.a1 * y)) + one.z2)
      one.z2 = round(round(one.b2 * x) - round(one.a2 * y))
      x = y
    }
    re += x * Math.cos(w * n)
    im -= x * Math.sin(w * n)
  }
  return 10 * Math.log10(re * re + im * im)
}

describe('equalising with biquads', () => {
  it('is a sound lab on the mix: every tap says something, loops, and answers to every control', async () => {
    const eq = await lab(NAME)
    const mix = await benchSource('mix', seconds(4))
    const result = eq.render(mix, {})
    // With Clear at 0, where the lab starts, it cuts nothing: both of its taps are rightly flat.
    expectSoundLab(eq, mix, result, { quiet: ['clearDepth', 'respClear'] })
  })

  it('builds an equaliser in five pieces on taps of its own: every step changes one, none changes the main path, and the last is the device', async () => {
    const eq = await lab(NAME)
    expect(eq.description.controls.find((control) => control.id === 'build')!.choices).toEqual([
      'One biquad',
      'A bell',
      'The shelves',
      'The cuts',
      'The chain',
    ])
    expectBuild(eq, await benchSource('mix', seconds(4)))
  })

  it('takes away what its tap says: the input less the output, sample for sample, and the output is the last sound of the main path', async () => {
    const eq = await lab(NAME)
    const result = eq.render(await benchSource('mix', seconds(2)), {})
    const dry = tap(result, 'in')
    const wet = tap(result, 'out')
    expect(tap(result, 'removed').every((v, i) => Math.abs(v - (dry[i]! - wet[i]!)) < 1e-6)).toBe(
      true,
    )
    // A card with no tap of its own plays the last sound the main path writes.
    const sounds = eq.description.taps.filter(
      (one) => one.kind === 'audio' && !one.id.startsWith('built'),
    )
    expect(sounds.at(-1)!.id).toBe('out')
  })

  // ---- part 1: why ----------------------------------------------------------------------------

  it('finds more of the mix at the bottom than at the top: 40 to 100 Hz holds 17 dB more than 2 to 5 kHz, and 200 to 500 Hz 13 dB more (claim mix-tilt)', async () => {
    const eq = await lab(NAME)
    await played(eq, 'mix')
    const spectrum = eq.spectrum('in')
    expectWritten(band(spectrum, 40, 100) - band(spectrum, 2000, 5000), '17 dB')
    expectWritten(band(spectrum, 200, 500) - band(spectrum, 2000, 5000), '13 dB')
  })

  it('takes the bottom with the middle when a cut is all there is: the Low cut at 500 Hz brings 200 to 500 Hz of the mix down 11 dB and 40 to 100 Hz down 64 dB (claim cut-takes-all)', async () => {
    const eq = await lab(NAME)
    await played(eq, 'cutaway')
    expectWritten(-bandOver(eq, 200, 500), '11 dB')
    expectWritten(-bandOver(eq, 40, 100), '64 dB')
  })

  it('turns one part of the mix down with a bell: Body at −8 dB brings 200 to 500 Hz down 6.9 dB, 40 to 100 Hz down 0.8 dB and 2 to 5 kHz down 0.3 dB (claim bell-takes-part)', async () => {
    const eq = await lab(NAME)
    await played(eq, 'dip')
    expectWritten(-bandOver(eq, 200, 500), '6.9 dB')
    expectWritten(-bandOver(eq, 40, 100), '0.8 dB')
    expectWritten(-bandOver(eq, 2000, 5000), '0.3 dB')
  })

  it('reaches two octaves: Body at −8 dB takes 1.1 dB off a tone at 80 Hz and 8.00 dB off one at 320 Hz (claim bell-reach)', async () => {
    const eq = await lab(NAME)
    const values = { ...wire, body: -8 }
    expectWritten(-gainAt(eq, 'out', 80, values), '1.1 dB')
    expectWritten(-gainAt(eq, 'out', 320, values), '8.00 dB')
    expectWritten(-gainAt(eq, 'out', 1280, values), '1.1 dB')
  })

  // ---- part 3: what it is used on -------------------------------------------------------------

  it('gives the drums weight and top and takes out the middle: 40 to 100 Hz 2.2 dB up, 200 to 500 Hz 3.1 dB down, 8 to 16 kHz 3.1 dB up (claim use-drums)', async () => {
    const eq = await lab(NAME)
    await played(eq, 'drums')
    expectWritten(bandOver(eq, 40, 100), '2.2 dB')
    expectWritten(-bandOver(eq, 200, 500), '3.1 dB')
    expectWritten(bandOver(eq, 8000, 16000), '3.1 dB')
  })

  it('brings the top of each bass note forward: 2 to 5 kHz 3.3 dB up, 200 to 500 Hz 3.3 dB down, 40 to 100 Hz 1.5 dB up (claim use-bass)', async () => {
    const eq = await lab(NAME)
    await played(eq, 'bass')
    expectWritten(bandOver(eq, 2000, 5000), '3.3 dB')
    expectWritten(-bandOver(eq, 200, 500), '3.3 dB')
    expectWritten(bandOver(eq, 40, 100), '1.5 dB')
  })

  it('makes room under the strummed guitar: 40 to 100 Hz 6.3 dB down, 200 to 500 Hz 3.5 dB down, 2 to 5 kHz 2.6 dB up (claim use-chords)', async () => {
    const eq = await lab(NAME)
    await played(eq, 'chords')
    expectWritten(-bandOver(eq, 40, 100), '6.3 dB')
    expectWritten(-bandOver(eq, 200, 500), '3.5 dB')
    expectWritten(bandOver(eq, 2000, 5000), '2.6 dB')
  })

  it('pushes the pad to the back: 2 to 5 kHz 7.5 dB down, 8 to 16 kHz 13.6 dB down, 200 to 500 Hz 0.2 dB down (claim use-pad)', async () => {
    const eq = await lab(NAME)
    await played(eq, 'pad')
    expectWritten(-bandOver(eq, 2000, 5000), '7.5 dB')
    expectWritten(-bandOver(eq, 8000, 16000), '13.6 dB')
    expectWritten(-bandOver(eq, 200, 500), '0.2 dB')
  })

  it('asks little of a whole mix: 40 to 100 Hz 1.2 dB up, 200 to 500 Hz 1.3 dB down, 8 to 16 kHz 1.4 dB up (claim use-whole)', async () => {
    const eq = await lab(NAME)
    await played(eq, 'whole')
    expectWritten(bandOver(eq, 40, 100), '1.2 dB')
    expectWritten(-bandOver(eq, 200, 500), '1.3 dB')
    expectWritten(bandOver(eq, 8000, 16000), '1.4 dB')
  })

  // ---- part 4: the build ----------------------------------------------------------------------

  it('is a wire at its first step, whatever the controls say: the built sound is the input, sample for sample', async () => {
    const eq = await lab(NAME)
    const result = eq.render(await benchSource('mix', seconds(2)), { build: 0 })
    for (const c of [0, 1]) {
      const dry = result.taps.in!.channels_data[c]!
      expect(result.taps.built!.channels_data[c]!.every((v, i) => v === dry[i])).toBe(true)
    }
    expect(result.taps.builtResponse!.channels_data[0]!.every((v) => Math.abs(v) < 1e-5)).toBe(true)
  })

  it('makes the one biquad a bell at step 2: with Body at −5 dB a tone at 320 Hz comes out 5.00 dB down, and as it went in with the piece taken out (claim build-bell)', async () => {
    const eq = await lab(NAME)
    const values = { ...wire, body: -5 }
    expectWritten(-gainAt(eq, 'built', 320, { ...values, build: 1 }), '5.00 dB')
    expect(matchesWritten(-gainAt(eq, 'built', 320, { ...values, build: 0 }), '5.00 dB')).toBe(
      false,
    )
    // The second bell of the step, Presence, at its own centre.
    expectWritten(gainAt(eq, 'built', 3000, { ...wire, presence: 5, build: 1 }), '5.00 dB')
  })

  it('adds the shelves at step 3: with Low at +6 dB a tone at 120 Hz comes out 3.00 dB up and one at 30 Hz 5.99 dB up, and neither moves with the piece taken out (claim build-shelf)', async () => {
    const eq = await lab(NAME)
    const values = { ...wire, low: 6 }
    expectWritten(gainAt(eq, 'built', 120, { ...values, build: 2 }), '3.00 dB')
    expectWritten(gainAt(eq, 'built', 30, { ...values, build: 2 }), '5.99 dB')
    expect(matchesWritten(gainAt(eq, 'built', 120, { ...values, build: 1 }), '3.00 dB')).toBe(false)
    expect(matchesWritten(gainAt(eq, 'built', 30, { ...values, build: 1 }), '5.99 dB')).toBe(false)
    expectWritten(gainAt(eq, 'built', 9000, { ...wire, air: 6, build: 2 }), '3.00 dB')
  })

  it('adds the cuts at step 4: with Low cut at 100 Hz a tone at 100 Hz comes out 3.01 dB down and one at 50 Hz 24.1 dB down, and neither moves with the piece taken out (claim build-cut)', async () => {
    const eq = await lab(NAME)
    const values = { ...wire, lowCut: 100 }
    expectWritten(-gainAt(eq, 'built', 100, { ...values, build: 3 }), '3.01 dB')
    expectWritten(-gainAt(eq, 'built', 50, { ...values, build: 3 }), '24.1 dB')
    expect(matchesWritten(-gainAt(eq, 'built', 100, { ...values, build: 2 }), '3.01 dB')).toBe(
      false,
    )
    expect(matchesWritten(-gainAt(eq, 'built', 50, { ...values, build: 2 }), '24.1 dB')).toBe(false)
  })

  it('takes what does nothing out of circuit at step 5: with every band at 0 dB and the cuts at their stops a 20 Hz tone comes out 0.00 dB down, where step 4 left it 3.01 dB down (claim build-chain)', async () => {
    const eq = await lab(NAME)
    expectWritten(-gainAt(eq, 'built', 20, { ...wire, build: 4 }), '0.00 dB')
    expectWritten(-gainAt(eq, 'built', 20, { ...wire, build: 3 }), '3.01 dB')
    expect(matchesWritten(-gainAt(eq, 'built', 20, { ...wire, build: 3 }), '0.00 dB')).toBe(false)
    // And then it is the input itself.
    const mix = await benchSource('mix', seconds(2))
    expect(sameSamples(eq.render(mix, { ...wire, build: 4 }), 'built', 'in')).toBe(true)
    // Bells and shelves at 0 dB have the numbers of a wire: step 3, which runs all four, hands
    // on the input itself. The cuts of step 4, at the ends of their ranges, do not.
    expect(sameSamples(eq.render(mix, { ...wire, build: 2 }), 'built', 'in')).toBe(true)
    expect(sameSamples(eq.render(mix, { ...wire, build: 3 }), 'built', 'in')).toBe(false)
  })

  it('is the device at its last step, sample for sample, on every sound of the page and at settings that work every piece (claim build-same)', async () => {
    const eq = await lab(NAME)
    const busy = { lowCut: 250, highCut: 3000, low: -8, body: 9, presence: -7, air: 5 }
    const tried: Record<string, number>[] = [{}, busy, wire, { clear: 1 }, { low: 0, air: 0 }]
    for (const id of SOUNDS) {
      const source = await benchSource(id, seconds(4))
      for (const values of tried) {
        for (const build of [0, 4]) {
          const result = eq.render(source, { ...values, build })
          const { checks } = result
          expect(checks.builtDifference, `${id} at step ${build}`).toBe(-140)
          expect(checks.builtDifference).toBeLessThanOrEqual(checks.builtBound!)
          if (build !== 4) continue
          // The check's floor is also what it reads for a difference under one part in ten
          // million, so the samples themselves: the build's against the chain the lab keeps
          // from the kit's filters, and with Clear at 0, where nothing follows the six bands,
          // against the device's own output.
          expect(sameSamples(result, 'built', 'afterHighCut'), id).toBe(true)
          if (!values.clear) {
            expect(sameSamples(result, 'afterHighCut', 'out'), id).toBe(true)
            expect(sameSamples(result, 'built', 'out'), id).toBe(true)
          }
        }
      }
      // A step short of the last is not the device: its samples are not the device's.
      expect(sameSamples(eq.render(source, { build: 3 }), 'built', 'out'), id).toBe(false)
    }
  })

  it('draws a curve at every step: the bands the step has are in it and the ones to come are not', async () => {
    const eq = await lab(NAME)
    const values = { lowCut: 100, low: 6, body: -5, presence: 5, air: 6, highCut: 5000 }
    const curve = (build: number) => eq.render(short(), { ...values, build }).taps
    expect(Math.abs(at(curve(0).builtResponse!, 320))).toBeLessThan(1e-4)
    // A bell: Body and Presence are in, Low is not. An octave over Body's centre Presence adds a little.
    expect(at(curve(1).builtResponse!, 320)).toBeLessThan(-4.5)
    expect(at(curve(1).builtResponse!, 3000)).toBeGreaterThan(4.5)
    expect(Math.abs(at(curve(1).builtResponse!, 20))).toBeLessThan(0.1)
    // The shelves.
    expect(at(curve(2).builtResponse!, 20)).toBeGreaterThan(5.5)
    // The cuts.
    expect(at(curve(3).builtResponse!, 20)).toBeLessThan(-40)
    expect(at(curve(3).builtResponse!, 20000)).toBeLessThan(-20)
    // The step before is the curve of the step before.
    for (const build of [1, 2, 3, 4]) {
      const before = curve(build).builtBefore!.channels_data[0]!
      const was = curve(build - 1).builtResponse!.channels_data[0]!
      expect(before.every((v, p) => v === was[p])).toBe(true)
    }
  })

  // ---- part 5: one biquad ---------------------------------------------------------------------

  it('runs the difference equation as written and the form the kit runs to within rounding: on the drums, with the bell where the page starts it, they differ by 112 dB under the sound (claim forms-agree)', async () => {
    const eq = await lab(NAME)
    const drums = await benchSource('drums', seconds(4))
    expectWritten(-eq.render(drums, {}).checks.forms!, '112 dB')
    // On every loop the difference is rounding and nothing else.
    for (const id of LOOPS) {
      const source = await benchSource(id, seconds(4))
      expect(eq.render(source, {}).checks.forms).toBeLessThan(-100)
    }
  })

  it('finds more rounding between the two forms when the bell is placed low: with Frequency at 100 Hz the reading on the drums is 82 dB under the sound (claim forms-low)', async () => {
    const eq = await lab(NAME)
    const drums = await benchSource('drums', seconds(4))
    expectWritten(-eq.render(drums, { bellHz: 100 }).checks.forms!, '82 dB')
    expect(matchesWritten(-eq.render(drums, {}).checks.forms!, '82 dB')).toBe(false)
  })

  it('puts the poles of a +6 dB bell at 1 kHz and Q 2 at 0.977 from the centre and its zeros at 0.955 (claim pole-radius)', async () => {
    const eq = await lab(NAME)
    const { checks } = eq.render(short(), {})
    expectWritten(checks.poleRadius!, '0.977')
    expectWritten(checks.zeroRadius!, '0.955')
    // A cut swaps them.
    const cut = eq.render(short(), { bellGain: -6 }).checks
    expectWritten(cut.poleRadius!, '0.955')
    expectWritten(cut.zeroRadius!, '0.977')
  })

  it('draws the bell from where its zeros and poles stand: the distances give the measured curve to less than 0.001 dB, at every setting tried (claim roots-make-curve)', async () => {
    const eq = await lab(NAME)
    const tried: Record<string, number>[] = [
      {},
      { bellGain: -6 },
      { bellGain: 12, bellQ: 10 },
      { bellHz: 100, bellQ: 0.3, bellGain: -12 },
      { bellHz: 12000, bellQ: 0.7, bellGain: 9 },
      // So broad that the poles leave their pair and stand on the level line.
      { bellHz: 20000, bellQ: 0.3, bellGain: -12 },
    ]
    for (const values of tried) {
      const { taps, checks } = eq.render(short(), values)
      const roots = taps.bellRoots!.channels_data[0]!
      expect(roots.length).toBe(9)
      const response = taps.bellResponse!
      let worst = 0
      response.channels_data[0]!.forEach((v, p) => {
        worst = Math.max(worst, Math.abs(fromRoots(roots, hzOf(response, p)).db - v))
      })
      expectWritten(worst, 'less than 0.001 dB')
      // A pair that mirror each other stands as far out as the check says.
      if (roots[5] !== 0) {
        expect(Math.hypot(roots[4]!, roots[5]!)).toBeCloseTo(checks.poleRadius!, 5)
        expect(roots[7]).toBe(-roots[5]!)
      }
    }
  })

  it('adds the curve of the zeros alone and the curve of the poles alone to the bell, within 0.001 dB; at 20 Hz they are 35.5 dB down and 35.5 dB up (claim halves-add)', async () => {
    const eq = await lab(NAME)
    const { taps } = eq.render(short(), {})
    const zeros = taps.bellZeros!.channels_data[0]!
    const poles = taps.bellPoles!.channels_data[0]!
    const bell = taps.bellResponse!.channels_data[0]!
    let worst = 0
    bell.forEach((v, p) => (worst = Math.max(worst, Math.abs(zeros[p]! + poles[p]! - v))))
    expectWritten(worst, 'less than 0.001 dB')
    expectWritten(-zeros[0]!, '35.5 dB')
    expectWritten(poles[0]!, '35.5 dB')
  })

  // ---- the bell -------------------------------------------------------------------------------

  it('measures a +6 dB bell at 1 kHz as +6.00 dB at 1 kHz, whatever its Q (claim bell-centre)', async () => {
    const eq = await lab(NAME)
    expectWritten(gainAt(eq, 'bell', 1000, {}), '+6.00 dB')
    expectWritten(gainAt(eq, 'bell', 1000, { bellQ: 0.7 }), '+6.00 dB')
    expectWritten(gainAt(eq, 'bell', 1000, { bellQ: 10 }), '+6.00 dB')
  })

  it('leaves 0.11 dB two octaves either side of that bell at Q 2, at 250 Hz and 4 kHz (claim bell-two-octaves) and 0.8 dB at Q 0.7 (claim bell-two-octaves-broad)', async () => {
    const eq = await lab(NAME)
    for (const hz of [250, 4000]) {
      expectWritten(gainAt(eq, 'bell', hz, {}), '0.11 dB')
      expectWritten(gainAt(eq, 'bell', hz, { bellQ: 0.7 }), '0.8 dB')
    }
  })

  it('is half its decibels up at 781 Hz and 1,280 Hz at Q 2, and the centre over the distance between them is that Q (claim bell-width)', async () => {
    const eq = await lab(NAME)
    const roots = eq.render(short(), {}).taps.bellRoots!.channels_data[0]!
    const curve = (hz: number) => fromRoots(roots, hz).db
    const lo = crossing(curve, 500, 1000, 3)
    const hi = crossing(curve, 1000, 2000, 3)
    expectWritten(lo, '781 Hz')
    expectWritten(hi, '1,280 Hz')
    expectWritten(1000 / (hi - lo), '2.0')
    // Steady tones through the bell say the same.
    expectWritten(gainAt(eq, 'bell', lo, {}), '+3.00 dB')
    expectWritten(gainAt(eq, 'bell', hi, {}), '+3.00 dB')
  })

  it('undoes a boost with the same cut: the two curves add to 0 dB within 0.001 dB everywhere (claim bell-mirror)', async () => {
    const eq = await lab(NAME)
    const up = eq.render(short(), { bellGain: 6 }).taps.bellResponse!.channels_data[0]!
    const down = eq.render(short(), { bellGain: -6 }).taps.bellResponse!.channels_data[0]!
    let worst = 0
    up.forEach((v, p) => (worst = Math.max(worst, Math.abs(v + down[p]!))))
    expectWritten(worst, 'less than 0.001 dB')
  })

  // ---- shelves and cuts -----------------------------------------------------------------------

  it('lifts +3.00 dB at 120 Hz with Low at +6, +5.63 dB an octave under and +0.37 dB an octave over (claim shelf-low)', async () => {
    const eq = await lab(NAME)
    const values = { ...wire, low: 6 }
    expectWritten(gainAt(eq, 'afterLow', 120, values), '+3.00 dB')
    expectWritten(gainAt(eq, 'afterLow', 60, values), '+5.63 dB')
    expectWritten(gainAt(eq, 'afterLow', 240, values), '+0.37 dB')
    expectWritten(gainAt(eq, 'afterLow', 30, values), '+5.99 dB')
  })

  it('lifts +3.00 dB at 9 kHz with Air at +6 and +5.99 dB at 20 kHz (claim shelf-air)', async () => {
    const eq = await lab(NAME)
    const values = { ...wire, air: 6 }
    expectWritten(gainAt(eq, 'afterAir', 9000, values), '+3.00 dB')
    expectWritten(gainAt(eq, 'afterAir', 20000, values), '+5.99 dB')
    expectWritten(gainAt(eq, 'afterAir', 4500, values), '+0.26 dB')
  })

  it('draws shelves with no bump: at +12 dB neither rises above 12 dB nor dips under 0 (claim shelf-flat-top)', async () => {
    const eq = await lab(NAME)
    const { taps } = eq.render(short(), { low: 12, air: 12 })
    for (const id of ['respLow', 'respAir']) {
      const curve = taps[id]!.channels_data[0]!
      expectWritten(highest(curve), 'at most 12 dB')
      expect(highest(curve)).toBeGreaterThan(11.9)
      expect(lowest(curve)).toBeGreaterThan(-0.001)
    }
  })

  it('is 3.01 dB down at 100 Hz with the Low cut there, and 24.1 dB down at 50 Hz, an octave under (claim low-cut)', async () => {
    const eq = await lab(NAME)
    const values = { ...wire, lowCut: 100 }
    expectWritten(-gainAt(eq, 'afterLowCut', 100, values), '3.01 dB')
    expectWritten(-gainAt(eq, 'afterLowCut', 50, values), '24.1 dB')
    expect(gainAt(eq, 'afterLowCut', 200, values)).toBeGreaterThan(-0.05)
  })

  it('is 3.01 dB down at the High cut; an octave over it 12.4 dB down when set to 1 kHz and 14.3 dB down when set to 5 kHz, where the formula gives 12.3 dB for both (claim high-cut)', async () => {
    const eq = await lab(NAME)
    expectWritten(-gainAt(eq, 'afterHighCut', 5000, { ...wire, highCut: 5000 }), '3.01 dB')
    expectWritten(-gainAt(eq, 'afterHighCut', 10000, { ...wire, highCut: 5000 }), '14.3 dB')
    expectWritten(-gainAt(eq, 'afterHighCut', 1000, { ...wire, highCut: 1000 }), '3.01 dB')
    expectWritten(-gainAt(eq, 'afterHighCut', 2000, { ...wire, highCut: 1000 }), '12.4 dB')
    // One over one plus two to the fourth: what the formula gives an octave over any corner.
    expectWritten(10 * Math.log10(1 + 2 ** 4), '12.3 dB')
  })

  it('finds the low cut from two biquads, measured with one sample, 1.1 dB off at 20 Hz when set to 100 Hz, where the curve is 56 dB down, and 0.11 dB off when set to 30 Hz; the pair the device uses lands on the textbook curve (claim cut-forms)', async () => {
    const eq = await lab(NAME)
    const butterworth = (hz: number, corner: number) =>
      -10 * Math.log10(1 + Math.pow(corner / hz, 8))
    const at30 = eq.render(short(), { lowCut: 30 })
    expect(at(at30.taps.respLowCut!, 20)).toBeCloseTo(butterworth(20, 30), 2)
    expectWritten(at(at30.taps.respLowCut!, 20) - at(at30.taps.respCutBiquad!, 20), '0.11 dB')
    const at100 = eq.render(short(), { lowCut: 100 })
    expect(at(at100.taps.respLowCut!, 20)).toBeCloseTo(butterworth(20, 100), 2)
    expectWritten(-at(at100.taps.respLowCut!, 20), '56 dB')
    expectWritten(at(at100.taps.respLowCut!, 20) - at(at100.taps.respCutBiquad!, 20), '1.1 dB')
    expectWritten(at100.checks.cutForms!, '1.1 dB')
  })

  it('finds the two forms of the low cut less than 0.02 dB apart on a steady tone at 20 Hz, set to 30 Hz and set to 100 Hz (claim cut-tone)', async () => {
    const eq = await lab(NAME)
    // Step 4 of the build has the cuts as biquads and step 5 as the device has them.
    for (const lowCut of [30, 100]) {
      const values = { ...wire, lowCut }
      const biquads = gainAt(eq, 'built', 20, { ...values, build: 3 })
      const device = gainAt(eq, 'built', 20, { ...values, build: 4 })
      expectWritten(Math.abs(biquads - device), 'less than 0.02 dB')
      expect(device).toBeCloseTo(gainAt(eq, 'afterLowCut', 20, values), 6)
    }
  })

  it('lays that difference to rounding in the memories: the same two biquads with memories of twice the digits land less than 0.02 dB from the formula at 20 Hz, set to 100 Hz and set to 30 Hz (claim cut-rounding)', async () => {
    const eq = await lab(NAME)
    const butterworth = (hz: number, corner: number) =>
      -10 * Math.log10(1 + Math.pow(corner / hz, 8))
    for (const [corner, off] of [
      [100, '1.1 dB'],
      [30, '0.11 dB'],
    ] as const) {
      // Worked here in single precision, the pair is the lab's, and as far off as the lab's.
      const single = cutPairAt20(corner, Math.fround)
      const { taps } = eq.render(short(), { lowCut: corner })
      expect(Math.abs(single - at(taps.respCutBiquad!, 20))).toBeLessThan(0.005)
      expectWritten(butterworth(20, corner) - single, off)
      // With nothing rounded but the five numbers, it is on the formula.
      const double = cutPairAt20(corner, (v) => v)
      expectWritten(Math.abs(double - butterworth(20, corner)), 'less than 0.02 dB')
    }
  })

  // ---- bands in a row -------------------------------------------------------------------------

  it('reads Body at −5 as −5.00 dB at 320 Hz and −2.38 dB an octave either side (claim body-centre)', async () => {
    const eq = await lab(NAME)
    const values = { ...wire, body: -5 }
    expectWritten(gainAt(eq, 'afterBody', 320, values), '−5.00 dB')
    expectWritten(gainAt(eq, 'afterBody', 160, values), '−2.38 dB')
    expectWritten(gainAt(eq, 'afterBody', 640, values), '−2.38 dB')
  })

  it('measures the device less than 0.02 dB from its bands added where the page starts, wherever the curve is above −20 dB, and less than 0.2 dB from them at settings picked at random (claim curves-add)', async () => {
    const eq = await lab(NAME)
    expectWritten(eq.render(short(), {}).checks.curveError!, 'less than 0.02 dB')
    const hard = {
      lowCut: 210.23973449101436,
      highCut: 15481.723054316273,
      low: 11.653494464152843,
      body: 10.140907102762931,
      presence: -5.573974464455148,
      air: -3.1010783629261613,
    }
    const tried: Record<string, number>[] = [
      wire,
      { lowCut: 500, highCut: 1000 },
      { lowCut: 100, low: 12, air: 12 },
      { lowCut: 500, highCut: 1000, low: -12, body: -12, presence: -12, air: -12 },
      { lowCut: 20.5, highCut: 19000, low: 12, body: 12, presence: 12, air: 12 },
      { lowCut: 133, highCut: 4376, low: -7.8, body: -1.6, presence: -7.7, air: -12 },
      { lowCut: 251, highCut: 17593, low: -4.2, body: 9.2, presence: -7, air: -5.3 },
      { lowCut: 50, highCut: 12674, low: 7.5, body: 11.6, presence: 10.9, air: -11.3 },
      // The furthest apart of 2,500 settings picked at random: a low cut 30 dB down at 89 Hz,
      // and Low and Body lifting the curve back over −20 dB there.
      hard,
    ]
    // A few hundred more, picked by a generator that gives the same ones on every run. One
    // control in seven is put at an end of its range, where the device takes it out of circuit.
    let state = 20261016
    const random = () => {
      state ^= state << 13
      state ^= state >>> 17
      state ^= state << 5
      return (state >>> 0) / 0xffffffff
    }
    const gain = () => (random() < 0.15 ? (random() < 0.5 ? -12 : 12) : -12 + 24 * random())
    for (let n = 0; n < 300; n += 1) {
      tried.push({
        lowCut: 20 * Math.pow(25, random() < 0.1 ? 0 : random()),
        highCut: 1000 * Math.pow(20, random() < 0.1 ? 1 : random()),
        low: gain(),
        body: gain(),
        presence: gain(),
        air: gain(),
      })
    }
    for (const values of tried) {
      expectWritten(eq.render(short(), values).checks.curveError!, 'less than 0.2 dB')
    }
    // The bound is not slack by ten times: the hard setting is over 0.05 dB apart.
    expect(eq.render(short(), hard).checks.curveError).toBeGreaterThan(0.05)
  })

  it("builds the chain from the kit's filters to the very samples the device made (claim rebuilt)", async () => {
    const eq = await lab(NAME)
    const drums = await benchSource('drums', seconds(4))
    const start = eq.render(drums, {})
    expect(start.checks.rebuilt).toBe(-140)
    const chords = await benchSource('chords', seconds(4))
    const busy = { lowCut: 250, highCut: 3000, low: -8, body: 9, presence: -7, air: 5 }
    const worked = eq.render(chords, busy)
    expect(worked.checks.rebuilt).toBe(-140)
    // The floor of the check is not yet proof. With Clear at 0 nothing follows the six bands,
    // so the device's output is their end, and the copy's last tap holds the same samples.
    expect(sameSamples(start, 'afterHighCut', 'out')).toBe(true)
    expect(sameSamples(worked, 'afterHighCut', 'out')).toBe(true)
    expect(sameSamples(worked, 'afterAir', 'out')).toBe(false)
    // With Clear cutting, the chain still matches what the device hands to Clear.
    expect(eq.render(drums, { clear: 1 }).checks.rebuilt).toBe(-140)
  })

  it('is the input, sample for sample, with every band at 0 dB, both cuts at their stops and Clear at 0 (claim flat-is-wire)', async () => {
    const eq = await lab(NAME)
    const drums = await benchSource('drums', seconds(4))
    const { taps } = eq.render(drums, wire)
    for (const c of [0, 1]) {
      const dry = taps.in!.channels_data[c]!
      expect(taps.out!.channels_data[c]!.every((v, i) => v === dry[i])).toBe(true)
    }
  })

  // ---- phase ----------------------------------------------------------------------------------

  it('turns the phase 19.4 degrees forward at 781 Hz and 19.4 degrees back at 1,280 Hz for the +6 dB bell, nothing at its centre, and 36.8 degrees at +12 dB (claim bell-phase)', async () => {
    const eq = await lab(NAME)
    const { taps } = eq.render(short(), {})
    const roots = taps.bellRoots!.channels_data[0]!
    const forward = greatest((hz) => fromRoots(roots, hz).degrees, 400, 1000)
    const back = greatest((hz) => -fromRoots(roots, hz).degrees, 1000, 2500)
    expectWritten(forward.value, '19.4 degrees')
    expectWritten(forward.hz, '781 Hz')
    expectWritten(back.value, '19.4 degrees')
    expectWritten(back.hz, '1,280 Hz')
    expect(Math.abs(fromRoots(roots, 1000).degrees)).toBeLessThan(0.05)
    // The phase the lab draws, from the bell's impulse response, is the phase the roots give.
    const phase = taps.bellPhase!
    phase.channels_data[0]!.forEach((v, p) => {
      expect(Math.abs(v - fromRoots(roots, hzOf(phase, p)).degrees)).toBeLessThan(0.01)
    })
    const louder = eq.render(short(), { bellGain: 12 }).taps.bellRoots!.channels_data[0]!
    expectWritten(greatest((hz) => fromRoots(louder, hz).degrees, 400, 1000).value, '36.8 degrees')
  })

  it('rings for 6.4 ms after a +12 dB bell at 1 kHz and Q 10 (claim ring-boost) and 1.6 ms after the −12 dB one (claim ring-cut)', async () => {
    const eq = await lab(NAME)
    const boost = eq.render(short(), { bellQ: 10, bellGain: 12 })
    expectWritten(ringMs(boost), '6.4 ms')
    const cut = eq.render(short(), { bellQ: 10, bellGain: -12 })
    expectWritten(ringMs(cut), '1.6 ms')
    // The distance of the poles from the centre says the same: what is left after each sample.
    expectWritten(-1000 / (RATE * Math.log(boost.checks.poleRadius!)), '6.4 ms')
    expectWritten(-1000 / (RATE * Math.log(cut.checks.poleRadius!)), '1.6 ms')
  })

  // ---- Clear ----------------------------------------------------------------------------------

  it('cuts a tone that stands out of a bed of noise by 12 dB at Clear 1 and no further (claim clear-cap), and by 4.8 dB at Clear 0.4 (claim clear-share)', async () => {
    const eq = await lab(NAME)
    const source = toneOnNoise(0.2, 0.16)
    const full = eq.render(source, { ...wire, clear: 1 })
    expectWritten(-lowest(tap(full, 'clearDepth')), '12 dB')
    expect(lowest(tap(full, 'clearDepth'))).toBeGreaterThanOrEqual(-12)
    expect(lowest(tap(full, 'clearDepth'))).toBeLessThan(-11.9)
    // The cut is a bell one band wide: deep at the tone, 0.35 dB an octave either side.
    expect(at(full.taps.respClear!, 1000)).toBeLessThan(-11)
    expect(at(full.taps.respClear!, 500)).toBeGreaterThan(-0.5)
    expect(at(full.taps.respClear!, 2000)).toBeGreaterThan(-0.5)
    const part = eq.render(source, { ...wire, clear: 0.4 })
    expectWritten(-lowest(tap(part, 'clearDepth')), '4.8 dB')
  })

  it('waits before it cuts: when a tone and a bed of noise start together out of silence, with Clear time at 0.2 s the cut first moves 0.3 s after they start and is 63 % of the way down after 0.5 s; with Clear time at 1.5 s, after 1.7 s (claim clear-onset)', async () => {
    const eq = await lab(NAME)
    // Three seconds of silence, in which the device lets go and falls asleep, then the tone in noise.
    const frames = seconds(8)
    const from = seconds(3)
    const source = toneOnNoise(0.2, 0.16, frames, from)
    const onset = (clearTime: number) => {
      const depth = tap(eq.render(source, { ...wire, clear: 1, clearTime }, frames), 'clearDepth')
      const start = Math.round((from / RATE) * POINT_RATE)
      expect(depth[start - 1]).toBe(0)
      const deepest = lowest(depth)
      let moves = start
      while (moves < depth.length && depth[moves]! > -0.1) moves += 1
      let most = start
      while (most < depth.length && depth[most]! > deepest * (1 - Math.exp(-1))) most += 1
      return { moves: (moves - start) / POINT_RATE, most: (most - start) / POINT_RATE }
    }
    const quick = onset(0.2)
    expectWritten(quick.moves, '0.3 s')
    expectWritten(quick.most, '0.5 s')
    expectWritten(onset(1.5).most, '1.7 s')
  })

  it('moves a cut a fixed share of the way each time it listens: asked for 12 dB at once with Clear time at 0.2 s, the cut is 63 % of the way down after 0.2 s and takes 0.4 s to come 63 % of the way back (claim clear-glide)', async () => {
    const eq = await lab(NAME)
    const glide = eq.render(short(), {}).taps.clearGlide!
    const data = glide.channels_data[0]!
    const perSecond = (data.length - 1) / glide.x1
    const share = 1 - Math.exp(-1)
    let down = 0
    while (data[down]! > -12 * share) down += 1
    expectWritten((down + 1) / perSecond, '0.2 s')
    const half = Math.ceil(data.length / 2)
    expectWritten(-data[half - 1]!, '12 dB')
    let back = half
    while (data[back]! < data[half - 1]! * (1 - share)) back += 1
    expectWritten((back - half + 1) / perSecond, '0.4 s')
    expect(data.at(-1)).toBe(0)
    // A longer Clear time is a slower cut.
    const slow = eq.render(short(), { clearTime: 1.5 }).taps.clearGlide!.channels_data[0]!
    expect(slow[down]!).toBeGreaterThan(-3)
  })

  it('draws the band that is cut above the line it must pass, and no band above it in plain noise', async () => {
    const eq = await lab(NAME)
    const cut = eq.render(toneOnNoise(0.2, 0.16), { ...wire, clear: 1 }).taps
    expect(at(cut.bandPower!, 1000) - at(cut.bandMargin!, 1000)).toBeGreaterThan(12)
    expect(at(cut.bandPower!, 400) - at(cut.bandMargin!, 400)).toBeLessThan(0)
    const plain = eq.render(noise(0.2, seconds(4)), { ...wire, clear: 1 }).taps
    const heard = plain.bandPower!.channels_data[0]!
    const line = plain.bandMargin!.channels_data[0]!
    expect(heard.every((v, p) => v < line[p]!)).toBe(true)
  })

  it('leaves a lone note alone at Clear 1: a sine, a saw and plain noise are cut by exactly 0 dB (claim clear-lone-note)', async () => {
    const eq = await lab(NAME)
    const rendered: Record<string, RenderResult> = {}
    for (const id of ['sine', 'saw', 'noise']) {
      const source = await benchSource(id, seconds(4))
      rendered[id] = eq.render(source, { clear: 1 })
      expect(tap(rendered[id]!, 'clearDepth').every((v) => v === 0)).toBe(true)
    }
    // Why, for each. The device calls a band lit when it is within 25 dB of the loudest, and
    // wants more than three of them before there is a bed at all.
    const lit = (id: string) => {
      const bands = heardBands(rendered[id]!)
      const loudest = Math.max(...bands.map((one) => one.power))
      return bands.filter((one) => one.power >= loudest - 25)
    }
    // The sine is one note: no bed.
    expect(lit('sine').length).toBeLessThanOrEqual(3)
    // The saw is a bed. Its one band over its line is the band of its lowest note, 110 Hz,
    // and no band under that one holds sound within 25 dB of it.
    expect(lit('saw').length).toBeGreaterThanOrEqual(8)
    const saw = heardBands(rendered.saw!)
    const over = saw.filter((one) => one.power > one.line)
    expect(over.length).toBe(1)
    expect(over[0]!.from).toBeLessThan(110)
    expect(over[0]!.to).toBeGreaterThan(110)
    for (const one of saw.filter((other) => other.to < over[0]!.from))
      expect(one.power).toBeLessThan(over[0]!.power - 25)
    // Plain noise is a bed with no band over its line.
    expect(lit('noise').length).toBeGreaterThanOrEqual(8)
    expect(heardBands(rendered.noise!).every((one) => one.power < one.line)).toBe(true)
  })

  it('finds 1.1 dB to cut in the drum loop at Clear 1 and the starting settings, near 107 Hz (claim clear-on-drums)', async () => {
    const eq = await lab(NAME)
    const drums = await benchSource('drums', seconds(4))
    const { taps } = eq.render(drums, { clear: 1 })
    expectWritten(-lowest(taps.clearDepth!.channels_data[0]!), '1.1 dB')
    expectWritten(bottomHz(taps.respClear!), '107 Hz')
  })

  // ---- part 6: ways to use it -----------------------------------------------------------------

  it('leaves room with a cut where boosts use it up: on the mix, Low and Air at +5 dB bring the loudest sample 2.9 dB nearer full scale and Body at −5 dB takes it 1.2 dB further off (claim way-cut)', async () => {
    const eq = await lab(NAME)
    const cut = await played(eq, 'cutfirst')
    expectWritten(topOf(cut, 'in') - topOf(cut, 'out'), '1.2 dB')
    const boosted = await played(eq, 'cutfirst', { body: 0, low: 5, air: 5 })
    expectWritten(topOf(boosted, 'out') - topOf(boosted, 'in'), '2.9 dB')
  })

  it('clears the bottom of the strummed guitar without touching the rest: with the Low cut at 100 Hz what lies from 20 to 60 Hz comes out 14.8 dB lower and the loop 0.2 dB quieter (claim way-bottom)', async () => {
    const eq = await lab(NAME)
    const result = await played(eq, 'bottom')
    expectWritten(-bandOver(eq, 20, 60), '14.8 dB')
    expectWritten(levelOf(result, 'in') - levelOf(result, 'out'), '0.2 dB')
    expect(Math.abs(bandOver(eq, 150, 20000))).toBeLessThan(0.02)
  })

  it('takes less of the neighbours with a narrow cut: a bell at 320 Hz, −9 dB and Q 4 brings 200 to 500 Hz of the mix down 2.5 dB and 40 to 100 Hz down 0.0 dB (claim way-narrow)', async () => {
    const eq = await lab(NAME)
    await played(eq, 'narrow')
    expectWritten(-bandOver(eq, 200, 500, 'bell'), '2.5 dB')
    expectWritten(-bandOver(eq, 40, 100, 'bell'), '0.0 dB')
  })

  it('finds 1.5 dB to cut in the pad with Clear at 1, in one band between 200 and 300 Hz (claim way-clear)', async () => {
    const eq = await lab(NAME)
    const { taps } = await played(eq, 'ride')
    expectWritten(-lowest(taps.clearDepth!.channels_data[0]!), '1.5 dB')
    const where = bottomHz(taps.respClear!)
    expect(where).toBeGreaterThan(200)
    expect(where).toBeLessThan(300)
    // One band: the curve of all its cuts has one dip deeper than a tenth of a decibel.
    expect(dips(taps.respClear!, 0.1)).toBe(1)
  })

  // ---- part 7: what goes wrong ----------------------------------------------------------------

  it('goes over full scale with two boosts: Low and Air at +12 dB put the loudest sample of the mix 3.6 dB over full scale, where it went in 4.4 dB under (claim fault-over)', async () => {
    const eq = await lab(NAME)
    const result = await played(eq, 'over')
    expectWritten(topOf(result, 'out'), '3.6 dB')
    expectWritten(-topOf(result, 'in'), '4.4 dB')
  })

  it('thins the mix when too much is cut away: 40 to 100 Hz comes out 44 dB lower and the loop 7.3 dB quieter (claim fault-thin)', async () => {
    const eq = await lab(NAME)
    const result = await played(eq, 'thin')
    expectWritten(-bandOver(eq, 40, 100), '44 dB')
    expectWritten(levelOf(result, 'in') - levelOf(result, 'out'), '7.3 dB')
  })

  it('squeezes a bell near half the sample rate: half an octave over its centre a +6 dB bell of Q 2 holds 2.02 dB at 1 kHz and 0.62 dB at 12 kHz, and an octave over, 0.63 dB and exactly nothing (claim cramp)', async () => {
    const eq = await lab(NAME)
    const { taps } = eq.render(short(), {})
    expectWritten(at(taps.bellAtOne!, 0.5), '2.02 dB')
    expectWritten(at(taps.bellHigh!, 0.5), '0.62 dB')
    expectWritten(at(taps.bellAtOne!, 1), '0.63 dB')
    expect(Math.abs(at(taps.bellHigh!, 1))).toBeLessThan(0.001)
    // The side under the centre narrows too.
    expectWritten(at(taps.bellAtOne!, -1), '0.63 dB')
    expectWritten(at(taps.bellHigh!, -1), '0.38 dB')
    // The picture's caption: at Q 0.7 the two lines are further apart than at Q 2, on both sides.
    const broad = eq.render(short(), { bellQ: 0.7 }).taps
    for (const octaves of [-1, 0.5]) {
      const apart = at(taps.bellAtOne!, octaves) - at(taps.bellHigh!, octaves)
      expect(at(broad.bellAtOne!, octaves) - at(broad.bellHigh!, octaves)).toBeGreaterThan(
        apart + 0.4,
      )
    }
  })

  it('leaves Presence at +6 lopsided by 0.14 dB: 2.81 dB at 1.5 kHz and 2.67 dB at 6 kHz (claim presence-lopsided)', async () => {
    const eq = await lab(NAME)
    const values = { ...wire, presence: 6 }
    expectWritten(gainAt(eq, 'afterPresence', 3000, values), '+6.00 dB')
    const under = gainAt(eq, 'afterPresence', 1500, values)
    const over = gainAt(eq, 'afterPresence', 6000, values)
    expectWritten(under, '2.81 dB')
    expectWritten(over, '2.67 dB')
    expectWritten(under - over, '0.14 dB')
  })

  it('leaves a floor of rounding under one loud sample: with the Low cut at 500 Hz and the four bands where the page starts them the device measures −70 dB at 44 Hz that way where its bands add to −81 dB, and a steady tone there comes out at −81 dB (claim rounding-floor)', async () => {
    const eq = await lab(NAME)
    const { taps } = eq.render(short(), { lowCut: 500 })
    expectWritten(at(taps.curveDevice!, 44), '−70 dB')
    expectWritten(at(taps.curveSum!, 44), '−81 dB')
    expectWritten(gainAt(eq, 'out', 44, { lowCut: 500 }), '−81 dB')
    // With no biquad in circuit there is no floor: the low cut alone goes all the way down.
    const bare = eq.render(short(), { ...wire, lowCut: 500 }).taps
    expect(Math.abs(at(bare.curveDevice!, 44) - at(bare.curveSum!, 44))).toBeLessThan(0.1)
    // The Low shelf alone makes the floor; Presence and Air alone do not.
    const lowOnly = eq.render(short(), { ...wire, lowCut: 500, low: 4 }).taps
    expect(at(lowOnly.curveDevice!, 44)).toBeGreaterThan(-72)
    expect(at(lowOnly.curveSum!, 44)).toBeLessThan(-79)
    const highOnly = eq.render(short(), { ...wire, lowCut: 500, presence: 5, air: 3 }).taps
    expect(Math.abs(at(highOnly.curveDevice!, 44) - at(highOnly.curveSum!, 44))).toBeLessThan(0.3)
  })

  // ---- part 8: misconceptions -----------------------------------------------------------------

  it('adds less to the whole than the control says: Presence at +6 dB makes the mix 0.2 dB louder over the loop, and Body at +6 dB makes it 2.4 dB louder (claim boost-adds)', async () => {
    const eq = await lab(NAME)
    const mix = await benchSource('mix', seconds(4))
    const louder = (values: Record<string, number>) => {
      const result = eq.render(mix, { ...wire, ...values })
      return levelOf(result, 'out') - levelOf(result, 'in')
    }
    expectWritten(louder({ presence: 6 }), '0.2 dB')
    expectWritten(louder({ body: 6 }), '2.4 dB')
  })

  // ---- the settings file ----------------------------------------------------------------------

  it('renders every named set on its own source and tap: what plays is sound, and no louder than 4 dB over full scale', async () => {
    const eq = await lab(NAME)
    for (const [name, set] of Object.entries(settings.sets)) {
      const { tap: sounding } = resolveSet(eq.description, set)
      const result = await played(eq, name)
      const heard = tap(result, sounding ?? 'out')
      expect(
        heard.every((v) => Number.isFinite(v)),
        name,
      ).toBe(true)
      expect(rms(heard), name).toBeGreaterThan(0.001)
      expect(gainToDb(peak(heard)), name).toBeLessThan(4)
    }
    // The set that plays the mix as it is leaves it alone: its tap is the input.
    expect(settings.sets.mix!.tap).toBe('in')
    // The two bell sets name the bell's controls and play its tap.
    for (const name of ['find', 'narrow', 'ring']) expect(settings.sets[name]!.tap).toBe('bell')
  })

  it("starts the page's device table from the device's own defaults: the settings file's defaults are device.json's, and the lab's other controls are the one bell's", async () => {
    const eq = await lab(NAME)
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/ambient-eq/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number; min: number; max: number }[] }
    expect(settings.defaults!.values).toEqual(
      Object.fromEntries(device.params.map((one) => [one.key, one.default])),
    )
    // Every parameter of the device is a control of the lab, with the device's range.
    for (const param of device.params) {
      const control = eq.description.controls.find((one) => one.id === param.key)!
      expect(control.min, param.key).toBeCloseTo(param.min, 6)
      expect(control.max, param.key).toBeCloseTo(param.max, 6)
    }
    const { values } = resolveSet(eq.description, { values: settings.defaults!.values })
    expect(Object.keys(values).filter((id) => !(id in settings.defaults!.values))).toEqual([
      'bellHz',
      'bellGain',
      'bellQ',
    ])
  })
})
