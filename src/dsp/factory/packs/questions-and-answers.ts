import { type FactoryPreset, type Phrase } from '../types'

// Paired voices: one that leans forward for a question, one that sits back for its answer.
// Every phrase is four bars of two beats, or the two together. A question ends on the second or
// the seventh degree over a dominant; its answer begins alike and ends on the tonic over a tonic.
// The presets come in pairs, the asking one near and quick, the answering one lower, softer or
// farther off.

// C major: E G A, then G E D over a six-four that settles on the dominant. A half cadence.
const ASK: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.1, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 0.8, note: 64, gain: 0.6 },
    { atSec: 0.8, durSec: 2.4, note: 55, gain: 0.36 },
    { atSec: 0.8, durSec: 0.8, note: 67, gain: 0.62 },
    { atSec: 1.6, durSec: 1.6, note: 69, gain: 0.66 },
    { atSec: 3.2, durSec: 3.3, note: 43, gain: 0.5 },
    { atSec: 3.2, durSec: 1.6, note: 60, gain: 0.38 },
    { atSec: 3.2, durSec: 0.8, note: 67, gain: 0.6 },
    { atSec: 4, durSec: 0.8, note: 64, gain: 0.6 },
    { atSec: 4.8, durSec: 1.8, note: 59, gain: 0.36 },
    { atSec: 4.8, durSec: 1.8, note: 62, gain: 0.66 },
  ],
}

// The same first bars, then six-four, dominant seventh and home. A full cadence.
const REPLY: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.1, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 0.8, note: 64, gain: 0.58 },
    { atSec: 0.8, durSec: 2.4, note: 55, gain: 0.36 },
    { atSec: 0.8, durSec: 0.8, note: 67, gain: 0.6 },
    { atSec: 1.6, durSec: 1.6, note: 69, gain: 0.62 },
    { atSec: 3.2, durSec: 1.6, note: 43, gain: 0.5 },
    { atSec: 3.2, durSec: 0.8, note: 60, gain: 0.38 },
    { atSec: 3.2, durSec: 0.8, note: 67, gain: 0.58 },
    { atSec: 4, durSec: 0.8, note: 53, gain: 0.34 },
    { atSec: 4, durSec: 0.8, note: 59, gain: 0.36 },
    { atSec: 4, durSec: 0.8, note: 62, gain: 0.56 },
    { atSec: 4.8, durSec: 2, note: 48, gain: 0.52 },
    { atSec: 4.8, durSec: 2, note: 52, gain: 0.34 },
    { atSec: 4.8, durSec: 2, note: 55, gain: 0.34 },
    { atSec: 4.8, durSec: 2, note: 60, gain: 0.58 },
  ],
}

// A minor: the bass goes F D E under D C B, the subdominant in two positions, to a major dominant.
const MINOR_ASK: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.1, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 0.8, note: 69, gain: 0.6 },
    { atSec: 0.8, durSec: 2.4, note: 52, gain: 0.36 },
    { atSec: 0.8, durSec: 0.8, note: 72, gain: 0.62 },
    { atSec: 1.6, durSec: 1.6, note: 60, gain: 0.34 },
    { atSec: 1.6, durSec: 1.6, note: 76, gain: 0.66 },
    { atSec: 3.2, durSec: 0.8, note: 53, gain: 0.48 },
    { atSec: 3.2, durSec: 1.6, note: 57, gain: 0.36 },
    { atSec: 3.2, durSec: 0.8, note: 74, gain: 0.6 },
    { atSec: 4, durSec: 0.8, note: 50, gain: 0.46 },
    { atSec: 4, durSec: 0.8, note: 72, gain: 0.58 },
    { atSec: 4.8, durSec: 1.8, note: 52, gain: 0.48 },
    { atSec: 4.8, durSec: 1.8, note: 56, gain: 0.36 },
    { atSec: 4.8, durSec: 1.8, note: 71, gain: 0.64 },
  ],
}

// A minor home again: six-four, five-three over E, and the tonic.
const MINOR_REPLY: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.1, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 0.8, note: 69, gain: 0.58 },
    { atSec: 0.8, durSec: 2.4, note: 52, gain: 0.36 },
    { atSec: 0.8, durSec: 0.8, note: 72, gain: 0.6 },
    { atSec: 1.6, durSec: 1.6, note: 60, gain: 0.34 },
    { atSec: 1.6, durSec: 1.6, note: 76, gain: 0.62 },
    { atSec: 3.2, durSec: 1.6, note: 52, gain: 0.48 },
    { atSec: 3.2, durSec: 0.8, note: 57, gain: 0.36 },
    { atSec: 3.2, durSec: 1.6, note: 64, gain: 0.34 },
    { atSec: 3.2, durSec: 0.8, note: 72, gain: 0.58 },
    { atSec: 4, durSec: 0.8, note: 56, gain: 0.36 },
    { atSec: 4, durSec: 0.8, note: 71, gain: 0.56 },
    { atSec: 4.8, durSec: 2, note: 45, gain: 0.52 },
    { atSec: 4.8, durSec: 2, note: 57, gain: 0.34 },
    { atSec: 4.8, durSec: 2, note: 60, gain: 0.34 },
    { atSec: 4.8, durSec: 2, note: 69, gain: 0.58 },
  ],
}

// D dorian: up to the raised sixth over G, then left on the second degree over A minor.
const DORIAN_ASK: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.1, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 0.8, note: 62, gain: 0.58 },
    { atSec: 0.8, durSec: 2.4, note: 57, gain: 0.36 },
    { atSec: 0.8, durSec: 0.8, note: 65, gain: 0.6 },
    { atSec: 1.6, durSec: 0.8, note: 67, gain: 0.62 },
    { atSec: 2.4, durSec: 0.8, note: 69, gain: 0.64 },
    { atSec: 3.2, durSec: 1.6, note: 43, gain: 0.5 },
    { atSec: 3.2, durSec: 1.6, note: 55, gain: 0.34 },
    { atSec: 3.2, durSec: 1.6, note: 62, gain: 0.36 },
    { atSec: 3.2, durSec: 1.2, note: 71, gain: 0.66 },
    { atSec: 4.4, durSec: 0.4, note: 69, gain: 0.56 },
    { atSec: 4.8, durSec: 1.8, note: 45, gain: 0.5 },
    { atSec: 4.8, durSec: 1.8, note: 60, gain: 0.36 },
    { atSec: 4.8, durSec: 1.8, note: 64, gain: 0.64 },
  ],
}

// D dorian answered: G F E over the seventh degree's chord, its bass E then C, and up a step home.
const DORIAN_REPLY: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.1, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 0.8, note: 62, gain: 0.56 },
    { atSec: 0.8, durSec: 2.4, note: 57, gain: 0.36 },
    { atSec: 0.8, durSec: 0.8, note: 65, gain: 0.58 },
    { atSec: 1.6, durSec: 0.8, note: 67, gain: 0.6 },
    { atSec: 2.4, durSec: 0.8, note: 69, gain: 0.62 },
    { atSec: 3.2, durSec: 0.8, note: 52, gain: 0.48 },
    { atSec: 3.2, durSec: 1.6, note: 60, gain: 0.36 },
    { atSec: 3.2, durSec: 0.4, note: 67, gain: 0.6 },
    { atSec: 3.6, durSec: 0.4, note: 65, gain: 0.54 },
    { atSec: 4, durSec: 0.8, note: 48, gain: 0.5 },
    { atSec: 4, durSec: 0.8, note: 64, gain: 0.56 },
    { atSec: 4.8, durSec: 2, note: 50, gain: 0.52 },
    { atSec: 4.8, durSec: 2, note: 53, gain: 0.32 },
    { atSec: 4.8, durSec: 2, note: 57, gain: 0.32 },
    { atSec: 4.8, durSec: 2, note: 62, gain: 0.58 },
  ],
}

// The C major question broken into quavers: I, IV over the same bass, six-four, V.
const ROLLED_ASK: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 48, gain: 0.48 },
    { atSec: 0, durSec: 0.8, note: 64, gain: 0.6 },
    { atSec: 0.4, durSec: 1.2, note: 55, gain: 0.36 },
    { atSec: 0.8, durSec: 0.8, note: 67, gain: 0.62 },
    { atSec: 1.2, durSec: 0.4, note: 60, gain: 0.36 },
    { atSec: 1.6, durSec: 1.6, note: 48, gain: 0.46 },
    { atSec: 1.6, durSec: 1.6, note: 69, gain: 0.66 },
    { atSec: 2, durSec: 1.2, note: 57, gain: 0.36 },
    { atSec: 2.4, durSec: 0.8, note: 60, gain: 0.36 },
    { atSec: 2.8, durSec: 0.4, note: 65, gain: 0.38 },
    { atSec: 3.2, durSec: 1.6, note: 43, gain: 0.5 },
    { atSec: 3.2, durSec: 0.8, note: 67, gain: 0.6 },
    { atSec: 3.6, durSec: 1.2, note: 55, gain: 0.36 },
    { atSec: 4, durSec: 0.8, note: 64, gain: 0.6 },
    { atSec: 4.4, durSec: 0.4, note: 60, gain: 0.36 },
    { atSec: 4.8, durSec: 2, note: 43, gain: 0.48 },
    { atSec: 4.8, durSec: 2, note: 62, gain: 0.64 },
    { atSec: 5.2, durSec: 1.6, note: 50, gain: 0.36 },
    { atSec: 5.6, durSec: 1.2, note: 55, gain: 0.36 },
    { atSec: 6, durSec: 0.8, note: 59, gain: 0.38 },
  ],
}

