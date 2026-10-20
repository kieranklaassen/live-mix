// Wire contract between the WorkletGate host and its processor
// (src/dsp/worklets/gate.processor.ts): processor name, parameter table,
// processorOptions and the messages in both directions. The defaults are a
// gentle gate for a speaking voice: it opens on a word at once, stays open
// through the short gaps inside a sentence, and in the longer pauses turns
// the room down by 12 dB rather than cutting it off. Keep this file free of
// runtime imports beyond the param types: the processor bundles it into a
// self-contained worklet file.

import { type ParamSpec } from '../../params'

/** Registered processor name; shared by the host and the worklet file. */
export const GATE_PROCESSOR_NAME = 'live-mix-gate'

/** Level and gain report rate to the main thread (Hz). */
export const GATE_REPORT_HZ = 30
/** Bypass crossfade toward unity gain, seconds (matches the ducker and the WASM device host). */
export const GATE_BYPASS_RAMP_SECONDS = 0.005
/** How fast the detector falls after a peak (ms): short, so the gate hears a word end. */
export const GATE_DETECTOR_RELEASE_MS = 10

export const GATE_PARAMS = {
  threshold: {
    id: 0,
    name: 'Threshold',
    min: -90,
    max: 0,
    default: -50,
    taper: 'linear',
    unit: 'dB',
    description:
      'The level the sound must reach to open the gate. Set it between the room and the quietest word: too high cuts the starts and ends of words.',
  },
  range: {
    id: 1,
    name: 'Range',
    min: -90,
    max: 0,
    default: -12,
    taper: 'linear',
    unit: 'dB',
    description:
      'How far the sound is turned down while the gate is closed. A little keeps the room natural between words; the most silences it.',
  },
  attackMs: {
    id: 2,
    name: 'Attack',
    min: 0.1,
    max: 100,
    default: 2,
    taper: 'log',
    unit: 'ms',
    description:
      'How quickly the gate opens once the sound is over the threshold. Short keeps the first consonant of a word; long fades it in.',
  },
  holdMs: {
    id: 3,
    name: 'Hold',
    min: 0,
    max: 2000,
    default: 150,
    taper: 'linear',
    unit: 'ms',
    description:
      'How long the gate stays open after the sound falls under the threshold. It keeps the gate from chattering in the gaps between words.',
  },
  releaseMs: {
    id: 4,
    name: 'Release',
    min: 5,
    max: 2000,
    default: 200,
    taper: 'log',
    unit: 'ms',
    description:
      'How slowly the gate closes after the hold. Long lets a word’s tail and the room fade out; short closes hard.',
  },
  hysteresis: {
    id: 5,
    name: 'Hysteresis',
    min: 0,
    max: 20,
    default: 4,
    taper: 'linear',
    unit: 'dB',
    description:
      'How far under the threshold the sound must fall before the gate starts to close. More keeps a voice hovering at the threshold from flickering it.',
  },
} as const satisfies Record<string, ParamSpec>

export type GateParamName = keyof typeof GATE_PARAMS

/** `processorOptions` the host passes to `new AudioWorkletNode(...)`. */
export interface GateProcessorOptions {
  /** Initial parameter values by id, applied before the first block. */
  params?: readonly (readonly [paramId: number, value: number])[]
  /** Level report rate (Hz); 0 disables reports. Default 30. */
  reportHz?: number
}

/** Main thread → worklet. */
export type GateMessage =
  | { type: 'set-param'; paramId: number; value: number }
  | { type: 'bypass'; enabled: boolean }
  | { type: 'dispose' }

/** Worklet → main thread. */
export type GateHostMessage = { type: 'ready' } | { type: 'level'; level: number; gain: number }
