// A track at another sample rate, to a length the caller states. A model
// takes its sound at one rate and a track comes at any, so a track goes to
// the model's rate and its stems come back, and coming back they have to have
// exactly the frames the track has. The browser's own resampling needs an
// audio context and gives the length it likes.
//
// A windowed sinc: each output frame is a sum over the input frames beside
// where it falls, weighted by a low-pass under the lower of the two rates.
// Two whole rates stand in a ratio of small numbers (48,000 to 44,100 is 160
// to 147), so the weights repeat, and each set is worked out once.

import { SeparationError } from './types'

/** Zero crossings of the kernel on each side: more is a sharper low-pass and more work. */
const ZERO_CROSSINGS = 32
/** Where the low-pass is 6 dB down, as a part of the lower rate's top frequency. */
const CUTOFF = 0.92
/** The Kaiser window's shape: 80 dB down past the cutoff. */
const KAISER_BETA = 7.857

/** The zeroth modified Bessel function of the first kind. */
function bessel0(x: number): number {
  let sum = 1
  let term = 1
  for (let k = 1; term > sum * 1e-12; k += 1) {
    term *= (x / (2 * k)) ** 2
    sum += term
  }
  return sum
}

function gcd(a: number, b: number): number {
  while (b !== 0) [a, b] = [b, a % b]
  return a
}

/** The frames a track of `frames` at `fromRate` has at `toRate`, to the nearest one. */
export function resampledLength(frames: number, fromRate: number, toRate: number): number {
  return Math.max(1, Math.round((frames * toRate) / fromRate))
}

/**
 * `channel`, recorded at `fromRate`, as `length` frames at `toRate`. At equal
 * rates the channel itself is returned. Frames before the first and after
 * the last count as silence, so the first and last millisecond are eased.
 */
export function resample(
  channel: Float32Array,
  fromRate: number,
  toRate: number,
  length: number,
): Float32Array {
  for (const rate of [fromRate, toRate]) {
    if (!Number.isInteger(rate) || rate <= 0) {
      throw new SeparationError(`a sample rate has to be a whole number over zero, not ${rate}`)
    }
  }
  if (!Number.isInteger(length) || length <= 0) {
    throw new SeparationError(
      `a resampled length has to be a whole number over zero, not ${length}`,
    )
  }
  if (fromRate === toRate) return channel

  const divisor = gcd(fromRate, toRate)
  // An output frame falls `step / phases` input frames after the one before it.
  const step = fromRate / divisor
  const phases = toRate / divisor
  const cutoff = CUTOFF * Math.min(1, toRate / fromRate)
  const reach = ZERO_CROSSINGS / cutoff
  const half = Math.ceil(reach)
  const taps = 2 * half
  const atCentre = bessel0(KAISER_BETA)
  const kernels = new Array<Float64Array | undefined>(phases)

  /** The weights of the `taps` input frames around a place `phase / phases` of a frame past one. */
  const kernelAt = (phase: number): Float64Array => {
    const kernel = new Float64Array(taps)
    let sum = 0
    for (let k = 0; k < taps; k += 1) {
      const distance = k - half + 1 - phase / phases
      const across = distance / reach
      if (Math.abs(across) >= 1) continue
      const x = Math.PI * cutoff * distance
      const sinc = x === 0 ? 1 : Math.sin(x) / x
      kernel[k] = sinc * (bessel0(KAISER_BETA * Math.sqrt(1 - across * across)) / atCentre)
      sum += kernel[k]
    }
    // A level that stands still stays where it is.
    for (let k = 0; k < taps; k += 1) kernel[k] /= sum
    return kernel
  }

  const out = new Float32Array(length)
  const frames = channel.length
  for (let j = 0; j < length; j += 1) {
    const place = j * step
    const phase = place % phases
    const kernel = (kernels[phase] ??= kernelAt(phase))
    const first = (place - phase) / phases - half + 1
    const from = Math.max(0, -first)
    const to = Math.min(taps, frames - first)
    let sum = 0
    for (let k = from; k < to; k += 1) sum += kernel[k] * channel[first + k]
    out[j] = sum
  }
  return out
}
