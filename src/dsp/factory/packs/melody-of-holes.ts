import { type FactoryPreset, type Phrase } from '../types'

// A held cluster of five notes from which one note at a time is taken away for a while: the tune is
// in what stops. So every sound here holds level, closes soon after a key comes up and opens again
// without a fuss. Laid out on how fast the edge of a gap is, on the register, and on how bright
// and how steady the notes are that stay; the rooms are short, or thin enough to see through.

// C D E G A in one hand; the gaps sing A G E G A D, nine tenths of a second each.
const NINE_ADDED: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 5.4, note: 62, gain: 0.5 },
    { atSec: 0, durSec: 2.7, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 1.8, note: 67, gain: 0.5 },
    { atSec: 0, durSec: 0.9, note: 69, gain: 0.5 },
    { atSec: 1.8, durSec: 2.7, note: 69, gain: 0.5 },
    { atSec: 2.7, durSec: 0.9, note: 67, gain: 0.5 },
    { atSec: 3.6, durSec: 3.6, note: 64, gain: 0.5 },
    { atSec: 4.5, durSec: 2.7, note: 67, gain: 0.5 },
    { atSec: 5.4, durSec: 1.8, note: 69, gain: 0.5 },
    { atSec: 6.3, durSec: 0.9, note: 62, gain: 0.5 },
  ],
}

// A minor ninth, A C E G B; the same line of gaps read off its own notes: B G E G B C.
const MINOR_NINTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 5.4, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 2.7, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 1.8, note: 67, gain: 0.5 },
    { atSec: 0, durSec: 0.9, note: 71, gain: 0.5 },
    { atSec: 1.8, durSec: 2.7, note: 71, gain: 0.5 },
    { atSec: 2.7, durSec: 0.9, note: 67, gain: 0.5 },
    { atSec: 3.6, durSec: 3.6, note: 64, gain: 0.5 },
    { atSec: 4.5, durSec: 2.7, note: 67, gain: 0.5 },
    { atSec: 5.4, durSec: 1.8, note: 71, gain: 0.5 },
    { atSec: 6.3, durSec: 0.9, note: 60, gain: 0.5 },
  ],
}

// F major ninth, F A C E G; two neighbours leave together, so the gaps sing in thirds: EG CE AC CE EG FA.
const IN_THIRDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.4, note: 53, gain: 0.5 },
    { atSec: 0, durSec: 2.7, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 1.8, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 0.9, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 0.9, note: 67, gain: 0.5 },
    { atSec: 1.8, durSec: 2.7, note: 67, gain: 0.5 },
    { atSec: 2.7, durSec: 0.9, note: 64, gain: 0.5 },
    { atSec: 3.6, durSec: 1.8, note: 57, gain: 0.5 },
    { atSec: 4.5, durSec: 2.8, note: 60, gain: 0.5 },
    { atSec: 5.4, durSec: 1.9, note: 64, gain: 0.5 },
    { atSec: 5.4, durSec: 1.9, note: 67, gain: 0.5 },
    { atSec: 6.3, durSec: 1, note: 53, gain: 0.5 },
    { atSec: 6.3, durSec: 1, note: 57, gain: 0.5 },
  ],
}

// D E G A B up high, no half step and no tritone in it; the gaps lilt long and short down to the floor: A.B G.A E D.
const UNDER_THE_ROOF: Phrase = {
  notes: [
    { atSec: 0, durSec: 4.7, note: 74, gain: 0.42 },
    { atSec: 0, durSec: 3.7, note: 76, gain: 0.42 },
    { atSec: 0, durSec: 2.2, note: 79, gain: 0.42 },
    { atSec: 0, durSec: 0.7, note: 81, gain: 0.42 },
    { atSec: 0, durSec: 1.7, note: 83, gain: 0.42 },
    { atSec: 1.7, durSec: 1.5, note: 81, gain: 0.42 },
    { atSec: 2.2, durSec: 4.8, note: 83, gain: 0.42 },
    { atSec: 3.2, durSec: 3.8, note: 79, gain: 0.42 },
    { atSec: 3.7, durSec: 3.3, note: 81, gain: 0.42 },
    { atSec: 4.7, durSec: 2.3, note: 76, gain: 0.42 },
    { atSec: 5.7, durSec: 1.3, note: 74, gain: 0.42 },
  ],
}

// F C G D A piled in fifths from a low F that never leaves; the gaps fall the whole pile A D G C, then climb back G A.
const FIFTHS_APART: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 41, gain: 0.55 },
    { atSec: 0, durSec: 3.65, note: 48, gain: 0.55 },
    { atSec: 0, durSec: 2.7, note: 55, gain: 0.5 },
    { atSec: 0, durSec: 1.75, note: 62, gain: 0.5 },
    { atSec: 0, durSec: 0.8, note: 69, gain: 0.5 },
    { atSec: 1.75, durSec: 3.8, note: 69, gain: 0.5 },
    { atSec: 2.7, durSec: 4.6, note: 62, gain: 0.5 },
    { atSec: 3.65, durSec: 0.95, note: 55, gain: 0.5 },
    { atSec: 4.6, durSec: 2.7, note: 48, gain: 0.55 },
    { atSec: 5.55, durSec: 1.75, note: 55, gain: 0.5 },
    { atSec: 6.5, durSec: 0.8, note: 69, gain: 0.5 },
  ],
}

// C D E G A, gaps A and G; then E moves up to F, the other four hold, gaps A G F; then F goes home to E, gap D.
const E_BECOMES_F: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 6, note: 62, gain: 0.5 },
    { atSec: 0, durSec: 2.8, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 1.6, note: 67, gain: 0.5 },
    { atSec: 0, durSec: 0.8, note: 69, gain: 0.5 },
    { atSec: 1.6, durSec: 1.2, note: 69, gain: 0.5 },
    { atSec: 2.4, durSec: 1.2, note: 67, gain: 0.5 },
    { atSec: 2.8, durSec: 1.6, note: 65, gain: 0.5 },
    { atSec: 3.6, durSec: 3.6, note: 69, gain: 0.5 },
    { atSec: 4.4, durSec: 2.8, note: 67, gain: 0.5 },
    { atSec: 5.2, durSec: 0.4, note: 65, gain: 0.5 },
    { atSec: 5.6, durSec: 1.6, note: 64, gain: 0.5 },
    { atSec: 6.7, durSec: 0.5, note: 62, gain: 0.5 },
  ],
}

// C D E G A with twelve short gaps, not quite half a second: A G E G, A G D E, G E D A.
const SHORT_HOLES: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 3.56, note: 62, gain: 0.5 },
    { atSec: 0, durSec: 1.72, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 1.26, note: 67, gain: 0.5 },
    { atSec: 0, durSec: 0.8, note: 69, gain: 0.5 },
    { atSec: 1.26, durSec: 1.38, note: 69, gain: 0.5 },
    { atSec: 1.72, durSec: 0.46, note: 67, gain: 0.5 },
    { atSec: 2.18, durSec: 1.84, note: 64, gain: 0.5 },
    { atSec: 2.64, durSec: 0.46, note: 67, gain: 0.5 },
    { atSec: 3.1, durSec: 2.76, note: 69, gain: 0.5 },
    { atSec: 3.56, durSec: 0.92, note: 67, gain: 0.5 },
    { atSec: 4.02, durSec: 1.38, note: 62, gain: 0.5 },
    { atSec: 4.48, durSec: 0.46, note: 64, gain: 0.5 },
    { atSec: 4.94, durSec: 2.06, note: 67, gain: 0.5 },
    { atSec: 5.4, durSec: 1.6, note: 64, gain: 0.5 },
    { atSec: 5.86, durSec: 1.14, note: 62, gain: 0.5 },
    { atSec: 6.32, durSec: 0.68, note: 69, gain: 0.5 },
  ],
}

