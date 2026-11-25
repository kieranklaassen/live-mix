import { type FactoryPreset, type Phrase } from '../types'

// Tunes that agree with themselves when they start again two beats later, and two beats after
// that. The phrases are such rounds, sung by three equal voices or by one player; the presets
// walk how far behind the followers come (a chain that repeats on the tune's own two beats), how
// far off the voices stand, and how each note begins and ends.

// C D E F G F E D in three equal voices, each two beats after the last, all from C5: together they are
// C E G on one beat and D F on the next, and the round empties a voice at a time.
const THREE_ENTRIES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.475, note: 72, gain: 0.5 },
    { atSec: 0.5, durSec: 0.475, note: 74, gain: 0.45 },
    { atSec: 1, durSec: 0.475, note: 76, gain: 0.5 },
    { atSec: 1, durSec: 0.475, note: 72, gain: 0.42 },
    { atSec: 1.5, durSec: 0.475, note: 77, gain: 0.45 },
    { atSec: 1.5, durSec: 0.475, note: 74, gain: 0.38 },
    { atSec: 2, durSec: 0.475, note: 79, gain: 0.5 },
    { atSec: 2, durSec: 0.475, note: 76, gain: 0.42 },
    { atSec: 2, durSec: 0.475, note: 72, gain: 0.38 },
    { atSec: 2.5, durSec: 0.475, note: 77, gain: 0.45 },
    { atSec: 2.5, durSec: 0.475, note: 77, gain: 0.38 },
    { atSec: 2.5, durSec: 0.475, note: 74, gain: 0.34 },
    { atSec: 3, durSec: 0.475, note: 79, gain: 0.42 },
    { atSec: 3, durSec: 0.475, note: 76, gain: 0.5 },
    { atSec: 3, durSec: 0.475, note: 76, gain: 0.38 },
    { atSec: 3.5, durSec: 0.475, note: 77, gain: 0.38 },
    { atSec: 3.5, durSec: 0.475, note: 77, gain: 0.34 },
    { atSec: 3.5, durSec: 0.475, note: 74, gain: 0.45 },
    { atSec: 4, durSec: 0.475, note: 79, gain: 0.38 },
    { atSec: 4, durSec: 0.475, note: 76, gain: 0.42 },
    { atSec: 4, durSec: 0.475, note: 72, gain: 0.5 },
    { atSec: 4.5, durSec: 0.475, note: 77, gain: 0.34 },
    { atSec: 4.5, durSec: 0.475, note: 74, gain: 0.38 },
    { atSec: 5, durSec: 0.475, note: 76, gain: 0.38 },
    { atSec: 5, durSec: 0.475, note: 72, gain: 0.42 },
    { atSec: 5.5, durSec: 0.475, note: 74, gain: 0.34 },
    { atSec: 6, durSec: 0.475, note: 72, gain: 0.38 },
  ],
}

// The same eight notes and the first again, once, for one player: a follower one second behind (two beats) agrees.
const LADDER_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.475, note: 72, gain: 0.6 },
    { atSec: 0.5, durSec: 0.475, note: 74, gain: 0.54 },
    { atSec: 1, durSec: 0.475, note: 76, gain: 0.6 },
    { atSec: 1.5, durSec: 0.475, note: 77, gain: 0.54 },
    { atSec: 2, durSec: 0.475, note: 79, gain: 0.6 },
    { atSec: 2.5, durSec: 0.475, note: 77, gain: 0.54 },
    { atSec: 3, durSec: 0.475, note: 76, gain: 0.6 },
    { atSec: 3.5, durSec: 0.475, note: 74, gain: 0.54 },
    { atSec: 4, durSec: 0.475, note: 72, gain: 0.6 },
  ],
}

// The same tune already going round, two beats apart in three octaves: no voice is heard to enter.
const WHERE_IS_THE_START: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.8, note: 72, gain: 0.5 },
    { atSec: 0, durSec: 0.8, note: 64, gain: 0.42 },
    { atSec: 0, durSec: 0.8, note: 55, gain: 0.38 },
    { atSec: 0.8, durSec: 0.8, note: 74, gain: 0.45 },
    { atSec: 0.8, durSec: 0.8, note: 62, gain: 0.38 },
    { atSec: 0.8, durSec: 0.8, note: 53, gain: 0.34 },
    { atSec: 1.6, durSec: 0.8, note: 76, gain: 0.5 },
    { atSec: 1.6, durSec: 0.8, note: 60, gain: 0.42 },
    { atSec: 1.6, durSec: 0.8, note: 52, gain: 0.38 },
    { atSec: 2.4, durSec: 0.8, note: 77, gain: 0.45 },
    { atSec: 2.4, durSec: 0.8, note: 62, gain: 0.38 },
    { atSec: 2.4, durSec: 0.8, note: 50, gain: 0.34 },
    { atSec: 3.2, durSec: 0.8, note: 79, gain: 0.5 },
    { atSec: 3.2, durSec: 0.8, note: 64, gain: 0.42 },
    { atSec: 3.2, durSec: 0.8, note: 48, gain: 0.38 },
    { atSec: 4, durSec: 0.8, note: 77, gain: 0.45 },
    { atSec: 4, durSec: 0.8, note: 65, gain: 0.38 },
    { atSec: 4, durSec: 0.8, note: 50, gain: 0.34 },
    { atSec: 4.8, durSec: 0.8, note: 76, gain: 0.5 },
    { atSec: 4.8, durSec: 0.8, note: 67, gain: 0.42 },
    { atSec: 4.8, durSec: 0.8, note: 52, gain: 0.38 },
    { atSec: 5.6, durSec: 1.5, note: 74, gain: 0.45 },
    { atSec: 5.6, durSec: 1.5, note: 65, gain: 0.38 },
    { atSec: 5.6, durSec: 1.5, note: 53, gain: 0.34 },
  ],
}

// A G F E F C D E, two voices an octave under the first: D minor, C, then their thirds, round to D minor held.
const EVENING_WHEEL: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.647, note: 69, gain: 0.5 },
    { atSec: 0, durSec: 0.647, note: 53, gain: 0.38 },
    { atSec: 0, durSec: 0.647, note: 50, gain: 0.42 },
    { atSec: 0.66, durSec: 0.647, note: 67, gain: 0.45 },
    { atSec: 0.66, durSec: 0.647, note: 52, gain: 0.38 },
    { atSec: 0.66, durSec: 0.647, note: 48, gain: 0.34 },
    { atSec: 1.32, durSec: 0.647, note: 65, gain: 0.5 },
    { atSec: 1.32, durSec: 0.647, note: 57, gain: 0.42 },
    { atSec: 1.32, durSec: 0.647, note: 50, gain: 0.38 },
    { atSec: 1.98, durSec: 0.647, note: 64, gain: 0.45 },
    { atSec: 1.98, durSec: 0.647, note: 55, gain: 0.38 },
    { atSec: 1.98, durSec: 0.647, note: 52, gain: 0.34 },
    { atSec: 2.64, durSec: 0.647, note: 65, gain: 0.5 },
    { atSec: 2.64, durSec: 0.647, note: 57, gain: 0.38 },
    { atSec: 2.64, durSec: 0.647, note: 53, gain: 0.42 },
    { atSec: 3.3, durSec: 0.647, note: 60, gain: 0.45 },
    { atSec: 3.3, durSec: 0.647, note: 55, gain: 0.34 },
    { atSec: 3.3, durSec: 0.647, note: 52, gain: 0.38 },
    { atSec: 3.96, durSec: 0.647, note: 62, gain: 0.5 },
    { atSec: 3.96, durSec: 0.647, note: 53, gain: 0.42 },
    { atSec: 3.96, durSec: 0.647, note: 53, gain: 0.38 },
    { atSec: 4.62, durSec: 0.647, note: 64, gain: 0.45 },
    { atSec: 4.62, durSec: 0.647, note: 52, gain: 0.34 },
    { atSec: 4.62, durSec: 0.647, note: 48, gain: 0.38 },
    { atSec: 5.28, durSec: 1.9, note: 69, gain: 0.5 },
    { atSec: 5.28, durSec: 1.9, note: 53, gain: 0.38 },
    { atSec: 5.28, durSec: 1.9, note: 50, gain: 0.42 },
  ],
}

// A G F C D E, six beats: three equal voices make D F A and C E G in turn, and the voices trade its notes every other beat.
const IN_THREE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.399, note: 69, gain: 0.5 },
    { atSec: 0.42, durSec: 0.399, note: 67, gain: 0.45 },
    { atSec: 0.84, durSec: 0.399, note: 69, gain: 0.42 },
    { atSec: 0.84, durSec: 0.399, note: 65, gain: 0.5 },
    { atSec: 1.26, durSec: 0.399, note: 67, gain: 0.38 },
    { atSec: 1.26, durSec: 0.399, note: 60, gain: 0.45 },
    { atSec: 1.68, durSec: 0.399, note: 69, gain: 0.38 },
    { atSec: 1.68, durSec: 0.399, note: 65, gain: 0.42 },
    { atSec: 1.68, durSec: 0.399, note: 62, gain: 0.5 },
    { atSec: 2.1, durSec: 0.399, note: 67, gain: 0.34 },
    { atSec: 2.1, durSec: 0.399, note: 64, gain: 0.45 },
    { atSec: 2.1, durSec: 0.399, note: 60, gain: 0.38 },
    { atSec: 2.52, durSec: 0.399, note: 69, gain: 0.5 },
    { atSec: 2.52, durSec: 0.399, note: 65, gain: 0.38 },
    { atSec: 2.52, durSec: 0.399, note: 62, gain: 0.42 },
    { atSec: 2.94, durSec: 0.399, note: 67, gain: 0.45 },
    { atSec: 2.94, durSec: 0.399, note: 64, gain: 0.38 },
    { atSec: 2.94, durSec: 0.399, note: 60, gain: 0.34 },
    { atSec: 3.36, durSec: 0.399, note: 69, gain: 0.42 },
    { atSec: 3.36, durSec: 0.399, note: 65, gain: 0.5 },
    { atSec: 3.36, durSec: 0.399, note: 62, gain: 0.38 },
    { atSec: 3.78, durSec: 0.399, note: 67, gain: 0.38 },
    { atSec: 3.78, durSec: 0.399, note: 64, gain: 0.34 },
    { atSec: 3.78, durSec: 0.399, note: 60, gain: 0.45 },
    { atSec: 4.2, durSec: 0.399, note: 69, gain: 0.38 },
    { atSec: 4.2, durSec: 0.399, note: 65, gain: 0.42 },
    { atSec: 4.2, durSec: 0.399, note: 62, gain: 0.5 },
    { atSec: 4.62, durSec: 0.399, note: 67, gain: 0.34 },
    { atSec: 4.62, durSec: 0.399, note: 64, gain: 0.45 },
    { atSec: 4.62, durSec: 0.399, note: 60, gain: 0.38 },
    { atSec: 5.04, durSec: 1.6, note: 69, gain: 0.5 },
    { atSec: 5.04, durSec: 1.6, note: 65, gain: 0.38 },
    { atSec: 5.04, durSec: 1.6, note: 62, gain: 0.42 },
  ],
}

