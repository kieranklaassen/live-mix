import { type FactoryPreset, type Phrase } from '../types'

// Two players on one fast line, each with every other note. Laid out in pairs, a leading voice and then a
// following one that is duller, shorter or further off, on seven instruments of wood, steel, string, bell and ice.
//
// The scale is E F G B C, the tempo 84: a sixteenth is 0.179 s, an eighth 0.357 s. Seven of the phrases stand in pelog on
// E (E 0, F 120, G 258, B 675, C 785 cents); the rest, for chords and for effects tuned to keys, stay on the keys.
// Polos is the part that leads, sangsih the part that fills its gaps.

// In pelog. Nyog cag, strict taking of turns: polos E G G F, G C C B, E G G F, F E E F on the eighths, sangsih one step above
// in the gaps, over a low E that begins and ends the eight beats.
const TWO_CELLS: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.6, note: 52, gain: 0.4 },
    { atSec: 0, durSec: 0.339, note: 64, gain: 0.68 },
    { atSec: 0.179, durSec: 0.339, note: 65.2, gain: 0.52 },
    { atSec: 0.357, durSec: 0.339, note: 66.58, gain: 0.62 },
    { atSec: 0.536, durSec: 0.339, note: 70.75, gain: 0.52 },
    { atSec: 0.714, durSec: 0.339, note: 66.58, gain: 0.62 },
    { atSec: 0.893, durSec: 0.339, note: 70.75, gain: 0.52 },
    { atSec: 1.071, durSec: 0.339, note: 65.2, gain: 0.62 },
    { atSec: 1.25, durSec: 0.339, note: 66.58, gain: 0.52 },
    { atSec: 1.429, durSec: 0.339, note: 66.58, gain: 0.68 },
    { atSec: 1.607, durSec: 0.339, note: 70.75, gain: 0.52 },
    { atSec: 1.786, durSec: 0.339, note: 71.85, gain: 0.62 },
    { atSec: 1.964, durSec: 0.339, note: 76, gain: 0.52 },
    { atSec: 2.143, durSec: 0.339, note: 71.85, gain: 0.62 },
    { atSec: 2.321, durSec: 0.339, note: 76, gain: 0.52 },
    { atSec: 2.5, durSec: 0.339, note: 70.75, gain: 0.62 },
    { atSec: 2.679, durSec: 0.339, note: 71.85, gain: 0.52 },
    { atSec: 2.857, durSec: 0.339, note: 64, gain: 0.68 },
    { atSec: 3.036, durSec: 0.339, note: 65.2, gain: 0.52 },
    { atSec: 3.214, durSec: 0.339, note: 66.58, gain: 0.62 },
    { atSec: 3.393, durSec: 0.339, note: 70.75, gain: 0.52 },
    { atSec: 3.571, durSec: 0.339, note: 66.58, gain: 0.62 },
    { atSec: 3.75, durSec: 0.339, note: 70.75, gain: 0.52 },
    { atSec: 3.929, durSec: 0.339, note: 65.2, gain: 0.62 },
    { atSec: 4.107, durSec: 0.339, note: 66.58, gain: 0.52 },
    { atSec: 4.286, durSec: 0.339, note: 65.2, gain: 0.68 },
    { atSec: 4.464, durSec: 0.339, note: 66.58, gain: 0.52 },
    { atSec: 4.643, durSec: 0.339, note: 64, gain: 0.62 },
    { atSec: 4.821, durSec: 0.339, note: 65.2, gain: 0.52 },
    { atSec: 5, durSec: 0.339, note: 64, gain: 0.62 },
    { atSec: 5.179, durSec: 0.339, note: 65.2, gain: 0.52 },
    { atSec: 5.357, durSec: 0.339, note: 65.2, gain: 0.62 },
    { atSec: 5.536, durSec: 0.339, note: 66.58, gain: 0.52 },
    { atSec: 5.714, durSec: 1.6, note: 52, gain: 0.45 },
    { atSec: 5.714, durSec: 1.6, note: 64, gain: 0.6 },
  ],
}

// In pelog. The tune 1 3 2 5 4 3 2 1 an octave higher, then rising 1 2 3 4 5 2 3 1, each tone answered by the step above it;
// the two meet on the closing E and the B over it.
const TURN_ABOUT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.339, note: 76, gain: 0.68 },
    { atSec: 0.179, durSec: 0.339, note: 77.2, gain: 0.52 },
    { atSec: 0.357, durSec: 0.339, note: 78.58, gain: 0.62 },
    { atSec: 0.536, durSec: 0.339, note: 82.75, gain: 0.52 },
    { atSec: 0.714, durSec: 0.339, note: 77.2, gain: 0.62 },
    { atSec: 0.893, durSec: 0.339, note: 78.58, gain: 0.52 },
    { atSec: 1.071, durSec: 0.339, note: 83.85, gain: 0.62 },
    { atSec: 1.25, durSec: 0.339, note: 88, gain: 0.52 },
    { atSec: 1.429, durSec: 0.339, note: 82.75, gain: 0.68 },
    { atSec: 1.607, durSec: 0.339, note: 83.85, gain: 0.52 },
    { atSec: 1.786, durSec: 0.339, note: 78.58, gain: 0.62 },
    { atSec: 1.964, durSec: 0.339, note: 82.75, gain: 0.52 },
    { atSec: 2.143, durSec: 0.339, note: 77.2, gain: 0.62 },
    { atSec: 2.321, durSec: 0.339, note: 78.58, gain: 0.52 },
    { atSec: 2.5, durSec: 0.339, note: 76, gain: 0.62 },
    { atSec: 2.679, durSec: 0.339, note: 77.2, gain: 0.52 },
    { atSec: 2.857, durSec: 0.339, note: 76, gain: 0.68 },
    { atSec: 3.036, durSec: 0.339, note: 77.2, gain: 0.52 },
    { atSec: 3.214, durSec: 0.339, note: 77.2, gain: 0.62 },
    { atSec: 3.393, durSec: 0.339, note: 78.58, gain: 0.52 },
    { atSec: 3.571, durSec: 0.339, note: 78.58, gain: 0.62 },
    { atSec: 3.75, durSec: 0.339, note: 82.75, gain: 0.52 },
    { atSec: 3.929, durSec: 0.339, note: 82.75, gain: 0.62 },
    { atSec: 4.107, durSec: 0.339, note: 83.85, gain: 0.52 },
    { atSec: 4.286, durSec: 0.339, note: 83.85, gain: 0.68 },
    { atSec: 4.464, durSec: 0.339, note: 88, gain: 0.52 },
    { atSec: 4.643, durSec: 0.339, note: 77.2, gain: 0.62 },
    { atSec: 4.821, durSec: 0.339, note: 78.58, gain: 0.52 },
    { atSec: 5, durSec: 0.339, note: 78.58, gain: 0.62 },
    { atSec: 5.179, durSec: 0.339, note: 82.75, gain: 0.52 },
    { atSec: 5.357, durSec: 0.339, note: 76, gain: 0.62 },
    { atSec: 5.536, durSec: 0.339, note: 77.2, gain: 0.52 },
    { atSec: 5.714, durSec: 1.6, note: 76, gain: 0.62 },
    { atSec: 5.714, durSec: 1.6, note: 82.75, gain: 0.45 },
  ],
}

// In pelog. Telu: three tones a half, E F G and then F G B. Polos has the lower two, sangsih the upper two, and both strike the
// middle one, so it is the loudest; neither hand plays more than twice before it rests.
const THREE_SHARED: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.8, note: 52, gain: 0.36 },
    { atSec: 0, durSec: 0.321, note: 64, gain: 0.56 },
    { atSec: 0.179, durSec: 0.321, note: 65.2, gain: 0.72 },
    { atSec: 0.357, durSec: 0.321, note: 66.58, gain: 0.5 },
    { atSec: 0.536, durSec: 0.321, note: 64, gain: 0.56 },
    { atSec: 0.714, durSec: 0.321, note: 65.2, gain: 0.72 },
    { atSec: 0.893, durSec: 0.321, note: 66.58, gain: 0.5 },
    { atSec: 1.071, durSec: 0.321, note: 64, gain: 0.56 },
    { atSec: 1.25, durSec: 0.321, note: 66.58, gain: 0.5 },
    { atSec: 1.429, durSec: 0.321, note: 65.2, gain: 0.72 },
    { atSec: 1.607, durSec: 0.321, note: 64, gain: 0.56 },
    { atSec: 1.786, durSec: 0.321, note: 66.58, gain: 0.5 },
    { atSec: 1.964, durSec: 0.321, note: 65.2, gain: 0.72 },
    { atSec: 2.143, durSec: 0.321, note: 64, gain: 0.56 },
    { atSec: 2.321, durSec: 0.321, note: 66.58, gain: 0.5 },
    { atSec: 2.5, durSec: 0.321, note: 64, gain: 0.56 },
    { atSec: 2.679, durSec: 0.321, note: 65.2, gain: 0.72 },
    { atSec: 2.857, durSec: 2.8, note: 52, gain: 0.3 },
    { atSec: 2.857, durSec: 0.321, note: 70.75, gain: 0.5 },
    { atSec: 3.036, durSec: 0.321, note: 65.2, gain: 0.56 },
    { atSec: 3.214, durSec: 0.321, note: 66.58, gain: 0.72 },
    { atSec: 3.393, durSec: 0.321, note: 70.75, gain: 0.5 },
    { atSec: 3.571, durSec: 0.321, note: 65.2, gain: 0.56 },
    { atSec: 3.75, durSec: 0.321, note: 66.58, gain: 0.72 },
    { atSec: 3.929, durSec: 0.321, note: 70.75, gain: 0.5 },
    { atSec: 4.107, durSec: 0.321, note: 65.2, gain: 0.56 },
    { atSec: 4.286, durSec: 0.321, note: 70.75, gain: 0.5 },
    { atSec: 4.464, durSec: 0.321, note: 66.58, gain: 0.72 },
    { atSec: 4.643, durSec: 0.321, note: 65.2, gain: 0.56 },
    { atSec: 4.821, durSec: 0.321, note: 70.75, gain: 0.5 },
    { atSec: 5, durSec: 0.321, note: 66.58, gain: 0.72 },
    { atSec: 5.179, durSec: 0.321, note: 65.2, gain: 0.56 },
    { atSec: 5.357, durSec: 0.321, note: 70.75, gain: 0.5 },
    { atSec: 5.536, durSec: 0.321, note: 66.58, gain: 0.72 },
    { atSec: 5.714, durSec: 1.6, note: 52, gain: 0.45 },
    { atSec: 5.714, durSec: 1.6, note: 64, gain: 0.6 },
  ],
}

