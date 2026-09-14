// A track hosting one instrument device: note-on/off pass through to the
// device, its output feeds a bus or the terminus. ambient-live's sine + sample
// synth is the first instrument (an app-local WasmDevice built against the
// device ABI plus `device_note_on/off`).

import { type Bus } from '../buses/Bus'
import { type NoteDevice } from '../devices/Device'

export interface InstrumentTrackOptions {
  name: string
  device: NoteDevice
  /** Where the instrument's output goes: a bus (its input) or a raw node. */
  destination: Bus | AudioNode
}

export class InstrumentTrack {
  readonly name: string
  readonly device: NoteDevice
  private readonly destination: AudioNode
  private disposed = false

  constructor(options: InstrumentTrackOptions) {
    this.name = options.name
    this.device = options.device
    this.destination = isBus(options.destination) ? options.destination.input : options.destination
    this.device.output.connect(this.destination)
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
  }
}

function isBus(value: Bus | AudioNode): value is Bus {
  return typeof (value as Bus).addInsert === 'function'
}
