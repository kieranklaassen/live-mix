// The master limiter as consumers see it: a fixed stage after the master's
// fader and inserts that exposes its parameters and nothing that could take it
// out of the path. The MasterBus owns the underlying device (any `Device`,
// normally `createTruePeakLimiter` from the dsp entry), keeps it un-bypassed
// and disposes it with the bus; `removeInsert` never sees it because it is not
// an insert.

import { type Device } from '../devices/Device'
import { type ParamSpec } from '../params'

export class MasterLimiter<
  P extends Readonly<Record<string, ParamSpec>> = Readonly<Record<string, ParamSpec>>,
> {
  readonly id: string
  readonly params: P
  readonly latencySec: number
  /** Sample-exact latency when the device reports one (the true-peak limiter does). */
  readonly latencySamples?: number
  private readonly device: Device

  constructor(device: Device & { params: P }) {
    this.id = device.id
    this.params = device.params
    this.latencySec = device.latencySec
    if (device.latencySamples !== undefined) this.latencySamples = device.latencySamples
    this.device = device
    device.bypass = false
  }

  setParam(name: keyof P & string, value: number): void {
    this.device.setParam(name, value)
  }

  getParam(name: keyof P & string): number {
    return this.device.getParam(name)
  }
}
