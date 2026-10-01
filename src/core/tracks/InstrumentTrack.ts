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
  /** Pan, fader, mute/solo, inserts and post-fader sends; node-free until first used. */
  readonly strip: ChannelStrip
  private current: NoteDevice
  private readonly held = new Set<number>()
  private disposed = false

  constructor(options: InstrumentTrackOptions) {
    this.name = options.name
    this.current = options.device
    this.strip = new ChannelStrip(options.context ?? null, {
      name: options.name,
      destination: options.destination,
      solo: options.solo,
    })
    this.strip.connectSource(this.current.output)
  }

  /** The instrument the track plays right now. */
  get device(): NoteDevice {
    return this.current
  }

  /**
   * Swap the instrument and keep the strip (level, pan, inserts, sends). Notes
   * held on the old device are released and its output stays wired into the
   * strip, so the release is heard. Returns the old device, which the caller
   * owns from here: dispose it once its tail has gone (that disconnects it),
   * or keep it to swap back.
   */
  setDevice(device: NoteDevice): NoteDevice {
    const previous = this.current
    if (this.disposed || device === previous) return previous
    for (const noteId of this.held) previous.noteOff(noteId)
    this.held.clear()
    // A release a device starts on the audio thread is only audible while its
    // output is still in the graph, so the strip forgets the node rather than
    // disconnecting it: the caller's `dispose` cuts it once the tail has gone.
    this.strip.forgetSource(previous.output)
    this.current = device
    this.strip.connectSource(device.output)
    return previous
  }

  noteOn(noteId: number, frequency: number, gain?: number): void {
    if (this.disposed) return
    this.held.add(noteId)
    this.current.noteOn(noteId, frequency, gain)
  }

  noteOff(noteId: number): void {
    if (this.disposed) return
    this.held.delete(noteId)
    this.current.noteOff(noteId)
  }

  /** Dispose the track and its device. */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.held.clear()
    this.current.dispose()
    this.strip.dispose()
  }
}
