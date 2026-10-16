import fs from 'node:fs'
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
  RATE,
  rms,
  seconds,
  sine,
} from './support.ts'

const NAME = 'plate-reverb'

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings(NAME)!

/** The six loops of the home map: the tile is heard on each. */
const LOOPS = ['drums', 'guitar', 'chords', 'bass', 'pad', 'mix']

/** The build's steps, by the number the `build` control gives each. */
const STEP = { gap: 0, diffuse: 1, loop: 2, cross: 3, damp: 4, read: 5, move: 6, mix: 7 }

const tap = (result: RenderResult, id: string, channel = 0) =>
  result.taps[id]!.channels_data[channel]!
/** A stretch of sound's level, in dB against full scale. */
const levelOf = (x: Float32Array, from = 0, to = x.length) => gainToDb(rms(x, from, to))
/** A tap's level over the loop and both of its sides, in dB against full scale. */
const levelOfBoth = (result: RenderResult, id: string) =>
  gainToDb(Math.hypot(rms(tap(result, id, 0)), rms(tap(result, id, 1))) / Math.SQRT2)
const ms = (samples: number) => (samples * 1000) / RATE

/** A named set's values and source, filled in as the page fills them in. */
function setOf(plate: Lab, name: string) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  return resolveSet(plate.description, set)
}

/** A named set as its card plays it: on its own source, with `over` laid on its values. */
async function played(plate: Lab, name: string, over: Record<string, number> = {}) {
  const { values, source } = setOf(plate, name)
  return plate.render(await benchSource(source!, seconds(4)), { ...values, ...over })
}

/** The place of the first sample that is not silence. */
const firstSound = (x: Float32Array) => x.findIndex((v) => Math.abs(v) > 1e-6)

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

/** The pictures of the input stages start 2 ms, 96 samples, before the sample arrives. */
const LEAD = 96

/**
 * Echoes in the 10 ms of a response that start at `from`, counted here as the lab counts them:
 * samples larger in size than both neighbours and within 60 dB of the largest of the same 10 ms.
 * `within` draws that line somewhere else.
 */
function echoesIn(h: Float32Array, from: number, within = 60): number {
  let top = 0
  for (let i = from; i < from + 480; i += 1) top = Math.max(top, Math.abs(h[i]!))
  const floor = top * 10 ** (-within / 20)
  let count = 0
  for (let i = from; i < from + 480; i += 1) {
    const here = Math.abs(h[i]!)
    const before = i > 0 ? Math.abs(h[i - 1]!) : 0
    const after = Math.abs(h[i + 1] ?? 0)
    if (here > floor && here > before && here >= after) count += 1
  }
  return count
}

type Curve = { channels_data: Float32Array[]; x0: number; x1: number }

/** When a curve that only falls first stands at `level`, by a straight line between its points. */
function timeDown(curve: Curve, level: number): number {
  const data = curve.channels_data[0]!
  const p = data.findIndex((v) => v <= level)
  const part = (data[p - 1]! - level) / (data[p - 1]! - data[p]!)
  return curve.x0 + ((p - 1 + part) * (curve.x1 - curve.x0)) / (data.length - 1)
}

/** The time to fall 60 dB that a stretch of the lab's decay curve gives, from `top` dB to `bottom` dB. */
const fallOver = (curve: Curve, top: number, bottom: number) =>
  (60 / (top - bottom)) * (timeDown(curve, bottom) - timeDown(curve, top))

/** The level, in dB, of each 100 ms of a signal. */
function levels(x: Float32Array): number[] {
  const out: number[] = []
  for (let from = 0; from + 4800 <= x.length; from += 4800)
    out.push(gainToDb(rms(x, from, from + 4800)))
  return out
}

/** How far the level of a signal swings, read every 100 ms, in dB. */
const swing = (x: Float32Array) => {
  const read = levels(x)
  return Math.max(...read) - Math.min(...read)
}

/** How alike two signals are, instant for instant: 1 the same, 0 unrelated. */
function likeness(a: Float32Array, b: Float32Array): number {
  let both = 0
  let first = 0
  let second = 0
  for (let i = 0; i < a.length; i += 1) {
    both += a[i]! * b[i]!
    first += a[i]! * a[i]!
    second += b[i]! * b[i]!
  }
  return both / Math.sqrt(first * second)
}

/** Where the quietest stretch of `width` samples of a sound begins, looked for every 10 ms. */
function quietest(x: Float32Array, width: number): number {
  let best = 0
  let least = Infinity
  for (let from = 0; from + width <= x.length; from += 480) {
    const level = rms(x, from, from + width)
    if (level < least) {
      least = level
      best = from
    }
  }
  return best
}

/** A lab's average spectrum, averaged again over the points of the octave round `hz`, in dB. */
function octave(spectrum: Float32Array, hz: number): number {
  let sum = 0
  let count = 0
  for (
    let k = Math.round(hz / Math.SQRT2 / BIN);
    k <= Math.round((hz * Math.SQRT2) / BIN);
    k += 1
  ) {
    sum += 10 ** (spectrum[k]! / 10)
    count += 1
  }
  return 10 * Math.log10(sum / count)
}

/** The lab's curve of the time to fall 60 dB, read at one of its thirteen frequencies. */
function fallAt(result: RenderResult, hz: number): number {
  const curve = result.taps.fallBands!
  const p = Math.round(2 * Math.log2(hz / curve.x0))
  expect(curve.x0 * 2 ** (p / 2), `${hz} Hz is a point of the curve`).toBeCloseTo(hz, 0)
  return curve.channels_data[0]![p]!
}

/**
 * How long a band of the tail's picture stays within 60 dB of its own brightest moment, in
 * seconds after the sample went in: seventeen rows around `hz`, 0.8 kHz in all, added together.
 */
function litFor(
  tail: { channels_data: Float32Array[]; columns: number; x1: number },
  hz: number,
): number {
  const data = tail.channels_data[0]!
  const rows = data.length / tail.columns
  const row = Math.round(hz / (24_000 / (rows - 1)))
  const level: number[] = []
  for (let column = 0; column < tail.columns; column += 1) {
    let power = 0
    for (let k = -8; k <= 8; k += 1) power += 10 ** (data[column * rows + row + k]! / 10)
    level.push(10 * Math.log10(power / 17))
  }
  const brightest = Math.max(...level)
  let last = 0
  level.forEach((v, column) => {
    if (v > brightest - 60) last = column
  })
  return ((last + 1) * tail.x1) / tail.columns
}

