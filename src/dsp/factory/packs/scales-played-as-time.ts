import { type FactoryPreset, type Phrase } from '../types'

// A white-key mode and a twelve-pulse rhythm are one object: each note lasts as many pulses as
// the step it takes, so a whole step is two and a half step one. The long notes lie low and soft,
// the short ones high and bright. Laid out over nine struck and plucked voices by how long they
// ring, how hard they are struck and how even or uneven the thing after them moves.

// Dorian from D in its own rhythm, 2 1 2 2 2 1 2, the half steps an octave up; then with E and G left out.
const DORIAN_HANDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.48, note: 50, gain: 0.56 },
    { atSec: 0.48, durSec: 0.24, note: 64, gain: 0.72 },
    { atSec: 0.72, durSec: 0.48, note: 53, gain: 0.56 },
    { atSec: 1.2, durSec: 0.48, note: 55, gain: 0.56 },
    { atSec: 1.68, durSec: 0.48, note: 57, gain: 0.56 },
    { atSec: 2.16, durSec: 0.24, note: 71, gain: 0.72 },
    { atSec: 2.4, durSec: 0.48, note: 60, gain: 0.56 },
    { atSec: 2.88, durSec: 0.72, note: 62, gain: 0.56 },
    { atSec: 3.6, durSec: 0.96, note: 53, gain: 0.56 },
    { atSec: 4.56, durSec: 0.48, note: 57, gain: 0.56 },
    { atSec: 5.04, durSec: 0.24, note: 71, gain: 0.72 },
    { atSec: 5.28, durSec: 0.48, note: 60, gain: 0.56 },
    { atSec: 5.76, durSec: 1.512, note: 50, gain: 0.54 },
    { atSec: 5.76, durSec: 1.512, note: 57, gain: 0.54 },
  ],
}

// Lydian from F, 2 2 2 1 2 2 1, quick: without its second, without its sixth, then the whole bar backward.
const LYDIAN_QUICK: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.6, note: 53, gain: 0.56 },
    { atSec: 0.6, durSec: 0.3, note: 57, gain: 0.56 },
    { atSec: 0.9, durSec: 0.15, note: 71, gain: 0.72 },
    { atSec: 1.05, durSec: 0.3, note: 60, gain: 0.56 },
    { atSec: 1.35, durSec: 0.3, note: 62, gain: 0.56 },
    { atSec: 1.65, durSec: 0.15, note: 64, gain: 0.72 },
    { atSec: 1.8, durSec: 0.3, note: 65, gain: 0.56 },
    { atSec: 2.1, durSec: 0.3, note: 55, gain: 0.56 },
    { atSec: 2.4, durSec: 0.3, note: 57, gain: 0.56 },
    { atSec: 2.7, durSec: 0.15, note: 71, gain: 0.72 },
    { atSec: 2.85, durSec: 0.6, note: 60, gain: 0.56 },
    { atSec: 3.45, durSec: 0.15, note: 64, gain: 0.72 },
    { atSec: 3.6, durSec: 0.15, note: 64, gain: 0.72 },
    { atSec: 3.75, durSec: 0.3, note: 62, gain: 0.56 },
    { atSec: 4.05, durSec: 0.3, note: 60, gain: 0.56 },
    { atSec: 4.35, durSec: 0.15, note: 71, gain: 0.72 },
    { atSec: 4.5, durSec: 0.3, note: 57, gain: 0.56 },
    { atSec: 4.8, durSec: 0.3, note: 55, gain: 0.56 },
    { atSec: 5.1, durSec: 0.3, note: 53, gain: 0.56 },
    { atSec: 5.4, durSec: 1.35, note: 53, gain: 0.54 },
    { atSec: 5.4, durSec: 1.35, note: 60, gain: 0.54 },
  ],
}

// Mixolydian on G read backward, 2 1 2 2 1 2 2, over its open fifth; then with C and the low G left out.
const MIXOLYDIAN_BACK: Phrase = {
  notes: [
    { atSec: 0, durSec: 3, note: 43, gain: 0.44 },
    { atSec: 0, durSec: 3, note: 50, gain: 0.44 },
    { atSec: 0, durSec: 0.5, note: 65, gain: 0.56 },
    { atSec: 0.5, durSec: 0.25, note: 76, gain: 0.72 },
    { atSec: 0.75, durSec: 0.5, note: 62, gain: 0.56 },
    { atSec: 1.25, durSec: 0.5, note: 60, gain: 0.56 },
    { atSec: 1.75, durSec: 0.25, note: 71, gain: 0.72 },
    { atSec: 2, durSec: 0.5, note: 57, gain: 0.56 },
    { atSec: 2.5, durSec: 0.5, note: 55, gain: 0.56 },
    { atSec: 3, durSec: 3, note: 43, gain: 0.44 },
    { atSec: 3, durSec: 3, note: 50, gain: 0.44 },
    { atSec: 3, durSec: 0.5, note: 65, gain: 0.56 },
    { atSec: 3.5, durSec: 0.25, note: 76, gain: 0.72 },
    { atSec: 3.75, durSec: 1, note: 62, gain: 0.56 },
    { atSec: 4.75, durSec: 0.25, note: 71, gain: 0.72 },
    { atSec: 5, durSec: 1, note: 57, gain: 0.56 },
    { atSec: 6, durSec: 1.375, note: 43, gain: 0.44 },
    { atSec: 6, durSec: 1.375, note: 50, gain: 0.44 },
    { atSec: 6, durSec: 1.375, note: 59, gain: 0.44 },
    { atSec: 6, durSec: 1.375, note: 67, gain: 0.44 },
  ],
}

// F Lydian in shells: root, fifth and seventh on each whole step, a bare high note on each half step, D left out.
const LYDIAN_SHELLS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.8, note: 53, gain: 0.44 },
    { atSec: 0, durSec: 0.8, note: 60, gain: 0.44 },
    { atSec: 0, durSec: 0.8, note: 64, gain: 0.44 },
    { atSec: 0.8, durSec: 0.8, note: 55, gain: 0.44 },
    { atSec: 0.8, durSec: 0.8, note: 62, gain: 0.44 },
    { atSec: 0.8, durSec: 0.8, note: 65, gain: 0.44 },
    { atSec: 1.6, durSec: 0.8, note: 57, gain: 0.44 },
    { atSec: 1.6, durSec: 0.8, note: 64, gain: 0.44 },
    { atSec: 1.6, durSec: 0.8, note: 67, gain: 0.44 },
    { atSec: 2.4, durSec: 0.4, note: 71, gain: 0.72 },
    { atSec: 2.8, durSec: 1.6, note: 60, gain: 0.44 },
    { atSec: 2.8, durSec: 1.6, note: 67, gain: 0.44 },
    { atSec: 2.8, durSec: 1.6, note: 71, gain: 0.44 },
    { atSec: 4.4, durSec: 0.4, note: 76, gain: 0.72 },
    { atSec: 4.8, durSec: 2.2, note: 53, gain: 0.44 },
    { atSec: 4.8, durSec: 2.2, note: 60, gain: 0.44 },
    { atSec: 4.8, durSec: 2.2, note: 69, gain: 0.44 },
    { atSec: 4.8, durSec: 2.2, note: 76, gain: 0.44 },
  ],
}

