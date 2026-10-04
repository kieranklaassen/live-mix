// The reverbs' displays against numbers worked out from each device's DSP by
// hand (and, where it says so, read off the device's own impulse response):
// how long each tail takes to fall 60 dB, when the first sounds arrive, the
// shapes a shaped reverb draws, and that what is drawn lands where those
// numbers say.

import { describe, expect, it } from 'vitest'
import { REVERB_DECAY_SECONDS } from '../../core/devices/native/ConvolverReverb'
import { type ParamSpec } from '../../core/params'
import { etherReverbLaw } from '../../dsp/devices/ether-reverb'
import { fdnReverbBreathLaw } from '../../dsp/devices/fdn-reverb'
import {
  BODY_HZ,
  REVERB_FACES,
  TOP_HZ,
  convolverDb,
  convolverSeconds,
  etherLaw,
  etherRt60,
  fdnBreath,
  fdnRt60,
  hallRt60,
  hallTripDb,
  loopRt60,
  onePoleLossDb,
  plateRt60,
  secondsText,
  shapedGain,
  shapedSmear,
  shapedTailLevel,
  shapedTailRt60,
  shapedTapSeconds,
  shapedTaps,
  shapedWetDb,
  springCascade,
  springDripDb,
  springRate,
  springRt60,
} from '../components/displays/reverb'
import { PLAIN_COLOURS } from '../components/display-kit'
import { type DisplayHandle, type PlateDisplay } from '../components/plate-display'
import {
  drawDisplay,
  runDisplay,
  stockDescriptors,
  testLevel,
  viewOf,
  type RecordingContext,
} from './display-harness'

const RATE = 48000
const descriptors = stockDescriptors()

function plate(id: string): { display: PlateDisplay; params: Record<string, ParamSpec> } {
  const face = REVERB_FACES[id]
  const descriptor = descriptors.get(id)
  if (!face || !descriptor) throw new Error(`no display or no device for ${id}`)
  return { display: face.display, params: descriptor.params }
}

function handlesOf(id: string, values: Record<string, number> = {}): Map<string, DisplayHandle> {
  const { display, params } = plate(id)
  const handles = display.handles?.(viewOf(display, params, { values })) ?? []
  return new Map(handles.map((handle) => [handle.key, handle]))
}

function take(handles: Map<string, DisplayHandle>, key: string): DisplayHandle {
  const handle = handles.get(key)
  if (!handle) throw new Error(`no handle "${key}"`)
  return handle
}

// The strip every reverb draws in is 184 by 48: the boxes are 4 in from the
// edge and leave 8 under them for the scale, so levels run from y 4 (the
// sound going in) to y 36 (60 dB under it).
const TOP_Y = 4
const FOOT_Y = 36
const yOfDb = (db: number): number => TOP_Y + (-db / 60) * (FOOT_Y - TOP_Y)
const dbOfY = (y: number): number => (-(y - TOP_Y) / (FOOT_Y - TOP_Y)) * 60
// A room's first moments are the left 30% of the 176 across, its tail the rest after a gap of 6.
const FIRST = { x: 4, w: 53 }
const TAIL = { x: 63, w: 117 }
const STRIP = { x: 4, w: 176 }

/** Every point a drawing's lines go through. */
function pointsOf(drawn: RecordingContext): [number, number][] {
  return drawn.calls
    .filter((call) => call.name === 'lineTo' || call.name === 'moveTo')
    .map((call) => [call.args[0] as number, call.args[1] as number])
}

describe('what the reverbs share', () => {
  it('works out a 60 dB time from a loop and what a trip round it loses', () => {
    // A second round, 6 dB each time: ten trips.
    expect(loopRt60(1, -6)).toBeCloseTo(10, 9)
    expect(loopRt60(0.5, -60)).toBeCloseTo(0.5, 9)
    // A loop that loses nothing never falls.
    expect(loopRt60(1, 0)).toBe(Infinity)
  })

  it('knows what a one-pole low-pass does to a frequency', () => {
    // y = (1 − a)·x + a·y1 at half the sample rate: (1 − a) / (1 + a) = 1/3, so 1/9 of the power.
    expect(onePoleLossDb(0.5, RATE / 2, RATE)).toBeCloseTo(10 * Math.log10(1 / 9), 6)
    // It passes DC whole, and with a = 0 it passes everything.
    expect(onePoleLossDb(0.9, 0, RATE)).toBeCloseTo(0, 9)
    expect(onePoleLossDb(0, 9000, RATE)).toBeCloseTo(0, 9)
  })

  it('says seconds as a scale says them', () => {
    expect(secondsText(0.25)).toBe('0.25s')
    expect(secondsText(0.2)).toBe('0.2s')
    expect(secondsText(1)).toBe('1s')
    expect(secondsText(3.46)).toBe('3.5s')
    expect(secondsText(24.4)).toBe('24s')
    expect(secondsText(Infinity)).toBe('∞')
  })

  it('reads the tail in the body of a sound and at the top of its spectrum', () => {
    expect(BODY_HZ).toBe(500)
    expect(TOP_HZ).toBe(8000)
  })

  it('gives every reverb a strip, the level of the sound and no meter', () => {
    const ids = [
      'convolver-reverb',
      'plate-reverb',
      'fdn-reverb',
      'hall-reverb',
      'spring-reverb',
      'shaped-reverb',
      'ether-reverb',
    ]
    expect(Object.keys(REVERB_FACES).sort()).toEqual([...ids].sort())
    for (const id of ids) {
      const { display } = plate(id)
      expect(display.place).toBe('strip')
      expect(display.live?.signal).toBe(true)
      expect(display.live?.meters ?? []).toEqual([])
    }
  })
})

