// Unit conversions shared by the node devices (and anything else that maps a
// dB parameter onto a GainNode).

/** Decibels → linear amplitude. `dbToGain(0) === 1`, `dbToGain(-6) ≈ 0.501`. */
export function dbToGain(db: number): number {
  return Math.pow(10, db / 20)
}

/** Linear amplitude → decibels; silence reports `-Infinity`. */
export function gainToDb(gain: number): number {
  return gain > 0 ? 20 * Math.log10(gain) : -Infinity
}

/**
 * A low-pass or high-pass's Q as a `BiquadFilterNode` takes it. For those two
 * types the node reads its `Q` in decibels (the height of the peak at the
 * corner), where every other type reads a plain number: `cutQDb(1) === 0`,
 * and a Q of 2 is 6.02.
 */
export function cutQDb(q: number): number {
  return 20 * Math.log10(q)
}

/**
 * The Q of a cut that is flat up to its corner and 3.01 dB down at it
 * (Butterworth): √½ as a number, about −3.01 as the node takes it. Written as
 * the number, the node reads a 0.7 dB resonance and the cut stands 1.7 dB
 * proud over its corner.
 */
export const FLAT_CUT_Q_DB = cutQDb(Math.SQRT1_2)
