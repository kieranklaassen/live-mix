// The single lookahead scheduler (R7, KTD6): one timer hands every registered
// schedulable the starts due inside its own lookahead window, exactly once per
// `clipId:iteration:startSec` key, and catches up from the anchor after a
// throttled timer instead of skipping what fell due meanwhile (AE4).
//
// Lifted from ambient-live `app/frontend/pages/live/use-clip-transport.ts`
// (1d3b31b): the `schedule` loop (:191-238), the timer (:241-246) and the
// re-derive-on-edit effect (:253-266). Breathwork Live's `MusicEngine.tickAsync`
// (`musicEngine.ts:722-745`, ebdd457) is the same loop with a 100 ms tick and a
// 5 s lookahead — hence both are per-instance settings here.

import type { ClipWindow } from '../clips/window'
import { isLooping, scheduleKey, type ScheduledStart, type TransportLoop } from './anchor'
import type { Transport, TransportChange } from './Transport'
import { startsInWindow } from './window'

/**
 * Something with clips on the timeline whose starts the scheduler hands over
 * ahead of time — an audio track, a preloader, an automation lane.
 */
export interface Schedulable {
  /** How far ahead of the audio clock starts are handed over (ambient-live 0.2 s, Breathwork Live 5 s). */
  readonly lookaheadSec: number
  /** Every clip on the timeline. Read on each tick. */
  clips(): ClipWindow['clips']
  /**
   * Hand over one start. `when` is on the audio clock and may already have
   * passed after a throttled timer: join late or skip, never replay from the
   * top. Return false to decline (for example the sample is not decoded yet);
   * the start stays unscheduled and is offered again next tick.
   */
  schedule(start: ScheduledStart, when: number): boolean
  /** Silence the start scheduled under `key`, whether or not it has begun. */
  cancel(key: string): void
  /** Silence every start that has not begun yet and return their keys, so they can be re-derived. */
  cancelPending(): string[]
  /** Silence everything, begun or not, fading over `fadeSec` (0 = immediately). */
  cancelAll(fadeSec: number): void
}

export interface SchedulerOptions {
  transport: Transport
  /** Timer period in milliseconds. Default 40. */
  tickMs?: number
}

export const DEFAULT_TICK_MS = 40

interface Registration {
  /** Starts already handed over, by their schedule key. */
  scheduled: Map<string, ScheduledStart>
  /** Where the last window ended, in unwrapped timeline seconds; unset until the first tick after a pin. */
  windowEndSec?: number
}

export class Scheduler {
  readonly tickMs: number
  private readonly transport: Transport
  private readonly registrations = new Map<Schedulable, Registration>()
  private timer: ReturnType<typeof setInterval> | null = null
  private readonly unsubscribe: () => void

  constructor({ transport, tickMs = DEFAULT_TICK_MS }: SchedulerOptions) {
    this.transport = transport
    this.tickMs = tickMs
    this.unsubscribe = transport.onChange((change) => this.onTransportChange(change))
    if (transport.state === 'playing') this.startTimer()
  }

  /** Registers a schedulable; returns the matching unregister. Starts scheduling it at once while playing. */
  register(schedulable: Schedulable): () => void {
    if (!this.registrations.has(schedulable)) {
      this.registrations.set(schedulable, { scheduled: new Map() })
      this.tick()
    }
    return () => this.unregister(schedulable)
  }

  /** Forgets a schedulable. Audio it already has in flight is left alone. */
  unregister(schedulable: Schedulable): void {
    this.registrations.delete(schedulable)
  }

