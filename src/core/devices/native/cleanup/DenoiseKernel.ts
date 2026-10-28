// De-noise: a steady noise under a voice (a fan, a computer, the hiss of a
// preamp, the air of a room) turned down by Reduction dB, the voice kept. It
// learns the noise as it goes, with nothing to teach it: in each band it
// takes the quietest the smoothed sound has been over the last Adapt
// seconds, which between words is the noise alone (minimum statistics, after
// Martin). Each band is then given the gain a Wiener filter would give it
// for its share of voice over noise, judged with the decision-directed rule
// (mostly on how much voice the band just held), which keeps the leftover
// noise from warbling. Nothing is turned down more than Reduction. Latency
// one frame (about 21 ms).

import { DENOISE_PARAMS } from './abi'
import { SpectralKernel } from './SpectralKernel'

/** How long a band's power is smoothed over before its quietest is taken (s). */
const SMOOTHING_SECONDS = 0.03
/** The quietest of a smoothed power sits under the noise's mean; this lifts it back (6 dB). */
const MINIMUM_BIAS = 4
/** How much of the judgment rests on the voice the band just held. */
const DECISION_WEIGHT = 0.98
/** The look-back is kept as this many parts, so the oldest part leaves without a search of every frame. */
const PARTS = 8
const TINY = 1e-20

export class DenoiseKernel extends SpectralKernel<typeof DENOISE_PARAMS> {
  private readonly smoothed: Float64Array
  private readonly clean: Float64Array
  private readonly partMinimum: Float64Array
  private readonly pastParts: Float64Array[]
  private readonly pastMinimum: Float64Array
  private readonly smoothing: number
  private readonly framesPerSecond: number
  private framesPerPart = 1
  private framesInPart = 0
  private partAt = 0
  private started = false
  private floor = 1
  private over = 1

  constructor(sampleRate: number) {
    super(sampleRate, DENOISE_PARAMS)
    this.framesPerSecond = sampleRate / this.hop
    this.smoothed = new Float64Array(this.bands)
    this.clean = new Float64Array(this.bands)
    this.partMinimum = new Float64Array(this.bands).fill(Infinity)
    this.pastParts = Array.from({ length: PARTS }, () =>
      new Float64Array(this.bands).fill(Infinity),
    )
    this.pastMinimum = new Float64Array(this.bands).fill(Infinity)
    this.smoothing = Math.exp(-1 / (this.framesPerSecond * SMOOTHING_SECONDS))
    this.paramsChanged()
  }

  /** The noise it has learned in band `k`, as power in its frames. */
  noiseIn(k: number): number {
    return Math.min(this.partMinimum[k], this.pastMinimum[k]) * MINIMUM_BIAS
  }

  protected paramsChanged(): void {
    this.floor = Math.pow(10, -this.getParam('reduction') / 20)
    this.over = MINIMUM_BIAS * Math.pow(10, this.getParam('threshold') / 10)
    this.framesPerPart = Math.max(
      1,
      Math.round((this.getParam('adaptSec') * this.framesPerSecond) / PARTS),
    )
  }

  protected shape(power: Float64Array, gains: Float64Array): void {
    const first = !this.started
    this.started = true
    for (let k = 0; k < this.bands; k += 1) {
      const p = power[k]
      const s = first ? p : this.smoothing * this.smoothed[k] + (1 - this.smoothing) * p
      this.smoothed[k] = s
      if (s < this.partMinimum[k]) this.partMinimum[k] = s

      if (this.floor >= 1) {
        gains[k] = 1
        this.clean[k] = p
        continue
      }
      const noise = Math.max(Math.min(this.partMinimum[k], this.pastMinimum[k]) * this.over, TINY)
      const posterior = p / noise
      const prior =
        DECISION_WEIGHT * (this.clean[k] / noise) +
        (1 - DECISION_WEIGHT) * Math.max(posterior - 1, 0)
      const gain = Math.max(this.floor, prior / (1 + prior))
      gains[k] = gain
      this.clean[k] = gain * gain * p
    }

    this.framesInPart += 1
    if (this.framesInPart >= this.framesPerPart) this.closePart()
  }

  protected clearSpectra(): void {
    this.smoothed.fill(0)
    this.clean.fill(0)
    this.partMinimum.fill(Infinity)
    for (const part of this.pastParts) part.fill(Infinity)
    this.pastMinimum.fill(Infinity)
    this.framesInPart = 0
    this.partAt = 0
    this.started = false
  }

  /** The part that filled joins the look-back, in place of the oldest. */
  private closePart(): void {
    this.framesInPart = 0
    this.pastParts[this.partAt].set(this.partMinimum)
    this.partAt = (this.partAt + 1) % PARTS
    this.partMinimum.fill(Infinity)
    for (let k = 0; k < this.bands; k += 1) {
      let least = Infinity
      for (const part of this.pastParts) if (part[k] < least) least = part[k]
      this.pastMinimum[k] = least
    }
  }
}