// The same an octave up and quicker, for bells.
const IN_THREE_HIGH: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.342, note: 81, gain: 0.44 },
    { atSec: 0.36, durSec: 0.342, note: 79, gain: 0.4 },
    { atSec: 0.72, durSec: 0.342, note: 81, gain: 0.38 },
    { atSec: 0.72, durSec: 0.342, note: 77, gain: 0.44 },
    { atSec: 1.08, durSec: 0.342, note: 79, gain: 0.34 },
    { atSec: 1.08, durSec: 0.342, note: 72, gain: 0.4 },
    { atSec: 1.44, durSec: 0.342, note: 81, gain: 0.36 },
    { atSec: 1.44, durSec: 0.342, note: 77, gain: 0.38 },
    { atSec: 1.44, durSec: 0.342, note: 74, gain: 0.44 },
    { atSec: 1.8, durSec: 0.342, note: 79, gain: 0.32 },
    { atSec: 1.8, durSec: 0.342, note: 76, gain: 0.4 },
    { atSec: 1.8, durSec: 0.342, note: 72, gain: 0.34 },
    { atSec: 2.16, durSec: 0.342, note: 81, gain: 0.44 },
    { atSec: 2.16, durSec: 0.342, note: 77, gain: 0.36 },
    { atSec: 2.16, durSec: 0.342, note: 74, gain: 0.38 },
    { atSec: 2.52, durSec: 0.342, note: 79, gain: 0.4 },
    { atSec: 2.52, durSec: 0.342, note: 76, gain: 0.34 },
    { atSec: 2.52, durSec: 0.342, note: 72, gain: 0.32 },
    { atSec: 2.88, durSec: 0.342, note: 81, gain: 0.38 },
    { atSec: 2.88, durSec: 0.342, note: 77, gain: 0.44 },
    { atSec: 2.88, durSec: 0.342, note: 74, gain: 0.36 },
    { atSec: 3.24, durSec: 0.342, note: 79, gain: 0.34 },
    { atSec: 3.24, durSec: 0.342, note: 76, gain: 0.32 },
    { atSec: 3.24, durSec: 0.342, note: 72, gain: 0.4 },
    { atSec: 3.6, durSec: 0.342, note: 81, gain: 0.36 },
    { atSec: 3.6, durSec: 0.342, note: 77, gain: 0.38 },
    { atSec: 3.6, durSec: 0.342, note: 74, gain: 0.44 },
    { atSec: 3.96, durSec: 0.342, note: 79, gain: 0.32 },
    { atSec: 3.96, durSec: 0.342, note: 76, gain: 0.4 },
    { atSec: 3.96, durSec: 0.342, note: 72, gain: 0.34 },
    { atSec: 4.32, durSec: 1.4, note: 81, gain: 0.44 },
    { atSec: 4.32, durSec: 1.4, note: 77, gain: 0.36 },
    { atSec: 4.32, durSec: 1.4, note: 74, gain: 0.38 },
  ],
}

// C E A C F A D falls by thirds. Three equal voices follow one slow beat apart, heard one by one, and
// together they sing two beats of A minor, two of F and come to rest on D minor.
const SLOW_STRETTO: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.95, note: 72, gain: 0.5 },
    { atSec: 0.95, durSec: 0.95, note: 76, gain: 0.5 },
    { atSec: 0.95, durSec: 0.95, note: 72, gain: 0.42 },
    { atSec: 1.9, durSec: 0.95, note: 76, gain: 0.42 },
    { atSec: 1.9, durSec: 0.95, note: 72, gain: 0.4 },
    { atSec: 1.9, durSec: 0.95, note: 69, gain: 0.5 },
    { atSec: 2.85, durSec: 0.95, note: 76, gain: 0.4 },
    { atSec: 2.85, durSec: 0.95, note: 72, gain: 0.5 },
    { atSec: 2.85, durSec: 0.95, note: 69, gain: 0.42 },
    { atSec: 3.8, durSec: 0.95, note: 72, gain: 0.42 },
    { atSec: 3.8, durSec: 0.95, note: 69, gain: 0.4 },
    { atSec: 3.8, durSec: 0.95, note: 65, gain: 0.5 },
    { atSec: 4.75, durSec: 0.95, note: 72, gain: 0.4 },
    { atSec: 4.75, durSec: 0.95, note: 69, gain: 0.5 },
    { atSec: 4.75, durSec: 0.95, note: 65, gain: 0.42 },
    { atSec: 5.7, durSec: 1.5, note: 69, gain: 0.42 },
    { atSec: 5.7, durSec: 1.5, note: 65, gain: 0.4 },
    { atSec: 5.7, durSec: 1.5, note: 62, gain: 0.5 },
  ],
}

// The same slow round with two of its voices an octave lower.
const SLOW_OPEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 69, gain: 0.5 },
    { atSec: 0, durSec: 1.1, note: 53, gain: 0.38 },
    { atSec: 0, durSec: 1.1, note: 50, gain: 0.42 },
    { atSec: 1.1, durSec: 1.1, note: 67, gain: 0.45 },
    { atSec: 1.1, durSec: 1.1, note: 52, gain: 0.38 },
    { atSec: 1.1, durSec: 1.1, note: 48, gain: 0.34 },
    { atSec: 2.2, durSec: 1.1, note: 65, gain: 0.5 },
    { atSec: 2.2, durSec: 1.1, note: 57, gain: 0.42 },
    { atSec: 2.2, durSec: 1.1, note: 50, gain: 0.38 },
    { atSec: 3.3, durSec: 1.1, note: 60, gain: 0.45 },
    { atSec: 3.3, durSec: 1.1, note: 55, gain: 0.38 },
    { atSec: 3.3, durSec: 1.1, note: 52, gain: 0.34 },
    { atSec: 4.4, durSec: 1.1, note: 62, gain: 0.5 },
    { atSec: 4.4, durSec: 1.1, note: 57, gain: 0.38 },
    { atSec: 4.4, durSec: 1.1, note: 53, gain: 0.42 },
    { atSec: 5.5, durSec: 1.6, note: 64, gain: 0.45 },
    { atSec: 5.5, durSec: 1.6, note: 55, gain: 0.34 },
    { atSec: 5.5, durSec: 1.6, note: 48, gain: 0.38 },
  ],
}

// G E D A B C and home to G, one player: a follower 1.2 seconds behind (two beats) makes G and A minor with it.
const FALLING_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.57, note: 79, gain: 0.6 },
    { atSec: 0.6, durSec: 0.57, note: 76, gain: 0.54 },
    { atSec: 1.2, durSec: 0.57, note: 74, gain: 0.6 },
    { atSec: 1.8, durSec: 0.57, note: 69, gain: 0.54 },
    { atSec: 2.4, durSec: 0.57, note: 71, gain: 0.6 },
    { atSec: 3, durSec: 0.57, note: 72, gain: 0.54 },
    { atSec: 3.6, durSec: 0.57, note: 79, gain: 0.6 },
  ],
}

// C A G F C D E A and home to C, one player over an octave: the follower is a second and a half behind.
const WIDE_TUNE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.735, note: 72, gain: 0.6 },
    { atSec: 0.75, durSec: 0.735, note: 69, gain: 0.54 },
    { atSec: 1.5, durSec: 0.735, note: 67, gain: 0.6 },
    { atSec: 2.25, durSec: 0.735, note: 65, gain: 0.54 },
    { atSec: 3, durSec: 0.735, note: 60, gain: 0.6 },
    { atSec: 3.75, durSec: 0.735, note: 62, gain: 0.54 },
    { atSec: 4.5, durSec: 0.735, note: 64, gain: 0.6 },
    { atSec: 5.25, durSec: 0.735, note: 69, gain: 0.54 },
    { atSec: 6, durSec: 0.735, note: 72, gain: 0.6 },
  ],
}

