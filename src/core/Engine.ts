// The graph spine. An Engine adopts an existing BaseAudioContext (apps create
// it from a user gesture; the intake path creates it before a session exists),
// owns the OutputRouter and the MasterBus, hands out named buses, and carries
// the injectable clock every component schedules against, plus the one
// Transport and the one Scheduler (U4), the SampleStore and the clip tracks
// (U5), live-input tracks, returns and duckers (U7).
//
// Node creation order is part of the contract (consumers' recorded-AudioParam
// harnesses index nodes by creation order): OutputRouter (stream destination
// in element mode) → master gain → optional master meter → buses in the order
// the app adds them. Track strips (U15) add nodes only when first used;
// groups are explicit and add theirs on creation.

import { Automation, type AutomationOptions } from './automation/Automation'
import { type ModMatrix } from './automation/ModMatrix'
import { MasterBus, type MasterBusOptions } from './buses/MasterBus'
import { Bus } from './buses/Bus'
import { createClock, type Clock, type ClockOptions } from './clock'
import { OutputRouter, type OutputRouterOptions } from './output/OutputRouter'
import { devices as defaultDevices } from './devices'
import { Ducker, type DuckerOptions } from './devices/native/Ducker'
import { type SidechainDucker } from './devices/native/SidechainDucker'
import { WorkletDucker, type WorkletDuckerOptions } from './devices/native/WorkletDucker'
import { type DeviceRegistry } from './devices/registry'
import { AudioTrack, type AudioTrackOptions } from './tracks/AudioTrack'
import {
  SoloInPlace,
  resolveInput,
  type StripDestination,
  type StripHost,
} from './tracks/ChannelStrip'
import { GroupTrack, type GroupTrackOptions } from './tracks/GroupTrack'
import { InstrumentTrack, type InstrumentTrackOptions } from './tracks/InstrumentTrack'
import { LiveInputTrack, type LiveInputTrackOptions } from './tracks/LiveInputTrack'
import { ReturnTrack, type ReturnTrackOptions } from './tracks/ReturnTrack'
import { SampleRetainer } from './tracks/SampleRetainer'
import { SampleStore, type SampleStoreOptions } from './tracks/SampleStore'
import { ElementTrack, type ElementTrackOptions } from './sources/ElementTrack'
import { EngineStats, type EngineStatsOptions } from './stats'
import { type TransportLoop } from './transport/anchor'
import { Scheduler } from './transport/Scheduler'
import { Transport } from './transport/Transport'

export interface EngineOptions extends ClockOptions {
  context: BaseAudioContext
  /** Final-mix routing (direct or iOS element mode). */
  output?: OutputRouterOptions
  /** Master fader initial value and whether to meter the output. */
  master?: MasterBusOptions
  /** Transport loop; defaults to off with no end. */
  loop?: Partial<TransportLoop>
  /** Scheduler timer period in ms (ambient-live 40, Breathwork Live 100). Default 40. */
  tickMs?: number
  /** Sample decoding: fetch implementation and whether to compute peaks. */
  samples?: SampleStoreOptions
  /** Device registry this engine creates devices from; defaults to the shared `devices`. */
  devices?: DeviceRegistry
  /** Automation/modulation control loop: period (default = tickMs) and lane lookahead (default 0.2 s). */
  automation?: Pick<AutomationOptions, 'tickMs' | 'lookaheadSec' | 'modulation'>
  /**
   * Keep decoded samples alive only while a clip needs them (U18). Default
   * on; off for adapters that drive `AudioTrack.play` themselves.
   */
  retainSamples?: boolean
  /** Render-capacity polling for `engine.stats` (glitch counter). */
  stats?: EngineStatsOptions
}

export type AddElementTrackOptions = Omit<
  ElementTrackOptions,
  'name' | 'destination' | 'now' | 'scheduler' | 'setTimeoutFn' | 'clearTimeoutFn'
> & {
  /** Where the track's voices connect; defaults to the master. */
  destination?: Bus | AudioNode
}

export type AddLiveInputTrackOptions = Omit<
  LiveInputTrackOptions,
  'name' | 'destination' | 'solo'
> & {
  /** Where the dry signal goes; defaults to the master. */
  destination?: StripDestination
}

export type AddInstrumentTrackOptions = Omit<
  InstrumentTrackOptions,
  'name' | 'destination' | 'context' | 'solo'
> & {
  /** Where the instrument feeds; defaults to the master. */
  destination?: StripDestination
}

export type AddReturnTrackOptions = Omit<
  ReturnTrackOptions,
  'name' | 'destination' | 'context' | 'solo'
> & {
  /** Where the return feeds; defaults to the master. */
  destination?: StripDestination
}

