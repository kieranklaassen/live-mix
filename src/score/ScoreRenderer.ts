// The reconciler: makes a live `Engine` match a `Score`, using nothing but
// the engine's public API. Given the previously rendered score and the next
// one it computes what changed and issues exactly the calls an app would
// have made by hand — `addAudioTrack`, `strip.setLevel`, `addInsert`,
// `clips.set`, `automation.add`, `modulation.map` — so the graph, the node
// creation order and the recorded AudioParam events are the same whether a
// document or imperative code drove the engine (the golden test asserts it).
//
// Precedence on one parameter: routes (ModMatrix, base = lane or the static
// value) > lane (LaneWriter) > the static value in the strip or device. A
// parameter with a lane or a route is owned by the binding; the renderer
// never writes its static value while the binding exists, and hands the
// parameter back at the static value when the binding goes. Live-input
// tracks are created from the document but their audio is the app's — it
// attaches the stream through `renderer.liveInput(id)`. Rendering is
// serialised: renders requested while one is in flight fold into the next.

import { LEVEL_RAMP_SECONDS } from '../core/buses/Bus'
import { type Clip } from '../core/clips/Clip'
import { type Device } from '../core/devices/Device'
import { NodeDevice } from '../core/devices/native/NodeDevice'
import { isNoteDevice } from '../core/devices/Device'
import { clampParam } from '../core/params'
import { defaultPreset, presetParams, resolvePreset } from '../core/devices/presets'
import { type DeviceRegistry } from '../core/devices/registry'
import { type LaneWriter } from '../core/automation/LaneWriter'
import {
  audioParamTarget,
  deviceParamTarget,
  type ModRoute,
  type ModTarget,
} from '../core/automation/ModMatrix'
import { ExternalPhase, Lfo, Macro, Random, type ModSource } from '../core/automation/Modulator'
import { nodeDeviceParam } from '../core/automation/node-device-param'
import { ParamLane } from '../core/automation/ParamLane'
import { type ScheduledParam } from '../core/automation/scheduled-param'
import { type Engine } from '../core/Engine'
import { ElementSource } from '../core/sources/ElementSource'
import { type ElementTrack } from '../core/sources/ElementTrack'
import { TempoMap } from '../core/time/TempoMap'
import { AudioTrack, DEFAULT_LOOKAHEAD_SECONDS } from '../core/tracks/AudioTrack'
import { resolveInput, type ChannelStrip, type StripDestination } from '../core/tracks/ChannelStrip'
import { GroupTrack } from '../core/tracks/GroupTrack'
import { InstrumentTrack } from '../core/tracks/InstrumentTrack'
import { LiveInputTrack } from '../core/tracks/LiveInputTrack'
import { ReturnTrack } from '../core/tracks/ReturnTrack'
import { type SampleSource } from '../core/tracks/SampleStore'
import { type Bus } from '../core/buses/Bus'
import { type ScoreDocument } from './ScoreDocument'
import {
  MASTER_OWNER,
  STRIP_PARAM_RANGES,
  assertValidScore,
  createScore,
  defaultStrip,
  findDevice,
  sameDestination,
  sameTempo,
  stripHosts,
  targetKey,
  type ParamTarget,
  type Score,
  type ScoreDestination,
  type ScoreDevice,
  type ScoreElementTrack,
  type ScoreGroup,
  type ScoreLane,
  type ScoreModRoute,
  type ScoreModulator,
  type ScoreReturn,
  type ScoreSource,
  type ScoreStrip,
  type ScoreStripHost,
  type ScoreTrack,
  type StripParam,
} from './schema'

export type RenderedHost = AudioTrack | LiveInputTrack | InstrumentTrack | GroupTrack | ReturnTrack

export interface ScoreRendererOptions {
  /**
   * How an element track streams a score source: the `ElementSource` for a
   * source with a `url`. Default: `new ElementSource(ctx, { id, url })`, i.e.
   * an `<audio>` element. Inject for tests and non-DOM hosts.
   */
  createElementSource?: (source: ScoreSource, ctx: BaseAudioContext) => ElementSource | undefined
  /** Registry devices are created from. Default: the engine's. */
  devices?: DeviceRegistry
  /**
   * What the `SampleStore` decodes for a score source a clip needs and the
   * store has not loaded. Default: the source's `url`. Return undefined to
   * leave loading to the app.
   */
  resolveSource?: (source: ScoreSource) => SampleSource | undefined
  /** Called when a render triggered by a document change fails. Default: rethrow. */
  onError?: (error: unknown) => void
}

export class ScoreRenderError extends Error {
  constructor(message: string) {
    super(`live-mix: score render: ${message}`)
    this.name = 'ScoreRenderError'
  }
}

interface OwnerHandle {
  kind: ScoreTrack['kind'] | 'group' | 'return'
  host: RenderedHost
  strip: ChannelStrip
  /** Insert instances by chain position, with their score ids. */
  inserts: Device[]
  insertIds: string[]
  /** The return each send was wired to, by return id. */
  sendTargets: Map<string, ReturnTrack>
  /** Device id the return's or instrument's own device was created from. */
  ownDeviceId?: string
}

type Binding =
  | { kind: 'writer'; signature: string; lane: ParamLane; writer: LaneWriter }
  | {
      kind: 'matrix'
      signature: string
      target: ModTarget
      lane: ParamLane | null
      routes: Map<string, ModRoute>
    }

interface BindingSpec {
  target: ParamTarget
  lane: ScoreLane | null
  routes: ScoreModRoute[]
}

const EMPTY_SCORE = createScore({ id: '' })

