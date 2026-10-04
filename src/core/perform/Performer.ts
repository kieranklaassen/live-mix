// The runtime that plays a perform set on an engine: scenes, single rides,
// dials and cues, each landing on the grid, plus the events a host needs to
// follow the music (bar, beat, scene, cue).
//
// Nothing here writes to a score. A scene is a set of rides
// (`ChannelStrip.setRide`) and dial values approached from wherever they
// stand; leaving, or disposing of the performer, puts every ride back at 1
// and the piece plays as it was composed.
//
// Time. A move is asked for at any moment and lands on a line of the grid.
// The performer keeps where that line is in beats since the timeline began
// (so it stays put when the host changes tempo under it), and hands it to
// the graph on the scheduler tick that brings it inside the lookahead, at
// the audio-clock time the line falls on. Until then a queued move is only a
// note here, so a seek, a stop or another move can still change it.
//
// Two ride layers per track. A scene's rides and a dial's rides are separate
// gains (`scene` and `dial`), so a dial turned while a scene is coming in
// does not cut the scene's slow approach short.

import { type Engine } from '../Engine'
import { Emitter } from '../events'
import { seededUnit } from '../clips/chance'
import { followTimeSeconds, quantizeLaunch, type LaunchQuantize } from '../session/launch'
import { DEFAULT_BEATS_PER_BAR, TempoMap } from '../time/TempoMap'
import { AudioTrack, type ClipVoiceOptions } from '../tracks/AudioTrack'
import { type ChannelStrip, type StripDestination } from '../tracks/ChannelStrip'
import { isLooping } from '../transport/anchor'
import { type SchedulerTick } from '../transport/Scheduler'
import { type TransportChange } from '../transport/Transport'
import {
  MAX_RIDE,
  drawPerformFollow,
  emptyPerformSet,
  normalisePerformSet,
  resolvePerformFollow,
  shapeDial,
  type PerformCue,
  type PerformDial,
  type PerformScene,
  type PerformSet,
} from './set'

/** The ride layer a scene, or a single track brought in or out, moves. */
export const SCENE_RIDE_LAYER = 'scene'
/** The ride layer dials move. */
export const DIAL_RIDE_LAYER = 'dial'

export const DEFAULT_PERFORM_LOOKAHEAD_SECONDS = 0.12
/** How long a dial takes to reach where it was put, when the caller does not say. */
export const DEFAULT_DIAL_GLIDE_SECONDS = 0.08
/** How long everything takes to come back when the performance is reset. */
export const DEFAULT_RESET_SECONDS = 0.5
/**
 * A morph is an exponential approach, which never quite arrives: over the
 * morph's length it runs through this many time constants, which leaves it
 * within 2% of where it is going. A ride is told to arrive when the morph
 * ends (`RideOptions.arriveAt`), so a sound taken out is out by then.
 */
export const MORPH_TIME_CONSTANTS = 4
/** A move with no length still takes this long, so nothing steps. */
const MIN_TIME_CONSTANT = 0.005
const BEAT_EPSILON = 1e-6
/** A jump of the timeline smaller than this many beats is no jump: lines keep their reports. */
const JUMP_EPSILON_BEATS = 1e-3

/** When a host target should move: from `at` on the audio clock, over `seconds`. */
export interface PerformGlide {
  at: number
  seconds: number
}

export interface PerformerOptions {
  engine: Engine
  set?: PerformSet
  /**
   * The grid: a tempo map, or a function read each time one is needed, for a
   * host whose tempo moves. Default 120 BPM in four.
   */
  tempo?: TempoMap | (() => TempoMap)
  /**
   * The seed follow rules are drawn from: the n-th draw of a performance is
   * a pure function of the seed and n, so the same seed and the same moves
   * give the same evening. A function is read at every draw. Default 0.
   */
  seed?: number | (() => number)
  /** Replaces the seeded draws: a source of numbers in [0, 1). */
  random?: () => number
  /**
   * The strip a track id rides. Default: the engine's track, group,
   * instrument, live input or return of that name.
   */
  strip?: (track: string) => ChannelStrip | null
  /** Moves a host target of a dial (`{ kind: 'host' }`). */
  host?: (id: string, value: number, glide: PerformGlide) => void
  /** Where cues sound. Default the master bus. */
  cueDestination?: StripDestination
  /** How far ahead of a line its moves are handed to the graph. Default 0.12. */
  lookaheadSec?: number
}

export interface MoveOptions {
  /** The grid this move waits for; absent means the set's. `'none'` is now. */
  quantize?: LaunchQuantize
  /** Bars the move takes to come in; absent means the scene's, then the set's. */
  morphBars?: number
}

export interface DialOptions {
  /** Audio-clock time the dial starts moving. Default now. */
  at?: number
  /** Seconds it takes to get there. Default 0.08. */
  seconds?: number
}

