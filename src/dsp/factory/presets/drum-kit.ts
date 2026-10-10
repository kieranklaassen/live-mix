import { type FactoryPreset } from '../types'

export const DRUM_KIT_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'drum-felt-small-room',
    name: 'Felt kit small room',
    category: 'drum',
    description: 'The plain soft kit with a round kick and brushed snare, close in a small room.',
    instrument: { deviceId: 'drum-kit', preset: 'Felt kit' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.12 } }],
    preview: 'drum',
  },
  {
    id: 'drum-dry-close',
    name: 'Dry close kit',
    category: 'drum',
    description:
      'The soft kit dry and near, narrow and the same on every hit, through a clean tape stage.',
    instrument: {
      deviceId: 'drum-kit',
      params: {
        length: 0.85,
        punch: 0.5,
        snap: 0.55,
        tone: 0.65,
        variation: 0.05,
        width: 0.15,
        volume: -4,
      },
    },
    effects: [{ deviceId: 'tape', preset: 'Mastering deck', params: { hiss: 0 } }],
    preview: 'drum',
  },
  {
    id: 'drum-deep-slow',
    name: 'Deep slow kit',
    category: 'drum',
    description:
      'Low long drums with a slow kick and a soft snare, over a dark plate that keeps the lows.',
    instrument: { deviceId: 'drum-kit', preset: 'Deep and slow' },
    effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } }],
    preview: 'drum',
  },
  {
    id: 'drum-tight-small',
    name: 'Tight small kit',
    category: 'drum',
    description: 'Short high drums with a clicking kick and a quick snare, in a box of a room.',
    instrument: { deviceId: 'drum-kit', preset: 'Small and tight', params: { volume: -2 } },
    effects: [{ deviceId: 'expanse', preset: 'Small box', params: { mix: 0.2 } }],
    preview: 'drum',
  },
  {
    id: 'drum-soft-hall',
    name: 'Soft kit in a hall',
    category: 'drum',
    description: 'The soft kit played wide with a concert hall opening behind every hit.',
    instrument: { deviceId: 'drum-kit', params: { length: 1.2, width: 0.7, volume: -4 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
    preview: 'drum',
  },
  {
    id: 'drum-brushed-plate',
    name: 'Brushes on a plate',
    category: 'drum',
    description: 'Dull brushed drums with no click, tuned up a little, on a long bright plate.',
    instrument: { deviceId: 'drum-kit', preset: 'Brushed' },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
    preview: 'drum',
  },
  {
    id: 'drum-far-away',
    name: 'Kit far away',
    category: 'drum',
    description: 'Low dull drums heard from the far end of a big dark room, more room than drum.',
    instrument: { deviceId: 'drum-kit', preset: 'Low and far' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.6 } }],
    preview: 'drum',
  },
  {
    id: 'drum-blurred',
    name: 'Blurred kit',
    category: 'drum',
    description:
      'Low paper drums with every hit left hanging as a mist of its own spectrum behind it.',
    instrument: { deviceId: 'drum-kit', preset: 'Paper thuds', params: { volume: -7.5 } },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.6, mix: 0.4 } },
    ],
    preview: 'drum',
  },
  {
    id: 'drum-dotted-tape-echo',
    name: 'Dotted tape echo kit',
    category: 'drum',
    description:
      'The soft kit into a tape echo a dotted eighth long at 120, the repeats dull and wobbling.',
    instrument: {
      deviceId: 'drum-kit',
      params: { length: 0.8, snap: 0.4, volume: -1 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Warm repeats',
        params: { time: 375, feedback: 0.45, mix: 0.3 },
      },
    ],
    preview: 'drum',
  },
  {
    id: 'drum-eighth-dark-echo',
    name: 'Eighth note dark echo',
    category: 'drum',
    description:
      'Paper drums through a dark bucket brigade echo an eighth note long at 120, in a small room.',
    instrument: { deviceId: 'drum-kit', preset: 'Paper kit', params: { volume: -1 } },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 250, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.1 } },
    ],
    preview: 'drum',
  },
  {
    id: 'drum-ticks-beat-echo',
    name: 'Ticks on a beat echo',
    category: 'drum',
    description: 'Bright short ticks thrown from side to side by an echo one beat long at 120.',
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Bright ticks',
      params: { length: 0.7, drive: 0.3, volume: -1 },
    },
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Side to side',
        params: { time: 500, feedback: 0.5, mix: 0.45 },
      },
    ],
    preview: 'drum',
  },
  {
    id: 'drum-worn-cassette',
    name: 'Worn cassette kit',
    category: 'drum',
    description: 'A dull driven paper kit on a worn cassette, wavering in pitch under its hiss.',
    instrument: { deviceId: 'drum-kit', preset: 'Dusty', params: { volume: -5 } },
    effects: [{ deviceId: 'tape', preset: 'Cassette four-track', params: { age: 0.6 } }],
    preview: 'drum',
  },
  {
    id: 'drum-under-filter',
    name: 'Kit under a filter',
    category: 'drum',
    description:
      'The deep kit behind a low pass filter that opens and closes once every two bars, in a room.',
    instrument: {
      deviceId: 'drum-kit',
      params: { kit: 1, snap: 0.5, tone: 0.6, volume: -4.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 900,
          resonance: 2,
          driveDb: 3,
          lfoAmount: 60,
          lfoRateHz: 0.25,
        },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
    preview: 'drum',
  },
  {
    id: 'drum-low-bit',
    name: 'Low bit kit',
    category: 'drum',
    description:
      'A tight kit tuned down through eight bits at a low sample rate, grainy with folded highs.',
    instrument: {
      deviceId: 'drum-kit',
      params: { kit: 2, tune: -3, length: 1.1, snap: 0.5, tone: 0.55, volume: -1 },
    },
    effects: [{ deviceId: 'vintage-digital', preset: 'Toy' }],
    preview: 'drum',
  },
  {
    id: 'drum-pushed-tube',
    name: 'Pushed tube kit',
    category: 'drum',
    description:
      'The kit driven hard inside and again through a tube stage, thick and flat, in a tight room.',
    instrument: { deviceId: 'drum-kit', preset: 'Pushed hard' },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { outputDb: -8 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
    preview: 'drum',
  },
  {
    id: 'drum-toy-spring',
    name: 'Toy kit on a spring',
    category: 'drum',
    description:
      'Small high paper drums into a slack spring tank that drips and chirps after every hit.',
    instrument: { deviceId: 'drum-kit', preset: 'Toy box', params: { volume: 0 } },
    effects: [{ deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.4 } }],
    preview: 'drum',
  },
  {
    id: 'drum-ringing-strings',
    name: 'Toms ringing strings',
    category: 'drum',
    description: 'Long toms and a punchy kick that set a bank of strings tuned to A minor ringing.',
    instrument: { deviceId: 'drum-kit', preset: 'Long toms' },
    effects: [{ deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.4 } }],
    preview: 'drum',
  },
  {
    id: 'drum-shimmer-above',
    name: 'Shimmer above the kit',
    category: 'drum',
    description: 'Bright long drums under a reverb whose tail climbs an octave at every pass.',
    instrument: { deviceId: 'drum-kit', preset: 'Airy and long' },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.3 } }],
    preview: 'drum',
  },
  {
    id: 'drum-grain-cloud',
    name: 'Kit in a grain cloud',
    category: 'drum',
    description:
      'Each hit of the soft kit scattered into a cloud of short grains, some of them backwards.',
    instrument: { deviceId: 'drum-kit', params: { variation: 0.4, volume: -1 } },
    effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.4 } }],
    preview: 'drum',
  },
  {
    id: 'drum-octave-down',
    name: 'Kit an octave down',
    category: 'drum',
    description: 'Every drum tuned down an octave and left long, heavy and slow, in a dark hall.',
    instrument: { deviceId: 'drum-kit', preset: 'Heavy steps', params: { volume: -10.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.2 } }],
    preview: 'drum',
  },
]
