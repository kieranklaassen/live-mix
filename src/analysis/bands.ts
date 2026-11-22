// The level in seven bands, from a windowed FFT with half overlap.
//
// The window is a half sine, whose square and the square of its neighbour
// half a frame on add up to one. Every sample is in two frames, the first
// frame starting half a frame ahead of the sound and the last ending after
// it, so every sample counts the same and the powers of all the bins add up
// to the power of the sound. The seven bands are then its power from 20 Hz
// to 20 kHz, split.
//
// Two channels are transformed as mid and side, (left + right) / 2 and
// (left - right) / 2. Their powers add up to the mean power of left and
// right, so the level of the two together needs no transform of its own,
// and the two go through one transform as its real and imaginary parts.

import { Fft } from '../core/devices/native/cleanup/fft'
import type { BandLevels } from './types'

/** The bands' edges in Hz: band `n` runs from edge `n` up to edge `n + 1`. */
const BAND_EDGES_HZ = [20, 60, 250, 500, 2000, 4000, 10000, 20000] as const
const BANDS = BAND_EDGES_HZ.length - 1

/**
 * A frame holds at least this long, so its bins are at most 4 Hz apart and
 * the lowest band, 40 Hz wide, holds ten of them or more.
 */
const FRAME_SECONDS = 0.25

/** A power as a level in dB, null for none. */
export function powerDb(power: number): number | null {
  return power > 0 ? 10 * Math.log10(power) : null
}

export class BandAnalyzer {
  private readonly size: number
  private readonly half: number
  private readonly fft: Fft
  private readonly window: Float64Array
  /** The frame being filled. Its first half is the second half of the frame before. */
  private readonly mid: Float64Array
  /** The same for the side, when there are two channels. */
  private readonly side: Float64Array | null
  private readonly re: Float64Array
  private readonly im: Float64Array
  /** The first bin of each band, and after the last band the first bin over it. */
  private readonly firstBin: number[]
  private readonly midPower = new Float64Array(BANDS)
  private readonly sidePower = new Float64Array(BANDS)
  private fill: number

  constructor(sampleRate: number, channels: number) {
    this.size = 2 ** Math.ceil(Math.log2(FRAME_SECONDS * sampleRate))
    this.half = this.size / 2
    this.fft = new Fft(this.size)
    this.window = new Float64Array(this.size)
    for (let i = 0; i < this.size; i += 1) {
      this.window[i] = Math.sin((Math.PI * (i + 0.5)) / this.size)
    }
    this.mid = new Float64Array(this.size)
    this.side = channels === 2 ? new Float64Array(this.size) : null
    this.re = new Float64Array(this.size)
    this.im = new Float64Array(this.size)
    // A bin belongs to the band its centre lies in. The bin at half the rate is left out.
    this.firstBin = BAND_EDGES_HZ.map((hz) =>
      Math.min(this.half, Math.ceil((hz * this.size) / sampleRate)),
    )
    this.fill = this.half
  }

  /** Takes the frames `from` up to `to` of a chunk. `right` is null for one channel. */
  push(left: Float32Array, right: Float32Array | null, from: number, to: number): void {
    const { mid, side, size } = this
    let fill = this.fill
    for (let i = from; i < to; i += 1) {
      if (side !== null && right !== null) {
        mid[fill] = (left[i] + right[i]) / 2
        side[fill] = (left[i] - right[i]) / 2
      } else {
        mid[fill] = left[i]
      }
      fill += 1
      if (fill === size) {
        this.transformFrame()
        fill = this.half
      }
    }
    this.fill = fill
  }

  /** The seven bands of everything pushed, `frames` frames in all. Call it once. */
  finish(frames: number): BandLevels[] {
    // The frame under way is filled out with silence. Then one more frame
    // takes the last half frame its second time.
    if (this.fill > this.half) {
      this.mid.fill(0, this.fill)
      this.side?.fill(0, this.fill)
      this.transformFrame()
    }
    this.mid.fill(0, this.half)
    this.side?.fill(0, this.half)
    this.transformFrame()

    // A bin and its mirror hold the same power, and the transform is not scaled.
    const scale = 2 / (this.size * frames)
    const stereo = this.side !== null
    const levels: BandLevels[] = []
    for (let band = 0; band < BANDS; band += 1) {
      const mid = this.midPower[band] * scale
      const side = this.sidePower[band] * scale
      levels.push({
        fromHz: BAND_EDGES_HZ[band],
        toHz: BAND_EDGES_HZ[band + 1],
        levelDbfs: powerDb(mid + side),
        midDbfs: stereo ? powerDb(mid) : null,
        sideDbfs: stereo ? powerDb(side) : null,
      })
    }
    return levels
  }

  /** Adds the full frame's power to the bands, and keeps its second half as the next one's first. */
  private transformFrame(): void {
    const { re, im, window, mid, side, size, firstBin, midPower, sidePower } = this
    // Mid and side are both real, so one transform carries the two: the mid
    // as the real part going in and the side as the imaginary.
    let midSounds = false
    let sideSounds = false
    for (let i = 0; i < size; i += 1) {
      re[i] = mid[i] * window[i]
      if (mid[i] !== 0) midSounds = true
    }
    if (side === null) {
      im.fill(0)
    } else {
      for (let i = 0; i < size; i += 1) {
        im[i] = side[i] * window[i]
        if (side[i] !== 0) sideSounds = true
      }
    }
    this.fft.forward(re, im)

    for (let band = 0; band < BANDS; band += 1) {
      let midSum = 0
      let sideSum = 0
      for (let bin = firstBin[band]; bin < firstBin[band + 1]; bin += 1) {
        // The mid's transform is half of this bin plus its mirror's conjugate,
        // and the side's is half of this bin minus it, over i.
        const a = re[bin]
        const b = im[bin]
        const c = re[size - bin]
        const d = im[size - bin]
        midSum += (a + c) * (a + c) + (b - d) * (b - d)
        sideSum += (a - c) * (a - c) + (b + d) * (b + d)
      }
      // A frame with no mid, or no side, adds exactly nothing to it. Taken
      // apart from the other its share would come out as rounding, not zero.
      if (midSounds) midPower[band] += midSum / 4
      if (sideSounds) sidePower[band] += sideSum / 4
    }

    mid.copyWithin(0, this.half)
    side?.copyWithin(0, this.half)
  }
}
