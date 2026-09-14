// Clip playback on the audio clock. Each scheduled clip becomes one voice: a
// buffer source with its own gain envelope (and an optional loudness trim),
// into the track's destination bus.
//
// Two envelope families, each a verbatim lift so its consumer's recorded
// AudioParam events do not change:
// - `linear`: ambient-live `clip-player.ts` (`play` with late join and linear
//   ramps against the clip's own timeline, `stopPending`, `stop`, `stopAll`).
// - `equalPower`: Breathwork Live `musicEngine.ts` `scheduleEntry` (sin/cos
//   `setValueCurveAtTime` fades, `10^(gainDb/20)` trim capped at ±12 dB,
//   `source.start(startAt)` / `source.stop(startAt + duration)`, a start that
//   has passed plays from now) and `fadeOutSounding`.
//
// The track is also two Schedulables for the engine's Scheduler: playback
// (lookaheadSec) and preload (preloadSec) over the same clip list. Adapters
// that keep their own scheduling (Breathwork Live's SectionPlaylist) drive the
// imperative voice API — `play`, `fadeOut`, `stop`, `stopAll` — directly.
//
// Voices leave the track through its ChannelStrip, which creates no nodes
// until pan, level, mute, solo, an insert or a send is first used; until then
// each voice connects straight to the destination as in Phase 0.

import { type Clip, type FadeCurve } from '../clips/Clip'
import { equalPowerFadeIn, equalPowerFadeOut } from '../clips/curves'
import { fadeGain } from '../clips/fade'
import { type ClipWindow } from '../clips/window'
import { scheduleKey, type ScheduledStart } from '../transport/anchor'
import { type Schedulable, type Scheduler } from '../transport/Scheduler'
import {
  ChannelStrip,
  type SoloInPlace,
  type StripDestination,
  type StripHost,
} from './ChannelStrip'
import { ClipList } from './ClipList'
import { type SampleSource, type SampleStore } from './SampleStore'

// --- Constants shared with Breathwork Live (re-exported for its adapter) -----

/** Equal-power crossfade length between tracks and sections. */
export const CROSSFADE_SECONDS = 2.5
/** Longer crossfade used when live steering swaps the current track. */
export const STEER_CROSSFADE_SECONDS = 4
/** Master fade applied by stop(). */
export const STOP_FADE_SECONDS = 0.75
/** Hard cap on a clip's loudness trim (|gainDb|), mirroring Breathwork Live's server. */
export const MAX_CLIP_GAIN_DB = 12
/** ambient-live's scheduling lookahead. */
export const DEFAULT_LOOKAHEAD_SECONDS = 0.2

/** Linear gain for a dB trim, clamped to ±MAX_CLIP_GAIN_DB. */
export function trimGain(gainDb: number | undefined): number {
  const clamped = Math.min(MAX_CLIP_GAIN_DB, Math.max(-MAX_CLIP_GAIN_DB, gainDb ?? 0))
  return 10 ** (clamped / 20)
}

// --- Voices -------------------------------------------------------------------

/** What `play` needs: a decoded buffer plus the clip's slice and envelope. */
export interface ClipVoiceOptions {
  buffer: AudioBuffer
  /** Where playback enters the source. */
  offsetSec: number
  /** How much of the source is audible. */
  durationSec: number
  fadeInSec: number
  fadeOutSec: number
  fadeCurve: FadeCurve
  /** Loudness trim in dB (clamped to ±12); 0 or undefined connects at unity. */
  gainDb?: number
  /** Loop the source for the clip's duration. */
  loop?: boolean
  /** Source region the loop cycles over (default: `offsetSec` to the source end). */
  loopStartSec?: number
  loopEndSec?: number
}

export interface ClipVoice {
  readonly key: string
  readonly source: AudioBufferSourceNode
  readonly gain: GainNode
  readonly trim: GainNode | null
  readonly fadeCurve: FadeCurve
  /** Audio-clock time the source starts (after any late join). */
  readonly startTime: number
  /** Audio-clock time the voice ends (may be pulled in by `fadeOut`/`stop`). */
  endTime: number
}

