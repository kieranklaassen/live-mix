// A clip track whose voices play through `StretchSource` (signalsmith-stretch):
// tempo-synced rates from the clip's warp markers on the engine's tempo map,
// pitch from `semitones`, and looping over a source region that can be
// entered anywhere — the one thing a buffer voice cannot do, and what the
// session grid's legato launches need (U31). Same shape as `AudioTrack`
// (`clips`, `strip`, `attach/detach`, `voices()`, `fadeOutVoice`, `stop`,
// `stopAll`), so the scheduler, the score renderer and the session address
// it the same way.
//
// Stretch nodes are built ahead of playback: the preload schedulable creates
// one `StretchSource` per upcoming start (worklet + buffer upload are async),
// the playback schedulable declines a start whose source is not ready yet so
// the scheduler offers it again next tick (and the offline renderer awaits
// `settled()` before re-ticking).

import { type Clip } from '../clips/Clip'
import { equalPowerFadeIn, equalPowerFadeOut } from '../clips/curves'
import { fadeGain } from '../clips/fade'
import { type ClipWindow } from '../clips/window'
import { type TempoMap } from '../time/TempoMap'
import {
  StretchSource,
  warpRateAt,
  warpSegments,
  warpSourceSecAt,
  type StretchNodeFactory,
  type StretchSourceOptions,
  type WarpSegment,
} from '../sources/StretchSource'
import { scheduleKey, type ScheduledStart } from '../transport/anchor'
import { type Scheduler, type Schedulable } from '../transport/Scheduler'
import { DEFAULT_LOOKAHEAD_SECONDS, TrackSchedulable, trimGain } from './AudioTrack'
import {
  ChannelStrip,
  type SoloInPlace,
  type StripDestination,
  type StripHost,
} from './ChannelStrip'
import { ClipList } from './ClipList'
import { type SampleSource, type SampleStore } from './SampleStore'

export type TimeoutId = ReturnType<typeof setTimeout>

/** How far ahead stretch sources are built by default: worklet + upload need more than a lookahead. */
export const DEFAULT_STRETCH_PRELOAD_SECONDS = 1.5

export interface StretchTrackOptions {
  name: string
  destination: StripDestination
  solo?: SoloInPlace
  samples: SampleStore
  /** Audio clock in seconds (the engine clock). */
  now: () => number
  /** The tempo map warp markers are resolved against (read at play time: `() => engine.tempo`). */
  tempo: () => TempoMap
  /** `SignalsmithStretch` from `signalsmith-stretch`, or a compatible factory. */
  createStretch: StretchNodeFactory
  /** Quality preset / block settings for every stretch node. */
  configure?: StretchSourceOptions['configure']
  /** How far ahead starts are handed to the graph. Default 0.2. */
  lookaheadSec?: number
  /** How far ahead sources are built. Default 1.5. */
  preloadSec?: number
  resolveSource?: (clip: Clip) => SampleSource | undefined
  scheduler?: Scheduler
  /** Injectable timers (fake in tests); default to the globals. */
  setTimeoutFn?: (callback: () => void, ms: number) => TimeoutId
  clearTimeoutFn?: (id: TimeoutId) => void
}

export interface StretchVoice {
  readonly key: string
  readonly clipId: string
  readonly source: StretchSource
  readonly gain: GainNode
  readonly trim: GainNode | null
  readonly fadeCurve: Clip['fadeCurve']
  readonly startTime: number
  endTime: number
}

interface Prepared {
  source: StretchSource
  sourceId: string
}

export class StretchTrack implements StripHost {
  readonly kind = 'stretch' as const
  readonly name: string
  readonly clips: ClipList
  readonly strip: ChannelStrip
  lookaheadSec: number
  preloadSec: number
  readonly playback: Schedulable
  readonly preload: Schedulable
  private readonly ctx: BaseAudioContext
  private readonly samples: SampleStore
  private readonly now: () => number
  private readonly tempo: () => TempoMap
  private readonly createStretch: StretchNodeFactory
  private readonly configure: StretchSourceOptions['configure']
  private readonly resolveSource: ((clip: Clip) => SampleSource | undefined) | null
  private readonly setTimeoutFn: NonNullable<StretchTrackOptions['setTimeoutFn']>
  private readonly clearTimeoutFn: NonNullable<StretchTrackOptions['clearTimeoutFn']>
  private readonly active = new Map<string, StretchVoice>()
  private readonly prepared = new Map<string, Prepared>()
  private readonly preparing = new Map<string, Promise<void>>()
  private readonly endTimers = new Map<StretchVoice, TimeoutId>()
  private scheduler: Scheduler | null = null
  private unregister: (() => void)[] = []
  private disposed = false