// Empat: four tones, polos on the lower two and sangsih on the upper two. The outer pair is struck together, the fifth
// E and B, then the sixth G and E, three sixteenths apart (four where the figure turns round), across the beat.
const FOUR_IN_TWO: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.304, note: 64, gain: 0.56 },
    { atSec: 0, durSec: 0.304, note: 71, gain: 0.5 },
    { atSec: 0.179, durSec: 0.304, note: 65, gain: 0.56 },
    { atSec: 0.357, durSec: 0.304, note: 67, gain: 0.5 },
    { atSec: 0.536, durSec: 0.304, note: 64, gain: 0.56 },
    { atSec: 0.536, durSec: 0.304, note: 71, gain: 0.5 },
    { atSec: 0.714, durSec: 0.304, note: 65, gain: 0.56 },
    { atSec: 0.893, durSec: 0.304, note: 67, gain: 0.5 },
    { atSec: 1.071, durSec: 0.304, note: 64, gain: 0.56 },
    { atSec: 1.071, durSec: 0.304, note: 71, gain: 0.5 },
    { atSec: 1.25, durSec: 0.304, note: 65, gain: 0.56 },
    { atSec: 1.429, durSec: 0.304, note: 67, gain: 0.5 },
    { atSec: 1.607, durSec: 0.304, note: 65, gain: 0.56 },
    { atSec: 1.786, durSec: 0.304, note: 64, gain: 0.56 },
    { atSec: 1.786, durSec: 0.304, note: 71, gain: 0.5 },
    { atSec: 1.964, durSec: 0.304, note: 67, gain: 0.5 },
    { atSec: 2.143, durSec: 0.304, note: 65, gain: 0.56 },
    { atSec: 2.321, durSec: 0.304, note: 64, gain: 0.56 },
    { atSec: 2.321, durSec: 0.304, note: 71, gain: 0.5 },
    { atSec: 2.5, durSec: 0.304, note: 67, gain: 0.5 },
    { atSec: 2.679, durSec: 0.304, note: 65, gain: 0.56 },
    { atSec: 2.857, durSec: 0.304, note: 72, gain: 0.5 },
    { atSec: 3.036, durSec: 0.304, note: 67, gain: 0.56 },
    { atSec: 3.036, durSec: 0.304, note: 76, gain: 0.5 },
    { atSec: 3.214, durSec: 0.304, note: 71, gain: 0.56 },
    { atSec: 3.393, durSec: 0.304, note: 72, gain: 0.5 },
    { atSec: 3.571, durSec: 0.304, note: 67, gain: 0.56 },
    { atSec: 3.571, durSec: 0.304, note: 76, gain: 0.5 },
    { atSec: 3.75, durSec: 0.304, note: 71, gain: 0.56 },
    { atSec: 3.929, durSec: 0.304, note: 72, gain: 0.5 },
    { atSec: 4.107, durSec: 0.304, note: 67, gain: 0.56 },
    { atSec: 4.107, durSec: 0.304, note: 76, gain: 0.5 },
    { atSec: 4.286, durSec: 0.304, note: 71, gain: 0.56 },
    { atSec: 4.464, durSec: 0.304, note: 72, gain: 0.5 },
    { atSec: 4.643, durSec: 0.304, note: 71, gain: 0.56 },
    { atSec: 4.821, durSec: 0.304, note: 67, gain: 0.56 },
    { atSec: 4.821, durSec: 0.304, note: 76, gain: 0.5 },
    { atSec: 5, durSec: 0.304, note: 72, gain: 0.5 },
    { atSec: 5.179, durSec: 0.304, note: 71, gain: 0.56 },
    { atSec: 5.357, durSec: 0.304, note: 67, gain: 0.56 },
    { atSec: 5.357, durSec: 0.304, note: 76, gain: 0.5 },
    { atSec: 5.536, durSec: 0.304, note: 72, gain: 0.5 },
    { atSec: 5.714, durSec: 1.6, note: 64, gain: 0.6 },
    { atSec: 5.714, durSec: 1.6, note: 71, gain: 0.5 },
  ],
}

// In pelog. The core tones E G F E, two beats each, sound once below; above, polos repeats the core tone and sangsih its upper
// neighbour, and the last quarter of each group already turns on the core tone to come.
const CORE_AND_NEIGHBOUR: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.339, note: 64, gain: 0.6 },
    { atSec: 0, durSec: 0.321, note: 76, gain: 0.56 },
    { atSec: 0.179, durSec: 0.321, note: 77.2, gain: 0.46 },
    { atSec: 0.357, durSec: 0.321, note: 76, gain: 0.56 },
    { atSec: 0.536, durSec: 0.321, note: 77.2, gain: 0.46 },
    { atSec: 0.714, durSec: 0.321, note: 76, gain: 0.56 },
    { atSec: 0.893, durSec: 0.321, note: 77.2, gain: 0.46 },
    { atSec: 1.071, durSec: 0.321, note: 78.58, gain: 0.56 },
    { atSec: 1.25, durSec: 0.321, note: 82.75, gain: 0.46 },
    { atSec: 1.429, durSec: 1.339, note: 66.58, gain: 0.6 },
    { atSec: 1.429, durSec: 0.321, note: 78.58, gain: 0.56 },
    { atSec: 1.607, durSec: 0.321, note: 82.75, gain: 0.46 },
    { atSec: 1.786, durSec: 0.321, note: 78.58, gain: 0.56 },
    { atSec: 1.964, durSec: 0.321, note: 82.75, gain: 0.46 },
    { atSec: 2.143, durSec: 0.321, note: 78.58, gain: 0.56 },
    { atSec: 2.321, durSec: 0.321, note: 82.75, gain: 0.46 },
    { atSec: 2.5, durSec: 0.321, note: 77.2, gain: 0.56 },
    { atSec: 2.679, durSec: 0.321, note: 78.58, gain: 0.46 },
    { atSec: 2.857, durSec: 1.339, note: 65.2, gain: 0.6 },
    { atSec: 2.857, durSec: 0.321, note: 77.2, gain: 0.56 },
    { atSec: 3.036, durSec: 0.321, note: 78.58, gain: 0.46 },
    { atSec: 3.214, durSec: 0.321, note: 77.2, gain: 0.56 },
    { atSec: 3.393, durSec: 0.321, note: 78.58, gain: 0.46 },
    { atSec: 3.571, durSec: 0.321, note: 77.2, gain: 0.56 },
    { atSec: 3.75, durSec: 0.321, note: 78.58, gain: 0.46 },
    { atSec: 3.929, durSec: 0.321, note: 76, gain: 0.56 },
    { atSec: 4.107, durSec: 0.321, note: 77.2, gain: 0.46 },
    { atSec: 4.286, durSec: 1.339, note: 64, gain: 0.6 },
    { atSec: 4.286, durSec: 0.321, note: 76, gain: 0.56 },
    { atSec: 4.464, durSec: 0.321, note: 77.2, gain: 0.46 },
    { atSec: 4.643, durSec: 0.321, note: 76, gain: 0.56 },
    { atSec: 4.821, durSec: 0.321, note: 77.2, gain: 0.46 },
    { atSec: 5, durSec: 0.321, note: 76, gain: 0.56 },
    { atSec: 5.179, durSec: 0.321, note: 77.2, gain: 0.46 },
    { atSec: 5.357, durSec: 0.321, note: 76, gain: 0.56 },
    { atSec: 5.536, durSec: 0.321, note: 77.2, gain: 0.46 },
    { atSec: 5.714, durSec: 1.6, note: 64, gain: 0.6 },
    { atSec: 5.714, durSec: 1.6, note: 76, gain: 0.56 },
  ],
}

// Polos alone for two beats, E . G F . G . . ; sangsih alone for two, . F . . B . C B ; then both twice, and the
// tune E F G F B G C B is there. One E ends it.
const APART_THEN_TOGETHER: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.393, note: 64, gain: 0.64 },
    { atSec: 0.357, durSec: 0.393, note: 67, gain: 0.64 },
    { atSec: 0.536, durSec: 0.393, note: 65, gain: 0.64 },
    { atSec: 0.893, durSec: 0.393, note: 67, gain: 0.64 },
    { atSec: 1.607, durSec: 0.393, note: 65, gain: 0.52 },
    { atSec: 2.143, durSec: 0.393, note: 71, gain: 0.52 },
    { atSec: 2.5, durSec: 0.393, note: 72, gain: 0.52 },
    { atSec: 2.679, durSec: 0.393, note: 71, gain: 0.52 },
    { atSec: 2.857, durSec: 2.8, note: 52, gain: 0.36 },
    { atSec: 2.857, durSec: 0.393, note: 64, gain: 0.64 },
    { atSec: 3.036, durSec: 0.393, note: 65, gain: 0.52 },
    { atSec: 3.214, durSec: 0.393, note: 67, gain: 0.64 },
    { atSec: 3.393, durSec: 0.393, note: 65, gain: 0.64 },
    { atSec: 3.571, durSec: 0.393, note: 71, gain: 0.52 },
    { atSec: 3.75, durSec: 0.393, note: 67, gain: 0.64 },
    { atSec: 3.929, durSec: 0.393, note: 72, gain: 0.52 },
    { atSec: 4.107, durSec: 0.393, note: 71, gain: 0.52 },
    { atSec: 4.286, durSec: 0.393, note: 64, gain: 0.64 },
    { atSec: 4.464, durSec: 0.393, note: 65, gain: 0.52 },
    { atSec: 4.643, durSec: 0.393, note: 67, gain: 0.64 },
    { atSec: 4.821, durSec: 0.393, note: 65, gain: 0.64 },
    { atSec: 5, durSec: 0.393, note: 71, gain: 0.52 },
    { atSec: 5.179, durSec: 0.393, note: 67, gain: 0.64 },
    { atSec: 5.357, durSec: 0.393, note: 72, gain: 0.52 },
    { atSec: 5.536, durSec: 0.393, note: 71, gain: 0.52 },
    { atSec: 5.714, durSec: 1.6, note: 64, gain: 0.64 },
  ],
}

// The first two cells at half speed and an octave lower, E F G B G B F G and G B C E C E B C, with room to hear which
// of the two players has the note. The fifth E and B ends it.
const HALF_SPEED: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.679, note: 52, gain: 0.7 },
    { atSec: 0.357, durSec: 0.679, note: 53, gain: 0.5 },
    { atSec: 0.714, durSec: 0.679, note: 55, gain: 0.64 },
    { atSec: 1.071, durSec: 0.679, note: 59, gain: 0.5 },
    { atSec: 1.429, durSec: 0.679, note: 55, gain: 0.64 },
    { atSec: 1.786, durSec: 0.679, note: 59, gain: 0.5 },
    { atSec: 2.143, durSec: 0.679, note: 53, gain: 0.64 },
    { atSec: 2.5, durSec: 0.679, note: 55, gain: 0.5 },
    { atSec: 2.857, durSec: 0.679, note: 55, gain: 0.7 },
    { atSec: 3.214, durSec: 0.679, note: 59, gain: 0.5 },
    { atSec: 3.571, durSec: 0.679, note: 60, gain: 0.64 },
    { atSec: 3.929, durSec: 0.679, note: 64, gain: 0.5 },
    { atSec: 4.286, durSec: 0.679, note: 60, gain: 0.64 },
    { atSec: 4.643, durSec: 0.679, note: 64, gain: 0.5 },
    { atSec: 5, durSec: 0.679, note: 59, gain: 0.64 },
    { atSec: 5.357, durSec: 0.679, note: 60, gain: 0.5 },
    { atSec: 5.714, durSec: 1.6, note: 52, gain: 0.6 },
    { atSec: 5.714, durSec: 1.6, note: 59, gain: 0.5 },
  ],
}

