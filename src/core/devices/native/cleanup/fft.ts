// An in-place radix-2 complex FFT of one size, its tables made once: what
// the two spectral cleanup kernels turn a frame of sound with. Nothing
// allocates after construction.
//
// The stages are taken two at a time, so a frame is walked half as often. Every
// multiplication and addition is the one a stage by itself makes, so the
// result is the same to the last bit.

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
    const { cos, sin, reversed } = this
    for (let i = 0; i < n; i += 1) {
      const j = reversed[i]
      if (j > i) {
        let t = re[i]
        re[i] = re[j]
        re[j] = t
        t = im[i]
        im[i] = im[j]
        im[j] = t
      }
    }
    let half = 1
    // An odd number of stages: the first goes by itself.
    if ((Math.clz32(n) & 1) === 0) {
      const wr = cos[0]
      const wi = sin[0]
      for (let a = 0; a < n; a += 2) {
        const b = a + 1
        const tr = re[b] * wr - im[b] * wi
        const ti = re[b] * wi + im[b] * wr
        re[b] = re[a] - tr
        im[b] = im[a] - ti
        re[a] += tr
        im[a] += ti
      }
      half = 2
    }
    for (; half < n; half *= 4) {
      const stepB = n / (4 * half)
      const stepA = 2 * stepB
      const quarter = half * stepB
      for (let start = 0; start < n; start += 4 * half) {
        for (let k = 0; k < half; k += 1) {
          const ar = cos[k * stepA]
          const ai = sin[k * stepA]
          const br = cos[k * stepB]
          const bi = sin[k * stepB]
          const cr = cos[k * stepB + quarter]
          const ci = sin[k * stepB + quarter]
          const i0 = start + k
          const i1 = i0 + half
          const i2 = i1 + half
          const i3 = i2 + half

          // The stage of `half`: 0 with 1, and 2 with 3.
          const r1 = re[i1]
          const m1 = im[i1]
          let tr = r1 * ar - m1 * ai
          let ti = r1 * ai + m1 * ar
          const p0 = re[i0] + tr
          const q0 = im[i0] + ti
          const p1 = re[i0] - tr
          const q1 = im[i0] - ti
          const r3 = re[i3]
          const m3 = im[i3]
          tr = r3 * ar - m3 * ai
          ti = r3 * ai + m3 * ar
          const p2 = re[i2] + tr
          const q2 = im[i2] + ti
          const p3 = re[i2] - tr
          const q3 = im[i2] - ti

          // The stage of twice that: 0 with 2, and 1 with 3.
          tr = p2 * br - q2 * bi
          ti = p2 * bi + q2 * br
          re[i0] = p0 + tr
          im[i0] = q0 + ti
          re[i2] = p0 - tr
          im[i2] = q0 - ti
          tr = p3 * cr - q3 * ci
          ti = p3 * ci + q3 * cr
          re[i1] = p1 + tr
          im[i1] = q1 + ti
          re[i3] = p1 - tr
          im[i3] = q1 - ti
        }
      }
    }
  }
}