  /**
   * One scheduling pass: hands over every start due inside each schedulable's
   * window. Runs on the timer, but is safe to call directly.
   */
  tick(): void {
    if (this.transport.state !== 'playing') return
    const position = this.transport.position()
    if (position.finished) {
      this.transport.pause()
      return
    }
    const loop = this.transport.loop
    const nowSec = unwrap(position.positionSec, position.iteration, loop)

    for (const [schedulable, registration] of this.registrations) {
      // Runs on a timer rather than a frame so a backgrounded tab keeps playing;
      // when that timer is throttled the window reaches back to where the last
      // one ended, so nothing due in the gap is skipped.
      const catchUpSec =
        registration.windowEndSec === undefined
          ? 0
          : Math.max(0, nowSec - registration.windowEndSec)
      const clips = schedulable.clips()
      const due = startsInWindow({
        clips,
        positionSec: position.positionSec,
        lookaheadSec: schedulable.lookaheadSec,
        iteration: position.iteration,
        loop,
        catchUpSec,
      })
      registration.windowEndSec = nowSec + schedulable.lookaheadSec

      for (const hit of due) {
        const clip = clips.find((candidate) => candidate.id === hit.clipId)
        if (!clip) continue
        const start: ScheduledStart = {
          clipId: hit.clipId,
          iteration: hit.iteration,
          startSec: clip.startSec,
        }
        const key = scheduleKey(start)
        if (registration.scheduled.has(key)) continue
        const when = this.transport.contextTimeAt(start.startSec, start.iteration)
        if (!schedulable.schedule(start, when)) continue
        registration.scheduled.set(key, start)
      }

      for (const [key, start] of registration.scheduled) {
        if (start.iteration < position.iteration) registration.scheduled.delete(key)
      }
    }
  }

  /** Cancels every start not yet begun and forgets its key, so the next pass re-derives it. */
  cancelPending(): void {
    for (const [schedulable, registration] of this.registrations) {
      for (const key of schedulable.cancelPending()) registration.scheduled.delete(key)
    }
  }

  /**
   * Re-derives the queue after an edit, in the same turn, so a start that
   * falls due before the next tick is not lost. Starts still sounding where
   * they are drawn are left alone, so moving one clip does not cut another off
   * mid-note; a start that moved gives up the audio it began at its old
   * position rather than playing twice.
   */
  refresh(): void {
    if (this.transport.state !== 'playing') return
    this.cancelPending()
    for (const [schedulable, registration] of this.registrations) {
      const clips = schedulable.clips()
      for (const [key, start] of registration.scheduled) {
        const clip = clips.find((candidate) => candidate.id === start.clipId)
        if (clip && scheduleKey({ ...start, startSec: clip.startSec }) === key) continue
        schedulable.cancel(key)
        registration.scheduled.delete(key)
      }
    }
    this.tick()
  }

  /** Stops the timer and the transport subscription. Audio in flight is left alone. */
  dispose(): void {
    this.unsubscribe()
    this.stopTimer()
    this.registrations.clear()
  }

  private onTransportChange(change: TransportChange): void {
    switch (change.reason) {
      case 'start':
        this.reset()
        this.startTimer()
        this.tick()
        return
      case 'seek':
        this.silence(0)
        this.reset()
        this.tick()
        return
      case 'loop':
        // The transport re-pinned with a new pass number: keys of pending
        // starts are stale, sounding ones are left alone.
        for (const registration of this.registrations.values()) {
          registration.windowEndSec = undefined
        }
        this.refresh()
        return
      case 'pause':
      case 'end':
        this.silence(0)
        this.reset()
        this.stopTimer()
        return
      case 'stop':
        this.silence(change.fadeSec)
        this.reset()
        this.stopTimer()
        return
      default:
        return assertNever(change.reason)
    }
  }

  private silence(fadeSec: number): void {
    for (const schedulable of this.registrations.keys()) schedulable.cancelAll(fadeSec)
  }

  /** Forgets every handed-over start and every window; the next tick starts from the anchor. */
  private reset(): void {
    for (const registration of this.registrations.values()) {
      registration.scheduled.clear()
      registration.windowEndSec = undefined
    }
  }

  private startTimer(): void {
    if (this.timer !== null) return
    this.timer = setInterval(() => this.tick(), this.tickMs)
  }

  private stopTimer(): void {
    if (this.timer === null) return
    clearInterval(this.timer)
    this.timer = null
  }
}

/** Timeline seconds since pass 0 began — a monotonic coordinate across loop wraps. */
function unwrap(positionSec: number, iteration: number, loop: TransportLoop): number {
  return isLooping(loop) ? iteration * loop.lengthSec + positionSec : positionSec
}

function assertNever(value: never): never {
  throw new Error(`Unhandled transport change: ${String(value)}`)
}
