import { type FactoryPreset, type Phrase } from '../types'

// A bass that steps down a fourth and begins again: A G F E, and by half steps A G# G F# F E,
// with a chord, a suspension or one high line laid over each step. Bass voices carry the
// ground, strings and organ the chords, and the struck and drawn sounds the lines between.

// Am, E/G#, C/G, D/F#, Dm/F, E: the chromatic ground, the fourth chord and the fifth told apart
// only by their bass.
const SIX_STEPS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.067, note: 45, gain: 0.55 },
    { atSec: 0, durSec: 1.067, note: 60, gain: 0.36 },
    { atSec: 0, durSec: 1.067, note: 64, gain: 0.36 },
    { atSec: 0, durSec: 1.067, note: 76, gain: 0.36 },
    { atSec: 1.1, durSec: 1.067, note: 44, gain: 0.55 },
    { atSec: 1.1, durSec: 1.067, note: 59, gain: 0.36 },
    { atSec: 1.1, durSec: 1.067, note: 64, gain: 0.36 },
    { atSec: 1.1, durSec: 1.067, note: 76, gain: 0.36 },
    { atSec: 2.2, durSec: 1.067, note: 43, gain: 0.55 },
    { atSec: 2.2, durSec: 1.067, note: 60, gain: 0.36 },
    { atSec: 2.2, durSec: 1.067, note: 67, gain: 0.36 },
    { atSec: 2.2, durSec: 1.067, note: 76, gain: 0.36 },
    { atSec: 3.3, durSec: 1.067, note: 42, gain: 0.55 },
    { atSec: 3.3, durSec: 1.067, note: 57, gain: 0.36 },
    { atSec: 3.3, durSec: 1.067, note: 69, gain: 0.36 },
    { atSec: 3.3, durSec: 1.067, note: 74, gain: 0.36 },
    { atSec: 4.4, durSec: 1.067, note: 41, gain: 0.55 },
    { atSec: 4.4, durSec: 1.067, note: 57, gain: 0.36 },
    { atSec: 4.4, durSec: 1.067, note: 69, gain: 0.36 },
    { atSec: 4.4, durSec: 1.067, note: 74, gain: 0.36 },
    { atSec: 5.5, durSec: 1.067, note: 40, gain: 0.55 },
    { atSec: 5.5, durSec: 1.067, note: 59, gain: 0.36 },
    { atSec: 5.5, durSec: 1.067, note: 68, gain: 0.36 },
    { atSec: 5.5, durSec: 1.067, note: 76, gain: 0.36 },
  ],
}

// The same six steps, the top line climbing A B C D D E against the bass.
const RISING_AGAINST: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.067, note: 45, gain: 0.52 },
    { atSec: 0, durSec: 1.067, note: 60, gain: 0.36 },
    { atSec: 0, durSec: 1.067, note: 64, gain: 0.36 },
    { atSec: 0, durSec: 1.067, note: 69, gain: 0.45 },
    { atSec: 1.1, durSec: 1.067, note: 44, gain: 0.52 },
    { atSec: 1.1, durSec: 1.067, note: 59, gain: 0.36 },
    { atSec: 1.1, durSec: 1.067, note: 64, gain: 0.36 },
    { atSec: 1.1, durSec: 1.067, note: 71, gain: 0.45 },
    { atSec: 2.2, durSec: 1.067, note: 43, gain: 0.52 },
    { atSec: 2.2, durSec: 1.067, note: 64, gain: 0.36 },
    { atSec: 2.2, durSec: 1.067, note: 67, gain: 0.36 },
    { atSec: 2.2, durSec: 1.067, note: 72, gain: 0.45 },
    { atSec: 3.3, durSec: 1.067, note: 42, gain: 0.52 },
    { atSec: 3.3, durSec: 1.067, note: 62, gain: 0.36 },
    { atSec: 3.3, durSec: 1.067, note: 69, gain: 0.36 },
    { atSec: 3.3, durSec: 1.067, note: 74, gain: 0.45 },
    { atSec: 4.4, durSec: 1.067, note: 41, gain: 0.52 },
    { atSec: 4.4, durSec: 1.067, note: 62, gain: 0.36 },
    { atSec: 4.4, durSec: 1.067, note: 69, gain: 0.36 },
    { atSec: 4.4, durSec: 1.067, note: 74, gain: 0.45 },
    { atSec: 5.5, durSec: 1.067, note: 40, gain: 0.52 },
    { atSec: 5.5, durSec: 1.067, note: 59, gain: 0.36 },
    { atSec: 5.5, durSec: 1.067, note: 68, gain: 0.36 },
    { atSec: 5.5, durSec: 1.067, note: 76, gain: 0.45 },
  ],
}

// Am, C/G, F, E: the diatonic ground, one slow chord to a step.
const FOUR_BARS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 45, gain: 0.55 },
    { atSec: 0, durSec: 1.6, note: 57, gain: 0.4 },
    { atSec: 0, durSec: 1.6, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 1.6, note: 72, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 43, gain: 0.55 },
    { atSec: 1.6, durSec: 1.6, note: 60, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 64, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 72, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 41, gain: 0.55 },
    { atSec: 3.2, durSec: 1.6, note: 57, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 69, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 72, gain: 0.4 },
    { atSec: 4.8, durSec: 1.6, note: 40, gain: 0.55 },
    { atSec: 4.8, durSec: 1.6, note: 59, gain: 0.4 },
    { atSec: 4.8, durSec: 1.6, note: 68, gain: 0.4 },
    { atSec: 4.8, durSec: 1.6, note: 76, gain: 0.4 },
  ],
}

// The diatonic ground with a seventh held over F that falls to the sixth, and a fourth over E
// that falls to the third.
const SUSPENSIONS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.56, note: 45, gain: 0.55 },
    { atSec: 0, durSec: 1.56, note: 60, gain: 0.36 },
    { atSec: 0, durSec: 1.56, note: 64, gain: 0.34 },
    { atSec: 0, durSec: 3.85, note: 76, gain: 0.45 },
    { atSec: 1.56, durSec: 1.56, note: 43, gain: 0.55 },
    { atSec: 1.56, durSec: 1.56, note: 60, gain: 0.34 },
    { atSec: 1.56, durSec: 1.56, note: 67, gain: 0.36 },
    { atSec: 3.12, durSec: 1.56, note: 41, gain: 0.55 },
    { atSec: 3.12, durSec: 1.56, note: 57, gain: 0.36 },
    { atSec: 3.12, durSec: 2.34, note: 69, gain: 0.4 },
    { atSec: 3.9, durSec: 0.78, note: 74, gain: 0.42 },
    { atSec: 4.68, durSec: 1.56, note: 40, gain: 0.55 },
    { atSec: 4.68, durSec: 1.56, note: 59, gain: 0.36 },
    { atSec: 4.68, durSec: 1.56, note: 76, gain: 0.42 },
    { atSec: 5.46, durSec: 0.78, note: 68, gain: 0.4 },
  ],
}

// C, G/B, Am, G: the descending fourth in major.
const MAJOR_GROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 48, gain: 0.52 },
    { atSec: 0, durSec: 1.6, note: 55, gain: 0.38 },
    { atSec: 0, durSec: 1.6, note: 67, gain: 0.38 },
    { atSec: 0, durSec: 1.6, note: 76, gain: 0.38 },
    { atSec: 1.65, durSec: 1.6, note: 47, gain: 0.52 },
    { atSec: 1.65, durSec: 1.6, note: 55, gain: 0.38 },
    { atSec: 1.65, durSec: 1.6, note: 67, gain: 0.38 },
    { atSec: 1.65, durSec: 1.6, note: 74, gain: 0.38 },
    { atSec: 3.3, durSec: 1.6, note: 45, gain: 0.52 },
    { atSec: 3.3, durSec: 1.6, note: 57, gain: 0.38 },
    { atSec: 3.3, durSec: 1.6, note: 64, gain: 0.38 },
    { atSec: 3.3, durSec: 1.6, note: 72, gain: 0.38 },
    { atSec: 4.95, durSec: 1.6, note: 43, gain: 0.52 },
    { atSec: 4.95, durSec: 1.6, note: 59, gain: 0.38 },
    { atSec: 4.95, durSec: 1.6, note: 67, gain: 0.38 },
    { atSec: 4.95, durSec: 1.6, note: 74, gain: 0.38 },
  ],
}