export class ScoreRenderer {
  readonly engine: Engine
  readonly devices: DeviceRegistry
  private readonly resolveSourceFn: (source: ScoreSource) => SampleSource | undefined
  private readonly createElementSourceFn: (
    source: ScoreSource,
    ctx: BaseAudioContext,
  ) => ElementSource | undefined
  private readonly elementTracks = new Map<string, ElementTrack>()
  private readonly onError: (error: unknown) => void
  private readonly owners = new Map<string, OwnerHandle>()
  private readonly deviceMap = new Map<string, Device>()
  private masterInserts: Device[] = []
  private masterInsertIds: string[] = []
  private readonly lanes = new Map<string, ParamLane>()
  private readonly modulators = new Map<string, ModSource>()
  private readonly modulatorGeneration = new Map<string, number>()
  private readonly bindings = new Map<string, Binding>()
  private renderedScore: Score | null = null
  private latest: Score | null = null
  private inFlight: Promise<void> | null = null
  private scheduled = false
  private detachDocument: (() => void) | null = null
  private readonly unsubscribeEngine: () => void
  private disposed = false

  constructor(engine: Engine, options: ScoreRendererOptions = {}) {
    this.engine = engine
    this.devices = options.devices ?? engine.devices
    this.resolveSourceFn = options.resolveSource ?? ((source) => source.url)
    this.createElementSourceFn =
      options.createElementSource ??
      ((source, ctx) =>
        source.url === undefined
          ? undefined
          : new ElementSource(ctx, { id: source.id, url: source.url }))
    this.onError =
      options.onError ??
      ((error) => {
        throw error
      })
    // The engine tears its graph down itself; the renderer only lets go.
    this.unsubscribeEngine = engine.onDispose(() => this.dispose({ engineDisposed: true }))
  }

  /** The score the engine currently reflects (null before the first render). */
  get rendered(): Score | null {
    return this.renderedScore
  }

  /** True while a render runs or one is queued. */
  get busy(): boolean {
    return this.inFlight !== null || this.scheduled
  }

  get isDisposed(): boolean {
    return this.disposed
  }

  // --- Handles -------------------------------------------------------------------------

  /** The live object a track, group or return id renders to. */
  host(id: string): RenderedHost {
    return this.owners.get(id)?.host ?? this.missing(id)
  }

  audioTrack(id: string): AudioTrack {
    const host = this.host(id)
    if (!(host instanceof AudioTrack)) throw new ScoreRenderError(`"${id}" is not an audio track`)
    return host
  }

  /** The live-input track for a declared `live` track — attach the stream here. */
  liveInput(id: string): LiveInputTrack {
    const host = this.host(id)
    if (!(host instanceof LiveInputTrack)) throw new ScoreRenderError(`"${id}" is not a live track`)
    return host
  }

  instrument(id: string): InstrumentTrack {
    const host = this.host(id)
    if (!(host instanceof InstrumentTrack))
      throw new ScoreRenderError(`"${id}" is not an instrument track`)
    return host
  }

  group(id: string): GroupTrack {
    const host = this.host(id)
    if (!(host instanceof GroupTrack)) throw new ScoreRenderError(`"${id}" is not a group`)
    return host
  }

  /** The live element track for a score element track id. */
  elementTrack(id: string): ElementTrack {
    const track = this.elementTracks.get(id)
    if (!track) throw new ScoreRenderError(`no element track "${id}"`)
    return track
  }

  returnTrack(id: string): ReturnTrack {
    const host = this.host(id)
    if (!(host instanceof ReturnTrack)) throw new ScoreRenderError(`"${id}" is not a return`)
    return host
  }

  /** The live device for a score device instance id. */
  device(id: string): Device {
    return this.deviceMap.get(id) ?? this.missing(id)
  }

  /** The modulation source for a score modulator id (`ExternalPhase` is driven through this). */
  modulator(id: string): ModSource {
    return this.modulators.get(id) ?? this.missing(id)
  }

  /** The `ParamLane` a score lane renders to. */
  lane(id: string): ParamLane {
    return this.lanes.get(id) ?? this.missing(id)
  }

  // --- Rendering -----------------------------------------------------------------------

  /**
   * Bring the engine to `score`. Validates against the device registry
   * before touching the graph. Serialised: a render requested while one is
   * running is folded into the next pass, and the returned promise settles
   * when the engine reflects the latest request.
   */
  render(score: Score): Promise<void> {
    if (this.disposed) return Promise.reject(new ScoreRenderError('renderer is disposed'))
    this.latest = score
    // Chain behind whatever is running (a failed pass does not poison the
    // next); `drain` then catches up to the latest request in one go.
    const previous = this.inFlight ?? Promise.resolve()
    const run: Promise<void> = previous
      .catch(() => {})
      .then(() => this.drain())
      .finally(() => {
        if (this.inFlight === run) this.inFlight = null
      })
    this.inFlight = run
    return run
  }

  /** Follow a document: every change renders (bursts fold into one pass). Returns the detach. */
  attach(document: ScoreDocument): () => void {
    this.detachDocument?.()
    const unsubscribe = document.onChange(() => this.schedule(document))
    this.detachDocument = () => {
      unsubscribe()
      this.detachDocument = null
    }
    this.schedule(document)
    return this.detachDocument
  }

  /**
   * Resolves once no render is running or queued. Failures are not
   * re-thrown here: `render()` callers get them from their own promise and
   * document-driven renders report through `onError`.
   */
  async whenIdle(): Promise<void> {
    while (this.scheduled || this.inFlight) {
      if (this.inFlight) await this.inFlight.catch(() => {})
      else await new Promise<void>((resolve) => queueMicrotask(resolve))
    }
  }

