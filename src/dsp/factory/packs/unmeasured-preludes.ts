import { type FactoryPreset, type Phrase } from '../types'

// Preludes with no bar: a chord is rolled one string at a time, left to ring under one long slur
// and left by its highest or lowest note. Five kinds of plucked and struck string, with a struck
// glow and a struck gate beside them, walked through four lengths of ring and five rooms: the
// closet, the panelled chamber, the stair, the long gallery and the chapel.

// D minor entering one string at a time, the F at the top passing through E to D.
const CLIMBED: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 38, gain: 0.73 },
    { atSec: 0.82, durSec: 6.2, note: 45, gain: 0.56 },
    { atSec: 1.5, durSec: 5.5, note: 53, gain: 0.56 },
    { atSec: 2.02, durSec: 5, note: 57, gain: 0.56 },
    { atSec: 2.44, durSec: 2.6, note: 62, gain: 0.62 },
    { atSec: 3.2, durSec: 1.25, note: 65, gain: 0.7 },
    { atSec: 4.4, durSec: 0.7, note: 64, gain: 0.48 },
    { atSec: 5.08, durSec: 2.1, note: 62, gain: 0.59 },
  ],
}

// C major; then G in the bass under the C and the E still ringing, E falling to D and C to B.
const SUSPENDED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.95, note: 48, gain: 0.64 },
    { atSec: 0.42, durSec: 6.6, note: 55, gain: 0.53 },
    { atSec: 0.74, durSec: 3.7, note: 60, gain: 0.56 },
    { atSec: 1.16, durSec: 2.4, note: 64, gain: 0.64 },
    { atSec: 2, durSec: 5.1, note: 43, gain: 0.7 },
    { atSec: 3.56, durSec: 3.5, note: 62, gain: 0.59 },
    { atSec: 4.42, durSec: 2.7, note: 59, gain: 0.56 },
  ],
}

// A minor built up to E, then seven quick unequal notes down the mode into a D in two octaves.
const RUN_DOWN: Phrase = {
  notes: [
    { atSec: 0, durSec: 4.1, note: 45, gain: 0.7 },
    { atSec: 0.56, durSec: 2.1, note: 52, gain: 0.53 },
    { atSec: 1, durSec: 1.9, note: 57, gain: 0.56 },
    { atSec: 1.34, durSec: 1.64, note: 60, gain: 0.59 },
    { atSec: 1.72, durSec: 1.1, note: 64, gain: 0.7 },
    { atSec: 2.74, durSec: 0.3, note: 62, gain: 0.5 },
    { atSec: 3.02, durSec: 0.2, note: 60, gain: 0.45 },
    { atSec: 3.2, durSec: 0.24, note: 59, gain: 0.5 },
    { atSec: 3.42, durSec: 0.18, note: 57, gain: 0.45 },
    { atSec: 3.58, durSec: 0.22, note: 55, gain: 0.5 },
    { atSec: 3.78, durSec: 0.2, note: 53, gain: 0.48 },
    { atSec: 3.97, durSec: 0.34, note: 52, gain: 0.56 },
    { atSec: 4.32, durSec: 2.9, note: 50, gain: 0.64 },
    { atSec: 4.4, durSec: 2.8, note: 38, gain: 0.7 },
  ],
}

// The last chord, D minor: rolled up quickening, rolled down slowing, its lowest note again alone.
const ROLLED_TWICE: Phrase = {
  notes: [
    { atSec: 0, durSec: 4.2, note: 38, gain: 0.7 },
    { atSec: 0.4, durSec: 3.2, note: 45, gain: 0.53 },
    { atSec: 0.7, durSec: 2.5, note: 53, gain: 0.56 },
    { atSec: 0.92, durSec: 2, note: 57, gain: 0.59 },
    { atSec: 1.1, durSec: 1.6, note: 62, gain: 0.67 },
    { atSec: 2.72, durSec: 2.9, note: 62, gain: 0.56 },
    { atSec: 2.94, durSec: 2.8, note: 57, gain: 0.5 },
    { atSec: 3.22, durSec: 2.7, note: 53, gain: 0.5 },
    { atSec: 3.62, durSec: 2.5, note: 45, gain: 0.5 },
    { atSec: 4.22, durSec: 1.5, note: 38, gain: 0.62 },
    { atSec: 5.74, durSec: 1.5, note: 38, gain: 0.48 },
  ],
}

// A minor, D minor over F, then E: the bass a half step down, the A held over and falling to G sharp.
const HALF_CLOSE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.9, note: 45, gain: 0.67 },
    { atSec: 0.38, durSec: 1.5, note: 52, gain: 0.5 },
    { atSec: 0.68, durSec: 1.6, note: 60, gain: 0.53 },
    { atSec: 1.08, durSec: 1.5, note: 64, gain: 0.62 },
    { atSec: 1.94, durSec: 2, note: 41, gain: 0.7 },
    { atSec: 2.36, durSec: 1.95, note: 57, gain: 0.53 },
    { atSec: 2.64, durSec: 2.1, note: 62, gain: 0.56 },
    { atSec: 3.02, durSec: 2.35, note: 69, gain: 0.64 },
    { atSec: 4, durSec: 3.2, note: 40, gain: 0.73 },
    { atSec: 4.36, durSec: 2.8, note: 59, gain: 0.5 },
    { atSec: 4.76, durSec: 2.4, note: 64, gain: 0.53 },
    { atSec: 5.4, durSec: 1.8, note: 68, gain: 0.56 },
  ],
}

// One D held at the bottom while D minor, C and G are rolled over it, and a bare fifth is left.
const OVER_ONE_BASS: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.1, note: 38, gain: 0.76 },
    { atSec: 0.7, durSec: 1.6, note: 57, gain: 0.5 },
    { atSec: 1, durSec: 1.6, note: 62, gain: 0.53 },
    { atSec: 1.36, durSec: 1.5, note: 65, gain: 0.64 },
    { atSec: 2.3, durSec: 2.3, note: 55, gain: 0.5 },
    { atSec: 2.54, durSec: 1.3, note: 60, gain: 0.5 },
    { atSec: 2.88, durSec: 1.2, note: 64, gain: 0.59 },
    { atSec: 3.8, durSec: 1.4, note: 59, gain: 0.53 },
    { atSec: 4.12, durSec: 3, note: 62, gain: 0.59 },
    { atSec: 5.14, durSec: 2, note: 38, gain: 0.64 },
    { atSec: 5.66, durSec: 1.5, note: 57, gain: 0.5 },
  ],
}

// Five strings tried in fifths from C, as a prelude tries its tuning; a D beside the top one, then it again.
const TRYING_STRINGS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 36, gain: 0.7 },
    { atSec: 1.06, durSec: 6, note: 43, gain: 0.59 },
    { atSec: 1.96, durSec: 5.1, note: 50, gain: 0.59 },
    { atSec: 2.7, durSec: 4.4, note: 57, gain: 0.59 },
    { atSec: 3.32, durSec: 2.34, note: 64, gain: 0.64 },
    { atSec: 4.5, durSec: 2.7, note: 62, gain: 0.48 },
    { atSec: 5.7, durSec: 1.5, note: 64, gain: 0.53 },
  ],
}

// D minor seventh, G seventh, C: the C and then the F are kept ringing into the next chord and step down.
const SEVENTHS_KEPT: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.15, note: 50, gain: 0.67 },
    { atSec: 0.44, durSec: 2.3, note: 57, gain: 0.5 },
    { atSec: 0.78, durSec: 2.5, note: 60, gain: 0.53 },
    { atSec: 1.2, durSec: 4.4, note: 65, gain: 0.67 },
    { atSec: 2.2, durSec: 2.3, note: 43, gain: 0.7 },
    { atSec: 2.74, durSec: 4.3, note: 55, gain: 0.5 },
    { atSec: 3.28, durSec: 1.9, note: 59, gain: 0.56 },
    { atSec: 4.54, durSec: 2.6, note: 36, gain: 0.7 },
    { atSec: 5.16, durSec: 2, note: 60, gain: 0.53 },
    { atSec: 5.6, durSec: 1.6, note: 64, gain: 0.59 },
  ],
}

