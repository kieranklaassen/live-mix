import { type FactoryPreset, type Phrase } from '../types'

// One tube, two registers a twelfth apart. The presets go in pairs, a dark low sound and a clear
// high one, on blown and struck pipes, an overtone voice, organ ranks, clarinet, flute and a few
// sounds that sing on their own third harmonic; the phrases are canons and calls at the twelfth.

// The call in the dark low register and its answer a twelfth up: D E F, G A under A B C, closing in tenths.
const CALL_AND_ANSWER: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.164, note: 50, gain: 0.575 },
    { atSec: 1.2, durSec: 0.582, note: 52, gain: 0.575 },
    { atSec: 1.8, durSec: 2.91, note: 53, gain: 0.575 },
    { atSec: 3.6, durSec: 1.164, note: 69, gain: 0.4 },
    { atSec: 4.8, durSec: 0.582, note: 55, gain: 0.575 },
    { atSec: 4.8, durSec: 0.582, note: 71, gain: 0.4 },
    { atSec: 5.4, durSec: 1.746, note: 57, gain: 0.575 },
    { atSec: 5.4, durSec: 1.746, note: 72, gain: 0.4 },
  ],
}

// Strict canon at the twelfth, two notes apart, D dorian: D E F D A F G E D with A B C A E C D over it.
const CANON_IN_HALVES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.757, note: 50, gain: 0.55 },
    { atSec: 0.78, durSec: 0.757, note: 52, gain: 0.55 },
    { atSec: 1.56, durSec: 0.757, note: 53, gain: 0.55 },
    { atSec: 1.56, durSec: 0.757, note: 69, gain: 0.375 },
    { atSec: 2.34, durSec: 0.757, note: 50, gain: 0.55 },
    { atSec: 2.34, durSec: 0.757, note: 71, gain: 0.375 },
    { atSec: 3.12, durSec: 0.757, note: 57, gain: 0.55 },
    { atSec: 3.12, durSec: 0.757, note: 72, gain: 0.375 },
    { atSec: 3.9, durSec: 0.757, note: 53, gain: 0.55 },
    { atSec: 3.9, durSec: 0.757, note: 69, gain: 0.375 },
    { atSec: 4.68, durSec: 0.757, note: 55, gain: 0.55 },
    { atSec: 4.68, durSec: 0.757, note: 76, gain: 0.375 },
    { atSec: 5.46, durSec: 0.757, note: 52, gain: 0.55 },
    { atSec: 5.46, durSec: 0.757, note: 72, gain: 0.375 },
    { atSec: 6.24, durSec: 0.984, note: 50, gain: 0.55 },
    { atSec: 6.24, durSec: 0.984, note: 74, gain: 0.375 },
  ],
}

// Strict canon at the twelfth in three, one bar apart, from E to a close on A: E G E D G F E A under B D B A D C.
const CANON_IN_THREE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.931, note: 52, gain: 0.55 },
    { atSec: 0.96, durSec: 0.466, note: 55, gain: 0.55 },
    { atSec: 1.44, durSec: 0.931, note: 52, gain: 0.55 },
    { atSec: 1.44, durSec: 0.931, note: 71, gain: 0.375 },
    { atSec: 2.4, durSec: 0.466, note: 50, gain: 0.55 },
    { atSec: 2.4, durSec: 0.466, note: 74, gain: 0.375 },
    { atSec: 2.88, durSec: 0.931, note: 55, gain: 0.55 },
    { atSec: 2.88, durSec: 0.931, note: 71, gain: 0.375 },
    { atSec: 3.84, durSec: 1.397, note: 53, gain: 0.55 },
    { atSec: 3.84, durSec: 0.466, note: 69, gain: 0.375 },
    { atSec: 4.32, durSec: 0.931, note: 74, gain: 0.375 },
    { atSec: 5.28, durSec: 0.466, note: 52, gain: 0.55 },
    { atSec: 5.28, durSec: 1.862, note: 72, gain: 0.375 },
    { atSec: 5.76, durSec: 1.397, note: 57, gain: 0.55 },
  ],
}

// The break: A3 up the pale throat notes, each weaker than the last, until the register opens on A4.
const OVER_THE_BREAK: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.795, note: 57, gain: 0.688 },
    { atSec: 0.82, durSec: 0.795, note: 59, gain: 0.6 },
    { atSec: 1.64, durSec: 0.795, note: 60, gain: 0.525 },
    { atSec: 2.46, durSec: 0.795, note: 62, gain: 0.463 },
    { atSec: 3.28, durSec: 0.795, note: 64, gain: 0.4 },
    { atSec: 4.1, durSec: 0.795, note: 65, gain: 0.35 },
    { atSec: 4.92, durSec: 0.795, note: 67, gain: 0.313 },
    { atSec: 5.74, durSec: 1.591, note: 69, gain: 0.65 },
  ],
}

// Five fingerings, each sounded low and then with the register key lifted: D, G, F, E, D and their twelfths.
const KEY_LIFTED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.222, note: 50, gain: 0.575 },
    { atSec: 0.7, durSec: 0.679, note: 69, gain: 0.4 },
    { atSec: 1.4, durSec: 1.222, note: 55, gain: 0.575 },
    { atSec: 2.1, durSec: 0.679, note: 74, gain: 0.4 },
    { atSec: 2.8, durSec: 1.222, note: 53, gain: 0.575 },
    { atSec: 3.5, durSec: 0.679, note: 72, gain: 0.4 },
    { atSec: 4.2, durSec: 1.222, note: 52, gain: 0.575 },
    { atSec: 4.9, durSec: 0.679, note: 71, gain: 0.4 },
    { atSec: 5.6, durSec: 1.494, note: 50, gain: 0.575 },
    { atSec: 6.3, durSec: 0.815, note: 69, gain: 0.4 },
  ],
}

// The canon at the twelfth over an A pedal: A C A C E A, answered E G E.
const CANON_ON_A_PEDAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.984, note: 45, gain: 0.375 },
    { atSec: 0, durSec: 1.552, note: 57, gain: 0.5 },
    { atSec: 1.6, durSec: 0.776, note: 60, gain: 0.5 },
    { atSec: 2.4, durSec: 0.776, note: 57, gain: 0.5 },
    { atSec: 3.2, durSec: 1.552, note: 60, gain: 0.5 },
    { atSec: 3.2, durSec: 1.552, note: 76, gain: 0.375 },
    { atSec: 4.8, durSec: 0.776, note: 64, gain: 0.5 },
    { atSec: 4.8, durSec: 0.776, note: 79, gain: 0.375 },
    { atSec: 5.6, durSec: 1.552, note: 57, gain: 0.5 },
    { atSec: 5.6, durSec: 1.552, note: 76, gain: 0.375 },
  ],
}

// Single low notes, long enough for a voice to bring out the third harmonic over each: A, C, D, A.
const FUNDAMENTALS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.746, note: 45, gain: 0.625 },
    { atSec: 1.8, durSec: 1.746, note: 48, gain: 0.625 },
    { atSec: 3.6, durSec: 1.746, note: 50, gain: 0.625 },
    { atSec: 5.4, durSec: 1.921, note: 45, gain: 0.625 },
  ],
}

// Twelfths stacked on twelfths, one hand shape moved: D A E, F C G, C G D, D A E.
const STACKED_TWELFTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.698, note: 38, gain: 0.45 },
    { atSec: 0, durSec: 1.698, note: 57, gain: 0.4 },
    { atSec: 0, durSec: 1.698, note: 76, gain: 0.325 },
    { atSec: 1.75, durSec: 1.698, note: 41, gain: 0.45 },
    { atSec: 1.75, durSec: 1.698, note: 60, gain: 0.4 },
    { atSec: 1.75, durSec: 1.698, note: 79, gain: 0.325 },
    { atSec: 3.5, durSec: 1.698, note: 36, gain: 0.45 },
    { atSec: 3.5, durSec: 1.698, note: 55, gain: 0.4 },
    { atSec: 3.5, durSec: 1.698, note: 74, gain: 0.325 },
    { atSec: 5.25, durSec: 2.037, note: 38, gain: 0.45 },
    { atSec: 5.25, durSec: 2.037, note: 57, gain: 0.4 },
    { atSec: 5.25, durSec: 2.037, note: 76, gain: 0.325 },
  ],
}

