// The audio-thread gate's DSP, as a plain class over Float32Array blocks so it
// runs identically inside the worklet (gate.processor.ts) and in offline
// tests. Per sample: a peak detector over the loudest channel (it rises at
// once and falls in 10 ms), an open/closed state with hysteresis and a hold,
// and a one-pole gain that rises with the attack toward unity while the gate
// is open and falls with the release toward the range while it is closed.
// The gain multiplies every channel alike, so the stereo image never moves.
// No look-ahead: the gate holds nothing back, and its latency is zero.
// Nothing allocates in `process` after the first block of a given size.

import { clampParam } from '../../params'
import {
  GATE_BYPASS_RAMP_SECONDS,
  GATE_DETECTOR_RELEASE_MS,
  GATE_PARAMS,
  type GateParamName,
} from './gate-abi'

const dbToLinear = (db: number): number => Math.pow(10, db / 20)

/** Detector values below this are flushed to zero (−200 dB): denormal guard. */
const LEVEL_FLOOR = 1e-10

export class GateKernel {
  readonly sampleRate: number
  private levelValue = 0
  private gainValue: number
  private openLevel = 0
  private closeLevel = 0
  private floorGain = 0
  private open = false
  private holdLeft = 0
  private holdSamples = 0
  private attackCoef = 0
  private releaseCoef = 0
  private readonly detectorCoef: number
  private readonly values = new Map<GateParamName, number>()
  private bypassMix = 0
  private bypassTarget = 0
  private readonly bypassStep: number
  private gains = new Float32Array(0)

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate
    this.detectorCoef = Math.exp(-1000 / (GATE_DETECTOR_RELEASE_MS * sampleRate))
    this.bypassStep = 1 / Math.max(1, GATE_BYPASS_RAMP_SECONDS * sampleRate)
    for (const name of Object.keys(GATE_PARAMS) as GateParamName[]) {
      this.setParam(name, GATE_PARAMS[name].default)
    }
    // Starts closed: the room before the first word is already turned down.
    this.gainValue = this.floorGain
  }

  /** Current detector value (linear peak). */
  get level(): number {
    return this.levelValue
  }

  /** Current gain (before the bypass crossfade): 1 open, the range's gain closed. */
  get gain(): number {
    return this.gainValue
  }

  /** Whether the gate is open (or holding). */
  get isOpen(): boolean {
    return this.open
  }

  /** Set a parameter by name; the value is clamped to its spec. */
  setParam(name: GateParamName, value: number): void {
    const clamped = clampParam(GATE_PARAMS[name], value)
    this.values.set(name, clamped)
    switch (name) {
      case 'threshold':
      case 'hysteresis':
        this.openLevel = dbToLinear(this.getParam('threshold'))
        this.closeLevel = dbToLinear(this.getParam('threshold') - this.getParam('hysteresis'))
        break
      case 'range':
        this.floorGain = clamped <= GATE_PARAMS.range.min ? 0 : dbToLinear(clamped)
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
      default: {
        const unhandled: never = name
        throw new Error(`live-mix: unknown gate parameter ${String(unhandled)}`)
      }
    }
  }

  getParam(name: GateParamName): number {
    return this.values.get(name) ?? GATE_PARAMS[name].default
  }

  get bypass(): boolean {
    return this.bypassTarget === 1
  }

  /** Click-free bypass: the gain crossfades to unity over 5 ms; the detector keeps running. */
  set bypass(enabled: boolean) {
    this.bypassTarget = enabled ? 1 : 0
  }

  /** Clear the detector and close the gate (not the parameters). */
  reset(): void {
    this.levelValue = 0
    this.open = false
    this.holdLeft = 0
    this.gainValue = this.floorGain
  }

  /**
   * Gate `signal` into `output` (channel arrays; `output` may be `signal` for
   * in-place processing). Output channels beyond the signal's channel count
   * repeat its last channel; an empty signal renders silence.
   */
  process(signal: readonly Float32Array[], output: Float32Array[], frames: number): void {
    if (this.gains.length < frames) this.gains = new Float32Array(frames)
    const gains = this.gains
    for (let i = 0; i < frames; i += 1) {
      let peak = 0
      for (const channel of signal) {
        const sample = Math.abs(channel[i])
        if (sample > peak) peak = sample
      }
      this.levelValue = peak > this.levelValue ? peak : this.levelValue * this.detectorCoef
      if (this.levelValue < LEVEL_FLOOR) this.levelValue = 0

      if (this.levelValue >= this.openLevel) {
        this.open = true
        this.holdLeft = this.holdSamples
      } else if (this.open && this.levelValue < this.closeLevel) {
        if (this.holdLeft > 0) this.holdLeft -= 1
        else this.open = false
      }

      const target = this.open ? 1 : this.floorGain
      this.gainValue +=
        (target - this.gainValue) * (target > this.gainValue ? this.attackCoef : this.releaseCoef)

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
    // Highest channel first: an output channel that repeats the signal's last
    // channel is written before that channel is gated in place.
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
}
