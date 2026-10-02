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
    return this.levels().peak
  }

  /** RMS level of the current window, 0..1. */
  rms(): number {
    return this.levels().rms
  }

  /**
   * Peak and RMS of the current window, both 0..1, from one read of the
   * analyser and one pass over it: what a meter drawn on every frame asks
   * for, at half the work of `peak()` and then `rms()`.
   */
  levels(): { peak: number; rms: number } {
    const buffer = this.buffer
    this.node.getFloatTimeDomainData(buffer)
    let peak = 0
    let sum = 0
    for (const value of buffer) {
      const magnitude = value < 0 ? -value : value
      if (magnitude > peak) peak = magnitude
      sum += value * value
    }
    return { peak: Math.min(peak, 1), rms: Math.min(Math.sqrt(sum / buffer.length), 1) }
  }

  dispose(): void {
    try {
      this.node.disconnect()
    } catch {
      // Context may already be closed; ignore.
    }
  }
}