export type PerformEvent =
  /** A scene's morph begins at `at`. `scene` is null after a reset. */
  | { type: 'scene'; scene: string | null; at: number }
  /** A scene is waiting for its line, or (null) the wait was called off. */
  | { type: 'queue'; scene: string | null }
  | { type: 'ride'; track: string; value: number; at: number }
  | { type: 'dial'; dial: string; value: number; at: number }
  | { type: 'cue'; cue: string; at: number }
  /** A bar line falls at `at`. `bar` counts from 0 within the pass. */
  | { type: 'bar'; bar: number; pass: number; at: number }
  /** A beat falls at `at`. `beat` counts from 0 within the bar. */
  | { type: 'beat'; bar: number; beat: number; pass: number; at: number }
  /** The set was replaced, or following was switched. */
  | { type: 'set' }

export type PerformEventType = PerformEvent['type']
export type PerformListener = (event: PerformEvent) => void

/** Where a performance stands, as plain data for a view or an agent. */
export interface PerformState {
  /** The scene the music is in, or coming into. */
  scene: string | null
  /** The scene waiting for its line. */
  queued: string | null
  /** Beats until the queued scene's line; null when nothing waits or the transport is not playing. */
  queuedInBeats: number | null
  /** Where every ridden track's scene ride is heading. A track not listed is at 1. */
  rides: Record<string, number>
  /** Tracks waiting for their line, with where they will go. */
  queuedRides: Record<string, number>
  /** Every dial of the set with its value. */
  dials: Record<string, number>
  /** Whether scenes hand over by their follow rules. */
  following: boolean
  /** Beats until the scene's follow rule is drawn; null when it has none or following is off. */
  followInBeats: number | null
}

interface QueuedScene {
  scene: string
  /** Beats since the timeline began; null means the next tick, whenever that is. */
  beats: number | null
  morphBars: number | undefined
  /** The grid asked for, so the line is found again on the same one after a seek. */
  quantize: LaunchQuantize | undefined
  /** Reached by a follow rule rather than by a hand. */
  followed: boolean
}

interface QueuedRide {
  value: number
  beats: number | null
  morphBars: number | undefined
  quantize: LaunchQuantize | undefined
}

type TempoSource = TempoMap | (() => TempoMap)

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
}

export class Performer {
  readonly engine: Engine
  readonly lookaheadSec: number
  private readonly tempoSource: TempoSource
  private readonly seedSource: number | (() => number)
  private readonly randomOverride: (() => number) | null
  private readonly resolveStrip: (track: string) => ChannelStrip | null
  private readonly host: PerformerOptions['host']
  private readonly cueDestination: StripDestination | undefined
  private readonly events = new Emitter<PerformEvent>()
  private readonly changes = new Emitter<Performer>()
  private readonly unsubscribe: (() => void)[] = []

  private current: PerformSet = emptyPerformSet()
  private scene: string | null = null
  private queued: QueuedScene | null = null
  // Where each ridden track's scene ride is heading.
  private readonly sceneRides = new Map<string, number>()
  private readonly queuedRides = new Map<string, QueuedRide>()
  private readonly dialValues = new Map<string, number>()
  // Tracks whose dial layer has been moved, so it can be put back.
  private readonly dialRidden = new Set<string>()
  private following = false
  // Beats since the timeline began at which the scene's rule is drawn.
  private followAtBeats: number | null = null
  private followPeriodBeats = 0
  private draws = 0
  // Where the timeline stood, and what the audio clock read, when it was last looked at.
  private lastBeats = 0
  private lastClock = 0
  private lastPlaying = false
  // The loop changed and the lines that wait have not been found again yet.
  private unsettled = false
  // The last whole beat reported; lines after it are still to come.
  private reportedBeat = -1
  private cueTrack: AudioTrack | null = null
  private cueCount = 0
  private disposed = false

  constructor(options: PerformerOptions) {
    this.engine = options.engine
    this.lookaheadSec = Math.max(0, options.lookaheadSec ?? DEFAULT_PERFORM_LOOKAHEAD_SECONDS)
    this.tempoSource = options.tempo ?? TempoMap.constant(120, DEFAULT_BEATS_PER_BAR)
    this.seedSource = options.seed ?? 0
    this.randomOverride = options.random ?? null
    this.resolveStrip = options.strip ?? ((track) => engineStrip(this.engine, track))
    this.host = options.host
    this.cueDestination = options.cueDestination
    this.lastBeats = this.beatsNow()
    this.lastClock = this.engine.now()
    this.lastPlaying = this.engine.transport.state === 'playing'
    this.reportedBeat = Math.ceil(this.lastBeats - BEAT_EPSILON) - 1
    this.unsubscribe.push(
      this.engine.scheduler.onTick((tick) => this.onTick(tick)),
      this.engine.transport.onChange((change) => this.onTransportChange(change)),
      this.engine.onDispose(() => this.dispose()),
    )
    if (options.set) this.load(options.set)
  }

