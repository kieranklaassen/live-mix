import { type FactoryPreset, type Phrase } from '../types'

// Deep Roots grows its own bass, so a preset here says what grows under the
// hand: how soon, how far down, in which soil, and by which of the two ways
// keys meet. The preview phrases lie high and leave the bass to the instrument.
// Effects that add pitches of their own are left out, for the only note nobody
// played should be the root's; rooms are kept thin at the bottom.

/** One finger, high: what sounds under it is the instrument's. */
const ONE_FINGER: Phrase = {
  notes: [
    { atSec: 0, durSec: 1, note: 62, gain: 0.8 },
    { atSec: 1.1, durSec: 0.45, note: 62, gain: 0.6 },
    { atSec: 1.65, durSec: 1, note: 69, gain: 0.7 },
    { atSec: 2.75, durSec: 0.5, note: 67, gain: 0.6 },
    { atSec: 3.3, durSec: 1.1, note: 65, gain: 0.7 },
    { atSec: 4.5, durSec: 1.7, note: 60, gain: 0.8 },
  ],
}

/** Three high chords, each with another root. */
const CHANGES: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 62, gain: 0.7 },
    { atSec: 0, durSec: 2.2, note: 69, gain: 0.6 },
    { atSec: 0, durSec: 4.4, note: 77, gain: 0.6 },
    { atSec: 2.2, durSec: 2.2, note: 65, gain: 0.7 },
    { atSec: 2.2, durSec: 2.2, note: 72, gain: 0.6 },
    { atSec: 4.4, durSec: 2.2, note: 60, gain: 0.7 },
    { atSec: 4.4, durSec: 2.2, note: 67, gain: 0.6 },
    { atSec: 4.4, durSec: 2.2, note: 76, gain: 0.6 },
  ],
}

/** A chord built a key at a time and held. */
const BUILT: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 69, gain: 0.7 },
    { atSec: 0.8, durSec: 5.6, note: 76, gain: 0.6 },
    { atSec: 1.6, durSec: 4.8, note: 65, gain: 0.7 },
    { atSec: 2.4, durSec: 4, note: 62, gain: 0.7 },
  ],
}

/** A figure of short notes that goes round, and again a little lower. */
const FIGURE: Phrase = {
  notes: [62, 69, 74, 77, 60, 67, 72, 76, 57, 65, 69, 72, 55, 62, 67, 74].map((note, i) => ({
    atSec: i * 0.42,
    durSec: 0.25,
    note,
    gain: i % 4 === 0 ? 0.8 : 0.6,
  })),
}

