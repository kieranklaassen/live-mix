import { type FactoryPreset, type Phrase } from '../types'

// A silk-strung zither of seven strings, C D F G A c d, with thirteen marks inlaid beside them.
// It has three voices, and every instrument here is laid out in those three: open strings that
// toll, harmonics touched at the marks (the second to the eighth partial of a string, at their
// own just pitches) and stopped tones that the left hand goes on sliding after the pluck.

// The three voices in turn: open C, the harmonic at a third of it, D carried on to E, the harmonic
// at a quarter, and then no new tone for three seconds.
const THREE_VOICES: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.6, note: 36, gain: 0.8 },
    { atSec: 0, durSec: 2.6, note: 48, gain: 0.45 },
    { atSec: 1.3, durSec: 2.4, note: 55.02, gain: 0.58 },
    { atSec: 2.6, durSec: 0.35, note: 50, gain: 0.7 },
    { atSec: 2.95, durSec: 2, note: 52, gain: 0.52 },
    { atSec: 5, durSec: 2.2, note: 60, gain: 0.54 },
  ],
}

// The C string touched at an eighth, a sixth, a fifth, a quarter, a third and a half of its
// length, then let go: partials 8 6 5 4 3 2 and the open tone.
const NODES_DOWN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 72, gain: 0.54 },
    { atSec: 0.9, durSec: 1.8, note: 67.02, gain: 0.54 },
    { atSec: 1.8, durSec: 1.8, note: 63.86, gain: 0.58 },
    { atSec: 2.7, durSec: 1.9, note: 60, gain: 0.61 },
    { atSec: 3.6, durSec: 2, note: 55.02, gain: 0.64 },
    { atSec: 4.5, durSec: 2.4, note: 48, gain: 0.67 },
    { atSec: 5.5, durSec: 1.8, note: 36, gain: 0.8 },
  ],
}

// A pentatonic line all in harmonics, each taken on the string that has it: G and A at a quarter
// of their own strings, C at an eighth, D at a sixth of G, and back down to D at a third of it.
const HEAVEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 67, gain: 0.64 },
    { atSec: 0.75, durSec: 1.6, note: 69, gain: 0.58 },
    { atSec: 1.5, durSec: 1.7, note: 72, gain: 0.64 },
    { atSec: 2.25, durSec: 2, note: 74.02, gain: 0.61 },
    { atSec: 3.5, durSec: 1.4, note: 72.02, gain: 0.54 },
    { atSec: 4.2, durSec: 1.4, note: 69.02, gain: 0.51 },
    { atSec: 4.9, durSec: 1.5, note: 67.02, gain: 0.54 },
    { atSec: 5.3, durSec: 1.6, note: 64.02, gain: 0.48 },
    { atSec: 5.9, durSec: 1.5, note: 62.02, gain: 0.58 },
  ],
}

// Open strings that toll in fifths, so that what rings on agrees: C G d and c, then D A d and D.
const EARTH_TOLL: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.5, note: 36, gain: 0.83 },
    { atSec: 0.9, durSec: 2.6, note: 43, gain: 0.61 },
    { atSec: 1.8, durSec: 1.7, note: 50, gain: 0.54 },
    { atSec: 2.7, durSec: 0.8, note: 48, gain: 0.54 },
    { atSec: 3.6, durSec: 2.6, note: 38, gain: 0.8 },
    { atSec: 4.5, durSec: 2.8, note: 45, gain: 0.58 },
    { atSec: 5.4, durSec: 1.9, note: 50, gain: 0.54 },
    { atSec: 6.3, durSec: 1, note: 38, gain: 0.74 },
  ],
}

// Fifths up from the open strings into the harmonics: open C, G and d, then A at a half and E at
// a third of the A string; back through D, G and C.
const FIFTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.8, note: 36, gain: 0.8 },
    { atSec: 0.7, durSec: 2.5, note: 43, gain: 0.67 },
    { atSec: 1.4, durSec: 2.3, note: 50, gain: 0.64 },
    { atSec: 2.1, durSec: 2, note: 57, gain: 0.58 },
    { atSec: 2.8, durSec: 1.8, note: 64.02, gain: 0.54 },
    { atSec: 4.2, durSec: 1.6, note: 62.02, gain: 0.54 },
    { atSec: 4.9, durSec: 1.6, note: 55.02, gain: 0.58 },
    { atSec: 5.6, durSec: 1.8, note: 48, gain: 0.67 },
  ],
}

// Written for a string that is pressed a whole tone sharp after each pluck: D G A G F D C under
// the hand, E A B A G E D to the ear.
const PRESS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 50, gain: 0.74 },
    { atSec: 1.2, durSec: 1.2, note: 55, gain: 0.64 },
    { atSec: 2, durSec: 1, note: 57, gain: 0.67 },
    { atSec: 2.7, durSec: 1.2, note: 55, gain: 0.58 },
    { atSec: 3.5, durSec: 1.2, note: 53, gain: 0.61 },
    { atSec: 4.4, durSec: 1.3, note: 50, gain: 0.64 },
    { atSec: 5.5, durSec: 1.8, note: 48, gain: 0.7 },
  ],
}

// Two plucks and five slides: G carried to A and back; D carried to E, back, and down to C.
const HUMAN_SLIDES: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.9, note: 43, gain: 0.83 },
    { atSec: 0.12, durSec: 1.3, note: 45, gain: 0.64 },
    { atSec: 3.05, durSec: 3, note: 50, gain: 0.77 },
    { atSec: 3.2, durSec: 1.2, note: 52, gain: 0.64 },
    { atSec: 4.9, durSec: 2.4, note: 48, gain: 0.64 },
  ],
}

// One pluck of D, and the finger that goes on for six seconds: E F G F E, D, C, D.
const ONE_PLUCK: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 50, gain: 0.9 },
    { atSec: 0.5, durSec: 0.9, note: 52, gain: 0.64 },
    { atSec: 1.3, durSec: 0.7, note: 53, gain: 0.64 },
    { atSec: 1.9, durSec: 1.5, note: 55, gain: 0.64 },
    { atSec: 3.3, durSec: 0.6, note: 53, gain: 0.64 },
    { atSec: 3.8, durSec: 1.2, note: 52, gain: 0.64 },
    { atSec: 5.7, durSec: 0.8, note: 48, gain: 0.64 },
  ],
}

// Open C, its third harmonic, a D carried to E and back, and the sixth and eighth harmonics of C
// over it: far enough apart that only the D is bent.
const SLIDE_AND_NODE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.9, note: 36, gain: 0.8 },
    { atSec: 1, durSec: 1.1, note: 55.02, gain: 0.54 },
    { atSec: 2.2, durSec: 2.6, note: 50, gain: 0.77 },
    { atSec: 2.35, durSec: 1.4, note: 52, gain: 0.61 },
    { atSec: 4.3, durSec: 0.9, note: 67.02, gain: 0.51 },
    { atSec: 5.2, durSec: 2, note: 72, gain: 0.48 },
  ],
}

// Open C, G and d held; a finger carries G to A and back, then d to E: C G D, C A D, C G E.
const CARRIED: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 48, gain: 0.74 },
    { atSec: 0, durSec: 7.2, note: 55, gain: 0.64 },
    { atSec: 0, durSec: 7.2, note: 62, gain: 0.64 },
    { atSec: 2, durSec: 2.2, note: 57, gain: 0.64 },
    { atSec: 4.6, durSec: 2.6, note: 64, gain: 0.64 },
  ],
}

// Stopped tones over open strings, long enough to be shaken: A over D, then G F E over A, and D.
const YIN: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.3, note: 38, gain: 0.7 },
    { atSec: 0.5, durSec: 2.1, note: 57, gain: 0.77 },
    { atSec: 2.6, durSec: 0.5, note: 55, gain: 0.61 },
    { atSec: 3.1, durSec: 0.3, note: 53, gain: 0.51 },
    { atSec: 3.4, durSec: 1.7, note: 52, gain: 0.7 },
    { atSec: 3.5, durSec: 1.6, note: 45, gain: 0.64 },
    { atSec: 5.1, durSec: 2.2, note: 50, gain: 0.67 },
    { atSec: 5.1, durSec: 2.2, note: 38, gain: 0.7 },
  ],
}