// G rolled with C over it, C and B shaken slowly and then quicker, and C major for an answer.
const SHAKEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 4.7, note: 43, gain: 0.7 },
    { atSec: 0.46, durSec: 6.7, note: 55, gain: 0.5 },
    { atSec: 0.84, durSec: 3.8, note: 62, gain: 0.53 },
    { atSec: 1.5, durSec: 0.62, note: 60, gain: 0.7 },
    { atSec: 2.1, durSec: 0.46, note: 59, gain: 0.48 },
    { atSec: 2.54, durSec: 0.34, note: 60, gain: 0.56 },
    { atSec: 2.86, durSec: 0.26, note: 59, gain: 0.45 },
    { atSec: 3.1, durSec: 0.2, note: 60, gain: 0.53 },
    { atSec: 3.28, durSec: 0.17, note: 59, gain: 0.42 },
    { atSec: 3.44, durSec: 0.15, note: 60, gain: 0.5 },
    { atSec: 3.58, durSec: 1.6, note: 59, gain: 0.53 },
    { atSec: 4.74, durSec: 2.4, note: 48, gain: 0.67 },
    { atSec: 5.2, durSec: 2, note: 60, gain: 0.53 },
    { atSec: 5.56, durSec: 1.6, note: 64, gain: 0.59 },
  ],
}

// The bass goes A, G, F, E; an E kept over the F falls to D, and the D goes back up to E.
const BASS_DOWN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.95, note: 45, gain: 0.7 },
    { atSec: 0.48, durSec: 1.9, note: 57, gain: 0.5 },
    { atSec: 0.8, durSec: 1.65, note: 60, gain: 0.53 },
    { atSec: 1.2, durSec: 3, note: 64, gain: 0.7 },
    { atSec: 2, durSec: 1.45, note: 43, gain: 0.64 },
    { atSec: 2.5, durSec: 1.1, note: 59, gain: 0.5 },
    { atSec: 3.5, durSec: 1.6, note: 41, gain: 0.67 },
    { atSec: 3.84, durSec: 1.5, note: 57, gain: 0.48 },
    { atSec: 4.26, durSec: 1.7, note: 62, gain: 0.59 },
    { atSec: 5.14, durSec: 2.1, note: 40, gain: 0.64 },
    { atSec: 5.48, durSec: 1.7, note: 59, gain: 0.48 },
    { atSec: 5.98, durSec: 1.25, note: 64, gain: 0.5 },
  ],
}

// Neighbours of the scale on separate strings, none of them stopped, over A and E.
const STEPS_LEFT_RINGING: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 45, gain: 0.7 },
    { atSec: 0.62, durSec: 6.4, note: 52, gain: 0.5 },
    { atSec: 1.3, durSec: 5.6, note: 60, gain: 0.56 },
    { atSec: 1.68, durSec: 5.2, note: 59, gain: 0.48 },
    { atSec: 2.24, durSec: 2, note: 64, gain: 0.62 },
    { atSec: 2.58, durSec: 4.4, note: 62, gain: 0.5 },
    { atSec: 3.22, durSec: 3.8, note: 67, gain: 0.67 },
    { atSec: 4.3, durSec: 2.8, note: 64, gain: 0.5 },
    { atSec: 5.5, durSec: 1.7, note: 57, gain: 0.56 },
  ],
}

// Five notes, E F A B C: they open upward, fall quickening to E, and leave a low E and its fifth.
const FIVE_NOTE_FALL: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.9, note: 52, gain: 0.64 },
    { atSec: 0.5, durSec: 3.25, note: 64, gain: 0.56 },
    { atSec: 1.16, durSec: 1.6, note: 71, gain: 0.56 },
    { atSec: 1.92, durSec: 0.9, note: 76, gain: 0.7 },
    { atSec: 2.54, durSec: 0.6, note: 72, gain: 0.53 },
    { atSec: 2.98, durSec: 0.5, note: 71, gain: 0.5 },
    { atSec: 3.32, durSec: 0.4, note: 69, gain: 0.5 },
    { atSec: 3.58, durSec: 0.4, note: 65, gain: 0.5 },
    { atSec: 3.8, durSec: 3, note: 64, gain: 0.56 },
    { atSec: 4.5, durSec: 2.7, note: 52, gain: 0.64 },
    { atSec: 5.6, durSec: 1.6, note: 59, gain: 0.48 },
  ],
}

// The bass of a prelude by itself: A, G, F, E by step, a leap to the E above and a quick run back to A.
const BASS_ALONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 45, gain: 0.7 },
    { atSec: 1.84, durSec: 1.14, note: 43, gain: 0.59 },
    { atSec: 3, durSec: 0.56, note: 41, gain: 0.64 },
    { atSec: 3.6, durSec: 1.1, note: 40, gain: 0.73 },
    { atSec: 4.74, durSec: 0.44, note: 52, gain: 0.59 },
    { atSec: 5.2, durSec: 0.26, note: 50, gain: 0.5 },
    { atSec: 5.48, durSec: 0.2, note: 48, gain: 0.5 },
    { atSec: 5.7, durSec: 0.3, note: 47, gain: 0.53 },
    { atSec: 6.04, durSec: 1.3, note: 45, gain: 0.67 },
  ],
}

