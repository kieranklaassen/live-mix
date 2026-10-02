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
// The transport can run faster or slower than the audio clock (`Transport.rate`).
// Lookaheads stay clock seconds, so a window covers that much more or less of
// the timeline; when the rate changes, what is pending is re-derived at its new
// clock time and what sounds is told to carry on at the new speed (`retime`).
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
import type { Timebase } from './Cycle'
import type { Transport, TransportChange } from './Transport'
import { startsInWindow } from './window'

/**
 * Why a scheduling pass ran: the timer, a transport re-pin (`start`, `seek`,
 * `loop`, `rate`), an edit (`refresh`), a new registration, or a direct
 * `tick()` call.
 */
export type SchedulerTickReason =
  'timer' | 'start' | 'seek' | 'loop' | 'rate' | 'refresh' | 'register' | 'manual'

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
  /**
   * The clock this schedulable's clips are placed on, read on each tick: a
   * `Cycle` for a track that loops at a length of its own. Absent: the
   * transport. When it is swapped for another, or its loop length changes,
   * the next pass moves the schedulable over: what it was handed belonged to
   * the old clock and is let go (what sounds fades over a few milliseconds),
   * and one that `joinsLate` is entered where the new clock stands inside
   * its clips. `refresh()` makes that pass happen at once.
   */
  readonly timebase?: Timebase
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
  /**
   * The transport runs at `rate` from audio-clock time `at` on (timeline
   * seconds per clock second, `Transport.rate`): what is sounding carries on
   * at that speed, and starts handed over from now on are played at it. Starts
   * not yet begun have been cancelled before this is called and are handed
   * over again at their new times. Also called on registration, with the
   * rate the transport has. Absent: this schedulable plays at the clock's
   * speed whatever the rate, so what it has sounding falls out of step.
   */
  retime?(rate: number, at: number): void
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
// A timeline that is further than this from where it would have run on to was put there.
const FOLD_TOLERANCE_SECONDS = 1e-6

/**
 * A start that was handed over, with the audio-clock time it was handed over
 * for and the counted pass it belongs to (its `iteration` may be of an anchor
 * that has gone). On a schedulable that follows the rate, a change of rate
 * moves that time to where the start would have been had the new rate always
 * held, so `when` plus a length at the current rate is where the clip ends; on
 * one left on the clock it stays put, and a drawn length is already clock
 * seconds.
 */
interface Handover extends ScheduledStart {
  when: number
  pass: number
  /**
   * Handed over on a clock the schedulable has since left, and kept because
   * it could not be let go at once. Its pass number means nothing on the new
   * clock, so it is forgotten as soon as it stops sounding.
   */
  stale?: boolean
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
  /** The clock the last pass ran on, and its loop length then: a change of either moves the schedulable over. */
  base?: Timebase
  baseLengthSec?: number
  /**
   * Set when a loop change folded the timeline to another place, until the
   * next tick: that tick enters the clips the position has landed inside.
   */
  landed?: boolean
}

export class Scheduler {
  readonly tickMs: number
  /** The transport every schedulable without a `timebase` of its own runs on. */
  readonly transport: Transport
  private readonly registrations = new Map<Schedulable, Registration>()
  private readonly tickListeners = new Set<SchedulerTickListener>()
  private timer: ReturnType<typeof setInterval> | null = null
  // The transport's rate as of the last change heard, to move clock times by.
  private rate: number
  // How far the timeline had run at the last pass, and when: a loop change that folds it shows against this.
  private ran: { elapsedSec: number; contextTime: number } | null = null
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
    this.rate = transport.rate
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
      // It may have played at another rate before it came here.
      schedulable.retime?.(this.rate, this.transport.now())
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
    const rate = this.transport.rate
    const nowSec = unwrap(position.positionSec, position.iteration, this.transport.loop)
    this.ran = { elapsedSec: this.transport.elapsed(contextTime), contextTime }