describe('plate reverb', () => {
  it('falls 60 dB in the time its tank gives', () => {
    // Once round both halves: 672 + 4453 + 1800 + 3720 + 908 + 4217 + 2656 + 3163
    // = 21589 samples at 29761 Hz = 0.72541 s, through Decay four times.
    // Decay 0.5, no damping: 80·log10(0.5) = −24.082 dB a trip, so 60 · 0.72541 / 24.082 = 1.8073 s.
    expect(plateRt60(0.5, 0, BODY_HZ, RATE)).toBeCloseTo(1.8073, 3)
    // Decay 0.7 is −12.392 dB; damping 0.3 takes 0.0114 dB at 500 Hz, twice a trip:
    // 60 · 0.72541 / 12.415 = 3.506 s.
    expect(plateRt60(0.7, 0.3, BODY_HZ, RATE)).toBeCloseTo(3.506, 2)
  })

  it('loses its highs faster the more it is damped, and not at all undamped', () => {
    expect(plateRt60(0.7, 0, TOP_HZ, RATE)).toBeCloseTo(plateRt60(0.7, 0, BODY_HZ, RATE), 9)
    // Damping 0.3 at 8 kHz: 0.49 / (1.09 − 0.6·cos(π/3)) = 0.6203 of the power, −2.074 dB,
    // twice a trip on top of −12.392: 60 · 0.72541 / 16.540 = 2.632 s.
    expect(plateRt60(0.7, 0.3, TOP_HZ, RATE)).toBeCloseTo(2.632, 2)
    expect(plateRt60(0.7, 0.8, TOP_HZ, RATE)).toBeLessThan(plateRt60(0.7, 0.3, TOP_HZ, RATE))
  })

  it('writes that time and ends its tail there', () => {
    const { display, params } = plate('plate-reverb')
    const drawn = drawDisplay(display, params, { values: { decay: 0.7, damping: 0.3 } })
    expect(drawn.words()).toContain('3.5s')
    // The tail starts at the wet level and falls 60 dB in 3.506 s, so it is at the foot after
    // (60 − 9.12) / 60 of that, past the pre-delay and the plate's first tap (266 samples
    // along a first delay, at the tank's 29761 Hz).
    const mix = params.mix.default
    const onset = params.predelayMs.default / 1000 + 266 / 29761
    const reach = onset + (3.506 * (60 + 20 * Math.log10(mix))) / 60
    const end = take(handlesOf('plate-reverb'), 'decay')
    expect(end.y).toBeCloseTo(FOOT_Y, 6)
    // The scale stretches so that the whole tail ends where the knob says: 0.7 of the way from 0.3 to 0.94.
    const seconds = (onset + 3.506) / (0.3 + 0.64 * 0.7)
    expect(end.x).toBeCloseTo(TAIL.x + (reach / seconds) * TAIL.w, 0)
    expect(
      pointsOf(drawn).some(([x, y]) => Math.abs(x - end.x) < 0.01 && Math.abs(y - FOOT_Y) < 0.01),
    ).toBe(true)
  })

  it('starts the reverb after the pre-delay at the level of the mix', () => {
    const start = take(handlesOf('plate-reverb', { predelayMs: 100, mix: 0.5 }), 'start')
    // 100 ms and the first tap (8.9 ms), on the 0.4 s the first box spans; mix 0.5 is −6.02 dB.
    expect(start.x).toBeCloseTo(FIRST.x + ((0.1 + 266 / 29761) / 0.4) * FIRST.w, 3)
    expect(start.y).toBeCloseTo(yOfDb(-6.0206), 3)
    // Dragged to 200 ms and −12 dB.
    const set = start.drag(FIRST.x + ((0.2 + 266 / 29761) / 0.4) * FIRST.w, yOfDb(-12))
    expect(set.predelayMs).toBeCloseTo(200, 3)
    expect(set.mix).toBeCloseTo(Math.pow(10, -12 / 20), 3)
  })

  it('moves the end of its tail with Decay alone, and the highs with Damping alone', () => {
    const handles = handlesOf('plate-reverb')
    const end = take(handles, 'decay')
    expect(Object.keys(end.drag(end.x - 20, end.y))).toEqual(['decay'])
    expect(end.drag(end.x - 20, end.y).decay).toBeLessThan(0.7)
    expect(end.drag(end.x + 10, end.y).decay).toBeGreaterThan(0.7)
    const highs = take(handles, 'damping')
    expect(Object.keys(highs.drag(highs.x - 5, highs.y))).toEqual(['damping'])
    // Further left the highs are gone sooner: more damping.
    expect(highs.drag(highs.x - 5, highs.y).damping).toBeGreaterThan(0.3)
  })
})

