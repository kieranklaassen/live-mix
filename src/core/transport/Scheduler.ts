// The single lookahead scheduler (R7, KTD6): one timer hands every registered
// schedulable the starts due inside its own lookahead window, exactly once per
// `clipId:iteration:startSec` key, and catches up from the anchor after a
// throttled timer instead of skipping what fell due meanwhile (AE4).
//
// A schedulable that can enter a clip partway (`joinsLate`) is also handed the
// clips the position is already inside: where the transport starts or lands,
// once a start it declined can be taken, and after an edit (`rejoin`). What is
// under the playhead sounds, from that point in it.
//
// A clip with a `chance` is drawn for once per counted pass of the transport,
// from the scheduler's seed: on a pass it sits out it is neither started nor
// entered, and the same seed sits the same passes out every time.
//
// Lifted from ambient-live `app/frontend/pages/live/use-clip-transport.ts`
// (1d3b31b): the `schedule` loop (:191-238), the timer (:241-246) and the
// re-derive-on-edit effect (:253-266). Breathwork Live's `MusicEngine.tickAsync`
// (`musicEngine.ts:722-745`, ebdd457) is the same loop with a 100 ms tick and a
// 5 s lookahead — hence both are per-instance settings here.

import { normaliseSeed, soundsOnPass } from '../clips/chance'
import {
  clipsSoundingAt,
  type ClipWindow,
  type ScheduledClip,
  type WindowClip,
} from '../clips/window'
import {
  isLooping,
  scheduleKey,
  type ScheduledStart,
  type TransportLoop,
  type TransportPosition,
} from './anchor'
import type { Transport, TransportChange } from './Transport'
import { startsInWindow } from './window'

/**
 * Why a scheduling pass ran: the timer, a transport re-pin (`start`, `seek`,
 * `loop`), an edit (`refresh`), a new registration, or a direct `tick()` call.
 */
export type SchedulerTickReason =
  'timer' | 'start' | 'seek' | 'loop' | 'refresh' | 'register' | 'manual'

/** What a tick listener sees: the transport position the pass ran at, plus its unwrapped timeline second. */
export interface SchedulerTick {
  position: TransportPosition
  /** Timeline seconds since pass 0 began — monotonic across loop wraps. */
  timelineSec: number
  reason: SchedulerTickReason
}

export type SchedulerTickListener = (tick: SchedulerTick) => void

/**
 * Something with clips on the timeline whose starts the scheduler hands over
 * ahead of time — an audio track, a preloader, an automation lane.
 */
export interface Schedulable {
  /** How far ahead of the audio clock starts are handed over (ambient-live 0.2 s, Breathwork Live 5 s). */
  readonly lookaheadSec: number
  /**
   * True when `schedule` can enter a clip partway in. Such a schedulable is
   * also handed the clips the position is already inside: when the transport
   * starts or lands in one, when a start it declined can at last be taken,
   * and when `rejoin` names one. Its clips need a `durationSec` for that.
   */
  readonly joinsLate?: boolean
  /** Every clip on the timeline. Read on each tick. */
  clips(): ClipWindow['clips']
  /**
   * Hand over one start. `when` is on the audio clock and may already have
   * passed after a throttled timer: join late or skip, never replay from the
   * top. Return false to decline (for example the sample is not decoded yet);
   * the start stays unscheduled and is offered again next tick. `joining` is
   * set when the clip is being entered partway on purpose (only for a
   * schedulable that `joinsLate`): there is no silence before it to hide a
   * cut, so ease in.
   */
  schedule(start: ScheduledStart, when: number, joining?: boolean): boolean
  /**
   * Silence the start scheduled under `key`, whether or not it has begun.
   * With `fadeSec`, one that is sounding fades out over that long and is then
   * forgotten, so the same key can be handed over again at once.
   */
  cancel(key: string, fadeSec?: number): void
  /**
   * True when the start under `key` is sounding and could not be entered
   * again at once if it were let go: its voice takes time to build, or its
   * envelope has no way in partway. `rejoin` leaves such a clip as it sounds
   * rather than silence it. Absent: nothing is kept.
   */
  keeps?(key: string): boolean
  /** Silence every start that has not begun yet and return their keys, so they can be re-derived. */
  cancelPending(): string[]
  /** Silence everything, begun or not, fading over `fadeSec` (0 = immediately). */
  cancelAll(fadeSec: number): void
}

