import { type FactoryPreset, type Phrase } from '../types'

// One pentatonic tune (A C D E D C A G) heard at once at two or three speeds, quick, half as fast
// and a quarter as fast. The presets walk the same three speeds: quick and short, middling, slow
// and long, on bells, bars, strings, piano, ice, wood, glow and two synthesizers.

// The whole canon high up: A5 at the quickest pace, A4 at half of it, A3 at a quarter, and all three home on A together.
const ROUND_HIGH: Phrase = {
  notes: [
    { atSec: 0.0, durSec: 0.188, note: 81, gain: 0.3 },
    { atSec: 0.0, durSec: 0.376, note: 69, gain: 0.38 },
    { atSec: 0.0, durSec: 0.752, note: 57, gain: 0.48 },
    { atSec: 0.2, durSec: 0.188, note: 84, gain: 0.28 },
    { atSec: 0.4, durSec: 0.188, note: 86, gain: 0.29 },
    { atSec: 0.4, durSec: 0.376, note: 72, gain: 0.35 },
    { atSec: 0.6, durSec: 0.188, note: 88, gain: 0.32 },
    { atSec: 0.8, durSec: 0.188, note: 86, gain: 0.3 },
    { atSec: 0.8, durSec: 0.376, note: 74, gain: 0.37 },
    { atSec: 0.8, durSec: 0.752, note: 60, gain: 0.44 },
    { atSec: 1.0, durSec: 0.188, note: 84, gain: 0.28 },
    { atSec: 1.2, durSec: 0.188, note: 81, gain: 0.26 },
    { atSec: 1.2, durSec: 0.376, note: 76, gain: 0.41 },
    { atSec: 1.4, durSec: 0.188, note: 79, gain: 0.25 },
    { atSec: 1.6, durSec: 0.188, note: 81, gain: 0.3 },
    { atSec: 1.6, durSec: 0.376, note: 74, gain: 0.38 },
    { atSec: 1.6, durSec: 0.752, note: 62, gain: 0.47 },
    { atSec: 1.8, durSec: 0.188, note: 84, gain: 0.28 },
    { atSec: 2.0, durSec: 0.188, note: 86, gain: 0.29 },
    { atSec: 2.0, durSec: 0.376, note: 72, gain: 0.35 },
    { atSec: 2.2, durSec: 0.188, note: 88, gain: 0.32 },
    { atSec: 2.4, durSec: 0.188, note: 86, gain: 0.3 },
    { atSec: 2.4, durSec: 0.376, note: 69, gain: 0.33 },
    { atSec: 2.4, durSec: 0.752, note: 64, gain: 0.52 },
    { atSec: 2.6, durSec: 0.188, note: 84, gain: 0.28 },
    { atSec: 2.8, durSec: 0.188, note: 81, gain: 0.26 },
    { atSec: 2.8, durSec: 0.376, note: 67, gain: 0.31 },
    { atSec: 3.0, durSec: 0.188, note: 79, gain: 0.25 },
    { atSec: 3.2, durSec: 0.188, note: 81, gain: 0.3 },
    { atSec: 3.2, durSec: 0.376, note: 69, gain: 0.38 },
    { atSec: 3.2, durSec: 0.752, note: 62, gain: 0.48 },
    { atSec: 3.4, durSec: 0.188, note: 84, gain: 0.28 },
    { atSec: 3.6, durSec: 0.188, note: 86, gain: 0.29 },
    { atSec: 3.6, durSec: 0.376, note: 72, gain: 0.35 },
    { atSec: 3.8, durSec: 0.188, note: 88, gain: 0.32 },
    { atSec: 4.0, durSec: 0.188, note: 86, gain: 0.3 },
    { atSec: 4.0, durSec: 0.376, note: 74, gain: 0.37 },
    { atSec: 4.0, durSec: 0.752, note: 60, gain: 0.44 },
    { atSec: 4.2, durSec: 0.188, note: 84, gain: 0.28 },
    { atSec: 4.4, durSec: 0.188, note: 81, gain: 0.26 },
    { atSec: 4.4, durSec: 0.376, note: 76, gain: 0.41 },
    { atSec: 4.6, durSec: 0.188, note: 79, gain: 0.25 },
    { atSec: 4.8, durSec: 0.188, note: 81, gain: 0.3 },
    { atSec: 4.8, durSec: 0.376, note: 74, gain: 0.38 },
    { atSec: 4.8, durSec: 0.752, note: 57, gain: 0.42 },
    { atSec: 5.0, durSec: 0.188, note: 84, gain: 0.28 },
    { atSec: 5.2, durSec: 0.188, note: 86, gain: 0.29 },
    { atSec: 5.2, durSec: 0.376, note: 72, gain: 0.35 },
    { atSec: 5.4, durSec: 0.188, note: 88, gain: 0.32 },
    { atSec: 5.6, durSec: 0.188, note: 86, gain: 0.3 },
    { atSec: 5.6, durSec: 0.376, note: 69, gain: 0.33 },
    { atSec: 5.6, durSec: 0.752, note: 55, gain: 0.39 },
    { atSec: 5.8, durSec: 0.188, note: 84, gain: 0.28 },
    { atSec: 6.0, durSec: 0.188, note: 81, gain: 0.26 },
    { atSec: 6.0, durSec: 0.376, note: 67, gain: 0.31 },
    { atSec: 6.2, durSec: 0.188, note: 79, gain: 0.25 },
    { atSec: 6.4, durSec: 0.7, note: 81, gain: 0.26 },
    { atSec: 6.4, durSec: 0.7, note: 69, gain: 0.34 },
    { atSec: 6.4, durSec: 0.7, note: 57, gain: 0.44 },
  ],
}

// The whole canon an octave lower, A4, A3 and A2.
const ROUND: Phrase = {
  notes: [
    { atSec: 0.0, durSec: 0.188, note: 69, gain: 0.32 },
    { atSec: 0.0, durSec: 0.376, note: 57, gain: 0.4 },
    { atSec: 0.0, durSec: 0.752, note: 45, gain: 0.5 },
    { atSec: 0.2, durSec: 0.188, note: 72, gain: 0.29 },
    { atSec: 0.4, durSec: 0.188, note: 74, gain: 0.31 },
    { atSec: 0.4, durSec: 0.376, note: 60, gain: 0.37 },
    { atSec: 0.6, durSec: 0.188, note: 76, gain: 0.35 },
    { atSec: 0.8, durSec: 0.188, note: 74, gain: 0.32 },
    { atSec: 0.8, durSec: 0.376, note: 62, gain: 0.39 },
    { atSec: 0.8, durSec: 0.752, note: 48, gain: 0.46 },
    { atSec: 1.0, durSec: 0.188, note: 72, gain: 0.29 },
    { atSec: 1.2, durSec: 0.188, note: 69, gain: 0.28 },
    { atSec: 1.2, durSec: 0.376, note: 64, gain: 0.43 },
    { atSec: 1.4, durSec: 0.188, note: 67, gain: 0.26 },
    { atSec: 1.6, durSec: 0.188, note: 69, gain: 0.32 },
    { atSec: 1.6, durSec: 0.376, note: 62, gain: 0.4 },
    { atSec: 1.6, durSec: 0.752, note: 50, gain: 0.49 },
    { atSec: 1.8, durSec: 0.188, note: 72, gain: 0.29 },
    { atSec: 2.0, durSec: 0.188, note: 74, gain: 0.31 },
    { atSec: 2.0, durSec: 0.376, note: 60, gain: 0.37 },
    { atSec: 2.2, durSec: 0.188, note: 76, gain: 0.35 },
    { atSec: 2.4, durSec: 0.188, note: 74, gain: 0.32 },
    { atSec: 2.4, durSec: 0.376, note: 57, gain: 0.35 },
    { atSec: 2.4, durSec: 0.752, note: 52, gain: 0.54 },
    { atSec: 2.6, durSec: 0.188, note: 72, gain: 0.29 },
    { atSec: 2.8, durSec: 0.188, note: 69, gain: 0.28 },
    { atSec: 2.8, durSec: 0.376, note: 55, gain: 0.33 },
    { atSec: 3.0, durSec: 0.188, note: 67, gain: 0.26 },
    { atSec: 3.2, durSec: 0.188, note: 69, gain: 0.32 },
    { atSec: 3.2, durSec: 0.376, note: 57, gain: 0.4 },
    { atSec: 3.2, durSec: 0.752, note: 50, gain: 0.5 },
    { atSec: 3.4, durSec: 0.188, note: 72, gain: 0.29 },
    { atSec: 3.6, durSec: 0.188, note: 74, gain: 0.31 },
    { atSec: 3.6, durSec: 0.376, note: 60, gain: 0.37 },
    { atSec: 3.8, durSec: 0.188, note: 76, gain: 0.35 },
    { atSec: 4.0, durSec: 0.188, note: 74, gain: 0.32 },
    { atSec: 4.0, durSec: 0.376, note: 62, gain: 0.39 },
    { atSec: 4.0, durSec: 0.752, note: 48, gain: 0.46 },
    { atSec: 4.2, durSec: 0.188, note: 72, gain: 0.29 },
    { atSec: 4.4, durSec: 0.188, note: 69, gain: 0.28 },
    { atSec: 4.4, durSec: 0.376, note: 64, gain: 0.43 },
    { atSec: 4.6, durSec: 0.188, note: 67, gain: 0.26 },
    { atSec: 4.8, durSec: 0.188, note: 69, gain: 0.32 },
    { atSec: 4.8, durSec: 0.376, note: 62, gain: 0.4 },
    { atSec: 4.8, durSec: 0.752, note: 45, gain: 0.44 },
    { atSec: 5.0, durSec: 0.188, note: 72, gain: 0.29 },
    { atSec: 5.2, durSec: 0.188, note: 74, gain: 0.31 },
    { atSec: 5.2, durSec: 0.376, note: 60, gain: 0.37 },
    { atSec: 5.4, durSec: 0.188, note: 76, gain: 0.35 },
    { atSec: 5.6, durSec: 0.188, note: 74, gain: 0.32 },
    { atSec: 5.6, durSec: 0.376, note: 57, gain: 0.35 },
    { atSec: 5.6, durSec: 0.752, note: 43, gain: 0.41 },
    { atSec: 5.8, durSec: 0.188, note: 72, gain: 0.29 },
    { atSec: 6.0, durSec: 0.188, note: 69, gain: 0.28 },
    { atSec: 6.0, durSec: 0.376, note: 55, gain: 0.33 },
    { atSec: 6.2, durSec: 0.188, note: 67, gain: 0.26 },
    { atSec: 6.4, durSec: 0.7, note: 69, gain: 0.28 },
    { atSec: 6.4, durSec: 0.7, note: 57, gain: 0.36 },
    { atSec: 6.4, durSec: 0.7, note: 45, gain: 0.46 },
  ],
}

