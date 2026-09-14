// The one event shape every input adapter produces and the mapping table
// consumes. Decoders (`midi.ts`, `osc.ts`) turn wire bytes into these; the
// table never sees raw MIDI or OSC again, so a mapping behaves the same
// whatever the controller speaks.

import { type ControlSource } from './source'

export type ControlEvent =
  /**
   * A position. MIDI decoders normalise to 0..1 (`raw` keeps the wire value,
   * 0–127 or 0–16383, for relative-encoder decoding); OSC passes the argument
   * through unscaled and the mapping's `input` range normalises it.
   */
  | { kind: 'absolute'; source: ControlSource; value: number; raw?: number }
  /** A button edge: note-on/off, OSC `T`/`F`, or a bang (no arguments). `value` is the velocity 0..1. */
  | { kind: 'trigger'; source: ControlSource; on: boolean; value: number }

export function absoluteEvent(source: ControlSource, value: number, raw?: number): ControlEvent {
  return raw === undefined
    ? { kind: 'absolute', source, value }
    : { kind: 'absolute', source, value, raw }
}

export function triggerEvent(source: ControlSource, on: boolean, value = on ? 1 : 0): ControlEvent {
  return { kind: 'trigger', source, on, value }
}
