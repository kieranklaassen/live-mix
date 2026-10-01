import { describe, expect, it } from 'vitest'

import { ETHER_REVERB_PARAMS, etherReverbLaw } from '../devices/ether-reverb'
import { DEVICE_EXPORT_NAMES, loadWasmDevice } from './wasm-device-harness'

const sampleRate = 48000
const frames = 128

async function loadWet() {
  const harness = await loadWasmDevice('ether-reverb', sampleRate)
  harness.set(ETHER_REVERB_PARAMS.mix, 1)
  return harness
}

describe('ether-reverb.wasm (committed artefact)', () => {
  it('exports the device ABI with an empty import object', async () => {
    const { device, maxBlock } = await loadWasmDevice('ether-reverb', sampleRate)
    expect(maxBlock).toBe(2048)
    for (const name of DEVICE_EXPORT_NAMES) expect(typeof device[name]).toBe('function')
  })

  it('passes dry input through at mix 0 and clears the input between blocks', async () => {
    const harness = await loadWasmDevice('ether-reverb', sampleRate)
    harness.set(ETHER_REVERB_PARAMS.mix, 0)
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

  it("applies Ether's linear mix law with the default mix of 0.3", async () => {
    const harness = await loadWasmDevice('ether-reverb', sampleRate)
    harness.processBlock([1], [0.5])
    expect(harness.view(harness.device.device_out_left(), 1)[0]).toBeCloseTo(0.7, 6)
    expect(harness.view(harness.device.device_out_right(), 1)[0]).toBeCloseTo(0.35, 6)
  })

  it('starts the wet tail at the shortest Freeverb comb, shifted by the pre-delay', async () => {
    const onset = async (predelayMs: number, channel: 'left' | 'right') => {
      const harness = await loadWet()
      harness.set(ETHER_REVERB_PARAMS.predelayMs, predelayMs)
      harness.processBlock([1], [1])
      const first = harness.view(
        channel === 'left' ? harness.device.device_out_left() : harness.device.device_out_right(),
        1,
      )
      if (Math.abs(first[0]) > 1e-7) return 0
      for (let position = 1; position < sampleRate; position += frames) {
        harness.device.device_process(frames)
        const out = harness.view(
          channel === 'left' ? harness.device.device_out_left() : harness.device.device_out_right(),
          frames,
        )
        for (let i = 0; i < frames; i += 1) if (Math.abs(out[i]) > 1e-7) return position + i
      }
      return -1
    }
    expect(await onset(0, 'left')).toBe(Math.floor((48000 * 1116) / 44100))
    expect(await onset(0, 'right')).toBe(Math.floor((48000 * (1116 + 23)) / 44100))
    expect(await onset(100, 'left')).toBe(Math.floor((48000 * 1116) / 44100) + 4800)
  })

  it('produces a decaying tail that reaches exact silence', async () => {
    const harness = await loadWet()
    harness.set(ETHER_REVERB_PARAMS.decay, 0.5)
    harness.set(ETHER_REVERB_PARAMS.size, 0)
    harness.feedTone(0.05, 880, 1)
    const early = harness.renderSilence(0.5)
    const late = harness.renderSilence(0.5)
    expect(early.rms).toBeGreaterThan(1e-4)
    expect(late.rms).toBeLessThan(early.rms)
    harness.renderSilence(15)
    expect(harness.renderSilence(0.5).peak).toBe(0)
  })

  it('holds the tail while frozen and mutes the input and dry', async () => {
    const harness = await loadWasmDevice('ether-reverb', sampleRate)
    harness.set(ETHER_REVERB_PARAMS.mix, 0.5)
    harness.feedTone(0.5, 440, 0.5)
    harness.set(ETHER_REVERB_PARAMS.freeze, 1)
    harness.renderSilence(0.1)
    const a = harness.renderSilence(2)
    harness.renderSilence(4)
    const b = harness.renderSilence(2)
    expect(a.rms).toBeGreaterThan(1e-3)
    expect(Math.abs(b.rms - a.rms)).toBeLessThan(0.1 * a.rms)

    // Held: more input gets in neither through the room nor dry.
    harness.feedTone(1, 660, 0.9)
    const c = harness.renderSilence(2)
    expect(Math.abs(c.rms - a.rms)).toBeLessThan(0.1 * a.rms)
  })

  it('waits for a sound when frozen with nothing ringing, then holds it', async () => {
    // The "Frozen" preset and a session saved with Freeze on load like this.
    // It used to mute the input before anything was in the room: silence.
    const fresh = await loadWasmDevice('ether-reverb', sampleRate)
    fresh.set(ETHER_REVERB_PARAMS.mix, 0.5)
    fresh.set(ETHER_REVERB_PARAMS.freeze, 1)
    expect(fresh.renderSilence(1).peak).toBe(0)
    expect(fresh.feedTone(0.05, 440, 0.5)).toBeGreaterThan(0.2) // the dry signal still passes
    fresh.feedTone(2.2, 440, 0.5)
    fresh.renderSilence(0.1)
    const held = fresh.renderSilence(2)
    fresh.renderSilence(4)
    const later = fresh.renderSilence(2)
    expect(held.rms).toBeGreaterThan(1e-2)
    expect(Math.abs(later.rms - held.rms)).toBeLessThan(0.1 * held.rms)
  })

  it('stays finite under loud input at maximum feedback', async () => {
    const harness = await loadWet()
    harness.set(ETHER_REVERB_PARAMS.decay, 30)
    harness.set(ETHER_REVERB_PARAMS.size, 1)
    harness.set(ETHER_REVERB_PARAMS.damping, 0)
    const peak = harness.feedTone(5, 110, 0.9)
    expect(Number.isFinite(peak)).toBe(true)
    expect(peak).toBeLessThan(8)
  })

  it("exposes Ether's decay law", () => {
    const defaults = etherReverbLaw(5, 0.6, 0.4, false)
    const f = (5 - 0.5) / 29.5
    expect(defaults.roomSize).toBeCloseTo(0.6 + 0.3 * f, 6)
    expect(defaults.damping).toBeCloseTo(0.4 - 0.2 * f, 6)
    expect(defaults.feedback).toBeCloseTo(defaults.roomSize * 0.28 + 0.7, 6)
    const clamped = etherReverbLaw(30, 0.9, 0.1, false)
    expect(clamped.roomSize).toBe(1)
    expect(clamped.damping).toBe(0)
    expect(clamped.feedback).toBeCloseTo(0.98, 6)
    expect(etherReverbLaw(5, 0.6, 0.4, true)).toEqual({ roomSize: 0.999, damping: 0, feedback: 1 })
  })
})
