// A second-order filter per channel (transposed direct form II) with the RBJ
// cookbook's high-pass, low-pass and band-pass shapes: what the three cleanup
// kernels that split or notch a voice in time are made of.

import { CLEANUP_MAX_CHANNELS } from './CleanupKernel'

/** States under this are flushed to zero: denormal guard. */
const STATE_FLOOR = 1e-20

export class Biquad {
  private b0 = 1
  private b1 = 0
  private b2 = 0
  private a1 = 0
  private a2 = 0
  private readonly z1 = new Float64Array(CLEANUP_MAX_CHANNELS)
  private readonly z2 = new Float64Array(CLEANUP_MAX_CHANNELS)

  highPass(sampleRate: number, frequency: number, q = Math.SQRT1_2): this {
    const { cos, alpha } = shape(sampleRate, frequency, q)
    return this.set((1 + cos) / 2, -(1 + cos), (1 + cos) / 2, 1 + alpha, -2 * cos, 1 - alpha)
  }

  lowPass(sampleRate: number, frequency: number, q = Math.SQRT1_2): this {
    const { cos, alpha } = shape(sampleRate, frequency, q)
    return this.set((1 - cos) / 2, 1 - cos, (1 - cos) / 2, 1 + alpha, -2 * cos, 1 - alpha)
  }

  /** A band-pass at `frequency`, `widthHz` wide between its −3 dB points, at unity gain at its centre. */
  bandPass(sampleRate: number, frequency: number, widthHz: number): this {
    const { cos, alpha } = shape(sampleRate, frequency, frequency / Math.max(widthHz, 1e-3))
    return this.set(alpha, 0, -alpha, 1 + alpha, -2 * cos, 1 - alpha)
  }

  /** One sample of `channel` through the filter. */
  tick(channel: number, x: number): number {
    const y = this.b0 * x + this.z1[channel]
    let z1 = this.b1 * x - this.a1 * y + this.z2[channel]
    let z2 = this.b2 * x - this.a2 * y
    if (Math.abs(z1) < STATE_FLOOR) z1 = 0
    if (Math.abs(z2) < STATE_FLOOR) z2 = 0
    this.z1[channel] = z1
    this.z2[channel] = z2
    return y
  }

  clear(): void {
    this.z1.fill(0)
    this.z2.fill(0)
  }

  private set(b0: number, b1: number, b2: number, a0: number, a1: number, a2: number): this {
    this.b0 = b0 / a0
    this.b1 = b1 / a0
    this.b2 = b2 / a0
    this.a1 = a1 / a0
    this.a2 = a2 / a0
    return this
  }
}

function shape(sampleRate: number, frequency: number, q: number): { cos: number; alpha: number } {
  const w = (2 * Math.PI * Math.min(frequency, sampleRate * 0.49)) / sampleRate
  return { cos: Math.cos(w), alpha: Math.sin(w) / (2 * q) }
}
