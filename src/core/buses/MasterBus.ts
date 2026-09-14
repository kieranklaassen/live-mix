// The master: a Bus whose destination is the OutputRouter's terminus, with an
// optional peak meter after the insert chain. Everything audible sums here.
//
// Two opt-in stages sit between the insert chain and the terminus, installed
// after construction because both load worklets: an unbypassable limiter
// (`installLimiter`) and a BS.1770 loudness/true-peak meter tapping the
// limited output (`installLufsMeter`). Neither is created by default, so the
// node order a consumer's recorded-AudioParam harness relies on is unchanged.
//
//   fader → inserts… → [limiter] → [analyser meter] → router.output
//                                 └→ [LUFS meter] (and any other tap)

import { LufsMeter, type LufsMeterOptions } from '../analysis/LufsMeter'
import { Meter } from '../analysis/Meter'
import { type Device } from '../devices/Device'
import { type OutputRouter } from '../output/OutputRouter'
import { Bus } from './Bus'
import { MasterLimiter } from './MasterLimiter'

export interface MasterBusOptions {
  gain?: number
  /** Create a peak/RMS meter after the inserts (ambient-live's output meter). */
  meter?: boolean
}

/** Builds the limiter device; the master keeps the only handle to it. */
export type LimiterFactory<D extends Device> = (context: BaseAudioContext) => Promise<D> | D

export class MasterBus extends Bus {
  readonly router: OutputRouter
  readonly meter: Meter | null
  private limiterDevice: Device | null = null
  private limiterFacade: MasterLimiter | null = null
  private lufsMeter: LufsMeter | null = null

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

  /** The installed limiter's parameters, or null before `installLimiter`. */
  get limiter(): MasterLimiter | null {
    return this.limiterFacade
  }

  /** The installed loudness meter, or null before `installLufsMeter`. */
  get lufs(): LufsMeter | null {
    return this.lufsMeter
  }

  /**
   * Install the device `create` returns as a fixed stage after the fader and
   * every insert, ahead of the meter and the terminus. It is not an insert:
   * `removeInsert` cannot reach it, the returned handle exposes no bypass, and
   * the bus disposes it. Once per master.
   */
  async installLimiter<D extends Device>(
    create: LimiterFactory<D>,
  ): Promise<MasterLimiter<D['params']>> {
    this.assertLive()
    if (this.limiterDevice) throw new Error('live-mix: the master already has a limiter')
    const device = await create(this.ctx)
    this.assertLive()
    if (this.limiterDevice) {
      device.dispose()
      throw new Error('live-mix: the master already has a limiter')
    }
    const previousTapSource = this.tapSource()
    for (const tap of this.tapSet) {
      try {
        previousTapSource.disconnect(tap)
      } catch {
        // Not connected; ignore.
      }
    }
    this.limiterDevice = device
    device.output.connect(this.destination)
    this.connectTo(device.input)
    for (const tap of this.tapSet) device.output.connect(tap)
    const facade = new MasterLimiter<D['params']>(device)
    this.limiterFacade = facade
    return facade
  }

  /**
   * Create a LUFS/true-peak meter and tap the master output (after the
   * limiter when there is one) into it. Once per master; the bus disposes it.
   */
  async installLufsMeter(options: LufsMeterOptions = {}): Promise<LufsMeter> {
    this.assertLive()
    if (this.lufsMeter) throw new Error('live-mix: the master already has a LUFS meter')
    const meter = await LufsMeter.create(this.ctx, options)
    this.assertLive()
    if (this.lufsMeter) {
      meter.dispose()
      throw new Error('live-mix: the master already has a LUFS meter')
    }
    this.lufsMeter = meter
    this.addTap(meter.input)
    return meter
  }

  override dispose(): void {
    super.dispose()
    this.limiterDevice?.dispose()
    this.limiterDevice = null
    this.limiterFacade = null
    this.lufsMeter?.dispose()
    this.lufsMeter = null
    this.meter?.dispose()
  }

  /** Taps read the limited signal when a limiter is installed. */
  protected override tapSource(): AudioNode {
    return this.limiterDevice?.output ?? this.output
  }
}
