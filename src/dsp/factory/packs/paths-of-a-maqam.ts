import { type FactoryPreset, type Phrase } from '../types'

// Melodic paths (sayr) in two modes with three-quarter-tone steps: Rast on C, with a half-flat third
// and seventh, and Bayati on A, with a half-flat second. Plucked, blown and bowed voices walk them;
// choirs, wind harps and feedback hold their drones. The half-flat notes are written as .5 of a key.

// Rast: dwells on C, rises to G and stays, touches the upper Rast (A, B half flat, C), turns home.
const RAST_PATH: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.1, note: 48, gain: 0.26 },
    { atSec: 0, durSec: 3.1, note: 55, gain: 0.2 },
    { atSec: 0, durSec: 0.9, note: 60, gain: 0.6 },
    { atSec: 0.9, durSec: 0.3, note: 62, gain: 0.5 },
    { atSec: 1.2, durSec: 0.3, note: 63.5, gain: 0.52 },
    { atSec: 1.5, durSec: 0.25, note: 65, gain: 0.5 },
    { atSec: 1.75, durSec: 1.35, note: 67, gain: 0.64 },
    { atSec: 3.1, durSec: 4.2, note: 48, gain: 0.26 },
    { atSec: 3.1, durSec: 0.25, note: 69, gain: 0.5 },
    { atSec: 3.35, durSec: 0.3, note: 70.5, gain: 0.54 },
    { atSec: 3.65, durSec: 0.7, note: 72, gain: 0.64 },
    { atSec: 4.35, durSec: 0.2, note: 70.5, gain: 0.48 },
    { atSec: 4.55, durSec: 0.2, note: 69, gain: 0.46 },
    { atSec: 4.75, durSec: 0.35, note: 67, gain: 0.52 },
    { atSec: 5.1, durSec: 0.2, note: 65, gain: 0.46 },
    { atSec: 5.3, durSec: 0.2, note: 63.5, gain: 0.48 },
    { atSec: 5.5, durSec: 0.15, note: 65, gain: 0.42 },
    { atSec: 5.65, durSec: 0.3, note: 63.5, gain: 0.5 },
    { atSec: 5.95, durSec: 0.25, note: 62, gain: 0.46 },
    { atSec: 6.2, durSec: 1.1, note: 60, gain: 0.6 },
  ],
}

// Rast coming down, its seventh now the plain B flat, then the cadence: E half flat, D, E half flat, D, C.
const QAFLA: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 72, gain: 0.62 },
    { atSec: 0.9, durSec: 0.35, note: 70, gain: 0.52 },
    { atSec: 1.25, durSec: 0.35, note: 69, gain: 0.5 },
    { atSec: 1.6, durSec: 1, note: 67, gain: 0.58 },
    { atSec: 2.6, durSec: 0.3, note: 65, gain: 0.48 },
    { atSec: 2.9, durSec: 0.5, note: 63.5, gain: 0.54 },
    { atSec: 3.4, durSec: 0.3, note: 62, gain: 0.48 },
    { atSec: 3.7, durSec: 0.45, note: 63.5, gain: 0.52 },
    { atSec: 4.15, durSec: 0.4, note: 62, gain: 0.5 },
    { atSec: 4.55, durSec: 2.3, note: 60, gain: 0.6 },
  ],
}

// Sikah: every phrase closes on the half-flat third over a C and G drone.
const SIKAH_CLOSES: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 48, gain: 0.3 },
    { atSec: 0, durSec: 7.2, note: 55, gain: 0.24 },
    { atSec: 0.2, durSec: 0.8, note: 63.5, gain: 0.56 },
    { atSec: 1, durSec: 0.3, note: 65, gain: 0.48 },
    { atSec: 1.3, durSec: 0.5, note: 67, gain: 0.54 },
    { atSec: 1.8, durSec: 0.3, note: 65, gain: 0.46 },
    { atSec: 2.1, durSec: 1.1, note: 63.5, gain: 0.58 },
    { atSec: 3.3, durSec: 0.3, note: 67, gain: 0.5 },
    { atSec: 3.6, durSec: 0.3, note: 69, gain: 0.54 },
    { atSec: 3.9, durSec: 0.3, note: 67, gain: 0.48 },
    { atSec: 4.2, durSec: 0.35, note: 65, gain: 0.48 },
    { atSec: 4.55, durSec: 0.9, note: 63.5, gain: 0.56 },
    { atSec: 5.5, durSec: 0.3, note: 62, gain: 0.46 },
    { atSec: 5.8, durSec: 1.5, note: 63.5, gain: 0.58 },
  ],
}

// Bayati on A, opening on D, the fourth: A itself comes only at the end of the third phrase.
const BAYATI_FROM_D: Phrase = {
  notes: [
    { atSec: 0, durSec: 4.4, note: 50, gain: 0.26 },
    { atSec: 0, durSec: 0.9, note: 62, gain: 0.6 },
    { atSec: 0.9, durSec: 0.3, note: 64, gain: 0.5 },
    { atSec: 1.2, durSec: 0.3, note: 65, gain: 0.54 },
    { atSec: 1.5, durSec: 0.3, note: 64, gain: 0.48 },
    { atSec: 1.8, durSec: 0.7, note: 62, gain: 0.56 },
    { atSec: 2.6, durSec: 0.35, note: 65, gain: 0.54 },
    { atSec: 2.95, durSec: 0.3, note: 64, gain: 0.48 },
    { atSec: 3.25, durSec: 0.3, note: 62, gain: 0.5 },
    { atSec: 3.55, durSec: 0.9, note: 60, gain: 0.56 },
    { atSec: 4.55, durSec: 1.65, note: 50, gain: 0.24 },
    { atSec: 4.55, durSec: 0.3, note: 62, gain: 0.52 },
    { atSec: 4.85, durSec: 0.3, note: 60, gain: 0.48 },
    { atSec: 5.15, durSec: 0.55, note: 58.5, gain: 0.54 },
    { atSec: 5.7, durSec: 0.2, note: 60, gain: 0.44 },
    { atSec: 5.9, durSec: 0.35, note: 58.5, gain: 0.5 },
    { atSec: 6.25, durSec: 1.05, note: 45, gain: 0.3 },
    { atSec: 6.25, durSec: 1.05, note: 57, gain: 0.6 },
  ],
}

// Bayati alone, walked down from its octave: A leans up, falls by G, F and E to dwell on D, turns, and goes home.
const BAYATI_FROM_ABOVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 69, gain: 0.6 },
    { atSec: 1.1, durSec: 0.25, note: 70.5, gain: 0.46 },
    { atSec: 1.35, durSec: 0.55, note: 69, gain: 0.54 },
    { atSec: 1.9, durSec: 0.3, note: 67, gain: 0.5 },
    { atSec: 2.2, durSec: 0.3, note: 65, gain: 0.5 },
    { atSec: 2.5, durSec: 0.3, note: 64, gain: 0.48 },
    { atSec: 2.8, durSec: 0.9, note: 62, gain: 0.58 },
    { atSec: 3.8, durSec: 0.3, note: 65, gain: 0.52 },
    { atSec: 4.1, durSec: 0.25, note: 64, gain: 0.46 },
    { atSec: 4.35, durSec: 0.25, note: 62, gain: 0.48 },
    { atSec: 4.6, durSec: 0.5, note: 60, gain: 0.54 },
    { atSec: 5.1, durSec: 0.5, note: 58.5, gain: 0.54 },
    { atSec: 5.6, durSec: 0.14, note: 60, gain: 0.42 },
    { atSec: 5.74, durSec: 0.36, note: 58.5, gain: 0.5 },
    { atSec: 6.1, durSec: 1.2, note: 57, gain: 0.6 },
  ],
}

