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
// A clip entered partway on purpose (the transport started or landed inside it,
// or it was edited while it sounded) is the linear family's late join with a
// few milliseconds of ease-in, since nothing before it hides the cut
// (`easeInSec`); the voice it replaces after an edit fades out as briefly
// (`release`). An equal-power clip is not entered partway: its envelope is
// written from its start, so it waits for its start to come round.
//
// A reversed clip is the same voice on a mirrored copy of its buffer
// (`reversed-buffer.ts`), entered where `mirrorSlice` says.
//
// The track plays at a rate (`setRate`; the scheduler passes on the
// transport's): a linear voice reads its buffer that much faster or slower, so
// it sounds higher or lower as tape does, and its fades and its end, which are
// drawn on the timeline, fall that much closer or further apart on the clock.
// A change while a voice sounds moves all three from that moment. Equal-power
// voices are Breathwork Live's, which runs on the clock alone: they play at
// the clock's speed whatever the rate.
//
// A placed clip (`pan`, `lowpassHz` or `spaceDb`, see `clips/placement.ts`)
// gets nodes of its own after its envelope: trim → low-pass → panner into the
// strip, and from the low-pass a send into the track's space (`space.ts`),
// which also feeds the strip. Clips of one source on one track can then sit
// in different places at once, and the track's inserts, fader and mute act
// on all of it. The nodes follow the clip while it sounds (`place`). A clip
// that names none of the three is wired exactly as before.
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
import {
  clipLowpassHz,
  clipPan,
  isPlacedClip,
  spaceSendGain,
  type ClipPlacement,
} from '../clips/placement'
import { mirrorSlice } from '../clips/reverse'
import { type ClipWindow } from '../clips/window'
import { holdParamAt } from '../automation/scheduled-param'
import { scheduleKey, type ScheduledStart } from '../transport/anchor'
import { type Schedulable, type Scheduler } from '../transport/Scheduler'
import {
  ChannelStrip,
  type SoloInPlace,
  type StripDestination,
  type StripHost,
} from './ChannelStrip'
import { ClipList } from './ClipList'
import { reversedBuffer } from './reversed-buffer'
import { type SampleSource, type SampleStore } from './SampleStore'
import { generateSpaceImpulse } from './space'

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

/** The ease-in of a clip entered partway, and the fade of the voice it replaces. */
export const JOIN_EASE_SECONDS = 0.005

/** How far down a placed clip's trim reaches: sitting far back costs more than the ±12 dB of a loudness trim. */
export const MIN_PLACED_GAIN_DB = -60
/** Time constant of the approach when a sounding clip's placement or trim changes. */
export const PLACEMENT_RAMP_SECONDS = 0.03
/**
 * Resonance of a placed clip's low-pass, in dB as a Web Audio low-pass takes
 * it: 3 dB down at the cutoff with no bump ahead of it.
 */
const PLACED_LOWPASS_Q_DB = 20 * Math.log10(Math.SQRT1_2)

/** Linear gain for a dB trim, clamped to ±MAX_CLIP_GAIN_DB. */
export function trimGain(gainDb: number | undefined): number {
  const clamped = Math.min(MAX_CLIP_GAIN_DB, Math.max(-MAX_CLIP_GAIN_DB, gainDb ?? 0))
  return 10 ** (clamped / 20)
}

/** Linear gain for a placed clip's trim: capped at +MAX_CLIP_GAIN_DB, down to MIN_PLACED_GAIN_DB. */
export function placedTrimGain(gainDb: number | undefined): number {
  const clamped = Math.min(MAX_CLIP_GAIN_DB, Math.max(MIN_PLACED_GAIN_DB, gainDb ?? 0))
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
  /** Play the slice backwards (`Clip.reversed`). */
  reversed?: boolean
  /** Left to right for this voice alone (`Clip.pan`). */
  pan?: number
  /** Low-pass cutoff for this voice alone (`Clip.lowpassHz`). */
  lowpassHz?: number
  /** Send into the track's space, in dB against the voice's own level (`Clip.spaceDb`). */
  spaceDb?: number
  /**
   * Come up from silence over this long where the voice enters, under its own
   * fades: for a clip entered partway, where there is no silence before it to
   * hide a cut. Linear clips only; 0 or undefined enters at the envelope's value.
   */
  easeInSec?: number
}

/** What `place` moves on a sounding voice: where it sits, and its trim. */
export type VoicePlace = ClipPlacement & Pick<Clip, 'gainDb'>

