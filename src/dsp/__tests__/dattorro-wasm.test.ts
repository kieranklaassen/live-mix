import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { type DeviceExports } from '../abi'
import { DATTORRO_PARAMS } from '../devices/dattorro'

const wasmPath = join(dirname(fileURLToPath(import.meta.url)), '../wasm/dattorro.wasm')

async function loadDevice(sampleRate = 48000) {
  const bytes = await readFile(wasmPath)
  const { instance } = await WebAssembly.instantiate(bytes, {})
  const device = instance.exports as unknown as DeviceExports
  device._initialize?.()
  const maxBlock = device.device_max_block_frames()
  device.device_init(sampleRate, maxBlock)
  const view = (pointer: number, frames: number) =>
    new Float32Array(device.memory.buffer, pointer, frames)
  return { device, maxBlock, view }
}

describe('dattorro.wasm (committed artefact)', () => {
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
    device.device_set_param(DATTORRO_PARAMS.mix.id, 0)
    const frames = 128
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

  it('applies dry*(1-mix) + wet*mix with the default mix of 0.35', async () => {
    const { device, view } = await loadDevice()
    view(device.device_in_left(), 1)[0] = 1
    view(device.device_in_right(), 1)[0] = 0.5
    device.device_process(1)
    expect(view(device.device_out_left(), 1)[0]).toBeCloseTo(0.65, 6)
    expect(view(device.device_out_right(), 1)[0]).toBeCloseTo(0.325, 6)
  })

  it('produces a decaying reverb tail at mix 1', async () => {
    const { device, view } = await loadDevice()
    device.device_set_param(DATTORRO_PARAMS.mix.id, 1)
    device.device_set_param(DATTORRO_PARAMS.decay.id, 0.7)
    device.device_set_param(DATTORRO_PARAMS.predelayMs.id, 1)
    const frames = 128
    const sampleRate = 48000
    // 50 ms of an 880 Hz tone into both channels.
    let phase = 0
    for (let block = 0; block < Math.floor((0.05 * sampleRate) / frames); block += 1) {
      const inL = view(device.device_in_left(), frames)
      const inR = view(device.device_in_right(), frames)
      for (let i = 0; i < frames; i += 1) {
        const value = Math.sin(phase)
        phase += (2 * Math.PI * 880) / sampleRate
        inL[i] = value
        inR[i] = value
      }
      device.device_process(frames)
    }
    const rmsOverSeconds = (seconds: number) => {
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
    const early = rmsOverSeconds(0.5)
    rmsOverSeconds(2)
    const late = rmsOverSeconds(0.5)
    expect(early).toBeGreaterThan(1e-5)
    expect(late).toBeLessThan(early)
    expect(Number.isFinite(late)).toBe(true)
  })
})