// The call alone in the dark low register: D E F, G, F E D.
const CALL_ALONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.067, note: 50, gain: 0.625 },
    { atSec: 1.1, durSec: 0.534, note: 52, gain: 0.625 },
    { atSec: 1.65, durSec: 1.601, note: 53, gain: 0.625 },
    { atSec: 3.3, durSec: 0.534, note: 55, gain: 0.625 },
    { atSec: 3.85, durSec: 1.067, note: 53, gain: 0.625 },
    { atSec: 4.95, durSec: 0.534, note: 52, gain: 0.625 },
    { atSec: 5.5, durSec: 1.601, note: 50, gain: 0.625 },
  ],
}

// The answer alone in the clear upper register: A B C, D, C B A.
const ANSWER_ALONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.067, note: 69, gain: 0.525 },
    { atSec: 1.1, durSec: 0.534, note: 71, gain: 0.525 },
    { atSec: 1.65, durSec: 1.601, note: 72, gain: 0.525 },
    { atSec: 3.3, durSec: 0.534, note: 74, gain: 0.525 },
    { atSec: 3.85, durSec: 1.067, note: 72, gain: 0.525 },
    { atSec: 4.95, durSec: 0.534, note: 71, gain: 0.525 },
    { atSec: 5.5, durSec: 1.601, note: 69, gain: 0.525 },
  ],
}

// One call that crosses the break: low D, its twelfth A with the same fingers, then down G E D.
const ONE_CALL_ACROSS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.358, note: 50, gain: 0.625 },
    { atSec: 1.4, durSec: 2.037, note: 69, gain: 0.55 },
    { atSec: 3.5, durSec: 0.679, note: 67, gain: 0.5 },
    { atSec: 4.2, durSec: 0.951, note: 64, gain: 0.475 },
    { atSec: 5.18, durSec: 1.765, note: 62, gain: 0.525 },
  ],
}

// The canon in halves an octave higher, for flutes: D E F D A F G E D under A B C A E C D.
const CANON_FOR_FLUTES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.757, note: 62, gain: 0.55 },
    { atSec: 0.78, durSec: 0.757, note: 64, gain: 0.55 },
    { atSec: 1.56, durSec: 0.757, note: 65, gain: 0.55 },
    { atSec: 1.56, durSec: 0.757, note: 81, gain: 0.425 },
    { atSec: 2.34, durSec: 0.757, note: 62, gain: 0.55 },
    { atSec: 2.34, durSec: 0.757, note: 83, gain: 0.425 },
    { atSec: 3.12, durSec: 0.757, note: 69, gain: 0.55 },
    { atSec: 3.12, durSec: 0.757, note: 84, gain: 0.425 },
    { atSec: 3.9, durSec: 0.757, note: 65, gain: 0.55 },
    { atSec: 3.9, durSec: 0.757, note: 81, gain: 0.425 },
    { atSec: 4.68, durSec: 0.757, note: 67, gain: 0.55 },
    { atSec: 4.68, durSec: 0.757, note: 88, gain: 0.425 },
    { atSec: 5.46, durSec: 0.757, note: 64, gain: 0.55 },
    { atSec: 5.46, durSec: 0.757, note: 84, gain: 0.425 },
    { atSec: 6.24, durSec: 0.984, note: 62, gain: 0.55 },
    { atSec: 6.24, durSec: 0.984, note: 86, gain: 0.425 },
  ],
}

// The crossing call for a flute: low D, its twelfth A, then down G E D.
const FLUTE_ACROSS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.358, note: 62, gain: 0.625 },
    { atSec: 1.4, durSec: 2.037, note: 81, gain: 0.525 },
    { atSec: 3.5, durSec: 0.679, note: 79, gain: 0.5 },
    { atSec: 4.2, durSec: 0.951, note: 76, gain: 0.5 },
    { atSec: 5.18, durSec: 1.765, note: 74, gain: 0.55 },
  ],
}

// The call up an octave and its answer, closing in tenths: for flutes and small pipes.
const SMALL_CALL_AND_ANSWER: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.164, note: 62, gain: 0.575 },
    { atSec: 1.2, durSec: 0.582, note: 64, gain: 0.575 },
    { atSec: 1.8, durSec: 2.91, note: 65, gain: 0.575 },
    { atSec: 3.6, durSec: 1.164, note: 81, gain: 0.425 },
    { atSec: 4.8, durSec: 0.582, note: 67, gain: 0.575 },
    { atSec: 4.8, durSec: 0.582, note: 83, gain: 0.425 },
    { atSec: 5.4, durSec: 1.746, note: 69, gain: 0.575 },
    { atSec: 5.4, durSec: 1.746, note: 84, gain: 0.425 },
  ],
}

// Strict canon at the twelfth one long note apart, for slow starts: D F E D under A C B A, a tenth, two sixths, a twelfth.
const SLOW_CANON: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.36, note: 50, gain: 0.55 },
    { atSec: 1.4, durSec: 1.36, note: 53, gain: 0.55 },
    { atSec: 1.4, durSec: 1.36, note: 69, gain: 0.4 },
    { atSec: 2.8, durSec: 1.36, note: 52, gain: 0.55 },
    { atSec: 2.8, durSec: 1.36, note: 72, gain: 0.4 },
    { atSec: 4.2, durSec: 1.36, note: 71, gain: 0.4 },
    { atSec: 4.2, durSec: 2.76, note: 50, gain: 0.55 },
    { atSec: 5.6, durSec: 1.36, note: 69, gain: 0.4 },
  ],
}

// The slow canon an octave higher, for flutes and small pipes.
const SMALL_SLOW_CANON: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.36, note: 62, gain: 0.55 },
    { atSec: 1.4, durSec: 1.36, note: 65, gain: 0.55 },
    { atSec: 1.4, durSec: 1.36, note: 81, gain: 0.4 },
    { atSec: 2.8, durSec: 1.36, note: 64, gain: 0.55 },
    { atSec: 2.8, durSec: 1.36, note: 84, gain: 0.4 },
    { atSec: 4.2, durSec: 1.36, note: 83, gain: 0.4 },
    { atSec: 4.2, durSec: 2.76, note: 62, gain: 0.55 },
    { atSec: 5.6, durSec: 1.36, note: 81, gain: 0.4 },
  ],
}

// The slow answer alone, for a tone that comes from nothing: A C B A.
const SLOW_ANSWER: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.7, note: 69, gain: 0.55 },
    { atSec: 1.75, durSec: 1.7, note: 72, gain: 0.55 },
    { atSec: 3.5, durSec: 1.7, note: 71, gain: 0.55 },
    { atSec: 5.25, durSec: 1.75, note: 69, gain: 0.55 },
  ],
}

// Both registers at once, held in twelfths: D A, F C, E B, D A, within the range of clarinets and horns.
const HELD_TWELFTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.7, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 1.7, note: 69, gain: 0.4 },
    { atSec: 1.75, durSec: 1.7, note: 53, gain: 0.5 },
    { atSec: 1.75, durSec: 1.7, note: 72, gain: 0.4 },
    { atSec: 3.5, durSec: 1.7, note: 52, gain: 0.5 },
    { atSec: 3.5, durSec: 1.7, note: 71, gain: 0.4 },
    { atSec: 5.25, durSec: 2, note: 50, gain: 0.5 },
    { atSec: 5.25, durSec: 2, note: 69, gain: 0.4 },
  ],
}

// The held twelfths an octave higher, for flutes.
const SMALL_HELD_TWELFTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.7, note: 62, gain: 0.5 },
    { atSec: 0, durSec: 1.7, note: 81, gain: 0.4 },
    { atSec: 1.75, durSec: 1.7, note: 65, gain: 0.5 },
    { atSec: 1.75, durSec: 1.7, note: 84, gain: 0.4 },
    { atSec: 3.5, durSec: 1.7, note: 64, gain: 0.5 },
    { atSec: 3.5, durSec: 1.7, note: 83, gain: 0.4 },
    { atSec: 5.25, durSec: 2, note: 62, gain: 0.5 },
    { atSec: 5.25, durSec: 2, note: 81, gain: 0.4 },
  ],
}