/** The nodes a placed voice plays through, after its envelope and trim. */
export interface VoicePlacement {
  readonly lowpass: BiquadFilterNode
  readonly panner: StereoPannerNode
  /** The send into the track's space; made when the voice first sends there. */
  send: GainNode | null
}

/** A placed voice's nodes with what each was last told, so a change is sent only once. */
interface PlacedNodes extends VoicePlacement {
  /**
   * A panner halves the power of a mono source at the centre, where an
   * unplaced one reaches both sides whole: the trim makes that up, and the
   * send, taken ahead of the panner, takes it back out.
   */
  readonly makeup: number
  trim: number
  pan: number
  lowpassHz: number
  space: number
}

/**
 * What a linear voice plays, in seconds of its clip, with the clock time its
 * clip starts on at the rate it now plays at: enough to write its envelope
 * again when the rate changes.
 */
interface VoiceTiming {
  /** Audio-clock time the clip's own start falls on at `rate`. */
  when: number
  rate: number
  durationSec: number
  fadeInSec: number
  fadeOutSec: number
  /** Where in the clip the voice came up from silence, and where its envelope took over; equal when it did not ease in. */
  easeFromSec: number
  easeToSec: number
  /** The source is stopped at the clip's end rather than running out by itself (a looping clip). */
  stoppedAtEnd: boolean
}

/** A voice's options once a reversed clip has been turned into positions on its mirrored buffer. */
interface VoicePlayback extends ClipVoiceOptions {
  /** How long the source may sound when that is shorter than the clip; only a reversed clip sets it. */
  soundSec?: number
}

export interface ClipVoice {
  readonly key: string
  readonly source: AudioBufferSourceNode
  readonly gain: GainNode
  readonly trim: GainNode | null
  /** The voice's own low-pass, panner and space send; null for a clip that names no placement. */
  readonly placement: VoicePlacement | null
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
  /**
   * The impulse response of the space this track's clips send into
   * (`Clip.spaceDb`), read when a clip first does. An engine hands every
   * track the same one; without it the track generates the stock room.
   */
  spaceImpulse?: () => AudioBuffer
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
  // The clip each scheduled voice plays, so the voice can follow its edits.
  private readonly voiceClips = new Map<string, string>()
  private readonly spaceImpulse: () => AudioBuffer
  private spaceNode: ConvolverNode | null = null
  private scheduler: Scheduler | null = null
  private unregister: (() => void)[] = []
  private disposed = false
  // What each placed voice's nodes were last told.
  private readonly placed = new WeakMap<ClipVoice, PlacedNodes>()
  // Timeline seconds per second of the audio clock that voices play at.
  private rateValue = 1
  // How each linear voice is timed, for as long as its envelope is the clip's own.
  private readonly timings = new WeakMap<ClipVoice, VoiceTiming>()

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
    this.spaceImpulse = options.spaceImpulse ?? (() => generateSpaceImpulse(ctx))
    this.clips = new ClipList(() => {
      this.scheduler?.refresh()
      this.followClips()
    })

    // Lookaheads are read on every tick, so later writes to the track apply.
    this.playback = new TrackSchedulable(
      () => this.lookaheadSec,
      () => this.clips.audible(),
      (start, when, joining) => this.scheduleStart(start, when, joining),
      {
        cancel: (key, fadeSec) => (fadeSec ? this.release(key, fadeSec) : this.stop(key)),
        cancelPending: () => this.stopPending(),
        cancelAll: (fadeSec) => this.stopAll(fadeSec > 0 ? { at: this.now() + fadeSec } : {}),
      },
      {
        joinsLate: true,
        keeps: (key) => this.keeps(key),
        retime: (rate, at) => this.setRate(rate, at),
      },
    )
    this.preload = new TrackSchedulable(
      () => this.preloadSec,
      () => this.clips.audible(),
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

  /** Timeline seconds per second of the audio clock that this track's voices play at. Default 1. */
  get rate(): number {
    return this.rateValue
  }

  /**
   * Plays the track at another speed from `at` on the audio clock (default:
   * now), as tape does: every linear voice reads its buffer `rate` times as
   * fast, so it sounds higher and shorter or lower and longer, and what is
   * left of its fades and its end move to where the clip now reaches them.
   * Voices started afterwards play at the new rate from their first frame,
   * with `when` still the clock time of the clip's start. A voice that is
   * fading out or has been given a stop time keeps that and only changes
   * pitch. A track on a scheduler is told the transport's rate by it; call
   * this for a track played by hand (`play`).
   */
  setRate(rate: number, at: number = this.now()): void {
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new RangeError(`AudioTrack: rate must be a positive number, got ${rate}`)
    }
    if (rate === this.rateValue) return
    this.rateValue = rate
    for (const voice of this.active.values()) this.retime(voice, rate, at)
  }

