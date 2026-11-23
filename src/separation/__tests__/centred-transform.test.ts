// The transform a one-stem spectrogram model's segment goes through. Its
// forward half is held here against a plain sum over every bin written out
// from the definition, not against the code under test, so a size with an
// odd factor cannot be wrong in a way its own inverse would hide.

import { describe, expect, it } from 'vitest'

import { createCentredTransform } from '../centred-transform'
import { SeparationError } from '../types'
import { differenceDb, noise } from './support'

/** A periodic Hann window, from its definition. */
function hann(n: number, size: number): number {
  return 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / size)
}

/**
 * The definition as slow sums: `size / 2` frames reflected on each side with
 * the edge frame not repeated, a periodic Hann window, no scale, a frame
 * every `hop`, and every bin up to the top one.
 */
function slowForward(
  x: Float32Array,
  size: number,
  hop: number,
): { re: Float64Array[]; im: Float64Array[] } {
  const frames = x.length / hop + 1
  const half = size / 2
  const last = x.length - 1
  const at = (i: number): number => x[i < 0 ? -i : i > last ? 2 * last - i : i]
  // Bin `bin` at frame `n` is `bin × n` steps round a circle of `size`
  // steps, which is where that many steps past its whole turns are.
  const cos = Float64Array.from({ length: size }, (_, step) =>
    Math.cos((2 * Math.PI * step) / size),
  )
  const sin = Float64Array.from({ length: size }, (_, step) =>
    Math.sin((2 * Math.PI * step) / size),
  )
  const re = Array.from({ length: half + 1 }, () => new Float64Array(frames))
  const im = Array.from({ length: half + 1 }, () => new Float64Array(frames))
  const windowed = new Float64Array(size)
  for (let frame = 0; frame < frames; frame += 1) {
    for (let n = 0; n < size; n += 1) windowed[n] = at(frame * hop + n - half) * hann(n, size)
    for (let bin = 0; bin <= half; bin += 1) {
      let sumRe = 0
      let sumIm = 0
      for (let n = 0; n < size; n += 1) {
        const step = (bin * n) % size
        sumRe += windowed[n] * cos[step]
        sumIm -= windowed[n] * sin[step]
      }
      re[bin][frame] = sumRe
      im[bin][frame] = sumIm
    }
  }
  return { re, im }
}

/**
 * How far the planes written at `offset` are from the slow sums, at the
 * worst bin of the first `bins`, as a part of the largest value the slow
 * sums hold.
 */
function worstAgainst(
  out: Float32Array,
  offset: number,
  slow: { re: Float64Array[]; im: Float64Array[] },
  bins: number,
  frames: number,
): number {
  let worst = 0
  let largest = 0
  for (let bin = 0; bin < bins; bin += 1) {
    for (let frame = 0; frame < frames; frame += 1) {
      const real = out[offset + bin * frames + frame]
      const imaginary = out[offset + (bins + bin) * frames + frame]
      worst = Math.max(
        worst,
        Math.abs(real - slow.re[bin][frame]),
        Math.abs(imaginary - slow.im[bin][frame]),
      )
      largest = Math.max(largest, Math.abs(slow.re[bin][frame]), Math.abs(slow.im[bin][frame]))
    }
  }
  return worst / largest
}

/** A cosine of `level` at its peaks that makes `halfTurns` half turns from the first frame to the last. */
function cosine(length: number, halfTurns: number, level: number): Float32Array {
  const out = new Float32Array(length)
  for (let i = 0; i < length; i += 1) {
    out[i] = level * Math.cos((Math.PI * halfTurns * i) / (length - 1))
  }
  return out
}

function roundTrip(x: Float32Array, size: number, hop: number, bins: number): Float32Array {
  const transform = createCentredTransform(x.length, size, hop, bins)
  const spectrogram = new Float32Array(2 * transform.bins * transform.frames)
  transform.forward(x, spectrogram, 0)
  const back = new Float32Array(x.length).fill(7)
  transform.inverse(spectrogram, 0, back)
  return back
}

