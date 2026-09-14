import { describe, expect, it } from 'vitest'

import { FELT_PIANO_PARAMS, feltPianoKeyFor } from '../devices/felt-piano'
import { DEVICE_EXPORT_NAMES, loadWasmDevice, type WasmDeviceHarness } from './wasm-device-harness'

const sampleRate = 48000
const frames = 128
const noteHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

type Instrument = WasmDeviceHarness & {
  noteOn(id: number, frequency: number, gain: number): void
  noteOff(id: number): void
}

async function loadPiano(): Promise<Instrument> {
  const harness = await loadWasmDevice('felt-piano', sampleRate)
  const { device_note_on: noteOn, device_note_off: noteOff } = harness.device
  if (!noteOn || !noteOff) throw new Error('felt-piano.wasm must export device_note_on/off')
  return Object.assign(harness, {
    noteOn: (id: number, frequency: number, gain: number) => noteOn(id, frequency, gain),
    noteOff: (id: number) => noteOff(id),
  })
}

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

function capture(piano: Instrument, seconds: number) {
  const total = Math.floor(seconds * sampleRate)
  const out = new Float32Array(total)
  for (let rendered = 0; rendered < total; rendered += frames) {
    const n = Math.min(frames, total - rendered)
    piano.device.device_process(n)
    out.set(piano.view(piano.device.device_out_left(), n), rendered)
  }
  return out
}

describe('felt-piano.wasm (committed artefact)', () => {
  it('exports the device ABI plus the note entry points', async () => {
    const piano = await loadPiano()
    expect(piano.maxBlock).toBe(2048)
    for (const name of DEVICE_EXPORT_NAMES) expect(typeof piano.device[name]).toBe('function')
    expect(typeof piano.device.device_note_on).toBe('function')
    expect(typeof piano.device.device_note_off).toBe('function')
  })

  it('is silent with no notes and ignores the input bus', async () => {
    const piano = await loadPiano()
    piano.processBlock(new Float32Array(frames).fill(0.5))
    expect(Math.max(...piano.view(piano.device.device_out_left(), frames).map(Math.abs))).toBe(0)
    expect(piano.renderSilence(0.5).peak).toBe(0)
  })

  it('plays a key at its fundamental', async () => {
    const piano = await loadPiano()
    piano.set(FELT_PIANO_PARAMS.reverbMix, 0)
    piano.noteOn(1, 440, 0.6)
    capture(piano, 0.3)
    const out = capture(piano, 1)
    const fundamental = goertzelPower(out, 440.13) // A4 with Felt's inharmonic stretch
    expect(fundamental).toBeGreaterThan(20 * goertzelPower(out, 440 * 2 ** (-3 / 12)))
    expect(fundamental).toBeGreaterThan(20 * goertzelPower(out, 440 * 2 ** (3 / 12)))
  })

  it('releases a key on noteOff and holds it under the sustain pedal', async () => {
    const rms = (x: Float32Array) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length)

    const held = await loadPiano()
    held.set(FELT_PIANO_PARAMS.reverbMix, 0)
    held.noteOn(1, noteHz(57), 0.7)
    capture(held, 1)
    const heldRms = rms(capture(held, 0.5))

    const released = await loadPiano()
    released.set(FELT_PIANO_PARAMS.reverbMix, 0)
    released.noteOn(1, noteHz(57), 0.7)
    capture(released, 0.5)
    released.noteOff(1)
    capture(released, 0.5)
    expect(rms(capture(released, 0.5))).toBeLessThan(0.05 * heldRms)

    const pedalled = await loadPiano()
    pedalled.set(FELT_PIANO_PARAMS.reverbMix, 0)
    pedalled.noteOn(1, noteHz(57), 0.7)
    capture(pedalled, 0.5)
    pedalled.set(FELT_PIANO_PARAMS.sustain, 1)
    pedalled.noteOff(1)
    capture(pedalled, 0.5)
    expect(rms(capture(pedalled, 0.5))).toBeGreaterThan(0.5 * heldRms)
  })

  it('stays within the soft limiter under 48 ff keys and frees every voice', async () => {
    const piano = await loadPiano()
    piano.set(FELT_PIANO_PARAMS.sustain, 1)
    for (let n = 0; n < 48; n += 1) piano.noteOn(100 + n, noteHz(30 + n), 0.9)
    const out = capture(piano, 2)
    let peak = 0
    for (const v of out) {
      expect(Number.isFinite(v)).toBe(true)
      peak = Math.max(peak, Math.abs(v))
    }
    expect(peak).toBeLessThanOrEqual(1)
    expect(peak).toBeGreaterThan(0.3)
    for (let n = 0; n < 48; n += 1) piano.noteOff(100 + n)
    piano.set(FELT_PIANO_PARAMS.sustain, 0)
    const tail = piano.renderSilence(12)
    expect(Number.isFinite(tail.peak)).toBe(true)
    expect(piano.renderSilence(1).peak).toBe(0)
  })

  it('maps frequencies to keys like the C++', () => {
    expect(feltPianoKeyFor(440)).toBe(69)
    expect(feltPianoKeyFor(261.6256)).toBe(60)
    expect(feltPianoKeyFor(452)).toBe(69)
    expect(feltPianoKeyFor(466.16)).toBe(70)
    expect(feltPianoKeyFor(10)).toBe(21)
    expect(feltPianoKeyFor(9000)).toBe(108)
    expect(feltPianoKeyFor(0)).toBe(21)
    expect(feltPianoKeyFor(Number.NaN)).toBe(21)
  })
})
