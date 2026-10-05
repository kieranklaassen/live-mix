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

/**
 * A clip's equal-power envelope on `param`: silent at `startAt`, up over
 * `fadeInSec`, down over `fadeOutSec` to end at `startAt + durationSec`
 * (Breathwork Live's `scheduleEntry`, event for event, where both fades have
 * a length and fit in the clip).
 *
 * A browser refuses a curve of no length (RangeError) and one laid over
 * another (NotSupportedError), and thrown while a voice is being made either
 * stops the scheduler's tick. So with no fade-in the level is 1 from
 * `startAt`, with no fade-out it stays there, and fades longer than the clip
 * keep the fade-in and give the fade-out what is left, as the linear
 * envelope does.
 */
export function writeEqualPowerEnvelope(
  param: AudioParam,
  startAt: number,
  durationSec: number,
  fadeInSec: number,
  fadeOutSec: number,
): void {
  const inSec = Math.min(fadeInSec, durationSec)
  if (inSec > 0) {
    param.setValueAtTime(0, startAt)
    param.setValueCurveAtTime(equalPowerFadeIn(), startAt, inSec)
  } else {
    param.setValueAtTime(1, startAt)
  }
  if (!(fadeOutSec > 0)) return
  const fadeInEnd = inSec > 0 ? startAt + inSec : startAt
  let outAt = startAt + durationSec - fadeOutSec
  let outSec = fadeOutSec
  if (outAt < fadeInEnd) {
    outAt = fadeInEnd
    outSec = startAt + durationSec - fadeInEnd
  }
  if (outSec > 0) param.setValueCurveAtTime(equalPowerFadeOut(), outAt, outSec)
}

/**
 * An equal-power fade to silence over `seconds` from `at`, on a param whose
 * schedule was cancelled there. Over no time it is a cut: a curve of no
 * length is refused by a browser.
 */
export function writeEqualPowerFadeOut(param: AudioParam, at: number, seconds: number): void {
  if (seconds > 0) param.setValueCurveAtTime(equalPowerFadeOut(), at, seconds)
  else param.setValueAtTime(0, at)
}
