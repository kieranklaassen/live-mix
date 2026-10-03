import { type FactoryPreset } from '../types'

// The category these want is `wind`. Until the bank has it, the four lines
// sit under `voice` and the pad under `pad`, each with its own preview phrase.
export const FLUTE_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'flute-in-a-hall',
    name: 'Flute in a hall',
    category: 'wind',
    description:
      'A concert flute as it comes, a little breath in the tone, with a long hall behind it.',
    instrument: { deviceId: 'flute', preset: 'Concert flute', params: { volume: -7 } },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } }],
    preview: 'line',
  },
  {
    id: 'temple-shakuhachi',
    name: 'Temple shakuhachi',
    category: 'wind',
    description:
      'A breathy bamboo flute that bends up into each note, alone in a very large stone room.',
    instrument: { deviceId: 'flute', preset: 'Shakuhachi', params: { volume: -11 } },
    effects: [{ deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } }],
    preview: 'line',
  },
  {
    id: 'pan-pipes-on-tape',
    name: 'Pan pipes on tape',
    category: 'wind',
    description: 'Hollow stopped pipes with a puff on every note, repeated by three tape heads.',
    instrument: { deviceId: 'flute', preset: 'Pan pipes', params: { volume: -7 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'line',
  },
  {
    id: 'canyon-flute',
    name: 'Canyon flute',
    category: 'wind',
    description:
      'A round wood flute with a small scoop and a gentle vibrato, far off in open space.',
    instrument: { deviceId: 'flute', preset: 'Canyon flute' },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
    preview: 'line',
  },
  {
    id: 'low-flute-breath-pad',
    name: 'Breath pad',
    category: 'pad',
    description:
      'Low flutes blown so softly they are mostly air, swelling in slowly with an octave halo above.',
    instrument: { deviceId: 'flute', preset: 'Breath pad', params: { volume: -17 } },
    effects: [{ deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.35 } }],
    preview: 'chord',
  },
  {
    id: 'flute-small-room',
    name: 'Flute, small room',
    category: 'wind',
    description:
      'A concert flute played softly and heard close, the breath audible in the tone, in a short tight room.',
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: {
        breath: 0.48,
        blow: 0.28,
        chiff: 0.3,
        attack: 0.06,
        release: 0.5,
        vibrato: 0.3,
        scoop: 10,
        volume: -7.5,
      },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Tight chamber' }],
  },
  {
    id: 'alto-flute-alone',
    name: 'Alto flute alone',
    category: 'wind',
    description:
      'A low flute tongued as a solo line, blown gently, round and airy with a breath vibrato, in a dark plate.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: {
        breath: 0.8,
        blow: 0.4,
        chiff: 0.5,
        attack: 0.05,
        release: 0.6,
        vibrato: 0.45,
        scoop: 20,
        volume: -8.5,
      },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Dark plate', params: { mix: 0.3 } }],
  },
  {
    id: 'flute-choir',
    name: 'Flute choir',
    category: 'pad',
    description:
      'Concert flutes holding a chord with soft starts, each with its own vibrato, thickened by an ensemble chorus in a long hall.',
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: {
        breath: 0.3,
        blow: 0.5,
        chiff: 0.1,
        attack: 0.3,
        release: 1.2,
        scoop: 5,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.45 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { lowDecay: 4, midDecay: 4, mix: 0.4 } },
    ],
  },
  {
    id: 'recorder-consort',
    name: 'Recorder consort',
    category: 'wind',
    description:
      'Wood flutes holding a chord, steady and without vibrato, a small chirp at each start, in a small live chamber.',
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: {
        breath: 0.18,
        blow: 0.55,
        chiff: 0.45,
        attack: 0.07,
        release: 0.3,
        vibrato: 0,
        scoop: 5,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { decay: 1.6, size: 0.7, mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'valley-pan-pipes',
    name: 'Valley pan pipes',
    category: 'wind',
    description:
      'Breathy pan pipes with a deep vibrato and a slow release, in a very large open reverb that answers late.',
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: {
        breath: 0.7,
        blow: 0.4,
        chiff: 0.5,
        attack: 0.09,
        release: 1,
        vibrato: 0.8,
        scoop: 35,
        volume: -9.5,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.4 } }],
  },
  {
    id: 'piccolo-bright-hall',
    name: 'Piccolo, bright hall',
    category: 'wind',
    description:
      'A flute blown hard and tongued, heard an octave above the keys as a piccolo, in a bright hall.',
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: {
        breath: 0.45,
        blow: 0.75,
        chiff: 0.7,
        attack: 0.015,
        release: 0.25,
        vibrato: 0.4,
        scoop: 5,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'High voice alone', params: { spread: 0.15 } },
      { deviceId: 'zita-rev1', preset: 'Bright hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bass-flute-drone',
    name: 'Bass flute drone',
    category: 'drone',
    description:
      'A bass flute held low and blown firmly, drifting in a slow chorus, in a hall with a long low tail.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: {
        breath: 0.4,
        blow: 0.7,
        chiff: 0,
        attack: 0.8,
        release: 5,
        vibrato: 0.2,
        scoop: 0,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { spread: 50, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Warm undertow', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'shellac-flute-solo',
    name: 'Shellac flute solo',
    category: 'wind',
    description:
      'A flute with its vibrato as deep as it goes, played in a room and heard from a 78 with surface noise and no deep bass or top.',
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: {
        breath: 0.3,
        blow: 0.5,
        chiff: 0.4,
        attack: 0.07,
        release: 0.5,
        vibrato: 1,
        scoop: 30,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'zita-rev1', preset: 'Room' },
      { deviceId: 'vinyl', preset: 'Parlour 78' },
    ],
  },
  {
    id: 'bamboo-over-strings',
    name: 'Bamboo over strings',
    category: 'wind',
    description:
      'A bamboo flute blown hard and steady with little breath, over strings tuned to A minor that ring on quietly after each note.',
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: {
        breath: 0.15,
        blow: 0.85,
        chiff: 0.3,
        attack: 0.05,
        release: 1,
        vibrato: 0.2,
        scoop: 20,
        volume: -13.5,
      },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { decay: 6, mix: 0.35, width: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'bamboo-long-tones',
    name: 'Bamboo long tones',
    category: 'pad',
    description:
      'Bamboo flutes held as a chord, mostly air and slow to speak, in a thin bright reverb twelve seconds long.',
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: {
        breath: 0.85,
        blow: 0.3,
        chiff: 0,
        attack: 1.3,
        release: 3,
        vibrato: 0.3,
        scoop: 0,
        volume: -21,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Thin air' }],
  },
  {
    id: 'stopped-pipe-organ',
    name: 'Stopped pipe organ',
    category: 'organ',
    description:
      'Stopped pipes with a small chiff and no vibrato, with quieter ranks an octave below and above them, in a small chamber.',
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: {
        breath: 0.12,
        blow: 0.45,
        chiff: 0.4,
        attack: 0.03,
        release: 0.18,
        scoop: 0,
        volume: -14,
      },
    },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'Organ',
        params: { sub2: 0, sub1: 0.4, up1: 0.35, up2: 0.15 },
      },
      { deviceId: 'zita-rev1', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'low-flute-growl',
    name: 'Low flute growl',
    category: 'wind',
    description:
      'A low flute blown as hard as it goes and tongued, made rough and beating by a low ring modulator and a triode stage, in a dark spring.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: {
        breath: 0.7,
        blow: 1,
        chiff: 0.8,
        attack: 0.02,
        release: 0.35,
        vibrato: 0.5,
        scoop: 40,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Low growl', params: { mix: 0.4 } },
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { output: -5 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring' },
    ],
  },
  {
    id: 'air-across-bamboo',
    name: 'Air across bamboo',
    category: 'texture',
    description:
      'Air blown across a bamboo pipe, the note faint inside it, swept by a slow comb in a bright reverb, with a limiter that holds chords down.',
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: {
        breath: 1,
        blow: 0.05,
        chiff: 0.3,
        attack: 0.5,
        release: 2.5,
        vibrato: 0.5,
        scoop: 0,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep', params: { rate: 0.15 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air' },
      { deviceId: 'limiter-1176', preset: 'Gentle lift', params: { outputGain: -4 } },
    ],
  },
  {
    id: 'flute-in-reverse',
    name: 'Flute in reverse',
    category: 'wind',
    description:
      'Tongued flute notes heard only backwards and a second late: each swells up from its tail to the chiff and stops, in a plate.',
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: {
        blow: 0.8,
        chiff: 1,
        attack: 0.01,
        release: 0.9,
        vibrato: 0.2,
        scoop: 0,
        volume: -6,
      },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards only',
        params: { time: 800, spread: 0.15 },
      },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
    preview: 'bells',
  },
  {
    id: 'pan-pipe-cascade',
    name: 'Pan pipe cascade',
    category: 'wind',
    description:
      'Pan pipes with a hard puff on each note, which comes back as quick loops of itself one and two octaves up, in a hall.',
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: {
        breath: 0.35,
        blow: 0.6,
        chiff: 1,
        attack: 0.006,
        release: 0.12,
        scoop: 0,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Glass rain', params: { mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
]