describe('fdn reverb', () => {
  it('falls 60 dB in the Decay it is set to', () => {
    // The feedback gain is the one that makes Decay the RT60; at 500 Hz the damping at
    // its brightest and the DC blocker take 0.004 dB a trip of 4.33 dB between them.
    expect(fdnRt60(2, 0, 1, BODY_HZ, RATE)).toBeCloseTo(2, 1)
    expect(fdnRt60(2, 0, 1, BODY_HZ, RATE)).toBeGreaterThan(1.99)
    expect(fdnRt60(10, 0, 2, BODY_HZ, RATE)).toBeCloseTo(10, 0)
  })

  it('loses its highs to Damping: a cutoff swept from 20 kHz to 1 kHz', () => {
    // Damping 1 is a one-pole at 1 kHz, a = exp(−2π/48) = 0.87733. At 8 kHz it passes
    // 0.12267² / (1 + 0.7697 − 1.75466·0.5) = 0.01686 of the power, −17.73 dB a trip. The
    // mean line is 6372 samples at 44.1 kHz (6935 whole ones at 48 kHz), 0.14448 s, and
    // Decay 5 takes 1.734 dB there: 60 · 0.14448 / 19.47 = 0.445 s.
    expect(fdnRt60(5, 1, 1, TOP_HZ, RATE)).toBeCloseTo(0.445, 2)
    expect(fdnRt60(5, 0.4, 1, TOP_HZ, RATE)).toBeLessThan(fdnRt60(5, 0.4, 1, BODY_HZ, RATE))
  })

  it('breathes by the device’s own law', () => {
    for (const phase of [0, 0.1, 0.25, 0.5, 0.75, 0.9]) {
      for (const depth of [0, 0.3, 1]) {
        expect(fdnBreath(phase, depth)).toBeCloseTo(fdnReverbBreathLaw(phase, depth), 12)
      }
    }
  })

  it('answers after its shortest line, further off as Size grows', () => {
    // 4799 samples at 44.1 kHz are 5223 whole ones at 48 kHz: 108.8 ms at Size 1.
    const line = 5223 / RATE
    const small = take(handlesOf('fdn-reverb', { predelayMs: 0, size: 1 }), 'start')
    expect(small.x).toBeCloseTo(FIRST.x + (line / 0.6) * FIRST.w, 3)
    const big = take(handlesOf('fdn-reverb', { predelayMs: 0, size: 2 }), 'start')
    expect(big.x).toBeCloseTo(FIRST.x + ((2 * line) / 0.6) * FIRST.w, 3)
  })

  it('draws the breath only when there is one', () => {
    const { display, params } = plate('fdn-reverb')
    const flat = drawDisplay(display, params, { values: { breathDepth: 0 } })
    const deep = drawDisplay(display, params, { values: { breathDepth: 1 } })
    expect(deep.marks()).toBeGreaterThan(flat.marks())
  })
})

describe('hall reverb', () => {
  it('falls 60 dB in Mid decay, and in half of it at the Damping frequency', () => {
    // With Low decay the same the shelf is flat. At the Damping frequency the low-pass has
    // the loop's own gain once more, so a trip loses twice as much.
    expect(hallRt60(6000, 200, 2, 2, 6000, RATE)).toBeCloseTo(1, 3)
    // Far under the Damping frequency the low-pass passes nearly everything.
    expect(hallRt60(100, 200, 2, 2, 6000, RATE)).toBeCloseTo(2, 2)
  })

  it('falls in Low decay well under Crossover', () => {
    expect(hallRt60(10, 400, 6, 2, 6000, RATE)).toBeCloseTo(6, 1)
    // At Crossover itself the shelf is half way (in power) between the two.
    const mid = hallTripDb(0.2, 400, 400, 2, 2, 23000, RATE)
    const both = hallTripDb(0.2, 400, 400, 6, 2, 23000, RATE)
    // Mid gain 10^(−0.3) and low gain 10^(−0.1): the shelf is (10^0.4 + 1) / 2 = 1.756 of the power.
    expect(both - mid).toBeCloseTo(10 * Math.log10((Math.pow(10, 0.4) + 1) / 2), 2)
  })

  it('starts its reverb after the pre-delay and its shortest allpass, 7 dB under the mix', () => {
    // Mix 0.5 levelled: 0.5 / sqrt(0.25 + 0.2·0.25) = 0.9129, −0.79 dB, and the reverb's own −6.99.
    const start = take(handlesOf('hall-reverb', { preDelay: 60, mix: 0.5 }), 'start')
    expect(start.x).toBeCloseTo(FIRST.x + ((0.06 + 0.013458) / 0.4) * FIRST.w, 3)
    expect(start.y).toBeCloseTo(yOfDb(-0.792 - 6.99), 2)
  })

  it('draws a line for the lows only where they differ, and it is the longer one', () => {
    const { display, params } = plate('hall-reverb')
    const same = drawDisplay(display, params, { values: { lowDecay: 2, midDecay: 2 } })
    const longer = drawDisplay(display, params, { values: { lowDecay: 8, midDecay: 2 } })
    expect(longer.print()).not.toBe(same.print())
    expect(longer.words()).toEqual(same.words())
  })
})

