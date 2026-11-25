import { type FactoryPreset, type Phrase } from '../types'

// Evening melodies on six notes over C (D flat, E, F sharp, A, B and a C that is kept back): no G
// anywhere, the weight on the flat second and the sixth, the home note left to the drone. Each voice
// was laid out from dark to bright, from close to far off, and by how it leans on B or on D flat.

// The line that goes round the C: from the B under it and the D flat over it, up to A and back, while
// a C an octave lower is held the whole time.
const CIRCLING: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.5, note: 48, gain: 0.3 },
    { atSec: 0, durSec: 0.75, note: 59, gain: 0.45 },
    { atSec: 0.7, durSec: 1.45, note: 61, gain: 0.52 },
    { atSec: 2.1, durSec: 0.55, note: 64, gain: 0.45 },
    { atSec: 2.6, durSec: 0.55, note: 66, gain: 0.48 },
    { atSec: 3.1, durSec: 1.4, note: 69, gain: 0.55 },
    { atSec: 4.5, durSec: 0.45, note: 66, gain: 0.45 },
    { atSec: 4.9, durSec: 0.45, note: 64, gain: 0.43 },
    { atSec: 5.3, durSec: 1.2, note: 61, gain: 0.5 },
  ],
}

// The same line plucked over a plucked drone: C, C and the C under it, struck round and round.
const PLUCKED_ROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 48, gain: 0.34 },
    { atSec: 0.1, durSec: 0.65, note: 59, gain: 0.45 },
    { atSec: 0.7, durSec: 1.45, note: 61, gain: 0.52 },
    { atSec: 1.4, durSec: 1.2, note: 48, gain: 0.28 },
    { atSec: 2.1, durSec: 0.55, note: 64, gain: 0.45 },
    { atSec: 2.6, durSec: 1.9, note: 36, gain: 0.36 },
    { atSec: 2.6, durSec: 0.55, note: 66, gain: 0.48 },
    { atSec: 3.1, durSec: 1.4, note: 69, gain: 0.55 },
    { atSec: 4.2, durSec: 1.2, note: 48, gain: 0.3 },
    { atSec: 4.5, durSec: 0.45, note: 66, gain: 0.45 },
    { atSec: 4.9, durSec: 0.45, note: 64, gain: 0.43 },
    { atSec: 5.3, durSec: 1.2, note: 61, gain: 0.5 },
    { atSec: 5.4, durSec: 1.2, note: 48, gain: 0.28 },
  ],
}

// The close: the sixth, the seventh, the flat second, and then, once, the C itself, held and left.
const TOUCHED_ONCE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.65, note: 57, gain: 0.42 },
    { atSec: 0.6, durSec: 0.55, note: 59, gain: 0.44 },
    { atSec: 1.1, durSec: 1.3, note: 61, gain: 0.52 },
    { atSec: 2.4, durSec: 0.6, note: 64, gain: 0.46 },
    { atSec: 3, durSec: 1.05, note: 61, gain: 0.5 },
    { atSec: 4, durSec: 0.72, note: 59, gain: 0.44 },
    { atSec: 4.7, durSec: 1.7, note: 60, gain: 0.5 },
  ],
}

// A, B and a D flat held long, over a C that only the drone has.
const OVER_THE_DRONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.3, note: 48, gain: 0.36 },
    { atSec: 0.4, durSec: 1, note: 57, gain: 0.45 },
    { atSec: 1.35, durSec: 0.95, note: 59, gain: 0.45 },
    { atSec: 2.2, durSec: 4, note: 61, gain: 0.52 },
  ],
}

// Two voices trade D flat and A, an augmented fifth, over C and B, and end on it together.
const TRADED: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.3, note: 48, gain: 0.32 },
    { atSec: 0, durSec: 6.3, note: 59, gain: 0.24 },
    { atSec: 0.4, durSec: 1.4, note: 61, gain: 0.5 },
    { atSec: 1.6, durSec: 1.5, note: 69, gain: 0.45 },
    { atSec: 2.9, durSec: 1.4, note: 61, gain: 0.5 },
    { atSec: 4.1, durSec: 2.2, note: 69, gain: 0.42 },
    { atSec: 4.5, durSec: 1.8, note: 61, gain: 0.45 },
  ],
}

// A leading note on either side: B rises and D flat falls, and both arrive on C.
const BOTH_SIDES: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.1, note: 57, gain: 0.4 },
    { atSec: 0, durSec: 2.1, note: 76, gain: 0.36 },
    { atSec: 2, durSec: 2.1, note: 59, gain: 0.44 },
    { atSec: 2, durSec: 2.1, note: 73, gain: 0.42 },
    { atSec: 2, durSec: 2.1, note: 66, gain: 0.3 },
    { atSec: 4.1, durSec: 2.3, note: 60, gain: 0.42 },
    { atSec: 4.1, durSec: 2.3, note: 72, gain: 0.38 },
    { atSec: 4.1, durSec: 2.3, note: 64, gain: 0.3 },
  ],
}

// Chords of the five other notes over a C pedal: B E A in fourths, then A major over its third,
// F sharp minor over its fifth, and the fourths again.
const FIVE_WITHOUT: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 48, gain: 0.36 },
    { atSec: 0.2, durSec: 1.6, note: 59, gain: 0.36 },
    { atSec: 0.2, durSec: 1.6, note: 64, gain: 0.36 },
    { atSec: 0.2, durSec: 1.6, note: 69, gain: 0.4 },
    { atSec: 1.8, durSec: 1.6, note: 61, gain: 0.38 },
    { atSec: 1.8, durSec: 1.6, note: 64, gain: 0.34 },
    { atSec: 1.8, durSec: 1.6, note: 69, gain: 0.38 },
    { atSec: 3.4, durSec: 1.5, note: 61, gain: 0.38 },
    { atSec: 3.4, durSec: 1.5, note: 66, gain: 0.36 },
    { atSec: 3.4, durSec: 1.5, note: 69, gain: 0.38 },
    { atSec: 4.9, durSec: 1.5, note: 59, gain: 0.36 },
    { atSec: 4.9, durSec: 1.5, note: 64, gain: 0.34 },
    { atSec: 4.9, durSec: 1.5, note: 69, gain: 0.36 },
  ],
}

// The line in a low register over a held C: from F sharp up to the D flat and back, the C between
// them stepped past.
const LOW_REED: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 48, gain: 0.28 },
    { atSec: 0, durSec: 0.95, note: 54, gain: 0.45 },
    { atSec: 0.9, durSec: 1.5, note: 57, gain: 0.5 },
    { atSec: 2.4, durSec: 0.6, note: 59, gain: 0.45 },
    { atSec: 3, durSec: 1.5, note: 61, gain: 0.52 },
    { atSec: 4.5, durSec: 0.55, note: 57, gain: 0.44 },
    { atSec: 5, durSec: 1.4, note: 54, gain: 0.46 },
  ],
}

// A bass that puts off going home: B, D flat, A, B, D flat, and only then the C between them.
const BASS_AROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 47, gain: 0.5 },
    { atSec: 1, durSec: 1.4, note: 49, gain: 0.58 },
    { atSec: 2.5, durSec: 1, note: 45, gain: 0.55 },
    { atSec: 3.6, durSec: 0.6, note: 47, gain: 0.5 },
    { atSec: 4.3, durSec: 0.9, note: 49, gain: 0.55 },
    { atSec: 5.3, durSec: 1.3, note: 48, gain: 0.52 },
  ],
}

