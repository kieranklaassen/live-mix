// Injectable clock and timers. Every engine component that schedules against
// the audio clock or polls on a timer reads them from here, so tests drive a
// fake clock and fake timers exactly the way the Breathwork Live harness does
// (`now`, `setIntervalFn`, `clearIntervalFn`).

export type IntervalId = ReturnType<typeof setInterval>

export interface Clock {
  /** Audio-clock seconds (defaults to `ctx.currentTime`). */
  now: () => number
  setIntervalFn: (callback: () => void, ms: number) => IntervalId
  clearIntervalFn: (id: IntervalId) => void
}

export interface ClockOptions {
  now?: () => number
  setIntervalFn?: (callback: () => void, ms: number) => IntervalId
  clearIntervalFn?: (id: IntervalId) => void
}

export function createClock(ctx: BaseAudioContext, options: ClockOptions = {}): Clock {
  return {
    now: options.now ?? (() => ctx.currentTime),
    setIntervalFn: options.setIntervalFn ?? ((cb, ms) => setInterval(cb, ms)),
    clearIntervalFn: options.clearIntervalFn ?? ((id) => clearInterval(id)),
  }
}
