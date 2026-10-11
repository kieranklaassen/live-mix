import { type FactoryPreset } from '../types'

export const FLOCK_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'evening-flock-hall',
    name: 'Evening flock hall',
    category: 'pad',
    description: 'Five voices a key glide up to each note of the chord and hover there in a hall.',
    instrument: { deviceId: 'flock', preset: 'Evening flock', params: { volume: -13 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'gathered-unison',
    name: 'Gathered unison',
    category: 'pad',
    description: 'Four voices a key slide up into one steady hollow unison, on a medium plate.',
    instrument: { deviceId: 'flock', preset: 'Clean unison', params: { volume: -11.5 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } }],
  },
  {
    id: 'smeared-cluster-pad',
    name: 'Smeared cluster pad',
    category: 'pad',
    description:
      'Eight whistles a key roam wide of the note and never settle, spread across an open valley.',
    instrument: { deviceId: 'flock', preset: 'Wide smear', params: { gather: 1.5, volume: -13 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
  },
  {
    id: 'slow-arrival-valley',
    name: 'Slow arrival valley',
    category: 'pad',
    description:
      'A chord that takes three seconds to fly in from below and is left in a very large space.',
    instrument: { deviceId: 'flock', preset: 'Slow arrival', params: { gather: 3, volume: -12 } },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } }],
  },
  {
    id: 'octave-cloud-shimmer',
    name: 'Octave cloud shimmer',
    category: 'pad',
    description:
      'Pure whistles on the note and an octave either side of it, with a reverb that adds the octave above.',
    instrument: { deviceId: 'flock', preset: 'Octave cloud', params: { volume: -13 } },
    effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.25 } }],
  },
  {
    id: 'scattering-flock',
    name: 'Scattering flock',
    category: 'pad',
    description:
      'A chord that arrives quickly and scatters up and down for seconds after the keys, in a dark hall.',
    instrument: { deviceId: 'flock', preset: 'Scattering', params: { volume: -13 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.25 } }],
  },
  {
    id: 'flock-up-close',
    name: 'Flock up close',
    category: 'pad',
    description:
      'The flock with nothing round it but a touch of preamp warmth: every glide and wobble is heard.',
    instrument: {
      deviceId: 'flock',
      preset: 'Evening flock',
      params: { gather: 0.7, tone: 0.45, leave: 1.5, volume: -13 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'First hint' }],
  },
  {
    id: 'whistle-in-a-booth',
    name: 'Whistle in a booth',
    category: 'voice',
    description: 'One pure whistle that slides quickly onto each note of a line, in a small booth.',
    instrument: { deviceId: 'flock', preset: 'One whistle', params: { volume: -6 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.2 } }],
    preview: 'line',
  },
  {
    id: 'reed-choir-chapel',
    name: 'Reed choir chapel',
    category: 'voice',
    description:
      'Reedy voices that close in on each note from both sides, sung into a small vowel-coloured chapel.',
    instrument: { deviceId: 'flock', preset: 'Reed choir', params: { volume: -13 } },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.3 } }],
  },
  {
    id: 'falling-voices-tape',
    name: 'Falling voices tape',
    category: 'voice',
    description:
      'Six voices a key fall onto the chord from above, on quarter-inch tape with a small plate.',
    instrument: { deviceId: 'flock', preset: 'Falling in', params: { tone: 0.5, volume: -13 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'hollow-pair-rotary',
    name: 'Hollow pair rotary',
    category: 'voice',
    description: 'Two hollow voices a note, close together, turning slowly in a rotating speaker.',
    instrument: { deviceId: 'flock', preset: 'Hollow pair', params: { volume: -9.5 } },
    effects: [{ deviceId: 'rotary', preset: 'Soft blend' }],
    preview: 'line',
  },
  {
    id: 'dawn-chorus-calls',
    name: 'Dawn chorus calls',
    category: 'texture',
    description:
      'Each voice of the chord sings in separate soft calls at its own pace, repeated by a tape echo in a room.',
    instrument: { deviceId: 'flock', preset: 'Dawn calls', params: { volume: -10 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'blip-flock-echoes',
    name: 'Blip flock echoes',
    category: 'texture',
    description:
      'Three voices snap onto each short note and scatter as it ends: quick blips, echoed in a room.',
    instrument: { deviceId: 'flock', preset: 'Swift blips', params: { volume: -4 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'bells',
  },
  {
    id: 'nervous-swarm-phaser',
    name: 'Nervous swarm phaser',
    category: 'texture',
    description: 'Seven voices jitter fast around one held note while a slow phaser sweeps them.',
    instrument: { deviceId: 'flock', preset: 'Nervous swarm', params: { volume: -5.5 } },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'sparse-calls-far-off',
    name: 'Sparse calls far off',
    category: 'texture',
    description:
      'Two voices call slowly on one note with silence between, half remembered by an echo across a valley.',
    instrument: { deviceId: 'flock', preset: 'Sparse calls', params: { volume: -6 } },
    effects: [
      { deviceId: 'echo-memory', preset: 'Faint recall', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'glass-swarm-grains',
    name: 'Glass swarm grains',
    category: 'texture',
    description:
      'Eight pure whistles flicker around each note, cut into grains an octave up and left on a bright plate.',
    instrument: { deviceId: 'flock', preset: 'Glass swarm', params: { volume: -8 } },
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
  {
    id: 'flock-in-a-blur',
    name: 'Flock in a blur',
    category: 'texture',
    description: 'A flock on one note smeared in time until its glides hang in the air as a mist.',
    instrument: {
      deviceId: 'flock',
      preset: 'Evening flock',
      params: { stray: 0.5, flutter: 1, volume: -8 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.7 } }],
  },
  {
    id: 'low-murmur-drone',
    name: 'Low murmur drone',
    category: 'drone',
    description:
      'Seven hollow voices a note gather slowly on a low fifth and wander around it in a dark hall.',
    instrument: { deviceId: 'flock', preset: 'Low murmur', params: { gather: 2.5, volume: -10 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } }],
  },
  {
    id: 'worn-reed-drone',
    name: 'Worn reed drone',
    category: 'drone',
    description:
      'A reedy low fifth that never holds still, under record crackle and a dark spring.',
    instrument: {
      deviceId: 'flock',
      preset: 'Reed choir',
      params: { birds: 7, stray: 0.35, leave: 4, volume: -9 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Dust and scratches' },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring' },
    ],
  },
  {
    id: 'hovering-sub-drone',
    name: 'Hovering sub drone',
    category: 'drone',
    description:
      'A steady low fifth with voices an octave above and below it, slowly thickened and left in a cave.',
    instrument: {
      deviceId: 'flock',
      preset: 'Clean unison',
      params: { birds: 6, gather: 1.5, octaves: 0.8, leave: 3, volume: -6 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } },
    ],
  },
]
