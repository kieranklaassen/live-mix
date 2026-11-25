import { type FactoryPreset, type Phrase } from '../types'

// A thrush's song slowed down: one straight whistle, then a ladder of quick notes that all lie on
// the harmonic series of a root nobody sings, and the next song on another root. Whistles, glass,
// bells and pipes sing it at sixteen depths of forest, from the near branch to past hearing, and
// the overtone voice lays the root underneath, so that bird and ground are one spectrum.

// Root C: the whistle on its sixth partial (G), then 8 10 9 10 8 10 9 6, every E a pure third,
// fourteen cents low.
const SONG_ON_C: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.3, note: 79.02, gain: 0.74 },
    { atSec: 2.55, durSec: 0.36, note: 84, gain: 0.6 },
    { atSec: 2.91, durSec: 0.36, note: 87.86, gain: 0.52 },
    { atSec: 3.27, durSec: 0.36, note: 86.04, gain: 0.6 },
    { atSec: 3.63, durSec: 0.36, note: 87.86, gain: 0.52 },
    { atSec: 3.99, durSec: 0.36, note: 84, gain: 0.6 },
    { atSec: 4.35, durSec: 0.36, note: 87.86, gain: 0.52 },
    { atSec: 4.71, durSec: 0.36, note: 86.04, gain: 0.6 },
    { atSec: 5.07, durSec: 1.8, note: 79.02, gain: 0.52 },
  ],
}

// Root F: the whistle on the tenth partial (A, low by fourteen cents), then 12 15 12 10 12 9 10
// 8, down to F.
const SONG_ON_F: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.9, note: 80.86, gain: 0.74 },
    { atSec: 2.15, durSec: 0.42, note: 84.02, gain: 0.6 },
    { atSec: 2.57, durSec: 0.42, note: 87.88, gain: 0.52 },
    { atSec: 2.99, durSec: 0.42, note: 84.02, gain: 0.6 },
    { atSec: 3.41, durSec: 0.42, note: 80.86, gain: 0.52 },
    { atSec: 3.83, durSec: 0.42, note: 84.02, gain: 0.6 },
    { atSec: 4.25, durSec: 0.42, note: 79.04, gain: 0.52 },
    { atSec: 4.67, durSec: 0.42, note: 80.86, gain: 0.6 },
    { atSec: 5.09, durSec: 1.8, note: 77, gain: 0.52 },
  ],
}

// Root A, whose fifth partial is off the white keys: the whistle on eight (A), then 9 12 9 8 12 9 8 6,
// open fifths and fourths and one whole tone.
const SONG_ON_A: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.5, note: 81, gain: 0.74 },
    { atSec: 2.75, durSec: 0.36, note: 83.04, gain: 0.6 },
    { atSec: 3.08, durSec: 0.36, note: 88.02, gain: 0.52 },
    { atSec: 3.41, durSec: 0.36, note: 83.04, gain: 0.6 },
    { atSec: 3.74, durSec: 0.36, note: 81, gain: 0.52 },
    { atSec: 4.07, durSec: 0.36, note: 88.02, gain: 0.6 },
    { atSec: 4.4, durSec: 0.36, note: 83.04, gain: 0.52 },
    { atSec: 4.73, durSec: 0.36, note: 81, gain: 0.6 },
    { atSec: 5.06, durSec: 1.8, note: 76.02, gain: 0.52 },
  ],
}

// Root G: the whistle on nine (A), then rocking thirds 12 10 12 10 12 10 9 8 that settle on the
// octave.
const SONG_ON_G: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.1, note: 81.04, gain: 0.74 },
    { atSec: 2.35, durSec: 0.3, note: 86.02, gain: 0.6 },
    { atSec: 2.65, durSec: 0.3, note: 82.86, gain: 0.52 },
    { atSec: 2.95, durSec: 0.3, note: 86.02, gain: 0.6 },
    { atSec: 3.25, durSec: 0.3, note: 82.86, gain: 0.52 },
    { atSec: 3.55, durSec: 0.3, note: 86.02, gain: 0.6 },
    { atSec: 3.85, durSec: 0.3, note: 82.86, gain: 0.52 },
    { atSec: 4.15, durSec: 0.3, note: 81.04, gain: 0.6 },
    { atSec: 4.45, durSec: 2.4, note: 79, gain: 0.52 },
  ],
}

// Root D, again without its fifth partial: the whistle on eight (D), then 9 12 9 8 9 8 6 8.
const SONG_ON_D: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 86, gain: 0.74 },
    { atSec: 2.45, durSec: 0.42, note: 88.04, gain: 0.6 },
    { atSec: 2.83, durSec: 0.42, note: 93.02, gain: 0.52 },
    { atSec: 3.21, durSec: 0.42, note: 88.04, gain: 0.6 },
    { atSec: 3.59, durSec: 0.42, note: 86, gain: 0.52 },
    { atSec: 3.97, durSec: 0.42, note: 88.04, gain: 0.6 },
    { atSec: 4.35, durSec: 0.42, note: 86, gain: 0.52 },
    { atSec: 4.73, durSec: 0.42, note: 81.02, gain: 0.6 },
    { atSec: 5.11, durSec: 1.8, note: 86, gain: 0.52 },
  ],
}

// Two songs running, as the bird does it, never twice on one root: C with the whistle on six,
// then G with the whistle higher, on ten.
const TWO_SONGS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 79.02, gain: 0.74 },
    { atSec: 1.35, durSec: 0.25, note: 84, gain: 0.6 },
    { atSec: 1.6, durSec: 0.25, note: 87.86, gain: 0.52 },
    { atSec: 1.85, durSec: 0.25, note: 86.04, gain: 0.6 },
    { atSec: 2.1, durSec: 0.25, note: 84, gain: 0.52 },
    { atSec: 2.35, durSec: 0.25, note: 87.86, gain: 0.6 },
    { atSec: 2.6, durSec: 0.9, note: 79.02, gain: 0.52 },
    { atSec: 3.75, durSec: 1.2, note: 82.86, gain: 0.74 },
    { atSec: 5.1, durSec: 0.25, note: 86.02, gain: 0.6 },
    { atSec: 5.35, durSec: 0.25, note: 81.04, gain: 0.52 },
    { atSec: 5.6, durSec: 0.25, note: 82.86, gain: 0.6 },
    { atSec: 5.85, durSec: 0.25, note: 79, gain: 0.52 },
    { atSec: 6.1, durSec: 0.25, note: 81.04, gain: 0.6 },
    { atSec: 6.35, durSec: 1, note: 74.02, gain: 0.52 },
  ],
}

// The root sung as well: C held below with its third partial, and the song
// of C above: the whistle on six, then 8 9 10 8 6 8 9 10.
const SONG_OVER_C: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.1, note: 48, gain: 0.5 },
    { atSec: 0.4, durSec: 6.7, note: 67.02, gain: 0.3 },
    { atSec: 0.6, durSec: 1.8, note: 79.02, gain: 0.66 },
    { atSec: 2.6, durSec: 0.4, note: 84, gain: 0.56 },
    { atSec: 3, durSec: 0.4, note: 86.04, gain: 0.48 },
    { atSec: 3.4, durSec: 0.4, note: 87.86, gain: 0.56 },
    { atSec: 3.8, durSec: 0.4, note: 84, gain: 0.48 },
    { atSec: 4.2, durSec: 0.4, note: 79.02, gain: 0.56 },
    { atSec: 4.6, durSec: 0.4, note: 84, gain: 0.48 },
    { atSec: 5, durSec: 0.4, note: 86.04, gain: 0.56 },
    { atSec: 5.4, durSec: 1.4, note: 87.86, gain: 0.48 },
  ],
}

