// AudioWorklet processor measuring BS.1770-4 loudness (momentary, short-term,
// gated integrated), sample peak and true peak of whatever feeds it, posting a
// reading over the MessagePort at a bounded rate (≤ 30 Hz). A sink: one stereo
// input, no outputs, so it taps a bus without sitting in the audio path.
//
// All state is preallocated in the constructor; process() only runs the
// analyser and, every interval, posts one small object. When the input is
// disconnected it analyses silence so the windows keep moving and the
// displayed loudness falls the way a hardware meter's would.
//
// This file runs in the AudioWorkletGlobalScope and is bundled to a single
// self-contained file (dist/worklets/meter.js). The imports below are inlined
// by the bundler.

import { LoudnessAnalyzer } from '../../core/analysis/loudness'
import {
  DEFAULT_METER_INTERVAL_MS,
  METER_PROCESSOR_NAME,
  clampMeterInterval,
  type MeterHostMessage,
  type MeterMessage,
  type MeterProcessorOptions,
} from '../../core/analysis/meter-protocol'

const DEFAULT_RENDER_QUANTUM = 128

class MeterProcessor extends AudioWorkletProcessor {
  private readonly analyzer = new LoudnessAnalyzer(sampleRate)
  private intervalFrames = 1
  private framesSincePost = 0
  private alive = true
  private silence = new Float32Array(DEFAULT_RENDER_QUANTUM)

  constructor(options?: AudioWorkletNodeOptions) {
    super()
    const processorOptions = options?.processorOptions as MeterProcessorOptions | undefined
    this.setInterval(processorOptions?.intervalMs ?? DEFAULT_METER_INTERVAL_MS)
    this.port.onmessage = (event: MessageEvent<MeterMessage>) => {
      this.handleMessage(event.data)
    }
  }

  private setInterval(intervalMs: number): void {
    this.intervalFrames = Math.max(
      1,
      Math.round((clampMeterInterval(intervalMs) / 1000) * sampleRate),
    )
  }

  private handleMessage(message: MeterMessage): void {
    switch (message.type) {
      case 'reset':
        this.analyzer.reset()
        this.framesSincePost = 0
        break
      case 'set-interval':
        this.setInterval(message.intervalMs)
        break
      case 'dispose':
        this.alive = false
        break
      default: {
        const unhandled: never = message
        throw new Error(`live-mix: unhandled meter message ${JSON.stringify(unhandled)}`)
      }
    }
  }

  process(inputs: Float32Array[][]): boolean {
    if (!this.alive) return false
    const input = inputs[0]
    let frames: number
    if (input !== undefined && input.length > 0) {
      const left = input[0]
      const right = input.length > 1 ? input[1] : left
      frames = left.length
      this.analyzer.process(left, right, frames)
    } else {
      // Disconnected: keep time moving. The render quantum is fixed per
      // context, so this reallocation happens at most once.
      frames = this.silence.length
      this.analyzer.process(this.silence, this.silence, frames)
    }
    if (frames > this.silence.length) this.silence = new Float32Array(frames)

    this.framesSincePost += frames
    if (this.framesSincePost >= this.intervalFrames) {
      this.framesSincePost = 0
      const message: MeterHostMessage = { type: 'reading', reading: this.analyzer.read() }
      this.port.postMessage(message)
    }
    return true
  }
}

registerProcessor(METER_PROCESSOR_NAME, MeterProcessor)