// A Bayati line doubled an octave below by a second player who is always a little late.
const BAYATI_DOUBLED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1, note: 74, gain: 0.54 },
    { atSec: 0.08, durSec: 1, note: 62, gain: 0.42 },
    { atSec: 1, durSec: 0.4, note: 72, gain: 0.48 },
    { atSec: 1.09, durSec: 0.4, note: 60, gain: 0.38 },
    { atSec: 1.4, durSec: 0.8, note: 70.5, gain: 0.52 },
    { atSec: 1.48, durSec: 0.8, note: 58.5, gain: 0.4 },
    { atSec: 2.2, durSec: 0.3, note: 72, gain: 0.46 },
    { atSec: 2.29, durSec: 0.3, note: 60, gain: 0.36 },
    { atSec: 2.5, durSec: 0.3, note: 74, gain: 0.48 },
    { atSec: 2.6, durSec: 0.3, note: 62, gain: 0.38 },
    { atSec: 2.8, durSec: 0.8, note: 76, gain: 0.56 },
    { atSec: 2.9, durSec: 0.8, note: 64, gain: 0.42 },
    { atSec: 3.6, durSec: 0.3, note: 74, gain: 0.46 },
    { atSec: 3.69, durSec: 0.3, note: 62, gain: 0.36 },
    { atSec: 3.9, durSec: 0.35, note: 72, gain: 0.46 },
    { atSec: 3.99, durSec: 0.35, note: 60, gain: 0.36 },
    { atSec: 4.25, durSec: 0.5, note: 70.5, gain: 0.5 },
    { atSec: 4.33, durSec: 0.5, note: 58.5, gain: 0.4 },
    { atSec: 4.75, durSec: 0.25, note: 72, gain: 0.44 },
    { atSec: 4.84, durSec: 0.25, note: 60, gain: 0.34 },
    { atSec: 5, durSec: 0.4, note: 70.5, gain: 0.48 },
    { atSec: 5.09, durSec: 0.4, note: 58.5, gain: 0.38 },
    { atSec: 5.4, durSec: 1.8, note: 69, gain: 0.54 },
    { atSec: 5.52, durSec: 1.75, note: 57, gain: 0.42 },
  ],
}

// A pipe in Bayati, with short notes that lean into long ones; it visits Rast on G under the tonic.
const LEANING_PIPE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.1, note: 72, gain: 0.4 },
    { atSec: 0.1, durSec: 1.2, note: 74, gain: 0.6 },
    { atSec: 1.3, durSec: 0.3, note: 76, gain: 0.5 },
    { atSec: 1.6, durSec: 0.35, note: 77, gain: 0.56 },
    { atSec: 1.95, durSec: 0.1, note: 76, gain: 0.4 },
    { atSec: 2.05, durSec: 0.9, note: 74, gain: 0.56 },
    { atSec: 3, durSec: 0.3, note: 72, gain: 0.48 },
    { atSec: 3.3, durSec: 0.5, note: 70.5, gain: 0.54 },
    { atSec: 3.8, durSec: 0.3, note: 69, gain: 0.48 },
    { atSec: 4.1, durSec: 0.8, note: 67, gain: 0.56 },
    { atSec: 4.9, durSec: 0.25, note: 69, gain: 0.46 },
    { atSec: 5.15, durSec: 0.45, note: 70.5, gain: 0.52 },
    { atSec: 5.6, durSec: 0.1, note: 72, gain: 0.38 },
    { atSec: 5.7, durSec: 0.4, note: 70.5, gain: 0.5 },
    { atSec: 6.1, durSec: 1.15, note: 69, gain: 0.6 },
  ],
}

// A pipe that begins in the upper Rast on G and comes down through the lower one to C.
const UPPER_RAST: Phrase = {
  notes: [
    { atSec: 0, durSec: 1, note: 79, gain: 0.58 },
    { atSec: 1, durSec: 0.3, note: 81, gain: 0.5 },
    { atSec: 1.3, durSec: 0.5, note: 82.5, gain: 0.54 },
    { atSec: 1.8, durSec: 1, note: 84, gain: 0.6 },
    { atSec: 2.8, durSec: 0.3, note: 82.5, gain: 0.5 },
    { atSec: 3.1, durSec: 0.3, note: 81, gain: 0.48 },
    { atSec: 3.4, durSec: 0.7, note: 79, gain: 0.56 },
    { atSec: 4.15, durSec: 0.3, note: 77, gain: 0.48 },
    { atSec: 4.45, durSec: 0.5, note: 75.5, gain: 0.54 },
    { atSec: 4.95, durSec: 0.12, note: 77, gain: 0.42 },
    { atSec: 5.07, durSec: 0.4, note: 75.5, gain: 0.5 },
    { atSec: 5.47, durSec: 0.3, note: 74, gain: 0.48 },
    { atSec: 5.77, durSec: 1.5, note: 72, gain: 0.6 },
  ],
}

// Low Bayati on one string: from A up to D, the fourth, a lean to E, and home by the half-flat second.
const BAYATI_LOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 1, note: 45, gain: 0.6 },
    { atSec: 1, durSec: 0.6, note: 46.5, gain: 0.54 },
    { atSec: 1.6, durSec: 0.6, note: 48, gain: 0.54 },
    { atSec: 2.2, durSec: 1.4, note: 50, gain: 0.62 },
    { atSec: 3.6, durSec: 0.5, note: 52, gain: 0.54 },
    { atSec: 4.1, durSec: 0.4, note: 50, gain: 0.52 },
    { atSec: 4.5, durSec: 0.5, note: 48, gain: 0.54 },
    { atSec: 5, durSec: 0.8, note: 46.5, gain: 0.58 },
    { atSec: 5.8, durSec: 1.5, note: 45, gain: 0.62 },
  ],
}

// Rast stacked: neutral triad on C, F major over C, neutral triad on G, and the neutral triad again.
const RAST_STACKED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.75, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 1.75, note: 55, gain: 0.44 },
    { atSec: 0, durSec: 1.75, note: 63.5, gain: 0.46 },
    { atSec: 0, durSec: 1.75, note: 72, gain: 0.5 },
    { atSec: 1.75, durSec: 1.65, note: 48, gain: 0.46 },
    { atSec: 1.75, durSec: 1.65, note: 57, gain: 0.44 },
    { atSec: 1.75, durSec: 1.65, note: 65, gain: 0.46 },
    { atSec: 1.75, durSec: 1.65, note: 72, gain: 0.48 },
    { atSec: 3.4, durSec: 1.65, note: 43, gain: 0.5 },
    { atSec: 3.4, durSec: 1.65, note: 55, gain: 0.42 },
    { atSec: 3.4, durSec: 1.65, note: 62, gain: 0.46 },
    { atSec: 3.4, durSec: 1.65, note: 70.5, gain: 0.5 },
    { atSec: 5.05, durSec: 2.2, note: 48, gain: 0.5 },
    { atSec: 5.05, durSec: 2.2, note: 55, gain: 0.42 },
    { atSec: 5.05, durSec: 2.2, note: 63.5, gain: 0.46 },
    { atSec: 5.05, durSec: 2.2, note: 72, gain: 0.5 },
  ],
}

// A slow chant down through Bayati from the fourth, over A in octaves.
const BAYATI_CHANT: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 45, gain: 0.4 },
    { atSec: 0, durSec: 5.2, note: 57, gain: 0.26 },
    { atSec: 0.5, durSec: 1.6, note: 62, gain: 0.54 },
    { atSec: 2.1, durSec: 0.6, note: 64, gain: 0.48 },
    { atSec: 2.7, durSec: 0.8, note: 62, gain: 0.5 },
    { atSec: 3.5, durSec: 0.8, note: 60, gain: 0.5 },
    { atSec: 4.3, durSec: 0.95, note: 58.5, gain: 0.54 },
    { atSec: 5.3, durSec: 1.9, note: 57, gain: 0.54 },
  ],
}

// The drone of Rast, C and G, with E half flat, D and C standing in it one after another.
const RAST_DRONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 60, gain: 0.5 },
    { atSec: 0.4, durSec: 6.8, note: 67, gain: 0.42 },
    { atSec: 1.4, durSec: 2.2, note: 75.5, gain: 0.5 },
    { atSec: 3.6, durSec: 1.4, note: 74, gain: 0.46 },
    { atSec: 5, durSec: 2.2, note: 72, gain: 0.5 },
  ],
}

// The drone of Bayati, A with its fourth D held above it: C, B half flat and A pass between the two.
const BAYATI_DRONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 45, gain: 0.5 },
    { atSec: 0.4, durSec: 6.8, note: 62, gain: 0.42 },
    { atSec: 1.4, durSec: 2, note: 60, gain: 0.48 },
    { atSec: 3.4, durSec: 1.9, note: 58.5, gain: 0.5 },
    { atSec: 5.3, durSec: 1.9, note: 57, gain: 0.5 },
  ],
}

