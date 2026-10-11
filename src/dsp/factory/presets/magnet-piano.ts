import { type FactoryPreset } from '../types'

// A piano sung by magnets: the keys presets carry a felt strike under the
// swell, the pads have none, and the ones whose fed harmonic is not an
// octave of the note (or wanders) are previewed with one line.
export const MAGNET_PIANO_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'felt-magnet-piano',
    name: 'Felt magnet piano',
    category: 'keys',
    description:
      'A soft felt strike on each note with the magnets swelling it afterwards, in a room.',
    instrument: { deviceId: 'magnet-piano', preset: 'Felt and magnets', params: { volume: -8.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'soft-hammer-plate',
    name: 'Soft hammer plate',
    category: 'keys',
    description:
      'Mostly the felt hammer, round and woody, with a slow swell far behind it, on a plate.',
    instrument: { deviceId: 'magnet-piano', preset: 'Soft hammer', params: { volume: -6 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } }],
  },
  {
    id: 'dark-wood-upright',
    name: 'Dark wood upright',
    category: 'keys',
    description: 'All soundboard and a little hammer through a preamp, close in a small booth.',
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Dark wood',
      params: { hammer: 0.6, volume: -14 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } },
    ],
  },
  {
    id: 'quick-reed-keys',
    name: 'Quick reed keys',
    category: 'keys',
    description:
      'The magnets speak at once and stop at once, like a small reed organ, on tape in a tight room.',
    instrument: { deviceId: 'magnet-piano', preset: 'Quick reed', params: { volume: -13 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'ringing-room-keys',
    name: 'Ringing room keys',
    category: 'keys',
    description: 'Struck notes left to ring into each other, with warm tape repeats in a hall.',
    instrument: { deviceId: 'magnet-piano', preset: 'Ringing room', params: { hammer: 0.7 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bowed-glass-keys',
    name: 'Bowed glass keys',
    category: 'keys',
    description:
      'Notes that speak like a bow on glass, quick and bright, with faint chorus in a bright hall.',
    instrument: { deviceId: 'magnet-piano', preset: 'Bowed glass', params: { volume: -8.5 } },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air' },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'felt-strike-echoes',
    name: 'Felt strike echoes',
    category: 'keys',
    description:
      'A full, brighter felt strike on bare strings with the swell held back, repeated by a dark echo.',
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Felt and magnets',
      params: { hammer: 1, bloom: 4, bright: 0.6, damper: 1.2, body: 0.1 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'pure-tone-keys',
    name: 'Pure tone keys',
    category: 'keys',
    description:
      'One pure tone per key with a light strike in front, turning slowly in a rotary cabinet.',
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Still sine',
      params: { bloom: 0.12, hammer: 0.45, damper: 0.8, volume: -18 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'glass-swell-pad',
    name: 'Glass swell pad',
    category: 'pad',
    description: 'Each note rises out of nothing, glassy and nearly pure, and hangs in a hall.',
    instrument: { deviceId: 'magnet-piano', preset: 'Glass swell', params: { volume: -12.5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'wide-shimmer-pad',
    name: 'Wide shimmer pad',
    category: 'pad',
    description:
      'The three strings of every note tuned well apart, beating from side to side in open space.',
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Wide shimmer',
      params: { width: 0.8, volume: -13 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } }],
  },
  {
    id: 'octave-halo-swell',
    name: 'Octave halo swell',
    category: 'pad',
    description:
      'The magnets feed the octave of each string and the other strings ring along, in a long plate.',
    instrument: { deviceId: 'magnet-piano', preset: 'Octave halo', params: { volume: -12 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
  },
  {
    id: 'magnet-strings-tape',
    name: 'Magnet strings tape',
    category: 'pad',
    description:
      'A fuller swell with more harmonics, like slow strings, on drifting tape in a dark hall.',
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Bowed glass',
      params: { bloom: 0.9, bright: 0.65, damper: 2.5, body: 0.5, volume: -14.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'dark-wood-phase',
    name: 'Dark wood phase',
    category: 'pad',
    description:
      'The woody soundboard without its hammer, swelling slowly through a slow phaser in a chamber.',
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Dark wood',
      params: { hammer: 0, harmonic: 1.5, bloom: 1.8, damper: 2.5, volume: -6 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.35, stereo: 0 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'slow-tide-swell',
    name: 'Slow tide swell',
    category: 'pad',
    description:
      'A slow swell whose fed harmonic drifts up the string and back like a tide, in a cathedral.',
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Slow tide',
      params: { bloom: 2, width: 0.3, volume: -4.5 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.13 } }],
    preview: 'line',
  },
  {
    id: 'overtone-choir-chapel',
    name: 'Overtone choir',
    category: 'pad',
    description:
      'The magnets wander over the harmonics of each string like overtone singing, in a chapel of voices.',
    instrument: { deviceId: 'magnet-piano', preset: 'Overtone choir', params: { volume: -4.5 } },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.3 } }],
    preview: 'line',
  },
  {
    id: 'whistling-magnets',
    name: 'Whistling magnets',
    category: 'pad',
    description:
      'Only the eighth harmonic of each string, a high pure whistle, answered backwards from far away.',
    instrument: { deviceId: 'magnet-piano', preset: 'High whistle' },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'ripple-harmonics',
    name: 'Ripple harmonics',
    category: 'pad',
    description:
      'The fed harmonic runs quickly up and down the string, a ripple of overtones scattered into grains.',
    instrument: { deviceId: 'magnet-piano', preset: 'Ripple' },
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
    preview: 'hold',
  },
  {
    id: 'twelfth-magnet-organ',
    name: 'Twelfth magnet organ',
    category: 'pad',
    description:
      'The magnets feed the third harmonic, so each key sounds its twelfth like an organ stop, in a room.',
    instrument: { deviceId: 'magnet-piano', preset: 'Twelfth organ', params: { volume: -8 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } }],
    preview: 'line',
  },
  {
    id: 'low-magnets-drone',
    name: 'Low magnets drone',
    category: 'drone',
    description:
      'Low strings sung on their fundamental with five harmonics let in above it, thick and slowly beating, with tape weight in a cave.',
    instrument: { deviceId: 'magnet-piano', preset: 'Low magnets', params: { volume: -12 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -8.5 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sympathetic-magnet-drone',
    name: 'Sympathetic drone',
    category: 'drone',
    description:
      'Two low strings swell and set each other and a bank of tuned strings ringing, in a vast nave.',
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Ringing room',
      params: { hammer: 0, bright: 0.5, bloom: 1.5, volume: -11 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Long ring', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } },
    ],
  },
]
