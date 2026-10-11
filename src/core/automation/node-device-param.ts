// A NodeDevice parameter as a `ScheduledParam`, so a `LaneWriter` can write a
// lane ahead in the param's own units. Each call runs the device's applier
// with a scheduling write instead of the immediate ramp: unit conversion
// (dB → gain) and fan-out (a mix onto wet and dry) happen exactly as they do
// for `setParam`, at the scheduled time. A `setParam` on the same param still
// cancels-and-holds at now — `LaneWriter.override()` before touching a knob.

import { type NodeDevice, type ParamScale } from '../devices/native/NodeDevice'
import { type ParamSpec } from '../params'
import { holdParamAt, type ScheduledParam } from './scheduled-param'

type Write = (param: AudioParam, converted: number, rampSec?: number, scale?: ParamScale) => void

export function nodeDeviceParam<P extends Record<string, ParamSpec>>(
  device: NodeDevice<P>,
  name: keyof P & string,
): ScheduledParam {
  if (!device.params[name]) {
    throw new Error(`live-mix: ${device.id} has no parameter "${name}"`)
  }
  const apply = (value: number, write: Write): void => {
    device.applyParam(name, value, write)
  }
  // Cancels carry no value; the applier still needs one to find its params.
  const base = (): number => device.getParam(name)
  return {
    setValueAtTime(value, startTime) {
      apply(value, (param, converted) => param.setValueAtTime(converted, startTime))
    },
    linearRampToValueAtTime(value, endTime) {
      apply(value, (param, converted) => param.linearRampToValueAtTime(converted, endTime))
    },
    exponentialRampToValueAtTime(value, endTime) {
      apply(value, (param, converted, _rampSec, scale) => {
        // A lane keeps an exponential segment off zero in the param's own
        // units, but the applier turns units (a mix of 1 is a dry of 0, the
        // bottom of a gain in dB is silence), and the graph refuses an
        // exponential ramp that ends on 0: that leg is a straight one. So is
        // one the applier writes in decibels (a cut's Q): the same curve, and
        // decibels cross zero where the param's own units never do.
        if (scale === 'decibels' || Math.fround(converted) === 0) {
          param.linearRampToValueAtTime(converted, endTime)
        } else param.exponentialRampToValueAtTime(converted, endTime)
      })
    },
    setTargetAtTime(target, startTime, timeConstant) {
      apply(target, (param, converted) => param.setTargetAtTime(converted, startTime, timeConstant))
    },
    cancelScheduledValues(cancelTime) {
      apply(base(), (param) => param.cancelScheduledValues(cancelTime))
    },
    cancelAndHoldAtTime(cancelTime) {
      apply(base(), (param) => holdParamAt(param, cancelTime, param.value))
    },
  }
}
