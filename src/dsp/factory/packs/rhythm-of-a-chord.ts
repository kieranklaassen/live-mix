import { type FactoryPreset, type Phrase } from '../types'

// A just chord is a polyrhythm too fast to count: in each phrase here every note of a chord also
// pulses at its own ratio, and all of them meet at the start and the end. The sounds are bars, tines
// and strings laid out as the voices of such chords, most decays set between one pulse and a cycle,
// and many tremolos, motors and echoes timed to one voice of the chord they are heard on.

// C E G as 4:5:6: three even pulses over six seconds, together at the start and again at the end.
const MAJOR_MEETS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.455, note: 60, gain: 0.55 },
    { atSec: 0, durSec: 1.164, note: 63.86, gain: 0.44 },
    { atSec: 0, durSec: 0.97, note: 67.02, gain: 0.4 },
    { atSec: 1, durSec: 0.97, note: 67.02, gain: 0.36 },
    { atSec: 1.2, durSec: 1.164, note: 63.86, gain: 0.4 },
    { atSec: 1.5, durSec: 1.455, note: 60, gain: 0.5 },
    { atSec: 2, durSec: 0.97, note: 67.02, gain: 0.36 },
    { atSec: 2.4, durSec: 1.164, note: 63.86, gain: 0.4 },
    { atSec: 3, durSec: 1.455, note: 60, gain: 0.5 },
    { atSec: 3, durSec: 0.97, note: 67.02, gain: 0.36 },
    { atSec: 3.6, durSec: 1.164, note: 63.86, gain: 0.4 },
    { atSec: 4, durSec: 0.97, note: 67.02, gain: 0.36 },
    { atSec: 4.5, durSec: 1.455, note: 60, gain: 0.5 },
    { atSec: 4.8, durSec: 1.164, note: 63.86, gain: 0.4 },
    { atSec: 5, durSec: 0.97, note: 67.02, gain: 0.36 },
    { atSec: 6, durSec: 1.3, note: 60, gain: 0.55 },
    { atSec: 6, durSec: 1.3, note: 63.86, gain: 0.44 },
    { atSec: 6, durSec: 1.3, note: 67.02, gain: 0.4 },
  ],
}

// C F A as 3:4:5, the second inversion of F: the same family, a slower cross.
const FOURTH_ON_TOP: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.94, note: 60, gain: 0.57 },
    { atSec: 0, durSec: 1.455, note: 64.98, gain: 0.48 },
    { atSec: 0, durSec: 1.164, note: 68.84, gain: 0.42 },
    { atSec: 1.2, durSec: 1.164, note: 68.84, gain: 0.38 },
    { atSec: 1.5, durSec: 1.455, note: 64.98, gain: 0.44 },
    { atSec: 2, durSec: 1.94, note: 60, gain: 0.52 },
    { atSec: 2.4, durSec: 1.164, note: 68.84, gain: 0.38 },
    { atSec: 3, durSec: 1.455, note: 64.98, gain: 0.44 },
    { atSec: 3.6, durSec: 1.164, note: 68.84, gain: 0.38 },
    { atSec: 4, durSec: 1.94, note: 60, gain: 0.52 },
    { atSec: 4.5, durSec: 1.455, note: 64.98, gain: 0.44 },
    { atSec: 4.8, durSec: 1.164, note: 68.84, gain: 0.38 },
    { atSec: 6, durSec: 1.3, note: 60, gain: 0.57 },
    { atSec: 6, durSec: 1.3, note: 64.98, gain: 0.48 },
    { atSec: 6, durSec: 1.3, note: 68.84, gain: 0.42 },
  ],
}

// E G C as 5:6:8, the first inversion of C: the bass is the five now.
const SIXTH_CHORD: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.203, note: 63.86, gain: 0.51 },
    { atSec: 0, durSec: 1.002, note: 67.02, gain: 0.42 },
    { atSec: 0, durSec: 0.752, note: 72, gain: 0.37 },
    { atSec: 0.775, durSec: 0.752, note: 72, gain: 0.34 },
    { atSec: 1.033, durSec: 1.002, note: 67.02, gain: 0.38 },
    { atSec: 1.24, durSec: 1.203, note: 63.86, gain: 0.46 },
    { atSec: 1.55, durSec: 0.752, note: 72, gain: 0.34 },
    { atSec: 2.067, durSec: 1.002, note: 67.02, gain: 0.38 },
    { atSec: 2.325, durSec: 0.752, note: 72, gain: 0.34 },
    { atSec: 2.48, durSec: 1.203, note: 63.86, gain: 0.46 },
    { atSec: 3.1, durSec: 1.002, note: 67.02, gain: 0.38 },
    { atSec: 3.1, durSec: 0.752, note: 72, gain: 0.34 },
    { atSec: 3.72, durSec: 1.203, note: 63.86, gain: 0.46 },
    { atSec: 3.875, durSec: 0.752, note: 72, gain: 0.34 },
    { atSec: 4.133, durSec: 1.002, note: 67.02, gain: 0.38 },
    { atSec: 4.65, durSec: 0.752, note: 72, gain: 0.34 },
    { atSec: 4.96, durSec: 1.203, note: 63.86, gain: 0.46 },
    { atSec: 5.167, durSec: 1.002, note: 67.02, gain: 0.38 },
    { atSec: 5.425, durSec: 0.752, note: 72, gain: 0.34 },
    { atSec: 6.2, durSec: 1.15, note: 63.86, gain: 0.51 },
    { atSec: 6.2, durSec: 1.15, note: 67.02, gain: 0.42 },
    { atSec: 6.2, durSec: 1.15, note: 72, gain: 0.37 },
  ],
}

// A C E as 10:12:15: thirty-seven strikes, and the three voices meet only at the two ends.
const MINOR_MEETS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.621, note: 57, gain: 0.46 },
    { atSec: 0, durSec: 0.517, note: 60.16, gain: 0.36 },
    { atSec: 0, durSec: 0.414, note: 64.02, gain: 0.33 },
    { atSec: 0.427, durSec: 0.414, note: 64.02, gain: 0.3 },
    { atSec: 0.533, durSec: 0.517, note: 60.16, gain: 0.33 },
    { atSec: 0.64, durSec: 0.621, note: 57, gain: 0.42 },
    { atSec: 0.853, durSec: 0.414, note: 64.02, gain: 0.3 },
    { atSec: 1.067, durSec: 0.517, note: 60.16, gain: 0.33 },
    { atSec: 1.28, durSec: 0.621, note: 57, gain: 0.42 },
    { atSec: 1.28, durSec: 0.414, note: 64.02, gain: 0.3 },
    { atSec: 1.6, durSec: 0.517, note: 60.16, gain: 0.33 },
    { atSec: 1.707, durSec: 0.414, note: 64.02, gain: 0.3 },
    { atSec: 1.92, durSec: 0.621, note: 57, gain: 0.42 },
    { atSec: 2.133, durSec: 0.517, note: 60.16, gain: 0.33 },
    { atSec: 2.133, durSec: 0.414, note: 64.02, gain: 0.3 },
    { atSec: 2.56, durSec: 0.621, note: 57, gain: 0.42 },
    { atSec: 2.56, durSec: 0.414, note: 64.02, gain: 0.3 },
    { atSec: 2.667, durSec: 0.517, note: 60.16, gain: 0.33 },
    { atSec: 2.987, durSec: 0.414, note: 64.02, gain: 0.3 },
    { atSec: 3.2, durSec: 0.621, note: 57, gain: 0.42 },
    { atSec: 3.2, durSec: 0.517, note: 60.16, gain: 0.33 },
    { atSec: 3.413, durSec: 0.414, note: 64.02, gain: 0.3 },
    { atSec: 3.733, durSec: 0.517, note: 60.16, gain: 0.33 },
    { atSec: 3.84, durSec: 0.621, note: 57, gain: 0.42 },
    { atSec: 3.84, durSec: 0.414, note: 64.02, gain: 0.3 },
    { atSec: 4.267, durSec: 0.517, note: 60.16, gain: 0.33 },
    { atSec: 4.267, durSec: 0.414, note: 64.02, gain: 0.3 },
    { atSec: 4.48, durSec: 0.621, note: 57, gain: 0.42 },
    { atSec: 4.693, durSec: 0.414, note: 64.02, gain: 0.3 },
    { atSec: 4.8, durSec: 0.517, note: 60.16, gain: 0.33 },
    { atSec: 5.12, durSec: 0.621, note: 57, gain: 0.42 },
    { atSec: 5.12, durSec: 0.414, note: 64.02, gain: 0.3 },
    { atSec: 5.333, durSec: 0.517, note: 60.16, gain: 0.33 },
    { atSec: 5.547, durSec: 0.414, note: 64.02, gain: 0.3 },
    { atSec: 5.76, durSec: 0.621, note: 57, gain: 0.42 },
    { atSec: 5.867, durSec: 0.517, note: 60.16, gain: 0.33 },
    { atSec: 5.973, durSec: 0.414, note: 64.02, gain: 0.3 },
    { atSec: 6.4, durSec: 0.95, note: 57, gain: 0.46 },
    { atSec: 6.4, durSec: 0.95, note: 60.16, gain: 0.36 },
    { atSec: 6.4, durSec: 0.95, note: 64.02, gain: 0.33 },
  ],
}

