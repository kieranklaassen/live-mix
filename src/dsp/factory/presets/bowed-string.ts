import { type FactoryPreset } from '../types'

export const BOWED_STRING_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'ebow-octave-line',
    name: 'Ebow at the octave',
    category: 'string',
    description:
      'A guitar string held by an ebow pressed hard, so each note blooms and tips into its octave.',
    instrument: { deviceId: 'bowed-string', preset: 'Octave feedback', params: { volume: -5 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Space echo', params: { mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.22 } },
    ],
    preview: 'line',
  },
  {
    id: 'solo-cello-cathedral',
    name: 'Cathedral cello',
    category: 'string',
    description:
      'One bowed string with a wooden body and a slow vibrato, for low notes held in a nave.',
    instrument: { deviceId: 'bowed-string', preset: 'Cello drone', params: { volume: -9 } },
    effects: [{ deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } }],
    preview: 'low',
  },
  {
    id: 'glass-bow-harmonics',
    name: 'Glass bow',
    category: 'string',
    description:
      'A light bow that takes seconds to speak, pure as a flute, with a halo two octaves above it.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { brightness: 0.9, pressure: 0.25, detune: 0, volume: -13 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.35 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.4, shimmer: 0.6 } },
    ],
  },
  {
    id: 'volume-swell-guitar',
    name: 'Volume swell guitar',
    category: 'string',
    description:
      'Plucked chords with the pick attack faded out, as with a volume pedal, into echo and plate.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { attack: 1.5, decay: 25, volume: -2 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.4, decay: 0.8 } },
    ],
  },
  {
    id: 'felt-guitar-tremolo',
    name: 'Felt guitar',
    category: 'string',
    description:
      'A soft, dark pluck near the middle of the string, through amp tremolo and a spring.',
    instrument: { deviceId: 'bowed-string', preset: 'Felt guitar', params: { volume: -6 } },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.5, depth: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
    ],
    preview: 'keys',
  },
]