// High strings: A minor left by its top E through F and back, and an F put under what still rings.
const TOP_LEFT_LAST: Phrase = {
  notes: [
    { atSec: 0, durSec: 4.4, note: 57, gain: 0.62 },
    { atSec: 0.64, durSec: 4.4, note: 64, gain: 0.53 },
    { atSec: 1.14, durSec: 5.8, note: 69, gain: 0.53 },
    { atSec: 1.52, durSec: 5.4, note: 72, gain: 0.56 },
    { atSec: 2.06, durSec: 1.4, note: 76, gain: 0.67 },
    { atSec: 3.36, durSec: 0.56, note: 77, gain: 0.5 },
    { atSec: 3.88, durSec: 3.2, note: 76, gain: 0.56 },
    { atSec: 4.92, durSec: 2.2, note: 53, gain: 0.62 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'unmeasured-preludes-under-one-slur',
    name: 'Under one slur',
    category: 'plucked',
    description:
      'A finger-plucked box of strings that all go on ringing, in a warm hall of three seconds.',
    preview: CLIMBED,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: {
        exciter: 0,
        chord: 0,
        decay: 10,
        release: 14,
        brightness: 0.42,
        position: 0.3,
        courses: 0.15,
        sympathy: 0.35,
        body: 0,
      },
    },
    effects: [
      { deviceId: 'hall-reverb', params: { lowDecay: 3.6, midDecay: 3, damping: 4200, mix: 0.32 } },
    ],
  },
  {
    id: 'unmeasured-preludes-quill-on-thin-wire',
    name: 'Quill on thin wire',
    category: 'plucked',
    description:
      'Single wires picked close to the bridge and kept short, sounding from inside a small wooden body.',
    preview: SHAKEN,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: {
        volume: -1,
        decay: 2.2,
        release: 0.7,
        brightness: 0.92,
        position: 0.07,
        courses: 0,
        sympathy: 0.05,
        body: 1,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 5, size: 0.7, material: 0.3, opening: 0.5, air: 0, mix: 0.45 },
      },
      { deviceId: 'spread', preset: 'Tight shimmer' },
    ],
  },
  {
    id: 'unmeasured-preludes-gloved-hammers',
    name: 'Gloved hammers',
    category: 'string',
    description:
      'Strings hammered softly at their middle, every edge rubbed off into a low diffuse cloud.',
    preview: CLIMBED,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { decay: 9, release: 9, brightness: 0.14, position: 0.5, sympathy: 0.2, body: 2 },
    },
    effects: [
      {
        deviceId: 'fog',
        preset: 'Dark bank',
        params: { size: 260, soften: 0.6, damp: 0.55, mix: 0.8 },
      },
      { deviceId: 'ambient-eq', params: { low: 2, presence: -3, highCut: 5200 } },
    ],
  },
  {
    id: 'unmeasured-preludes-palm-laid-across',
    name: 'Palm laid across',
    category: 'plucked',
    description:
      'Picked strings over a koto body, stopped almost at once by the palm and dripping into two springs.',
    preview: FIVE_NOTE_FALL,
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: {
        volume: -1.5,
        chord: 0,
        strum: 0,
        decay: 1.2,
        release: 0.15,
        brightness: 0.6,
        position: 0.14,
        body: 3,
      },
    },
    effects: [
      {
        deviceId: 'spring-reverb',
        params: { decay: 1.8, tension: 0.6, tone: 2800, drip: 0.5, drive: 0.1, mix: 0.34 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-octave-courses-loosed',
    name: 'Octave courses loosed',
    category: 'plucked',
    description:
      'Each note picked with its octave on doubled wires, thickened by copies out of tune and slowly panned.',
    preview: SEVENTHS_KEPT,
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: {
        volume: -4,
        strum: 65,
        decay: 13,
        release: 10,
        brightness: 0.5,
        courses: 1,
        sympathy: 0.4,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider', params: { detune: 18, mix: 0.6 } },
      { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { highCut: 6000 } },
    ],
  },
  {
    id: 'unmeasured-preludes-whole-notes-only',
    name: 'Whole notes only',
    category: 'drone',
    description:
      'Dark finger-plucked strings of twenty seconds, set back in an enormous space with no highs left.',
    preview: TRYING_STRINGS,
    instrument: {
      deviceId: 'zither',
      preset: 'Slow falling sus',
      params: {
        volume: -14,
        chord: 0,
        strum: 0,
        decay: 20,
        release: 20,
        brightness: 0.06,
        position: 0.5,
        courses: 0,
        sympathy: 0.6,
      },
    },
    effects: [
      {
        deviceId: 'expanse',
        preset: 'Low cathedral',
        params: { size: 0.8, decay: 14, highCut: 2400, mix: 0.48 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-paper-thin-wire',
    name: 'Paper-thin wire',
    category: 'plucked',
    description:
      'Hard picked wire with all the low end cut away, flashing off a small bright plate.',
    preview: FIVE_NOTE_FALL,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: {
        volume: -1,
        decay: 4.5,
        release: 2,
        brightness: 1,
        position: 0.05,
        sympathy: 0.1,
        body: 1,
      },
    },
    effects: [
      {
        deviceId: 'ambient-eq',
        preset: 'Thin',
        params: { lowCut: 260, low: -6, body: -5, presence: 3, highCut: 16000 },
      },
      {
        deviceId: 'plate-reverb',
        preset: 'Bright plate',
        params: { decay: 0.45, damping: 0.05, mix: 0.3 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-trembled-and-held',
    name: 'Trembled and held',
    category: 'string',
    description:
      'Soft hammers repeated seven times a second on ringing strings, the whole chord slowly circling.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'zither',
      preset: 'Minor tremolo',
      params: {
        volume: -10,
        chord: 0,
        strum: 0,
        roll: 7,
        decay: 8,
        release: 5,
        brightness: 0.3,
        position: 0.3,
        courses: 0.3,
        sympathy: 0.4,
      },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.12, radius: 0.7 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'unmeasured-preludes-second-neck-below',
    name: 'Second neck below',
    category: 'bass',
    description:
      'Finger-plucked zither strings with an octave added under each note and the top rolled away, kept close.',
    preview: BASS_ALONE,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { decay: 7, release: 6, brightness: 0.35, position: 0.35, body: 1 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0.75, up1: 0, dry: 0.9, filter: 1600, spread: 0.1 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
      { deviceId: 'ambient-eq', params: { low: 1, air: -5, highCut: 6000 } },
    ],
  },
  {
    id: 'unmeasured-preludes-every-string-answers',
    name: 'Every string answers',
    category: 'plucked',
    description:
      'Short plucks that start a bank of strings tuned in A minor, which rings on for seven seconds.',
    preview: STEPS_LEFT_RINGING,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: {
        volume: -4.5,
        exciter: 0,
        decay: 1.6,
        release: 0.8,
        brightness: 0.45,
        position: 0.2,
        sympathy: 0,
        body: 0,
      },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Long ring',
        params: { root: 9, mode: 1, sympathy: 0.8, strings: 10, decay: 7, mix: 0.62, width: 0.8 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-foxed-at-the-edges',
    name: 'Foxed at the edges',
    category: 'plucked',
    description:
      'A plain zither, single strings, through a worn medium: narrowed, a little driven, wavering and dusty.',
    preview: HALF_CLOSE,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: {
        exciter: 0,
        chord: 0,
        decay: 5,
        release: 2.5,
        brightness: 0.55,
        courses: 0.2,
        sympathy: 0.2,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Dusty record',
        params: { wobble: 0.4, wear: 0.5, noise: 0.2, tone: 0.35 },
      },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'unmeasured-preludes-bell-in-the-lid',
    name: 'Bell in the lid',
    category: 'bell',
    description:
      'Picked strings split around the D below middle C by a soft ring modulator, half string and half bell, in a medium plate.',
    preview: OVER_ONE_BASS,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: {
        volume: -5.5,
        exciter: 1,
        decay: 8,
        release: 6,
        brightness: 0.5,
        position: 0.4,
        sympathy: 0.3,
        body: 1,
      },
    },
    effects: [
      {
        deviceId: 'ring',
        preset: 'Dark bell',
        params: { root: 2, octave: 3, drift: 0.15, tone: 3800, mix: 0.45 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'unmeasured-preludes-drawn-not-struck',
    name: 'Drawn, not struck',
    category: 'pad',
    description:
      'Doubled wires whose attack is taken off, so each string swells in over almost a second and joins the rest.',
    preview: TRYING_STRINGS,
    instrument: {
      deviceId: 'zither',
      preset: 'Minor glass haze',
      params: {
        volume: -1.5,
        chord: 0,
        strum: 0,
        decay: 18,
        release: 16,
        brightness: 0.6,
        courses: 0.8,
        sympathy: 0.8,
        position: 0.4,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 900, sensitivity: -50 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { midDecay: 5, mix: 0.4 } },
    ],
  },
  {
    id: 'unmeasured-preludes-chord-before-the-hand',
    name: 'Chord before the hand',
    category: 'texture',
    description:
      'Finger-plucked strings under a reverb that runs backwards, rising for two seconds into a cut after each roll.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'zither',
      preset: 'Harp glissando',
      params: {
        volume: -6,
        chord: 0,
        strum: 0,
        direction: 0,
        decay: 6,
        release: 4,
        brightness: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        preset: 'Reverse',
        params: { time: 2.1, tail: 0.35, colour: 0.1, mix: 0.55 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'unmeasured-preludes-roll-blown-off-the-desk',
    name: 'Roll blown off the desk',
    category: 'plucked',
    description:
      'Finger-plucked single strings thrown into twelve dark echoes over six seconds that never fall in time.',
    preview: ROLLED_TWICE,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: {
        volume: -4.5,
        exciter: 0,
        decay: 2.6,
        release: 1,
        brightness: 0.4,
        position: 0.16,
        body: 1,
      },
    },
    effects: [
      {
        deviceId: 'constellation',
        preset: 'Dark field',
        params: { span: 6000, stars: 12, pattern: 2, shuffle: 5, again: 0.2, tone: 2600, mix: 0.5 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-pegs-let-go',
    name: 'Pegs let go',
    category: 'plucked',
    description:
      'Ringing wires, their picking softened, whose long tail slowly sags in pitch and darkens, as when a peg slips.',
    preview: CLIMBED,
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { chord: 0, decay: 14, release: 14, brightness: 0.45, courses: 0.5 },
    },
    effects: [
      {
        deviceId: 'melt',
        preset: 'Soft sag',
        params: { sag: -16, hold: 7, solid: 260, dim: 0.6, drip: 0, mix: 0.5 },
      },
      { deviceId: 'sift', preset: 'Soft hammers' },
    ],
  },
  {
    id: 'unmeasured-preludes-heard-from-the-stairs',
    name: 'Heard from the stairs',
    category: 'plucked',
    description:
      'A doubled zither placed far off: dark, narrow and late, with two seconds of stairwell around it.',
    preview: HALF_CLOSE,
    instrument: {
      deviceId: 'zither',
      preset: 'Chord zither minor',
      params: { volume: -0.5, chord: 0, decay: 6, release: 3, brightness: 0.6, courses: 0.4 },
    },
    effects: [
      {
        deviceId: 'distance',
        preset: 'Stone stairwell',
        params: { distance: 0.72, room: 0.75, wander: 0.05, decay: 2.2, level: 0.9 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-strings-of-a-door',
    name: 'Strings of a door',
    category: 'string',
    description:
      'Single hammered strings sounding from a body far too large for them, broad and deep, in a small room.',
    preview: OVER_ONE_BASS,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: {
        volume: -7,
        decay: 7,
        release: 5,
        brightness: 0.55,
        position: 0.25,
        body: 2,
        courses: 0.2,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'Giant', params: { size: 0.8, wander: 0.1, width: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 1.4, breathDepth: 0, mix: 0.25 } },
    ],
  },
  {
    id: 'unmeasured-preludes-pitch-without-the-pluck',
    name: 'Pitch without the pluck',
    category: 'pad',
    description:
      'Only the steady tones of a hammered zither: its strikes sifted out and what is left held and blurred.',
    preview: STEPS_LEFT_RINGING,
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: { volume: -11, chord: 0, decay: 15, release: 12, brightness: 0.35, sympathy: 0.7 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Tones only', params: { attacks: -30, air: -18, hold: 0.8 } },
      {
        deviceId: 'sine-shadow',
        preset: 'Long linger',
        params: { partials: 12, release: 6, mix: 0.35 },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'unmeasured-preludes-bars-instead-of-gut',
    name: 'Bars instead of gut',
    category: 'bell',
    description:
      'Hammered strings with their partials pulled apart until they chime like bars, a faint dust of sparks above.',
    preview: TOP_LEFT_LAST,
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: {
        volume: -5.5,
        chord: 0,
        roll: 0,
        decay: 6,
        release: 4,
        brightness: 0.45,
        position: 0.2,
        courses: 0.1,
        sympathy: 0.2,
      },
    },
    effects: [
      { deviceId: 'warp', preset: 'Glass bar', params: { stretch: 0.45, drift: 0.05, mix: 0.75 } },
      { deviceId: 'glints', preset: 'Faint dust', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'unmeasured-preludes-ribbon-through-the-wires',
    name: 'Ribbon through the wires',
    category: 'keys',
    description:
      'Every string muffled with felt, long in its ring and lightly struck, in a hall whose lows hang on.',
    preview: CLIMBED,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt mute',
      params: {
        volume: 0.5,
        amount: 0.75,
        hammer: 0.18,
        decay: 3.4,
        thud: 0.05,
        tone: 0.5,
        rattle: 0,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } }],
  },
  {
    id: 'unmeasured-preludes-bolt-beneath-the-slur',
    name: 'Bolt beneath the slur',
    category: 'bell',
    description: 'Bolts in every string, each note a slow gong, summed into a long dark plate.',
    preview: OVER_ONE_BASS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Temple gongs',
      params: { volume: -1.5, amount: 0.95, hammer: 0.3, decay: 4, tone: 0.45, detune: 0.4 },
    },
    effects: [
      {
        deviceId: 'plate-reverb',
        preset: 'Dark plate',
        params: { decay: 0.85, damping: 0.6, mix: 0.4 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-dry-as-blotting-sand',
    name: 'Dry as blotting sand',
    category: 'keys',
    description:
      'Rubber between the strings, short and woody, knocked against a broad wooden board.',
    preview: SHAKEN,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rubber thunks',
      params: { volume: 6, decay: 0.45, hammer: 0.5, thud: 0.35, tone: 0.8 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Wooden body',
        params: { body: 5, size: 1.4, material: 0.25, mix: 0.6 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-buff-stop-and-paper',
    name: 'Buff stop and paper',
    category: 'keys',
    description:
      'Paper laid on the strings so that they buzz, opened wide above and left without a room.',
    preview: RUN_DOWN,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper buzz',
      params: { volume: -3.5, amount: 0.9, rattle: 0.8, hammer: 0.45, tone: 0.95, decay: 1.4 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide top', params: { mid: 1.4, high: 2 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'unmeasured-preludes-candle-under-the-lid',
    name: 'Candle under the lid',
    category: 'keys',
    description:
      'An object of its own in every string, the top closed down, in a hall of four seconds.',
    preview: HALF_CLOSE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Dark orchestra',
      params: { volume: -1, amount: 0.75, tone: 0.28, decay: 2.4, rattle: 0.25, hammer: 0.25 },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 4.2, damping: 0.6, breathDepth: 0, mix: 0.35 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-unisons-left-apart',
    name: 'Unisons left apart',
    category: 'keys',
    description:
      'A plain piano whose three strings a note disagree, stirred slowly by a deep ensemble.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Loose unisons',
      params: { volume: 2.5, amount: 0, rattle: 0, detune: 1, hammer: 0.35, decay: 2.2, thud: 0.1 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { rate: 0.35, depth: 40, mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Faint air', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'unmeasured-preludes-jacks-of-tin',
    name: 'Jacks of tin',
    category: 'bell',
    description:
      'Light bolts struck hard beside the bridge: thin tin notes jangling through a tight long spring.',
    preview: FIVE_NOTE_FALL,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Tin chimes',
      params: { volume: 1, position: 0.06, hammer: 0.95, decay: 0.9, rattle: 0.5 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Tight long tank', params: { mix: 0.36 } },
      { deviceId: 'ambient-eq', params: { lowCut: 180, body: -3 } },
    ],
  },
  {
    id: 'unmeasured-preludes-bolts-among-the-bowls',
    name: 'Bolts among the bowls',
    category: 'bell',
    description:
      'Soft bolts that set off a table of metal bowls tuned in fifths on D, ringing long after them.',
    preview: CLIMBED,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Bolt gongs',
      params: { volume: 0, amount: 0.6, hammer: 0.2, decay: 2, tone: 0.55, rattle: 0.1 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Low fifths',
        params: { root: 2, scale: 4, ring: 16, strike: 0.4, mix: 0.5 },
      },
      { deviceId: 'ambient-limiter', preset: 'Margin' },
    ],
  },
  {
    id: 'unmeasured-preludes-what-the-felt-lets-by',
    name: 'What the felt lets by',
    category: 'keys',
    description:
      'Felted strings so soft that the quiet end is raised to meet them: tails, hush and wooden noises.',
    preview: STEPS_LEFT_RINGING,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt whisper',
      params: { volume: -3.5, amount: 0.85, hammer: 0.08, decay: 2.8, thud: 0.35 },
    },
    effects: [
      {
        deviceId: 'lift',
        preset: 'Long tails',
        params: { threshold: -26, amount: 0.9, rise: 0.4 },
      },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.24 } },
    ],
  },
  {
    id: 'unmeasured-preludes-stopped-and-repeated',
    name: 'Stopped and repeated',
    category: 'keys',
    description:
      'Rubber-stopped strings answered by dim bucket-brigade repeats that lean to either side.',
    preview: ROLLED_TWICE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Soft rubber',
      params: { volume: 6, amount: 0.75, hammer: 0.5, decay: 0.7, thud: 0.2 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 610, feedback: 0.5, tone: 1800, mix: 0.45 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-leaf-against-the-wire',
    name: 'Leaf against the wire',
    category: 'keys',
    description:
      'Buzzing paper strings under a filter that each touch pushes open and the ring lets close.',
    preview: BASS_DOWN,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper sizzle',
      params: { volume: -3.5, amount: 0.8, rattle: 0.6, hammer: 0.5, decay: 2.4 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 380,
          resonance: 1.1,
          envAmount: 55,
          envAttackMs: 6,
          envReleaseMs: 900,
        },
      },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { breathDepth: 0, mix: 0.25 } },
    ],
  },
  {
    id: 'unmeasured-preludes-prelude-half-recalled',
    name: 'Prelude half recalled',
    category: 'texture',
    description:
      'Mixed objects in the strings, with pieces of the last eight seconds drifting back under what is played.',
    preview: ROLLED_TWICE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Small orchestra',
      params: { volume: 2, amount: 0.5, hammer: 0.4, decay: 1.6, tone: 0.6 },
    },
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Hazy past',
        params: { memory: 0.85, echo: 0.3, reach: 8, size: 2.2, mix: 0.5 },
      },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'unmeasured-preludes-gongs-without-a-blow',
    name: 'Gongs without a blow',
    category: 'pad',
    description:
      'Bolted strings with their strike faded in over a second and left in a huge modulated space.',
    preview: TRYING_STRINGS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Temple gongs',
      params: { volume: 6, amount: 0.8, hammer: 0.5, decay: 4, position: 0.4, tone: 0.6 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 1100, sensitivity: -52 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 9, mix: 0.45 } },
    ],
  },
  {
    id: 'unmeasured-preludes-soundboard-near-the-fire',
    name: 'Soundboard near the fire',
    category: 'keys',
    description:
      'A nearly bare piano, a trace of objects in its strings, leaned into a warm valve and a combo loudspeaker.',
    preview: HALF_CLOSE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Plain piano',
      params: { volume: -3.5, amount: 0.15, hammer: 0.6, thud: 0.5, decay: 1.3, tone: 0.7 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Triode glow',
        params: { drive: 0.45, tone: -0.2, mix: 0.7 },
      },
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { drive: 0.2, room: 0.5, mix: 0.75 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-sixteen-foot-and-four',
    name: 'Sixteen foot and four',
    category: 'keys',
    description:
      'Plain strings doubled an octave under and an octave over, as with two sets of jacks coupled.',
    preview: FIVE_NOTE_FALL,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Plain piano',
      params: { amount: 0, hammer: 0.8, position: 0.1, decay: 1.8, thud: 0.1, tone: 0.9 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0.55, up1: 0.7, up2: 0, dry: 0.8, spread: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'unmeasured-preludes-lid-down-on-a-chord',
    name: 'Lid down on a chord',
    category: 'keys',
    description:
      'A plain piano heard through a closed lid: thuds, low strings and very little above them, pushed into tape.',
    preview: SEVENTHS_KEPT,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Plain piano',
      params: { amount: 0.1, hammer: 0.3, thud: 1, tone: 0.1, decay: 2.6, width: 0.2 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { low: 2, highCut: 1800 } },
      { deviceId: 'tape', preset: 'Warm thump', params: { hiss: 0, output: 0 } },
    ],
  },
  {
    id: 'unmeasured-preludes-overtones-at-the-window',
    name: 'Overtones at the window',
    category: 'keys',
    description:
      'Felt-muted strings with their quietest overtones turned up, clear and wide above dull fundamentals.',
    preview: TOP_LEFT_LAST,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt mute',
      params: { volume: 1.5, amount: 0.5, hammer: 0.45, decay: 3, tone: 1, width: 1 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones', params: { amount: 0.85, focus: 0.5, range: 24 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'unmeasured-preludes-knuckle-and-wire',
    name: 'Knuckle and wire',
    category: 'keys',
    description:
      'Wood-hard knocks with barely a note, behind them a bank of strings tuned in D minor that sings the chord.',
    preview: OVER_ONE_BASS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Wood blocks',
      params: { volume: 6, amount: 0.7, decay: 0.5, hammer: 0.8, thud: 0.4 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { root: 2, mode: 1, sympathy: 0.9, strings: 12, decay: 5, mix: 0.6 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-down-in-the-rain-barrel',
    name: 'Down in the rain barrel',
    category: 'texture',
    description:
      'Paper and wire heard from under shallow water, wavering, with bubbles coming off each strike.',
    preview: CLIMBED,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper buzz',
      params: { volume: -3.5, amount: 0.5, rattle: 0.4, decay: 2, tone: 0.8 },
    },
    effects: [
      {
        deviceId: 'underwater',
        preset: 'Sunlit shallows',
        params: { depth: 0.4, bubbles: 0.5, mix: 0.9 },
      },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'unmeasured-preludes-notches-slowly-turning',
    name: 'Notches slowly turning',
    category: 'keys',
    description:
      'Bolts at the middle of the string, swept by twelve phaser stages that take eight seconds over each turn.',
    preview: OVER_ONE_BASS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Light bolts',
      params: { volume: 0.5, amount: 0.4, hammer: 0.35, decay: 2.6, tone: 0.8, rattle: 0 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Glacial sweep',
        params: { stages: 4, rate: 0.12, feedback: 55, depth: 80, mix: 0.6 },
      },
      { deviceId: 'fog', preset: 'Thin veil', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'unmeasured-preludes-frets-of-tied-gut',
    name: 'Frets of tied gut',
    category: 'plucked',
    description:
      'A nylon guitar played with the flesh of the thumb at the neck, dull and long in the ring, in a small room.',
    preview: CLIMBED,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: {
        volume: -6.5,
        nail: 0,
        position: 0.4,
        sustain: 10,
        release: 7,
        tone: 0.22,
        strum: 0,
        shimmer: 0,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { body: 4, presence: -5, highCut: 3600 } },
      {
        deviceId: 'ether-reverb',
        preset: 'Room',
        params: { size: 0.35, decay: 1.4, damping: 0.7, mix: 0.36 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-little-finger-planted',
    name: 'Little finger planted',
    category: 'plucked',
    description:
      'Nylon strings plucked close to the bridge and stopped soon after, over a small soundboard and held level by a limiter.',
    preview: RUN_DOWN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: { volume: 1, sustain: 4.5, release: 1, tone: 0.7, nail: 0.4, body: 0.3 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Hint of wood',
        params: { body: 5, size: 0.6, material: 0.4, mix: 0.5 },
      },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 7 } },
    ],
  },
  {
    id: 'unmeasured-preludes-slur-across-six-strings',
    name: 'Slur across six strings',
    category: 'plucked',
    description:
      'Steel strings that no finger stops, run together on a long plate, their partials glinting by turns.',
    preview: STEPS_LEFT_RINGING,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { volume: 0, sustain: 12, release: 10, tone: 0.55, nail: 0.35, body: 0.7 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { decay: 0.8, mix: 0.36 } },
      { deviceId: 'glimmer', preset: 'Light on water', params: { depth: 0.85, rate: 1.4 } },
    ],
  },
  {
    id: 'unmeasured-preludes-courses-thrown-wide',
    name: 'Courses thrown wide',
    category: 'plucked',
    description:
      'Twelve strings struck hard near the bridge, the bass kept in the middle and the octaves thrown wide.',
    preview: RUN_DOWN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve chime',
      params: { volume: -3, sustain: 7, release: 4, shimmer: 0.3, nail: 0.85 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide top', params: { high: 2, make: 0.9 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'unmeasured-preludes-walnut-shutters-closed',
    name: 'Walnut shutters closed',
    category: 'plucked',
    description:
      'Dark steel strings plucked over the fingerboard, each edge softened into a low bank of fog.',
    preview: BASS_DOWN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: { volume: 0.5, tone: 0.05, sustain: 8, release: 5, nail: 0 },
    },
    effects: [
      {
        deviceId: 'fog',
        preset: 'Morning mist',
        params: { size: 180, soften: 0.5, damp: 0.5, mix: 0.75 },
      },
      { deviceId: 'ambient-eq', params: { low: -2, highCut: 3200 } },
    ],
  },
  {
    id: 'unmeasured-preludes-frost-on-the-treble',
    name: 'Frost on the treble',
    category: 'plucked',
    description: 'Glassy picked steel under a faint reverb that climbs an octave with every pass.',
    preview: TOP_LEFT_LAST,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Glass pick',
      params: { volume: -4, body: 0.15, sustain: 9, release: 7 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Faint glimmer',
        params: { shimmer: 0.35, decay: 6, mix: 0.34 },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 140, body: -3 } },
    ],
  },
  {
    id: 'unmeasured-preludes-ink-still-wet',
    name: 'Ink still wet',
    category: 'pad',
    description:
      'Plucked nylon stopped at once, smeared into a long clean haze in which the chord stays.',
    preview: STEPS_LEFT_RINGING,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon pizzicato',
      params: { volume: 3.5, sustain: 1, release: 0.4, tone: 0.5 },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Clean sustain',
        params: { blur: 0.75, smear: 0.5, highCut: 5000, mix: 0.65 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-bass-off-the-neck',
    name: 'Bass off the neck',
    category: 'plucked',
    description:
      'Bare steel with no body, a bank of unplayed strings tuned in D minor sounding on behind the run.',
    preview: RUN_DOWN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bare string',
      params: { sustain: 3, release: 1.2, tone: 0.65 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Sitar drone',
        params: { root: 2, mode: 1, sympathy: 0.65, strings: 6, decay: 4, mix: 0.45 },
      },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'unmeasured-preludes-slow-backs-of-fingers',
    name: 'Slow backs of fingers',
    category: 'plucked',
    description:
      'Steel strings brushed loosely, answered by one worn tape repeat after another, each duller.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Lazy strum',
      params: { volume: -2.5, sustain: 5, release: 2, nail: 0.15, tone: 0.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Worn tape',
        params: { time: 820, feedback: 0.42, highCut: 2400, mix: 0.36 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-paired-strings-adrift',
    name: 'Paired strings adrift',
    category: 'plucked',
    description:
      'Twelve strings a little apart in pitch, each band swelling and drifting sideways on its own.',
    preview: TRYING_STRINGS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve drift',
      params: { volume: -1, sustain: 12, release: 10, tone: 0.4 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Slow water', params: { depth: 0.7, sway: 0.8, rate: 0.18 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { breathDepth: 0, mix: 0.25 } },
    ],
  },
  {
    id: 'unmeasured-preludes-long-neck-under',
    name: 'Long neck under',
    category: 'bass',
    description: 'Nylon strings with the octave below as loud as the note itself, close and round.',
    preview: BASS_ALONE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { volume: -4, type: 1, sustain: 7, release: 3, tone: 0.35 },
    },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'Deep',
        params: { sub1: 0.9, sub2: 0, up1: 0, dry: 0.7, filter: 1200 },
      },
      { deviceId: 'fet-limiter', preset: 'Light touch', params: { inputGain: 4, outputGain: -4 } },
    ],
  },
  {
    id: 'unmeasured-preludes-copied-by-lamplight',
    name: 'Copied by lamplight',
    category: 'plucked',
    description:
      'Steel fingerstyle on slow worn tape: wow, dropouts, dulled highs and a thin hiss.',
    preview: HALF_CLOSE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { volume: -2.5, sustain: 5, release: 2, position: 0.25 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { age: 0.6, wow: 0.45, hiss: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'unmeasured-preludes-small-box-on-a-sill',
    name: 'Small box on a sill',
    category: 'plucked',
    description:
      'A nylon guitar out of one small loudspeaker, the microphone turned away across the room.',
    preview: ROLLED_TWICE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: { volume: -1, sustain: 6, release: 3, strum: 0 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Bedside radio',
        params: { speaker: 0, drive: 0.3, distance: 0.6, room: 0.6, angle: 0.5 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-read-from-the-last-page',
    name: 'Read from the last page',
    category: 'texture',
    description:
      'Steel strings with the last second and a half played backwards beneath them, swelling on both sides.',
    preview: CLIMBED,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bridge harp',
      params: { volume: 1.5, sustain: 6, release: 3, tone: 0.6, strum: 0 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Slow swells',
        params: { time: 1500, feedback: 0.3, tone: 3600, spread: 0.9, mix: 0.55 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-viols-behind-the-lute',
    name: 'Viols behind the lute',
    category: 'pad',
    description:
      'A soft nylon roll whose chord comes up behind it as slow strings and goes when it goes.',
    preview: BASS_DOWN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { volume: 2, sustain: 5, release: 3, tone: 0.6, nail: 0.35 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Low section',
        params: { rise: 1.2, fall: 5, octaves: -0.2, brightness: 1800, mix: 0.55 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-low-strings-first',
    name: 'Low strings first',
    category: 'plucked',
    description:
      'Twelve strings delayed colour by colour, so a rolled chord opens once more from its bass to its top.',
    preview: OVER_ONE_BASS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { volume: 2.5, sustain: 5, release: 2.5, tone: 0.5 },
    },
    effects: [
      {
        deviceId: 'prism',
        preset: 'Slow unfolding',
        params: { time: 1600, shape: 0, feedback: 0.25, mix: 0.5 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-nave-with-one-lute',
    name: 'Nave with one lute',
    category: 'plucked',
    description:
      'Nylon strings in a hall shaped like an open ah, where each rolled chord comes back as a choir.',
    preview: ROLLED_TWICE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { volume: 2, type: 1, sustain: 6, release: 4, body: 1 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Choir of ah',
        params: { decay: 5, resonance: 0.75, mix: 0.46 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-two-tone-tremble',
    name: 'Two-tone tremble',
    category: 'plucked',
    description:
      'Nylon strings split at their middle, the lows swaying against the highs a little over twice a second.',
    preview: HALF_CLOSE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: { volume: 3, position: 0.12, nail: 0.7, sustain: 9, release: 5, tone: 0.8 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 2.3, depth: 0.75 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'unmeasured-preludes-breath-of-the-bellows',
    name: 'Breath of the bellows',
    category: 'texture',
    description: 'Muted steel dots blurred into a soft fuzz and hung in the dark for nine seconds.',
    preview: CLIMBED,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: { volume: 5, sustain: 1.2, release: 0.2, tone: 0.35 },
    },
    effects: [
      {
        deviceId: 'haze',
        preset: 'Wool blanket',
        params: { haze: 0.5, decay: 9, tone: 0.25, mix: 0.55 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-wire-drawn-too-stiff',
    name: 'Wire drawn too stiff',
    category: 'bell',
    description:
      'Bright twelve-string wire with its partials stretched apart until each course clangs, in a tight swarm of echoes.',
    preview: FIVE_NOTE_FALL,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve chime',
      params: { volume: 0.5, body: 0.2, sustain: 5, release: 3, nail: 0.6, tone: 0.7 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Stiff string', params: { stretch: 0.5, mix: 0.8 } },
      { deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'unmeasured-preludes-turned-on-a-lathe',
    name: 'Turned on a lathe',
    category: 'plucked',
    description:
      'Woody gated plucks, hardly folded, each closing like a soft wooden lid, in a panelled room.',
    preview: RUN_DOWN,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: {
        volume: -3,
        fold: 0.2,
        fm: 0.05,
        timbreEnv: 0.3,
        decay: 2.4,
        colour: 0.4,
        chance: 0.05,
      },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.28 } },
      { deviceId: 'stereo-detune', preset: 'Faint width' },
    ],
  },
  {
    id: 'unmeasured-preludes-mallet-in-a-sleeve',
    name: 'Mallet in a sleeve',
    category: 'keys',
    description:
      'Rounded tones with a padded strike, left for five seconds and carried out on a warm hall.',
    preview: SEVENTHS_KEPT,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { volume: -5, attack: 0.02, decay: 5, colour: 0.25, chance: 0, drift: 0.1 },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 6, damping: 0.5, breathDepth: 0, mix: 0.4 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-glass-of-the-casement',
    name: 'Glass of the casement',
    category: 'bell',
    description:
      'Frequency-modulated bells at three and a half times the note, held wide and thin by a slow ensemble.',
    preview: TOP_LEFT_LAST,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Glass bell',
      params: { volume: -0.5, fm: 0.4, decay: 7, colour: 1 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air', params: { depth: 30, mix: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'unmeasured-preludes-spinet-of-folds',
    name: 'Spinet of folds',
    category: 'plucked',
    description:
      'Quick folded plucks, bright at the strike and gone at once, through three small warm springs.',
    preview: SHAKEN,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Bright harp',
      params: { volume: -1, fold: 0.7, decay: 0.9, timbreEnv: 0.5, fm: 0.2, ratio: 4 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', params: { presence: -3, highCut: 9000 } },
    ],
  },
  {
    id: 'unmeasured-preludes-thumb-on-thin-metal',
    name: 'Thumb on thin metal',
    category: 'plucked',
    description:
      'Short metal tongues under a wooden box, each stroke skipping away in echoes that close up.',
    preview: TOP_LEFT_LAST,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Thumb piano',
      params: { volume: 0, decay: 0.9, colour: 0.6, chance: 0 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { body: 5, size: 0.8, mix: 0.5 } },
      {
        deviceId: 'skipping-stone',
        preset: 'Soft pebble',
        params: { first: 520, bounce: 0.75, loss: 4, mix: 0.35 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-gong-as-long-as-a-hall',
    name: 'Gong as long as a hall',
    category: 'bell',
    description:
      'A dark gong of eight seconds under each note, darkening as it goes, in a cavern of dim, crowded echoes.',
    preview: OVER_ONE_BASS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Long gong',
      params: { volume: -1.5, fm: 0.6, fold: 0.15, colour: 0.2, drift: 0.3 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        preset: 'Cavern',
        params: { stretch: 0.6, highCut: 2600, mix: 0.4 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-breath-before-the-string',
    name: 'Breath before the string',
    category: 'pad',
    description:
      'A folded tone that opens over a second and a half and holds while the key does, its bands slowly drifting.',
    preview: TRYING_STRINGS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Slow bloom',
      params: { attack: 1.4, decay: 5, sustain: 0.9, colour: 0.6, fm: 0.1 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Nearly still', params: { depth: 0.45, sway: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.36 } },
    ],
  },
  {
    id: 'unmeasured-preludes-single-string-canon-box',
    name: 'Single-string canon box',
    category: 'plucked',
    description:
      'Bare sines with a soft edge, answered by the same roll an octave below and then an octave above.',
    preview: TOP_LEFT_LAST,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: {
        volume: -3.5,
        fold: 0,
        fm: 0,
        timbreEnv: 0.05,
        decay: 3.2,
        colour: 0.35,
        chance: 0,
        drift: 0,
      },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Triad from one line',
        params: { followers: 2, gap: 1.9, interval1: -12, interval2: 12, fade: 0.35, mix: 0.45 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-unfretted-in-the-dark',
    name: 'Unfretted in the dark',
    category: 'bass',
    description: 'Round low folded tones that open as they are struck and then go almost black.',
    preview: BASS_ALONE,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Round bass',
      params: { volume: -2, decay: 3, timbreEnv: 0.6, fold: 0.3, fm: 0.15 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth', params: { driveDb: 5, mix: 0.6 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'unmeasured-preludes-regal-left-on-the-table',
    name: 'Regal left on the table',
    category: 'organ',
    description:
      'Struck folded reeds that hold only a little, through organ stops an octave and a twelfth up.',
    preview: HALF_CLOSE,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folded reeds',
      params: { volume: -2, attack: 0.01, decay: 3.5, sustain: 0.15, fold: 0.4 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Flute stops',
        params: { speak: 160, octave: 0.6, twelfth: 0.4, sub: 0, mix: 0.6 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'unmeasured-preludes-chimes-over-a-doorway',
    name: 'Chimes over a doorway',
    category: 'bell',
    description:
      'Small chimes modulated at five times the note, throwing off sparks two octaves up that trail behind.',
    preview: FIVE_NOTE_FALL,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Small chimes',
      params: { volume: 1.5, decay: 1.8, fm: 0.35 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Slow stars', params: { pitch: 2, density: 3, mix: 0.35 } },
      { deviceId: 'distance', preset: 'A few steps back', params: { distance: 0.35 } },
    ],
  },
  {
    id: 'unmeasured-preludes-hollow-reed-plucked',
    name: 'Hollow reed, plucked',
    category: 'plucked',
    description:
      'Tones with a ghost of the octave below them, struck and hollow, inside a long open pipe.',
    preview: ROLLED_TWICE,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow pipes',
      params: { volume: -4, attack: 0.005, decay: 2.2, sustain: 0, ratio: 0, fm: 0.35, fold: 0.25 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { body: 1, size: 1.6, mix: 0.6 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { breathDepth: 0, decay: 4, mix: 0.28 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-rain-keeps-the-chord',
    name: 'Rain keeps the chord',
    category: 'texture',
    description:
      'Dry folded ticks, caught as they fall and held as an even pad that glides to the next chord.',
    preview: SEVENTHS_KEPT,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Rain on wood',
      params: { volume: 6, chance: 0.3, decay: 0.35, fold: 0.35 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Slow strings',
        params: { attack: 0.6, decay: 7, mix: 0.7 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-folded-twice-and-sealed',
    name: 'Folded twice and sealed',
    category: 'keys',
    description:
      'A tone folded hard and tilted, each note swaying once it has been held a while, in a hall that answers late.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folded reeds',
      params: {
        volume: -8,
        attack: 0.02,
        decay: 6,
        sustain: 0.35,
        fold: 0.85,
        symmetry: 0.5,
        colour: 0.35,
      },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { depth: 22, rate: 4.2 } },
      {
        deviceId: 'auto-filter',
        params: { type: 0, cutoffHz: 1500, resonance: 0.8, envAmount: 20 },
      },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'unmeasured-preludes-wire-with-a-burr',
    name: 'Wire with a burr',
    category: 'plucked',
    description:
      'Bright plucks modulated at three to two, the bite turned to flutter by many small quick tremolos.',
    preview: CLIMBED,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Bright harp',
      params: {
        volume: -1.5,
        fold: 0.35,
        fm: 0.4,
        ratio: 2,
        decay: 4.5,
        colour: 0.75,
        timbreEnv: 0.4,
      },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Fast shimmer', params: { depth: 0.8 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'unmeasured-preludes-pedals-all-in-natural',
    name: 'Pedals all in natural',
    category: 'plucked',
    description:
      'A concert harp plucked in the middle of soft strings, each note left over a deep soundboard and hall.',
    preview: CLIMBED,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: -7.5, touch: 0.12, decay: 2.6, halo: 0.6 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { midDecay: 4, mix: 0.36 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 4 } },
    ],
  },
  {
    id: 'unmeasured-preludes-bridge-and-ivory-pick',
    name: 'Bridge and ivory pick',
    category: 'plucked',
    description:
      'Koto strings plucked beside the bridge, each bent by the press of the hand, held level by a limiter in a small dry booth.',
    preview: FIVE_NOTE_FALL,
    instrument: {
      deviceId: 'harp',
      preset: 'Rising koto',
      params: { volume: -1, bend: 60, decay: 1.6, touch: 0.5, body: 1, halo: 0.15 },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.22 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 7 } },
    ],
  },
  {
    id: 'unmeasured-preludes-guzheng-in-the-long-hall',
    name: 'Guzheng in the long hall',
    category: 'plucked',
    description:
      'Wire guzheng strings with a slow tail, two copies flying close by, in a wide hall with a thin airy end.',
    preview: BASS_DOWN,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { volume: -0.5, decay: 2.5, touch: 0.5, halo: 0.8 },
    },
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Airy tail',
        params: { midDecay: 5.5, damping: 9000, mix: 0.42 },
      },
      { deviceId: 'murmuration', preset: 'Two close by', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'unmeasured-preludes-damped-between-chords',
    name: 'Damped between chords',
    category: 'plucked',
    description:
      'Harp strings muted as the hand leaves them, with a short echo that lands on two tape heads.',
    preview: RUN_DOWN,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { volume: -1, damp: 0.95, decay: 0.6, touch: 0.55 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Two head gallop',
        params: { time: 340, feedback: 0.3, mix: 0.34 },
      },
    ],
  },
  {
    id: 'unmeasured-preludes-harmonics-from-the-knee',
    name: 'Harmonics from the knee',
    category: 'bell',
    description:
      'Long glassy harp strings with their partials bent to a chime, sparse stars of echo around.',
    preview: TOP_LEFT_LAST,
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { volume: -1, pluck: 0.5, decay: 2.2 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Soft chime', params: { stretch: 0.3, mix: 0.7 } },
      { deviceId: 'constellation', preset: 'Faint points', params: { span: 3800, mix: 0.35 } },
    ],
  },
  {
    id: 'unmeasured-preludes-harp-poured-slowly',
    name: 'Harp poured slowly',
    category: 'pad',
    description:
      'Soft silk strings with no attack left, blurred in three layers until a roll is one swell with a sinking tail.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { volume: 0.5, decay: 3.5, bend: 0, halo: 0.9 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 520, layers: 3, soften: 1, mix: 1 } },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'unmeasured-preludes-steel-strings-on-oak',
    name: 'Steel strings on oak',
    category: 'plucked',
    description:
      'Wire strings close and hard, compressed until the ring is as loud as the pluck, through warm iron.',
    preview: RUN_DOWN,
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { volume: 0.5, decay: 3, body: 0.4, touch: 0.8, halo: 0.6 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 16, outputGain: -12 } },
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.4, tone: -0.4 } },
    ],
  },
  {
    id: 'unmeasured-preludes-gilt-gone-to-brown',
    name: 'Gilt gone to brown',
    category: 'plucked',
    description:
      'A plain harp on an old record, warped, crackling a little and worn down on top, with one late slap of room.',
    preview: HALF_CLOSE,
    instrument: { deviceId: 'harp', preset: 'Concert harp', params: { touch: 0.3, decay: 0.9 } },
    effects: [
      { deviceId: 'vinyl', preset: 'Dull stylus', params: { warp: 0.4, crackle: 0.25, pops: 0 } },
      { deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'unmeasured-preludes-agreed-between-chords',
    name: 'Agreed between chords',
    category: 'plucked',
    description:
      'Harp notes passed only where they agree with a moment before: common tones hang, the rest vanish.',
    preview: SEVENTHS_KEPT,
    instrument: {
      deviceId: 'harp',
      preset: 'Rings while held',
      params: { volume: -3, damp: 0, decay: 3, halo: 0.8 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        preset: 'Hanging notes',
        params: { ago: 600, ring: 0.75, mix: 0.85 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'unmeasured-preludes-wound-strings-left-hand',
    name: 'Wound strings, left hand',
    category: 'bass',
    description:
      'Low harp strings with an octave below them and the highs above a thousand hertz turned well down.',
    preview: BASS_ALONE,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { volume: -1.5, decay: 1.6, touch: 0.35, body: 0.9 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6, up1: 0, filter: 900 } },
      { deviceId: 'ambient-eq', params: { presence: -6, air: -8, highCut: 2600, low: -1 } },
    ],
  },
  {
    id: 'unmeasured-preludes-last-chord-falling',
    name: 'Last chord, falling',
    category: 'texture',
    description:
      'A harp roll of which small pieces are caught and dropped a fourth as they fade, all heard from across a room.',
    preview: ROLLED_TWICE,
    instrument: {
      deviceId: 'harp',
      preset: 'Slow rolled chord',
      params: { volume: -1.5, sweep: 0, decay: 1.4, halo: 0.5 },
    },
    effects: [
      {
        deviceId: 'falling',
        preset: 'Slow sighs',
        params: { fall: -5, size: 1400, density: 3, mix: 0.45 },
      },
      { deviceId: 'distance', preset: 'Across the room', params: { wander: 0 } },
    ],
  },
  {
    id: 'unmeasured-preludes-held-to-the-double-bar',
    name: 'Held to the double bar',
    category: 'keys',
    description:
      'A felted piano with the pedal down from first note to last, its own room off, in a dark hall of seven seconds.',
    preview: CLIMBED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: { outputDb: -16, felt: 0.8, hardness: 0.2, reverbMix: 0, resonance: 1 },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Dark cave',
        params: { decay: 7, breathDepth: 0, mix: 0.34 },
      },
      { deviceId: 'ambient-eq', preset: 'Keys' },
    ],
  },
  {
    id: 'unmeasured-preludes-clavier-in-a-closet',
    name: 'Clavier in a closet',
    category: 'keys',
    description:
      'A hard, bare little piano with loud action, boxed inside a very small ringing drum, with no room at all.',
    preview: SHAKEN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { outputDb: -12, felt: 0, hardness: 1, stiffness: 2, detune: 0.9, reverbMix: 0 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 300, highCut: 7500 } },
    ],
  },
  {
    id: 'unmeasured-preludes-hammer-a-moment-late',
    name: 'Hammer a moment late',
    category: 'keys',
    description:
      'Still, perfectly tuned strings whose strikes come a moment late and quieter, behind their tones, in a long hall.',
    preview: TOP_LEFT_LAST,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { outputDb: -15, reverbMix: 0, resonance: 0.9, sustain: 1 },
    },
    effects: [
      {
        deviceId: 'sift',
        preset: 'Strike just after',
        params: { attacks: -9, late: 180, hold: 0.6 },
      },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 7, shimmer: 0.1, mix: 0.36 } },
    ],
  },
  {
    id: 'unmeasured-preludes-rolled-in-the-next-room',
    name: 'Rolled in the next room',
    category: 'keys',
    description:
      'A felt piano with a heavy thump heard through a wall: far, low and late, its highs gone.',
    preview: HALF_CLOSE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { outputDb: -15, thump: 0.7, reverbMix: 0.2 },
    },
    effects: [
      {
        deviceId: 'distance',
        preset: 'Next door',
        params: { distance: 0.8, room: 0.7, wander: 0 },
      },
      { deviceId: 'lift', preset: 'Slightly closer' },
    ],
  },
  {
    id: 'unmeasured-preludes-ash-on-the-hearthstone',
    name: 'Ash on the hearthstone',
    category: 'keys',
    description:
      'A grainy worn piano in one channel, driven by a tube and echoed darkly, its middle then opened wide.',
    preview: ROLLED_TWICE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Worn mono',
      params: { outputDb: -17.5, grit: 1, felt: 0.5 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Tube preamp',
        params: { driveDb: 10, toneDb: -3, outputDb: -6, mix: 0.5 },
      },
      {
        deviceId: 'analog-delay',
        preset: 'Murky',
        params: { time: 720, feedback: 0.4, mix: 0.35 },
      },
      { deviceId: 'spread', preset: 'Open middle' },
    ],
  },
  {
    id: 'unmeasured-preludes-glass-upright-at-noon',
    name: 'Glass upright at noon',
    category: 'bell',
    description:
      'A hard glassy upright in a smaller body, its notes setting off ten bright bowls tuned in C.',
    preview: SEVENTHS_KEPT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { outputDb: -7, detune: 0, stiffness: 1.4, reverbMix: 0.05 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Ten bright bowls',
        params: { root: 0, scale: 0, ring: 8, mix: 0.42 },
      },
      { deviceId: 'size', preset: 'Smaller', params: { size: -0.35 } },
    ],
  },
  {
    id: 'unmeasured-preludes-pedal-half-remembered',
    name: 'Pedal half remembered',
    category: 'keys',
    description:
      'A half-pedalled piano whose partials are redrawn an octave up as slow sines, all of it swaying a little on tape.',
    preview: BASS_DOWN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: { outputDb: -20, hardness: 0.3, felt: 0.6, reverbMix: 0 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Octave halo',
        params: { attack: 700, release: 4, mix: 0.5 },
      },
      { deviceId: 'tape', preset: 'Clean transfer', params: { wow: 0.35 } },
    ],
  },
  {
    id: 'unmeasured-preludes-wax-after-the-flame',
    name: 'Wax after the flame',
    category: 'pad',
    description:
      'A felt strike that turns to a dark slow glow, fading over ten seconds and widened by a faint detune.',
    preview: TRYING_STRINGS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Dark felt',
      params: { bloom: 4, fade: 10, tone: 0.2, drift: 0.1 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo', params: { detune: 7 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'unmeasured-preludes-slur-drawn-in-light',
    name: 'Slur drawn in light',
    category: 'pad',
    description:
      'Plucks whose overtones rise wide behind them over three seconds, a loop of it dissolving underneath.',
    preview: CLIMBED,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Harp into air',
      params: { strike: 1, glow: 0.75, bloom: 3, fade: 8, width: 1 },
    },
    effects: [
      { deviceId: 'generations', preset: 'Slow dissolve', params: { mix: 0.35 } },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'unmeasured-preludes-bell-over-still-glass',
    name: 'Bell over still glass',
    category: 'bell',
    description:
      'Struck glass with an unmoving glow beneath it, tuned strings in A minor answering faintly.',
    preview: TOP_LEFT_LAST,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Still glass',
      params: { strike: 0.9, decay: 6, glow: 0.35, tone: 0.7 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Faint ring', params: { root: 9, mode: 1, mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'unmeasured-preludes-suspension-by-daylight',
    name: 'Suspension by daylight',
    category: 'pad',
    description:
      'Only the glow, no strike at all, where the old note is still there as the new one comes up.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the glow',
      params: { bloom: 0.8, fade: 4, tone: 0.8, evolve: 0.2, halo: 0.5, width: 1 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Barely there' },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'unmeasured-preludes-embers-rolled-over',
    name: 'Embers rolled over',
    category: 'keys',
    description:
      'Felt strikes with a short glow, turned slowly by a rotary cabinet and warmed after it by a tape preamp.',
    preview: ROLLED_TWICE,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Felt afterglow',
      params: { volume: -14.5, decay: 2, glow: 0.5, bloom: 0.6, fade: 2.5, tone: 0.35 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.7 } },
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { drive: 0.35 } },
    ],
  },
  {
    id: 'unmeasured-preludes-restless-after-midnight',
    name: 'Restless after midnight',
    category: 'texture',
    description:
      'A bright glow that keeps changing, broken into short loops that climb in octaves and fifths.',
    preview: STEPS_LEFT_RINGING,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Restless light',
      params: { strike: 0.6, glow: 0.7 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Rising steps', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Bright' },
    ],
  },
  {
    id: 'unmeasured-preludes-low-tide-of-one-bass',
    name: 'Low tide of one bass',
    category: 'bell',
    description:
      'A dark bell that takes over three seconds to become its own drone, in a tail that climbs without arriving.',
    preview: OVER_ONE_BASS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Low tide bell',
      params: { strike: 0.8, bloom: 3.5 },
    },
    effects: [
      { deviceId: 'spiral', preset: 'Faint lift', params: { climb: 1.5, mix: 0.36 } },
      { deviceId: 'tamer', preset: 'Gentle' },
    ],
  },
]
