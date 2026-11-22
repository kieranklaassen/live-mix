// Measures a stretch of sound on plain arrays, a chunk at a time, with no Web
// Audio: a worker reads a file by slices, pushes each, and reads the figures
// once at the end.
//
// Loudness and true peak are the engine's BS.1770-4 analyser. It is fed up to
// the end of each of its 100 ms steps, so its momentary and short-term
// readings can be taken there: the highest of each, the short-term series,
// and the values the loudness range is made from.

import {
  GATING_HOP_SECONDS,
  LoudnessAnalyzer,
  MOMENTARY_WINDOW_SECONDS,
  SHORT_TERM_WINDOW_SECONDS,
} from '../core/analysis/loudness'
import { BandAnalyzer, powerDb } from './bands'
import { loudnessRange } from './range'
import type { Measurement, ShortTermSeries } from './types'

/** Changes when a figure's meaning or method does, so kept figures can be told from new ones. */
const MEASUREMENT_VERSION = 1
/** The most points a short-term series holds. */
const SERIES_POINTS = 120
const SERIES_HOP_SECONDS = 1

const MOMENTARY_HOPS = Math.round(MOMENTARY_WINDOW_SECONDS / GATING_HOP_SECONDS)
const SHORT_TERM_HOPS = Math.round(SHORT_TERM_WINDOW_SECONDS / GATING_HOP_SECONDS)

/** A figure as it goes in the result: null for an infinity or what is not a number. */
function figure(value: number): number | null {
  return Number.isFinite(value) ? value : null
}

/**
 * Measures one stretch of sound of one or two channels. Push the sound in
 * order, in chunks of any size, then call `finish` once for the figures.
 * What it reads does not depend on how the sound was cut into chunks.
 */
export class Measurer {
  readonly sampleRate: number
  readonly channels: number
  private readonly loudness: LoudnessAnalyzer
  private readonly bands: BandAnalyzer
  /** What the loudness analyser is given for a right channel when there is none. */
  private readonly noRight: Float32Array

  /** Frames into the analyser's 100 ms step under way, and steps completed. */
  private hopFill = 0
  private hops = 0
  private maxMomentary = -Infinity
  private maxShortTerm = -Infinity
  /** The short-term loudness at the end of every step from three seconds on. */
  private readonly shortTerms: number[] = []

  private frames = 0
  private sumLeft = 0
  private sumRight = 0
  private squaresLeft = 0
  private squaresRight = 0
  private products = 0
  /** Sums of squares of left + right and of left - right. */
  private squaresSum = 0
  private squaresDifference = 0
  private finished = false

  constructor(sampleRate: number, channels: number) {
    if (channels !== 1 && channels !== 2) {
      throw new RangeError(`live-mix: a measurer takes one or two channels, not ${channels}`)
    }
    this.sampleRate = sampleRate
    this.channels = channels
    this.loudness = new LoudnessAnalyzer(sampleRate)
    this.bands = new BandAnalyzer(sampleRate, channels)
    this.noRight = new Float32Array(channels === 1 ? this.loudness.hopFrames : 0)
  }

  /** Takes the next chunk: a `Float32Array` a channel, all of one length. */
  push(chunk: readonly Float32Array[]): void {
    if (this.finished) throw new Error('live-mix: this measurer has been read')
    if (chunk.length !== this.channels) {
      throw new RangeError(
        `live-mix: a chunk of ${chunk.length} channels for a measurer of ${this.channels}`,
      )
    }
    const left = chunk[0]
    const right = this.channels === 2 ? chunk[1] : null
    const frames = left.length
    if (right !== null && right.length !== frames) {
      throw new RangeError('live-mix: the channels of a chunk are of unequal length')
    }

    const hopFrames = this.loudness.hopFrames
    let from = 0
    while (from < frames) {
      const to = Math.min(frames, from + hopFrames - this.hopFill)
      this.loudness.process(
        left.subarray(from, to),
        right === null ? this.noRight : right.subarray(from, to),
        to - from,
      )
      this.hopFill += to - from
      if (this.hopFill === hopFrames) {
        this.hopFill = 0
        this.endHop()
      }
      this.sum(left, right, from, to)
      this.bands.push(left, right, from, to)
      from = to
    }
    this.frames += frames
  }

