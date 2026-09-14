// Parameter table for the Felt piano instrument (cpp/devices/felt-piano),
// kkfonie's physically modelled felt piano behind the device ABI plus the
// note entry points. Ids must match FeltPianoParam in felt_piano_device.h.
// Felt's percent knobs are 0..1 here; ranges and defaults are Felt's.
//
// Play it through `NoteDevice`: `noteOn(id, frequency, gain)` rounds the
// frequency to the nearest key (A0 27.5 Hz .. C8 4186 Hz) and takes `gain` as
// the MIDI velocity 0..1 (0.5 = mf); `noteOff(id)` releases it. Pedals are
// params: `sustain` (continuous CC64 — >= 0.5 holds, below that the value
// sets the half-pedal damping rate), `sostenuto`, `soft` (una corda).

import { type ParamSpec } from '../../core/params'
import { defineWasmDevice, WasmDevice, type WasmDeviceOptions } from '../WasmDevice'

export const FELT_PIANO_PARAMS = {
  felt: { id: 0, name: 'Felt', min: 0, max: 1, default: 0.65, taper: 'linear', unit: '' },
  hardness: { id: 1, name: 'Hammer', min: 0, max: 1, default: 0.35, taper: 'linear', unit: '' },
  detune: { id: 2, name: 'Detune', min: 0, max: 1, default: 0.5, taper: 'linear', unit: '' },
  stiffness: { id: 3, name: 'Stiffness', min: 0, max: 2, default: 1, taper: 'linear', unit: '' },
  thump: { id: 4, name: 'Thump', min: 0, max: 1, default: 0.5, taper: 'linear', unit: '' },
  action: { id: 5, name: 'Action', min: 0, max: 1, default: 0.4, taper: 'linear', unit: '' },
  pedalNoise: {
    id: 6,
    name: 'Pedal noise',
    min: 0,
    max: 1,
    default: 0.4,
    taper: 'linear',
    unit: '',
  },
  grit: { id: 7, name: 'Grit', min: 0, max: 1, default: 0.12, taper: 'linear', unit: '' },
  resonance: { id: 8, name: 'Resonance', min: 0, max: 1, default: 0.5, taper: 'linear', unit: '' },
  damper: { id: 9, name: 'Damper', min: 0, max: 1, default: 0.5, taper: 'linear', unit: '' },
  reverbMix: { id: 10, name: 'Reverb', min: 0, max: 1, default: 0.25, taper: 'linear', unit: '' },
  reverbSize: { id: 11, name: 'Room', min: 0, max: 1, default: 0.3, taper: 'linear', unit: '' },
  width: { id: 12, name: 'Width', min: 0, max: 1, default: 0.5, taper: 'linear', unit: '' },
  outputDb: { id: 13, name: 'Output', min: -24, max: 12, default: 0, taper: 'linear', unit: 'dB' },
  sustain: { id: 14, name: 'Sustain', min: 0, max: 1, default: 0, taper: 'linear', unit: '' },
  sostenuto: { id: 15, name: 'Sostenuto', min: 0, max: 1, default: 0, taper: 'linear', unit: '' },
  soft: { id: 16, name: 'Soft pedal', min: 0, max: 1, default: 0, taper: 'linear', unit: '' },
  polyphony: {
    id: 17,
    name: 'Polyphony',
    min: 1,
    max: 32,
    default: 32,
    taper: 'linear',
    unit: 'voices',
  },
} as const satisfies Record<string, ParamSpec>

export type FeltPianoParamName = keyof typeof FELT_PIANO_PARAMS

/** Lowest and highest keys the model has calibration for (A0 .. C8). */
export const FELT_PIANO_KEY_RANGE = { lowest: 21, highest: 108 } as const

/**
 * The key a note frequency lands on: the nearest MIDI number clamped to
 * `FELT_PIANO_KEY_RANGE`. Identical to `FeltPianoDevice::midi_note_for`.
 */
export function feltPianoKeyFor(frequency: number): number {
  if (!(frequency > 0)) return FELT_PIANO_KEY_RANGE.lowest
  const note = Math.floor(69 + 12 * Math.log2(frequency / 440) + 0.5)
  return Math.min(FELT_PIANO_KEY_RANGE.highest, Math.max(FELT_PIANO_KEY_RANGE.lowest, note))
}

export const FELT_PIANO_DEVICE = defineWasmDevice({
  id: 'felt-piano',
  // Static literal so Vite can rewrite it to a hashed asset URL at build time.
  wasm: () => new URL('../wasm/felt-piano.wasm', import.meta.url),
  params: FELT_PIANO_PARAMS,
})

export type FeltPiano = WasmDevice<typeof FELT_PIANO_PARAMS>

/**
 * kkfonie's Felt: a physically modelled felt piano (per-note inharmonic modal
 * banks, hammer contact-time model, velvet-noise mechanics, sympathetic
 * strings, FDN room) as a `NoteDevice` for an `InstrumentTrack`. Up to 32
 * voices; `polyphony` caps the pool for CPU. Marked experimental in the
 * registry: see docs/devices.md for the measured cost.
 */
export function createFeltPiano(
  context: BaseAudioContext,
  options: WasmDeviceOptions<typeof FELT_PIANO_PARAMS> = {},
): Promise<FeltPiano> {
  return WasmDevice.create(context, FELT_PIANO_DEVICE, options)
}
