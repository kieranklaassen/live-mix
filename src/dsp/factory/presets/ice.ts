import { type FactoryPreset } from '../types'

export const ICE_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'frozen-lake-hall',
    name: 'Frozen lake hall',
    category: 'bell',
    description:
      'Strikes on a frozen lake: each falls in a short chirp onto its note, with echoes off the shores, in a hall.',
    instrument: { deviceId: 'ice', preset: 'Frozen lake', params: { volume: -4.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'near-ice-pings',
    name: 'Near ice pings',
    category: 'bell',
    description:
      'The ice struck close by: plain glassy pings with a brittle snap, on a small plate.',
    instrument: { deviceId: 'ice', preset: 'Near ping', params: { volume: -1 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } }],
  },
  {
    id: 'far-crack-valley',
    name: 'Far crack valley',
    category: 'bell',
    description:
      'Cracks from the far side of the lake: long chirps that gather as they fall onto the notes and echo down a valley.',
    instrument: { deviceId: 'ice', preset: 'Far crack', params: { volume: -5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
  },
  {
    id: 'thin-ice-glints',
    name: 'Thin ice glints',
    category: 'bell',
    description: 'Thin ice, all overtones and snap, widened a little and left in an airy tail.',
    instrument: { deviceId: 'ice', preset: 'Thin ice', params: { ring: 4, volume: -2 } },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'thick-ice-toll',
    name: 'Thick ice toll',
    category: 'bell',
    description:
      'Thick ice: round notes with a deep body an octave under them, tolling in a dark hall.',
    instrument: { deviceId: 'ice', preset: 'Thick ice', params: { volume: -3.5 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'night-lake-cracks',
    name: 'Night lake cracks',
    category: 'texture',
    description:
      'One held note and the lake does the rest: far cracks chirp down onto it from all sides in a very large space.',
    instrument: { deviceId: 'ice', preset: 'Lake at night', params: { cracks: 0.85, volume: -4 } },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } }],
  },
  {
    id: 'ice-bell-echoes',
    name: 'Ice bell echoes',
    category: 'bell',
    description:
      'Long clear ice bells with hardly a chirp, repeated by a tape echo on a medium plate.',
    instrument: { deviceId: 'ice', preset: 'Ice bells', params: { volume: -1 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  {
    id: 'brittle-ice-taps',
    name: 'Brittle ice taps',
    category: 'bell',
    description: 'Short taps on thin ice with a brittle snap, close in a tight room.',
    instrument: {
      deviceId: 'ice',
      preset: 'Brittle snap',
      params: { ring: 2, crack: 0.4, volume: 5.5 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.5 } }],
    preview: 'keys',
  },
  {
    id: 'far-shore-answers',
    name: 'Far shore answers',
    category: 'bell',
    description:
      'Every strike is answered three times from the far shores, later and darker, and once more backwards.',
    instrument: { deviceId: 'ice', preset: 'Far shores', params: { volume: -5 } },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Faint reflection' },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'slow-thaw-drone',
    name: 'Slow thaw drone',
    category: 'drone',
    description:
      'Thick ice far off, ringing for a long time and cracking softly by itself, caught and held as a dark bed.',
    instrument: { deviceId: 'ice', preset: 'Slow thaw', params: { cracks: 0.7, volume: -4.5 } },
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'falling-ice-tape',
    name: 'Falling ice tape',
    category: 'bell',
    description:
      'Thin ice struck far off: a long thin chirp falling from very high onto a short zing, on tape in bright air.',
    instrument: { deviceId: 'ice', preset: 'Zing', params: { volume: -3.5 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'deep-floe-drone',
    name: 'Deep floe drone',
    category: 'drone',
    description:
      'A deep floe of thick ice that rings on and cracks now and then, blurred into dark water in a vast nave.',
    instrument: {
      deviceId: 'ice',
      preset: 'Deep floe',
      params: { cracks: 0.75, width: 0.5, volume: -15 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { width: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stiff-plate-chimes',
    name: 'Stiff plate chimes',
    category: 'bell',
    description:
      'The overtones pulled far sharp, as a stiff plate rings: clangorous chimes with a faint glimmer above them.',
    instrument: { deviceId: 'ice', preset: 'Plate tones', params: { volume: -3.5 } },
    effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer' }],
    preview: 'keys',
  },
  {
    id: 'restless-ice-field',
    name: 'Restless ice field',
    category: 'texture',
    description:
      'A held chord on a lake that will not settle: quick short cracks near and far, glinting an octave up, in a hall.',
    instrument: { deviceId: 'ice', preset: 'Restless ice', params: { crack: 0.15, volume: -7 } },
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints', params: { pitch: 12 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'clear-ice-ping',
    name: 'Clear ice ping',
    category: 'bell',
    description:
      'One clean falling ping per key, no snap, no echoes, no cracks, close in a small booth.',
    instrument: { deviceId: 'ice', preset: 'Clear ping', params: { volume: -2 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.18 } }],
    preview: 'keys',
  },
  {
    id: 'ice-field-shortwave',
    name: 'Ice field shortwave',
    category: 'texture',
    description:
      'A distant ice field cracking under one held note, heard over shortwave at night with a little static.',
    instrument: { deviceId: 'ice', preset: 'Distant field', params: { cracks: 0.8, volume: -1.5 } },
    effects: [
      { deviceId: 'radio', preset: 'Night shortwave', params: { static: 0.08, interference: 0 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'sprung-ice-drips',
    name: 'Sprung ice drips',
    category: 'bell',
    description:
      'Falling chirps of ice into the rising chirps of a slack spring tank: every strike splashes both ways.',
    instrument: {
      deviceId: 'ice',
      preset: 'Far crack',
      params: { distance: 0.75, ring: 1.5, shore: 0.2, cracks: 0, volume: -6 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { width: 0.15, mix: 0.4 } },
    ],
  },
  {
    id: 'turning-ice-bells',
    name: 'Turning ice bells',
    category: 'bell',
    description: 'Long ice bells turned slowly by a phaser and left to ring on a long plate.',
    instrument: {
      deviceId: 'ice',
      preset: 'Ice bells',
      params: { thick: 0.35, stretch: 0.2, volume: 4.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { stereo: 0 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'frost-grain-cloud',
    name: 'Frost grain cloud',
    category: 'texture',
    description:
      'Thin ice cracking fast under one held note, scattered into a soft cloud of grains in a still room.',
    instrument: {
      deviceId: 'ice',
      preset: 'Thin ice',
      params: { cracks: 0.9, roam: 1, ring: 3, crack: 0.2, volume: 2.5 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Soft cloud' },
      { deviceId: 'bloom-reverb', preset: 'Still room' },
    ],
  },
  {
    id: 'beneath-the-lake',
    name: 'Beneath the lake',
    category: 'drone',
    description:
      'The lake heard from below at half speed: slow dark swoops an octave down onto low notes, among low voices.',
    instrument: {
      deviceId: 'ice',
      preset: 'Thick ice',
      params: { distance: 0.9, bright: 0.2, cracks: 0.8, roam: 0.7, volume: -3 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed' },
      { deviceId: 'vowel-reverb', preset: 'Low monks' },
    ],
  },
]
