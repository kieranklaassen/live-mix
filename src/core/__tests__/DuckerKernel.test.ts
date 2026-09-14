// Deterministic offline path: the worklet's DSP driven directly on
// Float32Array blocks, no AudioContext, no timers.

import { describe, expect, it } from 'vitest'

import {
  DUCK_DEPTH,
  DUCK_TIME_CONSTANT,
  ENV_ATTACK_MS,
  ENV_RELEASE_MS,
} from '../devices/native/Ducker'
import { DUCKER_PARAMS } from '../devices/native/ducker-abi'
import { DuckerKernel } from '../devices/native/DuckerKernel'

const SR = 48_000
const BLOCK = 128

function constant(value: number, frames = BLOCK): Float32Array {
  return new Float32Array(frames).fill(value)
}

/** Run `seconds` of a constant key through the kernel, returning every gain sample. */
function run(kernel: DuckerKernel, keyLevel: number, seconds: number): Float32Array {
  const frames = Math.round(seconds * SR)
  const out = new Float32Array(frames)
  const key = keyLevel === 0 ? [] : [constant(keyLevel)]
  const gains = new Float32Array(BLOCK)
  for (let start = 0; start < frames; start += BLOCK) {
    const n = Math.min(BLOCK, frames - start)
    kernel.renderGain(key, gains, n)
    out.set(gains.subarray(0, n), start)
  }
  return out
}

const at = (gains: Float32Array, seconds: number) => gains[Math.round(seconds * SR) - 1]

