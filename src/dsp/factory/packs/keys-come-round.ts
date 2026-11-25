import { type FactoryPreset, type Phrase } from '../types'

// Two scales that come back to themselves inside the octave, in colours of tape, brass, glass, wood,
// wind and voice. Half is heard in the eight-note scale C D flat E flat E F sharp G A B flat, half in
// the six-note scale C E flat E G A flat B. Copies are moved by a minor third in the first half and a
// major third in the second, so what an effect adds stays in the scale.

// A phrase in the register of another voice. Moved by minor thirds an eight-note phrase keeps its eight
// notes, and moved by major thirds a six-note phrase keeps its six.
const moved = (phrase: Phrase, by: number): Phrase => ({
  notes: phrase.notes.map((n) => ({ ...n, note: n.note + by })),
})

// Four sevenths without their fifths over a held C: C7 (B flat E C), E flat 7 (G E flat D flat),
// G flat 7 (G flat F flat B flat), A7 (G C sharp A). Four tonics on one scale, three voices by step or third.
const SEVENTHS_OVER_C: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 48, gain: 0.42 },
    { atSec: 0, durSec: 1.58, note: 58, gain: 0.4 },
    { atSec: 0, durSec: 1.58, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 1.58, note: 72, gain: 0.46 },
    { atSec: 1.6, durSec: 1.58, note: 55, gain: 0.4 },
    { atSec: 1.6, durSec: 1.58, note: 63, gain: 0.4 },
    { atSec: 1.6, durSec: 1.58, note: 73, gain: 0.46 },
    { atSec: 3.2, durSec: 1.58, note: 54, gain: 0.4 },
    { atSec: 3.2, durSec: 1.58, note: 64, gain: 0.4 },
    { atSec: 3.2, durSec: 1.58, note: 70, gain: 0.46 },
    { atSec: 4.8, durSec: 1.58, note: 55, gain: 0.4 },
    { atSec: 4.8, durSec: 1.58, note: 61, gain: 0.4 },
    { atSec: 4.8, durSec: 1.58, note: 69, gain: 0.46 },
  ],
}

// Major triads on C, E flat, F sharp and A, rising in minor thirds, while the bass falls by them:
// C, A, F sharp, E flat, and C again at the octave on both sides.
const PLANING: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 48, gain: 0.42 },
    { atSec: 0, durSec: 1.2, note: 60, gain: 0.38 },
    { atSec: 0, durSec: 1.2, note: 64, gain: 0.38 },
    { atSec: 0, durSec: 1.2, note: 67, gain: 0.44 },
    { atSec: 1.25, durSec: 1.2, note: 45, gain: 0.42 },
    { atSec: 1.25, durSec: 1.2, note: 63, gain: 0.38 },
    { atSec: 1.25, durSec: 1.2, note: 67, gain: 0.38 },
    { atSec: 1.25, durSec: 1.2, note: 70, gain: 0.44 },
    { atSec: 2.5, durSec: 1.2, note: 42, gain: 0.42 },
    { atSec: 2.5, durSec: 1.2, note: 66, gain: 0.38 },
    { atSec: 2.5, durSec: 1.2, note: 70, gain: 0.38 },
    { atSec: 2.5, durSec: 1.2, note: 73, gain: 0.44 },
    { atSec: 3.75, durSec: 1.2, note: 39, gain: 0.42 },
    { atSec: 3.75, durSec: 1.2, note: 69, gain: 0.38 },
    { atSec: 3.75, durSec: 1.2, note: 73, gain: 0.38 },
    { atSec: 3.75, durSec: 1.2, note: 76, gain: 0.44 },
    { atSec: 5, durSec: 1.2, note: 36, gain: 0.42 },
    { atSec: 5, durSec: 1.2, note: 72, gain: 0.38 },
    { atSec: 5, durSec: 1.2, note: 76, gain: 0.38 },
    { atSec: 5, durSec: 1.2, note: 79, gain: 0.44 },
  ],
}

// One cell of three notes, up a half step and up a minor third, moved up by minor thirds through the
// four tonics: C D flat E, E flat E G, F sharp G B flat, A B flat D flat, and C.
const CELL_UP: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.42, note: 72, gain: 0.5 },
    { atSec: 0.45, durSec: 0.42, note: 73, gain: 0.42 },
    { atSec: 0.9, durSec: 0.6, note: 76, gain: 0.55 },
    { atSec: 1.5, durSec: 0.42, note: 75, gain: 0.5 },
    { atSec: 1.95, durSec: 0.42, note: 76, gain: 0.42 },
    { atSec: 2.4, durSec: 0.6, note: 79, gain: 0.55 },
    { atSec: 3, durSec: 0.42, note: 78, gain: 0.5 },
    { atSec: 3.45, durSec: 0.42, note: 79, gain: 0.42 },
    { atSec: 3.9, durSec: 0.6, note: 82, gain: 0.55 },
    { atSec: 4.5, durSec: 0.42, note: 81, gain: 0.5 },
    { atSec: 4.95, durSec: 0.42, note: 82, gain: 0.42 },
    { atSec: 5.4, durSec: 0.6, note: 85, gain: 0.55 },
    { atSec: 6, durSec: 1.2, note: 84, gain: 0.5 },
  ],
}

// A falling cell, down a half step and down a minor third, sunk by minor thirds: B flat A F sharp,
// G F sharp E flat, E E flat C, D flat C A. One line, four places to rest.
const CELL_DOWN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.38, note: 70, gain: 0.55 },
    { atSec: 0.4, durSec: 0.38, note: 69, gain: 0.48 },
    { atSec: 0.8, durSec: 0.82, note: 66, gain: 0.58 },
    { atSec: 1.65, durSec: 0.38, note: 67, gain: 0.55 },
    { atSec: 2.05, durSec: 0.38, note: 66, gain: 0.48 },
    { atSec: 2.45, durSec: 0.82, note: 63, gain: 0.58 },
    { atSec: 3.3, durSec: 0.38, note: 64, gain: 0.55 },
    { atSec: 3.7, durSec: 0.38, note: 63, gain: 0.48 },
    { atSec: 4.1, durSec: 0.82, note: 60, gain: 0.58 },
    { atSec: 4.95, durSec: 0.38, note: 61, gain: 0.55 },
    { atSec: 5.35, durSec: 0.38, note: 60, gain: 0.48 },
    { atSec: 5.75, durSec: 0.82, note: 57, gain: 0.58 },
  ],
}

// One voice of a triad moves at each step: C, C minor, E flat, E flat minor, F sharp, F sharp minor,
// A, A minor, and C again, one inversion lower. Every common note is tied.
const ONE_VOICE_TURNS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.56, note: 60, gain: 0.44 },
    { atSec: 0, durSec: 0.78, note: 64, gain: 0.44 },
    { atSec: 0, durSec: 2.34, note: 67, gain: 0.46 },
    { atSec: 0.78, durSec: 2.34, note: 63, gain: 0.44 },
    { atSec: 1.56, durSec: 2.34, note: 58, gain: 0.44 },
    { atSec: 2.34, durSec: 2.34, note: 66, gain: 0.46 },
    { atSec: 3.12, durSec: 2.34, note: 61, gain: 0.44 },
    { atSec: 3.9, durSec: 2.34, note: 57, gain: 0.44 },
    { atSec: 4.68, durSec: 2.59, note: 64, gain: 0.46 },
    { atSec: 5.46, durSec: 1.81, note: 60, gain: 0.44 },
    { atSec: 6.24, durSec: 1.03, note: 55, gain: 0.44 },
  ],
}

// C major, F sharp major at the far side of the ring, and C major again, the bass a tritone away and the
// other voices by half step, third and whole step.
const ACROSS_THE_RING: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.27, note: 48, gain: 0.46 },
    { atSec: 0, durSec: 2.27, note: 55, gain: 0.4 },
    { atSec: 0, durSec: 2.27, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 2.27, note: 72, gain: 0.42 },
    { atSec: 2.3, durSec: 2.27, note: 42, gain: 0.46 },
    { atSec: 2.3, durSec: 2.27, note: 54, gain: 0.4 },
    { atSec: 2.3, durSec: 2.27, note: 61, gain: 0.4 },
    { atSec: 2.3, durSec: 2.27, note: 70, gain: 0.42 },
    { atSec: 4.6, durSec: 2.27, note: 48, gain: 0.46 },
    { atSec: 4.6, durSec: 2.27, note: 55, gain: 0.4 },
    { atSec: 4.6, durSec: 2.27, note: 64, gain: 0.4 },
    { atSec: 4.6, durSec: 2.27, note: 72, gain: 0.42 },
  ],
}

// A strict canon at the minor third above, four notes behind. A line of this scale moved by a minor third
// stays in it. Where they overlap they meet in thirds and sixths, then A major thins out to C and E.
const CANON_AT_THE_THIRD: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.522, note: 60, gain: 0.5 },
    { atSec: 0.55, durSec: 0.522, note: 61, gain: 0.5 },
    { atSec: 1.1, durSec: 0.522, note: 64, gain: 0.5 },
    { atSec: 1.65, durSec: 0.522, note: 63, gain: 0.5 },
    { atSec: 2.2, durSec: 0.522, note: 63, gain: 0.42 },
    { atSec: 2.2, durSec: 0.522, note: 66, gain: 0.5 },
    { atSec: 2.75, durSec: 0.522, note: 64, gain: 0.42 },
    { atSec: 2.75, durSec: 0.522, note: 73, gain: 0.5 },
    { atSec: 3.3, durSec: 0.522, note: 67, gain: 0.42 },
    { atSec: 3.3, durSec: 0.522, note: 70, gain: 0.5 },
    { atSec: 3.85, durSec: 0.522, note: 66, gain: 0.42 },
    { atSec: 3.85, durSec: 0.522, note: 69, gain: 0.5 },
    { atSec: 4.4, durSec: 2.53, note: 64, gain: 0.5 },
    { atSec: 4.4, durSec: 0.522, note: 69, gain: 0.42 },
    { atSec: 4.95, durSec: 0.522, note: 76, gain: 0.42 },
    { atSec: 5.5, durSec: 0.522, note: 73, gain: 0.42 },
    { atSec: 6.05, durSec: 0.715, note: 72, gain: 0.42 },
  ],
}

// The leader of that canon alone, for the sounds whose own echo answers it.
const LEADER_ALONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.522, note: 60, gain: 0.5 },
    { atSec: 0.55, durSec: 0.522, note: 61, gain: 0.5 },
    { atSec: 1.1, durSec: 0.522, note: 64, gain: 0.5 },
    { atSec: 1.65, durSec: 0.522, note: 63, gain: 0.5 },
    { atSec: 2.2, durSec: 0.522, note: 66, gain: 0.5 },
    { atSec: 2.75, durSec: 0.522, note: 73, gain: 0.5 },
    { atSec: 3.3, durSec: 0.522, note: 70, gain: 0.5 },
    { atSec: 3.85, durSec: 0.522, note: 69, gain: 0.5 },
    { atSec: 4.4, durSec: 2.5, note: 64, gain: 0.5 },
  ],
}

