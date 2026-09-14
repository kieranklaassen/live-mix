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
