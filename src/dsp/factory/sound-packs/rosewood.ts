// The sounds of the pack "Rosewood Circles": its presets played, a hundred sounds to
// paint with. Numbers 10001 to 10100.

import { type PatchDevice } from '../../../core/devices/patch'
import { PRESETS } from '../packs/rosewood'
import { type FactorySound } from '../types'
import { breathe, cycled, looped, packSounds, played, quarterTurn, soften } from './recipe'

// A pluck of the tanpura stands well over the strings still ringing, which reads as notes
// and not as a drone: the limiter takes the pluck down and the compressor brings the ringing
// back up behind it.
const LEVELLED: readonly PatchDevice[] = [
  { deviceId: 'fet-limiter', params: { inputGain: 30, outputGain: -12 } },
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
]

// A dry knock is a tall peak over very little: this holds the peak so the body of the
// note comes up with the sound at the bank's level.
const pinned = (gain: number): PatchDevice => ({
  deviceId: 'ambient-limiter',
  preset: 'Pinned',
  params: { gain, release: 0.3, ride: 0 },
})

const room = (mix: number): PatchDevice => ({
  deviceId: 'hall-reverb',
  preset: 'Room',
  params: { mix },
})

export const SOUNDS: readonly FactorySound[] = packSounds('rosewood', 10000, PRESETS, [
  // Drones: rolled bars, reeds, bows and strings held under the patterns.
  {
    n: 1,
    id: 'pedal-under-bars-a',
    name: 'Pedal under bars {A}',
    kind: 'drone',
    description: 'One low {A} on a synthesizer bass with its octave below, plain and close.',
    preset: 'rosewood-pedal-under-bars',
    then: [quarterTurn(8)],
    ...looped(8, 4, 2, [45]),
    tuning: 'whole-cycles',
  },
  {
    n: 2,
    id: 'low-gut-bow-f',
    name: 'Low gut bow {F}',
    kind: 'drone',
    description: 'A low {F} and {C} under a slow heavy bow, all body and rosin, close in a room.',
    preset: 'rosewood-low-gut-bow',
    then: [quarterTurn(8)],
    ...looped(8, 5, 2, [41, [48, 0.8]]),
    tuning: 'whole-cycles',
  },
  // A little less air than the preset has: with more the analysis stops hearing a pitch in the low keys.
  {
    n: 3,
    id: 'bass-reed-breath-a',
    name: 'Bass reed breath {A}',
    kind: 'drone',
    description:
      'Bass clarinets blown under their tone on a low {A}, its {E} and the octave, airy, in a room.',
    preset: 'rosewood-bass-reed-breath',
    set: { breath: 0.6 },
    then: [quarterTurn(8)],
    ...looped(8, 5, 2, [45, [52, 0.8], [57, 0.6]]),
    tuning: 'whole-cycles',
  },
  {
    n: 4,
    id: 'reed-floor-f',
    name: 'Reed floor {F}',
    kind: 'drone',
    description:
      'A harmonium holding {F} and the {C} above it with the bellows kept steady, on tape in a hall.',
    preset: 'rosewood-reed-floor',
    set: { bellows: 0.15, celeste: 0.15 },
    then: [quarterTurn(8)],
    ...looped(8, 5, 2, [41, [48, 0.8]]),
    tuning: 'whole-cycles',
  },
  {
    n: 5,
    id: 'brass-under-gongs-g',
    name: 'Brass under gongs {G}',
    kind: 'drone',
    description:
      'Low brass barely blown on {G} and {D}, one player a note, a soft floor on tape in a hall.',
    preset: 'rosewood-brass-under-the-gongs',
    set: { section: 0 },
    then: [quarterTurn(8)],
    ...looped(8, 7, 2, [43, [50, 0.8]]),
    tuning: 'whole-cycles',
  },
  // The harmonic series over {G}: its fifth partial is {B} and its seventh {F}. Half the movement of the preset.
  {
    n: 6,
    id: 'after-the-gong-g',
    name: 'After the gong {G}',
    kind: 'drone',
    description:
      'The low hum a gong leaves on {G}, its partials rising and falling in an open space.',
    preset: 'rosewood-after-the-gong',
    set: { movement: 0.3 },
    ...looped(8, 8, 3, [43]),
  },
  // The longest strings, and the limiter before the plate: a pluck that stands out of the hum is a hit.
  {
    n: 7,
    id: 'buzzing-bridge-a',
    name: 'Buzzing bridge {A}',
    kind: 'drone',
    description:
      'Four strings on {A} and {E} over a buzzing bridge, plucked in turn and pressed level, on a plate.',
    preset: 'rosewood-buzzing-bridge',
    set: { decay: 30, spread: 0 },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone' },
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } },
      ...LEVELLED,
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
    ...looped(8, 9, 3, [45]),
  },
  // No shake: in some keys the analysis hears each turn of the preset's vibrato as a hit.
  {
    n: 8,
    id: 'court-reed-d',
    name: 'Court reed {D}',
    kind: 'drone',
    description:
      'Three reed pipes on {D}, {A} and the {D} above, blown hard and nasal without a shake, in a hall.',
    preset: 'rosewood-court-reed',
    set: { vibrato: 0 },
    then: [quarterTurn(8)],
    ...looped(8, 4, 2, [[50, 0.6], [57, 0.5], 62]),
    tuning: 'whole-cycles',
  },
  // The upper answer a fifth above in place of the preset's third, so the drone has no third in it,
  // and an octave under the call: lower, the three horns hold their level in every key.
  {
    n: 9,
    id: 'shell-horns-e',
    name: 'Shell horns {E}',
    kind: 'drone',
    description:
      'A horn on a low {E} answered by two more, on the {B} below and the {B} above, in a hall.',
    preset: 'rosewood-shell-horns',
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Diatonic thirds',
        params: {
          root: 2,
          scale: 4,
          v1Degrees: -3,
          v1Level: -6,
          v1Pan: -60,
          v1Delay: 400,
          v2Degrees: 4,
          v2Level: -9,
          v2Pan: 60,
          v2Delay: 500,
          output: 4,
        },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 6, 2, [52]),
    tuning: 'whole-cycles',
  },
  {
    n: 10,
    id: 'low-octave-flutes-b',
    name: 'Low octave flutes {B}',
    kind: 'drone',
    description:
      'Two flutes on {B} played an octave down on a short back-and-forth loop: a dull held tone.',
    preset: 'rosewood-low-octave-loop',
    source: 'flute-octaves-b',
    then: [pinned(24)],
    ...looped(8, 5, 3, [60]),
  },
  {
    n: 11,
    id: 'studio-dusk-dm',
    name: 'Studio dusk {D}m',
    kind: 'drone',
    description:
      'A low-passed chorus pad on {D}, {A} and a high {F}, on tape: the one synthesizer among the wood.',
    preset: 'rosewood-studio-dusk',
    ...looped(8, 5, 3, [38, 45, 57, 65]),
  },
  {
    n: 12,
    id: 'mouth-organ-cluster-a',
    name: 'Mouth organ cluster {A}',
    kind: 'drone',
    description:
      'A reedy cluster of {A}, {B}, {D} and {E} held without movement, as on a bamboo mouth organ.',
    preset: 'rosewood-mouth-organ-cluster',
    set: { detune: 0 },
    then: [quarterTurn(8), pinned(6)],
    ...looped(8, 5, 2, [69, 71, [74, 0.8], [76, 0.8]]),
    tuning: 'whole-cycles',
  },
  // No third and no seventh: a drone, not a chord. The ensemble at half the preset's depth and a limiter:
  // at full depth some keys hear its ripple as hits.
  {
    n: 13,
    id: 'high-string-shade-c',
    name: 'High string shade {C}',
    kind: 'drone',
    description:
      'The top octave of a string ensemble on {C}, {D}, {G} and a high {C}, a thin shade in a hall.',
    preset: 'rosewood-high-string-shade',
    set: { ensemble: 0.3 },
    then: [pinned(4)],
    ...looped(8, 5, 3, [72, 74, 79, 84]),
  },

  // Pads: chords that swell, by a bow, a bellows, a fan or a slow hand.
  // Rolled faster and softer than the preset: at four and a half strokes a second each one is a hit.
  {
    n: 14,
    id: 'held-roll-c',
    name: 'Held roll {C}',
    kind: 'pad',
    description:
      'A chord of {C} held by a fast soft roll on the marimba, swelling once a loop, strings ringing behind.',
    preset: 'rosewood-held-roll',
    set: { roll: 10, mallet: 0.15 },
    then: [breathe(0.125, 0.45)],
    ...looped(8, 4, 3, [48, 55, 64, 67]),
  },
  {
    n: 15,
    id: 'rubbed-rims-a',
    name: 'Rubbed rims {A}',
    kind: 'pad',
    description:
      'Two bronze bowls on {A} and {E} rubbed round their rims, beating slowly, strings humming behind.',
    preset: 'rosewood-rubbed-rim',
    ...looped(8, 8, 3, [57, 64]),
  },
  {
    n: 16,
    id: 'low-bars-rolled-g',
    name: 'Low bars rolled {G}',
    kind: 'pad',
    description:
      'The low {G} and {D} bars of a marimba rolled fast with soft mallets, swelling once a loop in a hall.',
    preset: 'rosewood-low-bars-rolling',
    set: { mallet: 0.15, roll: 16 },
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 3, [43, 50]),
  },
  // Five tones of the preset's cluster: over {A} they are {A}, {B}, {C}, {D} and {E}; the sixth and seventh are black keys.
  {
    n: 17,
    id: 'bowls-left-ringing-a',
    name: 'Bowls left ringing {A}',
    kind: 'pad',
    description:
      'Five close pure tones from {A} up to {E} beating slowly, like bowls left ringing, swelling once a loop.',
    preset: 'rosewood-seven-bowls',
    set: { movement: 0.3, partials: 0.57 },
    then: [breathe(0.125, 0.45)],
    ...looped(8, 9, 3, [69]),
  },
  {
    n: 18,
    id: 'gong-hum-swelling-g',
    name: 'Gong hum swelling {G}',
    kind: 'pad',
    description:
      'The hum a gong leaves on {G} with its partials at their most restless, swelling once in 16 s.',
    preset: 'rosewood-after-the-gong',
    set: { movement: 1, rate: 0.125 },
    then: [breathe(0.0625, 0.5)],
    ...looped(16, 6, 3, [55]),
  },
  {
    n: 19,
    id: 'pump-reeds-g',
    name: 'Pump reeds {G}',
    kind: 'pad',
    description:
      'A small pump organ on {G} and {D} with its reeds out and the bellows breathing, in a small room.',
    preset: 'rosewood-pump-reeds',
    ...looped(8, 4, 3, [43, 55, 62]),
  },
  {
    n: 20,
    id: 'tubes-alone-c',
    name: 'Tubes alone {C}',
    kind: 'pad',
    description:
      'Two hollow {C}s an octave apart beating slowly: resonator tubes without the bars, in a room.',
    preset: 'rosewood-tubes-alone',
    set: { rate: 0.125 },
    ...looped(8, 4, 3, [48, 60]),
  },
  {
    n: 21,
    id: 'wire-without-pick-c',
    name: 'Wire without pick {C}',
    kind: 'pad',
    description:
      'Steel strings on {C}, {G} and {E} with no pick, each swelling in over two seconds; it comes round.',
    preset: 'rosewood-wire-without-pick',
    ...cycled(8, [
      [0.8, 5, 48],
      [2.1, 5, 55],
      [3.7, 4.6, 64],
    ]),
  },
  {
    n: 22,
    id: 'bronze-swell-b',
    name: 'Bronze swell {B}',
    kind: 'pad',
    description:
      'Two ring-modulated {B}s rising like a gong rubbed with a soft beater, then dying away in a hall.',
    preset: 'rosewood-bronze-swell',
    ...played(
      10,
      [
        [0, 5, 47],
        [0, 5, 59],
      ],
      2,
    ),
  },
  {
    n: 23,
    id: 'still-section-dm7',
    name: 'Still section {D}m7',
    kind: 'pad',
    description:
      'Four muted players a note on {D} minor seventh without vibrato, swelling once in 16 s.',
    preset: 'rosewood-still-section',
    then: [breathe(0.0625, 0.45)],
    ...looped(16, 4, 3, [50, 57, 60, 65]),
  },
  {
    n: 24,
    id: 'low-ensemble-f',
    name: 'Low ensemble {F}',
    kind: 'pad',
    description:
      'The bottom octave of a string ensemble on {F} major, dark and swelling, on tape in a room.',
    preset: 'rosewood-low-ensemble',
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5, 3, [41, 48, 57, 60]),
  },
  {
    n: 25,
    id: 'whistling-bows-em',
    name: 'Whistling bows {E}m',
    kind: 'pad',
    description:
      'Four strings bowed lightly on {E}, {B}, {E} and {G}, pale as bowed bars, swelling in a hall.',
    preset: 'rosewood-whistling-bow',
    then: [breathe(0.125, 0.45)],
    ...looped(8, 6, 2, [64, 71, 76, 79]),
  },
  {
    n: 26,
    id: 'bowed-metal-g',
    name: 'Bowed metal {G}',
    kind: 'pad',
    description:
      'A metallic {G} and then {D}, each swelling over three seconds like a cymbal edge under a bow.',
    preset: 'rosewood-bowed-metal',
    then: [pinned(6)],
    ...cycled(8, [
      [0, 5.5, 55],
      [4, 5.5, 62],
    ]),
    loopFold: 'power',
  },
  {
    n: 27,
    id: 'rubbed-wire-am',
    name: 'Rubbed wire {A}m',
    kind: 'pad',
    description:
      'Steel strings on {A} minor with the pick taken away by a swell, rising like a rubbed gong.',
    preset: 'rosewood-rubbed-wire',
    ...played(
      10,
      [
        [0, 7, 45],
        [0, 7, 52],
        [0, 7, 57],
        [0, 7, 60],
        [0, 7, 64],
      ],
      2,
    ),
  },
  {
    n: 28,
    id: 'bowed-bars-c',
    name: 'Bowed bars {C}',
    kind: 'pad',
    description:
      'Metal bars on {C}, {G}, {E} and a high {C}, the strike taken off so each speaks as if bowed.',
    preset: 'rosewood-bowed-bars',
    ...cycled(8, [
      [0, 3, 60],
      [1.7, 3, 67],
      [3.9, 3, 64],
      [5.6, 2, 72],
    ]),
  },
  // Grains from just after the strike, and more of them, so no single grain is heard starting.
  {
    n: 29,
    id: 'held-resonance-d',
    name: 'Held resonance {D}',
    kind: 'pad',
    description:
      'The ring of a gong on {D} a moment after its strike, held still in grains, in a hall.',
    preset: 'rosewood-held-resonance',
    source: 'gong-d',
    set: { position: 0.1, density: 12 },
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...looped(8, 5, 3, [60]),
  },
  {
    n: 30,
    id: 'low-brass-floor-d',
    name: 'Low brass floor {D}',
    kind: 'pad',
    description:
      'A section of low brass on {D}, {A} and {D} barely blown, shifting against itself, on tape.',
    preset: 'rosewood-brass-under-the-gongs',
    ...looped(8, 7, 3, [38, 45, 50]),
  },
  {
    n: 31,
    id: 'slow-fans-rolled-g',
    name: 'Slow fans rolled {G}',
    kind: 'pad',
    description:
      'A vibraphone chord on {G} rolled softly while the fans turn twice a second, on tape in a hall.',
    preset: 'rosewood-slow-fans',
    set: { roll: 9, motor: 1, motorRate: 2, width: 0.9 },
    ...looped(8, 4, 3, [55, 62, 67]),
  },
  // The fastest roll, darker and rounded off: at eleven strokes a second some are counted as hits.
  {
    n: 32,
    id: 'rolled-courses-dm',
    name: 'Rolled courses {D}m',
    kind: 'pad',
    description:
      'Paired strings on {D} minor rolled with two light hammers, rising and sinking once a loop.',
    preset: 'rosewood-rolled-courses',
    set: { roll: 16, brightness: 0.4 },
    then: [soften(12), breathe(0.125, 0.5)],
    ...looped(8, 4, 3, [50, 57, 62, 65]),
  },
  // No bass note, few players and little hiss: with more of any, some keys are heard as noise.
  {
    n: 33,
    id: 'reed-strip-chord-g',
    name: 'Reed strip chord {G}',
    kind: 'pad',
    description:
      'A few reeds off tape holding {G}, {D}, {G} and {B}, a little unsteady, swelling on a plate.',
    preset: 'rosewood-reed-strip-chord',
    set: { hiss: 0.05, players: 0.2, vibrato: 0.1 },
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 3, [55, 62, 67, 71]),
  },
  {
    n: 34,
    id: 'hummed-fifth-e',
    name: 'Hummed fifth {E}',
    kind: 'pad',
    description:
      'Two singers humming {E} and {B} on a closed vowel, swelling once a loop, a chapel singing it back.',
    preset: 'rosewood-hummed-line',
    then: [breathe(0.125, 0.4)],
    ...looped(8, 4, 2, [52, [59, 0.7]]),
  },
  {
    n: 35,
    id: 'low-chant-chord-c',
    name: 'Low chant chord {C}',
    kind: 'pad',
    description:
      'Voices of men on {C}, {G} and {C} on one closed vowel, swelling once in 16 s in a humming hall.',
    preset: 'rosewood-low-chant',
    set: { ensemble: 0 },
    then: [breathe(0.0625, 0.45)],
    ...looped(16, 5, 3, [48, 55, 60]),
  },
  {
    n: 36,
    id: 'shell-horn-call-d',
    name: 'Shell horn call {D}',
    kind: 'pad',
    description:
      'One long {D} blown like a shell trumpet and answered by two horns in {D} minor, dying in a hall.',
    preset: 'rosewood-shell-horns',
    ...played(10, [[0, 4.5, 62]], 2),
  },
  {
    n: 37,
    id: 'slow-downstroke-f',
    name: 'Slow downstroke {F}',
    kind: 'pad',
    description:
      '{F} major seventh and then {C} major, each drawn slowly from the top down across plucked strings.',
    preset: 'rosewood-slow-downstroke',
    ...played(
      12,
      [
        [0, 4.5, 53],
        [0, 4.5, 57],
        [0, 4.5, 60],
        [0, 4.5, 64],
        [4.8, 5, 48],
        [4.8, 5, 55],
        [4.8, 5, 60],
        [4.8, 5, 64],
      ],
      2,
    ),
  },
  {
    n: 38,
    id: 'gut-bows-am',
    name: 'Gut bows {A}m',
    kind: 'pad',
    description:
      'Low strings under slow heavy bows on {A}, {E}, {A} and {C}, swelling once in 16 s in a room.',
    preset: 'rosewood-low-gut-bow',
    then: [quarterTurn(16), breathe(0.0625, 0.5)],
    ...looped(16, 4, 3, [45, 52, 57, 60]),
    tuning: 'whole-cycles',
  },
  {
    n: 39,
    id: 'thin-string-shade-am7',
    name: 'Thin string shade {A}m7',
    kind: 'pad',
    description:
      'The top octave of a string ensemble on {A} minor seventh, swelling once in 16 s in a hall.',
    preset: 'rosewood-high-string-shade',
    then: [breathe(0.0625, 0.5)],
    ...looped(16, 5, 3, [69, 72, 76, 79]),
  },

  // Textures: weather at the studio door, breath, brushes and seeds.
  {
    n: 40,
    id: 'rain-on-broad-leaves',
    name: 'Rain on broad leaves',
    kind: 'texture',
    description:
      'Steady rain on broad leaves outside the studio door, close and dry, on tape in a room.',
    preset: 'rosewood-rain-on-leaves',
    ...looped(8, 3, 2, [60]),
  },
  // Less resonance than the preset: at its own the gusts are whistled notes, and a phrase.
  {
    n: 41,
    id: 'wind-across-cane',
    name: 'Wind across cane',
    kind: 'texture',
    description: 'Wind across cut cane, more air than whistle, rising and dying away in a hall.',
    preset: 'rosewood-wind-in-cane',
    set: { resonance: 0.3, movement: 0.5 },
    ...looped(16, 5, 3, [62]),
  },
  {
    n: 42,
    id: 'wind-across-pipes',
    name: 'Wind across pipes',
    kind: 'texture',
    description:
      'Broad bands of noise like wind across open bamboo pipes, swelling and sinking in a hall.',
    preset: 'rosewood-wind-in-pipes',
    set: { resonance: 30, breatheRate: 0.1875 },
    ...looped(16, 5, 3, [50, 57, 64]),
  },
  {
    n: 43,
    id: 'brushes-on-skin',
    name: 'Brushes on skin',
    kind: 'texture',
    description:
      'Bands of noise rising and falling four times a second, like brushes sweeping a drum skin.',
    preset: 'rosewood-brushed-skin',
    ...looped(8, 3, 2, [50, 57]),
  },
  // Shaken fast and at random depths: the preset's even shake eight times a second is a beat.
  {
    n: 44,
    id: 'shaken-seed-rattle',
    name: 'Shaken seed rattle',
    kind: 'texture',
    description:
      'Filtered noise shaken at random depths about twenty times a second, seeds in a gourd, with a quick echo.',
    preset: 'rosewood-seed-rattle',
    set: { lfo1Shape: 4, lfo1Rate: 21 },
    ...looped(8, 2, 2, [60]),
  },
  {
    n: 45,
    id: 'low-flute-breath-bed',
    name: 'Low flute breath bed',
    kind: 'texture',
    description: 'Low flutes blown so softly they are mostly air, a bed of breath in a hall.',
    preset: 'rosewood-breath-bed',
    ...looped(8, 5, 3, [48, 55, 62]),
  },
  {
    n: 46,
    id: 'rolled-water-grains',
    name: 'Rolled water grains',
    kind: 'texture',
    description:
      'A brook cut to one short grain and repeated fast from the same spot, like a roll of water.',
    preset: 'rosewood-loaded-roll',
    source: 'brook-over-stones',
    ...looped(8, 3, 3, [60]),
  },
  {
    n: 47,
    id: 'stream-by-the-studio',
    name: 'Stream by the studio',
    kind: 'texture',
    description:
      'A stream a little way past the studio door, a steady dull rush with few single bubbles, on tape in a room.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Small stream',
      params: { density: 0.65, distance: 0.5, tone: 0.35, attack: 0.5, width: 0.7 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.6, hiss: 0 } },
      room(0.2),
    ],
    ...looped(8, 3, 2, [64]),
  },
  {
    n: 48,
    id: 'charcoal-brazier',
    name: 'Charcoal brazier',
    kind: 'texture',
    description: 'A small fire of charcoal ticking and crackling close by, in a small dark room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hearth',
      params: { density: 0.5, attack: 0.5, width: 0.6 },
    },
    effects: [soften(18), { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.2 } }],
    ...looped(8, 3, 2, [48]),
  },
  {
    n: 49,
    id: 'rain-on-roof-tiles',
    name: 'Rain on roof tiles',
    kind: 'texture',
    description:
      'Heavy rain on the roof heard from inside, a dense dull hiss on light tape in a small dark room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Distant downpour',
      params: { tone: 0.2, attack: 0.5, width: 0.6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.2 } },
    ],
    ...looped(8, 3, 2, [55]),
  },
  {
    n: 50,
    id: 'thunder-past-the-hills',
    name: 'Thunder past the hills',
    kind: 'texture',
    description:
      'Low rolls of thunder from past the hills, one dying away under the next, ringing on in a hall.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { density: 1, distance: 0.6, tone: 0.5, movement: 0.4, width: 0.7 },
    },
    effects: [soften(14), { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } }],
    ...looped(16, 1, 3, [36, 43, 48]),
  },
  {
    n: 51,
    id: 'bamboo-grove-wind',
    name: 'Bamboo grove wind',
    kind: 'texture',
    description: 'Gusts of wind through a grove, bright and leafy, coming and going in a room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: { density: 0.6, movement: 0.8, tone: 0.65, attack: 0.5, width: 0.6 },
    },
    effects: [room(0.2)],
    ...looped(16, 4, 3, [67]),
  },

  // One-shots: one stroke on bronze, wood, steel or string, left to ring out.
  {
    n: 52,
    id: 'great-gong-b',
    name: 'Great gong {B}',
    kind: 'oneshot',
    description:
      'A large gong on {B} struck off centre with a heavy beater, the crash settling into a long hum.',
    preset: 'rosewood-great-gong',
    ...played(10, [[0, 8, 47]], 1.5),
  },
  {
    n: 53,
    id: 'struck-bowl-g',
    name: 'Struck bowl {G}',
    kind: 'oneshot',
    description:
      'A bronze bowl on {G} struck with a wooden stick: two close tones beating slowly in a hall.',
    preset: 'rosewood-struck-bowl',
    ...played(8, [[0, 6, 55]], 1.5),
  },
  // Struck where the bell's major third has its node: over {D} every partial left is a white key.
  {
    n: 54,
    id: 'hanging-bell-d',
    name: 'Hanging bell {D}',
    kind: 'oneshot',
    description:
      'A bronze temple bell on {D} struck by a swinging beam: a soft thud and a dark hum in a hall.',
    preset: 'rosewood-hanging-bell',
    set: { position: 0.667 },
    ...played(12, [[0, 9, 50]], 2),
  },
  // Without the preset's echo: in some keys its repeats every third of a second are strokes of their own.
  {
    n: 55,
    id: 'kettle-gong-d',
    name: 'Kettle gong {D}',
    kind: 'oneshot',
    description:
      'A small bossed gong on {D} struck once near its edge, with a short ring, alone in a room.',
    preset: 'rosewood-kettle-gongs',
    effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } }],
    then: [pinned(6)],
    ...played(4, [[0, 2, 62]], 1),
  },
  {
    n: 56,
    id: 'centre-note-e',
    name: 'Centre note {E}',
    kind: 'oneshot',
    description:
      'The low centre note of a handpan on {E} struck with the flat of the hand, strings humming after.',
    preset: 'rosewood-centre-note',
    ...played(10, [[0, 6, 52]], 2),
  },
  {
    n: 57,
    id: 'slit-log-f',
    name: 'Slit log {F}',
    kind: 'oneshot',
    description:
      'A tongue drum on {F} damped short and struck firmly so it knocks like a slit log.',
    preset: 'rosewood-slit-log',
    then: [pinned(8)],
    ...played(3, [[0, 1.5, 53]], 0.5),
  },
  {
    n: 58,
    id: 'answering-steel-d',
    name: 'Answering steel {D}',
    kind: 'oneshot',
    description:
      'A {D} touched as lightly as the pan will speak, its octave and twelfth ringing in a still room.',
    preset: 'rosewood-answering-steel',
    ...played(8, [[0, 5, 62]], 1.5),
  },
  {
    n: 59,
    id: 'motor-off-chord-fmaj7',
    name: 'Motor off chord {F}maj7',
    kind: 'oneshot',
    description:
      'One chord of {F} major seventh on a vibraphone with its fans stopped, into a short plate.',
    preset: 'rosewood-motor-off',
    ...played(
      6,
      [
        [0, 4, 53],
        [0.01, 4, 57],
        [0.02, 4, 60],
        [0.03, 4, 64],
      ],
      1,
    ),
  },
  {
    n: 60,
    id: 'slow-fans-b',
    name: 'Slow fans {B}',
    kind: 'oneshot',
    description:
      'One {B} on a vibraphone with the fans turning slowly, the tone throbbing on tape in a hall.',
    preset: 'rosewood-slow-fans',
    ...played(6, [[0, 4, 59]], 1),
  },
  {
    n: 61,
    id: 'sine-gong-a',
    name: 'Sine gong {A}',
    kind: 'oneshot',
    description:
      'Two sines a twelfth apart on a low {A}, pushed out of tune until they clang like a small gong.',
    preset: 'rosewood-sine-gong',
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }, pinned(6)],
    ...played(8, [[0, 4, 45]], 1.5),
  },
  // The pair closer in tune and narrowed: at the preset's detune some keys cancel in mono.
  {
    n: 62,
    id: 'bronze-pot-c',
    name: 'Bronze pot {C}',
    kind: 'oneshot',
    description:
      'One high {C} of a rack of small bronze pots, a slow beat between its detuned pair, on tape.',
    preset: 'rosewood-bronze-pots',
    set: { detune: 3 },
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }],
    ...played(8, [[0, 4, 72]], 1.5),
  },
  // Without the preset's tape echo: its repeats every half second are a beat.
  {
    n: 63,
    id: 'big-drum-d',
    name: 'Big drum {D}',
    kind: 'oneshot',
    description:
      'One thump on a synthesizer bass tuned to a low {D} like a big skin drum, in a gated reverb.',
    preset: 'rosewood-big-drum',
    effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { lowCut: 40, mix: 0.3 } }],
    then: [pinned(10)],
    ...played(2, [[0, 0.5, 38]], 0.5),
  },
  // Without the preset's echo, which fills in a pattern of its own.
  {
    n: 64,
    id: 'temple-block-g',
    name: 'Temple block {G}',
    kind: 'oneshot',
    description:
      'One short hollow knock tuned to {G} like a wooden temple block, in a small dark room.',
    preset: 'rosewood-temple-blocks',
    effects: [{ deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.2 } }],
    then: [pinned(6)],
    ...played(2, [[0, 0.3, 67]], 0.5),
  },
  {
    n: 65,
    id: 'gated-mallet-c',
    name: 'Gated mallet {C}',
    kind: 'oneshot',
    description:
      'A pure high {C} struck through a gate that darkens as it fades: an electronic marimba in a room.',
    preset: 'rosewood-gated-mallet',
    set: { chance: 0 },
    then: [pinned(4)],
    ...played(4, [[0, 1, 72]], 0.5),
  },
  {
    n: 66,
    id: 'felt-hammer-string-e',
    name: 'Felt hammer string {E}',
    kind: 'oneshot',
    description:
      'One low {E} string under a felt hammer: a soft knock and a dull long tone, on tape in a room.',
    preset: 'rosewood-felt-hammer-string',
    ...played(8, [[0, 5, 40]], 1.5),
  },
  // A plain room in place of the preset's far microphone, whose level changes from key to key.
  {
    n: 67,
    id: 'mid-string-b',
    name: 'Mid string {B}',
    kind: 'oneshot',
    description:
      'A harp string on {B} plucked softly at its middle, hollow and long, alone in a room.',
    preset: 'rosewood-mid-string',
    effects: [room(0.25)],
    ...played(6, [[0, 5, 71]], 1),
  },
  // Without the preset's cascade: in some keys its copies a quarter second apart are strokes of their own.
  {
    n: 68,
    id: 'single-plate-f',
    name: 'Single plate {F}',
    kind: 'oneshot',
    description:
      'One plucked chime on {F} with no strum, bright and slow to fade, on a small plate.',
    preset: 'rosewood-single-plates',
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } }],
    ...played(3, [[0, 2.5, 65]], 0.5),
  },
  {
    n: 69,
    id: 'tine-vibraphone-em',
    name: 'Tine vibraphone {E}m',
    kind: 'oneshot',
    description:
      'One chord of {E} minor on an electric piano voiced all bell, with a slow tremolo, on a plate.',
    preset: 'rosewood-tine-vibraphone',
    ...played(
      6,
      [
        [0, 4, 52],
        [0.01, 4, 59],
        [0.02, 4, 64],
        [0.03, 4, 67],
      ],
      1,
    ),
  },
  {
    n: 70,
    id: 'wedged-strings-d',
    name: 'Wedged strings {D}',
    kind: 'oneshot',
    description:
      'One low {D} on a piano with stiff, mistuned strings and hard hammers, clanking like struck metal.',
    preset: 'rosewood-wedged-strings',
    then: [pinned(5)],
    ...played(6, [[0, 4, 38]], 1),
  },
  // Drawn quicker than the preset: at four tenths of a second the strum is a swell, not a stroke.
  {
    n: 71,
    id: 'open-strum-gsus2',
    name: 'Open strum {G}sus2',
    kind: 'oneshot',
    description:
      'A thumb drawn once across an open tuning on {G}, {A} and {D}, left to ring through a plate.',
    preset: 'rosewood-open-strum',
    set: { strum: 90 },
    then: [pinned(6)],
    ...played(10, [[0, 6, 43]], 2),
  },
  {
    n: 72,
    id: 'sunk-drum-d',
    name: 'Sunk drum {D}',
    kind: 'oneshot',
    description:
      'A tongue drum on {D} whose note comes back an octave lower and half as fast underneath it.',
    preset: 'rosewood-sunk-drum',
    then: [pinned(6)],
    ...played(8, [[0, 4, 62]], 1.5),
  },
  {
    n: 73,
    id: 'stopped-string-g',
    name: 'Stopped string {G}',
    kind: 'oneshot',
    description:
      'One harp string on {G} stopped with the palm, dry as a wooden bar, with two soft repeats off tape.',
    preset: 'rosewood-stopped-harp',
    ...played(3, [[0, 1, 55]], 0.5),
  },
  // Without the preset's tape loop, which brings the bar back two seconds later as a second stroke.
  {
    n: 74,
    id: 'bar-without-knock-a',
    name: 'Bar without knock {A}',
    kind: 'oneshot',
    description:
      'One marimba bar on {A} touched so softly there is no knock, only the tube, on a small plate.',
    preset: 'rosewood-two-passes',
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } }],
    ...played(3, [[0, 2, 57]], 0.5),
  },
  {
    n: 75,
    id: 'plectrum-snap-a',
    name: 'Plectrum snap {A}',
    kind: 'oneshot',
    description:
      'One low {A} on a steel string struck near the bridge with a broad plectrum, thin and short.',
    preset: 'rosewood-broad-plectrum-strings',
    then: [pinned(4)],
    ...played(4, [[0, 3, 45]], 1),
  },

  // Phrases: figures that come round on themselves, then lines that end.
  {
    n: 76,
    id: 'yarn-pattern-am',
    name: 'Yarn pattern {A}m',
    kind: 'melodic',
    description:
      'A soft marimba figure in {A} minor with an echo close behind, two patterns turning; it comes round.',
    preset: 'rosewood-yarn-pattern',
    ...cycled(8, [
      [0, 1, 57, 0.7],
      [0.58, 0.8, 64, 0.55],
      [1.21, 0.8, 60, 0.6],
      [2.04, 1, 67, 0.65],
      [3.17, 0.8, 64, 0.5],
      [3.69, 1, 69, 0.7],
      [4.93, 0.8, 62, 0.55],
      [5.71, 1.2, 60, 0.6],
    ]),
  },
  {
    n: 77,
    id: 'gourd-bars-c',
    name: 'Gourd bars {C}',
    kind: 'melodic',
    description:
      'Hard sticks on dry buzzing bars: three notes up from {C}, a high {A}, and the way back down.',
    preset: 'rosewood-gourd-bars',
    then: [pinned(14)],
    ...cycled(8, [
      [0, 0.4, 72, 0.7],
      [0.37, 0.4, 76, 0.6],
      [0.81, 0.4, 79, 0.65],
      [1.74, 0.5, 81, 0.7],
      [3.02, 0.4, 79, 0.55],
      [3.44, 0.4, 76, 0.6],
      [4.19, 0.6, 74, 0.6],
      [5.33, 0.8, 72, 0.65],
    ]),
  },
  {
    n: 78,
    id: 'koto-figure-e',
    name: 'Koto figure {E}',
    kind: 'melodic',
    description:
      'A koto climbs from a low {E} through {F}, {A} and {B} to {C} and falls back, echoes weaving behind.',
    preset: 'rosewood-koto-figure',
    then: [pinned(6)],
    ...cycled(8, [
      [0, 1.5, 52, 0.7],
      [0.77, 1.2, 64, 0.6],
      [1.29, 1.2, 65, 0.55],
      [2.18, 1.5, 69, 0.65],
      [3.61, 1.2, 71, 0.6],
      [4.07, 1.5, 72, 0.7],
      [5.42, 1.8, 69, 0.55],
    ]),
  },
  // The first pluck a fiftieth of a second in: on the first sample its snap is a step at the seam.
  {
    n: 79,
    id: 'stopped-harp-g',
    name: 'Stopped harp {G}',
    kind: 'melodic',
    description:
      'Harp strings stopped with the palm, an arpeggio on {G} opening and closing over two tape heads.',
    preset: 'rosewood-stopped-harp',
    ...cycled(8, [
      [0.02, 0.5, 55, 0.7],
      [0.51, 0.5, 62, 0.55],
      [0.95, 0.5, 67, 0.6],
      [1.88, 0.5, 71, 0.6],
      [2.73, 0.5, 69, 0.5],
      [3.96, 0.5, 67, 0.6],
      [4.44, 0.5, 62, 0.55],
      [5.59, 0.6, 64, 0.6],
    ]),
  },
  {
    n: 80,
    id: 'hammered-figure-d',
    name: 'Hammered figure {D}',
    kind: 'melodic',
    description:
      'Light hammers on paired strings: an octave on {D}, three notes up and two back; it comes round.',
    preset: 'rosewood-hammered-figure',
    then: [pinned(6)],
    ...cycled(8, [
      [0, 1.5, 50, 0.65],
      [0.06, 1.5, 62, 0.6],
      [1.37, 1.2, 65, 0.55],
      [2.12, 1.2, 69, 0.6],
      [3.58, 1.5, 67, 0.55],
      [5.03, 1.5, 64, 0.6],
    ]),
  },
  {
    n: 81,
    id: 'thirteen-strings-a',
    name: 'Thirteen strings {A}',
    kind: 'melodic',
    description:
      'A long zither picked near the bridge, falling from a high {E} through {C}, {B} and {A} to a low {A}.',
    preset: 'rosewood-thirteen-strings',
    then: [pinned(6)],
    ...cycled(8, [
      [0, 2, 76, 0.7],
      [0.83, 1.5, 72, 0.55],
      [1.47, 1.5, 71, 0.6],
      [2.71, 2, 69, 0.65],
      [4.12, 1.5, 65, 0.55],
      [4.89, 2.5, 64, 0.65],
      [6.31, 1.5, 57, 0.6],
    ]),
  },
  // Played below middle {C}: higher up the felt takes so much from a soft note that some keys are very quiet.
  {
    n: 82,
    id: 'felt-ostinato-c',
    name: 'Felt ostinato {C}',
    kind: 'melodic',
    description:
      'A felted piano figure rising through {C} major and falling to a low {G}, looping softly under itself.',
    preset: 'rosewood-felt-ostinato',
    then: [pinned(4)],
    ...cycled(8, [
      [0, 1.2, 48, 0.6],
      [0.52, 1, 52, 0.5],
      [1.09, 1, 55, 0.55],
      [1.58, 1.4, 60, 0.6],
      [2.83, 1, 55, 0.5],
      [3.37, 1, 52, 0.5],
      [4.41, 1.2, 50, 0.55],
      [5.02, 1.6, 43, 0.6],
    ]),
  },
  {
    n: 83,
    id: 'slipping-tines-f',
    name: 'Slipping tines {F}',
    kind: 'melodic',
    description:
      'Soft dark tines from a low {F} up to {E} and round {B} and {A}, an echo slipping across them.',
    preset: 'rosewood-slipping-tines',
    ...cycled(8, [
      [0, 1.5, 53, 0.65],
      [0.94, 1.2, 60, 0.55],
      [1.63, 1.2, 64, 0.6],
      [2.87, 1.5, 59, 0.55],
      [4.22, 1.2, 57, 0.6],
      [5.18, 1.5, 60, 0.55],
    ]),
  },
  {
    n: 84,
    id: 'square-figure-em',
    name: 'Square figure {E}m',
    kind: 'melodic',
    description:
      'Short square-wave notes opening {E} minor upward and stepping back, with dark repeats and a spring.',
    preset: 'rosewood-square-figure',
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }],
    ...cycled(8, [
      [0, 0.3, 52, 0.7],
      [0.68, 0.3, 59, 0.55],
      [1.21, 0.3, 64, 0.6],
      [2.35, 0.3, 67, 0.6],
      [3.52, 0.3, 62, 0.55],
      [4.83, 0.3, 59, 0.6],
    ]),
  },
  {
    n: 85,
    id: 'thumb-piano-round-g',
    name: 'Thumb piano round {G}',
    kind: 'melodic',
    description:
      'Two thumbs in turn on buzzing metal tongues, circling {G} major in a still room; it comes round.',
    preset: 'rosewood-thumb-piano',
    ...cycled(8, [
      [0, 1, 67, 0.7],
      [0.41, 1, 74, 0.55],
      [0.97, 1, 71, 0.6],
      [1.52, 1, 79, 0.6],
      [2.64, 1, 76, 0.55],
      [3.11, 1, 72, 0.6],
      [4.03, 1, 74, 0.6],
      [5.21, 1.2, 67, 0.6],
      [5.66, 1, 62, 0.5],
    ]),
  },
  {
    n: 86,
    id: 'edge-and-patter-d',
    name: 'Edge and patter {D}',
    kind: 'melodic',
    description:
      'Knuckles on the edge of a pan, a short figure round {D} scattered by a patter of close echoes.',
    preset: 'rosewood-edge-and-patter',
    then: [pinned(8)],
    ...cycled(
      8,
      [
        [0, 0.8, 62, 0.7],
        [0.53, 0.6, 69, 0.5],
        [1.44, 0.8, 65, 0.6],
        [2.62, 0.6, 67, 0.55],
        [3.19, 0.8, 72, 0.6],
        [4.71, 1, 69, 0.6],
        [5.47, 0.8, 62, 0.55],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 87,
    id: 'restruck-bars-a',
    name: 'Restruck bars {A}',
    kind: 'melodic',
    description:
      'Small steel bars: {A}, {C}, {E} and {D}, each restruck by a cascade, quieter and an octave up.',
    preset: 'rosewood-restruck-bars',
    ...cycled(8, [
      [0, 1, 81, 0.7],
      [1.37, 1, 84, 0.6],
      [2.21, 1, 88, 0.65],
      [4.08, 1.5, 86, 0.6],
    ]),
  },
  {
    n: 88,
    id: 'two-passes-f',
    name: 'Two passes {F}',
    kind: 'melodic',
    description:
      'Four bars touched with no knock, {F}, {C}, {A} and {E}, laid over themselves on a two-second tape loop.',
    preset: 'rosewood-two-passes',
    ...cycled(8, [
      [0, 2, 53, 0.6],
      [2.13, 2, 60, 0.55],
      [4.31, 2, 57, 0.6],
      [6.17, 1.5, 64, 0.5],
    ]),
  },
  {
    n: 89,
    id: 'strings-behind-c',
    name: 'Strings behind {C}',
    kind: 'melodic',
    description:
      'Short plucks round {C} that stop at once, leaving the sympathetic strings ringing behind them.',
    preset: 'rosewood-strings-behind',
    then: [pinned(8)],
    ...cycled(8, [
      [0, 0.2, 60, 0.7],
      [1.03, 0.2, 67, 0.6],
      [1.89, 0.2, 64, 0.6],
      [3.36, 0.2, 72, 0.65],
      [4.58, 0.2, 69, 0.55],
      [5.41, 0.3, 62, 0.6],
    ]),
  },
  {
    n: 90,
    id: 'stopped-nylon-e',
    name: 'Stopped nylon {E}',
    kind: 'melodic',
    description:
      'Nylon strings choked into dry knocks, an uneven figure round {E} and {B} with a plain repeat behind.',
    preset: 'rosewood-stopped-nylon',
    then: [pinned(10)],
    ...cycled(8, [
      [0, 0.3, 52, 0.7],
      [0.44, 0.3, 59, 0.55],
      [1.31, 0.3, 64, 0.6],
      [2.07, 0.3, 62, 0.55],
      [3.52, 0.3, 57, 0.6],
      [4.77, 0.3, 59, 0.6],
    ]),
  },
  {
    n: 91,
    id: 'bridge-taps-b',
    name: 'Bridge taps {B}',
    kind: 'melodic',
    description:
      'A koto plucked at the bridge and damped, pushed into grit: {B} twice, up to {E} and down to rest.',
    preset: 'rosewood-bridge-taps',
    then: [pinned(10)],
    ...played(
      8,
      [
        [0, 0.5, 71, 0.7],
        [0.33, 0.4, 71, 0.5],
        [0.89, 0.5, 76, 0.6],
        [1.93, 0.5, 72, 0.55],
        [2.41, 0.4, 71, 0.6],
        [3.67, 0.6, 69, 0.65],
        [4.92, 0.5, 64, 0.6],
      ],
      1,
    ),
  },
  {
    n: 92,
    id: 'wooden-bird-calls-e',
    name: 'Wooden bird calls {E}',
    kind: 'melodic',
    description:
      'Short calls on a wooden whistle high over {E}, each scooping up, with stray calls drifting back.',
    preset: 'rosewood-painted-birds',
    ...played(
      10,
      [
        [0, 0.25, 88, 0.7],
        [0.41, 0.2, 91, 0.6],
        [1.62, 0.3, 88, 0.65],
        [3.08, 0.2, 93, 0.6],
        [3.39, 0.25, 91, 0.6],
        [5.14, 0.4, 88, 0.6],
      ],
      2,
    ),
  },
  // No {B} in the line: a fifth over it or a fourth under it is a black key.
  {
    n: 93,
    id: 'small-canon-c',
    name: 'Small canon {C}',
    kind: 'melodic',
    description:
      'Five palm-muted steel notes from {C}, each answered by copies a fifth above and a fourth below.',
    preset: 'rosewood-small-canon',
    then: [pinned(6)],
    ...played(
      7,
      [
        [0, 0.4, 60, 0.7],
        [0.93, 0.4, 64, 0.6],
        [1.61, 0.4, 62, 0.6],
        [3.04, 0.4, 67, 0.65],
        [4.27, 0.5, 60, 0.6],
      ],
      1,
    ),
  },
  // The {E} is still down when the {F} comes, so the string is pressed up to it and not picked again.
  {
    n: 94,
    id: 'pressed-string-g',
    name: 'Pressed string {G}',
    kind: 'melodic',
    description:
      'Picked steel: a held {G} under {E} pressed up to {F}, then a {D} and the {G} again, in a spring.',
    preset: 'rosewood-pressed-string',
    then: [pinned(6)],
    ...played(
      10,
      [
        [0, 4.2, 55, 0.7],
        [0.05, 2.6, 64, 0.6],
        [1.61, 2.6, 65, 0.6],
        [4.4, 3, 62, 0.65],
        [6.23, 2.2, 55, 0.6],
      ],
      2,
    ),
  },
  // The bar is a {G}: the keys move it to {D}, {C} and {A}, never to a {B}, which would be an F sharp.
  {
    n: 95,
    id: 'loaded-bar-answered-g',
    name: 'Loaded bar answered {G}',
    kind: 'melodic',
    description:
      'A marimba bar played from a sampler as five notes, each answered by a dark echo behind it.',
    preset: 'rosewood-one-hit-answered',
    source: 'marimba-g',
    ...played(
      8,
      [
        [0, 1.5, 60, 0.7],
        [1.27, 1.5, 67, 0.6],
        [2.11, 1.5, 65, 0.6],
        [3.74, 2, 62, 0.65],
        [5.02, 2, 60, 0.6],
      ],
      1,
    ),
  },
  {
    n: 96,
    id: 'plectrum-strings-a',
    name: 'Plectrum strings {A}',
    kind: 'melodic',
    description:
      'Steel strings snapped with a broad plectrum: up {A} minor from a low {A}, a turn, and back down.',
    preset: 'rosewood-broad-plectrum-strings',
    ...played(
      8,
      [
        [0, 1, 45, 0.7],
        [0.72, 0.8, 52, 0.6],
        [1.19, 0.8, 57, 0.6],
        [2.31, 1, 60, 0.65],
        [2.83, 0.8, 59, 0.55],
        [3.94, 2, 57, 0.65],
        [5.37, 2.5, 45, 0.6],
      ],
      1,
    ),
  },
  // Tongued harder than the preset, so each note of the call is heard to start.
  {
    n: 97,
    id: 'far-bamboo-call-d',
    name: 'Far bamboo call {D}',
    kind: 'melodic',
    description:
      'A bamboo flute at the far end of a stone hall: {D}, a long {A} and a {G} left hanging.',
    preset: 'rosewood-far-bamboo',
    set: { attack: 0.01, chiff: 1 },
    ...played(
      12,
      [
        [0, 2.2, 62, 0.75],
        [2.63, 3.2, 69, 0.8],
        [6.9, 2.4, 67, 0.75],
      ],
      2.5,
    ),
  },
  // With less breath than the preset: at its own the line is more air than pitch.
  {
    n: 98,
    id: 'bamboo-breath-fall-a',
    name: 'Bamboo breath fall {A}',
    kind: 'melodic',
    description:
      'An end-blown bamboo flute falling {A}, {G}, {E}, {D}, scooping into each note, in a whispering hall.',
    preset: 'rosewood-bamboo-breath',
    set: { breath: 0.35 },
    ...played(
      10,
      [
        [0, 2.2, 69, 0.75],
        [2.41, 1.1, 67, 0.7],
        [3.62, 2.6, 64, 0.75],
        [6.3, 2.2, 62, 0.7],
      ],
      1.5,
    ),
  },
  // The bow stops between notes: with the preset's half second of release some keys heard only two of the five.
  {
    n: 99,
    id: 'spike-fiddle-e',
    name: 'Spike fiddle {E}',
    kind: 'melodic',
    description:
      'One bowed fiddle with a wide shake climbing {E}, {G}, {A} to a long {B} and falling home.',
    preset: 'rosewood-spike-fiddle',
    set: { attack: 0.05, release: 0.15 },
    ...played(
      10,
      [
        [0, 1.6, 64, 0.7],
        [1.78, 0.7, 67, 0.6],
        [2.61, 0.6, 69, 0.6],
        [3.36, 2.4, 71, 0.7],
        [6.05, 2, 64, 0.6],
      ],
      1.5,
    ),
  },
  // A whole tone of bend from {G}, {A}, {C} and {D}: each lands on a white key, as the preset's three quarters do not.
  // The press comes 80 ms after the pluck and stays, so what is heard is the note a tone above the one written.
  {
    n: 100,
    id: 'pressed-silk-a',
    name: 'Pressed silk {A}',
    kind: 'melodic',
    description:
      'Silk strings plucked softly and pressed behind the bridge, each bent up a tone to {A}, {B}, {D}, {B} and a low {E}.',
    preset: 'rosewood-pressed-silk',
    set: { bend: 200 },
    then: [pinned(10)],
    ...played(
      10,
      [
        [0, 2, 67, 0.7],
        [1.37, 1.5, 69, 0.6],
        [2.44, 2, 72, 0.65],
        [4.18, 1.5, 69, 0.55],
        [5.03, 3, 62, 0.65],
      ],
      1.5,
    ),
  },
])
