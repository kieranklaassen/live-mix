import { type FactoryPreset } from '../types'

export const GUITAR_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'glass-neck-guitar',
    name: 'Glass neck guitar',
    category: 'plucked',
    description:
      'A clean neck pickup through a slow chorus and a short tape echo: single notes that ring and widen.',
    instrument: { deviceId: 'guitar', preset: 'Glass neck', params: { volume: 0 } },
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.5, mix: 0.35 } },
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
  {
    id: 'guitar-pedal-swells',
    name: 'Pedal swells',
    category: 'plucked',
    description:
      'Every note faded in as with a volume pedal, so no pick is heard, and left in a hall.',
    instrument: { deviceId: 'guitar', preset: 'Volume swell' },
    effects: [{ deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.45, decay: 6 } }],
    preview: 'chord',
  },
  {
    id: 'slow-strum-bloom',
    name: 'Slow strum bloom',
    category: 'plucked',
    description:
      'An open chord dragged slowly across the strings into a reverb that opens after it.',
    instrument: { deviceId: 'guitar', preset: 'Slow strum' },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Bloom', params: { mix: 0.4 } }],
    preview: 'chord',
  },
  {
    id: 'baritone-twang',
    name: 'Baritone twang',
    category: 'plucked',
    description:
      'Low strings picked hard by the bridge, with amp tremolo and a dark spring: slow and wide open.',
    instrument: { deviceId: 'guitar', preset: 'Dark baritone' },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 5, depth: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.35, tone: 2600 } },
    ],
    preview: 'low',
  },
  {
    id: 'muted-echo-pattern',
    name: 'Muted echo pattern',
    category: 'plucked',
    description:
      'Short muted notes from the bridge pickup into a three-head echo: play a pattern and it answers.',
    instrument: { deviceId: 'guitar', preset: 'Muted pattern' },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 375, mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.15 } },
    ],
    preview: 'keys',
  },
  {
    id: 'thumbed-neck-pickup',
    name: 'Thumbed neck pickup',
    category: 'plucked',
    description:
      'The flesh of a thumb over the neck pickup with the tone rolled down: round, dark and close in a small room.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: {
        pickup: 1,
        position: 0.3,
        hardness: 0.05,
        sustain: 5,
        tone: 1900,
        strum: 25,
        shimmer: 0.1,
        warmth: 0.4,
        volume: 0.5,
      },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.18 } }],
  },
  {
    id: 'bridge-pickup-plate',
    name: 'Bridge pickup, plate',
    category: 'plucked',
    description:
      'A stiff pick by the bridge pickup with the tone wide open: thin, bright and clean on a small plate.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: {
        pickup: 0.05,
        position: 0.1,
        hardness: 0.8,
        sustain: 8,
        tone: 5500,
        strum: 8,
        shimmer: 0.2,
        warmth: 0.15,
        volume: -2,
      },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Small plate' }],
  },
  {
    id: 'twelve-string-room',
    name: 'Twelve string room',
    category: 'plucked',
    description:
      'An electric twelve string strummed as it is, its pairs beating as they ring, in a short bright chamber.',
    instrument: { deviceId: 'guitar', preset: 'Twelve string', params: { volume: -3.5 } },
    effects: [{ deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.22 } }],
    preview: 'chord',
  },
  {
    id: 'middle-pickup-hall',
    name: 'Middle pickup hall',
    category: 'plucked',
    description:
      'A pickup set halfway between bridge and neck, picked cleanly with the amplifier barely warm, in a medium hall.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: {
        pickup: 0.5,
        position: 0.13,
        hardness: 0.6,
        sustain: 11,
        tone: 4400,
        strum: 14,
        shimmer: 0.25,
        warmth: 0.1,
        volume: -3,
      },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } }],
  },
  {
    id: 'slapback-and-drip',
    name: 'Slapback and drip',
    category: 'plucked',
    description:
      'Wiry notes picked hard at the bridge, one quick slap of echo behind each, splashing in a slack spring tank.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: {
        pickup: 0.12,
        position: 0.07,
        hardness: 0.9,
        sustain: 6,
        tone: 4600,
        strum: 12,
        shimmer: 0.15,
        warmth: 0.45,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback' },
      {
        deviceId: 'spring-reverb',
        preset: 'Surf drip',
        params: { mix: 0.45, decay: 2.8, width: 0.2 },
      },
    ],
  },
  {
    id: 'small-amp-breakup',
    name: 'Small amp breakup',
    category: 'plucked',
    description:
      'Strings hit hard with the amplifier full up, into a combo speaker pushed further, a touch of spring behind: thick, just breaking up.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: {
        pickup: 0.3,
        position: 0.11,
        hardness: 0.9,
        sustain: 14,
        tone: 3200,
        strum: 22,
        shimmer: 0.25,
        warmth: 1,
        volume: -4,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { drive: 0.8, room: 0.1, output: -4.5 },
      },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.2, width: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'octave-chime-guitar',
    name: 'Octave chime guitar',
    category: 'bell',
    description:
      'Soft notes picked far over the neck with an octave added above, like harmonics, left hanging in a large open space.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: {
        pickup: 1,
        position: 0.35,
        hardness: 0.2,
        sustain: 30,
        tone: 5500,
        strum: 0,
        shimmer: 0.6,
        warmth: 0.05,
        volume: -0.5,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave', params: { up1: 0.45 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 7, highCut: 12000 } },
    ],
  },
  {
    id: 'jet-sweep-strum',
    name: 'Jet sweep strum',
    category: 'plucked',
    description:
      'A strummed chord held up by a limiter for as long as the keys are down, a flanger combing slowly up and down it, on a plate.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow strum',
      params: {
        pickup: 0.55,
        position: 0.15,
        hardness: 0.6,
        sustain: 30,
        tone: 4200,
        strum: 40,
        shimmer: 0.5,
        warmth: 0.25,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'limiter-1176', preset: 'Squash', params: { outputGain: -5 } },
      { deviceId: 'flanger', preset: 'Classic jet', params: { rate: 0.2 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'rubber-bridge-thump',
    name: 'Rubber bridge thump',
    category: 'plucked',
    description:
      'Dull thumbed notes that die in a second, as if the bridge were rubber, thickened on cassette in a small room.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark baritone',
      params: {
        pickup: 0.9,
        position: 0.22,
        hardness: 0.15,
        sustain: 1.6,
        tone: 1700,
        strum: 0,
        shimmer: 0,
        warmth: 0.6,
        volume: 4,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'twelve-string-swell',
    name: 'Twelve string swell',
    category: 'pad',
    description:
      'A chord swelled in over about a second with no pick heard, each string paired with its octave, levelled and far off in a hall.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: {
        pickup: 0.3,
        position: 0.1,
        hardness: 0.8,
        sustain: 30,
        tone: 5000,
        swell: 2,
        strum: 30,
        shimmer: 1.4,
        warmth: 0.2,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string' },
      { deviceId: 'limiter-1176', preset: 'Drive', params: { outputGain: -3.5 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 5, damping: 0.1, breathDepth: 0, mix: 0.6 },
      },
    ],
  },
  {
    id: 'chopped-guitar-chord',
    name: 'Chopped guitar chord',
    category: 'plucked',
    description:
      'A driven chord flattened by a limiter so it holds, cut into even pulses by a square tremolo, with a tape echo.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow strum',
      params: {
        pickup: 0.3,
        position: 0.1,
        hardness: 0.75,
        sustain: 30,
        tone: 3600,
        strum: 10,
        warmth: 0.85,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'limiter-1176', preset: 'Squash', params: { outputGain: -8 } },
      { deviceId: 'tremolo', preset: 'Chopper', params: { rate: 6, depth: 0.9 } },
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { spread: 0.3, mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'sympathetic-wire',
    name: 'Sympathetic wire',
    category: 'plucked',
    description:
      'Hard wiry plucks right at the bridge that set a bank of strings tuned to A minor ringing behind them.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Muted pattern',
      params: {
        pickup: 0.3,
        position: 0.05,
        hardness: 1,
        sustain: 3,
        tone: 5500,
        shimmer: 0,
        warmth: 0.35,
        volume: -2.5,
      },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { sympathy: 0.8, decay: 6, mix: 0.6, width: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'thumbed-sub-octave',
    name: 'Thumbed sub octave',
    category: 'plucked',
    description:
      'Low strings thumbed softly over the neck with every note doubled an octave below: a round bass guitar.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark baritone',
      params: {
        pickup: 0.95,
        position: 0.26,
        hardness: 0.1,
        sustain: 7,
        tone: 1500,
        strum: 0,
        shimmer: 0.1,
        warmth: 0.5,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.15 } },
    ],
    preview: 'low',
  },
  {
    id: 'muted-note-cascade',
    name: 'Muted note cascade',
    category: 'plucked',
    description:
      'Short muted notes that come back as loops of themselves an octave above and an octave below, on a plate.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Muted pattern',
      params: {
        pickup: 0.7,
        position: 0.16,
        hardness: 0.45,
        sustain: 2.5,
        tone: 4400,
        volume: 5,
      },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { makeup: 2 } },
      {
        deviceId: 'cascade',
        preset: 'Octave stack',
        params: { time: 375, repeats: 10, decay: 0.2, high: 0.7, low: 0.8, mix: 0.7 },
      },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'shellac-guitar',
    name: 'Shellac guitar',
    category: 'plucked',
    description:
      'A warm guitar in a small booth, played back from a shellac record: a narrow band, nearly mono, crackling.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow strum',
      params: {
        pickup: 0.75,
        position: 0.16,
        hardness: 0.5,
        sustain: 4,
        tone: 2600,
        strum: 35,
        shimmer: 0,
        warmth: 0.75,
        volume: -1.5,
      },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Small booth' },
      { deviceId: 'vinyl', preset: 'Parlour 78' },
    ],
  },
]