// Two speeds only: the tune twice on A4 over the tune once, half as fast, on A3, meeting on A.
const PAIR: Phrase = {
  notes: [
    { atSec: 0.0, durSec: 0.376, note: 69, gain: 0.42 },
    { atSec: 0.0, durSec: 0.752, note: 57, gain: 0.52 },
    { atSec: 0.4, durSec: 0.376, note: 72, gain: 0.39 },
    { atSec: 0.8, durSec: 0.376, note: 74, gain: 0.41 },
    { atSec: 0.8, durSec: 0.752, note: 60, gain: 0.48 },
    { atSec: 1.2, durSec: 0.376, note: 76, gain: 0.45 },
    { atSec: 1.6, durSec: 0.376, note: 74, gain: 0.42 },
    { atSec: 1.6, durSec: 0.752, note: 62, gain: 0.51 },
    { atSec: 2.0, durSec: 0.376, note: 72, gain: 0.39 },
    { atSec: 2.4, durSec: 0.376, note: 69, gain: 0.37 },
    { atSec: 2.4, durSec: 0.752, note: 64, gain: 0.56 },
    { atSec: 2.8, durSec: 0.376, note: 67, gain: 0.34 },
    { atSec: 3.2, durSec: 0.376, note: 69, gain: 0.42 },
    { atSec: 3.2, durSec: 0.752, note: 62, gain: 0.52 },
    { atSec: 3.6, durSec: 0.376, note: 72, gain: 0.39 },
    { atSec: 4.0, durSec: 0.376, note: 74, gain: 0.41 },
    { atSec: 4.0, durSec: 0.752, note: 60, gain: 0.48 },
    { atSec: 4.4, durSec: 0.376, note: 76, gain: 0.45 },
    { atSec: 4.8, durSec: 0.376, note: 74, gain: 0.42 },
    { atSec: 4.8, durSec: 0.752, note: 57, gain: 0.46 },
    { atSec: 5.2, durSec: 0.376, note: 72, gain: 0.39 },
    { atSec: 5.6, durSec: 0.376, note: 69, gain: 0.37 },
    { atSec: 5.6, durSec: 0.752, note: 55, gain: 0.43 },
    { atSec: 6.0, durSec: 0.376, note: 67, gain: 0.34 },
    { atSec: 6.4, durSec: 0.7, note: 69, gain: 0.36 },
    { atSec: 6.4, durSec: 0.7, note: 57, gain: 0.46 },
  ],
}

// The tune twice on A4, and once at half that speed upside down round A3, step for step in the scale.
const MIRROR: Phrase = {
  notes: [
    { atSec: 0.0, durSec: 0.376, note: 69, gain: 0.4 },
    { atSec: 0.0, durSec: 0.752, note: 57, gain: 0.52 },
    { atSec: 0.4, durSec: 0.376, note: 72, gain: 0.37 },
    { atSec: 0.8, durSec: 0.376, note: 74, gain: 0.39 },
    { atSec: 0.8, durSec: 0.752, note: 55, gain: 0.48 },
    { atSec: 1.2, durSec: 0.376, note: 76, gain: 0.43 },
    { atSec: 1.6, durSec: 0.376, note: 74, gain: 0.4 },
    { atSec: 1.6, durSec: 0.752, note: 52, gain: 0.51 },
    { atSec: 2.0, durSec: 0.376, note: 72, gain: 0.37 },
    { atSec: 2.4, durSec: 0.376, note: 69, gain: 0.35 },
    { atSec: 2.4, durSec: 0.752, note: 50, gain: 0.56 },
    { atSec: 2.8, durSec: 0.376, note: 67, gain: 0.33 },
    { atSec: 3.2, durSec: 0.376, note: 69, gain: 0.4 },
    { atSec: 3.2, durSec: 0.752, note: 52, gain: 0.52 },
    { atSec: 3.6, durSec: 0.376, note: 72, gain: 0.37 },
    { atSec: 4.0, durSec: 0.376, note: 74, gain: 0.39 },
    { atSec: 4.0, durSec: 0.752, note: 55, gain: 0.48 },
    { atSec: 4.4, durSec: 0.376, note: 76, gain: 0.43 },
    { atSec: 4.8, durSec: 0.376, note: 74, gain: 0.4 },
    { atSec: 4.8, durSec: 0.752, note: 57, gain: 0.46 },
    { atSec: 5.2, durSec: 0.376, note: 72, gain: 0.37 },
    { atSec: 5.6, durSec: 0.376, note: 69, gain: 0.35 },
    { atSec: 5.6, durSec: 0.752, note: 60, gain: 0.43 },
    { atSec: 6.0, durSec: 0.376, note: 67, gain: 0.33 },
    { atSec: 6.4, durSec: 0.7, note: 69, gain: 0.36 },
    { atSec: 6.4, durSec: 0.7, note: 57, gain: 0.46 },
  ],
}

// The tune with its last A forward on A5, and the same read backward at half the speed on A4.
const CRAB: Phrase = {
  notes: [
    { atSec: 0.0, durSec: 0.376, note: 81, gain: 0.36 },
    { atSec: 0.0, durSec: 0.752, note: 69, gain: 0.42 },
    { atSec: 0.4, durSec: 0.376, note: 84, gain: 0.33 },
    { atSec: 0.8, durSec: 0.376, note: 86, gain: 0.35 },
    { atSec: 0.8, durSec: 0.752, note: 67, gain: 0.39 },
    { atSec: 1.2, durSec: 0.376, note: 88, gain: 0.39 },
    { atSec: 1.6, durSec: 0.376, note: 86, gain: 0.36 },
    { atSec: 1.6, durSec: 0.752, note: 69, gain: 0.42 },
    { atSec: 2.0, durSec: 0.376, note: 84, gain: 0.33 },
    { atSec: 2.4, durSec: 0.376, note: 81, gain: 0.32 },
    { atSec: 2.4, durSec: 0.752, note: 72, gain: 0.44 },
    { atSec: 2.8, durSec: 0.376, note: 79, gain: 0.3 },
    { atSec: 3.2, durSec: 0.376, note: 81, gain: 0.36 },
    { atSec: 3.2, durSec: 0.752, note: 74, gain: 0.48 },
    { atSec: 3.6, durSec: 0.376, note: 84, gain: 0.33 },
    { atSec: 4.0, durSec: 0.376, note: 86, gain: 0.35 },
    { atSec: 4.0, durSec: 0.752, note: 76, gain: 0.52 },
    { atSec: 4.4, durSec: 0.376, note: 88, gain: 0.39 },
    { atSec: 4.8, durSec: 0.376, note: 86, gain: 0.36 },
    { atSec: 4.8, durSec: 0.752, note: 74, gain: 0.47 },
    { atSec: 5.2, durSec: 0.376, note: 84, gain: 0.33 },
    { atSec: 5.6, durSec: 0.376, note: 81, gain: 0.32 },
    { atSec: 5.6, durSec: 0.752, note: 72, gain: 0.44 },
    { atSec: 6.0, durSec: 0.376, note: 79, gain: 0.3 },
    { atSec: 6.4, durSec: 0.7, note: 81, gain: 0.32 },
    { atSec: 6.4, durSec: 0.7, note: 69, gain: 0.44 },
  ],
}

// Three speeds as one, two thirds and one third: three times, twice and once through, closing together.
const THREE_TO_TWO: Phrase = {
  notes: [
    { atSec: 0.0, durSec: 0.254, note: 81, gain: 0.3 },
    { atSec: 0.0, durSec: 0.381, note: 69, gain: 0.38 },
    { atSec: 0.0, durSec: 0.761, note: 57, gain: 0.48 },
    { atSec: 0.27, durSec: 0.254, note: 84, gain: 0.28 },
    { atSec: 0.405, durSec: 0.381, note: 72, gain: 0.35 },
    { atSec: 0.54, durSec: 0.254, note: 86, gain: 0.29 },
    { atSec: 0.81, durSec: 0.254, note: 88, gain: 0.32 },
    { atSec: 0.81, durSec: 0.381, note: 74, gain: 0.37 },
    { atSec: 0.81, durSec: 0.761, note: 60, gain: 0.44 },
    { atSec: 1.08, durSec: 0.254, note: 86, gain: 0.3 },
    { atSec: 1.215, durSec: 0.381, note: 76, gain: 0.41 },
    { atSec: 1.35, durSec: 0.254, note: 84, gain: 0.28 },
    { atSec: 1.62, durSec: 0.254, note: 81, gain: 0.26 },
    { atSec: 1.62, durSec: 0.381, note: 74, gain: 0.38 },
    { atSec: 1.62, durSec: 0.761, note: 62, gain: 0.47 },
    { atSec: 1.89, durSec: 0.254, note: 79, gain: 0.25 },
    { atSec: 2.025, durSec: 0.381, note: 72, gain: 0.35 },
    { atSec: 2.16, durSec: 0.254, note: 81, gain: 0.3 },
    { atSec: 2.43, durSec: 0.254, note: 84, gain: 0.28 },
    { atSec: 2.43, durSec: 0.381, note: 69, gain: 0.33 },
    { atSec: 2.43, durSec: 0.761, note: 64, gain: 0.52 },
    { atSec: 2.7, durSec: 0.254, note: 86, gain: 0.29 },
    { atSec: 2.835, durSec: 0.381, note: 67, gain: 0.31 },
    { atSec: 2.97, durSec: 0.254, note: 88, gain: 0.32 },
    { atSec: 3.24, durSec: 0.254, note: 86, gain: 0.3 },
    { atSec: 3.24, durSec: 0.381, note: 69, gain: 0.38 },
    { atSec: 3.24, durSec: 0.761, note: 62, gain: 0.48 },
    { atSec: 3.51, durSec: 0.254, note: 84, gain: 0.28 },
    { atSec: 3.645, durSec: 0.381, note: 72, gain: 0.35 },
    { atSec: 3.78, durSec: 0.254, note: 81, gain: 0.26 },
    { atSec: 4.05, durSec: 0.254, note: 79, gain: 0.25 },
    { atSec: 4.05, durSec: 0.381, note: 74, gain: 0.37 },
    { atSec: 4.05, durSec: 0.761, note: 60, gain: 0.44 },
    { atSec: 4.32, durSec: 0.254, note: 81, gain: 0.3 },
    { atSec: 4.455, durSec: 0.381, note: 76, gain: 0.41 },
    { atSec: 4.59, durSec: 0.254, note: 84, gain: 0.28 },
    { atSec: 4.86, durSec: 0.254, note: 86, gain: 0.29 },
    { atSec: 4.86, durSec: 0.381, note: 74, gain: 0.38 },
    { atSec: 4.86, durSec: 0.761, note: 57, gain: 0.42 },
    { atSec: 5.13, durSec: 0.254, note: 88, gain: 0.32 },
    { atSec: 5.265, durSec: 0.381, note: 72, gain: 0.35 },
    { atSec: 5.4, durSec: 0.254, note: 86, gain: 0.3 },
    { atSec: 5.67, durSec: 0.254, note: 84, gain: 0.28 },
    { atSec: 5.67, durSec: 0.381, note: 69, gain: 0.33 },
    { atSec: 5.67, durSec: 0.761, note: 55, gain: 0.39 },
    { atSec: 5.94, durSec: 0.254, note: 81, gain: 0.26 },
    { atSec: 6.075, durSec: 0.381, note: 67, gain: 0.31 },
    { atSec: 6.21, durSec: 0.254, note: 79, gain: 0.25 },
    { atSec: 6.48, durSec: 0.7, note: 81, gain: 0.26 },
    { atSec: 6.48, durSec: 0.7, note: 69, gain: 0.34 },
    { atSec: 6.48, durSec: 0.7, note: 57, gain: 0.44 },
  ],
}