describe('ether reverb', () => {
  it('keeps the device’s own law of decay, size and damping', () => {
    for (const [decay, size, damping] of [
      [0.5, 0, 0],
      [5, 0.6, 0.5],
      [30, 1, 1],
      [12, 0.3, 0.1],
    ]) {
      const law = etherReverbLaw(decay, size, damping, false)
      const ours = etherLaw(decay, size, damping, false)
      expect(ours.feedback).toBeCloseTo(law.feedback, 12)
      // The comb's own coefficient is 0.4 of the damping the law hands it.
      expect(ours.damp).toBeCloseTo(law.damping * 0.4, 12)
    }
    expect(etherLaw(5, 0.6, 0.5, true)).toEqual({ feedback: 1, damp: 0 })
  })

  it('falls 60 dB in the time its combs give', () => {
    // Decay 5, size 0.6: room 0.6 + 0.3·4.5/29.5 = 0.64576, feedback 0.88081, −1.1023 dB
    // a trip of the mean comb, 1378 samples at 44.1 kHz = 31.247 ms: 60 · 0.031247 / 1.1023 = 1.701 s.
    expect(etherRt60(5, 0.6, 0, false, BODY_HZ, RATE)).toBeCloseTo(1.701, 2)
    expect(etherRt60(5, 0.6, 0.5, false, TOP_HZ, RATE)).toBeLessThan(
      etherRt60(5, 0.6, 0.5, false, BODY_HZ, RATE),
    )
  })

  it('never falls while it is held, and says so', () => {
    expect(etherRt60(5, 0.6, 0.5, true, BODY_HZ, RATE)).toBe(Infinity)
    const { display, params } = plate('ether-reverb')
    const held = drawDisplay(display, params, { values: { freeze: 1 } })
    expect(held.words()).toContain('∞')
    // The tail runs level at the wet level, right across its box.
    const y = yOfDb(20 * Math.log10(params.mix.default))
    const level = pointsOf(held).filter(([, py]) => Math.abs(py - y) < 0.01)
    expect(Math.max(...level.map(([x]) => x))).toBeCloseTo(TAIL.x + TAIL.w, 3)
    // The end of the tail stays where letting go would put it.
    const free = take(handlesOf('ether-reverb', { freeze: 0 }), 'decay')
    const frozen = take(handlesOf('ether-reverb', { freeze: 1 }), 'decay')
    expect(frozen.x).toBeCloseTo(free.x, 6)
  })
})

describe('spring reverb', () => {
  it('runs its tank near twice the transition frequency', () => {
    expect(springRate(48000)).toBe(9600)
    expect(springRate(44100)).toBe(8820)
    expect(springRate(96000)).toBe(9600)
  })

  it('holds the highs of a bounce back: the chirp', () => {
    // A hundred allpasses (a + z⁻¹) / (1 + a·z⁻¹): 100·(1 − a)/(1 + a) samples at DC,
    // 100·(1 + a)/(1 − a) at half the rate. Tension 0.5 is a = 0.625.
    expect(springCascade(0.625, 0)).toBeCloseTo(23.077, 3)
    expect(springCascade(0.625, Math.PI)).toBeCloseTo(433.333, 3)
    // A taut spring (a = 0.8) spreads less far at 3.5 kHz than a slack one (a = 0.45).
    const w = (2 * Math.PI * 3500) / 9600
    expect(springCascade(0.8, w) - springCascade(0.8, 0)).toBeLessThan(
      springCascade(0.45, w) - springCascade(0.45, 0),
    )
  })

  it('falls 60 dB in its Decay at the low end, sooner higher up', () => {
    // The line makes up the round trip with what the cascade holds DC back, and the
    // loop's gain is the one that makes Decay the RT60 over that trip.
    expect(springRt60(2.5, 0.5, 20, RATE)).toBeCloseTo(2.5, 2)
    expect(springRt60(0.5, 0.5, 20, RATE)).toBeCloseTo(0.5, 2)
    expect(springRt60(2.5, 0.5, 3500, RATE)).toBeLessThan(springRt60(2.5, 0.5, 500, RATE))
  })

  it('lifts the trailing highs with Drip', () => {
    expect(springDripDb(0, 4000, RATE)).toBeCloseTo(0, 9)
    expect(Math.abs(springDripDb(1, 20, RATE))).toBeLessThan(0.1)
    // x + 4·highpass(x): at most five times, 13.98 dB.
    expect(springDripDb(1, 8000, RATE)).toBeGreaterThan(10)
    expect(springDripDb(1, 8000, RATE)).toBeLessThan(13.98)
  })

  it('lands its first bounce half a trip in', () => {
    // The pickup is half way round: 23.08 samples of cascade and 198 of line at 9.6 kHz, 23.0 ms.
    const first = (springCascade(0.625, 0) + 198) / 9600
    expect(first).toBeCloseTo(0.02303, 4)
    const start = take(
      handlesOf('spring-reverb', { predelay: 0, tension: 0.5, springs: 0 }),
      'start',
    )
    expect(start.x).toBeCloseTo(FIRST.x + (first / 0.25) * FIRST.w, 3)
    // With all three the shortest spring (35.6 ms round) is first: a = 0.645, 21.58 + 171 samples.
    const three = take(
      handlesOf('spring-reverb', { predelay: 0, tension: 0.5, springs: 2 }),
      'start',
    )
    expect(three.x).toBeCloseTo(
      FIRST.x + ((springCascade(0.645, 0) + 171) / 9600 / 0.25) * FIRST.w,
      3,
    )
  })

  it('draws more bounces for more springs, and other sweeps for another tension', () => {
    const { display, params } = plate('spring-reverb')
    const count = (springs: number): number =>
      drawDisplay(display, params, { values: { springs } }).calls.filter(
        (call) => call.name === 'lineTo',
      ).length
    expect(count(2)).toBeGreaterThan(count(1))
    expect(count(1)).toBeGreaterThan(count(0))
    const slack = drawDisplay(display, params, { values: { tension: 0 } })
    const taut = drawDisplay(display, params, { values: { tension: 1 } })
    expect(slack.print()).not.toBe(taut.print())
  })
})