  /**
   * Stop following the document and remove everything this renderer created
   * from the engine (unless the engine itself is being disposed, in which
   * case it takes the graph down and the renderer only forgets).
   */
  dispose(options: { engineDisposed?: boolean } = {}): void {
    if (this.disposed) return
    this.disposed = true
    this.detachDocument?.()
    this.unsubscribeEngine()
    if (!options.engineDisposed) {
      for (const binding of this.bindings.values()) this.teardownBinding(binding)
      for (const handle of this.owners.values()) {
        for (const [target] of handle.sendTargets) this.removeSend(handle, target)
      }
      for (const id of [...this.owners.keys()]) this.removeOwner(id)
      for (const id of [...this.elementTracks.keys()]) this.removeElementTrack(id)
      for (const device of this.masterInserts) {
        this.engine.master.removeInsert(device)
        device.dispose()
      }
    }
    this.bindings.clear()
    this.owners.clear()
    this.elementTracks.clear()
    this.masterInserts = []
    this.masterInsertIds = []
    this.deviceMap.clear()
    this.lanes.clear()
    this.modulators.clear()
    this.renderedScore = null
    this.latest = null
  }

  /** Route a failure from a background render to the `onError` option. */
  handleError(error: unknown): void {
    this.onError(error)
  }

  private schedule(document: ScoreDocument): void {
    if (this.scheduled || this.disposed) return
    this.scheduled = true
    queueMicrotask(() => {
      this.scheduled = false
      if (this.disposed) return
      this.render(document.score).catch((error: unknown) => this.handleError(error))
    })
  }

  private async drain(): Promise<void> {
    while (this.latest && this.latest !== this.renderedScore && !this.disposed) {
      const target = this.latest
      await this.reconcile(this.renderedScore ?? EMPTY_SCORE, target)
      this.renderedScore = target
    }
  }

  private async reconcile(prev: Score, next: Score): Promise<void> {
    assertValidScore(next, { devices: this.devices })
    const now = (): number => this.engine.now()

    // 1. Transport.
    if (
      prev.transport.loop.enabled !== next.transport.loop.enabled ||
      prev.transport.loop.lengthSec !== next.transport.loop.lengthSec
    ) {
      this.engine.transport.setLoop({
        enabled: next.transport.loop.enabled,
        lengthSec: next.transport.loop.lengthSec ?? Infinity,
      })
    }

    if (!sameTempo(prev.tempo, next.tempo) || this.renderedScore === null) {
      this.engine.tempo = new TempoMap(next.tempo)
    }

    // 2. Modulators first: a recreated source changes the signature of every route on it.
    this.reconcileModulators(prev.modulators, next.modulators, now)

    // 3. Bindings that are gone or change shape come down before anything they hold is removed.
    const prevSpecs = bindingSpecs(prev)
    const nextSpecs = bindingSpecs(next)
    for (const [key, binding] of this.bindings) {
      const spec = nextSpecs.get(key)
      if (!spec || this.signatureFor(spec) !== binding.signature) {
        this.teardownBinding(binding)
        this.bindings.delete(key)
        if (!spec) this.restoreStatic(prevSpecs.get(key)?.target, next)
      }
    }

    // 4. Master.
    if (prev.master.level !== next.master.level && !nextSpecs.has(targetKey(masterLevelTarget()))) {
      this.engine.master.setLevel(next.master.level)
    }
    await this.reconcileInserts(
      this.engine.master,
      prev.master.inserts,
      next.master.inserts,
      this.masterInserts,
      this.masterInsertIds,
      nextSpecs,
    )

    // 5. Owners: remove what is gone or must be rebuilt, then add in dependency order.
    //    A rebuilt owner is a new one for every later step (`added`).
    const nextHosts = new Map(stripHosts(next).map((host) => [host.id, host]))
    for (const [id, handle] of [...this.owners]) {
      const host = nextHosts.get(id)
      if (!host || this.needsRebuild(handle, host)) {
        for (const [, other] of this.owners) {
          if (other.sendTargets.has(id)) this.removeSend(other, id)
        }
        this.removeOwner(id)
      }
    }
    const added = new Set<string>()
    this.addGroups(next, added)
    for (const ret of next.returns) if (!this.owners.has(ret.id)) await this.addReturn(ret, added)
    for (const track of next.tracks)
      if (!this.owners.has(track.id)) await this.addTrack(track, added)

    // 5b. Element tracks: no strip, so a destination change is a rebuild.
    const nextElements = new Map(next.elementTracks.map((track) => [track.id, track]))
    const prevElements = new Map(prev.elementTracks.map((track) => [track.id, track]))
    for (const id of [...this.elementTracks.keys()]) {
      const spec = nextElements.get(id)
      const before = prevElements.get(id)
      if (!spec || !before || !sameDestination(before.destination, spec.destination)) {
        this.removeElementTrack(id)
      }
    }
    for (const track of next.elementTracks) {
      if (!this.elementTracks.has(track.id)) this.addElementTrack(track, added)
    }

    const prevHosts = new Map(stripHosts(prev).map((host) => [host.id, host]))
    const priorOf = (id: string): ScoreStripHost | undefined =>
      added.has(id) ? undefined : prevHosts.get(id)

    // 6. Routing of hosts that already existed.
    for (const host of stripHosts(next)) {
      const before = priorOf(host.id)
      if (before && !sameDestination(before.destination, host.destination)) {
        this.handle(host.id).strip.connectTo(this.resolveDestination(host.destination))
      }
    }

    // 7. Strip settings (fader, pan, trim, mute, solo, solo-safe).
    for (const host of stripHosts(next)) {
      const handle = this.handle(host.id)
      const before = priorOf(host.id)?.strip ?? defaultStrip({ soloSafe: handle.kind === 'return' })
      this.reconcileStrip(handle, host.id, before, host.strip, nextSpecs)
    }

    // 8. Inserts and own devices.
    for (const host of stripHosts(next)) {
      const handle = this.handle(host.id)
      const before = priorOf(host.id)
      if ('device' in host && before && 'device' in before) {
        this.reconcileDeviceState(
          this.device(host.device.id),
          before.device,
          host.device,
          nextSpecs,
        )
      }
      await this.reconcileInserts(
        handle.strip,
        before?.strip.inserts ?? [],
        host.strip.inserts,
        handle.inserts,
        handle.insertIds,
        nextSpecs,
      )
    }

    // 9. Sends.
    for (const host of stripHosts(next)) {
      const handle = this.handle(host.id)
      const before = priorOf(host.id)?.strip.sends ?? []
      this.reconcileSends(handle, before, host.strip.sends, now)
    }

    // 10. Clips and lookahead.
    for (const track of next.tracks) {
      if (track.kind !== 'audio') continue
      const live = this.audioTrack(track.id)
      const before = priorOf(track.id)
      const beforeTrack = before && 'kind' in before && before.kind === 'audio' ? before : null
      const lookahead = track.lookaheadSec ?? DEFAULT_LOOKAHEAD_SECONDS
      if (beforeTrack && live.lookaheadSec !== lookahead) live.lookaheadSec = lookahead
      const preload = track.preloadSec ?? lookahead
      if (beforeTrack && live.preloadSec !== preload) live.preloadSec = preload
      if (!beforeTrack || !sameClips(beforeTrack.clips, track.clips)) live.clips.set(track.clips)
    }

    // 10b. Element clips and lookahead.
    for (const track of next.elementTracks) {
      const live = this.elementTrack(track.id)
      const before = added.has(track.id) ? undefined : prevElements.get(track.id)
      const lookahead = track.lookaheadSec ?? DEFAULT_LOOKAHEAD_SECONDS
      if (before && live.lookaheadSec !== lookahead) live.lookaheadSec = lookahead
      const preload = track.preloadSec ?? lookahead
      if (before && live.preloadSec !== preload) live.preloadSec = preload
      if (!before || !sameClips(before.clips, track.clips)) live.clips.set(track.clips)
    }

    // 11. Bindings that are new or changed; lanes no longer in the document are forgotten.
    for (const [key, spec] of nextSpecs) {
      const existing = this.bindings.get(key)
      if (existing) {
        this.updateBinding(existing, spec, next)
        continue
      }
      this.bindings.set(key, this.buildBinding(spec, next))
    }
    for (const id of [...this.lanes.keys()]) {
      if (!next.lanes.some((lane) => lane.id === id)) this.lanes.delete(id)
    }
  }