export interface AudioTrackOptions {
  name: string
  /** Where voices connect: a bus (its input), a group, or a raw node. */
  destination: StripDestination
  /** The engine's solo registry, so this track's strip takes part in solo-in-place. */
  solo?: SoloInPlace
  samples: SampleStore
  /** Audio clock in seconds (the engine clock). */
  now: () => number
  /** How far ahead of the audio clock clip starts are handed to the graph. Default 0.2. */
  lookaheadSec?: number
  /** How far ahead decoding starts (Breathwork Live: 12). Default = lookaheadSec. */
  preloadSec?: number
  /**
   * Maps a clip to something the SampleStore can decode when the clip's
   * source is not loaded yet. Without it, unloaded clips are skipped until
   * the app loads them.
   */
  resolveSource?: (clip: Clip) => SampleSource | undefined
  /** Register with this scheduler on construction. */
  scheduler?: Scheduler
}

export class AudioTrack implements StripHost {
  readonly name: string
  readonly clips: ClipList
  /** Pan, fader, mute/solo, inserts and post-fader sends; node-free until first used. */
  readonly strip: ChannelStrip
  lookaheadSec: number
  preloadSec: number
  private readonly ctx: BaseAudioContext
  private readonly samples: SampleStore
  private readonly now: () => number
  private readonly resolveSource: ((clip: Clip) => SampleSource | undefined) | null
  private readonly active = new Map<string, ClipVoice>()
  private scheduler: Scheduler | null = null
  private unregister: (() => void)[] = []
  private disposed = false

  /** The Schedulable that hands clip starts to the graph. */
  readonly playback: Schedulable
  /** The Schedulable that starts decoding ahead of playback. */
  readonly preload: Schedulable

  constructor(ctx: BaseAudioContext, options: AudioTrackOptions) {
    this.ctx = ctx
    this.name = options.name
    this.strip = new ChannelStrip(ctx, {
      name: options.name,
      destination: options.destination,
      solo: options.solo,
    })
    this.samples = options.samples
    this.now = options.now
    this.lookaheadSec = options.lookaheadSec ?? DEFAULT_LOOKAHEAD_SECONDS
    this.preloadSec = options.preloadSec ?? this.lookaheadSec
    this.resolveSource = options.resolveSource ?? null
    this.clips = new ClipList(() => this.scheduler?.refresh())

    // Lookaheads are read on every tick, so later writes to the track apply.
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
      (start) => this.preloadStart(start),
    )

