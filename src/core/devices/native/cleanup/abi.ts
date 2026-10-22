// Wire contract between the voice cleanup hosts (WorkletCleanup.ts) and their
// processors (src/dsp/worklets/cleanup.processor.ts): the six devices, their
// parameter tables, how long each holds its sound, processorOptions and the
// messages in both directions. One bundled worklet file registers all six
// processors. Keep this file free of runtime imports beyond the param types:
// the processor bundles it into a self-contained worklet file.
//
// The six are the repair tools of a dialogue editor, in the order they are
// best run: hum, clicks, pops, noise, the room, then sibilance. Their
// defaults are gentle and suit a speaking voice: each takes off what is
// plainly wrong and leaves a clean voice as it was.

import { type ParamSpec } from '../../../params'

/** Every voice cleanup device, by registry id, in the order a chain runs them. */
export const CLEANUP_KINDS = [
  'de-hum',
  'de-click',
  'de-plosive',
  'de-noise',
  'de-reverb',
  'de-ess',
] as const

export type CleanupKind = (typeof CLEANUP_KINDS)[number]

/** Registered processor name of one kind; shared by the host and the worklet file. */
export const cleanupProcessorName = (kind: CleanupKind): string => `live-mix-cleanup-${kind}`

/** Meter report rate to the main thread (Hz). */
export const CLEANUP_REPORT_HZ = 30
/** Bypass crossfade toward the dry sound, seconds (matches the gate, the ducker and the WASM host). */
export const CLEANUP_BYPASS_RAMP_SECONDS = 0.005

/**
 * The frame the two spectral devices (de-noise, de-reverb) work in, in
 * samples: about 21 ms at any rate, a power of two. They hold their sound
 * for one frame.
 */
export function cleanupFrameSize(sampleRate: number): number {
  if (sampleRate <= 24_000) return 512
  if (sampleRate <= 50_000) return 1024
  if (sampleRate <= 100_000) return 2048
  return 4096
}

/** The longest click de-click repairs, and the sound it reads on either side of one (ms). */
export const DECLICK_MAX_LENGTH_MS = 3
export const DECLICK_MARGIN_MS = 0.25
export const DECLICK_CONTEXT_MS = 3

/** How long de-click holds its sound: room for the longest click and the sound after it that its repair reads. */
export function declickLatencySamples(sampleRate: number): number {
  const samples = (ms: number) => Math.ceil((ms / 1000) * sampleRate)
  return (
    samples(DECLICK_MAX_LENGTH_MS) +
    2 * samples(DECLICK_MARGIN_MS) +
    samples(DECLICK_CONTEXT_MS) +
    1
  )
}

/** How many samples a kind holds its sound at `sampleRate`; the engine's delay compensation lines the rest up with it. */
export function cleanupLatencySamples(kind: CleanupKind, sampleRate: number): number {
  switch (kind) {
    case 'de-noise':
    case 'de-reverb':
      return cleanupFrameSize(sampleRate)
    case 'de-click':
      return declickLatencySamples(sampleRate)
    case 'de-hum':
    case 'de-plosive':
    case 'de-ess':
      return 0
    default: {
      const unhandled: never = kind
      throw new Error(`live-mix: unknown cleanup device ${String(unhandled)}`)
    }
  }
}

export const DEHUM_PARAMS = {
  mains: {
    id: 0,
    name: 'Mains',
    min: 0,
    max: 1,
    default: 1,
    taper: 'linear',
    unit: '',
    choices: ['50 Hz', '60 Hz'],
    description:
      'The frequency of the power where it was recorded: 60 Hz in the Americas, 50 Hz in most of the rest of the world.',
  },
  harmonics: {
    id: 1,
    name: 'Harmonics',
    min: 1,
    max: 8,
    default: 4,
    taper: 'linear',
    unit: '',
    step: 1,
    description:
      'How many of the hum’s tones are taken out: the mains itself and the ones above it. A buzz needs more than a low hum.',
  },
  width: {
    id: 2,
    name: 'Width',
    min: 0.5,
    max: 20,
    default: 2,
    taper: 'log',
    unit: 'Hz',
    description:
      'How wide each cut is. Narrow touches nothing of the voice beside the hum; wider catches a hum that wanders.',
  },
  reduction: {
    id: 3,
    name: 'Reduction',
    min: 0,
    max: 60,
    default: 30,
    taper: 'linear',
    unit: 'dB',
    description: 'How far each of the hum’s tones is turned down.',
  },
} as const satisfies Record<string, ParamSpec>

export const DECLICK_PARAMS = {
  sensitivity: {
    id: 0,
    name: 'Sensitivity',
    min: 0,
    max: 1,
    default: 0.5,
    taper: 'linear',
    unit: '',
    description:
      'How sharp a tick must be to count as a click. Up catches the small wet clicks of a mouth too; too far up starts to soften hard consonants.',
  },
  lengthMs: {
    id: 1,
    name: 'Length',
    min: 0.5,
    max: DECLICK_MAX_LENGTH_MS,
    default: 1.5,
    taper: 'linear',
    unit: 'ms',
    description:
      'The longest click it repairs. Anything longer is taken for part of the voice and left alone.',
  },
} as const satisfies Record<string, ParamSpec>

