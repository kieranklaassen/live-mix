import { type FactoryPreset } from '../types'

// Felt is about 15 dB hotter than the other instruments, so every preset
// turns its output down. It is also the most expensive one: the string
// resonance, its own room and a held pedal each add to the cost, so a preset
// keeps what matters to it, leaves the space to a cheaper reverb after it and
// caps the voices.
export const FELT_PIANO_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'close-felt-piano',
    name: 'Close felt piano',
    category: 'keys',
    description:
      'A felted upright heard from inside the lid: hammers, keys and pedal noise, hardly any room.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: {
        thump: 0.7,
        action: 0.6,
        pedalNoise: 0.6,
        reverbMix: 0,
        width: 0.8,
        polyphony: 16,
        outputDb: -12,
      },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'slowed-tape-piano',
    name: 'Slowed tape piano',
    category: 'keys',
    description:
      'A soft-pedalled piano that rings on and wavers like a slowed reel, left in a very long hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.85,
        hardness: 0.2,
        detune: 0.75,
        soft: 1,
        sustain: 1,
        pedalNoise: 0,
        resonance: 0,
        reverbMix: 0,
        polyphony: 8,
        outputDb: -11,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.6, hiss: 0.15 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 14, highCut: 4500, mix: 0.45, width: 0.7 },
      },
    ],
  },
  {
    id: 'piano-tape-loop',
    name: 'Piano tape loop',
    category: 'keys',
    description:
      'Each phrase is caught on a four second loop of tape that wears away as it repeats.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { resonance: 0, reverbMix: 0, polyphony: 16, outputDb: -12 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Worn out',
        params: { length: 4, feedback: 0.75, wow: 0.5, mix: 0.45 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bowed-piano',
    name: 'Bowed piano',
    category: 'keys',
    description:
      'The hammer is taken off every note and the pedal held, so chords fade in like bowed strings.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        sustain: 1,
        thump: 0,
        action: 0,
        pedalNoise: 0,
        resonance: 0,
        reverbMix: 0,
        polyphony: 8,
        outputDb: -8,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 7, mix: 0.5 } },
    ],
  },
  {
    id: 'bare-piano-hall',
    name: 'Bare piano hall',
    category: 'keys',
    description: 'The piano with its felt lifted, brighter and wider, on the stage of a hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { hardness: 0.7, reverbMix: 0, width: 0.7, polyphony: 16, outputDb: -12 },
    },
    effects: [
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 3.5, lowDecay: 4, mix: 0.4 } },
    ],
  },
]
