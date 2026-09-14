// Modulation sources (R14). Every source yields a normalised 0..1 value for a
// moment on the audio clock; `ModMatrix` scales that onto a parameter with
// depth and polarity. All of them evaluate deterministically offline — the
// LFO and the random source are pure functions of time, the envelope follower
// a pure function of the levels fed to it — so tests assert exact curves and
// the UI can draw the same value the audio uses (R33).

/** A modulation source: a normalised 0..1 value at `timeSec` on the audio clock. */
export interface ModSource {
  valueAtTime(timeSec: number): number
}

export type LfoShape = 'sine' | 'triangle' | 'saw' | 'square'

function fract(value: number): number {
  return value - Math.floor(value)
}

/**
 * The 0..1 waveform at `phase` (cycles). `sine` is Tides' `breathMod`
 * (`sin(2π·phase)·0.5 + 0.5`); the other shapes start at the same point of the
 * cycle so swapping shape keeps the peak at phase 0.25 and the trough at 0.75.
 */
export function lfoWaveform(shape: LfoShape, phase: number): number {
  switch (shape) {
    case 'sine':
      return Math.sin(phase * Math.PI * 2) * 0.5 + 0.5
    case 'triangle': {
      const p = fract(phase)
      if (p < 0.25) return 0.5 + 2 * p
      if (p < 0.75) return 1.5 - 2 * p
      return 2 * p - 1.5
    }
    case 'saw':
      return fract(phase)
    case 'square':
      return fract(phase) < 0.5 ? 1 : 0
    default: {
      const exhaustive: never = shape
      return exhaustive
    }
  }
}

/**
 * Tides' breathing law (`kkfonie/Tides/Source/PluginProcessor.cpp:332-333`):
 * `modAmount = 1 − depth·(1 − breathMod)`. At depth 1 it is the waveform
 * itself; at depth 0 it is a constant 1. Also `fdnReverbBreathLaw` in
 * `./dsp`, which the FdnReverb device runs in C++.
 */
export function breathLaw(breathMod: number, depth: number): number {
  return 1 - depth * (1 - breathMod)
}

export interface PhaseModulatorOptions {
  /** 0..1 modulation depth in the breathing law; 1 yields the raw waveform. */
  depth?: number
  shape?: LfoShape
}

/** Shared by `Lfo` and `ExternalPhase`: the law that turns a phase into a value. */
abstract class PhaseModulator implements ModSource {
  depth: number
  shape: LfoShape

  protected constructor(options: PhaseModulatorOptions) {
    this.depth = options.depth ?? 1
    this.shape = options.shape ?? 'sine'
  }

  /** The DSP law at `phase` (cycles): `breathLaw(lfoWaveform(shape, phase), depth)`. */
  valueAt(phase: number): number {
    return breathLaw(lfoWaveform(this.shape, phase), this.depth)
  }

  abstract phaseAt(timeSec: number): number

  valueAtTime(timeSec: number): number {
    return this.valueAt(this.phaseAt(timeSec))
  }
}

export interface LfoOptions extends PhaseModulatorOptions {
  rateHz?: number
  /** Phase (cycles) at `startSec`. */
  phase?: number
  startSec?: number
}

/**
 * A free-running LFO on the audio clock. Phase is a function of time alone —
 * nothing in the library resets it from audio input (the Tides rule) — and
 * rate changes re-anchor so the phase stays continuous.
 */
export class Lfo extends PhaseModulator {
  private rate: number
  private anchorPhase: number
  private anchorSec: number

  constructor(options: LfoOptions = {}) {
    super(options)
    this.rate = options.rateHz ?? 0.3
    this.anchorPhase = fract(options.phase ?? 0)
    this.anchorSec = options.startSec ?? 0
  }

  get rateHz(): number {
    return this.rate
  }

  /** Change the rate at `atSec` without a phase jump. */
  setRate(rateHz: number, atSec: number): void {
    this.anchorPhase = this.phaseAt(atSec)
    this.anchorSec = atSec
    this.rate = rateHz
  }

  /**
   * Explicit re-sync by the user or the transport (e.g. "retrigger on play").
   * Never wire this to an onset detector: the LFO must run freely.
   */
  setPhase(phase: number, atSec: number): void {
    this.anchorPhase = fract(phase)
    this.anchorSec = atSec
  }

  /** Phase in cycles, wrapped to [0, 1). */
  phaseAt(timeSec: number): number {
    return fract(this.anchorPhase + (timeSec - this.anchorSec) * this.rate)
  }
}

export interface ExternalPhaseOptions extends PhaseModulatorOptions {
  /** Added to every incoming phase; −0.25 makes a sine start at its trough. */
  phaseOffset?: number
  phase?: number
}

/**
 * A phase driven from outside — the breath guide's inhale/exhale progress, a
 * conductor, a hand on a wheel. Holds the last phase it was given.
 */
