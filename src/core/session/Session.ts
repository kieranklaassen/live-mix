// The session grid runtime (U31, R8): scenes × clip slots over the score,
// launched with quantisation on the tempo map, stopped on the same grid,
// chained by follow actions drawn from an injected random source.
//
// One source of truth: a launch is an operation on the score document. The
// slot's clip is placed on its track's arrangement lane at the quantised
// launch time (`clip.add`), a stop trims that clip to the stop boundary
// (`clip.trim`, or `clip.remove` when nothing of it has played), and a scene
// launch is one `batch`. The `ScoreRenderer` that follows the document hands
// the placed clip to the track's `AudioTrack`, whose `Scheduler` window turns
// the start into a sample-accurate `source.start(when)` — so the grid plays
// through exactly the path the arrangement plays through, the arrangement
// view shows what the grid did, and undo takes a launch back.
//
// What the document cannot express is the end of a voice already sounding:
// the scheduler leaves sounding starts alone when their clip changes, so a
// stop also fades the live voice at the boundary through the rendered
// `AudioTrack` (found on the engine by the track's id). Without an engine the
// session is a pure editor over the document.
//
// Time inside the runtime is arrangement seconds (`Transport.position()`),
// and the transport loop is expected off for a session performance: with it
// on, launches quantise inside the pass and the placed clips replay on every
// pass like any arrangement clip.

import { type Clip } from '../clips/Clip'
import { type Engine } from '../Engine'
import { TempoMap, type TempoSegment } from '../time/TempoMap'
import { type AudioTrack } from '../tracks/AudioTrack'
import { isLooping, type TransportPosition } from '../transport/anchor'
import { type SchedulerTick } from '../transport/Scheduler'
import { type TransportChange } from '../transport/Transport'
import { type Author } from '../../score/log'
import { type Operation } from '../../score/operations'
import {
  findScene,
  findSlot,
  findTrack,
  slotAt,
  type Score,
  type ScoreAudioTrack,
} from '../../score/schema'
import { type ScoreDocument } from '../../score/ScoreDocument'
import {
  drawFollowAction,
  resolveFollowAction,
  type FollowActionKind,
  type ScoreFollowAction,
} from './followActions'
import { followTimeSeconds, quantizeLaunch, type LaunchQuantize } from './launch'
import { type ScoreSlot, type SlotClip, type SlotState, trackSlots } from './Slot'

export interface SessionOptions {
  /** The document the grid edits; every launch and stop is an operation on it. */
  document: ScoreDocument
  /**
   * The engine whose transport and scheduler drive the grid and whose
   * rendered tracks sound it. Without one the session only edits the document.
   */
  engine?: Engine
  /** Overrides the document's tempo map (`score.tempo`) for quantisation and follow times. */
  tempo?: TempoMap
  /** Random source in [0, 1) for follow-action draws. Default `Math.random`. */
  random?: () => number
  /**
   * How far ahead of the playhead follow actions fire, so the next clip is
   * placed before the scheduler's window reaches its start. Default 0.5.
   */
  lookaheadSec?: number
  /**
   * Immediate launches (`'none'`, or a grid line already reached) are placed
   * this far ahead of the playhead: a start behind the playhead is skipped by
   * the scheduler, never replayed. Default 0.05.
   */
  immediateLeadSec?: number
  /** Start the transport when something is launched while it is not playing. Default true. */
  autoStart?: boolean
  /** Length a launched looping clip is placed with until a stop trims it. Default 3600. */
  openEndSec?: number
  /** Author every launch and stop is logged under. Default: the document's. */
  author?: Author
}

export const DEFAULT_SESSION_LOOKAHEAD_SECONDS = 0.5
export const DEFAULT_IMMEDIATE_LEAD_SECONDS = 0.05
export const DEFAULT_OPEN_END_SECONDS = 3600
/** A stop with no fade of its own still de-clicks over this. */
export const MIN_STOP_FADE_SECONDS = 0.005

export interface LaunchOptions {
  /** Overrides the slot's (and the score's) quantisation for this launch. */
  quantize?: LaunchQuantize
}

/** Where a slot stands, for grids and history. */
export interface SlotStatus {
  slotId: string
  track: string
  scene: string
  state: SlotState
  /** The arrangement clip the launch placed, while queued or playing. */
  clipId: string | null
  /** Arrangement seconds the launch starts and ends at. */
  startSec: number | null
  endSec: number | null
  /** A stop is placed at `endSec`; the slot sounds until then. */
  stopping: boolean
  /** Arrangement second the next follow action is evaluated at. */
  followAtSec: number | null
}

