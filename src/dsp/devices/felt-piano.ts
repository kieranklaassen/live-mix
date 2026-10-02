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
  felt: {
    id: 0,
    name: 'Felt',
    min: 0,
    max: 1,
    default: 0.65,
    taper: 'linear',
    unit: '',
    description:
      'Lowers a felt strip between hammers and strings. More is darker and softer, with less dynamic range and a shorter sustain.',
  },
  hardness: {
    id: 1,
    name: 'Hammer',
    min: 0,
    max: 1,
    default: 0.35,
    taper: 'linear',
    unit: '',
    description:
      'How hard the hammers are. Soft hammers give a round, dark attack; hard ones are brighter and more percussive.',
  },
  detune: {
    id: 2,
    name: 'Detune',
    min: 0,
    max: 1,
    default: 0.5,
    taper: 'linear',
    unit: '',
    description:
      'How far apart the strings of each note are tuned. Zero is pure and still; higher adds slow beating and chorus.',
  },
  stiffness: {
    id: 3,
    name: 'Stiffness',
    min: 0,
    max: 2,
    default: 1,
    taper: 'linear',
    unit: '',
    description:
      'How stiff the strings are, which pulls the overtones sharp. Zero is perfectly harmonic; higher sounds more like a bell.',
  },
  thump: {
    id: 4,
    name: 'Thump',
    min: 0,
    max: 1,
    default: 0.5,
    taper: 'linear',
    unit: '',
    description:
      'How much of the low knock of the hammer and the broadband splash of the strike is heard under each note.',
  },
  action: {
    id: 5,
    name: 'Action',
    min: 0,
    max: 1,
    default: 0.4,
    taper: 'linear',
    unit: '',
    description:
      'Level of the key mechanism: the tick as a key goes down and the thud of the damper landing when a note ends.',
  },
  pedalNoise: {
    id: 6,
    name: 'Pedal noise',
    min: 0,
    max: 1,
    default: 0.4,
    taper: 'linear',
    unit: '',
    description:
      'How loud the dampers are when the sustain pedal goes down or comes up. The noise also stirs the sympathetic strings.',
  },
  grit: {
    id: 7,
    name: 'Grit',
    min: 0,
    max: 1,
    default: 0.12,
    taper: 'linear',
    unit: '',
    description:
      'Blends in a driven, saturated copy of the piano plus a little close-mic noise that follows the playing. Zero is clean.',
  },
  resonance: {
    id: 8,
    name: 'Resonance',
    min: 0,
    max: 1,
    default: 0.5,
    taper: 'linear',
    unit: '',
    description:
      'How much the other strings ring in sympathy with what is played. Faint with the sustain pedal up, a long bloom with it down.',
  },
  damper: {
    id: 9,
    name: 'Damper',
    min: 0,
    max: 1,
    default: 0.5,
    taper: 'linear',
    unit: '',
    description:
      'How fast the dampers stop a note when the key is let go. Low lets notes fade out slowly; high cuts them off quickly.',
  },
  reverbMix: {
    id: 10,
    name: 'Reverb',
    min: 0,
    max: 1,
    default: 0.25,
    taper: 'linear',
    unit: '',
    description: 'How much of the room is mixed in with the piano. Fully up is the room alone.',
  },
  reverbSize: {
    id: 11,
    name: 'Room',
    min: 0,
    max: 1,
    default: 0.3,
    taper: 'linear',
    unit: '',
    description: 'How long the room rings. Low is a short, close room; high is a long tail.',
  },
  width: {
    id: 12,
    name: 'Width',
    min: 0,
    max: 1,
    default: 0.5,
    taper: 'linear',
    unit: '',
    description:
      'Stereo width of the piano before the room. Zero is mono, the middle is the natural spread and the top is extra wide.',
  },
  outputDb: {
    id: 13,
    name: 'Output',
    min: -24,
    max: 12,
    default: 0,
    taper: 'linear',
    unit: 'dB',
    description:
      'Overall level after the room. A soft limiter follows it and rounds off the peaks when pushed.',
  },
  sustain: {
    id: 14,
    name: 'Sustain',
    min: 0,
    max: 1,
    default: 0,
    taper: 'linear',
    unit: '',
    description:
      'Holds notes after the keys are let go and lets the other strings ring. Below halfway it only slows the dampers, as a half pedal.',
  },
  sostenuto: {
    id: 15,
    name: 'Sostenuto',
    min: 0,
    max: 1,
    default: 0,
    taper: 'linear',
    unit: '',
    description:
      'Holds only the notes that are sounding when it goes down. Notes played after that damp as usual.',
  },
  soft: {
    id: 16,
    name: 'Soft pedal',
    min: 0,
    max: 1,
    default: 0,
    taper: 'linear',
    unit: '',
    description: 'Una corda. Notes struck while it is down are quieter and a little darker.',
  },
  polyphony: {
    id: 17,
    name: 'Polyphony',
    min: 1,
    max: 32,
    default: 32,
    taper: 'linear',
    unit: 'voices',
    description:
      'How many notes can sound at once. Lower saves processing; at the limit the quietest note gives way to the new one.',
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
