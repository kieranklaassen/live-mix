import { type FactoryPreset, type Phrase } from '../types'

// The instruments that had no sound in any pack, each taught its first words by one rule that only
// it can keep. Every group below opens with its rule; its presets keep that rule and change all
// else: what is struck or blown, how bright, how long, and what the chain does with it. Where a
// group has a sixth it is a duet: two players, the second made by the same device or by the chain.

// Low C twice, and between the two the notes its halves, thirds, quarters, fifths and sixths would sound.
const NODES: Phrase = {
  notes: [
    { atSec: 0, durSec: 3, note: 36, gain: 0.8 },
    { atSec: 2.2, durSec: 0.8, note: 48, gain: 0.42 },
    { atSec: 2.9, durSec: 0.8, note: 55, gain: 0.42 },
    { atSec: 3.6, durSec: 0.8, note: 60, gain: 0.42 },
    { atSec: 4.3, durSec: 0.8, note: 64, gain: 0.4 },
    { atSec: 5, durSec: 0.8, note: 67, gain: 0.42 },
    { atSec: 5.7, durSec: 1.6, note: 36, gain: 0.75 },
  ],
}

// A D minor seventh held softly and let go, then, louder, its ninth, eleventh, thirteenth and root (an E minor seventh) struck short inside what it left.
const INSIDE: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 50, gain: 0.34 },
    { atSec: 0, durSec: 2.2, note: 57, gain: 0.34 },
    { atSec: 0, durSec: 2.2, note: 60, gain: 0.34 },
    { atSec: 0, durSec: 2.2, note: 65, gain: 0.34 },
    { atSec: 3.1, durSec: 0.25, note: 64, gain: 0.8 },
    { atSec: 3.1, durSec: 0.25, note: 67, gain: 0.8 },
    { atSec: 3.1, durSec: 0.25, note: 71, gain: 0.8 },
    { atSec: 3.1, durSec: 0.25, note: 74, gain: 0.8 },
    { atSec: 5.1, durSec: 0.25, note: 67, gain: 0.62 },
    { atSec: 5.1, durSec: 0.25, note: 71, gain: 0.62 },
    { atSec: 5.1, durSec: 0.25, note: 74, gain: 0.62 },
    { atSec: 5.1, durSec: 0.25, note: 76, gain: 0.62 },
  ],
}

// One low C, held: whatever else is heard is an overtone of it.
const ONE_STRING: Phrase = {
  notes: [{ atSec: 0, durSec: 6.9, note: 36, gain: 0.75 }],
}

// A drone on D, then G, then D. Its seventh harmonics are C, F and C, each a third of a semitone flat of the key.
const THREE_DRONES: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.6, note: 38, gain: 0.75 },
    { atSec: 2.5, durSec: 2.1, note: 43, gain: 0.7 },
    { atSec: 4.5, durSec: 2.6, note: 38, gain: 0.75 },
  ],
}

// Low C and the G over it, and no third.
const OPEN_FIFTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.9, note: 36, gain: 0.65 },
    { atSec: 0.4, durSec: 6.5, note: 43, gain: 0.6 },
  ],
}

// An A minor ninth held for the whole preview. A fifth under each of its notes is a D minor ninth.
const HELD_NINTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 45, gain: 0.42 },
    { atSec: 0, durSec: 6.8, note: 52, gain: 0.42 },
    { atSec: 0, durSec: 6.8, note: 59, gain: 0.42 },
    { atSec: 0, durSec: 6.8, note: 60, gain: 0.42 },
    { atSec: 0, durSec: 6.8, note: 67, gain: 0.42 },
  ],
}

// A ground of C, G, A, E, F and C that a string fed on a higher harmonic keeps to itself.
const UNHEARD: Phrase = {
  notes: [
    { atSec: 0.0, durSec: 1.25, note: 36, gain: 0.65 },
    { atSec: 1.1, durSec: 1.25, note: 43, gain: 0.65 },
    { atSec: 2.2, durSec: 1.25, note: 45, gain: 0.65 },
    { atSec: 3.3, durSec: 1.25, note: 40, gain: 0.65 },
    { atSec: 4.4, durSec: 1.25, note: 41, gain: 0.65 },
    { atSec: 5.5, durSec: 1.8, note: 36, gain: 0.65 },
  ],
}

// Four stations on stacked fifths, D, A, E and B, each keying the dots and dashes of its own letter.
const CALL_SIGNS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.66, note: 50, gain: 0.7 },
    { atSec: 0.88, durSec: 0.22, note: 50, gain: 0.7 },
    { atSec: 1.32, durSec: 0.22, note: 50, gain: 0.7 },
    { atSec: 2.2, durSec: 0.22, note: 57, gain: 0.7 },
    { atSec: 2.64, durSec: 0.66, note: 57, gain: 0.7 },
    { atSec: 3.96, durSec: 0.22, note: 64, gain: 0.7 },
    { atSec: 4.84, durSec: 0.66, note: 71, gain: 0.7 },
    { atSec: 5.72, durSec: 0.22, note: 71, gain: 0.7 },
    { atSec: 6.16, durSec: 0.22, note: 71, gain: 0.7 },
    { atSec: 6.6, durSec: 0.22, note: 71, gain: 0.7 },
  ],
}

// A first tune of six notes, A D C G E A: the five of A minor pentatonic and home.
const TUNE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 69, gain: 0.65 },
    { atSec: 1, durSec: 1.2, note: 74, gain: 0.65 },
    { atSec: 2, durSec: 1.2, note: 72, gain: 0.6 },
    { atSec: 3, durSec: 1.3, note: 67, gain: 0.6 },
    { atSec: 4.1, durSec: 1.1, note: 64, gain: 0.55 },
    { atSec: 5, durSec: 1.9, note: 69, gain: 0.65 },
  ],
}

// A C major seventh tapped and let go, then an F major triad under what is still falling.
const HAND_GONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.3, note: 60, gain: 0.6 },
    { atSec: 0, durSec: 0.3, note: 67, gain: 0.6 },
    { atSec: 0, durSec: 0.3, note: 71, gain: 0.6 },
    { atSec: 0, durSec: 0.3, note: 76, gain: 0.6 },
    { atSec: 3.8, durSec: 0.3, note: 53, gain: 0.55 },
    { atSec: 3.8, durSec: 0.3, note: 60, gain: 0.55 },
    { atSec: 3.8, durSec: 0.3, note: 69, gain: 0.55 },
  ],
}

// Six keys go down together and the tune is in the letting go: G, E, A, C, A, D.
const LETTING_GO: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.7, note: 67, gain: 0.5 },
    { atSec: 0, durSec: 2.5, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 3.3, note: 69, gain: 0.5 },
    { atSec: 0, durSec: 4.1, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 4.9, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 5.9, note: 50, gain: 0.55 },
  ],
}

// A fifth, D and A, held while something passes through it.
const MEETING: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 50, gain: 0.6 },
    { atSec: 0, durSec: 7, note: 57, gain: 0.6 },
  ],
}

