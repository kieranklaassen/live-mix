import { describe, expect, it } from 'vitest'

import { GATE_PARAMS } from '../devices/native/gate-abi'
import { GateKernel } from '../devices/native/GateKernel'

const SAMPLE_RATE = 48_000
const BLOCK = 128
const db = (gain: number): number => 20 * Math.log10(gain)

/** A constant-level tone `seconds` long at `levelDb` peak, mono. */
function tone(levelDb: number, seconds: number): Float32Array {
  const frames = Math.round(seconds * SAMPLE_RATE)
  const amplitude = Math.pow(10, levelDb / 20)
  const out = new Float32Array(frames)
  for (let i = 0; i < frames; i += 1)
    out[i] = amplitude * Math.sin((2 * Math.PI * 220 * i) / SAMPLE_RATE)
  return out
}

/** Run `signal` through the kernel block by block; returns the gain after each block. */
function run(kernel: GateKernel, signal: Float32Array): number[] {
  const gains: number[] = []
  const out = [new Float32Array(BLOCK)]
  for (let start = 0; start + BLOCK <= signal.length; start += BLOCK) {
    kernel.process([signal.subarray(start, start + BLOCK)], out, BLOCK)
    gains.push(kernel.gain)
  }
  return gains
}

describe('GateKernel', () => {
  it('starts closed at the range, so the room before the first word is already down', () => {
    const kernel = new GateKernel(SAMPLE_RATE)
    expect(db(kernel.gain)).toBeCloseTo(GATE_PARAMS.range.default, 6)
    run(kernel, tone(-70, 0.2))
    expect(kernel.isOpen).toBe(false)
    expect(db(kernel.gain)).toBeCloseTo(-12, 3)
  })

  it('opens on a word within a few milliseconds and passes it at unity', () => {
    const kernel = new GateKernel(SAMPLE_RATE)
    const gains = run(kernel, tone(-20, 0.05))
    expect(kernel.isOpen).toBe(true)
    // 2 ms attack: within 10 ms (four blocks) the gain is all but unity.
    expect(gains[3]).toBeGreaterThan(0.99)
    expect(kernel.gain).toBeCloseTo(1, 6)
  })

  it('holds open through a short gap between words and closes in a long pause', () => {
    const kernel = new GateKernel(SAMPLE_RATE)
    run(kernel, tone(-20, 0.1))
    // 100 ms of room: inside the 150 ms hold.
    run(kernel, tone(-70, 0.1))
    expect(kernel.isOpen).toBe(true)
    expect(kernel.gain).toBeCloseTo(1, 6)
    // Two seconds more: the hold is over and the release (a 200 ms time constant) has settled at the range.
    run(kernel, tone(-70, 2))
    expect(kernel.isOpen).toBe(false)
    expect(db(kernel.gain)).toBeCloseTo(-12, 1)
  })

  it('does not flicker on a sound hovering between the close level and the threshold', () => {
    const kernel = new GateKernel(SAMPLE_RATE)
    run(kernel, tone(-20, 0.1))
    // −52 dB: under the −50 threshold, over the −54 close level.
    run(kernel, tone(-52, 1))
    expect(kernel.isOpen).toBe(true)
  })

  it('a range at its minimum silences the closed gate', () => {
    const kernel = new GateKernel(SAMPLE_RATE)
    kernel.setParam('range', GATE_PARAMS.range.min)
    kernel.reset()
    expect(kernel.gain).toBe(0)
  })

  it('bypass crossfades to unity while the gate is closed', () => {
    const kernel = new GateKernel(SAMPLE_RATE)
    kernel.bypass = true
    const signal = tone(-70, 0.02)
    const out = [new Float32Array(signal.length)]
    kernel.process([signal], out, signal.length)
    const last = signal.length - 1
    expect(out[0][last]).toBeCloseTo(signal[last], 7)
  })

  it('applies one gain to every channel and repeats the last channel past the input', () => {
    const kernel = new GateKernel(SAMPLE_RATE)
    const signal = tone(-20, BLOCK / SAMPLE_RATE)
    const out = [new Float32Array(BLOCK), new Float32Array(BLOCK)]
    kernel.process([signal], out, BLOCK)
    expect(Array.from(out[1])).toEqual(Array.from(out[0]))
    kernel.process([], out, BLOCK)
    expect(out[0].every((sample) => sample === 0)).toBe(true)
  })

  it('clamps parameters to their specs', () => {
    const kernel = new GateKernel(SAMPLE_RATE)
    kernel.setParam('threshold', 20)
    expect(kernel.getParam('threshold')).toBe(GATE_PARAMS.threshold.max)
  })
})
