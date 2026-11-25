import { type FactoryPreset, type Phrase } from '../types'

// A tune of five notes (up two steps of the white keys and back) that never changes, over a
// low note that does, so the same notes are another mode each time. Twenty groups of five:
// a drone on one root, then four voices set in the light of that root. A drone of unisons or
// octaves plays the tune over itself; one with a fifth in it plays only what stays diatonic.

// A B C B A three times over a fifth on D (5 6 b7, Dorian), on F (3 #4 5, Lydian), on E (4 5 b6, Phrygian).
const LIT_A: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 38, gain: 0.45 },
    { atSec: 0, durSec: 2.2, note: 45, gain: 0.35 },
    { atSec: 0, durSec: 0.42, note: 69, gain: 0.6 },
    { atSec: 0.42, durSec: 0.42, note: 71, gain: 0.6 },
    { atSec: 0.84, durSec: 0.56, note: 72, gain: 0.65 },
    { atSec: 1.4, durSec: 0.42, note: 71, gain: 0.6 },
    { atSec: 1.82, durSec: 0.42, note: 69, gain: 0.55 },
    { atSec: 2.24, durSec: 2.2, note: 41, gain: 0.45 },
    { atSec: 2.24, durSec: 2.2, note: 48, gain: 0.35 },
    { atSec: 2.24, durSec: 0.42, note: 69, gain: 0.6 },
    { atSec: 2.66, durSec: 0.42, note: 71, gain: 0.6 },
    { atSec: 3.08, durSec: 0.56, note: 72, gain: 0.65 },
    { atSec: 3.64, durSec: 0.42, note: 71, gain: 0.6 },
    { atSec: 4.06, durSec: 0.42, note: 69, gain: 0.55 },
    { atSec: 4.48, durSec: 2.2, note: 40, gain: 0.45 },
    { atSec: 4.48, durSec: 2.2, note: 47, gain: 0.35 },
    { atSec: 4.48, durSec: 0.42, note: 69, gain: 0.6 },
    { atSec: 4.9, durSec: 0.42, note: 71, gain: 0.6 },
    { atSec: 5.32, durSec: 0.56, note: 72, gain: 0.65 },
    { atSec: 5.88, durSec: 0.42, note: 71, gain: 0.6 },
    { atSec: 6.3, durSec: 0.42, note: 69, gain: 0.55 },
  ],
}

// C D E D C over D (b7 1 2, Dorian), over F (5 6 7, Lydian), over A (b3 4 5, Aeolian).
const LIT_C: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 38, gain: 0.45 },
    { atSec: 0, durSec: 2.2, note: 45, gain: 0.35 },
    { atSec: 0, durSec: 0.42, note: 72, gain: 0.6 },
    { atSec: 0.42, durSec: 0.42, note: 74, gain: 0.6 },
    { atSec: 0.84, durSec: 0.56, note: 76, gain: 0.65 },
    { atSec: 1.4, durSec: 0.42, note: 74, gain: 0.6 },
    { atSec: 1.82, durSec: 0.42, note: 72, gain: 0.55 },
    { atSec: 2.24, durSec: 2.2, note: 41, gain: 0.45 },
    { atSec: 2.24, durSec: 2.2, note: 48, gain: 0.35 },
    { atSec: 2.24, durSec: 0.42, note: 72, gain: 0.6 },
    { atSec: 2.66, durSec: 0.42, note: 74, gain: 0.6 },
    { atSec: 3.08, durSec: 0.56, note: 76, gain: 0.65 },
    { atSec: 3.64, durSec: 0.42, note: 74, gain: 0.6 },
    { atSec: 4.06, durSec: 0.42, note: 72, gain: 0.55 },
    { atSec: 4.48, durSec: 2.2, note: 45, gain: 0.45 },
    { atSec: 4.48, durSec: 2.2, note: 52, gain: 0.35 },
    { atSec: 4.48, durSec: 0.42, note: 72, gain: 0.6 },
    { atSec: 4.9, durSec: 0.42, note: 74, gain: 0.6 },
    { atSec: 5.32, durSec: 0.56, note: 76, gain: 0.65 },
    { atSec: 5.88, durSec: 0.42, note: 74, gain: 0.6 },
    { atSec: 6.3, durSec: 0.42, note: 72, gain: 0.55 },
  ],
}

// E F G F E over E (1 b2 b3, Phrygian), over A (5 b6 b7, Aeolian), over C (3 4 5, Ionian).
const LIT_E: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 40, gain: 0.45 },
    { atSec: 0, durSec: 2.2, note: 47, gain: 0.35 },
    { atSec: 0, durSec: 0.42, note: 76, gain: 0.6 },
    { atSec: 0.42, durSec: 0.42, note: 77, gain: 0.6 },
    { atSec: 0.84, durSec: 0.56, note: 79, gain: 0.65 },
    { atSec: 1.4, durSec: 0.42, note: 77, gain: 0.6 },
    { atSec: 1.82, durSec: 0.42, note: 76, gain: 0.55 },
    { atSec: 2.24, durSec: 2.2, note: 45, gain: 0.45 },
    { atSec: 2.24, durSec: 2.2, note: 52, gain: 0.35 },
    { atSec: 2.24, durSec: 0.42, note: 76, gain: 0.6 },
    { atSec: 2.66, durSec: 0.42, note: 77, gain: 0.6 },
    { atSec: 3.08, durSec: 0.56, note: 79, gain: 0.65 },
    { atSec: 3.64, durSec: 0.42, note: 77, gain: 0.6 },
    { atSec: 4.06, durSec: 0.42, note: 76, gain: 0.55 },
    { atSec: 4.48, durSec: 2.2, note: 36, gain: 0.45 },
    { atSec: 4.48, durSec: 2.2, note: 43, gain: 0.35 },
    { atSec: 4.48, durSec: 0.42, note: 76, gain: 0.6 },
    { atSec: 4.9, durSec: 0.42, note: 77, gain: 0.6 },
    { atSec: 5.32, durSec: 0.56, note: 79, gain: 0.65 },
    { atSec: 5.88, durSec: 0.42, note: 77, gain: 0.6 },
    { atSec: 6.3, durSec: 0.42, note: 76, gain: 0.55 },
  ],
}

// Two winds: A B C B A with one long note close under it, D, then F, then E.
const PAIR_A: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.27, note: 62, gain: 0.4 },
    { atSec: 0, durSec: 0.43, note: 69, gain: 0.6 },
    { atSec: 0.43, durSec: 0.43, note: 71, gain: 0.6 },
    { atSec: 0.87, durSec: 0.58, note: 72, gain: 0.65 },
    { atSec: 1.45, durSec: 0.43, note: 71, gain: 0.6 },
    { atSec: 1.88, durSec: 0.43, note: 69, gain: 0.55 },
    { atSec: 2.32, durSec: 2.27, note: 65, gain: 0.4 },
    { atSec: 2.32, durSec: 0.43, note: 69, gain: 0.6 },
    { atSec: 2.76, durSec: 0.43, note: 71, gain: 0.6 },
    { atSec: 3.19, durSec: 0.58, note: 72, gain: 0.65 },
    { atSec: 3.77, durSec: 0.43, note: 71, gain: 0.6 },
    { atSec: 4.21, durSec: 0.43, note: 69, gain: 0.55 },
    { atSec: 4.64, durSec: 2.27, note: 64, gain: 0.4 },
    { atSec: 4.64, durSec: 0.43, note: 69, gain: 0.6 },
    { atSec: 5.07, durSec: 0.43, note: 71, gain: 0.6 },
    { atSec: 5.51, durSec: 0.58, note: 72, gain: 0.65 },
    { atSec: 6.09, durSec: 0.43, note: 71, gain: 0.6 },
    { atSec: 6.52, durSec: 0.43, note: 69, gain: 0.55 },
  ],
}