// A note on every second, so a beat of so many a second is so many to the note: E B C G A D E.
const ONE_A_SECOND: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.95, note: 64, gain: 0.65 },
    { atSec: 1, durSec: 0.95, note: 71, gain: 0.65 },
    { atSec: 2, durSec: 0.95, note: 72, gain: 0.65 },
    { atSec: 3, durSec: 0.95, note: 67, gain: 0.65 },
    { atSec: 4, durSec: 0.95, note: 69, gain: 0.65 },
    { atSec: 5, durSec: 0.95, note: 62, gain: 0.65 },
    { atSec: 6, durSec: 1.2, note: 64, gain: 0.65 },
  ],
}

// Keys tuned half way between the harmonics of a low C: split by that C in hertz, each is two neighbours of them (C G, G C, C E, E G), and the four are its chord.
const LADDER: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 39.86, gain: 0.7 },
    { atSec: 1.25, durSec: 1.3, note: 45.69, gain: 0.7 },
    { atSec: 2.5, durSec: 1.3, note: 50.04, gain: 0.7 },
    { atSec: 3.75, durSec: 1.3, note: 53.51, gain: 0.7 },
    { atSec: 5.05, durSec: 2.2, note: 39.86, gain: 0.6 },
    { atSec: 5.05, durSec: 2.2, note: 45.69, gain: 0.6 },
    { atSec: 5.05, durSec: 2.2, note: 50.04, gain: 0.6 },
    { atSec: 5.05, durSec: 2.2, note: 53.51, gain: 0.6 },
  ],
}