// Two bars of D Dorian over one slow climb of F Lydian: the bass counts each step double.
const DORIAN_OVER_LYDIAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1, note: 41, gain: 0.56 },
    { atSec: 1, durSec: 1, note: 43, gain: 0.56 },
    { atSec: 2, durSec: 1, note: 45, gain: 0.56 },
    { atSec: 3, durSec: 0.5, note: 47, gain: 0.56 },
    { atSec: 3.5, durSec: 1, note: 48, gain: 0.56 },
    { atSec: 4.5, durSec: 1, note: 50, gain: 0.56 },
    { atSec: 5.5, durSec: 0.5, note: 52, gain: 0.56 },
    { atSec: 0, durSec: 0.5, note: 62, gain: 0.56 },
    { atSec: 0.5, durSec: 0.25, note: 76, gain: 0.72 },
    { atSec: 0.75, durSec: 1, note: 65, gain: 0.56 },
    { atSec: 1.75, durSec: 0.5, note: 69, gain: 0.56 },
    { atSec: 2.25, durSec: 0.25, note: 83, gain: 0.72 },
    { atSec: 2.5, durSec: 0.5, note: 72, gain: 0.56 },
    { atSec: 3, durSec: 0.75, note: 74, gain: 0.56 },
    { atSec: 3.75, durSec: 0.5, note: 65, gain: 0.56 },
    { atSec: 4.25, durSec: 0.5, note: 67, gain: 0.56 },
    { atSec: 4.75, durSec: 0.5, note: 69, gain: 0.56 },
    { atSec: 5.25, durSec: 0.25, note: 83, gain: 0.72 },
    { atSec: 5.5, durSec: 0.5, note: 72, gain: 0.56 },
    { atSec: 6, durSec: 1.375, note: 41, gain: 0.44 },
    { atSec: 6, durSec: 1.375, note: 57, gain: 0.44 },
    { atSec: 6, durSec: 1.375, note: 62, gain: 0.44 },
    { atSec: 6, durSec: 1.375, note: 69, gain: 0.44 },
  ],
}

// Dorian up and Dorian upside down from one D: both have the rhythm 2 1 2 2 2 1 2, so they strike together.
const DORIAN_WEDGE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.84, note: 62, gain: 0.56 },
    { atSec: 0.84, durSec: 0.42, note: 60, gain: 0.72 },
    { atSec: 0.84, durSec: 0.42, note: 64, gain: 0.72 },
    { atSec: 1.26, durSec: 0.84, note: 59, gain: 0.54 },
    { atSec: 1.26, durSec: 0.84, note: 65, gain: 0.54 },
    { atSec: 2.1, durSec: 0.84, note: 57, gain: 0.54 },
    { atSec: 2.1, durSec: 0.84, note: 67, gain: 0.54 },
    { atSec: 2.94, durSec: 0.84, note: 55, gain: 0.54 },
    { atSec: 2.94, durSec: 0.84, note: 69, gain: 0.54 },
    { atSec: 3.78, durSec: 0.42, note: 53, gain: 0.72 },
    { atSec: 3.78, durSec: 0.42, note: 71, gain: 0.72 },
    { atSec: 4.2, durSec: 0.84, note: 52, gain: 0.54 },
    { atSec: 4.2, durSec: 0.84, note: 72, gain: 0.54 },
    { atSec: 5.04, durSec: 2.1, note: 50, gain: 0.54 },
    { atSec: 5.04, durSec: 2.1, note: 74, gain: 0.54 },
  ],
}

// The five notes C D E G A with their own spacing, 2 2 3 2 3, forward and backward; the threes lie low.
const FIVE_OF_TWELVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 3, note: 60, gain: 0.44 },
    { atSec: 0, durSec: 0.5, note: 72, gain: 0.58 },
    { atSec: 0.5, durSec: 0.5, note: 74, gain: 0.58 },
    { atSec: 1, durSec: 0.75, note: 64, gain: 0.46 },
    { atSec: 1.75, durSec: 0.5, note: 79, gain: 0.58 },
    { atSec: 2.25, durSec: 0.75, note: 69, gain: 0.46 },
    { atSec: 3, durSec: 3, note: 55, gain: 0.44 },
    { atSec: 3, durSec: 0.75, note: 69, gain: 0.46 },
    { atSec: 3.75, durSec: 0.5, note: 79, gain: 0.58 },
    { atSec: 4.25, durSec: 0.75, note: 64, gain: 0.46 },
    { atSec: 5, durSec: 0.5, note: 74, gain: 0.58 },
    { atSec: 5.5, durSec: 0.5, note: 72, gain: 0.58 },
    { atSec: 6, durSec: 1.375, note: 60, gain: 0.4 },
    { atSec: 6, durSec: 1.375, note: 67, gain: 0.4 },
    { atSec: 6, durSec: 1.375, note: 76, gain: 0.4 },
  ],
}

// Ionian on C is the twelve-pulse bell, 2 2 1 2 2 2 1: as written, thinned to five notes, and backward.
const IONIAN_BELL: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.32, note: 60, gain: 0.56 },
    { atSec: 0.32, durSec: 0.32, note: 62, gain: 0.56 },
    { atSec: 0.64, durSec: 0.16, note: 76, gain: 0.72 },
    { atSec: 0.8, durSec: 0.32, note: 65, gain: 0.56 },
    { atSec: 1.12, durSec: 0.32, note: 67, gain: 0.56 },
    { atSec: 1.44, durSec: 0.32, note: 69, gain: 0.56 },
    { atSec: 1.76, durSec: 0.16, note: 83, gain: 0.72 },
    { atSec: 1.92, durSec: 0.64, note: 72, gain: 0.56 },
    { atSec: 2.56, durSec: 0.16, note: 76, gain: 0.72 },
    { atSec: 2.72, durSec: 0.64, note: 65, gain: 0.56 },
    { atSec: 3.36, durSec: 0.32, note: 69, gain: 0.56 },
    { atSec: 3.68, durSec: 0.16, note: 83, gain: 0.72 },
    { atSec: 3.84, durSec: 0.16, note: 83, gain: 0.72 },
    { atSec: 4, durSec: 0.32, note: 69, gain: 0.56 },
    { atSec: 4.32, durSec: 0.32, note: 67, gain: 0.56 },
    { atSec: 4.64, durSec: 0.32, note: 65, gain: 0.56 },
    { atSec: 4.96, durSec: 0.16, note: 76, gain: 0.72 },
    { atSec: 5.12, durSec: 0.32, note: 62, gain: 0.56 },
    { atSec: 5.44, durSec: 0.32, note: 60, gain: 0.56 },
    { atSec: 5.76, durSec: 1.28, note: 60, gain: 0.44 },
    { atSec: 5.76, durSec: 1.28, note: 67, gain: 0.44 },
    { atSec: 5.76, durSec: 1.28, note: 76, gain: 0.44 },
  ],
}

// Aeolian on A at the slow speed, 2 1 2 2 1 2 2, with D left out: the half steps high, F and G coming up to A from below.
const AEOLIAN_SLOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.4, note: 57, gain: 0.44 },
    { atSec: 0, durSec: 0.9, note: 69, gain: 0.56 },
    { atSec: 0.9, durSec: 0.45, note: 83, gain: 0.72 },
    { atSec: 1.35, durSec: 1.8, note: 72, gain: 0.56 },
    { atSec: 3.15, durSec: 0.45, note: 88, gain: 0.72 },
    { atSec: 3.6, durSec: 0.9, note: 65, gain: 0.56 },
    { atSec: 4.5, durSec: 0.9, note: 67, gain: 0.56 },
    { atSec: 5.4, durSec: 1.8, note: 57, gain: 0.44 },
    { atSec: 5.4, durSec: 1.8, note: 64, gain: 0.44 },
    { atSec: 5.4, durSec: 1.8, note: 69, gain: 0.44 },
  ],
}

// Phrygian on E, 1 2 2 2 1 2 2 with A left out, over the even whole-tone six, 2 2 2 2 2 2, tapped on one low E.
const PHRYGIAN_OVER_SIX: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.8, note: 52, gain: 0.42 },
    { atSec: 0.8, durSec: 0.8, note: 52, gain: 0.42 },
    { atSec: 1.6, durSec: 0.8, note: 52, gain: 0.42 },
    { atSec: 2.4, durSec: 0.8, note: 52, gain: 0.42 },
    { atSec: 3.2, durSec: 0.8, note: 52, gain: 0.42 },
    { atSec: 4, durSec: 0.8, note: 52, gain: 0.42 },
    { atSec: 0, durSec: 0.4, note: 76, gain: 0.72 },
    { atSec: 0.4, durSec: 0.8, note: 65, gain: 0.56 },
    { atSec: 1.2, durSec: 1.6, note: 67, gain: 0.56 },
    { atSec: 2.8, durSec: 0.4, note: 83, gain: 0.72 },
    { atSec: 3.2, durSec: 0.8, note: 72, gain: 0.56 },
    { atSec: 4, durSec: 0.8, note: 74, gain: 0.56 },
    { atSec: 4.8, durSec: 2.2, note: 64, gain: 0.44 },
    { atSec: 4.8, durSec: 2.2, note: 71, gain: 0.44 },
    { atSec: 4.8, durSec: 2.2, note: 76, gain: 0.44 },
  ],
}

