// A parameter automation lane: breakpoints on the seconds-first timeline,
// each shaping the segment that leads to the next one. The lane is pure data
// plus evaluation — `valueAt` is the single formula the UI draws, the offline
// renderer samples and `LaneWriter` turns into AudioParam automation, so the
// picture, the bounce and the live sound agree (R33).

/**
 * Shape of the segment from a breakpoint to the next one.
 *
 * `exponential` follows `exponentialRampToValueAtTime` and needs both ends on
 * the same side of zero; a segment that is not degrades to `linear`, offline
 * and in the written automation alike. `smooth` is a half-cosine ease
 * (`v0 + (v1 − v0)·(1 − cos πu)/2`), written as `SMOOTH_SEGMENT_STEPS` linear
 * sub-ramps because a curve is not a native AudioParam event.
 */
export type LaneCurve = 'step' | 'linear' | 'exponential' | 'smooth'

export interface Breakpoint {
  /** Timeline position in seconds. */
  timeSec: number
  value: number
  /** Segment shape towards the next breakpoint; `linear` when omitted. */
  curve?: LaneCurve
}

export interface ParamLaneOptions {
  breakpoints?: readonly Breakpoint[]
  /** Value the lane yields while it has no breakpoints. */
  defaultValue?: number
  /** Range every breakpoint value is clamped to (the target param's range). */
  min?: number
  max?: number
}

/** Linear sub-ramps a `smooth` segment is written as. */
export const SMOOTH_SEGMENT_STEPS = 16

export class ParamLane {
  readonly min: number
  readonly max: number
  readonly defaultValue: number
  /** Bumps on every edit so writers know to re-plan their lookahead. */
  version = 0
  private points: Breakpoint[] = []

  constructor(options: ParamLaneOptions = {}) {
    this.min = options.min ?? Number.NEGATIVE_INFINITY
    this.max = options.max ?? Number.POSITIVE_INFINITY
    this.defaultValue = this.clamp(options.defaultValue ?? 0)
    if (options.breakpoints) this.replace(options.breakpoints)
  }

  /** Sorted by time, read-only. */
  get breakpoints(): readonly Readonly<Breakpoint>[] {
    return this.points
  }

  /** Insert a breakpoint; one already at the same time is replaced. */
  add(breakpoint: Breakpoint): this {
    const next = this.normalise(breakpoint)
    const existing = this.points.findIndex((point) => point.timeSec === next.timeSec)
    if (existing >= 0) this.points[existing] = next
    else {
      const index = this.points.findIndex((point) => point.timeSec > next.timeSec)
      if (index < 0) this.points.push(next)
      else this.points.splice(index, 0, next)
    }
    this.version += 1
    return this
  }

  /** Remove the breakpoint at exactly `timeSec`; a miss is a no-op. */
  remove(timeSec: number): this {
    const index = this.points.findIndex((point) => point.timeSec === timeSec)
    if (index >= 0) {
      this.points.splice(index, 1)
      this.version += 1
    }
    return this
  }

  /** Replace every breakpoint at once (a paint stroke, an undo). */
  replace(breakpoints: readonly Breakpoint[]): this {
    const byTime = new Map<number, Breakpoint>()
    for (const point of breakpoints) {
      const next = this.normalise(point)
      byTime.set(next.timeSec, next)
    }
    this.points = [...byTime.values()].sort((a, b) => a.timeSec - b.timeSec)
    this.version += 1
    return this
  }

  clear(): this {
    return this.replace([])
  }

  /**
   * The lane's value at a timeline position: the first breakpoint's value
   * before it, the last one's after it, the segment curve in between.
   */
  valueAt(timeSec: number): number {
    const points = this.points
    if (points.length === 0) return this.defaultValue
    if (timeSec <= points[0].timeSec) return points[0].value
    const last = points[points.length - 1]
    if (timeSec >= last.timeSec) return last.value

    let index = 1
    while (points[index].timeSec <= timeSec) index += 1
    const from = points[index - 1]
    const to = points[index]
    return segmentValue(from, to, timeSec)
  }

  /**
   * Sample `valueAt` on a fixed grid from `fromSec`, `Math.round(durationSec ·
   * sampleRate)` points — the offline curve tests and the renderer assert on.
   */
  render(fromSec: number, durationSec: number, sampleRate: number): Float32Array {
    const length = Math.max(0, Math.round(durationSec * sampleRate))
    const out = new Float32Array(length)
    for (let i = 0; i < length; i += 1) out[i] = this.valueAt(fromSec + i / sampleRate)
    return out
  }