// D minor seventh, G ninth and C major seventh, each voice moving by step or staying where it is over the bass.
const CADENCE: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.3, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 2.3, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 2.3, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 2.3, note: 65, gain: 0.5 },
    { atSec: 2.3, durSec: 2.3, note: 43, gain: 0.5 },
    { atSec: 2.3, durSec: 2.3, note: 57, gain: 0.5 },
    { atSec: 2.3, durSec: 2.3, note: 59, gain: 0.5 },
    { atSec: 2.3, durSec: 2.3, note: 65, gain: 0.5 },
    { atSec: 4.6, durSec: 2.4, note: 48, gain: 0.5 },
    { atSec: 4.6, durSec: 2.4, note: 55, gain: 0.5 },
    { atSec: 4.6, durSec: 2.4, note: 59, gain: 0.5 },
    { atSec: 4.6, durSec: 2.4, note: 64, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Prepared piano. The rule: nodes only. The object lies at a half, a third, a quarter, a fifth or a sixth of the string.
  {
    id: 'first-words-bolt-at-the-half',
    name: 'Bolt at the half',
    category: 'bell',
    preview: NODES,
    description:
      'Bolts at the middle of every string bend its even overtones sharp and leave the odd ones, softly struck, in a dark plate.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Bolt gongs',
      params: {
        volume: 1,
        position: 0.5,
        amount: 0.9,
        hammer: 0.3,
        decay: 2.6,
        rattle: 0.05,
        width: 0.5,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.32 } }],
  },
  {
    id: 'first-words-third-of-a-string',
    name: 'Third of a string',
    category: 'bell',
    preview: NODES,
    description:
      'Bolts a third of the way along, fully bitten in, long and barely detuned, with five low bowls on C and G answering.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Temple gongs',
      params: {
        volume: -1.5,
        position: 0.333,
        decay: 3.6,
        detune: 0.1,
        hammer: 0.6,
        tone: 0.95,
        thud: 0.1,
      },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Low fifths', params: { root: 0, mix: 0.35, ring: 16 } },
    ],
  },
  {
    id: 'first-words-quarter-screw',
    name: 'Quarter screw',
    category: 'plucked',
    preview: NODES,
    description:
      'Short hard notes with bolts at a quarter of the string, each skipping off in closer, softer echoes.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Tin chimes',
      params: { volume: 1.5, position: 0.25, amount: 0.75, hammer: 0.95, decay: 0.45, rattle: 0.4 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Ball on glass', params: { mix: 0.3 } }],
  },
  {
    id: 'first-words-fifth-part-rattle',
    name: 'Fifth part rattle',
    category: 'keys',
    preview: NODES,
    description:
      'Loose bolts at a fifth of the string buzz on every strike, worn to a dusty record and moved to the back of a hall.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rattling bolts',
      params: { volume: 4.5, position: 0.2, amount: 0.8, decay: 1.3, detune: 0.7 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Dusty record' },
      { deviceId: 'distance', preset: 'Back of the hall' },
    ],
  },
  {
    id: 'first-words-eraser-at-the-sixth',
    name: 'Eraser at the sixth',
    category: 'plucked',
    preview: NODES,
    description:
      'Rubber at a sixth of the string for a woody thump, inside a wooden body with a soft compressor after it.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rubber thunks',
      params: {
        volume: 6,
        position: 0.1667,
        amount: 0.7,
        decay: 2,
        thud: 0.6,
        width: 0.2,
        tone: 0.5,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body' },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'first-words-two-at-one-keyboard',
    name: 'Two at one keyboard',
    category: 'keys',
    preview: NODES,
    description:
      'A duet: felt at the middle of the strings, and one follower a fifth higher repeating all of it almost a second later.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt mute',
      params: { volume: 3.5, position: 0.5, amount: 0.75, decay: 2.2, hammer: 0.5 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Canon at the fifth',
        params: { followers: 1, interval1: 7, gap: 0.9, fade: 0.1, mix: 0.45 },
      },
    ],
  },

  // Afterglow. The rule: strike and glow both full, so a second chord is struck dry inside what the first one left.
  {
    id: 'first-words-felt-inside-felt',
    name: 'Felt inside felt',
    category: 'keys',
    preview: INSIDE,
    description:
      'Felt strikes that die in a second and a glow that lasts eighteen, both at full and narrow, in a small fuzzy room.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Felt afterglow',
      params: {
        volume: -16,
        strike: 1,
        glow: 1,
        decay: 0.9,
        bloom: 0.4,
        fade: 18,
        drift: 0,
        tone: 0.7,
        halo: 0.5,
        width: 0.2,
      },
    },
    effects: [{ deviceId: 'haze', preset: 'Small room fuzz' }],
  },
  {
    id: 'first-words-bell-in-its-own-air',
    name: 'Bell in its own air',
    category: 'bell',
    preview: INSIDE,
    description:
      'Bells struck full and dying fast over their own full glow, an octave shimmer in it, then reel tape.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bell halo',
      params: {
        volume: -13,
        strike: 1,
        glow: 1,
        decay: 1,
        bloom: 3,
        fade: 22,
        halo: 0.7,
        tone: 0.7,
      },
    },
    effects: [{ deviceId: 'tape', preset: 'Quarter inch' }],
  },
  {
    id: 'first-words-pluck-left-standing',
    name: 'Pluck left standing',
    category: 'plucked',
    preview: INSIDE,
    description:
      'A very short pluck and its bright glow, both full and narrow, out of a combo speaker in a room.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: {
        volume: -15,
        strike: 1,
        glow: 1,
        decay: 0.5,
        bloom: 0.6,
        fade: 12,
        tone: 0.8,
        width: 0.2,
        evolve: 0.1,
      },
    },
    effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }],
  },
  {
    id: 'first-words-glass-answers-late',
    name: 'Glass answers late',
    category: 'pad',
    preview: INSIDE,
    description:
      'Glass taps at full over a glow at full that takes four seconds to arrive, its partials twinkling like light on water.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Still glass',
      params: { volume: -13.5, strike: 1, glow: 1, decay: 0.6, bloom: 4, fade: 28, width: 0.8 },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Light on water' }],
  },
  {
    id: 'first-words-dark-felt-moving-glow',
    name: 'Dark felt, moving glow',
    category: 'pad',
    preview: INSIDE,
    description:
      'A dry felt strike at full over a dark glow at full that beats and shifts, its bands swaying slowly side to side.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Dark felt',
      params: {
        volume: -16.5,
        strike: 1,
        glow: 1,
        decay: 0.4,
        bloom: 0.5,
        fade: 9,
        evolve: 1,
        drift: 0.85,
        width: 1,
      },
    },
    effects: [{ deviceId: 'currents', preset: 'Slow water' }],
  },
  {
    id: 'first-words-bell-and-dark-strings',
    name: 'Bell and dark strings',
    category: 'pad',
    preview: INSIDE,
    description:
      'A duet: dark bells, strike and glow both full, with a section of dark strings swelling in behind the same chord.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Low tide bell',
      params: { strike: 1, glow: 1, decay: 2.5, bloom: 2, fade: 14 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Dark cellos' }],
  },

  // Feedback. The rule: no pick, one string and one fret; only the distance from the amplifier chooses the pitch.
  {
    id: 'first-words-octave-from-the-amp',
    name: 'Octave from the amp',
    category: 'drone',
    preview: ONE_STRING,
    description:
      'No pick: the note comes out of the hum and slowly takes its octave, with some grit, through a warm stack.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Out of the hum',
      params: { volume: -16, distance: 2, bloom: 4, grit: 0.45, pick: 0, wander: 0, damp: 0.5 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Warm stack' }],
  },
  {
    id: 'first-words-twelfth-out-of-hum',
    name: 'Twelfth out of hum',
    category: 'drone',
    preview: ONE_STRING,
    description:
      'No pick and no grit: a string fed back until its twelfth sings alone, opening over two and a half seconds in a cathedral.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Pure twelfth',
      params: { pick: 0, bloom: 2.5, gain: 0.85, damp: 0.75, release: 4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral' }],
  },
  {
    id: 'first-words-two-octaves-torn',
    name: 'Two octaves torn',
    category: 'drone',
    preview: ONE_STRING,
    description:
      'No pick: feedback on the fourth harmonic, two octaves up and a little torn, over thin worn tape.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Torn edge',
      params: { distance: 4, pick: 0, bloom: 1.2, grit: 0.4, wander: 0, damp: 0.55 },
    },
    effects: [{ deviceId: 'tape', preset: 'Worn thin' }],
  },
  {
    id: 'first-words-third-no-fret-holds',
    name: 'Third no fret holds',
    category: 'string',
    preview: ONE_STRING,
    description:
      'No pick: the fifth harmonic, a pure major third two octaves up, that begins straight, sways more as it is held, in a plate.',
    instrument: {
      deviceId: 'feedback',
      preset: 'High whistle',
      params: { distance: 5, pick: 0, bloom: 1.6, grit: 0, damp: 0.75, wander: 0, gain: 0.8 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'first-words-sixth-sings-in-a-coil',
    name: 'Sixth sings in a coil',
    category: 'drone',
    preview: ONE_STRING,
    description:
      'No pick: slow dark feedback on the sixth harmonic, a fifth over two octaves, in one dark narrow spring.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Howl',
      params: {
        distance: 6,
        pick: 0,
        bloom: 5,
        grit: 0.2,
        damp: 0.8,
        gain: 0.85,
        wander: 0,
        width: 0.1,
      },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Dark amp spring' }],
  },
  {
    id: 'first-words-two-strings-one-amp',
    name: 'Two strings, one amp',
    category: 'drone',
    preview: OPEN_FIFTH,
    description:
      'A duet: no pick, held strings fight over one amplifier for their twelfths, swaying gently from side to side.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Fighting chord',
      params: { pick: 0, distance: 3, crowd: 0.45, grit: 0.35, bloom: 0.8, wander: 0.1, damp: 0.7 },
    },
    effects: [{ deviceId: 'around', preset: 'Gentle sway' }],
  },

  // Ice. The rule: one chord is laid down and nothing is struck after it; the lake cracks by itself at 0.6.
  {
    id: 'first-words-nobody-on-the-lake',
    name: 'Nobody on the lake',
    category: 'texture',
    preview: HELD_NINTH,
    description:
      'The first strike is faded in, so what is heard is the ice cracking by itself on the held notes, its long tails lifted.',
    instrument: {
      deviceId: 'ice',
      preset: 'Lake at night',
      params: { volume: -5.5, cracks: 0.6, crack: 0.1, ring: 6, shore: 0.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'First note only' },
      { deviceId: 'lift', preset: 'Long tails' },
    ],
  },
  {
    id: 'first-words-crackle-under-noon',
    name: 'Crackle under noon',
    category: 'texture',
    preview: HELD_NINTH,
    description:
      'Near, brittle cracks on whatever is held, the chord once and then the ice alone, the quiet ones raised as high, with faint echoes.',
    instrument: {
      deviceId: 'ice',
      preset: 'Restless ice',
      params: {
        volume: 0,
        cracks: 0.6,
        crack: 1,
        ring: 1.6,
        distance: 0.05,
        shore: 0,
        thick: 0.15,
        roam: 0.3,
      },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Breathing', params: { gain: 18 } },
      { deviceId: 'constellation', preset: 'Faint points' },
    ],
  },
  {
    id: 'first-words-other-side-of-the-bay',
    name: 'Other side of the bay',
    category: 'pad',
    preview: HELD_NINTH,
    description:
      'Long chirps from far out, no snap in them, echoing off every shore, the quiet ones raised, and blurred until no attack is left.',
    instrument: {
      deviceId: 'ice',
      preset: 'Distant field',
      params: { volume: -1, cracks: 0.6, ring: 9, bright: 0.6 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Raise the quiet' },
      { deviceId: 'fog', preset: 'No attack' },
    ],
  },
  {
    id: 'first-words-plates-move-backwards',
    name: 'Plates move backwards',
    category: 'bell',
    preview: HELD_NINTH,
    description:
      'Stretched metal tones that the ice rings by itself under held keys, each also heard backwards, all of it sustained by a compressor.',
    instrument: {
      deviceId: 'ice',
      preset: 'Plate tones',
      params: { volume: -5.5, cracks: 0.6, thick: 0.2, ring: 5, roam: 0.9 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells' },
      { deviceId: 'ambient-comp', preset: 'Long sustain' },
    ],
  },
  {
    id: 'first-words-floe-settling',
    name: 'Floe settling',
    category: 'drone',
    preview: HELD_NINTH,
    description:
      'Thick, dark, long ringing ice with an octave below in it, cracking by itself, its quiet end and its lows brought slowly up.',
    instrument: {
      deviceId: 'ice',
      preset: 'Deep floe',
      params: { cracks: 0.6, crack: 0, bright: 0, ring: 20, width: 0.4 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Slow tide' },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 3 } },
    ],
  },
  {
    id: 'first-words-ice-and-its-shadow',
    name: 'Ice and its shadow',
    category: 'pad',
    preview: HELD_NINTH,
    description:
      'A duet: clear pings the ice makes by itself, and pure sines that swell in on each and stay twenty seconds.',
    instrument: {
      deviceId: 'ice',
      preset: 'Clear ping',
      params: { volume: 6, cracks: 0.6, roam: 0.3, ring: 3.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'First note only', params: { sensitivity: -70, release: 2000 } },
      { deviceId: 'sine-shadow', preset: 'Long linger', params: { mix: 0.6 } },
      { deviceId: 'ambient-limiter', preset: 'Margin', params: { gain: 8 } },
    ],
  },

  // Magnet piano. The rule: no hammer and almost no neighbours, so the key pressed is never the note heard.
  {
    id: 'first-words-bass-turned-octave',
    name: 'Bass turned octave',
    category: 'organ',
    preview: UNHEARD,
    description:
      'No hammer: magnets feed each string at its octave and nothing else, through a slowly turning speaker cabinet.',
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Octave halo',
      params: { volume: -10.5, bright: 0, bloom: 0.7, damper: 1.5, sympathy: 0.4 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Chorale' }],
  },
  {
    id: 'first-words-a-twelfth-instead',
    name: 'A twelfth instead',
    category: 'keys',
    preview: UNHEARD,
    description:
      'No hammer: every key quickly sings its twelfth and not itself, in a lush three voice ensemble.',
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Twelfth organ',
      params: { volume: -12, bright: 0.05, bloom: 0.25, shimmer: 0, body: 0.8 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Lush ensemble' }],
  },
  {
    id: 'first-words-fifteenth-tide',
    name: 'Fifteenth tide',
    category: 'pad',
    preview: UNHEARD,
    description:
      'No hammer: strings fed two octaves up, beating against each other as they swell, in a wide open space.',
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Slow tide',
      params: { harmonic: 4, bright: 0, sweep: 0, bloom: 1.5, shimmer: 1, damper: 4 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space' }],
  },
  {
    id: 'first-words-root-hears-its-third',
    name: 'Root hears its third',
    category: 'voice',
    preview: UNHEARD,
    description:
      'No hammer: only the fifth harmonic of each key, a pure third two octaves up, and a hall of open vowels behind it.',
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Bowed glass',
      params: { harmonic: 5, bright: 0, bloom: 0.5, shimmer: 0.1 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah' }],
  },
  {
    id: 'first-words-nineteenth-pulse',
    name: 'Nineteenth pulse',
    category: 'organ',
    preview: UNHEARD,
    description:
      'No hammer: the sixth harmonic, a nineteenth over the key, spoken and damped at once and shaken by an amp tremolo.',
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'High whistle',
      params: { harmonic: 6, bright: 0.1, bloom: 0.08, damper: 0.25, body: 0 },
    },
    effects: [{ deviceId: 'tremolo', preset: 'Amp tremolo' }],
  },
  {
    id: 'first-words-hammer-and-magnet',
    name: 'Hammer and magnet',
    category: 'keys',
    preview: UNHEARD,
    description:
      'A duet and the one hammer allowed: felt strikes the key while a magnet swells on its third two octaves up, set wide.',
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Felt and magnets',
      params: { harmonic: 5, bright: 0, hammer: 1, bloom: 1 },
    },
    effects: [{ deviceId: 'spread', preset: 'Firm and airy' }],
  },

  // Overtone. The rule: only the harmonics that fall between the keys, 7, 11, 13 and 14, and the mouth stays on one.
  {
    id: 'first-words-seventh-between-keys',
    name: 'Seventh between keys',
    category: 'voice',
    preview: THREE_DRONES,
    description:
      'A throat that stays on harmonic seven, a minor seventh a third of a semitone flat, with a faint tape echo.',
    instrument: {
      deviceId: 'overtone',
      preset: 'Still whistle',
      params: { overtone: 7, focus: 0.9, growl: 0.1 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Faint trace', params: { mix: 0.25 } }],
  },
  {
    id: 'first-words-eleventh-in-the-wind',
    name: 'Eleventh in the wind',
    category: 'wind',
    preview: THREE_DRONES,
    description:
      'A breathy wooden pipe whistling harmonic eleven, half way between a fourth and a tritone, out in a breeze.',
    instrument: {
      deviceId: 'overtone',
      preset: 'Breath pipe',
      params: { overtone: 11, focus: 0.95, wander: 0, breath: 0.6 },
    },
    effects: [{ deviceId: 'weather', preset: 'Breezy day' }],
  },
  {
    id: 'first-words-thirteenth-on-a-reed',
    name: 'Thirteenth on a reed',
    category: 'drone',
    preview: THREE_DRONES,
    description:
      'A lean reed held on harmonic thirteen, between the two sixths, turned slowly by a phaser.',
    instrument: {
      deviceId: 'overtone',
      preset: 'Reed drone',
      params: { volume: -2.5, overtone: 13, focus: 0.85, wander: 0, growl: 0 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Slow swirl' }],
  },
  {
    id: 'first-words-fourteenth-whistle',
    name: 'Fourteenth whistle',
    category: 'voice',
    preview: THREE_DRONES,
    description:
      'A slow throat drone with nothing but harmonic fourteen over it, the flat seventh an octave up, in a long plate.',
    instrument: {
      deviceId: 'overtone',
      preset: 'Slow chant',
      params: { overtone: 14, focus: 1, wander: 0, growl: 0, vibrato: 0.5, width: 1 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate' }],
  },
  {
    id: 'first-words-low-pipe-flat-seventh',
    name: 'Low pipe, flat seventh',
    category: 'drone',
    preview: THREE_DRONES,
    description:
      'A growling long pipe, half open on harmonic seven, speaking at once through an amplifier down the hall.',
    instrument: {
      deviceId: 'overtone',
      preset: 'Drone pipe',
      params: { overtone: 7, focus: 0.6, wander: 0, growl: 0.85, attack: 0.02 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Down the hall' }],
  },

  // Shortwave. The rule: pips only, at five, six, seven, eight and twelve a second, so a key's length is what is spelled.
  {
    id: 'first-words-five-to-the-second',
    name: 'Five to the second',
    category: 'plucked',
    preview: CALL_SIGNS,
    description: 'Pips at five a second, in tune and quick to start, with a short soft tape echo.',
    instrument: {
      deviceId: 'shortwave',
      preset: 'Time pips',
      params: { rate: 5, release: 0.2, static: 0.1 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Short and soft' }],
  },
  {
    id: 'first-words-six-on-the-kitchen-set',
    name: 'Six on the kitchen set',
    category: 'plucked',
    preview: CALL_SIGNS,
    description:
      'Pips at six a second that chirp quickly into tune, with the wear and noise of a small radio.',
    instrument: {
      deviceId: 'shortwave',
      preset: 'Quick pips',
      params: { rate: 6, tuneIn: 0.12, attack: 0.01, release: 0.15, band: 0.05 },
    },
    effects: [{ deviceId: 'patina', preset: 'Kitchen radio', params: { wear: 0.5 } }],
  },
  {
    id: 'first-words-seven-past-the-shore',
    name: 'Seven past the shore',
    category: 'texture',
    preview: CALL_SIGNS,
    description:
      'Pips at seven a second, each station beating with a second one, under rising static, heard from a far shore.',
    instrument: {
      deviceId: 'shortwave',
      preset: 'Storm static',
      params: {
        signal: 2,
        tuneIn: 0.1,
        rate: 7,
        beat: 0.5,
        attack: 0.01,
        release: 0.8,
        static: 0.5,
      },
    },
    effects: [{ deviceId: 'distance', preset: 'Far shore' }],
  },
  {
    id: 'first-words-eight-through-a-prism',
    name: 'Eight through a prism',
    category: 'plucked',
    preview: CALL_SIGNS,
    description:
      'Clean pips at eight a second, no static or fading, whose colours come back one by one, scattered in time.',
    instrument: {
      deviceId: 'shortwave',
      preset: 'Clear carrier',
      params: { signal: 2, rate: 8, attack: 0.005, release: 0.1 },
    },
    effects: [{ deviceId: 'prism', preset: 'Scattered notes' }],
  },
  {
    id: 'first-words-twelve-lost-at-night',
    name: 'Twelve lost at night',
    category: 'texture',
    preview: CALL_SIGNS,
    description:
      'Pips at twelve a second that wander off their note and sink away over four seconds, in two loops out of step.',
    instrument: {
      deviceId: 'shortwave',
      preset: 'Lost station',
      params: {
        volume: -5.5,
        signal: 2,
        rate: 12,
        tuneIn: 0.3,
        static: 0.2,
        attack: 0.02,
        release: 4,
      },
    },
    effects: [{ deviceId: 'orbits', preset: 'Two voices' }],
  },

  // Wind harp. The rule: no hum, full glint, long lulls, over two strings a fifth apart; the wind finds the rest.
  {
    id: 'first-words-wind-goes-elsewhere',
    name: 'Wind goes elsewhere',
    category: 'texture',
    preview: OPEN_FIFTH,
    description:
      'Strings with no hum under them, lit high by a steady wind that keeps dropping away, in an airy hall.',
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Long lulls',
      params: { lull: 0.8, glint: 1, hum: 0 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail' }],
  },
  {
    id: 'first-words-strings-in-sympathy',
    name: 'Strings in sympathy',
    category: 'texture',
    preview: OPEN_FIFTH,
    description:
      'A hard wind on one string a key, no hum, only harmonics with lulls between, and a few strings in C that ring along.',
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Glass whistle',
      params: { lull: 0.8, wind: 0.85, gust: 0.8 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Open triad', params: { root: 0, mix: 0.5 } }],
  },
  {
    id: 'first-words-gate-in-the-storm',
    name: 'Gate in the storm',
    category: 'texture',
    preview: OPEN_FIFTH,
    description:
      'Four strings a key with air in every gust, high harmonics lit and then a lull, heard through fog.',
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Storm front',
      params: { lull: 0.8, hum: 0, glint: 1, air: 0.75, wind: 0.55 },
    },
    effects: [{ deviceId: 'distance', preset: 'Through fog' }],
  },
  {
    id: 'first-words-calm-that-rings-on',
    name: 'Calm that rings on',
    category: 'pad',
    preview: OPEN_FIFTH,
    description:
      'A light wind with no hum and no air, lulls, and harmonics that ring for fourteen seconds into a glassy blur.',
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Slow swell',
      params: { lull: 0.8, hum: 0, glint: 1, ring: 14, air: 0, wind: 0.2 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo' }],
  },
  {
    id: 'first-words-ladder-in-one-gust',
    name: 'Ladder in one gust',
    category: 'plucked',
    preview: OPEN_FIFTH,
    description:
      'One string a key, plucked as it goes down and then left to short climbing gusts and lulls, in a dark echo.',
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Overtone ladder',
      params: { lull: 0.8, hum: 0, ring: 0.5, touch: 0.8, width: 0.1 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Dark echo' }],
  },

  // Graft. The rule: only crosses that nobody has built.
  {
    id: 'first-words-breath-on-a-string',
    name: 'Breath on a string',
    category: 'wind',
    preview: TUNE,
    description:
      'A string that is blown: plenty of air, slow to speak, with a loose second copy beside it.',
    instrument: {
      deviceId: 'graft',
      preset: 'Blown string',
      params: { volume: -3.5, air: 0.6, swell: 0.3, bright: 0.35, release: 2 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Loose double' }],
  },
  {
    id: 'first-words-bow-across-a-pipe',
    name: 'Bow across a pipe',
    category: 'string',
    preview: TUNE,
    description:
      'A stopped pipe played with a bow, hollow and rosiny, with a vibrato that waits as a singer does, on a small plate.',
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed pipe',
      params: { volume: -5, pressure: 0.75, swell: 0.08, air: 0.35, bright: 0.6 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'first-words-finger-in-a-pipe',
    name: 'Finger in a pipe',
    category: 'plucked',
    preview: TUNE,
    description: 'A stopped pipe that is plucked, round and short, with one quick tape repeat.',
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked pipe',
      params: { volume: 1.5, decay: 1.1, bright: 0.4, position: 0.3, release: 0.4 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Single slap' }],
  },
  {
    id: 'first-words-lips-to-a-bar',
    name: 'Lips to a bar',
    category: 'bell',
    preview: TUNE,
    description:
      'A metal bar held sounding by breath, its partials bent a little further into a soft chime.',
    instrument: {
      deviceId: 'graft',
      preset: 'Blown bar',
      params: { swell: 0.2, air: 0.5, bright: 0.75, release: 2.5, decay: 6 },
    },
    effects: [{ deviceId: 'warp', preset: 'Soft chime', params: { mix: 0.6 } }],
  },
  {
    id: 'first-words-plectrum-and-bowl',
    name: 'Plectrum and bowl',
    category: 'bell',
    preview: TUNE,
    description:
      'A singing bowl plucked near its edge and left to ring twelve seconds, with sparse bright sparks off it.',
    instrument: {
      deviceId: 'graft',
      preset: 'Struck bowl',
      params: { exciter: 3, position: 0.12, pressure: 0.6, release: 12 },
    },
    effects: [{ deviceId: 'glints', preset: 'Faint dust', params: { mix: 0.3 } }],
  },

  // Flock. The rule: calls and never a held tone; one bird, then two, three, five and eight.
  {
    id: 'first-words-one-bird-in-the-open',
    name: 'One bird in the open',
    category: 'wind',
    preview: TUNE,
    description: 'One plain whistle a key, broken into short calls, some way off in the open air.',
    instrument: {
      deviceId: 'flock',
      preset: 'One whistle',
      params: { chirp: 0.9, gather: 0.12, flutter: 2.2, leave: 1.2, stray: 0.1 },
    },
    effects: [{ deviceId: 'distance', preset: 'Open air' }],
  },
  {
    id: 'first-words-a-pair-over-the-pond',
    name: 'A pair over the pond',
    category: 'wind',
    preview: TUNE,
    description:
      'Two hollow voices that drop onto each key from above and call, skipping away in wide rings.',
    instrument: {
      deviceId: 'flock',
      preset: 'Hollow pair',
      params: { volume: -2.5, from: 1, chirp: 0.85, flutter: 3.2, gather: 0.3 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Wide rings' }],
  },
  {
    id: 'first-words-three-in-the-reeds',
    name: 'Three in the reeds',
    category: 'texture',
    preview: TUNE,
    description: 'Three quick reedy voices a key, chattering in short bursts, in a bright plate.',
    instrument: {
      deviceId: 'flock',
      preset: 'Swift blips',
      params: { chirp: 1, flutter: 6, tone: 0.75, leave: 0.5 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate' }],
  },
  {
    id: 'first-words-five-scatter-late',
    name: 'Five scatter late',
    category: 'texture',
    preview: TUNE,
    description:
      'Five calling birds over three octaves that take eight seconds to leave, with clouds passing over the light.',
    instrument: {
      deviceId: 'flock',
      preset: 'Scattering',
      params: { birds: 5, chirp: 0.8, flutter: 0.8, octaves: 0.8, leave: 8 },
    },
    effects: [{ deviceId: 'weather', preset: 'Passing clouds' }],
  },
  {
    id: 'first-words-eight-before-sunrise',
    name: 'Eight before sunrise',
    category: 'texture',
    preview: TUNE,
    description:
      'Eight pure voices calling from all round each key, a few of their calls falling an octave as they fade.',
    instrument: {
      deviceId: 'flock',
      preset: 'Dawn calls',
      params: { birds: 8, chirp: 1, flutter: 1.6, tone: 0, octaves: 0.2, stray: 0.1 },
    },
    effects: [{ deviceId: 'falling', preset: 'Octave below', params: { mix: 0.22 } }],
  },

  // Staircase. The rule: the hand does not move; the chord it holds walks up or down by itself.
  {
    id: 'first-words-still-hand-slow-stair',
    name: 'Still hand, slow stair',
    category: 'pad',
    preview: HELD_NINTH,
    description:
      'The held chord slides up through its own notes, each step one long glide, in a vast nave.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Sliding chord',
      params: { speed: 0.3, shape: 0, span: 7 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave' }],
  },
  {
    id: 'first-words-stair-taken-at-a-run',
    name: 'Stair taken at a run',
    category: 'plucked',
    preview: HELD_NINTH,
    description:
      'The held chord runs upward without a slide, nearly as fast as it goes, over a dotted echo.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Quick arpeggio',
      params: { speed: 0.95, shape: 0.3, release: 0.3 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Dotted bounce' }],
  },
  {
    id: 'first-words-down-without-arriving',
    name: 'Down without arriving',
    category: 'pad',
    preview: HELD_NINTH,
    description:
      'The held chord sinks through its own notes, dark and slow to fade in, under a glacial phaser.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Chord descent',
      params: { speed: -0.3, centre: 180, attack: 2, shape: 0.5 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Glacial sweep' }],
  },
  {
    id: 'first-words-cellar-steps',
    name: 'Cellar steps',
    category: 'organ',
    preview: HELD_NINTH,
    description:
      'A reedy held chord hurries down its own notes in plain steps, inside a fast rotating cabinet.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Reed stairs',
      params: { speed: -0.75, slide: 0, shape: 1 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Tremolo' }],
  },
  {
    id: 'first-words-attic-steps',
    name: 'Attic steps',
    category: 'bell',
    preview: HELD_NINTH,
    description:
      'A pure held chord placed high climbs its own notes in even steps, its tail rising into a faint shimmer.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Narrow beam',
      params: { speed: 0.55, centre: 1050, width: 1, slide: 0 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer' }],
  },

  // Droplets. The rule: the keys are only tapped; all that is heard falls after the hand has gone.
  {
    id: 'first-words-gone-and-still-glass',
    name: 'Gone, and still glass',
    category: 'bell',
    preview: HAND_GONE,
    description:
      'A tap leaves twenty seconds of thinning glass drops two octaves wide, half of it blurred in a dark fog.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Glass rain',
      params: { volume: -6, rain: 5, spread: 2, trail: 20, loose: 1, splash: 0 },
    },
    effects: [{ deviceId: 'fog', preset: 'Dark bank', params: { mix: 0.5 } }],
  },
  {
    id: 'first-words-tapped-wood-walks-off',
    name: 'Tapped wood walks off',
    category: 'plucked',
    preview: HAND_GONE,
    description:
      'A tap sets off an even wooden pulse that goes on for twelve seconds by itself, with a hint of a wooden body.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Wood pulse',
      params: { volume: -6, rain: 8, trail: 12, soft: 0.3, spread: 1 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Hint of wood' }],
  },
  {
    id: 'first-words-chime-for-the-door',
    name: 'Chime for the door',
    category: 'bell',
    preview: HAND_GONE,
    description:
      'A tap leaves slow bell metal dropping for eighteen seconds, large and long, partials glinting, in an endless plate.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Long chimes',
      params: { rain: 2.2, trail: 18, loose: 1, size: 0.7, spread: 0 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Sudden glints' },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'first-words-sink-left-running',
    name: 'Sink left running',
    category: 'texture',
    preview: HAND_GONE,
    description:
      'A tap leaves flurries of rising water drops for fifteen seconds, heard from inside a ringing tub of bubbles.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Water drops',
      params: { rain: 9, bursts: 0.7, trail: 15, size: 0.3 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Bathtub' }],
  },
  {
    id: 'first-words-felt-after-the-hand',
    name: 'Felt after the hand',
    category: 'texture',
    preview: HAND_GONE,
    description:
      'A tap leaves twenty seconds of muted felt patter, thick and dull, doubled and laid on blanketed tape.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt patter',
      params: { rain: 14, trail: 20, spread: 0, size: 0.6 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled' },
      { deviceId: 'tape', preset: 'Under a blanket' },
    ],
  },

  // Rewind. The rule: the note lands when the key is let go, so the tune is in the releases.
  {
    id: 'first-words-let-go-and-silence',
    name: 'Let go and silence',
    category: 'keys',
    preview: LETTING_GO,
    description:
      'A backwards piano hovers while held, lands hard as the key lets go and stops dead, with a short halo after.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Stops dead',
      params: { volume: 1, strike: 1, snap: 1, swell: 1.2 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Short halo' }],
  },
  {
    id: 'first-words-bell-waits-for-a-hand',
    name: 'Bell waits for a hand',
    category: 'bell',
    preview: LETTING_GO,
    description:
      'Backwards bells that beat while held and strike on the release, ringing on into a clean bucket echo.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Beating bells',
      params: { volume: 5, tail: 0.8, swell: 2 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Clean echo' }],
  },
  {
    id: 'first-words-unplucked',
    name: 'Unplucked',
    category: 'plucked',
    preview: LETTING_GO,
    description:
      'A plucked string run backwards and caught by its pluck as the key comes up, remembered backwards later on.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Pluck back',
      params: { volume: 4.5, strike: 1, tail: 0.5, tone: 0.8, rise: 0.2 },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Backwards' }],
  },
  {
    id: 'first-words-bowl-set-down',
    name: 'Bowl set down',
    category: 'bell',
    preview: LETTING_GO,
    description:
      'A bowl gathers out of a wide ghost of itself while held and is struck on letting go, in a bright chamber.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Held bowl',
      params: { volume: 2, swell: 3, tone: 0.3 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bright chamber' }],
  },
  {
    id: 'first-words-hover-on-bad-tape',
    name: 'Hover on bad tape',
    category: 'keys',
    preview: LETTING_GO,
    description:
      'A dull backwards piano that wobbles while it hovers and lands softly on the release, then seasick tape.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Worn reel',
      params: { volume: 1, strike: 1, snap: 0.1, tail: 0.9, wobble: 1 },
    },
    effects: [{ deviceId: 'tape', preset: 'Seasick' }],
  },

  // Still point. The rule: the sweeping sine is at full, so wherever it meets a key the two slow to nothing.
  {
    id: 'first-words-meet-at-either-end',
    name: 'Meet at either end',
    category: 'drone',
    preview: MEETING,
    description:
      'A full sine glides in seven seconds from the lowest held key to the highest and turns a tenth of a semitone past each.',
    instrument: {
      deviceId: 'still-point',
      preset: 'Pure crossing',
      params: { time: 7, reach: 0.1, level: 1, attack: 0.3 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room' }],
  },
  {
    id: 'first-words-crossing-in-four',
    name: 'Crossing in four',
    category: 'drone',
    preview: MEETING,
    description:
      'Warm held tones crossed every four seconds by a sine at full, all of it glowing in a triode.',
    instrument: {
      deviceId: 'still-point',
      preset: 'Quick sweep',
      params: { volume: -10, time: 4, level: 1, warmth: 0.7 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.5 } }],
  },
  {
    id: 'first-words-octave-past-the-door',
    name: 'Octave past the door',
    category: 'texture',
    preview: MEETING,
    description:
      'A sine at full sweeps from an octave under the held keys to an octave over them, leaving echoes as it climbs.',
    instrument: {
      deviceId: 'still-point',
      preset: 'Octave reach',
      params: { time: 7.5, level: 1, warmth: 0 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Chorused' }],
  },
  {
    id: 'first-words-left-ear-waits',
    name: 'Left ear waits',
    category: 'drone',
    preview: MEETING,
    description:
      'Full warm tones in the left ear and the sweeping sine at full in the right, a fourth past either end, in slow mist.',
    instrument: {
      deviceId: 'still-point',
      preset: 'Full and split',
      params: { time: 9, reach: 5, level: 1, ears: 1, attack: 2 },
    },
    effects: [{ deviceId: 'fog', preset: 'Morning mist' }],
  },
  {
    id: 'first-words-slow-nod',
    name: 'Slow nod',
    category: 'organ',
    preview: MEETING,
    description:
      'Held tones and a slow full sine through them, with soft flute stops an octave over and under that chiff as they speak.',
    instrument: {
      deviceId: 'still-point',
      preset: 'Slow swell',
      params: { time: 6.5, level: 1, attack: 0.6, reach: 1 },
    },
    effects: [{ deviceId: 'stops', preset: 'Flute stops' }],
  },

  // Twin bars. The rule: the beat is counted against one note a second: one, two, three, four or six to the note.
  {
    id: 'first-words-one-to-the-note',
    name: 'One to the note',
    category: 'bell',
    preview: ONE_A_SECOND,
    description:
      'Soft metal bars a single hertz apart, swelling once a second on every key, in a faint hall.',
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Slow metal bowl',
      params: { volume: -4, beat: 1, ears: 0, decay: 12 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Faint halo' }],
  },
  {
    id: 'first-words-two-from-the-bedside',
    name: 'Two from the bedside',
    category: 'plucked',
    preview: ONE_A_SECOND,
    description:
      'Wooden bars two hertz apart on every key, so each note sways in halves, half of it through a small bedside speaker.',
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Two, soft wood',
      params: { volume: -3, ears: 0, decay: 8, tone: 0.7 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Bedside radio', params: { mix: 0.5 } }],
  },
  {
    id: 'first-words-three-to-the-note',
    name: 'Three to the note',
    category: 'bell',
    preview: ONE_A_SECOND,
    description:
      'Glass bars three hertz apart, a triplet on every key, with echoes set a third of a second behind.',
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Glass, middle',
      params: { beat: 3, mallet: 0.5 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Clean and steady', params: { time: 333 } }],
  },
  {
    id: 'first-words-four-hard-bars',
    name: 'Four hard bars',
    category: 'bell',
    preview: ONE_A_SECOND,
    description:
      'Hard mallets on metal bars four hertz apart, one nearer each ear, damped at once and widened at the top.',
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Eight, hard',
      params: { volume: -2.5, beat: 4, ears: 0.7, damp: 0.8, decay: 7 },
    },
    effects: [{ deviceId: 'spread', preset: 'Wide top' }],
  },
  {
    id: 'first-words-six-and-a-flam',
    name: 'Six and a flam',
    category: 'plucked',
    preview: ONE_A_SECOND,
    description:
      'Wooden bars six hertz apart, the second struck late so the pair flams and flutters, in a tight spring.',
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Flam of wood',
      params: { volume: 0, beat: 6, scatter: 36, decay: 4, ears: 1 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Quick twang' }],
  },

  // Binaural. The rule: the beat is a note, the low C at 32.7 hertz, so a key is two pitches, one to an ear.
  {
    id: 'first-words-c-between-the-ears',
    name: 'C between the ears',
    category: 'drone',
    preview: LADDER,
    description:
      'Bare tones 32.7 hertz apart, one to an ear: the D below middle C becomes a major third. A faint plate.',
    instrument: { deviceId: 'binaural', preset: 'Bare pair', params: { beat: 32.7, attack: 0.2 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Faint sheen' }],
  },
  {
    id: 'first-words-split-organ',
    name: 'Split organ',
    category: 'organ',
    preview: LADDER,
    description:
      'Nearly bare tones split 32.7 hertz between the ears, quick as an organ key, with a stop an octave above.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Detuned rank',
      params: { beat: 32.7, ears: 1, warmth: 0.12, attack: 0.02, release: 0.25 },
    },
    effects: [{ deviceId: 'stops', preset: 'Octave above' }],
  },
  {
    id: 'first-words-hum-nobody-plays',
    name: 'Hum nobody plays',
    category: 'drone',
    preview: LADDER,
    description:
      'The two tones of a key in both ears, 32.7 hertz apart, beating fast enough to hum a low C, with glassy octaves over it.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Forty in the air',
      params: { beat: 32.7, attack: 0.05, release: 1 },
    },
    effects: [{ deviceId: 'octaves', preset: 'Glass octaves' }],
  },
  {
    id: 'first-words-late-to-either-ear',
    name: 'Late to either ear',
    category: 'pad',
    preview: LADDER,
    description:
      'Plain tones 32.7 hertz apart, mostly one to an ear, that rise and leave slowly, each caught backwards and swelling in late.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Bars seven apart',
      params: { volume: 0, beat: 32.7, ears: 0.7, warmth: 0.1, attack: 0.8, release: 3 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells' }],
  },
  {
    id: 'first-words-low-c-in-brown-air',
    name: 'Low C in brown air',
    category: 'texture',
    preview: LADDER,
    description:
      'Tones split 32.7 hertz between the ears over a brown bed of noise, smeared in dark water.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Brown bed, slow',
      params: { volume: -10, bed: 0.15, beat: 32.7, attack: 0.4, release: 4, warmth: 0.1 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Dark water' }],
  },

  // Breath pacer. The rule: the marks stay high, so one breath is two chords: the keys as it fills, a fifth under as it empties.
  {
    id: 'first-words-in-and-a-fifth-under',
    name: 'In and a fifth under',
    category: 'pad',
    preview: HELD_NINTH,
    description:
      'Two seconds in and two out, struck at the keys and then a fifth under them, in a hall with a long warm bottom.',
    instrument: {
      deviceId: 'breath-pacer',
      preset: 'Two two struck',
      params: { volume: -4.5, marks: 0.8, air: 0.15, tone: 0.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow' }],
  },
  {
    id: 'first-words-box-of-four',
    name: 'Box of four',
    category: 'keys',
    preview: HELD_NINTH,
    description:
      'In, hold, out and rest, a second and a half each, over a tone that never quite empties, with a table of bowls in A minor.',
    instrument: {
      deviceId: 'breath-pacer',
      preset: 'Marks over a tone',
      params: { volume: -4.5, in: 1.5, hold: 1.5, out: 1.5, rest: 1.5, marks: 0.9 },
    },
    effects: [{ deviceId: 'bowls', preset: 'Minor table' }],
  },
  {
    id: 'first-words-sigh-in-oo',
    name: 'Sigh in oo',
    category: 'voice',
    preview: HELD_NINTH,
    description:
      'A second in, three out and one of rest, mostly air, struck at each turn, with a round oo behind.',
    instrument: {
      deviceId: 'breath-pacer',
      preset: 'Long tide',
      params: { volume: -2.5, in: 1, out: 3, rest: 1, marks: 0.7, air: 0.7, floor: 0, tone: 0.2 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.5 } }],
  },
  {
    id: 'first-words-only-the-turns',
    name: 'Only the turns',
    category: 'bell',
    preview: HELD_NINTH,
    description:
      'No breath at all, only its marks: the keys and a fifth under them, a second apart, in three tape heads.',
    instrument: {
      deviceId: 'breath-pacer',
      preset: 'Marks alone',
      params: { volume: -5, in: 1, out: 1, marks: 1 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Three heads' }],
  },
  {
    id: 'first-words-three-up-three-down',
    name: 'Three up, three down',
    category: 'organ',
    preview: HELD_NINTH,
    description:
      'Three seconds in, half held, three out: a tone that brightens as it opens, struck at each turn, in a softly turning cabinet.',
    instrument: {
      deviceId: 'breath-pacer',
      preset: 'Tone alone',
      params: { in: 3, hold: 0.5, out: 3, marks: 0.7, floor: 0.2 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Soft blend' }],
  },

  // Coloured noise. The rule: pitch is a tint at full and never a tone; five colours say one cadence.
  {
    id: 'first-words-white-says-a-chord',
    name: 'White says a chord',
    category: 'texture',
    preview: CADENCE,
    description:
      'White noise fully tinted by the keys, then let through only on the notes of C major and not above three kilohertz.',
    instrument: {
      deviceId: 'coloured-noise',
      preset: 'White with pitch',
      params: { volume: 6, colour: 0, attack: 0.15, release: 0.8 },
    },
    effects: [{ deviceId: 'scale-filter', preset: 'In a major key', params: { high: 3000 } }],
  },
  {
    id: 'first-words-pale-pink-radio',
    name: 'Pale pink radio',
    category: 'texture',
    preview: CADENCE,
    description: 'Pale noise fully tinted by the keys, narrowed and fading on a night radio.',
    instrument: {
      deviceId: 'coloured-noise',
      preset: 'Pale pink',
      params: { volume: 1, tint: 1, attack: 0.1, release: 0.5, drift: 0 },
    },
    effects: [{ deviceId: 'radio', preset: 'Night shortwave' }],
  },
  {
    id: 'first-words-pink-breathing-in',
    name: 'Pink, breathing in',
    category: 'texture',
    preview: CADENCE,
    description:
      'Pink noise fully tinted by the keys, swelling and darkening in slow waves, opened and closed by a calm breath.',
    instrument: {
      deviceId: 'coloured-noise',
      preset: 'Pitch and swells',
      params: { volume: -3.5, colour: 0.5, lowCut: 110, highCut: 9000, width: 0.8, attack: 0.3 },
    },
    effects: [{ deviceId: 'breath', preset: 'Calm breath', params: { in: 1.5, out: 2 } }],
  },
  {
    id: 'first-words-dark-pink-under-surf',
    name: 'Dark pink under surf',
    category: 'texture',
    preview: CADENCE,
    description:
      'Dark noise with the top and the rumble off, fully tinted by the keys, washed through by a slow surf.',
    instrument: {
      deviceId: 'coloured-noise',
      preset: 'Pitch, top off',
      params: { volume: -4.5, colour: 0.75, lowCut: 80, attack: 0.4, release: 1.5 },
    },
    effects: [{ deviceId: 'weather', preset: 'Slow surf' }],
  },
  {
    id: 'first-words-brown-chord-glows',
    name: 'Brown chord glows',
    category: 'pad',
    preview: CADENCE,
    description:
      'Brown noise fully tinted by the keys, its strongest pitches redrawn as slow sines that stay after it.',
    instrument: {
      deviceId: 'coloured-noise',
      preset: 'Brown with pitch',
      params: { volume: -4, lowCut: 90, width: 0.5, release: 1 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Chord outline', params: { mix: 0.75, attack: 250 } },
    ],
  },

  // Isochronic. The rule: the right ear is never with the left, so one chord is handed from ear to ear.
  {
    id: 'first-words-half-turn-hocket',
    name: 'Half turn hocket',
    category: 'pad',
    preview: CADENCE,
    description:
      'Two pulses a second, the right ear exactly between the left ones, soft edged, in a distant plate.',
    instrument: {
      deviceId: 'isochronic',
      preset: 'Two a second',
      params: { offset: 180, duty: 0.4 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.45 } }],
  },
  {
    id: 'first-words-third-turn-hocket',
    name: 'Third turn hocket',
    category: 'keys',
    preview: CADENCE,
    description:
      'Three warm pulses a second, the right ear a third of a turn behind, under a low-pass that drifts at a glacial pace.',
    instrument: {
      deviceId: 'isochronic',
      preset: 'Three a second',
      params: { volume: -0.5, offset: 120, duty: 0.3, warmth: 1, attack: 0.02, release: 0.4 },
    },
    effects: [{ deviceId: 'auto-filter', preset: 'Glacial low-pass' }],
  },
  {
    id: 'first-words-quarter-turn-blips',
    name: 'Quarter turn blips',
    category: 'plucked',
    preview: CADENCE,
    description:
      'Four and a half hard blips a second, the right ear a quarter turn late, in seven scattered echoes.',
    instrument: {
      deviceId: 'isochronic',
      preset: 'Eight short',
      params: { volume: 0, rate: 4.5, offset: 90, duty: 0.15 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Scattered seven' }],
  },
  {
    id: 'first-words-breathy-sixth-turn',
    name: 'Breathy sixth turn',
    category: 'texture',
    preview: CADENCE,
    description:
      'Six pulses a second of noise at the keys, the right ear a sixth of a turn late, in a hall that whispers vowels.',
    instrument: {
      deviceId: 'isochronic',
      preset: 'Noise at ten',
      params: { volume: -1, rate: 6, offset: 60, air: 0.9, edge: 40, duty: 0.35, release: 3 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Whispering', params: { mix: 0.5 } }],
  },
  {
    id: 'first-words-ten-ear-to-ear',
    name: 'Ten, ear to ear',
    category: 'organ',
    preview: CADENCE,
    description:
      'Ten light pulses a second passed from ear to ear over a tone that never stops, with sub and twelfth organ pipes.',
    instrument: {
      deviceId: 'isochronic',
      preset: 'Ten a second',
      params: { offset: 180, depth: 0.6, edge: 25, attack: 0.1 },
    },
    effects: [{ deviceId: 'stops', preset: 'Old pipes' }],
  },
]