/** The Phase 0 main-thread ducker (default): an analyser poll on the engine clock. */
export type AddDuckerOptions = Omit<DuckerOptions, 'target' | 'clock'> & { mode?: 'legacy' }

/**
 * The audio-thread ducker (U17, opt-in): inserted into the target bus, no
 * timers. The processor must already be registered in the context
 * (`loadDuckerProcessor` from the dsp entry).
 */
export type AddWorkletDuckerOptions = WorkletDuckerOptions & { mode: 'worklet' }

export type AddAudioTrackOptions = Omit<
  AudioTrackOptions,
  'name' | 'destination' | 'samples' | 'now' | 'scheduler' | 'solo'
> & {
  /** Where the track's voices connect; defaults to the master. */
  destination?: StripDestination
}

export type AddGroupOptions = Omit<GroupTrackOptions, 'name' | 'destination' | 'solo'> & {
  /** Where the group feeds; defaults to the master. */
  destination?: StripDestination
  /** Tracks (or groups) to route into the new group. */
  members?: readonly StripHost[]
}

export interface AddBusOptions {
  /** Where the bus feeds; defaults to the master. */
  destination?: StripDestination
  gain?: number
}

export class Engine {
  readonly context: BaseAudioContext
  readonly clock: Clock
  readonly output: OutputRouter
  readonly master: MasterBus
  readonly transport: Transport
  readonly scheduler: Scheduler
  readonly samples: SampleStore
  /** Device registry (`engine.devices.create(id, { params, preset })`). */
  readonly devices: DeviceRegistry
  /** Automation lanes and the control-rate loop (U19). */
  readonly automation: Automation
  /** Modulation routes (`engine.modulation.map(source, target, depth)`). */
  readonly modulation: ModMatrix
  /** Solo-in-place state across every track, return and group strip. */
  readonly solo = new SoloInPlace()
  /** Glitch counter and render load, where the context reports them (R38). */
  readonly stats: EngineStats
  private readonly busMap = new Map<string, Bus>()
  private readonly trackMap = new Map<string, AudioTrack>()
  private readonly retainers = new Map<AudioTrack, SampleRetainer>()
  private readonly elementTrackMap = new Map<string, ElementTrack>()
  private readonly retainSamples: boolean
  private readonly liveInputMap = new Map<string, LiveInputTrack>()
  private readonly returnMap = new Map<string, ReturnTrack>()
  private readonly instrumentMap = new Map<string, InstrumentTrack>()
  private readonly groupMap = new Map<string, GroupTrack>()
  private readonly duckers = new Set<SidechainDucker>()
  private disposed = false

  constructor(options: EngineOptions) {
    this.context = options.context
    this.clock = createClock(options.context, options)
    this.output = new OutputRouter(options.context, options.output)
    this.master = new MasterBus(options.context, this.output, options.master)
    this.transport = new Transport({ now: this.clock.now, loop: options.loop })
    this.scheduler = new Scheduler({
      transport: this.transport,
      tickMs: options.tickMs,
      setIntervalFn: this.clock.setIntervalFn,
      clearIntervalFn: this.clock.clearIntervalFn,
    })
    this.samples = new SampleStore(options.context, options.samples)
    this.devices = options.devices ?? defaultDevices
    this.automation = new Automation({
      transport: this.transport,
      clock: this.clock,
      tickMs: options.automation?.tickMs ?? options.tickMs,
      lookaheadSec: options.automation?.lookaheadSec,
      modulation: options.automation?.modulation,
    })
    this.modulation = this.automation.modulation
    this.retainSamples = options.retainSamples ?? true
    this.stats = new EngineStats(options.context, options.stats)
  }

  /** Audio-clock seconds through the injected clock. */
  now(): number {
    return this.clock.now()
  }

  /** Create a named summing bus feeding the master (or another bus/node). */
  addBus(name: string, options: AddBusOptions = {}): Bus {
    this.assertLive()
    if (this.busMap.has(name)) throw new Error(`live-mix: bus "${name}" already exists`)
    const destination = resolveInput(options.destination ?? this.master)
    const bus = new Bus(this.context, { name, destination, gain: options.gain })
    this.busMap.set(name, bus)
    return bus
  }

  bus(name: string): Bus {
    const bus = this.busMap.get(name)
    if (!bus) throw new Error(`live-mix: no bus "${name}"`)
    return bus
  }

  hasBus(name: string): boolean {
    return this.busMap.has(name)
  }

  get buses(): readonly Bus[] {
    return [...this.busMap.values()]
  }

  /** Remove and disconnect a bus. */
  removeBus(name: string): void {
    const bus = this.busMap.get(name)
    if (!bus) return
    bus.dispose()
    this.busMap.delete(name)
  }

