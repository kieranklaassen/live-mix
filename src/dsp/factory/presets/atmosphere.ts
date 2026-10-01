import { type FactoryPreset } from '../types'

export const ATMOSPHERE_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'whistling-wind',
    name: 'Whistling wind',
    category: 'texture',
    description:
      'Gusts through a narrow gap that whistle on the note you hold, heard across a valley.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Whistling gap',
      params: { tone: 0.75, resonance: 0.7, width: 0.7, volume: -2 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.3 } }],
  },
  {
    id: 'rain-on-glass',
    name: 'Rain on glass',
    category: 'texture',
    description:
      'Separate drops on a window pane over a soft hiss, close by, as heard from inside a room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: { density: 0.55, tone: 0.45, width: 0.65, volume: 0 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Studio master', params: { drive: 0.9, hiss: 0, output: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Room' },
    ],
  },
  {
    id: 'slow-shore',
    name: 'Slow shore',
    category: 'texture',
    description:
      'Waves that build, break into foam and run back, one every eight seconds, with the rumble cut.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Slow shore',
      params: { density: 0.5, tone: 0.65, attack: 2, width: 0.8, volume: -3 },
    },
    effects: [{ deviceId: 'auto-filter', preset: 'Rumble Cut', params: { cutoffHz: 90 } }],
  },
  {
    id: 'record-surface',
    name: 'Record surface',
    category: 'texture',
    description: 'The hiss, clicks and turning rumble of an old record with nothing cut into it.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Old record',
      params: { density: 0.45, tone: 0.75, size: 0.1, release: 1.5, width: 0.4, volume: 0 },
    },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { drive: 0.8, wow: 0.4, hiss: 0.4, bump: 0.2, output: 3 },
      },
    ],
  },
  {
    id: 'amp-hum',
    name: 'Amp hum',
    category: 'texture',
    description:
      'An unsteady mains hum tuned to the keys you hold, through a valve stage and a spring tank.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: { density: 0.85, movement: 0.6, tone: 0.7, width: 1, volume: -13 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube Preamp' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
]
