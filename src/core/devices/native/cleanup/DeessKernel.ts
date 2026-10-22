// De-ess: an ess turned down, the rest of the voice left alone. While the
// part of the voice over Frequency (a high-pass) comes within Threshold dB
// of the whole voice's level, as it does in an "s" or a "sh" and never in a
// vowel, what is over the frequency is turned down, at 4:1 and by Range dB
// at most: the voice is crossfaded toward its low-pass at the frequency, so
// at rest it is the voice exactly and at the most it is the voice under the
// frequency with what is over it Range dB down. Because the test is the hiss against the
// voice, not the hiss against a fixed level, it works alike on a loud and a
// quiet recording. Both channels share one gain. No look-ahead; latency 0.

import { DEESS_PARAMS } from './abi'
import { Biquad } from './biquad'
import { CLEANUP_MAX_CHANNELS, CleanupKernel } from './CleanupKernel'

/** How much of the overshoot is taken off: 4:1. */
const SLOPE = 0.75
const ATTACK_MS = 1
const RELEASE_MS = 60
/** Under −70 dBFS mean square nothing is an ess. */
const QUIET = 1e-7

export class DeessKernel extends CleanupKernel<typeof DEESS_PARAMS> {
  private readonly hiss = new Biquad()
  private readonly under = new Biquad()
  private readonly attack: number
  private readonly release: number
  private hissPower = 0
  private wholePower = 0
  private gainValue = 1
  private readonly kept = new Float64Array(CLEANUP_MAX_CHANNELS)

  constructor(sampleRate: number) {
    super(sampleRate, DEESS_PARAMS, 0)
    this.attack = 1 - Math.exp(-1000 / (ATTACK_MS * sampleRate))
    this.release = 1 - Math.exp(-1000 / (RELEASE_MS * sampleRate))
    this.paramsChanged()
  }

  /** The gain on the part over the frequency now: 1 when nothing is taken off. */
  get gain(): number {
    return this.gainValue
  }

  protected paramsChanged(): void {
    this.hiss.highPass(this.sampleRate, this.getParam('frequency'))
    this.under.lowPass(this.sampleRate, this.getParam('frequency'))
  }

  protected render(input: readonly Float32Array[], wet: Float32Array[], frames: number): void {
    const channels = input.length
    const threshold = this.getParam('threshold')
    const range = this.getParam('range')
    for (let i = 0; i < frames; i += 1) {
      let hiss = 0
      let whole = 0
      for (let c = 0; c < channels; c += 1) {
        const x = input[c][i]
        const high = this.hiss.tick(c, x)
        this.kept[c] = this.under.tick(c, x)
        if (high * high > hiss) hiss = high * high
        if (x * x > whole) whole = x * x
      }
      this.hissPower +=
        (hiss - this.hissPower) * (hiss > this.hissPower ? this.attack : this.release)
      this.wholePower +=
        (whole - this.wholePower) * (whole > this.wholePower ? this.attack : this.release)

      let target = 1
      if (this.wholePower > QUIET && this.hissPower > 0) {
        const over = 10 * Math.log10(this.hissPower / this.wholePower) - threshold
        if (over > 0) target = Math.pow(10, -Math.min(range, over * SLOPE) / 20)
      }
      this.gainValue +=
        (target - this.gainValue) * (target < this.gainValue ? this.attack : this.release)

      const g = this.gainValue
      for (let c = 0; c < channels; c += 1) wet[c][i] = g * input[c][i] + (1 - g) * this.kept[c]
    }
  }

  protected clear(): void {
    this.hiss.clear()
    this.under.clear()
    this.hissPower = 0
    this.wholePower = 0
    this.gainValue = 1
  }
}
