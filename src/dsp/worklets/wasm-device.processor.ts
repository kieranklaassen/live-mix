// AudioWorklet processor hosting one WASM device (cpp/common/device_api.h).
//
// The compiled WebAssembly.Module arrives via processorOptions and is
// instantiated synchronously here, before audio flows, with an empty import
// object: device modules are built with no JS glue. Memory is fixed-size, so
// the heap views taken on the first block stay valid; process() never
// allocates. Lifted from ambient-live's engine-processor.ts and made
// device-agnostic.
//
// This file runs in the AudioWorkletGlobalScope and is bundled to a single
// self-contained file (dist/worklets/wasm-device.js). Runtime imports are not
// allowed here; the ABI import below is type-only and the constants are
// inlined by the bundler.

import { LOAD_CELL_BUSY, loadCells } from '../../core/load-mark'
import {
  BYPASS_RAMP_SECONDS,
  WASM_DEVICE_PROCESSOR_NAME,
  type DeviceExports,
  type DeviceHostMessage,
  type DeviceMessage,
  type WasmDeviceProcessorOptions,
} from '../abi'

class WasmDeviceProcessor extends AudioWorkletProcessor {
  private readonly device: DeviceExports
  private readonly maxBlockFrames: number
  private outLeft = new Float32Array(0)
  private outRight = new Float32Array(0)
  private inLeft = new Float32Array(0)
  private inRight = new Float32Array(0)
  // Dry copies for the bypass crossfade; the device clears its input buffers.
  private dryLeft = new Float32Array(0)
  private dryRight = new Float32Array(0)
  // 0 = fully processed, 1 = fully dry. Ramps per sample toward the target.
  private bypassMix = 0
  private bypassTarget = 0
  private readonly bypassStep: number
  // Meters are reported only while the main thread watches them.
  private meterCount = 0
  private meterInterval = 0
  private meterElapsed = 0
  // False once the host has disposed the device: `process` then ends the node.
  private running = true
  // Where this processor shows that it is at work, for the engine's load figure.
  private readonly load: Int32Array | null
  private readonly loadMark: number

  constructor(options?: AudioWorkletNodeOptions) {
    super()
    const processorOptions = options?.processorOptions as WasmDeviceProcessorOptions | undefined
    if (!processorOptions?.module) {
      throw new Error('live-mix: WasmDeviceProcessor needs processorOptions.module')
    }
    const instance = new WebAssembly.Instance(processorOptions.module, {})
    this.device = instance.exports as unknown as DeviceExports
    this.device._initialize?.()
    this.maxBlockFrames = this.device.device_max_block_frames()
    this.device.device_init(sampleRate, this.maxBlockFrames)
    for (const [paramId, value] of processorOptions.params ?? []) {
      this.device.device_set_param(paramId, value)
    }
    this.bypassStep = 1 / Math.max(1, BYPASS_RAMP_SECONDS * sampleRate)
    this.load = loadCells(processorOptions.load)
    this.loadMark = processorOptions.load?.slot ?? 0

    this.port.onmessage = (event: MessageEvent<DeviceMessage>) => {
      this.handleMessage(event.data)
    }
    const ready: DeviceHostMessage = {
      type: 'ready',
      deviceId: processorOptions.deviceId ?? 'unknown',
      maxBlockFrames: this.maxBlockFrames,
    }
    this.port.postMessage(ready)
  }

  private handleMessage(message: DeviceMessage): void {
    switch (message.type) {
      case 'set-param':
        this.device.device_set_param(message.paramId, message.value)
        break
      case 'bypass':
        this.bypassTarget = message.enabled ? 1 : 0
        break
      case 'note-on':
        this.device.device_note_on?.(message.noteId, message.frequency, message.gain)
        break
      case 'note-off':
        this.device.device_note_off?.(message.noteId)
        break
      case 'sample':
        this.loadSample(message.channels, message.sampleRate)
        break
      case 'meters':
        this.meterCount = this.device.device_meter ? Math.max(0, Math.floor(message.count)) : 0
        this.meterInterval = Math.max(1, Math.floor(message.intervalFrames))
        // The first report goes out with the next block.
        this.meterElapsed = this.meterInterval
        break
      case 'dispose':
        this.running = false
        break
      default: {
        const unhandled: never = message
        throw new Error(`live-mix: unhandled device message ${JSON.stringify(unhandled)}`)
      }
    }
  }