export interface TrackStatus {
  track: string
  /** Slot sounding on the track. */
  playing: string | null
  /** Slot placed but not yet started. */
  queued: string | null
}

export type SessionListener = (session: Session) => void

/** One placed launch: the slot, its arrangement clip and where it sits. */
interface Launch {
  slotId: string
  track: string
  clipId: string
  clip: SlotClip
  /** Arrangement seconds. */
  startSec: number
  endSec: number
  /** Offset into the source the placed clip enters at (legato moves it). */
  offsetSec: number
  /** Explicit stop placed at `endSec`. */
  stopping: boolean
  /** Next follow evaluation, in arrangement seconds; null when the slot has no follow action. */
  followAt: number | null
  /** Set once a follow evaluation has been fired for `followAt` (it may re-arm). */
  followFired: boolean
  /** Set by the tick once the playhead has passed `startSec`. */
  started: boolean
  /** The launch wrapped past the loop end: it starts in the next pass, after the playhead wraps. */
  nextPass: boolean
}

/** What placing a slot amounts to: the operations, and the launch record when a clip was placed. */
interface Placement {
  /** Null when only the track's outgoing launch was closed (a legato one-shot with nothing left). */
  launch: Launch | null
  ops: Operation[]
}

export class Session {
  readonly document: ScoreDocument
  readonly engine: Engine | null
  readonly lookaheadSec: number
  readonly immediateLeadSec: number
  readonly autoStart: boolean
  readonly openEndSec: number
  private readonly random: () => number
  private readonly author: Author | undefined
  private readonly tempoOverride: TempoMap | null
  private tempoCache: { segments: readonly TempoSegment[]; map: TempoMap } | null = null
  private readonly launches: Launch[] = []
  private readonly listeners = new Set<SessionListener>()
  private readonly unsubscribe: (() => void)[] = []
  private lastPositionSec = 0
  private launchCounter = 0
  private currentVersion = 0
  private disposed = false

  constructor(options: SessionOptions) {
    this.document = options.document
    this.engine = options.engine ?? null
    this.tempoOverride = options.tempo ?? null
    this.random = options.random ?? Math.random
    this.lookaheadSec = Math.max(0, options.lookaheadSec ?? DEFAULT_SESSION_LOOKAHEAD_SECONDS)
    this.immediateLeadSec = Math.max(0, options.immediateLeadSec ?? DEFAULT_IMMEDIATE_LEAD_SECONDS)
    this.autoStart = options.autoStart ?? true
    this.openEndSec = Math.max(1, options.openEndSec ?? DEFAULT_OPEN_END_SECONDS)
    this.author = options.author
    if (this.engine) {
      this.lastPositionSec = this.engine.transport.position().positionSec
      this.unsubscribe.push(
        this.engine.scheduler.onTick((tick) => this.onTick(tick)),
        this.engine.transport.onChange((change) => this.onTransportChange(change)),
        this.engine.onDispose(() => this.dispose()),
      )
    }
    this.unsubscribe.push(
      this.document.onChange((change) => {
        if (change.kind === 'load') this.launches.length = 0
        else this.dropOrphans()
        this.emit()
      }),
    )
  }

  /** The current score. */
  get score(): Score {
    return this.document.score
  }

  /** Seconds ↔ bars: the `tempo` option, else the document's tempo map (`tempo.set` moves it). */
  get tempo(): TempoMap {
    if (this.tempoOverride) return this.tempoOverride
    const segments = this.score.tempo
    if (this.tempoCache?.segments !== segments) {
      this.tempoCache = { segments, map: new TempoMap(segments) }
    }
    return this.tempoCache.map
  }

  /** Bumped on every change a listener is told about. */
  get version(): number {
    return this.currentVersion
  }

  /** The score's global launch quantisation. */
  get quantize(): LaunchQuantize {
    return this.score.transport.quantize
  }

  get isDisposed(): boolean {
    return this.disposed
  }

  /** Set the score's global launch quantisation (an operation). */
  setQuantize(quantize: LaunchQuantize): void {
    this.apply({ type: 'transport.quantize', quantize }, `launch quantisation`)
  }

  // --- Reading -----------------------------------------------------------------------------

  /** Where every slot stands, in score order. */
  statuses(): SlotStatus[] {
    return this.score.slots.map((slot) => this.statusOf(slot))
  }