// The call alone from middle D, for flutes: D E F, G, F E D.
const SMALL_CALL_ALONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.067, note: 62, gain: 0.6 },
    { atSec: 1.1, durSec: 0.534, note: 64, gain: 0.6 },
    { atSec: 1.65, durSec: 1.601, note: 65, gain: 0.6 },
    { atSec: 3.3, durSec: 0.534, note: 67, gain: 0.6 },
    { atSec: 3.85, durSec: 1.067, note: 65, gain: 0.6 },
    { atSec: 4.95, durSec: 0.534, note: 64, gain: 0.6 },
    { atSec: 5.5, durSec: 1.601, note: 62, gain: 0.6 },
  ],
}

// The canon in three an octave higher, for flutes: E G E D G F E A under B D B A D C.
const SMALL_CANON_IN_THREE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.931, note: 64, gain: 0.55 },
    { atSec: 0.96, durSec: 0.466, note: 67, gain: 0.55 },
    { atSec: 1.44, durSec: 0.931, note: 64, gain: 0.55 },
    { atSec: 1.44, durSec: 0.931, note: 83, gain: 0.375 },
    { atSec: 2.4, durSec: 0.466, note: 62, gain: 0.55 },
    { atSec: 2.4, durSec: 0.466, note: 86, gain: 0.375 },
    { atSec: 2.88, durSec: 0.931, note: 67, gain: 0.55 },
    { atSec: 2.88, durSec: 0.931, note: 83, gain: 0.375 },
    { atSec: 3.84, durSec: 1.397, note: 65, gain: 0.55 },
    { atSec: 3.84, durSec: 0.466, note: 81, gain: 0.375 },
    { atSec: 4.32, durSec: 0.931, note: 86, gain: 0.375 },
    { atSec: 5.28, durSec: 0.466, note: 64, gain: 0.55 },
    { atSec: 5.28, durSec: 1.862, note: 84, gain: 0.375 },
    { atSec: 5.76, durSec: 1.397, note: 69, gain: 0.55 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'same-fingers-twelfth-up-thumb-hole-closed',
    name: 'Thumb hole closed',
    category: 'wind',
    description:
      'A breath on a stopped pipe with nearly all its brightness taken out, dulled again and set back in a dark hall.',
    preview: CALL_ALONE,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown pipe',
      params: {
        pressure: 0.28,
        bright: 0.12,
        air: 0.25,
        swell: 0.3,
        release: 0.7,
        wander: 0.15,
        volume: -3,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-thumb-hole-open',
    name: 'Thumb hole open',
    category: 'wind',
    description:
      'The blown pipe pressed harder and wide open in brightness, a copy a few cents to each side, on a bright plate.',
    preview: ANSWER_ALONE,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown pipe',
      params: {
        pressure: 0.68,
        bright: 0.92,
        air: 0.18,
        swell: 0.04,
        release: 0.5,
        wander: 0.1,
        volume: -4.5,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-bowed-bell-joint',
    name: 'Bowed bell joint',
    category: 'wind',
    description:
      'A bow drawn slowly on a stopped pipe, dark and late to speak, heard inside a second pipe, an open one.',
    preview: SLOW_CANON,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed pipe',
      params: {
        pressure: 0.42,
        bright: 0.14,
        swell: 0.5,
        release: 2.4,
        air: 0.1,
        wander: 0.2,
        volume: -4.5,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { size: 1.8, mix: 0.6 } },
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-bowed-upper-joint',
    name: 'Bowed upper joint',
    category: 'wind',
    description:
      'The bow pressed hard near the end of the pipe, bright at once, its held notes beginning to sway late.',
    preview: ANSWER_ALONE,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed pipe',
      params: {
        pressure: 0.82,
        position: 0.08,
        bright: 0.95,
        swell: 0.12,
        release: 0.4,
        air: 0.05,
        wander: 0.1,
        width: 0.3,
      },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-knuckle-on-the-tube',
    name: 'Knuckle on the tube',
    category: 'plucked',
    description:
      'A mallet on a stopped pipe, dark and ringing for seconds, with slow warm tape repeats under it.',
    preview: KEY_LIFTED,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck pipe',
      params: { bright: 0.1, decay: 5, air: 0.1, position: 0.5, release: 2.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { time: 700, mix: 0.3 } },
      { deviceId: 'analog-drive', preset: 'Low warmth' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-pads-falling-shut',
    name: 'Pads falling shut',
    category: 'plucked',
    description:
      'A short bright knock on the pipe near its end, scattered as a cluster of small echoes to both sides.',
    preview: KEY_LIFTED,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck pipe',
      params: { bright: 0.95, decay: 0.5, air: 0.6, position: 0.1, pressure: 0.7, release: 0.12 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Tight clusters', params: { mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { inputGain: 10, outputGain: -4 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-reed-snapped-low',
    name: 'Reed snapped low',
    category: 'plucked',
    description:
      'A pluck on a stopped pipe, dark, with a long decay, its tail dripping through one short dark spring.',
    preview: CALL_AND_ANSWER,
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked pipe',
      params: { bright: 0.18, decay: 9, air: 0.08, position: 0.5, release: 3, volume: -4 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.35 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-slap-tongue',
    name: 'Slap tongue',
    category: 'plucked',
    description: 'A bright short pluck on the pipe, skipping away in softer and duller bounces.',
    preview: CANON_IN_THREE,
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked pipe',
      params: {
        bright: 0.95,
        decay: 1,
        air: 0.5,
        position: 0.12,
        pressure: 0.85,
        release: 0.15,
        volume: -1.5,
      },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-wind-on-a-low-wire',
    name: 'Wind on a low wire',
    category: 'string',
    description:
      'Breath across a string, soft and dim, with a voice eleven scale steps above it, its twelfth, half a second behind.',
    preview: FUNDAMENTALS,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown string',
      params: {
        pressure: 0.25,
        bright: 0.15,
        air: 0.55,
        swell: 0.6,
        release: 0.8,
        wander: 0.4,
        volume: 0,
      },
    },
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Tuned double',
        params: {
          root: 2,
          scale: 4,
          snap: 0,
          mix: 50,
          v1Role: 1,
          v1Degrees: 11,
          v1Level: -3,
          v1Pan: 30,
          v1Delay: 500,
          v1Feedback: 0,
          v2Role: 0,
          v3Role: 0,
        },
      },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-middle-of-the-wire',
    name: 'Middle of the wire',
    category: 'string',
    description:
      'A string bowed at its middle, hollow as a closed tube, over a wide wash of strings tuned to D minor.',
    preview: SLOW_CANON,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: {
        position: 1,
        pressure: 0.6,
        bright: 0.7,
        swell: 0.45,
        release: 1.8,
        air: 0.02,
        volume: -14.5,
      },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor wash', params: { root: 2, mode: 1, mix: 0.6 } },
      { deviceId: 'spread', preset: 'Hazy edges' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-wire-plucked-hollow',
    name: 'Wire plucked hollow',
    category: 'plucked',
    description:
      'A string plucked at its middle, so hollow, dark and slow to die, its colours delayed from low to high.',
    preview: KEY_LIFTED,
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked string',
      params: { position: 1, bright: 0.2, decay: 14, pressure: 0.35, release: 4, volume: -1.5 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { mix: 0.3 } },
      { deviceId: 'tape', preset: 'Mastering deck' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-wire-struck-at-its-end',
    name: 'Wire struck at its end',
    category: 'plucked',
    description:
      'A mallet on a string right at its end, hard, thin and bright, pulsing through a harmonic tremolo.',
    preview: STACKED_TWELFTHS,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck string',
      params: {
        position: 0.04,
        bright: 0.95,
        decay: 3,
        pressure: 0.8,
        release: 1,
        air: 0.05,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer' },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-wood-under-the-keys',
    name: 'Wood under the keys',
    category: 'bell',
    description:
      'Soft wooden bars struck without any brightness, blurred a little and shut in a small dark box.',
    preview: CANON_IN_THREE,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck wood bar',
      params: { bright: 0.05, decay: 0.7, release: 0.4, pressure: 0.3, air: 0.05, volume: 3.5 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Dark box', params: { amount: 0.8 } },
      { deviceId: 'fog', preset: 'Short blur', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-silver-keywork',
    name: 'Silver keywork',
    category: 'bell',
    description:
      'Metal bars plucked bright with a long ring, a faint ring modulation on D through them, the tail kept thin.',
    preview: ANSWER_ALONE,
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked bar',
      params: { bright: 0.95, decay: 7, position: 0.1, release: 4, pressure: 0.5, volume: -3 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Faint halo', params: { root: 2 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-bar-blown-over',
    name: 'Bar blown over',
    category: 'wind',
    description:
      'Breath on a metal bar, dark and slow, four bands of it swelling and drifting on their own.',
    preview: SLOW_CANON,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown bar',
      params: { bright: 0.1, pressure: 0.35, swell: 0.7, release: 2.5, air: 0.5, wander: 0.4 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Slow water', params: { bands: 4 } },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-bowed-edge-of-a-bar',
    name: 'Bowed edge of a bar',
    category: 'bell',
    description:
      'A bow on a bar, very bright and six seconds in going, a comb of a twelve stage phaser through it.',
    preview: SLOW_CANON,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bar',
      params: { bright: 1, swell: 0.35, release: 6, decay: 15, pressure: 0.6, position: 0.15 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Twelve stage cloud', params: { mix: 0.35 } }],
  },
  {
    id: 'same-fingers-twelfth-up-jar-across-the-valley',
    name: 'Jar across the valley',
    category: 'wind',
    description: 'Breath on a bowl, more air than note, pushed far off into open air.',
    preview: CALL_AND_ANSWER,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown bowl',
      params: {
        air: 0.95,
        bright: 0.3,
        pressure: 0.2,
        swell: 0.5,
        release: 2,
        width: 0.4,
        volume: -13.5,
      },
    },
    effects: [
      { deviceId: 'distance', preset: 'Open air' },
      { deviceId: 'lift', preset: 'Long tails', params: { amount: 0.5 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-rim-and-its-twelfth',
    name: 'Rim and its twelfth',
    category: 'bell',
    description:
      'A bowl bowed softly, its two strongest partials redrawn as sines nineteen semitones up.',
    preview: FUNDAMENTALS,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bowl',
      params: { bright: 0.35, swell: 0.5, release: 4, pressure: 0.5, width: 0.7 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Fifth above',
        params: { transpose: 19, partials: 2, mix: 0.4 },
      },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-bowl-through-a-stop',
    name: 'Bowl through a stop',
    category: 'bell',
    description:
      'A struck bowl sent through organ stops, unison and twelfth only, both speaking a third of a second late.',
    preview: KEY_LIFTED,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck bowl',
      params: { bright: 0.4, decay: 8, release: 3, pressure: 0.3, volume: -0.5 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Open fifths',
        params: {
          sub: 0,
          fifth: 0,
          octave: 0,
          fifteenth: 0,
          unison: 0.7,
          twelfth: 0.8,
          speak: 320,
          mix: 0.9,
        },
      },
      { deviceId: 'tamer', preset: 'Gentle' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-pipe-answers-itself',
    name: 'Pipe answers itself',
    category: 'wind',
    description:
      'A breathy stopped pipe with its own shadow nineteen semitones above, seven tenths of a second behind.',
    preview: CALL_ALONE,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown pipe',
      params: {
        air: 0.8,
        bright: 0.4,
        pressure: 0.45,
        swell: 0.12,
        release: 0.4,
        wander: 0.35,
        volume: -3,
      },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Pad fifth',
        params: { pitchA: 19, levelB: 0, delay: 700, feedback: 0, mix: 0.45 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-twelfth-held-in-throat',
    name: 'Twelfth held in throat',
    category: 'voice',
    description:
      'A throat voice with only its third harmonic picked out and held still over each low note.',
    preview: FUNDAMENTALS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Still whistle',
      params: { overtone: 3, focus: 0.9, growl: 0, breath: 0.1, attack: 0.3, release: 1.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } }],
  },
  {
    id: 'same-fingers-twelfth-up-two-twelfths-of-whistle',
    name: 'Two twelfths of whistle',
    category: 'voice',
    description:
      'A throat whistling its ninth harmonic, a twelfth over the twelfth, doubled a few cents apart.',
    preview: FUNDAMENTALS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Still whistle',
      params: { overtone: 9, focus: 1, breath: 0.02, attack: 0.8, release: 3, vibrato: 0.35 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider' },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-chest-under-the-floor',
    name: 'Chest under the floor',
    category: 'voice',
    description:
      'A growled low voice on its third harmonic with the top shut off, through a driven, woolly stack.',
    preview: FUNDAMENTALS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Low growl',
      params: { overtone: 3, focus: 0.35, growl: 0.95, wander: 0, attack: 0.6, release: 1 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { highCut: 1600 } },
      { deviceId: 're-amp', preset: 'Dark and woolly' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-head-voice-opens',
    name: 'Head voice opens',
    category: 'voice',
    description:
      'Open throat vowels with the sixth harmonic wide and unfocused, in a hall that sings oo behind them.',
    preview: SLOW_CANON,
    instrument: {
      deviceId: 'overtone',
      preset: 'Open vowels',
      params: {
        overtone: 6,
        focus: 0.3,
        wander: 0.2,
        breath: 0.5,
        attack: 0.35,
        release: 1.5,
        vibrato: 0.3,
      },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.4 } }],
  },
  {
    id: 'same-fingers-twelfth-up-drone-of-a-stopped-tube',
    name: 'Drone of a stopped tube',
    category: 'drone',
    description:
      'A dull drone pipe on its third harmonic, hardly moving, narrow and darkened by a slow low pass.',
    preview: STACKED_TWELFTHS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Drone pipe',
      params: {
        overtone: 3,
        focus: 0.2,
        growl: 0.05,
        wander: 0,
        attack: 0.8,
        release: 3,
        width: 0.1,
        volume: -14.5,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { cutoffHz: 700 } },
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-second-register-pipe',
    name: 'Second register pipe',
    category: 'wind',
    description:
      'The pipe voice locked to its sixth harmonic, quick to speak, with a small plate after it.',
    preview: ANSWER_ALONE,
    instrument: {
      deviceId: 'overtone',
      preset: 'High whistle',
      params: { overtone: 6, focus: 0.95, wander: 0, breath: 0.15, attack: 0.04, release: 0.5 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } },
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-breath-before-the-key',
    name: 'Breath before the key',
    category: 'wind',
    description:
      'A pipe that is mostly breath, its third harmonic coming and going as the level slowly opens and closes.',
    preview: CALL_AND_ANSWER,
    instrument: {
      deviceId: 'overtone',
      preset: 'Breath pipe',
      params: { overtone: 3, breath: 1, focus: 0.4, wander: 0.1, attack: 0.25, release: 1 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Opening wide' },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-register-vent',
    name: 'Register vent',
    category: 'wind',
    description:
      'A pipe stepping quickly among its upper harmonics like a vent half open, echoed short and plain.',
    preview: CALL_ALONE,
    instrument: {
      deviceId: 'overtone',
      preset: 'High whistle',
      params: {
        overtone: 9,
        wander: 0.8,
        pace: 2.4,
        focus: 0.85,
        breath: 0.4,
        attack: 0.05,
        release: 0.8,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 280, mix: 0.3 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-chant-on-the-fifth',
    name: 'Chant on the fifth',
    category: 'voice',
    description:
      'A slow chant with its sixth harmonic half in focus, swelling in late, a resonance on a high E, the twelfth of A, held over it.',
    preview: CANON_ON_A_PEDAL,
    instrument: {
      deviceId: 'overtone',
      preset: 'Deep chant',
      params: { overtone: 6, focus: 0.5, growl: 0.3, wander: 0, attack: 0.5, release: 2.5 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'One held note',
        params: { root: 9, low: 12, high: 12, mix: 0.45 },
      },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-cane-drone',
    name: 'Cane drone',
    category: 'drone',
    description:
      'A reed voice on its third harmonic, thick with growl, played off a worn cassette.',
    preview: CANON_ON_A_PEDAL,
    instrument: {
      deviceId: 'overtone',
      preset: 'Reed drone',
      params: { overtone: 3, focus: 0.75, wander: 0, growl: 0.5, attack: 0.2, release: 1.2 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'stereo-detune', preset: 'Thickener' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-bare-reed-twelfth',
    name: 'Bare reed twelfth',
    category: 'wind',
    description:
      'A lean reed whistling only its third harmonic, quick and narrow, a limiter holding it level and a faint plate after it.',
    preview: CALL_AND_ANSWER,
    instrument: {
      deviceId: 'overtone',
      preset: 'Jaw harp',
      params: {
        overtone: 3,
        focus: 1,
        wander: 0,
        attack: 0.02,
        release: 0.25,
        width: 0.1,
        vibrato: 0.1,
        volume: -1,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Tucked under', params: { inputGain: 8, outputGain: -9 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-jaw-and-register',
    name: 'Jaw and register',
    category: 'wind',
    description:
      'A buzzing reed that starts at once, its mouth leaping among harmonics four times a second, bounced about by dotted tape.',
    preview: FUNDAMENTALS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Jaw harp',
      params: { overtone: 6, wander: 1, pace: 4, focus: 0.95, release: 0.8 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.35 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-cold-reed-harmonic',
    name: 'Cold reed harmonic',
    category: 'pad',
    description:
      'A reed on its twelfth harmonic alone, slow, with nothing of the mouth but the whistle, in a frosted tail.',
    preview: FUNDAMENTALS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Glass harmonic',
      params: { overtone: 12, attack: 0.6, release: 4, vibrato: 0, growl: 0, volume: -12.5 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.45 } }],
  },
  {
    id: 'same-fingers-twelfth-up-lips-on-the-mouthpiece',
    name: 'Lips on the mouthpiece',
    category: 'wind',
    description:
      'Buzzing lips on a wooden pipe, the third harmonic low and broad, close and driven through a triode.',
    preview: CALL_ALONE,
    instrument: {
      deviceId: 'overtone',
      preset: 'Lip buzz',
      params: { overtone: 3, growl: 0.7, focus: 0.5, attack: 0.08, release: 0.4, vibrato: 0.2 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-air-through-twelve-feet',
    name: 'Air through twelve feet',
    category: 'texture',
    description:
      'A pipe of pure air that whistles its sixth harmonic, under clouds that pass and dull it.',
    preview: SLOW_CANON,
    instrument: {
      deviceId: 'overtone',
      preset: 'Air whistle',
      params: { voice: 1, overtone: 6, attack: 0.35, release: 2.5, wander: 0, volume: -16 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Passing clouds' },
      { deviceId: 'lift', preset: 'Air on top', params: { amount: 0.6 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-pipe-and-slow-shade',
    name: 'Pipe and slow shade',
    category: 'pad',
    description:
      'Pipes swelling for most of a second, the third harmonic and its neighbours picked at by chance, shaded by six phaser stages.',
    preview: STACKED_TWELFTHS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Drone pipe',
      params: {
        overtone: 3,
        focus: 0.85,
        wander: 0.6,
        pace: 0.8,
        growl: 0,
        attack: 0.9,
        release: 4,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { mix: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-monk-of-the-low-tube',
    name: 'Monk of the low tube',
    category: 'voice',
    description:
      'A throat voice an octave lower than it is played, at half speed, on its third harmonic with a rattle beneath.',
    preview: CALL_AND_ANSWER,
    instrument: {
      deviceId: 'overtone',
      preset: 'Slow chant',
      params: { overtone: 3, wander: 0, growl: 0.4, attack: 0.4, release: 2, focus: 0.6 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { mix: 1 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-boy-at-the-clear-end',
    name: 'Boy at the clear end',
    category: 'voice',
    description:
      'A breathy throat voice on and around its sixth harmonic, the twelfth an octave up, swaying late, from the back of a hall.',
    preview: ANSWER_ALONE,
    instrument: {
      deviceId: 'overtone',
      preset: 'Still whistle',
      params: {
        overtone: 6,
        wander: 0.35,
        pace: 0.9,
        focus: 0.5,
        attack: 0.15,
        release: 1,
        breath: 0.3,
        vibrato: 0.5,
        width: 0.2,
      },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer' },
      { deviceId: 'distance', preset: 'Back of the hall' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-throat-through-a-horn',
    name: 'Throat through a horn',
    category: 'voice',
    description:
      'A quick throat voice, third harmonic sharp, spoken through a small horn loudspeaker with echoes that hop in pitch.',
    preview: CANON_IN_THREE,
    instrument: {
      deviceId: 'overtone',
      preset: 'Throat song',
      params: {
        overtone: 3,
        wander: 0,
        focus: 0.9,
        attack: 0.06,
        release: 0.5,
        growl: 0.3,
        volume: -15.5,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Station platform' },
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-whistle-in-the-rain',
    name: 'Whistle in the rain',
    category: 'texture',
    description: 'Wide throat whistles stepping quickly, with light rain tapping on them.',
    preview: CANON_IN_HALVES,
    instrument: {
      deviceId: 'overtone',
      preset: 'Quick steps',
      params: { overtone: 9, pace: 1.5, attack: 0.2, release: 1.8, breath: 0.35 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Light rain' },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-sub-and-twelfth',
    name: 'Sub and twelfth',
    category: 'organ',
    description:
      'The rank below and the twelfth drawn together over a plain flute, nothing between them, in a nave.',
    preview: CANON_IN_THREE,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { sub: 0.9, octave: 0, twelfth: 0.6, fifteenth: 0, reed: 0, breath: 0.1, tone: 3000 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.35 } }],
  },
  {
    id: 'same-fingers-twelfth-up-only-the-quint-speaks',
    name: 'Only the quint speaks',
    category: 'organ',
    description:
      'The twelfth rank at full over its flute, bright and quick, beating twice a second with a copy shifted two hertz up.',
    preview: ANSWER_ALONE,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { twelfth: 1, breath: 0.05, attack: 0.02, release: 0.15, tone: 9000, bellows: 0 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Moving beat', params: { mix: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-windchest-low',
    name: 'Windchest low',
    category: 'organ',
    description:
      'Deep flutes with all the upper ranks shut, the wind heavy and uneven, held by a slow fader in an empty room.',
    preview: FUNDAMENTALS,
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: {
        sub: 0.5,
        reed: 0.05,
        breath: 0.7,
        bellows: 0.9,
        attack: 0.3,
        release: 1.5,
        tone: 900,
      },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader' },
      { deviceId: 'noise-floor', preset: 'Empty room' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-reed-rank-shutters-open',
    name: 'Reed rank, shutters open',
    category: 'organ',
    description:
      'Free reeds with the twelfth on top, tone wide open, three long springs behind them.',
    preview: CALL_AND_ANSWER,
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: {
        reed: 0.8,
        twelfth: 0.7,
        octave: 0,
        sub: 0,
        celeste: 0.1,
        bellows: 0.2,
        tone: 11000,
        attack: 0.03,
        release: 0.6,
      },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.4 } },
      { deviceId: 'tamer', preset: 'Harsh sample' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-harmonium-in-the-wall',
    name: 'Harmonium in the wall',
    category: 'organ',
    description:
      'A harmonium heard from next door, its own low pass nearly shut, a faint hiss left under it.',
    preview: CANON_ON_A_PEDAL,
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { tone: 320, reed: 0.9, twelfth: 0.6, sub: 0.2, release: 0.6 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door' },
      { deviceId: 'noise-floor', preset: 'Faint hiss' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-stopped-flute-and-key',
    name: 'Stopped flute and key',
    category: 'organ',
    description:
      'One flute rank with air round it, an octave and a stronger twelfth added by slow drawbars after more than half a second.',
    preview: SLOW_CANON,
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: { breath: 0.6, bellows: 0.1, attack: 0.2, release: 0.6, tone: 2500, volume: -5 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Slow bloom',
        params: { sub: 0, fifth: 0, fifteenth: 0, octave: 0.3, twelfth: 0.7, speak: 600, mix: 0.7 },
      },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-celeste-under-not-over',
    name: 'Celeste under, not over',
    category: 'organ',
    description:
      'Two flute ranks beating, the octave below strong, the top cut at eight hundred hertz, sunk just under water.',
    preview: CANON_ON_A_PEDAL,
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { sub: 1, octave: 0, reed: 0, tone: 800, attack: 0.3, release: 2 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Just under' },
      { deviceId: 'ambient-limiter', preset: 'Margin' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-twelfth-in-slow-rotation',
    name: 'Twelfth in slow rotation',
    category: 'organ',
    description:
      'The twelfth and a little octave over a plain rank through a cabinet whose horn and drum turn slowly.',
    preview: STACKED_TWELFTHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { twelfth: 0.55, octave: 0.2, breath: 0, attack: 0.06, release: 0.5, tone: 5000 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-regals-on-the-table',
    name: 'Regals on the table',
    category: 'organ',
    description:
      'A nasal reed with a fast shake in the wind, thin and forward, echoed once on tape.',
    preview: CANON_IN_THREE,
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { twelfth: 0.3, tremulant: 0.7, tone: 3800, attack: 0.05, release: 0.25, sub: 0 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-drone-box-on-the-bench',
    name: 'Drone box on the bench',
    category: 'drone',
    description:
      'A drone box pumped by hand, sub rank and reeds, a low string pad growing an octave beneath it.',
    preview: FUNDAMENTALS,
    instrument: {
      deviceId: 'organ',
      preset: 'Shruti box',
      params: { sub: 0.8, reed: 0.8, attack: 0.4, release: 2, tone: 1300 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Low section', params: { mix: 0.45 } }],
  },
  {
    id: 'same-fingers-twelfth-up-full-tube-all-odd',
    name: 'Full tube, all odd',
    category: 'organ',
    description:
      'The twelfth at full and the pipes half turned to reeds, every octave rank shut, in one narrow fuzzy haze.',
    preview: STACKED_TWELFTHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: {
        sub: 0,
        octave: 0,
        twelfth: 1,
        fifteenth: 0,
        reed: 0.6,
        celeste: 0,
        attack: 0.2,
        release: 2,
        tone: 4500,
      },
    },
    effects: [{ deviceId: 'haze', preset: 'Narrow beam', params: { mix: 0.45 } }],
  },
  {
    id: 'same-fingers-twelfth-up-beating-at-the-break',
    name: 'Beating at the break',
    category: 'organ',
    description:
      'Nothing but the flute and the sharp celeste beside it, dark, in a soft even throb, in an open valley.',
    preview: OVER_THE_BREAK,
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { attack: 0.15, release: 0.8, tone: 1400, breath: 0.3 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Soft throb', params: { rate: 3.3 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-far-pipes-lifted',
    name: 'Far pipes lifted',
    category: 'organ',
    description:
      'Distant pipes with the twelfth forward, swelling over most of a second, their tail climbing in fifths.',
    preview: SLOW_CANON,
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { sub: 0.1, octave: 0.1, twelfth: 0.7, attack: 0.7, release: 3, tone: 2600 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Rising fifths', params: { mix: 0.4 } }],
  },
  {
    id: 'same-fingers-twelfth-up-pump-before-the-note',
    name: 'Pump before the note',
    category: 'organ',
    description:
      'A pump organ with more wind than tone, its attacks blurred away, then put on a worn dictation tape.',
    preview: CALL_AND_ANSWER,
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { breath: 1, reed: 0.4, twelfth: 0.6, octave: 0, attack: 0.35, tone: 1700 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack' },
      { deviceId: 'tape', preset: 'Old dictation', params: { mix: 0.8 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-fifteenth-over-twelfth',
    name: 'Fifteenth over twelfth',
    category: 'organ',
    description:
      'Twelfth and fifteenth ranks loud over the plain flute, throwing faint sparks a twelfth higher to the sides.',
    preview: ANSWER_ALONE,
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: {
        sub: 0,
        octave: 0,
        twelfth: 0.8,
        fifteenth: 0.9,
        reed: 0.1,
        attack: 0.25,
        release: 2.5,
        tone: 8000,
        celeste: 0.1,
      },
    },
    effects: [
      { deviceId: 'glints', preset: 'Faint dust', params: { pitch: 1, mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-tremulant-at-the-vent',
    name: 'Tremulant at the vent',
    category: 'organ',
    description:
      'A flute with the tremulant deep and the twelfth faint, swept all through by a slow flange.',
    preview: ONE_CALL_ACROSS,
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { tremulant: 1, twelfth: 0.35, breath: 0.5, attack: 0.15, release: 1.2, volume: -2 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-two-keys-on-the-bench',
    name: 'Two keys on the bench',
    category: 'organ',
    description:
      'Harmonium reeds with a shadow nineteen semitones over each note, a fifth of a second late.',
    preview: CALL_ALONE,
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: {
        twelfth: 0,
        fifteenth: 0,
        octave: 0,
        sub: 0.4,
        reed: 0.55,
        celeste: 0.5,
        attack: 0.08,
        release: 0.5,
        tone: 2000,
      },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Pad fifth',
        params: { pitchA: 19, levelB: 0, delay: 200, mix: 0.4 },
      },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-subtone-question',
    name: 'Subtone question',
    category: 'wind',
    description:
      'A clarinet blown so low that air covers the tone, in a bore a third of the way to a cone, at the far side of a room.',
    preview: CALL_ALONE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { bore: 0.35, blow: 0.2, breath: 0.5, attack: 0.2, release: 0.6, vibrato: 0 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Across the room' },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-bare-answer-from-nothing',
    name: 'Bare answer from nothing',
    category: 'wind',
    description:
      'A clarinet with almost no air, fading in over more than a second and left long in a bright clear tail.',
    preview: SLOW_ANSWER,
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { volume: -2, blow: 0.45, breath: 0.15, attack: 1.2, release: 2 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Shining tail', params: { mix: 0.35 } }],
  },
  {
    id: 'same-fingers-twelfth-up-chalumeau-by-lamplight',
    name: 'Chalumeau by lamplight',
    category: 'wind',
    description:
      'A pure cylinder bore at its softest, a hum more than a reed, kept on a dull cassette with a dark plate.',
    preview: CALL_AND_ANSWER,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { blow: 0.1, breath: 0.05, attack: 0.12, release: 0.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-clarino-over-the-hill',
    name: 'Clarino over the hill',
    category: 'wind',
    description:
      'A clarinet blown wide open and bright, tongued at once, a single late wall of reverb coming back.',
    preview: ANSWER_ALONE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: { blow: 1, breath: 0.05, vibrato: 0.1, attack: 0.02, release: 0.3, volume: 3.5 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Late wall', params: { mix: 0.35 } }],
  },
  {
    id: 'same-fingers-twelfth-up-throat-note-haze',
    name: 'Throat note haze',
    category: 'wind',
    description:
      'The pale middle of the clarinet, blown soft: its tone turned down, its air turned up and scattered wide, one late room.',
    preview: OVER_THE_BREAK,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { blow: 0.18, breath: 0.9, attack: 0.1, release: 0.5, volume: 6 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Wide air', params: { tones: -8 } },
      { deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-vent-key-flutter',
    name: 'Vent key flutter',
    category: 'wind',
    description:
      'A fast flutter in the breath that rasps each note, chirping on in one slack spring.',
    preview: ONE_CALL_ACROSS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { blow: 0.6, growl: 0.6, breath: 0.3, attack: 0.08, release: 0.4, volume: 2.5 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Single slack coil', params: { mix: 0.35 } }],
  },
  {
    id: 'same-fingers-twelfth-up-two-bores-one-twelfth',
    name: 'Two bores, one twelfth',
    category: 'wind',
    description:
      'A hollow reed with a second one drawn nineteen semitones up beside it at once, both loosely doubled by a chorus.',
    preview: CALL_ALONE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { blow: 0.4, breath: 0.1, attack: 0.15, release: 0.8, volume: 0 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Pad fifth',
        params: { pitchA: 19, levelB: 0, detune: 6, mix: 0.45 },
      },
      { deviceId: 'chorus', preset: 'Loose double', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-section-at-the-barn-door',
    name: 'Section at the barn door',
    category: 'wind',
    description: 'One hollow reed turned into a flock of six that wheel slowly, a little way out.',
    preview: CANON_IN_HALVES,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { blow: 0.75, breath: 0.35, attack: 0.3, release: 1.4, volume: -0.5 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Slow drift', params: { birds: 6, mix: 0.5 } }],
  },
  {
    id: 'same-fingers-twelfth-up-low-joint-cork-warm',
    name: 'Low joint, cork warm',
    category: 'wind',
    description:
      'A soft bass reed nearly a cone, its octave below added, swaying slowly through an old valve.',
    preview: CALL_ALONE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { bore: 0.75, blow: 0.15, breath: 0.1, attack: 0.3, release: 2 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'patina', preset: 'Valve bloom' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-conical-stranger',
    name: 'Conical stranger',
    category: 'wind',
    description:
      'A full cone with every harmonic in it, where the cylinder has the odd ones, bright, a round vowel pressed on it.',
    preview: ONE_CALL_ACROSS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { blow: 0.5, breath: 0.1, attack: 0.1, release: 0.6, vibrato: 0.35, volume: -1 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-duduk-learns-the-key',
    name: 'Duduk learns the key',
    category: 'wind',
    description:
      'A duduk sort of reed with deep vibrato, its line rung on by strings tuned to D minor.',
    preview: CANON_IN_THREE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { vibrato: 0.8, blow: 0.25, attack: 0.3, release: 1 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor wash', params: { root: 2, mode: 1, mix: 0.45 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-reed-and-its-whisper',
    name: 'Reed and its whisper',
    category: 'texture',
    description:
      'Nothing but air in a cylinder with a trace of reed, coming and going like wind at a gap.',
    preview: OVER_THE_BREAK,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { blow: 0.02, breath: 1, attack: 0.4, release: 1.5 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Whistling gap', params: { mix: 0.8 } },
      { deviceId: 'lift', preset: 'Low breath' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-slow-mouth-long-fade',
    name: 'Slow mouth, long fade',
    category: 'wind',
    description:
      'A reed in a half-flared bore that speaks fast and takes four seconds to go, its tail sagging and dimming like wax.',
    preview: KEY_LIFTED,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Slow fade reed',
      params: { bore: 0.4, blow: 0.9, breath: 0.05, release: 4, volume: 1.5 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Candle wax', params: { mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Hollow' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-register-key-at-dusk',
    name: 'Register key at dusk',
    category: 'wind',
    description:
      'A soft clarinet whose line comes back from memory, sometimes backwards, over dim plain echoes.',
    preview: CALL_AND_ANSWER,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Ballad alto',
      params: {
        bore: 0,
        vibrato: 0.15,
        blow: 0.35,
        breath: 0.35,
        attack: 0.18,
        release: 0.5,
        volume: -1,
      },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Hazy past', params: { mix: 0.45 } }],
  },
  {
    id: 'same-fingers-twelfth-up-wireless-clarinet',
    name: 'Wireless clarinet',
    category: 'wind',
    description:
      'A bright reed heard through a sideband receiver that fades a little, then set in a cluster of very short tape echoes.',
    preview: CANON_IN_THREE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: { blow: 0.8, vibrato: 0.4, breath: 0.05, attack: 0.06, release: 0.4 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Clear sideband',
        params: { fading: 0.4, bandwidth: 0.6, speaker: 0.6 },
      },
      { deviceId: 'tape-echo', preset: 'Tiny room cluster', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-wide-tube-whole-breath',
    name: 'Wide tube, whole breath',
    category: 'pad',
    description:
      'A cone swelling for most of a second into held twelfths, wide open, each band of it drifting by itself in a cathedral.',
    preview: HELD_TWELFTHS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Tenor swell',
      params: { attack: 0.9, release: 4, blow: 0.6, vibrato: 0.2 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-covered-low-d',
    name: 'Covered low D',
    category: 'wind',
    description:
      'A low flute at its gentlest, more breath than edge, its attacks turned to a soft cloud.',
    preview: SMALL_CALL_ALONE,
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { breath: 0.8, blow: 0.1, attack: 0.3, release: 1.2, chiff: 0 },
    },
    effects: [{ deviceId: 'fog', preset: 'Soft cloud', params: { mix: 0.7 } }],
  },
  {
    id: 'same-fingers-twelfth-up-overblown-without-trying',
    name: 'Overblown without trying',
    category: 'wind',
    description:
      'A straight concert tone blown hard and dry of breath, with faint air round it and no vibrato at all.',
    preview: ANSWER_ALONE,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { blow: 1, breath: 0.02, attack: 0.06, release: 0.3 },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Faint air' },
      { deviceId: 'saturator', preset: 'Parallel shine' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-stopped-panpipe-low-row',
    name: 'Stopped panpipe, low row',
    category: 'wind',
    description:
      'Stopped panpipes with their chiff taken off, dulled by a low pass that moves once in many seconds.',
    preview: SMALL_SLOW_CANON,
    instrument: {
      deviceId: 'flute',
      preset: 'Hollow pipes pad',
      params: { attack: 0.35, release: 1, breath: 0.3, blow: 0.5, chiff: 0.05 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { cutoffHz: 1300 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-stopped-panpipe-top-row',
    name: 'Stopped panpipe, top row',
    category: 'wind',
    description:
      'Stopped panpipes with a hard chiff on every note, each thrown out again in even skips.',
    preview: CANON_FOR_FLUTES,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { chiff: 1, blow: 0.9, breath: 0.25, attack: 0.005, release: 0.15 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Even steps', params: { mix: 0.3 } },
      { deviceId: 'spread', preset: 'Air only' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-wooden-lip-plate',
    name: 'Wooden lip plate',
    category: 'wind',
    description:
      'A wood flute with a hard breathy start, heard mostly through a small wooden body, with a hint of spring.',
    preview: SMALL_CALL_AND_ANSWER,
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: {
        scoop: 10,
        vibrato: 0,
        breath: 0.5,
        blow: 0.85,
        chiff: 1,
        attack: 0.02,
        release: 0.3,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.85, size: 0.7 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-canyon-a-twelfth-deep',
    name: 'Canyon a twelfth deep',
    category: 'wind',
    description:
      'A wood flute answered by a shadow nineteen semitones up, nearly a second behind, far across stone.',
    preview: SMALL_CALL_ALONE,
    instrument: { deviceId: 'flute', preset: 'Canyon flute', params: { release: 1.2, scoop: 30 } },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Pad fifth',
        params: { pitchA: 19, levelB: 0, delay: 900, tone: 5000, mix: 0.35 },
      },
      { deviceId: 'distance', preset: 'Stone stairwell' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-grass-pipe-at-the-ford',
    name: 'Grass pipe at the ford',
    category: 'wind',
    description: 'A breathy bamboo flute bent far up into each note, wavering under shallow water.',
    preview: FLUTE_ACROSS,
    instrument: {
      deviceId: 'flute',
      preset: 'Bent from below',
      params: { scoop: 160, attack: 0.1, blow: 0.4, release: 0.8 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Sunlit shallows', params: { mix: 0.8 } }],
  },
  {
    id: 'same-fingers-twelfth-up-bamboo-above-the-cloud',
    name: 'Bamboo above the cloud',
    category: 'wind',
    description:
      'A bamboo flute with its vibrato wide open, slow to start, an octave halo of spring grains above.',
    preview: SMALL_CALL_AND_ANSWER,
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: { attack: 0.3, release: 1.5, blow: 0.6, breath: 0.1 },
    },
    effects: [
      { deviceId: 'spectral-drifter', preset: 'Octave halo' },
      { deviceId: 'ambient-eq', preset: 'Bright' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-alto-at-the-foot-joint',
    name: 'Alto at the foot joint',
    category: 'wind',
    description:
      'An alto flute blown hard with a hard start, a little widened, its repeats falling to dark on a clocked delay.',
    preview: OVER_THE_BREAK,
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { vibrato: 0.2, chiff: 0.9, breath: 0.2, release: 0.4, scoop: 0 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.35, time: 420 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-recorder-with-one-hole',
    name: 'Recorder with one hole',
    category: 'wind',
    description:
      'A soft recorder tone with nearly no breath, short and even, in a tight swarm of short echoes.',
    preview: SMALL_CANON_IN_THREE,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { blow: 0.4, attack: 0.04, release: 0.2, chiff: 0.6 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { mix: 0.6 } }],
  },
  {
    id: 'same-fingers-twelfth-up-breath-across-the-bottle',
    name: 'Breath across the bottle',
    category: 'texture',
    description:
      'Breath across a low flute with its note almost gone, blown over the mouth of a bottle.',
    preview: SMALL_HELD_TWELFTHS,
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { volume: -10, attack: 0.5, release: 1.8, breath: 1, blow: 0.05 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Blown bottle', params: { mix: 0.7 } },
      { deviceId: 'reveal', preset: 'Breath' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-choir-of-one-embouchure',
    name: 'Choir of one embouchure',
    category: 'pad',
    description:
      'A wood flute swelling for most of a second, thickened by a chorus of three moving copies in a hall.',
    preview: SMALL_HELD_TWELFTHS,
    instrument: {
      deviceId: 'flute',
      preset: 'Slow wood swell',
      params: { volume: -4.5, attack: 0.8, release: 3.5, breath: 0.2, blow: 0.3 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-harmonic-fingering',
    name: 'Harmonic fingering',
    category: 'wind',
    description:
      'A concert flute blown soft and straight, its strongest partial drawn again a twelfth up as one sine.',
    preview: SMALL_CALL_ALONE,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { blow: 0.15, breath: 0.35, attack: 0.15, release: 0.7 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'One sine',
        params: { transpose: 19, mix: 0.45, attack: 150 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-shut-key-open-hill',
    name: 'Shut key, open hill',
    category: 'wind',
    description:
      'A hard-blown flute with deep vibrato going round the head on a slow circle, mostly in the room.',
    preview: FLUTE_ACROSS,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { blow: 0.75, vibrato: 1, attack: 0.04, release: 0.5, breath: 0.35 },
    },
    effects: [
      { deviceId: 'around', preset: 'Mostly room' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-whisper-tones',
    name: 'Whisper tones',
    category: 'texture',
    description:
      'Panpipes with no note left but the edge of one, each faded in by a swell, faint points of echo after it.',
    preview: SMALL_HELD_TWELFTHS,
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { attack: 0.2, release: 1.2 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow bow' },
      { deviceId: 'constellation', preset: 'Faint points', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-flute-on-the-far-reel',
    name: 'Flute on the far reel',
    category: 'wind',
    description:
      'A soft wind lead on a worn record, warped slowly, its crackle turned low, a faint tape echo after it.',
    preview: SMALL_CALL_AND_ANSWER,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft wind lead',
      params: { scoop: 0, vibrato: 0.25, breath: 0.2, blow: 0.45 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Dull stylus', params: { crackle: 0.1 } },
      { deviceId: 'tape-echo', preset: 'Faint trace' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-string-overblows',
    name: 'String overblows',
    category: 'string',
    description:
      'A plucked string that feeds back on its third harmonic, so each low note turns into its own twelfth.',
    preview: FUNDAMENTALS,
    instrument: {
      deviceId: 'feedback',
      preset: 'Pure twelfth',
      params: { gain: 0.85, bloom: 0.3, pick: 0.8, release: 1, damp: 0.2 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Clean and bright' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-amp-keeps-its-low-d',
    name: 'Amp keeps its low D',
    category: 'string',
    description:
      'A dark string held on its own note and not its overtone, plucked hard into a dark fuzz, with a long dim echo trail.',
    preview: CALL_AND_ANSWER,
    instrument: {
      deviceId: 'feedback',
      preset: 'Dark sustain',
      params: { gain: 0.6, grit: 0.6, bloom: 0.05, pick: 0.9, release: 3, damp: 0.7, volume: -14 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz' },
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-third-partial-from-hum',
    name: 'Third partial from hum',
    category: 'drone',
    description:
      'No pluck at all: the third harmonic swells in from the hum, bright and wide, into a held pad.',
    preview: STACKED_TWELFTHS,
    instrument: {
      deviceId: 'feedback',
      preset: 'Out of the hum',
      params: { distance: 3, gain: 0.9, bloom: 0.7, damp: 0.1, grit: 0.05, width: 1, release: 3 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.4 } }],
  },
  {
    id: 'same-fingers-twelfth-up-edge-tone-torn-reed',
    name: 'Edge tone, torn reed',
    category: 'string',
    description:
      'Hard feedback on the twelfth, buzzing like a split reed, dulled by a low pass and a short fuzzy room.',
    preview: CALL_ALONE,
    instrument: {
      deviceId: 'feedback',
      preset: 'Reed tone',
      params: { distance: 3, grit: 0.9, bloom: 0.05, release: 0.4, pick: 0.4 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 1400, envAmount: 30 },
      },
      { deviceId: 'haze', preset: 'Small room fuzz', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-reeds-on-a-sagging-strip',
    name: 'Reeds on a sagging strip',
    category: 'wind',
    description:
      'Clarinet and oboe on tape at half speed, an octave down and dark, old and unsteady.',
    preview: CALL_AND_ANSWER,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Low reeds',
      params: {
        age: 0.75,
        tone: -0.4,
        attack: 0.15,
        release: 0.8,
        vibrato: 0.1,
        hiss: 0.4,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-reeds-clean-strip',
    name: 'Reeds, clean strip',
    category: 'wind',
    description:
      'The reed tape new and open at full speed, one player and no vibrato, in a thin glinting swarm of echoes.',
    preview: ANSWER_ALONE,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: {
        age: 0,
        hiss: 0,
        tone: 1,
        players: 0,
        vibrato: 0,
        attack: 0.01,
        release: 0.9,
        spread: 0,
      },
    },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Glinting', params: { mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-flutes-past-the-break',
    name: 'Flutes past the break',
    category: 'wind',
    description:
      'Flute tapes that run out after two and a half seconds, played back in front of their own reversed echo.',
    preview: CANON_FOR_FLUTES,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: { length: 2.5, age: 0.5, tone: 0.3, release: 0.5, players: 0.2 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Faint reflection', params: { mix: 0.35 } }],
  },
  {
    id: 'same-fingers-twelfth-up-horns-a-tube-longer',
    name: 'Horns a tube longer',
    category: 'wind',
    description:
      'Horn tapes swelling over half a second, the players well apart, a tail shaped by a low vowel, all of it doubled wide.',
    preview: HELD_TWELFTHS,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: { speed: 0, attack: 0.5, release: 2.5, players: 1, tone: -0.2, volume: -5 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.4 } },
      { deviceId: 'stereo-detune', preset: 'Classic' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-odd-partials-no-arrival',
    name: 'Odd partials, no arrival',
    category: 'pad',
    description:
      'Still octaves with the odd overtones turned full up, like a stack of stopped tubes, not moving at all.',
    preview: STACKED_TWELFTHS,
    instrument: {
      deviceId: 'staircase',
      preset: 'Still organ',
      params: { shape: 1, centre: 260, span: 3, attack: 0.25, release: 2, chorus: 0.05 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } }],
  },
  {
    id: 'same-fingers-twelfth-up-keys-climb-the-canon',
    name: 'Keys climb the canon',
    category: 'texture',
    description:
      'Held notes walking up through each other without end, thin and high, jumping step by step.',
    preview: CANON_ON_A_PEDAL,
    instrument: {
      deviceId: 'staircase',
      preset: 'Narrow beam',
      params: {
        centre: 1500,
        speed: 0.55,
        shape: 0.35,
        span: 4,
        slide: 0,
        attack: 0.02,
        release: 1,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.3 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'same-fingers-twelfth-up-tube-lets-down-slowly',
    name: 'Tube lets down slowly',
    category: 'pad',
    description:
      'A pad of nearly pure octaves gliding down without end, deep and slow, in a room that hangs after it.',
    preview: SLOW_CANON,
    instrument: {
      deviceId: 'staircase',
      preset: 'Low tide',
      params: { speed: -0.35, centre: 200, span: 5, attack: 0.6, release: 4, shape: 0.1 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.4 } }],
  },
]
