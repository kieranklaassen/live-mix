// A track hosting one instrument device: note-on/off pass through to the
// device, its output feeds a bus or the terminus. ambient-live's sine + sample
// synth is the first instrument (an app-local WasmDevice built against the
// device ABI plus `device_note_on/off`).
//
// The device output leaves through the track's ChannelStrip (node-free until
// pan, level, mute, solo, an insert or a post-fader send is first used).

import { type NoteDevice } from '../devices/Device'
import {
  ChannelStrip,
  type SoloInPlace,
  type StripDestination,
  type StripHost,
} from './ChannelStrip'

export interface InstrumentTrackOptions {
  name: string
  device: NoteDevice
  /** Where the instrument's output goes: a bus (its input), a group, or a raw node. */
  destination: StripDestination
  /**
   * The context the strip creates its nodes in. Optional: the engine passes
   * it; a standalone track without one can only use strip features when its
   * destination node carries a `context`.
   */
  context?: BaseAudioContext
  /** The engine's solo registry. */
  solo?: SoloInPlace
}

export class InstrumentTrack implements StripHost {
  readonly name: string
  readonly device: NoteDevice
  /** Pan, fader, mute/solo, inserts and post-fader sends; node-free until first used. */
  readonly strip: ChannelStrip
  private disposed = false

  constructor(options: InstrumentTrackOptions) {
    this.name = options.name
    this.device = options.device
    this.strip = new ChannelStrip(options.context ?? null, {
      name: options.name,
      destination: options.destination,
      solo: options.solo,
    })
    this.strip.connectSource(this.device.output)
  }

  noteOn(noteId: number, frequency: number, gain?: number): void {
    if (this.disposed) return
    this.device.noteOn(noteId, frequency, gain)
  }

  noteOff(noteId: number): void {
    if (this.disposed) return
    this.device.noteOff(noteId)
  }

  /** Dispose the track and its device. */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.device.dispose()
    this.strip.dispose()
  }
}