  // Copy a sound into a sample device's fixed store (cpp/kit/sample.h).
  // Runs between blocks on the audio thread; anything past the device's
  // capacity is dropped. Devices without the exports ignore the message.
  private loadSample(channels: Float32Array[], rate: number): void {
    const { device_sample_capacity, device_sample_buffer, device_sample_commit } = this.device
    if (!device_sample_capacity || !device_sample_buffer || !device_sample_commit) return
    if (channels.length === 0) return
    const capacity = device_sample_capacity()
    const frames = Math.min(channels[0].length, capacity)
    const count = Math.min(channels.length, 2)
    const store = new Float32Array(this.device.memory.buffer, device_sample_buffer(), capacity * 2)
    for (let channel = 0; channel < count; channel += 1) {
      store.set(channels[channel].subarray(0, frames), channel * capacity)
    }
    device_sample_commit(frames, count, rate)
  }

  // Read the device's meters and post them, once every `meterInterval` frames.
  private reportMeters(frames: number): void {
    this.meterElapsed += frames
    if (this.meterElapsed < this.meterInterval) return
    this.meterElapsed = 0
    const read = this.device.device_meter
    if (!read) return
    const values: number[] = []
    for (let index = 0; index < this.meterCount; index += 1) values.push(read(index))
    this.port.postMessage({ type: 'meters', values } satisfies DeviceHostMessage)
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    // A disconnected node whose processor keeps answering true is rendered for as long as the context lives.
    if (!this.running) return false
    const load = this.load
    if (!load) return this.render(inputs, outputs)
    Atomics.store(load, LOAD_CELL_BUSY, this.loadMark)
    const alive = this.render(inputs, outputs)
    Atomics.store(load, LOAD_CELL_BUSY, 0)
    return alive
  }

  private render(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const output = outputs[0]
    if (!output || output.length === 0) return true
    const frames = Math.min(output[0].length, this.maxBlockFrames)

    if (this.outLeft.length !== frames) {
      const memory = this.device.memory.buffer
      this.outLeft = new Float32Array(memory, this.device.device_out_left(), frames)
      this.outRight = new Float32Array(memory, this.device.device_out_right(), frames)
      this.inLeft = new Float32Array(memory, this.device.device_in_left(), frames)
      this.inRight = new Float32Array(memory, this.device.device_in_right(), frames)
      this.dryLeft = new Float32Array(frames)
      this.dryRight = new Float32Array(frames)
    }

    // A disconnected input is an empty array; the device clears its input
    // buffers every block, so silence needs no work here.
    const input = inputs[0]
    const hasInput = input !== undefined && input.length > 0
    if (hasInput) {
      const left = input[0].subarray(0, frames)
      const right = (input.length > 1 ? input[1] : input[0]).subarray(0, frames)
      this.inLeft.set(left)
      this.inRight.set(right)
      this.dryLeft.set(left)
      this.dryRight.set(right)
    } else {
      this.dryLeft.fill(0)
      this.dryRight.fill(0)
    }

    this.device.device_process(frames)
    if (this.meterCount > 0) this.reportMeters(frames)

    const outLeft = output[0]
    const outRight = output.length > 1 ? output[1] : null
    if (this.bypassMix === this.bypassTarget && this.bypassMix === 0) {
      outLeft.set(this.outLeft)
      outRight?.set(this.outRight)
      return true
    }

    // Bypass engaged or ramping: crossfade dry and processed per sample.
    for (let i = 0; i < frames; i += 1) {
      if (this.bypassMix < this.bypassTarget) {
        this.bypassMix = Math.min(this.bypassTarget, this.bypassMix + this.bypassStep)
      } else if (this.bypassMix > this.bypassTarget) {
        this.bypassMix = Math.max(this.bypassTarget, this.bypassMix - this.bypassStep)
      }
      const wet = 1 - this.bypassMix
      outLeft[i] = this.outLeft[i] * wet + this.dryLeft[i] * this.bypassMix
      if (outRight) outRight[i] = this.outRight[i] * wet + this.dryRight[i] * this.bypassMix
    }
    return true
  }
}

registerProcessor(WASM_DEVICE_PROCESSOR_NAME, WasmDeviceProcessor)
