// Writes a `ParamLane` ahead into an AudioParam inside the scheduler window —
// Breathwork Live's breath-guide loop ("while the next cycle starts before
// now + lookahead, write it") generalised to any lane — and yields to a live
// override with cancel-and-hold (R13, R29). Every join back onto the lane
// (first tick excepted) is a short ramp, so a seek, a stall, a lane edit under
// playback or a released fader never steps the param (R2).
//
// A segment is handed to the graph whole as soon as the window reaches into
// it: a ramp issued after its segment has begun is rendered as a jump to the
// interpolated value (verified in Chrome by the browser golden), so the
// write cursor lands on segment ends, never inside a segment.

import { laneEventsInRange, segmentEndAfter, type LaneEvent, type ParamLane } from './ParamLane'
import { holdParamAt, type ScheduledParam } from './scheduled-param'

export interface LaneWindow {
  /** Timeline position at the tick, wrapped inside the loop when looping. */
  playheadSec: number
  /** How far ahead of the playhead to write. */
  lookaheadSec: number
  /** AudioContext time that corresponds to `playheadSec`. */
  contextTimeSec: number
  /**
   * Loop pass the playhead is in. Optional: without it a playhead that moves
   * backwards while looping is read as a wrap; with it, as a seek.
   */
  iteration?: number
  loopEnabled?: boolean
  /** Length of one loop pass; only read when `loopEnabled`. */
  loopLengthSec?: number
}

export interface LaneWriterOptions {
  /** Ramp used to rejoin the lane after an override, seek, stall, edit or loop wrap. */
  joinRampSec?: number
}

/** The slice of `Transport` a lane window is built from; `Transport` satisfies it. */
export interface LaneTransport {
  position(): { positionSec: number; iteration: number }
  readonly loop: { readonly enabled: boolean; readonly lengthSec: number }
  contextTimeAt(positionSec: number, iteration?: number): number
}

/** This tick's `LaneWindow` from a playing transport. */
export function laneWindowFrom(transport: LaneTransport, lookaheadSec: number): LaneWindow {
  const { positionSec, iteration } = transport.position()
  return {
    playheadSec: positionSec,
    iteration,
    lookaheadSec,
    contextTimeSec: transport.contextTimeAt(positionSec, iteration),
    loopEnabled: transport.loop.enabled,
    loopLengthSec: transport.loop.lengthSec,
  }
}

export const DEFAULT_JOIN_RAMP_SECONDS = 0.05

/** Offset drift smaller than this is clock jitter, not a seek. */
const SEEK_EPSILON_SEC = 0.001

interface Written {
  value: number
  contextTimeSec: number
}

export class LaneWriter {
  readonly joinRampSec: number
  private overridden = false
  private rejoin = false
  /** Unwrapped timeline second up to which automation is written. */
  private cursorSec: number | null = null
  /** The cursor sits on a value the writer just set, so a wrap there is already done. */
  private cursorAnchored = false
  private lastWritten: Written | null = null
  private lastWrappedPlayheadSec: number | null = null
  private lastOffsetSec: number | null = null
  private iteration = 0
  /** Loop length of the last tick; 0 when not looping. */
  private loopLengthSec = 0
  private laneVersion: number

  constructor(
    readonly lane: ParamLane,
    readonly param: ScheduledParam,
    options: LaneWriterOptions = {},
  ) {
    this.joinRampSec = Math.max(0, options.joinRampSec ?? DEFAULT_JOIN_RAMP_SECONDS)
    this.laneVersion = lane.version
  }

  /** True between `override()` and `release()`; ticks write nothing. */
  get isOverridden(): boolean {
    return this.overridden
  }

  /** Unwrapped timeline second automation is written up to, if any. */
  get writtenUntilSec(): number | null {
    return this.cursorSec
  }

  /**
   * Bring the written automation up to `playheadSec + lookaheadSec`. Call on
   * every scheduler tick with the same window the clip scheduler uses.
   */
  tick(window: LaneWindow): void {
    const loopLengthSec = window.loopLengthSec ?? 0
    const looping =
      window.loopEnabled === true && Number.isFinite(loopLengthSec) && loopLengthSec > 0
    this.loopLengthSec = looping ? loopLengthSec : 0
    const playheadSec = this.unwrap(window, looping, loopLengthSec)
    const offsetSec = window.contextTimeSec - playheadSec
    const horizonSec = playheadSec + Math.max(0, window.lookaheadSec)
    this.lastWrappedPlayheadSec = window.playheadSec

    if (this.overridden) {
      this.lastOffsetSec = offsetSec
      return
    }

    const edited = this.lane.version !== this.laneVersion
    const seeked =
      this.lastOffsetSec !== null && Math.abs(offsetSec - this.lastOffsetSec) > SEEK_EPSILON_SEC
    const stalled = this.cursorSec !== null && playheadSec > this.cursorSec

    if (this.cursorSec === null) {
      this.emit('setValueAtTime', this.laneValueAt(playheadSec), window.contextTimeSec)
      this.cursorSec = playheadSec
      this.cursorAnchored = true
    } else if (this.rejoin || edited || seeked || stalled) {
      this.join(playheadSec, offsetSec)
    }
    this.rejoin = false
    this.laneVersion = this.lane.version
    this.lastOffsetSec = offsetSec

    if (horizonSec > this.cursorSec) {
      this.cursorSec = this.writeRange(this.cursorSec, horizonSec, offsetSec, this.loopLengthSec)
      this.cursorAnchored = false
    }
  }

