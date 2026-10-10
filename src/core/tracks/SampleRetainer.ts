// Keeps the samples a track is about to play, or is playing, out of eviction.
//
// A Schedulable registered next to the track's own two (preload, playback):
// it reads the same clip list through a window that reaches as far ahead as
// the track's preload, and takes a hold on a start's sample the moment the
// start enters that window. The hold lasts until the clip has ended on the
// audio clock (plus a grace period); a start the scheduler cancels — a moved
// clip, a seek, a stop — releases at once. The track itself is untouched: an
// `AudioTrack` from U5 gains eviction safety by having one of these attached
// alongside it.

import { type Clip } from '../clips/Clip'
import { clipSourceOnPass } from '../clips/turns'
import { type ClipWindow } from '../clips/window'
import { scheduleKey, type ScheduledStart } from '../transport/anchor'
import { type Timebase } from '../transport/Cycle'
import { type Schedulable, type Scheduler } from '../transport/Scheduler'
import { type SampleStore } from './SampleStore'

/** What the retainer reads from a track: its clips and how far ahead it looks. */
export interface RetainedTrack {
  clips: { all(): readonly Clip[]; get(id: string): Clip | undefined }
  lookaheadSec: number
  preloadSec: number
  /** The track's own clock, when it loops at a length of its own. */
  readonly timebase?: Timebase
}

export interface SampleRetainerOptions {
  samples: SampleStore
  track: RetainedTrack
  /** Audio clock in seconds (the engine clock). */
  now: () => number
  /**
   * Seconds a hold outlives its clip's end, so a fade pulled in late or a
   * throttled timer never frees a sample still sounding. Default 1.
   */
  graceSec?: number
  /** Register with this scheduler on construction. */
  scheduler?: Scheduler
  /**
   * Whether the track plays a clip's `turns`. Default true; false holds
   * `clip.sourceId` on every pass (a `StretchTrack` ignores turns).
   */
  turns?: boolean
}

export const DEFAULT_RETAIN_GRACE_SECONDS = 1

interface Hold {
  sourceId: string
  /** Audio-clock time the start is due. */
  startsAt: number
  /** Audio-clock time the hold expires. */
  endsAt: number
  release: () => void
}

export class SampleRetainer implements Schedulable {
  /** A clip the track enters partway needs its sample held as much as one played from its start. */
  readonly joinsLate = true
  private readonly samples: SampleStore
  private readonly track: RetainedTrack
  private readonly now: () => number
  private readonly graceSec: number
  private readonly turns: boolean
  private readonly holdMap = new Map<string, Hold>()
  private unregister: (() => void) | null = null
  // The clock of the scheduler it is on: what a pass is counted on for a track with no clock of its own.
  private transport: Timebase | null = null

  constructor(options: SampleRetainerOptions) {
    this.samples = options.samples
    this.track = options.track
    this.now = options.now
    this.graceSec = options.graceSec ?? DEFAULT_RETAIN_GRACE_SECONDS
    this.turns = options.turns ?? true
    if (options.scheduler) this.attach(options.scheduler)
  }

  /** As far ahead as the track decodes, so a hold exists before the sample does. */
  get lookaheadSec(): number {
    return Math.max(this.track.lookaheadSec, this.track.preloadSec)
  }

  /** Holds follow the clock the track's starts are on. */
  get timebase(): Timebase | undefined {
    return this.track.timebase
  }

  /** Read on every scheduler tick — which is when expired holds are let go. */
  clips(): ClipWindow['clips'] {
    this.prune()
    return this.track.clips.all()
  }

  schedule(start: ScheduledStart, when: number): boolean {
    const clip = this.track.clips.get(start.clipId)
    if (!clip) return true
    const key = scheduleKey(start)
    // A clip that takes turns is held by the source this start plays (`Clip.turns`).
    const base = this.track.timebase ?? this.transport
    const sourceId = this.turns
      ? clipSourceOnPass(clip, base ? base.passOf(start.iteration) : 0)
      : clip.sourceId
    this.holdMap.get(key)?.release()
    this.holdMap.set(key, {
      sourceId,
      startsAt: when,
      endsAt: when + clip.durationSec + this.graceSec,
      release: this.samples.retain(sourceId),
    })
    return true
  }

  cancel(key: string): void {
    const hold = this.holdMap.get(key)
    if (!hold) return
    hold.release()
    this.holdMap.delete(key)
  }

  /** Releases holds whose start has not come yet; the scheduler re-derives them. */
  cancelPending(): string[] {
    const now = this.now()
    const cancelled: string[] = []
    for (const [key, hold] of [...this.holdMap]) {
      if (hold.startsAt <= now) continue
      hold.release()
      this.holdMap.delete(key)
      cancelled.push(key)
    }
    return cancelled
  }

  cancelAll(_fadeSec: number): void {
    this.releaseAll()
  }

  /** Register with a scheduler (idempotent). */
  attach(scheduler: Scheduler): void {
    this.detach()
    this.transport = scheduler.transport
    this.unregister = scheduler.register(this)
  }

  detach(): void {
    if (!this.unregister) return
    this.unregister()
    this.unregister = null
    this.transport = null
  }

  /** Schedule keys currently holding a sample. */
  heldKeys(): string[] {
    return [...this.holdMap.keys()]
  }

  /** Source ids currently held, in the order their holds were taken. */
  heldSourceIds(): string[] {
    return [...new Set([...this.holdMap.values()].map((hold) => hold.sourceId))]
  }

  /** Let go of holds whose clips have ended. Runs on every tick; safe to call directly. */
  prune(): void {
    const now = this.now()
    for (const [key, hold] of [...this.holdMap]) {
      if (hold.endsAt > now) continue
      hold.release()
      this.holdMap.delete(key)
    }
  }

  dispose(): void {
    this.detach()
    this.releaseAll()
  }

  private releaseAll(): void {
    for (const hold of this.holdMap.values()) hold.release()
    this.holdMap.clear()
  }
}
