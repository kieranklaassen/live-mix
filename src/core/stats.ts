// Performance counters exposed to hosts (R38): how hard the audio thread
// works, and how often it fell behind. A browser reports neither in one
// agreed way, so each figure names where it came from.
//
// Load. The `AudioRenderCapacity` interface (Web Audio 1.1,
// `context.renderCapacity`) reports the whole render's load and the ratio of
// render quanta that underran per update interval; no shipping browser has
// it. Where it is missing and the page is cross-origin isolated, the engine
// measures its own worklet processors instead (load.ts): the WASM devices
// and the plug-in bridge, not the browser's own nodes. Elsewhere there is no
// load figure and `supported` is false.
//
// Dropouts. Render capacity's underrun ratio becomes a running count of
// glitched quanta; failing that, the browser's playback statistics
// (`context.playbackStats`, `playoutStats` in older Chromium) count the times
// the output ran dry and for how long. With neither, the count holds only
// what the host records itself through `recordGlitch`.

import { LoadProbe, type DeviceLoad, type LoadReading } from './load'

const RENDER_QUANTUM_FRAMES = 128

/** Structural typings for the not-yet-ubiquitous AudioRenderCapacity interface. */
export interface RenderCapacityUpdate {
  timestamp: number
  averageLoad: number
  peakLoad: number
  underrunRatio: number
}

export interface RenderCapacityLike {
  start(options?: { updateInterval?: number }): void
  stop(): void
  addEventListener(type: 'update', listener: (event: RenderCapacityUpdate) => void): void
  removeEventListener(type: 'update', listener: (event: RenderCapacityUpdate) => void): void
}

/** The browser's count of output underruns, under either of its names. */
interface PlaybackStatsLike {
  /** `playbackStats`: times the output ran dry, and for how many seconds. */
  underrunEvents?: number
  underrunDuration?: number
  /** `playoutStats`, its older form: the same, the duration in milliseconds. */
  fallbackFramesEvents?: number
  fallbackFramesDuration?: number
}

interface PlaybackCount {
  events: number
  seconds: number
}

function readPlayback(context: BaseAudioContext): PlaybackCount | null {
  const source = context as { playbackStats?: PlaybackStatsLike; playoutStats?: PlaybackStatsLike }
  const stats = source.playbackStats ?? source.playoutStats
  if (!stats) return null
  if (typeof stats.underrunEvents === 'number') {
    return { events: stats.underrunEvents, seconds: stats.underrunDuration ?? 0 }
  }
  if (typeof stats.fallbackFramesEvents === 'number') {
    return {
      events: stats.fallbackFramesEvents,
      seconds: (stats.fallbackFramesDuration ?? 0) / 1000,
    }
  }
  return null
}

/** Where the load figures come from. */
export type EngineLoadSource = 'render-capacity' | 'devices'

/** Where the dropout count comes from. */
export type EngineGlitchSource = 'render-capacity' | 'playback-stats'

export interface EngineStatsOptions {
  /** Seconds between updates (default 1). */
  updateIntervalSec?: number
  /** Where the bundled load sampler worker is, when not beside the built core entry. */
  samplerUrl?: URL | string
  /** The marks to read (default: the context's own probe). */
  probe?: LoadProbe
}

export interface EngineStatsSnapshot {
  /** Dropouts since the last reset: glitched render quanta or output underruns, by `glitchSource`, plus host-recorded glitches. */
  glitches: number
  /** Underrun ratio of the most recent update interval, 0..1 (render capacity only). */
  underrunRatio: number
  /** Mean load of the most recent interval, 0..1 (1 = all of real time). */
  averageLoad: number
  /** Peak load: the busiest quantum of the most recent interval (render capacity), or the busiest of the last ten intervals (devices). */
  peakLoad: number
  /** Whether there is a load figure at all. */
  supported: boolean
  /** The whole render as the browser reports it, the engine's own devices as it measures them, or null: no figure. */
  loadSource: EngineLoadSource | null
  /** What counts the dropouts, or null: only what the host records. */
  glitchSource: EngineGlitchSource | null
  /** Seconds of output that ran dry since the last reset, where playback statistics say; null elsewhere. */
  underrunSec: number | null
  /** The engine's worklet devices by kind, costliest first: how many, their load (devices source) and their memory. */
  devices: readonly DeviceLoad[]
}

/** How many intervals the devices source looks back over for its peak. */
const PEAK_INTERVALS = 10

export type EngineStatsListener = (snapshot: EngineStatsSnapshot) => void