// The same planing for small bright voices: the triads on C, E flat, F sharp, A and C climb by minor thirds
// while a lower voice leaves the first C and falls by minor thirds, A, F sharp, E flat, C.
const PLANING_ABOVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 72, gain: 0.38 },
    { atSec: 0, durSec: 1.2, note: 76, gain: 0.38 },
    { atSec: 0, durSec: 1.2, note: 79, gain: 0.44 },
    { atSec: 1.25, durSec: 1.2, note: 69, gain: 0.42 },
    { atSec: 1.25, durSec: 1.2, note: 75, gain: 0.38 },
    { atSec: 1.25, durSec: 1.2, note: 79, gain: 0.38 },
    { atSec: 1.25, durSec: 1.2, note: 82, gain: 0.44 },
    { atSec: 2.5, durSec: 1.2, note: 66, gain: 0.42 },
    { atSec: 2.5, durSec: 1.2, note: 78, gain: 0.38 },
    { atSec: 2.5, durSec: 1.2, note: 82, gain: 0.38 },
    { atSec: 2.5, durSec: 1.2, note: 85, gain: 0.44 },
    { atSec: 3.75, durSec: 1.2, note: 63, gain: 0.42 },
    { atSec: 3.75, durSec: 1.2, note: 81, gain: 0.38 },
    { atSec: 3.75, durSec: 1.2, note: 85, gain: 0.38 },
    { atSec: 3.75, durSec: 1.2, note: 88, gain: 0.44 },
    { atSec: 5, durSec: 1.2, note: 60, gain: 0.42 },
    { atSec: 5, durSec: 1.2, note: 84, gain: 0.38 },
    { atSec: 5, durSec: 1.2, note: 88, gain: 0.38 },
    { atSec: 5, durSec: 1.2, note: 91, gain: 0.44 },
  ],
}

// C major (E G C) to A flat minor (E flat A flat C flat): each of three voices moves a half step and no
// note is shared.
const FAR_POLES: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.55, note: 52, gain: 0.5 },
    { atSec: 0, durSec: 3.55, note: 55, gain: 0.46 },
    { atSec: 0, durSec: 3.55, note: 60, gain: 0.5 },
    { atSec: 3.6, durSec: 3.55, note: 51, gain: 0.5 },
    { atSec: 3.6, durSec: 3.55, note: 56, gain: 0.46 },
    { atSec: 3.6, durSec: 3.55, note: 59, gain: 0.5 },
  ],
}

// C major, A flat minor, E major, C minor. The bass falls by major thirds, C A flat E C, the inner voices
// move by half step or hold, and the top goes C B B C.
const ROUND_OF_FOUR: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.63, note: 48, gain: 0.46 },
    { atSec: 0, durSec: 1.65, note: 52, gain: 0.42 },
    { atSec: 0, durSec: 1.65, note: 55, gain: 0.42 },
    { atSec: 0, durSec: 1.65, note: 60, gain: 0.42 },
    { atSec: 1.65, durSec: 1.63, note: 44, gain: 0.46 },
    { atSec: 1.65, durSec: 1.65, note: 51, gain: 0.42 },
    { atSec: 1.65, durSec: 3.3, note: 56, gain: 0.42 },
    { atSec: 1.65, durSec: 3.3, note: 59, gain: 0.42 },
    { atSec: 3.3, durSec: 1.63, note: 40, gain: 0.46 },
    { atSec: 3.3, durSec: 1.65, note: 52, gain: 0.42 },
    { atSec: 4.95, durSec: 1.63, note: 36, gain: 0.46 },
    { atSec: 4.95, durSec: 1.65, note: 51, gain: 0.42 },
    { atSec: 4.95, durSec: 1.65, note: 55, gain: 0.42 },
    { atSec: 4.95, durSec: 1.65, note: 60, gain: 0.42 },
  ],
}

// G B E flat in threes against C E A flat C in fours: two augmented triads a half step apart, which
// are together the whole six-note scale.
const THREE_ON_FOUR: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.475, note: 48, gain: 0.44 },
    { atSec: 0, durSec: 0.633, note: 67, gain: 0.46 },
    { atSec: 0.5, durSec: 0.475, note: 52, gain: 0.44 },
    { atSec: 0.667, durSec: 0.633, note: 71, gain: 0.46 },
    { atSec: 1, durSec: 0.475, note: 56, gain: 0.44 },
    { atSec: 1.333, durSec: 0.633, note: 75, gain: 0.46 },
    { atSec: 1.5, durSec: 0.475, note: 60, gain: 0.44 },
    { atSec: 2, durSec: 0.475, note: 60, gain: 0.44 },
    { atSec: 2, durSec: 0.633, note: 75, gain: 0.46 },
    { atSec: 2.5, durSec: 0.475, note: 56, gain: 0.44 },
    { atSec: 2.667, durSec: 0.633, note: 71, gain: 0.46 },
    { atSec: 3, durSec: 0.475, note: 52, gain: 0.44 },
    { atSec: 3.333, durSec: 0.633, note: 67, gain: 0.46 },
    { atSec: 3.5, durSec: 0.475, note: 48, gain: 0.44 },
    { atSec: 4, durSec: 0.475, note: 48, gain: 0.44 },
    { atSec: 4, durSec: 0.633, note: 67, gain: 0.46 },
    { atSec: 4.5, durSec: 0.475, note: 52, gain: 0.44 },
    { atSec: 4.667, durSec: 0.633, note: 71, gain: 0.46 },
    { atSec: 5, durSec: 0.475, note: 56, gain: 0.44 },
    { atSec: 5.333, durSec: 0.633, note: 75, gain: 0.46 },
    { atSec: 5.5, durSec: 0.475, note: 60, gain: 0.44 },
    { atSec: 6, durSec: 1.2, note: 48, gain: 0.46 },
    { atSec: 6, durSec: 1.2, note: 75, gain: 0.42 },
  ],
}

// A cell of a minor third and a half step lands on E, on A flat and on C, a major third apart, and turns
// back down. Three tonics in one line, none of them home.
const THREE_LANDINGS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.43, note: 60, gain: 0.5 },
    { atSec: 0.45, durSec: 0.43, note: 63, gain: 0.46 },
    { atSec: 0.9, durSec: 0.85, note: 64, gain: 0.58 },
    { atSec: 1.8, durSec: 0.43, note: 64, gain: 0.5 },
    { atSec: 2.25, durSec: 0.43, note: 67, gain: 0.46 },
    { atSec: 2.7, durSec: 0.85, note: 68, gain: 0.58 },
    { atSec: 3.6, durSec: 0.43, note: 68, gain: 0.5 },
    { atSec: 4.05, durSec: 0.43, note: 71, gain: 0.46 },
    { atSec: 4.5, durSec: 0.85, note: 72, gain: 0.58 },
    { atSec: 5.4, durSec: 0.43, note: 71, gain: 0.46 },
    { atSec: 5.85, durSec: 1.3, note: 67, gain: 0.5 },
  ],
}

// All six notes of the augmented scale built up from a fifth: C, G, E, B, E flat, A flat, one at a
// time and all held.
const SIX_NOTES_STACKED: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 48, gain: 0.5 },
    { atSec: 0.8, durSec: 6.2, note: 55, gain: 0.44 },
    { atSec: 1.6, durSec: 5.4, note: 64, gain: 0.42 },
    { atSec: 2.4, durSec: 4.6, note: 71, gain: 0.4 },
    { atSec: 3.2, durSec: 3.8, note: 75, gain: 0.38 },
    { atSec: 4, durSec: 3, note: 80, gain: 0.36 },
  ],
}

// The same six notes in thirds for high voices: C, E, G, B, E flat, A flat, one at a time and all held.
const SIX_IN_THIRDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 60, gain: 0.5 },
    { atSec: 0.8, durSec: 6.2, note: 64, gain: 0.44 },
    { atSec: 1.6, durSec: 5.4, note: 67, gain: 0.42 },
    { atSec: 2.4, durSec: 4.6, note: 71, gain: 0.42 },
    { atSec: 3.2, durSec: 3.8, note: 75, gain: 0.4 },
    { atSec: 4, durSec: 3, note: 80, gain: 0.36 },
  ],
}

// A leading tone and its tonic, four times, falling by major thirds: D sharp E, B C, G A flat, and
// D sharp E an octave down. One note at a time, in the range of a cello or a tuba.
const THREE_LEADING_TONES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.48, note: 51, gain: 0.5 },
    { atSec: 0.5, durSec: 1.15, note: 52, gain: 0.58 },
    { atSec: 1.7, durSec: 0.48, note: 47, gain: 0.5 },
    { atSec: 2.2, durSec: 1.15, note: 48, gain: 0.58 },
    { atSec: 3.4, durSec: 0.48, note: 43, gain: 0.5 },
    { atSec: 3.9, durSec: 1.15, note: 44, gain: 0.58 },
    { atSec: 5.1, durSec: 0.48, note: 39, gain: 0.5 },
    { atSec: 5.6, durSec: 1.15, note: 40, gain: 0.58 },
  ],
}