// C F G as 6:8:9: the F and the G a step apart in pitch and one strike apart in count.
const SUSPENDED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.018, note: 60, gain: 0.51 },
    { atSec: 0, durSec: 0.764, note: 64.98, gain: 0.4 },
    { atSec: 0, durSec: 0.679, note: 67.02, gain: 0.36 },
    { atSec: 0.7, durSec: 0.679, note: 67.02, gain: 0.33 },
    { atSec: 0.787, durSec: 0.764, note: 64.98, gain: 0.36 },
    { atSec: 1.05, durSec: 1.018, note: 60, gain: 0.46 },
    { atSec: 1.4, durSec: 0.679, note: 67.02, gain: 0.33 },
    { atSec: 1.575, durSec: 0.764, note: 64.98, gain: 0.36 },
    { atSec: 2.1, durSec: 1.018, note: 60, gain: 0.46 },
    { atSec: 2.1, durSec: 0.679, note: 67.02, gain: 0.33 },
    { atSec: 2.362, durSec: 0.764, note: 64.98, gain: 0.36 },
    { atSec: 2.8, durSec: 0.679, note: 67.02, gain: 0.33 },
    { atSec: 3.15, durSec: 1.018, note: 60, gain: 0.46 },
    { atSec: 3.15, durSec: 0.764, note: 64.98, gain: 0.36 },
    { atSec: 3.5, durSec: 0.679, note: 67.02, gain: 0.33 },
    { atSec: 3.938, durSec: 0.764, note: 64.98, gain: 0.36 },
    { atSec: 4.2, durSec: 1.018, note: 60, gain: 0.46 },
    { atSec: 4.2, durSec: 0.679, note: 67.02, gain: 0.33 },
    { atSec: 4.725, durSec: 0.764, note: 64.98, gain: 0.36 },
    { atSec: 4.9, durSec: 0.679, note: 67.02, gain: 0.33 },
    { atSec: 5.25, durSec: 1.018, note: 60, gain: 0.46 },
    { atSec: 5.513, durSec: 0.764, note: 64.98, gain: 0.36 },
    { atSec: 5.6, durSec: 0.679, note: 67.02, gain: 0.33 },
    { atSec: 6.3, durSec: 1.05, note: 60, gain: 0.51 },
    { atSec: 6.3, durSec: 1.05, note: 64.98, gain: 0.4 },
    { atSec: 6.3, durSec: 1.05, note: 67.02, gain: 0.36 },
  ],
}

// C E G and a B flat 31 cents low as 4:5:6:7.
const FLAT_SEVENTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.528, note: 60, gain: 0.51 },
    { atSec: 0, durSec: 1.222, note: 63.86, gain: 0.42 },
    { atSec: 0, durSec: 1.018, note: 67.02, gain: 0.37 },
    { atSec: 0, durSec: 0.873, note: 69.69, gain: 0.35 },
    { atSec: 0.9, durSec: 0.873, note: 69.69, gain: 0.32 },
    { atSec: 1.05, durSec: 1.018, note: 67.02, gain: 0.34 },
    { atSec: 1.26, durSec: 1.222, note: 63.86, gain: 0.38 },
    { atSec: 1.575, durSec: 1.528, note: 60, gain: 0.46 },
    { atSec: 1.8, durSec: 0.873, note: 69.69, gain: 0.32 },
    { atSec: 2.1, durSec: 1.018, note: 67.02, gain: 0.34 },
    { atSec: 2.52, durSec: 1.222, note: 63.86, gain: 0.38 },
    { atSec: 2.7, durSec: 0.873, note: 69.69, gain: 0.32 },
    { atSec: 3.15, durSec: 1.528, note: 60, gain: 0.46 },
    { atSec: 3.15, durSec: 1.018, note: 67.02, gain: 0.34 },
    { atSec: 3.6, durSec: 0.873, note: 69.69, gain: 0.32 },
    { atSec: 3.78, durSec: 1.222, note: 63.86, gain: 0.38 },
    { atSec: 4.2, durSec: 1.018, note: 67.02, gain: 0.34 },
    { atSec: 4.5, durSec: 0.873, note: 69.69, gain: 0.32 },
    { atSec: 4.725, durSec: 1.528, note: 60, gain: 0.46 },
    { atSec: 5.04, durSec: 1.222, note: 63.86, gain: 0.38 },
    { atSec: 5.25, durSec: 1.018, note: 67.02, gain: 0.34 },
    { atSec: 5.4, durSec: 0.873, note: 69.69, gain: 0.32 },
    { atSec: 6.3, durSec: 1.05, note: 60, gain: 0.51 },
    { atSec: 6.3, durSec: 1.05, note: 63.86, gain: 0.42 },
    { atSec: 6.3, durSec: 1.05, note: 67.02, gain: 0.37 },
    { atSec: 6.3, durSec: 1.05, note: 69.69, gain: 0.35 },
  ],
}

// D A E as 4:6:9, a fifth on a fifth: three against two, twice over.
const TWO_FIFTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.455, note: 50, gain: 0.55 },
    { atSec: 0, durSec: 0.97, note: 57.02, gain: 0.44 },
    { atSec: 0, durSec: 0.647, note: 64.04, gain: 0.35 },
    { atSec: 0.667, durSec: 0.647, note: 64.04, gain: 0.32 },
    { atSec: 1, durSec: 0.97, note: 57.02, gain: 0.4 },
    { atSec: 1.333, durSec: 0.647, note: 64.04, gain: 0.32 },
    { atSec: 1.5, durSec: 1.455, note: 50, gain: 0.5 },
    { atSec: 2, durSec: 0.97, note: 57.02, gain: 0.4 },
    { atSec: 2, durSec: 0.647, note: 64.04, gain: 0.32 },
    { atSec: 2.667, durSec: 0.647, note: 64.04, gain: 0.32 },
    { atSec: 3, durSec: 1.455, note: 50, gain: 0.5 },
    { atSec: 3, durSec: 0.97, note: 57.02, gain: 0.4 },
    { atSec: 3.333, durSec: 0.647, note: 64.04, gain: 0.32 },
    { atSec: 4, durSec: 0.97, note: 57.02, gain: 0.4 },
    { atSec: 4, durSec: 0.647, note: 64.04, gain: 0.32 },
    { atSec: 4.5, durSec: 1.455, note: 50, gain: 0.5 },
    { atSec: 4.667, durSec: 0.647, note: 64.04, gain: 0.32 },
    { atSec: 5, durSec: 0.97, note: 57.02, gain: 0.4 },
    { atSec: 5.333, durSec: 0.647, note: 64.04, gain: 0.32 },
    { atSec: 6, durSec: 1.3, note: 50, gain: 0.55 },
    { atSec: 6, durSec: 1.3, note: 57.02, gain: 0.44 },
    { atSec: 6, durSec: 1.3, note: 64.04, gain: 0.35 },
  ],
}

// B D F as 5:6:7, the diminished triad from the series.
const LEADING_TRIAD: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.164, note: 59, gain: 0.51 },
    { atSec: 0, durSec: 0.97, note: 62.16, gain: 0.44 },
    { atSec: 0, durSec: 0.831, note: 64.83, gain: 0.4 },
    { atSec: 0.857, durSec: 0.831, note: 64.83, gain: 0.36 },
    { atSec: 1, durSec: 0.97, note: 62.16, gain: 0.4 },
    { atSec: 1.2, durSec: 1.164, note: 59, gain: 0.46 },
    { atSec: 1.714, durSec: 0.831, note: 64.83, gain: 0.36 },
    { atSec: 2, durSec: 0.97, note: 62.16, gain: 0.4 },
    { atSec: 2.4, durSec: 1.164, note: 59, gain: 0.46 },
    { atSec: 2.571, durSec: 0.831, note: 64.83, gain: 0.36 },
    { atSec: 3, durSec: 0.97, note: 62.16, gain: 0.4 },
    { atSec: 3.429, durSec: 0.831, note: 64.83, gain: 0.36 },
    { atSec: 3.6, durSec: 1.164, note: 59, gain: 0.46 },
    { atSec: 4, durSec: 0.97, note: 62.16, gain: 0.4 },
    { atSec: 4.286, durSec: 0.831, note: 64.83, gain: 0.36 },
    { atSec: 4.8, durSec: 1.164, note: 59, gain: 0.46 },
    { atSec: 5, durSec: 0.97, note: 62.16, gain: 0.4 },
    { atSec: 5.143, durSec: 0.831, note: 64.83, gain: 0.36 },
    { atSec: 6, durSec: 1.3, note: 59, gain: 0.51 },
    { atSec: 6, durSec: 1.3, note: 62.16, gain: 0.44 },
    { atSec: 6, durSec: 1.3, note: 64.83, gain: 0.4 },
  ],
}

