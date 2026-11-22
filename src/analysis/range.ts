// Loudness range as EBU Tech 3342 defines it, from short-term loudness
// values: those under -70 LUFS are left out, then those more than 20 LU
// under the mean of the rest, and the range is the span from the 10th to the
// 95th percentile of what remains.

import { ABSOLUTE_GATE_LUFS } from '../core/analysis/loudness'

/** How far under the mean of the gated values a value may lie and still count. */
const RELATIVE_GATE_LU = -20
const LOW_PERCENTILE = 0.1
const HIGH_PERCENTILE = 0.95

/**
 * The loudness range, in LU, of short-term loudness values in LUFS taken at
 * an even step of a second or less. Null when none of them reaches -70 LUFS.
 */
export function loudnessRange(shortTermLufs: readonly number[]): number | null {
  const loud = shortTermLufs.filter((value) => value >= ABSOLUTE_GATE_LUFS)
  if (loud.length === 0) return null
  // The mean is of the values as powers. Their fixed offset in LUFS cancels.
  let power = 0
  for (const value of loud) power += 10 ** (value / 10)
  const gate = 10 * Math.log10(power / loud.length) + RELATIVE_GATE_LU
  const kept = loud.filter((value) => value >= gate).sort((a, b) => a - b)
  const at = (share: number) => kept[Math.round((kept.length - 1) * share)]
  return at(HIGH_PERCENTILE) - at(LOW_PERCENTILE)
}
