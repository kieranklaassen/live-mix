// Clip playback from streaming `ElementSource`s, through the same envelope
// math and the same Schedulable contract as `AudioTrack` (U18, R34). Each
// scheduled clip becomes one voice: the source's node → a gain carrying the
// clip's fade envelope → an optional loudness trim → the track's destination.
// The envelope events are the ones `AudioTrack` records for the same clip
// (`fadeGain` ramps for `linear`, `setValueCurveAtTime` sin/cos for
// `equalPower`), so a bed moved from a buffer to an element keeps its fades.
//
// What the element API cannot match, and how this track copes:
// - Starts and stops are timer-accurate (tens of milliseconds), not
//   sample-accurate: `element.play()` runs from a timer set for the start
//   time; if the timer fires late the element is re-seeked by the drift. The
//   gain envelope stays on the audio clock and is forced to 0 at the clip end,
//   so fades line up with the drawn clip and nothing outlasts it.
// - One voice per `ElementSource` at a time (one element, one playhead): a
//   start on a source that is already sounding takes it over. Overlapping
//   plays of the same media need two sources.
// - `loop` restarts the media from 0, not from `offsetSec` (elements have no
//   loop points).
// - Late joins seek the element (`offsetSec + late`) instead of passing an
//   offset to `start()`; a seek on streaming media can stall briefly.
// - `stopAll({ at })` / `stop(key, at)` retime the pause; there is no
//   `source.stop(at)` on the audio clock.
// Use it for long beds (ambience); keep anything rhythmic on an `AudioTrack`.

import { type Bus } from '../buses/Bus'
import { type Clip, type FadeCurve } from '../clips/Clip'
import { equalPowerFadeIn, equalPowerFadeOut } from '../clips/curves'
import { fadeGain } from '../clips/fade'
import { type ClipWindow } from '../clips/window'
import { DEFAULT_LOOKAHEAD_SECONDS, trimGain } from '../tracks/AudioTrack'
import { ClipList } from '../tracks/ClipList'
import { scheduleKey, type ScheduledStart } from '../transport/anchor'
import { type Schedulable, type Scheduler } from '../transport/Scheduler'
import { type ElementSource } from './ElementSource'

/** A late timer past this many seconds re-seeks the element to stay on the timeline. */
export const ELEMENT_DRIFT_TOLERANCE_SECONDS = 0.05

export type TimeoutId = ReturnType<typeof setTimeout>

export interface ElementVoiceOptions {
  source: ElementSource
  /** Where playback enters the media. */
  offsetSec: number
  /** How much of the media is audible. */
  durationSec: number
  fadeInSec: number
  fadeOutSec: number
  fadeCurve: FadeCurve
  /** Loudness trim in dB (clamped to ±12); 0 or undefined connects at unity. */
  gainDb?: number
  /** Loop the media for the clip's duration (from 0, see above). */
  loop?: boolean
}

export interface ElementVoice {
  readonly key: string
  readonly source: ElementSource
  readonly gain: GainNode
  readonly trim: GainNode | null
  readonly fadeCurve: FadeCurve
  /** Audio-clock time the element is asked to play (after any late join). */
  readonly startTime: number
  /** Audio-clock time the voice ends (may be pulled in by `fadeOut`/`stop`). */
  endTime: number
}

export interface ElementTrackOptions {
  name: string
  /** Where voices connect: a bus (its input) or a raw node. */
  destination: Bus | AudioNode
  /** Audio clock in seconds (the engine clock). */
  now: () => number
  /** How far ahead of the audio clock clip starts are armed. Default 0.2. */
  lookaheadSec?: number
  /** How far ahead sources are primed (seeked and buffering). Default = lookaheadSec. */
  preloadSec?: number
  /** Sources clips refer to by `sourceId`; more can be added later. */
  sources?: readonly ElementSource[]
  /** Creates or finds the source for a clip whose `sourceId` is not registered yet. */
  resolveSource?: (clip: Clip) => ElementSource | undefined
  /** Register with this scheduler on construction. */
  scheduler?: Scheduler
  /** Injectable timers (fake in tests); default to the globals. */
  setTimeoutFn?: (callback: () => void, ms: number) => TimeoutId
  clearTimeoutFn?: (id: TimeoutId) => void
}