  // --- The set --------------------------------------------------------------------------

  get set(): PerformSet {
    return this.current
  }

  /**
   * Take a new set, or the same one edited. The scene in play stays if it is
   * still there, and every dial that is still there keeps its value; a new
   * dial starts at rest. Rides are not moved: a scene edited while it plays
   * is heard the next time it is gone to.
   */
  load(next: PerformSet): void {
    this.assertLive()
    const set = normalisePerformSet(next)
    const rule = (from: PerformSet): string =>
      JSON.stringify(from.scenes.find((candidate) => candidate.id === this.scene)?.follow ?? null)
    // The rule being waited on, or whether rules are followed at all: the wait starts again.
    const rearm = set.follow !== this.current.follow || rule(set) !== rule(this.current)
    this.current = set
    if (this.scene && !this.findScene(this.scene)) this.scene = null
    if (this.queued && !this.findScene(this.queued.scene)) this.queued = null
    const kept = new Map(this.dialValues)
    this.dialValues.clear()
    for (const dial of set.dials) this.dialValues.set(dial.id, kept.get(dial.id) ?? dial.value)
    this.applyDials({ at: this.engine.now(), seconds: DEFAULT_DIAL_GLIDE_SECONDS })
    if (rearm) {
      this.following = set.follow
      this.armFollow(this.beatsNow())
    }
    this.events.emit({ type: 'set' })
    this.changed()
  }

  // --- Scenes and rides -----------------------------------------------------------------

  /**
   * Go to a scene on the next line of the grid: its rides and dials start
   * moving there and arrive over its morph. Going to the scene already in
   * play sets it again, which undoes whatever was changed by hand since.
   * A scene already waiting gives way to this one. Returns false for a scene
   * the set does not have.
   */
  go(scene: string, options: MoveOptions = {}): boolean {
    this.assertLive()
    if (!this.findScene(scene)) return false
    this.queueScene({
      scene,
      morphBars: options.morphBars,
      quantize: options.quantize,
      followed: false,
    })
    return true
  }

  /** Calls off the scene that is waiting, if one is. */
  cancel(): void {
    if (!this.queued) return
    this.queued = null
    this.events.emit({ type: 'queue', scene: null })
    this.changed()
  }

  /**
   * Bring one track in or out (or anywhere between) on the next line, over
   * the set's morph: 0 is out, 1 is the mix as it stands.
   */
  ride(track: string, value: number, options: MoveOptions = {}): void {
    this.assertLive()
    const beats = this.lineAfter(options.quantize ?? this.current.quantize)
    this.queuedRides.set(track, {
      value: clamp(value, 0, MAX_RIDE),
      beats,
      morphBars: options.morphBars,
      quantize: options.quantize,
    })
    // A line already inside the lookahead does not wait for the next tick.
    if (!this.flush(this.beatsNow())) this.changed()
  }

  /**
   * The scene that is sounding now, as one to keep: every track in `tracks`
   * with where its ride is heading (1 for a track never ridden), and every
   * dial with its value. Tracks ridden but not listed are included too.
   */
  capture(init: { id: string; name: string; tracks?: readonly string[] }): PerformScene {
    const rides: Record<string, number> = {}
    for (const track of [...(init.tracks ?? []), ...this.sceneRides.keys()].sort()) {
      rides[track] = this.queuedRides.get(track)?.value ?? this.sceneRides.get(track) ?? 1
    }
    const dials: Record<string, number> = {}
    for (const dial of this.current.dials)
      dials[dial.id] = this.dialValues.get(dial.id) ?? dial.value
    return { id: init.id, name: init.name, rides, dials }
  }

  /**
   * Back to the piece as composed: every ride to 1, every dial to rest, no
   * scene in play and nothing waiting. Takes `seconds` (default 0.5).
   */
  reset(seconds: number = DEFAULT_RESET_SECONDS): void {
    this.assertLive()
    const at = this.engine.now()
    const timeConstant = Math.max(MIN_TIME_CONSTANT, seconds / MORPH_TIME_CONSTANTS)
    for (const track of this.sceneRides.keys()) {
      this.resolveStrip(track)?.setRide(1, {
        layer: SCENE_RIDE_LAYER,
        at,
        timeConstant,
        arriveAt: at + seconds,
      })
      this.events.emit({ type: 'ride', track, value: 1, at })
    }
    this.sceneRides.clear()
    this.queuedRides.clear()
    this.queued = null
    this.scene = null
    this.followAtBeats = null
    for (const dial of this.current.dials) this.dialValues.set(dial.id, dial.value)
    this.applyDials({ at, seconds })
    this.events.emit({ type: 'scene', scene: null, at })
    this.changed()
  }