  /** Create a clip track feeding the master (or a bus), registered with the scheduler. */
  addAudioTrack(name: string, options: AddAudioTrackOptions = {}): AudioTrack {
    this.assertLive()
    if (this.trackMap.has(name)) throw new Error(`live-mix: track "${name}" already exists`)
    const track = new AudioTrack(this.context, {
      ...options,
      name,
      destination: options.destination ?? this.master,
      solo: this.solo,
      samples: this.samples,
      now: this.clock.now,
    })
    // The retainer registers ahead of the track so a hold exists before the
    // first voice asks for its sample.
    if (this.retainSamples) {
      this.retainers.set(
        track,
        new SampleRetainer({
          samples: this.samples,
          track,
          now: this.clock.now,
          scheduler: this.scheduler,
        }),
      )
    }
    track.attach(this.scheduler)
    this.trackMap.set(name, track)
    return track
  }

  /** The retainer keeping a track's samples decoded, when sample retention is on. */
  retainerFor(track: AudioTrack): SampleRetainer | undefined {
    return this.retainers.get(track)
  }

  /**
   * A streaming clip track (media elements instead of decoded buffers) for
   * long beds, feeding the master by default and registered with the scheduler.
   */
  addElementTrack(name: string, options: AddElementTrackOptions = {}): ElementTrack {
    this.assertLive()
    if (this.elementTrackMap.has(name)) {
      throw new Error(`live-mix: element track "${name}" already exists`)
    }
    const track = new ElementTrack(this.context, {
      ...options,
      name,
      destination: options.destination ?? this.master,
      now: this.clock.now,
      scheduler: this.scheduler,
      setTimeoutFn: this.clock.setTimeoutFn,
      clearTimeoutFn: this.clock.clearTimeoutFn,
    })
    this.elementTrackMap.set(name, track)
    return track
  }

  elementTrack(name: string): ElementTrack {
    const track = this.elementTrackMap.get(name)
    if (!track) throw new Error(`live-mix: no element track "${name}"`)
    return track
  }

  get elementTracks(): readonly ElementTrack[] {
    return [...this.elementTrackMap.values()]
  }

  removeElementTrack(name: string): void {
    const track = this.elementTrackMap.get(name)
    if (!track) return
    track.dispose()
    this.elementTrackMap.delete(name)
  }

  track(name: string): AudioTrack {
    const track = this.trackMap.get(name)
    if (!track) throw new Error(`live-mix: no track "${name}"`)
    return track
  }

  get tracks(): readonly AudioTrack[] {
    return [...this.trackMap.values()]
  }

  /** Dispose a track: it leaves the scheduler and its voices are silenced. */
  removeTrack(name: string): void {
    const track = this.trackMap.get(name)
    if (!track) return
    this.retainers.get(track)?.dispose()
    this.retainers.delete(track)
    track.dispose()
    this.trackMap.delete(name)
  }

  /** A pass-through track for a MediaStream or node, feeding the master by default. */
  addLiveInputTrack(name: string, options: AddLiveInputTrackOptions = {}): LiveInputTrack {
    this.assertLive()
    if (this.liveInputMap.has(name))
      throw new Error(`live-mix: live input "${name}" already exists`)
    const track = new LiveInputTrack(this.context, {
      ...options,
      name,
      destination: options.destination ?? this.master,
      solo: this.solo,
    })
    this.liveInputMap.set(name, track)
    return track
  }

  liveInput(name: string): LiveInputTrack {
    const track = this.liveInputMap.get(name)
    if (!track) throw new Error(`live-mix: no live input "${name}"`)
    return track
  }

  /** A track hosting one instrument device, feeding the master by default. */
  addInstrumentTrack(name: string, options: AddInstrumentTrackOptions): InstrumentTrack {
    this.assertLive()
    if (this.instrumentMap.has(name))
      throw new Error(`live-mix: instrument "${name}" already exists`)
    const track = new InstrumentTrack({
      ...options,
      name,
      destination: options.destination ?? this.master,
      context: this.context,
      solo: this.solo,
    })
    this.instrumentMap.set(name, track)
    return track
  }

  instrument(name: string): InstrumentTrack {
    const track = this.instrumentMap.get(name)
    if (!track) throw new Error(`live-mix: no instrument "${name}"`)
    return track
  }

  /** A return fed by sends: one device whose output goes to the master by default. */
  addReturnTrack(name: string, options: AddReturnTrackOptions): ReturnTrack {
    this.assertLive()
    if (this.returnMap.has(name)) throw new Error(`live-mix: return "${name}" already exists`)
    const track = new ReturnTrack({
      ...options,
      name,
      destination: options.destination ?? this.master,
      context: this.context,
      solo: this.solo,
    })
    this.returnMap.set(name, track)
    return track
  }

  returnTrack(name: string): ReturnTrack {
    const track = this.returnMap.get(name)
    if (!track) throw new Error(`live-mix: no return "${name}"`)
    return track
  }