// C, A flat, E and C major sevenths on one six-note scale. Above a bass in major thirds each voice moves
// by half step or not at all: B C B B, E E flat D sharp E, G G G sharp G.
const MAJOR_SEVENTHS_TURN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.63, note: 48, gain: 0.46 },
    { atSec: 0, durSec: 1.65, note: 59, gain: 0.42 },
    { atSec: 0, durSec: 1.65, note: 64, gain: 0.42 },
    { atSec: 0, durSec: 3.3, note: 67, gain: 0.42 },
    { atSec: 1.65, durSec: 1.63, note: 44, gain: 0.46 },
    { atSec: 1.65, durSec: 1.65, note: 60, gain: 0.42 },
    { atSec: 1.65, durSec: 3.3, note: 63, gain: 0.42 },
    { atSec: 3.3, durSec: 1.63, note: 40, gain: 0.46 },
    { atSec: 3.3, durSec: 3.3, note: 59, gain: 0.42 },
    { atSec: 3.3, durSec: 1.65, note: 68, gain: 0.42 },
    { atSec: 4.95, durSec: 1.63, note: 36, gain: 0.46 },
    { atSec: 4.95, durSec: 1.65, note: 64, gain: 0.42 },
    { atSec: 4.95, durSec: 1.65, note: 67, gain: 0.42 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Tape orchestra, the eight-note scale.
  {
    id: 'keys-come-round-sevenths-on-a-slow-reel',
    name: 'Sevenths on a slow reel',
    category: 'string',
    description:
      'Taped strings with a slow bow and a darkened top, their bands swelling one by one, in a hall of four seconds.',
    preview: SEVENTHS_OVER_C,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { attack: 0.7, release: 2, tone: -0.55, age: 0.15, hiss: 0.05, volume: -8 },
    },
    effects: [
      { deviceId: 'currents', params: { depth: 0.7, sway: 0.7, rate: 0.35, bands: 4 } },
      { deviceId: 'hall-reverb', params: { lowDecay: 4, midDecay: 4, damping: 3500, mix: 0.4 } },
    ],
  },
  {
    id: 'keys-come-round-flutes-skip-a-third',
    name: 'Flutes skip a third',
    category: 'wind',
    description:
      'Straight taped flutes with a short release, each note answered by a skipping stone of nine echoes that draw closer.',
    preview: PLANING_ABOVE,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Still flutes',
      params: { attack: 0.01, release: 0.1, players: 0.2, tone: 0.2, spread: 0.2, volume: -9 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        params: { first: 420, bounce: 0.8, skips: 9, loss: 2, sink: 0.2, throw: 0.9, mix: 0.45 },
      },
    ],
  },
  {
    id: 'keys-come-round-cellos-move-one-voice',
    name: 'Cellos move one voice',
    category: 'string',
    description:
      'Cellos at half speed, an octave down and slow to speak, pushed back to the far wall of a room and wandering there.',
    preview: moved(ONE_VOICE_TURNS, 12),
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { attack: 0.35, release: 1.2, tone: 0.45, age: 0.2, hiss: 0, volume: 2 },
    },
    effects: [
      {
        deviceId: 'distance',
        params: {
          distance: 0.75,
          room: 0.8,
          air: 0.6,
          wander: 0.5,
          rate: 0.12,
          decay: 2.8,
          level: 0.5,
          width: 0.9,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-reeds-at-a-quarter-turn',
    name: 'Reeds at a quarter turn',
    category: 'wind',
    description:
      'Dry close taped reeds heard inside an open pipe, with one copy a minor third above entering a little over two seconds late.',
    preview: LEADER_ALONE,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: {
        attack: 0.01,
        release: 0.12,
        players: 0,
        vibrato: 0.15,
        age: 0.1,
        hiss: 0,
        spread: 0,
        volume: -3.5,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 1, size: 0.6, material: 0.7, opening: 0.7, air: 0.1, tone: 0.7, mix: 0.75 },
      },
      {
        deviceId: 'canon',
        params: {
          followers: 1,
          gap: 2.2,
          interval1: 3,
          fade: 0.1,
          spread: 1,
          tone: 6000,
          mix: 0.4,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-brass-from-across',
    name: 'Brass from across',
    category: 'pad',
    description:
      'Horns at half speed with a three second release, swept by eight slow phaser stages and left in a twelve second tank.',
    preview: ACROSS_THE_RING,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: {
        attack: 0.5,
        release: 3,
        tone: 0.8,
        age: 0.1,
        hiss: 0,
        players: 1,
        spread: 1,
        volume: -6,
      },
    },
    effects: [
      {
        deviceId: 'phaser',
        params: {
          stages: 2,
          centerHz: 700,
          spread: 60,
          feedback: 55,
          rate: 0.12,
          depth: 80,
          stereo: 180,
          mix: 0.5,
        },
      },
      {
        deviceId: 'fdn-reverb',
        params: { decay: 12, damping: 0.5, size: 1.6, breathDepth: 0, mix: 0.35 },
      },
    ],
  },
  {
    id: 'keys-come-round-voices-sink-in-threes',
    name: 'Voices sink in threes',
    category: 'voice',
    description:
      'A short taped choir with two late copies, a tritone and an octave under, so that a falling call sinks in stacked minor thirds.',
    preview: CELL_DOWN,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: {
        attack: 0.02,
        release: 0.25,
        vibrato: 0.1,
        age: 0,
        hiss: 0,
        tone: 0.3,
        spread: 0.3,
        volume: 0,
      },
    },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 2,
          gap: 1.65,
          interval1: -6,
          interval2: -12,
          fade: 0.15,
          spread: 1,
          tone: 5000,
          mix: 0.5,
        },
      },
      {
        deviceId: 'plate-reverb',
        params: { decay: 0.55, damping: 0.4, predelayMs: 30, mix: 0.25 },
      },
    ],
  },
  {
    id: 'keys-come-round-wheel-worn-flat',
    name: 'Wheel worn flat',
    category: 'string',
    description:
      'Three violins on a ruined tape, played back off a record with crackle and a slow warp, all its bass cut away.',
    preview: moved(ONE_VOICE_TURNS, 12),
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: {
        attack: 0.05,
        release: 0.2,
        age: 0.8,
        hiss: 0.5,
        tone: 0.1,
        players: 0.2,
        spread: 0,
        volume: -8,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 2, drive: 0.5, wobble: 0.6, wear: 0.7, noise: 0.5, tone: 0.4 },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 320, body: 3, highCut: 5200 } },
    ],
  },
  {
    id: 'keys-come-round-flutes-in-unmoved-air',
    name: 'Flutes in unmoved air',
    category: 'pad',
    description:
      'Flutes at half speed with a long attack, smeared until their notes hang as a soft bank and almost no dry sound is left.',
    preview: moved(ACROSS_THE_RING, 12),
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Lost reel',
      params: {
        age: 0.25,
        hiss: 0,
        tone: 0.4,
        attack: 0.8,
        release: 3,
        length: 9,
        players: 0.9,
        spread: 1,
        volume: -12.5,
      },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        params: { blur: 0.72, smear: 0.8, tilt: -1.5, highCut: 5000, shimmer: 0.1, mix: 0.85 },
      },
    ],
  },
  {
    id: 'keys-come-round-clipped-brass-climbs',
    name: 'Clipped brass climbs',
    category: 'keys',
    description:
      'Taped horns cut off as the key lifts, leaned into a triode and rattling three long springs.',
    preview: PLANING,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: {
        attack: 0.005,
        release: 0.04,
        players: 0.3,
        vibrato: 0,
        age: 0.1,
        hiss: 0,
        tone: 0.7,
        spread: 0.1,
        length: 4,
        volume: -16,
      },
    },
    effects: [
      { deviceId: 'analog-drive', params: { drive: 0.55, circuit: 3, tone: 0.2 } },
      {
        deviceId: 'spring-reverb',
        params: { decay: 3.5, tension: 0.35, springs: 2, drip: 0.7, tone: 4500, mix: 0.35 },
      },
    ],
  },
  {
    id: 'keys-come-round-reed-wheel-over-c',
    name: 'Reed wheel over C',
    category: 'organ',
    description:
      'Taped reeds at half speed with a quick attack, put through a spinning speaker at its fast speed and warmed by it.',
    preview: moved(SEVENTHS_OVER_C, 12),
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Low reeds',
      params: {
        attack: 0.03,
        release: 0.25,
        players: 0.4,
        tone: 0.9,
        age: 0,
        hiss: 0,
        volume: -10,
      },
    },
    effects: [
      {
        deviceId: 'rotary',
        params: {
          speed: 1,
          hornDepth: 0.9,
          drumDepth: 0.7,
          drive: 0.5,
          balance: 0.6,
          distance: 0.2,
          spread: 1,
        },
      },
    ],
  },
  // Tape orchestra, the six-note scale.
  {
    id: 'keys-come-round-round-of-slowed-voices',
    name: 'Round of slowed voices',
    category: 'voice',
    description:
      'A choir at half speed, hissing and slow, in a hall whose ten second tail is shaped like a sung oh.',
    preview: moved(ROUND_OF_FOUR, 12),
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slowed choir',
      params: { attack: 0.4, release: 2.5, tone: 0.2, hiss: 0.3, vibrato: 0.5, volume: -7 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        params: {
          vowel: 3,
          resonance: 0.8,
          voice: 0.2,
          motion: 0.2,
          decay: 10,
          highCut: 4500,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-straight-bows-two-poles',
    name: 'Straight bows, two poles',
    category: 'string',
    description:
      'One straight taped string on each note, its bass cut, beating with a copy under three hertz sharp in a blooming reverb.',
    preview: moved(FAR_POLES, 8),
    instrument: {
      deviceId: 'tape-orchestra',
      params: {
        tape: 0,
        attack: 0.5,
        release: 1.4,
        players: 0,
        vibrato: 0,
        spread: 0,
        age: 0,
        hiss: 0,
        tone: 0.8,
        volume: -9,
      },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: {
          shift: 0,
          fine: 2.6,
          mode: 0,
          feedback: 0.3,
          delay: 30,
          lfoDepth: 0,
          tone: 9000,
          width: 1,
          mix: 0.5,
        },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 260, presence: 5, air: 6 } },
      {
        deviceId: 'shaped-reverb',
        params: {
          shape: 2,
          time: 2,
          colour: 0.5,
          highCut: 14000,
          lowCut: 300,
          tail: 0.5,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-shivering-sevenths',
    name: 'Shivering sevenths',
    category: 'string',
    description:
      'A cello section cut into a fast tremolo of thirteen strokes a second that swings a little between the sides.',
    preview: MAJOR_SEVENTHS_TURN,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: { attack: 0.08, release: 0.35, tone: 0.35, vibrato: 0.2, spread: 0.6, volume: -5 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        params: { mode: 0, rate: 13, depth: 0.9, shape: 1, phase: 60, drift: 0.4, smooth: 0.1 },
      },
      { deviceId: 'ambient-eq', params: { low: -5, presence: 5, air: 2 } },
    ],
  },
  {
    id: 'keys-come-round-flute-with-three-homes',
    name: 'Flute with three homes',
    category: 'wind',
    description:
      'A single taped flute with a wide vibrato, its notes scattered over five seconds as ten dim points of echo.',
    preview: moved(THREE_LANDINGS, 12),
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: {
        players: 0,
        vibrato: 0.95,
        attack: 0.03,
        release: 0.2,
        age: 0.15,
        hiss: 0.05,
        tone: -0.3,
        spread: 0.1,
        volume: -2.5,
      },
    },
    effects: [
      {
        deviceId: 'constellation',
        params: {
          span: 5000,
          stars: 10,
          pattern: 2,
          shuffle: 6,
          fade: 0.25,
          again: 0.1,
          tone: 3500,
          width: 1,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-six-notes-in-wool',
    name: 'Six notes in wool',
    category: 'pad',
    description:
      'Sunken strings at half speed and two seconds slow, pressed through a soft fuzz between two reverbs.',
    preview: SIX_NOTES_STACKED,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Sunken strings',
      params: { attack: 2, release: 5, hiss: 0.1, age: 0.3, tone: -0.1, vibrato: 0.4, volume: -8 },
    },
    effects: [
      {
        deviceId: 'haze',
        params: {
          haze: 0.7,
          blur: 0.7,
          decay: 9,
          size: 0.8,
          tone: 0.3,
          octave: 0,
          feed: 0.2,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-bandroom-through-a-wall',
    name: 'Bandroom through a wall',
    category: 'pad',
    description:
      'Taped horns played through a small speaker at the end of a room, the microphone far off and turned away.',
    preview: ROUND_OF_FOUR,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: {
        attack: 0.2,
        release: 0.5,
        tone: -0.5,
        age: 0.5,
        hiss: 0.1,
        vibrato: 0.4,
        spread: 0.2,
        volume: -7,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: {
          speaker: 0,
          drive: 0.3,
          bass: 0.4,
          treble: -0.7,
          distance: 0.85,
          room: 0.9,
          angle: 0.8,
          noise: 0.15,
          output: 2,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-cello-leans-three-ways',
    name: 'Cello leans three ways',
    category: 'bass',
    description:
      'One taped cello that speaks at once, with its own octave below under a low filter and a short dark room.',
    preview: THREE_LEADING_TONES,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: {
        attack: 0.005,
        release: 0.2,
        players: 0.1,
        vibrato: 0.35,
        age: 0.05,
        hiss: 0,
        spread: 0,
        tone: -0.4,
        volume: -0.5,
      },
    },
    effects: [
      {
        deviceId: 'octaves',
        params: { sub1: 0.8, sub2: 0, dry: 0.8, up1: 0, up2: 0, filter: 500, spread: 0 },
      },
      { deviceId: 'ether-reverb', params: { mix: 0.15, decay: 1.6, damping: 0.8, size: 0.3 } },
    ],
  },
  {
    id: 'keys-come-round-plucked-off-the-reel',
    name: 'Plucked off the reel',
    category: 'plucked',
    description:
      'Worn strings whose low-pass filter shuts right after each attack, so the bow becomes a pluck, with dotted tape echoes.',
    preview: THREE_ON_FOUR,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Strings run out',
      params: {
        age: 0.3,
        hiss: 0,
        tone: 0.4,
        length: 2,
        release: 0.5,
        players: 0.6,
        spread: 0.5,
        volume: -4,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 260,
          resonance: 2,
          envAmount: 70,
          envAttackMs: 2,
          envReleaseMs: 160,
        },
      },
      {
        deviceId: 'tape-echo',
        params: { time: 500, feedback: 0.3, heads: 3, highCut: 3000, spread: 0.8, mix: 0.3 },
      },
    ],
  },
  {
    id: 'keys-come-round-reeds-in-a-turnstile',
    name: 'Reeds in a turnstile',
    category: 'organ',
    description:
      'A crowd of taped reeds opened and shut by two soft gates, one a little faster, so the sides drift out of step.',
    preview: FAR_POLES,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: {
        players: 1,
        attack: 0.3,
        release: 1.5,
        vibrato: 0.6,
        age: 0.4,
        tone: -0.2,
        spread: 1,
        hiss: 0,
        volume: -7,
      },
    },
    effects: [
      {
        deviceId: 'pulses',
        params: {
          rate: 3.2,
          steps: 7,
          fill: 4,
          drift: 0.4,
          shade: 0.8,
          apart: 1,
          floor: 0.05,
          length: 0.7,
          edge: 0.3,
        },
      },
    ],
  },
  // Horns, the eight-note scale.
  {
    id: 'keys-come-round-horn-a-third-farther-on',
    name: 'Horn, a third farther on',
    category: 'wind',
    description:
      'One breathy horn answered by two copies, each a minor third over the last and a little over two seconds later, in a hall.',
    preview: LEADER_ALONE,
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { attack: 0.06, release: 0.4, breath: 0.35, vibrato: 0.2, volume: 1 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 2,
          gap: 2.2,
          interval1: 3,
          interval2: 6,
          fade: 0.2,
          spread: 0.9,
          tone: 3000,
          round: 0.2,
          mix: 0.4,
        },
      },
      { deviceId: 'hall-reverb', params: { lowDecay: 2, midDecay: 3, damping: 5000, mix: 0.3 } },
    ],
  },
  {
    id: 'keys-come-round-low-brass-on-four-roots',
    name: 'Low brass on four roots',
    category: 'pad',
    description:
      'A full low brass section at half breath, its floor lifted and its top closed down, in a small dark chamber.',
    preview: SEVENTHS_OVER_C,
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 0.5, release: 1, blow: 0.55, volume: -7 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { low: 5, body: 2, presence: -6, highCut: 1800 } },
      { deviceId: 'ether-reverb', params: { mix: 0.3, decay: 2.2, damping: 0.8, size: 0.4 } },
    ],
  },
  {
    id: 'keys-come-round-trumpets-turn-in-place',
    name: 'Trumpets turn in place',
    category: 'keys',
    description:
      'A bright section of open trumpets with a hard start, circling the head and given a cold plate.',
    preview: moved(ONE_VOICE_TURNS, 9),
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { attack: 0.03, release: 0.2, blow: 0.8, breath: 0, volume: 1.5 },
    },
    effects: [
      { deviceId: 'around', params: { path: 0, rate: 0.5, radius: 1, near: 0.2, head: 1 } },
      {
        deviceId: 'plate-reverb',
        params: { decay: 0.75, damping: 0.05, predelayMs: 60, mix: 0.3 },
      },
    ],
  },
  {
    id: 'keys-come-round-flugels-with-no-floor',
    name: 'Flugels with no floor',
    category: 'pad',
    description:
      'Flugelhorns a second slow to rise, their tail sinking by six octaves a minute without arriving.',
    preview: ACROSS_THE_RING,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel choir',
      params: { attack: 1, release: 2.5, blow: 0.25, breath: 0.1, volume: -6 },
    },
    effects: [
      {
        deviceId: 'spiral',
        params: { climb: -6, decay: 10, size: 0.7, voices: 5, tone: 3500, blur: 0.6, mix: 0.55 },
      },
    ],
  },
  {
    id: 'keys-come-round-mutes-turn-one-voice',
    name: 'Mutes turn one voice',
    category: 'wind',
    description:
      'A section of muted trumpets in a deep harmonic tremolo, high-passed so that only the buzz of the mutes is left.',
    preview: moved(ONE_VOICE_TURNS, 6),
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { attack: 0.12, release: 0.4, blow: 0.6, breath: 0, vibrato: 0, volume: -1 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        params: { mode: 2, rate: 5.5, depth: 0.9, crossover: 1100, drift: 0.2 },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 400, presence: 4, air: 3 } },
    ],
  },
  {
    id: 'keys-come-round-canon-off-the-dial',
    name: 'Canon off the dial',
    category: 'wind',
    description:
      'A lone muted trumpet heard through a faded radio link, narrow and gritty, with a slow dark echo a second behind.',
    preview: LEADER_ALONE,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { attack: 0.04, release: 0.2, vibrato: 0.4, breath: 0.5, volume: 1 },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 3, drive: 0.5, wobble: 0.4, wear: 0.6, noise: 0.4, tone: 0.35 },
      },
      {
        deviceId: 'analog-delay',
        params: { time: 1100, feedback: 0.2, modDepth: 0.2, tone: 1600, spread: 0.8, mix: 0.3 },
      },
    ],
  },
  // Horns, the six-note scale.
  {
    id: 'keys-come-round-call-toward-no-home',
    name: 'Call toward no home',
    category: 'wind',
    description:
      'French horns blown hard by a section and pushed into tape, in a hall whose lows take seven seconds to die.',
    preview: FAR_POLES,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { attack: 0.35, release: 0.8, blow: 0.95, breath: 0.05, section: 0.9, volume: -9 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 8, toneDb: 2, outputDb: -4 } },
      {
        deviceId: 'hall-reverb',
        params: {
          preDelay: 100,
          crossover: 300,
          lowDecay: 7,
          midDecay: 5,
          damping: 9000,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-tuba-with-three-doors',
    name: 'Tuba with three doors',
    category: 'bass',
    description:
      'A soft tuba that starts at once, sounding inside a large stopped pipe that thickens its lowest partials.',
    preview: THREE_LEADING_TONES,
    instrument: {
      deviceId: 'horns',
      preset: 'Soft tuba',
      params: { attack: 0.03, release: 0.25, blow: 0.2, breath: 0.1, volume: -0.5 },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 2, size: 2.2, material: 0.2, opening: 0.3, air: 0.3, tone: 0.2, mix: 0.8 },
      },
    ],
  },
  {
    id: 'keys-come-round-flugel-lands-three-times',
    name: 'Flugel lands three times',
    category: 'wind',
    description:
      'One flugelhorn with a wide vibrato, its wavering bucket-brigade echoes hopping up an octave and back.',
    preview: THREE_LANDINGS,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { attack: 0.08, release: 0.5, vibrato: 0.7, breath: 0.2, blow: 0.4, volume: 0 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        params: {
          time: 450,
          feedback: 0.6,
          modDepth: 0.4,
          tone: 4500,
          intervalA: 0,
          intervalB: 6,
          step: 1,
          glide: 0.3,
          spread: 1,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-only-breath-at-the-poles',
    name: 'Only breath at the poles',
    category: 'texture',
    description:
      'A horn that is nearly all air, its quiet partials turned up one by one and its attacks blurred into a soft cloud.',
    preview: FAR_POLES,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { attack: 0.5, release: 1.5, section: 0.8, volume: -6 },
    },
    effects: [
      {
        deviceId: 'reveal',
        params: { amount: 0.9, rise: 400, detail: 0.9, focus: 0.5, range: 24 },
      },
      {
        deviceId: 'fog',
        params: { size: 420, density: 1, layers: 2, drift: 0.6, soften: 0.6, mix: 1 },
      },
    ],
  },
  {
    id: 'keys-come-round-brass-with-a-silver-lid',
    name: 'Brass with a silver lid',
    category: 'organ',
    description:
      'Low brass with one and two octaves added above it, slightly out of tune and chorused, like stops pulled over a pedal.',
    preview: MAJOR_SEVENTHS_TURN,
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 0.15, release: 0.4, blow: 0.35, section: 0.3, volume: -8 },
    },
    effects: [
      {
        deviceId: 'octaves',
        params: {
          sub1: 0,
          dry: 0.7,
          up1: 0.7,
          up2: 0.6,
          attack: 0.1,
          filter: 12000,
          detune: 0.4,
          spread: 0.9,
        },
      },
      { deviceId: 'chorus', params: { rate: 0.35, depth: 40, mix: 0.4 } },
    ],
  },
  {
    id: 'keys-come-round-mutes-lit-from-below',
    name: 'Mutes lit from below',
    category: 'pad',
    description:
      'Muted trumpets over a second in the rising, with a long tail that folds down an octave at every pass.',
    preview: moved(FAR_POLES, 4),
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { attack: 1.4, release: 3, blow: 0.2, breath: 0.3, vibrato: 0.2, volume: -5 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        params: {
          decay: 12,
          shimmer: 0.7,
          interval: 3,
          tone: 3000,
          size: 0.8,
          predelay: 120,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-fanfare-in-segments',
    name: 'Fanfare in segments',
    category: 'keys',
    description:
      'Open trumpets cut short at the key, each stab caught and replayed by a gated room that stops dead.',
    preview: moved(THREE_ON_FOUR, 4),
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: {
        type: 2,
        attack: 0.02,
        release: 0.05,
        blow: 0.5,
        breath: 0.1,
        section: 0.3,
        volume: -2,
      },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        params: {
          shape: 0,
          time: 0.35,
          density: 1,
          colour: -0.6,
          highCut: 4000,
          tail: 0,
          width: 1,
          mix: 0.55,
        },
      },
    ],
  },
  // Glass, the eight-note scale.
  {
    id: 'keys-come-round-cell-climbs-in-glass',
    name: 'Cell climbs in glass',
    category: 'bell',
    description:
      'A short glass bell whose partials are pulled apart in time, low first, and fan out again at each of the repeats.',
    preview: CELL_UP,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { decay: 1, release: 0.8, brightness: 0.35, detune: 1, spread: 0.2, volume: -9 },
    },
    effects: [
      {
        deviceId: 'prism',
        params: { time: 900, shape: 0, feedback: 0.5, bands: 24, smear: 0.4, width: 1, mix: 0.6 },
      },
    ],
  },
  {
    id: 'keys-come-round-sevenths-under-pond-ice',
    name: 'Sevenths under pond ice',
    category: 'pad',
    description:
      'A detuned glass pad under a low-pass filter that a slow wave opens and closes, heavy with the notes below.',
    preview: SEVENTHS_OVER_C,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Warm glass pad',
      params: { ratio: 3, detune: 10, attack: 0.4, release: 2, feedback: 0.2, volume: -18.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { type: 0, slope: 1, cutoffHz: 420, resonance: 1.2, lfoAmount: 45, lfoRateHz: 0.3 },
      },
      { deviceId: 'octaves', params: { sub1: 0.5, dry: 1, up1: 0, up2: 0, filter: 900 } },
    ],
  },
  {
    id: 'keys-come-round-tines-chase-a-third',
    name: 'Tines chase a third',
    category: 'keys',
    description:
      'Soft tine keys into a grain delay that climbs a minor third with every repeat and so never leaves the scale.',
    preview: LEADER_ALONE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: { brightness: 0.2, feedback: 0, decay: 1.1, release: 0.4, detune: 2, volume: -8 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        params: {
          time: 550,
          pitch: 3,
          pitchSpray: 0,
          spray: 0,
          size: 180,
          density: 6,
          feedback: 0.6,
          tone: 7000,
          spread: 1,
          mix: 0.4,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-splinters-by-quarters',
    name: 'Splinters by quarters',
    category: 'bell',
    description:
      'Very short bright glass pings made coarser by an eight-bit converter at a low rate, with nothing left to ring.',
    preview: PLANING_ABOVE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass ping',
      params: { ratio: 8, decay: 0.22, release: 0.2, brightness: 0.7, sustain: 0, volume: -6 },
    },
    effects: [
      {
        deviceId: 'vintage-digital',
        params: { rate: 5200, bits: 8, companding: 1, aliasing: 0.5, jitter: 0.2 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 8, outputGain: -5 } },
    ],
  },
  {
    id: 'keys-come-round-gong-across-the-ring',
    name: 'Gong across the ring',
    category: 'bell',
    description:
      'A dark low gong with a wide beat, its tail ageing as it rings: sagging, dimming and dripping away in pitch.',
    preview: ACROSS_THE_RING,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Dark gong',
      params: { brightness: 0.35, detune: 24, decay: 5, attack: 0.06, release: 4, volume: -9 },
    },
    effects: [
      {
        deviceId: 'melt',
        params: {
          sag: -18,
          hold: 8,
          solid: 200,
          size: 0.7,
          blur: 0.8,
          dim: 0.7,
          drip: 0.5,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-glass-on-a-fast-wheel',
    name: 'Glass on a fast wheel',
    category: 'organ',
    description:
      'A glass organ with a hard key edge, spun fast by a horn and drum and pushed a little at the cabinet.',
    preview: ONE_VOICE_TURNS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass organ',
      params: {
        ratio: 3,
        brightness: 0.45,
        attack: 0.005,
        release: 0.08,
        sustain: 1,
        detune: 0,
        feedback: 0.3,
        volume: -17,
      },
    },
    effects: [
      {
        deviceId: 'rotary',
        params: {
          speed: 1,
          hornDepth: 1,
          drumDepth: 0.3,
          drive: 0.7,
          balance: 0.75,
          distance: 0.1,
        },
      },
    ],
  },
  // Glass, the six-note scale.
  {
    id: 'keys-come-round-three-rims-four-rims',
    name: 'Three rims, four rims',
    category: 'bell',
    description:
      'Glass mallets restruck at octaves by a cascade of seven repeats that run backwards about half of the time.',
    preview: THREE_ON_FOUR,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: {
        brightness: 0.4,
        decay: 0.7,
        release: 0.6,
        spread: 0.2,
        velocity: 0.4,
        volume: -11,
      },
    },
    effects: [
      {
        deviceId: 'cascade',
        params: {
          pattern: 1,
          time: 250,
          repeats: 7,
          decay: 0.25,
          high: 0.8,
          low: 0.2,
          interval: 0,
          shape: 0.5,
          reverse: 0.5,
          spread: 1,
          tone: 7000,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-rims-filled-one-by-one',
    name: 'Rims filled one by one',
    category: 'pad',
    description:
      'Slow glass, over a second in the rising and wholly sustained, in an open space of twenty seconds.',
    preview: SIX_NOTES_STACKED,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Slow glass',
      params: {
        attack: 1.3,
        sustain: 1,
        ratio: 1,
        brightness: 0.5,
        detune: 22,
        release: 6,
        volume: -11,
      },
    },
    effects: [
      {
        deviceId: 'expanse',
        params: {
          size: 0.9,
          decay: 20,
          gravity: 0.3,
          modDepth: 0.7,
          modRate: 0.2,
          lowCut: 200,
          highCut: 9000,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-rim-with-three-tonics',
    name: 'Rim with three tonics',
    category: 'wind',
    description:
      'Rubbed glass played as a line: a soft start, no pair out of tune, a late wide vibrato and a bright room.',
    preview: THREE_LANDINGS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Rubbed glass',
      params: {
        attack: 0.12,
        release: 0.4,
        sustain: 1,
        detune: 0,
        brightness: 0.15,
        feedback: 0,
        ratio: 1,
        spread: 0.1,
        volume: -10,
      },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        params: { wait: 250, grow: 500, depth: 60, rate: 5.6, swell: 0.6, width: 0.2 },
      },
      { deviceId: 'ether-reverb', params: { mix: 0.22, decay: 3, damping: 0.2, size: 0.5 } },
    ],
  },
  {
    id: 'keys-come-round-amber-round',
    name: 'Amber round',
    category: 'pad',
    description:
      'A warm glass pad with feedback high and its pairs wide apart, folded softly and shaded above two kilohertz.',
    preview: ROUND_OF_FOUR,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Warm glass pad',
      params: {
        feedback: 0.9,
        detune: 28,
        attack: 0.15,
        release: 1.2,
        brightness: 0.5,
        volume: -17,
      },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 4, driveDb: 8, toneDb: -4, outputDb: -6 } },
      { deviceId: 'ambient-eq', params: { highCut: 2200, low: 3 } },
    ],
  },
  {
    id: 'keys-come-round-sevenths-each-a-ping',
    name: 'Sevenths, each a ping',
    category: 'keys',
    description:
      'Round glass keys with a high ping on top, wide in a three-voice chorus and thinned under two hundred hertz.',
    preview: MAJOR_SEVENTHS_TURN,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Toy keys',
      params: { ratio: 11, brightness: 0.22, decay: 2.2, release: 1.6, sustain: 0.1, volume: -10 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 220, presence: 3, air: 6 } },
      { deviceId: 'chorus', params: { rate: 1.4, depth: 75, spread: 100, mix: 0.55 } },
    ],
  },
  {
    id: 'keys-come-round-poles-in-bent-glass',
    name: 'Poles in bent glass',
    category: 'drone',
    description:
      'A bowed glass tone in a frequency shifter whose copies climb a little further with every pass of its feedback.',
    preview: FAR_POLES,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Bowed metal',
      params: { algorithm: 1, ratio: 2, attack: 0.5, release: 1.5, brightness: 0.2, volume: -14 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: {
          shift: 0,
          fine: 1.2,
          mode: 0,
          feedback: 0.8,
          delay: 80,
          lfoDepth: 0,
          tone: 3000,
          width: 1,
          mix: 0.6,
        },
      },
      { deviceId: 'stereo-widener', params: { width: 0.75 } },
    ],
  },
  // Mallets, the eight-note scale.
  {
    id: 'keys-come-round-wooden-canon-by-thirds',
    name: 'Wooden canon by thirds',
    category: 'bell',
    description:
      'A dry marimba with hardish mallets and hardly any tube, set on a small wooden soundboard, with no tail.',
    preview: CANON_AT_THE_THIRD,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.65, decay: 0.45, resonator: 0.1, damper: 0.4, width: 0.1, volume: 5.5 },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 5, size: 0.5, material: 0.3, opening: 0.6, air: 0, tone: 0.6, mix: 0.7 },
      },
    ],
  },
  {
    id: 'keys-come-round-steel-cell-upward',
    name: 'Steel cell upward',
    category: 'bell',
    description:
      'A hard glockenspiel that throws off sparks an octave up, each a little later, trailing and somewhere else.',
    preview: CELL_UP,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 0.95, decay: 0.6, damper: 0.3, volume: -0.5 },
    },
    effects: [
      {
        deviceId: 'glints',
        params: {
          density: 14,
          pitch: 0,
          size: 120,
          scatter: 900,
          sparkle: 0.7,
          trail: 0.6,
          trailTime: 300,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-celesta-bows-behind',
    name: 'Celesta, bows behind',
    category: 'keys',
    description:
      'A close celesta behind which a pad of strings grows, quick to rise, an octave halo on it and moving a good deal.',
    preview: PLANING_ABOVE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.4, damper: 0.5, width: 0.2, volume: -5.5 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        params: {
          rise: 0.15,
          fall: 1.2,
          octaves: 0.5,
          brightness: 5000,
          ensemble: 0.8,
          movement: 0.8,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-vibes-hinged-on-c',
    name: 'Vibes hinged on C',
    category: 'bell',
    description:
      'A vibraphone with its motor turning fully but once in a second, let into a fourteen second dark tank.',
    preview: moved(SEVENTHS_OVER_C, 12),
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { motorRate: 1, mallet: 0.35, decay: 4, damper: 0, volume: -7 },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        params: { decay: 14, damping: 0.75, size: 1.8, breathDepth: 0, predelayMs: 40, mix: 0.5 },
      },
    ],
  },
  {
    id: 'keys-come-round-wood-that-murmurs',
    name: 'Wood that murmurs',
    category: 'texture',
    description:
      'A soft xylophone roll under a low resonant filter, narrow and without its knocks, so only a murmur is left.',
    preview: ONE_VOICE_TURNS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Xylophone roll',
      params: { mallet: 0.1, roll: 12, resonator: 1, width: 0.1, damper: 0.8, volume: -13 },
    },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 520, resonance: 2.5 } },
      { deviceId: 'sift', params: { tones: 2, attacks: -24, air: -20, hold: 0.5, scatter: 0.2 } },
    ],
  },
  {
    id: 'keys-come-round-low-bars-far-side',
    name: 'Low bars, far side',
    category: 'bass',
    description:
      'A humming marimba moved mostly an octave lower, with a slow swell of its low bands and no bright strike.',
    preview: ACROSS_THE_RING,
    instrument: {
      deviceId: 'mallets',
      preset: 'Humming marimba',
      params: { mallet: 0.15, decay: 3, resonator: 1, volume: -6 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        params: { pitchA: -12, levelB: 0, mode: 3, spread: 0.2, mix: 0.75 },
      },
      { deviceId: 'currents', params: { depth: 0.6, rate: 0.5, bands: 3, lowHold: 40, sway: 0.3 } },
    ],
  },
  // Mallets, the six-note scale.
  {
    id: 'keys-come-round-celesta-half-undone',
    name: 'Celesta half undone',
    category: 'texture',
    description:
      'An open celesta turned mostly backwards in chunks of two thirds of a second, so notes swell in and stop.',
    preview: moved(THREE_ON_FOUR, 12),
    instrument: {
      deviceId: 'mallets',
      preset: 'Open celesta',
      params: { mallet: 0.3, decay: 1.2, damper: 0.2, volume: -4 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        params: {
          time: 667,
          feedback: 0.3,
          pitch: 0,
          smooth: 0.2,
          tone: 5000,
          spread: 1,
          mix: 0.85,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-vibes-on-a-small-amp',
    name: 'Vibes on a small amp',
    category: 'keys',
    description:
      'Vibraphone bars struck hard and damped at once, overdriven through a combo in a small room.',
    preview: moved(ROUND_OF_FOUR, 20),
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { mallet: 0.8, motor: 0, decay: 0.7, damper: 1, resonator: 1, width: 0, volume: -7 },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: {
          speaker: 1,
          drive: 0.75,
          treble: 0.3,
          distance: 0.15,
          room: 0.3,
          angle: 0.1,
          noise: 0,
          output: -2,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-rolled-sevenths-far-off',
    name: 'Rolled sevenths far off',
    category: 'pad',
    description:
      'A full marimba roll thirteen times a second heard from the next room: late, dull and nearly all reflection.',
    preview: MAJOR_SEVENTHS_TURN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { roll: 13, mallet: 0.5, damper: 0.7, width: 1, volume: 6 },
    },
    effects: [
      {
        deviceId: 'distance',
        params: {
          distance: 0.9,
          room: 0.9,
          air: 0.3,
          wander: 0.1,
          decay: 1.8,
          level: 0.65,
          width: 1,
        },
      },
      { deviceId: 'chorus', params: { voices: 0, rate: 0.2, depth: 50, mix: 0.4 } },
    ],
  },
  {
    id: 'keys-come-round-sticks-leave-a-loop',
    name: 'Sticks leave a loop',
    category: 'texture',
    description:
      'A xylophone line played into a worn loop of tape a second and eight tenths long, coming back at half its speed.',
    preview: moved(THREE_LANDINGS, 8),
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { mallet: 0.4, decay: 1.5, resonator: 0.8, volume: 0.5 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        params: {
          length: 1.8,
          feedback: 0.75,
          speed: 0,
          wear: 0.6,
          wow: 0.5,
          spread: 0.8,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-frost-on-the-bars',
    name: 'Frost on the bars',
    category: 'bell',
    description:
      'A glockenspiel rolled fast, blurred by three layers of fog with its top dulled, then doubled fourteen cents apart.',
    preview: moved(THREE_LANDINGS, 20),
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel roll',
      params: { roll: 15, mallet: 0.15, decay: 1.6, damper: 0.2, resonator: 1, volume: -6 },
    },
    effects: [
      {
        deviceId: 'fog',
        params: { size: 300, density: 1, layers: 3, soften: 0.8, damp: 0.7, mix: 0.85 },
      },
      { deviceId: 'stereo-detune', params: { detune: 14, delay: 24, mix: 0.5 } },
    ],
  },
  // Choir, the eight-note scale.
  {
    id: 'keys-come-round-one-chorister-moves',
    name: 'One chorister moves',
    category: 'voice',
    description:
      'High voices on oo, straight and close, hollowed by twelve phaser stages that take half a minute to go round.',
    preview: moved(ONE_VOICE_TURNS, 12),
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: {
        attack: 0.08,
        release: 0.4,
        ensemble: 0.2,
        vibrato: 0,
        breath: 0,
        width: 0.3,
        motion: 0,
        volume: -8,
      },
    },
    effects: [
      {
        deviceId: 'phaser',
        params: {
          stages: 4,
          centerHz: 900,
          spread: 80,
          feedback: -70,
          rate: 0.033,
          depth: 90,
          stereo: 120,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-monks-across-a-tritone',
    name: 'Monks across a tritone',
    category: 'voice',
    description:
      'Large low voices on oh with the octave below as a shadow under them, in a stone hall with eight seconds of low decay.',
    preview: ACROSS_THE_RING,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { voice: 0.8, attack: 0.5, release: 1.5, tone: 1600, breath: 0.05, volume: -8 },
    },
    effects: [
      {
        deviceId: 'octaves',
        params: { sub1: 0.9, sub2: 0, dry: 0.9, up1: 0, up2: 0, filter: 600, detune: 0.2 },
      },
      {
        deviceId: 'hall-reverb',
        params: { crossover: 400, lowDecay: 8, midDecay: 3, damping: 2500, mix: 0.4 },
      },
    ],
  },
  {
    id: 'keys-come-round-whispered-dominants',
    name: 'Whispered dominants',
    category: 'texture',
    description:
      'Voices that are all breath, scattered as a ladder of twelve bright echoes over three seconds.',
    preview: SEVENTHS_OVER_C,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 0.15, release: 0.6, vowel: 0.5, tone: 12000, motion: 0.2, volume: -10 },
    },
    effects: [
      {
        deviceId: 'constellation',
        params: {
          span: 3000,
          stars: 12,
          pattern: 3,
          fade: 0.2,
          again: 0.2,
          tone: 14000,
          width: 1,
          mix: 0.6,
        },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 350, presence: 4, air: 5 } },
    ],
  },
  {
    id: 'keys-come-round-short-ahs-down-the-ring',
    name: 'Short ahs down the ring',
    category: 'voice',
    description:
      'Clipped ahs in a swarm of hard echoes, its cave pulled large and wandering so the notes bend, with the bass cut.',
    preview: CELL_DOWN,
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: { release: 0.1, breath: 0.15, ensemble: 0.3, voice: 1, volume: -2 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        params: {
          length: 0.6,
          blur: 0.1,
          feedback: 0.82,
          highCut: 9000,
          stretch: 0.8,
          wander: 0.5,
          modulation: 0.1,
          mix: 0.6,
        },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 320, presence: 3, air: 3 } },
    ],
  },
  // Choir, the six-note scale.
  {
    id: 'keys-come-round-ee-across-the-poles',
    name: 'Ee across the poles',
    category: 'voice',
    description:
      'A thin glassy ee with a third of a second of attack, pressed into the colour of a bright bell and widened.',
    preview: moved(FAR_POLES, 8),
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { attack: 0.3, release: 1.2, voice: 1.4, tone: 12000, ensemble: 0.5, volume: -5 },
    },
    effects: [
      {
        deviceId: 'imprint',
        params: { shape: 5, amount: 1.4, shift: 5, replace: 0.5, smooth: 0.3 },
      },
      { deviceId: 'spread', params: { low: 0, mid: 1.6, high: 2, make: 0.9, smear: 0.5 } },
    ],
  },
  {
    id: 'keys-come-round-hummed-with-lid-shut',
    name: 'Hummed with lid shut',
    category: 'voice',
    description:
      'A closed-mouth choir with nothing above seven hundred hertz, wavering on a worn cassette that hisses.',
    preview: ROUND_OF_FOUR,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { attack: 0.2, release: 0.8, tone: 700, ensemble: 0.4, width: 0.2, volume: -10 },
    },
    effects: [
      {
        deviceId: 'tape',
        params: {
          drive: 0.5,
          wow: 0.8,
          flutter: 0.4,
          speed: 3,
          age: 0.6,
          hiss: 0.5,
          bump: 0.8,
          tone: 0.3,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-trebles-wound-in-a-coil',
    name: 'Trebles wound in a coil',
    category: 'voice',
    description:
      'Drifting trebles replayed as a cloud of long grains a major third up, fed back so that it keeps winding higher.',
    preview: SIX_IN_THIRDS,
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: { attack: 0.5, release: 2, ensemble: 0.4, breath: 0.1, volume: -9 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        params: {
          size: 700,
          density: 18,
          pitch: 4,
          spray: 0.4,
          scatter: 0.1,
          texture: 0.3,
          reverse: 0.3,
          feedback: 0.6,
          spread: 1,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-singer-with-three-keys',
    name: 'Singer with three keys',
    category: 'voice',
    description:
      'A solo voice with a broad vibrato, doubled a major third below a quarter of a second late, set back in a hall.',
    preview: THREE_LANDINGS,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { vibrato: 45, vowel: 0.2, release: 0.3, breath: 0.1, voice: 1.1, volume: -4 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 1,
          gap: 0.23,
          interval1: -4,
          fade: 0.05,
          spread: 1,
          tone: 4000,
          mix: 0.45,
        },
      },
      { deviceId: 'hall-reverb', params: { preDelay: 80, lowDecay: 2, midDecay: 2.5, mix: 0.35 } },
    ],
  },
  {
    id: 'keys-come-round-tenors-through-a-horn',
    name: 'Tenors through a horn',
    category: 'voice',
    description:
      'Tenors on oh driven through a bare horn loudspeaker set close, its bass gone and its middle pushed forward.',
    preview: moved(MAJOR_SEVENTHS_TURN, 4),
    instrument: {
      deviceId: 'choir',
      preset: 'Tenors oh',
      params: { attack: 0.12, release: 0.5, vibrato: 10, vowel: 0.65, volume: -4.5 },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: {
          speaker: 3,
          drive: 0.6,
          bass: -0.8,
          treble: 0.4,
          distance: 0.1,
          room: 0.15,
          angle: 0,
          noise: 0.05,
        },
      },
      { deviceId: 'stereo-detune', params: { detune: 12, delay: 20, mix: 0.45 } },
    ],
  },
  // Clarinet, the eight-note scale.
  {
    id: 'keys-come-round-reed-reads-it-backwards',
    name: 'Reed reads it backwards',
    category: 'wind',
    description:
      'A warm clarinet answered in spans of a second and six tenths by its own phrase played backwards, darker and wide.',
    preview: CELL_DOWN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { attack: 0.05, release: 0.2, breath: 0.25, volume: 1.5 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: { followers: 1, gap: 1.65, crab: 3, fade: 0, spread: 0.8, tone: 2500, mix: 0.5 },
      },
      { deviceId: 'plate-reverb', params: { decay: 0.5, damping: 0.6, mix: 0.2 } },
    ],
  },
  {
    id: 'keys-come-round-two-sopranos-one-scale',
    name: 'Two sopranos, one scale',
    category: 'wind',
    description:
      'A bright soprano reed with a hard tongue, with a second player of a larger body and fourteen cents sharp beside it.',
    preview: CANON_AT_THE_THIRD,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { attack: 0.02, release: 0.1, blow: 0.9, breath: 0.05, vibrato: 0.1, volume: 0 },
    },
    effects: [
      {
        deviceId: 'size',
        params: { size: 0.5, fine: 14, detail: 0.6, wander: 0.2, width: 0.9, mix: 0.5 },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 250, presence: 4, air: 4 } },
    ],
  },
  {
    id: 'keys-come-round-reed-organ-one-by-one',
    name: 'Reed organ, one by one',
    category: 'organ',
    description:
      'A hollow reed section turned into an organ: a sub, an octave and a fifteenth speak a little after, detuned.',
    preview: moved(ONE_VOICE_TURNS, 12),
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { attack: 0.05, release: 0.15, breath: 0.05, blow: 0.4, volume: -3 },
    },
    effects: [
      {
        deviceId: 'stops',
        params: {
          speak: 90,
          tone: 0.7,
          sub: 0.9,
          unison: 0.6,
          fifth: 0,
          octave: 0.8,
          twelfth: 0,
          fifteenth: 0.5,
          detune: 0.5,
          chiff: 0.4,
          mix: 1,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-flutter-round-the-ring',
    name: 'Flutter round the ring',
    category: 'wind',
    description:
      'A flutter-tongued reed with a fast start, its buzz caught by a spring and swept through a slow notched comb.',
    preview: CELL_UP,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { attack: 0.05, release: 0.25, breath: 0.9, growl: 1, volume: 4.5 },
    },
    effects: [
      {
        deviceId: 'flanger',
        params: { delayMs: 4, rate: 0.1, depth: 80, feedback: -60, stereo: 180, mix: 0.5 },
      },
      {
        deviceId: 'spring-reverb',
        params: { decay: 2, springs: 0, tension: 0.7, drip: 0.5, tone: 5000, mix: 0.3 },
      },
    ],
  },
  {
    id: 'keys-come-round-reeds-at-six-oclock',
    name: "Reeds at six o'clock",
    category: 'pad',
    description:
      'Tenor reeds swelling for most of a second, shut at two kilohertz, their long tail drifting toward the octave below.',
    preview: ACROSS_THE_RING,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Tenor swell',
      params: { attack: 0.8, release: 2, vibrato: 0.1, blow: 0.5, breath: 0.6, volume: -7.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { highCut: 2000, body: 3 } },
      {
        deviceId: 'bloom-reverb',
        params: { bloom: 0.8, direction: 1, season: 2, interval: 1, decay: 14, width: 1, mix: 0.6 },
      },
    ],
  },
  // Clarinet, the six-note scale.
  {
    id: 'keys-come-round-reed-with-three-leanings',
    name: 'Reed with three leanings',
    category: 'bass',
    description:
      'A bass clarinet close and dry, its lows lifted, a faint echo from a worn tape behind it.',
    preview: THREE_LEADING_TONES,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { attack: 0.04, release: 0.2, breath: 0.15, blow: 0.6, volume: -2 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 850,
          feedback: 0.2,
          heads: 0,
          wow: 0.6,
          flutter: 0.4,
          highCut: 1500,
          spread: 0.7,
          mix: 0.25,
        },
      },
      { deviceId: 'ambient-eq', params: { low: 6, presence: -5, highCut: 3000 } },
    ],
  },
  {
    id: 'keys-come-round-apricot-pipe-turning',
    name: 'Apricot pipe, turning',
    category: 'wind',
    description:
      'A double-reed colour with full vibrato, strings tuned by what it plays ringing on after each of its notes.',
    preview: THREE_LANDINGS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { vibrato: 0.9, attack: 0.1, release: 0.3, breath: 0.35, volume: -13 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        params: { mode: 2, sympathy: 0.9, strings: 10, decay: 7, width: 1, mix: 0.6 },
      },
    ],
  },
  {
    id: 'keys-come-round-hum-under-six-notes',
    name: 'Hum under six notes',
    category: 'drone',
    description:
      'Reeds at the very edge of speaking, a pure sine drawn an octave under each, and their middle pulsed three and a half times a second.',
    preview: SIX_NOTES_STACKED,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { attack: 0.8, release: 2.5, volume: -4 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: {
          partials: 6,
          transpose: -12,
          attack: 800,
          release: 4,
          spread: 0.9,
          tone: 0.2,
          mix: 0.75,
        },
      },
      {
        deviceId: 'band-pulse',
        params: { rate: 3.5, depth: 0.85, duty: 0.5, edge: 40, offset: 120, low: 80, high: 900 },
      },
    ],
  },
  {
    id: 'keys-come-round-breath-between-two-poles',
    name: 'Breath between two poles',
    category: 'texture',
    description:
      'A whispering reed with its tone sifted down until the air leads, wide, moved by a cycle of in, hold and out.',
    preview: moved(FAR_POLES, 4),
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { attack: 0.3, release: 1, volume: 6 },
    },
    effects: [
      { deviceId: 'sift', params: { tones: -14, attacks: -6, air: 6, scatter: 1 } },
      {
        deviceId: 'breath',
        params: {
          in: 1.4,
          hold: 0.3,
          out: 1.6,
          rest: 0.3,
          depth: 0.8,
          colour: 0.9,
          width: 0.8,
          air: 0.6,
        },
      },
    ],
  },
  // Droplets, the eight-note scale.
  {
    id: 'keys-come-round-rain-on-the-moved-voice',
    name: 'Rain on the moved voice',
    category: 'texture',
    description:
      'Glass rain at random, large and soft, over two octaves, each drop unfolding from its top partial down.',
    preview: ONE_VOICE_TURNS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Glass rain',
      params: {
        rain: 2.2,
        size: 0.7,
        spread: 2,
        soft: 0.7,
        trail: 1,
        splash: 0,
        ring: 1.8,
        volume: -8,
      },
    },
    effects: [
      {
        deviceId: 'prism',
        params: { time: 1200, shape: 1, bands: 16, feedback: 0.2, smear: 0.6, width: 1, mix: 0.6 },
      },
    ],
  },
  {
    id: 'keys-come-round-wooden-escapement',
    name: 'Wooden escapement',
    category: 'plucked',
    description:
      'An even pulse of small wooden ticks climbing the held chord, dry and hard, through the body of a drum.',
    preview: SEVENTHS_OVER_C,
    instrument: {
      deviceId: 'droplets',
      preset: 'Wood pulse',
      params: {
        rain: 7.5,
        size: 0.15,
        ring: 0.5,
        spread: 1,
        soft: 0,
        trail: 0,
        splash: 0.4,
        width: 0.3,
        volume: 0,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 4, size: 0.6, material: 0.5, opening: 0.4, air: 0, tone: 0.6, mix: 0.6 },
      },
    ],
  },
  {
    id: 'keys-come-round-cistern-both-sides',
    name: 'Cistern, both sides',
    category: 'drone',
    description:
      'Large water drops heard under the surface, muffled and wavering, with bubbles off every strike, in a long dark hall.',
    preview: ACROSS_THE_RING,
    instrument: {
      deviceId: 'droplets',
      preset: 'Deep pool',
      params: { rain: 3, size: 0.9, ring: 3, trail: 2, volume: -6 },
    },
    effects: [
      {
        deviceId: 'underwater',
        params: {
          depth: 0.7,
          waver: 0.7,
          bubbles: 0.7,
          bubbleSize: 0.7,
          resonance: 0.6,
          width: 0.9,
        },
      },
      { deviceId: 'hall-reverb', params: { lowDecay: 6, midDecay: 4, damping: 2500, mix: 0.4 } },
    ],
  },
  {
    id: 'keys-come-round-felt-moths-in-canon',
    name: 'Felt moths in canon',
    category: 'texture',
    description:
      'Felt drops in flurries, close and dim, rubbed down further by a worn cassette with slow wow.',
    preview: CANON_AT_THE_THIRD,
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt patter',
      params: { rain: 10, bursts: 0.8, size: 0.5, ring: 1.6, spread: 1, trail: 0.5, volume: -6 },
    },
    effects: [
      {
        deviceId: 'tape',
        params: {
          drive: 0.6,
          wow: 0.7,
          flutter: 0.5,
          speed: 3,
          age: 0.8,
          hiss: 0.2,
          tone: 0.2,
          bump: 0.7,
        },
      },
    ],
  },
  // Droplets, the six-note scale.
  {
    id: 'keys-come-round-chimes-left-to-the-round',
    name: 'Chimes left to the round',
    category: 'bell',
    description:
      'Long metal chimes, few and large, in a reverb that reads its tail back an octave higher the longer they ring.',
    preview: moved(ROUND_OF_FOUR, 12),
    instrument: {
      deviceId: 'droplets',
      preset: 'Long chimes',
      params: { rain: 1.6, ring: 2, size: 0.6, spread: 1, trail: 3, volume: -4.5 },
    },
    effects: [
      {
        deviceId: 'bloom-reverb',
        params: {
          bloom: 0.7,
          direction: 0,
          season: 0,
          interval: 1,
          decay: 10,
          width: 0.9,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'keys-come-round-glitter-on-six-notes',
    name: 'Glitter on six notes',
    category: 'texture',
    description:
      'A shower of tiny metal drops three octaves tall, thinned under five hundred hertz and wandering round the head.',
    preview: SIX_IN_THIRDS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Metal shower',
      params: {
        rain: 16,
        size: 0,
        spread: 3,
        ring: 0.4,
        soft: 0.4,
        splash: 0.4,
        trail: 1,
        volume: 0.5,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 500, presence: 2, air: 4 } },
      { deviceId: 'around', params: { path: 3, rate: 0.6, radius: 1, head: 0.9, blur: 0.2 } },
    ],
  },
  {
    id: 'keys-come-round-sevenths-ticking-over',
    name: 'Sevenths ticking over',
    category: 'bass',
    description:
      'An even felt pulse with hardly a ring, an octave of sub under each drop and a low-pass at nine hundred hertz.',
    preview: MAJOR_SEVENTHS_TURN,
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt pulse',
      params: { rain: 4.8, ring: 1, size: 0.6, spread: 0, trail: 0, splash: 0, volume: -6 },
    },
    effects: [
      {
        deviceId: 'octaves',
        params: { sub1: 0.9, dry: 0.8, up1: 0, up2: 0, filter: 400, spread: 0 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 900 } },
    ],
  },
  {
    id: 'keys-come-round-poles-in-pulsed-glass',
    name: 'Poles in pulsed glass',
    category: 'keys',
    description:
      'A strict glass pulse of five a second over two octaves, its chorused echoes crossing from side to side.',
    preview: moved(FAR_POLES, 8),
    instrument: {
      deviceId: 'droplets',
      preset: 'Glass pulse',
      params: { rain: 5, size: 0.1, spread: 2, ring: 0.8, soft: 0, volume: -3 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        params: { time: 267, feedback: 0.6, modDepth: 0.5, tone: 6000, spread: 1, mix: 0.45 },
      },
      { deviceId: 'spread', params: { low: 0, mid: 1.4, high: 2, make: 0.6 } },
    ],
  },
  // Harp, the eight-note scale.
  {
    id: 'keys-come-round-harp-on-four-hinges',
    name: 'Harp on four hinges',
    category: 'plucked',
    description:
      'A concert harp rolled slowly from the lowest string, the notes that stay from chord to chord left hanging.',
    preview: SEVENTHS_OVER_C,
    instrument: {
      deviceId: 'harp',
      preset: 'Slow rolled chord',
      params: { sweep: 0.9, decay: 1.4, touch: 0.5, volume: 0 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        params: { ago: 500, strict: 0.5, ring: 0.8, broad: 0.5, makeup: 0.9, mix: 0.6 },
      },
      { deviceId: 'ether-reverb', params: { mix: 0.25, decay: 5, damping: 0.5, size: 0.7 } },
    ],
  },
  {
    id: 'keys-come-round-silk-in-quarter-turns',
    name: 'Silk in quarter turns',
    category: 'plucked',
    description:
      'Silk strings plucked by the bridge and levelled, every note thrown again a minor third under itself in falling echoes.',
    preview: CELL_DOWN,
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { pluck: 0.1, touch: 0.35, decay: 2, damp: 0, halo: 0.2, body: 0.8, volume: 2 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        params: {
          pitchA: -3,
          levelB: 0,
          mode: 0,
          delay: 225,
          feedback: 0.55,
          tone: 8000,
          spread: 0.9,
          mix: 0.45,
        },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 22, outputGain: -9.5 } },
    ],
  },
  {
    id: 'keys-come-round-dry-harp-climbing',
    name: 'Dry harp, climbing',
    category: 'plucked',
    description:
      'A muted harp with no halo at all, leaned into a triode and shut at two and a half kilohertz.',
    preview: PLANING,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { damp: 1, halo: 0, decay: 0.35, touch: 0.15, body: 1, volume: -5 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: { drive: 0.6, circuit: 3, lowBump: 0.5, tone: -0.4, highCut: 3000 },
      },
      { deviceId: 'ambient-eq', params: { low: 3, body: 2, highCut: 2600 } },
    ],
  },
  // Harp, the six-note scale.
  {
    id: 'keys-come-round-two-triads-interlocked',
    name: 'Two triads interlocked',
    category: 'plucked',
    description:
      'A bright harp near the soundboard, caught in three uneven loops that turn out of step and crowd the meter.',
    preview: THREE_ON_FOUR,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { decay: 0.8, touch: 0.8, halo: 0.1, volume: 3.5 },
    },
    effects: [
      {
        deviceId: 'orbits',
        params: { loops: 3, length: 1.5, offset: 2, feedback: 0.7, wear: 0.4, spread: 1, mix: 0.5 },
      },
    ],
  },
  {
    id: 'keys-come-round-steel-on-four-roots',
    name: 'Steel on four roots',
    category: 'plucked',
    description:
      'Long bright steel strings deep in a fast chorus, their body cut until only wire is left, then pushed into a limiter.',
    preview: ROUND_OF_FOUR,
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { decay: 2, touch: 0.85, volume: 3 },
    },
    effects: [
      {
        deviceId: 'chorus',
        params: { rate: 3, depth: 60, spread: 100, feedback: 40, hpHz: 400, mix: 0.6 },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 200, body: -5, air: 5 } },
      { deviceId: 'fet-limiter', params: { inputGain: 19, outputGain: -9 } },
    ],
  },
  {
    id: 'keys-come-round-hollow-harp-no-home',
    name: 'Hollow harp, no home',
    category: 'plucked',
    description:
      'A dark harp plucked at its middle, then heard an octave lower at half speed in slow overlapping pieces.',
    preview: MAJOR_SEVENTHS_TURN,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { decay: 3, halo: 0.8, volume: -8 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        params: { length: 1650, speed: 2, smooth: 1, highCut: 2500, spread: 1, mix: 0.6 },
      },
    ],
  },
  {
    id: 'keys-come-round-harp-with-no-fingers',
    name: 'Harp with no fingers',
    category: 'pad',
    description:
      'A long glassy harp whose plucks are taken off, so each string fades in over half a second into a huge dark hall.',
    preview: SIX_NOTES_STACKED,
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { decay: 4, halo: 1, volume: -3 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 550, sensitivity: -50, retrigger: 0, curve: 0.5 } },
      { deviceId: 'expanse', params: { size: 1, decay: 16, gravity: 0, highCut: 3500, mix: 0.5 } },
      { deviceId: 'ambient-comp', params: { threshold: -32, ratio: 3, makeup: 6 } },
    ],
  },
  // Chamber strings, the eight-note scale.
  {
    id: 'keys-come-round-tremolo-up-the-wheel',
    name: 'Tremolo up the wheel',
    category: 'string',
    description:
      'Six bright players starting hard, broken into fourteen strokes a second and held in a small live room.',
    preview: PLANING,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { players: 6, bow: 0.7, release: 0.35, scatter: 0.6, width: 1, volume: -0.5 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        params: { mode: 0, rate: 14, depth: 1, shape: 2, phase: 90, drift: 0.5, smooth: 0.4 },
      },
      { deviceId: 'ether-reverb', params: { mix: 0.3, decay: 1.8, damping: 0.2, size: 0.4 } },
    ],
  },
  {
    id: 'keys-come-round-viols-pass-one-note',
    name: 'Viols pass one note',
    category: 'string',
    description:
      'A viol consort with no vibrato, narrow and close inside a shell that rings a little.',
    preview: moved(ONE_VOICE_TURNS, 3),
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { attack: 0.15, release: 0.4, players: 3, bow: 0.85, mute: 0.4, volume: -4 },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 3, size: 0.9, material: 0.3, opening: 0.5, air: 0.1, tone: 0.5, mix: 0.7 },
      },
    ],
  },
  {
    id: 'keys-come-round-bows-over-the-held-c',
    name: 'Bows over the held C',
    category: 'string',
    description:
      'A muted section most of a second in the rising, shut at fifteen hundred hertz, an octave swelling in under each note.',
    preview: SEVENTHS_OVER_C,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 0.8, release: 2, vibrato: 5, scatter: 0.6, width: 1, volume: -6 },
    },
    effects: [
      {
        deviceId: 'octaves',
        params: { sub1: 0.8, dry: 0.8, up1: 0, up2: 0, attack: 1, filter: 700, spread: 0.6 },
      },
      { deviceId: 'ambient-eq', params: { highCut: 1500, low: 2 } },
      {
        deviceId: 'fdn-reverb',
        params: { decay: 6, damping: 0.6, size: 1.4, breathDepth: 0, mix: 0.35 },
      },
    ],
  },
  // Chamber strings, the six-note scale.
  {
    id: 'keys-come-round-bridge-bows-far-poles',
    name: 'Bridge bows, far poles',
    category: 'string',
    description:
      'Three still players bowing on the bridge, glassy, given two octaves above that are fainter and slightly out of tune.',
    preview: moved(FAR_POLES, 8),
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { attack: 0.4, release: 1.2, scatter: 0, volume: -5.5 },
    },
    effects: [
      {
        deviceId: 'octaves',
        params: { sub1: 0, dry: 0.9, up1: 0.5, up2: 0.3, detune: 0.7, filter: 16000, spread: 1 },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 280, low: -4, air: 4 } },
    ],
  },
  {
    id: 'keys-come-round-fiddle-in-three-keys',
    name: 'Fiddle in three keys',
    category: 'string',
    description:
      'A close solo fiddle, mono and a little overdriven, played to the needle of an old record.',
    preview: moved(THREE_LANDINGS, 4),
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { attack: 0.06, release: 0.25, bow: 0.6, vibrato: 18, volume: -9 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 2, driveDb: 10, toneDb: -2, outputDb: -6 } },
      {
        deviceId: 'patina',
        params: { medium: 2, drive: 0.6, wobble: 0.3, wear: 0.8, noise: 0.6, tone: 0.6 },
      },
    ],
  },
  {
    id: 'keys-come-round-round-of-gut-and-air',
    name: 'Round of gut and air',
    category: 'pad',
    description:
      'Whispered bows that are mostly air, in a wide murmuration of ten copies at their own distances.',
    preview: ROUND_OF_FOUR,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { attack: 0.5, release: 1.5, air: 1, bow: 0.05, mute: 0.3, volume: -5 },
    },
    effects: [
      {
        deviceId: 'murmuration',
        params: {
          birds: 10,
          speed: 1.2,
          turns: 0.6,
          range: 18,
          air: 0.3,
          lift: 0.5,
          spread: 1,
          mix: 0.8,
        },
      },
    ],
  },
  // Thesis: the mirror round D, F or A flat keeps the eight-note scale inside itself.
  {
    id: 'keys-come-round-mirror-that-keeps-faith',
    name: 'Mirror that keeps faith',
    category: 'pad',
    description:
      'Filtered noise with every note mirrored round D, where the eight-note scale reflects into itself, breathing slowly.',
    preview: ONE_VOICE_TURNS,
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: {
        center: 62,
        scale: 12,
        resonance: 60,
        attack: 0.3,
        release: 1.5,
        breatheRate: 0.4,
        width: 80,
      },
    },
    effects: [
      { deviceId: 'plate-reverb', params: { decay: 0.7, damping: 0.3, mix: 0.3 } },
      { deviceId: 'ambient-limiter', params: { ceiling: -9, gain: 10 } },
    ],
  },
  {
    id: 'keys-come-round-octaves-folded-round-f',
    name: 'Octaves folded round F',
    category: 'drone',
    description:
      'Dark wide bands of noise with each note also in the octave beyond F, drifting, under a low-pass of a thousand hertz.',
    preview: ACROSS_THE_RING,
    instrument: {
      deviceId: 'thesis',
      preset: 'Drifting Minor',
      params: {
        center: 65,
        scale: 12,
        root: 0,
        mirrorEnabled: 0,
        octaflipEnabled: 1,
        resonance: 14,
        width: 100,
        attack: 0.6,
        release: 2.5,
        breatheRate: 0.2,
      },
    },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 1000 } },
      { deviceId: 'ambient-limiter', params: { ceiling: -9, gain: 0 } },
    ],
  },
  {
    id: 'keys-come-round-noise-plucked-in-thirds',
    name: 'Noise plucked in thirds',
    category: 'plucked',
    description:
      'A fast strummed noise pluck of high resonance, mirrored round A flat with its octaves, with dim tape echoes behind.',
    preview: CANON_AT_THE_THIRD,
    instrument: {
      deviceId: 'thesis',
      preset: 'Strummed Lydian',
      params: {
        center: 68,
        scale: 12,
        middleEnabled: 0,
        resonance: 90,
        attack: 0.01,
        release: 0.5,
        strum: 30,
        width: 90,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: { time: 1100, feedback: 0.2, heads: 1, highCut: 2500, spread: 0.8, mix: 0.3 },
      },
      { deviceId: 'ambient-limiter', params: { ceiling: -9, gain: 6 } },
    ],
  },
  // Feedback, the six-note scale.
  {
    id: 'keys-come-round-six-strings-unstruck',
    name: 'Six strings unstruck',
    category: 'drone',
    description:
      'Damped strings that nobody plucks, raised by their amplifier on the note itself and left in a long dark haze.',
    preview: SIX_NOTES_STACKED,
    instrument: {
      deviceId: 'feedback',
      preset: 'Dark sustain',
      params: { pick: 0, bloom: 0.9, gain: 0.85, damp: 0.9, crowd: 0.2, release: 2, volume: -10 },
    },
    effects: [
      {
        deviceId: 'haze',
        params: { haze: 0.2, blur: 0.8, decay: 8, tone: 0.2, octave: 0, feed: 0.1, mix: 0.45 },
      },
    ],
  },
  {
    id: 'keys-come-round-wire-with-three-names',
    name: 'Wire with three names',
    category: 'string',
    description:
      'A plucked wire caught at once and sung pure on its octave, doubled a few cents wide, one echo behind.',
    preview: THREE_LANDINGS,
    instrument: {
      deviceId: 'feedback',
      preset: 'Pure twelfth',
      params: {
        distance: 2,
        bloom: 0.15,
        pick: 0.7,
        gain: 0.7,
        damp: 0.15,
        release: 0.4,
        volume: -5,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', params: { detune: 16, delay: 20, mix: 0.5 } },
      {
        deviceId: 'tape-echo',
        params: { time: 675, feedback: 0.1, highCut: 3500, spread: 0.9, mix: 0.3 },
      },
    ],
  },
  {
    id: 'keys-come-round-poles-with-torn-edges',
    name: 'Poles with torn edges',
    category: 'drone',
    description:
      'A gritty reed-like howl on held chords, its ringing tones turned down and its top rolled away at three kilohertz.',
    preview: FAR_POLES,
    instrument: {
      deviceId: 'feedback',
      preset: 'Reed tone',
      params: {
        grit: 0.85,
        bloom: 0.3,
        pick: 0.3,
        crowd: 0.1,
        wander: 0.3,
        release: 0.8,
        volume: -9.5,
      },
    },
    effects: [
      { deviceId: 'tamer', params: { depth: 0.8, sharpness: 0.7, time: 60 } },
      { deviceId: 'ambient-eq', params: { highCut: 3000, body: 2 } },
      { deviceId: 'spring-reverb', params: { decay: 3, tension: 0.4, mix: 0.25 } },
    ],
  },
]
