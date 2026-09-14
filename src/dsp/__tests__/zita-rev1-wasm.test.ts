import { describe, expect, it } from 'vitest'

import { ZITA_REV1_PARAMS } from '../devices/faust/zita-rev1'
import { DEVICE_EXPORT_NAMES, loadWasmDevice } from './wasm-device-harness'

const P = ZITA_REV1_PARAMS

// The 5 ms mix smoother runs in float32, so `1 - mix` settles at ~1e-5 (-100 dB)
// rather than exactly 0; anything under -80 dB counts as silence here.
const SILENCE = 1e-4

describe('zita-rev1.wasm (committed Faust artefact)', () => {
  it('exports the device ABI with an empty import object', async () => {
    const { device, maxBlock } = await loadWasmDevice('zita-rev1')
    expect(maxBlock).toBe(2048)
    for (const name of DEVICE_EXPORT_NAMES) {
      expect(typeof device[name]).toBe('function')
    }
  })

  it('declares the parameter table the .dsp defines, in id order', () => {
    expect(Object.values(P).map((spec) => spec.id)).toEqual([0, 1, 2, 3, 4, 5])
    expect(Object.keys(P)).toEqual([
      'preDelay',
      'crossover',
      'lowDecay',
      'midDecay',
      'damping',
      'mix',
    ])
    expect(P.mix.default).toBe(0.35)
    expect(P.crossover.taper).toBe('log')
    expect(P.preDelay.unit).toBe('ms')
  })

  it('passes dry input through at mix 0 and clears the input between blocks', async () => {
    const h = await loadWasmDevice('zita-rev1')
    h.set(P.mix, 0)
    h.renderSilence(0.1)
    const frames = 128
    h.processBlock(new Float32Array(frames).fill(0.25), new Float32Array(frames).fill(-0.25))
    const left = h.view(h.device.device_out_left(), frames)
    const right = h.view(h.device.device_out_right(), frames)
    expect(left[0]).toBeCloseTo(0.25, 5)
    expect(left[frames - 1]).toBeCloseTo(0.25, 5)
    expect(right[0]).toBeCloseTo(-0.25, 5)

    h.device.device_process(frames)
    expect(Math.max(...h.view(h.device.device_out_left(), frames).map(Math.abs))).toBeLessThan(1e-5)
  })

  it('applies dry*(1-mix) + wet*mix with the default mix of 0.35', async () => {
    const h = await loadWasmDevice('zita-rev1')
    h.renderSilence(0.1)
    h.processBlock([1], [0.5])
    expect(h.view(h.device.device_out_left(), 1)[0]).toBeCloseTo(0.65, 4)
    expect(h.view(h.device.device_out_right(), 1)[0]).toBeCloseTo(0.325, 4)
  })

  it('delays the impulse response by the pre-delay, across its whole range', async () => {
    // A mono impulse's allpass direct paths cancel in Zita's Hadamard mix, so
    // the first audible sample is pre-delay + the shortest allpass delay
    // (19.1 ms); moving the pre-delay moves that onset one for one.
    const onsetFor = async (preDelayMs: number) => {
      const h = await loadWasmDevice('zita-rev1')
      h.set(P.mix, 1)
      h.set(P.preDelay, preDelayMs)
      h.renderSilence(0.1)
      const impulse = new Float32Array(128)
      impulse[0] = 1
      h.processBlock(impulse)
      const output: number[] = [...h.view(h.device.device_out_left(), 128)]
      while (output.length < h.sampleRate * 0.25) {
        h.device.device_process(128)
        output.push(...h.view(h.device.device_out_left(), 128))
      }
      const onset = output.findIndex((value) => Math.abs(value) > SILENCE)
      expect(Math.abs(output[onset])).toBeGreaterThan(0.01)
      return { onset, preDelayFrames: Math.round((preDelayMs / 1000) * h.sampleRate) }
    }
    const short = await onsetFor(P.preDelay.min)
    const long = await onsetFor(P.preDelay.max)
    expect(short.onset).toBeGreaterThanOrEqual(short.preDelayFrames)
    expect(short.onset).toBeLessThan(short.preDelayFrames + 0.032 * 48000)
    expect(long.onset - short.onset).toBe(long.preDelayFrames - short.preDelayFrames)
  })

  it('clamps parameters to their declared range', async () => {
    // mix 5 behaves as mix 1: no dry signal in the first sample.
    const h = await loadWasmDevice('zita-rev1')
    h.set(P.mix, 5)
    h.renderSilence(0.1)
    h.processBlock([1])
    expect(Math.abs(h.view(h.device.device_out_left(), 1)[0])).toBeLessThan(SILENCE)
  })

  it('produces a decaying, finite reverb tail whose length tracks the decay params', async () => {
    const tailAfterTwoSeconds = async (decaySeconds: number) => {
      const h = await loadWasmDevice('zita-rev1')
      h.set(P.mix, 1)
      h.set(P.preDelay, 20)
      h.set(P.lowDecay, decaySeconds)
      h.set(P.midDecay, decaySeconds)
      h.renderSilence(0.1)
      h.feedTone(0.05, 440, 1)
      const early = h.renderSilence(0.5)
      h.renderSilence(1.5)
      const late = h.renderSilence(0.5)
      expect(early.rms).toBeGreaterThan(1e-4)
      expect(late.rms).toBeLessThan(early.rms)
      expect(Number.isFinite(late.peak)).toBe(true)
      return late.rms
    }
    expect(await tailAfterTwoSeconds(8)).toBeGreaterThan((await tailAfterTwoSeconds(1)) * 8)
  })

  it('runs at 44.1, 48 and 96 kHz', async () => {
    for (const sampleRate of [44100, 48000, 96000]) {
      const h = await loadWasmDevice('zita-rev1', sampleRate)
      h.set(P.mix, 1)
      h.renderSilence(0.1)
      h.feedTone(0.05, 440, 1)
      const early = h.renderSilence(0.5)
      h.renderSilence(1.5)
      const late = h.renderSilence(0.5)
      expect(early.rms).toBeGreaterThan(1e-4)
      expect(late.rms).toBeLessThan(early.rms * 0.5)
    }
  })
})