  status(slotId: string): SlotStatus {
    const slot = findSlot(this.score, slotId)
    if (!slot) throw new Error(`live-mix: no slot "${slotId}"`)
    return this.statusOf(slot)
  }

  /** The state of a grid cell; `empty` when no slot sits there. */
  cellState(track: string, scene: string): SlotState {
    const slot = slotAt(this.score, track, scene)
    return slot ? this.statusOf(slot).state : 'empty'
  }

  trackStatus(track: string): TrackStatus {
    const playing = this.launches.find((launch) => launch.track === track && launch.started)
    const queued = this.launches.find((launch) => launch.track === track && !launch.started)
    return { track, playing: playing?.slotId ?? null, queued: queued?.slotId ?? null }
  }

  /** Audio tracks in score order — the grid's columns. */
  tracks(): ScoreAudioTrack[] {
    return this.score.tracks.filter((track): track is ScoreAudioTrack => track.kind === 'audio')
  }

  // --- Launching and stopping --------------------------------------------------------------

  /**
   * Press a slot. `trigger` launches (retriggering when it plays), `toggle`
   * stops a slot that is queued or playing, `gate` launches until
   * `release`. An empty slot stops its track. Quantised to the slot's, the
   * score's or the given grid; starts the transport when `autoStart`.
   */
  launchSlot(slotId: string, options: LaunchOptions = {}): void {
    const slot = this.requireSlot(slotId)
    if (slot.launchMode === 'toggle') {
      const active = this.activeLaunch(slotId)
      if (active && !active.stopping) {
        this.stopSlot(slotId, options)
        return
      }
    }
    if (slot.clip === null) {
      this.stopTrack(slot.track, options)
      return
    }
    const at = this.launchTime(options.quantize ?? slot.quantize ?? this.quantize)
    const placed = this.place(slot, at)
    if (placed.ops.length === 0) return
    this.apply(batch(placed.ops), `launch ${slotId}`)
    if (placed.launch) this.launches.push(placed.launch)
    this.emit()
  }

  /** Release a pressed slot: stops a `gate` slot at the next grid line; other modes ignore it. */
  releaseSlot(slotId: string, options: LaunchOptions = {}): void {
    const slot = this.requireSlot(slotId)
    if (slot.launchMode !== 'gate') return
    this.stopSlot(slotId, options)
  }

  /**
   * Launch every slot in a scene at one quantised time: slots with clips
   * start, empty slots stop their track, tracks without a slot in the row are
   * left alone. One undo step.
   */
  launchScene(sceneId: string, options: LaunchOptions = {}): void {
    if (!findScene(this.score, sceneId)) throw new Error(`live-mix: no scene "${sceneId}"`)
    const at = this.launchTime(options.quantize ?? this.quantize)
    const ops: Operation[] = []
    const placed: Launch[] = []
    for (const track of this.tracks()) {
      const slot = slotAt(this.score, track.id, sceneId)
      if (!slot) continue
      if (slot.clip === null) {
        ops.push(...this.stopTrackOps(track.id, at))
        continue
      }
      const result = this.place(slot, at)
      ops.push(...result.ops)
      if (result.launch) placed.push(result.launch)
    }
    if (ops.length === 0) return
    this.apply(batch(ops), `launch scene ${sceneId}`)
    this.launches.push(...placed)
    this.emit()
  }

  /** Stop a slot at the next grid line (a queued launch is withdrawn). */
  stopSlot(slotId: string, options: LaunchOptions = {}): void {
    const slot = this.requireSlot(slotId)
    const launch = this.activeLaunch(slotId)
    if (!launch) return
    const at = this.launchTime(options.quantize ?? slot.quantize ?? this.quantize)
    const ops = this.closeOps(launch, at)
    if (ops.length === 0) return
    this.apply(batch(ops), `stop ${slotId}`)
    this.emit()
  }

  /** Stop whatever plays or is queued on a track at the next grid line. */
  stopTrack(track: string, options: LaunchOptions = {}): void {
    const at = this.launchTime(options.quantize ?? this.quantize)
    const ops = this.stopTrackOps(track, at)
    if (ops.length === 0) return
    this.apply(batch(ops), `stop ${track}`)
    this.emit()
  }

  /** Stop every slot at the next grid line. One undo step. */
  stopAll(options: LaunchOptions = {}): void {
    const at = this.launchTime(options.quantize ?? this.quantize)
    const ops: Operation[] = []
    for (const track of this.tracks()) ops.push(...this.stopTrackOps(track.id, at))
    if (ops.length === 0) return
    this.apply(batch(ops), 'stop all')
    this.emit()
  }