describe('convolver reverb', () => {
  it('follows the envelope of its generated impulse', () => {
    // Noise under (1 − t / 2.6)^2.5: half way through it is 0.5^2.5, −15.05 dB.
    expect(REVERB_DECAY_SECONDS).toBe(2.6)
    expect(convolverDb(0)).toBeCloseTo(0, 9)
    expect(convolverDb(1.3)).toBeCloseTo(-15.051, 2)
    // 60 dB down where 1 − t / 2.6 = 10^(−60/50) = 0.0631: at 0.9369 of its length.
    expect(convolverSeconds(60)).toBeCloseTo(2.436, 3)
    expect(convolverDb(convolverSeconds(60))).toBeCloseTo(-60, 6)
    expect(convolverDb(2.7)).toBeLessThan(-100)
  })

  it('writes the time it takes to fall 60 dB and draws that curve', () => {
    const { display, params } = plate('convolver-reverb')
    const drawn = drawDisplay(display, params)
    expect(drawn.words()).toContain('2.4s')
    // Every point of the curve is the envelope under the wet level, on a box that spans 3 s.
    const wet = 20 * Math.log10(params.wet.default)
    const curve = pointsOf(drawn).filter(([x, y]) => {
      const seconds = ((x - STRIP.x) / STRIP.w) * 3
      return y < FOOT_Y - 0.5 && Math.abs(y - yOfDb(wet + convolverDb(seconds))) < 0.01
    })
    expect(curve.length).toBeGreaterThan(80)
    // It meets the foot where the envelope has fallen the rest of the way to −60.
    const reach = convolverSeconds(60 + wet)
    expect(
      pointsOf(drawn).some(
        ([x, y]) =>
          Math.abs(x - (STRIP.x + (reach / 3) * STRIP.w)) < 0.01 && Math.abs(y - FOOT_Y) < 0.01,
      ),
    ).toBe(true)
  })

  it('sets Wet with the start of the curve', () => {
    const start = take(handlesOf('convolver-reverb'), 'wet')
    expect(start.y).toBeCloseTo(yOfDb(20 * Math.log10(0.26)), 3)
    expect(start.drag(start.x, yOfDb(-6)).wet).toBeCloseTo(0.5012, 3)
    expect(start.drag(start.x + 30, start.y).wet).toBeCloseTo(0.26, 6)
  })
})

