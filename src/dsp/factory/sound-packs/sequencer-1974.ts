// The sounds of the pack "Berlin Sequencer, 1974": its presets played, a hundred sounds to
// paint with. Numbers 21001 to 21100.

import { type PatchDevice } from '../../../core/devices/patch'
import { PRESETS } from '../packs/sequencer-1974'
import { type FactorySound } from '../types'
import { breathe, cycled, hall, looped, packSounds, played, quarterTurn, soften } from './recipe'

// A phaser or a flanger crossing a held note moves its level by a few dB, enough to read as a
// pad in one key and a drone in the next: a fast compressor last holds the level where it is.
const HELD: PatchDevice = {
  deviceId: 'ambient-comp',
  params: {
    threshold: -60,
    ratio: 10,
    attack: 10,
    release: 0.15,
    knee: 6,
    tails: 1,
    scLowCut: 20,
    makeup: 24,
  },
}
// A steady tone that is to loop as a drone: squashed flat, held, and turned a quarter cycle a
// loop so that it meets itself in power at the fold (with `tuning: 'whole-cycles'`).
const FLATTENED: PatchDevice = {
  deviceId: 'fet-limiter',
  params: { inputGain: 40, outputGain: -14.2 },
}
const still = (loopSec: number): readonly PatchDevice[] => [FLATTENED, HELD, quarterTurn(loopSec)]

