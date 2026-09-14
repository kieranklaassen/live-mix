// Convolution reverb on a ConvolverNode. The `hall` preset is Breathwork
// Live's voiceReverb.ts lifted verbatim: a generated impulse response
// (exponentially decaying noise, 2.6 s) into a quiet wet gain, so the coach's
// voice sits in a room instead of dry on top of the music. Use it on a
// ReturnTrack fed by sends; the dry path stays the caller's own.

import { Emitter } from '../../events'
import { clampParam, type ParamSpec } from '../../params'
import { type DeviceChange, type DeviceChangeListener, type ObservableDevice } from '../Device'
import { type DeviceCreateOptions, type DeviceDescriptor } from '../registry'

/** Voice hall reverb: impulse-response decay length (seconds). */
export const REVERB_DECAY_SECONDS = 2.6
/** Voice hall reverb: wet-send level (dry voice stays at full level). */
export const REVERB_WET_LEVEL = 0.26

export const CONVOLVER_REVERB_PARAMS = {
  wet: { id: 0, name: 'Wet', min: 0, max: 1, default: REVERB_WET_LEVEL, taper: 'linear', unit: '' },
} as const satisfies Record<string, ParamSpec>

export interface ConvolverReverbOptions extends DeviceCreateOptions {
  /** Use the given impulse response instead of the generated hall. */
  impulse?: AudioBuffer
  /** IR length for the generated preset. Default 2.6 s. */
  decaySeconds?: number
  /** Initial wet level. Default 0.26. */
  wet?: number
  /** Ramp for later wet changes, seconds. Default 0.02. */
  rampSeconds?: number
  /** Noise source for the generated IR (tests); defaults to Math.random. */
  random?: () => number
}

/**
 * Exponentially decaying noise — a soft, neutral hall tail. Verbatim from
 * Breathwork Live `createHallReverb`.
 */
export function generateHallImpulse(
  ctx: BaseAudioContext,
  decaySeconds = REVERB_DECAY_SECONDS,
  random: () => number = Math.random,
): AudioBuffer {
  const rate = ctx.sampleRate
  const length = Math.max(1, Math.floor(decaySeconds * rate))
  const impulse = ctx.createBuffer(2, length, rate)
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel)
    for (let i = 0; i < length; i += 1) {
      data[i] = (random() * 2 - 1) * (1 - i / length) ** 2.5
    }
  }
  return impulse
}

export class ConvolverReverb implements ObservableDevice {
  readonly id = 'convolver-reverb'
  readonly params = CONVOLVER_REVERB_PARAMS
  readonly convolver: ConvolverNode
  readonly wetGain: GainNode
  readonly latencySec = 0
  private readonly ctx: BaseAudioContext
  private readonly rampSeconds: number
  private wet: number
  private readonly changes = new Emitter<DeviceChange>()
  private bypassed = false
  private disposed = false

  constructor(ctx: BaseAudioContext, options: ConvolverReverbOptions = {}) {
    this.ctx = ctx
    this.rampSeconds = options.rampSeconds ?? 0.02
    this.wet = clampParam(
      CONVOLVER_REVERB_PARAMS.wet,
      options.params?.wet ?? options.wet ?? REVERB_WET_LEVEL,
    )
    this.convolver = ctx.createConvolver()
    this.convolver.buffer =
      options.impulse ?? generateHallImpulse(ctx, options.decaySeconds, options.random)
    this.wetGain = ctx.createGain()
    this.wetGain.gain.value = this.wet
    this.convolver.connect(this.wetGain)
  }

  get input(): AudioNode {
    return this.convolver
  }

  get output(): AudioNode {
    return this.wetGain
  }

  setParam(name: string, value: number): void {
    if (name !== 'wet') throw new Error(`live-mix: convolver-reverb has no parameter "${name}"`)
    this.wet = clampParam(CONVOLVER_REVERB_PARAMS.wet, value)
    if (!this.bypassed) this.rampWetTo(this.wet)
    this.changes.emit({ type: 'param', name, value: this.wet })
  }

  getParam(name: string): number {
    if (name !== 'wet') throw new Error(`live-mix: convolver-reverb has no parameter "${name}"`)
    return this.wet
  }

  /** Bypass mutes the wet path with a ramp; the tail keeps rendering underneath. */
  get bypass(): boolean {
    return this.bypassed
  }

  set bypass(enabled: boolean) {
    if (this.bypassed === enabled) return
    this.bypassed = enabled
    this.rampWetTo(enabled ? 0 : this.wet)
    this.changes.emit({ type: 'bypass', bypass: enabled })
  }

  /** Called after every `setParam` and bypass change; returns the unsubscribe function. */
  onChange(listener: DeviceChangeListener): () => void {
    return this.changes.subscribe(listener)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.changes.clear()
    try {
      this.convolver.disconnect()
      this.wetGain.disconnect()
    } catch {
      // Context already closed; ignore.
    }
  }

  private rampWetTo(value: number): void {
    const at = this.ctx.currentTime
    this.wetGain.gain.setTargetAtTime(value, at, this.rampSeconds)
  }
}

export function createConvolverReverb(
  ctx: BaseAudioContext,
  options: ConvolverReverbOptions = {},
): ConvolverReverb {
  return new ConvolverReverb(ctx, options)
}

export const CONVOLVER_REVERB_DESCRIPTOR: DeviceDescriptor<typeof CONVOLVER_REVERB_PARAMS> = {
  id: 'convolver-reverb',
  name: 'Convolver reverb',
  kind: 'node',
  category: 'reverb',
  version: 1,
  params: CONVOLVER_REVERB_PARAMS,
  presets: {
    Hall: { wet: REVERB_WET_LEVEL },
    Whisper: { wet: 0.12 },
    Wash: { wet: 0.5 },
  },
  create: createConvolverReverb,
}