// The line an octave up over a held middle C, entered from the sixth: A, F sharp, E, D flat, and round
// the C by its B.
const HIGH_ROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 60, gain: 0.28 },
    { atSec: 0, durSec: 1.25, note: 81, gain: 0.46 },
    { atSec: 1.2, durSec: 0.45, note: 78, gain: 0.42 },
    { atSec: 1.6, durSec: 0.45, note: 76, gain: 0.42 },
    { atSec: 2, durSec: 1.45, note: 73, gain: 0.5 },
    { atSec: 3.4, durSec: 0.55, note: 71, gain: 0.42 },
    { atSec: 3.9, durSec: 0.65, note: 69, gain: 0.42 },
    { atSec: 4.5, durSec: 0.5, note: 71, gain: 0.42 },
    { atSec: 5, durSec: 1.4, note: 73, gain: 0.5 },
  ],
}

// The high line as it closes over a held middle C: up to F sharp, down through D flat and B, and at
// last the C of the drone, an octave over it.
const HIGH_TOUCH: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.5, note: 60, gain: 0.28 },
    { atSec: 0, durSec: 0.55, note: 69, gain: 0.42 },
    { atSec: 0.5, durSec: 0.45, note: 71, gain: 0.42 },
    { atSec: 0.9, durSec: 1.3, note: 73, gain: 0.5 },
    { atSec: 2.2, durSec: 0.45, note: 76, gain: 0.44 },
    { atSec: 2.6, durSec: 0.45, note: 78, gain: 0.46 },
    { atSec: 3, durSec: 0.45, note: 76, gain: 0.42 },
    { atSec: 3.4, durSec: 0.95, note: 73, gain: 0.48 },
    { atSec: 4.3, durSec: 0.65, note: 71, gain: 0.42 },
    { atSec: 4.9, durSec: 1.6, note: 72, gain: 0.48 },
  ],
}

// The line in the low octave of a flute: D flat to A by way of E and F sharp, and down again.
const LOW_FLUTE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.25, note: 61, gain: 0.5 },
    { atSec: 1.2, durSec: 0.65, note: 64, gain: 0.44 },
    { atSec: 1.8, durSec: 0.65, note: 66, gain: 0.46 },
    { atSec: 2.4, durSec: 1.55, note: 69, gain: 0.52 },
    { atSec: 3.9, durSec: 0.65, note: 66, gain: 0.44 },
    { atSec: 4.5, durSec: 0.65, note: 64, gain: 0.44 },
    { atSec: 5.1, durSec: 1.35, note: 61, gain: 0.5 },
  ],
}

// The same line with a second flute on C, which sounds only while the line is away from it: under E,
// F sharp and A, and gone when the D flat comes back.
const WHILE_AWAY: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.25, note: 61, gain: 0.5 },
    { atSec: 1.2, durSec: 0.65, note: 64, gain: 0.44 },
    { atSec: 1.3, durSec: 3.6, note: 60, gain: 0.32 },
    { atSec: 1.8, durSec: 0.65, note: 66, gain: 0.46 },
    { atSec: 2.4, durSec: 1.55, note: 69, gain: 0.52 },
    { atSec: 3.9, durSec: 0.65, note: 66, gain: 0.44 },
    { atSec: 4.5, durSec: 0.65, note: 64, gain: 0.44 },
    { atSec: 5.1, durSec: 1.35, note: 61, gain: 0.5 },
  ],
}

// The plucked drone by itself: one C held while its strings go round.
const ONE_KEY: Phrase = { notes: [{ atSec: 0, durSec: 6.8, note: 48, gain: 0.7 }] }

// The same an octave up.
const KEY_ABOVE: Phrase = { notes: [{ atSec: 0, durSec: 6.8, note: 60, gain: 0.7 }] }

// A drone set on the seventh: B, with no C in it.
const ON_THE_SEVENTH: Phrase = { notes: [{ atSec: 0, durSec: 6.8, note: 59, gain: 0.65 }] }

// A drone set on the sixth: A, then the A an octave over it.
const ON_THE_SIXTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 57, gain: 0.5 },
    { atSec: 1.2, durSec: 5.6, note: 69, gain: 0.35 },
  ],
}

// A drone set on the raised fourth: F sharp, and its octave.
const ON_THE_FOURTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 54, gain: 0.5 },
    { atSec: 1.2, durSec: 5.6, note: 66, gain: 0.35 },
  ],
}

// A drone on the sixth that the seventh is laid over.
const SIXTH_THEN_SEVENTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 57, gain: 0.5 },
    { atSec: 2.4, durSec: 4.4, note: 59, gain: 0.45 },
  ],
}

// The drone that leans: C and its octave, with the B of the seventh on top.
const LEANING: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 36, gain: 0.5 },
    { atSec: 0, durSec: 6.8, note: 48, gain: 0.42 },
    { atSec: 0.6, durSec: 6.2, note: 59, gain: 0.4 },
  ],
}

