import { type FactoryPreset, type Phrase } from '../types'

// One note is held and never moves, and the floor under it walks: the same E is in turn root, flat
// ninth, third, fourth, raised eleventh, fifth, sixth and seventh of somebody else's chord. Colours
// go with the roles: dark for a root, warm for a third or a sixth, bright for an eleventh or a seventh.
// What rings on or hangs in a long echo is heard on white-key floors, what stops on the chromatic ones.

// E4 held. Under it E, C#m7, Cmaj7, Bm11: root, third, third, fourth.
const LANDINGS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 1.65, note: 52, gain: 0.44 },
    { atSec: 0, durSec: 1.65, note: 56, gain: 0.34 },
    { atSec: 0, durSec: 1.65, note: 59, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 49, gain: 0.44 },
    { atSec: 1.65, durSec: 1.65, note: 56, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 59, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 48, gain: 0.44 },
    { atSec: 3.3, durSec: 1.65, note: 55, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 59, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 47, gain: 0.44 },
    { atSec: 4.95, durSec: 1.65, note: 54, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 57, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 62, gain: 0.34 },
  ],
}

// The same four floors with E4 struck again on each, for what dies away.
const LANDINGS_STRUCK: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 1.65, note: 52, gain: 0.44 },
    { atSec: 0, durSec: 1.65, note: 56, gain: 0.34 },
    { atSec: 0, durSec: 1.65, note: 59, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 1.65, durSec: 1.65, note: 49, gain: 0.44 },
    { atSec: 1.65, durSec: 1.65, note: 56, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 59, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 3.3, durSec: 1.65, note: 48, gain: 0.44 },
    { atSec: 3.3, durSec: 1.65, note: 55, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 59, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 4.95, durSec: 1.65, note: 47, gain: 0.44 },
    { atSec: 4.95, durSec: 1.65, note: 54, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 57, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 62, gain: 0.34 },
  ],
}

// E4 held. Bb maj7(#11), Am9, Gm6, F#m7: eleventh, fifth, sixth, seventh.
const LOWER_LANDINGS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 1.65, note: 46, gain: 0.44 },
    { atSec: 0, durSec: 1.65, note: 53, gain: 0.34 },
    { atSec: 0, durSec: 1.65, note: 57, gain: 0.34 },
    { atSec: 0, durSec: 1.65, note: 62, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 45, gain: 0.44 },
    { atSec: 1.65, durSec: 1.65, note: 55, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 59, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 60, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 43, gain: 0.44 },
    { atSec: 3.3, durSec: 1.65, note: 55, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 58, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 62, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 42, gain: 0.44 },
    { atSec: 4.95, durSec: 1.65, note: 49, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 57, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 61, gain: 0.34 },
  ],
}

// The roles in order, E4 struck again on each floor: root of E, flat ninth of D#7,
// ninth of Dmaj9, minor third of C#m7.
const ROLES_ONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 1.65, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 3.3, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 4.95, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 1.65, note: 52, gain: 0.44 },
    { atSec: 0, durSec: 1.65, note: 59, gain: 0.34 },
    { atSec: 0, durSec: 1.65, note: 68, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 51, gain: 0.44 },
    { atSec: 1.65, durSec: 1.65, note: 61, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 67, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 50, gain: 0.44 },
    { atSec: 3.3, durSec: 1.65, note: 61, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 66, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 49, gain: 0.44 },
    { atSec: 4.95, durSec: 1.65, note: 59, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 68, gain: 0.34 },
  ],
}

// Third of Cmaj9, fourth of B7sus4, raised eleventh of Bbmaj7, fifth of Am9.
const ROLES_TWO: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 1.65, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 3.3, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 4.95, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 1.65, note: 48, gain: 0.44 },
    { atSec: 0, durSec: 1.65, note: 59, gain: 0.34 },
    { atSec: 0, durSec: 1.65, note: 62, gain: 0.34 },
    { atSec: 0, durSec: 1.65, note: 67, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 47, gain: 0.44 },
    { atSec: 1.65, durSec: 1.65, note: 54, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 59, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 69, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 46, gain: 0.44 },
    { atSec: 3.3, durSec: 1.65, note: 57, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 62, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 69, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 45, gain: 0.44 },
    { atSec: 4.95, durSec: 1.65, note: 55, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 60, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 71, gain: 0.34 },
  ],
}

// Raised fifth of Ab augmented, sixth of Gm6, seventh of F#m7, major seventh of Fmaj7.
const ROLES_THREE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 1.65, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 3.3, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 4.95, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 1.65, note: 44, gain: 0.44 },
    { atSec: 0, durSec: 1.65, note: 60, gain: 0.34 },
    { atSec: 0, durSec: 1.65, note: 72, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 43, gain: 0.44 },
    { atSec: 1.65, durSec: 1.65, note: 58, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 74, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 42, gain: 0.44 },
    { atSec: 3.3, durSec: 1.65, note: 57, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 61, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 69, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 41, gain: 0.44 },
    { atSec: 4.95, durSec: 1.65, note: 53, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 57, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 72, gain: 0.34 },
  ],
}

// White keys only, the floor falling by thirds: E5 is 1 of Em, 3 of C, 5 of Am, 7 of Fmaj7,
// 9 of Dm9, 11 of B half-diminished, 13 of G13.
const ODD_NUMBERS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.88, note: 76, gain: 0.5 },
    { atSec: 1.88, durSec: 1.88, note: 76, gain: 0.5 },
    { atSec: 3.76, durSec: 1.88, note: 76, gain: 0.5 },
    { atSec: 5.64, durSec: 0.94, note: 76, gain: 0.5 },
    { atSec: 0, durSec: 0.94, note: 52, gain: 0.44 },
    { atSec: 0, durSec: 0.94, note: 59, gain: 0.34 },
    { atSec: 0, durSec: 0.94, note: 67, gain: 0.34 },
    { atSec: 0, durSec: 0.94, note: 71, gain: 0.34 },
    { atSec: 0.94, durSec: 0.94, note: 48, gain: 0.44 },
    { atSec: 0.94, durSec: 0.94, note: 60, gain: 0.34 },
    { atSec: 0.94, durSec: 0.94, note: 67, gain: 0.34 },
    { atSec: 0.94, durSec: 0.94, note: 72, gain: 0.34 },
    { atSec: 1.88, durSec: 0.94, note: 45, gain: 0.44 },
    { atSec: 1.88, durSec: 0.94, note: 60, gain: 0.34 },
    { atSec: 1.88, durSec: 0.94, note: 69, gain: 0.34 },
    { atSec: 1.88, durSec: 0.94, note: 72, gain: 0.34 },
    { atSec: 2.82, durSec: 0.94, note: 41, gain: 0.44 },
    { atSec: 2.82, durSec: 0.94, note: 60, gain: 0.34 },
    { atSec: 2.82, durSec: 0.94, note: 69, gain: 0.34 },
    { atSec: 2.82, durSec: 0.94, note: 72, gain: 0.34 },
    { atSec: 3.76, durSec: 0.94, note: 50, gain: 0.44 },
    { atSec: 3.76, durSec: 0.94, note: 60, gain: 0.34 },
    { atSec: 3.76, durSec: 0.94, note: 65, gain: 0.34 },
    { atSec: 3.76, durSec: 0.94, note: 69, gain: 0.34 },
    { atSec: 4.7, durSec: 0.94, note: 47, gain: 0.44 },
    { atSec: 4.7, durSec: 0.94, note: 62, gain: 0.34 },
    { atSec: 4.7, durSec: 0.94, note: 65, gain: 0.34 },
    { atSec: 4.7, durSec: 0.94, note: 69, gain: 0.34 },
    { atSec: 5.64, durSec: 0.94, note: 43, gain: 0.44 },
    { atSec: 5.64, durSec: 0.94, note: 62, gain: 0.34 },
    { atSec: 5.64, durSec: 0.94, note: 65, gain: 0.34 },
    { atSec: 5.64, durSec: 0.94, note: 71, gain: 0.34 },
  ],
}

