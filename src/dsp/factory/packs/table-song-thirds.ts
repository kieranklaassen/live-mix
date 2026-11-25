import { type FactoryPreset, type Phrase } from '../types'

// Three voices round a table: a bass that holds and steps, two above it that close in on it.
// The scale is on G, in cents: 0, 160, 350, 498, 702, 855, 1000. The fourth and fifth are pure,
// the third is neither major nor minor, and 1-4-5 is a chord to rest on. Laid out by what sings
// it (brass, reeds, bows, chests, then synthetic voices) and by how near the listener sits.

// The stacked 1-4-5 held; the middle voice comes down 4 3 2, the bass drops a step, and all close on the fifth.
const STACK: Phrase = {
  notes: [
    { atSec: 0, durSec: 5, note: 55, gain: 0.5 },
    { atSec: 0, durSec: 2.6, note: 59.98, gain: 0.42 },
    { atSec: 0, durSec: 5, note: 62.02, gain: 0.42 },
    { atSec: 2.6, durSec: 1.3, note: 58.5, gain: 0.42 },
    { atSec: 3.9, durSec: 2.2, note: 56.6, gain: 0.42 },
    { atSec: 5, durSec: 1.1, note: 53, gain: 0.5 },
    { atSec: 5, durSec: 1.1, note: 59.98, gain: 0.42 },
    { atSec: 6.1, durSec: 1.2, note: 55, gain: 0.55 },
    { atSec: 6.1, durSec: 1.2, note: 62.02, gain: 0.42 },
  ],
}

// 1-3-5 with the neutral third, the bass down a step under a fifth with its own third, home to the bare fifth and then the unison.
const STEP: Phrase = {
  notes: [
    { atSec: 0, durSec: 2, note: 55, gain: 0.5 },
    { atSec: 0, durSec: 2, note: 58.5, gain: 0.42 },
    { atSec: 0, durSec: 2, note: 62.02, gain: 0.42 },
    { atSec: 2, durSec: 1.7, note: 53, gain: 0.5 },
    { atSec: 2, durSec: 1.7, note: 56.6, gain: 0.42 },
    { atSec: 2, durSec: 1.7, note: 59.98, gain: 0.42 },
    { atSec: 3.7, durSec: 0.9, note: 55, gain: 0.52 },
    { atSec: 3.7, durSec: 0.9, note: 62.02, gain: 0.42 },
    { atSec: 4.6, durSec: 1.4, note: 53, gain: 0.48 },
    { atSec: 4.6, durSec: 0.7, note: 59.98, gain: 0.42 },
    { atSec: 5.3, durSec: 0.7, note: 56.6, gain: 0.42 },
    { atSec: 6, durSec: 1.3, note: 55, gain: 0.62 },
  ],
}

// 1-4-7, two fourths stacked, closing inward over a held bass: 1-4-6, 1-3-5, 1-2-5, the fifth.
const QUARTAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.1, note: 55, gain: 0.48 },
    { atSec: 0, durSec: 3.8, note: 59.98, gain: 0.42 },
    { atSec: 0, durSec: 2.6, note: 65, gain: 0.42 },
    { atSec: 2.6, durSec: 1.2, note: 63.55, gain: 0.42 },
    { atSec: 3.8, durSec: 2.3, note: 62.02, gain: 0.42 },
    { atSec: 3.8, durSec: 1.4, note: 58.5, gain: 0.42 },
    { atSec: 5.2, durSec: 0.9, note: 56.6, gain: 0.42 },
    { atSec: 6.1, durSec: 1.2, note: 55, gain: 0.55 },
    { atSec: 6.1, durSec: 1.2, note: 62.02, gain: 0.42 },
  ],
}

// The top voice turns 5 6 5 4 3 2 in unequal steps over a drone in octaves, and ends on the drone.
const ORNAMENT: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 43, gain: 0.5 },
    { atSec: 0.2, durSec: 6.1, note: 55, gain: 0.38 },
    { atSec: 0.5, durSec: 1.7, note: 62.02, gain: 0.48 },
    { atSec: 2.2, durSec: 0.7, note: 63.55, gain: 0.46 },
    { atSec: 2.9, durSec: 1.3, note: 62.02, gain: 0.46 },
    { atSec: 4.2, durSec: 1.2, note: 59.98, gain: 0.46 },
    { atSec: 5.4, durSec: 0.5, note: 58.5, gain: 0.44 },
    { atSec: 5.9, durSec: 0.4, note: 56.6, gain: 0.44 },
    { atSec: 6.3, durSec: 1, note: 55, gain: 0.55 },
  ],
}

// An octave down and opened out: the bass steps G F G F G under fifths, with the neutral thirds a tenth above it.
const LOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 43, gain: 0.5 },
    { atSec: 0, durSec: 2.2, note: 50.02, gain: 0.42 },
    { atSec: 0, durSec: 1.2, note: 59.98, gain: 0.4 },
    { atSec: 1.2, durSec: 1, note: 58.5, gain: 0.4 },
    { atSec: 2.2, durSec: 1.7, note: 41, gain: 0.5 },
    { atSec: 2.2, durSec: 1.7, note: 47.98, gain: 0.42 },
    { atSec: 2.2, durSec: 1.7, note: 56.6, gain: 0.4 },
    { atSec: 3.9, durSec: 1.4, note: 43, gain: 0.5 },
    { atSec: 3.9, durSec: 1.4, note: 50.02, gain: 0.42 },
    { atSec: 3.9, durSec: 1.4, note: 58.5, gain: 0.4 },
    { atSec: 5.3, durSec: 0.8, note: 41, gain: 0.5 },
    { atSec: 5.3, durSec: 0.8, note: 47.98, gain: 0.42 },
    { atSec: 5.3, durSec: 0.8, note: 56.6, gain: 0.4 },
    { atSec: 6.1, durSec: 1.2, note: 43, gain: 0.52 },
    { atSec: 6.1, durSec: 1.2, note: 50.02, gain: 0.42 },
    { atSec: 6.1, durSec: 1.2, note: 55, gain: 0.42 },
  ],
}

// The bass part alone: the drone, the step under it, and once the 160 cent step over it.
const BASS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.9, note: 43, gain: 0.6 },
    { atSec: 1.9, durSec: 1.2, note: 41, gain: 0.58 },
    { atSec: 3.1, durSec: 1, note: 43, gain: 0.6 },
    { atSec: 4.1, durSec: 0.6, note: 44.6, gain: 0.55 },
    { atSec: 4.7, durSec: 1.1, note: 41, gain: 0.58 },
    { atSec: 5.8, durSec: 1.5, note: 43, gain: 0.62 },
  ],
}

// One voice: from the fifth up to the seventh and down the whole scale to the first.
const SOLO: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 62.02, gain: 0.58 },
    { atSec: 1.3, durSec: 0.4, note: 63.55, gain: 0.54 },
    { atSec: 1.7, durSec: 0.9, note: 65, gain: 0.58 },
    { atSec: 2.6, durSec: 0.4, note: 63.55, gain: 0.54 },
    { atSec: 3, durSec: 1.2, note: 62.02, gain: 0.56 },
    { atSec: 4.2, durSec: 0.5, note: 59.98, gain: 0.54 },
    { atSec: 4.7, durSec: 0.8, note: 58.5, gain: 0.56 },
    { atSec: 5.5, durSec: 0.5, note: 56.6, gain: 0.54 },
    { atSec: 6, durSec: 1.3, note: 55, gain: 0.6 },
  ],
}

