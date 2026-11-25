import { type FactoryPreset, type Phrase } from '../types'

// Seven ragas whose notes lie on white keys, each with its own Sa, its strong note and its way up
// and down, over the tanpura tuned as it asks. Laid out as drones first (Pa, Ma or Ni on the first
// string), then the voices that slide, shake, swell and pluck, two or so for each raga.

// The drone of an afternoon raga: Sa is D, the first string is Pa, the A a fourth below.
const ROUND_ON_D: Phrase = { notes: [{ atSec: 0, durSec: 6.6, note: 50, gain: 0.7 }] }

// The drone for Sa = E, a second lute joining an octave up: Ma (A) on the first string for the night
// raga that has no fifth, Pa (B) for the one at dawn.
const ROUND_ON_E: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 52, gain: 0.7 },
    { atSec: 2.4, durSec: 4.2, note: 64, gain: 0.4 },
  ],
}

// The drone of an evening raga that leaves Sa out going up: Sa is F, and Ni is the E below it.
const ROUND_ON_F: Phrase = { notes: [{ atSec: 0, durSec: 6.6, note: 53, gain: 0.7 }] }

// The drone of the two five-note ragas on C, Sa and the Sa above it.
const ROUND_ON_C: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 48, gain: 0.65 },
    { atSec: 1.2, durSec: 5.4, note: 60, gain: 0.45 },
  ],
}

// Bhimpalasi in its lower octave, Sa = D: down D C B A, back up A C D with the B left out.
const LOWER_OCTAVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 50, gain: 0.6 },
    { atSec: 1.25, durSec: 0.65, note: 48, gain: 0.5 },
    { atSec: 1.9, durSec: 0.4, note: 47, gain: 0.45 },
    { atSec: 2.3, durSec: 1.5, note: 45, gain: 0.6 },
    { atSec: 3.8, durSec: 0.7, note: 48, gain: 0.5 },
    { atSec: 4.45, durSec: 1.9, note: 50, gain: 0.6 },
  ],
}

// Bhimpalasi going up, C D, F G, A G, with no second and no sixth, resting on its strong note G. Notes
// that overlap are slid together; a small gap between groups is a new stroke (so in every line below).
const UP_TO_MA: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.6, note: 60, gain: 0.45 },
    { atSec: 0.5, durSec: 1.05, note: 62, gain: 0.5 },
    { atSec: 1.6, durSec: 0.6, note: 65, gain: 0.5 },
    { atSec: 2.1, durSec: 1.95, note: 67, gain: 0.7 },
    { atSec: 4.1, durSec: 0.7, note: 69, gain: 0.5 },
    { atSec: 4.7, durSec: 1.6, note: 67, gain: 0.6 },
  ],
}

// Bhimpalasi coming down, D C B A G F E D: the B and the E are only ever on the way down.
const DOWN_FROM_SA: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 74, gain: 0.6 },
    { atSec: 1.2, durSec: 0.6, note: 72, gain: 0.5 },
    { atSec: 1.7, durSec: 0.5, note: 71, gain: 0.42 },
    { atSec: 2.1, durSec: 0.95, note: 69, gain: 0.52 },
    { atSec: 3.1, durSec: 0.5, note: 67, gain: 0.5 },
    { atSec: 3.5, durSec: 1, note: 65, gain: 0.52 },
    { atSec: 4.4, durSec: 0.5, note: 64, gain: 0.4 },
    { atSec: 4.8, durSec: 1.5, note: 62, gain: 0.55 },
  ],
}

// Yaman, Sa = F: begun on E below, strong on A (a pure third over F), B going over it to D, then
// down D C B A G F. Up it has no C and waits for its Sa.
const EVENING_A: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.6, note: 64, gain: 0.45 },
    { atSec: 0.5, durSec: 0.6, note: 67, gain: 0.48 },
    { atSec: 1, durSec: 1.45, note: 68.86, gain: 0.66 },
    { atSec: 2.5, durSec: 0.5, note: 71, gain: 0.48 },
    { atSec: 2.9, durSec: 0.6, note: 74, gain: 0.55 },
    { atSec: 3.4, durSec: 0.4, note: 72, gain: 0.45 },
    { atSec: 3.7, durSec: 0.4, note: 71, gain: 0.42 },
    { atSec: 4, durSec: 0.85, note: 68.86, gain: 0.6 },
    { atSec: 4.9, durSec: 0.5, note: 67, gain: 0.45 },
    { atSec: 5.3, durSec: 1.2, note: 65, gain: 0.52 },
  ],
}

// Malkauns, Sa = E: D E G A and C, no second and no fifth, the strong note A a fourth over Sa.
const MIDNIGHT_A: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.6, note: 50, gain: 0.45 },
    { atSec: 0.5, durSec: 1.1, note: 52, gain: 0.55 },
    { atSec: 1.5, durSec: 0.65, note: 55, gain: 0.5 },
    { atSec: 2.05, durSec: 1.8, note: 57, gain: 0.7 },
    { atSec: 3.9, durSec: 0.55, note: 60, gain: 0.5 },
    { atSec: 4.35, durSec: 0.6, note: 57, gain: 0.52 },
    { atSec: 4.85, durSec: 0.55, note: 55, gain: 0.46 },
    { atSec: 5.3, durSec: 1.3, note: 52, gain: 0.55 },
  ],
}

// Durga, Sa = C: the turn D F G, then A and its long fall to F, and D to C. The raga has no third degree.
const TURN_F_G_A: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.55, note: 62, gain: 0.45 },
    { atSec: 0.45, durSec: 0.55, note: 65, gain: 0.48 },
    { atSec: 0.9, durSec: 0.45, note: 67, gain: 0.5 },
    { atSec: 1.4, durSec: 1.8, note: 69, gain: 0.68 },
    { atSec: 3.1, durSec: 0.75, note: 65, gain: 0.56 },
    { atSec: 3.9, durSec: 0.75, note: 62, gain: 0.46 },
    { atSec: 4.5, durSec: 1.8, note: 60, gain: 0.56 },
  ],
}

// Madhyamad Sarang, Sa = D an octave up: C D E, resting on the second, E, and again after G A G.
const NOON_REST: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.6, note: 72, gain: 0.45 },
    { atSec: 0.5, durSec: 0.7, note: 74, gain: 0.5 },
    { atSec: 1.1, durSec: 1.65, note: 76, gain: 0.65 },
    { atSec: 2.8, durSec: 0.45, note: 79, gain: 0.48 },
    { atSec: 3.15, durSec: 0.6, note: 81, gain: 0.52 },
    { atSec: 3.65, durSec: 0.4, note: 79, gain: 0.45 },
    { atSec: 3.95, durSec: 1.05, note: 76, gain: 0.6 },
    { atSec: 5.05, durSec: 0.45, note: 72, gain: 0.42 },
    { atSec: 5.4, durSec: 1.2, note: 74, gain: 0.52 },
  ],
}