  /**
   * Start a voice at `when` on the audio clock, tagged with a caller key.
   * Returns null when there is nothing left to play.
   */
  play(key: string, options: ClipVoiceOptions, when: number): ClipVoice | null {
    if (this.disposed || options.durationSec <= 0) return null
    const playback = options.reversed ? this.mirrored(options) : options
    const voice =
      playback.fadeCurve === 'equalPower'
        ? this.playEqualPower(key, playback, when)
        : this.playLinear(key, playback, when)
    if (!voice) return null
    const previous = this.active.get(key)
    if (previous && previous !== voice) this.silence(previous)
    this.active.set(key, voice)
    return voice
  }

  /**
   * The convolver every placed clip's `spaceDb` sends into, ahead of the
   * strip; null until a clip first sends there.
   */
  get space(): ConvolverNode | null {
    return this.spaceNode
  }

  /**
   * Move the voice under `key` to another place while it sounds: its trim,
   * pan, low-pass and space send approach the new values over a few
   * milliseconds. Only a voice that was started placed can follow; the track
   * does this itself for scheduled clips whenever its clip list changes.
   * Returns whether the voice could be moved.
   */
  place(key: string, to: VoicePlace): boolean {
    const voice = this.active.get(key)
    const nodes = voice ? this.placed.get(voice) : undefined
    if (!voice?.trim || !nodes) return false
    const at = this.ctx.currentTime
    const approach = (param: AudioParam, value: number): void => {
      param.setTargetAtTime(value, at, PLACEMENT_RAMP_SECONDS)
    }
    const trim = placedTrimGain(to.gainDb) * nodes.makeup
    if (trim !== nodes.trim) {
      nodes.trim = trim
      approach(voice.trim.gain, trim)
    }
    const pan = clipPan(to.pan)
    if (pan !== nodes.pan) {
      nodes.pan = pan
      approach(nodes.panner.pan, pan)
    }
    const lowpassHz = clipLowpassHz(to.lowpassHz, this.ctx.sampleRate)
    if (lowpassHz !== nodes.lowpassHz) {
      nodes.lowpassHz = lowpassHz
      approach(nodes.lowpass.frequency, lowpassHz)
    }
    const space = spaceSendGain(to.spaceDb) / nodes.makeup
    if (space !== nodes.space) {
      nodes.space = space
      // A send that did not exist comes up from silence beside the dry path.
      if (nodes.send) approach(nodes.send.gain, space)
      else approach(this.sendToSpace(nodes, 0).gain, space)
    }
    return true
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
      this.endAt(voice, at)
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
    // From here its envelope is this fade, on the clock.
    this.timings.delete(voice)
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
    if (at === undefined) this.silence(voice)
    else this.endAt(voice, at)
  }

  /**
   * Let the voice under `key` go for another that takes its place: one that
   * is sounding fades out over `seconds` from now and is forgotten at once, so
   * the key is free; one that has not started, or `seconds` of 0, is silenced.
   */
  release(key: string, seconds: number): void {
    const voice = this.active.get(key)
    if (!voice) return
    const at = this.now()
    if (seconds <= 0 || voice.startTime > at || at >= voice.endTime) {
      this.silence(voice)
      return
    }
    this.fadeOutVoice(key, at, seconds)
    this.active.delete(key)
    this.voiceClips.delete(key)
    // No longer the key's voice, so `forget` would pass it by.
    voice.source.onended = () => this.unwire(voice)
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
      else this.endAt(voice, options.at)
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.detach()
    this.stopAll()
    try {
      this.spaceNode?.disconnect()
    } catch {
      // Context may already be closed; ignore.
    }
    this.spaceNode = null
    this.strip.dispose()
  }

  // --- Schedulable hooks ------------------------------------------------------

  /**
   * A sounding voice whose clip is equal-power: let go, the clip could not be
   * entered again partway, so a rejoin leaves it as it sounds.
   */
  private keeps(key: string): boolean {
    const voice = this.active.get(key)
    const clipId = this.voiceClips.get(key)
    if (!voice || clipId === undefined) return false
    const now = this.now()
    if (now < voice.startTime || now >= voice.endTime) return false
    return this.clips.get(clipId)?.fadeCurve === 'equalPower'
  }

