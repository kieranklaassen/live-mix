import { type FactoryPreset, type Phrase } from '../types'

// Walking Voices is heard when the chord changes, so a pad or a choir here is
// auditioned with three chords that share notes: whoever is on one of those
// stays, and the rest walk. Two presets stand in each of the ten directions the
// instrument has. Effects that add pitches of their own are left out, so that
// nobody sings but the crowd.

/** Three chords with a note held through each change. */
const WALK: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 50, gain: 0.7 },
    { atSec: 0, durSec: 4.3, note: 57, gain: 0.7 },
    { atSec: 0, durSec: 2.2, note: 65, gain: 0.7 },
    { atSec: 0, durSec: 4.3, note: 72, gain: 0.6 },
    { atSec: 2.15, durSec: 2.15, note: 48, gain: 0.7 },
    { atSec: 2.15, durSec: 4.2, note: 64, gain: 0.7 },
    { atSec: 4.25, durSec: 2.1, note: 45, gain: 0.7 },
    { atSec: 4.25, durSec: 2.1, note: 60, gain: 0.7 },
    { atSec: 4.25, durSec: 2.1, note: 69, gain: 0.6 },
  ],
}

/** A line whose notes are tied, over a held fifth from the second on. */
const CALL: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.55, note: 62, gain: 0.8 },
    { atSec: 1.5, durSec: 1.05, note: 67, gain: 0.7 },
    { atSec: 1.5, durSec: 4.5, note: 50, gain: 0.6 },
    { atSec: 2.5, durSec: 1.05, note: 65, gain: 0.8 },
    { atSec: 2.5, durSec: 3.5, note: 57, gain: 0.5 },
    { atSec: 3.5, durSec: 2.5, note: 69, gain: 0.8 },
  ],
}

