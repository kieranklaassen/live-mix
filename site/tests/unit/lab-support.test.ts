// The checks the lab tests share (tests/labs/support.ts), each shown to pass what is sound and
// to fail what is broken. Nothing here loads a built lab: the taps are made in this file, as
// site/labs/lab.h makes them, and the labs are stand-ins written out below.

import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult, TapData, Values } from '../../src/lab/runner.ts'
import {
  click,
  differenceDb,
  expectBuild,
  expectRoomForChecks,
  expectSoundLab,
  expectWritten,
  FADE,
  gainToDb,
  kinks,
  largestDifference,
  loops,
  matchesWritten,
  noise,
  onsetMs,
  POINT_RATE,
  points,
  range,
  RATE,
  seconds,
  sine,
  suddenness,
  type Source,
} from '../labs/support.ts'

/**
 * A tap as lab.h keeps it: of three passes of the loop, the second, with the first 20 ms of the
 * third crossfaded into its start. `fade` off leaves the second pass as it fell: a lab whose
 * crossfade was taken out.
 */
function kept(passes: Float32Array, frames: number, fade: boolean): Float32Array {
  const tap = passes.slice(frames, 2 * frames)
  if (!fade) return tap
  for (let j = 0; j < FADE; j += 1) {
    const third = passes[2 * frames + j]!
    tap[j] = third + (tap[j]! - third) * (j / FADE)
  }
  return tap
}

/**
 * Three passes of a one-second loop through four one-pole low-passes whose cutoff wanders at
 * 0.11 Hz, so the sound at the end of a pass is not the sound at its start: what a chorus, a
 * filter with a slow sweep or a reverb's tail does to a loop.
 */
function wandering(loop: Float32Array): Float32Array {
  const frames = loop.length
  const out = new Float32Array(2 * frames + FADE)
  const state = [0, 0, 0, 0]
  for (let i = 0; i < out.length; i += 1) {
    const hz = 400 * 2 ** (0.3 * Math.sin((2 * Math.PI * 0.11 * i) / RATE))
    const keep = Math.exp((-2 * Math.PI * hz) / RATE)
    let v = loop[i % frames]!
    for (let pole = 0; pole < 4; pole += 1) {
      state[pole] = v + (state[pole]! - v) * keep
      v = state[pole]!
    }
    out[i] = v
  }
  return out
}

/** The comparison the lab tests made before: the step across the wrap against the largest step anywhere. */
function largestStepPasses(x: Float32Array): boolean {
  let inside = 0
  for (let i = 1; i < x.length; i += 1) inside = Math.max(inside, Math.abs(x[i]! - x[i - 1]!))
  return Math.abs(x[0]! - x[x.length - 1]!) <= inside
}

const saw = (frames: number) =>
  Float32Array.from({ length: frames }, (_, i) => 0.25 * (2 * (((i * 110) / RATE) % 1) - 1))

