import { type FactoryPreset, type Phrase } from '../types'

// One phrase that climbs to a single height near 62 percent of its length and takes its time
// coming down. Five shapes (arch, valley, wave, staircase, two crests) by four kinds of breath:
// tongued, drawn, held over, and ringing. Louder is higher in every line, so the top is brightest.

// The single arch, two octaves of D dorian: the one height five eighths of the way, then down to D by the octave between.
const FLUTE_ARCH: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.58, note: 62, gain: 0.4 },
    { atSec: 0.6, durSec: 0.28, note: 65, gain: 0.45 },
    { atSec: 0.9, durSec: 0.73, note: 69, gain: 0.51 },
    { atSec: 1.65, durSec: 0.28, note: 67, gain: 0.48 },
    { atSec: 1.95, durSec: 0.28, note: 69, gain: 0.51 },
    { atSec: 2.25, durSec: 0.58, note: 72, gain: 0.56 },
    { atSec: 2.85, durSec: 0.28, note: 71, gain: 0.54 },
    { atSec: 3.15, durSec: 0.33, note: 74, gain: 0.59 },
    { atSec: 3.5, durSec: 0.28, note: 77, gain: 0.64 },
    { atSec: 3.8, durSec: 0.28, note: 76, gain: 0.62 },
    { atSec: 4.1, durSec: 0.38, note: 81, gain: 0.7 },
    { atSec: 4.5, durSec: 1.04, note: 86, gain: 0.78 },
    { atSec: 5.55, durSec: 0.28, note: 84, gain: 0.75 },
    { atSec: 5.85, durSec: 0.28, note: 81, gain: 0.7 },
    { atSec: 6.15, durSec: 0.28, note: 79, gain: 0.67 },
    { atSec: 6.45, durSec: 0.28, note: 77, gain: 0.64 },
    { atSec: 6.75, durSec: 0.62, note: 74, gain: 0.59 },
  ],
}

// The same arch in seven long notes, each held over into the next, a fourth or a fifth away.
const FLUTE_BREATH: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.9, note: 64, gain: 0.4 },
    { atSec: 1.4, durSec: 1.7, note: 69, gain: 0.48 },
    { atSec: 2.6, durSec: 1.5, note: 76, gain: 0.59 },
    { atSec: 3.6, durSec: 1.4, note: 81, gain: 0.67 },
    { atSec: 4.5, durSec: 1.6, note: 88, gain: 0.78 },
    { atSec: 5.6, durSec: 1.3, note: 83, gain: 0.7 },
    { atSec: 6.4, durSec: 1, note: 76, gain: 0.59 },
  ],
}

// The double arch, E to the E two octaves up: a first crest on D, a second and higher one on E.
const TWO_CRESTS_HIGH: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.43, note: 64, gain: 0.4 },
    { atSec: 0.45, durSec: 0.28, note: 67, gain: 0.45 },
    { atSec: 0.75, durSec: 0.28, note: 71, gain: 0.51 },
    { atSec: 1.05, durSec: 0.75, note: 74, gain: 0.56 },
    { atSec: 1.85, durSec: 0.28, note: 72, gain: 0.53 },
    { atSec: 2.15, durSec: 0.28, note: 69, gain: 0.48 },
    { atSec: 2.45, durSec: 0.55, note: 67, gain: 0.45 },
    { atSec: 3.05, durSec: 0.33, note: 71, gain: 0.51 },
    { atSec: 3.4, durSec: 0.33, note: 76, gain: 0.59 },
    { atSec: 3.75, durSec: 0.33, note: 79, gain: 0.64 },
    { atSec: 4.1, durSec: 0.38, note: 83, gain: 0.7 },
    { atSec: 4.5, durSec: 1.08, note: 88, gain: 0.78 },
    { atSec: 5.6, durSec: 0.33, note: 86, gain: 0.75 },
    { atSec: 5.95, durSec: 0.33, note: 83, gain: 0.7 },
    { atSec: 6.3, durSec: 0.33, note: 79, gain: 0.64 },
    { atSec: 6.65, durSec: 0.72, note: 76, gain: 0.59 },
  ],
}

// The wave: one figure (a fifth, a fourth, a third) three times, each time a third higher, D minor, F, A minor,
// the same length each time: a canon on it one wave late, at the octave or the fifth, runs in thirds.
const THREE_WAVES_HIGH: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.33, note: 62, gain: 0.4 },
    { atSec: 0.35, durSec: 0.33, note: 69, gain: 0.52 },
    { atSec: 0.7, durSec: 0.38, note: 74, gain: 0.61 },
    { atSec: 1.1, durSec: 0.56, note: 77, gain: 0.66 },
    { atSec: 1.7, durSec: 0.33, note: 65, gain: 0.45 },
    { atSec: 2.05, durSec: 0.33, note: 72, gain: 0.57 },
    { atSec: 2.4, durSec: 0.38, note: 77, gain: 0.66 },
    { atSec: 2.8, durSec: 0.56, note: 81, gain: 0.73 },
    { atSec: 3.4, durSec: 0.33, note: 69, gain: 0.52 },
    { atSec: 3.75, durSec: 0.33, note: 76, gain: 0.64 },
    { atSec: 4.1, durSec: 0.38, note: 81, gain: 0.73 },
    { atSec: 4.5, durSec: 0.93, note: 84, gain: 0.78 },
    { atSec: 5.45, durSec: 0.33, note: 79, gain: 0.69 },
    { atSec: 5.8, durSec: 0.38, note: 81, gain: 0.73 },
    { atSec: 6.2, durSec: 0.33, note: 79, gain: 0.69 },
    { atSec: 6.55, durSec: 0.75, note: 76, gain: 0.64 },
  ],
}

// The wave an octave down, for reeds and strings.
const THREE_WAVES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.33, note: 50, gain: 0.4 },
    { atSec: 0.35, durSec: 0.33, note: 57, gain: 0.52 },
    { atSec: 0.7, durSec: 0.38, note: 62, gain: 0.61 },
    { atSec: 1.1, durSec: 0.56, note: 65, gain: 0.66 },
    { atSec: 1.7, durSec: 0.33, note: 53, gain: 0.45 },
    { atSec: 2.05, durSec: 0.33, note: 60, gain: 0.57 },
    { atSec: 2.4, durSec: 0.38, note: 65, gain: 0.66 },
    { atSec: 2.8, durSec: 0.56, note: 69, gain: 0.73 },
    { atSec: 3.4, durSec: 0.33, note: 57, gain: 0.52 },
    { atSec: 3.75, durSec: 0.33, note: 64, gain: 0.64 },
    { atSec: 4.1, durSec: 0.38, note: 69, gain: 0.73 },
    { atSec: 4.5, durSec: 0.93, note: 72, gain: 0.78 },
    { atSec: 5.45, durSec: 0.33, note: 67, gain: 0.69 },
    { atSec: 5.8, durSec: 0.38, note: 69, gain: 0.73 },
    { atSec: 6.2, durSec: 0.33, note: 67, gain: 0.69 },
    { atSec: 6.55, durSec: 0.75, note: 64, gain: 0.64 },
  ],
}

// The inverted arch for a reed: down two octaves from D to its one low point, and back up as far as A.
const VALLEY: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.88, note: 74, gain: 0.78 },
    { atSec: 0.9, durSec: 0.28, note: 72, gain: 0.75 },
    { atSec: 1.2, durSec: 0.43, note: 69, gain: 0.7 },
    { atSec: 1.65, durSec: 0.28, note: 71, gain: 0.73 },
    { atSec: 1.95, durSec: 0.48, note: 67, gain: 0.67 },
    { atSec: 2.45, durSec: 0.28, note: 64, gain: 0.62 },
    { atSec: 2.75, durSec: 0.38, note: 65, gain: 0.64 },
    { atSec: 3.15, durSec: 0.28, note: 62, gain: 0.59 },
    { atSec: 3.45, durSec: 0.38, note: 57, gain: 0.51 },
    { atSec: 3.85, durSec: 0.28, note: 55, gain: 0.48 },
    { atSec: 4.15, durSec: 0.33, note: 53, gain: 0.45 },
    { atSec: 4.5, durSec: 1.08, note: 50, gain: 0.4 },
    { atSec: 5.6, durSec: 0.33, note: 57, gain: 0.51 },
    { atSec: 5.95, durSec: 0.33, note: 60, gain: 0.56 },
    { atSec: 6.3, durSec: 0.28, note: 62, gain: 0.59 },
    { atSec: 6.6, durSec: 0.28, note: 65, gain: 0.64 },
    { atSec: 6.9, durSec: 0.48, note: 69, gain: 0.7 },
  ],
}

