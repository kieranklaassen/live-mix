// De-reverb: the room taken off a voice, its echo and its reverb tail, by
// Reduction dB at most. A room's sound dies away at a known rate, set by its
// reverb time (Tail): so what of a band is the room's, a moment from now, is
// what the band held a moment ago, faded by that rate. Each band's power is
// smoothed, kept for Early ms, faded by the tail's decay over those ms and
// taken as the room's share of the band now; the band keeps the rest
// (spectral subtraction of the late reverberation, after Lebart, Boucher and
// Denbigh). The first Early ms of every sound is never touched, so a word's
// start and the voice's own body stay. Latency one frame (about 21 ms).

import { DEREVERB_PARAMS } from './abi'
import { SpectralKernel } from './SpectralKernel'

/** How long a band's power is smoothed over (s). */
const SMOOTHING_SECONDS = 0.02
/** How fast a band's gain may come back up once the room's share falls (s). */
const RECOVERY_SECONDS = 0.01
const TINY = 1e-20

export class DereverbKernel extends SpectralKernel<typeof DEREVERB_PARAMS> {
  private readonly smoothed: Float64Array
  private readonly smoothedGains: Float64Array
  private history: Float64Array[] = []
  private historyAt = 0
  private readonly smoothing: number
  private readonly recovery: number
  private readonly framesPerSecond: number
  private floor = 1
  private fade = 0
  private frames = 0

  constructor(sampleRate: number) {
    super(sampleRate, DEREVERB_PARAMS)
    this.framesPerSecond = sampleRate / this.hop
    this.smoothed = new Float64Array(this.bands)
    this.smoothedGains = new Float64Array(this.bands).fill(1)
    this.smoothing = Math.exp(-1 / (this.framesPerSecond * SMOOTHING_SECONDS))
    this.recovery = 1 - Math.exp(-1 / (this.framesPerSecond * RECOVERY_SECONDS))
    this.paramsChanged()
  }

  protected paramsChanged(): void {
    this.floor = Math.pow(10, -this.getParam('reduction') / 20)
    const delay = Math.max(1, Math.round((this.getParam('earlyMs') / 1000) * this.framesPerSecond))
    // The power of a sound in a room with a reverb time of T falls 60 dB in T: by e^(-2δt), δ = 3·ln 10 / T.
    const decay = (3 * Math.log(10)) / this.getParam('tailSec')
    this.fade = Math.exp((-2 * decay * delay) / this.framesPerSecond)
    if (this.history.length !== delay) {
      this.history = Array.from({ length: delay }, () => new Float64Array(this.bands))
      this.historyAt = 0
    }
  }

  protected shape(power: Float64Array, gains: Float64Array): void {
    const past = this.history[this.historyAt]
    const known = this.frames >= this.history.length
    this.frames += 1
    for (let k = 0; k < this.bands; k += 1) {
      const s = this.smoothing * this.smoothed[k] + (1 - this.smoothing) * power[k]
      this.smoothed[k] = s
      const room = known ? Math.min(s, this.fade * past[k]) : 0
      const target = this.floor >= 1 ? 1 : Math.max(this.floor, 1 - room / Math.max(s, TINY))
      // Down at once, back up over RECOVERY_SECONDS: no flutter as a tail dies.
      const gain =
        target < this.smoothedGains[k]
          ? target
          : this.smoothedGains[k] + (target - this.smoothedGains[k]) * this.recovery
      this.smoothedGains[k] = gain
      gains[k] = gain
      past[k] = s
    }
    this.historyAt = (this.historyAt + 1) % this.history.length
  }

  protected clearSpectra(): void {
    this.smoothed.fill(0)
    this.smoothedGains.fill(1)
    for (const frame of this.history) frame.fill(0)
    this.historyAt = 0
    this.frames = 0
  }
}