// Open D and A held, and over them a slow line of their own harmonics: A at a third of the D string,
// D at a quarter of it, E at a third of the A string, and back through D to A.
const BOW_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 38, gain: 0.64 },
    { atSec: 0, durSec: 7.3, note: 45, gain: 0.51 },
    { atSec: 0.6, durSec: 1.8, note: 57.02, gain: 0.8 },
    { atSec: 2.4, durSec: 1.2, note: 62, gain: 0.72 },
    { atSec: 3.6, durSec: 1.3, note: 64.02, gain: 0.74 },
    { atSec: 4.9, durSec: 1, note: 62, gain: 0.67 },
    { atSec: 5.9, durSec: 1.4, note: 57.02, gain: 0.74 },
  ],
}

// One finger over all seven strings, up and then down, heard at their octave harmonics; after it
// the C string at a half, a third and a quarter.
const GUNFU: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 48, gain: 0.7 },
    { atSec: 0.08, durSec: 2.1, note: 50, gain: 0.54 },
    { atSec: 0.16, durSec: 2, note: 53, gain: 0.54 },
    { atSec: 0.24, durSec: 2, note: 55, gain: 0.58 },
    { atSec: 0.32, durSec: 1.9, note: 57, gain: 0.58 },
    { atSec: 0.4, durSec: 1.8, note: 60, gain: 0.61 },
    { atSec: 0.48, durSec: 1.7, note: 62, gain: 0.67 },
    { atSec: 2.4, durSec: 1.8, note: 62, gain: 0.64 },
    { atSec: 2.51, durSec: 1.7, note: 60, gain: 0.54 },
    { atSec: 2.62, durSec: 1.6, note: 57, gain: 0.54 },
    { atSec: 2.73, durSec: 1.6, note: 55, gain: 0.54 },
    { atSec: 2.84, durSec: 1.5, note: 53, gain: 0.54 },
    { atSec: 2.95, durSec: 1.5, note: 50, gain: 0.58 },
    { atSec: 3.06, durSec: 1.6, note: 48, gain: 0.67 },
    { atSec: 4.9, durSec: 2.3, note: 48, gain: 0.64 },
    { atSec: 5.3, durSec: 1.9, note: 55.02, gain: 0.54 },
    { atSec: 5.7, durSec: 1.6, note: 60, gain: 0.51 },
  ],
}

// Just triads out of three strings' harmonics: C E G are partials 4 5 6 of C, C F A partials 3 4 5
// of F, D G B the same of G, and E G C partials 5 6 8 of C.
const NODE_TRIADS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.7, note: 60, gain: 0.67 },
    { atSec: 0, durSec: 1.7, note: 63.86, gain: 0.54 },
    { atSec: 0, durSec: 1.7, note: 67.02, gain: 0.58 },
    { atSec: 1.8, durSec: 1.7, note: 60.02, gain: 0.64 },
    { atSec: 1.8, durSec: 1.7, note: 65, gain: 0.58 },
    { atSec: 1.8, durSec: 1.7, note: 68.86, gain: 0.54 },
    { atSec: 3.6, durSec: 1.7, note: 62.02, gain: 0.64 },
    { atSec: 3.6, durSec: 1.7, note: 67, gain: 0.58 },
    { atSec: 3.6, durSec: 1.7, note: 70.86, gain: 0.54 },
    { atSec: 5.4, durSec: 1.9, note: 63.86, gain: 0.64 },
    { atSec: 5.4, durSec: 1.9, note: 67.02, gain: 0.58 },
    { atSec: 5.4, durSec: 1.9, note: 72, gain: 0.58 },
  ],
}

// Four plucks, each on the note above and slid down at once to its tone: E to D, D to C, C to A,
// A to G.
const ZHU: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 52, gain: 0.8 },
    { atSec: 0.14, durSec: 1.45, note: 50, gain: 0.64 },
    { atSec: 1.7, durSec: 1.5, note: 50, gain: 0.77 },
    { atSec: 1.84, durSec: 1.45, note: 48, gain: 0.64 },
    { atSec: 3.4, durSec: 1.5, note: 48, gain: 0.77 },
    { atSec: 3.54, durSec: 1.45, note: 45, gain: 0.64 },
    { atSec: 5.1, durSec: 2.1, note: 45, gain: 0.8 },
    { atSec: 5.24, durSec: 2.06, note: 43, gain: 0.64 },
  ],
}

// How the strings are tuned: one tone touched on two of them, two cents apart. G on the C and G
// strings, A on D and A, C on F and c, D on G and d, and that D an octave up.
const TUNING: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 55.02, gain: 0.67 },
    { atSec: 0.5, durSec: 1.6, note: 55, gain: 0.61 },
    { atSec: 1.5, durSec: 1.6, note: 57.02, gain: 0.64 },
    { atSec: 2, durSec: 1.6, note: 57, gain: 0.58 },
    { atSec: 3, durSec: 1.7, note: 60.02, gain: 0.64 },
    { atSec: 3.5, durSec: 1.7, note: 60, gain: 0.58 },
    { atSec: 4.5, durSec: 2.6, note: 62.02, gain: 0.64 },
    { atSec: 5, durSec: 2.2, note: 62, gain: 0.58 },
    { atSec: 5.7, durSec: 1.7, note: 74.02, gain: 0.51 },
    { atSec: 6.2, durSec: 1.2, note: 74, gain: 0.48 },
  ],
}

// Chords of one string each, each a fifth over the last: F is partials 2 3 4 5 of F, C is 3 4 5 6
// of C, G is 2 3 4 5 of G, and D, with no third, is 3 4 6 of D.
const NODE_CHAIN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.7, note: 53, gain: 0.64 },
    { atSec: 0, durSec: 1.7, note: 60.02, gain: 0.54 },
    { atSec: 0, durSec: 1.7, note: 65, gain: 0.54 },
    { atSec: 0, durSec: 1.7, note: 68.86, gain: 0.58 },
    { atSec: 1.8, durSec: 1.7, note: 55.02, gain: 0.61 },
    { atSec: 1.8, durSec: 1.7, note: 60, gain: 0.54 },
    { atSec: 1.8, durSec: 1.7, note: 63.86, gain: 0.51 },
    { atSec: 1.8, durSec: 1.7, note: 67.02, gain: 0.58 },
    { atSec: 3.6, durSec: 1.7, note: 55, gain: 0.61 },
    { atSec: 3.6, durSec: 1.7, note: 62.02, gain: 0.54 },
    { atSec: 3.6, durSec: 1.7, note: 67, gain: 0.51 },
    { atSec: 3.6, durSec: 1.7, note: 70.86, gain: 0.54 },
    { atSec: 5.4, durSec: 1.9, note: 57.02, gain: 0.64 },
    { atSec: 5.4, durSec: 1.9, note: 62, gain: 0.58 },
    { atSec: 5.4, durSec: 1.9, note: 69.02, gain: 0.58 },
  ],
}