// In pelog. Three speeds at once: a low E for the whole eight beats, a core line E C B G in half notes, and over it the pair in
// sixteenths, one cell moved down a step with every core tone.
const THREE_LAYERS: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.6, note: 40, gain: 0.44 },
    { atSec: 0, durSec: 1.357, note: 64, gain: 0.58 },
    { atSec: 0, durSec: 0.321, note: 76, gain: 0.5 },
    { atSec: 0.179, durSec: 0.321, note: 77.2, gain: 0.42 },
    { atSec: 0.357, durSec: 0.321, note: 78.58, gain: 0.5 },
    { atSec: 0.536, durSec: 0.321, note: 82.75, gain: 0.42 },
    { atSec: 0.714, durSec: 0.321, note: 78.58, gain: 0.5 },
    { atSec: 0.893, durSec: 0.321, note: 82.75, gain: 0.42 },
    { atSec: 1.071, durSec: 0.321, note: 77.2, gain: 0.5 },
    { atSec: 1.25, durSec: 0.321, note: 78.58, gain: 0.42 },
    { atSec: 1.429, durSec: 1.357, note: 59.85, gain: 0.58 },
    { atSec: 1.429, durSec: 0.321, note: 71.85, gain: 0.5 },
    { atSec: 1.607, durSec: 0.321, note: 76, gain: 0.42 },
    { atSec: 1.786, durSec: 0.321, note: 77.2, gain: 0.5 },
    { atSec: 1.964, durSec: 0.321, note: 78.58, gain: 0.42 },
    { atSec: 2.143, durSec: 0.321, note: 77.2, gain: 0.5 },
    { atSec: 2.321, durSec: 0.321, note: 78.58, gain: 0.42 },
    { atSec: 2.5, durSec: 0.321, note: 76, gain: 0.5 },
    { atSec: 2.679, durSec: 0.321, note: 77.2, gain: 0.42 },
    { atSec: 2.857, durSec: 1.357, note: 58.75, gain: 0.58 },
    { atSec: 2.857, durSec: 0.321, note: 70.75, gain: 0.5 },
    { atSec: 3.036, durSec: 0.321, note: 71.85, gain: 0.42 },
    { atSec: 3.214, durSec: 0.321, note: 76, gain: 0.5 },
    { atSec: 3.393, durSec: 0.321, note: 77.2, gain: 0.42 },
    { atSec: 3.571, durSec: 0.321, note: 76, gain: 0.5 },
    { atSec: 3.75, durSec: 0.321, note: 77.2, gain: 0.42 },
    { atSec: 3.929, durSec: 0.321, note: 71.85, gain: 0.5 },
    { atSec: 4.107, durSec: 0.321, note: 76, gain: 0.42 },
    { atSec: 4.286, durSec: 1.357, note: 54.58, gain: 0.58 },
    { atSec: 4.286, durSec: 0.321, note: 66.58, gain: 0.5 },
    { atSec: 4.464, durSec: 0.321, note: 70.75, gain: 0.42 },
    { atSec: 4.643, durSec: 0.321, note: 71.85, gain: 0.5 },
    { atSec: 4.821, durSec: 0.321, note: 76, gain: 0.42 },
    { atSec: 5, durSec: 0.321, note: 71.85, gain: 0.5 },
    { atSec: 5.179, durSec: 0.321, note: 76, gain: 0.42 },
    { atSec: 5.357, durSec: 0.321, note: 70.75, gain: 0.5 },
    { atSec: 5.536, durSec: 0.321, note: 71.85, gain: 0.42 },
    { atSec: 5.714, durSec: 1.6, note: 40, gain: 0.46 },
    { atSec: 5.714, durSec: 1.6, note: 64, gain: 0.56 },
  ],
}

// The stream stops dead: five eighths of turns, a strike together on E and B, a silence; again from G to a strike on E
// and C, the same silence, and the last E and B.
const BROKEN_OFF: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.321, note: 64, gain: 0.6 },
    { atSec: 0.179, durSec: 0.321, note: 65, gain: 0.5 },
    { atSec: 0.357, durSec: 0.321, note: 67, gain: 0.6 },
    { atSec: 0.536, durSec: 0.321, note: 71, gain: 0.5 },
    { atSec: 0.714, durSec: 0.321, note: 65, gain: 0.6 },
    { atSec: 0.893, durSec: 0.321, note: 67, gain: 0.5 },
    { atSec: 1.071, durSec: 0.321, note: 67, gain: 0.6 },
    { atSec: 1.25, durSec: 0.321, note: 71, gain: 0.5 },
    { atSec: 1.429, durSec: 0.321, note: 65, gain: 0.6 },
    { atSec: 1.607, durSec: 0.321, note: 67, gain: 0.5 },
    { atSec: 1.786, durSec: 0.6, note: 52, gain: 0.62 },
    { atSec: 1.786, durSec: 0.6, note: 64, gain: 0.62 },
    { atSec: 1.786, durSec: 0.6, note: 71, gain: 0.62 },
    { atSec: 2.857, durSec: 0.321, note: 67, gain: 0.6 },
    { atSec: 3.036, durSec: 0.321, note: 71, gain: 0.5 },
    { atSec: 3.214, durSec: 0.321, note: 72, gain: 0.6 },
    { atSec: 3.393, durSec: 0.321, note: 76, gain: 0.5 },
    { atSec: 3.571, durSec: 0.321, note: 71, gain: 0.6 },
    { atSec: 3.75, durSec: 0.321, note: 72, gain: 0.5 },
    { atSec: 3.929, durSec: 0.321, note: 67, gain: 0.6 },
    { atSec: 4.107, durSec: 0.321, note: 71, gain: 0.5 },
    { atSec: 4.286, durSec: 0.321, note: 65, gain: 0.6 },
    { atSec: 4.464, durSec: 0.321, note: 67, gain: 0.5 },
    { atSec: 4.643, durSec: 0.6, note: 52, gain: 0.62 },
    { atSec: 4.643, durSec: 0.6, note: 64, gain: 0.62 },
    { atSec: 4.643, durSec: 0.6, note: 72, gain: 0.62 },
    { atSec: 5.714, durSec: 1.6, note: 52, gain: 0.62 },
    { atSec: 5.714, durSec: 1.6, note: 64, gain: 0.62 },
    { atSec: 5.714, durSec: 1.6, note: 71, gain: 0.62 },
  ],
}

// Two players with two notes each: the pairs lie three steps of the scale apart, E B, F C, G E, C G, all fifths but for
// the one sixth, on the beat and off it in eighths. All come to rest on E B E.
const FIFTHS_IN_TURN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.321, note: 52, gain: 0.6 },
    { atSec: 0, durSec: 0.321, note: 59, gain: 0.54 },
    { atSec: 0.357, durSec: 0.321, note: 53, gain: 0.48 },
    { atSec: 0.357, durSec: 0.321, note: 60, gain: 0.42 },
    { atSec: 0.714, durSec: 0.321, note: 55, gain: 0.6 },
    { atSec: 0.714, durSec: 0.321, note: 64, gain: 0.54 },
    { atSec: 1.071, durSec: 0.321, note: 53, gain: 0.48 },
    { atSec: 1.071, durSec: 0.321, note: 60, gain: 0.42 },
    { atSec: 1.429, durSec: 0.321, note: 52, gain: 0.6 },
    { atSec: 1.429, durSec: 0.321, note: 59, gain: 0.54 },
    { atSec: 1.786, durSec: 0.321, note: 55, gain: 0.48 },
    { atSec: 1.786, durSec: 0.321, note: 64, gain: 0.42 },
    { atSec: 2.143, durSec: 0.321, note: 53, gain: 0.6 },
    { atSec: 2.143, durSec: 0.321, note: 60, gain: 0.54 },
    { atSec: 2.5, durSec: 0.321, note: 55, gain: 0.48 },
    { atSec: 2.5, durSec: 0.321, note: 64, gain: 0.42 },
    { atSec: 2.857, durSec: 0.321, note: 60, gain: 0.6 },
    { atSec: 2.857, durSec: 0.321, note: 67, gain: 0.54 },
    { atSec: 3.214, durSec: 0.321, note: 55, gain: 0.48 },
    { atSec: 3.214, durSec: 0.321, note: 64, gain: 0.42 },
    { atSec: 3.571, durSec: 0.321, note: 53, gain: 0.6 },
    { atSec: 3.571, durSec: 0.321, note: 60, gain: 0.54 },
    { atSec: 3.929, durSec: 0.321, note: 52, gain: 0.48 },
    { atSec: 3.929, durSec: 0.321, note: 59, gain: 0.42 },
    { atSec: 4.286, durSec: 2.4, note: 52, gain: 0.6 },
    { atSec: 4.286, durSec: 2.4, note: 59, gain: 0.52 },
    { atSec: 4.286, durSec: 2.4, note: 64, gain: 0.46 },
  ],
}

// In pelog. Polos low, E G F C B G F E from the E under middle C, and sangsih an octave and a step above it, so one line of
// eighths is thrown across the room and back.
const SEATS_APART: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.571, note: 52, gain: 0.68 },
    { atSec: 0.357, durSec: 0.571, note: 65.2, gain: 0.46 },
    { atSec: 0.714, durSec: 0.571, note: 54.58, gain: 0.62 },
    { atSec: 1.071, durSec: 0.571, note: 70.75, gain: 0.46 },
    { atSec: 1.429, durSec: 0.571, note: 53.2, gain: 0.62 },
    { atSec: 1.786, durSec: 0.571, note: 66.58, gain: 0.46 },
    { atSec: 2.143, durSec: 0.571, note: 59.85, gain: 0.62 },
    { atSec: 2.5, durSec: 0.571, note: 76, gain: 0.46 },
    { atSec: 2.857, durSec: 0.571, note: 58.75, gain: 0.68 },
    { atSec: 3.214, durSec: 0.571, note: 71.85, gain: 0.46 },
    { atSec: 3.571, durSec: 0.571, note: 54.58, gain: 0.62 },
    { atSec: 3.929, durSec: 0.571, note: 70.75, gain: 0.46 },
    { atSec: 4.286, durSec: 0.571, note: 53.2, gain: 0.62 },
    { atSec: 4.643, durSec: 0.571, note: 66.58, gain: 0.46 },
    { atSec: 5, durSec: 0.571, note: 52, gain: 0.62 },
    { atSec: 5.357, durSec: 0.571, note: 65.2, gain: 0.46 },
    { atSec: 5.714, durSec: 1.6, note: 52, gain: 0.6 },
    { atSec: 5.714, durSec: 1.6, note: 76, gain: 0.42 },
  ],
}

// One note a beat, E C B G B G F E, and the second player a sixteenth behind with the step above: the smallest
// interlock there is. The last answer is the E an octave below.
const ONE_BEHIND: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.643, note: 76, gain: 0.64 },
    { atSec: 0.179, durSec: 0.607, note: 77, gain: 0.46 },
    { atSec: 0.714, durSec: 0.643, note: 72, gain: 0.64 },
    { atSec: 0.893, durSec: 0.607, note: 76, gain: 0.46 },
    { atSec: 1.429, durSec: 0.643, note: 71, gain: 0.64 },
    { atSec: 1.607, durSec: 0.607, note: 72, gain: 0.46 },
    { atSec: 2.143, durSec: 0.643, note: 67, gain: 0.64 },
    { atSec: 2.321, durSec: 0.607, note: 71, gain: 0.46 },
    { atSec: 2.857, durSec: 0.643, note: 71, gain: 0.64 },
    { atSec: 3.036, durSec: 0.607, note: 72, gain: 0.46 },
    { atSec: 3.571, durSec: 0.643, note: 67, gain: 0.64 },
    { atSec: 3.75, durSec: 0.607, note: 71, gain: 0.46 },
    { atSec: 4.286, durSec: 0.643, note: 65, gain: 0.64 },
    { atSec: 4.464, durSec: 0.607, note: 67, gain: 0.46 },
    { atSec: 5, durSec: 2, note: 64, gain: 0.64 },
    { atSec: 5.179, durSec: 1.8, note: 52, gain: 0.46 },
  ],
}

// Polos alone, E G G F and G C C B twice over in eighths, every note let go before the gap: for the patches whose
// effects play the second part.
const POLOS_WAITS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.304, note: 64, gain: 0.66 },
    { atSec: 0.357, durSec: 0.304, note: 67, gain: 0.58 },
    { atSec: 0.714, durSec: 0.304, note: 67, gain: 0.58 },
    { atSec: 1.071, durSec: 0.304, note: 65, gain: 0.58 },
    { atSec: 1.429, durSec: 0.304, note: 67, gain: 0.66 },
    { atSec: 1.786, durSec: 0.304, note: 72, gain: 0.58 },
    { atSec: 2.143, durSec: 0.304, note: 72, gain: 0.58 },
    { atSec: 2.5, durSec: 0.304, note: 71, gain: 0.58 },
    { atSec: 2.857, durSec: 0.304, note: 64, gain: 0.66 },
    { atSec: 3.214, durSec: 0.304, note: 67, gain: 0.58 },
    { atSec: 3.571, durSec: 0.304, note: 67, gain: 0.58 },
    { atSec: 3.929, durSec: 0.304, note: 65, gain: 0.58 },
    { atSec: 4.286, durSec: 0.304, note: 67, gain: 0.66 },
    { atSec: 4.643, durSec: 0.304, note: 72, gain: 0.58 },
    { atSec: 5, durSec: 0.304, note: 72, gain: 0.58 },
    { atSec: 5.357, durSec: 0.304, note: 71, gain: 0.58 },
    { atSec: 5.714, durSec: 1.6, note: 64, gain: 0.62 },
  ],
}

