// De-plosive: the thump of a "p" or a "b" on the microphone turned down. A
// pop is a burst of air the microphone hears as lows far over the rest of
// the voice: while the voice under Frequency (a low-pass) stands more than
// Threshold dB over the voice above it (a high-pass), what is under the
// frequency is turned down by the excess, Range dB at most, in half a
// millisecond, and let back up over 80 ms: the voice is crossfaded toward
// its high-pass at the frequency, so at rest it is the voice exactly. A voice's own low notes never stand so far over its harmonics, so
// they pass. Both channels share one gain. No look-ahead; latency 0.

import { DEPLOSIVE_PARAMS } from './abi'
import { Biquad } from './biquad'
import { CLEANUP_MAX_CHANNELS, CleanupKernel } from './CleanupKernel'

const DETECT_ATTACK_MS = 0.5
const DETECT_RELEASE_MS = 30
const GAIN_ATTACK_MS = 0.5
const GAIN_RELEASE_MS = 80
/** Lows under −60 dBFS mean square are never a pop. */
const QUIET = 1e-6

const coefficient = (ms: number, sampleRate: number) => 1 - Math.exp(-1000 / (ms * sampleRate))

export class DeplosiveKernel extends CleanupKernel<typeof DEPLOSIVE_PARAMS> {
  private readonly low = new Biquad()
  private readonly high = new Biquad()
  private readonly detectAttack: number
  private readonly detectRelease: number
  private readonly gainAttack: number
  private readonly gainRelease: number
  private lowPower = 0
  private restPower = 0
  private gainValue = 1
  private readonly kept = new Float64Array(CLEANUP_MAX_CHANNELS)

  constructor(sampleRate: number) {
    super(sampleRate, DEPLOSIVE_PARAMS, 0)
    this.detectAttack = coefficient(DETECT_ATTACK_MS, sampleRate)
    this.detectRelease = coefficient(DETECT_RELEASE_MS, sampleRate)
    this.gainAttack = coefficient(GAIN_ATTACK_MS, sampleRate)
    this.gainRelease = coefficient(GAIN_RELEASE_MS, sampleRate)
    this.paramsChanged()
  }

  /** The gain on the lows now: 1 when nothing is taken off. */
  get gain(): number {
    return this.gainValue
  }

  protected paramsChanged(): void {
    this.low.lowPass(this.sampleRate, this.getParam('frequency'))
    this.high.highPass(this.sampleRate, this.getParam('frequency'))
  }

  protected render(input: readonly Float32Array[], wet: Float32Array[], frames: number): void {
    const channels = input.length
    const threshold = this.getParam('threshold')
    const range = this.getParam('range')
    for (let i = 0; i < frames; i += 1) {
      let low = 0
      let rest = 0
      for (let c = 0; c < channels; c += 1) {
        const x = input[c][i]
        const l = this.low.tick(c, x)
        const h = this.high.tick(c, x)
        this.kept[c] = h
        if (l * l > low) low = l * l
        if (h * h > rest) rest = h * h
      }
      this.lowPower +=
        (low - this.lowPower) * (low > this.lowPower ? this.detectAttack : this.detectRelease)
      this.restPower +=
        (rest - this.restPower) * (rest > this.restPower ? this.detectAttack : this.detectRelease)

      let target = 1
      if (this.lowPower > QUIET) {
        const over =
          10 * Math.log10(this.lowPower / Math.max(this.restPower, QUIET * 1e-3)) - threshold
        if (over > 0) target = Math.pow(10, -Math.min(range, over) / 20)
      }
      this.gainValue +=
        (target - this.gainValue) * (target < this.gainValue ? this.gainAttack : this.gainRelease)

      const g = this.gainValue
      for (let c = 0; c < channels; c += 1) wet[c][i] = g * input[c][i] + (1 - g) * this.kept[c]
    }
  }

  protected clear(): void {
    this.low.clear()
    this.high.clear()
    this.lowPower = 0
    this.restPower = 0
    this.gainValue = 1
  }
}
