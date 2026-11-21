// The transform a hybrid model's segment goes through, and its inverse.
//
// The conventions are the model's reference implementation's, since the
// model was trained on spectrograms made this way: a periodic Hann window, a
// hop of a quarter of the size, each frame scaled by 1/sqrt(size), the top
// bin dropped, and the segment padded by reflection so that a segment of n
// frames gives ceil(n / hop) frames of spectrogram. The reference keeps no
// frame before the first of those or after the last, so the inverse lets the
// first and last hop and a half of a segment fall: where segments overlap,
// the segment runner gives those frames next to no weight.

import { Fft } from '../core/devices/native/cleanup/fft'
import { SeparationError } from './types'

export interface SegmentTransform {
  /** Bins of a frame: half the transform's size. */
  readonly bins: number
  /** Frames of spectrogram a segment gives. */
  readonly frames: number
  /**
   * The spectrogram of one channel of a segment, written from `offset` of
   * `out`: its real parts as `bins` rows of `frames`, then its imaginary
   * parts the same way.
   */
  forward(channel: Float32Array, out: Float32Array, offset: number): void
  /** The waveform of a spectrogram laid out as `forward` writes one, added to `out`. */
  inverse(spectrogram: Float32Array, offset: number, out: Float32Array): void
}

/** The transform of segments of `segmentFrames` frames, `size` a power of two and `hop` a quarter of it. */
export function createSegmentTransform(
  segmentFrames: number,
  size: number,
  hop: number,
): SegmentTransform {
  if (hop * 4 !== size) {
    throw new SeparationError(
      `a transform's hop (${hop}) has to be a quarter of its size (${size})`,
    )
  }
  const fft = new Fft(size)
  const bins = size / 2
  const frames = Math.ceil(segmentFrames / hop)
  // Ahead of the segment, and after it up to a whole number of hops and as much again.
  const pad = Math.floor(hop / 2) * 3
  const padded = frames * hop + 2 * pad
  if (segmentFrames <= padded - pad - segmentFrames) {
    throw new SeparationError(
      `a segment of ${segmentFrames} frames is too short for a transform of ${size}`,
    )
  }
  const scale = 1 / Math.sqrt(size)
  const hann = new Float64Array(size)
  for (let n = 0; n < size; n += 1) hann[n] = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / size)
  // What four overlapping windows, each applied twice, add up to at each place in a hop.
  const envelope = new Float64Array(hop)
  for (let n = 0; n < size; n += 1) envelope[n % hop] += hann[n] * hann[n]

  const re = new Float64Array(size)
  const im = new Float64Array(size)
  const reflected = new Float64Array(padded)
  const summed = new Float64Array(padded)

  return {
    bins,
    frames,
    forward(channel, out, offset) {
      const last = segmentFrames - 1
      for (let p = 0; p < padded; p += 1) {
        const i = p - pad
        reflected[p] = channel[i < 0 ? -i : i > last ? 2 * last - i : i]
      }
      const imaginary = offset + bins * frames
      for (let frame = 0; frame < frames; frame += 1) {
        const from = frame * hop
        for (let n = 0; n < size; n += 1) {
          re[n] = reflected[from + n] * hann[n]
          im[n] = 0
        }
        fft.forward(re, im)
        for (let bin = 0; bin < bins; bin += 1) {
          out[offset + bin * frames + frame] = re[bin] * scale
          out[imaginary + bin * frames + frame] = im[bin] * scale
        }
      }
    },
    inverse(spectrogram, offset, out) {
      summed.fill(0)
      const imaginary = offset + bins * frames
      for (let frame = 0; frame < frames; frame += 1) {
        re[0] = spectrogram[offset + frame]
        im[0] = 0
        // The top bin was dropped on the way in: it comes back as nothing.
        re[bins] = 0
        im[bins] = 0
        for (let bin = 1; bin < bins; bin += 1) {
          const real = spectrogram[offset + bin * frames + frame]
          const imag = spectrogram[imaginary + bin * frames + frame]
          re[bin] = real
          im[bin] = imag
          re[size - bin] = real
          im[size - bin] = -imag
        }
        fft.inverse(re, im)
        const from = frame * hop
        for (let n = 0; n < size; n += 1) summed[from + n] += re[n] * hann[n]
      }
      // The inverse of the forward scale, over what the windows add up to.
      for (let i = 0; i < segmentFrames; i += 1) {
        const p = i + pad
        out[i] += summed[p] / (scale * envelope[p % hop])
      }
    },
  }
}