describe('DuckerKernel', () => {
  it('starts at unity and holds it on silence', () => {
    const kernel = new DuckerKernel(SR)
    const gains = run(kernel, 0, 0.5)
    expect(Math.min(...gains)).toBe(1)
    expect(kernel.envelope).toBe(0)
    expect(kernel.gain).toBe(1)
  })

  it('ducks a 0.5 RMS key to the Phase 0 floor 1 - depth and recovers on silence', () => {
    const kernel = new DuckerKernel(SR)
    const burst = run(kernel, 0.5, 1.5)
    // Monotonic descent to 0.32 (≈ −9.9 dB).
    for (let i = 1; i < burst.length; i += 1) expect(burst[i]).toBeLessThanOrEqual(burst[i - 1])
    expect(at(burst, 1.5)).toBeCloseTo(1 - DUCK_DEPTH, 5)
    expect(kernel.envelope).toBeCloseTo(0.5, 5)

    const release = run(kernel, 0, 4)
    for (let i = 1; i < release.length; i += 1)
      expect(release[i]).toBeGreaterThanOrEqual(release[i - 1])
    // The drive stays saturated (env·4 ≥ 1) until the follower has halved: 800·ln 2 ≈ 555 ms.
    expect(at(release, 0.5)).toBeLessThan(0.33)
    expect(at(release, 0.7)).toBeGreaterThan(0.33)
    expect(at(release, 4)).toBeGreaterThan(0.95)
  })

  it('follows the one-pole law with the legacy attack, release and gain constants', () => {
    const kernel = new DuckerKernel(SR, { windowSize: 1 })
    // windowSize 1 makes the RMS the instantaneous |key|, so the follower is
    // the only dynamic between key and target.
    kernel.setParam('gainScale', 1)
    kernel.setParam('depth', 1)
    // Very fast gain smoothing so the gain tracks the target.
    kernel.setParam('timeConstant', DUCKER_PARAMS.timeConstant.min)
    const gains = run(kernel, 0.5, ENV_ATTACK_MS / 1000)
    // After one attack time constant the follower is 1 - 1/e of the way to 0.5.
    const expectedEnvelope = 0.5 * (1 - Math.exp(-1))
    expect(kernel.envelope).toBeCloseTo(expectedEnvelope, 3)
    expect(at(gains, ENV_ATTACK_MS / 1000)).toBeCloseTo(1 - expectedEnvelope, 2)

    run(kernel, 0.5, 2) // settle
    run(kernel, 0, ENV_RELEASE_MS / 1000)
    expect(kernel.envelope).toBeCloseTo(0.5 * Math.exp(-1), 3)
  })

  it('smooths the gain with the setTargetAtTime time constant', () => {
    const kernel = new DuckerKernel(SR, { windowSize: 1 })
    // Instant follower: the target steps to the floor on the first sample.
    kernel.setParam('attackMs', DUCKER_PARAMS.attackMs.min)
    kernel.setParam('gainScale', DUCKER_PARAMS.gainScale.max)
    const gains = run(kernel, 1, DUCK_TIME_CONSTANT)
    const floor = 1 - DUCK_DEPTH
    // One time constant in: 1/e of the distance to the floor remains (within the 1 ms attack).
    expect(at(gains, DUCK_TIME_CONSTANT)).toBeCloseTo(floor + (1 - floor) * Math.exp(-1), 1)
  })

  it('hold keeps the envelope up after the key drops, then releases', () => {
    const kernel = new DuckerKernel(SR)
    kernel.setParam('holdMs', 500)
    run(kernel, 0.5, 1.5)
    const ducked = kernel.gain
    run(kernel, 0, 0.45)
    expect(kernel.envelope).toBeCloseTo(0.5, 5)
    expect(kernel.gain).toBeCloseTo(ducked, 5)
    run(kernel, 0, 1.5)
    expect(kernel.envelope).toBeLessThan(0.5)
    expect(kernel.gain).toBeGreaterThan(ducked + 0.1)
  })

  it('uses the RMS of the mono-summed key over the window', () => {
    const kernel = new DuckerKernel(SR, { windowSize: 4 })
    kernel.setParam('attackMs', DUCKER_PARAMS.attackMs.min)
    const gains = new Float32Array(4)
    // Stereo key averaging to 0.6 (0.2 + 1.0)/2: RMS after a full window is 0.6.
    kernel.renderGain([constant(0.2, 4), constant(1, 4)], gains, 4)
    for (let i = 0; i < 100; i += 1) kernel.renderGain([constant(0.2, 4), constant(1, 4)], gains, 4)
    expect(kernel.envelope).toBeCloseTo(0.6, 3)
  })

  it('process() multiplies every output channel by the shared gain, in place or not', () => {
    const kernel = new DuckerKernel(SR)
    kernel.setParam('attackMs', DUCKER_PARAMS.attackMs.min)
    kernel.setParam('timeConstant', DUCKER_PARAMS.timeConstant.min)
    const left = constant(0.5)
    const right = constant(-0.25)
    const outL = new Float32Array(BLOCK)
    const outR = new Float32Array(BLOCK)
    for (let i = 0; i < 400; i += 1)
      kernel.process([left, right], [constant(1)], [outL, outR], BLOCK)
    const gain = kernel.gain
    expect(gain).toBeCloseTo(1 - DUCK_DEPTH, 4)
    expect(outL[BLOCK - 1]).toBeCloseTo(0.5 * gain, 5)
    expect(outR[BLOCK - 1]).toBeCloseTo(-0.25 * gain, 5)

    // Mono signal into stereo output repeats the channel; in place works.
    const mono = constant(0.8)
    kernel.process([mono], [constant(1)], [mono, outR], BLOCK)
    expect(mono[0]).toBeCloseTo(0.8 * gain, 4)
    expect(outR[0]).toBeCloseTo(0.8 * gain, 4)

    // No signal renders silence (not stale output).
    outL.fill(9)
    kernel.process([], [constant(1)], [outL], BLOCK)
    expect(Math.max(...outL)).toBe(0)
  })

  it('bypass crossfades to unity over 5 ms while the follower keeps running', () => {
    const kernel = new DuckerKernel(SR)
    run(kernel, 0.5, 1)
    expect(kernel.gain).toBeCloseTo(1 - DUCK_DEPTH, 3)
    kernel.bypass = true
    expect(kernel.bypass).toBe(true)
    const ramp = run(kernel, 0.5, 0.01)
    const rampSamples = Math.round(0.005 * SR)
    expect(ramp[0]).toBeGreaterThan(1 - DUCK_DEPTH)
    expect(ramp[0]).toBeLessThan(1)
    expect(ramp[rampSamples / 2]).toBeGreaterThan(ramp[0])
    expect(ramp[rampSamples + 1]).toBe(1)
    // The follower kept tracking the key underneath.
    expect(kernel.gain).toBeCloseTo(1 - DUCK_DEPTH, 3)
    kernel.bypass = false
    const back = run(kernel, 0.5, 0.01)
    expect(back[rampSamples + 1]).toBeCloseTo(1 - DUCK_DEPTH, 3)
  })

  it('stop() freezes the target; the gain settles there and ignores the key', () => {
    const kernel = new DuckerKernel(SR)
    run(kernel, 0.5, 0.05)
    kernel.stop()
    const frozenEnvelope = kernel.envelope
    const gains = run(kernel, 0, 2)
    expect(kernel.envelope).toBe(frozenEnvelope)
    const target = 1 - Math.min(frozenEnvelope * 4, 1) * DUCK_DEPTH
    expect(at(gains, 2)).toBeCloseTo(target, 5)
  })

  it('clamps parameters to their spec and reports them back', () => {
    const kernel = new DuckerKernel(SR)
    kernel.setParam('depth', 7)
    expect(kernel.getParam('depth')).toBe(1)
    kernel.setParam('attackMs', -5)
    expect(kernel.getParam('attackMs')).toBe(DUCKER_PARAMS.attackMs.min)
    kernel.setParam('releaseMs', Number.NaN)
    expect(kernel.getParam('releaseMs')).toBe(ENV_RELEASE_MS)
    expect(kernel.getParam('holdMs')).toBe(0)
    expect(kernel.windowSize).toBe(256)
  })

  it('reset() clears state but keeps parameters', () => {
    const kernel = new DuckerKernel(SR)
    kernel.setParam('depth', 0.5)
    run(kernel, 0.5, 1)
    kernel.reset()
    expect(kernel.envelope).toBe(0)
    expect(kernel.gain).toBe(1)
    expect(kernel.getParam('depth')).toBe(0.5)
    expect(run(kernel, 0, 0.01)[0]).toBe(1)
  })
})
