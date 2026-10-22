// What the six voice cleanup kernels share, as a plain class over
// Float32Array blocks so it runs alike in the worklet
// (cleanup.processor.ts) and in offline tests: the parameter values, the
// channels (one or two; a third and on are left out, and an output wider than
// the signal repeats its last channel), a click-free bypass, and the meter.
//
// A kernel that holds its sound (`latencySamples`) is bypassed to the dry
// sound held as long, so turning it off or on moves nothing in time. The
// meter is the dB the kernel took off the sound over a span, read from the
// same held dry sound, so the two it compares are the same moment.
// Nothing allocates in `process` after the first block of a given size.

import { clampParam, type ParamSpec } from '../../../params'
import { CLEANUP_BYPASS_RAMP_SECONDS } from './abi'

/** The most channels a kernel works on. */
export const CLEANUP_MAX_CHANNELS = 2

/** Below this mean square (−120 dBFS) a span counts as silence and the meter reads 0. */
const SILENCE_POWER = 1e-12

/** A kernel of any kind, its parameters by name: what the processor drives. */
export interface AnyCleanupKernel {
  readonly sampleRate: number
  readonly latencySamples: number
  bypass: boolean
  setParam(name: string, value: number): void
  getParam(name: string): number
  takeReduction(): number
  process(signal: readonly Float32Array[], output: Float32Array[], frames: number): void
  reset(): void
}

export abstract class CleanupKernel<P extends Record<string, ParamSpec>> {
  readonly sampleRate: number
  readonly params: P
  readonly latencySamples: number
  private readonly values = new Map<keyof P & string, number>()
  private bypassMix = 0
  private bypassTarget = 0
  private readonly bypassStep: number
  private readonly dry: Float32Array[]
  private dryPosition = 0
  private wet: Float32Array[] = []
  private silence = new Float32Array(0)
  private dryPower = 0
  private wetPower = 0

  protected constructor(sampleRate: number, params: P, latencySamples: number) {
    this.sampleRate = sampleRate
    this.params = params
    this.latencySamples = latencySamples
    this.bypassStep = 1 / Math.max(1, CLEANUP_BYPASS_RAMP_SECONDS * sampleRate)
    this.dry = Array.from(
      { length: CLEANUP_MAX_CHANNELS },
      () => new Float32Array(latencySamples + 1),
    )
    for (const name of Object.keys(params) as (keyof P & string)[]) {
      this.values.set(name, params[name].default)
    }
  }

  /** Set a parameter by name; the value is clamped to its spec. */
  setParam(name: keyof P & string, value: number): void {
    const spec = this.params[name] as ParamSpec | undefined
    if (!spec) throw new Error(`live-mix: ${this.constructor.name} has no parameter "${name}"`)
    this.values.set(name, clampParam(spec, value))
    this.paramsChanged()
  }

  getParam(name: keyof P & string): number {
    return this.values.get(name) ?? this.params[name].default
  }

  get bypass(): boolean {
    return this.bypassTarget === 1
  }

  /** Click-free bypass: the output crossfades to the held dry sound over 5 ms; the kernel keeps running. */
  set bypass(enabled: boolean) {
    this.bypassTarget = enabled ? 1 : 0
  }

  /** The dB taken off the sound since the last call (0 or more; 0 over silence), and a new span begun. */
  takeReduction(): number {
    const dry = this.dryPower
    const wet = this.wetPower
    this.dryPower = 0
    this.wetPower = 0
    if (dry < SILENCE_POWER) return 0
    return Math.max(0, 10 * Math.log10(dry / Math.max(wet, SILENCE_POWER * 1e-3)))
  }

  /**
   * Clean `signal` into `output` (channel arrays; `output` may be `signal`
   * for in-place processing). Output channels beyond the signal's channel
   * count repeat its last channel; an empty signal is silence.
   */
  process(signal: readonly Float32Array[], output: Float32Array[], frames: number): void {
    if (this.silence.length < frames) this.silence = new Float32Array(frames)
    const channels = Math.min(CLEANUP_MAX_CHANNELS, Math.max(1, signal.length))
    const input: Float32Array[] = []
    for (let c = 0; c < channels; c += 1) input.push(signal[c] ?? this.silence)
    if (this.wet.length < channels || this.wet[0].length < frames) {
      this.wet = Array.from({ length: CLEANUP_MAX_CHANNELS }, () => new Float32Array(frames))
    }

    this.render(input, this.wet, frames)

    const ring = this.dry[0].length
    for (let i = 0; i < frames; i += 1) {
      if (this.bypassMix !== this.bypassTarget) {
        this.bypassMix =
          this.bypassMix < this.bypassTarget
            ? Math.min(this.bypassTarget, this.bypassMix + this.bypassStep)
            : Math.max(this.bypassTarget, this.bypassMix - this.bypassStep)
      }
      const mix = this.bypassMix
      const read = (this.dryPosition + 1) % ring
      // Every input sample of this frame is read before any output is written: output may be the signal.
      for (let c = 0; c < channels; c += 1) {
        const held = this.dry[c]
        held[this.dryPosition] = input[c][i]
        const dry = held[read]
        const wet = this.wet[c][i]
        this.dryPower += dry * dry
        this.wetPower += wet * wet
        this.wet[c][i] = mix === 0 ? wet : wet * (1 - mix) + dry * mix
      }
      this.dryPosition = read
      for (let c = output.length - 1; c >= 0; c -= 1) {
        output[c][i] = this.wet[Math.min(c, channels - 1)][i]
      }
    }
  }

  /** Clear what the kernel heard (not its parameters). */
  reset(): void {
    for (const held of this.dry) held.fill(0)
    this.dryPower = 0
    this.wetPower = 0
    this.clear()
  }

  /**
   * Write the cleaned sound of `input` (one or two channels) into the same
   * channels of `wet`, `latencySamples` late. `wet` never aliases `input`.
   */
  protected abstract render(
    input: readonly Float32Array[],
    wet: Float32Array[],
    frames: number,
  ): void

  /** Work out what follows from the parameters; called after every change, and by a subclass once at the end of its constructor. */
  protected abstract paramsChanged(): void

  /** Forget what was heard. */
  protected abstract clear(): void
}
