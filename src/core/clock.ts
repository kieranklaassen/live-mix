// Injectable clock and timers. Every engine component that schedules against
// the audio clock or polls on a timer reads them from here, so tests drive a
// fake clock and fake timers exactly the way the Breathwork Live harness does
// (`now`, `setIntervalFn`, `clearIntervalFn`).

export type IntervalId = ReturnType<typeof setInterval>
export type TimeoutId = ReturnType<typeof setTimeout>

export interface Clock {
  /** Audio-clock seconds (defaults to `ctx.currentTime`). */
  now: () => number
  setIntervalFn: (callback: () => void, ms: number) => IntervalId
  clearIntervalFn: (id: IntervalId) => void
  setTimeoutFn: (callback: () => void, ms: number) => TimeoutId
  clearTimeoutFn: (id: TimeoutId) => void
}

export interface ClockOptions {
  now?: () => number
  setIntervalFn?: (callback: () => void, ms: number) => IntervalId
  clearIntervalFn?: (id: IntervalId) => void
  setTimeoutFn?: (callback: () => void, ms: number) => TimeoutId
  clearTimeoutFn?: (id: TimeoutId) => void
}

export function createClock(ctx: BaseAudioContext, options: ClockOptions = {}): Clock {
  return {
    now: options.now ?? (() => ctx.currentTime),
    setIntervalFn: options.setIntervalFn ?? ((cb, ms) => setInterval(cb, ms)),
    clearIntervalFn: options.clearIntervalFn ?? ((id) => clearInterval(id)),
    setTimeoutFn: options.setTimeoutFn ?? ((cb, ms) => setTimeout(cb, ms)),
    clearTimeoutFn: options.clearTimeoutFn ?? ((id) => clearTimeout(id)),
  }
}

/** Frames the Web Audio API renders at a time. */
const RENDER_QUANTUM_FRAMES = 128

/**
 * How far ahead of the clock a start has to be for the device to keep it to
 * the frame. The page reads the clock as the last block rendered left it, and
 * a browser renders a whole device buffer of blocks in one burst
 * (`baseLatency`), so by the time a source or a level reaches the audio thread
 * the clock may have run a buffer on. A time that has passed by then is taken
 * up at the next block: late against everything written beside it, which is a
 * step in what sounds. One device buffer and one block ahead cannot be
 * overtaken that way.
 *
 * 0 where there is no device buffer to go by (an offline render, a test's
 * context): the clock there does not move while the page writes.
 */
export function startFloorSec(ctx: BaseAudioContext): number {
  const base = (ctx as Partial<AudioContext>).baseLatency
  if (base === undefined || !Number.isFinite(base) || base <= 0) return 0
  const blockSec = RENDER_QUANTUM_FRAMES / ctx.sampleRate
  return Math.max(base, blockSec) + blockSec
}

/**
 * How far ahead of the clock a transport pins its start on this context:
 * `startFloorSec`, and two blocks more for the page to hand over every start
 * due there before the first of them is that near. 0 where that is 0.
 */
export function startLeadSec(ctx: BaseAudioContext): number {
  const floorSec = startFloorSec(ctx)
  if (floorSec === 0) return 0
  return floorSec + (2 * RENDER_QUANTUM_FRAMES) / ctx.sampleRate
}
