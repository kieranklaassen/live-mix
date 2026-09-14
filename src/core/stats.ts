// Performance counters exposed to hosts (R38). Web Audio has no standard
// glitch event yet; the `AudioRenderCapacity` interface (Web Audio 1.1,
// `context.renderCapacity`) reports load and the ratio of render quanta that
// underran per update interval, and this converts it into a running count of
// glitched quanta. Where the interface is missing `supported` is false, the
// count stays at whatever the host records itself through `recordGlitch`.

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

export interface EngineStatsOptions {
  /** Seconds between render-capacity updates (default 1). */
  updateIntervalSec?: number
}

export interface EngineStatsSnapshot {
  /** Estimated number of render quanta that underran since the last reset (plus host-recorded glitches). */
  glitches: number
  /** Underrun ratio of the most recent update interval, 0..1. */
  underrunRatio: number
  /** Mean render load of the most recent interval, 0..1 (1 = the whole quantum budget). */
  averageLoad: number
  /** Peak render load of the most recent interval, 0..1. */
  peakLoad: number
  /** Whether the context exposes render-capacity updates at all. */
  supported: boolean
}

export type EngineStatsListener = (snapshot: EngineStatsSnapshot) => void

export class EngineStats {
  readonly supported: boolean
  readonly updateIntervalSec: number
  private readonly capacity: RenderCapacityLike | null
  private readonly quantaPerInterval: number
  private readonly onUpdate = (event: RenderCapacityUpdate): void => {
    this.glitchCount += Math.round(event.underrunRatio * this.quantaPerInterval)
    this.lastUnderrunRatio = event.underrunRatio
    this.lastAverageLoad = event.averageLoad
    this.lastPeakLoad = event.peakLoad
    this.notify()
  }
  private readonly listeners = new Set<EngineStatsListener>()
  private glitchCount = 0
  private lastUnderrunRatio = 0
  private lastAverageLoad = 0
  private lastPeakLoad = 0
  private disposed = false

  constructor(context: BaseAudioContext, options: EngineStatsOptions = {}) {
    this.updateIntervalSec = options.updateIntervalSec ?? 1
    this.quantaPerInterval = (this.updateIntervalSec * context.sampleRate) / RENDER_QUANTUM_FRAMES
    const capacity = (context as { renderCapacity?: RenderCapacityLike }).renderCapacity ?? null
    this.capacity = capacity
    this.supported = capacity !== null
    if (capacity) {
      capacity.addEventListener('update', this.onUpdate)
      capacity.start({ updateInterval: this.updateIntervalSec })
    }
  }

  /** Render quanta that underran since the last reset, plus host-recorded glitches. */
  get glitches(): number {
    return this.glitchCount
  }

  /** Count a glitch the host detected itself (e.g. a MediaStream track stall). */
  recordGlitch(count = 1): void {
    this.glitchCount += count
    this.notify()
  }

  snapshot(): EngineStatsSnapshot {
    return {
      glitches: this.glitchCount,
      underrunRatio: this.lastUnderrunRatio,
      averageLoad: this.lastAverageLoad,
      peakLoad: this.lastPeakLoad,
      supported: this.supported,
    }
  }

  /** Called after every update or recorded glitch; returns the unsubscribe function. */
  subscribe(listener: EngineStatsListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  reset(): void {
    this.glitchCount = 0
    this.lastUnderrunRatio = 0
    this.lastAverageLoad = 0
    this.lastPeakLoad = 0
    this.notify()
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.listeners.clear()
    if (this.capacity) {
      this.capacity.removeEventListener('update', this.onUpdate)
      this.capacity.stop()
    }
  }

  private notify(): void {
    if (this.listeners.size === 0) return
    const snapshot = this.snapshot()
    for (const listener of this.listeners) listener(snapshot)
  }
}