  private normalise(point: Breakpoint): Breakpoint {
    if (!Number.isFinite(point.timeSec)) {
      throw new Error('live-mix: breakpoint time must be finite')
    }
    const normalised: Breakpoint = {
      timeSec: point.timeSec,
      value: this.clamp(Number.isFinite(point.value) ? point.value : this.defaultValue),
    }
    if (point.curve && point.curve !== 'linear') normalised.curve = point.curve
    return normalised
  }

  private clamp(value: number): number {
    return Math.min(this.max, Math.max(this.min, value))
  }
}

/** The curve a segment is actually evaluated and written with. */
export function effectiveCurve(from: Breakpoint, to: Breakpoint): LaneCurve {
  const curve = from.curve ?? 'linear'
  if (curve === 'exponential' && !exponentialAllowed(from.value, to.value)) return 'linear'
  return curve
}

function exponentialAllowed(v0: number, v1: number): boolean {
  return v0 !== 0 && v1 !== 0 && Math.sign(v0) === Math.sign(v1)
}

/** Value inside the segment `from → to` at `timeSec` (exclusive of `to`). */
export function segmentValue(from: Breakpoint, to: Breakpoint, timeSec: number): number {
  const span = to.timeSec - from.timeSec
  if (span <= 0) return to.value
  const u = Math.min(1, Math.max(0, (timeSec - from.timeSec) / span))
  const curve = effectiveCurve(from, to)
  switch (curve) {
    case 'step':
      return u >= 1 ? to.value : from.value
    case 'linear':
      return from.value + (to.value - from.value) * u
    case 'exponential':
      return from.value * Math.pow(to.value / from.value, u)
    case 'smooth':
      return from.value + (to.value - from.value) * ((1 - Math.cos(Math.PI * u)) / 2)
    default: {
      const exhaustive: never = curve
      return exhaustive
    }
  }
}

/** One AudioParam call a lane segment turns into, in timeline seconds. */
export interface LaneEvent {
  timeSec: number
  value: number
  method: 'setValueAtTime' | 'linearRampToValueAtTime' | 'exponentialRampToValueAtTime'
}

/**
 * The AudioParam calls that realise the lane inside `[fromSec, toSec)`,
 * ordered by time. Half-open, so consecutive windows never return the same
 * call twice; `includeEnd` closes the range for the last window of a loop
 * pass, whose end is a breakpoint's home. Anchoring at the window start is the
 * writer's job — every call here is the arrival at a breakpoint (or at a
 * sub-step of a `smooth` one).
 */
export function laneEventsInRange(
  lane: ParamLane,
  fromSec: number,
  toSec: number,
  includeEnd = false,
): LaneEvent[] {
  const events: LaneEvent[] = []
  if (toSec < fromSec || (toSec === fromSec && !includeEnd)) return events
  const beyond = (timeSec: number): boolean => (includeEnd ? timeSec > toSec : timeSec >= toSec)
  const points = lane.breakpoints
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]
    if (beyond(point.timeSec)) break
    if (index === 0) {
      if (point.timeSec >= fromSec) {
        events.push({ timeSec: point.timeSec, value: point.value, method: 'setValueAtTime' })
      }
      continue
    }
    const previous = points[index - 1]
    const curve = effectiveCurve(previous, point)
    switch (curve) {
      case 'step':
        if (point.timeSec >= fromSec) {
          events.push({ timeSec: point.timeSec, value: point.value, method: 'setValueAtTime' })
        }
        break
      case 'linear':
        if (point.timeSec >= fromSec) {
          events.push({
            timeSec: point.timeSec,
            value: point.value,
            method: 'linearRampToValueAtTime',
          })
        }
        break
      case 'exponential':
        if (point.timeSec >= fromSec) {
          events.push({
            timeSec: point.timeSec,
            value: point.value,
            method: 'exponentialRampToValueAtTime',
          })
        }
        break
      case 'smooth': {
        const span = point.timeSec - previous.timeSec
        for (let step = 1; step <= SMOOTH_SEGMENT_STEPS; step += 1) {
          const timeSec =
            step === SMOOTH_SEGMENT_STEPS
              ? point.timeSec
              : previous.timeSec + (span * step) / SMOOTH_SEGMENT_STEPS
          if (timeSec < fromSec || beyond(timeSec)) continue
          events.push({
            timeSec,
            value:
              step === SMOOTH_SEGMENT_STEPS ? point.value : segmentValue(previous, point, timeSec),
            method: 'linearRampToValueAtTime',
          })
        }
        break
      }
      default: {
        const exhaustive: never = curve
        return exhaustive
      }
    }
  }
  return events
}
