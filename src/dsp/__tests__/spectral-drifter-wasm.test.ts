import { describe, expect, it } from 'vitest'

import { SPECTRAL_DRIFTER_PARAMS, spectralDrifterIntensity } from '../devices/spectral-drifter'
import { DEVICE_EXPORT_NAMES, loadWasmDevice, type WasmDeviceHarness } from './wasm-device-harness'

const sampleRate = 48000
const frames = 128
// Makes the eight grains add coherently for ratios 2, 1 and 0.5 (see the
// native harness): (1 + ratio) * f * 768 / fs is an integer.
const toneHz = (sampleRate * 6) / 2304

function goertzelPower(x: Float32Array, frequency: number) {
  const w = (2 * Math.PI * frequency) / sampleRate
  const coefficient = 2 * Math.cos(w)
  let s1 = 0
  let s2 = 0
  for (const v of x) {
    const s0 = v + coefficient * s1 - s2
    s2 = s1
    s1 = s0
  }
  return s1 * s1 + s2 * s2 - coefficient * s1 * s2
}

/** Feeds the tone for `seconds`; returns the left output of the last `captureSeconds`. */
function driveTone(harness: WasmDeviceHarness, seconds: number, captureSeconds: number) {
  const total = Math.floor(seconds * sampleRate)
  const captureFrom = total - Math.floor(captureSeconds * sampleRate)
  const captured = new Float32Array(total - captureFrom)
  const block = new Float32Array(frames)
  let phase = 0
  for (let rendered = 0; rendered < total; rendered += frames) {
    const n = Math.min(frames, total - rendered)
    for (let i = 0; i < n; i += 1) {
      block[i] = 0.5 * Math.sin(phase)
      phase += (2 * Math.PI * toneHz) / sampleRate
    }
    harness.processBlock(block.subarray(0, n))
    if (rendered + n > captureFrom) {
      const out = harness.view(harness.device.device_out_left(), n)
      for (let i = 0; i < n; i += 1) {
        const at = rendered + i - captureFrom
        if (at >= 0) captured[at] = out[i]
      }
    }
  }
  return captured
}

async function loadWet() {
  const harness = await loadWasmDevice('spectral-drifter', sampleRate)
  harness.set(SPECTRAL_DRIFTER_PARAMS.mix, 1)
  harness.set(SPECTRAL_DRIFTER_PARAMS.bloom, 1)
  harness.set(SPECTRAL_DRIFTER_PARAMS.ageMode, 1)
  harness.set(SPECTRAL_DRIFTER_PARAMS.age, 1)
  return harness
}

describe('spectral-drifter.wasm (committed artefact)', () => {
  it('exports the device ABI with an empty import object', async () => {
    const { device, maxBlock } = await loadWasmDevice('spectral-drifter', sampleRate)
    expect(maxBlock).toBe(2048)
    for (const name of DEVICE_EXPORT_NAMES) expect(typeof device[name]).toBe('function')
  })

  it('passes dry input through at mix 0 and clears the input between blocks', async () => {
    const harness = await loadWasmDevice('spectral-drifter', sampleRate)
    harness.set(SPECTRAL_DRIFTER_PARAMS.mix, 0)
    harness.processBlock(new Float32Array(frames).fill(0.25), new Float32Array(frames).fill(-0.25))
    const left = harness.view(harness.device.device_out_left(), frames)
    const right = harness.view(harness.device.device_out_right(), frames)
    expect(left[0]).toBeCloseTo(0.25, 6)
    expect(left[frames - 1]).toBeCloseTo(0.25, 6)
    expect(right[0]).toBeCloseTo(-0.25, 6)

    harness.device.device_process(frames)
    expect(Math.max(...harness.view(harness.device.device_out_left(), frames).map(Math.abs))).toBe(
      0,
    )
  })

  it('applies the equal-power mix law with the default mix of 0.5', async () => {
    const harness = await loadWasmDevice('spectral-drifter', sampleRate)
    harness.processBlock([1], [0.5])
    expect(harness.view(harness.device.device_out_left(), 1)[0]).toBeCloseTo(Math.SQRT1_2, 5)
    expect(harness.view(harness.device.device_out_right(), 1)[0]).toBeCloseTo(Math.SQRT1_2 / 2, 5)
  })

  it('shifts a tone up an octave at full bloom and age (default Octave/Up)', async () => {
    const harness = await loadWet()
    const out = driveTone(harness, 3, 1)
    const octave = goertzelPower(out, 2 * toneHz)
    expect(octave).toBeGreaterThan(20 * goertzelPower(out, toneHz))
    expect(octave).toBeGreaterThan(20 * goertzelPower(out, toneHz / 2))
  })

  it('shifts a tone down an octave with direction Down', async () => {
    const harness = await loadWet()
    harness.set(SPECTRAL_DRIFTER_PARAMS.direction, 1)
    const out = driveTone(harness, 3, 1)
    const below = goertzelPower(out, toneHz / 2)
    expect(below).toBeGreaterThan(20 * goertzelPower(out, toneHz))
    expect(below).toBeGreaterThan(20 * goertzelPower(out, 2 * toneHz))
  })

  it('leaves pitch alone at bloom 0', async () => {
    const harness = await loadWet()
    harness.set(SPECTRAL_DRIFTER_PARAMS.bloom, 0)
    const out = driveTone(harness, 3, 1)
    const unison = goertzelPower(out, toneHz)
    expect(unison).toBeGreaterThan(20 * goertzelPower(out, 2 * toneHz))
    expect(unison).toBeGreaterThan(20 * goertzelPower(out, toneHz / 2))
  })

  it('stays finite and bounded, and flushes to silence', async () => {
    const harness = await loadWet()
    harness.set(SPECTRAL_DRIFTER_PARAMS.interval, 3)
    harness.set(SPECTRAL_DRIFTER_PARAMS.direction, 2)
    harness.set(SPECTRAL_DRIFTER_PARAMS.season, 3)
    harness.set(SPECTRAL_DRIFTER_PARAMS.seed, 2)
    const peak = harness.feedTone(2, 220, 0.9)
    expect(Number.isFinite(peak)).toBe(true)
    expect(peak).toBeLessThan(1.2)
    // Grains keep reading the 88200-sample buffer for a while after the input
    // stops; once it has been overwritten with zeros every state flushes.
    const tail = harness.renderSilence(5)
    expect(Number.isFinite(tail.peak)).toBe(true)
    expect(harness.renderSilence(1).peak).toBe(0)
  })

  it("exposes Bloom's intensity law", () => {
    expect(spectralDrifterIntensity(1, 0)).toBeCloseTo(0.3, 6)
    expect(spectralDrifterIntensity(1, 1)).toBeCloseTo(1, 6)
    expect(spectralDrifterIntensity(0.5, 0.5)).toBeCloseTo(0.325, 6)
  })
})
