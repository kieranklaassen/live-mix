// A NodeDevice parameter as a `ScheduledParam`, so a `LaneWriter` can write a
// lane ahead in the param's own units. Each call runs the device's applier
// with a scheduling write instead of the immediate ramp: unit conversion
// (dB → gain) and fan-out (a mix onto wet and dry) happen exactly as they do
// for `setParam`, at the scheduled time. A `setParam` on the same param still
// cancels-and-holds at now — `LaneWriter.override()` before touching a knob.

import { type NodeDevice } from '../devices/native/NodeDevice'
import { type ParamSpec } from '../params'
import { holdParamAt, type ScheduledParam } from './scheduled-param'

type Write = (param: AudioParam, converted: number) => void

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
      apply(value, (param, converted) => param.exponentialRampToValueAtTime(converted, endTime))
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
