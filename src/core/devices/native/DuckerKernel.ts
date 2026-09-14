// The audio-thread ducker's DSP, as a plain class over Float32Array blocks so
// it runs identically inside the worklet (ducker.processor.ts) and in offline
// tests. Per sample: a sliding mean-square window over the mono key (the
// legacy analyser's 256-sample tap, made continuous), an asymmetric one-pole
// follower on the RMS (attack when the key rises, optional hold, then release),
// the Phase 0 drive law `1 - min(env·scale, 1)·depth`, and a one-pole gain
// smoother with the legacy `setTargetAtTime` time constant. The smoothed gain
// multiplies the signal in the same block; nothing allocates in `process`
// after the first block of a given size.

import { clampParam } from '../../params'
import {
  DUCKER_BYPASS_RAMP_SECONDS,
  DUCKER_DEFAULT_WINDOW_SIZE,
  DUCKER_PARAMS,
  type DuckerParamName,
} from './ducker-abi'

/** Follower values below this are flushed to zero (−200 dB RMS): denormal guard. */
const ENVELOPE_FLOOR = 1e-10

export interface DuckerKernelOptions {
  /** Key RMS window in samples. Default 256. */
  windowSize?: number
}

export class DuckerKernel {
  readonly sampleRate: number
  readonly windowSize: number
  private readonly squares: Float32Array
  private windowIndex = 0
  private sumSquares = 0
  private envelopeValue = 0
  private targetValue = 1
  private gainValue = 1
  private holdLeft = 0
  private holdSamples = 0
  private attackCoef = 0
  private releaseCoef = 0
  private gainCoef = 0
  private depth: number = DUCKER_PARAMS.depth.default
  private scale: number = DUCKER_PARAMS.gainScale.default
  private readonly values = new Map<DuckerParamName, number>()
  private bypassMix = 0
  private bypassTarget = 0
  private readonly bypassStep: number
  private stopped = false
  private keyMono = new Float32Array(0)
  private gains = new Float32Array(0)

  constructor(sampleRate: number, options: DuckerKernelOptions = {}) {
    this.sampleRate = sampleRate
    this.windowSize = Math.max(1, Math.floor(options.windowSize ?? DUCKER_DEFAULT_WINDOW_SIZE))
    this.squares = new Float32Array(this.windowSize)
    this.bypassStep = 1 / Math.max(1, DUCKER_BYPASS_RAMP_SECONDS * sampleRate)
    for (const name of Object.keys(DUCKER_PARAMS) as DuckerParamName[]) {
      this.setParam(name, DUCKER_PARAMS[name].default)
    }
  }

  /** Current follower value (RMS domain). */
  get envelope(): number {
    return this.envelopeValue
  }

  /** Current smoothed gain (before the bypass crossfade). */
  get gain(): number {
    return this.gainValue
  }

  /** Set a parameter by name; the value is clamped to its spec. */
  setParam(name: DuckerParamName, value: number): void {
    const spec = DUCKER_PARAMS[name]
    const clamped = clampParam(spec, value)
    this.values.set(name, clamped)
    switch (name) {
      case 'depth':
        this.depth = clamped
        break
      case 'attackMs':
        this.attackCoef = this.coefficientForMs(clamped)
        break
      case 'holdMs':
        this.holdSamples = Math.round((clamped / 1000) * this.sampleRate)
        break
      case 'releaseMs':
        this.releaseCoef = this.coefficientForMs(clamped)
        break
      case 'gainScale':
        this.scale = clamped
        break
      case 'timeConstant':
        this.gainCoef = 1 - Math.exp(-1 / (clamped * this.sampleRate))
        break
      default: {
        const unhandled: never = name
        throw new Error(`live-mix: unknown ducker parameter ${String(unhandled)}`)
      }
    }
  }

  getParam(name: DuckerParamName): number {
    return this.values.get(name) ?? DUCKER_PARAMS[name].default
  }

  get bypass(): boolean {
    return this.bypassTarget === 1
  }

  /** Click-free bypass: the gain crossfades to unity over 5 ms; the follower keeps running. */
  set bypass(enabled: boolean) {
    this.bypassTarget = enabled ? 1 : 0
  }

  /** Freeze the follower: the gain settles at the last target and stays there. */
  stop(): void {
    this.stopped = true
  }