describe('shaped reverb', () => {
  const GATE = 0
  const REVERSE = 1
  const BLOOM = 2
  const FALL = 3
  const PULSE = 4

  it('draws the five shapes the device draws', () => {
    expect(shapedGain(GATE, 0)).toBe(1)
    expect(shapedGain(GATE, 1)).toBe(1)
    // Reverse: exp(−3.22·(1 − u)), 27.97 dB from end to end, faded in over the first twelfth.
    expect(shapedGain(REVERSE, 1)).toBeCloseTo(1, 9)
    expect(20 * Math.log10(shapedGain(REVERSE, 0.5))).toBeCloseTo(-13.98, 2)
    expect(shapedGain(REVERSE, 1 / 24)).toBeCloseTo(0.5 * Math.exp(-3.22 * (23 / 24)), 9)
    expect(shapedGain(REVERSE, 0)).toBe(0)
    // Bloom: sin(π·u^0.8)^1.2, at its top where u^0.8 = 0.5, u = 0.4204.
    expect(shapedGain(BLOOM, Math.pow(0.5, 1.25))).toBeCloseTo(1, 9)
    expect(shapedGain(BLOOM, 0)).toBe(0)
    expect(shapedGain(BLOOM, 1)).toBeLessThan(1e-12)
    expect(shapedGain(FALL, 0.25)).toBeCloseTo(0.75, 9)
    // Pulse: three humps of |sin(3π·u)|^1.5 under 1 − 0.3·u.
    expect(shapedGain(PULSE, 1 / 6)).toBeCloseTo(0.95, 9)
    expect(shapedGain(PULSE, 1 / 3)).toBeLessThan(1e-12)
    expect(shapedGain(PULSE, 5 / 6)).toBeCloseTo(0.75, 9)
    // Outside the span there is no shape.
    expect(shapedGain(GATE, -0.01)).toBe(0)
    expect(shapedGain(GATE, 1.01)).toBe(0)
  })

  it('counts its echoes and their smear as the device does', () => {
    // 8 a second at Density 0, 260 at 1, never fewer than 4 + 44·density, never more than 256.
    expect(shapedTaps(0, 0.9)).toBe(7)
    expect(shapedTaps(0.8, 0.9)).toBe(117)
    expect(shapedTaps(1, 0.9)).toBe(234)
    expect(shapedTaps(1, 4)).toBe(256)
    expect(shapedTaps(0.5, 0.1)).toBe(26)
    expect(shapedTaps(0, 0.1)).toBe(4)
    // 1.8 spacings, within 8 and 45 ms and a quarter of Time.
    expect(shapedSmear(0.9, 7)).toBeCloseTo(0.045, 9)
    expect(shapedSmear(0.9, 234)).toBeCloseTo(0.008, 9)
    expect(shapedSmear(0.9, 60)).toBeCloseTo(0.027, 9)
    expect(shapedSmear(0.1, 4)).toBeCloseTo(0.025, 9)
  })

  it('puts its echoes where the device’s are', () => {
    // Read off the device's impulse response (left side, Gate, Density 0, no pre-delay):
    // the seven echoes of Time 0.9 and the four of Time 0.5, in ms.
    const long = [123.34, 256.61, 335.78, 463.84, 578.01, 658.16, 813.76]
    long.forEach((ms, k) => expect(shapedTapSeconds(k, 7, 0.9, 0) * 1000).toBeCloseTo(ms, 0))
    const short = [118.03, 242.14, 315.87, 435.14]
    short.forEach((ms, k) => expect(shapedTapSeconds(k, 4, 0.5, 0) * 1000).toBeCloseTo(ms, 0))
    // Pre-delay moves them all.
    expect(shapedTapSeconds(0, 7, 0.9, 0.1)).toBeCloseTo(shapedTapSeconds(0, 7, 0.9, 0) + 0.1, 9)
  })

  it('knows the tail’s decay, its level and the level of the mix', () => {
    expect(shapedTailRt60(0)).toBeCloseTo(0.6, 9)
    expect(shapedTailRt60(0.5)).toBeCloseTo(1.897, 3)
    expect(shapedTailRt60(1)).toBeCloseTo(6, 9)
    expect(shapedTailLevel(0)).toBe(0)
    expect(shapedTailLevel(0.3)).toBeCloseTo(0.3782, 3)
    expect(shapedTailLevel(1)).toBeCloseTo(0.95, 9)
    // Equal power: all wet is 0 dB, half way −3.01; Repeat 0.6 takes back (1 − 0.36)^¼, 0.97 dB.
    expect(shapedWetDb(1, 0)).toBeCloseTo(0, 6)
    expect(shapedWetDb(0.5, 0)).toBeCloseTo(-3.0103, 3)
    expect(shapedWetDb(1, 0.6)).toBeCloseTo(-0.969, 2)
  })

  // A plain setting: no pre-delay, no colour, the cut filters out of the way, nothing after the shape.
  const plain = {
    preDelay: 0,
    colour: 0,
    highCut: 18000,
    lowCut: 20,
    modulation: 0,
    repeat: 0,
    tail: 0,
    density: 0.8,
    mix: 0.4,
    time: 0.9,
  }
  // Time 0.9 on its log scale from 0.1 to 4 is 0.5956 of the way; the shape ends 0.28 + 0.32 of that across.
  const across = (0.28 + 0.32 * (Math.log(9) / Math.log(40))) * STRIP.w
  const seconds = (0.901 * STRIP.w) / across
  const xOf = (t: number): number => STRIP.x + (t / seconds) * STRIP.w
  // Mix 0.4 is sin(0.2π) = 0.5878, −4.616 dB.
  const wet = 20 * Math.log10(Math.sin(0.2 * Math.PI))
  // Density 0.8 is 8·32.5^0.8 = 129.6 echoes a second, 117 in 0.9 s, each drawn out by
  // 1.8·0.9/117 = 13.8 ms: the shape starts 1 ms and that after the sound and ends at 0.901 s.
  const from = 0.001 + (1.8 * 0.9) / 117
  const shapeSpan = 0.901 - from

  /** The points of the lines drawn a pixel apart: the level in the body and at the top. */
  function levelPoints(drawn: RecordingContext, after: number, before: number): [number, number][] {
    return pointsOf(drawn).filter(
      ([x, y]) =>
        Number.isInteger(x) && x > xOf(after) + 1 && x < xOf(before) - 1 && y < FOOT_Y - 0.01,
    )
  }

  /** The level in the body of the sound a pixel at a time, against `top`: the highest line at each, as [seconds, dB]. */
  function bodyLevels(drawn: RecordingContext, span: number, top: number): [number, number][] {
    const highest = new Map<number, number>()
    for (const [x, y] of pointsOf(drawn)) {
      // The grid's lines end on the box's sides; everything between them is the level.
      if (!Number.isInteger(x) || x <= STRIP.x || x >= STRIP.x + STRIP.w) continue
      if (y >= FOOT_Y - 0.01) continue
      highest.set(x, Math.min(y, highest.get(x) ?? Infinity))
    }
    return [...highest]
      .sort(([a], [b]) => a - b)
      .map(([x, y]): [number, number] => [((x - STRIP.x) / STRIP.w) * span, dbOfY(y) - top])
  }

  it('ends the shape where Time says, on a scale that says how long it is', () => {
    const handles = handlesOf('shaped-reverb', plain)
    const end = take(handles, 'end')
    expect(end.x).toBeCloseTo(STRIP.x + across, 6)
    expect(end.y).toBeCloseTo(yOfDb(wet), 3)
    // The start is the top of the shape's other side.
    const start = take(handles, 'start')
    expect(start.x).toBeCloseTo(xOf(from), 3)
    expect(start.y).toBeCloseTo(yOfDb(wet), 3)
    const { display, params } = plate('shaped-reverb')
    expect(drawDisplay(display, params, { values: plain }).words()).toContain('0.9s')
  })

  it('draws a gate as a level that stops dead', () => {
    const { display, params } = plate('shaped-reverb')
    const drawn = drawDisplay(display, params, { values: { ...plain, shape: GATE } })
    const inside = levelPoints(drawn, from, 0.901)
    expect(inside.length).toBeGreaterThan(100)
    for (const [, y] of inside) expect(Math.abs(dbOfY(y) - wet)).toBeLessThan(0.05)
    // After it, with no tail and no repeat, nothing.
    expect(levelPoints(drawn, 0.93, seconds)).toEqual([])
  })

  it('draws a reverse as a rise of 28 dB and a fall as the line 1 − u', () => {
    const { display, params } = plate('shaped-reverb')
    const along = (drawn: RecordingContext): [number, number][] =>
      bodyLevels(drawn, seconds, wet)
        .map(([t, db]): [number, number] => [(t - from) / shapeSpan, db])
        .filter(([u]) => u > 0.1 && u < 0.97)
    const reverse = along(drawDisplay(display, params, { values: { ...plain, shape: REVERSE } }))
    expect(reverse.length).toBeGreaterThan(60)
    // exp(−3.22·(1 − u)) is a straight line in dB: 27.97 under its end at its start.
    for (const [u, db] of reverse) expect(db).toBeCloseTo(-27.97 * (1 - u), 1)
    const fall = along(drawDisplay(display, params, { values: { ...plain, shape: FALL } }))
    expect(fall.length).toBeGreaterThan(60)
    for (const [u, db] of fall) expect(db).toBeCloseTo(20 * Math.log10(1 - u), 1)
  })

  it('brings the shape round again a Repeat lower', () => {
    const { display, params } = plate('shaped-reverb')
    const values = { ...plain, shape: GATE, repeat: 0.5, time: 0.3 }
    const drawn = drawDisplay(display, params, { values })
    // Time 0.3 is 0.2978 of the way: the box spans 0.301 / 0.3753 = 0.802 s, the gate and
    // most of two repeats. The loop's gain is the Repeat setting, 6.02 dB a trip (its
    // filters take 0.01 more at 500 Hz), and the wet level gives back (1 − 0.25)^¼, 0.62 dB.
    const span = 0.301 / (0.28 + 0.32 * (Math.log(3) / Math.log(40)))
    const levels = bodyLevels(drawn, span, wet + 5 * Math.log10(0.75))
    const during = (after: number, before: number): number[] =>
      levels.filter(([t]) => t > after && t < before).map(([, db]) => db)
    expect(during(0.03, 0.29).length).toBeGreaterThan(40)
    for (const db of during(0.03, 0.29)) expect(Math.abs(db)).toBeLessThan(0.05)
    expect(during(0.33, 0.59).length).toBeGreaterThan(40)
    for (const db of during(0.33, 0.59)) expect(db).toBeCloseTo(-6.03, 1)
    expect(during(0.63, 0.8).length).toBeGreaterThan(20)
    for (const db of during(0.63, 0.8)) expect(db).toBeCloseTo(-12.06, 1)
  })

  it('lets the tail ring on after a gate and fall at its own rate', () => {
    const { display, params } = plate('shaped-reverb')
    const values = { ...plain, shape: GATE, time: 0.3, tail: 0.3 }
    const drawn = drawDisplay(display, params, { values })
    const span = 0.301 / (0.28 + 0.32 * (Math.log(3) / Math.log(40)))
    const levels = bodyLevels(drawn, span, wet)
    // While the gate is open the tail fills up under it and adds to it: never as much
    // as the 0.58 dB it would add at the level it settles at, −8.45 dB.
    const settles = 20 * Math.log10(shapedTailLevel(0.3))
    for (const [, db] of levels.filter(([t]) => t > 0.03 && t < 0.29)) {
      expect(db).toBeGreaterThanOrEqual(-0.05)
      expect(db).toBeLessThan(10 * Math.log10(1 + Math.pow(10, settles / 10)))
    }
    // Once the gate has stopped and the longest line (317 ms) has let go of it, the
    // tail alone is left, under the level it settles at...
    const after = levels.filter(([t]) => t > 0.301 + 0.33)
    expect(after.length).toBeGreaterThan(20)
    for (const [, db] of after) expect(db).toBeLessThan(settles)
    // ...and falling 60 dB in 0.6·10^0.3 = 1.197 s: 50.1 dB a second, and a little more
    // for what the damping takes on every pass.
    const [t0, db0] = after[0]
    const [t1, db1] = after[after.length - 1]
    expect((db0 - db1) / (t1 - t0)).toBeGreaterThan(50)
    expect((db0 - db1) / (t1 - t0)).toBeLessThan(51.5)
  })

  it('sets Tail with a handle that stands on the tail', () => {
    const none = take(handlesOf('shaped-reverb', { ...plain, shape: GATE, tail: 0 }), 'tail')
    expect(none.y).toBeCloseTo(FOOT_Y, 6)
    expect(none.drag(none.x, FOOT_Y).tail).toBe(0)
    expect(none.drag(none.x, yOfDb(wet - 12)).tail).toBeGreaterThan(0)
    const some = take(handlesOf('shaped-reverb', { ...plain, shape: GATE, tail: 0.5 }), 'tail')
    expect(some.y).toBeLessThan(FOOT_Y)
    // Under the level the tail settles at, and not far under it.
    const settles = wet + 20 * Math.log10(shapedTailLevel(0.5))
    expect(dbOfY(some.y)).toBeLessThan(settles)
    expect(dbOfY(some.y)).toBeGreaterThan(settles - 10)
    expect(some.drag(some.x, some.y).tail).toBeCloseTo(0.5, 6)
    expect(some.drag(some.x, some.y - 3).tail).toBeGreaterThan(0.5)
    expect(some.drag(some.x, some.y + 3).tail).toBeLessThan(0.5)
  })

  it('drags the gap with the start and the length with the end', () => {
    const handles = handlesOf('shaped-reverb', plain)
    const start = take(handles, 'start')
    // The end stays put, so a start further right is a longer gap and no other Time.
    const later = start.drag(start.x + 10, start.y)
    expect(later.preDelay).toBeGreaterThan(50)
    expect(later.mix).toBeCloseTo(0.4, 3)
    expect(Object.keys(later).sort()).toEqual(['mix', 'preDelay'])
    const end = take(handles, 'end')
    expect(end.drag(end.x, end.y).time).toBeCloseTo(0.9, 6)
    expect(end.drag(end.x + 20, end.y).time).toBeGreaterThan(0.9)
    expect(Object.keys(end.drag(end.x + 20, end.y))).toEqual(['time'])
  })

  it('draws as many echoes as Density asks for', () => {
    const { display, params } = plate('shaped-reverb')
    const moves = (density: number): number =>
      drawDisplay(display, params, { values: { ...plain, shape: GATE, density } }).calls.filter(
        (call) => call.name === 'moveTo',
      ).length
    // Seven echoes at Density 0; at 1 they stand two pixels apart and read as a hatch.
    expect(moves(0.5) - moves(0)).toBeGreaterThan(20)
    expect(moves(1)).toBeGreaterThan(moves(0.5))
  })

  it('takes the highs from the late echoes or the early ones with Colour', () => {
    const { display, params } = plate('shaped-reverb')
    const top = (colour: number): number[] => {
      const drawn = drawDisplay(display, params, { values: { ...plain, shape: GATE, colour } })
      // The lowest line at each moment is the top of the spectrum.
      return [0.1, 0.8].map((t) =>
        Math.max(
          ...levelPoints(drawn, from, 0.901)
            .filter(([x]) => Math.abs(x - xOf(t)) <= 0.5)
            .map(([, y]) => y),
        ),
      )
    }
    const [earlyFlat, lateFlat] = top(0)
    expect(earlyFlat).toBeCloseTo(lateFlat, 1)
    const [earlyDark, lateDark] = top(-1)
    expect(lateDark).toBeGreaterThan(earlyDark + 5)
    const [earlyBright, lateBright] = top(1)
    expect(earlyBright).toBeGreaterThan(lateBright + 5)
  })
})