// Its answer in quavers: six-four, dominant seventh, and the tonic chord rolled up to C.
const ROLLED_REPLY: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 48, gain: 0.48 },
    { atSec: 0, durSec: 0.8, note: 64, gain: 0.58 },
    { atSec: 0.4, durSec: 1.2, note: 55, gain: 0.36 },
    { atSec: 0.8, durSec: 0.8, note: 67, gain: 0.6 },
    { atSec: 1.2, durSec: 0.4, note: 60, gain: 0.36 },
    { atSec: 1.6, durSec: 1.6, note: 48, gain: 0.46 },
    { atSec: 1.6, durSec: 1.6, note: 69, gain: 0.62 },
    { atSec: 2, durSec: 1.2, note: 57, gain: 0.36 },
    { atSec: 2.4, durSec: 0.8, note: 60, gain: 0.36 },
    { atSec: 2.8, durSec: 0.4, note: 65, gain: 0.36 },
    { atSec: 3.2, durSec: 1.6, note: 43, gain: 0.5 },
    { atSec: 3.2, durSec: 0.8, note: 67, gain: 0.58 },
    { atSec: 3.6, durSec: 0.8, note: 60, gain: 0.36 },
    { atSec: 4, durSec: 0.8, note: 53, gain: 0.36 },
    { atSec: 4, durSec: 0.8, note: 62, gain: 0.56 },
    { atSec: 4.4, durSec: 0.4, note: 59, gain: 0.36 },
    { atSec: 4.8, durSec: 2.2, note: 48, gain: 0.5 },
    { atSec: 4.8, durSec: 1.2, note: 60, gain: 0.58 },
    { atSec: 5.2, durSec: 1.8, note: 52, gain: 0.36 },
    { atSec: 5.6, durSec: 1.4, note: 55, gain: 0.36 },
    { atSec: 6, durSec: 1, note: 60, gain: 0.42 },
  ],
}

// One voice alone in A minor, left on the leading tone.
const AIR_ASK: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.76, note: 69, gain: 0.58 },
    { atSec: 0.8, durSec: 0.76, note: 72, gain: 0.6 },
    { atSec: 1.6, durSec: 1.5, note: 76, gain: 0.66 },
    { atSec: 3.2, durSec: 0.76, note: 74, gain: 0.62 },
    { atSec: 4, durSec: 0.76, note: 71, gain: 0.58 },
    { atSec: 4.8, durSec: 1.7, note: 68, gain: 0.64 },
  ],
}

// The same voice brought home: C B A.
const AIR_REPLY: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.76, note: 69, gain: 0.56 },
    { atSec: 0.8, durSec: 0.76, note: 72, gain: 0.58 },
    { atSec: 1.6, durSec: 1.5, note: 76, gain: 0.62 },
    { atSec: 3.2, durSec: 0.76, note: 72, gain: 0.58 },
    { atSec: 4, durSec: 0.76, note: 71, gain: 0.54 },
    { atSec: 4.8, durSec: 1.9, note: 69, gain: 0.58 },
  ],
}

// Four-part hymn, the question: I, VI, II in first inversion, V.
const HYMN_ASK: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 1.6, note: 55, gain: 0.44 },
    { atSec: 0, durSec: 1.6, note: 60, gain: 0.44 },
    { atSec: 0, durSec: 1.6, note: 64, gain: 0.56 },
    { atSec: 1.6, durSec: 1.6, note: 45, gain: 0.5 },
    { atSec: 1.6, durSec: 1.6, note: 57, gain: 0.44 },
    { atSec: 1.6, durSec: 1.6, note: 60, gain: 0.44 },
    { atSec: 1.6, durSec: 1.6, note: 64, gain: 0.56 },
    { atSec: 3.2, durSec: 1.6, note: 41, gain: 0.5 },
    { atSec: 3.2, durSec: 1.6, note: 57, gain: 0.44 },
    { atSec: 3.2, durSec: 1.6, note: 62, gain: 0.44 },
    { atSec: 3.2, durSec: 1.6, note: 65, gain: 0.58 },
    { atSec: 4.8, durSec: 1.9, note: 43, gain: 0.52 },
    { atSec: 4.8, durSec: 1.9, note: 55, gain: 0.44 },
    { atSec: 4.8, durSec: 1.9, note: 59, gain: 0.44 },
    { atSec: 4.8, durSec: 1.9, note: 62, gain: 0.58 },
  ],
}

// The hymn's answer: I, VI, then II six, V seven, I.
const HYMN_REPLY: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 1.6, note: 55, gain: 0.44 },
    { atSec: 0, durSec: 1.6, note: 60, gain: 0.44 },
    { atSec: 0, durSec: 1.6, note: 64, gain: 0.54 },
    { atSec: 1.6, durSec: 1.6, note: 45, gain: 0.5 },
    { atSec: 1.6, durSec: 1.6, note: 57, gain: 0.44 },
    { atSec: 1.6, durSec: 1.6, note: 60, gain: 0.44 },
    { atSec: 1.6, durSec: 1.6, note: 64, gain: 0.54 },
    { atSec: 3.2, durSec: 0.8, note: 41, gain: 0.48 },
    { atSec: 3.2, durSec: 0.8, note: 57, gain: 0.42 },
    { atSec: 3.2, durSec: 0.8, note: 62, gain: 0.42 },
    { atSec: 3.2, durSec: 0.8, note: 65, gain: 0.54 },
    { atSec: 4, durSec: 0.8, note: 43, gain: 0.5 },
    { atSec: 4, durSec: 0.8, note: 53, gain: 0.42 },
    { atSec: 4, durSec: 0.8, note: 59, gain: 0.42 },
    { atSec: 4, durSec: 0.8, note: 62, gain: 0.54 },
    { atSec: 4.8, durSec: 2, note: 48, gain: 0.52 },
    { atSec: 4.8, durSec: 2, note: 52, gain: 0.42 },
    { atSec: 4.8, durSec: 2, note: 55, gain: 0.42 },
    { atSec: 4.8, durSec: 2, note: 60, gain: 0.54 },
  ],
}

// The whole period, question and answer at a walking pace over its bass.
const PERIOD: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 0.45, note: 64, gain: 0.58 },
    { atSec: 0.45, durSec: 1.35, note: 55, gain: 0.34 },
    { atSec: 0.45, durSec: 0.45, note: 67, gain: 0.6 },
    { atSec: 0.9, durSec: 0.9, note: 69, gain: 0.64 },
    { atSec: 1.8, durSec: 1.8, note: 43, gain: 0.5 },
    { atSec: 1.8, durSec: 0.9, note: 60, gain: 0.36 },
    { atSec: 1.8, durSec: 0.45, note: 67, gain: 0.58 },
    { atSec: 2.25, durSec: 0.45, note: 64, gain: 0.58 },
    { atSec: 2.7, durSec: 0.9, note: 59, gain: 0.36 },
    { atSec: 2.7, durSec: 0.9, note: 62, gain: 0.64 },
    { atSec: 3.6, durSec: 1.8, note: 48, gain: 0.5 },
    { atSec: 3.6, durSec: 0.45, note: 64, gain: 0.56 },
    { atSec: 4.05, durSec: 1.35, note: 55, gain: 0.34 },
    { atSec: 4.05, durSec: 0.45, note: 67, gain: 0.58 },
    { atSec: 4.5, durSec: 0.9, note: 69, gain: 0.62 },
    { atSec: 5.4, durSec: 0.9, note: 43, gain: 0.5 },
    { atSec: 5.4, durSec: 0.45, note: 60, gain: 0.36 },
    { atSec: 5.4, durSec: 0.45, note: 67, gain: 0.56 },
    { atSec: 5.85, durSec: 0.45, note: 53, gain: 0.34 },
    { atSec: 5.85, durSec: 0.45, note: 59, gain: 0.36 },
    { atSec: 5.85, durSec: 0.45, note: 62, gain: 0.54 },
    { atSec: 6.3, durSec: 0.9, note: 48, gain: 0.52 },
    { atSec: 6.3, durSec: 0.9, note: 52, gain: 0.34 },
    { atSec: 6.3, durSec: 0.9, note: 60, gain: 0.58 },
  ],
}