// F A C E as 8:10:12:15: the F and C lock as two against three, the E runs over them.
const MAJOR_SEVENTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.776, note: 53, gain: 0.48 },
    { atSec: 0, durSec: 0.621, note: 56.86, gain: 0.37 },
    { atSec: 0, durSec: 0.517, note: 60.02, gain: 0.33 },
    { atSec: 0, durSec: 0.414, note: 63.88, gain: 0.3 },
    { atSec: 0.427, durSec: 0.414, note: 63.88, gain: 0.27 },
    { atSec: 0.533, durSec: 0.517, note: 60.02, gain: 0.3 },
    { atSec: 0.64, durSec: 0.621, note: 56.86, gain: 0.34 },
    { atSec: 0.8, durSec: 0.776, note: 53, gain: 0.44 },
    { atSec: 0.853, durSec: 0.414, note: 63.88, gain: 0.27 },
    { atSec: 1.067, durSec: 0.517, note: 60.02, gain: 0.3 },
    { atSec: 1.28, durSec: 0.621, note: 56.86, gain: 0.34 },
    { atSec: 1.28, durSec: 0.414, note: 63.88, gain: 0.27 },
    { atSec: 1.6, durSec: 0.776, note: 53, gain: 0.44 },
    { atSec: 1.6, durSec: 0.517, note: 60.02, gain: 0.3 },
    { atSec: 1.707, durSec: 0.414, note: 63.88, gain: 0.27 },
    { atSec: 1.92, durSec: 0.621, note: 56.86, gain: 0.34 },
    { atSec: 2.133, durSec: 0.517, note: 60.02, gain: 0.3 },
    { atSec: 2.133, durSec: 0.414, note: 63.88, gain: 0.27 },
    { atSec: 2.4, durSec: 0.776, note: 53, gain: 0.44 },
    { atSec: 2.56, durSec: 0.621, note: 56.86, gain: 0.34 },
    { atSec: 2.56, durSec: 0.414, note: 63.88, gain: 0.27 },
    { atSec: 2.667, durSec: 0.517, note: 60.02, gain: 0.3 },
    { atSec: 2.987, durSec: 0.414, note: 63.88, gain: 0.27 },
    { atSec: 3.2, durSec: 0.776, note: 53, gain: 0.44 },
    { atSec: 3.2, durSec: 0.621, note: 56.86, gain: 0.34 },
    { atSec: 3.2, durSec: 0.517, note: 60.02, gain: 0.3 },
    { atSec: 3.413, durSec: 0.414, note: 63.88, gain: 0.27 },
    { atSec: 3.733, durSec: 0.517, note: 60.02, gain: 0.3 },
    { atSec: 3.84, durSec: 0.621, note: 56.86, gain: 0.34 },
    { atSec: 3.84, durSec: 0.414, note: 63.88, gain: 0.27 },
    { atSec: 4, durSec: 0.776, note: 53, gain: 0.44 },
    { atSec: 4.267, durSec: 0.517, note: 60.02, gain: 0.3 },
    { atSec: 4.267, durSec: 0.414, note: 63.88, gain: 0.27 },
    { atSec: 4.48, durSec: 0.621, note: 56.86, gain: 0.34 },
    { atSec: 4.693, durSec: 0.414, note: 63.88, gain: 0.27 },
    { atSec: 4.8, durSec: 0.776, note: 53, gain: 0.44 },
    { atSec: 4.8, durSec: 0.517, note: 60.02, gain: 0.3 },
    { atSec: 5.12, durSec: 0.621, note: 56.86, gain: 0.34 },
    { atSec: 5.12, durSec: 0.414, note: 63.88, gain: 0.27 },
    { atSec: 5.333, durSec: 0.517, note: 60.02, gain: 0.3 },
    { atSec: 5.547, durSec: 0.414, note: 63.88, gain: 0.27 },
    { atSec: 5.6, durSec: 0.776, note: 53, gain: 0.44 },
    { atSec: 5.76, durSec: 0.621, note: 56.86, gain: 0.34 },
    { atSec: 5.867, durSec: 0.517, note: 60.02, gain: 0.3 },
    { atSec: 5.973, durSec: 0.414, note: 63.88, gain: 0.27 },
    { atSec: 6.4, durSec: 0.95, note: 53, gain: 0.48 },
    { atSec: 6.4, durSec: 0.95, note: 56.86, gain: 0.37 },
    { atSec: 6.4, durSec: 0.95, note: 60.02, gain: 0.33 },
    { atSec: 6.4, durSec: 0.95, note: 63.88, gain: 0.3 },
  ],
}

// C G E as 2:3:5, spread over a tenth: ten slow strikes and the meeting.
const WIDE_TENTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.91, note: 48, gain: 0.59 },
    { atSec: 0, durSec: 1.94, note: 55.02, gain: 0.51 },
    { atSec: 0, durSec: 1.164, note: 63.86, gain: 0.42 },
    { atSec: 1.2, durSec: 1.164, note: 63.86, gain: 0.38 },
    { atSec: 2, durSec: 1.94, note: 55.02, gain: 0.46 },
    { atSec: 2.4, durSec: 1.164, note: 63.86, gain: 0.38 },
    { atSec: 3, durSec: 2.91, note: 48, gain: 0.54 },
    { atSec: 3.6, durSec: 1.164, note: 63.86, gain: 0.38 },
    { atSec: 4, durSec: 1.94, note: 55.02, gain: 0.46 },
    { atSec: 4.8, durSec: 1.164, note: 63.86, gain: 0.38 },
    { atSec: 6, durSec: 1.35, note: 48, gain: 0.59 },
    { atSec: 6, durSec: 1.35, note: 55.02, gain: 0.51 },
    { atSec: 6, durSec: 1.35, note: 63.86, gain: 0.42 },
  ],
}

// Harmonics one to six of a low C, each struck as often as its number.
const SERIES_OF_LOW_C: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.014, note: 36, gain: 0.66 },
    { atSec: 0, durSec: 3.007, note: 48, gain: 0.53 },
    { atSec: 0, durSec: 2.005, note: 55.02, gain: 0.46 },
    { atSec: 0, durSec: 1.504, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 1.203, note: 63.86, gain: 0.35 },
    { atSec: 0, durSec: 1.002, note: 67.02, gain: 0.33 },
    { atSec: 1.033, durSec: 1.002, note: 67.02, gain: 0.3 },
    { atSec: 1.24, durSec: 1.203, note: 63.86, gain: 0.32 },
    { atSec: 1.55, durSec: 1.504, note: 60, gain: 0.36 },
    { atSec: 2.067, durSec: 2.005, note: 55.02, gain: 0.42 },
    { atSec: 2.067, durSec: 1.002, note: 67.02, gain: 0.3 },
    { atSec: 2.48, durSec: 1.203, note: 63.86, gain: 0.32 },
    { atSec: 3.1, durSec: 3.007, note: 48, gain: 0.48 },
    { atSec: 3.1, durSec: 1.504, note: 60, gain: 0.36 },
    { atSec: 3.1, durSec: 1.002, note: 67.02, gain: 0.3 },
    { atSec: 3.72, durSec: 1.203, note: 63.86, gain: 0.32 },
    { atSec: 4.133, durSec: 2.005, note: 55.02, gain: 0.42 },
    { atSec: 4.133, durSec: 1.002, note: 67.02, gain: 0.3 },
    { atSec: 4.65, durSec: 1.504, note: 60, gain: 0.36 },
    { atSec: 4.96, durSec: 1.203, note: 63.86, gain: 0.32 },
    { atSec: 5.167, durSec: 1.002, note: 67.02, gain: 0.3 },
    { atSec: 6.2, durSec: 1.15, note: 36, gain: 0.66 },
    { atSec: 6.2, durSec: 1.15, note: 48, gain: 0.53 },
    { atSec: 6.2, durSec: 1.15, note: 55.02, gain: 0.46 },
    { atSec: 6.2, durSec: 1.15, note: 60, gain: 0.4 },
    { atSec: 6.2, durSec: 1.15, note: 63.86, gain: 0.35 },
    { atSec: 6.2, durSec: 1.15, note: 67.02, gain: 0.33 },
  ],
}

// Harmonics two to six of C3, for bells: each as often as its number.
const SERIES_HIGH: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.91, note: 60, gain: 0.55 },
    { atSec: 0, durSec: 1.94, note: 67.02, gain: 0.48 },
    { atSec: 0, durSec: 1.455, note: 72, gain: 0.42 },
    { atSec: 0, durSec: 1.164, note: 75.86, gain: 0.37 },
    { atSec: 0, durSec: 0.97, note: 79.02, gain: 0.33 },
    { atSec: 1, durSec: 0.97, note: 79.02, gain: 0.3 },
    { atSec: 1.2, durSec: 1.164, note: 75.86, gain: 0.34 },
    { atSec: 1.5, durSec: 1.455, note: 72, gain: 0.38 },
    { atSec: 2, durSec: 1.94, note: 67.02, gain: 0.44 },
    { atSec: 2, durSec: 0.97, note: 79.02, gain: 0.3 },
    { atSec: 2.4, durSec: 1.164, note: 75.86, gain: 0.34 },
    { atSec: 3, durSec: 2.91, note: 60, gain: 0.5 },
    { atSec: 3, durSec: 1.455, note: 72, gain: 0.38 },
    { atSec: 3, durSec: 0.97, note: 79.02, gain: 0.3 },
    { atSec: 3.6, durSec: 1.164, note: 75.86, gain: 0.34 },
    { atSec: 4, durSec: 1.94, note: 67.02, gain: 0.44 },
    { atSec: 4, durSec: 0.97, note: 79.02, gain: 0.3 },
    { atSec: 4.5, durSec: 1.455, note: 72, gain: 0.38 },
    { atSec: 4.8, durSec: 1.164, note: 75.86, gain: 0.34 },
    { atSec: 5, durSec: 0.97, note: 79.02, gain: 0.3 },
    { atSec: 6, durSec: 1.3, note: 60, gain: 0.55 },
    { atSec: 6, durSec: 1.3, note: 67.02, gain: 0.48 },
    { atSec: 6, durSec: 1.3, note: 72, gain: 0.42 },
    { atSec: 6, durSec: 1.3, note: 75.86, gain: 0.37 },
    { atSec: 6, durSec: 1.3, note: 79.02, gain: 0.33 },
  ],
}

// D A D A from the second octave as 2:3:4:6: a bass that counts two against three.
const LOW_FIFTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.91, note: 38, gain: 0.62 },
    { atSec: 0, durSec: 1.94, note: 45.02, gain: 0.51 },
    { atSec: 0, durSec: 1.455, note: 50, gain: 0.42 },
    { atSec: 0, durSec: 0.97, note: 57.02, gain: 0.33 },
    { atSec: 1, durSec: 0.97, note: 57.02, gain: 0.3 },
    { atSec: 1.5, durSec: 1.455, note: 50, gain: 0.38 },
    { atSec: 2, durSec: 1.94, note: 45.02, gain: 0.46 },
    { atSec: 2, durSec: 0.97, note: 57.02, gain: 0.3 },
    { atSec: 3, durSec: 2.91, note: 38, gain: 0.56 },
    { atSec: 3, durSec: 1.455, note: 50, gain: 0.38 },
    { atSec: 3, durSec: 0.97, note: 57.02, gain: 0.3 },
    { atSec: 4, durSec: 1.94, note: 45.02, gain: 0.46 },
    { atSec: 4, durSec: 0.97, note: 57.02, gain: 0.3 },
    { atSec: 4.5, durSec: 1.455, note: 50, gain: 0.38 },
    { atSec: 5, durSec: 0.97, note: 57.02, gain: 0.3 },
    { atSec: 6, durSec: 1.35, note: 38, gain: 0.62 },
    { atSec: 6, durSec: 1.35, note: 45.02, gain: 0.51 },
    { atSec: 6, durSec: 1.35, note: 50, gain: 0.42 },
    { atSec: 6, durSec: 1.35, note: 57.02, gain: 0.33 },
  ],
}

