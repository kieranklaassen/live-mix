// The master: a Bus whose destination is the OutputRouter's terminus, with an
// optional peak meter after the insert chain. Everything audible sums here.

import { Meter } from '../analysis/Meter'
import { type OutputRouter } from '../output/OutputRouter'
import { Bus } from './Bus'

export interface MasterBusOptions {
  gain?: number
  /** Create a peak/RMS meter after the inserts (ambient-live's output meter). */
  meter?: boolean
}

export class MasterBus extends Bus {
  readonly router: OutputRouter
  readonly meter: Meter | null

  constructor(ctx: BaseAudioContext, router: OutputRouter, options: MasterBusOptions = {}) {
    super(ctx, { name: 'master', destination: router.output, gain: options.gain })
    this.router = router
    if (options.meter) {
      // The meter sits between the chain tail and the terminus; the bus keeps
      // treating the meter as its destination so inserts rewire around it.
      this.meter = new Meter(ctx)
      this.gainNode.disconnect()
      this.gainNode.connect(this.meter.input)
      this.meter.output.connect(router.output)
      this.destination = this.meter.input
    } else {
      this.meter = null
    }
  }

  /** Current output peak, 0..1 (0 when the master has no meter). */
  level(): number {
    return this.meter ? this.meter.peak() : 0
  }

  override dispose(): void {
    super.dispose()
    this.meter?.dispose()
  }
}
