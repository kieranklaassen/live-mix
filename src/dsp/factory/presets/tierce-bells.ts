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
    instrument: { deviceId: 'tierce-bells', preset: 'Tower in C major', params: { volume: -6 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.25 } }],
    preview: 'keys',
  },
  {
    id: 'tierce-bells-d-minor-echo',
    name: 'Carillon with one echo',
    category: 'bell',
    description:
      'Short bright tower bells in D minor, where F, B flat and C ring major, each with one echo a third of a second late.',
    instrument: { deviceId: 'tierce-bells', preset: 'Carillon in D minor', params: { volume: -6 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 333, feedback: 0 } },
    ],
    preview: 'keys',
  },
  {
    id: 'tierce-bells-lydian-air',
    name: 'Lydian bells, bright air',
    category: 'bell',
    description:
      'A bright warbling carillon in F Lydian, every pair beating one and a half times a second, in bright air.',
    instrument: { deviceId: 'tierce-bells', preset: 'Lydian carillon', params: { volume: -9 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.3 } }],
  },
  {
    id: 'tierce-bells-muffled-next-door',
    name: 'Muffled peal next door',
    category: 'bell',
    description:
      'A muffled peal in G Mixolydian with F ringing major, short and dull, heard through a wall.',
    instrument: { deviceId: 'tierce-bells', preset: 'Muffled peal', params: { volume: -2 } },
    effects: [{ deviceId: 'distance', preset: 'Next door' }],
    preview: 'keys',
  },
  {
    id: 'tierce-bells-fifth-rings-major',
    name: 'The fifth rings major',
    category: 'bell',
    description:
      'Long soft bells in A harmonic minor: A rings minor and its fifth E rings major, in a warm hall.',
    instrument: { deviceId: 'tierce-bells', preset: 'Changing keys', params: { volume: -4 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } }],
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
      params: { root: 4, scale: 3, volume: -3 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'tierce-bells-handbells-on-tape',
    name: 'Handbell choir on tape',
    category: 'keys',
    description:
      'Handbells in C major stopped as the hand comes off the key, dry and close on quarter inch tape.',
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Handbells in C',
      params: { release: 0.5, volume: -5 },
    },
    effects: [
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
      params: { glide: 5, volume: -4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.25 } }],
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
      params: { glide: 3, decay: 12, volume: -4 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.35 } }],
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
      params: { glide: 4, volume: -3 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.3 } }],
    preview: 'line',
  },
  {
    id: 'tierce-bells-rising-handbells',
    name: 'Rising handbells',
    category: 'bell',
    description:
      'Handbells whose third climbs from minor to major in two and a half seconds, with a glint a twelfth above.',
    instrument: { deviceId: 'tierce-bells', preset: 'Rising handbells', params: { volume: -7 } },
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'tierce-bells-rubbed-suspension',
    name: 'Rubbed suspension',
    category: 'pad',
    description:
      'Rubbed bells that start a semitone over their thirds and come down in five seconds, each to its own in C major.',
    instrument: { deviceId: 'tierce-bells', preset: 'Rubbed suspension', params: { volume: -5 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } }],
  },
  // The undecided bell: a third between minor and major.
  {
    id: 'tierce-bells-undecided',
    name: 'Undecided bell',
    category: 'bell',
    description:
      'A tower bell whose third is 11/9, half way between minor and major, beating slowly in a dark hall.',
    instrument: { deviceId: 'tierce-bells', preset: 'Neutral tower', params: { volume: -6 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } }],
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
      params: { lean: -31.77, glide: 8, quint: 0.2, hardness: 0.3, humLevel: 0.6, volume: -3 },
    },
    effects: [
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
    instrument: { deviceId: 'tierce-bells', preset: 'Open fourth', params: { volume: -6 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } }],
    preview: 'line',
  },
  // Towers, old, cast low and broken.
  {
    id: 'tierce-bells-old-tower-hill',
    name: 'Old tower, far hill',
    category: 'bell',
    description:
      'An old bell with its hum a minor seventh under the note and a narrow minor third, heard from a far shore.',
    instrument: { deviceId: 'tierce-bells', preset: 'Old tower', params: { volume: -2 } },
    effects: [{ deviceId: 'distance', preset: 'Far shore' }],
    preview: 'line',
  },
  {
    id: 'tierce-bells-ninth-below-strings',
    name: 'Ninth below, strings',
    category: 'drone',
    description:
      'Deep bells whose hum lies a ninth under the note, with a pedal of strings that rings along.',
    instrument: { deviceId: 'tierce-bells', preset: 'Hum a ninth below', params: { volume: -6 } },
    effects: [{ deviceId: 'sympathetic', preset: 'Piano pedal', params: { mix: 0.35 } }],
  },
  {
    id: 'tierce-bells-cracked-on-disc',
    name: 'Cracked bell on a disc',
    category: 'bell',
    description:
      'A cracked bell with a flat hum and pairs that beat four times a second, on a worn disc from a market.',
    instrument: { deviceId: 'tierce-bells', preset: 'Cracked tower', params: { volume: -6 } },
    effects: [
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
      'A mantel clock striking in C major inside a wooden case: a bright octave, a short third, gone in two seconds.',
    instrument: { deviceId: 'tierce-bells', preset: 'Mantel clock', params: { volume: -5 } },
    effects: [{ deviceId: 'vessel', preset: 'Hint of wood' }],
    preview: 'keys',
  },
  {
    id: 'tierce-bells-hall-clock',
    name: 'Clock down the hall',
    category: 'bell',
    description:
      'A hall clock with a minor third and a low hum that goes on after the strike, down a stone stairwell.',
    instrument: { deviceId: 'tierce-bells', preset: 'Hall clock', params: { volume: -2 } },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
    preview: 'line',
  },
  {
    id: 'tierce-bells-tiny-carillon',
    name: 'Tiny carillon, springs',
    category: 'keys',
    description:
      'A carillon of little bells in G major, still and without hum, stopped early, in a two spring tank.',
    instrument: { deviceId: 'tierce-bells', preset: 'Tiny carillon', params: { volume: -6 } },
    effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank' }],
  },
  // Rubbed beds.
  {
    id: 'tierce-bells-rubbed-bed',
    name: 'Rubbed bed in C',
    category: 'pad',
    description:
      'A held chord of rubbed bells that swell while the keys are down, each with its third in C major, in a hall.',
    instrument: { deviceId: 'tierce-bells', preset: 'Rubbed in C major', params: { volume: -7 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } }],
  },
  {
    id: 'tierce-bells-old-rim-fog',
    name: 'Old rim in fog',
    category: 'pad',
    description:
      'Bells rubbed hard on a worn rim, their thirds between minor and major, beating twice a second behind a veil.',
    instrument: { deviceId: 'tierce-bells', preset: 'Rubbed old rim', params: { volume: -8 } },
    effects: [{ deviceId: 'fog', preset: 'Thin veil' }],
  },
  {
    id: 'tierce-bells-rubbed-octave-bed',
    name: 'Rubbed low bed',
    category: 'drone',
    description:
      'A low fifth of rubbed bells in D Dorian, slow and dark, held on and blurred until the rubbing is one tone.',
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rubbed in C major',
      params: { root: 2, scale: 2, hardness: 0.15, upper: 0.25, humLevel: 0.7, volume: -6 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Faint haze' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
]