// Nine beats in three bars, A G D, C E F, E B A: each voice is a bar behind, and the three beats
// of every bar are A minor, E minor and D minor.
const WALTZ_ROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.342, note: 69, gain: 0.48 },
    { atSec: 0.36, durSec: 0.342, note: 67, gain: 0.43 },
    { atSec: 0.72, durSec: 0.342, note: 62, gain: 0.48 },
    { atSec: 1.08, durSec: 0.342, note: 69, gain: 0.4 },
    { atSec: 1.08, durSec: 0.342, note: 60, gain: 0.43 },
    { atSec: 1.44, durSec: 0.342, note: 67, gain: 0.36 },
    { atSec: 1.44, durSec: 0.342, note: 64, gain: 0.48 },
    { atSec: 1.8, durSec: 0.342, note: 65, gain: 0.43 },
    { atSec: 1.8, durSec: 0.342, note: 62, gain: 0.4 },
    { atSec: 2.16, durSec: 0.342, note: 69, gain: 0.36 },
    { atSec: 2.16, durSec: 0.342, note: 64, gain: 0.48 },
    { atSec: 2.16, durSec: 0.342, note: 60, gain: 0.36 },
    { atSec: 2.52, durSec: 0.342, note: 71, gain: 0.43 },
    { atSec: 2.52, durSec: 0.342, note: 67, gain: 0.32 },
    { atSec: 2.52, durSec: 0.342, note: 64, gain: 0.4 },
    { atSec: 2.88, durSec: 0.342, note: 69, gain: 0.48 },
    { atSec: 2.88, durSec: 0.342, note: 65, gain: 0.36 },
    { atSec: 2.88, durSec: 0.342, note: 62, gain: 0.36 },
    { atSec: 3.24, durSec: 0.342, note: 69, gain: 0.43 },
    { atSec: 3.24, durSec: 0.342, note: 64, gain: 0.4 },
    { atSec: 3.24, durSec: 0.342, note: 60, gain: 0.32 },
    { atSec: 3.6, durSec: 0.342, note: 71, gain: 0.36 },
    { atSec: 3.6, durSec: 0.342, note: 67, gain: 0.48 },
    { atSec: 3.6, durSec: 0.342, note: 64, gain: 0.36 },
    { atSec: 3.96, durSec: 0.342, note: 69, gain: 0.4 },
    { atSec: 3.96, durSec: 0.342, note: 65, gain: 0.32 },
    { atSec: 3.96, durSec: 0.342, note: 62, gain: 0.43 },
    { atSec: 4.32, durSec: 0.342, note: 69, gain: 0.36 },
    { atSec: 4.32, durSec: 0.342, note: 64, gain: 0.36 },
    { atSec: 4.32, durSec: 0.342, note: 60, gain: 0.48 },
    { atSec: 4.68, durSec: 0.342, note: 71, gain: 0.32 },
    { atSec: 4.68, durSec: 0.342, note: 67, gain: 0.4 },
    { atSec: 4.68, durSec: 0.342, note: 64, gain: 0.43 },
    { atSec: 5.04, durSec: 0.342, note: 69, gain: 0.36 },
    { atSec: 5.04, durSec: 0.342, note: 65, gain: 0.48 },
    { atSec: 5.04, durSec: 0.342, note: 62, gain: 0.36 },
    { atSec: 5.4, durSec: 0.342, note: 69, gain: 0.32 },
    { atSec: 5.4, durSec: 0.342, note: 64, gain: 0.43 },
    { atSec: 5.4, durSec: 0.342, note: 60, gain: 0.4 },
    { atSec: 5.76, durSec: 0.342, note: 71, gain: 0.48 },
    { atSec: 5.76, durSec: 0.342, note: 67, gain: 0.36 },
    { atSec: 5.76, durSec: 0.342, note: 64, gain: 0.36 },
    { atSec: 6.12, durSec: 0.342, note: 69, gain: 0.43 },
    { atSec: 6.12, durSec: 0.342, note: 65, gain: 0.4 },
    { atSec: 6.12, durSec: 0.342, note: 62, gain: 0.32 },
    { atSec: 6.48, durSec: 0.85, note: 69, gain: 0.48 },
    { atSec: 6.48, durSec: 0.85, note: 64, gain: 0.36 },
    { atSec: 6.48, durSec: 0.85, note: 60, gain: 0.36 },
  ],
}

// A round of three four-note phrases (A D G C, C A B G, E F D E) that fall in fifths, A minor, D minor, G, C, and stop on A minor.
const TAVERN_CATCH: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.37, note: 57, gain: 0.5 },
    { atSec: 0.39, durSec: 0.37, note: 50, gain: 0.45 },
    { atSec: 0.78, durSec: 0.37, note: 55, gain: 0.5 },
    { atSec: 1.17, durSec: 0.37, note: 48, gain: 0.45 },
    { atSec: 1.56, durSec: 0.37, note: 60, gain: 0.5 },
    { atSec: 1.56, durSec: 0.37, note: 57, gain: 0.42 },
    { atSec: 1.95, durSec: 0.37, note: 57, gain: 0.45 },
    { atSec: 1.95, durSec: 0.37, note: 50, gain: 0.38 },
    { atSec: 2.34, durSec: 0.37, note: 59, gain: 0.5 },
    { atSec: 2.34, durSec: 0.37, note: 55, gain: 0.42 },
    { atSec: 2.73, durSec: 0.37, note: 55, gain: 0.45 },
    { atSec: 2.73, durSec: 0.37, note: 48, gain: 0.38 },
    { atSec: 3.12, durSec: 0.37, note: 64, gain: 0.5 },
    { atSec: 3.12, durSec: 0.37, note: 60, gain: 0.42 },
    { atSec: 3.12, durSec: 0.37, note: 57, gain: 0.4 },
    { atSec: 3.51, durSec: 0.37, note: 65, gain: 0.45 },
    { atSec: 3.51, durSec: 0.37, note: 57, gain: 0.38 },
    { atSec: 3.51, durSec: 0.37, note: 50, gain: 0.36 },
    { atSec: 3.9, durSec: 0.37, note: 62, gain: 0.5 },
    { atSec: 3.9, durSec: 0.37, note: 59, gain: 0.42 },
    { atSec: 3.9, durSec: 0.37, note: 55, gain: 0.4 },
    { atSec: 4.29, durSec: 0.37, note: 64, gain: 0.45 },
    { atSec: 4.29, durSec: 0.37, note: 55, gain: 0.38 },
    { atSec: 4.29, durSec: 0.37, note: 48, gain: 0.36 },
    { atSec: 4.68, durSec: 0.37, note: 64, gain: 0.42 },
    { atSec: 4.68, durSec: 0.37, note: 60, gain: 0.4 },
    { atSec: 4.68, durSec: 0.37, note: 57, gain: 0.5 },
    { atSec: 5.07, durSec: 0.37, note: 65, gain: 0.38 },
    { atSec: 5.07, durSec: 0.37, note: 57, gain: 0.36 },
    { atSec: 5.07, durSec: 0.37, note: 50, gain: 0.45 },
    { atSec: 5.46, durSec: 0.37, note: 62, gain: 0.42 },
    { atSec: 5.46, durSec: 0.37, note: 59, gain: 0.4 },
    { atSec: 5.46, durSec: 0.37, note: 55, gain: 0.5 },
    { atSec: 5.85, durSec: 0.37, note: 64, gain: 0.38 },
    { atSec: 5.85, durSec: 0.37, note: 55, gain: 0.36 },
    { atSec: 5.85, durSec: 0.37, note: 48, gain: 0.45 },
    { atSec: 6.24, durSec: 1.1, note: 64, gain: 0.4 },
    { atSec: 6.24, durSec: 1.1, note: 60, gain: 0.5 },
    { atSec: 6.24, durSec: 1.1, note: 57, gain: 0.42 },
  ],
}

// A G F E F C D E low and alone, then a second voice an octave higher four beats behind: tenths, a twelfth,
// an octave and a sixth, never a fourth, and wide enough to be played an octave down.
const LOW_PAIR: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.706, note: 57, gain: 0.6 },
    { atSec: 0.72, durSec: 0.706, note: 55, gain: 0.54 },
    { atSec: 1.44, durSec: 0.706, note: 53, gain: 0.6 },
    { atSec: 2.16, durSec: 0.706, note: 52, gain: 0.54 },
    { atSec: 2.88, durSec: 0.706, note: 69, gain: 0.5 },
    { atSec: 2.88, durSec: 0.706, note: 53, gain: 0.6 },
    { atSec: 3.6, durSec: 0.706, note: 67, gain: 0.45 },
    { atSec: 3.6, durSec: 0.706, note: 48, gain: 0.54 },
    { atSec: 4.32, durSec: 0.706, note: 65, gain: 0.5 },
    { atSec: 4.32, durSec: 0.706, note: 50, gain: 0.6 },
    { atSec: 5.04, durSec: 0.706, note: 64, gain: 0.45 },
    { atSec: 5.04, durSec: 0.706, note: 52, gain: 0.54 },
    { atSec: 5.76, durSec: 1.5, note: 65, gain: 0.5 },
    { atSec: 5.76, durSec: 1.5, note: 57, gain: 0.6 },
  ],
}

