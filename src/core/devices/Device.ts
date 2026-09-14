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
  dispose(): void
}

/** A device that plays notes — an instrument. */
export interface NoteDevice extends Device {
  noteOn(noteId: number, frequency: number, gain?: number): void
  noteOff(noteId: number): void
}

export function isNoteDevice(device: Device): device is NoteDevice {
  const candidate = device as Partial<NoteDevice>
  return typeof candidate.noteOn === 'function' && typeof candidate.noteOff === 'function'
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