export const SOUNDS: readonly FactorySound[] = packSounds('sequencer-1974', 21000, PRESETS, [
  // Drones: one note held on the pedals, the leads and the reels, with nothing left to stir it.
  {
    n: 1,
    id: 'sub-under-the-floor-c',
    name: 'Under the floor {C}',
    kind: 'drone',
    description:
      'Little more than the sub octave under a low {C}, its harmonics brought out by a transformer, in a short room.',
    preset: 'sequencer-1974-under-the-floor',
    set: { beat: 0 },
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 3, 2, [48]),
  },
  {
    n: 2,
    id: 'test-tone-fifth-e',
    name: 'Test tone floor {E}',
    kind: 'drone',
    description:
      'Plain sines on a low {E} and {B} with their sub octaves and nothing moving, through a console channel onto tape.',
    preset: 'sequencer-1974-test-tone-floor',
    set: { detune: 0 },
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 4, 2, [40, 47]),
  },
  {
    n: 3,
    id: 'low-vault-voices-c',
    name: 'Low vault voices {C}',
    kind: 'drone',
    description:
      'Low men holding {C} and {G} on a closed vowel with no vibrato, under a stone vault with six seconds of tail.',
    preset: 'sequencer-1974-low-vault-voices',
    set: { ensemble: 0, motion: 0 },
    effects: [hall('Cathedral', 0.4)],
    then: still(8),
    tuning: 'whole-cycles',
    ...looped(8, 5, 3, [48, [55, 0.7]]),
  },
  {
    n: 4,
    id: 'bowed-low-string-d',
    name: 'Bowed low string {D}',
    kind: 'drone',
    description:
      'A low {D} bowed with a heavy arm so the string rasps, a six-stage phaser turning through it in a hall.',
    preset: 'sequencer-1974-bowed-low-string',
    set: { vibrato: 0 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm six-stage',
        params: { rate: 0.125, stereo: 0, mix: 0.3 },
      },
      hall('Hall', 0.4),
    ],
    then: [HELD],
    ...looped(8, 4, 2, [38]),
  },
  {
    n: 5,
    id: 'fifths-under-fog-f',
    name: 'Fifths under fog {F}',
    kind: 'drone',
    description:
      'Open fifths on {F} and {C} with tuned air over them, on tape in a very large space.',
    preset: 'sequencer-1974-fifths-under-fog',
    set: { movement: 0, air: 0.15 },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.1, age: 0 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { mix: 0.35, modDepth: 0.1, width: 0.4 },
      },
    ],
    then: still(8),
    tuning: 'whole-cycles',
    ...looped(8, 7, 3, [41]),
  },
  {
    n: 6,
    id: 'thin-organ-held-a',
    name: 'Thin organ {A}',
    kind: 'drone',
    description:
      'A thin combo organ holding a low {A}, through a six-stage phaser and a spring tank.',
    preset: 'sequencer-1974-thin-organ-phased',
    set: { tremulant: 0 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm six-stage',
        params: { rate: 0.125, stereo: 0, mix: 0.35 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.28 } },
    ],
    then: still(8),
    tuning: 'whole-cycles',
    ...looped(8, 3, 2, [45]),
  },
  {
    n: 7,
    id: 'low-horn-pedal-c',
    name: 'Low horn pedal {C}',
    kind: 'drone',
    description: 'Soft synth horns held on a low {C}, warmed by a tape preamp in a hall.',
    preset: 'sequencer-1974-low-horn-pedal',
    set: { detune: 0 },
    then: still(8),
    tuning: 'whole-cycles',
    ...looped(8, 6, 2, [36]),
  },
  {
    n: 8,
    id: 'hollow-organ-held-g',
    name: 'Hollow organ held {G}',
    kind: 'drone',
    description:
      'Hollow flute stops with a strong fifth rank held on a low {G}, into three tape heads and a plate.',
    preset: 'sequencer-1974-three-head-organ',
    then: still(8),
    tuning: 'whole-cycles',
    ...looped(8, 3, 2, [43]),
  },
  {
    n: 9,
    id: 'pulse-lead-held-g',
    name: 'Pulse lead held {G}',
    kind: 'drone',
    description:
      'A narrow pulse lead held on {G} with no vibrato, through a four-stage phaser and a spring tank.',
    preset: 'sequencer-1974-legato-pulse-lead',
    set: { lfo1Amount: 0 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Classic four-stage',
        params: { rate: 0.125, stereo: 0, mix: 0.3 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    then: still(8),
    tuning: 'whole-cycles',
    ...looped(8, 3, 2, [55]),
  },
  {
    n: 10,
    id: 'cellar-pedal-e',
    name: 'Cellar pedal {E}',
    kind: 'drone',
    description:
      'Two sawtooths and a sub locked together on a low {E}, an eight-stage phaser turning once a loop in a short room.',
    preset: 'sequencer-1974-cellar-pedal-tone',
    set: { beat: 0 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Deep eight-stage',
        params: { rate: 0.125, depth: 50, stereo: 0, mix: 0.3 },
      },
      hall('Room', 0.2),
    ],
    then: still(8),
    tuning: 'whole-cycles',
    ...looped(8, 4, 2, [40]),
  },
  {
    n: 11,
    id: 'rotor-pedal-d',
    name: 'Slow rotor pedal {D}',
    kind: 'drone',
    description:
      'A low organ {D} with the sub rank full on, turned by a slow rotating speaker into a small plate.',
    preset: 'sequencer-1974-slow-rotor-pedal',
    set: { celeste: 0, bellows: 0 },
    then: still(8),
    tuning: 'whole-cycles',
    ...looped(8, 4, 2, [38]),
  },
  {
    n: 12,
    id: 'far-horn-held-c',
    name: 'Far horn held {C}',
    kind: 'drone',
    description: 'One breathy flugelhorn holding {C} without a waver, set far back in a hall.',
    preset: 'sequencer-1974-far-horn-line',
    set: { vibrato: 0 },
    effects: [hall('Hall', 0.4)],
    then: still(8),
    tuning: 'whole-cycles',
    ...looped(8, 4, 2, [60]),
  },
  {
    n: 13,
    id: 'wood-flute-held-a',
    name: 'Wood flute held {A}',
    kind: 'drone',
    description:
      'A plain wood flute holding {A} with no vibrato and a lot of breath, in a two-spring tank.',
    preset: 'sequencer-1974-wood-flute-echo',
    set: { vibrato: 0, breath: 1 },
    effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } }],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.35 } }, ...still(8)],
    tuning: 'whole-cycles',
    ...looped(8, 3, 2, [57]),
  },

  // Pads: chords on the string ensemble, the tape reels, the organ and the synthesizers, most
  // with a phaser, a flanger or a filter crossing them once a loop.
  {
    n: 14,
    id: 'warm-room-drift-a',
    name: 'Warm room drift {A}',
    kind: 'pad',
    description:
      'Two oscillators a quarter of a semitone apart on a low {A}, beating under a slow flanger in a hall.',
    preset: 'sequencer-1974-warm-room-drift',
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep', params: { rate: 0.125, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3, breathDepth: 0 } },
    ],
    then: [breathe(0.125, 0.5)],
    ...looped(8, 4, 2, [45]),
  },
  {
    n: 15,
    id: 'oscillator-bank-c',
    name: 'Oscillator bank {C}',
    kind: 'pad',
    description:
      'A bank of sawtooths in octaves on a low {C}, never quite in tune, under a twelve-stage phaser in a long plate.',
    preset: 'sequencer-1974-oscillator-bank',
    set: { rate: 0.0625 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Twelve stage cloud',
        params: { rate: 0.0625, stereo: 35, mix: 0.4 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    ...looped(16, 6, 3, [36]),
  },
  {
    n: 16,
    id: 'folding-pedal-f',
    name: 'Folding pedal {F}',
    kind: 'pad',
    description:
      'An {F} that keeps folding over itself, a frequency shifter beating against it twice a loop, in a hall.',
    preset: 'sequencer-1974-folding-pedal',
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Slow drift',
        params: { fine: 0.25, lfoDepth: 0, mix: 0.5 },
      },
      hall('Hall', 0.3),
    ],
    then: [breathe(0.125, 0.6)],
    ...looped(8, 5, 2, [53]),
  },
  {
    n: 17,
    id: 'half-speed-reed-g',
    name: 'Half-speed reed {G}',
    kind: 'pad',
    description:
      'A long {G} on a bass reed and then the {D} over it, doubled an octave lower by a half-speed tape copy, in a hall.',
    preset: 'sequencer-1974-half-speed-reed',
    ...played(
      10,
      [
        [0, 5.5, 55],
        [1.6, 4.1, 62, 0.8],
      ],
      2.5,
    ),
  },
  {
    n: 18,
    id: 'taped-flutes-f',
    name: 'Taped flute chord {F}',
    kind: 'pad',
    description:
      'Low flutes holding {F} major on wobbling tape, real breath in them, in a long plate.',
    preset: 'sequencer-1974-taped-flute-chord',
    set: { breath: 0.4 },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4, flutter: 0.3, age: 0 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.35 } }, breathe(0.125, 0.45)],
    ...looped(8, 4, 2, [53, 60, 65, [69, 0.6]]),
  },
  {
    n: 19,
    id: 'six-stage-strings-c',
    name: 'Six-stage strings {C}',
    kind: 'pad',
    description:
      'The string ensemble on {C} major through a slow six-stage phaser, the sweep crossing the chord once a loop.',
    preset: 'sequencer-1974-six-stage-strings',
    // Less of the top octave and of the ensemble: at the preset's the chord beat into hits.
    set: { high: 0.15, ensemble: 0.6 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Slow swirl',
        params: { rate: 0.125, feedback: 45, stereo: 60 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { decay: 0.65, mix: 0.22 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 4, 2, [48, 55, 60, [64, 0.5]]),
  },
  {
    n: 20,
    id: 'low-strings-pedal-d',
    name: 'Low strings pedal {D}',
    kind: 'pad',
    description:
      'The low octave of the ensemble on a pedal fifth, {D} and {A}, a deep phaser turning under it in a hall.',
    preset: 'sequencer-1974-low-strings-pedal',
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Deep eight-stage',
        params: { centerHz: 400, rate: 0.0625 },
      },
      hall('Hall', 0.35),
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.35 } }, breathe(0.0625, 0.45)],
    ...looped(16, 5, 3, [50, 57]),
  },
  {
    n: 21,
    id: 'airfield-strings-em',
    name: 'Airfield strings {E}m',
    kind: 'pad',
    description:
      'A drier ensemble on {E} minor under a jet flanger with strong feedback, sweeping once a loop, in a long spring.',
    preset: 'sequencer-1974-airfield-strings',
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Classic jet',
        params: { rate: 0.125, depth: 80, feedback: 55 },
      },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }, breathe(0.125, 0.4)],
    ...looped(8, 4, 2, [52, 59, 67]),
  },
  {
    n: 22,
    id: 'distant-nave-strings-dm',
    name: 'Distant nave strings {D}m',
    kind: 'pad',
    description:
      'Slow strings on {D} minor through a speaker stack some way off, in a cathedral with six seconds of tail.',
    preset: 'sequencer-1974-distant-nave-strings',
    // Less of the amplifier's room: at the preset's the sides were louder than the middle a
    // semitone down, below where the widener reaches.
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Warm stack',
        params: { drive: 0.2, distance: 0.6, room: 0.3 },
      },
      hall('Cathedral', 0.4),
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.35 } }, breathe(0.125, 0.5)],
    ...looped(8, 5, 3, [50, 57, 62, [65, 0.5]]),
  },
  {
    n: 23,
    id: 'octave-down-choir-e',
    name: 'Octave-down choir {E}',
    kind: 'pad',
    description:
      'The choir tape at half speed on {E} and {B}, an octave down with its top rolled off, in a very large space.',
    preset: 'sequencer-1974-octave-down-choir-tape',
    set: { length: 9, age: 0.2, vibrato: 0 },
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5, 3, [64, 71]),
  },
  {
    n: 24,
    id: 'tape-strings-turning-g',
    name: 'Tape strings turning {G}',
    kind: 'pad',
    description:
      'Violins on tape holding {G} and {D}, turned slowly by a six-stage phaser into a plate.',
    preset: 'sequencer-1974-tape-strings-turning',
    set: { spread: 0.5 },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, feedback: 50 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }, breathe(0.125, 0.45)],
    ...looped(8, 5, 2, [55, 62, 67]),
  },
  {
    n: 25,
    id: 'cello-reel-bed-a',
    name: 'Cello reel bed {A}',
    kind: 'pad',
    description:
      'Cellos from tape at half speed on {A} and {E}, thickened by a tape preamp and set back in a hall.',
    preset: 'sequencer-1974-cello-reel-bed',
    then: [breathe(0.125, 0.4)],
    ...looped(8, 5, 3, [57, 64]),
  },
  {
    n: 26,
    id: 'horn-reel-chorale-c',
    name: 'Horn reel chorale {C}',
    kind: 'pad',
    description:
      'Horns from tape holding {C} major, a short slap of echo behind the chord and a hall after it.',
    preset: 'sequencer-1974-horn-reel-chorale',
    then: [breathe(0.125, 0.4)],
    ...looped(8, 4, 3, [48, 55, 60, [64, 0.6]]),
  },
  {
    n: 27,
    id: 'worn-flute-reel-dm',
    name: 'Worn flute reel {D}m',
    kind: 'pad',
    description:
      'Flutes from an old strip of tape holding {D} minor, hissing through a four-stage phaser and a long spring.',
    preset: 'sequencer-1974-worn-flute-reel',
    // The whole strip: at the preset's eight seconds the tape ran out under the held chord.
    set: { length: 9, age: 0.4 },
    effects: [
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.125, mix: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 4, 2, [62, 69, [65, 0.6]]),
  },
  {
    n: 28,
    id: 'night-chapel-pipes-am',
    name: 'Night chapel pipes {A}m',
    kind: 'pad',
    description:
      'Far-off pipes on {A} minor, slow to speak, in a hall that breathes in once a loop.',
    preset: 'sequencer-1974-night-chapel-pipes',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 9, mix: 0.45, breathRate: 0.125 },
      },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 6, 3, [45, 52, 57, [60, 0.6]]),
  },
  {
    n: 29,
    id: 'all-stops-flanged-c',
    name: 'All stops flanged {C}',
    kind: 'pad',
    description:
      'Every rank drawn on {C} and {G}, swept by a slow flanger so the upper harmonics rise and fall, in a hall.',
    preset: 'sequencer-1974-all-stops-flanged',
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep', params: { rate: 0.125, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3, breathRate: 0.25 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 3, 2, [48, 55, 60]),
    loopFold: 'linear',
  },
  {
    n: 30,
    id: 'brass-after-hours-d',
    name: 'Brass after hours {D}',
    kind: 'pad',
    description:
      'Synth brass holding {D} and {A}, still opening, through an ensemble chorus into a long plate.',
    preset: 'sequencer-1974-brass-after-hours',
    then: [HELD, { deviceId: 'stereo-widener', params: { width: 0.35 } }, breathe(0.125, 0.5)],
    ...looped(8, 5, 2, [50, 57, 62]),
  },
  {
    n: 31,
    id: 'three-second-swell-em',
    name: 'Three-second swell {E}m',
    kind: 'pad',
    description:
      'A chord of {E} minor that starts dark, takes three seconds to speak and keeps opening, then dies away in a hall.',
    preset: 'sequencer-1974-three-second-swell',
    set: { release: 3 },
    ...played(
      11,
      [
        [0, 6.5, 52],
        [0, 6.5, 59],
        [0, 6.5, 64, 0.8],
        [0, 6.5, 67, 0.6],
      ],
      2.5,
    ),
  },
  {
    n: 32,
    id: 'flanged-string-layer-c',
    name: 'Flanged strings {C}',
    kind: 'pad',
    description:
      'Two bright string layers sixteen cents apart on {C} and {G}, under a wide slow flanger in a plate.',
    preset: 'sequencer-1974-flanged-string-layer',
    effects: [
      { deviceId: 'flanger', preset: 'Wide wash', params: { rate: 0.125 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 4, 2, [60, 67, 72]),
  },
  {
    n: 33,
    id: 'resonant-night-pad-a',
    name: 'Resonant night pad {A}',
    kind: 'pad',
    description:
      'A narrow resonant band that almost sings over {A} and {E}, hollowed by a phaser with negative feedback, in a cathedral.',
    preset: 'sequencer-1974-resonant-night-pad',
    effects: [
      { deviceId: 'phaser', preset: 'Negative notch', params: { rate: 0.125 } },
      hall('Cathedral', 0.35),
    ],
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }, breathe(0.125, 0.5)],
    ...looped(8, 5, 3, [57, 64, 69]),
  },
  {
    n: 34,
    id: 'slow-fold-pad-g',
    name: 'Slow fold pad {G}',
    kind: 'pad',
    description:
      'A chord of {G} major with its overtones folded open, under a slow chorus with long murky repeats.',
    preset: 'sequencer-1974-slow-fold-pad',
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.125, mix: 0.35 } },
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.25 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5, 2, [55, 62, 67, [71, 0.5]]),
  },
  {
    n: 35,
    id: 'slow-reed-sweep-e',
    name: 'Slow reed sweep {E}',
    kind: 'pad',
    description:
      'A chord on {E} and {B} going from a soft reed to a full sawtooth and back once a loop, in a slow rotating speaker.',
    preset: 'sequencer-1974-slow-reed-sweep',
    set: { rate: 0.125 },
    then: [breathe(0.125, 0.4)],
    ...looped(8, 3, 2, [52, 59, 64]),
  },
  {
    n: 36,
    id: 'night-air-flanged-d',
    name: 'Night air, flanged {D}',
    kind: 'pad',
    description:
      'A bright shifting haze of harmonics over {D} and {A}, under a wide flanger in a very large space.',
    preset: 'sequencer-1974-night-air-flanged',
    set: { rate: 0.0625 },
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Wide wash',
        params: { rate: 0.0625, depth: 70, stereo: 60 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
    ],
    then: [breathe(0.0625, 0.45)],
    ...looped(16, 7, 3, [62, 69, 74]),
  },
  {
    n: 37,
    id: 'pulse-width-pad-f',
    name: 'Pulse-width pad {F}',
    kind: 'pad',
    description:
      'A moving pulse wave on {F} major with its own chorus on, through a six-stage phaser into a plate.',
    preset: 'sequencer-1974-pulse-width-pad',
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.125, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.35 } }, breathe(0.125, 0.45)],
    ...looped(8, 4, 2, [53, 60, 65, [69, 0.6]]),
  },
  {
    n: 38,
    id: 'far-muted-bows-em',
    name: 'Far muted bows {E}m',
    kind: 'pad',
    description:
      'Muted bows on {E} minor with no vibrato, far back in a hall and recorded to clean tape.',
    preset: 'sequencer-1974-far-muted-bows',
    set: { bow: 0 },
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5, 3, [52, 59, 64, [67, 0.5]]),
  },
  {
    n: 39,
    id: 'low-brass-turning-a',
    name: 'Low brass turning {A}',
    kind: 'pad',
    description: 'Low brass on {A} and {E}, a section on every key, turned by a phaser in a hall.',
    preset: 'sequencer-1974-low-brass-turning',
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.125, mix: 0.4 } },
      hall('Hall', 0.35),
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 6, 2, [45, 52]),
  },
  {
    n: 40,
    id: 'faded-steel-chord-c',
    name: 'Faded steel chord {C}',
    kind: 'pad',
    description:
      'Steel strings on {C} major faded in with a volume pedal, turning in a slow rotating speaker; it comes round.',
    preset: 'sequencer-1974-faded-steel-chord',
    ...cycled(
      8,
      [
        [0.4, 6.5, 48],
        [0.45, 6.5, 55],
        [0.5, 6.5, 64],
      ],
      { passes: 2 },
    ),
    loopFold: 'power',
  },
  {
    n: 41,
    id: 'back-room-organ-f',
    name: 'Back room organ {F}',
    kind: 'pad',
    description:
      'A nasal reed organ on {F} and {C} shaken by its tremulant, through a small amplifier that hums, with dark repeats.',
    preset: 'sequencer-1974-back-room-organ',
    then: [breathe(0.125, 0.45)],
    ...looped(8, 3, 2, [53, 60]),
  },
  {
    n: 42,
    id: 'piano-swelling-c',
    name: 'Piano swelling {C}',
    kind: 'pad',
    description:
      'An unfelted piano chord of {C} major heard mostly backwards, swelling up to where it was struck, in a long plate.',
    preset: 'sequencer-1974-piano-swelling-to-strike',
    then: [soften(20), { deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...played(
      10,
      [
        [0, 3, 48, 0.7],
        [0.05, 3, 55, 0.6],
        [0.1, 3, 64, 0.6],
      ],
      2.5,
    ),
  },
  {
    n: 43,
    id: 'glass-ripple-d',
    name: 'Glass ripple {D}',
    kind: 'pad',
    description:
      'A glassy {D} and {A} that ripple as they sound, with two tape heads and a spring.',
    preset: 'sequencer-1974-glass-ripple-echo',
    set: { rate: 0.375 },
    then: [breathe(0.125, 0.45)],
    ...looped(8, 3, 2, [62, 69, 74]),
  },

  // Textures: the synthesizer's wind and surf, field sounds made strange, and noise on tape.
  {
    n: 44,
    id: 'synthesizer-wind',
    name: 'Synthesizer wind',
    kind: 'texture',
    description:
      'Noise under a resonant low-pass that opens and closes once a loop, phased, in a very large space.',
    preset: 'sequencer-1974-swept-noise-wind',
    set: { movement: 0.15, resonance: 0.2 },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          slope: 1,
          cutoffHz: 900,
          resonance: 2.5,
          driveDb: 6,
          lfoAmount: 70,
          lfoRateHz: 0.125,
        },
      },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
    ],
    ...looped(8, 6, 3, [60]),
  },
  {
    n: 45,
    id: 'flanged-noise-surf',
    name: 'Flanged noise surf',
    kind: 'texture',
    description:
      'Slow waves of filtered noise breaking and drawing back, a flanger moving inside them, in a long spring.',
    preset: 'sequencer-1974-noise-surf',
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep', params: { rate: 0.0625, mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
    then: [
      {
        deviceId: 'ambient-comp',
        params: { threshold: -50, ratio: 4, attack: 200, release: 2, makeup: 10 },
      },
      { deviceId: 'auto-filter', params: { type: 1, slope: 0, cutoffHz: 25 } },
    ],
    ...looped(16, 6, 3, [60]),
  },
  {
    n: 46,
    id: 'phased-crickets',
    name: 'Phased crickets',
    kind: 'texture',
    description:
      'A far field of crickets smeared into a haze of grains, a slow phaser drawn across it, on a quarter-inch reel.',
    instrument: { deviceId: 'outdoors', preset: 'Evening field', params: { width: 0.6 } },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { scatter: 1, mix: 0.9 } },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { centerHz: 2500, rate: 0.125 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.6, hiss: 0.15, age: 0 } },
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...looped(8, 8, 2, [48, 52, 55, 59, 60, 64, 67, 72]),
  },
  {
    n: 47,
    id: 'jet-over-noise',
    name: 'Jet over noise',
    kind: 'texture',
    description:
      'Noise through wide tuned filters, hardly a chord any more, a jet flanger passing over it once a loop in a plate.',
    preset: 'sequencer-1974-tuned-noise-bands',
    set: { resonance: 8 },
    effects: [
      { deviceId: 'ambient-limiter', params: { gain: 8.5, ceiling: -6 } },
      {
        deviceId: 'flanger',
        preset: 'Classic jet',
        params: { rate: 0.125, stereo: 60, mix: 0.4 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    ...looped(8, 5, 2, [60, 67]),
  },
  {
    n: 48,
    id: 'frozen-wind-phased',
    name: 'Frozen wind, phased',
    kind: 'texture',
    description:
      'Hill wind frozen at one moment and held, a deep phaser turning through it once a loop in a very large space.',
    preset: 'sequencer-1974-loaded-sound-phased',
    source: 'hill-wind',
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.125, mix: 0.45 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...looped(8, 5, 2, [60]),
  },
  {
    n: 49,
    id: 'rain-on-a-slow-reel',
    name: 'Rain on a slow reel',
    kind: 'texture',
    description:
      'Rain on a window read through slowly like a reel dragged by hand, caught on a four-second loop of tape.',
    preset: 'sequencer-1974-reel-by-hand',
    source: 'rain-on-the-window',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4, age: 0 } },
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 4, feedback: 0.5, mix: 0.35 },
      },
    ],
    ...looped(8, 6, 2, [60]),
  },
  {
    n: 50,
    id: 'sample-and-hold-noise',
    name: 'Sample-and-hold noise',
    kind: 'texture',
    description:
      'Wind noise chopped into random filter steps thirteen times a second, with a tape echo and a spring.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: { density: 0.7, movement: 0.1, width: 0.6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Stepped',
        params: { mix: 1, resonance: 5, lfoRateHz: 13 },
      },
      { deviceId: 'tape-echo', params: { time: 280, feedback: 0.3, mix: 0.25 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    ...looped(8, 5, 2, [60]),
  },
  {
    n: 51,
    id: 'crackle-on-the-reel',
    name: 'Crackle on the reel',
    kind: 'texture',
    description:
      'Record crackle read through slowly by hand on a wavering reel, a slow phaser over it, in a long spring.',
    preset: 'sequencer-1974-reel-by-hand',
    source: 'record-crackle',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4, age: 0 } },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, mix: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
    ...looped(8, 6, 2, [60]),
    loopFold: 'linear',
  },
  {
    n: 52,
    id: 'static-under-a-phaser',
    name: 'Static under a phaser',
    kind: 'texture',
    description:
      'Radio static from between two stations, frozen and held, a twelve-stage phaser clouding it in a spring.',
    preset: 'sequencer-1974-loaded-sound-phased',
    source: 'radio-between-stations',
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { rate: 0.125, mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
    ...looped(8, 5, 2, [60]),
  },
  {
    n: 53,
    id: 'far-storm-on-tape',
    name: 'Far storm on tape',
    kind: 'texture',
    description:
      'Far thunder rolling almost without a break, pressed flat onto a quarter-inch reel and left in a long spring.',
    instrument: { deviceId: 'outdoors', preset: 'Far storm', params: { density: 1, width: 0.6 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { age: 0 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
    then: [
      { deviceId: 'fet-limiter', params: { inputGain: 30, outputGain: -12 } },
      {
        deviceId: 'ambient-comp',
        params: { threshold: -60, ratio: 10, attack: 50, release: 1.5, makeup: 24 },
      },
    ],
    ...looped(16, 6, 3, [48]),
  },
  {
    n: 54,
    id: 'rain-under-a-phaser',
    name: 'Rain under a phaser',
    kind: 'texture',
    description:
      'Steady rain on a window with a slow phaser drawn across it once a loop, on hissing tape in a small plate.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: { density: 0.8, movement: 0.2, width: 0.6 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, mix: 0.4 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15, age: 0 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 34, outputGain: -14 } }],
    ...looped(8, 6, 2, [60]),
  },
  {
    n: 55,
    id: 'stream-under-a-flanger',
    name: 'Stream under a flanger',
    kind: 'texture',
    description:
      'A full stream over stones with a jet flanger sweeping through the water once a loop, in a spring tank.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Small stream',
      params: { density: 0.9, width: 0.6 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Classic jet', params: { rate: 0.125, mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
    ...looped(8, 6, 2, [60]),
  },

  // One-shots: one note each of the sequence voices, the bells and bars, the keyboards and the
  // strings, with the long echoes taken off or turned down so the note is heard once.
  {
    n: 56,
    id: 'night-bass-step-e',
    name: 'Night bass step {E}',
    kind: 'oneshot',
    description:
      'One ladder-filter bass note on a low {E}, its filter closing behind it, one tape head answering softly in a small plate.',
    preset: 'sequencer-1974-night-run-bass',
    set: { decay: 1.4, contour: 0.45 },
    effects: [
      soften(12),
      {
        deviceId: 'tape-echo',
        params: { time: 375, feedback: 0.2, wow: 0.2, flutter: 0.12, highCut: 3800, mix: 0.15 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
    ...played(2.5, [[0, 1.2, 40]], 1),
  },
  {
    n: 57,
    id: 'dripping-filter-note-a',
    name: 'Dripping filter {A}',
    kind: 'oneshot',
    description:
      'A low {A} whose filter, close to whistling, yelps open on the note, dripping in a spring tank on tape.',
    preset: 'sequencer-1974-dripping-filter',
    set: { decay: 1.5 },
    effects: [
      soften(20),
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.3 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
    ],
    ...played(3.5, [[0, 1.4, 45]], 1.2),
  },
  {
    n: 58,
    id: 'clang-bell-c',
    name: 'Clang bell {C}',
    kind: 'oneshot',
    description:
      'A clangorous bell on {C} from deep frequency modulation, dulling as it fades, one soft tape echo under it in a plate.',
    preset: 'sequencer-1974-clang-bell-echo',
    effects: [
      { deviceId: 'tape-echo', params: { time: 660, feedback: 0.25, mix: 0.15 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    ...played(8, [[0, 3, 60]], 2.5),
  },
  {
    n: 59,
    id: 'sour-bell-d',
    name: 'Sour ring bell {D}',
    kind: 'oneshot',
    description:
      'A bell on {D} ring-modulated against a fixed tone so that its pitch turns sour, in a plate.',
    preset: 'sequencer-1974-sour-ring-bell',
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Radio ring',
        params: { shift: 196, feedback: 0.1, lfoDepth: 0, mix: 0.5 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
    ...played(5.5, [[0, 2, 62]], 1.5),
  },
  {
    n: 60,
    id: 'opening-gong-stroke-d',
    name: 'Opening gong {D}',
    kind: 'oneshot',
    description:
      'One gong stroke on {D}, the kind that opens a side, recorded to tape and left to spread in a hall.',
    preset: 'sequencer-1974-opening-gong',
    set: { decay: 9, spread: 0.3 },
    // A hall where the preset has its long plate: in the plate the stroke swelled after the
    // beater in one key and read as two strokes in another.
    effects: [soften(10), { deviceId: 'tape', preset: 'Quarter inch' }, hall('Hall', 0.35)],
    ...played(10, [[0, 5, 62]], 4),
  },
  {
    n: 61,
    id: 'slowed-steel-gong-d',
    name: 'Slowed steel gong {D}',
    kind: 'oneshot',
    description:
      'One steel note on {D} with a half-speed copy an octave under it, ringing like a small gong, phased, in a hall.',
    preset: 'sequencer-1974-slowed-steel-gong',
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { spread: 0.5, mix: 0.5 } },
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { stereo: 40, mix: 0.4 } },
      hall('Hall', 0.35),
    ],
    ...played(8.5, [[0, 4, 50]], 3),
  },
  {
    n: 62,
    id: 'struck-metal-bar-a',
    name: 'Struck metal bar {A}',
    kind: 'oneshot',
    description:
      'One struck metal bar on {A}, a four-stage phaser moving over it as it rings in a small plate.',
    preset: 'sequencer-1974-echoing-metal-bars',
    effects: [
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
    ...played(5, [[0, 2, 69]], 1.5),
  },
  {
    n: 63,
    id: 'phased-vibraphone-bar-f',
    name: 'Phased vibraphone {F}',
    kind: 'oneshot',
    description:
      'One vibraphone bar on {F} with the motor turning slowly, through a six-stage phaser in a short room.',
    preset: 'sequencer-1974-phased-vibraphone',
    set: { motor: 0.3 },
    ...played(5, [[0, 2.5, 65]], 2),
  },
  {
    n: 64,
    id: 'celesta-note-e',
    name: 'Celesta note {E}',
    kind: 'oneshot',
    description:
      'One small celesta note on a high {E}, one soft tape echo behind it, in a small plate.',
    preset: 'sequencer-1974-dotted-celesta-pattern',
    // A shorter bar and a harder mallet: at the preset's the note was as loud as a held tone in
    // one key and 7 LU quieter in another.
    set: { decay: 0.5, mallet: 0.7 },
    effects: [
      { deviceId: 'tape-echo', params: { time: 400, feedback: 0.2, heads: 0, mix: 0.1 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
    ...played(2.5, [[0, 0.6, 76]], 1),
  },
  {
    n: 65,
    id: 'phased-tine-d',
    name: 'Phased tine {D}',
    kind: 'oneshot',
    description:
      'One electric piano note on {D} with its tremolo off, a six-stage phaser turning through it in a small plate.',
    preset: 'sequencer-1974-tines-through-phaser',
    // A lighter phaser and a harder strike: at the preset's the sweep put the loudest moment
    // most of a second after the note in one key.
    set: { bark: 0.6 },
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.35, depth: 70, mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...played(4, [[0, 2.5, 62]], 1.5),
  },
  {
    n: 66,
    id: 'bare-grand-note-c',
    name: 'Bare grand {C}',
    kind: 'oneshot',
    description:
      'One hard-hammered unfelted piano note on a low {C}, its other strings ringing on as if pedalled, in a hall.',
    preset: 'sequencer-1974-bare-concert-grand',
    effects: [
      soften(12),
      { deviceId: 'sympathetic', preset: 'Piano pedal', params: { root: 0, mode: 0, mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...played(6.5, [[0, 4, 48]], 2),
  },
  {
    n: 67,
    id: 'plucked-keyboard-note-g',
    name: 'Plucked keyboard {G}',
    kind: 'oneshot',
    description:
      'One string on {G} plucked hard at its very end so it bites, printed hot to tape and lightly phased in a small plate.',
    preset: 'sequencer-1974-plucked-keyboard',
    effects: [
      soften(10),
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.7, hiss: 0.05 } },
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.2, mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
    ...played(4, [[0, 1.5, 55]], 1.5),
  },
  {
    n: 68,
    id: 'brushed-harp-chord-c',
    name: 'Brushed harp chord {C}',
    kind: 'oneshot',
    description:
      'One quick brushed chord of {C} and {G} with a faint pad under it, a phaser crossing as the strings ring out in a hall.',
    preset: 'sequencer-1974-brushed-harp-phased',
    set: { strum: 8, pad: 0.13 },
    ...played(
      6.5,
      [
        [0, 3, 48],
        [0, 3, 55],
        [0, 3, 60],
      ],
      2,
    ),
  },
  {
    n: 69,
    id: 'twelve-string-note-g',
    name: 'Twelve-string note {G}',
    kind: 'oneshot',
    description:
      'One doubled course of a twelve-string picked on {G}, shimmering through a light phaser into a plate.',
    preset: 'sequencer-1974-twelve-string-figure',
    effects: [
      soften(12),
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.6 } },
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.18, mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
    ...played(5, [[0, 3, 55]], 1.5),
  },
  {
    n: 70,
    id: 'inside-the-piano-pluck-c',
    name: 'Inside the piano {C}',
    kind: 'oneshot',
    description:
      'One string on {C} plucked by hand as if inside a piano, the others ringing in sympathy, in a slack spring and a hall.',
    preset: 'sequencer-1974-inside-the-piano',
    // A hall where the preset has its long plate: under this low string the plate came out with
    // the sides louder than the middle five keys down.
    effects: [
      soften(18),
      { deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.3 } },
      hall('Hall', 0.3),
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...played(8, [[0, 4, 48]], 2.5),
  },
  {
    n: 71,
    id: 'hammered-octave-d',
    name: 'Hammered octave {D}',
    kind: 'oneshot',
    description:
      'One hammered stroke on {D} in octaves, the strings left to ring in a small dark room.',
    preset: 'sequencer-1974-hammered-strings-echo',
    set: { strum: 0 },
    effects: [{ deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } }],
    ...played(5.5, [[0, 3, 50]], 2),
  },
  {
    n: 72,
    id: 'second-row-note-c',
    name: 'Second row note {C}',
    kind: 'oneshot',
    description:
      'One dull, hollow pulse on a low {C}, printed hot to tape with one quick echo, in a two-spring tank.',
    preset: 'sequencer-1974-second-row-pulse',
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 18, outputDb: -8 } },
      { deviceId: 'tape-echo', params: { time: 250, feedback: 0.2, mix: 0.1 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    ...played(3, [[0, 1.2, 48]], 1),
  },
  {
    n: 73,
    id: 'steel-step-d',
    name: 'Steel step {D}',
    kind: 'oneshot',
    description:
      'One damped steel tap on {D}, a metallic edge from a frequency shifter and one tape echo after it, in a two-spring tank.',
    preset: 'sequencer-1974-steel-steps',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Bell metal', params: { shift: 98, mix: 0.4 } },
      soften(16),
      { deviceId: 'tape-echo', params: { time: 375, feedback: 0.2, heads: 0, mix: 0.14 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
    ...played(2.5, [[0, 1.5, 62]], 1),
  },
  {
    n: 74,
    id: 'clean-guitar-note-g',
    name: 'Clean guitar note {G}',
    kind: 'oneshot',
    description:
      'One clean neck-pickup note on {G} through a four-stage phaser, one faint tape echo and an amp spring.',
    preset: 'sequencer-1974-clean-guitar-echo',
    effects: [
      soften(22),
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.25, mix: 0.3 } },
      { deviceId: 'tape-echo', params: { time: 440, feedback: 0.2, mix: 0.12 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    ...played(4.5, [[0, 3, 55]], 1.5),
  },
  {
    n: 75,
    id: 'clock-tick-d',
    name: 'Clock tick {D}',
    kind: 'oneshot',
    description:
      'One gated pluck on {D}, pushed into tape saturation, one tape head answering it in a small plate.',
    preset: 'sequencer-1974-clock-ticks-dotted',
    set: { decay: 1 },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 16, outputDb: -8.5 } },
      { deviceId: 'tape-echo', params: { time: 375, feedback: 0.2, heads: 0, mix: 0.14 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
    ...played(2, [[0, 0.9, 62]], 0.8),
  },
  {
    n: 76,
    id: 'top-row-note-a',
    name: 'Top row note {A}',
    kind: 'oneshot',
    description:
      'One squarer sequence note on {A}, printed hot to tape, one tape head answering it in a plate.',
    preset: 'sequencer-1974-top-row-gallop',
    set: { decay: 0.9 },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 12, outputDb: -6.5 } },
      {
        deviceId: 'tape-echo',
        params: { time: 500, feedback: 0.2, heads: 0, highCut: 5000, mix: 0.14 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { decay: 0.5, mix: 0.2 } },
    ],
    ...played(2.5, [[0, 0.9, 57]], 1),
  },
  {
    n: 77,
    id: 'hollow-organ-note-g',
    name: 'Hollow organ note {G}',
    kind: 'oneshot',
    description:
      'One short note on {G} from hollow flute stops with a strong fifth rank, one tape head behind it in a plate.',
    preset: 'sequencer-1974-three-head-organ',
    effects: [
      soften(8),
      { deviceId: 'tape-echo', params: { time: 480, feedback: 0.2, heads: 0, mix: 0.1 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
    ...played(3, [[0, 0.18, 55]], 1),
  },

  // Phrases: the sequence lines and the hands over them. The echoes are shorter than the
  // presets' so that a figure stays a figure; the ones that come round say so.
  {
    n: 78,
    id: 'night-run-figure-e',
    name: 'Night run {E}m',
    kind: 'melodic',
    description:
      'Eight ladder-filter bass notes up from a low {E} and back, one tape head answering each step; it comes round.',
    preset: 'sequencer-1974-night-run-bass',
    set: { decay: 0.8 },
    effects: [
      soften(10),
      {
        deviceId: 'tape-echo',
        params: { time: 480, feedback: 0.2, wow: 0.2, flutter: 0.12, highCut: 3800, mix: 0.18 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
    ],
    ...cycled(8, [
      [0.02, 0.5, 40],
      [0.93, 0.4, 47],
      [1.61, 0.4, 52],
      [2.74, 0.5, 50],
      [3.52, 0.4, 47],
      [4.87, 0.5, 43],
      [5.43, 0.4, 45],
      [6.71, 0.6, 47],
    ]),
  },
  {
    n: 79,
    id: 'top-row-gallop-a',
    name: 'Top row gallop {A}m',
    kind: 'melodic',
    description:
      'Six squarer notes up {A} minor and back, printed hot, a dotted tape echo trailing a short gallop after each.',
    preset: 'sequencer-1974-top-row-gallop',
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 20, outputDb: -10 } },
      {
        deviceId: 'tape-echo',
        params: { time: 500, feedback: 0.25, heads: 3, highCut: 5000, spread: 0.7, mix: 0.25 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { decay: 0.5, mix: 0.2 } },
    ],
    ...played(
      7.5,
      [
        [0, 0.3, 57],
        [0.77, 0.3, 60],
        [1.49, 0.3, 64],
        [2.36, 0.4, 69],
        [3.81, 0.3, 64],
        [4.63, 0.5, 57],
      ],
      2,
    ),
  },
  {
    n: 80,
    id: 'clock-ticks-figure-d',
    name: 'Clock ticks {D}m',
    kind: 'melodic',
    description:
      'Eight short gated plucks round {D} minor pushed into tape saturation, a dotted tape echo filling in; it comes round.',
    preset: 'sequencer-1974-clock-ticks-dotted',
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 16, outputDb: -8.5 } },
      {
        deviceId: 'tape-echo',
        params: { time: 375, feedback: 0.25, heads: 3, spread: 0.6, mix: 0.25 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
    ...cycled(8, [
      [0.02, 0.2, 62],
      [0.83, 0.2, 57],
      [1.47, 0.2, 62],
      [2.59, 0.2, 65],
      [3.36, 0.2, 64],
      [4.71, 0.2, 60],
      [5.28, 0.2, 57],
      [6.63, 0.2, 62],
    ]),
  },
  {
    n: 81,
    id: 'second-row-line-g',
    name: 'Second row line {G}',
    kind: 'melodic',
    description:
      'A dull, hollow pulse walking up from a low {G} and settling on {D}, printed hot to tape with a short echo.',
    preset: 'sequencer-1974-second-row-pulse',
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 18, outputDb: -8 } },
      { deviceId: 'tape-echo', params: { time: 250, feedback: 0.25, mix: 0.2 } },
    ],
    ...played(
      8,
      [
        [0, 0.5, 43],
        [0.91, 0.4, 50],
        [1.73, 0.5, 55],
        [2.88, 0.4, 53],
        [3.62, 0.5, 50],
        [4.79, 0.4, 48],
        [5.57, 0.9, 50],
      ],
      2,
    ),
  },
  {
    n: 82,
    id: 'damped-steel-figure-c',
    name: 'Damped steel {C}',
    kind: 'melodic',
    description:
      'Damped steel-string notes on {C}, its octave and its tenth, each answered by {G}, into three tape heads; it comes round.',
    preset: 'sequencer-1974-damped-steel-pattern',
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 18, outputDb: -10 } },
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 375, feedback: 0.25, mix: 0.2 },
      },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.2 } },
    ],
    ...cycled(8, [
      [0.02, 0.3, 48],
      [0.79, 0.3, 55],
      [1.46, 0.3, 60],
      [2.61, 0.3, 55],
      [3.33, 0.3, 64],
      [4.73, 0.3, 55],
      [5.26, 0.3, 60],
      [6.67, 0.3, 55],
    ]),
  },
  {
    n: 83,
    id: 'twelve-string-line-g',
    name: 'Twelve-string line {G}',
    kind: 'melodic',
    description:
      'A twelve-string picked one note at a time up {G} major and down to {E}, shimmering through a light phaser into a plate.',
    preset: 'sequencer-1974-twelve-string-figure',
    ...played(
      11,
      [
        [0, 1.2, 55],
        [1.07, 1.2, 62],
        [2.31, 1.2, 67],
        [3.18, 1.5, 71],
        [4.93, 1.2, 69],
        [6.02, 1.2, 62],
        [7.16, 2, 64],
      ],
      2,
    ),
  },
  {
    n: 84,
    id: 'clean-guitar-line-c',
    name: 'Clean guitar line {C}',
    kind: 'melodic',
    description:
      'A clean neck pickup picking {C} major slowly through a four-stage phaser, a soft tape echo and a spring; it comes round.',
    preset: 'sequencer-1974-clean-guitar-echo',
    effects: [
      soften(10),
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.25, mix: 0.3 } },
      { deviceId: 'tape-echo', params: { time: 440, feedback: 0.25, mix: 0.2 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    ...cycled(12, [
      [0.02, 2, 48],
      [1.45, 2, 55],
      [2.85, 2, 64],
      [5.4, 2, 62],
      [6.88, 2, 55],
      [8.98, 2.4, 60],
    ]),
  },
  {
    n: 85,
    id: 'plucked-keyboard-run-d',
    name: 'Plucked keyboard run {D}',
    kind: 'melodic',
    description:
      'Strings plucked hard at the very end, a run up {D} minor that turns back on {A}, printed hot and lightly phased.',
    preset: 'sequencer-1974-plucked-keyboard',
    effects: [
      soften(10),
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.7, hiss: 0.05 } },
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.2, mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
    ...played(
      8,
      [
        [0, 0.6, 62],
        [0.67, 0.6, 65],
        [1.21, 0.6, 69],
        [2.14, 0.8, 74],
        [3.02, 0.6, 72],
        [3.59, 0.6, 69],
        [4.46, 0.6, 67],
        [5.13, 1.2, 69],
      ],
      2,
    ),
  },
  {
    n: 86,
    id: 'dotted-celesta-figure-c',
    name: 'Dotted celesta {C}',
    kind: 'melodic',
    description:
      'Six small celesta notes round {C}, {G}, {E} and {D}, a dotted tape echo filling the gaps, in a spring; it comes round.',
    preset: 'sequencer-1974-dotted-celesta-pattern',
    effects: [
      { deviceId: 'tape-echo', params: { time: 400, feedback: 0.25, heads: 3, mix: 0.25 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    ...cycled(8, [
      [0.02, 0.4, 72],
      [0.89, 0.4, 67],
      [1.57, 0.4, 76],
      [2.83, 0.4, 74],
      [4.12, 0.4, 67],
      [5.38, 0.5, 72],
    ]),
  },
  {
    n: 87,
    id: 'echoing-bars-figure-a',
    name: 'Echoing bars {A}m',
    kind: 'melodic',
    description:
      'Five struck metal bars up {A} minor and home again, three tape heads repeating each, a four-stage phaser over them.',
    preset: 'sequencer-1974-echoing-metal-bars',
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { feedback: 0.25, mix: 0.25 } },
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { mix: 0.3 } },
    ],
    ...played(
      10,
      [
        [0, 1, 69],
        [1.27, 1, 72],
        [2.09, 1, 76],
        [3.64, 1, 74],
        [5.11, 1.5, 69],
      ],
      3,
    ),
  },
  {
    n: 88,
    id: 'steel-steps-figure-g',
    name: 'Steel steps {G}',
    kind: 'melodic',
    description:
      'Damped steel taps from {G} to its octave and back by {E} under a frequency shifter and a dotted echo; it comes round.',
    preset: 'sequencer-1974-steel-steps',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Bell metal', params: { shift: 98, mix: 0.3 } },
      soften(12),
      { deviceId: 'tape-echo', params: { time: 375, feedback: 0.25, heads: 3, mix: 0.25 } },
    ],
    ...cycled(8, [
      [0.02, 0.4, 55],
      [0.91, 0.4, 62],
      [1.62, 0.4, 67],
      [3.04, 0.4, 62],
      [4.33, 0.4, 64],
      [5.57, 0.5, 55],
      [6.71, 0.4, 62, 0.7],
    ]),
  },
  {
    n: 89,
    id: 'three-head-strums-c',
    name: 'Three-head strums {C}',
    kind: 'melodic',
    description:
      'Three quick strums, {C} major, {F} major and {C} again, each swept up three octaves into three tape heads.',
    preset: 'sequencer-1974-three-head-strum',
    set: { strum: 5, tone: 0.7, pad: 0 },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 400, feedback: 0.25, mix: 0.25 },
      },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
    ...played(
      8.5,
      [
        [0, 1.8, 48],
        [0, 1.8, 55],
        [0, 1.8, 64],
        [2.37, 1.8, 53],
        [2.37, 1.8, 60],
        [2.37, 1.8, 69],
        [4.91, 2.5, 48],
        [4.91, 2.5, 55],
        [4.91, 2.5, 64],
      ],
      1.5,
    ),
  },
  {
    n: 90,
    id: 'hollow-organ-figure-c',
    name: 'Hollow organ figure {C}',
    kind: 'melodic',
    description:
      'Short hollow organ notes up {C} major to {A} and back down, three soft tape heads behind in a plate; it comes round.',
    preset: 'sequencer-1974-three-head-organ',
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 480, feedback: 0.25, mix: 0.2 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
    ...cycled(8, [
      [0.02, 0.35, 60],
      [0.81, 0.3, 64],
      [1.43, 0.3, 67],
      [2.57, 0.5, 69],
      [3.34, 0.3, 67],
      [4.69, 0.3, 64],
      [5.26, 0.3, 62],
      [6.61, 0.5, 60],
    ]),
    loopFold: 'power',
  },
  {
    n: 91,
    id: 'night-tines-phrase-a',
    name: 'Night tines {A}m',
    kind: 'melodic',
    description:
      'Dark, soft tines from a low {A} up to {C} and settling back, a slow tremolo, a faint dark echo and a hall.',
    preset: 'sequencer-1974-night-tines-echo',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 430, feedback: 0.25, mix: 0.2 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...played(
      12,
      [
        [0, 1.5, 45],
        [1.59, 1.5, 52],
        [2.81, 1.5, 60],
        [4.55, 1.5, 59],
        [5.98, 1.5, 55],
        [7.46, 2.5, 57],
      ],
      3,
    ),
  },
  {
    n: 92,
    id: 'phased-tines-phrase-d',
    name: 'Phased tines {D}m',
    kind: 'melodic',
    description:
      'An electric piano, tremolo off, falling {A}, {F}, {D} and answering {C}, {E}, {D} under a phaser; it comes round.',
    preset: 'sequencer-1974-tines-through-phaser',
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.25, depth: 70 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
    ...cycled(12, [
      [0.02, 2, 69],
      [1.37, 2, 65],
      [2.91, 2.4, 62],
      [5.46, 2, 60],
      [6.73, 2, 64],
      [8.52, 2.6, 62],
    ]),
  },
  {
    n: 93,
    id: 'bare-grand-intro-a',
    name: 'Bare grand intro {A}m',
    kind: 'melodic',
    description:
      'A hard-hammered unfelted piano climbing {A} minor slowly, its strings ringing on as if pedalled, a short echo in a hall.',
    preset: 'sequencer-1974-bare-concert-grand',
    effects: [
      { deviceId: 'sympathetic', preset: 'Piano pedal', params: { root: 9, mode: 1, mix: 0.3 } },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 220, mix: 0.15 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...played(
      12,
      [
        [0, 3, 45],
        [1.42, 3, 52],
        [2.79, 3, 57],
        [4.33, 3, 60],
        [5.61, 3, 64],
        [7.48, 3.5, 62],
      ],
      3,
    ),
  },
  {
    n: 94,
    id: 'hammered-figure-d',
    name: 'Hammered figure {D}m',
    kind: 'melodic',
    description:
      'Hammered strings in octaves up {D} minor and back to {A}, three soft tape heads after each stroke; it comes round.',
    preset: 'sequencer-1974-hammered-strings-echo',
    effects: [
      { deviceId: 'tape-echo', params: { time: 375, feedback: 0.25, heads: 2, mix: 0.2 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
    ...cycled(8, [
      [0.02, 1, 50],
      [0.94, 1, 57],
      [1.71, 1, 62],
      [2.93, 1, 65],
      [4.18, 1, 64],
      [5.37, 1.5, 57],
    ]),
  },
  {
    n: 95,
    id: 'plucked-piano-strings-e',
    name: 'Plucked piano strings {E}',
    kind: 'melodic',
    description:
      'Five single strings plucked by hand inside a piano, {E} minor rising to {A}, the others ringing in sympathy in a plate.',
    preset: 'sequencer-1974-inside-the-piano',
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...played(
      12,
      [
        [0, 3, 52],
        [2, 3, 59],
        [3.21, 3, 67],
        [5.52, 3, 64],
        [7.22, 4, 69],
      ],
      3,
    ),
  },
  {
    n: 96,
    id: 'vibraphone-phrase-f',
    name: 'Vibraphone phrase {F}',
    kind: 'melodic',
    description:
      'Vibraphone bars rocking out from {F} to {C}, to {A}, then {G} and home, motor turning, under a phaser; it comes round.',
    preset: 'sequencer-1974-phased-vibraphone',
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.1667, mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
    ...cycled(12, [
      [0.02, 2, 65],
      [1.46, 2, 72],
      [3.13, 2, 65],
      [4.52, 2.2, 69],
      [6.87, 2, 67],
      [8.41, 2.5, 65],
    ]),
  },
  {
    n: 97,
    id: 'harp-run-c',
    name: 'Harp run {C}',
    kind: 'melodic',
    description:
      'A run up the strings from a low {C} rolled by hand and slowing to the top, caught and held by a long plate.',
    preset: 'sequencer-1974-harp-run-plate',
    set: { sweep: 0 },
    then: [{ deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...played(
      10,
      [
        [0, 2, 48],
        [0.13, 2, 55],
        [0.29, 2, 60],
        [0.48, 2, 64],
        [0.71, 2, 67],
        [0.99, 2, 72],
        [1.33, 2, 76],
        [1.74, 3, 79],
        [2.41, 3, 84],
      ],
      3,
    ),
  },
  {
    n: 98,
    id: 'slide-line-e',
    name: 'Slide line {E}m',
    kind: 'melodic',
    description:
      'A slide guitar picking six notes, {E} up to {A} and down to {D}, with a little valve drive, a soft echo and a plate.',
    preset: 'sequencer-1974-slide-through-echo',
    set: { swell: 0, pick: 0.8 },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.4 } },
      { deviceId: 'tape-echo', params: { time: 480, feedback: 0.25, heads: 1, mix: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    ...played(
      12,
      [
        [0, 1.3, 64],
        [1.56, 1.2, 67],
        [3.02, 1.6, 69],
        [4.93, 1.2, 67],
        [6.37, 1.3, 64],
        [7.94, 2.5, 62],
      ],
      3,
    ),
  },
  {
    n: 99,
    id: 'fuzz-lead-line-e',
    name: 'Fuzz lead {E}m',
    kind: 'melodic',
    description:
      'Five short notes driven into fuzz, {E} up to a high {E} and down to {D}, soft tape heads behind them in a hall.',
    preset: 'sequencer-1974-fuzz-sustain-lead',
    set: { swell: 0, sustain: 4 },
    effects: [
      {
        deviceId: 'analog-drive',
        params: {
          drive: 0.45,
          circuit: 4,
          push: 1,
          lowCut: 120,
          tone: -0.3,
          highCut: 4000,
          output: -5,
        },
      },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { feedback: 0.25, mix: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    ...played(
      10,
      [
        [0, 0.6, 52],
        [1.63, 0.6, 55],
        [3.11, 0.7, 57],
        [4.87, 0.8, 64],
        [6.92, 1, 62],
      ],
      3,
    ),
  },
  {
    n: 100,
    id: 'dripping-filter-line-a',
    name: 'Dripping filter line {A}',
    kind: 'melodic',
    description:
      'Six notes up {A} minor and back to {E}, the filter yelping open on each, dripping in a spring tank on tape.',
    preset: 'sequencer-1974-dripping-filter',
    effects: [
      soften(20),
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.3 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
    ],
    ...played(
      8,
      [
        [0, 0.7, 45],
        [0.93, 0.6, 48],
        [1.65, 0.6, 52],
        [2.93, 0.7, 57],
        [3.76, 0.6, 55],
        [4.9, 1.2, 52],
      ],
      2,
    ),
  },
])