  constructor(ctx: BaseAudioContext, options: StretchTrackOptions) {
    this.ctx = ctx
    this.name = options.name
    this.strip = new ChannelStrip(ctx, {
      name: options.name,
      destination: options.destination,
      solo: options.solo,
    })
    this.samples = options.samples
    this.now = options.now
    this.tempo = options.tempo
    this.createStretch = options.createStretch
    this.configure = options.configure
    this.lookaheadSec = options.lookaheadSec ?? DEFAULT_LOOKAHEAD_SECONDS
    this.preloadSec =
      options.preloadSec ?? Math.max(this.lookaheadSec, DEFAULT_STRETCH_PRELOAD_SECONDS)
    this.resolveSource = options.resolveSource ?? null
    this.setTimeoutFn = options.setTimeoutFn ?? ((callback, ms) => setTimeout(callback, ms))
    this.clearTimeoutFn = options.clearTimeoutFn ?? ((id) => clearTimeout(id))
    this.clips = new ClipList(() => this.scheduler?.refresh())
    this.playback = new TrackSchedulable(
      () => this.lookaheadSec,
      () => this.clips.all(),
      (start, when) => this.scheduleStart(start, when),
      {
        cancel: (key) => this.stop(key),
        cancelPending: () => this.stopPending(),
        cancelAll: (fadeSec) => this.stopAll(fadeSec > 0 ? { at: this.now() + fadeSec } : {}),
      },
    )
    this.preload = new TrackSchedulable(
      () => this.preloadSec,
      () => this.clips.all(),
      (start) => this.prepareStart(start),
    )
    if (options.scheduler) this.attach(options.scheduler)
  }

  attach(scheduler: Scheduler): void {
    if (this.scheduler === scheduler) return
    this.detach()
    this.scheduler = scheduler
    this.unregister = [scheduler.register(this.preload), scheduler.register(this.playback)]
  }

  detach(): void {
    for (const off of this.unregister) off()
    this.unregister = []
    this.scheduler = null
  }

  /** Live voices, in start order. */
  voices(): readonly StretchVoice[] {
    return [...this.active.values()].sort((a, b) => a.startTime - b.startTime)
  }

  voice(key: string): StretchVoice | undefined {
    return this.active.get(key)
  }

  /** Stretch sources being built right now. */
  get pendingCount(): number {
    return this.preparing.size
  }

  /** Resolves once every source being built right now is ready (or failed). */
  settled(): Promise<void> {
    return Promise.all([...this.preparing.values()]).then(() => undefined)
  }

  /**
   * Fade the voice under `key` out over `seconds` from `at` and stop it, or
   * silence it at `at` if it has not started yet.
   */
  fadeOut(key: string, at: number, seconds: number): void {
    const voice = this.active.get(key)
    if (!voice) return
    if (voice.startTime <= at && at < voice.endTime) this.fadeOutVoice(key, at, seconds)
    else if (voice.startTime > at) this.stop(key, at)
  }

