import { type FactoryPreset } from '../types'

export const DROPLETS_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'glass-raindrops',
    name: 'Glass raindrops',
    category: 'bell',
    description: 'Bright glass drops scattered over the notes you hold, in a small room.',
    instrument: { deviceId: 'droplets', preset: 'Glass rain', params: { volume: -11.7 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } }],
    preview: 'chord',
  },
  {
    id: 'dripping-cave',
    name: 'Dripping cave',
    category: 'texture',
    description: 'Large slow drops, one at a time on the held notes, ringing out in a dark cave.',
    instrument: { deviceId: 'droplets', preset: 'Slow drip', params: { rain: 1.4, volume: -13 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.35 } }],
    preview: 'chord',
  },
  {
    id: 'wooden-clockwork',
    name: 'Wooden clockwork',
    category: 'keys',
    description:
      'An even pulse of wooden bars that climbs the held chord in order, on a small plate.',
    instrument: { deviceId: 'droplets', preset: 'Wood pulse', params: { volume: -8 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } }],
    preview: 'chord',
  },
  {
    id: 'bell-metal-shower',
    name: 'Bell metal shower',
    category: 'bell',
    description: 'A fast shower of small bells over three octaves of the held notes, in a hall.',
    instrument: { deviceId: 'droplets', preset: 'Metal shower', params: { volume: -9.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'pond-in-the-rain',
    name: 'Pond in the rain',
    category: 'texture',
    description:
      'Tuned bubbles and splashes of drops going into water, repeated by a warm tape echo.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Water drops',
      params: { rain: 5, soft: 0.4, splash: 0.4, volume: -9.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'chord',
  },
  {
    id: 'felt-patter-close',
    name: 'Felt patter close',
    category: 'keys',
    description: 'Muted felt thumps pattering on the held notes, close and nearly dry.',
    instrument: { deviceId: 'droplets', preset: 'Felt patter', params: { volume: -8 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth' }],
    preview: 'chord',
  },
  {
    id: 'drizzle-of-bells',
    name: 'Drizzle of bells',
    category: 'bell',
    description:
      'A drizzle of small bells over three octaves, ringing long and going on after the keys, in a very large space.',
    instrument: { deviceId: 'droplets', preset: 'Bell drizzle', params: { volume: -10.5 } },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } }],
    preview: 'chord',
  },
  {
    id: 'glass-staircase',
    name: 'Glass staircase',
    category: 'keys',
    description:
      'A steady glass pulse that climbs the chord and then its octaves, with a clean echo behind it.',
    instrument: { deviceId: 'droplets', preset: 'Glass pulse' },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { mix: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
    preview: 'chord',
  },
  {
    id: 'gusts-of-rain',
    name: 'Gusts of rain',
    category: 'texture',
    description:
      'Glass drops that come in flurries with lulls between them, widened and left in an airy hall.',
    instrument: { deviceId: 'droplets', preset: 'Flurries', params: { soft: 0.6, volume: -8.5 } },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'deep-well-drops',
    name: 'Deep well drops',
    category: 'texture',
    description:
      'Big slow bubbles at the pitch of the keys with heavy splashes, far down in a cathedral.',
    instrument: { deviceId: 'droplets', preset: 'Deep pool', params: { rain: 2, volume: -14.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } }],
    preview: 'chord',
  },
  {
    id: 'rain-on-the-deck',
    name: 'Rain on the deck',
    category: 'texture',
    description:
      'A dense patter of small wooden notes spread wide, each with its knock, in a tight room.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Wood ticks',
      params: { soft: 0.5, size: 0.2, ring: 1.5, volume: -8.5 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Tight room' }],
    preview: 'chord',
  },
  {
    id: 'muted-felt-pulse',
    name: 'Muted felt pulse',
    category: 'keys',
    description:
      'Large soft felt notes in an even pulse round the held keys, through tape into a chamber.',
    instrument: { deviceId: 'droplets', preset: 'Felt pulse', params: { volume: -13.5 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.22 } },
    ],
    preview: 'chord',
  },
  {
    id: 'high-glass-glitter',
    name: 'High glass glitter',
    category: 'bell',
    description: 'Tiny glass drops up to three octaves above the keys, spread wide in bright air.',
    instrument: {
      deviceId: 'droplets',
      preset: 'High glitter',
      params: { soft: 0.5, volume: -9.8 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'tin-roof-downpour',
    name: 'Tin roof downpour',
    category: 'texture',
    description: 'A downpour of short metal taps with loud ticks, heard through a worn cassette.',
    instrument: { deviceId: 'droplets', preset: 'Tin roof', params: { volume: -9.5 } },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'chord',
  },
  {
    id: 'chimes-across-valley',
    name: 'Chimes across valley',
    category: 'bell',
    description:
      'Slow, large, long bell notes with no tick, carrying on long after the keys in an open valley.',
    instrument: { deviceId: 'droplets', preset: 'Long chimes', params: { rain: 1.6 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.4 } }],
    preview: 'chord',
  },
  {
    id: 'bubbling-brook',
    name: 'Bubbling brook',
    category: 'texture',
    description:
      'A fast stream of small tuned bubbles in gusts, slowly coloured by a phaser, in a room.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Bubble stream',
      params: { soft: 0.3, ring: 2, volume: -8.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Faint shade' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'backwards-raindrops',
    name: 'Backwards raindrops',
    category: 'texture',
    description: 'Water drops, each followed by its own echo played backwards, in a hall.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Water drops',
      params: { rain: 3.5, soft: 0.4, splash: 0.3, volume: -9 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'glass-echo-garden',
    name: 'Glass echo garden',
    category: 'bell',
    description: 'Sparse large glass drops, each repeated by three tape heads over a long plate.',
    instrument: { deviceId: 'droplets', preset: 'Slow drip', params: { rain: 1.2, size: 0.55 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'rain-turned-to-mist',
    name: 'Rain turned to mist',
    category: 'texture',
    description: 'A bell shower smeared by a spectral blur until the drops run into a held haze.',
    instrument: { deviceId: 'droplets', preset: 'Metal shower', params: { splash: 0 } },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'marimba-rain-spring',
    name: 'Marimba rain spring',
    category: 'keys',
    description:
      'Loose wooden notes at the pitch of the keys, a little driven, with a hint of spring tank.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Wood pulse',
      params: { loose: 0.7, rain: 5, spread: 0, ring: 2, trail: 2, volume: -11.5 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
    preview: 'chord',
  },
]