// The middle of the same ladder, slowly: fifth of Am, seventh of Fmaj7, ninth of Dm9,
// eleventh of B half-diminished, under one E5.
const THIRDS_DOWN: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 76, gain: 0.5 },
    { atSec: 0, durSec: 1.65, note: 45, gain: 0.44 },
    { atSec: 0, durSec: 1.65, note: 60, gain: 0.34 },
    { atSec: 0, durSec: 1.65, note: 69, gain: 0.34 },
    { atSec: 0, durSec: 1.65, note: 72, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 41, gain: 0.44 },
    { atSec: 1.65, durSec: 1.65, note: 60, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 69, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 72, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 50, gain: 0.44 },
    { atSec: 3.3, durSec: 1.65, note: 60, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 65, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 69, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 47, gain: 0.44 },
    { atSec: 4.95, durSec: 1.65, note: 62, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 65, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 69, gain: 0.34 },
  ],
}

// Two voices: E4 held over the whole walk, E C# C B Bb A G F#.
const WALK_LOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.56, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 0.82, note: 52, gain: 0.5 },
    { atSec: 0.82, durSec: 0.82, note: 49, gain: 0.5 },
    { atSec: 1.64, durSec: 0.82, note: 48, gain: 0.5 },
    { atSec: 2.46, durSec: 0.82, note: 47, gain: 0.5 },
    { atSec: 3.28, durSec: 0.82, note: 46, gain: 0.5 },
    { atSec: 4.1, durSec: 0.82, note: 45, gain: 0.5 },
    { atSec: 4.92, durSec: 0.82, note: 43, gain: 0.5 },
    { atSec: 5.74, durSec: 0.82, note: 42, gain: 0.5 },
  ],
}

// The same walk in a reed, E5 over E4 down to F#3.
const WALK_REED: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.56, note: 76, gain: 0.5 },
    { atSec: 0, durSec: 0.82, note: 64, gain: 0.5 },
    { atSec: 0.82, durSec: 0.82, note: 61, gain: 0.5 },
    { atSec: 1.64, durSec: 0.82, note: 60, gain: 0.5 },
    { atSec: 2.46, durSec: 0.82, note: 59, gain: 0.5 },
    { atSec: 3.28, durSec: 0.82, note: 58, gain: 0.5 },
    { atSec: 4.1, durSec: 0.82, note: 57, gain: 0.5 },
    { atSec: 4.92, durSec: 0.82, note: 55, gain: 0.5 },
    { atSec: 5.74, durSec: 0.82, note: 54, gain: 0.5 },
  ],
}

// For high winds: E5 over E, D, C#, C, as root, ninth, third and third again.
const WALK_HIGH: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 76, gain: 0.5 },
    { atSec: 0, durSec: 1.65, note: 64, gain: 0.44 },
    { atSec: 0, durSec: 1.65, note: 68, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 62, gain: 0.44 },
    { atSec: 1.65, durSec: 1.65, note: 69, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 61, gain: 0.44 },
    { atSec: 3.3, durSec: 1.65, note: 71, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 60, gain: 0.44 },
    { atSec: 4.95, durSec: 1.65, note: 67, gain: 0.34 },
  ],
}

// The floor climbs to the held note: Cmaj7, Dm9, Fmaj7, Am, all under one E5.
const FLOOR_RISING: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 76, gain: 0.5 },
    { atSec: 0, durSec: 1.65, note: 60, gain: 0.44 },
    { atSec: 0, durSec: 1.65, note: 67, gain: 0.34 },
    { atSec: 0, durSec: 1.65, note: 71, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 62, gain: 0.44 },
    { atSec: 1.65, durSec: 1.65, note: 65, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 72, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 65, gain: 0.44 },
    { atSec: 3.3, durSec: 1.65, note: 69, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 72, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 69, gain: 0.44 },
    { atSec: 4.95, durSec: 1.65, note: 72, gain: 0.34 },
  ],
}

// The other way up: C2 held, and C, Dm, Eb, F, Gm, Ab, Bb, C over it.
const INVERSE: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.56, note: 36, gain: 0.5 },
    { atSec: 0, durSec: 0.82, note: 55, gain: 0.36 },
    { atSec: 0, durSec: 0.82, note: 60, gain: 0.36 },
    { atSec: 0, durSec: 0.82, note: 64, gain: 0.36 },
    { atSec: 0.82, durSec: 0.82, note: 57, gain: 0.36 },
    { atSec: 0.82, durSec: 0.82, note: 62, gain: 0.36 },
    { atSec: 0.82, durSec: 0.82, note: 65, gain: 0.36 },
    { atSec: 1.64, durSec: 0.82, note: 58, gain: 0.36 },
    { atSec: 1.64, durSec: 0.82, note: 63, gain: 0.36 },
    { atSec: 1.64, durSec: 0.82, note: 67, gain: 0.36 },
    { atSec: 2.46, durSec: 0.82, note: 57, gain: 0.36 },
    { atSec: 2.46, durSec: 0.82, note: 60, gain: 0.36 },
    { atSec: 2.46, durSec: 0.82, note: 65, gain: 0.36 },
    { atSec: 3.28, durSec: 0.82, note: 58, gain: 0.36 },
    { atSec: 3.28, durSec: 0.82, note: 62, gain: 0.36 },
    { atSec: 3.28, durSec: 0.82, note: 67, gain: 0.36 },
    { atSec: 4.1, durSec: 0.82, note: 60, gain: 0.36 },
    { atSec: 4.1, durSec: 0.82, note: 63, gain: 0.36 },
    { atSec: 4.1, durSec: 0.82, note: 68, gain: 0.36 },
    { atSec: 4.92, durSec: 0.82, note: 58, gain: 0.36 },
    { atSec: 4.92, durSec: 0.82, note: 62, gain: 0.36 },
    { atSec: 4.92, durSec: 0.82, note: 65, gain: 0.36 },
    { atSec: 5.74, durSec: 0.82, note: 55, gain: 0.36 },
    { atSec: 5.74, durSec: 0.82, note: 60, gain: 0.36 },
    { atSec: 5.74, durSec: 0.82, note: 64, gain: 0.36 },
  ],
}

// Two notes at a time: E4 over A, G, F, C, as fifth, sixth, major seventh, third.
const WHITE_PAIR: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 1.65, note: 57, gain: 0.44 },
    { atSec: 1.65, durSec: 1.65, note: 55, gain: 0.44 },
    { atSec: 3.3, durSec: 1.65, note: 53, gain: 0.44 },
    { atSec: 4.95, durSec: 1.65, note: 48, gain: 0.44 },
  ],
}

// White keys, the floor falling A G F E with a voice in tenths above it: Am, G6, Fmaj7, Em,
// and E4 held is their fifth, sixth, major seventh and root.
const LAMENT: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 1.65, note: 45, gain: 0.44 },
    { atSec: 0, durSec: 1.65, note: 60, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 43, gain: 0.44 },
    { atSec: 1.65, durSec: 1.65, note: 59, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 41, gain: 0.44 },
    { atSec: 3.3, durSec: 1.65, note: 57, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 40, gain: 0.44 },
    { atSec: 4.95, durSec: 1.65, note: 55, gain: 0.34 },
  ],
}

// The same four floors for a reed, A3 down to E3 under a held E5.
const REED_LAMENT: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 76, gain: 0.5 },
    { atSec: 0, durSec: 1.65, note: 57, gain: 0.44 },
    { atSec: 0, durSec: 1.65, note: 72, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 55, gain: 0.44 },
    { atSec: 1.65, durSec: 1.65, note: 71, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 53, gain: 0.44 },
    { atSec: 3.3, durSec: 1.65, note: 69, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 52, gain: 0.44 },
    { atSec: 4.95, durSec: 1.65, note: 67, gain: 0.34 },
  ],
}