// Each voice twice as slow and an octave under the one before, entering while that one is half way: A5, A4, A3.
const SLOWING: Phrase = {
  notes: [
    { atSec: 0.0, durSec: 0.141, note: 81, gain: 0.4 },
    { atSec: 0.15, durSec: 0.141, note: 84, gain: 0.37 },
    { atSec: 0.3, durSec: 0.141, note: 86, gain: 0.39 },
    { atSec: 0.45, durSec: 0.141, note: 88, gain: 0.43 },
    { atSec: 0.6, durSec: 0.141, note: 86, gain: 0.4 },
    { atSec: 0.6, durSec: 0.282, note: 69, gain: 0.44 },
    { atSec: 0.75, durSec: 0.141, note: 84, gain: 0.37 },
    { atSec: 0.9, durSec: 0.141, note: 81, gain: 0.35 },
    { atSec: 0.9, durSec: 0.282, note: 72, gain: 0.4 },
    { atSec: 1.05, durSec: 0.141, note: 79, gain: 0.33 },
    { atSec: 1.2, durSec: 0.282, note: 74, gain: 0.43 },
    { atSec: 1.5, durSec: 0.282, note: 76, gain: 0.48 },
    { atSec: 1.8, durSec: 0.282, note: 74, gain: 0.44 },
    { atSec: 1.8, durSec: 0.564, note: 57, gain: 0.54 },
    { atSec: 2.1, durSec: 0.282, note: 72, gain: 0.4 },
    { atSec: 2.4, durSec: 0.282, note: 69, gain: 0.39 },
    { atSec: 2.4, durSec: 0.564, note: 60, gain: 0.5 },
    { atSec: 2.7, durSec: 0.282, note: 67, gain: 0.36 },
    { atSec: 3.0, durSec: 0.564, note: 62, gain: 0.53 },
    { atSec: 3.6, durSec: 0.564, note: 64, gain: 0.58 },
    { atSec: 4.2, durSec: 0.564, note: 62, gain: 0.54 },
    { atSec: 4.8, durSec: 0.564, note: 60, gain: 0.5 },
    { atSec: 5.4, durSec: 0.564, note: 57, gain: 0.48 },
    { atSec: 6.0, durSec: 0.564, note: 55, gain: 0.44 },
    { atSec: 6.6, durSec: 0.6, note: 57, gain: 0.46 },
  ],
}

// In canon a fourth and an octave below: A4 above, and E3 (E G A B A G E D) at half the speed.
const FOURTH_BELOW: Phrase = {
  notes: [
    { atSec: 0.0, durSec: 0.376, note: 69, gain: 0.4 },
    { atSec: 0.0, durSec: 0.752, note: 52, gain: 0.5 },
    { atSec: 0.4, durSec: 0.376, note: 72, gain: 0.37 },
    { atSec: 0.8, durSec: 0.376, note: 74, gain: 0.39 },
    { atSec: 0.8, durSec: 0.752, note: 55, gain: 0.46 },
    { atSec: 1.2, durSec: 0.376, note: 76, gain: 0.43 },
    { atSec: 1.6, durSec: 0.376, note: 74, gain: 0.4 },
    { atSec: 1.6, durSec: 0.752, note: 57, gain: 0.49 },
    { atSec: 2.0, durSec: 0.376, note: 72, gain: 0.37 },
    { atSec: 2.4, durSec: 0.376, note: 69, gain: 0.35 },
    { atSec: 2.4, durSec: 0.752, note: 59, gain: 0.54 },
    { atSec: 2.8, durSec: 0.376, note: 67, gain: 0.33 },
    { atSec: 3.2, durSec: 0.376, note: 69, gain: 0.4 },
    { atSec: 3.2, durSec: 0.752, note: 57, gain: 0.5 },
    { atSec: 3.6, durSec: 0.376, note: 72, gain: 0.37 },
    { atSec: 4.0, durSec: 0.376, note: 74, gain: 0.39 },
    { atSec: 4.0, durSec: 0.752, note: 55, gain: 0.46 },
    { atSec: 4.4, durSec: 0.376, note: 76, gain: 0.43 },
    { atSec: 4.8, durSec: 0.376, note: 74, gain: 0.4 },
    { atSec: 4.8, durSec: 0.752, note: 52, gain: 0.44 },
    { atSec: 5.2, durSec: 0.376, note: 72, gain: 0.37 },
    { atSec: 5.6, durSec: 0.376, note: 69, gain: 0.35 },
    { atSec: 5.6, durSec: 0.752, note: 50, gain: 0.41 },
    { atSec: 6.0, durSec: 0.376, note: 67, gain: 0.33 },
  ],
}

// The slowest begins alone, the middle one joins half way, the quick one last, and all three close together on A.
const CLOSING: Phrase = {
  notes: [
    { atSec: 0.0, durSec: 0.752, note: 57, gain: 0.5 },
    { atSec: 0.8, durSec: 0.752, note: 60, gain: 0.46 },
    { atSec: 1.6, durSec: 0.752, note: 62, gain: 0.49 },
    { atSec: 2.4, durSec: 0.752, note: 64, gain: 0.54 },
    { atSec: 3.2, durSec: 0.376, note: 69, gain: 0.42 },
    { atSec: 3.2, durSec: 0.752, note: 62, gain: 0.5 },
    { atSec: 3.6, durSec: 0.376, note: 72, gain: 0.39 },
    { atSec: 4.0, durSec: 0.376, note: 74, gain: 0.41 },
    { atSec: 4.0, durSec: 0.752, note: 60, gain: 0.46 },
    { atSec: 4.4, durSec: 0.376, note: 76, gain: 0.45 },
    { atSec: 4.8, durSec: 0.188, note: 81, gain: 0.36 },
    { atSec: 4.8, durSec: 0.376, note: 74, gain: 0.42 },
    { atSec: 4.8, durSec: 0.752, note: 57, gain: 0.44 },
    { atSec: 5.0, durSec: 0.188, note: 84, gain: 0.33 },
    { atSec: 5.2, durSec: 0.188, note: 86, gain: 0.35 },
    { atSec: 5.2, durSec: 0.376, note: 72, gain: 0.39 },
    { atSec: 5.4, durSec: 0.188, note: 88, gain: 0.39 },
    { atSec: 5.6, durSec: 0.188, note: 86, gain: 0.36 },
    { atSec: 5.6, durSec: 0.376, note: 69, gain: 0.37 },
    { atSec: 5.6, durSec: 0.752, note: 55, gain: 0.41 },
    { atSec: 5.8, durSec: 0.188, note: 84, gain: 0.33 },
    { atSec: 6.0, durSec: 0.188, note: 81, gain: 0.32 },
    { atSec: 6.0, durSec: 0.376, note: 67, gain: 0.34 },
    { atSec: 6.2, durSec: 0.188, note: 79, gain: 0.3 },
    { atSec: 6.4, durSec: 0.7, note: 81, gain: 0.3 },
    { atSec: 6.4, durSec: 0.7, note: 69, gain: 0.36 },
    { atSec: 6.4, durSec: 0.7, note: 57, gain: 0.46 },
  ],
}

// All three begin together, each says the tune once, and the slowest is left to come home alone.
const OPENING: Phrase = {
  notes: [
    { atSec: 0.0, durSec: 0.188, note: 81, gain: 0.36 },
    { atSec: 0.0, durSec: 0.376, note: 69, gain: 0.42 },
    { atSec: 0.0, durSec: 0.752, note: 57, gain: 0.5 },
    { atSec: 0.2, durSec: 0.188, note: 84, gain: 0.33 },
    { atSec: 0.4, durSec: 0.188, note: 86, gain: 0.35 },
    { atSec: 0.4, durSec: 0.376, note: 72, gain: 0.39 },
    { atSec: 0.6, durSec: 0.188, note: 88, gain: 0.39 },
    { atSec: 0.8, durSec: 0.188, note: 86, gain: 0.36 },
    { atSec: 0.8, durSec: 0.376, note: 74, gain: 0.41 },
    { atSec: 0.8, durSec: 0.752, note: 60, gain: 0.46 },
    { atSec: 1.0, durSec: 0.188, note: 84, gain: 0.33 },
    { atSec: 1.2, durSec: 0.188, note: 81, gain: 0.32 },
    { atSec: 1.2, durSec: 0.376, note: 76, gain: 0.45 },
    { atSec: 1.4, durSec: 0.188, note: 79, gain: 0.3 },
    { atSec: 1.6, durSec: 0.376, note: 74, gain: 0.42 },
    { atSec: 1.6, durSec: 0.752, note: 62, gain: 0.49 },
    { atSec: 2.0, durSec: 0.376, note: 72, gain: 0.39 },
    { atSec: 2.4, durSec: 0.376, note: 69, gain: 0.37 },
    { atSec: 2.4, durSec: 0.752, note: 64, gain: 0.54 },
    { atSec: 2.8, durSec: 0.376, note: 67, gain: 0.34 },
    { atSec: 3.2, durSec: 0.752, note: 62, gain: 0.5 },
    { atSec: 4.0, durSec: 0.752, note: 60, gain: 0.46 },
    { atSec: 4.8, durSec: 0.752, note: 57, gain: 0.44 },
    { atSec: 5.6, durSec: 0.752, note: 55, gain: 0.41 },
    { atSec: 6.4, durSec: 0.7, note: 57, gain: 0.46 },
  ],
}