export const DEPLOSIVE_PARAMS = {
  threshold: {
    id: 0,
    name: 'Threshold',
    min: 0,
    max: 24,
    default: 6,
    taper: 'linear',
    unit: 'dB',
    description:
      'How far the lows must stand above the rest of the voice to count as a pop. Lower catches softer pops and may thin a deep voice.',
  },
  frequency: {
    id: 1,
    name: 'Frequency',
    min: 60,
    max: 300,
    default: 150,
    taper: 'log',
    unit: 'Hz',
    description: 'Where the lows end: everything under it is turned down while a pop lasts.',
  },
  range: {
    id: 2,
    name: 'Range',
    min: 0,
    max: 36,
    default: 18,
    taper: 'linear',
    unit: 'dB',
    description: 'The most a pop’s lows are turned down.',
  },
} as const satisfies Record<string, ParamSpec>

export const DENOISE_PARAMS = {
  reduction: {
    id: 0,
    name: 'Reduction',
    min: 0,
    max: 40,
    default: 12,
    taper: 'linear',
    unit: 'dB',
    description:
      'How far the noise is turned down. A little sounds natural; a lot leaves silence between words and can make the voice watery.',
  },
  threshold: {
    id: 1,
    name: 'Threshold',
    min: -10,
    max: 20,
    default: 0,
    taper: 'linear',
    unit: 'dB',
    description:
      'How far over the noise it has learned a sound must be to be kept. Up takes more out, quiet ends of words with it.',
  },
  adaptSec: {
    id: 2,
    name: 'Adapt',
    min: 0.5,
    max: 10,
    default: 2,
    taper: 'log',
    unit: 's',
    description:
      'How quickly it learns a noise that grows: short follows a fan that comes on, long never mistakes a held vowel for noise.',
  },
} as const satisfies Record<string, ParamSpec>

export const DEREVERB_PARAMS = {
  reduction: {
    id: 0,
    name: 'Reduction',
    min: 0,
    max: 30,
    default: 10,
    taper: 'linear',
    unit: 'dB',
    description: 'How far the room’s echo and reverb are turned down.',
  },
  tailSec: {
    id: 1,
    name: 'Tail',
    min: 0.1,
    max: 3,
    default: 0.6,
    taper: 'log',
    unit: 's',
    description:
      'How long the room rings after a word, as its reverb time. Match it to the room: a small office is short, a hall or a stairwell long.',
  },
  earlyMs: {
    id: 2,
    name: 'Early',
    min: 10,
    max: 120,
    default: 40,
    taper: 'linear',
    unit: 'ms',
    description:
      'How much of each sound is left alone before its echo is taken out. Short is drier; long keeps a voice’s own body.',
  },
} as const satisfies Record<string, ParamSpec>

export const DEESS_PARAMS = {
  threshold: {
    id: 0,
    name: 'Threshold',
    min: -40,
    max: 0,
    default: -12,
    taper: 'linear',
    unit: 'dB',
    description:
      'How near the hiss over the frequency must come to the level of the whole voice to be turned down. Lower catches softer esses; it does not care how loud the voice is.',
  },
  frequency: {
    id: 1,
    name: 'Frequency',
    min: 2000,
    max: 12_000,
    default: 5500,
    taper: 'log',
    unit: 'Hz',
    description:
      'Where the esses start. Lower for a deep voice, higher for a bright one. Only what is over it is turned down.',
  },
  range: {
    id: 2,
    name: 'Range',
    min: 0,
    max: 24,
    default: 8,
    taper: 'linear',
    unit: 'dB',
    description: 'The most an ess is turned down.',
  },
} as const satisfies Record<string, ParamSpec>

/** Each kind's parameter table. */
export const CLEANUP_PARAMS = {
  'de-hum': DEHUM_PARAMS,
  'de-click': DECLICK_PARAMS,
  'de-plosive': DEPLOSIVE_PARAMS,
  'de-noise': DENOISE_PARAMS,
  'de-reverb': DEREVERB_PARAMS,
  'de-ess': DEESS_PARAMS,
} as const satisfies Record<CleanupKind, Record<string, ParamSpec>>

export type CleanupParams = typeof CLEANUP_PARAMS
export type CleanupParamName<K extends CleanupKind> = keyof CleanupParams[K] & string

/** `processorOptions` the host passes to `new AudioWorkletNode(...)`. */
export interface CleanupProcessorOptions {
  kind: CleanupKind
  /** Initial parameter values by id, applied before the first block. */
  params?: readonly (readonly [paramId: number, value: number])[]
  /** Meter report rate (Hz); 0 disables reports. Default 30. */
  reportHz?: number
}

/** Main thread → worklet. */
export type CleanupMessage =
  | { type: 'set-param'; paramId: number; value: number }
  | { type: 'bypass'; enabled: boolean }
  | { type: 'dispose' }

/** Worklet → main thread: how many dB the device took off over the last report's span. */
export type CleanupHostMessage = { type: 'ready' } | { type: 'meter'; reduction: number }