    if (options.scheduler) this.attach(options.scheduler)
  }

  /** Register both schedulables with a scheduler (idempotent). */
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
  voices(): readonly ClipVoice[] {
    return [...this.active.values()].sort((a, b) => a.startTime - b.startTime)
  }

  voice(key: string): ClipVoice | undefined {
    return this.active.get(key)
  }

  /**
   * Start a voice at `when` on the audio clock, tagged with a caller key.
   * Returns null when there is nothing left to play.
   */
  play(key: string, options: ClipVoiceOptions, when: number): ClipVoice | null {
    if (this.disposed || options.durationSec <= 0) return null
    const voice =
      options.fadeCurve === 'equalPower'
        ? this.playEqualPower(key, options, when)
        : this.playLinear(key, options, when)
    if (!voice) return null
    const previous = this.active.get(key)
    if (previous && previous !== voice) this.silence(previous)
    this.active.set(key, voice)
    return voice
  }

  /**
   * Fade the voice under `key` out over `seconds` from `at` and stop it, or
   * silence it at `at` if it has not started yet (Breathwork Live's
   * `fadeOutSounding`). Voices already past their end are left alone.
   */
  fadeOut(key: string, at: number, seconds: number): void {
    const voice = this.active.get(key)
    if (!voice) return
    if (voice.startTime <= at && at < voice.endTime) {
      this.fadeOutVoice(key, at, seconds)
    } else if (voice.startTime > at) {
      this.stopSource(voice, at)
      voice.endTime = at
    }
  }

  /**
   * Unconditional fade: cancel the voice's scheduled envelope at `at`, fade
   * out over `seconds` and stop after — whatever its timing. Adapters that
   * keep their own timeline (Breathwork Live's SectionPlaylist decides
   * sounding vs pending from its planned entries) use this and `stop(key, at)`
   * directly; `fadeOut` is the convenience that decides from voice timing.
   */
  fadeOutVoice(key: string, at: number, seconds: number): void {
    const voice = this.active.get(key)
    if (!voice) return
    voice.gain.gain.cancelScheduledValues(at)
    if (voice.fadeCurve === 'equalPower') {
      voice.gain.gain.setValueCurveAtTime(equalPowerFadeOut(), at, seconds)
    } else {
      // Anchor at the current value so a fade-out landing mid-fade-in ramps
      // from where the gain is, not from the cancelled ramp's start value.
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, at)
      voice.gain.gain.linearRampToValueAtTime(0, at + seconds)
    }
    this.stopSource(voice, at + seconds)
    voice.endTime = Math.min(voice.endTime, at + seconds)
  }

  /**
   * Silence the voice under `key`. Without `at`: immediately, disconnecting it
   * (ambient-live). With `at`: schedule `source.stop(at)` and let it end there.
   */
  stop(key: string, at?: number): void {
    const voice = this.active.get(key)
    if (!voice) return
    if (at === undefined) {
      this.silence(voice)
    } else {
      this.stopSource(voice, at)
      voice.endTime = Math.min(voice.endTime, at)
    }
  }

  /**
   * Cancel voices that have not started yet and return their keys, so an edit
   * can be rescheduled without cutting audio already in flight.
   */
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

  /**
   * Silence everything, started or not. Without `at`: immediately
   * (ambient-live `stopAll`). With `at`: every source stops at `at`
   * (Breathwork Live `stop()` stops sources at `now + STOP_FADE_SECONDS`
   * while the master fades).
   */
  stopAll(options: { at?: number } = {}): void {
    for (const voice of [...this.active.values()]) {
      if (options.at === undefined) this.silence(voice)
      else {
        this.stopSource(voice, options.at)
        voice.endTime = Math.min(voice.endTime, options.at)
      }
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.detach()
    this.stopAll()
    this.strip.dispose()
  }

  // --- Schedulable hooks ------------------------------------------------------

  private scheduleStart(start: ScheduledStart, when: number): boolean {
    const clip = this.clips.get(start.clipId)
    if (!clip) return false
    const sample = this.samples.get(clip.sourceId)
    if (!sample) {
      this.requestLoad(clip)
      return false
    }
    const key = scheduleKey(start)
    this.play(
      key,
      {
        buffer: sample.buffer,
        offsetSec: clip.offsetSec,
        durationSec: clip.durationSec,
        fadeInSec: clip.fadeInSec,
        fadeOutSec: clip.fadeOutSec,
        fadeCurve: clip.fadeCurve,
        gainDb: clip.gainDb,
        loop: clip.loop,
        loopStartSec: clip.loopStartSec,
        loopEndSec: clip.loopEndSec,
      },
      when,
    )
    return true
  }

  private preloadStart(start: ScheduledStart): boolean {
    const clip = this.clips.get(start.clipId)
    if (clip) this.requestLoad(clip)
    return true
  }

  private requestLoad(clip: Clip): void {
    if (this.samples.has(clip.sourceId) || this.samples.loading(clip.sourceId)) return
    const source = this.resolveSource?.(clip)
    if (source === undefined) return
    this.samples.load(clip.sourceId, source).catch(() => {
      // Failed fetch/decode: the clip is skipped; the schedule stands.
    })
  }

  // --- Voice construction -----------------------------------------------------

  /** ambient-live `ClipPlayer.play`, verbatim. */
  private playLinear(key: string, playback: ClipVoiceOptions, when: number): ClipVoice | null {
    // A start that has already passed joins the clip partway in rather than
    // replaying it from the trim point and overrunning its end.
    const late = Math.max(0, this.now() - when)
    if (late >= playback.durationSec) return null
    const start = when + late
    const end = when + playback.durationSec

    const source = this.ctx.createBufferSource()
    const gain = this.ctx.createGain()
    source.buffer = playback.buffer
    source.connect(gain)
    const trim = this.connectThroughTrim(gain, playback.gainDb)

    // Linear ramps against the clip's own timeline, so the drawn fade slope is
    // the applied gain even when the clip is joined late.
    const fadeInEnd = when + Math.min(playback.fadeInSec, playback.durationSec)
    const fadeOutStart = Math.max(fadeInEnd, end - playback.fadeOutSec)
    gain.gain.setValueAtTime(
      fadeGain(late, playback.durationSec, playback.fadeInSec, playback.fadeOutSec),
      start,
    )
    if (fadeInEnd > start) gain.gain.linearRampToValueAtTime(1, fadeInEnd)
    if (playback.fadeOutSec > 0) {
      if (fadeOutStart > start) gain.gain.setValueAtTime(1, fadeOutStart)
      gain.gain.linearRampToValueAtTime(0, end)
    }

    const voice: ClipVoice = {
      key,
      source,
      gain,
      trim,
      fadeCurve: 'linear',
      startTime: start,
      endTime: end,
    }
    source.onended = () => this.forget(voice)
    if (playback.loop) {
      source.loop = true
      source.loopStart = playback.loopStartSec ?? playback.offsetSec
      source.loopEnd = playback.loopEndSec ?? playback.buffer.duration
      // A late join lands inside the region, not past its end on the source tail.
      source.start(
        start,
        wrapIntoRegion(playback.offsetSec + late, source.loopStart, source.loopEnd),
      )
      this.stopSource(voice, end)
    } else {
      source.start(start, playback.offsetSec + late, playback.durationSec - late)
    }
    return voice
  }

  /** Breathwork Live `MusicEngine.scheduleEntry`, verbatim. */
  private playEqualPower(key: string, playback: ClipVoiceOptions, when: number): ClipVoice | null {
    const startAt = Math.max(when, this.now())
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, startAt)
    gain.gain.setValueCurveAtTime(equalPowerFadeIn(), startAt, playback.fadeInSec)
    gain.gain.setValueCurveAtTime(
      equalPowerFadeOut(),
      startAt + playback.durationSec - playback.fadeOutSec,
      playback.fadeOutSec,
    )
    // Per-clip loudness trim (LUFS normalization): the fade gain chains
    // through a constant trim node of 10^(gainDb/20). Absent gainDb (or a
    // 0 dB trim) connects straight through at unity.
    const trim = this.connectThroughTrim(gain, playback.gainDb)

    const source = this.ctx.createBufferSource()
    source.buffer = playback.buffer
    source.connect(gain)
    if (playback.loop) {
      source.loop = true
      source.loopStart = playback.loopStartSec ?? playback.offsetSec
      source.loopEnd = playback.loopEndSec ?? playback.buffer.duration
    }
    if (playback.offsetSec > 0) source.start(startAt, playback.offsetSec)
    else source.start(startAt)
    const voice: ClipVoice = {
      key,
      source,
      gain,
      trim,
      fadeCurve: 'equalPower',
      startTime: startAt,
      endTime: startAt + playback.durationSec,
    }
    this.stopSource(voice, startAt + playback.durationSec)
    source.onended = () => this.forget(voice)
    return voice
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

  private stopSource(voice: ClipVoice, at: number): void {
    try {
      voice.source.stop(at)
    } catch {
      // Already stopped, or a mock that rejects pre-scheduled stops; harmless.
    }
  }

  private silence(voice: ClipVoice): void {
    voice.source.onended = null
    try {
      voice.source.stop()
    } catch {
      // Already stopped — nothing left to silence.
    }
    voice.source.disconnect()
    voice.gain.disconnect()
    voice.trim?.disconnect()
    this.strip.forgetSource(voice.trim ?? voice.gain)
    this.active.delete(voice.key)
  }

  private forget(voice: ClipVoice): void {
    if (this.active.get(voice.key) !== voice) return
    this.active.delete(voice.key)
    voice.source.disconnect()
    voice.gain.disconnect()
    voice.trim?.disconnect()
    this.strip.forgetSource(voice.trim ?? voice.gain)
  }
}

