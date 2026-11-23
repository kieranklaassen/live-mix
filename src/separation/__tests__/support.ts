// What the separation tests share: sound made the same way every run, a
// separator of plain arithmetic, and the measures a null is read with.

import { STEM_NAMES, type Channels, type Separation, type Separator } from '../types'

/** Noise between -0.5 and 0.5, the same for the same seed. */
export function noise(length: number, seed = 0x1234_5678): Float32Array {
  const out = new Float32Array(length)
  let state = seed >>> 0
  for (let i = 0; i < length; i += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    out[i] = state / 4294967296 - 0.5
  }
  return out
}

/** A sine of `hz` at `sampleRate`, `level` at its peaks. */
export function sine(length: number, hz: number, sampleRate: number, level = 0.5): Float32Array {
  const out = new Float32Array(length)
  for (let i = 0; i < length; i += 1) out[i] = level * Math.sin((2 * Math.PI * hz * i) / sampleRate)
  return out
}

/** The largest sample of `a` minus `b` over the frames `from` up to `to`, in dB under full scale; -Infinity for none. */
export function differenceDb(
  a: ArrayLike<number>,
  b: ArrayLike<number>,
  from = 0,
  to = Math.min(a.length, b.length),
): number {
  let largest = 0
  for (let i = from; i < to; i += 1) largest = Math.max(largest, Math.abs(a[i] - b[i]))
  return 20 * Math.log10(largest)
}

export function peak(channel: Float32Array): number {
  let largest = 0
  for (const sample of channel) largest = Math.max(largest, Math.abs(sample))
  return largest
}

export const scaled = (channels: Channels, gain: number): Channels =>
  channels.map((channel) => channel.map((sample) => sample * gain))

/**
 * A separator that answers each stem of `gains` as the track times that
 * stem's gain. It says no stems of its own, as a separator of the four may.
 */
export function byGains<Name extends string>(
  gains: Record<Name, number>,
  sampleRate = 44100,
  seen: Channels[] = [],
): Separator<Name> {
  const names = Object.keys(gains) as Name[]
  return {
    sampleRate,
    separate: (channels) => {
      seen.push(channels)
      const stems = {} as Record<Name, Channels>
      for (const name of names) stems[name] = scaled(channels, gains[name])
      return Promise.resolve(stems)
    },
  }
}

/** The same separator, saying its stems: the names of `gains` in the order they are written. */
export function naming<Name extends string>(
  gains: Record<Name, number>,
  sampleRate = 44100,
  seen: Channels[] = [],
): Separator<Name> {
  return { ...byGains(gains, sampleRate, seen), stems: Object.keys(gains) as Name[] }
}

/** A separation's parts added up as a mixer adds them, in single precision: its stems in order, then its remainder. */
export function summed<Name extends string>(
  separation: Separation<Name>,
  channel: number,
  leaveOut?: Name,
): Float32Array {
  const names = (separation.names ?? STEM_NAMES) as readonly Name[]
  const stems = names.filter((name) => name !== leaveOut).map((name) => separation.stems[name])
  const out = new Float32Array(separation.remainder[channel].length)
  for (const part of [...stems, separation.remainder]) {
    for (let i = 0; i < out.length; i += 1) out[i] += part[channel][i]
  }
  return out
}