  /** Clear the follower, window and gain (not the parameters). */
  reset(): void {
    this.squares.fill(0)
    this.windowIndex = 0
    this.sumSquares = 0
    this.envelopeValue = 0
    this.targetValue = 1
    this.gainValue = 1
    this.holdLeft = 0
  }

  /**
   * Compute the per-sample gain for one block from the key channels (any
   * count, averaged to mono; an empty array is silence) into `gains`.
   */
  renderGain(key: readonly Float32Array[], gains: Float32Array, frames: number): void {
    const mono = this.mixKey(key, frames)
    const squares = this.squares
    const windowSize = this.windowSize
    for (let i = 0; i < frames; i += 1) {
      const sample = mono[i]
      const square = sample * sample
      this.sumSquares += square - squares[this.windowIndex]
      squares[this.windowIndex] = square
      this.windowIndex += 1
      if (this.windowIndex === windowSize) {
        this.windowIndex = 0
        this.resyncWindow()
      }

      if (!this.stopped) {
        const rms = Math.sqrt(Math.max(0, this.sumSquares / windowSize))
        if (rms > this.envelopeValue) {
          this.envelopeValue += (rms - this.envelopeValue) * this.attackCoef
          this.holdLeft = this.holdSamples
        } else if (this.holdLeft > 0) {
          this.holdLeft -= 1
        } else {
          this.envelopeValue += (rms - this.envelopeValue) * this.releaseCoef
          if (this.envelopeValue < ENVELOPE_FLOOR) this.envelopeValue = 0
        }
        this.targetValue = 1 - Math.min(this.envelopeValue * this.scale, 1) * this.depth
      }
      this.gainValue += (this.targetValue - this.gainValue) * this.gainCoef

      if (this.bypassMix !== this.bypassTarget) {
        this.bypassMix =
          this.bypassMix < this.bypassTarget
            ? Math.min(this.bypassTarget, this.bypassMix + this.bypassStep)
            : Math.max(this.bypassTarget, this.bypassMix - this.bypassStep)
      }
      gains[i] =
        this.bypassMix === 0
          ? this.gainValue
          : this.gainValue * (1 - this.bypassMix) + this.bypassMix
    }
  }

  /**
   * Duck `signal` by the key into `output` (channel arrays; `output` may be
   * `signal` for in-place processing). Output channels beyond the signal's
   * channel count repeat its last channel; an empty signal renders silence.
   */
  process(
    signal: readonly Float32Array[],
    key: readonly Float32Array[],
    output: Float32Array[],
    frames: number,
  ): void {
    if (this.gains.length < frames) this.gains = new Float32Array(frames)
    const gains = this.gains
    this.renderGain(key, gains, frames)
    // Highest channel first: an output channel that repeats the signal's last
    // channel is written before that channel is ducked in place.
    for (let channel = output.length - 1; channel >= 0; channel -= 1) {
      const out = output[channel]
      const input = signal[Math.min(channel, signal.length - 1)]
      if (!input) {
        out.fill(0, 0, frames)
        continue
      }
      for (let i = 0; i < frames; i += 1) out[i] = input[i] * gains[i]
    }
  }

  private coefficientForMs(ms: number): number {
    return 1 - Math.exp(-1000 / (ms * this.sampleRate))
  }

  /** Average the key channels into the reusable mono buffer (zeros when unkeyed). */
  private mixKey(key: readonly Float32Array[], frames: number): Float32Array {
    if (this.keyMono.length < frames) this.keyMono = new Float32Array(frames)
    const mono = this.keyMono
    if (key.length === 0) {
      mono.fill(0, 0, frames)
    } else if (key.length === 1) {
      const only = key[0]
      for (let i = 0; i < frames; i += 1) mono[i] = only[i]
    } else {
      const inverse = 1 / key.length
      mono.fill(0, 0, frames)
      for (const channel of key) {
        for (let i = 0; i < frames; i += 1) mono[i] += channel[i]
      }
      for (let i = 0; i < frames; i += 1) mono[i] *= inverse
    }
    return mono
  }

  /** Recompute the running sum once per window pass so float drift never accumulates. */
  private resyncWindow(): void {
    let sum = 0
    for (const square of this.squares) sum += square
    this.sumSquares = sum
  }
}
