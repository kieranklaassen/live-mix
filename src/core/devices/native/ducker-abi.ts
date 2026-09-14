// Wire contract between the WorkletDucker host and its processor
// (src/dsp/worklets/ducker.processor.ts): processor name, parameter table,
// processorOptions and the messages in both directions. Defaults are the
// Phase 0 constants from Ducker.ts so a keyed bus sounds the same in either
// mode. Keep this file free of runtime imports beyond those constants: the
// processor bundles it into a self-contained worklet file.

import { type ParamSpec } from '../../params'
import {
  DUCK_DEPTH,
  DUCK_KEY_FFT_SIZE,
  DUCK_TIME_CONSTANT,
  ENV_ATTACK_MS,
  ENV_GAIN_SCALE,
  ENV_RELEASE_MS,
} from './Ducker'

/** Registered processor name; shared by the host and the worklet file. */
export const DUCKER_PROCESSOR_NAME = 'live-mix-ducker'

/** Key RMS window (samples): the legacy analyser's fftSize. */
export const DUCKER_DEFAULT_WINDOW_SIZE = DUCK_KEY_FFT_SIZE
/** Hold after the key falls before release starts (ms). 0 = the legacy law. */
export const DUCK_HOLD_MS = 0
/** Envelope/gain report rate to the main thread (Hz). */
export const DUCKER_REPORT_HZ = 30
/** Bypass crossfade toward unity gain, seconds (matches the WASM device host). */
export const DUCKER_BYPASS_RAMP_SECONDS = 0.005

export const DUCKER_PARAMS = {
  depth: { id: 0, name: 'Depth', min: 0, max: 1, default: DUCK_DEPTH, taper: 'linear', unit: '' },
  attackMs: {
    id: 1,
    name: 'Attack',
    min: 1,
    max: 2000,
    default: ENV_ATTACK_MS,
    taper: 'log',
    unit: 'ms',
  },
  holdMs: {
    id: 2,
    name: 'Hold',
    min: 0,
    max: 5000,
    default: DUCK_HOLD_MS,
    taper: 'linear',
    unit: 'ms',
  },
  releaseMs: {
    id: 3,
    name: 'Release',
    min: 1,
    max: 10000,
    default: ENV_RELEASE_MS,
    taper: 'log',
    unit: 'ms',
  },
  gainScale: {
    id: 4,
    name: 'Key scale',
    min: 0.1,
    max: 32,
    default: ENV_GAIN_SCALE,
    taper: 'log',
    unit: '',
  },
  timeConstant: {
    id: 5,
    name: 'Gain time constant',
    min: 0.001,
    max: 1,
    default: DUCK_TIME_CONSTANT,
    taper: 'log',
    unit: 's',
  },
} as const satisfies Record<string, ParamSpec>

export type DuckerParamName = keyof typeof DUCKER_PARAMS

/** `processorOptions` the host passes to `new AudioWorkletNode(...)`. */
export interface DuckerProcessorOptions {
  /** Initial parameter values by id, applied before the first block. */
  params?: readonly (readonly [paramId: number, value: number])[]
  /** Key RMS window in samples. Default 256 (the legacy analyser's fftSize). */
  windowSize?: number
  /** Envelope report rate (Hz); 0 disables reports. Default 30. */
  reportHz?: number
}

/** Main thread → worklet. */
export type DuckerMessage =
  | { type: 'set-param'; paramId: number; value: number }
  | { type: 'bypass'; enabled: boolean }
  | { type: 'stop' }
  | { type: 'dispose' }

/** Worklet → main thread. */
export type DuckerHostMessage =
  { type: 'ready'; windowSize: number } | { type: 'envelope'; envelope: number; gain: number }
