// Loads a committed device artefact in Node exactly as the worklet does (empty
// import object, one instance, fixed memory) and drives its stereo bus. Shared
// by the per-device WASM tests so every module is checked against the same
// contract.

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { type ParamSpec } from '../../core/params'
import { type DeviceExports } from '../abi'

const wasmDir = join(dirname(fileURLToPath(import.meta.url)), '../wasm')

export const DEVICE_EXPORT_NAMES = [
  'device_init',
  'device_set_param',
  'device_in_left',
  'device_in_right',
  'device_out_left',
  'device_out_right',
  'device_max_block_frames',
  'device_process',
] as const

export interface WasmDeviceHarness {
  device: DeviceExports
  maxBlock: number
  sampleRate: number
  view(pointer: number, frames: number): Float32Array
  set(spec: ParamSpec, value: number): void
  /** Writes one block into both inputs and processes it. */
  processBlock(left: ArrayLike<number>, right?: ArrayLike<number>): void
  /** Renders `seconds` of silence; returns the peak and left-channel RMS. */
  renderSilence(seconds: number): { peak: number; rms: number }
  /** Feeds `seconds` of a sine into both channels; returns the peak after `skipSeconds`. */
  feedTone(seconds: number, frequency: number, gain: number, skipSeconds?: number): number
}

const BLOCK = 128

export async function loadWasmDevice(name: string, sampleRate = 48000): Promise<WasmDeviceHarness> {
  const bytes = await readFile(join(wasmDir, `${name}.wasm`))
  const { instance } = await WebAssembly.instantiate(bytes, {})
  const device = instance.exports as unknown as DeviceExports
  device._initialize?.()
  const maxBlock = device.device_max_block_frames()
  device.device_init(sampleRate, maxBlock)

  const view = (pointer: number, frames: number) =>
    new Float32Array(device.memory.buffer, pointer, frames)

  const processBlock = (left: ArrayLike<number>, right: ArrayLike<number> = left) => {
    const frames = left.length
    view(device.device_in_left(), frames).set(left)
    view(device.device_in_right(), frames).set(right)
    device.device_process(frames)
  }

  const renderSilence = (seconds: number) => {
    const total = Math.floor(seconds * sampleRate)
    let peak = 0
    let sumSquares = 0
    for (let rendered = 0; rendered < total; rendered += BLOCK) {
      const frames = Math.min(BLOCK, total - rendered)
      device.device_process(frames)
      const left = view(device.device_out_left(), frames)
      const right = view(device.device_out_right(), frames)
      for (let i = 0; i < frames; i += 1) {
        if (!Number.isFinite(left[i]) || !Number.isFinite(right[i]))
          return { peak: Infinity, rms: Infinity }
        peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]))
        sumSquares += left[i] * left[i]
      }
    }
    return { peak, rms: Math.sqrt(sumSquares / Math.max(1, total)) }
  }

  const feedTone = (seconds: number, frequency: number, gain: number, skipSeconds = 0) => {
    const total = Math.floor(seconds * sampleRate)
    const skip = Math.floor(skipSeconds * sampleRate)
    const increment = (2 * Math.PI * frequency) / sampleRate
    let phase = 0
    let peak = 0
    const block = new Float32Array(BLOCK)
    for (let rendered = 0; rendered < total; rendered += BLOCK) {
      const frames = Math.min(BLOCK, total - rendered)
      for (let i = 0; i < frames; i += 1) {
        block[i] = gain * Math.sin(phase)
        phase += increment
      }
      processBlock(block.subarray(0, frames))
      if (rendered < skip) continue
      const left = view(device.device_out_left(), frames)
      const right = view(device.device_out_right(), frames)
      for (let i = 0; i < frames; i += 1) {
        if (!Number.isFinite(left[i]) || !Number.isFinite(right[i])) return Infinity
        peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]))
      }
    }
    return peak
  }

  return {
    device,
    maxBlock,
    sampleRate,
    view,
    set: (spec, value) => device.device_set_param(spec.id, value),
    processBlock,
    renderSilence,
    feedTone,
  }
}

export const dbToGain = (db: number): number => 10 ** (db / 20)
export const gainToDb = (gain: number): number => 20 * Math.log10(gain)