interface VoiceTimers {
  start: TimeoutId | null
  stop: TimeoutId | null
  onEnded: () => void
}

/** A voice with its graph built, waiting for `arm` once it is registered. */
interface BuiltVoice {
  voice: ElementVoice
  /** Where the element is seeked to before it plays. */
  offsetSec: number
}

export class ElementTrack {
  readonly name: string
  readonly clips: ClipList
  lookaheadSec: number
  preloadSec: number
  private readonly ctx: BaseAudioContext
  private readonly destination: AudioNode
  private readonly now: () => number
  private readonly resolveSource: ((clip: Clip) => ElementSource | undefined) | null
  private readonly setTimeoutFn: NonNullable<ElementTrackOptions['setTimeoutFn']>
  private readonly clearTimeoutFn: NonNullable<ElementTrackOptions['clearTimeoutFn']>
  private readonly sourceMap = new Map<string, ElementSource>()
  private readonly active = new Map<string, ElementVoice>()
  private readonly timers = new Map<ElementVoice, VoiceTimers>()
  private scheduler: Scheduler | null = null
  private unregister: (() => void)[] = []
  private disposed = false

  /** The Schedulable that arms clip starts. */
  readonly playback: Schedulable
  /** The Schedulable that primes sources ahead of playback. */
  readonly preload: Schedulable

  constructor(ctx: BaseAudioContext, options: ElementTrackOptions) {
    this.ctx = ctx
    this.name = options.name
    this.destination = isBus(options.destination) ? options.destination.input : options.destination
    this.now = options.now
    this.lookaheadSec = options.lookaheadSec ?? DEFAULT_LOOKAHEAD_SECONDS
    this.preloadSec = options.preloadSec ?? this.lookaheadSec
    this.resolveSource = options.resolveSource ?? null
    this.setTimeoutFn = options.setTimeoutFn ?? ((callback, ms) => setTimeout(callback, ms))
    this.clearTimeoutFn = options.clearTimeoutFn ?? ((id) => clearTimeout(id))
    for (const source of options.sources ?? []) this.addSource(source)
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
      (start) => this.primeStart(start),
    )