describe('the wrap check', () => {
  const loopsOf = { noise: noise(0.25, RATE).left, saw: saw(RATE) }

  for (const [name, loop] of Object.entries(loopsOf)) {
    it(`fails a tap whose crossfade was taken out, on ${name}, where the largest step passed it`, () => {
      const passes = wandering(loop)
      const cut = kept(passes, RATE, false)
      expect(largestStepPasses(cut)).toBe(true)
      expect(loops(cut)).toBe(false)
      const { wrap, around, floor } = kinks(cut)
      expect(wrap).toBeGreaterThan(5 * Math.max(2 * around, floor))
    })

    it(`passes the same tap with its crossfade, on ${name}`, () => {
      const faded = kept(wandering(loop), RATE, true)
      expect(loops(faded)).toBe(true)
      const { wrap, around, floor } = kinks(faded)
      expect(wrap).toBeLessThan(0.2 * Math.max(2 * around, floor))
    })
  }

  it('fails a sine seated half a hundredth of a cycle off, which the largest step passed', () => {
    const whole = sine(440, 0.5, RATE).left
    expect(loops(whole)).toBe(true)
    const off = sine(440.005, 0.5, RATE).left
    expect(largestStepPasses(off)).toBe(true)
    expect(loops(off)).toBe(false)
  })

  it('allows the corner a straight crossfade leaves, and no step', () => {
    // One slow cycle a pass, which comes round by itself, and on it a swell 10 ms wide that
    // peaks 0.3 high across the wrap. The second pass has the swell at its end and not yet at
    // its start: the crossfade brings the start in from the third pass, which has it.
    const wave = (i: number) => 0.4 * Math.cos((2 * Math.PI * i) / RATE)
    const swell = (away: number) => (away < 240 ? 0.15 * (1 + Math.cos((Math.PI * away) / 240)) : 0)
    const passes = Float32Array.from({ length: 2 * RATE + FADE }, (_, i) => {
      if (i < RATE) return wave(i)
      if (i < 2 * RATE) return wave(i) + swell(2 * RATE - i)
      return wave(i) + swell(i - 2 * RATE)
    })
    const faded = kept(passes, RATE, true)
    const { wrap, around, floor } = kinks(faded)
    // The crossfade starts with a change of slope, the swell's height spread over 20 ms, which
    // nothing near it matches:
    expect(wrap).toBeCloseTo(0.3 / FADE, 5)
    expect(wrap).toBeGreaterThan(10 * around)
    // and that much is allowed, being no step.
    expect(wrap).toBeLessThan(floor)
    expect(loops(faded)).toBe(true)
    expect(loops(kept(passes, RATE, false))).toBe(false)
  })

  it('holds a loop that starts on a click to the same click elsewhere in it', () => {
    const twice = click(RATE, 0).left
    twice[RATE / 2] = 1
    expect(loops(twice)).toBe(false)
    expect(loops(twice, true)).toBe(true)
    // A step larger than the click is still a step: the loop climbs 8 and falls back at the wrap.
    const stepped = twice.map((v, i) => v + (8 * i) / RATE)
    expect(loops(stepped, true)).toBe(false)
  })

  it('reads silence and a flat level as looping', () => {
    expect(loops(new Float32Array(RATE))).toBe(true)
    expect(loops(new Float32Array(RATE).fill(0.3))).toBe(true)
  })
})

describe('suddenness', () => {
  const at = seconds(0.25)
  const bed = noise(0.5, seconds(0.5)).left
  const withEvent = (event: (since: number) => number) =>
    bed.map((v, i) => (i >= at ? v + event(i - at) : v))

  it('reads a jump as 1 under a bright sound', () => {
    expect(
      suddenness(
        withEvent(() => 0.01),
        bed,
        at,
      ),
    ).toBeCloseTo(1, 4)
  })

  it('reads a fade of 20 ms as small', () => {
    // The fade has come 7 samples of its 960 within the first 8.
    const fade = suddenness(
      withEvent((since) => 0.01 * Math.min(1, since / FADE)),
      bed,
      at,
    )
    expect(fade).toBeGreaterThan(0)
    expect(fade).toBeLessThan(0.01)
  })

  it('reads 0 where the event changes nothing', () => {
    expect(suddenness(bed, bed, at)).toBe(0)
  })
})

describe('the onset', () => {
  it('reads 10 ms on a ramp built to reach half its peak at 10 ms', () => {
    // 20 ms from nothing to 1, then held: half way at sample 480.
    const ramp = Float32Array.from({ length: seconds(0.1) }, (_, i) => Math.min(1, i / 960))
    expect(onsetMs(ramp)).toBe(10)
    // A ramp a fifth slower is 12 ms, and not the 10 a sentence would have written.
    const slower = Float32Array.from({ length: seconds(0.1) }, (_, i) => Math.min(1, i / 1152))
    expect(onsetMs(slower)).toBe(12)
    expect(matchesWritten(onsetMs(slower), '10 ms')).toBe(false)
  })

  it('counts from where it is told, in the points of a control tap', () => {
    // A lane at 3,000 points a second: flat for 100 points, then 60 points down to −12.
    const lane = Float32Array.from({ length: 400 }, (_, p) => -12 * Math.min(1, (p - 100) / 60))
    lane.fill(0, 0, 100)
    expect(onsetMs(lane, 100, POINT_RATE)).toBe(10)
  })
})

