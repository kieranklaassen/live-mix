// Frame-rate sampling for values the engine does not announce: the playhead
// while playing, analyser meter levels, upcoming clips. One
// `requestAnimationFrame` chain per hook instance, throttled to a bounded
// rate, with `setTimeout` standing in where there is no frame API. Nothing
// here runs during server rendering — the loop lives in an effect.

import { useEffect, useRef, useState } from 'react'

import { shallowEqual } from './store'

/** Injectable frame source (tests drive frames by hand; hosts may share one loop). */
export interface FrameScheduler {
  /** Schedule `callback` for the next frame with a millisecond timestamp; returns a handle. */
  request(callback: (timeMs: number) => void): unknown
  cancel(handle: unknown): void
}

/** Default meter and playhead refresh rate in frames per second. */
export const DEFAULT_REFRESH_FPS = 30

interface TimeoutHandle {
  kind: 'timeout'
  id: ReturnType<typeof setTimeout>
}

function isTimeoutHandle(handle: unknown): handle is TimeoutHandle {
  return (
    typeof handle === 'object' && handle !== null && (handle as TimeoutHandle).kind === 'timeout'
  )
}

function nowMs(): number {
  return typeof performance === 'object' ? performance.now() : Date.now()
}

/** `requestAnimationFrame` where it exists, a 16 ms timeout otherwise. */
export const defaultFrameScheduler: FrameScheduler = {
  request(callback) {
    if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(callback)
    const handle: TimeoutHandle = { kind: 'timeout', id: setTimeout(() => callback(nowMs()), 16) }
    return handle
  },
  cancel(handle) {
    if (isTimeoutHandle(handle)) clearTimeout(handle.id)
    else if (typeof cancelAnimationFrame === 'function' && typeof handle === 'number') {
      cancelAnimationFrame(handle)
    }
  },
}

/** Minimum frame spacing for a refresh rate (default 30 fps), clamped to 1..240 fps. */
export function frameIntervalMs(fps: number | undefined = DEFAULT_REFRESH_FPS): number {
  const rate = Number.isFinite(fps) ? Math.min(240, Math.max(1, fps)) : DEFAULT_REFRESH_FPS
  return 1000 / rate
}

/**
 * Re-sample `sample()` on frames at most every `intervalMs` while `active`,
 * re-rendering only when the sample changed under `isEqual`. While inactive
 * the value is sampled once (so a paused playhead still reads correctly) and
 * then left alone. `sample` may change identity freely; the latest one runs.
 */
export function useFrameSampled<T>(
  active: boolean,
  intervalMs: number,
  sample: () => T,
  scheduler: FrameScheduler,
  isEqual: (previous: T, next: T) => boolean = shallowEqual,
): T {
  const [value, setValue] = useState(sample)
  const latest = useRef({ sample, isEqual })
  latest.current = { sample, isEqual }

  useEffect(() => {
    const update = (): void => {
      const next = latest.current.sample()
      setValue((previous) => (latest.current.isEqual(previous, next) ? previous : next))
    }
    update()
    if (!active) return
    let handle: unknown = null
    let lastMs = Number.NEGATIVE_INFINITY
    const step = (timeMs: number): void => {
      // Half a millisecond of slack so a 60 Hz frame at 16.67 ms passes a 16.67 ms interval.
      if (timeMs - lastMs >= intervalMs - 0.5) {
        lastMs = timeMs
        update()
      }
      handle = scheduler.request(step)
    }
    handle = scheduler.request(step)
    return () => {
      scheduler.cancel(handle)
    }
  }, [active, intervalMs, scheduler])

  return value
}