// C E G as 4:5:6, then C F A as 3:4:5: C is held in common, E and G each rise a step.
const TURNED_OVER: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.776, note: 60, gain: 0.53 },
    { atSec: 0, durSec: 0.621, note: 63.86, gain: 0.44 },
    { atSec: 0, durSec: 0.517, note: 67.02, gain: 0.4 },
    { atSec: 0.533, durSec: 0.517, note: 67.02, gain: 0.36 },
    { atSec: 0.64, durSec: 0.621, note: 63.86, gain: 0.4 },
    { atSec: 0.8, durSec: 0.776, note: 60, gain: 0.48 },
    { atSec: 1.067, durSec: 0.517, note: 67.02, gain: 0.36 },
    { atSec: 1.28, durSec: 0.621, note: 63.86, gain: 0.4 },
    { atSec: 1.6, durSec: 0.776, note: 60, gain: 0.48 },
    { atSec: 1.6, durSec: 0.517, note: 67.02, gain: 0.36 },
    { atSec: 1.92, durSec: 0.621, note: 63.86, gain: 0.4 },
    { atSec: 2.133, durSec: 0.517, note: 67.02, gain: 0.36 },
    { atSec: 2.4, durSec: 0.776, note: 60, gain: 0.48 },
    { atSec: 2.56, durSec: 0.621, note: 63.86, gain: 0.4 },
    { atSec: 2.667, durSec: 0.517, note: 67.02, gain: 0.36 },
    { atSec: 3.2, durSec: 1.035, note: 60, gain: 0.55 },
    { atSec: 3.2, durSec: 0.776, note: 64.98, gain: 0.46 },
    { atSec: 3.2, durSec: 0.621, note: 68.84, gain: 0.42 },
    { atSec: 3.84, durSec: 0.621, note: 68.84, gain: 0.38 },
    { atSec: 4, durSec: 0.776, note: 64.98, gain: 0.42 },
    { atSec: 4.267, durSec: 1.035, note: 60, gain: 0.5 },
    { atSec: 4.48, durSec: 0.621, note: 68.84, gain: 0.38 },
    { atSec: 4.8, durSec: 0.776, note: 64.98, gain: 0.42 },
    { atSec: 5.12, durSec: 0.621, note: 68.84, gain: 0.38 },
    { atSec: 5.333, durSec: 1.035, note: 60, gain: 0.5 },
    { atSec: 5.6, durSec: 0.776, note: 64.98, gain: 0.42 },
    { atSec: 5.76, durSec: 0.621, note: 68.84, gain: 0.38 },
    { atSec: 6.4, durSec: 0.95, note: 60, gain: 0.55 },
    { atSec: 6.4, durSec: 0.95, note: 64.98, gain: 0.46 },
    { atSec: 6.4, durSec: 0.95, note: 68.84, gain: 0.42 },
  ],
}

// G E C as 3:5:8, C in second inversion and open position.
const THREE_FIVE_EIGHT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.728, note: 72, gain: 0.34 },
    { atSec: 0, durSec: 1.164, note: 63.86, gain: 0.44 },
    { atSec: 0, durSec: 1.94, note: 55.02, gain: 0.55 },
    { atSec: 0.75, durSec: 0.728, note: 72, gain: 0.31 },
    { atSec: 1.2, durSec: 1.164, note: 63.86, gain: 0.4 },
    { atSec: 1.5, durSec: 0.728, note: 72, gain: 0.31 },
    { atSec: 2, durSec: 1.94, note: 55.02, gain: 0.5 },
    { atSec: 2.25, durSec: 0.728, note: 72, gain: 0.31 },
    { atSec: 2.4, durSec: 1.164, note: 63.86, gain: 0.4 },
    { atSec: 3, durSec: 0.728, note: 72, gain: 0.31 },
    { atSec: 3.6, durSec: 1.164, note: 63.86, gain: 0.4 },
    { atSec: 3.75, durSec: 0.728, note: 72, gain: 0.31 },
    { atSec: 4, durSec: 1.94, note: 55.02, gain: 0.5 },
    { atSec: 4.5, durSec: 0.728, note: 72, gain: 0.31 },
    { atSec: 4.8, durSec: 1.164, note: 63.86, gain: 0.4 },
    { atSec: 5.25, durSec: 0.728, note: 72, gain: 0.31 },
    { atSec: 6, durSec: 1.35, note: 55.02, gain: 0.55 },
    { atSec: 6, durSec: 1.35, note: 63.86, gain: 0.44 },
    { atSec: 6, durSec: 1.35, note: 72, gain: 0.34 },
  ],
}