  /** The lane's value at an unwrapped timeline second (folded into the loop). */
  private laneValueAt(unwrappedSec: number): number {
    const length = this.loopLengthSec
    const local =
      length > 0 ? unwrappedSec - Math.floor(unwrappedSec / length) * length : unwrappedSec
    return this.lane.valueAt(local)
  }

  /**
   * A live controller took the parameter: drop everything scheduled from
   * `contextTimeSec` on, hold the current value, and stop writing until
   * `release()`. The override is remembered, not timed out (R29).
   */
  override(contextTimeSec: number): void {
    const timelineSec = this.lastOffsetSec === null ? 0 : contextTimeSec - this.lastOffsetSec
    holdParamAt(this.param, contextTimeSec, this.laneValueAt(timelineSec))
    this.overridden = true
    this.rejoin = true
  }

  /** Hand the parameter back; the next tick ramps onto the lane. */
  release(): void {
    if (!this.overridden) return
    this.overridden = false
    this.rejoin = true
  }

  /** Forget what was written; the next tick starts over (stop, explicit seek). */
  reset(): void {
    this.cursorSec = null
    this.cursorAnchored = false
    this.lastWritten = null
    this.lastWrappedPlayheadSec = null
    this.lastOffsetSec = null
    this.iteration = 0
    this.rejoin = false
  }

  private unwrap(window: LaneWindow, looping: boolean, loopLengthSec: number): number {
    if (!looping) {
      this.iteration = 0
      return window.playheadSec
    }
    if (window.iteration !== undefined) {
      this.iteration = window.iteration
    } else if (
      this.lastWrappedPlayheadSec !== null &&
      window.playheadSec < this.lastWrappedPlayheadSec - SEEK_EPSILON_SEC
    ) {
      this.iteration += 1
    }
    return this.iteration * loopLengthSec + window.playheadSec
  }

  /** Hold at `playheadSec`, ramp onto the lane, and continue from the ramp's end. */
  private join(playheadSec: number, offsetSec: number): void {
    const contextTimeSec = playheadSec + offsetSec
    holdParamAt(this.param, contextTimeSec, this.laneValueAt(playheadSec))
    this.lastWritten = null
    if (this.joinRampSec > 0) {
      const endSec = playheadSec + this.joinRampSec
      this.emit('linearRampToValueAtTime', this.laneValueAt(endSec), endSec + offsetSec)
      this.cursorSec = endSec
    } else {
      this.emit('setValueAtTime', this.laneValueAt(playheadSec), contextTimeSec)
      this.cursorSec = playheadSec
    }
    this.cursorAnchored = true
  }

  /**
   * Write from `fromSec` to at least `toSec` in unwrapped timeline seconds,
   * extended to the end of the segment `toSec` falls in; returns the second
   * written up to. With a loop, a pass that ends inside the range is written
   * up to and including its end (a breakpoint at the loop length belongs to
   * it) and every wrap re-anchors at the lane start, ramped like a join.
   */
  private writeRange(
    fromSec: number,
    toSec: number,
    offsetSec: number,
    loopLengthSec: number,
  ): number {
    if (loopLengthSec <= 0) {
      const writeTo = segmentEndAfter(this.lane, toSec)
      this.writeEvents(fromSec, writeTo, writeTo > toSec, 0, offsetSec)
      return writeTo
    }
    let cursor = fromSec
    while (cursor < toSec) {
      const pass = Math.floor(cursor / loopLengthSec)
      const passStart = pass * loopLengthSec
      let localFrom = cursor - passStart
      const wrapsHere = cursor === passStart && !(cursor === fromSec && this.cursorAnchored)
      if (wrapsHere) localFrom = this.wrap(passStart, offsetSec, loopLengthSec)
      const localTo = Math.min(toSec - passStart, loopLengthSec)
      const localWriteTo = Math.min(segmentEndAfter(this.lane, localTo), loopLengthSec)
      const reachesEnd = localWriteTo >= loopLengthSec
      this.writeEvents(
        localFrom,
        localWriteTo,
        reachesEnd || localWriteTo > localTo,
        passStart,
        offsetSec,
      )
      cursor = passStart + localWriteTo
    }
    return cursor
  }

  /** The loop restarts at unwrapped `wrapSec`; returns the local second to resume from. */
  private wrap(wrapSec: number, offsetSec: number, loopLengthSec: number): number {
    const contextTimeSec = wrapSec + offsetSec
    this.emit('setValueAtTime', this.lane.valueAt(loopLengthSec), contextTimeSec)
    if (this.joinRampSec > 0) {
      this.emit(
        'linearRampToValueAtTime',
        this.lane.valueAt(this.joinRampSec),
        contextTimeSec + this.joinRampSec,
      )
      return this.joinRampSec
    }
    this.emit('setValueAtTime', this.lane.valueAt(0), contextTimeSec)
    return 0
  }

  private writeEvents(
    localFromSec: number,
    localToSec: number,
    includeEnd: boolean,
    passStartSec: number,
    offsetSec: number,
  ): void {
    for (const event of laneEventsInRange(this.lane, localFromSec, localToSec, includeEnd)) {
      this.emit(event.method, event.value, passStartSec + event.timeSec + offsetSec)
    }
  }

  /**
   * One AudioParam call. A call landing on the same time and value as the
   * previous one is dropped: an anchor and the breakpoint it sits on, or a
   * zero-length ramp, say the same thing twice.
   */
  private emit(method: LaneEvent['method'], value: number, contextTimeSec: number): void {
    const last = this.lastWritten
    if (last?.contextTimeSec === contextTimeSec && last.value === value) return
    this.lastWritten = { value, contextTimeSec }
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
