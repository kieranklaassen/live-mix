import { type FactoryPreset, type Phrase } from '../types'

// Two copies of one three-note cell (beats 0, 1 and 2.5 of a bar of four) in bars of slightly different
// length: n + 1 short bars fit where n long ones do, so the copies part, one gains a whole bar, and they meet.
// The hundred were laid out by how far apart the twins stand: in pitch, in place, in colour, in time.

// Nine bars of the cell E G D in the time of eight (0.667 s against 0.75 s), one bar gained, and both on E
// together at the end.
const NINE_OVER_EIGHT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.178, note: 76, gain: 0.51 },
    { atSec: 0, durSec: 0.158, note: 76, gain: 0.41 },
    { atSec: 0.167, durSec: 0.237, note: 79, gain: 0.33 },
    { atSec: 0.188, durSec: 0.267, note: 79, gain: 0.43 },
    { atSec: 0.417, durSec: 0.237, note: 74, gain: 0.36 },
    { atSec: 0.469, durSec: 0.267, note: 74, gain: 0.46 },
    { atSec: 0.667, durSec: 0.158, note: 76, gain: 0.41 },
    { atSec: 0.75, durSec: 0.178, note: 76, gain: 0.51 },
    { atSec: 0.833, durSec: 0.237, note: 79, gain: 0.33 },
    { atSec: 0.938, durSec: 0.267, note: 79, gain: 0.43 },
    { atSec: 1.083, durSec: 0.237, note: 74, gain: 0.36 },
    { atSec: 1.219, durSec: 0.267, note: 74, gain: 0.46 },
    { atSec: 1.333, durSec: 0.158, note: 76, gain: 0.41 },
    { atSec: 1.5, durSec: 0.178, note: 76, gain: 0.51 },
    { atSec: 1.5, durSec: 0.237, note: 79, gain: 0.33 },
    { atSec: 1.688, durSec: 0.267, note: 79, gain: 0.43 },
    { atSec: 1.75, durSec: 0.237, note: 74, gain: 0.36 },
    { atSec: 1.969, durSec: 0.267, note: 74, gain: 0.46 },
    { atSec: 2, durSec: 0.158, note: 76, gain: 0.41 },
    { atSec: 2.167, durSec: 0.237, note: 79, gain: 0.33 },
    { atSec: 2.25, durSec: 0.178, note: 76, gain: 0.51 },
    { atSec: 2.417, durSec: 0.237, note: 74, gain: 0.36 },
    { atSec: 2.438, durSec: 0.267, note: 79, gain: 0.43 },
    { atSec: 2.667, durSec: 0.158, note: 76, gain: 0.41 },
    { atSec: 2.719, durSec: 0.267, note: 74, gain: 0.46 },
    { atSec: 2.833, durSec: 0.237, note: 79, gain: 0.33 },
    { atSec: 3, durSec: 0.178, note: 76, gain: 0.51 },
    { atSec: 3.083, durSec: 0.237, note: 74, gain: 0.36 },
    { atSec: 3.188, durSec: 0.267, note: 79, gain: 0.43 },
    { atSec: 3.333, durSec: 0.158, note: 76, gain: 0.41 },
    { atSec: 3.469, durSec: 0.267, note: 74, gain: 0.46 },
    { atSec: 3.5, durSec: 0.237, note: 79, gain: 0.33 },
    { atSec: 3.75, durSec: 0.237, note: 74, gain: 0.36 },
    { atSec: 3.75, durSec: 0.178, note: 76, gain: 0.51 },
    { atSec: 3.938, durSec: 0.267, note: 79, gain: 0.43 },
    { atSec: 4, durSec: 0.158, note: 76, gain: 0.41 },
    { atSec: 4.167, durSec: 0.237, note: 79, gain: 0.33 },
    { atSec: 4.219, durSec: 0.267, note: 74, gain: 0.46 },
    { atSec: 4.417, durSec: 0.237, note: 74, gain: 0.36 },
    { atSec: 4.5, durSec: 0.178, note: 76, gain: 0.51 },
    { atSec: 4.667, durSec: 0.158, note: 76, gain: 0.41 },
    { atSec: 4.688, durSec: 0.267, note: 79, gain: 0.43 },
    { atSec: 4.833, durSec: 0.237, note: 79, gain: 0.33 },
    { atSec: 4.969, durSec: 0.267, note: 74, gain: 0.46 },
    { atSec: 5.083, durSec: 0.237, note: 74, gain: 0.36 },
    { atSec: 5.25, durSec: 0.178, note: 76, gain: 0.51 },
    { atSec: 5.333, durSec: 0.158, note: 76, gain: 0.41 },
    { atSec: 5.438, durSec: 0.267, note: 79, gain: 0.43 },
    { atSec: 5.5, durSec: 0.237, note: 79, gain: 0.33 },
    { atSec: 5.719, durSec: 0.267, note: 74, gain: 0.46 },
    { atSec: 5.75, durSec: 0.237, note: 74, gain: 0.36 },
    { atSec: 6, durSec: 1.25, note: 76, gain: 0.44 },
    { atSec: 6, durSec: 1.25, note: 76, gain: 0.44 },
  ],
}
// Seven against six, the cell E G D an octave lower: bars of 0.857 s and 1 s.
const SEVEN_OVER_SIX: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.237, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 0.204, note: 64, gain: 0.45 },
    { atSec: 0.214, durSec: 0.305, note: 67, gain: 0.37 },
    { atSec: 0.25, durSec: 0.356, note: 67, gain: 0.47 },
    { atSec: 0.536, durSec: 0.305, note: 62, gain: 0.4 },
    { atSec: 0.625, durSec: 0.356, note: 62, gain: 0.5 },
    { atSec: 0.857, durSec: 0.204, note: 64, gain: 0.45 },
    { atSec: 1, durSec: 0.237, note: 64, gain: 0.55 },
    { atSec: 1.071, durSec: 0.305, note: 67, gain: 0.37 },
    { atSec: 1.25, durSec: 0.356, note: 67, gain: 0.47 },
    { atSec: 1.393, durSec: 0.305, note: 62, gain: 0.4 },
    { atSec: 1.625, durSec: 0.356, note: 62, gain: 0.5 },
    { atSec: 1.714, durSec: 0.204, note: 64, gain: 0.45 },
    { atSec: 1.929, durSec: 0.305, note: 67, gain: 0.37 },
    { atSec: 2, durSec: 0.237, note: 64, gain: 0.55 },
    { atSec: 2.25, durSec: 0.305, note: 62, gain: 0.4 },
    { atSec: 2.25, durSec: 0.356, note: 67, gain: 0.47 },
    { atSec: 2.571, durSec: 0.204, note: 64, gain: 0.45 },
    { atSec: 2.625, durSec: 0.356, note: 62, gain: 0.5 },
    { atSec: 2.786, durSec: 0.305, note: 67, gain: 0.37 },
    { atSec: 3, durSec: 0.237, note: 64, gain: 0.55 },
    { atSec: 3.107, durSec: 0.305, note: 62, gain: 0.4 },
    { atSec: 3.25, durSec: 0.356, note: 67, gain: 0.47 },
    { atSec: 3.429, durSec: 0.204, note: 64, gain: 0.45 },
    { atSec: 3.625, durSec: 0.356, note: 62, gain: 0.5 },
    { atSec: 3.643, durSec: 0.305, note: 67, gain: 0.37 },
    { atSec: 3.964, durSec: 0.305, note: 62, gain: 0.4 },
    { atSec: 4, durSec: 0.237, note: 64, gain: 0.55 },
    { atSec: 4.25, durSec: 0.356, note: 67, gain: 0.47 },
    { atSec: 4.286, durSec: 0.204, note: 64, gain: 0.45 },
    { atSec: 4.5, durSec: 0.305, note: 67, gain: 0.37 },
    { atSec: 4.625, durSec: 0.356, note: 62, gain: 0.5 },
    { atSec: 4.821, durSec: 0.305, note: 62, gain: 0.4 },
    { atSec: 5, durSec: 0.237, note: 64, gain: 0.55 },
    { atSec: 5.143, durSec: 0.204, note: 64, gain: 0.45 },
    { atSec: 5.25, durSec: 0.356, note: 67, gain: 0.47 },
    { atSec: 5.357, durSec: 0.305, note: 67, gain: 0.37 },
    { atSec: 5.625, durSec: 0.356, note: 62, gain: 0.5 },
    { atSec: 5.679, durSec: 0.305, note: 62, gain: 0.4 },
    { atSec: 6, durSec: 1.25, note: 64, gain: 0.48 },
    { atSec: 6, durSec: 1.25, note: 64, gain: 0.48 },
  ],
}
// Five against four an octave apart: the slip is heard as a changing pattern of intervals.
const OCTAVE_TWINS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.332, note: 64, gain: 0.59 },
    { atSec: 0, durSec: 0.266, note: 76, gain: 0.43 },
    { atSec: 0.28, durSec: 0.399, note: 79, gain: 0.35 },
    { atSec: 0.35, durSec: 0.499, note: 67, gain: 0.51 },
    { atSec: 0.7, durSec: 0.399, note: 74, gain: 0.38 },
    { atSec: 0.875, durSec: 0.499, note: 62, gain: 0.54 },
    { atSec: 1.12, durSec: 0.266, note: 76, gain: 0.43 },
    { atSec: 1.4, durSec: 0.332, note: 64, gain: 0.59 },
    { atSec: 1.4, durSec: 0.399, note: 79, gain: 0.35 },
    { atSec: 1.75, durSec: 0.499, note: 67, gain: 0.51 },
    { atSec: 1.82, durSec: 0.399, note: 74, gain: 0.38 },
    { atSec: 2.24, durSec: 0.266, note: 76, gain: 0.43 },
    { atSec: 2.275, durSec: 0.499, note: 62, gain: 0.54 },
    { atSec: 2.52, durSec: 0.399, note: 79, gain: 0.35 },
    { atSec: 2.8, durSec: 0.332, note: 64, gain: 0.59 },
    { atSec: 2.94, durSec: 0.399, note: 74, gain: 0.38 },
    { atSec: 3.15, durSec: 0.499, note: 67, gain: 0.51 },
    { atSec: 3.36, durSec: 0.266, note: 76, gain: 0.43 },
    { atSec: 3.64, durSec: 0.399, note: 79, gain: 0.35 },
    { atSec: 3.675, durSec: 0.499, note: 62, gain: 0.54 },
    { atSec: 4.06, durSec: 0.399, note: 74, gain: 0.38 },
    { atSec: 4.2, durSec: 0.332, note: 64, gain: 0.59 },
    { atSec: 4.48, durSec: 0.266, note: 76, gain: 0.43 },
    { atSec: 4.55, durSec: 0.499, note: 67, gain: 0.51 },
    { atSec: 4.76, durSec: 0.399, note: 79, gain: 0.35 },
    { atSec: 5.075, durSec: 0.499, note: 62, gain: 0.54 },
    { atSec: 5.18, durSec: 0.399, note: 74, gain: 0.38 },
    { atSec: 5.6, durSec: 1.25, note: 64, gain: 0.48 },
    { atSec: 5.6, durSec: 1.25, note: 76, gain: 0.48 },
  ],
}
// Six against five, the second copy a fifth above: A C G under E G D. The two meet as open fifths, then come
// apart.
const FIFTH_TWINS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.285, note: 57, gain: 0.55 },
    { atSec: 0, durSec: 0.237, note: 64, gain: 0.47 },
    { atSec: 0.25, durSec: 0.356, note: 67, gain: 0.39 },
    { atSec: 0.3, durSec: 0.427, note: 60, gain: 0.47 },
    { atSec: 0.625, durSec: 0.356, note: 62, gain: 0.42 },
    { atSec: 0.75, durSec: 0.427, note: 55, gain: 0.5 },
    { atSec: 1, durSec: 0.237, note: 64, gain: 0.47 },
    { atSec: 1.2, durSec: 0.285, note: 57, gain: 0.55 },
    { atSec: 1.25, durSec: 0.356, note: 67, gain: 0.39 },
    { atSec: 1.5, durSec: 0.427, note: 60, gain: 0.47 },
    { atSec: 1.625, durSec: 0.356, note: 62, gain: 0.42 },
    { atSec: 1.95, durSec: 0.427, note: 55, gain: 0.5 },
    { atSec: 2, durSec: 0.237, note: 64, gain: 0.47 },
    { atSec: 2.25, durSec: 0.356, note: 67, gain: 0.39 },
    { atSec: 2.4, durSec: 0.285, note: 57, gain: 0.55 },
    { atSec: 2.625, durSec: 0.356, note: 62, gain: 0.42 },
    { atSec: 2.7, durSec: 0.427, note: 60, gain: 0.47 },
    { atSec: 3, durSec: 0.237, note: 64, gain: 0.47 },
    { atSec: 3.15, durSec: 0.427, note: 55, gain: 0.5 },
    { atSec: 3.25, durSec: 0.356, note: 67, gain: 0.39 },
    { atSec: 3.6, durSec: 0.285, note: 57, gain: 0.55 },
    { atSec: 3.625, durSec: 0.356, note: 62, gain: 0.42 },
    { atSec: 3.9, durSec: 0.427, note: 60, gain: 0.47 },
    { atSec: 4, durSec: 0.237, note: 64, gain: 0.47 },
    { atSec: 4.25, durSec: 0.356, note: 67, gain: 0.39 },
    { atSec: 4.35, durSec: 0.427, note: 55, gain: 0.5 },
    { atSec: 4.625, durSec: 0.356, note: 62, gain: 0.42 },
    { atSec: 4.8, durSec: 0.285, note: 57, gain: 0.55 },
    { atSec: 5, durSec: 0.237, note: 64, gain: 0.47 },
    { atSec: 5.1, durSec: 0.427, note: 60, gain: 0.47 },
    { atSec: 5.25, durSec: 0.356, note: 67, gain: 0.39 },
    { atSec: 5.55, durSec: 0.427, note: 55, gain: 0.5 },
    { atSec: 5.625, durSec: 0.356, note: 62, gain: 0.42 },
    { atSec: 6, durSec: 1.25, note: 57, gain: 0.48 },
    { atSec: 6, durSec: 1.25, note: 64, gain: 0.48 },
  ],
}
// Four against three on A C G over held fifths: A and E, D and A, then A and E again as the copies meet.
const OVER_A_PEDAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.9, note: 45, gain: 0.42 },
    { atSec: 0, durSec: 2.9, note: 52, gain: 0.36 },
    { atSec: 0, durSec: 0.475, note: 69, gain: 0.55 },
    { atSec: 0, durSec: 0.356, note: 69, gain: 0.45 },
    { atSec: 0.375, durSec: 0.534, note: 72, gain: 0.37 },
    { atSec: 0.5, durSec: 0.712, note: 72, gain: 0.47 },
    { atSec: 0.938, durSec: 0.534, note: 67, gain: 0.4 },
    { atSec: 1.25, durSec: 0.712, note: 67, gain: 0.5 },
    { atSec: 1.5, durSec: 0.356, note: 69, gain: 0.45 },
    { atSec: 1.875, durSec: 0.534, note: 72, gain: 0.37 },
    { atSec: 2, durSec: 0.475, note: 69, gain: 0.55 },
    { atSec: 2.438, durSec: 0.534, note: 67, gain: 0.4 },
    { atSec: 2.5, durSec: 0.712, note: 72, gain: 0.47 },
    { atSec: 3, durSec: 2.9, note: 50, gain: 0.42 },
    { atSec: 3, durSec: 2.9, note: 57, gain: 0.36 },
    { atSec: 3, durSec: 0.356, note: 69, gain: 0.45 },
    { atSec: 3.25, durSec: 0.712, note: 67, gain: 0.5 },
    { atSec: 3.375, durSec: 0.534, note: 72, gain: 0.37 },
    { atSec: 3.938, durSec: 0.534, note: 67, gain: 0.4 },
    { atSec: 4, durSec: 0.475, note: 69, gain: 0.55 },
    { atSec: 4.5, durSec: 0.356, note: 69, gain: 0.45 },
    { atSec: 4.5, durSec: 0.712, note: 72, gain: 0.47 },
    { atSec: 4.875, durSec: 0.534, note: 72, gain: 0.37 },
    { atSec: 5.25, durSec: 0.712, note: 67, gain: 0.5 },
    { atSec: 5.438, durSec: 0.534, note: 67, gain: 0.4 },
    { atSec: 6, durSec: 1.3, note: 45, gain: 0.42 },
    { atSec: 6, durSec: 1.3, note: 52, gain: 0.36 },
    { atSec: 6, durSec: 1.25, note: 69, gain: 0.46 },
    { atSec: 6, durSec: 1.25, note: 69, gain: 0.46 },
  ],
}
// Four against three with the second copy eight cents sharp: where the two meet, the unison beats.
const HAIR_APART: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.475, note: 64, gain: 0.57 },
    { atSec: 0, durSec: 0.356, note: 64.08, gain: 0.51 },
    { atSec: 0.375, durSec: 0.534, note: 67.08, gain: 0.43 },
    { atSec: 0.5, durSec: 0.712, note: 67, gain: 0.49 },
    { atSec: 0.938, durSec: 0.534, note: 62.08, gain: 0.46 },
    { atSec: 1.25, durSec: 0.712, note: 62, gain: 0.52 },
    { atSec: 1.5, durSec: 0.356, note: 64.08, gain: 0.51 },
    { atSec: 1.875, durSec: 0.534, note: 67.08, gain: 0.43 },
    { atSec: 2, durSec: 0.475, note: 64, gain: 0.57 },
    { atSec: 2.438, durSec: 0.534, note: 62.08, gain: 0.46 },
    { atSec: 2.5, durSec: 0.712, note: 67, gain: 0.49 },
    { atSec: 3, durSec: 0.356, note: 64.08, gain: 0.51 },
    { atSec: 3.25, durSec: 0.712, note: 62, gain: 0.52 },
    { atSec: 3.375, durSec: 0.534, note: 67.08, gain: 0.43 },
    { atSec: 3.938, durSec: 0.534, note: 62.08, gain: 0.46 },
    { atSec: 4, durSec: 0.475, note: 64, gain: 0.57 },
    { atSec: 4.5, durSec: 0.356, note: 64.08, gain: 0.51 },
    { atSec: 4.5, durSec: 0.712, note: 67, gain: 0.49 },
    { atSec: 4.875, durSec: 0.534, note: 67.08, gain: 0.43 },
    { atSec: 5.25, durSec: 0.712, note: 62, gain: 0.52 },
    { atSec: 5.438, durSec: 0.534, note: 62.08, gain: 0.46 },
    { atSec: 6, durSec: 1.25, note: 64, gain: 0.5 },
    { atSec: 6, durSec: 1.25, note: 64.08, gain: 0.5 },
  ],
}
// The first three bars of eight against nine, slowly, on A C E: the second copy is 0.22 s ahead, then 0.44 s,
// then 0.67 s.
const SETTING_OUT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.475, note: 69, gain: 0.59 },
    { atSec: 0, durSec: 0.422, note: 69, gain: 0.47 },
    { atSec: 0.444, durSec: 0.633, note: 72, gain: 0.39 },
    { atSec: 0.5, durSec: 0.712, note: 72, gain: 0.51 },
    { atSec: 1.111, durSec: 0.633, note: 64, gain: 0.42 },
    { atSec: 1.25, durSec: 0.712, note: 64, gain: 0.54 },
    { atSec: 1.778, durSec: 0.422, note: 69, gain: 0.47 },
    { atSec: 2, durSec: 0.475, note: 69, gain: 0.59 },
    { atSec: 2.222, durSec: 0.633, note: 72, gain: 0.39 },
    { atSec: 2.5, durSec: 0.712, note: 72, gain: 0.51 },
    { atSec: 2.889, durSec: 0.633, note: 64, gain: 0.42 },
    { atSec: 3.25, durSec: 0.712, note: 64, gain: 0.54 },
    { atSec: 3.556, durSec: 0.422, note: 69, gain: 0.47 },
    { atSec: 4, durSec: 0.475, note: 69, gain: 0.59 },
    { atSec: 4, durSec: 0.633, note: 72, gain: 0.39 },
    { atSec: 4.5, durSec: 0.712, note: 72, gain: 0.51 },
    { atSec: 4.667, durSec: 0.633, note: 64, gain: 0.42 },
    { atSec: 5.25, durSec: 0.712, note: 64, gain: 0.54 },
    { atSec: 5.333, durSec: 0.422, note: 69, gain: 0.47 },
    { atSec: 5.778, durSec: 0.633, note: 72, gain: 0.39 },
    { atSec: 6, durSec: 1.25, note: 69, gain: 0.5 },
    { atSec: 6.444, durSec: 0.8, note: 64, gain: 0.42 },
  ],
}
// The last three bars of the same slip, on E B D: the gap closes from 0.67 s to 0.44, to 0.22, to nothing.
const HOMEWARD: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.475, note: 76, gain: 0.57 },
    { atSec: 0.5, durSec: 0.712, note: 71, gain: 0.49 },
    { atSec: 0.667, durSec: 0.422, note: 76, gain: 0.47 },
    { atSec: 1.111, durSec: 0.633, note: 71, gain: 0.39 },
    { atSec: 1.25, durSec: 0.712, note: 74, gain: 0.52 },
    { atSec: 1.778, durSec: 0.633, note: 74, gain: 0.42 },
    { atSec: 2, durSec: 0.475, note: 76, gain: 0.57 },
    { atSec: 2.444, durSec: 0.422, note: 76, gain: 0.47 },
    { atSec: 2.5, durSec: 0.712, note: 71, gain: 0.49 },
    { atSec: 2.889, durSec: 0.633, note: 71, gain: 0.39 },
    { atSec: 3.25, durSec: 0.712, note: 74, gain: 0.52 },
    { atSec: 3.556, durSec: 0.633, note: 74, gain: 0.42 },
    { atSec: 4, durSec: 0.475, note: 76, gain: 0.57 },
    { atSec: 4.222, durSec: 0.422, note: 76, gain: 0.47 },
    { atSec: 4.5, durSec: 0.712, note: 71, gain: 0.49 },
    { atSec: 4.667, durSec: 0.633, note: 71, gain: 0.39 },
    { atSec: 5.25, durSec: 0.712, note: 74, gain: 0.52 },
    { atSec: 5.333, durSec: 0.633, note: 74, gain: 0.42 },
    { atSec: 6, durSec: 1.35, note: 76, gain: 0.5 },
    { atSec: 6, durSec: 1.35, note: 76, gain: 0.5 },
  ],
}
// The same way home where a pan is most at home, on A E G.
const HOMEWARD_LOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.475, note: 69, gain: 0.57 },
    { atSec: 0.5, durSec: 0.712, note: 64, gain: 0.49 },
    { atSec: 0.667, durSec: 0.422, note: 69, gain: 0.47 },
    { atSec: 1.111, durSec: 0.633, note: 64, gain: 0.39 },
    { atSec: 1.25, durSec: 0.712, note: 67, gain: 0.52 },
    { atSec: 1.778, durSec: 0.633, note: 67, gain: 0.42 },
    { atSec: 2, durSec: 0.475, note: 69, gain: 0.57 },
    { atSec: 2.444, durSec: 0.422, note: 69, gain: 0.47 },
    { atSec: 2.5, durSec: 0.712, note: 64, gain: 0.49 },
    { atSec: 2.889, durSec: 0.633, note: 64, gain: 0.39 },
    { atSec: 3.25, durSec: 0.712, note: 67, gain: 0.52 },
    { atSec: 3.556, durSec: 0.633, note: 67, gain: 0.42 },
    { atSec: 4, durSec: 0.475, note: 69, gain: 0.57 },
    { atSec: 4.222, durSec: 0.422, note: 69, gain: 0.47 },
    { atSec: 4.5, durSec: 0.712, note: 64, gain: 0.49 },
    { atSec: 4.667, durSec: 0.633, note: 64, gain: 0.39 },
    { atSec: 5.25, durSec: 0.712, note: 67, gain: 0.52 },
    { atSec: 5.333, durSec: 0.633, note: 67, gain: 0.42 },
    { atSec: 6, durSec: 1.35, note: 69, gain: 0.5 },
    { atSec: 6, durSec: 1.35, note: 69, gain: 0.5 },
  ],
}
// A slip by steps on D A E G: each bar the second copy is one note further on. The bars open on a unison, a
// fifth, a second, a fourth and a unison.
const ONE_STEP_A_BAR: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.28, note: 62, gain: 0.54 },
    { atSec: 0, durSec: 0.28, note: 62, gain: 0.38 },
    { atSec: 0.3, durSec: 0.28, note: 69, gain: 0.46 },
    { atSec: 0.3, durSec: 0.28, note: 69, gain: 0.38 },
    { atSec: 0.6, durSec: 0.28, note: 64, gain: 0.46 },
    { atSec: 0.6, durSec: 0.28, note: 64, gain: 0.38 },
    { atSec: 0.9, durSec: 0.28, note: 67, gain: 0.46 },
    { atSec: 0.9, durSec: 0.28, note: 67, gain: 0.38 },
    { atSec: 1.2, durSec: 0.28, note: 62, gain: 0.54 },
    { atSec: 1.2, durSec: 0.28, note: 69, gain: 0.38 },
    { atSec: 1.5, durSec: 0.28, note: 64, gain: 0.38 },
    { atSec: 1.5, durSec: 0.28, note: 69, gain: 0.46 },
    { atSec: 1.8, durSec: 0.28, note: 64, gain: 0.46 },
    { atSec: 1.8, durSec: 0.28, note: 67, gain: 0.38 },
    { atSec: 2.1, durSec: 0.28, note: 62, gain: 0.38 },
    { atSec: 2.1, durSec: 0.28, note: 67, gain: 0.46 },
    { atSec: 2.4, durSec: 0.28, note: 62, gain: 0.54 },
    { atSec: 2.4, durSec: 0.28, note: 64, gain: 0.38 },
    { atSec: 2.7, durSec: 0.28, note: 67, gain: 0.38 },
    { atSec: 2.7, durSec: 0.28, note: 69, gain: 0.46 },
    { atSec: 3, durSec: 0.28, note: 62, gain: 0.38 },
    { atSec: 3, durSec: 0.28, note: 64, gain: 0.46 },
    { atSec: 3.3, durSec: 0.28, note: 67, gain: 0.46 },
    { atSec: 3.3, durSec: 0.28, note: 69, gain: 0.38 },
    { atSec: 3.6, durSec: 0.28, note: 62, gain: 0.54 },
    { atSec: 3.6, durSec: 0.28, note: 67, gain: 0.38 },
    { atSec: 3.9, durSec: 0.28, note: 62, gain: 0.38 },
    { atSec: 3.9, durSec: 0.28, note: 69, gain: 0.46 },
    { atSec: 4.2, durSec: 0.28, note: 64, gain: 0.46 },
    { atSec: 4.2, durSec: 0.28, note: 69, gain: 0.38 },
    { atSec: 4.5, durSec: 0.28, note: 64, gain: 0.38 },
    { atSec: 4.5, durSec: 0.28, note: 67, gain: 0.46 },
    { atSec: 4.8, durSec: 0.28, note: 62, gain: 0.54 },
    { atSec: 4.8, durSec: 0.28, note: 62, gain: 0.38 },
    { atSec: 5.1, durSec: 0.28, note: 69, gain: 0.46 },
    { atSec: 5.1, durSec: 0.28, note: 69, gain: 0.38 },
    { atSec: 5.4, durSec: 0.28, note: 64, gain: 0.46 },
    { atSec: 5.4, durSec: 0.28, note: 64, gain: 0.38 },
    { atSec: 5.7, durSec: 0.28, note: 67, gain: 0.46 },
    { atSec: 5.7, durSec: 0.28, note: 67, gain: 0.38 },
    { atSec: 6, durSec: 1.25, note: 62, gain: 0.48 },
    { atSec: 6, durSec: 1.25, note: 62, gain: 0.48 },
  ],
}
// Three against two, very sparse, on the stacked fifths D A E: bars of 2 s and 3 s.
const THREE_OVER_TWO: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.712, note: 50, gain: 0.57 },
    { atSec: 0, durSec: 0.475, note: 50, gain: 0.47 },
    { atSec: 0.5, durSec: 0.712, note: 57, gain: 0.39 },
    { atSec: 0.75, durSec: 1.069, note: 57, gain: 0.49 },
    { atSec: 1.25, durSec: 0.712, note: 64, gain: 0.42 },
    { atSec: 1.875, durSec: 1.069, note: 64, gain: 0.52 },
    { atSec: 2, durSec: 0.475, note: 50, gain: 0.47 },
    { atSec: 2.5, durSec: 0.712, note: 57, gain: 0.39 },
    { atSec: 3, durSec: 0.712, note: 50, gain: 0.57 },
    { atSec: 3.25, durSec: 0.712, note: 64, gain: 0.42 },
    { atSec: 3.75, durSec: 1.069, note: 57, gain: 0.49 },
    { atSec: 4, durSec: 0.475, note: 50, gain: 0.47 },
    { atSec: 4.5, durSec: 0.712, note: 57, gain: 0.39 },
    { atSec: 4.875, durSec: 1.069, note: 64, gain: 0.52 },
    { atSec: 5.25, durSec: 0.712, note: 64, gain: 0.42 },
    { atSec: 6, durSec: 1.35, note: 50, gain: 0.5 },
    { atSec: 6, durSec: 1.35, note: 50, gain: 0.46 },
  ],
}
// Five against four a tenth apart inside the key: C E B under E G D.
const TENTH_TWINS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.356, note: 60, gain: 0.55 },
    { atSec: 0, durSec: 0.285, note: 76, gain: 0.43 },
    { atSec: 0.3, durSec: 0.427, note: 79, gain: 0.35 },
    { atSec: 0.375, durSec: 0.534, note: 64, gain: 0.47 },
    { atSec: 0.75, durSec: 0.427, note: 74, gain: 0.38 },
    { atSec: 0.938, durSec: 0.534, note: 59, gain: 0.5 },
    { atSec: 1.2, durSec: 0.285, note: 76, gain: 0.43 },
    { atSec: 1.5, durSec: 0.356, note: 60, gain: 0.55 },
    { atSec: 1.5, durSec: 0.427, note: 79, gain: 0.35 },
    { atSec: 1.875, durSec: 0.534, note: 64, gain: 0.47 },
    { atSec: 1.95, durSec: 0.427, note: 74, gain: 0.38 },
    { atSec: 2.4, durSec: 0.285, note: 76, gain: 0.43 },
    { atSec: 2.438, durSec: 0.534, note: 59, gain: 0.5 },
    { atSec: 2.7, durSec: 0.427, note: 79, gain: 0.35 },
    { atSec: 3, durSec: 0.356, note: 60, gain: 0.55 },
    { atSec: 3.15, durSec: 0.427, note: 74, gain: 0.38 },
    { atSec: 3.375, durSec: 0.534, note: 64, gain: 0.47 },
    { atSec: 3.6, durSec: 0.285, note: 76, gain: 0.43 },
    { atSec: 3.9, durSec: 0.427, note: 79, gain: 0.35 },
    { atSec: 3.938, durSec: 0.534, note: 59, gain: 0.5 },
    { atSec: 4.35, durSec: 0.427, note: 74, gain: 0.38 },
    { atSec: 4.5, durSec: 0.356, note: 60, gain: 0.55 },
    { atSec: 4.8, durSec: 0.285, note: 76, gain: 0.43 },
    { atSec: 4.875, durSec: 0.534, note: 64, gain: 0.47 },
    { atSec: 5.1, durSec: 0.427, note: 79, gain: 0.35 },
    { atSec: 5.438, durSec: 0.534, note: 59, gain: 0.5 },
    { atSec: 5.55, durSec: 0.427, note: 74, gain: 0.38 },
    { atSec: 6, durSec: 1.25, note: 60, gain: 0.46 },
    { atSec: 6, durSec: 1.25, note: 76, gain: 0.46 },
  ],
}
// Three against two for what speaks slowly: each note is held over the next. Open fifths A-E, C-G, G-D in
// bars of 3 s under E G D in bars of 2 s.
const HELD_TWINS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.15, note: 76, gain: 0.42 },
    { atSec: 0, durSec: 1.8, note: 57, gain: 0.45 },
    { atSec: 0, durSec: 1.8, note: 64, gain: 0.45 },
    { atSec: 0.5, durSec: 1.4, note: 79, gain: 0.34 },
    { atSec: 0.75, durSec: 2.1, note: 60, gain: 0.38 },
    { atSec: 0.75, durSec: 2.1, note: 67, gain: 0.38 },
    { atSec: 1.25, durSec: 1.2, note: 74, gain: 0.37 },
    { atSec: 1.875, durSec: 1.08, note: 55, gain: 0.4 },
    { atSec: 1.875, durSec: 1.08, note: 62, gain: 0.4 },
    { atSec: 2, durSec: 1.15, note: 76, gain: 0.42 },
    { atSec: 2.5, durSec: 1.4, note: 79, gain: 0.34 },
    { atSec: 3, durSec: 1.8, note: 57, gain: 0.45 },
    { atSec: 3, durSec: 1.8, note: 64, gain: 0.45 },
    { atSec: 3.25, durSec: 1.2, note: 74, gain: 0.37 },
    { atSec: 3.75, durSec: 2.1, note: 60, gain: 0.38 },
    { atSec: 3.75, durSec: 2.1, note: 67, gain: 0.38 },
    { atSec: 4, durSec: 1.15, note: 76, gain: 0.42 },
    { atSec: 4.5, durSec: 1.45, note: 79, gain: 0.34 },
    { atSec: 4.875, durSec: 1.08, note: 55, gain: 0.4 },
    { atSec: 4.875, durSec: 1.08, note: 62, gain: 0.4 },
    { atSec: 5.25, durSec: 1.2, note: 74, gain: 0.37 },
    { atSec: 6, durSec: 1.35, note: 57, gain: 0.42 },
    { atSec: 6, durSec: 1.35, note: 64, gain: 0.42 },
    { atSec: 6, durSec: 1.35, note: 76, gain: 0.42 },
  ],
}
// Eight against seven at the top of the keyboard, on C E A.
const EIGHT_OVER_SEVEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.19, note: 84, gain: 0.51 },
    { atSec: 0, durSec: 0.166, note: 84, gain: 0.41 },
    { atSec: 0.175, durSec: 0.249, note: 88, gain: 0.33 },
    { atSec: 0.2, durSec: 0.285, note: 88, gain: 0.43 },
    { atSec: 0.438, durSec: 0.249, note: 81, gain: 0.36 },
    { atSec: 0.5, durSec: 0.285, note: 81, gain: 0.46 },
    { atSec: 0.7, durSec: 0.166, note: 84, gain: 0.41 },
    { atSec: 0.8, durSec: 0.19, note: 84, gain: 0.51 },
    { atSec: 0.875, durSec: 0.249, note: 88, gain: 0.33 },
    { atSec: 1, durSec: 0.285, note: 88, gain: 0.43 },
    { atSec: 1.137, durSec: 0.249, note: 81, gain: 0.36 },
    { atSec: 1.3, durSec: 0.285, note: 81, gain: 0.46 },
    { atSec: 1.4, durSec: 0.166, note: 84, gain: 0.41 },
    { atSec: 1.575, durSec: 0.249, note: 88, gain: 0.33 },
    { atSec: 1.6, durSec: 0.19, note: 84, gain: 0.51 },
    { atSec: 1.8, durSec: 0.285, note: 88, gain: 0.43 },
    { atSec: 1.837, durSec: 0.249, note: 81, gain: 0.36 },
    { atSec: 2.1, durSec: 0.285, note: 81, gain: 0.46 },
    { atSec: 2.1, durSec: 0.166, note: 84, gain: 0.41 },
    { atSec: 2.275, durSec: 0.249, note: 88, gain: 0.33 },
    { atSec: 2.4, durSec: 0.19, note: 84, gain: 0.51 },
    { atSec: 2.537, durSec: 0.249, note: 81, gain: 0.36 },
    { atSec: 2.6, durSec: 0.285, note: 88, gain: 0.43 },
    { atSec: 2.8, durSec: 0.166, note: 84, gain: 0.41 },
    { atSec: 2.9, durSec: 0.285, note: 81, gain: 0.46 },
    { atSec: 2.975, durSec: 0.249, note: 88, gain: 0.33 },
    { atSec: 3.2, durSec: 0.19, note: 84, gain: 0.51 },
    { atSec: 3.237, durSec: 0.249, note: 81, gain: 0.36 },
    { atSec: 3.4, durSec: 0.285, note: 88, gain: 0.43 },
    { atSec: 3.5, durSec: 0.166, note: 84, gain: 0.41 },
    { atSec: 3.675, durSec: 0.249, note: 88, gain: 0.33 },
    { atSec: 3.7, durSec: 0.285, note: 81, gain: 0.46 },
    { atSec: 3.937, durSec: 0.249, note: 81, gain: 0.36 },
    { atSec: 4, durSec: 0.19, note: 84, gain: 0.51 },
    { atSec: 4.2, durSec: 0.166, note: 84, gain: 0.41 },
    { atSec: 4.2, durSec: 0.285, note: 88, gain: 0.43 },
    { atSec: 4.375, durSec: 0.249, note: 88, gain: 0.33 },
    { atSec: 4.5, durSec: 0.285, note: 81, gain: 0.46 },
    { atSec: 4.637, durSec: 0.249, note: 81, gain: 0.36 },
    { atSec: 4.8, durSec: 0.19, note: 84, gain: 0.51 },
    { atSec: 4.9, durSec: 0.166, note: 84, gain: 0.41 },
    { atSec: 5, durSec: 0.285, note: 88, gain: 0.43 },
    { atSec: 5.075, durSec: 0.249, note: 88, gain: 0.33 },
    { atSec: 5.3, durSec: 0.285, note: 81, gain: 0.46 },
    { atSec: 5.337, durSec: 0.249, note: 81, gain: 0.36 },
    { atSec: 5.6, durSec: 1.4, note: 84, gain: 0.44 },
    { atSec: 5.6, durSec: 1.4, note: 84, gain: 0.44 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Twin bars: the two bars of one key are the smallest twins there are. Laid out by beat, by stuff and by damping.
  {
    id: 'slow-phase-slip-two-church-clocks',
    name: 'Two church clocks',
    category: 'bell',
    description:
      'Twin metal bars that beat less than once a second, soft and long, set far back in a stone room of five seconds.',
    preview: SETTING_OUT,
    instrument: {
      deviceId: 'twin-bars',
      params: {
        volume: -3.5,
        beat: 0.7,
        ears: 0.9,
        mallet: 0.25,
        decay: 14,
        damp: 0.1,
        tone: 0.35,
      },
    },
    effects: [
      {
        deviceId: 'distance',
        params: { distance: 0.6, room: 0.7, air: 0.3, wander: 0, decay: 5, level: 1 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-indicator-lights',
    name: 'Indicator lights',
    category: 'keys',
    description:
      'Short hard wood bars, six beats a second, with clear echoes a ninth of a two-second bar apart that fade in a few turns.',
    preview: NINE_OVER_EIGHT,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Wood knock',
      params: { volume: 3, ears: 0.4, decay: 0.7, tone: 0.6 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        params: {
          time: 222,
          feedback: 0.3,
          modDepth: 0.05,
          tone: 7500,
          age: 0.05,
          spread: 1,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-windscreen-wipers',
    name: 'Windscreen wipers',
    category: 'keys',
    description:
      'Soft wood bars swept from side to side three times in four seconds, with a short tank of springs behind.',
    preview: SEVEN_OVER_SIX,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Soft wood hum',
      params: { volume: -4, beat: 2, mallet: 0.12, decay: 2.6, tone: 0.3, ears: 0.2 },
    },
    effects: [
      { deviceId: 'tremolo', params: { mode: 1, rate: 0.75, depth: 0.95, drift: 0, smooth: 0.4 } },
      {
        deviceId: 'spring-reverb',
        params: { decay: 1.6, springs: 2, tone: 2600, drip: 0.3, mix: 0.3 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-twin-lighthouses',
    name: 'Twin lighthouses',
    category: 'bell',
    description:
      'Glass bars half a hertz apart, one in each ear, swinging slowly on a wide arc in an open space of fifteen seconds.',
    preview: THREE_OVER_TWO,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Slow sway',
      params: { volume: -4.5, mallet: 0.3, decay: 18, tone: 0.55 },
    },
    effects: [
      { deviceId: 'around', params: { path: 2, rate: 0.13, radius: 1, head: 0.8, blur: 0.2 } },
      {
        deviceId: 'expanse',
        params: { size: 0.8, decay: 15, highCut: 9000, lowCut: 250, mix: 0.45 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-playground-swings',
    name: 'Playground swings',
    category: 'pad',
    description:
      'Metal bars with the stroke taken off: each note fades in over half a second, thickened by a slow three-voice chorus.',
    preview: HELD_TWINS,
    instrument: {
      deviceId: 'twin-bars',
      params: { volume: 4.5, beat: 2, mallet: 0.35, decay: 9, damp: 0, tone: 0.4 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 520, sensitivity: -50, curve: 0.5 } },
      { deviceId: 'chorus', params: { rate: 0.15, depth: 70, delayMs: 18, spread: 100, mix: 0.5 } },
    ],
  },
  {
    id: 'slow-phase-slip-vernier-marks',
    name: 'Vernier marks',
    category: 'bell',
    description:
      'Bright damped glass, twelve beats a second, its left side pushed up and its right side down by three hertz more.',
    preview: HAIR_APART,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Twelve, glass',
      params: { volume: 0, mallet: 0.8, decay: 1.6, tone: 0.85 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: {
          fine: 3,
          mode: 2,
          feedback: 0.35,
          delay: 90,
          lfoDepth: 0,
          tone: 9000,
          width: 1,
          mix: 0.6,
        },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 220, low: -6, air: 4 } },
    ],
  },
  {
    id: 'slow-phase-slip-loose-gears',
    name: 'Loose gears',
    category: 'keys',
    description:
      'Hard wood bars struck forty milliseconds apart so each note is a flam, played inside the body of a small drum.',
    preview: SEVEN_OVER_SIX,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Flam of wood',
      params: { volume: 1.5, scatter: 40, mallet: 0.85, decay: 0.9, ears: 1 },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: {
          body: 4,
          size: 0.7,
          material: 0.35,
          opening: 0.4,
          air: 0.1,
          position: 0.2,
          width: 0.8,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-stairs-side-by-side',
    name: 'Stairs side by side',
    category: 'bell',
    description:
      'Metal bars of middle length answered by grains an octave up, and by that octave again, climbing at each repeat.',
    preview: OCTAVE_TWINS,
    instrument: {
      deviceId: 'twin-bars',
      params: { volume: 0.5, beat: 5, ears: 0.5, mallet: 0.45, decay: 3.2, damp: 0.5, tone: 0.45 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        params: {
          time: 560,
          spray: 0.05,
          pitch: 12,
          pitchSpray: 0,
          size: 160,
          feedback: 0.4,
          tone: 8000,
          spread: 1,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-slipping-clutch',
    name: 'Slipping clutch',
    category: 'keys',
    description:
      'Dark metal driven into tape, under a low-pass that opens with each stroke and shuts as the two bars beat on.',
    preview: FIFTH_TWINS,
    instrument: {
      deviceId: 'twin-bars',
      params: { volume: -14.5, beat: 3, ears: 0.3, mallet: 0.6, decay: 4, damp: 0.2, tone: 0.3 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 14, toneDb: -2, outputDb: -6 } },
      {
        deviceId: 'auto-filter',
        params: {
          cutoffHz: 260,
          resonance: 1.6,
          envAmount: 70,
          envAttackMs: 4,
          envReleaseMs: 420,
          slope: 1,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-trams-passing',
    name: 'Trams passing',
    category: 'texture',
    description:
      'Bright scattered metal through a wide slow flange with strong negative feedback, then carried right round the head.',
    preview: SETTING_OUT,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Scattered metal',
      params: { volume: -0.5, mallet: 0.65, tone: 0.8, decay: 7 },
    },
    effects: [
      {
        deviceId: 'flanger',
        params: { delayMs: 5, rate: 0.11, depth: 80, feedback: -65, stereo: 180, mix: 0.5 },
      },
      { deviceId: 'around', params: { path: 0, rate: 0.28, radius: 0.95, near: 0.4, head: 0.9 } },
    ],
  },
  {
    id: 'slow-phase-slip-level-crossing',
    name: 'Level crossing',
    category: 'bell',
    description:
      'The hardest mallet on metal, eight beats a second and quickly gone, its middle band gated five times a second.',
    preview: NINE_OVER_EIGHT,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Eight, hard',
      params: { volume: 3, decay: 1.5, ears: 0.2, damp: 0.5 },
    },
    effects: [
      {
        deviceId: 'band-pulse',
        params: { rate: 5, depth: 0.85, duty: 0.4, edge: 8, low: 400, high: 4000, offset: 180 },
      },
      { deviceId: 'plate-reverb', params: { decay: 0.45, damping: 0.1, predelayMs: 8, mix: 0.22 } },
    ],
  },
  {
    id: 'slow-phase-slip-two-ferries',
    name: 'Two ferries',
    category: 'drone',
    description:
      'The darkest, softest metal with an octave added underneath, rung for fourteen seconds in a hall with long lows.',
    preview: THREE_OVER_TWO,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Dark soft metal',
      params: { volume: -5, beat: 1.2, decay: 14, damp: 0 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0.6, up1: 0, dry: 0.8, filter: 900, attack: 0.3 } },
      {
        deviceId: 'hall-reverb',
        params: { lowDecay: 7, midDecay: 5, damping: 2400, crossover: 300, mix: 0.4 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-dripping-taps',
    name: 'Dripping taps',
    category: 'plucked',
    description:
      'Damped hard glass, over in half a second, each drop skipping away in closer and closer echoes from side to side.',
    preview: EIGHT_OVER_SEVEN,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Damped glass',
      params: { volume: 2.5, mallet: 1, decay: 0.5, ears: 0.1, tone: 0.65 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        params: {
          first: 290,
          bounce: 0.78,
          skips: 7,
          loss: 2.2,
          sink: 0.2,
          throw: 0.95,
          ripple: 0.2,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-a-bar-gained',
    name: 'A bar gained',
    category: 'texture',
    description:
      'Glass bars recorded into two loops, one of them a ninth longer, that turn against each other under the playing.',
    preview: TENTH_TWINS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Glass, middle',
      params: { volume: -2, mallet: 0.5, decay: 4, beat: 3, tone: 0.6 },
    },
    effects: [
      {
        deviceId: 'orbits',
        params: {
          loops: 2,
          length: 1.6,
          offset: 11.1,
          feedback: 0.7,
          wear: 0.15,
          drift: 0,
          spread: 1,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-drawn-level',
    name: 'Drawn level',
    category: 'bell',
    description:
      'Soft long glass with two copies flying close by on either side, with a faint plate behind.',
    preview: HOMEWARD,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Glass bowl',
      params: { volume: -2.5, beat: 1.6, mallet: 0.4, decay: 8, damp: 0.3, ears: 0.1 },
    },
    effects: [
      {
        deviceId: 'murmuration',
        params: {
          birds: 2,
          speed: 0.6,
          turns: 0.5,
          range: 5,
          air: 0.4,
          together: 0.2,
          spread: 1,
          mix: 0.6,
        },
      },
      { deviceId: 'plate-reverb', params: { decay: 0.6, damping: 0.5, mix: 0.2 } },
    ],
  },
  {
    id: 'slow-phase-slip-copied-one-bar-late',
    name: 'Copied one bar late',
    category: 'keys',
    description:
      'Warm wood bars with two followers, one quick bar and two quick bars behind: the first on the left, the second on the right.',
    preview: SEVEN_OVER_SIX,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Two, soft wood',
      params: { volume: 0.5, beat: 4, mallet: 0.5, decay: 2.2, tone: 0.5 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: { followers: 2, gap: 0.857, fade: 0.15, spread: 1, tone: 4000, mix: 0.5 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-half-a-beat-late',
    name: 'Half a beat late',
    category: 'keys',
    description:
      'Humming wood with slow beats through a worn tape echo of three heads, dull, wavering and always a little late.',
    preview: OVER_A_PEDAL,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Soft wood hum',
      params: { volume: -1, beat: 1.2, ears: 0.8, decay: 4, mallet: 0.25 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 420,
          feedback: 0.5,
          heads: 2,
          wow: 0.6,
          flutter: 0.35,
          drive: 0.45,
          highCut: 2200,
          lowCut: 200,
          spread: 0.6,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-coupled-pendulums',
    name: 'Coupled pendulums',
    category: 'drone',
    description:
      'Long metal bars turned down by three layers of one slowing pulse, the two sides half a turn apart.',
    preview: OCTAVE_TWINS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'One, long metal',
      params: { volume: -4, mallet: 0.2, decay: 16, tone: 0.3 },
    },
    effects: [
      {
        deviceId: 'winding-down',
        params: {
          direction: 0,
          rate: 4,
          halving: 8,
          layers: 3,
          depth: 0.95,
          edge: 40,
          offset: 180,
        },
      },
      { deviceId: 'ambient-eq', params: { body: 3, highCut: 4500 } },
    ],
  },
  {
    id: 'slow-phase-slip-moire-of-glass',
    name: 'Moire of glass',
    category: 'texture',
    description:
      'Glass that beats twenty times a second, every band of it given its own fast tremolo, the two sides far apart.',
    preview: NINE_OVER_EIGHT,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Bright glass',
      params: { volume: -4, beat: 20, ears: 0.2, mallet: 0.7, decay: 5, damp: 0.1 },
    },
    effects: [
      {
        deviceId: 'glimmer',
        params: { depth: 0.95, rate: 5, grain: 0.85, pattern: 1, lean: 0.3, soft: 0.4, apart: 1 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-spare-second',
    name: 'Spare second',
    category: 'texture',
    description:
      'Hard short metal answered by itself played backwards in chunks of eight tenths, rising into the next stroke.',
    preview: HOMEWARD,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Three, short',
      params: { volume: 0, decay: 2.6, tone: 0.6, ears: 0.7 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        params: { time: 800, feedback: 0.25, smooth: 0.6, tone: 7000, spread: 0.9, mix: 0.6 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-lapped-runner',
    name: 'Lapped runner',
    category: 'plucked',
    description:
      'Dry wood flutter, nine beats a second, with a tape loop that plays it back twice as fast and an octave up.',
    preview: SEVEN_OVER_SIX,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Wood flutter',
      params: { volume: 2.5, ears: 0.9, decay: 1.4 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        params: {
          length: 1.2,
          feedback: 0.45,
          speed: 2,
          wear: 0.1,
          wow: 0.05,
          spread: 0.8,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-kettles-on-two-rings',
    name: 'Kettles on two rings',
    category: 'bell',
    description:
      'Metal bars ring-modulated by a low D and its fifth, each partial split in two and spread wide in a room of two seconds.',
    preview: FIFTH_TWINS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Seven, paired',
      params: { volume: 1.5, mallet: 0.4, decay: 3.4, ears: 0 },
    },
    effects: [
      {
        deviceId: 'ring',
        params: {
          root: 2,
          octave: 2,
          wave: 0,
          second: 1,
          drift: 0.1,
          lowCut: 200,
          tone: 5000,
          width: 1,
          mix: 0.45,
        },
      },
      {
        deviceId: 'fdn-reverb',
        params: { decay: 2.4, damping: 0.6, size: 0.8, breathDepth: 0, mix: 0.25 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-uneven-oars',
    name: 'Uneven oars',
    category: 'texture',
    description:
      'Wood bars half under water, muffled and bubbling, each stroke followed a step late on the left and two steps late on the right.',
    preview: ONE_STEP_A_BAR,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Ten, wood in air',
      params: { volume: -2.5, beat: 4, mallet: 0.7, decay: 3 },
    },
    effects: [
      {
        deviceId: 'underwater',
        params: {
          depth: 0.6,
          waver: 0.6,
          rate: 0.5,
          bubbles: 0.6,
          bubbleSize: 0.6,
          resonance: 0.6,
          width: 0.7,
        },
      },
      {
        deviceId: 'canon',
        params: { followers: 2, gap: 0.3, fade: 0.15, spread: 1, tone: 5000, mix: 0.5 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-two-hourglasses',
    name: 'Two hourglasses',
    category: 'pad',
    description:
      'Glass smeared until no stroke is left: every frequency hangs and dissolves into a wide, slightly dark haze.',
    preview: HELD_TWINS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Glass bowl',
      params: { volume: -7.5, beat: 0.8, ears: 1, mallet: 0.15, decay: 12 },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        params: {
          blur: 0.75,
          smear: 0.95,
          tilt: -1.5,
          lowCut: 120,
          highCut: 5000,
          shimmer: 0.3,
          mix: 0.9,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-minute-hands',
    name: 'Minute hands',
    category: 'keys',
    description:
      'Plain metal, four beats a second, through a coarse early converter, each stroke doubled a twelfth of a second behind.',
    preview: NINE_OVER_EIGHT,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Four a second',
      params: { volume: 1.5, mallet: 0.55, decay: 2.4, damp: 0.6, ears: 0.35 },
    },
    effects: [
      {
        deviceId: 'vintage-digital',
        params: { rate: 7000, bits: 8, companding: 1, aliasing: 0.5, filter: 1, jitter: 0.3 },
      },
      {
        deviceId: 'analog-delay',
        params: { time: 83, feedback: 0, modDepth: 0, tone: 5000, age: 0, mix: 0.45 },
      },
    ],
  },

  // Handpan: two pans or two tongues in two pairs of hands. Laid out by steel and tongue, by touch, by how near the second player sits.
  {
    id: 'slow-phase-slip-skipping-ropes',
    name: 'Skipping ropes',
    category: 'plucked',
    description:
      'Light fingertip taps near the rim, over in a second, most of the sound beating six times a second between the ears.',
    preview: SEVEN_OVER_SIX,
    instrument: {
      deviceId: 'handpan',
      preset: 'Rain taps',
      params: { volume: 2.5, decay: 1, position: 0.75, cavity: 0.2 },
    },
    effects: [
      { deviceId: 'ear-shift', params: { beat: 6, ears: 1, low: 100, high: 2000 } },
      { deviceId: 'ambient-eq', params: { lowCut: 140, presence: 3 } },
    ],
  },
  {
    id: 'slow-phase-slip-hands-across-a-table',
    name: 'Hands across a table',
    category: 'plucked',
    description:
      'Soft hands on steel with a second player beside them: the same notes a few cents off in a slightly larger body.',
    preview: FIFTH_TWINS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Soft hands',
      params: { volume: -1, touch: 0.4, shimmer: 0.2 },
    },
    effects: [
      { deviceId: 'size', params: { size: 0.3, fine: 9, width: 1, wander: 0.15, mix: 0.5 } },
      {
        deviceId: 'hall-reverb',
        params: { lowDecay: 1.4, midDecay: 1.2, damping: 5000, mix: 0.2 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-pan-and-its-cellar',
    name: 'Pan and its cellar',
    category: 'plucked',
    description:
      'The low ding with all its air, sounded again inside a large stopped pipe and left in a long dark wash.',
    preview: THREE_OVER_TWO,
    instrument: { deviceId: 'handpan', preset: 'Low ding', params: { touch: 0.2, decay: 4 } },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 2, size: 3, material: 0.6, opening: 0.3, air: 0.1, tone: 0.3, mix: 0.4 },
      },
      {
        deviceId: 'ether-reverb',
        params: { decay: 9, damping: 0.8, size: 0.9, predelayMs: 40, mix: 0.4 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-second-hand-ahead',
    name: 'Second hand ahead',
    category: 'plucked',
    description:
      'Knuckles on bare steel and the same stroke once more, a ninth of a second later, an octave down and duller.',
    preview: ONE_STEP_A_BAR,
    instrument: {
      deviceId: 'handpan',
      preset: 'Knuckles',
      params: { volume: -1, decay: 1.6, shimmer: 0.2, cavity: 0.4 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 1,
          gap: 0.111,
          interval1: -12,
          fade: 0,
          spread: 1,
          tone: 3000,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-tongues-in-a-tank',
    name: 'Tongues in a tank',
    category: 'plucked',
    description:
      'A tank of steel tongues through one slack spring that chirps and drips after every stroke.',
    preview: SEVEN_OVER_SIX,
    instrument: { deviceId: 'handpan', preset: 'Tank drum', params: { touch: 0.5, decay: 3 } },
    effects: [
      {
        deviceId: 'spring-reverb',
        params: {
          decay: 4,
          tension: 0.12,
          springs: 0,
          tone: 3000,
          drip: 0.9,
          drive: 0.3,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-slow-halves',
    name: 'Slow halves',
    category: 'pad',
    description:
      'The halo of a pan with its strokes faded in over four tenths and its bands swelling on slow cycles of their own.',
    preview: HELD_TWINS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Halo',
      params: { volume: 0, decay: 9, touch: 0.1 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 420, sensitivity: -55, curve: 0.4 } },
      { deviceId: 'currents', params: { depth: 0.9, sway: 0.9, rate: 0.4, bands: 6, lowHold: 60 } },
    ],
  },
  {
    id: 'slow-phase-slip-double-turning-ropes',
    name: 'Double turning ropes',
    category: 'plucked',
    description:
      'A short slit drum with two soft gates on one pattern, nine pulses of the one to eight of the other, one on each side.',
    preview: ONE_STEP_A_BAR,
    instrument: { deviceId: 'handpan', preset: 'Slit drum', params: { decay: 1.6, touch: 0.7 } },
    effects: [
      {
        deviceId: 'pulses',
        params: {
          rate: 7,
          steps: 8,
          fill: 5,
          drift: 1,
          shade: 0.3,
          apart: 1,
          length: 0.6,
          floor: 0.15,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-glasshouse-pans',
    name: 'Glasshouse pans',
    category: 'bell',
    description:
      'A pan struck on its edge, all overtones, with sparks of itself two octaves up thrown late to either side.',
    preview: SEVEN_OVER_SIX,
    instrument: {
      deviceId: 'handpan',
      preset: 'Edge overtones',
      params: { decay: 3, touch: 0.65 },
    },
    effects: [
      {
        deviceId: 'glints',
        params: {
          density: 14,
          pitch: 2,
          size: 60,
          scatter: 900,
          sparkle: 0.8,
          spread: 1,
          trail: 0.4,
          mix: 0.4,
        },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 260, low: -8, air: 3 } },
    ],
  },
  {
    id: 'slow-phase-slip-pace-and-a-ninth',
    name: 'Pace and a ninth',
    category: 'plucked',
    description:
      'Clean steel with no air and no halo, its echo four ninths of a second behind, dropping a fifth and coming back.',
    preview: FIFTH_TWINS,
    instrument: { deviceId: 'handpan', preset: 'Clean steel', params: { volume: 2.5, decay: 1.2 } },
    effects: [
      {
        deviceId: 'analog-delay',
        params: {
          time: 444,
          feedback: 0.4,
          modDepth: 0.1,
          tone: 4000,
          intervalA: 2,
          step: 2,
          spread: 0.9,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-pans-on-a-roundabout',
    name: 'Pans on a roundabout',
    category: 'plucked',
    description:
      'A bright struck pan through a fast spinning horn and drum, driven a little and heard from some way off.',
    preview: HOMEWARD_LOW,
    instrument: {
      deviceId: 'handpan',
      preset: 'Bright bloom',
      params: { volume: -1.5, decay: 2.6 },
    },
    effects: [
      {
        deviceId: 'rotary',
        params: {
          speed: 1,
          hornDepth: 0.95,
          drumDepth: 0.8,
          drive: 0.45,
          distance: 0.6,
          spread: 1,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-two-cisterns',
    name: 'Two cisterns',
    category: 'texture',
    description:
      'A palm-muted pan scattered into a cavern of short echoes whose size wanders and bends the pitch of the cave.',
    preview: FIFTH_TWINS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Palm mute',
      params: { volume: 2.5, decay: 1.2, cavity: 0.5 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        params: {
          length: 0.4,
          blur: 0.4,
          feedback: 0.7,
          highCut: 3500,
          stretch: 0.6,
          wander: 0.5,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-sine-of-each-hand',
    name: 'Sine of each hand',
    category: 'pad',
    description:
      'The purest tongue drum with sines an octave up that swell in over its partials and stay three seconds.',
    preview: HOMEWARD_LOW,
    instrument: { deviceId: 'handpan', preset: 'Pure tongue', params: { decay: 4 } },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: { partials: 6, transpose: 12, attack: 600, release: 3, spread: 0.9, mix: 0.6 },
      },
      { deviceId: 'spread', params: { low: 0.6, mid: 1.8, high: 2, make: 1 } },
    ],
  },
  {
    id: 'slow-phase-slip-lagging-footfall',
    name: 'Lagging footfall',
    category: 'plucked',
    description:
      'A tongue drum whose attacks are taken out and laid back a quarter of a second after the tones they belong to.',
    preview: THREE_OVER_TWO,
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { touch: 0.6, decay: 4, cavity: 0.3 },
    },
    effects: [
      {
        deviceId: 'sift',
        params: {
          tones: -3,
          attacks: 6,
          air: 0,
          hold: 0.5,
          sharpness: 0.6,
          late: 250,
          scatter: 0.9,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-pans-in-the-underpass',
    name: 'Pans in the underpass',
    category: 'plucked',
    description:
      'Hard knuckles on a ringing pan, sent down a gated space that holds level for a second and stops dead.',
    preview: SETTING_OUT,
    instrument: {
      deviceId: 'handpan',
      preset: 'Knuckles',
      params: { decay: 4, position: 0.9, shimmer: 0.8, cavity: 0.1 },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        params: { shape: 0, time: 1, density: 0.9, colour: 0.3, highCut: 12000, tail: 0, mix: 0.5 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-clock-shop-window',
    name: 'Clock shop window',
    category: 'bell',
    description:
      'A bright tongue drum, dry and narrow, its body shrunk to a music box and run through a short hard pipe.',
    preview: ONE_STEP_A_BAR,
    instrument: {
      deviceId: 'handpan',
      preset: 'Bright tongue',
      params: { volume: 1.5, decay: 1.2 },
    },
    effects: [
      { deviceId: 'size', params: { size: -0.8, detail: 0.6, tone: 0.3 } },
      {
        deviceId: 'vessel',
        params: { body: 1, size: 0.4, material: 0.9, opening: 0.2, air: 0, width: 0, mix: 0.4 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-two-tide-clocks',
    name: 'Two tide clocks',
    category: 'texture',
    description:
      'A shimmering pan under two soft gates, nine pulses to eight, left out by a surf that takes its top away and gives it back.',
    preview: THREE_OVER_TWO,
    instrument: { deviceId: 'handpan', preset: 'Slow shimmer', params: { touch: 0.4, decay: 6 } },
    effects: [
      {
        deviceId: 'pulses',
        params: {
          rate: 2,
          steps: 4,
          fill: 3,
          drift: 1,
          shade: 0.5,
          apart: 1,
          length: 0.8,
          edge: 0.6,
          floor: 0.2,
        },
      },
      {
        deviceId: 'weather',
        params: { kind: 3, exposure: 0.6, voice: 0.3, calm: 0.2, pace: 2.5, sway: 0.7 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-strings-under-the-pan',
    name: 'Strings under the pan',
    category: 'plucked',
    description:
      'A centre-struck pan that sets sixteen strings tuned to A minor ringing in sympathy for six seconds.',
    preview: FIFTH_TWINS,
    instrument: { deviceId: 'handpan', preset: 'Centre tone', params: { decay: 1.6, touch: 0.4 } },
    effects: [
      {
        deviceId: 'sympathetic',
        params: { root: 9, mode: 1, sympathy: 0.8, strings: 12, decay: 6, width: 1, mix: 0.6 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-both-hands-recorded',
    name: 'Both hands recorded',
    category: 'plucked',
    description:
      'A tongue drum caught in two loops, one a ninth longer, on a worn cassette that wavers, hisses and drops out.',
    preview: ONE_STEP_A_BAR,
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { touch: 0.35, position: 0.5, decay: 3 },
    },
    effects: [
      {
        deviceId: 'orbits',
        params: {
          loops: 2,
          length: 1.2,
          offset: 11.1,
          feedback: 0.6,
          wear: 0.1,
          drift: 0,
          spread: 1,
          mix: 0.45,
        },
      },
      {
        deviceId: 'tape',
        params: { drive: 0.7, wow: 0.8, flutter: 0.5, speed: 3, age: 0.7, hiss: 0.4, tone: 0.35 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-moons-out-of-phase',
    name: 'Moons out of phase',
    category: 'texture',
    description:
      'A halo of steel with its tail lifted by reversed grains towards the fifth and the octave for twelve seconds.',
    preview: HELD_TWINS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Halo',
      params: { touch: 0.35, cavity: 0, decay: 5 },
    },
    effects: [
      {
        deviceId: 'bloom-reverb',
        params: { bloom: 0.8, direction: 0, season: 0, decay: 12, interval: 2, width: 1, mix: 0.6 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-slow-motion-hands',
    name: 'Slow motion hands',
    category: 'drone',
    description:
      'Soft hands played back at half speed as they play: an octave down, in smooth cycles of a second and a half.',
    preview: SEVEN_OVER_SIX,
    instrument: {
      deviceId: 'handpan',
      preset: 'Soft hands',
      params: { decay: 3, touch: 0.6, position: 0.7 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        params: { length: 1500, speed: 2, fade: 0.3, smooth: 0.8, jitter: 0, spread: 1, mix: 0.75 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-scattered-seconds',
    name: 'Scattered seconds',
    category: 'plucked',
    description:
      'A clean short pan with nine echoes strewn over two seconds on no pulse at all, each on its own side.',
    preview: HOMEWARD_LOW,
    instrument: {
      deviceId: 'handpan',
      preset: 'Clean steel',
      params: { volume: 5.5, decay: 0.8, touch: 0.7, position: 0.6 },
    },
    effects: [
      {
        deviceId: 'constellation',
        params: {
          span: 2000,
          stars: 9,
          pattern: 2,
          shuffle: 5,
          fade: 0.3,
          again: 0,
          tone: 9000,
          width: 1,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-worn-steps',
    name: 'Worn steps',
    category: 'plucked',
    description:
      'A muted pan, each stroke doubled a seventh of a second late, through a small old loudspeaker, driven and boxy, in a live room.',
    preview: SEVEN_OVER_SIX,
    instrument: {
      deviceId: 'handpan',
      preset: 'Palm mute',
      params: { volume: 0, damp: 0.5, touch: 0.4, decay: 2.6 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        params: { time: 143, feedback: 0, modDepth: 0, tone: 6000, age: 0.1, mix: 0.45 },
      },
      {
        deviceId: 're-amp',
        params: {
          speaker: 0,
          drive: 0.5,
          bass: -0.4,
          distance: 0.6,
          room: 0.8,
          angle: 0.5,
          noise: 0,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-comb-between-pans',
    name: 'Comb between pans',
    category: 'texture',
    description:
      'Ringing steel swept by twelve phaser stages with high feedback, one slow turn every eight seconds, sides opposed.',
    preview: SETTING_OUT,
    instrument: {
      deviceId: 'handpan',
      preset: 'Edge overtones',
      params: { volume: -2.5, position: 0.7, decay: 8, touch: 0.25, cavity: 0.5 },
    },
    effects: [
      {
        deviceId: 'phaser',
        params: {
          stages: 4,
          centerHz: 1100,
          spread: 60,
          feedback: 70,
          rate: 0.125,
          depth: 90,
          stereo: 180,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-vowel-of-the-steel',
    name: 'Vowel of the steel',
    category: 'voice',
    description:
      'A soft low pan that comes back as a small wordless choir, its tail shaped by a slowly moving round vowel.',
    preview: FIFTH_TWINS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Low ding',
      params: { volume: 3.5, cavity: 0.3, decay: 2, touch: 0.1 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        params: { vowel: 3, resonance: 0.9, voice: 0.7, motion: 0.5, decay: 5, mix: 0.65 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-no-edge-to-the-hour',
    name: 'No edge to the hour',
    category: 'pad',
    description:
      'A tank drum blurred into a cloud with no attack and no tail, its low end cut and a thin high glow left.',
    preview: FIFTH_TWINS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Tank drum',
      params: { volume: -1.5, decay: 8, damp: 0, shimmer: 0.9, cavity: 0.3 },
    },
    effects: [
      {
        deviceId: 'fog',
        params: {
          size: 500,
          density: 1,
          layers: 3,
          drift: 0.6,
          soften: 0.9,
          damp: 0.1,
          lowCut: 300,
          width: 1,
        },
      },
    ],
  },

  // Bells: the twin that rings on. Laid out by stuff (bowl, bar, glass, church, gong), by decay, and by where the copy hangs.
  {
    id: 'slow-phase-slip-towers-on-two-hills',
    name: 'Towers on two hills',
    category: 'bell',
    description:
      'A church bell with its strike kept, answered by duller copies of it: from a hill on the left, then later from one on the right.',
    preview: SETTING_OUT,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { volume: -4.5, decay: 12, hardness: 0.5, brightness: 0.4, spread: 0.1 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: { followers: 2, gap: 1.2, fade: 0.25, spread: 1, tone: 1400, mix: 0.5 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-ninth-lap',
    name: 'Ninth lap',
    category: 'bell',
    description:
      'Small dry chime bars, quickly damped, panned hard on a square wave so each stroke falls to one side or the other.',
    preview: NINE_OVER_EIGHT,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { volume: 4, decay: 0.9, hardness: 0.6, spread: 0, release: 0.6 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        params: { mode: 1, rate: 1.5, depth: 1, shape: 2, drift: 0, smooth: 0.1 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-tide-and-moon',
    name: 'Tide and moon',
    category: 'pad',
    description:
      'Glass rubbed at the rim and drawn up into a tail that climbs five octaves a minute without arriving.',
    preview: HELD_TWINS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { hardness: 0.05, detune: 0.5, brightness: 0.2 },
    },
    effects: [
      {
        deviceId: 'spiral',
        params: { climb: 5, decay: 9, voices: 5, spread: 0.9, tone: 8000, mix: 0.55 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-spoked-wheels',
    name: 'Spoked wheels',
    category: 'bell',
    description:
      'Vibraphone bars struck off centre, squeezed by a warp that pulls their overtones together, then swirled wide.',
    preview: OCTAVE_TWINS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { volume: 6, hardness: 0.7, position: 0.2, decay: 3, release: 0.4 },
    },
    effects: [
      { deviceId: 'warp', params: { stretch: -0.5, drift: 0.4, width: 1 } },
      { deviceId: 'chorus', params: { rate: 0.4, depth: 60, spread: 100, feedback: 40, mix: 0.4 } },
    ],
  },
  {
    id: 'slow-phase-slip-thumbs-in-two-tempos',
    name: 'Thumbs in two tempos',
    category: 'plucked',
    description:
      'Kalimba tines in two loops whose lengths are as six to seven, warmed by a triode and laid on an old slow record.',
    preview: SEVEN_OVER_SIX,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { stretch: 1.12, decay: 1.6 },
    },
    effects: [
      {
        deviceId: 'orbits',
        params: {
          loops: 2,
          length: 0.857,
          offset: 16.7,
          feedback: 0.6,
          wear: 0.2,
          drift: 0,
          spread: 1,
          mix: 0.45,
        },
      },
      { deviceId: 'analog-drive', params: { drive: 0.5, circuit: 3, lowBump: 0.4, tone: -0.3 } },
      {
        deviceId: 'vinyl',
        params: { speed: 0, warp: 0.6, crackle: 0.25, surface: 0.15, wear: 0.4, tone: -0.4 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-tuned-a-hair-off',
    name: 'Tuned a hair off',
    category: 'bell',
    description:
      'Tapped glass tuned four hertz off itself, dry, its copies thirty cents sharp on the left and flat on the right.',
    preview: HAIR_APART,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { volume: -3.5, detune: 4, decay: 3, brightness: 0.4 },
    },
    effects: [
      {
        deviceId: 'stereo-detune',
        params: { detune: 30, delay: 30, drift: 0, focus: 100, mix: 0.5 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-gongs-in-two-courts',
    name: 'Gongs in two courts',
    category: 'drone',
    description:
      'Soft low gongs whose tail sags thirty cents a second and darkens the longer it rings.',
    preview: THREE_OVER_TWO,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { volume: 3.5, hardness: 0.12, brightness: 0.25, decay: 18, detune: 0.8 },
    },
    effects: [
      {
        deviceId: 'melt',
        params: { sag: -30, hold: 9, solid: 200, blur: 0.7, dim: 0.6, drip: 0.1, mix: 0.6 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-bowls-set-swinging',
    name: 'Bowls set swinging',
    category: 'bell',
    description:
      'A singing bowl struck hard, carried on a wide pendulum once every three seconds and set in an empty bathhouse.',
    preview: SETTING_OUT,
    instrument: {
      deviceId: 'modal-bells',
      params: { hardness: 0.9, decay: 7, damping: 0.2, position: 0.4, brightness: 0.7 },
    },
    effects: [
      { deviceId: 'around', params: { path: 2, rate: 0.33, radius: 1, head: 1, blur: 0 } },
      {
        deviceId: 'hall-reverb',
        params: { preDelay: 30, lowDecay: 1.5, midDecay: 5, damping: 14000, mix: 0.3 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-platform-chimes',
    name: 'Platform chimes',
    category: 'bell',
    description:
      'Wind chimes through a station loudspeaker: a narrow horn, no bass, heard from far off in a live room.',
    preview: EIGHT_OVER_SEVEN,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: { volume: -9.5, decay: 3 },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: {
          speaker: 3,
          drive: 0.35,
          bass: -0.8,
          treble: -0.2,
          distance: 0.8,
          room: 0.9,
          angle: 0.1,
          noise: 0.05,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-sandglass-turned-over',
    name: 'Sandglass turned over',
    category: 'texture',
    description:
      'Shivering glass caught in pieces that each fall a fourth as they fade, so the rain of them runs downhill.',
    preview: TENTH_TWINS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Shivering glass',
      params: { volume: -1.5, decay: 4, detune: 3 },
    },
    effects: [
      {
        deviceId: 'falling',
        params: {
          fall: -5,
          curve: 0.2,
          size: 900,
          density: 9,
          scatter: 0.5,
          spread: 1,
          again: 0.4,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-bowls-that-answer',
    name: 'Bowls that answer',
    category: 'bell',
    description:
      'A short dry kalimba over a table of low bowls in D minor pentatonic that ring on by themselves, beating slowly.',
    preview: FIFTH_TWINS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { volume: 2, decay: 0.8, hardness: 0.35, damping: 0.9 },
    },
    effects: [
      {
        deviceId: 'bowls',
        params: {
          root: 2,
          scale: 1,
          bowls: 10,
          ring: 14,
          beat: 0.6,
          strike: 0.6,
          metal: 0.4,
          register: 0.3,
          spread: 1,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-bowed-in-two-breaths',
    name: 'Bowed in two breaths',
    category: 'pad',
    description:
      'Bells rubbed into long tones under an envelope of breath, opening over two seconds and closing over two.',
    preview: HELD_TWINS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Bowed bell',
      params: { brightness: 0.6, detune: 2, decay: 8 },
    },
    effects: [
      {
        deviceId: 'breath',
        params: {
          in: 2,
          out: 2,
          hold: 0.1,
          rest: 0.1,
          depth: 0.7,
          colour: 0.8,
          width: 0.9,
          air: 0,
          vary: 0,
        },
      },
      { deviceId: 'ambient-eq', params: { low: -3, presence: 2 } },
    ],
  },
  {
    id: 'slow-phase-slip-split-into-colours',
    name: 'Split into colours',
    category: 'bell',
    description:
      'A church bell taken apart by colour: the high partials come first and the low ones more than a second later.',
    preview: HOMEWARD,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { volume: -4.5, decay: 3, hardness: 0.8, brightness: 0.7, damping: 0.2 },
    },
    effects: [
      {
        deviceId: 'prism',
        params: {
          time: 1200,
          shape: 1,
          feedback: 0.2,
          bands: 10,
          smear: 0.1,
          width: 1,
          drift: 0.1,
          mix: 0.7,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-yard-bars',
    name: 'Yard bars',
    category: 'bell',
    description:
      'Wood bars stretched until their partials jangle, folded by a hard drive, under two gates that run nine pulses to eight.',
    preview: ONE_STEP_A_BAR,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: { stretch: 1.4, hardness: 0.75, decay: 0.9, brightness: 0.6, damping: 0.5 },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 4, driveDb: 10, toneDb: -5, outputDb: -6, mix: 0.6 },
      },
      {
        deviceId: 'pulses',
        params: {
          rate: 3.333,
          steps: 4,
          fill: 3,
          drift: 1,
          shade: 0.4,
          apart: 1,
          length: 0.9,
          floor: 0.15,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-orbit-of-a-dark-bowl',
    name: 'Orbit of a dark bowl',
    category: 'drone',
    description:
      'A dark bowl slid up four tenths of a hertz at every turn of a feedback loop, with a low octave put under it all.',
    preview: THREE_OVER_TWO,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Dark bowl',
      params: { hardness: 0.3, brightness: 0.35, decay: 14 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: {
          fine: 0.4,
          mode: 0,
          feedback: 0.85,
          delay: 12,
          lfoDepth: 0,
          tone: 3000,
          width: 1,
          mix: 0.5,
        },
      },
      { deviceId: 'octaves', params: { sub1: 0.5, up1: 0, dry: 0.9, filter: 600 } },
    ],
  },
  {
    id: 'slow-phase-slip-shutters-and-glass',
    name: 'Shutters and glass',
    category: 'plucked',
    description:
      'Tapped glass choked short, cut into a rhythm by a buffer that repeats slices of itself now and then.',
    preview: ONE_STEP_A_BAR,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { volume: -3, decay: 0.7, hardness: 0.5, release: 0.8, damping: 0.6 },
    },
    effects: [
      { deviceId: 'glitch', preset: 'Gentle stumble' },
      { deviceId: 'spread', params: { low: 0.5, mid: 1.8, high: 2, make: 1 } },
    ],
  },
  {
    id: 'slow-phase-slip-strings-behind-the-dial',
    name: 'Strings behind the dial',
    category: 'pad',
    description:
      'Vibraphone bars with a soft pad of strings an octave up growing behind them and staying when they stop.',
    preview: HELD_TWINS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { volume: 6, decay: 2, hardness: 0.15, spread: 0.1 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        params: {
          rise: 0.9,
          fall: 3,
          octaves: 0.8,
          brightness: 2600,
          ensemble: 0.8,
          width: 1,
          mix: 0.75,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-spinning-tops',
    name: 'Spinning tops',
    category: 'texture',
    description:
      'Music-box bars stacked into little loops at octave and fifth speeds, each note coming back as a quick bright cascade.',
    preview: HOMEWARD,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { volume: 5, decay: 2, hardness: 0.4, brightness: 0.3 },
    },
    effects: [
      {
        deviceId: 'cascade',
        params: {
          pattern: 3,
          time: 220,
          repeats: 8,
          decay: 0.35,
          high: 0.9,
          interval: 1,
          spread: 1,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-frosted-hours',
    name: 'Frosted hours',
    category: 'bell',
    description:
      'A struck glass harp answered an octave up three tenths later, both turned to deep winter, frozen at the top with a cold tail.',
    preview: TENTH_TWINS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { volume: -4, sustain: 0, hardness: 0.5, decay: 5, detune: 4, brightness: 0.7 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: { followers: 1, gap: 0.3, interval1: 12, fade: 0.2, tone: 9000, mix: 0.45 },
      },
      {
        deviceId: 'seasons',
        params: { year: 0.9, depth: 1, space: 0.9, tail: 0.9, turn: 0, motion: 0.3 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-slack-chimes',
    name: 'Slack chimes',
    category: 'bell',
    description:
      'Bars with partials pulled close together, each note straight at first and swaying wider the longer it hangs.',
    preview: SETTING_OUT,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { volume: -2.5, stretch: 0.7, decay: 9, hardness: 0.3, damping: 0.2 },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        params: { wait: 300, grow: 900, depth: 45, rate: 2.2, swell: 0.7, width: 1 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-rubbed-brass-dial',
    name: 'Rubbed brass dial',
    category: 'drone',
    description:
      'A rubbed gong through a hollow tube of a filter, its tail swelling in late and staying for twenty seconds.',
    preview: HELD_TWINS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed gong',
      params: { volume: -16.5, stretch: 1, hardness: 0.3 },
    },
    effects: [
      { deviceId: 'imprint', params: { capture: 0, shape: 4, amount: 1.3, replace: 0.5 } },
      {
        deviceId: 'expanse',
        params: { size: 0.6, decay: 20, gravity: 0.6, highCut: 4000, mix: 0.4 },
      },
    ],
  },

  // Mallets: the wooden side of the pair. Laid out by bar, by mallet, by roll, and by the copy that each is played against.
  {
    id: 'slow-phase-slip-two-in-a-practice-room',
    name: 'Two in a practice room',
    category: 'keys',
    description:
      'A marimba with copies fourteen thousandths late, twelve cents sharp on the left and flat on the right, in a small dry booth.',
    preview: SEVEN_OVER_SIX,
    instrument: {
      deviceId: 'mallets',
      params: { volume: -2.5, mallet: 0.5, resonator: 0.5, width: 0.1 },
    },
    effects: [
      {
        deviceId: 'stereo-detune',
        params: { detune: 12, delay: 14, drift: 0.3, focus: 60, mix: 0.5 },
      },
      { deviceId: 'ether-reverb', params: { decay: 0.7, damping: 0.3, size: 0.1, mix: 0.3 } },
    ],
  },
  {
    id: 'slow-phase-slip-nine-for-eight',
    name: 'Nine for eight',
    category: 'keys',
    description:
      'Dry xylophone pressed by a fast limiter, its clean echo two thirds of a second on, repeated a few times more softly.',
    preview: NINE_OVER_EIGHT,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { volume: 2.5, width: 0, mallet: 0.6, decay: 1 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 16, outputGain: -10 } },
      {
        deviceId: 'tape-echo',
        params: {
          time: 667,
          feedback: 0.4,
          wow: 0,
          flutter: 0,
          drive: 0.1,
          highCut: 12000,
          spread: 1,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-marimba-in-a-lift-shaft',
    name: 'Marimba in a lift shaft',
    category: 'keys',
    description:
      'Marimba with a soft mallet and its tubes shut, dropped a long way down a hard narrow shaft.',
    preview: SETTING_OUT,
    instrument: {
      deviceId: 'mallets',
      params: { volume: 3, mallet: 0.15, resonator: 0, decay: 0.7, width: 0 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        params: {
          length: 0.15,
          blur: 0.2,
          feedback: 0.85,
          highCut: 2500,
          stretch: 0.3,
          modulation: 0.1,
          width: 0.3,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-motor-against-motor',
    name: 'Motor against motor',
    category: 'keys',
    description:
      'Vibraphone with its fan at three turns a second against a tremolo at two and two thirds: eight of one to nine of the other.',
    preview: OCTAVE_TWINS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { motor: 1, motorRate: 3, decay: 2.5, width: 0.6 },
    },
    effects: [
      { deviceId: 'tremolo', params: { mode: 0, rate: 2.667, depth: 0.85, phase: 180, drift: 0 } },
    ],
  },
  {
    id: 'slow-phase-slip-rolled-across-the-gap',
    name: 'Rolled across the gap',
    category: 'pad',
    description:
      'Rolled marimba, its separate strokes smeared into one another by a blur of half a second with nothing after it.',
    preview: HELD_TWINS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { volume: -6.5, roll: 8 },
    },
    effects: [
      {
        deviceId: 'fog',
        params: { size: 450, density: 0.9, layers: 2, soften: 0.7, damp: 0.5, mix: 1 },
      },
      { deviceId: 'ambient-eq', params: { body: 3, highCut: 3000 } },
    ],
  },
  {
    id: 'slow-phase-slip-glass-metronomes',
    name: 'Glass metronomes',
    category: 'bell',
    description:
      'Short glockenspiel with its lows cut away, scattered into tiny glittering grains of itself after each stroke.',
    preview: EIGHT_OVER_SEVEN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { volume: 0, decay: 0.4, mallet: 0.6 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        params: {
          time: 180,
          spray: 0.5,
          pitch: 0,
          pitchSpray: 0,
          size: 40,
          density: 3,
          feedback: 0.6,
          tone: 14000,
          spread: 1,
          mix: 0.5,
        },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 400 } },
    ],
  },
  {
    id: 'slow-phase-slip-celesta-two-doors-down',
    name: 'Celesta two doors down',
    category: 'keys',
    description:
      'A damped celesta heard through walls: far, dull and narrow, its place drifting nearer and farther.',
    preview: TENTH_TWINS,
    instrument: { deviceId: 'mallets', preset: 'Celesta', params: { mallet: 0.6 } },
    effects: [
      {
        deviceId: 'distance',
        params: {
          distance: 0.85,
          room: 0.6,
          air: 1,
          wander: 0.5,
          rate: 0.2,
          decay: 1.5,
          width: 1,
          level: 1,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-tape-decks-in-a-barn',
    name: 'Tape decks in a barn',
    category: 'keys',
    description:
      'Humming marimba looped on worn tape at half speed, so an octave-low copy trails behind the hand.',
    preview: SEVEN_OVER_SIX,
    instrument: {
      deviceId: 'mallets',
      preset: 'Humming marimba',
      params: { mallet: 0.3, decay: 1.5 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        params: { length: 2, feedback: 0.6, speed: 0, wear: 0.5, wow: 0.5, spread: 0.6, mix: 0.55 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-slow-fan-fast-fan',
    name: 'Slow fan, fast fan',
    category: 'pad',
    description:
      'Vibraphone with its fan once a second and no stroke at all, under a wide slow phase of eight stages.',
    preview: HELD_TWINS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { volume: -5.5, mallet: 0.05 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 350, sensitivity: -50, curve: 0.3 } },
      {
        deviceId: 'phaser',
        params: {
          stages: 2,
          centerHz: 500,
          spread: 50,
          feedback: -50,
          rate: 0.2,
          depth: 80,
          stereo: 180,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-sleepers-under-rails',
    name: 'Sleepers under rails',
    category: 'keys',
    description:
      'Xylophone with the softest mallet and open tubes, thickened by a sub-octave and a fifth of pipes speaking late.',
    preview: SETTING_OUT,
    instrument: { deviceId: 'mallets', preset: 'Warm xylophone', params: { volume: -1, decay: 2 } },
    effects: [
      {
        deviceId: 'stops',
        params: {
          speak: 400,
          tone: 0.2,
          sub: 0.9,
          unison: 0.4,
          fifth: 0.4,
          octave: 0.1,
          twelfth: 0,
          fifteenth: 0,
          chiff: 0,
          mix: 0.7,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-xylophone-in-a-jar',
    name: 'Xylophone in a jar',
    category: 'keys',
    description:
      'Rolling xylophone played inside a glass bottle, its neck humming a note of its own beside the bars.',
    preview: SETTING_OUT,
    instrument: {
      deviceId: 'mallets',
      preset: 'Xylophone roll',
      params: { volume: -3, roll: 12, decay: 1.2 },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 0, size: 1.6, material: 0.9, opening: 0.7, air: 0.4, tone: 0.7, mix: 0.75 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-unison-then-upward',
    name: 'Unison, then upward',
    category: 'bell',
    description:
      'Resonant glockenspiel sent up in octaves into a soft rising choir, the strokes themselves kept low.',
    preview: HOMEWARD,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { mallet: 0.2, decay: 1 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        params: {
          decay: 8,
          shimmer: 0.8,
          interval: 0,
          size: 0.6,
          tone: 9000,
          lowCut: 300,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-bars-wired-to-springs',
    name: 'Bars wired to springs',
    category: 'keys',
    description:
      'A hard celesta through three long springs driven until they bark, with almost none of the keys left dry.',
    preview: ONE_STEP_A_BAR,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.9, damper: 0.2, resonator: 0.2 },
    },
    effects: [
      {
        deviceId: 'spring-reverb',
        params: {
          decay: 2.6,
          tension: 0.8,
          springs: 2,
          tone: 5500,
          drip: 0.6,
          drive: 0.7,
          mix: 0.75,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-partner-walks-backwards',
    name: 'Partner walks backwards',
    category: 'texture',
    description:
      'Marimba caught a second at a time and looped in reverse underneath, so a partner plays toward each stroke.',
    preview: OVER_A_PEDAL,
    instrument: {
      deviceId: 'mallets',
      params: { volume: -4, mallet: 0.6, decay: 1.6, resonator: 1 },
    },
    effects: [
      {
        deviceId: 'micro-looper',
        params: {
          state: 2,
          length: 1,
          speed: 1,
          smear: 0.1,
          fade: 0.7,
          drift: 0,
          tone: 5000,
          spread: 1,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-wall-clock-in-the-porch',
    name: 'Wall clock in the porch',
    category: 'keys',
    description:
      'Tremolo celesta on a kitchen set: a narrow driven band, light static and a wavering pitch.',
    preview: SETTING_OUT,
    instrument: {
      deviceId: 'mallets',
      preset: 'Tremolo celesta',
      params: { motorRate: 6, decay: 1.5 },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 3, drive: 0.6, wobble: 0.4, wear: 0.6, noise: 0.35, tone: 0.4 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-what-both-hands-leave',
    name: 'What both hands leave',
    category: 'drone',
    description:
      'Still vibraphone caught and held as an endless pad that glides from one note to the next under the bars.',
    preview: HOMEWARD,
    instrument: { deviceId: 'mallets', preset: 'Still vibes', params: { decay: 0.6, mallet: 0.4 } },
    effects: [
      {
        deviceId: 'sustainer',
        params: {
          mode: 0,
          sensitivity: 0.7,
          attack: 0.4,
          decay: 12,
          glide: 1.2,
          motion: 0.6,
          ensemble: 0.6,
          mix: 0.75,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-frost-on-both-dials',
    name: 'Frost on both dials',
    category: 'pad',
    description:
      'A quick glockenspiel roll fed into a fuzzed double reverb until it hangs as one glowing sheet.',
    preview: HOMEWARD,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel roll',
      params: { volume: -2.5, roll: 10, mallet: 0.1 },
    },
    effects: [
      {
        deviceId: 'haze',
        params: { haze: 0.6, blur: 0.8, decay: 8, tone: 0.35, octave: 0, feed: 0.2, mix: 0.75 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-long-bars-apart',
    name: 'Long bars apart',
    category: 'keys',
    description:
      'Deep marimba pressed by a fast compressor, an octave of itself added below and the top shut at twelve hundred hertz.',
    preview: THREE_OVER_TWO,
    instrument: {
      deviceId: 'mallets',
      params: { mallet: 0.25, decay: 2.5, resonator: 1, width: 0 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0.8, up1: 0, dry: 0.8 } },
      { deviceId: 'fet-limiter', params: { inputGain: 14, outputGain: -10 } },
      { deviceId: 'ambient-eq', params: { highCut: 1200, low: 3 } },
    ],
  },
  {
    id: 'slow-phase-slip-remembered-an-hour-on',
    name: 'Remembered an hour on',
    category: 'texture',
    description:
      'An open celesta under which moments from before drift back, some backwards and some at half the speed.',
    preview: TENTH_TWINS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Open celesta',
      params: { volume: -6, decay: 1, mallet: 0.3 },
    },
    effects: [
      {
        deviceId: 'echo-memory',
        params: {
          time: 800,
          feedback: 0.3,
          echo: 0.2,
          memory: 1,
          reach: 4,
          wander: 0.8,
          size: 1,
          vary: 0.9,
          spread: 1,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-say-it-twice',
    name: 'Say it twice',
    category: 'keys',
    description:
      'A hard-mallet vibraphone pressed into an open vowel, said again on the left, then the right, under a fast wide chorus.',
    preview: NINE_OVER_EIGHT,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { volume: -0.5, mallet: 0.85, damper: 0.8, decay: 1, resonator: 0.3 },
    },
    effects: [
      { deviceId: 'imprint', params: { capture: 0, shape: 1, amount: 1.5, replace: 0.5 } },
      {
        deviceId: 'canon',
        params: { followers: 2, gap: 0.167, fade: 0.3, spread: 1, tone: 9000, mix: 0.45 },
      },
      {
        deviceId: 'chorus',
        params: { rate: 5, depth: 25, spread: 100, voices: 0, delayMs: 8, mix: 0.6 },
      },
    ],
  },

  // Ice: strike and answer across a lake. Laid out by distance, by thickness, and by how the far bank replies.
  {
    id: 'slow-phase-slip-skaters-in-two-lanes',
    name: 'Skaters in two lanes',
    category: 'bell',
    description:
      'Near clear pings of ice with no cracks, circling the head once every four seconds in a small hall.',
    preview: SETTING_OUT,
    instrument: {
      deviceId: 'ice',
      preset: 'Clear ping',
      params: { volume: 5.5, ring: 3, bright: 0.7 },
    },
    effects: [
      { deviceId: 'around', params: { path: 0, rate: 0.25, radius: 1, head: 0.9, near: 0.3 } },
      { deviceId: 'hall-reverb', params: { lowDecay: 2, midDecay: 2, damping: 9000, mix: 0.2 } },
    ],
  },
  {
    id: 'slow-phase-slip-knocks-from-both-banks',
    name: 'Knocks from both banks',
    category: 'plucked',
    description:
      'A brittle snap with hardly a note in it, echoed three eighths of a second on an octave up, the echo of the echo higher still.',
    preview: SEVEN_OVER_SIX,
    instrument: {
      deviceId: 'ice',
      preset: 'Brittle snap',
      params: { volume: 6, ring: 0.9, crack: 0.8 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        params: { pitchA: 12, levelB: 0, mode: 0, delay: 375, feedback: 0.35, spread: 1, mix: 0.4 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-deep-floes-turning',
    name: 'Deep floes turning',
    category: 'drone',
    description:
      'Thick dark ice rung long, stroked in by a slow swell and turned over by bands that drift from side to side.',
    preview: OVER_A_PEDAL,
    instrument: {
      deviceId: 'ice',
      preset: 'Deep floe',
      params: { volume: -1, cracks: 0, ring: 18, bright: 0.2 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 600, sensitivity: -55 } },
      { deviceId: 'currents', params: { depth: 0.7, sway: 1, rate: 0.25, bands: 4, shape: 0.6 } },
    ],
  },
  {
    id: 'slow-phase-slip-thaw-by-degrees',
    name: 'Thaw by degrees',
    category: 'pad',
    description:
      'A slow thaw of muffled ice whose tail lifts sixty cents a second and thins as it goes, over a long hold.',
    preview: THREE_OVER_TWO,
    instrument: {
      deviceId: 'ice',
      preset: 'Slow thaw',
      params: { volume: -2, distance: 0.3, cracks: 0 },
    },
    effects: [
      {
        deviceId: 'melt',
        params: { sag: 60, hold: 8, solid: 80, blur: 0.6, dim: 0.1, drip: 0, mix: 0.7 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-plates-slid-past',
    name: 'Plates slid past',
    category: 'bell',
    description:
      'Plate tones of ice shifted down six hertz at each turn of a short loop, so the stretched partials crawl past one another.',
    preview: HAIR_APART,
    instrument: {
      deviceId: 'ice',
      preset: 'Plate tones',
      params: { volume: 3.5, ring: 4, bright: 0.45 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: {
          fine: 6,
          mode: 1,
          feedback: 0.6,
          delay: 160,
          lfoDepth: 0,
          tone: 6000,
          width: 1,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-lake-in-a-corridor',
    name: 'Lake in a corridor',
    category: 'texture',
    description:
      'Restless ice brought near, its cracks kept, gated into an even room of half a second that shuts behind each one.',
    preview: FIFTH_TWINS,
    instrument: {
      deviceId: 'ice',
      preset: 'Restless ice',
      params: { volume: 6, distance: 0.1, cracks: 0.6, ring: 2 },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        params: {
          shape: 0,
          time: 0.5,
          density: 1,
          colour: -0.6,
          highCut: 4000,
          tail: 0.1,
          mix: 0.55,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-two-shores-of-voices',
    name: 'Two shores of voices',
    category: 'voice',
    description:
      'Ice bells with hardly a chirp, answered from behind by a wordless choir on a bright vowel that stays for eight seconds.',
    preview: TENTH_TWINS,
    instrument: { deviceId: 'ice', preset: 'Ice bells', params: { volume: 6, ring: 2, crack: 0 } },
    effects: [
      {
        deviceId: 'vowel-reverb',
        params: {
          vowel: 2,
          resonance: 0.8,
          voice: 0.8,
          motion: 0.2,
          decay: 8,
          highCut: 6000,
          mix: 0.65,
        },
      },
    ],
  },
  {
    id: 'slow-phase-slip-thin-ice-clockwork',
    name: 'Thin ice clockwork',
    category: 'plucked',
    description:
      'Thin bright ice cut short and crushed to a few bits, most of it behind a gate that opens six times a second.',
    preview: ONE_STEP_A_BAR,
    instrument: {
      deviceId: 'ice',
      preset: 'Thin ice',
      params: { volume: 5.5, ring: 1.4, distance: 0.1, shore: 0, cracks: 0 },
    },
    effects: [
      {
        deviceId: 'vintage-digital',
        params: { rate: 11000, bits: 7, companding: 1, aliasing: 0.6, jitter: 0.2 },
      },
      {
        deviceId: 'band-pulse',
        params: { rate: 6, depth: 0.9, duty: 0.55, edge: 10, low: 200, high: 4000 },
      },
    ],
  },
  {
    id: 'slow-phase-slip-far-bank-redrawn',
    name: 'Far bank redrawn',
    category: 'texture',
    description:
      'A distant field of ice stretched out twelve times as slow behind the playing, a wide cloud with few edges.',
    preview: HOMEWARD,
    instrument: {
      deviceId: 'ice',
      preset: 'Distant field',
      params: { volume: 1.5, distance: 0.6, cracks: 0.1, bright: 0.6 },
    },
    effects: [
      {
        deviceId: 'stretch',
        params: { stretch: 12, window: 2, diffuse: 1, width: 1, tone: 0.2, mix: 0.75 },
      },
    ],
  },
]
