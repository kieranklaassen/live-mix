import { type FactoryPreset } from '../types'

export const GRAIN_SYNTH_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'frozen-grain-pad',
    name: 'Frozen moment pad',
    category: 'pad',
    description:
      'One instant of the loaded sound held still as a smooth, dark cloud to play chords on.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: {
        position: 0.15,
        density: 6,
        attack: 0.3,
        release: 2.5,
        spread: 0.4,
        tone: 4000,
        volume: -13,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, width: 0.8 } }],
  },
  {
    id: 'octave-grain-cloud',
    name: 'Octave grain cloud',
    category: 'pad',
    description:
      'A dense cloud that swells in slowly, with most of its grains thrown up or down an octave.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Shimmer',
      params: {
        position: 0.1,
        density: 8,
        octaves: 0.7,
        attack: 2.5,
        release: 6,
        spread: 0.5,
        tone: 14000,
        volume: -13,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'backwards-grain-wash',
    name: 'Backwards wash',
    category: 'texture',
    description:
      'Long reversed grains that creep backwards through the sound and swell into a cathedral.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Backwards wash',
      params: { position: 0.12, scan: -0.08, size: 700, spread: 0.5, volume: -10 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } }],
  },
  {
    id: 'slow-tape-stretch',
    name: 'Slow tape stretch',
    category: 'texture',
    description:
      'The loaded sound played at an eighth of its speed and its own pitch, on a reel that is wearing out.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Slow stretch',
      params: {
        size: 300,
        density: 8,
        spray: 0.05,
        attack: 0.8,
        release: 2,
        spread: 0.2,
        tone: 5000,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { output: -3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'scattered-grains',
    name: 'Scattered grains',
    category: 'texture',
    description:
      'Single short grains picked from around one spot, thrown across octaves and repeated an octave up.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Stutter',
      params: {
        position: 0.2,
        scan: 0.02,
        size: 80,
        density: 1,
        spray: 0.5,
        octaves: 0.5,
        shape: 0.2,
        attack: 0.05,
        release: 1.5,
        spread: 0.7,
        tone: 16000,
        volume: -7.5,
      },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
]
