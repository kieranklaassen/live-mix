// Frame-rate sampling for values the engine does not announce: the playhead
// while playing, analyser meter levels, upcoming clips. One
// `requestAnimationFrame` chain per frame scheduler, shared by everything
// that samples on it and throttled to a bounded rate per subscriber, with
// `setTimeout` standing in where there is no frame API. Nothing here runs
// during server rendering — a chain starts from an effect.

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

interface FrameListener {
  onFrame: (timeMs: number) => void
  /** The frame it subscribed during, which is not one of its own. */
  joined: number
  live: boolean
}

/** The subscribers of one interval. They share its throttle, so they fire on the same frames. */
interface FrameBeat {
  intervalMs: number
  lastMs: number
  listeners: readonly FrameListener[]
}

type FrameSubscribe = (intervalMs: number, onFrame: (timeMs: number) => void) => () => void

/** One frame chain on `scheduler`: it runs while it has a subscriber and asks for no frame without. */
function frameChain(scheduler: FrameScheduler): FrameSubscribe {
  // Both lists are replaced, never changed in place, so a frame walks the ones it started with.
  let beats: readonly FrameBeat[] = []
  let handle: unknown = null
  let frame = 0

  const leave = (beat: FrameBeat, listener: FrameListener): void => {
    if (!listener.live) return
    listener.live = false
    beat.listeners = beat.listeners.filter((other) => other !== listener)
    if (beat.listeners.length > 0) return
    beats = beats.filter((other) => other !== beat)
    if (beats.length === 0 && handle !== null) {
      scheduler.cancel(handle)
      handle = null
    }
  }

  const step = (timeMs: number): void => {
    if (beats.length === 0) {
      handle = null
      return
    }
    // Asked for first, so the last subscriber leaving during this frame has a frame to cancel.
    handle = scheduler.request(step)
    frame += 1
    let failed = false
    let failure: unknown
    for (const beat of beats) {
      // Half a millisecond of slack so a 60 Hz frame at 16.67 ms passes a 16.67 ms interval.
      if (!(timeMs - beat.lastMs >= beat.intervalMs - 0.5)) continue
      beat.lastMs = timeMs
      for (const listener of beat.listeners) {
        if (!listener.live || listener.joined === frame) continue
        try {
          listener.onFrame(timeMs)
        } catch (error) {
          // A subscriber that throws is dropped and the rest still get their frame.
          leave(beat, listener)
          if (!failed) failure = error
          failed = true
        }
      }
    }
    if (failed) throw failure
  }

  return (intervalMs, onFrame) => {
    let beat = beats.find((other) => other.intervalMs === intervalMs)
    if (!beat) {
      beat = { intervalMs, lastMs: Number.NEGATIVE_INFINITY, listeners: [] }
      beats = [...beats, beat]
    }
    const joined = beat
    const listener: FrameListener = { onFrame, joined: frame, live: true }
    joined.listeners = [...joined.listeners, listener]
    handle ??= scheduler.request(step)
    return () => leave(joined, listener)
  }
}

const chains = new WeakMap<FrameScheduler, FrameSubscribe>()

/**
 * Call `onFrame` on the frames of `scheduler`, at most every `intervalMs`.
 * Every subscriber of a scheduler rides one chain of frame requests, and
 * subscribers with the same interval fire on the same frames: a second meter
 * joins the first one's rhythm instead of starting its own a frame later. The
 * first subscriber of an interval fires on the next frame. Returns a function
 * that stops it; the chain stops with its last subscriber.
 */
export function subscribeFrames(
  scheduler: FrameScheduler,
  intervalMs: number,
  onFrame: (timeMs: number) => void,
): () => void {
  let subscribe = chains.get(scheduler)
  if (!subscribe) {
    subscribe = frameChain(scheduler)
    chains.set(scheduler, subscribe)
  }
  return subscribe(intervalMs, onFrame)
}

/**
 * Frame sampling without React, for a host that writes the value to the DOM
 * itself: `onValue` is told the first sample at once, and after that every
 * sample, taken at most every `intervalMs`, that differs under `isEqual` from
 * the last one it was told. Returns a function that stops it.
 */
export function subscribeFrameSampled<T>(
  scheduler: FrameScheduler,
  intervalMs: number,
  sample: () => T,
  onValue: (value: T) => void,
  isEqual: (previous: T, next: T) => boolean = shallowEqual,
): () => void {
  let told = sample()
  onValue(told)
  return subscribeFrames(scheduler, intervalMs, () => {
    const next = sample()
    if (isEqual(told, next)) return
    told = next
    onValue(next)
  })
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
  // What was sampled while inactive is as old as the moment it went inactive.
  // Turned on, the value is taken afresh in that same render, so the first
  // frame drawn is not the old one: a playhead moved at rest and then started
  // would stand for a frame where it last ran.
  const [sampledActive, setSampledActive] = useState(active)
  if (sampledActive !== active) {
    setSampledActive(active)
    if (active) {
      const next = sample()
      if (!isEqual(value, next)) setValue(next)
    }
  }
  const latest = useRef({ sample, isEqual })
  latest.current = { sample, isEqual }

  useEffect(() => {
    const update = (): void => {
      const next = latest.current.sample()
      setValue((previous) => (latest.current.isEqual(previous, next) ? previous : next))
    }
    update()
    if (!active) return
    return subscribeFrames(scheduler, intervalMs, update)
  }, [active, intervalMs, scheduler])

  return value
}