// A B C B A, slow, over D and A held: 5 6 b7 6 5.
const DORIAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 50, gain: 0.4 },
    { atSec: 0, durSec: 6.6, note: 57, gain: 0.3 },
    { atSec: 0.2, durSec: 1.2, note: 69, gain: 0.6 },
    { atSec: 1.4, durSec: 1.2, note: 71, gain: 0.6 },
    { atSec: 2.6, durSec: 1.6, note: 72, gain: 0.65 },
    { atSec: 4.2, durSec: 1.2, note: 71, gain: 0.6 },
    { atSec: 5.4, durSec: 1.2, note: 69, gain: 0.55 },
  ],
}

// The same notes at the same speed over F and C: 3 #4 5 #4 3.
const LYDIAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 53, gain: 0.4 },
    { atSec: 0, durSec: 6.6, note: 60, gain: 0.3 },
    { atSec: 0.2, durSec: 1.2, note: 69, gain: 0.6 },
    { atSec: 1.4, durSec: 1.2, note: 71, gain: 0.6 },
    { atSec: 2.6, durSec: 1.6, note: 72, gain: 0.65 },
    { atSec: 4.2, durSec: 1.2, note: 71, gain: 0.6 },
    { atSec: 5.4, durSec: 1.2, note: 69, gain: 0.55 },
  ],
}

// The same again over E and B: 4 5 b6 5 4.
const PHRYGIAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 52, gain: 0.4 },
    { atSec: 0, durSec: 6.6, note: 59, gain: 0.3 },
    { atSec: 0.2, durSec: 1.2, note: 69, gain: 0.6 },
    { atSec: 1.4, durSec: 1.2, note: 71, gain: 0.6 },
    { atSec: 2.6, durSec: 1.6, note: 72, gain: 0.65 },
    { atSec: 4.2, durSec: 1.2, note: 71, gain: 0.6 },
    { atSec: 5.4, durSec: 1.2, note: 69, gain: 0.55 },
  ],
}

// C D E D C, slow, over A and E: b3 4 5 4 b3.
const AEOLIAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 57, gain: 0.4 },
    { atSec: 0, durSec: 6.6, note: 64, gain: 0.3 },
    { atSec: 0.2, durSec: 1.2, note: 72, gain: 0.55 },
    { atSec: 1.4, durSec: 1.2, note: 74, gain: 0.55 },
    { atSec: 2.6, durSec: 1.6, note: 76, gain: 0.6 },
    { atSec: 4.2, durSec: 1.2, note: 74, gain: 0.55 },
    { atSec: 5.4, durSec: 1.2, note: 72, gain: 0.5 },
  ],
}

// C D E D C an octave up over F and C, for flutes: 5 6 7 6 5 of F Lydian.
const HIGH_F: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 65, gain: 0.45 },
    { atSec: 0, durSec: 6.6, note: 72, gain: 0.35 },
    { atSec: 0.2, durSec: 1.2, note: 84, gain: 0.5 },
    { atSec: 1.4, durSec: 1.2, note: 86, gain: 0.5 },
    { atSec: 2.6, durSec: 1.6, note: 88, gain: 0.55 },
    { atSec: 4.2, durSec: 1.2, note: 86, gain: 0.5 },
    { atSec: 5.4, durSec: 1.2, note: 84, gain: 0.45 },
  ],
}

// E F G F E over E and B, for flutes: 1 b2 b3 b2 1 of E Phrygian.
const HIGH_E: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 64, gain: 0.45 },
    { atSec: 0, durSec: 6.6, note: 71, gain: 0.35 },
    { atSec: 0.2, durSec: 1.2, note: 76, gain: 0.55 },
    { atSec: 1.4, durSec: 1.2, note: 77, gain: 0.55 },
    { atSec: 2.6, durSec: 1.6, note: 79, gain: 0.6 },
    { atSec: 4.2, durSec: 1.2, note: 77, gain: 0.55 },
    { atSec: 5.4, durSec: 1.2, note: 76, gain: 0.5 },
  ],
}

// E F G F E, slow, over C and G: 3 4 5 4 3.
const IONIAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 48, gain: 0.4 },
    { atSec: 0, durSec: 6.6, note: 55, gain: 0.3 },
    { atSec: 0.2, durSec: 1.2, note: 76, gain: 0.55 },
    { atSec: 1.4, durSec: 1.2, note: 77, gain: 0.55 },
    { atSec: 2.6, durSec: 1.6, note: 79, gain: 0.6 },
    { atSec: 4.2, durSec: 1.2, note: 77, gain: 0.55 },
    { atSec: 5.4, durSec: 1.2, note: 76, gain: 0.5 },
  ],
}

// C D E D C in the drone itself over a low D: with a fifth in the sound the tune moves as C G, D A, E B.
const ORGANUM: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 38, gain: 0.45 },
    { atSec: 0, durSec: 6.6, note: 50, gain: 0.3 },
    { atSec: 0.2, durSec: 1.2, note: 60, gain: 0.5 },
    { atSec: 1.4, durSec: 1.2, note: 62, gain: 0.5 },
    { atSec: 2.6, durSec: 1.6, note: 64, gain: 0.55 },
    { atSec: 4.2, durSec: 1.2, note: 62, gain: 0.5 },
    { atSec: 5.4, durSec: 1.2, note: 60, gain: 0.45 },
  ],
}

// The bright roots: F with C, then C with G; a drone with a major third in it stays on the white keys (F A C E G, C E G B D).
const BRIGHT: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.4, note: 53, gain: 0.5 },
    { atSec: 0, durSec: 3.4, note: 60, gain: 0.4 },
    { atSec: 3.4, durSec: 3.4, note: 48, gain: 0.5 },
    { atSec: 3.4, durSec: 3.4, note: 55, gain: 0.4 },
  ],
}

