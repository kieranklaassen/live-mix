// Sidechain ducker, Phase 0 (KTD7): Breathwork Live's main-thread envelope
// follower moved into a component with identical constants and identical
// `setTargetAtTime` writes, so the recorded-event harness stays green. An
// AnalyserNode taps the key signal; a timer polls its RMS, follows it with an
// asymmetric one-pole (fast attack, slow release) and drives the target
// AudioParam — the duck bus gain — toward `1 - min(env·scale, 1)·depth`.
// U17 replaces the poll with an audio-thread worklet using the same defaults.

import { type Clock, type IntervalId } from '../../clock'

/** Duck depth at full envelope: 0.68 ≈ -10 dB (deepened per listener feedback). */
export const DUCK_DEPTH = 0.68
/** setTargetAtTime time constant for duck gain moves. */
export const DUCK_TIME_CONSTANT = 0.08
/** Envelope follower attack time constant (ms) — fast when voice rises. */
export const ENV_ATTACK_MS = 80
/** Envelope follower release time constant (ms) — slow when voice falls. */
export const ENV_RELEASE_MS = 800
/** Envelope follower poll interval (ms). */
export const ENV_POLL_MS = 60
/** RMS → duck drive scale (k in `1 - min(env*k, 1) * DUCK_DEPTH`). */
export const ENV_GAIN_SCALE = 4
/** Analyser window for the key tap. */
export const DUCK_KEY_FFT_SIZE = 256

export interface DuckerOptions {
  /** The AudioParam to duck (normally a bus fader). */
  target: AudioParam
  /** Clock and timers (the engine clock). */
  clock: Clock
  depth?: number
  timeConstant?: number
  attackMs?: number
  releaseMs?: number
  pollMs?: number
  gainScale?: number
  fftSize?: number
}

export class Ducker {
  readonly depth: number
  readonly timeConstant: number
  readonly attackMs: number
  readonly releaseMs: number
  readonly pollMs: number
  readonly gainScale: number
  readonly fftSize: number
  private readonly ctx: BaseAudioContext
  private readonly target: AudioParam
  private readonly clock: Clock
  private analyser: AnalyserNode | null = null
  private pollId: IntervalId | null = null
  /** Reused between polls to avoid a fresh allocation every poll. */
  private samples = new Float32Array(0)
  private envelopeValue = 0
  private stopped = false

  constructor(ctx: BaseAudioContext, options: DuckerOptions) {
    this.ctx = ctx
    this.target = options.target
    this.clock = options.clock
    this.depth = options.depth ?? DUCK_DEPTH
    this.timeConstant = options.timeConstant ?? DUCK_TIME_CONSTANT
    this.attackMs = options.attackMs ?? ENV_ATTACK_MS
    this.releaseMs = options.releaseMs ?? ENV_RELEASE_MS
    this.pollMs = options.pollMs ?? ENV_POLL_MS
    this.gainScale = options.gainScale ?? ENV_GAIN_SCALE
    this.fftSize = options.fftSize ?? DUCK_KEY_FFT_SIZE
  }

  /** The analyser tapping the current key, or null before `key()`. */
  get keyAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  /** Current follower value (RMS domain). */
  get envelope(): number {
    return this.envelopeValue
  }

  /**
   * Tap `node` as the sidechain key. A re-key drops the previous analyser and
   * taps the new node; the poll keeps running across re-keys.
   */
  key(node: AudioNode): void {
    this.analyser?.disconnect()
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = this.fftSize
    if (this.samples.length !== this.analyser.fftSize) {
      this.samples = new Float32Array(this.analyser.fftSize)
    }
    node.connect(this.analyser)

    if (this.pollId === null && !this.stopped) {
      this.pollId = this.clock.setIntervalFn(() => this.poll(), this.pollMs)
    }
  }

  /** Stop following; the target keeps its last commanded value. */
  unkey(): void {
    this.analyser?.disconnect()
    this.analyser = null
  }

  /** One follower step: read the key RMS and move the target. Runs on the poll. */
  poll(): void {
    if (!this.analyser || this.stopped) return
    const samples = this.samples
    this.analyser.getFloatTimeDomainData(samples)
    let sum = 0
    for (const sample of samples) sum += sample * sample
    const rms = Math.sqrt(sum / samples.length)

    const tau = rms > this.envelopeValue ? this.attackMs : this.releaseMs
    const alpha = 1 - Math.exp(-this.pollMs / tau)
    this.envelopeValue += (rms - this.envelopeValue) * alpha

    const target = 1 - Math.min(this.envelopeValue * this.gainScale, 1) * this.depth
    this.target.setTargetAtTime(target, this.clock.now(), this.timeConstant)
  }

  /** Stop the poll for good (engine stop). */
  stop(): void {
    this.stopped = true
    if (this.pollId !== null) this.clock.clearIntervalFn(this.pollId)
    this.pollId = null
  }

  dispose(): void {
    this.stop()
    this.unkey()
  }
}

export function createDucker(ctx: BaseAudioContext, options: DuckerOptions): Ducker {
  return new Ducker(ctx, options)
}