    for (const [schedulable, registration] of this.registrations) {
      // The clock its clips are on: the transport, or a cycle of its own
      // length, on which this pass runs exactly as it would on the transport.
      const base = schedulable.timebase ?? this.transport
      const here = base === this.transport ? position : base.position(contextTime)
      const loop = base.loop
      const anchor = base.anchor
      const hereSec = unwrap(here.positionSec, here.iteration, loop)
      const clips = schedulable.clips()
      // Null unless its clock is not where the last pass left it: it is on
      // another one, or a loop change folded the timeline somewhere else. Then,
      // the clips still sounding from before.
      const keptOver =
        this.movedOver(schedulable, registration, base) ??
        (registration.landed
          ? soundingClips(registration, clips, contextTime, soundingRate(schedulable, rate))
          : null)
      registration.landed = false
      // A lookahead is clock time: at this rate it reaches this far along the timeline.
      const aheadSec = schedulable.lookaheadSec * rate
      let due: ScheduledClip[]
      // Clips to enter partway: the position is already inside them.
      const joins: Handover[] = []
      if (keptOver && schedulable.joinsLate && !registration.fromAnchor) {
        // Somewhere else now: it plays from where its clock stands in its
        // clips, apart from one still sounding as it was left.
        const pass = base.passOf(here.iteration)
        for (const clip of clipsSoundingAt(clips, here.positionSec)) {
          if (keptOver.has(clip.id) || !soundsOnPass(clip, pass, this.currentSeed)) continue
          const start = { clipId: clip.id, iteration: here.iteration, startSec: clip.startSec }
          const when = base.contextTimeAt(start.startSec, start.iteration)
          joins.push({ ...start, when, pass })
        }
      }
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
          lookaheadSec: Math.max(0, contextTime - anchor.contextTime) * rate + aheadSec,
          iteration: anchor.iteration,
          loop,
        })
        // The transport started, or landed, inside these: they play from
        // there rather than waiting for their start to come round again.
        if (schedulable.joinsLate) {
          const pass = base.passOf(anchor.iteration)
          for (const clip of clipsSoundingAt(clips, anchor.positionSec)) {
            if (!soundsOnPass(clip, pass, this.currentSeed)) continue
            const start = { clipId: clip.id, iteration: anchor.iteration, startSec: clip.startSec }
            const when = base.contextTimeAt(start.startSec, start.iteration)
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
            : Math.max(0, hereSec - registration.windowEndSec)
        due = startsInWindow({
          clips,
          positionSec: here.positionSec,
          lookaheadSec: aheadSec,
          iteration: here.iteration,
          loop,
          catchUpSec,
        })
      }
      registration.fromAnchor = false
      registration.windowEndSec = hereSec + aheadSec

      for (const hit of due) {
        const clip = clips.find((candidate) => candidate.id === hit.clipId)
        if (!clip) continue
        // Left to chance, and this pass it sits out: nothing to hand over,
        // and nothing to offer again later.
        const pass = base.passOf(hit.iteration)
        if (!soundsOnPass(clip, pass, this.currentSeed)) continue
        const start: ScheduledStart = {
          clipId: hit.clipId,
          iteration: hit.iteration,
          startSec: clip.startSec,
        }
        const key = scheduleKey(start)
        if (registration.scheduled.has(key)) continue
        const when = base.contextTimeAt(start.startSec, start.iteration)
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
        const stands = soundsOn(clips, start, start.when, contextTime, rate)
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
        if (!start.stale && start.iteration >= here.iteration) continue
        const sounding =
          schedulable.joinsLate === true &&
          soundsOn(clips, start, start.when, contextTime, soundingRate(schedulable, rate))
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
    const rate = this.transport.rate
    for (const [schedulable, registration] of this.registrations) {
      const clips = schedulable.clips()
      const clipRate = soundingRate(schedulable, rate)
      for (const [key, start] of registration.scheduled) {
        const clip = clips.find((candidate) => candidate.id === start.clipId)
        if (clip && scheduleKey({ ...start, startSec: clip.startSec }) === key) {
          const cutShort =
            schedulable.joinsLate === true &&
            clip.durationSec !== undefined &&
            start.when + clip.durationSec / clipRate <= contextTime
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
    if (this.transport.position(contextTime).finished) return
    const rate = this.transport.rate

    for (const [schedulable, registration] of this.registrations) {
      if (!schedulable.joinsLate) continue
      const base = schedulable.timebase ?? this.transport
      const position = base.position(contextTime)
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
      const pass = base.passOf(position.iteration)
      for (const clip of clipsSoundingAt(named, position.positionSec)) {
        if (!soundsOnPass(clip, pass, this.currentSeed)) continue
        const start = { clipId: clip.id, iteration: position.iteration, startSec: clip.startSec }
        const when = base.contextTimeAt(start.startSec, start.iteration)
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
        if (soundsOn(named, start, start.when, contextTime, soundingRate(schedulable, rate))) {
          joins.set(start.clipId, start)
        }
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
      case 'loop': {
        // The transport re-pinned with a new pass number: keys of pending
        // starts are stale, sounding ones are left alone. A loop the position
        // did not fit in has folded it: the timeline, and every cycle on it,
        // is somewhere else, inside clips whose starts it never passed.
        const folded = this.folded()
        for (const registration of this.registrations.values()) {
          registration.windowEndSec = undefined
          // Their pass numbers belong to the anchor that went.
          registration.declined.clear()
          if (folded) registration.landed = true
        }
        this.refresh('loop')
        return
      }
      case 'rate':
        this.retime()
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

  /** Whether the timeline is somewhere other than where it would have run on to since the last pass. */
  private folded(): boolean {
    const ran = this.ran
    if (!ran || this.transport.state !== 'playing') return false
    const now = this.transport.now()
    const expected = ran.elapsedSec + (now - ran.contextTime) * this.rate
    return Math.abs(this.transport.elapsed(now) - expected) > FOLD_TOLERANCE_SECONDS
  }

  /**
   * Null unless `schedulable` is on another clock than its last pass ran on
   * (a different `timebase`, or a cycle whose length changed). Then what it
   * was handed is let go and its window starts afresh. Clips it `keeps` are
   * left sounding as the old clock had them, and their ids are returned:
   * they are not entered again on the new one while they do.
   */
  private movedOver(
    schedulable: Schedulable,
    registration: Registration,
    base: Timebase,
  ): Set<string> | null {
    const lengthSec = base.loop.lengthSec
    const changed =
      registration.base !== undefined &&
      (registration.base !== base ||
        (base !== this.transport && registration.baseLengthSec !== lengthSec))
    registration.base = base
    registration.baseLengthSec = lengthSec
    if (!changed) return null
    const kept = new Set<string>()
    for (const [key, start] of [...registration.scheduled]) {
      if (schedulable.keeps?.(key)) {
        start.stale = true
        kept.add(start.clipId)
        continue
      }
      schedulable.cancel(key, REJOIN_FADE_SECONDS)
      registration.scheduled.delete(key)
    }
    registration.declined.clear()
    registration.windowEndSec = undefined
    return kept
  }

  /**
   * The transport's rate changed. Stopped or paused there is nothing in
   * flight, and each schedulable only has to know the speed its next starts
   * play at. Playing, starts not yet begun are cancelled and handed over
   * again at their new clock times, as after an edit; what sounds is told to
   * carry on at the new speed, and its handover moves to where its start
   * would have been at that speed, so its end is still found by the clock.
   */
  private retime(): void {
    const rate = this.transport.rate
    const previous = this.rate
    this.rate = rate
    // Where the transport re-pinned: the moment the old rate gave way to the new.
    const at = this.transport.anchor?.contextTime ?? this.transport.now()
    if (this.transport.state !== 'playing') {
      for (const schedulable of this.registrations.keys()) schedulable.retime?.(rate, at)
      return
    }
    this.cancelPending()
    const scale = previous / rate
    for (const [schedulable, registration] of this.registrations) {
      // Nothing declined has begun, so those starts are where the new rate puts them.
      for (const start of registration.declined.values()) {
        start.when = at + (start.when - at) * scale
      }
      // What is sounding only moves to the new rate on a schedulable that
      // follows it; one left on the clock keeps the time it was handed over
      // for, which is where its end is still found.
      if (!schedulable.retime) continue
      for (const start of registration.scheduled.values()) {
        start.when = at + (start.when - at) * scale
      }
      schedulable.retime(rate, at)
    }
    this.tick('rate')
  }

  private silence(fadeSec: number): void {
    for (const schedulable of this.registrations.keys()) schedulable.cancelAll(fadeSec)
  }

  /** Forgets every handed-over start and every window; the next tick starts from the anchor. */
  private reset(): void {
    this.ran = null
    for (const registration of this.registrations.values()) {
      registration.scheduled.clear()
      registration.declined.clear()
      registration.windowEndSec = undefined
      registration.fromAnchor = true
      registration.landed = false
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
 * How fast a schedulable reads what it has sounding: one that follows the
 * transport's rate (`retime`) plays its clips that much faster or slower, one
 * without stays on the clock whatever the rate, so its clips take their drawn
 * length in clock seconds.
 */
function soundingRate(schedulable: Schedulable, rate: number): number {
  return schedulable.retime ? rate : 1
}

/** The clips with a start handed over that is still sounding. */
function soundingClips(
  registration: Registration,
  clips: ClipWindow['clips'],
  contextTime: number,
  rate: number,
): Set<string> {
  const sounding = new Set<string>()
  for (const start of registration.scheduled.values()) {
    if (soundsOn(clips, start, start.when, contextTime, rate)) sounding.add(start.clipId)
  }
  return sounding
}

/**
 * Whether the clip `start` names is still where that start was drawn and, begun
 * at `when` on the audio clock and played at `rate`, not yet over at `contextTime`.
 */
function soundsOn(
  clips: ClipWindow['clips'],
  start: ScheduledStart,
  when: number,
  contextTime: number,
  rate: number,
): boolean {
  const clip = clips.find((candidate) => candidate.id === start.clipId)
  return (
    clip?.durationSec !== undefined &&
    scheduleKey({ ...start, startSec: clip.startSec }) === scheduleKey(start) &&
    contextTime < when + clip.durationSec / rate
  )
}

/** Timeline seconds since pass 0 began — a monotonic coordinate across loop wraps. */
function unwrap(positionSec: number, iteration: number, loop: TransportLoop): number {
  return isLooping(loop) ? iteration * loop.lengthSec + positionSec : positionSec
}

function assertNever(value: never): never {
  throw new Error(`Unhandled transport change: ${String(value)}`)
}