// One singer starts alone, the other two come in under him on 1-4-5, and they go home by the step below.
const CALL: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 62.02, gain: 0.52 },
    { atSec: 1.1, durSec: 0.4, note: 63.55, gain: 0.5 },
    { atSec: 1.5, durSec: 3.3, note: 62.02, gain: 0.46 },
    { atSec: 2, durSec: 2.8, note: 55, gain: 0.5 },
    { atSec: 2, durSec: 1.6, note: 59.98, gain: 0.42 },
    { atSec: 3.6, durSec: 1.2, note: 58.5, gain: 0.42 },
    { atSec: 4.8, durSec: 1.2, note: 53, gain: 0.5 },
    { atSec: 4.8, durSec: 1.2, note: 56.6, gain: 0.42 },
    { atSec: 4.8, durSec: 1.2, note: 59.98, gain: 0.42 },
    { atSec: 6, durSec: 1.3, note: 55, gain: 0.55 },
    { atSec: 6, durSec: 1.3, note: 62.02, gain: 0.42 },
  ],
}

// The three voices an octave up: 1-4-5, 1-4-6, 1-3-5, the step below, the fifth.
const HIGH: Phrase = {
  notes: [
    { atSec: 0, durSec: 4.6, note: 67, gain: 0.5 },
    { atSec: 0, durSec: 3, note: 71.98, gain: 0.4 },
    { atSec: 0, durSec: 2.4, note: 74.02, gain: 0.4 },
    { atSec: 2.4, durSec: 0.6, note: 75.55, gain: 0.4 },
    { atSec: 3, durSec: 1.6, note: 74.02, gain: 0.4 },
    { atSec: 3, durSec: 1.6, note: 70.5, gain: 0.4 },
    { atSec: 4.6, durSec: 1.3, note: 65, gain: 0.48 },
    { atSec: 4.6, durSec: 1.3, note: 68.6, gain: 0.4 },
    { atSec: 4.6, durSec: 1.3, note: 71.98, gain: 0.4 },
    { atSec: 5.9, durSec: 1.4, note: 67, gain: 0.52 },
    { atSec: 5.9, durSec: 1.4, note: 74.02, gain: 0.4 },
  ],
}

// Neutral triads moved whole, fifths and all: on 1, 2, 1, the seventh below, the sixth below, and back up to the fifth.
const PARALLEL: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 55, gain: 0.5 },
    { atSec: 0, durSec: 1.5, note: 58.5, gain: 0.42 },
    { atSec: 0, durSec: 1.5, note: 62.02, gain: 0.42 },
    { atSec: 1.5, durSec: 1, note: 56.6, gain: 0.5 },
    { atSec: 1.5, durSec: 1, note: 59.98, gain: 0.42 },
    { atSec: 1.5, durSec: 1, note: 63.55, gain: 0.42 },
    { atSec: 2.5, durSec: 0.9, note: 55, gain: 0.5 },
    { atSec: 2.5, durSec: 0.9, note: 58.5, gain: 0.42 },
    { atSec: 2.5, durSec: 0.9, note: 62.02, gain: 0.42 },
    { atSec: 3.4, durSec: 1.2, note: 53, gain: 0.5 },
    { atSec: 3.4, durSec: 1.2, note: 56.6, gain: 0.42 },
    { atSec: 3.4, durSec: 1.2, note: 59.98, gain: 0.42 },
    { atSec: 4.6, durSec: 0.8, note: 51.55, gain: 0.5 },
    { atSec: 4.6, durSec: 0.8, note: 55, gain: 0.42 },
    { atSec: 4.6, durSec: 0.8, note: 58.5, gain: 0.42 },
    { atSec: 5.4, durSec: 0.8, note: 53, gain: 0.5 },
    { atSec: 5.4, durSec: 0.8, note: 56.6, gain: 0.42 },
    { atSec: 5.4, durSec: 0.8, note: 59.98, gain: 0.42 },
    { atSec: 6.2, durSec: 1.1, note: 55, gain: 0.55 },
    { atSec: 6.2, durSec: 1.1, note: 62.02, gain: 0.42 },
  ],
}

// 1-5-9, two fifths stacked; the ninth falls to the octave and stays there while the bass steps down and back.
const NINTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.4, note: 55, gain: 0.5 },
    { atSec: 0, durSec: 3.4, note: 62.02, gain: 0.42 },
    { atSec: 0, durSec: 2.2, note: 69.04, gain: 0.42 },
    { atSec: 2.2, durSec: 5.1, note: 67, gain: 0.4 },
    { atSec: 3.4, durSec: 2.2, note: 53, gain: 0.5 },
    { atSec: 3.4, durSec: 2.2, note: 59.98, gain: 0.42 },
    { atSec: 5.6, durSec: 1.7, note: 55, gain: 0.52 },
    { atSec: 5.6, durSec: 1.7, note: 62.02, gain: 0.42 },
  ],
}

// A pedal of fifth and octave, with one voice that enters on the fourth and sinks through the neutral third into it.
const DRONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 43, gain: 0.5 },
    { atSec: 0.4, durSec: 6.9, note: 50.02, gain: 0.4 },
    { atSec: 0.9, durSec: 6.4, note: 55, gain: 0.38 },
    { atSec: 1.6, durSec: 2, note: 59.98, gain: 0.36 },
    { atSec: 3.6, durSec: 1.4, note: 58.5, gain: 0.36 },
    { atSec: 5, durSec: 0.8, note: 56.6, gain: 0.34 },
  ],
}

// Rolled chords in a slow three: 1-4-5, 1-3-5, the step below, and the fifth with its low octave.
const STRUM: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.25, note: 55, gain: 0.6 },
    { atSec: 0.03, durSec: 1.22, note: 59.98, gain: 0.5 },
    { atSec: 0.06, durSec: 1.19, note: 62.02, gain: 0.5 },
    { atSec: 1.3, durSec: 0.62, note: 55, gain: 0.5 },
    { atSec: 1.33, durSec: 0.59, note: 59.98, gain: 0.42 },
    { atSec: 1.36, durSec: 0.56, note: 62.02, gain: 0.42 },
    { atSec: 1.95, durSec: 1.25, note: 55, gain: 0.6 },
    { atSec: 1.98, durSec: 1.22, note: 58.5, gain: 0.5 },
    { atSec: 2.01, durSec: 1.19, note: 62.02, gain: 0.5 },
    { atSec: 3.25, durSec: 0.62, note: 55, gain: 0.5 },
    { atSec: 3.28, durSec: 0.59, note: 58.5, gain: 0.42 },
    { atSec: 3.31, durSec: 0.56, note: 62.02, gain: 0.42 },
    { atSec: 3.9, durSec: 1.25, note: 53, gain: 0.6 },
    { atSec: 3.93, durSec: 1.22, note: 56.6, gain: 0.5 },
    { atSec: 3.96, durSec: 1.19, note: 59.98, gain: 0.5 },
    { atSec: 5.2, durSec: 0.62, note: 53, gain: 0.5 },
    { atSec: 5.23, durSec: 0.59, note: 56.6, gain: 0.42 },
    { atSec: 5.26, durSec: 0.56, note: 59.98, gain: 0.42 },
    { atSec: 5.85, durSec: 1.45, note: 43, gain: 0.6 },
    { atSec: 5.89, durSec: 1.4, note: 55, gain: 0.5 },
    { atSec: 5.93, durSec: 1.36, note: 62.02, gain: 0.5 },
  ],
}

