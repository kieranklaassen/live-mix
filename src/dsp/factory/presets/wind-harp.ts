import { type FactoryPreset } from '../types'

export const WIND_HARP_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'harp-on-a-hill',
    name: 'Harp on a hill',
    category: 'pad',
    description:
      'A held chord left to the wind: harmonics light up and fade one after another, heard in a hall.',
    instrument: { deviceId: 'wind-harp', preset: 'Wind harp', params: { volume: -11 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'still-air-strings',
    name: 'Still air strings',
    category: 'string',
    description:
      'Strings in an almost steady breeze, mostly their own low notes, on a medium plate.',
    instrument: { deviceId: 'wind-harp', preset: 'Still air', params: { volume: -13.5 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } }],
  },
  {
    id: 'gale-in-the-wires',
    name: 'Gale in the wires',
    category: 'texture',
    description:
      'A hard wind whistling in the top harmonics of three strings a key, in a very large space.',
    instrument: { deviceId: 'wind-harp', preset: 'High gale', params: { volume: -8 } },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'lulls-over-water',
    name: 'Lulls over water',
    category: 'pad',
    description:
      'A wind that keeps dropping away and coming back, its swells repeated by a tape echo in a dark hall.',
    instrument: { deviceId: 'wind-harp', preset: 'Long lulls', params: { volume: -9 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'plucked-wind-course',
    name: 'Plucked wind course',
    category: 'string',
    description:
      'Four strings a key, plucked as the key goes down and then kept ringing by a light wind, close up.',
    instrument: { deviceId: 'wind-harp', preset: 'Plucked course', params: { volume: -20.5 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } }],
  },
  {
    id: 'far-glass-whistle',
    name: 'Far glass whistle',
    category: 'texture',
    description:
      'One string a key singing only its high harmonics, like a wet finger on glass, across a valley.',
    instrument: { deviceId: 'wind-harp', preset: 'Glass whistle', params: { volume: -6 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'low-wire-hum',
    name: 'Low wire hum',
    category: 'drone',
    description:
      'The low notes of the strings humming steadily under a faint wind, warmed and set in a room.',
    instrument: { deviceId: 'wind-harp', preset: 'Low hum', params: { volume: -17.5 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'sea-breeze-harp',
    name: 'Sea breeze harp',
    category: 'pad',
    description:
      'Gusts off the sea with the rush of the air around the strings, drifting in a chorus on a long plate.',
    instrument: { deviceId: 'wind-harp', preset: 'Sea breeze', params: { volume: -6 } },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'shimmering-course',
    name: 'Shimmering course',
    category: 'pad',
    description:
      'Four strings a key beating against each other while a firm wind climbs their harmonics, in a cathedral.',
    instrument: { deviceId: 'wind-harp', preset: 'Shimmer course', params: { volume: -10 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } }],
  },
  {
    id: 'slow-swell-on-tape',
    name: 'Slow swell on tape',
    category: 'pad',
    description:
      'No pluck at all: the chord fades in as the wind finds it and glows for a long time, on quarter inch tape.',
    instrument: { deviceId: 'wind-harp', preset: 'Slow swell', params: { volume: -11.5 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-bare-string',
    name: 'One bare string',
    category: 'string',
    description:
      'One string a key in a nearly steady wind, plucked and then held on a harmonic or two, dry through a preamp.',
    instrument: { deviceId: 'wind-harp', preset: 'Bare string', params: { volume: -14.5 } },
    effects: [{ deviceId: 'analog-drive', preset: 'First hint' }],
  },
  {
    id: 'fence-wire-drone',
    name: 'Fence wire drone',
    category: 'drone',
    description:
      'Wires humming on their own low notes while the wind whistles above them, through a spring tank.',
    instrument: { deviceId: 'wind-harp', preset: 'Fence wires', params: { volume: -10 } },
    effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } }],
  },
  {
    id: 'night-wind-strings',
    name: 'Night wind strings',
    category: 'texture',
    description:
      'Mostly the wind itself, gusting and dropping, with the strings faint inside it, down a dark well.',
    instrument: { deviceId: 'wind-harp', preset: 'Night wind', params: { volume: -11 } },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.3 } }],
  },
  {
    id: 'soft-wind-plucks',
    name: 'Soft wind plucks',
    category: 'string',
    description:
      'A clear pluck on every key that settles onto a harmonic or two the wind holds, with a dark echo on a small plate.',
    instrument: { deviceId: 'wind-harp', preset: 'Soft pluck' },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'ladder-of-overtones',
    name: 'Ladder of overtones',
    category: 'drone',
    description:
      'A low fifth whose harmonics are lit in turn as the wind climbs and falls, in a slow phaser.',
    instrument: { deviceId: 'wind-harp', preset: 'Overtone ladder', params: { volume: 0.5 } },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'far-storm-front',
    name: 'Far storm front',
    category: 'texture',
    description:
      'A full course in a storm that comes in waves, heard from far off in a low cathedral.',
    instrument: { deviceId: 'wind-harp', preset: 'Storm front', params: { volume: -3 } },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.35 } },
    ],
    preview: 'low',
  },
  {
    id: 'cassette-wind-harp',
    name: 'Cassette wind harp',
    category: 'pad',
    description:
      'The wind harp as a field recording: a four-track cassette and the room it was played back in.',
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Wind harp',
      params: { air: 0.4, ring: 3, volume: -11.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'turning-wind-strings',
    name: 'Turning wind strings',
    category: 'string',
    description:
      'Three strings a key in a calm wind through a slowly turning speaker, on a dark plate.',
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Still air',
      params: { strings: 3, wind: 0.3, glint: 0.6, volume: -12 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'wind-harp-in-grains',
    name: 'Wind harp in grains',
    category: 'texture',
    description: 'The lit harmonics broken into grains that scatter an octave up, in bright air.',
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Overtone ladder',
      params: { strings: 2, ring: 2, volume: -9 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'wind-and-octaves',
    name: 'Wind and octaves',
    category: 'drone',
    description: 'A humming low fifth with a faint octave added under and over it, in a vast nave.',
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Low hum',
      params: { wind: 0.3, glint: 0.5, volume: -12 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave', params: { sub1: 0.14 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } },
    ],
  },
]
