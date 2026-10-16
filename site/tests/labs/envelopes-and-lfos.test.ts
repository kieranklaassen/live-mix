import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  peak,
  POINT_RATE,
  points,
  range,
  RATE,
  rms,
  seconds,
  silence,
} from './support.ts'

// Nothing goes in: the lab plays the note itself. Its key goes down 10 ms into the loop.
const nothing = () => silence(seconds(4))
const DOWN = 480
/** The point of a control tap that stands `s` seconds after the key went down. */
const tick = (s: number) => points(s + DOWN / RATE)

/** The first channel of a tap. */
const tap = (result: RenderResult, id: string) => result.taps[id]!.channels_data[0]!

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings('envelopes-and-lfos')!

/** The steps of the build path, as the lab numbers them. */
const STEP = { gate: 0, attack: 1, decay: 2, release: 3, lfo: 4, destination: 5 }

/** The envelope's stages, as kit::Adsr numbers them (cpp/kit/env.h). */
const STAGE = { idle: 0, attack: 1, decay: 2, sustain: 3, release: 4 }

/** A named set as its card plays it, with `over` laid on its values. */
function played(theLab: Lab, name: string, over: Record<string, number> = {}): RenderResult {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values } = resolveSet(theLab.description, set)
  return theLab.render(nothing(), { ...values, ...over })
}

/** The first point from `from` on where `test` holds, or -1. */
function firstAt(x: Float32Array, test: (v: number) => boolean, from = 0): number {
  for (let i = from; i < x.length; i += 1) if (test(x[i]!)) return i
  return -1
}

/**
 * The point where a level stands highest. The kit's envelope is at the top for one sample, which
 * seldom falls on a point of the line, so the top of the line is the point nearest to it.
 */
function topOf(x: Float32Array): number {
  let at = 0
  for (let i = 1; i < x.length; i += 1) if (x[i]! > x[at]!) at = i
  return at
}

/** Seconds from the key going down to the first point of a control tap where `test` holds. */
const sinceDown = (x: Float32Array, test: (v: number) => boolean) => {
  const at = firstAt(x, test, tick(0))
  return at < 0 ? NaN : (at - tick(0)) / POINT_RATE
}

/** The points where a line passes upwards through zero, the loop's wrap among them. */
function risings(x: Float32Array): number[] {
  const found: number[] = []
  for (let i = 0; i < x.length; i += 1) {
    const before = x[(i - 1 + x.length) % x.length]!
    if (before < 0 && x[i]! >= 0) found.push(i)
  }
  return found
}

/** The seconds between the first two upward crossings of a control tap after `from`: one cycle. */
function cycle(x: Float32Array, from = 0): number {
  const [a, b] = risings(x).filter((i) => i >= from)
  return a === undefined || b === undefined ? NaN : (b - a) / POINT_RATE
}

/** The longest run of points that all hold one value, in seconds. */
function longestStill(x: Float32Array): number {
  let longest = 0
  let run = 0
  for (let i = 1; i < x.length; i += 1) {
    run = x[i] === x[i - 1] ? run + 1 : 0
    longest = Math.max(longest, run)
  }
  return longest / POINT_RATE
}

/**
 * The samples from the key going down until the kit's level is first at the top, on a render
 * with LFO to pitch at 0 whose note is over before the next pass begins. The note is the tone
 * itself only where the level is exactly 1: the first such sample is the top.
 */
function topAfter(result: RenderResult): number {
  const note = tap(result, 'note')
  const tone = tap(result, 'tone')
  for (let i = DOWN; i < note.length; i += 1) {
    if (tone[i] !== 0 && note[i] === tone[i]) return i - DOWN + 1
  }
  return NaN
}

/** The same at an Attack time, the key held past it and the release short. */
const samplesToTop = (theLab: Lab, attack: number) =>
  topAfter(theLab.render(nothing(), { attack, hold: 3, release: 0.05, toPitch: 0 }))

/**
 * Where the arithmetic says a fall towards `sustain` stops in single precision: where one
 * sample's move, the distance times one less the decay's number, is half the step between two
 * such numbers near `sustain`. The step is 2^-24 from 0.5 up to 1.
 */
const restsAt = (decay: number) => 2 ** -25 / (1 - Math.exp(-Math.log(1000) / (decay * RATE)))

/** The largest difference between two lines, point for point. */
function apart(a: Float32Array, b: Float32Array, from = 0, to = a.length): number {
  let most = 0
  for (let i = from; i < to; i += 1) most = Math.max(most, Math.abs(a[i]! - b[i]!))
  return most
}

