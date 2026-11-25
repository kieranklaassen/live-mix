import { type FactoryPreset, type Phrase } from '../types'

// One plain tune in A minor, heard in five worlds where the octave is 10, 11, 13, 14 or 15
// semitones: every interval from the A below middle C is multiplied by the same number, in pure
// ratios first. The bells take the same number on Stretch, so their partials still land on the
// notes. Bars and pans have no Stretch: a Warp on a fixed pivot of 220 Hz moves notes and
// partials together, or a copy is added at the size of the octave, or the tone is near a sine.

// The tune on the white keys: A C E, D E A, C B A, ending on the octave A3 and A4.
const TUNE_PLAIN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5, note: 57, gain: 0.76 },
    { atSec: 0.52, durSec: 0.5, note: 60, gain: 0.69 },
    { atSec: 1.04, durSec: 1, note: 64, gain: 0.83 },
    { atSec: 2.08, durSec: 0.5, note: 62, gain: 0.69 },
    { atSec: 2.6, durSec: 0.5, note: 64, gain: 0.76 },
    { atSec: 3.12, durSec: 1, note: 69, gain: 0.9 },
    { atSec: 4.16, durSec: 0.5, note: 60, gain: 0.69 },
    { atSec: 4.68, durSec: 0.5, note: 59, gain: 0.62 },
    { atSec: 5.2, durSec: 1.4, note: 57, gain: 0.76 },
    { atSec: 5.2, durSec: 1.4, note: 69, gain: 0.55 },
  ],
}
// The tune at 10/12: A3 and its octave are ten semitones apart.
const TUNE_IN_SEVENTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5, note: 57, gain: 0.76 },
    { atSec: 0.52, durSec: 0.5, note: 59.63, gain: 0.69 },
    { atSec: 1.04, durSec: 1, note: 62.85, gain: 0.83 },
    { atSec: 2.08, durSec: 0.5, note: 61.15, gain: 0.69 },
    { atSec: 2.6, durSec: 0.5, note: 62.85, gain: 0.76 },
    { atSec: 3.12, durSec: 1, note: 67, gain: 0.9 },
    { atSec: 4.16, durSec: 0.5, note: 59.63, gain: 0.69 },
    { atSec: 4.68, durSec: 0.5, note: 58.7, gain: 0.62 },
    { atSec: 5.2, durSec: 1.4, note: 57, gain: 0.76 },
    { atSec: 5.2, durSec: 1.4, note: 67, gain: 0.55 },
  ],
}
// The tune at 11/12: the octave is a major seventh.
const TUNE_A_SEMITONE_SHORT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5, note: 57, gain: 0.76 },
    { atSec: 0.52, durSec: 0.5, note: 59.89, gain: 0.69 },
    { atSec: 1.04, durSec: 1, note: 63.43, gain: 0.83 },
    { atSec: 2.08, durSec: 0.5, note: 61.57, gain: 0.69 },
    { atSec: 2.6, durSec: 0.5, note: 63.43, gain: 0.76 },
    { atSec: 3.12, durSec: 1, note: 68, gain: 0.9 },
    { atSec: 4.16, durSec: 0.5, note: 59.89, gain: 0.69 },
    { atSec: 4.68, durSec: 0.5, note: 58.87, gain: 0.62 },
    { atSec: 5.2, durSec: 1.4, note: 57, gain: 0.76 },
    { atSec: 5.2, durSec: 1.4, note: 68, gain: 0.55 },
  ],
}
// The tune at 13/12: the octave is a minor ninth.
const TUNE_A_SEMITONE_OVER: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5, note: 57, gain: 0.76 },
    { atSec: 0.52, durSec: 0.5, note: 60.42, gain: 0.69 },
    { atSec: 1.04, durSec: 1, note: 64.6, gain: 0.83 },
    { atSec: 2.08, durSec: 0.5, note: 62.4, gain: 0.69 },
    { atSec: 2.6, durSec: 0.5, note: 64.6, gain: 0.76 },
    { atSec: 3.12, durSec: 1, note: 70, gain: 0.9 },
    { atSec: 4.16, durSec: 0.5, note: 60.42, gain: 0.69 },
    { atSec: 4.68, durSec: 0.5, note: 59.21, gain: 0.62 },
    { atSec: 5.2, durSec: 1.4, note: 57, gain: 0.76 },
    { atSec: 5.2, durSec: 1.4, note: 70, gain: 0.55 },
  ],
}
// The tune at 14/12: octave 1400, fifth 819 and minor third 368 cents.
const TUNE_IN_NINTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5, note: 57, gain: 0.76 },
    { atSec: 0.52, durSec: 0.5, note: 60.68, gain: 0.69 },
    { atSec: 1.04, durSec: 1, note: 65.19, gain: 0.83 },
    { atSec: 2.08, durSec: 0.5, note: 62.81, gain: 0.69 },
    { atSec: 2.6, durSec: 0.5, note: 65.19, gain: 0.76 },
    { atSec: 3.12, durSec: 1, note: 71, gain: 0.9 },
    { atSec: 4.16, durSec: 0.5, note: 60.68, gain: 0.69 },
    { atSec: 4.68, durSec: 0.5, note: 59.38, gain: 0.62 },
    { atSec: 5.2, durSec: 1.4, note: 57, gain: 0.76 },
    { atSec: 5.2, durSec: 1.4, note: 71, gain: 0.55 },
  ],
}
// The tune at 15/12: the octave is a minor tenth, the fifth 877 cents.
const TUNE_IN_TENTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5, note: 57, gain: 0.76 },
    { atSec: 0.52, durSec: 0.5, note: 60.95, gain: 0.69 },
    { atSec: 1.04, durSec: 1, note: 65.77, gain: 0.83 },
    { atSec: 2.08, durSec: 0.5, note: 63.23, gain: 0.69 },
    { atSec: 2.6, durSec: 0.5, note: 65.77, gain: 0.76 },
    { atSec: 3.12, durSec: 1, note: 72, gain: 0.9 },
    { atSec: 4.16, durSec: 0.5, note: 60.95, gain: 0.69 },
    { atSec: 4.68, durSec: 0.5, note: 59.55, gain: 0.62 },
    { atSec: 5.2, durSec: 1.4, note: 57, gain: 0.76 },
    { atSec: 5.2, durSec: 1.4, note: 72, gain: 0.55 },
  ],
}
// The five octaves over A3 in turn, from the narrowest: G, G sharp, B flat, B and C.
const FIVE_OCTAVES: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 57, gain: 0.69 },
    { atSec: 0.3, durSec: 0.85, note: 67, gain: 0.69 },
    { atSec: 1.2, durSec: 1.1, note: 57, gain: 0.69 },
    { atSec: 1.5, durSec: 0.85, note: 68, gain: 0.69 },
    { atSec: 2.4, durSec: 1.1, note: 57, gain: 0.69 },
    { atSec: 2.7, durSec: 0.85, note: 70, gain: 0.69 },
    { atSec: 3.6, durSec: 1.1, note: 57, gain: 0.69 },
    { atSec: 3.9, durSec: 0.85, note: 71, gain: 0.69 },
    { atSec: 4.8, durSec: 1.1, note: 57, gain: 0.69 },
    { atSec: 5.1, durSec: 1.5, note: 72, gain: 0.69 },
  ],
}
// A round of six notes at 13/12, A E D C G F, its second voice three notes late and one 1300
// cent octave up: they meet in pure sixths, then in pure tenths.
const ROUND_OF_SIX: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5, note: 57, gain: 0.69 },
    { atSec: 0.5, durSec: 0.5, note: 64.6, gain: 0.69 },
    { atSec: 1, durSec: 0.5, note: 62.4, gain: 0.69 },
    { atSec: 1.5, durSec: 0.5, note: 60.42, gain: 0.69 },
    { atSec: 1.5, durSec: 0.5, note: 70, gain: 0.48 },
    { atSec: 2, durSec: 0.5, note: 68.02, gain: 0.69 },
    { atSec: 2, durSec: 0.5, note: 77.6, gain: 0.48 },
    { atSec: 2.5, durSec: 0.5, note: 65.81, gain: 0.69 },
    { atSec: 2.5, durSec: 0.5, note: 75.4, gain: 0.48 },
    { atSec: 3, durSec: 0.5, note: 57, gain: 0.69 },
    { atSec: 3, durSec: 0.5, note: 73.42, gain: 0.48 },
    { atSec: 3.5, durSec: 0.5, note: 64.6, gain: 0.69 },
    { atSec: 3.5, durSec: 0.5, note: 81.02, gain: 0.48 },
    { atSec: 4, durSec: 0.5, note: 62.4, gain: 0.69 },
    { atSec: 4, durSec: 0.5, note: 78.81, gain: 0.48 },
    { atSec: 4.5, durSec: 0.5, note: 60.42, gain: 0.69 },
    { atSec: 4.5, durSec: 0.5, note: 70, gain: 0.48 },
    { atSec: 5, durSec: 0.5, note: 68.02, gain: 0.69 },
    { atSec: 5, durSec: 0.5, note: 77.6, gain: 0.48 },
    { atSec: 5.5, durSec: 0.5, note: 65.81, gain: 0.69 },
    { atSec: 5.5, durSec: 0.5, note: 75.4, gain: 0.48 },
    { atSec: 6, durSec: 1, note: 57, gain: 0.69 },
    { atSec: 6, durSec: 1, note: 73.42, gain: 0.48 },
  ],
}
// i VI iv i in A minor over a held A: E F F E inside, C C D C on top, on the white keys.
const FOUR_CHORDS_PLAIN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 57, gain: 0.69 },
    { atSec: 0.04, durSec: 1.5, note: 64, gain: 0.52 },
    { atSec: 0.08, durSec: 1.5, note: 69, gain: 0.52 },
    { atSec: 0.12, durSec: 1.5, note: 72, gain: 0.52 },
    { atSec: 1.6, durSec: 1.5, note: 57, gain: 0.69 },
    { atSec: 1.64, durSec: 1.5, note: 65, gain: 0.52 },
    { atSec: 1.68, durSec: 1.5, note: 69, gain: 0.52 },
    { atSec: 1.72, durSec: 1.5, note: 72, gain: 0.52 },
    { atSec: 3.2, durSec: 1.5, note: 57, gain: 0.69 },
    { atSec: 3.24, durSec: 1.5, note: 65, gain: 0.52 },
    { atSec: 3.28, durSec: 1.5, note: 69, gain: 0.52 },
    { atSec: 3.32, durSec: 1.5, note: 74, gain: 0.52 },
    { atSec: 4.8, durSec: 2, note: 57, gain: 0.69 },
    { atSec: 4.84, durSec: 2, note: 64, gain: 0.52 },
    { atSec: 4.88, durSec: 2, note: 69, gain: 0.52 },
    { atSec: 4.92, durSec: 2, note: 72, gain: 0.52 },
  ],
}
// The same four chords at 11/12, from pure triads.
const FOUR_CHORDS_PINCHED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 57, gain: 0.69 },
    { atSec: 0.04, durSec: 1.5, note: 63.43, gain: 0.52 },
    { atSec: 0.08, durSec: 1.5, note: 68, gain: 0.52 },
    { atSec: 0.12, durSec: 1.5, note: 70.89, gain: 0.52 },
    { atSec: 1.6, durSec: 1.5, note: 57, gain: 0.69 },
    { atSec: 1.64, durSec: 1.5, note: 64.46, gain: 0.52 },
    { atSec: 1.68, durSec: 1.5, note: 68, gain: 0.52 },
    { atSec: 1.72, durSec: 1.5, note: 70.89, gain: 0.52 },
    { atSec: 3.2, durSec: 1.5, note: 57, gain: 0.69 },
    { atSec: 3.24, durSec: 1.5, note: 64.46, gain: 0.52 },
    { atSec: 3.28, durSec: 1.5, note: 68, gain: 0.52 },
    { atSec: 3.32, durSec: 1.5, note: 72.57, gain: 0.52 },
    { atSec: 4.8, durSec: 2, note: 57, gain: 0.69 },
    { atSec: 4.84, durSec: 2, note: 63.43, gain: 0.52 },
    { atSec: 4.88, durSec: 2, note: 68, gain: 0.52 },
    { atSec: 4.92, durSec: 2, note: 70.89, gain: 0.52 },
  ],
}
// The same four chords at 14/12.
const FOUR_CHORDS_IN_NINTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 57, gain: 0.69 },
    { atSec: 0.04, durSec: 1.5, note: 65.19, gain: 0.52 },
    { atSec: 0.08, durSec: 1.5, note: 71, gain: 0.52 },
    { atSec: 0.12, durSec: 1.5, note: 74.68, gain: 0.52 },
    { atSec: 1.6, durSec: 1.5, note: 57, gain: 0.69 },
    { atSec: 1.64, durSec: 1.5, note: 66.49, gain: 0.52 },
    { atSec: 1.68, durSec: 1.5, note: 71, gain: 0.52 },
    { atSec: 1.72, durSec: 1.5, note: 74.68, gain: 0.52 },
    { atSec: 3.2, durSec: 1.5, note: 57, gain: 0.69 },
    { atSec: 3.24, durSec: 1.5, note: 66.49, gain: 0.52 },
    { atSec: 3.28, durSec: 1.5, note: 71, gain: 0.52 },
    { atSec: 3.32, durSec: 1.5, note: 76.81, gain: 0.52 },
    { atSec: 4.8, durSec: 2, note: 57, gain: 0.69 },
    { atSec: 4.84, durSec: 2, note: 65.19, gain: 0.52 },
    { atSec: 4.88, durSec: 2, note: 71, gain: 0.52 },
    { atSec: 4.92, durSec: 2, note: 74.68, gain: 0.52 },
  ],
}
// Six notes at 14/12, each with its stretched second, third and fourth partials written out as notes.
const PARTIALS_DRAWN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.05, note: 57, gain: 0.83 },
    { atSec: 0, durSec: 1.05, note: 71, gain: 0.55 },
    { atSec: 0, durSec: 1.05, note: 79.19, gain: 0.41 },
    { atSec: 0, durSec: 1.05, note: 85, gain: 0.3 },
    { atSec: 1.1, durSec: 1.05, note: 65.19, gain: 0.83 },
    { atSec: 1.1, durSec: 1.05, note: 79.19, gain: 0.55 },
    { atSec: 1.1, durSec: 1.05, note: 87.38, gain: 0.41 },
    { atSec: 1.1, durSec: 1.05, note: 93.19, gain: 0.3 },
    { atSec: 2.2, durSec: 1.05, note: 60.68, gain: 0.83 },
    { atSec: 2.2, durSec: 1.05, note: 74.68, gain: 0.55 },
    { atSec: 2.2, durSec: 1.05, note: 82.87, gain: 0.41 },
    { atSec: 2.2, durSec: 1.05, note: 88.68, gain: 0.3 },
    { atSec: 3.3, durSec: 1.05, note: 71, gain: 0.83 },
    { atSec: 3.3, durSec: 1.05, note: 85, gain: 0.55 },
    { atSec: 3.3, durSec: 1.05, note: 93.19, gain: 0.41 },
    { atSec: 3.3, durSec: 1.05, note: 99, gain: 0.3 },
    { atSec: 4.4, durSec: 1.05, note: 62.81, gain: 0.83 },
    { atSec: 4.4, durSec: 1.05, note: 76.81, gain: 0.55 },
    { atSec: 4.4, durSec: 1.05, note: 85, gain: 0.41 },
    { atSec: 4.4, durSec: 1.05, note: 90.81, gain: 0.3 },
    { atSec: 5.5, durSec: 1.4, note: 57, gain: 0.83 },
    { atSec: 5.5, durSec: 1.4, note: 71, gain: 0.55 },
    { atSec: 5.5, durSec: 1.4, note: 79.19, gain: 0.41 },
    { atSec: 5.5, durSec: 1.4, note: 85, gain: 0.3 },
  ],
}
// Octaves of ten semitones piled four high on B2 from the bottom, up a 5.85 semitone fifth and back.
const STACK_OF_SEVENTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 47, gain: 0.69 },
    { atSec: 0.3, durSec: 1.9, note: 57, gain: 0.55 },
    { atSec: 0.6, durSec: 1.6, note: 67, gain: 0.55 },
    { atSec: 0.9, durSec: 1.3, note: 77, gain: 0.55 },
    { atSec: 2.3, durSec: 2.2, note: 52.85, gain: 0.69 },
    { atSec: 2.6, durSec: 1.9, note: 62.85, gain: 0.55 },
    { atSec: 2.9, durSec: 1.6, note: 72.85, gain: 0.55 },
    { atSec: 3.2, durSec: 1.3, note: 82.85, gain: 0.55 },
    { atSec: 4.6, durSec: 2.6, note: 47, gain: 0.69 },
    { atSec: 4.9, durSec: 2.3, note: 57, gain: 0.55 },
    { atSec: 5.2, durSec: 2, note: 67, gain: 0.55 },
    { atSec: 5.5, durSec: 1.7, note: 77, gain: 0.55 },
  ],
}
// Octaves of fifteen semitones piled three high from the bottom, up a stretched fourth and back.
const STACK_OF_TENTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 42, gain: 0.69 },
    { atSec: 0.3, durSec: 1.9, note: 57, gain: 0.55 },
    { atSec: 0.6, durSec: 1.6, note: 72, gain: 0.55 },
    { atSec: 2.3, durSec: 2.2, note: 48.23, gain: 0.69 },
    { atSec: 2.6, durSec: 1.9, note: 63.23, gain: 0.55 },
    { atSec: 2.9, durSec: 1.6, note: 78.23, gain: 0.55 },
    { atSec: 4.6, durSec: 2.6, note: 42, gain: 0.69 },
    { atSec: 4.9, durSec: 2.3, note: 57, gain: 0.55 },
    { atSec: 5.2, durSec: 2, note: 72, gain: 0.55 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Twin bars: each world by a metal, wood or glass pair, the beat counted in its own number.
  {
    id: 'ninths-for-octaves-ten-rungs-to-home',
    name: 'Ten rungs to home',
    category: 'bell',
    description:
      'Soft metal twins beating once a second, Warp pinching every octave on the keys to a minor seventh, in a long nave.',
    preview: TUNE_PLAIN,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'One, long metal',
      params: { beat: 1, ears: 0.8, mallet: 0.25, decay: 14, tone: 0.3 },
    },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: -0.263, follow: 0, pivot: 220, drift: 0, width: 0.1 },
      },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'ninths-for-octaves-pinched-lumber',
    name: 'Pinched lumber',
    category: 'plucked',
    description:
      'Hard, short wood twins beating ten a second, with a copy ten semitones up and the wear of a cassette.',
    preview: TUNE_IN_SEVENTHS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Wood knock',
      params: { volume: -2, beat: 10, mallet: 0.9, decay: 1, damp: 0.6 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        params: { pitchA: 10, mode: 3, mix: 0.4, tone: 5000, spread: 0.8 },
      },
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.1, wobble: 0.4 } },
    ],
  },
  {
    id: 'ninths-for-octaves-answered-at-the-seventh',
    name: 'Answered at the seventh',
    category: 'bell',
    description:
      'Glass twins on a cassette, beating five a second, answered a second later ten semitones up and then ten down.',
    preview: TUNE_IN_SEVENTHS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Bright glass',
      params: { volume: -5.5, beat: 5, mallet: 0.6, tone: 0.7, decay: 3 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 2,
          gap: 1.04,
          interval1: 10,
          interval2: -10,
          fade: 0.2,
          spread: 0.9,
          tone: 6000,
          mix: 0.5,
        },
      },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0, wow: 0.3 } },
    ],
  },
  {
    id: 'ninths-for-octaves-sevenths-under-wool',
    name: 'Sevenths under wool',
    category: 'pad',
    description:
      'The softest, darkest metal with its strikes blurred away over half a second and its bands drifting side to side.',
    preview: STACK_OF_SEVENTHS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Dark soft metal',
      params: { volume: -4.5, beat: 1, mallet: 0, tone: 0.1, decay: 20 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 520, mix: 1 } },
      { deviceId: 'currents', preset: 'Wide tide', params: { depth: 0.7, rate: 0.3 } },
    ],
  },
  {
    id: 'ninths-for-octaves-ten-semitone-sparkle',
    name: 'Ten semitone sparkle',
    category: 'bell',
    description:
      'Hard bright glass; sines ten semitones over its strongest partials swell in behind it, through two springs.',
    preview: TUNE_IN_SEVENTHS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Bright glass',
      params: { volume: -4, beat: 10, ears: 0.3, decay: 2, damp: 0.5 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: { transpose: 10, partials: 6, attack: 500, release: 2.5, mix: 0.6, spread: 0.8 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'ninths-for-octaves-pure-third-in-the-glass',
    name: 'Pure third in the glass',
    category: 'bell',
    description:
      'Glass, whose second mode is the pure third of this scale, left nearly alone: a 1.1 hertz beat and a small plate.',
    preview: TUNE_A_SEMITONE_SHORT,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Glass, middle',
      params: { beat: 1.1, ears: 0.2, mallet: 0.1, tone: 0.45, decay: 9 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } }],
  },
  {
    id: 'ninths-for-octaves-short-octave-planks',
    name: 'Short octave planks',
    category: 'plucked',
    description:
      'Wood twins with every interval pinched by a twelfth in Warp, two tape heads galloping behind.',
    preview: TUNE_PLAIN,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Flam of wood',
      params: { volume: 1.5, beat: 5.5, scatter: 20, mallet: 0.6, decay: 1.4 },
    },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: -0.1255, follow: 0, pivot: 220, drift: 0, tone: -0.3 },
      },
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 330, mix: 0.4 } },
    ],
  },
  {
    id: 'ninths-for-octaves-phase-of-the-eleventh',
    name: 'Phase of the eleventh',
    category: 'bell',
    description:
      'Uncut metal bars, their second mode near the twelfth of this scale, through twelve slow phaser stages and a reversed tail.',
    preview: TUNE_A_SEMITONE_SHORT,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Scattered metal',
      params: { beat: 5.5, mallet: 0.7, scatter: 12, decay: 7 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { rate: 0.12, mix: 0.6 } },
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 1, mix: 0.3 } },
    ],
  },
  {
    id: 'ninths-for-octaves-semitone-below-the-door',
    name: 'Semitone below the door',
    category: 'pad',
    description:
      'Soft wood hum, each chord repeated by grains eleven semitones up that keep climbing by the same step.',
    preview: FOUR_CHORDS_PINCHED,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Soft wood hum',
      params: { volume: -2.5, beat: 2.2, tone: 0.15, decay: 6 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        params: {
          pitch: 11,
          time: 480,
          size: 200,
          feedback: 0.5,
          reverse: 0,
          pitchSpray: 0,
          tone: 4500,
          mix: 0.4,
        },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'ninths-for-octaves-low-metal-tide',
    name: 'Low metal tide',
    category: 'pad',
    description:
      'Long metal with the attack taken off each chord, in a low cathedral that swells in slowly.',
    preview: FOUR_CHORDS_PINCHED,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Slow metal bowl',
      params: { beat: 1.1, mallet: 0.4, tone: 0.55, decay: 18 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 700 } },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.5, gravity: 0.3 } },
    ],
  },
  {
    id: 'ninths-for-octaves-turning-minor-ninths',
    name: 'Turning minor ninths',
    category: 'bell',
    description:
      'Glass beating thirteen a second in the air, caught by three loops of unequal length that never line up.',
    preview: ROUND_OF_SIX,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Twelve, glass',
      params: { volume: -2.5, beat: 13, ears: 0, mallet: 0.5, decay: 1.4 },
    },
    effects: [
      {
        deviceId: 'orbits',
        preset: 'Out of step',
        params: { loops: 3, length: 1.5, feedback: 0.6, mix: 0.45 },
      },
    ],
  },
  {
    id: 'ninths-for-octaves-thirteen-step-bronze',
    name: 'Thirteen step bronze',
    category: 'bell',
    description:
      'Metal struck hard, octaves warped out to minor ninths, with dark murky repeats six tenths of a second apart.',
    preview: TUNE_PLAIN,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Eight, hard',
      params: { volume: -4.5, beat: 6.5, ears: 0.9, decay: 4 },
    },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: 0.1155, follow: 0, pivot: 220, drift: 0, tone: -0.4, width: 0.5 },
      },
      { deviceId: 'analog-delay', preset: 'Murky', params: { time: 620, feedback: 0.5, mix: 0.4 } },
    ],
  },
  {
    id: 'ninths-for-octaves-flam-against-the-box',
    name: 'Flam against the box',
    category: 'plucked',
    description:
      'Two wood bars struck thirty milliseconds apart and sounded inside a wooden soundboard.',
    preview: TUNE_A_SEMITONE_OVER,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Flam of wood',
      params: { volume: 0, beat: 13, scatter: 30, mallet: 0.5, decay: 1.2, ears: 1 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { body: 5, size: 1.6, mix: 0.8 } },
      { deviceId: 'stereo-detune', preset: 'Faint width' },
    ],
  },
  {
    id: 'ninths-for-octaves-parting-by-hertz',
    name: 'Parting by hertz',
    category: 'bell',
    description:
      'Glass at a slow beat, its two sides echoed and shifted opposite ways by a hertz and a half, into a shining tail.',
    preview: ROUND_OF_SIX,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Glass bowl',
      params: { beat: 1.3, mallet: 0.5, decay: 5, ears: 0.4 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Parting echo',
        params: { shift: 0, fine: 1.5, mode: 2, feedback: 0.3, mix: 0.5 },
      },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ninths-for-octaves-staccato-past-the-octave',
    name: 'Staccato past the octave',
    category: 'plucked',
    description:
      'Damped metal, each stroke scattered as two or three repeats that climb thirteen semitones at a time.',
    preview: TUNE_A_SEMITONE_OVER,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Three, short',
      params: { volume: -2, beat: 6.5, mallet: 0.8, decay: 0.7, damp: 1 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        params: {
          pitch: 13,
          time: 390,
          size: 90,
          feedback: 0.4,
          spray: 0.05,
          pitchSpray: 0,
          tone: 7000,
          spread: 1,
          mix: 0.35,
        },
      },
    ],
  },
  {
    id: 'ninths-for-octaves-the-ninth-is-home',
    name: 'The ninth is home',
    category: 'bell',
    description:
      'Bright metal twins with every octave on the keys stretched to a major ninth by Warp, in an open modulated space.',
    preview: FOUR_CHORDS_PLAIN,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Half a hertz',
      params: { volume: -6.5, beat: 1.4, ears: 0.5, mallet: 0.5, tone: 0.6, decay: 10 },
    },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: 0.2224, follow: 0, pivot: 220, drift: 0, tone: -0.2, width: 0.6 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, decay: 6 } },
    ],
  },
  {
    id: 'ninths-for-octaves-ninth-behind-the-pane',
    name: 'Ninth behind the pane',
    category: 'bell',
    description:
      'Damped glass with pure sines a major ninth above it arriving late and lingering, set a few steps back.',
    preview: TUNE_IN_NINTHS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Damped glass',
      params: { volume: -4, beat: 7, mallet: 0.4, damp: 0.7 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: { transpose: 14, partials: 3, attack: 250, release: 4, mix: 0.55 },
      },
      { deviceId: 'distance', preset: 'A few steps back', params: { distance: 0.5, wander: 0 } },
    ],
  },
  {
    id: 'ninths-for-octaves-kitchen-table-ninths',
    name: 'Kitchen table ninths',
    category: 'plucked',
    description:
      'Wood beating fourteen a second through a small radio, with a copy a major ninth above.',
    preview: TUNE_IN_NINTHS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Wood flutter',
      params: { beat: 14, mallet: 0.4, decay: 2, damp: 0.2 },
    },
    effects: [
      { deviceId: 'pitch-shifter', params: { pitchA: 14, mode: 0, size: 80, mix: 0.3 } },
      { deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0, mix: 0.85 } },
    ],
  },
  {
    id: 'ninths-for-octaves-smoke-off-the-ninth',
    name: 'Smoke off the ninth',
    category: 'pad',
    description:
      'Metal wholly parted between the ears, its attacks swelled away and its spectrum smeared into a hanging mist.',
    preview: FOUR_CHORDS_IN_NINTHS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Six, one an ear',
      params: { beat: 1.4, ears: 1, tone: 0.5, decay: 14 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Backwards', params: { attack: 500 } },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.75, blur: 0.6 } },
    ],
  },
  {
    id: 'ninths-for-octaves-pebble-over-nine',
    name: 'Pebble over nine',
    category: 'plucked',
    description:
      'Soft wood whose echoes skip closer together and duller, the band between 400 and 3000 hertz pulsed five times a second.',
    preview: TUNE_IN_NINTHS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Two, soft wood',
      params: { volume: 1, beat: 2.8, mallet: 0.5, tone: 0.6, decay: 1.8 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Skipping stone', params: { first: 420, mix: 0.5 } },
      {
        deviceId: 'band-pulse',
        preset: 'Four a second',
        params: { rate: 5, low: 400, high: 3000, depth: 0.6 },
      },
    ],
  },
  {
    id: 'ninths-for-octaves-two-octaves-in-tenths',
    name: 'Two octaves in tenths',
    category: 'bell',
    description:
      'Uncut bars, whose second mode lands on a pure ninth of this scale, in a dark plate at a beat of 1.5 hertz.',
    preview: TUNE_IN_TENTHS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Four a second',
      params: { beat: 1.5, ears: 0.7, mallet: 0.6, tone: 0.7, decay: 8 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.45, decay: 0.8 } },
    ],
  },
  {
    id: 'ninths-for-octaves-orbit-of-the-tenth',
    name: 'Orbit of the tenth',
    category: 'bell',
    description:
      'Glass with octaves stretched to minor tenths on the keys, carried round the head on a slow circle.',
    preview: TUNE_PLAIN,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Ten in the air',
      params: { volume: -3.5, beat: 7.5, mallet: 0.25, decay: 6, tone: 0.5 },
    },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: 0.3219, follow: 0, pivot: 220, drift: 0, tone: -0.1, mix: 1, width: 0 },
      },
      { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.35 } },
    ],
  },
  {
    id: 'ninths-for-octaves-woodpile-remembering',
    name: 'Woodpile remembering',
    category: 'plucked',
    description:
      'Wood beating fifteen a second, with moments from earlier drifting back under a run of dim repeats.',
    preview: TUNE_IN_TENTHS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Ten, wood in air',
      params: { volume: -0.5, beat: 15, ears: 0.5, decay: 1.6, mallet: 0.7 },
    },
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Dark trail',
        params: { time: 780, feedback: 0.6, memory: 0.8, reach: 6, mix: 0.45 },
      },
    ],
  },
  {
    id: 'ninths-for-octaves-tenths-played-inward',
    name: 'Tenths played inward',
    category: 'pad',
    description:
      'Long glass with a copy fifteen semitones above, most of it heard backwards in slow overlapping pieces.',
    preview: STACK_OF_TENTHS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Glass bowl',
      params: { volume: -7.5, beat: 0.75, mallet: 0.6, decay: 12, tone: 0.7 },
    },
    effects: [
      { deviceId: 'pitch-shifter', params: { pitchA: 15, mode: 3, mix: 0.4 } },
      {
        deviceId: 'reverse-delay',
        preset: 'Slow swells',
        params: { time: 1100, feedback: 0.3, mix: 0.75 },
      },
    ],
  },
  {
    id: 'ninths-for-octaves-stack-in-the-cabinet',
    name: 'Stack in the cabinet',
    category: 'bell',
    description:
      'Metal twins fully apart, beating fifteen a second, driven through a warm speaker stack and a slow harmonic tremolo.',
    preview: STACK_OF_TENTHS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Seven, paired',
      params: { volume: -4.5, beat: 15, ears: 1, mallet: 0.5, tone: 0.4, decay: 5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack', params: { drive: 0.45, room: 0.6 } },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 1.5, depth: 0.7 } },
    ],
  },
  // Bells: Stretch set to the number of the world, so every partial that met a note still meets one.
  {
    id: 'ninths-for-octaves-pinched-tower-at-dusk',
    name: 'Pinched tower at dusk',
    category: 'pad',
    description:
      'A bell rubbed until it sings, pinched so each octave is a minor seventh, breathing in slow waves in a dark cave.',
    preview: STACK_OF_SEVENTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Bowed bell',
      params: {
        volume: -14.5,
        stretch: 0.8333,
        sustain: 0.9,
        brightness: 0.25,
        decay: 14,
        spread: 0.9,
      },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Tide',
        params: { in: 1.6, out: 2, hold: 0.2, rest: 0.2, depth: 0.6, air: 0.1 },
      },
      {
        deviceId: 'fdn-reverb',
        preset: 'Dark cave',
        params: { decay: 6, breathDepth: 0, mix: 0.35 },
      },
    ],
  },
  {
    id: 'ninths-for-octaves-tine-in-ten',
    name: 'Tine in ten',
    category: 'plucked',
    description:
      'Kalimba tines pinched to a ten semitone octave, short and close, warmed on a valve and echoed off one slack coil.',
    preview: TUNE_IN_SEVENTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { stretch: 0.8333, decay: 1.6, hardness: 0.45, position: 0.3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.45 } },
      { deviceId: 'spring-reverb', preset: 'Single slack coil', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ninths-for-octaves-gong-in-a-low-doorway',
    name: 'Gong in a low doorway',
    category: 'bell',
    description:
      'A pinched gong in a wide slow beat, its rise of overtones swept by a filter as each stroke opens and shuts it.',
    preview: TUNE_IN_SEVENTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: {
        volume: 1.5,
        stretch: 0.8333,
        decay: 9,
        hardness: 0.45,
        brightness: 0.45,
        release: 0.2,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Touch wah',
        params: { cutoffHz: 350, resonance: 1.6, envAmount: 45, envReleaseMs: 900, mix: 0.9 },
      },
      { deviceId: 'around', preset: 'Barely moving' },
    ],
  },
  {
    id: 'ninths-for-octaves-answered-ten-below',
    name: 'Answered ten below',
    category: 'bell',
    description:
      'Vibraphone bars pinched to ten semitones an octave, struck hard, the line answered two seconds later an octave of ten down.',
    preview: TUNE_IN_SEVENTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { stretch: 0.8333, decay: 10, hardness: 0.75, brightness: 0.65, release: 0 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 1,
          gap: 2.08,
          interval1: -10,
          fade: 0.1,
          spread: 0.6,
          tone: 5000,
          mix: 0.45,
        },
      },
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ninths-for-octaves-dim-bell-of-eleven',
    name: 'Dim bell of eleven',
    category: 'bell',
    description:
      'A church bell whose octave is a major seventh, dark, eighteen seconds long and beating once a second.',
    preview: FOUR_CHORDS_PINCHED,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Distant bell',
      params: {
        stretch: 0.9167,
        decay: 18,
        brightness: 0.3,
        hardness: 0.3,
        position: 0.3,
        damping: 0.5,
        detune: 1,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 4500 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ninths-for-octaves-goblets-one-step-shy',
    name: 'Goblets one step shy',
    category: 'pad',
    description:
      'Glasses rubbed with a wet finger, pinched by a twelfth of every interval, shivering at a wide beat with two voices close by.',
    preview: FOUR_CHORDS_PINCHED,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { stretch: 0.9167, sustain: 1, detune: 5, brightness: 0.6, decay: 6 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by', params: { mix: 0.5 } },
      { deviceId: 'tamer', preset: 'Gentle' },
    ],
  },
  {
    id: 'ninths-for-octaves-rosewood-short-of-eight',
    name: 'Rosewood short of eight',
    category: 'plucked',
    description:
      'Wood bars pinched to an eleven semitone octave, knocked short inside a drum with a slap behind them.',
    preview: TUNE_A_SEMITONE_SHORT,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: { volume: 5, stretch: 0.9167, decay: 0.9, hardness: 0.7, position: 0.25 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { size: 0.8, mix: 0.6 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 140, mix: 0.35 } },
    ],
  },
  {
    id: 'ninths-for-octaves-bowl-of-major-sevenths',
    name: 'Bowl of major sevenths',
    category: 'bell',
    description:
      'A bowl at the pinched octave of eleven, its partials handed out one by one as the delay fans low to high.',
    preview: TUNE_A_SEMITONE_SHORT,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: { stretch: 0.9167, decay: 5, hardness: 0.65, brightness: 0.7, position: 0.05 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { time: 900, bands: 24, mix: 0.55 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'ninths-for-octaves-rubbed-round-of-ninths',
    name: 'Rubbed round of ninths',
    category: 'pad',
    description:
      'A bowl rubbed at six tenths, stretched so its octave is a minor ninth, in a summer tail that stays at pitch.',
    preview: ROUND_OF_SIX,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: {
        volume: -12.5,
        stretch: 1.0833,
        sustain: 0.6,
        decay: 7,
        hardness: 0.4,
        detune: 1.3,
      },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Wide summer', params: { bloom: 0, mix: 0.4 } }],
  },
  {
    id: 'ninths-for-octaves-thumb-over-thirteen',
    name: 'Thumb over thirteen',
    category: 'plucked',
    description:
      'Kalimba tines stretched by a twelfth, caught by a half second loop and played through an early converter.',
    preview: TUNE_A_SEMITONE_OVER,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { stretch: 1.0833, decay: 5, damping: 0.4, hardness: 0.8, brightness: 0.6 },
    },
    effects: [
      {
        deviceId: 'micro-looper',
        preset: 'Clean hold',
        params: { state: 2, length: 0.52, mix: 0.4 },
      },
      { deviceId: 'vintage-digital', preset: 'Glaze' },
    ],
  },
  {
    id: 'ninths-for-octaves-chimes-off-the-ladder',
    name: 'Chimes off the ladder',
    category: 'bell',
    description:
      'Thin metal chimes stretched past the octave and lit by scattered points of echo around the room.',
    preview: TUNE_A_SEMITONE_OVER,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: { volume: -6.5, stretch: 1.0833, decay: 4, hardness: 0.7, brightness: 0.65 },
    },
    effects: [
      {
        deviceId: 'constellation',
        preset: 'Scattered seven',
        params: { span: 1800, again: 0.2, mix: 0.45 },
      },
    ],
  },
  {
    id: 'ninths-for-octaves-bell-leaning-outward',
    name: 'Bell leaning outward',
    category: 'bell',
    description:
      'A church bell stretched to thirteen twelfths whose tail lifts and thins as it ages.',
    preview: ROUND_OF_SIX,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { stretch: 1.0833, decay: 10, hardness: 0.35, brightness: 0.4, release: 0.3 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Into thin air', params: { sag: 40, mix: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'ninths-for-octaves-doorway-at-fourteen',
    name: 'Doorway at fourteen',
    category: 'bell',
    description:
      'A church bell at fourteen twelfths, partials at 0, 1400, 2219 and 2800 cents, in a small bright chamber.',
    preview: TUNE_IN_NINTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: {
        stretch: 1.1667,
        decay: 20,
        hardness: 0.6,
        position: 0.05,
        detune: 0.6,
        spread: 0.5,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.22 } }],
  },
  {
    id: 'ninths-for-octaves-wrong-world-same-tune',
    name: 'Wrong world, same tune',
    category: 'bell',
    description:
      'A church bell left at its own octave: a tune in stretched steps clashes sourly with it in a tight chamber.',
    preview: TUNE_IN_NINTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: {
        volume: -14.5,
        stretch: 1,
        decay: 20,
        hardness: 0.7,
        position: 0.02,
        detune: 0.3,
        spread: 0.1,
        brightness: 0.6,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.12 } }],
  },
  {
    id: 'ninths-for-octaves-vibraphone-with-a-ninth',
    name: 'Vibraphone with a ninth',
    category: 'keys',
    description:
      'Vibraphone bars stretched to a ninth, soft yarn on them, through a slow rotating horn over faint tape hiss.',
    preview: FOUR_CHORDS_IN_NINTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { stretch: 1.1667, hardness: 0.1, decay: 5, position: 0.7, release: 0.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.8 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -62 } },
    ],
  },
  {
    id: 'ninths-for-octaves-glass-at-nine-fathoms',
    name: 'Glass at nine fathoms',
    category: 'bell',
    description:
      'Glasses stretched to a ninth and tapped, sunk under deep water that wavers and bubbles at each touch.',
    preview: TUNE_IN_NINTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { stretch: 1.1667, decay: 6, hardness: 0.6 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Deep water', params: { bubbles: 0.5 } },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ninths-for-octaves-gong-of-far-ninths',
    name: 'Gong of far ninths',
    category: 'drone',
    description:
      'A rubbed gong stretched to a ninth, only the tones two moments share let through, so the pedal hangs on.',
    preview: FOUR_CHORDS_IN_NINTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed gong',
      params: { stretch: 1.1667, sustain: 0.7, brightness: 0.3, decay: 10 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.8 } },
      { deviceId: 'ether-reverb', preset: 'Distant', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ninths-for-octaves-tenths-in-a-copper-bowl',
    name: 'Tenths in a copper bowl',
    category: 'drone',
    description:
      'A dark bowl with its octave out at a minor tenth, loops of it piling up slowly on worn tape.',
    preview: STACK_OF_TENTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Dark bowl',
      params: { stretch: 1.25, decay: 16, hardness: 0.3, brightness: 0.4, detune: 0.75 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 2.3, feedback: 0.6, mix: 0.5 },
      },
    ],
  },
  {
    id: 'ninths-for-octaves-fifteen-on-the-thumb',
    name: 'Fifteen on the thumb',
    category: 'plucked',
    description:
      'Kalimba tines stretched to fifteen semitones an octave, plucked bright through a flanger standing still and a faint plate.',
    preview: TUNE_IN_TENTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { stretch: 1.25, decay: 3.5, hardness: 0.9, position: 0.02, detune: 2, spread: 0.8 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Standing comb', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'ninths-for-octaves-belfry-of-minor-tenths',
    name: 'Belfry of minor tenths',
    category: 'bell',
    description:
      'A far church bell stretched to fifteen twelfths, struck with felt and swung across a stone stairwell.',
    preview: TUNE_IN_TENTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Distant bell',
      params: {
        volume: -1.5,
        stretch: 1.25,
        decay: 12,
        hardness: 0.25,
        brightness: 0.35,
        detune: 3,
      },
    },
    effects: [
      { deviceId: 'distance', preset: 'Stone stairwell' },
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.4 } },
    ],
  },
  {
    id: 'ninths-for-octaves-comb-teeth-in-tenths',
    name: 'Comb teeth in tenths',
    category: 'bell',
    description:
      'A music box comb stretched to a tenth, off a badly warped record with a little crackle and a faint echo.',
    preview: TUNE_IN_TENTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { volume: -1.5, stretch: 1.25, decay: 2, hardness: 0.6, brightness: 0.4 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Warped', params: { crackle: 0.2 } },
      { deviceId: 'analog-delay', preset: 'Faint halo', params: { mix: 0.3 } },
    ],
  },
  // Handpan and tongues: partials in whole steps of two and three, so Warp moves them or near sines stand alone.
  {
    id: 'ninths-for-octaves-seven-for-home-in-steel',
    name: 'Seven for home in steel',
    category: 'plucked',
    description:
      'A handpan under flat soft hands, octaves on the keys drawn in to minor sevenths by Warp, in a bright hall.',
    preview: TUNE_PLAIN,
    instrument: {
      deviceId: 'handpan',
      preset: 'Soft hands',
      params: { touch: 0.1, position: 0.3, decay: 5, sympathy: 0.2, shimmer: 0.2 },
    },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: -0.263, follow: 0, pivot: 220, drift: 0, width: 0.4 },
      },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ninths-for-octaves-tongues-ten-apart',
    name: 'Tongues ten apart',
    category: 'plucked',
    description:
      'A clean tongue drum, nearly one sine a note, grains ten semitones under it, and a low-pass that moves very slowly.',
    preview: TUNE_IN_SEVENTHS,
    instrument: { deviceId: 'handpan', preset: 'Pure tongue', params: { decay: 4 } },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { pitch: -10, size: 260, density: 24, spray: 0.1, reverse: 0, mix: 0.45 },
      },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { cutoffHz: 1800 } },
    ],
  },
  {
    id: 'ninths-for-octaves-knuckles-fall-a-seventh',
    name: 'Knuckles fall a seventh',
    category: 'plucked',
    description:
      'Knuckles on steel, its octaves pinched to ten semitones by Warp, each stroke trailed by pieces that fall those ten as they fade.',
    preview: TUNE_PLAIN,
    instrument: { deviceId: 'handpan', preset: 'Knuckles', params: { touch: 0.8, decay: 2 } },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: -0.263, follow: 0, pivot: 220, drift: 0, width: 0.1 },
      },
      {
        deviceId: 'falling',
        params: { fall: -10, curve: 0, vary: 0, size: 600, density: 8, again: 0, mix: 0.45 },
      },
      { deviceId: 'spread', preset: 'Open middle' },
    ],
  },
  {
    id: 'ninths-for-octaves-muted-well-in-ten',
    name: 'Muted well in ten',
    category: 'plucked',
    description:
      'Palm muted strokes over a heavy air cavity, tuned to ten semitone octaves and played inside a cistern.',
    preview: TUNE_IN_SEVENTHS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Palm mute',
      params: { cavity: 1, touch: 0.3, decay: 1.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.75 } },
      { deviceId: 'saturator', preset: 'On tape' },
    ],
  },
  {
    id: 'ninths-for-octaves-sevenths-held-in-frost',
    name: 'Sevenths held in frost',
    category: 'pad',
    description:
      'Shimmering steel caught and held as an even pad, with the spectrum of the pan pinched first by Warp.',
    preview: FOUR_CHORDS_PLAIN,
    instrument: { deviceId: 'handpan', preset: 'Slow shimmer', params: { decay: 8, touch: 0.2 } },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: -0.263, follow: 0, pivot: 220, drift: 0, width: 1, tone: 0.3 },
      },
      { deviceId: 'sustainer', preset: 'Glass organ', params: { mix: 0.7, attack: 0.2 } },
    ],
  },
  {
    id: 'ninths-for-octaves-eleven-from-the-centre',
    name: 'Eleven from the centre',
    category: 'bell',
    description:
      'The centre tone alone, a near sine at pinched intervals, its late vibrato opening as it rings.',
    preview: TUNE_A_SEMITONE_SHORT,
    instrument: {
      deviceId: 'handpan',
      preset: 'Centre tone',
      params: { position: 0, shimmer: 0, cavity: 0, sympathy: 0, decay: 6 },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        preset: 'Opens to chorus',
        params: { wait: 150, grow: 500, depth: 45, width: 1 },
      },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'ninths-for-octaves-tank-hit-under-the-stair',
    name: 'Tank hit under the stair',
    category: 'plucked',
    description:
      'A tank drum hit with a rubber beater, all steps pinched by a twelfth in Warp, through dotted tape heads.',
    preview: TUNE_PLAIN,
    instrument: {
      deviceId: 'handpan',
      preset: 'Tank drum',
      params: { touch: 0.55, decay: 2.5, shimmer: 0.7 },
    },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: -0.1255, follow: 0, pivot: 220, drift: 0, width: 0.2, tone: -0.6 },
      },
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 520, mix: 0.4 } },
    ],
  },
  {
    id: 'ninths-for-octaves-major-seventh-crossing',
    name: 'Major seventh crossing',
    category: 'plucked',
    description:
      'Dry slit drum strokes and one follower eleven semitones up that feeds the line again, climbing as it fades.',
    preview: TUNE_A_SEMITONE_SHORT,
    instrument: {
      deviceId: 'handpan',
      preset: 'Slit drum',
      params: { volume: 1.5, touch: 0.7, position: 0.8, decay: 1.2, cavity: 0.4 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 1,
          gap: 0.78,
          interval1: 11,
          round: 0.6,
          fade: 0.3,
          spread: 1,
          tone: 9000,
          mix: 0.5,
        },
      },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
  },
  {
    id: 'ninths-for-octaves-edge-notes-at-a-slant',
    name: 'Edge notes at a slant',
    category: 'bell',
    description:
      'Struck at the rim for its overtones, pinched by a twelfth in Warp, each partial with its own tremolo, off an old shortwave set.',
    preview: FOUR_CHORDS_PLAIN,
    instrument: {
      deviceId: 'handpan',
      preset: 'Edge overtones',
      params: { touch: 0.7, decay: 7, sympathy: 0.9 },
    },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: -0.1255, follow: 0, pivot: 220, drift: 0, width: 0.2 },
      },
      { deviceId: 'glimmer', preset: 'Glitter on top', params: { depth: 0.9, rate: 3 } },
      { deviceId: 'patina', preset: 'Shortwave', params: { noise: 0.1, mix: 0.7 } },
    ],
  },
  {
    id: 'ninths-for-octaves-pinched-halo-at-evening',
    name: 'Pinched halo at evening',
    category: 'pad',
    description:
      'A ringing pan with sympathy full, its attacks swelled off and its partials drawn in by a twelfth.',
    preview: FOUR_CHORDS_PLAIN,
    instrument: { deviceId: 'handpan', preset: 'Halo', params: { decay: 9, touch: 0.3 } },
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 400, retrigger: 0 } },
      {
        deviceId: 'warp',
        params: { stretch: -0.1255, follow: 0, pivot: 220, drift: 0, width: 0.8, tone: -0.2 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'ninths-for-octaves-pan-gone-past-eight',
    name: 'Pan gone past eight',
    category: 'plucked',
    description:
      'Hard strokes halfway to the rim, octaves on the keys pushed out to minor ninths by Warp, on a slow wander round the head.',
    preview: TUNE_PLAIN,
    instrument: {
      deviceId: 'handpan',
      preset: 'Bright bloom',
      params: { volume: -2.5, touch: 0.7, position: 0.6, decay: 4, cavity: 0.2 },
    },
    effects: [
      { deviceId: 'warp', params: { stretch: 0.1155, follow: 0, pivot: 220, drift: 0, width: 0 } },
      { deviceId: 'around', preset: 'Slow wander', params: { rate: 0.3, near: 0.3 } },
    ],
  },
  {
    id: 'ninths-for-octaves-minor-ninth-rain',
    name: 'Minor ninth rain',
    category: 'texture',
    description:
      'Light fingertip taps, damped, whose repeats are cut into grains a minor ninth up that fall at random.',
    preview: ROUND_OF_SIX,
    instrument: {
      deviceId: 'handpan',
      preset: 'Rain taps',
      params: { volume: 1, touch: 0.4, position: 0.2, decay: 0.8 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        params: {
          pitch: 13,
          time: 250,
          spray: 0.6,
          size: 140,
          density: 2,
          feedback: 0.3,
          pitchSpray: 0,
          spread: 1,
          mix: 0.5,
        },
      },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  {
    id: 'ninths-for-octaves-round-on-green-tongues',
    name: 'Round on green tongues',
    category: 'plucked',
    description:
      'A long clean tongue playing a round of minor ninths, gated by two patterns that drift apart.',
    preview: ROUND_OF_SIX,
    instrument: {
      deviceId: 'handpan',
      preset: 'Pure tongue',
      params: { volume: -2, decay: 8, touch: 0.3, position: 0.25 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Slow drift', params: { rate: 5, floor: 0.2, mix: 1 } },
      { deviceId: 'ether-reverb', preset: 'Faint air', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ninths-for-octaves-thirteen-on-warm-steel',
    name: 'Thirteen on warm steel',
    category: 'plucked',
    description:
      'Soft hands on steel with a copy thirteen semitones up, both driven into an iron transformer across the room.',
    preview: TUNE_A_SEMITONE_OVER,
    instrument: {
      deviceId: 'handpan',
      preset: 'Low ding',
      params: { decay: 3, shimmer: 0.5, position: 0.05 },
    },
    effects: [
      { deviceId: 'pitch-shifter', params: { pitchA: 13, mode: 0, size: 60, mix: 0.35 } },
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.6 } },
      { deviceId: 'distance', preset: 'Across the room', params: { wander: 0.4 } },
    ],
  },
  {
    id: 'ninths-for-octaves-skips-over-the-ninth',
    name: 'Skips over the ninth',
    category: 'plucked',
    description:
      'A bright tongue plucked hard, echoes bouncing closer and dropping sixty cents at every skip.',
    preview: TUNE_A_SEMITONE_OVER,
    instrument: {
      deviceId: 'handpan',
      preset: 'Bright tongue',
      params: { volume: 1.5, touch: 0.5, position: 0.7, decay: 2 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Falling steps',
        params: { drop: 60, bounce: 0.8, first: 380, mix: 0.4 },
      },
      { deviceId: 'phaser', preset: 'Faint shade' },
    ],
  },
  {
    id: 'ninths-for-octaves-fourteen-fields-of-steel',
    name: 'Fourteen fields of steel',
    category: 'plucked',
    description:
      'Handpan fields whose octaves become major ninths under Warp, so their partials meet again, in a wide valley.',
    preview: FOUR_CHORDS_PLAIN,
    instrument: {
      deviceId: 'handpan',
      preset: 'Soft hands',
      params: { decay: 5, touch: 0.5, position: 0.5, shimmer: 0.1, sympathy: 0 },
    },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: 0.2224, follow: 0, pivot: 220, drift: 0, width: 0.15 },
      },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3, decay: 5 } },
    ],
  },
  {
    id: 'ninths-for-octaves-four-sines-make-a-bell',
    name: 'Four sines make a bell',
    category: 'bell',
    description:
      'Near sines with the damper off: the phrase writes the stretched partials itself, and a faint chorus joins them.',
    preview: PARTIALS_DRAWN,
    instrument: {
      deviceId: 'handpan',
      preset: 'Pure tongue',
      params: { decay: 10, sympathy: 0.2, touch: 0.05 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air' },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'ninths-for-octaves-ninth-shadow-on-steel',
    name: 'Ninth shadow on steel',
    category: 'plucked',
    description:
      'Steel with sines a major ninth over each strong partial, following slowly and lingering four seconds.',
    preview: PARTIALS_DRAWN,
    instrument: {
      deviceId: 'handpan',
      preset: 'Clean steel',
      params: { decay: 1.2, touch: 0.3, position: 0.1 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: { transpose: 14, partials: 4, attack: 120, release: 4, spread: 1, mix: 0.7 },
      },
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.8 } },
    ],
  },
  {
    id: 'ninths-for-octaves-bow-the-fourteenth',
    name: 'Bow the fourteenth',
    category: 'pad',
    description:
      'A long tongue heard backwards in swelling pieces, its notes set out in ninths, with tape wear on top.',
    preview: FOUR_CHORDS_IN_NINTHS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Pure tongue',
      params: { position: 0.4, shimmer: 0.4, decay: 9, touch: 0.4 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards only', params: { time: 900 } },
      { deviceId: 'tape', preset: 'Drifting chorus' },
    ],
  },
  {
    id: 'ninths-for-octaves-coil-and-ninth',
    name: 'Coil and ninth',
    category: 'plucked',
    description:
      'Damped knuckles on steel stretched to ninths by Warp, doubled a major ninth up, into an overdriven spring tank.',
    preview: TUNE_PLAIN,
    instrument: {
      deviceId: 'handpan',
      preset: 'Knuckles',
      params: { damp: 0.8, decay: 1.2, touch: 1, position: 0.9 },
    },
    effects: [
      { deviceId: 'warp', params: { stretch: 0.2224, follow: 0, pivot: 220, drift: 0, width: 0 } },
      { deviceId: 'pitch-shifter', params: { pitchA: 14, mode: 3, mix: 0.4, tone: 7000 } },
      { deviceId: 'spring-reverb', preset: 'Overdriven tank', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'ninths-for-octaves-tenths-for-two-palms',
    name: 'Tenths for two palms',
    category: 'plucked',
    description:
      'A low pan with a deep cavity whose octaves Warp sends out to minor tenths, levelled gently after.',
    preview: TUNE_PLAIN,
    instrument: {
      deviceId: 'handpan',
      preset: 'Low ding',
      params: { decay: 4, touch: 0.6, cavity: 1 },
    },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: 0.3219, follow: 0, pivot: 220, drift: 0, width: 0.5, tone: -0.5 },
      },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'ninths-for-octaves-unwound-steel',
    name: 'Unwound steel',
    category: 'plucked',
    description:
      'Steel stretched by a quarter in Warp and left to melt, its tail sagging in pitch until it goes.',
    preview: TUNE_PLAIN,
    instrument: {
      deviceId: 'handpan',
      preset: 'Halo',
      params: { decay: 6, touch: 0.4, shimmer: 0.6 },
    },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: 0.3219, follow: 0, pivot: 220, drift: 0, width: 1, tone: 0.1 },
      },
      { deviceId: 'melt', preset: 'Soft sag', params: { sag: -45, mix: 0.5 } },
    ],
  },
  {
    id: 'ninths-for-octaves-minor-tenth-in-a-jar',
    name: 'Minor tenth in a jar',
    category: 'plucked',
    description:
      'Tongues in stretched tuning ringing inside a glass tube, and then in a small dark room.',
    preview: TUNE_IN_TENTHS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { touch: 0.4, decay: 3, position: 0.6 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.6, size: 0.7 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ninths-for-octaves-cloud-fifteen-over',
    name: 'Cloud fifteen over',
    category: 'pad',
    description:
      'Slow shimmer turned to grains fifteen semitones up and sown back and forth over the dry pan.',
    preview: STACK_OF_TENTHS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Slow shimmer',
      params: { volume: -2, decay: 10, touch: 0.5, position: 0.1 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        params: {
          pitch: 15,
          size: 420,
          density: 14,
          spray: 0.4,
          texture: 0.6,
          reverse: 0.5,
          feedback: 0.2,
          spread: 1,
          mix: 0.55,
        },
      },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'ninths-for-octaves-last-rung-of-the-pan',
    name: 'Last rung of the pan',
    category: 'plucked',
    description:
      'Tongue notes whose ends are lifted up to the rest, with a grainy echo running fifteen semitones below.',
    preview: TUNE_IN_TENTHS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Bright tongue',
      params: { volume: -15, decay: 6, position: 0.35, touch: 0.2 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        params: { pitchA: -15, mode: 1, size: 180, delay: 520, feedback: 0.2, mix: 0.4 },
      },
      { deviceId: 'lift', preset: 'Long tails', params: { amount: 0.6, limit: 9 } },
    ],
  },
  // Mallets: marimba, vibraphone, xylophone, glockenspiel and celesta, from soft yarn to brass.
  {
    id: 'ninths-for-octaves-rosewood-drawn-to-ten',
    name: 'Rosewood drawn to ten',
    category: 'plucked',
    description:
      'Soft marimba with every octave on the keys drawn in to a minor seventh by Warp, in a warm low hall.',
    preview: FOUR_CHORDS_PLAIN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.2, decay: 1.6, resonator: 1 },
    },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: -0.263, follow: 0, pivot: 220, drift: 0, width: 0.3, tone: 0.2 },
      },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'ninths-for-octaves-vibes-on-seven-rungs',
    name: 'Vibes on seven rungs',
    category: 'keys',
    description:
      'Vibraphone, the motor wide open at ten beats a second, with a follower ten semitones up after each note.',
    preview: TUNE_IN_SEVENTHS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { motor: 1, motorRate: 10, mallet: 0.25, decay: 0.8 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 1,
          gap: 0.52,
          interval1: 10,
          fade: 0.1,
          spread: 1,
          tone: 4000,
          mix: 0.5,
        },
      },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'ninths-for-octaves-xylophone-on-tiptoe',
    name: 'Xylophone on tiptoe',
    category: 'plucked',
    description:
      'Dry hard xylophone in ten semitone octaves, worn down to the eight bits of an early sampler in a small booth.',
    preview: TUNE_IN_SEVENTHS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { volume: 2, mallet: 0.9, decay: 0.4, resonator: 0, width: 0.1 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Toy', params: { mix: 0.8 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ninths-for-octaves-celesta-folded-inward',
    name: 'Celesta folded inward',
    category: 'keys',
    description:
      'Celesta doubled ten semitones below, its hammers sifted off and its tones held on, in a deep chorus.',
    preview: TUNE_IN_SEVENTHS,
    instrument: { deviceId: 'mallets', preset: 'Open celesta', params: { mallet: 0.2, decay: 2 } },
    effects: [
      { deviceId: 'pitch-shifter', params: { pitchA: -10, mode: 3, mix: 0.4, tone: 6000 } },
      { deviceId: 'sift', preset: 'Tones only', params: { hold: 0.7 } },
      { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'ninths-for-octaves-twelfth-in-the-steel',
    name: 'Twelfth in the steel',
    category: 'bell',
    description:
      'Glockenspiel bars, whose second mode is near the twelfth of this scale, rung a long time over tubes on a long plate.',
    preview: TUNE_A_SEMITONE_SHORT,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { volume: -17, mallet: 0.2, decay: 2.4, resonator: 1 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 6000 } },
    ],
  },
  {
    id: 'ninths-for-octaves-rolls-a-semitone-shy',
    name: 'Rolls a semitone shy',
    category: 'pad',
    description:
      'Rolled marimba chords at eleven twelfths, the roll beaten soft and blurred through a wide flock of voices.',
    preview: FOUR_CHORDS_PINCHED,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { roll: 8, mallet: 0.05, decay: 2 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Thick ensemble', params: { mix: 0.6 } },
      { deviceId: 'fog', preset: 'Soft cloud', params: { size: 240, mix: 0.9 } },
    ],
  },
  {
    id: 'ninths-for-octaves-eleven-dry-bones',
    name: 'Eleven dry bones',
    category: 'plucked',
    description:
      'Xylophone pinched by a twelfth under a fixed Warp, rattling in a tight long tank of springs.',
    preview: TUNE_PLAIN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { volume: -2.5, mallet: 0.6, decay: 1, resonator: 0.7 },
    },
    effects: [
      { deviceId: 'warp', params: { stretch: -0.1255, follow: 0, pivot: 220, drift: 0, width: 0 } },
      { deviceId: 'spring-reverb', preset: 'Tight long tank', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'ninths-for-octaves-slow-vane-at-eleven',
    name: 'Slow vane at eleven',
    category: 'keys',
    description:
      'Vibraphone turning once a second, each chord recorded again through a small room until it dissolves.',
    preview: FOUR_CHORDS_PINCHED,
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { volume: -21, motor: 0.8, motorRate: 1.1, mallet: 0.35 },
    },
    effects: [
      { deviceId: 'generations', preset: 'Slow dissolve', params: { length: 1.6, mix: 0.45 } },
      { deviceId: 'stereo-detune', preset: 'Wider' },
    ],
  },
  {
    id: 'ninths-for-octaves-thirteen-bars-of-redwood',
    name: 'Thirteen bars of redwood',
    category: 'plucked',
    description:
      'Marimba stretched past the octave by Warp, its top a little shaded, with a faint memory of the phrase behind it.',
    preview: TUNE_PLAIN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { volume: -4, mallet: 0.6, decay: 0.8, resonator: 0.6, width: 0.9 },
    },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: 0.1155, follow: 0, pivot: 220, drift: 0, width: 0.2, tone: -0.3 },
      },
      { deviceId: 'echo-memory', preset: 'Faint recall', params: { reach: 4, mix: 0.35 } },
    ],
  },
  {
    id: 'ninths-for-octaves-still-bars-minor-ninth',
    name: 'Still bars, minor ninth',
    category: 'keys',
    description:
      'Vibraphone with the motor off and sines a minor ninth over it, driven through a hot tube preamp.',
    preview: ROUND_OF_SIX,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { volume: -14.5, mallet: 0.1, decay: 1, damper: 0.6 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: { transpose: 13, partials: 5, attack: 60, release: 1.5, mix: 0.5 },
      },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 9, outputDb: -6 } },
    ],
  },
  {
    id: 'ninths-for-octaves-plates-and-thirteen-over',
    name: 'Plates and thirteen over',
    category: 'keys',
    description: 'Celesta with grains a minor ninth over it scattered backwards, in a short room.',
    preview: TUNE_A_SEMITONE_OVER,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.45, resonator: 1, damper: 0.3 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        params: {
          pitch: 13,
          size: 180,
          density: 9,
          spray: 0.2,
          reverse: 0.8,
          feedback: 0,
          mix: 0.45,
        },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ninths-for-octaves-wide-xylophone-roll-call',
    name: 'Wide xylophone roll call',
    category: 'plucked',
    description:
      'Rolled xylophone over the five octaves in turn, swung left then right under a low-pass that opens and shuts slowly.',
    preview: FIVE_OCTAVES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Xylophone roll',
      params: { roll: 13, mallet: 0.4, decay: 3 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Left then right', params: { rate: 3.25, floor: 0.3 } },
      {
        deviceId: 'auto-filter',
        preset: 'Tremolo filter',
        params: { lfoRateHz: 0.6, lfoShape: 0, cutoffHz: 1400, mix: 0.8 },
      },
    ],
  },
  {
    id: 'ninths-for-octaves-fourteen-plates-of-sky',
    name: 'Fourteen plates of sky',
    category: 'bell',
    description:
      'Glockenspiel stretched to ninths by Warp, its top shaded, carried on a slow figure of eight.',
    preview: TUNE_PLAIN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 0.35, decay: 2, resonator: 0.8 },
    },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: 0.2224, follow: 0, pivot: 220, drift: 0, width: 0.4, tone: -0.8 },
      },
      { deviceId: 'around', preset: 'Slow eight', params: { rate: 0.25 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'ninths-for-octaves-marimba-up-the-ninths',
    name: 'Marimba up the ninths',
    category: 'plucked',
    description:
      'Marimba with hard mallets in ninths, its echo a major ninth up each time it comes back.',
    preview: TUNE_IN_NINTHS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { volume: -4.5, mallet: 0.9, resonator: 0.3, decay: 1 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        params: {
          pitchA: 14,
          mode: 1,
          size: 100,
          delay: 520,
          feedback: 0.45,
          tone: 5000,
          spread: 0.9,
          mix: 0.35,
        },
      },
      { deviceId: 'tape', preset: 'Warm thump', params: { hiss: 0 } },
    ],
  },
  {
    id: 'ninths-for-octaves-rolled-light-at-nine',
    name: 'Rolled light at nine',
    category: 'pad',
    description:
      'Rolled vibraphone chords in ninths, the quiet ends drawn up, its bands moving on slow cycles of their own.',
    preview: FOUR_CHORDS_IN_NINTHS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { roll: 14, mallet: 0.3, decay: 3 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Fill every gap' },
      { deviceId: 'currents', preset: 'Breaking waves', params: { rate: 0.4 } },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  {
    id: 'ninths-for-octaves-which-octave-is-it',
    name: 'Which octave is it',
    category: 'keys',
    description:
      'Tremolo celesta playing the five octaves one after another, its attacks smeared half away, on a medium plate.',
    preview: FIVE_OCTAVES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Tremolo celesta',
      params: { motorRate: 5, damper: 0.2 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Softened attacks', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'ninths-for-octaves-ninth-inside-the-bar',
    name: 'Ninth inside the bar',
    category: 'bell',
    description:
      'Celesta plates, whose second mode is a pure ninth of this scale, rolled six a second through a rotary far off.',
    preview: TUNE_IN_TENTHS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.15, resonator: 0.5, decay: 3, damper: 0, width: 0.7, roll: 6 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Far shimmer' }],
  },
  {
    id: 'ninths-for-octaves-tall-ladder-of-sticks',
    name: 'Tall ladder of sticks',
    category: 'plucked',
    description:
      'Warm xylophone with octaves stretched to minor tenths on the keys, through a small combo amplifier in a room.',
    preview: TUNE_PLAIN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Warm xylophone',
      params: { mallet: 0.35, decay: 2.5, resonator: 0.9 },
    },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: 0.3219, follow: 0, pivot: 220, drift: 0, width: 0.3, tone: -0.2 },
      },
      { deviceId: 're-amp', preset: 'Combo in a room', params: { noise: 0 } },
    ],
  },
  {
    id: 'ninths-for-octaves-hum-of-stacked-tenths',
    name: 'Hum of stacked tenths',
    category: 'drone',
    description:
      'Humming marimba tubes in piled tenths, each attack swelled away, and a copy fifteen semitones over them.',
    preview: STACK_OF_TENTHS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Humming marimba',
      params: { roll: 15, mallet: 0, resonator: 1 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Glacier', params: { attack: 600, retrigger: 0 } },
      { deviceId: 'pitch-shifter', params: { pitchA: 15, mode: 0, size: 120, mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Seasick choir', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'ninths-for-octaves-tin-stars-by-tenths',
    name: 'Tin stars by tenths',
    category: 'bell',
    description:
      'Glockenspiel rolled fast and thin, scattered in small points of echo, its partials catching sudden glints.',
    preview: TUNE_IN_TENTHS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel roll',
      params: { roll: 15, decay: 0.6, mallet: 0.5 },
    },
    effects: [
      {
        deviceId: 'constellation',
        preset: 'Faint points',
        params: { span: 2600, stars: 10, mix: 0.5 },
      },
      { deviceId: 'glimmer', preset: 'Sudden glints', params: { rate: 4 } },
    ],
  },
  // Droplets: rain with its own octaves left out, so the only octaves are the ones played.
  {
    id: 'ninths-for-octaves-seventh-from-the-eaves',
    name: 'Seventh from the eaves',
    category: 'texture',
    description:
      'Single water drops, one sine each, on chords Warp pinches to ten semitones, in a dark wide well.',
    preview: FOUR_CHORDS_PLAIN,
    instrument: {
      deviceId: 'droplets',
      preset: 'Water drops',
      params: { rain: 5, spread: 0, ring: 3, trail: 3, loose: 1 },
    },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: -0.263, follow: 0, pivot: 220, drift: 0, width: 0.2 },
      },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'ninths-for-octaves-even-drip-of-sevenths',
    name: 'Even drip of sevenths',
    category: 'plucked',
    description:
      'An even felt pulse of seven drops a second climbing a pile of ten semitone octaves, doubled and echoed on tape.',
    preview: STACK_OF_SEVENTHS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt pulse',
      params: { volume: -5.5, rain: 7, spread: 0, ring: 1.5, soft: 0.4, size: 0.5, width: 0.6 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Shadow' },
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { time: 430, mix: 0.35 } },
    ],
  },
  {
    id: 'ninths-for-octaves-short-rain-on-wood',
    name: 'Short rain on wood',
    category: 'texture',
    description:
      'Wood ticks on pinched chords, no octaves of its own, each drop sagging in pitch as it dries.',
    preview: FOUR_CHORDS_PINCHED,
    instrument: {
      deviceId: 'droplets',
      preset: 'Wood ticks',
      params: { rain: 10, spread: 0, size: 0.4, ring: 2, splash: 0.2 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Drip by drip', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'ninths-for-octaves-thirteen-from-the-tap',
    name: 'Thirteen from the tap',
    category: 'bell',
    description:
      'A slow glass drip whose drops come back a minor ninth higher in pure sines, a wide halo around them.',
    preview: ROUND_OF_SIX,
    instrument: {
      deviceId: 'droplets',
      preset: 'Slow drip',
      params: { rain: 2.2, spread: 0, ring: 2, size: 0.5, trail: 3 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: { transpose: 13, partials: 6, attack: 80, release: 3, spread: 1, mix: 0.6 },
      },
      { deviceId: 'haze', preset: 'Glass halo', params: { octave: 0, mix: 0.3 } },
    ],
  },
  {
    id: 'ninths-for-octaves-squall-of-minor-ninths',
    name: 'Squall of minor ninths',
    category: 'texture',
    description:
      'Glass drops in bursts on a round, with grainy copies a minor ninth up, blown about by dry gusts.',
    preview: ROUND_OF_SIX,
    instrument: {
      deviceId: 'droplets',
      preset: 'Flurries',
      params: { material: 0, rain: 14, spread: 0, ring: 1, bursts: 0.8 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        params: { pitchA: 13, mode: 1, size: 70, jitter: 0.3, mix: 0.4 },
      },
      { deviceId: 'weather', preset: 'Dry gusts', params: { exposure: 0.8 } },
    ],
  },
  {
    id: 'ninths-for-octaves-ninths-in-a-deep-pool',
    name: 'Ninths in a deep pool',
    category: 'texture',
    description:
      'Big slow water drops on chords Warp stretches to ninths, heard under the surface.',
    preview: FOUR_CHORDS_PLAIN,
    instrument: {
      deviceId: 'droplets',
      preset: 'Deep pool',
      params: { rain: 2.5, spread: 0, ring: 4, splash: 0.3 },
    },
    effects: [
      { deviceId: 'warp', params: { stretch: 0.2224, follow: 0, pivot: 220, drift: 0, width: 0 } },
      { deviceId: 'underwater', preset: 'Under', params: { bubbles: 0.2 } },
    ],
  },
  {
    id: 'ninths-for-octaves-metal-drizzle-at-home',
    name: 'Metal drizzle at home',
    category: 'texture',
    description:
      'Metal drops whose own octave Warp moves out to the ninth, where the keys are, in a narrow cold tail with a still flanger.',
    preview: FOUR_CHORDS_PLAIN,
    instrument: {
      deviceId: 'droplets',
      preset: 'Bell drizzle',
      params: { rain: 4, spread: 0, ring: 3, soft: 0.3 },
    },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: 0.2224, follow: 0, pivot: 220, drift: 0, width: 0.3 },
      },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { bloom: 0, mix: 0.4 } },
      { deviceId: 'flanger', preset: 'Glacial drift', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'ninths-for-octaves-patter-between-tenths',
    name: 'Patter between tenths',
    category: 'texture',
    description:
      'Felt patter stretched to tenths by Warp and caught in a soft loop that plays on under the rain.',
    preview: FOUR_CHORDS_PLAIN,
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt patter',
      params: { rain: 9, spread: 0, ring: 3, size: 0.8, splash: 0.2, trail: 2 },
    },
    effects: [
      {
        deviceId: 'warp',
        params: { stretch: 0.3219, follow: 0, pivot: 220, drift: 0, width: 0.6, tone: 0.4 },
      },
      { deviceId: 'micro-looper', preset: 'Soft bed', params: { length: 1.6, mix: 0.4 } },
    ],
  },
  {
    id: 'ninths-for-octaves-glass-counting-fifteen',
    name: 'Glass counting fifteen',
    category: 'plucked',
    description:
      'An even glass pulse of three drops a second up a pile of tenths, followed backwards twice, in a metal pipe.',
    preview: STACK_OF_TENTHS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Glass pulse',
      params: { rain: 3, spread: 0, ring: 3.5, size: 0.7, splash: 0 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 2,
          gap: 0.5,
          interval1: 0,
          interval2: 0,
          crab: 3,
          fade: 0.3,
          spread: 1,
          mix: 0.4,
        },
      },
      { deviceId: 'swarm-reverb', preset: 'Metal pipe', params: { mix: 0.3 } },
    ],
  },
]
