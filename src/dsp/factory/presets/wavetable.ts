import { type FactoryPreset } from '../types'

export const WAVETABLE_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'glass-ripples',
    name: 'Glass ripples',
    category: 'pad',
    description: 'The glass table moving quickly enough to hear, with tape echoes trailing behind.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: {
        position: 0.65,
        motion: 0.6,
        rate: 0.6,
        sub: 0.15,
        cutoff: 7000,
        attack: 0.25,
        release: 2.5,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Small plate' },
    ],
  },
  {
    id: 'vowel-tide',
    name: 'Vowel tide',
    category: 'pad',
    description: 'The vowel table travelling end to end, so the chord slowly mouths its way round.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { motion: 1, rate: 0.09, spread: 0.6 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { spread: 60, mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, width: 0.8 } },
    ],
  },
  {
    id: 'reed-to-saw-sunrise',
    name: 'Reed sunrise',
    category: 'pad',
    description:
      'Each note travels between a soft reed and a full saw at its own pace, with tape saturation.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: {
        position: 0.5,
        motion: 1,
        rate: 0.12,
        detune: 11,
        sub: 0.3,
        cutoff: 6000,
        attack: 1.8,
        release: 4,
        spread: 0.8,
        volume: -15,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { toneDb: 0, outputDb: -5.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall' },
    ],
  },
  {
    id: 'hollow-undertow',
    name: 'Hollow undertow',
    category: 'pad',
    description:
      'A dark hollow tone with a strong sub and a slow phaser, for the bottom of a piece.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { sub: 0.55, cutoff: 650 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'spectral-mist',
    name: 'Spectral mist',
    category: 'pad',
    description: 'Takes five seconds to arrive, bright and shifting, with an octave halo above it.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Spectral cloud',
      params: { spread: 0.7, volume: -12 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.35, width: 0.7 } }],
  },
]