    if (options.scheduler) this.attach(options.scheduler)
  }

  // --- Sources ------------------------------------------------------------------

  /** Register a source under its id (replacing any previous one under that id). */
  addSource(source: ElementSource): ElementSource {
    this.sourceMap.set(source.id, source)
    return source
  }

  /** Forget a source; voices playing it are silenced. The source itself is not disposed. */
  removeSource(id: string): boolean {
    const source = this.sourceMap.get(id)
    if (!source) return false
    for (const voice of [...this.active.values()]) {
      if (voice.source === source) this.silence(voice)
    }
    return this.sourceMap.delete(id)
  }

  source(id: string): ElementSource | undefined {
    return this.sourceMap.get(id)
  }

  sources(): readonly ElementSource[] {
    return [...this.sourceMap.values()]
  }

  /** Unlock every registered source from a user gesture (see `ElementSource.unlock`). */
  unlockAll(): Promise<void> {
    return Promise.all([...this.sourceMap.values()].map((source) => source.unlock())).then(() => {})
  }

  // --- Scheduler ----------------------------------------------------------------

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

  // --- Voices -------------------------------------------------------------------

  /** Live voices, in start order. */
  voices(): readonly ElementVoice[] {
    return [...this.active.values()].sort((a, b) => a.startTime - b.startTime)
  }

  voice(key: string): ElementVoice | undefined {
    return this.active.get(key)
  }

  /**
   * Start a voice at `when` on the audio clock, tagged with a caller key.
   * Returns null when there is nothing left to play. A voice already using
   * the same source is silenced first (one playhead per element).
   */
  play(key: string, options: ElementVoiceOptions, when: number): ElementVoice | null {
    if (this.disposed || options.durationSec <= 0) return null
    for (const voice of [...this.active.values()]) {
      if (voice.source === options.source) this.silence(voice)
    }
    const built =
      options.fadeCurve === 'equalPower'
        ? this.playEqualPower(key, options, when)
        : this.playLinear(key, options, when)
    if (!built) return null
    const previous = this.active.get(key)
    if (previous) this.silence(previous)
    this.active.set(key, built.voice)
    this.arm(built.voice, built.offsetSec, options.loop ?? false)
    return built.voice
  }

  /**
   * Fade the voice under `key` out over `seconds` from `at` and pause it, or
   * silence it if it has not started yet (`AudioTrack.fadeOut`).
   */
  fadeOut(key: string, at: number, seconds: number): void {
    const voice = this.active.get(key)
    if (!voice) return
    if (voice.startTime <= at && at < voice.endTime) {
      const end = at + seconds
      voice.gain.gain.cancelScheduledValues(at)
      if (voice.fadeCurve === 'equalPower') {
        voice.gain.gain.setValueCurveAtTime(equalPowerFadeOut(), at, seconds)
      } else {
        // Anchor at the current value so a fade-out landing mid-fade-in ramps
        // from where the gain is, not from the cancelled ramp's start value.
        voice.gain.gain.setValueAtTime(voice.gain.gain.value, at)
        voice.gain.gain.linearRampToValueAtTime(0, end)
      }
      voice.gain.gain.setValueAtTime(0, end)
      this.armStop(voice, end)
      voice.endTime = end
    } else if (voice.startTime > at) {
      this.silence(voice)
    }
  }

  /**
   * Silence the voice under `key`. Without `at`: immediately, disconnecting
   * it. With `at`: retime its pause to `at` and let it end there.
   */
  stop(key: string, at?: number): void {
    const voice = this.active.get(key)
    if (!voice) return
    if (at === undefined) {
      this.silence(voice)
    } else {
      voice.endTime = Math.min(voice.endTime, at)
      this.armStop(voice, voice.endTime)
    }
  }

  /** Cancel voices that have not started yet and return their keys. */
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

  /** Silence everything, started or not; with `at`, every voice pauses at `at`. */
  stopAll(options: { at?: number } = {}): void {
    for (const voice of [...this.active.values()]) {
      if (options.at === undefined) this.silence(voice)
      else {
        voice.endTime = Math.min(voice.endTime, options.at)
        this.armStop(voice, voice.endTime)
      }
    }
  }

  /** Silence voices and leave the scheduler. Sources are left for their owner to dispose. */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.detach()
    this.stopAll()
    this.sourceMap.clear()
  }

  // --- Schedulable hooks ------------------------------------------------------

  private scheduleStart(start: ScheduledStart, when: number): boolean {
    const clip = this.clips.get(start.clipId)
    if (!clip) return false
    const source = this.sourceFor(clip)
    if (!source) return false
    this.play(
      scheduleKey(start),
      {
        source,
        offsetSec: clip.offsetSec,
        durationSec: clip.durationSec,
        fadeInSec: clip.fadeInSec,
        fadeOutSec: clip.fadeOutSec,
        fadeCurve: clip.fadeCurve,
        gainDb: clip.gainDb,
        loop: clip.loop,
      },
      when,
    )
    return true
  }

  private primeStart(start: ScheduledStart): boolean {
    const clip = this.clips.get(start.clipId)
    if (!clip) return true
    const source = this.sourceFor(clip)
    if (source && !this.isSounding(source)) source.prime(clip.offsetSec)
    return true
  }

  private sourceFor(clip: Clip): ElementSource | undefined {
    const registered = this.sourceMap.get(clip.sourceId)
    if (registered) return registered
    const resolved = this.resolveSource?.(clip)
    if (resolved) this.sourceMap.set(clip.sourceId, resolved)
    return resolved
  }

  private isSounding(source: ElementSource): boolean {
    for (const voice of this.active.values()) if (voice.source === source) return true
    return false
  }

  // --- Voice construction -----------------------------------------------------

  /** `AudioTrack.playLinear` (ambient-live `ClipPlayer.play`) on an element. */
  private playLinear(key: string, playback: ElementVoiceOptions, when: number): BuiltVoice | null {
    const late = Math.max(0, this.now() - when)
    if (late >= playback.durationSec) return null
    const start = when + late
    const end = when + playback.durationSec

    const gain = this.ctx.createGain()
    playback.source.node.connect(gain)
    const trim = this.connectThroughTrim(gain, playback.gainDb)

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
    gain.gain.setValueAtTime(0, end)

    const voice: ElementVoice = {
      key,
      source: playback.source,
      gain,
      trim,
      fadeCurve: 'linear',
      startTime: start,
      endTime: end,
    }
    return { voice, offsetSec: playback.offsetSec + late }
  }

  /** `AudioTrack.playEqualPower` (Breathwork Live `scheduleEntry`) on an element. */
  private playEqualPower(
    key: string,
    playback: ElementVoiceOptions,
    when: number,
  ): BuiltVoice | null {
    const startAt = Math.max(when, this.now())
    const end = startAt + playback.durationSec
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, startAt)
    gain.gain.setValueCurveAtTime(equalPowerFadeIn(), startAt, playback.fadeInSec)
    gain.gain.setValueCurveAtTime(
      equalPowerFadeOut(),
      startAt + playback.durationSec - playback.fadeOutSec,
      playback.fadeOutSec,
    )
    gain.gain.setValueAtTime(0, end)
    const trim = this.connectThroughTrim(gain, playback.gainDb)
    playback.source.node.connect(gain)

    const voice: ElementVoice = {
      key,
      source: playback.source,
      gain,
      trim,
      fadeCurve: 'equalPower',
      startTime: startAt,
      endTime: end,
    }
    // Breathwork Live plays from the offset even when the start has passed.
    return { voice, offsetSec: playback.offsetSec }
  }

  private connectThroughTrim(gain: GainNode, gainDb: number | undefined): GainNode | null {
    const trimValue = trimGain(gainDb)
    if (trimValue !== 1) {
      const trim = this.ctx.createGain()
      trim.gain.value = trimValue
      gain.connect(trim)
      trim.connect(this.destination)
      return trim
    }
    gain.connect(this.destination)
    return null
  }

  /** Seek now, play at `voice.startTime` (from a timer), pause at `voice.endTime`. */
  private arm(voice: ElementVoice, offsetSec: number, loop: boolean): void {
    const { source } = voice
    const onEnded = () => this.forget(voice)
    const timers: VoiceTimers = { start: null, stop: null, onEnded }
    this.timers.set(voice, timers)
    source.element.loop = loop
    source.element.addEventListener('ended', onEnded)
    source.seek(offsetSec)

    const begin = () => {
      timers.start = null
      if (this.active.get(voice.key) !== voice) return
      const drift = this.now() - voice.startTime
      if (drift > ELEMENT_DRIFT_TOLERANCE_SECONDS) source.seek(offsetSec + drift)
      void source.play()
    }
    const delayMs = (voice.startTime - this.now()) * 1000
    if (delayMs <= 0) begin()
    else timers.start = this.setTimeoutFn(begin, delayMs)
    this.armStop(voice, voice.endTime)
  }

  private armStop(voice: ElementVoice, at: number): void {
    const timers = this.timers.get(voice)
    if (!timers) return
    if (timers.stop !== null) this.clearTimeoutFn(timers.stop)
    const delayMs = Math.max(0, (at - this.now()) * 1000)
    timers.stop = this.setTimeoutFn(() => {
      timers.stop = null
      if (this.active.get(voice.key) !== voice) return
      voice.source.pause()
      this.forget(voice)
    }, delayMs)
  }

  private release(voice: ElementVoice): void {
    const timers = this.timers.get(voice)
    if (timers) {
      if (timers.start !== null) this.clearTimeoutFn(timers.start)
      if (timers.stop !== null) this.clearTimeoutFn(timers.stop)
      voice.source.element.removeEventListener('ended', timers.onEnded)
      this.timers.delete(voice)
    }
    voice.source.element.loop = false
    try {
      voice.source.node.disconnect(voice.gain)
    } catch {
      // Already disconnected; harmless.
    }
    voice.gain.disconnect()
    voice.trim?.disconnect()
  }

  private silence(voice: ElementVoice): void {
    voice.source.pause()
    this.release(voice)
    this.active.delete(voice.key)
  }

  private forget(voice: ElementVoice): void {
    if (this.active.get(voice.key) !== voice) return
    this.active.delete(voice.key)
    this.release(voice)
  }
}

/** A Schedulable whose lookahead and clips are read live from the track. */
class TrackSchedulable implements Schedulable {
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

function isBus(value: Bus | AudioNode): value is Bus {
  return typeof (value as Bus).addInsert === 'function'
}
