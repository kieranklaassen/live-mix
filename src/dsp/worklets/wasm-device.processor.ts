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
// allowed here; the ABI import below is type-only.

import {
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

    this.port.onmessage = (event: MessageEvent<DeviceMessage>) => {
      this.handleMessage(event.data)
    }
    const ready: DeviceHostMessage = { type: 'ready', maxBlockFrames: this.maxBlockFrames }
    this.port.postMessage(ready)
  }

  private handleMessage(message: DeviceMessage): void {
    switch (message.type) {
      case 'set-param':
        this.device.device_set_param(message.paramId, message.value)
        break
      default: {
        const unhandled: never = message.type
        throw new Error(`live-mix: unhandled device message ${String(unhandled)}`)
      }
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const output = outputs[0]
    if (!output || output.length === 0) return true
    const frames = Math.min(output[0].length, this.maxBlockFrames)

    if (this.outLeft.length !== frames) {
      const memory = this.device.memory.buffer
      this.outLeft = new Float32Array(memory, this.device.device_out_left(), frames)
      this.outRight = new Float32Array(memory, this.device.device_out_right(), frames)
      this.inLeft = new Float32Array(memory, this.device.device_in_left(), frames)
      this.inRight = new Float32Array(memory, this.device.device_in_right(), frames)
    }

    // A disconnected input is an empty array; the device clears its input
    // buffers every block, so silence needs no work here.
    const input = inputs[0]
    if (input !== undefined && input.length > 0) {
      this.inLeft.set(input[0].subarray(0, frames))
      this.inRight.set((input.length > 1 ? input[1] : input[0]).subarray(0, frames))
    }

    this.device.device_process(frames)
    output[0].set(this.outLeft)
    if (output.length > 1) output[1].set(this.outRight)

    return true
  }
}

registerProcessor('live-mix-wasm-device', WasmDeviceProcessor)