  // --- Owners --------------------------------------------------------------------------

  private needsRebuild(handle: OwnerHandle, host: ScoreStripHost): boolean {
    const kind = 'kind' in host ? host.kind : 'device' in host ? 'return' : 'group'
    if (handle.kind !== kind) return true
    if ('device' in host) return handle.ownDeviceId !== host.device.deviceId
    return false
  }

  /** Groups first, parents before children, so every destination exists when its feeders arrive. */
  private addGroups(next: Score, added: Set<string>): void {
    let pending = next.groups.filter((group) => !this.owners.has(group.id))
    while (pending.length > 0) {
      const ready = pending.filter(
        (group) => group.destination.kind === 'master' || this.owners.has(group.destination.id),
      )
      if (ready.length === 0) throw new ScoreRenderError('group routing cycle')
      for (const group of ready) this.addGroup(group, added)
      pending = pending.filter((group) => !this.owners.has(group.id))
    }
  }

  private addGroup(group: ScoreGroup, added: Set<string>): void {
    const live = this.engine.addGroup(group.id, {
      destination: this.resolveDestination(group.destination),
    })
    this.owners.set(group.id, this.newHandle('group', live, live.strip))
    added.add(group.id)
  }

  private async addReturn(ret: ScoreReturn, added: Set<string>): Promise<void> {
    const device = await this.createDevice(ret.device)
    const live = this.engine.addReturnTrack(ret.id, {
      device,
      destination: this.resolveDestination(ret.destination),
    })
    const handle = this.newHandle('return', live, live.strip)
    handle.ownDeviceId = ret.device.deviceId
    this.owners.set(ret.id, handle)
    added.add(ret.id)
  }

  private async addTrack(track: ScoreTrack, added: Set<string>): Promise<void> {
    const destination = this.resolveDestination(track.destination)
    added.add(track.id)
    switch (track.kind) {
      case 'audio': {
        const live = this.engine.addAudioTrack(track.id, {
          destination,
          lookaheadSec: track.lookaheadSec,
          preloadSec: track.preloadSec,
          resolveSource: (clip) => this.resolveClipSource(clip),
        })
        this.owners.set(track.id, this.newHandle('audio', live, live.strip))
        return
      }
      case 'live': {
        const live = this.engine.addLiveInputTrack(track.id, { destination })
        this.owners.set(track.id, this.newHandle('live', live, live.strip))
        return
      }
      case 'instrument': {
        const device = await this.createDevice(track.device)
        if (!isNoteDevice(device)) {
          device.dispose()
          this.deviceMap.delete(track.device.id)
          throw new ScoreRenderError(
            `device "${track.device.deviceId}" plays no notes; an instrument track needs a NoteDevice`,
          )
        }
        const live = this.engine.addInstrumentTrack(track.id, { device, destination })
        const handle = this.newHandle('instrument', live, live.strip)
        handle.ownDeviceId = track.device.deviceId
        this.owners.set(track.id, handle)
        return
      }
      default: {
        const exhaustive: never = track
        return exhaustive
      }
    }
  }