// The dark roots: D with A, then A with E; with a minor third in the drone D F A C E, then A C E G B.
const DARK: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.4, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 3.4, note: 57, gain: 0.4 },
    { atSec: 3.4, durSec: 3.4, note: 45, gain: 0.5 },
    { atSec: 3.4, durSec: 3.4, note: 52, gain: 0.4 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // A B C B A over D, by day.
  {
    id: 'one-tune-three-drones-dorian-floor',
    name: 'Dorian floor',
    category: 'drone',
    description:
      'Open fifths of soft triangle partials that arrive in under a second, bands rising and sinking slowly: over D, a floor of D and A.',
    preview: ORGANUM,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        partials: 0.5,
        wave: 0.35,
        movement: 0.3,
        sub: 0.35,
        cutoff: 1900,
        attack: 0.7,
        release: 3,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'currents', preset: 'Slow water', params: { depth: 0.45, rate: 0.16 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'one-tune-three-drones-flat-seventh-at-noon',
    name: 'Flat seventh at noon',
    category: 'wind',
    description:
      'A straight concert flute with no vibrato in a bright chamber, so a C over D is heard plainly as its flat seventh.',
    preview: PAIR_A,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { blow: 0.5, breath: 0.2, attack: 0.07, release: 0.5, volume: -11 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.3 } }],
  },
  {
    id: 'one-tune-three-drones-fifth-sixth-seventh',
    name: 'Fifth, sixth, seventh',
    category: 'wind',
    description:
      'A clarinet blown at half strength, strings tuned to D minor ringing after every note it plays.',
    preview: DORIAN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { blow: 0.5, breath: 0.25, attack: 0.14, release: 0.5, volume: -10 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { root: 2, sympathy: 0.7, decay: 5, mix: 0.5 },
      },
    ],
  },
  {
    id: 'one-tune-three-drones-harp-with-three-floors',
    name: 'Harp with three floors',
    category: 'plucked',
    description:
      'A harp plucked midway along its strings, each note answered once by a single dark tape slap.',
    preview: LIT_A,
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { pluck: 0.42, touch: 0.3, decay: 1.4, halo: 0.25, body: 0.75, volume: -3 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Single slap',
        params: { time: 280, highCut: 2500, drive: 0.2, mix: 0.3 },
      },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'one-tune-three-drones-daylight-on-d',
    name: 'Daylight on D',
    category: 'keys',
    description:
      'A lightly felted piano with the pedal half down and its own room off, heard from the far end of a real hall.',
    preview: LIT_A,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: {
        felt: 0.25,
        hardness: 0.35,
        grit: 0,
        resonance: 0.6,
        reverbMix: 0,
        outputDb: -16.5,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Far end of the hall', params: { distance: 0.8, mix: 0.75 } },
    ],
  },

  // A B C B A over F.
  {
    id: 'one-tune-three-drones-lydian-skylight',
    name: 'Lydian skylight',
    category: 'drone',
    description:
      'A just major chord with no sub and plenty of tuned air, its partials glinting one by one in a bright hall: for F or C.',
    preview: BRIGHT,
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: {
        sub: 0,
        air: 0.4,
        cutoff: 6500,
        attack: 0.6,
        release: 3,
        movement: 0.5,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Light on water', params: { rate: 1.6 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-tune-three-drones-sharp-fourth-in-sun',
    name: 'Sharp fourth in sun',
    category: 'wind',
    description:
      'A clarinet blown open, two detuned copies of it wide to each side and a bright plate: a B that rings over F.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: { blow: 0.8, breath: 0.1, attack: 0.1, release: 0.5, vibrato: 0.15, volume: 0.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider', params: { detune: 14, mix: 0.42 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'one-tune-three-drones-b-natural-over-f',
    name: 'B natural over F',
    category: 'wind',
    description:
      'Pan pipes with a hard chiff and their echoes jumping up an octave and back, the B bright against an F.',
    preview: PAIR_A,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { breath: 0.3, blow: 0.4, chiff: 1, attack: 0.015, release: 0.3, volume: -12 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Octave hop',
        params: { time: 300, feedback: 0.4, mix: 0.28 },
      },
    ],
  },
  {
    id: 'one-tune-three-drones-glass-roof-in-rain',
    name: 'Glass roof in rain',
    category: 'bell',
    description:
      'Glass drops falling quickly on the held notes, small and spread two octaves up, with a climbing octave in the hall.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'droplets',
      preset: 'Glass rain',
      params: { rain: 6, size: 0.25, spread: 2, ring: 1.4, trail: 1, volume: -5 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.3, decay: 5 } }],
  },
  {
    id: 'one-tune-three-drones-bright-side-of-a-tune',
    name: 'Bright side of a tune',
    category: 'plucked',
    description:
      'Steel guzheng strings picked near the bridge and left to ring, each echo fanned out from low to high.',
    preview: LIT_A,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { pluck: 0.07, touch: 0.5, decay: 1.8, halo: 0.7, body: 0.3, volume: 3 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { time: 320, feedback: 0.2, mix: 0.35 } },
    ],
  },

  // A B C B A over E.
  {
    id: 'one-tune-three-drones-phrygian-cellar',
    name: 'Phrygian cellar',
    category: 'drone',
    description:
      'Octaves with a heavy sub under a low filter, sounding inside a long stopped pipe: E with its octaves and no third of its own.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: {
        partials: 0.55,
        wave: 0.6,
        movement: 0.4,
        rate: 0.12,
        sub: 0.6,
        cutoff: 800,
        attack: 0.2,
        release: 0.9,
        volume: -13,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Inside a pipe',
        params: { body: 2, size: 2.4, material: 0.3, air: 0.1, mix: 0.6 },
      },
    ],
  },
  {
    id: 'one-tune-three-drones-flat-sixth-over-e',
    name: 'Flat sixth over E',
    category: 'wind',
    description:
      'A hushed bass clarinet heard from the room next door, its C lying a half step above the B of the drone.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { blow: 0.25, breath: 0.7, attack: 0.18, release: 0.9, volume: -3.5 },
    },
    effects: [{ deviceId: 'distance', preset: 'Next door', params: { distance: 0.5 } }],
  },
  {
    id: 'one-tune-three-drones-half-step-from-home',
    name: 'Half step from home',
    category: 'wind',
    description:
      'A shakuhachi sliding up into each note, its tone caught by the faint feedback of an amplifier and shaded at the top.',
    preview: PAIR_A,
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: { breath: 0.4, scoop: 80, vibrato: 0.3, release: 0.6, volume: -13 },
    },
    effects: [
      { deviceId: 'howl', preset: 'Faint sustain', params: { mix: 0.35, gain: 0.7 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'one-tune-three-drones-bolt-in-the-half-step',
    name: 'Bolt in the half step',
    category: 'keys',
    description:
      'Bolts between the strings turn every note into a small gong, and rings on E shade each one with sums and differences.',
    preview: LIT_A,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Bolt gongs',
      params: { amount: 0.6, hammer: 0.35, decay: 1.2, tone: 0.6, volume: -0.5 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Faint halo', params: { root: 4, octave: 3, mix: 0.25 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'one-tune-three-drones-dark-of-the-fifth',
    name: 'Dark of the fifth',
    category: 'pad',
    description:
      'A dark felt strike that swells into its own overtones, rubbed smooth and pushed into the back of a hall.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Dark felt',
      params: { strike: 0.5, bloom: 0.8, fade: 4, tone: 0.25, evolve: 0.3, volume: -12 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Soft cloud', params: { size: 220 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.4 } },
    ],
  },

  // Over D, by the window: the tune on C, or the first again.
  {
    id: 'one-tune-three-drones-under-the-seventh',
    name: 'Under the seventh',
    category: 'drone',
    description:
      'A saw drone in fifths, turning slowly in a rotor with the drum loud: the tune climbs from its seventh to its second.',
    preview: ORGANUM,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        partials: 0.9,
        wave: 0.8,
        movement: 0.6,
        rate: 0.3,
        sub: 0.15,
        air: 0,
        cutoff: 1300,
        attack: 0.4,
        release: 2,
        width: 0.3,
        volume: -14,
      },
    },
    effects: [{ deviceId: 'rotary', preset: 'Dark drum', params: { mix: 0.8 } }],
  },
  {
    id: 'one-tune-three-drones-circling-the-root',
    name: 'Circling the root',
    category: 'plucked',
    description:
      'A harp whose strings are mostly damped as a key is let go, carried round the head on a slow circle with a hint of spring.',
    preview: LIT_C,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { pluck: 0.2, touch: 0.45, damp: 0.6, decay: 1, body: 0.9, volume: 1 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'one-tune-three-drones-seventh-root-second',
    name: 'Seventh, root, second',
    category: 'keys',
    description:
      'A worn, narrow old upright with its unisons well apart, onto a cassette that has been played too often.',
    preview: LIT_C,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { felt: 0.45, hardness: 0.4, thump: 0.5, action: 0.5, outputDb: -16.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { drive: 0.25, noise: 0.15 } },
    ],
  },
  {
    id: 'one-tune-three-drones-wood-drops-on-d',
    name: 'Wood drops on D',
    category: 'bell',
    description:
      'A fast patter of wooden drops on the held notes, with low bowls tuned in fifths on D ringing after them.',
    preview: DORIAN,
    instrument: {
      deviceId: 'droplets',
      preset: 'Wood pulse',
      params: { rain: 9, loose: 0.35, size: 0.6, ring: 1.6, soft: 0.35, volume: -2 },
    },
    effects: [{ deviceId: 'bowls', preset: 'Low fifths', params: { root: 2, mix: 0.4, ring: 6 } }],
  },
  {
    id: 'one-tune-three-drones-tonic-in-the-middle',
    name: 'Tonic in the middle',
    category: 'keys',
    description:
      'Rubber lightly set between the strings: soft wooden notes that last, with a dark plate around them.',
    preview: LIT_C,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Soft rubber',
      params: { amount: 0.4, hammer: 0.4, decay: 2, thud: 0.1, tone: 0.8, volume: 6 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { decay: 0.55, mix: 0.4 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },

  // C D E D C over F.
  {
    id: 'one-tune-three-drones-f-like-an-open-window',
    name: 'F like an open window',
    category: 'drone',
    description:
      'The first four harmonics of each key in sine partials, breathing slowly in level and tone, a light wind around them.',
    preview: HIGH_F,
    instrument: {
      deviceId: 'drone',
      preset: 'Still organ',
      params: {
        partials: 0.4,
        movement: 0.35,
        rate: 0.15,
        sub: 0.2,
        air: 0.3,
        cutoff: 3500,
        attack: 0.5,
        release: 2.5,
        width: 0.9,
        volume: -7.5,
      },
    },
    effects: [
      { deviceId: 'breath', preset: 'Calm breath', params: { in: 2, out: 2.5, depth: 0.35 } },
      { deviceId: 'weather', preset: 'Breezy day', params: { exposure: 0.35 } },
    ],
  },
  {
    id: 'one-tune-three-drones-up-to-the-leading-tone',
    name: 'Up to the leading tone',
    category: 'wind',
    description:
      'A soft recorder of wood with no vibrato, thickened by two copies that drift a little way off in a small room.',
    preview: HIGH_F,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { blow: 0.2, attack: 0.08, release: 0.5, breath: 0.12, volume: -14 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by', params: { mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'one-tune-three-drones-major-seventh-gable',
    name: 'Major seventh gable',
    category: 'wind',
    description:
      'Breathy hollow pipes that fade in and sit as a pad, sinking a few cents a second as they die away.',
    preview: HIGH_F,
    instrument: {
      deviceId: 'flute',
      preset: 'Hollow pipes pad',
      params: { breath: 0.55, blow: 0.35, attack: 0.35, release: 1.8, volume: -10 },
    },
    effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.45 } }],
  },
  {
    id: 'one-tune-three-drones-five-notes-from-f',
    name: 'Five notes from F',
    category: 'plucked',
    description:
      'A koto plucked softly toward the middle of the string and levelled hard, short sparks of it an octave up after each note.',
    preview: LIT_C,
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { pluck: 0.28, touch: 0.2, decay: 2, bend: 0, halo: 0.6, body: 0.6, volume: -6 },
    },
    effects: [
      { deviceId: 'glints', preset: 'First light', params: { mix: 0.4, density: 7, pitch: 0 } },
      {
        deviceId: 'fet-limiter',
        preset: 'Gentle lift',
        params: { inputGain: 24, outputGain: -9.5 },
      },
    ],
  },
  {
    id: 'one-tune-three-drones-fifth-on-the-window-sill',
    name: 'Fifth on the window sill',
    category: 'keys',
    description:
      'A hard bright piano with no felt and stiff strings, the quiet end of every note lifted up toward its attack.',
    preview: LIT_C,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { hardness: 0.75, stiffness: 1.4, reverbMix: 0.25, outputDb: -9 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Long tails', params: { amount: 0.6 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },

  // C D E D C over A.
  {
    id: 'one-tune-three-drones-aeolian-hour',
    name: 'Aeolian hour',
    category: 'drone',
    description:
      'A just minor chord at dusk, saw waves under a low filter, worn thin by tape and set in a dark cave: for D or A.',
    preview: DARK,
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: { sub: 0.2, wave: 0.85, cutoff: 1200, attack: 0.7, release: 3, volume: -7 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.1 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3, decay: 4 } },
    ],
  },
  {
    id: 'one-tune-three-drones-minor-third-goes-up',
    name: 'Minor third goes up',
    category: 'wind',
    description:
      'A reed between clarinet and saxophone with a vibrato that waits until a note is held, a low vowel humming in its hall.',
    preview: AEOLIAN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { bore: 0.4, breath: 0.35, vibrato: 0.1, attack: 0.15, release: 0.6, volume: -4.5 },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        preset: 'Late vibrato',
        params: { wait: 400, depth: 35, rate: 4.2 },
      },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.25, decay: 4 } },
    ],
  },
  {
    id: 'one-tune-three-drones-relative-dark',
    name: 'Relative dark',
    category: 'wind',
    description:
      'A hollow reed with little breath in it, and an organ stop an octave below that speaks a quarter of a second later.',
    preview: AEOLIAN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { blow: 0.35, breath: 0.1, attack: 0.2, release: 0.7, volume: -5 },
    },
    effects: [{ deviceId: 'stops', preset: 'Pedal under', params: { speak: 250 } }],
  },
  {
    id: 'one-tune-three-drones-felt-rain-at-dusk',
    name: 'Felt rain at dusk',
    category: 'bell',
    description:
      'Padded drops like fingertips on felt, large and slow to die, under a slow chorus and a thin veil of reverb.',
    preview: AEOLIAN,
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt patter',
      params: { rain: 5, size: 0.7, spread: 0.5, ring: 2.2, soft: 0.4, splash: 0.2, volume: -0.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'one-tune-three-drones-glow-of-the-minor-third',
    name: 'Glow of the minor third',
    category: 'pad',
    description:
      'A pluck that turns into a hazy glow of its own overtones, a few sines an octave below swelling in behind it.',
    preview: AEOLIAN,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: { strike: 0.6, glow: 0.7, bloom: 0.7, tone: 0.45, volume: -11 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Low shadow', params: { mix: 0.4 } }],
  },

  // E F G F E over E.
  {
    id: 'one-tune-three-drones-one-tone-one-string',
    name: 'One tone, one string',
    category: 'drone',
    description:
      'A single unison tone, narrow and nearly still, through a warm stack of loudspeakers driven to the edge of breaking up.',
    preview: LIT_E,
    instrument: {
      deviceId: 'drone',
      preset: 'Latched unison',
      params: {
        hold: 0,
        partials: 0.8,
        wave: 0.65,
        movement: 0.15,
        rate: 0.1,
        sub: 0.25,
        air: 0,
        cutoff: 2600,
        attack: 0.15,
        release: 0.4,
        width: 0.2,
        volume: -9.5,
      },
    },
    effects: [{ deviceId: 're-amp', preset: 'Warm stack', params: { drive: 0.55, output: -3 } }],
  },
  {
    id: 'one-tune-three-drones-flat-second-above',
    name: 'Flat second above',
    category: 'wind',
    description:
      'A wood flute that swells into each note and leans on an F over E, inside a cavern of short echoes.',
    preview: HIGH_E,
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { attack: 0.25, chiff: 0.15, release: 1, vibrato: 0.2, scoop: 25, volume: -11 },
    },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.35, feedback: 0.45 } },
    ],
  },
  {
    id: 'one-tune-three-drones-narrowest-step',
    name: 'Narrowest step',
    category: 'wind',
    description:
      'Pan pipes that are mostly breath, their air spread wide and their tone held narrow in the middle.',
    preview: HIGH_E,
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { breath: 0.8, blow: 0.25, attack: 0.15, release: 0.9, volume: -8 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Wide air' },
      { deviceId: 'spread', preset: 'Wide ends' },
    ],
  },
  {
    id: 'one-tune-three-drones-paper-on-the-half-step',
    name: 'Paper on the half step',
    category: 'keys',
    description:
      'A sheet of paper laid across the strings buzzes with each note, filtered dark so only the low buzz is left.',
    preview: LIT_E,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper buzz',
      params: { amount: 0.6, rattle: 0.5, hammer: 0.45, decay: 1.5, tone: 0.5, volume: -0.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { type: 0, cutoffHz: 1700, slope: 0, resonance: 0.8, envAmount: 20 },
      },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'one-tune-three-drones-low-e-with-a-shadow',
    name: 'Low E with a shadow',
    category: 'plucked',
    description:
      'A dark, hollow harp played at the middle of its strings, with a soft backwards copy swelling between the notes.',
    preview: LIT_E,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { touch: 0.2, decay: 1, body: 0.8, volume: 0 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 450, feedback: 0.15, mix: 0.4, tone: 2800 },
      },
    ],
  },
  // Over A, in the evening.
  {
    id: 'one-tune-three-drones-a-for-the-evening',
    name: 'A for the evening',
    category: 'drone',
    description:
      'Glassy minor thirds and fifths with no sub, all sine, slow notches wandering through them: for A or D.',
    preview: DARK,
    instrument: {
      deviceId: 'drone',
      preset: 'Minor glass',
      params: { partials: 0.85, cutoff: 5000, attack: 0.5, release: 2.5, air: 0.05, volume: -4.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { feedback: 35 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'one-tune-three-drones-sixth-pulls-down',
    name: 'Sixth pulls down',
    category: 'plucked',
    description:
      'Long harp strings ringing in strong sympathy, small pieces of the sound slipping down a fourth behind them.',
    preview: LIT_E,
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { pluck: 0.35, touch: 0.3, decay: 2, halo: 0.8, volume: -2.5 },
    },
    effects: [{ deviceId: 'falling', preset: 'Slow sighs', params: { fall: -5, mix: 0.35 } }],
  },
  {
    id: 'one-tune-three-drones-fifth-of-the-evening',
    name: 'Fifth of the evening',
    category: 'keys',
    description:
      'A very soft felted piano, mostly thud and low strings, on a record with a dull stylus, its quiet end brought up.',
    preview: LIT_E,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { hardness: 0.12, thump: 0.5, resonance: 0.4, reverbMix: 0.1, outputDb: -23.5 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Dull stylus', params: { crackle: 0.15 } },
      { deviceId: 'ambient-comp', preset: 'Raise the quiet' },
    ],
  },
  {
    id: 'one-tune-three-drones-drops-from-a-gutter',
    name: 'Drops from a gutter',
    category: 'bell',
    description:
      'Metal drops in nearly even time on the held notes, each bouncing a few times, softer and duller, after it lands.',
    preview: AEOLIAN,
    instrument: {
      deviceId: 'droplets',
      preset: 'Bell drizzle',
      params: {
        rain: 7,
        loose: 0.1,
        size: 0.5,
        spread: 1,
        ring: 0.9,
        soft: 0.4,
        trail: 0.5,
        volume: -3,
      },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { first: 180, mix: 0.4 } },
    ],
  },
  {
    id: 'one-tune-three-drones-evening-run-backwards',
    name: 'Evening run backwards',
    category: 'keys',
    description:
      'Short reversed piano notes that swell for a quarter second, land and ring on for a moment in a warm hall.',
    preview: LIT_E,
    instrument: {
      deviceId: 'rewind',
      preset: 'Mirror note',
      params: { swell: 0.22, tail: 0.8, rise: 0.4, tone: 0.45, ghost: 0.1, volume: 0 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.35 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },

  // E F G F E over C.
  {
    id: 'one-tune-three-drones-c-in-full-light',
    name: 'C in full light',
    category: 'drone',
    description:
      'A just major chord with saw edges and little sub, broadened by organ stops that bloom behind it.',
    preview: BRIGHT,
    instrument: {
      deviceId: 'drone',
      preset: 'Held major',
      params: {
        hold: 0,
        wave: 0.75,
        cutoff: 2800,
        sub: 0.1,
        attack: 0.35,
        release: 2,
        movement: 0.35,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'stops', preset: 'Slow bloom', params: { speak: 500, twelfth: 0, mix: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-tune-three-drones-major-third-landing',
    name: 'Major third landing',
    category: 'plucked',
    description:
      'A harp plucked close to the soundboard, doubled by a second player a few cents sharp and kept in a tight room.',
    preview: LIT_E,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { pluck: 0.11, decay: 0.9, touch: 0.45, body: 0.55, volume: 2 },
    },
    effects: [
      { deviceId: 'size', preset: 'Second player' },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-tune-three-drones-third-fourth-fifth',
    name: 'Third, fourth, fifth',
    category: 'keys',
    description:
      'Felt laid on the piano strings for soft muted notes, with the same notes an octave below and above them.',
    preview: IONIAN,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt mute',
      params: { amount: 0.7, hammer: 0.4, decay: 2, thud: 0.25, volume: 0.5 },
    },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'Organ',
        params: { sub2: 0, up2: 0, sub1: 0.25, up1: 0.45, dry: 0.9 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-tune-three-drones-water-on-white-stone',
    name: 'Water on white stone',
    category: 'bell',
    description:
      'Round water drops, seven a second on the held notes, with strings of a C major triad ringing after them.',
    preview: IONIAN,
    instrument: {
      deviceId: 'droplets',
      preset: 'Water drops',
      params: { rain: 7, size: 0.4, ring: 2.5, splash: 0.2, loose: 0.6, volume: -7 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Open triad',
        params: { root: 0, sympathy: 0.6, decay: 4, mix: 0.45 },
      },
    ],
  },
  {
    id: 'one-tune-three-drones-same-notes-now-major',
    name: 'Same notes, now major',
    category: 'keys',
    description:
      'A piano with perfectly tuned unisons and little action noise, thinly chorused in the upper half and set in a hall.',
    preview: IONIAN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { felt: 0.15, hardness: 0.5, resonance: 0.9, reverbMix: 0, outputDb: -9.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air', params: { mix: 0.35 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.25 } },
    ],
  },

  // A B C B A over each of the three in turn.
  {
    id: 'one-tune-three-drones-three-cellars-deep',
    name: 'Three cellars deep',
    category: 'drone',
    description:
      'A low hum of soft octaves over a strong sub, each root rounded by a transformer and kept to the middle: D, F and E.',
    preview: LIT_A,
    instrument: {
      deviceId: 'drone',
      preset: 'Low hum',
      params: {
        partials: 0.35,
        wave: 0.2,
        sub: 0.6,
        cutoff: 600,
        attack: 0.1,
        release: 0.4,
        movement: 0.15,
        volume: -14,
      },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.6 } }],
  },
  {
    id: 'one-tune-three-drones-same-tune-by-lamp',
    name: 'Same tune by lamp',
    category: 'wind',
    description:
      'A subtone tenor, all breath and edge, from a small bedside loudspeaker with a little noise under it.',
    preview: PAIR_A,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { breath: 0.5, blow: 0.35, attack: 0.08, vibrato: 0.2, volume: -10 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0.1, output: -1 } }],
  },
  {
    id: 'one-tune-three-drones-lit-from-below',
    name: 'Lit from below',
    category: 'wind',
    description:
      'A low flute blown hard enough to edge, with its octave below sounding underneath in a tight chamber.',
    preview: PAIR_A,
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { attack: 0.05, vibrato: 0.25, release: 0.5, volume: -13 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6, up1: 0 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-tune-three-drones-one-tune-from-memory',
    name: 'One tune from memory',
    category: 'keys',
    description:
      'A felted piano followed by moments of what it played before, some of them backwards and at half speed.',
    preview: LIT_A,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { felt: 0.7, grit: 0.1, reverbMix: 0.1, detune: 0.3, outputDb: -13.5 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Recalling', params: { time: 840, mix: 0.4 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'one-tune-three-drones-three-lamps-one-harp',
    name: 'Three lamps, one harp',
    category: 'plucked',
    description:
      'Soft koto silk plucked with the press left out, echoes scattered like points of light over two seconds.',
    preview: LIT_A,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { bend: 0, touch: 0.35, pluck: 0.25, decay: 1.2, body: 0.6, volume: 1 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { span: 1900, mix: 0.4 } },
    ],
  },

  // A B C B A over D, at night.
  {
    id: 'one-tune-three-drones-night-watch-on-d',
    name: 'Night watch on D',
    category: 'drone',
    description:
      'A thick saw unison with a sub under it, filtered to a dark hum and passed over by the gusts of a gale.',
    preview: DORIAN,
    instrument: {
      deviceId: 'drone',
      preset: 'Saw swarm',
      params: {
        movement: 0.4,
        rate: 0.25,
        cutoff: 900,
        sub: 0.4,
        attack: 0.2,
        release: 0.9,
        width: 0.6,
        volume: -5,
      },
    },
    effects: [{ deviceId: 'weather', preset: 'Gale', params: { exposure: 0.5 } }],
  },
  {
    id: 'one-tune-three-drones-reed-after-hours',
    name: 'Reed after hours',
    category: 'wind',
    description:
      'A reed with a slow wide vibrato, and mixed low with it the same reed on a radio that hisses and fades.',
    preview: DORIAN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Wide vibrato reed',
      params: { vibrato: 0.5, attack: 0.15, release: 0.8, blow: 0.5, volume: -3.5 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Hint of static', params: { fading: 0.35, static: 0.1 } },
    ],
  },
  {
    id: 'one-tune-three-drones-flat-seventh-embers',
    name: 'Flat seventh embers',
    category: 'pad',
    description:
      'A low bell strike that turns to a glow, each of its bands flickering in a quick tremolo of its own.',
    preview: DORIAN,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Low tide bell',
      params: { strike: 0.5, decay: 3, bloom: 0.9, fade: 3, tone: 0.35, volume: -7.5 },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Wide twinkle', params: { depth: 0.75 } }],
  },
  {
    id: 'one-tune-three-drones-sixth-before-dawn',
    name: 'Sixth before dawn',
    category: 'pad',
    description:
      'Reversed bowls that gather for half a second, land and ring on, their beating deep and a slow phase swirl over them.',
    preview: DORIAN,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: { swell: 0.55, tail: 0.9, ghost: 0.3, shimmer: 0.6, rise: 0.4, volume: 6 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } }],
  },
  {
    id: 'one-tune-three-drones-amplifier-left-on-d',
    name: 'Amplifier left on D',
    category: 'string',
    description:
      'A string held in feedback on its own pitch, dark and steady, in front of a single dark spring.',
    preview: DORIAN,
    instrument: {
      deviceId: 'feedback',
      preset: 'Dark sustain',
      params: { gain: 0.8, bloom: 0.3, pick: 0.35, damp: 0.75, release: 1.2, volume: -4 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.35 } }],
  },

  // A B C B A over F, at night.
  {
    id: 'one-tune-three-drones-lydian-streetlight',
    name: 'Lydian streetlight',
    category: 'drone',
    description:
      'Octaves with fast shimmering partials and no sub, blurred into one even band of light.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'drone',
      preset: 'Octave shimmer',
      params: { cutoff: 6000, attack: 0.15, release: 1.1, air: 0.1, wave: 0.2, volume: -13 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { blur: 0.4, mix: 0.5 } },
    ],
  },
  {
    id: 'one-tune-three-drones-raised-fourth-at-night',
    name: 'Raised fourth at night',
    category: 'wind',
    description:
      'A reed hum with little breath, pure and hollow, an octave climbing out of it in a hall of four seconds.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { blow: 0.15, attack: 0.2, release: 0.9, volume: -7 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Fifths',
        params: { interval: 0, mix: 0.3, decay: 4, shimmer: 0.4 },
      },
    ],
  },
  {
    id: 'one-tune-three-drones-window-across-the-way',
    name: 'Window across the way',
    category: 'pad',
    description:
      'A glass strike and a breath of its overtones, bright and thin, seen wide from a distance in the open air.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Glass breath',
      params: { strike: 0.6, bloom: 0.5, fade: 3, tone: 0.75, halo: 0.4, volume: -6 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Open air' },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'one-tune-three-drones-bell-from-the-far-end',
    name: 'Bell from the far end',
    category: 'bell',
    description:
      'A bell played backwards, swelling for half a second up to its strike and cut short, its tail carried on by a long plate.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bell arrival',
      params: { swell: 0.6, tail: 0.35, snap: 0.5, tone: 0.7, ghost: 0, volume: 3 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } }],
  },
  {
    id: 'one-tune-three-drones-string-singing-on-f',
    name: 'String singing on F',
    category: 'string',
    description:
      'A string held in feedback that sings the octave over its note, a copy a fraction of a hertz off turning slowly against it.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'feedback',
      preset: 'Pure twelfth',
      params: { distance: 2, bloom: 0.5, pick: 0.35, release: 1, volume: -7.5 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Still water', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },

  // A B C B A over E, at night.
  {
    id: 'one-tune-three-drones-phrygian-embankment',
    name: 'Phrygian embankment',
    category: 'drone',
    description:
      'Octaves of saw partials that do not move, taken just under water while the surface swells slowly overhead.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'drone',
      preset: 'Standing wave',
      params: {
        shape: 1,
        partials: 0.7,
        wave: 0.95,
        sub: 0.3,
        cutoff: 1700,
        attack: 0.2,
        release: 0.9,
        width: 0.4,
        volume: -7,
      },
    },
    effects: [{ deviceId: 'underwater', preset: 'Slow swell', params: { depth: 0.3, rate: 0.25 } }],
  },
  {
    id: 'one-tune-three-drones-flutter-over-a-low-e',
    name: 'Flutter over a low E',
    category: 'wind',
    description:
      'A flutter-tongued clarinet, its growl softened, blown through a clay pot with a narrow mouth.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { growl: 0.5, blow: 0.4, attack: 0.15, breath: 0.4, volume: -1 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.6 } }],
  },
  {
    id: 'one-tune-three-drones-glow-a-half-step-up',
    name: 'Glow a half step up',
    category: 'pad',
    description:
      'A pad with no strike at all, its overtones raised out of silence, half of it drifting in pitch, in a dark hall.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the glow',
      params: { bloom: 0.5, fade: 2.5, tone: 0.35, evolve: 0.4, drift: 0.5, volume: -14 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'one-tune-three-drones-pluck-pulled-back',
    name: 'Pluck pulled back',
    category: 'plucked',
    description:
      'A plucked string in reverse that swells for half a second and is cut short on its attack, worn tape repeats behind it.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'rewind',
      preset: 'Pluck back',
      params: { swell: 0.45, tail: 0.25, snap: 0.5, tone: 0.4, volume: 0 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Worn tape',
        params: { time: 400, feedback: 0.35, mix: 0.35 },
      },
    ],
  },
  {
    id: 'one-tune-three-drones-wire-against-the-fifth',
    name: 'Wire against the fifth',
    category: 'string',
    description:
      'A plucked string caught at the edge of feedback, gritty, its short sustain drawn out by a compressor and a slow flange.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'feedback',
      preset: 'Edge of hold',
      params: { gain: 0.6, grit: 0.35, damp: 0.5, release: 1, volume: -11 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep', params: { mix: 0.4 } },
      { deviceId: 'ambient-comp', preset: 'Long sustain' },
    ],
  },

  // A B C B A over D, out of doors.
  {
    id: 'one-tune-three-drones-d-across-a-field',
    name: 'D across a field',
    category: 'drone',
    description:
      'Tuned wind in octaves with hardly a tone in it, through a filter that leans gently toward the white keys.',
    preview: DORIAN,
    instrument: {
      deviceId: 'drone',
      preset: 'Tuned wind',
      params: {
        shape: 1,
        partials: 0.25,
        wave: 0.2,
        sub: 0.1,
        air: 1,
        attack: 0.15,
        release: 1,
        cutoff: 5000,
        volume: -10,
      },
    },
    effects: [
      {
        deviceId: 'scale-filter',
        preset: 'Lean to the key',
        params: { root: 0, scale: 0, chord: 0 },
      },
    ],
  },
  {
    id: 'one-tune-three-drones-hilltop-dorian',
    name: 'Hilltop Dorian',
    category: 'wind',
    description:
      'A hard blown flute with its vibrato on, set a few steps back, three tape heads repeating it down the valley.',
    preview: PAIR_A,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { blow: 0.8, vibrato: 0.4, release: 0.4, volume: -5.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3, feedback: 0.35 } },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
  },
  {
    id: 'one-tune-three-drones-reed-in-a-hedge',
    name: 'Reed in a hedge',
    category: 'wind',
    description:
      'A bright soprano reed heard from a far shore, its highs lost on the way and its level brought back up.',
    preview: PAIR_A,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { bore: 0.8, attack: 0.06, vibrato: 0.1, volume: -13 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Far shore', params: { wander: 0.1 } },
      { deviceId: 'ambient-limiter', params: { gain: 6, ceiling: -9 } },
    ],
  },
  {
    id: 'one-tune-three-drones-drip-from-the-eaves',
    name: 'Drip from the eaves',
    category: 'bell',
    description:
      'Large glass drops that fall loosely on the drone and the tune alike, each given a giant body and a plain hall.',
    preview: DORIAN,
    instrument: {
      deviceId: 'droplets',
      preset: 'Slow drip',
      params: { rain: 4, size: 0.9, ring: 1.2, trail: 2, soft: 0.45, volume: -6 },
    },
    effects: [
      { deviceId: 'size', preset: 'Giant' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-tune-three-drones-rattle-of-the-gate',
    name: 'Rattle of the gate',
    category: 'keys',
    description:
      'Loose bolts rattle at the attack of each note, cut short, rounded by an old reel and shaken by two springs.',
    preview: LIT_A,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rattling bolts',
      params: { amount: 0.5, rattle: 0.6, hammer: 0.45, decay: 0.7, tone: 0.6, volume: 0.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },
  // C D E D C over F, far off.
  {
    id: 'one-tune-three-drones-f-beyond-the-ridge',
    name: 'F beyond the ridge',
    category: 'drone',
    description:
      'A just major chord across a room with a whistle that wanders the harmonics of F from F to C, its raised fourth among them.',
    preview: BRIGHT,
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: {
        shape: 4,
        partials: 0.6,
        wave: 0.6,
        cutoff: 1700,
        sub: 0.3,
        attack: 0.5,
        release: 2.5,
        movement: 0.4,
        volume: -5.5,
      },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'Slow wander',
        params: { low: 8, high: 12, root: 5, pace: 0.5, glide: 1200 },
      },
      { deviceId: 'distance', preset: 'Across the room' },
    ],
  },
  {
    id: 'one-tune-three-drones-one-step-short-of-f',
    name: 'One step short of F',
    category: 'wind',
    description:
      'A soft concert flute with a light vibrato, answered by itself two notes late and duller, so the tune meets itself in thirds.',
    preview: HIGH_F,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft wind lead',
      params: { vibrato: 0.25, attack: 0.1, scoop: 10, release: 0.6, volume: -12 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Faint answer', params: { gap: 2.4, tone: 3000, mix: 0.35 } },
    ],
  },
  {
    id: 'one-tune-three-drones-seventh-seen-from-afar',
    name: 'Seventh seen from afar',
    category: 'wind',
    description:
      'A low flute pad played high, half breath, fading in over a third of a second and thinned by a frozen winter.',
    preview: HIGH_F,
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { breath: 0.6, blow: 0.4, attack: 0.3, release: 1.5, volume: -11 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Deep winter', params: { depth: 0.7 } }],
  },
  {
    id: 'one-tune-three-drones-koto-behind-the-barn',
    name: 'Koto behind the barn',
    category: 'plucked',
    description:
      'A koto plucked near the bridge with its ring cut back, through a pair of springs driven until they drip.',
    preview: LIT_C,
    instrument: {
      deviceId: 'harp',
      preset: 'Whole tone press',
      params: { bend: 0, pluck: 0.1, touch: 0.6, decay: 0.8, halo: 0.2, body: 0.9, volume: -1.5 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.35 } }],
  },
  {
    id: 'one-tune-three-drones-far-gate-bells',
    name: 'Far gate bells',
    category: 'bell',
    description:
      'Metal chimes falling loosely on the held notes, worn away each time round a loop of tape over two seconds long.',
    preview: HIGH_F,
    instrument: {
      deviceId: 'droplets',
      preset: 'Long chimes',
      params: { rain: 5, size: 0.55, ring: 1.5, trail: 3, loose: 0.8, volume: -7.5 },
    },
    effects: [{ deviceId: 'tape-loop', preset: 'Worn out', params: { length: 2.4, mix: 0.4 } }],
  },

  // C D E D C over A, after sunset.
  {
    id: 'one-tune-three-drones-last-light-on-a',
    name: 'Last light on A',
    category: 'drone',
    description:
      'A just minor chord of sine partials over a strong sub, a hollow chorus sweeping it and a blanket of dull fuzz behind.',
    preview: DARK,
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: {
        wave: 0.05,
        partials: 0.9,
        sub: 0.6,
        cutoff: 3000,
        air: 0.1,
        attack: 0.5,
        release: 2.5,
        movement: 0.8,
        rate: 0.3,
        volume: -5.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Hollow swell' },
      { deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-tune-three-drones-same-c-now-a-third',
    name: 'Same C, now a third',
    category: 'wind',
    description:
      'A ballad saxophone with its vibrato left in, run hot through a valve and set in a very short ambience.',
    preview: AEOLIAN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Ballad alto',
      params: { vibrato: 0.5, breath: 0.4, attack: 0.1, volume: -9 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Hot valve' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-tune-three-drones-reed-out-of-nowhere',
    name: 'Reed out of nowhere',
    category: 'wind',
    description:
      'A whispered reed that grows out of its own breath, each note smeared on into the next.',
    preview: AEOLIAN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { breath: 0.8, blow: 0.2, attack: 0.3, release: 1, volume: -6 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones' },
      { deviceId: 'spectral-blur', preset: 'Clean sustain', params: { mix: 0.4, blur: 0.4 } },
    ],
  },
  {
    id: 'one-tune-three-drones-creak-on-the-third-step',
    name: 'Creak on the third step',
    category: 'keys',
    description:
      'A felted piano with its action left loud, every key heard, played through an amplifier shut in a cupboard.',
    preview: LIT_C,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Close and creaky',
      params: { felt: 0.8, thump: 0.6, action: 0.8, grit: 0.2, hardness: 0.35, outputDb: -8 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'In the cupboard' },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'one-tune-three-drones-string-over-the-fourth',
    name: 'String over the fourth',
    category: 'string',
    description:
      'A string all but bowed by its own feedback, singing an octave up, muffled and hung in a slow detuned cloud.',
    preview: AEOLIAN,
    instrument: {
      deviceId: 'feedback',
      preset: 'Glass bow',
      params: { distance: 2, bloom: 0.6, release: 1.5, pick: 0.15, damp: 0.3, volume: -4.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Cloud', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },

  // E F G F E over E, in the high places.
  {
    id: 'one-tune-three-drones-high-e-in-the-tower',
    name: 'High E in the tower',
    category: 'drone',
    description:
      'A clear unison of sine partials with no sub at all, glassy copies of it one and two octaves up.',
    preview: HIGH_E,
    instrument: {
      deviceId: 'drone',
      preset: 'Latched unison',
      params: {
        hold: 0,
        partials: 1,
        wave: 0,
        sub: 0,
        air: 0.3,
        cutoff: 12000,
        attack: 0.15,
        release: 1,
        movement: 0.6,
        rate: 0.5,
        width: 1,
        volume: -12,
      },
    },
    effects: [{ deviceId: 'octaves', preset: 'Glass octaves', params: { dry: 0.8 } }],
  },
  {
    id: 'one-tune-three-drones-f-leaning-on-e',
    name: 'F leaning on E',
    category: 'wind',
    description:
      'A shakuhachi that comes in slowly with a deep vibrato, bending up to each note, backwards glass an octave over it.',
    preview: HIGH_E,
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: { attack: 0.25, vibrato: 0.6, release: 1.2, scoop: 40, volume: -11 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Rising glass', params: { mix: 0.25 } }],
  },
  {
    id: 'one-tune-three-drones-cold-step-up',
    name: 'Cold step up',
    category: 'wind',
    description:
      'A low flute, warm and close, its bands swaying from side to side each on its own, with a hall that sings oo behind it.',
    preview: HIGH_E,
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { attack: 0.2, release: 1.2, breath: 0.3, blow: 0.35, volume: -10 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Side to side' },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.3, decay: 4 } },
    ],
  },
  {
    id: 'one-tune-three-drones-tin-in-the-belfry',
    name: 'Tin in the belfry',
    category: 'bell',
    description:
      'Small bolts near the end of the string turn notes to tin chimes, half of them stretched by a hair into bell metal.',
    preview: LIT_E,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Tin chimes',
      params: { hammer: 0.5, decay: 1.6, amount: 0.35, tone: 0.8, volume: -0.5 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Soft chime' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.25, decay: 3 } },
    ],
  },
  {
    id: 'one-tune-three-drones-harp-up-the-stairwell',
    name: 'Harp up the stairwell',
    category: 'plucked',
    description:
      'A harp whose strings ring on mainly while held, each note coming back in small loops stacked octaves up.',
    preview: LIT_E,
    instrument: {
      deviceId: 'harp',
      preset: 'Rings while held',
      params: { pluck: 0.4, touch: 0.2, damp: 0.5, volume: -3 },
    },
    effects: [{ deviceId: 'cascade', preset: 'Octave stack', params: { time: 280, mix: 0.35 } }],
  },

  // A B C B A over F, weathered.
  {
    id: 'one-tune-three-drones-salt-on-the-f',
    name: 'Salt on the F',
    category: 'drone',
    description:
      'A root with its second and fifth, grey and even, as surf passes through it: the one drone here with a step in it.',
    preview: BRIGHT,
    instrument: {
      deviceId: 'drone',
      preset: 'Suspended second',
      params: { attack: 0.5, release: 2.5, cutoff: 2200, air: 0.1, volume: -8 },
    },
    effects: [{ deviceId: 'weather', preset: 'Slow surf', params: { exposure: 0.5 } }],
  },
  {
    id: 'one-tune-three-drones-fourth-will-not-settle',
    name: 'Fourth will not settle',
    category: 'wind',
    description:
      'A clarinet with a quick attack and a long release, pressed into the shape of an open vowel on a small plate.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Slow fade reed',
      params: { release: 1.5, blow: 0.65, attack: 0.06, bore: 0.15, volume: -1.5 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Open vowel', params: { amount: 1.2 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-tune-three-drones-flute-in-sea-air',
    name: 'Flute in sea air',
    category: 'wind',
    description:
      'A breathy concert flute with half of it under choppy water, wavering quickly and losing its top.',
    preview: PAIR_A,
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: { breath: 0.6, chiff: 0.3, vibrato: 0.15, volume: -11 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Choppy water', params: { mix: 0.6 } }],
  },
  {
    id: 'one-tune-three-drones-washed-strings',
    name: 'Washed strings',
    category: 'keys',
    description:
      'A piano with a different object on every key, dark and long, half of its sound wavering slowly in pitch.',
    preview: LIT_A,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Dark orchestra',
      params: { amount: 0.7, rattle: 0.3, decay: 1.5, volume: 2 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow chorus' },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'one-tune-three-drones-bubbles-by-the-fourth',
    name: 'Bubbles by the fourth',
    category: 'bell',
    description:
      'A quick stream of small bubbles on the held notes in a tiny booth, a notch sweeping slowly through them.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'droplets',
      preset: 'Bubble stream',
      params: { rain: 12, size: 0.35, ring: 1.2, spread: 1, volume: 2.5 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Slow notch', params: { lfoRateHz: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.3 } },
    ],
  },

  // A B C B A over E, underground.
  {
    id: 'one-tune-three-drones-e-under-the-stairs',
    name: 'E under the stairs',
    category: 'drone',
    description:
      'Saw octaves filtered dark, pulsing three times a second in the lows and the middle, a dark fuzz mixed under them.',
    preview: LIT_E,
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: {
        wave: 0.9,
        partials: 0.8,
        sub: 0.2,
        cutoff: 1500,
        attack: 0.1,
        release: 0.4,
        movement: 0.2,
        volume: -8.5,
      },
    },
    effects: [
      { deviceId: 'band-pulse', preset: 'Three a second', params: { depth: 0.5 } },
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { drive: 0.2, mix: 0.4 } },
    ],
  },
  {
    id: 'one-tune-three-drones-minor-sixth-in-brick',
    name: 'Minor sixth in brick',
    category: 'wind',
    description:
      'A growling tenor brought down to a murmur, with a narrow dark tunnel of reverb behind it in the middle.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: { growl: 0.3, blow: 0.35, attack: 0.12, release: 0.6, volume: -9 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.35, decay: 4 } }],
  },
  {
    id: 'one-tune-three-drones-flute-through-a-grate',
    name: 'Flute through a grate',
    category: 'wind',
    description:
      'A flute that bends up more than a half step into each note, gated left then right, a small bright tank ringing on around it.',
    preview: PAIR_A,
    instrument: {
      deviceId: 'flute',
      preset: 'Bent from below',
      params: {
        blow: 0.55,
        breath: 0.55,
        scoop: 130,
        chiff: 0.5,
        vibrato: 0.35,
        release: 0.5,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Left then right', params: { rate: 7, floor: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'one-tune-three-drones-harp-below-ground',
    name: 'Harp below ground',
    category: 'plucked',
    description:
      'Short dry harp plucks sounding inside a great stopped pipe that rings longer than the string does.',
    preview: LIT_A,
    instrument: {
      deviceId: 'harp',
      preset: 'Short dry pluck',
      params: { touch: 0.5, decay: 0.6, damp: 0.5, volume: -4 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.55 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'one-tune-three-drones-slow-light-underground',
    name: 'Slow light underground',
    category: 'pad',
    description:
      'Chimes that flare into a wide restless glow, the part that agrees with a moment before left hanging on.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bright chimes',
      params: { strike: 0.5, glow: 0.75, fade: 3, evolve: 0.8, drift: 0.6, volume: -7 },
    },
    effects: [{ deviceId: 'common-tones', preset: 'Hanging notes' }],
  },

  // Three roots again, as they are remembered.
  {
    id: 'one-tune-three-drones-three-roots-on-a-reel',
    name: 'Three roots on a reel',
    category: 'drone',
    description:
      'Open fifths of few sine partials and much sub, on a slow reel of tape with a deep seasick wow: the roots D, F and A.',
    preview: LIT_C,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        wave: 0,
        partials: 0.3,
        movement: 0.9,
        rate: 0.5,
        sub: 0.6,
        air: 0.4,
        cutoff: 5000,
        attack: 0.12,
        release: 0.8,
        volume: -13,
      },
    },
    effects: [{ deviceId: 'tape', preset: 'Seasick', params: { hiss: 0.15 } }],
  },
  {
    id: 'one-tune-three-drones-what-the-flute-kept',
    name: 'What the flute kept',
    category: 'wind',
    description:
      'A wood flute that speaks quickly, its sound caught and held on as a thin even halo behind the line.',
    preview: PAIR_A,
    instrument: {
      deviceId: 'flute',
      preset: 'Slow wood swell',
      params: { attack: 0.12, release: 0.8, breath: 0.35, blow: 0.5, volume: -12 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Thin halo' }],
  },
  {
    id: 'one-tune-three-drones-reed-strings-behind',
    name: 'Reed, strings behind',
    category: 'wind',
    description:
      'A plain clarinet with a soft string section growing up quickly behind each of its notes and gone soon after.',
    preview: PAIR_A,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { blow: 0.65, breath: 0.15, attack: 0.07, volume: -2 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Doubler', params: { mix: 0.45, rise: 0.15, fall: 1.5 } },
    ],
  },
  {
    id: 'one-tune-three-drones-tenor-half-recalled',
    name: 'Tenor half recalled',
    category: 'wind',
    description:
      'A tenor reed that speaks quickly, half of it broken into soft grains scattered a little way around the note.',
    preview: PAIR_A,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Tenor swell',
      params: { attack: 0.15, release: 0.8, blow: 0.5, vibrato: 0.2, volume: -5 },
    },
    effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.5 } }],
  },
  {
    id: 'one-tune-three-drones-rain-recalled',
    name: 'Rain recalled',
    category: 'bell',
    description:
      'Flurries of glass that come and go in bursts on the held notes, returned once by a small ringing room.',
    preview: PAIR_A,
    instrument: {
      deviceId: 'droplets',
      preset: 'Flurries',
      params: {
        rain: 10,
        bursts: 0.4,
        size: 0.4,
        spread: 1,
        ring: 1,
        soft: 0.4,
        trail: 1,
        volume: -9,
      },
    },
    effects: [{ deviceId: 'generations', preset: 'Single return', params: { mix: 0.4 } }],
  },
]