export const WALKING_VOICES_PRESETS: readonly FactoryPreset[] = [
  // Surge hymns: a melody lined out, and everybody after it.
  {
    id: 'walking-voices-valley-answers',
    name: 'Valley answers',
    category: 'voice',
    description:
      'A strong turning crowd led from the front, its ornaments going through it in waves, across an open valley.',
    instrument: {
      deviceId: 'walking-voices',
      preset: 'Surge hymn',
      params: { lag: 0.75, vowelSpread: 0.4, volume: -5.0 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.22 } }],
    preview: WALK,
  },
  {
    id: 'walking-voices-lined-out',
    name: 'Lined out at evening',
    category: 'voice',
    description:
      'One voice gives each note and the rest come late and under strain, easing as they settle, in a nave.',
    instrument: {
      deviceId: 'walking-voices',
      preset: 'Surge hymn',
      params: {
        path: 4,
        lag: 1.2,
        reach: 3,
        leader: 0.55,
        strain: 0.75,
        people: 22,
        vowel: 0.32,
        attack: 0.25,
        effort: 0.45,
        volume: -3.5,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.25 } }],
    preview: CALL,
  },
  // Perfect pools: nobody is off the pure interval.
  {
    id: 'walking-voices-pool-without-beats',
    name: 'Pool without beats',
    category: 'organ',
    description:
      'Hollow pipes on pure intervals with no vibrato and a slow rise, held in a long plate.',
    instrument: { deviceId: 'walking-voices', preset: 'Perfect pool', params: { volume: -9.0 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
    preview: WALK,
  },
  {
    id: 'walking-voices-pure-hum-keys',
    name: 'Pure hum keys',
    category: 'keys',
    description:
      'Hummed notes that begin softly, lock onto pure intervals and ring on after the hand, in bright air.',
    instrument: {
      deviceId: 'walking-voices',
      preset: 'Perfect pool',
      params: {
        body: 1,
        vowel: 0.62,
        effort: 0.6,
        attack: 0.06,
        release: 3.5,
        fade: 0.6,
        breath: 2.5,
        people: 12,
        air: 0.02,
        volume: -4.0,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Faint halo' },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
  // Hummed vigils: closed mouths.
  {
    id: 'walking-voices-vigil-by-candles',
    name: 'Vigil by candles',
    category: 'pad',
    description:
      'A low hum that arrives late and leans down, close and breathy, with a small dark hall behind it.',
    instrument: { deviceId: 'walking-voices', preset: 'Hummed vigil', params: { volume: -5.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.28 } }],
    preview: WALK,
  },
  {
    id: 'walking-voices-hum-on-the-stairs',
    name: 'Hum on the stairs',
    category: 'voice',
    description:
      'Five people hum a line and slide from note to note, somewhere down a stone stairwell.',
    instrument: {
      deviceId: 'walking-voices',
      preset: 'Hummed vigil',
      params: {
        path: 0,
        people: 5,
        lag: 0.35,
        vowel: 0.7,
        effort: 0.55,
        air: 0.3,
        attack: 0.12,
        vibrato: 0.4,
        lowShare: 0,
        leader: 0.4,
        volume: -4.0,
      },
    },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
    preview: 'line',
  },
  // Whistling fields.
  {
    id: 'walking-voices-field-of-whistlers',
    name: 'Field of whistlers',
    category: 'texture',
    description:
      'Fourteen whistlers spread wide who wander off and come back, with a faint second echo of each.',
    instrument: { deviceId: 'walking-voices', preset: 'Whistling field', params: { volume: -7.0 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Faint halo' },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'walking-voices-whistling-home',
    name: 'Whistling home',
    category: 'wind',
    description:
      'Two people whistle a line, one a little behind the other, and tape carries each note on.',
    instrument: {
      deviceId: 'walking-voices',
      preset: 'Whistling field',
      params: {
        people: 2,
        wander: 0,
        lag: 0.2,
        reach: 1,
        vibrato: 0.55,
        air: 0.15,
        attack: 0.06,
        release: 0.5,
        spread: 0.4,
        leader: 0.6,
        agreement: 0.7,
        volume: -4.0,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
    preview: 'line',
  },
  // Leaders, with the crowd behind them.
  {
    id: 'walking-voices-cantor-and-shadow',
    name: 'Cantor and shadow',
    category: 'voice',
    description:
      'One singer turns round every note of a line while the crowd is a shadow behind, in a chapel.',
    instrument: { deviceId: 'walking-voices', preset: 'Leader alone', params: { volume: -2.5 } },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.25 } }],
    preview: 'line',
  },
  {
    id: 'walking-voices-reed-caller',
    name: 'Reed caller',
    category: 'wind',
    description:
      'A lone reed with a slow vibrato slides between notes over a quiet crowd, in a plain room with one slap.',
    instrument: {
      deviceId: 'walking-voices',
      preset: 'Leader alone',
      params: {
        body: 4,
        path: 0,
        lag: 0.3,
        vowel: 0.2,
        effort: 0.25,
        reach: 1.5,
        vibrato: 0.6,
        air: 0.2,
        strain: 0.3,
        release: 0.6,
        leader: 0.9,
        volume: -6.0,
      },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.25 } },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
    preview: CALL,
  },
  // Bass floors: the crowd stands at the bottom.
  {
    id: 'walking-voices-deep-floor',
    name: 'Floor of low men',
    category: 'bass',
    description:
      'Most of the crowd stands on the lowest note and an octave under it: round, dark and slow to leave.',
    instrument: {
      deviceId: 'walking-voices',
      preset: 'Bass floor',
      params: { attack: 0.15, lag: 0.2, release: 0.7, effort: 0.4, volume: -9.5 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.15 } },
    ],
    preview: 'bass',
  },
  {
    id: 'walking-voices-cellar-bows',
    name: 'Cellar bows',
    category: 'drone',
    description:
      'Bowed low strings gathered at the bottom of the chord, dark and wide, with a pedal that rings along.',
    instrument: {
      deviceId: 'walking-voices',
      preset: 'Bass floor',
      params: {
        body: 5,
        lowShare: 0.7,
        vowel: 0.2,
        effort: 0.25,
        people: 24,
        lag: 1.2,
        reach: 3,
        spread: 0.9,
        air: 0.2,
        vibrato: 0.2,
        volume: -7.5,
      },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Faint ring' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.22 } },
    ],
    preview: 'low',
  },
  // Short gathered keys: nobody slides, everybody lands.
  {
    id: 'walking-voices-gathered-in-stone',
    name: 'Gathered in stone',
    category: 'keys',
    description:
      'Short sung keys that land at once and die away in one breath, in a tight plate room.',
    instrument: { deviceId: 'walking-voices', preset: 'Gathered keys', params: { volume: -2.0 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'walking-voices-plucked-by-many',
    name: 'Plucked by many',
    category: 'plucked',
    description:
      'Bows that touch and leave: short bright string notes all together, each with a soft repeat.',
    instrument: {
      deviceId: 'walking-voices',
      preset: 'Gathered keys',
      params: {
        body: 5,
        breath: 0.8,
        fade: 0.95,
        effort: 0.55,
        vowel: 0.6,
        people: 16,
        release: 1.6,
        vibrato: 0,
        volume: -3.5,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.28 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  // Glaciers: the walk is the piece.
  {
    id: 'walking-voices-hour-by-hour',
    name: 'Hour by hour',
    category: 'pad',
    description:
      'Everyone begins up to nine semitones off and takes many seconds to slide home, vast and dark.',
    instrument: { deviceId: 'walking-voices', preset: 'Slow glacier', params: { volume: -9.0 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'walking-voices-reeds-under-ice',
    name: 'Reeds under ice',
    category: 'drone',
    description:
      'Soft dark reeds that creep toward the chord while some stay behind, blurred by a faint haze.',
    instrument: {
      deviceId: 'walking-voices',
      preset: 'Slow glacier',
      params: {
        body: 4,
        effort: 0.08,
        vowel: 0.05,
        strain: 0.15,
        lag: 3,
        reach: 5,
        people: 18,
        attack: 1.4,
        release: 5,
        air: 0.3,
        lowShare: 0.3,
        volume: -9.0,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Faint haze' },
      { deviceId: 'distance', preset: 'Through fog' },
    ],
    preview: 'low',
  },
  // Strings on foot.
  {
    id: 'walking-voices-across-the-square',
    name: 'Strings cross a square',
    category: 'string',
    description:
      'A string crowd slides to each new chord by the nearest way, warm and loose, in a hall.',
    instrument: { deviceId: 'walking-voices', preset: 'Strings on foot', params: { volume: -9.0 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } }],
    preview: WALK,
  },
  {
    id: 'walking-voices-bows-in-step',
    name: 'Bows in step',
    category: 'string',
    description:
      'Bowed strings that walk up to each note in spoken steps and mark time there, dry and close.',
    instrument: {
      deviceId: 'walking-voices',
      preset: 'Marching bows',
      params: { lag: 0.34, effort: 0.45, volume: -4.0 },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.25 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
    preview: WALK,
  },
  // Quarrels: some give in late and some not at all.
  {
    id: 'walking-voices-quarrel-in-the-loft',
    name: 'Quarrel in the loft',
    category: 'pad',
    description:
      'Reeds far apart in tune that hold out on their old notes under strain, from an amplifier down the hall.',
    instrument: {
      deviceId: 'walking-voices',
      preset: 'Quarrel',
      params: { people: 18, effort: 0.3, lag: 1, volume: -10.0 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.25 } },
    ],
    preview: WALK,
  },
  {
    id: 'walking-voices-nobody-gives-in',
    name: 'Nobody gives in',
    category: 'voice',
    description:
      'Whispered and sung syllables in many vowels, out of tune and out of step, with the stubborn left behind.',
    instrument: {
      deviceId: 'walking-voices',
      preset: 'Quarrel',
      params: {
        body: 0,
        breath: 0.45,
        air: 0.5,
        vowelSpread: 0.9,
        people: 36,
        path: 1,
        lag: 0.5,
        strain: 0.5,
        fade: 0.3,
        attack: 0.04,
        stubborn: 0.8,
        agreement: 0.25,
        wander: 0.6,
        volume: -3.0,
      },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } },
    ],
    preview: WALK,
  },
]