// The double arch in the middle register: first crest E, second crest D, a seventh higher.
const TWO_CRESTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.38, note: 50, gain: 0.4 },
    { atSec: 0.4, durSec: 0.33, note: 57, gain: 0.51 },
    { atSec: 0.75, durSec: 0.28, note: 60, gain: 0.56 },
    { atSec: 1.05, durSec: 0.7, note: 64, gain: 0.62 },
    { atSec: 1.8, durSec: 0.28, note: 62, gain: 0.59 },
    { atSec: 2.1, durSec: 0.33, note: 57, gain: 0.51 },
    { atSec: 2.45, durSec: 0.5, note: 53, gain: 0.45 },
    { atSec: 3, durSec: 0.33, note: 57, gain: 0.51 },
    { atSec: 3.35, durSec: 0.33, note: 60, gain: 0.56 },
    { atSec: 3.7, durSec: 0.35, note: 65, gain: 0.64 },
    { atSec: 4.08, durSec: 0.4, note: 69, gain: 0.7 },
    { atSec: 4.5, durSec: 1.08, note: 74, gain: 0.78 },
    { atSec: 5.6, durSec: 0.33, note: 72, gain: 0.75 },
    { atSec: 5.95, durSec: 0.33, note: 69, gain: 0.7 },
    { atSec: 6.3, durSec: 0.33, note: 65, gain: 0.64 },
    { atSec: 6.65, durSec: 0.72, note: 62, gain: 0.59 },
  ],
}

// The staircase: nine plateaus from D to the E above the octave, then one fall of a ninth home.
const NINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.54, note: 62, gain: 0.4 },
    { atSec: 0.56, durSec: 0.54, note: 64, gain: 0.45 },
    { atSec: 1.13, durSec: 0.54, note: 65, gain: 0.48 },
    { atSec: 1.69, durSec: 0.54, note: 67, gain: 0.54 },
    { atSec: 2.25, durSec: 0.54, note: 69, gain: 0.59 },
    { atSec: 2.81, durSec: 0.54, note: 71, gain: 0.64 },
    { atSec: 3.38, durSec: 0.54, note: 72, gain: 0.67 },
    { atSec: 3.94, durSec: 0.54, note: 74, gain: 0.73 },
    { atSec: 4.5, durSec: 1.1, note: 76, gain: 0.78 },
    { atSec: 5.7, durSec: 1.6, note: 62, gain: 0.4 },
  ],
}

// A long staircase for plucked strings: fifteen steps, D to D two octaves up, over D then G, and one fall to D.
const FIFTEEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.36, note: 50, gain: 0.4 },
    { atSec: 0, durSec: 4.1, note: 38, gain: 0.36 },
    { atSec: 0.3, durSec: 0.36, note: 52, gain: 0.43 },
    { atSec: 0.6, durSec: 0.36, note: 53, gain: 0.45 },
    { atSec: 0.9, durSec: 0.36, note: 55, gain: 0.48 },
    { atSec: 1.2, durSec: 0.36, note: 57, gain: 0.51 },
    { atSec: 1.5, durSec: 0.36, note: 59, gain: 0.54 },
    { atSec: 1.8, durSec: 0.36, note: 60, gain: 0.56 },
    { atSec: 2.1, durSec: 0.36, note: 62, gain: 0.59 },
    { atSec: 2.4, durSec: 0.36, note: 64, gain: 0.62 },
    { atSec: 2.7, durSec: 0.36, note: 65, gain: 0.64 },
    { atSec: 3, durSec: 0.36, note: 67, gain: 0.67 },
    { atSec: 3.3, durSec: 0.36, note: 69, gain: 0.7 },
    { atSec: 3.6, durSec: 0.36, note: 71, gain: 0.73 },
    { atSec: 3.9, durSec: 0.36, note: 72, gain: 0.75 },
    { atSec: 4.2, durSec: 1.4, note: 74, gain: 0.78 },
    { atSec: 4.2, durSec: 1.3, note: 43, gain: 0.4 },
    { atSec: 5.6, durSec: 0.8, note: 50, gain: 0.42 },
    { atSec: 5.6, durSec: 0.8, note: 38, gain: 0.36 },
  ],
}

// The A aeolian arch on low strings: A to the A two octaves up and back to the A between.
const STRING_ARCH: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.68, note: 45, gain: 0.4 },
    { atSec: 0.7, durSec: 0.28, note: 48, gain: 0.45 },
    { atSec: 1, durSec: 0.73, note: 52, gain: 0.51 },
    { atSec: 1.75, durSec: 0.28, note: 50, gain: 0.48 },
    { atSec: 2.05, durSec: 0.28, note: 48, gain: 0.45 },
    { atSec: 2.35, durSec: 0.58, note: 52, gain: 0.51 },
    { atSec: 2.95, durSec: 0.28, note: 57, gain: 0.59 },
    { atSec: 3.25, durSec: 0.33, note: 60, gain: 0.64 },
    { atSec: 3.6, durSec: 0.28, note: 59, gain: 0.62 },
    { atSec: 3.9, durSec: 0.58, note: 64, gain: 0.7 },
    { atSec: 4.5, durSec: 1.08, note: 69, gain: 0.78 },
    { atSec: 5.6, durSec: 0.28, note: 67, gain: 0.75 },
    { atSec: 5.9, durSec: 0.28, note: 64, gain: 0.7 },
    { atSec: 6.2, durSec: 0.23, note: 65, gain: 0.72 },
    { atSec: 6.45, durSec: 0.23, note: 62, gain: 0.67 },
    { atSec: 6.7, durSec: 0.23, note: 60, gain: 0.64 },
    { atSec: 6.95, durSec: 0.43, note: 57, gain: 0.59 },
  ],
}

// The slow arch for reeds and strings, D to D two octaves up: seven long notes held over, fifths and one third.
const LOW_BREATH: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.9, note: 50, gain: 0.4 },
    { atSec: 1.4, durSec: 1.7, note: 57, gain: 0.51 },
    { atSec: 2.6, durSec: 1.5, note: 64, gain: 0.62 },
    { atSec: 3.6, durSec: 1.4, note: 67, gain: 0.67 },
    { atSec: 4.5, durSec: 1.6, note: 74, gain: 0.78 },
    { atSec: 5.6, durSec: 1.2, note: 69, gain: 0.7 },
    { atSec: 6.3, durSec: 1.1, note: 62, gain: 0.59 },
  ],
}

// The inverted arch in slow notes, C down to the C two octaves below and up again, with no E and no B:
// a string pressed up a whole tone after its pluck still lands on a white key.
const SLOW_VALLEY: Phrase = {
  notes: [
    { atSec: 0, durSec: 1, note: 72, gain: 0.78 },
    { atSec: 1, durSec: 0.8, note: 69, gain: 0.74 },
    { atSec: 1.8, durSec: 0.7, note: 67, gain: 0.7 },
    { atSec: 2.5, durSec: 0.7, note: 62, gain: 0.62 },
    { atSec: 3.2, durSec: 0.6, note: 60, gain: 0.59 },
    { atSec: 3.8, durSec: 0.7, note: 55, gain: 0.51 },
    { atSec: 4.5, durSec: 1.2, note: 48, gain: 0.4 },
    { atSec: 5.7, durSec: 0.6, note: 55, gain: 0.51 },
    { atSec: 6.3, durSec: 0.55, note: 60, gain: 0.59 },
    { atSec: 6.85, durSec: 0.5, note: 65, gain: 0.67 },
  ],
}