export interface SchedulerOptions {
  transport: Transport
  /** What every chance is drawn from (`Clip.chance`). Default 0. */
  seed?: number
  /** Timer period in milliseconds. Default 40. */
  tickMs?: number
  /** Injectable timer functions (the engine clock's); default to the globals. */
  setIntervalFn?: (callback: () => void, ms: number) => ReturnType<typeof setInterval>
  clearIntervalFn?: (id: ReturnType<typeof setInterval>) => void
}

export const DEFAULT_TICK_MS = 40
/** How long a sounding clip takes to fade when `rejoin` lets it go for its edited self. */
export const REJOIN_FADE_SECONDS = 0.005

/**
 * A start that was handed over, with the audio-clock time it was handed over
 * for and the counted pass it belongs to (its `iteration` may be of an anchor
 * that has gone).
 */
interface Handover extends ScheduledStart {
  when: number
  pass: number
}

interface Registration {
  /** Starts already handed over, by their schedule key. */
  scheduled: Map<string, Handover>
  /**
   * Starts a schedulable that `joinsLate` declined. Once such a start has
   * passed the window stops offering it, so it is offered from here, as a
   * join, for as long as its clip sounds. Each keeps the clock time it was
   * offered at: its pass number may belong to an anchor that has gone.
   */
  declined: Map<string, Handover>
  /** Where the last window ended, in unwrapped timeline seconds; unset until the first tick after a pin. */
  windowEndSec?: number
  /**
   * Set when a `start` or `seek` has silenced everything, until the next tick:
   * that tick's window begins at the anchor itself, not at wherever the clock
   * has got to since.
   */
  fromAnchor?: boolean
}

export class Scheduler {
  readonly tickMs: number
  private readonly transport: Transport
  private readonly registrations = new Map<Schedulable, Registration>()
  private readonly tickListeners = new Set<SchedulerTickListener>()
  private timer: ReturnType<typeof setInterval> | null = null
  private readonly unsubscribe: () => void
  private readonly setIntervalFn: NonNullable<SchedulerOptions['setIntervalFn']>
  private readonly clearIntervalFn: NonNullable<SchedulerOptions['clearIntervalFn']>
  private currentSeed: number

  constructor({
    transport,
    seed = 0,
    tickMs = DEFAULT_TICK_MS,
    setIntervalFn = (callback, ms) => setInterval(callback, ms),
    clearIntervalFn = (id) => clearInterval(id),
  }: SchedulerOptions) {
    this.transport = transport
    this.currentSeed = normaliseSeed(seed)
    this.tickMs = tickMs
    this.setIntervalFn = setIntervalFn
    this.clearIntervalFn = clearIntervalFn
    this.unsubscribe = transport.onChange((change) => this.onTransportChange(change))
    if (transport.state === 'playing') this.startTimer()
  }

  /** What every chance is drawn from: a clip with a `chance` sounds on the passes this seed gives it. */
  get seed(): number {
    return this.currentSeed
  }

  /**
   * Another seed: another choice of passes for every clip with a `chance`.
   * While playing, those clips are put in step with it at once (`rejoin`):
   * one that now sits this pass out fades, one that now sounds is entered.
   */
  setSeed(seed: number): void {
    const next = normaliseSeed(seed)
    if (next === this.currentSeed) return
    this.currentSeed = next
    const drawn = new Set<string>()
    for (const schedulable of this.registrations.keys()) {
      for (const clip of schedulable.clips()) {
        if (clip.chance !== undefined && clip.chance < 1) drawn.add(clip.id)
      }
    }
    this.rejoin(drawn)
  }

  /**
   * Whether `clip` sounds on loop pass `iteration` (default: the pass the
   * transport is in): always without a `chance`, else by the seed's draw for
   * that clip on that counted pass.
   */
  sounds(clip: Pick<WindowClip, 'id' | 'chance'>, iteration?: number): boolean {
    const pass = iteration === undefined ? this.transport.pass() : this.transport.passOf(iteration)
    return soundsOnPass(clip, pass, this.currentSeed)
  }

