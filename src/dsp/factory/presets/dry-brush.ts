import { type FactoryPreset } from '../types'

// Dry Brush makes a key one stroke of a brush on paper, so a preset here is
// first of all a stroke: what the hand does, what it holds and what it writes
// on. Two for each of ten kinds. Effects stay behind the stroke, so that the
// landing, the hairs that run dry and the stain are still heard.

export const DRY_BRUSH_PRESETS: readonly FactoryPreset[] = [
  // One stroke held level, with ink enough for it.
  {
    id: 'dry-brush-silk-wash',
    name: 'Wash over silk',
    category: 'pad',
    description:
      'A full brush set down slowly on silk and held, its stain spreading into a warm hall.',
    instrument: {
      deviceId: 'dry-brush',
      preset: 'Wet level pad',
      params: { ink: 0.9, attack: 0.8, release: 3, bleed: 0.6, soak: 5, width: 0.9, volume: -9 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } }],
  },
  {
    id: 'dry-brush-finger-on-rice',
    name: 'Finger on rice paper',
    category: 'pad',
    description:
      'A wet finger drawn over rice paper: round, soft and slow, with a deep stain and a soft drift across the speakers.',
    instrument: {
      deviceId: 'dry-brush',
      preset: 'Wet level pad',
      params: {
        brush: 4,
        paper: 1,
        ink: 1,
        shade: 0.8,
        attack: 1.4,
        release: 4,
        bleed: 0.75,
        soak: 8,
        string: 0.15,
        spread: 9,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'currents', preset: 'Gentle drift' },
      { deviceId: 'fog', preset: 'Soft cloud', params: { mix: 0.3 } },
    ],
  },
  // Reed pen, short: the key is the scratch of a nib and the string it plucks.
  {
    id: 'dry-brush-quill-small-room',
    name: 'Quill in a small room',
    category: 'keys',
    description:
      'Short hollow strokes of a reed pen that pluck the string under the paper, close up in a room.',
    instrument: { deviceId: 'dry-brush', preset: 'Reed pen keys', params: { volume: -2.5 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'dry-brush-reed-one-echo',
    name: 'Reed letters, one echo',
    category: 'keys',
    description:
      'A reed pen on rough paper with the string turned up, each letter written once more a third of a second later.',
    instrument: {
      deviceId: 'dry-brush',
      preset: 'Reed pen keys',
      params: {
        paper: 2,
        string: 0.85,
        grain: 0.5,
        shade: 0.6,
        ink: 0.5,
        release: 0.3,
        volume: -2,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 333, feedback: 0, mix: 0.3 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.15 } },
    ],
  },
  // Dots: a touch of the brush, and the mark it leaves.
  {
    id: 'dry-brush-dots-skip-away',
    name: 'Dots that skip away',
    category: 'plucked',
    description:
      'Round finger dots on rice paper, each skipping off over still water in quicker and quicker echoes.',
    instrument: { deviceId: 'dry-brush', preset: 'Rice paper dots', params: { volume: -3 } },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'dry-brush-hair-dots-tape',
    name: 'Hair dots, worn echo',
    category: 'plucked',
    description:
      'A fine hair brush touched down on silk, string and all, with tape echoes that darken behind it.',
    instrument: {
      deviceId: 'dry-brush',
      preset: 'Rice paper dots',
      params: {
        brush: 0,
        paper: 0,
        string: 0.75,
        shade: 0.75,
        bleed: 0.4,
        spread: 8,
        lean: 0,
        volume: 0.5,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.15 } },
    ],
  },
  // Low strokes of something broad or blunt.
  {
    id: 'dry-brush-broad-stroke',
    name: 'Broad stroke bass',
    category: 'bass',
    description:
      'A thick flat edge pressed hard on silk, with its half under the note, warmed by tape and quickly lifted.',
    instrument: { deviceId: 'dry-brush', preset: 'Broad edge bass', params: { volume: -4.5 } },
    effects: [{ deviceId: 'saturator', preset: 'Soft tape warmth' }],
  },
  {
    id: 'dry-brush-blunt-thumb',
    name: 'Blunt thumb bass',
    category: 'bass',
    description:
      'Round low dots of a fingertip on stone, plain and short, with a little room behind them.',
    instrument: {
      deviceId: 'dry-brush',
      preset: 'Broad edge bass',
      params: {
        brush: 4,
        script: 1,
        paper: 3,
        attack: 0.006,
        string: 0.7,
        shade: 0.6,
        ink: 0.8,
        speed: 0.25,
        release: 0.4,
        lean: 0,
        volume: -4.5,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
    ],
  },
  // Seals: stamped marks that ring.
  {
    id: 'dry-brush-stamped-bells',
    name: 'Stamped in red',
    category: 'bell',
    description: 'Seals pressed on stone that ring on after the stamp, in a cathedral.',
    instrument: { deviceId: 'dry-brush', preset: 'Seals on stone', params: { volume: -4.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } }],
  },
  {
    id: 'dry-brush-seals-in-snow',
    name: 'Seals in soft snow',
    category: 'bell',
    description:
      'Hair seals on rice paper, hushed at once, each with a scatter of far repeats in the mist.',
    instrument: {
      deviceId: 'dry-brush',
      preset: 'Seals on stone',
      params: { paper: 1, bleed: 0.7, soak: 5, shade: 0.9, string: 0.6, spread: 6, volume: 1.5 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'One far star', params: { mix: 0.35 } },
      { deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.3 } },
    ],
  },
  // Strokes that are dipped again while the key is held.
  {
    id: 'dry-brush-dipped-again',
    name: 'Dipped and drawn on',
    category: 'drone',
    description:
      'One long stroke that runs dry and is dipped again every two seconds, in a dark hall.',
    instrument: { deviceId: 'dry-brush', preset: 'Redipped drone', params: { volume: -3.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } }],
  },
  {
    id: 'dry-brush-inkstone-drone',
    name: 'Inkstone drone',
    category: 'drone',
    description:
      'A broad edge kept wet on stone, with its half under the note, on worn tape in a cave.',
    instrument: {
      deviceId: 'dry-brush',
      preset: 'Redipped drone',
      params: {
        brush: 2,
        paper: 3,
        redip: 0.6,
        ink: 0.8,
        dryness: 0.2,
        shade: 0.6,
        bleed: 0.5,
        attack: 2,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } },
    ],
  },
  // Little or no ink: the paper is heard.
  {
    id: 'dry-brush-bristle-field',
    name: 'Bristle field',
    category: 'texture',
    description:
      'A feather with next to no ink over rough paper: rustle on the pitch of the key, hung in a long plate.',
    instrument: {
      deviceId: 'dry-brush',
      preset: 'Dry field',
      params: { volume: 1.5, width: 0.75 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } }],
  },
  {
    id: 'dry-brush-nothing-left-in-it',
    name: 'Nothing left in it',
    category: 'texture',
    description:
      'A dry hair brush dragged over rough paper in the open, skipping and scratching its way along the note.',
    instrument: {
      deviceId: 'dry-brush',
      preset: 'Dry field',
      params: {
        brush: 0,
        dryness: 1,
        ink: 0.12,
        grain: 1,
        speed: 0.7,
        shade: 0.6,
        bleed: 0.25,
        attack: 0.4,
        volume: 3.5,
      },
    },
    effects: [
      { deviceId: 'distance', preset: 'Open air' },
      { deviceId: 'currents', preset: 'Slow water' },
    ],
  },
  // A trembling hand.
  {
    id: 'dry-brush-trembling-chapel',
    name: 'Trembling in a chapel',
    category: 'voice',
    description:
      'A round finger shaking on silk, pale as a voice, in a chapel that answers with vowels.',
    instrument: { deviceId: 'dry-brush', preset: 'Trembling voices' },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.3 } }],
  },
  {
    id: 'dry-brush-shaken-feathers',
    name: 'Shaken feathers',
    category: 'voice',
    description:
      'Feathers trembling slowly on silk, half breath and half tone, gently doubled in an airy tail.',
    instrument: {
      deviceId: 'dry-brush',
      preset: 'Trembling voices',
      params: {
        brush: 3,
        speed: 0.25,
        width: 0.8,
        shade: 0.5,
        pressure: 0.6,
        attack: 0.9,
        release: 3,
        spread: 20,
        ink: 0.9,
        volume: -4.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
  // Heavy at the start, thinning as they fall.
  {
    id: 'dry-brush-feather-falls',
    name: 'A feather falls',
    category: 'string',
    description:
      'Feather strokes that land heavy from above and thin away as they go, across an open valley.',
    instrument: { deviceId: 'dry-brush', preset: 'Feather sweeps', params: { volume: -2.5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
    preview: 'line',
  },
  {
    id: 'dry-brush-sweeps-turned-round',
    name: 'Sweeps turned round',
    category: 'texture',
    description:
      'Hair sweeps that fall from a fourth above on rice paper, with their fall played backwards behind them in slow swells.',
    instrument: {
      deviceId: 'dry-brush',
      preset: 'Feather sweeps',
      params: {
        brush: 0,
        paper: 1,
        lean: 500,
        width: 0.85,
        ink: 0.8,
        shade: 0.8,
        tailLean: 0,
        string: 0.4,
        volume: 0.5,
      },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.2 } },
    ],
    preview: 'line',
  },
  // On stone, which rings under the brush.
  {
    id: 'dry-brush-marks-on-cold-stone',
    name: 'Marks on cold stone',
    category: 'plucked',
    description:
      'Light marks of a broad edge on stone that ring and sag as they leave, down a stone stairwell.',
    instrument: { deviceId: 'dry-brush', preset: 'Stone marks', params: { volume: 0.5 } },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
  },
  {
    id: 'dry-brush-wet-rim',
    name: 'Wet rim of stone',
    category: 'pad',
    description:
      'A wet finger drawn quickly round stone until it sings like a glass, in a tall plain hall.',
    instrument: { deviceId: 'dry-brush', preset: 'Glass rim line', params: { volume: -10.5 } },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Barely there' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.3 } },
    ],
  },
]
