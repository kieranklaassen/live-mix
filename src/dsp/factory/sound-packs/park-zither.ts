// The sounds of the pack "Park Bench Zither": its presets played, a hundred sounds to
// paint with. Numbers 11001 to 11100.

import { PRESETS } from '../packs/park-zither'
import { type FactorySound } from '../types'
import { breathe, cycled, hall, looped, packSounds, played, quarterTurn, soften } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('park-zither', 11000, PRESETS, [
  // Drones: the tanpura under the strings, and whatever else on the blanket can hold a note.
  {
    n: 1,
    id: 'long-noon-drone-d',
    name: 'Long noon drone {D}',
    kind: 'drone',
    description:
      'Slow plucks on {D} and {A} that overlap into a wall of overtones, under one turn of a flanger in a very large space.',
    preset: 'park-zither-long-noon-drone',
    set: { speed: 8.094 },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 30, outputGain: -12 } },
      {
        deviceId: 'sustainer',
        preset: 'Endless drone',
        params: { attack: 1.5, motion: 0.3, mix: 0.7 },
      },
      { deviceId: 'flanger', preset: 'Slow sweep', params: { rate: 0.125, depth: 30, mix: 0.25 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 14, modRate: 0.375, width: 0.7, mix: 0.4 },
      },
    ],
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 30, outputGain: -12 } }],
    ...looped(8, 8.1, 3, [50]),
  },
  {
    n: 2,
    id: 'fourth-string-open-e',
    name: 'Fourth string open {E}',
    kind: 'drone',
    description:
      'A drone on {E} with its first string tuned to the fourth, {A}, and sympathetic strings ringing behind it in a hall.',
    preset: 'park-zither-fourth-string-open',
    set: { speed: 4.047 },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 30, outputGain: -12 } },
      { deviceId: 'sympathetic', preset: 'Sitar drone', params: { root: 9, mode: 1, mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { breathRate: 0.25, mix: 0.25 } },
    ],
    then: [
      {
        deviceId: 'ambient-comp',
        params: {
          threshold: -45,
          ratio: 8,
          attack: 10,
          release: 0.15,
          knee: 6,
          tails: 1,
          scLowCut: 40,
          makeup: 18,
        },
      },
    ],
    ...looped(8, 8.1, 2, [52]),
  },
  {
    n: 3,
    id: 'just-major-air-f',
    name: 'Just major air {F}',
    kind: 'drone',
    description:
      'A just major chord of soft partials on {F} with air in it, turned once a loop by a phaser under a faint octave.',
    preset: 'park-zither-just-major-air',
    set: { movement: 0 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Slow swirl',
        params: { centerHz: 1600, depth: 40, rate: 0.125, mix: 0.25 },
      },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { shimmer: 0.3, mix: 0.25 } },
    ],
    then: [
      quarterTurn(8),
      {
        deviceId: 'ambient-comp',
        params: {
          threshold: -45,
          ratio: 8,
          attack: 10,
          release: 0.15,
          knee: 6,
          tails: 1,
          scLowCut: 40,
          makeup: 18,
        },
      },
    ],
    ...looped(8, 7, 3, [53]),
    tuning: 'whole-cycles',
  },
  {
    n: 4,
    id: 'overtone-ladder-g',
    name: 'Overtone ladder {G}',
    kind: 'drone',
    description:
      'A low {G} sounding its whole harmonic series, buzzing like a drone lute, combed by a resonant flanger in a hall.',
    preset: 'park-zither-overtone-ladder',
    set: { movement: 0.2 },
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Classic jet',
        params: { rate: 0.125, depth: 75, feedback: 55, mix: 0.4 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    then: [
      quarterTurn(8),
      {
        deviceId: 'ambient-comp',
        params: {
          threshold: -45,
          ratio: 8,
          attack: 10,
          release: 0.15,
          knee: 6,
          tails: 1,
          scLowCut: 40,
          makeup: 18,
        },
      },
    ],
    ...looped(8, 5, 3, [43]),
    tuning: 'whole-cycles',
  },
  {
    n: 5,
    id: 'root-under-strings-a',
    name: 'Root under strings {A}',
    kind: 'drone',
    description:
      'Two beating oscillators and a sub held on a low {A}, with a phaser turning the top of it once a loop.',
    preset: 'park-zither-root-under-the-strings',
    set: { beat: 3 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Bass safe',
        params: { centerHz: 1200, rate: 0.125, depth: 60, mix: 0.45 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
    ],
    then: [
      quarterTurn(8),
      {
        deviceId: 'ambient-comp',
        params: {
          threshold: -45,
          ratio: 8,
          attack: 10,
          release: 0.15,
          knee: 6,
          tails: 1,
          scLowCut: 40,
          makeup: 18,
        },
      },
    ],
    ...looped(8, 3, 2, [45]),
    tuning: 'whole-cycles',
  },
  {
    n: 6,
    id: 'lap-harmonium-c',
    name: 'Lap harmonium {C}',
    kind: 'drone',
    description:
      'A reedy harmonium holding {C} and {G} with the bellows kept even, in a slow phaser and a little hall.',
    preset: 'park-zither-lap-harmonium',
    set: { bellows: 0.1, celeste: 0 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Slow swirl',
        params: { centerHz: 900, depth: 70, rate: 0.125, mix: 0.4 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    then: [
      quarterTurn(8),
      {
        deviceId: 'ambient-comp',
        params: {
          threshold: -45,
          ratio: 8,
          attack: 10,
          release: 0.15,
          knee: 6,
          tails: 1,
          scLowCut: 40,
          makeup: 18,
        },
      },
    ],
    ...looped(8, 4, 2, [48, [55, 0.7]]),
    tuning: 'whole-cycles',
  },
  {
    n: 7,
    id: 'flutes-turning-b',
    name: 'Flutes turning {B}',
    kind: 'drone',
    description:
      'Soft flute pipes on {B} in octaves with their wind audible, through a slowly rotating speaker across a room.',
    preset: 'park-zither-flutes-turning',
    then: [
      quarterTurn(8),
      {
        deviceId: 'ambient-comp',
        params: {
          threshold: -45,
          ratio: 8,
          attack: 10,
          release: 0.15,
          knee: 6,
          tails: 1,
          scLowCut: 40,
          makeup: 18,
        },
      },
    ],
    ...looped(8, 4, 2, [59, [71, 0.6]]),
    tuning: 'whole-cycles',
  },
  {
    n: 8,
    id: 'strings-under-arch-d',
    name: 'Strings under arch {D}',
    kind: 'drone',
    description:
      'Two players on {D} and {A} with almost no bow weight and no vibrato, phased in twelve stages under stone.',
    preset: 'park-zither-strings-under-the-arch',
    set: { players: 1, scatter: 0, air: 0.25 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Twelve stage cloud',
        params: { rate: 0.125, depth: 30, mix: 0.2 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { midDecay: 4, damping: 5000, mix: 0.35 },
      },
    ],
    then: [
      {
        deviceId: 'ambient-comp',
        params: {
          threshold: -45,
          ratio: 8,
          attack: 10,
          release: 0.15,
          knee: 6,
          tails: 1,
          scLowCut: 40,
          makeup: 18,
        },
      },
    ],
    ...looped(8, 5, 3, [50, [57, 0.7]]),
  },
  {
    n: 9,
    id: 'home-keyboard-organ-g',
    name: 'Home keyboard organ {G}',
    kind: 'drone',
    description:
      'A square-wave organ tone on {G} and {D} with both choruses on, wobbling and hissing on a worn cassette in a spring.',
    preset: 'park-zither-home-keyboard-organ',
    then: [
      {
        deviceId: 'ambient-comp',
        params: {
          threshold: -45,
          ratio: 8,
          attack: 10,
          release: 0.15,
          knee: 6,
          tails: 1,
          scLowCut: 40,
          makeup: 18,
        },
      },
    ],
    ...looped(8, 3, 2, [43, 55, [62, 0.8]]),
  },
  {
    n: 10,
    id: 'reed-by-the-water-d',
    name: 'Reed by the water {D}',
    kind: 'drone',
    description:
      'A soft double reed holding {D}, {A} and the {D} above with almost no vibrato, a dark echo and a hall behind it.',
    preset: 'park-zither-reed-by-the-water',
    set: { vibrato: 0.15, attack: 0.6 },
    then: [
      quarterTurn(8),
      {
        deviceId: 'ambient-comp',
        params: {
          threshold: -45,
          ratio: 8,
          attack: 10,
          release: 0.15,
          knee: 6,
          tails: 1,
          scLowCut: 40,
          makeup: 18,
        },
      },
    ],
    ...looped(8, 4, 2, [50, [57, 0.7], [62, 0.5]]),
    tuning: 'whole-cycles',
  },

  {
    n: 11,
    id: 'mouth-organ-held-e',
    name: 'Mouth organ held {E}',
    kind: 'drone',
    description:
      'A hollow reed section holding {E}, {B} and the {E} above with no tremolo, dry, in a small room.',
    preset: 'park-zither-mouth-organ-chord',
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } }],
    then: [
      {
        deviceId: 'ambient-comp',
        params: {
          threshold: -45,
          ratio: 8,
          attack: 10,
          release: 0.15,
          knee: 6,
          tails: 1,
          scLowCut: 40,
          makeup: 18,
        },
      },
    ],
    ...looped(8, 3, 2, [52, 59, [64, 0.7]]),
  },

  // Pads: chords that move, most of them turned by the phaser or the flanger once a loop.
  {
    n: 12,
    id: 'six-warm-bows-g6',
    name: 'Six warm bows {G}6',
    kind: 'pad',
    description:
      'Six players leaning on the bow on {G} sixth, close, with one chorused repeat behind them.',
    preset: 'park-zither-six-warm-bows',
    set: { air: 0.05, vibrato: 6, scatter: 0.2 },
    then: [breathe(0.125, 0.4)],
    ...looped(8, 4, 2, [43, 50, [59, 0.8], [64, 0.8]]),
  },
  {
    n: 13,
    id: 'morning-chant-a',
    name: 'Morning chant {A}',
    kind: 'pad',
    description:
      'Low voices holding {A}, {E} and the {A} above on one closed vowel, slowly phased, in a hall whose tail sings back.',
    preset: 'park-zither-morning-chant',
    set: { ensemble: 0.25 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Slow swirl',
        params: { centerHz: 700, rate: 0.125, mix: 0.35 },
      },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { decay: 6, mix: 0.3 } },
    ],
    ...looped(8, 6, 2, [45, 52, [57, 0.8]]),
  },
  {
    n: 14,
    id: 'ensemble-phaser-csus2',
    name: 'Ensemble, phaser {C}sus2',
    kind: 'pad',
    description:
      'The top octave of a string ensemble on {C}, {D} and {G}, thin and bright, in a slow six-stage phaser and a hall.',
    preset: 'park-zither-ensemble-and-phaser',
    set: { width: 0.5 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm six-stage',
        params: { centerHz: 1000, rate: 0.125, depth: 80, feedback: 50 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...looped(8, 5, 2, [60, [62, 0.8], [67, 0.8]]),
  },
  {
    n: 15,
    id: 'warm-brick-am7',
    name: 'Warm brick {A}m7',
    kind: 'pad',
    description:
      'Bright synthesiser strings on {A} minor seventh that keep swelling, turned once a loop by a phaser in a hall.',
    preset: 'park-zither-warm-brick',
    set: { detune: 5, brilliance: 4000 },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5, 3, [57, 64, [67, 0.6], [72, 0.7]]),
  },
  {
    n: 16,
    id: 'brass-gong-pad-d',
    name: 'Brass gong pad {D}',
    kind: 'pad',
    description:
      'A brassy fifth on {D} with ring modulation in it that clangs like struck metal, flanged on a long plate.',
    preset: 'park-zither-brass-gong-pad',
    effects: [
      { deviceId: 'flanger', preset: 'Gentle sweep', params: { rate: 0.125, mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    then: [breathe(0.125, 0.4), { deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...looped(8, 5, 3, [50, [57, 0.8]]),
  },
  {
    n: 17,
    id: 'phased-pulse-pad-g6',
    name: 'Phased pulse pad {G}6',
    kind: 'pad',
    description:
      'A thin moving pulse on {G} sixth with the filter well open, in a slow phaser and a hall.',
    preset: 'park-zither-phased-pulse-pad',
    set: { cutoff: 3200 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm six-stage',
        params: { rate: 0.125, depth: 75, mix: 0.45 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { breathRate: 0.25, mix: 0.3 } },
    ],
    ...looped(8, 5, 3, [55, 62, [64, 0.5], [71, 0.5]]),
  },
  {
    n: 18,
    id: 'glass-pad-turning-dm7',
    name: 'Glass pad turning {D}m7',
    kind: 'pad',
    description:
      'A triangle and a thin pulse an octave apart on {D} minor seventh, turned through twelve phaser stages on a plate.',
    preset: 'park-zither-glass-pad-turning',
    set: { lfo1Rate: 0.125, lfo2Rate: 0.375, unisonVoices: 2, unisonDetune: 8 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Twelve stage cloud',
        params: { rate: 0.125, feedback: 40, mix: 0.4 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
    then: [breathe(0.125, 0.35)],
    ...looped(8, 5, 3, [50, 57, [60, 0.5], [65, 0.5]]),
  },
  {
    n: 19,
    id: 'glass-table-morning-f',
    name: 'Glass table morning {F}',
    kind: 'pad',
    description:
      'A glass wavetable on {F}, {C}, {E} and {G} in its brighter half, under a faint rising octave and a slow phaser.',
    preset: 'park-zither-glass-table-morning',
    set: { rate: 0.125 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Slow swirl',
        params: { centerHz: 1400, depth: 70, rate: 0.125, mix: 0.4 },
      },
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { shimmer: 0.25, decay: 5, mix: 0.25 },
      },
    ],
    ...looped(8, 5, 3, [53, 60, [64, 0.8], [67, 0.7]]),
  },
  {
    n: 20,
    id: 'vowel-haze-am',
    name: 'Vowel haze {A}m',
    kind: 'pad',
    description:
      'A wavetable on {A} minor moving between vowels once a loop, combed by a flanger in a hall.',
    preset: 'park-zither-vowel-haze',
    set: { rate: 0.125 },
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Wide wash',
        params: { rate: 0.125, depth: 65, stereo: 90, mix: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { breathRate: 0.25, mix: 0.3 } },
    ],
    then: [breathe(0.125, 0.4)],
    ...looped(8, 6, 3, [45, 52, [60, 0.8], [64, 0.8]]),
  },
  {
    n: 21,
    id: 'slow-saw-tide-dm',
    name: 'Slow saw tide {D}m',
    kind: 'pad',
    description:
      'A low string ensemble on {D} minor, its chorus slowed, under a slow flanger in a very large space.',
    preset: 'park-zither-slow-saw-tide',
    set: { width: 0.5, ensemble: 0.6 },
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Slow sweep',
        params: { rate: 0.125, feedback: 40, mix: 0.35 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 8, modRate: 0.375, mix: 0.3 } },
    ],
    then: [breathe(0.125, 0.4)],
    ...looped(8, 7, 3, [38, 45, 50, [53, 0.5]]),
  },
  {
    n: 22,
    id: 'brass-in-the-swirl-c',
    name: 'Brass in the swirl {C}',
    kind: 'pad',
    description:
      'A section of horns holding a chord of {C}, turned by a deep eight-stage phaser on a long plate.',
    preset: 'park-zither-brass-in-the-swirl',
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Deep eight-stage',
        params: { rate: 0.125, feedback: 50, mix: 0.45 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...looped(8, 5, 3, [48, 55, [60, 0.8], [64, 0.7]]),
  },
  {
    n: 23,
    id: 'choir-on-a-reel-em',
    name: 'Choir on a reel {E}m',
    kind: 'pad',
    description:
      'A choir played from tape with its hiss on {E} minor, brightened a little, swept by a slow flanger in a hall.',
    preset: 'park-zither-choir-on-a-reel',
    set: { vibrato: 0.15, players: 0.3, hiss: 0.15 },
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Gentle sweep',
        params: { rate: 0.125, depth: 65, mix: 0.35 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    then: [breathe(0.125, 0.4)],
    ...looped(8, 5, 3, [59, [64, 0.8], [67, 0.8]]),
  },
  {
    n: 24,
    id: 'mouth-organ-chord-g',
    name: 'Mouth organ chord {G}',
    kind: 'pad',
    description:
      'A hollow reed section holding a chord of {G} and fluttered by a tremolo, like a mouth organ breathed in and out.',
    preset: 'park-zither-mouth-organ-chord',
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { rate: 5.5, depth: 0.35, phase: 60, drift: 0 },
      },
      {
        deviceId: 'tremolo',
        params: { mode: 0, rate: 0.25, depth: 0.5, shape: 0, drift: 0, smooth: 0.5 },
      },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.75, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    ...looped(8, 3, 2, [55, 59, [62, 0.8], [67, 0.8]]),
  },
  {
    n: 25,
    id: 'loaded-tanpura-d',
    name: 'Loaded tanpura {D}',
    kind: 'pad',
    description:
      "The bank's tanpura drone looped under two keys, {D} and {A}, with a little wobble, through a phaser and a chorused echo.",
    preset: 'park-zither-loaded-and-phased',
    source: 'tanpura-d',
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm six-stage',
        params: { rate: 0.25, depth: 70, mix: 0.45 },
      },
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 380, mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    then: [breathe(0.125, 0.4)],
    ...looped(8, 4, 3, [60, [67, 0.7]]),
  },
  {
    n: 26,
    id: 'glass-slide-swell-d',
    name: 'Glass slide swell {D}',
    kind: 'pad',
    description:
      'Steel notes on {D}, {A} and {E} swelled in with a pedal and held without vibrato, in a slow flanger on a long plate.',
    preset: 'park-zither-glass-slide-swell',
    effects: [
      { deviceId: 'flanger', preset: 'Wide wash', params: { rate: 0.125, mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    ...looped(8, 2, 2, [50, 57, [64, 0.8]]),
  },
  {
    n: 27,
    id: 'chords-from-nothing-am',
    name: 'Chords from nothing {A}m',
    kind: 'pad',
    description:
      'A clean guitar swelling in on {A} minor and then {F}, no pick heard, in a slow rotating speaker; it comes round.',
    preset: 'park-zither-chords-from-nothing',
    ...cycled(8, [
      [0, 4.3, 45, 0.8],
      [0, 4.3, 52, 0.7],
      [0, 4.3, 57, 0.7],
      [0, 4.3, 60, 0.7],
      [0, 4.3, 64, 0.6],
      [4.1, 4.1, 48, 0.8],
      [4.1, 4.1, 53, 0.7],
      [4.1, 4.1, 57, 0.7],
      [4.1, 4.1, 60, 0.7],
      [4.1, 4.1, 64, 0.6],
    ]),
  },
  {
    n: 28,
    id: 'eyes-closed-cmaj7',
    name: 'Eyes closed {C}maj7',
    kind: 'pad',
    description:
      'Fifths and octaves on {C} and {E}, then {F} and {A}, each strum fading in like a bowed string; it comes round.',
    preset: 'park-zither-eyes-closed',
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 600 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.125, mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    ...cycled(8, [
      [0, 3.6, 48, 0.8],
      [0.06, 3.6, 52, 0.7],
      [4.13, 3.4, 53, 0.8],
      [4.19, 3.4, 57, 0.7],
    ]),
  },
  {
    n: 29,
    id: 'wire-brush-chord-em7',
    name: 'Wire brush chord {E}m7',
    kind: 'pad',
    description:
      'Two octaves of {E} minor seventh brushed almost at once, dark and long, a string pad swelling in behind on a long plate.',
    preset: 'park-zither-wire-brush-chord',
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Slow swell',
        params: { rise: 2, brightness: 2200, width: 0.6, mix: 0.4 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.4, mix: 0.3 } },
    ],
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }],
    ...cycled(8, [
      [0, 6.5, 52],
      [0, 6.5, 55],
      [0, 6.5, 59],
      [0, 6.5, 62],
    ]),
  },
  {
    n: 30,
    id: 'lap-harmonium-breath-f',
    name: 'Harmonium breath {F}',
    kind: 'pad',
    description:
      'A reedy harmonium chord on {F} pumped by hand so that it breathes, with a slow phaser and a little hall.',
    preset: 'park-zither-lap-harmonium',
    set: { bellows: 1 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Slow swirl',
        params: { centerHz: 900, depth: 70, rate: 0.125, mix: 0.4 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    then: [breathe(0.25, 0.4), quarterTurn(8)],
    ...looped(8, 6, 2, [53, 60, [65, 0.8], [69, 0.8]]),
    tuning: 'whole-cycles',
  },
  {
    n: 31,
    id: 'tape-flutes-f',
    name: 'Tape flutes, phased {F}',
    kind: 'pad',
    description:
      'Flutes from a strip of worn tape holding {F}, {A} and {C}, wavering, through a quick phaser and a tape echo.',
    preset: 'park-zither-tape-flutes-phased',
    set: { length: 9 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Classic four-stage',
        params: { centerHz: 1100, rate: 0.5, mix: 0.45 },
      },
      { deviceId: 'tape-echo', params: { time: 400, feedback: 0.4, mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.25 } },
    ],
    ...looped(8, 3, 2, [65, [69, 0.8], [72, 0.8]]),
  },
  {
    n: 32,
    id: 'bowed-wire-b',
    name: 'Bowed wire {B}',
    kind: 'pad',
    description:
      'One thin wire bowed lightly near the bridge on {B}, pure and slow to speak, in a slow phaser and a hall.',
    preset: 'park-zither-bowed-wire',
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm six-stage',
        params: { centerHz: 1400, rate: 0.125, mix: 0.4 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    then: [quarterTurn(8), { deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...looped(8, 6, 2, [59]),
    tuning: 'whole-cycles',
  },
  {
    n: 33,
    id: 'wet-glass-rims-e',
    name: 'Wet glass rims {E}',
    kind: 'pad',
    description:
      'Two glasses rubbed until they sing on {E} and {B}, phased in twelve stages with a rising halo behind.',
    preset: 'park-zither-wet-glass-rims',
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { rate: 0.125, mix: 0.4 } },
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { shimmer: 0.3, decay: 6, mix: 0.25 },
      },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 6, 3, [64, [71, 0.7]]),
    tuning: 'whole-cycles',
  },
  {
    n: 34,
    id: 'bronze-weather-a',
    name: 'Bronze weather {A}',
    kind: 'pad',
    description:
      'A gong on {A} kept sounding with soft beaters for the whole loop, swept once by a flanger in a cathedral.',
    preset: 'park-zither-bronze-weather',
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Slow sweep',
        params: { rate: 0.125, feedback: 45, mix: 0.45 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...looped(8, 6, 3, [57]),
  },
  {
    n: 35,
    id: 'warm-pavement-fmaj7',
    name: 'Warm pavement {F}maj7',
    kind: 'pad',
    description:
      'A vibraphone chord on {F} major seventh rolled with soft sticks into a steady blur, slowly phased on a long plate.',
    preset: 'park-zither-warm-pavement',
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, mix: 0.45 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    then: [quarterTurn(8), { deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...looped(8, 5, 3, [53, 60, [64, 0.8], [69, 0.8]]),
    tuning: 'whole-cycles',
  },
  {
    n: 36,
    id: 'blanket-strings-g',
    name: 'Blanket strings {G}',
    kind: 'pad',
    description:
      'Four buzzing strings on {G} and {D} plucked round over their own held bed, in a phasing that keeps climbing.',
    preset: 'park-zither-blanket-drone',
    set: { speed: 4.047, decay: 20 },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 30, outputGain: -12 } },
      {
        deviceId: 'sustainer',
        preset: 'Endless drone',
        params: { attack: 1.5, motion: 0.3, mix: 0.7 },
      },
      {
        deviceId: 'freq-shifter',
        preset: 'Barber pole',
        params: { fine: 0.625, feedback: 0.7, mix: 0.3 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5.47, 2, [55]),
  },
  {
    n: 37,
    id: 'late-light-strings-c',
    name: 'Late light strings {C}',
    kind: 'pad',
    description:
      'Plucked strings on {C} with the seventh, {B}, held by a sustainer through a slow rotating speaker and an octave above.',
    preset: 'park-zither-late-light-drone',
    set: { speed: 4.047 },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 30, outputGain: -12 } },
      {
        deviceId: 'sustainer',
        preset: 'Endless drone',
        params: { attack: 1.5, motion: 0.3, mix: 0.7 },
      },
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.1, distance: 0.5, mix: 0.5 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { shimmer: 0.3, mix: 0.3 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 8.1, 2, [48]),
  },
  {
    n: 38,
    id: 'turning-leaves-c',
    name: 'Turning leaves {C}',
    kind: 'pad',
    description:
      'Slow random strums of {C} and then {A} minor over their own held bed, each swelling once, through a slowly rotating speaker.',
    preset: 'park-zither-turning-leaves',
    set: { pad: 0.5 },
    then: [breathe(1 / 6, 0.5)],
    ...cycled(12, [
      [0, 6.2, 48],
      [0, 6.2, 52],
      [0, 6.2, 55],
      [6.2, 5.8, 45],
      [6.2, 5.8, 52],
      [6.2, 5.8, 57],
      [6.2, 5.8, 60],
    ]),
  },
  {
    n: 39,
    id: 'there-and-back-am',
    name: 'There and back {A}m',
    kind: 'pad',
    description:
      'Chords of {A} minor and {F} swept up four octaves and down again, caught by a chorused echo; it comes round.',
    preset: 'park-zither-there-and-back',
    set: { strum: 45 },
    ...cycled(8, [
      [0, 2.5, 57],
      [0, 2.5, 60],
      [0, 2.5, 64],
      [4.1, 2.5, 53],
      [4.1, 2.5, 57],
      [4.1, 2.5, 60],
    ]),
  },
  // Textures: what the park adds to the tape: water, wind, birds, insects, weather and an amplifier's hum.
  {
    n: 40,
    id: 'five-note-breath-d',
    name: 'Five-note breath {D}',
    kind: 'texture',
    description:
      'Bands of noise tuned to {D}, {A} and their mirrors in a five-note scale, breathing every two seconds in a phaser.',
    preset: 'park-zither-five-note-breath',
    set: { resonance: 20 },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 10, outputGain: -4 } },
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.25, mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...looped(8, 4, 2, [62, 69]),
  },
  {
    n: 41,
    id: 'fountain-basin-loop',
    name: 'Fountain basin',
    kind: 'texture',
    description:
      'Water falling into a wide stone basin, turned once a loop by a slow phaser in a small room.',
    preset: 'park-zither-fountain-basin',
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Slow swirl',
        params: { centerHz: 2000, rate: 0.125, depth: 60, mix: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
      { deviceId: 'ambient-limiter', params: { ceiling: -9.5, gain: 4.5, release: 0.5 } },
    ],
    ...looped(8, 6, 2, [55]),
  },

  {
    n: 42,
    id: 'wind-in-plane-trees-loop',
    name: 'Wind in plane trees',
    kind: 'texture',
    description:
      'Gusts through the leaves of tall trees, swept once a loop by a slow flanger in a hall.',
    preset: 'park-zither-wind-in-plane-trees',
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Slow sweep',
        params: { rate: 0.0625, delayMs: 3, feedback: 45, mix: 0.4 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    ...looped(16, 6, 3, [50]),
  },

  {
    n: 43,
    id: 'sparrows-at-the-gate-loop',
    name: 'Sparrows at the gate',
    kind: 'texture',
    description:
      'A hedge full of small birds far off, all calling at once and running together in a wide open space.',
    preset: 'park-zither-sparrows-at-the-gate',
    set: { density: 1, distance: 0.9, tone: 0.4, movement: 1 },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { lowCut: 200 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { modRate: 0.375, width: 0.7, mix: 0.55 },
      },
    ],
    ...looped(8, 4, 2, [55, 60, 65, 69, 72, 76, 79, 84]),
  },

  {
    n: 44,
    id: 'sprinkler-on-the-lawn',
    name: 'Sprinkler on the lawn',
    kind: 'texture',
    description:
      'Fine drops falling close by, swept round four times a loop by a phaser like the arc of a sprinkler.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: { density: 0.7, tone: 0.7, size: 0.1, attack: 0.5, width: 0.6 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm six-stage',
        params: { centerHz: 2500, rate: 0.5, depth: 80, mix: 0.5 },
      },
      hall('Room', 0.2),
    ],
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 26, outputGain: -8 } }],
    ...looped(8, 3, 2, [60]),
  },

  {
    n: 45,
    id: 'frogs-at-the-boat-pond',
    name: 'Frogs at the boat pond',
    kind: 'texture',
    description:
      'A pond full of frogs after the boats are in: croaks and trills at a distance under a slow flanger.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Spring pond',
      params: { density: 1, distance: 0.7, attack: 1 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep', params: { rate: 0.0625, mix: 0.3 } },
      hall('Room', 0.2),
    ],
    ...looped(16, 3, 3, [45, 50, 57, 62, 67]),
  },

  {
    n: 46,
    id: 'crickets-by-the-path',
    name: 'Crickets by the path',
    kind: 'texture',
    description:
      'Crickets in the long grass after dark, far off, scattered by a grain cloud and turned by a slow phaser.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Evening field',
      params: { distance: 0.85, movement: 0.4, tone: 0.5, attack: 1 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 160, density: 12, scatter: 1, feedback: 0.3, mix: 0.7 },
      },
      {
        deviceId: 'phaser',
        preset: 'Slow swirl',
        params: { centerHz: 3000, rate: 0.125, mix: 0.3 },
      },
    ],
    ...looped(8, 6, 2, [41, 47, 52, 57, 62, 67, 72, 77]),
  },

  {
    n: 47,
    id: 'thunder-past-the-arch',
    name: 'Thunder past the arch',
    kind: 'texture',
    description: 'A storm a long way off, its rolls overlapping and hanging in a very large space.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { density: 1, tone: 0.6, movement: 0.4, width: 0.8 },
    },
    effects: [
      soften(8),
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 6, modRate: 0.25, width: 0.7, mix: 0.25 },
      },
    ],
    ...looped(16, 1, 3, [38, 45, 50, 55]),
  },

  {
    n: 48,
    id: 'stream-under-the-bridge',
    name: 'Stream under the bridge',
    kind: 'texture',
    description:
      'A small stream under a footbridge: bubbles and a soft rush off the stone, turned once a loop by a slow phaser.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Small stream',
      params: { density: 0.6, distance: 0.3, attack: 0.5, width: 0.8 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Slow swirl',
        params: { centerHz: 1800, rate: 0.125, depth: 60, mix: 0.35 },
      },
      hall('Room', 0.35),
    ],
    ...looped(8, 3, 2, [62]),
  },

  {
    n: 49,
    id: 'small-amp-left-on',
    name: 'Small amp left on',
    kind: 'texture',
    description:
      'A small amplifier left on beside the blanket: mains hum on a low {A} over the rumble of the air, with its spring behind.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: { attack: 0.5, width: 0.6, volume: -14 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -30, width: 0.7 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    ...looped(8, 3, 2, [45]),
  },

  {
    n: 50,
    id: 'dry-leaves-underfoot',
    name: 'Dry leaves underfoot',
    kind: 'texture',
    description:
      'Dry crackle with the low end taken out, like leaves turned over underfoot, combed once a loop by a flanger.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hearth',
      params: { density: 0.75, tone: 0.65, movement: 0.6, size: 0, attack: 0.5, width: 0.8 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin' },
      { deviceId: 'flanger', preset: 'Gentle sweep', params: { rate: 0.125, mix: 0.3 } },
      hall('Room', 0.25),
    ],
    ...looped(8, 3, 2, [60]),
  },

  {
    n: 51,
    id: 'wind-in-the-railings',
    name: 'Wind in the railings',
    kind: 'texture',
    description:
      'A breeze whistling through iron railings, its hollow note rising and falling under one turn of a flanger.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Whistling gap',
      params: { movement: 0.35, resonance: 0.3, size: 0.4, attack: 0.5, width: 0.6 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep', params: { rate: 0.0625, mix: 0.3 } },
      hall('Room', 0.3),
    ],
    ...looped(16, 6, 3, [57]),
  },

  // One-shots: one stroke, one strum, one tap, left to ring out.
  {
    n: 52,
    id: 'pan-in-the-swirl-d',
    name: 'Pan in the swirl {D}',
    kind: 'oneshot',
    description:
      'One long handpan note on {D}, a slow phaser moving through its overtones as it rings out in a hall.',
    preset: 'park-zither-pan-in-the-swirl',
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 20, outputGain: -6 } }],
    ...played(8, [[0, 2, 62]], 2),
  },
  {
    n: 53,
    id: 'low-steel-ding-e',
    name: 'Low steel ding {E}',
    kind: 'oneshot',
    description:
      'The centre note struck low on {E} with its thump of air, spread by a deep slow chorus into a large space.',
    preset: 'park-zither-low-steel-ding',
    ...played(10, [[0, 3, 52]], 3),
  },
  {
    n: 54,
    id: 'steel-tongue-echo-a',
    name: 'Steel tongue echo {A}',
    kind: 'oneshot',
    description:
      'One soft tap on a steel tongue drum on {A}, answered by itself played backwards, in a hall.',
    preset: 'park-zither-steel-tongue-echo',
    ...played(7, [[0, 2, 57]], 2),
  },
  {
    n: 55,
    id: 'long-afternoon-ring-g',
    name: 'Long afternoon ring {G}',
    kind: 'oneshot',
    description:
      'One harp string on {G} touched lightly at mid-string and ringing long, with a slow chorus and a blurred high halo.',
    preset: 'park-zither-long-afternoon-ring',
    ...played(7, [[0, 3, 67]], 2),
  },
  {
    n: 56,
    id: 'edge-struck-gong-d',
    name: 'Edge-struck gong {D}',
    kind: 'oneshot',
    description:
      'A gong on {D} struck hard near its edge so the high modes speak, left to ring in a very large space.',
    preset: 'park-zither-edge-struck-gong',
    set: { decay: 9 },
    effects: [
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 8, highCut: 8000, width: 0.7, mix: 0.3 },
      },
    ],
    ...played(9, [[0, 6, 50]], 3),
  },
  {
    n: 57,
    id: 'bowl-on-the-blanket-b',
    name: 'Bowl on the blanket {B}',
    kind: 'oneshot',
    description:
      'A bronze bowl on {B} tapped once with a padded stick, its slow beating spread wide on a long plate.',
    preset: 'park-zither-bowl-on-the-blanket',
    set: { detune: 0.4 },
    ...played(10, [[0, 5, 59]], 3),
  },
  {
    n: 58,
    id: 'glass-bell-swirl-c',
    name: 'Glass bell swirl {C}',
    kind: 'oneshot',
    description:
      'One bright FM glass bell on a high {C}, its ring carried round by a phaser into a hall.',
    preset: 'park-zither-glass-bell-swirl',
    set: { spread: 0.3, detune: 3 },
    ...played(6, [[0, 2, 72]], 1.5),
  },
  {
    n: 59,
    id: 'chapel-upright-c',
    name: 'Chapel upright {C}',
    kind: 'oneshot',
    description:
      'A low octave on {C} on a piano with hard bright hammers, open strings ringing in sympathy behind it in a hall.',
    preset: 'park-zither-chapel-upright',
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 14, outputGain: -4 } }],
    ...played(
      6,
      [
        [0.0, 3, 36, 0.8],
        [0.01, 3, 48, 0.7],
      ],
      1.5,
    ),
  },
  {
    n: 60,
    id: 'traded-twelve-string-d',
    name: 'Traded twelve-string {D}',
    kind: 'oneshot',
    description:
      'One strum of a twelve-string picked near the bridge on {D}, {A} and {E}, phased, with an amplifier spring behind it.',
    preset: 'park-zither-traded-twelve-string',
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 34, outputGain: -12 } }],
    ...played(
      6,
      [
        [0.01, 4, 50],
        [0.01, 4, 57],
        [0.01, 4, 62],
        [0.01, 4, 64],
        [0.01, 4, 69],
      ],
      1.5,
    ),
  },

  {
    n: 61,
    id: 'phaser-tines-em7',
    name: 'Phaser tines {E}m7',
    kind: 'oneshot',
    description:
      'A bell-toned electric piano chord on {E} minor seventh through a slow phaser, in a small plate.',
    preset: 'park-zither-tines-in-a-phaser',
    ...played(
      5,
      [
        [0.0, 3, 52, 0.75],
        [0.01, 3, 59, 0.65],
        [0.02, 3, 62, 0.65],
        [0.03, 3, 67, 0.7],
      ],
      1.5,
    ),
  },
  {
    n: 62,
    id: 'pocket-chimes-a',
    name: 'Pocket chimes {A}',
    kind: 'oneshot',
    description:
      'One small metal bar on a high {A} struck hard, doubled by a flanger, with echoes that hop a fifth and a fourth.',
    preset: 'park-zither-pocket-chimes',
    ...played(5, [[0, 1.5, 81]], 1.5),
  },

  {
    n: 63,
    id: 'afternoon-motor-cmaj7',
    name: 'Afternoon motor {C}maj7',
    kind: 'oneshot',
    description:
      'A vibraphone chord on {C} major seventh with the motor turning slowly, in a chorused echo and a hall.',
    preset: 'park-zither-afternoon-motor',
    ...played(
      8,
      [
        [0.0, 4, 60, 0.75],
        [0.012, 4, 64, 0.65],
        [0.024, 4, 67, 0.65],
        [0.036, 4, 71, 0.7],
      ],
      2,
    ),
  },
  {
    n: 64,
    id: 'sprinkler-arc-g',
    name: 'Sprinkler arc {G}',
    kind: 'oneshot',
    description:
      'One quick glissando up eight strings of the harp to a high {G}, turning through a phaser into a hall.',
    preset: 'park-zither-sprinkler-arc',
    set: { sweep: 0.12 },
    ...played(
      4,
      [
        [0, 2.5, 67, 0.5],
        [0, 2.5, 69, 0.5],
        [0, 2.5, 71, 0.55],
        [0, 2.5, 72, 0.55],
        [0, 2.5, 74, 0.6],
        [0, 2.5, 76, 0.65],
        [0, 2.5, 77, 0.7],
        [0, 2.5, 79, 0.9],
      ],
      1.5,
    ),
  },
  {
    n: 65,
    id: 'stoop-fingerstyle-f',
    name: 'Stoop fingerstyle {F}',
    kind: 'oneshot',
    description:
      'One steel string on {F} picked with a fingertip and let ring, doubled a few cents apart, with a short tape echo.',
    preset: 'park-zither-stoop-fingerstyle',
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 18, outputGain: -6 } }],
    ...played(7, [[0, 3, 53]], 2),
  },
  {
    n: 66,
    id: 'late-set-tines-g6',
    name: 'Late set tines {G}6',
    kind: 'oneshot',
    description:
      'A long-ringing electric piano chord on {G} sixth panning slowly, mellow, with a dark echo, on a cassette.',
    preset: 'park-zither-late-set-tines',
    ...played(
      8,
      [
        [0.0, 4, 55, 0.75],
        [0.012, 4, 62, 0.65],
        [0.024, 4, 64, 0.65],
        [0.036, 4, 71, 0.7],
      ],
      2,
    ),
  },
  {
    n: 67,
    id: 'knuckle-rap-d',
    name: 'Knuckle rap {D}',
    kind: 'oneshot',
    description:
      'A handpan rapped once hard with the knuckles on {D}, doubled, with one faint slap of echo and a spring.',
    preset: 'park-zither-knuckle-rhythm',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { mix: 0.3 } },
      {
        deviceId: 'analog-delay',
        preset: 'Slapback',
        params: { time: 190, feedback: 0.15, mix: 0.15 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    ...played(3, [[0, 1, 62]], 1),
  },
  {
    n: 68,
    id: 'park-bench-strum-g',
    name: 'Park bench strum {G}',
    kind: 'oneshot',
    description:
      'One picked {G} major chord on a zither through a phaser and a small battery amplifier, heard from a few steps away.',
    preset: 'park-zither-bench-strum',
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 18, outputGain: -6 } }],
    ...played(7, [[0, 3, 55]], 2),
  },
  {
    n: 69,
    id: 'home-dubbed-zither-dm',
    name: 'Home-dubbed zither {D}m',
    kind: 'oneshot',
    description:
      'One picked {D} minor chord on a zither as it sounds on a home-copied cassette: unsteady, hissy and close.',
    preset: 'park-zither-home-dubbed-zither',
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.6, mix: 0.3 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 420, mix: 0.25 } },
      {
        deviceId: 'patina',
        preset: 'Worn cassette',
        params: { drive: 0.85, wobble: 0.35, noise: 0.35 },
      },
    ],
    ...played(7, [[0, 3, 50]], 2),
  },
  {
    n: 70,
    id: 'folded-gate-pluck-g',
    name: 'Folded gate pluck {G}',
    kind: 'oneshot',
    description:
      'A wavefolded tone plucked on {G} through a gate that darkens as it fades, with an echo in a hall.',
    preset: 'park-zither-folded-gate-pluck',
    ...played(4.5, [[0, 1.5, 67]], 1),
  },
  {
    n: 71,
    id: 'pigeons-scattering-dm',
    name: 'Pigeons scattering {D}m',
    kind: 'oneshot',
    description:
      'A chord of {D} minor scattered in no order over a soft organ tone, in a twelve-stage phaser with a faint octave halo.',
    preset: 'park-zither-pigeons-scattering',
    set: { strum: 8, pad: 0.15 },
    ...played(
      6,
      [
        [0, 2, 62],
        [0, 2, 65],
        [0, 2, 69],
      ],
      1.5,
    ),
  },
  {
    n: 72,
    id: 'coins-in-the-case-c',
    name: 'Coins in the case {C}',
    kind: 'oneshot',
    description:
      'A quick downward strum of short bright strings on {C}, thrown back as a sparkle of rising octaves.',
    preset: 'park-zither-coins-in-the-case',
    effects: [
      {
        deviceId: 'cascade',
        preset: 'Sparkle bed',
        params: { time: 240, repeats: 4, interval: 0, mix: 0.2 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { breathDepth: 0, mix: 0.25 } },
    ],
    ...played(
      4,
      [
        [0, 1, 60],
        [0, 1, 64],
        [0, 1, 67],
      ],
      1,
    ),
  },
  {
    n: 73,
    id: 'button-chimes-e',
    name: 'Button chimes {E}',
    kind: 'oneshot',
    description:
      'One bright electronic pluck on a high {E}, doubled by a flanger and repeated by three tape heads.',
    preset: 'park-zither-button-chimes',
    ...played(4.5, [[0, 1.5, 76]], 1),
  },
  {
    n: 74,
    id: 'woody-strings-a',
    name: 'Woody strings {A}',
    kind: 'oneshot',
    description:
      'The first strings of two drone lutes plucked once together, {E} and the {A} above it, in a chorus and a dark echo.',
    preset: 'park-zither-woody-quick-drone',
    set: { speed: 12 },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 18, outputGain: -6 } },
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } },
      {
        deviceId: 'analog-delay',
        preset: 'Murky',
        params: { time: 750, feedback: 0.45, mix: 0.3 },
      },
    ],
    ...played(
      6,
      [
        [0, 2.8, 57],
        [0, 2.8, 62],
      ],
      1.5,
    ),
  },
  // Phrases: a few notes in free time; half of them come round.
  {
    n: 75,
    id: 'chopstick-hammers-d',
    name: 'Chopstick hammers {D}',
    kind: 'melodic',
    description:
      'Hammers on strings doubled at the octave step out from {D} and back and end on a roll, phased, echoed; it rings out.',
    preset: 'park-zither-chopstick-hammers',
    ...played(
      8,
      [
        [0, 0.12, 62, 0.8],
        [0.41, 0.12, 69, 0.6],
        [0.83, 0.12, 65, 0.65],
        [1.52, 0.12, 67, 0.6],
        [1.9, 0.12, 64, 0.55],
        [2.71, 0.12, 60, 0.6],
        [3.3, 0.9, 62, 0.75],
      ],
      1.5,
    ),
  },

  {
    n: 76,
    id: 'skipping-hammers-g',
    name: 'Skipping hammers {G}',
    kind: 'melodic',
    description:
      'Single felted strings on {G} skipping across three tape heads through a slow phaser; it comes round.',
    preset: 'park-zither-skipping-hammers',
    ...cycled(8, [
      [0, 0.5, 67, 0.75],
      [0.9, 0.5, 74, 0.55],
      [2.2, 0.5, 72, 0.6],
      [3.05, 0.5, 69, 0.55],
      [4.6, 0.5, 71, 0.65],
      [5.9, 0.5, 62, 0.5],
    ]),
  },

  {
    n: 77,
    id: 'marigold-arpeggio-c',
    name: 'Marigold arpeggio {C}',
    kind: 'melodic',
    description:
      'Three suspended arpeggios on {C}, {G} and {F} picked slowly upward, in a wide flanger under stone; it comes round.',
    preset: 'park-zither-marigold-arpeggio',
    set: { roll: 0, direction: 0 },
    effects: [
      { deviceId: 'flanger', preset: 'Wide wash', params: { rate: 0.125, mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 5500, mix: 0.35 } },
    ],
    ...cycled(
      8,
      [
        [0, 2.6, 48, 0.7],
        [2.9, 2.4, 55, 0.6],
        [5.6, 2, 53, 0.65],
      ],
      { passes: 2 },
    ),
  },

  {
    n: 78,
    id: 'marimba-footsteps-am',
    name: 'Marimba footsteps {A}m',
    kind: 'melodic',
    description:
      'A soft marimba walks up {A} minor and back down, a dark echo a step behind it; it rings out.',
    preset: 'park-zither-marimba-footsteps',
    ...played(
      7,
      [
        [0, 0.3, 45, 0.75],
        [0.52, 0.3, 52, 0.6],
        [1.02, 0.3, 57, 0.65],
        [1.86, 0.3, 60, 0.6],
        [2.31, 0.3, 59, 0.5],
        [3.4, 0.3, 55, 0.6],
        [3.93, 0.3, 52, 0.55],
        [4.9, 0.4, 45, 0.7],
      ],
      1,
    ),
  },

  {
    n: 79,
    id: 'hopscotch-bars-em',
    name: 'Hopscotch bars {E}m',
    kind: 'melodic',
    description:
      'Dry xylophone bars in {E} minor, each thrown upward in steps of fifths and octaves, in a gated room; it comes round.',
    preset: 'park-zither-hopscotch-bars',
    then: [soften(9)],
    ...cycled(8, [
      [0, 0.2, 64, 0.75],
      [0.36, 0.2, 67, 0.55],
      [1.3, 0.2, 69, 0.65],
      [2.45, 0.2, 72, 0.6],
      [2.8, 0.2, 69, 0.5],
      [4.1, 0.2, 62, 0.65],
      [4.52, 0.2, 64, 0.55],
      [5.9, 0.2, 60, 0.6],
    ]),
  },

  {
    n: 80,
    id: 'thumb-piano-swirl-f',
    name: 'Thumb piano swirl {F}',
    kind: 'melodic',
    description:
      'A thumb piano picking through {F} major inside a phaser, with a dark echo behind every tine; it comes round.',
    preset: 'park-zither-thumb-piano-swirl',
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.5, mix: 0.5 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 330, feedback: 0.3, tone: 4200, mix: 0.2 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    ...cycled(8, [
      [0, 0.4, 65, 0.75],
      [0.58, 0.4, 69, 0.5],
      [1.47, 0.4, 72, 0.6],
      [2.79, 0.4, 67, 0.55],
      [3.12, 0.4, 65, 0.5],
      [4.63, 0.4, 74, 0.65],
      [5.84, 0.4, 72, 0.5],
    ]),
  },

  {
    n: 81,
    id: 'tines-and-sparks-dm',
    name: 'Tines and sparks {D}m',
    kind: 'melodic',
    description:
      'Hard bright tines in {D} minor, each one struck again by its own repeats on a small plate; it rings out.',
    preset: 'park-zither-tines-and-sparks',
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 34, outputGain: -12 } }],
    ...played(
      8,
      [
        [0, 0.4, 62, 0.7],
        [1.15, 0.4, 69, 0.6],
        [1.75, 0.4, 65, 0.55],
        [3.0, 0.4, 72, 0.65],
        [3.7, 0.4, 69, 0.5],
        [4.9, 0.6, 62, 0.6],
      ],
      1.5,
    ),
  },

  {
    n: 82,
    id: 'electric-thumb-piano-g',
    name: 'Electric thumb piano {G}',
    kind: 'melodic',
    description:
      'Soft electric tines around {G}, chorused and passed across three tape heads; it comes round.',
    preset: 'park-zither-electric-thumb-piano',
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.625, mix: 0.35 } },
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 360, feedback: 0.45, highCut: 5000, mix: 0.35 },
      },
    ],
    ...cycled(8, [
      [0, 0.5, 55, 0.7],
      [0.6, 0.5, 62, 0.55],
      [1.5, 0.5, 64, 0.6],
      [2.6, 0.5, 59, 0.6],
      [3.5, 0.5, 57, 0.5],
      [4.8, 0.5, 62, 0.65],
      [5.3, 0.5, 67, 0.55],
      [6.6, 0.5, 64, 0.5],
    ]),
  },

  {
    n: 83,
    id: 'palm-on-the-strings-em',
    name: 'Palm on the strings {E}m',
    kind: 'melodic',
    description:
      'Strings damped with the palm, short dry plucks in {E} minor through a quick phaser and a slap echo; it rings out.',
    preset: 'park-zither-palm-on-the-strings',
    ...played(
      6,
      [
        [0, 0.2, 52, 0.75],
        [0.33, 0.2, 59, 0.55],
        [0.71, 0.2, 64, 0.6],
        [1.4, 0.2, 62, 0.55],
        [1.77, 0.2, 59, 0.5],
        [2.6, 0.2, 55, 0.6],
        [2.95, 0.2, 57, 0.55],
        [3.8, 0.3, 52, 0.7],
      ],
      1,
    ),
  },

  {
    n: 84,
    id: 'one-string-echo-am',
    name: 'One string echo {A}m',
    kind: 'melodic',
    description:
      'One plucked string wandering through {A} minor, repeated by one tape head in a small room; it comes round.',
    preset: 'park-zither-one-string-echo',
    effects: [
      {
        deviceId: 'tape-echo',
        params: { time: 330, heads: 1, feedback: 0.35, highCut: 5500, spread: 0.6, mix: 0.25 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    ...cycled(8, [
      [0, 1, 57, 0.7],
      [1.3, 1, 64, 0.6],
      [2.1, 1, 60, 0.55],
      [3.6, 1, 62, 0.6],
      [4.9, 1.5, 55, 0.6],
      [6.4, 1, 59, 0.5],
    ]),
  },

  {
    n: 85,
    id: 'pipes-in-a-round-dm',
    name: 'Pipes in a round {D}m',
    kind: 'melodic',
    description:
      'Breathy pan pipes falling an octave from a high {D}, phased and chased by a chorused echo; it rings out.',
    preset: 'park-zither-pipes-in-a-round',
    ...played(
      8,
      [
        [0, 0.5, 74, 0.7],
        [0.8, 0.35, 72, 0.5],
        [1.3, 0.7, 69, 0.6],
        [2.6, 0.4, 65, 0.55],
        [3.1, 0.9, 67, 0.65],
        [4.4, 0.9, 62, 0.6],
      ],
      1.5,
    ),
  },

  {
    n: 86,
    id: 'rain-on-the-arch-g',
    name: 'Rain on the arch {G}',
    kind: 'melodic',
    description:
      'Fingertips tapping a steel pan around {G}, hollowed by a flanger, with tape repeats; it comes round.',
    preset: 'park-zither-rain-on-the-arch',
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow', params: { rate: 0.25, mix: 0.35 } },
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 300, feedback: 0.6, mix: 0.55 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 12, outputGain: -3 } }],
    ...cycled(8, [
      [0, 0.3, 55, 0.75],
      [0.45, 0.3, 62, 0.5],
      [1.35, 0.3, 67, 0.6],
      [1.9, 0.3, 65, 0.5],
      [3.2, 0.3, 62, 0.6],
      [4.3, 0.3, 60, 0.55],
      [4.7, 0.3, 55, 0.65],
      [6.1, 0.3, 59, 0.5],
    ]),
  },

  {
    n: 87,
    id: 'noon-haze-c',
    name: 'Noon haze {C}',
    kind: 'melodic',
    description:
      'Double courses strummed slowly on {C} and then {A}, turned by a phaser in a very large space; it comes round.',
    preset: 'park-zither-noon-haze',
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Slow swirl',
        params: { centerHz: 1500, rate: 0.0833, mix: 0.45 },
      },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { highCut: 9000, modRate: 0.25, mix: 0.35 },
      },
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...cycled(12, [
      [0, 3, 48, 0.7],
      [0.02, 3, 55, 0.6],
      [2.2, 2.5, 64, 0.6],
      [4.6, 3, 57, 0.6],
      [4.63, 3, 64, 0.5],
      [7.1, 2.5, 60, 0.6],
      [9.2, 2.5, 67, 0.55],
    ]),
  },

  {
    n: 88,
    id: 'sine-chimes-g',
    name: 'Sine chimes {G}',
    kind: 'melodic',
    description:
      'Sine chimes a twelfth apart struck on {G}, {D}, {A} and {E}, each repeat climbing an octave; it rings out.',
    preset: 'park-zither-sine-chimes',
    ...played(
      8,
      [
        [0, 1.5, 67, 0.7],
        [1.7, 1.5, 62, 0.6],
        [3.2, 1.5, 69, 0.6],
        [4.4, 1.2, 64, 0.5],
      ],
      2,
    ),
  },

  {
    n: 89,
    id: 'gourd-resonator-c',
    name: 'Gourd resonator {C}',
    kind: 'melodic',
    description:
      'Soft thumb piano tines climbing from {C} and back over a faint loop of themselves in a hall; it rings out.',
    preset: 'park-zither-gourd-resonator',
    ...played(
      8,
      [
        [0, 1, 60, 0.7],
        [0.9, 1, 64, 0.55],
        [1.6, 1, 67, 0.6],
        [2.8, 1, 69, 0.6],
        [3.5, 1, 64, 0.5],
        [4.6, 1.5, 60, 0.6],
      ],
      1.5,
    ),
  },

  {
    n: 90,
    id: 'park-railings-b',
    name: 'Park railings {B}',
    kind: 'melodic',
    description:
      'Three short rattles down a glockenspiel from a high {B}, like a stick along railings, flanged; it rings out.',
    preset: 'park-zither-park-railings',
    ...played(
      8,
      [
        [0, 0.42, 83, 0.7],
        [1.55, 0.3, 79, 0.6],
        [2.85, 0.5, 76, 0.65],
      ],
      2,
    ),
  },

  {
    n: 91,
    id: 'bridge-pluck-dm',
    name: 'Bridge pluck {D}m',
    kind: 'melodic',
    description:
      'A thin silk string plucked by the bridge through {D} minor, clipped, jet-flanged, with tape repeats; it comes round.',
    preset: 'park-zither-bridge-pluck',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 11, outputDb: -8 } },
      { deviceId: 'flanger', preset: 'Classic jet', params: { rate: 0.125, mix: 0.4 } },
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 340, feedback: 0.35, mix: 0.35 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    ...cycled(8, [
      [0, 1, 62, 0.7],
      [1.2, 1, 69, 0.55],
      [2.0, 1, 65, 0.6],
      [3.7, 1, 64, 0.6],
      [4.5, 1, 60, 0.5],
      [6.0, 1, 57, 0.6],
    ]),
  },

  {
    n: 92,
    id: 'electric-twelve-am',
    name: 'Electric twelve {A}m',
    kind: 'melodic',
    description:
      'A bright electric twelve-string strums {A} minor, then {F}, phased, with a chorused echo and a spring; it comes round.',
    preset: 'park-zither-electric-twelve-swirl',
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm six-stage',
        params: { rate: 0.375, centerHz: 1100, mix: 0.5 },
      },
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 350, mix: 0.25 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 20, outputGain: -6 } }],
    ...cycled(8, [
      [0, 3.5, 45],
      [0, 3.5, 52],
      [0, 3.5, 57],
      [0, 3.5, 60],
      [0, 3.5, 64],
      [3.9, 3.5, 48],
      [3.9, 3.5, 53],
      [3.9, 3.5, 57],
      [3.9, 3.5, 60],
      [3.9, 3.5, 65],
      [6.4, 1.2, 67, 0.5],
    ]),
  },

  {
    n: 93,
    id: 'piano-in-the-pedals-e',
    name: 'Piano in the pedals {E}',
    kind: 'melodic',
    description:
      'A soft felt piano, slow notes over {E} and then over {C}, through a slow phaser and a chorused echo; it comes round.',
    preset: 'park-zither-piano-in-the-pedals',
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.1667, mix: 0.5 } },
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 400, mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
    ...cycled(12, [
      [0, 5, 52, 0.55],
      [0.06, 5, 59, 0.45],
      [1.5, 3, 67, 0.9],
      [2.4, 3, 64, 0.85],
      [3.6, 2.5, 71, 0.9],
      [6.1, 5, 48, 0.55],
      [6.17, 5, 55, 0.45],
      [7.5, 3, 64, 0.9],
      [8.4, 3, 62, 0.8],
      [9.9, 2, 67, 0.85],
    ]),
  },

  {
    n: 94,
    id: 'brushed-open-tuning-c',
    name: 'Brushed open tuning {C}',
    kind: 'melodic',
    description:
      'A hand brushed slowly across added-ninth tunings on {C}, {F} and {G}, flanged, with a tape echo; it comes round.',
    preset: 'park-zither-brushed-open-tuning',
    effects: [
      { deviceId: 'flanger', preset: 'Gentle sweep', params: { rate: 0.125, mix: 0.4 } },
      {
        deviceId: 'tape-echo',
        params: { time: 460, feedback: 0.4, highCut: 5200, mix: 0.25 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...cycled(
      8,
      [
        [0, 2.4, 48, 0.7],
        [2.7, 2.4, 53, 0.6],
        [5.3, 2.2, 55, 0.65],
      ],
      { passes: 2 },
    ),
  },

  {
    n: 95,
    id: 'one-glad-voice-am',
    name: 'One glad voice {A}m',
    kind: 'melodic',
    description:
      'An open-throated singer rises from {A} to a long {E} and comes back down, answered by a tape echo; it rings out.',
    preset: 'park-zither-one-glad-voice',
    ...played(
      8,
      [
        [0, 0.9, 69, 0.6],
        [1.1, 0.4, 72, 0.5],
        [1.6, 1.3, 76, 0.9],
        [3.2, 0.4, 74, 0.5],
        [3.7, 0.5, 72, 0.5],
        [4.4, 1.2, 69, 0.6],
      ],
      1.2,
    ),
  },

  {
    n: 96,
    id: 'wood-flute-far-bench-e',
    name: 'Wood flute, far bench {E}',
    kind: 'melodic',
    description:
      'A wooden flute scoops up to {E}, {G} and a long {A} and falls back, with a tape echo across a very large space.',
    preset: 'park-zither-wood-flute-far-bench',
    ...played(
      10,
      [
        [0, 1.2, 76, 0.6],
        [1.5, 0.5, 79, 0.5],
        [2.2, 1.4, 81, 0.85],
        [4.0, 1.3, 76, 0.55],
      ],
      2.5,
    ),
  },

  {
    n: 97,
    id: 'pawn-shop-harp-g',
    name: 'Pawn shop harp {G}',
    kind: 'melodic',
    description:
      'Three bright strums, {G}, {C} and {E} minor, with no pad under them, phased and left in an amplifier spring.',
    preset: 'park-zither-pawn-shop-harp',
    ...played(
      8,
      [
        [0, 1.5, 55],
        [0, 1.5, 59],
        [0, 1.5, 62],
        [2.3, 1.5, 60],
        [2.3, 1.5, 64],
        [2.3, 1.5, 67],
        [4.4, 1.8, 52],
        [4.4, 1.8, 55],
        [4.4, 1.8, 59],
      ],
      1.5,
    ),
  },

  {
    n: 98,
    id: 'kite-strings-c',
    name: 'Kite strings {C}',
    kind: 'melodic',
    description:
      'Bright steel strings picked down from a high {C}, the echoes jumping an octave on every other repeat; it comes round.',
    preset: 'park-zither-kite-strings',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Octave hop',
        params: { time: 333.33, feedback: 0.5, mix: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { breathDepth: 0, mix: 0.3 } },
    ],
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 30, outputGain: -12 } }],
    ...cycled(8, [
      [0, 1.5, 72, 0.7],
      [1.4, 1.5, 67, 0.55],
      [2.9, 1.5, 69, 0.6],
      [4.8, 1.5, 64, 0.6],
      [6.2, 1.2, 62, 0.5],
    ]),
  },

  {
    n: 99,
    id: 'slide-bar-g',
    name: 'Slide bar {G}',
    kind: 'melodic',
    description:
      'A hard-picked steel string slid under a bar from {G} up to {A} and back, then from {C} to {D}, phased, in a long spring.',
    preset: 'park-zither-slide-bar',
    ...played(
      8,
      [
        [0, 2.3, 55, 0.7],
        [0.85, 1.0, 57, 0.6],
        [2.55, 1.9, 60, 0.65],
        [3.3, 0.7, 62, 0.6],
        [4.7, 1.6, 55, 0.7],
      ],
      1.5,
    ),
  },
  {
    n: 100,
    id: 'celesta-on-the-stairs-e',
    name: 'Celesta on the stairs {E}',
    kind: 'melodic',
    description:
      'A celesta with the dampers off climbing from {E} in uneven steps, chorused, with a quiet tape echo; it rings out.',
    preset: 'park-zither-celesta-on-the-stairs',
    ...played(
      6,
      [
        [0, 0.6, 64, 0.6],
        [0.45, 0.6, 67, 0.55],
        [0.95, 0.6, 71, 0.6],
        [1.6, 0.6, 72, 0.6],
        [2.05, 0.6, 76, 0.7],
        [3.0, 1.2, 79, 0.6],
      ],
      1.5,
    ),
  },
])