// C A C F A D A F, three voices only one beat apart: F major into D minor, as close as a round can follow.
const STRETTO_IN_THIRDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.285, note: 72, gain: 0.46 },
    { atSec: 0.3, durSec: 0.285, note: 72, gain: 0.4 },
    { atSec: 0.3, durSec: 0.285, note: 69, gain: 0.41 },
    { atSec: 0.6, durSec: 0.285, note: 72, gain: 0.46 },
    { atSec: 0.6, durSec: 0.285, note: 72, gain: 0.36 },
    { atSec: 0.6, durSec: 0.285, note: 69, gain: 0.36 },
    { atSec: 0.9, durSec: 0.285, note: 72, gain: 0.4 },
    { atSec: 0.9, durSec: 0.285, note: 69, gain: 0.32 },
    { atSec: 0.9, durSec: 0.285, note: 65, gain: 0.41 },
    { atSec: 1.2, durSec: 0.285, note: 72, gain: 0.36 },
    { atSec: 1.2, durSec: 0.285, note: 69, gain: 0.46 },
    { atSec: 1.2, durSec: 0.285, note: 65, gain: 0.36 },
    { atSec: 1.5, durSec: 0.285, note: 69, gain: 0.4 },
    { atSec: 1.5, durSec: 0.285, note: 65, gain: 0.32 },
    { atSec: 1.5, durSec: 0.285, note: 62, gain: 0.41 },
    { atSec: 1.8, durSec: 0.285, note: 69, gain: 0.46 },
    { atSec: 1.8, durSec: 0.285, note: 69, gain: 0.36 },
    { atSec: 1.8, durSec: 0.285, note: 62, gain: 0.36 },
    { atSec: 2.1, durSec: 0.285, note: 69, gain: 0.4 },
    { atSec: 2.1, durSec: 0.285, note: 65, gain: 0.41 },
    { atSec: 2.1, durSec: 0.285, note: 62, gain: 0.32 },
    { atSec: 2.4, durSec: 0.285, note: 72, gain: 0.46 },
    { atSec: 2.4, durSec: 0.285, note: 69, gain: 0.36 },
    { atSec: 2.4, durSec: 0.285, note: 65, gain: 0.36 },
    { atSec: 2.7, durSec: 0.285, note: 72, gain: 0.4 },
    { atSec: 2.7, durSec: 0.285, note: 69, gain: 0.41 },
    { atSec: 2.7, durSec: 0.285, note: 65, gain: 0.32 },
    { atSec: 3, durSec: 0.285, note: 72, gain: 0.46 },
    { atSec: 3, durSec: 0.285, note: 72, gain: 0.36 },
    { atSec: 3, durSec: 0.285, note: 69, gain: 0.36 },
    { atSec: 3.3, durSec: 0.285, note: 72, gain: 0.4 },
    { atSec: 3.3, durSec: 0.285, note: 69, gain: 0.32 },
    { atSec: 3.3, durSec: 0.285, note: 65, gain: 0.41 },
    { atSec: 3.6, durSec: 0.285, note: 72, gain: 0.36 },
    { atSec: 3.6, durSec: 0.285, note: 69, gain: 0.46 },
    { atSec: 3.6, durSec: 0.285, note: 65, gain: 0.36 },
    { atSec: 3.9, durSec: 0.285, note: 69, gain: 0.4 },
    { atSec: 3.9, durSec: 0.285, note: 65, gain: 0.32 },
    { atSec: 3.9, durSec: 0.285, note: 62, gain: 0.41 },
    { atSec: 4.2, durSec: 0.285, note: 69, gain: 0.46 },
    { atSec: 4.2, durSec: 0.285, note: 69, gain: 0.36 },
    { atSec: 4.2, durSec: 0.285, note: 62, gain: 0.36 },
    { atSec: 4.5, durSec: 0.285, note: 69, gain: 0.4 },
    { atSec: 4.5, durSec: 0.285, note: 65, gain: 0.41 },
    { atSec: 4.5, durSec: 0.285, note: 62, gain: 0.32 },
    { atSec: 4.8, durSec: 1.4, note: 72, gain: 0.46 },
    { atSec: 4.8, durSec: 1.4, note: 69, gain: 0.36 },
    { atSec: 4.8, durSec: 1.4, note: 65, gain: 0.36 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Flute: a leader with followers made by the chain, trios close by, and trios that swell.
  {
    id: 'rounds-that-agree-the-leader-and-two',
    name: 'The leader and two',
    category: 'wind',
    description:
      'A straight concert flute with two followers, one and two seconds behind and an octave lower, on a short plate.',
    preview: LADDER_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { volume: -4.5, attack: 0.07, release: 0.5, breath: 0.2 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Round of three',
        params: {
          followers: 2,
          gap: 1,
          interval1: -12,
          interval2: -12,
          fade: 0.08,
          spread: 0.8,
          tone: 9000,
          mix: 0.5,
        },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'rounds-that-agree-elbows-touching',
    name: 'Elbows touching',
    category: 'wind',
    description:
      'Breathy concert flute with a hard chiff, heard close in a small booth with a wide, smeared top.',
    preview: THREE_ENTRIES,
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: { breath: 0.7, chiff: 0.85, blow: 0.3, vibrato: 0.1, scoop: 0, release: 0.12 },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.3 } },
      { deviceId: 'spread', preset: 'Hazy edges', params: { make: 0.9, high: 1.9 } },
    ],
  },
  {
    id: 'rounds-that-agree-pipes-give-chase',
    name: 'Pipes give chase',
    category: 'wind',
    description:
      'Short pan pipes into a tape echo a second long: each repeat is the tune two beats behind, duller every time.',
    preview: LADDER_LINE,
    instrument: { deviceId: 'flute', preset: 'Pan pipes', params: { release: 0.2, breath: 0.35 } },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { time: 1000, feedback: 0.62, highCut: 3200, wow: 0.1, spread: 0.9, mix: 0.46 },
      },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'rounds-that-agree-breath-takes-turns',
    name: 'Breath takes turns',
    category: 'pad',
    description:
      'Nearly all breath: three low flutes that fade in, blurred in deep fog, then lit up at the top.',
    preview: SLOW_STRETTO,
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { attack: 0.35, release: 1.6, breath: 1 },
    },
    effects: [
      {
        deviceId: 'fog',
        preset: 'Deep fog',
        params: { size: 420, soften: 0.4, damp: 0.1, lowCut: 150 },
      },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { air: 8, presence: 4, low: -5 } },
    ],
  },
  {
    id: 'rounds-that-agree-bamboo-after-bamboo',
    name: 'Bamboo after bamboo',
    category: 'wind',
    description:
      'Scooped bamboo flute into a dark bucket brigade 1.2 seconds long, so it follows itself at two beats, murkier each time.',
    preview: FALLING_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: { scoop: 90, breath: 0.5, release: 0.9 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Murky',
        params: { time: 1200, feedback: 0.55, modDepth: 0.15, age: 0.35, tone: 1800, mix: 0.45 },
      },
      { deviceId: 'spring-reverb', preset: 'Dark late coil', params: { mix: 0.28, decay: 3 } },
    ],
  },
  {
    id: 'rounds-that-agree-recorder-rota',
    name: 'Recorder rota',
    category: 'wind',
    description:
      'A soft recorder with no vibrato, given a smaller body and set in a bright chamber, quick to start and to stop.',
    preview: IN_THREE,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { attack: 0.03, release: 0.1, chiff: 0.45, blow: 0.2 },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller', params: { size: -0.65, tone: -0.1 } },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.26, decay: 1.6 } },
    ],
  },
  {
    id: 'rounds-that-agree-alto-a-bar-behind',
    name: 'Alto a bar behind',
    category: 'wind',
    description:
      'A full alto flute into a three second tape loop: four beats on, the same tune comes round under it, a little worn.',
    preview: WIDE_TUNE,
    instrument: { deviceId: 'flute', preset: 'Alto flute', params: { release: 0.6 } },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 3, feedback: 0.75, wear: 0.4, wow: 0.15, spread: 0.6, mix: 0.5 },
      },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rounds-that-agree-whispered-turns',
    name: 'Whispered turns',
    category: 'wind',
    description:
      'Pan pipes of almost pure breath, their quiet ends lifted and a comb drifting slowly through the hiss.',
    preview: IN_THREE_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { attack: 0.04, release: 0.35, chiff: 0.7 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Glacial drift', params: { mix: 0.5 } },
      { deviceId: 'lift', preset: 'Long tails', params: {} },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rounds-that-agree-the-gorge-keeps-singing',
    name: 'The gorge keeps singing',
    category: 'wind',
    description:
      'A wooden flute with three followers a second apart that feed the line again, so one tune goes on round a far hall.',
    preview: LADDER_LINE,
    instrument: { deviceId: 'flute', preset: 'Canyon flute', params: { scoop: 15, release: 0.6 } },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Endless round',
        params: { followers: 3, gap: 1, round: 0.7, fade: 0.1, tone: 4200, spread: 1, mix: 0.6 },
      },
      { deviceId: 'distance', preset: 'Back of the hall', params: { decay: 3.5 } },
    ],
  },
  {
    id: 'rounds-that-agree-a-vowel-at-the-seam',
    name: 'A vowel at the seam',
    category: 'wind',
    description:
      'A soft flute lead whose hall answers on a sung oo, with a vibrato that comes only on notes held past half a second.',
    preview: THREE_ENTRIES,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft wind lead',
      params: { volume: -14, vibrato: 0, attack: 0.08, scoop: 10 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { wait: 500, depth: 30 } },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.55, decay: 5 } },
    ],
  },
  {
    id: 'rounds-that-agree-slow-wood-turning',
    name: 'Slow wood turning',
    category: 'pad',
    description:
      'Wooden flutes that take most of a second to speak, with organ stops an octave and a twelfth above swelling late.',
    preview: SLOW_STRETTO,
    instrument: {
      deviceId: 'flute',
      preset: 'Slow wood swell',
      params: { attack: 0.7, release: 2.5, breath: 0.35 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Slow bloom',
        params: { sub: 0, speak: 1100, octave: 0.7, twelfth: 0.7, fifteenth: 0.2 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.32, decay: 6 } },
    ],
  },
  {
    id: 'rounds-that-agree-thirds-at-full-blow',
    name: 'Thirds at full blow',
    category: 'wind',
    description:
      'Hard blown flute through a small loudspeaker, each note slapped back once, with its octave below added.',
    preview: STRETTO_IN_THIRDS,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { volume: -13.5, release: 0.08, vibrato: 0.2 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Bedside radio',
        params: { noise: 0, drive: 0.5, treble: -0.3 },
      },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 150, mix: 0.4 } },
      { deviceId: 'octaves', preset: 'Bass alone', params: { dry: 0.9, sub1: 0.6 } },
    ],
  },
  {
    id: 'rounds-that-agree-hollow-pipes-circle',
    name: 'Hollow pipes circle',
    category: 'wind',
    description:
      'Breathy pipes that fade in, with an octave below added and the whole set turning in a slow rotary cabinet.',
    preview: SLOW_STRETTO,
    instrument: {
      deviceId: 'flute',
      preset: 'Hollow pipes pad',
      params: { attack: 0.45, release: 1.8, breath: 0.45 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.7, up1: 0, attack: 0.3 } },
      { deviceId: 'rotary', preset: 'Across the room', params: { hornDepth: 1, drumDepth: 0.9 } },
    ],
  },
  {
    id: 'rounds-that-agree-bend-into-place',
    name: 'Bend into place',
    category: 'wind',
    description:
      'Notes bent up a whole tone into pitch, played back reversed 1.2 seconds later and worn on a cassette.',
    preview: FALLING_LINE,
    instrument: { deviceId: 'flute', preset: 'Bent from below', params: { release: 0.5 } },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 1200, feedback: 0.25, smooth: 0.6, spread: 0.9, mix: 0.5 },
      },
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.1, wobble: 0.35 } },
    ],
  },
  {
    id: 'rounds-that-agree-school-hall-disc',
    name: 'School hall disc',
    category: 'wind',
    description:
      'Concert flutes off an old record: the top and the bottom gone, the pitch warped once a turn, a faint crackle kept.',
    preview: WALTZ_ROUND,
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: { vibrato: 0.75, breath: 0.25, release: 0.3 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'Dull stylus',
        params: { crackle: 0.12, pops: 0, surface: 0.1, warp: 0.6 },
      },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { low: -9 } },
    ],
  },
  {
    id: 'rounds-that-agree-low-flute-wades-in',
    name: 'Low flute wades in',
    category: 'wind',
    description:
      'A low flute that swells slowly under shallow water, its pitch wavering, with sines an octave up behind it.',
    preview: SLOW_STRETTO,
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { attack: 0.4, release: 1.8, breath: 0.25 },
    },
    effects: [
      {
        deviceId: 'underwater',
        preset: 'Sunlit shallows',
        params: { depth: 0.5, bubbles: 0, waver: 0.6 },
      },
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.35 } },
    ],
  },

  // Mallets: bars that must fit by their attacks, rolled bars that fit by their chords, and bars
  // with the attack taken off.
  {
    id: 'rounds-that-agree-catch-in-rosewood',
    name: 'Catch in rosewood',
    category: 'bell',
    description:
      'A plain soft marimba, close, with a wooden box added round it and a very short room.',
    preview: TAVERN_CATCH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { volume: -3, mallet: 0.5, decay: 0.7 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.45 } },
      { deviceId: 'expanse', preset: 'Small box', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rounds-that-agree-rolled-round',
    name: 'Rolled round',
    category: 'bell',
    description:
      'A rolled marimba whose strikes are sifted soft, so the round moves by chords and not by attacks.',
    preview: SLOW_OPEN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { volume: -7.5, roll: 13, width: 0.9 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Felt and air', params: { air: 0 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.35, lowDecay: 3.5 } },
    ],
  },
  {
    id: 'rounds-that-agree-motors-out-of-step',
    name: 'Motors out of step',
    category: 'bell',
    description:
      'Vibes with the motor quick and full, split into bands that swell from side to side on their own, octaves added above.',
    preview: IN_THREE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { motor: 1, motorRate: 6.5, damper: 0.2 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide', params: { depth: 0.5 } },
      { deviceId: 'octaves', preset: 'Glass octaves', params: {} },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rounds-that-agree-one-bar-three-players',
    name: 'One bar, three players',
    category: 'bell',
    description:
      'Still vibes with the key damping them, and a canon of two that enters a second apart and an octave below.',
    preview: LADDER_LINE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { volume: -3, decay: 0.8, damper: 0.8, mallet: 0.4 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Octave shadow',
        params: {
          followers: 2,
          gap: 1,
          interval1: -12,
          interval2: -12,
          fade: 0,
          spread: 1,
          tone: 3000,
          mix: 0.55,
        },
      },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rounds-that-agree-wheel-of-rolled-vibes',
    name: 'Wheel of rolled vibes',
    category: 'bell',
    description:
      'Softly rolled vibes with the motor off: a slow phaser moves through them and a thin hall keeps the last bar ringing.',
    preview: SLOW_STRETTO,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { volume: -6, roll: 6, motor: 0, mallet: 0.05 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'rounds-that-agree-glass-roof-chase',
    name: 'Glass roof chase',
    category: 'bell',
    description:
      'Hard glockenspiel heard from the far shore, dulled by air, most of it the room it stands in.',
    preview: IN_THREE_HIGH,
    instrument: { deviceId: 'mallets', preset: 'Glockenspiel', params: { volume: 0, decay: 0.6 } },
    effects: [{ deviceId: 'distance', preset: 'Far shore', params: { decay: 4, wander: 0 } }],
  },
  {
    id: 'rounds-that-agree-musical-box-in-turn',
    name: 'Musical box in turn',
    category: 'bell',
    description:
      'A celesta shrunk to a tiny body and sampled at a low rate, with a few hard-edged echoes of a room round it.',
    preview: IN_THREE_HIGH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { volume: 0.5, mallet: 0.6, decay: 0.5, resonator: 0.3 },
    },
    effects: [
      { deviceId: 'size', preset: 'Music box', params: { size: -0.8 } },
      { deviceId: 'vintage-digital', preset: 'Glaze', params: {} },
      { deviceId: 'expanse', preset: 'Hard echoes', params: { mix: 0.14, decay: 1.5 } },
    ],
  },
  {
    id: 'rounds-that-agree-dry-bones-in-thirds',
    name: 'Dry bones in thirds',
    category: 'bell',
    description:
      'A xylophone with softened heads and a bright gated room that stops dead a third of a second after each stroke.',
    preview: STRETTO_IN_THIRDS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { volume: 2.5, decay: 0.6, mallet: 0.5, resonator: 0.9 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.3, colour: 0.5, mix: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-waltz-on-warm-wood',
    name: 'Waltz on warm wood',
    category: 'bell',
    description:
      'A long warm xylophone turned down at the top, each note answered twice, a bar and two bars later, from side to side.',
    preview: WALTZ_ROUND,
    instrument: {
      deviceId: 'mallets',
      preset: 'Warm xylophone',
      params: { volume: -3.5, decay: 2.4 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Soft pebble',
        params: { first: 1080, bounce: 1, skips: 2, sink: 0.2, mix: 0.4 },
      },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-rattle-of-entries',
    name: 'Rattle of entries',
    category: 'bell',
    description:
      'A fast xylophone roll through a resonant low-pass that opens and shuts over four seconds.',
    preview: IN_THREE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Xylophone roll',
      params: { roll: 16, mallet: 0.6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { cutoffHz: 900, resonance: 3, lfoAmount: 45, lfoRateHz: 0.25 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rounds-that-agree-lamps-lit-in-order',
    name: 'Lamps lit in order',
    category: 'bell',
    description:
      'Resonated glockenspiel with the edge taken off each stroke, its echoes scattered over three seconds, never on the beat.',
    preview: FALLING_LINE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { volume: -7.5, mallet: 0.2, decay: 1.2 },
    },
    effects: [
      {
        deviceId: 'constellation',
        preset: 'Scattered seven',
        params: { span: 3000, again: 0.2, tone: 4000, mix: 0.5 },
      },
      { deviceId: 'swell', preset: 'Soft pick', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-frost-on-the-catch',
    name: 'Frost on the catch',
    category: 'bell',
    description:
      'Rolled glockenspiel frozen by a deep winter: thin, crushed a little, with a long cold tail.',
    preview: THREE_ENTRIES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel roll',
      params: { roll: 12, mallet: 0.15 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Deep winter', params: { grit: 0.35 } }],
  },
  {
    id: 'rounds-that-agree-celesta-left-open',
    name: 'Celesta left open',
    category: 'bell',
    description:
      'An undamped celesta whose tail is read backwards and climbs an octave the longer it rings.',
    preview: IN_THREE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Open celesta',
      params: { volume: -8.5, decay: 1.6, width: 1 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Octave halo', params: { mix: 0.5, decay: 4 } }],
  },
  {
    id: 'rounds-that-agree-trembling-follower',
    name: 'Trembling follower',
    category: 'bell',
    description:
      'Tremolo celesta an octave down with its body enlarged, on a driven, wavering cassette with no hiss.',
    preview: THREE_ENTRIES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Tremolo celesta',
      params: { motorRate: 8, decay: 1.5 },
    },
    effects: [
      { deviceId: 'size', preset: 'Octave below', params: { size: 0.4 } },
      { deviceId: 'tape', preset: 'Seasick', params: { hiss: 0, drive: 0.8, speed: 3 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'rounds-that-agree-two-slow-fans',
    name: 'Two slow fans',
    category: 'bell',
    description:
      'Vibes with the fan at one turn a second, pure sines of their strongest partials swelling in and lingering, a wide blur over all.',
    preview: SLOW_STRETTO,
    instrument: { deviceId: 'mallets', preset: 'Slow pulse vibes', params: { mallet: 0.05 } },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Long linger', params: { mix: 0.55, release: 5 } },
      { deviceId: 'stereo-detune', preset: 'Cloud', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'rounds-that-agree-hum-under-the-round',
    name: 'Hum under the round',
    category: 'bell',
    description:
      'A humming marimba with no stick in it, doubled one and two octaves down over strings tuned to D minor.',
    preview: LOW_PAIR,
    instrument: { deviceId: 'mallets', preset: 'Humming marimba', params: { decay: 2.5 } },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0.4, sub1: 0.7 } },
      { deviceId: 'sympathetic', preset: 'Minor wash', params: { mix: 0.4, decay: 5 } },
    ],
  },

  // Harp: every note a pluck that rings into the next entry, so how long it rings is the axis.
  {
    id: 'rounds-that-agree-harp-for-three-hands',
    name: 'Harp for three hands',
    category: 'plucked',
    description:
      'A concert harp damped as each key is let go, with a soft string pad an octave lower swelling in behind it.',
    preview: THREE_ENTRIES,
    instrument: {
      deviceId: 'harp',
      preset: 'Rings while held',
      params: { volume: -2, damp: 0.9, pluck: 0.4, touch: 0.5, halo: 0.2 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Low section', params: { mix: 0.45 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rounds-that-agree-strings-chase-strings',
    name: 'Strings chase strings',
    category: 'plucked',
    description:
      'A bright harp line in canon with itself, one and two seconds behind at pitch, each follower softer than the one before.',
    preview: LADDER_LINE,
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { volume: 4.5, touch: 0.8, pluck: 0.2, damp: 0.35 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Round of three',
        params: { followers: 2, gap: 1, fade: 0.2, spread: 1, tone: 5000, mix: 0.5 },
      },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'rounds-that-agree-koto-in-close-order',
    name: 'Koto in close order',
    category: 'plucked',
    description:
      'Koto strings plucked near the bridge, with a mono slap of a room, squashed hard so their short ring comes up.',
    preview: STRETTO_IN_THIRDS,
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { volume: 4, damp: 0.6, halo: 0.2, decay: 0.9, touch: 0.7, body: 1 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Mono slap', params: { mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -9 } },
    ],
  },
  {
    id: 'rounds-that-agree-soundboard-whisper',
    name: 'Soundboard whisper',
    category: 'plucked',
    description:
      'A harp plucked at the soundboard, squeezed, then its strikes taken down and the air between them opened wide.',
    preview: IN_THREE,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { volume: 4.5, pluck: 0.1, body: 0.6, touch: 0.3, decay: 1.5 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: {} },
      { deviceId: 'sift', preset: 'Wide air', params: { attacks: -14 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.3, decay: 5 } },
    ],
  },
  {
    id: 'rounds-that-agree-glass-keeps-the-tune',
    name: 'Glass keeps the tune',
    category: 'plucked',
    description:
      'Long ringing harp into a tape loop of two seconds: at four beats the tune comes back over its own ring.',
    preview: THREE_ENTRIES,
    instrument: { deviceId: 'harp', preset: 'Long glass ring', params: { body: 0.1, decay: 4 } },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Crossing sides',
        params: { length: 2, feedback: 0.7, mix: 0.42 },
      },
      { deviceId: 'ambient-eq', preset: 'Thin', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-muffled-waltzers',
    name: 'Muffled waltzers',
    category: 'plucked',
    description:
      'A muted harp recorded again through a pillow speaker, woolly and close, with a pulse on every third beat.',
    preview: WALTZ_ROUND,
    instrument: { deviceId: 'harp', preset: 'Muted harp', params: { damp: 1, body: 1 } },
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker', params: { treble: -0.4 } },
      {
        deviceId: 'pulses',
        preset: 'Faint ripple',
        params: { rate: 2.78, steps: 3, fill: 1, drift: 0, mix: 0.5 },
      },
    ],
  },
  {
    id: 'rounds-that-agree-silk-after-silk',
    name: 'Silk after silk',
    category: 'plucked',
    description:
      'Silk koto strings pressed a little sharp after the pluck, echoed at 1.2 seconds by a bucket brigade that wavers.',
    preview: FALLING_LINE,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { volume: 4, bend: 25, decay: 1 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Slow drift',
        params: { time: 1200, feedback: 0.5, modDepth: 0.35, mix: 0.45 },
      },
      { deviceId: 'hall-reverb', preset: 'Faint halo', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-cellar-harp-turns',
    name: 'Cellar harp turns',
    category: 'plucked',
    description: 'A dark hollow harp with its octave below, deep in a dark cave of a room.',
    preview: LOW_PAIR,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: -5.5, decay: 2.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Bass alone', params: { dry: 0.6 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Dark cave',
        params: { mix: 0.4, decay: 4, breathDepth: 0 },
      },
    ],
  },
  {
    id: 'rounds-that-agree-ticking-round',
    name: 'Ticking round',
    category: 'plucked',
    description:
      'Very short dry plucks with no ring, each throwing off tiny sparks an octave or more above.',
    preview: STRETTO_IN_THIRDS,
    instrument: { deviceId: 'harp', preset: 'Short dry pluck', params: { volume: 2, body: 0.5 } },
    effects: [
      { deviceId: 'glints', preset: 'Thrown by touch', params: { mix: 0.35 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-steel-wheel',
    name: 'Steel wheel',
    category: 'plucked',
    description:
      'Steel guzheng strings with all their shimmer, warped so the partials stretch as stiff wire does.',
    preview: EVENING_WHEEL,
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { touch: 0.7, body: 0.3, volume: 3, decay: 2.5 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Stiff string', params: {} },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rounds-that-agree-bows-nobody-holds',
    name: 'Bows nobody holds',
    category: 'pad',
    description:
      'Harp with every pluck faded in over half a second, so the voices arrive as if bowed, and blurred in mist.',
    preview: SLOW_OPEN,
    instrument: {
      deviceId: 'harp',
      preset: 'Slow rolled chord',
      params: { volume: -2.5, sweep: 0, halo: 1, decay: 3 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 500 } },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: {} },
    ],
  },

  // Chamber strings: the same three voices close, across a room and far off, by bow and by mute.
  {
    id: 'rounds-that-agree-three-desks-no-leader',
    name: 'Three desks, no leader',
    category: 'string',
    description:
      'Short bows with a firm edge and no vibrato, an octave added above, each one slapped back off a wall.',
    preview: TAVERN_CATCH,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { volume: -4, players: 2, release: 0.12, bow: 0.9 },
    },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'Hollow pair',
        params: { dry: 0.8, detune: 0.3, sub1: 0, up1: 0.6 },
      },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 130, mix: 0.35 } },
    ],
  },
  {
    id: 'rounds-that-agree-muted-procession',
    name: 'Muted procession',
    category: 'string',
    description:
      'Five muted players who take half a second to speak, heard across a room with the air taking their top.',
    preview: WHERE_IS_THE_START,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { volume: -4.5, attack: 0.5, release: 1.4 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Through fog', params: { distance: 0.75 } },
      { deviceId: 'lift', preset: 'Warm floor', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-bow-hair-and-air',
    name: 'Bow hair and air',
    category: 'string',
    description:
      'Whispered bows, more air than note, with the quiet overtones turned up and the low end cut.',
    preview: IN_THREE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { volume: -2, attack: 0.15, release: 0.8, air: 1, bow: 0.02 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones', params: {} },
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 350 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'rounds-that-agree-warm-bows-in-a-ring',
    name: 'Warm bows in a ring',
    category: 'string',
    description:
      'Six players with warm vibrato circling the listener slowly, so each turn of the tune comes from a new place.',
    preview: EVENING_WHEEL,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { volume: 1, attack: 0.2, release: 0.7, vibrato: 22 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'rounds-that-agree-glass-bows-ajar',
    name: 'Glass bows ajar',
    category: 'string',
    description:
      'Three players on the bridge with a hard glassy bow, their partials stirred to flicker one by one in a long thin hall.',
    preview: SLOW_STRETTO,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { volume: -3.5, attack: 0.3, release: 2 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Glitter on top', params: { depth: 0.9 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'rounds-that-agree-viols-behind-viols',
    name: 'Viols behind viols',
    category: 'string',
    description:
      'A viol consort playing one line, with followers a second and a half apart at pitch in a small dark room.',
    preview: WIDE_TUNE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { volume: -0.5, attack: 0.1, release: 0.35 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Slow procession',
        params: { followers: 2, gap: 1.5, fade: 0.1, spread: 0.9, mix: 0.55 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rounds-that-agree-ragged-catch-singers',
    name: 'Ragged catch singers',
    category: 'string',
    description:
      'A ragged unison of six, widely out of tune, through a horn loudspeaker and half mixed with a warped record of itself.',
    preview: TAVERN_CATCH,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { volume: 1.5, attack: 0.08, release: 0.3 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Station platform',
        params: { noise: 0, room: 0.4, output: 0 },
      },
      { deviceId: 'vinyl', preset: 'Warp chorus', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'rounds-that-agree-long-bows-one-tide',
    name: 'Long bows, one tide',
    category: 'string',
    description:
      'Six slow bows faded by a tide of breath, opening and closing while the three voices change places.',
    preview: SLOW_OPEN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Six slow bows',
      params: { volume: -2.5, attack: 0.8, release: 3, air: 0.2 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Tide', params: { in: 2, out: 3 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.35, breathDepth: 0 } },
    ],
  },
  {
    id: 'rounds-that-agree-lone-fiddle-echoed',
    name: 'Lone fiddle, echoed',
    category: 'string',
    description:
      'One player close up with wide vibrato, and the same phrase back every second on dark tape, in a hint of a wooden body.',
    preview: LADDER_LINE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { volume: -0.5, attack: 0.08, release: 0.25, vibrato: 18 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Long dark trail',
        params: { time: 1000, feedback: 0.6, highCut: 2600, spread: 0.8, mix: 0.42 },
      },
      { deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'rounds-that-agree-veil-over-the-entry',
    name: 'Veil over the entry',
    category: 'string',
    description:
      'Thin muted strings blurred into a mist that hides every entry, with octaves above them swelling late.',
    preview: SLOW_STRETTO,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Thin veil',
      params: { volume: -3.5, attack: 0.6, release: 2.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: {} },
      { deviceId: 'octaves', preset: 'Slow halo', params: {} },
    ],
  },

  // Tape orchestra: matched sections, each on its own worn strip.
  {
    id: 'rounds-that-agree-three-worn-violins',
    name: 'Three worn violins',
    category: 'string',
    description:
      'Taped violins with a quick start, aged and narrow, through a combo loudspeaker in a dead cupboard.',
    preview: WALTZ_ROUND,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: { volume: -3.5, age: 0.7, hiss: 0.1, release: 0.08 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'In the cupboard', params: { noise: 0 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rounds-that-agree-slow-strings-no-start',
    name: 'Slow strings, no start',
    category: 'pad',
    description:
      'Full taped strings that take half a second to speak, their tops wide, in a warm hall.',
    preview: WHERE_IS_THE_START,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { attack: 0.5, hiss: 0.05, tone: 0.3 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide pad', params: {} },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.4, lowDecay: 4 } },
    ],
  },
  {
    id: 'rounds-that-agree-horns-hand-it-on',
    name: 'Horns hand it on',
    category: 'wind',
    description:
      'Taped horns in the open air with two dark followers 2.9 seconds apart at the same pitch, four beats of the tune.',
    preview: LOW_PAIR,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: { volume: -4.5, attack: 0.06, age: 0.15, hiss: 0.05 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Faint answer',
        params: { followers: 2, gap: 2.88, fade: 0.3, spread: 1, tone: 2500, mix: 0.4 },
      },
      { deviceId: 'distance', preset: 'Open air', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-taped-flutes-in-line',
    name: 'Taped flutes in line',
    category: 'wind',
    description:
      'Flutes on tape, all players and hardly any age, doubled wide and slightly drifting with a soft plate.',
    preview: THREE_ENTRIES,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: { age: 0.1, hiss: 0, players: 1, tone: 0.7 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Drifting', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rounds-that-agree-reeds-round-the-post',
    name: 'Reeds round the post',
    category: 'wind',
    description:
      'Taped reeds, quick to stop, with a four stage phaser turning through them and a long spring behind.',
    preview: IN_THREE,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { release: 0.15, hiss: 0.05, tone: 0.4 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.4, mix: 0.6 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rounds-that-agree-choir-that-counts',
    name: 'Choir that counts',
    category: 'voice',
    description:
      'A taped choir in a small chapel that tints its tail with a vowel, the quiet ends lifted as the notes die.',
    preview: IN_THREE,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: { attack: 0.08, release: 0.5, hiss: 0.05 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.35 } },
      { deviceId: 'lift', preset: 'Just the ends', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-evensong-worn-thin',
    name: 'Evensong worn thin',
    category: 'voice',
    description:
      'A choir on tape worn to the limit, its bands fluttering twice a second, then dulled as if far away.',
    preview: EVENING_WHEEL,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { volume: -4, attack: 0.2, hiss: 0.25, age: 1 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Flutter', params: { depth: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Distant', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-cellos-four-beats-on',
    name: 'Cellos four beats on',
    category: 'string',
    description:
      'Taped cellos at half speed, sounding an octave down and slow to let go, an iron transformer thickening the low end.',
    preview: LOW_PAIR,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { attack: 0.15, release: 0.9, hiss: 0.05 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: {} },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25, breathDepth: 0, decay: 3 } },
    ],
  },
  {
    id: 'rounds-that-agree-the-reel-left-running',
    name: 'The reel left running',
    category: 'texture',
    description:
      'Half-speed flutes, an octave down, from a dying reel, echoed a second and a half later while older moments drift back.',
    preview: WIDE_TUNE,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Lost reel',
      params: { hiss: 0.2, age: 0.8, tone: 0.2 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Recalling', params: { time: 1500, mix: 0.45 } },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.3 } },
    ],
  },

  // Wind harp: no attack but the wind's, so the three voices are told apart by brightness and ring.
  {
    id: 'rounds-that-agree-wind-takes-the-lead',
    name: 'Wind takes the lead',
    category: 'pad',
    description:
      'A wind harp in steady air, its strings plucked as each note begins, in an open valley that answers late.',
    preview: EVENING_WHEEL,
    instrument: { deviceId: 'wind-harp', preset: 'Soft pluck', params: { wind: 0.5, ring: 2 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.35, decay: 4 } }],
  },
  {
    id: 'rounds-that-agree-fence-in-a-ring',
    name: 'Fence in a ring',
    category: 'texture',
    description:
      'Humming fence wires in a hard wind, kept to the notes of C major by a filter and turned slowly about the head.',
    preview: SLOW_OPEN,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Fence wires',
      params: { volume: -4, gust: 0.3, release: 1 },
    },
    effects: [
      { deviceId: 'scale-filter', preset: 'In a major key', params: {} },
      { deviceId: 'around', preset: 'Slow eight', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-still-air-trio',
    name: 'Still air trio',
    category: 'pad',
    description:
      'Still strings, two to a key, that hardly move, with an octave and a twelfth of pipe tone laid over them.',
    preview: WHERE_IS_THE_START,
    instrument: { deviceId: 'wind-harp', preset: 'Still air', params: { release: 0.8, hum: 0.8 } },
    effects: [
      { deviceId: 'stops', preset: 'Flute stops', params: { octave: 0.8, twelfth: 0.5, sub: 0 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rounds-that-agree-gale-on-the-seam',
    name: 'Gale on the seam',
    category: 'texture',
    description:
      'A high gale through three strings a key, its top harmonics glinting, with rain tapping on it.',
    preview: WHERE_IS_THE_START,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'High gale',
      params: { volume: 0, gust: 0.4, release: 1.5 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Light rain', params: { voice: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'rounds-that-agree-plucked-by-turns',
    name: 'Plucked by turns',
    category: 'plucked',
    description:
      'A fully plucked course of strings with a canon a second behind at the octave below, inside a clay pot.',
    preview: LADDER_LINE,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Plucked course',
      params: { volume: -9, ring: 1, release: 0.4, wind: 0.05 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Octave shadow',
        params: { followers: 1, gap: 1, fade: 0, spread: 0.6, mix: 0.5 },
      },
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'rounds-that-agree-one-bare-wire',
    name: 'One bare wire',
    category: 'string',
    description:
      'A bare string to each key beside a copy of itself two hertz higher, so every note beats twice a second in a dark hall.',
    preview: LOW_PAIR,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Bare string',
      params: { volume: -7, release: 0.6, hum: 0.5 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Moving beat', params: {} },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'rounds-that-agree-night-between-entries',
    name: 'Night between entries',
    category: 'pad',
    description:
      'Almost only air: a night wind in which the voices are shades of breath, held by a slow pad caught from them.',
    preview: SLOW_OPEN,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Night wind',
      params: { volume: -7, lull: 0.1, release: 2 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings', params: {} },
      { deviceId: 'spread', preset: 'Air only', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-ladder-in-the-wires',
    name: 'Ladder in the wires',
    category: 'pad',
    description:
      'One string a note climbing its own overtones quickly, then split by colour so the lows arrive first.',
    preview: SLOW_OPEN,
    instrument: { deviceId: 'wind-harp', preset: 'Overtone ladder', params: { release: 1 } },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { mix: 0.5 } },
      { deviceId: 'expanse', preset: 'Faint air', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rounds-that-agree-tide-in-the-strings',
    name: 'Tide in the strings',
    category: 'pad',
    description:
      'Swelling strings that ring twelve seconds and never quite stop between voices, with a slow flock about them.',
    preview: WHERE_IS_THE_START,
    instrument: { deviceId: 'wind-harp', preset: 'Slow swell', params: { hum: 0, release: 5 } },
    effects: [
      { deviceId: 'murmuration', preset: 'Slow drift', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Forward', params: {} },
    ],
  },

  // Felt piano: one tune at three distances from the ear, from inside the case to the next room.
  {
    id: 'rounds-that-agree-hands-cross-softly',
    name: 'Hands cross softly',
    category: 'keys',
    description:
      'A close felted piano with the creak of its action left in, its strikes turned down and its air spread wide.',
    preview: TAVERN_CATCH,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Close and creaky',
      params: { outputDb: -11.5, action: 0.6, thump: 0.6, pedalNoise: 0 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Soft hammers', params: { scatter: 1 } },
      { deviceId: 'lift', preset: 'Slightly closer', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-octave-apart-at-home',
    name: 'Octave apart at home',
    category: 'keys',
    description:
      'An old upright out of tune with itself, warmed by a hot valve, with the quick twang of a spring behind.',
    preview: WHERE_IS_THE_START,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { outputDb: -15, action: 0.3, thump: 0.4, reverbMix: 0 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { drive: 0.5, wobble: 0.1 } },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'rounds-that-agree-follower-at-the-gate',
    name: 'Follower at the gate',
    category: 'keys',
    description:
      'A bare, hard piano playing one line and its canon, two followers a second apart, the last an octave down.',
    preview: LADDER_LINE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { outputDb: -4.5, hardness: 0.8, reverbMix: 0 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Octaves apart',
        params: { followers: 2, gap: 1, interval1: 0, interval2: -12, mix: 0.5 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'rounds-that-agree-pedal-through-the-loop',
    name: 'Pedal through the loop',
    category: 'keys',
    description:
      'The pedal held through the whole round, so its chords pile up, thinned below and shimmering above.',
    preview: EVENING_WHEEL,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: { outputDb: -13.5, pedalNoise: 0, reverbMix: 0 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { lowCut: 250, air: 6 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rounds-that-agree-next-door-in-canon',
    name: 'Next door in canon',
    category: 'keys',
    description:
      'A dull, thudding piano in the room next door, its top taken by the wall, over a low room noise.',
    preview: WALTZ_ROUND,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { hardness: 0.15, reverbMix: 0.2 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door', params: {} },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -54 } },
    ],
  },
  {
    id: 'rounds-that-agree-catch-in-a-glass-case',
    name: 'Catch in a glass case',
    category: 'keys',
    description:
      'The hardest hammers on stiff strings, small and glassy, with sparse echoes rebuilt from grains an octave and a fifth up.',
    preview: IN_THREE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { outputDb: -5.5, reverbMix: 0.1 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints', params: { time: 840, mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-wash-over-the-entry',
    name: 'Wash over the entry',
    category: 'pad',
    description:
      'A soft-pedalled wash of piano with every strike faded in, so no voice is heard to begin, and a faint phaser.',
    preview: SLOW_OPEN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { outputDb: 3.5, reverbMix: 0.3 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: {} },
      { deviceId: 'phaser', preset: 'Faint shade', params: { mix: 0.5 } },
    ],
  },

  // Magnet piano: strings with no hammer, so an entry is a swell; the walk is how long it takes.
  {
    id: 'rounds-that-agree-magnets-in-procession',
    name: 'Magnets in procession',
    category: 'pad',
    description:
      'Glassy strings that swell in under half a second and stop short, behind a wide chorus.',
    preview: WHERE_IS_THE_START,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Glass swell',
      params: { bloom: 0.35, damper: 0.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'rounds-that-agree-hammer-then-hum',
    name: 'Hammer, then hum',
    category: 'keys',
    description:
      'A felt hammer starts each note and the magnets carry it on, with a tape echo a second behind.',
    preview: LADDER_LINE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Felt and magnets',
      params: { volume: 1, bloom: 1.5, damper: 0.6 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Warm repeats',
        params: { time: 1000, feedback: 0.6, mix: 0.42 },
      },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rounds-that-agree-whistles-on-the-wheel',
    name: 'Whistles on the wheel',
    category: 'texture',
    description:
      'Only the fourth harmonic of every string, two octaves up and thin as a whistle, pure sines an octave lower behind.',
    preview: LOW_PAIR,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'High whistle',
      params: { harmonic: 4, bloom: 0.3, damper: 0.6 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Low shadow', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rounds-that-agree-overtones-trade-seats',
    name: 'Overtones trade seats',
    category: 'pad',
    description:
      'The magnets sweep up and down the overtones while a singing resonance steps through those of D.',
    preview: SLOW_OPEN,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Overtone choir',
      params: { bloom: 0.7, damper: 1.5, sweepRate: 0.4 },
    },
    effects: [
      { deviceId: 'overtone-singer', preset: 'Slow wander', params: { root: 2 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, decay: 5 } },
    ],
  },
  {
    id: 'rounds-that-agree-dark-wood-follows',
    name: 'Dark wood follows',
    category: 'keys',
    description:
      'A woody, half struck string whose phrase comes back a second and a half later on a worn loop of tape.',
    preview: WIDE_TUNE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Dark wood',
      params: { bloom: 0.5, damper: 0.4 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Worn out',
        params: { length: 1.5, feedback: 0.6, wow: 0.3, mix: 0.45 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-twelfths-take-hands',
    name: 'Twelfths take hands',
    category: 'organ',
    description:
      'Strings fed on their third harmonic, quick as an organ, turning in a fast rotary cabinet.',
    preview: IN_THREE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Twelfth organ',
      params: { bloom: 0.08, damper: 0.2 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Guitar swirl', params: {} },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-all-the-way-round',
    name: 'All the way round',
    category: 'pad',
    description:
      'Wide shimmering strings ringing on in sympathy, their octave below swelling late beneath, on a long dark plate.',
    preview: SLOW_STRETTO,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Wide shimmer',
      params: { volume: -12.5, bloom: 0.9, sympathy: 1 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals', params: { sub2: 0.1, sub1: 0.7, filter: 400 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.7, mix: 0.4 } },
    ],
  },

  // Afterglow: the strike is the entry and the glow is the voice that has already gone in.
  {
    id: 'rounds-that-agree-glow-where-it-was',
    name: 'Glow where it was',
    category: 'keys',
    description:
      'Felt strikes whose overtones rise after them in half a second, between reedy octaves above and below.',
    preview: IN_THREE,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Dark felt',
      params: { bloom: 0.5, fade: 0.8, decay: 1 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Nasal reed', params: {} },
      { deviceId: 'fdn-reverb', preset: 'Room', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-bells-that-come-back',
    name: 'Bells that come back',
    category: 'bell',
    description:
      'Struck bells in canon at pitch, two beats and four behind, their halo of overtones glowing between.',
    preview: FALLING_LINE,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bell halo',
      params: { volume: 1.5, fade: 1.5, decay: 2 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Round of three',
        params: { followers: 2, gap: 1.2, fade: 0.15, spread: 1, mix: 0.48 },
      },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-plucks-into-the-ring',
    name: 'Plucks into the ring',
    category: 'plucked',
    description:
      'Bright plucks that leave a thin haze, repeated as a sparkling cascade of little loops, higher and partly reversed.',
    preview: STRETTO_IN_THIRDS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: { fade: 0.8, decay: 0.8, tone: 0.8 },
    },
    effects: [{ deviceId: 'cascade', preset: 'Sparkle bed', params: { time: 300, mix: 0.3 } }],
  },
  {
    id: 'rounds-that-agree-no-strike-only-turn',
    name: 'No strike, only turn',
    category: 'pad',
    description:
      'No strike at all: only the overtones rising, in three bands that swell in turn, over a low dark space.',
    preview: SLOW_OPEN,
    instrument: { deviceId: 'afterglow', preset: 'Only the glow', params: { bloom: 0.5, fade: 2 } },
    effects: [
      { deviceId: 'currents', preset: 'Deep swell', params: {} },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.3, decay: 6 } },
    ],
  },
  {
    id: 'rounds-that-agree-glass-takes-a-breath',
    name: 'Glass takes a breath',
    category: 'pad',
    description:
      'Glass struck so softly it breathes, small pieces of it caught and let fall a fifth as they fade.',
    preview: SLOW_STRETTO,
    instrument: { deviceId: 'afterglow', preset: 'Glass breath', params: { bloom: 0.9, fade: 3 } },
    effects: [
      { deviceId: 'falling', preset: 'Falling leaves', params: { mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rounds-that-agree-low-tide-turnaround',
    name: 'Low tide turnaround',
    category: 'bell',
    description:
      'Dark slow bells with a trace of ring modulation on D, their glow late and long, smudged by a dark bank of fog.',
    preview: SLOW_STRETTO,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Low tide bell',
      params: { volume: -4, bloom: 1.5, fade: 4, decay: 6 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Faint halo', params: { root: 2 } },
      { deviceId: 'fog', preset: 'Dark bank', params: { mix: 0.6 } },
    ],
  },

  // Dusk: chords of the slow round on a chorus polysynth.
  {
    id: 'rounds-that-agree-equal-voices-at-dusk',
    name: 'Equal voices at dusk',
    category: 'pad',
    description:
      'Soft synthesized clarinets with a quick start and a faint vibrato that waits for held notes, in a very short room.',
    preview: IN_THREE,
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft clarinets',
      params: { attack: 0.05, release: 0.4 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Barely there', params: {} },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rounds-that-agree-lanterns-change-hands',
    name: 'Lanterns change hands',
    category: 'pad',
    description:
      'Saw and square under a filter that opens on each chord, a sub octave below, their tone rocking nearly twice a second.',
    preview: SLOW_STRETTO,
    instrument: {
      deviceId: 'dusk',
      preset: 'Slow bloom',
      params: { volume: -3.5, attack: 0.6, release: 2.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 1.8 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'rounds-that-agree-thin-light-on-three',
    name: 'Thin light on three',
    category: 'pad',
    description:
      'A thin saw with its lows cut deep and both choruses on, blurred until the voices have no edges.',
    preview: SLOW_OPEN,
    instrument: {
      deviceId: 'dusk',
      preset: 'Thin shimmer',
      params: { attack: 0.4, release: 2, lowCut: 3 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Slow rise', params: { size: 300 } },
      { deviceId: 'glimmer', preset: 'Faint sheen', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-keys-behind-keys',
    name: 'Keys behind keys',
    category: 'keys',
    description:
      'Plucked warm synth keys whose filter snaps shut, repeated every second by a dark analog echo of the tune.',
    preview: LADDER_LINE,
    instrument: { deviceId: 'dusk', preset: 'Warm keys', params: { release: 0.5 } },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 1000, feedback: 0.65, tone: 3000, spread: 1, mix: 0.45 },
      },
    ],
  },
  {
    id: 'rounds-that-agree-cellar-of-the-round',
    name: 'Cellar of the round',
    category: 'pad',
    description:
      'Square waves with a full sub octave, the filter low, two parts four beats apart, pushed softly into tape.',
    preview: LOW_PAIR,
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { attack: 0.08, release: 0.6, cutoff: 700 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth', params: {} },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } },
    ],
  },

  // Ice: voices that answer off far shores.
  {
    id: 'rounds-that-agree-skaters-in-canon',
    name: 'Skaters in canon',
    category: 'bell',
    description:
      'A clear near ping followed at two beats and four by its own canon, each skater fainter, all a few steps back on the ice.',
    preview: FALLING_LINE,
    instrument: { deviceId: 'ice', preset: 'Clear ping', params: { volume: 6, ring: 2.5 } },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Round of three',
        params: { followers: 2, gap: 1.2, fade: 0.3, spread: 1, tone: 4000, mix: 0.5 },
      },
      { deviceId: 'distance', preset: 'A few steps back', params: { level: 1, distance: 0.3 } },
    ],
  },
  {
    id: 'rounds-that-agree-cracks-in-order',
    name: 'Cracks in order',
    category: 'bell',
    description:
      'Brittle snaps that ring just long enough for the chord, in a metal drum of a room.',
    preview: STRETTO_IN_THIRDS,
    instrument: {
      deviceId: 'ice',
      preset: 'Brittle snap',
      params: { volume: 6, ring: 1, crack: 0.6 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Kettle', params: { mix: 0.5 } },
      { deviceId: 'fet-limiter', preset: 'Light touch', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-far-bank-joins-in',
    name: 'Far bank joins in',
    category: 'bell',
    description:
      'Ice rung from the far shore, its tail sagging slowly in pitch as it fades and thinly chorused.',
    preview: IN_THREE_HIGH,
    instrument: {
      deviceId: 'ice',
      preset: 'Far shores',
      params: { volume: 1, ring: 2, crack: 0.1 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Soft sag', params: {} },
      { deviceId: 'chorus', preset: 'Faint air', params: {} },
    ],
  },
  {
    id: 'rounds-that-agree-thaw-in-two-parts',
    name: 'Thaw in two parts',
    category: 'bell',
    description:
      'Thick dark ice in two parts four beats apart, its highs gone, with a copy in a smaller body an octave down.',
    preview: LOW_PAIR,
    instrument: {
      deviceId: 'ice',
      preset: 'Thick ice',
      params: { volume: -1.5, ring: 4, cracks: 0 },
    },
    effects: [
      { deviceId: 'size', preset: 'Small and low', params: { mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: {} },
    ],
  },
]
