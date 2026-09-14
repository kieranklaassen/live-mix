import { describe, expect, it } from 'vitest'

import { fdnReverbBreathLaw } from '../../../dsp/devices/fdn-reverb'
import {
  EnvelopeFollower,
  ExternalPhase,
  Lfo,
  Macro,
  Random,
  breathLaw,
  lfoWaveform,
  renderModulator,
} from '../Modulator'

const f = Math.fround

/** Tides' per-sample law evaluated in float32, as the C++ does it. */
function tidesFloat32(phase: number, depth: number): number {
  const twoPi = f(6.283185307179586)
  const breathMod = f(f(f(Math.sin(f(f(phase) * twoPi))) * f(0.5)) + f(0.5))
  return f(f(1) - f(f(depth) * f(f(1) - breathMod)))
}

const phases = Array.from({ length: 97 }, (_, i) => i / 97)
const depths = [0, 0.1, 0.25, 0.4, 0.5, 0.75, 1]

describe('Lfo (Tides breathing law, R33)', () => {
  it('valueAt(phase) is exactly the FdnReverb device law', () => {
    for (const depth of depths) {
      const lfo = new Lfo({ depth })
      for (const phase of phases) {
        expect(lfo.valueAt(phase)).toBe(fdnReverbBreathLaw(phase, depth))
        expect(lfo.valueAt(phase)).toBe(breathLaw(Math.sin(phase * Math.PI * 2) * 0.5 + 0.5, depth))
      }
    }
  })

  it('matches the C++ float32 evaluation within single precision', () => {
    for (const depth of depths) {
      const lfo = new Lfo({ depth })
      for (const phase of phases) {
        expect(Math.abs(lfo.valueAt(phase) - tidesFloat32(phase, depth))).toBeLessThan(1e-6)
      }
    }
  })

  it('spans [1 − depth, 1] with the peak at a quarter cycle', () => {
    const lfo = new Lfo({ depth: 0.4 })
    expect(lfo.valueAt(0)).toBeCloseTo(0.8, 12)
    expect(lfo.valueAt(0.25)).toBeCloseTo(1, 12)
    expect(lfo.valueAt(0.75)).toBeCloseTo(0.6, 12)
    expect(new Lfo({ depth: 0 }).valueAt(0.75)).toBe(1)
  })

  it('runs freely: phase is rate × time, wrapped, and nothing but time moves it', () => {
    const lfo = new Lfo({ rateHz: 0.25, phase: 0.1 })
    expect(lfo.phaseAt(0)).toBeCloseTo(0.1, 12)
    expect(lfo.phaseAt(1)).toBeCloseTo(0.35, 12)
    expect(lfo.phaseAt(4)).toBeCloseTo(0.1, 12)
    expect(lfo.phaseAt(10)).toBeCloseTo(0.6, 12)
    expect(lfo.valueAtTime(10)).toBe(lfo.valueAt(lfo.phaseAt(10)))
    // Reading it in any order or any number of times changes nothing.
    const again = new Lfo({ rateHz: 0.25, phase: 0.1 })
    again.valueAtTime(7)
    again.valueAtTime(2)
    expect(again.phaseAt(10)).toBe(lfo.phaseAt(10))
  })

  it('keeps the phase continuous across a rate change', () => {
    const lfo = new Lfo({ rateHz: 1 })
    const before = lfo.phaseAt(2.3)
    lfo.setRate(0.5, 2.3)
    expect(lfo.rateHz).toBe(0.5)
    expect(lfo.phaseAt(2.3)).toBeCloseTo(before, 12)
    expect(lfo.phaseAt(3.3)).toBeCloseTo((before + 0.5) % 1, 12)
  })

  it('re-syncs only through an explicit setPhase', () => {
    const lfo = new Lfo({ rateHz: 1 })
    lfo.setPhase(0.5, 10)
    expect(lfo.phaseAt(10)).toBe(0.5)
    expect(lfo.phaseAt(10.25)).toBeCloseTo(0.75, 12)
  })

  it('renders an exact grid of the law over time', () => {
    const lfo = new Lfo({ rateHz: 1, depth: 1 })
    const curve = renderModulator(lfo, 0, 1, 4)
    expect(curve[0]).toBeCloseTo(0.5, 6)
    expect(curve[1]).toBeCloseTo(1, 6)
    expect(curve[2]).toBeCloseTo(0.5, 6)
    expect(curve[3]).toBeCloseTo(0, 6)
    expect(renderModulator(lfo, 0, 0, 100)).toHaveLength(0)
  })
})

