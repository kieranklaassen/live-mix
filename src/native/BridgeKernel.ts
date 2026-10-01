// The worklet side of the bridge, without the worklet: one call per render
// quantum that writes the input into the shared ring, wakes the pump, and
// fills the output with what the host returned for the quantum
// `latencyFrames` earlier. No allocation, no locks, no waiting.

import {
  BRIDGE_ACTIVE,
  BRIDGE_LATENCY,
  BRIDGE_READY,
  BRIDGE_UNDERRUNS,
  BRIDGE_WRITTEN,
  frameDistance,
  readRing,
  writeRing,
  type BridgeMemory,
} from './bridge-protocol'

export class BridgeKernel {
  private readonly control: Int32Array
  private readonly input: Float32Array
  private readonly output: Float32Array
  private readonly inputChannels: number
  private readonly outputChannels: number
  private readonly ringFrames: number
  private readonly silence: Float32Array
  private written: number

  constructor(memory: BridgeMemory, maxQuantumFrames = 128) {
    this.control = new Int32Array(memory.control)
    this.input = new Float32Array(memory.input)
    this.output = new Float32Array(memory.output)
    this.inputChannels = memory.inputChannels
    this.outputChannels = memory.outputChannels
    this.ringFrames = memory.ringFrames
    this.silence = new Float32Array(maxQuantumFrames)
    this.written = Atomics.load(this.control, BRIDGE_WRITTEN)
  }

  /**
   * `input` and `output` are one node input and one node output: a list of
   * channels, each one render quantum long. A missing input channel counts
   * as silence; the last one present feeds any further ring channel.
   */
  process(input: readonly Float32Array[], output: readonly Float32Array[]): void {
    const frames = output[0]?.length ?? input[0]?.length ?? 0
    if (frames === 0) return
    const { control, ringFrames } = this
    const start = this.written

    for (let channel = 0; channel < this.inputChannels; channel += 1) {
      const source =
        input.length === 0 ? this.silenceOf(frames) : input[Math.min(channel, input.length - 1)]
      writeRing(this.input, ringFrames, channel, start, source, 0, frames)
    }
    this.written = (start + frames) | 0
    Atomics.store(control, BRIDGE_WRITTEN, this.written)
    Atomics.notify(control, BRIDGE_WRITTEN)

    const playFrom = (start - Atomics.load(control, BRIDGE_LATENCY)) | 0
    const active = Atomics.load(control, BRIDGE_ACTIVE) === 1
    const ready = Atomics.load(control, BRIDGE_READY)
    if (active && frameDistance(ready, playFrom) >= frames) {
      for (let channel = 0; channel < output.length; channel += 1) {
        const from = Math.min(channel, this.outputChannels - 1)
        readRing(this.output, ringFrames, from, playFrom, output[channel], 0, frames)
      }
      return
    }

    for (const channel of output) channel.fill(0)
    if (active) Atomics.add(control, BRIDGE_UNDERRUNS, 1)
  }

  private silenceOf(frames: number): Float32Array {
    return frames <= this.silence.length ? this.silence : new Float32Array(frames)
  }
}
