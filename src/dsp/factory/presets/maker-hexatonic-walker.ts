import { type FactoryPreset } from '../types'

// The walk in front of four instruments. A chord is a second or so, so a
// preview hears the walk go somewhere; a held chord walks for as long as it
// is held, and the chord time may be far longer.
export const HEXATONIC_WALKER_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'hexatonic-walker-strings',
    name: 'Six chords, melting',
    category: 'string',
    description:
      'A held chord walks through six, one string voice at a time, over a plucked upright on each root.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Hexatonic melt',
      params: { time: 1.4, step: 0.15, bass: 1 },
      parts: {
        bass: { deviceId: 'string-bass', preset: 'Long wooden ring', params: { volume: -11 } },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { attack: 0.35, release: 1.6, volume: -5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'hexatonic-walker-piano',
    name: 'Four chords on felt',
    category: 'keys',
    description:
      'A felt piano rocks round four chords, out to the other mode and its relative and home, over one low root.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Four chord loop',
      params: { time: 1.2, step: 0.3 },
    },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { resonance: 0, reverbMix: 0, polyphony: 12, outputDb: -14 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'hexatonic-walker-pad',
    name: 'One root, many skies',
    category: 'pad',
    description:
      'Chords that all share one note, which is held low under a warm pad, and a flute on the note that moved.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'One root, six skies',
      params: { time: 1.6, step: 0.3, top: 1 },
      parts: {
        bass: {
          deviceId: 'sub-bass',
          preset: 'Slow swell',
          params: { attack: 0.3, release: 2, volume: -22 },
        },
        top: { deviceId: 'flute', preset: 'Soft wind lead', params: { volume: -15 } },
      },
    },
    instrument: { deviceId: 'ember', preset: 'Warm pad', params: { cutoff: 900, volume: -6 } },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'hexatonic-walker-harp',
    name: 'Thirds on the harp',
    category: 'plucked',
    description:
      'A broken chord on a harp walks by thirds without leaving the key, with a bell on the note that stays.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'White key wander',
      params: { rhythm: 2, time: 1.25, step: 0.25 },
      parts: { top: { deviceId: 'modal-bells', preset: 'Distant bell' } },
    },
    instrument: { deviceId: 'harp', preset: 'Concert harp', params: { volume: -4 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
]
