import { type FactoryPreset } from '../types'

export const MALLETS_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'yarn-marimba',
    name: 'Yarn marimba',
    category: 'bell',
    description:
      'Rosewood bars under soft yarn mallets, each low tone blooming out of its tube, in a room.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { width: 0.7, volume: -3.5 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } }],
    preview: 'bells',
  },
  {
    id: 'rolled-marimba-pad',
    name: 'Rolled marimba pad',
    category: 'bell',
    description:
      'Held marimba chords rolled with soft mallets until they hum like a pad, on tape, in a hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { volume: -15.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-motor-vibes',
    name: 'Slow motor vibes',
    category: 'bell',
    description:
      'Vibraphone bars ringing with the motor turning, the low tone throbbing under still overtones.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { motorRate: 3.5, volume: -6 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } }],
    preview: 'bells',
  },
  {
    id: 'rolled-vibes-haze',
    name: 'Rolled vibes haze',
    category: 'bell',
    description:
      'Vibraphone chords rolled very softly under a slow motor and left to hang in a wide open space.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { volume: -15.5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } }],
    preview: 'chord',
  },
  {
    id: 'celesta-small-plate',
    name: 'Celesta on a plate',
    category: 'bell',
    description:
      'Felt hammers on steel plates over a wooden box, small and clear, on a short plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { volume: -6 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } }],
    preview: 'bells',
  },
]
