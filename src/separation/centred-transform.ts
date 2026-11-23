// The transform a one-stem spectrogram model's segment goes through, and its
// inverse.
//
// The conventions are the ones such a model is trained with. Half a size of
// frames is reflected on each side of the segment, the edge frame not
// repeated, so the first frame of spectrogram is centred on the segment's
// first frame and the last on the frame after its last. The window is a
// periodic Hann, nothing is scaled, and a segment of n frames gives
// n / hop + 1 frames of spectrogram. Of a frame's size / 2 + 1 bins the first
// `bins` are kept, and the inverse reads the ones above as silence. The
// inverse divides each frame of sound by the squared windows that cover it,
// counted over the reflected ends too, so a segment comes back whole from
// its first frame to its last and not only in its middle.
//
// A size is a power of two or three times one, since one such model's size
// is 6144.

import { Fft } from '../core/devices/native/cleanup/fft'
import { SeparationError } from './types'

export interface CentredTransform {
  /** Bins kept of a frame. */
  readonly bins: number
  /** Frames of spectrogram a segment gives. */
  readonly frames: number
  /**
   * The spectrogram of one channel of a segment, written from `offset` of
   * `out`: its real parts as `bins` rows of `frames`, then its imaginary
   * parts the same way. Two channels written one after the other are a
   * tensor of `[1, 4, bins, frames]`.
   */
  forward(channel: Float32Array, out: Float32Array, offset: number): void
  /** The sound of a spectrogram laid out as `forward` writes one, written over the segment's frames of `out`. */
  inverse(spectrogram: Float32Array, offset: number, out: Float32Array): void
}

/** An unscaled complex transform of one size, in place. */
type Turn = (re: Float64Array, im: Float64Array) => void

/** The transform of `size` frames: a power of two, or three times one. */
function createTurn(size: number): Turn {
  if (size % 3 !== 0) {
    const fft = new Fft(size)
    return (re, im) => {
      fft.forward(re, im)
    }
  }
  // Every third frame from the first, from the second and from the third is
  // a transform of a third of the size. Bin k of the whole is bin k of each
  // of the three, counted round a third, with the second turned by k steps
  // of the whole's circle and the third by 2k.
  const third = size / 3
  const fft = new Fft(third)
  const cos = new Float64Array(size)
  const sin = new Float64Array(size)
  for (let k = 0; k < size; k += 1) {
    cos[k] = Math.cos((2 * Math.PI * k) / size)
    sin[k] = -Math.sin((2 * Math.PI * k) / size)
  }
  const re0 = new Float64Array(third)
  const im0 = new Float64Array(third)
  const re1 = new Float64Array(third)
  const im1 = new Float64Array(third)
  const re2 = new Float64Array(third)
  const im2 = new Float64Array(third)
  return (re, im) => {
    for (let j = 0; j < third; j += 1) {
      re0[j] = re[3 * j]
      im0[j] = im[3 * j]
      re1[j] = re[3 * j + 1]
      im1[j] = im[3 * j + 1]
      re2[j] = re[3 * j + 2]
      im2[j] = im[3 * j + 2]
    }
    fft.forward(re0, im0)
    fft.forward(re1, im1)
    fft.forward(re2, im2)
    for (let k = 0; k < size; k += 1) {
      const j = k % third
      const twice = (2 * k) % size
      re[k] = re0[j] + re1[j] * cos[k] - im1[j] * sin[k] + re2[j] * cos[twice] - im2[j] * sin[twice]
      im[k] = im0[j] + re1[j] * sin[k] + im1[j] * cos[k] + re2[j] * sin[twice] + im2[j] * cos[twice]
    }
  }
}

/** Whether `size` is 2^n or 3 × 2^n, with n from 1. */
function isSize(size: number): boolean {
  if (!Number.isInteger(size) || size < 2 || size % 2 !== 0) return false
  let odd = size
  while (odd % 2 === 0) odd /= 2
  return odd === 1 || odd === 3
}

/**
 * The centred transform of segments of `segmentFrames` frames: a frame of
 * `size` every `hop`, with the first `bins` bins of each kept.
 */