// Bhairavi, Sa = E over E and B: E F G A, G F, E, the F a little low, slow and shaded.
const DAWN_F: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 52, gain: 0.28 },
    { atSec: 0, durSec: 6.4, note: 59, gain: 0.22 },
    { atSec: 0.2, durSec: 0.8, note: 64, gain: 0.5 },
    { atSec: 0.9, durSec: 1.45, note: 64.9, gain: 0.6 },
    { atSec: 2.4, durSec: 0.5, note: 67, gain: 0.48 },
    { atSec: 2.8, durSec: 1.1, note: 69, gain: 0.56 },
    { atSec: 3.8, durSec: 0.55, note: 67, gain: 0.46 },
    { atSec: 4.25, durSec: 1.05, note: 64.9, gain: 0.56 },
    { atSec: 5.35, durSec: 1.2, note: 64, gain: 0.5 },
  ],
}

// Bhupali, Sa = C: A C, D E, G E, D C, strong on E, a pure third over C, the A a pure third under it.
const DUSK_E: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.55, note: 56.84, gain: 0.45 },
    { atSec: 0.45, durSec: 0.6, note: 60, gain: 0.52 },
    { atSec: 1.1, durSec: 0.55, note: 62, gain: 0.46 },
    { atSec: 1.55, durSec: 1.55, note: 63.86, gain: 0.68 },
    { atSec: 3.15, durSec: 0.7, note: 67, gain: 0.52 },
    { atSec: 3.75, durSec: 0.85, note: 63.86, gain: 0.6 },
    { atSec: 4.65, durSec: 0.6, note: 62, gain: 0.45 },
    { atSec: 5.15, durSec: 1.3, note: 60, gain: 0.55 },
  ],
}