describe('the small helpers the lab tests share', () => {
  it('places a click', () => {
    const one = click(8, 3, 0.5)
    expect([...one.left]).toEqual([0, 0, 0, 0.5, 0, 0, 0, 0])
    expect([...one.right]).toEqual([...one.left])
    expect(click(4).left[0]).toBe(1)
  })

  it('finds the least, the most and how far apart they are', () => {
    expect(range([3, -1, 4, 1, -5, 9])).toEqual({ lo: -5, hi: 9, span: 14 })
    expect(range([3, -1, 4, 1, -5, 9], 0, 4)).toEqual({ lo: -1, hi: 4, span: 5 })
  })

  it('counts samples and points', () => {
    expect(RATE).toBe(48000)
    expect(POINT_RATE).toBe(3000)
    expect(seconds(0.5)).toBe(24000)
    expect(points(0.5)).toBe(1500)
  })
})

describe('a gain in decibels', () => {
  it('has a floor of −180 dB, which silence and anything under a billionth read', () => {
    expect(gainToDb(1)).toBe(0)
    expect(gainToDb(0.5)).toBeCloseTo(-6.0206, 4)
    expect(gainToDb(1e-9)).toBeCloseTo(-180, 9)
    expect(gainToDb(1e-12)).toBeCloseTo(-180, 9)
    expect(gainToDb(0)).toBeCloseTo(-180, 9)
  })
})

describe('two taps, sample for sample', () => {
  const tone = sine(440, 0.5, 4800).left

  it('are 0 apart when every sample is the same number, and only then', () => {
    expect(largestDifference(tone, tone.slice())).toBe(0)
    const moved = tone.slice()
    // The next number a sample of this size can be: the smallest difference there is.
    moved[1000] = Math.fround(moved[1000]! * (1 + 2 ** -23))
    expect(moved[1000]).not.toBe(tone[1000])
    expect(largestDifference(tone, moved)).toBe(Math.abs(moved[1000]! - tone[1000]!))
    expect(largestDifference(moved, tone)).toBe(largestDifference(tone, moved))
  })

  it('find a difference that a level in decibels reads as its floor', () => {
    const moved = tone.slice()
    moved[1000] = Math.fround(moved[1000]! * (1 + 2 ** -23))
    // One sample a hair off in a tenth of a second of tone: the level of the difference is
    // under the floor, which is all a reading of the floor says.
    expect(differenceDb(moved, tone)).toBe(-140)
    expect(largestDifference(moved, tone)).toBeGreaterThan(0)
  })

  it('is the largest difference there is, over the stretch asked for', () => {
    const a = Float32Array.of(0, 0.5, -0.25, 1)
    const b = Float32Array.of(0, 0.25, 0.25, 1)
    expect(largestDifference(a, b)).toBe(0.5)
    expect(largestDifference(a, b, 0, 2)).toBe(0.25)
    expect(largestDifference(a, b, 3)).toBe(0)
  })

  it('is no number at all where one tap has a sample the other lacks, or a sample is none', () => {
    const a = Float32Array.of(0, 0.5, -0.25, 1)
    expect(largestDifference(a, a.slice(0, 3))).toBe(Infinity)
    expect(largestDifference(a.slice(0, 3), a)).toBe(Infinity)
    expect(largestDifference(a, a.slice(0, 3), 0, 3)).toBe(0)
    expect(largestDifference(a, Float32Array.of(0, NaN, -0.25, 1))).toBeNaN()
  })
})

