import { type FactoryPreset } from '../types'

export const AFTERGLOW_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'felt-into-light',
    name: 'Felt into light',
    category: 'keys',
    description:
      'A soft felt strike whose own overtones rise behind it as a slow pad, in a small room.',
    instrument: { deviceId: 'afterglow', preset: 'Felt afterglow' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'bare-felt-strike',
    name: 'Bare felt strike',
    category: 'keys',
    description: 'Only the strike: a round felt note with no glow after it, close in a dry booth.',
    instrument: { deviceId: 'afterglow', preset: 'Only the strike' },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } }],
  },
  {
    id: 'dark-felt-reel',
    name: 'Dark felt reel',
    category: 'keys',
    description:
      'A dull felt strike and a low, narrow glow, played back from quarter inch tape on a small plate.',
    instrument: { deviceId: 'afterglow', preset: 'Dark felt' },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'octave-shine-keys',
    name: 'Octave shine keys',
    category: 'keys',
    description:
      'Felt notes that leave a bright glow with its octave beating over it, and a reverb that lifts the tail an octave again.',
    instrument: { deviceId: 'afterglow', preset: 'Shimmer keys' },
    effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.2 } }],
  },
  {
    id: 'pluck-haze-repeats',
    name: 'Pluck haze repeats',
    category: 'keys',
    description:
      'A plucked string with a thin haze behind each note, repeated by a warm tape echo in a room.',
    instrument: { deviceId: 'afterglow', preset: 'Pluck and haze' },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.22 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'harp-left-in-air',
    name: 'Harp left in the air',
    category: 'keys',
    description:
      'Plucked notes that go on as a slow, dark pad long after the string has stopped, in a hall.',
    instrument: { deviceId: 'afterglow', preset: 'Harp into air', params: { bloom: 2.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'quick-swell-ensemble',
    name: 'Quick swell ensemble',
    category: 'keys',
    description:
      'A faint strike and a glow that is up in under half a second and soon gone, thickened by a slow ensemble chorus.',
    instrument: { deviceId: 'afterglow', preset: 'Quick swell', params: { volume: -13.5 } },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'felt-mirror-trail',
    name: 'Felt mirror trail',
    category: 'keys',
    description:
      'Felt notes and a plain glow, answered by a faint backwards copy of the phrase on a medium plate.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Felt afterglow',
      params: { glow: 0.5, halo: 0, fade: 3, volume: -5 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Faint reflection' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'worn-cassette-glow',
    name: 'Worn cassette glow',
    category: 'keys',
    description:
      'A felt strike and its pad on a worn cassette: dull, a little unsteady, with hiss under it.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Felt afterglow',
      params: { decay: 3, tone: 0.4, drift: 0.45 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'long-fade-glints',
    name: 'Long fade glints',
    category: 'keys',
    description:
      'Each note fades for most of half a minute, so a phrase piles up into a cloud with grains glinting over it.',
    instrument: { deviceId: 'afterglow', preset: 'Long fade' },
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bell-halo-nave',
    name: 'Bell halo nave',
    category: 'bell',
    description:
      'A cast bell without its third, the octave shimmer of its glow held over it, in a vast nave.',
    instrument: { deviceId: 'afterglow', preset: 'Bell halo' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'chime-clean-echoes',
    name: 'Chime clean echoes',
    category: 'bell',
    description:
      'Bright short chimes with only a little glow, repeated by a clean echo on a small plate.',
    instrument: { deviceId: 'afterglow', preset: 'Bright chimes', params: { volume: -3.5 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  {
    id: 'bell-at-low-tide',
    name: 'Bell at low tide',
    category: 'bell',
    description:
      'A dark bell that rings long while its low partials swell up and trade places, deep in a cave.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Low tide bell',
      params: { bloom: 3, fade: 8 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'glass-breath-air',
    name: 'Glass breath air',
    category: 'bell',
    description:
      'A glass touched lightly: hardly a strike, then its rim tones breathing in over three seconds in bright air.',
    instrument: { deviceId: 'afterglow', preset: 'Glass breath', params: { volume: -12 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.25 } }],
    preview: 'keys',
  },
  {
    id: 'still-glass-close',
    name: 'Still glass close',
    category: 'bell',
    description:
      'A struck glass whose tone is then held perfectly still, with no beating or movement, close and almost dry.',
    instrument: { deviceId: 'afterglow', preset: 'Still glass', params: { volume: -5 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.15 } }],
  },
  {
    id: 'bell-slow-swirl',
    name: 'Bell in a slow swirl',
    category: 'bell',
    description:
      'A shorter bell with a plain glow, turned over slowly by a phaser and left in a hall.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bell halo',
      params: { strike: 0.8, decay: 4, bloom: 1.2, fade: 5, halo: 0.15, width: 0.4, volume: -3 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { stereo: 15 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
  {
    id: 'glow-under-an-octave',
    name: 'Glow under an octave',
    category: 'pad',
    description:
      'No strike at all: the felt overtones swell in as a pad, with a faint octave added above them, in a hall.',
    instrument: { deviceId: 'afterglow', preset: 'Only the glow', params: { volume: -19.5 } },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slow-bloom-space',
    name: 'Slow bloom space',
    category: 'pad',
    description:
      'A quiet strike, then a pad that takes seconds to arrive and whose overtones keep trading places, in a very large space.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Slow bloom',
      params: { bloom: 3.5, volume: -17 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } }],
  },
  {
    id: 'restless-light-rotor',
    name: 'Restless light rotor',
    category: 'pad',
    description:
      'A wide glow whose overtones beat and wander as far as they go, through a slow rotary speaker on a long plate.',
    instrument: { deviceId: 'afterglow', preset: 'Restless light', params: { volume: -15 } },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'glass-choir-tail',
    name: 'Glass choir tail',
    category: 'pad',
    description:
      'Glass tones that breathe in with almost no strike, in a reverb that sings their tail back as a soft ah.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Glass breath',
      params: { strike: 0.15, volume: -14 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.35 } }],
  },
]
