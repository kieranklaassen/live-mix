// The device contract every processor satisfies — Web Audio native nodes,
// WASM worklets, later Faust and WAM. A device is AudioNode-shaped: it has one
// input and one output node, typed parameters, click-free bypass, a reported
// latency for delay compensation, and a lifecycle.

import { type ParamModulation } from '../automation/param-modulation'
import { type ParamSpec } from '../params'

export interface Device {
  /** Device type id, e.g. `'plate-reverb'`. */
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
 * A device that holds more than its parameters say: a hosted plug-in with a
 * sample it loaded, a program it picked, a curve drawn in its own window.
 * Its state is opaque text (base64 for a plug-in's own chunk) that brings a
 * new instance back to where this one is. A score keeps it beside the
 * device's parameters (`ScoreDevice.state`).
 */
export interface StatefulDevice extends Device {
  /** Says the state is text a score can keep; other `getState`s are the device's own business. */
  readonly stateful: true
  /** The device's whole state as it is now. */
  getState(): Promise<string>
  /**
   * Restore a `getState()` result. Resolves to whether the device loaded it:
   * false when it already held exactly this state and left itself alone.
   */
  setState(state: string): Promise<boolean>
  /**
   * Called when the device knows its state changed in a way no parameter
   * shows, so a host that keeps the state can read it again. Optional: a
   * device that cannot tell leaves it out. Returns the unsubscribe function.
   */
  onStateChange?(listener: () => void): () => void
}

export function isStatefulDevice(device: Device): device is StatefulDevice {
  const candidate = device as Partial<StatefulDevice>
  return (
    candidate.stateful === true &&
    typeof candidate.getState === 'function' &&
    typeof candidate.setState === 'function'
  )
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
  /**
   * A reading for a display to draw (where an LFO is in its cycle), not a
   * number to print: a panel that lists a device's readings leaves it out.
   */
  display?: true
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

/**
 * A device that moves its own parameters on the audio thread. Given what
 * modulates a parameter (`ParamModulation`: LFOs and seeded noise, as plain
 * numbers), it works the value out at every block from the block's own time,
 * so the motion is on the audio clock: the same offline as live. The value the
 * parameter is set to (`setParam`, `getParam`) stays the base it moves around.
 * `WasmDevice` on the library's own processor is one.
 */
export interface ModulatedDevice extends Device {
  /** Says the device takes modulation; one that hosts a processor of its own may not. */
  readonly modulates: true
  /** Start moving a parameter, change what moves it, or (null) leave it at its base. */
  modulate(name: string, modulation: ParamModulation | null): void
  /** What moves a parameter now; undefined for one that stands still. */
  modulationOf(name: string): ParamModulation | undefined
  /**
   * The parameter's value at `timeSec` on the device's clock (its context's
   * `currentTime`, the default): the base for one that stands still. What a
   * knob draws to show where the parameter is.
   */
  paramAt(name: string, timeSec?: number): number
}

export function isModulatedDevice(device: Device): device is ModulatedDevice {
  const candidate = device as Partial<ModulatedDevice>
  return candidate.modulates === true && typeof candidate.modulate === 'function'
}

/** What a device reports after `setParam`, a bypass change or a change to what moves a parameter (U24: UI subscriptions). */
export type DeviceChange =
  | { type: 'param'; name: string; value: number }
  | { type: 'bypass'; bypass: boolean }
  | { type: 'modulation'; name: string }

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
