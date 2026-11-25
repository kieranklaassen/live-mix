import { type FactoryPreset } from '../types'

// Tierce Bells has its third as a control, so a preset here is first of all a
// decision about the third: given by a key, gliding from one to another inside
// the strike, or left where it is neither major nor minor. The preview phrases
// are on the white keys; a carillon in a key with a black one in it still
// gives every white key of its scale the third that key has there. Effects
// that add pitches of their own are kept to octaves and fifths, so that the
// only third in the sound is the bell's.

export const TIERCE_BELLS_PRESETS: readonly FactoryPreset[] = [
  // Carillons: the third of every bell is the scale's.
  {
    id: 'tierce-bells-square-in-c',
    name: 'Carillon over a square',
    category: 'bell',
    description:
      'Tower bells in C major across an open valley: C, F and G ring major, D, E, A and B minor.',
    instrument: { deviceId: 'tierce-bells', preset: 'Tower in C major' },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 4.5 } },
    ],
    preview: 'keys',
  },
  {
    id: 'tierce-bells-d-minor-echo',
    name: 'Carillon with one echo',
    category: 'bell',
    description:
      'Short bright tower bells in D minor, where F, B flat and C ring major, each with one echo a third of a second late.',
    instrument: { deviceId: 'tierce-bells', preset: 'Carillon in D minor' },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 333, feedback: 0 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 7 } },
    ],
    preview: 'keys',
  },
  {
    id: 'tierce-bells-lydian-air',
    name: 'Lydian bells, bright air',
    category: 'bell',
    description:
      'A bright warbling carillon in F Lydian, its pairs beating 1.6 times a second, in bright air.',
    instrument: { deviceId: 'tierce-bells', preset: 'Lydian carillon' },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 11 } },
    ],
  },
  {
    id: 'tierce-bells-muffled-next-door',
    name: 'Muffled peal next door',
    category: 'bell',
    description:
      'A muffled peal in G Mixolydian with F ringing major, short and dull, heard through a wall.',
    instrument: { deviceId: 'tierce-bells', preset: 'Muffled peal' },
    effects: [
      { deviceId: 'distance', preset: 'Next door' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 10 } },
    ],
    preview: 'keys',
  },
  {
    id: 'tierce-bells-fifth-rings-major',
    name: 'The fifth rings major',
    category: 'bell',
    description:
      'Long soft bells in A harmonic minor: A rings minor and its fifth E rings major, in a warm hall.',
    instrument: { deviceId: 'tierce-bells', preset: 'Changing keys' },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 4.5 } },
    ],
  },
  {
    id: 'tierce-bells-phrygian-handbells',
    name: 'Phrygian handbells',
    category: 'bell',
    description:
      'Soft handbells in E Phrygian, the note and its twelfth with a minor third on E, on a long plate.',
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Soft handbells',
      params: { root: 4, scale: 3 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 5.5 } },
    ],
    preview: 'keys',
  },
  {
    id: 'tierce-bells-handbells-on-tape',
    name: 'Handbell choir on tape',
    category: 'keys',
    description:
      'Handbells in C major, damped soon after the key is let go, close up on quarter inch tape in a room.',
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Handbells in C',
      params: { release: 0.5 },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 6.5 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  // Suspensions: the third moves inside the strike.
  {
    id: 'tierce-bells-four-to-three',
    name: 'Four to three, cathedral',
    category: 'bell',
    description:
      'One strike begins on a fourth and settles on a major third five seconds later, in a cathedral.',
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Four to three',
      params: { glide: 5 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 5.5 } },
    ],
    preview: 'hold',
  },
  {
    id: 'tierce-bells-four-to-three-back',
    name: 'Four to three, reversed',
    category: 'bell',
    description:
      'A fourth that falls to a major third in three seconds, with the fall played backwards behind it.',
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Four to three',
      params: { glide: 3, decay: 12 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.35 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 7.5 } },
    ],
    preview: 'line',
  },
  {
    id: 'tierce-bells-falling-echoes',
    name: 'Falling thirds, echoes',
    category: 'bell',
    description:
      'Every strike falls from a major third to a minor one in four seconds while tape echoes fade under it.',
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Falling thirds',
      params: { glide: 4 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 6.5 } },
    ],
    preview: 'line',
  },
  {
    id: 'tierce-bells-rising-handbells',
    name: 'Rising handbells',
    category: 'bell',
    description:
      'Handbells whose third climbs from minor to major in two and a half seconds, with a glint a twelfth above.',
    instrument: { deviceId: 'tierce-bells', preset: 'Rising handbells' },
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 6.5 } },
    ],
  },
  {
    id: 'tierce-bells-rubbed-suspension',
    name: 'Rubbed suspension',
    category: 'pad',
    description:
      'Rubbed bells that start a semitone over their thirds and come down in five seconds, each to its own in C major.',
    instrument: { deviceId: 'tierce-bells', preset: 'Rubbed suspension' },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 1 } },
    ],
  },
  // The undecided bell: a third between minor and major.
  {
    id: 'tierce-bells-undecided',
    name: 'Undecided bell',
    category: 'bell',
    description:
      'A tower bell whose third is 11/9, half way between minor and major, beating slowly in a dark hall.',
    instrument: { deviceId: 'tierce-bells', preset: 'Neutral tower' },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 5.5 } },
    ],
  },
  {
    id: 'tierce-bells-leaves-the-minor',
    name: 'Leaving the minor',
    category: 'drone',
    description:
      'A low fifth of bells whose thirds leave minor and take eight seconds to get half way to major, on worn tape.',
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Neutral tower',
      params: { lean: -31.77, glide: 8, quint: 0.2, hardness: 0.3, humLevel: 0.6 },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 5.5 } },
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'tierce-bells-open-fourth-hall',
    name: 'No third at all',
    category: 'bell',
    description:
      'The third is moved up to a fourth and the fifth taken out: an open bell that is neither, in an airy tail.',
    instrument: { deviceId: 'tierce-bells', preset: 'Open fourth' },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 7.2 } },
    ],
    preview: 'line',
  },
  // Towers, old, cast low and broken.
  {
    id: 'tierce-bells-old-tower-hill',
    name: 'Old tower, far hill',
    category: 'bell',
    description:
      'An old bell with its hum a minor seventh under the note and a narrow minor third, heard from a far shore.',
    instrument: { deviceId: 'tierce-bells', preset: 'Old tower' },
    effects: [
      { deviceId: 'distance', preset: 'Far shore' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 5 } },
    ],
    preview: 'line',
  },
  {
    id: 'tierce-bells-ninth-below-strings',
    name: 'Ninth below, strings',
    category: 'drone',
    description:
      'Deep bells whose hum lies a ninth under the note, with a pedal of strings that rings along.',
    instrument: { deviceId: 'tierce-bells', preset: 'Hum a ninth below' },
    effects: [
      { deviceId: 'sympathetic', preset: 'Piano pedal', params: { mix: 0.35 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 5 } },
    ],
  },
  {
    id: 'tierce-bells-cracked-on-disc',
    name: 'Cracked bell on a disc',
    category: 'bell',
    description:
      'A cracked bell with a flat hum and pairs that beat four times a second, on a worn disc from a market.',
    instrument: { deviceId: 'tierce-bells', preset: 'Cracked tower' },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 11.5 } },
      { deviceId: 'vinyl', preset: 'Charity shop find' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } },
    ],
  },
  // Small clocks.
  {
    id: 'tierce-bells-mantel-clock',
    name: 'Clock in its case',
    category: 'bell',
    description:
      'A mantel clock striking in C major inside a wooden case: a bright octave and a third, gone in about three seconds.',
    instrument: { deviceId: 'tierce-bells', preset: 'Mantel clock' },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 8 } },
    ],
    preview: 'keys',
  },
  {
    id: 'tierce-bells-hall-clock',
    name: 'Clock down the hall',
    category: 'bell',
    description:
      'A hall clock with a minor third and a low hum that goes on after the strike, down a stone stairwell.',
    instrument: { deviceId: 'tierce-bells', preset: 'Hall clock' },
    effects: [
      { deviceId: 'distance', preset: 'Stone stairwell' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 10 } },
    ],
    preview: 'line',
  },
  {
    id: 'tierce-bells-tiny-carillon',
    name: 'Tiny carillon, springs',
    category: 'keys',
    description:
      'A carillon of little bells in G major, still and without hum, stopped early, in a two spring tank.',
    instrument: { deviceId: 'tierce-bells', preset: 'Tiny carillon' },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 5.5 } },
    ],
  },
  // Rubbed beds.
  {
    id: 'tierce-bells-rubbed-bed',
    name: 'Rubbed bed in C',
    category: 'pad',
    description:
      'A held chord of rubbed bells that swell while the keys are down, each with its third in C major, in a hall.',
    instrument: { deviceId: 'tierce-bells', preset: 'Rubbed in C major', params: { volume: -6 } },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 1 } },
    ],
  },
  {
    id: 'tierce-bells-old-rim-fog',
    name: 'Old rim in fog',
    category: 'pad',
    description:
      'Bells rubbed hard on a worn rim, their thirds between minor and major, beating twice a second behind a veil.',
    instrument: { deviceId: 'tierce-bells', preset: 'Rubbed old rim' },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 1.5 } },
    ],
  },
  {
    id: 'tierce-bells-rubbed-octave-bed',
    name: 'Rubbed low bed',
    category: 'drone',
    description:
      'A low fifth of rubbed bells in D Dorian, slow and dark with a deep hum, softly blurred on a long plate.',
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rubbed in C major',
      params: { root: 2, scale: 2, hardness: 0.15, upper: 0.25, humLevel: 0.7 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Faint haze' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -8, gain: 5 } },
    ],
  },
]