  private addElementTrack(track: ScoreElementTrack, added: Set<string>): void {
    added.add(track.id)
    const live = this.engine.addElementTrack(track.id, {
      destination: resolveInput(this.resolveDestination(track.destination)),
      lookaheadSec: track.lookaheadSec,
      preloadSec: track.preloadSec,
      resolveSource: (clip) => this.resolveElementSource(clip),
    })
    this.elementTracks.set(track.id, live)
  }

  private removeElementTrack(id: string): void {
    if (!this.elementTracks.has(id)) return
    this.engine.removeElementTrack(id)
    this.elementTracks.delete(id)
  }

  private resolveElementSource(clip: Clip): ElementSource | undefined {
    const score = this.latest ?? this.renderedScore
    const source = score?.sources.find((candidate) => candidate.id === clip.sourceId)
    return source ? this.createElementSourceFn(source, this.engine.context) : undefined
  }

  private newHandle(
    kind: OwnerHandle['kind'],
    host: RenderedHost,
    strip: ChannelStrip,
  ): OwnerHandle {
    return { kind, host, strip, inserts: [], insertIds: [], sendTargets: new Map() }
  }

  private removeOwner(id: string): void {
    const handle = this.owners.get(id)
    if (!handle) return
    for (const [key, binding] of [...this.bindings]) {
      if (bindingTouches(key, id, handle.insertIds, this.ownDeviceScoreId(id))) {
        this.teardownBinding(binding)
        this.bindings.delete(key)
      }
    }
    for (const [target] of handle.sendTargets) this.removeSend(handle, target)
    for (const device of handle.inserts) {
      handle.strip.removeInsert(device)
      device.dispose()
    }
    for (const scoreId of handle.insertIds) this.deviceMap.delete(scoreId)
    const own = this.ownDeviceScoreId(id)
    if (own !== null) this.deviceMap.delete(own)
    const { host } = handle
    if (host instanceof AudioTrack) this.engine.removeTrack(id)
    else if (host instanceof LiveInputTrack) this.engine.removeLiveInputTrack(id)
    else if (host instanceof InstrumentTrack) this.engine.removeInstrumentTrack(id)
    else if (host instanceof ReturnTrack) this.engine.removeReturnTrack(id)
    else this.engine.removeGroup(id)
    this.owners.delete(id)
  }

  /** The score id of a return's or instrument's own device, from the rendered score. */
  private ownDeviceScoreId(ownerId: string): string | null {
    const score = this.renderedScore
    if (!score) return null
    const host = stripHosts(score).find((candidate) => candidate.id === ownerId)
    return host && 'device' in host ? host.device.id : null
  }

  private handle(id: string): OwnerHandle {
    return this.owners.get(id) ?? this.missing(id)
  }

  private resolveDestination(destination: ScoreDestination): StripDestination {
    if (destination.kind === 'master') return this.engine.master
    return this.group(destination.id)
  }

  private resolveClipSource(clip: Clip): SampleSource | undefined {
    const score = this.latest ?? this.renderedScore
    const source = score?.sources.find((candidate) => candidate.id === clip.sourceId)
    return source ? this.resolveSourceFn(source) : undefined
  }

  // --- Strips ---------------------------------------------------------------------------

  private reconcileStrip(
    handle: OwnerHandle,
    owner: string,
    before: ScoreStrip,
    after: ScoreStrip,
    specs: Map<string, BindingSpec>,
  ): void {
    const { strip } = handle
    const free = (param: StripParam): boolean =>
      !specs.has(targetKey({ kind: 'strip', owner, param }))
    if (before.level !== after.level && free('level')) strip.setLevel(after.level)
    if (before.pan !== after.pan && free('pan')) strip.setPan(after.pan)
    if (before.inputGain !== after.inputGain && free('inputGain'))
      strip.setInputGain(after.inputGain)
    if (before.mute !== after.mute) strip.setMute(after.mute)
    if (before.soloSafe !== after.soloSafe) strip.soloSafe = after.soloSafe
    if (before.solo !== after.solo) strip.setSolo(after.solo)
  }

  // --- Devices --------------------------------------------------------------------------

  private async createDevice(spec: ScoreDevice): Promise<Device> {
    if (this.deviceMap.has(spec.id))
      throw new ScoreRenderError(`device "${spec.id}" is already rendered`)
    const device = await this.devices.create(spec.deviceId, this.engine.context, {
      preset: spec.preset,
      params: spec.params,
    })
    if (spec.bypass) device.bypass = true
    this.deviceMap.set(spec.id, device)
    return device
  }

  /** The full parameter map a score device resolves to: preset (or defaults) under the explicit values. */
  effectiveParams(spec: ScoreDevice): Record<string, number> {
    const descriptor = this.devices.describe(spec.deviceId)
    const params =
      spec.preset === undefined
        ? { ...defaultPreset(descriptor).params }
        : presetParams(descriptor, resolvePreset(descriptor, spec.preset))
    for (const [name, value] of Object.entries(spec.params)) {
      const paramSpec = descriptor.params[name]
      if (paramSpec) params[name] = clampParam(paramSpec, value)
    }
    return params
  }

  /** Param and bypass diffs on a device that already existed (creation covers new ones). */
  private reconcileDeviceState(
    device: Device,
    before: ScoreDevice,
    after: ScoreDevice,
    specs: Map<string, BindingSpec>,
  ): void {
    const previous = this.effectiveParams(before)
    const next = this.effectiveParams(after)
    for (const [name, value] of Object.entries(next)) {
      if (previous[name] === value) continue
      if (specs.has(targetKey({ kind: 'device', device: after.id, param: name }))) continue
      device.setParam(name, value)
    }
    if (before.bypass !== after.bypass) device.bypass = after.bypass
  }