// E, C#m7, Cmaj7, Bm11 under a held E5, all of it inside a clarinet.
const REED_LANDINGS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 76, gain: 0.5 },
    { atSec: 0, durSec: 1.65, note: 64, gain: 0.44 },
    { atSec: 0, durSec: 1.65, note: 68, gain: 0.34 },
    { atSec: 0, durSec: 1.65, note: 71, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 61, gain: 0.44 },
    { atSec: 1.65, durSec: 1.65, note: 68, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 71, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 60, gain: 0.44 },
    { atSec: 3.3, durSec: 1.65, note: 67, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 71, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 59, gain: 0.44 },
    { atSec: 4.95, durSec: 1.65, note: 66, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 69, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 74, gain: 0.34 },
  ],
}

// A cadence with one note in common, E4 struck on each floor: ninth of Dm9, thirteenth of G13,
// third of Cmaj7, fifth of Am7.
const COMMON_TONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 1.65, note: 50, gain: 0.44 },
    { atSec: 0, durSec: 1.65, note: 53, gain: 0.34 },
    { atSec: 0, durSec: 1.65, note: 60, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 1.65, durSec: 1.65, note: 43, gain: 0.44 },
    { atSec: 1.65, durSec: 1.65, note: 53, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 59, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 3.3, durSec: 1.65, note: 48, gain: 0.44 },
    { atSec: 3.3, durSec: 1.65, note: 52, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 59, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 64, gain: 0.55 },
    { atSec: 4.95, durSec: 1.65, note: 45, gain: 0.44 },
    { atSec: 4.95, durSec: 1.65, note: 55, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 60, gain: 0.34 },
  ],
}

// Five notes only: E4 over A, G, D, C, as fifth, sixth, ninth and third.
const FIVE_NOTES: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 1.65, note: 45, gain: 0.44 },
    { atSec: 0, durSec: 1.65, note: 60, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 43, gain: 0.44 },
    { atSec: 1.65, durSec: 1.65, note: 62, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 50, gain: 0.44 },
    { atSec: 3.3, durSec: 1.65, note: 57, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 48, gain: 0.44 },
    { atSec: 4.95, durSec: 1.65, note: 55, gain: 0.34 },
  ],
}

// The floor falls by whole tones: E4 is third of C7(#5), raised eleventh of Bb7,
// raised fifth of Ab7, seventh of F#7.
const WHOLE_TONES: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 1.65, note: 48, gain: 0.44 },
    { atSec: 0, durSec: 1.65, note: 58, gain: 0.34 },
    { atSec: 0, durSec: 1.65, note: 68, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 46, gain: 0.44 },
    { atSec: 1.65, durSec: 1.65, note: 56, gain: 0.34 },
    { atSec: 1.65, durSec: 1.65, note: 62, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 44, gain: 0.44 },
    { atSec: 3.3, durSec: 1.65, note: 54, gain: 0.34 },
    { atSec: 3.3, durSec: 1.65, note: 60, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 42, gain: 0.44 },
    { atSec: 4.95, durSec: 1.65, note: 52, gain: 0.34 },
    { atSec: 4.95, durSec: 1.65, note: 58, gain: 0.34 },
  ],
}

