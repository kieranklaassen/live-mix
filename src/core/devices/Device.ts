// The device contract every processor satisfies — Web Audio native nodes,
// WASM worklets, later Faust and WAM. A device is AudioNode-shaped: it has one
// input and one output node, typed parameters, click-free bypass, a reported
// latency for delay compensation, and a lifecycle.

import { type ParamSpec } from '../params'

export interface Device {
  /** Device type id, e.g. `'dattorro'`. */
  readonly id: string
  /** Connect sources here. */
  readonly input: AudioNode
  /** Connect this to the next node. */
  readonly output: AudioNode
  /** Static parameter descriptions by name. */
  readonly params: Readonly<Record<string, ParamSpec>>
  /** Set a parameter by name; values are clamped to the spec range. */
  setParam(name: string, value: number): void
  /** Last value set (or the default). */
  getParam(name: string): number
  /** Click-free bypass: the dry signal passes, processing keeps running. */
  bypass: boolean
  /** Processing latency in seconds, for plugin delay compensation. */
  readonly latencySec: number
  /**
   * Sample-exact processing latency at the context's sample rate, for devices
   * that know it (lookahead limiters, FIR stages). Optional and additive:
   * `deviceLatencySamples()` in `pdc.ts` rounds `latencySec` when it is absent.
   */
  readonly latencySamples?: number
  /**
   * The parameters a generated panel shows, in order, for a device with more
   * than fit one (a hosted plug-in can have hundreds). Optional: absent means
   * every parameter. Automation, presets and scores still reach all of them.
   */
  readonly panelParams?: readonly string[]
  /**
   * A sentence a generated panel shows above its knobs when the device has
   * something to say for itself: a stand-in for a plug-in that could not be
   * loaded says why. Optional; absent means nothing to say.
   */
  readonly notice?: string
  dispose(): void
}

/** A device that plays notes — an instrument. */
export interface NoteDevice extends Device {
  noteOn(noteId: number, frequency: number, gain?: number): void
  noteOff(noteId: number): void
  /**
   * Resolves once every note sent so far is with the part of the device that
   * makes the sound. Optional: a device whose notes take a path of their own
   * (a hosted plug-in's go to another process) has it, so an offline render
   * held at a note's time (`holdRenderAt`) can wait for the note before it
   * carries on, and the note lands where it was sent.
   */
  notesDelivered?(): Promise<void>
}

export function isNoteDevice(device: Device): device is NoteDevice {
  const candidate = device as Partial<NoteDevice>
  return typeof candidate.noteOn === 'function' && typeof candidate.noteOff === 'function'
}

/** A device with a window of its own, such as a hosted plug-in's editor. */
export interface EditorDevice extends Device {
  /** Open the device's own window, or bring it to the front. */
  openEditor(): Promise<void>
  closeEditor(): Promise<void>
}

export function isEditorDevice(device: Device): device is EditorDevice {
  const candidate = device as Partial<EditorDevice>
  return typeof candidate.openEditor === 'function' && typeof candidate.closeEditor === 'function'
}

/**
 * A device that words its own parameter values. A hosted plug-in knows its
 * decay reads "2.4 s"; its spec only knows a position between 0 and 1.
 */
export interface ParamTextDevice extends Device {
  /** The device's wording of the parameter's current value, when it has one. */
  paramText(name: string): string | undefined
}

export function isParamTextDevice(device: Device): device is ParamTextDevice {
  return typeof (device as Partial<ParamTextDevice>).paramText === 'function'
}

/** One reading a device reports about its own work, such as a compressor's gain reduction. */
export interface DeviceMeterSpec {
  /** Position in the device's own list of meters. */
  id: number
  name: string
  unit: string
}

/**
 * A device that reports readings a meter beside its knobs can show. Readings
 * are pulled: `meter(name)` is the latest, and it is only kept fresh while
 * someone watches, so a device nobody looks at posts nothing.
 */
export interface MeteredDevice extends Device {
  /** Static meter descriptions by name. */
  readonly meters: Readonly<Record<string, DeviceMeterSpec>>
  /** The latest reading; 0 until the first arrives. */
  meter(name: string): number
  /** Keep the readings fresh until the returned function is called. */
  watchMeters(): () => void
}

export function isMeteredDevice(device: Device): device is MeteredDevice {
  const candidate = device as Partial<MeteredDevice>
  return (
    typeof candidate.meter === 'function' &&
    typeof candidate.watchMeters === 'function' &&
    candidate.meters !== undefined &&
    Object.keys(candidate.meters).length > 0
  )
}

/** What a device reports after `setParam` or a bypass change (U24: UI subscriptions). */
export type DeviceChange =
  { type: 'param'; name: string; value: number } | { type: 'bypass'; bypass: boolean }

export type DeviceChangeListener = (change: DeviceChange) => void

/**
 * A device that announces its own parameter and bypass changes, so a UI can
 * follow automation and modulation writes without polling. Optional: the
 * stock hosts (`NodeDevice`, `WasmDevice`, `ConvolverReverb`, `WorkletDucker`)
 * implement it; third-party devices may not.
 */
export interface ObservableDevice extends Device {
  /** Called after every change; returns the unsubscribe function. */
  onChange(listener: DeviceChangeListener): () => void
}

export function isObservableDevice(device: Device): device is ObservableDevice {
  return typeof (device as Partial<ObservableDevice>).onChange === 'function'
}