/** Fold a source position into a loop region once it runs past the region's end. */
function wrapIntoRegion(sourceSec: number, startSec: number, endSec: number): number {
  if (endSec <= startSec || sourceSec < endSec) return sourceSec
  return startSec + ((sourceSec - startSec) % (endSec - startSec))
}

/** A Schedulable whose lookahead and clips are read live from the track. */
export class TrackSchedulable implements Schedulable {
  private readonly readLookahead: () => number
  readonly clips: () => ClipWindow['clips']
  readonly schedule: (start: ScheduledStart, when: number) => boolean
  readonly cancel: (key: string) => void
  readonly cancelPending: () => string[]
  readonly cancelAll: (fadeSec: number) => void

  constructor(
    readLookahead: () => number,
    clips: () => ClipWindow['clips'],
    schedule: (start: ScheduledStart, when: number) => boolean,
    cancels: Partial<Pick<Schedulable, 'cancel' | 'cancelPending' | 'cancelAll'>> = {},
  ) {
    this.readLookahead = readLookahead
    this.clips = clips
    this.schedule = schedule
    this.cancel = cancels.cancel ?? (() => {})
    this.cancelPending = cancels.cancelPending ?? (() => [])
    this.cancelAll = cancels.cancelAll ?? (() => {})
  }

  get lookaheadSec(): number {
    return this.readLookahead()
  }
}

export type { ClipWindow }
