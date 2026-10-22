// An in-place radix-2 complex FFT of one size, its tables made once: what
// the two spectral cleanup kernels turn a frame of sound with. Nothing
// allocates after construction.

export class Fft {
  readonly size: number
  private readonly cos: Float64Array
  private readonly sin: Float64Array
  private readonly reversed: Uint32Array

  constructor(size: number) {
    if (size < 2 || (size & (size - 1)) !== 0)
      throw new Error(`live-mix: FFT size ${size} is not a power of two`)
    this.size = size
    this.cos = new Float64Array(size / 2)
    this.sin = new Float64Array(size / 2)
    for (let i = 0; i < size / 2; i += 1) {
      this.cos[i] = Math.cos((2 * Math.PI * i) / size)
      this.sin[i] = -Math.sin((2 * Math.PI * i) / size)
    }
    this.reversed = new Uint32Array(size)
    const bits = Math.log2(size)
    for (let i = 0; i < size; i += 1) {
      let r = 0
      for (let b = 0; b < bits; b += 1) r |= ((i >> b) & 1) << (bits - 1 - b)
      this.reversed[i] = r
    }
  }

  /** The forward transform of (re, im), in place. */
  forward(re: Float64Array, im: Float64Array): void {
    this.transform(re, im)
  }

  /** The inverse transform of (re, im), in place, scaled by 1/size. */
  inverse(re: Float64Array, im: Float64Array): void {
    // The inverse is the forward transform with real and imaginary swapped, both ways.
    this.transform(im, re)
    const scale = 1 / this.size
    for (let i = 0; i < this.size; i += 1) {
      re[i] *= scale
      im[i] *= scale
    }
  }

  private transform(re: Float64Array, im: Float64Array): void {
    const n = this.size
    for (let i = 0; i < n; i += 1) {
      const j = this.reversed[i]
      if (j > i) {
        let t = re[i]
        re[i] = re[j]
        re[j] = t
        t = im[i]
        im[i] = im[j]
        im[j] = t
      }
    }
    for (let half = 1; half < n; half *= 2) {
      const step = n / (2 * half)
      for (let start = 0; start < n; start += 2 * half) {
        for (let k = 0; k < half; k += 1) {
          const wr = this.cos[k * step]
          const wi = this.sin[k * step]
          const a = start + k
          const b = a + half
          const tr = re[b] * wr - im[b] * wi
          const ti = re[b] * wi + im[b] * wr
          re[b] = re[a] - tr
          im[b] = im[a] - ti
          re[a] += tr
          im[a] += ti
        }
      }
    }
  }
}