export const DEEP_ROOTS_PRESETS: readonly FactoryPreset[] = [
  // Rooted pads.
  {
    id: 'deep-roots-chord-cellar',
    name: 'Cellar of the chord',
    category: 'pad',
    description:
      'A soft round chord with its own bass an octave and more below, settling in as it is held, in a warm hall.',
    instrument: {
      deviceId: 'deep-roots',
      preset: 'Rooted pad',
      params: { attack: 0.5, release: 4, growth: 0.7, volume: -10 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.24 } }],
  },
  {
    id: 'deep-roots-one-trunk',
    name: 'One trunk',
    category: 'pad',
    description:
      'Reeds over clay: the halves and thirds of every key are drawn onto one shared root, slowly widened by a chorus.',
    instrument: {
      deviceId: 'deep-roots',
      preset: 'Rooted pad',
      params: {
        leaf: 1,
        leafTone: 0.3,
        balance: 0.6,
        attack: 0.9,
        release: 4,
        series: 0.45,
        branching: 0.8,
        growth: 1,
        meeting: -0.8,
        tolerance: 140,
        rootTone: 0.5,
        sway: 0.5,
        volume: -1.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.22 } },
    ],
    preview: CHANGES,
  },
  // Keys under a canopy of glass.
  {
    id: 'deep-roots-canopy-in-light',
    name: 'Canopy in light',
    category: 'keys',
    description:
      'Struck glass over round roots that swell in after each stroke and ring away, in bright air.',
    instrument: { deviceId: 'deep-roots', preset: 'Glass canopy', params: { volume: -4.5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.25 } }],
  },
  {
    id: 'deep-roots-dew-on-sand',
    name: 'Dew on sand',
    category: 'keys',
    description:
      'Bright glass whose roots are threads of pitch under streaming sand, with a faint trace of tape behind.',
    instrument: {
      deviceId: 'deep-roots',
      preset: 'Sand under glass',
      params: { balance: 0.72, growth: 0.25, release: 3, decay: 9, volume: -2 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Faint trace' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.18 } },
    ],
    preview: CHANGES,
  },
  // Plucked seeds.
  {
    id: 'deep-roots-seeds-in-a-row',
    name: 'Seeds in a row',
    category: 'plucked',
    description:
      'Short plucked strings, each with a small root an octave and a half under it that is gone with it, in a room.',
    instrument: { deviceId: 'deep-roots', preset: 'Pizzicato seeds', params: { volume: -5 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.22 } }],
    preview: FIGURE,
  },
  {
    id: 'deep-roots-pluck-then-stone',
    name: 'Pluck, then the stone',
    category: 'plucked',
    description:
      'A plucked string wakes the stone below: its root comes a moment late and hums on through warm echoes.',
    instrument: {
      deviceId: 'deep-roots',
      preset: 'Pizzicato seeds',
      params: {
        leafTone: 0.55,
        balance: 0.55,
        release: 2.5,
        series: 0,
        reach: 2.1,
        branching: 0.2,
        growth: 0.3,
        meeting: 0.5,
        soil: 4,
        rootTone: 0.4,
        decay: 8,
        sway: 0.3,
        width: 0.7,
        volume: -3,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.22 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.16 } },
    ],
  },
  // A bass under one finger.
  {
    id: 'deep-roots-bass-by-one-finger',
    name: 'Bass by one finger',
    category: 'bass',
    description:
      'One key in the middle of the keyboard plays a round bass two octaves down, faintly doubled above, gently warmed.',
    instrument: { deviceId: 'deep-roots', preset: 'One-finger bass', params: { volume: -3.5 } },
    effects: [{ deviceId: 'analog-drive', preset: 'Low warmth' }],
    preview: ONE_FINGER,
  },
  {
    id: 'deep-roots-stone-under-a-reed',
    name: 'Stone under a reed',
    category: 'bass',
    description:
      'A short dry reed with a hard singing stone bass below it, gone soon after the hand, on warm tape.',
    instrument: {
      deviceId: 'deep-roots',
      preset: 'Ghost organ',
      params: {
        balance: 0.8,
        leafTone: 0.3,
        series: 0,
        reach: 2.3,
        branching: 0.1,
        release: 0.9,
        rootTone: 0.3,
        decay: 5,
        floor: 36,
        sway: 0.2,
        width: 0.3,
        volume: -4.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.12 } },
    ],
    preview: ONE_FINGER,
  },
  // Bells of chalk.
  {
    id: 'deep-roots-chalk-peal',
    name: 'Chalk peal',
    category: 'bell',
    description:
      'Every key sets off a small peal of chalk bars going down its divisions, one after another, in a cathedral.',
    instrument: { deviceId: 'deep-roots', preset: 'Chalk bells', params: { volume: -4.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.2 } }],
  },
  {
    id: 'deep-roots-steps-to-the-well',
    name: 'Steps to the well',
    category: 'bell',
    description:
      'Dull chalk struck on the octaves and twelfths below each key, a third of a second to the octave, in a long spring.',
    instrument: {
      deviceId: 'deep-roots',
      preset: 'Chalk bells',
      params: {
        leaf: 0,
        leafTone: 0.15,
        balance: 0.92,
        attack: 0.2,
        release: 3,
        series: 0.33,
        reach: 3.2,
        growth: 0.34,
        stagger: 0.3,
        rootTone: 0.28,
        decay: 30,
        floor: 45,
        width: 0.6,
        volume: -6.5,
      },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.2 } }],
    preview: 'keys',
  },
  // Drones in peat.
  {
    id: 'deep-roots-black-peat',
    name: 'Black peat',
    category: 'drone',
    description:
      'Every division of each key in thick dark peat, bubbling slowly and some seconds in coming up, in a cave.',
    instrument: { deviceId: 'deep-roots', preset: 'Peat drone', params: { volume: -7.5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.2 } }],
    preview: {
      notes: [
        { atSec: 0, durSec: 6.5, note: 50, gain: 0.8 },
        { atSec: 0, durSec: 6.5, note: 57, gain: 0.7 },
        { atSec: 0.4, durSec: 6.1, note: 64, gain: 0.5 },
      ],
    },
  },
  {
    id: 'deep-roots-bog-current',
    name: 'Current in the bog',
    category: 'drone',
    description:
      'Breath over peat roots that share one pitch, its bands rising and sinking as if slow water went through it.',
    instrument: {
      deviceId: 'deep-roots',
      preset: 'Peat drone',
      params: {
        leaf: 3,
        leafTone: 0.5,
        balance: 0.7,
        attack: 1.2,
        series: 0.33,
        reach: 2.2,
        branching: 0.6,
        growth: 0.4,
        meeting: -1,
        tolerance: 160,
        rootTone: 0.75,
        width: 0.9,
        volume: -10.5,
      },
    },
    effects: [
      { deviceId: 'currents', preset: 'Slow water' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.2 } },
    ],
    preview: 'chord',
  },
  // Gravel.
  {
    id: 'deep-roots-scree',
    name: 'Scree after rain',
    category: 'texture',
    description:
      'Roots broken into bright pebbles that fall at random under a breath of air, scattered wide in an open valley.',
    instrument: { deviceId: 'deep-roots', preset: 'Falling gravel', params: { volume: -8.5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.22 } }],
    preview: 'chord',
  },
  {
    id: 'deep-roots-crumbling-wall',
    name: 'Crumbling wall',
    category: 'texture',
    description:
      'A stone chord that crumbles as it is held, half tone and half pebbles, softened by a veil of fog.',
    instrument: {
      deviceId: 'deep-roots',
      preset: 'Stone choir',
      params: {
        leaf: 0,
        balance: 0.9,
        attack: 0.4,
        growth: 0.3,
        series: 0.66,
        reach: 2.8,
        branching: 0.7,
        meeting: 0.4,
        rootTone: 0.35,
        grain: 0.6,
        floor: 60,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.18 } },
    ],
    preview: 'chord',
  },
  // Elders of breath.
  {
    id: 'deep-roots-elders-at-dusk',
    name: 'Elders at dusk',
    category: 'voice',
    description:
      'Breathing tones on dark peat whose roots gather onto one another over some seconds, far back in a hall.',
    instrument: { deviceId: 'deep-roots', preset: 'Breath elders', params: { volume: -8.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.26 } }],
  },
  {
    id: 'deep-roots-stone-elders',
    name: 'Elders cut in stone',
    category: 'voice',
    description:
      'Bright breath over singing stone, shared roots and a hollow vowel, answered by low voices in the room.',
    instrument: {
      deviceId: 'deep-roots',
      preset: 'Stone choir',
      params: { rootTone: 0.6, balance: 0.62, growth: 0.5, volume: -6 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.22 } }],
    preview: CHANGES,
  },
  // Roots that pulse.
  {
    id: 'deep-roots-sap-rising',
    name: 'Sap rising',
    category: 'pad',
    description:
      'Every root pulses at its own rate, set by its pitch, so a held chord turns into a slow pattern with a soft echo.',
    instrument: { deviceId: 'deep-roots', preset: 'Root pulse', params: { volume: -4 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Faint halo' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.16 } },
    ],
  },
  {
    id: 'deep-roots-sand-counting',
    name: 'Sand counting',
    category: 'texture',
    description:
      'Quick pulses of sand under plain tones, all at rates of their own, wide, in a short bright room.',
    instrument: {
      deviceId: 'deep-roots',
      preset: 'Root pulse',
      params: {
        leafTone: 0.6,
        balance: 0.82,
        series: 0.66,
        reach: 2,
        branching: 0.7,
        soil: 1,
        rootTone: 0.55,
        pulse: 0.78,
        width: 1,
        volume: -0.5,
      },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } }],
    preview: CHANGES,
  },
  // A foundation that comes late.
  {
    id: 'deep-roots-late-foundation-stone',
    name: 'Late foundation stone',
    category: 'organ',
    description:
      'Soft reeds alone at first; seconds later stone roots arrive under them, deepest last, in a dark hall.',
    instrument: { deviceId: 'deep-roots', preset: 'Late foundation', params: { volume: -6 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.22 } }],
    preview: BUILT,
  },
  {
    id: 'deep-roots-nobody-played-it',
    name: 'Nobody played it',
    category: 'pad',
    description:
      'The keys are silent: only the tones between them sound, warm in clay, and each new key moves them all.',
    instrument: {
      deviceId: 'deep-roots',
      preset: 'Parents vanish',
      params: { growth: 0.8, reach: 1.6, branching: 0.45, volume: -4.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.22 } },
    ],
    preview: BUILT,
  },
]