// The period for one voice, an octave up and with no bass.
const AIR_PERIOD: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.43, note: 76, gain: 0.58 },
    { atSec: 0.45, durSec: 0.43, note: 79, gain: 0.6 },
    { atSec: 0.9, durSec: 0.82, note: 81, gain: 0.64 },
    { atSec: 1.8, durSec: 0.43, note: 79, gain: 0.58 },
    { atSec: 2.25, durSec: 0.43, note: 76, gain: 0.58 },
    { atSec: 2.7, durSec: 0.78, note: 74, gain: 0.64 },
    { atSec: 3.6, durSec: 0.43, note: 76, gain: 0.56 },
    { atSec: 4.05, durSec: 0.43, note: 79, gain: 0.58 },
    { atSec: 4.5, durSec: 0.82, note: 81, gain: 0.62 },
    { atSec: 5.4, durSec: 0.43, note: 79, gain: 0.56 },
    { atSec: 5.85, durSec: 0.43, note: 74, gain: 0.54 },
    { atSec: 6.3, durSec: 0.95, note: 72, gain: 0.58 },
  ],
}
export const PRESETS: readonly FactoryPreset[] = [
  // Guitar: ten questions near the bridge and their answers over the hole.
  {
    id: 'questions-and-answers-is-the-kettle-on-yet',
    name: 'Is the kettle on yet',
    category: 'plucked',
    description:
      'A picked steel string near the bridge, warmed on tape, its echoes landing farther and farther apart.',
    preview: ASK,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Glass pick',
      params: { body: 0.55, position: 0.1, nail: 0.7, sustain: 4, release: 0.6, volume: -4.5 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 14, outputDb: -9 } },
      {
        deviceId: 'skipping-stone',
        preset: 'Slowing bounces',
        params: { first: 130, bounce: 1.25, skips: 7, mix: 0.32 },
      },
    ],
  },
  {
    id: 'questions-and-answers-give-it-a-minute',
    name: 'Give it a minute',
    category: 'plucked',
    description:
      'Dark nylon strings with a full body that ring on for four seconds, set back in a hall with the top closed off.',
    preview: REPLY,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { body: 1, tone: 0.25, release: 4, volume: -2 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { preDelay: 70, mix: 0.42 } },
    ],
  },
  {
    id: 'questions-and-answers-which-way-to-the-ford',
    name: 'Which way to the ford',
    category: 'plucked',
    description:
      'A bright twelve string struck at the bridge, levelled hard, with a dotted tape echo and the highs pulled wide.',
    preview: MINOR_ASK,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve chime',
      params: {
        position: 0.09,
        nail: 0.8,
        body: 0.7,
        tone: 0.85,
        release: 0.8,
        shimmer: 0.4,
        volume: -3.5,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 24, outputGain: -8 } },
      {
        deviceId: 'tape-echo',
        preset: 'Dotted bounce',
        params: { time: 400, feedback: 0.35, mix: 0.3 },
      },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'questions-and-answers-left-at-the-old-barn',
    name: 'Left at the old barn',
    category: 'plucked',
    description:
      'A steel string played with the thumb over the neck, dull and close, sounding again inside a large wooden box.',
    preview: MINOR_REPLY,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: { tone: 0.05, nail: 0, release: 2 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 2, tone: 0.35, mix: 0.8 } },
    ],
  },
  {
    id: 'questions-and-answers-did-you-lock-the-shed',
    name: 'Did you lock the shed',
    category: 'plucked',
    description:
      'A damped steel string, pressed flat by a limiter, with a quick repeat and a little dripping spring.',
    preview: PERIOD,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: { body: 0.85, position: 0.12, sustain: 1.1, release: 0.1, nail: 0.6, volume: 6 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 24, outputGain: -8 } },
      {
        deviceId: 'analog-delay',
        preset: 'Slapback',
        params: { time: 110, feedback: 0.2, mix: 0.35 },
      },
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { decay: 1.2, mix: 0.22 } },
    ],
  },
  {
    id: 'questions-and-answers-the-key-is-in-my-coat',
    name: 'The key is in my coat',
    category: 'plucked',
    description:
      'Short soft nylon from the middle of the string, an octave added underneath and the attacks blurred.',
    preview: PERIOD,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon pizzicato',
      params: { position: 0.36, nail: 0.1, tone: 0.3, sustain: 1.4, release: 0.35, volume: 1.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.7 } },
      { deviceId: 'fog', preset: 'Morning mist', params: { size: 70, mix: 0.6 } },
    ],
  },
  {
    id: 'questions-and-answers-whose-dog-is-barking',
    name: 'Whose dog is barking',
    category: 'plucked',
    description:
      'A fingered steel string that a fainter second player repeats one bar later, with a detuned copy at each side.',
    preview: DORIAN_ASK,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { position: 0.12, nail: 0.75, sustain: 4, tone: 0.7, volume: -0.5 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Faint answer', params: { gap: 1.6, tone: 7000, mix: 0.34 } },
      { deviceId: 'stereo-detune', preset: 'Wider' },
    ],
  },
  {
    id: 'questions-and-answers-ours-i-am-afraid',
    name: 'Ours, I am afraid',
    category: 'plucked',
    description:
      'A thumb on the middle of a steel string, played through an amplifier and recorded from far down the hall.',
    preview: DORIAN_REPLY,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { tone: 0.3, release: 2.2, volume: -1 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Down the hall',
        params: { drive: 0.2, distance: 0.8, room: 0.8 },
      },
    ],
  },
  {
    id: 'questions-and-answers-how-far-to-the-village',
    name: 'How far to the village',
    category: 'plucked',
    description:
      'Steel strings plucked right at the bridge, driven and slowly phased, with seven uneven echoes scattered wide.',
    preview: ROLLED_ASK,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bridge harp',
      params: { body: 0.75, nail: 0.7, sustain: 6, release: 1.2, tone: 0.85, volume: 0 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console', params: { drive: 0.5 } },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { centerHz: 1800, mix: 0.45 } },
      { deviceId: 'constellation', preset: 'Scattered seven', params: { span: 1300, mix: 0.3 } },
    ],
  },
  {
    id: 'questions-and-answers-an-hour-if-we-walk',
    name: 'An hour if we walk',
    category: 'plucked',
    description:
      'Nylon strings let ring for eight seconds over a bank of C major strings that sound along with them.',
    preview: ROLLED_REPLY,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: { position: 0.32, nail: 0.15, tone: 0.45, release: 8 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Piano pedal',
        params: { root: 0, mode: 0, sympathy: 0.7, decay: 5, mix: 0.5 },
      },
    ],
  },
  {
    id: 'questions-and-answers-shall-we-light-the-lamp',
    name: 'Shall we light the lamp',
    category: 'plucked',
    description:
      'A steel string with hardly any body, pieces of it bending upward by a fourth as they fade on a bright plate.',
    preview: MINOR_ASK,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bare string',
      params: { position: 0.09, nail: 0.9, sustain: 5, release: 0.9, volume: -1 },
    },
    effects: [
      { deviceId: 'falling', preset: 'Questions', params: { fall: 5, mix: 0.45 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { decay: 0.5, mix: 0.36 } },
    ],
  },
  {
    id: 'questions-and-answers-wait-until-it-is-dark',
    name: 'Wait until it is dark',
    category: 'plucked',
    description:
      'Steel strings left to ring with slow pieces sinking away under them, everything above 2.6 kHz rolled off.',
    preview: MINOR_REPLY,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { body: 1, position: 0.4, nail: 0.1, tone: 0.2, volume: -1 },
    },
    effects: [
      { deviceId: 'falling', preset: 'Slow sighs', params: { fall: -3, mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 2600 } },
    ],
  },
  {
    id: 'questions-and-answers-where-did-the-path-go',
    name: 'Where did the path go',
    category: 'plucked',
    description:
      'A loosely strummed steel string swinging from side to side, with half-beat backward echoes under it.',
    preview: ASK,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Lazy strum',
      params: { nail: 0.7, position: 0.14, release: 1.5, strum: 60, volume: 2.5 },
    },
    effects: [
      { deviceId: 'around', preset: 'Wide pendulum', params: { rate: 0.35 } },
      {
        deviceId: 'reverse-delay',
        preset: 'Hard splices',
        params: { time: 400, feedback: 0.15, smooth: 0.25, mix: 0.3 },
      },
    ],
  },
  {
    id: 'questions-and-answers-under-the-fallen-leaves',
    name: 'Under the fallen leaves',
    category: 'plucked',
    description:
      'A soft twelve string played over the hole, its tone smeared into a dark blur that hangs after each note.',
    preview: REPLY,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve drift',
      params: { tone: 0.2, nail: 0.1, shimmer: 1 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { blur: 0.75, mix: 0.5 } },
    ],
  },
  {
    id: 'questions-and-answers-are-those-swallows-back',
    name: 'Are those swallows back',
    category: 'plucked',
    description:
      'A short bright twelve string in a chorus, sparks of its overtones thrown off after the attacks.',
    preview: PERIOD,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { position: 0.1, sustain: 2, release: 0.4, tone: 0.85, volume: 4 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Overtone spray', params: { density: 12, mix: 0.25 } },
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'questions-and-answers-since-early-this-week',
    name: 'Since early this week',
    category: 'plucked',
    description: 'A rounded nylon string on a worn, wobbling cassette with a dark plate behind it.',
    preview: ROLLED_REPLY,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: { position: 0.2, nail: 0.3, tone: 0.5, sustain: 5, release: 1.6, volume: 1 },
    },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Worn cassette',
        params: { drive: 0.4, wobble: 0.4, noise: 0.2 },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { decay: 0.6, mix: 0.3 } },
    ],
  },
  {
    id: 'questions-and-answers-can-you-hear-the-weir',
    name: 'Can you hear the weir',
    category: 'plucked',
    description:
      'Nylon struck with the nail near the bridge, levelled flat, swept by a short flanger and kept close.',
    preview: DORIAN_ASK,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: {
        position: 0.08,
        body: 0.8,
        nail: 0.8,
        tone: 0.9,
        sustain: 4,
        release: 0.4,
        volume: 4,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 28, outputGain: -5 } },
      { deviceId: 'flanger', preset: 'Through-zero feel', params: { depth: 80, mix: 0.45 } },
      { deviceId: 'distance', preset: 'Close mic' },
    ],
  },
  {
    id: 'questions-and-answers-only-when-the-wind-drops',
    name: 'Only when the wind drops',
    category: 'plucked',
    description:
      'Nylon with the pluck taken off so that each note swells in over a quarter second, in a soft six second space.',
    preview: DORIAN_REPLY,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { type: 1, position: 0.28, nail: 0.25, tone: 0.4, release: 6, volume: 5.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 260 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.45, decay: 6, highCut: 4500, mix: 0.38 },
      },
    ],
  },
  {
    id: 'questions-and-answers-what-time-is-supper',
    name: 'What time is supper',
    category: 'plucked',
    description:
      'A nylon string with some nail, driven into a limiter until it is even and put under a quick tremolo.',
    preview: PERIOD,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Glass pick',
      params: {
        type: 1,
        body: 0.9,
        position: 0.2,
        nail: 0.6,
        tone: 0.6,
        sustain: 3,
        release: 0.4,
        volume: 3,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Flattened', params: { inputGain: 30, outputGain: -9 } },
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 6.67, depth: 0.45 } },
    ],
  },
  {
    id: 'questions-and-answers-when-the-bread-is-out',
    name: 'When the bread is out',
    category: 'plucked',
    description:
      'A twelve string under the thumb, turning slowly in a rotary cabinet, with a hall whose lows last longest.',
    preview: REPLY,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { type: 2, tone: 0.35, sustain: 7, release: 4, shimmer: 0.6 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { lowDecay: 4, mix: 0.25 } },
    ],
  },
  // Zither: plates and courses for the question, felt and long strings for the answer.
  {
    id: 'questions-and-answers-is-the-ferry-late-again',
    name: 'Is the ferry late again',
    category: 'plucked',
    description:
      'Picked octaves on a dulcimer body, quick and short, with half-beat repeats and only their air widened.',
    preview: ASK,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: {
        chord: 1,
        strum: 25,
        body: 2,
        brightness: 0.8,
        position: 0.12,
        decay: 2.5,
        release: 0.6,
        volume: -1,
      },
    },
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Plain echo',
        params: { time: 400, feedback: 0.4, mix: 0.3 },
      },
      { deviceId: 'spread', preset: 'Air only' },
    ],
  },
  {
    id: 'questions-and-answers-it-leaves-when-it-leaves',
    name: 'It leaves when it leaves',
    category: 'plucked',
    description:
      'A single string under a soft hammer, ringing for a long time and heard from the back of a hall.',
    preview: REPLY,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { brightness: 0.2, decay: 9, release: 6, sympathy: 0.5 },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall', params: { distance: 0.7 } }],
  },
  {
    id: 'questions-and-answers-who-painted-the-door',
    name: 'Who painted the door',
    category: 'plucked',
    description:
      'A hard dulcimer stroke in a quick chorus, stopped soon after the key, its echoes jumping up an octave.',
    preview: MINOR_ASK,
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: { roll: 0, decay: 1.6, release: 0.4, brightness: 0.85, volume: -2.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 1.4, mix: 0.35 } },
      {
        deviceId: 'analog-delay',
        preset: 'Octave hop',
        params: { time: 300, feedback: 0.4, mix: 0.25 },
      },
    ],
  },
  {
    id: 'questions-and-answers-my-aunt-long-ago',
    name: 'My aunt, long ago',
    category: 'plucked',
    description:
      'A dark harp string from its middle, played back from a slow warped record with a faint haze over it.',
    preview: MINOR_REPLY,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { brightness: 0.2, position: 0.48, decay: 12, body: 0 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'Slow platter',
        params: { warp: 0.45, crackle: 0.18, surface: 0.15 },
      },
      { deviceId: 'spectral-blur', preset: 'Faint haze', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'questions-and-answers-why-is-the-ice-humming',
    name: 'Why is the ice humming',
    category: 'plucked',
    description:
      'A bright detuned double course with a frequency-shifted copy beating against it and a ripple that climbs the bands.',
    preview: ROLLED_ASK,
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { chord: 0, courses: 1, brightness: 0.85, decay: 5, release: 2, volume: -2 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Moving beat', params: { mix: 0.3 } },
      { deviceId: 'glimmer', preset: 'Rising ripple', params: { depth: 0.6 } },
    ],
  },
  {
    id: 'questions-and-answers-it-is-making-up-its-mind',
    name: 'It is making up its mind',
    category: 'plucked',
    description:
      'A felted string with its sympathetic strings up, its long reverb sinking by octaves.',
    preview: ROLLED_REPLY,
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: { chord: 0, sympathy: 0.8, decay: 10, release: 8, volume: -11 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Undertow', params: { decay: 7, shimmer: 0.45, mix: 0.35 } },
    ],
  },
  {
    id: 'questions-and-answers-did-the-letter-come',
    name: 'Did the letter come',
    category: 'plucked',
    description:
      'A nasal koto-bodied string pressed into a thin vowel, with one slap of tape after each note.',
    preview: DORIAN_ASK,
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: { chord: 0, direction: 0, decay: 2.6, release: 0.8, brightness: 0.9, volume: -1.5 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Thin vowel', params: { amount: 0.8 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 130, mix: 0.35 } },
    ],
  },
  {
    id: 'questions-and-answers-tomorrow-with-the-milk',
    name: 'Tomorrow, with the milk',
    category: 'plucked',
    description:
      'A zither string from near its middle with a low string section swelling in behind, the whole of it muffled.',
    preview: DORIAN_REPLY,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { chord: 0, brightness: 0.25, position: 0.4, courses: 0.1 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Low section', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'questions-and-answers-have-you-seen-my-hat',
    name: 'Have you seen my hat',
    category: 'plucked',
    description:
      'A short hammered dulcimer through an early converter, each note answered backwards half a second on.',
    preview: PERIOD,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { exciter: 2, body: 2, decay: 0.9, release: 0.3, brightness: 0.6, volume: -1.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler' },
      { deviceId: 'canon', preset: 'Mirror answer', params: { gap: 0.45, mix: 0.3 } },
    ],
  },
  {
    id: 'questions-and-answers-you-are-wearing-it',
    name: 'You are wearing it',
    category: 'plucked',
    description:
      'Fingered octaves on an open zither, hardly turning in a slow cabinet and pushed back into a dark plate.',
    preview: REPLY,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { chord: 1, exciter: 0, strum: 0, brightness: 0.4, decay: 6, release: 3 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Faint motion', params: { mix: 0.7 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { decay: 0.7, mix: 0.5 } },
    ],
  },
  {
    id: 'questions-and-answers-what-is-in-the-jar',
    name: 'What is in the jar',
    category: 'plucked',
    description: 'Single dulcimer strings in a fast hammered roll, sounding inside a small bottle.',
    preview: PERIOD,
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { chord: 0, roll: 14, decay: 3, release: 1, volume: -15 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Blown bottle', params: { size: 0.6, air: 0.1, mix: 0.55 } },
    ],
  },
  {
    id: 'questions-and-answers-plums-from-last-summer',
    name: 'Plums from last summer',
    category: 'plucked',
    description:
      'A finger on wide double courses, warmed and opened out to a summer tone in a three second hall.',
    preview: REPLY,
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { exciter: 0, brightness: 0.35, position: 0.4, chord: 0, courses: 0.6 },
    },
    effects: [
      { deviceId: 'seasons', preset: 'High summer' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 3, breathDepth: 0, mix: 0.3 } },
    ],
  },
  {
    id: 'questions-and-answers-does-this-stair-creak',
    name: 'Does this stair creak',
    category: 'plucked',
    description:
      'A koto-bodied string picked at its very end and choked, warmed by a tube stage, its echo running faster and faster.',
    preview: MINOR_ASK,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: {
        exciter: 1,
        position: 0.05,
        brightness: 1,
        decay: 1.2,
        release: 0.2,
        body: 3,
        volume: -6.5,
      },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Ball on glass',
        params: { first: 260, skips: 10, mix: 0.3 },
      },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 16, outputDb: -8 } },
    ],
  },
  {
    id: 'questions-and-answers-only-the-fourth-one',
    name: 'Only the fourth one',
    category: 'plucked',
    description:
      'A soft hammer on dark dulcimer strings with a bank of A minor strings ringing along for six seconds.',
    preview: MINOR_REPLY,
    instrument: {
      deviceId: 'zither',
      preset: 'Minor tremolo',
      params: { chord: 0, roll: 0, brightness: 0.3, decay: 8, volume: -9.5 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { root: 9, mode: 1, decay: 6, mix: 0.5 },
      },
    ],
  },
  {
    id: 'questions-and-answers-how-deep-is-the-lake',
    name: 'How deep is the lake',
    category: 'plucked',
    description:
      'Rising fingered octaves on a harp body, each echoed from its low partials up to its high ones.',
    preview: ROLLED_ASK,
    instrument: {
      deviceId: 'zither',
      preset: 'Harp glissando',
      params: {
        chord: 1,
        strum: 90,
        direction: 0,
        brightness: 0.75,
        release: 3,
        decay: 4,
        volume: -6.5,
      },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { time: 500, feedback: 0.25, mix: 0.4 } },
      { deviceId: 'stereo-detune', preset: 'Cloud', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'questions-and-answers-nobody-has-asked-before',
    name: 'Nobody has asked before',
    category: 'plucked',
    description:
      'Falling octaves on dark harp strings, slowly strummed, wavering as if just under the surface.',
    preview: ROLLED_REPLY,
    instrument: {
      deviceId: 'zither',
      preset: 'Slow falling sus',
      params: {
        chord: 1,
        strum: 260,
        brightness: 0.15,
        sympathy: 0.6,
        decay: 10,
        release: 10,
        volume: -12,
      },
    },
    effects: [{ deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0, depth: 0.3 } }],
  },
  {
    id: 'questions-and-answers-is-anyone-at-the-bridge',
    name: 'Is anyone at the bridge',
    category: 'plucked',
    description:
      'A clean picked zither with no detuned course, its echoes set out along an uneven ladder between the speakers.',
    preview: DORIAN_ASK,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: {
        chord: 0,
        exciter: 1,
        brightness: 0.75,
        position: 0.1,
        decay: 3,
        release: 1,
        courses: 0,
        volume: -2,
      },
    },
    effects: [
      {
        deviceId: 'constellation',
        preset: 'Bent ladder',
        params: { span: 1600, again: 0.2, mix: 0.4 },
      },
    ],
  },
  {
    id: 'questions-and-answers-two-herons-and-a-boy',
    name: 'Two herons and a boy',
    category: 'plucked',
    description:
      'A softly hammered harp string with two drifting copies close beside it and an airy hall.',
    preview: DORIAN_REPLY,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: {
        exciter: 2,
        brightness: 0.4,
        position: 0.2,
        decay: 7,
        release: 5,
        sympathy: 0.4,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { midDecay: 3.5, mix: 0.3 } },
    ],
  },
  {
    id: 'questions-and-answers-when-do-the-bees-sleep',
    name: 'When do the bees sleep',
    category: 'plucked',
    description:
      'Finger tremolo on dulcimer strings with its middle band pulsing eight times a second, the attacks lightly veiled.',
    preview: ASK,
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: {
        roll: 16,
        exciter: 0,
        decay: 1.5,
        release: 0.5,
        brightness: 0.6,
        position: 0.15,
        volume: -7.5,
      },
    },
    effects: [
      { deviceId: 'band-pulse', preset: 'Eight a second' },
      { deviceId: 'fog', preset: 'Thin veil', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'questions-and-answers-after-the-clover-closes',
    name: 'After the clover closes',
    category: 'plucked',
    description:
      'A quiet finger on long harp strings, the tail sagging a little in pitch as it ages, hazy at both sides.',
    preview: REPLY,
    instrument: {
      deviceId: 'zither',
      preset: 'Slow sus arpeggio',
      params: { chord: 0, roll: 0, brightness: 0.3, decay: 14, sympathy: 0.7 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.35 } },
      { deviceId: 'spread', preset: 'Hazy edges' },
    ],
  },
  // Flute: tongued and bright to ask, breath and long releases to answer.
  {
    id: 'questions-and-answers-did-an-owl-just-call',
    name: 'Did an owl just call',
    category: 'wind',
    description:
      'Pan pipes with a hard puff at the front, skipping off in closer and closer echoes and circling the head.',
    preview: AIR_ASK,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { chiff: 1, breath: 0.6, release: 0.2, volume: -4.5 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Nearly dry',
        params: { first: 400, bounce: 0.75, mix: 0.25 },
      },
      { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.3 } },
    ],
  },
  {
    id: 'questions-and-answers-over-by-the-chapel',
    name: 'Over by the chapel',
    category: 'wind',
    description:
      'A low flute with a soft start, set in a small chapel that rings with a sung vowel.',
    preview: AIR_REPLY,
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { attack: 0.12, breath: 0.4, release: 1.2, volume: -9 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { decay: 2.4, mix: 0.4 } }],
  },
  {
    id: 'questions-and-answers-which-star-is-that-one',
    name: 'Which star is that one',
    category: 'wind',
    description:
      'A hard blown concert flute with a C major third above and a sixth below it, on a short bright plate.',
    preview: AIR_PERIOD,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { chiff: 0.6, vibrato: 0.4, release: 0.2, volume: -2 },
    },
    effects: [
      { deviceId: 'lattice', preset: 'Diatonic thirds', params: { mix: 45 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'questions-and-answers-that-one-is-a-lighthouse',
    name: 'That one is a lighthouse',
    category: 'wind',
    description:
      'A straight concert flute that a slow pan turns from side to side, with a late hall after each note.',
    preview: AIR_REPLY,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { attack: 0.2, blow: 0.3, release: 1, volume: -4.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.16, depth: 0.9 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { decay: 5, mix: 0.3 } },
    ],
  },
  {
    id: 'questions-and-answers-is-there-snow-up-there',
    name: 'Is there snow up there',
    category: 'wind',
    description:
      'A wood flute blown hard and bent up from below, its body shrunk, with clean half-beat repeats.',
    preview: AIR_PERIOD,
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { breath: 0.15, blow: 0.8, scoop: 70, attack: 0.02, release: 0.3 },
    },
    effects: [
      { deviceId: 'size', preset: 'Music box', params: { size: -0.7 } },
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { time: 225, feedback: 0.35, mix: 0.28 },
      },
    ],
  },
  {
    id: 'questions-and-answers-down-to-the-tree-line',
    name: 'Down to the tree line',
    category: 'wind',
    description: 'A low flute with warm breath and an octave under it, heard from across the room.',
    preview: AIR_REPLY,
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { breath: 0.6, blow: 0.4, chiff: 0.2, release: 1.8, volume: -5.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } },
      { deviceId: 'distance', preset: 'Across the room', params: { distance: 0.55 } },
    ],
  },
  {
    id: 'questions-and-answers-who-taught-you-to-wait',
    name: 'Who taught you to wait',
    category: 'wind',
    description:
      'A breathy end-blown flute scooped up into each note, its sway widening late, with a pentode bite and quick repeats.',
    preview: AIR_ASK,
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: { scoop: 160, breath: 0.7, release: 0.4, volume: -14 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { wait: 300, depth: 40 } },
      { deviceId: 'analog-drive', preset: 'Bite', params: { tone: 0.5 } },
      {
        deviceId: 'analog-delay',
        preset: 'Slapback',
        params: { time: 200, feedback: 0.3, spread: 1, mix: 0.4 },
      },
    ],
  },
  {
    id: 'questions-and-answers-the-tide-mostly',
    name: 'The tide, mostly',
    category: 'wind',
    description:
      'An end-blown flute with a wide sway and a slow release, with surf washing through it.',
    preview: AIR_REPLY,
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: { attack: 0.25, scoop: 0, release: 2.6, vibrato: 0.6 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Slow surf', params: { mix: 0.5 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'questions-and-answers-where-does-it-echo-from',
    name: 'Where does it echo from',
    category: 'wind',
    description:
      'A clean tongued concert flute which a second one repeats a bar later, the middle opened wide.',
    preview: AIR_ASK,
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: { breath: 0.2, blow: 0.6, chiff: 0.8, release: 0.15 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Faint answer', params: { gap: 1.6, tone: 6000, mix: 0.4 } },
      { deviceId: 'spread', preset: 'Open middle' },
    ],
  },
  {
    id: 'questions-and-answers-far-side-of-the-quarry',
    name: 'Far side of the quarry',
    category: 'wind',
    description: 'Soft breathy pan pipes against a wall of pattering short echoes.',
    preview: AIR_PERIOD,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { chiff: 0.2, breath: 0.8, attack: 0.09, release: 1.4 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        preset: 'Pattering',
        params: { length: 0.45, feedback: 0.45, highCut: 4500, mix: 0.42 },
      },
    ],
  },
  {
    id: 'questions-and-answers-are-the-geese-leaving',
    name: 'Are the geese leaving',
    category: 'wind',
    description:
      'A quick recorder-like wood flute with an organ octave above it and two more flying close by.',
    preview: AIR_PERIOD,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { chiff: 0.7, attack: 0.02, blow: 0.5, breath: 0.1 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Octave above', params: { speak: 70, mix: 0.5 } },
      { deviceId: 'murmuration', preset: 'Two close by', params: { speed: 1, mix: 0.5 } },
    ],
  },
  {
    id: 'questions-and-answers-they-left-on-sunday',
    name: 'They left on Sunday',
    category: 'wind',
    description:
      'A low flute that is mostly breath, off a dull wavering reel, its reverb drifting down an octave.',
    preview: AIR_REPLY,
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { attack: 0.3, blow: 0.3, breath: 0.8, release: 2, volume: -9 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.4, tone: 0.3 } },
      {
        deviceId: 'bloom-reverb',
        preset: 'Winter drift',
        params: { bloom: 0.35, interval: 1, decay: 5, mix: 0.35 },
      },
    ],
  },
  {
    id: 'questions-and-answers-what-was-that-rustle',
    name: 'What was that rustle',
    category: 'wind',
    description:
      'Whispering pipes with the puffs brought forward and levelled, a faint dust of high sparks behind.',
    preview: AIR_ASK,
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { attack: 0.015, chiff: 1, blow: 0.35, release: 0.25 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Strikes forward' },
      { deviceId: 'glints', preset: 'Faint dust', params: { mix: 0.2 } },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'questions-and-answers-a-hedgehog-going-home',
    name: 'A hedgehog going home',
    category: 'wind',
    description:
      'An end-blown flute scooped gently from below and sounding inside a clay pot in a small room.',
    preview: AIR_PERIOD,
    instrument: {
      deviceId: 'flute',
      preset: 'Bent from below',
      params: { chiff: 0.3, blow: 0.35, breath: 0.6, scoop: 90, release: 1.4 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.65 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'questions-and-answers-may-i-open-a-window',
    name: 'May I open a window',
    category: 'wind',
    description:
      'A soft concert flute doubled a few cents off at both sides, in a bright two second air.',
    preview: AIR_PERIOD,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft wind lead',
      params: { attack: 0.03, blow: 0.45, vibrato: 0.2, release: 0.3 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { detune: 12 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { decay: 2, mix: 0.28 } },
    ],
  },
  {
    id: 'questions-and-answers-yes-both-of-them',
    name: 'Yes, both of them',
    category: 'wind',
    description:
      'A wood flute that fades in, with low pure tones gathering an octave under it and the lows warmed.',
    preview: AIR_REPLY,
    instrument: {
      deviceId: 'flute',
      preset: 'Slow wood swell',
      params: { attack: 0.22, release: 2.5, breath: 0.35, blow: 0.3 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Low shadow',
        params: { attack: 300, release: 3, mix: 0.45 },
      },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  // Harp: near the board and koto strings to ask, the middle of long strings to answer.
  {
    id: 'questions-and-answers-is-the-water-warm',
    name: 'Is the water warm',
    category: 'plucked',
    description:
      'A harp plucked hard by the board, short and thin, under a gentle flanger with chorused echoes.',
    preview: ROLLED_ASK,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { touch: 0.8, decay: 0.7, body: 0.3, volume: 6 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Gentle sweep', params: { rate: 0.4, mix: 0.4 } },
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 200, feedback: 0.3, mix: 0.3 },
      },
    ],
  },
  {
    id: 'questions-and-answers-warm-enough-for-ankles',
    name: 'Warm enough for ankles',
    category: 'plucked',
    description:
      'A dark harp from the middle of its strings, ringing long, wavering just under the surface and wide.',
    preview: ROLLED_REPLY,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { decay: 2.2, halo: 0.6, volume: -3.5 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Sunlit shallows', params: { bubbles: 0, depth: 0.3 } },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  {
    id: 'questions-and-answers-how-many-steps-are-left',
    name: 'How many steps are left',
    category: 'plucked',
    description:
      'Short bright koto strings levelled flat, with three tape heads stepping away after each note.',
    preview: MINOR_ASK,
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { pluck: 0.12, touch: 0.75, decay: 0.9, halo: 0.25, body: 0.85, volume: -1.5 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 26, outputGain: -8 } },
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 400, feedback: 0.35, mix: 0.33 },
      },
    ],
  },
  {
    id: 'questions-and-answers-nine-then-a-landing',
    name: 'Nine, then a landing',
    category: 'plucked',
    description:
      'Soft silk koto strings left ringing, with a dark string pad of the same notes swelling in behind.',
    preview: MINOR_REPLY,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { bend: 0, decay: 2.4, body: 0.9, volume: -1 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'String pad',
        params: { octaves: 0, brightness: 2200, mix: 0.4 },
      },
    ],
  },
  {
    id: 'questions-and-answers-whose-turn-is-it-now',
    name: 'Whose turn is it now',
    category: 'plucked',
    description: 'A short dry harp, levelled, that is answered by small steps climbing in octaves.',
    preview: DORIAN_ASK,
    instrument: { deviceId: 'harp', preset: 'Short dry pluck', params: { decay: 0.4, body: 0.6 } },
    effects: [
      {
        deviceId: 'cascade',
        preset: 'Rising steps',
        params: { time: 200, repeats: 4, interval: 0, mix: 0.3 },
      },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 15, outputGain: -8 } },
    ],
  },
  {
    id: 'questions-and-answers-yours-take-your-time',
    name: 'Yours, take your time',
    category: 'plucked',
    description:
      'A harp with its pluck softened, turning in a slow cabinet across the room, its level gently held.',
    preview: DORIAN_REPLY,
    instrument: {
      deviceId: 'harp',
      preset: 'Rings while held',
      params: { touch: 0.15, decay: 2, damp: 0.3, body: 0.8, volume: -7 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 110, depth: 0.9 } },
      { deviceId: 'rotary', preset: 'Across the room', params: { mix: 0.7 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'questions-and-answers-will-the-frost-hold',
    name: 'Will the frost hold',
    category: 'plucked',
    description:
      'Bright guzheng strings on warm tape, with a glassy edge tuned to A and a flicker of backward echo.',
    preview: MINOR_ASK,
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { touch: 0.8, decay: 1.6, halo: 0.6, body: 0.6, volume: 0 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 14, outputDb: -8 } },
      { deviceId: 'ring', preset: 'Pad shimmer', params: { root: 9, mix: 0.18 } },
      { deviceId: 'reverse-delay', preset: 'Flicker', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'questions-and-answers-until-the-sun-finds-it',
    name: 'Until the sun finds it',
    category: 'plucked',
    description:
      'Gentle guzheng strings over a table of metal bowls in A minor that keep singing after them.',
    preview: MINOR_REPLY,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { pluck: 0.4, touch: 0.2, decay: 2.2, halo: 0.8 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Long ring', params: { root: 9, scale: 1, ring: 14, mix: 0.4 } },
    ],
  },
  {
    id: 'questions-and-answers-did-you-count-the-boats',
    name: 'Did you count the boats',
    category: 'plucked',
    description:
      'A damped harp whose middle pulses four times a second over a short loop of itself an octave up.',
    preview: PERIOD,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { damp: 0.6, touch: 0.6, halo: 0.2, volume: -1 },
    },
    effects: [
      { deviceId: 'band-pulse', preset: 'Four a second' },
      { deviceId: 'micro-looper', preset: 'Octave up', params: { length: 0.9, mix: 0.28 } },
    ],
  },
  {
    id: 'questions-and-answers-eleven-and-a-raft',
    name: 'Eleven and a raft',
    category: 'plucked',
    description:
      'A quietly touched harp, its chords rolled over a third of a second, held by a clean blur at a distance.',
    preview: REPLY,
    instrument: {
      deviceId: 'harp',
      preset: 'Slow rolled chord',
      params: { sweep: 0.35, touch: 0.1, decay: 1.6, volume: -6 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Clean sustain', params: { blur: 0.8, mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'questions-and-answers-can-we-cross-from-here',
    name: 'Can we cross from here',
    category: 'plucked',
    description:
      'Koto strings leaned on a hair sharp after the pluck, each with a short chirp and a spiralling detune.',
    preview: ROLLED_ASK,
    instrument: {
      deviceId: 'harp',
      preset: 'Rising koto',
      params: { bend: 14, touch: 0.5, decay: 1.8, volume: 1 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Short chirp', params: { time: 120, mix: 0.4 } },
      { deviceId: 'stereo-detune', preset: 'Spiral', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'questions-and-answers-stone-by-stone-yes',
    name: 'Stone by stone, yes',
    category: 'plucked',
    description:
      'A rounded concert harp with a half-speed octave moving slowly underneath and a dark plate.',
    preview: ROLLED_REPLY,
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { pluck: 0.48, touch: 0.25, decay: 1.4, body: 1 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.32 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { decay: 0.7, mix: 0.28 } },
    ],
  },
  // Chord harp: the hymn swept up for the question and down or soft for the answer.
  {
    id: 'questions-and-answers-which-hymn-comes-next',
    name: 'Which hymn comes next',
    category: 'keys',
    description:
      'Chords swept upward over four octaves with bright strings, phased, and a few small echoes.',
    preview: HYMN_ASK,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { strum: 90, direction: 0, span: 3, tone: 0.75, pad: 0.1, sustain: 2, volume: 0.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { mix: 0.5 } },
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'questions-and-answers-the-one-we-all-know',
    name: 'The one we all know',
    category: 'keys',
    description:
      'Chords swept down over two octaves on a full pad, with an organ pedal an octave below and a hall.',
    preview: HYMN_REPLY,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow falling pad',
      params: { strum: 80, direction: 1, span: 1, tone: 0.3, pad: 0.8, sustain: 4, spread: 0.4 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Pedal under', params: { mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'questions-and-answers-is-this-chair-taken',
    name: 'Is this chair taken',
    category: 'keys',
    description:
      'A quick upward strum of short bright strings, glazed by an early converter and flickering at the edges.',
    preview: HYMN_ASK,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'String rain',
      params: { strum: 15, direction: 0, span: 2, sustain: 0.8, tone: 0.85, volume: -3 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze' },
      { deviceId: 'constellation', preset: 'Close flicker', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'questions-and-answers-it-was-saved-for-you',
    name: 'It was saved for you',
    category: 'keys',
    description:
      'A brushed chord within one octave, dark and long, with a faint warm fuzz spread behind it.',
    preview: HYMN_REPLY,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Brushed chord',
      params: { strum: 20, span: 0, tone: 0.1, pad: 0.5, sustain: 6 },
    },
    effects: [
      { deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.35 } },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'questions-and-answers-do-the-bells-still-ring',
    name: 'Do the bells still ring',
    category: 'bell',
    description:
      'Struck chimes with no sweep at all, rung into bells tuned to C, with flickers of what went before.',
    preview: HYMN_ASK,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Single chimes',
      params: { strum: 0, sustain: 2.2, tone: 0.95, span: 2, volume: -9 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Bell on the root', params: { root: 0, mix: 0.22 } },
      { deviceId: 'echo-memory', preset: 'Flickers', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'questions-and-answers-at-noon-if-he-remembers',
    name: 'At noon, if he remembers',
    category: 'bell',
    description:
      'Mellow long chimes with embers of grain falling away an octave at a time in a small dark room.',
    preview: HYMN_REPLY,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Long glass chimes',
      params: { sustain: 6, tone: 0.4, spread: 0.5, pad: 0.15 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Falling embers',
        params: { time: 400, feedback: 0.3, mix: 0.3 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'questions-and-answers-are-you-asleep-already',
    name: 'Are you asleep already',
    category: 'keys',
    description:
      'A small harp strummed up and down, its filter opening with each touch, with short tape echoes.',
    preview: ASK,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Toy harp',
      params: { strum: 45, direction: 2, span: 1, tone: 0.6, sustain: 1.4, pad: 0.2 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Touch wah', params: { mix: 0.5 } },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'questions-and-answers-not-while-you-whisper',
    name: 'Not while you whisper',
    category: 'keys',
    description:
      'A very slow muffled strum that breathes in and out with a little air, its edges dissolved in fog.',
    preview: HYMN_REPLY,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Muffled slow strum',
      params: { strum: 140, span: 2, tone: 0.05, pad: 0.2, sustain: 5, volume: -2 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Short of breath', params: { air: 0.5 } },
      { deviceId: 'fog', preset: 'Slow rise', params: { size: 300, layers: 2, mix: 0.8 } },
    ],
  },
  // Felt piano: bare hammers to ask, felt and pedal to answer.
  {
    id: 'questions-and-answers-was-that-the-front-door',
    name: 'Was that the front door',
    category: 'keys',
    description:
      'Bare hard hammers with a knock in them, each caught in a short reverb that stops dead, and levelled.',
    preview: PERIOD,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { hardness: 0.75, thump: 0.6, reverbMix: 0, outputDb: -6 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.3, mix: 0.35 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { inputGain: 10, outputGain: -6 } },
    ],
  },
  {
    id: 'questions-and-answers-just-the-house-settling',
    name: 'Just the house settling',
    category: 'keys',
    description:
      'A piano fully felted and creaking, through a small dull speaker with the noise of an empty room under it.',
    preview: REPLY,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Close and creaky',
      params: { action: 0.8, reverbMix: 0.15, outputDb: -4 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker', params: { treble: -0.6 } },
      { deviceId: 'noise-floor', preset: 'Empty room' },
    ],
  },
  {
    id: 'questions-and-answers-where-are-my-glasses',
    name: 'Where are my glasses',
    category: 'keys',
    description: 'A hard glassy upright with its body shrunk, faintly repeated half a beat behind.',
    preview: MINOR_ASK,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { reverbMix: 0, resonance: 0.2, outputDb: -5 },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller', params: { size: -0.6, mix: 0.8 } },
      { deviceId: 'canon', preset: 'Faint answer', params: { gap: 0.4, mix: 0.3 } },
    ],
  },
  {
    id: 'questions-and-answers-beside-the-blue-bowl',
    name: 'Beside the blue bowl',
    category: 'keys',
    description:
      'A felted piano with the pedal down and a table of bowls in A minor sounding with it.',
    preview: MINOR_REPLY,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: { felt: 0.85, reverbMix: 0, outputDb: -15.5 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Minor table',
        params: { root: 9, scale: 3, ring: 9, mix: 0.4 },
      },
    ],
  },
  {
    id: 'questions-and-answers-should-i-turn-the-page',
    name: 'Should I turn the page',
    category: 'keys',
    description:
      'An old upright well out of tune in a fast bright rotor, with faint chorused echoes.',
    preview: ROLLED_ASK,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { felt: 0.15, reverbMix: 0, outputDb: -15 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Guitar swirl', params: { mix: 0.5 } },
      { deviceId: 'analog-delay', preset: 'Faint halo', params: { time: 400, mix: 0.22 } },
    ],
  },
  {
    id: 'questions-and-answers-turn-it-when-you-like',
    name: 'Turn it when you like',
    category: 'keys',
    description: 'A soft half-pedalled piano, its tail slowly sagging and darkening like wax.',
    preview: ROLLED_REPLY,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: { felt: 0.8, hardness: 0.2, reverbMix: 0, outputDb: -15 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Candle wax', params: { sag: -6, mix: 0.35 } },
      { deviceId: 'spread', preset: 'Soft tilt' },
    ],
  },
  {
    id: 'questions-and-answers-who-is-upstairs',
    name: 'Who is upstairs',
    category: 'keys',
    description: 'A lean piano with heavy thumps, heard through a drum skin with a hint of spring.',
    preview: DORIAN_ASK,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Lean',
      params: { felt: 0.2, hardness: 0.6, thump: 1, reverbMix: 0, outputDb: -16 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { size: 1.6, mix: 0.8 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'questions-and-answers-someone-practising',
    name: 'Someone practising',
    category: 'keys',
    description:
      'A felted piano heard narrow and dull through the wall of the next room, with the faintest late sway.',
    preview: DORIAN_REPLY,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Next room',
      params: { reverbMix: 0.3, felt: 0.6, width: 0.1, outputDb: -14 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door', params: { distance: 0.75 } },
      { deviceId: 'late-vibrato', preset: 'Barely there' },
    ],
  },
  // Wavetable: quick reeds and pulses to ask, still sines and voices to answer.
  {
    id: 'questions-and-answers-how-long-is-the-tunnel',
    name: 'How long is the tunnel',
    category: 'pad',
    description:
      'A narrow nasal pulse that speaks at once, its filter sweeping up and back under a wide chorus.',
    preview: HYMN_ASK,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: { attack: 0.03, release: 0.5, cutoff: 5000, resonance: 0.35 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Dub sweep',
        params: { cutoffHz: 1800, lfoAmount: 40, lfoRateHz: 0.625, resonance: 1.5, driveDb: 0 },
      },
      { deviceId: 'chorus', preset: 'Wide chorus' },
    ],
  },
  {
    id: 'questions-and-answers-there-is-light-already',
    name: 'There is light already',
    category: 'pad',
    description:
      'Still sines with a sub below, their partials catching the light, and a faint reverb an octave up.',
    preview: HYMN_REPLY,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { attack: 0.4, release: 2, sub: 0.7, cutoff: 2000, detune: 8, volume: -15 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Light on water' },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'questions-and-answers-is-the-fog-lifting',
    name: 'Is the fog lifting',
    category: 'pad',
    description:
      'A bright reed organ with its starts blurred in a haze and a fast soft ripple in its level.',
    preview: HYMN_ASK,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { attack: 0.08, position: 0.4, release: 0.6, cutoff: 6000 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Bright haze' },
      { deviceId: 'pulses', preset: 'Faint ripple', params: { rate: 5, mix: 0.6 } },
    ],
  },
  {
    id: 'questions-and-answers-from-the-top-downwards',
    name: 'From the top downwards',
    category: 'pad',
    description:
      'A hollow closed tone that enters slowly, its bands drifting like water, with a faint hall.',
    preview: HYMN_REPLY,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 0.5, release: 2.5, cutoff: 1100, resonance: 0.1 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Slow water', params: { depth: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'questions-and-answers-what-colour-is-that-sea',
    name: 'What colour is that sea',
    category: 'pad',
    description:
      'Ringing overtones that move fast through their table, with whistled harmonics of A over them.',
    preview: AIR_ASK,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Ringing overtones',
      params: { attack: 0.06, release: 1, rate: 1.25, motion: 1, volume: 6 },
    },
    effects: [
      { deviceId: 'overtone-singer', preset: 'Whistle alone', params: { root: 9, mix: 0.3 } },
      { deviceId: 'stereo-detune', preset: 'Wider' },
    ],
  },
  {
    id: 'questions-and-answers-ask-again-at-six',
    name: 'Ask again at six',
    category: 'pad',
    description:
      'A closed humming choir in a low vowelled hall, held together by a slow hand on the fader.',
    preview: HYMN_REPLY,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Humming choir',
      params: { attack: 0.35, release: 2.5, cutoff: 1800 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 5, mix: 0.35 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  // West coast: struck folds to ask, round gated tones to answer.
  {
    id: 'questions-and-answers-do-the-stones-float',
    name: 'Do the stones float',
    category: 'plucked',
    description:
      'Short folded strikes on wood, warmed on tape after a light rain of octave echoes.',
    preview: PERIOD,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Rain on wood',
      params: { decay: 0.4, fold: 0.35, chance: 0.2, fm: 0.3, volume: -4.5 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Glass rain', params: { time: 225, repeats: 4, mix: 0.3 } },
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 10, outputDb: -7 } },
    ],
  },
  {
    id: 'questions-and-answers-the-small-ones-briefly',
    name: 'The small ones, briefly',
    category: 'plucked',
    description:
      'A soft dark mallet with a gentle start, and strings of C major ringing in sympathy.',
    preview: ROLLED_REPLY,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { attack: 0.02, decay: 2.4, colour: 0.2 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Follow the tune',
        params: { root: 0, mode: 0, decay: 4, mix: 0.45 },
      },
    ],
  },
  {
    id: 'questions-and-answers-what-makes-it-tick',
    name: 'What makes it tick',
    category: 'plucked',
    description:
      'A bright lopsided thumb piano inside a pulse that keeps quickening, with one wide pair of echoes.',
    preview: MINOR_ASK,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Thumb piano',
      params: { decay: 0.5, symmetry: 0.8, timbreEnv: 0.9, colour: 0.8, volume: 2.5 },
    },
    effects: [
      { deviceId: 'winding-down', preset: 'Four quickening' },
      {
        deviceId: 'constellation',
        preset: 'Wide pair',
        params: { span: 400, again: 0.2, mix: 0.35 },
      },
    ],
  },
  {
    id: 'questions-and-answers-a-spring-and-a-pebble',
    name: 'A spring and a pebble',
    category: 'plucked',
    description:
      'A round low-gated tone with little fold in it, in a single dark spring, lightly phased up high.',
    preview: MINOR_REPLY,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Round bass',
      params: { decay: 3, fold: 0.2, timbreEnv: 0.5, attack: 0.01 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.3 } },
      { deviceId: 'phaser', preset: 'Bass safe' },
    ],
  },
  {
    id: 'questions-and-answers-is-it-too-early-to-ask',
    name: 'Is it too early to ask',
    category: 'plucked',
    description:
      'Small quick chimes against a frequency-shifted copy that makes them beat, with a faint trace of tape echo.',
    preview: DORIAN_ASK,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Small chimes',
      params: { decay: 1.2, colour: 1, fm: 0.35, chance: 0.1, volume: -3 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Detuned', params: { mix: 0.4 } },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 400 } },
    ],
  },
  {
    id: 'questions-and-answers-never-before-breakfast',
    name: 'Never before breakfast',
    category: 'wind',
    description:
      'Hollow pipes that breathe in and close, two dulled loops of them turning out of step behind.',
    preview: DORIAN_REPLY,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow pipes',
      params: { attack: 0.15, decay: 3, sustain: 0.5, colour: 0.3, fm: 0.15, volume: -6.5 },
    },
    effects: [
      {
        deviceId: 'orbits',
        preset: 'Two voices',
        params: { length: 1.6, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  // Rewind: swells that snap shut on the question, swells that ring on for the answer.
  {
    id: 'questions-and-answers-what-did-you-say-before',
    name: 'What did you say before',
    category: 'texture',
    description:
      'Backward plucks that rush in for a third of a second and snap shut, levelled, stuttering and wide at the top.',
    preview: ROLLED_ASK,
    instrument: {
      deviceId: 'rewind',
      preset: 'Snap shut',
      params: { swell: 0.35, tone: 0.8, source: 2, rise: 0.9, volume: -1 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 24, outputGain: -9 } },
      { deviceId: 'reverse-delay', preset: 'Tight stutter', params: { mix: 0.25 } },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
  },
  {
    id: 'questions-and-answers-i-said-it-backwards',
    name: 'I said it backwards',
    category: 'keys',
    description:
      'A dark piano that swells up for one beat, lands gently and rings on into a cave, swaying on worn tape.',
    preview: REPLY,
    instrument: {
      deviceId: 'rewind',
      preset: 'Soft return',
      params: { swell: 0.8, tail: 0.8, tone: 0.2, volume: -2.5 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 4, mix: 0.35 } },
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.5, mix: 0.7 } },
    ],
  },
  {
    id: 'questions-and-answers-can-we-start-over',
    name: 'Can we start over',
    category: 'bell',
    description:
      'Backward bells that gather for nearly two beats and stop, answered by a follower running the other way.',
    preview: HYMN_ASK,
    instrument: {
      deviceId: 'rewind',
      preset: 'Beating bells',
      params: { strike: 0, swell: 1.5, shimmer: 0.4, tone: 0.8, tail: 0.1, ghost: 0.1, volume: 3 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Metallic comb', params: { mix: 0.3 } },
      { deviceId: 'canon', preset: 'Crab canon', params: { gap: 0.8, followers: 1, mix: 0.3 } },
    ],
  },
  {
    id: 'questions-and-answers-from-the-very-first-word',
    name: 'From the very first word',
    category: 'bell',
    description:
      'Bowls that gather under the hymn and ring on after it, an octave added below, with sparse echoes far away.',
    preview: HYMN_REPLY,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: { swell: 1.4, tail: 0.9, ghost: 0.4, shimmer: 0.2, volume: -1.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.7 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 6, mix: 0.3 } },
    ],
  },
]