// G D F as 4:6:7 from the second octave, the F 31 cents low: a bass with its seventh.
const LOW_SEVENTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.831, note: 52.69, gain: 0.36 },
    { atSec: 0, durSec: 0.97, note: 50.02, gain: 0.44 },
    { atSec: 0, durSec: 1.455, note: 43, gain: 0.58 },
    { atSec: 0.857, durSec: 0.831, note: 52.69, gain: 0.33 },
    { atSec: 1, durSec: 0.97, note: 50.02, gain: 0.4 },
    { atSec: 1.5, durSec: 1.455, note: 43, gain: 0.53 },
    { atSec: 1.714, durSec: 0.831, note: 52.69, gain: 0.33 },
    { atSec: 2, durSec: 0.97, note: 50.02, gain: 0.4 },
    { atSec: 2.571, durSec: 0.831, note: 52.69, gain: 0.33 },
    { atSec: 3, durSec: 0.97, note: 50.02, gain: 0.4 },
    { atSec: 3, durSec: 1.455, note: 43, gain: 0.53 },
    { atSec: 3.429, durSec: 0.831, note: 52.69, gain: 0.33 },
    { atSec: 4, durSec: 0.97, note: 50.02, gain: 0.4 },
    { atSec: 4.286, durSec: 0.831, note: 52.69, gain: 0.33 },
    { atSec: 4.5, durSec: 1.455, note: 43, gain: 0.53 },
    { atSec: 5, durSec: 0.97, note: 50.02, gain: 0.4 },
    { atSec: 5.143, durSec: 0.831, note: 52.69, gain: 0.33 },
    { atSec: 6, durSec: 1.35, note: 43, gain: 0.58 },
    { atSec: 6, durSec: 1.35, note: 50.02, gain: 0.44 },
    { atSec: 6, durSec: 1.35, note: 52.69, gain: 0.36 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'rhythm-of-a-chord-slowest-voice-of-three',
    name: 'Slowest voice of three',
    category: 'bell',
    description:
      'A soft low-pass-gate mallet that decays over three seconds, with soft tape repeats and a warm hall.',
    preview: MAJOR_MEETS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { decay: 3, fold: 0.1, colour: 0.3, attack: 0.008, drift: 0.1 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Warm repeats',
        params: { time: 750, feedback: 0.3, mix: 0.22 },
      },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-fives-on-a-thumbnail',
    name: 'Fives on a thumbnail',
    category: 'plucked',
    description:
      'A buzzing thumb-piano pluck of just over a second, played inside a small wooden body.',
    preview: TURNED_OVER,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Thumb piano',
      params: { volume: -1, decay: 1.2, fold: 0.3, fm: 0.28, symmetry: 0.7, colour: 0.6 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.45, size: 0.8 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-sixth-strike-lands-true',
    name: 'Sixth strike lands true',
    category: 'plucked',
    description:
      'A bright folded wood pluck with a one-second decay, its top thrown wide, over a faint spring.',
    preview: FOURTH_ON_TOP,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: {
        volume: -4,
        decay: 1,
        fold: 0.55,
        ratio: 0,
        timbreEnv: 0.7,
        colour: 0.85,
        chance: 0.1,
      },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide top' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-two-low-against-three',
    name: 'Two low against three',
    category: 'bass',
    description:
      'A heavily folded low tone, three seconds down to a quarter of its level, dulled and thickened through a warm drive.',
    preview: LOW_FIFTHS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Round bass',
      params: {
        decay: 3,
        fold: 0.7,
        symmetry: 0.7,
        fm: 0.08,
        timbreEnv: 0.25,
        attack: 0.03,
        sustain: 0.25,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-fifteen-soft-knocks',
    name: 'Fifteen soft knocks',
    category: 'plucked',
    description:
      'A hollow knock of a third of a second, each attack blurred into a short puff of fog.',
    preview: MINOR_MEETS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow bongo',
      params: { volume: 0, decay: 0.36, fm: 0.25, attack: 0.006, colour: 0.35, chance: 0.2 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Short blur', params: { mix: 0.75 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-glass-counted-to-twenty',
    name: 'Glass counted to twenty',
    category: 'bell',
    description:
      'A long glass bell, frequency-modulated at five to one, throwing off small high sparks in a wide space.',
    preview: SERIES_HIGH,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Glass bell',
      params: { decay: 5, fm: 0.42, ratio: 6, colour: 0.85, drift: 0.4 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Faint dust', params: { mix: 0.2 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 7, mix: 0.3 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-seven-chimes-lean-flat',
    name: 'Seven chimes lean flat',
    category: 'bell',
    description:
      'Small metal chimes that decay over one pulse of the lowest voice, shaded, their colours fanned out from low to high.',
    preview: FLAT_SEVENTH,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Small chimes',
      params: { volume: -4, decay: 1.575, fm: 0.35, ratio: 5, fold: 0.12, chance: 0.1 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Short chirp', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-harp-of-five-to-the-bar',
    name: 'Harp of five to the bar',
    category: 'plucked',
    description:
      'A bright folding pluck panned from side to side in a cycle of 1.2 seconds, with dim analogue echoes.',
    preview: THREE_FIVE_EIGHT,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Bright harp',
      params: { volume: -6.5, decay: 2, fold: 0.45, colour: 0.75, timbreEnv: 0.55 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { drift: 0, rate: 0.8333, depth: 0.8 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 600, mix: 0.25 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-bloom-beneath-the-count',
    name: 'Bloom beneath the count',
    category: 'pad',
    description:
      'Each note opens over a second as its folds unwrap, the whole pad breathing on a slow tremolo in a wide chorus.',
    preview: WIDE_TENTH,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Slow bloom',
      params: { volume: -4, attack: 1, decay: 5, sustain: 0.9, fold: 0.4, symmetry: 0.1 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.5, depth: 0.35 } },
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-pure-tones-two-gates',
    name: 'Pure tones, two gates',
    category: 'pad',
    description:
      'A plain sine swell gated on five steps of eight in three seconds, a second gate drifting ahead, in a dark hall.',
    preview: WIDE_TENTH,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Sine swell',
      params: { volume: -7.5, attack: 0.15, decay: 4, sustain: 0.85, fold: 0.08, drift: 0.2 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Slow drift', params: { rate: 2.6667, mix: 0.85 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-reeds-at-three-to-four',
    name: 'Reeds at three to four',
    category: 'organ',
    description:
      'Folded reeds with a quarter-second onset, under a dark low-pass that moves very slowly, turning on a slow rotor.',
    preview: FOURTH_ON_TOP,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folded reeds',
      params: { volume: -11, attack: 0.25, decay: 1.5, sustain: 0.8, symmetry: 0.75, colour: 0.35 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.7 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-gong-where-all-agree',
    name: 'Gong where all agree',
    category: 'bell',
    description:
      'A long dark gong built on the three-to-two ratio, set some way off with its own room, its tail brought up.',
    preview: THREE_FIVE_EIGHT,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Long gong',
      params: { volume: -19.5, decay: 8, fm: 0.55, ratio: 2, colour: 0.22, fold: 0.2 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Back of the hall' },
      { deviceId: 'lift', preset: 'Long tails' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-wood-rain-nine-drops',
    name: 'Wood rain, nine drops',
    category: 'texture',
    description:
      'Wooden ticks of a third of a second, no two alike, that skip away in closing bounces, warmed and squashed.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Rain on wood',
      params: { volume: 6, decay: 0.38, colour: 0.5, chance: 0.5, fold: 0.35, attack: 0.003 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'fet-limiter', preset: 'Squash' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-undertone-in-halves',
    name: 'Undertone in halves',
    category: 'bass',
    description:
      'A low pulse modulated an octave under its note, partly sustained, warmed by tape saturation and kept narrow.',
    preview: LOW_SEVENTH,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Deep pulse',
      params: { decay: 2, sustain: 0.4, colour: 0.12, symmetry: 0.25 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-pipes-six-eight-nine',
    name: 'Pipes six, eight, nine',
    category: 'wind',
    description:
      'Hollow pipes that speak in an eighth of a second, two wandering copies close beside them, in a small booth.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow pipes',
      params: { volume: -4, attack: 0.12, decay: 2, sustain: 0.6, fm: 0.22 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by', params: { mix: 0.45 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-once-round-the-cycle',
    name: 'Once round the cycle',
    category: 'drone',
    description:
      'A slow folding drone of asymmetric tone, split into bands that each swell and drift at their own speed.',
    preview: WIDE_TENTH,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folding drone',
      params: { attack: 0.9, fold: 0.55, symmetry: 0.6, ratio: 3, fm: 0.2, colour: 0.5 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide' },
      { deviceId: 'ambient-eq', preset: 'Drone' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-partials-in-the-grain',
    name: 'Partials in the grain',
    category: 'plucked',
    description:
      'A drifting pluck modulated by its own third harmonic, answered once, quietly, one pulse of the fourth harmonic later.',
    preview: SERIES_OF_LOW_C,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { ratio: 4, fm: 0.45, decay: 1.55, chance: 0.45, drift: 0.6, fold: 0.15 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Faint answer', params: { gap: 1.55 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-seventh-on-worn-tape',
    name: 'Seventh on worn tape',
    category: 'keys',
    description:
      'A mellow frequency-modulated mallet through slow phasing and a worn tape with an unsteady pitch.',
    preview: FLAT_SEVENTH,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: {
        volume: 0,
        fm: 0.28,
        ratio: 3,
        decay: 1.26,
        colour: 0.55,
        fold: 0.2,
        attack: 0.003,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.5 } },
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.1 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-tines-against-the-wheel',
    name: 'Tines against the wheel',
    category: 'keys',
    description:
      'A barking stage tine whose tremolo turns in 1.2 seconds, the pulse of the third, lightly widened, on a small plate.',
    preview: MAJOR_MEETS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: {
        tremolo: 0.75,
        tremoloRate: 0.8333,
        decay: 0.6,
        bell: 0,
        bark: 1,
        tone: 0.8,
        drive: 0.5,
        release: 0.4,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-bells-under-four-voices',
    name: 'Bells under four voices',
    category: 'keys',
    description:
      'Bell-heavy tines with little bark, ringing on in a faint table of bowls tuned to F major.',
    preview: MAJOR_SEVENTH,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bell: 0.7, decay: 1.5, tone: 0.7 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Faint halo',
        params: { root: 5, scale: 2, mix: 0.25, ring: 6 },
      },
      { deviceId: 'stereo-detune', preset: 'Faint width' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-ten-on-dark-felt',
    name: 'Ten on dark felt',
    category: 'keys',
    description:
      'Dark soft-struck tines of which only what two strikes have in common rings on, in a dark plate.',
    preview: MINOR_MEETS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { decay: 0.7, tone: 0.35, bell: 0.3, hardness: 0.3, release: 0.9 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.75 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-pan-from-meet-to-meet',
    name: 'Pan from meet to meet',
    category: 'keys',
    description:
      'Thinned tines that cross the stage and come back in one cycle of the chord, recalled now and then by a long echo memory.',
    preview: TURNED_OVER,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { tremoloRate: 0.3125, decay: 1.4, tone: 0.6, bell: 0.6 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Recalling', params: { time: 800, mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-short-bars-sixth-chord',
    name: 'Short bars, sixth chord',
    category: 'keys',
    description: 'Short barking tines smeared by a thin fog, evened by a gentle limiter.',
    preview: SIXTH_CHORD,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: { volume: -10.5, decay: 0.5, release: 0.12, bark: 0.45, tone: 0.55 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-dampers-up-till-unison',
    name: 'Dampers up till unison',
    category: 'keys',
    description:
      'Tines with the dampers off and long decays, caught and held as a thin even pad behind.',
    preview: THREE_FIVE_EIGHT,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { decay: 3, bell: 0.5, tone: 0.55, hardness: 0.45 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Thin halo', params: { mix: 0.35 } },
      { deviceId: 'tamer', preset: 'Even' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-two-under-water',
    name: 'Two under water',
    category: 'bass',
    description:
      'Deep muffled tines an overdriven amplifier rounds off, half under water and slowly wavering.',
    preview: LOW_FIFTHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Underwater keys',
      params: { decay: 2, release: 1, tone: 0.2, drive: 0.4 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Just under' },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-glass-tines-of-a-series',
    name: 'Glass tines of a series',
    category: 'bell',
    description:
      'Hard glassy tines with no bark and a short decay, their tail climbing softly by octaves.',
    preview: SERIES_HIGH,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glass bells',
      params: { volume: -13, decay: 0.7, release: 1.6 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { decay: 6, mix: 0.3 } }],
  },
  {
    id: 'rhythm-of-a-chord-reed-on-stacked-fifths',
    name: 'Reed on stacked fifths',
    category: 'organ',
    description:
      'All bark and no bell, softly struck and long held, through a slow rotor and a dark boxy tone.',
    preview: TWO_FIFTHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Reedy flutter',
      params: { volume: -15, decay: 3, tremolo: 0.25, tremoloRate: 1, tone: 0.6, release: 0.4 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend' },
      { deviceId: 'imprint', preset: 'Dark box', params: { amount: 0.5 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-five-six-seven-horn',
    name: 'Five-six-seven horn',
    category: 'keys',
    description:
      'Driven tines through a horn speaker down a platform, their bands shimmering at seven swells in six seconds.',
    preview: LEADING_TRIAD,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Warm overdrive',
      params: { volume: 3, drive: 0.4, bark: 0.5, bell: 0.55, decay: 0.8, tremolo: 0, tone: 0.7 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Station platform', params: { drive: 0.3 } },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 1.1667, drift: 0 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-throb-counted-in-sixes',
    name: 'Throb counted in sixes',
    category: 'bass',
    description:
      'Low tines with a deep tremolo once a second, at the pulse of the fifth, swept by a phaser that spares the bass.',
    preview: LOW_SEVENTH,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Deep throb',
      params: { volume: -16, tremoloRate: 1, tremolo: 0.8, decay: 2, bark: 0.45, tone: 0.45 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe' },
      { deviceId: 'spread', preset: 'Firm bass' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-flicker-over-the-fourth',
    name: 'Flicker over the fourth',
    category: 'keys',
    description:
      'Bright thin tines with a six-a-second shimmer, doubled an octave and two octaves up.',
    preview: FOURTH_ON_TOP,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Fast shimmer',
      params: { volume: -12, tremoloRate: 6, tremolo: 0.7, decay: 0.9, release: 0.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves' },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-chord-behind-its-pulses',
    name: 'Chord behind its pulses',
    category: 'pad',
    description:
      'Long tines with their attacks swelled away, a soft string pad of the same chord growing slowly behind.',
    preview: MAJOR_MEETS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { decay: 2.5, tremolo: 0, bell: 0.3, tone: 0.4 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 250, depth: 1 } },
      { deviceId: 'pad-follower', preset: 'Lingering', params: { mix: 0.55 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-palms-on-four-and-six',
    name: 'Palms on four and six',
    category: 'bell',
    description:
      'A soft steel pan with long sympathy between its notes, answered once by a tape head a second and a half later.',
    preview: MAJOR_MEETS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Soft hands',
      params: { volume: 0.5, decay: 3, touch: 0.2, position: 0.3, sympathy: 0.8, cavity: 0.3 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 1500, mix: 0.25 } },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-low-ding-of-the-fours',
    name: 'Low ding of the fours',
    category: 'bass',
    description:
      'A low pan struck half way out with a thump of air, the octave below added, turned by a dark slow rotor drum.',
    preview: TWO_FIFTHS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Low ding',
      params: { decay: 3, cavity: 0.8, touch: 0.6, shimmer: 0.6, position: 0.55, sympathy: 0.8 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0, sub1: 0.5 } },
      { deviceId: 'rotary', preset: 'Dark drum' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-halo-at-the-unison',
    name: 'Halo at the unison',
    category: 'bell',
    description:
      'A shimmering pan whose notes all answer each other, blurred into a glassy halo that hangs.',
    preview: TWO_FIFTHS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Halo',
      params: { volume: -1, decay: 6, shimmer: 1, touch: 0.12 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.45 } }],
  },
  {
    id: 'rhythm-of-a-chord-tongue-drum-by-tenths',
    name: 'Tongue drum by tenths',
    category: 'bell',
    description:
      'A tongue drum struck a third of the way out, its colours delayed one after another from low to high.',
    preview: WIDE_TENTH,
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { volume: -1.5, decay: 4.5, touch: 0.35, position: 0.35, shimmer: 0.1 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Slow unfolding', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-fingertip-sevenths',
    name: 'Fingertip sevenths',
    category: 'plucked',
    description: 'Short damped taps at the edge of the pan, scattered into seven uneven echoes.',
    preview: FLAT_SEVENTH,
    instrument: {
      deviceId: 'handpan',
      preset: 'Rain taps',
      params: { volume: -0.5, decay: 0.9, touch: 0.45, position: 0.95, shimmer: 0.6, damp: 0.6 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-knuckle-hemiola',
    name: 'Knuckle hemiola',
    category: 'bell',
    description:
      'Hard knuckle strikes a second and a half long, worn by an unsteady cassette, in a narrow warm spring.',
    preview: TWO_FIFTHS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Knuckles',
      params: { volume: 0, decay: 1.5, position: 0.7, shimmer: 0.25, touch: 0.8 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.08 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-bright-tongues-in-sixths',
    name: 'Bright tongues in sixths',
    category: 'bell',
    description:
      'A bright tongue drum whose spectrum is stretched towards a chime, half mixed, in a bright chamber.',
    preview: SIXTH_CHORD,
    instrument: {
      deviceId: 'handpan',
      preset: 'Bright tongue',
      params: { volume: 4.5, decay: 3, touch: 0.6, position: 0.7 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Soft chime', params: { stretch: 0.22, mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-slit-log-in-three-meters',
    name: 'Slit log in three meters',
    category: 'plucked',
    description:
      'A short slit drum with a deep cavity played inside a drum head that rings with it.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'handpan',
      preset: 'Slit drum',
      params: { volume: 3, decay: 0.6, cavity: 0.8, touch: 0.35, position: 0.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { size: 1.4, mix: 0.45 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-pure-tongue-of-tens',
    name: 'Pure tongue of tens',
    category: 'pad',
    description:
      'Pure soft tongues with ten-second tails, bowed in over a third of a second and doubled by slow chorus.',
    preview: WIDE_TENTH,
    instrument: {
      deviceId: 'handpan',
      preset: 'Pure tongue',
      params: { volume: 3, sympathy: 0.6 },
    },
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 300 } },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-tank-at-the-crossing',
    name: 'Tank at the crossing',
    category: 'bell',
    description:
      'A tank drum full of low air that walks past, near and far, with its own short room.',
    preview: TURNED_OVER,
    instrument: {
      deviceId: 'handpan',
      preset: 'Tank drum',
      params: { volume: -1.5, decay: 3.2, touch: 0.5, shimmer: 0.3, damp: 0, sympathy: 0.4 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Slow tide', params: { rate: 0.1563 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-edge-tones-odd-meter',
    name: 'Edge tones, odd meter',
    category: 'bell',
    description:
      'Edge strikes rich in overtones, the quiet ones brought forward, panned at seven swings in six seconds.',
    preview: LEADING_TRIAD,
    instrument: {
      deviceId: 'handpan',
      preset: 'Edge overtones',
      params: { volume: -1.5, decay: 4, shimmer: 0.35, sympathy: 0.3 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones' },
      {
        deviceId: 'tremolo',
        preset: 'Wandering pan',
        params: { shape: 0, drift: 0, rate: 1.1667, depth: 0.6 },
      },
    ],
  },
  {
    id: 'rhythm-of-a-chord-muted-palm-full-sum',
    name: 'Muted palm, full sum',
    category: 'plucked',
    description:
      'A palm-muted pan of plain low thumps, each followed by a soft late ghost of its strike.',
    preview: MAJOR_SEVENTH,
    instrument: {
      deviceId: 'handpan',
      preset: 'Palm mute',
      params: { volume: 6, decay: 1.5, damp: 0.8, touch: 0.3, position: 0.3, shimmer: 0.1 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Ghost puffs', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-every-key-its-own-count',
    name: 'Every key its own count',
    category: 'keys',
    description:
      'A piano with a different object on each key, traced faintly by three loops of unequal length.',
    preview: MAJOR_SEVENTH,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Small orchestra',
      params: { volume: 4.5, amount: 0.75, rattle: 0.3, decay: 0.8 },
    },
    effects: [
      { deviceId: 'orbits', preset: 'Faint trace', params: { mix: 0.2 } },
      { deviceId: 'ambient-eq', preset: 'Keys' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-bare-strings-pure-third',
    name: 'Bare strings, pure third',
    category: 'keys',
    description:
      'A plain piano with nothing on its strings, its unisons close, with strings tuned to what it plays ringing behind.',
    preview: TURNED_OVER,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Plain piano',
      params: { detune: 0.1, hammer: 0.35, decay: 1.5, tone: 0.6 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.35 } }],
  },
  {
    id: 'rhythm-of-a-chord-bolts-at-two-and-three',
    name: 'Bolts at two and three',
    category: 'bell',
    description:
      'Heavily bolted strings as low gongs with a long decay, wandering slowly around the head in a dark hall.',
    preview: LOW_FIFTHS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Bolt gongs',
      params: { volume: 1, amount: 0.7, decay: 2.2, hammer: 0.3, rattle: 0.1 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow wander' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-light-bolts-eight-up',
    name: 'Light bolts, eight up',
    category: 'bell',
    description:
      'Lightly bolted strings touched at half their length, brightened and swept by a slow flange on a bright plate.',
    preview: THREE_FIVE_EIGHT,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Light bolts',
      params: { volume: 5, decay: 1.2, tone: 0.9, rattle: 0.1 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-rattle-until-they-agree',
    name: 'Rattle until they agree',
    category: 'texture',
    description:
      'Loose rattling bolts with their harsh tones tamed, set across the room and printed to a four-track cassette.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rattling bolts',
      params: { volume: 2.5, amount: 0.6, hammer: 0.5, decay: 1, tone: 0.6 },
    },
    effects: [
      { deviceId: 'tamer', preset: 'Harsh sample' },
      { deviceId: 'distance', preset: 'Across the room' },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.1 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-rubber-on-the-tens',
    name: 'Rubber on the tens',
    category: 'plucked',
    description: 'Rubber-stopped thunks that bounce away as closing echoes, pushed into a limiter.',
    preview: MINOR_MEETS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rubber thunks',
      params: { volume: 5, amount: 0.75, hammer: 0.35, thud: 0.3, decay: 1.4 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Nearly dry', params: { mix: 0.3, first: 427 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-rubber-fifth-on-fifth',
    name: 'Rubber fifth on fifth',
    category: 'keys',
    description:
      'Soft rubber between the strings, an octave below drawn on a pedal stop that speaks a little after the note.',
    preview: TWO_FIFTHS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Soft rubber',
      params: { volume: 6, decay: 2, tone: 0.85, detune: 0.2 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Pedal under', params: { mix: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-felt-strip-low-seventh',
    name: 'Felt strip, low seventh',
    category: 'keys',
    description:
      'A nearly full felt mute, dark in tone, with chorused analogue echoes one pulse of the fifth apart.',
    preview: FLAT_SEVENTH,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt mute',
      params: { volume: 3.5, amount: 0.85, hammer: 0.4, decay: 1.3, tone: 0.55 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 1050, feedback: 0.35, mix: 0.3 },
      },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-whisper-of-the-tenth',
    name: 'Whisper of the tenth',
    category: 'keys',
    description:
      'Barely struck felted strings, long in decay, with pure sines an octave up swelling in behind each.',
    preview: WIDE_TENTH,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt whisper',
      params: { volume: -1, decay: 2.5, tone: 0.7, hammer: 0.22 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.35 } }],
  },
  {
    id: 'rhythm-of-a-chord-paper-at-eight-to-nine',
    name: 'Paper at eight to nine',
    category: 'keys',
    description:
      'Strings buzzing under paper, through a small bedside speaker and a two-spring tank.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper buzz',
      params: { volume: 2.5, amount: 0.65, hammer: 0.45, decay: 0.7, tone: 0.65 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0.05 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-wood-blocks-by-seven',
    name: 'Wood blocks by seven',
    category: 'plucked',
    description:
      'Hard rubber-stopped blocks of almost no length, each struck inside a small clay pot and driven into a limiter.',
    preview: LEADING_TRIAD,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Wood blocks',
      params: { volume: 5, amount: 0.65, decay: 0.6, hammer: 0.7, tone: 0.75 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-temple-bolts-one-cycle',
    name: 'Temple bolts, one cycle',
    category: 'bell',
    description:
      'Deep beating gongs of bolted strings with very long decays, their tail sagging and darkening as it ages.',
    preview: SERIES_OF_LOW_C,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Temple gongs',
      params: { volume: -1.5, decay: 3.5, amount: 0.85, detune: 0.8 },
    },
    effects: [{ deviceId: 'melt', preset: 'Slow melt', params: { mix: 0.35 } }],
  },
  {
    id: 'rhythm-of-a-chord-single-strings-pure',
    name: 'Single strings, pure',
    category: 'plucked',
    description:
      'One open string to a note, plucked by finger near its middle in a koto body, traced by a faint echo 1.2 seconds on.',
    preview: MAJOR_MEETS,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: {
        volume: -8,
        position: 0.42,
        decay: 5,
        release: 3,
        brightness: 0.4,
        sympathy: 0.1,
        body: 3,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 1200, mix: 0.2 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-koto-over-three-pulses',
    name: 'Koto over three pulses',
    category: 'plucked',
    description:
      'A picked koto string close to the bridge, short in decay, bounced off two slack springs.',
    preview: FOURTH_ON_TOP,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { volume: -2, decay: 2, brightness: 0.75, position: 0.09 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.3, drive: 0.15 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-two-courses-five-on-six',
    name: 'Two courses, five on six',
    category: 'plucked',
    description:
      'Doubled picked courses and their octaves with a five-second decay, faintly phased and opened in the middle.',
    preview: SIXTH_CHORD,
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: {
        volume: 0.5,
        decay: 5,
        release: 3,
        strum: 0,
        courses: 1,
        sympathy: 0.35,
        brightness: 0.7,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Faint shade' },
      { deviceId: 'spread', preset: 'Open middle' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-felt-hammer-tens',
    name: 'Felt hammer, tens',
    category: 'keys',
    description:
      'A soft felt hammer on single strings, dark and plain, answered by its own sound turned backwards, on a dark plate.',
    preview: MINOR_MEETS,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { volume: -0.5, decay: 3, release: 1.5, brightness: 0.3, courses: 0.2 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { time: 640, mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-shimmer-rolled-in-nines',
    name: 'Shimmer rolled in nines',
    category: 'string',
    description:
      'Hammered strings and their octaves rolled at nine strokes a second, their attacks rounded off, spread wide.',
    preview: TWO_FIFTHS,
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { volume: -4, roll: 9, decay: 6, brightness: 0.4, sympathy: 0.8 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack' },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-open-courses-breathe',
    name: 'Open courses breathe',
    category: 'plucked',
    description:
      'Picked strings with their fifth and octave strummed behind, widening and narrowing on a slow breath.',
    preview: LOW_FIFTHS,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { strum: 40, decay: 6, brightness: 0.4, body: 0, sympathy: 0.3 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Opening wide' },
      { deviceId: 'chorus', preset: 'Faint air' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-dulcimer-over-a-seventh',
    name: 'Dulcimer over a seventh',
    category: 'string',
    description:
      'Dulled dulcimer strings, doubled, rolled seven times a second, glimmering band by band, in a bright chamber.',
    preview: FLAT_SEVENTH,
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: {
        volume: -8.5,
        roll: 7,
        decay: 4,
        release: 2,
        brightness: 0.35,
        position: 0.25,
        sympathy: 0.8,
      },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Wide twinkle' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-halo-of-undamped-wire',
    name: 'Halo of undamped wire',
    category: 'pad',
    description:
      'Soft-hammered strings without brightness and their octaves, held by every sympathetic string and a slow pad.',
    preview: WIDE_TENTH,
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: { brightness: 0.15, decay: 9 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Slow swell', params: { mix: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Dense pad' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-wire-seen-through-glass',
    name: 'Wire seen through glass',
    category: 'string',
    description:
      'Bright doubled wires picked at their middle, with a glassy copy of twenty sines spread wide, in a plain hall.',
    preview: SERIES_HIGH,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { position: 0.5, brightness: 1, decay: 8, release: 6, courses: 0.6, body: 1 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Wide glass', params: { mix: 0.4 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 3, mix: 0.2 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-nasal-string-odd-count',
    name: 'Nasal string, odd count',
    category: 'plucked',
    description:
      'A nasal picked string hard by the bridge, through a kitchen radio with its wear turned down and a slapback.',
    preview: LEADING_TRIAD,
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: { volume: -3, chord: 0, decay: 2.5, brightness: 0.7, courses: 0.3 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Kitchen radio', params: { wear: 0.4, noise: 0.08 } },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-low-wires-lean-on-seven',
    name: 'Low wires lean on seven',
    category: 'bass',
    description:
      'Low hammered single wires in a dulcimer body, an octave below creeping in under each, held by a slow compressor.',
    preview: LOW_SEVENTH,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: {
        exciter: 2,
        decay: 7,
        release: 2,
        brightness: 0.5,
        position: 0.15,
        body: 2,
        courses: 0.1,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals', params: { sub2: 0, sub1: 0.6 } },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-harp-case-four-voices',
    name: 'Harp case, four voices',
    category: 'plucked',
    description:
      'Finger-plucked strings heard from inside a wide shell, their sympathetic ring long after the pluck.',
    preview: MAJOR_SEVENTH,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: {
        volume: -2,
        decay: 3,
        release: 4,
        brightness: 0.7,
        position: 0.12,
        sympathy: 0.75,
        body: 0,
      },
    },
    effects: [{ deviceId: 'vessel', preset: 'Shell to the ear', params: { air: 0.2, mix: 0.5 } }],
  },
  {
    id: 'rhythm-of-a-chord-rosewood-four-five-six',
    name: 'Rosewood four five six',
    category: 'bell',
    description:
      'A soft-headed marimba over full resonators, a little longer than the plain bar, warmed by tape in a tight room.',
    preview: MAJOR_MEETS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { volume: -4, mallet: 0.2, decay: 1.2, resonator: 1 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump', params: { hiss: 0.05 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-bars-that-roll-as-one',
    name: 'Bars that roll as one',
    category: 'bell',
    description:
      'A marimba rolled eleven times a second on every held note, its swells set moving in slow water.',
    preview: WIDE_TENTH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { mallet: 0.1, width: 0.9, decay: 2 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Slow water' },
      { deviceId: 'lift', preset: 'Just the ends' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-motor-tuned-to-the-five',
    name: 'Motor tuned to the five',
    category: 'bell',
    description:
      'A vibraphone whose motor turns twice for each strike of the five, its top dulled, with slow chorused echoes.',
    preview: SIXTH_CHORD,
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { volume: -4.5, motorRate: 1.613, motor: 0.9, mallet: 0.35, decay: 1.4 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slow drift', params: { time: 775, mix: 0.28 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-still-bars-minor-sum',
    name: 'Still bars, minor sum',
    category: 'bell',
    description:
      'A vibraphone without motor, mostly damped, recorded again through a small room each half cycle of the chord.',
    preview: MINOR_MEETS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { volume: -2.5, damper: 0.7, mallet: 0.4, decay: 0.8, resonator: 0.4 },
    },
    effects: [
      { deviceId: 'generations', preset: 'Faint afterimage', params: { length: 3.2, mix: 0.3 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-celesta-on-the-odd-two',
    name: 'Celesta on the odd two',
    category: 'bell',
    description:
      'A half-damped celesta brightened by wide copies one and two octaves up, in a small booth.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.4, damper: 0.4, decay: 1.3 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves', params: { up2: 0.25 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-dry-keys-seven-ways',
    name: 'Dry keys, seven ways',
    category: 'plucked',
    description: 'Dry xylophone strikes lost among clusters of close echoes to both sides.',
    preview: FLAT_SEVENTH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { volume: -1.5, mallet: 0.6, decay: 1, resonator: 0.7 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Tight clusters', params: { mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-warm-wood-stacked',
    name: 'Warm wood, stacked',
    category: 'plucked',
    description:
      'A soft-headed xylophone with a long decay and full tubes, organ pipes at unison and fifth speaking after it.',
    preview: TWO_FIFTHS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Warm xylophone',
      params: { mallet: 0.15, decay: 3 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Open fifths', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-steel-rungs-of-a-series',
    name: 'Steel rungs of a series',
    category: 'bell',
    description:
      'Glockenspiel bars over resonators, dulled and ring-modulated softly against a G, adding sums and differences.',
    preview: SERIES_HIGH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { mallet: 0.25, decay: 1.4 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Faint halo', params: { root: 7, mix: 0.18 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-open-celesta-long-meet',
    name: 'Open celesta, long meet',
    category: 'bell',
    description: 'A celesta with its dampers off, scattered by a swarm of short pattering echoes.',
    preview: TURNED_OVER,
    instrument: {
      deviceId: 'mallets',
      preset: 'Open celesta',
      params: { mallet: 0.2, decay: 2.5, width: 0.6 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.3 } }],
  },
  {
    id: 'rhythm-of-a-chord-slow-motor-wide-tenth',
    name: 'Slow motor, wide tenth',
    category: 'pad',
    description:
      'A vibraphone with its attacks swelled off and the motor at one turn a second, drifting as a flock of eight.',
    preview: WIDE_TENTH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { motorRate: 1, decay: 4 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 350 } },
      { deviceId: 'murmuration', preset: 'Evening flock', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-hum-under-the-marimba',
    name: 'Hum under the marimba',
    category: 'bass',
    description: 'The softest mallet on low bars with long decay, humming inside a stopped pipe.',
    preview: LOW_FIFTHS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Humming marimba',
      params: { decay: 3, width: 0.1 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Cistern', params: { size: 2, mix: 0.35, air: 0.05 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-bowls-in-four-to-five',
    name: 'Bowls in four to five',
    category: 'bell',
    description:
      'Struck singing bowls that decay over one whole cycle with a slow beat, sagging a little in pitch as they fade.',
    preview: MAJOR_MEETS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: { volume: -4, decay: 6, hardness: 0.5, detune: 0.8, position: 0.3 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Open' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-tower-of-three-ratios',
    name: 'Tower of three ratios',
    category: 'bell',
    description:
      'Church bells softened at the strike, heard from a far shore with their loudest partials turned down.',
    preview: THREE_FIVE_EIGHT,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { volume: -2.5, decay: 9, hardness: 0.35, damping: 0.6 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Far shore', params: { decay: 3 } },
      { deviceId: 'tamer', preset: 'Ringing tones' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-vibraphone-in-just-tens',
    name: 'Vibraphone in just tens',
    category: 'bell',
    description:
      'Vibraphone bars released quickly, under a slow wide harmonic tremolo, with a faint echo that remembers.',
    preview: MINOR_MEETS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { volume: 6, decay: 3, hardness: 0.45, position: 0.6 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Wide shimmer', params: { rate: 1.5625 } },
      { deviceId: 'echo-memory', preset: 'Faint recall' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-music-box-two-keys',
    name: 'Music box, two keys',
    category: 'bell',
    description: 'A brittle music-box bar made larger in body, ticking through an early sampler.',
    preview: TURNED_OVER,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { volume: 1.5, decay: 1.8, hardness: 0.6, brightness: 0.5 },
    },
    effects: [
      { deviceId: 'size', preset: 'Larger', params: { size: 0.5 } },
      { deviceId: 'vintage-digital', preset: 'Glaze' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-thumbs-at-four-to-seven',
    name: 'Thumbs at four to seven',
    category: 'plucked',
    description:
      'A soft dull kalimba that decays over one pulse of the fifth, small sparks an octave or two above, on a little wood.',
    preview: FLAT_SEVENTH,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { volume: 2, decay: 1.05, hardness: 0.25, damping: 0.6, brightness: 0.3 },
    },
    effects: [
      { deviceId: 'glints', preset: 'First light', params: { mix: 0.2 } },
      { deviceId: 'vessel', preset: 'Hint of wood' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-rubbed-rims-three-arcs',
    name: 'Rubbed rims, three arcs',
    category: 'pad',
    description:
      'Rubbed glass that sings while held and beats slowly, swaying from side to side about the head.',
    preview: WIDE_TENTH,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { volume: -4, sustain: 0.7, detune: 0.8, hardness: 0.2, brightness: 0.5 },
    },
    effects: [
      { deviceId: 'around', preset: 'Gentle sway' },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-gong-counts-one',
    name: 'Gong counts one',
    category: 'drone',
    description:
      'A soft wide gong with its partials squeezed, its tail lifted slowly between strikes and the rumble cut.',
    preview: SERIES_OF_LOW_C,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { decay: 12, hardness: 0.2, stretch: 0.85, brightness: 0.35 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Slow tide' },
      { deviceId: 'auto-filter', preset: 'Rumble cut' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-tapped-tumblers-nine',
    name: 'Tapped tumblers, nine',
    category: 'bell',
    description:
      'Tapped glasses of a second and a half, thrown back reversed and an octave higher in a thin trail.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { volume: -0.5, decay: 1.5, hardness: 0.5, brightness: 0.5 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Rising glass',
        params: { time: 700, feedback: 0.35, mix: 0.3 },
      },
    ],
  },
  {
    id: 'rhythm-of-a-chord-slow-bell-of-stacks',
    name: 'Slow bell of stacks',
    category: 'bell',
    description:
      'A distant dull bell with a faintly blurred attack, hung in a hall that sings a closed oo.',
    preview: TWO_FIFTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Distant bell',
      params: { volume: 4.5, decay: 8, brightness: 0.2, hardness: 0.25 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { decay: 5, mix: 0.35 } },
      { deviceId: 'fog', preset: 'Thin veil' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-wooden-five-on-six',
    name: 'Wooden five on six',
    category: 'plucked',
    description:
      'Short wooden bars hit hard, struck again and again in octave replays that fall away.',
    preview: LEADING_TRIAD,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: { volume: 6, decay: 0.9, hardness: 0.6, damping: 0.8 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Restruck', params: { mix: 0.35 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-chimes-at-the-full-count',
    name: 'Chimes at the full count',
    category: 'bell',
    description:
      'Long bright chime bars caught and held as an even glass tone underneath, the top then rolled off.',
    preview: SERIES_HIGH,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: { volume: -4.5, decay: 6, hardness: 0.6, brightness: 0.55 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Glass organ', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-gut-on-the-fourth-pulse',
    name: 'Gut on the fourth pulse',
    category: 'plucked',
    description:
      'A concert harp plucked at the middle of the string, short in decay, warmed by tape in a small room.',
    preview: MAJOR_MEETS,
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { pluck: 0.48, touch: 0.3, decay: 0.6, body: 0.9, halo: 0.2 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-glass-ring-of-tenths',
    name: 'Glass ring of tenths',
    category: 'plucked',
    description:
      'A long soft harp with its other strings open, its spectrum left hanging as mist and the lows thinned.',
    preview: WIDE_TENTH,
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { decay: 2, touch: 0.3, halo: 0.8 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-pressed-a-hair-sharp',
    name: 'Pressed a hair sharp',
    category: 'plucked',
    description:
      'Silk strings that lean fourteen cents sharp after the pluck, with an early quick vibrato, driven into a limiter.',
    preview: TURNED_OVER,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { volume: -5.5, touch: 0.25, decay: 2.2, halo: 1, bend: 14, pluck: 0.32 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Every touch' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { outputGain: -7 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-guzheng-in-two-threes',
    name: 'Guzheng in two threes',
    category: 'plucked',
    description:
      'Bright zheng strings near the bridge, sent round a tape loop half a cycle of the chord long and into a limiter.',
    preview: SIXTH_CHORD,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { volume: 4.5, pluck: 0.1, decay: 1, touch: 0.5 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Faint afterimage', params: { length: 3.1 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -9.5 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-muted-harp-fifteens',
    name: 'Muted harp, fifteens',
    category: 'plucked',
    description:
      'Harp strings damped by the hand into short dark notes, repeated as uneven gallops from two tape heads.',
    preview: MINOR_MEETS,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { volume: -1, damp: 0.55, body: 0.6, touch: 0.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 640, mix: 0.25 } },
    ],
  },
  {
    id: 'rhythm-of-a-chord-bass-wires-of-the-harp',
    name: 'Bass wires of the harp',
    category: 'bass',
    description:
      'The low hollow strings of a harp plucked at their very middle, with a dark half-speed copy an octave beneath.',
    preview: LOW_SEVENTH,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { touch: 0.2, decay: 1.2, body: 0.8 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix' },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-steel-zheng-whole-tower',
    name: 'Steel zheng, whole tower',
    category: 'plucked',
    description:
      'Thin shimmering zheng wires near the bridge with a soft fifth above each, their top rolled off.',
    preview: SERIES_OF_LOW_C,
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { volume: -5.5, pluck: 0.12, touch: 0.6, decay: 2.5, halo: 0.6, body: 0.5 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad fifth', params: { mix: 0.2 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-pings-on-the-low-seventh',
    name: 'Pings on the low seventh',
    category: 'bell',
    description:
      'Clear pings of ice that ring four seconds, echoed off no shore, with long soft tails brought up.',
    preview: FLAT_SEVENTH,
    instrument: {
      deviceId: 'ice',
      preset: 'Clear ping',
      params: { volume: -11, ring: 4, bright: 0.5, distance: 0.3 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Long tails' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-bells-under-the-lake',
    name: 'Bells under the lake',
    category: 'bell',
    description:
      'Near ringing ice without cracking, sunk a little way under water and slowly wavering.',
    preview: SERIES_HIGH,
    instrument: {
      deviceId: 'ice',
      preset: 'Ice bells',
      params: { volume: 0.5, ring: 6, bright: 0.7 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Sunlit shallows' },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-floe-that-counts-in-two',
    name: 'Floe that counts in two',
    category: 'drone',
    description:
      'Deep thick ice, dull and long, its three bands swelling slowly in turn under a slow deep compressor.',
    preview: LOW_FIFTHS,
    instrument: {
      deviceId: 'ice',
      preset: 'Deep floe',
      params: { volume: -10, ring: 9, bright: 0.2, cracks: 0.1 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Deep swell' },
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
    ],
  },
  {
    id: 'rhythm-of-a-chord-thin-ice-out-of-step',
    name: 'Thin ice, out of step',
    category: 'texture',
    description:
      'Thin brittle ice that chirps down into its note, its partials stretched, under soft grains, a few steps away.',
    preview: LEADING_TRIAD,
    instrument: {
      deviceId: 'ice',
      preset: 'Thin ice',
      params: { volume: 6, ring: 2.5, crack: 0.35, bright: 0.6, cracks: 0.1 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Thin veil', params: { mix: 0.35 } },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
  },
]
