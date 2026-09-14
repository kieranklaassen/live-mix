import { describe, expect, it } from 'vitest'

import { TruePeakDetector } from '../../core/analysis/loudness'
import {
  TRUE_PEAK_LIMITER_LATENCY_SECONDS,
  TRUE_PEAK_LIMITER_PARAMS,
} from '../devices/true-peak-limiter'
import { DEVICE_EXPORT_NAMES, dbToGain, gainToDb, loadWasmDevice } from './wasm-device-harness'

const P = TRUE_PEAK_LIMITER_PARAMS
const CEILING = dbToGain(-1)
const BLOCK = 128

/** Renders `seconds` of a stereo generator through the device; returns the output. */
async function render(
  seconds: number,
  sample: (n: number) => number,
  params: Partial<Record<keyof typeof P, number>> = {},
) {
  const h = await loadWasmDevice('true-peak-limiter')
  for (const [name, value] of Object.entries(params)) h.set(P[name as keyof typeof P], value)
  const total = Math.floor(seconds * h.sampleRate)
  const left = new Float32Array(total)
  const right = new Float32Array(total)
  const block = new Float32Array(BLOCK)
  for (let n = 0; n < total; n += BLOCK) {
    const frames = Math.min(BLOCK, total - n)
    for (let i = 0; i < frames; i += 1) block[i] = sample(n + i)
    h.processBlock(block.subarray(0, frames))
    left.set(h.view(h.device.device_out_left(), frames), n)
    right.set(h.view(h.device.device_out_right(), frames), n)
  }
  return { left, right, sampleRate: h.sampleRate }
}

function peak(x: Float32Array, skip = 0): number {
  let peak = 0
  for (let i = skip; i < x.length; i += 1) {
    const magnitude = Math.abs(x[i])
    if (!Number.isFinite(magnitude)) return Infinity
    if (magnitude > peak) peak = magnitude
  }
  return peak
}

/** The meter's own true-peak measure of a rendered channel. */
function truePeak(x: Float32Array, skip = 0): number {
  const detector = new TruePeakDetector(48000)
  let peak = 0
  for (let i = 0; i < x.length; i += 1) {
    const tp = detector.push(x[i])
    if (i >= skip && tp > peak) peak = tp
  }
  return peak
}

const sine =
  (frequency: number, gain: number, phase = 0) =>
  (n: number) =>
    gain * Math.sin((2 * Math.PI * frequency * n) / 48000 + phase)
const square = (frequency: number, gain: number) => (n: number) =>
  Math.sin((2 * Math.PI * frequency * n) / 48000) >= 0 ? gain : -gain

describe('true-peak-limiter.wasm (committed artefact)', () => {
  it('exports the device ABI with an empty import object', async () => {
    const { device, maxBlock } = await loadWasmDevice('true-peak-limiter')
    expect(maxBlock).toBe(2048)
    for (const name of DEVICE_EXPORT_NAMES) {
      expect(typeof device[name]).toBe('function')
    }
  })

  it('declares the parameter table the C++ enum defines, in id order', () => {
    expect(Object.keys(P)).toEqual(['ceilingDb', 'releaseMs', 'inputGainDb'])
    expect(P.ceilingDb).toMatchObject({ id: 0, min: -20, max: 0, default: -1, unit: 'dBTP' })
    expect(P.releaseMs).toMatchObject({ id: 1, min: 10, max: 2000, default: 100, unit: 'ms' })
    expect(P.inputGainDb).toMatchObject({ id: 2, min: -24, max: 24, default: 0, unit: 'dB' })
    expect(TRUE_PEAK_LIMITER_LATENCY_SECONDS).toBeCloseTo(77 / 48000, 9)
  })

  it('passes a −6 dBFS sine as a pure 77-sample delay', async () => {
    const { left, right } = await render(0.5, sine(440, 0.5))
    let worst = 0
    for (let n = 4800; n < left.length; n += 1) {
      worst = Math.max(worst, Math.abs(left[n] - 0.5 * Math.sin((2 * Math.PI * 440 * (n - 77)) / 48000)))
      worst = Math.max(worst, Math.abs(left[n] - right[n]))
    }
    expect(worst).toBeLessThan(1e-5)
  })

  it('caps a full-scale sine at the −1 dBTP ceiling on samples and on the true-peak measure', async () => {
    const { left } = await render(1, sine(440, 1))
    expect(peak(left)).toBeLessThanOrEqual(CEILING + 1e-6)
    expect(gainToDb(truePeak(left, 4800) / CEILING)).toBeLessThan(0.05)
    expect(peak(left, 4800)).toBeGreaterThan(CEILING * dbToGain(-0.5))
  })

  it('holds a +12 dBFS square, and a quarter-rate sine whose samples miss the peak, under the ceiling', async () => {
    const hot = await render(1, square(1000, 4))
    expect(peak(hot.left)).toBeLessThanOrEqual(CEILING + 1e-6)
    expect(gainToDb(truePeak(hot.left, 4800) / CEILING)).toBeLessThan(0.05)

    const missed = await render(1, sine(12000, 1.5, Math.PI / 4))
    expect(peak(missed.right)).toBeLessThanOrEqual(CEILING + 1e-6)
    expect(gainToDb(truePeak(missed.right, 4800) / CEILING)).toBeLessThan(0.05)
    expect(gainToDb(truePeak(missed.right, 4800))).toBeLessThan(-0.1)
  })

  it('applies a lower ceiling and input gain exactly from the first frame', async () => {
    const low = await render(0.5, sine(440, 1), { ceilingDb: -6 })
    expect(peak(low.left)).toBeLessThanOrEqual(dbToGain(-6) + 1e-6)
    expect(peak(low.left, 4800)).toBeGreaterThan(dbToGain(-6.5))

    const driven = await render(0.5, sine(440, 0.1), { inputGainDb: 20 })
    expect(peak(driven.left, 4800)).toBeGreaterThan(CEILING * dbToGain(-0.5))
    expect(peak(driven.left)).toBeLessThanOrEqual(CEILING + 1e-6)
  })

  it('recovers unity after a hot passage at the release rate', async () => {
    const burst = (n: number) => (n < 14400 ? 2 : 0.5) * Math.sin((2 * Math.PI * 440 * n) / 48000)
    const fast = await render(1, burst, { releaseMs: 100 })
    const slow = await render(1, burst, { releaseMs: 1000 })
    const tail = Math.floor(0.8 * 48000)
    expect(peak(fast.left, tail)).toBeGreaterThan(0.5 * 0.98)
    expect(peak(fast.left, tail)).toBeLessThanOrEqual(0.5 + 1e-4)
    expect(peak(slow.left, tail)).toBeLessThan(peak(fast.left, tail) - 0.02)
  })

  it('stays finite and under the ceiling with +24 dB of drive', async () => {
    let seed = 1
    const noise = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 2147483648 - 1
    }
    const { left, right } = await render(2, noise, { inputGainDb: 24, releaseMs: 10 })
    expect(peak(left)).toBeLessThanOrEqual(CEILING + 1e-6)
    expect(peak(right)).toBeLessThanOrEqual(CEILING + 1e-6)
    expect(peak(left, 4800)).toBeGreaterThan(CEILING * 0.7)
  })
})