// C D E G A over a low F that never stops; the gaps go long and short, G.E D.E G.A and a long E, and D to end.
const DOTTED_GATE: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 41, gain: 0.35 },
    { atSec: 0, durSec: 7.2, note: 60, gain: 0.45 },
    { atSec: 0, durSec: 2, note: 62, gain: 0.45 },
    { atSec: 0, durSec: 1.7, note: 64, gain: 0.45 },
    { atSec: 0, durSec: 0.8, note: 67, gain: 0.45 },
    { atSec: 0, durSec: 4.1, note: 69, gain: 0.45 },
    { atSec: 1.7, durSec: 1.5, note: 67, gain: 0.45 },
    { atSec: 2, durSec: 0.9, note: 64, gain: 0.45 },
    { atSec: 2.9, durSec: 2.7, note: 62, gain: 0.45 },
    { atSec: 3.2, durSec: 1.2, note: 64, gain: 0.45 },
    { atSec: 4.1, durSec: 3.1, note: 67, gain: 0.45 },
    { atSec: 4.4, durSec: 2.8, note: 69, gain: 0.45 },
    { atSec: 5.6, durSec: 1.6, note: 64, gain: 0.45 },
    { atSec: 6.2, durSec: 1, note: 62, gain: 0.45 },
  ],
}

// E A D G C in fourths; the gaps go down C G D A, up D and G, the bottom E never leaves.
const FOURTHS_UP: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 52, gain: 0.5 },
    { atSec: 0, durSec: 3.6, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 2.7, note: 62, gain: 0.5 },
    { atSec: 0, durSec: 1.8, note: 67, gain: 0.5 },
    { atSec: 0, durSec: 0.9, note: 72, gain: 0.5 },
    { atSec: 1.8, durSec: 5.4, note: 72, gain: 0.5 },
    { atSec: 2.7, durSec: 2.7, note: 67, gain: 0.5 },
    { atSec: 3.6, durSec: 0.9, note: 62, gain: 0.5 },
    { atSec: 4.5, durSec: 2.7, note: 57, gain: 0.5 },
    { atSec: 5.4, durSec: 1.8, note: 62, gain: 0.5 },
    { atSec: 6.3, durSec: 0.9, note: 67, gain: 0.5 },
  ],
}

// C D E G A; the two outer notes leave, the two inside them, the middle one, and the same way out again.
const OUTSIDE_IN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 2.05, note: 62, gain: 0.5 },
    { atSec: 0, durSec: 3.1, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 2.05, note: 67, gain: 0.5 },
    { atSec: 0, durSec: 1, note: 69, gain: 0.5 },
    { atSec: 2.05, durSec: 3.15, note: 60, gain: 0.5 },
    { atSec: 2.05, durSec: 3.15, note: 69, gain: 0.5 },
    { atSec: 3.1, durSec: 1.05, note: 62, gain: 0.5 },
    { atSec: 3.1, durSec: 1.05, note: 67, gain: 0.5 },
    { atSec: 4.15, durSec: 3.05, note: 64, gain: 0.5 },
    { atSec: 5.2, durSec: 2, note: 62, gain: 0.5 },
    { atSec: 5.2, durSec: 2, note: 67, gain: 0.5 },
    { atSec: 6.25, durSec: 0.95, note: 60, gain: 0.5 },
    { atSec: 6.25, durSec: 0.95, note: 69, gain: 0.5 },
  ],
}

// D A E G C, for low voices; four slow gaps climb E G C and drop to A, the low D stays.
const LOW_SEATS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 38, gain: 0.52 },
    { atSec: 0, durSec: 4.9, note: 45, gain: 0.52 },
    { atSec: 0, durSec: 1, note: 52, gain: 0.52 },
    { atSec: 0, durSec: 2.3, note: 55, gain: 0.52 },
    { atSec: 0, durSec: 3.6, note: 60, gain: 0.52 },
    { atSec: 2.3, durSec: 5, note: 52, gain: 0.52 },
    { atSec: 3.6, durSec: 3.7, note: 55, gain: 0.52 },
    { atSec: 4.9, durSec: 2.4, note: 60, gain: 0.52 },
    { atSec: 6.2, durSec: 1.1, note: 45, gain: 0.52 },
  ],
}

// A C D E G, for what speaks slowly; three gaps of a second and a half: G D E.
const LONG_HOLES: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.4, note: 57, gain: 0.55 },
    { atSec: 0, durSec: 7.4, note: 60, gain: 0.55 },
    { atSec: 0, durSec: 3, note: 62, gain: 0.55 },
    { atSec: 0, durSec: 4.5, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 1.5, note: 67, gain: 0.55 },
    { atSec: 3, durSec: 4.4, note: 67, gain: 0.55 },
    { atSec: 4.5, durSec: 2.9, note: 62, gain: 0.55 },
    { atSec: 6, durSec: 1.4, note: 64, gain: 0.55 },
  ],
}

// C G D A E in fifths, for what speaks slowly and has an octave under it; three gaps of a second and a half fall E A D.
const LONG_FIFTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.4, note: 48, gain: 0.52 },
    { atSec: 0, durSec: 7.4, note: 55, gain: 0.52 },
    { atSec: 0, durSec: 4.5, note: 62, gain: 0.52 },
    { atSec: 0, durSec: 3, note: 69, gain: 0.52 },
    { atSec: 0, durSec: 1.5, note: 76, gain: 0.52 },
    { atSec: 3, durSec: 4.4, note: 76, gain: 0.52 },
    { atSec: 4.5, durSec: 2.9, note: 69, gain: 0.52 },
    { atSec: 6, durSec: 1.4, note: 62, gain: 0.52 },
  ],
}

