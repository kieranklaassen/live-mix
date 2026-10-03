import { type FactoryPreset } from '../types'

// Written for whatever gets loaded: a voice, a field recording, a piano note.
// The previews play the sampler's built-in soft tone.
export const SAMPLER_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'low-tape-pad',
    name: 'Low tape pad',
    category: 'pad',
    description:
      'The loaded sound an octave down on a slow unsteady loop, thickened and set in a hall.',
    instrument: { deviceId: 'sampler', preset: 'Tape choir', params: { volume: -11 } },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'worn-tape-keys',
    name: 'Worn tape keys',
    category: 'keys',
    description: 'One recording played across the keys from a tired tape, dull and wavering.',
    instrument: { deviceId: 'sampler', preset: 'Worn tape', params: { volume: -15 } },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.35 } },
      {
        deviceId: 'spring-reverb',
        preset: 'Long three spring',
        params: { mix: 0.25, width: 0.75 },
      },
    ],
  },
  {
    id: 'sample-and-echoes',
    name: 'Sample and echoes',
    category: 'keys',
    description: 'The recording played once per key, start to end, with tape echoes and a plate.',
    instrument: { deviceId: 'sampler', preset: 'One shot', params: { release: 0.8 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { spread: 1, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'backwards-swell',
    name: 'Backwards swell',
    category: 'texture',
    description:
      'The recording played backwards so it swells into each note, with a halo above it.',
    instrument: { deviceId: 'sampler', preset: 'Backwards', params: { volume: -11 } },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.35 } }],
  },
  {
    id: 'drifting-sample-loop',
    name: 'Drifting loop',
    category: 'texture',
    description:
      'A short stretch of the recording run back and forth and smeared into a slow wash.',
    instrument: { deviceId: 'sampler', preset: 'There and back', params: { tune: 0, volume: -14 } },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { width: 0.5, mix: 0.6 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, width: 0.7 } },
    ],
  },
]
