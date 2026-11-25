import { type FactoryPreset, type Phrase } from '../types'

// Pure chords whose common tones never move, so a lap of C, Am, Dm and G sinks by a comma of
// 21.5 cents, and the same steps walked back climb to pitch again. No voice has vibrato or
// chorus and sections are tuned close, so that a comma can be heard: seven instruments, and four
// more beside them, laid out by how the note starts, how still it stands and what room holds it.

// C, Am, Dm, G, C a comma lower, and the same chords back to C at pitch; every shared note is one held note.
const THERE_AND_BACK: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 1.4, note: 63.86, gain: 0.4 },
    { atSec: 0, durSec: 0.7, note: 67.02, gain: 0.4 },
    { atSec: 0.7, durSec: 1.4, note: 68.84, gain: 0.4 },
    { atSec: 1.4, durSec: 1.4, note: 61.82, gain: 0.4 },
    { atSec: 1.4, durSec: 0.7, note: 64.98, gain: 0.4 },
    { atSec: 2.1, durSec: 2.1, note: 66.8, gain: 0.4 },
    { atSec: 2.1, durSec: 0.7, note: 70.67, gain: 0.4 },
    { atSec: 2.8, durSec: 0.7, note: 63.65, gain: 0.4 },
    { atSec: 2.8, durSec: 0.7, note: 71.78, gain: 0.4 },
    { atSec: 3.5, durSec: 1.4, note: 61.82, gain: 0.4 },
    { atSec: 3.5, durSec: 0.7, note: 70.67, gain: 0.4 },
    { atSec: 4.2, durSec: 0.7, note: 64.98, gain: 0.4 },
    { atSec: 4.2, durSec: 1.4, note: 68.84, gain: 0.4 },
    { atSec: 4.9, durSec: 1.6, note: 60, gain: 0.4 },
    { atSec: 4.9, durSec: 1.6, note: 63.86, gain: 0.4 },
    { atSec: 5.6, durSec: 0.9, note: 67.02, gain: 0.4 },
  ],
}

// One lap over its bass: C, Am, Dm, G, and a C that has sunk by 21.5 cents.
const ONE_LAP: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.25, note: 48, gain: 0.46 },
    { atSec: 0, durSec: 2.5, note: 60, gain: 0.36 },
    { atSec: 0, durSec: 2.5, note: 63.86, gain: 0.36 },
    { atSec: 0, durSec: 1.25, note: 67.02, gain: 0.36 },
    { atSec: 1.25, durSec: 1.25, note: 44.84, gain: 0.46 },
    { atSec: 1.25, durSec: 2.5, note: 68.84, gain: 0.36 },
    { atSec: 2.5, durSec: 1.25, note: 37.82, gain: 0.46 },
    { atSec: 2.5, durSec: 2.5, note: 61.82, gain: 0.36 },
    { atSec: 2.5, durSec: 1.25, note: 64.98, gain: 0.36 },
    { atSec: 3.75, durSec: 1.25, note: 42.8, gain: 0.46 },
    { atSec: 3.75, durSec: 2.7, note: 66.8, gain: 0.36 },
    { atSec: 3.75, durSec: 1.25, note: 70.67, gain: 0.36 },
    { atSec: 5, durSec: 1.45, note: 35.78, gain: 0.46 },
    { atSec: 5, durSec: 1.45, note: 63.65, gain: 0.36 },
    { atSec: 5, durSec: 1.45, note: 71.78, gain: 0.36 },
  ],
}

// The short way: C, F with an added sixth, G, the lower C, and home by the same steps.
const SHORT_WAY: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 48, gain: 0.42 },
    { atSec: 0, durSec: 1.8, note: 60, gain: 0.32 },
    { atSec: 0, durSec: 0.9, note: 63.86, gain: 0.32 },
    { atSec: 0, durSec: 0.9, note: 67.02, gain: 0.32 },
    { atSec: 0, durSec: 0.9, note: 72, gain: 0.32 },
    { atSec: 0.9, durSec: 0.9, note: 40.98, gain: 0.42 },
    { atSec: 0.9, durSec: 0.9, note: 64.98, gain: 0.32 },
    { atSec: 0.9, durSec: 0.9, note: 68.84, gain: 0.32 },
    { atSec: 0.9, durSec: 1.8, note: 73.82, gain: 0.32 },
    { atSec: 1.8, durSec: 0.9, note: 42.8, gain: 0.42 },
    { atSec: 1.8, durSec: 0.9, note: 58.67, gain: 0.32 },
    { atSec: 1.8, durSec: 0.9, note: 61.82, gain: 0.32 },
    { atSec: 1.8, durSec: 2.7, note: 66.8, gain: 0.32 },
    { atSec: 2.7, durSec: 0.9, note: 47.78, gain: 0.42 },
    { atSec: 2.7, durSec: 0.9, note: 59.78, gain: 0.32 },
    { atSec: 2.7, durSec: 0.9, note: 63.65, gain: 0.32 },
    { atSec: 2.7, durSec: 0.9, note: 71.78, gain: 0.32 },
    { atSec: 3.6, durSec: 0.9, note: 42.8, gain: 0.42 },
    { atSec: 3.6, durSec: 0.9, note: 58.67, gain: 0.32 },
    { atSec: 3.6, durSec: 0.9, note: 61.82, gain: 0.32 },
    { atSec: 3.6, durSec: 1.8, note: 73.82, gain: 0.32 },
    { atSec: 4.5, durSec: 0.9, note: 40.98, gain: 0.42 },
    { atSec: 4.5, durSec: 2, note: 60, gain: 0.32 },
    { atSec: 4.5, durSec: 0.9, note: 64.98, gain: 0.32 },
    { atSec: 4.5, durSec: 0.9, note: 68.84, gain: 0.32 },
    { atSec: 5.4, durSec: 1.1, note: 48, gain: 0.42 },
    { atSec: 5.4, durSec: 1.1, note: 63.86, gain: 0.32 },
    { atSec: 5.4, durSec: 1.1, note: 67.02, gain: 0.32 },
    { atSec: 5.4, durSec: 1.1, note: 72, gain: 0.32 },
  ],
}

// The other way round: C, G, Dm, F, and a C that has risen by 21.5 cents while every voice stepped down.
const RISING: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.25, note: 48, gain: 0.46 },
    { atSec: 0, durSec: 1.25, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 1.25, note: 63.86, gain: 0.4 },
    { atSec: 0, durSec: 2.5, note: 67.02, gain: 0.4 },
    { atSec: 1.25, durSec: 1.25, note: 43.02, gain: 0.46 },
    { atSec: 1.25, durSec: 1.25, note: 58.88, gain: 0.4 },
    { atSec: 1.25, durSec: 2.5, note: 62.04, gain: 0.4 },
    { atSec: 2.5, durSec: 1.25, note: 50.04, gain: 0.46 },
    { atSec: 2.5, durSec: 2.5, note: 57.06, gain: 0.4 },
    { atSec: 2.5, durSec: 2.5, note: 65.2, gain: 0.4 },
    { atSec: 3.75, durSec: 1.25, note: 53.2, gain: 0.46 },
    { atSec: 3.75, durSec: 2.7, note: 60.22, gain: 0.4 },
    { atSec: 5, durSec: 1.45, note: 48.22, gain: 0.46 },
    { atSec: 5, durSec: 1.45, note: 55.23, gain: 0.4 },
    { atSec: 5, durSec: 1.45, note: 64.08, gain: 0.4 },
  ],
}

// The rising lap and its retrograde, so the loop closes at pitch.
const RISE_AND_RETURN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.7, note: 48, gain: 0.44 },
    { atSec: 0, durSec: 0.7, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 0.7, note: 63.86, gain: 0.4 },
    { atSec: 0, durSec: 1.4, note: 67.02, gain: 0.4 },
    { atSec: 0.7, durSec: 0.7, note: 43.02, gain: 0.44 },
    { atSec: 0.7, durSec: 0.7, note: 58.88, gain: 0.4 },
    { atSec: 0.7, durSec: 1.4, note: 62.04, gain: 0.4 },
    { atSec: 1.4, durSec: 0.7, note: 50.04, gain: 0.44 },
    { atSec: 1.4, durSec: 1.4, note: 57.06, gain: 0.4 },
    { atSec: 1.4, durSec: 1.4, note: 65.2, gain: 0.4 },
    { atSec: 2.1, durSec: 0.7, note: 53.2, gain: 0.44 },
    { atSec: 2.1, durSec: 2.1, note: 60.22, gain: 0.4 },
    { atSec: 2.8, durSec: 0.7, note: 48.22, gain: 0.44 },
    { atSec: 2.8, durSec: 0.7, note: 55.23, gain: 0.4 },
    { atSec: 2.8, durSec: 0.7, note: 64.08, gain: 0.4 },
    { atSec: 3.5, durSec: 0.7, note: 53.2, gain: 0.44 },
    { atSec: 3.5, durSec: 1.4, note: 57.06, gain: 0.4 },
    { atSec: 3.5, durSec: 1.4, note: 65.2, gain: 0.4 },
    { atSec: 4.2, durSec: 0.7, note: 50.04, gain: 0.44 },
    { atSec: 4.2, durSec: 1.4, note: 62.04, gain: 0.4 },
    { atSec: 4.9, durSec: 0.7, note: 43.02, gain: 0.44 },
    { atSec: 4.9, durSec: 0.7, note: 58.88, gain: 0.4 },
    { atSec: 4.9, durSec: 1.6, note: 67.02, gain: 0.4 },
    { atSec: 5.6, durSec: 0.9, note: 48, gain: 0.44 },
    { atSec: 5.6, durSec: 0.9, note: 60, gain: 0.4 },
    { atSec: 5.6, durSec: 0.9, note: 63.86, gain: 0.4 },
  ],
}

// Two laps of C, F with the sixth, G: the last C is 43 cents under the first.
const TWO_LAPS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 60, gain: 0.36 },
    { atSec: 0, durSec: 0.9, note: 63.86, gain: 0.36 },
    { atSec: 0, durSec: 0.9, note: 67.02, gain: 0.36 },
    { atSec: 0, durSec: 0.9, note: 72, gain: 0.36 },
    { atSec: 0.9, durSec: 0.9, note: 64.98, gain: 0.36 },
    { atSec: 0.9, durSec: 0.9, note: 68.84, gain: 0.36 },
    { atSec: 0.9, durSec: 1.8, note: 73.82, gain: 0.36 },
    { atSec: 1.8, durSec: 0.9, note: 58.67, gain: 0.36 },
    { atSec: 1.8, durSec: 0.9, note: 61.82, gain: 0.36 },
    { atSec: 1.8, durSec: 1.8, note: 66.8, gain: 0.36 },
    { atSec: 2.7, durSec: 1.8, note: 59.78, gain: 0.36 },
    { atSec: 2.7, durSec: 0.9, note: 63.65, gain: 0.36 },
    { atSec: 2.7, durSec: 0.9, note: 71.78, gain: 0.36 },
    { atSec: 3.6, durSec: 0.9, note: 64.77, gain: 0.36 },
    { atSec: 3.6, durSec: 0.9, note: 68.63, gain: 0.36 },
    { atSec: 3.6, durSec: 1.8, note: 73.61, gain: 0.36 },
    { atSec: 4.5, durSec: 0.9, note: 58.45, gain: 0.36 },
    { atSec: 4.5, durSec: 0.9, note: 61.61, gain: 0.36 },
    { atSec: 4.5, durSec: 2, note: 66.59, gain: 0.36 },
    { atSec: 5.4, durSec: 1.1, note: 59.57, gain: 0.36 },
    { atSec: 5.4, durSec: 1.1, note: 63.43, gain: 0.36 },
    { atSec: 5.4, durSec: 1.1, note: 71.57, gain: 0.36 },
  ],
}