// In pelog, for long tones. Two players a little apart in tuning on the tones E G C F E: the leader on the beat, the
// other an eighth later 5.6 Hz sharp in every register, so each tone beats at the pace of the sixteenths once both are in.
const TUNED_APART: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.32, note: 64, gain: 0.6 },
    { atSec: 0.357, durSec: 0.963, note: 64.29, gain: 0.52 },
    { atSec: 1.429, durSec: 1.32, note: 66.58, gain: 0.6 },
    { atSec: 1.786, durSec: 0.963, note: 66.83, gain: 0.52 },
    { atSec: 2.857, durSec: 1.32, note: 71.85, gain: 0.6 },
    { atSec: 3.214, durSec: 0.963, note: 72.04, gain: 0.52 },
    { atSec: 4.286, durSec: 1.32, note: 65.2, gain: 0.6 },
    { atSec: 4.643, durSec: 0.963, note: 65.47, gain: 0.52 },
    { atSec: 5.714, durSec: 1.6, note: 64, gain: 0.6 },
    { atSec: 5.714, durSec: 1.6, note: 64.29, gain: 0.52 },
  ],
}

// For strings pressed up a whole tone a sixteenth after the pluck, so the press is the second player: plucks on D, F and
// A in eighths arrive on E, G and B, and the last D and A come to rest on the fifth E and B.
const PRESSED_ANSWER: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.339, note: 62, gain: 0.66 },
    { atSec: 0.357, durSec: 0.339, note: 65, gain: 0.56 },
    { atSec: 0.714, durSec: 0.339, note: 69, gain: 0.56 },
    { atSec: 1.071, durSec: 0.339, note: 65, gain: 0.56 },
    { atSec: 1.429, durSec: 0.339, note: 62, gain: 0.66 },
    { atSec: 1.786, durSec: 0.339, note: 57, gain: 0.56 },
    { atSec: 2.143, durSec: 0.339, note: 62, gain: 0.56 },
    { atSec: 2.5, durSec: 0.339, note: 65, gain: 0.56 },
    { atSec: 2.857, durSec: 0.339, note: 69, gain: 0.66 },
    { atSec: 3.214, durSec: 0.339, note: 74, gain: 0.56 },
    { atSec: 3.571, durSec: 0.339, note: 69, gain: 0.56 },
    { atSec: 3.929, durSec: 0.339, note: 65, gain: 0.56 },
    { atSec: 4.286, durSec: 0.339, note: 62, gain: 0.66 },
    { atSec: 4.643, durSec: 0.339, note: 57, gain: 0.56 },
    { atSec: 5, durSec: 0.339, note: 62, gain: 0.56 },
    { atSec: 5.357, durSec: 0.339, note: 65, gain: 0.56 },
    { atSec: 5.714, durSec: 1.6, note: 62, gain: 0.6 },
    { atSec: 5.714, durSec: 1.6, note: 69, gain: 0.54 },
  ],
}