  /**
   * Take up a performance where another performer left it (a host that
   * builds its engine anew, or starts one late): the scene in play, where
   * every ride stands and every dial's value, at once and with no morph.
   * Whatever waited for a line is dropped.
   */
  restore(from: {
    scene?: string | null
    rides?: Readonly<Record<string, number>>
    dials?: Readonly<Record<string, number>>
  }): void {
    this.assertLive()
    const at = this.engine.now()
    const rides = from.rides ?? {}
    this.queued = null
    this.queuedRides.clear()
    for (const track of this.sceneRides.keys()) {
      if (!(track in rides)) this.resolveStrip(track)?.setRide(1, { layer: SCENE_RIDE_LAYER, at })
    }
    this.sceneRides.clear()
    for (const [track, value] of Object.entries(rides)) {
      const ride = clamp(value, 0, MAX_RIDE)
      this.sceneRides.set(track, ride)
      this.resolveStrip(track)?.setRide(ride, { layer: SCENE_RIDE_LAYER, at })
    }
    for (const dial of this.current.dials) {
      const value = from.dials?.[dial.id]
      if (typeof value === 'number') this.dialValues.set(dial.id, clamp(value, 0, 1))
    }
    this.applyDials({ at, seconds: 0 })
    this.scene = from.scene && this.findScene(from.scene) ? from.scene : null
    this.armFollow(this.beatsNow())
    this.events.emit({ type: 'scene', scene: this.scene, at })
    this.changed()
  }

  /**
   * Puts every ride on the strip it belongs to again, for a host whose strips
   * come and go (a track rebuilt by a render starts at 1). A strip that is
   * already heading where it should is left alone, so this is cheap to call
   * after every render.
   */
  refresh(): void {
    if (this.disposed) return
    const at = this.engine.now()
    for (const [track, value] of this.sceneRides) {
      const strip = this.resolveStrip(track)
      if (strip && strip.ride(SCENE_RIDE_LAYER) !== value) {
        strip.setRide(value, { layer: SCENE_RIDE_LAYER, at })
      }
    }
    this.applyDialRides({ at, seconds: 0 })
  }

  // --- Dials ----------------------------------------------------------------------------

  /** A dial's value, or null for one the set does not have. */
  dialValue(id: string): number | null {
    return this.dialValues.get(id) ?? null
  }

  /**
   * Put a dial somewhere between 0 and 1. Every target follows through its
   * own range and curve, gliding there over `seconds`. Safe to call every
   * frame. Returns false for a dial the set does not have.
   */
  dial(id: string, value: number, options: DialOptions = {}): boolean {
    this.assertLive()
    const dial = this.current.dials.find((candidate) => candidate.id === id)
    if (!dial) return false
    const next = clamp(value, 0, 1)
    if (this.dialValues.get(id) === next) return true
    const glide: PerformGlide = {
      at: options.at ?? this.engine.now(),
      seconds: Math.max(0, options.seconds ?? DEFAULT_DIAL_GLIDE_SECONDS),
    }
    this.dialValues.set(id, next)
    this.applyDial(dial, glide)
    this.events.emit({ type: 'dial', dial: id, value: next, at: glide.at })
    this.changed()
    return true
  }

  // --- Cues -----------------------------------------------------------------------------

  /**
   * Play a cue of the set once, on the next line of its grid. Returns the
   * audio-clock time it starts, or null when the set has no such cue or its
   * sample is not loaded. Unlike a scene, a cue is handed to the graph at
   * once: it sounds at that time whatever the transport does meanwhile.
   */
  cue(id: string, options: { quantize?: LaunchQuantize } = {}): number | null {
    this.assertLive()
    const cue = this.current.cues.find((candidate) => candidate.id === id)
    return cue ? this.play(cue, options) : null
  }

  /**
   * Play a cue the set does not hold: any loaded sample, once, on the cue
   * grid. For a host whose pads are not the set's own (a hand of sounds, a
   * game that fires what it likes). It lands and is announced as `cue` does.
   */
  play(cue: PerformCue, options: { quantize?: LaunchQuantize } = {}): number | null {
    this.assertLive()
    const sample = this.engine.samples.get(cue.sample)
    if (!sample) return null
    const grid = options.quantize ?? cue.quantize ?? this.current.cueQuantize
    const beats = this.lineAfter(grid)
    const at = beats === null ? this.engine.now() : this.contextTimeAtBeats(beats)
    const voice = this.cues().play(
      `cue:${cue.id}:${(this.cueCount += 1)}`,
      cueVoice(cue, sample.buffer),
      at,
    )
    if (!voice) return null
    this.events.emit({ type: 'cue', cue: cue.id, at })
    return at
  }

  // --- Following ------------------------------------------------------------------------

  /** Whether scenes hand over by their follow rules. Starts as the set says. */
  get follows(): boolean {
    return this.following
  }

