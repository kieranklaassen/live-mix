// De-click: the small wet clicks of a mouth, and any tick as short, taken out
// and the voice drawn through where they were. A click is far sharper than a
// voice: in what is over 4 kHz it jumps many times over the highest the
// voice reached there in the last few milliseconds, where the voice's own
// pulses, one per period of its pitch, are each about as high as the last.
// The click lasts while that part stays within 10 dB of the jump. Where it
// lasts no longer than Length, the span (with a quarter of a millisecond
// either side) is drawn again from the voice on both sides of it: a linear
// predictor learned from the 3 ms before carries the voice forward into the
// span, one learned from the 3 ms after carries it back, and the two are
// crossfaded. A longer jump is a consonant and is left as it was. Both
// channels are judged together and repaired alike.
//
// To read the voice after a click before it is played, the kernel holds its
// sound for the longest click, the margins and the 3 ms after
// (`declickLatencySamples`, about 6.5 ms).

import {
  DECLICK_CONTEXT_MS,
  DECLICK_MARGIN_MS,
  DECLICK_MAX_LENGTH_MS,
  DECLICK_PARAMS,
  declickLatencySamples,
} from './abi'
import { Biquad } from './biquad'
import { CLEANUP_MAX_CHANNELS, CleanupKernel } from './CleanupKernel'

/** Where the detector listens from. */
const DETECT_HZ = 4000
/** How fast the highest the voice reached falls away (ms, as a time constant of its power): about 5 dB over the longest period of a voice's pitch. */
const PEAK_MS = 10
/** A click lasts while it stays within this much of the jump that began it (10 dB). */
const LASTS = 0.1
/** The order of the predictors that draw the voice through a click. */
const ORDER = 16
/** Highs under −80 dBFS mean square are never a click. */
const QUIET = 1e-8

export class DeclickKernel extends CleanupKernel<typeof DECLICK_PARAMS> {
  private readonly detector = new Biquad()
  private readonly margin: number
  private readonly context: number
  private readonly ring: Float32Array[]
  private readonly mask: number
  private readonly peakFall: number
  private peak = 0
  private reference = 0
  private jump = 1
  private maxLength = 0
  private now = 0
  private open = false
  private start = 0
  private lastFlag = 0
  private tooLong = false
  private repaired = 0
  // Scratch for a repair, sized once.
  private readonly correlation = new Float64Array(ORDER + 1)
  private readonly forwardCoefs = new Float64Array(ORDER + 1)
  private readonly backwardCoefs = new Float64Array(ORDER + 1)
  private readonly levinson = new Float64Array(ORDER + 1)
  private readonly forward: Float64Array
  private readonly backward: Float64Array
  private readonly window: Float64Array

  constructor(sampleRate: number) {
    const latency = declickLatencySamples(sampleRate)
    super(sampleRate, DECLICK_PARAMS, latency)
    this.margin = Math.ceil((DECLICK_MARGIN_MS / 1000) * sampleRate)
    this.context = Math.ceil((DECLICK_CONTEXT_MS / 1000) * sampleRate)
    const longest = Math.ceil((DECLICK_MAX_LENGTH_MS / 1000) * sampleRate) + 2 * this.margin + 1
    let size = 1
    while (size < latency + longest + 2 * this.context + 2) size *= 2
    this.mask = size - 1
    this.ring = Array.from({ length: CLEANUP_MAX_CHANNELS }, () => new Float32Array(size))
    this.forward = new Float64Array(longest)
    this.backward = new Float64Array(longest)
    this.window = new Float64Array(this.context)
    this.peakFall = Math.exp(-1000 / (PEAK_MS * sampleRate))
    this.detector.highPass(sampleRate, DETECT_HZ)
    this.paramsChanged()
  }

  /** How many clicks it has repaired since it was made or reset. */
  get clicksRepaired(): number {
    return this.repaired
  }

  protected paramsChanged(): void {
    // Sensitivity 0 wants a jump of 30 dB over the background, 1 a jump of 12 dB.
    this.jump = Math.pow(10, (30 - 18 * this.getParam('sensitivity')) / 10)
    this.maxLength = Math.round((this.getParam('lengthMs') / 1000) * this.sampleRate)
  }

