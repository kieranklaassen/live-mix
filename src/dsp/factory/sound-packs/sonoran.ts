// The sounds of the pack "Sonoran Night Air": its presets played, a hundred sounds to
// paint with. Numbers 12001 to 12100.

import { PRESETS } from '../packs/sonoran'
import { type FactorySound } from '../types'
import { breathe, cycled, looped, packSounds, played, quarterTurn } from './recipe'

// Brings the two sides nearer each other where a reverb or a chorus leaves more side than mid.
const narrow = { deviceId: 'stereo-widener', params: { width: 0.3 } }

// A slow turn from side to side, once every 8 s so it comes round with the loop. A still tone
// in the dead centre fills the meter; turned a little off centre and back it sits with the rest.
const sway = (depth: number) => ({
  deviceId: 'tremolo',
  params: { mode: 1, rate: 0.125, depth, shape: 0, phase: 0, drift: 0, smooth: 0.5 },
})

// A fast hand on the level after everything else: a drone whose own movement would let it
// sink a few decibels in one key and not in the next stays level in all of them.
const pin = {
  deviceId: 'ambient-limiter',
  params: { ceiling: -12, gain: 24, release: 0.3, ride: 0 },
}

// The limiter leans on one side of a wave that is not even, and leaves it off centre: a low
// cut under every note of the pack puts it back.
const held = [pin, { deviceId: 'ambient-eq', params: { lowCut: 25, clear: 0 } }]

// A slow hand on the level after everything else: a drone whose partials wander by a few
// decibels is held where it is, in every key.
const steady = (attack = 60, release = 0.4) => ({
  deviceId: 'ambient-comp',
  params: {
    threshold: -50,
    ratio: 8,
    attack,
    release,
    knee: 6,
    tails: 1,
    scLowCut: 20,
    makeup: 12,
  },
})

