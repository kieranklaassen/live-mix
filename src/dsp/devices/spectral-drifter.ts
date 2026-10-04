// Parameter table for the SpectralDrifter device (cpp/devices/spectral-drifter),
// the granular pitch drifter extracted from kkfonie's Bloom plugin. Ids must
// match SpectralDrifterParam in spectral_drifter_device.h.
//
// Eight overlapping Hann-windowed grains (6144 samples) read the input
// backwards at a pitch ratio that blends from unison towards the chosen
// interval by an intensity `bloom * (0.3 + 0.7 * age)`, then season and seed
// shaping, soft saturation and two smoothing stages. Choice params take the
// index of the option; the arrays below name them.

import { type ParamSpec } from '../../core/params'
import { defineWasmDevice, WasmDevice, type WasmDeviceOptions } from '../WasmDevice'

export const SPECTRAL_DRIFTER_DIRECTIONS = ['Up', 'Down', 'Scatter'] as const
export const SPECTRAL_DRIFTER_SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'] as const
export const SPECTRAL_DRIFTER_SEEDS = ['Fundamental', 'Odd', 'Even'] as const
export const SPECTRAL_DRIFTER_INTERVALS = ['Fifth', 'Octave', 'Fifth+Octave', 'Atonal'] as const
export const SPECTRAL_DRIFTER_AGE_MODES = ['Auto', 'Manual'] as const

export const SPECTRAL_DRIFTER_PARAMS = {
  mix: {
    id: 0,
    name: 'Mix',
    min: 0,
    max: 1,
    default: 0.5,
    taper: 'linear',
    unit: '',
    description:
      'Balance between the dry sound and the drifted grains. At zero only the dry sound is heard; at full only the grains.',
  },
  bloom: {
    id: 1,
    name: 'Bloom',
    min: 0,
    max: 1,
    default: 0.5,
    taper: 'linear',
    unit: '',
    description:
      'How far the grains drift in pitch from the played note towards the Interval. Low stays near unison; high reaches the interval as the sound ages.',
  },
  direction: {
    id: 2,
    name: 'Direction',
    min: 0,
    max: 2,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: SPECTRAL_DRIFTER_DIRECTIONS,
    description:
      'Which way the pitch drifts. Up and Down move every grain the same way; Scatter sends some grains up and others down at once.',
  },
  season: {
    id: 3,
    name: 'Season',
    min: 0,
    max: 3,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: SPECTRAL_DRIFTER_SEASONS,
    description:
      'Tone of the drifted sound, brightest to darkest: Spring lifts the highs, Summer is close to flat, Autumn rolls them off, Winter is dark with added lows.',
  },
  seed: {
    id: 4,
    name: 'Seed',
    min: 0,
    max: 2,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: SPECTRAL_DRIFTER_SEEDS,
    description:
      'Colour added to the drifted sound. Fundamental softens the top, Odd adds a hollow edge from odd harmonics, Even adds warmth from even ones.',
  },
  interval: {
    id: 5,
    name: 'Interval',
    min: 0,
    max: 3,
    default: 1,
    taper: 'linear',
    unit: '',
    choices: SPECTRAL_DRIFTER_INTERVALS,
    description:
      'Where the drift is heading: a fifth, an octave, or grains split between the two. Atonal has no fixed interval and slides by up to an octave.',
  },
  decay: {
    id: 6,
    name: 'Decay',
    min: 1,
    max: 30,
    default: 5,
    taper: 'log',
    unit: 's',
    description:
      'In Auto age mode, how long a sound must keep ringing before the drift reaches full depth. Longer makes the shift build more slowly.',
  },
  ageMode: {
    id: 7,
    name: 'Age mode',
    min: 0,
    max: 1,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: SPECTRAL_DRIFTER_AGE_MODES,
    description:
      'Auto deepens the drift the longer the input keeps sounding and lets it fall back in silence. Manual takes it from the Age knob instead.',
  },
  age: {
    id: 8,
    name: 'Age',
    min: 0,
    max: 1,
    default: 1,
    taper: 'linear',
    unit: '',
    description:
      'In Manual age mode, how far along the drift is. Low leaves about a third of the shift Bloom sets; full gives all of it.',
  },
} as const satisfies Record<string, ParamSpec>

export type SpectralDrifterParamName = keyof typeof SPECTRAL_DRIFTER_PARAMS

/**
 * Bloom's drift intensity, `bloom * (0.3 + 0.7 * age)` (SpectralDrifter.cpp
 * `process`): the amount by which every grain's pitch ratio blends from unison
 * towards its interval. Identical to the C++; UI that animates the drift must
 * use this so visual equals audio.
 */
export function spectralDrifterIntensity(bloom: number, age: number): number {
  return bloom * (0.3 + age * 0.7)
}

export const SPECTRAL_DRIFTER_DEVICE = defineWasmDevice({
  id: 'spectral-drifter',
  // Static literal so Vite can rewrite it to a hashed asset URL at build time.
  wasm: () => new URL('../wasm/spectral-drifter.wasm', import.meta.url),
  params: SPECTRAL_DRIFTER_PARAMS,
})

export type SpectralDrifter = WasmDevice<typeof SPECTRAL_DRIFTER_PARAMS>

/**
 * Bloom's SpectralDrifter as a stereo insert (one drifter per channel,
 * equal-power `mix`). `bloom` sets how far grains drift towards `interval`
 * in `direction`; `season` and `seed` shape the tone. Age drives the drift:
 * `ageMode` 0 runs Bloom's activity tracker on the input (drift grows while
 * the input rings, up to `2 * decay` seconds, and forgets in silence), 1 uses
 * `age` directly so a modulator can drive it.
 */
export function createSpectralDrifter(
  context: BaseAudioContext,
  options: WasmDeviceOptions<typeof SPECTRAL_DRIFTER_PARAMS> = {},
): Promise<SpectralDrifter> {
  return WasmDevice.create(context, SPECTRAL_DRIFTER_DEVICE, options)
}
