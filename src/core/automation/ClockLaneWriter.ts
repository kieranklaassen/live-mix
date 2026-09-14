// The clock-anchored counterpart of `LaneWriter`: lane seconds are audio-clock
// seconds from a fixed anchor, not transport positions, and every lane event
// is written verbatim — no join ramps, no same-time dedupe — so a producer
// that already schedules its own automation (Breathwork Live's breath guide,
// whose cycles start with `setValueAtTime(0, cycleStart)`) can publish it as
// a `ParamLane` without a single recorded event changing. The guide's loop is
// this one: "while the next event starts before now + lookahead, write it".

import { laneEventsInRange, type LaneEvent, type ParamLane } from './ParamLane'
import { holdParamAt, type ScheduledParam } from './scheduled-param'

export interface ClockLaneWriterOptions {
  /** Audio-clock second the lane's `timeSec: 0` sits at. Default 0. */
  anchorSec?: number
  /**
   * What a lane edit does to what is already scheduled. `'rewrite'` (default)
   * cancels from the current time and writes the edited lane from there;
   * `'append'` leaves scheduled events alone and keeps writing from the
   * cursor — for producers that only ever add breakpoints ahead of it.
   */
  onEdit?: 'rewrite' | 'append'
}

export class ClockLaneWriter {
  readonly anchorSec: number
  readonly onEdit: 'rewrite' | 'append'
  private overridden = false
  /** Lane second up to which events are written. */
  private cursorSec: number | null = null
  private laneVersion: number

  constructor(
    readonly lane: ParamLane,
    readonly param: ScheduledParam,
    options: ClockLaneWriterOptions = {},
  ) {
    this.anchorSec = options.anchorSec ?? 0
    this.onEdit = options.onEdit ?? 'rewrite'
    this.laneVersion = lane.version
  }

  /** True between `override()` and `release()`; ticks write nothing. */
  get isOverridden(): boolean {
    return this.overridden
  }

  /** Lane second automation is written up to, if any. */
  get writtenUntilSec(): number | null {
    return this.cursorSec
  }

  /**
   * Write every lane event in `[cursor, now + lookahead)`, at
   * `anchorSec + event.timeSec` on the audio clock. The first tick starts the
   * cursor at the current lane second: events already in the past are not
   * replayed (call `reset()` after moving the anchor to start over).
   */
  tick(nowSec: number, lookaheadSec: number): void {
    const laneNow = nowSec - this.anchorSec
    const horizonSec = laneNow + Math.max(0, lookaheadSec)
    if (this.overridden) return

    const edited = this.lane.version !== this.laneVersion
    this.laneVersion = this.lane.version
    if (this.cursorSec === null) {
      this.cursorSec = laneNow
    } else if (edited && this.onEdit === 'rewrite') {
      const from = Math.max(laneNow, Math.min(this.cursorSec, laneNow))
      this.param.cancelScheduledValues(this.anchorSec + from)
      this.cursorSec = from
    }
    if (horizonSec <= this.cursorSec) return
    for (const event of laneEventsInRange(this.lane, this.cursorSec, horizonSec)) {
      this.emit(event.method, event.value, this.anchorSec + event.timeSec)
    }
    this.cursorSec = horizonSec
  }

  /**
   * A live controller took the parameter: drop everything scheduled from
   * `contextTimeSec` on, hold the current value, and stop writing until
   * `release()`.
   */
  override(contextTimeSec: number): void {
    holdParamAt(this.param, contextTimeSec, this.lane.valueAt(contextTimeSec - this.anchorSec))
    this.overridden = true
  }

  /** Hand the parameter back; the next tick resumes from the current time (a plain set, no ramp). */
  release(nowSec: number): void {
    if (!this.overridden) return
    this.overridden = false
    const laneNow = nowSec - this.anchorSec
    this.param.setValueAtTime(this.lane.valueAt(laneNow), nowSec)
    this.cursorSec = laneNow
  }

  /** Forget what was written; the next tick starts at the current time. */
  reset(): void {
    this.cursorSec = null
    this.overridden = false
  }

  private emit(method: LaneEvent['method'], value: number, contextTimeSec: number): void {
    switch (method) {
      case 'setValueAtTime':
        this.param.setValueAtTime(value, contextTimeSec)
        break
      case 'linearRampToValueAtTime':
        this.param.linearRampToValueAtTime(value, contextTimeSec)
        break
      case 'exponentialRampToValueAtTime':
        this.param.exponentialRampToValueAtTime(value, contextTimeSec)
        break
      default: {
        const exhaustive: never = method
        return exhaustive
      }
    }
  }
}
