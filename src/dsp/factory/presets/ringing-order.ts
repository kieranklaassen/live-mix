import { type FactoryPreset } from '../types'

// Ringing Order turns the overtones of a key over like a band of ringers, so a
// preset here says who rings, in which order, and how far one ringer reaches
// into the next. Held phrases are chosen where the rows are long. Effects that
// add pitches of their own are left out: the order is the only melody. Rooms
// are kept under a third, or a tail would fill the gaps the rows are told by.

export const RINGING_ORDER_PRESETS: readonly FactoryPreset[] = [
  // Pads whose rows are fused.
  {
    id: 'ringing-order-rows-without-seam',
    name: 'Rows without a seam',
    category: 'pad',
    description:
      'Soft bells that overlap whole rows, so a held chord turns over from inside and never parts, in a warm hall.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Melted row',
      params: { row: 4.5, attack: 0.9, release: 4, beat: 0.5, volume: -12 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.28 } }],
  },
  {
    id: 'ringing-order-glass-tide',
    name: 'Tide in the glass',
    category: 'pad',
    description:
      'Rubbed glass in crossing lines, one climbing as the other falls in about three seconds, wide in a slow chorus.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Melted row',
      params: {
        voice: 2,
        method: 4,
        row: 2.8,
        overlap: 0.82,
        ringers: 8,
        tilt: -4,
        body: 0.6,
        attack: 0.18,
        cover: 0.42,
        place: 0.9,
        crossing: 0.4,
        release: 3.5,
        volume: 1,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.26 } },
    ],
  },
  // Keys, short and plain.
  {
    id: 'ringing-order-five-small-bells',
    name: 'Five small bells a key',
    category: 'keys',
    description:
      'Bright small bells: every key rings five overtones in under a second and stops soon after the hand, in a room.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Plain glass keys',
      params: {
        voice: 0,
        row: 0.9,
        overlap: 0.58,
        bite: 0.6,
        body: 0.5,
        cover: 0.3,
        tilt: -5,
        swing: 0.2,
        weight: 0.35,
        release: 1.1,
        place: 0.8,
        volume: -9,
      },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.22 } }],
  },
  {
    id: 'ringing-order-glass-under-fingers',
    name: 'Glass under fingers',
    category: 'keys',
    description:
      'Plain glass keys over a round steady tone, their four ringers swapping places quietly, on quarter inch tape.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Plain glass keys',
      params: {
        ringers: 4,
        row: 1.3,
        overlap: 0.62,
        cover: 0.6,
        bite: 0.2,
        tilt: -6,
        release: 1.4,
        beat: 1.4,
        body: 0.3,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } },
    ],
  },
  // Plucked, in canon.
  {
    id: 'ringing-order-strings-in-canon',
    name: 'Strings a row behind',
    category: 'plucked',
    description:
      'Plucked stacked fifths in canon: every key rolls a row behind the one before, some twice as slow, in a chamber.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Plucked canon',
      params: { row: 1.8, cover: 0.12, bite: 0.45, release: 3, volume: -8.6 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.24 } }],
    preview: 'chord',
  },
  {
    id: 'ringing-order-hunting-harp',
    name: 'Hunting harp',
    category: 'plucked',
    description:
      'A plucked key whose eight overtones hunt up and down in even steps, with one dark echo behind the hand.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Plucked canon',
      params: {
        tower: 0,
        method: 1,
        series: 0,
        ringers: 8,
        row: 1.6,
        overlap: 0.8,
        swing: 0.25,
        body: 0.6,
        tilt: -3,
        cover: 0.15,
        weight: 0.2,
        release: 2.2,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.22 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  // Basses under a covering tone.
  {
    id: 'ringing-order-tenor-behind',
    name: 'Tenor behind',
    category: 'bass',
    description:
      'A round reed bass: the covering tone holds the note and three low ringers lean on it one after another.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Covered bass',
      params: { row: 2.4, cover: 0.75, tilt: -7, body: 0.5, release: 0.5, volume: -9 },
    },
    effects: [{ deviceId: 'tape', preset: 'Warm thump' }],
  },
  {
    id: 'ringing-order-low-strings-roll',
    name: 'Low strings roll',
    category: 'bass',
    description:
      'A plucked bass that rolls down four low strings at every touch and again about each second, close in a small room.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Covered bass',
      params: {
        voice: 3,
        method: 0,
        ringers: 4,
        row: 1,
        overlap: 0.85,
        gap: 0.15,
        cover: 0.4,
        bite: 0.5,
        body: 0.6,
        tilt: -5,
        weight: -0.1,
        release: 0.6,
        volume: -7.5,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } }],
  },
  // Bells, half muffled.
  {
    id: 'ringing-order-every-second-in-leather',
    name: 'Every second in leather',
    category: 'bell',
    description:
      'A falling peal rung open and then in leather, row about, with a breath between them, across an open valley.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Half muffled bells',
      params: { row: 1.5, gap: 0.2, overlap: 0.82, volume: -8 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.26 } }],
    preview: 'hold',
  },
  {
    id: 'ringing-order-tower-over-water',
    name: 'Tower over water',
    category: 'bell',
    description:
      'Dark half muffled bells in stacked fifths, seven to a key and slow to fade, heard from a far shore.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Half muffled bells',
      params: {
        series: 2,
        method: 1,
        row: 2.6,
        overlap: 0.88,
        gap: 0.1,
        cover: 0.3,
        bite: 0.25,
        body: 0.35,
        tilt: -6,
        beat: 0.7,
        release: 6,
        volume: -5,
      },
    },
    effects: [
      { deviceId: 'distance', preset: 'Far shore' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.2 } },
    ],
  },
  // Drones that hum.
  {
    id: 'ringing-order-closed-mouths',
    name: 'Closed mouths by turns',
    category: 'drone',
    description:
      'A low hum in which one voice after another comes forward and sinks back, four seconds to a row, in a nave.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Slow hum',
      params: { row: 4, attack: 0.9, release: 6, body: 0.6, tilt: -4, volume: -10 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.28 } }],
  },
  {
    id: 'ringing-order-reed-ground',
    name: 'Ground of slow reeds',
    category: 'drone',
    description:
      'A steady low ground under odd overtones blown in pairs that trade places, rough with age and a little worn.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Slow hum',
      params: {
        voice: 1,
        method: 3,
        series: 1,
        ringers: 6,
        row: 5,
        overlap: 0.9,
        cover: 0.7,
        attack: 0.25,
        body: 0.7,
        tilt: -5,
        beat: 0.4,
        release: 5,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.24 } },
    ],
  },
  // Textures of breath.
  {
    id: 'ringing-order-air-changing-hands',
    name: 'Air changing hands',
    category: 'texture',
    description:
      'Bands of breath on stacked fifths that pass the note from one side to the other, thinly veiled.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Moving air',
      params: { tower: 0, row: 2.6, overlap: 0.85, cover: 0.2, volume: -2.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.24 } },
    ],
  },
  {
    id: 'ringing-order-whispers-in-a-ring',
    name: 'Whispers in a ring',
    category: 'texture',
    description:
      'Short breaths over the key, the top one leading and the low ones answering it, scattered as late points.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Moving air',
      params: {
        tower: 0,
        method: 2,
        series: 0,
        ringers: 8,
        row: 1.5,
        overlap: 0.6,
        attack: 0.04,
        body: 0.6,
        tilt: -2,
        cover: 0.1,
        bite: 0.5,
        place: 1,
        release: 2.5,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.22 } },
    ],
  },
  // Reeds and mouths that sing the chord.
  {
    id: 'ringing-order-chord-on-loan',
    name: 'Chord on loan',
    category: 'voice',
    description:
      'Reed voices where every key sings the tones of the others in turn, so the chord goes round itself in a chapel.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Reeds round a chord',
      params: { row: 2.8, attack: 0.08, bite: 0.3, volume: -6 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.26 } }],
  },
  {
    id: 'ringing-order-hummed-round',
    name: 'Hummed round',
    category: 'voice',
    description:
      'Hummed chord tones, key after key and one voice at a time, with a soft ensemble around them.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Reeds round a chord',
      params: {
        voice: 5,
        tower: 3,
        method: 0,
        row: 0.9,
        overlap: 0.86,
        ringers: 6,
        attack: 0.03,
        body: 0.8,
        tilt: -2,
        cover: 0.15,
        release: 2.4,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.24 } },
    ],
  },
  // Pulses that answer from two sides.
  {
    id: 'ringing-order-two-sides-of-a-street',
    name: 'Two sides of a street',
    category: 'plucked',
    description:
      'Plucked rolls that answer each other from left and right, one key’s row against the next, dry in a short room.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Answering sides',
      params: { row: 0.8, bite: 0.32, volume: -7.2 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.22 } }],
    preview: 'chord',
  },
  {
    id: 'ringing-order-swung-across',
    name: 'Swung across',
    category: 'bell',
    description:
      'Small bells in two broad strokes to a row, each key opposite the last, with short soft repeats from a tape.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Answering sides',
      params: {
        voice: 0,
        method: 1,
        row: 1.2,
        overlap: 0.66,
        swing: 0.9,
        weight: 0.3,
        ringers: 6,
        bite: 0.5,
        body: 0.45,
        tilt: -5,
        cover: 0.15,
        release: 2.6,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.22 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
    preview: 'chord',
  },
  // Clocks: one, and then another, over many rows.
  {
    id: 'ringing-order-quarter-past',
    name: 'Quarter past, on springs',
    category: 'bell',
    description:
      'A clock that strikes one overtone and then another, far apart, and takes many rows to come home, on long springs.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Quarter hour',
      params: { row: 1.6, body: 0.45, cover: 0.06, volume: -8 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.24 } }],
    preview: 'hold',
  },
  {
    id: 'ringing-order-clock-of-strings',
    name: 'Clock of strings',
    category: 'plucked',
    description:
      'Two plucked overtones to every row, wide apart and keeping time, in canon over the chord and one clean echo.',
    instrument: {
      deviceId: 'ringing-order',
      preset: 'Quarter hour',
      params: {
        voice: 3,
        tower: 1,
        series: 0,
        row: 1,
        overlap: 0.72,
        ringers: 8,
        tilt: -3,
        body: 0.7,
        bite: 0.45,
        cover: 0.12,
        release: 3,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { mix: 0.25 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
]