  /** Registers a schedulable; returns the matching unregister. Starts scheduling it at once while playing. */
  register(schedulable: Schedulable): () => void {
    if (!this.registrations.has(schedulable)) {
      this.registrations.set(schedulable, { scheduled: new Map(), declined: new Map() })
      this.tick('register')
    }
    return () => this.unregister(schedulable)
  }

  /** Forgets a schedulable. Audio it already has in flight is left alone. */
  unregister(schedulable: Schedulable): void {
    this.registrations.delete(schedulable)
  }

  /**
   * Called after every scheduling pass while playing, with the position the
   * pass ran at — for logic that must run on the scheduler's clock (the
   * session grid's launches and follow actions). Returns the unsubscribe.
   */
  onTick(listener: SchedulerTickListener): () => void {
    this.tickListeners.add(listener)
    return () => {
      this.tickListeners.delete(listener)
    }
  }

  /**
   * One scheduling pass: hands over every start due inside each schedulable's
   * window. Runs on the timer, but is safe to call directly. `reason` is
   * reported to tick listeners.
   */
  tick(reason: SchedulerTickReason = 'manual'): void {
    if (this.transport.state !== 'playing') return
    // One reading of the clock for the whole pass: it moves while this runs.
    const contextTime = this.transport.now()
    const position = this.transport.position(contextTime)
    if (position.finished) {
      this.transport.pause()
      return
    }
    const loop = this.transport.loop
    const anchor = this.transport.anchor
    const nowSec = unwrap(position.positionSec, position.iteration, loop)

    for (const [schedulable, registration] of this.registrations) {
      const clips = schedulable.clips()
      let due: ScheduledClip[]
      // Clips to enter partway: the position is already inside them.
      const joins: Handover[] = []
      if (registration.fromAnchor && anchor) {
        // The audio clock can move between the pin and this pass (a render
        // quantum ends, a listener ahead of this one takes its time). The
        // position has then left the anchor behind, and a window that began
        // at the position would step over a clip starting exactly where the
        // transport was started: silent until the loop comes round. So the
        // first window after a start or a seek runs from the anchor's own
        // position, which needs no arithmetic to land on, up to the usual
        // lookahead. Nothing is sounding then, so nothing can be handed over
        // twice; a loop change keeps what sounds and is left as it was.
        due = startsInWindow({
          clips,
          positionSec: anchor.positionSec,
          lookaheadSec: Math.max(0, contextTime - anchor.contextTime) + schedulable.lookaheadSec,
          iteration: anchor.iteration,
          loop,
        })
        // The transport started, or landed, inside these: they play from
        // there rather than waiting for their start to come round again.
        if (schedulable.joinsLate) {
          const pass = this.transport.passOf(anchor.iteration)
          for (const clip of clipsSoundingAt(clips, anchor.positionSec)) {
            if (!soundsOnPass(clip, pass, this.currentSeed)) continue
            const start = { clipId: clip.id, iteration: anchor.iteration, startSec: clip.startSec }
            const when = this.transport.contextTimeAt(start.startSec, start.iteration)
            joins.push({ ...start, when, pass })
          }
        }
      } else {
        // Runs on a timer rather than a frame so a backgrounded tab keeps playing;
        // when that timer is throttled the window reaches back to where the last
        // one ended, so nothing due in the gap is skipped.
        const catchUpSec =
          registration.windowEndSec === undefined
            ? 0
            : Math.max(0, nowSec - registration.windowEndSec)
        due = startsInWindow({
          clips,
          positionSec: position.positionSec,
          lookaheadSec: schedulable.lookaheadSec,
          iteration: position.iteration,
          loop,
          catchUpSec,
        })
      }
      registration.fromAnchor = false
      registration.windowEndSec = nowSec + schedulable.lookaheadSec

      for (const hit of due) {
        const clip = clips.find((candidate) => candidate.id === hit.clipId)
        if (!clip) continue
        // Left to chance, and this pass it sits out: nothing to hand over,
        // and nothing to offer again later.
        const pass = this.transport.passOf(hit.iteration)
        if (!soundsOnPass(clip, pass, this.currentSeed)) continue
        const start: ScheduledStart = {
          clipId: hit.clipId,
          iteration: hit.iteration,
          startSec: clip.startSec,
        }
        const key = scheduleKey(start)
        if (registration.scheduled.has(key)) continue
        const when = this.transport.contextTimeAt(start.startSec, start.iteration)
        if (!schedulable.schedule(start, when)) {
          if (schedulable.joinsLate) registration.declined.set(key, { ...start, when, pass })
          continue
        }
        registration.scheduled.set(key, { ...start, when, pass })
        registration.declined.delete(key)
      }

      // A declined start the window has moved past (its sample decoded after
      // the playhead reached it) comes in where the clip has got to.
      for (const [key, start] of registration.declined) {
        const stands = soundsOn(clips, start, start.when, contextTime)
        if (!stands || registration.scheduled.has(key)) registration.declined.delete(key)
        else if (contextTime > start.when) joins.push(start)
      }

      for (const { when, pass, ...start } of joins) {
        const key = scheduleKey(start)
        if (registration.scheduled.has(key)) continue
        if (schedulable.schedule(start, when, true)) {
          registration.scheduled.set(key, { ...start, when, pass })
          registration.declined.delete(key)
        } else {
          registration.declined.set(key, { ...start, when, pass })
        }
      }

      // A handover of a pass gone by is forgotten, unless its clip still sounds
      // from it (it runs over the loop's end, or a loop change gave the
      // transport a new pass under it): `refresh` and `rejoin` must find that one.
      for (const [key, start] of registration.scheduled) {
        if (start.iteration >= position.iteration) continue
        const sounding =
          schedulable.joinsLate === true && soundsOn(clips, start, start.when, contextTime)
        if (!sounding) registration.scheduled.delete(key)
      }
    }

    if (this.tickListeners.size > 0) {
      const tick: SchedulerTick = { position, timelineSec: nowSec, reason }
      for (const listener of [...this.tickListeners]) listener(tick)
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
   * position rather than playing twice, and so does one whose clip was cut
   * short of where the transport is (on a schedulable that `joinsLate`, which
   * is where clips have a length to read).
   */
  refresh(reason: SchedulerTickReason = 'refresh'): void {
    if (this.transport.state !== 'playing') return
    this.cancelPending()
    const contextTime = this.transport.now()
    for (const [schedulable, registration] of this.registrations) {
      const clips = schedulable.clips()
      for (const [key, start] of registration.scheduled) {
        const clip = clips.find((candidate) => candidate.id === start.clipId)
        if (clip && scheduleKey({ ...start, startSec: clip.startSec }) === key) {
          const cutShort =
            schedulable.joinsLate === true &&
            clip.durationSec !== undefined &&
            start.when + clip.durationSec <= contextTime
          if (!cutShort) continue
          // Its end is behind the transport now; what still sounds of it fades.
          schedulable.cancel(key, REJOIN_FADE_SECONDS)
          registration.scheduled.delete(key)
          continue
        }
        schedulable.cancel(key)
        registration.scheduled.delete(key)
      }
    }
    this.tick(reason)
  }

  /**
   * Puts the named clips back in step with the transport after an edit, in
   * the same turn, on every schedulable that `joinsLate`: whatever a clip has
   * sounding or pending is let go (a sounding one fading over `fadeSec`), and
   * a clip the position is inside is handed over again from that point in it,
   * as it now is (one still sounding over the loop's end from the pass before,
   * under the start it had). So a clip moved, stretched or dropped under the
   * playhead is heard at once instead of when its start next comes round, and
   * one whose fades, slice or direction changed is heard changed. A clip the
   * schedulable `keeps` is left exactly as it sounds: letting it go would
   * silence it until its start came round. `refresh` alone keeps what sounds
   * and waits for starts; a host calls this for the clips an edit touched
   * once the edit has reached its tracks. No-op while not playing.
   */
  rejoin(clipIds: Iterable<string>, fadeSec = REJOIN_FADE_SECONDS): void {
    if (this.transport.state !== 'playing') return
    const ids = new Set(clipIds)
    if (ids.size === 0) return
    const contextTime = this.transport.now()
    const position = this.transport.position(contextTime)
    if (position.finished) return

    for (const [schedulable, registration] of this.registrations) {
      if (!schedulable.joinsLate) continue
      // Clips sounding in a way that cannot be entered again at once stay as they are.
      const kept = new Set<string>()
      for (const [key, start] of registration.scheduled) {
        if (ids.has(start.clipId) && schedulable.keeps?.(key)) kept.add(start.clipId)
      }
      const released: Handover[] = []
      for (const [key, start] of registration.scheduled) {
        if (!ids.has(start.clipId) || kept.has(start.clipId)) continue
        schedulable.cancel(key, fadeSec)
        registration.scheduled.delete(key)
        released.push(start)
      }
      for (const [key, start] of registration.declined) {
        if (ids.has(start.clipId) && !kept.has(start.clipId)) registration.declined.delete(key)
      }
      const named = schedulable.clips().filter((clip) => ids.has(clip.id) && !kept.has(clip.id))
      // One way in per clip: where the position is inside it on this pass.
      const joins = new Map<string, Handover>()
      const pass = this.transport.passOf(position.iteration)
      for (const clip of clipsSoundingAt(named, position.positionSec)) {
        if (!soundsOnPass(clip, pass, this.currentSeed)) continue
        const start = { clipId: clip.id, iteration: position.iteration, startSec: clip.startSec }
        const when = this.transport.contextTimeAt(start.startSec, start.iteration)
        joins.set(clip.id, { ...start, when, pass })
      }
      // Failing that, the start just let go, if by the clock it would still be
      // sounding: a clip that runs over the loop's end, heard from the pass
      // before. It comes back under the start it had.
      for (const start of released.sort((a, b) => b.when - a.when)) {
        if (joins.has(start.clipId) || start.when >= contextTime) continue
        // Not one that the seed, or its own chance, now sits out of the pass it began on.
        const clip = named.find((candidate) => candidate.id === start.clipId)
        if (!clip || !soundsOnPass(clip, start.pass, this.currentSeed)) continue
        if (soundsOn(named, start, start.when, contextTime)) joins.set(start.clipId, start)
      }
      for (const { when, pass: joined, ...start } of joins.values()) {
        const key = scheduleKey(start)
        if (schedulable.schedule(start, when, true)) {
          registration.scheduled.set(key, { ...start, when, pass: joined })
        } else {
          registration.declined.set(key, { ...start, when, pass: joined })
        }
      }
    }
    // Starts of these clips still ahead, inside the window, are handed over afresh.
    this.tick('refresh')
  }

  /** Stops the timer and the transport subscription. Audio in flight is left alone. */
  dispose(): void {
    this.unsubscribe()
    this.stopTimer()
    this.registrations.clear()
    this.tickListeners.clear()
  }

  private onTransportChange(change: TransportChange): void {
    switch (change.reason) {
      case 'start':
        this.reset()
        this.startTimer()
        this.tick('start')
        return
      case 'seek':
        this.silence(0)
        this.reset()
        this.tick('seek')
        return
      case 'loop':
        // The transport re-pinned with a new pass number: keys of pending
        // starts are stale, sounding ones are left alone.
        for (const registration of this.registrations.values()) {
          registration.windowEndSec = undefined
          // Their pass numbers belong to the anchor that went.
          registration.declined.clear()
        }
        this.refresh('loop')
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
      registration.declined.clear()
      registration.windowEndSec = undefined
      registration.fromAnchor = true
    }
  }

  private startTimer(): void {
    if (this.timer !== null) return
    this.timer = this.setIntervalFn(() => this.tick('timer'), this.tickMs)
  }

  private stopTimer(): void {
    if (this.timer === null) return
    this.clearIntervalFn(this.timer)
    this.timer = null
  }
}

/**
 * Whether the clip `start` names is still where that start was drawn and, begun
 * at `when` on the audio clock, not yet over at `contextTime`.
 */
function soundsOn(
  clips: ClipWindow['clips'],
  start: ScheduledStart,
  when: number,
  contextTime: number,
): boolean {
  const clip = clips.find((candidate) => candidate.id === start.clipId)
  return (
    clip?.durationSec !== undefined &&
    scheduleKey({ ...start, startSec: clip.startSec }) === scheduleKey(start) &&
    contextTime < when + clip.durationSec
  )
}

/** Timeline seconds since pass 0 began — a monotonic coordinate across loop wraps. */
function unwrap(positionSec: number, iteration: number, loop: TransportLoop): number {
  return isLooping(loop) ? iteration * loop.lengthSec + positionSec : positionSec
}

function assertNever(value: never): never {
  throw new Error(`Unhandled transport change: ${String(value)}`)
}
