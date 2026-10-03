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
// A linear clip with no fade of its own is not left to click at either end
// (`clips/seam.ts` says where it would):
// - Stopped partway through its sound (shorter than what is left of its
//   source, or looping with its end not where the region comes round), it
//   goes on for the same few milliseconds past its end, fading: a tail.
// - Ending where its sound does, on a sound made to loop (it comes round on
//   itself, and starts partway through a wave), it has the same tail, on the
//   start of the sound; a sound that just stops partway through a wave fades
//   over its last few milliseconds instead.
// - Starting on a sound made to loop, it comes up over those milliseconds.
// The tail and the come-up are each other's mirror on the clock, so where a
// looped sound follows itself (a clip the length of the piece when the piece
// comes round, or two clips end to end) the two sum to the sound unbroken,
// and where it follows something else they are a crossfade. A sound that
// starts on its attack and dies away by itself is left exactly as it was made.
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
import { comesRound, entersOnStep, leavesOnStep } from '../clips/seam'
import { type ClipWindow } from '../clips/window'
import { ParamGlide, holdParamAt } from '../automation/scheduled-param'
import { startFloorSec } from '../clock'
import { scheduleKey, type ScheduledStart } from '../transport/anchor'
import { Cycle, type Timebase } from '../transport/Cycle'
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
import { isObservableDevice } from '../devices/Device'
import { SpaceFeed, stripOnlySetsLevel, type SharedSpaces } from './SharedSpace'
import { SpaceRoom } from './SpaceRoom'
import { generateSpaceImpulse, spaceColour, type SpaceColour } from './space'

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

/**
 * The ease-in of a clip entered partway, the fade of the voice it replaces,
 * the come-up, tail or last fade of a clip whose sound would step there, and
 * the fall of a voice stopped while it sounds.
 */
export const JOIN_EASE_SECONDS = 0.005

/** How near its sound's own end a clip may stop and still count as ending there. */
const OWN_END_SECONDS = 0.001

/** How far down a placed clip's trim reaches: sitting far back costs more than the ±12 dB of a loudness trim. */
export const MIN_PLACED_GAIN_DB = -60
/** Time constant of the approach when a sounding clip's pan or low-pass changes, or its send comes or goes. */
export const PLACEMENT_RAMP_SECONDS = 0.03
/**
 * How long a sounding clip's trim and send take to reach a new level: a
 * straight line in dB, so the track's room can be tilted in step with them
 * (`SpaceRoom.tilt`).
 */
export const PLACEMENT_GLIDE_SECONDS = 0.04
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
  /** What moves the trim, and the send once there is one. */
  readonly trimGlide: ParamGlide
  sendGlide: ParamGlide | null
}

/** What an unplaced voice's trim was last told, and what moves it once it has been moved. */
interface UnplacedTrim {
  trim: number
  glide: ParamGlide | null
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
  /** The source is stopped at the clip's end rather than running out by itself (a looping clip, or one with a tail). */
  stoppedAtEnd: boolean
  /** Seconds of the clock the voice goes on past its clip's end, fading; 0 without a tail. */
  tailSec: number
}

/**
 * The level a linear voice's envelope has at `at` on the clock, as it was
 * written: the come-up or ease-in, then a line up to 1 where the fade-in ends
 * and a line down from where the fade-out starts. Where the two fades overlap
 * that is not `fadeGain`'s triangle: the fade-in is played out first, and the
 * fade-out takes what is left.
 */
function envelopeAt(timing: VoiceTiming, at: number): number {
  const { durationSec, fadeInSec, fadeOutSec, easeFromSec, easeToSec } = timing
  const elapsedSec = (at - timing.when) * timing.rate
  // The level where the envelope took over: from the ease-in, or at the join itself.
  const joined = fadeGain(easeToSec, durationSec, fadeInSec, fadeOutSec)
  if (elapsedSec < easeToSec) {
    if (!(easeToSec > easeFromSec)) return joined
    return (joined * Math.max(0, elapsedSec - easeFromSec)) / (easeToSec - easeFromSec)
  }
  if (elapsedSec >= durationSec) return fadeOutSec > 0 ? 0 : 1
  const fadeInEndSec = Math.min(fadeInSec, durationSec)
  if (elapsedSec < fadeInEndSec) {
    return joined + ((1 - joined) * (elapsedSec - easeToSec)) / (fadeInEndSec - easeToSec)
  }
  if (!(fadeOutSec > 0)) return 1
  const fadeOutStartSec = Math.max(fadeInEndSec, durationSec - fadeOutSec)
  if (fadeOutStartSec > easeToSec) {
    if (elapsedSec < fadeOutStartSec) return 1
    return 1 - (elapsedSec - fadeOutStartSec) / (durationSec - fadeOutStartSec)
  }
  // Joined inside its fade-out: one line down from there.
  return (joined * (durationSec - elapsedSec)) / (durationSec - easeToSec)
}

