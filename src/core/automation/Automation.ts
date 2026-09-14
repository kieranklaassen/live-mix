// The engine's automation and modulation control loop (U19 wiring). One
// control-rate timer, beside the Scheduler's, does two things: while the
// transport plays it brings every registered LaneWriter up to the lookahead
// window (`laneWindowFrom`), and it always updates the ModMatrix so
// modulators (LFOs, envelope followers, external phases) keep moving whether
// or not the timeline runs. Writers reset on stop/pause/end so the next start
// begins over; knobs call `writer.override(now)` before their own `setParam`
// (R29) and `release()` to hand the parameter back.

import { type Clock, type IntervalId } from '../clock'
import { type Transport, type TransportChange } from '../transport/Transport'
import { LaneWriter, laneWindowFrom, type LaneWriterOptions } from './LaneWriter'
import { ModMatrix, type ModMatrixOptions } from './ModMatrix'
import { type ParamLane } from './ParamLane'
import { type ScheduledParam } from './scheduled-param'

export interface AutomationOptions {
  transport: Transport
  clock: Clock
  /** Control-rate period in ms. Default 40 (the scheduler's default tick). */
  tickMs?: number
  /** How far ahead lanes are written. Default 0.2 s. */
  lookaheadSec?: number
  modulation?: ModMatrixOptions
}

export const DEFAULT_AUTOMATION_LOOKAHEAD_SECONDS = 0.2

/** A ModMatrix that starts the control loop the moment something is routed. */
class EngineModMatrix extends ModMatrix {
  private readonly onRoute: () => void

  constructor(onRoute: () => void, options: ModMatrixOptions = {}) {
    super(options)
    this.onRoute = onRoute
  }

  override map(...args: Parameters<ModMatrix['map']>): ReturnType<ModMatrix['map']> {
    const route = super.map(...args)
    this.onRoute()
    return route
  }
}

export class Automation {
  readonly modulation: ModMatrix
  readonly tickMs: number
  lookaheadSec: number
  private readonly transport: Transport
  private readonly clock: Clock
  private readonly writerSet = new Set<LaneWriter>()
  private timer: IntervalId | null = null
  private readonly unsubscribe: () => void
  private disposed = false

  constructor(options: AutomationOptions) {
    this.transport = options.transport
    this.clock = options.clock
    this.tickMs = options.tickMs ?? 40
    this.lookaheadSec = options.lookaheadSec ?? DEFAULT_AUTOMATION_LOOKAHEAD_SECONDS
    this.modulation = new EngineModMatrix(() => this.ensureRunning(), options.modulation)
    this.unsubscribe = this.transport.onChange((change) => this.onTransportChange(change))
    if (this.transport.state === 'playing') this.ensureRunning()
  }

  /** Registered lane writers. */
  get writers(): ReadonlySet<LaneWriter> {
    return this.writerSet
  }

  /** True while the control-rate timer runs. */
  get running(): boolean {
    return this.timer !== null
  }

  /** Drive `param` from `lane` while the transport plays. */
  add(lane: ParamLane, param: ScheduledParam, options: LaneWriterOptions = {}): LaneWriter {
    if (this.disposed) throw new Error('live-mix: automation is disposed')
    const writer = new LaneWriter(lane, param, options)
    this.writerSet.add(writer)
    this.ensureRunning()
    return writer
  }

  remove(writer: LaneWriter): void {
    this.writerSet.delete(writer)
  }

  /**
   * One control-rate pass. Runs on the timer; safe to call directly (tests,
   * hosts with their own loop).
   */
  tick(): void {
    if (this.disposed) return
    const contextTimeSec = this.clock.now()
    if (this.transport.state === 'playing') {
      const window = laneWindowFrom(this.transport, this.lookaheadSec)
      for (const writer of this.writerSet) writer.tick(window)
      this.modulation.update({ playheadSec: window.playheadSec, contextTimeSec })
      return
    }
    this.modulation.update({
      playheadSec: this.transport.position().positionSec,
      contextTimeSec,
    })
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.unsubscribe()
    this.stopTimer()
    this.writerSet.clear()
  }

  private onTransportChange(change: TransportChange): void {
    switch (change.reason) {
      case 'start':
        this.ensureRunning()
        this.tick()
        return
      case 'stop':
      case 'pause':
      case 'end':
        for (const writer of this.writerSet) writer.reset()
        return
      case 'seek':
      case 'loop':
        // The writer detects the re-pin from the offset change and rejoins.
        return
      default:
        return assertNever(change.reason)
    }
  }

  /** Lazy: nothing ticks until a lane, a route or playback asks for it. */
  private ensureRunning(): void {
    if (this.timer !== null || this.disposed) return
    this.timer = this.clock.setIntervalFn(() => this.tick(), this.tickMs)
  }

  private stopTimer(): void {
    if (this.timer === null) return
    this.clock.clearIntervalFn(this.timer)
    this.timer = null
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled transport change: ${String(value)}`)
}