  /** Unconditional fade: cancel the envelope at `at`, fade out over `seconds`, stop after. */
  fadeOutVoice(key: string, at: number, seconds: number): void {
    const voice = this.active.get(key)
    if (!voice) return
    const end = at + seconds
    voice.gain.gain.cancelScheduledValues(at)
    if (voice.fadeCurve === 'equalPower') {
      voice.gain.gain.setValueCurveAtTime(equalPowerFadeOut(), at, seconds)
    } else {
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, at)
      voice.gain.gain.linearRampToValueAtTime(0, end)
    }
    voice.source.stop(end)
    voice.endTime = Math.min(voice.endTime, end)
    this.armEnd(voice)
  }

  /** Silence the voice under `key`: now (disconnecting it) or at `at`. */
  stop(key: string, at?: number): void {
    const voice = this.active.get(key)
    if (!voice) return
    if (at === undefined) {
      this.silence(voice)
      return
    }
    voice.source.stop(at)
    voice.endTime = Math.min(voice.endTime, at)
    this.armEnd(voice)
  }

  /** Silence every voice that has not started yet; returns their keys. */
  stopPending(): string[] {
    const now = this.now()
    const cancelled: string[] = []
    for (const voice of [...this.active.values()]) {
      if (voice.startTime <= now) continue
      this.silence(voice)
      cancelled.push(voice.key)
    }
    return cancelled
  }

  stopAll(options: { at?: number } = {}): void {
    for (const voice of [...this.active.values()]) {
      if (options.at === undefined) this.silence(voice)
      else this.stop(voice.key, options.at)
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.detach()
    this.stopAll()
    for (const entry of this.prepared.values()) entry.source.dispose()
    this.prepared.clear()
    this.strip.dispose()
  }

  // --- Schedulable hooks --------------------------------------------------------------------

  private scheduleStart(start: ScheduledStart, when: number): boolean {
    const clip = this.clips.get(start.clipId)
    if (!clip) return false
    const key = scheduleKey(start)
    const ready = this.prepared.get(key)
    if (ready?.sourceId !== clip.sourceId) {
      // Not built yet (or built for a source the clip no longer uses): build and decline.
      if (ready) {
        ready.source.dispose()
        this.prepared.delete(key)
      }
      this.prepareStart(start)
      return false
    }
    this.prepared.delete(key)
    const voice = this.play(key, clip, ready.source, when)
    if (!voice) ready.source.dispose()
    return true
  }

  /**
   * Build the stretch source for a start ahead of time (once per start).
   * Returns true only once the node is ready, so the preload schedulable keeps
   * offering the start while the sample decodes or the node is being built —
   * a `true` here would mark the start done and leave construction to the
   * (much shorter) playback lookahead.
   */
  private prepareStart(start: ScheduledStart): boolean {
    const clip = this.clips.get(start.clipId)
    if (!clip) return true
    const key = scheduleKey(start)
    if (this.prepared.has(key)) return true
    if (this.preparing.has(key)) return false
    const sample = this.samples.get(clip.sourceId)
    if (!sample) {
      this.requestLoad(clip)
      return false
    }
    const building = StretchSource.create(this.ctx, {
      id: `${clip.sourceId}@${key}`,
      buffer: sample.buffer,
      createStretch: this.createStretch,
      configure: this.configure,
    })
      .then((source) => {
        if (this.disposed) {
          source.dispose()
          return
        }
        this.prepared.set(key, { source, sourceId: clip.sourceId })
      })
      .catch(() => {
        // The node could not be built: the start is declined until it can.
      })
      .finally(() => {
        this.preparing.delete(key)
      })
    this.preparing.set(key, building)
    return false
  }

  private requestLoad(clip: Clip): void {
    if (this.samples.has(clip.sourceId) || this.samples.loading(clip.sourceId)) return
    const source = this.resolveSource?.(clip)
    if (source === undefined) return
    this.samples.load(clip.sourceId, source).catch(() => {})
  }

  // --- Voice construction ---------------------------------------------------------------------

  /**
   * Start a voice at `when` on the audio clock, joining late if `when` has
   * passed (the position advances along the warp or the loop region).
   */
  play(key: string, clip: Clip, source: StretchSource, when: number): StretchVoice | null {
    if (this.disposed || clip.durationSec <= 0) return null
    const late = Math.max(0, this.now() - when)
    if (late >= clip.durationSec) return null
    const start = when + late
    const durationSec = clip.durationSec - late
    const end = start + durationSec

    const gain = this.ctx.createGain()
    this.applyEnvelope(gain, clip, when, start, end, late)
    const trim = this.connectThroughTrim(gain, clip.gainDb)
    source.connect(gain)

    const loop = clip.loop
      ? {
          startSec: clip.loopStartSec ?? clip.offsetSec,
          endSec: clip.loopEndSec ?? source.durationSec,
        }
      : undefined
    if (clip.warp && clip.warp.length > 0) {
      // The clip enters the source at `offsetSec` (a legato launch carries a
      // position in); place that on the warp's own timeline, add the lateness,
      // and wrap the resulting source position into the loop region.
      const segments = warpSegments(clip.warp, this.tempo(), { clipStartSec: clip.startSec })
      const entryClipSec = warpClipSecAt(segments, clip.offsetSec) + late
      const warp = segmentsFrom(segments, entryClipSec)
      warp[0] = { ...warp[0], sourceSec: wrapIntoLoop(warp[0].sourceSec, loop) }
      source.play({ when: start, warp, semitones: clip.semitones, durationSec, loop })
    } else {
      source.play({
        when: start,
        offsetSec: entryOffset(clip.offsetSec, late, loop),
        semitones: clip.semitones,
        durationSec,
        loop,
      })
    }

    const voice: StretchVoice = {
      key,
      clipId: clip.id,
      source,
      gain,
      trim,
      fadeCurve: clip.fadeCurve,
      startTime: start,
      endTime: end,
    }
    const previous = this.active.get(key)
    if (previous) this.silence(previous)
    this.active.set(key, voice)
    this.armEnd(voice)
    return voice
  }

  private applyEnvelope(
    gain: GainNode,
    clip: Clip,
    when: number,
    start: number,
    end: number,
    late: number,
  ): void {
    const param = gain.gain
    if (clip.fadeCurve === 'equalPower') {
      param.setValueAtTime(0, start)
      param.setValueCurveAtTime(equalPowerFadeIn(), start, clip.fadeInSec)
      param.setValueCurveAtTime(equalPowerFadeOut(), end - clip.fadeOutSec, clip.fadeOutSec)
      return
    }
    const fadeInEnd = when + Math.min(clip.fadeInSec, clip.durationSec)
    const fadeOutStart = Math.max(fadeInEnd, end - clip.fadeOutSec)
    param.setValueAtTime(fadeGain(late, clip.durationSec, clip.fadeInSec, clip.fadeOutSec), start)
    if (fadeInEnd > start) param.linearRampToValueAtTime(1, fadeInEnd)
    if (clip.fadeOutSec > 0) {
      if (fadeOutStart > start) param.setValueAtTime(1, fadeOutStart)
      param.linearRampToValueAtTime(0, end)
    }
  }

  private connectThroughTrim(gain: GainNode, gainDb: number | undefined): GainNode | null {
    const trimValue = trimGain(gainDb)
    if (trimValue !== 1) {
      const trim = this.ctx.createGain()
      trim.gain.value = trimValue
      gain.connect(trim)
      this.strip.connectSource(trim)
      return trim
    }
    this.strip.connectSource(gain)
    return null
  }

  /** Release the voice's nodes shortly after it ends (stretch nodes have no `onended`). */
  private armEnd(voice: StretchVoice): void {
    const existing = this.endTimers.get(voice)
    if (existing !== undefined) this.clearTimeoutFn(existing)
    const delayMs = Math.max(0, (voice.endTime - this.now() + voice.source.latencySec) * 1000)
    const id = this.setTimeoutFn(() => {
      this.endTimers.delete(voice)
      this.forget(voice)
    }, delayMs)
    this.endTimers.set(voice, id)
  }

  private silence(voice: StretchVoice): void {
    const timer = this.endTimers.get(voice)
    if (timer !== undefined) {
      this.clearTimeoutFn(timer)
      this.endTimers.delete(voice)
    }
    this.forget(voice)
  }

  private forget(voice: StretchVoice): void {
    if (this.active.get(voice.key) !== voice) return
    this.active.delete(voice.key)
    voice.source.dispose()
    voice.gain.disconnect()
    voice.trim?.disconnect()
    this.strip.forgetSource(voice.trim ?? voice.gain)
  }
}