/** A voice's options once a reversed clip has been turned into positions on its mirrored buffer. */
interface VoicePlayback extends ClipVoiceOptions {
  /** How long the source may sound when that is shorter than the clip; only a reversed clip sets it. */
  soundSec?: number
}

/**
 * Whether a voice stops partway through its sound: a clip shorter than what
 * is left of its source, or a looping one whose end does not fall where its
 * region comes round. Where the source runs out by itself, at the clip's end
 * or before it, the end is the sound's own.
 */
function cutPartway(playback: VoicePlayback): boolean {
  if (playback.soundSec !== undefined && playback.soundSec < playback.durationSec) return false
  const stopsAt = playback.offsetSec + playback.durationSec
  if (!playback.loop) return stopsAt < playback.buffer.duration - OWN_END_SECONDS
  const regionStart = playback.loopStartSec ?? playback.offsetSec
  const regionEnd = playback.loopEndSec ?? playback.buffer.duration
  const region = regionEnd - regionStart
  if (!(region > 0)) return false
  if (stopsAt <= regionEnd) return stopsAt < regionEnd - OWN_END_SECONDS
  const into = (stopsAt - regionStart) % region
  return into > OWN_END_SECONDS && into < region - OWN_END_SECONDS
}

/** Whether the voice's source has no more to play before its clip ends, so what follows is silence inside the clip. */
function runsOut(playback: VoicePlayback): boolean {
  if (playback.soundSec !== undefined && playback.soundSec < playback.durationSec) return true
  if (playback.loop) return false
  return playback.offsetSec + playback.durationSec > playback.buffer.duration + OWN_END_SECONDS
}

/** The frames of its buffer a voice's sound runs over: the loop's region, or from where it enters to the buffer's end. */
function soundFrames(playback: VoicePlayback): { first: number; end: number } {
  const { buffer } = playback
  const startSec = playback.loop
    ? (playback.loopStartSec ?? playback.offsetSec)
    : playback.offsetSec
  const endSec = playback.loop ? (playback.loopEndSec ?? buffer.duration) : buffer.duration
  return {
    first: Math.round(startSec * buffer.sampleRate),
    end: Math.round(endSec * buffer.sampleRate),
  }
}

/** The last frame of its buffer a voice cut partway plays. */
function cutFrame(playback: VoicePlayback): number {
  let stopsAt = playback.offsetSec + playback.durationSec
  if (playback.loop) {
    const regionStart = playback.loopStartSec ?? playback.offsetSec
    const regionEnd = playback.loopEndSec ?? playback.buffer.duration
    if (stopsAt > regionEnd)
      stopsAt = regionStart + ((stopsAt - regionStart) % (regionEnd - regionStart))
  }
  return Math.round(stopsAt * playback.buffer.sampleRate) - 1
}

/** Whether the voice plays a sound made to loop from a frame that silence before it would make a step of. */
function comesUp(playback: VoicePlayback): boolean {
  if (playback.fadeInSec > 0) return false
  const { first, end } = soundFrames(playback)
  return (
    comesRound(playback.buffer, first, end) &&
    entersOnStep(playback.buffer, Math.round(playback.offsetSec * playback.buffer.sampleRate))
  )
}

/**
 * How a linear voice with no fade-out of its own is let go where its clip ends:
 * - `tail`: it sounds on for `sec` of the clock past the end, fading, on what
 *   its sound goes on to (`wraps`: the source is looped for it);
 * - `fade`: its last `sec` of clip fade, where the sound has nothing to go on to.
 */
type Release =
  { kind: 'none' } | { kind: 'tail'; sec: number; wraps: boolean } | { kind: 'fade'; sec: number }

const HELD: Release = { kind: 'none' }

