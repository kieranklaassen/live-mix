import { type FactoryPreset } from '../types'

// Undervoice is a throat and what it sings under itself, so a preset here is
// first of all a count: how many pulses the false folds let go by, and what
// the voice does between the two counts it knows. Two presets for each of ten
// directions. The undertone is an octave, a twelfth or two octaves below the
// key, so effects that add pitches are kept to octaves.

export const UNDERVOICE_PRESETS: readonly FactoryPreset[] = [
  // Cave chant: an octave below, four singers or two.
  {
    id: 'undervoice-cliff-chant',
    name: 'Chant under the cliff',
    category: 'voice',
    description:
      'Four tight low voices on each key with an octave under them, a little apart in pitch, in a dark cave.',
    instrument: { deviceId: 'undervoice', preset: 'Cave chant' },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.25 } }],
  },
  {
    id: 'undervoice-two-answers',
    name: 'Two answers in stone',
    category: 'voice',
    description:
      'Two singers on each key turn between an octave and a twelfth below, once in two seconds, in a cathedral.',
    instrument: { deviceId: 'undervoice', preset: 'Two monks', params: { volume: -4 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.25 } }],
    preview: 'line',
  },
  // Tuned drips: the count so high that the pulses can be counted.
  {
    id: 'undervoice-gallery-drops',
    name: 'Drops in a long gallery',
    category: 'plucked',
    description:
      'Each key falls in tuned drops, two to four a second and none in step, in a dark hall.',
    instrument: { deviceId: 'undervoice', preset: 'Tuned drip' },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
    ],
    preview: 'chord',
  },
  {
    id: 'undervoice-full-jar-taps',
    name: 'Taps on a full jar',
    category: 'bell',
    description:
      'Long ringing drops with a bright mouth and no air, each thrown on as a stone over water.',
    instrument: {
      deviceId: 'undervoice',
      preset: 'Tuned drip',
      params: { ring: 0.85, vowel: 0.62, throat: 1.35, release: 5, depth: 0.95, skew: 0.15 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
    ],
    preview: 'chord',
  },
  // A twelfth below.
  {
    id: 'undervoice-dark-twelfths',
    name: 'Dark twelfths on a plate',
    category: 'pad',
    description:
      'Soft round voices that swell in over a twelfth below each key, on a long dark plate.',
    instrument: { deviceId: 'undervoice', preset: 'Twelfth under' },
    effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } }],
  },
  {
    id: 'undervoice-herders-call',
    name: 'Call over a twelfth',
    category: 'wind',
    description:
      'One small bright throat turns from a twelfth below to an octave and back, with a dark echo behind it.',
    instrument: {
      deviceId: 'undervoice',
      preset: 'Reed calf',
      params: {
        volume: -2,
        second: 2,
        turn: 0.9,
        pace: 0.7,
        roughness: 0.12,
        fade: 30,
        singers: 1,
        release: 1.2,
        vowel: 0.44,
        closure: 0.66,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.2 } },
    ],
    preview: 'line',
  },
  // Whisper floors.
  {
    id: 'undervoice-breath-on-the-floor',
    name: 'Breath along the floor',
    category: 'pad',
    description:
      'Voices that are nearly all air, with a soft tone an octave under each and a faint haze that holds them.',
    instrument: { deviceId: 'undervoice', preset: 'Whisper floor', params: { volume: -8.5 } },
    effects: [{ deviceId: 'spectral-blur', preset: 'Faint haze' }],
  },
  {
    id: 'undervoice-asleep-by-the-wall',
    name: 'Asleep by the wall',
    category: 'texture',
    description:
      'A dark whisper that breathes out full and in thin, eleven times a minute, with a flutter in it, behind a veil.',
    instrument: {
      deviceId: 'undervoice',
      preset: 'Whisper floor',
      params: {
        volume: -4.6,
        division: 4,
        breath: 0.8,
        pace: 0.18,
        turn: 0,
        second: 3,
        vowel: 0.04,
        mouth: 0.5,
        ring: 0.2,
        attack: 0.6,
        singers: 3,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil' },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
    preview: 'low',
  },
  // Sub pedals: two octaves below.
  {
    id: 'undervoice-throat-bass',
    name: 'Throat bass, two down',
    category: 'bass',
    description:
      'A closed dark hum two octaves under the key, quick to start and let go, with a little warm drive.',
    instrument: { deviceId: 'undervoice', preset: 'Sub pedal', params: { volume: -10 } },
    effects: [{ deviceId: 'analog-drive', preset: 'Low warmth' }],
    preview: 'keys',
  },
  {
    id: 'undervoice-ground-hum',
    name: 'Ground that hums along',
    category: 'drone',
    description:
      'A slow low drone of two voices turning from an octave below to two, with a warm hall underneath.',
    instrument: {
      deviceId: 'undervoice',
      preset: 'Sub pedal',
      params: {
        division: 1,
        second: 4,
        turn: 1,
        pace: 0.2,
        singers: 2,
        width: 0.6,
        attack: 1.6,
        release: 5,
        closure: 0.34,
        mouth: 0.55,
        drift: 0.2,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.25 } }],
  },
  // Creak pianos.
  {
    id: 'undervoice-creaking-keys',
    name: 'Creaking keys in a room',
    category: 'keys',
    description:
      'A short creak on every key that counts eight pulses, uneven and gone in three seconds, on tape in a room.',
    instrument: { deviceId: 'undervoice', preset: 'Creak piano', params: { volume: 2.3 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'undervoice-hinge-harp',
    name: 'Harp made of hinges',
    category: 'plucked',
    description:
      'Dry plucks that open on an octave below and die in a second and a half, in a two spring tank.',
    instrument: {
      deviceId: 'undervoice',
      preset: 'Creak piano',
      params: {
        volume: 6,
        division: 1,
        fade: 1.5,
        ring: 0.6,
        roughness: 0.15,
        closure: 0.62,
        vowel: 0.4,
        depth: 1,
        chest: 0.35,
        release: 1.4,
        throat: 1.2,
      },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 3 } },
    ],
  },
  // Bronze throats: tight folds.
  {
    id: 'undervoice-bronze-call',
    name: 'Bronze throat, near wall',
    category: 'voice',
    description:
      'One tight bright voice that opens at once with an octave under it, in a bright chamber.',
    instrument: { deviceId: 'undervoice', preset: 'Bronze throat', params: { volume: -2.7 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.25 } }],
    preview: 'line',
  },
  {
    id: 'undervoice-bronze-loft',
    name: 'Brazen loft, slow rotor',
    category: 'organ',
    description:
      'Hard wide open voices over two octaves below, held as a chord through a slow rotating speaker.',
    instrument: {
      deviceId: 'undervoice',
      preset: 'Bronze throat',
      params: {
        volume: -3,
        division: 3,
        vowel: 0.62,
        throat: 1.35,
        singers: 3,
        attack: 0.12,
        ring: 0.3,
        closure: 0.75,
        width: 0.8,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } },
    ],
  },
  // Asleep: one slow pulse shared by the chord.
  {
    id: 'undervoice-cat-on-the-sill',
    name: 'Cat on the sill',
    category: 'pad',
    description:
      'One slow purr shared by every key of the chord, full on the way out and airy on the way in, inside wood.',
    instrument: { deviceId: 'undervoice', preset: 'Cat asleep' },
    effects: [{ deviceId: 'vessel', preset: 'Hint of wood' }],
  },
  {
    id: 'undervoice-herd-at-dusk',
    name: 'Large flanks at dusk',
    category: 'drone',
    description:
      'A rough low purr of large bodies that swell and sink four times in twenty seconds, across an open valley.',
    instrument: {
      deviceId: 'undervoice',
      preset: 'Elephant dusk',
      params: {
        volume: -7,
        division: 6,
        breath: 0.6,
        pace: 0.2,
        turn: 0,
        roughness: 0.4,
        skew: 0.5,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.25 } }],
  },
  // Woodpecker pads: eight pulses.
  {
    id: 'undervoice-woodpecker-far',
    name: 'Woodpecker, then echo',
    category: 'pad',
    description:
      'Struck flutters of eight pulses on each key, wide apart and quick, with one clean echo of them.',
    instrument: { deviceId: 'undervoice', preset: 'Woodpecker pad', params: { volume: -4.6 } },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 420, feedback: 0.1, mix: 0.25 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'undervoice-moth-flutter',
    name: 'Moths at the shutter',
    category: 'texture',
    description:
      'A soft flutter that swells dark in every group and is cut off, turning to an octave below, in warm haze.',
    instrument: {
      deviceId: 'undervoice',
      preset: 'Woodpecker pad',
      params: {
        volume: -0.5,
        skew: 0.85,
        closure: 0.5,
        vowel: 0.16,
        second: 2,
        turn: 0.8,
        pace: 0.4,
        whisper: 0.3,
        ring: 0.3,
        depth: 0.8,
        throat: 0.95,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'haze', preset: 'Faint warmth' },
    ],
    preview: 'chord',
  },
  // Open skies: the open voice.
  {
    id: 'undervoice-sky-choir',
    name: 'Open throats, high air',
    category: 'voice',
    description:
      'Four open voices a key, wide and slow to rise, with nothing sung under them and a faint glimmer above.',
    instrument: { deviceId: 'undervoice', preset: 'Open sky', params: { volume: -6.8 } },
    effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer' }],
  },
  {
    id: 'undervoice-throat-bells',
    name: 'Bells with closed eyes',
    category: 'bell',
    description:
      'Open tight voices struck and left to ring at their own harmonics, four seconds long, on a long plate.',
    instrument: { deviceId: 'undervoice', preset: 'Throat bells', params: { volume: 4 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
  },
]
