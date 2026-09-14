// The slice of `AudioParam` the automation code writes through, plus the
// click-free idioms built on it. Structural, so the recording
// `MockAudioParam` and any param-shaped object satisfy it.

export interface ScheduledParam {
  setValueAtTime(value: number, startTime: number): unknown
  linearRampToValueAtTime(value: number, endTime: number): unknown
  exponentialRampToValueAtTime(value: number, endTime: number): unknown
  setTargetAtTime(target: number, startTime: number, timeConstant: number): unknown
  cancelScheduledValues(cancelTime: number): unknown
  /** Missing in Firefox; `holdParamAt` falls back to cancel + set. */
  cancelAndHoldAtTime?(cancelTime: number): unknown
}

/**
 * Cancel-and-hold: drop every scheduled event from `atSec` on and freeze the
 * param at the value it has right then. Where `cancelAndHoldAtTime` is not
 * implemented, `cancelScheduledValues` would snap back to the value before
 * the cancelled ramp, so the caller's own computation of the current value
 * (`fallbackValue`) is set instead.
 */
export function holdParamAt(param: ScheduledParam, atSec: number, fallbackValue: number): void {
  if (typeof param.cancelAndHoldAtTime === 'function') {
    param.cancelAndHoldAtTime(atSec)
  } else {
    param.cancelScheduledValues(atSec)
    param.setValueAtTime(fallbackValue, atSec)
  }
}

interface RampSegment {
  startSec: number
  startValue: number
  endSec: number
  endValue: number
}

/** Ramp length `ParamRamper` uses when the caller gives none. */
export const DEFAULT_RAMP_SECONDS = 0.02

/**
 * Writes control-rate values to an AudioParam as short linear ramps, never a
 * hard set (R2). Remembers the last ramp so the next one starts exactly where
 * the param is — anchored at "now" when the previous ramp has finished, held
 * with cancel-and-hold when it is still running.
 */
export class ParamRamper {
  private segment: RampSegment | null = null

  constructor(readonly param: ScheduledParam) {}

  /** The value the param holds at `atSec` according to what was written. */
  valueAt(atSec: number): number | undefined {
    const segment = this.segment
    if (!segment) return undefined
    if (atSec >= segment.endSec) return segment.endValue
    if (atSec <= segment.startSec) return segment.startValue
    const u = (atSec - segment.startSec) / (segment.endSec - segment.startSec)
    return segment.startValue + (segment.endValue - segment.startValue) * u
  }

  /** Jump to `value` at `atSec`; only for the very first write. */
  set(value: number, atSec: number): void {
    this.param.setValueAtTime(value, atSec)
    this.segment = { startSec: atSec, startValue: value, endSec: atSec, endValue: value }
  }

  /** Ramp from wherever the param is at `atSec` to `value` over `rampSec`. */
  rampTo(value: number, atSec: number, rampSec = DEFAULT_RAMP_SECONDS): void {
    const segment = this.segment
    if (!segment) {
      this.set(value, atSec)
      return
    }
    const current = this.valueAt(atSec) ?? value
    if (value === segment.endValue && atSec >= segment.endSec) return
    if (atSec < segment.endSec) holdParamAt(this.param, atSec, current)
    else this.param.setValueAtTime(current, atSec)
    const endSec = atSec + Math.max(0, rampSec)
    if (endSec > atSec) this.param.linearRampToValueAtTime(value, endSec)
    else this.param.setValueAtTime(value, atSec)
    this.segment = { startSec: atSec, startValue: current, endSec, endValue: value }
  }

  /** Forget the written state; the next write anchors afresh. */
  reset(): void {
    this.segment = null
  }
}