// The palindrome over an open fifth that never moves: the two disagree by a comma only in the middle.
const PEDAL_STAYS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.9, note: 48, gain: 0.4 },
    { atSec: 0, durSec: 6.9, note: 55.02, gain: 0.34 },
    { atSec: 0, durSec: 1.5, note: 60, gain: 0.34 },
    { atSec: 0, durSec: 1.5, note: 63.86, gain: 0.34 },
    { atSec: 0, durSec: 0.75, note: 67.02, gain: 0.34 },
    { atSec: 0.75, durSec: 1.5, note: 68.84, gain: 0.34 },
    { atSec: 1.5, durSec: 1.5, note: 61.82, gain: 0.34 },
    { atSec: 1.5, durSec: 0.75, note: 64.98, gain: 0.34 },
    { atSec: 2.25, durSec: 2.25, note: 66.8, gain: 0.34 },
    { atSec: 2.25, durSec: 0.75, note: 70.67, gain: 0.34 },
    { atSec: 3, durSec: 0.75, note: 63.65, gain: 0.34 },
    { atSec: 3, durSec: 0.75, note: 71.78, gain: 0.34 },
    { atSec: 3.75, durSec: 1.5, note: 61.82, gain: 0.34 },
    { atSec: 3.75, durSec: 0.75, note: 70.67, gain: 0.34 },
    { atSec: 4.5, durSec: 0.75, note: 64.98, gain: 0.34 },
    { atSec: 4.5, durSec: 1.5, note: 68.84, gain: 0.34 },
    { atSec: 5.25, durSec: 1.6, note: 60, gain: 0.34 },
    { atSec: 5.25, durSec: 1.6, note: 63.86, gain: 0.34 },
    { atSec: 6, durSec: 0.85, note: 67.02, gain: 0.34 },
  ],
}

// The top voice of the palindrome by itself: G, A, B, the lower C, and back down its own steps.
const TOP_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.75, note: 67.02, gain: 0.6 },
    { atSec: 0.75, durSec: 1.5, note: 68.84, gain: 0.6 },
    { atSec: 2.25, durSec: 0.75, note: 70.67, gain: 0.6 },
    { atSec: 3, durSec: 0.75, note: 71.78, gain: 0.6 },
    { atSec: 3.75, durSec: 0.75, note: 70.67, gain: 0.6 },
    { atSec: 4.5, durSec: 1.5, note: 68.84, gain: 0.6 },
    { atSec: 6, durSec: 0.85, note: 67.02, gain: 0.6 },
  ],
}

// The bass of the rising palindrome: C, G, D, F, a C that is a comma sharp, and down to pitch again.
const RISE_BASS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.75, note: 48, gain: 0.6 },
    { atSec: 0.75, durSec: 0.75, note: 43.02, gain: 0.6 },
    { atSec: 1.5, durSec: 0.75, note: 50.04, gain: 0.6 },
    { atSec: 2.25, durSec: 0.75, note: 53.2, gain: 0.6 },
    { atSec: 3, durSec: 0.75, note: 48.22, gain: 0.6 },
    { atSec: 3.75, durSec: 0.75, note: 53.2, gain: 0.6 },
    { atSec: 4.5, durSec: 0.75, note: 50.04, gain: 0.6 },
    { atSec: 5.25, durSec: 0.75, note: 43.02, gain: 0.6 },
    { atSec: 6, durSec: 0.85, note: 48, gain: 0.6 },
  ],
}

// Lowest and highest upper voice: fifth, sixth, fifth, sixth, sixth, each of them pure.
const DUET: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 0.75, note: 67.02, gain: 0.5 },
    { atSec: 0.75, durSec: 1.5, note: 68.84, gain: 0.5 },
    { atSec: 1.5, durSec: 1.5, note: 61.82, gain: 0.5 },
    { atSec: 2.25, durSec: 0.75, note: 70.67, gain: 0.5 },
    { atSec: 3, durSec: 0.75, note: 63.65, gain: 0.5 },
    { atSec: 3, durSec: 0.75, note: 71.78, gain: 0.5 },
    { atSec: 3.75, durSec: 1.5, note: 61.82, gain: 0.5 },
    { atSec: 3.75, durSec: 0.75, note: 70.67, gain: 0.5 },
    { atSec: 4.5, durSec: 1.5, note: 68.84, gain: 0.5 },
    { atSec: 5.25, durSec: 1.6, note: 60, gain: 0.5 },
    { atSec: 6, durSec: 0.85, note: 67.02, gain: 0.5 },
  ],
}

// The duet beside itself in equal temperament: one sound at either end, beating in the sunken middle.
const SHADOW_PAIR: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 0.75, note: 67.02, gain: 0.4 },
    { atSec: 0, durSec: 0.75, note: 67, gain: 0.4 },
    { atSec: 0.75, durSec: 1.5, note: 68.84, gain: 0.4 },
    { atSec: 0.75, durSec: 1.5, note: 69, gain: 0.4 },
    { atSec: 1.5, durSec: 1.5, note: 61.82, gain: 0.4 },
    { atSec: 1.5, durSec: 1.5, note: 62, gain: 0.4 },
    { atSec: 2.25, durSec: 0.75, note: 70.67, gain: 0.4 },
    { atSec: 2.25, durSec: 0.75, note: 71, gain: 0.4 },
    { atSec: 3, durSec: 0.75, note: 63.65, gain: 0.4 },
    { atSec: 3, durSec: 0.75, note: 64, gain: 0.4 },
    { atSec: 3, durSec: 0.75, note: 71.78, gain: 0.4 },
    { atSec: 3, durSec: 0.75, note: 72, gain: 0.4 },
    { atSec: 3.75, durSec: 1.5, note: 61.82, gain: 0.4 },
    { atSec: 3.75, durSec: 1.5, note: 62, gain: 0.4 },
    { atSec: 3.75, durSec: 0.75, note: 70.67, gain: 0.4 },
    { atSec: 3.75, durSec: 0.75, note: 71, gain: 0.4 },
    { atSec: 4.5, durSec: 1.5, note: 68.84, gain: 0.4 },
    { atSec: 4.5, durSec: 1.5, note: 69, gain: 0.4 },
    { atSec: 5.25, durSec: 1.6, note: 60, gain: 0.4 },
    { atSec: 6, durSec: 0.85, note: 67.02, gain: 0.4 },
    { atSec: 6, durSec: 0.85, note: 67, gain: 0.4 },
  ],
}

// The bass of the palindrome: down to a C that is a comma flat, and up again.
const BASS_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.75, note: 48, gain: 0.6 },
    { atSec: 0.75, durSec: 0.75, note: 44.84, gain: 0.6 },
    { atSec: 1.5, durSec: 0.75, note: 37.82, gain: 0.6 },
    { atSec: 2.25, durSec: 0.75, note: 42.8, gain: 0.6 },
    { atSec: 3, durSec: 0.75, note: 35.78, gain: 0.6 },
    { atSec: 3.75, durSec: 0.75, note: 42.8, gain: 0.6 },
    { atSec: 4.5, durSec: 0.75, note: 37.82, gain: 0.6 },
    { atSec: 5.25, durSec: 0.75, note: 44.84, gain: 0.6 },
    { atSec: 6, durSec: 0.85, note: 48, gain: 0.6 },
  ],
}

// The comma laid bare: an open C chord, the same chord 21.5 cents lower, the same chord home.
const COMMA_BARE: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 48, gain: 0.45 },
    { atSec: 0, durSec: 2.2, note: 55.02, gain: 0.45 },
    { atSec: 0, durSec: 2.2, note: 63.86, gain: 0.45 },
    { atSec: 2.2, durSec: 2.2, note: 47.78, gain: 0.45 },
    { atSec: 2.2, durSec: 2.2, note: 54.8, gain: 0.45 },
    { atSec: 2.2, durSec: 2.2, note: 63.65, gain: 0.45 },
    { atSec: 4.4, durSec: 2.2, note: 48, gain: 0.45 },
    { atSec: 4.4, durSec: 2.2, note: 55.02, gain: 0.45 },
    { atSec: 4.4, durSec: 2.2, note: 63.86, gain: 0.45 },
  ],
}

// Each note tuned to the one still sounding: C, A, D, G, the lower C, and the way back.
const CHAIN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 60, gain: 0.5 },
    { atSec: 0.7, durSec: 1.3, note: 68.84, gain: 0.5 },
    { atSec: 1.4, durSec: 1.3, note: 61.82, gain: 0.5 },
    { atSec: 2.1, durSec: 1.3, note: 66.8, gain: 0.5 },
    { atSec: 2.8, durSec: 1.3, note: 59.78, gain: 0.5 },
    { atSec: 3.5, durSec: 1.3, note: 66.8, gain: 0.5 },
    { atSec: 4.2, durSec: 1.3, note: 61.82, gain: 0.5 },
    { atSec: 4.9, durSec: 1.3, note: 68.84, gain: 0.5 },
    { atSec: 5.6, durSec: 1.3, note: 60, gain: 0.5 },
  ],
}

