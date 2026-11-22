// What the measuring tests share: sound made the same way every run, whose
// figures follow from how it was made.

import type { Measurement } from '../types'

/** A level in dB as a gain. */
export function gainOf(db: number): number {
  return 10 ** (db / 20)
}

/** A sine of `hz` at `sampleRate`, `peak` at its crests. */
export function sine(
  seconds: number,
  hz: number,
  sampleRate: number,
  peak: number,
  phase = 0,
): Float32Array {
  const out = new Float32Array(Math.round(seconds * sampleRate))
  for (let i = 0; i < out.length; i += 1) {
    out[i] = peak * Math.sin((2 * Math.PI * hz * i) / sampleRate + phase)
  }
  return out
}

/** One sound after another. */
export function joined(...parts: Float32Array[]): Float32Array {
  const out = new Float32Array(parts.reduce((frames, part) => frames + part.length, 0))
  let at = 0
  for (const part of parts) {
    out.set(part, at)
    at += part.length
  }
  return out
}

/** The sum of two sounds of one length, the second times `sign`. */
export function added(a: Float32Array, b: Float32Array, sign = 1): Float32Array {
  const out = new Float32Array(a.length)
  for (let i = 0; i < out.length; i += 1) out[i] = a[i] + sign * b[i]
  return out
}

/** White noise between -peak and peak, the same for the same seed (mulberry32). */
export function whiteNoise(frames: number, seed: number, peak = 0.5): Float32Array {
  const out = new Float32Array(frames)
  let state = seed >>> 0
  for (let i = 0; i < frames; i += 1) {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    out[i] = peak * (((t ^ (t >>> 14)) >>> 0) / 2147483648 - 1)
  }
  return out
}

/** A second-order filter run over `signal` in place, its coefficients already divided by a0. */
function filter(signal: Float32Array, b: [number, number, number], a: [number, number]): void {
  let x1 = 0
  let x2 = 0
  let y1 = 0
  let y2 = 0
  for (let i = 0; i < signal.length; i += 1) {
    const x = signal[i]
    const y = b[0] * x + b[1] * x1 + b[2] * x2 - a[0] * y1 - a[1] * y2
    x2 = x1
    x1 = x
    y2 = y1
    y1 = y
    signal[i] = y
  }
}

/** A second-order high-pass or low-pass at `hz`, with no peak at its corner. */
function pass(signal: Float32Array, kind: 'high' | 'low', hz: number, sampleRate: number): void {
  const w = (2 * Math.PI * hz) / sampleRate
  const cos = Math.cos(w)
  const alpha = Math.sin(w) / (2 * Math.SQRT1_2)
  const a0 = 1 + alpha
  const edge = kind === 'high' ? (1 + cos) / 2 : (1 - cos) / 2
  const middle = kind === 'high' ? -(1 + cos) : 1 - cos
  filter(signal, [edge / a0, middle / a0, edge / a0], [(-2 * cos) / a0, (1 - alpha) / a0])
}

/**
 * Pink noise held between 40 Hz and 12 kHz: white noise through a filter that
 * falls 3 dB an octave, then twice through a high-pass at 40 Hz and twice
 * through a low-pass at 12 kHz, so next to none of it lies under 20 Hz or
 * over 20 kHz.
 */
export function pinkNoise(frames: number, sampleRate: number, seed: number): Float32Array {
  const out = whiteNoise(frames, seed, 1)
  let b0 = 0
  let b1 = 0
  let b2 = 0
  for (let i = 0; i < frames; i += 1) {
    const white = out[i]
    b0 = 0.99765 * b0 + white * 0.099046
    b1 = 0.963 * b1 + white * 0.2965164
    b2 = 0.57 * b2 + white * 1.0526913
    out[i] = (b0 + b1 + b2 + white * 0.1848) * 0.1
  }
  pass(out, 'high', 40, sampleRate)
  pass(out, 'high', 40, sampleRate)
  pass(out, 'low', 12000, sampleRate)
  pass(out, 'low', 12000, sampleRate)
  return out
}

/** The mean level of a sound in dB under full scale, the mean square over every channel. */
export function meanLevelDb(channels: readonly Float32Array[]): number {
  let sum = 0
  let count = 0
  for (const channel of channels) {
    for (const sample of channel) sum += sample * sample
    count += channel.length
  }
  return 10 * Math.log10(sum / count)
}

/** A band's level as a power, 0 for a null. */
export function powerOf(db: number | null): number {
  return db === null ? 0 : 10 ** (db / 10)
}

/** How much of the seven bands' power lies in band `index`, from 0 to 1. */
export function shareOfBand(result: Measurement, index: number): number {
  const total = result.bands.reduce((sum, band) => sum + powerOf(band.levelDbfs), 0)
  return powerOf(result.bands[index].levelDbfs) / total
}

/** The seven bands' levels added as powers, in dB. */
export function bandsTotalDb(result: Measurement): number {
  return 10 * Math.log10(result.bands.reduce((sum, band) => sum + powerOf(band.levelDbfs), 0))
}