  /**
   * One evaluation pass at `positionSec` (arrangement seconds): marks
   * launches the playhead has reached, drops those that ended, fires follow
   * actions due inside the lookahead. Runs on the scheduler tick when an
   * engine is attached; call it by hand otherwise.
   */
  tick(positionSec: number): void {
    if (this.disposed) return
    const wrapped = positionSec < this.lastPositionSec
    this.lastPositionSec = positionSec
    const horizon = positionSec + this.lookaheadSec
    let changed = this.dropOrphans()
    for (const launch of [...this.launches]) {
      if (!this.launches.includes(launch)) continue
      if (launch.nextPass) {
        if (!wrapped) continue
        launch.nextPass = false
      }
      if (!launch.started && positionSec >= launch.startSec) {
        launch.started = true
        changed = true
      }
      if (launch.followAt !== null && !launch.followFired && launch.followAt < horizon) {
        launch.followFired = true
        this.fireFollow(launch)
        changed = true
        continue
      }
      if (positionSec >= launch.endSec && (launch.followAt === null || launch.followFired)) {
        this.forget(launch)
        changed = true
      }
    }
    if (changed) this.emit()
  }

  onChange(listener: SessionListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Stop following the engine and the document. Nothing in the score changes. */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    for (const off of this.unsubscribe) off()
    this.unsubscribe.length = 0
    this.launches.length = 0
    this.listeners.clear()
  }

  // --- Placement -----------------------------------------------------------------------------

  /**
   * The arrangement second a launch requested now lands at. Past the end of
   * an enabled loop the time wraps into the next pass (and reads below the
   * playhead, which `place` records as `nextPass`).
   */
  private launchTime(quantize: LaunchQuantize): number {
    const position = this.currentPosition()
    const now = position.positionSec
    this.lastPositionSec = now
    let at = quantizeLaunch(this.tempo, now, quantize)
    if (at < now + this.immediateLeadSec) at = now + this.immediateLeadSec
    const loop = this.engine?.transport.loop
    if (loop && isLooping(loop) && at >= loop.lengthSec) at -= loop.lengthSec
    return at
  }

  private currentPosition(): TransportPosition {
    const transport = this.engine?.transport
    if (!transport) return { positionSec: this.lastPositionSec, iteration: 0, finished: false }
    if (transport.state !== 'playing' && this.autoStart) transport.start()
    return transport.position()
  }

  /**
   * The operations that launch `slot` at `at` — closing whatever the track
   * has placed first, so one clip plays per track — and the launch record.
   */
  private place(slot: ScoreSlot, at: number): Placement {
    const track = findTrack(this.score, slot.track)
    if (slot.clip === null || track?.kind !== 'audio') return { launch: null, ops: [] }
    const outgoing = this.launches.find((launch) => launch.track === slot.track && launch.started)
    const ops = this.stopTrackOps(slot.track, at)

    let offsetSec = slot.clip.offsetSec
    let durationSec = slot.clip.loop ? this.openEndSec : slot.clip.durationSec
    if (slot.legato && outgoing && at > outgoing.startSec) {
      const carried = legatoEntry(outgoing, slot.clip, at, this.openEndSec)
      if (!carried) return { launch: null, ops }
      offsetSec = carried.offsetSec
      durationSec = carried.durationSec
    }
    const clipId = this.freshClipId(track, slot)
    const clip: Clip = {
      id: clipId,
      sourceId: slot.clip.sourceId,
      startSec: at,
      offsetSec,
      durationSec,
      fadeInSec: slot.clip.fadeInSec,
      fadeOutSec: slot.clip.fadeOutSec,
      fadeCurve: slot.clip.fadeCurve,
      gainDb: slot.clip.gainDb,
    }
    if (slot.clip.loop) clip.loop = true
    if (slot.clip.warp !== undefined) clip.warp = slot.clip.warp
    if (slot.clip.semitones !== undefined) clip.semitones = slot.clip.semitones
    ops.push({ type: 'clip.add', track: slot.track, clip })
    const launch: Launch = {
      slotId: slot.id,
      track: slot.track,
      clipId,
      clip: slot.clip,
      startSec: at,
      endSec: at + durationSec,
      offsetSec,
      stopping: false,
      followAt: slot.follow ? at + this.followSeconds(slot.follow, slot.clip, at) : null,
      followFired: false,
      started: false,
      nextPass: at < this.lastPositionSec,
    }
    return { launch, ops }
  }