export class ExternalPhase extends PhaseModulator {
  phaseOffset: number
  private phase: number

  constructor(options: ExternalPhaseOptions = {}) {
    super(options)
    this.phaseOffset = options.phaseOffset ?? 0
    this.phase = fract(options.phase ?? 0)
  }

  /** Current phase in cycles, without the offset. */
  get currentPhase(): number {
    return this.phase
  }

  setPhase(phase: number): void {
    if (Number.isFinite(phase)) this.phase = fract(phase)
  }

  phaseAt(_timeSec: number): number {
    return fract(this.phase + this.phaseOffset)
  }
}

export interface EnvelopeFollowerOptions {
  attackSec?: number
  releaseSec?: number
}

/**
 * One-pole attack/release follower. Fed either with level readings at control
 * rate (`push`, a meter's peak or RMS) or with audio blocks offline
 * (`process`); both integrate the same equation, so a constant level lands on
 * the same envelope whichever way it arrives. Holds between pushes.
 */
export class EnvelopeFollower implements ModSource {
  attackSec: number
  releaseSec: number
  private envelope = 0
  private lastSec: number | null = null

  constructor(options: EnvelopeFollowerOptions = {}) {
    this.attackSec = options.attackSec ?? 0.01
    this.releaseSec = options.releaseSec ?? 0.2
  }

  /** Feed a 0..1 level observed at `timeSec`; returns the new envelope. */
  push(level: number, timeSec: number): number {
    const target = Math.abs(level)
    const dtSec = this.lastSec === null ? 0 : Math.max(0, timeSec - this.lastSec)
    this.lastSec = timeSec
    this.envelope = this.step(target, dtSec)
    return this.envelope
  }

  /** Per-sample follower over a block; the envelope per sample is returned. */
  process(block: Float32Array, sampleRate: number, out?: Float32Array): Float32Array {
    const result = out ?? new Float32Array(block.length)
    const dtSec = 1 / sampleRate
    for (let i = 0; i < block.length; i += 1) {
      this.envelope = this.step(Math.abs(block[i]), dtSec)
      result[i] = this.envelope
    }
    if (this.lastSec !== null) this.lastSec += block.length * dtSec
    return result
  }

  valueAtTime(_timeSec: number): number {
    return this.envelope
  }

  reset(): void {
    this.envelope = 0
    this.lastSec = null
  }

  private step(target: number, dtSec: number): number {
    const tau = target > this.envelope ? this.attackSec : this.releaseSec
    if (tau <= 0) return target
    const coefficient = Math.exp(-dtSec / tau)
    return target + (this.envelope - target) * coefficient
  }
}

export interface RandomOptions {
  /** New value this many times per second. */
  rateHz?: number
  seed?: number
  /** Glide linearly to the next value instead of stepping. */
  smooth?: boolean
}

/** murmur3's finaliser over (seed, index): a repeatable 0..1 per step. */
function hashToUnit(seed: number, index: number): number {
  let h = (seed ^ Math.imul(index, 0x9e3779b9)) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0
  h = (h ^ (h >>> 16)) >>> 0
  return h / 4294967296
}

/**
 * Sample-and-hold noise: a seeded value per step of `1/rateHz` seconds, held
 * (or glided to) until the next. A pure function of time, so a bounce and a
 * live pass see the same sequence.
 */
export class Random implements ModSource {
  rateHz: number
  seed: number
  smooth: boolean

  constructor(options: RandomOptions = {}) {
    this.rateHz = options.rateHz ?? 1
    this.seed = options.seed ?? 1
    this.smooth = options.smooth ?? false
  }

  /** The held value of step `index`. */
  valueOfStep(index: number): number {
    return hashToUnit(this.seed >>> 0, index)
  }

  valueAtTime(timeSec: number): number {
    const position = timeSec * this.rateHz
    const index = Math.floor(position)
    const current = this.valueOfStep(index)
    if (!this.smooth) return current
    const next = this.valueOfStep(index + 1)
    return current + (next - current) * (position - index)
  }
}

/** A hand-set 0..1 control that many routes can share. */
export class Macro implements ModSource {
  private current: number

  constructor(value = 0) {
    this.current = clampUnit(value)
  }

  get value(): number {
    return this.current
  }

  set(value: number): void {
    this.current = clampUnit(value)
  }

  valueAtTime(_timeSec: number): number {
    return this.current
  }
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

/** Sample a source on a fixed grid from `fromSec` — the offline curve. */
export function renderModulator(
  source: ModSource,
  fromSec: number,
  durationSec: number,
  sampleRate: number,
): Float32Array {
  const length = Math.max(0, Math.round(durationSec * sampleRate))
  const out = new Float32Array(length)
  for (let i = 0; i < length; i += 1) out[i] = source.valueAtTime(fromSec + i / sampleRate)
  return out
}
