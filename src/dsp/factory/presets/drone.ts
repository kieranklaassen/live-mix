import { type FactoryPreset } from '../types'

export const DRONE_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'tanpura-strings',
    name: 'Tanpura and strings',
    category: 'drone',
    description:
      'The buzzing harmonic series of a tanpura, with a bank of sympathetic strings ringing behind it.',
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: { wave: 1, cutoff: 7000, movement: 0.8, rate: 0.25, width: 0.75, volume: -11.5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Sitar drone', params: { mix: 0.5, width: 0.7 } },
      { deviceId: 'zita-rev1', preset: 'Room' },
    ],
  },
  {
    id: 'sub-octave-floor',
    name: 'Sub octave floor',
    category: 'drone',
    description:
      'Stacked octaves over a heavy sub, kept dark and pushed into tape: a floor to build on.',
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: { partials: 0.6, wave: 0.6, sub: 0.6, cutoff: 800, volume: -8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Hot glue', params: { output: -4.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'major-light-drone',
    name: 'Major light',
    category: 'drone',
    description: 'A just major chord of soft tones with air around it, rising into an octave halo.',
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: { partials: 1, wave: 0.25, air: 0.45, cutoff: 8000, attack: 3.5, volume: -9 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.4, shimmer: 0.6 } }],
    preview: 'hold',
  },
  {
    id: 'fog-cluster-drone',
    name: 'Fog cluster',
    category: 'drone',
    description: 'Eight sines a tone or less apart, never still, smeared into a slow grey cloud.',
    instrument: {
      deviceId: 'drone',
      preset: 'Fog cluster',
      params: { attack: 8, width: 0.6, volume: -10 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.7 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, width: 0.7 } },
    ],
    preview: 'hold',
  },
  {
    id: 'latched-pedal-tone',
    name: 'Latched pedal tone',
    category: 'drone',
    description:
      'One thick, slowly beating unison that stays on when the key is let go; press it again to stop.',
    instrument: {
      deviceId: 'drone',
      preset: 'Latched unison',
      params: { wave: 0.9, sub: 0.1, cutoff: 3000, volume: -9 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
]