  private async reconcileInserts(
    chain: ChannelStrip | Bus,
    before: readonly ScoreDevice[],
    after: readonly ScoreDevice[],
    devices: Device[],
    ids: string[],
    specs: Map<string, BindingSpec>,
  ): Promise<void> {
    const afterById = new Map(after.map((device) => [device.id, device]))
    const beforeById = new Map(before.map((device) => [device.id, device]))
    // Drop what is gone or changed type; bindings on it come down first so a
    // replacement of the same instance id is bound afresh in the last step.
    for (let index = ids.length - 1; index >= 0; index -= 1) {
      const id = ids[index]
      const next = afterById.get(id)
      if (next && next.deviceId === beforeById.get(id)?.deviceId) continue
      this.teardownBindingsOnDevice(id)
      chain.removeInsert(devices[index])
      devices[index].dispose()
      this.deviceMap.delete(id)
      devices.splice(index, 1)
      ids.splice(index, 1)
    }
    // Keep the matching prefix; rebuild the tail in the new order.
    let prefix = 0
    while (prefix < ids.length && prefix < after.length && ids[prefix] === after[prefix].id)
      prefix += 1
    const detached = new Map<string, Device>()
    for (let index = ids.length - 1; index >= prefix; index -= 1) {
      chain.removeInsert(devices[index])
      detached.set(ids[index], devices[index])
      devices.splice(index, 1)
      ids.splice(index, 1)
    }
    for (let index = prefix; index < after.length; index += 1) {
      const spec = after[index]
      const device = detached.get(spec.id) ?? (await this.createDevice(spec))
      chain.addInsert(device)
      devices.push(device)
      ids.push(spec.id)
    }
    for (const spec of after) {
      const previous = beforeById.get(spec.id)
      if (previous?.deviceId === spec.deviceId) {
        this.reconcileDeviceState(this.device(spec.id), previous, spec, specs)
      }
    }
  }

  // --- Sends ----------------------------------------------------------------------------

  private reconcileSends(
    handle: OwnerHandle,
    before: readonly { target: string; level: number | null }[],
    after: readonly { target: string; level: number | null }[],
    now: () => number,
  ): void {
    const afterByTarget = new Map(after.map((send) => [send.target, send]))
    const beforeByTarget = new Map(before.map((send) => [send.target, send]))
    for (const [target] of [...handle.sendTargets]) {
      const next = afterByTarget.get(target)
      const previous = beforeByTarget.get(target)
      const returnHandle = this.owners.get(target)?.host
      const sameReturn =
        returnHandle !== undefined && handle.sendTargets.get(target) === returnHandle
      const kindChanged =
        previous !== undefined &&
        next !== undefined &&
        (previous.level === null) !== (next.level === null)
      if (!next || !sameReturn || kindChanged) this.removeSend(handle, target)
    }
    for (const send of after) {
      const target = this.returnTrack(send.target)
      if (handle.sendTargets.has(send.target)) {
        const previous = beforeByTarget.get(send.target)
        if (previous && previous.level !== send.level && send.level !== null) {
          const live = handle.strip.sends.all().find((candidate) => candidate.target === target)
          live?.gainNode?.gain.setTargetAtTime(send.level, now(), LEVEL_RAMP_SECONDS)
        }
        continue
      }
      handle.strip.sends.add(target, send.level === null ? {} : { level: send.level })
      handle.sendTargets.set(send.target, target)
    }
  }

  private removeSend(handle: OwnerHandle, target: string): void {
    const live = handle.sendTargets.get(target)
    if (!live) return
    handle.strip.sends.remove(live)
    handle.sendTargets.delete(target)
  }

  // --- Modulators -----------------------------------------------------------------------

  private reconcileModulators(
    before: readonly ScoreModulator[],
    after: readonly ScoreModulator[],
    now: () => number,
  ): void {
    const afterById = new Map(after.map((modulator) => [modulator.id, modulator]))
    for (const id of [...this.modulators.keys()]) {
      const next = afterById.get(id)
      const previous = before.find((modulator) => modulator.id === id)
      if (!next || next.kind !== previous?.kind) {
        this.modulators.delete(id)
        this.modulatorGeneration.set(id, (this.modulatorGeneration.get(id) ?? 0) + 1)
      }
    }
    for (const spec of after) {
      const existing = this.modulators.get(spec.id)
      if (!existing) {
        this.modulators.set(spec.id, createModulator(spec))
        continue
      }
      const previous = before.find((modulator) => modulator.id === spec.id)
      if (previous) updateModulator(existing, previous, spec, now)
    }
  }

  // --- Bindings -------------------------------------------------------------------------

  /** Everything about a binding that cannot change in place; a different signature rebuilds it. */
  private signatureFor(spec: BindingSpec): string {
    const key = targetKey(spec.target)
    const routeIds = spec.routes
      .map(
        (route) => `${route.id}=${route.source}#${this.modulatorGeneration.get(route.source) ?? 0}`,
      )
      .sort()
      .join(',')
    const laneBit = spec.lane ? `${spec.lane.id}@${spec.lane.defaultValue ?? ''}` : ''
    return `${this.bindingKind(spec)}|${key}|${laneBit}|${routeIds}`
  }

