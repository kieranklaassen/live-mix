import { type FactoryPreset } from '../types'

// Bent Blade is a place in the steel that keeps a note, so a preset here is
// first of all a decision about that place: how deep it is and what it keeps,
// whether there is a second one and how often the note goes over to it, what
// touches the steel, and how one key slides from another. Two presets stand
// for each of the instrument's ten directions. Effects that add pitches of
// their own are kept to octaves and fifths.

export const BENT_BLADE_PRESETS: readonly FactoryPreset[] = [
  // Steel soprano: one singing bend, trembled.
  {
    id: 'bent-blade-soprano-long-plate',
    name: 'Soprano of thin steel',
    category: 'voice',
    description:
      'One deep bend sings alone, shaken more than five times a second, sliding straight from key to key on a long plate.',
    instrument: { deviceId: 'bent-blade', preset: 'Steel soprano', params: { volume: -3 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
    preview: 'line',
  },
  {
    id: 'bent-blade-three-sopranos',
    name: 'Steel sopranos, nave',
    category: 'voice',
    description:
      'A chord of bowed blades, each shaken slowly and opened out of one note over two seconds, in a vast nave.',
    instrument: {
      deviceId: 'bent-blade',
      preset: 'Steel soprano',
      params: {
        tremble: 0.5,
        rate: 3.4,
        glide: 0.6,
        glideLaw: 2,
        edge: 0.5,
        swell: 0.9,
        wander: 0.6,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.35 } },
    ],
  },
  // Twin ghosts: the note goes over to its twin and comes back.
  {
    id: 'bent-blade-ghosts-dark-hall',
    name: 'Ghosts trade places',
    category: 'pad',
    description:
      'A bowed chord that goes over to a thin bright twin and comes back every eight seconds or so, in a dark hall.',
    instrument: { deviceId: 'bent-blade', preset: 'Twin ghosts', params: { volume: -2.2 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } }],
  },
  {
    id: 'bent-blade-ghosts-breathed',
    name: 'Breathed twins in fog',
    category: 'pad',
    description:
      'Breath instead of a bow, the sound of every key passing to its twin and back about once in three seconds, behind a veil.',
    instrument: {
      deviceId: 'bent-blade',
      preset: 'Twin ghosts',
      params: {
        exciter: 3,
        tunnel: 0.3,
        rasp: 0.35,
        bend: 0.75,
        edge: 0.4,
        swell: 1.2,
        volume: -7.5,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  // Mallet moons: struck low in a deep bend.
  {
    id: 'bent-blade-moons-warm-repeats',
    name: 'Moons over warm tape',
    category: 'bell',
    description:
      'Soft mallets on a deep bend, the ring handed to its twin and back within two seconds, with warm tape repeats in a hall.',
    instrument: { deviceId: 'bent-blade', preset: 'Mallet moons' },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.28 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 2 } },
    ],
  },
  {
    id: 'bent-blade-moon-octave-under',
    name: 'One low moon rising',
    category: 'keys',
    description:
      'A felt mallet with the second bend an octave under it, slow and round, rung long in a wide valley.',
    instrument: {
      deviceId: 'bent-blade',
      preset: 'Mallet moons',
      params: {
        volume: -11.5,
        secondWell: 3,
        tunnel: 0.35,
        edge: 0.1,
        rasp: 0.1,
        leak: 0.18,
        swell: 0.2,
        tremble: 0.4,
        rate: 1.2,
      },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 0 } },
    ],
  },
  // Sliding bass.
  {
    id: 'bent-blade-bass-slides-home',
    name: 'Bass that slides home',
    category: 'bass',
    description:
      'A firm short bow that slides straight from note to note in a third of a second, dry, warmed on tape.',
    instrument: { deviceId: 'bent-blade', preset: 'Sliding bass', params: { glide: 0.28 } },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.12 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 1.5 } },
    ],
  },
  {
    id: 'bent-blade-bass-tide',
    name: 'Bass with a tide in it',
    category: 'bass',
    description:
      'A dark bowed bass whose second bend an octave below takes the sound and gives it back a little under once a second.',
    instrument: {
      deviceId: 'bent-blade',
      preset: 'Sliding bass',
      params: {
        volume: -4,
        secondWell: 3,
        tunnel: 0.8,
        farWell: 0.6,
        pressure: 0.4,
        glide: 0.15,
        bend: 0.6,
        damp: 0.6,
        edge: 0.35,
        swell: 0.06,
        glideLaw: 1,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 2.2 } },
    ],
  },
  // Clang keys: a shallow bend and plenty of plain steel.
  {
    id: 'bent-blade-clang-stairwell',
    name: 'Clang down the stairs',
    category: 'keys',
    description:
      'Hard mallets on almost straight steel, more clang than note, heard down a stone stairwell.',
    instrument: { deviceId: 'bent-blade', preset: 'Clang keys' },
    effects: [
      { deviceId: 'distance', preset: 'Stone stairwell' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
    ],
  },
  {
    id: 'bent-blade-struck-offcuts',
    name: 'Offcuts on a bench',
    category: 'keys',
    description:
      'A thumbnail snapped on a shallow bend with its steel left to its own places, short and dry on two springs.',
    instrument: {
      deviceId: 'bent-blade',
      preset: 'Clang keys',
      params: {
        exciter: 2,
        bend: 0.22,
        edge: 0.6,
        leak: 0.65,
        concord: 0.25,
        damp: 0.8,
        pressure: 0.6,
      },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.22 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 2.5 } },
    ],
  },
  // Still line drones: nothing shakes.
  {
    id: 'bent-blade-line-open-valley',
    name: 'A line that stays put',
    category: 'drone',
    description:
      'A bowed chord with nothing shaking in it, passing to the octave below and back slower than once in ten seconds, over an open valley.',
    instrument: { deviceId: 'bent-blade', preset: 'Still line drone', params: { volume: -9 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'bent-blade-still-hum-blur',
    name: 'Humming plough steel',
    category: 'drone',
    description:
      'One deep bend bowed softly and left still, dark, its notes drawn into tune and softly blurred on a long plate.',
    instrument: {
      deviceId: 'bent-blade',
      preset: 'Still line drone',
      params: {
        volume: -2.5,
        secondWell: 0,
        bend: 0.95,
        edge: 0.3,
        pressure: 0.1,
        steel: 0.2,
        wellWidth: 0.6,
        rasp: 0.3,
        wander: 0.5,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Faint haze' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  // Fifth choirs: the second bend a fifth above, a tone under both.
  {
    id: 'bent-blade-choir-open-fifths',
    name: 'Fifths under one roof',
    category: 'voice',
    description:
      'Bowed steel with a second bend a fifth above and a low tone under both, coming and going every three seconds, in a cathedral.',
    instrument: { deviceId: 'bent-blade', preset: 'Fifth choir' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } }],
  },
  {
    id: 'bent-blade-choir-struck-fifths',
    name: 'Fifths rung and left',
    category: 'keys',
    description:
      'Soft mallets that wake a fifth above and an octave under each key a moment after the blow, in an airy tail.',
    instrument: {
      deviceId: 'bent-blade',
      preset: 'Fifth choir',
      params: {
        volume: -9.5,
        exciter: 1,
        tunnel: 0.9,
        leak: 0.2,
        damp: 0.1,
        swell: 0.05,
        glide: 0.01,
        edge: 0.5,
        steel: 0.05,
        tremble: 0,
      },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 0 } },
    ],
  },
  // Thumb plucks.
  {
    id: 'bent-blade-thumb-small-tin',
    name: 'Thumbed tongues of tin',
    category: 'plucked',
    description: 'Dry thumb plucks on crowded trapped notes, let go at once, inside a small tin.',
    instrument: { deviceId: 'bent-blade', preset: 'Thumb plucks' },
    effects: [
      { deviceId: 'vessel', preset: 'Small tin' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 0 } },
    ],
  },
  {
    id: 'bent-blade-thumb-octave-echo',
    name: 'Deep thumb, dark echo',
    category: 'plucked',
    description:
      'A deep thumb with the octave below under it, rung out slowly while dark echoes fall behind.',
    instrument: {
      deviceId: 'bent-blade',
      preset: 'Deep thumb',
      params: { leak: 0.22, tunnel: 0.8 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 0 } },
    ],
  },
  // Breath on steel.
  {
    id: 'bent-blade-breath-along-blade',
    name: 'Breath along the blade',
    category: 'wind',
    description:
      'Air blown over a bent blade, half note and half hiss, sliding from key to key in a bright chamber.',
    instrument: {
      deviceId: 'bent-blade',
      preset: 'Breath on steel',
      params: { volume: 0, glide: 0.4, secondWell: 0, bend: 0.8 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.25 } }],
  },
  {
    id: 'bent-blade-gusts-over-steel',
    name: 'Gusts on loose sheets',
    category: 'texture',
    description:
      'Wind in slow gusts that jumps from trapped note to trapped note and stirs the loose steel, heard across open air.',
    instrument: {
      deviceId: 'bent-blade',
      preset: 'Breath on steel',
      params: {
        volume: -11.5,
        wander: 1,
        steel: 0.9,
        concord: 0.1,
        rasp: 0.8,
        edge: 0.75,
        bend: 0.35,
        tunnel: 2.2,
        swell: 1.5,
      },
    },
    effects: [
      { deviceId: 'distance', preset: 'Open air' },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.3 } },
    ],
  },
  // Wavering bells: a bend that splits every note in two.
  {
    id: 'bent-blade-bells-that-shiver',
    name: 'Bells that shiver',
    category: 'bell',
    description:
      'Bright mallets on a deep bend split so wide that every note shivers many times a second, on a bright plate.',
    instrument: { deviceId: 'bent-blade', preset: 'Wavering bells' },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 3.5 } },
    ],
  },
  {
    id: 'bent-blade-bells-slow-doubles',
    name: 'Slow double bells',
    category: 'bell',
    description:
      'Bells of two bends that beat one or two times a second, with a faint glimmer an octave up behind them.',
    instrument: {
      deviceId: 'bent-blade',
      preset: 'Wavering bells',
      params: {
        volume: -10.5,
        tunnel: 1.1,
        farWell: 0.6,
        edge: 0.5,
        concord: 0.7,
        wellWidth: 0.35,
        steel: 0.1,
        leak: 0.22,
      },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 0 } },
    ],
  },
]