// The five keys both modes leave alone, D, F, G, A and C, for a voice that only has whole keys.
const WHOLE_KEYS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 62, gain: 0.6 },
    { atSec: 1.4, durSec: 0.9, note: 65, gain: 0.54 },
    { atSec: 2.3, durSec: 1.1, note: 67, gain: 0.58 },
    { atSec: 3.4, durSec: 0.8, note: 69, gain: 0.54 },
    { atSec: 4.2, durSec: 0.8, note: 65, gain: 0.54 },
    { atSec: 5, durSec: 0.9, note: 62, gain: 0.54 },
    { atSec: 5.9, durSec: 1.4, note: 60, gain: 0.6 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Zither: from the picked trapezoid with a roll to hammers, dark fingers and drones.
  {
    id: 'paths-of-a-maqam-dwell-on-the-fifth',
    name: 'Dwell on the fifth',
    category: 'plucked',
    preview: RAST_PATH,
    description:
      'A picked zither with a nine-a-second roll that is heard on the held notes, its courses a little apart, in a tight chamber.',
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: {
        volume: -3.5,
        exciter: 1,
        chord: 0,
        strum: 0,
        roll: 9,
        decay: 2.6,
        release: 0.9,
        brightness: 0.72,
        position: 0.1,
        courses: 0.35,
        sympathy: 0.2,
        body: 1,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
  },
  {
    id: 'paths-of-a-maqam-lap-of-cedar',
    name: 'Lap of cedar',
    category: 'plucked',
    preview: BAYATI_FROM_D,
    description:
      'Finger-plucked zither strings that stop almost at once, heard through a small wooden soundboard and a hint of spring.',
    instrument: {
      deviceId: 'zither',
      params: {
        volume: -2,
        exciter: 0,
        chord: 0,
        strum: 0,
        decay: 0.9,
        release: 0.25,
        brightness: 0.4,
        position: 0.3,
        courses: 0.7,
        sympathy: 0.05,
        body: 1,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 0.7, mix: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'paths-of-a-maqam-hammers-in-the-arcade',
    name: 'Hammers in the arcade',
    category: 'plucked',
    preview: RAST_PATH,
    description:
      'Bright hammered dulcimer with its courses far apart, spread by a wide doubling and set in a bright tiled chamber.',
    instrument: {
      deviceId: 'zither',
      params: {
        volume: -2,
        exciter: 2,
        chord: 0,
        strum: 0,
        decay: 5,
        release: 2,
        brightness: 0.9,
        position: 0.08,
        courses: 1,
        sympathy: 0.4,
        body: 2,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'paths-of-a-maqam-cotton-on-the-sticks',
    name: 'Cotton on the sticks',
    category: 'plucked',
    preview: BAYATI_FROM_D,
    description:
      'Padded hammers rolling twelve times a second on dark dulcimer strings, their top shaved off and a soft dark echo behind.',
    instrument: {
      deviceId: 'zither',
      params: {
        exciter: 2,
        chord: 0,
        strum: 0,
        roll: 12,
        decay: 2.2,
        release: 0.8,
        brightness: 0.12,
        position: 0.4,
        courses: 0.3,
        sympathy: 0.5,
        body: 2,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 2800 } },
      {
        deviceId: 'tape-echo',
        preset: 'Long dark trail',
        params: { time: 620, feedback: 0.35, mix: 0.25 },
      },
    ],
  },
  {
    id: 'paths-of-a-maqam-upper-cell-answers',
    name: 'Upper cell answers',
    category: 'plucked',
    preview: RAST_PATH,
    description:
      'A nasal plucked zither followed by a canon a fifth higher, so the lower Rast comes back as the Rast on G.',
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: {
        volume: 0.5,
        chord: 0,
        strum: 0,
        decay: 2,
        release: 0.7,
        brightness: 0.8,
        position: 0.07,
        courses: 0.1,
        body: 3,
      },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Faint answer',
        params: { followers: 1, gap: 1.1, interval1: 7, tone: 3500, spread: 0.8, mix: 0.34 },
      },
    ],
  },
  {
    id: 'paths-of-a-maqam-cloth-over-the-octave',
    name: 'Cloth over the octave',
    category: 'plucked',
    preview: BAYATI_CHANT,
    description:
      'Each note strummed down from its octave on long finger-plucked strings, far down a dark open space.',
    instrument: {
      deviceId: 'zither',
      params: {
        exciter: 0,
        chord: 1,
        strum: 320,
        direction: 1,
        decay: 12,
        release: 12,
        brightness: 0.18,
        position: 0.48,
        courses: 0.1,
        sympathy: 0.6,
        body: 0,
      },
    },
    effects: [
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.75, decay: 12, highCut: 3000, mix: 0.45 },
      },
    ],
  },
  {
    id: 'paths-of-a-maqam-steps-fall-from-a-sill',
    name: 'Steps fall from a sill',
    category: 'plucked',
    preview: SIKAH_CLOSES,
    description:
      'A dry picked note whose echoes hop away, every hop three quarters of a tone lower than the one before.',
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: {
        volume: 1,
        exciter: 1,
        decay: 1.4,
        release: 0.5,
        brightness: 0.55,
        position: 0.18,
        courses: 0.15,
        sympathy: 0,
        body: 2,
      },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Falling steps',
        params: { first: 300, bounce: 0.92, skips: 5, loss: 4, sink: 0.4, drop: 150, mix: 0.36 },
      },
    ],
  },
  {
    id: 'paths-of-a-maqam-strings-run-home',
    name: 'Strings run home',
    category: 'texture',
    preview: RAST_PATH,
    description:
      'Strong picked octaves played backwards in slow overlapping chunks, with only a little of the forward string left.',
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: {
        volume: 0,
        chord: 1,
        strum: 60,
        decay: 6,
        release: 5,
        brightness: 0.75,
        courses: 0.9,
      },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Slow swells',
        params: { time: 900, mix: 0.75, tone: 7000 },
      },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'paths-of-a-maqam-plectrum-left-at-home',
    name: 'Plectrum left at home',
    category: 'pad',
    preview: BAYATI_CHANT,
    description:
      'A bright zither with every attack faded in by a volume swell, so the plucked courses rise as if they were bowed.',
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: {
        volume: 0,
        chord: 0,
        strum: 0,
        decay: 14,
        release: 8,
        brightness: 0.85,
        position: 0.2,
        courses: 0.8,
        sympathy: 0.3,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 700 } },
      { deviceId: 'ambient-comp', preset: 'Lift' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { breathDepth: 0 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-coffee-house-set',
    name: 'Coffee house set',
    category: 'plucked',
    preview: BAYATI_FROM_D,
    description:
      'A picked zither, rolled seven times a second, from a narrow kitchen radio: a little static and a boxed-in tone.',
    instrument: {
      deviceId: 'zither',
      preset: 'Chord zither major',
      params: { chord: 0, strum: 0, roll: 7, decay: 4, release: 1.5, courses: 0.5 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio', params: { static: 0.1, interference: 0.05 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-strings-nobody-touched',
    name: 'Strings nobody touched',
    category: 'drone',
    preview: BAYATI_DRONE,
    description:
      'A soft felt hammer with the sympathetic strings full up, then four more strings on D, A and F that ring for seven seconds.',
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: { chord: 0, decay: 6, release: 14, brightness: 0.22, position: 0.3, sympathy: 1 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Learn and hold',
        params: { root: 2, mode: 1, strings: 0, decay: 7, mix: 0.7, width: 1 },
      },
    ],
  },
  {
    id: 'paths-of-a-maqam-tin-roof-tetrachord',
    name: 'Tin roof tetrachord',
    category: 'plucked',
    preview: BAYATI_FROM_D,
    description:
      'Fast hard hammers on a dulcimer inside a small tin drum, the roll running sixteen times a second.',
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: {
        volume: -6,
        roll: 16,
        decay: 1.2,
        release: 0.4,
        brightness: 0.95,
        position: 0.06,
        courses: 0.2,
        sympathy: 0.1,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Small tin', params: { size: 0.4, mix: 0.55, width: 0.2 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'paths-of-a-maqam-sixty-ways-home',
    name: 'Sixty ways home',
    category: 'plucked',
    preview: QAFLA,
    description:
      'Short koto-bodied plucks thrown into a scatter of echoes that land at seven uneven moments from side to side.',
    instrument: {
      deviceId: 'zither',
      params: {
        volume: 3,
        exciter: 0,
        chord: 0,
        strum: 0,
        decay: 1.8,
        release: 0.6,
        brightness: 0.3,
        position: 0.06,
        courses: 0,
        sympathy: 0.4,
        body: 3,
      },
    },
    effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.48 } }],
  },
  {
    id: 'paths-of-a-maqam-many-hands-one-mode',
    name: 'Many hands, one mode',
    category: 'plucked',
    preview: BAYATI_DOUBLED,
    description:
      'A picked string in octaves turned into a loose flock of twelve players, each at its own distance and bend in pitch.',
    instrument: {
      deviceId: 'zither',
      params: {
        volume: -1.5,
        exciter: 1,
        chord: 1,
        strum: 20,
        decay: 4,
        release: 2,
        brightness: 0.45,
        position: 0.3,
        courses: 0.6,
        sympathy: 0.2,
        body: 2,
      },
    },
    effects: [
      {
        deviceId: 'murmuration',
        preset: 'Wheeling',
        params: { turns: 0.4, speed: 0.8, mix: 0.75 },
      },
    ],
  },
  {
    id: 'paths-of-a-maqam-fountain-in-the-court',
    name: 'Fountain in the court',
    category: 'plucked',
    preview: SIKAH_CLOSES,
    description:
      'Glassy twelve-second zither strings under shallow water, wavering slowly, with small bubbles coming off each pluck.',
    instrument: {
      deviceId: 'zither',
      preset: 'Minor glass haze',
      params: {
        volume: -4,
        chord: 0,
        strum: 0,
        decay: 12,
        release: 6,
        courses: 0.5,
        brightness: 0.9,
        position: 0.35,
      },
    },
    effects: [
      {
        deviceId: 'underwater',
        preset: 'Sunlit shallows',
        params: { depth: 0.3, waver: 0.4, bubbles: 0.5 },
      },
    ],
  },

  // Acoustic guitar: a short-necked lute, a long-necked one, and what rooms do to them.
  {
    id: 'paths-of-a-maqam-eagle-quill',
    name: 'Eagle quill',
    category: 'plucked',
    preview: BAYATI_FROM_D,
    description:
      'A nylon lute struck with a hard quill a quarter of the way along, deep bodied and short, in a small dry room.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: {
        volume: 6,
        body: 1,
        position: 0.24,
        nail: 1,
        sustain: 1.4,
        release: 0.4,
        tone: 0.5,
      },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth' }],
  },
  {
    id: 'paths-of-a-maqam-long-neck-wire-strings',
    name: 'Long neck, wire strings',
    category: 'plucked',
    preview: RAST_PATH,
    description:
      'Doubled wire strings picked at the bridge with hardly any body, limited, warmed by a driven tube and a short bright plate.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve chime',
      params: {
        volume: -3,
        body: 0.1,
        position: 0.07,
        nail: 1,
        sustain: 4.5,
        release: 0.6,
        tone: 0.8,
        shimmer: 0.4,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -8 } },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 9 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { decay: 0.35, mix: 0.2 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-trembling-on-g',
    name: 'Trembling on G',
    category: 'plucked',
    preview: RAST_PATH,
    description:
      'A steel string that rings on while a fast square tremolo breaks it into picked repeats, eleven to the second.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: {
        volume: 0.5,
        body: 0.5,
        position: 0.12,
        nail: 0.7,
        sustain: 8,
        release: 1.5,
        tone: 0.7,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Chopper', params: { rate: 11, depth: 0.85, smooth: 0.4 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-well-under-the-lute',
    name: 'Well under the lute',
    category: 'plucked',
    preview: BAYATI_LOW,
    description:
      'Fleshy dark nylon with no nail at all and an octave added under every note, closed down to a thick low line.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: {
        volume: 6,
        type: 1,
        body: 1,
        position: 0.4,
        nail: 0,
        sustain: 3,
        release: 0.8,
        tone: 0.2,
        strum: 0,
      },
    },
    effects: [{ deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } }],
  },
  {
    id: 'paths-of-a-maqam-palm-on-the-bridge',
    name: 'Palm on the bridge',
    category: 'plucked',
    preview: RAST_PATH,
    description:
      'Palm-muted nylon plucks, levelled, with a follower a fifth up and then another an octave down, half a second apart.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon pizzicato',
      params: { volume: 4.5, tone: 0.5, position: 0.3, nail: 0.2, sustain: 1.2, release: 0.3 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 30, outputGain: -8 } },
      {
        deviceId: 'canon',
        preset: 'Canon at the fifth',
        params: { followers: 2, gap: 0.5, interval1: 7, interval2: -12, tone: 4000, mix: 0.4 },
      },
    ],
  },
  {
    id: 'paths-of-a-maqam-open-strings-remember',
    name: 'Open strings remember',
    category: 'plucked',
    preview: BAYATI_FROM_D,
    description:
      'Steel strings left ringing, with four wide sympathetic strings tuned to D, A and F that answer for nine seconds.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: {
        volume: -16,
        body: 0.3,
        position: 0.3,
        nail: 0.25,
        sustain: 3,
        release: 2,
        tone: 0.45,
      },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Learn and hold',
        params: { root: 2, mode: 1, strings: 0, sympathy: 0.5, decay: 9, mix: 0.6, width: 1 },
      },
    ],
  },
  {
    id: 'paths-of-a-maqam-sleeve-across-strings',
    name: 'Sleeve across strings',
    category: 'pad',
    preview: BAYATI_CHANT,
    description:
      'Nylon notes with the pluck removed by a swell, lifted from below and carried out on an open space of fourteen seconds.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: { volume: -8, tone: 0.35, release: 8 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 300 } },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { makeup: 18, mix: 0.8 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 14, mix: 0.5 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-turning-lamp-lute',
    name: 'Turning lamp lute',
    category: 'plucked',
    preview: BAYATI_FROM_D,
    description:
      'A bare steel string with no box under it, sent through slow rotors heard from across the room.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bare string',
      params: { volume: -3, tone: 0.9, sustain: 5, release: 1 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Across the room' }],
  },
  {
    id: 'paths-of-a-maqam-shellac-evening',
    name: 'Shellac evening',
    category: 'plucked',
    preview: BAYATI_FROM_D,
    description:
      'A hard-picked nylon lute on a worn fast disc: narrow, crackling, with the slow pitch bend of a warped side.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { volume: 2.5, nail: 0.9, position: 0.15, sustain: 2.2, release: 0.6, tone: 0.7 },
    },
    effects: [{ deviceId: 'vinyl', preset: 'Ballroom 78', params: { pops: 0.1, crackle: 0.35 } }],
  },
  {
    id: 'paths-of-a-maqam-paired-courses-adrift',
    name: 'Paired courses adrift',
    category: 'plucked',
    preview: RAST_STACKED,
    description:
      'Soft twelve-string drifting against itself, pulled slowly in and out of tune by a deep three-voice chorus in a dark hall.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve drift',
      params: { volume: 1, body: 0.9, nail: 0.1, tone: 0.3, release: 4 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'paths-of-a-maqam-three-quarter-sigh',
    name: 'Three-quarter sigh',
    category: 'texture',
    preview: BAYATI_FROM_D,
    description:
      'Dark wooden plucks whose fragments each slide three quarters of a tone down as they fade, wide and slow.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: { volume: 2, tone: 0.25, sustain: 4, release: 2 },
    },
    effects: [
      {
        deviceId: 'falling',
        preset: 'Slow sighs',
        params: { fall: -1.5, size: 1300, density: 2, mix: 0.62 },
      },
    ],
  },
  {
    id: 'paths-of-a-maqam-noon-on-brass',
    name: 'Noon on brass',
    category: 'plucked',
    preview: RAST_PATH,
    description:
      'A glassy pick on ringing steel with sparks an octave, a twelfth and two octaves up thrown off it, held by a limiter.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Glass pick',
      params: { volume: -8, sustain: 6, release: 4 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Glitter', params: { mix: 0.4, density: 18 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -8 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'paths-of-a-maqam-frame-drum-fingers',
    name: 'Frame drum fingers',
    category: 'plucked',
    preview: QAFLA,
    description:
      'Very short muted strings knocked through a low drum body, then given a soft pulse in the middle of their tone.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: { volume: 6, body: 1, position: 0.35, nail: 0.2, tone: 0.25, release: 0.12 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { mix: 0.6, size: 1.5 } },
      { deviceId: 'band-pulse', preset: 'Six a second' },
    ],
  },
  {
    id: 'paths-of-a-maqam-lute-keeps-its-drone',
    name: 'Lute keeps its drone',
    category: 'plucked',
    preview: SIKAH_CLOSES,
    description:
      'A short, levelled nylon lute with what it plays caught and held as a dark gliding bed that lasts under the tune.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon pizzicato',
      params: {
        body: 0.6,
        position: 0.16,
        nail: 0.9,
        sustain: 1.8,
        release: 0.5,
        tone: 0.8,
        volume: 6,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -8.5 } },
      { deviceId: 'sustainer', preset: 'Dark bed', params: { mix: 0.5 } },
    ],
  },

  // Clarinet: the double reed first, then reeds from a wedding outdoors to a breath with no tone.
  {
    id: 'paths-of-a-maqam-apricot-wood',
    name: 'Apricot wood',
    category: 'wind',
    preview: BAYATI_DOUBLED,
    description:
      'A soft wide-bored double reed, dark and slow to speak, with a singing vibrato in a long dark hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { bore: 0.4, blow: 0.28, breath: 0.35, attack: 0.16, release: 0.6, vibrato: 0.7 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.5 } }],
  },
  {
    id: 'paths-of-a-maqam-second-reed-lags',
    name: 'Second reed lags',
    category: 'wind',
    preview: QAFLA,
    description:
      'A plain reed shadowed an octave below by a follower a quarter of a second late, both with the edge taken off.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { bore: 0.2, blow: 0.5, breath: 0.2, attack: 0.07, release: 0.2, vibrato: 0.1 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Octave shadow',
        params: { gap: 0.25, interval1: -12, tone: 2500, fade: 0, mix: 0.5 },
      },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'paths-of-a-maqam-wedding-from-the-roof',
    name: 'Wedding from the roof',
    category: 'wind',
    preview: BAYATI_DOUBLED,
    description:
      'A loud bright conical reed with some growl, driven and thrown through a horn loudspeaker some way off across the roofs.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: {
        volume: -2,
        blow: 1,
        breath: 0.1,
        attack: 0.02,
        release: 0.1,
        vibrato: 0.45,
        growl: 0.4,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Station platform', params: { drive: 0.6, treble: -0.3 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-reed-begins-nowhere',
    name: 'Reed begins nowhere',
    category: 'wind',
    preview: RAST_DRONE,
    description:
      'A reed that takes over a second to arrive and longer to leave, its line breathing in and out of a large tank.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { attack: 1.1, release: 1.5, blow: 0.35, bore: 0.05 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing' }],
  },
  {
    id: 'paths-of-a-maqam-half-flat-leans-late',
    name: 'Half flat leans late',
    category: 'wind',
    preview: LEANING_PIPE,
    description:
      'A straight half-conical reed whose held notes begin still and sway more the longer they last, close and almost dry.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: {
        volume: 0.5,
        blow: 0.8,
        vibrato: 0,
        bore: 0.3,
        breath: 0.05,
        attack: 0.06,
        release: 0.35,
      },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { wait: 300, depth: 55, swell: 0.6 } },
      { deviceId: 'distance', preset: 'Close mic' },
    ],
  },
  {
    id: 'paths-of-a-maqam-throat-in-the-pipe',
    name: 'Throat in the pipe',
    category: 'wind',
    preview: BAYATI_FROM_ABOVE,
    description:
      'A conical reed growling as it is blown, dark fuzz laid over it and the treble turned well down.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: { bore: 0.8, blow: 0.55, growl: 0.85, vibrato: 0.1, attack: 0.15 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Dark fuzz', params: { mix: 0.6 } }],
  },
  {
    id: 'paths-of-a-maqam-hum-behind-the-singer',
    name: 'Hum behind the singer',
    category: 'drone',
    preview: RAST_DRONE,
    description:
      'An almost unblown reed hum, pipes an octave below and a fifth above it added slowly, for holding the notes of a drone.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { attack: 0.8, release: 2.5, breath: 0.02 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Open fifths',
        params: { speak: 900, sub: 0.6, fifth: 0.5, mix: 0.7 },
      },
    ],
  },
  {
    id: 'paths-of-a-maqam-night-shift-tenor',
    name: 'Night shift tenor',
    category: 'wind',
    preview: BAYATI_FROM_ABOVE,
    description:
      'A breathy tenor reed, more air than tone, dropped through a dark single spring with the drip turned down.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { breath: 1, blow: 0.12, vibrato: 0.4, attack: 0.13 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.4, decay: 3 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-two-pipes-tied-together',
    name: 'Two pipes tied together',
    category: 'wind',
    preview: BAYATI_FROM_ABOVE,
    description:
      'A hard-tongued reed beating against copies a third of a semitone sharp on one side and flat on the other, cut short.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { volume: 1.5, bore: 0, blow: 0.95, breath: 0, attack: 0.02, release: 0.06 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider', params: { detune: 34, mix: 0.5, focus: 60 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-clay-jar-answers',
    name: 'Clay jar answers',
    category: 'wind',
    preview: BAYATI_FROM_ABOVE,
    description:
      'A whisper of reed blown across a big clay pot, so most of what is heard is the air inside the jar.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { volume: -2, attack: 0.12, release: 0.8, blow: 0.2, breath: 0.9 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.9, air: 0.4 } }],
  },
  {
    id: 'paths-of-a-maqam-steps-left-standing',
    name: 'Steps left standing',
    category: 'wind',
    preview: QAFLA,
    description:
      'A reed with a three-second fade, filtered so that notes shared with a moment ago hang on and passing ones thin out.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Slow fade reed',
      params: { volume: -1, blow: 0.45, release: 3, attack: 0.1, vibrato: 0.2 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Long hold' },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  {
    id: 'paths-of-a-maqam-fluttered-cadence',
    name: 'Fluttered cadence',
    category: 'wind',
    preview: QAFLA,
    description:
      'A flutter-tongued reed on a seasick reel: the tape slows and recovers under every held note.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { blow: 0.3, breath: 0.4, attack: 0.08, release: 0.5, growl: 0.7 },
    },
    effects: [{ deviceId: 'tape', preset: 'Seasick' }],
  },

  // Bow: spike fiddles, a low body, plucked strings and one held by a sustainer.
  {
    id: 'paths-of-a-maqam-fiddle-upright-on-a-knee',
    name: 'Fiddle upright on a knee',
    category: 'string',
    preview: QAFLA,
    description:
      'A thin bowed string pressed hard by the bridge, reedy, with its only room a stretched drum skin under it.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: {
        attack: 0.12,
        release: 0.5,
        brightness: 0.7,
        body: 0.15,
        pressure: 0.8,
        vibrato: 0.35,
        detune: 0,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { size: 0.6, mix: 0.45, width: 0 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-one-string-storyteller',
    name: 'One string storyteller',
    category: 'string',
    preview: BAYATI_FROM_ABOVE,
    description:
      'One dull bowed string with no vibrato of its own; a slow one grows on the long notes, and the bass is filtered off.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.14,
        release: 0.4,
        brightness: 0.2,
        position: 0.2,
        pressure: 0.9,
        body: 0.3,
        vibrato: 0,
      },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { depth: 40 } },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  {
    id: 'paths-of-a-maqam-arrival-on-low-a',
    name: 'Arrival on low A',
    category: 'string',
    preview: BAYATI_LOW,
    description:
      'A big-bodied low bow with one octave added underneath, dark, in a hall whose lows die away first.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 0.25, release: 0.6, brightness: 0.25, body: 1, pressure: 0.4 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0, sub1: 0.5, filter: 500 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { lowDecay: 1.2, midDecay: 4, mix: 0.4 },
      },
    ],
  },
  {
    id: 'paths-of-a-maqam-silk-by-the-fingerboard',
    name: 'Silk by the fingerboard',
    category: 'string',
    preview: LEANING_PIPE,
    description:
      'A bow with no weight far from the bridge, airy and plain, under a thin bright haze that blurs each change.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { volume: -2.5, attack: 0.2, release: 1.2, position: 0.5, brightness: 0.35, body: 0 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Bright haze', params: { mix: 0.6 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'paths-of-a-maqam-takht-of-violins',
    name: 'Takht of violins',
    category: 'string',
    preview: BAYATI_DOUBLED,
    description:
      'A section of bows twenty-five cents apart with a wide vibrato, thickened again by a flock of sixteen.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: { attack: 0.18, release: 1, brightness: 0.75, vibrato: 0.8, vibratoRate: 5.5 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Thick ensemble' }],
  },
  {
    id: 'paths-of-a-maqam-plucked-under-the-bow',
    name: 'Plucked under the bow',
    category: 'plucked',
    preview: BAYATI_FROM_D,
    description:
      'A damped pizzicato with a full body and no ring, in a three-head tape echo that dots each note along.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { brightness: 0.2, decay: 0.9, position: 0.3 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive' },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-wire-drawn-to-g',
    name: 'Wire drawn to G',
    category: 'plucked',
    preview: RAST_PATH,
    description:
      'A long wire plucked near its end, slightly doubled, and swept by a slow hollow comb with negative feedback.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: {
        volume: -5,
        brightness: 1,
        decay: 9,
        release: 2.5,
        position: 0.05,
        body: 0.1,
        detune: 10,
      },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow', params: { rate: 0.12, feedback: -55 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-string-that-stays-awake',
    name: 'String that stays awake',
    category: 'drone',
    preview: RAST_DRONE,
    description:
      'A sustained string climbing into its octave, the sustain pushed to the edge and sent through a slow phasing swirl.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 0.8, release: 2.5, pressure: 1, brightness: 0.55, vibrato: 0.1 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.12 } }],
  },
  {
    id: 'paths-of-a-maqam-swell-from-the-fourth',
    name: 'Swell from the fourth',
    category: 'string',
    preview: BAYATI_CHANT,
    description:
      'Plucked strings faded in as if by a pedal, then blurred into a dark wash where each pitch outlives its note.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { volume: 1, attack: 0.35, release: 3, brightness: 0.9, position: 0.06, detune: 18 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.7 } }],
  },
  {
    id: 'paths-of-a-maqam-fiddle-in-the-cupboard',
    name: 'Fiddle in the cupboard',
    category: 'string',
    preview: BAYATI_FROM_ABOVE,
    description:
      'A quick sustained string with a fast vibrato, played by a small combo amplifier shut in a dead cupboard.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Quick sustain',
      params: {
        attack: 0.02,
        vibrato: 0.7,
        vibratoRate: 7,
        brightness: 0.5,
        position: 0.35,
        pressure: 0.15,
      },
    },
    effects: [{ deviceId: 're-amp', preset: 'In the cupboard', params: { drive: 0.45 } }],
  },
  {
    id: 'paths-of-a-maqam-glass-in-the-half-flat',
    name: 'Glass in the half flat',
    category: 'string',
    preview: UPPER_RAST,
    description:
      'A glassy bow with almost no pressure and a pure sine redrawn over each of its partials an octave up.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.2, release: 1.2, brightness: 1, position: 0.03 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.55, attack: 150 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-still-point-of-sikah',
    name: 'Still point of Sikah',
    category: 'drone',
    preview: SIKAH_CLOSES,
    description:
      'A near-sine string with no body, vibrato or beat, then broken slowly into pulses that drift across each other.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 0.2, release: 1.5 },
    },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Soft throb',
        params: { rate: 1.9, drift: 0.4, apart: 1, floor: 0.7 },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },

  // Flute: the end-blown reed pipe, from a close whisper to a straight unbreathed tone.
  {
    id: 'paths-of-a-maqam-edge-of-the-reed-pipe',
    name: 'Edge of the reed pipe',
    category: 'wind',
    preview: LEANING_PIPE,
    description:
      'An end-blown pipe, mostly air, that leans into each note from three quarters of a tone below, in a small room.',
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: {
        breath: 0.85,
        blow: 0.35,
        chiff: 0.6,
        attack: 0.05,
        release: 0.4,
        vibrato: 0.4,
        scoop: 150,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.35 } }],
  },
  {
    id: 'paths-of-a-maqam-dervish-turns',
    name: 'Dervish turns',
    category: 'wind',
    preview: LEANING_PIPE,
    description:
      'A vibrating bamboo pipe carried round the head in a slow circle, duller as it passes behind, in a small room.',
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: { volume: -3.5, attack: 0.15, release: 1, breath: 0.5, vibrato: 0.8, scoop: 80 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'paths-of-a-maqam-hand-over-the-holes',
    name: 'Hand over the holes',
    category: 'wind',
    preview: LEANING_PIPE,
    description:
      'A plain wooden pipe, almost without breath or vibrato, boxed into a worn early sampler tone.',
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { attack: 0.05, scoop: 60, chiff: 0.4 },
    },
    effects: [{ deviceId: 'patina', preset: 'Early sampler' }],
  },
  {
    id: 'paths-of-a-maqam-before-the-call',
    name: 'Before the call',
    category: 'wind',
    preview: UPPER_RAST,
    description:
      'A hard-blown concert flute heard from a far shore with little lost from its top, then set drifting by a slow wide chorus.',
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { volume: -3.5, vibrato: 0.55, release: 0.5 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Far shore', params: { decay: 2.5, air: 0.2, level: 0.9 } },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },
  {
    id: 'paths-of-a-maqam-breath-keeps-the-drone',
    name: 'Breath keeps the drone',
    category: 'pad',
    preview: RAST_DRONE,
    description:
      'A low-flute breath pad with hardly a pitch in it, opening and closing on a slow cycle of in, hold and out.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { blow: 0.3, breath: 0.8, attack: 0.9 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Calm breath',
        params: { in: 1.4, out: 2.2, depth: 0.6, rest: 0.3 },
      },
    ],
  },
  {
    id: 'paths-of-a-maqam-row-of-cut-reeds',
    name: 'Row of cut reeds',
    category: 'wind',
    preview: UPPER_RAST,
    description:
      'Short tongued pan pipes whose attacks are pushed forward and whose air is scattered wide behind them.',
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { chiff: 1, release: 0.15, breath: 0.35, blow: 0.75 },
    },
    effects: [{ deviceId: 'sift', preset: 'Strikes forward', params: { air: 3, scatter: 1 } }],
  },
  {
    id: 'paths-of-a-maqam-low-pipe-on-a',
    name: 'Low pipe on A',
    category: 'wind',
    preview: BAYATI_FROM_ABOVE,
    description:
      'A low flute swelling a little on each note into a hall whose tail sings a vowel that keeps moving.',
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { blow: 0.55, attack: 0.15, vibrato: 0.5, release: 1.6, chiff: 0.1 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Vowel drift', params: { mix: 0.5 } }],
  },
  {
    id: 'paths-of-a-maqam-bent-pipe-dry-valley',
    name: 'Bent pipe, dry valley',
    category: 'wind',
    preview: LEANING_PIPE,
    description:
      'A pipe that bends up a whole tone into every note, with murky repeats that darken as they leave.',
    instrument: {
      deviceId: 'flute',
      preset: 'Bent from below',
      params: { release: 0.5, breath: 0.6 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Murky',
        params: { time: 520, feedback: 0.4, mix: 0.35 },
      },
    ],
  },
  {
    id: 'paths-of-a-maqam-straight-as-a-rule',
    name: 'Straight as a rule',
    category: 'wind',
    preview: UPPER_RAST,
    description:
      'A straight tone with no vibrato or scoop, so the quarter tones stand plain, over a bed that grows behind it.',
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { attack: 0.1, release: 0.4 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'String pad', params: { mix: 0.6, brightness: 2200 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-whisper-in-the-well',
    name: 'Whisper in the well',
    category: 'wind',
    preview: QAFLA,
    description:
      'Whispered pipes with more air than note at the mouth of a cistern, a long metallic ring coming up from below.',
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { attack: 0.12, release: 0.8, blow: 0.2 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Cistern' }],
  },
  {
    id: 'paths-of-a-maqam-wood-rises-at-dawn',
    name: 'Wood rises at dawn',
    category: 'pad',
    preview: RAST_DRONE,
    description:
      'A wooden pipe taking over a second to fill, with a tail that climbs by fifths out of the held drone.',
    instrument: {
      deviceId: 'flute',
      preset: 'Slow wood swell',
      params: { volume: -13.5, attack: 1.2, release: 3 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.45 } }],
  },

  // Choir: the drone singers, one who leans, and a room of people answering.
  {
    id: 'paths-of-a-maqam-men-hold-the-a',
    name: 'Men hold the A',
    category: 'voice',
    preview: BAYATI_CHANT,
    description:
      'Low closed voices with no vibrato, an overtone whistled slowly out of them by a resonance tuned to A.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { volume: -3.5, vowel: 0.7, attack: 0.3, release: 1.6, tone: 5000, motion: 0.05 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'Thin drone',
        params: { root: 9, pace: 0.4, glide: 1200 },
      },
    ],
  },
  {
    id: 'paths-of-a-maqam-one-voice-ornamented',
    name: 'One voice, ornamented',
    category: 'voice',
    preview: BAYATI_FROM_ABOVE,
    description:
      'A single singer close by, quick to speak, with a wide fast vibrato and one warm echo a third of a second behind.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: {
        volume: -5,
        vowel: 0.12,
        attack: 0.04,
        release: 0.25,
        vibrato: 45,
        vibratoRate: 6.4,
        breath: 0.05,
        tone: 4500,
        width: 0.1,
        voice: 1,
      },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Single slap', params: { time: 330, mix: 0.3 } }],
  },
  {
    id: 'paths-of-a-maqam-neutral-third-sung',
    name: 'Neutral third, sung',
    category: 'voice',
    preview: RAST_STACKED,
    description:
      'Open voices on eh from bass to soprano, no vibrato, so the half-flat thirds sit still, in a long airy hall.',
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: {
        vowel: 0.33,
        vibrato: 0,
        motion: 0,
        ensemble: 0.2,
        attack: 0.3,
        release: 1,
        breath: 0,
        width: 1,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail' }],
  },
  {
    id: 'paths-of-a-maqam-hums-through-a-wall',
    name: 'Hums through a wall',
    category: 'voice',
    preview: RAST_DRONE,
    description:
      'A humming choir with everything above a low murmur removed, coming from next door.',
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { volume: -4.5, tone: 450, attack: 0.6, release: 2 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door' },
      { deviceId: 'ambient-comp', preset: 'Lift' },
    ],
  },
  {
    id: 'paths-of-a-maqam-crowd-says-ah',
    name: 'Crowd says ah',
    category: 'voice',
    preview: SIKAH_CLOSES,
    description:
      'Short breathy voices answering themselves backwards and at half speed out of the last quarter of a minute.',
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: { volume: -4.5, breath: 0.7, ensemble: 1, release: 0.5, attack: 0.03 },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Backwards', params: { mix: 0.55 } }],
  },
  {
    id: 'paths-of-a-maqam-breath-between-verses',
    name: 'Breath between verses',
    category: 'texture',
    preview: BAYATI_CHANT,
    description:
      'Nearly unvoiced breath that keeps the pitch of the chant, its quiet air turned up until it stands in front.',
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 0.3, release: 1.5, motion: 0.2, vowel: 0.5, voice: 0.95 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Air' },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'paths-of-a-maqam-boys-in-the-gallery',
    name: 'Boys in the gallery',
    category: 'voice',
    preview: UPPER_RAST,
    description:
      'High oo voices with a round vowel pressed on them again, each note split into bands that arrive from low to high.',
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { volume: -2.5, vibrato: 0, attack: 0.15, release: 0.8 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel' },
      { deviceId: 'prism', preset: 'Low to high', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-basses-on-one-vowel',
    name: 'Basses on one vowel',
    category: 'voice',
    preview: BAYATI_CHANT,
    description:
      'A few bass voices with the body of the sound enlarged around the same notes, narrow, dry and near.',
    instrument: {
      deviceId: 'choir',
      preset: 'Basses ah',
      params: { vowel: 0.16, attack: 0.2, release: 0.5, vibrato: 3, ensemble: 0.3, width: 0.2 },
    },
    effects: [{ deviceId: 'size', preset: 'Giant', params: { size: 0.7 } }],
  },
  {
    id: 'paths-of-a-maqam-lament-wavers',
    name: 'Lament wavers',
    category: 'voice',
    preview: BAYATI_FROM_ABOVE,
    description:
      'Voices in a slow wide waver, each phrase sagging in pitch and darkening the longer its tail rings.',
    instrument: {
      deviceId: 'choir',
      preset: 'Slow waver',
      params: { volume: -4, attack: 0.2, release: 1, vibrato: 60, vowel: 0.75, ensemble: 0.1 },
    },
    effects: [{ deviceId: 'melt', preset: 'Slow melt', params: { mix: 0.55 } }],
  },
  {
    id: 'paths-of-a-maqam-rooftops-join-in',
    name: 'Rooftops join in',
    category: 'voice',
    preview: RAST_DRONE,
    description:
      'Thin ee voices and a following wind: gusts open and close their level and tone and add a little of their own air.',
    instrument: {
      deviceId: 'choir',
      preset: 'Breathy ee',
      params: { volume: -5.5, width: 1, ensemble: 1, breath: 0.4, tone: 7000, attack: 0.4 },
    },
    effects: [{ deviceId: 'weather', preset: 'Breezy day', params: { force: 0.8, pace: 2 } }],
  },

  // Harp: strings that press up into the note, and strings that only ring.
  {
    id: 'paths-of-a-maqam-pressed-from-below',
    name: 'Pressed from below',
    category: 'plucked',
    preview: BAYATI_FROM_D,
    description:
      'Koto strings pressed up three quarters of a tone, half damped on release, with a wide dark plate around them.',
    instrument: {
      deviceId: 'harp',
      preset: 'Rising koto',
      params: { volume: 6, bend: 150, decay: 1.4, damp: 0.35, halo: 0.45 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate' }],
  },
  {
    id: 'paths-of-a-maqam-lyre-kept-short',
    name: 'Lyre kept short',
    category: 'plucked',
    preview: RAST_PATH,
    description:
      'A lyre plucked by the board and stopped early, worn a little by a clean reel and dotted by a soft delay.',
    instrument: {
      deviceId: 'harp',
      preset: 'Short dry pluck',
      params: { volume: 0, pluck: 0.06, touch: 0.45, body: 0.9, decay: 0.6, damp: 0.6 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -8 } },
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-fan-of-four-strings',
    name: 'Fan of four strings',
    category: 'plucked',
    preview: RAST_STACKED,
    description:
      'Each chord drawn across soft harp strings over a second and a half, then lit by slow stars two octaves up.',
    instrument: {
      deviceId: 'harp',
      preset: 'Slow rolled chord',
      params: { volume: -1, halo: 0.4, body: 0.5, touch: 0.5 },
    },
    effects: [{ deviceId: 'glints', preset: 'Slow stars', params: { density: 2.5, mix: 0.45 } }],
  },
  {
    id: 'paths-of-a-maqam-steel-in-the-noon-sun',
    name: 'Steel in the noon sun',
    category: 'plucked',
    preview: SIKAH_CLOSES,
    description:
      'Steel strings plucked at the very end and lightly damped, with rising bands of light passing up through them.',
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { volume: 1.5, decay: 3, damp: 0.3, bend: 0 },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Rising ripple', params: { rate: 1.1, depth: 0.9 } }],
  },
  {
    id: 'paths-of-a-maqam-dark-lyre-underfoot',
    name: 'Dark lyre underfoot',
    category: 'plucked',
    preview: BAYATI_LOW,
    description:
      'A hollow harp plucked in the middle by soft fingers, an octave below added late and slow beneath the line.',
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: -14, decay: 0.9, damp: 0.3 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals', params: { sub2: 0, sub1: 0.9 } },
      { deviceId: 'lift', preset: 'Long tails' },
    ],
  },
  {
    id: 'paths-of-a-maqam-turns-caught-in-a-loop',
    name: 'Turns caught in a loop',
    category: 'plucked',
    preview: QAFLA,
    description:
      'Koto plucks, limited, over three loops of unequal length that keep bringing the turn back out of step with itself.',
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { volume: 6, damp: 0.2, decay: 0.9, touch: 0.25 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -8.5 } },
      { deviceId: 'orbits', preset: 'Out of step', params: { length: 1.3, mix: 0.55 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-rings-while-dwelling',
    name: 'Rings while dwelling',
    category: 'plucked',
    preview: SIKAH_CLOSES,
    description:
      'Strings that ring only while held, in a ring of tuned metal bowls on C and G that pick up the drone.',
    instrument: {
      deviceId: 'harp',
      preset: 'Rings while held',
      params: { volume: 2.5, touch: 0.6, halo: 0.1, pluck: 0.12 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Low fifths',
        params: { root: 0, mix: 0.55, strike: 0.6, register: 0.5 },
      },
    ],
  },

  // Wind harp: the drone strings, left to the air.
  {
    id: 'paths-of-a-maqam-drone-left-outside',
    name: 'Drone left outside',
    category: 'drone',
    preview: RAST_DRONE,
    description:
      'Wind over two strings a note, strong and steady with no lulls, muffled as if the window were shut.',
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Wind harp',
      params: { wind: 0.65, gust: 0.15, lull: 0, glint: 0.2, air: 0, hum: 0.7 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-overtones-of-the-tonic',
    name: 'Overtones of the tonic',
    category: 'drone',
    preview: BAYATI_DRONE,
    description:
      'One string a note with its harmonics lit in turn by hard gusts, and an echo that skips each one across.',
    instrument: { deviceId: 'wind-harp', preset: 'Overtone ladder', params: { ring: 0.5, air: 0 } },
    effects: [{ deviceId: 'skipping-stone', preset: 'Wide rings' }],
  },
  {
    id: 'paths-of-a-maqam-fence-by-the-road',
    name: 'Fence by the road',
    category: 'texture',
    preview: BAYATI_DRONE,
    description:
      'Short rattling fence wires with a heavy hum, pushed through a transformer that thickens the low end.',
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Fence wires',
      params: { volume: -15, hum: 1, ring: 0.8, strings: 4, glint: 0.4 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.7 } }],
  },
  {
    id: 'paths-of-a-maqam-fingers-then-wind',
    name: 'Fingers, then wind',
    category: 'plucked',
    preview: SIKAH_CLOSES,
    description:
      'A plucked course of three strings with barely any wind after it, replayed in little loops at octave speeds.',
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Plucked course',
      params: { volume: -10, strings: 3, ring: 1.5, release: 1 },
    },
    effects: [{ deviceId: 'cascade', preset: 'Octave stack', params: { time: 300, mix: 0.45 } }],
  },
  {
    id: 'paths-of-a-maqam-long-calm-over-a',
    name: 'Long calm over A',
    category: 'drone',
    preview: BAYATI_DRONE,
    description:
      'Still air barely touching the strings, cold and slow, with winter turned over the sound: thin, dark and frozen.',
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Still air',
      params: { hum: 0.9, ring: 10, glint: 0.1, release: 5, width: 1 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Deep winter' }],
  },
  {
    id: 'paths-of-a-maqam-salt-wind-off-the-gulf',
    name: 'Salt wind off the gulf',
    category: 'texture',
    preview: BAYATI_DRONE,
    description:
      'Night wind that is mostly air, its bands swelling and swaying from side to side like breaking waves.',
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Night wind',
      params: { wind: 0.5, lull: 0.1, gust: 0.5 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Breaking waves', params: { depth: 0.9, sway: 0.8 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-whistle-in-the-screen',
    name: 'Whistle in the screen',
    category: 'drone',
    preview: SIKAH_CLOSES,
    description:
      'A glassy whistle of high harmonics alone, caught in a small loop of room that dissolves it into its own ringing.',
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Glass whistle',
      params: { ring: 4, width: 1, release: 4 },
    },
    effects: [{ deviceId: 'generations', preset: 'Room tone hangs' }],
  },

  // Feedback: a string that sings on for as long as the note is dwelt on.
  {
    id: 'paths-of-a-maqam-amplifier-by-the-gate',
    name: 'Amplifier by the gate',
    category: 'string',
    preview: BAYATI_FROM_ABOVE,
    description:
      'A quickly sustained gritty string with a reed-like edge, played by a horn loudspeaker close by with little room.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Reed tone',
      params: { volume: -0.5, grit: 0.8, bloom: 0.04, release: 0.2, pick: 0.3 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Station platform', params: { room: 0.1, distance: 0.2 } },
    ],
  },
  {
    id: 'paths-of-a-maqam-twelfth-above-the-tonic',
    name: 'Twelfth above the tonic',
    category: 'drone',
    preview: RAST_DRONE,
    description:
      'A clean string that blooms over a second into its twelfth, then hangs as a slowly living spectral drone.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Pure twelfth',
      params: { bloom: 1.2, release: 2.5, width: 1 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo' }],
  },
  {
    id: 'paths-of-a-maqam-plucked-barely-held',
    name: 'Plucked, barely held',
    category: 'plucked',
    preview: RAST_PATH,
    description:
      'Picked strings below the point of feedback, dark and short, with three followers behind them, one of them an octave up.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Plucked and gone',
      params: { volume: 0.5, gain: 0.15, damp: 0.75, release: 0.3, pick: 1, grit: 0 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Wide choir',
        params: { followers: 3, gap: 0.3, interval2: 12, mix: 0.4 },
      },
    ],
  },
  {
    id: 'paths-of-a-maqam-dark-hum-of-dwelling',
    name: 'Dark hum of dwelling',
    category: 'drone',
    preview: BAYATI_DRONE,
    description:
      'A dark fundamental-only sustain with no drift, laid into a short fuzz between two reverbs that swells with it.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Dark sustain',
      params: { volume: -4.5, damp: 1, bloom: 0.8, pick: 0, release: 2 },
    },
    effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { decay: 6 } }],
  },
  {
    id: 'paths-of-a-maqam-overtones-wander-home',
    name: 'Overtones wander home',
    category: 'string',
    preview: BAYATI_DRONE,
    description:
      'Strings whose overtone wanders while they fight for the amplifier, taken round a slow figure of eight.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Drifting air',
      params: { volume: -1.5, distance: 5, bloom: 0.6, crowd: 0.9, grit: 0.5, release: 1.2 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow eight' },
      { deviceId: 'ether-reverb', preset: 'Ether' },
    ],
  },

  // Thesis: whole keys only, so it holds the notes that never bend, mirrored onto each other.
  {
    id: 'paths-of-a-maqam-five-notes-that-stand',
    name: 'Five notes that stand',
    category: 'pad',
    preview: WHOLE_KEYS,
    description:
      'Noise bands in mirror around G, where C, D, F, G and A reflect onto each other and the third is never named.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: {
        center: 67,
        resonance: 70,
        attack: 0.3,
        release: 2,
        mode: 0,
        octaflipEnabled: 0,
        scale: 7,
        root: 0,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive' },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'paths-of-a-maqam-second-kept-silent',
    name: 'Second kept silent',
    category: 'pad',
    preview: WHOLE_KEYS,
    description:
      'Breathing noise bands mirrored around B in A minor, the note Bayati flattens, with octaves and a wide dark haze.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Drifting Minor',
      params: {
        center: 59,
        resonance: 18,
        attack: 0.8,
        release: 4,
        mode: 1,
        breatheRate: 0.5,
        width: 100,
        scale: 1,
        root: 9,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive' },
      { deviceId: 'fog', preset: 'Dark bank' },
    ],
  },
  {
    id: 'paths-of-a-maqam-strummed-upper-cell',
    name: 'Strummed upper cell',
    category: 'plucked',
    preview: WHOLE_KEYS,
    description:
      'Short strummed chords of noise around the G above middle C, rung into bowls in fifths on C that keep the drone.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Strummed Lydian',
      params: {
        center: 67,
        resonance: 100,
        attack: 0.01,
        release: 0.6,
        strum: 70,
        middleEnabled: 0,
        scale: 7,
        root: 0,
        width: 30,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive' },
      {
        deviceId: 'bowls',
        preset: 'Low fifths',
        params: { root: 0, ring: 12, register: 0.6, mix: 0.5, strike: 0.6 },
      },
    ],
  },
  {
    id: 'paths-of-a-maqam-low-mirror-of-bayati',
    name: 'Low mirror of Bayati',
    category: 'drone',
    preview: WHOLE_KEYS,
    description:
      'Narrow bands of noise mirrored around B with octave copies, under a tape that pulls the pitch slowly about.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Gravity Well',
      params: {
        center: 59,
        mode: 0,
        resonance: 90,
        attack: 0.5,
        release: 3,
        width: 40,
        strum: 0,
        middleEnabled: 0,
        scale: 1,
        root: 9,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive' },
      { deviceId: 'tape', preset: 'Seasick' },
    ],
  },

  // Rewind: the path walked the other way.
  {
    id: 'paths-of-a-maqam-path-walked-backwards',
    name: 'Path walked backwards',
    category: 'plucked',
    preview: QAFLA,
    description:
      'Short backwards plucks that rise for under half a second and break off at their strike, in a long three-spring tank.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Pluck back',
      params: { volume: -1, swell: 0.4, snap: 0.5, tone: 0.75 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring' }],
  },
  {
    id: 'paths-of-a-maqam-bowl-gathers-the-drone',
    name: 'Bowl gathers the drone',
    category: 'drone',
    preview: RAST_DRONE,
    description:
      'A bowl that gathers over a second and a half, strikes, and goes on ringing in a hall that sings low vowels.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: { volume: 5, swell: 1.5, tail: 0.9, shimmer: 0.1, tone: 0.3 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 7 } }],
  },
  {
    id: 'paths-of-a-maqam-a-piano-cannot-say-it',
    name: 'A piano cannot say it',
    category: 'keys',
    preview: RAST_STACKED,
    description:
      'Soft backwards piano tones that surge late and waver in pitch, more than half of them heard thin over a fading radio link.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Soft return',
      params: { volume: 6, swell: 0.9, rise: 0.8, wobble: 0.4 },
    },
    effects: [{ deviceId: 'radio', preset: 'Far station', params: { mix: 0.6, static: 0.15 } }],
  },
]
