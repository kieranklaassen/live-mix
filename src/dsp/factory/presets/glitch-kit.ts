import { type FactoryPreset } from '../types'

export const GLITCH_KIT_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'glitch-kit-clean-clicks-room',
    name: 'Clean clicks room',
    category: 'drum',
    description:
      'Small clean clicks, pops and pips played as percussion, close in a small dry room.',
    instrument: { deviceId: 'glitch-kit', params: {} },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.12 } }],
    preview: 'drum',
  },
]
