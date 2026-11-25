import { type FactoryPreset, type Phrase } from '../types'

// Two voices a major second apart, and the second is the resting place: one voice walks inside a
// fourth, the other holds the tonic and drops to the note below it, and the phrase closes on the
// held second or on a unison. No vibrato. Laid out by distance from the singers, by how fast the
// two tones beat, and by how much throat, reed or bow is in them.

// Drone D4 dropping to C4 at the cadence, the upper voice inside E4 to G4, closing on D4 with E4.
const DOORSTEP: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.2, note: 62, gain: 0.38 },
    { atSec: 0.3, durSec: 0.9, note: 64, gain: 0.4 },
    { atSec: 1.2, durSec: 0.4, note: 65, gain: 0.4 },
    { atSec: 1.6, durSec: 0.4, note: 64, gain: 0.4 },
    { atSec: 2, durSec: 0.5, note: 67, gain: 0.4 },
    { atSec: 2.5, durSec: 0.7, note: 65, gain: 0.4 },
    { atSec: 3.2, durSec: 1, note: 60, gain: 0.38 },
    { atSec: 3.2, durSec: 0.5, note: 64, gain: 0.4 },
    { atSec: 3.7, durSec: 0.5, note: 62, gain: 0.4 },
    { atSec: 4.2, durSec: 3, note: 62, gain: 0.38 },
    { atSec: 4.2, durSec: 0.5, note: 65, gain: 0.4 },
    { atSec: 4.7, durSec: 2.5, note: 64, gain: 0.4 },
  ],
}

// Three held notes: D4 to C4 and back under an E4 that stays, the seconds tuned pure (9:8).
const PURE_SECOND: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.8, note: 62, gain: 0.42 },
    { atSec: 1, durSec: 5.9, note: 64.04, gain: 0.4 },
    { atSec: 2.8, durSec: 1.2, note: 59.96, gain: 0.42 },
    { atSec: 4, durSec: 2.9, note: 62, gain: 0.42 },
  ],
}

// Phrygian on E4: F G A over the drone, G4 over a leap under to D4, F4 against E4 for two beats, the unison.
const GRINDING_F: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.8, note: 64, gain: 0.38 },
    { atSec: 0.5, durSec: 0.8, note: 65, gain: 0.4 },
    { atSec: 1.3, durSec: 0.7, note: 67, gain: 0.4 },
    { atSec: 2, durSec: 0.8, note: 69, gain: 0.4 },
    { atSec: 2.8, durSec: 1, note: 62, gain: 0.38 },
    { atSec: 2.8, durSec: 1, note: 67, gain: 0.4 },
    { atSec: 3.8, durSec: 3.2, note: 64, gain: 0.38 },
    { atSec: 3.8, durSec: 1.6, note: 65, gain: 0.4 },
    { atSec: 5.4, durSec: 1.6, note: 63.97, gain: 0.4 },
  ],
}

// Drone in octaves D3 and D4, a second voice C4 to D4, a first voice E4 to G4: all meet as C4 D4 E4.
const THREE_ROWS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 50, gain: 0.3 },
    { atSec: 0, durSec: 6.8, note: 62, gain: 0.34 },
    { atSec: 0.4, durSec: 1, note: 64, gain: 0.36 },
    { atSec: 0.8, durSec: 1.6, note: 60, gain: 0.34 },
    { atSec: 1.4, durSec: 0.5, note: 65, gain: 0.36 },
    { atSec: 1.9, durSec: 0.8, note: 67, gain: 0.36 },
    { atSec: 2.4, durSec: 1.4, note: 62.03, gain: 0.34 },
    { atSec: 2.7, durSec: 0.6, note: 65, gain: 0.36 },
    { atSec: 3.3, durSec: 0.5, note: 67, gain: 0.36 },
    { atSec: 3.8, durSec: 3, note: 60, gain: 0.34 },
    { atSec: 3.8, durSec: 0.5, note: 65, gain: 0.36 },
    { atSec: 4.3, durSec: 2.5, note: 64, gain: 0.36 },
  ],
}

// A fall from G4 over D4 and C4, home on D4 with E4, and a short quiet D5 as the breath lets go.
const LEAP_OFF: Phrase = {
  notes: [
    { atSec: 0, durSec: 2, note: 62, gain: 0.38 },
    { atSec: 0.2, durSec: 0.6, note: 67, gain: 0.4 },
    { atSec: 0.8, durSec: 0.6, note: 65, gain: 0.4 },
    { atSec: 1.4, durSec: 0.6, note: 64, gain: 0.4 },
    { atSec: 2, durSec: 1, note: 60, gain: 0.38 },
    { atSec: 2, durSec: 0.5, note: 65, gain: 0.4 },
    { atSec: 2.5, durSec: 0.5, note: 62, gain: 0.4 },
    { atSec: 3, durSec: 3, note: 62, gain: 0.38 },
    { atSec: 3, durSec: 3, note: 64, gain: 0.4 },
    { atSec: 6, durSec: 0.25, note: 74, gain: 0.22 },
  ],
}

// The cadence in the men's octave: drone D3 to C3 and back, the tune E3 F3 G3, rest on D3 with E3.
const TENOR_PAIR: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.6, note: 50, gain: 0.4 },
    { atSec: 0.5, durSec: 0.7, note: 52, gain: 0.4 },
    { atSec: 1.2, durSec: 0.5, note: 53, gain: 0.4 },
    { atSec: 1.7, durSec: 0.9, note: 55, gain: 0.4 },
    { atSec: 2.6, durSec: 1.1, note: 48, gain: 0.4 },
    { atSec: 2.6, durSec: 0.5, note: 53, gain: 0.4 },
    { atSec: 3.1, durSec: 0.6, note: 52, gain: 0.4 },
    { atSec: 3.7, durSec: 3.1, note: 50, gain: 0.4 },
    { atSec: 3.7, durSec: 0.5, note: 53, gain: 0.4 },
    { atSec: 4.2, durSec: 2.6, note: 52, gain: 0.4 },
  ],
}

// A meter of seven, 2+2+3: E F G, F E F, then E D over a dropped C4 and E4 over D4 held.
const SEVEN_STEPS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.64, note: 62, gain: 0.36 },
    { atSec: 0, durSec: 0.52, note: 64, gain: 0.4 },
    { atSec: 0.52, durSec: 0.52, note: 65, gain: 0.4 },
    { atSec: 1.04, durSec: 0.78, note: 67, gain: 0.4 },
    { atSec: 1.82, durSec: 0.52, note: 65, gain: 0.4 },
    { atSec: 2.34, durSec: 0.52, note: 64, gain: 0.4 },
    { atSec: 2.86, durSec: 0.78, note: 65, gain: 0.4 },
    { atSec: 3.64, durSec: 1.04, note: 60, gain: 0.36 },
    { atSec: 3.64, durSec: 0.52, note: 64, gain: 0.4 },
    { atSec: 4.16, durSec: 0.52, note: 62, gain: 0.4 },
    { atSec: 4.68, durSec: 2.2, note: 62, gain: 0.36 },
    { atSec: 4.68, durSec: 2.2, note: 64, gain: 0.4 },
  ],
}