describe('the envelopes and LFOs lab', () => {
  it('is a sound lab playing its own note: every tap says something, loops, and answers to every control', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const result = theLab.render(nothing(), {})
    // At the starting values the LFO reaches the pitch alone: the Auto Filter's cutoff stays
    // where it is set, and the Tremolo's gain stays at 1.
    expectSoundLab(theLab, nothing(), result, { quiet: ['sweep', 'gain'] })
    // With both turned up, each says something.
    const moved = theLab.render(nothing(), { lfoAmount: 50, depth: 0.5 })
    expect(range(tap(moved, 'sweep')).span).toBeGreaterThan(1)
    expect(range(tap(moved, 'gain')).span).toBeGreaterThan(0.4)
  })

  it('has a build path of six steps, each changing a built tap and none the main path, the fifth held to the kit', async () => {
    const theLab = await lab('envelopes-and-lfos')
    expectBuild(theLab, nothing())
    expect(theLab.description.controls.find((one) => one.id === 'build')!.choices).toEqual([
      'A gate',
      'Attack',
      'Decay to sustain',
      'Release',
      'An LFO',
      'A destination',
    ])
    expect(theLab.render(nothing(), {}).checks.builtStep).toBe(STEP.lfo)
  })

  it('lands the built envelope and the built LFO on the kit at every point drawn, in every shape and at other times (builtDifference under -120 dB)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const cases: Record<string, number>[] = [
      {},
      { shape: 1, attack: 0.001, decay: 0.01, sustain: 0, release: 0.01, rate: 0.1 },
      { shape: 2, attack: 2, decay: 3, sustain: 1, release: 3, rate: 20, hold: 3.5 },
      { shape: 3, attack: 0.03, decay: 0.2, sustain: 0.25, release: 0.4, rate: 7.3, hold: 0.05 },
    ]
    for (const values of cases) {
      const result = theLab.render(nothing(), { ...values, build: STEP.lfo })
      expect(result.checks.builtDifference).toBeLessThanOrEqual(-120)
      // Not only close: the same number at every point of the two lines.
      expect(apart(tap(result, 'builtEnvelope'), tap(result, 'envelope'))).toBe(0)
      expect(apart(tap(result, 'builtLfo'), tap(result, 'lfo'))).toBe(0)
      expect(apart(tap(result, 'builtGate'), tap(result, 'gate'))).toBe(0)
    }
  })

  it('makes the note of the main path, sample for sample, with all six pieces', async () => {
    const theLab = await lab('envelopes-and-lfos')
    for (const values of [
      {},
      { shape: 2, toPitch: 100, rate: 6 },
      { shape: 3, toPitch: 60, hold: 0.3 },
    ]) {
      const result = theLab.render(nothing(), { ...values, build: STEP.destination })
      expect(apart(tap(result, 'built'), tap(result, 'note'))).toBe(0)
      expect(apart(tap(result, 'builtPitch'), tap(result, 'pitchNow'))).toBe(0)
    }
  })

  // ---- part 1: a tone is not a note ------------------------------------------------------------

  it('starts the shaped note under 0.0001, where the switched tone starts at 0.23 (claim note-start)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const shaped = tap(played(theLab, 'shaped'), 'note')
    expect(shaped[DOWN - 1]).toBe(0)
    expect(shaped[DOWN]).not.toBe(0)
    expectWritten(Math.abs(shaped[DOWN]!), 'under 0.0001')
    // And no two samples of it stand further apart than two samples of the tone do at the top.
    let most = 0
    for (let i = DOWN; i < DOWN + 96; i += 1)
      most = Math.max(most, Math.abs(shaped[i]! - shaped[i - 1]!))
    expect(most).toBeLessThan(0.01)
  })

  it('switches the tone on from nothing to 0.23 in one sample, and off from 0.24 as fast (claim switch-jump)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const switched = tap(played(theLab, 'switched'), 'gated')
    expect(switched[DOWN - 1]).toBe(0)
    expectWritten(Math.abs(switched[DOWN]!), '0.23')
    // The tone itself peaks at 0.4, so the jump is more than half of it.
    expectWritten(peak(tap(played(theLab, 'tone'), 'tone')), '0.4')
    expect(Math.abs(switched[DOWN]!)).toBeGreaterThan(0.2)
    // The other end: the key goes up 2 s later, and the switched tone drops to nothing as fast.
    const up = DOWN + seconds(2)
    expect(switched[up]).toBe(0)
    expectWritten(Math.abs(switched[up - 1]!), '0.24')
  })

  it('lets go from where the level had got to: 0.40 a quarter of the way through the Attack time, and never higher (claim early)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const result = played(theLab, 'early')
    const env = tap(result, 'envelope')
    const stage = tap(result, 'stage')
    expectWritten(range(env).hi, '0.40')
    // The stage goes from attack straight to release: no decay, no sustain.
    const stages = new Set(stage)
    expect(stages.has(STAGE.decay)).toBe(false)
    expect(stages.has(STAGE.sustain)).toBe(false)
    expect(stages.has(STAGE.release)).toBe(true)
    // And the level only falls once the key is up.
    const up = tick(0.1)
    for (let i = up + 1; i < env.length; i += 1) expect(env[i]!).toBeLessThanOrEqual(env[i - 1]!)
  })

  // ---- part 2: four numbers ---------------------------------------------------------------------

  it('reaches the top 0.200 s after the key goes down with Attack at 0.2 s (claim attack-time)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const env = tap(theLab.render(nothing(), {}), 'envelope')
    expectWritten((topOf(env) - tick(0)) / POINT_RATE, '0.200 s')
    // The line has a point every 16 samples, so its highest point is a little under the top.
    expect(env[topOf(env)]!).toBeGreaterThan(0.999)
    expect(env[topOf(env)]!).toBeLessThanOrEqual(1)
  })

  it('is at the top 9,602 samples after the key goes down with Attack at 0.2 s, where 9,600 were asked, 45 samples early at 1 s and 98 samples late at 2 s, and within 0.2 % of the Attack time or two samples of it at every setting tried (claim attack-exact)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    expectWritten(samplesToTop(theLab, 0.2), '9,602 samples')
    expect(0.2 * RATE).toBeCloseTo(9600, 3)
    expectWritten(1 * RATE - samplesToTop(theLab, 1), '45 samples')
    expectWritten(samplesToTop(theLab, 2) - 2 * RATE, '98 samples')
    // From the shortest Attack to the longest. The kit works the share out in single precision:
    // it is right to a part in a few hundred at the longest times, and the top is a whole sample.
    let furthest = 0
    for (const attack of [0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 0.5, 0.7, 1.3, 1.5, 1.7, 1.85]) {
      const asked = attack * RATE
      const off = Math.abs(samplesToTop(theLab, attack) - asked)
      expect(off, `Attack at ${attack} s`).toBeLessThanOrEqual(Math.max(2, 0.002 * asked))
      furthest = Math.max(furthest, off / asked)
    }
    // And the allowance is not idle: somewhere in the range the top is more than 0.1 % out.
    expect(furthest).toBeGreaterThan(0.001)
  })

  it('settles at the Sustain level, 0.5, and stays there for as long as the key is held, whatever the hold (claim sustain-level)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    for (const hold of [1.2, 2, 3.5]) {
      const env = tap(theLab.render(nothing(), { hold }), 'envelope')
      // From a second after the key went down until it goes up, the level does not move.
      const held = range(env, tick(1), tick(hold))
      expect(held.span).toBe(0)
      expectWritten(held.lo, '0.5')
      expect(held.lo).toBeCloseTo(0.5, 3)
    }
  })

  // ---- part 4 and part 5: the stages ------------------------------------------------------------

  it('closes 60.0 dB of the distance to the Sustain level in the Decay time: 0.5005 half a second after the top (claim decay-60)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const env = tap(theLab.render(nothing(), {}), 'envelope')
    const later = env[topOf(env) + points(0.5)]!
    expectWritten(later, '0.5005')
    expectWritten(-gainToDb((later - 0.5) / 0.5), '60.0 dB')
  })

  it('comes to rest 0.0001 above Sustain and never leaves the decay stage, at the settings the lesson starts from (claim decay-rests)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const result = theLab.render(nothing(), {})
    const env = tap(result, 'envelope')
    const stage = tap(result, 'stage')
    const rest = env[tick(2) - 1]! - 0.5
    expectWritten(rest, '0.0001')
    // Ten times further from Sustain than the kit's rule for ending the stage, 0.00001.
    expect(rest / 0.00001).toBeCloseTo(10, 0)
    // And where the rounding of a single-precision number says it stops.
    expect(rest / restsAt(0.5)).toBeCloseTo(1, 1)
    expect(new Set(stage).has(STAGE.sustain)).toBe(false)
    expect(stage[tick(2) - 1]).toBe(STAGE.decay)
    // With Sustain at 0 the rule is reached: the stage passes through sustain and the note is over.
    const plucked = theLab.render(nothing(), { sustain: 0 })
    expect(new Set(tap(plucked, 'stage')).has(STAGE.release)).toBe(false)
    expect(tap(plucked, 'envelope')[tick(1.5)]).toBe(0)
    expect(tap(plucked, 'stage')[tick(1.5)]).toBe(STAGE.idle)
    // And with a short Decay to a low Sustain it is reached too, and the stage reads sustain.
    const short = theLab.render(nothing(), { decay: 0.05, sustain: 0.25 })
    expect(tap(short, 'stage')[tick(1)]).toBe(STAGE.sustain)
    expect(tap(short, 'envelope')[tick(1)]).toBe(0.25)
  })

  it('rests 0.0006 above Sustain with Decay at its longest, 3 s, and further out at each longer Decay tried (claim decay-rests-long)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    // Where the level has stopped before the key goes up, and the stage it is in there.
    const rests = (decay: number) => {
      const result = theLab.render(nothing(), { decay, hold: 3.5 })
      const env = tap(result, 'envelope')
      const up = tick(3.5)
      expect(range(env, up - points(0.2), up).span, `Decay at ${decay} s has stopped`).toBe(0)
      expect(tap(result, 'stage')[up - 1], `Decay at ${decay} s`).toBe(STAGE.decay)
      return env[up - 1]! - 0.5
    }
    const longest = rests(3)
    expectWritten(longest, '0.0006')
    expect(longest / restsAt(3)).toBeCloseTo(1, 1)
    expect(rests(0.5)).toBeLessThan(rests(1))
    expect(rests(1)).toBeLessThan(longest)
  })

  it('falls 60.0 dB in the Release time, 0.8 s, and is over 1.25 s after the key is let go from 0.5 (claim release-60)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const result = theLab.render(nothing(), {})
    const env = tap(result, 'envelope')
    const up = tick(2)
    const before = env[up - 1]!
    expectWritten(before, '0.5')
    expectWritten(-gainToDb(env[up + points(0.8)]! / before), '60.0 dB')
    const over = firstAt(env, (v) => v === 0, up)
    expectWritten((over - up) / POINT_RATE, '1.25 s')
    // The last level before it is cut is 100 dB under the top.
    expectWritten(gainToDb(env[over - 1]!), '−100 dB')
  })

  it('passes −60 dB at one Release time from the top, the middle of the curve, and is cut off at −100 dB, at a Release of 0.8 s and at three others (claim release-curve)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    for (const release of [0.8, 0.01, 0.1, 3]) {
      const curve = theLab.render(nothing(), { release }).taps.releaseDb!
      const db = curve.channels_data[0]!
      // The curve runs for two Release times: its middle point stands at one.
      expect(curve.x1).toBeCloseTo(2 * release, 5)
      const middle = db[(db.length - 1) / 2]!
      expectWritten(middle, '−60 dB')
      expect(middle).toBeCloseTo(-60, 1)
      // A straight line in dB until it is cut: equal steps of time, equal steps of level.
      expect(db[db.length - 1]).toBe(-120)
      const cut = firstAt(db, (v) => v === -120)
      const step = db[1]! - db[0]!
      for (let p = 2; p < cut; p += 1) expect(db[p]! - db[p - 1]!).toBeCloseTo(step, 2)
      // Cut off at 100 dB under the top: the last point drawn is above it, and the next point
      // of the straight line would have stood at it.
      expect(db[cut - 1]!).toBeGreaterThan(-100)
      expectWritten(step * cut, '−100 dB')
      expect(step * cut).toBeCloseTo(-100, 1)
    }
  })

  it('aims the attack at 1.3 and stops it at 1: with Attack at 0.2 s the kit follows the curve that runs on to within 0.0001 until the top, and to within 0.001 at every Attack from 0.01 s up (claim attack-aim)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const result = theLab.render(nothing(), {})
    const kit = tap(result, 'attackKit')
    const aim = tap(result, 'attackAim')
    // The curves run for 2.5 Attack times over 241 points: point 96 stands at one.
    const top = 96
    expectWritten(apart(kit, aim, 0, top), 'less than 0.0001')
    // The kit is at the top two samples after that point, and stays: the key is held, Sustain is 1.
    expect(kit[top]!).toBeGreaterThan(0.999)
    expect(range(kit, top + 1).lo).toBe(1)
    // Left to run, the curve passes 1 and closes on 1.3.
    expectWritten(aim[aim.length - 1]!, '1.27')
    expect(range(aim, top + 1).lo).toBeGreaterThan(1)
    // At other times too. Under a hundredth of a second the kit's single samples show as steps.
    for (const attack of [0.01, 0.05, 1, 2]) {
      const other = theLab.render(nothing(), { attack })
      expectWritten(
        apart(tap(other, 'attackKit'), tap(other, 'attackAim'), 0, top),
        'less than 0.001',
      )
    }
  })

  it('turns the kit LFO once every 0.200 s at 5 Hz, 20 times in the four seconds of the loop (claim lfo-cycle)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const result = theLab.render(nothing(), {})
    const wave = tap(result, 'lfo')
    expectWritten(cycle(wave), '0.200 s')
    expectWritten(risings(wave).length, '20')
    // The phase climbs from 0 to 1 once a cycle.
    const phase = tap(result, 'lfoPhase')
    expect(range(phase).lo).toBeGreaterThanOrEqual(0)
    expect(range(phase).hi).toBeLessThan(1)
    expect(range(phase).hi).toBeGreaterThan(0.99)
  })

  it('bends 220 Hz between 216.8 Hz and 223.2 Hz with 25 cents of LFO to pitch (claim vibrato-span)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const hz = tap(theLab.render(nothing(), {}), 'pitchNow')
    expectWritten(range(hz).lo, '216.8 Hz')
    expectWritten(range(hz).hi, '223.2 Hz')
  })

  it("swings the Auto Filter's cutoff 3.0 octaves each way at 100 %, once every 0.200 s at 5 Hz (claim sweep-octaves)", async () => {
    const theLab = await lab('envelopes-and-lfos')
    const result = theLab.render(nothing(), { lfoAmount: 100 })
    const octaves = tap(result, 'sweep')
    expectWritten(range(octaves).hi, '3.0 octaves')
    expectWritten(-range(octaves).lo, '3.0 octaves')
    expectWritten(cycle(octaves, tick(0.5)), '0.200 s')
    // At half the amount, half the swing.
    const half = tap(theLab.render(nothing(), { lfoAmount: 50 }), 'sweep')
    expectWritten(range(half).hi, '1.5 octaves')
    // The device keeps the cutoff between 20 Hz and 20 kHz: from a Cutoff of 5 kHz the way up
    // is two octaves long, and from 100 Hz the way down is 2.32.
    const high = range(tap(theLab.render(nothing(), { lfoAmount: 100, cutoffHz: 5000 }), 'sweep'))
    expect(high.hi).toBeCloseTo(Math.log2(20000 / 5000), 3)
    expect(high.lo).toBeCloseTo(-3, 2)
    const low = range(tap(theLab.render(nothing(), { lfoAmount: 100, cutoffHz: 100 }), 'sweep'))
    expect(low.lo).toBeCloseTo(Math.log2(20 / 100), 3)
    expect(low.hi).toBeCloseTo(3, 2)
  })

  it("lets the kit's LFO gain on its own Rate: at 5 Hz its phase is 0.004 cycles ahead by the end of the loop, twice as far as at the start, and at 0.25 Hz it falls behind (claim kit-ahead)", async () => {
    const theLab = await lab('envelopes-and-lfos')
    // The loop is the lab's second pass: its point p stands 4 s and p points after the LFO was
    // started at phase 0. How far the kit's phase is ahead of the Rate times that time, in cycles.
    const ahead = (rate: number, p: number) => {
      const phase = tap(theLab.render(nothing(), { rate }), 'lfoPhase')
      const turned = rate * (4 + p / POINT_RATE)
      const gap = phase[p]! - (turned - Math.floor(turned))
      return gap - Math.round(gap)
    }
    const last = seconds(4) / 16 - 1
    // The first 20 ms of a looped tap are two passes crossed over: start after them.
    const first = points(0.02)
    expectWritten(ahead(5, last), '0.004 cycles')
    expect(ahead(5, last) / ahead(5, first)).toBeCloseTo(2, 1)
    expect(ahead(0.25, last)).toBeLessThan(-0.003)
  })

  it("lets the kit's LFO part from the Auto Filter's: at 100 % the furthest the cutoff stands from three times the kit's wave is under 0.05 octaves in the first second of the loop and 0.07 octaves in the last (claim in-step)", async () => {
    const theLab = await lab('envelopes-and-lfos')
    // Octaves between the cutoff and three times the kit's wave: the most, and how often over 0.1.
    const drift = (shape: number, from = 0, to = seconds(4) / 16) => {
      const result = theLab.render(nothing(), { lfoAmount: 100, shape })
      const octaves = tap(result, 'sweep')
      const kit = tap(result, 'lfo')
      let most = 0
      let over = 0
      for (let i = from; i < to; i += 1) {
        const far = Math.abs(octaves[i]! - 3 * kit[i]!)
        most = Math.max(most, far)
        if (far > 0.1) over += 1
      }
      return { most, over: over / (to - from) }
    }
    const whole = points(4)
    expectWritten(drift(0, points(0.02), points(1)).most, 'under 0.05 octaves')
    expectWritten(drift(0, whole - points(1), whole).most, '0.07 octaves')
    expectWritten(drift(0).most, '0.07 octaves')
    // The Triangle too. The Square's two waves agree but for the points where one has stepped
    // and the other has not yet.
    expect(drift(1).most).toBeLessThan(0.07)
    expect(drift(2).over).toBeLessThan(0.01)
  })

  it('keeps the follower at 0.16 over the second before the key goes up, moving by less than 0.002 between the teeth of the wave (claim follower-steady)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const level = range(tap(theLab.render(nothing(), {}), 'follower'), tick(1), tick(2))
    expectWritten(level.lo, '0.16')
    expectWritten(level.hi, '0.16')
    expectWritten(level.span, 'less than 0.002')
    // It is not standing still either: the saw wave is in it.
    expect(level.span).toBeGreaterThan(0.0005)
  })

  it('reads the follower at 0.206 at its highest on the note that opens its own filter, and lifts the cutoff 0.82 octaves (claim follower-lift)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const result = played(theLab, 'touch')
    const level = tap(result, 'follower')
    const octaves = tap(result, 'sweep')
    const top = range(level).hi
    const start = theLab.render(nothing(), {})
    expectWritten(top, '0.206')
    expectWritten(range(octaves).hi, '0.82 octaves')
    // Follower to cutoff is at 80 %: 0.8 x 5 octaves for a follower at 1.
    expect(range(octaves).hi / top).toBeCloseTo(4, 2)
    expect(range(octaves).lo).toBeGreaterThanOrEqual(0)
    // The follower never moves the cutoff at the lesson's start, where its amount is 0.
    expect(Math.abs(range(tap(start, 'sweep')).lo)).toBeLessThan(1e-6)
    expect(Math.abs(range(tap(start, 'sweep')).hi)).toBeLessThan(1e-6)
  })

  it("rings the note's first harmonic past full scale with Resonance at 25 and Cutoff at the note's 220 Hz: the output peaks at 5.6 times full scale, and under full scale at the lesson's own Resonance and Cutoff (claim loud-resonance)", async () => {
    const theLab = await lab('envelopes-and-lfos')
    const top = (result: RenderResult) =>
      Math.max(...result.taps.out!.channels_data.map((channel) => peak(channel)))
    const ringing = theLab.render(nothing(), { cutoffHz: 220, resonance: 25 })
    expectWritten(top(ringing), '5.6 times')
    // The page's player plays at a gain of one half at most: past 2 the ear gets a clipped wave.
    expect(top(ringing)).toBeGreaterThan(2)
    // The device's own range: the control's top is the top of the Auto Filter's Resonance.
    expect(theLab.description.controls.find((control) => control.id === 'resonance')!.max).toBe(25)
    // Where the lesson starts, the output stays under full scale.
    expect(top(theLab.render(nothing(), {}))).toBeLessThan(1)
  })

  it("moves the Tremolo's gain between 0.50 and 1.00 at an LFO to level of 0.5, and the gain worked out is the device's (claim gain-span)", async () => {
    const theLab = await lab('envelopes-and-lfos')
    const result = theLab.render(nothing(), { depth: 0.5 })
    const gain = tap(result, 'gain')
    expectWritten(range(gain).lo, '0.50')
    expectWritten(range(gain).hi, '1.00')
    expect(result.checks.gainRebuilt).toBeLessThan(-100)
    expect(theLab.render(nothing(), { depth: 1, shape: 2 }).checks.gainRebuilt).toBeLessThan(-100)
  })

  it("holds the Tremolo's LFO still while the device sleeps between notes: 0.63 s of the loop at the settings the lesson starts from, and not at all under a Release of 1.5 s (claim trem-sleeps)", async () => {
    const theLab = await lab('envelopes-and-lfos')
    const result = theLab.render(nothing(), {})
    const own = tap(result, 'tremLfo')
    expectWritten(longestStill(own), '0.63 s')
    // LFO to level has no part in it.
    expectWritten(longestStill(tap(theLab.render(nothing(), { depth: 0.5 }), 'tremLfo')), '0.63 s')
    // A note that is still dying when the next begins leaves no silence to sleep in.
    const ringing = theLab.render(nothing(), { release: 1.5 })
    expect(longestStill(tap(ringing, 'tremLfo'))).toBeLessThan(0.01)
    // The kit's never stands still for more than a point or two at its turns.
    expect(longestStill(tap(result, 'lfo'))).toBeLessThan(0.01)
    // Awake, it turns at the same rate as the other two.
    expectWritten(cycle(own, tick(0.5)), '0.200 s')
  })

  it("holds each random value for a cycle in the kit's LFO and the Auto Filter's, and glides between them in the Tremolo's", async () => {
    const theLab = await lab('envelopes-and-lfos')
    const result = theLab.render(nothing(), { shape: 3, lfoAmount: 100, depth: 1, hold: 3.5 })
    // The steepest move between two points of each line, while the note sounds.
    const steepest = (x: Float32Array) => {
      let most = 0
      for (let i = tick(0.5); i < tick(3); i += 1)
        most = Math.max(most, Math.abs(x[i]! - x[i - 1]!))
      return most
    }
    // How much of that stretch a line spends standing still.
    const still = (x: Float32Array) => {
      let count = 0
      for (let i = tick(0.5); i < tick(3); i += 1) if (x[i] === x[i - 1]) count += 1
      return count / (tick(3) - tick(0.5))
    }
    expect(still(tap(result, 'lfo'))).toBeGreaterThan(0.95)
    expect(still(tap(result, 'sweep'))).toBeGreaterThan(0.9)
    expect(still(tap(result, 'tremLfo'))).toBeLessThan(0.1)
    expect(steepest(tap(result, 'tremLfo'))).toBeLessThan(0.05)
    // Each draws numbers of its own: the cutoff is seldom at three times the kit's value.
    const kit = tap(result, 'lfo')
    const octaves = tap(result, 'sweep')
    let together = 0
    for (let i = tick(0.5); i < tick(3); i += 1) {
      if (Math.abs(octaves[i]! - 3 * kit[i]!) < 0.1) together += 1
    }
    expect(together / (tick(3) - tick(0.5))).toBeLessThan(0.05)
  })

  it('draws the six shapes of the kit LFO as the lesson says them', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const result = theLab.render(nothing(), {})
    const shape = (id: string) => tap(result, id)
    const perCycle = 120
    // Sine: starts at zero going up, top a quarter of the way through.
    expect(shape('shapeSine')[0]).toBeCloseTo(0, 5)
    expect(shape('shapeSine')[perCycle / 4]).toBeCloseTo(1, 3)
    // Triangle: starts at the bottom, top half way.
    expect(shape('shapeTriangle')[0]).toBeCloseTo(-1, 5)
    expect(shape('shapeTriangle')[perCycle / 2]).toBeCloseTo(1, 3)
    // Falling saw: starts at the top and comes down in a straight line.
    expect(shape('shapeSaw')[0]).toBeCloseTo(1, 5)
    expect(shape('shapeSaw')[perCycle / 2]).toBeCloseTo(0, 3)
    // Square: the top for half the cycle, the bottom for the other half.
    expect(range(shape('shapeSquare'), 1, perCycle / 2 - 1)).toMatchObject({ lo: 1, hi: 1 })
    expect(range(shape('shapeSquare'), perCycle / 2 + 2, perCycle - 2)).toMatchObject({
      lo: -1,
      hi: -1,
    })
    // Random steps: one value a cycle, a new one each cycle.
    const steps = shape('shapeSteps')
    const values = [0, 1, 2, 3].map((c) => steps[c * perCycle + perCycle / 2]!)
    for (let c = 0; c < 4; c += 1) {
      expect(range(steps, c * perCycle + 2, (c + 1) * perCycle - 2).span).toBe(0)
    }
    expect(new Set(values).size).toBe(4)
    // Random glide: starts each cycle where the steps stand and never jumps.
    const glide = shape('shapeGlide')
    expect(glide[0]).toBeCloseTo(values[0]!, 5)
    let steepest = 0
    for (let p = 1; p < glide.length; p += 1)
      steepest = Math.max(steepest, Math.abs(glide[p]! - glide[p - 1]!))
    expect(steepest).toBeLessThan(0.06)
  })

  // ---- part 4: the build, and each piece switched off -------------------------------------------

  it('reaches the top 0.200 s after the key goes down once the attack is built, and at once without it (claim built-attack)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const top = (build: number) =>
      sinceDown(tap(theLab.render(nothing(), { build }), 'builtEnvelope'), (v) => v >= 1)
    expectWritten(top(STEP.attack), '0.200 s')
    expect(matchesWritten(top(STEP.gate), '0.200 s')).toBe(false)
    expect(top(STEP.gate)).toBe(0)
  })

  it('stands at 0.5005 half a second after the top once the decay is built, and at the top without it (claim built-decay)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const later = (build: number) => {
      const level = tap(theLab.render(nothing(), { build }), 'builtEnvelope')
      // Without the decay the level stays at the top: the first point there is the top.
      const top = build < STEP.decay ? firstAt(level, (v) => v >= 1) : topOf(level)
      return level[top + points(0.5)]!
    }
    expectWritten(later(STEP.decay), '0.5005')
    expect(matchesWritten(later(STEP.attack), '0.5005')).toBe(false)
    expect(later(STEP.attack)).toBe(1)
  })

  it('is 60.0 dB down 0.8 s after the key is let go once the release is built, and gone at once without it (claim built-release)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const fallen = (build: number) => {
      const level = tap(theLab.render(nothing(), { build }), 'builtEnvelope')
      const up = tick(2)
      return {
        before: level[up - 1]!,
        db: -gainToDb(level[up + points(0.8)]! / level[up - 1]!),
        next: level[up]!,
      }
    }
    const withIt = fallen(STEP.release)
    const without = fallen(STEP.decay)
    expectWritten(withIt.db, '60.0 dB')
    expect(matchesWritten(without.db, '60.0 dB')).toBe(false)
    expectWritten(without.before, '0.5')
    expect(without.next).toBe(0)
    // With it, the first point after the key goes up is still almost where it was.
    expect(withIt.next).toBeGreaterThan(0.49)
  })

  it('turns once every 0.200 s once the LFO is built, and not at all without it (claim built-lfo)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const wave = (build: number) => tap(theLab.render(nothing(), { build }), 'builtLfo')
    expectWritten(cycle(wave(STEP.lfo)), '0.200 s')
    expect(matchesWritten(cycle(wave(STEP.release)), '0.200 s')).toBe(false)
    expect(range(wave(STEP.release))).toMatchObject({ lo: 0, hi: 0 })
    // Built but sent nowhere, it leaves the note as it was.
    const before = theLab.render(nothing(), { build: STEP.release })
    const after = theLab.render(nothing(), { build: STEP.lfo })
    expect(apart(tap(before, 'built'), tap(after, 'built'))).toBe(0)
  })

  it('bends the built tone between 216.8 Hz and 223.2 Hz once the LFO has a destination, and leaves it at 220 Hz without one (claim built-vibrato)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const hz = (build: number) => range(tap(theLab.render(nothing(), { build }), 'builtPitch'))
    expectWritten(hz(STEP.destination).lo, '216.8 Hz')
    expectWritten(hz(STEP.destination).hi, '223.2 Hz')
    expect(matchesWritten(hz(STEP.lfo).lo, '216.8 Hz')).toBe(false)
    expect(matchesWritten(hz(STEP.lfo).hi, '223.2 Hz')).toBe(false)
    expect(hz(STEP.lfo)).toMatchObject({ lo: 220, hi: 220 })
  })

  // ---- the cards --------------------------------------------------------------------------------

  it('renders every named set: what it plays is sound, finite, not silent and under full scale', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const peaks: Record<string, number> = {}
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = played(theLab, name)
      const heard = result.taps[set.tap ?? 'out']!
      expect(heard.kind, name).toBe('audio')
      const data = heard.channels_data[0]!
      expect(
        data.every((v) => Number.isFinite(v)),
        name,
      ).toBe(true)
      // Over the whole loop: the faintest is the fault whose note never arrives, a tenth of a
      // second of key under a slow attack, and it still peaks over 0.1.
      expect(gainToDb(rms(data)), name).toBeGreaterThan(-45)
      expect(peak(data), name).toBeGreaterThan(0.1)
      peaks[name] = peak(data)
    }
    for (const [name, top] of Object.entries(peaks)) expect(top, name).toBeLessThan(1)
  })

  it('ends the plucked note by itself, 1.00 s after the key goes down, with the key still held (claim pluck-over)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const result = played(theLab, 'pluck')
    const env = tap(result, 'envelope')
    const over = firstAt(env, (v) => v === 0, tick(0.1))
    expectWritten((over - tick(0)) / POINT_RATE, '1.00 s')
    // The key is still held then: it goes up a second later.
    expect(tap(result, 'gate')[over]).toBe(1)
    expect(over).toBeLessThan(tick(2))
  })

  it('starts the note of the card that speaks at once at 0.002, where the switched tone starts at 0.23, and moves its level by less than 0.01 a sample at either end (claim organ-start)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const result = played(theLab, 'organ')
    const note = tap(result, 'note')
    expect(note[DOWN - 1]).toBe(0)
    expectWritten(Math.abs(note[DOWN]!), '0.002')
    expectWritten(Math.abs(tap(played(theLab, 'switched'), 'gated')[DOWN]!), '0.23')
    // The level itself: the note over the tone, wherever the tone is not near zero, and how
    // far it moves a sample between one such place and the next. The gate moves by 1 in one.
    const tone = tap(result, 'tone')
    let most = 0
    let before = 0
    let last = DOWN - 1
    for (let i = DOWN; i < note.length; i += 1) {
      if (Math.abs(tone[i]!) < 0.05) continue
      const level = note[i]! / tone[i]!
      most = Math.max(most, Math.abs(level - before) / (i - last))
      before = level
      last = i
    }
    expectWritten(most, 'less than 0.01')
    expect(most).toBeGreaterThan(0.005)
  })

  it('alternates the trill between 207.7 Hz and 233.1 Hz, a semitone either side of 220 Hz (claim trill)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const hz = tap(played(theLab, 'trill'), 'pitchNow')
    expectWritten(range(hz).lo, '207.7 Hz')
    expectWritten(range(hz).hi, '233.1 Hz')
    // Only those two pitches: a square wave has no in-between.
    const between = hz.filter((v) => v > 208 && v < 233)
    expect(between.length).toBeLessThan(hz.length / 50)
  })

  it('has the level at 0.18 when a key held for 0.1 s is let go under an Attack of 1 s (claim short-top)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const env = tap(played(theLab, 'short'), 'envelope')
    expectWritten(range(env).hi, '0.18')
  })

  it('starts the next note from 0.16, not from silence, when a Release of 3 s meets a gap of half a second (claim overlap-start)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const result = played(theLab, 'overlap')
    const env = tap(result, 'envelope')
    expectWritten(env[tick(0) - 1]!, '0.16')
    expect(range(env).lo).toBeGreaterThan(0.15)
    // The level rises from there without a jump: the attack starts from where the level stands.
    expect(env[tick(0)]! - env[tick(0) - 1]!).toBeLessThan(0.01)
    expect(env[tick(0) + 30]!).toBeGreaterThan(env[tick(0)]!)
  })

  it('reaches the top in 48 samples with Attack at its shortest, 0.001 s (claim click-attack)', async () => {
    const theLab = await lab('envelopes-and-lfos')
    const result = played(theLab, 'click')
    // To the sample, and on the line, whose points stand 16 samples apart.
    expectWritten(topAfter(result), '48 samples')
    expectWritten(sinceDown(tap(result, 'envelope'), (v) => v >= 1) * RATE, '48 samples')
  })

  it("has the two LFOs of the last fault at one rate and out of step: the Tremolo's wave rises 0.06 s after the cutoff does, an eighth of their cycle (claim apart-offset)", async () => {
    const theLab = await lab('envelopes-and-lfos')
    const result = played(theLab, 'apart')
    const filter = tap(result, 'sweep')
    const trem = tap(result, 'tremLfo')
    expect(cycle(filter, tick(0.5))).toBeCloseTo(0.5, 2)
    expect(cycle(trem, tick(0.5))).toBeCloseTo(0.5, 2)
    // Each line's first rise through zero from half a second into the note, and how long after
    // the cutoff's the Tremolo's comes, within one cycle.
    const rise = (x: Float32Array) => risings(x).find((i) => i >= tick(0.5))! / POINT_RATE
    const late = (((rise(trem) - rise(filter)) % 0.5) + 0.5) % 0.5
    expectWritten(late, '0.06 s')
    expect(late / 0.5).toBeCloseTo(1 / 8, 2)
    // The device sleeps in this card's loop: that is where its wave fell behind.
    expect(longestStill(trem)).toBeGreaterThan(0.5)
  })

  it("starts the page's device table from the Auto Filter's own defaults: the settings file's defaults are device.json's, and differ from the lab's start", async () => {
    const theLab = await lab('envelopes-and-lfos')
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/auto-filter/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const own = Object.fromEntries(device.params.map((one) => [one.key, one.default]))
    const { values } = resolveSet(theLab.description, { values: settings.defaults!.values })
    // Every control of the lab that is a parameter of the device stands at the device's default.
    // Four have the device's own ids. Rate and Shape set its LFO Rate and LFO Shape, and the
    // Shape's first choice is the device's first, the Sine.
    const shared = theLab.description.controls.filter((one) => own[one.id] !== undefined)
    expect(shared.map((one) => one.id)).toEqual(['cutoffHz', 'resonance', 'lfoAmount', 'envAmount'])
    for (const control of shared) expect(values[control.id]).toBe(own[control.id])
    expect(values.rate).toBe(own.lfoRateHz)
    expect(values.shape).toBe(own.lfoShape)
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(settings.defaults!.values)) {
      expect(theLab.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
  })

  it("plays the page's first sound, the output at the start settings, between -36 and -5 dB and under full scale", async () => {
    const theLab = await lab('envelopes-and-lfos')
    const out = tap(theLab.render(nothing(), {}), 'out')
    expect(gainToDb(rms(out))).toBeGreaterThan(-36)
    expect(gainToDb(rms(out))).toBeLessThan(-5)
    expect(peak(out)).toBeLessThan(1)
  })
})