// F held below with its third and fifth partials, and the song of F above: the whistle on ten, then
// 12 9 10 8 6 5, down to the fifth partial as the held one lets go.
const SONG_OVER_F: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 41, gain: 0.45 },
    { atSec: 0.2, durSec: 7, note: 60.02, gain: 0.25 },
    { atSec: 0.2, durSec: 5.6, note: 68.86, gain: 0.2 },
    { atSec: 0.8, durSec: 1.7, note: 80.86, gain: 0.66 },
    { atSec: 2.6, durSec: 0.7, note: 84.02, gain: 0.56 },
    { atSec: 3.3, durSec: 0.7, note: 79.04, gain: 0.5 },
    { atSec: 4, durSec: 0.7, note: 80.86, gain: 0.56 },
    { atSec: 4.7, durSec: 0.7, note: 77, gain: 0.5 },
    { atSec: 5.4, durSec: 0.7, note: 72.02, gain: 0.52 },
    { atSec: 6.1, durSec: 1.1, note: 68.86, gain: 0.54 },
  ],
}

// Two songs an octave down, for bars, bowls and low pipes: A with the whistle on eight, then 9 12 9
// 8 6, and G with the whistle a little higher, on ten (B, low by fourteen cents), then 12 10 9 8 6.
const TWO_LOW_SONGS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.25, note: 69, gain: 0.74 },
    { atSec: 1.4, durSec: 0.34, note: 71.04, gain: 0.62 },
    { atSec: 1.72, durSec: 0.34, note: 76.02, gain: 0.54 },
    { atSec: 2.04, durSec: 0.34, note: 71.04, gain: 0.62 },
    { atSec: 2.36, durSec: 0.34, note: 69, gain: 0.54 },
    { atSec: 2.68, durSec: 0.85, note: 64.02, gain: 0.6 },
    { atSec: 3.7, durSec: 1.25, note: 70.86, gain: 0.74 },
    { atSec: 5.1, durSec: 0.34, note: 74.02, gain: 0.62 },
    { atSec: 5.42, durSec: 0.34, note: 70.86, gain: 0.54 },
    { atSec: 5.74, durSec: 0.34, note: 69.04, gain: 0.62 },
    { atSec: 6.06, durSec: 0.34, note: 67, gain: 0.54 },
    { atSec: 6.38, durSec: 0.95, note: 62.02, gain: 0.6 },
  ],
}

// The roots nobody sings, one at a time: C, F, G, D, no root twice running.
const FOUR_ROOTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 48, gain: 0.6 },
    { atSec: 1.8, durSec: 1.8, note: 41, gain: 0.62 },
    { atSec: 3.6, durSec: 1.8, note: 43, gain: 0.6 },
    { atSec: 5.4, durSec: 1.9, note: 50, gain: 0.55 },
  ],
}

// Two grounds held long enough to open: C, then F a fifth below it, as a bird would change its
// root.
const TWO_ROOTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.65, note: 48, gain: 0.6 },
    { atSec: 3.65, durSec: 3.65, note: 41, gain: 0.62 },
  ],
}

// Three chords, each cut from one series: C on 1 3 5 6 8, F on 1 4 6 9 10, G on 1 4 6 8 10. The
// same high G is the sixth partial of C, the ninth of F and the eighth of G.
const THREE_SPECTRA: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.5, note: 48, gain: 0.45 },
    { atSec: 0.06, durSec: 2.44, note: 67.02, gain: 0.36 },
    { atSec: 0.12, durSec: 2.38, note: 75.86, gain: 0.36 },
    { atSec: 0.18, durSec: 2.32, note: 79.02, gain: 0.36 },
    { atSec: 0.24, durSec: 2.26, note: 84, gain: 0.36 },
    { atSec: 2.5, durSec: 2.4, note: 41, gain: 0.45 },
    { atSec: 2.56, durSec: 2.34, note: 65, gain: 0.36 },
    { atSec: 2.62, durSec: 2.28, note: 72.02, gain: 0.36 },
    { atSec: 2.68, durSec: 2.22, note: 79.04, gain: 0.36 },
    { atSec: 2.74, durSec: 2.16, note: 80.86, gain: 0.36 },
    { atSec: 4.9, durSec: 2.4, note: 43, gain: 0.45 },
    { atSec: 4.96, durSec: 2.34, note: 67, gain: 0.36 },
    { atSec: 5.02, durSec: 2.28, note: 74.02, gain: 0.36 },
    { atSec: 5.08, durSec: 2.22, note: 79, gain: 0.36 },
    { atSec: 5.14, durSec: 2.16, note: 82.86, gain: 0.36 },
  ],
}

// Four straight whistles rising and falling by turns: 6 of C (G), 12 of F (C), 9 of G (A), 8 of
// D (D).
const FOUR_WHISTLES: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.7, note: 79.02, gain: 0.72 },
    { atSec: 1.85, durSec: 1.7, note: 84.02, gain: 0.66 },
    { atSec: 3.7, durSec: 1.7, note: 81.04, gain: 0.72 },
    { atSec: 5.55, durSec: 1.8, note: 86, gain: 0.66 },
  ],
}