/** The warp segments still ahead when joining `lateSec` into the clip, rebased to the join. */
export function segmentsFrom(segments: readonly WarpSegment[], lateSec: number): WarpSegment[] {
  if (segments.length === 0) return []
  const head: WarpSegment = {
    atSec: 0,
    sourceSec: warpSourceSecAt(segments, lateSec),
    rate: warpRateAt(segments, lateSec),
  }
  const rest = segments
    .filter((segment) => segment.atSec > lateSec)
    .map((segment) => ({ ...segment, atSec: segment.atSec - lateSec }))
  return [head, ...rest]
}

/** Where an unwarped voice enters the source when joining `lateSec` late, wrapped into the loop region. */
export function entryOffset(
  offsetSec: number,
  lateSec: number,
  loop: { startSec: number; endSec: number } | undefined,
): number {
  return wrapIntoLoop(offsetSec + lateSec, loop)
}

/** A source position folded into `[startSec, endSec)` once it runs past the region's end. */
export function wrapIntoLoop(
  sourceSec: number,
  loop: { startSec: number; endSec: number } | undefined,
): number {
  if (!loop || loop.endSec <= loop.startSec || sourceSec < loop.endSec) return sourceSec
  const length = loop.endSec - loop.startSec
  return loop.startSec + ((sourceSec - loop.startSec) % length)
}

/**
 * The clip-relative timeline second at which the warp reads `sourceSec` — the
 * inverse of `warpSourceSecAt`. Before the first segment's source position the
 * answer is 0 (the clip cannot start earlier than its first marker).
 */
export function warpClipSecAt(segments: readonly WarpSegment[], sourceSec: number): number {
  if (segments.length === 0) return sourceSec
  let current = segments[0]
  for (const segment of segments) {
    if (segment.sourceSec <= sourceSec) current = segment
    else break
  }
  if (sourceSec <= segments[0].sourceSec) return 0
  return current.rate > 0
    ? current.atSec + (sourceSec - current.sourceSec) / current.rate
    : current.atSec
}

export type { ClipWindow }