describe('the checks a lab declares', () => {
  const read = (file: string) => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8')

  it('fail the lab’s test when there are more than a lab may declare, with both numbers', () => {
    expect(() => expectRoomForChecks('falling', 33, 32)).toThrow(
      'site/labs/falling.cpp declares 33 checks, and a lab may declare 32',
    )
    expect(() => expectRoomForChecks('falling', 33, 32)).toThrow(
      'the last one declared is in no render',
    )
    expect(() => expectRoomForChecks('falling', 35, 32)).toThrow(
      'the last 3 declared are in no render',
    )
    expect(() => expectRoomForChecks('falling', 32, 32)).not.toThrow()
    expect(() => expectRoomForChecks('falling', 3, 32)).not.toThrow()
  })

  it('are counted by lab.h before the limit is looked at, and the count is in every built lab', () => {
    const header = read('labs/lab.h')
    expect(header).toMatch(
      /\+\+g_checks_declared;\s+if \(g_check_count < kMaxChecks\) g_checks\[g_check_count\+\+\] = this;/,
    )
    expect(header).toContain(
      'int lab_check_declared(void) { return lab::g_checks_declared; }\nint lab_check_limit(void) { return lab::kMaxChecks; }',
    )
    expect(read('scripts/build-labs.sh')).toMatch(/^\s+lab_check_declared lab_check_limit$/m)
  })

  it('have the limit the template states', () => {
    const [, limit] = /constexpr int kMaxChecks = (\d+);/.exec(read('labs/lab.h'))!
    expect(read('LESSONS.md')).toContain(`64 taps and ${limit} checks`)
  })
})

describe('a number as a lesson writes it', () => {
  it('allows half of the last digit written', () => {
    expect(matchesWritten(39.4, '39 ms')).toBe(true)
    expect(matchesWritten(39.6, '39 ms')).toBe(false)
    expect(matchesWritten(38.4, '39 ms')).toBe(false)
    expect(matchesWritten(0.424, '0.42 dB')).toBe(true)
    expect(matchesWritten(0.426, '0.42 dB')).toBe(false)
    expect(matchesWritten(9.04, '9.0 dB')).toBe(true)
    expect(matchesWritten(9.06, '9.0 dB')).toBe(false)
    expect(matchesWritten(9.06, '9 dB')).toBe(true)
  })

  it('reads a sign, a comma and a per cent', () => {
    expect(matchesWritten(-46.83, '−46.8 dB')).toBe(true)
    expect(matchesWritten(-46.83, '-46.8 dB')).toBe(true)
    expect(matchesWritten(46.83, '−46.8 dB')).toBe(false)
    expect(matchesWritten(23750.4, '23,750 Hz')).toBe(true)
    expect(matchesWritten(23751, '23,750 Hz')).toBe(false)
    expect(matchesWritten(63.2, '63 %')).toBe(true)
    expect(matchesWritten(63.2, '63%')).toBe(true)
  })

  it('reads a number in degrees, the sign against the number or a space off it', () => {
    expect(matchesWritten(19.44, '19.4°')).toBe(true)
    expect(matchesWritten(19.46, '19.4°')).toBe(false)
    expect(matchesWritten(-90.2, '−90°')).toBe(true)
    expect(matchesWritten(-90.6, '−90°')).toBe(false)
    expect(matchesWritten(19.44, '19.4 °')).toBe(true)
    expect(matchesWritten(170, 'less than 180°')).toBe(true)
    expect(matchesWritten(180, 'less than 180°')).toBe(false)
  })

  it('holds a stated bound', () => {
    expect(matchesWritten(0.0004, 'less than 0.001 dB')).toBe(true)
    expect(matchesWritten(0.002, 'less than 0.001 dB')).toBe(false)
    expect(matchesWritten(0.001, 'less than 0.001 dB')).toBe(false)
    expect(matchesWritten(0.001, 'at most 0.001 dB')).toBe(true)
    expect(matchesWritten(-104, 'under −100 dB')).toBe(true)
    expect(matchesWritten(61, 'more than 60 dB')).toBe(true)
    expect(matchesWritten(59, 'over 60 dB')).toBe(false)
    expect(matchesWritten(60, 'at least 60 dB')).toBe(true)
  })

  it('fails a string it cannot read', () => {
    for (const written of ['about 39 ms', 'thirty-nine ms', 'ms', '39ms', '']) {
      expect(() => matchesWritten(39, written), written).toThrow(/Not a number/)
    }
  })

  it('fails the test with the measurement and the sentence', () => {
    expect(() => expectWritten(39.4, '39 ms')).not.toThrow()
    expect(() => expectWritten(39.6, '39 ms')).toThrow(/measured 39.6.*"39 ms"/)
  })
})