  protected render(input: readonly Float32Array[], wet: Float32Array[], frames: number): void {
    const channels = input.length
    const latency = this.latencySamples
    for (let i = 0; i < frames; i += 1) {
      const n = this.now
      let high = 0
      for (let c = 0; c < channels; c += 1) {
        const x = input[c][i]
        this.ring[c][n & this.mask] = x
        const h = this.detector.tick(c, x)
        if (h * h > high) high = h * h
      }

      if (!this.open) {
        if (high > QUIET && high > this.jump * this.peak) {
          this.open = true
          this.tooLong = false
          this.start = n - this.margin
          this.lastFlag = n
          this.reference = Math.max(this.peak, QUIET)
        }
      } else if (high > LASTS * this.jump * this.reference) {
        this.lastFlag = n
        if (this.lastFlag - this.start + 1 > this.maxLength + this.margin) this.tooLong = true
      }
      this.peak = Math.max(high, this.peak * this.peakFall)

      if (this.open && n >= this.lastFlag + this.margin + this.context) {
        if (!this.tooLong) {
          for (let c = 0; c < channels; c += 1)
            this.repair(this.ring[c], this.start, this.lastFlag + this.margin)
          this.repaired += 1
        }
        this.open = false
      }

      const out = n - latency
      for (let c = 0; c < channels; c += 1) wet[c][i] = out < 0 ? 0 : this.ring[c][out & this.mask]
      this.now = n + 1
    }
  }

  protected clear(): void {
    for (const ring of this.ring) ring.fill(0)
    this.detector.clear()
    this.peak = 0
    this.open = false
    this.repaired = 0
  }

  /** Draw `ring` again over [first, last] from the voice on both sides of it. */
  private repair(ring: Float32Array, first: number, last: number): void {
    const length = last - first + 1
    const context = this.context
    const mask = this.mask
    // Learned from the voice before, read forward; and from the voice after, read backward.
    for (let j = 0; j < context; j += 1) this.window[j] = ring[(first - context + j) & mask]
    const forwardOk = this.learn(this.window, this.forwardCoefs)
    for (let j = 0; j < context; j += 1) this.window[j] = ring[(last + context - j) & mask]
    const backwardOk = this.learn(this.window, this.backwardCoefs)

    let peak = 0
    for (let j = 1; j <= context; j += 1) {
      peak = Math.max(peak, Math.abs(ring[(first - j) & mask]), Math.abs(ring[(last + j) & mask]))
    }

    for (let j = 0; j < length; j += 1) {
      let prediction = 0
      for (let k = 1; k <= ORDER; k += 1) {
        const position = first + j - k
        const past = position < first ? ring[position & mask] : this.forward[position - first]
        prediction -= this.forwardCoefs[k] * past
      }
      this.forward[j] = forwardOk ? prediction : 0
    }
    for (let j = 0; j < length; j += 1) {
      let prediction = 0
      for (let k = 1; k <= ORDER; k += 1) {
        const position = last - j + k
        const future = position > last ? ring[position & mask] : this.backward[last - position]
        prediction -= this.backwardCoefs[k] * future
      }
      this.backward[j] = backwardOk ? prediction : 0
    }

    const limit = 2 * peak
    for (let j = 0; j < length; j += 1) {
      const toward = (j + 1) / (length + 1)
      const drawn = this.forward[j] * (1 - toward) + this.backward[length - 1 - j] * toward
      ring[(first + j) & mask] = Math.max(-limit, Math.min(limit, drawn))
    }
  }

  /** A linear predictor of `samples` into `coefs` (coefs[0] = 1); false when they are silent. */
  private learn(samples: Float64Array, coefs: Float64Array): boolean {
    const r = this.correlation
    for (let lag = 0; lag <= ORDER; lag += 1) {
      let sum = 0
      for (let j = lag; j < samples.length; j += 1) sum += samples[j] * samples[j - lag]
      r[lag] = sum
    }
    if (r[0] < 1e-12) {
      coefs.fill(0)
      coefs[0] = 1
      return false
    }
    // A touch of white noise and a lag window keep the predictor stable.
    r[0] *= 1.0001
    for (let lag = 1; lag <= ORDER; lag += 1) r[lag] *= Math.exp(-0.5 * Math.pow(0.01 * lag, 2))

    coefs.fill(0)
    coefs[0] = 1
    let error = r[0]
    for (let i = 1; i <= ORDER; i += 1) {
      let acc = r[i]
      for (let j = 1; j < i; j += 1) acc += coefs[j] * r[i - j]
      const k = -acc / error
      this.levinson.set(coefs)
      for (let j = 1; j < i; j += 1) coefs[j] = this.levinson[j] + k * this.levinson[i - j]
      coefs[i] = k
      error *= 1 - k * k
      if (error <= 0) break
    }
    return true
  }
}