  /**
   * A group: a summing strip that member tracks route into, feeding the master
   * (or a bus, or another group). Creates its four nodes immediately.
   */
  addGroup(name: string, options: AddGroupOptions = {}): GroupTrack {
    this.assertLive()
    if (this.groupMap.has(name)) throw new Error(`live-mix: group "${name}" already exists`)
    const group = new GroupTrack(this.context, {
      ...options,
      name,
      destination: options.destination ?? this.master,
      solo: this.solo,
    })
    for (const member of options.members ?? []) group.add(member)
    this.groupMap.set(name, group)
    return group
  }

  group(name: string): GroupTrack {
    const group = this.groupMap.get(name)
    if (!group) throw new Error(`live-mix: no group "${name}"`)
    return group
  }

  hasGroup(name: string): boolean {
    return this.groupMap.has(name)
  }

  get groups(): readonly GroupTrack[] {
    return [...this.groupMap.values()]
  }

  /** Dissolve a group: its members route to where the group fed. */
  removeGroup(name: string): void {
    const group = this.groupMap.get(name)
    if (!group) return
    group.dispose()
    this.groupMap.delete(name)
  }

  /**
   * A sidechain ducker. Default (`'legacy'`): the Phase 0 main-thread follower
   * on a bus fader (or any AudioParam), polling on the engine clock.
   * `mode: 'worklet'`: the audio-thread `WorkletDucker`, inserted post-fader
   * into the target bus. Key either with `ducker.key(node)`; both stop with
   * `engine.stop()`.
   */
  addDucker(target: Bus | AudioParam, options?: AddDuckerOptions): Ducker
  addDucker(target: Bus, options: AddWorkletDuckerOptions): WorkletDucker
  addDucker(
    target: Bus | AudioParam,
    options: AddDuckerOptions | AddWorkletDuckerOptions = {},
  ): SidechainDucker {
    this.assertLive()
    if (options.mode === 'worklet') {
      if (!(target instanceof Bus)) {
        throw new Error('live-mix: a worklet ducker needs a Bus target (it is a bus insert)')
      }
      const ducker = new WorkletDucker(this.context, options)
      target.addInsert(ducker)
      this.duckers.add(ducker)
      return ducker
    }
    const ducker = new Ducker(this.context, {
      ...options,
      target: target instanceof Bus ? target.gain : target,
      clock: this.clock,
    })
    this.duckers.add(ducker)
    return ducker
  }

  /**
   * Fade the master to silence over `fadeSec` and stop the transport, letting
   * sounding voices stop at `now + fadeSec` (Breathwork Live's `stop()`:
   * `setTargetAtTime(0, at, fadeSec / 3)` on the master, sources stop after
   * the fade).
   */
  stop(options: { fadeSec?: number } = {}): void {
    const fadeSec = options.fadeSec ?? 0
    const at = this.clock.now()
    if (fadeSec > 0) this.master.gain.setTargetAtTime(0, at, fadeSec / 3)
    this.transport.stop({ fadeSec })
    for (const ducker of this.duckers) ducker.stop()
  }

  /**
   * Start the output terminus (element play + MediaSession in element mode)
   * and unlock every element track's media elements — all on the same user
   * gesture. The terminus activates synchronously; the returned promise
   * settles when the elements are unlocked.
   */
  activateOutput(): Promise<void> {
    this.output.activate()
    return Promise.all([...this.elementTrackMap.values()].map((track) => track.unlockAll())).then(
      () => {},
    )
  }

  /** Disconnect everything the engine created. Does not close the context. */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.automation.dispose()
    for (const retainer of this.retainers.values()) retainer.dispose()
    this.retainers.clear()
    for (const track of this.trackMap.values()) track.dispose()
    this.trackMap.clear()
    for (const track of this.elementTrackMap.values()) track.dispose()
    this.elementTrackMap.clear()
    for (const ducker of this.duckers) ducker.dispose()
    this.duckers.clear()
    for (const track of this.liveInputMap.values()) track.dispose()
    this.liveInputMap.clear()
    for (const track of this.returnMap.values()) track.dispose()
    this.returnMap.clear()
    for (const track of this.instrumentMap.values()) track.dispose()
    this.instrumentMap.clear()
    for (const group of this.groupMap.values()) group.dispose()
    this.groupMap.clear()
    this.scheduler.dispose()
    this.samples.clear()
    for (const bus of this.busMap.values()) bus.dispose()
    this.busMap.clear()
    this.master.dispose()
    this.output.dispose()
    this.stats.dispose()
  }

  private assertLive(): void {
    if (this.disposed) throw new Error('live-mix: engine is disposed')
  }
}

export function createEngine(options: EngineOptions): Engine {
  return new Engine(options)
}