// The A aeolian arch over a drone of A and E, the drone struck again under the climax.
const KEYS_ARCH: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.9, note: 45, gain: 0.36 },
    { atSec: 0, durSec: 3.9, note: 52, gain: 0.32 },
    { atSec: 0, durSec: 0.58, note: 57, gain: 0.4 },
    { atSec: 0.6, durSec: 0.24, note: 60, gain: 0.45 },
    { atSec: 0.85, durSec: 0.63, note: 64, gain: 0.51 },
    { atSec: 1.5, durSec: 0.24, note: 62, gain: 0.48 },
    { atSec: 1.75, durSec: 0.24, note: 64, gain: 0.51 },
    { atSec: 2, durSec: 0.48, note: 69, gain: 0.59 },
    { atSec: 2.5, durSec: 0.28, note: 72, gain: 0.64 },
    { atSec: 2.8, durSec: 0.24, note: 71, gain: 0.62 },
    { atSec: 3.05, durSec: 0.24, note: 72, gain: 0.64 },
    { atSec: 3.3, durSec: 0.24, note: 74, gain: 0.67 },
    { atSec: 3.55, durSec: 0.43, note: 76, gain: 0.7 },
    { atSec: 4, durSec: 0.88, note: 81, gain: 0.78 },
    { atSec: 4, durSec: 2.4, note: 45, gain: 0.4 },
    { atSec: 4, durSec: 2.4, note: 52, gain: 0.34 },
    { atSec: 4.9, durSec: 0.24, note: 79, gain: 0.75 },
    { atSec: 5.15, durSec: 0.24, note: 76, gain: 0.7 },
    { atSec: 5.4, durSec: 0.24, note: 77, gain: 0.72 },
    { atSec: 5.65, durSec: 0.24, note: 74, gain: 0.67 },
    { atSec: 5.9, durSec: 0.24, note: 72, gain: 0.64 },
    { atSec: 6.15, durSec: 0.5, note: 69, gain: 0.59 },
  ],
}

