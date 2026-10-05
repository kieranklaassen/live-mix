// The Ambient Limiter over a finished render, where it lies: what an export
// runs after its mix is rendered, in place of the limiter at the end of the
// master chain, when the limiter's Auto gain is on.
//
// Live, the auto gain finds its level as the piece plays and keeps it. A file
// cannot be found out as it goes: it would start too loud and come down over
// its first swell. So the limiter hears the whole of it first, and the lowest
// its auto gain came to (where the loudest part sat at the ceiling) is then
// the one gain the whole file gets, with the limiter working on that: the
// level the piece has live once the limiter has heard it through, from the
// file's first sample.
//
// The limiter's lookahead is taken off again, so the audio stays where it was.

import { type PlanarAudio } from '../core/render/encode'
import { type DeviceExports } from './abi'
import { compileWasm, type WasmSource } from './assets'
import { type WasmDeviceDescriptor } from './descriptor'
import {
  AMBIENT_LIMITER_DESCRIPTOR,
  AMBIENT_LIMITER_DEVICE,
  AMBIENT_LIMITER_METERS,
  AMBIENT_LIMITER_PARAMS,
  type AmbientLimiterParamName,
} from './devices/ambient-limiter.gen'

export type LimitRenderedParams = Partial<Record<AmbientLimiterParamName, number>>

export interface LimitRenderedOptions {
  /** How the limiter's module is compiled (default `compileWasm`, cached per URL). */
  compile?: (source: WasmSource, descriptor: WasmDeviceDescriptor) => Promise<WebAssembly.Module>
  /**
   * Hand the thread back after this many milliseconds of work, so a page
   * stays responsive (default 12). `0` runs in one go.
   */
  sliceMs?: number
  signal?: AbortSignal
}

export interface LimitedRender {
  /** The gain the whole of it was turned up by, dB: 0 with Auto gain off, at most the Auto gain setting. */
  autoGainDb: number
}

const BLOCK = 128

function nextTask(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Run `audio` (mono or stereo) through the Ambient Limiter at `params` and
 * leave the result in its own channels, as long as it was and not moved in
 * time. With Auto gain on, the gain is worked out for the whole of it first
 * and held from the first sample to the last.
 */
export async function limitRendered(
  audio: PlanarAudio,
  params: LimitRenderedParams = {},
  options: LimitRenderedOptions = {},
): Promise<LimitedRender> {
  const { channels, sampleRate } = audio
  if (channels.length < 1 || channels.length > 2) {
    throw new Error('live-mix: limitRendered takes mono or stereo audio')
  }
  const left = channels[0]
  const right = channels[1] ?? left
  if (right.length !== left.length) {
    throw new Error('live-mix: limitRendered channels differ in length')
  }
  const frames = left.length
  const stereo = channels.length === 2

  const source = AMBIENT_LIMITER_DEVICE.wasm()
  const module = await (options.compile
    ? options.compile(source, AMBIENT_LIMITER_DESCRIPTOR)
    : compileWasm(source))
  const start = async (values: LimitRenderedParams): Promise<DeviceExports> => {
    const instance = await WebAssembly.instantiate(module, {})
    const device = instance.exports as unknown as DeviceExports
    device._initialize?.()
    device.device_init(sampleRate, device.device_max_block_frames())
    for (const [name, value] of Object.entries(values)) {
      // Its own parameters only: `constructor` is on every object.
      if (value !== undefined && Object.hasOwn(AMBIENT_LIMITER_PARAMS, name)) {
        device.device_set_param(AMBIENT_LIMITER_PARAMS[name as AmbientLimiterParamName].id, value)
      }
    }
    return device
  }

  const sliceMs = options.sliceMs ?? 12
  let sliceStart = performance.now()
  const breathe = async (): Promise<void> => {
    if (sliceMs > 0 && performance.now() - sliceStart >= sliceMs) {
      await nextTask()
      options.signal?.throwIfAborted()
      sliceStart = performance.now()
    }
  }
  options.signal?.throwIfAborted()

  // Heard through once: the lowest the auto gain came to.
  let autoGainDb = 0
  if ((params.autoGain ?? AMBIENT_LIMITER_PARAMS.autoGain.default) > 0 && frames > 0) {
    const device = await start(params)
    const inLeft = new Float32Array(device.memory.buffer, device.device_in_left(), BLOCK)
    const inRight = new Float32Array(device.memory.buffer, device.device_in_right(), BLOCK)
    let lowest = Infinity
    for (let cursor = 0; cursor < frames; cursor += BLOCK) {
      const count = Math.min(BLOCK, frames - cursor)
      inLeft.set(left.subarray(cursor, cursor + count))
      inRight.set(right.subarray(cursor, cursor + count))
      device.device_process(count)
      lowest = Math.min(lowest, device.device_meter?.(AMBIENT_LIMITER_METERS.lift.id) ?? 0)
      await breathe()
    }
    autoGainDb = Number.isFinite(lowest) ? Math.max(0, lowest) : 0
  }

  // Then for good: that gain on what goes in, and the limiter without an auto gain of its own.
  const device = await start({ ...params, autoGain: 0 })
  const inLeft = new Float32Array(device.memory.buffer, device.device_in_left(), BLOCK)
  const inRight = new Float32Array(device.memory.buffer, device.device_in_right(), BLOCK)
  const outLeft = new Float32Array(device.memory.buffer, device.device_out_left(), BLOCK)
  const outRight = new Float32Array(device.memory.buffer, device.device_out_right(), BLOCK)
  const scale = 10 ** (autoGainDb / 20)
  const latency = AMBIENT_LIMITER_DEVICE.latencySamples?.(sampleRate) ?? 0
  // What comes out is `latency` frames behind what went in, so it is written
  // that far back, over frames already read; silence after the end brings the last of it out.
  for (let cursor = 0; cursor < frames + latency; cursor += BLOCK) {
    const count = Math.min(BLOCK, frames + latency - cursor)
    const fed = Math.max(0, Math.min(count, frames - cursor))
    for (let i = 0; i < fed; i += 1) {
      inLeft[i] = left[cursor + i] * scale
      inRight[i] = right[cursor + i] * scale
    }
    inLeft.fill(0, fed, count)
    inRight.fill(0, fed, count)
    device.device_process(count)
    const from = Math.max(0, latency - cursor)
    if (from < count) {
      left.set(outLeft.subarray(from, count), cursor + from - latency)
      if (stereo) right.set(outRight.subarray(from, count), cursor + from - latency)
    }
    await breathe()
  }
  return { autoGainDb }
}