  private scheduleStart(start: ScheduledStart, when: number, joining = false): boolean {
    const clip = this.clips.get(start.clipId)
    if (!clip) return false
    // An equal-power envelope is written from the clip's start and has no way
    // in partway: taken as handled, it sounds when its start next comes round.
    if (joining && clip.fadeCurve === 'equalPower') return true
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
        reversed: clip.reversed,
        pan: clip.pan,
        lowpassHz: clip.lowpassHz,
        spaceDb: clip.spaceDb,
        easeInSec: joining ? JOIN_EASE_SECONDS : undefined,
      },
      when,
    )
    if (this.active.has(key)) this.voiceClips.set(key, clip.id)
    return true
  }

  /** Every scheduled voice that is placed takes its clip's current place and trim. */
  private followClips(): void {
    for (const [key, clipId] of this.voiceClips) {
      const clip = this.clips.get(clipId)
      if (clip) this.place(key, clip)
    }
  }

  private preloadStart(start: ScheduledStart): boolean {
    const clip = this.clips.get(start.clipId)
    if (!clip) return true
    this.requestLoad(clip)
    if (!clip.reversed) return true
    // The mirrored copy is made ahead of the start, not in the tick that plays
    // it: a `true` marks the start done, so a reversed clip is offered again
    // until its buffer has decoded.
    const sample = this.samples.get(clip.sourceId)
    if (!sample) return false
    reversedBuffer(this.ctx, sample.buffer)
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

  /** The same voice read off the mirrored copy of the buffer. */
  private mirrored(options: ClipVoiceOptions): VoicePlayback {
    return {
      ...options,
      buffer: reversedBuffer(this.ctx, options.buffer),
      ...mirrorSlice(options, options.buffer.duration),
    }
  }

  /**
   * ambient-live `ClipPlayer.play`, verbatim at rate 1, plus the ease-in of a
   * voice entered partway. At another rate the clip's seconds are that much
   * shorter or longer on the clock, and the buffer is read that much faster.
   */
  private playLinear(key: string, playback: VoicePlayback, when: number): ClipVoice | null {
    const rate = this.rateValue
    // A start that has already passed joins the clip partway in rather than
    // replaying it from the trim point and overrunning its end.
    const late = Math.max(0, this.now() - when)
    // How far into the clip that is.
    const lateSec = late * rate
    if (lateSec >= (playback.soundSec ?? playback.durationSec)) return null
    const start = when + late
    const end = when + playback.durationSec / rate

    const source = this.ctx.createBufferSource()
    const gain = this.ctx.createGain()
    source.buffer = playback.buffer
    // Its speed from the first frame, not a change to a sounding voice.
    if (rate !== 1) source.playbackRate.value = rate
    source.connect(gain)
    const { trim, placement } = this.connectVoice(gain, playback)

    // Linear ramps against the clip's own timeline, so the drawn fade slope is
    // the applied gain even when the clip is joined late.
    const fadeInEnd = when + Math.min(playback.fadeInSec, playback.durationSec) / rate
    const fadeOutStart = Math.max(fadeInEnd, end - playback.fadeOutSec / rate)
    // The envelope takes over where the ease-in ends: at the join itself when there is none.
    const easeSec = Math.max(0, Math.min(playback.easeInSec ?? 0, end - start))
    const from = start + easeSec
    if (easeSec > 0) gain.gain.setValueAtTime(0, start)
    const envelopeAtFrom = fadeGain(
      (late + easeSec) * rate,
      playback.durationSec,
      playback.fadeInSec,
      playback.fadeOutSec,
    )
    if (easeSec > 0) gain.gain.linearRampToValueAtTime(envelopeAtFrom, from)
    else gain.gain.setValueAtTime(envelopeAtFrom, from)
    if (fadeInEnd > from) gain.gain.linearRampToValueAtTime(1, fadeInEnd)
    if (playback.fadeOutSec > 0) {
      if (fadeOutStart > from) gain.gain.setValueAtTime(1, fadeOutStart)
      gain.gain.linearRampToValueAtTime(0, end)
    }

    const voice: ClipVoice = {
      key,
      source,
      gain,
      trim,
      placement,
      fadeCurve: 'linear',
      startTime: start,
      endTime: end,
    }
    if (placement) this.placed.set(voice, placement)
    this.timings.set(voice, {
      when,
      rate,
      durationSec: playback.durationSec,
      fadeInSec: playback.fadeInSec,
      fadeOutSec: playback.fadeOutSec,
      easeFromSec: lateSec,
      easeToSec: (late + easeSec) * rate,
      stoppedAtEnd: playback.loop === true,
    })
    source.onended = () => this.forget(voice)
    if (playback.loop) {
      source.loop = true
      source.loopStart = playback.loopStartSec ?? playback.offsetSec
      source.loopEnd = playback.loopEndSec ?? playback.buffer.duration
      // A late join lands inside the region, not past its end on the source tail.
      source.start(
        start,
        wrapIntoRegion(playback.offsetSec + lateSec, source.loopStart, source.loopEnd),
      )
      this.stopSource(voice, end)
    } else {
      // The length is of buffer played, whatever the speed: the source ends
      // where the clip does without being told when.
      source.start(
        start,
        playback.offsetSec + lateSec,
        (playback.soundSec ?? playback.durationSec) - lateSec,
      )
    }
    return voice
  }

  /**
   * Moves a voice to another rate from `at` on. A voice that has not begun
   * cannot be started sooner or later, so its time runs at the new rate from
   * its own first frame.
   */
  private retime(voice: ClipVoice, rate: number, at: number): void {
    const timing = this.timings.get(voice)
    // Equal-power voices play on the clock.
    if (!timing && voice.fadeCurve === 'equalPower') return
    const from = Math.max(at, voice.startTime)
    voice.source.playbackRate.setValueAtTime(rate, from)
    // Fading out or stopping at a time it was given: only its pitch follows.
    if (!timing) return

    // Where the clip's start would have been had it always played at this rate.
    timing.when = from + (timing.when - from) * (timing.rate / rate)
    timing.rate = rate
    const { when, durationSec, fadeInSec, fadeOutSec, easeFromSec, easeToSec } = timing
    const clock = (clipSec: number): number => when + clipSec / rate
    const elapsedSec = (from - when) * rate
    const level = voice.gain.gain
    const afterEase = fadeGain(easeToSec, durationSec, fadeInSec, fadeOutSec)
    const easing = elapsedSec < easeToSec && easeToSec > easeFromSec
    // What is left of the envelope, from the level it has reached.
    const reached = easing
      ? (afterEase * Math.max(0, elapsedSec - easeFromSec)) / (easeToSec - easeFromSec)
      : fadeGain(elapsedSec, durationSec, fadeInSec, fadeOutSec)
    if (voice.startTime > at) {
      // Not begun: there is no level to hold yet, only the one it starts at.
      level.cancelScheduledValues(from)
      level.setValueAtTime(reached, from)
    } else {
      holdParamAt(level, from, reached)
    }
    if (easing) level.linearRampToValueAtTime(afterEase, clock(easeToSec))
    const reachedSec = Math.max(elapsedSec, easeToSec)
    const fadeInEndSec = Math.min(fadeInSec, durationSec)
    const fadeOutStartSec = Math.max(fadeInEndSec, durationSec - fadeOutSec)
    if (fadeInEndSec > reachedSec) level.linearRampToValueAtTime(1, clock(fadeInEndSec))
    if (fadeOutSec > 0) {
      if (fadeOutStartSec > reachedSec) level.setValueAtTime(1, clock(fadeOutStartSec))
      level.linearRampToValueAtTime(0, clock(durationSec))
    }
    voice.endTime = clock(durationSec)
    if (timing.stoppedAtEnd) this.stopSource(voice, voice.endTime)
  }

  /** Breathwork Live `MusicEngine.scheduleEntry`, verbatim. */
  private playEqualPower(key: string, playback: VoicePlayback, when: number): ClipVoice | null {
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
    const { trim, placement } = this.connectVoice(gain, playback)

    const source = this.ctx.createBufferSource()
    source.buffer = playback.buffer
    source.connect(gain)
    if (playback.loop) {
      source.loop = true
      source.loopStart = playback.loopStartSec ?? playback.offsetSec
      source.loopEnd = playback.loopEndSec ?? playback.buffer.duration
    }
    if (playback.soundSec !== undefined) {
      source.start(startAt, playback.offsetSec, playback.soundSec)
    } else if (playback.offsetSec > 0) source.start(startAt, playback.offsetSec)
    else source.start(startAt)
    const voice: ClipVoice = {
      key,
      source,
      gain,
      trim,
      placement,
      fadeCurve: 'equalPower',
      startTime: startAt,
      endTime: startAt + playback.durationSec,
    }
    if (placement) this.placed.set(voice, placement)
    this.stopSource(voice, startAt + playback.durationSec)
    source.onended = () => this.forget(voice)
    return voice
  }

  /** The voice's way out of its envelope: straight through a trim, or through its own placement. */
  private connectVoice(
    gain: GainNode,
    playback: VoicePlayback,
  ): { trim: GainNode | null; placement: PlacedNodes | null } {
    if (!isPlacedClip(playback)) {
      return { trim: this.connectThroughTrim(gain, playback.gainDb), placement: null }
    }
    const makeup = playback.buffer.numberOfChannels === 1 ? Math.SQRT2 : 1
    const trim = this.ctx.createGain()
    const lowpass = this.ctx.createBiquadFilter()
    const panner = this.ctx.createStereoPanner()
    const placement: PlacedNodes = {
      lowpass,
      panner,
      send: null,
      makeup,
      trim: placedTrimGain(playback.gainDb) * makeup,
      pan: clipPan(playback.pan),
      lowpassHz: clipLowpassHz(playback.lowpassHz, this.ctx.sampleRate),
      space: spaceSendGain(playback.spaceDb) / makeup,
    }
    trim.gain.value = placement.trim
    lowpass.type = 'lowpass'
    lowpass.Q.value = PLACED_LOWPASS_Q_DB
    lowpass.frequency.value = placement.lowpassHz
    panner.pan.value = placement.pan
    gain.connect(trim)
    trim.connect(lowpass)
    lowpass.connect(panner)
    this.strip.connectSource(panner)
    if (placement.space > 0) this.sendToSpace(placement, placement.space)
    return { trim, placement }
  }

  /** Taps a placed voice after its low-pass into the track's space, making the space on first use. */
  private sendToSpace(placement: PlacedNodes, level: number): GainNode {
    const send = this.ctx.createGain()
    send.gain.value = level
    placement.lowpass.connect(send)
    send.connect(this.ensureSpace())
    placement.send = send
    return send
  }

  private ensureSpace(): ConvolverNode {
    if (this.spaceNode) return this.spaceNode
    const convolver = this.ctx.createConvolver()
    // The impulse carries its own level; the node's scaling would undo it.
    convolver.normalize = false
    convolver.buffer = this.spaceImpulse()
    this.strip.connectSource(convolver)
    this.spaceNode = convolver
    return convolver
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

  /** Stops a voice's source at `at` on the clock, whatever the rate does afterwards. */
  private endAt(voice: ClipVoice, at: number): void {
    this.timings.delete(voice)
    this.stopSource(voice, at)
    voice.endTime = Math.min(voice.endTime, at)
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
    this.unwire(voice)
    this.active.delete(voice.key)
    this.voiceClips.delete(voice.key)
  }

  private forget(voice: ClipVoice): void {
    if (this.active.get(voice.key) !== voice) return
    this.active.delete(voice.key)
    this.voiceClips.delete(voice.key)
    this.unwire(voice)
  }

  /** Takes a voice's nodes out of the graph; what it already sent into the space rings on. */
  private unwire(voice: ClipVoice): void {
    voice.source.disconnect()
    voice.gain.disconnect()
    voice.trim?.disconnect()
    const placement = voice.placement
    if (placement) {
      placement.lowpass.disconnect()
      placement.panner.disconnect()
      placement.send?.disconnect()
    }
    this.strip.forgetSource(placement?.panner ?? voice.trim ?? voice.gain)
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
  readonly joinsLate: boolean
  readonly clips: () => ClipWindow['clips']
  readonly schedule: (start: ScheduledStart, when: number, joining?: boolean) => boolean
  readonly cancel: (key: string, fadeSec?: number) => void
  readonly keeps?: (key: string) => boolean
  readonly retime?: (rate: number, at: number) => void
  readonly cancelPending: () => string[]
  readonly cancelAll: (fadeSec: number) => void

  constructor(
    readLookahead: () => number,
    clips: () => ClipWindow['clips'],
    schedule: (start: ScheduledStart, when: number, joining?: boolean) => boolean,
    cancels: Partial<Pick<Schedulable, 'cancel' | 'cancelPending' | 'cancelAll'>> = {},
    options: {
      joinsLate?: boolean
      keeps?: (key: string) => boolean
      retime?: (rate: number, at: number) => void
    } = {},
  ) {
    this.readLookahead = readLookahead
    this.joinsLate = options.joinsLate ?? false
    this.keeps = options.keeps
    this.retime = options.retime
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
