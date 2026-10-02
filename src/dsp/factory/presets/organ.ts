import { type FactoryPreset } from '../types'

export const ORGAN_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'parlour-pump-organ',
    name: 'Parlour pump organ',
    category: 'organ',
    description: 'A reedy pump organ with an uneven bellows, close up in a small room on old tape.',
    instrument: { deviceId: 'organ', preset: 'Pump organ', params: { celeste: 0.5, volume: -10 } },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.25, output: -3.5 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.35 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'chapel-flutes-nave',
    name: 'Chapel flutes',
    category: 'organ',
    description: 'Stopped flutes with no reed at all, speaking quickly into a long stone nave.',
    instrument: { deviceId: 'organ', preset: 'Chapel flutes', params: { volume: -14 } },
    effects: [{ deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } }],
  },
  {
    id: 'slow-rotary-organ',
    name: 'Slow rotary organ',
    category: 'organ',
    description:
      'A fuller registration through a rotating speaker on its slow setting and a plate.',
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { sub: 0.4, reed: 0.4, twelfth: 0.3, fifteenth: 0.45, release: 0.5, volume: -12 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'dattorro', preset: 'Small plate', params: { decay: 0.7 } },
    ],
  },
  {
    id: 'distant-pipes-swell',
    name: 'Distant pipes',
    category: 'organ',
    description: 'Pipes heard from the far end of the building: three seconds to speak, all tail.',
    instrument: { deviceId: 'organ', preset: 'Distant pipes', params: { volume: -12 } },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45 } }],
  },
  {
    id: 'celeste-reed-drone',
    name: 'Celeste reed drone',
    category: 'drone',
    description:
      'Two low ranks tuned slightly apart so they beat, with upper octaves blooming behind.',
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { sub: 0.35, octave: 0.4, reed: 0.3, celeste: 1, tone: 2600, volume: -14 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm Glue' },
      { deviceId: 'shimmer', preset: 'Organ loft', params: { mix: 0.3 } },
    ],
  },
]