describe('the centred transform of a segment', () => {
  it('gives 512 frames of the 2048 kept bins for a segment of 523,264 frames at a size of 6144', () => {
    const transform = createCentredTransform(523264, 6144, 1024, 2048)
    expect(transform.frames).toBe(512)
    expect(transform.bins).toBe(2048)
  })

  it.each([
    // A power of two.
    { size: 8, hop: 2, segment: 22 },
    { size: 8, hop: 1, segment: 13 },
    // Three times one.
    { size: 12, hop: 3, segment: 21 },
    { size: 12, hop: 2, segment: 22 },
    { size: 6144, hop: 1536, segment: 4608 },
    { size: 6144, hop: 1024, segment: 4096 },
    // Five times one.
    { size: 10, hop: 2, segment: 22 },
    { size: 10, hop: 1, segment: 13 },
    { size: 20, hop: 5, segment: 25 },
    { size: 20, hop: 4, segment: 24 },
    { size: 5120, hop: 1280, segment: 3840 },
    { size: 5120, hop: 1024, segment: 3072 },
    // Fifteen times one.
    { size: 30, hop: 5, segment: 35 },
    { size: 30, hop: 3, segment: 33 },
    { size: 60, hop: 15, segment: 75 },
    { size: 60, hop: 10, segment: 70 },
    { size: 7680, hop: 1920, segment: 5760 },
    // A hop that does not divide its size.
    { size: 8, hop: 3, segment: 15 },
    { size: 30, hop: 4, segment: 32 },
    { size: 7680, hop: 1024, segment: 4096 },
  ])(
    'is the plain sum over every bin and frame, at a size of $size with a hop of $hop',
    ({ size, hop, segment }) => {
      const x = noise(segment)
      const bins = size / 2 + 1
      const transform = createCentredTransform(segment, size, hop, bins)
      expect(transform.frames).toBe(segment / hop + 1)
      const out = new Float32Array(2 * bins * transform.frames)
      transform.forward(x, out, 0)
      // Single precision holds a value to about 6e-8 of itself. Measured:
      // 5e-8 at worst, at a size of 8 with a hop of 1, and under 4e-8 at
      // 5120, 6144 and 7680.
      expect(worstAgainst(out, 0, slowForward(x, size, hop), bins, transform.frames)).toBeLessThan(
        2e-7,
      )
    },
  )

  it('keeps the first bins of a frame and writes no other', () => {
    const size = 12
    const hop = 2
    const bins = 4
    const x = noise(22, 99)
    const transform = createCentredTransform(x.length, size, hop, bins)
    expect(transform.bins).toBe(4)
    const planes = 2 * bins * transform.frames
    const out = new Float32Array(3 * planes).fill(7)
    transform.forward(x, out, planes)
    expect(out.subarray(0, planes).every((value) => value === 7)).toBe(true)
    expect(out.subarray(2 * planes).every((value) => value === 7)).toBe(true)
    expect(
      worstAgainst(out, planes, slowForward(x, size, hop), bins, transform.frames),
    ).toBeLessThan(2e-7)
  })

  it('puts a level of 1 in bin 0 as the sum of the window, with no imaginary part', () => {
    for (const [size, hop] of [
      [16, 4],
      [24, 4],
      [20, 5],
      [60, 10],
      [6144, 1024],
    ]) {
      const segment = 8 * size
      const bins = size / 2 + 1
      const transform = createCentredTransform(segment, size, hop, bins)
      const out = new Float32Array(2 * bins * transform.frames)
      transform.forward(new Float32Array(segment).fill(1), out, 0)
      let sum = 0
      for (let n = 0; n < size; n += 1) sum += hann(n, size)
      for (let frame = 0; frame < transform.frames; frame += 1) {
        expect(out[frame] / sum).toBeCloseTo(1, 6)
        expect(out[bins * transform.frames + frame] / sum).toBeCloseTo(0, 6)
      }
    }
  })

  it.each([
    { size: 8, hop: 2, segment: 64 },
    { size: 12, hop: 2, segment: 60 },
    { size: 12, hop: 3, segment: 60 },
    { size: 16, hop: 8, segment: 64 },
    { size: 10, hop: 2, segment: 60 },
    { size: 60, hop: 10, segment: 120 },
    { size: 8, hop: 3, segment: 66 },
    { size: 4096, hop: 1024, segment: 65536 },
    { size: 6144, hop: 1024, segment: 523264 },
    { size: 5120, hop: 1024, segment: 261120 },
    { size: 7680, hop: 1024, segment: 261120 },
  ])(
    'comes back from the inverse from frame 0 to the last with every bin kept, at $size and a hop of $hop',
    ({ size, hop, segment }) => {
      const x = noise(segment)
      const back = roundTrip(x, size, hop, size / 2 + 1)
      // Measured: -150 dB at worst, at 5120. With the windows' steady sum
      // in the place of the windows that cover each frame: -61 dB to -17 dB,
      // but at a hop of half the size, where no frame of a segment is short
      // of one.
      expect(differenceDb(x, back)).toBeLessThan(-120)
    },
  )

  it('brings the ends back whole, where fewer windows cover a frame than in the middle', () => {
    const size = 6144
    const hop = 1024
    const x = noise(16 * hop, 7)
    const back = roundTrip(x, size, hop, size / 2 + 1)
    // The first and the last `size / 2 - hop` frames are short of a window
    // or more. Measured: -156 dB over them, and -18 dB with the steady sum.
    const short = size / 2 - hop
    expect(differenceDb(x, back, 0, short)).toBeLessThan(-120)
    expect(differenceDb(x, back, x.length - short)).toBeLessThan(-120)
    expect(back[0]).toBeCloseTo(x[0], 6)
    expect(back[x.length - 1]).toBeCloseTo(x[x.length - 1], 6)
  })

  it('lays two channels one after the other as four planes, and reads each back from its own', () => {
    const size = 24
    const hop = 4
    const bins = 13
    const left = noise(96, 1)
    const right = noise(96, 2)
    const transform = createCentredTransform(96, size, hop, bins)
    const planes = 2 * bins * transform.frames
    const tensor = new Float32Array(2 * planes)
    transform.forward(left, tensor, 0)
    transform.forward(right, tensor, planes)
    expect(
      worstAgainst(tensor, 0, slowForward(left, size, hop), bins, transform.frames),
    ).toBeLessThan(2e-7)
    expect(
      worstAgainst(tensor, planes, slowForward(right, size, hop), bins, transform.frames),
    ).toBeLessThan(2e-7)
    const back = new Float32Array(96)
    transform.inverse(tensor, planes, back)
    expect(differenceDb(right, back)).toBeLessThan(-120)
    transform.inverse(tensor, 0, back)
    expect(differenceDb(left, back)).toBeLessThan(-120)
  })

  describe('with half the bins kept', () => {
    // A size of 768 keeps the first 192 of its 385 bins. Each tone is a
    // cosine that makes a whole number of half turns from the first frame
    // to the last, so the reflected ends carry it on as it was. A tone that
    // meets its reflection at a corner has sound on both sides of the cut
    // there, whatever its pitch: a sine below the cut that starts at 0
    // differs from what comes back by -23 dB at its ends and by -150 dB in
    // its middle.
    const size = 768
    const hop = 128
    const bins = 192
    const segment = 64 * hop
    /** Half turns over the segment of a tone at the centre of `bin`, to the nearest whole. */
    const halfTurns = (bin: number): number => Math.round((bin * 2 * (segment - 1)) / size)

    it('lets a tone above the cut fall', () => {
      const x = cosine(segment, halfTurns(300), 0.5)
      const back = roundTrip(x, size, hop, bins)
      // Measured: -155 dB, under a tone of -6 dB.
      expect(differenceDb(back, new Float32Array(segment))).toBeLessThan(-120)
    })

    it('brings a tone below the cut back whole', () => {
      const x = cosine(segment, halfTurns(50), 0.5)
      const back = roundTrip(x, size, hop, bins)
      // Measured: -150 dB.
      expect(differenceDb(x, back)).toBeLessThan(-120)
    })
  })

  describe('refuses, when it is made', () => {
    const refused = (
      segment: number,
      size: number,
      hop: number,
      bins: number,
      words: RegExp,
    ): void => {
      expect(() => createCentredTransform(segment, size, hop, bins)).toThrow(SeparationError)
      expect(() => createCentredTransform(segment, size, hop, bins)).toThrow(words)
    }

    it('a size that is not a power of two times 1, 3, 5 or 15', () => {
      refused(56, 14, 7, 8, /size \(14\)/)
      refused(448, 112, 16, 57, /size \(112\)/)
      refused(72, 18, 6, 10, /size \(18\)/)
      refused(100, 50, 10, 26, /size \(50\)/)
      // An odd size has no half to reflect.
      refused(9, 3, 1, 2, /size \(3\)/)
      refused(30, 15, 5, 8, /size \(15\)/)
      expect(() => createCentredTransform(64, 16, 4, 9)).not.toThrow()
      expect(() => createCentredTransform(96, 24, 4, 13)).not.toThrow()
      expect(() => createCentredTransform(40, 10, 5, 6)).not.toThrow()
      expect(() => createCentredTransform(120, 30, 5, 16)).not.toThrow()
    })

    it('a hop that is not a whole number from 1', () => {
      refused(30, 8, 0, 5, /hop \(0\)/)
      refused(30, 8, 1.5, 5, /hop \(1\.5\)/)
    })

    it('more bins than a frame has', () => {
      refused(64, 16, 4, 10, /10 bins.*9/)
      expect(() => createCentredTransform(64, 16, 4, 9)).not.toThrow()
    })

    it('a segment that is not a whole number of hops', () => {
      refused(66, 16, 4, 9, /66 frames.*hop/)
    })

    it('a segment too short to reflect half a size at each end', () => {
      refused(8, 16, 4, 9, /8 frames.*short/)
      expect(() => createCentredTransform(12, 16, 4, 9)).not.toThrow()
    })

    it('a hop under which a frame of the segment is covered by no window', () => {
      refused(64, 16, 16, 9, /hop of 16.*no window/)
      refused(48, 16, 24, 9, /hop of 24.*no window/)
      expect(() => createCentredTransform(64, 16, 8, 9)).not.toThrow()
    })
  })
})
