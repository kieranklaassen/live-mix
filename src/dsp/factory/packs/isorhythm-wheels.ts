import { type FactoryPreset, type Phrase } from '../types'

// Isorhythm: a rhythm of one length (the talea) on a row of notes of another (the color), so each
// turn puts a new note on the beat. Every phrase here is such a wheel, and all but two of them come
// round. The hundred were laid out by attack (struck, soft, rolled, rubbed, swelled) and by decay.

// The whole wheel in 6.7 s: a talea of five (1.5 0.5 1 2 1) carries a color of four, A E D C, through
// twenty attacks in five turns of the notes and four of the rhythm. Below, two fours on A E D close in six.
const WHOLE_TURN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.399, note: 69, gain: 0.6 },
    { atSec: 0, durSec: 1.086, note: 45, gain: 0.5 },
    { atSec: 0.42, durSec: 0.133, note: 76, gain: 0.46 },
    { atSec: 0.56, durSec: 0.266, note: 74, gain: 0.52 },
    { atSec: 0.84, durSec: 0.532, note: 72, gain: 0.58 },
    { atSec: 1.12, durSec: 1.086, note: 52, gain: 0.5 },
    { atSec: 1.4, durSec: 0.266, note: 69, gain: 0.5 },
    { atSec: 1.68, durSec: 0.399, note: 76, gain: 0.6 },
    { atSec: 2.1, durSec: 0.133, note: 74, gain: 0.46 },
    { atSec: 2.24, durSec: 0.266, note: 72, gain: 0.52 },
    { atSec: 2.24, durSec: 1.086, note: 50, gain: 0.5 },
    { atSec: 2.52, durSec: 0.532, note: 69, gain: 0.58 },
    { atSec: 3.08, durSec: 0.266, note: 76, gain: 0.5 },
    { atSec: 3.36, durSec: 0.399, note: 74, gain: 0.6 },
    { atSec: 3.36, durSec: 1.086, note: 45, gain: 0.5 },
    { atSec: 3.78, durSec: 0.133, note: 72, gain: 0.46 },
    { atSec: 3.92, durSec: 0.266, note: 69, gain: 0.52 },
    { atSec: 4.2, durSec: 0.532, note: 76, gain: 0.58 },
    { atSec: 4.48, durSec: 1.086, note: 52, gain: 0.5 },
    { atSec: 4.76, durSec: 0.266, note: 74, gain: 0.5 },
    { atSec: 5.04, durSec: 0.399, note: 72, gain: 0.6 },
    { atSec: 5.46, durSec: 0.133, note: 69, gain: 0.46 },
    { atSec: 5.6, durSec: 0.266, note: 76, gain: 0.52 },
    { atSec: 5.6, durSec: 1.086, note: 50, gain: 0.5 },
    { atSec: 5.88, durSec: 0.532, note: 74, gain: 0.58 },
    { atSec: 6.44, durSec: 0.266, note: 72, gain: 0.5 },
  ],
}
// The first half of that wheel, slower, for what rings: two turns of the rhythm. The
// longest note is C the first time and A the second; the lower voice has been round its three notes once.
const HALF_TURN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.728, note: 69, gain: 0.58 },
    { atSec: 0, durSec: 1.94, note: 57, gain: 0.46 },
    { atSec: 0.75, durSec: 0.242, note: 76, gain: 0.44 },
    { atSec: 1, durSec: 0.485, note: 74, gain: 0.5 },
    { atSec: 1.5, durSec: 0.97, note: 72, gain: 0.56 },
    { atSec: 2, durSec: 1.94, note: 64, gain: 0.46 },
    { atSec: 2.5, durSec: 0.485, note: 69, gain: 0.48 },
    { atSec: 3, durSec: 0.728, note: 76, gain: 0.58 },
    { atSec: 3.75, durSec: 0.242, note: 74, gain: 0.44 },
    { atSec: 4, durSec: 0.485, note: 72, gain: 0.5 },
    { atSec: 4, durSec: 1.94, note: 62, gain: 0.46 },
    { atSec: 4.5, durSec: 0.97, note: 69, gain: 0.56 },
    { atSec: 5.5, durSec: 0.485, note: 76, gain: 0.48 },
  ],
}
// A pentatonic wheel: color E A B G D under a talea of 3 + 2. Ten attacks, five turns of the rhythm,
// and each note is long once and short once.
const FIVE_NOTES_LONG_SHORT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.757, note: 52, gain: 0.6 },
    { atSec: 0.78, durSec: 0.504, note: 57, gain: 0.48 },
    { atSec: 1.3, durSec: 0.757, note: 59, gain: 0.6 },
    { atSec: 2.08, durSec: 0.504, note: 55, gain: 0.48 },
    { atSec: 2.6, durSec: 0.757, note: 62, gain: 0.6 },
    { atSec: 3.38, durSec: 0.504, note: 52, gain: 0.48 },
    { atSec: 3.9, durSec: 0.757, note: 57, gain: 0.6 },
    { atSec: 4.68, durSec: 0.504, note: 59, gain: 0.48 },
    { atSec: 5.2, durSec: 0.757, note: 55, gain: 0.6 },
    { atSec: 5.98, durSec: 0.504, note: 62, gain: 0.48 },
  ],
}
// In 7/8, a talea of four (2 2 1 2) with a color of three, D A E: each of the three stands on each place
// of the bar once in three bars. The lower voice, one note a bar, goes down D A G.
const SEVEN_EIGHTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.551, note: 74, gain: 0.6 },
    { atSec: 0, durSec: 1.969, note: 62, gain: 0.5 },
    { atSec: 0.58, durSec: 0.551, note: 69, gain: 0.46 },
    { atSec: 1.16, durSec: 0.275, note: 76, gain: 0.42 },
    { atSec: 1.45, durSec: 0.551, note: 74, gain: 0.5 },
    { atSec: 2.03, durSec: 0.551, note: 69, gain: 0.6 },
    { atSec: 2.03, durSec: 1.969, note: 57, gain: 0.5 },
    { atSec: 2.61, durSec: 0.551, note: 76, gain: 0.46 },
    { atSec: 3.19, durSec: 0.275, note: 74, gain: 0.42 },
    { atSec: 3.48, durSec: 0.551, note: 69, gain: 0.5 },
    { atSec: 4.06, durSec: 0.551, note: 76, gain: 0.6 },
    { atSec: 4.06, durSec: 1.969, note: 55, gain: 0.5 },
    { atSec: 4.64, durSec: 0.551, note: 74, gain: 0.46 },
    { atSec: 5.22, durSec: 0.275, note: 69, gain: 0.42 },
    { atSec: 5.51, durSec: 0.551, note: 76, gain: 0.5 },
  ],
}
// A color of three chords, A minor 7, F major 9, D minor 7, under a talea of 4 + 3: long Am, short F,
// long D, then short Am, long F, short D, and it closes.
const CHORDS_ON_TWO: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.294, note: 57, gain: 0.42 },
    { atSec: 0, durSec: 1.294, note: 60, gain: 0.42 },
    { atSec: 0, durSec: 1.294, note: 64, gain: 0.42 },
    { atSec: 0, durSec: 1.294, note: 67, gain: 0.42 },
    { atSec: 1.32, durSec: 0.97, note: 53, gain: 0.36 },
    { atSec: 1.32, durSec: 0.97, note: 57, gain: 0.36 },
    { atSec: 1.32, durSec: 0.97, note: 64, gain: 0.36 },
    { atSec: 1.32, durSec: 0.97, note: 67, gain: 0.36 },
    { atSec: 2.31, durSec: 1.294, note: 50, gain: 0.42 },
    { atSec: 2.31, durSec: 1.294, note: 57, gain: 0.42 },
    { atSec: 2.31, durSec: 1.294, note: 60, gain: 0.42 },
    { atSec: 2.31, durSec: 1.294, note: 65, gain: 0.42 },
    { atSec: 3.63, durSec: 0.97, note: 57, gain: 0.36 },
    { atSec: 3.63, durSec: 0.97, note: 60, gain: 0.36 },
    { atSec: 3.63, durSec: 0.97, note: 64, gain: 0.36 },
    { atSec: 3.63, durSec: 0.97, note: 67, gain: 0.36 },
    { atSec: 4.62, durSec: 1.294, note: 53, gain: 0.42 },
    { atSec: 4.62, durSec: 1.294, note: 57, gain: 0.42 },
    { atSec: 4.62, durSec: 1.294, note: 64, gain: 0.42 },
    { atSec: 4.62, durSec: 1.294, note: 67, gain: 0.42 },
    { atSec: 5.94, durSec: 0.97, note: 50, gain: 0.36 },
    { atSec: 5.94, durSec: 0.97, note: 57, gain: 0.36 },
    { atSec: 5.94, durSec: 0.97, note: 60, gain: 0.36 },
    { atSec: 5.94, durSec: 0.97, note: 65, gain: 0.36 },
  ],
}
// Two voices that close together after fifteen beats: above, a talea of four (2 1 1 1) on E C B, twelve
// attacks; below, 3 + 2 on A E D, six.
const PAIR_CLOSING: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.806, note: 64, gain: 0.54 },
    { atSec: 0, durSec: 1.222, note: 45, gain: 0.5 },
    { atSec: 0.84, durSec: 0.403, note: 72, gain: 0.46 },
    { atSec: 1.26, durSec: 0.403, note: 71, gain: 0.46 },
    { atSec: 1.26, durSec: 0.815, note: 52, gain: 0.5 },
    { atSec: 1.68, durSec: 0.403, note: 64, gain: 0.44 },
    { atSec: 2.1, durSec: 0.806, note: 72, gain: 0.54 },
    { atSec: 2.1, durSec: 1.222, note: 50, gain: 0.5 },
    { atSec: 2.94, durSec: 0.403, note: 71, gain: 0.46 },
    { atSec: 3.36, durSec: 0.403, note: 64, gain: 0.46 },
    { atSec: 3.36, durSec: 0.815, note: 45, gain: 0.5 },
    { atSec: 3.78, durSec: 0.403, note: 72, gain: 0.44 },
    { atSec: 4.2, durSec: 0.806, note: 71, gain: 0.54 },
    { atSec: 4.2, durSec: 1.222, note: 52, gain: 0.5 },
    { atSec: 5.04, durSec: 0.403, note: 64, gain: 0.46 },
    { atSec: 5.46, durSec: 0.403, note: 72, gain: 0.46 },
    { atSec: 5.46, durSec: 0.815, note: 50, gain: 0.5 },
    { atSec: 5.88, durSec: 0.403, note: 71, gain: 0.44 },
  ],
}
// For slow voices. The tenor: a talea of 4 + 2 on A E D, six long notes. Above it one dyad to nine units,
// E G and then C B, so the two change against the tenor and never with it but at the start.
const SLOW_TENOR: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.49, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 3.352, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 3.352, note: 67, gain: 0.4 },
    { atSec: 1.52, durSec: 0.745, note: 52, gain: 0.44 },
    { atSec: 2.28, durSec: 1.49, note: 50, gain: 0.5 },
    { atSec: 3.42, durSec: 3.352, note: 60, gain: 0.4 },
    { atSec: 3.42, durSec: 3.352, note: 71, gain: 0.4 },
    { atSec: 3.8, durSec: 0.745, note: 45, gain: 0.44 },
    { atSec: 4.56, durSec: 1.49, note: 52, gain: 0.5 },
    { atSec: 6.08, durSec: 0.745, note: 50, gain: 0.44 },
  ],
}
// Bells alone: a talea of three (3 2 2) on a color of four, A D C G. Twelve strokes, four bars of seven.
const TWELVE_STROKES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.627, note: 81, gain: 0.6 },
    { atSec: 0.66, durSec: 0.418, note: 86, gain: 0.48 },
    { atSec: 1.1, durSec: 0.418, note: 84, gain: 0.48 },
    { atSec: 1.54, durSec: 0.627, note: 79, gain: 0.6 },
    { atSec: 2.2, durSec: 0.418, note: 81, gain: 0.48 },
    { atSec: 2.64, durSec: 0.418, note: 86, gain: 0.48 },
    { atSec: 3.08, durSec: 0.627, note: 84, gain: 0.6 },
    { atSec: 3.74, durSec: 0.418, note: 79, gain: 0.48 },
    { atSec: 4.18, durSec: 0.418, note: 81, gain: 0.48 },
    { atSec: 4.62, durSec: 0.627, note: 86, gain: 0.6 },
    { atSec: 5.28, durSec: 0.418, note: 84, gain: 0.48 },
    { atSec: 5.72, durSec: 0.418, note: 79, gain: 0.48 },
  ],
}
// The smallest wheel: a talea of three (3 1 2) on two notes. A E A, and the second time round E A E.
// Under each turn one held note, A and then D.
const SIX_STROKES: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.455, note: 69, gain: 0.58 },
    { atSec: 0, durSec: 2.91, note: 57, gain: 0.46 },
    { atSec: 1.5, durSec: 0.485, note: 76, gain: 0.42 },
    { atSec: 2, durSec: 0.97, note: 69, gain: 0.5 },
    { atSec: 3, durSec: 1.455, note: 76, gain: 0.58 },
    { atSec: 3, durSec: 2.91, note: 62, gain: 0.46 },
    { atSec: 4.5, durSec: 0.485, note: 69, gain: 0.42 },
    { atSec: 5, durSec: 0.97, note: 76, gain: 0.5 },
  ],
}
// A talea of five in eight (3 1 2 1 1) on a color of three, C E B: fifteen attacks, three turns. Each turn
// has two held notes below: the three are an added ninth on A, a sharp eleventh on F, a thirteenth on D.
const FIFTEEN_OVER_THREE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.769, note: 72, gain: 0.58 },
    { atSec: 0, durSec: 2.095, note: 57, gain: 0.42 },
    { atSec: 0, durSec: 2.095, note: 64, gain: 0.42 },
    { atSec: 0.81, durSec: 0.257, note: 76, gain: 0.42 },
    { atSec: 1.08, durSec: 0.513, note: 71, gain: 0.52 },
    { atSec: 1.62, durSec: 0.257, note: 72, gain: 0.44 },
    { atSec: 1.89, durSec: 0.257, note: 76, gain: 0.42 },
    { atSec: 2.16, durSec: 0.769, note: 71, gain: 0.58 },
    { atSec: 2.16, durSec: 2.095, note: 65, gain: 0.42 },
    { atSec: 2.16, durSec: 2.095, note: 69, gain: 0.42 },
    { atSec: 2.97, durSec: 0.257, note: 72, gain: 0.42 },
    { atSec: 3.24, durSec: 0.513, note: 76, gain: 0.52 },
    { atSec: 3.78, durSec: 0.257, note: 71, gain: 0.44 },
    { atSec: 4.05, durSec: 0.257, note: 72, gain: 0.42 },
    { atSec: 4.32, durSec: 0.769, note: 76, gain: 0.58 },
    { atSec: 4.32, durSec: 2.095, note: 62, gain: 0.42 },
    { atSec: 4.32, durSec: 2.095, note: 69, gain: 0.42 },
    { atSec: 5.13, durSec: 0.257, note: 71, gain: 0.42 },
    { atSec: 5.4, durSec: 0.513, note: 72, gain: 0.52 },
    { atSec: 5.94, durSec: 0.257, note: 76, gain: 0.44 },
    { atSec: 6.21, durSec: 0.257, note: 71, gain: 0.42 },
  ],
}
// A line alone: 3 + 2 on D A G, six attacks, then the same wheel again in halved values.
const DIMINUTION: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.864, note: 62, gain: 0.6 },
    { atSec: 0.9, durSec: 0.576, note: 69, gain: 0.5 },
    { atSec: 1.5, durSec: 0.864, note: 67, gain: 0.6 },
    { atSec: 2.4, durSec: 0.576, note: 62, gain: 0.5 },
    { atSec: 3, durSec: 0.864, note: 69, gain: 0.6 },
    { atSec: 3.9, durSec: 0.576, note: 67, gain: 0.5 },
    { atSec: 4.5, durSec: 0.423, note: 62, gain: 0.54 },
    { atSec: 4.95, durSec: 0.282, note: 69, gain: 0.46 },
    { atSec: 5.25, durSec: 0.423, note: 67, gain: 0.54 },
    { atSec: 5.7, durSec: 0.282, note: 62, gain: 0.46 },
    { atSec: 6, durSec: 0.423, note: 69, gain: 0.54 },
    { atSec: 6.45, durSec: 0.282, note: 67, gain: 0.46 },
  ],
}
// The chord wheel for what speaks slowly: F major 7, G add 9, C add 9 over E under a talea of 4 + 3, twice
// round. F is long the first time and short the second, and each chord keeps one note of the chord before.
const CHORDS_FOR_SLOW_BOWS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.901, note: 53, gain: 0.42 },
    { atSec: 0, durSec: 1.901, note: 60, gain: 0.42 },
    { atSec: 0, durSec: 1.901, note: 64, gain: 0.42 },
    { atSec: 0, durSec: 1.901, note: 69, gain: 0.42 },
    { atSec: 1.96, durSec: 1.425, note: 55, gain: 0.38 },
    { atSec: 1.96, durSec: 1.425, note: 59, gain: 0.38 },
    { atSec: 1.96, durSec: 1.425, note: 62, gain: 0.38 },
    { atSec: 1.96, durSec: 1.425, note: 69, gain: 0.38 },
    { atSec: 3.43, durSec: 1.901, note: 52, gain: 0.42 },
    { atSec: 3.43, durSec: 1.901, note: 60, gain: 0.42 },
    { atSec: 3.43, durSec: 1.901, note: 62, gain: 0.42 },
    { atSec: 3.43, durSec: 1.901, note: 67, gain: 0.42 },
    { atSec: 5.39, durSec: 1.425, note: 53, gain: 0.38 },
    { atSec: 5.39, durSec: 1.425, note: 60, gain: 0.38 },
    { atSec: 5.39, durSec: 1.425, note: 64, gain: 0.38 },
    { atSec: 5.39, durSec: 1.425, note: 69, gain: 0.38 },
  ],
}
// Small bars, two voices, both high. Above, a talea of 5 + 3 on E D C; below, 5 4 3 on G A.
// Six attacks each, and they close together after twenty-four units.
const SMALL_TEETH: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.33, note: 79, gain: 0.5 },
    { atSec: 0, durSec: 1.33, note: 88, gain: 0.56 },
    { atSec: 1.4, durSec: 1.064, note: 81, gain: 0.44 },
    { atSec: 1.4, durSec: 0.798, note: 86, gain: 0.48 },
    { atSec: 2.24, durSec: 1.33, note: 84, gain: 0.56 },
    { atSec: 2.52, durSec: 0.798, note: 79, gain: 0.44 },
    { atSec: 3.36, durSec: 1.33, note: 81, gain: 0.5 },
    { atSec: 3.64, durSec: 0.798, note: 88, gain: 0.48 },
    { atSec: 4.48, durSec: 1.33, note: 86, gain: 0.56 },
    { atSec: 4.76, durSec: 1.064, note: 79, gain: 0.44 },
    { atSec: 5.88, durSec: 0.798, note: 81, gain: 0.44 },
    { atSec: 5.88, durSec: 0.798, note: 84, gain: 0.48 },
  ],
}
// For what is rubbed or fades in, from A3 up: 3 + 2 on C B E, six notes, over two held pairs, A G and then
// D F. The same C B E is a minor ninth on A, and a D minor 13.
const HELD_RIM: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.35, note: 57, gain: 0.4 },
    { atSec: 0, durSec: 3.35, note: 67, gain: 0.36 },
    { atSec: 0, durSec: 1.326, note: 72, gain: 0.5 },
    { atSec: 1.368, durSec: 0.884, note: 71, gain: 0.44 },
    { atSec: 2.28, durSec: 1.326, note: 76, gain: 0.5 },
    { atSec: 3.42, durSec: 3.35, note: 62, gain: 0.4 },
    { atSec: 3.42, durSec: 3.35, note: 65, gain: 0.36 },
    { atSec: 3.648, durSec: 0.884, note: 72, gain: 0.44 },
    { atSec: 4.56, durSec: 1.326, note: 71, gain: 0.5 },
    { atSec: 5.928, durSec: 0.884, note: 76, gain: 0.44 },
  ],
}
// The bass alone, one note at a time: a talea of two (5 + 3) on a color of three, A E D. Each is long once and
// short once, and the sixth attack closes it.
const LOW_WHEEL: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.33, note: 45, gain: 0.6 },
    { atSec: 1.4, durSec: 0.798, note: 40, gain: 0.5 },
    { atSec: 2.24, durSec: 1.33, note: 38, gain: 0.6 },
    { atSec: 3.64, durSec: 0.798, note: 45, gain: 0.5 },
    { atSec: 4.48, durSec: 1.33, note: 40, gain: 0.6 },
    { atSec: 5.88, durSec: 0.798, note: 38, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'isorhythm-wheels-talea-in-ash-wood',
    name: 'Talea in ash wood',
    category: 'bell',
    description:
      'Wooden bars of under a second, struck with a soft head inside a wooden body, limited hard, in a tight chamber.',
    preview: WHOLE_TURN,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: {
        decay: 0.9,
        hardness: 0.35,
        damping: 0.7,
        position: 0.3,
        brightness: 0.35,
        volume: 1,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 1.4, mix: 0.55 } },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { inputGain: 20, outputGain: 0 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'isorhythm-wheels-clapper-on-a-cartwheel',
    name: 'Clapper on a cartwheel',
    category: 'bell',
    description:
      'A church bell cut to two seconds and struck hard, its ring splashed into a slack spring.',
    preview: HALF_TURN,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { decay: 2, damping: 0.85, hardness: 0.95, release: 0.6, detune: 2.5, volume: -2 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.32, drip: 0.5 } },
    ],
  },
  {
    id: 'isorhythm-wheels-cog-of-tapped-glass',
    name: 'Cog of tapped glass',
    category: 'bell',
    description:
      'Tapped glass that dies in a second, with clean even echoes after it, opened to the sides.',
    preview: TWELVE_STROKES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { decay: 1, damping: 0.5, hardness: 0.9, brightness: 0.85, volume: -0.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { time: 440, mix: 0.3, feedback: 0.4 },
      },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'isorhythm-wheels-long-hub-of-bronze',
    name: 'Long hub of bronze',
    category: 'bell',
    description:
      'A soft-struck gong of nearly forty seconds, its modes drawn closer, darkened and left in a deep well of echoes.',
    preview: SIX_STROKES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: {
        decay: 38,
        hardness: 0.12,
        damping: 0.7,
        brightness: 0.35,
        detune: 2.5,
        stretch: 0.85,
        volume: 5,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1500, low: 2 } },
      { deviceId: 'swarm-reverb', preset: 'Dark well' },
    ],
  },
  {
    id: 'isorhythm-wheels-rubbed-rim-turning',
    name: 'Rubbed rim turning',
    category: 'drone',
    description:
      'A rubbed bowl held by the key, a narrow resonance wandering through its overtones as it circles the head.',
    preview: HELD_RIM,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { decay: 14, brightness: 0.8, detune: 1.4 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'Slow wander',
        params: { pace: 0.5, glide: 1200, mix: 0.8 },
      },
      { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.35, radius: 1 } },
    ],
  },
  {
    id: 'isorhythm-wheels-bellows-under-chimes',
    name: 'Bellows under chimes',
    category: 'pad',
    description:
      'Chime bars kept ringing while held, their strike taken off so each note fades in, in a hall with a long airy tail.',
    preview: HELD_RIM,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: {
        sustain: 0.85,
        hardness: 0.4,
        brightness: 0.5,
        damping: 0.3,
        decay: 10,
        volume: -7.5,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 520 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'isorhythm-wheels-thumbed-spoke',
    name: 'Thumbed spoke',
    category: 'plucked',
    description:
      'A kalimba of just over a second with a phaser that flips between two colours about once a second.',
    preview: FIFTEEN_OVER_THREE,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 1.2, hardness: 0.75, brightness: 0.6, volume: 3 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Two-tone flip',
        params: { rate: 1.1, depth: 50, feedback: 30 },
      },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'isorhythm-wheels-vibes-below-the-sluice',
    name: 'Vibes below the sluice',
    category: 'bell',
    description:
      'Vibraphone bars, rung for six seconds and dipped just under shallow moving water.',
    preview: HALF_TURN,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { decay: 6, hardness: 0.2, detune: 0.8, release: 0.3, volume: -2.5 },
    },
    effects: [
      {
        deviceId: 'underwater',
        preset: 'Just under',
        params: { waver: 0.4, bubbles: 0.1, depth: 0.3 },
      },
      { deviceId: 'stereo-detune', preset: 'Wider' },
    ],
  },
  {
    id: 'isorhythm-wheels-bell-beneath-the-axle',
    name: 'Bell beneath the axle',
    category: 'bell',
    description:
      'A church bell of eight seconds moved down an octave and made a little larger, in a dark hall.',
    preview: SIX_STROKES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: {
        decay: 8,
        hardness: 0.35,
        damping: 0.5,
        brightness: 0.4,
        release: 0.2,
        volume: 2.5,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'Octave below', params: { size: 0.15 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'isorhythm-wheels-hoop-of-bowed-glass',
    name: 'Hoop of bowed glass',
    category: 'pad',
    description:
      'A glass harp held by the key, widened by three slow chorus voices, with a quiet octave rising in its tail.',
    preview: HELD_RIM,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { detune: 2.4, brightness: 0.3, hardness: 0.05 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { depth: 70 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'isorhythm-wheels-pegs-on-a-stopped-bar',
    name: 'Pegs on a stopped bar',
    category: 'bell',
    description:
      'Chime bars damped to a third of a second and clicked hard, each held to a short gated room.',
    preview: SEVEN_EIGHTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 0.35, damping: 1, hardness: 1, brightness: 0.4, release: 0.8, volume: 5.5 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.5, mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'isorhythm-wheels-music-box-in-a-mill',
    name: 'Music box in a mill',
    category: 'bell',
    description:
      'A music box of two seconds shrunk to a smaller body and worn down on a slow warped record.',
    preview: TWELVE_STROKES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 2.2, hardness: 0.6, volume: 2.5 },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller', params: { size: -0.6 } },
      { deviceId: 'vinyl', preset: 'Slow platter', params: { crackle: 0.15 } },
    ],
  },
  {
    id: 'isorhythm-wheels-ratchet-in-bent-bronze',
    name: 'Ratchet in bent bronze',
    category: 'bell',
    description:
      'A gong with its modes squeezed together and cut to two seconds, ring modulated on A and its fifth.',
    preview: FIFTEEN_OVER_THREE,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { decay: 2, stretch: 0.65, hardness: 0.4, damping: 0.6, release: 0.4, volume: 6 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Fifth halo', params: { root: 9, mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'isorhythm-wheels-fourth-turn-far-tower',
    name: 'Fourth turn, far tower',
    category: 'bell',
    description:
      'A distant church bell, dull and slow to die, smeared into a hanging mist that outlasts every stroke.',
    preview: SIX_STROKES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Distant bell',
      params: { decay: 24, brightness: 0.2, volume: 3.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.5 } },
      { deviceId: 'distance', preset: 'Across the room' },
    ],
  },
  {
    id: 'isorhythm-wheels-dark-rims-answering',
    name: 'Dark rims answering',
    category: 'bell',
    description:
      'A dark bowl with a table of five dark bowls in A minor pentatonic that ring in answer, their tails sagging a little.',
    preview: SIX_STROKES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Dark bowl',
      params: { decay: 18, hardness: 0.2, brightness: 0.35, volume: -0.5 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Five dark bowls', params: { scale: 1, mix: 0.4 } },
      { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'isorhythm-wheels-orrery-of-chime-bars',
    name: 'Orrery of chime bars',
    category: 'bell',
    description:
      'Chime bars stretched a third wider than true, with seven scattered echoes, each on its own side.',
    preview: TWELVE_STROKES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: { stretch: 1.3, decay: 4, hardness: 0.6, brightness: 0.6, damping: 0.3, volume: 1.5 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.4, tone: 6000 } },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { highCut: 8000 } },
    ],
  },
  {
    id: 'isorhythm-wheels-toll-gate-clock',
    name: 'Toll-gate clock',
    category: 'bell',
    description:
      'A short church bell through an eight-bit early sampler and a small tin, dry and close.',
    preview: SEVEN_EIGHTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: {
        decay: 0.9,
        damping: 0.6,
        hardness: 0.8,
        release: 0.5,
        spread: 0.1,
        brightness: 0.6,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Toy', params: { mix: 0.6 } },
      { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'isorhythm-wheels-closing-arc-on-bronze',
    name: 'Closing arc on bronze',
    category: 'pad',
    description:
      'A bowed bell that starts straight and takes on a late vibrato, held by the key in a cathedral.',
    preview: HELD_RIM,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Bowed bell',
      params: { brightness: 0.5, detune: 0.2, decay: 10 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { depth: 30 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'isorhythm-wheels-shiver-round-the-rim',
    name: 'Shiver round the rim',
    category: 'texture',
    description:
      'Shivering glass with a sudden tremolo on each of its bands, in a thin high space with the lows cut away.',
    preview: FIFTEEN_OVER_THREE,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Shivering glass',
      params: { decay: 6, hardness: 0.3, brightness: 0.45, volume: 1.5 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Sudden glints', params: { rate: 2.2 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'isorhythm-wheels-thumb-line-sunk-low',
    name: 'Thumb line, sunk low',
    category: 'plucked',
    description:
      'A soft kalimba with slow sine shadows swelling an octave under it, both through a woolly speaker.',
    preview: DIMINUTION,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 3.5, hardness: 0.25, damping: 0.5, volume: -2.5 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Low shadow', params: { mix: 0.5, attack: 400 } },
      { deviceId: 're-amp', preset: 'Dark and woolly' },
    ],
  },
  {
    id: 'isorhythm-wheels-wheel-run-in-reverse',
    name: 'Wheel run in reverse',
    category: 'texture',
    description:
      'A rubbed gong held by the key and played backwards in long overlapping chunks, with little of it left dry.',
    preview: HELD_RIM,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed gong',
      params: { decay: 9, detune: 2.2, stretch: 1.15 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.7 } },
      { deviceId: 'currents', preset: 'Gentle drift' },
    ],
  },
  {
    id: 'isorhythm-wheels-padauk-counted-in-five',
    name: 'Padauk counted in five',
    category: 'bell',
    description:
      'A marimba struck with soft heads, its tubes open and its bars damped early, on a worn cassette in a small dark space.',
    preview: WHOLE_TURN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.15, decay: 0.6, resonator: 1, damper: 0.5, volume: -6.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.1, drive: 0.4 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'isorhythm-wheels-rolled-rim-twelve-teeth',
    name: 'Rolled rim, twelve teeth',
    category: 'bell',
    description:
      'Marimba bars rolled twelve times a second while held, slowly panned from side to side.',
    preview: CHORDS_ON_TWO,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { roll: 12, mallet: 0.35, width: 0.3, volume: -6.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'isorhythm-wheels-motor-set-to-the-talea',
    name: 'Motor set to the talea',
    category: 'bell',
    description:
      'Vibes with the motor slowed to two throbs a second, one to each beat of the wheel, through a rotary cabinet turning slowly.',
    preview: HALF_TURN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { motorRate: 2, motor: 0.95, decay: 1.6, mallet: 0.25 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend', params: { mix: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'isorhythm-wheels-celesta-behind-a-cog',
    name: 'Celesta behind a cog',
    category: 'keys',
    description: 'A celesta with its dampers down and its tail caught by strings tuned to A minor.',
    preview: TWELVE_STROKES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { decay: 0.7, damper: 0.9, mallet: 0.45 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.5, sympathy: 0.75 } },
    ],
  },
  {
    id: 'isorhythm-wheels-xylophone-down-a-lane',
    name: 'Xylophone down a lane',
    category: 'bell',
    description:
      'A dry xylophone struck hard and heard from the far end of a hall, the room louder than the bars.',
    preview: TWELVE_STROKES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { decay: 0.8, mallet: 0.85, volume: 5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Far end of the hall', params: { output: 3 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6000 } },
    ],
  },
  {
    id: 'isorhythm-wheels-slow-bar-long-ellipse',
    name: 'Slow bar, long ellipse',
    category: 'bell',
    description:
      'Vibes left to ring more than three times as long, throbbing once a second, with a worn loop that lags behind them.',
    preview: SIX_STROKES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { decay: 3.5, motorRate: 1, mallet: 0.1 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Thin and distant',
        params: { length: 3, mix: 0.4, feedback: 0.55 },
      },
    ],
  },
  {
    id: 'isorhythm-wheels-cold-spark-on-each-spoke',
    name: 'Cold spark on each spoke',
    category: 'bell',
    description:
      'Hard glockenspiel bars cut short, their highest partials blurred into a lasting pale air, faint echoes dulling it.',
    preview: TWELVE_STROKES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { decay: 0.5, mallet: 1, damper: 0.4, volume: -3.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'High air', params: { mix: 0.5 } },
      { deviceId: 'analog-delay', preset: 'Faint halo', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'isorhythm-wheels-hum-between-two-turns',
    name: 'Hum between two turns',
    category: 'pad',
    description:
      'A marimba with the softest heads and the longest bars, its attack faded in over a third of a second, a soft oo in the room.',
    preview: CHORDS_ON_TWO,
    instrument: {
      deviceId: 'mallets',
      preset: 'Humming marimba',
      params: { decay: 4, resonator: 1, width: 0.5, volume: -5.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 300 } },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'isorhythm-wheels-lathe-turned-temple-bar',
    name: 'Lathe-turned temple bar',
    category: 'bell',
    description:
      'A xylophone with warm soft heads, bent by a metallic stretching of its partials, in a short bright tank.',
    preview: SMALL_TEETH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Warm xylophone',
      params: { decay: 1.6, mallet: 0.3, volume: 2 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Glass bar', params: { stretch: 0.35, mix: 0.7 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { decay: 2.5, mix: 0.25 } },
    ],
  },
  {
    id: 'isorhythm-wheels-roll-without-a-seam',
    name: 'Roll without a seam',
    category: 'pad',
    description:
      'Rolled vibes whose strokes are blurred into one soft cloud with no tail, barely throbbing.',
    preview: HELD_RIM,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { volume: -6.5, roll: 15, motor: 0.2, damper: 0.1, mallet: 0.05 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Deep fog', params: { size: 450 } },
      { deviceId: 'stereo-detune', preset: 'Cloud' },
    ],
  },
  {
    id: 'isorhythm-wheels-bright-teeth-oiled-gear',
    name: 'Bright teeth, oiled gear',
    category: 'bell',
    description:
      'A bright xylophone roll swept by a slow hollow flanger and held level by a gentle limiter.',
    preview: SMALL_TEETH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Xylophone roll',
      params: { roll: 10, decay: 1.2, mallet: 0.5, damper: 0.2, volume: -3.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow', params: { feedback: -55, rate: 0.2 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'isorhythm-wheels-resonators-left-to-spin',
    name: 'Resonators left to spin',
    category: 'bell',
    description:
      'Glockenspiel over full resonator tubes, long rung, with a second copy moved up by a few hertz that beats.',
    preview: SMALL_TEETH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { decay: 3, mallet: 0.5, width: 1, volume: -8 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Moving beat', params: { fine: 6.5, mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'isorhythm-wheels-celesta-at-the-last-bend',
    name: 'Celesta at the last bend',
    category: 'keys',
    description:
      'An open celesta rung two and a half times as long, followed at just over a second apart by three darker copies of the line.',
    preview: DIMINUTION,
    instrument: {
      deviceId: 'mallets',
      preset: 'Open celesta',
      params: { decay: 2.5, mallet: 0.2 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Round of three', params: { gap: 1.2, mix: 0.45, tone: 4500 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'isorhythm-wheels-tremolo-on-the-rim',
    name: 'Tremolo on the rim',
    category: 'keys',
    description:
      'A soft celesta throbbing five times in two seconds, seasick on slow tape, in a room that falls away in a straight line.',
    preview: SMALL_TEETH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Tremolo celesta',
      params: { volume: -5.5, motorRate: 2.5, decay: 2.4, mallet: 0.15, damper: 0.1 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { hiss: 0.1 } },
      { deviceId: 'shaped-reverb', preset: 'Falling', params: { time: 1.8 } },
    ],
  },
  {
    id: 'isorhythm-wheels-dead-count-on-a-plank',
    name: 'Dead count on a plank',
    category: 'bell',
    description:
      'A marimba with hard heads and no tubes, its bars damped at once: a knock with a pitch, on a drum head.',
    preview: WHOLE_TURN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.9, resonator: 0, decay: 0.25, damper: 1, volume: 5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { mix: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'isorhythm-wheels-millpond-vibes-undamped',
    name: 'Millpond vibes, undamped',
    category: 'bell',
    description:
      'Still vibes whose bands each swell and drift apart on their own slow cycle, with a little still room.',
    preview: HALF_TURN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { damper: 0, decay: 2.4, mallet: 0.4 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Glass notes', params: { rate: 0.5 } },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'isorhythm-wheels-frost-on-the-fly-wheel',
    name: 'Frost on the fly-wheel',
    category: 'texture',
    description:
      'A glockenspiel roll thinned of its lows and blown about by small sparks an octave and a fifth higher.',
    preview: SMALL_TEETH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel roll',
      params: { roll: 12, mallet: 0.1, resonator: 0.9, decay: 1.2, volume: -2.5 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Fifths above', params: { mix: 0.25 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 5000 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'isorhythm-wheels-marimba-an-octave-sunk',
    name: 'Marimba an octave sunk',
    category: 'bell',
    description:
      'Soft marimba with a full octave added under it, pushed lightly through a transformer.',
    preview: PAIR_CLOSING,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.25, decay: 1.8 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.9, dry: 0.7 } },
      { deviceId: 'analog-drive', preset: 'Iron lows' },
    ],
  },
  {
    id: 'isorhythm-wheels-skipping-cog-short-ring',
    name: 'Skipping cog, short ring',
    category: 'bell',
    description:
      'Hard vibes damped to a chip, each stroke repeating in even steps from side to side.',
    preview: SEVEN_EIGHTHS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { motor: 0, mallet: 0.9, decay: 0.3, damper: 0.9, resonator: 0.3, volume: 0.5 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Even steps',
        params: { first: 290, mix: 0.4, loss: 3.5 },
      },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'isorhythm-wheels-clay-bells-kiln-warm',
    name: 'Clay bells, kiln warm',
    category: 'bell',
    description:
      'A glockenspiel without hard edges, held inside a clay pot so that only its lower body is left.',
    preview: SMALL_TEETH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { volume: -3.5, mallet: 0.2, decay: 1.5, resonator: 0.6 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { size: 0.7 } },
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'isorhythm-wheels-two-bows-three-stops',
    name: 'Two bows, three stops',
    category: 'string',
    description:
      'Two players with short dry bows and little vibrato, close together, in a small wooden soundboard.',
    preview: PAIR_CLOSING,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Quiet duet',
      params: {
        attack: 0.08,
        release: 0.25,
        bow: 0.4,
        mute: 0.2,
        vibrato: 3,
        width: 0.4,
        volume: -2.5,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.45 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'isorhythm-wheels-cantus-turned-by-six',
    name: 'Cantus turned by six',
    category: 'string',
    description:
      'Six slow bows with mutes off, warmed by a low shelf and left in a hall whose lows hang longest.',
    preview: CHORDS_FOR_SLOW_BOWS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Six slow bows',
      params: { attack: 1.1, release: 3, mute: 0, bow: 0.45, air: 0.15, vibrato: 9 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'isorhythm-wheels-bridge-like-a-cold-axle',
    name: 'Bridge like a cold axle',
    category: 'string',
    description:
      'Three players bowing at the bridge with no vibrato, blurred into a diffuse room, highs and lows trading places under a tremolo.',
    preview: SLOW_TENOR,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { attack: 0.6, release: 2, air: 0.4, volume: -0.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Diffuse room', params: { mix: 0.5 } },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 1.6, depth: 0.6 } },
    ],
  },
  {
    id: 'isorhythm-wheels-short-bows-long-color',
    name: 'Short bows, long color',
    category: 'string',
    description: 'A section of very short bright bows with three tape heads answering each stroke.',
    preview: FIVE_NOTES_LONG_SHORT,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { release: 0.12, bow: 0.9, scatter: 0.4, volume: -2.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 390, mix: 0.34, highCut: 3000 },
      },
    ],
  },
  {
    id: 'isorhythm-wheels-viols-at-the-mill-race',
    name: 'Viols at the mill-race',
    category: 'string',
    description:
      'A consort with mutes on and nothing scattered, its gut tone bent a little by slow water.',
    preview: PAIR_CLOSING,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { attack: 0.2, bow: 0.55, mute: 1, air: 0.1, volume: -1.5 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Sunlit shallows', params: { depth: 0.25, rate: 0.8 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'isorhythm-wheels-wind-bowed-spokes',
    name: 'Wind-bowed spokes',
    category: 'string',
    description:
      'More air than string: whispering bows with the breath turned up beside the note, its level blown about by dry gusts.',
    preview: SLOW_TENOR,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { air: 1, bow: 0.02, attack: 0.5, release: 2.5, mute: 0.5, volume: -1.5 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Breath' },
      { deviceId: 'weather', preset: 'Dry gusts' },
    ],
  },
  {
    id: 'isorhythm-wheels-one-player-whole-wheel',
    name: 'One player, whole wheel',
    category: 'string',
    description:
      'A close solo string that wanders off the pitch, thickened by a detuned double, on a four-track cassette with no room about it.',
    preview: FIVE_NOTES_LONG_SHORT,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wandering solo',
      params: {
        attack: 0.25,
        release: 0.6,
        bow: 0.55,
        air: 0.15,
        vibrato: 5,
        mute: 0,
        width: 0,
        volume: -4.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'stereo-detune', preset: 'Thickener', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'isorhythm-wheels-swell-on-the-long-value',
    name: 'Swell on the long value',
    category: 'string',
    description:
      'Three muted players under a swell that takes every new chord up from nothing, with an octave pad following behind.',
    preview: CHORDS_FOR_SLOW_BOWS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 0.4, release: 1.4, players: 3, bow: 0.2, air: 0.1, volume: -1.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 700 } },
      { deviceId: 'pad-follower', preset: 'Octave halo', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'isorhythm-wheels-veil-drawn-round-a-hub',
    name: 'Veil drawn round a hub',
    category: 'string',
    description:
      'Thin muted bows played at the bridge, with only the upper half left, in a tail that climbs by fifths.',
    preview: CHORDS_FOR_SLOW_BOWS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Thin veil',
      params: { attack: 1.2, release: 3.5, volume: 1.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 360, highCut: 7000 } },
      { deviceId: 'shimmer', preset: 'Narrow fifth', params: { mix: 0.4, width: 0.7 } },
    ],
  },
  {
    id: 'isorhythm-wheels-ragged-spokes-one-rim',
    name: 'Ragged spokes, one rim',
    category: 'string',
    description:
      'Six players who barely agree on a pitch, pushed through a warm triode and a short spring.',
    preview: PAIR_CLOSING,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { attack: 0.3, release: 0.8, bow: 0.6, mute: 0 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.6 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
    ],
  },
  {
    id: 'isorhythm-wheels-low-bows-under-the-race',
    name: 'Low bows under the race',
    category: 'string',
    description:
      'Slow dark bows with a sub octave swelling under them, closed down to the lower half of the sound.',
    preview: SLOW_TENOR,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Slow dark bows',
      params: { attack: 0.45, release: 2, mute: 0.8, bow: 0.1 },
    },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'Slow pedals',
        params: { sub2: 0, sub1: 0.7, filter: 500, attack: 0.5 },
      },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1700 } },
    ],
  },
  {
    id: 'isorhythm-wheels-halo-where-it-closes',
    name: 'Halo where it closes',
    category: 'pad',
    description:
      'Still bows with little noise in them, redrawn as a pad of pure sines that swells in late behind each chord.',
    preview: CHORDS_FOR_SLOW_BOWS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { attack: 1, release: 4, players: 2, air: 0.1, mute: 0.4, volume: -0.5 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Glass redraw',
        params: { attack: 400, release: 4, mix: 0.85 },
      },
      { deviceId: 'chorus', preset: 'Subtle widener' },
    ],
  },
  {
    id: 'isorhythm-wheels-hands-of-five-and-four',
    name: 'Hands of five and four',
    category: 'keys',
    description:
      'A lightly felted piano with a hard hammer and quick dampers, close, its own room off, then a small bright chamber.',
    preview: WHOLE_TURN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.35,
        hardness: 0.6,
        damper: 0.95,
        thump: 0.2,
        reverbMix: 0,
        resonance: 0,
        outputDb: -10,
      },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.16 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'isorhythm-wheels-wheel-stopped-with-felt',
    name: 'Wheel stopped with felt',
    category: 'keys',
    description:
      'Full felt and the softest hammer: more thud than string, on a cassette with its lows raised.',
    preview: LOW_WHEEL,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { thump: 0.8, reverbMix: 0.1, damper: 0.9, outputDb: -20 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump', params: { tone: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 5 } },
    ],
  },
  {
    id: 'isorhythm-wheels-pedal-across-the-turn',
    name: 'Pedal across the turn',
    category: 'keys',
    description:
      'A piano with the pedal held through every turn, its strikes softened and its tones left on top of each other.',
    preview: HALF_TURN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: { hardness: 0.4, felt: 0.45, pedalNoise: 0.2, outputDb: -12.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Soft hammers' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'isorhythm-wheels-upright-in-the-mill-loft',
    name: 'Upright in the mill loft',
    category: 'keys',
    description: 'An old upright with loud action and loose tuning, heard off a warped record.',
    preview: PAIR_CLOSING,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { hardness: 0.45, grit: 0.2, action: 0.7, outputDb: -15.5 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Warped', params: { warp: 0.6, crackle: 0.15 } },
      { deviceId: 're-amp', preset: 'Room underneath' },
    ],
  },
  {
    id: 'isorhythm-wheels-glass-hammers-one-spoke',
    name: 'Glass hammers, one spoke',
    category: 'keys',
    description:
      'A hard bright upright with stiff strings, each note thrown upward in fading fifths.',
    preview: DIMINUTION,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { reverbMix: 0.1, width: 0.4, outputDb: -7 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Rising fifths',
        params: { time: 420, mix: 0.28, feedback: 0.4 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 7000 } },
    ],
  },
  {
    id: 'isorhythm-wheels-backward-turn-of-keys',
    name: 'Backward turn of keys',
    category: 'keys',
    description:
      'A close felt piano played back in reverse under itself, dark, a second and a half at a time.',
    preview: HALF_TURN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { reverbMix: 0, thump: 0.3, grit: 0.05, felt: 0.8, outputDb: -7.5 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Dark fog',
        params: { time: 1500, tone: 1600, mix: 0.5, feedback: 0.35 },
      },
    ],
  },
  {
    id: 'isorhythm-wheels-wash-that-loses-the-beat',
    name: 'Wash that loses the beat',
    category: 'pad',
    description:
      'A blurred piano with both pedals down and its strike wiped off, so the rhythm is heard only as a change of chord.',
    preview: CHORDS_FOR_SLOW_BOWS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { reverbMix: 0.3, resonance: 0.7, outputDb: 4 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 600 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.35, decay: 8 } },
    ],
  },
  {
    id: 'isorhythm-wheels-still-strings-odd-bar',
    name: 'Still strings, odd bar',
    category: 'keys',
    description:
      'A half-pedalled piano without stiffness, a flock of copies wheeling about it and each note unfolding from low to high.',
    preview: SEVEN_EIGHTHS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: {
        damper: 0.6,
        resonance: 0.6,
        felt: 0.5,
        hardness: 0.35,
        reverbMix: 0,
        sustain: 0.42,
        outputDb: -14,
      },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Wheeling', params: { birds: 9, mix: 0.5 } },
      { deviceId: 'prism', preset: 'Slow unfolding', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'isorhythm-wheels-dry-bearing-worn-mono',
    name: 'Dry bearing, worn mono',
    category: 'keys',
    description:
      'A worn mono piano driven into an early sampler, with its top rolled off and a short room about it.',
    preview: FIVE_NOTES_LONG_SHORT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Worn mono',
      params: { grit: 0.6, reverbMix: 0.05, outputDb: -17.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Muffled sampler', params: { tone: 0.25 } },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'isorhythm-wheels-pond-struck-six-times',
    name: 'Pond struck six times',
    category: 'bell',
    description:
      'Near ice with a clean ring of six seconds and hardly a crack, over a quiet low hall.',
    preview: SIX_STROKES,
    instrument: {
      deviceId: 'ice',
      preset: 'Near ping',
      params: { ring: 6, crack: 0.1, bright: 0.35, thick: 0.7, shore: 0, volume: 1.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.25 } }],
  },
  {
    id: 'isorhythm-wheels-cracked-rim-far-bank',
    name: 'Cracked rim, far bank',
    category: 'texture',
    description:
      'Far bright cracks that fall onto their notes a long way off, with scattered echoes dimming behind.',
    preview: TWELVE_STROKES,
    instrument: {
      deviceId: 'ice',
      preset: 'Far crack',
      params: { bright: 0.65, ring: 3, crack: 0.5, volume: 2 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Dark field', params: { mix: 0.4 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'isorhythm-wheels-thaw-at-the-wheel-pit',
    name: 'Thaw at the wheel-pit',
    category: 'pad',
    description:
      'Thick slow ice rung for twenty seconds, its falling chirps softened and its tail sagging a little as it fades.',
    preview: HELD_RIM,
    instrument: {
      deviceId: 'ice',
      preset: 'Slow thaw',
      params: { distance: 0.5, cracks: 0.1, volume: 2.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { mix: 0.8 } },
      { deviceId: 'melt', preset: 'Slow melt', params: { sag: -12, mix: 0.35 } },
    ],
  },
  {
    id: 'isorhythm-wheels-brittle-tally-marks',
    name: 'Brittle tally marks',
    category: 'bell',
    description:
      'A close, brittle snap of ice that rings for less than a second, gathered by a small glass tube.',
    preview: SEVEN_EIGHTHS,
    instrument: {
      deviceId: 'ice',
      preset: 'Brittle snap',
      params: { ring: 0.8, crack: 0.6, volume: 4 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.6 } },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'isorhythm-wheels-plate-tones-in-a-wheel',
    name: 'Plate tones in a wheel',
    category: 'bell',
    description:
      'Ice with its overtones stretched as far as they go, ring modulated softly around A.',
    preview: FIFTEEN_OVER_THREE,
    instrument: {
      deviceId: 'ice',
      preset: 'Plate tones',
      params: { ring: 2.5, bright: 0.5, volume: 5 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Dark bell', params: { root: 9, mix: 0.4, tone: 1800 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'isorhythm-wheels-night-lake-one-talea',
    name: 'Night lake, one talea',
    category: 'texture',
    description:
      'A lake at night whose cracks go on by themselves, rung through a filter tuned to the scale of A minor.',
    preview: SIX_STROKES,
    instrument: {
      deviceId: 'ice',
      preset: 'Lake at night',
      params: { ring: 5, bright: 0.5, volume: 2 },
    },
    effects: [
      { deviceId: 'scale-filter', preset: 'Minor triad', params: { chord: 0, mix: 0.7 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'isorhythm-wheels-clear-pings-on-a-loop',
    name: 'Clear pings on a loop',
    category: 'bell',
    description:
      'Clear pings with no crack and no shore, recorded into three loops that turn out of step.',
    preview: HALF_TURN,
    instrument: {
      deviceId: 'ice',
      preset: 'Clear ping',
      params: { ring: 2, bright: 0.75, thick: 0.3, volume: 5 },
    },
    effects: [{ deviceId: 'orbits', preset: 'Out of step', params: { mix: 0.45 } }],
  },
  {
    id: 'isorhythm-wheels-floe-that-holds-the-bass',
    name: 'Floe that holds the bass',
    category: 'drone',
    description:
      'Deep dark ice with little above its lowest modes, an octave added below and a slow breath over the level.',
    preview: SLOW_TENOR,
    instrument: {
      deviceId: 'ice',
      preset: 'Deep floe',
      params: { distance: 0.1, crack: 0, cracks: 0.1, ring: 20, bright: 0.15, volume: 1 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } },
      { deviceId: 'breath', preset: 'Barely there', params: { depth: 0.4 } },
    ],
  },
  {
    id: 'isorhythm-wheels-skates-off-the-beat',
    name: 'Skates off the beat',
    category: 'plucked',
    description:
      'Thin quick ice that zings down to its notes, panned by chance from stroke to stroke, with one short slap behind.',
    preview: DIMINUTION,
    instrument: {
      deviceId: 'ice',
      preset: 'Zing',
      params: { distance: 0.6, bright: 0.8, ring: 1, stretch: 0.3, volume: 2 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Wandering pan', params: { rate: 2.4 } },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 150, mix: 0.28 } },
    ],
  },
  {
    id: 'isorhythm-wheels-glass-wheel-no-seam',
    name: 'Glass wheel, no seam',
    category: 'pad',
    description:
      'Glass tables travelling slowly under a soft filter, four seconds to fade, with a slow phaser.',
    preview: CHORDS_ON_TWO,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: { attack: 0.7, release: 4, cutoff: 2600, position: 0.5, motion: 0.8 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'isorhythm-wheels-reed-count-under-a-fan',
    name: 'Reed count under a fan',
    category: 'organ',
    description:
      'A quick reed organ tone stirred by a rotary cabinet at full speed, in a tight room.',
    preview: PAIR_CLOSING,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { attack: 0.02, release: 0.3, position: 0.3, cutoff: 3200 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Tremolo', params: { drive: 0.1, mix: 0.8 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'isorhythm-wheels-pulse-struck-and-gone',
    name: 'Pulse struck and gone',
    category: 'plucked',
    description:
      'A narrow pulse with no swell, shut a quarter of a second after the key, filtered by each stroke and answered by a soft echo.',
    preview: WHOLE_TURN,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: { attack: 0.005, release: 0.25, cutoff: 1800, sub: 0.2, motion: 0.4, rate: 1.3 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Touch wah', params: { mix: 0.4, resonance: 2 } },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 210, mix: 0.24 } },
    ],
  },
  {
    id: 'isorhythm-wheels-vowels-turn-on-a-post',
    name: 'Vowels turn on a post',
    category: 'voice',
    description:
      'A slow choir of vowel tables, each chord going from one vowel to another, in a chapel that sings.',
    preview: CHORDS_FOR_SLOW_BOWS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { attack: 0.9, release: 2.5, rate: 0.3, motion: 1 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.4 } },
      { deviceId: 'stereo-detune', preset: 'Wider' },
    ],
  },
  {
    id: 'isorhythm-wheels-hollow-rim-slow-gate',
    name: 'Hollow rim, slow gate',
    category: 'pad',
    description:
      'A hollow table with a long fade, pulsed by two gates that drift apart and meet again.',
    preview: SLOW_TENOR,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 0.5, release: 3, cutoff: 1400, resonance: 0.45, volume: -1 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Dark glints', params: { rate: 2.1, floor: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'isorhythm-wheels-overtones-off-a-spindle',
    name: 'Overtones off a spindle',
    category: 'texture',
    description:
      'A spectral table with a ringing filter that wanders through its overtones, moving round the head in a figure of eight.',
    preview: HELD_RIM,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Ringing overtones',
      params: { volume: 3.5, attack: 0.5, release: 4, cutoff: 1000, rate: 0.5 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow eight' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -6 } },
    ],
  },
  {
    id: 'isorhythm-wheels-glass-keys-seven-teeth',
    name: 'Glass keys, seven teeth',
    category: 'keys',
    description:
      'Bell-like glass keys with a plucked start and a second and a half of fade, crushed a little by an old converter.',
    preview: SEVEN_EIGHTHS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass bell keys',
      params: { release: 1.5, position: 0.8, cutoff: 7000, volume: -5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze', params: { rate: 12000 } },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'isorhythm-wheels-low-bed-slow-spindle',
    name: 'Low bed, slow spindle',
    category: 'drone',
    description:
      'The sub and first harmonics of a low table, saturated a little, its bands swelling together every five seconds.',
    preview: SLOW_TENOR,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Low bed',
      params: { attack: 0.6, release: 2, cutoff: 500, position: 0.25 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 8 } },
      { deviceId: 'currents', preset: 'One slow wheel' },
    ],
  },
  {
    id: 'isorhythm-wheels-gate-on-every-attack',
    name: 'Gate on every attack',
    category: 'plucked',
    description:
      'A wooden pluck through a low-pass gate, half a second long with nothing left to chance, and a hint of spring.',
    preview: WHOLE_TURN,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { decay: 0.5, fold: 0.2, chance: 0, colour: 0.45, volume: 0 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.2 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'isorhythm-wheels-folded-chime-on-a-cog',
    name: 'Folded chime on a cog',
    category: 'bell',
    description:
      'Small chimes modulated at five to one and folded on the strike, just over a second long, blurred by a thin veil of haze.',
    preview: TWELVE_STROKES,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Small chimes',
      params: { decay: 1.2, fold: 0.3, fm: 0.3, colour: 0.8, volume: -0.5 },
    },
    effects: [
      { deviceId: 'haze', preset: 'Thin veil', params: { mix: 0.4 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'isorhythm-wheels-gong-at-the-slow-hub',
    name: 'Gong at the slow hub',
    category: 'bell',
    description:
      'A long dark gong of frequency modulation, seven seconds down, its tail gliding slowly lower without arriving.',
    preview: SIX_STROKES,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Long gong',
      params: { decay: 7, fm: 0.65, colour: 0.35, volume: -3 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.35 } }],
  },
  {
    id: 'isorhythm-wheels-thumb-box-rained-on',
    name: 'Thumb box, rained on',
    category: 'plucked',
    description:
      'A folded thumb piano of under a second, limited, its grains falling an octave with each echo.',
    preview: DIMINUTION,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Thumb piano',
      params: { decay: 0.8, chance: 0.2, fold: 0.35, attack: 0.012, volume: 1.5 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 14, outputGain: -8 } },
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.3, time: 400 } },
    ],
  },
  {
    id: 'isorhythm-wheels-sine-that-comes-round',
    name: 'Sine that comes round',
    category: 'pad',
    description:
      'A plain sine that swells in over half a second, with flute stops an octave below, an octave above and a twelfth above.',
    preview: HELD_RIM,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Sine swell',
      params: { attack: 0.5, decay: 3, colour: 0.5, volume: -8.5 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.6, twelfth: 0.3 } },
      { deviceId: 'expanse', preset: 'Faint air', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'isorhythm-wheels-reed-wheel-worn-pin',
    name: 'Reed wheel, worn pin',
    category: 'organ',
    description: 'Folded reeds held by the key, thinned to a kitchen radio and wavering with it.',
    preview: PAIR_CLOSING,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folded reeds',
      params: { fold: 0.45, attack: 0.04, volume: -5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Kitchen radio', params: { wobble: 0.3, mix: 0.8 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'isorhythm-wheels-harp-on-the-odd-side',
    name: 'Harp on the odd side',
    category: 'plucked',
    description:
      'A bright folded pluck of two seconds whose short loops come back stacked in octaves above it.',
    preview: FIVE_NOTES_LONG_SHORT,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Bright harp',
      params: { decay: 2, fold: 0.4, volume: 0.5 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Octave stack', params: { time: 390, mix: 0.4, tone: 5000 } },
    ],
  },
  {
    id: 'isorhythm-wheels-bass-of-two-and-three',
    name: 'Bass of two and three',
    category: 'bass',
    description:
      'A round low pluck of a second and a half, its fold opened by each strike, weighted by an iron transformer.',
    preview: LOW_WHEEL,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Round bass',
      params: { decay: 1.4, fold: 0.6, colour: 0.1, volume: 1 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'size', preset: 'A shade larger' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'isorhythm-wheels-violins-spooled-by-three',
    name: 'Violins spooled by three',
    category: 'string',
    description:
      'Three worn violins with a quick start and stop, wide apart, in a concrete slap of a room.',
    preview: TWELVE_STROKES,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: { age: 0.65, spread: 0.9, release: 0.2, volume: 5 },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.28 } },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { highCut: 5000 } },
    ],
  },
  {
    id: 'isorhythm-wheels-flutes-on-a-tape-wheel',
    name: 'Flutes on a tape wheel',
    category: 'wind',
    description:
      'Flutes on tape, steady and breathy, with a vibrato that waits before it comes, in a hall.',
    preview: DIMINUTION,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: { vibrato: 0.1, age: 0.2, attack: 0.05, volume: -3 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Late vibrato', params: { depth: 34 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'isorhythm-wheels-horns-for-the-long-turn',
    name: 'Horns for the long turn',
    category: 'wind',
    description:
      'Half-speed horns, an octave below the keys, coming in softly and late, through a warm speaker stack and a long plate.',
    preview: HELD_RIM,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: { attack: 0.35, release: 1.5, tone: -0.1 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'isorhythm-wheels-choir-wound-too-slowly',
    name: 'Choir wound too slowly',
    category: 'voice',
    description:
      'A half-speed tape choir an octave below the keys, its width opened and closed every few seconds, half hung in a mist.',
    preview: CHORDS_FOR_SLOW_BOWS,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slowed choir',
      params: { attack: 0.7, release: 2.5, hiss: 0.15 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Opening wide', params: { in: 2, out: 2 } },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'isorhythm-wheels-reeds-geared-to-three',
    name: 'Reeds geared to three',
    category: 'wind',
    description:
      'Orchestra reeds started sharply and cut off short, two heads of tape echo filling the gaps between them.',
    preview: SEVEN_EIGHTHS,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { attack: 0.01, release: 0.1, tone: -0.3, players: 0.2 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 580, mix: 0.32 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'isorhythm-wheels-cellos-closing-rim',
    name: 'Cellos, closing rim',
    category: 'string',
    description: 'Cellos from a nearly new tape, warm, in a cathedral with the top taken off.',
    preview: SLOW_TENOR,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: { attack: 0.4, release: 2, vibrato: 0.4 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 2000, mix: 0.35 } },
    ],
  },
  {
    id: 'isorhythm-wheels-reel-that-forgets-a-turn',
    name: 'Reel that forgets a turn',
    category: 'texture',
    description:
      'A lost reel of flutes run slow, an octave down and aged as far as it goes, with stray moments of the last bars drifting back.',
    preview: SMALL_TEETH,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Lost reel',
      params: { hiss: 0.4, release: 1.2, volume: -1 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Flickers', params: { mix: 0.4 } },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
  },
  {
    id: 'isorhythm-wheels-brass-at-each-station',
    name: 'Brass at each station',
    category: 'pad',
    description:
      'Short synthetic brass: a filter that speaks and closes at once, half a second of release, a chorus and a plate.',
    preview: PAIR_CLOSING,
    instrument: {
      deviceId: 'aurora',
      preset: 'Short brass',
      params: { attack: 0.06, release: 0.5, brilliance: 1300, detune: 9, volume: -2.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'isorhythm-wheels-strings-over-the-gearing',
    name: 'Strings over the gearing',
    category: 'pad',
    description:
      'Wide pad strings with the lows cut, swept by a slow flanger and left on a dark plate.',
    preview: CHORDS_ON_TWO,
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { attack: 0.5, release: 2.5, brilliance: 3500, volume: 0.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Wide wash', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'isorhythm-wheels-chime-strings-come-round',
    name: 'Chime strings come round',
    category: 'bell',
    description:
      'A ring modulated string pad struck at once and fading for four seconds, in a fan of echoes that thin out.',
    preview: TWELVE_STROKES,
    instrument: {
      deviceId: 'aurora',
      preset: 'Chime strings',
      params: { volume: -4.5, release: 4, brilliance: 3000, ring: 0.8 },
    },
    effects: [{ deviceId: 'prism', preset: 'Thinning out', params: { mix: 0.35 } }],
  },
  {
    id: 'isorhythm-wheels-vowel-at-the-still-point',
    name: 'Vowel at the still point',
    category: 'voice',
    description:
      'A pad whose resonant filter opens slowly like a vowel, every band dipping at its own pace, with a little rising reverb.',
    preview: CHORDS_FOR_SLOW_BOWS,
    instrument: {
      deviceId: 'aurora',
      preset: 'Opening vowel',
      params: { attack: 0.9, release: 2.5 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Slow weather', params: { rate: 0.5 } },
      { deviceId: 'bloom-reverb', preset: 'Faint glow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'isorhythm-wheels-metal-dawn-third-turn',
    name: 'Metal dawn, third turn',
    category: 'pad',
    description:
      'A pad ringing like thin metal, some of it doubled a fifth higher, in a long cold tail.',
    preview: HELD_RIM,
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { attack: 0.4, release: 4, ring: 0.75 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad fifth', params: { mix: 0.3 } },
      { deviceId: 'seasons', preset: 'Deep winter', params: { mix: 0.7 } },
    ],
  },
  {
    id: 'isorhythm-wheels-pipes-at-hub-and-rim',
    name: 'Pipes at hub and rim',
    category: 'organ',
    description:
      'Pipe tones with a slow start and their lows cut, whistling octaves added above, heard up a stone stairwell.',
    preview: SLOW_TENOR,
    instrument: {
      deviceId: 'aurora',
      preset: 'Still pipes',
      params: {
        attack: 0.5,
        release: 1.2,
        brilliance: 2000,
        lowCut: 260,
        contour: 0.4,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Whistling pipes' },
      { deviceId: 'distance', preset: 'Stone stairwell' },
    ],
  },
]