// The five notes of Bhupali let in one at a time and held: C, G, A, D and E last, the A a pure sixth
// over C and the E a pure fifth over that A.
const FIVE_HELD: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.2, note: 60, gain: 0.5 },
    { atSec: 0.7, durSec: 5.5, note: 67, gain: 0.42 },
    { atSec: 1.5, durSec: 4.7, note: 68.84, gain: 0.38 },
    { atSec: 2.4, durSec: 3.8, note: 74, gain: 0.38 },
    { atSec: 3.4, durSec: 2.8, note: 75.86, gain: 0.42 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Tanpura: the first string on Pa, Ma or Ni, the bridge open or closed, the round slow or quick.
  {
    id: 'ragas-on-white-keys-afternoon-round',
    name: 'Afternoon round',
    category: 'drone',
    description:
      'A drone lute in four plucks, first string a fourth below the key, with strings tuned in D minor ringing along behind it.',
    preview: ROUND_ON_D,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { jawari: 0.5, speed: 4, decay: 14, volume: -8 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor wash',
        params: { root: 2, mode: 1, sympathy: 0.7, strings: 10, decay: 6, mix: 0.45 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-ma-under-e',
    name: 'Ma under E',
    category: 'drone',
    description:
      'A slow lute whose first string lies a fifth below the key, played inside a wooden soundboard and a dark eight second hall.',
    preview: ROUND_ON_E,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Ma tuning',
      params: { jawari: 0.3, speed: 5, decay: 20, body: 0.8, volume: -8 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 1.6, mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { damping: 2000, mix: 0.45 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-leading-e-at-dusk',
    name: 'Leading E at dusk',
    category: 'drone',
    description:
      'A lute tuned to the semitone below the key, its buzz lifted by a slow shimmer that climbs in fifths.',
    preview: ROUND_ON_F,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Evening Ni',
      params: { jawari: 0.75, speed: 4.5, detune: 1, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Fifths',
        params: { decay: 7, shimmer: 0.35, tone: 4200, mix: 0.35 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-two-gourds-on-c',
    name: 'Two gourds on C',
    category: 'drone',
    description:
      'A centred, gourd-heavy drone lute played through a warm driven speaker stack close to the microphone.',
    preview: ROUND_ON_C,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Mono gourd drone',
      params: { speed: 5, jawari: 0.7, body: 1, volume: -10 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Warm stack',
        params: { drive: 0.45, distance: 0.15, room: 0.25 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-noon-heat-round',
    name: 'Noon heat round',
    category: 'drone',
    description:
      'A buzzing lute going round in two seconds, its overtones swept by a slow phaser and opened wide at the top.',
    preview: ROUND_ON_D,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Fast buzzing round',
      params: { speed: 2, decay: 8, volume: -1 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { feedback: 45, mix: 0.55 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'ragas-on-white-keys-midnight-gourd',
    name: 'Midnight gourd',
    category: 'drone',
    description:
      'A dark gourd with a closed bridge and the fourth as its first string, sunk under slowly wavering water.',
    preview: ROUND_ON_E,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Low Ma gourd',
      params: { speed: 6, jawari: 0.2, volume: -6 },
    },
    effects: [
      {
        deviceId: 'underwater',
        preset: 'Heavy water',
        params: { depth: 0.6, waver: 0.45, bubbles: 0 },
      },
      { deviceId: 'ambient-comp', preset: 'Drone bed', params: { makeup: 6 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-dawn-wire',
    name: 'Dawn wire',
    category: 'drone',
    description:
      'Bare buzzing strings with no gourd, thinned by a high-pass that a slow wave opens, with a bright plate after it.',
    preview: ROUND_ON_E,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Bare string buzz',
      params: { speed: 5, jawari: 1, volume: 1 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { type: 1, cutoffHz: 650, resonance: 1.2, lfoAmount: 25, lfoRateHz: 0.15 },
      },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { decay: 0.75, mix: 0.4 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-all-night-on-the-air',
    name: 'All night on the air',
    category: 'drone',
    description:
      'A drone lute heard on a shortwave set at night, its signal fading in and out of static, through a small speaker.',
    preview: ROUND_ON_F,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Bright Ni shimmer',
      params: { speed: 3.5, jawari: 0.8, body: 0.3, volume: 4.5 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Night shortwave',
        params: { static: 0.18, interference: 0.05, fading: 0.5, speaker: 0.6 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-singer-in-the-string',
    name: 'Singer in the string',
    category: 'drone',
    description:
      'A tanpura on D with a narrow resonance wandering slowly through the overtones of D, as if someone sang inside it.',
    preview: ROUND_ON_D,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wall',
      params: { speed: 6, jawari: 0.9, volume: -1 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'Slow wander',
        params: { root: 2, octave: 2, pace: 0.5, glide: 900, focus: 0.6, drone: 0.5 },
      },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
  },
  {
    id: 'ragas-on-white-keys-lute-without-plucks',
    name: 'Lute without plucks',
    category: 'drone',
    description:
      'Every pluck of the round is faded in over more than half a second, then blurred into one soft bank of sound.',
    preview: ROUND_ON_C,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Closed jawari',
      params: { jawari: 0.4, speed: 5, decay: 20, body: 0.4, spread: 0.9, volume: -4 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 650, sensitivity: -46 } },
      { deviceId: 'fog', preset: 'Slow rise', params: { damp: 0.35 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-round-turned-back',
    name: 'Round turned back',
    category: 'drone',
    description:
      'A round with hardly any buzz and a backwards copy of itself an octave up swelling between the plucks.',
    preview: ROUND_ON_E,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Ma full bloom',
      params: { jawari: 0.15, speed: 4, decay: 8, volume: -2 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Rising glass',
        params: { time: 1300, feedback: 0.35, mix: 0.45 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-kharaj-in-the-floor',
    name: 'Kharaj in the floor',
    category: 'drone',
    description:
      'A dark Ni-tuned lute with a copy at half speed an octave under it, dulled and run together.',
    preview: ROUND_ON_F,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Dark slow Ni',
      params: { speed: 5, jawari: 0.35, body: 0.5, volume: -7 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { length: 1800, highCut: 2200, mix: 0.6 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-one-long-sa',
    name: 'One long Sa',
    category: 'drone',
    description:
      'Plain strings without buzz, smeared until the four plucks are a single glowing tone.',
    preview: ROUND_ON_D,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: { speed: 3, body: 0.3, volume: -8 },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { blur: 0.85, mix: 0.85, highCut: 5000 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-jhala-strings',
    name: 'Jhala strings',
    category: 'plucked',
    description:
      'Plain plucked strings in a quick round, repeated by two tape heads and edged with a little preamp drive.',
    preview: ROUND_ON_C,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Plain plucked four',
      params: { speed: 2, decay: 3.5, jawari: 0.25, volume: 0.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 375, feedback: 0.35, heads: 1, highCut: 6500, mix: 0.4 },
      },
      { deviceId: 'analog-drive', preset: 'First hint', params: { tone: 0.4 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-two-lutes-not-quite-one',
    name: 'Two lutes not quite one',
    category: 'drone',
    description:
      'A wide round whose middle strings beat eight cents apart, each band of it swelling and drifting on its own slow cycle.',
    preview: ROUND_ON_D,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wide beating',
      params: { speed: 5, jawari: 0.65, body: 0.2, volume: -3.5 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide', params: { depth: 0.75, rate: 0.2 } },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { presence: 4, air: 4 } },
    ],
  },

  // Pedal steel: how wide and how slow the slide, how soon the note speaks, how far it shakes.
  {
    id: 'ragas-on-white-keys-slide-a-fourth-wide',
    name: 'Slide a fourth wide',
    category: 'string',
    description:
      'A steel that slides between overlapping notes up to a fourth apart, over more than a third of a second, in a hall.',
    preview: UP_TO_MA,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { swell: 0.3, glide: 380, range: 5, vibrato: 3, tone: 3000, volume: -3 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 3, lowDecay: 3, mix: 0.3 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-bar-held-straight',
    name: 'Bar held straight',
    category: 'string',
    description:
      'A steel with no vibrato, swelled in slowly, setting five singing bowls tuned in fifths on D ringing.',
    preview: DOWN_FROM_SA,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 0.9, glide: 260, range: 2, tone: 1900, volume: -8 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Low fifths', params: { root: 2, ring: 12, mix: 0.45 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-shaken-strong-note',
    name: 'Shaken strong note',
    category: 'string',
    description:
      'A bright steel with a fast forty cent shake that grows after each pick, in a long three-spring tank.',
    preview: TURN_F_G_A,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Wide shake',
      params: { range: 2, rate: 6, pick: 0.6, tone: 4800, volume: -7.5 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.35 } }],
  },
  {
    id: 'ragas-on-white-keys-singing-at-lamplight',
    name: 'Singing at lamplight',
    category: 'string',
    description:
      'A singing steel with a deep slow shake and slides up to a fourth, repeated by a worn tape.',
    preview: EVENING_A,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: { swell: 0.5, range: 5, glide: 220, vibrato: 22, volume: -3 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Worn tape',
        params: { time: 560, feedback: 0.35, wow: 0.4, flutter: 0.3, drive: 0.3, mix: 0.3 },
      },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'ragas-on-white-keys-dark-swell-on-ma',
    name: 'Dark swell on Ma',
    category: 'string',
    description:
      'A dark, pickless steel swelled into a choir-like room whose tail is shaped to a round vowel.',
    preview: MIDNIGHT_A,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dark swell',
      params: { swell: 0.5, glide: 320, range: 5, volume: -0.5 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 7, mix: 0.45 } }],
  },
  {
    id: 'ragas-on-white-keys-thumb-on-the-gourd',
    name: 'Thumb on the gourd',
    category: 'plucked',
    description:
      'Round thumbed strings sounded through a wooden soundboard, other strings learning the notes and ringing after them.',
    preview: DUSK_E,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Round thumb',
      params: { sustain: 11, glide: 200, range: 3, volume: -6 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 0.7, mix: 0.7 } },
      {
        deviceId: 'sympathetic',
        preset: 'Follow the tune',
        params: { sympathy: 0.7, decay: 5, mix: 0.4 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-steel-bells-at-noon',
    name: 'Steel bells at noon',
    category: 'bell',
    description:
      'Hard-picked high steel with its partials spread toward a bell, on a small bright plate.',
    preview: NOON_REST,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { sustain: 4, range: 0, vibrato: 2, tone: 5200, volume: 0 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Soft chime', params: { stretch: 0.25, mix: 0.7 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { damping: 0.1, mix: 0.35 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-the-disciple-repeats',
    name: 'The disciple repeats',
    category: 'string',
    description:
      'A swelled, hard-picked steel line that another follows a breath later, once at the same pitch and once an octave down.',
    preview: UP_TO_MA,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Fading swell',
      params: { swell: 0.3, sustain: 10, range: 3, tone: 4000, volume: 0 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Octave shadow',
        params: {
          followers: 2,
          gap: 1.1,
          interval1: 0,
          interval2: -12,
          fade: 0.2,
          spread: 0.8,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-fall-from-dha-to-ma',
    name: 'Fall from Dha to Ma',
    category: 'string',
    description:
      'A steel that swells and glides over anything up to a fifth, opening into a huge space that blooms behind it.',
    preview: TURN_F_G_A,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Swelling slide',
      params: { swell: 0.6, sustain: 14, glide: 420, range: 7, volume: -2.5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bloom', params: { decay: 9, size: 0.6, mix: 0.45 } }],
  },
  {
    id: 'ragas-on-white-keys-frets-and-side-strings',
    name: 'Frets and side strings',
    category: 'plucked',
    description:
      'Short bright twangs that never bend, set ringing in strings that learn the notes, heard through a small driven speaker.',
    preview: DOWN_FROM_SA,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Short twang',
      params: { sustain: 3, volume: -15 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Sitar drone',
        params: { mode: 2, sympathy: 0.85, decay: 5, mix: 0.5 },
      },
      { deviceId: 're-amp', preset: 'Bedside radio', params: { drive: 0.2, room: 0.15, noise: 0 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-andolan-bends',
    name: 'Andolan bends',
    category: 'string',
    description:
      'Soft half-second bends with almost no pick, a slow wide vibrato on every held note, spread by a lush chorus.',
    preview: DAWN_F,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Soft bends',
      params: { sustain: 12, glide: 520, range: 2, vibrato: 12, rate: 3, volume: -2 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { depth: 34, rate: 3 } },
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-slide-in-the-lane',
    name: 'Slide in the lane',
    category: 'plucked',
    description:
      'A lap steel picked hard and slid up to an octave, warmed by a triode and echoing once off a wall.',
    preview: DUSK_E,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Lap slide',
      params: { sustain: 12, glide: 260, volume: -10 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.6, highCut: 6000 } },
      {
        deviceId: 'analog-delay',
        preset: 'Slapback',
        params: { time: 180, feedback: 0.2, mix: 0.35 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-a-slide-that-dies-away',
    name: 'A slide that dies away',
    category: 'plucked',
    description:
      'A fading steel with slow wide slides, small pieces of it caught and dropped a fifth as they fade.',
    preview: MIDNIGHT_A,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dying slide',
      params: { sustain: 10, glide: 450, tone: 2500, volume: -4.5 },
    },
    effects: [{ deviceId: 'falling', preset: 'Slow sighs', params: { fall: -7, mix: 0.45 } }],
  },
  {
    id: 'ragas-on-white-keys-tide-to-the-upper-sa',
    name: 'Tide to the upper Sa',
    category: 'pad',
    description:
      'A steel swelled over a second and a half, octaves below and above it fading in after the string, in a four second hall.',
    preview: FIVE_HELD,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: { swell: 1.6, range: 0, vibrato: 8, volume: -8 },
    },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'Swell pad',
        params: { dry: 0.7, sub1: 0.5, up1: 0.6, up2: 0.2, attack: 0.9, filter: 5000 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // Bowed, held and plucked string: the mode, how it speaks, how bright it is, what body it has.
  {
    id: 'ragas-on-white-keys-the-lower-octave-first',
    name: 'The lower octave first',
    category: 'string',
    description:
      'A heavy bowed string with a full wooden body and a narrow vibrato, at the back of a large dark room.',
    preview: LOWER_OCTAVE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.25,
        release: 1,
        brightness: 0.3,
        pressure: 0.65,
        vibrato: 0.15,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'distance', preset: 'Back of the hall', params: { distance: 0.55, decay: 3 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-gut-against-the-nail',
    name: 'Gut against the nail',
    category: 'string',
    description:
      'A rasping bow close to the bridge, pressed into a thin vowel and ringing in strings that learn its notes.',
    preview: DAWN_F,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: {
        attack: 0.15,
        release: 0.6,
        brightness: 0.7,
        pressure: 0.85,
        vibrato: 0.1,
        body: 0.7,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Thin vowel', params: { amount: 1.2, replace: 0.2 } },
      {
        deviceId: 'sympathetic',
        preset: 'Follow the tune',
        params: { sympathy: 0.6, decay: 4, mix: 0.4 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-bow-hair-at-first-light',
    name: 'Bow hair at first light',
    category: 'string',
    description:
      'A soft bow over the fingerboard, its attacks smeared by fog and its air turned up between the notes.',
    preview: DAWN_F,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.5, release: 1.4, brightness: 0.35, position: 0.3, volume: -9 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist', params: { size: 220, layers: 2 } },
      { deviceId: 'reveal', preset: 'Air', params: { amount: 0.8 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-a-fiddle-that-sings',
    name: 'A fiddle that sings',
    category: 'string',
    description:
      'A fast held string that begins straight and grows a deep singing vibrato, on a short plate.',
    preview: EVENING_A,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Quick sustain',
      params: { attack: 0.08, release: 0.35, brightness: 0.6, vibrato: 0, body: 0.9, volume: -6 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { depth: 45, wait: 350 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-all-the-house-strings',
    name: 'All the house strings',
    category: 'pad',
    description:
      'A detuned bowed section with a slow wide sway, thickened by a flock of delayed copies and thinned of its lows.',
    preview: FIVE_HELD,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: { attack: 0.6, release: 2.5, brightness: 0.4, volume: -9 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Thick ensemble', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 6000 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-skin-topped-lute',
    name: 'Skin-topped lute',
    category: 'plucked',
    description:
      'A bright wire pluck with no vibrato, answered by a drum skin body and by a dozen strings in D minor.',
    preview: UP_TO_MA,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { release: 2, brightness: 0.7, decay: 6, body: 0.2, volume: -3 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { size: 0.6, mix: 0.6 } },
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { root: 2, sympathy: 0.5, strings: 8, decay: 3.5, mix: 0.35 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-finger-stopping-a-string',
    name: 'Finger stopping a string',
    category: 'plucked',
    description:
      'Damped dark plucks with a very short ring, each thrown out in a slowing row of echoes.',
    preview: DUSK_E,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { brightness: 0.2, decay: 1.8, volume: -2 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Slowing bounces', params: { mix: 0.4 } }],
  },
  {
    id: 'ragas-on-white-keys-glass-bow-under-a',
    name: 'Glass bow under A',
    category: 'string',
    description:
      'A light bow near the bridge, slow to speak, with a hall whose tail sinks an octave.',
    preview: MIDNIGHT_A,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.6, release: 2, brightness: 0.55, volume: -9 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Undertow', params: { decay: 7, shimmer: 0.4, mix: 0.35 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-pluck-turned-to-breath',
    name: 'Pluck turned to breath',
    category: 'string',
    description:
      'A felted pluck whose attack is taken away over a quarter second, then turned slowly by a rotary speaker.',
    preview: TURN_F_G_A,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { release: 1.5, brightness: 0.5, decay: 7, volume: -1.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 260 } },
      { deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.8 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-afternoon-under-bows',
    name: 'Afternoon under bows',
    category: 'drone',
    description:
      'A beating sustained string that takes two and a half seconds to rise, breathes open and shut, and is warmed by soft saturation.',
    preview: ROUND_ON_D,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Slow beating swell',
      params: { attack: 2.5, release: 6, brightness: 0.35, volume: -13.5 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Calm breath', params: { in: 1.5, out: 2, depth: 0.5 } },
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 7 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-two-strings-for-one-note',
    name: 'Two strings for one note',
    category: 'plucked',
    description:
      'Plucked pairs tuned twenty-five cents apart, looped through a small room that slowly keeps only its tones.',
    preview: DOWN_FROM_SA,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { release: 3, brightness: 0.65, decay: 8, volume: -2.5 },
    },
    effects: [
      { deviceId: 'generations', preset: 'Into the room', params: { length: 1.1, mix: 0.45 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-the-string-catches',
    name: 'The string catches',
    category: 'string',
    description:
      'A hard-driven sustained string that feeds back on itself into its overtones and shakes as it holds, on warm tape.',
    preview: UP_TO_MA,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 0.3, release: 1.2, vibrato: 0.5, volume: -6 },
    },
    effects: [
      { deviceId: 'howl', preset: 'Slow bloom', params: { gain: 0.6, mix: 0.4 } },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'ragas-on-white-keys-fifth-over-the-key',
    name: 'Fifth over the key',
    category: 'pad',
    description:
      'A string sounded near its middle so the twelfth glows, the whole of it washed into a soft fuzz.',
    preview: ROUND_ON_F,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Twelfth glow',
      params: { attack: 1.2, release: 2.5, volume: -12 },
    },
    effects: [
      { deviceId: 'haze', preset: 'Glowing wall', params: { decay: 4, octave: 0, mix: 0.4 } },
    ],
  },

  // Flute: which pipe, how much breath, how far each note is scooped from below.
  {
    id: 'ragas-on-white-keys-cane-flute-at-four',
    name: 'Cane flute at four',
    category: 'wind',
    description:
      'A wooden flute that slides up into every note from more than a semitone below, in an open hall.',
    preview: UP_TO_MA,
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { scoop: 130, breath: 0.45, vibrato: 0.3, attack: 0.06, volume: -9 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } }],
  },
  {
    id: 'ragas-on-white-keys-bent-up-to-the-second',
    name: 'Bent up to the second',
    category: 'wind',
    description:
      'A hard breathy bamboo flute, every note scooped from a whole tone under, with its own sound played backwards behind it.',
    preview: NOON_REST,
    instrument: {
      deviceId: 'flute',
      preset: 'Bent from below',
      params: { release: 0.8, volume: -11 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 900, mix: 0.35 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-long-cane-at-dusk',
    name: 'Long cane at dusk',
    category: 'wind',
    description:
      'A low breathy flute with some vibrato and a scoop into each note, dulled by a long dark plate.',
    preview: DUSK_E,
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { blow: 0.5, breath: 0.6, chiff: 0.3, scoop: 60, vibrato: 0.5, volume: -10 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { decay: 0.85, mix: 0.45 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-stopped-pipes-at-noon',
    name: 'Stopped pipes at noon',
    category: 'wind',
    description:
      'Chiffing pan pipes without vibrato, scattered into seven soft echoes on no regular beat.',
    preview: NOON_REST,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { breath: 0.6, release: 0.35, volume: -9 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.45 } }],
  },
  {
    id: 'ragas-on-white-keys-breath-round-five-notes',
    name: 'Breath round five notes',
    category: 'pad',
    description:
      'Low flutes that are nearly all breath, let through only where the five notes of C major pentatonic lie.',
    preview: FIVE_HELD,
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { attack: 0.8, release: 2.5, volume: -12 },
    },
    effects: [
      {
        deviceId: 'scale-filter',
        preset: 'In a major key',
        params: { root: 0, scale: 7, ring: 1.2, depth: 26, width: 45 },
      },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  {
    id: 'ragas-on-white-keys-plain-tone-then-again',
    name: 'Plain tone, then again',
    category: 'wind',
    description:
      'A straight concert flute without vibrato, taken up by three followers a second and a half apart.',
    preview: DOWN_FROM_SA,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { attack: 0.12, release: 0.8, volume: -10 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Round of three',
        params: { tone: 4500, fade: 0.35, mix: 0.45 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-shaken-in-the-reed-bed',
    name: 'Shaken in the reed bed',
    category: 'wind',
    description:
      'A bamboo flute with nearly the widest vibrato it has, blown about by gusts of wind.',
    preview: TURN_F_G_A,
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: { attack: 0.2, release: 1.2, volume: -9 },
    },
    effects: [
      {
        deviceId: 'weather',
        preset: 'Breezy day',
        params: { force: 0.4, voice: 0.2, exposure: 0.5 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-one-pipe-and-its-stops',
    name: 'One pipe and its stops',
    category: 'wind',
    description:
      'A soft recorder-like flute with no vibrato, an octave below and two pipes above speaking just after it.',
    preview: EVENING_A,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { release: 0.5, volume: -10 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Flute stops',
        params: { sub: 0.55, octave: 0.5, twelfth: 0.35, speak: 220 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-air-before-the-note',
    name: 'Air before the note',
    category: 'texture',
    description:
      'Whispering pipes, almost only air, whose spectrum hangs on and drifts into a bright haze.',
    preview: UP_TO_MA,
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { breath: 0.85, attack: 0.15, release: 1.2, volume: -10.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Glass halo', params: { blur: 0.65, mix: 0.6 } },
      { deviceId: 'ambient-comp', preset: 'Lift' },
    ],
  },
  {
    id: 'ragas-on-white-keys-wood-swelling-to-five',
    name: 'Wood swelling to five',
    category: 'pad',
    description:
      'A wooden flute that takes over a second to fill, its pitch wandering on slow tape, sounding out of a clay pot.',
    preview: FIVE_HELD,
    instrument: {
      deviceId: 'flute',
      preset: 'Slow wood swell',
      params: { attack: 1.3, release: 2.5, volume: -10 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.6, hiss: 0.1 } },
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-piper-across-the-valley',
    name: 'Piper across the valley',
    category: 'wind',
    description:
      'A hard-blown flute with a strong shake, placed far off where the air has taken its top away, a dark echo a second behind it.',
    preview: NOON_REST,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { scoop: 90, release: 0.4, volume: -8 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Far shore', params: { distance: 0.8, decay: 2 } },
      {
        deviceId: 'analog-delay',
        preset: 'Murky',
        params: { time: 1000, feedback: 0.35, mix: 0.25 },
      },
    ],
  },

  // Clarinet: the bore from hollow to conical, how hard it is blown, what breathes or shakes in it.
  {
    id: 'ragas-on-white-keys-apricot-pipe-at-dawn',
    name: 'Apricot pipe at dawn',
    category: 'wind',
    description:
      'A soft double-reed tone with a deep vibrato, in a small chapel whose tail is shaped to a vowel.',
    preview: DAWN_F,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { vibrato: 0.6, release: 0.7, volume: -3 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { decay: 3, mix: 0.4 } }],
  },
  {
    id: 'ragas-on-white-keys-reed-at-the-wedding-gate',
    name: 'Reed at the wedding gate',
    category: 'wind',
    description: 'A bright conical reed blown hard, out of a horn loudspeaker some way off.',
    preview: DOWN_FROM_SA,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { blow: 0.85, vibrato: 0.35, volume: -3 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Station platform',
        params: { drive: 0.25, bass: 0.6, distance: 0.45, noise: 0.03 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-humming-the-fourth',
    name: 'Humming the fourth',
    category: 'wind',
    description:
      'A reed blown so softly it only hums, its strongest partials traced by slow sines an octave higher.',
    preview: MIDNIGHT_A,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { attack: 0.25, release: 1, volume: -6 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Octave halo',
        params: { attack: 300, release: 3, mix: 0.45 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-subtone-after-midnight',
    name: 'Subtone after midnight',
    category: 'wind',
    description: 'A breathy low saxophone-like reed on worn cassette, rolled off and close.',
    preview: MIDNIGHT_A,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { breath: 0.7, vibrato: 0.4, volume: -6 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.2, wobble: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1800 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-wide-sway-on-komal-re',
    name: 'Wide sway on komal Re',
    category: 'wind',
    description:
      'A reed at its widest vibrato, its highs and lows traded by an uneven harmonic tremolo, in a dark hall.',
    preview: DAWN_F,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Wide vibrato reed',
      params: { attack: 0.2, release: 0.9, volume: 0.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 2.6, drift: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-open-reed-in-a-long-pipe',
    name: 'Open reed in a long pipe',
    category: 'wind',
    description:
      'A clarinet blown wide open and sounded through a long metal pipe that rings with it, in a short swelling halo.',
    preview: UP_TO_MA,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: { vibrato: 0.2, volume: 2.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Metal drone', params: { size: 3, air: 0.05, mix: 0.95 } },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { time: 0.6, mix: 0.4 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-throat-in-the-reed',
    name: 'Throat in the reed',
    category: 'wind',
    description:
      'A growling conical reed darkened by a low-pass, with hops of a fifth in its bucket-brigade echo.',
    preview: TURN_F_G_A,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: { growl: 0.45, blow: 0.6, volume: -3 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Low-pass gate', params: { cutoffHz: 1300 } },
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { feedback: 0.4, mix: 0.3 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-out-of-silence-the-sa',
    name: 'Out of silence, the Sa',
    category: 'drone',
    description:
      'A reed that fades in from nothing over nearly two seconds, a fifth added above it in D dorian and a fainter second.',
    preview: ROUND_ON_D,
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { attack: 1.8, volume: 2 },
    },
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Diatonic thirds',
        params: {
          root: 2,
          scale: 4,
          v1Degrees: 4,
          v2Degrees: 1,
          v1Level: -6,
          v2Level: -14,
          mix: 45,
        },
      },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'ragas-on-white-keys-evening-light-running',
    name: 'Evening light running',
    category: 'wind',
    description: 'A reed with a long release whose ringing tail sags and darkens as it ages.',
    preview: EVENING_A,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Slow fade reed',
      params: { release: 1.5, blow: 0.5, volume: -1 },
    },
    effects: [{ deviceId: 'melt', preset: 'Slow melt', params: { sag: -22, hold: 4, mix: 0.45 } }],
  },
  {
    id: 'ragas-on-white-keys-breath-in-split-cane',
    name: 'Breath in split cane',
    category: 'texture',
    description:
      'A reed that is nearly all breath, split into bands that twinkle apart across the speakers.',
    preview: FIVE_HELD,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { attack: 0.4, release: 1.2, volume: -11 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Wide twinkle', params: { depth: 0.8 } },
      { deviceId: 'ambient-limiter', preset: 'Loud' },
    ],
  },
  {
    id: 'ragas-on-white-keys-low-reed-below-the-lute',
    name: 'Low reed below the lute',
    category: 'wind',
    description:
      'A bass clarinet tone with a touch of growl, ringing on in a stone-dark cave reverb.',
    preview: LOWER_OCTAVE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { growl: 0.15, blow: 0.6, attack: 0.15, volume: 0.5 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 5, mix: 0.4 } }],
  },

  // Choir: one throat or many, the mouth open or closed, how straight and how soon the note comes.
  {
    id: 'ragas-on-white-keys-one-throat-before-lamps',
    name: 'One throat before lamps',
    category: 'voice',
    description:
      'A single open voice that begins straight and shakes wider as it holds, close on a warm tape.',
    preview: EVENING_A,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { vibrato: 6, attack: 0.09, release: 0.4, volume: -6.5 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { depth: 50, wait: 300 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.08 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-closed-mouths-at-four',
    name: 'Closed mouths at four',
    category: 'voice',
    description:
      'Humming voices with all their upper tones filtered off, sung into a large clay pot and turned by slow heavy rotors.',
    preview: LOWER_OCTAVE,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { attack: 0.35, release: 1.4, tone: 620, volume: -2.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { size: 2.5, mix: 0.75 } },
      {
        deviceId: 'rotary',
        preset: 'Heavy rotors',
        params: { speed: 0, drumDepth: 0.9, hornDepth: 0.9 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-deep-throats-on-sa',
    name: 'Deep throats on Sa',
    category: 'drone',
    description:
      'Large straight low voices on one note with their overtones whistled out of it step by step.',
    preview: ROUND_ON_D,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { attack: 0.8, tone: 4500, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'Low chant',
        params: {
          root: 2,
          octave: 2,
          low: 5,
          high: 10,
          pace: 0.8,
          glide: 500,
          focus: 0.7,
          drone: 0.45,
        },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-five-sung-one-by-one',
    name: 'Five sung one by one',
    category: 'pad',
    description:
      'Thin straight ee voices whose sound returns in bands, low ones first and high ones last.',
    preview: FIVE_HELD,
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { attack: 0.5, release: 2, tone: 7000, volume: -7.5 },
    },
    effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { time: 1400, mix: 0.5 } }],
  },
  {
    id: 'ragas-on-white-keys-low-voices-fall-to-a',
    name: 'Low voices fall to A',
    category: 'voice',
    description:
      'Open bass voices with a quick start, answered at random by older moments of themselves.',
    preview: LOWER_OCTAVE,
    instrument: {
      deviceId: 'choir',
      preset: 'Basses ah',
      params: { attack: 0.2, vibrato: 14, volume: -2.5 },
    },
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Recalling',
        params: { time: 750, reach: 6, size: 1.5, mix: 0.4 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-gamak-in-a-few-throats',
    name: 'Gamak in a few throats',
    category: 'voice',
    description:
      'A few voices with a sixty cent shake under four times a second, their held tones hung on into a hall.',
    preview: DAWN_F,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow waver',
      params: { vibrato: 60, vibratoRate: 3.4, attack: 0.3, release: 1.4, volume: -4.5 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.65 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-whisper-without-a-fifth',
    name: 'Whisper without a fifth',
    category: 'texture',
    description:
      'Voices that are only breath, let sound only near the notes A C D E G and carried in a slow circle round the head.',
    preview: ROUND_ON_E,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 0.9, release: 2.5, volume: -3 },
    },
    effects: [
      {
        deviceId: 'scale-filter',
        preset: 'Wide and gentle',
        params: { root: 9, scale: 8, width: 25, ring: 1.5, depth: 36 },
      },
      { deviceId: 'around', preset: 'Slow circle' },
    ],
  },
  {
    id: 'ragas-on-white-keys-tenors-turn-at-the-a',
    name: 'Tenors turn at the A',
    category: 'voice',
    description: 'Tenors on a round oh through a warm valve, swept slowly by a hollow flanger.',
    preview: TURN_F_G_A,
    instrument: {
      deviceId: 'choir',
      preset: 'Tenors oh',
      params: { attack: 0.2, vibrato: 24, volume: -7 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { noise: 0.05, wobble: 0.1 } },
      { deviceId: 'flanger', preset: 'Negative hollow', params: { rate: 0.15, mix: 0.4 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-sung-across-the-water',
    name: 'Sung across the water',
    category: 'pad',
    description:
      'A far, dark choir with a long release, in a reversed room that rises into a cut, with slow surf washing over it.',
    preview: ROUND_ON_C,
    instrument: {
      deviceId: 'choir',
      preset: 'Distant choir',
      params: { attack: 1.2, release: 4, tone: 1600, volume: -5 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 1.8, mix: 0.55 } },
      { deviceId: 'weather', preset: 'Slow surf', params: { exposure: 0.4, voice: 0.15 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-note-names-spoken-short',
    name: 'Note names spoken short',
    category: 'voice',
    description: 'Very short ah voices with no swell, each bounced into a small pattering cavern.',
    preview: DUSK_E,
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: { breath: 0.25, release: 0.12, tone: 6000, volume: -4.5 },
    },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { length: 0.45, mix: 0.4 } },
    ],
  },

  // Harp, koto and guzheng strings: how they are pressed, how long they ring, what rings with them.
  {
    id: 'ragas-on-white-keys-silk-pressed-up-a-step',
    name: 'Silk pressed up a step',
    category: 'plucked',
    description:
      'A soft koto string pressed a whole tone up after each pluck, so it sounds a step over the key, a backwards haze behind.',
    preview: TURN_F_G_A,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { bend: 200, touch: 0.3, volume: 4 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { time: 1000, mix: 0.35 } },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-koto-for-a-veena',
    name: 'Koto for a veena',
    category: 'plucked',
    description:
      'A long-ringing koto plucked near the bridge, its lows raised and strings in D minor sounding on.',
    preview: LOWER_OCTAVE,
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { halo: 0.1, body: 1, decay: 2.2, volume: 4 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 6, presence: -3 } },
      {
        deviceId: 'sympathetic',
        preset: 'Minor wash',
        params: { root: 2, decay: 7, strings: 8, sympathy: 0.6, mix: 0.45 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-a-whole-step-by-pressing',
    name: 'A whole step by pressing',
    category: 'plucked',
    description:
      'A long koto string that rises a whole tone above its key once plucked, trailed by tape repeats three quarters of a second apart.',
    preview: UP_TO_MA,
    instrument: {
      deviceId: 'harp',
      preset: 'Whole tone press',
      params: { touch: 0.55, pluck: 0.15, volume: 0.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { time: 750, feedback: 0.3, mix: 0.3 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-bare-wire-in-noon-sun',
    name: 'Bare wire in noon sun',
    category: 'plucked',
    description:
      'Bright guzheng wire with no body, pressed flat by a limiter, doubled a few cents apart and scattered in octave-high grains.',
    preview: NOON_REST,
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { decay: 2.5, halo: 0.7, pluck: 0.12, volume: 1 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 28, outputGain: -8 } },
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { detune: 12 } },
      { deviceId: 'grain-delay', preset: 'Crystals', params: { feedback: 0.3, mix: 0.25 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-palm-on-night-strings',
    name: 'Palm on night strings',
    category: 'plucked',
    description:
      'A palm-muted harp pressed through a transformer, its soft thuds repeated by a short fading loop of tape.',
    preview: MIDNIGHT_A,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { damp: 0.65, touch: 0.2, volume: -5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth', params: { drive: 0.45 } },
      { deviceId: 'tape-loop', preset: 'One second round', params: { length: 1.4, mix: 0.4 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-sweep-of-the-small-harp',
    name: 'Sweep of the small harp',
    category: 'plucked',
    description:
      'Guzheng strings plucked near the bridge, chords rolled a little, the notes hung in the air by a soft sustaining pad.',
    preview: FIVE_HELD,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng cascade',
      params: { sweep: 0.3, halo: 0.9, volume: 6 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings', params: { attack: 0.4, mix: 0.75 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-hollow-strings-on-pure-e',
    name: 'Hollow strings on pure E',
    category: 'plucked',
    description:
      'A dark harp plucked in the middle of the string, an octave-up copy added to it, both on a wavering reel of tape.',
    preview: DUSK_E,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { touch: 0.1, volume: -8 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string', params: { up1: 0.55 } },
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.6, noise: 0.1 } },
    ],
  },

  // Droplets: rain on the notes held, so a raga's own notes fall and no others.
  {
    id: 'ragas-on-white-keys-five-drops-at-dusk',
    name: 'Five drops at dusk',
    category: 'texture',
    description:
      'Glass drops on the held notes and their octaves, each followed by a scatter of echoes over three seconds.',
    preview: FIVE_HELD,
    instrument: {
      deviceId: 'droplets',
      preset: 'Glass rain',
      params: { rain: 4, spread: 1, ring: 1.6, volume: -1.5 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Full sky', params: { span: 3000, mix: 0.35 } }],
  },
  {
    id: 'ragas-on-white-keys-water-bowls-in-a-ring',
    name: 'Water bowls in a ring',
    category: 'bell',
    description:
      'Water drops falling loosely on each held note, waking a table of bowls in C major pentatonic.',
    preview: DUSK_E,
    instrument: {
      deviceId: 'droplets',
      preset: 'Water drops',
      params: { rain: 6, size: 0.35, trail: 0.8, volume: -1 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Bowl table',
        params: { root: 0, scale: 0, ring: 6, mix: 0.45 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-metal-drizzle-on-e',
    name: 'Metal drizzle on E',
    category: 'bell',
    description:
      'Small metal strikes spread over two octaves of the held notes, ring-modulated on D into faint gongs, on a long plate.',
    preview: NOON_REST,
    instrument: {
      deviceId: 'droplets',
      preset: 'Bell drizzle',
      params: { rain: 5, trail: 2, volume: -3 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Fifth halo', params: { root: 2, octave: 3, mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-felt-keeps-the-round',
    name: 'Felt keeps the round',
    category: 'keys',
    description:
      'An even pulse of large felted drops on the held notes, through a dark filter and a touch of drive.',
    preview: ROUND_ON_E,
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt pulse',
      params: { rain: 2, ring: 3, volume: -8 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Low-pass gate', params: { cutoffHz: 900, driveDb: 6 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-monsoon-not-yet-here',
    name: 'Monsoon not yet here',
    category: 'texture',
    description:
      'A heavy loose shower of wooden ticks on the notes of the chord, outdoors in falling rain.',
    preview: FIVE_HELD,
    instrument: {
      deviceId: 'droplets',
      preset: 'Wood ticks',
      params: { rain: 14, size: 0.35, ring: 2, splash: 0.2, volume: -0.5 },
    },
    effects: [{ deviceId: 'weather', preset: 'Light rain', params: { force: 0.35 } }],
  },
  {
    id: 'ragas-on-white-keys-deep-well-of-sa',
    name: 'Deep well of Sa',
    category: 'drone',
    description:
      'Large slow drops into deep water on one held note, slowed into a cloud many times longer than they are.',
    preview: ROUND_ON_F,
    instrument: {
      deviceId: 'droplets',
      preset: 'Deep pool',
      params: { rain: 1.5, splash: 0.4, volume: -9 },
    },
    effects: [{ deviceId: 'stretch', preset: 'Slow cloud', params: { mix: 0.5 } }],
  },
  {
    id: 'ragas-on-white-keys-taans-in-glass',
    name: 'Taans in glass',
    category: 'bell',
    description:
      'Glass drops that come in sudden flurries, pulled after themselves by small falls in pitch.',
    preview: DOWN_FROM_SA,
    instrument: {
      deviceId: 'droplets',
      preset: 'Flurries',
      params: { rain: 12, trail: 1, spread: 1, volume: -2 },
    },
    effects: [
      { deviceId: 'falling', preset: 'Wilting', params: { fall: -2, mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.3 } },
    ],
  },

  // Feedback: a string caught by its amplifier, held on its own octave, twelfth or higher.
  {
    id: 'ragas-on-white-keys-sa-that-will-not-let-go',
    name: 'Sa that will not let go',
    category: 'string',
    description:
      'A hard-picked string that feedback catches after a second, gritty and unwilling to fade, in an overdriven spring.',
    preview: UP_TO_MA,
    instrument: {
      deviceId: 'feedback',
      preset: 'Long sink',
      params: { bloom: 1.2, release: 3, grit: 0.7, pick: 0.8, damp: 0.2, volume: -6 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Overdriven tank', params: { mix: 0.45 } }],
  },
  {
    id: 'ragas-on-white-keys-e-above-a-held-c',
    name: 'E above a held C',
    category: 'drone',
    description:
      'Clean feedback on the fifth overtone, two octaves and a third up, moved round the head in a slow figure of eight.',
    preview: ROUND_ON_C,
    instrument: {
      deviceId: 'feedback',
      preset: 'High whistle',
      params: { bloom: 0.9, distance: 5, volume: -3.5 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow eight' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'ragas-on-white-keys-string-that-turns-reed',
    name: 'String that turns reed',
    category: 'wind',
    description:
      'Gritty feedback on the note itself with hardly any pick, its body made smaller and set in a small room.',
    preview: MIDNIGHT_A,
    instrument: { deviceId: 'feedback', preset: 'Reed tone', params: { grit: 0.5, volume: -7 } },
    effects: [
      { deviceId: 'size', preset: 'Smaller', params: { size: -0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-twelfth-over-the-drone',
    name: 'Twelfth over the drone',
    category: 'pad',
    description:
      'Pure feedback a twelfth above each held note, splitting slowly apart by a few hertz left and right.',
    preview: DAWN_F,
    instrument: {
      deviceId: 'feedback',
      preset: 'Pure twelfth',
      params: { bloom: 0.6, release: 1.2, volume: -4 },
    },
    effects: [{ deviceId: 'freq-shifter', preset: 'Split sky', params: { fine: 2, mix: 0.45 } }],
  },
  {
    id: 'ragas-on-white-keys-air-drifting-off-the-f',
    name: 'Air drifting off the F',
    category: 'drone',
    description:
      'Feedback that keeps leaving one overtone for another, kept soft by a tube and a small dark room.',
    preview: ROUND_ON_F,
    instrument: { deviceId: 'feedback', preset: 'Drifting air', params: { bloom: 1, volume: -18 } },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { toneDb: -4, outputDb: -6 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.35 } },
    ],
  },

  // Thesis: noise tuned to the raga's own scale and mirrored round its strong note.
  {
    id: 'ragas-on-white-keys-mirrored-round-the-g',
    name: 'Mirrored round the G',
    category: 'pad',
    description:
      'Noise bands in D dorian mirrored around G, each swelling in turn, levelled by a slow compressor.',
    preview: UP_TO_MA,
    instrument: {
      deviceId: 'thesis',
      preset: 'Thesis Default',
      params: {
        center: 67,
        resonance: 60,
        width: 90,
        attack: 0.25,
        release: 1.5,
        scale: 4,
        root: 2,
      },
    },
    effects: [{ deviceId: 'ambient-comp', preset: 'Level', params: { makeup: 4 } }],
  },
  {
    id: 'ragas-on-white-keys-first-light-on-f',
    name: 'First light on F',
    category: 'texture',
    description:
      'Breathy bands in E phrygian that also sound the A at their centre, with the frost of a late year over them.',
    preview: DAWN_F,
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { center: 57, resonance: 20, width: 85, attack: 0.4, release: 2, centerEnabled: 1 },
    },
    effects: [{ deviceId: 'seasons', preset: 'First frost', params: { depth: 0.6 } }],
  },
  {
    id: 'ragas-on-white-keys-evening-strum-on-f',
    name: 'Evening strum on F',
    category: 'pad',
    description:
      'Strummed noise chords in F lydian mirrored around the strong A, with reversed grains of it nearly a second behind.',
    preview: ROUND_ON_F,
    instrument: {
      deviceId: 'thesis',
      preset: 'Strummed Lydian',
      params: { center: 69, width: 85, release: 3, strum: 100, root: 5 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Backwards shards', params: { time: 900, mix: 0.4 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 8 } },
    ],
  },
  {
    id: 'ragas-on-white-keys-pentatonic-about-e',
    name: 'Pentatonic about E',
    category: 'pad',
    description:
      'Five-note bands in C breathing quickly around E, run through a wide twelve-stage phaser.',
    preview: FIVE_HELD,
    instrument: {
      deviceId: 'thesis',
      preset: 'Pentatonic Breath',
      params: { center: 64, resonance: 90, width: 100, breatheRate: 1.1, release: 2.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 10 } },
    ],
  },

  // Rewind: notes that gather before they land, as a slide gathers before its note.
  {
    id: 'ragas-on-white-keys-arriving-at-sa',
    name: 'Arriving at Sa',
    category: 'bell',
    description:
      'A backwards bowl that gathers over two seconds into its stroke and rings on with a slow phasing drift.',
    preview: ROUND_ON_C,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: { swell: 2, tail: 0.8, volume: 2 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'ragas-on-white-keys-pluck-before-itself',
    name: 'Pluck before itself',
    category: 'plucked',
    description:
      'Short backwards plucks that rush into their note and all but stop, ringing afterwards only in strings that learn them.',
    preview: DUSK_E,
    instrument: {
      deviceId: 'rewind',
      preset: 'Pluck back',
      params: { swell: 0.3, tail: 0.15, volume: 0 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Follow the tune',
        params: { sympathy: 0.8, decay: 6, strings: 10, mix: 0.5 },
      },
    ],
  },
  {
    id: 'ragas-on-white-keys-five-gather-slowly',
    name: 'Five gather slowly',
    category: 'pad',
    description:
      'Dark backwards piano notes with a wide ghost of room ahead of each, grown into a soft string pad.',
    preview: FIVE_HELD,
    instrument: {
      deviceId: 'rewind',
      preset: 'Ghost room',
      params: { swell: 1.6, tail: 0.5, tone: 0.3, volume: 6 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'String pad', params: { octaves: 0, mix: 0.45 } },
    ],
  },
]
