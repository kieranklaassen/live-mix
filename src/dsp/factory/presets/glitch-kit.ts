import { type FactoryPreset } from '../types'

export const GLITCH_KIT_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'glitch-clicks-small-room',
    name: 'Clean clicks small room',
    category: 'drum',
    description: 'The plain kit of clicks, pops, pips and cuts of noise, close up in a small room.',
    instrument: { deviceId: 'glitch-kit', params: {} },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.12 } }],
    preview: 'drum',
  },
  {
    id: 'glitch-dry-close',
    name: 'Dry close faults',
    category: 'drum',
    description:
      'Every fault dry and near the ear, narrow and nearly the same each time, held by a soft drive.',
    instrument: {
      deviceId: 'glitch-kit',
      params: { tone: 0.65, scatter: 0.1, spread: 0.3, volume: -3 },
    },
    effects: [{ deviceId: 'saturator', preset: 'Warm glue' }],
    preview: 'drum',
  },
  {
    id: 'glitch-deep-slow',
    name: 'Deep slow faults',
    category: 'drum',
    description:
      'The kit tuned low and stretched long, round at the edges, over a hall that holds the lows.',
    instrument: {
      deviceId: 'glitch-kit',
      params: { tune: -8, length: 3, tone: 0.4, edge: 0.1, density: 0.3, volume: -3 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.2 } }],
    preview: 'drum',
  },
  {
    id: 'glitch-tight-small',
    name: 'Tight small ticks',
    category: 'drum',
    description:
      'Short high ticks and pips, sparse and quick, warmed by a tape stage with a tight room behind.',
    instrument: { deviceId: 'glitch-kit', preset: 'Small signals', params: { length: 0.5 } },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth', params: { outputDb: -2.5 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.25 } },
    ],
    preview: 'drum',
  },
  {
    id: 'glitch-soft-hall',
    name: 'Soft faults in a hall',
    category: 'drum',
    description: 'Dull rounded pops and bursts with a concert hall opening behind every hit.',
    instrument: { deviceId: 'glitch-kit', preset: 'Soft faults' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
    preview: 'drum',
  },
  {
    id: 'glitch-hard-plate',
    name: 'Hard cuts on a plate',
    category: 'drum',
    description:
      'Bright switched clicks and cuts of noise thrown onto a bright plate that rings after them.',
    instrument: {
      deviceId: 'glitch-kit',
      preset: 'Hard cuts',
      params: { length: 0.8, volume: 3 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3 } }],
    preview: 'drum',
  },
  {
    id: 'glitch-far-away',
    name: 'Faults from far away',
    category: 'drum',
    description:
      'The kit heard from the far end of a long dark hall, more echo of the room than hit.',
    instrument: { deviceId: 'glitch-kit', params: { edge: 0.2, volume: 2 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.7 } }],
    preview: 'drum',
  },
  {
    id: 'glitch-dotted-tape',
    name: 'Dotted tape clicks',
    category: 'drum',
    description: 'Clicks and pips answered by warm tape repeats a dotted eighth apart at 120.',
    instrument: { deviceId: 'glitch-kit', params: { density: 0.2, scatter: 0.15, volume: 2 } },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Warm repeats',
        params: { time: 375, feedback: 0.5, mix: 0.3 },
      },
    ],
    preview: 'drum',
  },
  {
    id: 'glitch-eighth-echo',
    name: 'Eighth note echo kit',
    category: 'drum',
    description:
      'Tight centred ticks with clean echoes an eighth apart at 120 thrown to both sides.',
    instrument: {
      deviceId: 'glitch-kit',
      preset: 'Tight centre',
      params: { length: 0.6, volume: 2 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 250, feedback: 0.55, spread: 0.8, mix: 0.4 },
      },
    ],
    preview: 'drum',
  },
  {
    id: 'glitch-murky-beat',
    name: 'Murky beat echoes',
    category: 'drum',
    description:
      'High scattered dust, each burst coming back a beat later at 120, darker and noisier every time.',
    instrument: { deviceId: 'glitch-kit', preset: 'Bright dust', params: { volume: 1 } },
    effects: [{ deviceId: 'analog-delay', preset: 'Murky', params: { time: 500 } }],
    preview: 'drum',
  },
  {
    id: 'glitch-cassette',
    name: 'Cassette faults',
    category: 'drum',
    description:
      'The kit bounced to a cassette four-track, dulled and wavering in pitch, with hiss under every hit.',
    instrument: { deviceId: 'glitch-kit', params: { length: 1.3, tone: 0.6 } },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.1 } },
    ],
    preview: 'drum',
  },
  {
    id: 'glitch-stepped-filter',
    name: 'Stepped filter kit',
    category: 'drum',
    description:
      'Longer bursts through a band-pass filter that jumps to a new place eight times a second.',
    instrument: { deviceId: 'glitch-kit', params: { length: 1.5, density: 0.6, volume: 5 } },
    effects: [
      { deviceId: 'auto-filter', preset: 'Stepped' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
    ],
    preview: 'drum',
  },
  {
    id: 'glitch-starved-stream',
    name: 'Starved stream kit',
    category: 'drum',
    description:
      'Coarse crushed hits through a failing stream that drops, repeats and swirls what is left.',
    instrument: { deviceId: 'glitch-kit', preset: 'Broken stream', params: { length: 1.2 } },
    effects: [{ deviceId: 'low-bitrate', preset: 'Bad connection', params: { loss: 0.65 } }],
    preview: 'drum',
  },
  {
    id: 'glitch-tube-crunch',
    name: 'Tube crunch kit',
    category: 'drum',
    description:
      'Hard edged hits driven into a tube stage until the pops thicken, in a tight chamber.',
    instrument: { deviceId: 'glitch-kit', params: { tone: 0.7, edge: 0.8 } },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { outputDb: -10 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.1 } },
    ],
    preview: 'drum',
  },
  {
    id: 'glitch-record-surface',
    name: 'Record surface kit',
    category: 'drum',
    description:
      'Long dense crackle and static played off a worn record, with its own dust and slow warp.',
    instrument: { deviceId: 'glitch-kit', preset: 'Surface noise', params: { volume: -1 } },
    effects: [{ deviceId: 'vinyl', preset: 'Charity shop find' }],
    preview: 'drum',
  },
  {
    id: 'glitch-on-strings',
    name: 'Clicks on strings',
    category: 'drum',
    description: 'Every click and pop sets a bank of strings tuned to A minor ringing after it.',
    instrument: { deviceId: 'glitch-kit', params: { tone: 0.7, edge: 0.6, volume: 3 } },
    effects: [{ deviceId: 'sympathetic', preset: 'Minor strings' }],
    preview: 'drum',
  },
  {
    id: 'glitch-shimmer-pips',
    name: 'Shimmer pips',
    category: 'drum',
    description: 'High pips and chirps whose tails climb an octave at a time into a soft halo.',
    instrument: { deviceId: 'glitch-kit', preset: 'High pips', params: { volume: 2.5 } },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.3 } }],
    preview: 'drum',
  },
  {
    id: 'glitch-grain-shards',
    name: 'Grain shard kit',
    category: 'drum',
    description: 'The kit broken into tiny grains that scatter an octave up around each hit.',
    instrument: { deviceId: 'glitch-kit', params: { scatter: 0.6, volume: 3 } },
    effects: [{ deviceId: 'grain-cloud', preset: 'Glass shards' }],
    preview: 'drum',
  },
  {
    id: 'glitch-in-mist',
    name: 'Faults in mist',
    category: 'drum',
    description:
      'Long bursts whose spectrum hangs in the air after each hit as a slow diffuse mist.',
    instrument: { deviceId: 'glitch-kit', preset: 'Long bursts', params: { volume: -7 } },
    effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist' }],
    preview: 'drum',
  },
  {
    id: 'glitch-octave-down-spring',
    name: 'Octave down in a spring',
    category: 'drum',
    description:
      'The kit tuned an octave down and crushed coarse, splashing through a driven spring tank.',
    instrument: { deviceId: 'glitch-kit', preset: 'Coarse and low' },
    effects: [{ deviceId: 'spring-reverb', preset: 'Dub send', params: { mix: 0.35 } }],
    preview: 'drum',
  },
]
