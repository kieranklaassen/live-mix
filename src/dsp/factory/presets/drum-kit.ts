import { type FactoryPreset } from '../types'

export const DRUM_KIT_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'drum-kit-felt-kit-room',
    name: 'Felt kit room',
    category: 'drum',
    description:
      'A soft synthesized kit with a round kick and brushed snare, close in a small dry room.',
    instrument: { deviceId: 'drum-kit', params: {} },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.12 } }],
    preview: 'drum',
  },
]