/** What a stand-in lab gets wrong. */
interface Faults {
  /** The last step makes what the step before it made. */
  idleStep?: boolean
  /** The compared step is further from the engine than the lab's bound. */
  apart?: boolean
  /** The comparison was never written: the difference stands at 0 dB, as lab.h starts it. */
  unwritten?: boolean
  /** A step of the build changes the main path. */
  leaks?: boolean
  /** The build control changes nothing at all. */
  still?: boolean
  /** A control of the device moves the built taps and not the main path. */
  gainOnBuilt?: boolean
  /** A built lane that is one flat value at every step. */
  mute?: boolean
  /** The value the build control's first step stands at, where that is not 0. */
  from?: number
  /** A fourth choice of the build control, which makes what the third step made. */
  again?: boolean
  /**
   * Two more controls: Mode, off or on, and Tilt, which turns the main path down only while
   * Mode is on. `dead` leaves Tilt doing nothing in either mode.
   */
  moded?: boolean
  dead?: boolean
}

const BUILD_STEPS = ['A wire', 'Half as loud', 'And turned over']

/**
 * A lab with a build part, in TypeScript: the main path is the source times `gain`; the build
 * is a wire, then half as loud, then half as loud and turned over.
 */
function standIn(faults: Faults = {}): Lab {
  const info = (id: string, kind: 'audio' | 'control', channels: 1 | 2, index: number) => ({
    index,
    id,
    name: id,
    unit: '',
    kind,
    origin: 'lesson' as const,
    channels,
  })
  const taps = [
    info('out', 'audio', 2, 0),
    info('built', 'audio', 2, 1),
    info('builtLevel', 'control', 1, 2),
  ]
  const from = faults.from ?? 0
  const choices = faults.again ? [...BUILD_STEPS, 'All of it again'] : BUILD_STEPS
  const ranged = (index: number, id: string, initial: number, names: string[] = []) => ({
    index,
    id,
    name: id,
    unit: '',
    min: 0,
    max: 1,
    initial,
    scale: 'linear' as const,
    choices: names,
  })
  const data = (index: number, channels: Float32Array[]): TapData => ({
    ...taps[index]!,
    channels_data: channels,
    length: channels[0]!.length,
    x0: 0,
    x1: 0,
    columns: 0,
    log: false,
  })
  return {
    description: {
      sampleRate: RATE,
      maxFrames: 4 * RATE,
      controls: [
        {
          index: 0,
          id: 'gain',
          name: 'Gain',
          unit: '',
          min: 0,
          max: 1,
          initial: 0.5,
          scale: 'linear',
          choices: [],
        },
        {
          index: 1,
          id: 'build',
          name: 'Build',
          unit: '',
          min: from,
          max: from + choices.length - 1,
          initial: from,
          scale: 'linear',
          choices,
        },
        ...(faults.moded ? [ranged(2, 'mode', 0, ['Off', 'On']), ranged(3, 'tilt', 0.5)] : []),
      ],
      taps,
      checks: ['builtDifference', 'builtStep', 'builtBound'].map((id, index) => ({
        index,
        id,
        name: id,
        unit: '',
      })),
    },
    takesAux: false,
    spectrum: () => new Float32Array(0),
    render(source: Source, values: Values): RenderResult {
      const gain = values.gain ?? 0.5
      let step = faults.still ? 0 : Math.min(2, (values.build ?? from) - from)
      if (faults.idleStep && step === 2) step = 1
      const tilted = faults.moded && values.mode === 1
      const tilt = tilted ? 0.9 - (faults.dead ? 0 : 0.5 * (values.tilt ?? 0.5)) : 1
      const main = (faults.gainOnBuilt ? 0.5 : gain) * (faults.leaks && step === 2 ? 0.9 : 1) * tilt
      const size = [1, 0.5, -0.5][step]! * (faults.gainOnBuilt ? gain : 1)
      const lane = new Float32Array(Math.floor(source.left.length / 16))
      if (!faults.mute && step > 0) lane.forEach((_, p) => (lane[p] = size * source.left[16 * p]!))
      return {
        frames: source.left.length,
        ms: 0,
        taps: {
          out: data(0, [source.left.map((v) => main * v), source.right.map((v) => main * v)]),
          built: data(1, [source.left.map((v) => size * v), source.right.map((v) => size * v)]),
          builtLevel: data(2, [lane]),
        },
        checks: {
          builtDifference: faults.unwritten ? 0 : faults.apart ? -40 : -120,
          builtStep: 1,
          builtBound: -60,
        },
      }
    },
  }
}