// Two voices in tenths, the upper one a half bar late at every step, so that fourths fall to
// thirds.
const LATE_TENTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 45, gain: 0.55 },
    { atSec: 0, durSec: 2.4, note: 60, gain: 0.48 },
    { atSec: 1.6, durSec: 1.6, note: 43, gain: 0.55 },
    { atSec: 2.4, durSec: 1.6, note: 59, gain: 0.46 },
    { atSec: 3.2, durSec: 1.6, note: 41, gain: 0.55 },
    { atSec: 4, durSec: 1.6, note: 57, gain: 0.46 },
    { atSec: 4.8, durSec: 1.8, note: 40, gain: 0.55 },
    { atSec: 5.6, durSec: 1, note: 56, gain: 0.44 },
  ],
}

// The chromatic ground alone: A G# G F# F E.
const BASS_STEPS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.04, note: 45, gain: 0.62 },
    { atSec: 1.1, durSec: 1.04, note: 44, gain: 0.6 },
    { atSec: 2.2, durSec: 1.04, note: 43, gain: 0.58 },
    { atSec: 3.3, durSec: 1.04, note: 42, gain: 0.56 },
    { atSec: 4.4, durSec: 1.04, note: 41, gain: 0.54 },
    { atSec: 5.5, durSec: 1.04, note: 40, gain: 0.52 },
  ],
}

// The diatonic ground in three, short then long: each step falls an octave on its second beat.
const SARABANDE_BASS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.522, note: 45, gain: 0.5 },
    { atSec: 0.55, durSec: 1.045, note: 33, gain: 0.62 },
    { atSec: 1.65, durSec: 0.522, note: 43, gain: 0.5 },
    { atSec: 2.2, durSec: 1.045, note: 31, gain: 0.62 },
    { atSec: 3.3, durSec: 0.522, note: 41, gain: 0.5 },
    { atSec: 3.85, durSec: 1.045, note: 29, gain: 0.62 },
    { atSec: 4.95, durSec: 0.522, note: 40, gain: 0.5 },
    { atSec: 5.5, durSec: 1.045, note: 28, gain: 0.62 },
  ],
}

// The ground broken into threes: A C E, G C E, F A D, E G# B.
const DIVISIONS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.47, note: 45, gain: 0.6 },
    { atSec: 0.5, durSec: 0.47, note: 48, gain: 0.46 },
    { atSec: 1, durSec: 0.47, note: 52, gain: 0.46 },
    { atSec: 1.5, durSec: 0.47, note: 43, gain: 0.6 },
    { atSec: 2, durSec: 0.47, note: 48, gain: 0.46 },
    { atSec: 2.5, durSec: 0.47, note: 52, gain: 0.46 },
    { atSec: 3, durSec: 0.47, note: 41, gain: 0.6 },
    { atSec: 3.5, durSec: 0.47, note: 45, gain: 0.46 },
    { atSec: 4, durSec: 0.47, note: 50, gain: 0.46 },
    { atSec: 4.5, durSec: 0.47, note: 40, gain: 0.6 },
    { atSec: 5, durSec: 0.47, note: 44, gain: 0.46 },
    { atSec: 5.5, durSec: 0.47, note: 47, gain: 0.46 },
  ],
}

// The tetrachord in the tenor between a low A and a held E.
const OVER_A_PEDAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.568, note: 57, gain: 0.48 },
    { atSec: 0, durSec: 6.4, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 6.4, note: 64, gain: 0.34 },
    { atSec: 1.6, durSec: 1.568, note: 55, gain: 0.48 },
    { atSec: 3.2, durSec: 1.568, note: 53, gain: 0.48 },
    { atSec: 4.8, durSec: 1.568, note: 52, gain: 0.48 },
  ],
}

// Contrary: the chromatic fourth in the top line, A5 down to E5, while the bass climbs A B C D D
// E.
const EXCHANGE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.067, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 1.067, note: 64, gain: 0.32 },
    { atSec: 0, durSec: 1.067, note: 72, gain: 0.32 },
    { atSec: 0, durSec: 1.067, note: 81, gain: 0.44 },
    { atSec: 1.1, durSec: 1.067, note: 47, gain: 0.5 },
    { atSec: 1.1, durSec: 1.067, note: 64, gain: 0.32 },
    { atSec: 1.1, durSec: 1.067, note: 76, gain: 0.32 },
    { atSec: 1.1, durSec: 1.067, note: 80, gain: 0.44 },
    { atSec: 2.2, durSec: 1.067, note: 48, gain: 0.5 },
    { atSec: 2.2, durSec: 1.067, note: 64, gain: 0.32 },
    { atSec: 2.2, durSec: 1.067, note: 76, gain: 0.32 },
    { atSec: 2.2, durSec: 1.067, note: 79, gain: 0.44 },
    { atSec: 3.3, durSec: 1.067, note: 50, gain: 0.5 },
    { atSec: 3.3, durSec: 1.067, note: 69, gain: 0.32 },
    { atSec: 3.3, durSec: 1.067, note: 74, gain: 0.32 },
    { atSec: 3.3, durSec: 1.067, note: 78, gain: 0.44 },
    { atSec: 4.4, durSec: 1.067, note: 50, gain: 0.5 },
    { atSec: 4.4, durSec: 1.067, note: 69, gain: 0.32 },
    { atSec: 4.4, durSec: 1.067, note: 74, gain: 0.32 },
    { atSec: 4.4, durSec: 1.067, note: 77, gain: 0.44 },
    { atSec: 5.5, durSec: 1.067, note: 52, gain: 0.5 },
    { atSec: 5.5, durSec: 1.067, note: 68, gain: 0.32 },
    { atSec: 5.5, durSec: 1.067, note: 71, gain: 0.32 },
    { atSec: 5.5, durSec: 1.067, note: 76, gain: 0.44 },
  ],
}

// The ground in the bass and one line high over it, tied across into the third bar.
const HIGH_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.65, note: 45, gain: 0.55 },
    { atSec: 0.55, durSec: 0.52, note: 72, gain: 0.4 },
    { atSec: 1.1, durSec: 0.54, note: 74, gain: 0.42 },
    { atSec: 1.65, durSec: 1.65, note: 43, gain: 0.55 },
    { atSec: 1.65, durSec: 2.45, note: 76, gain: 0.5 },
    { atSec: 3.3, durSec: 1.65, note: 41, gain: 0.55 },
    { atSec: 4.1, durSec: 0.85, note: 74, gain: 0.44 },
    { atSec: 4.95, durSec: 0.85, note: 72, gain: 0.44 },
    { atSec: 4.95, durSec: 1.75, note: 40, gain: 0.55 },
    { atSec: 5.8, durSec: 0.9, note: 71, gain: 0.4 },
  ],
}

// The ground twice: alone, then under two voices, the upper in tenths with the bass.
const TWICE_ROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.768, note: 45, gain: 0.55 },
    { atSec: 0.8, durSec: 0.768, note: 43, gain: 0.55 },
    { atSec: 1.6, durSec: 0.768, note: 41, gain: 0.55 },
    { atSec: 2.4, durSec: 0.768, note: 40, gain: 0.55 },
    { atSec: 3.2, durSec: 0.768, note: 45, gain: 0.55 },
    { atSec: 3.2, durSec: 0.768, note: 72, gain: 0.45 },
    { atSec: 3.2, durSec: 1.176, note: 64, gain: 0.42 },
    { atSec: 4, durSec: 0.768, note: 43, gain: 0.55 },
    { atSec: 4, durSec: 0.768, note: 71, gain: 0.45 },
    { atSec: 4.4, durSec: 1.16, note: 62, gain: 0.4 },
    { atSec: 4.8, durSec: 0.768, note: 41, gain: 0.55 },
    { atSec: 4.8, durSec: 0.768, note: 69, gain: 0.45 },
    { atSec: 5.6, durSec: 0.768, note: 40, gain: 0.55 },
    { atSec: 5.6, durSec: 0.768, note: 59, gain: 0.42 },
    { atSec: 5.6, durSec: 0.8, note: 68, gain: 0.45 },
  ],
}