  /**
   * A lane alone drives a strip parameter or a `NodeDevice` parameter
   * sample-accurately through a `LaneWriter`; anything with routes, and a
   * lane on a device that cannot schedule its params, goes through the
   * `ModMatrix` at control rate.
   */
  private bindingKind(spec: BindingSpec): 'writer' | 'matrix' {
    if (spec.routes.length > 0) return 'matrix'
    if (spec.target.kind === 'strip') return 'writer'
    return this.deviceMap.get(spec.target.device) instanceof NodeDevice ? 'writer' : 'matrix'
  }

  private buildBinding(spec: BindingSpec, score: Score): Binding {
    const signature = this.signatureFor(spec)
    const [min, max] = this.rangeFor(spec.target, score)
    const lane = spec.lane ? this.laneFor(spec.lane, min, max) : null
    if (this.bindingKind(spec) === 'writer') {
      if (!lane) throw new ScoreRenderError(`nothing binds ${targetKey(spec.target)}`)
      const param = this.scheduledParamFor(spec.target)
      const writer = this.engine.automation.add(lane, param)
      return { kind: 'writer', signature, lane, writer }
    }
    const base = lane ?? this.staticValueFor(spec.target, score)
    const target = this.modTargetFor(spec.target, base)
    const routes = new Map<string, ModRoute>()
    for (const route of spec.routes) {
      routes.set(
        route.id,
        this.engine.modulation.map(this.modulator(route.source), target, {
          depth: route.depth,
          polarity: route.polarity,
        }),
      )
    }
    if (routes.size === 0) this.engine.modulation.attach(target)
    return { kind: 'matrix', signature, target, lane, routes }
  }

  private updateBinding(binding: Binding, spec: BindingSpec, score: Score): void {
    if (spec.lane) {
      const lane = binding.lane
      if (lane && !sameBreakpoints(lane, spec.lane)) lane.replace(spec.lane.breakpoints)
    }
    if (binding.kind === 'matrix') {
      for (const route of spec.routes) {
        const live = binding.routes.get(route.id)
        if (!live) continue
        live.depth = route.depth
        live.polarity = route.polarity
      }
      if (!spec.lane) binding.target.base = this.staticValueFor(spec.target, score)
    }
  }

  private teardownBindingsOnDevice(deviceId: string): void {
    for (const [key, binding] of [...this.bindings]) {
      if (!key.startsWith(`device:${deviceId}:`)) continue
      this.teardownBinding(binding)
      this.bindings.delete(key)
    }
  }

  private teardownBinding(binding: Binding): void {
    switch (binding.kind) {
      case 'writer':
        this.engine.automation.remove(binding.writer)
        return
      case 'matrix':
        this.engine.modulation.detach(binding.target)
        return
      default: {
        const exhaustive: never = binding
        return exhaustive
      }
    }
  }

  /** After a binding goes, the parameter returns to the document's static value. */
  private restoreStatic(target: ParamTarget | undefined, score: Score): void {
    if (!target) return
    switch (target.kind) {
      case 'strip': {
        if (target.owner === MASTER_OWNER) {
          this.engine.master.setLevel(score.master.level)
          return
        }
        const host = stripHosts(score).find((candidate) => candidate.id === target.owner)
        const handle = this.owners.get(target.owner)
        if (host && handle) setStripParam(handle.strip, target.param, host.strip[target.param])
        return
      }
      case 'device': {
        const location = findDevice(score, target.device)
        const device = this.deviceMap.get(target.device)
        if (!location || !device || !(target.param in device.params)) return
        device.setParam(target.param, this.effectiveParams(location.device)[target.param])
        return
      }
      default: {
        const exhaustive: never = target
        return exhaustive
      }
    }
  }

  private laneFor(spec: ScoreLane, min: number, max: number): ParamLane {
    let lane = this.lanes.get(spec.id)
    if (!lane) {
      lane = new ParamLane({
        breakpoints: spec.breakpoints,
        defaultValue: spec.defaultValue,
        min,
        max,
      })
      this.lanes.set(spec.id, lane)
    } else if (!sameBreakpoints(lane, spec)) {
      lane.replace(spec.breakpoints)
    }
    return lane
  }

  private rangeFor(target: ParamTarget, score: Score): [number, number] {
    switch (target.kind) {
      case 'strip': {
        const [min, max] = STRIP_PARAM_RANGES[target.param]
        return target.param === 'pan' ? [min, max] : [min, Number.POSITIVE_INFINITY]
      }
      case 'device': {
        const location = findDevice(score, target.device) ?? this.missing(target.device)
        const spec = this.devices.describe(location.device.deviceId).params[target.param]
        if (!spec)
          throw new ScoreRenderError(
            `${location.device.deviceId} has no parameter "${target.param}"`,
          )
        return [spec.min, spec.max]
      }
      default: {
        const exhaustive: never = target
        return exhaustive
      }
    }
  }

  private staticValueFor(target: ParamTarget, score: Score): number {
    switch (target.kind) {
      case 'strip': {
        if (target.owner === MASTER_OWNER) return score.master.level
        const host =
          stripHosts(score).find((candidate) => candidate.id === target.owner) ??
          this.missing(target.owner)
        return host.strip[target.param]
      }
      case 'device': {
        const location = findDevice(score, target.device) ?? this.missing(target.device)
        return this.effectiveParams(location.device)[target.param]
      }
      default: {
        const exhaustive: never = target
        return exhaustive
      }
    }
  }

  private scheduledParamFor(target: ParamTarget): ScheduledParam {
    switch (target.kind) {
      case 'strip': {
        if (target.owner === MASTER_OWNER) return this.engine.master.gain
        return stripAudioParam(this.handle(target.owner).strip, target.param)
      }
      case 'device': {
        const device = this.device(target.device)
        if (!(device instanceof NodeDevice)) {
          throw new ScoreRenderError(
            `"${target.device}" is not a node device; its lane runs through the ModMatrix`,
          )
        }
        return nodeDeviceParam(device as NodeDevice, target.param)
      }
      default: {
        const exhaustive: never = target
        return exhaustive
      }
    }
  }