describe('what a build part is held to', () => {
  const tone = sine(110, 0.5, RATE)

  it('passes a lab whose every step changes the built taps and nothing else', () => {
    expect(() => expectBuild(standIn(), tone)).not.toThrow()
  })

  it('fails a lab whose step changes nothing', () => {
    expect(() => expectBuild(standIn({ idleStep: true }), tone)).toThrow(
      /step 2 \(And turned over\) changes a built tap/,
    )
  })

  it('fails a lab whose compared step is further from the engine than its bound', () => {
    expect(() => expectBuild(standIn({ apart: true }), tone)).toThrow(
      /step 1 is within the lab's bound of what the engine made/,
    )
  })

  it('fails a lab that never wrote its comparison', () => {
    expect(() => expectBuild(standIn({ unwritten: true }), tone)).toThrow(
      /step 1 is within the lab's bound of what the engine made/,
    )
  })

  it('fails a lab whose build changes the main path', () => {
    expect(() => expectBuild(standIn({ leaks: true }), tone)).toThrow(
      /step 2 \(And turned over\) leaves tap out of the main path as it was/,
    )
  })

  it('fails a lab with a built tap that never says anything', () => {
    expect(() => expectBuild(standIn({ mute: true }), tone)).toThrow(
      /tap builtLevel says something at some step/,
    )
  })

  it('fails a lab with no build control', () => {
    const lab = standIn()
    lab.description.controls.pop()
    expect(() => expectBuild(lab, tone)).toThrow(/no build control/)
  })

  it('takes the number of steps for a build control that does not start at 0', () => {
    const lab = standIn({ from: 1 })
    expect(() => expectBuild(lab, tone)).toThrow(
      /the build control runs from its first step to its last/,
    )
    expect(() => expectBuild(lab, tone, {}, { steps: 3 })).not.toThrow()
  })

  it('takes the number of steps for a build control with a choice after the last step', () => {
    // The fourth choice makes what the third step made: it is no step of the build.
    const lab = standIn({ again: true })
    expect(() => expectBuild(lab, tone)).toThrow(/step 3 \(All of it again\) changes a built tap/)
    expect(() => expectBuild(lab, tone, {}, { steps: 3 })).not.toThrow()
  })

  it('still holds every step it was told of, and fails more steps than the control has', () => {
    expect(() =>
      expectBuild(standIn({ idleStep: true, again: true }), tone, {}, { steps: 3 }),
    ).toThrow(/step 2 \(And turned over\) changes a built tap/)
    expect(() => expectBuild(standIn({ from: 1, leaks: true }), tone, {}, { steps: 3 })).toThrow(
      /step 2 \(And turned over\) leaves tap out of the main path as it was/,
    )
    expect(() => expectBuild(standIn(), tone, {}, { steps: 4 })).toThrow(
      /the build control has a value for each of the 4 steps/,
    )
    expect(() => expectBuild(standIn(), tone, {}, { steps: 1 })).toThrow(
      /the build has two steps or more/,
    )
  })
})

