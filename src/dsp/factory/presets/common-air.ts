import { type FactoryPreset } from '../types'

// Common Air is one lung and what drinks from it, so a preset here is first of
// all a breath: how long it lasts, what happens when it ends, and which key
// goes without. Two presets for each of ten directions. Where the keys pull
// each other into pure intervals, effects that add pitches are kept to
// octaves.

export const COMMON_AIR_PRESETS: readonly FactoryPreset[] = [
  // Mountain mouth.
  {
    id: 'common-air-treeline',
    name: 'Reed at the treeline',
    category: 'wind',
    description:
      'A cane reed in a stopped pipe, six seconds to a breath and a catch of air between, across an open valley.',
    instrument: { deviceId: 'common-air', preset: 'Mountain mouth' },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.28 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 10 } },
    ],
    preview: 'line',
  },
  {
    id: 'common-air-two-slopes',
    name: 'Call across two slopes',
    category: 'wind',
    description:
      'Cane reeds with a fifth beside each, breathing out and in, and one clean echo half a second late.',
    instrument: {
      deviceId: 'common-air',
      preset: 'Mountain mouth',
      params: { second: 0.7, interval: 7, breath: 2, lung: 2.4, cup: 0.3, leak: 0.5, chiff: 0.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 520, feedback: 0.15, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 10 } },
    ],
    preview: 'line',
  },
  // Last breath.
  {
    id: 'common-air-running-out',
    name: 'A breath running out',
    category: 'pad',
    description:
      'One breath for the whole chord: the high keys fall silent first, bent and airy, in a dark hall.',
    instrument: { deviceId: 'common-air', preset: 'Last breath' },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.28 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1.5 } },
    ],
  },
  {
    id: 'common-air-short-sighs',
    name: 'Sighs at the keyboard',
    category: 'keys',
    description:
      'Each new key is one short sigh in a stopped pipe that bends down as it empties, on a cassette in a room.',
    instrument: {
      deviceId: 'common-air',
      preset: 'Last breath',
      params: {
        pipe: 1,
        body: 0.8,
        lung: 2.6,
        attack: 0.06,
        sag: 70,
        release: 1.2,
        leak: 0.6,
        starve: 0.4,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6.5 } },
    ],
    preview: 'keys',
  },
  // Circular drone.
  {
    id: 'common-air-round-cheeks',
    name: 'Round and round, low',
    category: 'drone',
    description:
      'A low fifth of cane reeds in cones with an octave under each, a breath that never stops, in a vast nave.',
    instrument: { deviceId: 'common-air', preset: 'Circular drone' },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0.5 } },
    ],
  },
  {
    id: 'common-air-air-goes-round',
    name: 'Air goes round the chord',
    category: 'pad',
    description:
      'Brass reeds without pipes, where one breath goes round the keys every five seconds and each opens in turn.',
    instrument: {
      deviceId: 'common-air',
      preset: 'Circular drone',
      params: {
        reed: 0,
        bite: 0.75,
        pipe: 0,
        body: 0.4,
        cup: 0.1,
        second: 0.5,
        interval: 12,
        beat: 0.6,
        lung: 5,
        starve: 1,
        attack: 0.4,
        spread: 1,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 4 } },
    ],
  },
  // Paper lullaby.
  {
    id: 'common-air-paper-cradle',
    name: 'Paper cradle song',
    category: 'keys',
    description:
      'Soft fluttering paper reeds on a wooden chest with an octave over each, close up in a small room.',
    instrument: {
      deviceId: 'common-air',
      preset: 'Paper lullaby',
      params: { attack: 0.12, lung: 7 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 5 } },
    ],
    preview: 'keys',
  },
  {
    id: 'common-air-paper-choir',
    name: 'Choir behind paper',
    category: 'voice',
    description:
      'Paper reeds spoken through cupped hands on an open ah, breathing out and in, with a faint octave of air above.',
    instrument: {
      deviceId: 'common-air',
      preset: 'Paper lullaby',
      params: {
        pipe: 2,
        vowel: 0.5,
        cup: 0.95,
        second: 0.6,
        interval: 0,
        beat: 1.2,
        lung: 3.6,
        turn: 1,
        leak: 0.08,
        bite: 0.8,
        spread: 0.9,
      },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Faint glimmer' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 7.5 } },
    ],
  },
  // Reed bass.
  {
    id: 'common-air-barge-bass',
    name: 'Barge at the quay',
    category: 'bass',
    description:
      'A brass reed in a cone with an octave under it, quick to speak, short to stop, on warm tape.',
    instrument: { deviceId: 'common-air', preset: 'Reed bass' },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2.5 } },
    ],
  },
  {
    id: 'common-air-cellar-bass',
    name: 'Cellar pipe bass',
    category: 'bass',
    description:
      'A cane reed in a long stopped pipe, hollow and puffed at the start, an octave under it, in a dark cave.',
    instrument: {
      deviceId: 'common-air',
      preset: 'Reed bass',
      params: {
        reed: 1,
        bite: 0.8,
        pipe: 1,
        body: 0.85,
        cup: 0.1,
        second: 0.45,
        leak: 0.3,
        chiff: 0.8,
        release: 0.5,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.16 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
    ],
  },
  // Chiff keys.
  {
    id: 'common-air-wooden-chiff',
    name: 'Wooden chiff keys',
    category: 'keys',
    description:
      'A cane reed in an open pipe with a strong puff at each key, one breath long, in a wooden room.',
    instrument: { deviceId: 'common-air', preset: 'Chiff keys' },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 4.5 } },
    ],
    preview: 'keys',
  },
  {
    id: 'common-air-puffs-repeat',
    name: 'Puffs on tape echo',
    category: 'plucked',
    description:
      'Short paper puffs in stopped pipes, nearly all breath and gone in a second, with warm repeats behind them.',
    instrument: {
      deviceId: 'common-air',
      preset: 'Chiff keys',
      params: {
        reed: 3,
        bite: 0.6,
        pipe: 1,
        body: 1,
        lung: 1,
        leak: 0.1,
        release: 0.25,
        second: 0.4,
        interval: 12,
        beat: 0.5,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 9 } },
    ],
    preview: 'keys',
  },
  // Locked fifths.
  {
    id: 'common-air-fifths-settle',
    name: 'Fifths that settle',
    category: 'organ',
    description:
      'Brass reeds with a true fifth over each lean on each other until the beats slow and stop, in a cathedral.',
    instrument: { deviceId: 'common-air', preset: 'Locked fifths' },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 3.5 } },
    ],
  },
  {
    id: 'common-air-steel-twelfths',
    name: 'Steel twelfths at rest',
    category: 'drone',
    description:
      'Thin steel reeds with a true twelfth over each, locked fast in a breath that never stops, on a dark plate.',
    instrument: {
      deviceId: 'common-air',
      preset: 'Locked fifths',
      params: {
        reed: 2,
        interval: 19,
        second: 0.6,
        pipe: 3,
        bite: 0.6,
        body: 0.7,
        cup: 0.5,
        vowel: 0.2,
        attack: 1.5,
      },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
    ],
    preview: 'low',
  },
  // Breath tide.
  {
    id: 'common-air-one-tide',
    name: 'Tide of one breath',
    category: 'pad',
    description:
      'The whole chord breathes out, turns and opens again in another order on the way in, in a warm hall.',
    instrument: { deviceId: 'common-air', preset: 'Breath tide' },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.28 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1.5 } },
    ],
  },
  {
    id: 'common-air-harbour-tide',
    name: 'Slow harbour tide',
    category: 'string',
    description:
      'Bright brass reeds on a long tide: low keys open first, the beating seconds swirl, the turn takes its time.',
    instrument: {
      deviceId: 'common-air',
      preset: 'Breath tide',
      params: {
        pipe: 0,
        bite: 0.9,
        body: 0.55,
        cup: 0.1,
        second: 0.9,
        interval: 0,
        beat: 2.2,
        lung: 6.5,
        turn: 2,
        starve: 0.9,
        attack: 0.9,
        spread: 1,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 3 } },
    ],
  },
  // Steel bells.
  {
    id: 'common-air-steel-tongues',
    name: 'Steel tongue bells',
    category: 'bell',
    description:
      'Plucked steel reeds whose bars ring on under a twelfth that beats, one breath to each key, in bright air.',
    instrument: { deviceId: 'common-air', preset: 'Steel bells' },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.28 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 12 } },
    ],
  },
  {
    id: 'common-air-frost-bells',
    name: 'Frost on steel tongues',
    category: 'bell',
    description:
      'Hard plucked steel reeds in open pipes with two octaves over each, dying slowly, and sparks behind them.',
    instrument: {
      deviceId: 'common-air',
      preset: 'Steel bells',
      params: {
        pipe: 2,
        body: 0.9,
        interval: 24,
        second: 0.8,
        beat: 0.4,
        lung: 2.4,
        chiff: 1,
        bite: 0.45,
        release: 2.5,
        volume: -5,
      },
    },
    effects: [
      { deviceId: 'glints', preset: 'Faint dust' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 14 } },
    ],
    preview: 'bells',
  },
  // Five sleepers.
  {
    id: 'common-air-five-asleep',
    name: 'Five asleep',
    category: 'voice',
    description:
      'Brass reeds in cupped hands, each sagging by its own amount on every breath and slow to wake, in a dark hall.',
    instrument: { deviceId: 'common-air', preset: 'Five sleepers' },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1.5 } },
    ],
  },
  {
    id: 'common-air-sleep-next-door',
    name: 'Asleep next door',
    category: 'texture',
    description:
      'One sleeper with a long leaky breath in and a slow turn, paper for a reed, heard through the wall.',
    instrument: {
      deviceId: 'common-air',
      preset: 'Five sleepers',
      params: {
        reed: 3,
        bite: 0.7,
        breath: 1,
        lung: 2.2,
        turn: 1.4,
        leak: 0.5,
        vowel: 0.35,
        cup: 0.8,
        attack: 0.4,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 13 } },
    ],
    preview: 'hold',
  },
]