// D minor ninth, D F A C E; the gaps fall in thirds, E C A, and the same fall again a third lower, C A F.
const FALL_AGAIN: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.4, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 5.25, note: 53, gain: 0.5 },
    { atSec: 0, durSec: 2.25, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 1.5, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 0.75, note: 64, gain: 0.5 },
    { atSec: 1.5, durSec: 5.9, note: 64, gain: 0.5 },
    { atSec: 2.25, durSec: 1.5, note: 60, gain: 0.5 },
    { atSec: 3.75, durSec: 0.75, note: 57, gain: 0.5 },
    { atSec: 4.5, durSec: 2.9, note: 60, gain: 0.5 },
    { atSec: 5.25, durSec: 2.15, note: 57, gain: 0.5 },
    { atSec: 6.75, durSec: 0.65, note: 53, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // String machine: sawtooth octaves, from a hard edge to a slow lid.
  {
    id: 'melody-of-holes-lace-cut-from-strings',
    name: 'Lace cut from strings',
    category: 'string',
    description:
      'An ensemble of saw strings that lets a note go in a fifth of a second, thinned below, its top opened wide.',
    preview: NINE_ADDED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { volume: -4.5, attack: 0.25, release: 0.2, tone: 2600, low: 0.1 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Layer', params: { lowCut: 170 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'melody-of-holes-gap-toothed-comb',
    name: 'Gap-toothed comb',
    category: 'string',
    description:
      'Dry saws with no chorus and an instant edge, through the fixed notches of a flanger that does not move.',
    preview: SHORT_HOLES,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { attack: 0.008, release: 0.05, low: 0, high: 0.6, tone: 4200 },
    },
    effects: [{ deviceId: 'flanger', preset: 'Standing comb', params: { mix: 0.5 } }],
  },
  {
    id: 'melody-of-holes-moth-in-the-velvet',
    name: 'Moth in the velvet',
    category: 'pad',
    description:
      'Low dark strings under a nearly closed filter, each edge taking a third of a second, warmed by a preamp.',
    preview: FIFTHS_APART,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Low fog',
      params: { attack: 0.4, release: 0.35, tone: 620, low: 0.4 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Low warmth' }],
  },
  {
    id: 'melody-of-holes-picket-from-the-fence',
    name: 'Picket from the fence',
    category: 'string',
    description:
      'Three octaves of bright saws that start and stop like a switch, with a very tight plate round them.',
    preview: SHORT_HOLES,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: { attack: 0.01, release: 0.08, tone: 9000, ensemble: 0.3, low: 0.35 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.15 } }],
  },
  {
    id: 'melody-of-holes-shutter-slats',
    name: 'Shutter slats',
    category: 'string',
    description:
      'One octave of violas closing in a tenth of a second, lows and highs trading places in a harmonic tremolo.',
    preview: MINOR_NINTH,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { volume: 0.5, attack: 0.08, release: 0.12, tone: 1900 },
    },
    effects: [{ deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 2.2 } }],
  },
  {
    id: 'melody-of-holes-punched-card',
    name: 'Punched card',
    category: 'string',
    description:
      'Saws held flat with no chorus, put through the converters of an early sampler and cut thin at both ends.',
    preview: SHORT_HOLES,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { low: 0.8, high: 0.2, tone: 5200, attack: 0.02, release: 0.07 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler', params: { rate: 7000, aliasing: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  {
    id: 'melody-of-holes-missing-rung',
    name: 'Missing rung',
    category: 'string',
    description:
      'A mono low bowed saw that stops dry, sounding inside a wooden body instead of a room.',
    preview: FIFTHS_APART,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bowed bass',
      params: { attack: 0.12, release: 0.15, tone: 700, low: 0.3 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.6 } }],
  },
  {
    id: 'melody-of-holes-paper-snowflake',
    name: 'Paper snowflake',
    category: 'string',
    description:
      'Strings with the upper octave full, very open, each band twinkling by itself; gaps close in a quarter second.',
    preview: UNDER_THE_ROOF,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.3, release: 0.25, tone: 6000 },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Light on water', params: { depth: 0.8, rate: 1.6 } }],
  },
  {
    id: 'melody-of-holes-porthole-row',
    name: 'Porthole row',
    category: 'pad',
    description:
      'Muted strings with the octave above, heard just under water, with no bubbles and a soft close.',
    preview: NINE_ADDED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: { attack: 0.35, release: 0.35, tone: 1500 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0, depth: 0.35 } },
    ],
  },
  {
    id: 'melody-of-holes-stencil-in-blue',
    name: 'Stencil in blue',
    category: 'pad',
    description:
      'Strongly detuned dim strings with a full octave above, hollowed by a slow negative chorus, shut in a fifth of a second.',
    preview: IN_THIRDS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Detuned strings',
      params: { volume: -4.5, attack: 0.2, release: 0.2, low: 0, high: 1, tone: 1300 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Hollow swell', params: { feedback: -80, mix: 0.65 } }],
  },
  {
    id: 'melody-of-holes-colander-of-daylight',
    name: 'Colander of daylight',
    category: 'string',
    description:
      'The brightest strings here, fast ensemble and no low octave, bass cut and air pushed up, in a small dry booth.',
    preview: UNDER_THE_ROOF,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bright shimmer',
      params: { attack: 0.12, release: 0.1 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright', params: { lowCut: 300, presence: 2, air: 5 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'melody-of-holes-knot-in-the-plank',
    name: 'Knot in the plank',
    category: 'string',
    description:
      'Hollow strings pressed into the tone of a tube, narrow and dry, each note shut in a seventh of a second.',
    preview: FOURTHS_UP,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Hollow strings',
      params: { attack: 0.1, release: 0.14, width: 0.2 },
    },
    effects: [{ deviceId: 'imprint', preset: 'Hollow tube' }],
  },
  {
    id: 'melody-of-holes-slow-eyelid',
    name: 'Slow eyelid',
    category: 'pad',
    description:
      'Strings that take over a second to open and half a second to close, every band swaying on its own slow cycle.',
    preview: LONG_FIFTHS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { volume: -5, attack: 1.1, release: 0.55, low: 0.4 },
    },
    effects: [{ deviceId: 'currents', preset: 'Wide tide', params: { rate: 0.25, depth: 0.7 } }],
  },
  {
    id: 'melody-of-holes-eyelets-in-canvas',
    name: 'Eyelets in canvas',
    category: 'string',
    description:
      'Viola saws with a little of the octave below, recorded on a wavering cassette four-track.',
    preview: MINOR_NINTH,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { volume: -11, attack: 0.15, release: 0.3, low: 0.35, ensemble: 0.2, tone: 2600 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.1 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'melody-of-holes-fretwork-screen',
    name: 'Fretwork screen',
    category: 'organ',
    description:
      'Plain octaves with no drift, as steady as an organ, behind a slow horn and drum turning in a cabinet.',
    preview: DOTTED_GATE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { attack: 0.02, release: 0.1, high: 0.5, low: 0.25, tone: 3200 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.4 } }],
  },
  {
    id: 'melody-of-holes-worn-at-the-elbow',
    name: 'Worn at the elbow',
    category: 'string',
    description:
      'A cello register of saws on a worn cassette, its noise kept down, with a third of a second to every edge.',
    preview: FIFTHS_APART,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 0.3, release: 0.35, tone: 1900, low: 0.7 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.08, wobble: 0.3 } },
    ],
  },
  {
    id: 'melody-of-holes-doorways-in-a-row',
    name: 'Doorways in a row',
    category: 'pad',
    description:
      'A slow wide ensemble in a gated reverb that holds for a third of a second and stops, so a gap opens twice.',
    preview: OUTSIDE_IN,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow wide ensemble',
      params: { attack: 0.4, release: 0.15 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.5 } }],
  },
  {
    id: 'melody-of-holes-latch-up-latch-down',
    name: 'Latch up, latch down',
    category: 'keys',
    description:
      'Octaves with an instant start and stop, played through the small speaker of a bedside set.',
    preview: SHORT_HOLES,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { high: 0, low: 0.25, tone: 1800, release: 0.06 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0 } }],
  },
  {
    id: 'melody-of-holes-tooth-off-the-saw',
    name: 'Tooth off the saw',
    category: 'string',
    description:
      'A dry mono saw chord pushed into a tape curve, so a note that leaves changes the grain of those that stay.',
    preview: FOURTHS_UP,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { volume: -17, attack: 0.04, release: 0.1, low: 0.3, high: 0, tone: 3000 },
    },
    effects: [{ deviceId: 'saturator', preset: 'On tape', params: { driveDb: 14, outputDb: -12 } }],
  },
  {
    id: 'melody-of-holes-ceiling-vents',
    name: 'Ceiling vents',
    category: 'pad',
    description:
      'Bare strings with a strong top octave, hardly any ensemble, in a twelve-stage phaser that sweeps the two sides apart.',
    preview: MINOR_NINTH,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Hollow strings',
      params: { attack: 0.3, release: 0.3, high: 0.9, low: 0, tone: 9000, ensemble: 0.1 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Twelve stage cloud',
        params: { rate: 0.3, depth: 100, feedback: 70 },
      },
    ],
  },
  {
    id: 'melody-of-holes-loose-slate',
    name: 'Loose slate',
    category: 'string',
    description:
      'Muted strings with one and two octaves added above and the low side cut, closing in a quarter second.',
    preview: FOURTHS_UP,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: { volume: -4, attack: 0.2, release: 0.25, tone: 900, high: 0.4 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves' },
      { deviceId: 'ambient-eq', preset: 'Texture' },
    ],
  },
  {
    id: 'melody-of-holes-long-ladder-rung-gone',
    name: 'Long ladder, rung gone',
    category: 'pad',
    description:
      'A low swell of saws with the octave below that needs a second to arrive and most of one to leave, in a short dark room.',
    preview: LONG_FIFTHS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Long cello swell',
      params: { attack: 1.2, release: 0.75, tone: 1300 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Small dark room' }],
  },
  {
    id: 'melody-of-holes-sieve-at-nightfall',
    name: 'Sieve at nightfall',
    category: 'pad',
    description:
      'Detuned strings with a slow notch travelling through the chord, so the filter makes a gap of its own.',
    preview: E_BECOMES_F,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Detuned strings',
      params: { volume: -4.5, attack: 0.4, release: 0.3, high: 0, low: 0, drift: 0.3, width: 0.9 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Slow notch', params: { lfoRateHz: 0.3, resonance: 1.2 } },
    ],
  },
  {
    id: 'melody-of-holes-lantern-tin',
    name: 'Lantern tin',
    category: 'string',
    description:
      'Dim strings with the octave above, pulsed by two soft gates while the real gaps go slower.',
    preview: FOURTHS_UP,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.1, release: 0.15, tone: 1800, high: 0.7, ensemble: 0.2 },
    },
    effects: [{ deviceId: 'pulses', preset: 'Soft throb', params: { rate: 4 } }],
  },
  {
    id: 'melody-of-holes-needle-through-felt',
    name: 'Needle through felt',
    category: 'pad',
    description:
      'A soft one-octave string chord kept to the middle, its strongest partials redrawn as short pure sines.',
    preview: IN_THIRDS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { attack: 0.3, release: 0.25, low: 0, high: 0, tone: 700, width: 0, ensemble: 0.4 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Sine shadow',
        params: { release: 0.3, attack: 60, mix: 0.7, partials: 12 },
      },
    ],
  },

  // Reed organ: pipes and reeds, which end when the pallet shuts.
  {
    id: 'melody-of-holes-stop-pushed-in',
    name: 'Stop pushed in',
    category: 'organ',
    description:
      'Flute pipes over a soft sub rank with almost no release, the lows trimmed and nothing after.',
    preview: DOTTED_GATE,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { attack: 0.04, release: 0.04, sub: 0.3 },
    },
    effects: [{ deviceId: 'ambient-eq', preset: 'Keys' }],
  },
  {
    id: 'melody-of-holes-pallet-shut-tight',
    name: 'Pallet shut tight',
    category: 'organ',
    description:
      'A plain flute with pipes two octaves up and a thin reed edge, ending at once, with a hint of spring after it.',
    preview: SHORT_HOLES,
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: {
        attack: 0.03,
        release: 0.03,
        bellows: 0,
        celeste: 0,
        sub: 0,
        octave: 0.1,
        fifteenth: 0.6,
        reed: 0.15,
        tone: 6000,
      },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Hint of spring' }],
  },
  {
    id: 'melody-of-holes-dead-pipe-in-the-rank',
    name: 'Dead pipe in the rank',
    category: 'organ',
    description:
      'The whole organ with mixtures up, cut off quickly, standing in a one-second chamber.',
    preview: NINE_ADDED,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { volume: -15, attack: 0.03, release: 0.06, sub: 0.3 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
  },
  {
    id: 'melody-of-holes-lung-with-a-slit',
    name: 'Lung with a slit',
    category: 'organ',
    description:
      'A dark pump organ of reed, sub and twelfth, its bellows swaying deep, pushed through a hot valve.',
    preview: FOURTHS_UP,
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: {
        volume: -19,
        release: 0.25,
        breath: 0.5,
        octave: 0,
        twelfth: 0.6,
        sub: 0.5,
        reed: 0.35,
        celeste: 0.7,
        tone: 1000,
      },
    },
    effects: [{ deviceId: 'patina', preset: 'Hot valve', params: { noise: 0.05 } }],
  },
  {
    id: 'melody-of-holes-wind-to-one-pipe-cut',
    name: 'Wind to one pipe cut',
    category: 'organ',
    description:
      'Flutes that are mostly wind, so a gap lets out the air as well as the note, spread by a faint chorus.',
    preview: FOURTHS_UP,
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: { attack: 0.2, release: 0.2, bellows: 0.2 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Faint air', params: { mix: 0.3 } }],
  },
  {
    id: 'melody-of-holes-reed-lifted-out',
    name: 'Reed lifted out',
    category: 'drone',
    description:
      'A shruti box opening in half a second and closing in a third, its low drone kept in the middle, its top wide.',
    preview: FIFTHS_APART,
    instrument: {
      deviceId: 'organ',
      preset: 'Shruti box',
      params: { attack: 0.5, release: 0.3, bellows: 0.35, breath: 0.3, tone: 1500 },
    },
    effects: [{ deviceId: 'spread', preset: 'Firm and airy' }],
  },
  {
    id: 'melody-of-holes-bellows-behind-lace',
    name: 'Bellows behind lace',
    category: 'organ',
    description:
      'Beating accordion reeds with the edge of a button let go, in front of a short drippy spring.',
    preview: FALL_AGAIN,
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: { volume: -16, bellows: 0.4, release: 0.06 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward' },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.22, drive: 0.2 } },
    ],
  },
  {
    id: 'melody-of-holes-slot-in-the-quint',
    name: 'Slot in the quint',
    category: 'organ',
    description:
      'A hollow flute with only its twelfth drawn, and a small pipe body that rings a moment into each gap.',
    preview: FOURTHS_UP,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { attack: 0.1, release: 0.12, breath: 0.1 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.5, air: 0 } }],
  },
  {
    id: 'melody-of-holes-two-flutes-one-pause',
    name: 'Two flutes, one pause',
    category: 'organ',
    description:
      'Pairs of beating flutes, nothing else drawn, circling the head slowly while single notes step out.',
    preview: MINOR_NINTH,
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { attack: 0.2, release: 0.25, breath: 0 },
    },
    effects: [{ deviceId: 'around', preset: 'Slow eight' }],
  },
  {
    id: 'melody-of-holes-sung-through-a-grating',
    name: 'Sung through a grating',
    category: 'organ',
    description:
      'A trembling nasal reed stop, its voice enlarged by a round vowel colour, with a quarter second close.',
    preview: NINE_ADDED,
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { release: 0.25, tremulant: 0.6, breath: 0.1 },
    },
    effects: [{ deviceId: 'imprint', preset: 'Large body' }],
  },
  {
    id: 'melody-of-holes-vestry-keyhole',
    name: 'Vestry keyhole',
    category: 'organ',
    description:
      'A muffled organ heard from next door, all its edges still quick, as if through a keyhole.',
    preview: DOTTED_GATE,
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { volume: -12.5, attack: 0.08, release: 0.1, tone: 800, reed: 0.2, breath: 0.1 },
    },
    effects: [{ deviceId: 'distance', preset: 'Next door' }],
  },
  {
    id: 'melody-of-holes-floorboard-up',
    name: 'Floorboard up',
    category: 'drone',
    description:
      'A flute on its sub rank with a hollow twelfth, opening in a third of a second, made heavier by a transformer.',
    preview: FIFTHS_APART,
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: {
        attack: 0.3,
        release: 0.35,
        reed: 0,
        twelfth: 0.5,
        octave: 0.2,
        tone: 1500,
        bellows: 0.1,
      },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
  },
  {
    id: 'melody-of-holes-one-bay-dark',
    name: 'One bay dark',
    category: 'organ',
    description:
      'Pipes far down the building: a second to speak, half a second to stop, at the back of a middling hall.',
    preview: LONG_FIFTHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { attack: 0.9, release: 0.45, twelfth: 0.5, celeste: 0.2 },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall', params: { decay: 1.4 } }],
  },
  {
    id: 'melody-of-holes-flute-that-winks',
    name: 'Flute that winks',
    category: 'organ',
    description:
      'A trembling flute with pipes two octaves up and a faint sub, shut quickly, with short tape echoes thrown wide.',
    preview: UNDER_THE_ROOF,
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: {
        attack: 0.06,
        release: 0.1,
        breath: 0.15,
        octave: 0,
        fifteenth: 0.5,
        sub: 0.2,
        tremulant: 0.4,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.25, spread: 0.8 } },
    ],
  },
  {
    id: 'melody-of-holes-card-organ-creeping',
    name: 'Card organ, creeping',
    category: 'organ',
    description:
      'A thick celeste over the sub, slow to speak, its partials pulled a little out of line and slowly breathing.',
    preview: LONG_FIFTHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { volume: -14.5, attack: 0.7, release: 0.5, bellows: 0.15, tone: 2600 },
    },
    effects: [{ deviceId: 'warp', preset: 'Slow breath', params: { mix: 0.5 } }],
  },
  {
    id: 'melody-of-holes-a-pane-out',
    name: 'A pane out',
    category: 'organ',
    description:
      'Upperwork of twelfth and fifteenth that takes a whole second to speak, coloured by a bell, shut in under half of one.',
    preview: LONG_HOLES,
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: { attack: 1, release: 0.4, sub: 0, octave: 0.2 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Bright bell', params: { mix: 0.7 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'melody-of-holes-reedbed-notch',
    name: 'Reedbed notch',
    category: 'organ',
    description:
      'One reed rank without its bellows swell over a thin sub, narrowed by a transistor set with its static off.',
    preview: SHORT_HOLES,
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: { bellows: 0, celeste: 0, octave: 0, sub: 0.3, tone: 3200 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Clean transistor', params: { static: 0, speaker: 0.7 } },
    ],
  },
  {
    id: 'melody-of-holes-swell-box-ajar',
    name: 'Swell box ajar',
    category: 'organ',
    description:
      'Chapel flutes with pipes added an octave below and one and two above, the shutters nearly closed.',
    preview: OUTSIDE_IN,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { attack: 0.06, release: 0.15, sub: 0, breath: 0.1 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Shutters closed',
        params: { speak: 80, sub: 0.5, fifth: 0, twelfth: 0 },
      },
    ],
  },
  {
    id: 'melody-of-holes-crescent-cut-out',
    name: 'Crescent cut out',
    category: 'organ',
    description:
      'An organ with the twelfth drawn out front and no sub or reed, run through fast heavy rotors.',
    preview: FALL_AGAIN,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: {
        volume: -11.5,
        attack: 0.03,
        release: 0.1,
        sub: 0,
        octave: 0.2,
        twelfth: 0.9,
        reed: 0,
        fifteenth: 0.3,
        celeste: 0.6,
      },
    },
    effects: [{ deviceId: 'rotary', preset: 'Heavy rotors' }],
  },
  {
    id: 'melody-of-holes-hole-in-the-ice',
    name: 'Hole in the ice',
    category: 'organ',
    description:
      'Open flutes with a beating rank, part of them moved a few hertz apart left and right, with no feedback at all.',
    preview: E_BECOMES_F,
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { attack: 0.1, release: 0.15, celeste: 0.5, fifteenth: 0.4, octave: 0.3, tone: 8000 },
    },
    effects: [{ deviceId: 'freq-shifter', preset: 'Split sky', params: { feedback: 0, mix: 0.4 } }],
  },
  {
    id: 'melody-of-holes-tide-gate-organ',
    name: 'Tide gate organ',
    category: 'organ',
    description:
      'Harmonium reeds with the celeste well out and some sub, each of three bands rising and ebbing to its own time.',
    preview: OUTSIDE_IN,
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: { attack: 0.25, release: 0.35, celeste: 0.8, sub: 0.35, twelfth: 0, bellows: 0 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Deep swell', params: { depth: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { low: 2 } },
    ],
  },

  // Choir: a singer who stops for a moment, and the others who do not.
  {
    id: 'melody-of-holes-one-singer-breathes',
    name: 'One singer breathes',
    category: 'voice',
    description:
      'An open ah that closes in a fifth of a second, a little of a sung room behind it.',
    preview: NINE_ADDED,
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { attack: 0.3, release: 0.2, motion: 0.1 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.2 } }],
  },
  {
    id: 'melody-of-holes-empty-stall',
    name: 'Empty stall',
    category: 'voice',
    description:
      'Low still oh voices with no vibrato, let go in a third of a second, dark wood round them.',
    preview: LOW_SEATS,
    instrument: { deviceId: 'choir', preset: 'Low monks', params: { attack: 0.4, release: 0.3 } },
    effects: [{ deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.45, size: 2 } }],
  },
  {
    id: 'melody-of-holes-treble-off-the-beam',
    name: 'Treble off the beam',
    category: 'voice',
    description:
      'Boys on ooh, quick to speak and quick to stop, the low part trimmed and a thin sheen of plate on top.',
    preview: UNDER_THE_ROOF,
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { volume: -6, attack: 0.15, release: 0.15 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'melody-of-holes-breath-between-slats',
    name: 'Breath between slats',
    category: 'voice',
    description:
      'More air than voice: a whispered section whose gaps are gaps in the breath, a swaying copy on each side.',
    preview: MINOR_NINTH,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 0.5, release: 0.3, motion: 0.2 },
    },
    effects: [{ deviceId: 'stereo-detune', preset: 'Drifting' }],
  },
  {
    id: 'melody-of-holes-vowel-and-a-blank',
    name: 'Vowel and a blank',
    category: 'voice',
    description:
      'Voices that never rest on one vowel, shutting in half a second, held level by a hard compressor.',
    preview: LONG_HOLES,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { volume: -4.5, attack: 0.8, release: 0.45 },
    },
    effects: [{ deviceId: 'ambient-comp', preset: 'Dense pad', params: { makeup: 9 } }],
  },
  {
    id: 'melody-of-holes-glass-tooth',
    name: 'Glass tooth',
    category: 'voice',
    description:
      'Straight bright ee voices, thinned and sparkling band by band, stopped in a sixth of a second.',
    preview: FOURTHS_UP,
    instrument: { deviceId: 'choir', preset: 'Glass ee', params: { attack: 0.2, release: 0.16 } },
    effects: [
      { deviceId: 'glimmer', preset: 'Fast shimmer' },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 12000 } },
    ],
  },
  {
    id: 'melody-of-holes-five-soloists-then-four',
    name: 'Five soloists, then four',
    category: 'voice',
    description:
      'One singer to a note with a warm vibrato, dry and close, only a few steps of room behind.',
    preview: MINOR_NINTH,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { attack: 0.15, release: 0.2, vibrato: 22, width: 1 },
    },
    effects: [{ deviceId: 'distance', preset: 'Close mic' }],
  },
  {
    id: 'melody-of-holes-lips-shut-lips-open',
    name: 'Lips shut, lips open',
    category: 'voice',
    description:
      'A hummed section under nine hundred hertz, brought forward by a valve stage and stopped in a quarter second.',
    preview: NINE_ADDED,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { attack: 0.3, release: 0.25, tone: 900 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Triode glow' }],
  },
  {
    id: 'melody-of-holes-alto-chair-pulled-back',
    name: 'Alto chair pulled back',
    category: 'voice',
    description:
      'Altos on eh with real vibrato and a fifth-of-a-second close, sent round a slow cabinet.',
    preview: IN_THIRDS,
    instrument: { deviceId: 'choir', preset: 'Altos eh', params: { attack: 0.2, release: 0.2 } },
    effects: [{ deviceId: 'rotary', preset: 'Soft blend', params: { mix: 0.7 } }],
  },
  {
    id: 'melody-of-holes-bass-steps-down',
    name: 'Bass steps down',
    category: 'voice',
    description:
      'Large-bodied basses on a breathy oh, few to a note, a fifth of a second from sounding to silent, in a small dark hall.',
    preview: LOW_SEATS,
    instrument: {
      deviceId: 'choir',
      preset: 'Basses ah',
      params: { attack: 0.2, release: 0.2, vowel: 0.8, ensemble: 0.15, breath: 0.5, tone: 2200 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { damping: 2500, mix: 0.18 } }],
  },
  {
    id: 'melody-of-holes-tenors-in-an-arrow-slit',
    name: 'Tenors in an arrow slit',
    category: 'voice',
    description:
      'Tenors on oh through a narrow band, as through a slit in stone, with their close left sharp.',
    preview: FOURTHS_UP,
    instrument: { deviceId: 'choir', preset: 'Tenors oh', params: { attack: 0.12, release: 0.12 } },
    effects: [{ deviceId: 're-amp', preset: 'In the cupboard', params: { noise: 0 } }],
  },
  {
    id: 'melody-of-holes-wavering-fence',
    name: 'Wavering fence',
    category: 'voice',
    description:
      'A few voices with a slow wide vibrato on oh, the pitch wobbled once more by a vibrato effect, shut quickly.',
    preview: E_BECOMES_F,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow waver',
      params: { attack: 0.3, release: 0.25, tone: 3000 },
    },
    effects: [{ deviceId: 'tremolo', preset: 'Wide wobble', params: { depth: 0.35 } }],
  },
  {
    id: 'melody-of-holes-far-choir-seen-through',
    name: 'Far choir, seen through',
    category: 'voice',
    description:
      'A dim choir with its long tail taken off, half a second to every close, clouds passing over the tone.',
    preview: LONG_HOLES,
    instrument: { deviceId: 'choir', preset: 'Distant choir', params: { attack: 1, release: 0.5 } },
    effects: [{ deviceId: 'weather', preset: 'Passing clouds' }],
  },
  {
    id: 'melody-of-holes-hocket-cards',
    name: 'Hocket cards',
    category: 'voice',
    description:
      'Short plain ahs that start and stop at once, caught in a mono slap that repeats each edge.',
    preview: SHORT_HOLES,
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: { release: 0.07, breath: 0.2, vibrato: 4 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Mono slap' }],
  },
  {
    id: 'melody-of-holes-steam-and-no-steam',
    name: 'Steam and no steam',
    category: 'voice',
    description:
      'A few breathy voices to a note on a thin ee, their air sifted out, brought up and scattered to the sides.',
    preview: UNDER_THE_ROOF,
    instrument: {
      deviceId: 'choir',
      preset: 'Breathy ee',
      params: { volume: -7.5, attack: 0.25, release: 0.2, width: 0.6 },
    },
    effects: [{ deviceId: 'sift', preset: 'Wide air' }],
  },
  {
    id: 'melody-of-holes-swallows-off-the-wire',
    name: 'Swallows off the wire',
    category: 'voice',
    description:
      'Drifting trebles on a bright small vowel, a low octave added below, each note gone in a third of a second.',
    preview: MINOR_NINTH,
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: { attack: 0.3, release: 0.3, motion: 0.5 },
    },
    effects: [{ deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } }],
  },
  {
    id: 'melody-of-holes-roll-call-unanswered',
    name: 'Roll call unanswered',
    category: 'voice',
    description:
      'A plain oo with no breath and no motion, with two copies of it moving a little close by.',
    preview: NINE_ADDED,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { vowel: 1, tone: 5000, breath: 0, motion: 0, vibrato: 0, attack: 0.1, release: 0.1 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Two close by' }],
  },
  {
    id: 'melody-of-holes-chant-with-moth-holes',
    name: 'Chant with moth holes',
    category: 'voice',
    description:
      'A thin eh from small bodies, kept narrow and put on a badly worn reel with its hiss turned off.',
    preview: E_BECOMES_F,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: { voice: 1.36, vowel: 0.35, attack: 0.25, release: 0.25, ensemble: 0.2, width: 0.2 },
    },
    effects: [{ deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0, wow: 0.4 } }],
  },
  {
    id: 'melody-of-holes-cloister-arch-by-arch',
    name: 'Cloister, arch by arch',
    category: 'voice',
    description:
      'Deep open voices behind a soft fog of a tenth of a second, so each edge is rounded and nothing rings on.',
    preview: LOW_SEATS,
    instrument: {
      deviceId: 'choir',
      preset: 'Basses ah',
      params: { vowel: 0.15, attack: 0.3, release: 0.2, tone: 2200, ensemble: 1, width: 1 },
    },
    effects: [{ deviceId: 'fog', preset: 'Pad softener', params: { size: 100 } }],
  },

  // Chamber strings: a bow lifted off one string of five.
  {
    id: 'melody-of-holes-bow-lifted-clear',
    name: 'Bow lifted clear',
    category: 'string',
    description:
      'A close string section on a bright drive that takes the bow off in a fifth of a second, dry but for a tight plate.',
    preview: NINE_ADDED,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 0.2, release: 0.2, vibrato: 8 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Sheen' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'melody-of-holes-mute-and-a-space',
    name: 'Mute and a space',
    category: 'string',
    description:
      'Five muted players with no vibrato, shut in a third of a second, on a dull wavering cassette without its hiss.',
    preview: FALL_AGAIN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 0.4, release: 0.3 },
    },
    effects: [{ deviceId: 'tape', preset: 'Under a blanket', params: { hiss: 0 } }],
  },
  {
    id: 'melody-of-holes-hair-without-string',
    name: 'Hair without string',
    category: 'texture',
    description:
      'More bow hair than tone, close and unvibrated, thinned and pulsing softly eight times a second in the middle.',
    preview: FOURTHS_UP,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { volume: -4, attack: 0.2, release: 0.2, air: 1 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 9000 } },
      { deviceId: 'band-pulse', preset: 'Eight a second', params: { depth: 0.5 } },
    ],
  },
  {
    id: 'melody-of-holes-viols-through-a-fence',
    name: 'Viols through a fence',
    category: 'string',
    description:
      'Muted viols with the bow near the bridge and no vibrato, closing at once, in a cupboard of a room.',
    preview: SHORT_HOLES,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { attack: 0.06, release: 0.1 },
    },
    effects: [{ deviceId: 're-amp', preset: 'In the cupboard', params: { noise: 0, drive: 0.1 } }],
  },
  {
    id: 'melody-of-holes-fifth-desk-asleep',
    name: 'Fifth desk asleep',
    category: 'string',
    description:
      'Six ragged players to a note with the octave below added, shut in a third of a second.',
    preview: FIFTHS_APART,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { attack: 0.35, release: 0.35 },
    },
    effects: [{ deviceId: 'octaves', preset: 'Sub octave' }],
  },
  {
    id: 'melody-of-holes-halo-with-a-bite-out',
    name: 'Halo with a bite out',
    category: 'pad',
    description:
      'Three still players bowing over the fingerboard, each band of the sound brightening upward in turn.',
    preview: LONG_FIFTHS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { attack: 0.7, release: 0.4 },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Rising ripple' }],
  },
  {
    id: 'melody-of-holes-bridge-arches',
    name: 'Bridge arches',
    category: 'string',
    description:
      'Glassy bows hard by the bridge, let go in a quarter second, with their quiet overtones turned up.',
    preview: OUTSIDE_IN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { attack: 0.3, release: 0.25 },
    },
    effects: [{ deviceId: 'reveal', preset: 'Overtones' }],
  },
  {
    id: 'melody-of-holes-two-chairs-apart',
    name: 'Two chairs apart',
    category: 'string',
    description:
      'Two quiet players to a note set wide apart, part-muted, with a soft slap of old delay after each edge.',
    preview: IN_THIRDS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Quiet duet',
      params: { volume: -7, attack: 0.15, release: 0.2 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.4, spread: 1 } }],
  },
  {
    id: 'melody-of-holes-veil-darned-badly',
    name: 'Veil, darned badly',
    category: 'string',
    description:
      'A muted veil bowed at the bridge, closing in half a second, its body made much smaller than the notes.',
    preview: LONG_HOLES,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Thin veil',
      params: { attack: 0.8, release: 0.45 },
    },
    effects: [{ deviceId: 'size', preset: 'Music box', params: { mix: 0.8 } }],
  },
  {
    id: 'melody-of-holes-short-bow-long-rest',
    name: 'Short bow, long rest',
    category: 'string',
    description:
      'Bows that start and stop in a tenth of a second, every return pushed forward over what was held.',
    preview: SHORT_HOLES,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { volume: -3, release: 0.1, players: 2 },
    },
    effects: [{ deviceId: 'common-tones', preset: 'New notes up' }],
  },
  {
    id: 'melody-of-holes-vibrato-then-a-hush',
    name: 'Vibrato, then a hush',
    category: 'string',
    description:
      'Three muted players with broad vibrato at the fingerboard, the close still quick, wandering side to side.',
    preview: E_BECOMES_F,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wide vibrato',
      params: { volume: -4.5, attack: 0.25, release: 0.25, mute: 0.8 },
    },
    effects: [
      { deviceId: 'around', preset: 'Wide pendulum' },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'melody-of-holes-lone-bow-drifting-off',
    name: 'Lone bow drifting off',
    category: 'string',
    description:
      'One wandering player to a note, narrow, the pitch left loose, through a small transistor set.',
    preview: FALL_AGAIN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wandering solo',
      params: { attack: 0.35, release: 0.3 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Clean transistor', params: { static: 0.02, bandwidth: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },

  // Dusk: one oscillator a key through a filter, which can shut the moment the key comes up.
  {
    id: 'melody-of-holes-lamps-off-in-turn',
    name: 'Lamps off in turn',
    category: 'pad',
    description:
      'Saw and square with a quick start and a quick stop, under a wide chorus and a filter that opens as they speak.',
    preview: NINE_ADDED,
    instrument: {
      deviceId: 'dusk',
      preset: 'Warm keys',
      params: { volume: -8.5, attack: 0.1, release: 0.15, cutoff: 900 },
    },
    effects: [{ deviceId: 'ambient-comp', preset: 'Peak stop' }],
  },
  {
    id: 'melody-of-holes-pinhole-pipe',
    name: 'Pinhole pipe',
    category: 'organ',
    description:
      'Squares under a nearly singing filter, no chorus, stopped in a tenth of a second, in the body of a bottle.',
    preview: DOTTED_GATE,
    instrument: { deviceId: 'dusk', preset: 'Stopped pipe', params: { release: 0.1 } },
    effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } }],
  },
  {
    id: 'melody-of-holes-bright-net',
    name: 'Bright net',
    category: 'pad',
    description:
      'Thin high-passed saws in both choruses at once, very wide, gone in a quarter of a second.',
    preview: UNDER_THE_ROOF,
    instrument: {
      deviceId: 'dusk',
      preset: 'Thin shimmer',
      params: { attack: 0.3, release: 0.25 },
    },
    effects: [{ deviceId: 'spread', preset: 'Tight shimmer' }],
  },
  {
    id: 'melody-of-holes-dusk-with-a-row-missing',
    name: 'Dusk with a row missing',
    category: 'pad',
    description:
      'Square waves dark as clarinets, a third of a second to open and to close, in a slow deep phaser.',
    preview: OUTSIDE_IN,
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft clarinets',
      params: { attack: 0.35, release: 0.35, cutoff: 900 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Slow swirl' }],
  },
  {
    id: 'melody-of-holes-trapdoor',
    name: 'Trapdoor',
    category: 'pad',
    description:
      'A square and its full sub octave with no chorus, shut in a quarter second, through a warm loudspeaker stack.',
    preview: FIFTHS_APART,
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { volume: -17.5, attack: 0.15, release: 0.25, chorus: 0 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Warm stack', params: { noise: 0, drive: 0.25 } }],
  },
  {
    id: 'melody-of-holes-pulse-behind-the-slats',
    name: 'Pulse behind the slats',
    category: 'pad',
    description:
      'Moving pulse waves through a resonant, high-passed filter that closes as they begin, shut in a third of a second.',
    preview: FALL_AGAIN,
    instrument: {
      deviceId: 'dusk',
      preset: 'Thin voices',
      params: { volume: -11.5, attack: 0.4, release: 0.3 },
    },
    effects: [{ deviceId: 'imprint', preset: 'Thin vowel', params: { mix: 0.6 } }],
  },
  {
    id: 'melody-of-holes-beads-off-a-string',
    name: 'Beads off a string',
    category: 'keys',
    description:
      'Saws under a filter close to singing an octave above middle C, quick to let go, one tape slap behind.',
    preview: SHORT_HOLES,
    instrument: {
      deviceId: 'dusk',
      preset: 'Round sine',
      params: { volume: -7.5, release: 0.12, resonance: 0.7, cutoff: 520 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.3 } }],
  },

  // Ember: two oscillators and an amplifier that closes when it is told.
  {
    id: 'melody-of-holes-warm-brick-removed',
    name: 'Warm brick removed',
    category: 'pad',
    description:
      'A warm detuned pad whose amplifier shuts in a fifth of a second, on a hard-driven mastering deck.',
    preview: NINE_ADDED,
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: { ampAttack: 0.3, ampRelease: 0.2, filterAttack: 0.4, lfo1Amount: 0.05 },
    },
    effects: [{ deviceId: 'tape', preset: 'Hot glue' }],
  },
  {
    id: 'melody-of-holes-glass-brick-removed',
    name: 'Glass brick removed',
    category: 'pad',
    description:
      'Triangles with a thin pulse an octave up, closing in a quarter second, over a copy with its partials nudged out of place.',
    preview: FOURTHS_UP,
    instrument: {
      deviceId: 'ember',
      preset: 'Glass pad',
      params: { ampAttack: 0.2, ampRelease: 0.25 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Thin glow' },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'melody-of-holes-cellar-grate',
    name: 'Cellar grate',
    category: 'drone',
    description:
      'A dark saw and pulse an octave apart with sub, opened in half a second, shut in a third, some grit above the bass.',
    preview: FIFTHS_APART,
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: { ampAttack: 0.5, ampRelease: 0.35, cutoff: 500, resonance: 0.1 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Parallel grit', params: { output: 0 } }],
  },
  {
    id: 'melody-of-holes-saw-rack-one-hook-bare',
    name: 'Saw rack, one hook bare',
    category: 'pad',
    description:
      'Seven detuned saws to a note that stop dead, darkened by a fixed low-pass, with a limiter holding them level.',
    preview: SHORT_HOLES,
    instrument: {
      deviceId: 'ember',
      preset: 'Super Saw',
      params: { ampRelease: 0.08, cutoff: 3000 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Low-pass gate', params: { cutoffHz: 1800 } },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'melody-of-holes-recess-in-the-wall',
    name: 'Recess in the wall',
    category: 'pad',
    description:
      'A square and a triangle an octave up, panned about by a slow oscillator, hollowed by a flanger, closing in a third of a second.',
    preview: E_BECOMES_F,
    instrument: {
      deviceId: 'ember',
      preset: 'Hollow Pad',
      params: { ampAttack: 0.3, ampRelease: 0.3 },
    },
    effects: [{ deviceId: 'flanger', preset: 'Negative hollow', params: { mix: 0.4 } }],
  },
  {
    id: 'melody-of-holes-brass-plate-drilled',
    name: 'Brass plate, drilled',
    category: 'pad',
    description:
      'Two saws with a short brassy filter swell on every return, cut in a tenth of a second, in a slap room.',
    preview: IN_THIRDS,
    instrument: {
      deviceId: 'ember',
      preset: 'Brass',
      params: { ampRelease: 0.1, filterRelease: 0.1, filterEnvAmount: 0.4, cutoff: 600 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.2 } }],
  },

  // Flock: a note is several birds, and a gap is when they all leave.
  {
    id: 'melody-of-holes-wire-without-birds',
    name: 'Wire without birds',
    category: 'pad',
    description:
      'Five small voices that fly up to each note and are gone a fifth of a second after it, level and nearly dry.',
    preview: NINE_ADDED,
    instrument: {
      deviceId: 'flock',
      preset: 'Clean unison',
      params: { gather: 0.25, leave: 0.2, birds: 5 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'melody-of-holes-reeds-where-ducks-were',
    name: 'Reeds where ducks were',
    category: 'pad',
    description:
      'Reedy voices gathering from all round, scattering in a third of a second, through an open vowel.',
    preview: MINOR_NINTH,
    instrument: { deviceId: 'flock', preset: 'Reed choir', params: { gather: 0.3, leave: 0.3 } },
    effects: [{ deviceId: 'imprint', preset: 'Open vowel', params: { amount: 1.3 } }],
  },
  {
    id: 'melody-of-holes-swarm-with-an-eye',
    name: 'Swarm with an eye',
    category: 'texture',
    description:
      'Glass voices and their octaves fluttering around each note, leaving in half a second, moved off by soft wind.',
    preview: LONG_HOLES,
    instrument: { deviceId: 'flock', preset: 'Glass swarm', params: { gather: 0.3, leave: 0.4 } },
    effects: [{ deviceId: 'weather', preset: 'Breezy day', params: { voice: 0.1 } }],
  },
  {
    id: 'melody-of-holes-two-starlings-no-third',
    name: 'Two starlings, no third',
    category: 'pad',
    description:
      'Two hollow voices to a note set far left and right, quick to settle and quick to go, on a record hardly played.',
    preview: SHORT_HOLES,
    instrument: { deviceId: 'flock', preset: 'Hollow pair', params: { gather: 0.05, leave: 0.1 } },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'New pressing',
        params: { crackle: 0.05, pops: 0, surface: 0.05 },
      },
    ],
  },
  {
    id: 'melody-of-holes-murmur-parting',
    name: 'Murmur parting',
    category: 'drone',
    description:
      'A low murmur of reedy voices, loose in pitch, that takes over half a second to collect and half a second to part.',
    preview: LOW_SEATS,
    instrument: {
      deviceId: 'flock',
      preset: 'Low murmur',
      params: { volume: -15, gather: 0.6, leave: 0.45 },
    },
    effects: [{ deviceId: 'ambient-eq', preset: 'Deep', params: { low: 6 } }],
  },
  {
    id: 'melody-of-holes-dovecote-door',
    name: 'Dovecote door',
    category: 'pad',
    description:
      'Six voices falling slowly onto each note from above, the octave below added, gone at once when the key comes up.',
    preview: LONG_FIFTHS,
    instrument: { deviceId: 'flock', preset: 'Falling in', params: { gather: 0.7, leave: 0.15 } },
    effects: [{ deviceId: 'size', preset: 'Octave below', params: { mix: 0.5 } }],
  },

  // Staircase: the stairs walk the notes that are held, so a gap is a step left out.
  {
    id: 'melody-of-holes-stair-tread-missing',
    name: 'Stair tread missing',
    category: 'pad',
    description:
      'Soft tones stepping quickly up whatever is held, so a lifted key is a tread the climb leaves out.',
    preview: OUTSIDE_IN,
    instrument: {
      deviceId: 'staircase',
      preset: 'Chord stairs',
      params: { attack: 0.1, release: 0.2, speed: 0.8, slide: 0.15 },
    },
    effects: [{ deviceId: 'ambient-eq', preset: 'Shaded' }],
  },
  {
    id: 'melody-of-holes-landing-with-no-rail',
    name: 'Landing with no rail',
    category: 'organ',
    description:
      'Octave stacks that do not move at all, as plain as an organ, stopped quickly in a short bright chamber.',
    preview: DOTTED_GATE,
    instrument: { deviceId: 'staircase', preset: 'Still organ', params: { release: 0.12 } },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.18, decay: 0.8 } },
    ],
  },
  {
    id: 'melody-of-holes-stepping-round-the-well',
    name: 'Stepping round the well',
    category: 'pad',
    description:
      'Reedy tones stepping quickly down the held notes, sliding from one to the next, in a slow cabinet.',
    preview: FOURTHS_UP,
    instrument: {
      deviceId: 'staircase',
      preset: 'Chord descent',
      params: { attack: 0.3, release: 0.3, shape: 0.8, speed: -0.65 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.1, mix: 0.7 } }],
  },
  {
    id: 'melody-of-holes-portholes-in-tall-glass',
    name: 'Portholes in tall glass',
    category: 'pad',
    description:
      'High glassy octaves that stand still in a wide chorus, closing in under half a second, with a faint reversed swell on each edge.',
    preview: LONG_HOLES,
    instrument: {
      deviceId: 'staircase',
      preset: 'Glass spiral',
      params: { attack: 0.6, release: 0.4, speed: 0 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 0.6, mix: 0.25, tail: 0.1 } },
    ],
  },
]
