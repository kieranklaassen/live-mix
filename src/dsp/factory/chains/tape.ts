// Tape: degradation and warmth (tape, records, radio, old converters, overdriven stages).

import { type FactoryChain } from '../types'

export const TAPE_CHAINS: readonly FactoryChain[] = [
  {
    id: 'worn-cassette',
    name: 'Worn cassette',
    category: 'tape',
    description:
      'A four-track cassette: dull on top, a little unsteady, with hiss under everything.',
    effects: [{ deviceId: 'tape', preset: 'Cassette four-track' }],
  },
  {
    id: 'crumbling-loop',
    name: 'Crumbling loop',
    category: 'tape',
    description:
      'A short loop that loses treble and steadiness on every pass until there is only dust.',
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Worn out',
        params: { length: 2.6, feedback: 0.88, wear: 0.9, wow: 0.6 },
      },
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.3, output: 2.5 } },
    ],
  },
  {
    id: 'sound-on-sound',
    name: 'Sound on sound',
    category: 'tape',
    description:
      'Two decks and four seconds of tape between them: play, and layers build and slowly fade.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 6, outputDb: -4 } },
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { cutoffHz: 5500, resonance: 0.6 },
      },
      { deviceId: 'tape-loop', preset: 'Two decks', params: { spread: 0.25, mix: 0.45 } },
    ],
  },
  {
    id: 'tape-dropouts',
    name: 'Tape dropouts',
    category: 'tape',
    description:
      'An old reel at slow speed whose oxide is flaking: the sound ducks and dulls at random.',
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { speed: 2, age: 1, wow: 0.35, flutter: 0.3, hiss: 0.3, drive: 0.4 },
      },
    ],
  },
  {
    id: 'reel-flange',
    name: 'Reel flange',
    category: 'tape',
    description:
      'Two machines drifting against each other: a slow through-zero sweep printed to tape.',
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Through-zero feel',
        params: { rate: 0.08, feedback: 10, stereo: 40 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { output: 3.5 } },
    ],
  },
  {
    id: 'worn-tape-wash',
    name: 'Worn tape wash',
    category: 'tape',
    description:
      'An old reel that drifts, dulls and hisses under the sound, left to ring in a long plate.',
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.4, wear: 0.5 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },

  {
    id: 'bedside-cassette',
    name: 'Bedside cassette',
    category: 'tape',
    description: 'A worn cassette played through a small radio speaker in a bedroom.',
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
      { deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0.1 } },
    ],
  },
  {
    id: 'breathing-recorder',
    name: 'Breathing recorder',
    category: 'tape',
    description:
      'A cassette recorder with automatic level: the hiss sinks under each note and swells up in the gaps.',
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0 } },
      { deviceId: 'noise-floor', preset: 'Breathing tape', params: { level: -32 } },
    ],
  },
  {
    id: 'half-speed-shadow',
    name: 'Half speed shadow',
    category: 'tape',
    description:
      'The last phrase loops an octave down and twice as long behind the playing, in a hall.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'iron-and-plate',
    name: 'Iron and plate',
    category: 'tape',
    description: 'A transformer stage that thickens and breaks up the lows, then a soft plate.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'dark-fuzz-bed',
    name: 'Dark fuzz bed',
    category: 'tape',
    description:
      'A triode pushed until it folds, filtered dark and laid half under the clean sound in a hall.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { mix: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'old-sampler',
    name: 'Old sampler',
    category: 'tape',
    description:
      'Twelve bits at a reduced rate: the top softens and a faint glassy copy of it rings above, in a plate.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler' },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'eight-bit-hall',
    name: 'Eight bit hall',
    category: 'tape',
    description:
      'A hall heard through an eight-bit companded converter, so its tail turns to grain as it fades.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
      { deviceId: 'vintage-digital', preset: 'Toy', params: { aliasing: 0.4 } },
    ],
  },
  {
    id: 'behind-glass',
    name: 'Behind glass',
    category: 'tape',
    description:
      'A thin stream: quiet detail falls away and what is left swirls a little, in a soft plate.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Behind glass' },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'drowned-hall',
    name: 'Drowned hall',
    category: 'tape',
    description: 'A hall sent down a starving stream, its tail chewed into watery fragments.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4 } },
      { deviceId: 'low-bitrate', preset: 'Underwater', params: { loss: 0.6, mix: 0.85 } },
    ],
  },
  {
    id: 'empty-ballroom',
    name: 'Empty ballroom',
    category: 'tape',
    description:
      'A worn shellac 78 heard down a long empty hall: narrow, swaying, under a blanket of surface noise.',
    effects: [
      { deviceId: 'vinyl', preset: 'Ballroom 78' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'charity-shop-record',
    name: 'Charity shop record',
    category: 'tape',
    description:
      'A much-played LP: dull on top, a little warped, with crackle, pops and a scratch that comes round.',
    effects: [{ deviceId: 'vinyl', preset: 'Charity shop find' }],
  },
  {
    id: 'dusty-record',
    name: 'Dusty record',
    category: 'tape',
    description:
      'The surface noise and crackle of an old record under the sound, heard across a room.',
    effects: [
      { deviceId: 'noise-floor', preset: 'Old record', params: { level: -40 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'night-shortwave',
    name: 'Night shortwave',
    category: 'tape',
    description:
      'A distant station heard at night: thin, slowly fading, with static rising as it sinks, in a soft hall.',
    effects: [
      { deviceId: 'radio', preset: 'Night shortwave', params: { fading: 0.45, bandwidth: 0.62 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
]