// One voice alone, then a second voice a step under it, both moving in seconds: G-F, F-E, E-D, D-C, E-D.
const CALLED_IN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.6, note: 64, gain: 0.4 },
    { atSec: 0.6, durSec: 0.5, note: 65, gain: 0.4 },
    { atSec: 1.1, durSec: 1.5, note: 67, gain: 0.4 },
    { atSec: 1.8, durSec: 0.8, note: 65, gain: 0.38 },
    { atSec: 2.6, durSec: 0.7, note: 64, gain: 0.38 },
    { atSec: 2.6, durSec: 0.7, note: 65, gain: 0.4 },
    { atSec: 3.3, durSec: 0.7, note: 62, gain: 0.38 },
    { atSec: 3.3, durSec: 0.7, note: 64, gain: 0.4 },
    { atSec: 4, durSec: 0.8, note: 60, gain: 0.38 },
    { atSec: 4, durSec: 0.8, note: 62, gain: 0.4 },
    { atSec: 4.8, durSec: 2.1, note: 62, gain: 0.38 },
    { atSec: 4.8, durSec: 2.1, note: 64, gain: 0.4 },
  ],
}

// The same rest a fifth up and slow: drone A4 to G4 and back, the tune B4 C5 B4, home on A4 with B4.
const UPPER_YARD: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.2, note: 69, gain: 0.28 },
    { atSec: 0.8, durSec: 1.4, note: 71, gain: 0.28 },
    { atSec: 2.2, durSec: 1, note: 72, gain: 0.28 },
    { atSec: 3.2, durSec: 1.4, note: 67, gain: 0.28 },
    { atSec: 3.2, durSec: 3.8, note: 71, gain: 0.28 },
    { atSec: 4.6, durSec: 2.4, note: 69, gain: 0.28 },
  ],
}

// C4 with D4, then D4 with E4: the D stays and the second turns over it, on a pedal of D3.
const HINGE: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 50, gain: 0.3 },
    { atSec: 0.3, durSec: 2.7, note: 60, gain: 0.36 },
    { atSec: 0.3, durSec: 6.9, note: 62, gain: 0.36 },
    { atSec: 3, durSec: 4.2, note: 64, gain: 0.36 },
  ],
}

// D4 with E4 for one breath, a rest, then C4 with E4 and the second again for the next.
const TWO_BREATHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.5, note: 62, gain: 0.4 },
    { atSec: 0.1, durSec: 2.4, note: 64, gain: 0.38 },
    { atSec: 3.2, durSec: 0.9, note: 60, gain: 0.4 },
    { atSec: 3.2, durSec: 3.5, note: 64, gain: 0.38 },
    { atSec: 4.1, durSec: 2.6, note: 62, gain: 0.4 },
  ],
}

// A bass drone: D2 held, C3 under E3 for a moment, then D3 with E3 over the pedal.
const GROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 38, gain: 0.42 },
    { atSec: 0.5, durSec: 2.5, note: 50, gain: 0.36 },
    { atSec: 1.6, durSec: 5.4, note: 52, gain: 0.34 },
    { atSec: 3, durSec: 1, note: 48, gain: 0.36 },
    { atSec: 4, durSec: 3, note: 50, gain: 0.36 },
  ],
}

// Phrygian on E3: A3 G3 F3 over the drone, a leap under to D3, F3 against E3, then the unison.
const LOW_GRINDING: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.6, note: 52, gain: 0.4 },
    { atSec: 0.4, durSec: 0.8, note: 57, gain: 0.4 },
    { atSec: 1.2, durSec: 0.7, note: 55, gain: 0.4 },
    { atSec: 1.9, durSec: 2.9, note: 53, gain: 0.4 },
    { atSec: 2.6, durSec: 0.8, note: 50, gain: 0.4 },
    { atSec: 3.4, durSec: 3.4, note: 52, gain: 0.4 },
    { atSec: 4.8, durSec: 2, note: 51.97, gain: 0.4 },
  ],
}

