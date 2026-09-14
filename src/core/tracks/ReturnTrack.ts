// A return: one device (a reverb) fed by sends, whose output goes to a bus or
// the terminus. Breathwork Live's hall is `ReturnTrack(ConvolverReverb)` whose
// wet gain connects to the router output, beside the dry voice.
//
// The device output leaves through the return's ChannelStrip (node-free until
// first used). Returns are solo-safe by default: soloing a track keeps the
// reverb it feeds audible, which is what solo-in-place means at the output.

import { type Device } from '../devices/Device'
import {
  ChannelStrip,
  type SoloInPlace,
  type StripDestination,
  type StripHost,
} from './ChannelStrip'

export interface ReturnTrackOptions {
  name: string
  device: Device
  /** Where the return's output goes: a bus (its input), a group, or a raw node. */
  destination: StripDestination
  /**
   * The context the strip creates its nodes in. Optional: the engine passes
   * it; a standalone return without one can only use strip features when its
   * destination node carries a `context`.
   */
  context?: BaseAudioContext
  /** The engine's solo registry. */
  solo?: SoloInPlace
  /** Whether other strips' solos leave this return audible. Default true. */
  soloSafe?: boolean
}

export class ReturnTrack implements StripHost {
  readonly name: string
  readonly device: Device
  /** Pan, fader, mute/solo, inserts and post-fader sends; node-free until first used. */
  readonly strip: ChannelStrip
  private disposed = false

  constructor(options: ReturnTrackOptions) {
    this.name = options.name
    this.device = options.device
    this.strip = new ChannelStrip(options.context ?? null, {
      name: options.name,
      destination: options.destination,
      solo: options.solo,
      soloSafe: options.soloSafe ?? true,
    })
    this.strip.connectSource(this.device.output)
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
    this.strip.dispose()
  }
}
