import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { type DeviceExports } from '../abi'
import { STEREO_WIDENER_PARAMS } from '../devices/stereo-widener'

const wasmPath = join(dirname(fileURLToPath(import.meta.url)), '../wasm/stereo-widener.wasm')
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

type Device = Awaited<ReturnType<typeof loadDevice>>

/** Deterministic white noise in [-gain, gain), same LCG as the native harness. */
function noise(seed: number, gain: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return gain * ((state >>> 8) / 8388608 - 1)
  }
}

function tone(frequency: number, gain: number) {
  let phase = 0
  return () => {
    const value = gain * Math.sin(phase)
    phase += (2 * Math.PI * frequency) / sampleRate
    return value
  }
}

/** Runs `seconds` of a generated signal, returning stats over the tail after `discardSeconds`. */
function run(
  { device, view }: Device,
  seconds: number,
  discardSeconds: number,
  left: () => number,
  right: () => number,
) {
  let sumLL = 0
  let sumRR = 0
  let sumLR = 0
  let sumMid = 0
  let sumSide = 0
  let maxDelta = 0
  let peak = 0
  let finite = true
  const total = Math.floor((seconds * sampleRate) / frames)
  const discard = Math.floor((discardSeconds * sampleRate) / frames)
  for (let block = 0; block < total; block += 1) {
    const inL = view(device.device_in_left(), frames)
    const inR = view(device.device_in_right(), frames)
    const copyL = new Float32Array(frames)
    const copyR = new Float32Array(frames)
    for (let i = 0; i < frames; i += 1) {
      copyL[i] = inL[i] = left()
      copyR[i] = inR[i] = right()
    }
    device.device_process(frames)
    if (block < discard) continue
    const outL = view(device.device_out_left(), frames)
    const outR = view(device.device_out_right(), frames)
    for (let i = 0; i < frames; i += 1) {
      const l = outL[i]
      const r = outR[i]
      if (!Number.isFinite(l) || !Number.isFinite(r)) finite = false
      sumLL += l * l
      sumRR += r * r
      sumLR += l * r
      sumMid += ((l + r) / 2) ** 2
      sumSide += ((l - r) / 2) ** 2
      maxDelta = Math.max(maxDelta, Math.abs(l - copyL[i]), Math.abs(r - copyR[i]))
      peak = Math.max(peak, Math.abs(l), Math.abs(r))
    }
  }
  return {
    finite,
    peak,
    maxDelta,
    correlation: sumLR / Math.sqrt(sumLL * sumRR),
    sideToMid: Math.sqrt(sumSide) / Math.sqrt(sumMid),
  }
}

const silence = () => 0

async function deviceAtWidth(width: number) {
  const loaded = await loadDevice()
  loaded.device.device_set_param(STEREO_WIDENER_PARAMS.width.id, width)
  // Let the 5 ms width ramp settle before measuring.
  run(loaded, 0.01, 0, silence, silence)
  return loaded
}

describe('stereo-widener.wasm (committed artefact)', () => {
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

  it('passes mono input through unchanged at the default width and clears the input', async () => {
    const loaded = await loadDevice()
    const { device, view } = loaded
    const source = noise(1, 0.5)
    let shared = 0
    const left = () => (shared = source())
    const right = () => shared
    const out = run(loaded, 0.1, 0, left, right)
    expect(out.finite).toBe(true)
    expect(out.maxDelta).toBeLessThan(1e-6)

    device.device_process(frames)
    expect(Math.max(...view(device.device_out_left(), frames).map(Math.abs))).toBe(0)
    expect(Math.max(...view(device.device_out_right(), frames).map(Math.abs))).toBe(0)
  })

  it('folds unrelated highs to mono at width 0', async () => {
    const loaded = await deviceAtWidth(0)
    const out = run(loaded, 0.4, 0.2, tone(3000, 0.5), tone(7000, 0.5))
    expect(out.finite).toBe(true)
    expect(out.sideToMid).toBeLessThan(0.1)
    expect(out.correlation).toBeGreaterThan(0.98)
  })

  it('boosts side energy through the M/S range and decorrelates above 0.75', async () => {
    const ratios: number[] = []
    for (const width of [0, 0.25, 0.5, 0.75]) {
      const out = run(await deviceAtWidth(width), 0.4, 0.2, noise(7, 0.5), noise(99, 0.5))
      expect(out.finite).toBe(true)
      ratios.push(out.sideToMid)
    }
    for (let i = 1; i < ratios.length; i += 1) {
      expect(ratios[i]).toBeGreaterThan(ratios[i - 1] * 1.2)
    }
    expect(ratios[2]).toBeCloseTo(1, 1)
    expect(ratios[3]).toBeGreaterThan(2)

    const mono = (loaded: Device) => {
      const source = noise(3, 0.5)
      let shared = 0
      return run(
        loaded,
        0.4,
        0.2,
        () => (shared = source()),
        () => shared,
      )
    }
    const normal = mono(await deviceAtWidth(0.75))
    const wide = mono(await deviceAtWidth(1))
    expect(normal.correlation).toBeGreaterThan(0.9999)
    expect(wide.correlation).toBeLessThan(0.5)
    expect(wide.sideToMid).toBeGreaterThan(0.5)
  })

  it('keeps hard-panned bass narrow while the highs go wide at width 1', async () => {
    const bass = run(await deviceAtWidth(1), 1, 0.5, tone(40, 0.5), silence)
    const highs = run(await deviceAtWidth(1), 0.4, 0.2, tone(6000, 0.5), silence)
    expect(bass.finite && highs.finite).toBe(true)
    expect(bass.sideToMid).toBeLessThan(0.6)
    expect(bass.correlation).toBeGreaterThan(highs.correlation + 0.5)
    expect(highs.correlation).toBeLessThan(0.5)
  })

  it('returns to bit-exact silence after a stereo burst (denormal guard)', async () => {
    const loaded = await deviceAtWidth(1)
    run(loaded, 0.05, 0, tone(220, 1), tone(330, 0.3))
    const decay = run(loaded, 0.5, 0, silence, silence)
    const settled = run(loaded, 0.5, 0, silence, silence)
    expect(decay.finite && settled.finite).toBe(true)
    expect(settled.peak).toBe(0)
  })
})