describe('plate reverb', () => {
  it('is a sound lab on the clicks: every tap says something, loops, and answers to every control', async () => {
    const plate = await lab(NAME)
    const clicks = await benchSource('clicks', seconds(4))
    const result = plate.render(clicks, {})
    // The lab starts with the tank's delays held still, so their traces are rightly flat.
    expectSoundLab(plate, clicks, result, { quiet: ['wobbleLeft', 'wobbleRight'] })
  })

  it('builds the plate a piece at a time beside the device, and the whole build is the device', async () => {
    const plate = await lab(NAME)
    // The lab starts with the delays still and the plate alone: with them moving and the dry
    // sound let in, the last two pieces have something to change.
    expectBuild(plate, await benchSource('clicks', seconds(4)), { movement: 1, mix: 0.5 })
    expectBuild(plate, await benchSource('drums', seconds(4)), { movement: 1, mix: 0.5 })
  })

  describe('one click, and what a plate makes of it', () => {
    it('answers a click with a tallest sample of 0.096 of its height and at −46.8 dB over the loop (claim click-level), and the drums 26 dB louder (claim drums-level)', async () => {
      const plate = await lab(NAME)
      const answer = async (id: string) =>
        tap(plate.render(await benchSource(id, seconds(4)), {}), 'out')
      const clicks = await answer('clicks')
      expectWritten(peak(clicks), '0.096')
      const level = levelOf(clicks)
      expectWritten(level, '−46.8 dB')
      expectWritten(levelOf(await answer('drums')) - level, '26 dB')
    })

    it('finds the echoes of one delay with feedback 229 samples apart, every 4.8 ms, each three quarters of the last, and 2 or 3 of them in every 10 ms of a second (claim comb-even)', async () => {
      const plate = await lab(NAME)
      const taps = plate.render(click(seconds(1)), {}).taps
      const hit = taps.hitComb!.channels_data[0]!
      const at: number[] = []
      hit.forEach((v, i) => {
        if (v !== 0) at.push(i)
      })
      expect(at[0]).toBe(LEAD)
      for (let k = 1; k < at.length; k += 1) {
        expectWritten(at[k]! - at[k - 1]!, '229 samples')
        expectWritten(ms(at[k]! - at[k - 1]!), '4.8 ms')
        expectWritten(hit[at[k]!]! / hit[at[k - 1]!]!, '0.75')
      }
      const counts = Array.from(taps.densityComb!.channels_data[0]!)
      expect(counts.length).toBe(100)
      expectWritten(Math.min(...counts), '2')
      expectWritten(Math.max(...counts), '3')
    })

    it('counts 1 echo at the output in the first 10 ms after the pre-delay and 105 in the fifth, and from 50 ms on never fewer than 118 in any 10 ms of the first second (claim density-grows)', async () => {
      const plate = await lab(NAME)
      const counts = Array.from(tap(plate.render(click(seconds(1)), {}), 'densityOut'))
      expect(counts.length).toBe(100)
      expectWritten(counts[0]!, '1')
      expectWritten(counts[4]!, '105')
      expectWritten(Math.min(...counts.slice(5)), '118')
      // Up to there each 10 ms holds more than the one before.
      for (let w = 1; w < 6; w += 1) expect(counts[w]!).toBeGreaterThan(counts[w - 1]!)
    })

    it('falls 60 dB in 1.7 s at the left output at the settings the page opens on (claim fall-start); read a decibel higher or a decibel lower it comes out between 1.64 s and 1.72 s (claim fall-read)', async () => {
      const plate = await lab(NAME)
      const result = plate.render(click(seconds(1)), {})
      expectWritten(result.checks.fall!, '1.7 s')
      const curve = result.taps.decayCurve!
      // The lab's reading is the stretch from 5 dB down to 25 dB down.
      expect(fallOver(curve, -5, -25)).toBeCloseTo(result.checks.fall!, 3)
      for (const [top, bottom] of [
        [-4, -24],
        [-6, -26],
      ]) {
        expectWritten(fallOver(curve, top!, bottom!), 'over 1.64 s')
        expectWritten(fallOver(curve, top!, bottom!), 'under 1.72 s')
      }
      // A longer stretch reads longer: the line is steeper at its top than further down.
      expect(fallOver(curve, -5, -35)).toBeGreaterThan(result.checks.fall!)
    })

    it('finds the line of the energy still to come 60 dB down 1.9 s after the click, later than the reading of 1.7 s says (claim fall-whole)', async () => {
      const plate = await lab(NAME)
      const result = plate.render(click(seconds(1)), {})
      const curve = result.taps.decayCurve!
      expect(curve.x0).toBe(0)
      expectWritten(timeDown(curve, -60), '1.9 s')
      expect(timeDown(curve, -60)).toBeGreaterThan(result.checks.fall! + 0.1)
    })

    it('takes 2.1 s to fall 60 dB round 250 Hz, 1.8 s round 4 kHz and 1.2 s round 16 kHz at the settings the page opens on (claim fall-bands), and over the left-hand half goes up as well as down, by less than 0.2 s from one band to the next (claim fall-wander)', async () => {
      const plate = await lab(NAME)
      const result = plate.render(click(seconds(1)), {})
      expectWritten(fallAt(result, 250), '2.1 s')
      expectWritten(fallAt(result, 4000), '1.8 s')
      expectWritten(fallAt(result, 16_000), '1.2 s')
      // Over the right-hand half of the curve, each band falls sooner than the one under it.
      const curve = Array.from(tap(result, 'fallBands'))
      expect(curve.length).toBe(13)
      for (let p = 6; p < 13; p += 1) expect(curve[p]!).toBeLessThan(curve[p - 1]!)
      // Over the left-hand half it goes both ways, a little.
      const steps = curve.slice(1, 6).map((v, p) => v - curve[p]!)
      expect(steps.some((step) => step > 0)).toBe(true)
      expect(steps.some((step) => step < 0)).toBe(true)
      for (const step of steps) expectWritten(Math.abs(step), 'less than 0.2 s')
    })

    it('keeps the picture of the tail within 60 dB of the band’s own brightest moment for 2.2 s round 500 Hz and 1.4 s round 16 kHz, and with Damping at 0.7 for 2.2 s and 1.0 s (claim picture-dark)', async () => {
      const plate = await lab(NAME)
      const start = plate.render(click(seconds(1)), {}).taps.tail!
      expectWritten(litFor(start, 500), '2.2 s')
      expectWritten(litFor(start, 16_000), '1.4 s')
      const damped = plate.render(click(seconds(1)), { damping: 0.7 }).taps.tail!
      expectWritten(litFor(damped, 500), '2.2 s')
      expectWritten(litFor(damped, 16_000), '1.0 s')
      // The picture is the same whatever plays: it is the answer to one sample.
      const onDrums = plate.render(await benchSource('drums', seconds(4)), {}).taps.tail!
      expect(Array.from(onDrums.channels_data[0]!)).toEqual(Array.from(start.channels_data[0]!))
    })

    it('carries the tail of one pass of the loop into the start of the next: with Decay at 0.9 the first 20 ms stand at −66 dB before the plate has answered, and at 0.5 under −150 dB (claim second-pass)', async () => {
      const plate = await lab(NAME)
      // One click and four seconds: nothing answers it until the pre-delay and 428 samples more.
      const source = click(seconds(4))
      const long = tap(plate.render(source, { decay: 0.9 }), 'out')
      expectWritten(levelOf(long, 0, seconds(0.02)), '−66 dB')
      const short = tap(plate.render(source, { decay: 0.5 }), 'out')
      expectWritten(levelOf(short, 0, seconds(0.02)), 'under −150 dB')
    })
  })

  describe('the build, a piece at a time', () => {
    /** One click and four seconds of silence through the plate as built up to `step`. */
    const struck = (plate: Lab, step: number, over: Record<string, number> = {}) =>
      plate.render(click(seconds(4)), { ...over, build: step })
    /** The gap is 959 samples: the picture of one click counts its time from the click. */
    const GAP = 959

    it('step 2, four all-passes: 96 echoes in the 10 ms that start 30 ms after the click arrives, the tallest sample 0.22 of the click, and the level over the loop as it was within 0.01 dB (claim build-diffuse); without the piece there is one sample and no echo', async () => {
      const plate = await lab(NAME)
      const hit = tap(struck(plate, STEP.diffuse), 'builtHit')
      expect(firstSound(hit)).toBe(GAP)
      const echoes = echoesIn(hit, GAP + seconds(0.03))
      expectWritten(echoes, '96')
      expectWritten(peak(hit), '0.22')
      const before = tap(struck(plate, STEP.gap), 'builtHit')
      expect(echoesIn(before, GAP + seconds(0.03))).toBe(0)
      expect(matchesWritten(peak(before), '0.22')).toBe(false)
      // One sample, and under it the trace of the filter after the gap, 66 dB down.
      expect(before.filter((v) => Math.abs(v) > 0.001).length).toBe(1)
      // An all-pass keeps every frequency's level, so the click's energy is all still there.
      const kept = levelOf(hit) - levelOf(before)
      expectWritten(Math.abs(kept), 'less than 0.01 dB')
    })

    it('step 3, one loop: the click comes round 275 ms after it arrived, and from 0.5 s to 1 s after the click the sound stands at −65 dB (claim build-loop); without the piece nothing comes round and that stretch holds −185 dB, the all-passes ringing down', async () => {
      const plate = await lab(NAME)
      const looped = tap(struck(plate, STEP.loop), 'builtHit')
      // With Decay at 0 nothing comes back: what differs from that is what came round.
      const once = tap(struck(plate, STEP.loop, { decay: 0 }), 'builtHit')
      const round = looped.findIndex((v, i) => Math.abs(v - once[i]!) > 1e-9)
      expectWritten(ms(round - GAP), '275 ms')
      const level = levelOf(looped, seconds(0.5), seconds(1))
      expectWritten(level, '−65 dB')

      const before = tap(struck(plate, STEP.diffuse), 'builtHit')
      const beforeOnce = tap(struck(plate, STEP.diffuse, { decay: 0 }), 'builtHit')
      expect(before.findIndex((v, i) => Math.abs(v - beforeOnce[i]!) > 1e-9)).toBe(-1)
      // The helper's decibels stop at −180 dB and this is under that, so it is worked out here.
      const beforeLevel = 20 * Math.log10(rms(before, seconds(0.5), seconds(1)))
      expect(matchesWritten(beforeLevel, '−65 dB')).toBe(false)
      expectWritten(beforeLevel, '−185 dB')
    })

    it('step 4, two loops crossed: the two halves are heard with a likeness of 0.62 on a single click and of 0.41 on the drum loop, and what entered the right half reaches the left 248 ms after it arrived (claim build-cross); with one loop the likeness is 1 and the first return comes at 275 ms', async () => {
      const plate = await lab(NAME)
      const crossed = struck(plate, STEP.cross)
      expectWritten(likeness(tap(crossed, 'built', 0), tap(crossed, 'built', 1)), '0.62')
      const hit = tap(crossed, 'builtHit')
      const once = tap(struck(plate, STEP.cross, { decay: 0 }), 'builtHit')
      const round = ms(hit.findIndex((v, i) => Math.abs(v - once[i]!) > 1e-9) - GAP)
      expectWritten(round, '248 ms')

      const before = struck(plate, STEP.loop)
      const alike = likeness(tap(before, 'built', 0), tap(before, 'built', 1))
      expect(matchesWritten(alike, '0.62')).toBe(false)
      expectWritten(alike, '1.00')
      const beforeHit = tap(before, 'builtHit')
      const beforeOnce = tap(struck(plate, STEP.loop, { decay: 0 }), 'builtHit')
      const beforeRound = ms(
        beforeHit.findIndex((v, i) => Math.abs(v - beforeOnce[i]!) > 1e-9) - GAP,
      )
      expect(matchesWritten(beforeRound, '248 ms')).toBe(false)

      const drums = await benchSource('drums', seconds(4))
      const onDrums = (step: number) => {
        const result = plate.render(drums, { build: step })
        return likeness(tap(result, 'built', 0), tap(result, 'built', 1))
      }
      expectWritten(onDrums(STEP.cross), '0.41')
      expectWritten(onDrums(STEP.loop), '1.00')
    })

    it('step 5, damping: from 1 s to 1.5 s after a click the spectrum averaged over the octave round 8 kHz stands 8.4 dB under its average over the octave round 500 Hz with Damping at 0.3 (claim build-damp); without the piece it stands 3.5 dB under', async () => {
      const plate = await lab(NAME)
      const tilt = (step: number) => {
        struck(plate, step)
        const spectrum = plate.spectrum('built', 0, seconds(1), seconds(0.5))
        return octave(spectrum, 500) - octave(spectrum, 8000)
      }
      expectWritten(tilt(STEP.damp), '8.4 dB')
      const before = tilt(STEP.cross)
      expect(matchesWritten(before, '8.4 dB')).toBe(false)
      expectWritten(before, '3.5 dB')
    })

    it('step 6, seven places a side: on a single click the two sides have a likeness under 0.01 and on the drum loop of −0.14, and the left first sounds 428 samples after the gap and the right 568 samples (claim build-read); without the piece the likeness is 0.63 on the click and 0.41 on the drums, and both sides sound as the gap ends', async () => {
      const plate = await lab(NAME)
      const read = struck(plate, STEP.read)
      expectWritten(Math.abs(likeness(tap(read, 'built', 0), tap(read, 'built', 1))), 'under 0.01')
      // Decay at 0.1: nothing of the pass before is left to wrap into the start of this one.
      const quick = struck(plate, STEP.read, { decay: 0.1 })
      expectWritten(firstSound(tap(quick, 'built', 0)) - GAP, '428 samples')
      expectWritten(firstSound(tap(quick, 'built', 1)) - GAP, '568 samples')

      const before = struck(plate, STEP.damp)
      const alike = likeness(tap(before, 'built', 0), tap(before, 'built', 1))
      expect(matchesWritten(Math.abs(alike), 'under 0.01')).toBe(false)
      expectWritten(alike, '0.63')
      const beforeQuick = struck(plate, STEP.damp, { decay: 0.1 })
      expect(firstSound(tap(beforeQuick, 'built', 0)) - GAP).toBe(0)
      expect(firstSound(tap(beforeQuick, 'built', 1)) - GAP).toBe(0)

      const drums = await benchSource('drums', seconds(4))
      const onDrums = (step: number) => {
        const result = plate.render(drums, { build: step })
        return likeness(tap(result, 'built', 0), tap(result, 'built', 1))
      }
      expectWritten(onDrums(STEP.read), '−0.14')
      expectWritten(onDrums(STEP.damp), '0.41')
    })

    it('step 7, movement: a steady 440 Hz tone comes out with a level that swings through 21 dB, and the left half’s first delay grows by up to 19.35 samples (claim build-move); without the piece the level holds within 0.001 dB and the delay does not move', async () => {
      const plate = await lab(NAME)
      const tone = sine(440, 0.25, seconds(8))
      // The lab starts with the delays held still: the piece is the device's movement, let go.
      const moving = plate.render(tone, { movement: 1, build: STEP.move })
      expectWritten(swing(tap(moving, 'built')), '21 dB')
      expectWritten(peak(tap(moving, 'builtSweep').subarray(100)), '19.35 samples')
      const before = plate.render(tone, { movement: 1, build: STEP.read })
      expect(matchesWritten(swing(tap(before, 'built')), '21 dB')).toBe(false)
      expectWritten(swing(tap(before, 'built')), 'less than 0.001 dB')
      expect(tap(before, 'builtSweep').every((v) => v === 0)).toBe(true)
    })

    it('step 8, mix: with every piece the build is the device’s own output, sample for sample, on every loop and at three settings (claim build-same); without the piece it is not', async () => {
      const plate = await lab(NAME)
      const same = (result: RenderResult) =>
        [0, 1].every((channel) => {
          const out = tap(result, 'out', channel)
          return tap(result, 'built', channel).every((v, i) => v === out[i])
        })
      const tried = [
        {},
        { movement: 1, mix: 0.35, decay: 0.7 },
        { movement: 1, mix: 0.5, decay: 0.9, damping: 0.8, predelay: 120 },
      ]
      for (const id of ['clicks', ...LOOPS]) {
        const source = await benchSource(id, seconds(4))
        for (const values of tried) {
          const whole = plate.render(source, { ...values, build: STEP.mix })
          expect(same(whole), `${id} at ${JSON.stringify(values)}`).toBe(true)
          expectWritten(whole.checks.builtDifference!, 'at most −140 dB')
        }
        // With the dry sound let in and no piece to let it in, the build is the plate alone.
        expect(same(plate.render(source, { ...tried[1], build: STEP.move }))).toBe(false)
      }
    })
  })

  describe('the device, stage by stage', () => {
    it('gives a sound that is opposite in the two channels no reverb at all: it takes the mean of the two (claim one-channel)', async () => {
      const plate = await lab(NAME)
      const source = sine(440, 0.5, seconds(1))
      source.right = source.right.map((v) => -v)
      const out = plate.render(source, {})
      expect(tap(out, 'predelayed').every((v) => v === 0)).toBe(true)
      expect(tap(out, 'out').every((v) => v === 0)).toBe(true)
      // The same sound alike in both channels goes in whole.
      const alike = plate.render(sine(440, 0.5, seconds(1)), { predelay: 0 })
      expectWritten(rms(tap(alike, 'predelayed')) / (0.5 / Math.SQRT2), '1.000')
    })

    it('gives a sound on one side alone the reverb it gives the same sound on both sides, 6.0 dB lower: every sample is half (claim one-side)', async () => {
      const plate = await lab(NAME)
      const both = sine(440, 0.5, seconds(1))
      const one = sine(440, 0.5, seconds(1))
      one.right = new Float32Array(one.right.length)
      const whole = plate.render(both, {})
      const half = plate.render(one, {})
      for (const channel of [0, 1]) {
        const full = tap(whole, 'out', channel)
        const sided = tap(half, 'out', channel)
        expectWritten(levelOf(full) - levelOf(sided), '6.0 dB')
        expect(sided.every((v, i) => v === 0.5 * full[i]!)).toBe(true)
      }
    })

    it('lets a sample through 959 samples later at a pre-delay of 20 ms, and at once at 0 ms (claim predelay-one-less)', async () => {
      const plate = await lab(NAME)
      const source = click(seconds(2))
      // Decay at 0.1: nothing of the first pass is left to wrap into the second.
      const at20 = plate.render(source, { decay: 0.1 })
      expectWritten(firstSound(tap(at20, 'predelayed')), '959 samples')
      const at0 = plate.render(source, { decay: 0.1, predelay: 0 })
      expect(firstSound(tap(at0, 'predelayed'))).toBe(0)
      const at250 = plate.render(source, { decay: 0.1, predelay: 250 })
      expect(firstSound(tap(at250, 'predelayed'))).toBe(11_999)
    })

    it('takes 0.008 dB off a 20 kHz tone in the bandwidth filter (claim bandwidth-loss)', async () => {
      const plate = await lab(NAME)
      const out = plate.render(sine(20_000, 0.5, seconds(1)), {})
      const loss = gainToDb(rms(tap(out, 'predelayed')) / rms(tap(out, 'filtered')))
      expectWritten(loss, '0.008 dB')
      // The lab's own figure for it, from the filter's answer to one sample.
      expectWritten(out.checks.bandwidthLoss!, '0.008 dB')
    })

    it('turns one sample into −0.75 and then echoes of 0.44, 0.33 and 0.25, each 229 samples after the last, in its first all-pass (claim allpass-echoes)', async () => {
      const plate = await lab(NAME)
      const hit = tap(plate.render(click(seconds(1)), {}), 'hit1')
      expect(hit.subarray(0, LEAD).every((v) => v === 0)).toBe(true)
      // The echoes are the samples that stand over a hundredth: between them is the bandwidth
      // filter's own trace, 66 dB down.
      const at: number[] = []
      hit.forEach((v, i) => {
        if (Math.abs(v) > 0.01) at.push(i)
      })
      expect(at[0]).toBe(LEAD)
      expectWritten(hit[at[0]!]!, '−0.75')
      expectWritten(hit[at[1]!]!, '0.44')
      expectWritten(hit[at[2]!]!, '0.33')
      expectWritten(hit[at[3]!]!, '0.25')
      for (let k = 1; k < at.length; k += 1) expectWritten(at[k]! - at[k - 1]!, '229 samples')
      const between = hit.subarray(LEAD + 2, LEAD + 229)
      expect(between.every((v) => Math.abs(v) < 1e-6)).toBe(true)
    })

    it('leaves every frequency at its level through one all-pass, to less than 0.00001 dB (claim allpass-flat), and through all four (claim chain-flat)', async () => {
      const plate = await lab(NAME)
      const out = plate.render(click(seconds(1)), {})
      // From 20 Hz to 20 kHz, at 241 frequencies: the furthest from the level that went in.
      expectWritten(out.checks.flatOne!, 'less than 0.00001 dB')
      expectWritten(out.checks.flat!, 'less than 0.00001 dB')
      // And the curve the lesson draws, every 2.5 Hz up to 2 kHz.
      const drawn = out.taps.responseAllpass!
      expect(drawn.length).toBe(801)
      expect([drawn.x0, drawn.x1]).toEqual([0, 2000])
      expectWritten(
        Math.max(...Array.from(drawn.channels_data[0]!, Math.abs)),
        'less than 0.00001 dB',
      )
    })

    it('lifts some frequencies 12 dB and drops others 4.9 dB with one delay and feedback, a peak every 210 Hz (claim comb-peaks)', async () => {
      const plate = await lab(NAME)
      const curve = plate.render(click(seconds(1)), {}).taps.responseComb!
      const comb = Array.from(curve.channels_data[0]!)
      // 1 / (1 - 0.75) is 12.04 dB and 1 / (1 + 0.75) is -4.86 dB.
      expectWritten(Math.max(...comb), '12 dB')
      expectWritten(-Math.min(...comb), '4.9 dB')
      const hzAt = (p: number) => curve.x0 + ((curve.x1 - curve.x0) * p) / (comb.length - 1)
      const peaks = comb.flatMap((v, p) =>
        p > 0 && p < comb.length - 1 && v > comb[p - 1]! && v >= comb[p + 1]! && v > 6
          ? [hzAt(p)]
          : [],
      )
      // 48000 / 229 is 209.6 Hz; the curve stands every 2.5 Hz.
      expect(peaks.length).toBe(9)
      expectWritten((peaks.at(-1)! - peaks[0]!) / (peaks.length - 1), '210 Hz')
      peaks.forEach((hz, k) => expect(Math.abs(hz - (k + 1) * 209.6)).toBeLessThan(2.5))
    })

    it('counts 2, 23, 47 and 96 echoes in the 10 ms from 30 ms on, after one, two, three and four all-passes (claim density-stages)', async () => {
      const plate = await lab(NAME)
      const taps = plate.render(click(seconds(1)), {}).taps
      const counted = [1, 2, 3, 4].map((n) => Array.from(taps[`density${n}`]!.channels_data[0]!))
      expectWritten(counted[0]![3]!, '2')
      expectWritten(counted[1]![3]!, '23')
      expectWritten(counted[2]![3]!, '47')
      expectWritten(counted[3]![3]!, '96')
      // From 10 ms on, every stage has more echoes in each 10 ms than the stage before it.
      for (let window = 1; window < 10; window += 1) {
        for (let stage = 1; stage < 4; stage += 1) {
          expect(counted[stage]![window]!).toBeGreaterThan(counted[stage - 1]![window]!)
        }
      }
      // The same count made here, from the echoes the lab drew.
      for (let stage = 0; stage < 4; stage += 1) {
        const hit = taps[`hit${stage + 1}`]!.channels_data[0]!.subarray(LEAD)
        for (let window = 0; window < 4; window += 1) {
          expect(echoesIn(hit, window * 480)).toBe(counted[stage]![window])
        }
      }
    })

    it('reaches 186 echoes in 10 ms after the fourth all-pass (claim density-four), and at the output 152 in every 10 ms on average over the 400 ms from 100 ms on, over 15,000 a second (claim density-ceiling)', async () => {
      const plate = await lab(NAME)
      const taps = plate.render(click(seconds(1)), {}).taps
      expectWritten(Math.max(...taps.density4!.channels_data[0]!), '186')
      const out = Array.from(taps.densityOut!.channels_data[0]!).slice(10, 50)
      const mean = out.reduce((a, b) => a + b) / out.length
      expectWritten(mean, '152')
      expectWritten(mean * 100, 'over 15,000')
      // In the tank it has got there too.
      const tank = Array.from(taps.densityTank!.channels_data[0]!).slice(10, 50)
      expect(Math.min(...tank)).toBeGreaterThan(100)
    })

    it('counts the same at the output wherever the line of 60 dB is drawn: at 40 dB or at 100 dB the average is within 1 of the same (claim density-floor), and white noise counted the same way has 160 in 10 ms (claim density-noise)', async () => {
      const plate = await lab(NAME)
      // One click in eight seconds: the output is the whole answer, from the gap's 959 samples on.
      const answer = tap(plate.render(click(seconds(8)), {}), 'out')
      const mean = (within: number) => {
        let sum = 0
        for (let w = 10; w < 50; w += 1) sum += echoesIn(answer, 959 + w * 480, within)
        return sum / 40
      }
      expectWritten(mean(60), '152')
      expect(Math.abs(mean(40) - mean(60))).toBeLessThan(1)
      expect(Math.abs(mean(100) - mean(60))).toBeLessThan(1)
      // A line drawn 20 dB down is another count: it leaves out the smaller echoes.
      expect(mean(20)).toBeLessThan(mean(60) - 10)
      // Three seconds of noise, a second of each of three seeds.
      let sum = 0
      for (const seed of [1, 2, 3]) {
        const hiss = noise(0.5, seconds(1), seed).left
        for (let w = 0; w < 100; w += 1) sum += echoesIn(hiss, w * 480)
      }
      expectWritten(sum / 300, '160')
    })

    it('sets the four input all-passes to 229, 173, 611 and 447 samples at 48 kHz, no two sharing a factor (claim input-lengths)', async () => {
      const plate = await lab(NAME)
      const input = Array.from(tap(plate.render(click(seconds(1)), {}), 'lengths')).slice(0, 4)
      expectWritten(input[0]!, '229 samples')
      expectWritten(input[1]!, '173 samples')
      expectWritten(input[2]!, '611 samples')
      expectWritten(input[3]!, '447 samples')
      expect(input.every(Number.isInteger)).toBe(true)
      for (let a = 0; a < 4; a += 1)
        for (let b = a + 1; b < 4; b += 1) expect(gcd(input[a]!, input[b]!)).toBe(1)
    })

    it('sets the tank to 1,083.8, 7,182, 2,903 and 6,000 samples on the left and 1,464.5, 6,801, 4,284 and 5,101 samples on the right (claim tank-lengths)', async () => {
      const plate = await lab(NAME)
      const lengths = Array.from(tap(plate.render(click(seconds(1)), {}), 'lengths'))
      const written = ['1,083.8', '7,182', '2,903', '6,000', '1,464.5', '6,801', '4,284', '5,101']
      written.forEach((one, k) => expectWritten(lengths[4 + k]!, `${one} samples`))
      // All but the two moving all-passes are whole numbers of samples.
      for (const k of [5, 6, 7, 9, 10, 11]) expect(Number.isInteger(lengths[k]!)).toBe(true)
    })

    it('delays by one sample less than a plain delay is long: 7,181 samples for a length of 7,182 (claim one-less)', async () => {
      const plate = await lab(NAME)
      const source = click(seconds(2))
      // With no decay nothing comes round, so the first sound at each point is the sample's own.
      const once = plate.render(source, { decay: 0, predelay: 0 })
      expect(firstSound(tap(once, 'tankA'))).toBe(0)
      expectWritten(firstSound(tap(once, 'damped')), '7,181 samples')
      expect(firstSound(tap(once, 'damped', 1))).toBe(6800)
      // With a little decay the second delay of each half has something to carry.
      const twice = plate.render(source, { decay: 0.1, predelay: 0 })
      const leftB = firstSound(tap(twice, 'tankB'))
      const rightB = firstSound(tap(twice, 'tankB', 1))
      expect(leftB).toBe(7181)
      expect(firstSound(tap(twice, 'crossing')) - leftB).toBe(5999)
      expect(firstSound(tap(twice, 'crossing', 1)) - rightB).toBe(5100)
    })

    it('goes once round both halves in 0.725 s (claim trip)', async () => {
      const plate = await lab(NAME)
      expectWritten(plate.render(click(seconds(1)), {}).checks.trip!, '0.725 s')
    })

    it('brings what entered the right half round to the left 11,901 samples later, at 248 ms (claim crossing)', async () => {
      const plate = await lab(NAME)
      const source = click(seconds(1))
      // With the decay at 0 nothing crosses: what differs from that is what came round.
      const round = plate.render(source, {}).taps.hitTank!
      const alone = tap(plate.render(source, { decay: 0 }), 'hitTank')
      // The picture starts 20 ms, 960 samples, before the burst arrives.
      expect(round.x0).toBe(-20)
      const first = round.channels_data[0]!.findIndex((v, i) => Math.abs(v - alone[i]!) > 1e-9)
      // 6800 and 5100 samples of delay in the right half, and one for the crossing.
      expectWritten(first - 960, '11,901 samples')
      expectWritten(ms(first - 960), '248 ms')
    })

    /** With no damping: the measured time and the formula's, each as the lesson writes it. */
    async function fallWith(decay: number, measured: string, formula: string) {
      const plate = await lab(NAME)
      const checks = plate.render(click(seconds(1)), { decay, damping: 0 }).checks
      expectWritten(checks.fall!, measured)
      expectWritten(checks.fallFormula!, formula)
      // The formula and the measurement are never more than a tenth apart.
      expect(Math.abs(checks.fall! / checks.fallFormula! - 1)).toBeLessThan(0.1)
    }

    it('falls 60 dB in 1.1 s at a decay of 0.3 with no damping (claim fall-03), where the formula gives 1.04 s (claim formula-03)', () =>
      fallWith(0.3, '1.1 s', '1.04 s'))

    it('falls 60 dB in 1.8 s at a decay of 0.5 with no damping (claim fall-05), where the formula gives 1.81 s (claim formula-05)', () =>
      fallWith(0.5, '1.8 s', '1.81 s'))

    it('falls 60 dB in 3.3 s at a decay of 0.7 with no damping (claim fall-07), where the formula gives 3.51 s (claim formula-07)', () =>
      fallWith(0.7, '3.3 s', '3.51 s'))

    it('falls 60 dB in 11 s at a decay of 0.9 with no damping (claim fall-09), where the formula gives 11.9 s (claim formula-09)', () =>
      fallWith(0.9, '11 s', '11.9 s'))

    it('dies away more slowly the higher the decay, from 0.47 s at 0 to 10 s at 0.9 (claim decay-range)', async () => {
      const plate = await lab(NAME)
      const source = click(seconds(1))
      const times = [0, 0.1, 0.3, 0.5, 0.7, 0.9].map(
        (decay) => plate.render(source, { decay }).checks.fall!,
      )
      for (let i = 1; i < times.length; i += 1) expect(times[i]!).toBeGreaterThan(times[i - 1]!)
      expectWritten(times[0]!, '0.47 s')
      expectWritten(times.at(-1)!, '10 s')
      expect(times.at(-1)! / times[0]!).toBeGreaterThan(20)
    })

    it('reads the time to fall 60 dB off the decay curve: three times its time from −5 dB to −25 dB', async () => {
      const plate = await lab(NAME)
      const out = plate.render(click(seconds(1)), {})
      const curve = out.taps.decayCurve!
      const data = curve.channels_data[0]!
      expect(data[0]).toBe(0)
      for (let p = 1; p < data.length; p += 1) expect(data[p]!).toBeLessThanOrEqual(data[p - 1]!)
      expect(3 * (timeDown(curve, -25) - timeDown(curve, -5))).toBeCloseTo(out.checks.fall!, 3)
    })

    it('shortens the highs with damping and hardly the lows: at 0.7 the band at 5 kHz falls 60 dB in 1.3 s, 0.7 of its time with none, and the band at 500 Hz keeps 0.99 of its time (claim damping-bands)', async () => {
      const plate = await lab(NAME)
      const source = click(seconds(1))
      const bright = plate.render(source, { damping: 0 }).checks
      const dark = plate.render(source, { damping: 0.7 }).checks
      expectWritten(dark.fallHigh!, '1.3 s')
      expectWritten(dark.fallHigh! / bright.fallHigh!, '0.7')
      expectWritten(dark.fallLow! / bright.fallLow!, '0.99')
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
      const checks = plate.render(click(seconds(1)), { damping: 0.7 }).checks
      const a = 0.7
      const formula = (hz: number) => {
        const w = (2 * Math.PI * hz) / RATE
        const gain2 = (1 - a) ** 2 / (1 - 2 * a * Math.cos(w) + a * a)
        return (-3 * checks.trip!) / Math.log10(0.5 ** 4 * gain2)
      }
      expectWritten(formula(500), '1.8 s')
      expectWritten(formula(5000), '1.2 s')
      expect(Math.abs(checks.fallLow! / formula(500) - 1)).toBeLessThan(0.1)
      expect(Math.abs(checks.fallHigh! / formula(5000) - 1)).toBeLessThan(0.1)
    })

    it('passes its damping filter 3.0 dB down at 10.6 kHz with the damping at 0.3, and at 2.75 kHz at 0.7 (claim damping-cutoff)', async () => {
      const plate = await lab(NAME)
      // With no decay the left half holds the input alone: the filter's gain is what is after
      // the first delay against what went into it.
      const lossAt = (hz: number, damping: number) => {
        const result = plate.render(sine(hz, 0.5, seconds(2)), { decay: 0, damping })
        return -gainToDb(rms(tap(result, 'damped')) / rms(tap(result, 'tankA')))
      }
      expectWritten(lossAt(10_600, 0.3), '3.0 dB')
      expectWritten(lossAt(2750, 0.7), '3.0 dB')
      expectWritten(lossAt(500, 0.3), 'less than 0.02 dB')
    })

    it('loses its highs a little sooner even with no damping: the band round 16 kHz falls 60 dB in 1.6 s where the band round 1 kHz takes 1.9 s (claim still-loses-highs)', async () => {
      const plate = await lab(NAME)
      const result = plate.render(click(seconds(1)), { damping: 0 })
      expectWritten(fallAt(result, 16_000), '1.6 s')
      expectWritten(fallAt(result, 1000), '1.9 s')
      // From 4 kHz up, each band falls sooner than the band under it.
      const curve = Array.from(tap(result, 'fallBands'))
      for (let p = 9; p < 13; p += 1) expect(curve[p]!).toBeLessThan(curve[p - 1]!)
    })

    it('first sounds 428 samples after the pre-delay on the left and 568 samples on the right, which are 8.9 ms and 11.8 ms (claim first-out), the right repeating the left for its first 1,083 samples (claim sides-early), and over the whole response the two sides are unrelated: a likeness under 0.01 (claim sides)', async () => {
      const plate = await lab(NAME)
      const out = plate.render(click(seconds(1)), {})
      const left = tap(out, 'hitLeft')
      const right = tap(out, 'hitRight')
      expectWritten(firstSound(left), '428 samples')
      expectWritten(firstSound(right), '568 samples')
      expectWritten(ms(firstSound(left)), '8.9 ms')
      expectWritten(ms(firstSound(right)), '11.8 ms')
      // At first the right is the left again, 140 samples late: each side's first reading is of
      // the same burst going into the other half. It lasts until the left half's first all-pass
      // gives back what it took.
      let alike = 0
      while (right[568 + alike] === left[428 + alike]) alike += 1
      expectWritten(alike, '1,083 samples')
      expectWritten(Math.abs(out.checks.sides!), 'under 0.01')
      const moving = plate.render(click(seconds(1)), { movement: 1 })
      expectWritten(Math.abs(moving.checks.sides!), 'under 0.01')
    })

    it('adds up to 19.35 samples to the delay of each half’s first all-pass, the left once a second and the right at 0.95 Hz (claim wobble-range), and nothing when held still', async () => {
      const plate = await lab(NAME)
      const source = sine(440, 0.25, seconds(4))
      const moving = plate.render(source, { movement: 1 })
      const left = tap(moving, 'wobbleLeft')
      const right = tap(moving, 'wobbleRight')
      // The crossfade at the wrap blends the first 20 ms with what follows the loop: look past it.
      const from = 100
      for (const trace of [left, right]) {
        const kept = Array.from(trace.subarray(from))
        expect(Math.min(...kept)).toBeCloseTo(0, 1)
        expectWritten(Math.max(...kept), '19.35 samples')
      }
      // A point of a trace is 16 samples: 3000 points are a second. The left comes round in one.
      for (let k = from; k < 3000; k += 100) expect(left[k + 3000]!).toBeCloseTo(left[k]!, 1)
      // The right does not: it turns at 0.95 Hz, once in 3158 points.
      expect(Math.abs(right[1500 + 3000]! - right[1500]!)).toBeGreaterThan(1)
      for (let k = from; k < 3000; k += 100) expect(right[k + 3158]!).toBeCloseTo(right[k]!, 1)
      const held = plate.render(source, {})
      expect(tap(held, 'wobbleLeft').every((v) => v === 0)).toBe(true)
      expect(tap(held, 'wobbleRight').every((v) => v === 0)).toBe(true)
    })

    it('holds a steady tone steady when still, within 0.001 dB (claim still-steady), and swings it through 21 dB when the delays move (claim moving-swings)', async () => {
      const plate = await lab(NAME)
      const source = sine(440, 0.25, seconds(8))
      expectWritten(swing(tap(plate.render(source, {}), 'out')), 'less than 0.001 dB')
      const moving = tap(plate.render(source, { movement: 1 }), 'out')
      expectWritten(swing(moving), '21 dB')
      // Read from a quarter, a half and three quarters of a tenth of a second later, it is the same.
      for (const from of [1200, 2400, 3600]) expectWritten(swing(moving.subarray(from)), '21 dB')
    })

    it('swings a tone at 220 Hz through 0.7 dB with the delays moving: how far depends on the tone (claim swing-low)', async () => {
      const plate = await lab(NAME)
      const moving = plate.render(sine(220, 0.25, seconds(8)), { movement: 1 })
      expectWritten(swing(tap(moving, 'out')), '0.7 dB')
    })

    it('on the drum loop, read half a second at a time, comes out with the delays moving within 0.5 dB of the same with them still (claim moving-drums)', async () => {
      const plate = await lab(NAME)
      const drums = await benchSource('drums', seconds(4))
      const still = tap(plate.render(drums, {}), 'out')
      const moving = tap(plate.render(drums, { movement: 1 }), 'out')
      let furthest = 0
      for (let from = 0; from + seconds(0.5) <= still.length; from += seconds(0.5)) {
        const apart =
          levelOf(moving, from, from + seconds(0.5)) - levelOf(still, from, from + seconds(0.5))
        furthest = Math.max(furthest, Math.abs(apart))
      }
      expectWritten(furthest, 'less than 0.5 dB')
      // The two are not the same sound: the movement is there, and it evens out.
      expect(furthest).toBeGreaterThan(0.01)
    })

    it('gives 441 Hz 3.5 dB more than 440 Hz when the delays are still (claim pitch-luck)', async () => {
      const plate = await lab(NAME)
      const level = (hz: number) =>
        levelOf(tap(plate.render(sine(hz, 0.25, seconds(8)), {}), 'out'))
      expectWritten(level(441) - level(440), '3.5 dB')
    })

    it("works out what each input all-pass put out from the device's own delays, more than 120 dB under what the next stage took in (claim rebuilt)", async () => {
      const plate = await lab(NAME)
      for (const id of ['clicks', 'drums', 'guitar']) {
        const source = await benchSource(id, seconds(4))
        expectWritten(-plate.render(source, {}).checks.rebuilt!, 'more than 120 dB')
        // With the delays moving, the fourth is held to the moving all-pass's own read.
        const moving = plate.render(source, { movement: 1, decay: 0.9 })
        expectWritten(-moving.checks.rebuilt!, 'more than 120 dB')
      }
    })

    it('with the mix at 0.5 lets the dry sound through 6.0 dB down and the plate 6.0 dB down (claim mix-half), and with the mix at 0 is the input, sample for sample (claim mix-zero)', async () => {
      const plate = await lab(NAME)
      const drums = await benchSource('drums', seconds(4))
      const half = plate.render(drums, { mix: 0.5 })
      const dry = tap(half, 'out').map((v, i) => v - tap(half, 'added')[i]!)
      expectWritten(levelOf(tap(half, 'in')) - levelOf(dry), '6.0 dB')
      const alone = plate.render(drums, { mix: 1 })
      expectWritten(levelOf(tap(alone, 'out')) - levelOf(tap(half, 'added')), '6.0 dB')

      const out = plate.render(drums, { mix: 0, decay: 0.9 }).taps.out!
      expect(out.channels_data[0]!.every((v, i) => v === drums.left[i])).toBe(true)
      expect(out.channels_data[1]!.every((v, i) => v === drums.right[i])).toBe(true)
    })
  })

  describe('the cards, as they play', () => {
    it('fills the quietest fifth of a second of the drum loop from −85 dB as played to −34 dB (claim use-drums)', async () => {
      const plate = await lab(NAME)
      const result = await played(plate, 'drums')
      const at = quietest(tap(result, 'in'), seconds(0.2))
      expectWritten(levelOf(tap(result, 'in'), at, at + seconds(0.2)), '−85 dB')
      expectWritten(levelOf(tap(result, 'out'), at, at + seconds(0.2)), '−34 dB')
    })

    it('adds to the picked guitar a plate that stands 5.1 dB under the guitar itself over the loop (claim use-guitar)', async () => {
      const plate = await lab(NAME)
      const result = await played(plate, 'guitar')
      expectWritten(levelOfBoth(result, 'in') - levelOfBoth(result, 'added'), '5.1 dB')
    })

    it('gives the strummed chords a tail that falls 60 dB in about 6 s round 500 Hz and in 3.4 s round 5 kHz (claim use-chords)', async () => {
      const plate = await lab(NAME)
      const checks = (await played(plate, 'chords')).checks
      expectWritten(checks.fallLow!, '6 s')
      expectWritten(checks.fallHigh!, '3.4 s')
    })

    it('adds to the pad a plate that stands 1.6 dB under the pad itself over the loop (claim use-pad)', async () => {
      const plate = await lab(NAME)
      const result = await played(plate, 'pad')
      expectWritten(levelOfBoth(result, 'in') - levelOfBoth(result, 'added'), '1.6 dB')
    })

    it('first answers a click 88.9 ms after it with the pre-delay at 80 ms, where at 20 ms it answered 28.9 ms after (claim way-clear)', async () => {
      const plate = await lab(NAME)
      const { values } = setOf(plate, 'clear')
      expect(values.predelay).toBe(80)
      // The plate alone and Decay at 0.1: nothing of the pass before, and no dry click, in the way.
      const answered = (predelay: number) =>
        ms(
          firstSound(
            tap(
              plate.render(click(seconds(2)), { ...values, mix: 1, decay: 0.1, predelay }),
              'out',
            ),
          ),
        )
      expectWritten(answered(80), '88.9 ms')
      expectWritten(answered(20), '28.9 ms')
    })

    it('takes between 0.9 s and 1 s to fall 60 dB with Decay at 0.25 and the delays moving (claim way-short)', async () => {
      const plate = await lab(NAME)
      const result = await played(plate, 'short')
      expectWritten(result.checks.fall!, 'over 0.9 s')
      expectWritten(result.checks.fall!, 'under 1 s')
      // And read a decibel higher or lower on the line.
      for (const [top, bottom] of [
        [-4, -24],
        [-6, -26],
      ]) {
        expectWritten(fallOver(result.taps.decayCurve!, top!, bottom!), 'over 0.9 s')
        expectWritten(fallOver(result.taps.decayCurve!, top!, bottom!), 'under 1 s')
      }
    })

    it('with Damping at 0 falls 60 dB in 2.4 s round 5 kHz, and round 500 Hz takes less than 0.2 s longer (claim way-bright)', async () => {
      const plate = await lab(NAME)
      const checks = (await played(plate, 'bright')).checks
      expectWritten(checks.fallHigh!, '2.4 s')
      expect(checks.fallLow!).toBeGreaterThan(checks.fallHigh!)
      expectWritten(checks.fallLow! - checks.fallHigh!, 'less than 0.2 s')
    })

    it('with Decay at 0.85 and Damping at 0.7 falls 60 dB in about 8 s round 500 Hz and in 2.6 s round 5 kHz, three times as long at the bottom as at the top (claim way-dark)', async () => {
      const plate = await lab(NAME)
      const checks = (await played(plate, 'dark')).checks
      expectWritten(checks.fallLow!, '8 s')
      expectWritten(checks.fallHigh!, '2.6 s')
      expectWritten(checks.fallLow! / checks.fallHigh!, '3.0')
    })

    it('with the mix at 1 puts out the plate and nothing of the dry sound: what the plate adds is the output, sample for sample (claim way-alone)', async () => {
      const plate = await lab(NAME)
      const result = await played(plate, 'alone')
      for (const channel of [0, 1]) {
        const out = tap(result, 'out', channel)
        expect(tap(result, 'added', channel).every((v, i) => v === out[i])).toBe(true)
      }
    })

    it('leaves a bass line with a plate 1.8 dB over the line itself, and fills its quietest fifth of a second from −42 dB to −23 dB (claim fault-mud)', async () => {
      const plate = await lab(NAME)
      const result = await played(plate, 'mud')
      expectWritten(levelOfBoth(result, 'added') - levelOfBoth(result, 'in'), '1.8 dB')
      const at = quietest(tap(result, 'in'), seconds(0.2))
      expectWritten(levelOf(tap(result, 'in'), at, at + seconds(0.2)), '−42 dB')
      expectWritten(levelOf(tap(result, 'out'), at, at + seconds(0.2)), '−23 dB')
    })

    it('swings a held 440 Hz tone through 21 dB across the loop with the delays moving, and holds it within 0.001 dB with them still (claim fault-swell)', async () => {
      const plate = await lab(NAME)
      expectWritten(swing(tap(await played(plate, 'swell'), 'out')), '21 dB')
      expectWritten(
        swing(tap(await played(plate, 'swell', { movement: 0 }), 'out')),
        'less than 0.001 dB',
      )
    })

    it('first answers a click 259 ms after it with the pre-delay at 250 ms (claim fault-slap)', async () => {
      const plate = await lab(NAME)
      const { values } = setOf(plate, 'slap')
      expect(values.predelay).toBe(250)
      const out = tap(plate.render(click(seconds(2)), { ...values, mix: 1, decay: 0.1 }), 'out')
      expectWritten(ms(firstSound(out)), '259 ms')
    })

    it('with Damping at 1 falls 60 dB in 0.5 s though Decay is at 0.9, where with Damping at 0.3 it takes 10 s (claim fault-shut)', async () => {
      const plate = await lab(NAME)
      const { values } = setOf(plate, 'shut')
      const source = click(seconds(1))
      expectWritten(plate.render(source, values).checks.fall!, '0.5 s')
      expectWritten(plate.render(source, { ...values, damping: 0.3 }).checks.fall!, '10 s')
    })
  })

  describe('the settings file', () => {
    it('renders every named set: a sound that is there, finite and not over full scale', async () => {
      const plate = await lab(NAME)
      for (const name of Object.keys(settings.sets)) {
        const { tap: heard } = setOf(plate, name)
        const result = await played(plate, name)
        const sound = result.taps[heard ?? 'out']!
        expect(sound.kind, `${name} plays a sound`).toBe('audio')
        for (const data of sound.channels_data) {
          expect(
            data.every((v) => Number.isFinite(v)),
            `${name} is finite`,
          ).toBe(true)
          expect(gainToDb(peak(data)), `${name} does not pass full scale`).toBeLessThanOrEqual(0)
        }
        expect(levelOf(sound.channels_data[0]!), `${name} is not silent`).toBeGreaterThan(-60)
      }
    })

    it('plays the tile between −36 and −5 dB on each of the six loops of the map', async () => {
      const plate = await lab(NAME)
      const tile = settings.tile!
      for (const loop of LOOPS) {
        const result = plate.render(await benchSource(loop, seconds(4)), tile.values)
        const level = levelOfBoth(result, tile.tap!)
        expect(level, loop).toBeGreaterThan(-36)
        expect(level, loop).toBeLessThan(-5)
      }
    })

    it("starts the page's device table from the device's own defaults: the settings file's defaults, laid over the lab's starting values, are the defaults device.json points to, with the delays moving as the device's always do", async () => {
      const plate = await lab(NAME)
      const root = fileURLToPath(new URL('../../../', import.meta.url))
      const device = JSON.parse(
        fs.readFileSync(`${root}cpp/devices/plate-reverb/device.json`, 'utf8'),
      ) as { params: string }
      // This device keeps its parameters in the library's own file, which device.json names.
      const text = fs.readFileSync(`${root}${device.params}`, 'utf8')
      const written = Object.fromEntries(
        [...text.matchAll(/^ {2}(\w+): \{\n(?:.*\n)*? {4}default: ([\d.]+),/gm)].map((found) => [
          found[1]!,
          Number(found[2]),
        ]),
      )
      expect(Object.keys(written).sort()).toEqual(['damping', 'decay', 'mix', 'predelayMs'])
      // The lab's controls are the device's parameters; the pre-delay drops its unit from its id.
      const { values } = resolveSet(plate.description, { values: settings.defaults!.values })
      for (const [key, value] of Object.entries(written)) {
        expect(values[key === 'predelayMs' ? 'predelay' : key], key).toBeCloseTo(value, 5)
      }
      // The device has no control over the movement of its two delays: they move.
      expect(values.movement).toBe(1)
      // Only what differs from the lab's start is written down.
      for (const [id, value] of Object.entries(settings.defaults!.values)) {
        expect(plate.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
      }
    })
  })
})