// The two strong notes held over each other, the sixth and the flat second: an augmented fifth.
const STRONG_PAIR: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 61, gain: 0.5 },
    { atSec: 1.6, durSec: 5.2, note: 69, gain: 0.45 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Tanpura: tuned to the seventh, or set on a note of the scale so that no C sounds at all.
  {
    id: 'missing-tonic-ni-at-lamp-time',
    name: 'Ni at lamp time',
    category: 'drone',
    description:
      'A tanpura tuned to the seventh, its bridge half open and one slow round of nine seconds, in a dark hall.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Evening Ni',
      params: { volume: -1.5, jawari: 0.45, speed: 9, decay: 24 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } }],
  },
  {
    id: 'missing-tonic-a-semitone-below',
    name: 'A semitone below',
    category: 'drone',
    description:
      'A bright quick tanpura tuned to the seventh with little gourd, thin tape repeats after it and the top opened wide.',
    preview: KEY_ABOVE,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Bright Ni shimmer',
      params: { volume: -0.5, speed: 3, decay: 7 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { mix: 0.4 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'missing-tonic-under-the-gourd',
    name: 'Under the gourd',
    category: 'drone',
    description:
      'A dark tanpura on the seventh with a large gourd and an octave added below each string, its top shaded.',
    preview: KEY_ABOVE,
    instrument: { deviceId: 'tanpura', preset: 'Dark slow Ni', params: { speed: 7, jawari: 0.1 } },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.7, up1: 0 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'missing-tonic-bowls-without-sa',
    name: 'Bowls without Sa',
    category: 'drone',
    description:
      'A tanpura on Pa with little buzz, best keyed on B, striking bowls tuned to five notes on A with no C among them.',
    preview: ON_THE_SEVENTH,
    instrument: { deviceId: 'tanpura', preset: 'Closed jawari', params: { volume: -1, speed: 5 } },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Long ring',
        params: { root: 9, scale: 0, bowls: 10, ring: 20, mix: 0.55 },
      },
    ],
  },
  {
    id: 'missing-tonic-two-strings-apart',
    name: 'Two strings apart',
    category: 'drone',
    description:
      'A slow tanpura on the seventh, its two middle strings eight cents apart, every pluck blurred into a drifting cloud.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wide beating',
      params: { volume: 0, tuning: 2, speed: 8 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Rolling in' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'missing-tonic-bridge-laid-bare',
    name: 'Bridge laid bare',
    category: 'drone',
    description:
      'A tanpura on the seventh with no buzz at all, all gourd, moved a fraction of a hertz by a slow frequency shift.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: { tuning: 2, speed: 6, body: 0.9 },
    },
    effects: [{ deviceId: 'freq-shifter', preset: 'Slow drift', params: { mix: 0.5 } }],
  },
  {
    id: 'missing-tonic-practice-on-a-small-set',
    name: 'Practice on a small set',
    category: 'drone',
    description:
      'A buzzing tanpura on the seventh, all in the middle, heard from a small speaker beside a bed.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Mono gourd drone',
      params: { volume: 2.5, tuning: 2, speed: 5 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Bedside radio' }],
  },
  {
    id: 'missing-tonic-buzz-into-mist',
    name: 'Buzz into mist',
    category: 'texture',
    description:
      'A fast tanpura on the seventh with the bridge wide open, smeared until the plucks are gone into one haze.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Fast buzzing round',
      params: { tuning: 2, decay: 8 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { blur: 0.75, mix: 0.85 } },
    ],
  },
  {
    id: 'missing-tonic-round-with-no-pluck',
    name: 'Round with no pluck',
    category: 'drone',
    description:
      'A low Ma tanpura with its plucks faded in by a slow swell, in a low stone space; keyed on B it gives E and B.',
    preview: ON_THE_SEVENTH,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Low Ma gourd',
      params: { volume: 0.5, speed: 5, jawari: 0.35 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 500 } },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'missing-tonic-first-stars-out',
    name: 'First stars out',
    category: 'plucked',
    description:
      'Four plain plucks on the seventh with no bridge and no body, scattered into seven echoes.',
    preview: KEY_ABOVE,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Plain plucked four',
      params: { volume: 0, tuning: 2, speed: 4.5 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.5 } }],
  },
  {
    id: 'missing-tonic-third-under-the-seventh',
    name: 'Third under the seventh',
    category: 'drone',
    description:
      'A Ma tanpura in full bloom under a very slow phaser; keyed on B its first string is an E and no C sounds.',
    preview: ON_THE_SEVENTH,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Ma full bloom',
      params: { volume: -0.5, speed: 3 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.6 } }],
  },
  {
    id: 'missing-tonic-dha-in-a-wooden-box',
    name: 'Dha in a wooden box',
    category: 'drone',
    description:
      'A bare buzzing tanpura on Pa, meant for the key of A, rung through a large wooden soundboard.',
    preview: ON_THE_SIXTH,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Bare string buzz',
      params: { volume: -3.5, detune: 2 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { size: 2, mix: 0.75 } }],
  },
  {
    id: 'missing-tonic-turned-away',
    name: 'Turned away',
    category: 'drone',
    description:
      'A dry round of short plucks on the seventh followed by the same plucks turned backwards, slow and swelling.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Quick dry round',
      params: { volume: 2.5, tuning: 2, speed: 4 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.65 } }],
  },
  {
    id: 'missing-tonic-only-the-seventh',
    name: 'Only the seventh',
    category: 'drone',
    description:
      'A slow tanpura on Ni through a filter that rings on B and lets little else of it by.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wall',
      params: { volume: -1, tuning: 2, speed: 6 },
    },
    effects: [
      {
        deviceId: 'scale-filter',
        preset: 'One note drone',
        params: { root: 11, ring: 3, mix: 0.8 },
      },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },
  {
    id: 'missing-tonic-whistle-over-ni',
    name: 'Whistle over Ni',
    category: 'drone',
    description:
      'A wide tanpura on the seventh with one thin whistle, the eighth harmonic of B, sung out of it.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Evening Ni',
      params: { volume: -2.5, jawari: 0.95, speed: 4, spread: 1, body: 0.2 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'One held note',
        params: { root: 11, drone: 0.5, mix: 0.9 },
      },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'missing-tonic-strings-in-the-tank',
    name: 'Strings in the tank',
    category: 'drone',
    description:
      'A buzzing tanpura on the seventh far down under water, muffled and slowly wavering.',
    preview: KEY_ABOVE,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Dark slow Ni',
      params: { jawari: 0.7, speed: 5, body: 0.4 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Deep water', params: { bubbles: 0.15 } }],
  },
  {
    id: 'missing-tonic-from-the-evening-service',
    name: 'From the evening service',
    category: 'drone',
    description:
      'A buzzing quick tanpura set to the seventh, received on a clear sideband that fades in and out.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { volume: -4, tuning: 2, speed: 3, jawari: 0.9, body: 0.2, decay: 20 },
    },
    effects: [{ deviceId: 'radio', preset: 'Clear sideband', params: { fading: 0.7 } }],
  },

  // Drone: what the melody leaves out, or a chord of the other five.
  {
    id: 'missing-tonic-what-is-left-out',
    name: 'What is left out',
    category: 'drone',
    description: 'Deep wandering octaves with a strong sub that open and close on one long sigh.',
    preview: LEANING,
    instrument: { deviceId: 'drone', preset: 'Deep octaves', params: { attack: 1.5, release: 5 } },
    effects: [{ deviceId: 'breath', preset: 'Long slow sigh', params: { depth: 0.5 } }],
  },
  {
    id: 'missing-tonic-triad-on-dha',
    name: 'Triad on Dha',
    category: 'drone',
    description:
      'A reedy just major chord with a little air, made for a held A, whose notes are A, D flat and E, on a bright plate.',
    preview: ON_THE_SIXTH,
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: { volume: -1, attack: 1.2, release: 4, wave: 0.45, air: 0.1, cutoff: 3000 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate' }],
  },
  {
    id: 'missing-tonic-raised-fourth-at-dusk',
    name: 'Raised fourth at dusk',
    category: 'drone',
    description:
      'A dark just minor chord, made for a held F sharp, leaning slowly from side to side on cassette.',
    preview: ON_THE_FOURTH,
    instrument: { deviceId: 'drone', preset: 'Minor dusk', params: { attack: 1.4, release: 5 } },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'around', preset: 'Slow wander' },
    ],
  },
  {
    id: 'missing-tonic-fifths-but-elsewhere',
    name: 'Fifths, but elsewhere',
    category: 'drone',
    description:
      'Open fifths swelling in; on A and on B they stay clear of C and of G. A slow chorus turns them.',
    preview: SIXTH_THEN_SEVENTH,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: { volume: -5, attack: 1, sub: 0.1, cutoff: 4500, release: 3 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Slow drift' }],
  },
  {
    id: 'missing-tonic-saws-in-the-doorway',
    name: 'Saws in the doorway',
    category: 'drone',
    description:
      'A swarm of saw waves round one note, opened and shut by a low pass filter that takes its time.',
    preview: LEANING,
    instrument: {
      deviceId: 'drone',
      preset: 'Saw swarm',
      params: { movement: 0.6, rate: 0.3, sub: 0.3 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
    ],
  },
  {
    id: 'missing-tonic-wind-with-no-c',
    name: 'Wind with no C',
    category: 'texture',
    description:
      'Nothing but tuned air, through a filter that passes five notes on A and leaves the C out.',
    preview: STRONG_PAIR,
    instrument: { deviceId: 'drone', preset: 'Tuned wind', params: { attack: 1, release: 3 } },
    effects: [
      { deviceId: 'scale-filter', preset: 'Long glass', params: { root: 9, ring: 1.5 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'missing-tonic-tonic-in-the-floor',
    name: 'Tonic in the floor',
    category: 'drone',
    description: 'A bare low hum, mostly sub octave, that swells and sinks as gently as a breath.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'drone',
      preset: 'Low hum',
      params: { attack: 1, release: 3, cutoff: 320 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'tremolo', preset: 'Gentle breath' },
    ],
  },
  {
    id: 'missing-tonic-four-round-the-seventh',
    name: 'Four round the seventh',
    category: 'drone',
    description:
      'Four tones of a cluster, which on B are B, D flat, F sharp and E, pure and still and only a little blurred.',
    preview: ON_THE_SEVENTH,
    instrument: {
      deviceId: 'drone',
      preset: 'Suspended second',
      params: {
        volume: -5,
        partials: 0.43,
        wave: 0,
        movement: 0.3,
        attack: 0.8,
        release: 4,
        air: 0,
      },
    },
    effects: [{ deviceId: 'fog', preset: 'Thin veil' }],
  },
  {
    id: 'missing-tonic-re-and-dha-held',
    name: 'Re and Dha held',
    category: 'pad',
    description:
      'Bright restless octaves for two held notes, each band of them carrying its own small tremolo.',
    preview: STRONG_PAIR,
    instrument: {
      deviceId: 'drone',
      preset: 'Octave shimmer',
      params: { attack: 1, release: 4, rate: 0.6 },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Light on water' }],
  },
  {
    id: 'missing-tonic-stopped-at-the-sixth',
    name: 'Stopped at the sixth',
    category: 'organ',
    description:
      'A still pipe-like tone built of its first harmonics only, a slow rotor turning in front of it.',
    preview: ON_THE_SIXTH,
    instrument: {
      deviceId: 'drone',
      preset: 'Still organ',
      params: { partials: 0.7, attack: 0.4, release: 1.6 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.1 } }],
  },
  {
    id: 'missing-tonic-held-without-moving',
    name: 'Held without moving',
    category: 'drone',
    description:
      'An unmoving unison of mixed waves in the middle of the field, its overtones let sing by a faint feedback.',
    preview: LEANING,
    instrument: {
      deviceId: 'drone',
      preset: 'Standing wave',
      params: { volume: -6.5, shape: 0, attack: 1, release: 2.5 },
    },
    effects: [{ deviceId: 'howl', preset: 'Slow bloom', params: { mix: 0.45 } }],
  },
  {
    id: 'missing-tonic-glass-on-the-fourth',
    name: 'Glass on the fourth',
    category: 'pad',
    description:
      'A clear just minor chord of sines that comes quickly, meant for F sharp, its tail climbing in octaves.',
    preview: ON_THE_FOURTH,
    instrument: { deviceId: 'drone', preset: 'Minor glass', params: { release: 2 } },
    effects: [
      { deviceId: 'shimmer', preset: 'Glass', params: { interval: 0, decay: 7, mix: 0.4 } },
    ],
  },
  {
    id: 'missing-tonic-left-sounding',
    name: 'Left sounding',
    category: 'drone',
    description:
      'A latched unison: let go of the key and it sounds on, filtered low and drifting in separate bands.',
    preview: ONE_KEY,
    instrument: { deviceId: 'drone', preset: 'Latched unison', params: { attack: 1, cutoff: 900 } },
    effects: [{ deviceId: 'currents', preset: 'Wide tide' }],
  },
  {
    id: 'missing-tonic-the-sixth-on-a-disc',
    name: 'The sixth on a disc',
    category: 'drone',
    description:
      'A warm just major chord, for a held A, on a warped record that sways and crackles a little.',
    preview: ON_THE_SIXTH,
    instrument: {
      deviceId: 'drone',
      preset: 'Held major',
      params: { hold: 0, attack: 1.2, release: 3 },
    },
    effects: [{ deviceId: 'vinyl', preset: 'Warped', params: { crackle: 0.15 } }],
  },
  {
    id: 'missing-tonic-the-room-keeps-it',
    name: 'The room keeps it',
    category: 'drone',
    description:
      'Thin octaves with a saw edge, recorded over themselves through a room until its own tones ring.',
    preview: LEANING,
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: { wave: 0.9, sub: 0, cutoff: 3200, partials: 0.8, attack: 0.5, release: 2 },
    },
    effects: [{ deviceId: 'generations', preset: 'Room tone hangs', params: { mix: 0.6 } }],
  },
  {
    id: 'missing-tonic-close-neighbours',
    name: 'Close neighbours',
    category: 'texture',
    description:
      'Airy crowded tones a step apart, looped under themselves at half speed, an octave down.',
    preview: ON_THE_SEVENTH,
    instrument: {
      deviceId: 'drone',
      preset: 'Fog cluster',
      params: { volume: -6, partials: 0.43, attack: 1.2, release: 4, air: 0.35 },
    },
    effects: [{ deviceId: 'micro-looper', preset: 'Half speed', params: { mix: 0.5 } }],
  },

  // Ember: leads that slide round the note, pads that hold the five others, dark low and bright high.
  {
    id: 'missing-tonic-chords-of-five',
    name: 'Chords of five',
    category: 'pad',
    description:
      'A warm two saw pad that opens slowly, kept dark, its chords turned by a deep chorus.',
    preview: FIVE_WITHOUT,
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: { ampAttack: 0.5, ampRelease: 2.5, cutoff: 900, keyTrack: 0.8 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.4 } }],
  },
  {
    id: 'missing-tonic-both-its-neighbours',
    name: 'Both its neighbours',
    category: 'pad',
    description:
      'Three detuned saws that bow in, dulled and swaying on tape, in a hall whose lows last longest.',
    preview: BOTH_SIDES,
    instrument: {
      deviceId: 'ember',
      preset: 'Slow strings',
      params: { ampAttack: 0.6, ampRelease: 1.6, cutoff: 2000, filterAttack: 1 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket', params: { wow: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'missing-tonic-glass-at-the-edge',
    name: 'Glass at the edge',
    category: 'pad',
    description:
      'A glassy pad of triangle and narrow pulse, a faint octave halo climbing out of its tail.',
    preview: TRADED,
    instrument: {
      deviceId: 'ember',
      preset: 'Glass pad',
      params: { ampAttack: 0.25, ampRelease: 3, resonance: 0.45, cutoff: 4500 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { interval: 0 } }],
  },
  {
    id: 'missing-tonic-sa-under-the-floor',
    name: 'Sa under the floor',
    category: 'drone',
    description:
      'A saw and a pulse an octave under it, a low filter drifting over them, warmed and set a room away.',
    preview: LEANING,
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: { ampAttack: 0.8, ampRelease: 3, cutoff: 380 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'distance', preset: 'Across the room' },
    ],
  },
  {
    id: 'missing-tonic-sixth-against-second',
    name: 'Sixth against second',
    category: 'pad',
    description:
      'A pad with its octave and a breath of noise, split into bands that each swell on a slow cycle of its own.',
    preview: TRADED,
    instrument: {
      deviceId: 'ember',
      preset: 'Airy pad',
      params: { ampAttack: 0.4, ampRelease: 2.5, noiseLevel: 0.12 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Gentle drift' },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'missing-tonic-slid-into-slowly',
    name: 'Slid into slowly',
    category: 'voice',
    description:
      'One triangle voice that slides from note to note and sways a little, dark echoes after it.',
    preview: TOUCHED_ONCE,
    instrument: {
      deviceId: 'ember',
      preset: 'Init',
      params: {
        osc1Shape: 2,
        voiceMode: 2,
        glide: 0.22,
        cutoff: 2600,
        filterSlope: 0,
        ampAttack: 0.08,
        ampRelease: 0.5,
        lfo2Amount: 0.008,
        lfo2Rate: 4.6,
      },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.35 } }],
  },
  {
    id: 'missing-tonic-hard-edge-of-re',
    name: 'Hard edge of Re',
    category: 'voice',
    description:
      'A synced saw lead with its brightness held down, played from a speaker at the far end of a hall.',
    preview: TOUCHED_ONCE,
    instrument: {
      deviceId: 'ember',
      preset: 'Sync Lead',
      params: {
        volume: -7.5,
        osc2Coarse: 4,
        cutoff: 1500,
        ampAttack: 0.05,
        glide: 0.14,
        filterEnvAmount: 0.15,
        ampRelease: 0.4,
      },
    },
    effects: [{ deviceId: 're-amp', preset: 'Far end of the hall' }],
  },
  {
    id: 'missing-tonic-cupped-round-nothing',
    name: 'Cupped round nothing',
    category: 'pad',
    description:
      'A hollow square and triangle pad that comes quickly and is swept by a very slow flanger.',
    preview: FIVE_WITHOUT,
    instrument: {
      deviceId: 'ember',
      preset: 'Hollow Pad',
      params: { volume: -2.5, ampAttack: 0.12, ampRelease: 0.9, cutoff: 1100 },
    },
    effects: [{ deviceId: 'flanger', preset: 'Glacial drift' }],
  },
  {
    id: 'missing-tonic-a-dim-conch',
    name: 'A dim conch',
    category: 'wind',
    description:
      'A low brass-like swell of two saws with its filter kept down, blown inside a shell.',
    preview: LOW_REED,
    instrument: {
      deviceId: 'ember',
      preset: 'Brass',
      params: {
        volume: 1,
        cutoff: 420,
        filterEnvAmount: 0.4,
        filterAttack: 0.25,
        ampAttack: 0.12,
        ampRelease: 0.5,
        voiceMode: 0,
        glide: 0,
      },
    },
    effects: [{ deviceId: 'vessel', preset: 'Shell to the ear', params: { mix: 0.5 } }],
  },
  {
    id: 'missing-tonic-plucked-past-it',
    name: 'Plucked past it',
    category: 'plucked',
    description:
      'Short glassy plucks, levelled and laid on a loop of tape that turns them over and over, a little duller each time.',
    preview: PLUCKED_ROUND,
    instrument: {
      deviceId: 'ember',
      preset: 'Glass Pluck',
      params: { volume: 6, ampAttack: 0.012, ampDecay: 0.9, filterDecay: 0.4, ampRelease: 0.6 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -8 } },
      { deviceId: 'tape-loop', preset: 'Slow fade' },
    ],
  },
  {
    id: 'missing-tonic-lamps-being-lit',
    name: 'Lamps being lit',
    category: 'bell',
    description:
      'Soft bells of two sines two octaves apart that a long echo remembers and brings back later.',
    preview: TRADED,
    instrument: {
      deviceId: 'ember',
      preset: 'Bell',
      params: { volume: 4, ampAttack: 0.01, ampDecay: 2.5, oscMix: 0.25, osc2Coarse: 24 },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Hazy past' }],
  },
  {
    id: 'missing-tonic-through-the-teeth',
    name: 'Through the teeth',
    category: 'wind',
    description:
      'A sine in noise, through a narrow band that follows the keys like a whistle, in a short bright chamber.',
    preview: LOW_REED,
    instrument: {
      deviceId: 'ember',
      preset: 'Noise Sweep',
      params: {
        volume: -5,
        cutoff: 262,
        keyTrack: 1,
        resonance: 0.7,
        filterEnvAmount: 0,
        ampAttack: 0.15,
        ampRelease: 0.6,
      },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.3 } }],
  },
  {
    id: 'missing-tonic-seven-saws-held-back',
    name: 'Seven saws held back',
    category: 'pad',
    description:
      'Seven spread voices of two saws each under a low filter, slow to come, rippled softly by two gates that drift apart.',
    preview: FIVE_WITHOUT,
    instrument: {
      deviceId: 'ember',
      preset: 'Super Saw',
      params: {
        cutoff: 700,
        filterSlope: 1,
        ampAttack: 0.5,
        ampRelease: 1.5,
        unisonDetune: 34,
        volume: -6,
      },
    },
    effects: [{ deviceId: 'pulses', preset: 'Faint ripple' }],
  },
  {
    id: 'missing-tonic-bass-that-waits',
    name: 'Bass that waits',
    category: 'bass',
    description:
      'A triangle and a thin pulse that slide from note to note with a slow front, rounded by a tape curve.',
    preview: BASS_AROUND,
    instrument: {
      deviceId: 'ember',
      preset: 'Sub Sine',
      params: {
        volume: -3,
        osc1Shape: 2,
        osc2Shape: 1,
        osc2Pw: 0.2,
        oscMix: 0.35,
        subLevel: 0.15,
        cutoff: 900,
        filterSlope: 0,
        ampAttack: 0.12,
        glide: 0.16,
        ampRelease: 0.6,
      },
    },
    effects: [{ deviceId: 'saturator', preset: 'On tape', params: { driveDb: 10 } }],
  },
  {
    id: 'missing-tonic-reeds-widening',
    name: 'Reeds widening',
    category: 'organ',
    description:
      'Two pulse waves whose widths turn slowly, six cents apart, coloured by a hollow tube and a faint rotor.',
    preview: BOTH_SIDES,
    instrument: {
      deviceId: 'ember',
      preset: 'Init',
      params: {
        osc1Shape: 1,
        osc1Pw: 0.3,
        osc2Shape: 1,
        osc2Pw: 0.15,
        osc2Fine: 6,
        oscMix: 0.45,
        cutoff: 3500,
        lfo1Dest: 4,
        lfo1Amount: 0.4,
        lfo1Rate: 0.4,
        ampAttack: 0.06,
        ampRelease: 0.25,
      },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube' },
      { deviceId: 'rotary', preset: 'Faint motion' },
    ],
  },
  {
    id: 'missing-tonic-only-the-upper-half',
    name: 'Only the upper half',
    category: 'pad',
    description: 'A saw pad with everything low cut away, its hall shaped like a closed vowel.',
    preview: FIVE_WITHOUT,
    instrument: {
      deviceId: 'ember',
      preset: 'Airy pad',
      params: {
        volume: 1,
        filterType: 1,
        cutoff: 900,
        noiseLevel: 0,
        oscMix: 0.15,
        ampAttack: 0.7,
        ampRelease: 2,
      },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.5 } }],
  },

  // Bow: plucked, held or bowed; near the bridge or far from it, over its own drone or alone.
  {
    id: 'missing-tonic-gut-over-the-drone',
    name: 'Gut over the drone',
    category: 'string',
    description:
      'A bright pressed bow near the bridge, almost no body to it, with a slow wide vibrato, in a vast nave.',
    preview: OVER_THE_DRONE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.35,
        brightness: 0.7,
        position: 0.05,
        body: 0.1,
        vibrato: 0.45,
        vibratoRate: 4.2,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } }],
  },
  {
    id: 'missing-tonic-the-answering-bow',
    name: 'The answering bow',
    category: 'string',
    description:
      'A light glassy bow that comes straight and begins to sway only when a note is held.',
    preview: TRADED,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.3, release: 1.4, vibrato: 0, brightness: 0.9 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { depth: 30 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'missing-tonic-bow-without-weight',
    name: 'Bow without weight',
    category: 'string',
    description: 'A weightless bow far up the string, heard from the back of a hall.',
    preview: CIRCLING,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.15, release: 0.9, brightness: 0.1 },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
  },
  {
    id: 'missing-tonic-rough-low-bow',
    name: 'Rough low bow',
    category: 'string',
    description:
      'A hard bow close to the bridge and a full body, with a single dark spring behind.',
    preview: LOW_REED,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: { attack: 0.12, release: 0.8, brightness: 0.55, body: 1 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.35 } }],
  },
  {
    id: 'missing-tonic-a-desk-of-bows',
    name: 'A desk of bows',
    category: 'string',
    description:
      'A dull loosely tuned section bowed near the bridge, a flock of it wheeling wide and dull behind.',
    preview: FIVE_WITHOUT,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: {
        attack: 0.4,
        release: 1.4,
        vibrato: 0.1,
        vibratoRate: 5,
        detune: 14,
        brightness: 0.2,
        position: 0.07,
        body: 0.6,
      },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Wide and dull', params: { mix: 0.5 } }],
  },
  {
    id: 'missing-tonic-strings-that-learn',
    name: 'Strings that learn',
    category: 'string',
    description:
      'A held string that swells in, with sixteen sympathetic strings that learn its notes and ring on them.',
    preview: TRADED,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Sustained swell',
      params: {
        volume: -13.5,
        attack: 0.25,
        release: 1.2,
        brightness: 0.35,
        detune: 0,
        vibrato: 0.3,
      },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Learn and hold', params: { mix: 0.5 } }],
  },
  {
    id: 'missing-tonic-followed-by-itself',
    name: 'Followed by itself',
    category: 'plucked',
    description:
      'Plucks with their fronts faded off and levelled, a single soft follower repeating the line some way behind.',
    preview: PLUCKED_ROUND,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { volume: 1.5, attack: 0.2, release: 2, brightness: 0.45, body: 0.7 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash' },
      { deviceId: 'canon', preset: 'Faint answer', params: { gap: 1.4, mix: 0.35 } },
    ],
  },
  {
    id: 'missing-tonic-shadow-of-the-line',
    name: 'Shadow of the line',
    category: 'string',
    description:
      'A pure held string with no body, its strongest partials redrawn by slow sines an octave above.',
    preview: BOTH_SIDES,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 0.5, release: 2 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { attack: 600, mix: 0.55 } },
    ],
  },
  {
    id: 'missing-tonic-wire-turning-over',
    name: 'Wire turning over',
    category: 'plucked',
    description:
      'Bright wire plucks that ring for a long time, two loops of unequal length carrying them on.',
    preview: PLUCKED_ROUND,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { volume: -3.5, release: 4 },
    },
    effects: [
      { deviceId: 'orbits', preset: 'Two voices' },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'missing-tonic-thumbed-gut',
    name: 'Thumbed gut',
    category: 'bass',
    description:
      'A damped low pluck on a big body, made a little fuller by a transformer and levelled hard.',
    preview: BASS_AROUND,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { decay: 2.5, brightness: 0.15, release: 0.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'fet-limiter', preset: 'Squash' },
    ],
  },
  {
    id: 'missing-tonic-sings-an-octave-off',
    name: 'Sings an octave off',
    category: 'string',
    description:
      'A string pressed by its sustainer into its octave, with earlier moments of it drifting back, many of them backwards.',
    preview: OVER_THE_DRONE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { volume: -4.5, attack: 0.3, release: 1.5, brightness: 0.45 },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Backwards', params: { mix: 0.45 } }],
  },
  {
    id: 'missing-tonic-held-in-cold-light',
    name: 'Held in cold light',
    category: 'string',
    description:
      'A bright thin held string set deep in winter: thinned, frozen and a little gritty.',
    preview: OVER_THE_DRONE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Twelfth glow',
      params: { attack: 0.5, release: 2, position: 0.3 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Deep winter', params: { mix: 0.8 } }],
  },
  {
    id: 'missing-tonic-lute-in-a-stairwell',
    name: 'Lute in a stairwell',
    category: 'plucked',
    description: 'A felted pluck let into a swarm of short echoes that patter after every note.',
    preview: PLUCKED_ROUND,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { volume: 1, decay: 3, detune: 0 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.45 } }],
  },
  {
    id: 'missing-tonic-strings-pulled-wide',
    name: 'Strings pulled wide',
    category: 'plucked',
    description:
      'Pairs of plucked strings a quarter of a semitone apart, their overtones stretched towards stiff wire.',
    preview: TRADED,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { release: 4, decay: 12, attack: 0.03 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Stiff string' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },

  // Clarinet: the double reed of the evening and its neighbours, from a hum to a full breath.
  {
    id: 'missing-tonic-reed-with-its-drone',
    name: 'Reed with its drone',
    category: 'wind',
    description:
      'A swaying duduk with two more voices that hold a low C and the B under middle C, whatever it plays.',
    preview: TOUCHED_ONCE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { volume: 0.5, attack: 0.12, vibrato: 0.4 },
    },
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Two note drone',
        params: { scale: 13, v1Degrees: -12, v2Degrees: -1 },
      },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'missing-tonic-root-left-unblown',
    name: 'Root left unblown',
    category: 'wind',
    description:
      'A dark double reed with hardly any breath and a full vibrato, its edge cut away, in a small dark room.',
    preview: LOW_REED,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { bore: 0.2, blow: 0.12, breath: 0.05, vibrato: 0.95, attack: 0.06, release: 0.2 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Small dark room' },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'missing-tonic-bass-reed-and-cellos',
    name: 'Bass reed and cellos',
    category: 'wind',
    description:
      'A soft bass clarinet with a pad of dark strings that swells in late behind each note.',
    preview: LOW_REED,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { volume: 0, attack: 0.08, release: 0.4, breath: 0.3 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Dark cellos', params: { rise: 0.8, fall: 4 } }],
  },
  {
    id: 'missing-tonic-out-of-the-evening',
    name: 'Out of the evening',
    category: 'wind',
    description:
      'A reed that swells from nothing, answered late by a wide open valley of ten seconds.',
    preview: OVER_THE_DRONE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { volume: 2, attack: 0.6, release: 1.2, blow: 0.75, vibrato: 0.2 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley' }],
  },
  {
    id: 'missing-tonic-said-under-the-breath',
    name: 'Said under the breath',
    category: 'wind',
    description:
      'A breathy subtone with a little vibrato on a worn cassette that wavers and hisses.',
    preview: CIRCLING,
    instrument: { deviceId: 'clarinet', preset: 'Subtone tenor', params: { attack: 0.1 } },
    effects: [{ deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.2, speed: 3 } }],
  },
  {
    id: 'missing-tonic-more-air-than-note',
    name: 'More air than note',
    category: 'wind',
    description:
      'A whispered reed, its quiet ends brought up towards the rest and every onset smeared soft.',
    preview: CIRCLING,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { attack: 0.12, release: 1 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Just the ends' },
      { deviceId: 'spectral-blur', preset: 'Softened attacks' },
    ],
  },
  {
    id: 'missing-tonic-octave-walks-behind',
    name: 'Octave walks behind',
    category: 'wind',
    description: 'A ballad reed with a wide vibrato that an octave below repeats a little after.',
    preview: TOUCHED_ONCE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Ballad alto',
      params: { volume: 1.5, blow: 0.8, breath: 0.3, vibrato: 0.6 },
    },
    effects: [{ deviceId: 'canon', preset: 'Octave shadow', params: { gap: 0.7, mix: 0.45 } }],
  },
  {
    id: 'missing-tonic-a-hum-of-five',
    name: 'A hum of five',
    category: 'organ',
    description:
      'Reeds hardly blown at all, doubled into a fed-back cloud, lows and highs swaying in turn.',
    preview: FIVE_WITHOUT,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { volume: 0, attack: 0.2, release: 0.8 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Cloud' },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 2.2 } },
    ],
  },
  {
    id: 'missing-tonic-only-what-is-new',
    name: 'Only what is new',
    category: 'wind',
    description:
      'An open bright clarinet that is let through as a note begins and held back as it stays.',
    preview: CIRCLING,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: { volume: 3.5, vibrato: 0.1, release: 0.5 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'New notes up' },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'missing-tonic-unfolds-from-below',
    name: 'Unfolds from below',
    category: 'wind',
    description:
      'A reed in full slow sway whose echoes unfold over seconds, low bands before high ones.',
    preview: TRADED,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Wide vibrato reed',
      params: { attack: 0.2, release: 1 },
    },
    effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { time: 1800, mix: 0.45 } }],
  },
  {
    id: 'missing-tonic-reed-in-wool',
    name: 'Reed in wool',
    category: 'wind',
    description: 'A soft reed with a flutter of growl in it, wrapped in a dark fuzzed reverb.',
    preview: LOW_REED,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { volume: 2, growl: 0.45, blow: 0.3, attack: 0.1, release: 0.5 },
    },
    effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { decay: 4, mix: 0.4 } }],
  },
  {
    id: 'missing-tonic-never-let-go-of',
    name: 'Never let go of',
    category: 'wind',
    description:
      'A reed with a long fade, each note caught and carried on as a slow string-like bed.',
    preview: CIRCLING,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Slow fade reed',
      params: { volume: -1.5, release: 2, breath: 0.5 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Slow strings', params: { attack: 0.8, decay: 5 } }],
  },
  {
    id: 'missing-tonic-stops-without-pa',
    name: 'Stops without Pa',
    category: 'organ',
    description:
      'Hollow reeds sounded with flute stops, an octave under and an octave over, and no fifth among them.',
    preview: FIVE_WITHOUT,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { volume: -1, attack: 0.12, vibrato: 0.15 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Flute stops' },
      { deviceId: 'weather', preset: 'Breezy day', params: { mix: 0.5 } },
    ],
  },

  // Flute: the line an octave over the rest, from breath alone to a hard edge.
  {
    id: 'missing-tonic-from-the-far-bank',
    name: 'From the far bank',
    category: 'wind',
    description: 'A low flute a long way off over water, the surf of a far shore moving across it.',
    preview: WHILE_AWAY,
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { attack: 0.2, release: 1.2 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Far shore' },
      { deviceId: 'weather', preset: 'Far shore' },
    ],
  },
  {
    id: 'missing-tonic-bent-from-a-semitone',
    name: 'Bent from a semitone',
    category: 'wind',
    description:
      'A bamboo flute that takes each note from the semitone under it, swaying only late in a held one.',
    preview: LOW_FLUTE,
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: { scoop: 100, vibrato: 0, breath: 0.4, chiff: 0.5 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { depth: 35 } },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'missing-tonic-straight-to-the-close',
    name: 'Straight to the close',
    category: 'wind',
    description:
      'A straight concert flute with no vibrato and little breath on a long clear plate.',
    preview: HIGH_TOUCH,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { attack: 0.1, release: 0.8 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate' }],
  },
  {
    id: 'missing-tonic-pebble-over-the-tank',
    name: 'Pebble over the tank',
    category: 'wind',
    description: 'Breathy pan pipes whose short notes skip away over water, closer and softer.',
    preview: HIGH_ROUND,
    instrument: { deviceId: 'flute', preset: 'Pan pipes', params: { release: 0.3, blow: 0.3 } },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Soft pebble',
        params: { first: 320, loss: 2, mix: 0.45 },
      },
    ],
  },
  {
    id: 'missing-tonic-five-breaths-held',
    name: 'Five breaths held',
    category: 'pad',
    description:
      'Chords of breath with hardly a tone in them, a whispering vowel in the hall behind.',
    preview: FIVE_WITHOUT,
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { volume: -9, attack: 0.4, release: 1.4, blow: 0.3 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Whispering', params: { mix: 0.5 } }],
  },
  {
    id: 'missing-tonic-over-the-dry-field',
    name: 'Over the dry field',
    category: 'wind',
    description:
      'A wood flute that slides up into each note, its line let go into a long dark trail of tape.',
    preview: WHILE_AWAY,
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { vibrato: 0.15, scoop: 70, breath: 0.15 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { time: 1100, mix: 0.4 } },
    ],
  },
  {
    id: 'missing-tonic-recorder-and-two-drones',
    name: 'Recorder and two drones',
    category: 'wind',
    description:
      'A plain recorder that brings a held B and a C an octave under middle C along with every note.',
    preview: LOW_FLUTE,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { attack: 0.05, release: 0.3 },
    },
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Two note drone',
        params: { scale: 13, v1Degrees: -12, v2Degrees: -1, v1Level: -4 },
      },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'missing-tonic-climbs-never-there',
    name: 'Climbs, never there',
    category: 'wind',
    description:
      'A soft bamboo flute in full sway, in a tail that climbs for as long as it rings and never arrives.',
    preview: WHILE_AWAY,
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: { attack: 0.15, release: 1 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.45 } }],
  },
  {
    id: 'missing-tonic-sinks-by-a-semitone',
    name: 'Sinks by a semitone',
    category: 'wind',
    description:
      'A soft airy flute with no bend of its own, pieces of it falling by one semitone as they fade.',
    preview: HIGH_TOUCH,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft wind lead',
      params: { breath: 0.8, scoop: 0, vibrato: 0.15, release: 0.5 },
    },
    effects: [
      {
        deviceId: 'falling',
        preset: 'Wilting',
        params: { fall: -1, vary: 0.05, size: 1200, mix: 0.5 },
      },
    ],
  },
  {
    id: 'missing-tonic-from-the-horn-speaker',
    name: 'From the horn speaker',
    category: 'wind',
    description:
      'A hard blown flute through a driven horn loudspeaker in the open reach of a platform.',
    preview: HIGH_ROUND,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { volume: -13.5, attack: 0.04, vibrato: 0.35 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Station platform', params: { noise: 0.05 } }],
  },
  {
    id: 'missing-tonic-breath-brought-up',
    name: 'Breath brought up',
    category: 'wind',
    description:
      'Whispered pipes with everything quiet in them turned up, then restruck in soft octaves.',
    preview: WHILE_AWAY,
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { volume: -4, attack: 0.1, release: 0.6, breath: 0.7 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Breath' },
      { deviceId: 'cascade', preset: 'Restruck', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'missing-tonic-tide-of-re-and-dha',
    name: 'Tide of Re and Dha',
    category: 'pad',
    description:
      'A breathy wood flute swelling in, the room behind them rising and falling in slow waves.',
    preview: STRONG_PAIR,
    instrument: { deviceId: 'flute', preset: 'Slow wood swell', params: { attack: 1, release: 2 } },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Slow tide' }],
  },
  {
    id: 'missing-tonic-turned-about-the-ear',
    name: 'Turned about the ear',
    category: 'wind',
    description:
      'A full alto flute swung in a wide pendulum from ear to ear, with bowls on A that hold no C.',
    preview: WHILE_AWAY,
    instrument: { deviceId: 'flute', preset: 'Alto flute', params: { volume: -3, vibrato: 0.5 } },
    effects: [
      { deviceId: 'bowls', preset: 'Faint halo', params: { root: 9, scale: 0, mix: 0.35 } },
      { deviceId: 'around', preset: 'Wide pendulum' },
    ],
  },

  // Feedback: a held note that blooms, and two leading notes that fight for one amplifier.
  {
    id: 'missing-tonic-left-humming-on',
    name: 'Left humming on',
    category: 'string',
    description: 'A string caught by its amplifier at the octave, in a long tank of three springs.',
    preview: TOUCHED_ONCE,
    instrument: {
      deviceId: 'feedback',
      preset: 'Singing string',
      params: { pick: 0.25, release: 0.8, grit: 0.15 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring' }],
  },
  {
    id: 'missing-tonic-hum-before-the-note',
    name: 'Hum before the note',
    category: 'drone',
    description:
      'Strings that rise out of hum with no pluck, held on the note itself, the tail going down by octaves.',
    preview: OVER_THE_DRONE,
    instrument: {
      deviceId: 'feedback',
      preset: 'Out of the hum',
      params: { volume: -4.5, bloom: 0.5, release: 1.5 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { decay: 12, mix: 0.45 } }],
  },
  {
    id: 'missing-tonic-sung-two-octaves-up',
    name: 'Sung two octaves up',
    category: 'string',
    description:
      'A clean string held on its double octave, with a very slow ghost of itself far behind.',
    preview: TRADED,
    instrument: {
      deviceId: 'feedback',
      preset: 'Glass bow',
      params: { volume: -4.5, bloom: 0.5, release: 1.2, pick: 0.15 },
    },
    effects: [{ deviceId: 'stretch', preset: 'Faint halo', params: { mix: 0.35 } }],
  },
  {
    id: 'missing-tonic-low-string-kept-in',
    name: 'Low string kept in',
    category: 'bass',
    description:
      'A dark damped string that holds its own pitch, heard through the wall of the next room.',
    preview: BASS_AROUND,
    instrument: {
      deviceId: 'feedback',
      preset: 'Dark sustain',
      params: { release: 0.5, bloom: 0.1 },
    },
    effects: [{ deviceId: 'distance', preset: 'Next door', params: { level: 1 } }],
  },
  {
    id: 'missing-tonic-two-that-fight-for-it',
    name: 'Two that fight for it',
    category: 'string',
    description:
      'A torn chord whose strings crowd one amplifier out, so one leads and the rest sink, on a thick reel.',
    preview: BOTH_SIDES,
    instrument: {
      deviceId: 'feedback',
      preset: 'Fighting chord',
      params: { distance: 4, wander: 0.5, release: 0.8 },
    },
    effects: [{ deviceId: 'patina', preset: 'Quarter inch reel', params: { tone: 0.35 } }],
  },
  {
    id: 'missing-tonic-lets-go-upward',
    name: 'Lets go upward',
    category: 'string',
    description:
      'A string that is slow to let go, its tail lifting in pitch and thinning out as it ages.',
    preview: TOUCHED_ONCE,
    instrument: {
      deviceId: 'feedback',
      preset: 'Long sink',
      params: { distance: 1, bloom: 0.3, release: 2.5, pick: 0.6 },
    },
    effects: [{ deviceId: 'melt', preset: 'Evaporate', params: { mix: 0.5 } }],
  },
  {
    id: 'missing-tonic-nearly-caught',
    name: 'Nearly caught',
    category: 'plucked',
    description:
      'A pluck just at the edge of being held, its echoes drifting wide and a little out of tune.',
    preview: PLUCKED_ROUND,
    instrument: {
      deviceId: 'feedback',
      preset: 'Edge of hold',
      params: { volume: -2.5, pick: 0.85, release: 0.4, damp: 0.6 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Slow drift', params: { mix: 0.45 } }],
  },

  // Rewind: the note leaned on before it is struck.
  {
    id: 'missing-tonic-leaned-on-first',
    name: 'Leaned on first',
    category: 'keys',
    description:
      'A piano backwards: each note swells for less than a second into its strike, in a dark shadowed hall.',
    preview: PLUCKED_ROUND,
    instrument: {
      deviceId: 'rewind',
      preset: 'Turned piano',
      params: { volume: 2.5, swell: 0.6, tail: 0.6, snap: 0.15, tone: 0.35 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } }],
  },
  {
    id: 'missing-tonic-the-bell-not-yet',
    name: 'The bell not yet',
    category: 'bell',
    description:
      'Bells that gather before they are struck, with shards of them turned round again a moment later.',
    preview: TRADED,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bell arrival',
      params: { volume: 4.5, swell: 0.9, tone: 0.45 },
    },
    effects: [{ deviceId: 'grain-delay', preset: 'Backwards shards' }],
  },
  {
    id: 'missing-tonic-bowl-before-dark',
    name: 'Bowl before dark',
    category: 'bell',
    description:
      'Metal bowls rising for two seconds into a long ring, slowly beating, pulsed by a faint free ring modulator.',
    preview: STRONG_PAIR,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: { volume: 6, swell: 2, shimmer: 0.7 },
    },
    effects: [{ deviceId: 'ring', preset: 'Slow pulse', params: { frequency: 1.1, mix: 0.3 } }],
  },
  {
    id: 'missing-tonic-plucked-from-behind',
    name: 'Plucked from behind',
    category: 'plucked',
    description:
      'Backward plucks that stop almost dead, warbling as if behind glass, and set a few steps off.',
    preview: LOW_REED,
    instrument: {
      deviceId: 'rewind',
      preset: 'Pluck back',
      params: { volume: 6, swell: 0.45, tail: 0.3, snap: 0.3, tone: 0.65 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Behind glass' },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
  },
]
