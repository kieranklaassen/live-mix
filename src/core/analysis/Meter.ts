// Peak/RMS meter on an AnalyserNode, lifted from ambient-live's
// audio-engine.ts (fftSize 2048, time-domain peak). Pass-through: connect the
// signal into `node` and `node` on to wherever it was going; poll `peak()` at
// UI rate.

export interface MeterOptions {
  fftSize?: number
}

export class Meter {
  readonly node: AnalyserNode
  private readonly buffer: Float32Array<ArrayBuffer>

  constructor(ctx: BaseAudioContext, options: MeterOptions = {}) {
    this.node = ctx.createAnalyser()
    this.node.fftSize = options.fftSize ?? 2048
    this.buffer = new Float32Array(this.node.fftSize)
  }

  get input(): AudioNode {
    return this.node
  }

  get output(): AudioNode {
    return this.node
  }

  /** Peak absolute level of the current window, 0..1. */
  peak(): number {
    this.node.getFloatTimeDomainData(this.buffer)
    let peak = 0
    for (const value of this.buffer) {
      const magnitude = Math.abs(value)
      if (magnitude > peak) peak = magnitude
    }
    return Math.min(peak, 1)
  }

  /** RMS level of the current window, 0..1. */
  rms(): number {
    this.node.getFloatTimeDomainData(this.buffer)
    let sum = 0
    for (const value of this.buffer) sum += value * value
    return Math.min(Math.sqrt(sum / this.buffer.length), 1)
  }

  dispose(): void {
    try {
      this.node.disconnect()
    } catch {
      // Context may already be closed; ignore.
    }
  }
}