export const SOUNDS: readonly FactorySound[] = packSounds('sonoran', 12000, PRESETS, [
  {
    n: 1,
    id: 'ground-at-dusk-a',
    name: 'Ground at dusk {A}',
    kind: 'drone',
    description:
      'A square wave on a low {A} over its sub octave, nearly shut and pushed into tape.',
    preset: 'sonoran-ground-at-dusk',
    then: [quarterTurn(8)],
    ...looped(8, 5, 2, [45]),
    tuning: 'whole-cycles',
  },
  {
    n: 2,
    id: 'low-bow-drone-c',
    name: 'Low bow drone {C}',
    kind: 'drone',
    description:
      'Two bowed strings on {C} and {G} under heavy pressure with a wooden body, held still in a cathedral.',
    preset: 'sonoran-low-bow-drone',
    set: { vibrato: 0 },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } }],
    then: [quarterTurn(8)],
    ...looped(8, 5, 2, [48, [55, 0.8]]),
    tuning: 'whole-cycles',
  },
  {
    n: 3,
    id: 'bajada-drone-d',
    name: 'Bajada drone {D}',
    kind: 'drone',
    description:
      'A saw on {D} over a faint pulse an octave down and a sub, nearly closed, swaying slowly in a cathedral.',
    preset: 'sonoran-bajada-drone',
    // The filter follows the key and the pulse is turned down: with the filter fixed the higher
    // keys were one bare partial, 2 LU over the others and over what a drone may be.
    set: {
      lfo1Rate: 0.125,
      lfo1Amount: 0,
      lfo2Rate: 0.125,
      unisonVoices: 1,
      keyTrack: 1,
      cutoff: 880,
      oscMix: 0.2,
    },
    then: [sway(0.45), quarterTurn(8)],
    ...looped(8, 6, 3, [50]),
    tuning: 'whole-cycles',
  },
  {
    n: 4,
    id: 'power-line-hum-e',
    name: 'Power line hum {E}',
    kind: 'drone',
    description: 'Buzzing fifths on {E} and {B}, nearly still, combed by a slow flanger in a hall.',
    preset: 'sonoran-power-line-hum',
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Slow sweep',
        params: { rate: 0.125, depth: 50, feedback: 0, mix: 0.2 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3, decay: 8, breathRate: 0.25 } },
    ],
    then: [steady()],
    ...looped(8, 5, 2, [52]),
  },
  {
    n: 5,
    id: 'zenith-glow-c',
    name: 'Zenith glow {C}',
    kind: 'drone',
    description: 'A just {C} major chord of soft tones with air round it, its reverb an octave up.',
    preset: 'sonoran-zenith-glow',
    set: { movement: 0.25 },
    then: held,
    ...looped(8, 7, 3, [60]),
  },
  {
    n: 6,
    id: 'ground-sub-a',
    name: 'Ground sub {A}',
    kind: 'drone',
    description: 'A sub tone on a low {A} with almost nothing above it, warmed by a tape preamp.',
    preset: 'sonoran-ground-sub',
    set: { beat: 0, sub: 0.6 },
    then: [quarterTurn(8)],
    ...looped(8, 3, 2, [45]),
    tuning: 'whole-cycles',
  },
  {
    n: 7,
    id: 'still-ground-tone-a',
    name: 'Still ground tone {A}',
    kind: 'drone',
    description: 'Near sines on {A} and {E} over their subs and no motion at all, on clean tape.',
    preset: 'sonoran-still-ground-tone',
    set: { detune: 0 },
    then: [quarterTurn(8)],
    ...looped(8, 5, 2, [45, [52, 0.7]]),
    tuning: 'whole-cycles',
  },
  {
    n: 8,
    id: 'slow-folding-drone-f',
    name: 'Slow folding drone {F}',
    kind: 'drone',
    description:
      'A tone on {F} folding over itself more and less, in a deep phaser and a huge room.',
    preset: 'sonoran-slow-folding-drone',
    set: { drift: 0.3 },
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.125, mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, width: 0.6 } },
    ],
    then: held,
    ...looped(8, 6, 3, [41, 53]),
  },
  {
    n: 9,
    id: 'distant-pipes-drift-g',
    name: 'Distant pipes {G}',
    kind: 'drone',
    description: 'Dull pipes on {G} and {D} through a slowly turning speaker across a huge space.',
    preset: 'sonoran-distant-pipes-drift',
    set: { celeste: 0, bellows: 0.1 },
    then: [narrow, ...held],
    ...looped(8, 6, 3, [43, 50]),
  },
  {
    n: 10,
    id: 'moonset-reeds-e',
    name: 'Moonset reeds {E}',
    kind: 'drone',
    description:
      'Two clarinets holding {E} and {B} in their middle register, breathy and plain, swaying slowly in a hall.',
    preset: 'sonoran-moonset-reed',
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.4 } }],
    then: [sway(0.4), quarterTurn(8)],
    ...looped(8, 6, 3, [64, [71, 0.8]]),
    tuning: 'whole-cycles',
  },
  {
    n: 11,
    id: 'sleepers-breath-f',
    name: "Sleeper's breath {F}",
    kind: 'pad',
    description:
      'A brass and string chord on {F} major, its filter opening and closing once every 8 s.',
    preset: 'sonoran-sleepers-breath',
    effects: [
      {
        deviceId: 'auto-filter',
        params: { slope: 1, cutoffHz: 1100, resonance: 1, lfoAmount: 40, lfoRateHz: 0.125 },
      },
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.125, mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45, size: 0.8, decay: 14 } },
    ],
    then: [breathe(0.125, 0.4)],
    ...looped(8, 6, 3, [53, 60, 65, [69, 0.8], [72, 0.6]]),
  },
  {
    n: 12,
    id: 'rimrock-strings-dsus2',
    name: 'Rimrock strings {D}sus2',
    kind: 'pad',
    description:
      'Two string layers on {D}, {A} and {E} in an ensemble chorus, swelling once every 16 s.',
    preset: 'sonoran-rimrock-strings',
    then: [breathe(0.0625, 0.45)],
    ...looped(16, 5, 3, [50, 57, [64, 0.8]]),
  },
  {
    n: 13,
    id: 'far-ridge-horns-fsus2',
    name: 'Far ridge horns {F}sus2',
    kind: 'pad',
    description:
      'Muted synth horns on {F}, {C} and {G} on clean tape, rising and sinking far back in a hall.',
    preset: 'sonoran-far-ridge-horns',
    then: [narrow, breathe(0.125, 0.55)],
    ...looped(8, 6, 3, [53, 60, [67, 0.8]]),
  },
  {
    n: 14,
    id: 'starfield-voices-em',
    name: 'Starfield voices {E}m',
    kind: 'pad',
    description:
      'A half-sung resonant band on {E} minor, swelling once every 16 s in a hall that sings back.',
    preset: 'sonoran-starfield-voices',
    then: [breathe(0.0625, 0.55)],
    ...looped(16, 6, 3, [52, 59, [64, 0.8], [67, 0.7], [71, 0.6]]),
  },
  {
    n: 15,
    id: 'first-light-iron-a',
    name: 'First light iron {A}',
    kind: 'pad',
    description:
      'A chord on {A} that opens with a falling metal ring and melts into dark echoes; it comes round.',
    preset: 'sonoran-first-light-iron',
    ...cycled(12, [
      [0, 6, 45, 0.9],
      [0.02, 6, 57, 0.8],
      [0.05, 6, 64, 0.7],
      [0.07, 6, 71, 0.6],
    ]),
  },
  {
    n: 16,
    id: 'far-headlights-e',
    name: 'Far headlights {E}',
    kind: 'pad',
    description:
      'A brass voice on low {E} and {B}, turning in a slow phaser and a long plate, rising and sinking.',
    preset: 'sonoran-far-headlights',
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, stereo: 60, mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    then: [narrow, breathe(0.125, 0.55)],
    ...looped(8, 5, 3, [40, 47, [52, 0.8]]),
  },
  {
    n: 17,
    id: 'blue-hour-pad-f',
    name: 'Blue hour pad {F}',
    kind: 'pad',
    description:
      'Saw and moving pulse on {F} and {C}, the filter drifting open and shut every 8 s in a large room.',
    preset: 'sonoran-blue-hour-pad',
    effects: [
      {
        deviceId: 'auto-filter',
        params: { cutoffHz: 1600, resonance: 0.9, lfoAmount: 45, lfoRateHz: 0.125 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, decay: 16 } },
    ],
    then: [breathe(0.125, 0.5)],
    ...looped(8, 6, 3, [53, 60, [65, 0.8]]),
  },
  {
    n: 18,
    id: 'arroyo-pulse-asus2',
    name: 'Arroyo pulse {A}sus2',
    kind: 'pad',
    description:
      'A thin moving pulse on {A}, {E} and {B}, clouded by twelve phaser stages in a cathedral.',
    preset: 'sonoran-arroyo-pulse',
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { rate: 0.125, mix: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    then: [breathe(0.125, 0.55)],
    ...looped(8, 5, 3, [57, 64, [69, 0.8], [71, 0.7]]),
  },
  {
    n: 19,
    id: 'warm-adobe-pad-c',
    name: 'Warm adobe pad {C}',
    kind: 'pad',
    description: 'Detuned saws and a sub on {C} major, the filter rising and falling every 8 s.',
    preset: 'sonoran-warm-adobe-pad',
    set: { lfo1Rate: 0.125 },
    then: [narrow, breathe(0.125, 0.5)],
    ...looped(8, 6, 3, [48, 55, [60, 0.8], [64, 0.5]]),
  },
  {
    n: 20,
    id: 'thin-high-air-e',
    name: 'Thin high air {E}',
    kind: 'pad',
    description:
      'Saws on {E} and {B} with a breath of noise, widened a few cents, swelling every 16 s.',
    preset: 'sonoran-thin-high-air',
    set: { lfo1Rate: 0.125, lfo2Rate: 0.25, unisonVoices: 1 },
    then: [breathe(0.0625, 0.6)],
    ...looped(16, 6, 3, [64, 71, [76, 0.7]]),
  },
  {
    n: 21,
    id: 'basin-floor-g',
    name: 'Basin floor {G}',
    kind: 'pad',
    description:
      'A low {G} in stacked octaves over a heavy sub, rising and sinking in a minute-long space.',
    preset: 'sonoran-basin-floor',
    then: [breathe(0.125, 0.55)],
    ...looped(8, 7, 3, [43]),
  },
  {
    n: 22,
    id: 'overtone-hum-g',
    name: 'Overtone hum {G}',
    kind: 'pad',
    description: 'A buzzing harmonic series on {G}, sung back by a hall of moving vowels.',
    preset: 'sonoran-overtone-hum',
    then: [breathe(0.125, 0.55)],
    ...looped(8, 5, 3, [55]),
  },
  {
    n: 23,
    id: 'pedal-under-stars-c',
    name: 'Pedal under stars {C}',
    kind: 'pad',
    description:
      'Two saws beating slowly on a low {C} over a sub, rising and sinking in a huge room.',
    preset: 'sonoran-pedal-under-stars',
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.125, spread: 20, mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35, lowCut: 40 } },
    ],
    then: [narrow, breathe(0.125, 0.7)],
    ...looped(8, 5, 3, [48]),
  },
  {
    n: 24,
    id: 'dry-wash-cellos-g',
    name: 'Dry wash cellos {G}',
    kind: 'pad',
    description:
      'The low octave of a string ensemble on {G} and {D}, on tape, let into the reverb in slow waves.',
    preset: 'sonoran-dry-wash-cellos',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4, breathRate: 0.125 } },
    ],
    then: [breathe(0.125, 0.55)],
    ...looped(8, 6, 3, [43, 50, [55, 0.8]]),
  },
  {
    n: 25,
    id: 'jet-trail-g',
    name: 'Jet trail {G}',
    kind: 'pad',
    description:
      'Bare sawtooth octaves on {G} swept by one slow flanger, coming and going once every 16 s.',
    preset: 'sonoran-jet-trail',
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep', params: { rate: 0.0625 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    then: [narrow, breathe(0.0625, 0.55), quarterTurn(16)],
    ...looped(16, 4, 3, [43, [55, 0.7]]),
    tuning: 'whole-cycles',
  },
  {
    n: 26,
    id: 'strings-below-ground-c',
    name: 'Strings below ground {C}',
    kind: 'pad',
    description:
      'Upper strings on {C} major with their own copy an octave down at half speed, breathing slowly.',
    preset: 'sonoran-strings-below-ground',
    then: [narrow, breathe(0.125, 0.55)],
    ...looped(8, 6, 3, [48, 55, [60, 0.8], [64, 0.7]]),
  },
  {
    n: 27,
    id: 'starlight-glass-dsus2',
    name: 'Starlight glass {D}sus2',
    kind: 'pad',
    description:
      'A glassy wavetable on {D}, {A} and {E}, drifting through its shapes once every 8 s in a huge room.',
    preset: 'sonoran-starlight-glass',
    set: { rate: 0.125 },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.125, spread: 50, mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, width: 0.8 } },
    ],
    then: [breathe(0.125, 0.55)],
    ...looped(8, 6, 3, [62, 69, [76, 0.8]]),
  },
  {
    n: 28,
    id: 'slot-canyon-air-d',
    name: 'Slot canyon air {D}',
    kind: 'pad',
    description:
      'A hollow table on {D} and {A} under a low filter, rising and sinking in a cave of dull echoes.',
    preset: 'sonoran-slot-canyon-air',
    set: { rate: 0.125 },
    then: [breathe(0.125, 0.55)],
    ...looped(8, 6, 3, [50, 57, [62, 0.8]]),
  },
  {
    n: 29,
    id: 'satellite-pass-c',
    name: 'Satellite pass {C}',
    kind: 'pad',
    description:
      'A spectral table on {C} in octaves crossing from dull to bright and back once every 16 s.',
    preset: 'sonoran-satellite-pass',
    set: { rate: 0.0625 },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Slow drift',
        params: { fine: 0.375, width: 0.3, mix: 0.4 },
      },
      { deviceId: 'fdn-reverb', params: { mix: 0.4, decay: 14, size: 1.8, breathDepth: 0 } },
    ],
    then: [breathe(0.0625, 0.55)],
    ...looped(16, 6, 3, [48, [60, 0.7]]),
  },
  {
    n: 30,
    id: 'slow-saw-dawn-fadd9',
    name: 'Slow saw dawn {F}add9',
    kind: 'pad',
    description:
      'A reed on {F} with a ninth that turns into a sawtooth and back every 16 s under a breathing filter.',
    preset: 'sonoran-slow-saw-dawn',
    set: { rate: 0.0625 },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { slope: 1, cutoffHz: 1500, lfoAmount: 40, lfoRateHz: 0.125 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    then: [narrow, breathe(0.0625, 0.55)],
    ...looped(16, 5, 3, [53, 60, [67, 0.8], [69, 0.7]]),
  },
  {
    n: 31,
    id: 'muted-dusk-section-am',
    name: 'Muted dusk section {A}m',
    kind: 'pad',
    description:
      'Five muted players on each note of {A} minor with no vibrato, swelling every 16 s in a long hall.',
    preset: 'sonoran-muted-dusk-section',
    then: [narrow, breathe(0.0625, 0.55)],
    ...looped(16, 6, 3, [45, 57, [64, 0.8], [69, 0.7], [72, 0.6]]),
  },
  {
    n: 32,
    id: 'still-bows-g',
    name: 'Still bows {G}',
    kind: 'pad',
    description:
      'Three players on each note of {G} and {D} with no vibrato, held on by a spectral blur.',
    preset: 'sonoran-still-bows',
    // Little smear: at the preset's 0.7 the blur moves in steps the analysis hears as hits.
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { smear: 0.25, shimmer: 0, width: 0.7, mix: 0.4 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35, width: 0.8 } },
    ],
    then: [breathe(0.125, 0.55)],
    ...looped(8, 6, 3, [55, 62, [67, 0.8], [74, 0.6]]),
  },
  {
    n: 33,
    id: 'low-stone-voices-f',
    name: 'Low stone voices {F}',
    kind: 'pad',
    description:
      'Deep voices on a closed oo holding {F} and {C}, rising and sinking in a hall that hums back.',
    preset: 'sonoran-low-stone-voices',
    set: { ensemble: 0 },
    then: [breathe(0.125, 0.55)],
    ...looped(8, 6, 3, [41, 48, [53, 0.8]]),
  },
  {
    n: 34,
    id: 'slow-night-vowels-am',
    name: 'Slow night vowels {A}m',
    kind: 'pad',
    description:
      'Singers on {A} minor morphing from vowel to vowel in a deep chorus, swelling every 16 s.',
    preset: 'sonoran-slow-night-vowels',
    set: { ensemble: 0 },
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.125, mix: 0.3 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { mix: 0.4, decay: 10, size: 1.5, breathRate: 0.25 },
      },
    ],
    then: [breathe(0.0625, 0.55)],
    ...looped(16, 6, 3, [57, 64, [69, 0.8], [72, 0.7]]),
  },
  {
    n: 35,
    id: 'night-air-brass-f',
    name: 'Night air brass {F}',
    kind: 'pad',
    description:
      'A section of low brass blown softly on {F} major, swelling once every 16 s in a long plate.',
    preset: 'sonoran-night-air-brass',
    effects: [
      { deviceId: 'chorus', preset: 'Vocal thickener', params: { rate: 0.375 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } },
    ],
    then: [narrow, breathe(0.0625, 0.5)],
    ...looped(16, 6, 3, [41, 48, [53, 0.8], [57, 0.7]]),
  },
  {
    n: 36,
    id: 'valley-horn-swell-f',
    name: 'Valley horn swell {F}',
    kind: 'pad',
    description:
      'One horn section swelling into a chord on {F} and dying away across a very large space.',
    preset: 'sonoran-valley-horn-line',
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } }],
    ...played(
      12,
      [
        [0, 6, 41, 0.9],
        [0, 6, 48, 0.8],
        [0, 6, 53, 0.8],
        [0, 6, 60, 0.7],
      ],
      3,
    ),
  },
  {
    n: 37,
    id: 'slow-air-flutes-g',
    name: 'Slow air flutes {G}',
    kind: 'pad',
    description:
      'Low flutes on {G} and {D} blown softly with breath in the tone, drifting in a chorus.',
    preset: 'sonoran-slow-air-flutes',
    set: { breath: 0.5, blow: 0.3 },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.125, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4, decay: 9, breathRate: 0.25 } },
    ],
    then: [breathe(0.125, 0.55)],
    ...looped(8, 5, 3, [55, 62, 67]),
  },
  {
    n: 38,
    id: 'bellows-reeds-a',
    name: 'Bellows reeds {A}',
    kind: 'pad',
    description:
      'A reed organ on a low {A} and {E} with a beating rank, its bellows rising and sinking.',
    preset: 'sonoran-bellows-drone',
    then: [breathe(0.125, 0.4)],
    ...looped(8, 6, 3, [45, [52, 0.7]]),
  },
  {
    n: 39,
    id: 'hollow-log-d',
    name: 'Hollow log {D}',
    kind: 'pad',
    description:
      'A low reed growling on {D} under one narrow resonant peak, rising and sinking in a cave of echoes.',
    preset: 'sonoran-hollow-log-drone',
    set: { growl: 0.2, breath: 0.4 },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { type: 4, cutoffHz: 420, resonance: 3, lfoAmount: 0, lfoRateHz: 0.375 },
      },
      { deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.35 } },
    ],
    then: [breathe(0.125, 0.5)],
    ...looped(8, 4, 2, [38]),
  },
  {
    n: 40,
    id: 'singing-string-a',
    name: 'Singing string {A}',
    kind: 'pad',
    description:
      'Two strings on {A} and {E} held singing by a sustainer, two seconds to rise with no pick, in a long plate.',
    preset: 'sonoran-singing-string',
    set: { detune: 0 },
    then: [narrow],
    ...played(
      12,
      [
        [0, 6, 45, 0.9],
        [0, 6, 52, 0.8],
      ],
      3,
    ),
  },
  {
    n: 41,
    id: 'harp-pad-glow-c',
    name: 'Harp pad glow {C}',
    kind: 'pad',
    description:
      'The pad layer under a strummed {C} chord, its plucks faded in, rising an octave in the reverb.',
    preset: 'sonoran-harp-pad-glow',
    then: [breathe(0.125, 0.55), quarterTurn(8)],
    ...looped(8, 5, 3, [48, 55, 60, 64]),
    tuning: 'whole-cycles',
  },
  {
    n: 42,
    id: 'cooling-ground-d',
    name: 'Cooling ground {D}',
    kind: 'pad',
    description:
      'A just {D} minor chord of dull tones over a sub, rising and sinking in a deep phaser.',
    preset: 'sonoran-cooling-ground',
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.125, mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    then: [breathe(0.125, 0.5)],
    ...looped(8, 8, 3, [50]),
  },
  {
    n: 43,
    id: 'backwards-night-air-em',
    name: 'Backwards night air {E}m',
    kind: 'pad',
    description:
      'Long reversed grains of a nylon guitar phrase in {E} minor, scanning backwards in a cathedral.',
    preset: 'sonoran-backwards-night-air',
    source: 'nylon-guitar-fall-em',
    ...looped(8, 5, 3, [60]),
  },
  {
    n: 44,
    id: 'slowed-sample-pad-c',
    name: 'Slowed choir pad {C}',
    kind: 'pad',
    description:
      'A choir drone slowed down to a low {C}, looped with a slow wobble under a breathing filter.',
    preset: 'sonoran-slowed-sample-pad',
    source: 'choir-drone-a',
    // the choir is recorded on A and E; nine semitones down it sings C and G, all white keys
    set: { tune: -9, fine: 0 },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { slope: 1, cutoffHz: 1800, lfoAmount: 40, lfoRateHz: 0.125 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45 } },
    ],
    then: [narrow, breathe(0.125, 0.5)],
    ...looped(8, 6, 3, [60]),
  },
  {
    n: 45,
    id: 'swelled-guitar-sky-em',
    name: 'Swelled guitar sky {E}m',
    kind: 'pad',
    description:
      'An {E} minor seventh chord with its fourth on an electric guitar, swelled in with no pick, in a huge room.',
    preset: 'sonoran-swelled-guitar-sky',
    then: [narrow],
    ...played(
      12,
      [
        [0, 8, 40],
        [0.03, 8, 47],
        [0.06, 8, 55],
        [0.09, 8, 62],
        [0.12, 8, 69],
      ],
      3,
    ),
  },
  {
    n: 46,
    id: 'strikeless-tines-dm7',
    name: 'Strikeless tines {D}m7',
    kind: 'pad',
    description:
      'Dull tines on {D} minor seventh with the strike taken off, fading in and turning in a slow phaser.',
    preset: 'sonoran-strikeless-tines',
    then: [narrow],
    ...played(
      10,
      [
        [0, 6, 50, 0.8],
        [0.02, 6, 57, 0.7],
        [0.04, 6, 60, 0.7],
        [0.06, 6, 65, 0.7],
        [0.08, 6, 69, 0.6],
      ],
      3,
    ),
  },
  {
    n: 47,
    id: 'piano-rising-dsus2',
    name: 'Piano rising {D}sus2',
    kind: 'pad',
    description:
      'A felted piano chord on {D}, {A} and {E}, its hammers faded out, rising into a reverb that blooms.',
    preset: 'sonoran-piano-rising-as-pad',
    then: [narrow],
    ...played(
      12,
      [
        [0, 6, 50, 0.8],
        [0.02, 6, 57, 0.7],
        [0.04, 6, 64, 0.7],
        [0.06, 6, 69, 0.6],
      ],
      3,
    ),
  },
  {
    n: 48,
    id: 'far-field-crickets-haze',
    name: 'Far field crickets',
    kind: 'texture',
    description:
      'A whole field of crickets heard from a long way off, softened by distance and washed into the open.',
    preset: 'sonoran-far-field-crickets',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000 } },
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 160, density: 12, scatter: 1, feedback: 0.3, mix: 0.7 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, decay: 6 } },
    ],
    ...looped(8, 6, 2, [47, 52, 57, 62, 67, 72, 77, 83]),
  },
  {
    n: 49,
    id: 'toads-after-rain-far',
    name: 'Toads after rain',
    kind: 'texture',
    description:
      'Toads calling from standing water a field away, on quarter-inch tape with a little room.',
    preset: 'sonoran-toads-after-rain',
    set: { density: 1 },
    ...looped(16, 3, 2, [43, 48, 55, 60, 65]),
  },
  {
    n: 50,
    id: 'far-dry-thunder-rolls',
    name: 'Far dry thunder',
    kind: 'texture',
    description:
      'Thunder from beyond the horizon, one roll dying away under the next, in open night air.',
    preset: 'sonoran-far-dry-thunder',
    set: { density: 1 },
    // Rolls come when they like: the slow hand on the level keeps the quiet between two of them
    // from being the loop's seam.
    then: [steady(200, 2), narrow],
    ...looped(16, 4, 3, [36, 43, 48, 53]),
  },
  {
    n: 51,
    id: 'playa-wind-gusts',
    name: 'Playa wind',
    kind: 'texture',
    description: 'A low steady wind with slow gusts and no whistle, crossing a very large space.',
    preset: 'sonoran-playa-wind',
    ...looped(16, 5, 3, [50]),
  },
  {
    n: 52,
    id: 'dry-wind-panned',
    name: 'Dry wind rising',
    kind: 'texture',
    description:
      'Noise through a wandering band-pass, panned slowly from side to side in a huge room.',
    preset: 'sonoran-dry-wind-rising',
    set: { lfo1Rate: 0.0625, resonance: 0.15 },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.125, depth: 0.5, drift: 0 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
    ...looped(16, 6, 3, [31]),
  },
  {
    n: 53,
    id: 'low-wind-bands-gust',
    name: 'Low wind bands',
    kind: 'texture',
    description:
      'Broad dull bands of noise drifting round a low centre, one long gust in a twenty-second hall.',
    preset: 'sonoran-low-wind-bands',
    then: [narrow],
    ...looped(8, 5, 3, [40, 47]),
  },
  {
    n: 54,
    id: 'saguaro-rib-wind',
    name: 'Saguaro rib wind',
    kind: 'texture',
    description:
      'Gusts whistling through the dry ribs of a fallen cactus, rising and falling in open night air.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Whistling gap',
      params: { resonance: 0.3, size: 0.4, attack: 0.5, width: 0.6, volume: -2 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, decay: 8, width: 0.8 } },
    ],
    ...looped(16, 6, 3, [57]),
  },
  {
    n: 55,
    id: 'whistling-rocks-c',
    name: 'Whistling rocks',
    kind: 'texture',
    description:
      'Bands of noise tuned round a {C} chord and its mirror images, breathing like wind through rock.',
    preset: 'sonoran-whistling-rocks',
    set: { breatheRate: 0.125, resonance: 20 },
    ...looped(8, 5, 3, [60, 67, 72]),
  },
  {
    n: 56,
    id: 'moonlit-dust-cloud',
    name: 'Moonlit dust',
    kind: 'texture',
    description:
      'Air tuned to two clusters of soft sines on the white keys, smeared into a pale cloud that never settles.',
    preset: 'sonoran-moonlit-dust',
    set: { partials: 0.57, air: 1 },
    ...looped(16, 7, 3, [62, 69]),
  },
  {
    n: 57,
    id: 'small-hours-fire-close',
    name: 'Small hours fire',
    kind: 'texture',
    description:
      'A small fire burning down close by, its crackle softened by tape, with a dark room behind it.',
    preset: 'sonoran-small-hours-fire',
    ...looped(8, 3, 2, [55]),
  },
  {
    n: 58,
    id: 'monsoon-far-off',
    name: 'Monsoon far off',
    kind: 'texture',
    description:
      'Summer rain falling a long way across the desert, a dense hiss washed into a very large space.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Distant downpour',
      params: { attack: 0.5, tone: 0.35, width: 0.6, volume: -2 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, decay: 8, width: 0.8 } },
    ],
    ...looped(8, 3, 2, [55]),
  },
  {
    n: 59,
    id: 'wash-after-rain',
    name: 'Wash after rain',
    kind: 'texture',
    description:
      'A trickle of water running down a dry wash after a storm, heard from the bank with a little room.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Small stream',
      params: { density: 0.35, distance: 0.3, attack: 0.5, width: 0.8, volume: -2 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } }],
    ...looped(8, 3, 2, [62]),
  },
  {
    n: 60,
    id: 'late-struck-bowl-a',
    name: 'Late struck bowl {A}',
    kind: 'oneshot',
    description:
      'One soft strike on a bowl on {A} with a long ring and a faint dull echo, in a hall.',
    preset: 'sonoran-late-struck-bowl',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 700, feedback: 0.2, mix: 0.15 },
      },
      {
        deviceId: 'fdn-reverb',
        params: { mix: 0.4, decay: 8, damping: 0.6, size: 1.5, breathDepth: 0 },
      },
    ],
    ...played(10, [[0, 5, 57, 0.9]], 3),
  },
  {
    n: 61,
    id: 'struck-bowl-fifth-e',
    name: 'Struck bowl fifth {E}',
    kind: 'oneshot',
    description:
      'Two small bowls on a high {E} and {B} struck together and left to ring, with a faint dull echo in a hall.',
    preset: 'sonoran-late-struck-bowl',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 700, feedback: 0.2, mix: 0.15 },
      },
      {
        deviceId: 'fdn-reverb',
        params: { mix: 0.4, decay: 8, damping: 0.6, size: 1.5, breathDepth: 0 },
      },
    ],
    ...played(
      10,
      [
        [0, 5, 64, 0.9],
        [0.02, 5, 71, 0.75],
      ],
      3,
    ),
  },
  {
    n: 62,
    id: 'horizon-gong-d',
    name: 'Horizon gong {D}',
    kind: 'oneshot',
    description:
      'A soft-struck gong on a low {D} with a long ring, set a long way off in a cathedral.',
    preset: 'sonoran-horizon-gong',
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } }],
    ...played(12, [[0, 9, 50]], 3),
  },
  {
    n: 63,
    id: 'water-jar-g',
    name: 'Water jar {G}',
    kind: 'oneshot',
    description:
      'A tongue drum struck softly on {G} with a deep thump of air under the note, in a hall.',
    preset: 'sonoran-water-jar-tones',
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall' }],
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 3, release: 0.3, ride: 0 } },
    ],
    ...played(4, [[0, 3, 55]], 1),
  },
  {
    n: 64,
    id: 'felt-chord-fmaj7',
    name: 'Felt chord {F}maj7',
    kind: 'oneshot',
    description:
      'A close felt piano chord on {F} major seventh, its action noise left in, ringing out in a hall.',
    preset: 'sonoran-looped-felt-notes',
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
    ...played(
      6,
      [
        [0, 4, 53, 0.9],
        [0.012, 4, 60, 0.85],
        [0.024, 4, 64, 0.85],
        [0.036, 4, 69, 0.8],
      ],
      2,
    ),
  },
  {
    n: 65,
    id: 'half-speed-pan-d',
    name: 'Half-speed pan {D}',
    kind: 'oneshot',
    description:
      'A low steel pan on {D} with the same note replayed an octave down beneath it, in a huge room.',
    preset: 'sonoran-half-speed-pan',
    ...played(8, [[0, 4, 50]], 2),
  },
  {
    n: 66,
    id: 'wooden-bar-c',
    name: 'Wooden bar {C}',
    kind: 'oneshot',
    description:
      'One soft mallet on a marimba bar on {C} over its resonator, ringing out in a hall.',
    preset: 'sonoran-wooden-pattern',
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
    ...played(4, [[0, 3, 48]], 1),
  },
  {
    n: 67,
    id: 'twelve-string-dsus2',
    name: 'Twelve string {D}sus2',
    kind: 'oneshot',
    description:
      'A soft twelve-string chord on {D}, {A} and {E} dragged across once, its pick softened, hanging in a huge room.',
    preset: 'sonoran-porch-twelve-string',
    // A quicker drag than the preset's and its swell cut to 10 ms, enough to take the click off
    // the first string: at the preset's drag one key hears the strings as a phrase.
    set: { strum: 40, tone: 0.3 },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 10 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.5 } },
    ],
    ...played(
      8,
      [
        [0, 5, 50],
        [0, 5, 57],
        [0, 5, 62],
        [0, 5, 64],
        [0, 5, 69],
      ],
      2.5,
    ),
  },
  {
    n: 68,
    id: 'soft-bars-am',
    name: 'Soft bars {A}m',
    kind: 'oneshot',
    description:
      'A vibraphone chord on {A} minor with its ninth on top, soft mallets, the motor turning slowly, in a hall.',
    preset: 'sonoran-rolled-bar-shimmer',
    set: { roll: 0 },
    ...played(
      8,
      [
        [0, 5, 57, 0.8],
        [0.02, 5, 60, 0.7],
        [0.04, 5, 64, 0.75],
        [0.06, 5, 71, 0.6],
      ],
      2.5,
    ),
  },
  {
    n: 69,
    id: 'slow-tine-e',
    name: 'Slow tine {E}',
    kind: 'oneshot',
    description:
      'One soft electric piano note on {E} crossing from side to side over sympathetic strings.',
    preset: 'sonoran-tines-crossing-slowly',
    ...played(8, [[0, 5, 64]], 2.5),
  },
  {
    n: 70,
    id: 'harp-string-e',
    name: 'Harp string {E}',
    kind: 'oneshot',
    description:
      'One high harp string on {E} plucked softly and left to ring long in a plain hall.',
    preset: 'sonoran-harp-haze',
    effects: [{ deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.25, decay: 9 } }],
    then: [narrow],
    ...played(8, [[0, 3, 76]], 2.5),
  },
  {
    n: 71,
    id: 'silk-string-g',
    name: 'Silk string {G}',
    kind: 'oneshot',
    description:
      'A softly plucked silk string that bends up into a {G}, with a faint echo in a cathedral.',
    preset: 'sonoran-silk-string-night',
    // Half the preset's bend: from a quarter tone under, the note sits between two keys for too long.
    set: { bend: 25 },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 500, feedback: 0.2, mix: 0.15 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    ...played(6, [[0, 3, 55]], 2),
  },
  {
    n: 72,
    id: 'nylon-chord-em',
    name: 'Nylon chord {E}m',
    kind: 'oneshot',
    description:
      'An {E} minor chord on soft nylon strings, followed by its own shadow backwards, in a cathedral.',
    preset: 'sonoran-nylon-after-dark',
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 8, release: 0.3, ride: 0 } },
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    ...played(
      8,
      [
        [0, 4, 40],
        [0.012, 4, 47],
        [0.024, 4, 52],
        [0.036, 4, 55],
        [0.048, 4, 59],
        [0.06, 4, 64],
      ],
      2,
    ),
  },
  {
    n: 73,
    id: 'starlit-strum-am',
    name: 'Starlit strum {A}m',
    kind: 'oneshot',
    description:
      'An {A} minor chord swept once up four octaves of soft strings, ringing out in a huge room.',
    preset: 'sonoran-starlit-slow-strum',
    set: { strum: 8, direction: 0 },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25 } }],
    ...played(
      8,
      [
        [0, 4, 57],
        [0, 4, 60],
        [0, 4, 64],
      ],
      2.5,
    ),
  },
  {
    n: 74,
    id: 'open-range-string-d',
    name: 'Open range string {D}',
    kind: 'oneshot',
    description:
      'Doubled courses on {D} picked in octaves and left to ring, a soft pad growing behind them.',
    preset: 'sonoran-open-range-strings',
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 4, release: 0.3, ride: 0 } },
    ],
    ...played(8, [[0, 5, 50]], 2.5),
  },
  {
    n: 75,
    id: 'rolled-chord-d',
    name: 'Rolled chord {D}',
    kind: 'oneshot',
    description:
      'An open chord on {D} rolled once by the fingers, with murky echoes far behind it in a cathedral.',
    preset: 'sonoran-rolled-open-chord',
    set: { roll: 0, strum: 90, direction: 0 },
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.12 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    ...played(8, [[0, 4, 50]], 2.5),
  },
  {
    n: 76,
    id: 'neck-pickup-g',
    name: 'Neck pickup {G}',
    kind: 'oneshot',
    description:
      'One soft neck-pickup note on {G} on an electric guitar, ringing out in a ten-second hall.',
    preset: 'sonoran-looped-guitar-dusk',
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25, decay: 10 } }],
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
    ],
    ...played(7, [[0, 4, 55]], 2),
  },
  {
    n: 77,
    id: 'tail-light-g',
    name: 'Tail light {G}',
    kind: 'oneshot',
    description:
      'A sawtooth note on a low {G} that opens at once and closes as it fades, with a faint echo in a hall.',
    preset: 'sonoran-tail-light-echoes',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 375, feedback: 0.3, mix: 0.15 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...played(3.5, [[0, 0.6, 43]], 1),
  },
  {
    n: 78,
    id: 'ocotillo-pluck-e',
    name: 'Ocotillo pluck {E}',
    kind: 'oneshot',
    description:
      'A short triangle and pulse pluck on a high {E} whose filter snaps shut, with faint dark echoes in a hall.',
    preset: 'sonoran-ocotillo-pattern',
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 4, release: 0.3, ride: 0 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 250, feedback: 0.4, spread: 0.8, mix: 0.15 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...played(4, [[0, 0.5, 76]], 1),
  },
  {
    n: 79,
    id: 'folded-pluck-f',
    name: 'Folded pluck {F}',
    kind: 'oneshot',
    description: 'A woody folded pluck on {F} through a low-pass gate, ringing out in a hall.',
    preset: 'sonoran-folded-pluck-pattern',
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
    ],
    ...played(3.5, [[0, 2, 53]], 1),
  },
  {
    n: 80,
    id: 'night-road-bass-g',
    name: 'Night road bass {G}',
    kind: 'oneshot',
    description:
      'One bass note on a low {G} whose filter opens and takes a second to shut, in a hall.',
    preset: 'sonoran-night-road-pulse',
    // A longer decay than the preset's: at 0.45 s the note is over before its pitch can be heard.
    set: { decay: 1.5 },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
    ],
    ...played(3.5, [[0, 1.5, 43]], 1),
  },
  {
    n: 81,
    id: 'cedar-flute-call-am',
    name: 'Cedar flute call {A}m',
    kind: 'melodic',
    description:
      'A wooden flute scooping up to a high {E} and back to {A} with a breath vibrato, in a cathedral.',
    preset: 'sonoran-cedar-flute-echo',
    // No echo, and five notes: an echo 0.64 s after each note is a pulse to the analysis, and
    // so are six notes or more that happen to sit near a grid. The top note is the loud one.
    set: { attack: 0.01, scoop: 30 },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } }],
    ...played(
      10,
      [
        [0, 1.1, 69, 0.6],
        [1.31, 0.5, 72, 0.55],
        [2.07, 0.7, 76, 1],
        [3.36, 0.5, 74, 0.55],
        [4.19, 2.2, 69, 0.6],
      ],
      3,
    ),
  },
  {
    n: 82,
    id: 'lone-coyote-em',
    name: 'Lone coyote {E}m',
    kind: 'melodic',
    description:
      'A round solo voice sliding between six notes of {E} minor, answered by murky echoes in a cathedral.',
    preset: 'sonoran-lone-coyote-lead',
    ...played(
      10,
      [
        [0, 0.7, 64, 0.7],
        [0.83, 1.2, 67, 0.6],
        [2.17, 0.6, 71, 0.7],
        [2.9, 1.5, 69, 0.6],
        [4.63, 0.9, 62, 0.6],
        [5.71, 2.2, 64, 0.7],
      ],
      3,
    ),
  },
  {
    n: 83,
    id: 'singing-wire-em',
    name: 'Singing wire {E}m',
    kind: 'melodic',
    description:
      'A filter ringing two octaves over four notes of {E} minor like wind in a wire, with a chorused echo.',
    preset: 'sonoran-singing-wire',
    set: { attack: 0.05, release: 3 },
    then: [narrow],
    ...played(
      12,
      [
        [0, 1.5, 52, 0.7],
        [1.8, 1, 55, 0.6],
        [3.1, 2, 59, 0.7],
        [5.4, 2.5, 57, 0.65],
      ],
      3,
    ),
  },
  {
    n: 84,
    id: 'tail-lights-dm',
    name: 'Tail lights {D}m',
    kind: 'melodic',
    description:
      'Sawtooth notes in {D} minor that close as they fade, rolled on by dark echoes; it comes round.',
    preset: 'sonoran-tail-light-echoes',
    then: [narrow],
    ...cycled(8, [
      [0, 0.5, 62, 0.7],
      [1.22, 0.5, 69, 0.55],
      [1.78, 0.5, 65, 0.6],
      [3.27, 0.5, 72, 0.6],
      [4.55, 0.5, 67, 0.5],
      [5.51, 0.5, 64, 0.55],
      [6.85, 0.5, 60, 0.6],
    ]),
  },
  {
    n: 85,
    id: 'ocotillo-pattern-c',
    name: 'Ocotillo pattern {C}',
    kind: 'melodic',
    description:
      'Short plucks round a {C} chord whose filter snaps shut, blurred by dark echoes; it comes round.',
    preset: 'sonoran-ocotillo-pattern',
    ...cycled(8, [
      [0, 0.4, 60, 0.7],
      [0.63, 0.4, 67, 0.5],
      [1.04, 0.4, 72, 0.6],
      [1.94, 0.4, 69, 0.5],
      [3, 0.4, 64, 0.6],
      [3.34, 0.4, 67, 0.45],
      [4.61, 0.4, 60, 0.65],
      [5.2, 0.4, 62, 0.5],
      [6.37, 0.4, 67, 0.55],
    ]),
  },
  {
    n: 86,
    id: 'folded-plucks-dm',
    name: 'Folded plucks {D}m',
    kind: 'melodic',
    description:
      'Woody folded plucks in {D} minor through a low-pass gate, doubled by dark echoes; it comes round.',
    preset: 'sonoran-folded-pluck-pattern',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 375, feedback: 0.25, spread: 0.9, mix: 0.2 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...cycled(8, [
      [0, 1.5, 50, 0.7],
      [0.71, 1, 57, 0.55],
      [1.36, 1, 62, 0.6],
      [2.6, 1, 65, 0.55],
      [3.18, 1, 64, 0.5],
      [4.3, 1.5, 53, 0.65],
      [5.07, 1, 60, 0.55],
      [6.42, 1, 57, 0.6],
    ]),
  },
  {
    n: 87,
    id: 'night-road-am',
    name: 'Night road {A}m',
    kind: 'melodic',
    description:
      'Short bass notes in {A} minor whose filter opens and shuts, in a hall; it comes round.',
    preset: 'sonoran-night-road-pulse',
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 8, release: 0.3, ride: 0 } },
    ],
    ...cycled(8, [
      [0, 0.4, 45, 0.75],
      [1.31, 0.4, 52, 0.6],
      [2.07, 0.4, 48, 0.65],
      [3.52, 0.4, 50, 0.6],
      [4.77, 0.4, 45, 0.7],
      [6.1, 0.4, 43, 0.6],
    ]),
  },
  {
    n: 88,
    id: 'jackrabbit-run-g',
    name: 'Jackrabbit run {G}',
    kind: 'melodic',
    description:
      'Six rubbery plucks up from {G} and back, chased by chorused echoes in a long plate.',
    preset: 'sonoran-jackrabbit-run',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 333, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    then: [
      narrow,
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 5, release: 0.3, ride: 0 } },
    ],
    ...played(
      8,
      [
        [0, 0.3, 55, 0.75],
        [0.52, 0.3, 62, 0.6],
        [1.28, 0.3, 67, 0.65],
        [1.7, 0.3, 65, 0.55],
        [2.56, 0.3, 62, 0.6],
        [3.21, 0.3, 55, 0.7],
      ],
      2,
    ),
  },
  {
    n: 89,
    id: 'wooden-pattern-am',
    name: 'Wooden pattern {A}m',
    kind: 'melodic',
    description:
      'Soft marimba notes in {A} minor doubled by echoes a third of a second behind; it comes round.',
    preset: 'sonoran-wooden-pattern',
    ...cycled(8, [
      [0, 1, 57, 0.7],
      [0.52, 1, 64, 0.5],
      [1.28, 1, 67, 0.6],
      [1.7, 1, 69, 0.5],
      [2.56, 1, 72, 0.55],
      [3.21, 1, 64, 0.6],
      [4.36, 1, 60, 0.65],
      [4.67, 1, 62, 0.5],
      [5.9, 1, 64, 0.55],
      [6.7, 1, 52, 0.6],
    ]),
  },
  {
    n: 90,
    id: 'water-jars-dm',
    name: 'Water jars {D}m',
    kind: 'melodic',
    description:
      'A tongue drum in {D} minor struck softly, air thumping under each note, with dull echoes; it comes round.',
    preset: 'sonoran-water-jar-tones',
    ...cycled(
      8,
      [
        [0, 2, 50, 0.7],
        [0.9, 2, 57, 0.55],
        [1.63, 2, 53, 0.6],
        [3.1, 2, 60, 0.6],
        [4.02, 2, 55, 0.5],
        [5.4, 2, 57, 0.6],
        [6.6, 2, 48, 0.55],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 91,
    id: 'low-pan-phrase-dm',
    name: 'Low pan phrase {D}m',
    kind: 'melodic',
    description:
      'Three notes of {D} minor on a low steel pan, replayed an octave down and twice as slow beneath.',
    preset: 'sonoran-half-speed-pan',
    ...played(
      12,
      [
        [0, 3, 50, 0.75],
        [1.73, 3, 57, 0.8],
        [4.1, 4, 53, 0.9],
      ],
      3,
    ),
  },
  {
    n: 92,
    id: 'late-bowls-em',
    name: 'Late bowls {E}m',
    kind: 'melodic',
    description:
      'Three bowls struck on {E}, {B} and {G}, each with a faint dull echo inside a twelve-second hall.',
    preset: 'sonoran-late-struck-bowl',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 700, mix: 0.15 } },
      {
        deviceId: 'fdn-reverb',
        params: { mix: 0.4, decay: 12, damping: 0.6, size: 1.5, breathDepth: 0 },
      },
    ],
    ...played(
      12,
      [
        [0, 4, 52, 0.8],
        [3.05, 4, 59, 0.75],
        [5.47, 3.5, 55, 0.8],
      ],
      3,
    ),
  },
  {
    n: 93,
    id: 'harp-haze-phrase-c',
    name: 'Harp haze phrase {C}',
    kind: 'melodic',
    description:
      'A harp phrase over a low {C}, a thin cloud of slow grains behind it in a long hall; it comes round.',
    preset: 'sonoran-harp-haze',
    // Plucked a little harder and with less of the cloud than the preset, so each string is heard to start.
    set: { touch: 0.5 },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { size: 500, mix: 0.25 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.4, decay: 9 } },
    ],
    ...cycled(8, [
      [0, 2.5, 48, 0.7],
      [0.09, 2.5, 55, 0.55],
      [1.1, 2, 64, 0.6],
      [2.03, 2, 67, 0.6],
      [3.12, 2.5, 72, 0.65],
      [4.65, 2, 69, 0.5],
      [5.37, 2, 64, 0.55],
      [6.6, 2, 62, 0.6],
    ]),
  },
  {
    n: 94,
    id: 'silk-string-night-em',
    name: 'Silk string night {E}m',
    kind: 'melodic',
    description:
      'A silk string bending up into six notes of {E} minor, with dull echoes in a cathedral.',
    preset: 'sonoran-silk-string-night',
    // Half the preset's bend, as the single string has: a tenth of the sound sat between two keys.
    set: { bend: 25 },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 500, feedback: 0.35, mix: 0.25 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
    ],
    ...played(
      10,
      [
        [0, 2, 52, 0.7],
        [1.26, 1.5, 59, 0.6],
        [1.92, 1.7, 64, 0.65],
        [3.39, 1.8, 62, 0.6],
        [4.97, 3, 55, 0.6],
        [5.6, 3, 52, 0.7],
      ],
      3,
    ),
  },
  {
    n: 95,
    id: 'nylon-after-dark-am',
    name: 'Nylon after dark {A}m',
    kind: 'melodic',
    description:
      'Soft nylon strings over {A} and {F}, each note followed by its shadow backwards; it comes round.',
    preset: 'sonoran-nylon-after-dark',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1500, mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 4, release: 0.3, ride: 0 } },
    ],
    ...cycled(12, [
      [0, 4.9, 45, 0.65],
      [0.05, 4.9, 60, 0.7],
      [1.62, 1.45, 64, 0.6],
      [3.2, 3, 69, 0.55],
      [4.4, 2, 67, 0.5],
      [6.24, 5, 41, 0.65],
      [6.29, 5, 57, 0.6],
      [7.96, 1.2, 60, 0.6],
      [9.4, 2, 64, 0.5],
      [10.6, 1.2, 62, 0.5],
    ]),
  },
  {
    n: 96,
    id: 'dusk-guitar-em',
    name: 'Dusk guitar {E}m',
    kind: 'melodic',
    description:
      'Soft neck-pickup notes in {E} minor on an electric guitar, ringing into a ten-second hall.',
    preset: 'sonoran-looped-guitar-dusk',
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4, decay: 10 } }],
    ...played(
      10,
      [
        [0, 3, 40, 0.7],
        [0.9, 2, 52, 0.55],
        [1.7, 2, 59, 0.6],
        [2.9, 2, 55, 0.55],
        [3.8, 2.5, 62, 0.6],
        [5.2, 3, 64, 0.65],
      ],
      3,
    ),
  },
  {
    n: 97,
    id: 'open-road-slide-g',
    name: 'Open road slide {G}',
    kind: 'melodic',
    description: 'Six slow notes on a steel guitar over {G}, with chorused echoes in a long plate.',
    preset: 'sonoran-open-road-slide',
    // Picked, not swelled, and the bar held still: the swell hides the notes from the analysis.
    set: { swell: 0, pick: 1, vibrato: 0 },
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 450, mix: 0.15 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    ...played(
      12,
      [
        [0, 1.6, 55, 0.7],
        [1.87, 1.2, 59, 0.65],
        [3.31, 1, 64, 0.7],
        [4.52, 1.8, 65, 0.6],
        [6.63, 1.1, 62, 0.65],
        [7.94, 1.6, 60, 0.7],
      ],
      3,
    ),
  },
  {
    n: 98,
    id: 'open-range-g',
    name: 'Open range {G}',
    kind: 'melodic',
    description:
      'Doubled courses picked in octaves over a low {G}, a soft pad growing behind them; it comes round.',
    preset: 'sonoran-open-range-strings',
    ...cycled(12, [
      [0, 4, 43, 0.7],
      [1.38, 2.6, 50, 0.55],
      [2.38, 4, 55, 0.6],
      [4.06, 5, 52, 0.6],
      [5.65, 3, 59, 0.5],
      [6.84, 4.5, 57, 0.6],
      [9.1, 2.5, 50, 0.55],
      [10.3, 1.5, 47, 0.5],
    ]),
  },
  {
    n: 99,
    id: 'rolled-open-chord-d',
    name: 'Rolled open chord {D}',
    kind: 'melodic',
    description:
      'Open chords on {D}, {A} and {G} rolled slowly by the fingers, with long murky echoes in a cathedral.',
    preset: 'sonoran-rolled-open-chord',
    set: { roll: 0, strum: 220 },
    ...played(
      12,
      [
        [0, 4, 50, 0.7],
        [2.13, 4, 57, 0.65],
        [4.61, 4, 55, 0.65],
        [6.47, 4, 45, 0.7],
      ],
      3,
    ),
  },
  {
    n: 100,
    id: 'slow-tines-c',
    name: 'Slow tines {C}',
    kind: 'melodic',
    description:
      'A soft electric piano over {C} and {A}, each note crossing slowly from side to side; it comes round.',
    preset: 'sonoran-tines-crossing-slowly',
    set: { tremoloRate: 0.25 },
    ...cycled(12, [
      [0, 4.5, 48, 0.65],
      [0.04, 4.5, 67, 0.7],
      [1.62, 1.5, 64, 0.65],
      [3.1, 3, 71, 0.65],
      [6.07, 5, 45, 0.65],
      [6.11, 5, 64, 0.7],
      [7.41, 1.4, 60, 0.65],
      [9.47, 2.2, 67, 0.65],
    ]),
  },
])