  private followSeconds(follow: ScoreFollowAction, clip: SlotClip, fromSec: number): number {
    if (follow.time === undefined) return clip.durationSec
    return followTimeSeconds(this.tempo, fromSec, follow.time)
  }

  /** Operations that end `launch` at `at`, and the matching voice fade. */
  private closeOps(launch: Launch, at: number): Operation[] {
    if (launch.stopping && launch.endSec <= at) return []
    const ops: Operation[] = []
    if (launch.nextPass || at <= launch.startSec) {
      ops.push({ type: 'clip.remove', track: launch.track, id: launch.clipId })
      this.forget(launch)
      return ops
    }
    if (at < launch.endSec) {
      ops.push({
        type: 'clip.trim',
        track: launch.track,
        id: launch.clipId,
        durationSec: at - launch.startSec,
      })
    }
    launch.endSec = Math.min(launch.endSec, at)
    launch.stopping = true
    launch.followAt = null
    this.fadeVoice(launch, at)
    return ops
  }

  private stopTrackOps(track: string, at: number): Operation[] {
    const ops: Operation[] = []
    for (const launch of [...this.launches]) {
      if (launch.track === track) ops.push(...this.closeOps(launch, at))
    }
    return ops
  }

  private fireFollow(launch: Launch): void {
    const slot = findSlot(this.score, launch.slotId)
    if (!slot?.follow || launch.followAt === null) return
    const at = launch.followAt
    const column = trackSlots(
      this.score,
      launch.track,
      this.score.scenes.map((scene) => scene.id),
    )
    const action: FollowActionKind = drawFollowAction(slot.follow, this.random)
    const outcome = resolveFollowAction(action, slot, column, this.random)
    switch (outcome.kind) {
      case 'continue': {
        const next = at + this.followSeconds(slot.follow, launch.clip, at)
        if (next < launch.endSec) {
          launch.followAt = next
          launch.followFired = false
        } else {
          launch.followAt = null
        }
        return
      }
      case 'stop': {
        const ops = this.closeOps(launch, at)
        if (ops.length) this.apply(batch(ops), `follow: stop ${launch.slotId}`)
        return
      }
      case 'launch': {
        const placed = this.place(outcome.slot, at)
        if (placed.ops.length)
          this.apply(batch(placed.ops), `follow: ${action} → ${outcome.slot.id}`)
        if (placed.launch) this.launches.push(placed.launch)
        return
      }
      default: {
        const exhaustive: never = outcome
        return exhaustive
      }
    }
  }

  // --- Voices --------------------------------------------------------------------------------

  /** Fade the live voice of a launch out to end at arrangement second `at`. */
  private fadeVoice(launch: Launch, at: number): void {
    const engine = this.engine
    if (engine?.transport.state !== 'playing') return
    const track = this.liveTrack(launch.track)
    if (!track) return
    const now = engine.now()
    const ctxAt = engine.transport.contextTimeAt(at)
    for (const voice of track.voices()) {
      if (!voice.key.startsWith(`${launch.clipId}:`)) continue
      if (voice.startTime > ctxAt) continue // pending: the scheduler re-derives it from the trimmed clip
      const fade = Math.max(MIN_STOP_FADE_SECONDS, launch.clip.fadeOutSec)
      const from = Math.max(now, ctxAt - fade)
      const seconds = Math.max(MIN_STOP_FADE_SECONDS, ctxAt - from)
      track.fadeOutVoice(voice.key, from, seconds)
    }
  }

  private liveTrack(id: string): AudioTrack | undefined {
    return this.engine?.tracks.find((track) => track.name === id)
  }

  // --- Bookkeeping -----------------------------------------------------------------------------

  private onTick(tick: SchedulerTick): void {
    // A re-pin's pass runs inside the scheduler's own transport listener,
    // before ours: `onTransportChange` closes the launches where the playhead
    // was, so that pass must not move `lastPositionSec`.
    if (tick.reason === 'seek' || tick.reason === 'loop') return
    this.tick(tick.position.positionSec)
  }

  private onTransportChange(change: TransportChange): void {
    switch (change.reason) {
      case 'start':
      case 'pause':
        this.lastPositionSec = change.position.positionSec
        return
      case 'seek':
      case 'loop':
      case 'stop':
      case 'end': {
        const at = change.reason === 'end' ? change.position.positionSec : this.lastPositionSec
        this.closeEverything(at)
        this.lastPositionSec = change.position.positionSec
        return
      }
      default: {
        const exhaustive: never = change.reason
        return exhaustive
      }
    }
  }