export class EngineStats {
  readonly supported: boolean
  readonly loadSource: EngineLoadSource | null
  readonly glitchSource: EngineGlitchSource | null
  readonly updateIntervalSec: number
  private readonly context: BaseAudioContext
  private readonly capacity: RenderCapacityLike | null
  private readonly probe: LoadProbe
  private readonly samplerUrl: URL | string | undefined
  private readonly quantaPerInterval: number
  private readonly onUpdate = (event: RenderCapacityUpdate): void => {
    this.glitchCount += Math.round(event.underrunRatio * this.quantaPerInterval)
    this.lastUnderrunRatio = event.underrunRatio
    this.lastAverageLoad = event.averageLoad
    this.lastPeakLoad = event.peakLoad
    this.notify()
  }
  private readonly onReading = (reading: LoadReading): void => {
    this.lastAverageLoad = reading.load
    this.recentLoads.push(reading.load)
    if (this.recentLoads.length > PEAK_INTERVALS) this.recentLoads.shift()
    this.lastPeakLoad = Math.max(...this.recentLoads)
    this.refresh()
    this.notify()
  }
  private readonly onTick = (): void => {
    this.refresh()
    this.notify()
  }
  private readonly listeners = new Set<EngineStatsListener>()
  private glitchCount = 0
  private lastUnderrunRatio = 0
  private lastAverageLoad = 0
  private lastPeakLoad = 0
  private recentLoads: number[] = []
  // The browser's underrun counters run from the context's start; these are where the count was last reset.
  private playbackBase: PlaybackCount | null
  private playback: PlaybackCount | null
  private devices: readonly DeviceLoad[] = []
  private stopSampling: (() => void) | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private disposed = false

  constructor(context: BaseAudioContext, options: EngineStatsOptions = {}) {
    this.context = context
    this.updateIntervalSec = options.updateIntervalSec ?? 1
    this.quantaPerInterval = (this.updateIntervalSec * context.sampleRate) / RENDER_QUANTUM_FRAMES
    const capacity = (context as { renderCapacity?: RenderCapacityLike }).renderCapacity ?? null
    this.capacity = capacity
    this.probe = options.probe ?? LoadProbe.for(context)
    this.samplerUrl = options.samplerUrl
    this.loadSource = capacity ? 'render-capacity' : this.probe.measurable ? 'devices' : null
    this.supported = this.loadSource !== null
    this.playback = readPlayback(context)
    this.playbackBase = this.playback
    this.glitchSource = capacity ? 'render-capacity' : this.playback ? 'playback-stats' : null
    if (capacity) {
      capacity.addEventListener('update', this.onUpdate)
      capacity.start({ updateInterval: this.updateIntervalSec })
    }
  }

  /** Dropouts since the last reset (see `EngineStatsSnapshot.glitches`). */
  get glitches(): number {
    return this.glitchCount + this.underruns().events
  }

  /** Count a glitch the host detected itself (e.g. a MediaStream track stall). */
  recordGlitch(count = 1): void {
    this.glitchCount += count
    this.notify()
  }

  snapshot(): EngineStatsSnapshot {
    return {
      glitches: this.glitches,
      underrunRatio: this.lastUnderrunRatio,
      averageLoad: this.lastAverageLoad,
      peakLoad: this.lastPeakLoad,
      supported: this.supported,
      loadSource: this.loadSource,
      glitchSource: this.glitchSource,
      underrunSec: this.glitchSource === 'playback-stats' ? this.underruns().seconds : null,
      devices: this.devices,
    }
  }

  /**
   * Called after every update or recorded glitch; returns the unsubscribe
   * function. The devices source samples, and playback statistics and the
   * device list are read, only while somebody is subscribed.
   */
  subscribe(listener: EngineStatsListener): () => void {
    if (this.disposed) return () => {}
    this.listeners.add(listener)
    if (this.listeners.size === 1) this.watch()
    return () => {
      if (!this.listeners.delete(listener)) return
      if (this.listeners.size === 0) this.unwatch()
    }
  }

  reset(): void {
    this.glitchCount = 0
    this.lastUnderrunRatio = 0
    this.lastAverageLoad = 0
    this.lastPeakLoad = 0
    this.recentLoads = []
    this.playback = readPlayback(this.context)
    this.playbackBase = this.playback
    this.notify()
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.listeners.clear()
    this.unwatch()
    if (this.capacity) {
      this.capacity.removeEventListener('update', this.onUpdate)
      this.capacity.stop()
    }
  }

  private watch(): void {
    this.refresh()
    if (this.loadSource === 'devices') {
      this.stopSampling = this.probe.start(this.updateIntervalSec, this.onReading, this.samplerUrl)
    } else {
      this.timer = setInterval(this.onTick, this.updateIntervalSec * 1000)
    }
  }

  private unwatch(): void {
    this.stopSampling?.()
    this.stopSampling = null
    if (this.timer !== null) clearInterval(this.timer)
    this.timer = null
    if (this.loadSource === 'devices') {
      // A load nobody refreshes is not a reading.
      this.lastAverageLoad = 0
      this.lastPeakLoad = 0
      this.recentLoads = []
    }
  }

  /** Read what is only read while watched: the browser's underrun counters and the device list. */
  private refresh(): void {
    if (this.playbackBase) this.playback = readPlayback(this.context) ?? this.playback
    this.devices = this.probe.devices()
  }

  private underruns(): PlaybackCount {
    if (!this.playback || !this.playbackBase || this.glitchSource !== 'playback-stats') {
      return { events: 0, seconds: 0 }
    }
    return {
      events: Math.max(0, this.playback.events - this.playbackBase.events),
      seconds: Math.max(0, this.playback.seconds - this.playbackBase.seconds),
    }
  }

  private notify(): void {
    if (this.listeners.size === 0) return
    const snapshot = this.snapshot()
    for (const listener of this.listeners) listener(snapshot)
  }
}