// Two hands share each chord: polos lays the lower two notes, sangsih the upper two a beat later. E B and G C, F C and E
// G, G E and B E, then F C and G B, whose F and B open out to E B G.
const CHORD_IN_TWO: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.339, note: 52, gain: 0.56 },
    { atSec: 0, durSec: 1.339, note: 59, gain: 0.56 },
    { atSec: 0.714, durSec: 0.625, note: 67, gain: 0.46 },
    { atSec: 0.714, durSec: 0.625, note: 72, gain: 0.46 },
    { atSec: 1.429, durSec: 1.339, note: 53, gain: 0.56 },
    { atSec: 1.429, durSec: 1.339, note: 60, gain: 0.56 },
    { atSec: 2.143, durSec: 0.625, note: 64, gain: 0.46 },
    { atSec: 2.143, durSec: 0.625, note: 67, gain: 0.46 },
    { atSec: 2.857, durSec: 1.339, note: 55, gain: 0.56 },
    { atSec: 2.857, durSec: 1.339, note: 64, gain: 0.56 },
    { atSec: 3.571, durSec: 0.625, note: 71, gain: 0.46 },
    { atSec: 3.571, durSec: 0.625, note: 76, gain: 0.46 },
    { atSec: 4.286, durSec: 1.339, note: 53, gain: 0.56 },
    { atSec: 4.286, durSec: 1.339, note: 60, gain: 0.56 },
    { atSec: 5, durSec: 0.625, note: 67, gain: 0.46 },
    { atSec: 5, durSec: 0.625, note: 71, gain: 0.46 },
    { atSec: 5.714, durSec: 1.6, note: 52, gain: 0.54 },
    { atSec: 5.714, durSec: 1.6, note: 59, gain: 0.54 },
    { atSec: 5.714, durSec: 1.6, note: 67, gain: 0.54 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Handpan and tongue drum: the leader of each pair on steel or tongue, its follower on the same metal, put further off.
  {
    id: 'interlocking-pairs-polos-at-the-gate',
    name: 'Polos at the gate',
    category: 'plucked',
    preview: TWO_CELLS,
    description:
      'A steel pan struck firmly near its centre, ringing two seconds with almost no sympathy, in a short bright hall.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Soft hands',
      params: { decay: 2.2, touch: 0.7, position: 0.2, shimmer: 0.1, sympathy: 0.1, cavity: 0.3 },
    },
    effects: [
      {
        deviceId: 'hall-reverb',
        params: { preDelay: 20, lowDecay: 1.5, midDecay: 2, damping: 12000, mix: 0.22 },
      },
      { deviceId: 'spread', params: { low: 0, mid: 1.3, high: 1.8 } },
    ],
  },
  {
    id: 'interlocking-pairs-sangsih-in-the-eaves',
    name: 'Sangsih in the eaves',
    category: 'plucked',
    preview: APART_THEN_TOGETHER,
    description:
      'The centre of a steel pan touched very softly, its top filtered away, heard from across a yard with its room around it.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Centre tone',
      params: { volume: -1.5, decay: 3, touch: 0.05, cavity: 0.4, sympathy: 0.3 },
    },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 700 } },
      { deviceId: 'distance', params: { distance: 0.5, room: 0.6, decay: 1.6, wander: 0.1 } },
    ],
  },
  {
    id: 'interlocking-pairs-shuttle-thrown',
    name: 'Shuttle thrown',
    category: 'plucked',
    preview: POLOS_WAITS,
    description:
      'Short clean steel, hit hard, with one tape head a sixteenth behind, so the echo lands in the gaps of an eighth-note line.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Clean steel',
      params: { volume: 3, decay: 0.9, touch: 0.85, position: 0.55 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 179,
          feedback: 0.2,
          heads: 0,
          wow: 0.05,
          highCut: 6000,
          spread: 0.8,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'interlocking-pairs-shuttle-caught',
    name: 'Shuttle caught',
    category: 'plucked',
    preview: APART_THEN_TOGETHER,
    description:
      'A palm-muted pan, thuddy and short, with dark bucket-brigade repeats an eighth apart thrown to both sides.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Palm mute',
      params: { decay: 1.2, touch: 0.1, damp: 0.8 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        params: { time: 357, feedback: 0.45, tone: 1400, age: 0.6, spread: 1, mix: 0.5 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-slit-and-peg',
    name: 'Slit and peg',
    category: 'plucked',
    preview: THREE_SHARED,
    description:
      'A short slit drum hit hard, sounding through a small soundboard and driven into a fast limiter.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Slit drum',
      params: { position: 0.7, touch: 0.85 },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 5, size: 0.7, material: 0.35, opening: 0.6, air: 0, mix: 0.75 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 8, outputGain: -4 } },
    ],
  },
  {
    id: 'interlocking-pairs-peg-under-the-floor',
    name: 'Peg under the floor',
    category: 'plucked',
    preview: SEATS_APART,
    description:
      'A slit drum struck with the pad of the hand, all air thump, with its octave below added and the octave kept dark.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Slit drum',
      params: { decay: 2.5, touch: 0.05, position: 0.1, cavity: 1 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0.9, up1: 0, dry: 0.7, filter: 500, spread: 0 } },
    ],
  },
  {
    id: 'interlocking-pairs-rim-of-the-first-pan',
    name: 'Rim of the first pan',
    category: 'bell',
    preview: TWO_CELLS,
    description:
      'The edge of a steel pan, bright with overtones, turned slowly through eight phaser stages and onto a bright plate.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Edge overtones',
      params: { volume: -1.5, touch: 0.85, decay: 3 },
    },
    effects: [
      {
        deviceId: 'phaser',
        params: { stages: 2, centerHz: 1800, rate: 0.15, depth: 70, feedback: 35, mix: 0.5 },
      },
      { deviceId: 'plate-reverb', params: { decay: 0.5, damping: 0.1, mix: 0.28 } },
    ],
  },
  {
    id: 'interlocking-pairs-rim-across-the-yard',
    name: 'Rim across the yard',
    category: 'plucked',
    preview: BROKEN_OFF,
    description:
      'The edge of the pan touched lightly and half damped, thinned to its middle, swinging round the head in wide arcs.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Edge overtones',
      params: { volume: 2.5, decay: 1.6, touch: 0.2, damp: 0.6 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 260, presence: -5, highCut: 3500 } },
      { deviceId: 'around', params: { path: 2, rate: 0.7, radius: 1, head: 0.9 } },
    ],
  },
  {
    id: 'interlocking-pairs-drops-on-two-lids',
    name: 'Drops on two lids',
    category: 'plucked',
    preview: POLOS_WAITS,
    description:
      'Quick bright taps near the edge, each followed by six skips that start a sixteenth later and crowd together.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Rain taps',
      params: { volume: 0.5, touch: 0.9, shimmer: 0.1, damp: 0.4 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        params: { first: 179, bounce: 0.88, skips: 6, loss: 3, throw: 1, mix: 0.5 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-cloth-over-the-lid',
    name: 'Cloth over the lid',
    category: 'texture',
    preview: FOUR_IN_TWO,
    description:
      'Damped taps with no edge at all, blurred for a tenth of a second and levelled until they only breathe.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Rain taps',
      params: { volume: 0.5, decay: 0.8, touch: 0, position: 0.4, damp: 1, cavity: 0.2 },
    },
    effects: [
      { deviceId: 'fog', params: { size: 110, soften: 0.7, damp: 0.6, mix: 0.85 } },
      {
        deviceId: 'ambient-comp',
        params: { threshold: -36, ratio: 3, attack: 20, release: 0.4, makeup: 6 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-ding-keeps-the-count',
    name: 'Ding keeps the count',
    category: 'bell',
    preview: HALF_SPEED,
    description:
      'A long low ding whose middle band is pulsed 5.6 times a second, the pace of the sixteenths, while its bass stays still.',
    instrument: { deviceId: 'handpan', preset: 'Low ding', params: { decay: 9, touch: 0.5 } },
    effects: [
      {
        deviceId: 'band-pulse',
        params: { rate: 5.6, depth: 0.95, duty: 0.4, edge: 8, low: 180, high: 3500 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-answer-from-the-well',
    name: 'Answer from the well',
    category: 'bell',
    preview: ONE_BEHIND,
    description: 'A low ding touched with the palm in a dark cave of short scattered echoes.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Low ding',
      params: { volume: -1.5, decay: 4, touch: 0.05, cavity: 1, shimmer: 0.1 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        params: { length: 0.4, feedback: 0.55, highCut: 1600, mix: 0.5 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-halo-for-two',
    name: 'Halo for two',
    category: 'bell',
    preview: TWO_CELLS,
    description:
      'A shimmering pan with every note answering every other, and short octave sparks scattered within a sixteenth of it.',
    instrument: { deviceId: 'handpan', preset: 'Halo', params: { touch: 0.45, decay: 4 } },
    effects: [
      {
        deviceId: 'glints',
        params: {
          density: 16,
          pitch: 0,
          size: 45,
          scatter: 179,
          follow: 1,
          sparkle: 0.7,
          mix: 0.4,
        },
      },
    ],
  },
  {
    id: 'interlocking-pairs-halo-let-in-late',
    name: 'Halo let in late',
    category: 'pad',
    preview: TUNED_APART,
    description:
      'A shimmering pan barely touched, every attack faded in over a fifth of a second, then left in a dark room.',
    instrument: { deviceId: 'handpan', preset: 'Halo', params: { decay: 9, touch: 0.1 } },
    effects: [
      { deviceId: 'swell', params: { attack: 200, sensitivity: -45, release: 120 } },
      { deviceId: 'ether-reverb', params: { decay: 6, damping: 0.75, size: 0.7, mix: 0.35 } },
    ],
  },
  {
    id: 'interlocking-pairs-tongue-in-front',
    name: 'Tongue in front',
    category: 'plucked',
    preview: THREE_SHARED,
    description:
      'A bright tongue drum with a thin edge of metal from a ring modulator tuned to a high E.',
    instrument: { deviceId: 'handpan', preset: 'Bright tongue', params: { decay: 2.5 } },
    effects: [
      {
        deviceId: 'ring',
        params: { root: 4, octave: 5, wave: 0, drift: 0.05, tone: 10000, mix: 0.3 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-tongue-behind',
    name: 'Tongue behind',
    category: 'plucked',
    preview: HALF_SPEED,
    description:
      'A tongue drum struck softly towards its edge, its air left in, on a worn cassette that wavers and loses its top.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Bright tongue',
      params: { touch: 0.15, position: 0.75, decay: 3, cavity: 0.6 },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 1, drive: 0.4, wobble: 0.45, wear: 0.5, noise: 0.05, tone: 0.25 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-tank-by-the-tap',
    name: 'Tank by the tap',
    category: 'plucked',
    preview: FOUR_IN_TWO,
    description:
      'A steel tank drum, undamped and struck plainly, dripping through three slack springs.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tank drum',
      params: { damp: 0, touch: 0.65, decay: 3 },
    },
    effects: [
      {
        deviceId: 'spring-reverb',
        params: { decay: 3, springs: 2, tension: 0.35, tone: 3200, drip: 0.7, mix: 0.45 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-tank-half-full',
    name: 'Tank half full',
    category: 'plucked',
    preview: SEATS_APART,
    description:
      'The tank struck softly and held under water, muffled and wavering, with a few bubbles off each stroke.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tank drum',
      params: { volume: -3.5, decay: 3, touch: 0.1 },
    },
    effects: [
      { deviceId: 'underwater', params: { depth: 0.6, waver: 0.5, rate: 0.7, bubbles: 0.25 } },
    ],
  },
  {
    id: 'interlocking-pairs-steel-seen-twice',
    name: 'Steel seen twice',
    category: 'bell',
    preview: POLOS_WAITS,
    description:
      'Bright plain steel with one follower that repeats it a sixteenth later, an octave up, in the middle.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Bright bloom',
      params: { volume: -1, decay: 2, position: 0.5 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: { followers: 1, gap: 0.179, interval1: 12, fade: 0.1, tone: 9000, mix: 0.5 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-knuckles-through-brick',
    name: 'Knuckles through brick',
    category: 'plucked',
    preview: BROKEN_OFF,
    description:
      'Knuckles on a pan, short, coming out of a small loudspeaker with the microphone at the far end of the room.',
    instrument: { deviceId: 'handpan', preset: 'Knuckles', params: { decay: 1.3 } },
    effects: [
      {
        deviceId: 're-amp',
        params: { speaker: 0, drive: 0.45, treble: -0.3, distance: 0.85, room: 0.7, noise: 0 },
      },
    ],
  },

  // Zither: nail, finger and hammer; the leader near the bridge, the follower near the middle of the string.
  {
    id: 'interlocking-pairs-first-thumb',
    name: 'First thumb',
    category: 'plucked',
    preview: TWO_CELLS,
    description:
      'A picked string on a koto body, taken close to the bridge and gone in a second and a half, with its presence up.',
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { volume: -1, decay: 1.5, release: 0.5, brightness: 0.95, position: 0.06 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 150, presence: 5 } },
      { deviceId: 'plate-reverb', params: { decay: 0.35, damping: 0.4, mix: 0.18 } },
    ],
  },
  {
    id: 'interlocking-pairs-second-thumb',
    name: 'Second thumb',
    category: 'plucked',
    preview: APART_THEN_TOGETHER,
    description:
      'A koto body played with the flesh of the finger near the middle, dulled and thickened on a driven cassette.',
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { exciter: 0, decay: 2.5, release: 1, brightness: 0.2, position: 0.42 },
    },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.6, wow: 0.2, speed: 3, age: 0.5, hiss: 0, tone: 0.15 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-hammer-on-the-beat',
    name: 'Hammer on the beat',
    category: 'plucked',
    preview: THREE_SHARED,
    description:
      'Dulcimer strings hit once with a hard hammer, pushed through a triode until the attack has some bark.',
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: { roll: 0, decay: 3, release: 1, courses: 0.2, brightness: 0.8 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: { circuit: 3, drive: 0.6, tone: 0.2, lowCut: 80, mix: 0.8 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-hammer-in-the-gap',
    name: 'Hammer in the gap',
    category: 'plucked',
    preview: ONE_BEHIND,
    description:
      'A felt hammer on dulcimer strings with much sympathy, ringing on in a small dark space of four seconds.',
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { decay: 8, release: 5, brightness: 0.1, sympathy: 0.75, body: 2 },
    },
    effects: [{ deviceId: 'expanse', params: { size: 0.35, decay: 4, highCut: 2500, mix: 0.4 } }],
  },
  {
    id: 'interlocking-pairs-red-silk',
    name: 'Red silk',
    category: 'plucked',
    preview: THREE_LAYERS,
    description:
      'Bright finger-plucked harp strings with three chorus voices spread wide across them.',
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { volume: 0.5, decay: 4, release: 2, brightness: 0.85, position: 0.14 },
    },
    effects: [
      { deviceId: 'chorus', params: { voices: 1, rate: 0.7, depth: 55, spread: 100, mix: 0.45 } },
    ],
  },
  {
    id: 'interlocking-pairs-grey-silk',
    name: 'Grey silk',
    category: 'plucked',
    preview: HALF_SPEED,
    description:
      'Single felted strings kept very dark, split into a small slow flock of three that drifts some way off.',
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: { volume: -10.5, chord: 0, decay: 6, release: 3, sympathy: 0.35, brightness: 0.1 },
    },
    effects: [
      { deviceId: 'murmuration', params: { birds: 3, speed: 0.5, range: 14, air: 0.7, mix: 0.6 } },
    ],
  },
  {
    id: 'interlocking-pairs-octave-courses',
    name: 'Octave courses',
    category: 'plucked',
    preview: TWO_CELLS,
    description:
      'Picked double courses in octaves struck as one, short and bright, hollowed by a slow flanger with its feedback inverted.',
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { volume: -2.5, strum: 0, decay: 3, release: 1.2, brightness: 0.85 },
    },
    effects: [
      {
        deviceId: 'flanger',
        params: { delayMs: 3, rate: 0.2, depth: 60, feedback: -55, mix: 0.45 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-octave-gone-soft',
    name: 'Octave gone soft',
    category: 'plucked',
    preview: SEATS_APART,
    description:
      'Octave strings plucked with the finger and kept dark, shimmering in eighths as a harmonic tremolo tips their tone.',
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: {
        volume: 0.5,
        exciter: 0,
        strum: 0,
        brightness: 0.2,
        decay: 10,
        release: 6,
        courses: 0.4,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        params: { mode: 2, rate: 2.8, depth: 0.95, phase: 180, crossover: 500, drift: 0 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-dulcimer-on-tiles',
    name: 'Dulcimer on tiles',
    category: 'plucked',
    preview: POLOS_WAITS,
    description:
      'A dry dulcimer whose hammers repeat a held key at the pace of the sixteenths, in a gated burst of room.',
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: { volume: -0.5, roll: 5.6, decay: 0.9, release: 0.3, brightness: 0.65 },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        params: { shape: 0, time: 0.35, preDelay: 0, density: 0.9, mix: 0.45 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-dulcimer-under-leaves',
    name: 'Dulcimer under leaves',
    category: 'plucked',
    preview: FIFTHS_IN_TURN,
    description:
      'Single hammered courses with a good deal of sympathy, left outdoors while rain taps on them.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { volume: -3, chord: 0, roll: 0, decay: 4, release: 3, sympathy: 0.5 },
    },
    effects: [{ deviceId: 'weather', params: { kind: 2, exposure: 0.55, voice: 0.3, sway: 0.4 } }],
  },
  {
    id: 'interlocking-pairs-loom-by-day',
    name: 'Loom by day',
    category: 'plucked',
    preview: THREE_LAYERS,
    description:
      'Bright picked courses split into eight bands, the low ones first and the high ones up to an eighth later.',
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { volume: -2.5, chord: 0, decay: 2.5, release: 1, courses: 0.85, brightness: 0.8 },
    },
    effects: [
      { deviceId: 'prism', params: { time: 357, shape: 0, feedback: 0.25, bands: 8, mix: 0.45 } },
    ],
  },
  {
    id: 'interlocking-pairs-loom-by-lamplight',
    name: 'Loom by lamplight',
    category: 'plucked',
    preview: HALF_SPEED,
    description:
      'Open strings under the finger, dark and full of sympathy, their tail falling by octaves as it ages.',
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { chord: 0, exciter: 0, brightness: 0.15, position: 0.5, sympathy: 0.9, decay: 6 },
    },
    effects: [
      {
        deviceId: 'bloom-reverb',
        params: { decay: 5, bloom: 0.45, direction: 1, season: 3, interval: 1, mix: 0.4 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-two-oars',
    name: 'Two oars',
    category: 'plucked',
    preview: SEATS_APART,
    description:
      'Finger-plucked zither strings opened first on the left and then on the right, an eighth to each side.',
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: {
        volume: -1.5,
        exciter: 0,
        body: 1,
        decay: 4,
        release: 2.5,
        courses: 0.6,
        brightness: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'pulses',
        params: {
          rate: 2.8,
          steps: 2,
          fill: 1,
          drift: 0,
          shift: 1,
          edge: 0.3,
          length: 1,
          floor: 0.25,
          shade: 0.2,
          accent: 0,
        },
      },
    ],
  },
  {
    id: 'interlocking-pairs-oars-shipped',
    name: 'Oars shipped',
    category: 'plucked',
    preview: BROKEN_OFF,
    description:
      'A koto string stopped almost at once and plucked at its middle, far over the water with more air than string.',
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { volume: 4, decay: 0.7, release: 0.2, brightness: 0.3, position: 0.5 },
    },
    effects: [
      {
        deviceId: 'distance',
        params: { distance: 0.75, room: 0.8, air: 0.8, decay: 2.5, wander: 0 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-wire-and-answer',
    name: 'Wire and answer',
    category: 'plucked',
    preview: POLOS_WAITS,
    description:
      'Bright wire in wide courses, each note answered a sixteenth later by a grain of itself an octave up.',
    instrument: {
      deviceId: 'zither',
      preset: 'Minor glass haze',
      params: { volume: -3, chord: 0, strum: 0, decay: 5, release: 1.5, sympathy: 0.2 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        params: {
          time: 179,
          spray: 0.02,
          pitch: 12,
          pitchSpray: 0,
          size: 160,
          feedback: 0.1,
          tone: 5000,
          mix: 0.4,
        },
      },
    ],
  },
  {
    id: 'interlocking-pairs-wire-unlit',
    name: 'Wire unlit',
    category: 'plucked',
    preview: THREE_SHARED,
    description:
      'A single picked wire with its brightness down, put through an early converter at nine kilohertz and ten bits.',
    instrument: {
      deviceId: 'zither',
      preset: 'Minor glass haze',
      params: {
        volume: -6.5,
        chord: 0,
        strum: 0,
        brightness: 0.4,
        courses: 0,
        sympathy: 0.15,
        decay: 3,
        release: 0.8,
      },
    },
    effects: [
      { deviceId: 'vintage-digital', params: { rate: 9000, bits: 10, aliasing: 0.3, jitter: 0.3 } },
    ],
  },
  {
    id: 'interlocking-pairs-fretted-box',
    name: 'Fretted box',
    category: 'plucked',
    preview: FOUR_IN_TWO,
    description:
      'A nasal picked string near the bridge, given the colour of a hollow tube and held to a short ring.',
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: { volume: -0.5, chord: 0, strum: 0, decay: 1.6, release: 0.5 },
    },
    effects: [{ deviceId: 'imprint', params: { shape: 4, amount: 1, replace: 0.3 } }],
  },
  {
    id: 'interlocking-pairs-box-with-the-lid-down',
    name: 'Box with the lid down',
    category: 'plucked',
    preview: HALF_SPEED,
    description:
      'The finger on a koto string with little top, run into a soft fuzz and a dark three second haze.',
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: {
        chord: 0,
        exciter: 0,
        strum: 0,
        brightness: 0.3,
        position: 0.3,
        decay: 3,
        release: 2,
      },
    },
    effects: [
      {
        deviceId: 'haze',
        params: { haze: 0.5, blur: 0.5, decay: 3, tone: 0.2, octave: 0, mix: 0.45 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-strings-that-listen',
    name: 'Strings that listen',
    category: 'pad',
    preview: TUNED_APART,
    description:
      'Felt-hammered strings with sympathy full up; the attacks are taken out and the tones held on after them.',
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: { volume: -11.5, chord: 0, brightness: 0.35, position: 0.25, decay: 8, release: 6 },
    },
    effects: [{ deviceId: 'sift', params: { tones: 3, attacks: -26, air: -8, hold: 0.6 } }],
  },
  {
    id: 'interlocking-pairs-thread-pulled-tight',
    name: 'Thread pulled tight',
    category: 'plucked',
    preview: TWO_CELLS,
    description:
      'A harp string picked hard at its very end and cut off fast, squeezed and with its low end brought up.',
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { volume: 0.5, exciter: 1, position: 0.05, brightness: 1, decay: 1.2, release: 0.25 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 24, outputGain: -9.5 } },
      { deviceId: 'ambient-eq', params: { low: 7, body: 4, air: -5 } },
    ],
  },

  // Bells, bars, gourds, glass and gongs: the leader is struck hard, the follower damped, muffled or late.
  {
    id: 'interlocking-pairs-bronze-key-struck',
    name: 'Bronze key struck',
    category: 'bell',
    preview: FOUR_IN_TWO,
    description:
      'Hard-struck metal bars that beat three times a second, over a table of bowls tuned to a pelog scale on E.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { volume: -0.5, decay: 2, hardness: 0.95, brightness: 0.75, detune: 3 },
    },
    effects: [
      {
        deviceId: 'bowls',
        params: { root: 4, scale: 7, bowls: 10, ring: 4, strike: 0.6, mix: 0.35 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-bronze-key-pinched',
    name: 'Bronze key pinched',
    category: 'bell',
    preview: APART_THEN_TOGETHER,
    description:
      'Metal bars struck softly and pinched as the key is let go, sounding inside a stopped tube.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: {
        volume: 3.5,
        decay: 0.8,
        hardness: 0.3,
        brightness: 0.35,
        damping: 0.8,
        release: 1,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 2, size: 0.8, material: 0.4, opening: 0.5, air: 0.02, mix: 0.7 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-two-flames-one-wick',
    name: 'Two flames, one wick',
    category: 'bell',
    preview: POLOS_WAITS,
    description:
      'A small hard church bell of four seconds with four scattered echoes of it inside the next two beats.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { volume: -4, decay: 4, hardness: 0.9, position: 0.02, detune: 2 },
    },
    effects: [
      {
        deviceId: 'constellation',
        params: { span: 1428, stars: 4, pattern: 3, fade: 0.5, again: 0, drift: 0, mix: 0.4 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-wick-pinched-out',
    name: 'Wick pinched out',
    category: 'bell',
    preview: TUNED_APART,
    description:
      'A muffled bell with no hard edge, its partials smeared into one another and hung on below three kilohertz.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Distant bell',
      params: { volume: -0.5, decay: 5, hardness: 0.1 },
    },
    effects: [
      { deviceId: 'spectral-blur', params: { blur: 0.5, smear: 0.6, highCut: 3000, mix: 0.6 } },
    ],
  },
  {
    id: 'interlocking-pairs-gourd-on-the-left',
    name: 'Gourd on the left',
    category: 'plucked',
    preview: THREE_SHARED,
    description:
      'Thumbed tines played firmly, each note struck again by three quieter copies an eighth apart.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 1.4, hardness: 0.85, brightness: 0.6 },
    },
    effects: [
      {
        deviceId: 'cascade',
        params: { pattern: 1, time: 357, repeats: 3, decay: 0.55, high: 0.2, low: 0, mix: 0.4 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-gourd-on-the-right',
    name: 'Gourd on the right',
    category: 'plucked',
    preview: HALF_SPEED,
    description:
      'Tines pressed with the soft of the thumb, out of a little loudspeaker turned well away from the microphone.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { volume: 2.5, decay: 3, hardness: 0.15, brightness: 0.2, damping: 0.9 },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: {
          speaker: 0,
          drive: 0.25,
          bass: 0.4,
          treble: -0.5,
          angle: 0.9,
          distance: 0.1,
          room: 0.2,
          noise: 0,
        },
      },
    ],
  },
  {
    id: 'interlocking-pairs-fan-in-the-first-bar',
    name: 'Fan in the first bar',
    category: 'bell',
    preview: CORE_AND_NEIGHBOUR,
    description:
      'Hard-struck vibraphone bars, damped on release, through a fast-spinning horn with some drive, lifted by a limiter.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { volume: 6, decay: 3, hardness: 0.65, position: 0.3, release: 0.9 },
    },
    effects: [
      {
        deviceId: 'rotary',
        params: { speed: 1, hornDepth: 0.75, drive: 0.35, balance: 0.75, mix: 0.9 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 8, outputGain: -3.5 } },
    ],
  },
  {
    id: 'interlocking-pairs-fan-blade-at-rest',
    name: 'Fan blade at rest',
    category: 'bell',
    preview: ONE_BEHIND,
    description:
      'Vibraphone bars touched with yarn and left ringing, four pure sines swelling in behind their partials.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { decay: 9, hardness: 0.05, brightness: 0.15, release: 0.3 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: { partials: 4, attack: 250, release: 2.5, spread: 0.8, mix: 0.6 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-cups-on-the-tray',
    name: 'Cups on the tray',
    category: 'bell',
    preview: TURN_ABOUT,
    description:
      'Tapped glass, short, shifted three hertz up on one side and three down on the other, so it beats across the room.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { volume: -7, decay: 1.8, detune: 0 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: {
          mode: 2,
          shift: 0,
          fine: 3,
          feedback: 0,
          delay: 1,
          lfoDepth: 0,
          tone: 12000,
          width: 1,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'interlocking-pairs-tray-put-down',
    name: 'Tray put down',
    category: 'bell',
    preview: FOUR_IN_TWO,
    description:
      'Glass struck softly and dull, with backward copies of the last beat swelling up between the strokes.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Shivering glass',
      params: { volume: -4.5, decay: 4, hardness: 0.2, brightness: 0.2, damping: 0.5, detune: 2 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        params: { time: 714, feedback: 0.1, smooth: 0.5, tone: 4000, mix: 0.5 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-wood-answers-wood',
    name: 'Wood answers wood',
    category: 'plucked',
    preview: TWO_CELLS,
    description:
      'Short wooden bars struck hard in a very small bright room, with one faint copy a sixteenth behind.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: { volume: 3.5, hardness: 0.95, decay: 0.6 },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        params: { decay: 0.5, size: 0.5, damping: 0.1, breathDepth: 0, mix: 0.4 },
      },
      {
        deviceId: 'tape-echo',
        params: { time: 179, feedback: 0.05, heads: 0, wow: 0, spread: 1, mix: 0.3 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-wood-through-mud',
    name: 'Wood through mud',
    category: 'plucked',
    preview: SEATS_APART,
    description:
      'Wooden bars struck with a soft beater and let ring, their body stretched towards a giant and darkened.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: { volume: 6, hardness: 0.15, decay: 2.2, damping: 0.6, position: 0.2 },
    },
    effects: [{ deviceId: 'size', params: { size: 0.8, tone: -0.4 } }],
  },
  {
    id: 'interlocking-pairs-chimes-change-hands',
    name: 'Chimes change hands',
    category: 'bell',
    preview: TURN_ABOUT,
    description:
      'Bright chime bars of three seconds switched between left and right, an eighth on each side.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: { volume: -7.5, decay: 3, damping: 0.2 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        params: { mode: 1, rate: 1.4, depth: 1, shape: 2, drift: 0, smooth: 0.15 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-bowl-in-the-gap',
    name: 'Bowl in the gap',
    category: 'bell',
    preview: ONE_BEHIND,
    description:
      'A singing bowl hit with a firm stick, every band of it flickering at the pace of the sixteenths from low to high.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: { decay: 6, hardness: 0.75, brightness: 0.65 },
    },
    effects: [
      {
        deviceId: 'glimmer',
        params: { depth: 1, rate: 5.6, pattern: 1, soft: 0.5, vary: 0.1, mix: 1 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-bowl-beneath',
    name: 'Bowl beneath',
    category: 'bell',
    preview: TUNED_APART,
    description:
      'A dark bowl with a slow beat, cut into four bands that swell and cross from side to side by turns.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Dark bowl',
      params: { volume: -2, decay: 14, hardness: 0.2, detune: 0.8 },
    },
    effects: [
      { deviceId: 'currents', params: { depth: 0.85, sway: 0.9, rate: 0.5, bands: 4, mix: 1 } },
    ],
  },
  {
    id: 'interlocking-pairs-gong-for-the-eighth',
    name: 'Gong for the eighth',
    category: 'bell',
    preview: TUNED_APART,
    description:
      'A medium gong struck plainly, its tail shaped by a soft vowel until the hall hums along for four seconds.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { volume: -1.5, decay: 12, hardness: 0.5, detune: 1 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        params: { vowel: 3, resonance: 0.8, voice: 0.5, decay: 4, mix: 0.5 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-gong-cut-short',
    name: 'Gong cut short',
    category: 'bell',
    preview: BROKEN_OFF,
    description:
      'A gong choked as soon as the key is let go, only its band around seven hundred hertz left, pressed by a limiter.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { volume: -3, decay: 2.5, release: 1, damping: 0.8, hardness: 0.65, stretch: 0.9 },
    },
    effects: [
      { deviceId: 'auto-filter', params: { type: 2, slope: 0, cutoffHz: 700, resonance: 0.8 } },
      { deviceId: 'fet-limiter', params: { inputGain: 10, outputGain: -3 } },
    ],
  },

  // Mallets: marimba, vibraphone, xylophone, glockenspiel and celesta, hard heads in front and soft ones behind.
  {
    id: 'interlocking-pairs-long-bar-leads',
    name: 'Long bar leads',
    category: 'plucked',
    preview: THREE_LAYERS,
    description: 'A marimba with firm mallets and full tubes, dry but for a very short dark hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { volume: -5, mallet: 0.65, decay: 0.8, resonator: 1, width: 0.7 },
    },
    effects: [
      {
        deviceId: 'hall-reverb',
        params: { preDelay: 20, lowDecay: 1, midDecay: 1, damping: 3000, mix: 0.2 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-short-bar-follows',
    name: 'Short bar follows',
    category: 'plucked',
    preview: APART_THEN_TOGETHER,
    description:
      'A marimba played with soft heads and damped on release, rounded over by a tube with its top tilted down.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.05, decay: 0.5, resonator: 0.5, damper: 0.8, width: 0.1 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 2, driveDb: 14, toneDb: -5, outputDb: -8 } },
    ],
  },
  {
    id: 'interlocking-pairs-tubes-hum-along',
    name: 'Tubes hum along',
    category: 'pad',
    preview: FIFTHS_IN_TURN,
    description:
      'Long marimba bars struck with the softest heads, a pipe an octave below and one in unison speaking after them.',
    instrument: { deviceId: 'mallets', preset: 'Humming marimba', params: { decay: 3 } },
    effects: [
      {
        deviceId: 'stops',
        params: {
          speak: 250,
          tone: 0.3,
          chiff: 0,
          sub: 0.5,
          unison: 0.7,
          octave: 0,
          twelfth: 0,
          fifteenth: 0,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'interlocking-pairs-roll-between-strokes',
    name: 'Roll between strokes',
    category: 'plucked',
    preview: HALF_SPEED,
    description:
      'A marimba rolled at about twice the pace of the sixteenths while a key is held, standing a little way back in the room.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { volume: -6, roll: 10.4, mallet: 0.4, decay: 0.6, damper: 0.4 },
    },
    effects: [
      {
        deviceId: 'distance',
        params: { distance: 0.35, room: 0.5, air: 0.3, decay: 1, wander: 0 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-vane-at-full-pace',
    name: 'Vane at full pace',
    category: 'bell',
    preview: CORE_AND_NEIGHBOUR,
    description:
      'Vibraphone with hard mallets, its motor turning once a sixteenth, on a medium plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { mallet: 0.75, motor: 1, motorRate: 5.6 },
    },
    effects: [{ deviceId: 'plate-reverb', params: { decay: 0.65, damping: 0.3, mix: 0.3 } }],
  },
  {
    id: 'interlocking-pairs-vane-at-half-pace',
    name: 'Vane at half pace',
    category: 'bell',
    preview: ONE_BEHIND,
    description:
      'Yarn mallets on long vibraphone bars, the motor once an eighth, the tones sagging in pitch as they age.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { mallet: 0.1, decay: 2, motorRate: 2.8 },
    },
    effects: [{ deviceId: 'melt', params: { sag: -20, hold: 4, dim: 0.5, drip: 0, mix: 0.5 } }],
  },
  {
    id: 'interlocking-pairs-dry-sticks-in-pairs',
    name: 'Dry sticks in pairs',
    category: 'plucked',
    preview: FOUR_IN_TWO,
    description:
      'Xylophone with bare hard sticks and hardly any ring, its attacks brought further forward and its tones held down.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { volume: -0.5, decay: 0.5, mallet: 1, resonator: 0.6 },
    },
    effects: [
      {
        deviceId: 'sift',
        params: { tones: -3, attacks: 2, air: -10, soften: 0, hold: 0, scatter: 0.2 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-sticks-in-felt',
    name: 'Sticks in felt',
    category: 'plucked',
    preview: THREE_SHARED,
    description:
      'Xylophone bars under soft heads on slow dictation tape, narrow, driven and swimming a little.',
    instrument: { deviceId: 'mallets', preset: 'Warm xylophone', params: { decay: 1.5 } },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.5, wow: 0.45, flutter: 0.4, speed: 2, age: 0.7, hiss: 0, tone: 0.35 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-small-keys-ahead',
    name: 'Small keys ahead',
    category: 'bell',
    preview: TURN_ABOUT,
    description: 'Short hard glockenspiel keys with the same line sounding an octave below them.',
    instrument: { deviceId: 'mallets', preset: 'Glockenspiel', params: { decay: 0.8 } },
    effects: [
      {
        deviceId: 'pitch-shifter',
        params: { pitchA: -12, levelB: 0, mode: 3, tone: 6000, mix: 0.45 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-small-keys-behind',
    name: 'Small keys behind',
    category: 'bell',
    preview: TURN_ABOUT,
    description:
      'Glockenspiel over its resonators with soft heads, half damped, with a reverse reverb of seven tenths of a second behind.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { volume: -6.5, mallet: 0.05, decay: 0.7, damper: 0.6 },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        params: { shape: 1, time: 0.71, colour: -0.5, highCut: 5000, mix: 0.45 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-a-step-above',
    name: 'A step above',
    category: 'bell',
    preview: POLOS_WAITS,
    description:
      'Celesta playing one line; a second voice answers a sixteenth late, one step up a pelog-like scale on E.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { volume: -1.5, mallet: 0.6, decay: 0.5, damper: 0.9 },
    },
    effects: [
      {
        deviceId: 'lattice',
        params: {
          root: 4,
          scale: 14,
          customOn1: 1,
          customCents1: 0,
          customOn2: 1,
          customCents2: 100,
          customOn3: 0,
          customOn4: 1,
          customCents4: 300,
          customOn5: 0,
          customOn6: 0,
          customOn8: 1,
          customCents8: 700,
          customOn9: 1,
          customCents9: 800,
          customOn10: 0,
          customOn12: 0,
          glide: 0,
          v1Role: 1,
          v1Degrees: 1,
          v1Level: 2,
          v1Pan: 60,
          v1Delay: 179,
          v2Role: 0,
          v3Role: 0,
          v4Role: 0,
          mix: 50,
        },
      },
    ],
  },
  {
    id: 'interlocking-pairs-hammers-in-fog',
    name: 'Hammers in fog',
    category: 'texture',
    preview: CORE_AND_NEIGHBOUR,
    description:
      'An open celesta with its attacks dissolved into a quarter second of soft cloud, the lows cut out.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Open celesta',
      params: { volume: -8.5, decay: 1, mallet: 0.3 },
    },
    effects: [
      {
        deviceId: 'fog',
        params: { size: 260, layers: 2, soften: 0.4, damp: 0.1, lowCut: 150, mix: 1 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-glass-keys-rolled',
    name: 'Glass keys rolled',
    category: 'bell',
    preview: POLOS_WAITS,
    description:
      'Glockenspiel rolled near the pace of the sixteenths and damped, seen through a starved audio stream.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel roll',
      params: { roll: 4.6, mallet: 0.4, damper: 0.8, decay: 1 },
    },
    effects: [{ deviceId: 'low-bitrate', params: { loss: 0.6, mode: 0, frame: 1, highCut: 9000 } }],
  },
  {
    id: 'interlocking-pairs-bars-with-no-vane',
    name: 'Bars with no vane',
    category: 'bell',
    preview: CORE_AND_NEIGHBOUR,
    description:
      'Still vibraphone bars, plainly struck and half damped, turned through a slow four-stage phaser and spread wide.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { volume: -5, mallet: 0.55, decay: 0.9 },
    },
    effects: [
      {
        deviceId: 'phaser',
        params: {
          stages: 0,
          centerHz: 600,
          rate: 0.5,
          depth: 80,
          feedback: 50,
          stereo: 180,
          mix: 0.5,
        },
      },
      { deviceId: 'stereo-detune', params: { detune: 12, delay: 20, mix: 0.4 } },
    ],
  },
  {
    id: 'interlocking-pairs-bamboo-before-noon',
    name: 'Bamboo before noon',
    category: 'plucked',
    preview: BROKEN_OFF,
    description:
      'Firm xylophone strokes sounding inside an open pipe with a breath of air round each note.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { decay: 1, mallet: 0.55, resonator: 1 },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 1, size: 1.2, material: 0.3, opening: 0.7, air: 0.5, mix: 0.75 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-bamboo-after-dark',
    name: 'Bamboo after dark',
    category: 'plucked',
    preview: SEATS_APART,
    description:
      'Soft marimba with a sub octave under it and echoes an eighth apart, each duller and a little lower.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.15, decay: 1.5, resonator: 1 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0.6, up1: 0, filter: 400, spread: 0 } },
      {
        deviceId: 'skipping-stone',
        params: {
          first: 357,
          bounce: 1,
          skips: 5,
          loss: 4,
          sink: 0.7,
          drop: 30,
          throw: 0.8,
          mix: 0.4,
        },
      },
    ],
  },

  // Harp, koto and guzheng strings: nail and silk, near the board and at the middle.
  {
    id: 'interlocking-pairs-nail-on-the-string',
    name: 'Nail on the string',
    category: 'plucked',
    preview: TWO_CELLS,
    description:
      'Koto strings under a hard nail near the bridge, damped on release, in a small hard room and levelled by a limiter.',
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { volume: -2.5, pluck: 0.06, touch: 0.65, decay: 0.8, damp: 0.5, halo: 0.1 },
    },
    effects: [
      {
        deviceId: 'ether-reverb',
        params: { decay: 0.7, damping: 0.1, size: 0.15, predelayMs: 25, mix: 0.3 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 20, outputGain: -8 } },
    ],
  },
  {
    id: 'interlocking-pairs-pad-of-the-finger',
    name: 'Pad of the finger',
    category: 'plucked',
    preview: SEATS_APART,
    description:
      'Silk koto strings plucked with the soft of the finger and pushed a quarter of a semitone, through a low filter opened by each note.',
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { volume: 1, touch: 0.05, pluck: 0.35, decay: 1, bend: 25 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 350,
          resonance: 1.2,
          envAmount: 45,
          envAttackMs: 5,
          envReleaseMs: 250,
        },
      },
    ],
  },
  {
    id: 'interlocking-pairs-harp-of-the-left-hand',
    name: 'Harp of the left hand',
    category: 'plucked',
    preview: THREE_LAYERS,
    description:
      'A concert harp plucked close to the soundboard, its top lifted and a light detuned copy at each side.',
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { volume: 3, touch: 0.8, decay: 1, body: 0.2 },
    },
    effects: [
      { deviceId: 'stereo-detune', params: { detune: 9, delay: 14, tone: 14000, mix: 0.4 } },
      { deviceId: 'ambient-eq', params: { lowCut: 120, body: -3, presence: 3, air: 4 } },
    ],
  },
  {
    id: 'interlocking-pairs-harp-of-the-right-hand',
    name: 'Harp of the right hand',
    category: 'plucked',
    preview: CORE_AND_NEIGHBOUR,
    description:
      'A dark hollow harp plucked at the middle of the string, with slow strings swelling in behind its notes.',
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: 0, decay: 0.9, body: 0.8 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        params: { rise: 0.3, fall: 2, octaves: 0, brightness: 2500, mix: 0.4 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-wire-to-wire',
    name: 'Wire to wire',
    category: 'plucked',
    preview: POLOS_WAITS,
    description:
      'Guzheng wire plucked at its end, one follower a sixteenth behind and another, an octave lower, a sixteenth after that.',
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { volume: 4.5, pluck: 0.09, touch: 0.65, decay: 0.8, damp: 0.6 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 2,
          gap: 0.179,
          interval1: 0,
          interval2: -12,
          fade: 0.2,
          spread: 1,
          tone: 6000,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'interlocking-pairs-wire-let-down',
    name: 'Wire let down',
    category: 'plucked',
    preview: HALF_SPEED,
    description:
      'Guzheng strings at the middle, soft and long, with small pieces of each note dropping a fifth as they fade.',
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { pluck: 0.4, touch: 0.2, decay: 2 },
    },
    effects: [
      {
        deviceId: 'falling',
        params: {
          fall: -7,
          size: 500,
          density: 5,
          scatter: 0.2,
          again: 0.1,
          tone: 4000,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'interlocking-pairs-steel-thread',
    name: 'Steel thread',
    category: 'plucked',
    preview: BROKEN_OFF,
    description:
      'Guzheng strings plucked hard at the very end, cut short on release, rung through sympathetic strings in E minor.',
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { volume: -2, touch: 0.85, decay: 0.8, damp: 0.8, halo: 0.2 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        params: { root: 4, mode: 1, sympathy: 0.7, strings: 8, decay: 2.5, mix: 0.5 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-cotton-thread',
    name: 'Cotton thread',
    category: 'plucked',
    preview: APART_THEN_TOGETHER,
    description:
      'A muted harp with a round body on an old record, its top worn off and a little warp to the pitch.',
    instrument: { deviceId: 'harp', preset: 'Muted harp', params: { touch: 0.1, damp: 1 } },
    effects: [
      {
        deviceId: 'vinyl',
        params: { warp: 0.35, crackle: 0.08, pops: 0, surface: 0.08, wear: 0.6, tone: -0.6 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-glass-strung-between',
    name: 'Glass strung between',
    category: 'pad',
    preview: CHORD_IN_TWO,
    description:
      'Long ringing harp strings with a full halo, caught and held on as an even pad after the fingers leave.',
    instrument: { deviceId: 'harp', preset: 'Long glass ring', params: { touch: 0.3, decay: 2 } },
    effects: [
      {
        deviceId: 'sustainer',
        params: { mode: 0, attack: 0.15, decay: 3, glide: 0.1, motion: 0.4, tone: 0.2, mix: 0.6 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-press-after-press',
    name: 'Press after press',
    category: 'plucked',
    preview: PRESSED_ANSWER,
    description:
      'Koto strings pressed up a whole tone after the pluck, a late vibrato on what is held and one tight spring behind.',
    instrument: {
      deviceId: 'harp',
      preset: 'Whole tone press',
      params: { volume: -0.5, decay: 1.8, touch: 0.35, bend: 200, pluck: 0.16 },
    },
    effects: [
      { deviceId: 'late-vibrato', params: { wait: 300, grow: 500, depth: 30, rate: 5.6, mix: 1 } },
      {
        deviceId: 'spring-reverb',
        params: { decay: 2.5, springs: 0, tension: 0.8, drip: 0.1, drive: 0, mix: 0.45 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-dry-cord-and-knot',
    name: 'Dry cord and knot',
    category: 'plucked',
    preview: FOUR_IN_TWO,
    description:
      'The shortest dry harp pluck with its tail lifted, every quiet end brought up after the snap.',
    instrument: {
      deviceId: 'harp',
      preset: 'Short dry pluck',
      params: { touch: 0.5, pluck: 0.3, body: 0.7, damp: 0.9 },
    },
    effects: [
      {
        deviceId: 'lift',
        params: { threshold: -18, amount: 1, rise: 0.08, hold: 0.02, limit: 24 },
      },
    ],
  },

  // Chord harp: two hands with two notes each, so every press is a small chord and the pair trade chords.
  {
    id: 'interlocking-pairs-chimes-in-fifths',
    name: 'Chimes in fifths',
    category: 'plucked',
    preview: FIFTHS_IN_TURN,
    description:
      'Each key one short clear pluck with no sweep, and a dotted tape echo behind it with a little grit.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Single chimes',
      params: { volume: -5, span: 0, sustain: 1.2, tone: 0.75 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 357,
          feedback: 0.35,
          heads: 3,
          drive: 0.5,
          highCut: 4000,
          spread: 0.6,
          mix: 0.35,
        },
      },
    ],
  },
  {
    id: 'interlocking-pairs-fifths-in-wool',
    name: 'Fifths in wool',
    category: 'pad',
    preview: CHORD_IN_TWO,
    description:
      'A chord brushed four milliseconds a string, muffled, over its own pad, level and colour breathing every second and a half.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Brushed chord',
      params: { span: 0, tone: 0.05, pad: 0.6, sustain: 2 },
    },
    effects: [
      {
        deviceId: 'breath',
        params: {
          in: 0.7,
          hold: 0.1,
          out: 0.7,
          rest: 0.1,
          depth: 0.6,
          colour: 0.6,
          air: 0.1,
          vary: 0,
        },
      },
    ],
  },
  {
    id: 'interlocking-pairs-ripple-of-thirty-seconds',
    name: 'Ripple of thirty-seconds',
    category: 'plucked',
    preview: FIFTHS_IN_TURN,
    description:
      'Each chord rippled up one octave and down again in thirty-seconds, bright, with a slow chorus on its top only.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'One octave ripple',
      params: { volume: 6, strum: 90, sustain: 0.6, tone: 0.8 },
    },
    effects: [
      {
        deviceId: 'chorus',
        params: { voices: 0, rate: 0.3, depth: 30, delayMs: 20, spread: 100, hpHz: 800, mix: 0.4 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-ripple-run-backwards',
    name: 'Ripple run backwards',
    category: 'texture',
    preview: CHORD_IN_TWO,
    description:
      'A slow sweep downwards over two octaves, dull, with a little loop of the last beat played in reverse beneath.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Falling harp',
      params: { volume: -0.5, strum: 100, span: 1, tone: 0.25, sustain: 2.5 },
    },
    effects: [
      {
        deviceId: 'micro-looper',
        params: {
          state: 2,
          length: 0.714,
          speed: 1,
          smear: 0.4,
          drift: 0.1,
          tone: 5000,
          spread: 0.8,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'interlocking-pairs-toy-of-two-rows',
    name: 'Toy of two rows',
    category: 'plucked',
    preview: HALF_SPEED,
    description:
      'A tiny downward flick over two octaves, through a hard twelve-kilohertz converter in eight bits.',
    instrument: { deviceId: 'chord-harp', preset: 'Toy harp', params: { sustain: 0.7, tone: 0.9 } },
    effects: [
      {
        deviceId: 'vintage-digital',
        params: { rate: 12000, bits: 8, companding: 1, aliasing: 0.5, filter: 1, drive: 4 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-organ-in-turn',
    name: 'Organ in turn',
    category: 'organ',
    preview: CHORD_IN_TWO,
    description:
      'The pad of the chord harp with almost no pluck, turning slowly in a rotating cabinet with a warm drive.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Soft organ chord',
      params: { tone: 0.35, sustain: 0.5, span: 1 },
    },
    effects: [
      {
        deviceId: 'rotary',
        params: { speed: 0, hornDepth: 0.7, drumDepth: 0.7, drive: 0.4, mix: 1 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-beads-dropped-in-turn',
    name: 'Beads dropped in turn',
    category: 'texture',
    preview: BROKEN_OFF,
    description:
      'Bright short strings scattered at random over four octaves, sifted by a filter to the notes of E minor.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'String rain',
      params: { strum: 45, sustain: 0.5, tone: 0.85 },
    },
    effects: [
      {
        deviceId: 'scale-filter',
        params: { root: 4, scale: 1, chord: 0, ring: 0.5, depth: 30, glow: 0.4, mix: 0.8 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-pad-and-clasp',
    name: 'Pad and clasp',
    category: 'pad',
    preview: CHORD_IN_TWO,
    description:
      'A quick random sparkle over a strong pad, pumped by a compressor and led round the head in a figure of eight.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Pad and sparkle',
      params: { volume: -7, strum: 15, span: 1, pad: 0.8, tone: 0.45 },
    },
    effects: [
      {
        deviceId: 'ambient-comp',
        params: { threshold: -34, ratio: 6, attack: 10, release: 0.3, knee: 4, makeup: 4 },
      },
      { deviceId: 'around', params: { path: 1, rate: 0.35, radius: 0.9 } },
    ],
  },
  {
    id: 'interlocking-pairs-long-chimes-braided',
    name: 'Long chimes braided',
    category: 'bell',
    preview: FIFTHS_IN_TURN,
    description:
      'Bright chimes of six seconds in three unequal loops that turn against one another and wear away.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Long glass chimes',
      params: { span: 1, sustain: 6, tone: 0.8 },
    },
    effects: [
      {
        deviceId: 'orbits',
        params: { loops: 3, length: 0.714, offset: 3, feedback: 0.6, wear: 0.5, mix: 0.4 },
      },
    ],
  },

  // Ice: two players on one lake, the near stroke and the far answer.
  {
    id: 'interlocking-pairs-near-shore-leads',
    name: 'Near shore leads',
    category: 'bell',
    preview: ONE_BEHIND,
    description:
      'A close strike on thin ice that settles at once on its note, short and dry, held by a limiter.',
    instrument: {
      deviceId: 'ice',
      preset: 'Near ping',
      params: { volume: 4, ring: 1.2, thick: 0.15, crack: 0.2, stretch: 0.1, shore: 0 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 6, outputGain: -3 } },
      { deviceId: 'spread', params: { low: 0.2, mid: 1, high: 1.6 } },
    ],
  },
  {
    id: 'interlocking-pairs-far-shore-follows',
    name: 'Far shore follows',
    category: 'bell',
    preview: ONE_BEHIND,
    description:
      'A strike from far down the lake, its echoes off every shore, with everything over two kilohertz cut away.',
    instrument: {
      deviceId: 'ice',
      preset: 'Far shores',
      params: { distance: 0.7, ring: 4, bright: 0.4 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { low: 3, presence: -6, air: -10, highCut: 2000 } },
    ],
  },
  {
    id: 'interlocking-pairs-two-skaters',
    name: 'Two skaters',
    category: 'bell',
    preview: TWO_CELLS,
    description:
      'Clear pings with no crack and no chirp to speak of, with one or two clean echoes an eighth behind.',
    instrument: {
      deviceId: 'ice',
      preset: 'Clear ping',
      params: { volume: 2.5, ring: 1.5, thick: 0.35, bright: 0.8 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        params: {
          time: 357,
          feedback: 0.15,
          modDepth: 0.1,
          tone: 6000,
          age: 0.05,
          spread: 1,
          mix: 0.4,
        },
      },
    ],
  },
  {
    id: 'interlocking-pairs-plates-that-meet',
    name: 'Plates that meet',
    category: 'bell',
    preview: HALF_SPEED,
    description: 'Stretched partials of a thick plate, the spacing between them squeezed together.',
    instrument: {
      deviceId: 'ice',
      preset: 'Plate tones',
      params: { volume: 2, ring: 3, thick: 0.7, crack: 0.1 },
    },
    effects: [{ deviceId: 'warp', params: { stretch: -0.3, tone: -0.2, mix: 0.8, width: 0.6 } }],
  },
  {
    id: 'interlocking-pairs-snap-and-reply',
    name: 'Snap and reply',
    category: 'plucked',
    preview: BROKEN_OFF,
    description:
      'A brittle snap with a short note in it, put inside a soft-walled bottle that rounds it off.',
    instrument: {
      deviceId: 'ice',
      preset: 'Brittle snap',
      params: { volume: 2.5, ring: 0.8, crack: 0.6, bright: 0.5, thick: 0.6 },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 0, size: 1.2, material: 0.2, opening: 0.4, air: 0, mix: 0.6 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-thaw-between-them',
    name: 'Thaw between them',
    category: 'pad',
    preview: TUNED_APART,
    description:
      'Dark slow ice from far off with nothing cracking, its attacks faded in and its tail climbing by fifths.',
    instrument: {
      deviceId: 'ice',
      preset: 'Slow thaw',
      params: { volume: -1, cracks: 0, ring: 6, distance: 0.6 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 250, sensitivity: -48, release: 150 } },
      {
        deviceId: 'shimmer',
        params: { interval: 1, shimmer: 0.4, decay: 4, tone: 4000, mix: 0.35 },
      },
    ],
  },
  {
    id: 'interlocking-pairs-needles-in-step',
    name: 'Needles in step',
    category: 'bell',
    preview: TURN_ABOUT,
    description:
      'The thinnest ice, bright and quick, chopped into sixteenths from side to side by two soft gates.',
    instrument: {
      deviceId: 'ice',
      preset: 'Thin ice',
      params: { volume: 4, ring: 2.4, distance: 0.1, shore: 0.1, cracks: 0, crack: 0.1 },
    },
    effects: [
      {
        deviceId: 'pulses',
        params: {
          rate: 5.6,
          steps: 2,
          fill: 1,
          drift: 0,
          shift: 1,
          edge: 0.35,
          length: 1,
          floor: 0.3,
          shade: 0.4,
          accent: 0,
        },
      },
    ],
  },
]
