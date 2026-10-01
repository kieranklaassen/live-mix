// The bridge between the audio graph and a hosted plug-in. All the work is in
// `BridgeKernel`; this file is its AudioWorkletGlobalScope wrapper, bundled to
// a single self-contained file (dist/worklets/native-bridge.js).

import { BridgeKernel } from '../BridgeKernel'
import { NATIVE_BRIDGE_PROCESSOR_NAME, type NativeBridgeProcessorOptions } from '../bridge-protocol'

class NativeBridgeProcessor extends AudioWorkletProcessor {
  private readonly kernel: BridgeKernel
  private running = true

  constructor(options?: AudioWorkletNodeOptions) {
    super()
    this.kernel = new BridgeKernel(options?.processorOptions as NativeBridgeProcessorOptions)
    this.port.onmessage = (event: MessageEvent<{ type: string }>) => {
      if (event.data.type === 'dispose') this.running = false
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (!this.running) return false
    this.kernel.process(inputs[0] ?? [], outputs[0] ?? [])
    return true
  }
}

registerProcessor(NATIVE_BRIDGE_PROCESSOR_NAME, NativeBridgeProcessor)
