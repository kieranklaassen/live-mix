import { describe, expect, it } from 'vitest'

import { Fft } from '../fft'

/** The transform a stage at a time, which `Fft` is to equal bit for bit. */
function stageByStage(re: Float64Array, im: Float64Array): void {
  const n = re.length
  const bits = Math.log2(n)
  for (let i = 0; i < n; i += 1) {
    let j = 0
    for (let b = 0; b < bits; b += 1) j |= ((i >> b) & 1) << (bits - 1 - b)
    if (j > i) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let half = 1; half < n; half *= 2) {
    for (let start = 0; start < n; start += 2 * half) {
      for (let k = 0; k < half; k += 1) {
        const turn = (2 * Math.PI * ((k * n) / (2 * half))) / n
        const wr = Math.cos(turn)
        const wi = -Math.sin(turn)
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

function noise(size: number, seed: number): Float64Array {
  let state = seed
  return Float64Array.from({ length: size }, () => {
    state = (Math.imul(state, 1664525) + 1013904223) | 0
    return state / 2 ** 31
  })
}

describe('Fft', () => {
  it.each([2, 4, 8, 16, 32, 64, 512, 1024, 2048, 4096])(
    'is the transform a stage at a time, to the last bit, for %i points',
    (size) => {
      const re = noise(size, 3)
      const im = noise(size, 5)
      const plainRe = re.slice()
      const plainIm = im.slice()
      new Fft(size).forward(re, im)
      stageByStage(plainRe, plainIm)
      expect(re).toEqual(plainRe)
      expect(im).toEqual(plainIm)
    },
  )

  it('comes back from its inverse', () => {
    const re = noise(256, 3)
    const im = noise(256, 5)
    const fft = new Fft(256)
    const there = [re.slice(), im.slice()]
    fft.forward(there[0], there[1])
    fft.inverse(there[0], there[1])
    for (let i = 0; i < 256; i += 1) {
      expect(there[0][i]).toBeCloseTo(re[i], 12)
      expect(there[1][i]).toBeCloseTo(im[i], 12)
    }
  })

  it('refuses a size that is not a power of two', () => {
    expect(() => new Fft(12)).toThrow('not a power of two')
  })
})
