import { type FactoryPreset, type Phrase } from '../types'

// Strings touched and never stopped. Four open strings, C G D A in pure fifths, sound open or at
// one of harmonics 2 to 6, and of those only the white keys (the fifth harmonics of D and A are
// left out): no F, and two Es a comma apart, each note at its true cents. Laid out by how light
// the finger is, which node, which string.

// The first half of the line, G B D then A and the upper E, over the open C and G.
const RISING: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 36, gain: 0.22 },
    { atSec: 0, durSec: 6.4, note: 43.02, gain: 0.2 },
    { atSec: 0, durSec: 1.3, note: 67.02, gain: 0.5 },
    { atSec: 1.2, durSec: 1.3, note: 70.88, gain: 0.5 },
    { atSec: 2.4, durSec: 1.3, note: 74.04, gain: 0.54 },
    { atSec: 3.6, durSec: 1.3, note: 69.06, gain: 0.48 },
    { atSec: 4.8, durSec: 1.6, note: 76.08, gain: 0.54 },
  ],
}
// The second half: D B G, then the lower E, the fifth harmonic of C, and C.
const FALLING: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 36, gain: 0.22 },
    { atSec: 0, durSec: 6.4, note: 43.02, gain: 0.2 },
    { atSec: 0, durSec: 1.3, note: 74.04, gain: 0.5 },
    { atSec: 1.2, durSec: 1.3, note: 70.88, gain: 0.48 },
    { atSec: 2.4, durSec: 1.3, note: 67.02, gain: 0.48 },
    { atSec: 3.6, durSec: 1.3, note: 63.86, gain: 0.48 },
    { atSec: 4.8, durSec: 1.6, note: 60, gain: 0.46 },
  ],
}
// The whole line at a plucked pace, an open string under each of its groups.
const WHOLE_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 36, gain: 0.34 },
    { atSec: 0, durSec: 1.2, note: 67.02, gain: 0.55 },
    { atSec: 0.55, durSec: 1.2, note: 70.88, gain: 0.5 },
    { atSec: 1.1, durSec: 1.2, note: 74.04, gain: 0.6 },
    { atSec: 1.85, durSec: 1.3, note: 43.02, gain: 0.32 },
    { atSec: 1.85, durSec: 1.2, note: 69.06, gain: 0.5 },
    { atSec: 2.4, durSec: 1.2, note: 76.08, gain: 0.62 },
    { atSec: 3.15, durSec: 1.8, note: 43.02, gain: 0.32 },
    { atSec: 3.15, durSec: 1.2, note: 74.04, gain: 0.55 },
    { atSec: 3.7, durSec: 1.2, note: 70.88, gain: 0.5 },
    { atSec: 4.25, durSec: 1.2, note: 67.02, gain: 0.48 },
    { atSec: 5, durSec: 1.5, note: 36, gain: 0.34 },
    { atSec: 5, durSec: 1.2, note: 63.86, gain: 0.48 },
    { atSec: 5.55, durSec: 1, note: 60, gain: 0.45 },
  ],
}
// The low E over the open C first, the high E over the open A last: the light tilts.
const TILT: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.2, note: 36, gain: 0.26 },
    { atSec: 0, durSec: 3.2, note: 43.02, gain: 0.22 },
    { atSec: 0, durSec: 1.4, note: 63.86, gain: 0.55 },
    { atSec: 1.4, durSec: 0.9, note: 67.02, gain: 0.45 },
    { atSec: 2.3, durSec: 0.9, note: 70.88, gain: 0.48 },
    { atSec: 3.2, durSec: 3.2, note: 50.04, gain: 0.24 },
    { atSec: 3.2, durSec: 3.2, note: 57.06, gain: 0.24 },
    { atSec: 3.2, durSec: 0.9, note: 74.04, gain: 0.5 },
    { atSec: 4.1, durSec: 0.8, note: 69.06, gain: 0.45 },
    { atSec: 4.9, durSec: 1.5, note: 76.08, gain: 0.55 },
  ],
}
// The four open strings let sound one after another, untouched.
const OPEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.5, note: 36, gain: 0.45 },
    { atSec: 0.8, durSec: 5.7, note: 43.02, gain: 0.45 },
    { atSec: 1.6, durSec: 4.9, note: 50.04, gain: 0.45 },
    { atSec: 2.4, durSec: 4.1, note: 57.06, gain: 0.45 },
  ],
}
// Harmonics 2 to 6 of the C string, each held until the chord of them all stands.
const C_NODES: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 36, gain: 0.3 },
    { atSec: 0, durSec: 6.4, note: 48, gain: 0.45 },
    { atSec: 1.1, durSec: 5.3, note: 55.02, gain: 0.42 },
    { atSec: 2.2, durSec: 4.2, note: 60, gain: 0.42 },
    { atSec: 3.3, durSec: 3.1, note: 63.86, gain: 0.45 },
    { atSec: 4.4, durSec: 2, note: 67.02, gain: 0.45 },
  ],
}
// Harmonics 6 to 2 of the G string, one finger sliding from node to node over the open tone.
const G_NODES: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 43.02, gain: 0.28 },
    { atSec: 0, durSec: 1.2, note: 74.04, gain: 0.52 },
    { atSec: 1.15, durSec: 1.2, note: 70.88, gain: 0.5 },
    { atSec: 2.3, durSec: 1.2, note: 67.02, gain: 0.48 },
    { atSec: 3.45, durSec: 1.2, note: 62.04, gain: 0.46 },
    { atSec: 4.6, durSec: 1.8, note: 55.02, gain: 0.46 },
  ],
}
// One light bar across all four strings: at the half, at the third, at the quarter.
const BAR: Phrase = {
  notes: [
    { atSec: 0, durSec: 2, note: 48, gain: 0.42 },
    { atSec: 0, durSec: 2, note: 55.02, gain: 0.4 },
    { atSec: 0, durSec: 2, note: 62.04, gain: 0.4 },
    { atSec: 0, durSec: 2, note: 69.06, gain: 0.42 },
    { atSec: 2.1, durSec: 2, note: 55.02, gain: 0.4 },
    { atSec: 2.1, durSec: 2, note: 62.04, gain: 0.4 },
    { atSec: 2.1, durSec: 2, note: 69.06, gain: 0.4 },
    { atSec: 2.1, durSec: 2, note: 76.08, gain: 0.44 },
    { atSec: 4.2, durSec: 2.3, note: 60, gain: 0.4 },
    { atSec: 4.2, durSec: 2.3, note: 67.02, gain: 0.4 },
    { atSec: 4.2, durSec: 2.3, note: 74.04, gain: 0.4 },
    { atSec: 4.2, durSec: 2.3, note: 81.06, gain: 0.4 },
  ],
}
// Four chords from the pool with its pure thirds: C with its seventh, G, G with its third given
// up for A, and C.
const HARMONY: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 36, gain: 0.34 },
    { atSec: 0, durSec: 1.6, note: 55.02, gain: 0.38 },
    { atSec: 0, durSec: 1.6, note: 63.86, gain: 0.42 },
    { atSec: 0, durSec: 3.2, note: 70.88, gain: 0.44 },
    { atSec: 1.6, durSec: 3.2, note: 43.02, gain: 0.34 },
    { atSec: 1.6, durSec: 3.2, note: 55.02, gain: 0.36 },
    { atSec: 1.6, durSec: 3.2, note: 62.04, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 69.06, gain: 0.44 },
    { atSec: 4.8, durSec: 1.8, note: 36, gain: 0.36 },
    { atSec: 4.8, durSec: 1.8, note: 55.02, gain: 0.38 },
    { atSec: 4.8, durSec: 1.8, note: 63.86, gain: 0.42 },
    { atSec: 4.8, durSec: 1.8, note: 67.02, gain: 0.42 },
  ],
}
// Both Es at once: the fifth harmonic of C, then the third of A joins it, 21.5 cents wide of the octave.
const COMMA: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 48, gain: 0.4 },
    { atSec: 0, durSec: 6.4, note: 63.86, gain: 0.48 },
    { atSec: 2.2, durSec: 4.4, note: 57.06, gain: 0.38 },
    { atSec: 2.2, durSec: 4.2, note: 76.08, gain: 0.46 },
  ],
}
// Harmonics on a guitar's own open strings (its tuning, not the pure fifths), at frets twelve and
// seven: A with a second and no third, then D the same.
const FRETS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.9, note: 45, gain: 0.45 },
    { atSec: 0.5, durSec: 2.4, note: 64.02, gain: 0.55 },
    { atSec: 1, durSec: 2, note: 69.02, gain: 0.55 },
    { atSec: 1.5, durSec: 1.5, note: 71, gain: 0.5 },
    { atSec: 2, durSec: 1.2, note: 76, gain: 0.6 },
    { atSec: 3, durSec: 3.4, note: 50, gain: 0.45 },
    { atSec: 3.5, durSec: 2.9, note: 62, gain: 0.5 },
    { atSec: 4, durSec: 2.4, note: 69.02, gain: 0.55 },
    { atSec: 4.5, durSec: 1.9, note: 74.02, gain: 0.55 },
    { atSec: 5, durSec: 1.4, note: 76, gain: 0.6 },
  ],
}
// A harp's half-string harmonics in pairs, a pure fifth each, and then one hand coming down.
const HALF_STRING: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 0.9, note: 67.02, gain: 0.5 },
    { atSec: 0.8, durSec: 0.9, note: 63.86, gain: 0.5 },
    { atSec: 0.8, durSec: 0.9, note: 70.88, gain: 0.5 },
    { atSec: 1.6, durSec: 0.9, note: 67.02, gain: 0.52 },
    { atSec: 1.6, durSec: 0.9, note: 74.04, gain: 0.52 },
    { atSec: 2.4, durSec: 1.1, note: 69.06, gain: 0.54 },
    { atSec: 2.4, durSec: 1.1, note: 76.08, gain: 0.54 },
    { atSec: 3.6, durSec: 0.7, note: 74.04, gain: 0.5 },
    { atSec: 4.1, durSec: 0.7, note: 70.88, gain: 0.48 },
    { atSec: 4.6, durSec: 0.7, note: 67.02, gain: 0.46 },
    { atSec: 5.1, durSec: 0.7, note: 63.86, gain: 0.46 },
    { atSec: 5.7, durSec: 0.8, note: 60, gain: 0.44 },
  ],
}
// A bow rocking between strings: the third of C (a G) under the upper nodes of G, then the third
// of G (a D) under nodes of D and A.
const ROCKING_BOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5, note: 55.02, gain: 0.36 },
    { atSec: 0.36, durSec: 0.6, note: 67.02, gain: 0.5 },
    { atSec: 0.72, durSec: 0.5, note: 55.02, gain: 0.34 },
    { atSec: 1.08, durSec: 0.6, note: 70.88, gain: 0.52 },
    { atSec: 1.44, durSec: 0.5, note: 55.02, gain: 0.34 },
    { atSec: 1.8, durSec: 0.6, note: 74.04, gain: 0.56 },
    { atSec: 2.16, durSec: 0.5, note: 55.02, gain: 0.34 },
    { atSec: 2.52, durSec: 0.6, note: 70.88, gain: 0.5 },
    { atSec: 2.88, durSec: 0.5, note: 62.04, gain: 0.36 },
    { atSec: 3.24, durSec: 0.6, note: 69.06, gain: 0.5 },
    { atSec: 3.6, durSec: 0.5, note: 62.04, gain: 0.34 },
    { atSec: 3.96, durSec: 0.6, note: 74.04, gain: 0.54 },
    { atSec: 4.32, durSec: 0.5, note: 62.04, gain: 0.34 },
    { atSec: 4.68, durSec: 0.6, note: 76.08, gain: 0.58 },
    { atSec: 5.04, durSec: 0.5, note: 62.04, gain: 0.34 },
    { atSec: 5.4, durSec: 1.2, note: 69.06, gain: 0.48 },
  ],
}
// One line alone, up to the fourth harmonic of A and home to its octave.
const LONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 67.02, gain: 0.5 },
    { atSec: 1.1, durSec: 1.3, note: 74.04, gain: 0.52 },
    { atSec: 2.4, durSec: 0.7, note: 76.08, gain: 0.54 },
    { atSec: 3.1, durSec: 1.3, note: 81.06, gain: 0.56 },
    { atSec: 4.4, durSec: 0.6, note: 76.08, gain: 0.5 },
    { atSec: 5, durSec: 0.6, note: 70.88, gain: 0.48 },
    { atSec: 5.6, durSec: 1.2, note: 69.06, gain: 0.48 },
  ],
}

