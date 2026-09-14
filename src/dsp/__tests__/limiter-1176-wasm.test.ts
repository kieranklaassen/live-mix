import { describe, expect, it } from 'vitest'

import { LIMITER_1176_PARAMS } from '../devices/faust/limiter-1176'
import { DEVICE_EXPORT_NAMES, dbToGain, gainToDb, loadWasmDevice } from './wasm-device-harness'

const P = LIMITER_1176_PARAMS

// co.limiter_1176_R4_stereo: level = |L|+|R| in dB, 4:1 above -6 dB.
const expectedPeak = (gain: number) => {
  const overDb = Math.max(0, gainToDb(2 * gain) + 6)
  return gain * dbToGain(-overDb * 0.75)
}

async function settledPeak(gain: number, inputGainDb = 0, outputGainDb = 0) {
  const h = await loadWasmDevice('limiter-1176')
  h.set(P.inputGain, inputGainDb)
  h.set(P.outputGain, outputGainDb)
  return h.feedTone(1, 440, gain, 0.5)
}

describe('limiter-1176.wasm (committed Faust artefact)', () => {
  it('exports the device ABI with an empty import object', async () => {
    const { device, maxBlock } = await loadWasmDevice('limiter-1176')
    expect(maxBlock).toBe(2048)
    for (const name of DEVICE_EXPORT_NAMES) {
      expect(typeof device[name]).toBe('function')
    }
  })

  it('declares the parameter table the .dsp defines, in id order', () => {
    expect(Object.keys(P)).toEqual(['inputGain', 'outputGain'])
    expect(P.inputGain).toMatchObject({ id: 0, min: 0, max: 40, default: 0, unit: 'dB' })
    expect(P.outputGain).toMatchObject({ id: 1, min: -24, max: 24, default: 0, unit: 'dB' })
  })

  it('is unity gain below the threshold', async () => {
    expect(await settledPeak(0.1)).toBeCloseTo(0.1, 2)
  })

  it('caps peaks: a full-scale sine loses 9 dB, +12 dBFS loses 18 dB', async () => {
    const fullScale = await settledPeak(1)
    expect(fullScale).toBeLessThan(0.5)
    expect(Math.abs(fullScale - expectedPeak(1))).toBeLessThan(0.03)

    const hot = await settledPeak(4)
    expect(hot).toBeLessThan(0.6)
    expect(Math.abs(hot - expectedPeak(4))).toBeLessThan(0.05)

    // 4:1 — 12 dB more in, 3 dB more out.
    expect(gainToDb(hot / fullScale)).toBeCloseTo(3, 0)
  })

  it('input gain drives the fixed threshold and clamps at 40 dB', async () => {
    expect(Math.abs((await settledPeak(0.1, 20)) - (await settledPeak(1)))).toBeLessThan(0.02)
    expect(await settledPeak(0.1, 100)).toBeCloseTo(await settledPeak(0.1, 40), 4)
  })

  it('output gain is a make-up stage', async () => {
    const unity = await settledPeak(1)
    expect(gainToDb((await settledPeak(1, 0, 6)) / unity)).toBeCloseTo(6, 1)
    expect(gainToDb((await settledPeak(1, 0, -6)) / unity)).toBeCloseTo(-6, 1)
  })

  it('stays finite and bounded under 40 dB of drive', async () => {
    const h = await loadWasmDevice('limiter-1176')
    h.set(P.inputGain, 40)
    const peak = h.feedTone(5, 55, 4)
    expect(Number.isFinite(peak)).toBe(true)
    expect(peak).toBeLessThan(4)
  })
})