// Broken from the floor up, E5 last each time, on white keys so that what rings on agrees:
// Cmaj7, Am7, Fmaj7, Dm9, as third, fifth, seventh and ninth.
const RIPPLE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.65, note: 48, gain: 0.5 },
    { atSec: 0.22, durSec: 1.43, note: 59, gain: 0.4 },
    { atSec: 0.44, durSec: 1.21, note: 67, gain: 0.4 },
    { atSec: 0.66, durSec: 0.99, note: 76, gain: 0.6 },
    { atSec: 1.65, durSec: 1.65, note: 45, gain: 0.5 },
    { atSec: 1.87, durSec: 1.43, note: 60, gain: 0.4 },
    { atSec: 2.09, durSec: 1.21, note: 67, gain: 0.4 },
    { atSec: 2.31, durSec: 0.99, note: 76, gain: 0.6 },
    { atSec: 3.3, durSec: 1.65, note: 41, gain: 0.5 },
    { atSec: 3.52, durSec: 1.43, note: 60, gain: 0.4 },
    { atSec: 3.74, durSec: 1.21, note: 69, gain: 0.4 },
    { atSec: 3.96, durSec: 0.99, note: 76, gain: 0.6 },
    { atSec: 4.95, durSec: 1.65, note: 50, gain: 0.5 },
    { atSec: 5.17, durSec: 1.43, note: 60, gain: 0.4 },
    { atSec: 5.39, durSec: 1.21, note: 65, gain: 0.4 },
    { atSec: 5.61, durSec: 0.99, note: 76, gain: 0.6 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // magnet-piano
  {
    id: 'one-note-twelve-floors-root-in-the-cellar',
    name: 'Root in the cellar',
    category: 'drone',
    description:
      'Magnet-sung strings with hardly an overtone in them, a wooden body round them, cut off above 1 kHz and set in a dark hall.',
    preview: LANDINGS,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Low magnets',
      params: {
        bloom: 0.8,
        bright: 0.1,
        shimmer: 0,
        body: 1,
        width: 0.15,
        damper: 2.5,
        volume: -16,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1000 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-flat-nine-on-the-stair',
    name: 'Flat nine on the stair',
    category: 'pad',
    description:
      'Magnets feeding the third harmonic of every string, hollowed by a negative phaser and rung down a long tank of three springs.',
    preview: ROLES_ONE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Twelfth organ',
      params: { bloom: 0.4, bright: 0.35, shimmer: 0.05, damper: 0.8, volume: -10 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Negative notch', params: { rate: 0.12 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring' },
    ],
  },
  {
    id: 'one-note-twelve-floors-ninth-behind-glass',
    name: 'Ninth behind glass',
    category: 'pad',
    description:
      'Wide, shimmering magnets on the second harmonic, spiralling in a detuned feedback copy and lit by a bright plate.',
    preview: ROLES_ONE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Wide shimmer',
      params: { bloom: 1.1, harmonic: 2, bright: 0.5, damper: 2 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Spiral' },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'one-note-twelve-floors-coats-in-the-hall',
    name: 'Coats in the hall',
    category: 'keys',
    description:
      'A felt hammer with the magnets close behind it, in a full wooden body, muffled on a blanketed cassette in a small room.',
    preview: ROLES_ONE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Dark wood',
      params: { bloom: 0.5, hammer: 0.75, bright: 0.35, damper: 0.7, volume: -15 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-lamp-under-the-third',
    name: 'Lamp under the third',
    category: 'keys',
    description:
      'Half hammer and half magnet, bright-bodied, warmed by a triode and left in a faint haze of fuzz and room.',
    preview: ROLES_TWO,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Felt and magnets',
      params: { bloom: 1, bright: 0.65, hammer: 0.5, body: 0.9, volume: -12 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-fourth-leaning-out',
    name: 'Fourth leaning out',
    category: 'texture',
    description:
      'Magnets that sweep slowly along the low harmonics, echoed by three tape heads and swung gently round the head.',
    preview: ROLES_TWO,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Ripple',
      params: { bloom: 0.3, harmonic: 2.5, sweep: 0.7, sweepRate: 0.35 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.28 } },
      { deviceId: 'around', preset: 'Gentle sway' },
    ],
  },
  {
    id: 'one-note-twelve-floors-skylight-sharp-eleven',
    name: 'Skylight, sharp eleven',
    category: 'pad',
    description:
      'Glassy sixth harmonics with an octave added below to stand on, in a shimmer that climbs two octaves.',
    preview: LOWER_LANDINGS,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'High whistle',
      params: { bloom: 0.9, harmonic: 6, bright: 0.1, damper: 3, volume: -10 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 1, dry: 0.7 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-along-the-fifth-hallway',
    name: 'Along the fifth hallway',
    category: 'organ',
    description:
      'A quick reedy magnet tone given organ stops a fifth above and, softer, an octave below, heard from the back of a hall.',
    preview: LAMENT,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Quick reed',
      params: { bloom: 0.15, bright: 0.5, damper: 0.7 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Open fifths' },
      { deviceId: 'distance', preset: 'Back of the hall' },
    ],
  },
  {
    id: 'one-note-twelve-floors-awning-up-a-half-step',
    name: 'Awning up a half step',
    category: 'pad',
    description:
      'Magnets wandering through the upper harmonics every two seconds under a comb that hardly moves, in a bright chamber.',
    preview: ROLES_THREE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Overtone choir',
      params: { bloom: 0.7, harmonic: 5, sweep: 0.8, sweepRate: 0.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Glacial drift', params: { mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'one-note-twelve-floors-sixth-over-the-sink',
    name: 'Sixth over the sink',
    category: 'bell',
    description:
      'Quick octave harmonics ringing eight seconds on through open strings, played inside a glass tube with a slow wide chorus.',
    preview: LAMENT,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Octave halo',
      params: { bloom: 0.2, bright: 0.4, damper: 8 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.45 } },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },
  {
    id: 'one-note-twelve-floors-seventh-in-the-eaves',
    name: 'Seventh in the eaves',
    category: 'pad',
    description:
      'Bright bowed glass, each band of it twinkling on its own from side to side, with a long shining tail.',
    preview: ODD_NUMBERS,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Bowed glass',
      params: { bloom: 0.35, bright: 0.9, shimmer: 0.8, damper: 1.5, volume: -11.5 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Wide twinkle' },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  // tine-piano
  {
    id: 'one-note-twelve-floors-lobby-before-eight',
    name: 'Lobby before eight',
    category: 'keys',
    description:
      'Very soft tines with no bell in them and a muffled string pad that grows behind each chord and fades slowly.',
    preview: LANDINGS_STRUCK,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { volume: -13.5, bell: 0, decay: 4, tone: 0.3, hardness: 0.15, release: 0.9 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Felted pad', params: { fall: 5, mix: 0.55 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'one-note-twelve-floors-lift-with-a-brass-gate',
    name: 'Lift with a brass gate',
    category: 'keys',
    description:
      'Bell and bark together, ringing on, played out of a horn loudspeaker across an empty platform and back down a late splashing spring.',
    preview: ROLES_TWO,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { bell: 0.75, bark: 0.8, tone: 0.85, decay: 3, release: 1.2, drive: 0.2 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Station platform' },
      { deviceId: 'spring-reverb', preset: 'Late splash', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-mezzanine-chimes',
    name: 'Mezzanine chimes',
    category: 'bell',
    description:
      'Glass tines with nothing but bell in them, bouncing on dotted tape heads in front of an airy hall.',
    preview: RIPPLE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glass bells',
      params: { decay: 1.2, release: 2.2, volume: -12.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-corridor-light-failing',
    name: 'Corridor light failing',
    category: 'keys',
    description:
      'Tines that throb nearly to nothing just under once a second, thickened by a lush three-voice ensemble.',
    preview: ROLES_ONE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Deep throb',
      params: { tremoloRate: 0.9, tone: 0.55, bell: 0.3 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Lush ensemble' }],
  },
  {
    id: 'one-note-twelve-floors-service-stair-knock',
    name: 'Service stair knock',
    category: 'keys',
    description:
      'Short dead tines answered by murky chorused repeats nearly a second apart, in a trace of small bright tank.',
    preview: ROLES_THREE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: { decay: 0.5, release: 0.15, bark: 0.3, volume: -10 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.32 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.14 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-blinds-on-the-ninth',
    name: 'Blinds on the ninth',
    category: 'keys',
    description:
      'Bright tines shaking six times a second, their attacks misted over, with a faint dust of sparks an octave and more up.',
    preview: ODD_NUMBERS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Fast shimmer',
      params: { tremoloRate: 6, decay: 1.2, release: 0.5, volume: -10.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist' },
      { deviceId: 'glints', preset: 'Faint dust' },
    ],
  },
  {
    id: 'one-note-twelve-floors-under-the-carpet',
    name: 'Under the carpet',
    category: 'keys',
    description:
      'Muffled tines that never die while held, on a seasick reel, overdriven a little and shut in a small dark room.',
    preview: ROLES_THREE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Underwater keys',
      params: { volume: -14.5, tone: 0.22, drive: 0.5, release: 0.9, tremolo: 0.1 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'one-note-twelve-floors-reed-inside-the-wall',
    name: 'Reed inside the wall',
    category: 'keys',
    description:
      'Tines barking like a reed with no bell, a slow notch travelling through them, heard dull from next door.',
    preview: LANDINGS_STRUCK,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Reedy flutter',
      params: { tremolo: 0.15, bark: 0.8, release: 0.3 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Slow notch' },
      { deviceId: 'distance', preset: 'Next door' },
    ],
  },
  {
    id: 'one-note-twelve-floors-sash-window-lifted',
    name: 'Sash window lifted',
    category: 'pad',
    description:
      'Undamped tines with their attack taken off, fading in over half a second into rising fifths of reverb.',
    preview: COMMON_TONE,
    instrument: { deviceId: 'tine-piano', preset: 'Dampers off', params: { bell: 0.3, tone: 0.9 } },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 500 } },
      { deviceId: 'bloom-reverb', preset: 'Rising fifths', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-night-porter',
    name: 'Night porter',
    category: 'keys',
    description:
      'Warm overdriven tines on a new pressing, with a dark woollen haze of fuzz and reverb close behind them.',
    preview: ROLES_TWO,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Warm overdrive',
      params: { tone: 0.3, drive: 0.7, decay: 2.5, release: 0.6, volume: -9.5 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'New pressing' },
      { deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.22, decay: 4 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-twelve-doorbells',
    name: 'Twelve doorbells',
    category: 'bell',
    description:
      'All-bell tines that ring long, skipping off to the sides like a soft pebble while learnt strings ring along.',
    preview: RIPPLE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bell: 1, decay: 3, release: 1.4, volume: -16 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.3 } },
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.35 } },
    ],
  },
  // flute
  {
    id: 'one-note-twelve-floors-breath-on-the-pane',
    name: 'Breath on the pane',
    category: 'wind',
    description:
      'A low flute that is mostly breath, fading in through twelve stages of slow phasing and answered by a hall that whispers a vowel.',
    preview: FLOOR_RISING,
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { attack: 0.7, release: 2, breath: 0.8 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud' },
      { deviceId: 'vowel-reverb', preset: 'Whispering' },
    ],
  },
  {
    id: 'one-note-twelve-floors-stairwell-transverse',
    name: 'Stairwell transverse',
    category: 'wind',
    description:
      'A concert flute with a slow start and almost no vibrato, sent up a wide open valley of reverb.',
    preview: FLOOR_RISING,
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: { attack: 0.35, vibrato: 0.08, breath: 0.25, blow: 0.3, release: 1.2 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.35 } }],
  },
  {
    id: 'one-note-twelve-floors-roof-garden-pipes',
    name: 'Roof garden pipes',
    category: 'wind',
    description:
      'Pan pipes with a strong chiff whose echoes unfold from low to high, over a slow tide of near and far.',
    preview: WALK_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { attack: 0.05, release: 1.4, breath: 0.35 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { mix: 0.35 } },
      { deviceId: 'distance', preset: 'Slow tide' },
    ],
  },
  {
    id: 'one-note-twelve-floors-attic-air-held-low',
    name: 'Attic air, held low',
    category: 'drone',
    description:
      'A breathy low flute with an octave and a second octave under it coming in late, muffled above 4 kHz.',
    preview: WALK_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { attack: 0.5, release: 1.5, vibrato: 0, volume: -13.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals', params: { sub2: 0.4, sub1: 0.6, filter: 500 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'one-note-twelve-floors-draught-at-the-letterbox',
    name: 'Draught at the letterbox',
    category: 'texture',
    description:
      'Whispered pipes, barely blown, with the air of them turned up and blown about by dry gusts of wind.',
    preview: WALK_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { attack: 0.4, breath: 0.85 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Air' },
      { deviceId: 'weather', preset: 'Dry gusts', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-caretaker-whistling',
    name: 'Caretaker whistling',
    category: 'wind',
    description:
      'A hard blown flute that starts straight and sways as it is held, repeated on clean steady echoes.',
    preview: WALK_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { attack: 0.06, vibrato: 0, chiff: 0.4, release: 0.5, breath: 0.1 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer' },
      { deviceId: 'tape-echo', preset: 'Clean and steady', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-flock-at-the-gutter',
    name: 'Flock at the gutter',
    category: 'wind',
    description:
      'A straight flute tone with sixteen copies flying round the listener, each with its own distance and bend.',
    preview: FLOOR_RISING,
    instrument: { deviceId: 'flute', preset: 'Straight tone', params: { attack: 0.2, release: 1 } },
    effects: [{ deviceId: 'murmuration', preset: 'Thick ensemble' }],
  },
  {
    id: 'one-note-twelve-floors-wooden-banister',
    name: 'Wooden banister',
    category: 'wind',
    description:
      'A wood flute that swells for a second, sounded inside a soundboard and left on a long plate.',
    preview: FLOOR_RISING,
    instrument: {
      deviceId: 'flute',
      preset: 'Slow wood swell',
      params: { attack: 1, release: 4, breath: 0.3, volume: -14.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-lead-flashing-bent',
    name: 'Lead flashing, bent',
    category: 'wind',
    description:
      'Shakuhachi notes pulled up into from a tone below, trailing slow echoes that drift in pitch from side to side.',
    preview: WALK_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Bent from below',
      params: { breath: 0.5, blow: 0.5, chiff: 0.5, scoop: 200 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slow drift' },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  // clarinet
  {
    id: 'one-note-twelve-floors-from-an-empty-room',
    name: 'From an empty room',
    category: 'wind',
    description:
      'A clarinet that takes a second to rise out of nothing, its tail swelling in a large bloom of reverb.',
    preview: REED_LAMENT,
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { attack: 1, release: 2, blow: 0.4 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.35 } }],
  },
  {
    id: 'one-note-twelve-floors-boiler-room-reed',
    name: 'Boiler room reed',
    category: 'bass',
    description:
      'A bass clarinet with a clean octave under it, driven into an iron transformer that swells the lows.',
    preview: WALK_LOW,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { breath: 0.15, attack: 0.12 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } },
      { deviceId: 'analog-drive', preset: 'Iron lows' },
    ],
  },
  {
    id: 'one-note-twelve-floors-lounge-on-the-mezzanine',
    name: 'Lounge on the mezzanine',
    category: 'wind',
    description:
      'A breathy tenor subtone, turning slowly in a faint rotary cabinet and pressed on a worn record.',
    preview: WALK_REED,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { breath: 0.6, attack: 0.1 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend' },
      { deviceId: 'vinyl', preset: 'Charity shop find' },
    ],
  },
  {
    id: 'one-note-twelve-floors-radiator-third-floor',
    name: 'Radiator, third floor',
    category: 'drone',
    description:
      'A reed barely blown, hummed, its strongest partials shadowed by sines an octave below, hollowed by a slow negative chorus.',
    preview: REED_LANDINGS,
    instrument: { deviceId: 'clarinet', preset: 'Reed hum', params: { attack: 0.3 } },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Low shadow', params: { mix: 0.5, attack: 400 } },
      { deviceId: 'chorus', preset: 'Hollow swell', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-through-paper-walls',
    name: 'Through paper walls',
    category: 'texture',
    description:
      'A reed that is mostly breath, smeared by a dark bank of fog and heard through a small pillow speaker.',
    preview: REED_LANDINGS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { attack: 0.35, release: 1.2, blow: 0.15 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Dark bank' },
      { deviceId: 're-amp', preset: 'Pillow speaker' },
    ],
  },
  {
    id: 'one-note-twelve-floors-courtyard-at-noon',
    name: 'Courtyard at noon',
    category: 'wind',
    description:
      'A bright open-bored reed, quick to speak, its echoes scattered in seven places over nearly two seconds.',
    preview: FLOOR_RISING,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { attack: 0.08, vibrato: 0 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.35 } }],
  },
  {
    id: 'one-note-twelve-floors-parquet-worn-reed',
    name: 'Parquet, worn reed',
    category: 'wind',
    description:
      'A wide reed pipe with a steady vibrato, setting strings tuned to A minor ringing and warmed from below.',
    preview: REED_LAMENT,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { attack: 0.35, vibrato: 0.4, bore: 0.4 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Hammered', params: { root: 9, mix: 0.35, decay: 4 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'one-note-twelve-floors-rattle-in-the-pipes',
    name: 'Rattle in the pipes',
    category: 'texture',
    description:
      'A half flutter-tongued reed through an old valve that blooms, then dripped down two springs.',
    preview: WALK_REED,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { growl: 0.5, attack: 0.15, release: 0.6, volume: -7 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Valve bloom' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
    ],
  },
  {
    id: 'one-note-twelve-floors-held-after-they-leave',
    name: 'Held after they leave',
    category: 'wind',
    description:
      'A quick full reed whose release lasts three seconds, caught and held by an ensemble pad that glides to the next floor.',
    preview: REED_LAMENT,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Slow fade reed',
      params: { release: 3, blow: 0.5 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Slow strings', params: { attack: 0.8 } }],
  },
  // bowed-string
  {
    id: 'one-note-twelve-floors-cellist-in-the-basement',
    name: 'Cellist in the basement',
    category: 'bass',
    description:
      'A dull bow far from the bridge in the fullest body, a soft octave put under it, at the end of a narrow tunnel.',
    preview: WALK_LOW,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.25,
        vibrato: 0.05,
        brightness: 0.15,
        position: 0.35,
        pressure: 0.25,
        body: 1,
        detune: 8,
        release: 0.5,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5 } },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-glass-balustrade',
    name: 'Glass balustrade',
    category: 'string',
    description:
      'A light bow near the bridge, thin and wide, with a bright halo of blurred and shimmering spectrum round it.',
    preview: THIRDS_DOWN,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.7, release: 2.5 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo' }],
  },
  {
    id: 'one-note-twelve-floors-cable-down-the-shaft',
    name: 'Cable down the shaft',
    category: 'plucked',
    description:
      'A wiry pluck that rings for fourteen seconds, falling away in dark tape repeats more than a second apart.',
    preview: LAMENT,
    instrument: { deviceId: 'bowed-string', preset: 'Wire harp', params: { body: 0.2 } },
    effects: [{ deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.35 } }],
  },
  {
    id: 'one-note-twelve-floors-lintel-swell',
    name: 'Lintel swell',
    category: 'string',
    description:
      'A plucked string faded in as with a volume pedal, spread wide by a slow flock of six and held level.',
    preview: ROLES_TWO,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { attack: 0.45, release: 2 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Slow drift' },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'one-note-twelve-floors-nothing-in-it-changes',
    name: 'Nothing in it changes',
    category: 'drone',
    description:
      'A sustained string with no body, no vibrato and hardly any brightness, only its bands rising in turn like ripples.',
    preview: THIRDS_DOWN,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 0.9, release: 4, brightness: 0.15, position: 0.25, volume: -16.5 },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Rising ripple' }],
  },
  {
    id: 'one-note-twelve-floors-rosin-on-the-rail',
    name: 'Rosin on the rail',
    category: 'string',
    description:
      'A hard-pressed rasping bow on the bridge, recorded off a full-range speaker from across the room.',
    preview: WALK_LOW,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: { attack: 0.15, pressure: 0.8, vibrato: 0.08, release: 0.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Just the room' },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { presence: -5 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-flautando-on-the-landing',
    name: 'Flautando on the landing',
    category: 'string',
    description:
      'A weightless bow far up the string, loosely doubled to both sides, in a dark hall.',
    preview: LOWER_LANDINGS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.6, release: 1.8 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Loose double' },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'one-note-twelve-floors-section-on-the-stairs',
    name: 'Section on the stairs',
    category: 'string',
    description:
      'Wide detuned bows with a slow vibrato, followed by dark cellos an octave below that swell in late.',
    preview: LANDINGS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: { attack: 0.6, release: 1.2, vibrato: 0.35 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { fall: 3 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'one-note-twelve-floors-guitar-in-the-top-flat',
    name: 'Guitar in the top flat',
    category: 'plucked',
    description:
      'A soft plucked string whose tail goes on and sags a little in pitch as it ages, in the trace of a room.',
    preview: COMMON_TONE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { volume: -4, brightness: 0.5, decay: 8 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Candle wax' },
      { deviceId: 'distance', preset: 'Close mic' },
    ],
  },
  // organ
  {
    id: 'one-note-twelve-floors-c-under-every-triad',
    name: 'C under every triad',
    category: 'organ',
    description: 'Harmonium ranks with a breathing bellows, rolled gently in a slow rotary.',
    preview: INVERSE,
    instrument: { deviceId: 'organ', preset: 'Harmonium', params: { sub: 0.15, reed: 0.45 } },
    effects: [
      { deviceId: 'rotary', preset: 'Faint motion' },
      { deviceId: 'ambient-eq', preset: 'Drone' },
    ],
  },
  {
    id: 'one-note-twelve-floors-chapel-on-the-ground',
    name: 'Chapel on the ground',
    category: 'organ',
    description:
      'Soft flutes of a small organ with some of the fifteenth on top, in a chapel that faintly sings an eh.',
    preview: INVERSE,
    instrument: { deviceId: 'organ', preset: 'Chapel flutes', params: { fifteenth: 0.25 } },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel' }],
  },
  {
    id: 'one-note-twelve-floors-foundations-humming',
    name: 'Foundations humming',
    category: 'drone',
    description:
      'Deep pedal pipes with a little octave, closed at 900 Hz, three bands of them drifting on their own slow swells and warmed.',
    preview: INVERSE,
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: { octave: 0.25, attack: 0.3, release: 1.5, tone: 900, volume: -15.5 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Deep swell' },
      { deviceId: 'analog-drive', preset: 'Low warmth' },
    ],
  },
  {
    id: 'one-note-twelve-floors-pump-room',
    name: 'Pump room',
    category: 'organ',
    description:
      'A wheezing reed organ with deep bellows and some of the fifteenth, on a wobbling cassette, with a slow sweeping flange over it.',
    preview: LOWER_LANDINGS,
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { bellows: 0.7, fifteenth: 0.4, tone: 4500 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'flanger', preset: 'Slow sweep', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-voices-behind-plaster',
    name: 'Voices behind plaster',
    category: 'organ',
    description:
      'A trembling human-voice rank shaped into a round vowel and heard through fog, a long way off.',
    preview: LANDINGS,
    instrument: { deviceId: 'organ', preset: 'Vox humana', params: { tremulant: 0.6, tone: 2600 } },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel' },
      { deviceId: 'distance', preset: 'Through fog' },
    ],
  },
  {
    id: 'one-note-twelve-floors-accordion-on-the-sill',
    name: 'Accordion on the sill',
    category: 'organ',
    description:
      'A bright beating reed with breathing bellows, widened at the top, in the open air.',
    preview: ROLES_TWO,
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: { bellows: 0.5, release: 0.35, tone: 4200 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide top' },
      { deviceId: 'distance', preset: 'Open air', params: { distance: 0.4 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-fifths-without-a-third',
    name: 'Fifths without a third',
    category: 'organ',
    description:
      'A flute rank and its hollow twelfth, each note blooming late into organ stops above and below it.',
    preview: THIRDS_DOWN,
    instrument: { deviceId: 'organ', preset: 'Hollow quint', params: { attack: 0.1 } },
    effects: [{ deviceId: 'stops', preset: 'Slow bloom', params: { speak: 900 } }],
  },
  {
    id: 'one-note-twelve-floors-window-wind',
    name: 'Window wind',
    category: 'texture',
    description:
      'Windy flute pipes, mostly air, passed over by a gale and steadied by a slow compressor.',
    preview: WHITE_PAIR,
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: { octave: 0.15, attack: 0.3, breath: 0.8 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Gale', params: { mix: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'one-note-twelve-floors-sun-reaches-the-top',
    name: 'Sun reaches the top',
    category: 'organ',
    description:
      'Ranks beating against each other that open over a second, then a bright haze glows an octave above.',
    preview: WHOLE_TONES,
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: { attack: 1, release: 3, celeste: 0.7 },
    },
    effects: [{ deviceId: 'haze', preset: 'Octave glow', params: { mix: 0.3 } }],
  },
  // thesis
  {
    id: 'one-note-twelve-floors-lights-on-in-a-minor',
    name: 'Lights on in A minor',
    category: 'pad',
    description:
      'Resonant noise bands mirrored in A minor, drifting slowly, brought up by a limiter.',
    preview: LAMENT,
    instrument: {
      deviceId: 'thesis',
      preset: 'Drifting Minor',
      params: { attack: 0.4, resonance: 70 },
    },
    effects: [{ deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 4 } }],
  },
  {
    id: 'one-note-twelve-floors-glass-mirror-lobby',
    name: 'Glass mirror lobby',
    category: 'pad',
    description:
      'Narrow glassy bands mirrored about E, flickering in a dozen close echoes and half of it drifting on tape.',
    preview: WHITE_PAIR,
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { attack: 0.4, breatheRate: 0.6 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Close flicker' },
      { deviceId: 'tape', preset: 'Drifting chorus', params: { output: 8 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-gravity-of-the-floor',
    name: 'Gravity of the floor',
    category: 'drone',
    description:
      'Noise bands pulled up a fifth as they start, about the A under middle C, the middle voice on, dulled and levelled.',
    preview: LAMENT,
    instrument: {
      deviceId: 'thesis',
      preset: 'Gravity Well',
      params: { center: 57, strum: 0, release: 2.5, resonance: 60 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'ambient-comp', preset: 'Level', params: { makeup: 6 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-lydian-balcony',
    name: 'Lydian balcony',
    category: 'plucked',
    description:
      'Quick bands strummed eighty milliseconds apart in F Lydian, echoed on three tape heads and caught by a fast compressor.',
    preview: LAMENT,
    instrument: {
      deviceId: 'thesis',
      preset: 'Strummed Lydian',
      params: { attack: 0.03, root: 5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { makeup: 6 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-all-six-windows-lit',
    name: 'All six windows lit',
    category: 'pad',
    description:
      'Every voice of the chord on at once, fixed and dense, swept by a slow swirl of phasing and opened wide at the top.',
    preview: WHITE_PAIR,
    instrument: { deviceId: 'thesis', preset: 'Fixed Full Stack', params: {} },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl' },
      { deviceId: 'spread', preset: 'Wide top', params: { output: 4 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-five-notes-in-the-stair',
    name: 'Five notes in the stair',
    category: 'pad',
    description:
      'A pentatonic stack that breathes about every second and a half, its quiet partials brought forward, in a bright hall.',
    preview: FIVE_NOTES,
    instrument: { deviceId: 'thesis', preset: 'Pentatonic Breath', params: {} },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones', params: { output: 6 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-phrygian-stairwell',
    name: 'Phrygian stairwell',
    category: 'drone',
    description:
      'Dark close bands round the D under middle C in E Phrygian, down a stone stairwell.',
    preview: LAMENT,
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { attack: 0.4, release: 3 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Stone stairwell' },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 4 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-one-reflection-only',
    name: 'One reflection only',
    category: 'pad',
    description:
      'Each note and its mirror and nothing else, ringing, with sines that slide from one floor to the next, opened to the sides.',
    preview: WHITE_PAIR,
    instrument: { deviceId: 'thesis', preset: 'Sparse Mirror', params: {} },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Sliding sines' },
      { deviceId: 'spread', preset: 'Wide top', params: { mid: 1.5, output: 5 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-whole-tone-awning',
    name: 'Whole tone awning',
    category: 'pad',
    description:
      'A wide whole tone haze, each note with its halfway point to E, swelling in and answered by slow reversed chunks of itself.',
    preview: WHOLE_TONES,
    instrument: {
      deviceId: 'thesis',
      preset: 'Whole tone haze',
      params: { center: 64, attack: 0.6, release: 1.5, resonance: 45 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells' },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 10.5 } },
    ],
  },
  // choir
  {
    id: 'one-note-twelve-floors-basses-in-the-cistern',
    name: 'Basses in the cistern',
    category: 'voice',
    description:
      'Low oh-shaped basses sung inside a wide resonant cistern, with the top of them closed.',
    preview: LANDINGS,
    instrument: {
      deviceId: 'choir',
      preset: 'Basses ah',
      params: { vowel: 0.72, attack: 0.3, release: 1.8 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'one-note-twelve-floors-ooh-from-the-top-window',
    name: 'Ooh from the top window',
    category: 'voice',
    description:
      'A treble ooh whose colours fan out in a faint trail of delays, in thin air with no lows in its reverb.',
    preview: THIRDS_DOWN,
    instrument: { deviceId: 'choir', preset: 'Boys ooh', params: { attack: 0.4, motion: 0.05 } },
    effects: [
      { deviceId: 'prism', preset: 'Faint trail', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Thin air' },
    ],
  },
  {
    id: 'one-note-twelve-floors-what-the-floors-share',
    name: 'What the floors share',
    category: 'voice',
    description:
      'A glassy ee through a filter that lets by only the tones that were there a moment ago, so the held note stays.',
    preview: LANDINGS,
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { attack: 0.5, release: 0.6, voice: 1.18, volume: -6 },
    },
    effects: [{ deviceId: 'common-tones', preset: 'Only what stays', params: { mix: 0.85 } }],
  },
  {
    id: 'one-note-twelve-floors-what-the-floors-change',
    name: 'What the floors change',
    category: 'voice',
    description:
      'Slow vowels through a filter that passes only the notes that are new, so each chord arrives and goes.',
    preview: LOWER_LANDINGS,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { attack: 0.25, release: 0.6, tone: 8000, volume: -2.5 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { mix: 0.9 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'one-note-twelve-floors-hum-through-floorboards',
    name: 'Hum through floorboards',
    category: 'voice',
    description:
      'Closed-mouth humming split into low and high that shimmer against each other, recorded inside a cupboard.',
    preview: ROLES_TWO,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { attack: 0.4, tone: 1200, volume: -4.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 2 } },
      { deviceId: 're-amp', preset: 'In the cupboard' },
    ],
  },
  {
    id: 'one-note-twelve-floors-altos-in-overcoats',
    name: 'Altos in overcoats',
    category: 'voice',
    description:
      'An eh sung with some vibrato, doubled late and out of tune to the sides, through a bright tape with some hiss.',
    preview: ROLES_ONE,
    instrument: { deviceId: 'choir', preset: 'Altos eh', params: { attack: 0.3, vibrato: 18 } },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { mix: 0.5 } },
      { deviceId: 'tape', preset: 'Hiss and air', params: { hiss: 0.4 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-breath-between-floors',
    name: 'Breath between floors',
    category: 'texture',
    description:
      'Wide breath with the voices under it caught as a high frosted pad that glides from chord to chord.',
    preview: THIRDS_DOWN,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 0.6, release: 2, breath: 0.85 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'High frost', params: { mix: 0.5, attack: 0.6 } }],
  },
  {
    id: 'one-note-twelve-floors-alone-in-the-lift-shaft',
    name: 'Alone in the lift shaft',
    category: 'voice',
    description:
      'One singer to a note with a narrow vibrato, answered by a bent ladder of echoes and a narrow shaft of short ones.',
    preview: WHITE_PAIR,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { voice: 1, vibrato: 14, attack: 0.2, release: 1 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Bent ladder', params: { mix: 0.35 } },
      { deviceId: 'swarm-reverb', preset: 'Mine shaft', params: { mix: 0.25 } },
    ],
  },
  // wavetable
  {
    id: 'one-note-twelve-floors-sun-on-every-floor',
    name: 'Sun on every floor',
    category: 'pad',
    description:
      'A glass table with two detuned oscillators, turned to a high wide summer of warm, moving reverb.',
    preview: THIRDS_DOWN,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: { attack: 0.7, detune: 14 },
    },
    effects: [{ deviceId: 'seasons', preset: 'High summer', params: { mix: 0.7 } }],
  },
  {
    id: 'one-note-twelve-floors-shutters-half-open',
    name: 'Shutters, half open',
    category: 'pad',
    description:
      'A table half way from reed to saw under a slow low-pass that moves by itself, then opened in width by a long breath.',
    preview: LANDINGS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { position: 0.6, attack: 0.5, cutoff: 6000, release: 2 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { cutoffHz: 900 } },
      { deviceId: 'breath', preset: 'Opening wide' },
    ],
  },
  {
    id: 'one-note-twelve-floors-hollow-core-block',
    name: 'Hollow core block',
    category: 'drone',
    description:
      'A hollow table with a strong sub, under a dark blurred wash of itself that stops at 2.5 kHz.',
    preview: LAMENT,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 0.6, sub: 0.6, release: 3, volume: -18 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Dark water' }],
  },
  {
    id: 'one-note-twelve-floors-filament-in-the-bulb',
    name: 'Filament in the bulb',
    category: 'keys',
    description:
      'A thin narrow pulse with no sub and a quick attack, half drowned in a deep slow chorus of three voices.',
    preview: ROLES_ONE,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: { attack: 0.05, release: 1.2, cutoff: 5000 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'one-note-twelve-floors-wires-in-the-wall',
    name: 'Wires in the wall',
    category: 'pad',
    description:
      'Thick detuned saws held down to 1.1 kHz and lowered just under water, where a few bubbles rise.',
    preview: ROLES_TWO,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Thick saws',
      params: { cutoff: 1100, attack: 0.4, release: 2, detune: 28 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Just under' }],
  },
  {
    id: 'one-note-twelve-floors-neon-for-the-seventh',
    name: 'Neon for the seventh',
    category: 'pad',
    description:
      'Ringing spectral overtones at a resonant edge, each of six bands coming and going on its own like glass.',
    preview: LOWER_LANDINGS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Ringing overtones',
      params: { attack: 0.8, release: 1.4, resonance: 0.65, cutoff: 2200 },
    },
    effects: [{ deviceId: 'currents', preset: 'Glass notes', params: { mix: 0.7 } }],
  },
  {
    id: 'one-note-twelve-floors-frosted-stair-door',
    name: 'Frosted stair door',
    category: 'pad',
    description:
      'A still bright spectrum, unmoving, softly blurred, whose echoes bring back moments of the floors just left.',
    preview: ODD_NUMBERS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Frozen spectrum',
      params: { attack: 0.25, release: 2.5, cutoff: 7000, position: 0.65 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Just now', params: { mix: 0.45 } },
      { deviceId: 'fog', preset: 'Short blur', params: { mix: 0.5 } },
    ],
  },
  // harp
  {
    id: 'one-note-twelve-floors-fire-escape-strings',
    name: 'Fire escape strings',
    category: 'plucked',
    description:
      'Guzheng strings with a run of even echoes behind each note, four a second, crossing from side to side.',
    preview: RIPPLE,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { decay: 2, halo: 0.7, volume: 2.5 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Even steps' }],
  },
  {
    id: 'one-note-twelve-floors-hollow-and-held',
    name: 'Hollow and held',
    category: 'plucked',
    description:
      'A dark hollow harp plucked in the middle of its strings, sixteen minor strings in A ringing long behind it.',
    preview: RIPPLE,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { decay: 2.5, volume: -5.5 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Strings alone', params: { root: 9, mix: 0.45 } }],
  },
  {
    id: 'one-note-twelve-floors-atrium-koto',
    name: 'Atrium koto',
    category: 'plucked',
    description:
      'Koto strings plucked softly and left to ring, levelled hard by a limiter, with quick clean echoes to the sides and a bright plate.',
    preview: COMMON_TONE,
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { decay: 2.4, touch: 0.35, pluck: 0.18, volume: -3.5 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive' },
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { mix: 0.3, spread: 0.8 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-muted-in-the-study',
    name: 'Muted in the study',
    category: 'plucked',
    description:
      'A damped harp with a deep soundboard, caught at each pluck and held a moment as an even pad, on a warped record.',
    preview: ROLES_THREE,
    instrument: { deviceId: 'harp', preset: 'Muted harp', params: { damp: 0.6 } },
    effects: [
      { deviceId: 'sustainer', preset: 'Quick catch', params: { mix: 0.55 } },
      { deviceId: 'vinyl', preset: 'Slow platter' },
    ],
  },
  {
    id: 'one-note-twelve-floors-rain-in-the-stairwell',
    name: 'Rain in the stairwell',
    category: 'plucked',
    description:
      'Long glassy strings sending up sparks an octave and more above, some as much as two seconds late.',
    preview: RIPPLE,
    instrument: { deviceId: 'harp', preset: 'Long glass ring', params: { touch: 0.3 } },
    effects: [
      { deviceId: 'glints', preset: 'Late answers', params: { mix: 0.35 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer' },
    ],
  },
  {
    id: 'one-note-twelve-floors-steel-handrail',
    name: 'Steel handrail',
    category: 'plucked',
    description:
      'Steely guzheng wire with no body, damped as keys lift, dulled by a filter each pluck opens and swung round in a fast far rotary.',
    preview: ROLES_ONE,
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { decay: 2, touch: 0.7, damp: 0.6, volume: 6 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Soft bloom', params: { cutoffHz: 900 } },
      { deviceId: 'rotary', preset: 'Far shimmer', params: { mix: 0.7 } },
    ],
  },
  // chord-harp
  {
    id: 'one-note-twelve-floors-doors-opening-upward',
    name: 'Doors opening upward',
    category: 'plucked',
    description:
      'A plate strummed up four octaves in slow steps with the pad nearly out, unfolding again as echoes from low to high.',
    preview: LAMENT,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { direction: 0, pad: 0.05, strum: 110 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Slow unfolding', params: { mix: 0.35 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'one-note-twelve-floors-one-chord-per-floor',
    name: 'One chord per floor',
    category: 'organ',
    description:
      'The pad of the plate at full with soft strings under it, pushed into tape and breathing once in nine seconds.',
    preview: LANDINGS,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Soft organ chord',
      params: { tone: 0.3, sustain: 1.2, spread: 0.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'breath', preset: 'Calm breath' },
    ],
  },
  {
    id: 'one-note-twelve-floors-keys-on-a-hook',
    name: 'Keys on a hook',
    category: 'bell',
    description:
      'Bare glassy chimes that ring eight seconds, each band glinting suddenly by chance, in a reverb that sings an ee.',
    preview: RIPPLE,
    instrument: { deviceId: 'chord-harp', preset: 'Long glass chimes', params: { tone: 0.75 } },
    effects: [
      { deviceId: 'glimmer', preset: 'Sudden glints' },
      { deviceId: 'vowel-reverb', preset: 'High ee', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-note-twelve-floors-window-cord-let-go',
    name: 'Window cord, let go',
    category: 'plucked',
    description:
      'A strum falling through three octaves into a tail that swells up behind it and stops, filled by a soft pad.',
    preview: ROLES_THREE,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Falling harp',
      params: { span: 2, pad: 0.35, tone: 0.3 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.5 } }],
  },
  {
    id: 'one-note-twelve-floors-fuse-box-buzz',
    name: 'Fuse box buzz',
    category: 'plucked',
    description:
      'A muffled slow strum over two octaves through a pentode with some bite, off a worn reel.',
    preview: LOWER_LANDINGS,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Muffled slow strum',
      params: { tone: 0.3, strum: 60, sustain: 3, volume: -15.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite' },
      { deviceId: 'tape', preset: 'Worn thin', params: { age: 0.5, hiss: 0.25 } },
    ],
  },
  // felt-piano
  {
    id: 'one-note-twelve-floors-tuner-on-the-ground',
    name: 'Tuner on the ground',
    category: 'keys',
    description:
      'Felted hammers with the pedal down and an octave halo of pure sines swelling in over the chord.',
    preview: COMMON_TONE,
    instrument: { deviceId: 'felt-piano', preset: 'Pedal down', params: { outputDb: -18 } },
    effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.45 } }],
  },
  {
    id: 'one-note-twelve-floors-upright-on-the-third',
    name: 'Upright on the third',
    category: 'keys',
    description:
      'An old out-of-tune upright with the pedal half down, on a dull stylus, a slow octave-down pass of itself running underneath.',
    preview: ODD_NUMBERS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { grit: 0.1, sustain: 0.45, felt: 0.5, outputDb: -21 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix' },
      { deviceId: 'vinyl', preset: 'Dull stylus' },
    ],
  },
  {
    id: 'one-note-twelve-floors-grand-in-the-penthouse',
    name: 'Grand in the penthouse',
    category: 'keys',
    description:
      'Hard bare hammers on stiff bright strings, with reversed copies an octave up swelling in behind them.',
    preview: ROLES_THREE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { hardness: 0.75, stiffness: 1.2, reverbMix: 0.15, outputDb: -11.5 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Rising glass', params: { mix: 0.3 } }],
  },
  {
    id: 'one-note-twelve-floors-piano-two-doors-down',
    name: 'Piano two doors down',
    category: 'keys',
    description:
      'A soft thud of felt with nothing above it, every attack smoothed off, its decay held up by a compressor.',
    preview: ROLES_ONE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { thump: 0.5, reverbMix: 0.1, outputDb: -9 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack' },
      { deviceId: 'ambient-comp', preset: 'Long sustain' },
    ],
  },
  // rewind
  {
    id: 'one-note-twelve-floors-coming-up-the-stairs',
    name: 'Coming up the stairs',
    category: 'texture',
    description:
      'A piano turned round: each note swells for nearly a second, lands on its strike and rings on, a little wide.',
    preview: ROLES_TWO,
    instrument: {
      deviceId: 'rewind',
      preset: 'Turned piano',
      params: { swell: 0.8, tail: 0.7, ghost: 0.1, volume: 4.5 },
    },
    effects: [{ deviceId: 'stereo-detune', preset: 'Piano haze' }],
  },
  {
    id: 'one-note-twelve-floors-bell-before-the-floor',
    name: 'Bell before the floor',
    category: 'bell',
    description:
      'Bells played backwards onto their strike, then ringing in a low cathedral of reverb with nothing over 900 Hz.',
    preview: COMMON_TONE,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bell arrival',
      params: { swell: 1.1, tail: 0.9, tone: 0.45, volume: 5.5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral' }],
  },
  {
    id: 'one-note-twelve-floors-bowl-when-it-is-let-go',
    name: 'Bowl when it is let go',
    category: 'bell',
    description:
      'A bowl that gathers while the key is down and strikes as it lifts, wavering with pulses that lose pace.',
    preview: WHITE_PAIR,
    instrument: {
      deviceId: 'rewind',
      preset: 'Held bowl',
      params: { swell: 1.6, ghost: 0.4, shimmer: 0.5, volume: 6 },
    },
    effects: [
      { deviceId: 'winding-down', preset: 'Soft losing pace' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
]