// Only the notes every tuning agrees on, G C and D: the fifth, the fourth struck beside it, C under the two G and C, the fifth again.
const BARE: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.2, note: 55, gain: 0.5 },
    { atSec: 0.2, durSec: 3.4, note: 62, gain: 0.44 },
    { atSec: 2, durSec: 3.2, note: 60, gain: 0.42 },
    { atSec: 3.6, durSec: 1.6, note: 48, gain: 0.5 },
    { atSec: 5.2, durSec: 2.1, note: 55, gain: 0.52 },
    { atSec: 5.2, durSec: 2.1, note: 62, gain: 0.42 },
  ],
}

// For slow sounds. 1-4-5 gathered a voice at a time and left standing; the fourth sinks to the neutral third, which leaves the bare fifth.
const HELD: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 55, gain: 0.5 },
    { atSec: 0.4, durSec: 6.9, note: 62.02, gain: 0.44 },
    { atSec: 0.8, durSec: 3.4, note: 59.98, gain: 0.44 },
    { atSec: 4.2, durSec: 1.9, note: 58.5, gain: 0.46 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Horns: five bores, from one player beside you to a section across the valley.
  {
    id: 'table-song-thirds-elder-at-the-table-head',
    name: 'Elder at the table head',
    category: 'wind',
    description: "One horn at arm's length with a short attack, held level by a fast limiter.",
    preview: SOLO,
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { volume: 0, blow: 0.38, breath: 0.3, attack: 0.12, release: 0.6, vibrato: 0.05 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Close mic' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'table-song-thirds-three-on-one-bench',
    name: 'Three on one bench',
    category: 'wind',
    description:
      'Flugelhorns nearly alone on each key, warmed in the lows and set in a one-second chamber.',
    preview: STACK,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { blow: 0.45, breath: 0.18, attack: 0.3, release: 0.8, vibrato: 0, section: 0.15 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.18 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'table-song-thirds-cups-raised-together',
    name: 'Cups raised together',
    category: 'wind',
    description:
      'A full trumpet section, more than half of it crushed in a pushed console, on a tight plate.',
    preview: PARALLEL,
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { blow: 0.55, attack: 0.3, release: 0.8 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Crushed', params: { mix: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'table-song-thirds-cup-against-the-lips',
    name: 'Cup against the lips',
    category: 'wind',
    description:
      'A breathy muted trumpet blown into a bottle, with a faint sway on the notes that last.',
    preview: SOLO,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { volume: 0, breath: 0.6, blow: 0.4, attack: 0.15, release: 0.7 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Blown bottle', params: { mix: 0.6, size: 1.4 } },
      { deviceId: 'late-vibrato', preset: 'Barely there' },
    ],
  },
  {
    id: 'table-song-thirds-bass-men-lean-in',
    name: 'Bass men lean in',
    category: 'wind',
    description:
      'A soft low brass choir with its lows lifted, in an ambience under half a second long.',
    preview: LOW,
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 0.4, release: 1.4, blow: 0.28 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 6 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'table-song-thirds-moved-whole-by-fifths',
    name: 'Moved whole by fifths',
    category: 'wind',
    description:
      'One flugelhorn with a full fifth above every note, doubled and sent to a narrow warm spring.',
    preview: SOLO,
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fifths',
      params: { type: 1, blow: 0.4, breath: 0.35, harmony: 1, attack: 0.2, release: 1 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Thickener' },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'table-song-thirds-fourth-under-the-toast',
    name: 'Fourth under the toast',
    category: 'wind',
    description: 'French horns with a fourth below every note, lightly saturated, in a small room.',
    preview: SOLO,
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fourths',
      params: { harmony: -1, attack: 0.2, release: 1.2, blow: 0.62 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 7 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'table-song-thirds-answer-off-the-cliff',
    name: 'Answer off the cliff',
    category: 'wind',
    description:
      'A loud horn heard from the back of a hall, one echo coming round after two seconds and again.',
    preview: CALL,
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { blow: 0.75, breath: 0.12, attack: 0.25, release: 1.5, section: 0.2 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Back of the hall' },
      { deviceId: 'constellation', preset: 'One far star', params: { span: 1900, mix: 0.3 } },
    ],
  },
  {
    id: 'table-song-thirds-breath-before-the-chord',
    name: 'Breath before the chord',
    category: 'wind',
    description:
      'A horn that is mostly air, its breath turned up and the starts of its notes blurred.',
    preview: STACK,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { blow: 0.12, attack: 0.5, release: 1.6 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Breath' },
      { deviceId: 'fog', preset: 'Morning mist' },
    ],
  },
  {
    id: 'table-song-thirds-snow-on-the-high-pass',
    name: 'Snow on the high pass',
    category: 'wind',
    description:
      'Horns that take well over a second to swell, dulled and hung in a thin eight-second space with no lows.',
    preview: HELD,
    instrument: {
      deviceId: 'horns',
      preset: 'Glacial horns',
      params: { attack: 1.4, release: 4, blow: 0.7 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.4, decay: 8 } },
    ],
  },
  {
    id: 'table-song-thirds-walnut-tree-shade',
    name: 'Walnut tree shade',
    category: 'wind',
    description: 'A flugelhorn choir under a steep low-pass at 520 hertz, in a small dull room.',
    preview: STEP,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel choir',
      params: { attack: 0.6, release: 1.6, blow: 0.3 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 520, resonance: 0.8 },
      },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'table-song-thirds-tin-horn-on-the-cart',
    name: 'Tin horn on the cart',
    category: 'wind',
    description: 'A few muted trumpets through a worn radio band and then a small loudspeaker.',
    preview: PARALLEL,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { attack: 0.15, release: 0.5, blow: 0.6, section: 0.3 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Kitchen radio' },
      { deviceId: 're-amp', preset: 'Bedside radio' },
    ],
  },
  {
    id: 'table-song-thirds-feast-under-the-floor',
    name: 'Feast under the floor',
    category: 'wind',
    description:
      'A trombone section played by a loudspeaker shut in a cupboard, with the top cut at 1200 hertz.',
    preview: LOW,
    instrument: {
      deviceId: 'horns',
      preset: 'Trombone',
      params: { attack: 0.15, release: 0.8, section: 0.7, vibrato: 0 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'In the cupboard' },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'table-song-thirds-uncle-with-a-wide-shake',
    name: 'Uncle with a wide shake',
    category: 'wind',
    description:
      'A trumpet with a broad vibrato, its lows and highs trading places five times a second, on a small plate.',
    preview: SOLO,
    instrument: {
      deviceId: 'horns',
      preset: 'Ballad trumpet',
      params: { volume: 4, blow: 0.5, attack: 0.08, vibrato: 0.9, release: 0.8 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 5, depth: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'table-song-thirds-giant-at-the-foot-end',
    name: 'Giant at the foot end',
    category: 'wind',
    description:
      'Trombones given the body of a giant at the same pitch, then lifted by a fast limiter.',
    preview: BASS,
    instrument: {
      deviceId: 'horns',
      preset: 'Trombone',
      params: { blow: 0.5, attack: 0.12, release: 1, vibrato: 0, section: 0.4 },
    },
    effects: [
      { deviceId: 'size', preset: 'Giant' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'table-song-thirds-every-cousin-at-once',
    name: 'Every cousin at once',
    category: 'wind',
    description: 'A full horn section multiplied into sixteen moving copies, in a hall.',
    preview: QUARTAL,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { attack: 0.45, release: 2, section: 1, blow: 0.5 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Thick ensemble' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'table-song-thirds-copper-on-the-stove',
    name: 'Copper on the stove',
    category: 'wind',
    description:
      'Loud trumpets with a short release, driven through a pentode into a spring that twangs and stops.',
    preview: STACK,
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { volume: -10, blow: 0.95, attack: 0.1, release: 0.4, section: 0.4 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite', params: { drive: 0.6 } },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'table-song-thirds-breath-of-the-old-bench',
    name: 'Breath of the old bench',
    category: 'wind',
    description: 'Soft airy horns that open and close in slow breaths, thickened by a chorus.',
    preview: CALL,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { volume: 0.5, attack: 0.28, release: 1.8, blow: 0.34, section: 1, breath: 0.4 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Calm breath', params: { in: 2, out: 2.6, depth: 0.5 } },
      { deviceId: 'chorus', preset: 'Vocal thickener' },
    ],
  },
  {
    id: 'table-song-thirds-reed-gate-at-evening',
    name: 'Reed gate at evening',
    category: 'wind',
    description:
      'Quiet muted trumpets pressed into the shape of a hollow tube, with a short soft tape echo.',
    preview: STEP,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { attack: 0.4, release: 1.2, blow: 0.2, section: 0.6 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 1.5 } },
      { deviceId: 'tape-echo', preset: 'Short and soft' },
    ],
  },
  {
    id: 'table-song-thirds-tuba-in-the-wine-jar',
    name: 'Tuba in the wine jar',
    category: 'wind',
    description: 'A breathy tuba inside a large clay pot, recorded to dull cassette.',
    preview: DRONE,
    instrument: {
      deviceId: 'horns',
      preset: 'Soft tuba',
      params: { blow: 0.1, breath: 0.5, attack: 0.6, release: 1.8 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { size: 2.4 } },
      { deviceId: 'tape', preset: 'Under a blanket' },
    ],
  },
  // Organ: reeds and small pipes.
  {
    id: 'table-song-thirds-table-of-free-reeds',
    name: 'Table of free reeds',
    category: 'organ',
    description:
      'Reeds nearly alone with a little octave above, set ringing in a wooden body and warmed by a tube curve.',
    preview: ORNAMENT,
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: {
        reed: 0.9,
        sub: 0,
        octave: 0.2,
        celeste: 0.1,
        fifteenth: 0,
        twelfth: 0,
        attack: 0.08,
        release: 0.3,
        bellows: 0.4,
        tone: 4200,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.6 } },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 8 } },
    ],
  },
  {
    id: 'table-song-thirds-flutes-beside-the-elbow',
    name: 'Flutes beside the elbow',
    category: 'organ',
    description: 'Breathy octave and two-octave flutes with the top opened wide, in a small room.',
    preview: HIGH,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { sub: 0.15, octave: 0.7, fifteenth: 0.35, breath: 0.5, tone: 7000 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide top' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'table-song-thirds-drone-sworn-on-bread',
    name: 'Drone sworn on bread',
    category: 'drone',
    description:
      'Wheezing reeds over a little sub rank, with a dark swarm of echoes, held level by a slow compressor.',
    preview: DRONE,
    instrument: {
      deviceId: 'organ',
      preset: 'Shruti box',
      params: { volume: -14.5, reed: 0.75, sub: 0.3, attack: 0.7, release: 1.5, tone: 1300 },
    },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.3 } },
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
    ],
  },
  {
    id: 'table-song-thirds-cellar-floor-pipe',
    name: 'Cellar floor pipe',
    category: 'bass',
    description: 'One deep pipe with some reed, its lows lifted and thickened by a transformer.',
    preview: BASS,
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: { sub: 1, reed: 0.3, twelfth: 0.12, attack: 0.15, release: 0.9, tone: 900 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 5 } },
      { deviceId: 'analog-drive', preset: 'Low warmth' },
    ],
  },
  {
    id: 'table-song-thirds-quint-and-no-third',
    name: 'Quint and no third',
    category: 'organ',
    description:
      'A plain flute rank with a strong twelfth and a little sub, slowly phased, with a late faint plate.',
    preview: BARE,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { volume: -5, sub: 0.3, twelfth: 0.9, breath: 0.5, attack: 0.15 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'table-song-thirds-squeezed-on-a-dare',
    name: 'Squeezed on a dare',
    category: 'organ',
    description:
      'Bright beating reeds that stop dead, through a clean bright loudspeaker, with a third of a second of halo.',
    preview: PARALLEL,
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: { celeste: 1, bellows: 0.6, tone: 9000, release: 0.08 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Clean and bright' },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'table-song-thirds-vineyard-chapel-door',
    name: 'Vineyard chapel door',
    category: 'organ',
    description:
      'Slow small pipes in a short chapel that sings a vowel, dulled as if from the door.',
    preview: HELD,
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { attack: 1, release: 3, tone: 2000 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'table-song-thirds-wind-finds-the-stops',
    name: 'Wind finds the stops',
    category: 'organ',
    description:
      'Pipes of air with a trace of octave, blown through a long open pipe in a light breeze.',
    preview: ORNAMENT,
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: { octave: 0.12, bellows: 0.8, attack: 0.3, release: 1.2 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wind in the pipe', params: { mix: 0.6, air: 0.6 } },
      { deviceId: 'weather', preset: 'Breezy day', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'table-song-thirds-two-lamps-not-in-tune',
    name: 'Two lamps not in tune',
    category: 'organ',
    description:
      'Beating flutes doubled twenty cents to either side, with a small tremolo of its own on every band.',
    preview: QUARTAL,
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { octave: 0.1, celeste: 1, sub: 0.15, attack: 0.3, release: 1.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled' },
      { deviceId: 'glimmer', preset: 'Light on water' },
    ],
  },
  {
    id: 'table-song-thirds-grandfather-pipes',
    name: 'Grandfather pipes',
    category: 'voice',
    description: 'A trembling reed rank made larger in the body and shaped to a round vowel.',
    preview: SOLO,
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { tremulant: 0.5, tone: 2200, attack: 0.1, release: 0.5 },
    },
    effects: [
      { deviceId: 'size', preset: 'Larger', params: { size: 0.6 } },
      { deviceId: 'imprint', preset: 'Round vowel' },
    ],
  },
  {
    id: 'table-song-thirds-behind-the-bread-oven',
    name: 'Behind the bread oven',
    category: 'organ',
    description:
      'A muffled reed and twelfth with no octave, faintly feeding back, sunk under water with no bubbles.',
    preview: LOW,
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: {
        attack: 0.5,
        release: 2,
        reed: 1,
        octave: 0,
        fifteenth: 0,
        twelfth: 0.6,
        celeste: 0,
        tone: 600,
      },
    },
    effects: [
      { deviceId: 'howl', preset: 'Faint sustain', params: { distance: 10.2 } },
      { deviceId: 'underwater', preset: 'Under', params: { bubbles: 0 } },
    ],
  },
  {
    id: 'table-song-thirds-every-stop-at-the-feast',
    name: 'Every stop at the feast',
    category: 'organ',
    description:
      'Full organ with the reeds out and little sub, pressed onto hot tape, on a bright plate.',
    preview: PARALLEL,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { sub: 0.2, reed: 0.75, release: 0.5, tone: 10000 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Hot glue' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'table-song-thirds-slow-light-on-the-must',
    name: 'Slow light on the must',
    category: 'organ',
    description:
      'Bright ranks that open over a second and a half, drifting side to side in bands, in a wide blooming reverb.',
    preview: HELD,
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: { volume: -19, attack: 1.5, release: 4 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide' },
      { deviceId: 'bloom-reverb', preset: 'Wide summer', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'table-song-thirds-lamp-oil-tremble',
    name: 'Lamp oil tremble',
    category: 'organ',
    description:
      'A flute rank with a deep tremulant, shadowed by sines an octave up and a faint tape echo.',
    preview: HIGH,
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { tremulant: 0.9, octave: 0.35, attack: 0.2, release: 1 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo' },
      { deviceId: 'tape-echo', preset: 'Faint trace' },
    ],
  },
  {
    id: 'table-song-thirds-leather-lungs',
    name: 'Leather lungs',
    category: 'organ',
    description: 'A leaking pump organ that pants in short breaths, on a worn cassette.',
    preview: CALL,
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { breath: 0.9, bellows: 1, attack: 0.35, release: 0.6, tone: 1700 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Short of breath', params: { depth: 0.35 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { mix: 0.7 } },
    ],
  },
  {
    id: 'table-song-thirds-turning-lantern-organ',
    name: 'Turning lantern organ',
    category: 'organ',
    description: 'Flue ranks with no reed through a slow turning horn and drum, and a triode.',
    preview: QUARTAL,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { volume: -14, reed: 0, fifteenth: 0.2, celeste: 0, sub: 0.25, tone: 3500 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'analog-drive', preset: 'Triode glow' },
    ],
  },
  {
    id: 'table-song-thirds-reeds-under-first-snow',
    name: 'Reeds under first snow',
    category: 'drone',
    description:
      'A beating celeste and reed whose spectrum is smeared and left hanging, thinned at both ends.',
    preview: HELD,
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { volume: -5.5, celeste: 0.9, reed: 0.4, attack: 1, release: 3, tone: 2600 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  // Bow: the same songs on one string, plucked, held and bowed.
  {
    id: 'table-song-thirds-bow-on-the-table-edge',
    name: 'Bow on the table edge',
    category: 'bass',
    description:
      'A straight cello bow with no vibrato, heard close and partly through a wooden box.',
    preview: BASS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 0.2, release: 0.5, pressure: 0.7, brightness: 0.3, vibrato: 0 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.5 } },
      { deviceId: 'distance', preset: 'Close mic' },
    ],
  },
  {
    id: 'table-song-thirds-spike-fiddle-opens',
    name: 'Spike fiddle opens',
    category: 'string',
    description:
      'A hard raspy bow with little body of its own, half inside a small tin drum, on a tight plate.',
    preview: SOLO,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: { attack: 0.08, release: 0.35, vibrato: 0.35, body: 0.15 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'table-song-thirds-lute-of-three-strings',
    name: 'Lute of three strings',
    category: 'plucked',
    description:
      'Plucked string on a big body with no detune, its middle brought forward, and a hint of spring.',
    preview: STRUM,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { brightness: 0.5, decay: 2.5, body: 0.9, release: 0.6, detune: 0 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'table-song-thirds-wire-under-the-vine',
    name: 'Wire under the vine',
    category: 'plucked',
    description:
      'Bright wire strings with clusters of echoes scattered behind them, the air made wide.',
    preview: STRUM,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { decay: 8, release: 3, detune: 8 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Tight clusters', params: { span: 1600, mix: 0.3 } },
      { deviceId: 'spread', preset: 'Air only' },
    ],
  },
  {
    id: 'table-song-thirds-thumb-laid-on-the-string',
    name: 'Thumb laid on the string',
    category: 'plucked',
    description:
      'Plucks stopped by the thumb, repeated by two tape heads and played through a warm stack.',
    preview: STRUM,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { brightness: 0.25, decay: 0.6, position: 0.2, release: 0.2 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.25 } },
      { deviceId: 're-amp', preset: 'Warm stack', params: { drive: 0.3 } },
    ],
  },
  {
    id: 'table-song-thirds-guest-with-a-light-bow',
    name: 'Guest with a light bow',
    category: 'string',
    description:
      'A flautando bow near the middle of the string, its air turned up, with a faint late plate.',
    preview: CALL,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.28, release: 1.5, brightness: 0.45 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Air' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'table-song-thirds-bows-from-six-houses',
    name: 'Bows from six houses',
    category: 'string',
    description:
      'Hard bright bows twenty-five cents apart, with two moving copies, through a small amplifier in a room.',
    preview: STEP,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: { attack: 0.25, release: 0.8, brightness: 0.8, pressure: 0.75, vibrato: 0.2 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by' },
      { deviceId: 're-amp', preset: 'Combo in a room' },
    ],
  },
  {
    id: 'table-song-thirds-glass-bow-over-bread',
    name: 'Glass bow over bread',
    category: 'string',
    description:
      'A thin bright bow near the bridge, with a faint octave above and a faint glowing reverb.',
    preview: HIGH,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.4, release: 3 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave' },
      { deviceId: 'bloom-reverb', preset: 'Faint glow' },
    ],
  },
  {
    id: 'table-song-thirds-string-fed-on-wine',
    name: 'String fed on wine',
    category: 'string',
    description:
      'A sustained string that feeds back onto overtones of G as it holds, kept even by a slow compressor.',
    preview: HELD,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Sustained swell',
      params: { attack: 0.5, release: 2.5, brightness: 0.6, vibrato: 0.05 },
    },
    effects: [
      { deviceId: 'howl', preset: 'Slow bloom', params: { mix: 0.35, distance: 10.2 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'table-song-thirds-rafters-answer-an-octave',
    name: 'Rafters answer an octave',
    category: 'string',
    description:
      'A string held mostly at its octave, its quiet ends raised at the sides, in a hall.',
    preview: NINTHS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 0.6, release: 3 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Opens outward' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'table-song-thirds-oath-on-a-still-fifth',
    name: 'Oath on a still fifth',
    category: 'drone',
    description:
      'A string with no brightness at all, nearly a sine, its three bands swelling on slow cycles.',
    preview: BARE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 0.6, release: 3 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Deep swell' },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },
  {
    id: 'table-song-thirds-twelfth-over-the-lintel',
    name: 'Twelfth over the lintel',
    category: 'string',
    description:
      'A bright string sustained near its middle, where the twelfth shows, swept by a slow notch, in a bright chamber.',
    preview: HIGH,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Twelfth glow',
      params: { attack: 0.4, release: 2 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Slow notch' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'table-song-thirds-quick-string-interrupts',
    name: 'Quick string interrupts',
    category: 'string',
    description:
      'A fast sustained string with vibrato, shuddering a little, answered by one short slap.',
    preview: SOLO,
    instrument: { deviceId: 'bowed-string', preset: 'Quick sustain', params: { brightness: 0.55 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback' },
      { deviceId: 'tremolo', preset: 'Fast shudder', params: { depth: 0.35, mix: 0.6 } },
    ],
  },
  {
    id: 'table-song-thirds-low-strings-quarrelling',
    name: 'Low strings quarrelling',
    category: 'string',
    description:
      'Low sustained strings beating twenty-two cents apart, warmed and driven into a transformer.',
    preview: LOW,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Slow beating swell',
      params: { volume: -11, attack: 0.35, release: 3, detune: 22 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'analog-drive', preset: 'Iron lows' },
    ],
  },
  {
    id: 'table-song-thirds-hand-closes-on-the-sound',
    name: 'Hand closes on the sound',
    category: 'string',
    description:
      'Plucks that fade in, with a reverb that rises backwards behind each one, caught by a limiter.',
    preview: STACK,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { volume: -3.5, attack: 0.5, release: 2 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'table-song-thirds-gut-pair-off-the-well',
    name: 'Gut pair off the well',
    category: 'plucked',
    description:
      'Gut-like plucks beating twenty-five cents apart inside a stone-hard cistern, their tails sagging in pitch.',
    preview: STRUM,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { decay: 10, release: 5, brightness: 0.4 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.5 } },
      { deviceId: 'melt', preset: 'Soft sag' },
    ],
  },
  {
    id: 'table-song-thirds-bow-across-a-copper-rim',
    name: 'Bow across a copper rim',
    category: 'drone',
    description:
      'A hard straight bow well away from the bridge, coloured like a bell, with one overtone of G held above it.',
    preview: DRONE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: {
        attack: 0.4,
        release: 2,
        pressure: 0.8,
        position: 0.35,
        brightness: 0.6,
        vibrato: 0,
        body: 0,
      },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Bright bell', params: { amount: 1 } },
      { deviceId: 'overtone-singer', preset: 'One held note', params: { root: 7, mix: 0.6 } },
    ],
  },
  // Choir: chests and throats, by vowel and by the weight of the bass.
  {
    id: 'table-song-thirds-chest-voices-close-by',
    name: 'Chest voices close by',
    category: 'voice',
    description:
      'Basses on an open ah with almost no vibrato, pressed through a triode and brought forward with no room.',
    preview: STACK,
    instrument: {
      deviceId: 'choir',
      preset: 'Basses ah',
      params: { voice: 0.86, motion: 0.05, breath: 0.1, vibrato: 3, attack: 0.15, release: 0.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.75 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'table-song-thirds-oh-turned-over-a-drone',
    name: 'Oh turned over a drone',
    category: 'voice',
    description:
      'Tenors on oh pressed rounder still, with a sway that comes late and a narrow warm spring.',
    preview: ORNAMENT,
    instrument: {
      deviceId: 'choir',
      preset: 'Tenors oh',
      params: { breath: 0.15, vibrato: 4, attack: 0.25, release: 0.7, voice: 0.95 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel', params: { amount: 0.8 } },
      { deviceId: 'late-vibrato', preset: 'Barely there' },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'table-song-thirds-eh-thrown-over-the-bread',
    name: 'Eh thrown over the bread',
    category: 'voice',
    description: 'A hard eh from a small section, half of it clipped, in a tight chamber.',
    preview: PARALLEL,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: { voice: 1.02, vibrato: 2, attack: 0.08, release: 0.35, ensemble: 0.4 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Hard clip master', params: { driveDb: 5, mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'table-song-thirds-cellar-monks-on-oo',
    name: 'Cellar monks on oo',
    category: 'voice',
    description: 'Dark low voices on oo inside a deep bottle-shaped well, with the lows raised.',
    preview: LOW,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { vowel: 1, voice: 0.82, attack: 0.5, release: 1.8, tone: 2000 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Deep well', params: { mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 4 } },
    ],
  },
  {
    id: 'table-song-thirds-hum-into-the-cup',
    name: 'Hum into the cup',
    category: 'voice',
    description: 'A few people humming into a small bottle of a cup, recorded hot on cassette.',
    preview: DRONE,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { attack: 0.4, release: 1.2, tone: 1100, ensemble: 0.3 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Thimble', params: { mix: 0.5, size: 0.6 } },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'table-song-thirds-he-begins-by-himself',
    name: 'He begins by himself',
    category: 'voice',
    description:
      'One chest voice with little vibrato, heard from across a room with a dark spring behind it.',
    preview: CALL,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { volume: -3.5, voice: 0.94, vibrato: 8, vowel: 0.12, attack: 0.06 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Across the room' },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'table-song-thirds-boys-on-the-balcony',
    name: 'Boys on the balcony',
    category: 'voice',
    description: 'Boys between oh and oo with an octave stop above them and steady clean repeats.',
    preview: HIGH,
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { vowel: 0.85, attack: 0.2, release: 1.2 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Nearly dry', params: { octave: 0.6, mix: 0.35 } },
      { deviceId: 'tape-echo', preset: 'Clean and steady', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'table-song-thirds-breath-between-toasts',
    name: 'Breath between toasts',
    category: 'voice',
    description:
      'Voices that are all breath, their quiet detail turned up and partly smeared to a whisper.',
    preview: NINTHS,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 0.5, release: 2, vowel: 0.6 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Breath' },
      { deviceId: 'spectral-blur', preset: 'Whisper', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'table-song-thirds-song-over-the-next-ridge',
    name: 'Song over the next ridge',
    category: 'voice',
    description: 'A dulled choir with a long fade, coming and going in the wind.',
    preview: STEP,
    instrument: {
      deviceId: 'choir',
      preset: 'Distant choir',
      params: { volume: -5, attack: 0.4, release: 4 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Breezy day', params: { exposure: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'table-song-thirds-shouted-in-a-low-room',
    name: 'Shouted in a low room',
    category: 'voice',
    description: 'Short breathy ahs that stop at once, with a gated room and a pentode edge.',
    preview: PARALLEL,
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: { voice: 0.95, attack: 0.04, release: 0.15 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.3 } },
      { deviceId: 'analog-drive', preset: 'Bite', params: { drive: 0.35 } },
    ],
  },
  {
    id: 'table-song-thirds-smoke-of-slow-vowels',
    name: 'Smoke of slow vowels',
    category: 'voice',
    description:
      'Voices that keep changing vowel, blurred into a warm haze and doubled twelve cents to either side.',
    preview: QUARTAL,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { volume: -5.5, attack: 0.5, release: 3, voice: 0.95 },
    },
    effects: [
      { deviceId: 'haze', preset: 'Slow bloom', params: { mix: 0.35 } },
      { deviceId: 'stereo-detune', preset: 'Piano haze' },
    ],
  },
  {
    id: 'table-song-thirds-ee-through-the-keyhole',
    name: 'Ee through the keyhole',
    category: 'voice',
    description: 'A bright still ee driven and squeezed into a narrow band, on a bright plate.',
    preview: HIGH,
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { volume: -3, attack: 0.4, release: 1.6, tone: 7000 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Phone line', params: { mix: 0.7 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'table-song-thirds-wine-makes-it-waver',
    name: 'Wine makes it waver',
    category: 'voice',
    description:
      'Few voices with a wide slow vibrato, wobbled in pitch again and worn like an old record.',
    preview: STEP,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow waver',
      params: { vibrato: 26, attack: 0.3, release: 1.4, voice: 0.96 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Pitch wobble', params: { depth: 0.2, mix: 0.6 } },
      { deviceId: 'patina', preset: 'Dusty record', params: { noise: 0.2 } },
    ],
  },
  {
    id: 'table-song-thirds-whisper-and-its-shadow',
    name: 'Whisper and its shadow',
    category: 'voice',
    description:
      'Breathy voices between eh and ee with a low octave under them, their starts softened.',
    preview: HIGH,
    instrument: {
      deviceId: 'choir',
      preset: 'Breathy ee',
      params: { volume: -7.5, attack: 0.4, release: 1.2, vowel: 0.35 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.9 } },
      { deviceId: 'fog', preset: 'Pad softener' },
    ],
  },
  {
    id: 'table-song-thirds-trebles-gone-to-chest',
    name: 'Trebles gone to chest',
    category: 'voice',
    description:
      'High voices brought down an octave with the body made small, and one faint follower behind.',
    preview: HIGH,
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: { volume: -4, attack: 0.3, release: 1.8 },
    },
    effects: [
      { deviceId: 'size', preset: 'Small and low' },
      { deviceId: 'canon', preset: 'Faint answer', params: { gap: 0.7 } },
    ],
  },
  // Chamber strings: the table as a consort.
  {
    id: 'table-song-thirds-three-viols-one-table',
    name: 'Three viols, one table',
    category: 'string',
    description: 'One straight viol on every note, in a wooden body and a tight chamber.',
    preview: STACK,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { players: 1, attack: 0.15, release: 0.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'table-song-thirds-felt-over-every-bridge',
    name: 'Felt over every bridge',
    category: 'string',
    description:
      'Fully muted players with no vibrato, half of them in a dark triode fuzz, recorded to dull cassette.',
    preview: QUARTAL,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 0.45, release: 1.8 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { mix: 0.5 } },
      { deviceId: 'tape', preset: 'Under a blanket' },
    ],
  },
  {
    id: 'table-song-thirds-bows-that-hardly-touch',
    name: 'Bows that hardly touch',
    category: 'string',
    description:
      'Bow hair and air more than tone, partly inside a whispering shell, with the quiet lifted.',
    preview: NINTHS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { volume: -4.5, attack: 0.5, air: 1, release: 1.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Whispering shell', params: { mix: 0.4 } },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'table-song-thirds-six-uncles-warm-room',
    name: 'Six uncles, warm room',
    category: 'string',
    description: 'Six warm players with a small vibrato, glued by soft saturation in a small room.',
    preview: STEP,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 0.4, vibrato: 6, release: 1 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'table-song-thirds-ragged-and-true',
    name: 'Ragged and true',
    category: 'string',
    description:
      'Players who scatter about the pitch, bowed hard, a little crushed and wide at the edges.',
    preview: PARALLEL,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { attack: 0.2, release: 0.8, bow: 0.7, mute: 0 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Crushed', params: { mix: 0.35 } },
      { deviceId: 'spread', preset: 'Hazy edges' },
    ],
  },
  {
    id: 'table-song-thirds-lone-bow-remembers',
    name: 'Lone bow remembers',
    category: 'string',
    description:
      'One unsteady bow with a late vibrato, its earlier phrases drifting back under it.',
    preview: SOLO,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wandering solo',
      params: { volume: -3, attack: 0.25, release: 1, scatter: 0.6 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Recalling', params: { mix: 0.3 } },
      { deviceId: 'late-vibrato', preset: 'Finger vibrato' },
    ],
  },
  {
    id: 'table-song-thirds-bridge-of-ice-at-morning',
    name: 'Bridge of ice at morning',
    category: 'string',
    description:
      'Bows hard on the bridge with no vibrato; what two chords share is held on, in a still room.',
    preview: HIGH,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { volume: -3, attack: 0.4, release: 2 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Long hold', params: { mix: 0.5 } },
      { deviceId: 'bloom-reverb', preset: 'Still room' },
    ],
  },
  {
    id: 'table-song-thirds-short-bows-long-oaths',
    name: 'Short bows, long oaths',
    category: 'string',
    description:
      'Short hard bows with a slow dark pad growing behind each chord and a quick spring.',
    preview: STRUM,
    instrument: { deviceId: 'chamber-strings', preset: 'Short bows', params: { release: 0.35 } },
    effects: [
      { deviceId: 'pad-follower', preset: 'Low section', params: { octaves: 0, mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'table-song-thirds-dark-bows-by-the-fire',
    name: 'Dark bows by the fire',
    category: 'string',
    description: 'Five dark players whose bands swell and fall like waves, with a warm low end.',
    preview: LOW,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Slow dark bows',
      params: { attack: 0.5, release: 1.5 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Breaking waves', params: { depth: 0.5 } },
      { deviceId: 'analog-drive', preset: 'Low warmth' },
    ],
  },
  {
    id: 'table-song-thirds-halo-over-nine-candles',
    name: 'Halo over nine candles',
    category: 'string',
    description:
      'Three still players with stops a fifth and a twelfth above each note, on a long plate.',
    preview: BARE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { volume: -1.5, attack: 0.5, release: 3 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Hollow fifths', params: { mix: 0.45 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  // Ember: the same three voices from oscillators.
  {
    id: 'table-song-thirds-saw-toothed-uncles',
    name: 'Saw-toothed uncles',
    category: 'pad',
    description:
      'Two nearly unison saws opening like brass, through a console circuit in a small room.',
    preview: PARALLEL,
    instrument: {
      deviceId: 'ember',
      preset: 'Brass',
      params: { cutoff: 1100, filterAttack: 0.15, ampAttack: 0.1, ampRelease: 0.5, osc2Fine: 3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console' },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'table-song-thirds-warm-bread-pad',
    name: 'Warm bread pad',
    category: 'pad',
    description: 'A dark saw pad with hardly any detune, warmed, with two moving copies close by.',
    preview: STEP,
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: { ampAttack: 0.4, ampRelease: 1.5, cutoff: 800, unisonDetune: 5, osc2Fine: 3 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'murmuration', preset: 'Two close by' },
    ],
  },
  {
    id: 'table-song-thirds-hollow-cup-of-fourths',
    name: 'Hollow cup of fourths',
    category: 'pad',
    description: 'Square and triangle at one pitch, shaped to a round vowel, in a small room.',
    preview: QUARTAL,
    instrument: {
      deviceId: 'ember',
      preset: 'Hollow Pad',
      params: { ampAttack: 0.3, unisonDetune: 3, osc2Coarse: 0, lfo2Amount: 0.1 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel' },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'table-song-thirds-drone-in-the-cold-hearth',
    name: 'Drone in the cold hearth',
    category: 'drone',
    description:
      'A dark drone with a trace of sub, slowly dissolving into a large dark room over the rumble of a record.',
    preview: DRONE,
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: {
        osc2Coarse: 0,
        osc2Fine: 3,
        subLevel: 0.2,
        unisonDetune: 3,
        ampAttack: 0.6,
        ampRelease: 2,
        cutoff: 420,
      },
    },
    effects: [
      { deviceId: 'generations', preset: 'Large dark room', params: { mix: 0.35 } },
      { deviceId: 'vinyl', preset: 'Surface and rumble', params: { crackle: 0.05, pops: 0 } },
    ],
  },
  {
    id: 'table-song-thirds-glass-on-every-plate',
    name: 'Glass on every plate',
    category: 'pad',
    description:
      'A clear triangle pad with a pulse an octave above, its bands flickering outwards, with a faint tape echo.',
    preview: HIGH,
    instrument: {
      deviceId: 'ember',
      preset: 'Glass pad',
      params: { ampAttack: 0.25, ampRelease: 2, unisonDetune: 5 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rings outward' },
      { deviceId: 'tape-echo', preset: 'Faint trace' },
    ],
  },
  // Dusk: a filter that can sing.
  {
    id: 'table-song-thirds-sung-by-a-filter',
    name: 'Sung by a filter',
    category: 'voice',
    description: 'A moving pulse with a resonant filter and no chorus, pressed into an open vowel.',
    preview: ORNAMENT,
    instrument: {
      deviceId: 'dusk',
      preset: 'Thin voices',
      params: { attack: 0.2, release: 1.2, chorus: 0, lowCut: 1 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Open vowel' },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'table-song-thirds-amber-in-three-cups',
    name: 'Amber in three cups',
    category: 'pad',
    description: 'Saw and pulse strings with the first chorus, on reel tape and a small plate.',
    preview: STACK,
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { attack: 0.3, release: 1, chorus: 1, cutoff: 1600 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'table-song-thirds-stopped-pipe-at-dawn',
    name: 'Stopped pipe at dawn',
    category: 'organ',
    description:
      'A stopped pipe made of square wave and resonance, breathing slowly a few steps away.',
    preview: HIGH,
    instrument: {
      deviceId: 'dusk',
      preset: 'Stopped pipe',
      params: { attack: 0.08, release: 0.8 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath' },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
  },
  {
    id: 'table-song-thirds-sub-under-the-benches',
    name: 'Sub under the benches',
    category: 'bass',
    description:
      'Square waves with a full sub octave, partly gritted and played through a dark woolly stack.',
    preview: LOW,
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { volume: -19, attack: 0.1, release: 0.8, cutoff: 600, chorus: 0 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit', params: { mix: 0.4 } },
      { deviceId: 're-amp', preset: 'Dark and woolly' },
    ],
  },
  {
    id: 'table-song-thirds-evening-opens-downward',
    name: 'Evening opens downward',
    category: 'pad',
    description:
      'Strings whose filter closes as they hold, with a dark swelling reverb and a cloud of detuned copies after it.',
    preview: NINTHS,
    instrument: {
      deviceId: 'dusk',
      preset: 'Dimming strings',
      params: { volume: -5, attack: 0.5, release: 3, cutoff: 4500 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Dark swell', params: { mix: 0.35 } },
      { deviceId: 'stereo-detune', preset: 'Cloud' },
    ],
  },
  // Thesis: noise tuned to fifths. Centred on a note of the chord, its mirror trades fourths for fifths.
  {
    id: 'table-song-thirds-fourth-mirrors-fifth',
    name: 'Fourth mirrors fifth',
    category: 'texture',
    description:
      'Tuned noise mirrored about G, so a fifth above sounds with a fifth below, in a small room.',
    preview: BARE,
    instrument: {
      deviceId: 'thesis',
      preset: 'Thesis Default',
      params: {
        center: 55,
        scale: 12,
        root: 7,
        octaflipEnabled: 0,
        attack: 0.3,
        release: 1,
        resonance: 70,
        mode: 0,
      },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level', params: { makeup: 6 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'table-song-thirds-breathing-over-the-fifth',
    name: 'Breathing over the fifth',
    category: 'texture',
    description: 'Breathing bands mirrored about the G above, with a short sung oo behind them.',
    preview: BARE,
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: {
        center: 67,
        scale: 12,
        root: 7,
        resonance: 40,
        breatheRate: 0.5,
        attack: 0.5,
        width: 90,
      },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Oo behind' },
      { deviceId: 'ambient-comp', preset: 'Level', params: { makeup: 6 } },
    ],
  },
  {
    id: 'table-song-thirds-octaves-of-steam',
    name: 'Octaves of steam',
    category: 'pad',
    description:
      'Narrow noise bands with no mirror, only each note and its octave, under a very slow phaser.',
    preview: BARE,
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { center: 62, scale: 12, root: 7, mirrorEnabled: 0, attack: 0.8, release: 2.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep' },
      { deviceId: 'ambient-comp', preset: 'Level', params: { makeup: 11 } },
    ],
  },
  {
    id: 'table-song-thirds-pulled-home-to-the-fifth',
    name: 'Pulled home to the fifth',
    category: 'texture',
    description:
      'Bands pulled at once a fifth above each key and its reflection, then caught and held a while.',
    preview: BARE,
    instrument: {
      deviceId: 'thesis',
      preset: 'Gravity Well',
      params: {
        center: 55,
        scale: 12,
        root: 7,
        middleEnabled: 0,
        strum: 20,
        resonance: 50,
        release: 2,
      },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Quick catch' },
      { deviceId: 'ambient-comp', preset: 'Level', params: { makeup: 1 } },
    ],
  },
  {
    id: 'table-song-thirds-wind-in-three-reeds',
    name: 'Wind in three reeds',
    category: 'wind',
    description:
      'Plain whistling bands, one for each key and rounded to the nearest semitone, in a long open pipe.',
    preview: BARE,
    instrument: {
      deviceId: 'thesis',
      preset: 'Chromatic whistle',
      params: { resonance: 25, attack: 0.25, release: 1, width: 30 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wind in the pipe', params: { mix: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Level', params: { makeup: 2 } },
    ],
  },
  // Staircase: a drone that climbs and stays.
  {
    id: 'table-song-thirds-stairs-in-a-stone-tower',
    name: 'Stairs in a stone tower',
    category: 'drone',
    description: 'Stacked octaves standing still with some odd overtones, warmed, in a small room.',
    preview: DRONE,
    instrument: {
      deviceId: 'staircase',
      preset: 'Still organ',
      params: { attack: 0.2, release: 1.5, span: 4, centre: 300, shape: 0.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'table-song-thirds-song-that-keeps-sinking',
    name: 'Song that keeps sinking',
    category: 'pad',
    description:
      'Octave stacks that walk slowly down the held chord without arriving, half through a slow rotor.',
    preview: STEP,
    instrument: {
      deviceId: 'staircase',
      preset: 'Chord descent',
      params: { speed: -0.5, attack: 0.4, release: 2, span: 5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'table-song-thirds-climbing-to-the-watchman',
    name: 'Climbing to the watchman',
    category: 'pad',
    description:
      'Octave stacks that slide up from note to note of the chord, over drifting tape and long springs.',
    preview: HELD,
    instrument: {
      deviceId: 'staircase',
      preset: 'Sliding chord',
      params: { volume: -13.5, speed: 0.45, attack: 0.5, release: 3 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Long three spring' },
      { deviceId: 'tape', preset: 'Drifting chorus' },
    ],
  },
  // Flock: voices that find the note.
  {
    id: 'table-song-thirds-voices-find-each-other',
    name: 'Voices find each other',
    category: 'voice',
    description:
      'Three reedy voices on each key that glide in from around the note, shaped to an open vowel.',
    preview: CALL,
    instrument: {
      deviceId: 'flock',
      preset: 'Reed choir',
      params: { birds: 3, gather: 0.3, stray: 0.06, octaves: 0, leave: 0.8 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Open vowel' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'table-song-thirds-low-murmur-at-the-gate',
    name: 'Low murmur at the gate',
    category: 'pad',
    description: 'Seven dark voices that settle from below, with a low humming reverb.',
    preview: LOW,
    instrument: {
      deviceId: 'flock',
      preset: 'Low murmur',
      params: { gather: 0.45, stray: 0.12, leave: 2, octaves: 0 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Humming', params: { mix: 0.3, decay: 4 } },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'table-song-thirds-swallows-under-the-eaves',
    name: 'Swallows under the eaves',
    category: 'pad',
    description:
      'Six clear voices, some an octave up, that come down onto the note, with faint scattered echoes and a light widening.',
    preview: HIGH,
    instrument: {
      deviceId: 'flock',
      preset: 'Clean unison',
      params: { birds: 6, tone: 0.05, gather: 0.35, from: 1, octaves: 0.3, leave: 2 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Faint points' },
      { deviceId: 'chorus', preset: 'Subtle widener' },
    ],
  },
]
