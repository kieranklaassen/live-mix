import { type FactoryPreset } from '../types'

export const MODAL_BELLS_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'rubbed-bowls',
    name: 'Rubbed bowls',
    category: 'bell',
    description: 'Bronze bowls rubbed until they sing and left to ring into each other in a hall.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { decay: 7, release: 0.3, volume: -5 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } }],
    preview: 'line',
  },
  {
    id: 'kalimba-backwards-echo',
    name: 'Kalimba backwards echo',
    category: 'bell',
    description: 'A dry thumb piano whose notes come back reversed, in a small wooden room.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { hardness: 0.8, brightness: 0.65, volume: -3 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards echo' },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'motor-vibraphone',
    name: 'Motor vibraphone',
    category: 'bell',
    description: 'Vibraphone bars with the pedal down and the motor turning slowly, on a plate.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { release: 0.3, volume: -4 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.2, depth: 0.45, phase: 90 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'worn-music-box',
    name: 'Worn music box',
    category: 'bell',
    description: 'A small music box comb recorded on cassette, a little unsteady, in a bedroom.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { spread: 0.4, volume: -4 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'distant-gong',
    name: 'Distant gong',
    category: 'bell',
    description: 'A large gong struck once, its tail sinking and darkening across a wide space.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { damping: 0.3, hardness: 0.75, brightness: 0.8, spread: 0.6, volume: -7 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.4, width: 0.4 } }],
    preview: 'low',
  },
]