describe('what every lab is held to, with a build part', () => {
  const tone = sine(110, 0.5, RATE)
  const held = (faults: Faults, source = tone) => {
    const lab = standIn(faults)
    return () => expectSoundLab(lab, source, lab.render(source, {}))
  }

  it('passes a lab whose build control moves only the built taps', () => {
    expect(held({})).not.toThrow()
  })

  it('fails a build control that moves no built tap', () => {
    expect(held({ still: true })).toThrow(/the build control changes a built tap/)
  })

  it('fails a control of the device that moves only the built taps', () => {
    expect(held({ gainOnBuilt: true })).toThrow(/control gain changes a tap of the main path/)
  })

  it('does not ask a built tap to say something at the first step', () => {
    // builtLevel is flat at step 0 by design: the wire has no meter yet.
    const lab = standIn()
    const flat = lab.render(tone, {}).taps.builtLevel!.channels_data[0]!
    expect(range(flat).span).toBe(0)
    expect(held({})).not.toThrow()
  })

  it('holds every tap to the click elsewhere when the source starts on a click', () => {
    const struck = click(RATE, 0)
    struck.left[RATE / 2] = 1
    struck.right[RATE / 2] = 1
    expect(held({}, struck)).not.toThrow()
  })

  it('passes a tap that starts on an event by design only when the test names it', () => {
    // The main path strikes a click as the loop starts and again half way.
    const lab = standIn()
    const plain = lab.render.bind(lab)
    lab.render = (source, values) => {
      const result = plain(source, values)
      for (const channel of result.taps.out!.channels_data) {
        channel[0]! += 0.5
        channel[RATE / 2]! += 0.5
      }
      return result
    }
    const result = lab.render(tone, {})
    expect(() => expectSoundLab(lab, tone, result)).toThrow(/tap out loops without a step/)
    expect(() => expectSoundLab(lab, tone, result, { steps: ['out'] })).not.toThrow()
  })

  it('lets a control that acts in one mode move nothing at the start, when told where it acts', () => {
    const lab = standIn({ moded: true })
    const result = lab.render(tone, {})
    expect(() => expectSoundLab(lab, tone, result)).toThrow(
      /control tilt changes a tap of the main path/,
    )
    expect(() => expectSoundLab(lab, tone, result, { when: { tilt: { mode: 1 } } })).not.toThrow()
  })

  it('fails such a control where it moves nothing at the settings it was given either', () => {
    const lab = standIn({ moded: true })
    const result = lab.render(tone, {})
    expect(() => expectSoundLab(lab, tone, result, { when: { tilt: { mode: 0 } } })).toThrow(
      /control tilt changes a tap of the main path with mode at 0/,
    )
    const dead = standIn({ moded: true, dead: true })
    expect(() =>
      expectSoundLab(dead, tone, dead.render(tone, {}), { when: { tilt: { mode: 1 } } }),
    ).toThrow(/control tilt changes a tap of the main path with mode at 1/)
  })

  it('fails a name it was given that is no control of the lab', () => {
    const lab = standIn({ moded: true })
    expect(() =>
      expectSoundLab(lab, tone, lab.render(tone, {}), { when: { tlit: { mode: 1 } } }),
    ).toThrow(/"tlit" is a control of the lab/)
  })

  it('fails a tap that steps at the wrap as it does nowhere else, named or not', () => {
    // A quarter of a cycle short of coming round: the loop ends half its peak away from its start.
    const off = sine(110.25, 0.5, RATE)
    const lab = standIn()
    const result = lab.render(off, {})
    expect(() => expectSoundLab(lab, off, result)).toThrow(/tap out loops without a step/)
    expect(() => expectSoundLab(lab, off, result, { steps: ['out', 'built'] })).toThrow(
      /tap out loops without a step/,
    )
  })
})