// A bass, one note at a time: F Lydian at half speed, the half steps B and E taken high.
const LYDIAN_LOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.936, note: 29, gain: 0.6 },
    { atSec: 0.96, durSec: 0.936, note: 31, gain: 0.6 },
    { atSec: 1.92, durSec: 0.936, note: 33, gain: 0.6 },
    { atSec: 2.88, durSec: 0.456, note: 47, gain: 0.66 },
    { atSec: 3.36, durSec: 0.936, note: 36, gain: 0.6 },
    { atSec: 4.32, durSec: 0.936, note: 38, gain: 0.6 },
    { atSec: 5.28, durSec: 0.456, note: 52, gain: 0.66 },
    { atSec: 5.76, durSec: 1.44, note: 29, gain: 0.6 },
  ],
}

// A bass: Aeolian falling from A, each note as long as the step beneath it, 2 2 1 2 2 1 2; then without G and D.
const AEOLIAN_SINKING: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.475, note: 45, gain: 0.6 },
    { atSec: 0.5, durSec: 0.475, note: 43, gain: 0.6 },
    { atSec: 1, durSec: 0.225, note: 53, gain: 0.66 },
    { atSec: 1.25, durSec: 0.475, note: 40, gain: 0.6 },
    { atSec: 1.75, durSec: 0.475, note: 38, gain: 0.6 },
    { atSec: 2.25, durSec: 0.225, note: 48, gain: 0.66 },
    { atSec: 2.5, durSec: 0.475, note: 35, gain: 0.6 },
    { atSec: 3, durSec: 0.975, note: 33, gain: 0.6 },
    { atSec: 4, durSec: 0.225, note: 53, gain: 0.66 },
    { atSec: 4.25, durSec: 0.975, note: 40, gain: 0.6 },
    { atSec: 5.25, durSec: 0.225, note: 48, gain: 0.66 },
    { atSec: 5.5, durSec: 0.475, note: 35, gain: 0.6 },
    { atSec: 6, durSec: 1.25, note: 33, gain: 0.6 },
  ],
}

// Locrian with no pitch: 1 2 2 1 2 2 2 on the rim, the half steps struck harder, one soft sub a bar. Two of the
// seven are left out of the second bar, and the third breaks off after its fifth stroke.
const RIM_LOCRIAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.1, note: 61, gain: 0.5 },
    { atSec: 0, durSec: 0.1, note: 64, gain: 0.75 },
    { atSec: 0.2, durSec: 0.1, note: 64, gain: 0.5 },
    { atSec: 0.6, durSec: 0.1, note: 64, gain: 0.5 },
    { atSec: 1, durSec: 0.1, note: 64, gain: 0.75 },
    { atSec: 1.2, durSec: 0.1, note: 64, gain: 0.5 },
    { atSec: 1.6, durSec: 0.1, note: 64, gain: 0.5 },
    { atSec: 2, durSec: 0.1, note: 64, gain: 0.5 },
    { atSec: 2.4, durSec: 0.1, note: 61, gain: 0.4 },
    { atSec: 2.4, durSec: 0.1, note: 64, gain: 0.75 },
    { atSec: 2.6, durSec: 0.1, note: 64, gain: 0.5 },
    { atSec: 3.4, durSec: 0.1, note: 64, gain: 0.75 },
    { atSec: 3.6, durSec: 0.1, note: 64, gain: 0.5 },
    { atSec: 4.4, durSec: 0.1, note: 64, gain: 0.5 },
    { atSec: 4.8, durSec: 0.1, note: 64, gain: 0.75 },
    { atSec: 4.8, durSec: 0.1, note: 61, gain: 0.45 },
    { atSec: 5, durSec: 0.1, note: 64, gain: 0.5 },
    { atSec: 5.4, durSec: 0.1, note: 64, gain: 0.5 },
    { atSec: 5.8, durSec: 0.1, note: 64, gain: 0.75 },
    { atSec: 6, durSec: 0.1, note: 64, gain: 0.5 },
  ],
}

