import { type FactoryPreset } from '../types'

export const EMBER_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'warm-chorus-pad',
    name: 'Warm chorus pad',
    category: 'pad',
    description: 'Two detuned saws and a sub under a low filter, through a slow stereo chorus.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: { cutoff: 750, unisonVoices: 1, volume: -2 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush Ensemble', params: { depth: 45, mix: 0.45 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'slow-filter-swell',
    name: 'Slow filter swell',
    category: 'pad',
    description:
      'A dark saw chord whose filter takes four seconds to open, then closes into a hall.',
    instrument: {
      deviceId: 'ember',
      preset: 'Slow strings',
      params: {
        filterSlope: 1,
        cutoff: 320,
        resonance: 0.22,
        filterEnvAmount: 0.5,
        filterAttack: 4,
        filterDecay: 4,
        filterSustain: 0.7,
        filterRelease: 5,
        ampAttack: 3.2,
        ampRelease: 5,
        unisonVoices: 2,
        unisonSpread: 0.6,
      },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'glass-octave-pad',
    name: 'Glass octave pad',
    category: 'pad',
    description:
      'A triangle an octave up with a pulse of moving width above it, left in a long plate.',
    instrument: {
      deviceId: 'ember',
      preset: 'Glass pad',
      params: {
        osc1Coarse: 12,
        osc2Coarse: 24,
        osc2Pw: 0.5,
        oscMix: 0.42,
        cutoff: 7000,
        ampRelease: 5,
        unisonVoices: 2,
        unisonSpread: 0.7,
        volume: -9,
      },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } }],
  },
  {
    id: 'soft-brass-pad',
    name: 'Soft brass pad',
    category: 'pad',
    description: 'Speaks at once and then mellows, like quiet synth brass played back from tape.',
    instrument: {
      deviceId: 'ember',
      preset: 'Brass',
      params: {
        cutoff: 950,
        filterEnvAmount: 0.42,
        filterAttack: 0.25,
        filterDecay: 2.2,
        filterSustain: 0.35,
        filterRelease: 2,
        ampAttack: 0.09,
        ampRelease: 2.4,
        unisonVoices: 2,
        unisonDetune: 10,
        unisonSpread: 0.7,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'dattorro', preset: 'Small plate' },
    ],
  },
  {
    id: 'low-ember-drone',
    name: 'Low ember drone',
    category: 'drone',
    description:
      'Two saws a fifth apart over a sub, barely open, with a filter that breathes slowly.',
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: {
        osc2Shape: 0,
        osc2Coarse: 7,
        oscMix: 0.3,
        subLevel: 0.3,
        cutoff: 650,
        volume: -5,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.35 } }],
    preview: 'low',
  },
]
