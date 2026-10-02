// The bridge between the audio graph and a hosted plug-in. All the work is in
// `BridgeKernel`; this file is its AudioWorkletGlobalScope wrapper, bundled to
// a single self-contained file (dist/worklets/native-bridge.js).

import { LOAD_CELL_BUSY, loadCells } from '../../core/load-mark'
import { BridgeKernel } from '../BridgeKernel'
import { NATIVE_BRIDGE_PROCESSOR_NAME, type NativeBridgeProcessorOptions } from '../bridge-protocol'

class NativeBridgeProcessor extends AudioWorkletProcessor {
  private readonly kernel: BridgeKernel
  private running = true
  // Where this processor shows that it is at work, for the engine's load figure.
  private readonly load: Int32Array | null
  private readonly loadMark: number

  constructor(options?: AudioWorkletNodeOptions) {
    super()
    const processorOptions = options?.processorOptions as NativeBridgeProcessorOptions
    this.kernel = new BridgeKernel(processorOptions)
    this.load = loadCells(processorOptions.load)
    this.loadMark = processorOptions.load?.slot ?? 0
    this.port.onmessage = (event: MessageEvent<{ type: string }>) => {
      if (event.data.type === 'dispose') this.running = false
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (!this.running) return false
    const load = this.load
    if (load) Atomics.store(load, LOAD_CELL_BUSY, this.loadMark)
    this.kernel.process(inputs[0] ?? [], outputs[0] ?? [])
    if (load) Atomics.store(load, LOAD_CELL_BUSY, 0)
    return true
  }
}

registerProcessor(NATIVE_BRIDGE_PROCESSOR_NAME, NativeBridgeProcessor)