  /** Switch following for this performance, whatever the set says. */
  follow(on: boolean): void {
    if (this.following === on) return
    this.following = on
    this.armFollow(this.beatsNow())
    this.events.emit({ type: 'set' })
    this.changed()
  }

  // --- Reading it -----------------------------------------------------------------------

  get state(): PerformState {
    const now = this.beatsNow()
    const playing = this.engine.transport.state === 'playing'
    const rides: Record<string, number> = {}
    for (const [track, value] of [...this.sceneRides].sort()) rides[track] = value
    const queuedRides: Record<string, number> = {}
    for (const [track, ride] of [...this.queuedRides].sort()) queuedRides[track] = ride.value
    const dials: Record<string, number> = {}
    for (const dial of this.current.dials)
      dials[dial.id] = this.dialValues.get(dial.id) ?? dial.value
    return {
      scene: this.scene,
      queued: this.queued?.scene ?? null,
      queuedInBeats:
        this.queued && playing && this.queued.beats !== null
          ? Math.max(0, this.queued.beats - now)
          : null,
      rides,
      queuedRides,
      dials,
      following: this.following,
      followInBeats:
        this.following && this.followAtBeats !== null
          ? Math.max(0, this.followAtBeats - now)
          : null,
    }
  }

  /** Every event, as it happens. Returns the unsubscribe function. */
  onEvent(listener: PerformListener): () => void {
    return this.events.subscribe(listener)
  }

  /** One kind of event. Returns the unsubscribe function. */
  on<T extends PerformEventType>(
    type: T,
    listener: (event: Extract<PerformEvent, { type: T }>) => void,
  ): () => void {
    return this.events.subscribe((event) => {
      if (event.type === type) listener(event as Extract<PerformEvent, { type: T }>)
    })
  }

  /** Whenever `state` may read differently (not on bars and beats). Returns the unsubscribe function. */
  onChange(listener: (performer: Performer) => void): () => void {
    return this.changes.subscribe(listener)
  }

