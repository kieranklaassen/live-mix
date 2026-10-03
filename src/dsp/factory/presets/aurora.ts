import { type FactoryPreset } from '../types'

export const AURORA_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'aurora-slow-brass-hall',
    name: 'Slow brass in a hall',
    category: 'pad',
    description:
      'Brass that starts dark, opens past its tone and keeps swelling while held, with a slow chorus and a hall.',
    instrument: { deviceId: 'aurora', preset: 'Slow brass' },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { spread: 60, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'aurora-wide-strings',
    name: 'Wide string layers',
    category: 'pad',
    description:
      'Two bright string layers beating against each other, thickened by an ensemble chorus in a long hall.',
    instrument: { deviceId: 'aurora', preset: 'Wide strings', params: { volume: -6 } },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'aurora-distant-horns',
    name: 'Distant soft horns',
    category: 'pad',
    description:
      'Muted horns that take their time to speak, worn by tape and set far back in a very large room.',
    instrument: { deviceId: 'aurora', preset: 'Soft horns', params: { volume: -14 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, width: 0.8 } },
    ],
    preview: 'chord',
  },
  {
    id: 'aurora-night-choir',
    name: 'Night choir halo',
    category: 'pad',
    description: 'A narrow, resonant band that sounds almost sung, with a halo an octave above it.',
    instrument: { deviceId: 'aurora', preset: 'Night choir', params: { volume: -12 } },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.35 } }],
    preview: 'chord',
  },
  {
    id: 'aurora-metal-dawn',
    name: 'Metal dawn echoes',
    category: 'pad',
    description:
      'Each note opens with a falling metallic ring that melts into the pad, repeated by tape and a long plate.',
    instrument: { deviceId: 'aurora', preset: 'Metal dawn', params: { volume: -11.5 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
]
