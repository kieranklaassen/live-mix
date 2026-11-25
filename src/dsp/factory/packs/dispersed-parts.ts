import { type FactoryPreset, type Phrase } from '../types'

// Plain part-singing slowed down: the tune in the tenor, every part a tune of its own, fifths in
// parallel and chords left without thirds, on the notes A B C D E G. Laid out by the parts as they
// sit round a hollow square (basses, tenors, trebles, altos), and by how near the room they are heard.

// Three parts, the tune in the middle: A, G, A bare; C whole; D bare; E minor; A bare. A third in
// two chords of seven.
const PLAIN_TUNE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.79, note: 45, gain: 0.52 },
    { atSec: 0, durSec: 0.79, note: 57, gain: 0.6 },
    { atSec: 0, durSec: 0.79, note: 64, gain: 0.5 },
    { atSec: 0.82, durSec: 0.79, note: 43, gain: 0.52 },
    { atSec: 0.82, durSec: 0.79, note: 62, gain: 0.6 },
    { atSec: 0.82, durSec: 0.79, note: 67, gain: 0.5 },
    { atSec: 1.64, durSec: 0.79, note: 45, gain: 0.52 },
    { atSec: 1.64, durSec: 0.79, note: 64, gain: 0.6 },
    { atSec: 1.64, durSec: 0.79, note: 69, gain: 0.5 },
    { atSec: 2.46, durSec: 0.79, note: 48, gain: 0.52 },
    { atSec: 2.46, durSec: 0.79, note: 64, gain: 0.6 },
    { atSec: 2.46, durSec: 0.79, note: 67, gain: 0.5 },
    { atSec: 3.28, durSec: 0.79, note: 50, gain: 0.52 },
    { atSec: 3.28, durSec: 0.79, note: 62, gain: 0.6 },
    { atSec: 3.28, durSec: 0.79, note: 69, gain: 0.5 },
    { atSec: 4.1, durSec: 0.79, note: 52, gain: 0.52 },
    { atSec: 4.1, durSec: 0.79, note: 59, gain: 0.6 },
    { atSec: 4.1, durSec: 0.79, note: 67, gain: 0.5 },
    { atSec: 4.92, durSec: 1.5, note: 45, gain: 0.52 },
    { atSec: 4.92, durSec: 1.5, note: 57, gain: 0.6 },
    { atSec: 4.92, durSec: 1.5, note: 64, gain: 0.5 },
  ],
}
// In 3/2: the tune on A3 with a bass below it and a treble above, each a tune of its own, closing
// on A, A and E.
const TUNE_IN_TENOR: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.16, note: 57, gain: 0.62 },
    { atSec: 0, durSec: 1.75, note: 45, gain: 0.48 },
    { atSec: 0, durSec: 1.75, note: 64, gain: 0.46 },
    { atSec: 1.2, durSec: 0.58, note: 60, gain: 0.62 },
    { atSec: 1.8, durSec: 1.16, note: 62, gain: 0.62 },
    { atSec: 1.8, durSec: 1.16, note: 50, gain: 0.48 },
    { atSec: 1.8, durSec: 1.16, note: 69, gain: 0.46 },
    { atSec: 3, durSec: 0.58, note: 52, gain: 0.48 },
    { atSec: 3, durSec: 0.58, note: 64, gain: 0.62 },
    { atSec: 3, durSec: 0.58, note: 71, gain: 0.46 },
    { atSec: 3.6, durSec: 0.58, note: 43, gain: 0.48 },
    { atSec: 3.6, durSec: 0.58, note: 62, gain: 0.62 },
    { atSec: 3.6, durSec: 0.58, note: 67, gain: 0.46 },
    { atSec: 4.2, durSec: 0.58, note: 45, gain: 0.48 },
    { atSec: 4.2, durSec: 0.58, note: 60, gain: 0.62 },
    { atSec: 4.2, durSec: 1.16, note: 64, gain: 0.46 },
    { atSec: 4.8, durSec: 0.58, note: 52, gain: 0.48 },
    { atSec: 4.8, durSec: 0.58, note: 59, gain: 0.62 },
    { atSec: 5.4, durSec: 1.5, note: 45, gain: 0.48 },
    { atSec: 5.4, durSec: 1.5, note: 57, gain: 0.62 },
    { atSec: 5.4, durSec: 1.5, note: 64, gain: 0.46 },
  ],
}
// A fuguing section in 2/2: bass, tenor, treble and alto a bar apart, then A, A, E and A together.
const FOUR_ENTRIES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.58, note: 45, gain: 0.5 },
    { atSec: 0.6, durSec: 0.29, note: 48, gain: 0.5 },
    { atSec: 0.9, durSec: 0.29, note: 50, gain: 0.5 },
    { atSec: 1.2, durSec: 0.58, note: 45, gain: 0.5 },
    { atSec: 1.2, durSec: 0.58, note: 57, gain: 0.55 },
    { atSec: 1.8, durSec: 0.29, note: 45, gain: 0.5 },
    { atSec: 1.8, durSec: 0.29, note: 60, gain: 0.55 },
    { atSec: 2.1, durSec: 0.29, note: 43, gain: 0.5 },
    { atSec: 2.1, durSec: 0.29, note: 62, gain: 0.55 },
    { atSec: 2.4, durSec: 0.58, note: 45, gain: 0.5 },
    { atSec: 2.4, durSec: 0.58, note: 57, gain: 0.55 },
    { atSec: 2.4, durSec: 0.58, note: 64, gain: 0.45 },
    { atSec: 3, durSec: 0.29, note: 43, gain: 0.5 },
    { atSec: 3, durSec: 0.29, note: 62, gain: 0.55 },
    { atSec: 3, durSec: 0.29, note: 67, gain: 0.45 },
    { atSec: 3.3, durSec: 0.29, note: 45, gain: 0.5 },
    { atSec: 3.3, durSec: 0.29, note: 64, gain: 0.55 },
    { atSec: 3.3, durSec: 0.29, note: 69, gain: 0.45 },
    { atSec: 3.6, durSec: 0.58, note: 48, gain: 0.5 },
    { atSec: 3.6, durSec: 0.58, note: 60, gain: 0.55 },
    { atSec: 3.6, durSec: 0.58, note: 64, gain: 0.42 },
    { atSec: 3.6, durSec: 0.58, note: 67, gain: 0.45 },
    { atSec: 4.2, durSec: 0.29, note: 50, gain: 0.5 },
    { atSec: 4.2, durSec: 0.29, note: 57, gain: 0.55 },
    { atSec: 4.2, durSec: 0.29, note: 62, gain: 0.42 },
    { atSec: 4.2, durSec: 0.29, note: 69, gain: 0.45 },
    { atSec: 4.5, durSec: 0.29, note: 52, gain: 0.5 },
    { atSec: 4.5, durSec: 0.29, note: 59, gain: 0.55 },
    { atSec: 4.5, durSec: 0.29, note: 64, gain: 0.42 },
    { atSec: 4.5, durSec: 0.29, note: 67, gain: 0.45 },
    { atSec: 4.8, durSec: 1.7, note: 45, gain: 0.5 },
    { atSec: 4.8, durSec: 1.7, note: 57, gain: 0.55 },
    { atSec: 4.8, durSec: 1.7, note: 64, gain: 0.42 },
    { atSec: 4.8, durSec: 1.7, note: 69, gain: 0.45 },
  ],
}
// Three slower entries on one subject: A C D in the bass, again an octave up, then E G A over
// them; D to A at the close.
const ENTRIES_APART: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.87, note: 45, gain: 0.55 },
    { atSec: 0.9, durSec: 0.44, note: 48, gain: 0.55 },
    { atSec: 1.35, durSec: 0.44, note: 50, gain: 0.55 },
    { atSec: 1.8, durSec: 0.87, note: 57, gain: 0.55 },
    { atSec: 1.8, durSec: 1.31, note: 45, gain: 0.55 },
    { atSec: 2.7, durSec: 0.44, note: 60, gain: 0.55 },
    { atSec: 3.15, durSec: 0.44, note: 43, gain: 0.55 },
    { atSec: 3.15, durSec: 0.44, note: 62, gain: 0.55 },
    { atSec: 3.6, durSec: 0.87, note: 64, gain: 0.5 },
    { atSec: 3.6, durSec: 0.87, note: 48, gain: 0.55 },
    { atSec: 3.6, durSec: 0.87, note: 60, gain: 0.55 },
    { atSec: 4.5, durSec: 0.44, note: 67, gain: 0.5 },
    { atSec: 4.5, durSec: 0.44, note: 52, gain: 0.55 },
    { atSec: 4.5, durSec: 0.44, note: 59, gain: 0.55 },
    { atSec: 4.95, durSec: 0.44, note: 69, gain: 0.5 },
    { atSec: 4.95, durSec: 0.44, note: 50, gain: 0.55 },
    { atSec: 4.95, durSec: 0.44, note: 57, gain: 0.55 },
    { atSec: 5.4, durSec: 1.4, note: 64, gain: 0.5 },
    { atSec: 5.4, durSec: 1.4, note: 45, gain: 0.55 },
    { atSec: 5.4, durSec: 1.4, note: 57, gain: 0.55 },
  ],
}
// Parallel fifths on purpose: A-E, C-G, D-A, E-B, D-A, C-G, A-E in half notes.
const FIFTHS_WALK: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.81, note: 57, gain: 0.58 },
    { atSec: 0, durSec: 0.81, note: 64, gain: 0.52 },
    { atSec: 0.84, durSec: 0.81, note: 60, gain: 0.58 },
    { atSec: 0.84, durSec: 0.81, note: 67, gain: 0.52 },
    { atSec: 1.68, durSec: 0.81, note: 62, gain: 0.58 },
    { atSec: 1.68, durSec: 0.81, note: 69, gain: 0.52 },
    { atSec: 2.52, durSec: 0.81, note: 64, gain: 0.58 },
    { atSec: 2.52, durSec: 0.81, note: 71, gain: 0.52 },
    { atSec: 3.36, durSec: 0.81, note: 62, gain: 0.58 },
    { atSec: 3.36, durSec: 0.81, note: 69, gain: 0.52 },
    { atSec: 4.2, durSec: 0.81, note: 60, gain: 0.58 },
    { atSec: 4.2, durSec: 0.81, note: 67, gain: 0.52 },
    { atSec: 5.04, durSec: 1.6, note: 57, gain: 0.58 },
    { atSec: 5.04, durSec: 1.6, note: 64, gain: 0.52 },
  ],
}
// The same walk an octave down and shorter: A-E, C-G, D-A, C-G, A-E.
const LOW_FIFTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 45, gain: 0.52 },
    { atSec: 0, durSec: 1.1, note: 52, gain: 0.5 },
    { atSec: 1.15, durSec: 1.1, note: 48, gain: 0.52 },
    { atSec: 1.15, durSec: 1.1, note: 55, gain: 0.5 },
    { atSec: 2.3, durSec: 1.1, note: 50, gain: 0.52 },
    { atSec: 2.3, durSec: 1.1, note: 57, gain: 0.5 },
    { atSec: 3.45, durSec: 1.1, note: 48, gain: 0.52 },
    { atSec: 3.45, durSec: 1.1, note: 55, gain: 0.5 },
    { atSec: 4.6, durSec: 1.7, note: 45, gain: 0.52 },
    { atSec: 4.6, durSec: 1.7, note: 52, gain: 0.5 },
  ],
}
// Three parts sounding as five, tenor and treble each doubled at the octave: A bare, G bare, C
// whole, A bare.
const DOUBLED_ACROSS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.39, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 1.39, note: 52, gain: 0.42 },
    { atSec: 0, durSec: 1.39, note: 57, gain: 0.52 },
    { atSec: 0, durSec: 1.39, note: 64, gain: 0.46 },
    { atSec: 0, durSec: 1.39, note: 69, gain: 0.42 },
    { atSec: 1.45, durSec: 1.39, note: 43, gain: 0.5 },
    { atSec: 1.45, durSec: 1.39, note: 55, gain: 0.42 },
    { atSec: 1.45, durSec: 1.39, note: 62, gain: 0.52 },
    { atSec: 1.45, durSec: 1.39, note: 67, gain: 0.46 },
    { atSec: 1.45, durSec: 1.39, note: 74, gain: 0.42 },
    { atSec: 2.9, durSec: 1.39, note: 48, gain: 0.5 },
    { atSec: 2.9, durSec: 1.39, note: 55, gain: 0.42 },
    { atSec: 2.9, durSec: 1.39, note: 64, gain: 0.52 },
    { atSec: 2.9, durSec: 1.39, note: 67, gain: 0.46 },
    { atSec: 2.9, durSec: 1.39, note: 76, gain: 0.42 },
    { atSec: 4.35, durSec: 1.9, note: 45, gain: 0.5 },
    { atSec: 4.35, durSec: 1.9, note: 52, gain: 0.42 },
    { atSec: 4.35, durSec: 1.9, note: 57, gain: 0.52 },
    { atSec: 4.35, durSec: 1.9, note: 64, gain: 0.46 },
    { atSec: 4.35, durSec: 1.9, note: 69, gain: 0.42 },
  ],
}
// Two parts in 3/2 and no bass: fifth, fifth, octave, fifth, fifth, sixth, fifth.
const TREBLE_PAIR: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.97, note: 57, gain: 0.55 },
    { atSec: 0, durSec: 0.97, note: 64, gain: 0.5 },
    { atSec: 1, durSec: 0.48, note: 62, gain: 0.55 },
    { atSec: 1, durSec: 0.48, note: 69, gain: 0.5 },
    { atSec: 1.5, durSec: 0.97, note: 60, gain: 0.55 },
    { atSec: 1.5, durSec: 0.97, note: 72, gain: 0.5 },
    { atSec: 2.5, durSec: 0.48, note: 64, gain: 0.55 },
    { atSec: 2.5, durSec: 0.48, note: 71, gain: 0.5 },
    { atSec: 3, durSec: 0.97, note: 62, gain: 0.55 },
    { atSec: 3, durSec: 0.97, note: 69, gain: 0.5 },
    { atSec: 4, durSec: 0.48, note: 59, gain: 0.55 },
    { atSec: 4, durSec: 0.48, note: 67, gain: 0.5 },
    { atSec: 4.5, durSec: 1.8, note: 57, gain: 0.55 },
    { atSec: 4.5, durSec: 1.8, note: 64, gain: 0.5 },
  ],
}
// The tune by itself in 3/2, after a half note's upbeat: A, D C, E G, E D C, A. Five notes, no
// sixth and no second.
const TENOR_ALONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.53, note: 57, gain: 0.6 },
    { atSec: 0.55, durSec: 1.08, note: 62, gain: 0.6 },
    { atSec: 1.65, durSec: 0.53, note: 60, gain: 0.6 },
    { atSec: 2.2, durSec: 1.08, note: 64, gain: 0.6 },
    { atSec: 3.3, durSec: 0.53, note: 67, gain: 0.6 },
    { atSec: 3.85, durSec: 0.53, note: 64, gain: 0.6 },
    { atSec: 4.4, durSec: 0.53, note: 62, gain: 0.6 },
    { atSec: 4.95, durSec: 0.53, note: 60, gain: 0.6 },
    { atSec: 5.5, durSec: 1.4, note: 57, gain: 0.6 },
  ],
}
// A subject that goes with itself, bars of 3/2 of 1.2 seconds: A C D, A D, A E D, A. Answered a bar
// later at the octave or the fifth and two bars later at the fifth or the fourth, every downbeat
// is consonant, and a seventh or a ninth passes only on a weak half; by itself it is a tenor tune.
const FUGUE_SUBJECT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.38, note: 57, gain: 0.6 },
    { atSec: 0.4, durSec: 0.38, note: 60, gain: 0.6 },
    { atSec: 0.8, durSec: 0.38, note: 62, gain: 0.6 },
    { atSec: 1.2, durSec: 0.78, note: 57, gain: 0.6 },
    { atSec: 2, durSec: 0.38, note: 62, gain: 0.6 },
    { atSec: 2.4, durSec: 0.38, note: 69, gain: 0.6 },
    { atSec: 2.8, durSec: 0.38, note: 64, gain: 0.6 },
    { atSec: 3.2, durSec: 0.38, note: 62, gain: 0.6 },
    { atSec: 3.6, durSec: 1.18, note: 57, gain: 0.6 },
  ],
}
// The treble's own tune in 2/2: E D C, A C D, G E, A. No B, so a part in parallel with it a fourth
// below or a fifth above stays on the six notes.
const TREBLE_TUNE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.98, note: 76, gain: 0.55 },
    { atSec: 1, durSec: 0.48, note: 74, gain: 0.55 },
    { atSec: 1.5, durSec: 0.48, note: 72, gain: 0.55 },
    { atSec: 2, durSec: 0.98, note: 69, gain: 0.55 },
    { atSec: 3, durSec: 0.48, note: 72, gain: 0.55 },
    { atSec: 3.5, durSec: 0.48, note: 74, gain: 0.55 },
    { atSec: 4, durSec: 0.48, note: 79, gain: 0.55 },
    { atSec: 4.5, durSec: 0.48, note: 76, gain: 0.55 },
    { atSec: 5, durSec: 1.6, note: 69, gain: 0.55 },
  ],
}
// Three long bare chords above the basses, A, G and A: the treble rises as the two under it step down.
const HIGH_HELD: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.15, note: 57, gain: 0.52 },
    { atSec: 0, durSec: 2.15, note: 64, gain: 0.54 },
    { atSec: 0, durSec: 2.15, note: 69, gain: 0.48 },
    { atSec: 2.2, durSec: 2.15, note: 55, gain: 0.52 },
    { atSec: 2.2, durSec: 2.15, note: 62, gain: 0.54 },
    { atSec: 2.2, durSec: 2.15, note: 74, gain: 0.48 },
    { atSec: 4.4, durSec: 2.2, note: 57, gain: 0.52 },
    { atSec: 4.4, durSec: 2.2, note: 64, gain: 0.54 },
    { atSec: 4.4, durSec: 2.2, note: 69, gain: 0.48 },
  ],
}
// The bass part by itself, since it is a tune too: A C D E, G C, A.
const BASS_TUNE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.16, note: 45, gain: 0.6 },
    { atSec: 1.2, durSec: 0.58, note: 48, gain: 0.6 },
    { atSec: 1.8, durSec: 1.16, note: 50, gain: 0.6 },
    { atSec: 3, durSec: 0.58, note: 52, gain: 0.6 },
    { atSec: 3.6, durSec: 0.87, note: 43, gain: 0.6 },
    { atSec: 4.5, durSec: 0.87, note: 48, gain: 0.6 },
    { atSec: 5.4, durSec: 1.5, note: 45, gain: 0.6 },
  ],
}
// Two long open chords, D A D A and A A E A: the two middle A's stay.
const TWO_HELD: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.98, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 2.98, note: 57, gain: 0.52 },
    { atSec: 0, durSec: 2.98, note: 62, gain: 0.5 },
    { atSec: 0, durSec: 2.98, note: 69, gain: 0.46 },
    { atSec: 3.1, durSec: 3.2, note: 45, gain: 0.5 },
    { atSec: 3.1, durSec: 3.2, note: 57, gain: 0.52 },
    { atSec: 3.1, durSec: 3.2, note: 64, gain: 0.5 },
    { atSec: 3.1, durSec: 3.2, note: 69, gain: 0.46 },
  ],
}
// One voice gives out the line, A C D E, and all the parts answer it on bare A, C, G and A
// chords, with no third anywhere.
const LINED_OUT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.53, note: 57, gain: 0.6 },
    { atSec: 0.55, durSec: 0.53, note: 60, gain: 0.6 },
    { atSec: 1.1, durSec: 0.53, note: 62, gain: 0.6 },
    { atSec: 1.65, durSec: 1.1, note: 64, gain: 0.6 },
    { atSec: 3, durSec: 0.77, note: 45, gain: 0.5 },
    { atSec: 3, durSec: 0.77, note: 57, gain: 0.58 },
    { atSec: 3, durSec: 0.77, note: 64, gain: 0.48 },
    { atSec: 3.8, durSec: 0.77, note: 48, gain: 0.5 },
    { atSec: 3.8, durSec: 0.77, note: 60, gain: 0.58 },
    { atSec: 3.8, durSec: 0.77, note: 67, gain: 0.48 },
    { atSec: 4.6, durSec: 0.77, note: 43, gain: 0.5 },
    { atSec: 4.6, durSec: 0.77, note: 62, gain: 0.58 },
    { atSec: 4.6, durSec: 0.77, note: 67, gain: 0.48 },
    { atSec: 5.4, durSec: 1.9, note: 45, gain: 0.5 },
    { atSec: 5.4, durSec: 1.9, note: 64, gain: 0.58 },
    { atSec: 5.4, durSec: 1.9, note: 69, gain: 0.48 },
  ],
}
// Six chords of four notes without a third: A, C, G, D, E, A, the treble an octave over the tenor.
const NOT_ONE_THIRD: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.88, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 0.88, note: 57, gain: 0.54 },
    { atSec: 0, durSec: 0.88, note: 64, gain: 0.46 },
    { atSec: 0, durSec: 0.88, note: 69, gain: 0.46 },
    { atSec: 0.92, durSec: 0.88, note: 48, gain: 0.5 },
    { atSec: 0.92, durSec: 0.88, note: 60, gain: 0.54 },
    { atSec: 0.92, durSec: 0.88, note: 67, gain: 0.46 },
    { atSec: 0.92, durSec: 0.88, note: 72, gain: 0.46 },
    { atSec: 1.84, durSec: 0.88, note: 43, gain: 0.5 },
    { atSec: 1.84, durSec: 0.88, note: 62, gain: 0.54 },
    { atSec: 1.84, durSec: 0.88, note: 67, gain: 0.46 },
    { atSec: 1.84, durSec: 0.88, note: 74, gain: 0.46 },
    { atSec: 2.76, durSec: 0.88, note: 50, gain: 0.5 },
    { atSec: 2.76, durSec: 0.88, note: 62, gain: 0.54 },
    { atSec: 2.76, durSec: 0.88, note: 69, gain: 0.46 },
    { atSec: 2.76, durSec: 0.88, note: 74, gain: 0.46 },
    { atSec: 3.68, durSec: 0.88, note: 52, gain: 0.5 },
    { atSec: 3.68, durSec: 0.88, note: 59, gain: 0.54 },
    { atSec: 3.68, durSec: 0.88, note: 64, gain: 0.46 },
    { atSec: 3.68, durSec: 0.88, note: 71, gain: 0.46 },
    { atSec: 4.6, durSec: 1.8, note: 45, gain: 0.5 },
    { atSec: 4.6, durSec: 1.8, note: 57, gain: 0.54 },
    { atSec: 4.6, durSec: 1.8, note: 64, gain: 0.46 },
    { atSec: 4.6, durSec: 1.8, note: 69, gain: 0.46 },
  ],
}
// The treble alone, E D C A, then a tenor a fifth under it: E-B, G-D, A-E.
const UPPER_BENCHES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.97, note: 76, gain: 0.5 },
    { atSec: 1, durSec: 0.48, note: 74, gain: 0.5 },
    { atSec: 1.5, durSec: 0.97, note: 72, gain: 0.5 },
    { atSec: 2.5, durSec: 0.48, note: 69, gain: 0.5 },
    { atSec: 3, durSec: 0.78, note: 64, gain: 0.52 },
    { atSec: 3, durSec: 0.78, note: 71, gain: 0.5 },
    { atSec: 3.8, durSec: 0.78, note: 67, gain: 0.52 },
    { atSec: 3.8, durSec: 0.78, note: 74, gain: 0.5 },
    { atSec: 4.6, durSec: 1.8, note: 69, gain: 0.52 },
    { atSec: 4.6, durSec: 1.8, note: 76, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Horns: solo players and whole benches, the fifth above and the fourth below, four rooms.
  {
    id: 'dispersed-parts-hollow-square-horns',
    name: 'Hollow square horns',
    category: 'wind',
    description:
      'A full section of French horns with a quick swell, its middle opened wide and set in a warm hall.',
    preview: PLAIN_TUNE,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.5, breath: 0.08, section: 0.9, attack: 0.35, release: 1.6, volume: -4 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Open middle', params: { mid: 1.5 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'dispersed-parts-keyers-first-pitch',
    name: "Keyer's first pitch",
    category: 'wind',
    description:
      'One breathy flugelhorn with late vibrato, heard from across a room that holds the note a second or two.',
    preview: TENOR_ALONE,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { blow: 0.28, breath: 0.7, attack: 0.15, release: 0.8, vibrato: 0.45, volume: 1 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Across the room', params: { distance: 0.35, decay: 1.8 } },
    ],
  },
  {
    id: 'dispersed-parts-tenor-bench-trumpets',
    name: 'Tenor bench trumpets',
    category: 'wind',
    description:
      'Trumpets in section blown softly, octave stops added above and below, through a plain console stage.',
    preview: FIFTHS_WALK,
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { blow: 0.3, breath: 0.2, section: 0.7, attack: 0.22, release: 0.9, volume: -8 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Octave above', params: { sub: 0.45, octave: 0.4, mix: 0.6 } },
      { deviceId: 'analog-drive', preset: 'Console' },
    ],
  },
  {
    id: 'dispersed-parts-fifths-walking-together',
    name: 'Fifths walking together',
    category: 'wind',
    description:
      'A solo trumpet half made of air carries its own fifth above, each note answered once by a worn tape echo.',
    preview: TENOR_ALONE,
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fifths',
      params: { blow: 0.3, breath: 0.5, harmony: 0.9, attack: 0.1, release: 1.4, volume: -1 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Faint trace',
        params: { time: 620, feedback: 0, heads: 0, wow: 0.5, mix: 0.3 },
      },
    ],
  },
  {
    id: 'dispersed-parts-bass-bench-at-dusk',
    name: 'Bass bench at dusk',
    category: 'bass',
    description:
      'Low brass choir with a slow start, its top shaded away and a dark cathedral of eight seconds behind it.',
    preview: LOW_FIFTHS,
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { blow: 0.25, section: 1, attack: 0.6, release: 3, volume: -5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 1800 } },
      {
        deviceId: 'ether-reverb',
        preset: 'Cathedral',
        params: { decay: 8, damping: 0.8, mix: 0.35 },
      },
    ],
  },
  {
    id: 'dispersed-parts-trebles-with-mutes-in',
    name: 'Trebles with mutes in',
    category: 'wind',
    description:
      'Four muted trumpets to a key, thin and nasal, spun slowly in a horn cabinet heard across the room.',
    preview: UPPER_BENCHES,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { blow: 0.6, breath: 0.05, section: 1, attack: 0.12, release: 1.1, volume: 1 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Across the room', params: { speed: 0, mix: 0.7 } }],
  },
  {
    id: 'dispersed-parts-four-benches-of-brass',
    name: 'Four benches of brass',
    category: 'wind',
    description:
      'Horns blown bright and tongued, scattered into a flock of five players at different distances round you.',
    preview: NOT_ONE_THIRD,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.8, breath: 0.03, section: 0.4, attack: 0.06, release: 0.7, volume: -8 },
    },
    effects: [
      {
        deviceId: 'murmuration',
        preset: 'Thick ensemble',
        params: { birds: 5, range: 14, speed: 0.4, mix: 0.6 },
      },
    ],
  },
  {
    id: 'dispersed-parts-lined-out-on-the-horn',
    name: 'Lined out on the horn',
    category: 'wind',
    description:
      'A close solo horn whose line is taken up an octave below 1.2 seconds later, and a fifth above after as long again.',
    preview: FUGUE_SUBJECT,
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { blow: 0.55, breath: 0.15, attack: 0.08, release: 0.6, volume: 0.5 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Round of three',
        params: {
          followers: 2,
          gap: 1.2,
          interval1: -12,
          interval2: 7,
          fade: 0.1,
          spread: 0.8,
          round: 0,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'dispersed-parts-open-throated-trombones',
    name: 'Open-throated trombones',
    category: 'wind',
    description:
      'Straight low brass at a steady blow pressed through an open vowel, its quiet overtones lifted a little.',
    preview: ENTRIES_APART,
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: {
        type: 4,
        blow: 0.5,
        breath: 0,
        section: 0.5,
        attack: 0.05,
        release: 0.5,
        volume: -5.5,
      },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Open vowel', params: { amount: 1.2, shift: -3 } },
      { deviceId: 'reveal', preset: 'Gentle opening' },
    ],
  },
  {
    id: 'dispersed-parts-fourth-under-the-tune',
    name: 'Fourth under the tune',
    category: 'wind',
    description:
      'Flugelhorns with a second player a fourth below every note, loosened by a slow chorus and a small dark room.',
    preview: TENOR_ALONE,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel choir',
      params: {
        blow: 0.35,
        breath: 0.1,
        section: 0.35,
        attack: 0.25,
        release: 1.3,
        harmony: -0.85,
        volume: -0.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.45 } },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'dispersed-parts-across-the-mill-pond',
    name: 'Across the mill pond',
    category: 'wind',
    description:
      'Airy flugelhorns, a fourth doubled below, sent to a far shore: late, dim and narrow, with clouds passing over.',
    preview: HIGH_HELD,
    instrument: {
      deviceId: 'horns',
      preset: 'Glacial horns',
      params: {
        type: 1,
        blow: 0.2,
        breath: 0.6,
        section: 1,
        harmony: -0.6,
        attack: 0.9,
        release: 4,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'distance', preset: 'Far shore' },
      { deviceId: 'weather', preset: 'Passing clouds', params: { exposure: 0.5 } },
    ],
  },
  {
    id: 'dispersed-parts-barn-door-low-brass',
    name: 'Barn door low brass',
    category: 'bass',
    description:
      'One trombone with an edge on it inside a large ringing wooden body, with a little of the octave below.',
    preview: BASS_TUNE,
    instrument: {
      deviceId: 'horns',
      preset: 'Trombone',
      params: { blow: 0.65, breath: 0.15, attack: 0.07, release: 0.8, vibrato: 0, volume: -1 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 2.8, opening: 0.2, mix: 0.9 } },
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.3 } },
    ],
  },
  {
    id: 'dispersed-parts-breath-before-the-beat',
    name: 'Breath before the beat',
    category: 'wind',
    description:
      'A horn that is nearly all air, filtered to the notes of an A minor pentatonic scale that ring on a moment after it.',
    preview: TUNE_IN_TENOR,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { blow: 0.1, breath: 1, section: 0.5, attack: 0.3, release: 1.5, volume: -6 },
    },
    effects: [
      {
        deviceId: 'scale-filter',
        preset: 'Wide and gentle',
        params: { root: 9, scale: 8, chord: 0, ring: 1.2, depth: 24, mix: 0.8 },
      },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'dispersed-parts-horns-past-the-orchard',
    name: 'Horns past the orchard',
    category: 'pad',
    description:
      'Flugelhorns with a fifth above, the attacks dissolved in fog and the bands of the sound swelling on slow tides.',
    preview: TWO_HELD,
    instrument: {
      deviceId: 'horns',
      preset: 'Open fifths pad',
      params: { blow: 0.2, breath: 0.35, attack: 1, release: 3.5, harmony: 0.6, volume: -4.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Deep fog' },
      { deviceId: 'currents', preset: 'Wide tide', params: { depth: 0.6 } },
    ],
  },
  {
    id: 'dispersed-parts-plank-floor-trumpets',
    name: 'Plank floor trumpets',
    category: 'wind',
    description:
      'A ballad trumpet with its vibrato taken away, short and dry but for a bright spring tank set low.',
    preview: TREBLE_PAIR,
    instrument: {
      deviceId: 'horns',
      preset: 'Ballad trumpet',
      params: { blow: 0.55, breath: 0.2, attack: 0.04, release: 0.35, vibrato: 0, volume: -5 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Tight long tank', params: { mix: 0.22 } }],
  },
  {
    id: 'dispersed-parts-mute-by-the-stove',
    name: 'Mute by the stove',
    category: 'wind',
    description:
      'A single muted trumpet through a small bedside speaker, the microphone pulled well back into the room.',
    preview: TENOR_ALONE,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { blow: 0.35, breath: 0.4, attack: 0.15, release: 1.2, vibrato: 0.3, volume: -5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { distance: 0.55, room: 0.6 } },
    ],
  },
  {
    id: 'dispersed-parts-last-bar-held-long',
    name: 'Last bar held long',
    category: 'drone',
    description:
      'Low brass and its upper fifth, caught by a sustainer that keeps the last chord as an even dark bed.',
    preview: LOW_FIFTHS,
    instrument: {
      deviceId: 'horns',
      preset: 'Soft tuba',
      params: {
        blow: 0.3,
        breath: 0.15,
        section: 0.6,
        attack: 0.3,
        release: 2.5,
        harmony: 0.4,
        volume: -6.5,
      },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { mix: 0.6 } },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },

  // Organ: registrations without a third rank, from one stopped flute to full reeds, pumped or blown.
  {
    id: 'dispersed-parts-meetinghouse-reeds',
    name: 'Meetinghouse reeds',
    category: 'organ',
    description:
      'A buzzing harmonium on the unison with its lowest and highest ranks, its body made smaller, in a tight chamber.',
    preview: ENTRIES_APART,
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: {
        sub: 0.7,
        octave: 0,
        twelfth: 0,
        fifteenth: 0.45,
        reed: 1,
        celeste: 0,
        breath: 0.1,
        bellows: 0.15,
        attack: 0.03,
        release: 0.18,
        tone: 8500,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller', params: { size: -0.5 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'dispersed-parts-bare-fifth-pump-organ',
    name: 'Bare fifth pump organ',
    category: 'organ',
    description:
      'A pump organ with the twelfth drawn loud and uneven bellows, its tone rounded by a triode stage.',
    preview: TENOR_ALONE,
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: {
        sub: 0.3,
        octave: 0,
        twelfth: 0.8,
        reed: 0.5,
        celeste: 0.1,
        bellows: 0.9,
        attack: 0.15,
        release: 0.7,
        tone: 1900,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'dispersed-parts-no-third-in-the-pipes',
    name: 'No third in the pipes',
    category: 'organ',
    description:
      'Flute pipes with every octave rank drawn and no reed, stops an octave and two above speaking late behind them, in a nave.',
    preview: NOT_ONE_THIRD,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: {
        sub: 0.8,
        octave: 0.6,
        fifteenth: 0.5,
        breath: 0.15,
        attack: 0.2,
        release: 1.5,
        tone: 6500,
        volume: -15,
      },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Slow bloom',
        params: { speak: 500, sub: 0, fifth: 0, twelfth: 0, octave: 0.8, mix: 0.6 },
      },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'dispersed-parts-wind-chest-in-winter',
    name: 'Wind chest in winter',
    category: 'organ',
    description:
      'Mostly wind: an airy stopped flute with moving bellows, taken through a thin cold season of grit and tail.',
    preview: TWO_HELD,
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: {
        octave: 0.15,
        breath: 0.9,
        bellows: 0.8,
        attack: 0.5,
        release: 2.5,
        tone: 4200,
        volume: -9,
      },
    },
    effects: [{ deviceId: 'seasons', preset: 'Deep winter', params: { depth: 0.6, turn: 0 } }],
  },
  {
    id: 'dispersed-parts-alto-bench-harmonium',
    name: 'Alto bench harmonium',
    category: 'organ',
    description:
      'A free-reed organ with two ranks beating hard against each other, cut to a narrow nasal band.',
    preview: TREBLE_PAIR,
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: {
        octave: 0,
        reed: 1,
        celeste: 0.95,
        bellows: 0.4,
        attack: 0.06,
        release: 0.3,
        tone: 3800,
        volume: -4.5,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { type: 2, cutoffHz: 1100, resonance: 1.2, mix: 0.8 },
      },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'dispersed-parts-parlour-fifths',
    name: 'Parlour fifths',
    category: 'organ',
    description:
      'Hollow quint pipes over the unison with a light shake in the wind, played from an old parlour disc.',
    preview: FUGUE_SUBJECT,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: {
        sub: 0.2,
        octave: 0.2,
        twelfth: 0.7,
        tremulant: 0.25,
        attack: 0.1,
        release: 0.6,
        tone: 3000,
        volume: -3,
      },
    },
    effects: [{ deviceId: 'vinyl', preset: 'Parlour 78', params: { crackle: 0.15, pops: 0.03 } }],
  },
  {
    id: 'dispersed-parts-two-feet-on-the-treadle',
    name: 'Two feet on the treadle',
    category: 'organ',
    description:
      'Bellows at full depth under a reed and its sub-octave, the level pushed in and out again by a slow breathing cycle.',
    preview: LOW_FIFTHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Shruti box',
      params: {
        sub: 0.6,
        reed: 0.8,
        bellows: 1,
        breath: 0.6,
        attack: 0.3,
        release: 0.9,
        tone: 2800,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'breath', preset: 'Tide', params: { in: 0.9, out: 1.2, depth: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'dispersed-parts-organ-behind-the-wall',
    name: 'Organ behind the wall',
    category: 'organ',
    description:
      'A full chorus of ranks with its top shut at 500 hertz, shifting about behind one more wall in a woolly haze.',
    preview: PLAIN_TUNE,
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { sub: 0.9, octave: 0.8, reed: 0.3, breath: 0.1, tone: 500, release: 2, volume: -9 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door', params: { wander: 0.5 } },
      { deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'dispersed-parts-trebles-on-the-fifteenth',
    name: 'Trebles on the fifteenth',
    category: 'organ',
    description:
      'A small bright stop two octaves up over a thin flute, every part of the spectrum twinkling gently by itself.',
    preview: UPPER_BENCHES,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: {
        sub: 0,
        octave: 0.3,
        twelfth: 0.1,
        fifteenth: 0.9,
        reed: 0,
        celeste: 0.3,
        breath: 0.2,
        attack: 0.12,
        release: 1,
        tone: 9000,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Light on water' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'dispersed-parts-slow-pipes-at-dusk',
    name: 'Slow pipes at dusk',
    category: 'organ',
    description:
      'Distant pipes that take over a second to speak and five to leave, turning slowly round the head.',
    preview: TWO_HELD,
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: {
        celeste: 0.7,
        reed: 0,
        twelfth: 0,
        fifteenth: 0.1,
        attack: 1.3,
        release: 5,
        tone: 1600,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.12 } },
      { deviceId: 'bloom-reverb', preset: 'Still room' },
    ],
  },
  {
    id: 'dispersed-parts-pedal-under-the-basses',
    name: 'Pedal under the basses',
    category: 'bass',
    description:
      'The sub-octave rank almost alone, dark and pipe-like, warmed by an iron stage and held even by a slow compressor.',
    preview: BASS_TUNE,
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: {
        octave: 0.1,
        reed: 0.25,
        celeste: 0,
        attack: 0.15,
        release: 0.8,
        tone: 900,
        volume: -16.5,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
    ],
  },
  {
    id: 'dispersed-parts-shaking-rank',
    name: 'Shaking rank',
    category: 'organ',
    description:
      'A reed rank with the tremulant wide open, doubled at three quarters speed a fourth lower in soft long pieces.',
    preview: HIGH_HELD,
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: {
        sub: 0.1,
        tremulant: 0.8,
        reed: 0.6,
        attack: 0.12,
        release: 1.2,
        tone: 2600,
        volume: -11,
      },
    },
    effects: [{ deviceId: 'half-speed', preset: 'Fourth down drift', params: { mix: 0.45 } }],
  },
  {
    id: 'dispersed-parts-hymn-board-low-reeds',
    name: 'Hymn board low reeds',
    category: 'organ',
    description:
      'Dark reeds over a strong rank an octave down, on steady wind, copied to worn cassette until the edges go dull.',
    preview: DOUBLED_ACROSS,
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: {
        sub: 0.9,
        octave: 0,
        twelfth: 0,
        reed: 0.95,
        celeste: 0.3,
        breath: 0.2,
        bellows: 0.2,
        attack: 0.1,
        release: 0.5,
        tone: 1300,
        volume: -13,
      },
    },
    effects: [{ deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.4 } }],
  },
  {
    id: 'dispersed-parts-borrowed-bellows',
    name: 'Borrowed bellows',
    category: 'organ',
    description:
      'Beating flute ranks that take a second to rise, over a reverb that comes and goes in a slow drawn shape.',
    preview: HIGH_HELD,
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: {
        sub: 0.4,
        octave: 0.2,
        celeste: 0.8,
        bellows: 0.5,
        attack: 1.0,
        release: 2,
        tone: 2400,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Slow tide', params: { mix: 0.5 } },
      { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.4 } },
    ],
  },

  // Tape orchestra: each part on its own strip, at full speed and at half, dry, worn or run out.
  {
    id: 'dispersed-parts-tape-of-the-square',
    name: 'Tape of the square',
    category: 'voice',
    description:
      'An airy choir tape whose singers come in apart and drift wide, kept straight, with a medium plate after it.',
    preview: FIFTHS_WALK,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: {
        tone: 0.3,
        age: 0.3,
        players: 0.95,
        vibrato: 0,
        attack: 0.1,
        release: 1.2,
        volume: -3.5,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate' }],
  },
  {
    id: 'dispersed-parts-worn-benches-on-tape',
    name: 'Worn benches on tape',
    category: 'voice',
    description:
      'A choir tape near the end of its life, caught by a two second loop that comes back duller on every pass.',
    preview: TWO_HELD,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { age: 0.95, hiss: 0.3, tone: -0.1, attack: 0.5, release: 2, volume: -10 },
    },
    effects: [{ deviceId: 'tape-loop', preset: 'Worn out', params: { length: 2, mix: 0.5 } }],
  },
  {
    id: 'dispersed-parts-horn-parts-at-half-speed',
    name: 'Horn parts at half speed',
    category: 'wind',
    description:
      'Horn tapes at half speed, an octave down and slow to open, spread wide on a warm channel of tape.',
    preview: TREBLE_PAIR,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: {
        age: 0.2,
        hiss: 0.05,
        players: 1,
        vibrato: 0.1,
        tone: 0.5,
        attack: 0.15,
        release: 1.4,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Hot glue' },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  {
    id: 'dispersed-parts-tenor-tape-treble-tape',
    name: 'Tenor tape, treble tape',
    category: 'string',
    description:
      'Violin tape with the same part added an octave higher and an octave lower, so each line sounds three times.',
    preview: TREBLE_PAIR,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: {
        age: 0.2,
        hiss: 0.1,
        players: 0.7,
        vibrato: 0.2,
        spread: 0.6,
        attack: 0.05,
        release: 0.4,
        volume: -8,
      },
    },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'Cathedral',
        params: { sub1: 0.5, sub2: 0, dry: 0.9, up1: 0.4, up2: 0 },
      },
    ],
  },
  {
    id: 'dispersed-parts-reeds-kept-in-a-drawer',
    name: 'Reeds kept in a drawer',
    category: 'wind',
    description:
      'Clarinet and oboe tape, short, boxy and nearly mono, sounding from inside a small tin.',
    preview: FOUR_ENTRIES,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: {
        age: 0.5,
        players: 0.2,
        vibrato: 0.1,
        spread: 0.2,
        attack: 0.01,
        release: 0.15,
        volume: -8,
      },
    },
    effects: [{ deviceId: 'vessel', preset: 'Small tin' }],
  },
  {
    id: 'dispersed-parts-cellos-take-the-basses',
    name: 'Cellos take the basses',
    category: 'string',
    description:
      'A cello tape, dark and closely bowed, its body a size larger and a narrow warm spring tank behind.',
    preview: BASS_TUNE,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: {
        age: 0.3,
        tone: -0.5,
        players: 0.35,
        vibrato: 0.3,
        spread: 0.3,
        attack: 0.08,
        release: 0.7,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'A shade larger' },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
    ],
  },
  {
    id: 'dispersed-parts-fiddles-with-the-trebles',
    name: 'Fiddles with the trebles',
    category: 'string',
    description:
      'A bright mono violin tape that bites at the start, played from a badly warped record.',
    preview: UPPER_BENCHES,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Strings run out',
      params: {
        age: 0.3,
        hiss: 0.1,
        length: 9,
        tone: 0.6,
        players: 0,
        vibrato: 0,
        attack: 0.005,
        release: 0.3,
        volume: -9,
      },
    },
    effects: [{ deviceId: 'vinyl', preset: 'Warped', params: { crackle: 0.1, pops: 0 } }],
  },
  {
    id: 'dispersed-parts-flute-tune-over-fourths',
    name: 'Flute tune over fourths',
    category: 'wind',
    description:
      'A flute tape with a second flute a fourth below, so a plain tune moves in parallel with itself, over a dark plate.',
    preview: TREBLE_TUNE,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: {
        age: 0.15,
        hiss: 0.05,
        vibrato: 0.2,
        players: 0.4,
        tone: 0.2,
        attack: 0.06,
        release: 0.8,
        volume: -2.5,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'Fourth under', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'dispersed-parts-reel-found-in-the-loft',
    name: 'Reel found in the loft',
    category: 'texture',
    description:
      'A crumbling half-speed flute reel whose older moments drift back later, some of them backwards.',
    preview: UPPER_BENCHES,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Lost reel',
      params: { age: 0.8, hiss: 0.4, tone: 0.2, attack: 0.2, release: 1.2, length: 9, volume: -7 },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Backwards', params: { mix: 0.5 } }],
  },
  {
    id: 'dispersed-parts-cassette-in-the-pew',
    name: 'Cassette in the pew',
    category: 'voice',
    description:
      'A choir tape copied to cassette and played through a small speaker close by, with the hiss of both.',
    preview: LINED_OUT,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: {
        tone: -0.5,
        hiss: 0.7,
        players: 0.4,
        attack: 0.04,
        release: 0.35,
        spread: 0.2,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Falling apart', params: { noise: 0.2 } },
      { deviceId: 're-amp', preset: 'Pillow speaker' },
    ],
  },
  {
    id: 'dispersed-parts-half-speed-basses',
    name: 'Half-speed basses',
    category: 'bass',
    description:
      'Cello tape at half speed, an octave under the keys, low-passed on a slow sweep and driven lightly on iron.',
    preview: BASS_TUNE,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: {
        age: 0.15,
        players: 0.3,
        vibrato: 0.1,
        spread: 0.3,
        attack: 0.1,
        release: 0.9,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'analog-drive', preset: 'Iron melt', params: { drive: 0.3 } },
    ],
  },
  {
    id: 'dispersed-parts-strings-with-no-third',
    name: 'Strings with no third',
    category: 'pad',
    description:
      'Slow string tape through a process that favours what it shares with a moment before, and lets that ring.',
    preview: NOT_ONE_THIRD,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { tone: 0.4, vibrato: 0.15, attack: 0.25, release: 1.6, volume: -10 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'dispersed-parts-choir-tape-no-reverb',
    name: 'Choir tape, no reverb',
    category: 'voice',
    description:
      'One choir tape in mono with no room at all, steady singers close up, driven into tape saturation.',
    preview: PLAIN_TUNE,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: {
        age: 0,
        hiss: 0,
        players: 0,
        vibrato: 0,
        spread: 0,
        tone: 0.1,
        attack: 0.02,
        release: 0.25,
        volume: -12,
      },
    },
    effects: [{ deviceId: 'saturator', preset: 'On tape', params: { driveDb: 10 } }],
  },
  {
    id: 'dispersed-parts-tape-of-a-dry-room',
    name: 'Tape of a dry room',
    category: 'wind',
    description:
      'Low reeds at half speed with the vibrato off, a slow tremolo of shifting tone over them and no tail.',
    preview: FIFTHS_WALK,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Low reeds',
      params: {
        tone: 0.3,
        players: 0.4,
        vibrato: 0,
        attack: 0.1,
        release: 0.5,
        age: 0.15,
        volume: -3,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Tilting tone' },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'dispersed-parts-gapped-scale-flutes',
    name: 'Gapped scale flutes',
    category: 'pad',
    description:
      'Still flute tapes ringing through a filter that passes only A, C, D, E and G, then blurred into the air.',
    preview: TREBLE_TUNE,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Still flutes',
      params: { players: 0.8, spread: 0.9, attack: 0.3, release: 1.8, volume: -9 },
    },
    effects: [
      {
        deviceId: 'scale-filter',
        preset: 'Long glass',
        params: { root: 9, scale: 8, chord: 0, ring: 2.5, mix: 0.7 },
      },
      { deviceId: 'spectral-blur', preset: 'Faint haze' },
    ],
  },
  {
    id: 'dispersed-parts-reel-of-the-last-day',
    name: 'Reel of the last day',
    category: 'wind',
    description:
      'A horn tape two and a half seconds long, so held notes run out, through a fading shortwave link into a late hall.',
    preview: TWO_HELD,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: {
        length: 2.5,
        age: 0.6,
        hiss: 0.4,
        vibrato: 0.4,
        players: 0.7,
        attack: 0.3,
        release: 1.5,
        volume: -8,
      },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Far station',
        params: { static: 0.15, interference: 0.05, mix: 0.75 },
      },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },

  // Choir: the four parts by vowel and size of voice, straight, hummed or far off.
  {
    id: 'dispersed-parts-open-ah-four-sides',
    name: 'Open ah, four sides',
    category: 'voice',
    description:
      'Straight open ah from full benches, no vibrato, bright and forward, opened at the sides of the room.',
    preview: TUNE_IN_TENOR,
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: {
        vowel: 0,
        voice: 1.05,
        motion: 0,
        breath: 0.08,
        ensemble: 1,
        vibrato: 0,
        attack: 0.12,
        release: 0.6,
        tone: 10000,
        width: 1,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'spread', preset: 'Everything wide' },
      { deviceId: 'analog-drive', preset: 'Hot channel', params: { drive: 0.3, output: -8 } },
    ],
  },
  {
    id: 'dispersed-parts-singing-in-the-square',
    name: 'Singing in the square',
    category: 'voice',
    description:
      'Eh voices scattered among eight singers on the move, each with its own distance, delay and small bend.',
    preview: FOUR_ENTRIES,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: {
        vowel: 0.3,
        voice: 1.1,
        ensemble: 0.5,
        vibrato: 6,
        attack: 0.08,
        release: 0.5,
        tone: 5500,
        volume: -11,
      },
    },
    effects: [
      {
        deviceId: 'murmuration',
        preset: 'Evening flock',
        params: { birds: 8, range: 8, mix: 0.6 },
      },
    ],
  },
  {
    id: 'dispersed-parts-bass-bench-dark-oh',
    name: 'Bass bench, dark oh',
    category: 'voice',
    description:
      'Large bass voices on oh, the octave below added softly, in a dark cave of a tail.',
    preview: LOW_FIFTHS,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: {
        vowel: 0.7,
        voice: 0.82,
        ensemble: 0.7,
        attack: 0.4,
        release: 1.8,
        tone: 2200,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave', params: { sub1: 0.35, up1: 0 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { breathDepth: 0, mix: 0.3 } },
    ],
  },
  {
    id: 'dispersed-parts-tenors-carry-the-tune',
    name: 'Tenors carry the tune',
    category: 'voice',
    description:
      'Tenors on a vowel between ah and eh, a fifth ringing above them from slow organ stops, dry and close.',
    preview: TENOR_ALONE,
    instrument: {
      deviceId: 'choir',
      preset: 'Tenors oh',
      params: {
        vowel: 0.13,
        voice: 0.95,
        motion: 0,
        vibrato: 10,
        ensemble: 0.6,
        attack: 0.1,
        release: 0.7,
        tone: 7000,
        width: 0.5,
        volume: -3,
      },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Open fifths',
        params: { sub: 0, octave: 0, twelfth: 0, fifteenth: 0, fifth: 0.6, speak: 350, mix: 0.6 },
      },
    ],
  },
  {
    id: 'dispersed-parts-trebles-straight-ee',
    name: 'Trebles straight ee',
    category: 'voice',
    description:
      'Small high voices on ee without any waver, pinched to a thin band, a bright chamber round them.',
    preview: UPPER_BENCHES,
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: {
        voice: 1.4,
        motion: 0,
        breath: 0.2,
        ensemble: 0.5,
        attack: 0.2,
        release: 1,
        tone: 12000,
        width: 0.6,
        volume: -2.5,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'dispersed-parts-voices-from-the-porch',
    name: 'Voices from the porch',
    category: 'voice',
    description:
      'A soft choir between oh and oo, in open air some way off, narrow, darker and moving nearer and away.',
    preview: HIGH_HELD,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow waver',
      params: {
        vowel: 0.88,
        voice: 1,
        vibrato: 15,
        vibratoRate: 4,
        ensemble: 0.9,
        attack: 0.5,
        release: 2,
        tone: 4500,
        volume: -7,
      },
    },
    effects: [{ deviceId: 'distance', preset: 'Open air', params: { distance: 0.5, wander: 0.6 } }],
  },
  {
    id: 'dispersed-parts-fuguing-ah',
    name: 'Fuguing Ah',
    category: 'voice',
    description:
      'A single singer on ah, joined every 1.2 seconds by one more: an octave below, a fifth above, then an octave above.',
    preview: FUGUE_SUBJECT,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: {
        vowel: 0.05,
        voice: 1,
        vibrato: 12,
        breath: 0.1,
        attack: 0.08,
        release: 0.5,
        volume: -3,
      },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Wide choir',
        params: {
          followers: 3,
          gap: 1.2,
          interval1: -12,
          interval2: 7,
          interval3: 12,
          fade: 0.15,
          crab: 0,
          round: 0,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'dispersed-parts-hum-before-the-words',
    name: 'Hum before the words',
    category: 'voice',
    description:
      'Closed humming under a low filter, its strongest partials drawn again as sines that linger after it.',
    preview: TUNE_IN_TENOR,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: {
        voice: 0.9,
        breath: 0,
        ensemble: 0.4,
        tone: 520,
        attack: 0.3,
        release: 1.2,
        volume: -9.5,
      },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Chord outline', params: { mix: 0.45 } }],
  },
  {
    id: 'dispersed-parts-syllables-first',
    name: 'Syllables first',
    category: 'voice',
    description:
      'Short breathy ah on every note, one syllable to each, with one dark slap of tape after it.',
    preview: PLAIN_TUNE,
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: {
        vowel: 0.03,
        voice: 0.96,
        breath: 0.5,
        ensemble: 0.95,
        attack: 0.03,
        release: 0.12,
        tone: 11000,
        width: 1,
        volume: -11,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Single slap',
        params: { time: 210, highCut: 2400, mix: 0.4 },
      },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'dispersed-parts-alto-eh-no-vibrato',
    name: 'Alto eh, no vibrato',
    category: 'voice',
    description:
      'Altos on a flat eh with the overtones turned up by a slow hand, mono and near, no room round them.',
    preview: TREBLE_PAIR,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: {
        vowel: 0.38,
        voice: 1.24,
        motion: 0,
        vibrato: 0,
        breath: 0.5,
        ensemble: 0,
        attack: 0.2,
        release: 0.5,
        tone: 9000,
        width: 0,
        volume: -6.5,
      },
    },
    effects: [{ deviceId: 'reveal', preset: 'Overtones', params: { amount: 0.7 } }],
  },
  {
    id: 'dispersed-parts-men-at-half-light',
    name: 'Men at half light',
    category: 'voice',
    description:
      'Men on ah under a low filter, breathed louder and softer every few seconds and swung slowly from side to side.',
    preview: LOW_FIFTHS,
    instrument: {
      deviceId: 'choir',
      preset: 'Basses ah',
      params: {
        vowel: 0.04,
        voice: 0.9,
        ensemble: 1,
        vibrato: 4,
        attack: 0.5,
        release: 1.6,
        tone: 1500,
        width: 1,
        volume: -5.5,
      },
    },
    effects: [
      { deviceId: 'breath', preset: 'Calm breath', params: { in: 1.6, out: 2.2, depth: 0.5 } },
      { deviceId: 'around', preset: 'Gentle sway' },
    ],
  },
  {
    id: 'dispersed-parts-sunday-at-a-distance',
    name: 'Sunday at a distance',
    category: 'voice',
    description:
      'A choir that rises over a second and a half, its attacks and edges smeared into one cloud, then sinking in pitch as it dies.',
    preview: TWO_HELD,
    instrument: {
      deviceId: 'choir',
      preset: 'Distant choir',
      params: { vowel: 0.2, breath: 0.7, attack: 1.5, release: 4, tone: 3200, volume: -9 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Wide drone' },
      { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'dispersed-parts-old-vowel-long-hall',
    name: 'Old vowel, long hall',
    category: 'voice',
    description:
      'Breath with hardly a voice in it, sung again by a hall whose tail is shaped to the same ah.',
    preview: DOUBLED_ACROSS,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: {
        vowel: 0.02,
        voice: 1.1,
        motion: 0.2,
        attack: 0.2,
        release: 1,
        tone: 12000,
        volume: -12,
      },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { decay: 5, mix: 0.6 } }],
  },

  // Clarinet: one reed for each part, from a hum to a blare, single and massed.
  {
    id: 'dispersed-parts-tune-on-one-reed',
    name: 'Tune on one reed',
    category: 'wind',
    description:
      'A straight breathy clarinet with the body of a much larger one, hollowed out in the middle and left dry.',
    preview: TENOR_ALONE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { blow: 0.35, breath: 0.65, attack: 0.18, release: 1.1, volume: -2 },
    },
    effects: [
      { deviceId: 'size', preset: 'Larger', params: { size: 0.7 } },
      { deviceId: 'ambient-eq', preset: 'Hollow' },
    ],
  },
  {
    id: 'dispersed-parts-reed-in-the-tenor',
    name: 'Reed in the tenor',
    category: 'wind',
    description:
      'A conical tenor reed with more breath than tone, the air spread wide and the tone left in the middle.',
    preview: TENOR_ALONE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { blow: 0.3, vibrato: 0, attack: 0.12, release: 0.7, volume: 1.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Wide air', params: { air: 5 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'dispersed-parts-reeds-in-open-fifths',
    name: 'Reeds in open fifths',
    category: 'wind',
    description:
      'A hollow reed with a second one a fifth above each note, both smeared by a thin veil of fog.',
    preview: TREBLE_TUNE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { bore: 0.2, blow: 0.4, breath: 0.35, attack: 0.15, release: 1, volume: -3 },
    },
    effects: [
      { deviceId: 'size', preset: 'Fifth beside', params: { mix: 0.5 } },
      { deviceId: 'fog', preset: 'Thin veil' },
    ],
  },
  {
    id: 'dispersed-parts-bass-reed-for-the-basses',
    name: 'Bass reed for the basses',
    category: 'bass',
    description:
      'A short rasping bass reed with a strong octave below it, low-passed, and a fast limiter lifting both.',
    preview: BASS_TUNE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: {
        bore: 0.45,
        blow: 0.75,
        breath: 0.1,
        growl: 0.3,
        attack: 0.04,
        release: 0.2,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0, sub1: 0.9, filter: 900 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'dispersed-parts-reed-entry-a-bar-late',
    name: 'Reed entry, a bar late',
    category: 'wind',
    description:
      'A tongued clarinet answered a fifth above after 1.2 seconds, and a fourth below after as long again.',
    preview: FUGUE_SUBJECT,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: { blow: 0.7, vibrato: 0, attack: 0.05, release: 0.3, volume: 1 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Canon at the fifth',
        params: {
          followers: 2,
          gap: 1.2,
          interval1: 7,
          interval2: -5,
          fade: 0.05,
          spread: 0.9,
          round: 0,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'dispersed-parts-four-reeds-four-tunes',
    name: 'Four reeds, four tunes',
    category: 'wind',
    description:
      'Reeds doubled sharp on one side and flat on the other, then thickened by a loose chorus.',
    preview: FOUR_ENTRIES,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Ballad alto',
      params: {
        bore: 0.5,
        blow: 0.6,
        breath: 0.2,
        vibrato: 0.1,
        attack: 0.05,
        release: 0.35,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider' },
      { deviceId: 'chorus', preset: 'Loose double' },
    ],
  },
  {
    id: 'dispersed-parts-low-reed-plank-wall',
    name: 'Low reed, plank wall',
    category: 'wind',
    description:
      'A fluttering reed that rasps under each note, through a combo amplifier and the boards of the room behind it.',
    preview: LOW_FIFTHS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { growl: 0.5, blow: 0.5, breath: 0.3, attack: 0.15, release: 0.7, volume: 0 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.2, room: 0.6 } }],
  },
  {
    id: 'dispersed-parts-treble-reed-far-bench',
    name: 'Treble reed, far bench',
    category: 'wind',
    description:
      'A bright soprano reed at the back of a hall, darkened by the air, with a faint short echo chorused to the sides.',
    preview: UPPER_BENCHES,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { blow: 0.5, vibrato: 0.05, attack: 0.12, release: 1, volume: -2 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Back of the hall' },
      { deviceId: 'analog-delay', preset: 'Faint halo' },
    ],
  },
  {
    id: 'dispersed-parts-straight-tone-reed',
    name: 'Straight tone reed',
    category: 'wind',
    description:
      'A reed blown at a hum without vibrato, whose octave and fifth stops rise slowly behind it into an organ.',
    preview: HIGH_HELD,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { blow: 0.15, breath: 0, attack: 0.15, release: 0.9, volume: -5.5 },
    },
    effects: [{ deviceId: 'stops', preset: 'Drone to organ', params: { speak: 1200, mix: 0.7 } }],
  },
  {
    id: 'dispersed-parts-reed-with-a-drone-under',
    name: 'Reed with a drone under',
    category: 'wind',
    description:
      'A reed of the duduk kind with slow vibrato, over four strings tuned in A that ring on as it moves.',
    preview: FUGUE_SUBJECT,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { blow: 0.5, breath: 0.4, vibrato: 0.35, attack: 0.12, release: 0.6, volume: -6 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Centre drone',
        params: { root: 9, mode: 1, decay: 6, mix: 0.45 },
      },
    ],
  },
  {
    id: 'dispersed-parts-whispered-tenor-part',
    name: 'Whispered tenor part',
    category: 'wind',
    description:
      'Air through a reed with almost no note in it, its quiet air lifted, with a long tank of three springs around it.',
    preview: TREBLE_PAIR,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { bore: 0.6, blow: 0.12, attack: 0.25, release: 1.2, volume: -10.5 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Air on top' },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'dispersed-parts-three-reeds-six-voices',
    name: 'Three reeds, six voices',
    category: 'pad',
    description:
      'Slow swelling tenor reeds with a soft string pad mostly an octave up growing out of the chord and staying after it.',
    preview: HIGH_HELD,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Tenor swell',
      params: { blow: 0.5, attack: 1, release: 2, vibrato: 0.1, volume: -4 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Octave halo', params: { rise: 0.8, mix: 0.5 } }],
  },
  {
    id: 'dispersed-parts-dusk-reed-bare-fifth',
    name: 'Dusk reed, bare fifth',
    category: 'pad',
    description:
      'A clarinet that comes from nothing and turns back, its tail climbing by fifths in a slow dim reverb.',
    preview: HIGH_HELD,
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { bore: 0.15, blow: 0.3, breath: 0.25, attack: 1.1, release: 2.5, volume: -6 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Narrow fifth',
        params: { decay: 6, shimmer: 0.3, mix: 0.45 },
      },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },

  // Pianos: felt, magnets and prepared strings give the same parts an attack.
  {
    id: 'dispersed-parts-piano-in-the-square',
    name: 'Piano in the square',
    category: 'keys',
    description:
      'A bare close piano with plain octaves added above and below each chord, a slap of a small room on it.',
    preview: PLAIN_TUNE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { hardness: 0.45, resonance: 0.2, reverbMix: 0, width: 0.8, outputDb: -15.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Organ', params: { sub1: 0.5, up1: 0.5, up2: 0 } },
      { deviceId: 'ether-reverb', preset: 'Slap room' },
    ],
  },
  {
    id: 'dispersed-parts-felt-under-the-hymn',
    name: 'Felt under the hymn',
    category: 'keys',
    description:
      'Felted hammers with the soft pedal down, a pad of dark cellos rising behind the chord they strike.',
    preview: NOT_ONE_THIRD,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { hardness: 0.3, thump: 0.3, grit: 0.05, soft: 1, reverbMix: 0.1, outputDb: -9.5 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Dark cellos', params: { rise: 1.2, mix: 0.5 } }],
  },
  {
    id: 'dispersed-parts-upright-left-open',
    name: 'Upright left open',
    category: 'keys',
    description:
      'An old upright out of tune with itself, creaking, taped on a cassette four-track with a heavy wow.',
    preview: TUNE_IN_TENOR,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { felt: 0.5, detune: 0.9, action: 0.7, outputDb: -17.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0.6 } },
      { deviceId: 'spread', preset: 'Narrow body' },
    ],
  },
  {
    id: 'dispersed-parts-octaves-across-the-room',
    name: 'Octaves across the room',
    category: 'keys',
    description:
      'Piano attacks taken away so the strings swell in, each note doubled an octave above and below, wide across the room.',
    preview: HIGH_HELD,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { felt: 0.2, resonance: 0.8, reverbMix: 0.3, outputDb: -11.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad' },
      {
        deviceId: 'octaves',
        preset: 'Hollow pair',
        params: { dry: 0.8, sub1: 0.4, up1: 0.45, detune: 0.3, spread: 1 },
      },
    ],
  },
  {
    id: 'dispersed-parts-keys-for-pitching',
    name: 'Keys for pitching',
    category: 'keys',
    description:
      'A hard glassy upright struck short, through a medium-wave radio with a little drift and no static.',
    preview: LINED_OUT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: {
        hardness: 0.8,
        stiffness: 1.2,
        damper: 1,
        resonance: 0,
        reverbMix: 0,
        outputDb: -12.5,
      },
    },
    effects: [
      { deviceId: 'radio', preset: 'Clean transistor', params: { static: 0, drift: 0.2 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'dispersed-parts-bare-fifths-pedal-down',
    name: 'Bare fifths, pedal down',
    category: 'keys',
    description:
      'A soft piano with the pedal never lifted, every chord hanging on in a cavern of short echoes.',
    preview: FIFTHS_WALK,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: { felt: 0.9, hardness: 0.15, resonance: 1, detune: 0.2, reverbMix: 0, outputDb: -15 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Faint scatter', params: { mix: 0.4 } }],
  },
  {
    id: 'dispersed-parts-strings-hold-the-part',
    name: 'Strings hold the part',
    category: 'keys',
    description:
      'Magnet-driven strings with no hammer, warm and dull, given the colour of a hollow tube and wandering slowly round the head.',
    preview: TUNE_IN_TENOR,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Dark wood',
      params: {
        bloom: 0.45,
        bright: 0.15,
        hammer: 0,
        damper: 1.6,
        body: 1,
        width: 0.9,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube' },
      { deviceId: 'around', preset: 'Slow wander' },
    ],
  },
  {
    id: 'dispersed-parts-fifth-sung-by-magnets',
    name: 'Fifth sung by magnets',
    category: 'keys',
    description:
      'The third harmonic of each string sung instead of the note, a twelfth up, in slow currents from side to side.',
    preview: LOW_FIFTHS,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Twelfth organ',
      params: { bloom: 0.5, bright: 0.3, shimmer: 0.5, damper: 1.6, width: 1, volume: -8 },
    },
    effects: [{ deviceId: 'currents', preset: 'Side to side' }],
  },
  {
    id: 'dispersed-parts-slow-part-bright-rim',
    name: 'Slow part, bright rim',
    category: 'pad',
    description:
      'A slow swell of wide beating strings, with small bright sparks of itself thrown off above and a faint glow of tail.',
    preview: TWO_HELD,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Wide shimmer',
      params: { bloom: 1.6, bright: 0.6, damper: 3, volume: -8 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Slow stars' },
      { deviceId: 'bloom-reverb', preset: 'Faint glow' },
    ],
  },
  {
    id: 'dispersed-parts-magnets-on-the-tenor',
    name: 'Magnets on the tenor',
    category: 'keys',
    description:
      'A felt stroke at full strength with the string sung quietly under it, restruck softly by a dotted tape echo.',
    preview: TENOR_ALONE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Soft hammer',
      params: { bloom: 0.8, bright: 0.2, hammer: 1, damper: 0.6, body: 0.5, volume: -6 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { feedback: 0.2, mix: 0.3 } },
    ],
  },
  {
    id: 'dispersed-parts-organ-made-of-wire',
    name: 'Organ made of wire',
    category: 'organ',
    description:
      'Strings sung an octave up, as quick to speak and stop as reeds, spun in a slow cabinet of horn and drum.',
    preview: FOUR_ENTRIES,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Quick reed',
      params: {
        harmonic: 2,
        bright: 0.9,
        sympathy: 0,
        body: 0.3,
        damper: 0.2,
        width: 0.2,
        volume: -12,
      },
    },
    effects: [{ deviceId: 'rotary', preset: 'Chorale' }],
  },
  {
    id: 'dispersed-parts-wooden-part-writing',
    name: 'Wooden part-writing',
    category: 'plucked',
    description:
      'Rubber between the strings turns the chords to soft wood, ringing on inside a small wooden body.',
    preview: NOT_ONE_THIRD,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Soft rubber',
      params: { amount: 0.7, hammer: 0.45, decay: 2, thud: 0.1, volume: 2.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 0.5, mix: 0.6 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'dispersed-parts-mallet-on-the-pew',
    name: 'Mallet on the pew',
    category: 'plucked',
    description:
      'Hard short wooden knocks at the pitch of each note, blurred for a few hundredths and left in a dark cave of three seconds.',
    preview: LINED_OUT,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Wood blocks',
      params: { amount: 0.6, decay: 0.8, thud: 0.3, tone: 0.8, volume: 6 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Short blur' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Dark cave',
        params: { breathDepth: 0, decay: 3, mix: 0.4 },
      },
    ],
  },
  {
    id: 'dispersed-parts-bolts-in-the-treble',
    name: 'Bolts in the treble',
    category: 'bell',
    description:
      'Light bolts give every string a small gong, with strings tuned in A minor ringing along in sympathy.',
    preview: TREBLE_PAIR,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Light bolts',
      params: { position: 0.33, hammer: 0.3, decay: 1.8, rattle: 0, volume: -2.5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Long ring', params: { root: 9, mode: 1, mix: 0.4 } },
    ],
  },
  {
    id: 'dispersed-parts-paper-in-the-hymnal',
    name: 'Paper in the hymnal',
    category: 'keys',
    description:
      'Paper buzzing on the strings under a half-dark filter, with a dark echo that dulls and fades as it repeats.',
    preview: TUNE_IN_TENOR,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper buzz',
      params: { amount: 0.5, hammer: 0.35, decay: 1.6, tone: 0.45, volume: -4 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 700, feedback: 0.25, mix: 0.3 },
      },
    ],
  },
  {
    id: 'dispersed-parts-felted-bass-line',
    name: 'Felted bass line',
    category: 'bass',
    description:
      'Felt between the bass strings and a soft hammer, weighted on tape and held up by slow compression.',
    preview: BASS_TUNE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt whisper',
      params: {
        amount: 0.4,
        hammer: 0.25,
        decay: 2.5,
        thud: 0.1,
        tone: 0.5,
        width: 0.2,
        volume: -18.5,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      { deviceId: 'ambient-comp', preset: 'Long sustain' },
    ],
  },

  // Thesis, feedback and still point: the same open chords as bands of noise, wire and slow beats.
  {
    id: 'dispersed-parts-breath-around-a',
    name: 'Breath around A',
    category: 'pad',
    description:
      'Breathy noise bands mirrored round A on five notes, each swelling in turn, with a medium plate behind.',
    preview: FIFTHS_WALK,
    instrument: {
      deviceId: 'thesis',
      preset: 'Pentatonic Breath',
      params: {
        center: 57,
        resonance: 22,
        width: 90,
        attack: 0.25,
        release: 1.6,
        breatheRate: 0.5,
      },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 5.5 } },
    ],
  },
  {
    id: 'dispersed-parts-mirror-of-the-tune',
    name: 'Mirror of the tune',
    category: 'texture',
    description:
      'A tune and its reflection round E, ringing at clear pitch with no octave copies, then pushed on to warm tape.',
    preview: TENOR_ALONE,
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: {
        center: 64,
        resonance: 80,
        width: 100,
        attack: 0.1,
        release: 1,
        mode: 0,
        scale: 9,
        root: 0,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { output: 5.5 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'dispersed-parts-noise-sung-open',
    name: 'Noise sung open',
    category: 'voice',
    description:
      'Soft wide bands of noise pressed through a round vowel, so the mirrored chord seems half sung.',
    preview: TWO_HELD,
    instrument: {
      deviceId: 'thesis',
      preset: 'Gravity Well',
      params: {
        center: 57,
        resonance: 12,
        width: 100,
        attack: 0.5,
        release: 2.5,
        mode: 2,
        breatheRate: 0.15,
        strum: 0,
        middleEnabled: 0,
        scale: 9,
        root: 0,
      },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel', params: { amount: 1.4 } },
      { deviceId: 'saturator', preset: 'Soft tape warmth', params: { outputDb: -14 } },
    ],
  },
  {
    id: 'dispersed-parts-four-parts-of-wind',
    name: 'Four parts of wind',
    category: 'texture',
    description:
      'Each note strummed out into its mirror, its octave and a held centre, then moved about by the gusts of a dry wind.',
    preview: BASS_TUNE,
    instrument: {
      deviceId: 'thesis',
      preset: 'Fixed Full Stack',
      params: {
        center: 62,
        resonance: 45,
        width: 85,
        attack: 0.02,
        release: 2,
        strum: 90,
        middleEnabled: 0,
        mirrorMiddleEnabled: 0,
        centerEnabled: 1,
        scale: 9,
        root: 0,
      },
    },
    effects: [
      { deviceId: 'weather', preset: 'Dry gusts', params: { voice: 0.15 } },
      { deviceId: 'ambient-comp', preset: 'Level', params: { makeup: 5 } },
    ],
  },
  {
    id: 'dispersed-parts-wire-takes-the-tenor',
    name: 'Wire takes the tenor',
    category: 'string',
    description:
      'A wire caught by its amplifier on the note itself, round and steady, with a late slow vibrato.',
    preview: TENOR_ALONE,
    instrument: {
      deviceId: 'feedback',
      preset: 'Dark sustain',
      params: { gain: 0.8, bloom: 0.2, pick: 0.3, damp: 0.6, release: 0.8, volume: -12 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'dispersed-parts-amplifier-on-the-bench',
    name: 'Amplifier on the bench',
    category: 'organ',
    description:
      'Reedy strings torn by a small amplifier, each chord quick to start and stop, narrow through a dark woolly speaker.',
    preview: ENTRIES_APART,
    instrument: {
      deviceId: 'feedback',
      preset: 'Reed tone',
      params: { grit: 0.5, crowd: 0.1, damp: 0.5, width: 0.2, release: 0.4, volume: -15 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Dark and woolly' }],
  },
  {
    id: 'dispersed-parts-twelfth-over-the-bass',
    name: 'Twelfth over the bass',
    category: 'string',
    description:
      'A low string that feeds back a pure twelfth above itself, twelve stars of echo scattered after each note.',
    preview: BASS_TUNE,
    instrument: {
      deviceId: 'feedback',
      preset: 'Pure twelfth',
      params: { bloom: 0.5, pick: 0.5, damp: 0.3, release: 1.5, volume: -10 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Faint points', params: { stars: 12 } }],
  },
  {
    id: 'dispersed-parts-string-past-the-window',
    name: 'String past the window',
    category: 'drone',
    description:
      'A string swelling out of amplifier hum with its overtones changing hands, heard under slow heavy cloud and a faint fuzzy wash.',
    preview: TWO_HELD,
    instrument: {
      deviceId: 'feedback',
      preset: 'Drifting air',
      params: { distance: 2.5, bloom: 1, pick: 0, crowd: 0.2, damp: 0.5, release: 3, volume: -5 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Overcast' },
      { deviceId: 'haze', preset: 'Faint warmth' },
    ],
  },
  {
    id: 'dispersed-parts-beat-between-two-parts',
    name: 'Beat between two parts',
    category: 'drone',
    description:
      'Warm held tones with one sine passing slowly through them, beating fast, then still, then fast again.',
    preview: TWO_HELD,
    instrument: {
      deviceId: 'still-point',
      preset: 'Warm crossing',
      params: {
        time: 12,
        reach: 2,
        warmth: 0.9,
        level: 0.7,
        attack: 0.4,
        release: 2,
        volume: -5.5,
      },
    },
    effects: [
      { deviceId: 'spread', preset: 'Firm and airy' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'dispersed-parts-pitch-pipe-held',
    name: 'Pitch pipe held',
    category: 'organ',
    description:
      'Short plain tones that speak in a few hundredths, on organ stops at the octave and twelfth, the sweeping sine faint.',
    preview: FIFTHS_WALK,
    instrument: {
      deviceId: 'still-point',
      preset: 'Short tones',
      params: { warmth: 0.5, level: 0.15, attack: 0.04, release: 0.4, volume: -9 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Principal chorus', params: { sub: 0, fifth: 0, fifteenth: 0 } },
    ],
  },
  {
    id: 'dispersed-parts-slow-tuning-of-the-bench',
    name: 'Slow tuning of the bench',
    category: 'drone',
    description:
      'Pure tones mostly in one ear and the sweeping sine in the other, blended with a slow rotary cabinet just under the water.',
    preview: TWO_HELD,
    instrument: {
      deviceId: 'still-point',
      preset: 'Half split',
      params: {
        time: 30,
        reach: 0.4,
        ears: 0.7,
        warmth: 0,
        level: 0.9,
        attack: 1,
        release: 3.5,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend' },
      { deviceId: 'underwater', preset: 'A toe in' },
    ],
  },
]
