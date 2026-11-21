// The transform a hybrid model's segment goes through. Its conventions are
// the model's reference implementation's, so they are held here against a
// plain sum over every frequency written out from that reference, not
// against the code under test.

import { describe, expect, it } from 'vitest'

import { createSegmentTransform } from '../stft'
import { differenceDb, noise, sine } from './support'

/** The reference's forward transform, as slow sums: reflect padding, a periodic Hann window, scaled by 1/sqrt(size). */
function slowForward(
  x: Float32Array,
  size: number,
  hop: number,
): { re: number[][]; im: number[][] } {
  const frames = Math.ceil(x.length / hop)
  const pad = Math.floor(hop / 2) * 3
  const at = (i: number): number => x[i < 0 ? -i : i >= x.length ? 2 * (x.length - 1) - i : i]
  const re: number[][] = []
  const im: number[][] = []
  for (let bin = 0; bin < size / 2; bin += 1) {
    re.push([])
    im.push([])
    for (let frame = 0; frame < frames; frame += 1) {
      let sumRe = 0
      let sumIm = 0
      for (let n = 0; n < size; n += 1) {
        const windowed =
          at(frame * hop + n - pad) * (0.5 - 0.5 * Math.cos((2 * Math.PI * n) / size))
        sumRe += windowed * Math.cos((2 * Math.PI * bin * n) / size)
        sumIm -= windowed * Math.sin((2 * Math.PI * bin * n) / size)
      }
      re[bin].push(sumRe / Math.sqrt(size))
      im[bin].push(sumIm / Math.sqrt(size))
    }
  }
  return { re, im }
}

describe('the transform of a segment', () => {
  it('gives 336 frames of 2048 bins for the segment a hybrid model takes', () => {
    const transform = createSegmentTransform(343980, 4096, 1024)
    expect(transform.frames).toBe(336)
    expect(transform.bins).toBe(2048)
  })

  it('is the reference transform, frame for frame and bin for bin', () => {
    const size = 16
    const hop = 4
    const x = noise(50)
    const transform = createSegmentTransform(x.length, size, hop)
    const out = new Float32Array(2 * transform.bins * transform.frames)
    transform.forward(x, out, 0)
    const slow = slowForward(x, size, hop)
    expect(transform.frames).toBe(13)
    for (let bin = 0; bin < transform.bins; bin += 1) {
      for (let frame = 0; frame < transform.frames; frame += 1) {
        expect(out[bin * transform.frames + frame]).toBeCloseTo(slow.re[bin][frame], 5)
        expect(out[(transform.bins + bin) * transform.frames + frame]).toBeCloseTo(
          slow.im[bin][frame],
          5,
        )
      }
    }
  })

  it('writes at the offset it is given and nowhere else', () => {
    const transform = createSegmentTransform(64, 16, 4)
    const size = 2 * transform.bins * transform.frames
    const out = new Float32Array(3 * size).fill(7)
    transform.forward(noise(64), out, size)
    expect(out.subarray(0, size).every((value) => value === 7)).toBe(true)
    expect(out.subarray(2 * size).every((value) => value === 7)).toBe(true)
    expect(out.subarray(size, 2 * size).some((value) => value !== 7)).toBe(true)
  })

  it('puts a sine at the centre of a bin in that bin', () => {
    const size = 256
    const hop = 64
    const rate = 25600
    const bin = 20
    const transform = createSegmentTransform(4096, size, hop)
    const out = new Float32Array(2 * transform.bins * transform.frames)
    transform.forward(sine(4096, (bin * rate) / size, rate), out, 0)
    const frame = 30
    const power = (b: number): number =>
      out[b * transform.frames + frame] ** 2 +
      out[(transform.bins + b) * transform.frames + frame] ** 2
    let total = 0
    for (let b = 0; b < transform.bins; b += 1) total += power(b)
    // A Hann window spreads a centred sine over the bin and its two neighbours.
    expect((power(bin - 1) + power(bin) + power(bin + 1)) / total).toBeGreaterThan(0.999)
    expect(power(bin)).toBeGreaterThan(power(bin - 1))
    expect(power(bin)).toBeGreaterThan(power(bin + 1))
  })

  it('comes back from the inverse within -100 dB, away from the ends the reference lets fall', () => {
    const length = 343980
    const hop = 1024
    const transform = createSegmentTransform(length, 4096, hop)
    // Nothing at the very top: the top bin is dropped, and with it 41 dB under white noise.
    const x = sine(length, 220, 44100, 0.3).map(
      (value, i) =>
        value +
        0.2 * Math.sin((2 * Math.PI * 3001 * i) / 44100) +
        0.1 * Math.sin((2 * Math.PI * 9007 * i) / 44100),
    )
    const spectrogram = new Float32Array(2 * transform.bins * transform.frames)
    transform.forward(x, spectrogram, 0)
    const back = new Float32Array(length)
    transform.inverse(spectrogram, 0, back)
    // Away from the ends: a frame that holds the place the padding turns
    // round at has sound at the very top, which the dropped bin took.
    expect(differenceDb(x, back, 4096, length - 2 * 4096)).toBeLessThan(-100)
  })

  it('lets the ends of a segment fall as the reference does', () => {
    // The reference keeps no frame before the first or after the last, so
    // the first hop and a half is covered by fewer than four: two of them at
    // the first frame, which is half the sound, and five sixths half a hop in.
    const length = 16384
    const transform = createSegmentTransform(length, 4096, 1024)
    const x = new Float32Array(length).fill(0.5)
    const spectrogram = new Float32Array(2 * transform.bins * transform.frames)
    transform.forward(x, spectrogram, 0)
    const back = new Float32Array(length)
    transform.inverse(spectrogram, 0, back)
    expect(back[0]).toBeCloseTo(0.25, 5)
    expect(back[512]).toBeCloseTo((0.5 * 5) / 6, 5)
    expect(back[1536]).toBeCloseTo(0.5, 5)
    expect(back[8000]).toBeCloseTo(0.5, 5)
  })

  it('adds to what the output already holds', () => {
    const transform = createSegmentTransform(4096, 256, 64)
    const x = noise(4096)
    const spectrogram = new Float32Array(2 * transform.bins * transform.frames)
    transform.forward(x, spectrogram, 0)
    const once = new Float32Array(4096)
    transform.inverse(spectrogram, 0, once)
    const onto = new Float32Array(4096).fill(0.25)
    transform.inverse(spectrogram, 0, onto)
    expect(
      differenceDb(
        onto,
        once.map((value) => value + 0.25),
      ),
    ).toBeLessThan(-120)
  })

  it('refuses a hop that is not a quarter of the size, and a segment too short to pad', () => {
    expect(() => createSegmentTransform(4096, 256, 128)).toThrow(/quarter/)
    expect(() => createSegmentTransform(8, 256, 64)).toThrow(/short/)
  })
})