// The same chords in equal temperament, where nothing sinks: the shadow to lay beside the others.
const EQUAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 1.4, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 0.7, note: 67, gain: 0.5 },
    { atSec: 0.7, durSec: 1.4, note: 69, gain: 0.5 },
    { atSec: 1.4, durSec: 1.4, note: 62, gain: 0.5 },
    { atSec: 1.4, durSec: 0.7, note: 65, gain: 0.5 },
    { atSec: 2.1, durSec: 2.1, note: 67, gain: 0.5 },
    { atSec: 2.1, durSec: 0.7, note: 71, gain: 0.5 },
    { atSec: 2.8, durSec: 0.7, note: 64, gain: 0.5 },
    { atSec: 2.8, durSec: 0.7, note: 72, gain: 0.5 },
    { atSec: 3.5, durSec: 1.4, note: 62, gain: 0.5 },
    { atSec: 3.5, durSec: 0.7, note: 71, gain: 0.5 },
    { atSec: 4.2, durSec: 0.7, note: 65, gain: 0.5 },
    { atSec: 4.2, durSec: 1.4, note: 69, gain: 0.5 },
    { atSec: 4.9, durSec: 1.6, note: 60, gain: 0.5 },
    { atSec: 4.9, durSec: 1.6, note: 64, gain: 0.5 },
    { atSec: 5.6, durSec: 0.9, note: 67, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // String machine: its ensemble and drift at nothing, so three octaves of saws stand still.
  {
    id: 'comma-home-held-to-the-cent',
    name: 'Held to the cent',
    category: 'pad',
    description:
      'Dry saws with no chorus and no drift, darkened and softly started, spread wide and set in a four second hall.',
    preview: ONE_LAP,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { ensemble: 0, drift: 0, attack: 0.35, release: 1, low: 0.35, high: 0.1, tone: 1500 },
    },
    effects: [
      { deviceId: 'spread', params: { mid: 1.7, high: 1.9, make: 0.9 } },
      { deviceId: 'hall-reverb', params: { lowDecay: 4, midDecay: 3.5, damping: 4000, mix: 0.4 } },
    ],
  },
  {
    id: 'comma-home-light-behind-a-cloud',
    name: 'Light behind a cloud',
    category: 'pad',
    description:
      'A low dark ensemble with its chorus off, let into a ten second tank in slow waves and shaded above 2600 Hz.',
    preview: COMMA_BARE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Low fog',
      params: { ensemble: 0, drift: 0, attack: 1, release: 3.5, tone: 520 },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        params: { decay: 10, damping: 0.8, breathDepth: 0.85, breathRate: 0.18, mix: 0.5 },
      },
      { deviceId: 'ambient-eq', params: { low: 2, body: -2, highCut: 2600 } },
    ],
  },
  {
    id: 'comma-home-sun-through-thin-paper',
    name: 'Sun through thin paper',
    category: 'pad',
    description:
      'The middle and top octaves of the ensemble, unmoving, partials flickering band by band on a bright plate.',
    preview: SHORT_WAY,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { ensemble: 0, drift: 0, attack: 0.4, release: 1.2, tone: 8000 },
    },
    effects: [
      { deviceId: 'glimmer', params: { depth: 0.9, rate: 0.5, grain: 0.9, lean: 0.6, apart: 0.8 } },
      { deviceId: 'plate-reverb', params: { decay: 0.75, damping: 0.1, mix: 0.35 } },
    ],
  },
  {
    id: 'comma-home-root-walks-to-the-cellar',
    name: 'Root walks to the cellar',
    category: 'bass',
    description:
      'Low saws with a quick bow, pressed into a round vowel and pushed through a triode stage.',
    preview: BASS_LINE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { ensemble: 0, drift: 0, attack: 0.12, release: 0.7, tone: 1000 },
    },
    effects: [
      { deviceId: 'imprint', params: { shape: 2, amount: 1.2, replace: 0.5 } },
      { deviceId: 'analog-drive', params: { circuit: 3, drive: 0.35 } },
    ],
  },
  {
    id: 'comma-home-lamps-along-the-quay',
    name: 'Lamps along the quay',
    category: 'organ',
    description:
      'An organ-like ensemble cut by two soft gates that fall out of step, left in a five second room.',
    preview: THERE_AND_BACK,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { volume: -7.5, ensemble: 0, drift: 0, release: 0.25 },
    },
    effects: [
      { deviceId: 'pulses', params: { rate: 3.2, steps: 8, fill: 5, floor: 0.15, length: 0.6 } },
      { deviceId: 'ether-reverb', params: { decay: 5, damping: 0.3, size: 0.7, mix: 0.35 } },
    ],
  },
  {
    id: 'comma-home-slow-to-be-spoken',
    name: 'Slow to be spoken',
    category: 'string',
    description:
      'Middle strings with every onset drawn out over most of a second, and a reverb that blooms behind them.',
    preview: RISING,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { ensemble: 0, drift: 0, attack: 0.2, release: 1.2, tone: 2600 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 800, release: 300 } },
      { deviceId: 'shaped-reverb', params: { shape: 2, time: 2.6, modulation: 0, mix: 0.5 } },
    ],
  },
  {
    id: 'comma-home-only-what-is-shared',
    name: 'Only what is shared',
    category: 'pad',
    description:
      'Hollow strings of which mainly the notes two chords share come through, the changes turned far down.',
    preview: THERE_AND_BACK,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Hollow strings',
      params: { ensemble: 0, drift: 0, attack: 0.15, release: 1.4 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        params: { ago: 800, strict: 0.75, ring: 0.7, floor: -20, makeup: 0.8, mix: 0.85 },
      },
      { deviceId: 'spread', params: { mid: 1.5, high: 1.6 } },
    ],
  },
  {
    id: 'comma-home-pipe-of-standing-air',
    name: 'Pipe of standing air',
    category: 'string',
    description:
      'Muted high strings sounding inside an open pipe, with six scattered echoes that fade.',
    preview: TOP_LINE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: { ensemble: 0, drift: 0, attack: 0.5, release: 1.3, tone: 2200 },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 1, size: 1.6, material: 0.4, opening: 0.6, air: 0.1, mix: 0.8 },
      },
      {
        deviceId: 'constellation',
        params: { span: 2600, stars: 6, drift: 0, fade: 0.5, mix: 0.35 },
      },
    ],
  },
  {
    id: 'comma-home-floor-under-the-sky',
    name: 'Floor under the sky',
    category: 'drone',
    description:
      'Low and middle octaves rising over a second and a half, warmed by a tube curve in a fourteen second space.',
    preview: COMMA_BARE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Long cello swell',
      params: { volume: -17.5, ensemble: 0, drift: 0, attack: 1.5, release: 4, high: 0, tone: 700 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 2, driveDb: 9 } },
      {
        deviceId: 'expanse',
        params: { modDepth: 0, size: 0.8, decay: 14, lowCut: 60, highCut: 3000, mix: 0.45 },
      },
    ],
  },
  {
    id: 'comma-home-three-floors-at-once',
    name: 'Three floors at once',
    category: 'pad',
    description:
      'All three octaves under a low-pass that opens and shuts every five seconds, with plain tape repeats.',
    preview: THERE_AND_BACK,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: { ensemble: 0, drift: 0, attack: 0.06, release: 0.5, width: 0.6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 900,
          resonance: 1.2,
          lfoAmount: 40,
          lfoRateHz: 0.2,
          lfoShape: 1,
        },
      },
      { deviceId: 'tape-echo', params: { time: 525, feedback: 0.4, wow: 0, flutter: 0, mix: 0.3 } },
    ],
  },
  {
    id: 'comma-home-plumb-weight',
    name: 'Plumb weight',
    category: 'bass',
    description:
      'A dark bowed bass with the octave above each note added, through a big speaker with the microphone well back.',
    preview: BASS_LINE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bowed bass',
      params: { ensemble: 0, drift: 0, attack: 0.04, release: 0.4, tone: 700 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0, up1: 0.6, dry: 0.9 } },
      {
        deviceId: 're-amp',
        params: { speaker: 2, drive: 0.35, room: 0.5, distance: 0.5, noise: 0 },
      },
    ],
  },
  {
    id: 'comma-home-window-above-the-stair',
    name: 'Window above the stair',
    category: 'texture',
    description:
      'A bright ensemble, its top octave strong, with attacks sifted out and air raised, blurred to a tailless cloud.',
    preview: THERE_AND_BACK,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bright shimmer',
      params: { ensemble: 0, drift: 0, attack: 0.4, release: 1 },
    },
    effects: [
      { deviceId: 'sift', params: { tones: 0, attacks: -20, air: 6, hold: 0.6, scatter: 0.9 } },
      { deviceId: 'fog', params: { size: 400, drift: 0, mix: 1 } },
    ],
  },
  {
    id: 'comma-home-undertow-then-return',
    name: 'Undertow then return',
    category: 'pad',
    description:
      'Slow strings whose bands swell and drift from side to side, followed by their own backwards echo.',
    preview: ONE_LAP,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { ensemble: 0, drift: 0, attack: 0.8, release: 2, tone: 2400 },
    },
    effects: [
      { deviceId: 'currents', params: { depth: 0.9, sway: 0.7, rate: 0.25, bands: 6 } },
      { deviceId: 'reverse-delay', params: { time: 1400, feedback: 0.3, tone: 4000, mix: 0.4 } },
    ],
  },
  {
    id: 'comma-home-heard-across-the-yard',
    name: 'Heard across the yard',
    category: 'string',
    description:
      'A plain string ensemble set far off, dull and small in its room, then levelled so the far chord stays present.',
    preview: TWO_LAPS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { ensemble: 0, drift: 0, attack: 0.2, release: 0.9 },
    },
    effects: [
      {
        deviceId: 'distance',
        params: { distance: 0.75, room: 0.8, air: 0.7, wander: 0, doppler: 0, decay: 2.5 },
      },
      { deviceId: 'ambient-comp', params: { threshold: -36, ratio: 3, makeup: 8 } },
    ],
  },
  // Horns: no vibrato and one line each, for the chords that rise and come home.
  {
    id: 'comma-home-rising-while-stepping',
    name: 'Rising while stepping',
    category: 'wind',
    description:
      'A small horn section that swells in under a second, in a five second hall with a dull top.',
    preview: RISING,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { vibrato: 0, harmony: 0, attack: 0.7, release: 2.2, section: 0.3 },
    },
    effects: [
      { deviceId: 'hall-reverb', params: { lowDecay: 5, midDecay: 4, damping: 3500, mix: 0.4 } },
    ],
  },
  {
    id: 'comma-home-up-the-comma-and-down',
    name: 'Up the comma and down',
    category: 'wind',
    description:
      'Soft flugelhorns with a quick start, a little body added and the edge shaved, on a damped plate.',
    preview: RISE_AND_RETURN,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel choir',
      params: { vibrato: 0, harmony: 0, attack: 0.2, release: 1.1, section: 0.4, breath: 0.1 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { presence: -3, body: 2.5, highCut: 6000 } },
      { deviceId: 'plate-reverb', params: { decay: 0.8, damping: 0.6, mix: 0.35 } },
    ],
  },
  {
    id: 'comma-home-low-ladder-home',
    name: 'Low ladder home',
    category: 'wind',
    description:
      'A soft tuba with an octave under it and one above, its colour pressed towards a dark box.',
    preview: RISE_BASS,
    instrument: {
      deviceId: 'horns',
      preset: 'Soft tuba',
      params: { vibrato: 0, harmony: 0, attack: 0.1, release: 0.9, blow: 0.35, breath: 0.2 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0.4, up1: 0.25 } },
      { deviceId: 'imprint', params: { shape: 6, amount: 0.8 } },
    ],
  },
  {
    id: 'comma-home-mute-in-the-doorway',
    name: 'Mute in the doorway',
    category: 'wind',
    description:
      'A muted trumpet through a small speaker down the hall, its echoes skipping closer together.',
    preview: TOP_LINE,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { vibrato: 0, harmony: 0, attack: 0.15, release: 1 },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: { speaker: 0, drive: 0.2, distance: 0.7, room: 0.8, noise: 0 },
      },
      {
        deviceId: 'skipping-stone',
        params: { first: 420, bounce: 0.85, skips: 6, drop: 0, mix: 0.3 },
      },
    ],
  },
  {
    id: 'comma-home-where-the-ice-is-level',
    name: 'Where the ice is level',
    category: 'wind',
    description:
      'Horns blown hard and slow, opened by their own loudness under a filter, in a fourteen second tank.',
    preview: COMMA_BARE,
    instrument: {
      deviceId: 'horns',
      preset: 'Glacial horns',
      params: { vibrato: 0, harmony: 0, attack: 1.4, release: 4, section: 0.4, blow: 0.9 },
    },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 500, envAmount: 45 } },
      {
        deviceId: 'fdn-reverb',
        params: { decay: 14, damping: 0.7, breathDepth: 0, size: 1.8, mix: 0.5 },
      },
    ],
  },
  {
    id: 'comma-home-breath-shares-the-note',
    name: 'Breath shares the note',
    category: 'wind',
    description:
      'More air than horn, the air spread wide and the tone held back, in a bright six second room.',
    preview: DUET,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { vibrato: 0, harmony: 0, attack: 0.25, release: 1.4, breath: 0.8, blow: 0.2 },
    },
    effects: [
      { deviceId: 'sift', params: { tones: -3, attacks: -10, air: 6, scatter: 1 } },
      { deviceId: 'ether-reverb', params: { decay: 6, damping: 0.2, size: 0.8, mix: 0.4 } },
    ],
  },
  {
    id: 'comma-home-brass-at-a-standstill',
    name: 'Brass at a standstill',
    category: 'wind',
    description:
      'Straight trumpets, half a section, leaned into tape saturation with the top tilted down and widened.',
    preview: RISE_AND_RETURN,
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: {
        volume: -18,
        vibrato: 0,
        harmony: 0,
        section: 0.5,
        attack: 0.35,
        release: 1.8,
        blow: 0.75,
      },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 10, toneDb: -8 } },
      { deviceId: 'spread', params: { mid: 1.7, high: 1.7, make: 0.8 } },
    ],
  },
  {
    id: 'comma-home-straight-as-a-rail',
    name: 'Straight as a rail',
    category: 'wind',
    description:
      'One trumpet with no vibrato at all, its quiet end brought up, in a reverb that holds and then stops dead.',
    preview: TOP_LINE,
    instrument: {
      deviceId: 'horns',
      preset: 'Ballad trumpet',
      params: { vibrato: 0, harmony: 0, attack: 0.12, release: 0.8, blow: 0.35, breath: 0.2 },
    },
    effects: [
      { deviceId: 'lift', params: { amount: 0.8, threshold: -24 } },
      { deviceId: 'shaped-reverb', params: { shape: 0, time: 1.2, modulation: 0, mix: 0.45 } },
    ],
  },
  {
    id: 'comma-home-slide-left-unmoved',
    name: 'Slide left unmoved',
    category: 'wind',
    description: 'A single trombone resonating in a large soundboard, then a short dark plate.',
    preview: CHAIN,
    instrument: {
      deviceId: 'horns',
      preset: 'Trombone',
      params: { volume: 0.5, vibrato: 0, harmony: 0, attack: 0.07, release: 0.45, blow: 0.65 },
    },
    effects: [
      { deviceId: 'vessel', params: { body: 5, size: 1.3, material: 0.5, air: 0, mix: 0.85 } },
      { deviceId: 'plate-reverb', params: { decay: 0.35, damping: 0.7, mix: 0.25 } },
    ],
  },
  {
    id: 'comma-home-valley-of-one-chord',
    name: 'Valley of one chord',
    category: 'wind',
    description:
      'Low brass coming up slowly, with sines an octave above its partials that swell in and linger.',
    preview: COMMA_BARE,
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { vibrato: 0, harmony: 0, attack: 1, release: 3.5, section: 0.5 },
    },
    effects: [
      { deviceId: 'sine-shadow', params: { partials: 10, transpose: 12, release: 5, mix: 0.5 } },
      { deviceId: 'ambient-comp', params: { threshold: -30, ratio: 2.5, makeup: 4 } },
    ],
  },
  {
    id: 'comma-home-veil-over-the-bells',
    name: 'Veil over the bells',
    category: 'wind',
    description:
      'Muted brass blurred in three layers of fog and answered by a still reverb shaped as a sung oo.',
    preview: SHORT_WAY,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { vibrato: 0, harmony: 0, attack: 0.45, release: 1.8, section: 0.4 },
    },
    effects: [
      { deviceId: 'fog', params: { size: 500, layers: 3, drift: 0, soften: 0.6, damp: 0.5 } },
      {
        deviceId: 'vowel-reverb',
        params: { vowel: 4, modulation: 0, motion: 0, decay: 5, mix: 0.4 },
      },
    ],
  },
  {
    id: 'comma-home-two-lungs-in-tune',
    name: 'Two lungs in tune',
    category: 'wind',
    description:
      'One breathy flugelhorn that opens and closes in level and colour about every three seconds, with an undriven spring.',
    preview: DUET,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { vibrato: 0, harmony: 0, attack: 0.1, release: 1 },
    },
    effects: [
      { deviceId: 'breath', params: { in: 1.2, out: 1.5, depth: 0.8, hold: 0.1, rest: 0.2 } },
      { deviceId: 'spring-reverb', params: { tone: 3000, drive: 0, drip: 0.15, mix: 0.35 } },
    ],
  },
  {
    id: 'comma-home-call-held-by-the-hill',
    name: 'Call held by the hill',
    category: 'wind',
    description:
      'A solo horn recorded over itself through a room, pass after pass, until only its ringing tones are left.',
    preview: CHAIN,
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { vibrato: 0, harmony: 0, attack: 0.06, release: 1, blow: 0.55 },
    },
    effects: [
      {
        deviceId: 'generations',
        params: { length: 1.4, room: 0.7, resonance: 0.4, keep: 0.78, hiss: 0, mix: 0.5 },
      },
    ],
  },
  {
    id: 'comma-home-brass-under-weather',
    name: 'Brass under weather',
    category: 'wind',
    description:
      'One bright trumpet per note dimmed by passing clouds, in a cave of short echoes that is kept from bending.',
    preview: RISING,
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { vibrato: 0, harmony: 0, section: 0, blow: 0.5, attack: 0.06, release: 0.5 },
    },
    effects: [
      { deviceId: 'weather', params: { kind: 1, exposure: 0.85, voice: 0, pace: 3 } },
      {
        deviceId: 'swarm-reverb',
        params: { length: 0.35, feedback: 0.65, stretch: 0.5, wander: 0, modulation: 0, mix: 0.4 },
      },
    ],
  },
  // Reed organ: celeste and tremulant off, but for the one that beats on purpose.
  {
    id: 'comma-home-plain-pipes-keep-still',
    name: 'Plain pipes keep still',
    category: 'organ',
    description:
      'Flute ranks with no bellows and next to no wind, their colours arriving from high to low, in a three second hall.',
    preview: THERE_AND_BACK,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { celeste: 0, tremulant: 0, breath: 0.06, bellows: 0, attack: 0.12, release: 0.8 },
    },
    effects: [
      {
        deviceId: 'prism',
        params: { time: 450, shape: 1, bands: 24, feedback: 0.3, bend: 0, drift: 0, mix: 0.4 },
      },
      { deviceId: 'hall-reverb', params: { lowDecay: 3, midDecay: 3, damping: 5000, mix: 0.35 } },
    ],
  },
  {
    id: 'comma-home-reed-bench-by-the-door',
    name: 'Reed bench by the door',
    category: 'organ',
    description:
      'A harmonium with its reed drawn far out and no celeste, through a full range speaker in a small room.',
    preview: SHADOW_PAIR,
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: {
        volume: -14.5,
        celeste: 0,
        tremulant: 0,
        bellows: 0.1,
        reed: 0.75,
        breath: 0.1,
        release: 0.2,
        tone: 4500,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: { speaker: 4, drive: 0.3, distance: 0.5, room: 0.6, noise: 0 },
      },
    ],
  },
  {
    id: 'comma-home-all-ranks-agree',
    name: 'All ranks agree',
    category: 'organ',
    description:
      'Every rank of the organ with no beating, the sub drawn part way, its middle eased by a broad cut, on a bright plate.',
    preview: SHORT_WAY,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { sub: 0.3, celeste: 0, tremulant: 0, bellows: 0, breath: 0, release: 0.4 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { body: -5, presence: 2, air: 3, clear: 0.7 } },
      { deviceId: 'plate-reverb', params: { decay: 0.6, damping: 0, mix: 0.3 } },
    ],
  },
  {
    id: 'comma-home-a-fifth-left-standing',
    name: 'A fifth left standing',
    category: 'organ',
    description:
      'A flute with its twelfth drawn far out and a soft sub, under a band that crosses it every eight seconds.',
    preview: CHAIN,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { volume: -2, celeste: 0, tremulant: 0, sub: 0.25, attack: 0.25, release: 1.6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { type: 2, cutoffHz: 700, resonance: 1.6, lfoAmount: 45, lfoRateHz: 0.125 },
      },
      { deviceId: 'fdn-reverb', params: { decay: 8, damping: 0.3, breathDepth: 0, mix: 0.5 } },
    ],
  },
  {
    id: 'comma-home-the-one-that-beats',
    name: 'The one that beats',
    category: 'organ',
    description:
      'A flute rank and its celeste, left beating on purpose, waking a table of still bowls tuned in fifths.',
    preview: PEDAL_STAYS,
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { celeste: 1, tremulant: 0, attack: 0.3, release: 1.6 },
    },
    effects: [
      {
        deviceId: 'bowls',
        params: {
          root: 0,
          scale: 4,
          bowls: 6,
          ring: 9,
          beat: 0,
          strike: 0.2,
          mix: 0.4,
          register: 0.4,
        },
      },
    ],
  },
  {
    id: 'comma-home-through-two-walls',
    name: 'Through two walls',
    category: 'organ',
    description:
      'A muffled organ in the next house: far off, dull, narrow, with the rumble of an empty room under it.',
    preview: COMMA_BARE,
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { volume: -3.5, celeste: 0, tremulant: 0, breath: 0.1, bellows: 0, attack: 0.4 },
    },
    effects: [
      {
        deviceId: 'distance',
        params: { distance: 0.7, room: 0.4, air: 0.8, wander: 0, doppler: 0, width: 0.2 },
      },
      { deviceId: 'noise-floor', params: { type: 2, level: -50, movement: 0.1 } },
    ],
  },
  {
    id: 'comma-home-pedal-with-no-wind',
    name: 'Pedal with no wind',
    category: 'organ',
    description:
      'A deep sub rank without air or bellows, pushed into a tube curve so its harmonics speak, and narrowed.',
    preview: BASS_LINE,
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: {
        volume: -17,
        celeste: 0,
        tremulant: 0,
        bellows: 0,
        breath: 0,
        attack: 0.1,
        release: 0.8,
        tone: 900,
      },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 2, driveDb: 14, toneDb: 3 } },
      { deviceId: 'stereo-widener', params: { width: 0.35 } },
    ],
  },
  {
    id: 'comma-home-wind-in-the-porch',
    name: 'Wind in the porch',
    category: 'organ',
    description:
      'More wind than pipe, gusted over by a dry breeze, in a shiny room of seven seconds.',
    preview: DUET,
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: { celeste: 0, tremulant: 0, bellows: 0, octave: 0.15, attack: 0.3, release: 1.2 },
    },
    effects: [
      { deviceId: 'weather', params: { kind: 0, exposure: 0.7, voice: 0.1, force: 0.6, pace: 2 } },
      { deviceId: 'ether-reverb', params: { decay: 7, damping: 0.1, size: 0.8, mix: 0.4 } },
    ],
  },
  {
    id: 'comma-home-bellows-asleep',
    name: 'Bellows asleep',
    category: 'drone',
    description:
      'Sub and reed starting softly, caught by a sustainer that holds each chord as an even bed and glides to the next.',
    preview: PEDAL_STAYS,
    instrument: {
      deviceId: 'organ',
      preset: 'Shruti box',
      params: { celeste: 0, tremulant: 0, bellows: 0.1, breath: 0.15, attack: 0.5, release: 1.5 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        params: {
          attack: 0.4,
          decay: 6,
          glide: 0.5,
          motion: 0,
          ensemble: 0,
          tone: -0.3,
          mix: 0.65,
        },
      },
    ],
  },
  {
    id: 'comma-home-altar-lamp-at-noon',
    name: 'Altar lamp at noon',
    category: 'organ',
    description:
      'Octave, twelfth and fifteenth opening over a second, blurred and glowing through a soft fuzz.',
    preview: COMMA_BARE,
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: {
        celeste: 0,
        tremulant: 0,
        attack: 1.1,
        release: 3,
        bellows: 0,
        sub: 0,
        reed: 0.1,
        tone: 4500,
      },
    },
    effects: [
      {
        deviceId: 'haze',
        params: { haze: 0.4, blur: 0.7, decay: 6, octave: 0, feed: 0.15, mix: 0.45 },
      },
    ],
  },
  {
    id: 'comma-home-a-reed-sings-ee',
    name: 'A reed sings ee',
    category: 'organ',
    description:
      'A single reed rank without its tremulant, pressed into a thin vowel and sent through a two spring tank.',
    preview: TOP_LINE,
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: {
        volume: -4,
        celeste: 0,
        tremulant: 0,
        reed: 0.9,
        bellows: 0,
        breath: 0.1,
        attack: 0.1,
      },
    },
    effects: [
      { deviceId: 'imprint', params: { shape: 3, amount: 1.1, replace: 0.5 } },
      {
        deviceId: 'spring-reverb',
        params: { springs: 1, tone: 3200, drive: 0.1, drip: 0.2, mix: 0.35 },
      },
    ],
  },
  {
    id: 'comma-home-squeeze-on-the-steps',
    name: 'Squeeze on the steps',
    category: 'organ',
    description: 'A short bright free reed in slow soft pulses that answer from left and right.',
    preview: THERE_AND_BACK,
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: { celeste: 0, tremulant: 0, bellows: 0, release: 0.15 },
    },
    effects: [
      {
        deviceId: 'pulses',
        params: { rate: 2.1, steps: 5, fill: 3, floor: 0.3, apart: 1, edge: 0.4, drift: 0.8 },
      },
      { deviceId: 'spread', params: { mid: 1.4, high: 1.8, make: 0.9 } },
    ],
  },
  // Choir: vibrato and vowel motion at nothing, the singers close in pitch.
  {
    id: 'comma-home-ooh-two-laps-down',
    name: 'Ooh, two laps down',
    category: 'voice',
    description:
      'Small high voices on one unmoving ooh, with no vibrato and little detune, in a clear hall.',
    preview: TWO_LAPS,
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { vibrato: 0, motion: 0, ensemble: 0.25, attack: 0.25, release: 1.2, breath: 0.1 },
    },
    effects: [
      { deviceId: 'hall-reverb', params: { lowDecay: 4, midDecay: 4.5, damping: 9000, mix: 0.4 } },
    ],
  },
  {
    id: 'comma-home-monks-at-the-low-mark',
    name: 'Monks at the low mark',
    category: 'voice',
    description: 'Low still voices sung into a small shell, with the octave below each note added.',
    preview: RISE_BASS,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { vibrato: 0, motion: 0, ensemble: 0.4, attack: 0.2, release: 1.2 },
    },
    effects: [
      { deviceId: 'vessel', params: { body: 3, size: 1.8, material: 0.5, air: 0, mix: 0.6 } },
      { deviceId: 'octaves', params: { sub1: 0.45, up1: 0 } },
    ],
  },
  {
    id: 'comma-home-a-chord-made-of-breath',
    name: 'A chord made of breath',
    category: 'voice',
    description:
      'Nearly all breath, its faint tones turned up band by band, in a nine second tank.',
    preview: COMMA_BARE,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { vibrato: 0, motion: 0, ensemble: 0.4, attack: 0.5, release: 2.4 },
    },
    effects: [
      { deviceId: 'reveal', params: { amount: 0.85, detail: 0.9, range: 20 } },
      { deviceId: 'fdn-reverb', params: { decay: 9, damping: 0.2, breathDepth: 0, mix: 0.45 } },
    ],
  },
  {
    id: 'comma-home-ee-against-the-pane',
    name: 'Ee against the pane',
    category: 'voice',
    description:
      'A straight bright ee with sines an octave and a fifth above it that swell in behind and stay.',
    preview: THERE_AND_BACK,
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { vibrato: 0, motion: 0, ensemble: 0.2, attack: 0.3, release: 1.2 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: { partials: 6, transpose: 19, attack: 200, release: 2.5, tone: 0.4, mix: 0.45 },
      },
    ],
  },
  {
    id: 'comma-home-hummed-at-the-sink',
    name: 'Hummed at the sink',
    category: 'voice',
    description:
      'A closed-mouth hum, evened out by a slow compressor and heard through a narrow spring.',
    preview: DUET,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { vibrato: 0, motion: 0, ensemble: 0.3, attack: 0.2, release: 0.8 },
    },
    effects: [
      { deviceId: 'ambient-comp', params: { threshold: -34, ratio: 4, attack: 80, makeup: 5 } },
      {
        deviceId: 'spring-reverb',
        params: { springs: 0, tone: 2000, drive: 0.2, drip: 0, width: 0.2, mix: 0.4 },
      },
    ],
  },
  {
    id: 'comma-home-one-voice-no-waver',
    name: 'One voice, no waver',
    category: 'voice',
    description: 'A soloist singing ah with the vibrato switched off, on a long open plate.',
    preview: TOP_LINE,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { volume: -3.5, vibrato: 0, motion: 0, attack: 0.15, release: 0.9 },
    },
    effects: [
      { deviceId: 'plate-reverb', params: { decay: 0.9, damping: 0.15, predelayMs: 70, mix: 0.4 } },
    ],
  },
  {
    id: 'comma-home-tenors-on-a-level-beam',
    name: 'Tenors on a level beam',
    category: 'voice',
    description: 'Tenors on oh through a slow notch, with steady tape repeats 0.7 seconds behind.',
    preview: CHAIN,
    instrument: {
      deviceId: 'choir',
      preset: 'Tenors oh',
      params: { volume: -4.5, vibrato: 0, motion: 0, ensemble: 0.3, attack: 0.12, release: 0.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { type: 3, cutoffHz: 800, resonance: 1, lfoAmount: 60, lfoRateHz: 0.3 },
      },
      {
        deviceId: 'tape-echo',
        params: { time: 700, feedback: 0.5, wow: 0, flutter: 0, highCut: 2800, mix: 0.35 },
      },
    ],
  },
  {
    id: 'comma-home-basses-under-the-line',
    name: 'Basses under the line',
    category: 'voice',
    description:
      'Basses on ah under a steady low-pass near 480 Hz, their middle band widened, with a short dark plate.',
    preview: RISING,
    instrument: {
      deviceId: 'choir',
      preset: 'Basses ah',
      params: { vibrato: 0, motion: 0, ensemble: 0.2, attack: 0.3, release: 1.2 },
    },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 480, resonance: 2.2 } },
      { deviceId: 'spread', params: { low: 0.6, mid: 1.5, make: 0.9 } },
      { deviceId: 'plate-reverb', params: { decay: 0.4, damping: 0.9, mix: 0.3 } },
    ],
  },
  {
    id: 'comma-home-village-on-the-far-side',
    name: 'Village on the far side',
    category: 'voice',
    description:
      'A distant breathy choir put farther off still, with a reverb that swells after the note, then levelled.',
    preview: COMMA_BARE,
    instrument: {
      deviceId: 'choir',
      preset: 'Distant choir',
      params: { vibrato: 0, motion: 0, attack: 0.9, release: 4, ensemble: 0.35 },
    },
    effects: [
      {
        deviceId: 'distance',
        params: { distance: 0.6, room: 0.6, air: 0.6, wander: 0, doppler: 0, decay: 1.5 },
      },
      { deviceId: 'shaped-reverb', params: { shape: 2, time: 3, modulation: 0, mix: 0.4 } },
      { deviceId: 'ambient-comp', params: { threshold: -40, ratio: 3, makeup: 10 } },
    ],
  },
  {
    id: 'comma-home-short-ahs-on-the-stairs',
    name: 'Short ahs on the stairs',
    category: 'voice',
    description: 'Short breathy ahs with no swell, each answered by a ladder of eight echoes.',
    preview: THERE_AND_BACK,
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: { vibrato: 0, motion: 0, ensemble: 0.3, attack: 0.03, release: 0.25 },
    },
    effects: [
      {
        deviceId: 'constellation',
        params: { span: 3200, stars: 8, pattern: 3, drift: 0, fade: 0.35, again: 0.2, mix: 0.5 },
      },
    ],
  },
  {
    id: 'comma-home-trebles-lying-still',
    name: 'Trebles lying still',
    category: 'voice',
    description:
      'High voices whose vowel stays put while six bands of them drift and fade on slow cycles.',
    preview: THERE_AND_BACK,
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: { volume: -5, vibrato: 0, motion: 0, attack: 0.5, release: 2, ensemble: 0.4 },
    },
    effects: [
      {
        deviceId: 'currents',
        params: { depth: 0.95, sway: 0.9, rate: 0.35, bands: 6, lowHold: 60 },
      },
      {
        deviceId: 'expanse',
        params: { modDepth: 0, size: 0.6, decay: 6, highCut: 9000, mix: 0.35 },
      },
    ],
  },
  // Flute: no vibrato, no scoop.
  {
    id: 'comma-home-g-unbent',
    name: 'G, unbent',
    category: 'wind',
    description:
      'A straight flute tone with no scoop and no vibrato, in a bright hall of a little over two seconds.',
    preview: TOP_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { vibrato: 0, scoop: 0, attack: 0.12, release: 0.6 },
    },
    effects: [
      {
        deviceId: 'hall-reverb',
        params: { lowDecay: 1.6, midDecay: 2.4, damping: 12000, mix: 0.35 },
      },
    ],
  },
  {
    id: 'comma-home-pipes-in-lockstep',
    name: 'Pipes in lockstep',
    category: 'wind',
    description:
      'Chiffing pan pipes whose notes spiral out into nine quiet echoes between the sides.',
    preview: THERE_AND_BACK,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { vibrato: 0, scoop: 0, release: 0.25 },
    },
    effects: [
      {
        deviceId: 'constellation',
        params: { span: 1800, stars: 9, pattern: 0, drift: 0, fade: 0.3, width: 1, mix: 0.45 },
      },
    ],
  },
  {
    id: 'comma-home-air-before-any-pitch',
    name: 'Air before any pitch',
    category: 'wind',
    description: 'Mostly breath, shaped like a hollow tube, in a soft six second room.',
    preview: DUET,
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { vibrato: 0, scoop: 0, attack: 0.4, release: 1.8 },
    },
    effects: [
      { deviceId: 'imprint', params: { shape: 4, amount: 1.4, replace: 0.6 } },
      { deviceId: 'ether-reverb', params: { decay: 6, damping: 0.6, size: 0.7, mix: 0.4 } },
    ],
  },
  {
    id: 'comma-home-low-flute-holds-over',
    name: 'Low flute holds over',
    category: 'wind',
    description:
      'A level low flute of which mainly the notes shared with a moment before come through, and are left to ring.',
    preview: CHAIN,
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { vibrato: 0, scoop: 0, attack: 0.2, release: 1.4 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        params: { ago: 300, strict: 0.6, ring: 0.85, memory: 0.6, floor: -24, makeup: 1, mix: 0.8 },
      },
      { deviceId: 'ambient-eq', params: { low: 3, presence: -3 } },
    ],
  },
  {
    id: 'comma-home-wood-under-gutter-rain',
    name: 'Wood under gutter rain',
    category: 'wind',
    description: 'A slow wooden flute with light rain tapping on it, in a ten second tank.',
    preview: DUET,
    instrument: {
      deviceId: 'flute',
      preset: 'Slow wood swell',
      params: { vibrato: 0, scoop: 0, attack: 0.5, release: 2.4 },
    },
    effects: [
      { deviceId: 'weather', params: { kind: 2, exposure: 0.6, voice: 0.25, pace: 1.5 } },
      { deviceId: 'fdn-reverb', params: { decay: 10, damping: 0.5, breathDepth: 0, mix: 0.45 } },
    ],
  },
  {
    id: 'comma-home-recorder-on-two-floors',
    name: 'Recorder on two floors',
    category: 'wind',
    description:
      'A soft recorder with a pipe an octave above and one two octaves above, speaking a little late.',
    preview: THERE_AND_BACK,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { vibrato: 0, scoop: 0, attack: 0.08, release: 0.4 },
    },
    effects: [
      {
        deviceId: 'stops',
        params: {
          sub: 0,
          unison: 0.8,
          octave: 0.8,
          twelfth: 0,
          fifteenth: 0.5,
          detune: 0,
          speak: 250,
          chiff: 0.1,
          mix: 0.75,
        },
      },
      { deviceId: 'plate-reverb', params: { decay: 0.5, damping: 0.4, mix: 0.2 } },
    ],
  },
  {
    id: 'comma-home-bamboo-without-a-bend',
    name: 'Bamboo without a bend',
    category: 'wind',
    description:
      'A breathy bamboo flute kept from bending, each onset swelled, and a reverb that rises backwards into a cut.',
    preview: TOP_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: { vibrato: 0, scoop: 0, chiff: 0.3, breath: 0.75, release: 0.9 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 450, release: 200 } },
      { deviceId: 'shaped-reverb', params: { shape: 1, time: 1.5, modulation: 0, mix: 0.45 } },
    ],
  },
  {
    id: 'comma-home-line-ruled-in-ink',
    name: 'Line ruled in ink',
    category: 'wind',
    description:
      'A flute blown as hard as it goes, rounded by a soft drive, with two plain tape heads behind it.',
    preview: DUET,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { volume: -22.5, vibrato: 0, scoop: 0, attack: 0.05, release: 0.3, chiff: 0.4 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 0, driveDb: 10, toneDb: -3 } },
      {
        deviceId: 'tape-echo',
        params: { time: 375, feedback: 0.3, heads: 1, wow: 0, flutter: 0, mix: 0.3 },
      },
    ],
  },
  {
    id: 'comma-home-whispers-walk-backwards',
    name: 'Whispers walk backwards',
    category: 'wind',
    description:
      'Whispered pipes with their attacks sunk and their air spread, followed by the same backwards, darker.',
    preview: THERE_AND_BACK,
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { volume: -13, vibrato: 0, scoop: 0, attack: 0.2, release: 1 },
    },
    effects: [
      { deviceId: 'sift', params: { tones: 3, attacks: -18, air: 2, hold: 0.7, scatter: 1 } },
      {
        deviceId: 'reverse-delay',
        params: { time: 1050, feedback: 0.45, tone: 2500, smooth: 0.7, mix: 0.5 },
      },
    ],
  },
  {
    id: 'comma-home-hollow-field-no-wind',
    name: 'Hollow field, no wind',
    category: 'wind',
    description:
      'Hollow pipes swelling into six bowls of a C pentatonic that ring without their beat.',
    preview: DUET,
    instrument: {
      deviceId: 'flute',
      preset: 'Hollow pipes pad',
      params: { vibrato: 0, scoop: 0, attack: 0.35, release: 1.6, breath: 0.4 },
    },
    effects: [
      {
        deviceId: 'bowls',
        params: { root: 0, scale: 0, bowls: 6, ring: 7, beat: 0, strike: 0, metal: 0.3, mix: 0.45 },
      },
    ],
  },
  {
    id: 'comma-home-alto-under-one-cloud',
    name: 'Alto under one cloud',
    category: 'wind',
    description:
      'An alto flute under a filter that follows its loudness, dimmed now and then by a passing cloud.',
    preview: TOP_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { vibrato: 0, scoop: 0, attack: 0.12, release: 0.9, blow: 0.6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { type: 0, slope: 1, cutoffHz: 450, envAmount: 40, resonance: 1.4 },
      },
      { deviceId: 'weather', params: { kind: 1, exposure: 0.9, voice: 0, pace: 3 } },
      { deviceId: 'spread', params: { mid: 1.6, high: 1.8, make: 1 } },
    ],
  },
  // Clarinet: no vibrato, from a hum to an open bell.
  {
    id: 'comma-home-reed-at-rest',
    name: 'Reed at rest',
    category: 'wind',
    description:
      'A clarinet hummed at the edge of sounding, its quiet overtones lifted until they can be heard.',
    preview: DUET,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { volume: -10.5, vibrato: 0, growl: 0, attack: 0.2, release: 1 },
    },
    effects: [
      { deviceId: 'reveal', params: { amount: 0.9, detail: 0.7, range: 24, rise: 120 } },
      { deviceId: 'lift', params: { amount: 0.7, threshold: -20 } },
    ],
  },
  {
    id: 'comma-home-nothing-note-nothing',
    name: 'Nothing, note, nothing',
    category: 'wind',
    description:
      'A clarinet that takes more than half a second to come from silence and two to go back, in an eight second hall.',
    preview: CHAIN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { vibrato: 0, growl: 0, attack: 0.6, release: 2 },
    },
    effects: [
      { deviceId: 'hall-reverb', params: { lowDecay: 6, midDecay: 8, damping: 2500, mix: 0.5 } },
    ],
  },
  {
    id: 'comma-home-bass-reed-finds-the-g',
    name: 'Bass reed finds the G',
    category: 'wind',
    description:
      'A breathy bass clarinet with its fundamental turned up, through a console pushed until it thickens.',
    preview: RISE_BASS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { vibrato: 0, growl: 0, attack: 0.12, release: 0.5 },
    },
    effects: [
      { deviceId: 'analog-drive', params: { circuit: 1, drive: 0.6, lowBump: 0.6, highCut: 3500 } },
      { deviceId: 'spread', params: { mid: 1.2, high: 1.6, make: 0.6 } },
    ],
  },
  {
    id: 'comma-home-subtone-without-sway',
    name: 'Subtone without sway',
    category: 'wind',
    description:
      'A subtone reed held flat, split in twelve colours that arrive one after another from low to high.',
    preview: DUET,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { vibrato: 0, growl: 0, attack: 0.12, release: 0.5 },
    },
    effects: [
      {
        deviceId: 'prism',
        params: { time: 700, shape: 0, bands: 12, feedback: 0.35, bend: 0, drift: 0, mix: 0.45 },
      },
    ],
  },
  {
    id: 'comma-home-four-reeds-one-line',
    name: 'Four reeds, one line',
    category: 'wind',
    description:
      'A hollow clarinet with three followers 0.7 seconds apart, all of them walking each stretch backwards.',
    preview: CHAIN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { volume: -1.5, vibrato: 0, growl: 0, attack: 0.1, release: 0.4 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: { followers: 3, gap: 0.7, crab: 3, fade: 0.2, spread: 0.9, tone: 6000, mix: 0.5 },
      },
    ],
  },
  {
    id: 'comma-home-apricot-wood-unbent',
    name: 'Apricot wood, unbent',
    category: 'wind',
    description: 'A nasal reed with no sway, ringing in a stopped pipe and then on a medium plate.',
    preview: TOP_LINE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { vibrato: 0, growl: 0, attack: 0.15, release: 0.6 },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 2, size: 2.2, material: 0.6, opening: 0.4, air: 0.1, mix: 0.65 },
      },
      { deviceId: 'plate-reverb', params: { decay: 0.7, damping: 0.4, mix: 0.3 } },
    ],
  },
  {
    id: 'comma-home-bright-reed-flat-sea',
    name: 'Bright reed, flat sea',
    category: 'wind',
    description:
      'A bright straight reed on a fading shortwave link whose station does not drift, in a short room.',
    preview: TOP_LINE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { vibrato: 0, growl: 0, attack: 0.08, release: 0.4 },
    },
    effects: [
      {
        deviceId: 'radio',
        params: {
          band: 1,
          drift: 0,
          tuning: 0,
          fading: 0.5,
          static: 0.15,
          interference: 0,
          bandwidth: 0.6,
          speaker: 0.3,
        },
      },
      { deviceId: 'ether-reverb', params: { decay: 3, size: 0.5, mix: 0.25 } },
    ],
  },
  {
    id: 'comma-home-reed-behind-its-breath',
    name: 'Reed behind its breath',
    category: 'wind',
    description:
      'Breath and almost no reed, its bands flickering outward from the middle, in a five second tank.',
    preview: DUET,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { vibrato: 0, growl: 0, attack: 0.3, release: 1.5 },
    },
    effects: [
      { deviceId: 'glimmer', params: { depth: 1, rate: 1.4, grain: 0.5, pattern: 3, apart: 1 } },
      {
        deviceId: 'fdn-reverb',
        params: { decay: 5, damping: 0.1, breathDepth: 0, size: 1.3, mix: 0.4 },
      },
    ],
  },
  {
    id: 'comma-home-open-bell-closed-door',
    name: 'Open bell, closed door',
    category: 'wind',
    description:
      'A hard open clarinet pulsed only in its middle band, the sides in turn, with a reverb that falls in a line.',
    preview: THERE_AND_BACK,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: { volume: 5, vibrato: 0, growl: 0, attack: 0.05, release: 0.3 },
    },
    effects: [
      {
        deviceId: 'band-pulse',
        params: { rate: 5, depth: 0.8, low: 250, high: 1600, edge: 30, offset: 180 },
      },
      { deviceId: 'shaped-reverb', params: { shape: 3, time: 1.2, modulation: 0, mix: 0.35 } },
    ],
  },
  {
    id: 'comma-home-tide-mark-in-wood',
    name: 'Tide mark in wood',
    category: 'wind',
    description:
      'A broad tenor reed swelling over most of a second, circling slowly round the head in a small dark space.',
    preview: CHAIN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Tenor swell',
      params: { volume: 3.5, vibrato: 0, growl: 0, attack: 0.8, release: 2.5 },
    },
    effects: [
      { deviceId: 'around', params: { path: 0, rate: 0.14, radius: 1, head: 0.9 } },
      {
        deviceId: 'expanse',
        params: { modDepth: 0, size: 0.4, decay: 4, highCut: 4000, mix: 0.3 },
      },
    ],
  },
  {
    id: 'comma-home-five-seconds-of-going',
    name: 'Five seconds of going',
    category: 'wind',
    description:
      'Clarinet notes that start cleanly and take five seconds to leave, each blurred into the next.',
    preview: CHAIN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Slow fade reed',
      params: { vibrato: 0, growl: 0, attack: 0.05, release: 5 },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        params: { blur: 0.55, smear: 0.5, shimmer: 0, highCut: 5000, mix: 0.6 },
      },
    ],
  },
  // Dusk: one exact oscillator a key, its chorus always off.
  {
    id: 'comma-home-one-oscillator-each',
    name: 'One oscillator each',
    category: 'pad',
    description:
      'A single saw per note with a little locked sub, the chorus off and the filter soft, in a plain four second room.',
    preview: SHADOW_PAIR,
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { chorus: 0, wave: 0, attack: 0.3, release: 1.5, cutoff: 1400, envelope: 0.1 },
    },
    effects: [
      { deviceId: 'ether-reverb', params: { decay: 4, damping: 0.5, size: 0.6, mix: 0.35 } },
    ],
  },
  {
    id: 'comma-home-sub-on-the-sea-bed',
    name: 'Sub on the sea bed',
    category: 'bass',
    description:
      'A square with its locked sub, short and dark, pushed through a transformer and held by a limiter.',
    preview: BASS_LINE,
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { chorus: 0, attack: 0.02, release: 0.25, cutoff: 600 },
    },
    effects: [
      { deviceId: 'analog-drive', params: { circuit: 2, drive: 0.5, tone: 0.2 } },
      { deviceId: 'fet-limiter', params: { inputGain: 4, outputGain: -3 } },
    ],
  },
  {
    id: 'comma-home-bloom-with-no-chorus',
    name: 'Bloom with no chorus',
    category: 'pad',
    description:
      'Saw and square opening from a nearly closed filter, the tones two chords share favoured, spread wide.',
    preview: ONE_LAP,
    instrument: {
      deviceId: 'dusk',
      preset: 'Slow bloom',
      params: { chorus: 0, attack: 0.7, release: 1.8, cutoff: 350, envelope: 0.7 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        params: { ago: 1200, strict: 0.5, ring: 0.6, floor: -14, mix: 0.8 },
      },
      { deviceId: 'spread', params: { mid: 1.5, high: 1.9, make: 1 } },
    ],
  },
  {
    id: 'comma-home-square-lamp-round-room',
    name: 'Square lamp, round room',
    category: 'organ',
    description:
      'A square organ tone with its sub and no chorus, its lows and highs swelling in turn twice a second.',
    preview: THERE_AND_BACK,
    instrument: {
      deviceId: 'dusk',
      preset: 'Shimmer organ',
      params: { chorus: 0, attack: 0.02, release: 0.5 },
    },
    effects: [
      { deviceId: 'tremolo', params: { mode: 2, rate: 2.2, depth: 0.7, drift: 0, phase: 90 } },
      { deviceId: 'plate-reverb', params: { decay: 0.65, damping: 0.3, mix: 0.3 } },
    ],
  },
  {
    id: 'comma-home-dimming-by-two-laps',
    name: 'Dimming by two laps',
    category: 'pad',
    description:
      'Bright square and saw that close as they are held, with a slow phaser set low and wide.',
    preview: TWO_LAPS,
    instrument: {
      deviceId: 'dusk',
      preset: 'Dimming strings',
      params: { chorus: 0, wave: 2, attack: 0.3, release: 1.6, cutoff: 4500, envelope: -0.5 },
    },
    effects: [
      {
        deviceId: 'phaser',
        params: {
          stages: 3,
          centerHz: 500,
          feedback: 20,
          rate: 0.12,
          depth: 70,
          stereo: 140,
          mix: 0.5,
        },
      },
      { deviceId: 'hall-reverb', params: { lowDecay: 2.5, midDecay: 3, damping: 6000, mix: 0.3 } },
    ],
  },
  {
    id: 'comma-home-stopped-pipe-no-lid',
    name: 'Stopped pipe, no lid',
    category: 'organ',
    description:
      'A square coloured like a stopped pipe by its own filter, answered by twelve echoes in clusters.',
    preview: DUET,
    instrument: {
      deviceId: 'dusk',
      preset: 'Stopped pipe',
      params: { chorus: 0, attack: 0.04, release: 0.6 },
    },
    effects: [
      {
        deviceId: 'constellation',
        params: { span: 2100, stars: 12, pattern: 1, drift: 0, again: 0.3, mix: 0.5 },
      },
    ],
  },
  {
    id: 'comma-home-pulse-held-like-breath',
    name: 'Pulse held like breath',
    category: 'pad',
    description:
      'A thin square voice with its lows cut, breathing in and out every four seconds, in a six second tank.',
    preview: PEDAL_STAYS,
    instrument: {
      deviceId: 'dusk',
      preset: 'Thin voices',
      params: { chorus: 0, wave: 1, lowCut: 2, attack: 0.6, release: 2, resonance: 0.4 },
    },
    effects: [
      {
        deviceId: 'breath',
        params: { in: 1.6, hold: 0.3, out: 1.8, rest: 0.3, depth: 0.85, colour: 0.8, vary: 0 },
      },
      { deviceId: 'fdn-reverb', params: { decay: 6, damping: 0.3, breathDepth: 0, mix: 0.35 } },
    ],
  },
  {
    id: 'comma-home-round-sine-level-line',
    name: 'Round sine, level line',
    category: 'keys',
    description:
      'A saw filtered to nearly a sine, quick to speak, with late pipes at the octave and the twelfth and tape repeats.',
    preview: CHAIN,
    instrument: {
      deviceId: 'dusk',
      preset: 'Round sine',
      params: { chorus: 0, attack: 0.02, release: 0.9 },
    },
    effects: [
      {
        deviceId: 'stops',
        params: {
          sub: 0,
          unison: 0.7,
          octave: 0.5,
          twelfth: 0.5,
          fifteenth: 0,
          detune: 0,
          speak: 400,
          chiff: 0,
          mix: 0.7,
        },
      },
      {
        deviceId: 'tape-echo',
        params: { time: 350, feedback: 0.35, wow: 0, flutter: 0, highCut: 6000, mix: 0.25 },
      },
    ],
  },
  // Chamber strings: no vibrato and no scatter between the players.
  {
    id: 'comma-home-four-bows-one-pitch',
    name: 'Four bows, one pitch',
    category: 'string',
    description:
      'Four players with no vibrato and no spread of pitch, on a medium bow, in a warm hall of three seconds.',
    preview: ONE_LAP,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: { volume: -4.5, vibrato: 0, scatter: 0, attack: 0.25, release: 0.9 },
    },
    effects: [
      {
        deviceId: 'hall-reverb',
        params: { lowDecay: 3.5, midDecay: 2.8, damping: 4500, mix: 0.35 },
      },
    ],
  },
  {
    id: 'comma-home-mutes-on-the-way-down',
    name: 'Mutes on the way down',
    category: 'string',
    description:
      'Five muted players swelling slowly, kept low and dull by a wide tone control, in a still reverb sung as oh.',
    preview: COMMA_BARE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { vibrato: 0, scatter: 0, attack: 0.9, release: 2.2 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { low: 3, presence: -5, highCut: 3000 } },
      {
        deviceId: 'vowel-reverb',
        params: { vowel: 3, motion: 0, modulation: 0, decay: 7, mix: 0.45 },
      },
    ],
  },
  {
    id: 'comma-home-bow-hair-only',
    name: 'Bow hair only',
    category: 'string',
    description:
      'Bow noise more than string, its tones turned down and its air spread, with ten echoes that slowly quicken.',
    preview: DUET,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { volume: 1, vibrato: 0, scatter: 0, attack: 0.4, release: 1.2 },
    },
    effects: [
      { deviceId: 'sift', params: { tones: -6, attacks: -6, air: 6, hold: 0.1, scatter: 1 } },
      {
        deviceId: 'skipping-stone',
        params: { first: 600, bounce: 0.9, skips: 10, loss: 1.5, sink: 0.1, drop: 0, mix: 0.45 },
      },
    ],
  },
  {
    id: 'comma-home-halo-at-concert-pitch',
    name: 'Halo at concert pitch',
    category: 'string',
    description: 'Three still bows with sines an octave up that gather behind them over a second.',
    preview: ONE_LAP,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { vibrato: 0, scatter: 0, attack: 0.5, release: 1.4 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: { partials: 14, transpose: 12, attack: 900, release: 4, spread: 0.9, mix: 0.5 },
      },
    ],
  },
  {
    id: 'comma-home-glass-bridge-no-wind',
    name: 'Glass bridge, no wind',
    category: 'string',
    description:
      'Three players hard at the bridge, thin and straight, sounding in a small hard tube in a large bright room.',
    preview: SHADOW_PAIR,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { volume: -4.5, vibrato: 0, scatter: 0, attack: 0.3, release: 1 },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 1, size: 0.5, material: 1, opening: 0.8, air: 0, mix: 0.6 },
      },
      { deviceId: 'ether-reverb', params: { decay: 8, damping: 0.1, size: 0.9, mix: 0.35 } },
    ],
  },
  {
    id: 'comma-home-viols-in-a-tiled-room',
    name: 'Viols in a tiled room',
    category: 'string',
    description:
      'A still consort with a quick bow, pulsed gently on two patterns that drift apart, in a short gated reverb.',
    preview: RISE_AND_RETURN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { vibrato: 0, scatter: 0, attack: 0.15, release: 0.4 },
    },
    effects: [
      {
        deviceId: 'pulses',
        params: { rate: 1.4, steps: 7, fill: 4, floor: 0.35, edge: 0.6, apart: 0.8 },
      },
      {
        deviceId: 'shaped-reverb',
        params: { shape: 0, time: 0.6, modulation: 0, colour: 0.4, mix: 0.4 },
      },
    ],
  },
  {
    id: 'comma-home-lone-bow-long-floor',
    name: 'Lone bow, long floor',
    category: 'string',
    description:
      'One player drawing straight notes, doubled an octave down, with a dark cloud of it all at a quarter of the speed.',
    preview: CHAIN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wandering solo',
      params: { volume: -4.5, vibrato: 0, scatter: 0, attack: 0.25, release: 1.5 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0.7, up1: 0 } },
      { deviceId: 'stretch', params: { stretch: 4, window: 2, tone: -0.3, mix: 0.45 } },
    ],
  },
  // Thesis: it snaps every note to a white key, so it is the equal shadow of the rest.
  {
    id: 'comma-home-equal-shadow',
    name: 'Equal shadow',
    category: 'texture',
    description:
      'Noise tuned to the nearest white key with its octave flip, so it stays while others sink, brightened, in a hall.',
    preview: EQUAL,
    instrument: {
      deviceId: 'thesis',
      preset: 'Thesis Default',
      params: { mode: 0, attack: 0.15, release: 1.2, mirrorEnabled: 0, resonance: 60 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { low: -3, presence: 3, air: 5 } },
      { deviceId: 'hall-reverb', params: { lowDecay: 3, midDecay: 3.5, mix: 0.35 } },
    ],
  },
  {
    id: 'comma-home-keys-that-cannot-sink',
    name: 'Keys that cannot sink',
    category: 'texture',
    description:
      'Very narrow bands on fixed pitches with no reflections, shaped as an open vowel, then levelled.',
    preview: TWO_LAPS,
    instrument: {
      deviceId: 'thesis',
      preset: 'Chromatic whistle',
      params: { scale: 0, resonance: 95, attack: 0.2, release: 1, width: 40 },
    },
    effects: [
      { deviceId: 'imprint', params: { shape: 1, amount: 1.3, replace: 0.5 } },
      { deviceId: 'ambient-comp', params: { threshold: -34, ratio: 3, makeup: 8 } },
    ],
  },
  {
    id: 'comma-home-mirror-on-the-landing',
    name: 'Mirror on the landing',
    category: 'texture',
    description:
      'Each note and its reflection about D in broad wide bands, dulled by a tape stage, with a five second spring.',
    preview: DUET,
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: { mode: 0, attack: 0.4, release: 2, width: 100, resonance: 25 },
    },
    effects: [
      { deviceId: 'analog-drive', params: { circuit: 0, drive: 0.4, highCut: 2200, output: -6 } },
      {
        deviceId: 'spring-reverb',
        params: { decay: 5, springs: 2, tone: 2500, drip: 0.1, drive: 0, mix: 0.4 },
      },
    ],
  },
  {
    id: 'comma-home-fixed-stars',
    name: 'Fixed stars',
    category: 'texture',
    description:
      'A note with its four reflections and the centre D, strummed quickly as narrow bands, with sparks an octave up.',
    preview: EQUAL,
    instrument: {
      deviceId: 'thesis',
      preset: 'Fixed Full Stack',
      params: { attack: 0.03, release: 1, strum: 45, resonance: 85 },
    },
    effects: [
      { deviceId: 'glints', params: { density: 8, pitch: 0, scatter: 500, mix: 0.4 } },
      { deviceId: 'spread', params: { mid: 1.3, high: 1.9, output: 0 } },
    ],
  },
  {
    id: 'comma-home-white-keys-as-weather',
    name: 'White keys as weather',
    category: 'texture',
    description:
      'Broad noise bands breathing slowly on the white keys, with surf washing over them.',
    preview: RISING,
    instrument: {
      deviceId: 'thesis',
      preset: 'Mixolydian glow',
      params: {
        scale: 0,
        root: 0,
        attack: 0.6,
        release: 2.5,
        breatheRate: 0.4,
        resonance: 14,
        centerEnabled: 0,
      },
    },
    effects: [
      { deviceId: 'weather', params: { kind: 3, exposure: 0.7, voice: 0.2, pace: 2 } },
      { deviceId: 'ambient-comp', params: { threshold: -36, ratio: 2.5, makeup: 6 } },
    ],
  },
  {
    id: 'comma-home-centre-that-stays',
    name: 'Centre that stays',
    category: 'drone',
    description:
      'Each note with its octave flip and one D under all of them, through a slow band-pass, in a twelve second space.',
    preview: ONE_LAP,
    instrument: {
      deviceId: 'thesis',
      preset: 'Thesis Default',
      params: {
        mode: 1,
        breatheRate: 0.15,
        mirrorEnabled: 0,
        octaflipEnabled: 1,
        centerEnabled: 1,
        center: 50,
        attack: 0.5,
        release: 2.2,
        resonance: 45,
        width: 20,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { type: 2, cutoffHz: 350, resonance: 1.2, lfoAmount: 30, lfoRateHz: 0.1 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 10, outputGain: -3 } },
      { deviceId: 'expanse', params: { modDepth: 0, size: 0.9, decay: 12, mix: 0.4 } },
    ],
  },
  // Rewind: the note itself walked backwards, without wobble.
  {
    id: 'comma-home-retraced-at-the-piano',
    name: 'Retraced at the piano',
    category: 'keys',
    description:
      'A piano swelling backwards onto each strike, steady in pitch, then ringing on in a plain room.',
    preview: CHAIN,
    instrument: {
      deviceId: 'rewind',
      preset: 'Turned piano',
      params: { volume: -1.5, wobble: 0, shimmer: 0, swell: 0.6, tail: 0.6, ghost: 0.1 },
    },
    effects: [
      { deviceId: 'ether-reverb', params: { decay: 4, size: 0.6, damping: 0.4, mix: 0.3 } },
    ],
  },
  {
    id: 'comma-home-bell-before-its-stroke',
    name: 'Bell before its stroke',
    category: 'bell',
    description:
      'A bell heard from its tail to its strike with no beating, glinting band by band, with a backwards echo.',
    preview: DUET,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bell arrival',
      params: { volume: 2.5, wobble: 0, shimmer: 0, swell: 0.7, tail: 0.9, snap: 0.2 },
    },
    effects: [
      { deviceId: 'glimmer', params: { depth: 0.8, rate: 2, lean: 0.8 } },
      { deviceId: 'reverse-delay', params: { time: 750, feedback: 0.2, mix: 0.35 } },
    ],
  },
  {
    id: 'comma-home-bowl-gathers-homeward',
    name: 'Bowl gathers homeward',
    category: 'bell',
    description:
      'A bowl gathering over a second and left to ring in full, on a low table of five bowls tuned in still fifths.',
    preview: COMMA_BARE,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: { volume: 3.5, wobble: 0, shimmer: 0, swell: 1, ghost: 0.4, snap: 0.1 },
    },
    effects: [
      {
        deviceId: 'bowls',
        params: {
          root: 0,
          scale: 4,
          bowls: 5,
          ring: 14,
          beat: 0,
          strike: 0,
          register: 0.25,
          mix: 0.4,
        },
      },
    ],
  },
  // Feedback: strings held in the air at one pitch, without wander.
  {
    id: 'comma-home-twelfth-that-holds',
    name: 'Twelfth that holds',
    category: 'string',
    description:
      'A plucked string caught by its amplifier and held on its twelfth, unwavering, with a long dark plate.',
    preview: CHAIN,
    instrument: {
      deviceId: 'feedback',
      preset: 'Pure twelfth',
      params: { volume: -3, wander: 0, bloom: 0.35, release: 1 },
    },
    effects: [{ deviceId: 'plate-reverb', params: { decay: 0.85, damping: 0.8, mix: 0.4 } }],
  },
  {
    id: 'comma-home-wire-at-zero-cents',
    name: 'Wire at zero cents',
    category: 'string',
    description:
      'A string with no pick, caught on its fifth partial, its ringing tones eased, between two unequal loops.',
    preview: TOP_LINE,
    instrument: {
      deviceId: 'feedback',
      preset: 'Glass bow',
      params: { wander: 0, bloom: 0.4, release: 1.5, distance: 5 },
    },
    effects: [
      { deviceId: 'tamer', params: { depth: 0.6 } },
      {
        deviceId: 'orbits',
        params: { loops: 2, length: 1.5, offset: 0.4, feedback: 0.6, drift: 0, mix: 0.35 },
      },
    ],
  },
  {
    id: 'comma-home-low-string-level-hum',
    name: 'Low string, level hum',
    category: 'string',
    description:
      'A dark string on its own fundamental with no pick, its hum warmed by a tube and kept in the middle.',
    preview: RISE_BASS,
    instrument: {
      deviceId: 'feedback',
      preset: 'Out of the hum',
      params: { volume: -16.5, wander: 0, bloom: 0.25, release: 0.8, damp: 0.8, grit: 0.1 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 2, driveDb: 8 } },
      { deviceId: 'spread', params: { mid: 0.6, high: 1.2, make: 0.3 } },
      { deviceId: 'hall-reverb', params: { lowDecay: 2, midDecay: 1.5, mix: 0.2 } },
    ],
  },
]