// Ionian as a bell on the tick, Lydian at half speed on the drums, and the even whole-tone six on the shaker.
const KIT_STACK: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.11, note: 66, gain: 0.35 },
    { atSec: 0, durSec: 0.11, note: 70, gain: 0.42 },
    { atSec: 0, durSec: 0.11, note: 60, gain: 0.7 },
    { atSec: 0.44, durSec: 0.11, note: 66, gain: 0.35 },
    { atSec: 0.44, durSec: 0.11, note: 70, gain: 0.42 },
    { atSec: 0.88, durSec: 0.11, note: 66, gain: 0.35 },
    { atSec: 0.88, durSec: 0.11, note: 70, gain: 0.6 },
    { atSec: 0.88, durSec: 0.11, note: 69, gain: 0.5 },
    { atSec: 1.1, durSec: 0.11, note: 70, gain: 0.42 },
    { atSec: 1.32, durSec: 0.11, note: 66, gain: 0.35 },
    { atSec: 1.54, durSec: 0.11, note: 70, gain: 0.42 },
    { atSec: 1.76, durSec: 0.11, note: 66, gain: 0.35 },
    { atSec: 1.76, durSec: 0.11, note: 60, gain: 0.55 },
    { atSec: 1.98, durSec: 0.11, note: 70, gain: 0.42 },
    { atSec: 2.2, durSec: 0.11, note: 66, gain: 0.35 },
    { atSec: 2.42, durSec: 0.11, note: 70, gain: 0.6 },
    { atSec: 2.64, durSec: 0.11, note: 66, gain: 0.35 },
    { atSec: 2.64, durSec: 0.11, note: 70, gain: 0.42 },
    { atSec: 2.64, durSec: 0.11, note: 71, gain: 0.55 },
    { atSec: 3.08, durSec: 0.11, note: 66, gain: 0.35 },
    { atSec: 3.08, durSec: 0.11, note: 70, gain: 0.42 },
    { atSec: 3.08, durSec: 0.11, note: 60, gain: 0.65 },
    { atSec: 3.52, durSec: 0.11, note: 66, gain: 0.35 },
    { atSec: 3.52, durSec: 0.11, note: 70, gain: 0.6 },
    { atSec: 3.74, durSec: 0.11, note: 70, gain: 0.42 },
    { atSec: 3.96, durSec: 0.11, note: 66, gain: 0.35 },
    { atSec: 3.96, durSec: 0.11, note: 69, gain: 0.5 },
    { atSec: 4.18, durSec: 0.11, note: 70, gain: 0.42 },
    { atSec: 4.4, durSec: 0.11, note: 66, gain: 0.35 },
    { atSec: 4.62, durSec: 0.11, note: 70, gain: 0.42 },
    { atSec: 4.84, durSec: 0.11, note: 66, gain: 0.35 },
    { atSec: 4.84, durSec: 0.11, note: 71, gain: 0.55 },
    { atSec: 5.06, durSec: 0.11, note: 70, gain: 0.6 },
    { atSec: 5.28, durSec: 0.11, note: 60, gain: 0.7 },
    { atSec: 5.28, durSec: 0.11, note: 63, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Handpan: hand to knuckle, short to very long.
  {
    id: 'scales-played-as-time-wide-tread',
    name: 'Wide tread',
    category: 'bell',
    preview: DORIAN_HANDS,
    description:
      'A low pan with a deep cavity whose filter opens at each strike and closes as the note goes on.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Low ding',
      params: { volume: -3, decay: 7, touch: 0.2, cavity: 1 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 260, envAmount: 45, envAttackMs: 4, envReleaseMs: 420, resonance: 0.8 },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'scales-played-as-time-narrow-tread',
    name: 'Narrow tread',
    category: 'bell',
    preview: LYDIAN_QUICK,
    description:
      'Short damped taps near the rim of the pan, thinned of low end and left in a tight long spring.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Rain taps',
      params: { volume: -3.5, decay: 0.8, touch: 0.75, position: 0.95 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin' },
      { deviceId: 'spring-reverb', preset: 'Tight long tank', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'scales-played-as-time-seven-of-twelve-halo',
    name: 'Seven of twelve halo',
    category: 'bell',
    preview: DORIAN_HANDS,
    description:
      'A long sympathetic pan gated in twelve steps with seven open, Lydian in one ear and Dorian in the other.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Halo',
      params: { volume: -4, decay: 9, touch: 0.1, sympathy: 1 },
    },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Slow drift',
        params: {
          rate: 4.17,
          steps: 12,
          fill: 7,
          drift: 0,
          shift: 9,
          floor: 0.3,
          edge: 0.35,
          shade: 0.6,
        },
      },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'scales-played-as-time-tongue-answers-late',
    name: 'Tongue answers late',
    category: 'bell',
    preview: LYDIAN_QUICK,
    description:
      'A tongue drum with a dull tape echo three tenths of a second behind it, two pulses of a quick bar.',
    instrument: { deviceId: 'handpan', preset: 'Tongue drum', params: { decay: 3, touch: 0.3 } },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Single slap',
        params: { time: 300, feedback: 0.25, highCut: 2400, mix: 0.4 },
      },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
  },
  {
    id: 'scales-played-as-time-knuckles-on-the-rail',
    name: 'Knuckles on the rail',
    category: 'bell',
    preview: DORIAN_HANDS,
    description:
      'Knuckle strikes played through a combo amplifier with the microphone pulled back into the room.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Knuckles',
      params: { volume: -1.5, touch: 1, decay: 1.8, shimmer: 0.2 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { distance: 0.55, room: 0.6 } },
    ],
  },
  {
    id: 'scales-played-as-time-clay-step',
    name: 'Clay step',
    category: 'drum',
    preview: LYDIAN_QUICK,
    description: 'A short slit drum sounded inside a clay pot, its air thudding under each note.',
    instrument: { deviceId: 'handpan', preset: 'Slit drum', params: { decay: 0.6 } },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.75 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'scales-played-as-time-undivided-steel',
    name: 'Undivided steel',
    category: 'bell',
    preview: DORIAN_HANDS,
    description:
      'A pure tongue left to ring ten seconds in a late hall, with sines an octave up growing in behind it.',
    instrument: { deviceId: 'handpan', preset: 'Pure tongue', params: { decay: 10 } },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.45 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'scales-played-as-time-stair-under-the-lake',
    name: 'Stair under the lake',
    category: 'bell',
    preview: DORIAN_HANDS,
    description:
      'A tank drum sunk half under water, muffled and wavering, with a few bubbles off each strike.',
    instrument: { deviceId: 'handpan', preset: 'Tank drum', params: { decay: 5, damp: 0.1 } },
    effects: [{ deviceId: 'underwater', preset: 'Half in', params: { depth: 0.7, bubbles: 0.25 } }],
  },
  {
    id: 'scales-played-as-time-rim-of-the-mode',
    name: 'Rim of the mode',
    category: 'bell',
    preview: LYDIAN_QUICK,
    description:
      'Edge overtones of the pan under a slow six-stage phase sweep, high and nearly without body.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Edge overtones',
      params: { volume: -1, decay: 2.5, cavity: 0 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'scales-played-as-time-strings-below-the-pan',
    name: 'Strings below the pan',
    category: 'bell',
    preview: DORIAN_HANDS,
    description:
      'The centre of the pan, soft and plain, with strings tuned to D minor ringing after it.',
    instrument: { deviceId: 'handpan', preset: 'Centre tone', params: { volume: 0.5, decay: 2 } },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { root: 2, mix: 0.55, decay: 6 },
      },
    ],
  },
  {
    id: 'scales-played-as-time-scale-from-the-top',
    name: 'Scale from the top',
    category: 'bell',
    preview: LYDIAN_QUICK,
    description:
      'Muted palm notes over a reversed copy of themselves, so the climb is met by its own descent.',
    instrument: { deviceId: 'handpan', preset: 'Palm mute', params: { decay: 1.4, touch: 0.35 } },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 900, feedback: 0.2, mix: 0.5 },
      },
    ],
  },
  {
    id: 'scales-played-as-time-slow-steel-climb',
    name: 'Slow steel climb',
    category: 'bell',
    preview: DORIAN_HANDS,
    description:
      'A long shimmering pan beating against a copy shifted two hertz, in a dark space half a minute long.',
    instrument: { deviceId: 'handpan', preset: 'Slow shimmer', params: { touch: 0.4 } },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Moving beat', params: { mix: 0.45 } },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'scales-played-as-time-round-of-the-steps',
    name: 'Round of the steps',
    category: 'bell',
    preview: LYDIAN_QUICK,
    description:
      'Clean steel with no cavity, answered by itself 1.8 seconds later and once more after that, each answer quieter.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Clean steel',
      params: { volume: 1, decay: 1.2, touch: 0.6 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Round of three',
        params: { followers: 2, gap: 1.8, fade: 0.4, mix: 0.45 },
      },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },

  // Acoustic guitar: thumb to pick, muted to ringing.
  {
    id: 'scales-played-as-time-thumb-keeps-the-long',
    name: 'Thumb keeps the long',
    category: 'plucked',
    preview: MIXOLYDIAN_BACK,
    description:
      'Dark nylon under the thumb, its plucks held down fast and set in a small dull room.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { volume: -1.5, nail: 0, tone: 0.3, body: 1 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25, damping: 2500 } },
    ],
  },
  {
    id: 'scales-played-as-time-nail-takes-the-short',
    name: 'Nail takes the short',
    category: 'plucked',
    preview: MIXOLYDIAN_BACK,
    description: 'Nylon plucked hard by the bridge with a nail, bright, doubled wide and limited.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: { volume: 0.5, sustain: 3, release: 0.8 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled' },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 26, outputGain: -7.6 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'scales-played-as-time-twelve-for-twelve',
    name: 'Twelve for twelve',
    category: 'plucked',
    preview: LYDIAN_SHELLS,
    description:
      'Twelve strings gated over twelve pulses, seven of them open, so a held chord is the Lydian bell.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { volume: -2.5, sustain: 12, release: 4 },
    },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Soft throb',
        params: {
          rate: 5,
          steps: 12,
          fill: 7,
          floor: 0.25,
          length: 0.85,
          edge: 0.5,
          shade: 0.5,
          apart: 0,
          shift: 0,
        },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'scales-played-as-time-all-left-ringing',
    name: 'All left ringing',
    category: 'plucked',
    preview: DORIAN_WEDGE,
    description: 'Steel strings never damped, their tail a swarm of short echoes in a dark cavern.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { volume: -3, tone: 0.4 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.4 } }],
  },
  {
    id: 'scales-played-as-time-palm-on-the-bar-line',
    name: 'Palm on the bar line',
    category: 'plucked',
    preview: MIXOLYDIAN_BACK,
    description:
      'Palm-muted steel, each note a short knock, with three dulling echoes after it and the peaks held down.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: { volume: -8, sustain: 1.2, nail: 0.15, release: 0.25 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Soft pebble',
        params: { first: 250, skips: 3, mix: 0.4 },
      },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 34, outputGain: -8.6 } },
    ],
  },
  {
    id: 'scales-played-as-time-bridge-ladder',
    name: 'Bridge ladder',
    category: 'plucked',
    preview: DORIAN_WEDGE,
    description:
      'Steel plucked against the bridge, glassy, with a soft choir of rising octaves in its tail.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bridge harp',
      params: { volume: -5, body: 0.2 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Fifths', params: { interval: 0, mix: 0.35, decay: 5 } },
    ],
  },
  {
    id: 'scales-played-as-time-lazy-shells',
    name: 'Lazy shells',
    category: 'plucked',
    preview: LYDIAN_SHELLS,
    description: 'Three-note chords strummed as slowly as the strum goes, on worn cassette.',
    instrument: { deviceId: 'acoustic-guitar', preset: 'Lazy strum', params: { volume: -2 } },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.05 } },
      { deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'scales-played-as-time-pinched-half-step',
    name: 'Pinched half step',
    category: 'plucked',
    preview: MIXOLYDIAN_BACK,
    description:
      'Nylon pizzicato let ring a moment, its body made smaller while the notes stay, levelled hard, in a chamber.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon pizzicato',
      params: { volume: 5.5, sustain: 1, release: 0.4 },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller', params: { size: -0.6 } },
      {
        deviceId: 'fet-limiter',
        preset: 'Tucked under',
        params: { inputGain: 30, outputGain: -8.5 },
      },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'scales-played-as-time-drifting-courses',
    name: 'Drifting courses',
    category: 'plucked',
    preview: DORIAN_WEDGE,
    description:
      'A twelve-string tuned loosely and left to ring, turning slowly in a wide rotary cabinet.',
    instrument: { deviceId: 'acoustic-guitar', preset: 'Twelve drift', params: { volume: -4.5 } },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.8 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'scales-played-as-time-bottom-of-the-octave',
    name: 'Bottom of the octave',
    category: 'plucked',
    preview: MIXOLYDIAN_BACK,
    description:
      'The darkest wood, plucked over the fingerboard, with a sub octave added underneath.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: { volume: -3.5, sustain: 5, release: 2 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.35, up1: 0 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'scales-played-as-time-glass-plectrum-bars',
    name: 'Glass plectrum bars',
    category: 'plucked',
    preview: LYDIAN_SHELLS,
    description:
      'A hard bright pick on long strings, its partials split and unfolded from low to high.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Glass pick',
      params: { volume: -6, tone: 0.85 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { time: 500, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'scales-played-as-time-both-ways-from-d',
    name: 'Both ways from D',
    category: 'plucked',
    preview: DORIAN_WEDGE,
    description:
      'A long soft nylon with every attack blurred into a small cloud and no reverb after it.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: { volume: -4, strum: 0 },
    },
    effects: [{ deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.75 } }],
  },

  // Tine piano: dark and slow, bell and quick, and what moves in the amplifier.
  {
    id: 'scales-played-as-time-lydian-cellar-keys',
    name: 'Lydian cellar keys',
    category: 'keys',
    preview: DORIAN_OVER_LYDIAN,
    description:
      'Felt-dark tines with almost no bell, warmed by tape and set at the back of a dark hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { volume: -14.5, release: 0.4 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'scales-played-as-time-half-steps-in-bell',
    name: 'Half steps in bell',
    category: 'keys',
    preview: DORIAN_OVER_LYDIAN,
    description:
      'Bright bell tines, struck hard and soon gone, with rare long sparks two octaves above.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { decay: 0.6, hardness: 1 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Slow stars', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'scales-played-as-time-barked-landing',
    name: 'Barked landing',
    category: 'keys',
    preview: LYDIAN_SHELLS,
    description:
      'Tines that bark when struck, pushed through a console channel into a narrow warm spring.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { volume: -15.5, release: 0.3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console' },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'scales-played-as-time-pan-over-two-bars',
    name: 'Pan over two bars',
    category: 'keys',
    preview: DORIAN_WEDGE,
    description:
      'Bell-like tines crossing and coming back once in eight seconds, the hall half singing a vowel, the top lifted.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glacial pan',
      params: { volume: -13, bell: 0.9, bark: 0.1, hardness: 0.95 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Faint voices', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Bright' },
    ],
  },
  {
    id: 'scales-played-as-time-mixolydian-tremor',
    name: 'Mixolydian tremor',
    category: 'keys',
    preview: LYDIAN_SHELLS,
    description:
      'Long tines gated in twelve steps: the left side pulses in Lydian, the right in Mixolydian.',
    instrument: { deviceId: 'tine-piano', preset: 'Long sustain', params: { tremolo: 0 } },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Canon of three',
        params: { rate: 5, steps: 12, fill: 7, shift: 2, drift: 0, floor: 0.35, shade: 0.7 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'scales-played-as-time-glass-on-the-half-step',
    name: 'Glass on the half step',
    category: 'keys',
    preview: DORIAN_OVER_LYDIAN,
    description:
      'Glassy tines with no bark that die quickly, under a thin wide chorus and a small plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glass bells',
      params: { decay: 0.4, release: 0.6 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'scales-played-as-time-keys-on-a-short-stair',
    name: 'Keys on a short stair',
    category: 'keys',
    preview: DORIAN_OVER_LYDIAN,
    description:
      'Stopped tines in the rhythm of a half-second analog echo, two pulses of a slow-walking bar.',
    instrument: { deviceId: 'tine-piano', preset: 'Short tines', params: { volume: -7 } },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 500, feedback: 0.45, tone: 3000, mix: 0.4 },
      },
    ],
  },
  {
    id: 'scales-played-as-time-dampers-up-at-noon',
    name: 'Dampers up at noon',
    category: 'keys',
    preview: DORIAN_WEDGE,
    description:
      'Tines with the dampers off, every note hanging, their quiet overtones brought forward in a long thin space.',
    instrument: { deviceId: 'tine-piano', preset: 'Dampers off', params: { volume: -14 } },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones' },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'scales-played-as-time-sagging-tread',
    name: 'Sagging tread',
    category: 'keys',
    preview: LYDIAN_SHELLS,
    description:
      'Dull bell-less tines, slow to fade, that sag in pitch and darken the longer they are held.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Underwater keys',
      params: { decay: 2.5, release: 0.8 },
    },
    effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.5 } }],
  },
  {
    id: 'scales-played-as-time-throb-in-sixes',
    name: 'Throb in sixes',
    category: 'keys',
    preview: LYDIAN_SHELLS,
    description:
      'Dark tines throbbing evenly, the resting pulse of six whole steps, through a warm speaker stack.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Deep throb',
      params: { volume: -16.5, tremoloRate: 1.25 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Warm stack', params: { room: 0.3 } }],
  },
  {
    id: 'scales-played-as-time-reed-between-the-steps',
    name: 'Reed between the steps',
    category: 'keys',
    preview: DORIAN_WEDGE,
    description:
      'Reedy tines with a fast tremolo, eased in so the hammer is hardly heard, in a hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Reedy flutter',
      params: { volume: -13, release: 0.6 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 160 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'scales-played-as-time-hot-step',
    name: 'Hot step',
    category: 'keys',
    preview: DORIAN_OVER_LYDIAN,
    description:
      'Overdriven tines blurred by a soft fuzz and a short room, then muffled above twelve hundred hertz.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Warm overdrive',
      params: { volume: -11, drive: 0.6 },
    },
    effects: [
      { deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },

  // String bass: fingers to pick, thud to ring, dry to far.
  {
    id: 'scales-played-as-time-half-speed-fingers',
    name: 'Half speed fingers',
    category: 'bass',
    preview: LYDIAN_LOW,
    description:
      'Fingers on an electric bass, doubled loosely, rounded by a transformer and glued by a slow compressor.',
    instrument: { deviceId: 'string-bass', preset: 'Warm fingers', params: { release: 0.4 } },
    effects: [
      { deviceId: 'chorus', preset: 'Loose double', params: { mix: 0.35 } },
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.7 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'scales-played-as-time-pick-above-the-long',
    name: 'Pick above the long',
    category: 'bass',
    preview: AEOLIAN_SINKING,
    description:
      'A bright pick near the bridge, the lows kept single and only the highs doubled, in a small booth.',
    instrument: { deviceId: 'string-bass', preset: 'Bright pick', params: { volume: -0.5 } },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Top only' },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'scales-played-as-time-foot-of-the-ladder',
    name: 'Foot of the ladder',
    category: 'bass',
    preview: AEOLIAN_SINKING,
    description:
      'Half-muted strings at the bridge, pushed flat by a limiter and answered by a splash of spring.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted thud',
      params: { volume: 6, position: 0.1, tone: 0.6, mute: 0.5 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -8 } },
      { deviceId: 'spring-reverb', preset: 'Late splash', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'scales-played-as-time-raised-fourth-singing',
    name: 'Raised fourth singing',
    category: 'bass',
    preview: LYDIAN_LOW,
    description:
      'A fretless plucked near the bridge, warmed, whose long notes begin straight and open into a chorus.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { volume: -1, position: 0.07, sustain: 14, touch: 0.6, tone: 0.8, release: 0.35 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth', params: { driveDb: 10, outputDb: -7 } },
      { deviceId: 'late-vibrato', preset: 'Opens to chorus' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'scales-played-as-time-upright-on-the-landing',
    name: 'Upright on the landing',
    category: 'bass',
    preview: LYDIAN_LOW,
    description: 'A round plucked upright a few steps back in a stone stairwell.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { volume: 5.5, sustain: 3.5 },
    },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.35 } }],
  },
  {
    id: 'scales-played-as-time-wooden-long-count',
    name: 'Wooden long count',
    category: 'bass',
    preview: LYDIAN_LOW,
    description:
      'An upright left to ring sixteen seconds with its quiet end brought up after each note.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Long wooden ring',
      params: { volume: -5, release: 0.35 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Just the ends' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'scales-played-as-time-flatwound-descent',
    name: 'Flatwound descent',
    category: 'bass',
    preview: AEOLIAN_SINKING,
    description:
      'The darkest flat strings over the neck, soon gone, through a pillow speaker with a late slap of room.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark flat strings',
      params: { volume: 6, position: 0.5, tone: 0.1, sustain: 1 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker', params: { output: 10 } },
      { deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'scales-played-as-time-deep-twenty-four',
    name: 'Deep twenty-four',
    category: 'bass',
    preview: LYDIAN_LOW,
    description:
      'A very soft deep fretless under a four-stage phaser that spares the lows, its hall warm below.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Quiet deep fretless',
      params: { volume: -6, release: 0.4 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'scales-played-as-time-rattled-riser',
    name: 'Rattled riser',
    category: 'bass',
    preview: AEOLIAN_SINKING,
    description:
      'A hard pick with fret rattle through a small loudspeaker, its echo two pulses late.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Pick with a rattle',
      params: { volume: 1, growl: 0.8 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio' },
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { time: 500, feedback: 0.35, mix: 0.4 },
      },
    ],
  },
  {
    id: 'scales-played-as-time-bridge-count',
    name: 'Bridge count',
    category: 'bass',
    preview: AEOLIAN_SINKING,
    description:
      'Fingers close to the bridge, nasal and a little muted, inside a resonant wooden body.',
    instrument: { deviceId: 'string-bass', preset: 'Near the bridge', params: { volume: 3 } },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { size: 1.6, mix: 0.6 } }],
  },
  {
    id: 'scales-played-as-time-slapped-twelve',
    name: 'Slapped twelve',
    category: 'bass',
    preview: AEOLIAN_SINKING,
    description: 'A slapped upright with a loud fingerboard, driven into a soft tube curve.',
    instrument: { deviceId: 'string-bass', preset: 'Slapped upright', params: { volume: 4 } },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 8 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'scales-played-as-time-soft-floor-high-glass',
    name: 'Soft floor, high glass',
    category: 'bass',
    preview: LYDIAN_LOW,
    description:
      'A dark soft upright with glass octaves laid quietly above it and a warm hall behind.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark soft upright',
      params: { volume: -2.5, release: 0.3 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves', params: { dry: 1, up1: 0.2, up2: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },

  // Drum kit: the rims, the bell and the even six.
  {
    id: 'scales-played-as-time-locrian-rims',
    name: 'Locrian rims',
    category: 'drum',
    preview: RIM_LOCRIAN,
    description:
      'Tight rims tuned up a third and held long, with a short gated burst of room behind each.',
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Small and tight',
      params: { tune: 4, length: 1.2 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.3, mix: 0.3 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'scales-played-as-time-felted-bell-pattern',
    name: 'Felted bell pattern',
    category: 'drum',
    preview: KIT_STACK,
    description: 'A felt-soft kit with no snap, its top shaded off, in a small room.',
    instrument: { deviceId: 'drum-kit', preset: 'Felt kit', params: { snap: 0, tone: 0.3 } },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'scales-played-as-time-deep-even-six',
    name: 'Deep even six',
    category: 'drum',
    preview: KIT_STACK,
    description: 'Deep slow drums tuned down nine semitones, their tails rolling in a dark cave.',
    instrument: { deviceId: 'drum-kit', preset: 'Deep and slow', params: { tune: -9, length: 2 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.35 } }],
  },
  {
    id: 'scales-played-as-time-paper-timeline',
    name: 'Paper timeline',
    category: 'drum',
    preview: KIT_STACK,
    description:
      'A short paper kit through a dusty ten-bit converter, its edges left rough, in a tight room.',
    instrument: { deviceId: 'drum-kit', preset: 'Paper kit', params: { volume: 5, length: 0.8 } },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty' },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'scales-played-as-time-brushed-gait',
    name: 'Brushed gait',
    category: 'drum',
    preview: KIT_STACK,
    description: 'Brushed drums without punch or snap, every hit blurred a little and drawn wide.',
    instrument: { deviceId: 'drum-kit', preset: 'Brushed' },
    effects: [
      { deviceId: 'fog', preset: 'Short blur' },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'scales-played-as-time-ticks-of-the-stair',
    name: 'Ticks of the stair',
    category: 'drum',
    preview: RIM_LOCRIAN,
    description: 'Bright ticks with five even echoes crossing the stereo field, each one softer.',
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Bright ticks',
      params: { volume: 5, length: 0.7 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Even steps',
        params: { first: 200, skips: 5, mix: 0.45 },
      },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'scales-played-as-time-toms-count-double',
    name: 'Toms count double',
    category: 'drum',
    preview: KIT_STACK,
    description: 'Long toms inside a large drum body, every low step humming for its full length.',
    instrument: { deviceId: 'drum-kit', preset: 'Long toms', params: { volume: -10, length: 3 } },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { size: 2, mix: 0.6 } },
      { deviceId: 'ambient-comp', preset: 'Peak stop' },
    ],
  },
  {
    id: 'scales-played-as-time-dust-in-seven-treads',
    name: 'Dust in seven treads',
    category: 'drum',
    preview: KIT_STACK,
    description: 'A worn paper kit, overdriven and dull, from a record that crackles in the gaps.',
    instrument: { deviceId: 'drum-kit', preset: 'Dusty', params: { drive: 0.5 } },
    effects: [
      { deviceId: 'vinyl', preset: 'Dull stylus' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'scales-played-as-time-low-beyond-the-wall',
    name: 'Low beyond the wall',
    category: 'drum',
    preview: KIT_STACK,
    description: 'A low kit heard from next door, its bell only just through the wall.',
    instrument: { deviceId: 'drum-kit', preset: 'Low and far', params: { length: 1.8 } },
    effects: [{ deviceId: 'distance', preset: 'Next door' }],
  },
  {
    id: 'scales-played-as-time-airy-rims-left-open',
    name: 'Airy rims left open',
    category: 'drum',
    preview: RIM_LOCRIAN,
    description: 'Long airy drums answered by scattered echoes that never fall on the pulse.',
    instrument: { deviceId: 'drum-kit', preset: 'Airy and long', params: { volume: -13 } },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.35 } },
      { deviceId: 'ambient-comp', preset: 'Raise the quiet' },
    ],
  },
  {
    id: 'scales-played-as-time-toy-mode',
    name: 'Toy mode',
    category: 'drum',
    preview: RIM_LOCRIAN,
    description: 'A toy-sized kit tuned high, knocking inside a small tin.',
    instrument: { deviceId: 'drum-kit', preset: 'Toy box', params: { volume: 6 } },
    effects: [
      { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'scales-played-as-time-heavy-half-steps',
    name: 'Heavy half steps',
    category: 'drum',
    preview: RIM_LOCRIAN,
    description:
      'The heaviest, lowest drums with their attacks softened, and a slow bloom of room after each.',
    instrument: { deviceId: 'drum-kit', preset: 'Heavy steps', params: { volume: -4, length: 2 } },
    effects: [
      { deviceId: 'sift', preset: 'Soft hammers' },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.4 } },
    ],
  },

  // Mallets: wood, steel and celesta, from a knock to a hum.
  {
    id: 'scales-played-as-time-ionian-is-the-bell',
    name: 'Ionian is the bell',
    category: 'bell',
    preview: IONIAN_BELL,
    description: 'A short hard xylophone in a small bright tank, every pulse a plain knock.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { volume: 1, mallet: 1, decay: 0.4 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { decay: 2, mix: 0.25 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'scales-played-as-time-dark-long-bars',
    name: 'Dark long bars',
    category: 'bell',
    preview: IONIAN_BELL,
    description:
      'A soft marimba whose low-pass opens for each stroke and shuts as the bar hums on.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Humming marimba',
      params: { volume: -3.5, decay: 2.5, mallet: 0.15 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 220, envAmount: 40, envReleaseMs: 500, resonance: 0.8 },
      },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'scales-played-as-time-two-modes-in-the-motor',
    name: 'Two modes in the motor',
    category: 'bell',
    preview: FIVE_OF_TWELVE,
    description:
      'Vibraphone with its motor stopped, gated in twelve steps: Lydian on one side, Phrygian on the other.',
    instrument: { deviceId: 'mallets', preset: 'Still vibes', params: { decay: 3, damper: 0 } },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Canon of three',
        params: {
          rate: 4,
          steps: 12,
          fill: 7,
          shift: 11,
          drift: 0,
          floor: 0.2,
          edge: 0.4,
          shade: 0.5,
        },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'scales-played-as-time-slow-disc-five-notes',
    name: 'Slow disc, five notes',
    category: 'bell',
    preview: FIVE_OF_TWELVE,
    description:
      'Vibraphone with a slow full motor, its tail drifting upward by octaves in the reverb.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { volume: -7, decay: 2 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Octave halo', params: { mix: 0.35 } }],
  },
  {
    id: 'scales-played-as-time-rolled-landing',
    name: 'Rolled landing',
    category: 'bell',
    preview: AEOLIAN_SLOW,
    description:
      'A rolled marimba where each long step becomes a shiver, sifted down to its tones alone.',
    instrument: { deviceId: 'mallets', preset: 'Rolled marimba', params: { volume: -4, roll: 8 } },
    effects: [
      { deviceId: 'sift', preset: 'Tones only' },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'scales-played-as-time-celesta-at-the-half-step',
    name: 'Celesta at the half step',
    category: 'bell',
    preview: AEOLIAN_SLOW,
    description:
      'A damped celesta as two players close by, flying a little about each other, in a bright plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { volume: -4, decay: 0.6, mallet: 0.6 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'scales-played-as-time-metal-ladder-low-feet',
    name: 'Metal ladder, low feet',
    category: 'bell',
    preview: FIVE_OF_TWELVE,
    description:
      'A hard short glockenspiel with no resonator, the octave and the double octave below it added.',
    instrument: { deviceId: 'mallets', preset: 'Glockenspiel', params: { volume: 0, decay: 0.5 } },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0.3, sub1: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'scales-played-as-time-warm-wood-backward',
    name: 'Warm wood backward',
    category: 'bell',
    preview: IONIAN_BELL,
    description:
      'A long warm xylophone with the last bar of itself played back in reverse beneath.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Warm xylophone',
      params: { volume: -3.5, decay: 2.5, mallet: 0.2 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Reverse bed', params: { length: 1.92, mix: 0.45 } },
      { deviceId: 'spread', preset: 'Open middle' },
    ],
  },
  {
    id: 'scales-played-as-time-bars-in-a-worn-pattern',
    name: 'Bars in a worn pattern',
    category: 'bell',
    preview: IONIAN_BELL,
    description:
      'A short marimba under a firm mallet, coarse from an early sampler, its two-head echo a whole step behind.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { volume: 1.5, mallet: 0.7, decay: 0.5, resonator: 0.4 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Early sampler' },
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 320, mix: 0.25 } },
    ],
  },
  {
    id: 'scales-played-as-time-open-celesta-stair',
    name: 'Open celesta stair',
    category: 'bell',
    preview: IONIAN_BELL,
    description: 'An undamped celesta left to pile up, every tone held on clean behind it.',
    instrument: { deviceId: 'mallets', preset: 'Open celesta', params: { volume: -19 } },
    effects: [{ deviceId: 'spectral-blur', preset: 'Clean sustain', params: { mix: 0.4 } }],
  },
  {
    id: 'scales-played-as-time-tremor-of-the-sixth',
    name: 'Tremor of the sixth',
    category: 'bell',
    preview: IONIAN_BELL,
    description:
      'A fast trembling celesta through a small transistor set with no static, in a room of its own.',
    instrument: { deviceId: 'mallets', preset: 'Tremolo celesta' },
    effects: [
      { deviceId: 'radio', preset: 'Clean transistor', params: { static: 0 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },

  // Bells: bowl, bar, glass, wood and gong.
  {
    id: 'scales-played-as-time-aeolian-by-the-clock',
    name: 'Aeolian by the clock',
    category: 'bell',
    preview: AEOLIAN_SLOW,
    description:
      'A church bell struck hard, its highest tones first and its hum last, in an open valley.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { decay: 6, hardness: 0.9, damping: 0.25 },
    },
    effects: [
      { deviceId: 'prism', preset: 'High to low', params: { mix: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'scales-played-as-time-long-tones-in-bronze',
    name: 'Long tones in bronze',
    category: 'bell',
    preview: AEOLIAN_SLOW,
    description:
      'A dark bowl struck softly, swinging from ear to ear every four seconds as it rings.',
    instrument: { deviceId: 'modal-bells', preset: 'Dark bowl', params: { decay: 14 } },
    effects: [
      { deviceId: 'around', preset: 'Wide pendulum' },
      { deviceId: 'ambient-comp', preset: 'Raise the quiet' },
    ],
  },
  {
    id: 'scales-played-as-time-music-box-with-a-limp',
    name: 'Music box with a limp',
    category: 'bell',
    preview: FIVE_OF_TWELVE,
    description:
      'A short music box with its body shrunk, on a warped record that turns a little unevenly.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { volume: 2.5, decay: 1.5 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Warped', params: { warp: 0.4, crackle: 0.15 } },
      { deviceId: 'size', preset: 'Smaller' },
    ],
  },
  {
    id: 'scales-played-as-time-thumbed-twelve',
    name: 'Thumbed twelve',
    category: 'plucked',
    preview: FIVE_OF_TWELVE,
    description: 'A short kalimba in its wooden box with a tape echo on three heads, dark and few.',
    instrument: { deviceId: 'modal-bells', preset: 'Kalimba', params: { volume: -2, decay: 1.6 } },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.5 } },
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 250, feedback: 0.2, mix: 0.25 },
      },
    ],
  },
  {
    id: 'scales-played-as-time-wedge-of-tapped-glass',
    name: 'Wedge of tapped glass',
    category: 'bell',
    preview: DORIAN_WEDGE,
    description:
      'Glasses tapped with a nail, each with echoes that gather in, quicker and quicker.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { volume: -8.5, decay: 2.5 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Gathering in', params: { span: 1680, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'scales-played-as-time-gong-on-the-twelve',
    name: 'Gong on the twelve',
    category: 'bell',
    preview: AEOLIAN_SLOW,
    description:
      'A soft gong beside its own copy an octave down with the partials stretched, in a vast nave.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { volume: 5, decay: 9, brightness: 0.25 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Sunken gong', params: { mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'scales-played-as-time-even-six-in-wood-bars',
    name: 'Even six in wood bars',
    category: 'bell',
    preview: PHRYGIAN_OVER_SIX,
    description:
      'Short wooden bars, muffled and knocked, with their tones an octave lower growing after.',
    instrument: { deviceId: 'modal-bells', preset: 'Wood bars', params: { volume: 6, decay: 0.9 } },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Low shadow', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'scales-played-as-time-chime-over-every-pulse',
    name: 'Chime over every pulse',
    category: 'bell',
    preview: AEOLIAN_SLOW,
    description: 'Wind chimes tuned and struck, broken into a cascade of octaves above themselves.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: { volume: -4, decay: 4 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Octave stack', params: { time: 450, repeats: 4, mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'scales-played-as-time-five-vibraphone-gates',
    name: 'Five vibraphone gates',
    category: 'bell',
    preview: FIVE_OF_TWELVE,
    description:
      'A vibraphone gated over twelve pulses, the five-note rhythm 2 2 3 2 3 at the right and its reverse at the left.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { volume: -4, decay: 10, release: 0.2 },
    },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Dark glints',
        params: {
          rate: 4,
          steps: 12,
          fill: 5,
          drift: 0,
          floor: 0.25,
          shade: 1,
          apart: 1,
          shift: 8,
          edge: 0.3,
        },
      },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'scales-played-as-time-bell-without-a-strike',
    name: 'Bell without a strike',
    category: 'bell',
    preview: DORIAN_WEDGE,
    description: 'A bell held as if bowed, every note swelling in late, over a slow chorus.',
    instrument: { deviceId: 'modal-bells', preset: 'Bowed bell', params: { hardness: 0.3 } },
    effects: [
      { deviceId: 'swell', preset: 'Slow bow', params: { attack: 300 } },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },
  {
    id: 'scales-played-as-time-shiver-on-the-semitone',
    name: 'Shiver on the semitone',
    category: 'bell',
    preview: AEOLIAN_SLOW,
    description:
      'Glass beating seven times a second, each band of it flickering on its own, under a faint octave halo.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Shivering glass',
      params: { volume: -4.5, decay: 5 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Wide twinkle' },
      { deviceId: 'shimmer', preset: 'Faint glimmer' },
    ],
  },

  // Droplets: an even pulse or loose rain round each held step.
  {
    id: 'scales-played-as-time-rain-on-the-phrygian',
    name: 'Rain on the Phrygian',
    category: 'texture',
    preview: PHRYGIAN_OVER_SIX,
    description: 'Loose glass rain round each held note, in a bright chamber.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Glass rain',
      params: { volume: -5, rain: 5, loose: 0.9, ring: 1.4, trail: 1 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.35 } }],
  },
  {
    id: 'scales-played-as-time-one-drop-per-pulse',
    name: 'One drop per pulse',
    category: 'bell',
    preview: FIVE_OF_TWELVE,
    description:
      'Wooden drops at four a second, perfectly even under the uneven notes, in a wooden box.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Wood pulse',
      params: { volume: -3, rain: 4, ring: 1.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.5 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'scales-played-as-time-pond-below-the-stair',
    name: 'Pond below the stair',
    category: 'texture',
    preview: PHRYGIAN_OVER_SIX,
    description: 'Large slow drops into deep water, heard from half under the surface.',
    instrument: { deviceId: 'droplets', preset: 'Deep pool', params: { rain: 2.5, ring: 3 } },
    effects: [
      { deviceId: 'underwater', preset: 'Half in' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'scales-played-as-time-felt-six-at-rest',
    name: 'Felt six at rest',
    category: 'texture',
    preview: PHRYGIAN_OVER_SIX,
    description:
      'Felt drops falling evenly under the notes, one to a whole step, six to the bar, each with a soft tape slap.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt pulse',
      params: { volume: -7.5, rain: 1.25 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 200, mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'scales-played-as-time-long-chimes-few-drops',
    name: 'Long chimes, few drops',
    category: 'bell',
    preview: PHRYGIAN_OVER_SIX,
    description:
      'Slow ringing metal drops, with long pieces of them sinking a minor third as they fade.',
    instrument: { deviceId: 'droplets', preset: 'Long chimes', params: { rain: 1.2 } },
    effects: [
      { deviceId: 'falling', preset: 'Slow sighs', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'scales-played-as-time-metal-drizzle-in-five',
    name: 'Metal drizzle in five',
    category: 'bell',
    preview: FIVE_OF_TWELVE,
    description:
      'Fine metal drizzle over two octaves, gated 2 2 3 2 3 at the right and 3 2 3 2 2 at the left.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Bell drizzle',
      params: { volume: -2.5, rain: 6, trail: 3 },
    },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Bright sparks',
        params: {
          rate: 4,
          steps: 12,
          fill: 5,
          drift: 0,
          shift: 8,
          length: 0.6,
          floor: 0.3,
          edge: 0.5,
          shade: 0.4,
        },
      },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'scales-played-as-time-bubbles-up-the-mode',
    name: 'Bubbles up the mode',
    category: 'texture',
    preview: FIVE_OF_TWELVE,
    description:
      'A quick stream of bubbles following the held notes, small and wide, through a slow flange.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Bubble stream',
      params: { volume: 5.5, rain: 12, trail: 0.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Gentle sweep' },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'scales-played-as-time-patter-in-the-stairwell',
    name: 'Patter in the stairwell',
    category: 'texture',
    preview: PHRYGIAN_OVER_SIX,
    description:
      'Felt patter at the far end of a stairwell, the notes that stay brought out above the rest.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt patter',
      params: { volume: 0.5, rain: 10, size: 0.6 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.5 } },
      { deviceId: 'distance', preset: 'Stone stairwell' },
    ],
  },
  {
    id: 'scales-played-as-time-even-glass-count',
    name: 'Even glass count',
    category: 'bell',
    preview: FIVE_OF_TWELVE,
    description:
      'Glass drops in strict time climbing two octaves, their echoes hopping an octave on the way.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Glass pulse',
      params: { volume: -3.5, rain: 8, size: 0.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Octave hop',
        params: { time: 250, feedback: 0.35, mix: 0.35 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'scales-played-as-time-tin-roof-narrow-steps',
    name: 'Tin roof, narrow steps',
    category: 'texture',
    preview: PHRYGIAN_OVER_SIX,
    description:
      'A fine hard shower on a tin roof, leaned toward the white keys by a filter, in a two-spring tank.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Tin roof',
      params: { volume: -4.5, rain: 14, ring: 0.5, splash: 0.6 },
    },
    effects: [
      { deviceId: 'scale-filter', preset: 'Lean to the key' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },

  // Harp, koto and guzheng: damped for the bass that steps, open for the wedge.
  {
    id: 'scales-played-as-time-harp-on-both-clocks',
    name: 'Harp on both clocks',
    category: 'plucked',
    preview: DORIAN_OVER_LYDIAN,
    description:
      'A muted harp plucked softly near mid-string, muffled, the other strings humming, in a hall.',
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { damp: 0.95, pluck: 0.45, touch: 0.1, halo: 0.6 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'scales-played-as-time-koto-counts-the-steps',
    name: 'Koto counts the steps',
    category: 'plucked',
    preview: IONIAN_BELL,
    description:
      'A koto plucked sharply near the bridge, half damped and limited, in one slack dripping spring.',
    instrument: { deviceId: 'harp', preset: 'Koto', params: { volume: -3.5, damp: 0.6, decay: 2 } },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 18, outputGain: -8.5 } },
      { deviceId: 'spring-reverb', preset: 'Single slack coil', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'scales-played-as-time-silk-leaned-on-each-step',
    name: 'Silk leaned on each step',
    category: 'plucked',
    preview: DORIAN_WEDGE,
    description:
      'Soft silk strings pressed a third of a semitone sharp after each pluck, in a slow ascending tail.',
    instrument: { deviceId: 'harp', preset: 'Soft silk', params: { volume: 0.5, bend: 35 } },
    effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.35 } }],
  },
  {
    id: 'scales-played-as-time-guzheng-seven-gates',
    name: 'Guzheng, seven gates',
    category: 'plucked',
    preview: DORIAN_WEDGE,
    description:
      'Open guzheng strings gated in twelve steps, Lydian at the left and Aeolian at the right.',
    instrument: { deviceId: 'harp', preset: 'Guzheng', params: { volume: 2, decay: 3, halo: 0.8 } },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Slow drift',
        params: {
          rate: 4.76,
          steps: 12,
          fill: 7,
          shift: 4,
          drift: 0,
          floor: 0.2,
          edge: 0.5,
          shade: 0.3,
        },
      },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'scales-played-as-time-dry-pluck-wet-answer',
    name: 'Dry pluck, wet answer',
    category: 'plucked',
    preview: DORIAN_OVER_LYDIAN,
    description: 'Short dry plucks with a half-speed shadow of themselves an octave below.',
    instrument: { deviceId: 'harp', preset: 'Short dry pluck', params: { body: 0.5, decay: 0.5 } },
    effects: [
      { deviceId: 'half-speed', preset: 'Thin shadow', params: { mix: 0.45 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'scales-played-as-time-hollow-lower-treads',
    name: 'Hollow lower treads',
    category: 'plucked',
    preview: DORIAN_OVER_LYDIAN,
    description:
      'A dark hollow harp plucked at mid-string and damped, organ stops at the unison and octave behind it.',
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: -3.5, damp: 0.7 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Nearly dry', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'scales-played-as-time-steel-climb-bright-fall',
    name: 'Steel climb, bright fall',
    category: 'plucked',
    preview: IONIAN_BELL,
    description:
      'Hard steel strings plucked by the bridge, with grains that fall an octave at each repeat.',
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { volume: 2, decay: 1.5, touch: 0.8 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
]
