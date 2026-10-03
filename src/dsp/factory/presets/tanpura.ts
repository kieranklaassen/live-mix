import { type FactoryPreset } from '../types'

export const TANPURA_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'tanpura-room',
    name: 'Tanpura in a room',
    category: 'drone',
    description:
      'Four strings plucked round and round, each pluck opening into its buzz of overtones, in a small room.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { spread: 0.8, volume: -4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room' }],
    preview: 'low',
  },
  {
    id: 'slow-overtone-wall',
    name: 'Slow overtone wall',
    category: 'drone',
    description:
      'A slow round on long strings with the bridge wide open, through tape into a very large space.',
    instrument: { deviceId: 'tanpura', preset: 'Slow wall', params: { volume: -5 } },
    effects: [
      // The drive the preset had when this was tuned.
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45, decay: 16 } },
    ],
    preview: 'low',
  },
  {
    id: 'ma-sympathetic-strings',
    name: 'Ma with sympathetics',
    category: 'drone',
    description:
      'The suspended Ma tuning with a bank of sympathetic strings answering each pluck, in a hall.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Ma tuning',
      params: { spread: 0.75, volume: -4.5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Sitar drone', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'closed-jawari-echo',
    name: 'Closed jawari echo',
    category: 'drone',
    description:
      'A drier, quicker buzz with a tape echo trailing every pluck and a long spring behind it.',
    instrument: { deviceId: 'tanpura', preset: 'Closed jawari', params: { volume: -3 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'monochord-halo',
    name: 'Monochord halo',
    category: 'drone',
    description:
      'Four plain long strings with no buzz, beating slowly, under a plate and an octave halo.',
    instrument: { deviceId: 'tanpura', preset: 'Monochord', params: { spread: 0.45, volume: -3 } },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.3, width: 0.5 } },
    ],
    preview: 'low',
  },
  {
    id: 'close-gourd-tanpura',
    name: 'Close gourd tanpura',
    category: 'drone',
    description:
      'Heard from beside the gourd: all body and a moderate buzz, the strings kept near the centre, almost dry.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { jawari: 0.5, speed: 7.5, decay: 18, detune: 1.5, body: 1, spread: 0.3, volume: -4 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience' }],
    preview: 'low',
  },
  {
    id: 'small-bright-tanpuri',
    name: 'Small bright tanpuri',
    category: 'drone',
    description:
      'Set like the small instrument: a quick round on short bright strings, little gourd and no deep bass, in a tight chamber.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: {
        jawari: 0.75,
        speed: 3.5,
        decay: 8,
        detune: 1,
        body: 0.2,
        spread: 0.6,
        volume: -3.5,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Keys', params: { lowCut: 110, presence: 2.5 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
    preview: 'hold',
  },
  {
    id: 'ni-tanpura-hall',
    name: 'Ni tanpura hall',
    category: 'drone',
    description:
      'The first string a semitone under the key, leaning on the three that answer it, in a concert hall.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Evening Ni',
      params: {
        jawari: 0.55,
        speed: 6,
        decay: 22,
        detune: 2,
        body: 0.5,
        spread: 0.65,
        volume: -4.5,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.4 } }],
    preview: 'hold',
  },
  {
    id: 'tanpura-pad-behind',
    name: 'Tanpura, pad behind',
    category: 'drone',
    description:
      'Strings in exact unison with no beating, and a soft string pad that grows in behind the plucks, in a room.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: {
        jawari: 0.45,
        speed: 5.5,
        decay: 16,
        detune: 0,
        body: 0.5,
        spread: 0.4,
        volume: -2.5,
      },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'String pad',
        params: { fall: 6, sensitivity: 0.7, lowCut: 60, mix: 0.6 },
      },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
    preview: 'low',
  },
  {
    id: 'twelve-second-round',
    name: 'Twelve second round',
    category: 'drone',
    description:
      'The slowest round, a pluck every three seconds thrown wide, each left to open and fade in a vast nave.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wall',
      params: { jawari: 0.5, speed: 12, detune: 6, body: 0.2, spread: 1, volume: -6 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.45 } }],
    preview: 'low',
  },
  {
    id: 'damped-tanpura-round',
    name: 'Damped tanpura round',
    category: 'drone',
    description:
      'Short woody strings with hardly any buzz, plucked twice a second from side to side, a clean echo falling between the plucks.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Closed jawari',
      params: {
        jawari: 0.1,
        speed: 2,
        decay: 3,
        detune: 0.5,
        body: 1,
        spread: 0.9,
        volume: -1.5,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 375, feedback: 0.45, mix: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'low',
  },
  {
    id: 'beating-jawari',
    name: 'Beating jawari',
    category: 'drone',
    description:
      'The two middle strings tuned eight cents apart with the bridge open, so their overtones beat, in a long open reverb.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wall',
      params: {
        jawari: 0.95,
        speed: 4.5,
        decay: 22,
        detune: 8,
        body: 0.25,
        spread: 0.85,
        volume: -5,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
    preview: 'low',
  },
  {
    id: 'distant-ma-tanpura',
    name: 'Distant Ma tanpura',
    category: 'drone',
    description:
      'The Ma tuning on a full gourd, the highs rolled off and most of what is heard reverb, as if from far away.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Ma tuning',
      params: { jawari: 0.5, speed: 7, decay: 20, body: 0.7, spread: 0.3, volume: -4 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { lowCut: 60 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.75 } },
    ],
    preview: 'low',
  },
  {
    id: 'tanpura-box-speaker',
    name: 'Tanpura box speaker',
    category: 'drone',
    description:
      'Like a practice drone box: thin buzzing strings with no gourd, in mono from a small speaker in a room.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { jawari: 0.85, speed: 4, decay: 9, detune: 0.5, body: 0, spread: 0, volume: -2 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { output: 2.5 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'low',
  },
  {
    id: 'swept-jawari',
    name: 'Swept jawari',
    category: 'drone',
    description:
      'The bridge wide open and a resonant peak gliding up and down the overtones every four seconds, in a hall.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { jawari: 1, speed: 3, decay: 14, body: 0.1, spread: 0.6, volume: -12 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        // A little drive holds the peak (five times the level at its centre) when many keys stack.
        params: {
          type: 4,
          cutoffHz: 1100,
          resonance: 2.5,
          driveDb: 4,
          lfoAmount: 30,
          lfoRateHz: 0.25,
        },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'held-tanpura-pad',
    name: 'Held tanpura pad',
    category: 'pad',
    description:
      'A chord of buzzing strings caught and held as one even tone, the plucks gone, rising in under a second.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { jawari: 0.8, speed: 3, decay: 15, detune: 4, body: 0.3, spread: 0.7, volume: -6.5 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Held sound alone',
        params: { attack: 0.8, decay: 4, ensemble: 0.7 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'tanpura-chord-ripple',
    name: 'Tanpura chord ripple',
    category: 'plucked',
    description:
      'Every key plucks its own four plain strings in turn, the fourth below first, so a held chord ripples like a zither, in a bright hall.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Closed jawari',
      params: { jawari: 0.15, speed: 3, decay: 6, detune: 2, body: 0.6, spread: 1, volume: -6 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.3 } }],
  },
  {
    id: 'backwards-tanpura',
    name: 'Backwards tanpura',
    category: 'drone',
    description:
      'Each short pluck comes back a second later turned round, swelling up to where it began, in a hall.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Closed jawari',
      params: {
        jawari: 0.4,
        speed: 4.5,
        decay: 5,
        detune: 1.5,
        body: 0.45,
        spread: 0.35,
        volume: -1,
      },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards only',
        params: { smooth: 0.6, spread: 0.1, mix: 0.8 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'tanpura-on-shellac',
    name: 'Tanpura on shellac',
    category: 'drone',
    description:
      'A mono recording played off a 78 through a horn in a room: a narrow band, crackle and surface hiss.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: {
        jawari: 0.7,
        speed: 5.5,
        decay: 13,
        detune: 2.5,
        body: 0.65,
        spread: 0,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Parlour 78', params: { crackle: 0.35 } },
      {
        deviceId: 're-amp',
        params: { speaker: 3, drive: 0.1, distance: 0.45, angle: 0.1, noise: 0, output: 6.5 },
      },
    ],
    preview: 'low',
  },
  {
    id: 'tanpura-grain-rain',
    name: 'Tanpura grain rain',
    category: 'drone',
    description:
      'An open buzzing bridge under a rain of short grains of itself an octave up, which climb as they fade.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wall',
      params: { jawari: 0.9, speed: 5, decay: 18, body: 0.2, spread: 0.5, volume: -4 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Octave rain',
        params: { size: 120, density: 20, spread: 0.8, mix: 0.5 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },
]