// Very slow: D4, then E4 beside it, F4 over a dropped C4, and home on D4 with E4.
const SLOW_WALK: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.4, note: 62, gain: 0.42 },
    { atSec: 1.4, durSec: 2, note: 64, gain: 0.4 },
    { atSec: 3.4, durSec: 1.4, note: 60, gain: 0.42 },
    { atSec: 3.4, durSec: 1.4, note: 65, gain: 0.4 },
    { atSec: 4.8, durSec: 2.2, note: 62, gain: 0.42 },
    { atSec: 4.8, durSec: 2.2, note: 64, gain: 0.4 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'seconds-as-home-gate-of-the-sheepfold',
    name: 'Gate of the sheepfold',
    category: 'wind',
    description:
      'A single breathy horn with no vibrato, heard from across a room that rings for less than a second.',
    preview: DOORSTEP,
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { blow: 0.32, breath: 0.35, attack: 0.14, release: 0.9, vibrato: 0, volume: 0 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Across the room', params: { distance: 0.45, decay: 0.7 } },
    ],
  },
  {
    id: 'seconds-as-home-stubble-horns',
    name: 'Stubble horns',
    category: 'wind',
    description:
      'A loose section of flugelhorns that takes most of a second to swell, its players already beating, on a short dark plate.',
    preview: SLOW_WALK,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel choir',
      params: { blow: 0.35, section: 0.75, attack: 0.9, release: 2.2 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { highCut: 3200 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3, decay: 0.5 } },
    ],
  },
  {
    id: 'seconds-as-home-cart-shed-men',
    name: 'Cart shed men',
    category: 'wind',
    description:
      'Low brass, one player to a note, pushed through a pentode until its seconds grate, in a plain room.',
    preview: TENOR_PAIR,
    instrument: {
      deviceId: 'horns',
      preset: 'Trombone',
      params: { blow: 0.6, breath: 0.05, vibrato: 0, attack: 0.12, release: 0.6, volume: -0.5 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Triode glow',
        params: { circuit: 4, drive: 0.4, output: -3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'seconds-as-home-mute-behind-the-ridge',
    name: 'Mute behind the ridge',
    category: 'wind',
    description:
      'A muted trumpet high up and quiet, so far off that the open air has taken its top and its edge.',
    preview: UPPER_YARD,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { blow: 0.4, breath: 0.1, attack: 0.3, release: 1.4, vibrato: 0, volume: 1.5 },
    },
    effects: [{ deviceId: 'distance', preset: 'Open air', params: { distance: 0.8, air: 0.6 } }],
  },
  {
    id: 'seconds-as-home-tin-mouth',
    name: 'Tin mouth',
    category: 'wind',
    description:
      'An open trumpet blown soft and played back through a small horn loudspeaker in a bare room.',
    preview: CALLED_IN,
    instrument: {
      deviceId: 'horns',
      preset: 'Ballad trumpet',
      params: { blow: 0.35, breath: 0.2, vibrato: 0, attack: 0.1, release: 0.7, volume: -0.5 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Station platform',
        params: { drive: 0.3, distance: 0.4, room: 0.4, noise: 0 },
      },
    ],
  },
  {
    id: 'seconds-as-home-air-in-two-horns',
    name: 'Air in two horns',
    category: 'wind',
    description:
      'More breath than tone: two horns hardly sounding, each blurred into a cloud with no tail and doubled wide.',
    preview: SLOW_WALK,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { blow: 0.08, breath: 0.9, attack: 0.8, release: 2, volume: -1.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Soft cloud', params: { size: 260, soften: 0.6 } },
      { deviceId: 'stereo-detune', preset: 'Wider', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'seconds-as-home-horns-a-long-time-coming',
    name: 'Horns a long time coming',
    category: 'wind',
    description:
      'Full horns that take three seconds to speak, the second opening inside a long modulated space.',
    preview: HINGE,
    instrument: {
      deviceId: 'horns',
      preset: 'Glacial horns',
      params: { blow: 0.7, breath: 0.1, section: 1, attack: 3, release: 5, vibrato: 0 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 8, mix: 0.35, highCut: 5000 } },
    ],
  },
  {
    id: 'seconds-as-home-deep-row-of-three',
    name: 'Deep row of three',
    category: 'wind',
    description:
      'Soft low brass with an octave below added to every note and warmed by tape, for the pedal of three rows.',
    preview: THREE_ROWS,
    instrument: {
      deviceId: 'horns',
      preset: 'Soft tuba',
      params: { blow: 0.22, breath: 0.2, section: 0.3, attack: 0.2, release: 1.6, volume: -10 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6, up1: 0, dry: 1 } },
      { deviceId: 'saturator', preset: 'Soft tape warmth', params: { driveDb: 8 } },
    ],
  },
  {
    id: 'seconds-as-home-nasal-row',
    name: 'Nasal row',
    category: 'wind',
    description:
      'Muted brass with a thin vowel pressed on it, so each note has a throat, and a short spring behind.',
    preview: SEVEN_STEPS,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { blow: 0.55, breath: 0.05, section: 0.2, attack: 0.08, release: 0.5, volume: -2 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Thin vowel', params: { amount: 1.3 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.15, drip: 0.2 } },
    ],
  },
  {
    id: 'seconds-as-home-jug-horn',
    name: 'Jug horn',
    category: 'wind',
    description:
      "A flugelhorn sounded inside a clay pot, its own ring swallowed and the pot's low note coming up instead.",
    preview: LEAP_OFF,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { blow: 0.45, breath: 0.3, vibrato: 0, attack: 0.1, release: 1, volume: -1 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { size: 1.3, mix: 0.8 } }],
  },
  {
    id: 'seconds-as-home-brass-on-a-worn-reel',
    name: 'Brass on a worn reel',
    category: 'wind',
    description:
      'Trumpets in section, blown firm, on an old slow tape whose wow bends the second as it holds.',
    preview: THREE_ROWS,
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { blow: 0.6, section: 0.7, attack: 0.18, release: 1.4 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { wow: 0.5, hiss: 0.1, flutter: 0.25 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'seconds-as-home-fifth-laid-over',
    name: 'Fifth laid over',
    category: 'wind',
    description:
      'Every horn brings the fifth above it, and mostly what two moments share is let through, so a held tone outlasts its neighbour.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fifths',
      params: {
        type: 0,
        blow: 0.45,
        breath: 0.1,
        section: 0.3,
        attack: 0.6,
        release: 2,
        vibrato: 0,
        harmony: 1,
      },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Long hold', params: { mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'seconds-as-home-pipe-for-small-hands',
    name: 'Pipe for small hands',
    category: 'wind',
    description:
      "A quick dry muted trumpet with its body made smaller and its lows cut, a child's pipe held close.",
    preview: SEVEN_STEPS,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { blow: 0.25, breath: 0.45, attack: 0.05, release: 0.3, vibrato: 0 },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller', params: { size: -0.7 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 6000 } },
    ],
  },
  {
    id: 'seconds-as-home-priest-and-answer',
    name: 'Priest and answer',
    category: 'wind',
    description:
      'A low brass choir swelling in under a second, its hall singing a dark round vowel back, louder than the brass.',
    preview: GROUND,
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { blow: 0.3, attack: 0.8, release: 3, section: 0.5, volume: 0 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.6, decay: 4 } }],
  },
  {
    id: 'seconds-as-home-two-horns-turning',
    name: 'Two horns turning',
    category: 'wind',
    description:
      'Two flugelhorns in a slowly turning speaker cabinet, so the beat of the second is crossed by a slower one.',
    preview: PURE_SECOND,
    instrument: {
      deviceId: 'horns',
      preset: 'Open fifths pad',
      params: { blow: 0.5, breath: 0.1, section: 0, attack: 0.5, release: 1.5, harmony: 0 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.15, distance: 0.5 } }],
  },
  {
    id: 'seconds-as-home-snow-over-the-horns',
    name: 'Snow over the horns',
    category: 'wind',
    description:
      'Horns a little muffled and moved far back, with slow clouds passing over that take the light off them.',
    preview: PURE_SECOND,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.2, breath: 0.3, section: 0.2, attack: 1, release: 3, volume: 3 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Passing clouds', params: { exposure: 0.8, voice: 0.1 } },
      { deviceId: 'distance', preset: 'Through fog', params: { distance: 0.7 } },
    ],
  },
  {
    id: 'seconds-as-home-two-bows-nine-to-eight',
    name: 'Two bows, nine to eight',
    category: 'string',
    description:
      'A bowed string with no detuning and no vibrato, so the only beating is the pure second, opened wide.',
    preview: PURE_SECOND,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.4,
        release: 1,
        pressure: 0.25,
        brightness: 0.75,
        position: 0.22,
        vibrato: 0,
        detune: 0,
        body: 0.1,
        volume: -4.5,
      },
    },
    effects: [
      { deviceId: 'stereo-widener', preset: 'Wide', params: { width: 0.8 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'seconds-as-home-fiddles-on-the-bench',
    name: 'Fiddles on the bench',
    category: 'string',
    description:
      'A hard raspy bow near the bridge, close and nearly dry, with only a small wooden body around it.',
    preview: SEVEN_STEPS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: {
        attack: 0.06,
        release: 0.35,
        pressure: 0.85,
        brightness: 0.65,
        vibrato: 0,
        detune: 0,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'seconds-as-home-bow-across-the-valley',
    name: 'Bow across the valley',
    category: 'string',
    description:
      'A bow with almost no weight, far up the string, heard from the far side of a wide open place.',
    preview: UPPER_YARD,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.8, release: 2.5, vibrato: 0, detune: 2 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Far shore', params: { distance: 0.85, decay: 3.5 } },
    ],
  },
  {
    id: 'seconds-as-home-gut-row-in-the-cellar',
    name: 'Gut row in the cellar',
    category: 'string',
    description:
      'A heavy dark bow on a full wooden body for the low cadence, with a narrow dark room under it.',
    preview: TENOR_PAIR,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.3,
        release: 1.2,
        pressure: 0.75,
        brightness: 0.22,
        body: 1,
        vibrato: 0,
        detune: 3,
      },
    },
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { mix: 0.3, decay: 3 } },
    ],
  },
  {
    id: 'seconds-as-home-eighteen-cents-of-sway',
    name: 'Eighteen cents of sway',
    category: 'string',
    description:
      'Sustained strings split by eighteen cents, each note beating by itself under the beat of the second.',
    preview: HINGE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Slow beating swell',
      params: { attack: 1.2, release: 5, detune: 18, vibrato: 0, brightness: 0.45 },
    },
    effects: [{ deviceId: 'spread', preset: 'Wide pad', params: { make: 0.8 } }],
  },
  {
    id: 'seconds-as-home-lamp-on-the-string',
    name: 'Lamp on the string',
    category: 'string',
    description:
      'A pure still string tone with sines drawn after its partials, swelling in late and lingering.',
    preview: HINGE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 0.9, release: 3, brightness: 0.1, vibrato: 0 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Slow bloom',
        params: { partials: 6, attack: 3000, release: 4, mix: 0.55 },
      },
    ],
  },
  {
    id: 'seconds-as-home-ground-for-two-bows',
    name: 'Ground for two bows',
    category: 'drone',
    description:
      'A low bowed drone, a little detuned, with strings tuned to D minor ringing in sympathy under its seconds.',
    preview: GROUND,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.8,
        release: 2,
        pressure: 0.65,
        brightness: 0.3,
        body: 0.9,
        vibrato: 0,
        detune: 6,
      },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { root: 2, mix: 0.35 } },
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
    ],
  },
  {
    id: 'seconds-as-home-ice-on-the-trough',
    name: 'Ice on the trough',
    category: 'string',
    description:
      'A light bow close to the bridge, all edge and overtone, with a very slow phaser moving through it.',
    preview: PURE_SECOND,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.9, release: 3, vibrato: 0, detune: 0, brightness: 0.85 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'seconds-as-home-strings-set-to-d',
    name: 'Strings set to D',
    category: 'plucked',
    description:
      'Plucked wire with a long decay over low bowls tuned in fifths on D, the quiet end of each tail brought up.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { brightness: 0.5, decay: 18, detune: 0, body: 0.4 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Low fifths', params: { root: 2, mix: 0.3 } },
      { deviceId: 'lift', preset: 'Long tails' },
    ],
  },
  {
    id: 'seconds-as-home-amp-left-in-the-barn',
    name: 'Amp left in the barn',
    category: 'string',
    description:
      'A held string through a small driven speaker, feeding back on itself until one pure overtone of E rings over it.',
    preview: GRINDING_F,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: {
        attack: 0.35,
        release: 1.5,
        pressure: 0.5,
        brightness: 0.35,
        vibrato: 0,
        detune: 4,
        body: 0.7,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0 } },
      { deviceId: 'howl', preset: 'One pure tone', params: { distance: 6.068, mix: 0.5 } },
      { deviceId: 'tamer', preset: 'Ringing tones' },
    ],
  },
  {
    id: 'seconds-as-home-tambour-strokes',
    name: 'Tambour strokes',
    category: 'plucked',
    description:
      'Damped wooden plucks repeated by three tape heads, so each held note is struck again as it fades.',
    preview: CALLED_IN,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { brightness: 0.3, decay: 4, release: 1.5, detune: 5, volume: -5.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 330, feedback: 0.6, mix: 0.5 },
      },
    ],
  },
  {
    id: 'seconds-as-home-a-dozen-bows',
    name: 'A dozen bows',
    category: 'string',
    description:
      'One detuned bow turned into a thick flock of a dozen that keeps close together, no two in quite the same tune.',
    preview: THREE_ROWS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: { attack: 0.18, release: 1.6, vibrato: 0, detune: 12, body: 0.8 },
    },
    effects: [
      {
        deviceId: 'murmuration',
        preset: 'Thick ensemble',
        params: { mix: 0.6, range: 8, birds: 12 },
      },
    ],
  },
  {
    id: 'seconds-as-home-wire-left-hanging',
    name: 'Wire left hanging',
    category: 'plucked',
    description:
      'Long beating plucked strings smeared into a wash, so that the second outlives its own strokes.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { detune: 14, brightness: 0.4, decay: 24 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.7, highCut: 5000 } },
    ],
  },
  {
    id: 'seconds-as-home-whistled-string',
    name: 'Whistled string',
    category: 'string',
    description:
      'A held string near its middle node, hollow and whistling, its attack blurred, under a low-pass on a very slow wave.',
    preview: UPPER_YARD,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Twelfth glow',
      params: { attack: 0.8, release: 2, detune: 0, vibrato: 0, brightness: 0.6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { cutoffHz: 1100, lfoRateHz: 0.08 },
      },
      { deviceId: 'fog', preset: 'Short blur' },
    ],
  },
  {
    id: 'seconds-as-home-eh-at-the-well',
    name: 'Eh at the well',
    category: 'voice',
    description:
      'A small section on an open eh with no vibrato at all, close together, in a tight stone chamber.',
    preview: DOORSTEP,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: {
        vibrato: 0,
        motion: 0.05,
        ensemble: 0.35,
        breath: 0.15,
        width: 0.5,
        attack: 0.25,
        release: 0.8,
        volume: -6,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.22 } }],
  },
  {
    id: 'seconds-as-home-fathers-at-the-table',
    name: 'Fathers at the table',
    category: 'voice',
    description:
      'Few deep voices on ah, straight and close, pushed a little hard through tape so the low second growls.',
    preview: TENOR_PAIR,
    instrument: {
      deviceId: 'choir',
      preset: 'Basses ah',
      params: { voice: 0.8, vibrato: 0, ensemble: 0.15, attack: 0.2, release: 0.7, motion: 0 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { drive: 0.45, output: -2 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'seconds-as-home-throat-in-the-nose',
    name: 'Throat in the nose',
    category: 'voice',
    description:
      'One straight voice on ee with almost no breath, its middle pushed forward like singing through the nose.',
    preview: SEVEN_STEPS,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: {
        vowel: 0.48,
        voice: 1.05,
        vibrato: 0,
        breath: 0.02,
        attack: 0.08,
        release: 0.35,
        tone: 5000,
        volume: -5.5,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Resonant peak',
        params: { cutoffHz: 1300, envAmount: 10, resonance: 2.2 },
      },
      { deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'seconds-as-home-reapers-two-fields-off',
    name: 'Reapers two fields off',
    category: 'voice',
    description:
      "Women's voices on oh in full section, darkened by two fields of open air, with hardly any echo.",
    preview: CALLED_IN,
    instrument: {
      deviceId: 'choir',
      preset: 'Tenors oh',
      params: { voice: 1.25, vibrato: 0, vowel: 0.7, ensemble: 0.8, attack: 0.35, release: 1.2 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Open air', params: { distance: 0.9, air: 0.8, level: 1 } },
    ],
  },
  {
    id: 'seconds-as-home-hum-through-a-floor',
    name: 'Hum through a floor',
    category: 'voice',
    description:
      'A dark hum of low voices played through a loudspeaker shut in a cupboard, with the noise of an empty room.',
    preview: LOW_GRINDING,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { vibrato: 0, voice: 0.9, tone: 900, attack: 0.35, release: 2, volume: -4.5 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'In the cupboard',
        params: { treble: -0.5, bass: 0.4, noise: 0 },
      },
      { deviceId: 'noise-floor', preset: 'Empty room' },
    ],
  },
  {
    id: 'seconds-as-home-breath-before-sunup',
    name: 'Breath before sunup',
    category: 'voice',
    description:
      'Voices that are nearly all air, two close pitches barely in them, with light gusts of wind crossing the note.',
    preview: HINGE,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { breath: 0.9, vowel: 0.2, attack: 1.5, release: 3, motion: 0.3, volume: -14.5 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Breezy day', params: { exposure: 0.55, voice: 0.25 } },
      { deviceId: 'lift', preset: 'Air on top' },
    ],
  },
  {
    id: 'seconds-as-home-thirty-on-a-slope',
    name: 'Thirty on a slope',
    category: 'voice',
    description:
      'A wide full section on ah, more breath than tone, its lows thinned and a hall let in and out in slow waves.',
    preview: THREE_ROWS,
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: {
        vibrato: 0,
        ensemble: 1,
        width: 1,
        breath: 0.7,
        voice: 1,
        tone: 2600,
        attack: 0.22,
        release: 2,
        motion: 0.1,
        volume: -5,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin' },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4, decay: 3.5 } },
    ],
  },
  {
    id: 'seconds-as-home-whistle-over-the-drone',
    name: 'Whistle over the drone',
    category: 'voice',
    description:
      'Dark round voices with a narrow overtone stepping through the harmonics of D above the held second.',
    preview: SLOW_WALK,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: {
        vowel: 0.7,
        voice: 0.95,
        ensemble: 0.4,
        attack: 0.7,
        release: 2.4,
        motion: 0.1,
        volume: -4.5,
      },
    },
    effects: [
      { deviceId: 'overtone-singer', preset: 'Slow wander', params: { root: 2, mix: 0.75 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'seconds-as-home-girls-on-the-upper-path',
    name: 'Girls on the upper path',
    category: 'voice',
    description:
      'Small bright voices on ee, high and soft, each band of them flickering slowly and apart from the rest, on a hazy plate.',
    preview: UPPER_YARD,
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: {
        vibrato: 0,
        motion: 0.3,
        ensemble: 0.5,
        attack: 0.6,
        release: 2.5,
        tone: 7000,
        breath: 0.5,
        volume: -2.5,
      },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Slow weather', params: { depth: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'seconds-as-home-long-grass-voices',
    name: 'Long grass voices',
    category: 'voice',
    description:
      'Distant voices over two seconds in coming, their tail drifting down by fifths and darkening as it goes.',
    preview: HINGE,
    instrument: {
      deviceId: 'choir',
      preset: 'Distant choir',
      params: {
        vibrato: 0,
        attack: 2.4,
        release: 7,
        vowel: 0.85,
        breath: 0.3,
        motion: 0.25,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Falling fifths', params: { mix: 0.4, decay: 7 } },
    ],
  },
  {
    id: 'seconds-as-home-short-calls-in-seven',
    name: 'Short calls in seven',
    category: 'voice',
    description:
      'Quick clipped ah, cut off at once, each call answered by its own plain slap from the wall opposite.',
    preview: SEVEN_STEPS,
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: {
        breath: 0.25,
        ensemble: 0.3,
        attack: 0.02,
        release: 0.25,
        voice: 1.2,
        volume: -5.5,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.4, time: 190 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.12 } },
    ],
  },
  {
    id: 'seconds-as-home-giantess-and-sister',
    name: 'Giantess and sister',
    category: 'voice',
    description:
      'Small straight voices near ah made huge in the body at the same pitch, slow to come, their tone tilted darker.',
    preview: PURE_SECOND,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: {
        vowel: 0.1,
        voice: 1.4,
        vibrato: 0,
        ensemble: 0.1,
        attack: 0.5,
        release: 1.5,
        breath: 0.1,
        volume: -5,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'Giant', params: { tone: -0.3 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'seconds-as-home-vowels-in-a-barrel',
    name: 'Vowels in a barrel',
    category: 'voice',
    description:
      "Voices drifting from vowel to vowel inside a stopped barrel, the barrel's own ring joining the drone.",
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { vibrato: 0, motion: 0.9, attack: 0.7, release: 2.2, ensemble: 0.4, volume: -5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.6, size: 2.4 } },
      { deviceId: 'currents', preset: 'Gentle drift' },
    ],
  },
  {
    id: 'seconds-as-home-reed-on-the-doorstep',
    name: 'Reed on the doorstep',
    category: 'wind',
    description:
      'A straight clarinet in the middle of its blow, close by a wall, with only the wall answering.',
    preview: DOORSTEP,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { blow: 0.5, breath: 0.15, attack: 0.12, release: 0.4, volume: 1 },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.2 } },
      { deviceId: 'stereo-detune', preset: 'Faint width' },
    ],
  },
  {
    id: 'seconds-as-home-contra-row',
    name: 'Contra row',
    category: 'wind',
    description:
      'A bass clarinet blown firm, its lows thickened by a transformer, the pair a step apart in a dark hall.',
    preview: GROUND,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { blow: 0.6, breath: 0.2, attack: 0.3, release: 1.2 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'seconds-as-home-double-reed-unshaken',
    name: 'Double reed unshaken',
    category: 'wind',
    description:
      'A double reed with its vibrato taken off, warm and half covered, in a chapel that sings an oo behind.',
    preview: LEAP_OFF,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { vibrato: 0, blow: 0.35, breath: 0.4, attack: 0.1, release: 0.8 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.4, decay: 3 } }],
  },
  {
    id: 'seconds-as-home-out-of-no-sound',
    name: 'Out of no sound',
    category: 'wind',
    description:
      'A clarinet rising from nothing over a second and a half, a slow loose chorus setting its own beat under the second.',
    preview: HINGE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { blow: 0.45, breath: 0.2, attack: 1.6, release: 2.6, volume: 1.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.12, depth: 60, mix: 0.5 } },
    ],
  },
  {
    id: 'seconds-as-home-wedding-pipe-far-off',
    name: 'Wedding pipe far off',
    category: 'wind',
    description:
      'A bright conical reed blown hard and moved to the next house but one, its sharpest tones turned down.',
    preview: SEVEN_STEPS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { blow: 0.85, breath: 0.08, vibrato: 0, attack: 0.04, release: 0.25, volume: 1.5 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door', params: { distance: 0.75 } },
      { deviceId: 'tamer', preset: 'Harsh sample' },
    ],
  },
  {
    id: 'seconds-as-home-growl-in-the-byre',
    name: 'Growl in the byre',
    category: 'wind',
    description:
      'A wide bore tenor growling under its breath through a warm stack, two low notes a step apart.',
    preview: LOW_GRINDING,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: { growl: 0.35, blow: 0.4, vibrato: 0, breath: 0.3, attack: 0.25, release: 0.7 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Warm stack', params: { drive: 0.35, noise: 0 } }],
  },
  {
    id: 'seconds-as-home-bag-and-chanter',
    name: 'Bag and chanter',
    category: 'wind',
    description:
      'A hard even reed that never swells, an octave below added, two copies split a few cents to the sides.',
    preview: SEVEN_STEPS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: {
        bore: 0.5,
        blow: 0.9,
        breath: 0.03,
        vibrato: 0,
        attack: 0.03,
        release: 0.12,
        volume: 2.5,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5, up1: 0 } },
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'seconds-as-home-pipes-out-of-a-hum',
    name: 'Pipes out of a hum',
    category: 'wind',
    description:
      'A hum of a reed, hardly blown, with slow pipes from an octave below it to two octaves above speaking late.',
    preview: HINGE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { blow: 0.06, attack: 0.5, release: 2, volume: -1 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Slow bloom', params: { mix: 0.65 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'seconds-as-home-paper-and-comb',
    name: 'Paper and comb',
    category: 'wind',
    description: 'A whispered reed, mostly paper noise, with a hollow tube pressed on its colour.',
    preview: CALLED_IN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { breath: 0.8, blow: 0.12, attack: 0.25, release: 0.9, volume: -1 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 1.3 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'seconds-as-home-tongue-against-the-reed',
    name: 'Tongue against the reed',
    category: 'wind',
    description:
      'A fluttered tongue rattling the note while a swell of reverb rises after it and falls again.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { growl: 0.8, blow: 0.35, breath: 0.4, attack: 0.4, release: 1, volume: 1.5 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.45, time: 1.6 } }],
  },
  {
    id: 'seconds-as-home-subtone-on-a-cassette',
    name: 'Subtone on a cassette',
    category: 'wind',
    description:
      'A breathy wide bore tenor, very quiet, on a four-track cassette with its wow left in.',
    preview: TENOR_PAIR,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { vibrato: 0, breath: 0.65, attack: 0.2, release: 0.8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0.4, hiss: 0.1 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'seconds-as-home-reed-letting-go',
    name: 'Reed letting go',
    category: 'wind',
    description:
      'A reed with a four second fade whose tail sags in pitch as it ages, so the held second sinks as it dies.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Slow fade reed',
      params: { blow: 0.55, attack: 0.15, release: 4, volume: -1.5 },
    },
    effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.5 } }],
  },
  {
    id: 'seconds-as-home-reed-in-slow-lungs',
    name: 'Reed in slow lungs',
    category: 'wind',
    description:
      'An alto reed without its vibrato inside a slow cycle of breath that opens and closes its level and colour.',
    preview: UPPER_YARD,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Ballad alto',
      params: {
        bore: 0.8,
        blow: 0.4,
        vibrato: 0,
        breath: 0.35,
        attack: 0.3,
        release: 1.4,
        volume: 2,
      },
    },
    effects: [
      { deviceId: 'breath', preset: 'Calm breath', params: { depth: 0.45, air: 0.15 } },
      { deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'seconds-as-home-lid-of-the-harmonium',
    name: 'Lid of the harmonium',
    category: 'organ',
    description:
      'A plain reed rank alone, no celeste and little wind, in a small room with the lid shut on its top.',
    preview: DOORSTEP,
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: {
        sub: 0,
        octave: 0,
        twelfth: 0,
        fifteenth: 0,
        reed: 0.8,
        celeste: 0,
        bellows: 0.1,
        breath: 0.1,
        tone: 1500,
      },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.15 } },
      { deviceId: 'tamer', preset: 'Broad and slow' },
    ],
  },
  {
    id: 'seconds-as-home-squeezebox-in-a-doorway',
    name: 'Squeezebox in a doorway',
    category: 'organ',
    description:
      'A full celeste beating against one reed and a twelfth, speaking quickly inside a small rattling tin.',
    preview: SEVEN_STEPS,
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: {
        bellows: 0.4,
        tone: 2200,
        celeste: 1,
        octave: 0,
        reed: 0.35,
        twelfth: 0.4,
        attack: 0.06,
      },
    },
    effects: [{ deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.55 } }],
  },
  {
    id: 'seconds-as-home-wooden-drone-box',
    name: 'Wooden drone box',
    category: 'drone',
    description:
      'A drone box of reeds pumped deeply by its bellows, with strings tuned to D minor ringing in its wood.',
    preview: HINGE,
    instrument: {
      deviceId: 'organ',
      preset: 'Shruti box',
      params: { breath: 0.3, attack: 0.7, release: 1.6, tone: 1700 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { root: 2, mix: 0.4, decay: 4 } },
      { deviceId: 'vessel', preset: 'Hint of wood' },
    ],
  },
  {
    id: 'seconds-as-home-slow-celeste-pair',
    name: 'Slow celeste pair',
    category: 'organ',
    description:
      'The plain rank against its celeste over a deep sub, a slow beat inside each note, opened out in a dark modulated space.',
    preview: SLOW_WALK,
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { celeste: 1, sub: 0.5, octave: 0, reed: 0, breath: 0.1, attack: 0.8, release: 3 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.3, decay: 6 } }],
  },
  {
    id: 'seconds-as-home-two-flues-and-a-plate',
    name: 'Two flues and a plate',
    category: 'organ',
    description:
      'A beating pair of flutes with a thin fifteenth on top, a little slow to speak, sent to a bright plate.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { attack: 0.35, release: 1.2, tone: 5500, fifteenth: 0.15 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3, decay: 0.6 } },
      { deviceId: 'spread', preset: 'Air only' },
    ],
  },
  {
    id: 'seconds-as-home-second-a-twelfth-up',
    name: 'Second a twelfth up',
    category: 'organ',
    description:
      'A plain flute with only its twelfth drawn, so each second is heard once more a twelfth higher, in a far hall.',
    preview: LOW_GRINDING,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { attack: 0.25, release: 1.4, breath: 0.15 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.4 } }],
  },
  {
    id: 'seconds-as-home-pump-room-in-seven',
    name: 'Pump room in seven',
    category: 'organ',
    description:
      'A wheezing pump organ with its twelfth forward and a strong pull of the bellows, on a worn tape.',
    preview: SEVEN_STEPS,
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: {
        reed: 0.2,
        sub: 0,
        octave: 0,
        twelfth: 0.9,
        fifteenth: 0.4,
        attack: 0.06,
        release: 0.2,
        tone: 4200,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.15, wow: 0.35 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'seconds-as-home-wind-chest-open',
    name: 'Wind chest open',
    category: 'organ',
    description:
      'A flute that is nearly all wind from the chest, blurred to a cloud, with light rain tapping on the roof.',
    preview: UPPER_YARD,
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: { breath: 0.8, attack: 0.5, release: 1.6, sub: 0.1 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.6 } },
      { deviceId: 'weather', preset: 'Light rain', params: { exposure: 0.4 } },
    ],
  },
  {
    id: 'seconds-as-home-pedal-of-the-low-yard',
    name: 'Pedal of the low yard',
    category: 'organ',
    description:
      'A deep organ sub driven by a transformer so that its low second has edges, narrow and dry.',
    preview: THREE_ROWS,
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: {
        volume: -16,
        sub: 0.8,
        reed: 0.35,
        celeste: 0,
        bellows: 0.15,
        attack: 0.18,
        release: 1.5,
        tone: 1100,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.55 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'seconds-as-home-chapel-next-door',
    name: 'Chapel next door',
    category: 'organ',
    description:
      'A whole organ behind a thick wall, only its lows let through, set farther off with its quiet overtones brought forward.',
    preview: THREE_ROWS,
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { attack: 0.2, release: 1, tone: 600, reed: 0.2 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door', params: { distance: 0.6 } },
      { deviceId: 'reveal', preset: 'Overtones' },
    ],
  },
  {
    id: 'seconds-as-home-flutes-for-the-threshold',
    name: 'Flutes for the threshold',
    category: 'organ',
    description:
      'Open chapel flutes high up, with five dark bowls tuned in fifths on A singing along.',
    preview: UPPER_YARD,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { sub: 0.2, octave: 0.2, fifteenth: 0, attack: 0.2, release: 1, volume: -5 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Five dark bowls', params: { root: 9, scale: 4, mix: 0.4 } },
    ],
  },
  {
    id: 'seconds-as-home-every-rank-held-back',
    name: 'Every rank held back',
    category: 'organ',
    description:
      'A full organ, no rank drawn all the way and the top taken off, its seconds held even by a hard compressor in a dark hall.',
    preview: CALLED_IN,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { tone: 2000, octave: 0.5, fifteenth: 0.3, reed: 0.4, attack: 0.2, release: 1.2 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Dense pad' },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'seconds-as-home-six-seconds-of-ranks',
    name: 'Six seconds of ranks',
    category: 'organ',
    description:
      'Upper ranks that open over two seconds and close over six, every band swelling on a slow tide of its own.',
    preview: HINGE,
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: { attack: 2.4, release: 6, tone: 4200, sub: 0.4, reed: 0.15 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide', params: { rate: 0.15 } },
      { deviceId: 'stereo-detune', preset: 'Cloud', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'seconds-as-home-dusk-with-a-second-in-it',
    name: 'Dusk with a second in it',
    category: 'pad',
    description:
      'A dark synthetic brass that starts shut and swells as it is held, with a slow chorus left to beat.',
    preview: GRINDING_F,
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: {
        brilliance: 750,
        contour: 0.35,
        attack: 0.35,
        swell: 0.8,
        detune: 3,
        release: 2.5,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { rate: 0.2, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'seconds-as-home-pipes-with-no-sway',
    name: 'Pipes with no sway',
    category: 'pad',
    description:
      'Synthetic pipes with no detuning and no swell, so nothing beats but the second, in a stone stairwell.',
    preview: DOORSTEP,
    instrument: {
      deviceId: 'aurora',
      preset: 'Still pipes',
      params: { brilliance: 1800, attack: 0.12, release: 0.8, detune: 0, volume: -7.5 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.4, decay: 2 } },
    ],
  },
  {
    id: 'seconds-as-home-loose-reeds-on-a-cart',
    name: 'Loose reeds on a cart',
    category: 'pad',
    description:
      'Synthetic reeds far out of tune with themselves, their own fast beat lying over the second, kept mid and dry.',
    preview: CALLED_IN,
    instrument: {
      deviceId: 'aurora',
      preset: 'Loose reeds',
      params: { detune: 24, brilliance: 1500, resonance: 0.45, attack: 0.15, release: 0.7 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Phone line',
        params: { driveDb: 4, cutoffHz: 1000, mix: 0.7 },
      },
    ],
  },
  {
    id: 'seconds-as-home-vowel-opening-twice',
    name: 'Vowel opening twice',
    category: 'pad',
    description:
      'A resonant pad whose filter opens like a mouth on each breath, sung back by a small chapel.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'aurora',
      preset: 'Opening vowel',
      params: { attack: 0.9, release: 2, detune: 2, resonance: 0.6, volume: -5 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.35, decay: 3 } }],
  },
  {
    id: 'seconds-as-home-strings-in-a-frost',
    name: 'Strings in a frost',
    category: 'pad',
    description:
      'A bright thin string pad with its lows cut off, roughened and thinned further by an early frost.',
    preview: UPPER_YARD,
    instrument: {
      deviceId: 'aurora',
      preset: 'Silver strings',
      params: { brilliance: 5000, lowCut: 500, attack: 0.6, release: 2.5, detune: 9 },
    },
    effects: [
      { deviceId: 'seasons', preset: 'First frost' },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'seconds-as-home-barn-swell',
    name: 'Barn swell',
    category: 'pad',
    description:
      'A deep swell with nearly no top, detuned fourteen cents and half of it pushed into a blown speaker.',
    preview: HINGE,
    instrument: {
      deviceId: 'aurora',
      preset: 'Deep swell',
      params: { attack: 2, release: 4, detune: 14, brilliance: 420 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Blown speaker', params: { driveDb: 8, mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'seconds-as-home-phase-of-the-second',
    name: 'Phase of the second',
    category: 'pad',
    description:
      'A hollow-edged pad a cent and a half from itself, phasing slowly, carried round the head in a figure of eight.',
    preview: PURE_SECOND,
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow phasing',
      params: {
        brilliance: 1300,
        attack: 0.7,
        release: 2,
        lowCut: 320,
        resonance: 0.5,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow eight', params: { rate: 0.12 } },
      { deviceId: 'spring-reverb', preset: 'Single slack coil', params: { mix: 0.12 } },
    ],
  },
  {
    id: 'seconds-as-home-metal-in-the-throat',
    name: 'Metal in the throat',
    category: 'pad',
    description:
      'A ring-modulated brass, its clang held low, read through a round vowel and warmed by a tube.',
    preview: GRINDING_F,
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { ring: 0.3, brilliance: 1300, attack: 0.3, release: 2.5, contour: 0.3, volume: -3 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel', params: { amount: 1.1 } },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 5 } },
    ],
  },
  {
    id: 'seconds-as-home-muted-row-in-a-tunnel',
    name: 'Muted row in a tunnel',
    category: 'pad',
    description:
      'A pinched resonant pad, all middle, with its repeats scattered to the sides like voices off a tunnel wall.',
    preview: LEAP_OFF,
    instrument: {
      deviceId: 'aurora',
      preset: 'Muted trumpet',
      params: { resonance: 0.65, lowCut: 800, brilliance: 2200, attack: 0.12, release: 0.9 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.35 } }],
  },
  {
    id: 'seconds-as-home-viols-across-a-table',
    name: 'Viols across a table',
    category: 'string',
    description:
      'Viols bowed near the bridge with no air and no vibrato, three to a note exactly together, in a short bright tank.',
    preview: DOORSTEP,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: {
        players: 3,
        mute: 0.1,
        bow: 0.92,
        attack: 0.15,
        release: 0.5,
        width: 0.8,
        volume: -3,
      },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.24, decay: 1.2 } },
    ],
  },
  {
    id: 'seconds-as-home-one-fiddle-two-strings',
    name: 'One fiddle two strings',
    category: 'string',
    description:
      'A single close player bowing both notes of the second, bow near the bridge, on a dusty fast record.',
    preview: SEVEN_STEPS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { vibrato: 0, bow: 0.7, attack: 0.06, release: 0.25, air: 0.3, volume: -2.5 },
    },
    effects: [{ deviceId: 'vinyl', preset: 'Ballroom 78', params: { crackle: 0.15, warp: 0.1 } }],
  },
  {
    id: 'seconds-as-home-muted-row-of-five',
    name: 'Muted row of five',
    category: 'string',
    description:
      'Five muted players swelling over a second and a half, and a soft pad of strings growing in behind them.',
    preview: HINGE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 1.5, release: 2.5, scatter: 0.2, volume: -3.5 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Slow swell', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'seconds-as-home-bows-of-breath',
    name: 'Bows of breath',
    category: 'string',
    description:
      'Two players a note, their bows mostly air, the top lifted, in a soft cloud of their own grains.',
    preview: UPPER_YARD,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: {
        players: 2,
        attack: 0.7,
        release: 2,
        air: 1,
        bow: 0.5,
        scatter: 0.7,
        width: 1,
        volume: -2.5,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright' },
      { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'seconds-as-home-ragged-on-the-unison',
    name: 'Ragged on the unison',
    category: 'string',
    description:
      'Six players who do not quite agree, wide, so even the unison at the end of the phrase is left beating.',
    preview: GRINDING_F,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { vibrato: 0, attack: 0.25, release: 1.2, mute: 0.1, volume: -2.5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } }],
  },
  {
    id: 'seconds-as-home-halo-on-a-pure-second',
    name: 'Halo on a pure second',
    category: 'string',
    description:
      'Three still players with the bow far from the bridge, a faint glow climbing a fifth behind the second.',
    preview: PURE_SECOND,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { attack: 1, release: 3, volume: -4.5 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Narrow fifth', params: { mix: 0.3, decay: 4 } }],
  },
  {
    id: 'seconds-as-home-lone-bow-on-the-step',
    name: 'Lone bow on the step',
    category: 'string',
    description:
      'One wandering player on each note, no vibrato and some mute, walking slowly nearer and farther.',
    preview: LEAP_OFF,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wandering solo',
      params: { attack: 0.12, release: 1.2, mute: 0.6, scatter: 0.8, volume: -1 },
    },
    effects: [{ deviceId: 'distance', preset: 'Slow tide', params: { distance: 0.5, decay: 1 } }],
  },
  {
    id: 'seconds-as-home-low-bows-in-pairs',
    name: 'Low bows in pairs',
    category: 'string',
    description:
      'Two dark players a note, bowed straight and slow, with a shadow of sines an octave under them.',
    preview: HINGE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Slow dark bows',
      params: { players: 2, vibrato: 0, attack: 0.8, release: 2, mute: 0.5 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Low shadow', params: { mix: 0.5 } }],
  },
  {
    id: 'seconds-as-home-mirror-set-on-d',
    name: 'Mirror set on D',
    category: 'pad',
    description:
      'Noise sung in bands on the white keys and mirrored round D, an E bringing its C, in a far hall.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: {
        center: 62,
        resonance: 32,
        width: 95,
        attack: 0.5,
        release: 1.6,
        mode: 0,
        octaflipEnabled: 0,
        scale: 4,
        root: 2,
      },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.55 } },
      { deviceId: 'fet-limiter', preset: 'Light touch', params: { outputGain: 0 } },
    ],
  },
  {
    id: 'seconds-as-home-breath-round-the-drone',
    name: 'Breath round the drone',
    category: 'texture',
    description:
      'Breathy bands at the played pitch only, opening and closing slowly, with a plain tape slap behind them.',
    preview: SLOW_WALK,
    instrument: {
      deviceId: 'thesis',
      preset: 'Thesis Default',
      params: {
        resonance: 22,
        width: 90,
        attack: 0.8,
        release: 2.4,
        mode: 1,
        breatheRate: 0.2,
        mirrorEnabled: 0,
        octaflipEnabled: 0,
        scale: 4,
        root: 2,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.3 } },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 5 } },
    ],
  },
  {
    id: 'seconds-as-home-phrygian-kiln',
    name: 'Phrygian kiln',
    category: 'texture',
    description:
      'Narrow bands in the Phrygian mode on E, each low note copied an octave up, drifting slightly, through a hot valve.',
    preview: LOW_GRINDING,
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: {
        center: 64,
        resonance: 35,
        attack: 0.5,
        release: 2,
        mirrorMiddleEnabled: 0,
        mirrorEnabled: 0,
        octaflipEnabled: 1,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { noise: 0 } },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: -5 } },
    ],
  },
  {
    id: 'seconds-as-home-gravity-toward-home',
    name: 'Gravity toward home',
    category: 'texture',
    description:
      'Breathy bands held still, every note bringing the home note D in with it, loosened by a wide slow detuned copy.',
    preview: HINGE,
    instrument: {
      deviceId: 'thesis',
      preset: 'Gravity Well',
      params: {
        center: 62,
        resonance: 50,
        attack: 1,
        release: 3,
        strum: 0,
        mode: 0,
        mirrorEnabled: 0,
        centerEnabled: 1,
        middleEnabled: 0,
        octaflipEnabled: 0,
        scale: 4,
        root: 2,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Spiral', params: { mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 0 } },
    ],
  },
  {
    id: 'seconds-as-home-two-pulses-apart',
    name: 'Two pulses apart',
    category: 'pad',
    description:
      'Two pulse oscillators a few cents apart through a nasal band, slow to open, with no movement but the beat.',
    preview: TENOR_PAIR,
    instrument: {
      deviceId: 'ember',
      preset: 'Hollow Pad',
      params: {
        osc2Shape: 1,
        osc2Coarse: 0,
        osc2Fine: 7,
        osc1Pw: 0.2,
        osc2Pw: 0.25,
        filterType: 2,
        cutoff: 900,
        resonance: 0.3,
        unisonVoices: 1,
        ampAttack: 0.3,
        ampRelease: 1.2,
        lfo1Amount: 0,
        lfo2Amount: 0,
        volume: 6,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.25 } }],
  },
  {
    id: 'seconds-as-home-drone-under-the-eaves',
    name: 'Drone under the eaves',
    category: 'drone',
    description:
      'A dark low drone of saw and pulse, its two voices close together, and a slow filter wave under the second.',
    preview: HINGE,
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: {
        cutoff: 420,
        unisonVoices: 2,
        unisonDetune: 8,
        ampAttack: 1,
        ampRelease: 3,
        lfo1Amount: 0.15,
        noiseLevel: 0,
        volume: -13.5,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe', params: { mix: 0.4 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
  {
    id: 'seconds-as-home-triangle-throats',
    name: 'Triangle throats',
    category: 'voice',
    description:
      'Two soft triangle voices, one a side and three cents apart, with an open vowel pressed hard on them.',
    preview: PURE_SECOND,
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: {
        osc1Shape: 2,
        osc2Shape: 2,
        osc2Fine: 0,
        subLevel: 0,
        unisonVoices: 2,
        unisonDetune: 3,
        unisonSpread: 1,
        cutoff: 2600,
        lfo1Amount: 0,
        lfo2Amount: 0,
        ampAttack: 0.6,
        ampRelease: 2,
      },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Open vowel', params: { amount: 1.8 } },
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 10 } },
    ],
  },
  {
    id: 'seconds-as-home-wide-field-of-saws',
    name: 'Wide field of saws',
    category: 'pad',
    description:
      'Detuned saw strings in four wide voices, darkened and lost in a fog that has no tail of its own.',
    preview: CALLED_IN,
    instrument: {
      deviceId: 'ember',
      preset: 'Slow strings',
      params: {
        ampAttack: 0.35,
        ampRelease: 1.4,
        filterAttack: 0.3,
        osc2Fine: 5,
        cutoff: 2000,
        lfo1Amount: 0,
        unisonVoices: 4,
        unisonDetune: 14,
        unisonSpread: 1,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'Dark bank', params: { mix: 0.7 } },
      { deviceId: 'spread', preset: 'Firm bass' },
    ],
  },
  {
    id: 'seconds-as-home-reeds-that-hold-still',
    name: 'Reeds that hold still',
    category: 'voice',
    description:
      'A reedy flock that hardly strays, gathering from both sides and then holding, with a faint harmonic tremolo.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'flock',
      preset: 'Reed choir',
      params: { birds: 4, gather: 0.5, stray: 0.06, octaves: 0, tone: 0.8, leave: 1.2, volume: -3 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.25 } },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { depth: 0.25 } },
    ],
  },
  {
    id: 'seconds-as-home-pair-from-below',
    name: 'Pair from below',
    category: 'voice',
    description:
      'Two hollow voices a note, sliding up from below onto D and E and leaving slowly, with a faint octave above.',
    preview: SLOW_WALK,
    instrument: {
      deviceId: 'flock',
      preset: 'Hollow pair',
      params: { gather: 0.7, stray: 0.05, tone: 0.4, leave: 2.4 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave' },
      { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'seconds-as-home-low-flock-at-the-well',
    name: 'Low flock at the well',
    category: 'pad',
    description:
      'Seven low reedy voices rising onto each note, murmuring slowly apart by a hair, deep in a well.',
    preview: GROUND,
    instrument: {
      deviceId: 'flock',
      preset: 'Low murmur',
      params: { volume: -13.5, gather: 0.45, stray: 0.15, octaves: 0, leave: 2 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Deep well', params: { mix: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Slow fader' },
    ],
  },
  {
    id: 'seconds-as-home-stair-that-stays',
    name: 'Stair that stays',
    category: 'drone',
    description:
      'Stacked octaves with no motion at all, so a second is heard in six registers and goes nowhere.',
    preview: HINGE,
    instrument: {
      deviceId: 'staircase',
      preset: 'Hollow pad',
      params: { motion: 0, speed: 0, span: 6, shape: 0.15, chorus: 0.2, attack: 1, release: 3 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone', params: { highCut: 5000 } },
      { deviceId: 'around', preset: 'Barely moving' },
    ],
  },
  {
    id: 'seconds-as-home-reed-rungs-on-a-drone',
    name: 'Reed rungs on a drone',
    category: 'drone',
    description:
      'Reedy octaves stepping very slowly through the held notes, so the second keeps changing its upper voice.',
    preview: GRINDING_F,
    instrument: {
      deviceId: 'staircase',
      preset: 'Reed stairs',
      params: { speed: 0.15, slide: 0.6, shape: 0.7, chorus: 0.1, attack: 0.25, release: 1.6 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
      { deviceId: 'glimmer', preset: 'Broad swells', params: { depth: 0.4 } },
    ],
  },
  {
    id: 'seconds-as-home-low-stones-of-the-yard',
    name: 'Low stones of the yard',
    category: 'drone',
    description:
      'A low stack of octaves sinking so slowly it seems to rest, rough with odd overtones and just under water.',
    preview: GROUND,
    instrument: {
      deviceId: 'staircase',
      preset: 'Low tide',
      params: { speed: -0.04, shape: 0.5, attack: 1.2, release: 3, centre: 160 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0 } },
      { deviceId: 'stereo-detune', preset: 'Shadow' },
    ],
  },
]