// Three to one: the tune three times on A5 over the tune once on A4.
const PERFECT: Phrase = {
  notes: [
    { atSec: 0.0, durSec: 0.244, note: 81, gain: 0.34 },
    { atSec: 0.0, durSec: 0.733, note: 69, gain: 0.5 },
    { atSec: 0.26, durSec: 0.244, note: 84, gain: 0.31 },
    { atSec: 0.52, durSec: 0.244, note: 86, gain: 0.33 },
    { atSec: 0.78, durSec: 0.244, note: 88, gain: 0.37 },
    { atSec: 0.78, durSec: 0.733, note: 72, gain: 0.46 },
    { atSec: 1.04, durSec: 0.244, note: 86, gain: 0.34 },
    { atSec: 1.3, durSec: 0.244, note: 84, gain: 0.31 },
    { atSec: 1.56, durSec: 0.244, note: 81, gain: 0.3 },
    { atSec: 1.56, durSec: 0.733, note: 74, gain: 0.49 },
    { atSec: 1.82, durSec: 0.244, note: 79, gain: 0.28 },
    { atSec: 2.08, durSec: 0.244, note: 81, gain: 0.34 },
    { atSec: 2.34, durSec: 0.244, note: 84, gain: 0.31 },
    { atSec: 2.34, durSec: 0.733, note: 76, gain: 0.54 },
    { atSec: 2.6, durSec: 0.244, note: 86, gain: 0.33 },
    { atSec: 2.86, durSec: 0.244, note: 88, gain: 0.37 },
    { atSec: 3.12, durSec: 0.244, note: 86, gain: 0.34 },
    { atSec: 3.12, durSec: 0.733, note: 74, gain: 0.5 },
    { atSec: 3.38, durSec: 0.244, note: 84, gain: 0.31 },
    { atSec: 3.64, durSec: 0.244, note: 81, gain: 0.3 },
    { atSec: 3.9, durSec: 0.244, note: 79, gain: 0.28 },
    { atSec: 3.9, durSec: 0.733, note: 72, gain: 0.46 },
    { atSec: 4.16, durSec: 0.244, note: 81, gain: 0.34 },
    { atSec: 4.42, durSec: 0.244, note: 84, gain: 0.31 },
    { atSec: 4.68, durSec: 0.244, note: 86, gain: 0.33 },
    { atSec: 4.68, durSec: 0.733, note: 69, gain: 0.44 },
    { atSec: 4.94, durSec: 0.244, note: 88, gain: 0.37 },
    { atSec: 5.2, durSec: 0.244, note: 86, gain: 0.34 },
    { atSec: 5.46, durSec: 0.244, note: 84, gain: 0.31 },
    { atSec: 5.46, durSec: 0.733, note: 67, gain: 0.41 },
    { atSec: 5.72, durSec: 0.244, note: 81, gain: 0.3 },
    { atSec: 5.98, durSec: 0.244, note: 79, gain: 0.28 },
    { atSec: 6.24, durSec: 0.7, note: 81, gain: 0.28 },
    { atSec: 6.24, durSec: 0.7, note: 69, gain: 0.44 },
  ],
}

// The opening of the canon for sounds that speak slowly: eight notes on A5, four on A4, two on A3.
const BREATHS: Phrase = {
  notes: [
    { atSec: 0.0, durSec: 0.823, note: 81, gain: 0.36 },
    { atSec: 0.0, durSec: 1.646, note: 69, gain: 0.44 },
    { atSec: 0.0, durSec: 3.293, note: 57, gain: 0.52 },
    { atSec: 0.84, durSec: 0.823, note: 84, gain: 0.33 },
    { atSec: 1.68, durSec: 0.823, note: 86, gain: 0.35 },
    { atSec: 1.68, durSec: 1.646, note: 72, gain: 0.4 },
    { atSec: 2.52, durSec: 0.823, note: 88, gain: 0.39 },
    { atSec: 3.36, durSec: 0.823, note: 86, gain: 0.36 },
    { atSec: 3.36, durSec: 1.646, note: 74, gain: 0.43 },
    { atSec: 3.36, durSec: 3.293, note: 60, gain: 0.48 },
    { atSec: 4.2, durSec: 0.823, note: 84, gain: 0.33 },
    { atSec: 5.04, durSec: 0.823, note: 81, gain: 0.32 },
    { atSec: 5.04, durSec: 1.646, note: 76, gain: 0.48 },
    { atSec: 5.88, durSec: 0.823, note: 79, gain: 0.3 },
  ],
}

// Slower still: A C D E on A4, only A C on A3, and the first A of all on A2, under them throughout.
const MAXIMA: Phrase = {
  notes: [
    { atSec: 0.0, durSec: 1.568, note: 69, gain: 0.4 },
    { atSec: 0.0, durSec: 3.136, note: 57, gain: 0.46 },
    { atSec: 0.0, durSec: 6.272, note: 45, gain: 0.5 },
    { atSec: 1.6, durSec: 1.568, note: 72, gain: 0.37 },
    { atSec: 3.2, durSec: 1.568, note: 74, gain: 0.39 },
    { atSec: 3.2, durSec: 3.136, note: 60, gain: 0.42 },
    { atSec: 4.8, durSec: 1.568, note: 76, gain: 0.43 },
  ],
}

