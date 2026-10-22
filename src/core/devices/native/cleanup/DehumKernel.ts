// De-hum: the mains hum and its harmonics cut out of a voice. At the mains
// frequency and at each harmonic asked for, in a row, a band-pass Width Hz
// wide picks out the hum and all but Reduction dB of it is taken away. A
// band-pass falls off fast either side of its width, so a voice's own tone
// a few hertz off is left as it was. No look-ahead; latency 0.

import { DEHUM_PARAMS } from './abi'
import { Biquad } from './biquad'
import { CleanupKernel } from './CleanupKernel'

export class DehumKernel extends CleanupKernel<typeof DEHUM_PARAMS> {
  private readonly bands = Array.from({ length: DEHUM_PARAMS.harmonics.max }, () => new Biquad())
  private active = 0
  private taken = 1

  constructor(sampleRate: number) {
    super(sampleRate, DEHUM_PARAMS, 0)
    this.paramsChanged()
  }

  /** The frequencies cut, in Hz. */
  get frequencies(): number[] {
    const mains = this.mainsHz()
    return Array.from({ length: this.active }, (_, k) => mains * (k + 1))
  }

  protected paramsChanged(): void {
    const mains = this.mainsHz()
    const width = this.getParam('width')
    this.taken = 1 - Math.pow(10, -this.getParam('reduction') / 20)
    const wanted = Math.round(this.getParam('harmonics'))
    this.active = 0
    for (let k = 1; k <= wanted && mains * k < this.sampleRate * 0.45; k += 1) {
      this.bands[k - 1].bandPass(this.sampleRate, mains * k, width)
      this.active = k
    }
  }

  protected render(input: readonly Float32Array[], wet: Float32Array[], frames: number): void {
    for (let c = 0; c < input.length; c += 1) {
      const from = input[c]
      const to = wet[c]
      for (let i = 0; i < frames; i += 1) {
        let x = from[i]
        for (let k = 0; k < this.active; k += 1) x -= this.taken * this.bands[k].tick(c, x)
        to[i] = x
      }
    }
  }

  protected clear(): void {
    for (const band of this.bands) band.clear()
  }

  private mainsHz(): number {
    return this.getParam('mains') >= 0.5 ? 60 : 50
  }
}
