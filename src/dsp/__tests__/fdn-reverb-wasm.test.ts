import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { type DeviceExports } from '../abi'
import { FDN_REVERB_PARAMS, fdnReverbBreathLaw } from '../devices/fdn-reverb'

const wasmPath = join(dirname(fileURLToPath(import.meta.url)), '../wasm/fdn-reverb.wasm')
const sampleRate = 48000
const frames = 128

async function loadDevice() {
  const bytes = await readFile(wasmPath)
  const { instance } = await WebAssembly.instantiate(bytes, {})
  const device = instance.exports as unknown as DeviceExports
  device._initialize?.()
  const maxBlock = device.device_max_block_frames()
  device.device_init(sampleRate, maxBlock)
  const view = (pointer: number, count: number) =>
    new Float32Array(device.memory.buffer, pointer, count)
  return { device, maxBlock, view }
}

function feedTone(
  device: DeviceExports,
  view: (pointer: number, count: number) => Float32Array,
  seconds: number,
  frequency: number,
) {
  let phase = 0
  for (let block = 0; block < Math.floor((seconds * sampleRate) / frames); block += 1) {
    const inL = view(device.device_in_left(), frames)
    const inR = view(device.device_in_right(), frames)
    for (let i = 0; i < frames; i += 1) {
      const value = Math.sin(phase)
      phase += (2 * Math.PI * frequency) / sampleRate
      inL[i] = value
      inR[i] = value
    }
    device.device_process(frames)
  }
}

function rmsOverSeconds(
  device: DeviceExports,
  view: (pointer: number, count: number) => Float32Array,
  seconds: number,
) {
  let sum = 0
  let count = 0
  for (let block = 0; block < Math.floor((seconds * sampleRate) / frames); block += 1) {
    device.device_process(frames)
    const out = view(device.device_out_left(), frames)
    for (let i = 0; i < frames; i += 1) {
      sum += out[i] * out[i]
      count += 1
    }
  }
  return Math.sqrt(sum / count)
}

describe('fdn-reverb.wasm (committed artefact)', () => {
  it('exports the device ABI with an empty import object', async () => {
    const { device, maxBlock } = await loadDevice()
    expect(maxBlock).toBe(2048)
    for (const name of [
      'device_init',
      'device_set_param',
      'device_in_left',
      'device_in_right',
      'device_out_left',
      'device_out_right',
      'device_max_block_frames',
      'device_process',
    ] as const) {
      expect(typeof device[name]).toBe('function')
    }
  })

  it('passes dry input through at mix 0 and clears the input between blocks', async () => {
    const { device, view } = await loadDevice()
    device.device_set_param(FDN_REVERB_PARAMS.mix.id, 0)
    view(device.device_in_left(), frames).fill(0.25)
    view(device.device_in_right(), frames).fill(-0.25)
    device.device_process(frames)
    const left = view(device.device_out_left(), frames)
    const right = view(device.device_out_right(), frames)
    expect(left[0]).toBeCloseTo(0.25, 6)
    expect(left[frames - 1]).toBeCloseTo(0.25, 6)
    expect(right[0]).toBeCloseTo(-0.25, 6)

    device.device_process(frames)
    expect(Math.max(...view(device.device_out_left(), frames).map(Math.abs))).toBe(0)
  })

  it('applies the equal-power mix law with the default mix of 0.5', async () => {
    const { device, view } = await loadDevice()
    view(device.device_in_left(), 1)[0] = 1
    view(device.device_in_right(), 1)[0] = 0.5
    device.device_process(1)
    expect(view(device.device_out_left(), 1)[0]).toBeCloseTo(Math.SQRT1_2, 5)
    expect(view(device.device_out_right(), 1)[0]).toBeCloseTo(Math.SQRT1_2 / 2, 5)
  })

  it('produces a decaying reverb tail at mix 1', async () => {
    const { device, view } = await loadDevice()
    device.device_set_param(FDN_REVERB_PARAMS.mix.id, 1)
    device.device_set_param(FDN_REVERB_PARAMS.breathDepth.id, 0)
    device.device_set_param(FDN_REVERB_PARAMS.decay.id, 2)
    feedTone(device, view, 0.05, 880)

    const early = rmsOverSeconds(device, view, 0.5)
    rmsOverSeconds(device, view, 2)
    const late = rmsOverSeconds(device, view, 0.5)
    expect(early).toBeGreaterThan(1e-5)
    expect(late).toBeLessThan(early)
    expect(Number.isFinite(late)).toBe(true)
  })

  it('shifts the tail onset with size and pre-delay', async () => {
    const onset = async (params: Partial<Record<keyof typeof FDN_REVERB_PARAMS, number>>) => {
      const { device, view } = await loadDevice()
      device.device_set_param(FDN_REVERB_PARAMS.mix.id, 1)
      for (const [name, value] of Object.entries(params)) {
        device.device_set_param(FDN_REVERB_PARAMS[name as keyof typeof FDN_REVERB_PARAMS].id, value)
      }
      view(device.device_in_left(), 1)[0] = 1
      view(device.device_in_right(), 1)[0] = 1
      for (let position = 0; position < sampleRate; position += frames) {
        device.device_process(frames)
        const out = view(device.device_out_left(), frames)
        for (let i = 0; i < frames; i += 1) {
          if (Math.abs(out[i]) > 1e-6) return position + i
        }
      }
      return -1
    }
    const base = await onset({})
    // Shortest coprime line: 4799 samples at 44.1 kHz, +/-12 samples of modulation.
    expect(Math.abs(base - Math.floor((4799 * sampleRate) / 44100))).toBeLessThanOrEqual(16)
    expect(Math.abs((await onset({ size: 2 })) - base * 2)).toBeLessThanOrEqual(32)
    expect(Math.abs((await onset({ predelayMs: 100 })) - base - 4800)).toBeLessThanOrEqual(16)
  })

  it('exposes the Tides breathing law', () => {
    expect(fdnReverbBreathLaw(0.25, 0.6)).toBeCloseTo(1, 6)
    expect(fdnReverbBreathLaw(0.75, 0.6)).toBeCloseTo(0.4, 6)
    expect(fdnReverbBreathLaw(0.5, 1)).toBeCloseTo(0.5, 6)
  })
})
