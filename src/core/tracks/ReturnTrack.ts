// A return: one device (a reverb) fed by sends, whose output goes to a bus or
// the terminus. Breathwork Live's hall is `ReturnTrack(ConvolverReverb)` whose
// wet gain connects to the router output, beside the dry voice.

import { type Bus } from '../buses/Bus'
import { type Device } from '../devices/Device'

export interface ReturnTrackOptions {
  name: string
  device: Device
  /** Where the return's output goes: a bus (its input) or a raw node. */
  destination: Bus | AudioNode
}

export class ReturnTrack {
  readonly name: string
  readonly device: Device
  private readonly destination: AudioNode
  private disposed = false

  constructor(options: ReturnTrackOptions) {
    this.name = options.name
    this.device = options.device
    this.destination = isBus(options.destination) ? options.destination.input : options.destination
    this.device.output.connect(this.destination)
  }

  /** Sends connect here. */
  get input(): AudioNode {
    return this.device.input
  }

  /** Dispose the return and its device. */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.device.dispose()
  }
}

function isBus(value: Bus | AudioNode): value is Bus {
  return typeof (value as Bus).addInsert === 'function'
}
