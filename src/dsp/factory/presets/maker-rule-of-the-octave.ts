import { type FactoryPreset } from '../types'

// Presets with the note maker Rule of the Octave in front of them: a bass is
// played, and the voices over it follow.
export const RULE_OF_THE_OCTAVE_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'rule-of-the-octave-loft',
    name: 'Loft with one hand',
    category: 'organ',
    description:
      'Stopped flutes that put three voices over any bass: shared notes stay down, and the sixth step falling has its sharp.',
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'With its sharps',
      params: { level: 0.7, sustain: 0.3 },
    },
    instrument: { deviceId: 'organ', preset: 'Chapel flutes', params: { sub: 0.2, volume: -11 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } }],
    preview: 'bass',
  },
  {
    id: 'rule-of-the-octave-quartet',
    name: 'Bass and open strings',
    category: 'string',
    description:
      'A soft upright bass with three muted string parts over it, about a sixth apart, that move by step and hold what they share.',
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Open strings',
      params: { level: 0.8 },
      parts: {
        upper: {
          deviceId: 'chamber-strings',
          preset: 'Chamber section',
          params: { attack: 0.25, release: 0.9, mute: 0.6, volume: -7 },
        },
      },
    },
    instrument: { deviceId: 'string-bass', preset: 'Round upright', params: { volume: -6 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
    preview: 'bass',
  },
  {
    id: 'rule-of-the-octave-late-choir',
    name: 'Late choir over piano',
    category: 'keys',
    description:
      'A felt piano in the bass and a choir that comes half a second after it, so the chord before hangs over each new note.',
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Late hand',
      params: { rule: 0, delay: 0.5, spacing: 1, height: 4, sustain: 0.8, level: 0.7 },
      parts: {
        upper: {
          deviceId: 'choir',
          preset: 'Airport ah',
          params: { attack: 0.2, release: 1, volume: -8 },
        },
      },
    },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { resonance: 0, reverbMix: 0, polyphony: 8, outputDb: -15 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
    preview: 'bass',
  },
  {
    id: 'rule-of-the-octave-harp',
    name: 'Harp on every step',
    category: 'plucked',
    description:
      'One low string played, and four sevenths rolled up over it across two octaves, every one of them struck anew.',
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Long harp roll',
      params: { strum: 0.6, sustain: 3, level: 0.6 },
    },
    instrument: { deviceId: 'harp', preset: 'Concert harp', params: { volume: -4 } },
    effects: [{ deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.25 } }],
    preview: 'bass',
  },
]
