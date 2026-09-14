// The graph spine. An Engine adopts an existing BaseAudioContext (apps create
// it from a user gesture; the intake path creates it before a session exists),
// owns the OutputRouter and the MasterBus, hands out named buses, and carries
// the injectable clock every component schedules against, plus the one
// Transport and the one Scheduler (U4). Tracks and the sample store attach in
// U5.
//
// Node creation order is part of the contract (consumers' recorded-AudioParam
// harnesses index nodes by creation order): OutputRouter (stream destination
// in element mode) → master gain → optional master meter → buses in the order
// the app adds them.

import { MasterBus, type MasterBusOptions } from './buses/MasterBus'
import { Bus } from './buses/Bus'
import { createClock, type Clock, type ClockOptions } from './clock'
import { OutputRouter, type OutputRouterOptions } from './output/OutputRouter'
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
}

export interface AddBusOptions {
  /** Where the bus feeds; defaults to the master. */
  destination?: Bus | AudioNode
  gain?: number
}

export class Engine {
  readonly context: BaseAudioContext
  readonly clock: Clock
  readonly output: OutputRouter
  readonly master: MasterBus
  readonly transport: Transport
  readonly scheduler: Scheduler
  private readonly busMap = new Map<string, Bus>()
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
  }

  /** Audio-clock seconds through the injected clock. */
  now(): number {
    return this.clock.now()
  }

  /** Create a named summing bus feeding the master (or another bus/node). */
  addBus(name: string, options: AddBusOptions = {}): Bus {
    this.assertLive()
    if (this.busMap.has(name)) throw new Error(`live-mix: bus "${name}" already exists`)
    const destination =
      options.destination instanceof Bus
        ? options.destination.input
        : (options.destination ?? this.master.input)
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

  /**
   * Start the output terminus (element play + MediaSession in element mode).
   * Call from the user gesture that starts playback.
   */
  activateOutput(): void {
    this.output.activate()
  }

  /** Disconnect everything the engine created. Does not close the context. */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.scheduler.dispose()
    for (const bus of this.busMap.values()) bus.dispose()
    this.busMap.clear()
    this.master.dispose()
    this.output.dispose()
  }

  private assertLive(): void {
    if (this.disposed) throw new Error('live-mix: engine is disposed')
  }
}

export function createEngine(options: EngineOptions): Engine {
  return new Engine(options)
}