  /** Puts every ride back at 1 and every dial's host targets at rest, and lets go of the engine. */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    for (const off of this.unsubscribe.splice(0)) off()
    try {
      const at = this.engine.now()
      for (const dial of this.current.dials) {
        for (const target of dial.targets) {
          if (target.kind !== 'host') continue
          this.host?.(target.id, shapeDial(target, dial.value), {
            at,
            seconds: DEFAULT_DIAL_GLIDE_SECONDS,
          })
        }
      }
      for (const track of this.sceneRides.keys()) {
        this.resolveStrip(track)?.setRide(1, { layer: SCENE_RIDE_LAYER, at })
      }
      for (const track of this.dialRidden) {
        this.resolveStrip(track)?.setRide(1, { layer: DIAL_RIDE_LAYER, at })
      }
    } catch {
      // The engine went first; its strips are gone with it.
    }
    this.cueTrack?.dispose()
    this.cueTrack = null
    this.events.clear()
    this.changes.clear()
  }

  // --- The clock, in beats ------------------------------------------------------------------

  private tempo(): TempoMap {
    return typeof this.tempoSource === 'function' ? this.tempoSource() : this.tempoSource
  }

  /** Beats one pass of the loop holds, or null when the timeline does not loop. */
  private passBeats(tempo: TempoMap): number | null {
    const loop = this.engine.transport.loop
    return isLooping(loop) ? tempo.secondsToBeats(loop.lengthSec) : null
  }

  /**
   * Beats since the timeline began, counting every pass of the loop. `now` is
   * the reading of the clock a sum is made at: one that works out a time from
   * the playhead and from this count takes both at the same reading, since the
   * clock moves on between two.
   */
  private beatsNow(now: number = this.engine.now()): number {
    const transport = this.engine.transport
    const tempo = this.tempo()
    const perPass = this.passBeats(tempo)
    if (perPass === null) return tempo.secondsToBeats(transport.elapsed(now))
    const positionSec = transport.position(now).positionSec
    const passes = Math.round((transport.elapsed(now) - positionSec) / transport.loop.lengthSec)
    return passes * perPass + tempo.secondsToBeats(positionSec)
  }

  /**
   * The audio-clock time `beats` falls on, never earlier than now. Worked out
   * from where the playhead is rather than from the count itself, so it holds
   * whatever the transport's own count of the run started from.
   */
  private contextTimeAtBeats(beats: number): number {
    const now = this.engine.now()
    const transport = this.engine.transport
    if (transport.state !== 'playing') return now
    const tempo = this.tempo()
    const positionSec = transport.position(now).positionSec
    const ahead = tempo.secondsToBeats(positionSec) + (beats - this.beatsNow(now))
    const perPass = this.passBeats(tempo)
    let aheadSec: number
    if (perPass === null || perPass <= 0) {
      aheadSec = tempo.beatsToSeconds(ahead) - positionSec
    } else {
      const passes = Math.floor(ahead / perPass + BEAT_EPSILON)
      const within = Math.max(0, ahead - passes * perPass)
      aheadSec = passes * transport.loop.lengthSec + tempo.beatsToSeconds(within) - positionSec
    }
    return Math.max(now, transport.contextTimeAtElapsed(transport.elapsed(now) + aheadSec))
  }

  /**
   * The next line of `grid` at or after now, in beats since the timeline
   * began; null when the move should not wait (the grid is `'none'`, or the
   * transport is not playing). The end of a pass is always a line: the loop
   * comes round to its first bar there, whatever the grid.
   */
  private lineAfter(grid: LaunchQuantize): number | null {
    const transport = this.engine.transport
    if (grid === 'none' || transport.state !== 'playing') return null
    const tempo = this.tempo()
    const now = this.engine.now()
    const positionSec = transport.position(now).positionSec
    let lineSec = quantizeLaunch(tempo, positionSec, grid)
    if (isLooping(transport.loop)) lineSec = Math.min(lineSec, transport.loop.lengthSec)
    return this.beatsNow(now) + (tempo.secondsToBeats(lineSec) - tempo.secondsToBeats(positionSec))
  }

  /**
   * Whether a move is to be handed to the graph: at once when it waits for
   * no line, otherwise when its line is near. While the transport is not
   * playing a line never comes, and what waits for one goes on waiting.
   */
  private due(beats: number | null, now: number): boolean {
    if (beats === null) return true
    const transport = this.engine.transport
    if (transport.state !== 'playing') return false
    const tempo = this.tempo()
    const secondsPerBeat = tempo.secondsPerBeatAt(transport.position().positionSec)
    return (beats - now) * secondsPerBeat <= this.lookaheadSec * transport.rate
  }

  /** Audio-clock seconds `bars` take at the tempo and speed the transport is at now. */
  private barsToSeconds(bars: number): number {
    const transport = this.engine.transport
    const tempo = this.tempo()
    const positionSec = transport.position().positionSec
    const beats = bars * tempo.beatsPerBarAt(positionSec)
    return (beats * tempo.secondsPerBeatAt(positionSec)) / Math.max(1e-6, transport.rate)
  }

  // --- Moves ------------------------------------------------------------------------------

  private queueScene(move: Omit<QueuedScene, 'beats'>, atBeats?: number): void {
    const beats = atBeats ?? this.lineAfter(move.quantize ?? this.current.quantize)
    this.queued = { ...move, beats }
    this.events.emit({ type: 'queue', scene: move.scene })
    // A line already inside the lookahead does not wait for the next tick.
    if (!this.flush(this.beatsNow())) this.changed()
  }

  /** Hands every move whose line is near to the graph. Returns whether any was. */
  private flush(now: number): boolean {
    let moved = false
    if (this.queued && this.due(this.queued.beats, now)) {
      const queued = this.queued
      this.queued = null
      this.arrive(queued, now)
      moved = true
    }
    for (const [track, ride] of [...this.queuedRides]) {
      if (!this.due(ride.beats, now)) continue
      this.queuedRides.delete(track)
      const at = ride.beats === null ? this.engine.now() : this.contextTimeAtBeats(ride.beats)
      this.moveRide(track, ride.value, at, ride.morphBars ?? this.current.morphBars)
      moved = true
    }
    if (moved) this.changed()
    return moved
  }

  private arrive(queued: QueuedScene, now: number): void {
    const scene = this.findScene(queued.scene)
    if (!scene) return
    const beats = queued.beats ?? now
    const at = queued.beats === null ? this.engine.now() : this.contextTimeAtBeats(beats)
    const morphBars = queued.morphBars ?? scene.morphBars ?? this.current.morphBars
    for (const track of Object.keys(scene.rides)) {
      // The scene speaks for the track from here: a single ride still waiting gives way.
      this.queuedRides.delete(track)
      this.moveRide(track, scene.rides[track], at, morphBars)
    }
    const glide: PerformGlide = { at, seconds: this.barsToSeconds(morphBars) }
    for (const dial of this.current.dials) {
      const value = scene.dials[dial.id]
      if (value === undefined) continue
      this.dialValues.set(dial.id, value)
      this.applyDial(dial, glide)
      this.events.emit({ type: 'dial', dial: dial.id, value, at })
    }
    this.scene = scene.id
    this.armFollow(beats)
    this.events.emit({ type: 'scene', scene: scene.id, at })
  }

  private moveRide(track: string, value: number, at: number, morphBars: number): void {
    this.sceneRides.set(track, value)
    const seconds = this.barsToSeconds(morphBars)
    const timeConstant = Math.max(MIN_TIME_CONSTANT, seconds / MORPH_TIME_CONSTANTS)
    this.resolveStrip(track)?.setRide(value, {
      layer: SCENE_RIDE_LAYER,
      at,
      timeConstant,
      arriveAt: at + seconds,
    })
    this.events.emit({ type: 'ride', track, value, at })
  }

  // --- Dials ------------------------------------------------------------------------------

  private applyDials(glide: PerformGlide): void {
    for (const dial of this.current.dials) this.applyDial(dial, glide, false)
    this.applyDialRides(glide)
  }

  private applyDial(dial: PerformDial, glide: PerformGlide, rides = true): void {
    const value = this.dialValues.get(dial.id) ?? dial.value
    for (const target of dial.targets) {
      if (target.kind === 'host') this.host?.(target.id, shapeDial(target, value), glide)
    }
    if (rides && dial.targets.some((target) => target.kind === 'ride')) this.applyDialRides(glide)
  }

  /**
   * Every track's dial ride: the product of what each dial that moves it
   * gives it. A track no dial moves any more goes back to 1.
   */
  private applyDialRides(glide: PerformGlide): void {
    const rides = new Map<string, number>()
    for (const dial of this.current.dials) {
      const value = this.dialValues.get(dial.id) ?? dial.value
      for (const target of dial.targets) {
        if (target.kind !== 'ride') continue
        rides.set(target.track, (rides.get(target.track) ?? 1) * shapeDial(target, value))
      }
    }
    const timeConstant = Math.max(MIN_TIME_CONSTANT, glide.seconds / MORPH_TIME_CONSTANTS)
    for (const track of new Set([...this.dialRidden, ...rides.keys()])) {
      const value = clamp(rides.get(track) ?? 1, 0, MAX_RIDE)
      const strip = this.resolveStrip(track)
      if (strip && strip.ride(DIAL_RIDE_LAYER) !== value) {
        strip.setRide(value, {
          layer: DIAL_RIDE_LAYER,
          at: glide.at,
          timeConstant,
          arriveAt: glide.at + glide.seconds,
        })
      }
      if (rides.has(track)) this.dialRidden.add(track)
      else this.dialRidden.delete(track)
    }
  }

  // --- Following ----------------------------------------------------------------------------

  /** Sets when the scene in play draws its rule, counting from `beats`. */
  private armFollow(beats: number): void {
    const rule = this.scene ? this.findScene(this.scene)?.follow : undefined
    if (!rule || !this.following) {
      this.followAtBeats = null
      return
    }
    const tempo = this.tempo()
    const positionSec = this.engine.transport.position().positionSec
    const seconds = followTimeSeconds(tempo, positionSec, rule.after)
    this.followPeriodBeats = Math.max(
      BEAT_EPSILON,
      tempo.secondsToBeats(positionSec + seconds) - tempo.secondsToBeats(positionSec),
    )
    this.followAtBeats = beats + this.followPeriodBeats
  }

  private random(): number {
    if (this.randomOverride) return this.randomOverride()
    const seed = typeof this.seedSource === 'function' ? this.seedSource() : this.seedSource
    return seededUnit(seed, 'perform', (this.draws += 1))
  }

  private drawFollow(now: number): void {
    if (!this.following || this.followAtBeats === null || this.queued || !this.scene) return
    if (!this.due(this.followAtBeats, now)) return
    const scene = this.findScene(this.scene)
    const rule = scene?.follow
    if (!scene || !rule) {
      this.followAtBeats = null
      return
    }
    const target = drawPerformFollow(rule, () => this.random())
    const next = resolvePerformFollow(target, scene.id, this.current.scenes, () => this.random())
    const at = this.followAtBeats
    if (next === null) {
      // It stays: the rule comes round again after the same time.
      this.followAtBeats = at + this.followPeriodBeats
      return
    }
    this.queueScene({ scene: next, morphBars: undefined, quantize: undefined, followed: true }, at)
  }

  // --- Ticks --------------------------------------------------------------------------------

  private onTick(tick: SchedulerTick): void {
    if (this.disposed) return
    // The scheduler runs a pass of its own when the transport moves, and it
    // hears of the move before this performer does: nothing is handed over on
    // a line of the timeline that has just gone.
    if (tick.reason === 'loop') {
      this.unsettled = true
      return
    }
    if (tick.reason === 'seek' || this.unsettled) this.relocate()
    const now = this.beatsNow()
    this.look(now)
    this.drawFollow(now)
    this.flush(now)
    this.reportLines(now)
  }

  /** Notes where the timeline stands and what the audio clock reads. */
  private look(beats: number): void {
    this.lastBeats = beats
    this.lastClock = this.engine.now()
    this.lastPlaying = this.engine.transport.state === 'playing'
  }

  /**
   * The timeline is somewhere else (a seek, a stop, a loop that changed):
   * what waited for a line waits for the next one from here, and a follow
   * rule keeps the time it had left. Doing it twice changes nothing.
   */
  private relocate(): void {
    this.unsettled = false
    const transport = this.engine.transport
    const now = this.beatsNow()
    // How far the timeline has moved beyond what playing would have moved it.
    const played = this.lastPlaying
      ? ((this.engine.now() - this.lastClock) * transport.rate) /
        this.tempo().secondsPerBeatAt(transport.position().positionSec)
      : 0
    const jumped = now - this.lastBeats - played
    this.look(now)
    if (Math.abs(jumped) < JUMP_EPSILON_BEATS) return
    if (this.followAtBeats !== null) this.followAtBeats += jumped
    if (this.queued) {
      this.queued = {
        ...this.queued,
        beats: this.queued.followed
          ? this.followAtBeats
          : this.lineAfter(this.queued.quantize ?? this.current.quantize),
      }
    }
    for (const [track, ride] of [...this.queuedRides]) {
      this.queuedRides.set(track, {
        ...ride,
        beats: this.lineAfter(ride.quantize ?? this.current.quantize),
      })
    }
    this.reportedBeat = Math.ceil(now - BEAT_EPSILON) - 1
  }

  /** Reports every beat, and every bar line among them, that has come inside the lookahead. */
  private reportLines(now: number): void {
    const transport = this.engine.transport
    if (transport.state !== 'playing' || this.events.size === 0) return
    const tempo = this.tempo()
    const secondsPerBeat = tempo.secondsPerBeatAt(transport.position().positionSec)
    const horizon = now + (this.lookaheadSec * transport.rate) / secondsPerBeat
    const perPass = this.passBeats(tempo)
    // Far behind (the first tick after a long wait): only the lines still to come matter.
    let beat = Math.max(this.reportedBeat + 1, Math.ceil(now - BEAT_EPSILON))
    for (; beat <= horizon; beat += 1) {
      const pass = perPass === null ? 0 : Math.floor(beat / perPass + BEAT_EPSILON)
      const within = perPass === null ? beat : Math.max(0, beat - pass * perPass)
      const place = tempo.barBeatAt(tempo.beatsToSeconds(within))
      const at = this.contextTimeAtBeats(beat)
      const inBar = Math.round(place.beat)
      this.events.emit({ type: 'beat', bar: place.bar, beat: inBar, pass, at })
      if (inBar === 0) this.events.emit({ type: 'bar', bar: place.bar, pass, at })
      this.reportedBeat = beat
    }
  }

  private onTransportChange(change: TransportChange): void {
    if (this.disposed) return
    switch (change.reason) {
      case 'seek':
      case 'stop':
      case 'end':
        this.relocate()
        this.flush(this.lastBeats)
        break
      case 'loop':
        // A host that changes its tempo stretches the loop and moves its tempo
        // map in two steps, in either order: the lines are found again on the
        // next tick, when both have happened.
        this.unsettled = true
        break
      case 'start':
        this.look(this.beatsNow())
        this.reportedBeat = Math.ceil(this.lastBeats - BEAT_EPSILON) - 1
        break
      case 'pause':
        this.look(this.beatsNow())
        break
      case 'rate':
        break
      default: {
        const exhaustive: never = change.reason
        return exhaustive
      }
    }
    this.changed()
  }

  // --- Internals ----------------------------------------------------------------------------

  private findScene(id: string): PerformScene | undefined {
    return this.current.scenes.find((candidate) => candidate.id === id)
  }

  private cues(): AudioTrack {
    this.cueTrack ??= new AudioTrack(this.engine.context, {
      name: 'perform cues',
      destination: this.cueDestination ?? this.engine.master,
      samples: this.engine.samples,
      now: () => this.engine.now(),
      spaceImpulse: () => this.engine.spaceImpulse(),
      spaceColour: () => this.engine.spaceColour(),
    })
    return this.cueTrack
  }

  private changed(): void {
    this.changes.emit(this)
  }

  private assertLive(): void {
    if (this.disposed) throw new Error('live-mix: this performer is disposed')
  }
}

/** A cue as a voice: the whole sample once, at its own level and place. */
function cueVoice(cue: PerformCue, buffer: AudioBuffer): ClipVoiceOptions {
  return {
    buffer,
    offsetSec: 0,
    durationSec: buffer.duration,
    fadeInSec: 0,
    fadeOutSec: 0,
    fadeCurve: 'linear',
    gainDb: cue.gainDb,
    pan: cue.pan,
    spaceDb: cue.spaceDb,
  }
}

/** The strip of whatever the engine has under `name`: a track of any kind, a group or a return. */
export function engineStrip(engine: Engine, name: string): ChannelStrip | null {
  const hosts = [
    ...engine.tracks,
    ...engine.stretchTracks,
    ...engine.instruments,
    ...engine.liveInputs,
    ...engine.groups,
    ...engine.returnTracks,
  ]
  return hosts.find((host) => host.name === name)?.strip ?? null
}