// One open string after another, and over each its own touched node: E over C, B over G, A over D,
// and the upper E over A.
const OVER_EACH: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.1, note: 36, gain: 0.4 },
    { atSec: 0.5, durSec: 1.5, note: 63.86, gain: 0.5 },
    { atSec: 1.6, durSec: 3.1, note: 43.02, gain: 0.4 },
    { atSec: 2.1, durSec: 1.5, note: 70.88, gain: 0.5 },
    { atSec: 3.2, durSec: 3.2, note: 50.04, gain: 0.38 },
    { atSec: 3.7, durSec: 1.5, note: 69.06, gain: 0.5 },
    { atSec: 4.6, durSec: 1.9, note: 57.06, gain: 0.38 },
    { atSec: 5, durSec: 1.5, note: 76.08, gain: 0.54 },
  ],
}
// Two bows, note against note: the line above, and under it a second voice in contrary motion.
// Every interval is pure but the tenth at the top, C under the upper E, a comma wide.
const TWO_BOWS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.95, note: 63.86, gain: 0.46 },
    { atSec: 0, durSec: 0.95, note: 67.02, gain: 0.5 },
    { atSec: 0.9, durSec: 0.95, note: 62.04, gain: 0.46 },
    { atSec: 0.9, durSec: 0.95, note: 70.88, gain: 0.5 },
    { atSec: 1.8, durSec: 0.95, note: 55.02, gain: 0.46 },
    { atSec: 1.8, durSec: 0.95, note: 74.04, gain: 0.52 },
    { atSec: 2.7, durSec: 1.15, note: 60, gain: 0.48 },
    { atSec: 2.7, durSec: 1.15, note: 76.08, gain: 0.55 },
    { atSec: 3.8, durSec: 0.95, note: 62.04, gain: 0.46 },
    { atSec: 3.8, durSec: 0.95, note: 74.04, gain: 0.5 },
    { atSec: 4.7, durSec: 0.95, note: 55.02, gain: 0.44 },
    { atSec: 4.7, durSec: 0.95, note: 70.88, gain: 0.48 },
    { atSec: 5.6, durSec: 1.2, note: 60, gain: 0.44 },
    { atSec: 5.6, durSec: 1.2, note: 67.02, gain: 0.46 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Wind harp: nobody's finger at all. The wind finds the nodes; from still air to a gale, from
  // one string to four, from the open tone in the hum to its highest partials.
  {
    id: 'only-the-harmonics-open-strings-on-a-sill',
    name: 'Open strings on a sill',
    category: 'string',
    description:
      'One string a key in a steady breeze, much of its open tone kept in the hum, set in a hall of moderate length.',
    preview: OPEN,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Bare string',
      params: { wind: 0.4, hum: 0.45, ring: 7, touch: 0.2, width: 0.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'only-the-harmonics-sixth-node-whistling',
    name: 'Sixth node whistling',
    category: 'wind',
    description:
      'A strong wind on one string with every partial free and no hum, whistling with its lows cut into a long bright tail.',
    preview: LONE,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Glass whistle',
      params: { wind: 0.92, ring: 1.1, width: 0.4 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 12000 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { mix: 0.26 } },
    ],
  },
  {
    id: 'only-the-harmonics-finger-already-gone',
    name: 'Finger already gone',
    category: 'plucked',
    description:
      'Each key plucks its string once and the wind hardly follows; a clean echo repeats the note after six tenths of a second.',
    preview: WHOLE_LINE,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Soft pluck',
      params: { touch: 1, ring: 2.6, wind: 0.12, glint: 0.85 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { time: 620, feedback: 0.4, mix: 0.28 },
      },
    ],
  },
  {
    id: 'only-the-harmonics-c-string-in-a-draught',
    name: 'C string in a draught',
    category: 'drone',
    description:
      'Mostly the hum of the open string, a little wind waking its lower partials, deepened and set a few steps away.',
    preview: C_NODES,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Low hum',
      params: { volume: -10.5, wind: 0.28, glint: 0.5, hum: 0.85, ring: 9 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'distance', preset: 'A few steps back', params: { wander: 0 } },
    ],
  },
  {
    id: 'only-the-harmonics-wire-over-the-yard',
    name: 'Wire over the yard',
    category: 'texture',
    description:
      'Short-ringing wires with plenty of hum and air, run through worn tape and a small splash of spring.',
    preview: OVER_EACH,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Fence wires',
      params: { volume: -13, ring: 0.9, air: 0.35, glint: 0.6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.1 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'only-the-harmonics-comma-in-the-chimney',
    name: 'Comma in the chimney',
    category: 'pad',
    description:
      'Three strings a key swelling slowly with a long ring, inside a resonating stopped pipe and then a long plate.',
    preview: COMMA,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Slow swell',
      params: { volume: -4.5, wind: 0.38, gust: 0.4, lull: 0, ring: 14 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.45, air: 0.1 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'only-the-harmonics-nodes-at-low-tide',
    name: 'Nodes at low tide',
    category: 'texture',
    description:
      'An airy, gusting harp with slow surf passing through it, the partials showing between the waves.',
    preview: BAR,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Sea breeze',
      params: { air: 0.5, glint: 0.9, lull: 0.15 },
    },
    effects: [{ deviceId: 'weather', preset: 'Slow surf', params: { exposure: 0.5 } }],
  },
  {
    id: 'only-the-harmonics-thin-light-on-four',
    name: 'Thin light on four',
    category: 'pad',
    description:
      'Four strings a key lit to their top partials, split in narrow bands that swell and fade one by one.',
    preview: BAR,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Shimmer course',
      params: { wind: 0.5, glint: 1, ring: 8, hum: 0 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Glass notes', params: { depth: 0.8 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'only-the-harmonics-lit-from-underneath',
    name: 'Lit from underneath',
    category: 'string',
    description:
      'One partial after another in hard gusts, delayed by colour so each note unfolds from low to high.',
    preview: C_NODES,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Overtone ladder',
      params: { gust: 0.9, ring: 1.2, hum: 0.3 },
    },
    effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { mix: 0.42 } }],
  },
  {
    id: 'only-the-harmonics-pure-fifths-in-a-gale',
    name: 'Pure fifths in a gale',
    category: 'texture',
    description:
      'A hard gale on three strings a key, held down by a compressor, a glacial phaser turning through it.',
    preview: OPEN,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'High gale',
      params: { wind: 1, gust: 0.5, ring: 4, hum: 0.3 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Dense pad' },
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'only-the-harmonics-breeze-after-rain',
    name: 'Breeze after rain',
    category: 'plucked',
    description:
      'Four plucked strings a key with hardly any wind, slow drips of rain falling between the notes, on a small plate.',
    preview: HALF_STRING,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Plucked course',
      params: { volume: -12.5, ring: 1.4, wind: 0.05, glint: 0.5 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Slow drips', params: { exposure: 0.55 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'only-the-harmonics-silence-between-gusts',
    name: 'Silence between gusts',
    category: 'string',
    description:
      'Long lulls let the strings fall silent between gusts, and one answer just over a second late fills each gap.',
    preview: OVER_EACH,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Long lulls',
      params: { gust: 0.6, ring: 1.6, glint: 0.8 },
    },
    effects: [{ deviceId: 'canon', preset: 'Faint answer', params: { gap: 1.2, mix: 0.45 } }],
  },
  {
    id: 'only-the-harmonics-cold-air-over-gut',
    name: 'Cold air over gut',
    category: 'wind',
    description:
      'More breath than string: full air over a soft wind, brightened, in a thin reverb with no low end.',
    preview: FALLING,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Night wind',
      params: { lull: 0, gust: 0.5, wind: 0.35, release: 3 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright' },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.32 } },
    ],
  },
  {
    id: 'only-the-harmonics-no-hand-no-bow',
    name: 'No hand, no bow',
    category: 'drone',
    description:
      'Still air: the faintest wind, half of it hum, redrawn as pure sines that swell in and linger.',
    preview: OPEN,
    instrument: { deviceId: 'wind-harp', preset: 'Still air', params: { wind: 0.2, glint: 0.6 } },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Glass redraw',
        params: { partials: 12, attack: 900, release: 4, mix: 0.85 },
      },
    ],
  },
  {
    id: 'only-the-harmonics-octave-node-at-dusk',
    name: 'Octave node at dusk',
    category: 'pad',
    description:
      'A slow swelling harp with the octave above added to it late, dark and wide in a long hall.',
    preview: HARMONY,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Slow swell',
      params: { wind: 0.45, glint: 0.3, hum: 0.5, ring: 8, release: 4 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Slow halo', params: { up1: 0.5, up2: 0.15, filter: 3000 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'only-the-harmonics-third-of-the-string',
    name: 'Third of the string',
    category: 'organ',
    description:
      'A close wind harp given organ stops a fifth and a twelfth above, so each note also speaks its third harmonic.',
    preview: FALLING,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Wind harp',
      params: { wind: 0.5, gust: 0.2, lull: 0, glint: 0.3, hum: 0.5, air: 0.05 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Hollow fifths', params: { speak: 250, mix: 0.65 } },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'only-the-harmonics-fence-down-the-lane',
    name: 'Fence down the lane',
    category: 'texture',
    description:
      'Humming wires heard through a lightly driven amplifier far down a hall, narrow and boxed.',
    preview: C_NODES,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Fence wires',
      params: { hum: 1, ring: 3, gust: 0.3, width: 0.2 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Down the hall', params: { noise: 0 } }],
  },
  {
    id: 'only-the-harmonics-glass-above-the-bridge',
    name: 'Glass above the bridge',
    category: 'bell',
    description:
      'A plucked, glinting string whose partials are stretched apart into a glassy bar, with bright sparks thrown off above it.',
    preview: HALF_STRING,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Soft pluck',
      params: { touch: 0.85, glint: 1, ring: 3.5, wind: 0.2, release: 3 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Soft chime', params: { stretch: 0.28, mix: 0.6 } },
      { deviceId: 'glints', preset: 'First light', params: { mix: 0.22 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'only-the-harmonics-kites-tied-to-a-cello',
    name: 'Kites tied to a cello',
    category: 'wind',
    description:
      'A whistling string that swings in a slow figure of eight round the head while a sliding copy rises off every note.',
    preview: LONE,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Glass whistle',
      params: { volume: 4.5, wind: 0.6, gust: 0.8, glint: 0.7, ring: 2.2, hum: 0.2 },
    },
    effects: [
      { deviceId: 'falling', preset: 'Rising mist', params: { mix: 0.3 } },
      { deviceId: 'around', preset: 'Slow eight', params: { blur: 0.5 } },
    ],
  },
  {
    id: 'only-the-harmonics-storm-through-a-lute',
    name: 'Storm through a lute',
    category: 'texture',
    description:
      'Four strings a key in storm gusts with lulls, fuzzed softly between a short reverb and a long one.',
    preview: OVER_EACH,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Storm front',
      params: { lull: 0.4, air: 0.3, hum: 0.4 },
    },
    effects: [{ deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.4 } }],
  },
  {
    id: 'only-the-harmonics-attic-window-ajar',
    name: 'Attic window ajar',
    category: 'string',
    description:
      'A mild breeze on two strings a key, muffled behind the wood of a soundboard, close and nearly dry.',
    preview: FALLING,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Wind harp',
      params: { wind: 0.3, gust: 0.3, lull: 0.1, glint: 0.4, touch: 0.4, air: 0.05, ring: 2 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.7, tone: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'only-the-harmonics-a-string-after-dark',
    name: 'A string after dark',
    category: 'pad',
    description:
      'A breeze with some night air in it over a slow-moving bed that the reverb takes down an octave.',
    preview: COMMA,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Night wind',
      params: { volume: -5.5, lull: 0, air: 0.3, wind: 0.4, hum: 0.3, ring: 10 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.42 } }],
  },
  {
    id: 'only-the-harmonics-ladder-without-rungs',
    name: 'Ladder without rungs',
    category: 'texture',
    description:
      'A gusting ladder of single partials scattered by twelve quick echoes into one flickering cloud.',
    preview: G_NODES,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Overtone ladder',
      params: { volume: 1, glint: 0.8, ring: 0.5, air: 0, touch: 0.4 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Close flicker', params: { span: 420, mix: 0.5 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'only-the-harmonics-long-wire-slow-hand',
    name: 'Long wire, slow hand',
    category: 'pad',
    description:
      'A shimmering course blurred so far that its changes melt together, the blur dark and wide.',
    preview: RISING,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Shimmer course',
      params: { strings: 3, glint: 0.6, ring: 12, release: 6 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.75 } }],
  },
  {
    id: 'only-the-harmonics-harp-left-on-the-shore',
    name: 'Harp left on the shore',
    category: 'string',
    description:
      'A sea-wind harp far down the shore: dulled by distance, mostly room, its level lifted back by a limiter.',
    preview: TILT,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Sea breeze',
      params: { volume: -12.5, air: 0.15, gust: 0.6, lull: 0, touch: 0.5, strings: 1 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Far shore' },
      { deviceId: 'ambient-limiter', preset: 'Loud' },
    ],
  },
  {
    id: 'only-the-harmonics-two-es-at-the-window',
    name: 'Two Es at the window',
    category: 'drone',
    description:
      'A hum-heavy harp split in two about two hertz apart, so each held note beats slowly from side to side, on a dark plate.',
    preview: COMMA,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Low hum',
      params: { volume: -3.5, wind: 0.45, glint: 0.8, hum: 0.5, strings: 1, ring: 4 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Moving beat', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'only-the-harmonics-frost-on-the-a-string',
    name: 'Frost on the A string',
    category: 'bell',
    description:
      'Plucked courses with everything below seven hundred hertz filtered off, frosted with slow sparks two octaves up.',
    preview: ROCKING_BOW,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Plucked course',
      params: { volume: -3, strings: 2, glint: 1, ring: 5, touch: 0.8, release: 4 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 700, slope: 0 } },
      { deviceId: 'glints', preset: 'Slow stars', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'only-the-harmonics-breath-drawn-on-wire',
    name: 'Breath drawn on wire',
    category: 'pad',
    description:
      'A steady harp opened and closed by a slow breath, its level and width growing as it is drawn in.',
    preview: HARMONY,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Wind harp',
      params: { wind: 0.6, gust: 0.1, lull: 0, strings: 3, glint: 0.5, ring: 6 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Opening wide', params: { in: 1.6, out: 2.2, depth: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air' },
    ],
  },
  {
    id: 'only-the-harmonics-wind-that-forgets',
    name: 'Wind that forgets',
    category: 'texture',
    description:
      'Slow gusts whose last moments return backwards in long soft swells behind the next ones.',
    preview: OVER_EACH,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Long lulls',
      params: { volume: -3, gust: 0.8, wind: 0.6, hum: 0.5, ring: 5, strings: 3 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.55 } }],
  },
  {
    id: 'only-the-harmonics-halfway-up-the-wire',
    name: 'Halfway up the wire',
    category: 'string',
    description:
      'A bare touched string with a high octave sounding beside it and the original kept low, in a bright chamber.',
    preview: WHOLE_LINE,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Bare string',
      params: { touch: 0.8, glint: 0.4, ring: 2, wind: 0.2 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'High voice alone', params: { dry: 0.25 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'only-the-harmonics-four-corners-of-a-field',
    name: 'Four corners of a field',
    category: 'pad',
    description:
      'A full course turned into a flock of copies, each with its own distance and bend, far out to every side.',
    preview: BAR,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Shimmer course',
      params: { strings: 4, wind: 0.8, gust: 0.6, glint: 0.5, air: 0.4, ring: 2 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Cloud far off', params: { mix: 0.7 } }],
  },
  {
    id: 'only-the-harmonics-wires-learning-a-tune',
    name: 'Wires learning a tune',
    category: 'plucked',
    description:
      'Softly plucked wires set ringing in sympathy with a bank of strings that learns the tune it hears.',
    preview: G_NODES,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Soft pluck',
      params: { touch: 0.7, glint: 0.3, hum: 0.5, ring: 1, strings: 2 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Learn and hold', params: { mix: 0.5 } }],
  },
  {
    id: 'only-the-harmonics-gale-heard-indoors',
    name: 'Gale heard indoors',
    category: 'drone',
    description:
      'A gale on the strings with the walls between: dulled, narrow and dry, then given a small dark room.',
    preview: OPEN,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'High gale',
      params: { wind: 0.75, hum: 0.6, air: 0.1, ring: 3, width: 0.3 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door' },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  // Guitar: natural harmonics at its frets. How near the node the pick falls, how hard the finger
  // is, and what amplifier or room the ringing strings are given.
  {
    id: 'only-the-harmonics-fret-twelve-light-touch',
    name: 'Fret twelve, light touch',
    category: 'plucked',
    description:
      'A hard pick right at the string end heard from the neck pickup, long and bell-like, with an airy hall on top.',
    preview: FRETS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Clean bell',
      params: { volume: 3.5, hardness: 0.85, warmth: 0.05, shimmer: 0.2 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'only-the-harmonics-seventh-fret-by-lamp',
    name: 'Seventh fret by lamp',
    category: 'plucked',
    description:
      'A clean neck-pickup guitar, its highs kept, with swaying repeats spread to both sides.',
    preview: FRETS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { volume: 1.5, sustain: 14, tone: 4400, hardness: 0.4 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Chorused', params: { time: 480, mix: 0.34 } }],
  },
  {
    id: 'only-the-harmonics-one-bar-every-string',
    name: 'One bar, every string',
    category: 'plucked',
    description:
      'Slow soft strums laid through a quiet rotating speaker, every string touched at one node.',
    preview: BAR,
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow strum',
      params: { volume: 0, strum: 75, tone: 3600, warmth: 0.3 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'only-the-harmonics-swelled-out-of-a-node',
    name: 'Swelled out of a node',
    category: 'pad',
    description:
      'Volume swells with no pick in them, their reverb climbing in fifths behind each one.',
    preview: RISING,
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { volume: 6, swell: 0.45, pickup: 0.4, tone: 4200, warmth: 0.5 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.36 } }],
  },
  {
    id: 'only-the-harmonics-palm-behind-the-node',
    name: 'Palm behind the node',
    category: 'plucked',
    description:
      'Soft notes with the pick taken off them, squashed even and kept going by dotted tape repeats that cross from side to side.',
    preview: ROCKING_BOW,
    instrument: {
      deviceId: 'guitar',
      preset: 'Muted pattern',
      params: { volume: 6, sustain: 3, warmth: 0.5, hardness: 0.35, swell: 0.03, pickup: 0.35 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -8 } },
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 540, mix: 0.36 } },
    ],
  },
  {
    id: 'only-the-harmonics-paired-courses-brushed',
    name: 'Paired courses, brushed',
    category: 'plucked',
    description:
      'A bright brushed guitar with a detuned octave above every string, swept slowly by a wide flanger.',
    preview: BAR,
    instrument: {
      deviceId: 'guitar',
      preset: 'Twelve string',
      params: { volume: 4.5, strum: 45, hardness: 0.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string', params: { dry: 0.8 } },
      { deviceId: 'flanger', preset: 'Wide wash', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'only-the-harmonics-picked-past-the-bridge',
    name: 'Picked past the bridge',
    category: 'plucked',
    description:
      'A firm pick at the bridge, all edge and little body, thrown into three long springs.',
    preview: WHOLE_LINE,
    instrument: {
      deviceId: 'guitar',
      preset: 'Bridge twang',
      params: { volume: -1.5, sustain: 5, position: 0.07, warmth: 0.15, hardness: 0.7 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.38 } }],
  },
  {
    id: 'only-the-harmonics-side-of-the-thumb',
    name: 'Side of the thumb',
    category: 'plucked',
    description:
      'The fleshy thumb over the neck, very dark and soft, doubled a little and left nearly dry.',
    preview: FRETS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Thumb and neck',
      params: { volume: 5.5, sustain: 9, position: 0.35, warmth: 0.15 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Late copy', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'only-the-harmonics-fret-nineteen-in-frost',
    name: 'Fret nineteen in frost',
    category: 'bell',
    description:
      'A bell-toned guitar with its partials stretched wide and cold, over a small bright tank.',
    preview: HALF_STRING,
    instrument: {
      deviceId: 'guitar',
      preset: 'Clean bell',
      params: { pickup: 0.6, tone: 5500, sustain: 10, position: 0.07 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Bright spray', params: { stretch: 0.3, mix: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { decay: 3, mix: 0.3 } },
    ],
  },
  {
    id: 'only-the-harmonics-six-strings-like-water',
    name: 'Six strings like water',
    category: 'plucked',
    description:
      'A wide slow roll across the strings, answered by stacked loops of itself at the octave.',
    preview: BAR,
    instrument: {
      deviceId: 'guitar',
      preset: 'Harp roll',
      params: { volume: 0.5, strum: 80, sustain: 14 },
    },
    effects: [{ deviceId: 'cascade', preset: 'Octave stack', params: { mix: 0.4 } }],
  },
  {
    id: 'only-the-harmonics-nail-filed-away',
    name: 'Nail filed away',
    category: 'pad',
    description:
      'A long soft-entry guitar with every attack dissolved into cloud, no tail added after it.',
    preview: HARMONY,
    instrument: {
      deviceId: 'guitar',
      preset: 'Hidden pick',
      params: { volume: 6, swell: 0.4, shimmer: 0.6, tone: 3200 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack' },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'only-the-harmonics-low-string-fifth-node',
    name: 'Low string, fifth node',
    category: 'plucked',
    description:
      'A dark baritone string that wakes a bank of strings tuned to C major, ringing long and wide.',
    preview: C_NODES,
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark baritone',
      params: { volume: 1.5, position: 0.06, sustain: 18, tone: 2600 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Long ring', params: { mix: 0.5 } }],
  },
  {
    id: 'only-the-harmonics-held-until-it-turns',
    name: 'Held until it turns',
    category: 'string',
    description:
      'A warm guitar feeding back through its amplifier until each held note turns over into an overtone.',
    preview: TILT,
    instrument: {
      deviceId: 'guitar',
      preset: 'Warm breakup',
      params: { volume: -1.5, warmth: 0.7, sustain: 16, tone: 2800 },
    },
    effects: [
      { deviceId: 'howl', preset: 'Slow bloom', params: { mix: 0.5 } },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'only-the-harmonics-damped-between-nodes',
    name: 'Damped between nodes',
    category: 'plucked',
    description:
      'Dull, quickly damped notes that skip away in closing echoes, each softer and darker, side to side.',
    preview: ROCKING_BOW,
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark stops',
      params: { volume: 6, sustain: 1.2, hardness: 0.35, tone: 2000 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Skipping stone', params: { first: 420, mix: 0.4 } },
    ],
  },
  {
    id: 'only-the-harmonics-string-without-an-end',
    name: 'String without an end',
    category: 'drone',
    description:
      'A thick slow guitar caught by a sustainer and held as a dark gliding bed long after the pick.',
    preview: COMMA,
    instrument: {
      deviceId: 'guitar',
      preset: 'Thick growl',
      params: { volume: -3.5, warmth: 0.4, tone: 2200, strum: 30 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Long glide', params: { attack: 0.5, mix: 0.7 } }],
  },
  {
    id: 'only-the-harmonics-rolled-beside-the-ear',
    name: 'Rolled beside the ear',
    category: 'plucked',
    description:
      'Short dry rolled chords pushed softly through a tube, forward in the middle and close.',
    preview: TWO_BOWS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Dry rolled chord',
      params: { sustain: 3, strum: 55 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'only-the-harmonics-backwards-off-the-fret',
    name: 'Backwards off the fret',
    category: 'pad',
    description:
      'Slow warm swells whose echoes run backwards an octave up, smooth and thin above them.',
    preview: HARMONY,
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow warm swell',
      params: { swell: 0.9, warmth: 0.5, tone: 3000 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Rising glass', params: { mix: 0.45 } }],
  },
  // Graft: the string of the pack played by other means, a bow barely on it, breath across it, a
  // mallet, a nail; and the overblown pipe beside it, which finds the odd ones of the
  // same notes by the same law; a bar and a bowl for glass.
  {
    id: 'only-the-harmonics-breath-across-the-d',
    name: 'Breath across the D',
    category: 'wind',
    description:
      'A string blown at its middle, airy and slow to speak, inside a bottle body with a little hall.',
    preview: TWO_BOWS,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown string',
      params: { position: 0.5, air: 0.6, swell: 0.35, bright: 0.4 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Blown bottle', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'only-the-harmonics-bow-almost-not-there',
    name: 'Bow almost not there',
    category: 'string',
    description:
      'A bowed string at almost no pressure, bright and breathy, kept thin with its body cut away.',
    preview: RISING,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: {
        volume: 3.5,
        pressure: 0.1,
        position: 0.45,
        bright: 0.8,
        air: 0.5,
        swell: 0.4,
        release: 1.2,
        wander: 0.05,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 14000 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'only-the-harmonics-mallet-on-the-half',
    name: 'Mallet on the half',
    category: 'plucked',
    description:
      'A soft mallet at the middle of a long string, its strikes let through just after the tone.',
    preview: HALF_STRING,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck string',
      params: { volume: 2.5, position: 0.5, bright: 0.3, decay: 9, release: 3 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Strike just after', params: { late: 90 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'only-the-harmonics-feather-then-the-nail',
    name: 'Feather, then the nail',
    category: 'plucked',
    description:
      'A sharp pluck near the string end with a long decay, scattered by faint bright echoes.',
    preview: WHOLE_LINE,
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked string',
      params: { volume: 3, position: 0.08, bright: 0.85, decay: 8, pressure: 0.3, release: 1.5 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Faint points', params: { mix: 0.3 } }],
  },
  {
    id: 'only-the-harmonics-overblown-on-a-hillside',
    name: 'Overblown on a hillside',
    category: 'wind',
    description:
      'A breathy stopped pipe in the open air, some way off, with hardly any room to answer.',
    preview: LONE,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown pipe',
      params: { pressure: 0.7, air: 0.55, swell: 0.12, release: 0.5 },
    },
    effects: [{ deviceId: 'distance', preset: 'Open air', params: { wander: 0.1 } }],
  },
  {
    id: 'only-the-harmonics-reed-of-horsehair',
    name: 'Reed of horsehair',
    category: 'wind',
    description:
      'A pipe pressed hard by a bow near its end, with organ stops a twelfth and two octaves above it.',
    preview: TILT,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed pipe',
      params: {
        volume: -9,
        pressure: 0.8,
        position: 0.15,
        bright: 0.65,
        air: 0.35,
        swell: 0.5,
        release: 1.5,
      },
    },
    effects: [
      { deviceId: 'stops', preset: 'Glass on top', params: { mix: 0.65 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'only-the-harmonics-knuckle-on-a-tube',
    name: 'Knuckle on a tube',
    category: 'plucked',
    description: 'Short knocks on a stopped pipe, patterned into quick echoes from a small swarm.',
    preview: ROCKING_BOW,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck pipe',
      params: { volume: 6, decay: 0.7, air: 0.15, bright: 0.65 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.4 } }],
  },
  {
    id: 'only-the-harmonics-thumb-off-the-bottle',
    name: 'Thumb off the bottle',
    category: 'plucked',
    description:
      'A popped pipe ringing a moment, turned in a slow phaser and answered by one or two dark echoes.',
    preview: G_NODES,
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked pipe',
      params: { volume: 1.5, decay: 4, position: 0.2, air: 0.5, release: 2 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.5 } },
      { deviceId: 'analog-delay', preset: 'Murky', params: { feedback: 0.15, mix: 0.3 } },
    ],
  },
  {
    id: 'only-the-harmonics-g-string-lit-by-glass',
    name: 'G string lit by glass',
    category: 'string',
    description:
      'A bowed bar standing in for a glassy string, slow and pure, a high octave halo drawn behind it in sines.',
    preview: FALLING,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bar',
      params: { pressure: 0.25, swell: 0.35, release: 2.5, bright: 0.6 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.5 } }],
  },
  {
    id: 'only-the-harmonics-rim-of-the-sixth',
    name: 'Rim of the sixth',
    category: 'pad',
    description:
      'A bowed bowl that takes a second to speak, glimmering band by band, ringing on for eight seconds.',
    preview: COMMA,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bowl',
      params: { swell: 1, bright: 0.95, position: 0.15 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Light on water' },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'only-the-harmonics-wire-hit-and-left',
    name: 'Wire hit and left',
    category: 'bell',
    description:
      'A hard bright hit on a string that then rings free, its ringing caught by bowls in fifths over G.',
    preview: G_NODES,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck string',
      params: { pressure: 0.9, position: 0.12, bright: 0.9, decay: 14, release: 6 },
    },
    effects: [{ deviceId: 'bowls', preset: 'Low fifths', params: { root: 7, mix: 0.4 } }],
  },
  {
    id: 'only-the-harmonics-over-the-board-shut-in',
    name: 'Over the board, shut in',
    category: 'string',
    description:
      'A dark bowed string, its bright edge gone, played through an amplifier shut in a cupboard.',
    preview: FALLING,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: { volume: -2.5, pressure: 0.3, position: 0.5, bright: 0.1, swell: 0.25, air: 0.3 },
    },
    effects: [{ deviceId: 're-amp', preset: 'In the cupboard', params: { noise: 0 } }],
  },
  {
    id: 'only-the-harmonics-lips-at-the-node',
    name: 'Lips at the node',
    category: 'pad',
    description:
      'Hard breath on a bright string with soft entries, its tail shaped into a soft round vowel behind the notes.',
    preview: HARMONY,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown string',
      params: { bright: 0.75, pressure: 0.75, swell: 0.5, release: 2, air: 0.1, position: 0.2 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.45 } }],
  },
  {
    id: 'only-the-harmonics-plucked-from-a-bowl',
    name: 'Plucked from a bowl',
    category: 'bell',
    description:
      'A bowl flicked rather than rubbed, its ring pulled slowly up into thin air as it fades.',
    preview: WHOLE_LINE,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck bowl',
      params: { volume: 1, exciter: 3, bright: 0.5, decay: 5, pressure: 0.3, release: 3 },
    },
    effects: [{ deviceId: 'melt', preset: 'Into thin air', params: { mix: 0.45 } }],
  },
  {
    id: 'only-the-harmonics-fifth-drawn-alongside',
    name: 'Fifth drawn alongside',
    category: 'string',
    description:
      'A slowly bowed string with a fifth added beside each note, drifting in a deep slow chorus.',
    preview: OPEN,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: { swell: 1.4, release: 3, bright: 0.65, pressure: 0.8, position: 0.12 },
    },
    effects: [
      { deviceId: 'size', preset: 'Fifth beside', params: { mix: 0.4 } },
      { deviceId: 'chorus', preset: 'Deep sea', params: { feedback: 0 } },
    ],
  },
  {
    id: 'only-the-harmonics-pipe-that-found-the-e',
    name: 'Pipe that found the E',
    category: 'wind',
    description:
      'A clean soft pipe with little breath followed by copies an octave up and an octave down, wide apart.',
    preview: LONE,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown pipe',
      params: {
        volume: -1.5,
        air: 0.05,
        bright: 0.25,
        pressure: 0.3,
        swell: 0.25,
        release: 1,
        wander: 0.05,
      },
    },
    effects: [{ deviceId: 'canon', preset: 'Octaves apart', params: { mix: 0.35 } }],
  },
  // Bow: one string, plucked, held or bowed, with no vibrato anywhere. How far from the bridge,
  // how light the bow, and which partials of which open string are brought out.
  {
    id: 'only-the-harmonics-flautando-over-open-c',
    name: 'Flautando over open C',
    category: 'string',
    description:
      'A weightless bow far from the bridge, a resonance stepping through harmonics two to six of C inside it.',
    preview: RISING,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { volume: -5, attack: 0.35, brightness: 0.45, vibrato: 0, release: 1.5 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'Thin drone',
        params: { root: 0, octave: 2, low: 2, high: 6, pace: 1.6, focus: 0.55 },
      },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'only-the-harmonics-rosin-and-little-else',
    name: 'Rosin and little else',
    category: 'string',
    description:
      'A bow right at the bridge with the body taken away, its noise spread wide and its tone kept back.',
    preview: TILT,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: {
        volume: -4.5,
        attack: 0.25,
        pressure: 0.6,
        position: 0.03,
        body: 0.05,
        vibrato: 0,
        release: 1.2,
      },
    },
    effects: [
      { deviceId: 'sift', preset: 'Wide air', params: { tones: -5 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'only-the-harmonics-g-string-sings-its-five',
    name: 'G string sings its five',
    category: 'string',
    description:
      'A glassy bow with the fifth harmonic of G held out of it as a whistle, the rest kept lower.',
    preview: G_NODES,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.5, release: 3, vibrato: 0, detune: 2 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'One held note',
        params: { root: 7, octave: 2, low: 5, high: 5, focus: 0.6, drone: 0.6 },
      },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'only-the-harmonics-twelfth-left-burning',
    name: 'Twelfth left burning',
    category: 'pad',
    description:
      'A sustained string at full brightness that beats a little with itself, blurred into a bright glass halo.',
    preview: COMMA,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Twelfth glow',
      params: { attack: 0.9, vibrato: 0, detune: 5 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.5 } }],
  },
  {
    id: 'only-the-harmonics-four-open-bows',
    name: 'Four open bows',
    category: 'drone',
    description:
      'Open strings bowed without vibrato in a full body, their bands swelling one after another, very slowly.',
    preview: OPEN,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 0.9, vibrato: 0, release: 3, position: 0.16, pressure: 0.4 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Deep swell' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'only-the-harmonics-feedback-finds-a-node',
    name: 'Feedback finds a node',
    category: 'string',
    description:
      'A hard-driven sustained string turning over to its octave, its lows and highs trembling in turn, set back and dulled.',
    preview: COMMA,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 1.1, vibrato: 0, detune: 0, pressure: 1 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { depth: 0.6, rate: 2.2 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'only-the-harmonics-pizzicato-at-the-half',
    name: 'Pizzicato at the half',
    category: 'plucked',
    description:
      'A string plucked exactly at its middle, hollow and clear, with other strings tuning themselves to the line.',
    preview: HALF_STRING,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { position: 0.5, brightness: 0.6, body: 0.4, decay: 7, detune: 0 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.45 } }],
  },
  {
    id: 'only-the-harmonics-quarter-of-a-wire',
    name: 'Quarter of a wire',
    category: 'plucked',
    description:
      'A bright wire plucked at its quarter and left ringing in two long loops that slide against each other.',
    preview: WHOLE_LINE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { position: 0.25, brightness: 0.7, release: 3 },
    },
    effects: [{ deviceId: 'orbits', preset: 'Floating pair', params: { feedback: 0.6, mix: 0.4 } }],
  },
  {
    id: 'only-the-harmonics-a-comma-on-one-course',
    name: 'A comma on one course',
    category: 'plucked',
    description:
      'Two strings a note set twenty one and a half cents apart, the width of the comma, their long beating tails brought up.',
    preview: FALLING,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { detune: 21.5, position: 0.5, brightness: 0.4, release: 5 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Long tails' },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'only-the-harmonics-tone-with-no-grain',
    name: 'Tone with no grain',
    category: 'pad',
    description:
      'The plainest sustained tone, no body and hardly any brightness, redrawn a fifth higher in soft sines behind it.',
    preview: HARMONY,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 0.7, release: 3, brightness: 0.1 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Fifth above', params: { mix: 0.35 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },
  {
    id: 'only-the-harmonics-drawn-up-from-nothing',
    name: 'Drawn up from nothing',
    category: 'pad',
    description:
      'Plucked strings with their attack held back, a glassy pad growing behind them and fading when they stop.',
    preview: RISING,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { volume: 4.5, attack: 0.5, vibrato: 0, detune: 3, position: 0.06 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Glassy', params: { mix: 0.5 } }],
  },
  {
    id: 'only-the-harmonics-hand-flat-on-the-strings',
    name: 'Hand flat on the strings',
    category: 'plucked',
    description:
      'Woody damped plucks in a full body, with an echo that brings back flickers of what was just played.',
    preview: ROCKING_BOW,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { brightness: 0.3, decay: 2, position: 0.15 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Flickers', params: { mix: 0.45 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'only-the-harmonics-quick-light-up-bow',
    name: 'Quick light up-bow',
    category: 'string',
    description:
      'A bow that speaks at once and stops at once, thin and even, a faint slow cloud of itself trailing far behind.',
    preview: LONE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: {
        attack: 0.06,
        release: 0.4,
        brightness: 0.65,
        position: 0.2,
        pressure: 0.1,
        vibrato: 0,
        detune: 0,
      },
    },
    effects: [{ deviceId: 'stretch', preset: 'Faint halo', params: { mix: 0.35 } }],
  },
  {
    id: 'only-the-harmonics-two-bows-one-node',
    name: 'Two bows, one node',
    category: 'pad',
    description:
      'Two bows a note set sixteen cents apart, light and without vibrato, all at one node in a vast nave.',
    preview: BAR,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: {
        attack: 0.9,
        vibrato: 0,
        detune: 16,
        brightness: 0.75,
        body: 0.2,
        position: 0.35,
        pressure: 0.1,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.42 } }],
  },
  // Harp: every note an octave above its written string, plucked at the half with the heel of the
  // hand laid on; then the hand moved, and the koto's and the guzheng's strings touched the same way.
  {
    id: 'only-the-harmonics-heel-laid-at-the-half',
    name: 'Heel laid at the half',
    category: 'plucked',
    description:
      'Plucked at the half string with a very soft finger, round and hollow, hardly wet.',
    preview: HALF_STRING,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: 0, touch: 0.1, decay: 2, halo: 0.6, body: 0.8 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow' },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'only-the-harmonics-half-string-unfolding',
    name: 'Half string, unfolding',
    category: 'plucked',
    description:
      'A half-plucked harp whose ringing strings all answer, each note fanned from its highs down to its lows.',
    preview: HALF_STRING,
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { volume: -1.5, pluck: 0.5, touch: 0.1, decay: 2.2 },
    },
    effects: [{ deviceId: 'prism', preset: 'High to low', params: { mix: 0.45 } }],
  },
  {
    id: 'only-the-harmonics-harp-an-octave-over',
    name: 'Harp an octave over',
    category: 'bell',
    description:
      'A damped harp almost replaced by the octave above it, small and bell-like, in a plate.',
    preview: WHOLE_LINE,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { volume: 3.5, damp: 0.5, pluck: 0.5, body: 0.3 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'High voice alone', params: { dry: 0.2, detune: 0.1 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'only-the-harmonics-close-to-the-wood',
    name: 'Close to the wood',
    category: 'plucked',
    description:
      'Plucked close to the soundboard, thin, on fluttering tape with a little of its hiss, in a bright chamber.',
    preview: ROCKING_BOW,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { volume: 6, pluck: 0.07, touch: 0.5, decay: 1.4, body: 0.3 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Flutter shimmer', params: { hiss: 0.15 } },
      { deviceId: 'expanse', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'only-the-harmonics-silk-barely-pressed',
    name: 'Silk barely pressed',
    category: 'plucked',
    description:
      'A soft koto touched without any bend, its tail gliding slowly upward and never arriving.',
    preview: TWO_BOWS,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { volume: 2.5, bend: 0, pluck: 0.33, decay: 2.2 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.42 } }],
  },
  {
    id: 'only-the-harmonics-bridge-left-of-c',
    name: 'Bridge left of C',
    category: 'bell',
    description:
      'A ringing guzheng whose partials are split around C into a bell, kept low under the string, with a faint bright tail.',
    preview: G_NODES,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { volume: 4, pluck: 0.25, touch: 0.4, decay: 2.5, halo: 0.8 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Bell on the root', params: { root: 0, drift: 0.1, mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'only-the-harmonics-arms-across-the-harp',
    name: 'Arms across the harp',
    category: 'plucked',
    description:
      'Chords rolled for well over a second, plucked at the half, with a late answer an octave and fifth up.',
    preview: BAR,
    instrument: {
      deviceId: 'harp',
      preset: 'Slow rolled chord',
      params: { volume: -1, pluck: 0.5, touch: 0.15, sweep: 1.4 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Late answer', params: { mix: 0.38 } }],
  },
  {
    id: 'only-the-harmonics-flageolets-pinched-dry',
    name: 'Flageolets, pinched dry',
    category: 'plucked',
    description:
      'Very short plucks at the middle of the string, each followed by a small halo a third of a second long.',
    preview: ROCKING_BOW,
    instrument: {
      deviceId: 'harp',
      preset: 'Short dry pluck',
      params: { volume: 4, pluck: 0.5, touch: 0.35, decay: 0.4, damp: 0.7, body: 0.7 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.45 } }],
  },
  {
    id: 'only-the-harmonics-strings-let-down-slowly',
    name: 'Strings let down slowly',
    category: 'pad',
    description: 'A harp that rings while held, most of each pluck faded in, slowly clouding over.',
    preview: HARMONY,
    instrument: {
      deviceId: 'harp',
      preset: 'Rings while held',
      params: { volume: -2.5, pluck: 0.45, touch: 0.2, halo: 1 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 500, mix: 0.8 } },
      { deviceId: 'stretch', preset: 'Slow cloud', params: { mix: 0.4 } },
    ],
  },
  // Chamber strings: the section the line was written for. No player presses a string or moves a
  // finger, so there is no vibrato on any of them.
  {
    id: 'only-the-harmonics-three-cellos-touching',
    name: 'Three cellos touching',
    category: 'string',
    description:
      'Three still players bowing over the fingerboard, flute-like, a thin high space around them and nothing low in it.',
    preview: RISING,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { volume: -4, attack: 0.5, release: 2, scatter: 0 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { decay: 6, mix: 0.3 } }],
  },
  {
    id: 'only-the-harmonics-desks-at-the-bridge',
    name: 'Desks at the bridge',
    category: 'string',
    description:
      'Bows on the bridge with all their edge, everything under five hundred hertz taken off, in a bright hall.',
    preview: FALLING,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { volume: -1, attack: 0.4, players: 4, release: 2 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 500, slope: 0 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'only-the-harmonics-hair-and-air',
    name: 'Hair and air',
    category: 'string',
    description:
      'More bow hair than tone, with the quiet overtones inside it turned up until they stand level.',
    preview: TILT,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { volume: -2.5, attack: 0.4, air: 1, bow: 0.4, players: 2 },
    },
    effects: [{ deviceId: 'reveal', preset: 'Overtones' }],
  },
  {
    id: 'only-the-harmonics-first-desk-from-the-back',
    name: 'First desk from the back',
    category: 'string',
    description: 'One player without vibrato, muted a little, heard from the back of a hall.',
    preview: LONE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { volume: -3, vibrato: 0, bow: 0.25, mute: 0.4, air: 0.45 },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
  },
  {
    id: 'only-the-harmonics-veil-over-four-strings',
    name: 'Veil over four strings',
    category: 'pad',
    description:
      'Muted bows as one thin veil, pressed into the shape of a hollow tube and doubled slowly wide.',
    preview: BAR,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Thin veil',
      params: { volume: -1.5, attack: 0.8, release: 2.5, players: 3 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube' },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },
  {
    id: 'only-the-harmonics-consort-of-flageolets',
    name: 'Consort of flageolets',
    category: 'string',
    description:
      'A muted consort in strict unison, a resonance on the third harmonic of A standing over its chords.',
    preview: TWO_BOWS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { volume: -2, bow: 0.5, attack: 0.25, release: 1.4 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'One held note',
        params: { root: 9, octave: 3, low: 3, high: 3, focus: 0.5, drone: 0.75 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'only-the-harmonics-two-players-two-es',
    name: 'Two players, two Es',
    category: 'drone',
    description:
      'Two drifting players with no mute, only what was already sounding a moment ago let through and left hanging.',
    preview: COMMA,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wandering solo',
      params: { players: 2, attack: 0.35, mute: 0, width: 1, bow: 0.55 },
    },
    effects: [{ deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.75 } }],
  },
  {
    id: 'only-the-harmonics-bow-rocked-on-two',
    name: 'Bow rocked on two',
    category: 'string',
    description:
      'Short strokes rocking between strings, each bounced on as softer copies that cross the room.',
    preview: ROCKING_BOW,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { volume: -1, bow: 0.35, air: 0.4, release: 0.4, players: 3 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Wide rings', params: { first: 360, mix: 0.4 } },
    ],
  },
  // Flock: the same line whistled. No finger stops a whistle either.
  {
    id: 'only-the-harmonics-one-whistler-on-a',
    name: 'One whistler on A',
    category: 'wind',
    description:
      'A single pure voice that slides up into each note and drifts off it soon after, a clean echo and a distant plate behind.',
    preview: LONE,
    instrument: {
      deviceId: 'flock',
      preset: 'One whistle',
      params: { gather: 0.12, tone: 0.1, leave: 0.8 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 550, feedback: 0.25, mix: 0.3 },
      },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'only-the-harmonics-breath-of-pure-fifths',
    name: 'Breath of pure fifths',
    category: 'pad',
    description:
      'Eight steady voices arriving quickly with no straying, sparked with overtones of what they sing.',
    preview: BAR,
    instrument: {
      deviceId: 'flock',
      preset: 'Glass swarm',
      params: { gather: 0.4, stray: 0, flutter: 0.3, octaves: 0.2, leave: 2 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Overtone spray', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'only-the-harmonics-two-pipes-hollow-e',
    name: 'Two pipes, hollow E',
    category: 'wind',
    description:
      'Two reedy voices set wide, straying just enough to beat, inside a clay pot of a body.',
    preview: TWO_BOWS,
    instrument: {
      deviceId: 'flock',
      preset: 'Hollow pair',
      params: { stray: 0.1, tone: 0.8, leave: 1.2, gather: 0.25 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.6 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
]