// One high voice, its tones slid into: A C D, and down through C and A to G.
const CRANE_CALL: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 69, gain: 0.7 },
    { atSec: 1.6, durSec: 0.7, note: 72, gain: 0.64 },
    { atSec: 2.3, durSec: 1.7, note: 74, gain: 0.74 },
    { atSec: 4.2, durSec: 0.7, note: 72, gain: 0.64 },
    { atSec: 4.9, durSec: 0.8, note: 69, gain: 0.64 },
    { atSec: 5.7, durSec: 1.6, note: 67, gain: 0.7 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Zither. Open strings first, then the marks, then the sliding hand.
  {
    id: 'thirteen-nodes-first-string-tolls',
    name: 'First string tolls',
    category: 'plucked',
    description:
      'An open string plucked with a fingertip near the bridge, twelve seconds of ring on a hollow body, a little dark plate behind.',
    preview: EARTH_TOLL,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: {
        exciter: 0,
        decay: 12,
        release: 5,
        brightness: 0.45,
        position: 0.12,
        sympathy: 0.3,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'thirteen-nodes-jade-tuning-pegs',
    name: 'Jade tuning pegs',
    category: 'plucked',
    description:
      'Open strings picked hard by the bridge, bright and soon over, with a hint of a tight three-spring tank.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: {
        volume: -4.5,
        chord: 0,
        strum: 0,
        decay: 3,
        release: 1.4,
        brightness: 0.85,
        position: 0.06,
        sympathy: 0.1,
      },
    },
    effects: [
      {
        deviceId: 'spring-reverb',
        preset: 'Hint of spring',
        params: { springs: 2, decay: 1.6, tension: 0.8, mix: 0.2 },
      },
    ],
  },
  {
    id: 'thirteen-nodes-board-of-paulownia',
    name: 'Board of paulownia',
    category: 'plucked',
    description:
      'Dull plucks in the middle of the string, played through a large wooden soundboard and a warm hall.',
    preview: EARTH_TOLL,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { exciter: 0, decay: 7, release: 4, brightness: 0.25, position: 0.42, sympathy: 0.1 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Wooden body',
        params: { size: 1.6, material: 0.6, mix: 0.75 },
      },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { lowDecay: 4, mix: 0.28 } },
    ],
  },
  {
    id: 'thirteen-nodes-one-sweep-of-a-nail',
    name: 'One sweep of a nail',
    category: 'plucked',
    description:
      'A picked zither whose other strings ring with every tone, so a sweep over all seven stays in the air of a short bright room.',
    preview: GUNFU,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: {
        chord: 0,
        strum: 0,
        decay: 9,
        release: 7,
        brightness: 0.7,
        position: 0.16,
        courses: 0.1,
        sympathy: 0.9,
      },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Room',
        params: { decay: 1.4, damping: 0.2, breathDepth: 0, mix: 0.25 },
      },
    ],
  },
  {
    id: 'thirteen-nodes-frost-in-the-lacquer',
    name: 'Frost in the lacquer',
    category: 'plucked',
    description:
      'Doubled strings far out of tune with each other, brilliant and twenty seconds long, under a thin frozen-winter wear.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'zither',
      preset: 'Minor glass haze',
      params: {
        volume: -5,
        chord: 0,
        strum: 0,
        brightness: 0.95,
        position: 0.3,
        courses: 1,
        sympathy: 0.5,
      },
    },
    effects: [
      { deviceId: 'seasons', preset: 'First frost' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'thirteen-nodes-open-string-and-octave',
    name: 'Open string and octave',
    category: 'plucked',
    description:
      'Each key plucks its string with the octave a moment after, warmed by a valve and left to slow dark echoes.',
    preview: EARTH_TOLL,
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: {
        exciter: 0,
        chord: 1,
        strum: 130,
        decay: 8,
        release: 5,
        brightness: 0.4,
        courses: 0.1,
        sympathy: 0.2,
        body: 3,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Hot valve',
        params: { drive: 0.35, noise: 0.1, wobble: 0.05 },
      },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 900, feedback: 0.35, mix: 0.25 },
      },
    ],
  },
  {
    id: 'thirteen-nodes-sleeve-on-the-strings',
    name: 'Sleeve on the strings',
    category: 'plucked',
    description:
      'Open strings with cloth laid on them: a second of dull tone, no sympathetic ring, heard from across a room.',
    preview: THREE_VOICES,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: {
        volume: 1,
        exciter: 0,
        decay: 0.9,
        release: 0.25,
        brightness: 0.12,
        position: 0.3,
        sympathy: 0,
        body: 1,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward' },
      { deviceId: 'distance', preset: 'Across the room' },
    ],
  },
  {
    id: 'thirteen-nodes-touched-at-the-middle',
    name: 'Touched at the middle',
    category: 'bell',
    description:
      'A near-pure harmonic: the pluck at mid-string with its edge taken off, its three strongest partials kept on as pure sines.',
    preview: HEAVEN,
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: {
        volume: -7,
        exciter: 0,
        chord: 0,
        decay: 6,
        release: 5,
        brightness: 0.15,
        position: 0.5,
        sympathy: 0.15,
      },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Glass redraw',
        params: { partials: 3, release: 3, mix: 0.6 },
      },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'thirteen-nodes-nacre-dots',
    name: 'Nacre dots',
    category: 'bell',
    description:
      'Small hammered harmonics with their octave, their partials catching the light one by one at random.',
    preview: HEAVEN,
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: {
        volume: -2,
        roll: 0,
        strum: 0,
        decay: 3.5,
        release: 3,
        brightness: 0.45,
        position: 0.5,
        courses: 0,
        sympathy: 0.35,
        body: 0,
      },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Glitter on top', params: { mix: 0.9 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'thirteen-nodes-crane-over-pines',
    name: 'Crane over pines',
    category: 'bell',
    description:
      'Harmonics that set the whole zither ringing, with their octave halo swelling in a dark hall.',
    preview: NODES_DOWN,
    instrument: {
      deviceId: 'zither',
      preset: 'Slow falling sus',
      params: {
        chord: 0,
        strum: 0,
        decay: 14,
        release: 16,
        brightness: 0.2,
        position: 0.5,
        sympathy: 1,
      },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.45 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'thirteen-nodes-a-fifth-of-the-string',
    name: 'A fifth of the string',
    category: 'bell',
    description:
      'A thin picked harmonic with no lows, scattered by seven stars of echo and nothing else.',
    preview: HEAVEN,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { volume: -2.5, decay: 2.5, release: 2, brightness: 0.9, position: 0.2, body: 1 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 320, highCut: 9000 } },
      { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'thirteen-nodes-mirror-mark',
    name: 'Mirror mark',
    category: 'bell',
    description:
      'A harmonic with its fifth and octave struck together by a soft hammer, its partials pulled a little towards a chime.',
    preview: HEAVEN,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: {
        volume: -5.5,
        chord: 2,
        strum: 0,
        decay: 5,
        release: 6,
        brightness: 0.3,
        position: 0.5,
        sympathy: 0.3,
        body: 2,
      },
    },
    effects: [
      { deviceId: 'warp', preset: 'Soft chime' },
      { deviceId: 'expanse', preset: 'Faint air', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'thirteen-nodes-mist-at-the-eighth',
    name: 'Mist at the eighth',
    category: 'texture',
    description:
      'Harmonics with the touch blurred away in a soft cloud, then a tail that thins and rises as it goes.',
    preview: HEAVEN,
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: {
        volume: -4.5,
        exciter: 1,
        chord: 0,
        decay: 10,
        release: 10,
        brightness: 0.5,
        position: 0.5,
        sympathy: 0.6,
        body: 1,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack' },
      { deviceId: 'melt', preset: 'Evaporate', params: { sag: 20, mix: 0.35 } },
    ],
  },
  {
    id: 'thirteen-nodes-thumb-lingers',
    name: 'Thumb lingers',
    category: 'plucked',
    description:
      'A stopped tone, short and round, shaken late and narrowly, with the rub of the finger riding under it as quiet air.',
    preview: YIN,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: {
        exciter: 0,
        decay: 4,
        release: 0.8,
        brightness: 0.4,
        position: 0.16,
        sympathy: 0.1,
      },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        preset: 'Finger vibrato',
        params: { wait: 300, depth: 22, rate: 4.6, width: 0.1 },
      },
      {
        deviceId: 'noise-floor',
        preset: 'Riding hiss',
        params: { type: 6, level: -38, response: 0.4 },
      },
    ],
  },
  {
    id: 'thirteen-nodes-wide-shaken-tone',
    name: 'Wide shaken tone',
    category: 'plucked',
    description:
      'A stopped string rocked slowly by most of a semitone once it has settled, picked bright, in a tight chamber.',
    preview: YIN,
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: {
        exciter: 1,
        chord: 0,
        strum: 0,
        decay: 6,
        release: 2,
        brightness: 0.6,
        position: 0.1,
        sympathy: 0.25,
        body: 1,
      },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        preset: 'Seasick',
        params: { wait: 400, grow: 900, depth: 60, rate: 2.4, width: 0.1 },
      },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'thirteen-nodes-rub-of-silk',
    name: 'Rub of silk',
    category: 'texture',
    description:
      'A tone sifted to breath: the pluck nearly gone, the air of it loud and wide, with a hiss of air riding along.',
    preview: YIN,
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: {
        volume: 2.5,
        exciter: 1,
        chord: 0,
        strum: 0,
        decay: 2,
        release: 0.6,
        brightness: 1,
        position: 0.07,
        sympathy: 0,
      },
    },
    effects: [
      { deviceId: 'sift', preset: 'Breath and tone', params: { tones: -8 } },
      {
        deviceId: 'noise-floor',
        preset: 'Riding hiss',
        params: { type: 6, level: -32, tone: -0.3, response: 0.25 },
      },
      { deviceId: 'distance', preset: 'Wide and near' },
    ],
  },
  {
    id: 'thirteen-nodes-slid-into-the-rest',
    name: 'Slid into the rest',
    category: 'plucked',
    description:
      'A stopped tone whose tail slides down as it ages, as if the finger went on towards the next mark and did not arrive.',
    preview: THREE_VOICES,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: {
        volume: 0,
        exciter: 1,
        decay: 2.2,
        release: 1.2,
        brightness: 0.55,
        position: 0.25,
        sympathy: 0.1,
        body: 3,
      },
    },
    effects: [
      {
        deviceId: 'melt',
        preset: 'Clean start',
        params: { sag: -45, solid: 300, hold: 4, blur: 0.4, mix: 0.6 },
      },
    ],
  },
  {
    id: 'thirteen-nodes-down-from-the-ninth',
    name: 'Down from the ninth',
    category: 'plucked',
    description:
      'Each tone followed by pieces of itself that fall a whole tone, slow and dull, over a small wooden body.',
    preview: PRESS,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: {
        volume: -3.5,
        decay: 3,
        release: 2,
        brightness: 0.35,
        position: 0.2,
        sympathy: 0,
        body: 3,
      },
    },
    effects: [
      {
        deviceId: 'falling',
        preset: 'Slow sighs',
        params: { fall: -2, size: 1400, density: 2, tone: 3500, mix: 0.45 },
      },
      { deviceId: 'vessel', preset: 'Hint of wood', params: { size: 0.6, mix: 0.4 } },
    ],
  },
  {
    id: 'thirteen-nodes-half-decayed-already',
    name: 'Half decayed already',
    category: 'plucked',
    description:
      'The pluck removed and the string faded in a third of a second late, dark and swaying slowly, in a small room.',
    preview: YIN,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: {
        volume: -3,
        exciter: 0,
        chord: 0,
        strum: 0,
        decay: 9,
        release: 4,
        brightness: 0.35,
        position: 0.35,
        courses: 0.5,
        sympathy: 0.4,
        body: 2,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 350, depth: 1 } },
      { deviceId: 'late-vibrato', preset: 'Slow drift', params: { depth: 25, rate: 0.9 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'thirteen-nodes-incense-burns-down',
    name: 'Incense burns down',
    category: 'drone',
    description:
      'Each key and its octave rolled by a soft hammer, opening and closing on a breath of five and a half seconds.',
    preview: BOW_LINE,
    instrument: {
      deviceId: 'zither',
      preset: 'Minor tremolo',
      params: {
        chord: 1,
        strum: 200,
        roll: 11,
        decay: 6,
        release: 3,
        brightness: 0.2,
        position: 0.4,
        courses: 0.2,
        sympathy: 0.5,
      },
    },
    effects: [
      { deviceId: 'breath', preset: 'Calm breath', params: { in: 1.6, out: 2.4, depth: 0.55 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { decay: 8, bloom: 0.2, mix: 0.3 } },
    ],
  },

  // Acoustic guitar: nylon for the silk, wire and twelve strings for the harmonics.
  {
    id: 'thirteen-nodes-silk-thumb',
    name: 'Silk thumb',
    category: 'plucked',
    description:
      'A nylon string plucked over the sound hole by bare flesh, ringing long in its box, with a warm small room.',
    preview: EARTH_TOLL,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: {
        volume: -3.5,
        body: 1,
        position: 0.4,
        nail: 0,
        sustain: 9,
        release: 4,
        tone: 0.3,
        shimmer: 0,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } }],
  },
  {
    id: 'thirteen-nodes-wound-string-low',
    name: 'Wound string, low',
    category: 'bass',
    description:
      'A steel string plucked by the bridge with a dull octave below it, its top closed, the lows driven by a transformer.',
    preview: EARTH_TOLL,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: { body: 0.6, position: 0.1, nail: 0.2, sustain: 6, release: 1.5, tone: 0.3 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.4, filter: 1800 } },
      { deviceId: 'analog-drive', preset: 'Iron lows' },
    ],
  },
  {
    id: 'thirteen-nodes-goose-feet',
    name: 'Goose feet',
    category: 'plucked',
    description:
      'Nylon plucked with the nail close to the bridge, boxy, short, with one tape slap at a seventh of a second.',
    preview: GUNFU,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: { volume: 2, body: 0.95, sustain: 1.6, release: 0.4, tone: 0.55 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Single slap', params: { time: 140, mix: 0.25 } }],
  },
  {
    id: 'thirteen-nodes-dragon-pool',
    name: 'Dragon pool',
    category: 'plucked',
    description:
      'A steel guitar heard from inside its own sound hole: a stopped pipe of air around every open string.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: {
        volume: -2,
        body: 0.5,
        nail: 0.2,
        position: 0.22,
        sustain: 10,
        release: 7,
        tone: 0.4,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Cistern',
        params: { size: 1.4, air: 0.15, material: 0.5, mix: 0.55 },
      },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'thirteen-nodes-phoenix-pond',
    name: 'Phoenix pond',
    category: 'plucked',
    description:
      'A softly plucked twelve-string, its courses beating just over once a second, six currents swelling through them in turn.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve drift',
      params: { volume: -4, body: 0.4, nail: 0.1, position: 0.36, tone: 0.35, shimmer: 1.2 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide', params: { rate: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'thirteen-nodes-belly-of-the-crane',
    name: 'Belly of the crane',
    category: 'plucked',
    description:
      'A thumbed nylon string in a body made much larger, sixteen strings of D minor ringing on behind it.',
    preview: YIN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: {
        volume: -0.5,
        type: 1,
        body: 0.7,
        position: 0.3,
        nail: 0.1,
        sustain: 5,
        release: 2,
        tone: 0.5,
        shimmer: 0.4,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'Giant', params: { size: 0.7 } },
      { deviceId: 'sympathetic', preset: 'Minor wash', params: { decay: 5, mix: 0.35 } },
    ],
  },
  {
    id: 'thirteen-nodes-table-of-stone',
    name: 'Table of stone',
    category: 'plucked',
    description:
      'A bare steel string with almost no box, hard nail and long ring, in a stairwell of stone.',
    preview: THREE_VOICES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bare string',
      params: {
        volume: -2.5,
        body: 0,
        position: 0.16,
        nail: 0.9,
        sustain: 9,
        release: 5,
        tone: 0.9,
      },
    },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
  },
  {
    id: 'thirteen-nodes-flower-of-the-octave',
    name: 'Flower of the octave',
    category: 'bell',
    description:
      'A twelve-string plucked far from the bridge by the flesh, its upper partials turned up out of the ring.',
    preview: HEAVEN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve chime',
      params: {
        volume: -1.5,
        body: 0.2,
        position: 0.4,
        nail: 0.1,
        sustain: 8,
        release: 6,
        tone: 0.55,
        shimmer: 0.5,
      },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'thirteen-nodes-dragonfly-touch',
    name: 'Dragonfly touch',
    category: 'bell',
    description:
      'A nylon harmonic, boxless and rounded, that comes back as a few quick glints an octave or two higher.',
    preview: NODES_DOWN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: {
        volume: 3.5,
        body: 0.1,
        position: 0.4,
        nail: 0.2,
        sustain: 5,
        release: 4,
        tone: 0.45,
        strum: 0,
      },
    },
    effects: [
      { deviceId: 'glints', preset: 'First light', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Layer', params: { lowCut: 220 } },
    ],
  },
  {
    id: 'thirteen-nodes-eighth-of-a-wire',
    name: 'Eighth of a wire',
    category: 'bell',
    description:
      'Steel plucked by the bridge, its lows cut away, skipping across the room in closing steps and firmly levelled.',
    preview: NODES_DOWN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Glass pick',
      params: {
        volume: -8,
        body: 0.1,
        position: 0.1,
        nail: 0.4,
        sustain: 10,
        release: 8,
        shimmer: 0.2,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 400, highCut: 14000 } },
      { deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 14, outputGain: -6 } },
    ],
  },
  {
    id: 'thirteen-nodes-two-strings-agree',
    name: 'Two strings agree',
    category: 'plucked',
    description:
      'Nylon plucked by the flesh, slow beats inside every tone, a faint choir of ah coming up behind.',
    preview: TUNING,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: {
        volume: -2.5,
        body: 0.5,
        position: 0.35,
        nail: 0,
        sustain: 10,
        release: 8,
        tone: 0.35,
        shimmer: 0.8,
        strum: 25,
      },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.3 } }],
  },
  {
    id: 'thirteen-nodes-struck-jade-slab',
    name: 'Struck jade slab',
    category: 'bell',
    description:
      'A bridge-picked string with its partials spread like a stiff bar, levelled firmly on its way to a bright plate.',
    preview: NODE_TRIADS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bridge harp',
      params: {
        volume: -3,
        body: 0.35,
        nail: 0.5,
        sustain: 10,
        release: 4,
        tone: 0.7,
        shimmer: 0.1,
        strum: 0,
      },
    },
    effects: [
      { deviceId: 'warp', preset: 'Stiff string', params: { stretch: 0.3 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 18, outputGain: -6.5 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'thirteen-nodes-moon-in-a-cold-well',
    name: 'Moon in a cold well',
    category: 'texture',
    description:
      'A boxless twelve-string whose spectrum is hung in place as a halo of glass, spread wide.',
    preview: HEAVEN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: {
        volume: -1.5,
        body: 0.1,
        position: 0.2,
        nail: 0.5,
        sustain: 8,
        release: 8,
        tone: 0.8,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.6 } },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  {
    id: 'thirteen-nodes-ring-finger-slides',
    name: 'Ring finger slides',
    category: 'plucked',
    description:
      'Stopped nylon, soft and quick to fade, whose last cents droop under a narrow late shake.',
    preview: YIN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: {
        volume: 0.5,
        type: 1,
        body: 0.9,
        position: 0.24,
        nail: 0.1,
        sustain: 4,
        release: 0.6,
        tone: 0.6,
        strum: 0,
      },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        preset: 'Slow bow',
        params: { wait: 200, depth: 30, rate: 3.6, width: 0 },
      },
      { deviceId: 'melt', preset: 'Soft sag', params: { sag: -25, mix: 0.4 } },
    ],
  },
  {
    id: 'thirteen-nodes-carried-up-a-tone',
    name: 'Carried up a tone',
    category: 'plucked',
    description:
      'Muted steel notes with pieces of themselves rising a whole tone behind, one after another, in a small booth.',
    preview: YIN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: {
        volume: 3,
        body: 0.8,
        position: 0.2,
        nail: 0.2,
        sustain: 1.5,
        release: 0.5,
        tone: 0.4,
      },
    },
    effects: [
      {
        deviceId: 'falling',
        preset: 'Questions',
        params: { fall: 2, size: 900, density: 2.5, tone: 4000, again: 0, mix: 0.5 },
      },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'thirteen-nodes-nail-against-silk',
    name: 'Nail against silk',
    category: 'texture',
    description:
      'Nylon by the bridge with its strike sifted out and its air spread wide, the rub riding under it, pressed flat by a limiter.',
    preview: YIN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon pizzicato',
      params: {
        volume: 2,
        body: 0.8,
        position: 0.08,
        nail: 0.6,
        tone: 0.9,
        sustain: 4,
        release: 0.8,
      },
    },
    effects: [
      {
        deviceId: 'sift',
        preset: 'Strikes forward',
        params: { tones: -4, attacks: -24, air: 4, soften: 0.1, scatter: 0.8 },
      },
      {
        deviceId: 'noise-floor',
        preset: 'Riding hiss',
        params: { type: 6, level: -34, response: 0.3, hold: 4 },
      },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -8.5 } },
    ],
  },
  {
    id: 'thirteen-nodes-slow-water-hand',
    name: 'Slow water hand',
    category: 'plucked',
    description:
      'A long steel string wavering slowly from the first moment, as a hand rocks on it, over worn tape echoes most of a second late.',
    preview: THREE_VOICES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: {
        volume: -3,
        body: 0.7,
        position: 0.28,
        nail: 0.4,
        sustain: 8,
        release: 3,
        tone: 0.6,
        shimmer: 0,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Pitch wobble',
        params: { rate: 1.6, depth: 0.45, drift: 0.6 },
      },
      {
        deviceId: 'tape-echo',
        preset: 'Worn tape',
        params: { time: 900, feedback: 0.3, mix: 0.25 },
      },
    ],
  },
  {
    id: 'thirteen-nodes-under-the-eaves',
    name: 'Under the eaves',
    category: 'plucked',
    description:
      'Short stopped nylon outdoors in light rain, its body drawn to the middle and its top left wide.',
    preview: PRESS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon pizzicato',
      params: {
        volume: 6,
        body: 1,
        position: 0.3,
        nail: 0.2,
        sustain: 1.2,
        release: 0.5,
        tone: 0.3,
      },
    },
    effects: [
      { deviceId: 'weather', preset: 'Light rain', params: { mix: 0.7 } },
      { deviceId: 'spread', preset: 'Narrow body' },
    ],
  },
  {
    id: 'thirteen-nodes-tone-faded-in-late',
    name: 'Tone faded in late',
    category: 'string',
    description:
      'Steel with the pluck taken away: each tone swells in over half a second already shaking, into a dark hall.',
    preview: YIN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: {
        volume: 3,
        body: 1,
        position: 0.34,
        nail: 0.1,
        sustain: 12,
        release: 3,
        tone: 0.3,
        shimmer: 0.2,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow bow', params: { attack: 500 } },
      {
        deviceId: 'late-vibrato',
        preset: 'Late vibrato',
        params: { wait: 100, grow: 400, depth: 24, width: 0.2 },
      },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'thirteen-nodes-copied-by-brush',
    name: 'Copied by brush',
    category: 'plucked',
    description:
      'A thumb-played steel string answered by itself over a second later, duller, then once more an octave down.',
    preview: THREE_VOICES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: {
        volume: 0.5,
        body: 0.9,
        position: 0.14,
        nail: 0.15,
        sustain: 3,
        release: 1,
        tone: 0.5,
        shimmer: 0.1,
      },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Faint answer',
        params: { followers: 2, gap: 1.3, interval2: -12, tone: 2500, mix: 0.35 },
      },
    ],
  },

  // Pedal steel: the sliding hand itself. Held neighbours bend the string that is sounding.
  {
    id: 'thirteen-nodes-slide-to-the-tenth',
    name: 'Slide to the tenth',
    category: 'string',
    description:
      'A dark stopped string with a slide of most of a second and no vibrato, the pluck round, a thin veil of room.',
    preview: HUMAN_SLIDES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Round thumb',
      params: { sustain: 9, glide: 750, range: 4, vibrato: 0, tone: 1700 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.18 } }],
  },
  {
    id: 'thirteen-nodes-quick-grace-from-above',
    name: 'Quick grace from above',
    category: 'plucked',
    description:
      'A short hard-picked string whose slides are over in a tenth of a second, played on a hollow drum-like body.',
    preview: ZHU,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { sustain: 4, glide: 70, range: 3, vibrato: 0, pick: 0.9, tone: 4200 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { size: 0.9, mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'thirteen-nodes-second-tone-by-thumb',
    name: 'Second tone by thumb',
    category: 'string',
    description:
      'A third-of-a-second slide on a plain string, warmed on a worn small tape with hiss under it.',
    preview: ZHU,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Lap slide',
      params: { sustain: 10, glide: 320, range: 3, vibrato: 3, pick: 0.5, tone: 2400 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0.15, hiss: 0.35 } },
    ],
  },
  {
    id: 'thirteen-nodes-one-pluck-a-whole-line',
    name: 'One pluck, a whole line',
    category: 'string',
    description:
      'A string that rings forty seconds so one pluck carries a whole line, brought forward as it fades, on a dark plate.',
    preview: ONE_PLUCK,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Soft bends',
      params: {
        volume: -7.5,
        swell: 0,
        sustain: 40,
        glide: 450,
        range: 5,
        vibrato: 2,
        pick: 0.35,
        tone: 2800,
      },
    },
    effects: [
      { deviceId: 'lift', preset: 'Long tails', params: { threshold: -30, limit: 12 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'thirteen-nodes-air-of-the-slide',
    name: 'Air of the slide',
    category: 'texture',
    description:
      'A dying string four seconds long, tone turned down, rub and air turned up: the slide is mostly breath.',
    preview: ONE_PLUCK,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dying slide',
      params: { volume: -1.5, glide: 600, range: 4, pick: 0.7, tone: 6000 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Wide air', params: { tones: -9 } },
      {
        deviceId: 'noise-floor',
        preset: 'Riding hiss',
        params: { type: 6, level: -30, response: 0.8, width: 1 },
      },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'thirteen-nodes-finger-heard-on-clay',
    name: 'Finger heard on clay',
    category: 'string',
    description:
      'A soft string sliding slowly for half a second at a time, heard close and through a clay pot of air.',
    preview: HUMAN_SLIDES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dark swell',
      params: {
        volume: -5,
        swell: 0.05,
        sustain: 7,
        glide: 500,
        range: 3,
        vibrato: 0,
        pick: 0,
        tone: 1500,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } },
      { deviceId: 'distance', preset: 'Close mic' },
    ],
  },
  {
    id: 'thirteen-nodes-earth-human-heaven',
    name: 'Earth, human, heaven',
    category: 'string',
    description:
      'One clean string for open tone, slide and harmonic: only a held neighbour is bent, the far marks stand still. A hall behind.',
    preview: SLIDE_AND_NODE,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0, sustain: 16, glide: 400, range: 4, vibrato: 0, pick: 0.3, tone: 3600 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } }],
  },
  {
    id: 'thirteen-nodes-marks-without-fingers',
    name: 'Marks without fingers',
    category: 'bell',
    description:
      'Picked bells of steel with no bend at all, halved under their own octaves, with a faint glimmer rising behind.',
    preview: HEAVEN,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Short twang',
      params: { volume: -1.5, sustain: 4, pick: 0.6, tone: 5000 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves', params: { up1: 0.5, up2: 0.15, dry: 0.5 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'thirteen-nodes-touch-and-let-go',
    name: 'Touch and let go',
    category: 'bell',
    description:
      'A harmonic with a rounded entry on a still string, redrawn an octave up by twenty wide sines, on a small plate.',
    preview: TUNING,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Short bloom',
      params: { volume: -6.5, swell: 0.08, sustain: 8, pick: 0.2, tone: 1800 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Wide glass', params: { transpose: 12, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'thirteen-nodes-three-open-and-a-finger',
    name: 'Three open and a finger',
    category: 'pad',
    description:
      'A held chord of open strings swelling in, one tone carried by slow pedal while the others stand, in a wide valley.',
    preview: CARRIED,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: { swell: 1.2, sustain: 30, glide: 800, range: 2, vibrato: 4, tone: 2600 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { decay: 7, mix: 0.35 } }],
  },
  {
    id: 'thirteen-nodes-mooring-in-autumn-mist',
    name: 'Mooring in autumn mist',
    category: 'pad',
    description:
      'Swelled strings with every attack blurred away, the whole going slowly nearer and farther.',
    preview: CARRIED,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1, sustain: 25, glide: 600, range: 3, pick: 0.1, tone: 1600 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Slow rise' },
      { deviceId: 'distance', preset: 'Slow tide' },
    ],
  },
  {
    id: 'thirteen-nodes-slow-nao-on-a-low-string',
    name: 'Slow nao on a low string',
    category: 'string',
    description:
      'A low string shaken forty cents wide and slowly while it lasts, with an octave under it and a soft valve.',
    preview: HUMAN_SLIDES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Wide shake',
      params: { swell: 0, sustain: 18, glide: 300, range: 3, rate: 3, pick: 0.4, tone: 2200 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub1: 0.35, sub2: 0, up1: 0, dry: 1 } },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 6, outputDb: -3 } },
    ],
  },
  {
    id: 'thirteen-nodes-quick-yin',
    name: 'Quick yin',
    category: 'string',
    description:
      'A bright string with a fast narrow shake and short slides, in two springs that drip after it.',
    preview: ZHU,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: {
        swell: 0,
        sustain: 14,
        glide: 120,
        range: 4,
        vibrato: 14,
        rate: 6.6,
        pick: 0.8,
        tone: 5200,
      },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.28 } }],
  },
  {
    id: 'thirteen-nodes-slide-on-a-slack-string',
    name: 'Slide on a slack string',
    category: 'string',
    description:
      'A slow slide that reaches as far as an octave on one string, dulled, and repeated by three tape heads.',
    preview: ONE_PLUCK,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { swell: 0.1, sustain: 22, glide: 650, range: 12, vibrato: 0, pick: 0.6, tone: 3300 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { feedback: 0.35, mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { lowCut: 90 } },
    ],
  },
  {
    id: 'thirteen-nodes-seventh-mark-descends',
    name: 'Seventh mark descends',
    category: 'texture',
    description:
      'A short string, then its tail carried down and down by two slow falling voices that never land.',
    preview: HUMAN_SLIDES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dying slide',
      params: { sustain: 3, glide: 400, range: 3, pick: 0.2, tone: 2600 },
    },
    effects: [
      {
        deviceId: 'spiral',
        preset: 'Slow descent',
        params: { climb: -5, voices: 2, decay: 5, mix: 0.45 },
      },
    ],
  },
  {
    id: 'thirteen-nodes-ghost-of-the-fifth-tone',
    name: 'Ghost of the fifth tone',
    category: 'string',
    description:
      'A still string shadowed by one pure sine that slides after every bend and arrives late.',
    preview: SLIDE_AND_NODE,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Soft bends',
      params: { swell: 0, sustain: 5, glide: 200, range: 4, vibrato: 0, pick: 0.5, tone: 2000 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'One sine', params: { glide: 900, release: 5, mix: 0.6 } },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'thirteen-nodes-low-study-next-door',
    name: 'Low study next door',
    category: 'string',
    description:
      'A slid string played in the next room, through the wall, narrow and without its top.',
    preview: HUMAN_SLIDES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: {
        volume: -4.5,
        swell: 0.15,
        sustain: 12,
        glide: 350,
        range: 4,
        vibrato: 5,
        rate: 4,
        pick: 1,
        tone: 4000,
      },
    },
    effects: [{ deviceId: 'distance', preset: 'Next door' }],
  },
  {
    id: 'thirteen-nodes-heaven-in-long-swells',
    name: 'Heaven in long swells',
    category: 'pad',
    description:
      'Bright strings that swell in over most of a second, detune slowly, and leave a tail that climbs by fifths.',
    preview: CARRIED,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Swelling slide',
      params: { swell: 0.8, sustain: 10, glide: 500, range: 3, vibrato: 0, pick: 0.8, tone: 5000 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.4 } },
      { deviceId: 'bloom-reverb', preset: 'Rising fifths', params: { decay: 6, mix: 0.35 } },
    ],
  },
  {
    id: 'thirteen-nodes-string-after-string',
    name: 'String after string',
    category: 'string',
    description:
      'A slow slide with a dark low string section growing in behind it and staying on after the tone.',
    preview: SLIDE_AND_NODE,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Round thumb',
      params: { sustain: 20, glide: 550, range: 4, vibrato: 2, pick: 0.2, tone: 3000 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Dark cellos', params: { mix: 0.4 } }],
  },
  {
    id: 'thirteen-nodes-bend-in-a-bronze-bowl',
    name: 'Bend in a bronze bowl',
    category: 'string',
    description:
      'A plucked string and its slide heard with five low bowls on C and its fifth that ring when it touches them.',
    preview: SLIDE_AND_NODE,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { sustain: 12, glide: 280, range: 4, vibrato: 0, pick: 0.35, tone: 2400 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Low fifths',
        params: { root: 0, register: 0.4, ring: 10, mix: 0.45 },
      },
    ],
  },

  // Bow: the same string plucked, held singing at a node, or bowed as the slide would go on.
  {
    id: 'thirteen-nodes-bare-silk-cord',
    name: 'Bare silk cord',
    category: 'plucked',
    description:
      'One undoubled plucked string with a round body and a ring of nine seconds, dry but for a faint sheen of plate.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: {
        volume: -3,
        brightness: 0.45,
        decay: 9,
        release: 6,
        position: 0.12,
        body: 0.9,
        detune: 0,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.15 } }],
  },
  {
    id: 'thirteen-nodes-twisted-cord-and-resin',
    name: 'Twisted cord and resin',
    category: 'plucked',
    description:
      'A wiry plucked string by its bridge, pushed through a console, with a dark detuned copy late on each side.',
    preview: EARTH_TOLL,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { brightness: 0.95, decay: 8, release: 5, position: 0.04, body: 0.1, detune: 0 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console', params: { drive: 0.45 } },
      { deviceId: 'stereo-detune', preset: 'Shadow' },
    ],
  },
  {
    id: 'thirteen-nodes-damped-by-the-left-palm',
    name: 'Damped by the left palm',
    category: 'plucked',
    description:
      'A dull knock of string, over in a second and all body, set in a short gated room.',
    preview: GUNFU,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { volume: -6, brightness: 0.2, decay: 0.8 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.25 } }],
  },
  {
    id: 'thirteen-nodes-two-cords-unmatched',
    name: 'Two cords unmatched',
    category: 'plucked',
    description:
      'Two strings a quarter of a semitone apart for every key, beating for twenty seconds under six rippling bands.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { brightness: 0.35, position: 0.2, body: 0.2 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Ripples', params: { mix: 0.7 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'thirteen-nodes-node-held-singing',
    name: 'Node held singing',
    category: 'pad',
    description:
      'A string held sounding without a pluck, pure as a touched half, entering in under a second, in a thin high air.',
    preview: NODE_TRIADS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 0.7, release: 2.5, brightness: 0.15, body: 0.1 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { decay: 6, mix: 0.35 } }],
  },
  {
    id: 'thirteen-nodes-a-third-of-the-way',
    name: 'A third of the way',
    category: 'pad',
    description:
      'A held string driven bright on its twelfth, with a glassy section an octave up following it.',
    preview: NODE_CHAIN,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Twelfth glow',
      params: { attack: 0.5, release: 2, brightness: 0.8, position: 0.33, detune: 0 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Glassy', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Texture' },
    ],
  },
  {
    id: 'thirteen-nodes-octave-found-by-pressure',
    name: 'Octave found by pressure',
    category: 'pad',
    description: 'A hard-driven string that gives itself to its octave, in a large dark hall.',
    preview: BOW_LINE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 0.9, release: 2, brightness: 0.5, pressure: 1, vibrato: 0.05, detune: 2 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.4 } }],
  },
  {
    id: 'thirteen-nodes-flautando-at-the-mark',
    name: 'Flautando at the mark',
    category: 'string',
    description:
      'A weightless bow far from the bridge, hardly any body, its breath turned up where the tone is quiet.',
    preview: NODE_TRIADS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.5, release: 1.5, brightness: 0.35, position: 0.5 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Air' },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'thirteen-nodes-slide-with-a-bow',
    name: 'Slide with a bow',
    category: 'string',
    description:
      'A dark bow with plenty of body, a few steps back, its shake arriving late and wide, as a hand goes on after the tone.',
    preview: BOW_LINE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 0.3, release: 0.8, brightness: 0.25, vibrato: 0, pressure: 0.4 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { wait: 500, depth: 45, rate: 4.2 } },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
  },
  {
    id: 'thirteen-nodes-resin-dust',
    name: 'Resin dust',
    category: 'string',
    description:
      'A rasped bow at the bridge, its noise kept and its lows thinned, heard off an old fast record.',
    preview: BOW_LINE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: { attack: 0.15, release: 0.6, brightness: 0.7, vibrato: 0, pressure: 0.9 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward', params: { lowCut: 180 } },
      { deviceId: 'vinyl', preset: 'Parlour 78', params: { crackle: 0.1, mix: 0.8 } },
    ],
  },
  {
    id: 'thirteen-nodes-cicada-wing',
    name: 'Cicada wing',
    category: 'string',
    description:
      'A glassy bow at the bridge with no body, trembling very fast in every band, in a short bright chamber.',
    preview: NODE_CHAIN,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.6, release: 1.5, brightness: 0.9, position: 0.03, body: 0 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Fast shimmer' },
      { deviceId: 'expanse', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'thirteen-nodes-pine-wind-drone',
    name: 'Pine wind drone',
    category: 'drone',
    description:
      'A heavy section of bowed strings far out of tune, with dry gusts of wind pulling its level about.',
    preview: BOW_LINE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: { volume: -11.5, attack: 0.8, release: 3, brightness: 0.3, vibrato: 0.1 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Dry gusts', params: { mix: 0.8 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 4 } },
    ],
  },
  {
    id: 'thirteen-nodes-open-d-all-evening',
    name: 'Open D all evening',
    category: 'drone',
    description:
      'A slow beating swell of one string and its lower octave, kept even by a slow hand on the level.',
    preview: BOW_LINE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Slow beating swell',
      params: { volume: -14, attack: 1, release: 5, brightness: 0.15, detune: 12 },
    },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'Swell pad',
        params: { sub1: 0.5, up1: 0, up2: 0, dry: 0.8, attack: 0.5 },
      },
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
    ],
  },
  {
    id: 'thirteen-nodes-tone-with-no-finger',
    name: 'Tone with no finger',
    category: 'plucked',
    description:
      'A pluck faded in over four tenths of a second, then faintly played again backwards, a little wide.',
    preview: YIN,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { volume: -4, attack: 0.4, release: 2, brightness: 0.5, decay: 8, detune: 3 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Faint reflection' },
      { deviceId: 'stereo-detune', preset: 'Faint width' },
    ],
  },
  {
    id: 'thirteen-nodes-shaken-after-the-pluck',
    name: 'Shaken after the pluck',
    category: 'plucked',
    description:
      'A soft plucked string with a deep slow shake of its own from the start, a four-second ring in a wooden box.',
    preview: YIN,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: {
        brightness: 0.6,
        decay: 4,
        release: 1.5,
        position: 0.3,
        body: 0.3,
        vibrato: 0.9,
        vibratoRate: 3.2,
        detune: 0,
      },
    },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { size: 0.7, mix: 0.6 } }],
  },
  {
    id: 'thirteen-nodes-thread-of-smoke',
    name: 'Thread of smoke',
    category: 'texture',
    description:
      'A faint sustained string slowly torn into rising wisps that thin as they climb an octave.',
    preview: BOW_LINE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Sustained swell',
      params: {
        volume: -13.5,
        attack: 0.8,
        release: 3,
        brightness: 0.7,
        pressure: 0.1,
        body: 0.1,
        detune: 3,
      },
    },
    effects: [{ deviceId: 'falling', preset: 'Rising mist', params: { mix: 0.5 } }],
  },
  {
    id: 'thirteen-nodes-rolled-mat-of-reeds',
    name: 'Rolled mat of reeds',
    category: 'string',
    description:
      'A string held by a sustainer, quick to speak and close to the bridge, through a pillow speaker with the top gone.',
    preview: BOW_LINE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Quick sustain',
      params: { release: 0.8, brightness: 0.5, position: 0.08, vibrato: 0.1 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Pillow speaker', params: { bass: 0.2 } }],
  },

  // Harp: the strings that press. A press of two hundred cents turns C D F G A into D E G A B.
  {
    id: 'thirteen-nodes-pressed-a-whole-tone',
    name: 'Pressed a whole tone',
    category: 'plucked',
    description:
      'A silk string plucked and pressed a whole tone sharp by the left hand each time, a soft pick, in a small room.',
    preview: PRESS,
    instrument: {
      deviceId: 'harp',
      preset: 'Whole tone press',
      params: { volume: 2, pluck: 0.14, touch: 0.5, decay: 1.5, halo: 0.2, body: 0.9 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room' }],
  },
  {
    id: 'thirteen-nodes-press-and-fade',
    name: 'Press and fade',
    category: 'plucked',
    description:
      'A whole-tone press on a string damped when it is let go, the pluck softened, so the rise is what is heard.',
    preview: PRESS,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: {
        volume: 5.5,
        pluck: 0.4,
        touch: 0,
        decay: 0.8,
        damp: 0.7,
        halo: 0,
        bend: 200,
        body: 0.5,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 90 } },
      {
        deviceId: 'noise-floor',
        preset: 'Riding hiss',
        params: { type: 6, level: -36, response: 0.4 },
      },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'thirteen-nodes-wire-pressed-twice',
    name: 'Wire pressed twice',
    category: 'plucked',
    description:
      'A bright wire string pressed sharp by a whole tone, its bucket echoes hopping a fifth down and back.',
    preview: PRESS,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { volume: 3, pluck: 0.06, touch: 0.9, decay: 1, bend: 200, body: 0.3 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Fifth hop',
        params: { intervalA: 2, intervalB: 0, time: 480, feedback: 0.35, mix: 0.3 },
      },
    ],
  },
  {
    id: 'thirteen-nodes-earth-on-a-great-harp',
    name: 'Earth on a great harp',
    category: 'plucked',
    description:
      'A finger pad at mid-string on long gut basses, the box full, the other strings silent, dark hall behind.',
    preview: EARTH_TOLL,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: -6, touch: 0.15, decay: 2, halo: 0, body: 0.8 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.22 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 2 } },
    ],
  },
  {
    id: 'thirteen-nodes-courtyard-of-two-walls',
    name: 'Courtyard of two walls',
    category: 'plucked',
    description:
      'Hard-picked harp close to the board, dry and short, thrown once to each side of an open courtyard.',
    preview: GUNFU,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { volume: 3, touch: 0.8, decay: 0.4, damp: 0.4, halo: 0, body: 0.2 },
    },
    effects: [
      {
        deviceId: 'constellation',
        preset: 'Wide pair',
        params: { span: 420, again: 0, mix: 0.35 },
      },
      { deviceId: 'distance', preset: 'Open air', params: { distance: 0.3 } },
    ],
  },
  {
    id: 'thirteen-nodes-side-of-the-palm',
    name: 'Side of the palm',
    category: 'bell',
    description:
      'A harp harmonic: plucked at the middle with no edge, the halo of the other strings full, its attack and air sifted out.',
    preview: HEAVEN,
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { volume: 0.5, pluck: 0.5, touch: 0.05, decay: 1.8, body: 0.1 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Tones only' },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { decay: 6, mix: 0.25 } },
    ],
  },
  {
    id: 'thirteen-nodes-star-in-the-lacquer',
    name: 'Star in the lacquer',
    category: 'bell',
    description:
      'Steel-strung harmonics plucked at the very end, four times as long, lit by slow upward ripples of their partials.',
    preview: NODES_DOWN,
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { volume: 4, touch: 0.6, decay: 4, halo: 0.6, body: 0.2 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rising ripple' },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'thirteen-nodes-snow-on-bamboo',
    name: 'Snow on bamboo',
    category: 'bell',
    description:
      'Muted harp tones with a chime made of their own partials pulled wide, and dark pieces of them falling a third, as snow off a leaf.',
    preview: NODES_DOWN,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { pluck: 0.5, touch: 0.2, damp: 0.5, halo: 0.1 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Glass bar', params: { stretch: 0.35, mix: 0.6 } },
      { deviceId: 'falling', preset: 'Dark snow', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'thirteen-nodes-seven-strings-at-once',
    name: 'Seven strings at once',
    category: 'plucked',
    description:
      'Chords rolled slowly low to high on a bright zither string, each string learned and rung again behind.',
    preview: NODE_TRIADS,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng cascade',
      params: { pluck: 0.2, touch: 0.45, decay: 1.5, halo: 0.2, sweep: 0.9, body: 0.8 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Learn and hold', params: { decay: 5, mix: 0.45 } },
    ],
  },
  {
    id: 'thirteen-nodes-rest-of-three-breaths',
    name: 'Rest of three breaths',
    category: 'texture',
    description:
      'A sparse harp whose phrase comes back three times as slow in its own rests, half of it blurred to mist.',
    preview: THREE_VOICES,
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { pluck: 0.28, touch: 0.2, decay: 1.2, halo: 0.2, body: 0.8 },
    },
    effects: [
      { deviceId: 'stretch', preset: 'Near shadow', params: { mix: 0.45 } },
      { deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'thirteen-nodes-lowered-eyes',
    name: 'Lowered eyes',
    category: 'plucked',
    description:
      'A koto string leaned on by a quarter of a semitone, quick and dry, darkened and warmed on blanketed cassette tape.',
    preview: THREE_VOICES,
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: {
        volume: 6,
        pluck: 0.12,
        touch: 0.3,
        decay: 0.5,
        damp: 0.3,
        halo: 0.1,
        bend: 25,
        body: 1,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket', params: { tone: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },

  // Chord harp: the marks as a plate to strum, one stroke to a chord.
  {
    id: 'thirteen-nodes-stroke-across-the-marks',
    name: 'Stroke across the marks',
    category: 'plucked',
    description:
      'A slow upward stroke over two octaves of the chord, soft plucks and no pad, in a room that opens and shuts in slow waves.',
    preview: NODE_TRIADS,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { volume: 0.5, strum: 90, span: 1, sustain: 4, tone: 0.3, pad: 0, spread: 0.4 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 2.5, mix: 0.3 } }],
  },
  {
    id: 'thirteen-nodes-single-dot-of-pearl',
    name: 'Single dot of pearl',
    category: 'bell',
    description:
      'One plucked tone to a key with no strum, dull and eight seconds long, made wooden by a small soundboard.',
    preview: HEAVEN,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Single chimes',
      params: { volume: -5.5, sustain: 8, tone: 0.15, spread: 0.3 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.6, size: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'thirteen-nodes-falling-hand',
    name: 'Falling hand',
    category: 'plucked',
    description:
      'A downward stroke over four octaves, crisp and short, each string echoed on dotted tape heads.',
    preview: NODE_CHAIN,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Falling harp',
      params: { volume: -1, strum: 45, sustain: 1.5, tone: 0.7, pad: 0 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Dotted bounce',
        params: { time: 450, feedback: 0.35, mix: 0.25 },
      },
    ],
  },
  {
    id: 'thirteen-nodes-chord-under-a-finger',
    name: 'Chord under a finger',
    category: 'pad',
    description:
      'The held chord as a dark soft pad with its short plucks almost hidden, a choir of oo far behind.',
    preview: NODE_CHAIN,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Soft organ chord',
      params: { sustain: 1.5, tone: 0.3, pad: 0.8, spread: 0.6 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 2500 } },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'thirteen-nodes-rain-on-the-marks',
    name: 'Rain on the marks',
    category: 'texture',
    description:
      'A random scatter of very short bright strings over four octaves, each caught in small pieces that sag as they fade.',
    preview: NODE_CHAIN,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'String rain',
      params: { strum: 70, sustain: 0.6, tone: 0.75 },
    },
    effects: [
      { deviceId: 'falling', preset: 'Wilting', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'thirteen-nodes-tassels-swaying',
    name: 'Tassels swaying',
    category: 'plucked',
    description:
      'A stroke there and back over one octave, circling the head slowly on a half-mixed drifting tape.',
    preview: NODE_TRIADS,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'One octave ripple',
      params: { strum: 100, sustain: 2.5, tone: 0.45, spread: 0.2 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'around', preset: 'Slow circle' },
    ],
  },
  {
    id: 'thirteen-nodes-ink-stone-and-water',
    name: 'Ink stone and water',
    category: 'plucked',
    description:
      'Muffled strings brushed all but together, sinking under the water and taken up again a fifth lower by the tail.',
    preview: NODE_TRIADS,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Brushed chord',
      params: { volume: 2, sustain: 3, tone: 0.1, pad: 0 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Just under' },
      { deviceId: 'bloom-reverb', preset: 'Falling fifths', params: { decay: 4, mix: 0.3 } },
    ],
  },
  {
    id: 'thirteen-nodes-glass-mark',
    name: 'Glass mark',
    category: 'bell',
    description:
      'A single bright chime to a key, eight seconds long, its octaves climbing back as small loops of glass.',
    preview: TUNING,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Long glass chimes',
      params: { tone: 0.8, spread: 0.6 },
    },
    effects: [{ deviceId: 'cascade', preset: 'Glass rain', params: { mix: 0.35 } }],
  },
  {
    id: 'thirteen-nodes-seven-open-all-heard',
    name: 'Seven open, all heard',
    category: 'plucked',
    description:
      'A three-octave stroke up and down with a little pad under it, its sides pushed wide and its middle kept firm.',
    preview: NODE_CHAIN,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { volume: -9.5, strum: 60, span: 2, sustain: 5, tone: 0.55, pad: 0.35, spread: 0.9 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide top' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.22 } },
    ],
  },

  // Flock: a tone that is only its slide.
  {
    id: 'thirteen-nodes-one-crane-calling',
    name: 'One crane calling',
    category: 'wind',
    description:
      'A single whistle that slides up into each tone over a third of a second and leaves slowly, with a late hall.',
    preview: CRANE_CALL,
    instrument: {
      deviceId: 'flock',
      preset: 'One whistle',
      params: { volume: -11, gather: 0.35, stray: 0.08, flutter: 0.6, leave: 0.8, tone: 0.1 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Late hall', params: { decay: 4, mix: 0.3 } }],
  },
  {
    id: 'thirteen-nodes-three-reeds-from-above',
    name: 'Three reeds from above',
    category: 'pad',
    description:
      'Three reedy voices that come down into each note from above, close together, dulled by distance.',
    preview: NODE_CHAIN,
    instrument: {
      deviceId: 'flock',
      preset: 'Falling in',
      params: { birds: 3, gather: 1.1, stray: 0.1, tone: 0.8, leave: 1.6, width: 0.5 },
    },
    effects: [{ deviceId: 'distance', preset: 'Through fog', params: { distance: 0.6 } }],
  },
  {
    id: 'thirteen-nodes-where-the-slide-goes-on',
    name: 'Where the slide goes on',
    category: 'texture',
    description:
      'Eight wide voices that wander up to their note and hardly settle, with a half-speed octave of it under the mix.',
    preview: CARRIED,
    instrument: {
      deviceId: 'flock',
      preset: 'Wide smear',
      params: { gather: 2, stray: 0.4, octaves: 0.3, leave: 3 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
]