// The slowest voice by itself, from A2.
const LONG_LINE: Phrase = {
  notes: [
    { atSec: 0.0, durSec: 0.752, note: 45, gain: 0.6 },
    { atSec: 0.8, durSec: 0.752, note: 48, gain: 0.55 },
    { atSec: 1.6, durSec: 0.752, note: 50, gain: 0.59 },
    { atSec: 2.4, durSec: 0.752, note: 52, gain: 0.65 },
    { atSec: 3.2, durSec: 0.752, note: 50, gain: 0.6 },
    { atSec: 4.0, durSec: 0.752, note: 48, gain: 0.55 },
    { atSec: 4.8, durSec: 0.752, note: 45, gain: 0.53 },
    { atSec: 5.6, durSec: 0.752, note: 43, gain: 0.49 },
    { atSec: 6.4, durSec: 0.7, note: 45, gain: 0.54 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Bells: from tin and wood that are over at once to bowls that hold a note past the whole tune.
  {
    id: 'mensuration-canons-tin-semifusas',
    name: 'Tin semifusas',
    category: 'bell',
    description:
      'Very short, hard-struck tin bars for the quickest voice, dropped into a bright, twanging spring and spread wide at the top.',
    preview: ROUND_HIGH,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: {
        volume: 0,
        decay: 0.7,
        damping: 0.45,
        hardness: 0.95,
        position: 0.04,
        brightness: 0.8,
        release: 0.4,
      },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Quick twang' },
      { deviceId: 'stereo-detune', preset: 'Top only' },
    ],
  },
  {
    id: 'mensuration-canons-thumbs-take-the-minims',
    name: 'Thumbs take the minims',
    category: 'plucked',
    description:
      'Kalimba tines set on a wooden body, each note slapped back by a delay a moment later, for the voice at half speed.',
    preview: PAIR,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: {
        volume: -3,
        decay: 1.6,
        damping: 0.85,
        hardness: 0.4,
        brightness: 0.3,
        release: 0.5,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.75, size: 1.4 } },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.36 } },
    ],
  },
  {
    id: 'mensuration-canons-wooden-tactus',
    name: 'Wooden tactus',
    category: 'bell',
    description:
      'Wood bars damped short and pushed into a soft drive, in a tiny room with its peaks held: the beat all three speeds share.',
    preview: ROUND_HIGH,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: { volume: 4.5, decay: 1.1, hardness: 0.5, position: 0.3, brightness: 0.6, spread: 0 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 9 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.3 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 18, outputGain: -7.5 } },
    ],
  },
  {
    id: 'mensuration-canons-glass-in-three-octaves',
    name: 'Glass in three octaves',
    category: 'bell',
    description:
      'Tapped glass that a canon repeats 0.6 seconds later an octave up and again an octave below, so each line makes three.',
    preview: SLOWING,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { volume: 0.5, decay: 1.8, hardness: 0.6, brightness: 0.55 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Octaves apart', params: { gap: 0.6, mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'mensuration-canons-breve-on-soft-bars',
    name: 'Breve on soft bars',
    category: 'bell',
    description:
      'Softly struck vibraphone modes that last four seconds, their lows and highs swaying apart, over a dark plate.',
    preview: PAIR,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { volume: 5, decay: 4, hardness: 0.12, damping: 0.6, brightness: 0.3, release: 0.4 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 2.5, depth: 0.95 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'mensuration-canons-one-long-rung',
    name: 'One long rung',
    category: 'bell',
    description:
      'A church bell of twenty seconds heard from the back of a hall, where a quick voice blurs and the slowest rings through.',
    preview: CLOSING,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { volume: -4.5, decay: 20, hardness: 0.55 },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
  },
  {
    id: 'mensuration-canons-maxima-without-clapper',
    name: 'Maxima without clapper',
    category: 'pad',
    description:
      'A bell bowed instead of struck, its entry faded in over a second and a half, in a long dark hall: the longest note value.',
    preview: BREATHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Bowed bell',
      params: { volume: -14.5, decay: 20, brightness: 0.2, stretch: 0.9 },
    },
    effects: [
      { deviceId: 'swell', preset: 'First note only' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 2500 } },
    ],
  },
  {
    id: 'mensuration-canons-tower-at-quarter-pace',
    name: 'Tower at quarter pace',
    category: 'bell',
    description:
      'A muffled distant bell with its own slower copy two octaves below, replayed at a quarter of the speed, in a faint detuned halo.',
    preview: OPENING,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Distant bell',
      params: { volume: -0.5, decay: 14, brightness: 0.2, hardness: 0.3 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Quarter speed', params: { mix: 0.6, highCut: 4000 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },
  {
    id: 'mensuration-canons-red-ink-bowls',
    name: 'Red ink bowls',
    category: 'bell',
    description:
      'A singing bowl of eight seconds with a table of sympathetic bowls tuned to A minor pentatonic ringing on after it.',
    preview: PERFECT,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: { volume: -1, decay: 8, hardness: 0.3 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Long ring', params: { mix: 0.6, register: 0.7, beat: 0.6 } },
    ],
  },
  {
    id: 'mensuration-canons-rim-that-waits',
    name: 'Rim that waits',
    category: 'drone',
    description:
      'A rubbed bowl with slow octaves below it arriving after the note, in a huge space with nothing above 900 Hz in its tail.',
    preview: BREATHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { detune: 0.4, brightness: 0.25, decay: 12 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'mensuration-canons-white-notation',
    name: 'White notation',
    category: 'bell',
    description:
      'A dark bowl whose strongest partials return as pure sines an octave higher, swelling in late: hollow notes over full ones.',
    preview: PAIR,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Dark bowl',
      params: { volume: -6, decay: 10, hardness: 0.2, spread: 0.3 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.65 } }],
  },
  {
    id: 'mensuration-canons-gong-keeps-the-long',
    name: 'Gong keeps the long',
    category: 'bell',
    description:
      'A soft gong whose tail sags slowly in pitch and darkens as it ages, for the voice that moves once in four beats.',
    preview: CLOSING,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { volume: 6, decay: 9, hardness: 0.15, brightness: 0.35, spread: 0.6 },
    },
    effects: [{ deviceId: 'melt', preset: 'Candle wax' }],
  },
  {
    id: 'mensuration-canons-under-the-stave',
    name: 'Under the stave',
    category: 'texture',
    description:
      'A rubbed gong whose bands swell and fade on slow cycles of their own, under a low-pass that creeps open and shut.',
    preview: BREATHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed gong',
      params: { volume: -13.5, decay: 14, stretch: 0.65, hardness: 0.2 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Deep swell' },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
    ],
  },
  {
    id: 'mensuration-canons-wet-rims-three-paces',
    name: 'Wet rims, three paces',
    category: 'bell',
    description:
      'A glass harp rubbed into sound and thickened by a slow three-voice chorus, in front of a bright plate.',
    preview: BREATHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { volume: -1.5, decay: 5, brightness: 0.7, detune: 0.6 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'mensuration-canons-breath-over-the-breves',
    name: 'Breath over the breves',
    category: 'pad',
    description:
      'Shivering glass with every attack taken off by a fog and a reverse-shaped reverb, so each note leans in from behind.',
    preview: PERFECT,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Shivering glass',
      params: { volume: 0, decay: 5, detune: 4, brightness: 0.4 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack' },
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'mensuration-canons-box-at-half-the-pace',
    name: 'Box at half the pace',
    category: 'bell',
    description:
      'A music box over its own melody played an octave down at half speed in smooth cycles of 1.2 seconds, on clean tape.',
    preview: SLOWING,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { volume: 3.5, decay: 2.4, hardness: 0.6, brightness: 0.45 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { length: 1200, mix: 0.55 } },
      { deviceId: 'tape', preset: 'Clean transfer' },
    ],
  },
  {
    id: 'mensuration-canons-dots-of-addition',
    name: 'Dots of addition',
    category: 'bell',
    description:
      'Wind chimes cut short, each throwing seven echoes to its own places between the speakers, off every beat.',
    preview: PERFECT,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: { volume: 1, decay: 2.2, hardness: 0.7, damping: 0.2 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.5 } }],
  },
  {
    id: 'mensuration-canons-tines-bent-by-ratio',
    name: 'Tines bent by ratio',
    category: 'bell',
    description:
      'Kalimba tines moved an octave down with their partials stretched apart, which turns them to dull gongs in a thin reverb.',
    preview: THREE_TO_TWO,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { volume: -1.5, decay: 5, damping: 0.4, hardness: 0.35, stretch: 1.2, release: 0.1 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Sunken gong' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'mensuration-canons-bars-held-for-a-breve',
    name: 'Bars held for a breve',
    category: 'organ',
    description:
      'Vibraphone modes kept sounding while the key is down and turned slowly by a rotating horn and drum, like an organ of bars.',
    preview: THREE_TO_TWO,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { sustain: 1, hardness: 0.1, release: 0.5, brightness: 0.45, detune: 0 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Chorale' }],
  },
  {
    id: 'mensuration-canons-glass-read-backward',
    name: 'Glass read backward',
    category: 'bell',
    description:
      'A glass struck near its middle and answered by the last 1.6 seconds of itself played backward, an octave above.',
    preview: CRAB,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { volume: 0.5, decay: 6, hardness: 0.4, position: 0.4, brightness: 0.3, spread: 1 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Rising glass',
        params: { time: 1600, feedback: 0.3, mix: 0.5 },
      },
    ],
  },
  {
    id: 'mensuration-canons-handbells-worn-page',
    name: 'Handbells, worn page',
    category: 'bell',
    description:
      'Short damped church bells played off a dusty record, narrow and crackling, for the voice at the middle speed.',
    preview: THREE_TO_TWO,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { volume: 4, decay: 1.8, damping: 0.9, hardness: 0.35, spread: 0.1, release: 0.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Dusty record' },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  // Mallets: the same three paces on bars over tubes, dry and quick to rolled and held.
  {
    id: 'mensuration-canons-quick-hand-dry-bars',
    name: 'Quick hand, dry bars',
    category: 'bell',
    description:
      'A marimba with firm mallets and a short ring, driven a little and left almost dry, for the voice at full speed.',
    preview: ROUND,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { volume: -3.5, mallet: 0.75, decay: 0.45, resonator: 0.45, width: 0.2 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'mensuration-canons-shadow-an-octave-late',
    name: 'Shadow an octave late',
    category: 'bell',
    description:
      'A marimba followed 0.8 seconds behind by one follower an octave below, dulled, as a second player would enter.',
    preview: PAIR,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { volume: -4, mallet: 0.3, decay: 1.3 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Octave shadow', params: { gap: 0.8, tone: 3500, mix: 0.5 } },
      { deviceId: 'stereo-detune', preset: 'Classic' },
    ],
  },
  {
    id: 'mensuration-canons-rolled-into-longs',
    name: 'Rolled into longs',
    category: 'pad',
    description:
      'A marimba rolled eight strokes a second under soft mallets, its attacks blurred by fog, so a held key is a held note.',
    preview: MAXIMA,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { roll: 8, mallet: 0.1, decay: 2 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Slow rise' },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'mensuration-canons-floor-of-the-round',
    name: 'Floor of the round',
    category: 'bass',
    description:
      'The softest marimba stroke rolled slowly, with the octave below fading in over half a second, for the slowest voice.',
    preview: LONG_LINE,
    instrument: { deviceId: 'mallets', preset: 'Humming marimba', params: { decay: 1.2, roll: 5 } },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'Slow pedals',
        params: { sub2: 0, sub1: 1, attack: 0.5, filter: 400 },
      },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'mensuration-canons-motor-at-two-to-one',
    name: 'Motor at two to one',
    category: 'bell',
    description:
      'Vibraphone with its motor at 2.5 turns a second, two throbs to each slow note, on warm tape and a small plate.',
    preview: PAIR,
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { motor: 1, motorRate: 2.5, mallet: 0.3 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'mensuration-canons-still-bars-slow-sweep',
    name: 'Still bars, slow sweep',
    category: 'bell',
    description:
      'A vibraphone with the motor off and a long ring, swept once in about sixteen seconds by a six-stage phaser.',
    preview: CLOSING,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { decay: 2.4, damper: 0.2, mallet: 0.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { feedback: 55 } },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'mensuration-canons-fifths-over-the-tenor',
    name: 'Fifths over the tenor',
    category: 'pad',
    description:
      'Rolled vibraphone whose reverb climbs a fifth on every pass, so a slow low voice grows a paler one over itself.',
    preview: BREATHS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { volume: -7.5, roll: 6, motor: 0 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.5 } }],
  },
  {
    id: 'mensuration-canons-pulse-of-the-mora',
    name: 'Pulse of the mora',
    category: 'bell',
    description:
      'Vibraphone opening and closing once a second with its motor, trailed by a haze of itself slowed eight times.',
    preview: OPENING,
    instrument: { deviceId: 'mallets', preset: 'Slow pulse vibes', params: { motorRate: 1 } },
    effects: [{ deviceId: 'stretch', preset: 'Slow cloud', params: { tone: -0.3 } }],
  },
  {
    id: 'mensuration-canons-echo-in-step',
    name: 'Echo in step',
    category: 'bell',
    description:
      'A dry xylophone and clean echoes 0.2 seconds apart, the length of one quick note, so repeats fall on the next stroke.',
    preview: ROUND_HIGH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { volume: 6, decay: 0.4, mallet: 0.6 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 200, feedback: 0.5, mix: 0.45 },
      },
    ],
  },
  {
    id: 'mensuration-canons-bars-over-open-pipes',
    name: 'Bars over open pipes',
    category: 'bell',
    description:
      'A long soft xylophone sounded inside an open pipe with a trace of breath, hollow and close to a wooden flute.',
    preview: CRAB,
    instrument: { deviceId: 'mallets', preset: 'Warm xylophone', params: { volume: -1, decay: 3 } },
    effects: [
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.9, size: 1.5, air: 0.35 } },
    ],
  },
  {
    id: 'mensuration-canons-tremor-of-the-minim',
    name: 'Tremor of the minim',
    category: 'texture',
    description:
      'A fast xylophone roll whose partials each swell and fade on their own, rising in ripples from low to high, in a small room.',
    preview: CRAB,
    instrument: {
      deviceId: 'mallets',
      preset: 'Xylophone roll',
      params: { volume: -1, roll: 12, decay: 1, damper: 0.2 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rising ripple', params: { depth: 0.95 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'mensuration-canons-smallest-values',
    name: 'Smallest values',
    category: 'bell',
    description:
      'A hard glockenspiel stroke followed by a tape echo that keeps neither its lows nor its top, for the notes with the most flags.',
    preview: THREE_TO_TWO,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { volume: -1.5, decay: 0.5, mallet: 0.95, damper: 0.4 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Thin and fading',
        params: { time: 270, lowCut: 600, mix: 0.45 },
      },
    ],
  },
  {
    id: 'mensuration-canons-resonators-left-open',
    name: 'Resonators left open',
    category: 'bell',
    description:
      'Glockenspiel over full resonators, its strikes sifted down, its tones held in a wash inside a huge stopped pipe.',
    preview: OPENING,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { mallet: 0.3, decay: 3 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Long wash' },
      { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.8 } },
    ],
  },
  {
    id: 'mensuration-canons-frost-on-the-clef',
    name: 'Frost on the clef',
    category: 'texture',
    description:
      'A glockenspiel roll smeared until every frequency hangs, with the bright side up and nothing under 250 Hz in the smear.',
    preview: PERFECT,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel roll',
      params: { volume: -4, roll: 10, mallet: 0.15 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.7 } }],
  },
  {
    id: 'mensuration-canons-celesta-in-prolation',
    name: 'Celesta in prolation',
    category: 'keys',
    description:
      'A damped celesta through nearly new tape with a loose double on either side, in step with the middle voice.',
    preview: THREE_TO_TWO,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { volume: -4, mallet: 0.45, decay: 0.8 },
    },
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'chorus', preset: 'Loose double' },
    ],
  },
  {
    id: 'mensuration-canons-celesta-hammers-gone',
    name: 'Celesta, hammers gone',
    category: 'pad',
    description:
      'A long open celesta with every attack swelled in over 0.65 seconds, then set in a small dark space.',
    preview: BREATHS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Open celesta',
      params: { volume: -8, decay: 4, width: 1 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow bow' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { decay: 2.5 } },
    ],
  },
  {
    id: 'mensuration-canons-table-of-turning-keys',
    name: 'Table of turning keys',
    category: 'keys',
    description:
      'A celesta with a motor tremolo, pushed into a lopsided soft drive and carried round the head in a slow figure of eight.',
    preview: CRAB,
    instrument: {
      deviceId: 'mallets',
      preset: 'Tremolo celesta',
      params: { volume: -2, motorRate: 6, decay: 1.6 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 'around', preset: 'Slow eight', params: { rate: 0.3 } },
    ],
  },
  {
    id: 'mensuration-canons-bars-in-black-notation',
    name: 'Bars in black notation',
    category: 'bell',
    description:
      'A marimba given the body of something far larger while its notes stay put, over a warm iron drive.',
    preview: ROUND,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.55, decay: 2.2, resonator: 0.6 },
    },
    effects: [
      { deviceId: 'size', preset: 'Giant' },
      { deviceId: 'analog-drive', preset: 'Iron lows' },
    ],
  },
  {
    id: 'mensuration-canons-clavis-and-undertow',
    name: 'Clavis and undertow',
    category: 'bell',
    description:
      'A glockenspiel with loops of itself an octave lower, reversed and slow, coming round underneath it.',
    preview: SLOWING,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { volume: -5, mallet: 0.65, decay: 1, resonator: 0.4 },
    },
    effects: [{ deviceId: 'cascade', preset: 'Undertow', params: { mix: 0.6 } }],
  },
  {
    id: 'mensuration-canons-tenor-of-struck-bars',
    name: 'Tenor of struck bars',
    category: 'voice',
    description:
      'A short-ringing vibraphone whose reverb is shaped by a sung oo, so a choir seems to hold the slow voice behind it.',
    preview: PAIR,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { volume: -3, mallet: 0.35, decay: 0.7, damper: 0, resonator: 1 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Endless oo',
        params: { decay: 9, lowCut: 200, mix: 0.7 },
      },
    ],
  },
  // Chamber strings: short bows for the quick voice, one or two players for the middle, full slow bows for the long.
  {
    id: 'mensuration-canons-short-bows-for-fusas',
    name: 'Short bows for fusas',
    category: 'string',
    description:
      'Short bows with almost no release, heard inside a drum, in a gated reverb that stops dead, for the voice with most notes.',
    preview: ROUND,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { volume: -4.5, players: 3, bow: 0.6, air: 0.5, width: 0.4 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head' },
      { deviceId: 'shaped-reverb', preset: 'Gated' },
    ],
  },
  {
    id: 'mensuration-canons-tenor-from-one-bow',
    name: 'Tenor from one bow',
    category: 'string',
    description:
      'One player close by, plain, with a vibrato that only begins once a long note has been held a while.',
    preview: MAXIMA,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { volume: -3.5, vibrato: 0, bow: 0.35, release: 0.8, attack: 0.1 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'mensuration-canons-six-bows-one-breve',
    name: 'Six bows, one breve',
    category: 'pad',
    description:
      'Six players fading in over 1.4 seconds, their bands rising and falling like a slow tide, for notes of four beats.',
    preview: MAXIMA,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Six slow bows',
      params: { volume: -2.5, attack: 1.4, release: 5, mute: 0.2 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'mensuration-canons-ligature-of-viols',
    name: 'Ligature of viols',
    category: 'string',
    description:
      'A straight-toned, half-muted consort with the octave above it, in a narrow warm spring.',
    preview: MIRROR,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { mute: 0.4, bow: 0.8, attack: 0.15 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave', params: { up1: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'mensuration-canons-hollow-noteheads',
    name: 'Hollow noteheads',
    category: 'string',
    description:
      'Whispering bows, more air than string, doubled an octave above and below by pipes that speak a little late.',
    preview: BREATHS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { volume: -2, attack: 0.5, air: 1 },
    },
    effects: [{ deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.8 } }],
  },
  {
    id: 'mensuration-canons-mute-for-the-mirror',
    name: 'Mute for the mirror',
    category: 'pad',
    description:
      'Five fully muted players, quick to speak, folded over by slow backward echoes, with the lows raised.',
    preview: MIRROR,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { volume: 0.5, attack: 0.18, release: 1.5 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { feedback: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 4 } },
    ],
  },
  {
    id: 'mensuration-canons-bows-at-the-bridge',
    name: 'Bows at the bridge',
    category: 'string',
    description:
      'Three bows hard against the bridge, glassy and still, swept by a resonant eight-stage phaser on a plate.',
    preview: FOURTH_BELOW,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { volume: 5, attack: 0.25, release: 1.4 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage' },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'mensuration-canons-ragged-procession',
    name: 'Ragged procession',
    category: 'string',
    description:
      'Six players who never quite agree, multiplied into a thick flock that wheels round the listener.',
    preview: BREATHS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { volume: -3.5, attack: 0.35, vibrato: 10, bow: 0.5 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Wheeling', params: { mix: 0.7 } }],
  },
  {
    id: 'mensuration-canons-halo-of-the-longest',
    name: 'Halo of the longest',
    category: 'pad',
    description:
      'Three bows without pressure or vibrato, held as an endless even pad by a sustainer that glides between notes.',
    preview: MAXIMA,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { volume: -4, attack: 0.8, air: 0.2 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.7, tone: -0.4 } }],
  },
  {
    id: 'mensuration-canons-solo-on-old-vellum',
    name: 'Solo on old vellum',
    category: 'string',
    description:
      'One bow that wanders in pitch and pressure, played from a worn cassette with the top of the sound worn away.',
    preview: FOURTH_BELOW,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wandering solo',
      params: { volume: -2, attack: 0.12, release: 1 },
    },
    effects: [{ deviceId: 'patina', preset: 'Worn cassette', params: { tone: 0.3 } }],
  },
  {
    id: 'mensuration-canons-slow-hand-wide-shake',
    name: 'Slow hand, wide shake',
    category: 'string',
    description:
      'Three players with a very wide vibrato beside a smooth copy of themselves at half speed, an octave down.',
    preview: FOURTH_BELOW,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wide vibrato',
      params: { volume: -1.5, attack: 0.2, vibrato: 34, mute: 0 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { mix: 0.5, length: 800 } },
    ],
  },
  {
    id: 'mensuration-canons-veil-over-the-cantus',
    name: 'Veil over the cantus',
    category: 'pad',
    description:
      'Muted bows near the bridge, thin, blown about in a cloud of overlapping grains, with everything low thinned out after it.',
    preview: BREATHS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Thin veil',
      params: { volume: -1, attack: 0.7, release: 3, mute: 0.7 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Choir of fifths', params: { scatter: 0.3, mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 7000 } },
    ],
  },

  // Felt piano: the middle voice, from a bare staccato touch to a pedal that never comes up.
  {
    id: 'mensuration-canons-middle-voice-in-felt',
    name: 'Middle voice in felt',
    category: 'keys',
    description:
      'A thickly felted piano, mono at the keys, with the thump left in and a short dark room after it.',
    preview: PAIR,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { outputDb: -14.5, width: 0, thump: 0.8, reverbMix: 0, resonance: 0.2 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Small dark room' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'mensuration-canons-bare-hammers-quick-pace',
    name: 'Bare hammers, quick pace',
    category: 'keys',
    description:
      'A hard piano with no felt, its partials stretched sharp, and an echo a fifth of a second behind: one quick note late.',
    preview: ROUND,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { outputDb: -11.5, reverbMix: 0, resonance: 0.1, damper: 0.9, stiffness: 1.4 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Stiff string', params: { mix: 0.7 } },
      { deviceId: 'tape-echo', preset: 'Clean and steady', params: { time: 200, feedback: 0.2 } },
    ],
  },
  {
    id: 'mensuration-canons-pedal-through-the-long',
    name: 'Pedal through the long',
    category: 'keys',
    description:
      'A soft piano with the pedal down throughout and a bank of strings tuned to A minor ringing in answer.',
    preview: OPENING,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: { outputDb: -12, felt: 0.8, resonance: 1, polyphony: 24, reverbMix: 0 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.6, decay: 7 } }],
  },
  {
    id: 'mensuration-canons-three-hands-one-tune',
    name: 'Three hands, one tune',
    category: 'keys',
    description:
      'A piano whose own loops return at an octave above and an octave below in tiles of 0.6 seconds.',
    preview: SLOWING,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { outputDb: -8.5, felt: 0.45, hardness: 0.5, reverbMix: 0.1 },
    },
    effects: [
      {
        deviceId: 'cascade',
        preset: 'Slow tiles',
        params: { time: 600, high: 0.6, low: 0.8, mix: 0.6 },
      },
    ],
  },
  {
    id: 'mensuration-canons-upright-in-the-vestry',
    name: 'Upright in the vestry',
    category: 'keys',
    description:
      'A loose, clattering upright heard through a closed door, its highs gone and its quiet end lifted.',
    preview: THREE_TO_TWO,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { outputDb: -10.5, action: 1, grit: 0.2, reverbMix: 0 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door' },
      { deviceId: 'lift', preset: 'Slightly closer' },
    ],
  },
  {
    id: 'mensuration-canons-piano-without-a-tactus',
    name: 'Piano without a tactus',
    category: 'pad',
    description:
      'A felted piano washed under its pedal with each attack swelled away, then smeared into a dark watery blur.',
    preview: MAXIMA,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { outputDb: -3.5, reverbMix: 0.2 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad' },
      { deviceId: 'spectral-blur', preset: 'Dark water' },
    ],
  },
  {
    id: 'mensuration-canons-grit-for-the-contratenor',
    name: 'Grit for the contratenor',
    category: 'keys',
    description:
      'A driven grand pushed again through a triode and narrowed, its sustain brought up so slow notes stay in front.',
    preview: CLOSING,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Driven grand',
      params: { outputDb: -11.5, grit: 0.7, reverbMix: 0.05, width: 0.15 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.6, highCut: 6000 } },
      { deviceId: 'ambient-comp', preset: 'Long sustain', params: { makeup: 2 } },
    ],
  },
  {
    id: 'mensuration-canons-still-strings-mirrored',
    name: 'Still strings, mirrored',
    category: 'keys',
    description:
      'A piano in exact tune with its action nearly silent, shifted three hertz up on one side and down on the other.',
    preview: MIRROR,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { outputDb: -14.5, resonance: 0.4, felt: 0.2 },
    },
    effects: [{ deviceId: 'freq-shifter', preset: 'Split sky', params: { mix: 0.55 } }],
  },
  {
    id: 'mensuration-canons-thud-at-the-double-bar',
    name: 'Thud at the double bar',
    category: 'keys',
    description:
      'Only the softest felt and the knock of the key, with the octave below added and a warm tube after it.',
    preview: FOURTH_BELOW,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { outputDb: -13.5, reverbMix: 0.08, resonance: 0.1 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'saturator', preset: 'Tube preamp' },
    ],
  },
  // Ice: chirps that say the quick voice, plates that ring through a long one.
  {
    id: 'mensuration-canons-pings-at-the-fusa',
    name: 'Pings at the fusa',
    category: 'bell',
    description:
      'A near, clear ping that rings for barely a second, pushed through an early sampler, for the quickest of the three.',
    preview: THREE_TO_TWO,
    instrument: {
      deviceId: 'ice',
      preset: 'Clear ping',
      params: { volume: 6, ring: 0.9, distance: 0.1, bright: 0.8 },
    },
    effects: [{ deviceId: 'patina', preset: 'Early sampler' }],
  },
  {
    id: 'mensuration-canons-plate-for-the-longa',
    name: 'Plate for the longa',
    category: 'bell',
    description:
      'Thick ice with a dull long ring and no cracking by itself, with a low sung vowel behind it.',
    preview: OPENING,
    instrument: {
      deviceId: 'ice',
      preset: 'Thick ice',
      params: { volume: 1.5, cracks: 0, ring: 6, distance: 0.2 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 7 } }],
  },
  {
    id: 'mensuration-canons-tempus-on-the-lake',
    name: 'Tempus on the lake',
    category: 'bell',
    description:
      'Ice bells answered by three dull followers 0.6 seconds apart, the last of them an octave below.',
    preview: SLOWING,
    instrument: {
      deviceId: 'ice',
      preset: 'Ice bells',
      params: { volume: 5.5, ring: 3, thick: 0.6 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Dark canon',
        params: { gap: 0.6, interval2: 0, round: 0.3, tone: 2500 },
      },
    ],
  },
  {
    id: 'mensuration-canons-snap-before-the-beat',
    name: 'Snap before the beat',
    category: 'texture',
    description:
      'A brittle crack with a note inside it, skipping from side to side in even echoes 0.26 seconds apart, its peaks held.',
    preview: PERFECT,
    instrument: {
      deviceId: 'ice',
      preset: 'Brittle snap',
      params: { volume: 2.5, ring: 1.5, crack: 0.5 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Even steps', params: { first: 260, mix: 0.45 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 17, outputGain: -7.5 } },
    ],
  },
  {
    id: 'mensuration-canons-far-shore-slower',
    name: 'Far shore, slower',
    category: 'texture',
    description:
      'Distant ice with long shore echoes, caught on a loop of tape that plays it back at half speed.',
    preview: CLOSING,
    instrument: {
      deviceId: 'ice',
      preset: 'Far shores',
      params: { volume: 0, distance: 0.5, shore: 0.6 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down', params: { length: 1.6, feedback: 0.5 } },
    ],
  },
  {
    id: 'mensuration-canons-thaw-in-the-tenor',
    name: 'Thaw in the tenor',
    category: 'pad',
    description:
      'Slow dull ice with its arrivals swelled in and an underwater body, so only the long tones come up.',
    preview: BREATHS,
    instrument: {
      deviceId: 'ice',
      preset: 'Slow thaw',
      params: { volume: 2.5, ring: 12, cracks: 0, distance: 0.3 },
    },
    effects: [
      { deviceId: 'swell', preset: 'String section' },
      { deviceId: 'underwater', preset: 'Just under' },
    ],
  },
  {
    id: 'mensuration-canons-thin-sheet-thin-ink',
    name: 'Thin sheet, thin ink',
    category: 'bell',
    description:
      'Thin bright ice rung by a ring modulator on a high A, splitting each ping into glassy bells in a small bright tank.',
    preview: CRAB,
    instrument: {
      deviceId: 'ice',
      preset: 'Thin ice',
      params: { volume: 4, ring: 2, cracks: 0, stretch: 0.1 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Glass bells', params: { root: 9, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { decay: 2.5, mix: 0.3 } },
    ],
  },
  {
    id: 'mensuration-canons-floe-under-three-feet',
    name: 'Floe under three feet',
    category: 'drone',
    description:
      'A deep floe with almost no highs, rung for fourteen seconds, lows and highs trading places every three seconds, kept dense.',
    preview: MAXIMA,
    instrument: { deviceId: 'ice', preset: 'Deep floe', params: { cracks: 0, shore: 0.1 } },
    effects: [
      { deviceId: 'tremolo', preset: 'Tilting tone' },
      { deviceId: 'ambient-comp', preset: 'Dense pad', params: { makeup: 8 } },
    ],
  },
  {
    id: 'mensuration-canons-cracks-between-rests',
    name: 'Cracks between rests',
    category: 'texture',
    description:
      'Ice that goes on cracking while a key is held, throwing bright sparks an octave and two above wherever it lands.',
    preview: PAIR,
    instrument: {
      deviceId: 'ice',
      preset: 'Restless ice',
      params: { volume: 1.5, ring: 2.2, distance: 0.3 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Glitter', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },

  // West coast: woody plucks for the quick voice, folding drones for the long.
  {
    id: 'mensuration-canons-woody-counters',
    name: 'Woody counters',
    category: 'plucked',
    description:
      'Very short folded plucks, each a little different, in a tight swarm of echoes with its peaks held.',
    preview: ROUND,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { volume: -5.5, attack: 0.005, decay: 0.5, fold: 0.5, chance: 0.4 },
    },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Tight swarm' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'mensuration-canons-mallet-in-two-time',
    name: 'Mallet in two-time',
    category: 'bell',
    description:
      'A soft low-pass-gated mallet with a steady pattern of two pulses stepping left and right over it.',
    preview: PAIR,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { volume: 1, decay: 2.6, fold: 0.25, colour: 0.55 },
    },
    effects: [{ deviceId: 'pulses', preset: 'Left then right' }],
  },
  {
    id: 'mensuration-canons-thumbs-three-to-two',
    name: 'Thumbs, three to two',
    category: 'plucked',
    description:
      'A thumb piano in a body the size of a thimble, its echoes jumping up an octave and back every two repeats.',
    preview: THREE_TO_TWO,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Thumb piano',
      params: { decay: 0.9, colour: 0.7 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Thimble' },
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { time: 405, mix: 0.36 } },
    ],
  },
  {
    id: 'mensuration-canons-glass-bell-three-heads',
    name: 'Glass bell, three heads',
    category: 'bell',
    description:
      'A frequency-modulated bell blended with wavering tape, then returned by the three heads of a tape echo.',
    preview: SLOWING,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Glass bell',
      params: { volume: -3, decay: 3, fm: 0.4, colour: 0.75 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 600, mix: 0.42 } },
    ],
  },
  {
    id: 'mensuration-canons-gong-under-the-cantus',
    name: 'Gong under the cantus',
    category: 'bell',
    description:
      'A clangorous six-second gong whose tail rises and dims as it ages, the loud moments filtered darker.',
    preview: FOURTH_BELOW,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Long gong',
      params: { volume: -2, fm: 0.6, attack: 0.02, decay: 6 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Evaporate', params: { mix: 0.5 } },
      { deviceId: 'auto-filter', preset: 'Loud goes dark' },
    ],
  },
  {
    id: 'mensuration-canons-fold-held-four-beats',
    name: 'Fold held four beats',
    category: 'drone',
    description:
      'A folding drone fading in over 0.6 seconds, darkened and opened by a slow breath, under a slow chorus.',
    preview: MAXIMA,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folding drone',
      params: { volume: -3.5, attack: 0.6, fold: 0.5, colour: 0.5 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Dark lungs' },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },
  {
    id: 'mensuration-canons-hollow-pipes-in-ratio',
    name: 'Hollow pipes in ratio',
    category: 'organ',
    description:
      'Hollow sustained pipes with a fifth and a twelfth drawn above them by slow organ stops.',
    preview: BREATHS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow pipes',
      params: { volume: -4.5, attack: 0.15, fold: 0.05 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Hollow fifths' },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'mensuration-canons-the-slowest-foot',
    name: 'The slowest foot',
    category: 'bass',
    description:
      'A round folded bass with a clear opening edge, on a heavy transformer, saying the tune at quarter speed.',
    preview: LONG_LINE,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Round bass',
      params: { volume: -4, fold: 0.6, decay: 3.5, colour: 0.15 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'spread', preset: 'Firm bass' },
    ],
  },

  // Afterglow: the strike says the quick voice and the glow keeps the slow one.
  {
    id: 'mensuration-canons-strike-now-glow-later',
    name: 'Strike now, glow later',
    category: 'keys',
    description:
      'A felt strike whose overtones take two seconds to come up, with hazy moments of earlier notes returning, some at half speed.',
    preview: MAXIMA,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Felt afterglow',
      params: { bloom: 2, glow: 0.8, tone: 0.3 },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Hazy past', params: { time: 800, mix: 0.45 } }],
  },
  {
    id: 'mensuration-canons-bell-long-shadow',
    name: 'Bell, long shadow',
    category: 'bell',
    description:
      'A struck bell with a strong halo and a glow of eight seconds, loosened into a slow chorus the longer it is held.',
    preview: OPENING,
    instrument: { deviceId: 'afterglow', preset: 'Bell halo', params: { tone: 0.4, halo: 0.8 } },
    effects: [{ deviceId: 'late-vibrato', preset: 'Opens to chorus' }],
  },
  {
    id: 'mensuration-canons-plucks-that-keep-time',
    name: 'Plucks that keep time',
    category: 'plucked',
    description:
      'Plucked notes with little glow, replayed by two loops a little apart in length, so they fall out of step.',
    preview: CRAB,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: { volume: -2, glow: 0.25, decay: 1.2, fade: 2 },
    },
    effects: [
      {
        deviceId: 'orbits',
        preset: 'Two voices',
        params: { length: 1.6, feedback: 0.6, mix: 0.5 },
      },
    ],
  },
  {
    id: 'mensuration-canons-only-the-slow-voice',
    name: 'Only the slow voice',
    category: 'pad',
    description:
      'The glow with no strike at all, darkened and layered with grains of itself an octave under, over half of them backward.',
    preview: MAXIMA,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the glow',
      params: { tone: 0.2, bloom: 1.2, fade: 4 },
    },
    effects: [{ deviceId: 'grain-cloud', preset: 'Low tide', params: { mix: 0.5 } }],
  },
  {
    id: 'mensuration-canons-chimes-in-perfect-time',
    name: 'Chimes in perfect time',
    category: 'bell',
    description:
      'Bright struck chimes with a slight glow that fades in a second, pulled in by a fast limiter and spread wide at the top.',
    preview: PERFECT,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bright chimes',
      params: { volume: -3.5, decay: 1, fade: 1, glow: 0.3 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash' },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'mensuration-canons-glass-at-three-depths',
    name: 'Glass at three depths',
    category: 'pad',
    description:
      'Struck glass whose colours are delayed from low to high over 0.8 seconds, each repeat fanning out further.',
    preview: BREATHS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Still glass',
      params: { volume: -4, strike: 0.8, decay: 2, glow: 0.5, width: 0.8 },
    },
    effects: [{ deviceId: 'prism', preset: 'Low to high', params: { time: 800, mix: 0.5 } }],
  },
  {
    id: 'mensuration-canons-quick-bloom-slow-bow',
    name: 'Quick bloom, slow bow',
    category: 'pad',
    description:
      'A plucked glow that swells and is gone within two seconds, blurred at once by a thick fog of three layers.',
    preview: FOURTH_BELOW,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Quick swell',
      params: { strike: 0.1, tone: 0.75, source: 2 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Deep fog' },
      { deviceId: 'lift', preset: 'Steady shine' },
    ],
  },
  {
    id: 'mensuration-canons-low-bell-of-four',
    name: 'Low bell of four',
    category: 'bell',
    description:
      'A low bell whose glow rises over five seconds, with slow sines an octave beneath that arrive behind the strike.',
    preview: MAXIMA,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Low tide bell',
      params: { strike: 0.9, decay: 5 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Low shadow', params: { mix: 0.5 } }],
  },

  // Aurora: brass and string layers, from a short call to a swell that outlasts the note.
  {
    id: 'mensuration-canons-short-call-of-brass',
    name: 'Short call of brass',
    category: 'wind',
    description:
      'Short brass notes with a full filter overshoot and no swell, through a combo speaker in a room, for the voice at half speed.',
    preview: PAIR,
    instrument: {
      deviceId: 'aurora',
      preset: 'Short brass',
      params: { brilliance: 1400, release: 0.35 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }],
  },
  {
    id: 'mensuration-canons-horns-in-the-tenor',
    name: 'Horns in the tenor',
    category: 'wind',
    description:
      'Soft horns low in brilliance with a quarter-second attack, in a hall whose lows outlast the rest, then put on tape.',
    preview: MIRROR,
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { attack: 0.25, release: 2, brilliance: 600 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
      { deviceId: 'saturator', preset: 'On tape' },
    ],
  },
  {
    id: 'mensuration-canons-silver-thread',
    name: 'Silver thread',
    category: 'string',
    description:
      'Thin, very bright strings with their body cut away and a quick attack, phased slowly through twelve stages.',
    preview: CRAB,
    instrument: {
      deviceId: 'aurora',
      preset: 'Silver strings',
      params: { volume: 6, attack: 0.12, release: 1.2 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Twelve stage cloud' }],
  },
  {
    id: 'mensuration-canons-dawn-in-long-values',
    name: 'Dawn in long values',
    category: 'pad',
    description:
      'A slow dark bloom that keeps opening while the key is down, answered by a reverb that climbs octave and fifth.',
    preview: MAXIMA,
    instrument: { deviceId: 'aurora', preset: 'Slow bloom', params: { attack: 1, release: 4 } },
    effects: [{ deviceId: 'shimmer', preset: 'Organ loft' }],
  },
  {
    id: 'mensuration-canons-chiming-consort',
    name: 'Chiming consort',
    category: 'bell',
    description:
      'Ring-modulated strings struck at once and left to chime, with the pulse of three layers always slowing.',
    preview: OPENING,
    instrument: {
      deviceId: 'aurora',
      preset: 'Chime strings',
      params: { volume: -1, release: 3, ring: 0.8 },
    },
    effects: [
      { deviceId: 'winding-down', preset: 'Three slowing' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'mensuration-canons-reeds-off-the-ligature',
    name: 'Reeds off the ligature',
    category: 'wind',
    description:
      'Loosely tuned reeds with a wide spread of pitch, through a slow rotating drum and horn across the room.',
    preview: FOURTH_BELOW,
    instrument: {
      deviceId: 'aurora',
      preset: 'Loose reeds',
      params: { volume: -3.5, attack: 0.08, brilliance: 1300 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Across the room' }],
  },
  {
    id: 'mensuration-canons-vowel-of-the-maxima',
    name: 'Vowel of the maxima',
    category: 'voice',
    description:
      'A resonant filter opening like a vowel over each long note, its partials redrawn as wide lingering sines.',
    preview: MAXIMA,
    instrument: {
      deviceId: 'aurora',
      preset: 'Opening vowel',
      params: { attack: 0.8, release: 3 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Wide glass', params: { mix: 0.5, release: 6 } }],
  },

  // Ember: the plainest voices, one for each speed and some for two at once.
  {
    id: 'mensuration-canons-plectrum-of-semiminims',
    name: 'Plectrum of semiminims',
    category: 'plucked',
    description:
      'A filtered pluck of half a second with an octave inside it, thrown round by a short three-head cluster of tape.',
    preview: ROUND,
    instrument: {
      deviceId: 'ember',
      preset: 'Glass Pluck',
      params: { volume: 3.5, ampDecay: 0.5, cutoff: 500, ampRelease: 0.4 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Tiny room cluster' }],
  },
  {
    id: 'mensuration-canons-bells-in-augmentation',
    name: 'Bells in augmentation',
    category: 'bell',
    description:
      'Two sines a twelfth apart with a struck envelope, over a bank of strings that learns the notes and echoes them.',
    preview: SLOWING,
    instrument: { deviceId: 'ember', preset: 'Bell', params: { ampDecay: 2.2, oscMix: 0.3 } },
    effects: [{ deviceId: 'sympathetic', preset: 'Learn and hold', params: { mix: 0.45 } }],
  },
  {
    id: 'mensuration-canons-hollow-breves',
    name: 'Hollow breves',
    category: 'pad',
    description:
      'A hollow pulse and triangle pad with a half-second attack, each note nudged by reversed grains of itself.',
    preview: MAXIMA,
    instrument: {
      deviceId: 'ember',
      preset: 'Hollow Pad',
      params: { ampAttack: 0.5, lfo2Amount: 0.2 },
    },
    effects: [{ deviceId: 'grain-cloud', preset: 'Backwards room' }],
  },
  {
    id: 'mensuration-canons-warm-ground-of-longs',
    name: 'Warm ground of longs',
    category: 'bass',
    description:
      'A dark gliding saw bass whose filter opens late and closes over a second, a dull detuned copy on either side, for the slowest voice.',
    preview: LONG_LINE,
    instrument: {
      deviceId: 'ember',
      preset: 'Warm Bass',
      params: { filterAttack: 0.12, filterDecay: 0.9, cutoff: 300, ampAttack: 0.03, glide: 0.12 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Shadow' },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'mensuration-canons-strings-arriving-last',
    name: 'Strings arriving last',
    category: 'string',
    description:
      'A slow unison of saws with a soft top, entering a huge space whose tail swells up after the note instead of at it.',
    preview: MAXIMA,
    instrument: {
      deviceId: 'ember',
      preset: 'Slow strings',
      params: { ampAttack: 0.8, cutoff: 2000, ampRelease: 2.5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bloom', params: { decay: 8 } }],
  },
  {
    id: 'mensuration-canons-brass-at-the-proportion',
    name: 'Brass at the proportion',
    category: 'wind',
    description:
      'Plain sawtooth brass with a filter that opens on each note, closed in a radio-narrow band and a small room.',
    preview: MIRROR,
    instrument: {
      deviceId: 'ember',
      preset: 'Brass',
      params: { volume: 2, cutoff: 700, filterAttack: 0.15, ampRelease: 0.5 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Phone line', params: { driveDb: 6, mix: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
]
