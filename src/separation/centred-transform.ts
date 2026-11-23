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
// A size is a power of two times 1, 3, 5 or 15: such models' sizes are 4096,
// 5120, 6144, 7680, 8192 and 16384. A hop does not have to divide its size,
// since the windows that cover a frame are counted frame by frame.

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

/** The odd numbers a size may be a power of two times. */
const ODD_FACTORS: readonly number[] = [1, 3, 5, 15]

/** What is left of a whole number from 1 with every factor of two taken out. */
function oddFactor(size: number): number {
  let odd = size
  while (odd % 2 === 0) odd /= 2
  return odd
}

/** The transform of `size` frames: a power of two times 1, 3, 5 or 15. */
function createTurn(size: number): Turn {
  const parts = size % 3 === 0 ? 3 : size % 5 === 0 ? 5 : 1
  if (parts === 1) {
    const fft = new Fft(size)
    return (re, im) => {
      fft.forward(re, im)
    }
  }
  // A size with a factor of 3 or of 5 is that many transforms of the size
  // without it: one of every third or fifth frame from the first, one from
  // the second, and so on. Bin k of the whole is bin k of each part, counted
  // round the part's size, with the part from frame r turned by r × k steps
  // of the whole's circle. A size with both factors takes its thirds first,
  // and each third its fifths.
  const part = size / parts
  const turnPart = createTurn(part)
  const cos = new Float64Array(size)
  const sin = new Float64Array(size)
  for (let k = 0; k < size; k += 1) {
    cos[k] = Math.cos((2 * Math.PI * k) / size)
    sin[k] = -Math.sin((2 * Math.PI * k) / size)
  }
  const partRe = Array.from({ length: parts }, () => new Float64Array(part))
  const partIm = Array.from({ length: parts }, () => new Float64Array(part))
  return (re, im) => {
    for (let r = 0; r < parts; r += 1) {
      const real = partRe[r]
      const imag = partIm[r]
      for (let j = 0; j < part; j += 1) {
        real[j] = re[parts * j + r]
        imag[j] = im[parts * j + r]
      }
      turnPart(real, imag)
    }
    for (let k = 0; k < size; k += 1) {
      const j = k % part
      let sumRe = partRe[0][j]
      let sumIm = partIm[0][j]
      let step = 0
      for (let r = 1; r < parts; r += 1) {
        step += k
        if (step >= size) step -= size
        const real = partRe[r][j]
        const imag = partIm[r][j]
        sumRe = sumRe + real * cos[step] - imag * sin[step]
        sumIm = sumIm + real * sin[step] + imag * cos[step]
      }
      re[k] = sumRe
      im[k] = sumIm
    }
  }
}

/** Whether `size` is 2^n times 1, 3, 5 or 15, with n from 1. */
function isSize(size: number): boolean {
  if (!Number.isInteger(size) || size < 2 || size % 2 !== 0) return false
  return ODD_FACTORS.includes(oddFactor(size))
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
      `a centred transform's size (${size}) has to be 2^n times 1, 3, 5 or 15, with n from 1`,
    )
  }
  if (!Number.isInteger(hop) || hop < 1) {
    throw new SeparationError(`a centred transform's hop (${hop}) has to be a whole number from 1`)
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