function releaseOf(playback: VoicePlayback, rate: number): Release {
  if (playback.fadeOutSec > 0) return HELD
  // The source runs out before the clip does: the end is the sound's own, wherever it falls.
  if (runsOut(playback)) return HELD
  const { buffer } = playback
  if (cutPartway(playback)) {
    // A cut that falls where the sound is at rest is no step, and is left.
    if (!leavesOnStep(buffer, cutFrame(playback))) return HELD
    if (playback.loop) return { kind: 'tail', sec: JOIN_EASE_SECONDS, wraps: false }
    // No further than its buffer goes.
    const leftSec = buffer.duration - (playback.offsetSec + playback.durationSec)
    return { kind: 'tail', sec: Math.min(JOIN_EASE_SECONDS, leftSec / rate), wraps: false }
  }
  const { first, end } = soundFrames(playback)
  if (comesRound(buffer, first, end)) {
    // What a clip of the same sound right after it would come up on.
    if (!entersOnStep(buffer, first)) return HELD
    return { kind: 'tail', sec: JOIN_EASE_SECONDS, wraps: !playback.loop }
  }
  if (!leavesOnStep(buffer, end - 1)) return HELD
  return { kind: 'fade', sec: Math.min(JOIN_EASE_SECONDS, playback.durationSec) }
}