  private modTargetFor(target: ParamTarget, base: number | ParamLane): ModTarget {
    switch (target.kind) {
      case 'strip': {
        const [min, max] = STRIP_PARAM_RANGES[target.param]
        return audioParamTarget(this.scheduledParamFor(target), { min, max, base })
      }
      case 'device':
        return deviceParamTarget(this.device(target.device), target.param, { base })
      default: {
        const exhaustive: never = target
        return exhaustive
      }
    }
  }

  private missing(id: string): never {
    throw new ScoreRenderError(`nothing rendered for "${id}"`)
  }
}

// --- Pure helpers --------------------------------------------------------------------------

function masterLevelTarget(): ParamTarget {
  return { kind: 'strip', owner: MASTER_OWNER, param: 'level' }
}

function setStripParam(strip: ChannelStrip, param: StripParam, value: number): void {
  switch (param) {
    case 'level':
      strip.setLevel(value)
      return
    case 'pan':
      strip.setPan(value)
      return
    case 'inputGain':
      strip.setInputGain(value)
      return
    default: {
      const exhaustive: never = param
      return exhaustive
    }
  }
}

/** The AudioParam behind a strip parameter (reading it creates the strip's nodes). */
function stripAudioParam(strip: ChannelStrip, param: StripParam): AudioParam {
  switch (param) {
    case 'level':
      return strip.fader.gain
    case 'pan':
      return strip.panner.pan
    case 'inputGain':
      return strip.inputGainNode.gain
    default: {
      const exhaustive: never = param
      return exhaustive
    }
  }
}

/** Lanes and routes grouped by the parameter they drive. */
function bindingSpecs(score: Score): Map<string, BindingSpec> {
  const specs = new Map<string, BindingSpec>()
  const specFor = (target: ParamTarget): BindingSpec => {
    const key = targetKey(target)
    let spec = specs.get(key)
    if (!spec) {
      spec = { target, lane: null, routes: [] }
      specs.set(key, spec)
    }
    return spec
  }
  for (const lane of score.lanes) specFor(lane.target).lane = lane
  for (const route of score.routes) specFor(route.target).routes.push(route)
  return specs
}

function bindingTouches(
  key: string,
  ownerId: string,
  insertIds: readonly string[],
  ownDevice: string | null,
): boolean {
  if (key.startsWith(`strip:${ownerId}:`)) return true
  for (const id of insertIds) if (key.startsWith(`device:${id}:`)) return true
  return ownDevice !== null && key.startsWith(`device:${ownDevice}:`)
}

function sameBreakpoints(lane: ParamLane, spec: ScoreLane): boolean {
  const points = lane.breakpoints
  if (points.length !== spec.breakpoints.length) return false
  return points.every((point, index) => {
    const other = spec.breakpoints[index]
    return (
      point.timeSec === other.timeSec &&
      point.value === other.value &&
      (point.curve ?? 'linear') === (other.curve ?? 'linear')
    )
  })
}

function sameClips(a: readonly Clip[], b: readonly Clip[]): boolean {
  if (a.length !== b.length) return false
  return a.every((clip, index) => {
    const other = b[index]
    return (
      clip.id === other.id &&
      clip.sourceId === other.sourceId &&
      clip.startSec === other.startSec &&
      clip.offsetSec === other.offsetSec &&
      clip.durationSec === other.durationSec &&
      clip.fadeInSec === other.fadeInSec &&
      clip.fadeOutSec === other.fadeOutSec &&
      clip.fadeCurve === other.fadeCurve &&
      clip.gainDb === other.gainDb &&
      (clip.loop ?? false) === (other.loop ?? false)
    )
  })
}

function createModulator(spec: ScoreModulator): ModSource {
  switch (spec.kind) {
    case 'lfo':
      // Anchored at audio-clock zero: the phase is a pure function of context
      // time, so a re-render lands on the same phase as the original.
      return new Lfo({
        rateHz: spec.rateHz,
        shape: spec.shape,
        depth: spec.depth,
        phase: spec.phase,
        startSec: 0,
      })
    case 'random':
      return new Random({ rateHz: spec.rateHz, seed: spec.seed, smooth: spec.smooth })
    case 'macro':
      return new Macro(spec.value)
    case 'external-phase':
      return new ExternalPhase({
        phaseOffset: spec.phaseOffset,
        depth: spec.depth,
        shape: spec.shape,
      })
    default: {
      const exhaustive: never = spec
      return exhaustive
    }
  }
}

function updateModulator(
  live: ModSource,
  before: ScoreModulator,
  after: ScoreModulator,
  now: () => number,
): void {
  switch (after.kind) {
    case 'lfo': {
      if (!(live instanceof Lfo) || before.kind !== 'lfo') return
      if (before.rateHz !== after.rateHz) live.setRate(after.rateHz, now())
      if (before.phase !== after.phase) live.setPhase(after.phase, now())
      live.depth = after.depth
      live.shape = after.shape
      return
    }
    case 'random':
      if (!(live instanceof Random)) return
      live.rateHz = after.rateHz
      live.seed = after.seed
      live.smooth = after.smooth
      return
    case 'macro':
      if (!(live instanceof Macro)) return
      if (live.value !== after.value) live.set(after.value)
      return
    case 'external-phase':
      if (!(live instanceof ExternalPhase)) return
      live.phaseOffset = after.phaseOffset
      live.depth = after.depth
      live.shape = after.shape
      return
    default: {
      const exhaustive: never = after
      return exhaustive
    }
  }
}