describe('the tail itself', () => {
  /** How often a drawing reaches for the accent. */
  const accents = (drawn: RecordingContext): number =>
    drawn.calls.filter(
      (call) =>
        (call.name === 'set fillStyle' || call.name === 'set strokeStyle') &&
        call.args[0] === PLAIN_COLOURS.accent,
    ).length

  it('rings down the slope in the accent after a sound goes in', () => {
    for (const id of Object.keys(REVERB_FACES)) {
      const { display, params } = plate(id)
      // Silence, then a note that stops: what comes out falls away over the next seconds.
      const drawn = runDisplay(display, params, 1.5, {}, (time) => {
        const since = time - 0.5
        return {
          signal: {
            input: testLevel(since >= 0 && since < 0.1 ? 0.5 : 0.00001),
            output: testLevel(since >= 0 ? 0.5 * Math.pow(10, -since) : 0.00001),
            spectrum: null,
            binHz: 0,
            left: null,
            right: null,
          },
        }
      })
      // The trace under the slope, its line and the dot where the sound is now.
      expect(accents(drawn), id).toBeGreaterThanOrEqual(3)
      // In silence nothing has gone in, so there is nothing to ring.
      const struck = runDisplay(display, params, 0.4, {}, () => ({
        signal: {
          input: testLevel(0.00001),
          output: testLevel(0.00001),
          spectrum: null,
          binHz: 0,
          left: null,
          right: null,
        },
      }))
      expect(accents(struck), id).toBe(0)
    }
  })

  it('draws no trace at rest or switched off', () => {
    for (const id of Object.keys(REVERB_FACES)) {
      const { display, params } = plate(id)
      expect(accents(drawDisplay(display, params, { signal: null })), id).toBe(0)
      // Sound still passes a device that is off; it is not the device's tail.
      const off = runDisplay(display, params, 1, { powered: false }, (time) => ({
        signal: {
          input: testLevel(time >= 0.5 ? 0.5 : 0.00001),
          output: testLevel(time >= 0.5 ? 0.5 : 0.00001),
          spectrum: null,
          binHz: 0,
          left: null,
          right: null,
        },
      }))
      expect(accents(off), id).toBe(0)
    }
  })
})