// The arch as overlapping tones of A minor over A and E: a chord that climbs, opens and sinks.
const HELD_ARCH: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 45, gain: 0.34 },
    { atSec: 0, durSec: 7.2, note: 52, gain: 0.3 },
    { atSec: 0.2, durSec: 2.2, note: 57, gain: 0.4 },
    { atSec: 0.9, durSec: 2.3, note: 60, gain: 0.45 },
    { atSec: 1.7, durSec: 2.3, note: 64, gain: 0.51 },
    { atSec: 2.6, durSec: 2.3, note: 69, gain: 0.59 },
    { atSec: 3.5, durSec: 2, note: 72, gain: 0.64 },
    { atSec: 4.5, durSec: 1.8, note: 81, gain: 0.78 },
    { atSec: 5.6, durSec: 1.3, note: 76, gain: 0.7 },
    { atSec: 6.2, durSec: 1.1, note: 69, gain: 0.59 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'long-arch-melodies-opens-at-the-keystone',
    name: 'Opens at the keystone',
    category: 'string',
    description:
      'A bowed low string through a low-pass that opens as the line gets louder, in a dark hall.',
    preview: STRING_ARCH,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 0.12, vibrato: 0.35, body: 0.9, brightness: 0.6, release: 0.6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: {
          cutoffHz: 420,
          resonance: 1.2,
          envAmount: 70,
          envAttackMs: 90,
          envReleaseMs: 700,
        },
      },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'long-arch-melodies-rosin-at-the-summit',
    name: 'Rosin at the summit',
    category: 'string',
    description:
      'A pressed bow near the bridge whose vibrato waits for the long notes, through a narrow warm spring.',
    preview: STRING_ARCH,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: { attack: 0.07, pressure: 0.85, position: 0.06, vibrato: 0, release: 0.5 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { depth: 34, wait: 500 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'long-arch-melodies-seven-drawn-bows',
    name: 'Seven drawn bows',
    category: 'string',
    description:
      'A glassy slow bow set far across open ground and drifting on a slow figure of eight.',
    preview: LOW_BREATH,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { volume: -2.5, attack: 0.7, release: 2.2, brightness: 0.9, body: 0.1 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Open air', params: { distance: 0.5 } },
      { deviceId: 'around', preset: 'Slow eight', params: { rate: 0.08 } },
    ],
  },
  {
    id: 'long-arch-melodies-under-the-bridge-span',
    name: 'Under the bridge span',
    category: 'string',
    description:
      'A dark bowed section doubled an octave below, its copies flying round the listener.',
    preview: SLOW_VALLEY,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: { attack: 0.25, release: 1.2, brightness: 0.15, detune: 8, vibrato: 0.2 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } },
      { deviceId: 'murmuration', preset: 'Thick ensemble', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'long-arch-melodies-horsehair-and-no-rosin',
    name: 'Horsehair and no rosin',
    category: 'string',
    description:
      'A dull flautando bow, its attack blurred by rolling fog and its long tails lifted.',
    preview: LOW_BREATH,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { volume: -10.5, attack: 0.25, brightness: 0.08, release: 1.4 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Rolling in', params: { mix: 0.7 } },
      { deviceId: 'lift', preset: 'Long tails', params: { amount: 0.6, threshold: -27 } },
    ],
  },
  {
    id: 'long-arch-melodies-valley-in-slow-phase',
    name: 'Valley in slow phase',
    category: 'string',
    description:
      'A sustained string with a slow attack, combed by a glacial phaser and laid on a dark plate.',
    preview: SLOW_VALLEY,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Sustained swell',
      params: { volume: -4.5, attack: 0.45, release: 1.6, brightness: 0.65, detune: 12 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.6, stages: 3 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'long-arch-melodies-shadow-climbs-after',
    name: 'Shadow climbs after',
    category: 'string',
    description:
      'A driven sustained string followed one wave later by its copy an octave below, both on a worn tape.',
    preview: THREE_WAVES,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 0.25, release: 1, pressure: 0.75 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Octave shadow', params: { gap: 1.7, followers: 1, mix: 0.4 } },
      { deviceId: 'tape', preset: 'Worn thin' },
    ],
  },
  {
    id: 'long-arch-melodies-felt-on-every-stair',
    name: 'Felt on every stair',
    category: 'plucked',
    description:
      'A dark, full-bodied plucked string over one slow tape head, so each step meets the step two below it.',
    preview: NINE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { volume: -3, brightness: 0.28, body: 0.8, decay: 3 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Two head gallop',
        params: { heads: 0, time: 1125, feedback: 0.42, mix: 0.36 },
      },
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
    ],
  },
  {
    id: 'long-arch-melodies-crest-turned-round',
    name: 'Crest turned round',
    category: 'string',
    description:
      'A plucked string swelled in past its attack, each wave handed back in reverse, its lows and highs swaying.',
    preview: THREE_WAVES,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { volume: 0.5, attack: 0.22, release: 1.8, brightness: 0.75 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { time: 1700, mix: 0.42 } },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { depth: 0.4 } },
    ],
  },
  {
    id: 'long-arch-melodies-wire-hung-between-piers',
    name: 'Wire hung between piers',
    category: 'plucked',
    description:
      'A bright wire string left ringing, its notes coming back as a bed of small sparkles in octaves and fifths.',
    preview: FIFTEEN,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { volume: -5.5, release: 4, brightness: 0.9 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Sparkle bed', params: { mix: 0.4 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'long-arch-melodies-boxwood-landing',
    name: 'Boxwood landing',
    category: 'plucked',
    description:
      'A short damped pluck, heard from inside a large wooden body with a tight room around it.',
    preview: NINE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { brightness: 0.2, decay: 0.9, body: 0.7 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.85, size: 1.6 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'long-arch-melodies-unequal-crests-beating',
    name: 'Unequal crests, beating',
    category: 'plucked',
    description:
      'A widely detuned plucked string that beats for as long as it rings, over A minor strings sounding in sympathy.',
    preview: TWO_CRESTS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { release: 5, decay: 9 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor wash', params: { root: 9, mix: 0.5, decay: 4 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'long-arch-melodies-arch-drawn-in-one-line',
    name: 'Arch drawn in one line',
    category: 'pad',
    description:
      'A nearly pure still string with a faint octave, each band twinkling apart as the chord climbs and sinks.',
    preview: HELD_ARCH,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 0.8, release: 3, brightness: 0.12, detune: 7 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Wide twinkle', params: { depth: 0.8 } },
      { deviceId: 'octaves', preset: 'Faint octave' },
    ],
  },
  {
    id: 'long-arch-melodies-three-hills-hot-cabinet',
    name: 'Three hills, hot cabinet',
    category: 'string',
    description:
      'A bright string quick to sustain, through a slowly turning cabinet driven hard, then a triode.',
    preview: THREE_WAVES,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Quick sustain',
      params: { brightness: 0.65, body: 0.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Growl', params: { speed: 0 } },
      { deviceId: 'analog-drive', preset: 'Triode glow' },
    ],
  },
  {
    id: 'long-arch-melodies-year-of-one-arch',
    name: 'Year of one arch',
    category: 'pad',
    description:
      'A pressed beating string in a still evening between summer and autumn, each band of it stirring slowly.',
    preview: HELD_ARCH,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Slow beating swell',
      params: {
        volume: -10.5,
        attack: 0.6,
        release: 3,
        brightness: 0.8,
        detune: 10,
        pressure: 0.95,
        body: 0.9,
      },
    },
    effects: [
      { deviceId: 'seasons', preset: 'Long evening' },
      { deviceId: 'glimmer', preset: 'Slow weather', params: { depth: 0.8 } },
    ],
  },
  {
    id: 'long-arch-melodies-stretched-past-the-top',
    name: 'Stretched past the top',
    category: 'pad',
    description:
      'A thin glowing string, stretched five times slower behind the line into a grainy trail.',
    preview: SLOW_VALLEY,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Twelfth glow',
      params: { attack: 0.4, release: 1.5 },
    },
    effects: [
      { deviceId: 'stretch', preset: 'Grainy trail', params: { mix: 0.5 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
  {
    id: 'long-arch-melodies-second-crest-far-mic',
    name: 'Second crest, far mic',
    category: 'string',
    description:
      'A thin, glassy bow pressed hard near the bridge, through a driven combo miked from far off, its body made larger.',
    preview: TWO_CRESTS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: {
        attack: 0.05,
        release: 0.4,
        pressure: 0.7,
        position: 0.08,
        body: 0.15,
        brightness: 0.95,
        vibrato: 0.4,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { distance: 0.6, room: 0.15, drive: 0.6, treble: 0.4 },
      },
      { deviceId: 'size', preset: 'Larger' },
    ],
  },
  {
    id: 'long-arch-melodies-breath-at-the-fifth-beat',
    name: 'Breath at the fifth beat',
    category: 'wind',
    description:
      'A concert flute that brightens as it rises, its upper air lifted and an airy hall behind.',
    preview: FLUTE_ARCH,
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: { breath: 0.3, blow: 0.6, vibrato: 0.4 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright', params: { air: 4 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'long-arch-melodies-bamboo-in-three-gusts',
    name: 'Bamboo in three gusts',
    category: 'wind',
    description:
      'A bent, breathy bamboo flute blown hard, a dotted tape echo falling away under it, all through a tube.',
    preview: THREE_WAVES_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: { scoop: 160, breath: 0.45, blow: 0.95, vibrato: 0.15 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.35, time: 567 } },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 10 } },
    ],
  },
  {
    id: 'long-arch-melodies-pipes-up-the-stairwell',
    name: 'Pipes up the stairwell',
    category: 'wind',
    description: 'Pan pipes with a hard chiff on each step, heard down a stone stairwell.',
    preview: NINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { chiff: 1, breath: 0.35, release: 0.3 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.55 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'long-arch-melodies-lungs-before-the-note',
    name: 'Lungs before the note',
    category: 'pad',
    description:
      'Mostly breath: a low flute pad fading in slowly, its air leaned toward the notes of A minor.',
    preview: FLUTE_BREATH,
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { volume: -8, attack: 0.5, release: 1.8 },
    },
    effects: [
      {
        deviceId: 'scale-filter',
        preset: 'Wide and gentle',
        params: { root: 9, scale: 1, mix: 0.8 },
      },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },
  {
    id: 'long-arch-melodies-low-pipe-pedal-beneath',
    name: 'Low pipe, pedal beneath',
    category: 'wind',
    description: 'A low flute slow to speak, doubled an octave below by soft organ pipes.',
    preview: FLUTE_BREATH,
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { attack: 0.4, release: 2, blow: 0.4 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Pedal under', params: { mix: 0.6 } },
      { deviceId: 'phaser', preset: 'Faint shade' },
    ],
  },
  {
    id: 'long-arch-melodies-wood-calls-the-summit',
    name: 'Wood calls the summit',
    category: 'wind',
    description:
      'A wooden flute with a scoop into each note, its echoes slowing as they scatter, all on thick tape.',
    preview: TWO_CRESTS_HIGH,
    instrument: { deviceId: 'flute', preset: 'Canyon flute', params: { scoop: 60, breath: 0.2 } },
    effects: [
      { deviceId: 'constellation', preset: 'Slowing spiral', params: { mix: 0.4 } },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'long-arch-melodies-soft-crest-late-sway',
    name: 'Soft crest, late sway',
    category: 'wind',
    description:
      'A soft concert flute that starts each note straight and opens into a slow chorus as it is held.',
    preview: FLUTE_ARCH,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft wind lead',
      params: { vibrato: 0, blow: 0.15, attack: 0.08 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Opens to chorus' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'long-arch-melodies-nursery-of-the-arch',
    name: 'Nursery of the arch',
    category: 'wind',
    description:
      'A straight soft recorder with a smaller second player a few cents sharp beside it, cut to a record.',
    preview: THREE_WAVES_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { attack: 0.05, release: 0.25 },
    },
    effects: [
      { deviceId: 'size', preset: 'Second player', params: { size: -0.3 } },
      { deviceId: 'vinyl', preset: 'New pressing' },
    ],
  },
  {
    id: 'long-arch-melodies-hollow-pipes-held-over',
    name: 'Hollow pipes held over',
    category: 'pad',
    description:
      'Hollow pipes fading over each other, drifting like slow water from side to side, their tail rising in fifths.',
    preview: FLUTE_BREATH,
    instrument: {
      deviceId: 'flute',
      preset: 'Hollow pipes pad',
      params: { attack: 0.4, release: 2.2, blow: 0.5 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide', params: { depth: 0.7 } },
      { deviceId: 'bloom-reverb', preset: 'Rising fifths', params: { mix: 0.35, decay: 6 } },
    ],
  },
  {
    id: 'long-arch-melodies-bamboo-at-full-stretch',
    name: 'Bamboo at full stretch',
    category: 'wind',
    description:
      'A bamboo flute with a wide vibrato, beating against a copy shifted a few hertz, skipped in wide rings.',
    preview: FLUTE_ARCH,
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: { attack: 0.12, release: 1 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Detuned', params: { mix: 0.4 } },
      { deviceId: 'skipping-stone', preset: 'Wide rings', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'long-arch-melodies-falls-off-the-crest',
    name: 'Falls off the crest',
    category: 'wind',
    description:
      'A flute bent up from a whole tone below, with pieces of each note sighing downward after it.',
    preview: TWO_CRESTS_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Bent from below',
      params: { release: 0.8, breath: 0.6 },
    },
    effects: [
      { deviceId: 'falling', preset: 'Slow sighs', params: { mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'long-arch-melodies-full-lungs-hard-edge',
    name: 'Full lungs, hard edge',
    category: 'wind',
    description:
      'A hard blown flute with a wide vibrato, mostly through a small speaker, its harsh edge tamed.',
    preview: FLUTE_ARCH,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { vibrato: 0.9, breath: 0.3 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { mix: 0.7 } },
      { deviceId: 'tamer', preset: 'Harsh sample' },
    ],
  },
  {
    id: 'long-arch-melodies-air-with-a-little-pitch',
    name: 'Air with a little pitch',
    category: 'texture',
    description: 'Whisper pipes that are nearly all air, inside a glass tube that rings with them.',
    preview: FLUTE_BREATH,
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { volume: -14, attack: 0.25, release: 1.2, blow: 0.2 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.75 } },
      { deviceId: 'lift', preset: 'Air on top', params: { amount: 0.6, threshold: -28 } },
    ],
  },
  {
    id: 'long-arch-melodies-alto-under-the-ridge',
    name: 'Alto under the ridge',
    category: 'wind',
    description:
      'A low flute blown full, its breath pulled out and thrown wide, a dark echo behind it.',
    preview: TWO_CRESTS_HIGH,
    instrument: { deviceId: 'flute', preset: 'Alto flute', params: { attack: 0.06, release: 0.7 } },
    effects: [
      { deviceId: 'sift', preset: 'Wide air' },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 450, mix: 0.3 } },
    ],
  },
  {
    id: 'long-arch-melodies-arch-with-no-shore',
    name: 'Arch with no shore',
    category: 'pad',
    description: 'A wooden flute swelling slowly and letting go slowly, blurred to a hanging mist.',
    preview: FLUTE_BREATH,
    instrument: {
      deviceId: 'flute',
      preset: 'Slow wood swell',
      params: { attack: 0.9, release: 3.5, breath: 0.3 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.5 } },
      { deviceId: 'stereo-detune', preset: 'Wider' },
    ],
  },
  {
    id: 'long-arch-melodies-straight-up-and-down',
    name: 'Straight up and down',
    category: 'wind',
    description:
      'A straight flute with no vibrato and hardly any chiff, shadowed an octave below by slow pure sines.',
    preview: TWO_CRESTS_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { attack: 0.1, release: 0.9, breath: 0.05 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Low shadow', params: { mix: 0.6 } },
      { deviceId: 'tremolo', preset: 'Slow pan' },
    ],
  },
  {
    id: 'long-arch-melodies-low-point-of-the-valley',
    name: 'Low point of the valley',
    category: 'wind',
    description:
      'A half-conical reed through a resonant filter that shuts as the line sinks, in a hall with long lows.',
    preview: VALLEY,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { bore: 0.5, blow: 0.85, breath: 0.2, attack: 0.06 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: {
          cutoffHz: 380,
          resonance: 2.6,
          envAmount: 80,
          envAttackMs: 60,
          envReleaseMs: 500,
        },
      },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'long-arch-melodies-deep-end-of-the-line',
    name: 'Deep end of the line',
    category: 'wind',
    description:
      'A bass clarinet with extra weight from a transformer, its tone rung inside a drum shell.',
    preview: SLOW_VALLEY,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { attack: 0.1, release: 0.5, blow: 0.6 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'vessel', preset: 'Drum head', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'long-arch-melodies-subtone-at-the-foot',
    name: 'Subtone at the foot',
    category: 'wind',
    description:
      'A breathy tenor subtone through a small valve combo close by, wavering on a slow tremolo.',
    preview: TWO_CRESTS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { attack: 0.09, release: 0.3, breath: 1 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.4, room: 0.15 } },
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.35, rate: 3 } },
    ],
  },
  {
    id: 'long-arch-melodies-nothing-crest-nothing',
    name: 'Nothing, crest, nothing',
    category: 'pad',
    description:
      'A clarinet rising out of silence on each note, smeared into one clean sustain by its own spectrum.',
    preview: LOW_BREATH,
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { volume: -2, attack: 0.6, release: 2, blow: 0.7 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Clean sustain', params: { mix: 0.5 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'long-arch-melodies-hollow-ranks-climbing',
    name: 'Hollow ranks climbing',
    category: 'wind',
    description:
      'A hollow reed doubled a fifth above, and faintly an octave below, by soft organ stops.',
    preview: THREE_WAVES,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { volume: -2, attack: 0.12, release: 0.5 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Open fifths', params: { mix: 0.7 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'long-arch-melodies-apricot-wood-two-slopes',
    name: 'Apricot wood, two slopes',
    category: 'wind',
    description:
      'A breathy reed with a wide vibrato over four A minor strings that ring in sympathy.',
    preview: TWO_CRESTS,
    instrument: { deviceId: 'clarinet', preset: 'Duduk', params: { vibrato: 0.7, attack: 0.1 } },
    effects: [
      { deviceId: 'sympathetic', preset: 'Centre drone', params: { root: 9, mode: 1, mix: 0.45 } },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 5 } },
    ],
  },
  {
    id: 'long-arch-melodies-three-bright-gusts',
    name: 'Three bright gusts',
    category: 'wind',
    description:
      'A bright soprano reed, its echoes hopping an octave, thinned at the bottom and rolled off on top.',
    preview: THREE_WAVES_HIGH,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { blow: 0.85, breath: 0.15 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  {
    id: 'long-arch-melodies-gravel-at-the-summit',
    name: 'Gravel at the summit',
    category: 'wind',
    description:
      'A growling tenor reed squeezed until the low notes stand as near as the high, in a spring tank.',
    preview: TWO_CRESTS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: { growl: 0.8, blow: 0.8 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'long-arch-melodies-hum-along-the-ridge',
    name: 'Hum along the ridge',
    category: 'pad',
    description:
      'A nearly unblown reed, close to a sine, spread into a slow flock of copies far off.',
    preview: VALLEY,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { attack: 0.15, release: 0.9 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Cloud far off', params: { mix: 0.55 } },
      { deviceId: 'lift', preset: 'Warm floor' },
    ],
  },
  {
    id: 'long-arch-melodies-whispered-staircase',
    name: 'Whispered staircase',
    category: 'texture',
    description:
      'All breath and a trace of reed on each step, scattered like dust by a spray of grains.',
    preview: NINE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { attack: 0.1, release: 0.8 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Grain spray', params: { mix: 0.7 } },
      { deviceId: 'tamer', preset: 'Gentle' },
    ],
  },
  {
    id: 'long-arch-melodies-open-throat-three-waves',
    name: 'Open throat, three waves',
    category: 'wind',
    description:
      'An open clarinet with a light vibrato, each wave answered a fifth higher under the next one, on tape.',
    preview: THREE_WAVES,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: { blow: 1, release: 0.35 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Canon at the fifth',
        params: { gap: 1.7, followers: 1, interval1: 7, mix: 0.35 },
      },
      { deviceId: 'tape', preset: 'Quarter inch' },
    ],
  },
  {
    id: 'long-arch-melodies-tenor-drawn-to-the-top',
    name: 'Tenor drawn to the top',
    category: 'pad',
    description:
      'A full tenor reed swelling slowly into each long note, with a soft string pad grown behind it.',
    preview: LOW_BREATH,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Tenor swell',
      params: { attack: 0.8, release: 2.5, vibrato: 0.2 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Slow swell', params: { mix: 0.5 } },
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'long-arch-melodies-sway-at-the-height',
    name: 'Sway at the height',
    category: 'wind',
    description:
      'An alto reed with a deep vibrato in a fast rotary cabinet across the room, recorded to a reel.',
    preview: THREE_WAVES,
    instrument: { deviceId: 'clarinet', preset: 'Ballad alto', params: { attack: 0.07 } },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room', params: { speed: 1 } },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
    ],
  },
  {
    id: 'long-arch-melodies-fluttered-ascent',
    name: 'Fluttered ascent',
    category: 'wind',
    description:
      'A flutter-tongued reed, each band of it winking in a rising ripple of small tremolos.',
    preview: THREE_WAVES,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { attack: 0.1, release: 0.6 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rising ripple' },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'long-arch-melodies-wide-sway-going-down',
    name: 'Wide sway going down',
    category: 'wind',
    description:
      'A reed with the widest vibrato it has, its tail sagging a little flat and blurring as it ages.',
    preview: VALLEY,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Wide vibrato reed',
      params: { attack: 0.15, release: 1.2 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.5 } },
      { deviceId: 'stereo-detune', preset: 'Thickener' },
    ],
  },
  {
    id: 'long-arch-melodies-reed-that-lets-go-slowly',
    name: 'Reed that lets go slowly',
    category: 'wind',
    description:
      'A swaying reed with a five second release, so the climb hangs in fifths at the crest, heard under water.',
    preview: LOW_BREATH,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Slow fade reed',
      params: { release: 5, blow: 0.5, bore: 0.7, vibrato: 0.45, attack: 0.15 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Under' },
      { deviceId: 'around', preset: 'Barely moving' },
    ],
  },
  {
    id: 'long-arch-melodies-gut-strings-full-arch',
    name: 'Gut strings, full arch',
    category: 'plucked',
    description:
      'A harp plucked nearer the board with a strong ring of other strings, octave doubled, in a bright hall.',
    preview: KEYS_ARCH,
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { pluck: 0.16, touch: 0.6, decay: 1.8, halo: 1 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string' },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'long-arch-melodies-nails-beside-the-rise',
    name: 'Nails beside the rise',
    category: 'plucked',
    description:
      'A harp plucked close to the soundboard, its lows cut, its rebounds getting closer together.',
    preview: FIFTEEN,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { volume: 4, touch: 0.75, decay: 0.4 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { low: -4 } },
    ],
  },
  {
    id: 'long-arch-melodies-glass-span-of-a-harp',
    name: 'Glass span of a harp',
    category: 'plucked',
    description:
      'A softly touched harp that rings three times as long, every note shadowed by swelling sines an octave up.',
    preview: THREE_WAVES_HIGH,
    instrument: { deviceId: 'harp', preset: 'Long glass ring', params: { touch: 0.1 } },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.5 } },
      { deviceId: 'currents', preset: 'Gentle drift' },
    ],
  },
  {
    id: 'long-arch-melodies-mute-hand-up-the-stair',
    name: 'Mute hand up the stair',
    category: 'plucked',
    description:
      'A damped harp on fifteen muffled steps, tipped out of tune by a loose wide tape double.',
    preview: FIFTEEN,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { volume: -0.5, damp: 0.95, body: 1 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'long-arch-melodies-silk-bridges-hard-nail',
    name: 'Silk bridges, hard nail',
    category: 'plucked',
    description:
      'Koto strings struck hard near the bridge, the body made small, pressed hard into a limiter, with a short halo.',
    preview: NINE,
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { volume: -3, touch: 0.7, pluck: 0.05, decay: 2 },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller' },
      { deviceId: 'fet-limiter', preset: 'Light touch', params: { inputGain: 36, outputGain: -9 } },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'long-arch-melodies-bends-at-every-landing',
    name: 'Bends at every landing',
    category: 'plucked',
    description:
      'A koto whose notes are pressed up a whole tone after the pluck, limited, inside a table of A minor bowls.',
    preview: SLOW_VALLEY,
    instrument: {
      deviceId: 'harp',
      preset: 'Rising koto',
      params: { volume: 6, bend: 200, decay: 1.8 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 26, outputGain: -6 } },
      { deviceId: 'bowls', preset: 'Minor table', params: { root: 9, mix: 0.4 } },
      { deviceId: 'chorus', preset: 'Subtle widener' },
    ],
  },
  {
    id: 'long-arch-melodies-zither-over-the-gorge',
    name: 'Zither over the gorge',
    category: 'plucked',
    description:
      'A guzheng plucked hard, octave-down grains of it falling behind, with a bright edge of tape.',
    preview: THREE_WAVES,
    instrument: { deviceId: 'harp', preset: 'Guzheng', params: { touch: 0.85, body: 0.3 } },
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.3 } },
      { deviceId: 'saturator', preset: 'Parallel shine' },
    ],
  },
  {
    id: 'long-arch-melodies-soft-silk-long-descent',
    name: 'Soft silk, long descent',
    category: 'plucked',
    description:
      'A koto touched very softly and pressed a little sharp, the strike taken off and the tones left ringing.',
    preview: TWO_CRESTS,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { volume: 1.5, decay: 2.4, bend: 12 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Tones only' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'long-arch-melodies-dark-hollow-of-the-arch',
    name: 'Dark hollow of the arch',
    category: 'plucked',
    description:
      'A harp plucked at the middle of the string, hollow and dark, with an octave added below.',
    preview: KEYS_ARCH,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: -2.5, body: 0.8, decay: 2 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.4 } },
      { deviceId: 'phaser', preset: 'Bass safe', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'long-arch-melodies-steel-light-on-the-crest',
    name: 'Steel light on the crest',
    category: 'plucked',
    description:
      'Steel strings with no body plucked at the very end and limited, slow sparks two octaves up and a murky echo.',
    preview: THREE_WAVES_HIGH,
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { volume: 2.5, decay: 2, touch: 0.5 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 28, outputGain: -8 } },
      { deviceId: 'glints', preset: 'Slow stars', params: { mix: 0.35 } },
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'long-arch-melodies-lean-on-each-landing',
    name: 'Lean on each landing',
    category: 'plucked',
    description:
      'A koto pressed a whole tone after each pluck, the attack softened, played off a worn record.',
    preview: SLOW_VALLEY,
    instrument: {
      deviceId: 'harp',
      preset: 'Whole tone press',
      params: { volume: 1.5, touch: 0.45, halo: 0.3 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find', params: { crackle: 0.15 } },
      { deviceId: 'swell', preset: 'Soft pick' },
    ],
  },
  {
    id: 'long-arch-melodies-glass-rain-up-the-arch',
    name: 'Glass rain up the arch',
    category: 'texture',
    description:
      'Glass drops falling on a held chord that climbs and sinks, in a tight chamber opened wide.',
    preview: HELD_ARCH,
    instrument: {
      deviceId: 'droplets',
      preset: 'Glass rain',
      params: { volume: -3.5, rain: 5, size: 0.3, trail: 1 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.3 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'long-arch-melodies-one-drip-to-a-landing',
    name: 'One drip to a landing',
    category: 'texture',
    description:
      'A slow glass drip with a long ring, each drop unfolding from low to high through a prism of echoes.',
    preview: LOW_BREATH,
    instrument: { deviceId: 'droplets', preset: 'Slow drip', params: { rain: 1.6, trail: 3 } },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { mix: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'long-arch-melodies-wooden-pulse-of-climbing',
    name: 'Wooden pulse of climbing',
    category: 'plucked',
    description:
      'An even pulse of wooden drops on the climb, limited flat, under two soft gates that drift apart.',
    preview: HELD_ARCH,
    instrument: {
      deviceId: 'droplets',
      preset: 'Wood pulse',
      params: { volume: -10.5, rain: 8, ring: 2.6, soft: 0.6, trail: 1.5 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Flattened' },
      { deviceId: 'pulses', preset: 'Wide weave' },
      { deviceId: 'vessel', preset: 'Hint of wood' },
    ],
  },
  {
    id: 'long-arch-melodies-metal-shower-at-the-top',
    name: 'Metal shower at the top',
    category: 'texture',
    description:
      'A shower of small metal drops two octaves wide, just under water, in a tail that keeps climbing.',
    preview: HELD_ARCH,
    instrument: { deviceId: 'droplets', preset: 'Metal shower', params: { rain: 9, ring: 0.9 } },
    effects: [
      { deviceId: 'underwater', preset: 'Just under' },
      { deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'long-arch-melodies-pool-under-the-arch',
    name: 'Pool under the arch',
    category: 'texture',
    description:
      'Large water drops on the line, each caught by a one second tape loop and laid under the next.',
    preview: LOW_BREATH,
    instrument: {
      deviceId: 'droplets',
      preset: 'Deep pool',
      params: { rain: 2.5, ring: 2.5, size: 0.8 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'One second round', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'long-arch-melodies-felt-feet-on-the-stair',
    name: 'Felt feet on the stair',
    category: 'texture',
    description:
      'Soft felt patter on each step of the stair, through a dark and woolly speaker in a small plate.',
    preview: NINE,
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt patter',
      params: { volume: 2.5, rain: 10, trail: 0.4, size: 0.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'long-arch-melodies-bell-drizzle-on-one-hill',
    name: 'Bell drizzle on one hill',
    category: 'bell',
    description:
      'A drizzle of metal drops that ring long, with a tail that rises in octaves, wandering side to side.',
    preview: LOW_BREATH,
    instrument: {
      deviceId: 'droplets',
      preset: 'Bell drizzle',
      params: { rain: 4, ring: 2.2, size: 0.5, trail: 2 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.4 } },
      { deviceId: 'tremolo', preset: 'Wandering pan' },
    ],
  },
  {
    id: 'long-arch-melodies-flurries-round-the-peak',
    name: 'Flurries round the peak',
    category: 'texture',
    description:
      'Glass drops in bursts and lulls, re-recorded faintly by a room on every pass, under a slow low-pass.',
    preview: HELD_ARCH,
    instrument: {
      deviceId: 'droplets',
      preset: 'Flurries',
      params: { rain: 10, material: 0, bursts: 0.7, trail: 1.5 },
    },
    effects: [
      { deviceId: 'generations', preset: 'Faint afterimage', params: { mix: 0.4 } },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
    ],
  },
  {
    id: 'long-arch-melodies-bubbles-up-the-long-line',
    name: 'Bubbles up the long line',
    category: 'texture',
    description:
      'A stream of small water bubbles rising with the chord, faint skips after them, in a bright turning spring season.',
    preview: HELD_ARCH,
    instrument: {
      deviceId: 'droplets',
      preset: 'Bubble stream',
      params: { volume: -2, rain: 15, ring: 1, spread: 1 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Nearly dry' },
      { deviceId: 'seasons', preset: 'Spring turning' },
    ],
  },
  {
    id: 'long-arch-melodies-felt-hands-over-the-arch',
    name: 'Felt hands over the arch',
    category: 'keys',
    description:
      'A felted piano over a drone of A and E, its own room off, in a dark tail that sinks an octave.',
    preview: KEYS_ARCH,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { outputDb: -11.5, felt: 0.8, reverbMix: 0 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.35, decay: 7 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'long-arch-melodies-bare-hammers-climbing',
    name: 'Bare hammers climbing',
    category: 'keys',
    description:
      'A bare piano with no felt and hard hammers, in a dripping spring tank, on thick tape.',
    preview: THREE_WAVES_HIGH,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { outputDb: -8, hardness: 0.8, reverbMix: 0 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.3 } },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'long-arch-melodies-glass-stair-one-fall',
    name: 'Glass stair, one fall',
    category: 'keys',
    description:
      'A stiff glassy upright with every attack faded in, its echoes scattered over a full sky.',
    preview: NINE,
    instrument: { deviceId: 'felt-piano', preset: 'Glass upright', params: { reverbMix: 0 } },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 260, lookahead: 12 } },
      { deviceId: 'constellation', preset: 'Full sky', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'long-arch-melodies-parlour-on-the-long-hill',
    name: 'Parlour on the long hill',
    category: 'keys',
    description:
      'An old out-of-tune upright with a loud action, played off a cassette that wobbles.',
    preview: THREE_WAVES,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { outputDb: -14, reverbMix: 0 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'ambient-eq', preset: 'Keys' },
    ],
  },
  {
    id: 'long-arch-melodies-wash-from-foot-to-foot',
    name: 'Wash from foot to foot',
    category: 'pad',
    description:
      'The pedal down for the whole arch and the felt thick, warmed by haze and wandering slowly around.',
    preview: KEYS_ARCH,
    instrument: { deviceId: 'felt-piano', preset: 'Blurred wash', params: { reverbMix: 0.3 } },
    effects: [
      { deviceId: 'around', preset: 'Drone drift' },
      { deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'long-arch-melodies-grit-only-at-the-top',
    name: 'Grit only at the top',
    category: 'keys',
    description:
      'A hard driven grand into a tube stage that breaks up most on the loudest notes of the climb.',
    preview: KEYS_ARCH,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Driven grand',
      params: { outputDb: -16, reverbMix: 0.1 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 10 } },
      { deviceId: 'rotary', preset: 'Faint motion' },
    ],
  },
  {
    id: 'long-arch-melodies-still-strings-rising',
    name: 'Still strings, rising',
    category: 'keys',
    description:
      'A piano with no detuning and no stiffness, each note given a smooth copy a fifth above.',
    preview: TWO_CRESTS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { outputDb: -14, reverbMix: 0.15 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Fifth above', params: { mix: 0.3 } },
      { deviceId: 'chorus', preset: 'Faint air' },
    ],
  },
  {
    id: 'long-arch-melodies-struck-once-held-high',
    name: 'Struck once, held high',
    category: 'keys',
    description:
      'A felt strike whose overtones rise into a long glow, in a wide, warm and still high summer.',
    preview: HELD_ARCH,
    instrument: { deviceId: 'afterglow', preset: 'Slow bloom', params: { bloom: 2.5, fade: 5 } },
    effects: [
      { deviceId: 'seasons', preset: 'High summer' },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'long-arch-melodies-bell-halo-at-the-summit',
    name: 'Bell halo at the summit',
    category: 'bell',
    description:
      'A bell strike that turns to a halo, its partials squeezed close together, rippling band by band.',
    preview: FLUTE_BREATH,
    instrument: { deviceId: 'afterglow', preset: 'Bell halo', params: { decay: 4, bloom: 1.2 } },
    effects: [
      { deviceId: 'warp', preset: 'Tight hum' },
      { deviceId: 'currents', preset: 'Ripples' },
    ],
  },
  {
    id: 'long-arch-melodies-glass-lungs',
    name: 'Glass lungs',
    category: 'pad',
    description:
      'A faint glass strike and the glow it leaves, with octaves above, opened and closed by a slow breath.',
    preview: HELD_ARCH,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Glass breath',
      params: { strike: 0.15, bloom: 1.2 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Tide' },
      { deviceId: 'octaves', preset: 'Glass octaves' },
    ],
  },
  {
    id: 'long-arch-melodies-haze-trails-the-line',
    name: 'Haze trails the line',
    category: 'plucked',
    description:
      'A pluck with a short haze after it, thrown back by three loops of unequal length.',
    preview: THREE_WAVES,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: { volume: -1, fade: 2, decay: 1.5 },
    },
    effects: [
      { deviceId: 'orbits', preset: 'Faint trace', params: { mix: 0.45 } },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'long-arch-melodies-dark-felt-in-the-bowl',
    name: 'Dark felt in the bowl',
    category: 'keys',
    description: 'A dark felt strike with octaves added below and a quiet tape hiss riding on it.',
    preview: SLOW_VALLEY,
    instrument: { deviceId: 'afterglow', preset: 'Dark felt', params: { tone: 0.3, bloom: 1 } },
    effects: [
      { deviceId: 'noise-floor', preset: 'Riding hiss', params: { level: -36 } },
      { deviceId: 'octaves', preset: 'Deep' },
    ],
  },
  {
    id: 'long-arch-melodies-chimes-on-nine-ledges',
    name: 'Chimes on nine ledges',
    category: 'bell',
    description:
      'Bright chimes with a short glow, each struck again two steps on as a row of copies, some of them octaves up.',
    preview: NINE,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bright chimes',
      params: { volume: -1, decay: 1.4, fade: 1.5 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Restruck', params: { time: 1125, repeats: 4, mix: 0.45 } },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'long-arch-melodies-restless-light-on-top',
    name: 'Restless light on top',
    category: 'pad',
    description:
      'Only a moving glow with hardly a strike, gated into soft tides, its tail rising in octaves.',
    preview: HELD_ARCH,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Restless light',
      params: { strike: 0.1, bloom: 1.2, fade: 3 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Long tide', params: { floor: 0.75, rate: 0.6 } },
      { deviceId: 'bloom-reverb', preset: 'Octave halo', params: { mix: 0.35, decay: 6 } },
    ],
  },
  {
    id: 'long-arch-melodies-magnets-draw-the-arch',
    name: 'Magnets draw the arch',
    category: 'pad',
    description:
      'Piano strings sung by magnets with no hammer, swelling into one another under a soft cloud of grains.',
    preview: HELD_ARCH,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Glass swell',
      params: { volume: -11.5, bloom: 0.6, bright: 0.35 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.4 } },
      { deviceId: 'lift', preset: 'Just the ends' },
    ],
  },
  {
    id: 'long-arch-melodies-eighth-partial-at-crest',
    name: 'Eighth partial at crest',
    category: 'pad',
    description:
      'A magnet on the eighth harmonic, a thin whistle with an octave below it, from the back of the hall.',
    preview: STRING_ARCH,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'High whistle',
      params: { bloom: 0.25, damper: 0.8 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Bass alone', params: { dry: 1, sub1: 0.6 } },
      { deviceId: 'distance', preset: 'Back of the hall' },
    ],
  },
  {
    id: 'long-arch-melodies-wood-under-the-keystone',
    name: 'Wood under the keystone',
    category: 'keys',
    description:
      'Magnet-sung strings with half a hammer and a big wooden body, swept by a slow notch.',
    preview: TWO_CRESTS,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Dark wood',
      params: { bloom: 0.4, damper: 0.6 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Slow notch' },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'long-arch-melodies-reed-of-sung-strings',
    name: 'Reed of sung strings',
    category: 'organ',
    description:
      'Bright magnets quick to catch, almost a reed, with detuned old organ pipes in a small vowel chapel.',
    preview: THREE_WAVES,
    instrument: { deviceId: 'magnet-piano', preset: 'Quick reed', params: { bright: 0.85 } },
    effects: [
      { deviceId: 'stops', preset: 'Old pipes', params: { mix: 0.5 } },
      { deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.3, decay: 3 } },
    ],
  },
  {
    id: 'long-arch-melodies-harmonics-swept-uphill',
    name: 'Harmonics swept uphill',
    category: 'pad',
    description:
      'A magnet sweeping between harmonics as it holds, with a whistled melody picked out of it.',
    preview: HELD_ARCH,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Overtone choir',
      params: { volume: -9, bloom: 0.7, sweep: 0.9 },
    },
    effects: [
      { deviceId: 'overtone-singer', preset: 'Faint melody', params: { root: 9 } },
      { deviceId: 'stereo-detune', preset: 'Cloud' },
    ],
  },
  {
    id: 'long-arch-melodies-hammer-then-the-rise',
    name: 'Hammer, then the rise',
    category: 'keys',
    description:
      'A felt hammer first and the sung string after it, all strings ringing, in a swarm of close echoes.',
    preview: HELD_ARCH,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Ringing room',
      params: { bloom: 1, hammer: 0.9, damper: 2.5 },
    },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { mix: 0.35 } },
      { deviceId: 'tamer', preset: 'Even' },
    ],
  },
  {
    id: 'long-arch-melodies-backward-up-the-slope',
    name: 'Backward up the slope',
    category: 'keys',
    description:
      'A piano turned round: each step swells up and stops dead on its strike, on a bright plate held flat.',
    preview: NINE,
    instrument: { deviceId: 'rewind', preset: 'Stops dead', params: { volume: -0.5, swell: 0.5 } },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3 } },
      { deviceId: 'fet-limiter', preset: 'Tucked under', params: { outputGain: -9 } },
    ],
  },
  {
    id: 'long-arch-melodies-bell-lands-at-the-summit',
    name: 'Bell lands at the summit',
    category: 'bell',
    description:
      'Backward bells that land on their strike and ring on, spraying sparks of their own overtones.',
    preview: FLUTE_BREATH,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bell arrival',
      params: { volume: 6, swell: 0.7, tail: 0.9 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Overtone spray', params: { mix: 0.35 } },
      { deviceId: 'flanger', preset: 'Gentle sweep', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'long-arch-melodies-bowl-gathers-bowl-gives',
    name: 'Bowl gathers, bowl gives',
    category: 'pad',
    description:
      'A backward bowl gathering for most of a second with a wobble in its pitch, blurred behind glass, rocked by a sea.',
    preview: LOW_BREATH,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: { volume: 6, swell: 0.8, wobble: 0.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Behind glass' },
      { deviceId: 'tremolo', preset: 'Sea swell' },
    ],
  },
  {
    id: 'long-arch-melodies-plucks-drawn-to-a-crest',
    name: 'Plucks drawn to a crest',
    category: 'plucked',
    description:
      'Plucked notes played backward and cut short, answered by one plain repeating echo, through a console.',
    preview: TWO_CRESTS,
    instrument: {
      deviceId: 'rewind',
      preset: 'Pluck back',
      params: { volume: -4, swell: 0.35, snap: 0.5 },
    },
    effects: [
      { deviceId: 'prism', preset: 'One plain echo', params: { mix: 0.4 } },
      { deviceId: 'analog-drive', preset: 'Console' },
    ],
  },
  {
    id: 'long-arch-melodies-string-caught-at-the-top',
    name: 'String caught at the top',
    category: 'string',
    description:
      'A plucked string that feedback takes over on the long notes, its quiet lows brought forward.',
    preview: STRING_ARCH,
    instrument: {
      deviceId: 'feedback',
      preset: 'Singing string',
      params: { volume: -4.5, bloom: 0.25, release: 0.6 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Warm body' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'long-arch-melodies-twelfth-sung-on-a-ridge',
    name: 'Twelfth sung on a ridge',
    category: 'string',
    description:
      'Feedback on the pure twelfth with no grit, a soft loop of itself beneath and two copies close by.',
    preview: LOW_BREATH,
    instrument: {
      deviceId: 'feedback',
      preset: 'Pure twelfth',
      params: { bloom: 0.35, release: 1 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Soft bed', params: { mix: 0.35 } },
      { deviceId: 'murmuration', preset: 'Two close by' },
    ],
  },
  {
    id: 'long-arch-melodies-reed-edge-low-bowl',
    name: 'Reed edge, low bowl',
    category: 'string',
    description:
      'A short gritty feedback tone near a reed, through a pillow speaker, its dark reverse fog behind.',
    preview: VALLEY,
    instrument: { deviceId: 'feedback', preset: 'Reed tone', params: { grit: 0.5 } },
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker' },
      { deviceId: 'reverse-delay', preset: 'Dark fog', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'long-arch-melodies-glass-held-by-the-amp',
    name: 'Glass held by the amp',
    category: 'pad',
    description:
      'An unpicked string brought up by feedback on its fourth partial, its distant tail bending upward.',
    preview: LOW_BREATH,
    instrument: {
      deviceId: 'feedback',
      preset: 'Glass bow',
      params: { volume: -4.5, bloom: 0.7, release: 1.8 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Evaporate', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'long-arch-melodies-flock-over-the-long-span',
    name: 'Flock over the long span',
    category: 'pad',
    description:
      'Small gliding voices flying in from below to each tone of the climb, followed by soft sines.',
    preview: HELD_ARCH,
    instrument: { deviceId: 'flock', preset: 'Evening flock', params: { gather: 0.4, leave: 1.8 } },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Wide glass', params: { mix: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'long-arch-melodies-one-whistle-one-slope',
    name: 'One whistle, one slope',
    category: 'wind',
    description:
      'A single whistle that glides up quickly into each note, with a slow wow on it, in a vast nave.',
    preview: FLUTE_ARCH,
    instrument: { deviceId: 'flock', preset: 'One whistle', params: { tone: 0.25, leave: 0.2 } },
    effects: [
      { deviceId: 'tape', preset: 'Clean transfer', params: { wow: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'long-arch-melodies-reed-birds-down-the-hill',
    name: 'Reed birds down the hill',
    category: 'pad',
    description:
      'A choir of reedy gliding voices from around the note, with a thin half-speed octave shadow.',
    preview: SLOW_VALLEY,
    instrument: { deviceId: 'flock', preset: 'Reed choir', params: { gather: 0.2, leave: 1 } },
    effects: [
      { deviceId: 'half-speed', preset: 'Thin shadow' },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
  },
]