// The song of C sung by the ground itself, three octaves down on the same partials, 6 then 8 10 9 10
// 8 10 9 6: a mouth held on one harmonic whistles the bird back up where it belongs.
const LOW_LADDER: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.1, note: 43.02, gain: 0.64 },
    { atSec: 2.25, durSec: 0.52, note: 48, gain: 0.6 },
    { atSec: 2.77, durSec: 0.52, note: 51.86, gain: 0.54 },
    { atSec: 3.29, durSec: 0.52, note: 50.04, gain: 0.6 },
    { atSec: 3.81, durSec: 0.52, note: 51.86, gain: 0.54 },
    { atSec: 4.33, durSec: 0.52, note: 48, gain: 0.6 },
    { atSec: 4.85, durSec: 0.52, note: 51.86, gain: 0.54 },
    { atSec: 5.37, durSec: 0.52, note: 50.04, gain: 0.6 },
    { atSec: 5.89, durSec: 1.4, note: 43.02, gain: 0.58 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // West coast: the whistle itself, plucked twigs and folded ground. Near branch first, far ridge last.
  {
    id: 'thrush-ladder-whistle-on-a-near-bough',
    name: 'Whistle on a near bough',
    category: 'wind',
    description:
      'A pure sine with a quick soft start, straight at first and swaying only when held, in a small bright plate.',
    preview: SONG_ON_C,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Sine swell',
      params: { volume: -4.5, attack: 0.03, decay: 0.35, colour: 0.6, drift: 0.1 },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        preset: 'Long patience',
        params: { wait: 900, grow: 1500, depth: 18, rate: 4.6 },
      },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { decay: 0.4, mix: 0.18 } },
    ],
  },
  {
    id: 'thrush-ladder-through-the-beech-trunks',
    name: 'Through the beech trunks',
    category: 'wind',
    description:
      'A faintly folded whistle that fades in over a sixth of a second, sounded in a long open pipe of wood.',
    preview: SONG_ON_F,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Sine swell',
      params: { volume: -8, fold: 0.12, attack: 0.16, decay: 0.7, colour: 0.75, drift: 0.15 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Inside a pipe',
        params: { size: 2, material: 0.35, air: 0.05, mix: 0.6 },
      },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'thrush-ladder-fledgling-on-the-rail',
    name: 'Fledgling on the rail',
    category: 'plucked',
    description:
      'A round, short mallet tone answered once by a soft tape slap a quarter of a second behind it.',
    preview: SONG_ON_A,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { volume: 2.5, decay: 0.5, colour: 0.65, fm: 0.12, timbreEnv: 0.4 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 250, mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { body: 2 } },
    ],
  },
  {
    id: 'thrush-ladder-dew-on-the-top-rung',
    name: 'Dew on the top rung',
    category: 'bell',
    description:
      'A glass bell with its modulator on the third partial, so its colour stays in the series, in a bright hall.',
    preview: SONG_ON_G,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Glass bell',
      params: { volume: -2.5, ratio: 4, fm: 0.3, decay: 2.2, colour: 1 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { midDecay: 2.6, mix: 0.32 } },
      { deviceId: 'spread', preset: 'Air only' },
    ],
  },
  {
    id: 'thrush-ladder-chimes-in-the-hemlocks',
    name: 'Chimes in the hemlocks',
    category: 'bell',
    description:
      'Small chimes cut short and darkened, far inside a twelve second room that starts late.',
    preview: TWO_SONGS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Small chimes',
      params: { volume: 4.5, decay: 0.9, colour: 0.6, fm: 0.35 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Late arrival',
        params: { decay: 12, damping: 0.7, breathDepth: 0, mix: 0.55 },
      },
    ],
  },
  {
    id: 'thrush-ladder-hollow-log-answers',
    name: 'Hollow log answers',
    category: 'plucked',
    description:
      'A knocked hollow tone let ring for a second inside a drum-shaped body, with a few dark echoes.',
    preview: TWO_LOW_SONGS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow bongo',
      params: { volume: 1.5, decay: 1, fm: 0.3, colour: 0.35, chance: 0.05 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { mix: 0.5 } },
      {
        deviceId: 'analog-delay',
        preset: 'Murky',
        params: { time: 420, feedback: 0.35, modDepth: 0.1, mix: 0.28 },
      },
    ],
  },
  {
    id: 'thrush-ladder-tapping-beside-the-song',
    name: 'Tapping beside the song',
    category: 'plucked',
    description:
      'Folded taps of a third of a second, their length left partly to chance, rung through one slack spring.',
    preview: SONG_ON_D,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Rain on wood',
      params: { volume: -2.5, attack: 0.004, decay: 0.3, chance: 0.5, fold: 0.4, fm: 0.08 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Single slack coil', params: { drip: 0.2, mix: 0.3 } },
      {
        deviceId: 'fet-limiter',
        preset: 'Gentle lift',
        params: { inputGain: 8, outputGain: -3.5 },
      },
    ],
  },
  {
    id: 'thrush-ladder-slow-syrinx',
    name: 'Slow syrinx',
    category: 'pad',
    description:
      'Chords that brighten as they swell for most of a second, their bands drifting apart in a fourteen second space.',
    preview: THREE_SPECTRA,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Slow bloom',
      params: { attack: 0.9, fold: 0.25, fm: 0.1 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Gentle drift' },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 14, highCut: 5200, mix: 0.4 } },
    ],
  },
  {
    id: 'thrush-ladder-root-under-the-litter',
    name: 'Root under the litter',
    category: 'drone',
    description:
      'A folding drone kept under about seven hundred hertz by a slow low-pass: the ground no bird sings.',
    preview: TWO_ROOTS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folding drone',
      params: { attack: 0.8, fold: 0.5, drift: 0.4 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { cutoffHz: 700, resonance: 0.8, lfoAmount: 20 },
      },
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
    ],
  },
  {
    id: 'thrush-ladder-both-sides-of-the-throat',
    name: 'Both sides of the throat',
    category: 'organ',
    description:
      'One whistle made two, the way a bird sings with both halves of its voice: the tone and a twelfth above it.',
    preview: SONG_OVER_F,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Sine swell',
      params: { volume: -9, attack: 0.06, decay: 0.9, colour: 0.5 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Flute stops',
        params: { sub: 0, octave: 0.1, twelfth: 0.8, fifteenth: 0, speak: 60, mix: 0.7 },
      },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'thrush-ladder-creek-below-the-singer',
    name: 'Creek below the singer',
    category: 'plucked',
    description:
      'A soft mallet just under moving water, a little muffled and swaying, with bubbles off every stroke.',
    preview: SONG_ON_F,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { volume: 1, decay: 2.4, colour: 0.8, fold: 0.25 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Sunlit shallows', params: { bubbles: 0.6, depth: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'thrush-ladder-cloud-in-the-spruce-tops',
    name: 'Cloud in the spruce tops',
    category: 'pad',
    description:
      'Hollow pipes with their starts blurred to nothing by fog, in a dark hall with a slow low end.',
    preview: THREE_SPECTRA,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow pipes',
      params: { volume: -4.5, attack: 0.25, fm: 0.18, colour: 0.4 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack' },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { lowDecay: 5, midDecay: 4, mix: 0.4 },
      },
    ],
  },
  {
    id: 'thrush-ladder-reed-bed-before-light',
    name: 'Reed bed before light',
    category: 'organ',
    description:
      'Folded reeds with the top taken off and the body raised, thickened by a loose double.',
    preview: THREE_SPECTRA,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folded reeds',
      params: { volume: -10, fold: 0.45, attack: 0.2, colour: 0.4, symmetry: 0.7 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { body: 3, highCut: 4200 } },
      { deviceId: 'chorus', preset: 'Loose double' },
    ],
  },
  {
    id: 'thrush-ladder-bark-harp',
    name: 'Bark harp',
    category: 'plucked',
    description:
      'A bright folded harp plucked over strings tuned to C, which go on sounding the root of the song.',
    preview: SONG_OVER_C,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Bright harp',
      params: { decay: 1.6, fold: 0.4 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Open triad', params: { root: 0, decay: 7, mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { highCut: 7000 } },
    ],
  },
  {
    id: 'thrush-ladder-thumb-on-a-twig',
    name: 'Thumb on a twig',
    category: 'plucked',
    description:
      'A short buzzing thumb-piano tone that skips away in nine closer and closer echoes.',
    preview: SONG_ON_D,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Thumb piano',
      params: { volume: 4.5, decay: 0.35, colour: 0.75, fm: 0.2 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Skipping stone',
        params: { skips: 9, first: 260, mix: 0.35 },
      },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'thrush-ladder-gorge-gong',
    name: 'Gorge gong',
    category: 'bell',
    description:
      'A long dark gong in a two-to-one ratio, rolled into a cavern of short echoes whose size slowly wanders.',
    preview: SONG_OVER_F,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Long gong',
      params: { ratio: 3, fm: 0.5, attack: 0.02, decay: 4 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        preset: 'Slow stretch',
        params: { stretch: 0.4, steps: 0, mix: 0.4 },
      },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'thrush-ladder-four-round-stones',
    name: 'Four round stones',
    category: 'bass',
    description:
      'A plain struck tone for the unsung roots, rung in a large wooden body and pushed through warm iron.',
    preview: FOUR_ROOTS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Thumb piano',
      params: {
        ratio: 1,
        fm: 0.12,
        fold: 0.1,
        symmetry: 0.1,
        timbreEnv: 0.4,
        decay: 2.2,
        colour: 0.45,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 1.8, mix: 0.6 } },
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.4, highCut: 3500 } },
    ],
  },
  {
    id: 'thrush-ladder-song-seen-through-rain',
    name: 'Song seen through rain',
    category: 'bell',
    description:
      'High chimes rung long in steady light rain, which pulls their level and tone about a little.',
    preview: TWO_SONGS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Small chimes',
      params: { volume: -6, decay: 4, fm: 0.7, colour: 0.85 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Light rain', params: { voice: 0.3 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'thrush-ladder-pulse-of-the-bog',
    name: 'Pulse of the bog',
    category: 'drone',
    description:
      'A deep sustained tone throbbing a little over twice a second, the pulse spread between the ears.',
    preview: TWO_ROOTS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Deep pulse',
      params: { volume: -3.5, attack: 0.3, sustain: 0.9, colour: 0.35 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 2.2, depth: 0.6, phase: 90 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'thrush-ladder-last-light-one-whistle',
    name: 'Last light, one whistle',
    category: 'pad',
    description:
      'A sine that takes over half a second to arrive, with a faint octave climbing out of its eighteen second tail.',
    preview: FOUR_WHISTLES,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Sine swell',
      params: { volume: -8, attack: 0.6, decay: 2.5, colour: 0.3, drift: 0.6 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Faint glimmer',
        params: { decay: 18, shimmer: 0.35, mix: 0.5 },
      },
    ],
  },
  {
    id: 'thrush-ladder-mirror-in-the-pool',
    name: 'Mirror in the pool',
    category: 'bell',
    description:
      'A dull glass bell of a second and a half, and the ladder played backwards at it out of the water.',
    preview: SONG_ON_C,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Glass bell',
      params: { volume: 0, fm: 0.4, ratio: 3, decay: 1.4, colour: 0.5 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Slow swells',
        params: { time: 1100, feedback: 0.3, mix: 0.45 },
      },
      { deviceId: 'ambient-eq', preset: 'Open', params: { highCut: 8000 } },
    ],
  },
  {
    id: 'thrush-ladder-wooden-throat',
    name: 'Wooden throat',
    category: 'plucked',
    description:
      'A woody pluck moved well back among the trees: duller, narrower, with more of the clearing round it.',
    preview: SONG_ON_A,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { volume: 5, decay: 0.9, fold: 0.5, chance: 0.1 },
    },
    effects: [
      {
        deviceId: 'distance',
        preset: 'Across the room',
        params: { distance: 0.6, room: 0.8, decay: 2.5 },
      },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'thrush-ladder-light-between-branches',
    name: 'Light between branches',
    category: 'plucked',
    description:
      'A folded pluck split into twelve colours that arrive one after another, low to high, and fan out as they repeat.',
    preview: SONG_ON_G,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Bright harp',
      params: { volume: -1, attack: 0.004, decay: 1, fold: 0.7, symmetry: 0.5, fm: 0 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { time: 900, feedback: 0.5, mix: 0.5 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { outputGain: -8 } },
    ],
  },

  // Overtone: the ground. A low root is held and its own mouth sings the partial.
  {
    id: 'thrush-ladder-throat-ground',
    name: 'Throat ground',
    category: 'drone',
    description:
      'A throat held on the root with its mouth loose on the sixth partial, dry but for a small dark plate.',
    preview: FOUR_ROOTS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Throat song',
      params: {
        volume: -4.5,
        overtone: 6,
        focus: 0.3,
        wander: 0,
        growl: 0.05,
        vibrato: 0.05,
        attack: 0.15,
        release: 0.6,
      },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { decay: 0.45, mix: 0.2 } },
    ],
  },
  {
    id: 'thrush-ladder-sixth-rung-of-the-root',
    name: 'Sixth rung of the root',
    category: 'voice',
    description:
      'A root whose only clear voice is its sixth partial, whistled without a tremor, in a plain hall.',
    preview: LOW_LADDER,
    instrument: {
      deviceId: 'overtone',
      preset: 'Still whistle',
      params: { overtone: 6, vibrato: 0, attack: 0.1, release: 0.8 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'thrush-ladder-tenth-at-grey-light',
    name: 'Tenth at grey light',
    category: 'voice',
    description:
      'The tenth partial, a pure third three octaves up, breathy over its root, its tail blooming upward by octaves.',
    preview: TWO_ROOTS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Still whistle',
      params: { volume: -2.5, overtone: 10, focus: 0.85, breath: 0.45, attack: 0.8, release: 3 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Octave halo', params: { decay: 9, mix: 0.35 } }],
  },
  {
    id: 'thrush-ladder-bird-inside-the-ground',
    name: 'Bird inside the ground',
    category: 'voice',
    description:
      'A root whose mouth steps along its own ladder nearly three times a second, with short tape echoes, swaying side to side.',
    preview: TWO_ROOTS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Quick steps',
      params: { volume: -3.5, overtone: 9, wander: 0.7, pace: 2.8, release: 1 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.3 } },
      { deviceId: 'around', preset: 'Gentle sway' },
    ],
  },
  {
    id: 'thrush-ladder-jaw-of-the-stump',
    name: 'Jaw of the stump',
    category: 'voice',
    description:
      'A plucked-tongue reed on the low roots, its mouth stepping along the partials five times a second, in a tight long spring.',
    preview: FOUR_ROOTS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Jaw harp',
      params: { overtone: 8, pace: 5, focus: 0.8, release: 0.25 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Tight long tank', params: { mix: 0.25 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'thrush-ladder-twelfth-rung-in-a-pipe',
    name: 'Twelfth rung in a pipe',
    category: 'drone',
    description: 'A drone pipe whistling its twelfth partial inside a big stopped pipe of clay.',
    preview: LOW_LADDER,
    instrument: {
      deviceId: 'overtone',
      preset: 'Drone pipe',
      params: {
        volume: -2.5,
        overtone: 12,
        focus: 0.9,
        wander: 0,
        growl: 0.1,
        attack: 0.1,
        release: 0.7,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { body: 2, size: 2, mix: 0.5 } },
      { deviceId: 'chorus', preset: 'Faint air' },
    ],
  },
  {
    id: 'thrush-ladder-wind-in-a-dead-trunk',
    name: 'Wind in a dead trunk',
    category: 'wind',
    description:
      'A breathy pipe blown into a big open tube and heard from a long way off, its whistle drifting by rungs.',
    preview: TWO_ROOTS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Breath pipe',
      params: { overtone: 6, wander: 0.3, breath: 1, attack: 0.6 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { size: 3.2, air: 0.5, mix: 0.6 } },
      { deviceId: 'distance', preset: 'Open air', params: { distance: 0.7 } },
    ],
  },
  {
    id: 'thrush-ladder-sixteenth-barely-there',
    name: 'Sixteenth, barely there',
    category: 'texture',
    description:
      'The sixteenth partial high over a dark pipe, every band twinkling on its own in a wide slow space.',
    preview: TWO_ROOTS,
    instrument: {
      deviceId: 'overtone',
      preset: 'High whistle',
      params: { volume: -3.5, wander: 0, breath: 0.25, attack: 0.9, release: 3 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Wide twinkle' },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'thrush-ladder-nine-across-the-valley',
    name: 'Nine across the valley',
    category: 'voice',
    description:
      'The ninth partial of a moving ground, whistled on a full breath, dark and late from the far shore of a valley.',
    preview: LOW_LADDER,
    instrument: {
      deviceId: 'overtone',
      preset: 'Air whistle',
      params: { volume: -16, overtone: 9, wander: 0, attack: 0.1, release: 1 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Far shore', params: { decay: 5, level: 1 } },
      { deviceId: 'lift', preset: 'Long tails', params: { threshold: -28, limit: 10 } },
    ],
  },
  {
    id: 'thrush-ladder-reed-ground-turning',
    name: 'Reed ground, turning',
    category: 'organ',
    description:
      'A darkened reed drone with its fifth partial half open, turned by a slow horn and drum.',
    preview: THREE_SPECTRA,
    instrument: {
      deviceId: 'overtone',
      preset: 'Reed drone',
      params: { overtone: 5, focus: 0.35, wander: 0, growl: 0.1, attack: 0.2, release: 0.8 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.1 } },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 5500 } },
    ],
  },
  {
    id: 'thrush-ladder-growl-in-the-moss',
    name: 'Growl in the moss',
    category: 'drone',
    description:
      'A rattling throat with its third partial forward, every edge softened by a short dark fog.',
    preview: FOUR_ROOTS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Low growl',
      params: { overtone: 3, focus: 0.5, wander: 0, growl: 1, release: 0.8 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Dark bank', params: { size: 200 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'thrush-ladder-chant-for-four-roots',
    name: 'Chant for four roots',
    category: 'drone',
    description:
      'A deep chanting throat on its fourth partial in a dark cave, the cave breathing in slow waves.',
    preview: FOUR_ROOTS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Deep chant',
      params: { volume: -6.5, wander: 0, attack: 0.25, growl: 0.3, release: 1.5 },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Dark cave',
        params: { decay: 7, breathDepth: 0.6, breathRate: 0.25, mix: 0.45 },
      },
    ],
  },
  {
    id: 'thrush-ladder-slow-syllables',
    name: 'Slow syllables',
    category: 'voice',
    description:
      'Loose vowels of a breathy pipe that shift along the series every three seconds, in a hall shaped to an oo.',
    preview: THREE_SPECTRA,
    instrument: {
      deviceId: 'overtone',
      preset: 'Open vowels',
      params: { voice: 1, overtone: 4, focus: 0.45, breath: 0.6, wander: 0.6, attack: 0.5 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.45 } }],
  },
  {
    id: 'thrush-ladder-whistle-left-on-ice',
    name: 'Whistle left on ice',
    category: 'pad',
    description:
      'A reed with its eighth partial drawn as thin as it goes, three octaves over the note, smeared into a glassy halo.',
    preview: LOW_LADDER,
    instrument: {
      deviceId: 'overtone',
      preset: 'Glass harmonic',
      params: { overtone: 8, attack: 0.14, release: 1.2, vibrato: 0.1 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.55 } }],
  },
  {
    id: 'thrush-ladder-evening-chorus-throats',
    name: 'Evening chorus, throats',
    category: 'pad',
    description:
      'A wide chord of throats with every voice multiplied into a small flock that wheels past.',
    preview: THREE_SPECTRA,
    instrument: {
      deviceId: 'overtone',
      preset: 'Wide chord',
      params: { volume: -13.5, overtone: 6, wander: 0, focus: 0.45, attack: 0.35, release: 1.5 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Evening flock', params: { birds: 10, mix: 0.6 } },
    ],
  },
  {
    id: 'thrush-ladder-lip-of-the-ravine',
    name: 'Lip of the ravine',
    category: 'bass',
    description:
      'A buzzing lip tone on the roots, filtered low, the filter opened by the touch, close and nearly dry.',
    preview: FOUR_ROOTS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Lip buzz',
      params: { growl: 0.5, focus: 0.15, breath: 0.05, release: 0.2 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 380, envAmount: 35, resonance: 0.9 },
      },
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
    ],
  },
  {
    id: 'thrush-ladder-firs-at-a-standstill',
    name: 'Firs at a standstill',
    category: 'drone',
    description:
      'A slow throat with three partials to choose from, its bands swelling and sinking like heavy branches.',
    preview: TWO_ROOTS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Slow chant',
      params: { overtone: 8, wander: 0.3, focus: 0.9, attack: 1, release: 2.5 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Deep swell' },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { highCut: 3500 } },
    ],
  },
  {
    id: 'thrush-ladder-bird-and-ground-as-one',
    name: 'Bird and ground as one',
    category: 'voice',
    description:
      'A pipe voice for root and song together, its strongest partials redrawn as slow pure sines.',
    preview: SONG_OVER_C,
    instrument: {
      deviceId: 'overtone',
      preset: 'Drone pipe',
      params: { overtone: 3, focus: 0.6, wander: 0, growl: 0, attack: 0.08, release: 0.9 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Long linger', params: { mix: 0.55 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.22 } },
    ],
  },

  // Glass: struck, rubbed and held, its modulators mostly on whole numbers so the colour is in the series too.
  {
    id: 'thrush-ladder-glass-bird-on-the-sill',
    name: 'Glass bird on the sill',
    category: 'bell',
    description:
      'A glass bell with its modulator on the octave, the brightness soon gone, in a small plate: the nearest bird.',
    preview: SONG_ON_C,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { ratio: 3, brightness: 0.3, decay: 1.1, release: 1.2, detune: 2 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } }],
  },
  {
    id: 'thrush-ladder-ice-on-the-high-twig',
    name: 'Ice on the high twig',
    category: 'bell',
    description:
      'Brittle chimes that lose their edge in half a second, scattered round the branches as a spiral of slowing echoes.',
    preview: SONG_ON_G,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Ice chimes',
      params: { ratio: 7, decay: 0.5, release: 0.8, detune: 3 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Slowing spiral', params: { mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'thrush-ladder-tines-in-the-thicket',
    name: 'Tines in the thicket',
    category: 'keys',
    description: 'Short tine keys widened by three slow voices and set in a close room.',
    preview: TWO_SONGS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: { volume: -1, decay: 1, brightness: 0.3, release: 0.35, feedback: 0.1 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { breathDepth: 0, mix: 0.25 } },
    ],
  },
  {
    id: 'thrush-ladder-toy-thrush',
    name: 'Toy thrush',
    category: 'keys',
    description:
      'A tiny toy keyboard, its brightness gone in a third of a second, aliasing a little in an old converter, in a small room.',
    preview: SONG_ON_D,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Toy keys',
      params: { volume: -2.5, ratio: 7, decay: 0.35, release: 0.3, brightness: 0.4 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'thrush-ladder-vibes-under-the-fir',
    name: 'Vibes under the fir',
    category: 'keys',
    description:
      'A glassy mallet walking slowly from side to side, with a warm hall well under it.',
    preview: SONG_ON_A,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: { brightness: 0.22, decay: 3.4, release: 2.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'thrush-ladder-bowl-in-the-glen',
    name: 'Bowl in the glen',
    category: 'bell',
    description:
      'A slow glass bowl among five metal bowls tuned in fifths on F, which wake when the song touches them.',
    preview: SONG_OVER_F,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Temple bowl',
      params: { ratio: 3, brightness: 0.36, decay: 5, release: 5 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Low fifths', params: { root: 5, bowls: 5, mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'thrush-ladder-rising-sap',
    name: 'Rising sap',
    category: 'pad',
    description:
      'Glass that takes a second to rise, its pairs twelve cents apart, over a low dark space of nine seconds.',
    preview: THREE_SPECTRA,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Slow glass',
      params: { volume: -14.5, ratio: 3, attack: 1, release: 2.5, brightness: 0.22 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 9, mix: 0.45 } }],
  },
  {
    id: 'thrush-ladder-understorey-breathing',
    name: 'Understorey breathing',
    category: 'pad',
    description:
      'A crystal pad that opens and closes, level and brightness together, on a calm cycle of breath.',
    preview: THREE_SPECTRA,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { volume: -14, attack: 0.5, release: 2, brightness: 0.4, detune: 5 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Calm breath', params: { depth: 0.65, in: 1.6, out: 1.8 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'thrush-ladder-frost-organ',
    name: 'Frost organ',
    category: 'organ',
    description:
      'A glass organ for root and song together, heard through a loudspeaker horn that has stopped turning.',
    preview: SONG_OVER_C,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass organ',
      params: { volume: -17.5, ratio: 5, brightness: 0.18, attack: 0.03, release: 0.4 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Stopped horn' },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'thrush-ladder-below-the-falls',
    name: 'Below the falls',
    category: 'drone',
    description:
      'A dark beating gong on the roots with a slow surf washing over it and hiding it by turns.',
    preview: TWO_ROOTS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Dark gong',
      params: { attack: 0.08, decay: 6, release: 4, brightness: 0.45, feedback: 0.2 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Slow surf', params: { voice: 0.35, exposure: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Lift' },
    ],
  },
  {
    id: 'thrush-ladder-bowed-fence-wire',
    name: 'Bowed fence wire',
    category: 'string',
    description:
      'Bowed metal that comes in over a third of a second, its partials notched by a glacial phaser.',
    preview: SONG_OVER_F,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Bowed metal',
      params: { ratio: 5, attack: 0.3, release: 1.5, brightness: 0.28 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'thrush-ladder-bars-in-white-birch',
    name: 'Bars in white birch',
    category: 'bell',
    description:
      'Chime bars throwing off small sparks drawn from their own overtones, each a moment late and to one side.',
    preview: SONG_ON_F,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Chime bars',
      params: { volume: -6.5, ratio: 7, decay: 1.8, release: 2.2, brightness: 0.3 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Overtone spray', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { highCut: 9000 } },
    ],
  },
  {
    id: 'thrush-ladder-ping-off-the-boulder',
    name: 'Ping off the boulder',
    category: 'bell',
    description:
      'A dry glass ping thrown like a stone, its bounces slowing down and sinking in pitch as they go.',
    preview: SONG_ON_D,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass ping',
      params: { ratio: 5, decay: 0.45, brightness: 0.35 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Slowing bounces', params: { drop: 12, mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'thrush-ladder-owl-hour',
    name: 'Owl hour',
    category: 'pad',
    description:
      'A warm glass pad with wide detune run onto drifting tape, its highs taken off above the song.',
    preview: THREE_SPECTRA,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Warm glass pad',
      params: { attack: 0.15, release: 1.5, feedback: 0.35, brightness: 0.4 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'thrush-ladder-sines-after-sundown',
    name: 'Sines after sundown',
    category: 'bell',
    description:
      'Almost bare sine chimes whose long tail climbs by fifths, so the last notes of a song grow their own ladder.',
    preview: TWO_SONGS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Sine chimes',
      params: { ratio: 5, decay: 2.5, release: 4, detune: 4 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { decay: 8, mix: 0.4 } }],
  },
  {
    id: 'thrush-ladder-rim-of-the-pond',
    name: 'Rim of the pond',
    category: 'pad',
    description:
      'A rubbed glass rim heard from just under the surface of a pond, swaying, with few bubbles.',
    preview: FOUR_WHISTLES,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Rubbed glass',
      params: { attack: 0.2, release: 2, feedback: 0.1 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0.1, waver: 0.5 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },
  {
    id: 'thrush-ladder-brook-through-a-lens',
    name: 'Brook through a lens',
    category: 'texture',
    description:
      'A bright ninth-ratio bell fanned into scattered bands, each note arriving in pieces from many places.',
    preview: SONG_ON_C,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { volume: -2.5, ratio: 10, brightness: 0.5, decay: 0.8, release: 1, velocity: 0.8 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Scattered notes', params: { mix: 0.55 } },
      { deviceId: 'ambient-limiter', preset: 'Margin' },
    ],
  },

  // Bells: metal, glass, bars and bowls, struck close by or hung far up the slope.
  {
    id: 'thrush-ladder-bowl-under-the-singer',
    name: 'Bowl under the singer',
    category: 'bell',
    description:
      'A singing bowl struck with a soft beater and stopped soon, heard from a few steps back in its room.',
    preview: TWO_LOW_SONGS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: { volume: -4, decay: 5, hardness: 0.3, detune: 0.4, release: 0.5 },
    },
    effects: [
      { deviceId: 'distance', preset: 'A few steps back' },
      { deviceId: 'stereo-detune', preset: 'Faint width' },
    ],
  },
  {
    id: 'thrush-ladder-rim-of-the-hollow',
    name: 'Rim of the hollow',
    category: 'pad',
    description:
      'A rubbed bowl, pulsing on two slow patterns that drift apart and come together again.',
    preview: FOUR_WHISTLES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { volume: -4, hardness: 0.35, brightness: 0.6, release: 0.4, detune: 0.3 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Slow drift' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'thrush-ladder-chapel-past-the-trees',
    name: 'Chapel past the trees',
    category: 'bell',
    description:
      'A church bell with a gentle clapper, its partials drawn closer together, behind fog and a vast nave.',
    preview: SONG_ON_C,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { volume: -2, decay: 6, hardness: 0.35, damping: 0.65, stretch: 0.9 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Through fog', params: { distance: 0.55 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'thrush-ladder-bars-at-the-clearing',
    name: 'Bars at the clearing',
    category: 'keys',
    description:
      'Vibraphone bars struck off centre and damped when let go, trembling in pitch as the note is held.',
    preview: SONG_ON_A,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { volume: 4, position: 0.45, hardness: 0.55, decay: 4, release: 0.5 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Barely there', params: { depth: 16 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'thrush-ladder-box-in-the-fork',
    name: 'Box in the fork',
    category: 'bell',
    description:
      'A music box with a dull comb, wedged in wood, with a worn cassette flutter on every tooth.',
    preview: TWO_SONGS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { volume: 6, decay: 1.4, hardness: 0.5, brightness: 0.35, position: 0.25 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.1 } },
      { deviceId: 'vessel', preset: 'Hint of wood' },
    ],
  },
  {
    id: 'thrush-ladder-seed-pods-plucked',
    name: 'Seed pods, plucked',
    category: 'plucked',
    description:
      'Kalimba tines with strings tuned to C ringing faintly behind them, and one faint trace of tape echo.',
    preview: SONG_OVER_C,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { hardness: 0.35, decay: 3.5, damping: 0.5, release: 0.2 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Faint ring', params: { root: 0, mix: 0.4 } },
      { deviceId: 'tape-echo', preset: 'Faint trace' },
    ],
  },
  {
    id: 'thrush-ladder-wet-finger-dawn',
    name: 'Wet finger dawn',
    category: 'pad',
    description:
      'A glass harp rubbed into being, its quiet overtones brought up under it, across an open valley.',
    preview: FOUR_WHISTLES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { sustain: 1, hardness: 0.1, detune: 0.5, brightness: 0.5 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 5, breathDepth: 0, mix: 0.35 },
      },
    ],
  },
  {
    id: 'thrush-ladder-rumble-of-the-scree',
    name: 'Rumble of the scree',
    category: 'drone',
    description:
      'A gong damped down to its lowest modes, melting slowly flat as it dies on each root.',
    preview: TWO_ROOTS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { volume: 2.5, decay: 9, damping: 0.75, detune: 0.6, hardness: 0.2, brightness: 0.3 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.5 } },
      { deviceId: 'analog-drive', preset: 'Low warmth' },
    ],
  },
  {
    id: 'thrush-ladder-quartz-in-the-stream',
    name: 'Quartz in the stream',
    category: 'bell',
    description:
      'Glass tapped with a hard point and choked short, small pieces of it dropping two octaves as they fade.',
    preview: SONG_ON_F,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { volume: -3.5, decay: 1.2, damping: 0.5, release: 0.6 },
    },
    effects: [
      { deviceId: 'falling', preset: 'Quick drops', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'thrush-ladder-aspen-all-at-once',
    name: 'Aspen all at once',
    category: 'bell',
    description:
      'Glass whose doubled modes beat seven times a second, blurred at the edge like leaves on the turn.',
    preview: SONG_ON_G,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Shivering glass',
      params: { volume: -1.5, decay: 3, brightness: 0.45, hardness: 0.3 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil', params: { mix: 0.7 } },
      { deviceId: 'spread', preset: 'Wide but safe' },
    ],
  },
  {
    id: 'thrush-ladder-past-the-second-ridge',
    name: 'Past the second ridge',
    category: 'bell',
    description:
      'A far bell with all its edge gone, gathered into echoes that bunch together before the hall takes them.',
    preview: SONG_ON_A,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Distant bell',
      params: { volume: 1, decay: 14, damping: 0.5, detune: 0.5, stretch: 0.95, brightness: 0.25 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Gathering in', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Far away' },
    ],
  },
  {
    id: 'thrush-ladder-bowed-from-a-branch',
    name: 'Bowed from a branch',
    category: 'string',
    description:
      'A bell bowed at the edge and held, sent round the head in a slow figure of eight.',
    preview: FOUR_WHISTLES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Bowed bell',
      params: { volume: -3.5, stretch: 0.85, brightness: 0.55, release: 0.5, hardness: 0.2 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow eight' },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6500 } },
    ],
  },
  {
    id: 'thrush-ladder-peat-water',
    name: 'Peat water',
    category: 'bell',
    description:
      'A very dark bowl with an octave doubled under it, hung for a long time in black water.',
    preview: TWO_LOW_SONGS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Dark bowl',
      params: { decay: 18, hardness: 0.3, brightness: 0.35, release: 0.3 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.45 } },
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'thrush-ladder-bark-and-knuckle',
    name: 'Bark and knuckle',
    category: 'plucked',
    description:
      'Wooden bars with almost no ring, knocked in a close dry booth and tightened by fast levelling.',
    preview: TWO_LOW_SONGS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: { volume: 6, decay: 0.9, hardness: 0.7, position: 0.25, damping: 0.8 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: { outputGain: -4 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'thrush-ladder-hung-in-the-larch',
    name: 'Hung in the larch',
    category: 'bell',
    description:
      'Wind chimes with the glare cut, ringing on through gusts that carry them off and bring them back.',
    preview: SONG_ON_C,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: { volume: -2.5, hardness: 0.55, brightness: 0.5, decay: 5, damping: 0.25 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Dry gusts' },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },

  // Mallets: celesta first, then small metal bars and wood, a keyboard's answer to the bird.
  {
    id: 'thrush-ladder-celesta-forest-edge',
    name: 'Celesta, forest edge',
    category: 'keys',
    description:
      'A celesta with slightly firm hammers and quick dampers, kept dry but for a halo of a third of a second.',
    preview: SONG_ON_C,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.4, damper: 0.85, resonator: 0.6 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.3 } }],
  },
  {
    id: 'thrush-ladder-celesta-under-leaf',
    name: 'Celesta under leaf',
    category: 'keys',
    description:
      'A celesta with every hammer stroke sifted out of it, so the plates seem to start by themselves.',
    preview: SONG_ON_G,
    instrument: {
      deviceId: 'mallets',
      preset: 'Open celesta',
      params: { volume: -9, decay: 2, width: 0.6, damper: 0.2 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Tones only' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'thrush-ladder-two-birds-one-tree',
    name: 'Two birds, one tree',
    category: 'keys',
    description:
      'A plain celesta followed one second later by itself an octave below, a round of two.',
    preview: SONG_ON_A,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { volume: -5, mallet: 0.15, decay: 0.7, damper: 0.5, width: 0.1 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Octave shadow',
        params: { followers: 1, gap: 1, interval1: -12, fade: 0.2, mix: 0.5 },
      },
      { deviceId: 'ambient-eq', preset: 'Keys' },
    ],
  },
  {
    id: 'thrush-ladder-trill-in-the-alder',
    name: 'Trill in the alder',
    category: 'keys',
    description:
      'A celesta trembling ten times a second on its motor, with the tail falling by fifths as it goes.',
    preview: SONG_ON_F,
    instrument: {
      deviceId: 'mallets',
      preset: 'Tremolo celesta',
      params: { volume: -4, mallet: 0.35, damper: 0.2, motorRate: 10 },
    },
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Falling fifths', params: { decay: 6, mix: 0.35 } },
    ],
  },
  {
    id: 'thrush-ladder-song-caught-in-amber',
    name: 'Song caught in amber',
    category: 'texture',
    description:
      'A celesta with no dampers, replayed as slow smeared grains of itself, so the ladder hangs in the air unordered.',
    preview: TWO_SONGS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Open celesta',
      params: { volume: -7, mallet: 0.3, decay: 1.2 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { highCut: 7500 } },
    ],
  },
  {
    id: 'thrush-ladder-sun-on-the-upper-rungs',
    name: 'Sun on the upper rungs',
    category: 'bell',
    description:
      'Small steel bars struck hard and stopped soon, their glare shaded, in a small tank of seven seconds.',
    preview: SONG_ON_D,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { volume: -1, mallet: 0.65, decay: 0.45, damper: 0.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { breathDepth: 0, mix: 0.3 } },
    ],
  },
  {
    id: 'thrush-ladder-steel-in-a-hollow-oak',
    name: 'Steel in a hollow oak',
    category: 'bell',
    description:
      'Glockenspiel bars over full tubes, sounded again inside a big soundboard with the glare off.',
    preview: SONG_ON_C,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { volume: -5.5, mallet: 0.2, decay: 1.2 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 2.4, mix: 0.75 } },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 6000 } },
    ],
  },
  {
    id: 'thrush-ladder-shiver-of-needles',
    name: 'Shiver of needles',
    category: 'texture',
    description:
      'Steel bars rolled sixteen times a second, a ripple running upward through their bands, in a dark plate.',
    preview: FOUR_WHISTLES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel roll',
      params: { mallet: 0.15, resonator: 0.8, decay: 1 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rising ripple' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'thrush-ladder-vibes-for-a-still-noon',
    name: 'Vibes for a still noon',
    category: 'keys',
    description:
      'Vibraphone with the motor off: what is still sounding from a moment ago hangs on, and what has just changed is held back.',
    preview: TWO_SONGS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { mallet: 0.4, damper: 0.1, decay: 1.1 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Hanging notes' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'thrush-ladder-slow-fan-in-the-shade',
    name: 'Slow fan in the shade',
    category: 'keys',
    description:
      'Vibraphone throbbing a little over once a second, its echoes hopping up by octaves.',
    preview: SONG_ON_F,
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { volume: -7.5, motor: 0.8, motorRate: 1.4, decay: 1.8 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { mix: 0.25 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'thrush-ladder-rolled-like-wind',
    name: 'Rolled like wind',
    category: 'pad',
    description:
      'Rolled vibraphone with the strokes faded out, each note swelling in over a third of a second, in an ensemble and a hall.',
    preview: FOUR_WHISTLES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { volume: -5.5, roll: 13, motor: 0, mallet: 0.05, damper: 0.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'String section' },
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'thrush-ladder-roots-and-moss',
    name: 'Roots and moss',
    category: 'keys',
    description:
      'A marimba rolled eight times a second on the low roots, over a gently turning horn, with some tube warmth.',
    preview: FOUR_ROOTS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { mallet: 0.45, roll: 8, decay: 1.6 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Faint motion' },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 9 } },
    ],
  },
  {
    id: 'thrush-ladder-humming-trunk',
    name: 'Humming trunk',
    category: 'pad',
    description:
      'A marimba rolled so softly that no stroke shows, blurred, shadowed an octave below by slow sines.',
    preview: TWO_LOW_SONGS,
    instrument: { deviceId: 'mallets', preset: 'Humming marimba', params: { roll: 7, width: 0.6 } },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Low shadow' },
      { deviceId: 'fog', preset: 'Soft cloud', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'thrush-ladder-beak-on-dry-pine',
    name: 'Beak on dry pine',
    category: 'plucked',
    description:
      'A xylophone struck hard and cut short, with echoes that drift back out of order from earlier in the song.',
    preview: TWO_LOW_SONGS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { volume: 4.5, mallet: 0.6, decay: 0.4, resonator: 0.6 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Flickers' },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },

  // Flute: wood, reed and breath. The bird as a player would answer it.
  {
    id: 'thrush-ladder-wooden-answer',
    name: 'Wooden answer',
    category: 'wind',
    description:
      'A wood flute blown firmly with no vibrato, the pitch dead straight, its tone narrowed by a short wooden pipe.',
    preview: SONG_ON_C,
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { breath: 0.12, vibrato: 0, scoop: 0, blow: 0.8, chiff: 0.55 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Inside a pipe',
        params: { size: 0.6, material: 0.3, air: 0, mix: 0.6 },
      },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'thrush-ladder-fipple-in-the-ferns',
    name: 'Fipple in the ferns',
    category: 'wind',
    description:
      'A soft recorder with a second, slightly larger player mixed in behind it, under a short dim spring.',
    preview: SONG_ON_D,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { blow: 0.2, chiff: 0.5, attack: 0.04, release: 0.25 },
    },
    effects: [
      { deviceId: 'size', preset: 'Second player' },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'thrush-ladder-sapwood',
    name: 'Sapwood',
    category: 'wind',
    description:
      'A wood flute that takes most of a second to speak, with strings tuned to C left ringing after it.',
    preview: FOUR_WHISTLES,
    instrument: {
      deviceId: 'flute',
      preset: 'Slow wood swell',
      params: { attack: 0.8, release: 2, breath: 0.35, blow: 0.5 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Long ring', params: { root: 0, mix: 0.45 } }],
  },
  {
    id: 'thrush-ladder-straight-silver-call',
    name: 'Straight silver call',
    category: 'wind',
    description:
      'A concert flute without vibrato, repeated by a steady tape head half a second after each rung.',
    preview: SONG_ON_F,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { attack: 0.06, release: 0.6, blow: 0.5, breath: 0.2 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Clean and steady', params: { time: 500, mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'thrush-ladder-first-call-close',
    name: 'First call, close',
    category: 'wind',
    description:
      'A flute overblown close by with its breath noise, held level by a fast limiter, one faint slap behind it.',
    preview: SONG_ON_G,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { volume: -13, vibrato: 0.15, breath: 0.4 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 18, outputGain: -11 } },
      { deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'thrush-ladder-flock-of-one-flute',
    name: 'Flock of one flute',
    category: 'wind',
    description:
      'One breathy soft flute sent out as a wheeling flock, every bird at its own distance and bend of pitch.',
    preview: TWO_SONGS,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft wind lead',
      params: { vibrato: 0.1, attack: 0.05, scoop: 10 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Wheeling', params: { mix: 0.55 } },
      { deviceId: 'ambient-eq', preset: 'Voice' },
    ],
  },
  {
    id: 'thrush-ladder-low-under-the-canopy',
    name: 'Low under the canopy',
    category: 'wind',
    description:
      'A low flute blown firmly, with grains of itself answering a twelfth above, in an airy hall.',
    preview: TWO_LOW_SONGS,
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { vibrato: 0.2, blow: 0.6, breath: 0.3 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'thrush-ladder-fallen-elm',
    name: 'Fallen elm',
    category: 'pad',
    description:
      'Low flute tones caught and held by an even string pad that glides from one rung to the next.',
    preview: TWO_LOW_SONGS,
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { attack: 0.25, release: 1.5, vibrato: 0, breath: 0.35 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Drone' },
    ],
  },
  {
    id: 'thrush-ladder-air-between-the-songs',
    name: 'Air between the songs',
    category: 'texture',
    description:
      'Nearly all breath: a low flute pad filtered so that only the notes of C major whistle through it.',
    preview: FOUR_WHISTLES,
    instrument: { deviceId: 'flute', preset: 'Breath pad', params: { attack: 0.5, release: 1.5 } },
    effects: [
      { deviceId: 'scale-filter', preset: 'In a major key', params: { root: 0 } },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
  },
  {
    id: 'thrush-ladder-bamboo-bends-upward',
    name: 'Bamboo bends upward',
    category: 'wind',
    description:
      'A bamboo flute that slides into each rung from below, the slides left hanging in a slow swell of reverb.',
    preview: SONG_ON_A,
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: { vibrato: 0.2, scoop: 70, breath: 0.45 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 1.6, mix: 0.4 } }],
  },
  {
    id: 'thrush-ladder-bamboo-in-hard-frost',
    name: 'Bamboo in hard frost',
    category: 'wind',
    description:
      'A windy bamboo tone with a wide sway in deep winter: thinned, cold, with a long still tail.',
    preview: FOUR_WHISTLES,
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: {
        volume: -15,
        attack: 0.3,
        release: 1.4,
        vibrato: 0.7,
        scoop: 25,
        breath: 0.8,
        blow: 0.55,
      },
    },
    effects: [{ deviceId: 'seasons', preset: 'Deep winter', params: { mix: 0.9 } }],
  },
  {
    id: 'thrush-ladder-pipes-tied-with-vine',
    name: 'Pipes tied with vine',
    category: 'wind',
    description:
      'Pan pipes with a spat start, doubled, the player wandering nearer and farther on the path.',
    preview: SONG_ON_D,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { breath: 0.35, chiff: 1, release: 0.3, scoop: 10 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Passing by' },
      { deviceId: 'stereo-detune', preset: 'Doubled' },
    ],
  },
  {
    id: 'thrush-ladder-whisper-past-hearing',
    name: 'Whisper past hearing',
    category: 'texture',
    description:
      'Whispered pipes stretched eight times over into a cloud that trails far behind the song, then runs to catch it up.',
    preview: TWO_SONGS,
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { attack: 0.08, release: 1, blow: 0.2, breath: 0.8 },
    },
    effects: [
      { deviceId: 'stretch', preset: 'Slow cloud', params: { mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Open', params: { highCut: 9000 } },
    ],
  },
]