export interface ClipVoice {
  /** The start it was scheduled under; changes only when the timeline is stretched under it. */
  readonly key: string
  readonly source: AudioBufferSourceNode
  readonly gain: GainNode
  /** Null while an unplaced voice plays at unity; it is given one when its level is first moved. */
  trim: GainNode | null
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
  /** A loop length of the track's own (`AudioTrack.loopLengthSec`). Default: the transport's loop. */
  loopLengthSec?: number | null
  /**
   * The impulse response of the space this track's clips send into
   * (`Clip.spaceDb`), read when a clip first does. An engine hands every
   * track the same one; without it the track generates the stock room.
   */
  spaceImpulse?: () => AudioBuffer
  /**
   * What is done to sound on its way through that space (its drive and
   * drift), read with the impulse. Without it the space is clean and still.
   */
  spaceColour?: () => SpaceColour
  /**
   * An engine's shared rooms (`EngineOptions.sharedSpace`). With them the
   * track sends into the room of whatever it feeds for as long as its strip
   * only sets a level, and into a room of its own otherwise.
   */
  sharedSpaces?: SharedSpaces
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
  private readonly spaceColour: () => SpaceColour
  private room: SpaceRoom | null = null
  private readonly sharedSpaces: SharedSpaces | null
  // The track's way into a shared room, and what that room feeds; null while it has a room of its own, or none.
  private feed: { nodes: SpaceFeed; into: AudioNode } | null = null
  // Rooms of its own the track has moved out of, still ringing.
  private readonly leftRooms: SpaceRoom[] = []
  // Ends the watch on the strip and on its inserts, which say when the track can share a room.
  private unwatchStrip: (() => void) | null = null
  private unwatchInserts: (() => void)[] = []
  private scheduler: Scheduler | null = null
  private unregister: (() => void)[] = []
  private disposed = false
  // What each placed voice's nodes were last told.
  private readonly placed = new WeakMap<ClipVoice, PlacedNodes>()
  // The same for the trim of each voice that names no place.
  private readonly unplaced = new WeakMap<ClipVoice, UnplacedTrim>()
  private ownLoopSec: number | null = null
  // The track's own loop on the attached scheduler's transport; null while it follows the transport's.
  private cycle: Cycle | null = null
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
    this.spaceColour = options.spaceColour ?? (() => spaceColour())
    this.sharedSpaces = options.sharedSpaces ?? null
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
        rekey: (key, to) => this.rekey(key, to),
        retime: (rate, at) => this.setRate(rate, at),
        timebase: () => this.timebase,
      },
    )
    this.preload = new TrackSchedulable(
      () => this.preloadSec,
      () => this.clips.audible(),
      (start) => this.preloadStart(start),
      {},
      { timebase: () => this.timebase },
    )

    if (options.loopLengthSec != null) this.ownLoopSec = validateLoopLength(options.loopLengthSec)
    if (options.scheduler) this.attach(options.scheduler)
  }

  /** Register both schedulables with a scheduler (idempotent). */
  attach(scheduler: Scheduler): void {
    if (this.scheduler === scheduler) return
    this.detach()
    this.scheduler = scheduler
    if (this.ownLoopSec !== null) this.cycle = new Cycle(scheduler.transport, this.ownLoopSec)
    this.unregister = [scheduler.register(this.preload), scheduler.register(this.playback)]
  }

  detach(): void {
    for (const off of this.unregister) off()
    this.unregister = []
    this.scheduler = null
    this.cycle = null
  }

  /**
   * A loop length of the track's own, in timeline seconds, or null to follow
   * the transport's loop. A track with one repeats its clips at that length
   * over the time the transport has run (`Transport.elapsed`), whether or not
   * the transport loops: a clip at `startSec` sounds at `startSec`, then one
   * length later, and so on, so tracks of different lengths start together
   * at the timeline's origin and slide apart. Its lanes can follow
   * (`Automation.add` with this track's `timebase`). Set while playing, the
   * track moves over at once: what sounds fades out and the clips the new
   * loop is inside are entered there. Only a track on a scheduler has a
   * loop to run on.
   */
  get loopLengthSec(): number | null {
    return this.ownLoopSec
  }

  set loopLengthSec(lengthSec: number | null) {
    const next = lengthSec === null ? null : validateLoopLength(lengthSec)
    if (next === this.ownLoopSec) return
    this.ownLoopSec = next
    if (!this.scheduler) return
    if (next === null) this.cycle = null
    else if (this.cycle) this.cycle.lengthSec = next
    else this.cycle = new Cycle(this.scheduler.transport, next)
    // The scheduler sees the other clock on its next pass; this is that pass.
    this.scheduler.refresh()
  }

  /** The clock the track's clips are placed on when it has a loop of its own; undefined on the transport's. */
  get timebase(): Timebase | undefined {
    return this.cycle ?? undefined
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
    return this.room?.convolver ?? this.feed?.nodes.room.convolver ?? null
  }

  /**
   * The space this track's clips send into has changed (`spaceImpulse`,
   * `spaceColour`): both are read again. What is sounding sends into the new
   * space from now on, and what it already sent rings out in the old one. A
   * track that has sent nothing yet has nothing to change.
   */
  refreshSpace(): void {
    if (this.disposed) return
    // A shared room was told by the engine; the feed follows it.
    this.feed?.nodes.set(this.spaceColour())
    if (!this.room) return
    const before = this.room.set({ impulse: this.spaceImpulse(), ...this.spaceColour() })
    if (before) this.moveSends(before, this.room.entry)
  }

  /** What sounds sends into `to` from now on instead of `from`. */
  private moveSends(from: AudioNode, to: AudioNode): void {
    for (const voice of this.active.values()) {
      const send = voice.placement?.send
      if (!send) continue
      try {
        send.disconnect(from)
      } catch {
        // Not connected there (a mock that tracks no connections); connect all the same.
      }
      send.connect(to)
    }
  }

  /**
   * Move the voice under `key` to another place while it sounds: its trim
   * and space send glide to the new levels and its pan and low-pass approach
   * theirs, over a few milliseconds. A voice that was started unplaced has
   * only a trim, and takes the level alone. The track does this itself for
   * scheduled clips whenever its clip list changes. Returns whether the
   * voice could take everything `to` names.
   *
   * A voice that is turned down has already filled the track's room at its
   * old level, and a room rings for seconds. Where the room is the track's
   * own, what rings in it is turned down with the voice (`SpaceRoom.tilt`),
   * so the change is heard at once and not as the room dies away. A room
   * the track shares holds other tracks' sound too, and is left to ring.
   */
  place(key: string, to: VoicePlace): boolean {
    const at = this.ctx.currentTime
    const sent = this.sentToRoom(at)
    const moved = this.move(key, to, at)
    this.tiltRoom(sent, at)
    return moved
  }

  private move(key: string, to: VoicePlace, at: number): boolean {
    const voice = this.active.get(key)
    if (!voice) return false
    const nodes = this.placed.get(voice)
    if (!nodes) return this.retrim(voice, to, at)
    const approach = (param: AudioParam, value: number): void => {
      param.setTargetAtTime(value, at, PLACEMENT_RAMP_SECONDS)
    }
    const glide = (param: ParamGlide, value: number): void => {
      param.along(at, { value, atSec: at + PLACEMENT_GLIDE_SECONDS })
    }
    const trim = placedTrimGain(to.gainDb) * nodes.makeup
    if (trim !== nodes.trim) {
      nodes.trim = trim
      glide(nodes.trimGlide, trim)
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
      const sending = nodes.space > 0
      nodes.space = space
      // A send that did not exist comes up from silence beside the dry path.
      if (!nodes.send) this.sendToSpace(nodes, 0)
      const send = nodes.sendGlide
      // A line in dB has no way to or from silence: there the send approaches.
      if (send && sending && space > 0 && send.isSettled(at)) glide(send, space)
      else send?.approach(space, at, PLACEMENT_RAMP_SECONDS)
    }
    return true
  }

  /**
   * A voice that was started without a place has no panner, low-pass or send
   * to move, only a trim: it takes its clip's level and nothing else. One
   * that started at unity is given its trim now.
   */
  private retrim(voice: ClipVoice, to: VoicePlace, at: number): boolean {
    const told = this.unplaced.get(voice)
    if (!told) return false
    // A clip that has come to name a place has the range of one.
    const trim = isPlacedClip(to) ? placedTrimGain(to.gainDb) : trimGain(to.gainDb)
    if (trim !== told.trim) {
      told.glide ??= new ParamGlide(this.trimOf(voice).gain, told.trim)
      told.trim = trim
      told.glide.along(at, { value: trim, atSec: at + PLACEMENT_GLIDE_SECONDS })
    }
    return clipPan(to.pan) === 0 && to.lowpassHz === undefined && spaceSendGain(to.spaceDb) === 0
  }

  /** A voice's trim, put between its envelope and the strip when it had none. */
  private trimOf(voice: ClipVoice): GainNode {
    if (voice.trim) return voice.trim
    const trim = this.ctx.createGain()
    this.strip.disconnectSource(voice.gain)
    voice.gain.connect(trim)
    this.strip.connectSource(trim)
    voice.trim = trim
    return trim
  }

  /**
   * The power the sounding voices send into the track's own room, as their
   * levels now stand: each voice's trim times its send, squared. 0 while the
   * track has no room of its own.
   */
  private sentToRoom(at: number): number {
    if (!this.room) return 0
    let power = 0
    for (const voice of this.active.values()) {
      if (voice.startTime > at || at >= voice.endTime) continue
      const nodes = this.placed.get(voice)
      if (nodes?.send) power += (nodes.trim * nodes.space) ** 2
    }
    return power
  }

  /**
   * The sounding voices sent `before` into the track's own room and send
   * another amount now: what rings in the room is turned by the difference.
   * Weighed by power, so one voice of several turned down takes the room
   * down by its share of it.
   */
  private tiltRoom(before: number, at: number): void {
    const room = this.room
    if (!room || before <= 0) return
    const now = this.sentToRoom(at)
    if (now <= 0 || now === before) return
    const entry = room.tilt(Math.sqrt(now / before), at, PLACEMENT_GLIDE_SECONDS)
    if (entry) this.moveSends(entry, room.entry)
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
   * Silence the voice under `key`. Without `at`: at once (ambient-live). One
   * that is sounding falls silent over `JOIN_EASE_SECONDS`, since a wave cut
   * where it stands is a click; one that has not started is disconnected.
   * With `at`: schedule `source.stop(at)` and let it end there.
   */
  stop(key: string, at?: number): void {
    const voice = this.active.get(key)
    if (!voice) return
    if (at === undefined) this.letGo(voice)
    else this.endAt(voice, at)
  }

  /**
   * Let the voice under `key` go for another that takes its place: one that
   * is sounding fades out over `seconds` from now (on a device, from where the
   * other can come up) and is forgotten at once, so the key is free; one that
   * has not started, or `seconds` of 0, is silenced.
   */
  release(key: string, seconds: number): void {
    const voice = this.active.get(key)
    if (!voice) return
    const at = this.now()
    if (seconds <= 0 || voice.startTime > at || at >= voice.endTime) {
      this.silence(voice)
      return
    }
    // On a device the voice that takes its place comes up the start floor
    // ahead of the clock, so this one fades from there, off its own envelope.
    if (voice.fadeCurve === 'linear' && startFloorSec(this.ctx) > 0) {
      this.letGo(voice, seconds)
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
   * Silence everything, started or not. Without `at`: at once, as `stop(key)`
   * does each voice (ambient-live `stopAll`; the transport's stop, pause and
   * seek). With `at`: every source stops at `at` (Breathwork Live `stop()`
   * stops sources at `now + STOP_FADE_SECONDS` while the master fades).
   */
  stopAll(options: { at?: number } = {}): void {
    for (const voice of [...this.active.values()]) {
      if (options.at === undefined) this.letGo(voice)
      else this.endAt(voice, options.at)
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.detach()
    // The graph goes with the track: nothing is left to ease out through.
    for (const voice of [...this.active.values()]) this.silence(voice)
    this.unwatchStrip?.()
    this.unwatchStrip = null
    for (const unwatch of this.unwatchInserts) unwatch()
    this.unwatchInserts = []
    this.room?.dispose()
    this.room = null
    for (const room of this.leftRooms) room.dispose()
    this.leftRooms.length = 0
    this.leaveShared()
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

  /** The voice under `key` is its clip's start under `to` now: the timeline was stretched under it. */
  private rekey(key: string, to: string): boolean {
    const voice = this.active.get(key)
    if (!voice || this.active.has(to)) return false
    this.active.delete(key)
    ;(voice as { key: string }).key = to
    this.active.set(to, voice)
    const clipId = this.voiceClips.get(key)
    this.voiceClips.delete(key)
    if (clipId !== undefined) this.voiceClips.set(to, clipId)
    return true
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

  /** Every scheduled voice takes its clip's current place and trim, and the track's own room what that changes in it. */
  private followClips(): void {
    const at = this.ctx.currentTime
    const sent = this.sentToRoom(at)
    for (const [key, clipId] of this.voiceClips) {
      const clip = this.clips.get(clipId)
      if (clip) this.move(key, clip, at)
    }
    this.tiltRoom(sent, at)
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
    const now = this.now()
    // On a device, nothing is started nearer the clock than can be kept to the
    // frame: the source would be taken up a block or more late, its level
    // already part of the way along what was written for it.
    const floorSec = startFloorSec(this.ctx)
    const passed = when < now
    // Due any moment now: it plays whole, from as soon as can be kept.
    if (!passed && when < now + floorSec) when = now + floorSec
    // A start that has already passed joins the clip partway in rather than
    // replaying it from the trim point and overrunning its end.
    const late = passed ? now + floorSec - when : 0
    // How far into the clip that is.
    const lateSec = late * rate
    if (lateSec >= (playback.soundSec ?? playback.durationSec)) return null
    const start = when + late
    const end = when + playback.durationSec / rate
    // Its clip's own fade-out, or the way out of a clip whose sound would step where it ends.
    const release = releaseOf(playback, rate)
    const fadeOutSec = release.kind === 'fade' ? release.sec : playback.fadeOutSec
    const tailSec = release.kind === 'tail' ? release.sec : 0
    // The ease-in it was given (a join partway), or the come-up of a looped
    // sound started on time. On a device a start that has passed eases in
    // whoever asked for it: it begins partway through a wave.
    const easeInSec =
      playback.easeInSec ??
      ((late === 0 ? comesUp(playback) : floorSec > 0) ? JOIN_EASE_SECONDS : 0)

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
    const fadeOutStart = Math.max(fadeInEnd, end - fadeOutSec / rate)
    // The envelope takes over where the ease-in ends: at the join itself when there is none.
    const easeSec = Math.max(0, Math.min(easeInSec, end - start))
    const from = start + easeSec
    // A source starts on the frame nearest its time and a level takes hold on
    // the first frame at or after its own, so a voice that starts on time from
    // silence (a come-up, or a fade-in of its own) is silent from half a frame
    // sooner: its first frame would otherwise sound at full level, ahead of
    // the fade. This is the one event ambient-live's ClipPlayer did not write.
    // A join on a device starts ahead of the clock too, so on a frame of its own.
    if (late === 0 ? easeSec > 0 || playback.fadeInSec > 0 : easeSec > 0 && floorSec > 0) {
      gain.gain.setValueAtTime(0, Math.max(0, start - 0.5 / this.ctx.sampleRate))
    }
    if (easeSec > 0) gain.gain.setValueAtTime(0, start)
    const envelopeAtFrom = fadeGain(
      (late + easeSec) * rate,
      playback.durationSec,
      playback.fadeInSec,
      fadeOutSec,
    )
    if (easeSec > 0) gain.gain.linearRampToValueAtTime(envelopeAtFrom, from)
    else gain.gain.setValueAtTime(envelopeAtFrom, from)
    if (fadeInEnd > from) gain.gain.linearRampToValueAtTime(1, fadeInEnd)
    if (fadeOutSec > 0) {
      if (fadeOutStart > from) gain.gain.setValueAtTime(1, fadeOutStart)
      gain.gain.linearRampToValueAtTime(0, end)
    }
    if (tailSec > 0) {
      gain.gain.setValueAtTime(1, end)
      gain.gain.linearRampToValueAtTime(0, end + tailSec)
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
    else this.unplaced.set(voice, { trim: trimGain(playback.gainDb), glide: null })
    this.timings.set(voice, {
      when,
      rate,
      durationSec: playback.durationSec,
      fadeInSec: playback.fadeInSec,
      fadeOutSec,
      easeFromSec: lateSec,
      easeToSec: (late + easeSec) * rate,
      stoppedAtEnd: playback.loop === true || tailSec > 0,
      tailSec,
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
      this.stopSource(voice, end + tailSec)
    } else if (release.kind === 'tail') {
      // The tail is of the clock, so the source is stopped where it ends, not
      // given a length: it reads on into what follows the clip, or, where the
      // clip ends with its sound, round onto the sound's start.
      if (release.wraps) {
        source.loop = true
        source.loopStart = playback.offsetSec
        source.loopEnd = playback.buffer.duration
      }
      source.start(start, playback.offsetSec + lateSec)
      this.stopSource(voice, end + tailSec)
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
    // Past its clip's end, in its tail, which is of the clock: the same.
    if (timing.tailSec > 0 && from >= voice.endTime) return

    // Where the clip's start would have been had it always played at this rate.
    timing.when = from + (timing.when - from) * (timing.rate / rate)
    timing.rate = rate
    const { when, durationSec, fadeInSec, fadeOutSec, easeFromSec, easeToSec, tailSec } = timing
    const clock = (clipSec: number): number => when + clipSec / rate
    const elapsedSec = (from - when) * rate
    const level = voice.gain.gain
    const afterEase = fadeGain(easeToSec, durationSec, fadeInSec, fadeOutSec)
    const easing = elapsedSec < easeToSec && easeToSec > easeFromSec
    // What is left of the envelope, from the level it has reached.
    const reached = envelopeAt(timing, from)
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
    if (tailSec > 0) {
      level.setValueAtTime(1, voice.endTime)
      level.linearRampToValueAtTime(0, voice.endTime + tailSec)
    }
    if (timing.stoppedAtEnd) this.stopSource(voice, voice.endTime + tailSec)
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
    else this.unplaced.set(voice, { trim: trimGain(playback.gainDb), glide: null })
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
      trimGlide: new ParamGlide(trim.gain, placedTrimGain(playback.gainDb) * makeup),
      sendGlide: null,
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
    placement.sendGlide = new ParamGlide(send.gain, level)
    return send
  }

  /**
   * Where a send into the track's space connects; the space is made on first
   * use. That is a room the track shares when the engine has them and the
   * strip only sets a level, and a room of the track's own otherwise.
   */
  private ensureSpace(): AudioNode {
    if (this.feed) return this.feed.nodes.entry
    if (this.room) return this.room.entry
    const spaces = this.sharedSpaces
    if (spaces) this.watchStrip()
    if (spaces && stripOnlySetsLevel(this.strip)) {
      const into = this.strip.destination
      const nodes = new SpaceFeed(
        this.ctx,
        spaces,
        spaces.join(into),
        this.strip,
        this.spaceColour(),
      )
      this.feed = { nodes, into }
      return nodes.entry
    }
    this.room = new SpaceRoom(
      this.ctx,
      {
        connect: (node) => this.strip.connectSource(node),
        forget: (node) => this.strip.forgetSource(node),
      },
      { impulse: this.spaceImpulse(), ...this.spaceColour() },
    )
    return this.room.entry
  }

  /**
   * The strip, or one of its inserts, has changed: the track's space is put
   * where it now belongs. A track that could share a room and no longer can
   * gets one of its own, and the other way round; one that feeds something
   * else, or has other inserts to follow, gets a new way into the shared
   * room. What sounds sends there from now on, and what it sent before
   * rings out where it is.
   */
  private placeSpace(): void {
    if (this.disposed) return
    const before = this.feed?.nodes.entry ?? this.room?.entry
    if (!before) return
    const share = stripOnlySetsLevel(this.strip)
    if (this.feed) {
      const { nodes, into } = this.feed
      const sameInserts =
        nodes.follows.length === this.strip.inserts.length &&
        nodes.follows.every((device, index) => device === this.strip.inserts[index])
      if (share && into === this.strip.destination && sameInserts) return
    } else if (!share) {
      return
    }
    if (this.room) {
      this.room.leave()
      this.leftRooms.push(this.room)
      this.room = null
    }
    const feed = this.feed
    this.feed = null
    const entry = this.ensureSpace()
    this.moveSends(before, entry)
    // After the sends have moved, so they never feed a node that is already taken out.
    if (feed) {
      feed.nodes.dispose()
      this.sharedSpaces?.leave(feed.into)
    }
  }

  private leaveShared(): void {
    const feed = this.feed
    this.feed = null
    if (!feed) return
    feed.nodes.dispose()
    this.sharedSpaces?.leave(feed.into)
  }

  /** Follows what decides whether the track can share a room: its strip, and what its inserts are set to. */
  private watchStrip(): void {
    if (this.unwatchStrip) return
    const watchInserts = (): void => {
      for (const unwatch of this.unwatchInserts) unwatch()
      this.unwatchInserts = this.strip.inserts
        .filter(isObservableDevice)
        .map((device) => device.onChange(() => this.placeSpace()))
    }
    watchInserts()
    this.unwatchStrip = this.strip.onChange(({ kind }) => {
      if (kind === 'inserts') watchInserts()
      if (kind === 'inserts' || kind === 'pan' || kind === 'inputGain' || kind === 'routing') {
        this.placeSpace()
      }
    })
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

  /**
   * Lets a voice go at once. One that is sounding is not cut dead, which is a
   * step wherever its wave happens to stand: it falls to silence over
   * `seconds` from the level it has, and is forgotten now, so its key is
   * free. One that has not started, or is over, is silenced; one in its tail
   * is left to finish it.
   */
  private letGo(voice: ClipVoice, seconds = JOIN_EASE_SECONDS): void {
    const now = this.now()
    const timing = this.timings.get(voice)
    if (voice.startTime > now || now >= voice.endTime + (timing?.tailSec ?? 0)) {
      this.silence(voice)
      return
    }
    // The fall begins where the device can keep it to the frame, which is
    // also where a voice entered in its place comes up.
    const at = now + startFloorSec(this.ctx)
    if (at < voice.endTime) {
      const level = voice.gain.gain
      // A voice with no envelope of its own left is fading, or playing on the clock: where it is now.
      const reached = timing ? envelopeAt(timing, at) : level.value
      this.timings.delete(voice)
      // A fade under way is cut short where it has got to. A hold writes
      // nothing where there was no ramp to cut, so the fall is anchored there.
      if (typeof level.cancelAndHoldAtTime === 'function') level.cancelAndHoldAtTime(at)
      else level.cancelScheduledValues(at)
      level.setValueAtTime(reached, at)
      level.linearRampToValueAtTime(0, at + seconds)
      this.stopSource(voice, at + seconds)
      voice.endTime = at + seconds
    }
    this.active.delete(voice.key)
    this.voiceClips.delete(voice.key)
    // No longer the key's voice, so `forget` would pass it by.
    voice.source.onended = () => this.unwire(voice)
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
  private readonly readTimebase: () => Timebase | undefined
  readonly joinsLate: boolean
  readonly clips: () => ClipWindow['clips']
  readonly schedule: (start: ScheduledStart, when: number, joining?: boolean) => boolean
  readonly cancel: (key: string, fadeSec?: number) => void
  readonly keeps?: (key: string) => boolean
  readonly rekey?: (key: string, to: string) => boolean
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
      rekey?: (key: string, to: string) => boolean
      retime?: (rate: number, at: number) => void
      timebase?: () => Timebase | undefined
    } = {},
  ) {
    this.readLookahead = readLookahead
    this.readTimebase = options.timebase ?? (() => undefined)
    this.joinsLate = options.joinsLate ?? false
    this.keeps = options.keeps
    this.rekey = options.rekey
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

  get timebase(): Timebase | undefined {
    return this.readTimebase()
  }
}

function validateLoopLength(lengthSec: number): number {
  if (!Number.isFinite(lengthSec) || lengthSec <= 0) {
    throw new RangeError(`AudioTrack: loopLengthSec must be a positive number, got ${lengthSec}`)
  }
  return lengthSec
}

export type { ClipWindow }