describe('lfoWaveform', () => {
  it('starts every shape at the same point of the cycle as the sine', () => {
    for (const shape of ['sine', 'triangle', 'square'] as const) {
      expect(lfoWaveform(shape, 0.25)).toBeCloseTo(1, 12)
      expect(lfoWaveform(shape, 0.75)).toBeCloseTo(0, 12)
    }
    expect(lfoWaveform('triangle', 0)).toBe(0.5)
    expect(lfoWaveform('triangle', 0.5)).toBe(0.5)
    expect(lfoWaveform('saw', 0.5)).toBe(0.5)
    expect(lfoWaveform('saw', 1.25)).toBeCloseTo(0.25, 12)
    expect(lfoWaveform('square', 0.49)).toBe(1)
    expect(lfoWaveform('square', 0.5)).toBe(0)
  })

  it('stays inside 0..1 for every shape', () => {
    for (const shape of ['sine', 'triangle', 'saw', 'square'] as const) {
      for (const phase of phases) {
        const value = lfoWaveform(shape, phase * 3 - 1)
        expect(value).toBeGreaterThanOrEqual(-1e-12)
        expect(value).toBeLessThanOrEqual(1 + 1e-12)
      }
    }
  })
})

describe('ExternalPhase', () => {
  it('holds the phase it is given and applies the same law', () => {
    const breath = new ExternalPhase({ depth: 0.5 })
    expect(breath.valueAtTime(0)).toBe(breathLaw(0.5, 0.5))
    breath.setPhase(0.25)
    expect(breath.currentPhase).toBe(0.25)
    expect(breath.valueAtTime(123)).toBe(breathLaw(1, 0.5))
    breath.setPhase(Number.NaN)
    expect(breath.currentPhase).toBe(0.25)
  })

  it('wraps the phase and honours the offset', () => {
    const inhaleFirst = new ExternalPhase({ phaseOffset: -0.25 })
    inhaleFirst.setPhase(0)
    expect(inhaleFirst.valueAtTime(0)).toBeCloseTo(0, 12)
    inhaleFirst.setPhase(0.5)
    expect(inhaleFirst.valueAtTime(0)).toBeCloseTo(1, 12)
    inhaleFirst.setPhase(1.5)
    expect(inhaleFirst.currentPhase).toBe(0.5)
  })
})

describe('EnvelopeFollower', () => {
  it('rises with the attack constant and falls with the release constant', () => {
    const follower = new EnvelopeFollower({ attackSec: 0.1, releaseSec: 1 })
    follower.push(1, 0)
    expect(follower.valueAtTime(0)).toBe(0)
    follower.push(1, 0.1)
    expect(follower.valueAtTime(0.1)).toBeCloseTo(1 - Math.exp(-1), 12)
    follower.push(1, 10)
    expect(follower.valueAtTime(10)).toBeCloseTo(1, 6)
    follower.push(0, 11)
    expect(follower.valueAtTime(11)).toBeCloseTo(Math.exp(-1), 6)
  })

  it('integrates the same equation per sample and per control tick', () => {
    const perSample = new EnvelopeFollower({ attackSec: 0.05, releaseSec: 0.2 })
    const perTick = new EnvelopeFollower({ attackSec: 0.05, releaseSec: 0.2 })
    const sampleRate = 1000
    const block = new Float32Array(500).fill(0.8)
    const envelope = perSample.process(block, sampleRate)
    perTick.push(0.8, 0)
    perTick.push(0.8, 0.5)
    expect(envelope[499]).toBeCloseTo(perTick.valueAtTime(0.5), 6)
    expect(envelope[0]).toBeCloseTo(0.8 * (1 - Math.exp(-1 / (0.05 * sampleRate))), 9)
  })

  it('rectifies, resets and snaps when a constant is zero', () => {
    const follower = new EnvelopeFollower({ attackSec: 0, releaseSec: 0 })
    follower.push(-0.6, 0)
    expect(follower.valueAtTime(0)).toBe(0.6)
    follower.reset()
    expect(follower.valueAtTime(0)).toBe(0)
  })
})

describe('Random', () => {
  it('is a repeatable function of time for a seed and holds inside each step', () => {
    const a = new Random({ rateHz: 2, seed: 7 })
    const b = new Random({ rateHz: 2, seed: 7 })
    expect(a.valueAtTime(0.3)).toBe(b.valueAtTime(0.3))
    expect(a.valueAtTime(0.3)).toBe(a.valueAtTime(0.49))
    expect(a.valueAtTime(0.5)).not.toBe(a.valueAtTime(0.49))
    expect(new Random({ rateHz: 2, seed: 8 }).valueAtTime(0.3)).not.toBe(a.valueAtTime(0.3))
  })

  it('stays in 0..1 and glides linearly when smooth', () => {
    const stepped = new Random({ rateHz: 4, seed: 3 })
    const smooth = new Random({ rateHz: 4, seed: 3, smooth: true })
    for (let i = 0; i < 200; i += 1) {
      const value = stepped.valueAtTime(i * 0.013)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
    const from = stepped.valueOfStep(4)
    const to = stepped.valueOfStep(5)
    expect(smooth.valueAtTime(1)).toBeCloseTo(from, 12)
    expect(smooth.valueAtTime(1.125)).toBeCloseTo(from + (to - from) * 0.5, 12)
  })
})

describe('Macro', () => {
  it('holds a clamped 0..1 value', () => {
    const macro = new Macro(0.3)
    expect(macro.valueAtTime(5)).toBe(0.3)
    macro.set(2)
    expect(macro.value).toBe(1)
    macro.set(Number.NaN)
    expect(macro.value).toBe(0)
  })
})