// One E held while the chromatic bass opens under it, from a fifth to an octave.
const E_HELD: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.08, note: 45, gain: 0.56 },
    { atSec: 0, durSec: 6.7, note: 52, gain: 0.48 },
    { atSec: 1.1, durSec: 1.08, note: 44, gain: 0.56 },
    { atSec: 2.2, durSec: 1.08, note: 43, gain: 0.56 },
    { atSec: 3.3, durSec: 1.08, note: 42, gain: 0.56 },
    { atSec: 4.4, durSec: 1.08, note: 41, gain: 0.56 },
    { atSec: 5.5, durSec: 1.2, note: 40, gain: 0.56 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'lament-grounds-bearers-in-step',
    name: 'Bearers in step',
    category: 'bass',
    description:
      'An upright plucked softly, with a dark room behind it that comes back in waves, a bar long, after each step.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { volume: 4.5, touch: 0.12, tone: 0.5, sustain: 5, release: 0.5, growl: 0 },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        params: { shape: 4, time: 1.65, density: 0.9, colour: -0.5, lowCut: 70, mix: 0.5 },
      },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
    preview: SARABANDE_BASS,
  },
  {
    id: 'lament-grounds-gut-on-cold-flagstones',
    name: 'Gut on cold flagstones',
    category: 'bass',
    description: 'A dark soft upright broken into threes, with a short dark plate close behind it.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark soft upright',
      params: { tone: 0.28, mute: 0, sustain: 6, release: 0.5, volume: 2.5 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { decay: 0.6, mix: 0.35 } },
    ],
    preview: DIVISIONS,
  },
  {
    id: 'lament-grounds-under-the-chancel-stair',
    name: 'Under the chancel stair',
    category: 'bass',
    description:
      'A long ringing upright heard from across the room, dulled by the air and narrowed as it backs away.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Long wooden ring',
      params: { touch: 0.4, tone: 0.6, release: 0.8, volume: 2.5 },
    },
    effects: [
      {
        deviceId: 'distance',
        preset: 'Across the room',
        params: { distance: 0.62, room: 0.7, wander: 0.1, decay: 1.8 },
      },
      { deviceId: 'ambient-eq', params: { body: -2, low: 2 } },
    ],
    preview: BASS_STEPS,
  },
  {
    id: 'lament-grounds-black-ribbon-fretless',
    name: 'Black ribbon fretless',
    category: 'bass',
    description:
      'A dark fretless plucked near mid-string whose held notes begin to sway late, wrapped in a warm woollen fuzz.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { tone: 0.3, position: 0.45, release: 0.6, sustain: 10, volume: 0.5 },
    },
    effects: [
      { deviceId: 'late-vibrato', params: { wait: 250, grow: 500, depth: 38, rate: 4.6 } },
      { deviceId: 'haze', preset: 'Wool blanket', params: { decay: 2.5, mix: 0.5 } },
    ],
    preview: BASS_STEPS,
  },
  {
    id: 'lament-grounds-tallow-light-fretless',
    name: 'Tallow light fretless',
    category: 'bass',
    description:
      'A fretless plucked near the middle of the string, through a slow low filter and a slow, drum-heavy rotary cabinet.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Quiet deep fretless',
      params: { touch: 0.1, tone: 0.5, growl: 0.8, release: 0.7, position: 0.46 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 420,
          resonance: 2.2,
          lfoAmount: 30,
          lfoRateHz: 0.15,
        },
      },
      { deviceId: 'rotary', preset: 'Dark drum', params: { mix: 0.8 } },
    ],
    preview: SARABANDE_BASS,
  },
  {
    id: 'lament-grounds-growl-at-the-lychgate',
    name: 'Growl at the lychgate',
    category: 'bass',
    description:
      'A hard growling fretless bent by tube drive, with a loose spring tank dripping after each note.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Growling fretless',
      params: { touch: 0.75, release: 0.3 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 11, outputDb: -4 } },
      { deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.32 } },
    ],
    preview: DIVISIONS,
  },
  {
    id: 'lament-grounds-muffled-field-drum',
    name: 'Muffled field drum',
    category: 'bass',
    description:
      'Muted strings played into a drum head, so each step is a low thud with a pitch inside it, held by two limiters.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted thud',
      params: { mute: 0.6, touch: 0.15, position: 0.4, release: 0.6, sustain: 9, volume: 1.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { size: 1.2, material: 0.6, mix: 0.85 } },
      { deviceId: 'fet-limiter', preset: 'Squash' },
      { deviceId: 'ambient-limiter', params: { ceiling: -11, gain: 6 } },
    ],
    preview: BASS_STEPS,
  },
  {
    id: 'lament-grounds-plectrum-on-the-bier',
    name: 'Plectrum on the bier',
    category: 'bass',
    description:
      'A bright pick with bucket echoes a third of a bar apart, each repeat darker than the one before it.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Bright pick',
      params: { tone: 0.75, sustain: 3, volume: 2 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 550, feedback: 0.5, tone: 1600, mix: 0.4 },
      },
    ],
    preview: SARABANDE_BASS,
  },
  {
    id: 'lament-grounds-wire-below-the-crypt',
    name: 'Wire below the crypt',
    category: 'bass',
    description:
      'Strings plucked hard at the bridge into a dark swarm of echoes that bend as the cave around them stretches.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Near the bridge',
      params: { touch: 0.8, tone: 0.95, resonance: 0.4, sustain: 6, volume: 3.5 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        preset: 'Dark well',
        params: { feedback: 0.55, wander: 0.2, mix: 0.4 },
      },
      { deviceId: 'ambient-eq', params: { low: -4, presence: 2 } },
    ],
    preview: DIVISIONS,
  },
  {
    id: 'lament-grounds-thumb-and-its-ghost',
    name: 'Thumb and its ghost',
    category: 'bass',
    description:
      'A thumbed bass with the octave above and a trace of the next swelling in behind it, its level breathing slowly.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Thumb at the neck',
      params: { sustain: 14, release: 0.6 },
    },
    effects: [
      {
        deviceId: 'octaves',
        params: { sub1: 0, up1: 0.75, up2: 0.25, attack: 0.5, filter: 1800, spread: 0.8 },
      },
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { mix: 0.6 } },
    ],
    preview: BASS_STEPS,
  },
  {
    id: 'lament-grounds-answered-at-the-fifth',
    name: 'Answered at the fifth',
    category: 'bass',
    description:
      'A ringing bass followed two steps later by itself a fifth above, the second voice of a canon, on warm tape.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { touch: 0.35, tone: 0.65, release: 0.8 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 1,
          gap: 2.2,
          interval1: 7,
          fade: 0.1,
          tone: 2600,
          spread: 0.9,
          mix: 0.55,
        },
      },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
    preview: BASS_STEPS,
  },
  {
    id: 'lament-grounds-bow-borrowed-for-a-bass',
    name: 'Bow borrowed for a bass',
    category: 'bass',
    description:
      'A plucked bass with its pluck taken off by a slow swell and blurred in a fog, so that no finger is heard.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { touch: 0.5, tone: 0.8, growl: 0.5, release: 0.6, volume: -1.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 450, retrigger: 0 } },
      { deviceId: 'fog', preset: 'Slow rise', params: { size: 260, mix: 0.7 } },
    ],
    preview: BASS_STEPS,
  },
  {
    id: 'lament-grounds-strings-stirred-in-a',
    name: 'Strings stirred in A',
    category: 'bass',
    description:
      'A fretless bass with a bank of strings tuned to A minor ringing after it in sympathy.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { touch: 0.6, position: 0.1, tone: 0.8, sustain: 2, growl: 0.3, volume: 2.5 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { root: 9, mode: 1, sympathy: 0.7, decay: 5, mix: 0.6 },
      },
    ],
    preview: DIVISIONS,
  },
  {
    id: 'lament-grounds-harbour-chapel-reel',
    name: 'Harbour chapel reel',
    category: 'bass',
    description:
      'Dark flat strings on a worn cassette with a wandering speed, and a faint tape echo half a bar behind.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark flat strings',
      params: { sustain: 5, tone: 0.35, release: 0.5 },
    },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Worn cassette',
        params: { wobble: 0.6, drive: 0.6, noise: 0.15 },
      },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 825, mix: 0.25 } },
    ],
    preview: SARABANDE_BASS,
  },
  {
    id: 'lament-grounds-rain-on-the-cortege',
    name: 'Rain on the cortege',
    category: 'bass',
    description:
      'A muted pick under passing rain in a dark hall, the gusts moving its level and tone while drops tap on it.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted pick',
      params: { mute: 0.25, tone: 0.75, position: 0.1, volume: 1 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Light rain', params: { exposure: 0.75, voice: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
    preview: DIVISIONS,
  },
  {
    id: 'lament-grounds-pedalboard-by-hand',
    name: 'Pedalboard by hand',
    category: 'bass',
    description:
      'A ringing bass turned to organ: unison, octave and twelfth pipes speak nearly half a second after the string.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { touch: 0.1, tone: 0.4, sustain: 20, release: 0.6 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Pedal under',
        params: {
          sub: 0.15,
          unison: 0.9,
          octave: 0.8,
          twelfth: 0.5,
          speak: 420,
          swell: 0.8,
          mix: 0.9,
        },
      },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
    preview: BASS_STEPS,
  },
  {
    id: 'lament-grounds-handcart-on-cobbles',
    name: 'Handcart on cobbles',
    category: 'bass',
    description:
      'A pick with a fret rattle played through a small loudspeaker at the far end of a room.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Pick with a rattle',
      params: { growl: 0.7, sustain: 2, volume: 3.5 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Bedside radio',
        params: { drive: 0.45, distance: 0.7, room: 0.65 },
      },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
    preview: DIVISIONS,
  },
  {
    id: 'lament-grounds-backwards-to-the-gate',
    name: 'Backwards to the gate',
    category: 'bass',
    description:
      'A slapped upright answered by its own last second played backwards and an octave higher.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Slapped upright',
      params: { growl: 0.4, release: 0.6, volume: 4 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 1100, pitch: 1, feedback: 0.2, tone: 2200, lowCut: 70, mix: 0.5 },
      },
    ],
    preview: SARABANDE_BASS,
  },
  {
    id: 'lament-grounds-drowned-tetrachord',
    name: 'Drowned tetrachord',
    category: 'bass',
    description:
      'A long upright taken deep under water, its tone wavering slowly and its quiet end brought up.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Long wooden ring',
      params: { tone: 0.8, touch: 0.6, release: 0.6 },
    },
    effects: [
      {
        deviceId: 'underwater',
        preset: 'Deep water',
        params: { depth: 0.6, waver: 0.6, bubbles: 0.15 },
      },
      { deviceId: 'ambient-comp', preset: 'Lift' },
    ],
    preview: BASS_STEPS,
  },
  {
    id: 'lament-grounds-sparks-off-a-low-string',
    name: 'Sparks off a low string',
    category: 'bass',
    description:
      'A long ringing electric bass throwing off small bright pieces an octave or two up, swirled by a slow phaser.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Near the bridge',
      params: { touch: 0.35, position: 0.3, tone: 0.5, sustain: 10, mute: 0, release: 0.7 },
    },
    effects: [
      {
        deviceId: 'glints',
        preset: 'Slow stars',
        params: { density: 7, pitch: 3, mix: 0.45, sparkle: 0.4 },
      },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
    ],
    preview: SARABANDE_BASS,
  },
  {
    id: 'lament-grounds-chest-organ-doors-shut',
    name: 'Chest organ, doors shut',
    category: 'organ',
    description:
      'Soft flute ranks with plenty of wind, their top cut away and the rest closed into a wooden body.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { sub: 0.15, octave: 0.6, breath: 0.45, attack: 0.05, release: 0.25, tone: 1700 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 1.3, mix: 0.55 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
    preview: SIX_STEPS,
  },
  {
    id: 'lament-grounds-nave-at-compline',
    name: 'Nave at compline',
    category: 'organ',
    description:
      'Open ranks over a sub in a vast nave, the lows left ringing longer than the rest.',
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { attack: 0.25, release: 1, tone: 3400, reed: 0, celeste: 0.15, volume: -14.5 },
    },
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Vast nave',
        params: { lowDecay: 5, midDecay: 3.5, mix: 0.45 },
      },
    ],
    preview: SUSPENSIONS,
  },
  {
    id: 'lament-grounds-reeds-of-mourning',
    name: 'Reeds of mourning',
    category: 'organ',
    description:
      'A reedy pump organ on deep uneven bellows, its top dulled by a tape that drifts in pitch.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { reed: 0.9, bellows: 1, octave: 0.1, twelfth: 0.35, tone: 1500, release: 0.9 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4, drive: 0.5, tone: 0.35 } },
      { deviceId: 'chorus', preset: 'Faint air' },
    ],
    preview: FOUR_BARS,
  },
  {
    id: 'lament-grounds-beating-at-the-octave',
    name: 'Beating at the octave',
    category: 'organ',
    description:
      'A flute and a celeste rank a little sharp of it, beating, with an octave added below, turning slowly round the head.',
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { attack: 0.2, release: 1.2, tone: 2600, octave: 0.15 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.12, radius: 0.9 } },
      { deviceId: 'octaves', params: { sub1: 0.5, up1: 0, attack: 0.15, spread: 0.6 } },
    ],
    preview: EXCHANGE,
  },
  {
    id: 'lament-grounds-quint-over-bare-stone',
    name: 'Quint over bare stone',
    category: 'organ',
    description:
      'A plain flute with a loud quint rank, so a twelfth rides over each note, widened and put in a thin veil of reverb.',
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { sub: 0.12, attack: 0.08, release: 0.6, tone: 5000 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.4 } },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
    preview: SIX_STEPS,
  },
  {
    id: 'lament-grounds-reed-veiled-in-monks',
    name: 'Reed veiled in monks',
    category: 'organ',
    description:
      'A dark reed stop with a sub rank and hardly a tremble, answered by low monks in the tail of a hall.',
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { tremulant: 0.12, tone: 900, attack: 0.3, release: 1.5, sub: 0.7, reed: 0.6 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 5, mix: 0.6 } },
      { deviceId: 'chorus', preset: 'Faint air' },
    ],
    preview: SUSPENSIONS,
  },
  {
    id: 'lament-grounds-full-plenum-far-door',
    name: 'Full plenum, far door',
    category: 'organ',
    description:
      'Every rank drawn, heard from outside the building: dark and far off, and held level by a dense compressor.',
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { sub: 1, attack: 0.1, release: 1.4, volume: -14 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door', params: { distance: 0.8, air: 0.7 } },
      { deviceId: 'ambient-comp', preset: 'Dense pad' },
    ],
    preview: MAJOR_GROUND,
  },
  {
    id: 'lament-grounds-bellows-in-the-cold',
    name: 'Bellows in the cold',
    category: 'organ',
    description:
      'A windy flute, its breath loud on uneven bellows, opening and closing over twenty seconds on a hazy plate.',
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: { octave: 0.35, breath: 0.8, bellows: 0.9, attack: 0.35, release: 1.4, tone: 4500 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Tide', params: { air: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.3 } },
    ],
    preview: FOUR_BARS,
  },
  {
    id: 'lament-grounds-pedal-point-in-the-vault',
    name: 'Pedal point in the vault',
    category: 'drone',
    description:
      'A deep sub rank with slow pure sines a fifth above that swell in late and linger after each step.',
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: { tone: 1100, octave: 0.25, celeste: 0.05, attack: 0.3, release: 2 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Fifth above',
        params: { attack: 900, release: 4, mix: 0.6 },
      },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
    preview: OVER_A_PEDAL,
  },
  {
    id: 'lament-grounds-squeezebox-for-the-dead',
    name: 'Squeezebox for the dead',
    category: 'organ',
    description:
      'An accordion reed with quick attack, beating hard, through an old valve and a small loudspeaker.',
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: { celeste: 1, bellows: 0.5, octave: 0, tone: 3800, release: 0.3, volume: -16.5 },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: { speaker: 0, drive: 0.5, bass: -0.3, treble: -0.2, distance: 0.25, room: 0.5 },
      },
      { deviceId: 'patina', preset: 'Hot valve', params: { mix: 0.6 } },
    ],
    preview: TWICE_ROUND,
  },
  {
    id: 'lament-grounds-shruti-for-a-vigil',
    name: 'Shruti for a vigil',
    category: 'drone',
    description:
      'A breathing reed drone with its partials picked out slowly, one at a time, by a narrow resonance tuned to A.',
    instrument: {
      deviceId: 'organ',
      preset: 'Shruti box',
      params: { attack: 0.5, release: 2, tone: 4200 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'Slow wander',
        params: { root: 9, pace: 0.6, octave: 2 },
      },
      { deviceId: 'fog', preset: 'Thin veil' },
    ],
    preview: OVER_A_PEDAL,
  },
  {
    id: 'lament-grounds-last-light-west-window',
    name: 'Last light, west window',
    category: 'pad',
    description:
      'A bright organ with strong twelfths and fifteenths, its tail climbing in fifths after each chord.',
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: { attack: 0.6, release: 2, tone: 8000 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Fifths', params: { decay: 6, shimmer: 0.4, mix: 0.4 } },
    ],
    preview: FOUR_BARS,
  },
  {
    id: 'lament-grounds-next-chapel-same-hour',
    name: 'Next chapel, same hour',
    category: 'organ',
    description:
      'A choir of flutes heard through the wall, phased so slowly that it only seems to lean.',
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { tone: 750, reed: 0.1, octave: 0.8, attack: 0.12, release: 0.8 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.5, feedback: 55 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
    preview: EXCHANGE,
  },
  {
    id: 'lament-grounds-regal-on-a-tabletop',
    name: 'Regal on a tabletop',
    category: 'organ',
    description:
      'A dry buzzing reed played short into a small stopped pipe, which leaves mostly the odd overtones.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: {
        sub: 0,
        octave: 0,
        twelfth: 0.4,
        fifteenth: 0,
        reed: 1,
        celeste: 0,
        breath: 0.1,
        bellows: 0,
        attack: 0.01,
        release: 0.08,
        tone: 6000,
      },
    },
    effects: [
      { deviceId: 'vessel', params: { body: 2, size: 0.6, mix: 0.65 } },
      { deviceId: 'tamer', preset: 'Gentle' },
    ],
    preview: TWICE_ROUND,
  },
  {
    id: 'lament-grounds-frost-on-the-pipes',
    name: 'Frost on the pipes',
    category: 'organ',
    description:
      'A flute under a loud fifteenth and some twelfth, the top splintering into seven scattered bright echoes.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: {
        sub: 0,
        octave: 0.05,
        twelfth: 0.35,
        fifteenth: 1,
        breath: 0.5,
        attack: 0.2,
        release: 1.5,
        tone: 10000,
      },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', params: { presence: -3, air: -2, body: 3 } },
    ],
    preview: RISING_AGAINST,
  },
  {
    id: 'lament-grounds-tremulant-in-mourning',
    name: 'Tremulant in mourning',
    category: 'organ',
    description:
      'A trembling flute with its tremulant doubled by a slow rotary cabinet, in a little warm haze.',
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { sub: 0.4, octave: 0.5, tremulant: 1, tone: 2200, volume: -14.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { hornDepth: 0.8, drive: 0.4 } },
      { deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.25 } },
    ],
    preview: MAJOR_GROUND,
  },
  {
    id: 'lament-grounds-ashes-in-the-swell-box',
    name: 'Ashes in the swell box',
    category: 'pad',
    description:
      'A harmonium shut in its box, its chord held by a sustainer that glides to the next as the bass moves.',
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: { tone: 1000, attack: 0.4, release: 1, reed: 0.5 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Slow strings',
        params: { attack: 0.4, decay: 4, glide: 0.6, mix: 0.6 },
      },
      {
        deviceId: 'auto-filter',
        params: { type: 0, cutoffHz: 900, lfoAmount: 45, lfoRateHz: 0.12, resonance: 1.6 },
      },
    ],
    preview: SIX_STEPS,
  },
  {
    id: 'lament-grounds-cello-from-a-to-e',
    name: 'Cello from A to E',
    category: 'string',
    description:
      'A dark heavy bow warmed by a triode, its room dying away after each step in a straight line.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.35,
        release: 0.35,
        brightness: 0.15,
        pressure: 0.9,
        vibrato: 0.1,
        body: 1,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Triode glow',
        params: { drive: 0.55, lowBump: 0.4, highCut: 3000 },
      },
      { deviceId: 'shaped-reverb', preset: 'Falling', params: { time: 1, mix: 0.35 } },
    ],
    preview: BASS_STEPS,
  },
  {
    id: 'lament-grounds-bass-viol-no-vibrato',
    name: 'Bass viol, no vibrato',
    category: 'string',
    description:
      'A straight gut tone bowed lightly up the fingerboard, close and dry, its wooden body made a little larger.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: {
        attack: 0.12,
        release: 0.3,
        brightness: 0.35,
        pressure: 0.3,
        body: 0.9,
        vibrato: 0,
        position: 0.3,
        detune: 0,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'Larger', params: { size: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
    preview: LATE_TENTHS,
  },
  {
    id: 'lament-grounds-bridge-and-tears',
    name: 'Bridge and tears',
    category: 'string',
    description:
      'A bow pressed hard at the bridge, its rasp split off and sent wide while the tone stays centred.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: { attack: 0.25, position: 0.06, release: 0.4 },
    },
    effects: [
      { deviceId: 'sift', params: { tones: 0, attacks: -8, air: 4, scatter: 0.9, hold: 0.5 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
    preview: E_HELD,
  },
  {
    id: 'lament-grounds-two-bows-a-comma-apart',
    name: 'Two bows a comma apart',
    category: 'string',
    description:
      'A pair of bows detuned by about a comma, beating on cassette tape and wandering from side to side.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: { attack: 0.7, release: 2, vibrato: 0.2, detune: 20, brightness: 0.35, volume: -13 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.05 } },
      { deviceId: 'tremolo', preset: 'Wandering pan' },
    ],
    preview: FOUR_BARS,
  },
  {
    id: 'lament-grounds-glass-bow-cold-hands',
    name: 'Glass bow, cold hands',
    category: 'string',
    description:
      'A very light slow bow with high overtones, its line coming back reversed and an octave up under itself.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.25, release: 1.5, brightness: 0.9, pressure: 0.25 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { time: 825, mix: 0.45 } },
      { deviceId: 'glimmer', preset: 'Glitter on top', params: { depth: 0.75, rate: 0.6 } },
    ],
    preview: HIGH_LINE,
  },
  {
    id: 'lament-grounds-sustained-in-black',
    name: 'Sustained in black',
    category: 'pad',
    description:
      'A sustained string that swells in over a second, blurred into one cloud with no attacks left.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Sustained swell',
      params: { attack: 1.1, release: 1.5, brightness: 0.25, body: 0.7, detune: 14, volume: -19.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.7 } },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
    preview: OVER_A_PEDAL,
  },
  {
    id: 'lament-grounds-octave-under-the-veil',
    name: 'Octave under the veil',
    category: 'string',
    description:
      'A pressed string that breaks into its octave, filtered dark, with one long cavern behind it.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 0.9, brightness: 0.45, release: 1.2, vibrato: 0.1 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 700,
          resonance: 1.2,
          lfoAmount: 20,
          lfoRateHz: 0.09,
        },
      },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 5, mix: 0.4 } },
    ],
    preview: FOUR_BARS,
  },
  {
    id: 'lament-grounds-plucked-beside-the-bier',
    name: 'Plucked beside the bier',
    category: 'plucked',
    description:
      'A felt soft plucked string, close and woody, repeated once by a tape slap and played through a small combo.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { brightness: 0.2, decay: 3, body: 0.9, position: 0.4, release: 0.5, volume: -3 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 125, mix: 0.45 } },
      { deviceId: 're-amp', preset: 'Combo in a room' },
    ],
    preview: DIVISIONS,
  },
  {
    id: 'lament-grounds-volume-pedal-in-mourning',
    name: 'Volume pedal in mourning',
    category: 'string',
    description:
      'Strings plucked behind a closed volume pedal, each chord rising late with its echoes fanning upward.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { attack: 0.35, release: 1.6, brightness: 0.75, decay: 9, volume: 3.5 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Slow unfolding', params: { time: 900, mix: 0.45 } },
      { deviceId: 'chorus', preset: 'Guitar shimmer' },
    ],
    preview: SUSPENSIONS,
  },
  {
    id: 'lament-grounds-wire-harp-at-the-grave',
    name: 'Wire harp at the grave',
    category: 'plucked',
    description:
      'A bright wire harp left ringing, answered by low singing bowls tuned in fifths on A that ring on after it.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { brightness: 0.6, decay: 7, release: 1.4 },
    },
    effects: [{ deviceId: 'bowls', preset: 'Low fifths', params: { root: 9, mix: 0.4 } }],
    preview: TWICE_ROUND,
  },
  {
    id: 'lament-grounds-damped-gut-for-a-ground',
    name: 'Damped gut for a ground',
    category: 'plucked',
    description:
      'A short damped pluck with a large wooden body, its level lifted by a limiter and two echoes thrown wide.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { decay: 2.2, brightness: 0.2, release: 0.5, position: 0.3 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
      { deviceId: 'constellation', preset: 'Wide pair', params: { mix: 0.35 } },
    ],
    preview: DIVISIONS,
  },
  {
    id: 'lament-grounds-beating-in-the-rafters',
    name: 'Beating in the rafters',
    category: 'plucked',
    description:
      'Plucked strings an eighth of a tone apart ring and beat, and long pieces of them fall a fifth as they fade.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { decay: 12, release: 2, brightness: 0.7 },
    },
    effects: [{ deviceId: 'falling', preset: 'Slow sighs', params: { fall: -7, mix: 0.45 } }],
    preview: FOUR_BARS,
  },
  {
    id: 'lament-grounds-still-tone-for-a-vigil',
    name: 'Still tone for a vigil',
    category: 'drone',
    description:
      'A plain dark held tone in soft pulses that seem to slow without end, its partials bent by a slow warp.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 0.8, release: 2, brightness: 0.3, body: 0.3 },
    },
    effects: [
      { deviceId: 'winding-down', preset: 'Four slowing', params: { depth: 0.6 } },
      { deviceId: 'warp', preset: 'Slow breath', params: { mix: 0.4 } },
    ],
    preview: OVER_A_PEDAL,
  },
  {
    id: 'lament-grounds-fiddle-by-the-window',
    name: 'Fiddle by the window',
    category: 'string',
    description:
      'A quick singing string with a full vibrato, small and thin, through a worn kitchen radio.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Quick sustain',
      params: { vibrato: 0.6, brightness: 0.65, release: 0.6 },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller', params: { size: -0.4 } },
      { deviceId: 'patina', preset: 'Kitchen radio', params: { noise: 0.1 } },
    ],
    preview: HIGH_LINE,
  },
  {
    id: 'lament-grounds-slow-tide-of-two-strings',
    name: 'Slow tide of two strings',
    category: 'pad',
    description:
      'Detuned strings swelling in slowly, their bands drifting in level from side to side under a woollen haze.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Slow beating swell',
      params: { volume: -11, attack: 0.9, release: 2.5, brightness: 0.55 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide' },
      { deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.35 } },
    ],
    preview: MAJOR_GROUND,
  },
  {
    id: 'lament-grounds-twelfth-over-the-bier',
    name: 'Twelfth over the bier',
    category: 'string',
    description:
      'A bright sustained string near its twelfth, an octave added below it, swept by a deep eight stage phaser.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Twelfth glow',
      params: { attack: 0.5, release: 1.5, detune: 4 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { up2: 0.25 } },
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { mix: 0.4 } },
    ],
    preview: EXCHANGE,
  },
  {
    id: 'lament-grounds-consort-behind-a-curtain',
    name: 'Consort behind a curtain',
    category: 'string',
    description:
      'Soft bows with no pressure at all, held by a string pad that swells in a moment after them.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.3, release: 1.2, brightness: 0.5, body: 0.5, detune: 10 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Dark cellos',
        params: { octaves: 0, rise: 0.8, fall: 3, mix: 0.6 },
      },
      { deviceId: 'fog', preset: 'Dark bank', params: { mix: 0.5 } },
    ],
    preview: SUSPENSIONS,
  },
  {
    id: 'lament-grounds-passacaglia-for-six',
    name: 'Passacaglia for six',
    category: 'string',
    description:
      'Six players with a warm bow and an audible vibrato, held together by a slow compressor on a small plate.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 0.3, vibrato: 10, release: 0.8, volume: -4 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } },
    ],
    preview: SIX_STEPS,
  },
  {
    id: 'lament-grounds-mutes-on-curtains-drawn',
    name: 'Mutes on, curtains drawn',
    category: 'string',
    description: 'A muted section rising through fog, dark from the first bow stroke to the last.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 0.6, release: 1.5, air: 0.1 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { cutoffHz: 1300 } },
      { deviceId: 'fog', preset: 'Soft cloud', params: { mix: 0.5 } },
    ],
    preview: MAJOR_GROUND,
  },
  {
    id: 'lament-grounds-whispered-consort',
    name: 'Whispered consort',
    category: 'string',
    description:
      'Barely bowed strings that are mostly air, the quiet breath raised and then heard inside a large shell.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { attack: 0.6, release: 1.2, air: 1, volume: -4 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Breath' },
      { deviceId: 'vessel', preset: 'Shell to the ear', params: { size: 1.8, mix: 0.7 } },
    ],
    preview: RISING_AGAINST,
  },
  {
    id: 'lament-grounds-lone-desk-in-the-choir',
    name: 'Lone desk in the choir',
    category: 'string',
    description:
      'One player wandering in pitch, answered half a bar later by a duller copy an octave up, with a vibrato that waits.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wandering solo',
      params: { attack: 0.25, release: 0.7, vibrato: 10, volume: -4.5 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Faint answer',
        params: { gap: 0.825, interval1: 12, tone: 2600, mix: 0.35 },
      },
      { deviceId: 'late-vibrato', preset: 'Singer' },
    ],
    preview: HIGH_LINE,
  },
  {
    id: 'lament-grounds-glass-bridge-at-dawn',
    name: 'Glass bridge at dawn',
    category: 'string',
    description:
      'Three bows on the bridge without vibrato, their tail climbing in fifths down the middle of the picture.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { attack: 0.4, release: 1.5 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Narrow fifth', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', params: { presence: -2, body: 2 } },
    ],
    preview: EXCHANGE,
  },
  {
    id: 'lament-grounds-duet-over-muffled-steps',
    name: 'Duet over muffled steps',
    category: 'string',
    description:
      'Two quiet, lightly muted players over a shortwave link that fades in and out, with only a little static.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Quiet duet',
      params: { attack: 0.15, mute: 0.3, vibrato: 14, volume: 0 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Night shortwave', params: { static: 0.08, fading: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
    preview: LATE_TENTHS,
  },
  {
    id: 'lament-grounds-ragged-mourners',
    name: 'Ragged mourners',
    category: 'string',
    description:
      'Six players nowhere near together, their bodies made larger and darker and spread into a passing flock.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { attack: 0.5, bow: 0.2 },
    },
    effects: [
      { deviceId: 'size', preset: 'Giant', params: { size: 0.6, tone: -0.4 } },
      { deviceId: 'murmuration', preset: 'Thick ensemble', params: { mix: 0.55 } },
    ],
    preview: FOUR_BARS,
  },
  {
    id: 'lament-grounds-short-strokes-long-rest',
    name: 'Short strokes, long rest',
    category: 'string',
    description:
      'Bitten short bows, each with a gated burst of room behind it that stops as short as the bow did.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { release: 0.15, mute: 0.3, players: 5, volume: -3.5 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.45, mix: 0.4 } }],
    preview: TWICE_ROUND,
  },
  {
    id: 'lament-grounds-six-bows-over-the-river',
    name: 'Six bows over the river',
    category: 'pad',
    description:
      'Slow swelling strings whose last seconds return backwards and an octave lower under the chords that follow.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Six slow bows',
      params: { attack: 0.9, release: 2.5, volume: -1.5 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow backwards',
        params: { length: 3.5, lowCut: 130, mix: 0.4 },
      },
      { deviceId: 'stereo-detune', preset: 'Wider' },
    ],
    preview: FOUR_BARS,
  },
  {
    id: 'lament-grounds-viols-at-the-bedside',
    name: 'Viols at the bedside',
    category: 'string',
    description:
      'A straight consort of viols, muted and still, pressed into the colour of a dark box and set in a tiny booth.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { attack: 0.2, bow: 0.85, mute: 0.5 },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.35 } },
      { deviceId: 'imprint', preset: 'Dark box', params: { amount: 0.8 } },
    ],
    preview: SIX_STEPS,
  },
  {
    id: 'lament-grounds-keys-under-a-pall',
    name: 'Keys under a pall',
    category: 'keys',
    description:
      'A thickly felted piano whose hammers are blurred into a rise, with a resonant low filter moving slowly over it.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { felt: 1, hardness: 0.1, reverbMix: 0.1, grit: 0.1, outputDb: -17.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Slow rise', params: { size: 180, mix: 0.75 } },
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 0,
          cutoffHz: 700,
          resonance: 2.4,
          lfoAmount: 35,
          lfoRateHz: 0.16,
        },
      },
    ],
    preview: SIX_STEPS,
  },
  {
    id: 'lament-grounds-ground-on-a-bare-upright',
    name: 'Ground on a bare upright',
    category: 'keys',
    description:
      'A bare hard piano with worn strings, doubled by a wobbling tape and played from inside a cupboard.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { felt: 0, hardness: 0.7, reverbMix: 0, grit: 0.1, outputDb: -14.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Wobbly double', params: { time: 70, mix: 0.5 } },
      { deviceId: 're-amp', preset: 'In the cupboard', params: { angle: 0.6, bass: -0.4 } },
    ],
    preview: DIVISIONS,
  },
  {
    id: 'lament-grounds-half-pedal-six-steps',
    name: 'Half pedal, six steps',
    category: 'keys',
    description:
      'A half pedalled piano whose every chord stays in the air as tuned strings ringing in A minor.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: { reverbMix: 0, width: 0.8, outputDb: -16.5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor wash', params: { root: 9, mix: 0.5 } },
      { deviceId: 'chorus', preset: 'Subtle widener' },
    ],
    preview: SIX_STEPS,
  },
  {
    id: 'lament-grounds-empty-recital-room',
    name: 'Empty recital room',
    category: 'keys',
    description:
      'A felted piano in the next room, its hammers swelled away, with only the low part of a huge room after it.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Next room',
      params: { reverbMix: 0.5, thump: 0.2, outputDb: -14.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 300 } },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 7, mix: 0.4 } },
    ],
    preview: FOUR_BARS,
  },
  {
    id: 'lament-grounds-glass-keys-at-the-wake',
    name: 'Glass keys at the wake',
    category: 'keys',
    description:
      'A hard stiff piano with no felt, small sparks of its overtones scattered after each note, and a hint of spring.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { reverbMix: 0.1, outputDb: -7.5 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Overtone spray', params: { mix: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
    preview: HIGH_LINE,
  },
  {
    id: 'lament-grounds-blurred-by-weeping',
    name: 'Blurred by weeping',
    category: 'keys',
    description:
      'A felted piano on half a pedal, each chord running a little into the next and sagging in pitch as its tail grows old.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { reverbMix: 0.3, felt: 0.8, sustain: 0.45, damper: 0.3, outputDb: -10 },
    },
    effects: [{ deviceId: 'melt', preset: 'Slow melt', params: { mix: 0.5 } }],
    preview: SUSPENSIONS,
  },
  {
    id: 'lament-grounds-worn-felt-old-wire',
    name: 'Worn felt, old wire',
    category: 'keys',
    description:
      'A mono overdriven piano recorded too hot on tape with a slow wow, then doubled a little sharp and flat at the sides.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Worn mono',
      params: { grit: 1, hardness: 0.6, outputDb: -13 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned', params: { wow: 0.6 } },
      { deviceId: 'stereo-detune', preset: 'Doubled' },
    ],
    preview: TWICE_ROUND,
  },
  {
    id: 'lament-grounds-cold-glass-tetrachord',
    name: 'Cold glass tetrachord',
    category: 'pad',
    description:
      'A still glass table over a strong sub, narrow and unmoving, with a small warm spring tank behind it.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { position: 0.18, sub: 0.8, cutoff: 900, attack: 0.8, release: 3, volume: -13.5 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.35 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
    preview: OVER_A_PEDAL,
  },
  {
    id: 'lament-grounds-chorus-of-hooded-vowels',
    name: 'Chorus of hooded vowels',
    category: 'voice',
    description:
      'A humming vowel table with no motion of its own, brightened and darkened by a slow breath, on a long plate.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Humming choir',
      params: { attack: 0.4, release: 1.5, cutoff: 4200, position: 0.7 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Dark lungs' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: SIX_STEPS,
  },
  {
    id: 'lament-grounds-reed-table-at-the-altar',
    name: 'Reed table at the altar',
    category: 'organ',
    description:
      'A reed wave with a quick start and no drift, softened by a short blur that leaves it nearly mono.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { attack: 0.06, release: 0.6, position: 0.3, detune: 2, cutoff: 1500, motion: 0 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Short blur', params: { width: 0.1 } },
      { deviceId: 'analog-drive', preset: 'Iron lows' },
    ],
    preview: SUSPENSIONS,
  },
  {
    id: 'lament-grounds-hollow-way-downward',
    name: 'Hollow way downward',
    category: 'pad',
    description:
      'A hollow drifting table whose tail sinks in pitch for as long as it rings and never arrives.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 1, release: 3, resonance: 0.45 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.45, decay: 7 } }],
    preview: FOUR_BARS,
  },
  {
    id: 'lament-grounds-saws-in-a-side-chapel',
    name: 'Saws in a side chapel',
    category: 'pad',
    description:
      'Thick detuned saws closed down and pumped by a compressor, swept by a slow twelve stage phaser.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Thick saws',
      params: { cutoff: 1100, attack: 0.35, release: 1.2, resonance: 0.3 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { mix: 0.6 } },
      { deviceId: 'ambient-comp', preset: 'Pump' },
    ],
    preview: MAJOR_GROUND,
  },
  {
    id: 'lament-grounds-spectrum-over-a-tomb',
    name: 'Spectrum over a tomb',
    category: 'texture',
    description:
      'A frozen bright spectrum with its glare turned down, grains of it raining an octave higher.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Frozen spectrum',
      params: { attack: 0.5, release: 3, cutoff: 6000, volume: -5 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Octave rain', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', params: { presence: -3, air: -3 } },
    ],
    preview: EXCHANGE,
  },
  {
    id: 'lament-grounds-pulse-for-the-half-steps',
    name: 'Pulse for the half steps',
    category: 'keys',
    description:
      'A narrow pulse over some sub with a quick start, and clean even echoes about four to the second.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: { cutoff: 2200, release: 0.5, detune: 8, sub: 0.4 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 275, feedback: 0.45, mix: 0.34 },
      },
      { deviceId: 'rotary', preset: 'Faint motion' },
    ],
    preview: E_HELD,
  },
  {
    id: 'lament-grounds-candle-after-the-note',
    name: 'Candle after the note',
    category: 'keys',
    description:
      'A felt strike that dies quickly into a dark glow, with itself at half speed an octave down under the mix.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Dark felt',
      params: { bloom: 1.4, fade: 1.6, tone: 0.4, decay: 1.2 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { lowCut: 130 } },
      { deviceId: 'tape', preset: 'Warm thump', params: { bump: 0.8 } },
    ],
    preview: SIX_STEPS,
  },
  {
    id: 'lament-grounds-passing-bell-third-step',
    name: 'Passing bell, third step',
    category: 'bell',
    description:
      'A low bell that glows on after the stroke, ring-modulated darkly on C and set in a faint halo of hall.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Low tide bell',
      params: { bloom: 1.5, fade: 2.5, decay: 5, strike: 0.9, tone: 0.4 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Dark bell', params: { root: 0, mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
    preview: MAJOR_GROUND,
  },
  {
    id: 'lament-grounds-breath-on-funeral-glass',
    name: 'Breath on funeral glass',
    category: 'pad',
    description:
      'Glass tones that fade in with hardly a strike, then thin and freeze in deep winter air.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Glass breath',
      params: { strike: 0.1, bloom: 0.8, fade: 2.2, tone: 0.7 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Deep winter', params: { mix: 0.8 } }],
    preview: FOUR_BARS,
  },
  {
    id: 'lament-grounds-lute-laid-by',
    name: 'Lute laid by',
    category: 'plucked',
    description:
      'A plucked string whose glow arrives a moment after it, repeated in skips that come closer and duller.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: { glow: 0.4, tone: 0.45, decay: 1.6, fade: 2, volume: -2 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { first: 250, mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
    preview: DIVISIONS,
  },
  {
    id: 'lament-grounds-light-through-black-lace',
    name: 'Light through black lace',
    category: 'pad',
    description:
      'Only the glow of struck felt, restless and wide, the partials that stay put kept ahead of those that move.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Restless light',
      params: { strike: 0, bloom: 0.5, fade: 1.8, drift: 0.6, volume: -8.5 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Light touch', params: { mix: 0.6 } },
      { deviceId: 'chorus', preset: 'Hollow swell' },
    ],
    preview: SUSPENSIONS,
  },
  {
    id: 'lament-grounds-shimmer-on-the-pall',
    name: 'Shimmer on the pall',
    category: 'keys',
    description:
      'Felt keys with a bright halo, struck again and again by their own octave echoes and slowly panned across.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Shimmer keys',
      params: { halo: 0.6, fade: 3, decay: 2.5, volume: -7 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Restruck', params: { time: 550, mix: 0.4 } },
      { deviceId: 'tremolo', preset: 'Slow pan' },
    ],
    preview: HIGH_LINE,
  },
  {
    id: 'lament-grounds-violet-stole',
    name: 'Violet stole',
    category: 'pad',
    description:
      'Saw and pulse strings with a softened start, dimming as each chord holds, on a reel that has been played too often.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Dimming strings',
      params: { attack: 0.4, release: 1.5, cutoff: 3500, resonance: 0.3 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.5, wear: 0.6 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
    preview: SIX_STEPS,
  },
  {
    id: 'lament-grounds-sub-floor-of-the-crypt',
    name: 'Sub floor of the crypt',
    category: 'bass',
    description:
      'A square wave with its full sub octave and a dull filter, quick to speak and gently driven by a tape curve.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { cutoff: 520, attack: 0.05, release: 0.4, chorus: 0, resonance: 0.4, volume: -13.5 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth', params: { driveDb: 8, outputDb: -3 } },
      { deviceId: 'ambient-eq', params: { lowCut: 30, low: 1 } },
    ],
    preview: BASS_STEPS,
  },
  {
    id: 'lament-grounds-filter-singing-alone',
    name: 'Filter singing alone',
    category: 'pad',
    description:
      'One thin saw through a filter near its singing point, in a very slow wide flanger, heard far off through fog.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { resonance: 0.85, attack: 0.5, release: 3, volume: -2 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Glacial drift', params: { mix: 0.5 } },
      { deviceId: 'distance', preset: 'Through fog' },
    ],
    preview: OVER_A_PEDAL,
  },
  {
    id: 'lament-grounds-stopped-pipe-by-the-font',
    name: 'Stopped pipe by the font',
    category: 'organ',
    description:
      'A hollow square of odd overtones, trembling five times a second in a small bright chamber.',
    instrument: { deviceId: 'dusk', preset: 'Stopped pipe', params: { release: 0.7, cutoff: 950 } },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 5.2, depth: 0.35 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.3 } },
    ],
    preview: RISING_AGAINST,
  },
  {
    id: 'lament-grounds-pulse-swell-before-dawn',
    name: 'Pulse swell before dawn',
    category: 'pad',
    description:
      'A moving pulse that takes a full second to rise over its sub, blurred into one middle band of fog.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Long pulse swell',
      params: { attack: 1.1, release: 2.5, cutoff: 1600, chorus: 3 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Band of fog', params: { mix: 0.6 } },
      { deviceId: 'ambient-limiter', preset: 'Late night' },
    ],
    preview: OVER_A_PEDAL,
  },
  {
    id: 'lament-grounds-glowing-coals-ground',
    name: 'Glowing coals ground',
    category: 'bass',
    description:
      'A mono saw bass that slides into each half step, feeding back on a low overtone through a warm stack of speakers.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm Bass',
      params: { glide: 0.22, cutoff: 300, filterDecay: 0.6, ampRelease: 0.3 },
    },
    effects: [
      { deviceId: 'howl', preset: 'Low drone', params: { mix: 0.5 } },
      { deviceId: 're-amp', preset: 'Warm stack', params: { drive: 0.3 } },
    ],
    preview: BASS_STEPS,
  },
  {
    id: 'lament-grounds-slow-strings-choir-end',
    name: 'Slow strings, choir end',
    category: 'pad',
    description:
      'Detuned saws that rise slowly, the tones held in common hanging on and the top opened wide.',
    instrument: {
      deviceId: 'ember',
      preset: 'Slow strings',
      params: { ampAttack: 0.8, ampRelease: 2, filterAttack: 0.8, cutoff: 2000 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Hanging notes' },
      { deviceId: 'spread', preset: 'Air only' },
    ],
    preview: FOUR_BARS,
  },
  {
    id: 'lament-grounds-hollow-vowel-at-the-turn',
    name: 'Hollow vowel at the turn',
    category: 'pad',
    description:
      'A square under a triangle an octave up, pressed into a round vowel, with a hall that answers late.',
    instrument: {
      deviceId: 'ember',
      preset: 'Hollow Pad',
      params: { ampAttack: 0.3, unisonDetune: 3, unisonSpread: 0.2, cutoff: 2600 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel', params: { amount: 1.2 } },
      { deviceId: 'fdn-reverb', preset: 'Late arrival', params: { mix: 0.35 } },
    ],
    preview: RISING_AGAINST,
  },
  {
    id: 'lament-grounds-dark-drone-bare-octaves',
    name: 'Dark drone, bare octaves',
    category: 'drone',
    description:
      'A dark saw and pulse an octave apart, slowly beating between the ears, with a faint slow pulse in the lows.',
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: { ampAttack: 0.4, ampRelease: 0.6, cutoff: 420 },
    },
    effects: [
      { deviceId: 'ear-shift', preset: 'Slow turn' },
      { deviceId: 'band-pulse', preset: 'Slow low pulse', params: { depth: 0.35 } },
    ],
    preview: E_HELD,
  },
  {
    id: 'lament-grounds-brass-at-the-graveside',
    name: 'Brass at the graveside',
    category: 'wind',
    description:
      'Soft dark brass with a slow filter and no bite, trailed by duller repeats of itself and moments from before.',
    instrument: {
      deviceId: 'ember',
      preset: 'Brass',
      params: {
        filterAttack: 0.35,
        ampAttack: 0.2,
        cutoff: 600,
        filterEnvAmount: 0.35,
        ampRelease: 0.8,
        filterSustain: 0.4,
      },
    },
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Dark trail',
        params: { feedback: 0.5, time: 825, mix: 0.36 },
      },
      { deviceId: 'tape', preset: 'Mastering deck' },
    ],
    preview: MAJOR_GROUND,
  },
  {
    id: 'lament-grounds-where-the-lines-cross',
    name: 'Where the lines cross',
    category: 'drone',
    description:
      'Warm steady tones with a sine sweeping through them in ten seconds, a fourth to either side: the reach of the ground.',
    instrument: {
      deviceId: 'still-point',
      preset: 'Warm crossing',
      params: { reach: 5, time: 10, attack: 0.4, warmth: 0.5 },
    },
    effects: [
      { deviceId: 'stereo-widener', preset: 'Wide' },
      { deviceId: 'analog-drive', preset: 'Low warmth' },
    ],
    preview: OVER_A_PEDAL,
  },
  {
    id: 'lament-grounds-sine-held-under-a-step',
    name: 'Sine held under a step',
    category: 'drone',
    description:
      'Warm full tones with a deep slow beat, their lows, middle and top swelling each in its own time.',
    instrument: {
      deviceId: 'still-point',
      preset: 'Deep slow beat',
      params: { time: 16, reach: 0.5, attack: 0.15, release: 0.5, warmth: 0.9 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Deep swell' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
    preview: E_HELD,
  },
  {
    id: 'lament-grounds-bell-jar-over-the-vigil',
    name: 'Bell jar over the vigil',
    category: 'bell',
    description:
      'Warm steady tones with a quick start, answered by a dozen singing bowls tuned to A minor.',
    instrument: {
      deviceId: 'still-point',
      preset: 'Full short tones',
      params: { attack: 0.02, release: 1.2 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Minor table', params: { root: 9, mix: 0.5 } },
      { deviceId: 'tamer', preset: 'Gentle' },
    ],
    preview: LATE_TENTHS,
  },
  {
    id: 'lament-grounds-starlings-at-the-gate',
    name: 'Starlings at the gate',
    category: 'pad',
    description:
      'Seven gliding voices that sink onto each chord from above, a murmuring reedy crowd in a hall with its top shaded.',
    instrument: {
      deviceId: 'flock',
      preset: 'Low murmur',
      params: { gather: 0.9, from: 1, stray: 0.25, leave: 2.5 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
    preview: FOUR_BARS,
  },
  {
    id: 'lament-grounds-one-mourner-whistling',
    name: 'One mourner whistling',
    category: 'wind',
    description:
      'A single whistled line that slides a little into every note, with a late vibrato and wide dotted tape echoes.',
    instrument: {
      deviceId: 'flock',
      preset: 'One whistle',
      params: { gather: 0.12, tone: 0.15, leave: 0.6 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Finger vibrato' },
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 410, mix: 0.3 } },
    ],
    preview: HIGH_LINE,
  },
  {
    id: 'lament-grounds-hollow-pair-on-the-road',
    name: 'Hollow pair on the road',
    category: 'wind',
    description:
      'Two reedy voices close beside each note, inside an open pipe and trailed by a slightly stretched shadow.',
    instrument: {
      deviceId: 'flock',
      preset: 'Hollow pair',
      params: { gather: 0.25, stray: 0.1, tone: 0.8, leave: 1.2 },
    },
    effects: [
      { deviceId: 'stretch', preset: 'Near shadow', params: { mix: 0.5 } },
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.4 } },
    ],
    preview: LATE_TENTHS,
  },
]