  /** Trim every placed clip to `at` (or withdraw it) and forget the runtime. */
  private closeEverything(at: number): void {
    if (this.launches.length === 0) return
    const ops: Operation[] = []
    for (const launch of [...this.launches]) {
      if (!this.launches.includes(launch)) continue
      if (launch.nextPass || at <= launch.startSec) {
        ops.push({ type: 'clip.remove', track: launch.track, id: launch.clipId })
      } else if (at < launch.endSec) {
        ops.push({
          type: 'clip.trim',
          track: launch.track,
          id: launch.clipId,
          durationSec: at - launch.startSec,
        })
      }
    }
    this.launches.length = 0
    if (ops.length) this.apply(batch(ops), 'session: transport moved')
    this.emit()
  }

  /** Forget launches whose clip left the document (undo, an edit); true when any did. */
  private dropOrphans(): boolean {
    let dropped = false
    for (const launch of [...this.launches]) {
      const track = findTrack(this.score, launch.track)
      const present =
        track?.kind === 'audio' && track.clips.some((clip) => clip.id === launch.clipId)
      if (!present) {
        this.forget(launch)
        dropped = true
      }
    }
    return dropped
  }

  private forget(launch: Launch): void {
    const index = this.launches.indexOf(launch)
    if (index !== -1) this.launches.splice(index, 1)
  }

  private activeLaunch(slotId: string): Launch | undefined {
    return this.launches.find((launch) => launch.slotId === slotId)
  }

  private requireSlot(slotId: string): ScoreSlot {
    const slot = findSlot(this.score, slotId)
    if (!slot) throw new Error(`live-mix: no slot "${slotId}"`)
    return slot
  }

  private statusOf(slot: ScoreSlot): SlotStatus {
    const launch = this.activeLaunch(slot.id)
    let state: SlotState = slot.clip === null ? 'empty' : 'stopped'
    if (launch && slot.clip !== null) {
      if (!launch.started) state = 'queued'
      else if (this.lastPositionSec < launch.endSec) state = 'playing'
    }
    return {
      slotId: slot.id,
      track: slot.track,
      scene: slot.scene,
      state,
      clipId: launch?.clipId ?? null,
      startSec: launch?.startSec ?? null,
      endSec: launch?.endSec ?? null,
      stopping: launch?.stopping ?? false,
      followAtSec: launch?.followAt ?? null,
    }
  }

  /** A clip id unique on the track: `<slot>@<n>`. */
  private freshClipId(track: ScoreAudioTrack, slot: ScoreSlot): string {
    for (;;) {
      this.launchCounter += 1
      const id = `${slot.id}@${this.launchCounter}`
      if (!track.clips.some((clip) => clip.id === id)) return id
    }
  }

  private apply(op: Operation, label: string): void {
    const options: { author?: Author; label: string } = { label }
    if (this.author) options.author = this.author
    this.document.apply(op, options)
  }

  private emit(): void {
    this.currentVersion += 1
    for (const listener of [...this.listeners]) listener(this)
  }
}

/** Several operations as one undo step; a single one stands on its own. */
function batch(ops: Operation[]): Operation {
  if (ops.length === 1) return ops[0]
  return { type: 'batch', ops }
}

/**
 * Legato entry: the incoming clip enters at the position the outgoing one
 * had reached at `at` (modulo the outgoing clip's length while it loops),
 * wrapped into the incoming clip while that loops. A one-shot with nothing
 * left to play yields null.
 */
function legatoEntry(
  outgoing: Launch,
  incoming: SlotClip,
  at: number,
  openEndSec: number,
): { offsetSec: number; durationSec: number } | null {
  const elapsed = Math.max(0, at - outgoing.startSec)
  const outLength = outgoing.clip.durationSec
  const position =
    outgoing.clip.loop && outLength > 0 ? elapsed % outLength : Math.min(elapsed, outLength)
  if (incoming.loop) {
    const inLength = incoming.durationSec
    const wrapped = inLength > 0 ? position % inLength : 0
    return { offsetSec: incoming.offsetSec + wrapped, durationSec: openEndSec }
  }
  const remaining = incoming.durationSec - position
  if (remaining <= 0) return null
  return { offsetSec: incoming.offsetSec + position, durationSec: remaining }
}