export function createCentredTransform(
  segmentFrames: number,
  size: number,
  hop: number,
  bins: number,
): CentredTransform {
  if (!isSize(size)) {
    throw new SeparationError(
      `a centred transform's size (${size}) has to be 2^n or 3 × 2^n, with n from 1`,
    )
  }
  if (!Number.isInteger(hop) || hop < 1 || size % hop !== 0) {
    throw new SeparationError(
      `a centred transform's hop (${hop}) has to be a whole number that divides its size (${size})`,
    )
  }
  const half = size / 2
  if (!Number.isInteger(bins) || bins < 1 || bins > half + 1) {
    throw new SeparationError(
      `a centred transform of ${size} cannot keep ${bins} bins: a frame has ${half + 1}`,
    )
  }
  if (segmentFrames % hop !== 0) {
    throw new SeparationError(
      `a segment of ${segmentFrames} frames is not a whole number of hops of ${hop}`,
    )
  }
  if (segmentFrames <= half) {
    throw new SeparationError(
      `a segment of ${segmentFrames} frames is too short to reflect ${half} frames at each end`,
    )
  }
  const frames = segmentFrames / hop + 1
  const padded = segmentFrames + size
  const hann = new Float64Array(size)
  for (let n = 0; n < size; n += 1) hann[n] = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / size)
  // The squared windows that cover each frame of the segment with its
  // reflected ends. Near an end fewer windows reach a frame than in the middle.
  const cover = new Float64Array(padded)
  for (let frame = 0; frame < frames; frame += 1) {
    const from = frame * hop
    for (let n = 0; n < size; n += 1) cover[from + n] += hann[n] * hann[n]
  }
  for (let i = 0; i < segmentFrames; i += 1) {
    if (cover[i + half] === 0) {
      throw new SeparationError(
        `a hop of ${hop} leaves frame ${i} of a segment covered by no window of ${size}`,
      )
    }
  }

  const turn = createTurn(size)
  const re = new Float64Array(size)
  const im = new Float64Array(size)
  const reflected = new Float64Array(padded)
  const summed = new Float64Array(padded)
  // The bins below this one are each the mirror of a bin above the top one.
  const mirrored = Math.min(bins, half)

  return {
    bins,
    frames,
    forward(channel, out, offset) {
      const last = segmentFrames - 1
      for (let p = 0; p < padded; p += 1) {
        const i = p - half
        reflected[p] = channel[i < 0 ? -i : i > last ? 2 * last - i : i]
      }
      const imaginary = offset + bins * frames
      for (let frame = 0; frame < frames; frame += 1) {
        const from = frame * hop
        for (let n = 0; n < size; n += 1) {
          re[n] = reflected[from + n] * hann[n]
          im[n] = 0
        }
        turn(re, im)
        for (let bin = 0; bin < bins; bin += 1) {
          out[offset + bin * frames + frame] = re[bin]
          out[imaginary + bin * frames + frame] = im[bin]
        }
      }
    },
    inverse(spectrogram, offset, out) {
      summed.fill(0)
      const imaginary = offset + bins * frames
      for (let frame = 0; frame < frames; frame += 1) {
        // The bins above the kept ones are silence.
        re.fill(0)
        im.fill(0)
        // Sound has no imaginary part at bin 0 or at the top bin, so none is read there.
        re[0] = spectrogram[offset + frame]
        if (bins > half) re[half] = spectrogram[offset + half * frames + frame]
        for (let bin = 1; bin < mirrored; bin += 1) {
          const real = spectrogram[offset + bin * frames + frame]
          const imag = spectrogram[imaginary + bin * frames + frame]
          re[bin] = real
          im[bin] = imag
          re[size - bin] = real
          im[size - bin] = -imag
        }
        // The inverse is the forward transform with real and imaginary swapped, both ways.
        turn(im, re)
        const from = frame * hop
        for (let n = 0; n < size; n += 1) summed[from + n] += re[n] * hann[n]
      }
      // The transform back is unscaled as well: its size goes out here, with the windows.
      for (let i = 0; i < segmentFrames; i += 1) {
        const p = i + half
        out[i] = summed[p] / (size * cover[p])
      }
    },
  }
}
