// A WamDevice parameter as a `ScheduledParam`, so a `LaneWriter` (U19) can
// write a lane ahead into a plugin exactly as it does into an AudioParam. WAM
// 2.0 automation is a list of timed point values (`wam-automation` events)
// that the plugin interpolates over a short window, not AudioParam curves, so
// each ramp becomes a run of points `stepSec` apart — control-rate steps the
// interpolator smooths — and a cancel clears the plugin's event queue.
//
// Two WAM limits show through and are documented rather than hidden: the
// clear is plugin-wide (every pending event, any param, MIDI too), and a hold
// keeps the plugin where it *is* when the clear lands, not where it would have
// been at `cancelTime`. Lanes write inside the lookahead, so both are small.

import { type ScheduledParam } from '../core/automation/scheduled-param'
import { type WamDevice } from './WamDevice'

/** Default spacing of the points a ramp is broken into. */
export const WAM_AUTOMATION_STEP_SECONDS = 0.02

/** Beyond this many time constants `setTargetAtTime` is written as arrived. */
const TARGET_SETTLE_TIME_CONSTANTS = 5

export interface WamDeviceParamOptions {
  /** Spacing of the points a ramp is broken into; ≥ 1 ms. */
  stepSec?: number
}

interface Point {
  time: number
  value: number
}

export function wamDeviceParam(
  device: WamDevice,
  name: string,
  options: WamDeviceParamOptions = {},
): ScheduledParam {
  const spec = device.params[name]
  if (!spec) throw new Error(`live-mix: ${device.id} has no parameter "${name}"`)
  const stepSec = Math.max(0.001, options.stepSec ?? WAM_AUTOMATION_STEP_SECONDS)
  let last: Point | null = null

  const point = (value: number, time: number): void => {
    device.scheduleParam(name, value, time)
    last = { time, value }
  }

  /** Where a ramp starts: the previous point, or the mirrored value now. */
  const anchor = (endTime: number): Point => {
    if (last && last.time <= endTime) return last
    return { time: Math.min(device.context.currentTime, endTime), value: device.getParam(name) }
  }

  const ramp = (value: number, endTime: number, shape: (u: number) => number): void => {
    const from = anchor(endTime)
    const span = endTime - from.time
    if (!(span > 0)) {
      point(value, endTime)
      return
    }
    const steps = Math.max(1, Math.ceil(span / stepSec))
    for (let k = 1; k <= steps; k += 1) {
      const u = k / steps
      point(from.value + (value - from.value) * shape(u), from.time + span * u)
    }
  }

  /** Drop the queue; a later ramp starts from the mirrored value at `cancelTime`. */
  const cancel = (cancelTime: number): void => {
    device.clearScheduled()
    if (last && last.time >= cancelTime) last = { time: cancelTime, value: device.getParam(name) }
  }

  return {
    setValueAtTime(value, startTime) {
      point(value, startTime)
    },
    linearRampToValueAtTime(value, endTime) {
      ramp(value, endTime, (u) => u)
    },
    exponentialRampToValueAtTime(value, endTime) {
      const from = anchor(endTime)
      if (from.value > 0 && value > 0) {
        const ratio = value / from.value
        // Geometric interpolation expressed as a fraction of the linear span.
        ramp(value, endTime, (u) => (ratio ** u - 1) / (ratio - 1 || Number.EPSILON))
      } else {
        ramp(value, endTime, (u) => u)
      }
    },
    setTargetAtTime(target, startTime, timeConstant) {
      const tc = Math.max(0, timeConstant)
      if (tc === 0) {
        point(target, startTime)
        return
      }
      const from = anchor(startTime)
      const start = from.time <= startTime ? from.value : device.getParam(name)
      const settleTime = startTime + TARGET_SETTLE_TIME_CONSTANTS * tc
      const steps = Math.max(1, Math.ceil((settleTime - startTime) / stepSec))
      for (let k = 1; k < steps; k += 1) {
        const t = startTime + ((settleTime - startTime) * k) / steps
        point(target + (start - target) * Math.exp(-(t - startTime) / tc), t)
      }
      point(target, settleTime)
    },
    cancelScheduledValues(cancelTime) {
      cancel(cancelTime)
    },
    cancelAndHoldAtTime(cancelTime) {
      cancel(cancelTime)
    },
  }
}