  /** The figures of everything pushed. A measurer is read once. */
  finish(): Measurement {
    if (this.finished) throw new Error('live-mix: this measurer has been read')
    this.finished = true

    const { frames, channels } = this
    const stereo = channels === 2
    const reading = this.loudness.read()
    const peak = Math.max(reading.samplePeak[0], reading.samplePeak[1])
    const samplePeakDbfs = figure(20 * Math.log10(peak))
    const rmsDbfs = powerDb((this.squaresLeft + this.squaresRight) / (frames * channels))
    const mid = this.squaresSum / (4 * frames)
    const side = this.squaresDifference / (4 * frames)
    const widthDb = stereo && mid > 0 && side > 0 ? 10 * Math.log10(side / mid) : null
    const correlation =
      stereo && this.squaresLeft > 0 && this.squaresRight > 0
        ? this.products / Math.sqrt(this.squaresLeft * this.squaresRight)
        : null
    const dcOffset = [figure(this.sumLeft / frames)]
    if (stereo) dcOffset.push(figure(this.sumRight / frames))

    return {
      version: MEASUREMENT_VERSION,
      sampleRate: this.sampleRate,
      channels,
      frames,
      seconds: frames / this.sampleRate,
      silent: peak === 0,
      integratedLufs: figure(this.loudness.integrated),
      maxMomentaryLufs: figure(this.maxMomentary),
      maxShortTermLufs: figure(this.maxShortTerm),
      shortTerm: this.series(),
      loudnessRangeLu: loudnessRange(this.shortTerms),
      truePeakDbtp: figure(20 * Math.log10(reading.maxTruePeak)),
      samplePeakDbfs,
      rmsDbfs,
      crestDb: samplePeakDbfs !== null && rmsDbfs !== null ? samplePeakDbfs - rmsDbfs : null,
      bands: this.bands.finish(frames),
      widthDb,
      correlation,
      dcOffset,
    }
  }

  /** The analyser has completed a 100 ms step: take the readings whose windows are now full. */
  private endHop(): void {
    this.hops += 1
    if (this.hops >= MOMENTARY_HOPS) {
      const momentary = this.loudness.momentary
      if (momentary > this.maxMomentary) this.maxMomentary = momentary
    }
    if (this.hops >= SHORT_TERM_HOPS) {
      const shortTerm = this.loudness.shortTerm
      if (shortTerm > this.maxShortTerm) this.maxShortTerm = shortTerm
      this.shortTerms.push(shortTerm)
    }
  }

  /** Adds the frames `from` up to `to` to the running sums, one sample after another. */
  private sum(left: Float32Array, right: Float32Array | null, from: number, to: number): void {
    // Each sum goes on from where it stood, so the order of the additions,
    // and with it the rounding, is the same however the sound was cut.
    let sumLeft = this.sumLeft
    let squaresLeft = this.squaresLeft
    if (right === null) {
      for (let i = from; i < to; i += 1) {
        sumLeft += left[i]
        squaresLeft += left[i] * left[i]
      }
      this.sumLeft = sumLeft
      this.squaresLeft = squaresLeft
      return
    }
    let sumRight = this.sumRight
    let squaresRight = this.squaresRight
    let products = this.products
    let squaresSum = this.squaresSum
    let squaresDifference = this.squaresDifference
    for (let i = from; i < to; i += 1) {
      const l = left[i]
      const r = right[i]
      sumLeft += l
      sumRight += r
      squaresLeft += l * l
      squaresRight += r * r
      products += l * r
      squaresSum += (l + r) * (l + r)
      squaresDifference += (l - r) * (l - r)
    }
    this.sumLeft = sumLeft
    this.sumRight = sumRight
    this.squaresLeft = squaresLeft
    this.squaresRight = squaresRight
    this.products = products
    this.squaresSum = squaresSum
    this.squaresDifference = squaresDifference
  }

  /** At most 120 of the short-term readings, evenly spaced from three seconds in. */
  private series(): ShortTermSeries {
    const seconds = this.frames / this.sampleRate
    const hopSeconds = Math.max(SERIES_HOP_SECONDS, seconds / SERIES_POINTS)
    const stepSeconds = this.loudness.hopFrames / this.sampleRate
    const lufs: (number | null)[] = []
    // The hop is a 120th of the stretch or more and the first point is three
    // seconds in, so the readings run out before a 121st point.
    for (;;) {
      const at = SHORT_TERM_WINDOW_SECONDS + lufs.length * hopSeconds
      // Reading 0 was taken when the thirtieth step ended.
      const reading = Math.round(at / stepSeconds) - SHORT_TERM_HOPS
      if (reading >= this.shortTerms.length) break
      lufs.push(figure(this.shortTerms[reading]))
    }
    return { startSeconds: SHORT_TERM_WINDOW_SECONDS, hopSeconds, lufs }
  }
}

/** Measures a whole stretch held as planar audio: a `Float32Array` a channel, one or two. */
export function measure(channels: readonly Float32Array[], sampleRate: number): Measurement {
  const measurer = new Measurer(sampleRate, channels.length)
  measurer.push(channels)
  return measurer.finish()
}
