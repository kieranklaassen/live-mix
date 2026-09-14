// Equal-power crossfade curves for `AudioParam.setValueCurveAtTime`. A fade-out
// and fade-in of the same length sum to constant power (sin² + cos² = 1), so
// two overlapping clips never dip or bump in loudness at the seam.

/** Sample count Breathwork Live hands to `setValueCurveAtTime`. */
export const EQUAL_POWER_CURVE_LENGTH = 64

/** 0 → 1 along a quarter sine. */
export function equalPowerFadeIn(length: number = EQUAL_POWER_CURVE_LENGTH): Float32Array {
  const curve = new Float32Array(length)
  for (let i = 0; i < length; i += 1) {
    curve[i] = Math.sin(((i / (length - 1)) * Math.PI) / 2)
  }
  return curve
}

/** 1 → 0 along a quarter cosine. */
export function equalPowerFadeOut(length: number = EQUAL_POWER_CURVE_LENGTH): Float32Array {
  const curve = new Float32Array(length)
  for (let i = 0; i < length; i += 1) {
    curve[i] = Math.cos(((i / (length - 1)) * Math.PI) / 2)
  }
  return curve
}
