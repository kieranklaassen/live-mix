// What de-noise and de-reverb share: the sound cut into frames of about
// 21 ms (`cleanupFrameSize`) a quarter of a frame apart, each under a
// square-root Hann window, turned into its spectrum, given a gain per band
// by the kernel, turned back and laid over the frames beside it. The two
// channels share one gain per band, worked out from their summed power, so
// the stereo image never moves; they ride one complex transform, the left as
// its real part and the right as its imaginary part. The sound comes out one
// frame late (`latencySamples`).

import { type ParamSpec } from '../../../params'
import { CLEANUP_MAX_CHANNELS, CleanupKernel } from './CleanupKernel'
import { cleanupFrameSize } from './abi'
import { Fft } from './fft'

/** Frames overlap four to one. */
const OVERLAP = 4

export abstract class SpectralKernel<P extends Record<string, ParamSpec>> extends CleanupKernel<P> {
  /** Samples in a frame. */
  readonly frameSize: number
  /** Samples from one frame to the next. */
  readonly hop: number
  /** Bands of a frame's spectrum, from 0 Hz to half the sample rate. */
  readonly bands: number
  private readonly fft: Fft
  private readonly window: Float64Array
  private readonly incoming: Float32Array[]
  private readonly overlap: Float32Array[]
  private readonly re: Float64Array
  private readonly im: Float64Array
  private readonly power: Float64Array
  private readonly gains: Float64Array
  private position = 0
  private sinceFrame = 0

  protected constructor(sampleRate: number, params: P) {
    const size = cleanupFrameSize(sampleRate)
    super(sampleRate, params, size)
    this.frameSize = size
    this.hop = size / OVERLAP
    this.bands = size / 2 + 1
    this.fft = new Fft(size)
    this.window = new Float64Array(size)
    for (let i = 0; i < size; i += 1)
      this.window[i] = Math.sqrt(0.5 * (1 - Math.cos((2 * Math.PI * i) / size)))
    this.incoming = Array.from({ length: CLEANUP_MAX_CHANNELS }, () => new Float32Array(size))
    this.overlap = Array.from({ length: CLEANUP_MAX_CHANNELS }, () => new Float32Array(size))
    this.re = new Float64Array(size)
    this.im = new Float64Array(size)
    this.power = new Float64Array(this.bands)
    this.gains = new Float64Array(this.bands)
  }

  /** The frequency of band `k`, in Hz. */
  bandHz(k: number): number {
    return (k * this.sampleRate) / this.frameSize
  }

  protected render(input: readonly Float32Array[], wet: Float32Array[], frames: number): void {
    const channels = input.length
    const size = this.frameSize
    for (let i = 0; i < frames; i += 1) {
      const at = this.position
      for (let c = 0; c < channels; c += 1) {
        wet[c][i] = this.overlap[c][at]
        this.overlap[c][at] = 0
        this.incoming[c][at] = input[c][i]
      }
      this.position = (at + 1) % size
      this.sinceFrame += 1
      if (this.sinceFrame === this.hop) {
        this.sinceFrame = 0
        this.frame(channels)
      }
    }
  }

  /**
   * Fill `gains` (one per band, 0..1) for a frame whose summed power per band
   * is `power`. Both are `bands` long; `power` is the windowed spectrum's
   * squared magnitude summed over the channels.
   */
  protected abstract shape(power: Float64Array, gains: Float64Array): void

  /** Forget what the frames heard. */
  protected clearSpectra(): void {}

  protected clear(): void {
    for (const buffer of this.incoming) buffer.fill(0)
    for (const buffer of this.overlap) buffer.fill(0)
    this.position = 0
    this.sinceFrame = 0
    this.clearSpectra()
  }

  private frame(channels: number): void {
    const size = this.frameSize
    const { re, im, window } = this
    const oldest = this.position
    for (let j = 0; j < size; j += 1) {
      const at = (oldest + j) % size
      re[j] = this.incoming[0][at] * window[j]
      im[j] = channels > 1 ? this.incoming[1][at] * window[j] : 0
    }
    this.fft.forward(re, im)

    // |X0[k]|² + |X1[k]|² = (|Z[k]|² + |Z[N-k]|²) / 2 for Z = X0 + i·X1.
    for (let k = 0; k < this.bands; k += 1) {
      const m = (size - k) % size
      this.power[k] = 0.5 * (re[k] * re[k] + im[k] * im[k] + re[m] * re[m] + im[m] * im[m])
    }
    this.shape(this.power, this.gains)
    for (let k = 0; k < this.bands; k += 1) {
      const g = this.gains[k]
      re[k] *= g
      im[k] *= g
      const m = size - k
      if (k > 0 && m !== k) {
        re[m] *= g
        im[m] *= g
      }
    }
    this.fft.inverse(re, im)

    // Four square-root Hann windows squared overlap to 2.
    const scale = 2 / OVERLAP
    for (let j = 0; j < size; j += 1) {
      const at = (oldest + j) % size
      const w = window[j] * scale
      this.overlap[0][at] += re[j] * w
      if (channels > 1) this.overlap[1][at] += im[j] * w
    }
  }
}
