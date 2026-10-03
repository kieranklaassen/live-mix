import { type FactoryPreset } from '../types'

// Written for whatever gets loaded: a voice, a field recording, a piano note.
// The previews play the sampler's built-in soft tone.
export const SAMPLER_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'low-tape-pad',
    name: 'Low tape pad',
    category: 'pad',
    description:
      'The loaded sound an octave down on a slow unsteady loop, thickened and set in a hall.',
    instrument: { deviceId: 'sampler', preset: 'Tape choir', params: { volume: -11 } },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'worn-tape-keys',
    name: 'Worn tape keys',
    category: 'keys',
    description: 'One recording played across the keys from a tired tape, dull and wavering.',
    instrument: { deviceId: 'sampler', preset: 'Worn tape', params: { volume: -15 } },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.35 } },
      {
        deviceId: 'spring-reverb',
        preset: 'Long three spring',
        params: { mix: 0.25, width: 0.75 },
      },
    ],
  },
  {
    id: 'sample-and-echoes',
    name: 'Sample and echoes',
    category: 'keys',
    description: 'The recording played once per key, start to end, with tape echoes and a plate.',
    instrument: { deviceId: 'sampler', preset: 'One shot', params: { release: 0.8 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { spread: 1, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'backwards-swell',
    name: 'Backwards swell',
    category: 'texture',
    description:
      'The recording played backwards so it swells into each note, with a halo above it.',
    instrument: { deviceId: 'sampler', preset: 'Backwards', params: { volume: -11 } },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.35 } }],
  },
  {
    id: 'drifting-sample-loop',
    name: 'Drifting loop',
    category: 'texture',
    description:
      'A short stretch of the recording run back and forth and smeared into a slow wash.',
    instrument: { deviceId: 'sampler', preset: 'There and back', params: { tune: 0, volume: -14 } },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { width: 0.5, mix: 0.6 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, width: 0.7 } },
    ],
  },
  {
    id: 'steady-sample-keys',
    name: 'Steady sample keys',
    category: 'keys',
    description:
      'The loaded sound looped under each key with no wobble and the top left open, in a small room.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: {
        crossfade: 80,
        attack: 0.008,
        release: 0.45,
        tone: 14000,
        wobble: 0,
        velocity: 0.8,
        volume: -13.5,
      },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Tight chamber', params: { mix: 0.22 } }],
  },
  {
    id: 'held-sample-pad',
    name: 'Held sample pad',
    category: 'pad',
    description:
      'The loaded sound at its own pitch on a smooth loop with a soft start, in a chorus and a plate.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: {
        crossfade: 150,
        attack: 0.25,
        release: 1.6,
        tone: 5000,
        wobble: 0.25,
        velocity: 0.3,
        volume: -13.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Wide chorus', params: { mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'full-take-keys',
    name: 'Full take keys',
    category: 'keys',
    description:
      'A tap starts the recording and it plays on after the key is let go, fading slowly, in a room.',
    instrument: {
      deviceId: 'sampler',
      preset: 'One shot',
      params: { release: 12, tone: 12000, velocity: 0.8, volume: -13 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'half-speed-take',
    name: 'Half speed take',
    category: 'keys',
    description:
      'The recording played once per key at half speed, an octave down, on warm tape in a dark plate.',
    instrument: {
      deviceId: 'sampler',
      preset: 'One shot',
      params: { tune: -12, release: 1.5, tone: 6000, velocity: 0.7, volume: -13.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'dattorro', preset: 'Dark plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'sample-organ-stops',
    name: 'Sample organ stops',
    category: 'organ',
    description:
      'The loaded sound looped at one level on every key like an organ, with octaves added below and above.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: {
        crossfade: 100,
        attack: 0.004,
        release: 0.07,
        tone: 9000,
        wobble: 0,
        velocity: 0,
        volume: -20,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Organ' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'double-speed-keys',
    name: 'Double speed keys',
    category: 'keys',
    description:
      'The loaded sound an octave up at double speed, looped under each key, doubled wide in a bright plate.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: {
        crossfade: 60,
        tune: 12,
        attack: 0.002,
        release: 1.4,
        tone: 16000,
        wobble: 0.06,
        velocity: 0.8,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Top only' },
      { deviceId: 'dattorro', preset: 'Bright plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sample-chirps',
    name: 'Sample chirps',
    category: 'bell',
    description:
      'The whole recording once per key, two octaves up at four times the speed, with bouncing tape echoes in a small plate.',
    instrument: {
      deviceId: 'sampler',
      preset: 'One shot',
      params: { tune: 24, release: 0.8, tone: 9000, velocity: 0.8, volume: -7 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Small plate' },
    ],
  },
  {
    id: 'front-edge-pluck',
    name: 'Front edge pluck',
    category: 'plucked',
    description:
      'Only the first tenth of the recording on each key, a clipped note that leaves tuned strings ringing briefly in a small room.',
    instrument: {
      deviceId: 'sampler',
      preset: 'One shot',
      params: { end: 0.1, release: 0.15, tone: 11000, velocity: 0.9, volume: -9.5 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Piano pedal',
        params: { sympathy: 0.7, strings: 8, decay: 4, width: 0.25 },
      },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'tail-end-keys',
    name: 'Tail end keys',
    category: 'keys',
    description:
      'Only the last third of the recording on each key, with dark echoes in a still room.',
    instrument: {
      deviceId: 'sampler',
      preset: 'One shot',
      params: {
        start: 0.7,
        attack: 0.004,
        release: 0.6,
        tone: 7000,
        wobble: 0.1,
        velocity: 0.7,
        volume: -10.5,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.28 } },
      { deviceId: 'bloom-reverb', preset: 'Still room' },
    ],
  },
  {
    id: 'sample-palindrome',
    name: 'Sample palindrome',
    category: 'pad',
    description:
      'The whole recording forwards then backwards under each key, through a slow phaser into a long open reverb.',
    instrument: {
      deviceId: 'sampler',
      preset: 'There and back',
      params: {
        start: 0,
        end: 1,
        tune: 0,
        attack: 0.6,
        release: 3,
        tone: 7000,
        wobble: 0.2,
        velocity: 0.3,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { stereo: 60, mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'backwards-loop-bed',
    name: 'Backwards loop bed',
    category: 'pad',
    description:
      'The recording looping backwards under each key, with backwards echoes an octave up behind it in a long plate.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: {
        start: 0.1,
        end: 0.9,
        crossfade: 250,
        reverse: 1,
        attack: 1.2,
        release: 3.5,
        tone: 5500,
        wobble: 0.3,
        velocity: 0.3,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { pitch: 1, mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sample-floor-drone',
    name: 'Sample floor drone',
    category: 'drone',
    description:
      'The loaded sound looped for the low keys with a slow start, through a transformer and a slowly drifting low-pass into a dark hall.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: {
        crossfade: 500,
        attack: 2.5,
        release: 7,
        tone: 2200,
        wobble: 0.3,
        velocity: 0,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { output: -6.5 } },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'zita-rev1', preset: 'Dark hall' },
    ],
  },
  {
    id: 'sample-next-door',
    name: 'Sample next door',
    category: 'pad',
    description:
      'The loaded sound rolled off from 500 Hz as if heard through a wall, in a small room, so the top keys all but vanish.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: {
        crossfade: 200,
        attack: 0.5,
        release: 2,
        tone: 500,
        wobble: 0.15,
        velocity: 0.3,
        volume: -14,
      },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } }],
  },
  {
    id: 'slow-sample-tide',
    name: 'Slow sample tide',
    category: 'pad',
    description:
      'The loaded sound looped and faded in over several seconds, drifting a little, in a very large hall.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: {
        crossfade: 500,
        attack: 6,
        release: 9,
        tone: 4500,
        wobble: 0.35,
        velocity: 0,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Vast nave', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'quarter-speed-rewind',
    name: 'Quarter speed rewind',
    category: 'texture',
    description:
      'The recording backwards at a quarter of its speed, two octaves down, through a valve into a dark cave of echoes.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Backwards',
      params: { tune: -24, attack: 0.05, release: 4, tone: 5000, wobble: 0.3, volume: -12 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { output: -2.5 } },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.35 } },
    ],
  },
]
