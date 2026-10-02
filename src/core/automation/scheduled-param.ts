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

/** A point a glide passes through: the value it has reached by `atSec`. */
export interface GlidePoint {
  value: number
  atSec: number
}

/** Two points of a glide are never closer than this, so each ramp has a length. */
const MIN_GLIDE_LEG_SECONDS = 0.001
/** An exponential ramp cannot start or end on zero: a glide stays at or above this (-120 dB). */
const MIN_GLIDE_VALUE = 1e-6
/** After this many time constants an approach has arrived, as near as matters (within 0.25 %). */
const APPROACH_SETTLE_TIME_CONSTANTS = 6

/**
 * Moves a gain between levels along a straight line in dB (an exponential
 * ramp), and remembers what it wrote. Two gains glided over the same times
 * to reciprocal levels are reciprocal all the way, which a `setTargetAtTime`
 * approach is not: so one can be turned down and the other up by as much
 * without their product moving. The values have to stay above zero; a level
 * that is, or becomes, silence is approached with `approach`.
 */
export class ParamGlide {
  // Where the glide starts, and each point it ramps to after that.
  private points: GlidePoint[]
  // When the last write was an approach: the time it has arrived by.
  private settlesAt: number | null = null

  constructor(
    readonly param: ScheduledParam,
    value: number,
  ) {
    this.points = [{ value, atSec: -Infinity }]
  }

  /** The value the last write ends on. */
  get target(): number {
    return this.points[this.points.length - 1].value
  }

  /** When the last glide ends. */
  get endSec(): number {
    return this.points[this.points.length - 1].atSec
  }

  /**
   * False while an approach is on its way: there the param is somewhere
   * between two levels that only the browser knows, and a glide from it
   * cannot be matched by another.
   */
  isSettled(atSec: number): boolean {
    return this.settlesAt === null || atSec >= this.settlesAt
  }

  /** The value the param holds at `atSec` according to what was written. */
  valueAt(atSec: number): number {
    const points = this.points
    for (let index = 1; index < points.length; index += 1) {
      const to = points[index]
      if (atSec >= to.atSec) continue
      const from = points[index - 1]
      if (atSec <= from.atSec) return from.value
      const along = (atSec - from.atSec) / (to.atSec - from.atSec)
      return from.value * (to.value / from.value) ** along
    }
    return this.target
  }

  /**
   * From wherever the param is at `atSec`, glide to each point in turn. A
   * glide or approach that is still running is held where it is, so the new
   * one starts from there.
   */
  along(atSec: number, ...through: GlidePoint[]): void {
    const current = Math.max(MIN_GLIDE_VALUE, this.valueAt(atSec))
    if (this.settlesAt !== null || atSec < this.endSec) holdParamAt(this.param, atSec, current)
    else this.param.setValueAtTime(current, atSec)
    this.settlesAt = null
    const points: GlidePoint[] = [{ value: current, atSec }]
    let last = atSec
    for (const point of through) {
      const value = Math.max(MIN_GLIDE_VALUE, point.value)
      last = Math.max(point.atSec, last + MIN_GLIDE_LEG_SECONDS)
      this.param.exponentialRampToValueAtTime(value, last)
      points.push({ value, atSec: last })
    }
    this.points = points
  }

  /** Approach `value` from `atSec` with a time constant: for a level that is, or becomes, zero. */
  approach(value: number, atSec: number, timeConstantSec: number): void {
    // A glide still on its way would run on underneath the approach.
    if (atSec < this.endSec) holdParamAt(this.param, atSec, this.valueAt(atSec))
    this.param.setTargetAtTime(value, atSec, timeConstantSec)
    this.points = [{ value, atSec: -Infinity }]
    this.settlesAt = atSec + APPROACH_SETTLE_TIME_CONSTANTS * timeConstantSec
  }
}
