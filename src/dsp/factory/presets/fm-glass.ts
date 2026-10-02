import { type FactoryPreset } from '../types'

export const FM_GLASS_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'glass-bell-plate',
    name: 'Glass bell plate',
    category: 'bell',
    description: 'The inharmonic glass bell as it comes, ringing into a long bright plate.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { spread: 0.35, volume: -5 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } }],
  },
  {
    id: 'ice-chime-crystals',
    name: 'Ice chime crystals',
    category: 'bell',
    description: 'Short bright chimes whose echoes come back an octave higher each time.',
    instrument: { deviceId: 'fm-glass', preset: 'Ice chimes', params: { volume: -3 } },
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'temple-bowl-hall',
    name: 'Temple bowl',
    category: 'bell',
    description: 'A slow bowl tone with a soft strike that hangs for a long time in a dark hall.',
    instrument: { deviceId: 'fm-glass', preset: 'Temple bowl', params: { brightness: 0.3 } },
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 12, damping: 0.6, mix: 0.4 },
      },
    ],
  },
  {
    id: 'water-garden-mallets',
    name: 'Water garden mallets',
    category: 'bell',
    description: 'Soft FM mallets with dotted tape echoes, for slow repeating patterns.',
    instrument: { deviceId: 'fm-glass', preset: 'Vibes', params: { volume: -7 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { heads: 3, time: 450, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'crystal-pad-drift',
    name: 'Crystal pad',
    category: 'pad',
    description: 'A held FM pad whose brightness blooms after the note, widened by a slow chorus.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { spread: 0.6, volume: -16 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35, width: 0.7 } },
    ],
    preview: 'chord',
  },
]
