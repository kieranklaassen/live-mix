// What the separation tests share: sound made the same way every run, and
// the measures a null is read with.

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
