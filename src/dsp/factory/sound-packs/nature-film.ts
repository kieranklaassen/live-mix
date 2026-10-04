// The sounds of the pack "Faded Nature Film": its presets played, a hundred sounds to
// paint with. Numbers 5001 to 5100.

import { PRESETS } from '../packs/nature-film'
import { type FactorySound } from '../types'
import { breathe, cycled, looped, packSounds, played, quarterTurn } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('nature-film', 5000, PRESETS, [
  // Drones: one note, or a note with its fifth or octaves, held under the picture.
  {
    n: 1,
    id: 'peat-water-bass-e',
    name: 'Peat water bass {E}',
    kind: 'drone',
    description:
      'A low {E} with its fifth and octave on a square wave over its sub octave, dark, in a room.',
    preset: 'nature-film-peat-water-bass',
    // The octave is what is heard as the pitch in the low keys, where the root alone is a rumble.
    ...looped(8, 5, 3, [40, [47, 0.4], [52, 0.6]]),
  },
  {
    n: 2,
    id: 'underfloor-hum-a',
    name: 'Underfloor hum {A}',
    kind: 'drone',
    description: 'One soft sub tone on {A} with little above it, over the faint hum of the room.',
    preset: 'nature-film-underfloor-hum',
    then: [quarterTurn(8)],
    ...looped(8, 4, 2, [45]),
    tuning: 'whole-cycles',
  },
  {
    n: 3,
    id: 'moorland-hum-d',
    name: 'Moorland hum {D}',
    kind: 'drone',
    description: 'A dark minor drone on {D} with its sub octave, under a slow phaser, on tape.',
    preset: 'nature-film-moorland-hum',
    // Its partials wander far less than the preset's, and the phaser is fainter and goes once
    // round the loop: the level holds in every key.
    set: { movement: 0.05 },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { rate: 0.125, mix: 0.15 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.45 } },
    ],
    ...looped(8, 9, 3, [50]),
  },
  {
    n: 4,
    id: 'riverbed-cellos-g',
    name: 'Riverbed cellos {G}',
    kind: 'drone',
    description:
      'String-ensemble cellos on a low {G} with the octave under it, dull, in a dark room.',
    preset: 'nature-film-riverbed-cellos',
    // Less of the ensemble and a room that stands still: the level holds in every key. On G the
    // loudest key stays under the top of the band; on B it did not.
    set: { ensemble: 0.2, drift: 0.1 },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3, modDepth: 0 } },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 6, 3, [43]),
    tuning: 'whole-cycles',
  },
  {
    n: 5,
    id: 'monsoon-film-drone-c',
    name: 'Monsoon film drone {C}',
    kind: 'drone',
    description: 'Four buzzing strings on {C} and {G} plucked in turn, phased slowly, on a reel.',
    preset: 'nature-film-monsoon-film-drone',
    // Three rounds of the four strings to the loop, and the phaser once round it.
    set: { speed: 2.698, decay: 30 },
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.125, mix: 0.4 } },
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.4 } },
    ],
    // A pluck stands well over the strings still ringing and is heard as a note: the limiter
    // takes it down and the compressor brings the ringing back up behind it.
    then: [
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
    ],
    ...looped(8, 2.77, 0.45, [48]),
  },
  {
    n: 6,
    id: 'slowed-string-drone-g',
    name: 'Slowed string drone {G}',
    kind: 'drone',
    description: 'Plain strings on {G} and {D} plucked in turn into a tape loop an octave down.',
    preset: 'nature-film-slowed-string-drone',
    // Three rounds of the four strings to the loop, which is two turns of the tape loop.
    set: { speed: 2.698, decay: 30 },
    then: [
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
    ],
    ...looped(8, 8.1, 0.45, [55]),
  },
  {
    n: 7,
    id: 'assembly-harmonium-f',
    name: 'Assembly harmonium {F}',
    kind: 'drone',
    description: 'A pumped reed organ holding {F} and {C}, on slow tape that wows, in a hall.',
    preset: 'nature-film-assembly-harmonium',
    // The bellows breathe less deeply than the preset's and the celeste rank beats less, so the
    // chord holds its level in every key.
    set: { bellows: 0.4, celeste: 0.2 },
    ...looped(8, 5, 3, [41, 48, [53, 0.7]]),
  },
  {
    n: 8,
    id: 'lone-cello-drone-d',
    name: 'Lone cello drone {D}',
    kind: 'drone',
    description:
      'One bowed cello on a low {D} and the octave above, with little vibrato, on slow tape in a hall.',
    preset: 'nature-film-lone-cello-reel',
    // Less vibrato than the preset's and a steadier tape: the level stays where it is.
    set: { vibrato: 0.1 },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.3, speed: 2, age: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...looped(8, 5, 3, [38, [50, 0.5]]),
  },
  {
    n: 9,
    id: 'faded-reed-drone-a',
    name: 'Faded reed drone {A}',
    kind: 'drone',
    description:
      'A hollow bass clarinet on a low {A} and a clarinet an octave above, the top worn off by an old reel.',
    preset: 'nature-film-faded-reed-section',
    // The reel wobbles less than the preset's, and the chorus is fainter and turns once a loop.
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.1, wear: 0.6 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.125, mix: 0.15 } },
    ],
    ...looped(8, 5, 3, [45, [57, 0.7]]),
  },
  {
    n: 10,
    id: 'library-horn-drone-f',
    name: 'Library horn drone {F}',
    kind: 'drone',
    description: 'Tape horns at half speed on one low {F}, from a worn record that crackles.',
    preset: 'nature-film-library-record-horns',
    // One note: with its fifth it had no pitch the low keys could be heard by.
    ...looped(8, 5, 3, [53]),
  },
  {
    n: 11,
    id: 'oscilloscope-tone-b',
    name: 'Oscilloscope tone {B}',
    kind: 'drone',
    description: 'A near-sine tone on {B} in three octaves, with a seasick detune and dark echoes.',
    preset: 'nature-film-oscilloscope-trace',
    // The two oscillators on one pitch: a few cents apart they beat the tone down to nothing.
    set: { detune: 0, sub: 0 },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Seasick', params: { mix: 0.15 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 500, feedback: 0.5, modDepth: 0, mix: 0.2 },
      },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 5, 3, [47, 59, 71]),
    tuning: 'whole-cycles',
  },
  {
    n: 12,
    id: 'aerial-shot-drone-d',
    name: 'Aerial shot drone {D}',
    kind: 'drone',
    description: 'The string ensemble thin and high on {D} in three octaves, on a reel in a hall.',
    preset: 'nature-film-aerial-shot',
    // Little of the ensemble and a reel less worn than the preset's: the level stays put.
    set: { ensemble: 0.2, drift: 0 },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Quarter inch reel',
        params: { wobble: 0.25, wear: 0.2, tone: 0.4 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...looped(8, 6, 3, [[62, 0.5], 74, [86, 0.5]]),
  },
  {
    n: 13,
    id: 'science-film-tone-a',
    name: 'Science film tone {A}',
    kind: 'drone',
    description:
      'A folded tone on {A} in two octaves, held after its swell, with reel wobble and chorus.',
    preset: 'nature-film-science-film-tone',
    set: { drift: 0 },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.25 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.125, mix: 0.2 } },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 6, 3, [57, [69, 0.5]]),
    tuning: 'whole-cycles',
  },
  {
    n: 14,
    id: 'far-fairground-organ-g',
    name: 'Far fairground organ {G}',
    kind: 'drone',
    description:
      'Organ flutes on {G} in three octaves with a slight tremulant, through a rotating speaker.',
    preset: 'nature-film-fairground-far-away',
    // A slighter tremulant and shallower rotors than the preset's, so the level holds.
    set: { tremulant: 0.15 },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room', params: { hornDepth: 0.4, drumDepth: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000 } },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 4, 1, [[43, 0.6], 55, [67, 0.7]]),
    tuning: 'whole-cycles',
  },
  {
    n: 15,
    id: 'faded-flutes-c',
    name: 'Faded flutes {C}',
    kind: 'drone',
    description:
      'Tape-replay flutes on {C} in two octaves with the fifth on top, on a strip that never runs out, on slow tape.',
    preset: 'nature-film-faded-flutes',
    // A strip less tired than the preset's: its lurches are heard as notes.
    set: { length: 9, vibrato: 0.2, age: 0.25 },
    ...looped(8, 4, 3, [60, 72, [79, 0.6]]),
  },

  // Pads: chords that swell and move, looped or played once and left to ring.
  {
    n: 16,
    id: 'deep-water-footage-c',
    name: 'Deep water footage {C}',
    kind: 'pad',
    description:
      'A {C} and {G} on saw and low pulse, the filter opening and closing as if under water.',
    preset: 'nature-film-deep-water-footage',
    // The filter and the pulse width go round once a loop, and the stream starves less:
    // at the preset's loss its long frames come and go and are heard as notes.
    set: { lfo1Rate: 0.125, lfo2Rate: 0.125 },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Underwater', params: { loss: 0.3 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.5 } },
    ],
    ...looped(8, 5, 3, [48, [55, 0.6]]),
  },
  {
    n: 17,
    id: 'pylon-hum-g',
    name: 'Pylon hum {G}',
    kind: 'pad',
    description:
      'Two saws on a low {G} beating under a half-closed filter, rising and sinking once a loop.',
    preset: 'nature-film-pylon-drone',
    // The deep chorus turns once a loop.
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.125, mix: 0.4 } },
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.5 } },
    ],
    then: [breathe(0.125, 0.35)],
    ...looped(8, 4, 2, [43]),
    // Chorus and swell come round with the loop, so its two ends are alike: added in amplitude.
    loopFold: 'linear',
  },
  {
    n: 18,
    id: 'estuary-cellos-e',
    name: 'Estuary cellos {E}',
    kind: 'pad',
    description:
      'Tape cellos at half speed on a low {E} and {B}, swelling once a loop in murky repeats.',
    preset: 'nature-film-estuary-cellos',
    then: [breathe(0.125, 0.45)],
    ...looped(8, 6, 3, [52, [59, 0.7]]),
  },
  {
    n: 19,
    id: 'freeze-frame-b',
    name: 'Freeze frame {B}',
    kind: 'pad',
    description: 'Two flutes on {B} stopped on one moment and held there in grains, with tape wow.',
    preset: 'nature-film-freeze-frame',
    source: 'flute-octaves-b',
    // Longer grains and more of them than the preset's, and no slips: each was heard as a note.
    set: { size: 1400, density: 16, spray: 0.02 },
    effects: [{ deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4, flutter: 0 } }],
    ...looped(8, 4, 3, [60]),
  },
  {
    n: 20,
    id: 'opening-titles-f',
    name: 'Opening titles {F}',
    kind: 'pad',
    description:
      'The chorus polysynth on {F} major, leaning in pitch on slow tape, rising and sinking in a small plate.',
    preset: 'nature-film-opening-titles',
    // A younger tape than the preset's: its drop-outs are heard as notes.
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { wow: 0.6, flutter: 0.1, speed: 2, age: 0.1, hiss: 0.2 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 4, 3, [53, 60, [65, 0.8], [69, 0.7]]),
  },
  {
    n: 21,
    id: 'afternoon-programme-am',
    name: 'Afternoon programme {A}m',
    kind: 'pad',
    description: 'A thin moving pulse on {A} minor, swept once a loop by a phaser, on a cassette.',
    preset: 'nature-film-afternoon-programme',
    // The cassette is less worn than the preset's: its dropouts are heard as notes.
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, mix: 0.45 } },
      {
        deviceId: 'patina',
        preset: 'Worn cassette',
        params: { wobble: 0.5, wear: 0.3, noise: 0.15 },
      },
    ],
    ...looped(8, 4, 3, [57, 64, 69, [72, 0.5]]),
  },
  {
    n: 22,
    id: 'slow-migration-d',
    name: 'Slow migration {D}',
    kind: 'pad',
    description:
      'Open fifths on {D} that start dark, open through the filter and die away in murky repeats.',
    preset: 'nature-film-slow-migration',
    set: { release: 3 },
    ...played(
      12,
      [
        [0, 5, 38],
        [0, 5, 50, 0.9],
        [0, 5, 57, 0.8],
        [0, 5, 62, 0.7],
      ],
      3,
    ),
  },
  {
    n: 23,
    id: 'phased-string-reel-em',
    name: 'Phased string reel {E}m',
    kind: 'pad',
    description: 'A string ensemble on {E} minor under a slow six-stage phaser, on tape that wows.',
    preset: 'nature-film-phased-string-reel',
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm six-stage',
        params: { rate: 0.125, depth: 70, mix: 0.5 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4, flutter: 0.25 } },
    ],
    ...looped(8, 4, 3, [40, 52, 59, [64, 0.8], [67, 0.6]]),
  },
  {
    n: 24,
    id: 'half-speed-strings-c',
    name: 'Half speed strings {C}',
    kind: 'pad',
    description:
      'Strings on {C} major with the same strings an octave down at half speed under them.',
    preset: 'nature-film-half-speed-strings',
    set: { width: 0.4 },
    // The slowed strings in stretches of two seconds, so they come round with the loop.
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { length: 2000, highCut: 5000, mix: 0.5 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.25 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 6, 3, [60, 67, [72, 0.8], [76, 0.7]]),
  },
  {
    n: 25,
    id: 'documentary-brass-g',
    name: 'Documentary brass {G}',
    kind: 'pad',
    description:
      'One chord of detuned brass on {G} that starts dark, overshoots and dies away, on slow tape.',
    preset: 'nature-film-documentary-brass',
    ...played(
      10,
      [
        [0, 5, 43],
        [0, 5, 50, 0.9],
        [0, 5, 55, 0.8],
        [0, 5, 59, 0.8],
        [0, 5, 62, 0.7],
      ],
      2,
    ),
  },
  {
    n: 26,
    id: 'faded-horn-call-f',
    name: 'Faded horn call {F}',
    kind: 'pad',
    description:
      'Soft synthetic horns on {F} major with the worn top of an old reel and a chorused echo.',
    preset: 'nature-film-faded-horn-call',
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5, 3, [41, 53, [60, 0.8], [65, 0.8], [69, 0.7]]),
  },
  {
    n: 27,
    id: 'after-closedown-g',
    name: 'After closedown {G}',
    kind: 'pad',
    description: 'A narrow band that sounds almost sung on {G} major, swirling as if behind glass.',
    preset: 'nature-film-after-closedown',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Behind glass', params: { loss: 0.45 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.125, mix: 0.35 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5, 3, [55, 62, 67, [71, 0.6]]),
  },
  {
    n: 28,
    id: 'bothy-tin-roof-dsus2',
    name: 'Bothy tin roof {D}sus2',
    kind: 'pad',
    description:
      'One chord on {D} that opens with a falling metallic ring and melts into a phased pad.',
    preset: 'nature-film-bothy-tin-roof',
    set: { release: 3 },
    ...played(
      10,
      [
        [0, 4.5, 50],
        [0, 4.5, 57, 0.8],
        [0, 4.5, 62, 0.8],
        [0, 4.5, 64, 0.7],
      ],
      2.5,
    ),
  },
  {
    n: 29,
    id: 'loch-at-daybreak-em',
    name: 'Loch at daybreak {E}m',
    kind: 'pad',
    description: 'A dark brass chord on {E} minor in a wide, dull space, swelling once every 16 s.',
    preset: 'nature-film-loch-at-daybreak',
    then: [breathe(0.0625, 0.5)],
    ...looped(16, 6, 3, [40, 47, 52, [59, 0.8], [67, 0.6]]),
  },
  {
    n: 30,
    id: 'vowel-lesson-dm',
    name: 'Vowel lesson {D}m',
    kind: 'pad',
    description:
      'The vowel table mouthing once a loop through {D} minor, like a voice on a twelve-bit sampler.',
    preset: 'nature-film-vowel-lesson',
    set: { rate: 0.125 },
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5, 3, [50, 57, 62, [65, 0.6]]),
  },
  {
    n: 31,
    id: 'hollow-log-gsus4',
    name: 'Hollow log {G}sus4',
    kind: 'pad',
    description:
      'A hollow, woody chord on {G} with its fourth, drifting through its table under a slow phaser.',
    preset: 'nature-film-hollow-log',
    set: { rate: 0.0625, detune: 8 },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.0625, stereo: 60, mix: 0.45 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.28 } },
    ],
    ...looped(16, 5, 3, [43, 55, [60, 0.8], [62, 0.8]]),
  },
  {
    n: 32,
    id: 'frosted-lens-c',
    name: 'Frosted lens {C}',
    kind: 'pad',
    description: 'The glass table rippling on a chord of {C} major, through an early converter.',
    preset: 'nature-film-frosted-lens',
    set: { rate: 0.375 },
    then: [breathe(0.125, 0.45)],
    ...looped(8, 4, 3, [67, 72, [76, 0.8]]),
  },
  {
    n: 33,
    id: 'crystal-set-pad-am7',
    name: 'Crystal set pad {A}m7',
    kind: 'pad',
    description:
      'A four-operator chord on {A} minor seventh narrowed by a medium-wave set, under a slow phaser.',
    preset: 'nature-film-crystal-set-pad',
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio', params: { mix: 0.7 } },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, mix: 0.4 } },
    ],
    ...looped(8, 5, 3, [57, 64, [67, 0.8], [72, 0.8]]),
  },
  {
    n: 34,
    id: 'sampled-quartet-cmaj7',
    name: 'Sampled quartet {C}maj7',
    kind: 'pad',
    description:
      'Four muted string parts spread over {C} major seventh, held by an early sampler, in a hall.',
    preset: 'nature-film-sampled-quartet',
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5, 3, [48, 55, [64, 0.8], [71, 0.7]]),
  },
  {
    n: 35,
    id: 'choir-on-air-f',
    name: 'Choir on air {F}',
    kind: 'pad',
    description:
      'Treble voices on an ooh holding {F} major, through a medium-wave set in a quiet room.',
    preset: 'nature-film-choir-on-air',
    set: { ensemble: 0, vibrato: 0 },
    then: [breathe(0.125, 0.45), quarterTurn(8)],
    ...looped(8, 5, 3, [65, 69, [72, 0.8], [77, 0.6]]),
    tuning: 'whole-cycles',
  },
  {
    n: 36,
    id: 'wind-band-reel-g',
    name: 'Wind band reel {G}',
    kind: 'pad',
    description:
      'A reed section from tape holding {G} major under a slow phaser and a dark spring.',
    preset: 'nature-film-wind-band-reel',
    effects: [
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.25, mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.25, width: 0.6 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 4, 3, [55, 59, [62, 0.8], [67, 0.7]]),
  },
  {
    n: 37,
    id: 'wireless-brass-band-c',
    name: 'Wireless brass band {C}',
    kind: 'pad',
    description:
      'A brass band chord on {C} major through a medium-wave set: narrow, with a little static.',
    preset: 'nature-film-wireless-brass-band',
    // The band plays closer in tune, and the set neither drifts off its station nor fades:
    // the beating and the fading are both heard as notes.
    set: { section: 0.5 },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Kitchen radio',
        params: { drift: 0, fading: 0, static: 0.2, interference: 0 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5, 3, [48, 55, [60, 0.8], [64, 0.8], [67, 0.7]]),
  },
  {
    n: 38,
    id: 'slowed-sample-bed-am',
    name: 'Slowed sample bed {A}m',
    kind: 'pad',
    description:
      'The choir chord on {A} minor an octave down in a sampler, on worn slow tape in a hall.',
    preset: 'nature-film-slowed-sample-bed',
    source: 'choir-chord-am',
    ...looped(8, 5, 3, [60]),
  },
  {
    n: 39,
    id: 'rewinding-the-reel-am',
    name: 'Rewinding the reel {A}m',
    kind: 'pad',
    description:
      'The felt piano phrase in {A} minor read backwards in long grains, phased, with falling echoes.',
    preset: 'nature-film-rewinding-the-reel',
    source: 'felt-piano-phrase-am',
    // The preset's long backward grains, started near the end of the phrase, more of them and
    // more scattered, and loud enough to lean hard on the limiter: both even out the swell, which
    // in the far keys was a few loud grains over very little. Narrowed after it.
    set: { position: 0.8, attack: 1, release: 2, spread: 0.15, volume: 0, density: 14, spray: 0.5 },
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 18, release: 0.3, ride: 0 },
      },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
    ...played(10, [[0, 5.5, 60]], 2),
  },
  {
    n: 40,
    id: 'bent-record-steel-c6',
    name: 'Bent record steel {C}6',
    kind: 'pad',
    description:
      'A swelled steel guitar chord on {C} sixth from a record that is not flat, bending once a turn.',
    preset: 'nature-film-bent-record-steel',
    ...played(
      10,
      [
        [0, 6, 48],
        [0, 6, 55, 0.9],
        [0, 6, 64, 0.8],
        [0, 6, 69, 0.7],
      ],
      2.5,
    ),
  },
  {
    n: 41,
    id: 'reversed-guitar-reel-em',
    name: 'Reversed guitar reel {E}m',
    kind: 'pad',
    description:
      'A swelled guitar chord on {E} minor with no pick, turned round by a backwards echo, on tape.',
    preset: 'nature-film-reversed-guitar-reel',
    ...played(
      10,
      [
        [0, 5, 40],
        [0, 5, 47, 0.9],
        [0, 5, 55, 0.8],
        [0, 5, 59, 0.8],
        [0, 5, 64, 0.7],
      ],
      2.5,
    ),
  },
  {
    n: 42,
    id: 'schools-ident-f',
    name: 'Schools ident {F}',
    kind: 'pad',
    description:
      'Synthetic brass on {F} major, a low root under a high chord, opening and settling like an ident, at twelve bits.',
    preset: 'nature-film-schools-ident',
    ...played(
      5,
      [
        [0, 3, 53],
        [0, 3, 65, 0.9],
        [0, 3, 69, 0.8],
        [0, 3, 72, 0.8],
        [0, 3, 77, 0.7],
      ],
      1,
    ),
  },

  // Textures: weather, water, birds and the noise of the film itself.
  {
    n: 43,
    id: 'wind-in-the-aerial',
    name: 'Wind in the aerial',
    kind: 'texture',
    description:
      'Wide bands of noise round {A} minor drifting like wind in a wire, under a wide flanger.',
    preset: 'nature-film-singing-aerial',
    set: { resonance: 10 },
    // The flanger goes once round the loop.
    effects: [
      { deviceId: 'ambient-limiter', params: { ceiling: -6, gain: 5.5 } },
      { deviceId: 'flanger', preset: 'Wide wash', params: { rate: 0.125, mix: 0.45 } },
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.2 } },
    ],
    ...looped(8, 5, 3, [57, 64]),
  },
  {
    n: 44,
    id: 'fogbound-signal-d',
    name: 'Fogbound signal {D}',
    kind: 'texture',
    description:
      'A close cluster of wandering sines over a low {D} with air in it, fading in and out on shortwave.',
    preset: 'nature-film-fogbound-signal',
    // Six tones of the cluster, which over D are all in the key; the seventh is a semitone up.
    // Low, where so close a cluster has no pitch of its own in any key.
    set: { partials: 0.71 },
    ...looped(8, 12, 3, [50]),
  },
  {
    n: 45,
    id: 'surf-on-the-reel',
    name: 'Surf on the reel',
    kind: 'texture',
    description:
      'Filtered noise swelling and falling like surf once a loop, with the wobble and wear of a reel.',
    preset: 'nature-film-soundtrack-surf',
    set: { lfo1Rate: 0.125 },
    ...looped(8, 6, 3, [48]),
  },
  {
    n: 46,
    id: 'hill-wind-gusts',
    name: 'Hill wind gusts',
    kind: 'texture',
    description:
      'Hill wind gusting across a bare microphone, band-limited and worn like an optical soundtrack.',
    preset: 'nature-film-microphone-wind',
    ...looped(16, 4, 3, [50]),
  },
  {
    n: 47,
    id: 'projector-hum-g',
    name: 'Projector hum {G}',
    kind: 'texture',
    description:
      'The mains hum of a projector on a low {G}, with the crackle of film leader, from a small speaker.',
    preset: 'nature-film-projector-hum',
    ...looped(8, 3, 2, [43]),
  },
  {
    n: 48,
    id: 'far-hedgerow-birds',
    name: 'Far hedgerow birds',
    kind: 'texture',
    description:
      'Birdsong all along a hedge, far off and run together in a wide space, on a wobbling reel with hiss.',
    preset: 'nature-film-filmed-hedgerow-birds',
    // A crowd of birds far off, run together by a wide space: close by, each call is a note.
    set: { density: 1, distance: 0.9, movement: 1, tone: 0.3 },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Quarter inch reel',
        params: { wobble: 0.5, wear: 0.6, noise: 0.6 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.6, width: 0.7 } },
    ],
    ...looped(16, 4, 3, [48, 53, 57, 60, 64, 67, 72, 77]),
  },
  {
    n: 49,
    id: 'burn-over-the-rocks',
    name: 'Burn over the rocks',
    kind: 'texture',
    description:
      'A small stream over rocks, recorded to a cassette four-track and glazed by old converters.',
    preset: 'nature-film-hill-burn-cassette',
    ...looped(8, 3, 2, [64]),
  },
  {
    n: 50,
    id: 'rain-on-the-classroom',
    name: 'Rain on the classroom',
    kind: 'texture',
    description:
      'Rain on the window during the film, on a worn reel, from the small speaker of the set.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: { density: 0.7, attack: 0.5, width: 0.6, volume: -4 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 12, outputDb: -6, oversample: 1 } },
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.4, wear: 0.6 } },
      { deviceId: 're-amp', preset: 'Bedside radio', params: { distance: 0.4, room: 0.45 } },
    ],
    ...looped(8, 3, 2, [55]),
  },
  {
    n: 51,
    id: 'shoreline-reel',
    name: 'Shoreline reel',
    kind: 'texture',
    description:
      'Slow waves on a shore as a worn reel kept them, the tape wowing, in a small dark room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Slow shore',
      params: { movement: 0.5, attack: 0.5, width: 0.6, volume: -4 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.5, speed: 2, age: 0.4 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.2 } },
    ],
    ...looped(16, 4, 3, [48]),
  },
  {
    n: 52,
    id: 'film-leader-crackle',
    name: 'Film leader crackle',
    kind: 'texture',
    description:
      'The crackle and dust of film leader running through the gate, through old converters.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Old record',
      params: { density: 0.9, attack: 0.3, width: 0.5, volume: -2 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 20, outputDb: -6, oversample: 1 } },
      { deviceId: 'vintage-digital', preset: 'Dusty', params: { jitter: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
    ...looped(8, 2, 2, [60]),
  },
  {
    n: 53,
    id: 'storm-over-the-glen',
    name: 'Storm over the glen',
    kind: 'texture',
    description: 'Far thunder rolling over itself, its top worn off by slow tape, in a wide space.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { density: 1, tone: 0.6, movement: 0.2, width: 0.7 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 8, outputDb: -6, oversample: 1 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4, speed: 2 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25 } },
    ],
    ...looped(16, 6, 3, [38, 43, 48, 53]),
  },
  {
    n: 54,
    id: 'bothy-hearth-reel',
    name: 'Bothy hearth reel',
    kind: 'texture',
    description:
      'A fire in a small hearth, its spit and crackle dulled by a reel and a twelve-bit sampler.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hearth',
      params: { density: 0.6, attack: 0.5, width: 0.6, volume: -3 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 12, outputDb: -6, oversample: 1 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4 } },
      { deviceId: 'patina', preset: 'Early sampler', params: { wear: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    ...looped(8, 3, 2, [50]),
  },
  {
    n: 55,
    id: 'sampled-frog-pond',
    name: 'Sampled frog pond',
    kind: 'texture',
    description:
      'A pond full of frogs in spring, far off, replayed by a gritty old sampler on wowing tape.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Spring pond',
      params: { attack: 1, distance: 0.8 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 12, outputDb: -6, oversample: 1 } },
      { deviceId: 'vintage-digital', preset: 'Dusty', params: { jitter: 0.35 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.5 } },
    ],
    ...looped(16, 3, 3, [43, 48, 55, 60, 65]),
  },

  // One-shots: a single note or one struck chord.
  {
    n: 56,
    id: 'times-tables-note-c',
    name: 'Times tables note {C}',
    kind: 'oneshot',
    description:
      'One plain square-wave {C} through twelve-bit converters, with a wobbling tape echo.',
    preset: 'nature-film-times-tables',
    ...played(3.5, [[0, 0.5, 72]], 1),
  },
  {
    n: 57,
    id: 'pond-skater-pluck-e',
    name: 'Pond skater pluck {E}',
    kind: 'oneshot',
    description:
      'One soft triangle pluck on {E}, skipping across dotted tape echoes into a small plate.',
    preset: 'nature-film-pond-skaters',
    // The limiter stands before the echoes, so the pluck is held and its repeats still fall away.
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
      {
        deviceId: 'tape-echo',
        params: { time: 300, feedback: 0.5, heads: 3, wow: 0.35, spread: 0.6, mix: 0.3 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
    ],
    ...played(3, [[0, 0.4, 64]], 0.8),
  },
  {
    n: 58,
    id: 'spinning-globe-stab-g',
    name: 'Spinning globe stab {G}',
    kind: 'oneshot',
    description:
      'A quick brass stab on {G} major with a filter overshoot, glazed by old converters, in a spring.',
    preset: 'nature-film-spinning-globe',
    ...played(
      3,
      [
        [0, 0.5, 55],
        [0, 0.5, 62, 0.9],
        [0, 0.5, 67, 0.8],
        [0, 0.5, 71, 0.8],
      ],
      0.6,
    ),
  },
  {
    n: 59,
    id: 'sampler-string-stab-am',
    name: 'Sampler string stab {A}m',
    kind: 'oneshot',
    description:
      'A short string chord on {A} minor as an old sampler would replay it, repeating darkly.',
    preset: 'nature-film-sampler-string-stab',
    ...played(
      5,
      [
        [0, 0.35, 57],
        [0, 0.35, 60, 0.9],
        [0, 0.35, 64, 0.9],
        [0, 0.35, 69, 0.8],
      ],
      1,
    ),
  },
  {
    n: 60,
    id: 'rock-pool-d',
    name: 'Rock pool {D}',
    kind: 'oneshot',
    description:
      'One low {D} that opens bright and resonant, then closes and fades under a hollow phaser.',
    preset: 'nature-film-rock-pool',
    set: { decay: 5 },
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 8, release: 0.3, ride: 0 } },
    ],
    ...played(5, [[0, 4, 38]], 1.5),
  },
  {
    n: 61,
    id: 'rubber-boots-f',
    name: 'Rubber boots {F}',
    kind: 'oneshot',
    description:
      'One short rubbery bass pluck on {F} from a gritty old sampler, with a tape echo behind it.',
    preset: 'nature-film-rubber-boots',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty', params: { jitter: 0.3 } },
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 12, release: 0.3, ride: 0 },
      },
      { deviceId: 'tape-echo', params: { time: 330, feedback: 0.25, wow: 0.3, mix: 0.14 } },
    ],
    ...played(2, [[0, 0.6, 41]], 0.5),
  },
  {
    n: 62,
    id: 'wet-playtime-tine-e',
    name: 'Wet playtime tine {E}',
    kind: 'oneshot',
    description:
      'One soft tine piano {E} on tape whose speed swims, bending down and back, in a small room.',
    preset: 'nature-film-wet-playtime',
    ...played(5, [[0, 3, 64]], 1.5),
  },
  {
    n: 63,
    id: 'phaser-pedal-tines-dm9',
    name: 'Phaser pedal tines {D}m9',
    kind: 'oneshot',
    description:
      'Dull, soft tines on {D} minor ninth through a six-stage phaser with the feedback up.',
    preset: 'nature-film-phaser-pedal-tines',
    ...played(
      6,
      [
        [0, 4.5, 50, 0.75],
        [0.01, 4.5, 57, 0.65],
        [0.02, 4.5, 60, 0.65],
        [0.03, 4.5, 64, 0.6],
        [0.04, 4.5, 65, 0.6],
      ],
      1,
    ),
  },
  {
    n: 64,
    id: 'toy-sampler-tine-b',
    name: 'Toy sampler tine {B}',
    kind: 'oneshot',
    description:
      'One bell-like tine on {B} through the converters of a toy sampler, with dark repeats.',
    preset: 'nature-film-toy-sampler-tines',
    // Struck harder and ringing shorter, with fainter repeats: the long soft ring was too loud
    // in the high keys.
    set: { decay: 0.7, hardness: 1 },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Toy', params: { rate: 9000, bits: 10 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.2 } },
    ],
    ...played(3.5, [[0, 0.3, 71]], 1),
  },
  {
    n: 65,
    id: 'rewound-tines-a',
    name: 'Rewound tines {A}',
    kind: 'oneshot',
    description:
      'Long-ringing tines on {A} in two octaves, answered backwards as it fades, in a hall.',
    preset: 'nature-film-rewound-tines',
    // Less of the backwards answer than the preset has: at its mix the answer is the loudest thing.
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1200, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...played(
      8,
      [
        [0, 2.5, 57, 0.8],
        [0, 2.5, 69, 0.8],
      ],
      2,
    ),
  },
  {
    n: 66,
    id: 'school-hall-piano-g',
    name: 'School hall piano {G}',
    kind: 'oneshot',
    description:
      'One low {G} on the upright in the school hall, a little sour, on tape that swims.',
    preset: 'nature-film-school-hall-piano',
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
    ],
    ...played(7, [[0, 4.5, 43, 0.8]], 2),
  },
  {
    n: 67,
    id: 'toy-shop-harp-f',
    name: 'Toy shop harp {F}',
    kind: 'oneshot',
    description:
      'A short toy strum down {F} major over two octaves, through eight-bit converters, in a small room.',
    preset: 'nature-film-toy-shop-harp',
    // The limiter stands before the room and holds the first string, so the strum is heard under it.
    effects: [
      { deviceId: 'vintage-digital', preset: 'Toy' },
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    ...played(
      2,
      [
        [0, 1.2, 65],
        [0, 1.2, 69],
        [0, 1.2, 72],
      ],
      0.5,
    ),
  },
  {
    n: 68,
    id: 'music-room-zither-am',
    name: 'Music room zither {A}m',
    kind: 'oneshot',
    description:
      'One strum of {A} minor on a chord zither with a pick, on tape that swims badly, in a spring tank.',
    preset: 'nature-film-music-room-zither',
    // The limiter stands before the tank and holds the pick, and the tank is a little narrower.
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.8, hiss: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25, width: 0.7 } },
    ],
    ...played(8, [[0, 4, 57]], 2),
  },
  {
    n: 69,
    id: 'slowed-tongue-drum-d',
    name: 'Slowed tongue drum {D}',
    kind: 'oneshot',
    description: 'One tongue drum {D} with the same note coming back an octave down at half speed.',
    preset: 'nature-film-slowed-tongue-drum',
    ...played(7, [[0, 4, 62]], 1.5),
  },
  {
    n: 70,
    id: 'vibraphone-reel-f',
    name: 'Vibraphone reel {F}',
    kind: 'oneshot',
    description:
      'One vibraphone {F} with its motor throbbing, on slow tape that leans, in a small plate.',
    preset: 'nature-film-vibraphone-reel',
    ...played(6, [[0, 4, 65]], 1.5),
  },
  {
    n: 71,
    id: 'classroom-glockenspiel-g',
    name: 'Classroom glock {G}',
    kind: 'oneshot',
    description:
      'One {G} on the glockenspiel from the music trolley, with worn converters and a wobbling tape echo.',
    preset: 'nature-film-classroom-glockenspiel',
    ...played(4, [[0, 1.5, 79]], 1),
  },
  {
    n: 72,
    id: 'nursery-music-box-e',
    name: 'Nursery music box {E}',
    kind: 'oneshot',
    description: 'One hard little bar of a music box on {E}, on a cassette whose speed flutters.',
    preset: 'nature-film-nursery-music-box',
    ...played(4, [[0, 2, 76]], 1),
  },
  {
    n: 73,
    id: 'far-sunday-bell-d',
    name: 'Far Sunday bell {D}',
    kind: 'oneshot',
    description:
      'A church bell on {D} across the valley, its top worn off by tape, with sparse far echoes.',
    preset: 'nature-film-far-sunday-bell',
    // Struck where the major third among its partials has its node: over {D} the rest are white keys.
    set: { position: 0.667 },
    // The limiter stands before the echoes and holds the stroke, so the ring is heard under it.
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { air: -6, highCut: 4000 } },
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.4 } },
    ],
    ...played(12, [[0, 8, 50]], 3),
  },
  {
    n: 74,
    id: 'digital-tine-keys-cmaj7',
    name: 'Digital tine keys {C}maj7',
    kind: 'oneshot',
    description:
      'A four-operator electric piano chord on {C} major seventh, chorused, on tape that wows.',
    preset: 'nature-film-digital-tine-keys',
    // The limiter stands first and holds the strike, so the chord is heard under it.
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { mix: 0.4 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.5, flutter: 0.3 } },
    ],
    ...played(
      6,
      [
        [0, 4, 48, 0.75],
        [0.01, 4, 55, 0.65],
        [0.02, 4, 59, 0.6],
        [0.03, 4, 64, 0.65],
      ],
      1.5,
    ),
  },
  {
    n: 75,
    id: 'wooden-block-a',
    name: 'Wooden block {A}',
    kind: 'oneshot',
    description:
      'One soft woody mallet tone on {A} that darkens as it fades, with dark repeats on tape.',
    preset: 'nature-film-wooden-blocks',
    // Fewer and quieter repeats than the preset's, which are counted as a pulse.
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.5 } },
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 12, release: 0.3, ride: 0 },
      },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 360, feedback: 0.25, mix: 0.18 },
      },
    ],
    ...played(3.5, [[0, 1.5, 57]], 1),
  },
  {
    n: 76,
    id: 'steel-pan-postcard-g',
    name: 'Steel pan postcard {G}',
    kind: 'oneshot',
    description:
      'One tap on a hand-played pan on {G}, its octave and fifth ringing, with a few dark repeats.',
    preset: 'nature-film-steel-pan-postcard',
    // No loop under it and few repeats: more of either is counted as a pulse.
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 5, release: 0.3, ride: 0 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 375, feedback: 0.25, mix: 0.18 },
      },
    ],
    ...played(7, [[0, 3, 55]], 2),
  },
  {
    n: 77,
    id: 'strum-plate-chord-c',
    name: 'Strum plate chord {C}',
    kind: 'oneshot',
    description:
      'One strum of {C} major up a chord harp over its own soft pad, chorused, on a cassette that wows.',
    preset: 'nature-film-strum-plate-lullaby',
    set: { strum: 20, pad: 0.25 },
    ...played(
      7,
      [
        [0, 2.5, 60],
        [0, 2.5, 64],
        [0, 2.5, 67],
      ],
      2,
    ),
  },

  // Phrases: short tunes; those that come round say so.
  {
    n: 78,
    id: 'flashback-harp-c',
    name: 'Flashback harp {C}',
    kind: 'melodic',
    description:
      'A chord on {C} rolled up the harp and slowing, the cue for a flashback, glazed by old converters.',
    preset: 'nature-film-flashback-harp',
    // Rolled by hand, slowing as it climbs, so the strings fall on no pulse; the echo is quieter
    // than the preset's and its repeats stay under the strings.
    set: { sweep: 0 },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze', params: { rate: 13000 } },
      {
        deviceId: 'tape-echo',
        params: { time: 400, feedback: 0.3, heads: 1, wow: 0.35, mix: 0.15 },
      },
    ],
    ...played(
      7,
      [
        [0, 4, 48],
        [0.19, 4, 55, 0.75],
        [0.43, 4, 60, 0.75],
        [0.74, 4, 64, 0.75],
        [1.16, 4, 67, 0.8],
        [1.75, 4, 72, 0.8],
      ],
      2,
    ),
  },
  {
    n: 79,
    id: 'narrator-theme-am',
    name: 'Narrator theme {A}m',
    kind: 'melodic',
    description:
      'A sliding triangle lead asks up through {A} minor and answers back down, in chorus and dark repeats.',
    preset: 'nature-film-narrator-theme',
    ...played(
      8,
      [
        [0, 0.95, 69],
        [0.87, 0.75, 72],
        [1.55, 1.9, 76],
        [3.72, 0.8, 74],
        [4.43, 0.7, 72],
        [5.02, 1.6, 69],
      ],
      1.2,
    ),
  },
  {
    n: 80,
    id: 'curlew-call-e',
    name: 'Curlew call {E}',
    kind: 'melodic',
    description:
      'A round solo voice slides up from {E} twice, the second time higher, then calls once more, wavering like tape.',
    preset: 'nature-film-curlew-lead',
    ...played(
      8,
      [
        [0, 0.55, 64, 0.8],
        [0.47, 1.3, 71, 0.8],
        [2.58, 0.5, 64, 0.9],
        [3.0, 1.4, 76],
        [5.31, 1.05, 71, 0.85],
      ],
      1.5,
    ),
  },
  {
    n: 81,
    id: 'otter-theme-f',
    name: 'Otter theme {F}',
    kind: 'melodic',
    description:
      'A warm clarinet skips up from {F} and steps back down, each note tongued, in a bucket-brigade chorus.',
    preset: 'nature-film-otter-theme',
    // Tongued and let go: slurred, with the preset's soft attack, the line is one long note.
    set: { attack: 0.015, release: 0.15 },
    ...played(
      8,
      [
        [0, 0.38, 65, 0.8],
        [0.61, 0.3, 69, 0.8],
        [1.07, 0.95, 72],
        [2.42, 0.22, 74, 0.85],
        [2.79, 0.45, 72, 0.8],
        [3.5, 0.95, 69, 0.85],
        [4.86, 0.3, 67, 0.8],
        [5.33, 1.5, 65, 0.9],
      ],
      1,
    ),
  },
  {
    n: 82,
    id: 'sampled-pan-pipes-g',
    name: 'Sampled pan pipes {G}',
    kind: 'melodic',
    description:
      'Pan pipes in octaves rock between {D} and {C} and come home to {G}, from a gritty old sampler, with dotted tape echoes.',
    preset: 'nature-film-sampled-pan-pipes',
    ...played(
      7,
      [
        [0, 0.45, 74, 0.75],
        [0, 0.45, 86, 0.7],
        [0.52, 0.3, 72, 0.65],
        [0.52, 0.3, 84, 0.6],
        [0.89, 0.45, 74, 0.75],
        [0.89, 0.45, 86, 0.7],
        [1.43, 0.9, 72, 0.7],
        [1.43, 0.9, 84, 0.65],
        [2.71, 0.4, 69, 0.7],
        [2.71, 0.4, 81, 0.65],
        [3.18, 0.35, 72, 0.65],
        [3.18, 0.35, 84, 0.6],
        [3.62, 1.5, 67, 0.75],
        [3.62, 1.5, 79, 0.7],
      ],
      1.5,
    ),
  },
  {
    n: 83,
    id: 'hillside-flugelhorn-c',
    name: 'Hillside flugelhorn {C}',
    kind: 'melodic',
    description:
      'One breathy flugelhorn climbs from {C} to {G} and comes slowly home, each note tongued, with dull echoes.',
    preset: 'nature-film-hillside-flugelhorn',
    set: { attack: 0.02, release: 0.4 },
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Minute ago',
        params: { time: 1100, feedback: 0.3, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    ...played(
      10,
      [
        [0, 1.2, 60, 0.8],
        [1.63, 0.75, 67, 0.9],
        [2.75, 1.9, 64],
        [5.18, 0.6, 62, 0.8],
        [6.05, 1.7, 60, 0.85],
      ],
      2,
    ),
  },
  {
    n: 84,
    id: 'old-record-violin-am',
    name: 'Old record violin {A}m',
    kind: 'melodic',
    description:
      'One close violin leans up from {A} and falls through {A} minor, a bow to a note, wide vibrato, on a scratched record.',
    preset: 'nature-film-old-record-violin',
    set: { attack: 0.05, release: 0.3 },
    ...played(
      8,
      [
        [0, 1.5, 69],
        [1.92, 0.3, 72, 0.85],
        [2.47, 1.0, 71, 0.9],
        [3.86, 0.4, 67, 0.8],
        [4.51, 2.1, 64, 0.9],
      ],
      0.8,
    ),
  },
  {
    n: 85,
    id: 'portable-keyboard-c',
    name: 'Portable keyboard {C}',
    kind: 'melodic',
    description:
      'A reedy key sound falls through the chord of {C} and climbs back to answer, on a four-track cassette.',
    preset: 'nature-film-portable-keyboard',
    ...played(
      7,
      [
        [0, 0.45, 67],
        [0.49, 0.42, 64],
        [1.02, 0.9, 60],
        [2.2, 0.4, 62],
        [2.63, 0.5, 64],
        [3.3, 0.4, 65],
        [3.71, 0.55, 62],
        [4.42, 1.2, 60],
      ],
      1.2,
    ),
  },
  {
    n: 86,
    id: 'times-tables-tune-g',
    name: 'Times tables tune {G}',
    kind: 'melodic',
    description:
      'A plain square-wave tune on {G}, two repeated notes, a skip up and a step home, through tape echo.',
    preset: 'nature-film-times-tables',
    ...played(
      6,
      [
        [0, 0.3, 67],
        [0.41, 0.3, 67],
        [0.93, 0.3, 71],
        [1.3, 0.6, 74],
        [2.24, 0.3, 72],
        [2.61, 0.3, 71],
        [3.17, 0.9, 67],
      ],
      1.5,
    ),
  },
  {
    n: 87,
    id: 'corduroy-bass-riff-c',
    name: 'Corduroy bass riff {C}',
    kind: 'melodic',
    description:
      'A round, wobbly bass riff on {C}: the root twice, its fifth, a turn and home, on tape.',
    preset: 'nature-film-corduroy-bass',
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 10, release: 0.3, ride: 0 },
      },
    ],
    ...played(
      6,
      [
        [0, 0.5, 48],
        [0.73, 0.3, 48, 0.8],
        [1.12, 0.6, 55, 0.9],
        [2.03, 0.35, 53, 0.8],
        [2.44, 0.4, 55, 0.85],
        [3.11, 1.5, 48],
      ],
      1,
    ),
  },
  {
    n: 88,
    id: 'twelve-bit-keyboard-c',
    name: 'Twelve-bit keyboard {C}',
    kind: 'melodic',
    description:
      'The felt piano {C} on the keys of an early sampler: up the chord and back by step, wobbling.',
    preset: 'nature-film-twelve-bit-keyboard',
    source: 'felt-piano-c',
    // Narrowed: in the high keys the chorus left more at the sides than in the middle.
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }],
    ...played(
      8,
      [
        [0, 0.9, 72, 0.8],
        [0.71, 1.1, 76, 0.8],
        [1.93, 1.4, 79],
        [3.44, 0.6, 77, 0.8],
        [3.87, 1.2, 74, 0.8],
        [5.29, 1.8, 72, 0.9],
      ],
      1.5,
    ),
  },
  {
    n: 89,
    id: 'school-hall-hymn-dm',
    name: 'School hall hymn {D}m',
    kind: 'melodic',
    description:
      'The upright in the school hall: a low {D}, three notes of a hymn over it and an answer, on tape that swims.',
    preset: 'nature-film-school-hall-piano',
    ...played(
      9,
      [
        [0, 3.4, 38, 0.6],
        [0.05, 1.2, 62, 0.75],
        [1.32, 0.8, 65, 0.7],
        [2.14, 1.5, 64, 0.7],
        [3.9, 2.8, 45, 0.6],
        [3.95, 0.9, 60, 0.7],
        [4.88, 2, 62, 0.75],
      ],
      2,
    ),
  },
  {
    n: 90,
    id: 'glockenspiel-round-g',
    name: 'Glockenspiel round {G}',
    kind: 'melodic',
    description:
      'The classroom glockenspiel up the chord of {G} and down again by step, through a wobbling tape echo; it comes round.',
    preset: 'nature-film-classroom-glockenspiel',
    ...cycled(8, [
      [0, 0.5, 79, 0.8],
      [0.38, 0.5, 83, 0.75],
      [0.89, 1, 86, 0.9],
      [2.31, 0.5, 84, 0.75],
      [2.84, 0.5, 83, 0.7],
      [3.71, 1.5, 79, 0.85],
      [5.43, 1, 74, 0.7],
    ]),
  },
  {
    n: 91,
    id: 'tape-flute-round-a',
    name: 'Tape flute round {A}',
    kind: 'melodic',
    description:
      'A soft flute turns round {A}, leaps to {D} and falls back, each note tongued, on tape that swims; it comes round.',
    preset: 'nature-film-tape-flute-lead',
    set: { attack: 0.01, chiff: 0.6, release: 0.3 },
    ...cycled(
      8,
      [
        [0, 0.6, 69, 0.6],
        [0.84, 0.3, 67, 0.5],
        [1.33, 0.9, 69, 0.6],
        [2.56, 1.6, 74, 1],
        [4.61, 0.45, 72, 0.6],
        [5.3, 1.3, 69, 0.65],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 92,
    id: 'evening-heather-em',
    name: 'Evening heather {E}m',
    kind: 'melodic',
    description:
      'A string ensemble line stepping down {E} minor twice, each note bowed apart, under a slow flanger; it comes round.',
    preset: 'nature-film-evening-heather',
    set: { attack: 0.01, release: 0.5 },
    // The flanger goes once round the loop. The second fall is a little quicker than the first:
    // on the same spacing the line was heard as a pulse.
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Slow sweep',
        params: { rate: 0.125, feedback: 20, mix: 0.35 },
      },
      { deviceId: 'stereo-detune', preset: 'Seasick', params: { detune: 25, mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    ...cycled(8, [
      [0, 0.8, 71],
      [1.11, 0.35, 69, 0.8],
      [1.68, 1.2, 67, 0.9],
      [3.3, 0.5, 69, 0.85],
      [4.02, 0.35, 67, 0.8],
      [4.71, 1.6, 64, 0.9],
    ]),
  },
  {
    n: 93,
    id: 'resampled-violins-g',
    name: 'Resampled violins {G}',
    kind: 'melodic',
    description:
      'Three tape violins rock from {G} up a fifth and down a third, then answer from {A}, at twelve bits; it comes round.',
    preset: 'nature-film-resampled-violins',
    set: { attack: 0.005, release: 0.2 },
    // Less of the echo than the preset has: it fills the gaps the notes are heard by.
    effects: [
      { deviceId: 'patina', preset: 'Early sampler', params: { wear: 0.35, wobble: 0.25 } },
      { deviceId: 'tape-echo', params: { time: 420, feedback: 0.3, mix: 0.14 } },
    ],
    ...cycled(8, [
      [0, 0.45, 67, 0.6],
      [0.78, 0.4, 74, 0.75],
      [1.47, 1.1, 71],
      [3.02, 0.45, 69, 0.6],
      [3.74, 0.4, 74, 0.75],
      [4.39, 2, 72, 0.85],
    ]),
  },
  {
    n: 94,
    id: 'music-box-lullaby-f',
    name: 'Music box lullaby {F}',
    kind: 'melodic',
    description:
      'A music box falls through the chord of {F} and answers from above, on a fluttering cassette; it comes round.',
    preset: 'nature-film-nursery-music-box',
    ...cycled(8, [
      [0, 1, 77],
      [0.62, 1, 72],
      [1.19, 1, 69],
      [1.93, 1.2, 72],
      [3.1, 1, 79],
      [3.67, 1, 76],
      [4.31, 1, 72],
      [5.12, 1.5, 77],
    ]),
    // The cassette flutters its own way each time round: the two ends are added in power.
    loopFold: 'power',
  },
  {
    n: 95,
    id: 'vibraphone-round-am',
    name: 'Vibraphone round {A}m',
    kind: 'melodic',
    description:
      'A vibraphone with its motor on opens {A} minor upwards and comes back down, on slow tape; it comes round.',
    preset: 'nature-film-vibraphone-reel',
    // The motor turns thirty times in the loop.
    set: { motorRate: 3.75 },
    ...cycled(8, [
      [0, 1.5, 57, 0.7],
      [0.71, 1.2, 64, 0.6],
      [1.52, 1.5, 67, 0.65],
      [2.83, 1.2, 72, 0.7],
      [3.6, 1.6, 71, 0.6],
      [4.95, 1.4, 67, 0.6],
      [5.58, 1.5, 64, 0.55],
    ]),
  },
  {
    n: 96,
    id: 'caravan-picking-c',
    name: 'Caravan picking {C}',
    kind: 'melodic',
    description:
      'A steel-string fingerpicked over a low {C} and then a low {G}, on slow tape that sags; it comes round.',
    preset: 'nature-film-caravan-guitar',
    // The phaser goes once round the loop.
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { wow: 0.7, flutter: 0.3, speed: 2, age: 0.4 },
      },
      {
        deviceId: 'phaser',
        preset: 'Classic four-stage',
        params: { rate: 0.125, depth: 45, mix: 0.3 },
      },
    ],
    ...cycled(8, [
      [0, 2, 48, 0.7],
      [0.47, 1.5, 55, 0.55],
      [0.82, 1.5, 64, 0.6],
      [1.55, 1.2, 60, 0.55],
      [3.07, 2, 43, 0.7],
      [3.43, 1.5, 55, 0.55],
      [3.96, 1.5, 62, 0.6],
      [4.61, 1.4, 59, 0.55],
    ]),
  },
  {
    n: 97,
    id: 'sampled-piano-round-e',
    name: 'Sampled piano round {E}',
    kind: 'melodic',
    description:
      'A felted piano in an early sampler rises from a low {E}, leans on the note above and falls; it comes round.',
    preset: 'nature-film-sampled-felt-piano',
    // Every stroke as hard as the next, under a limiter: one stood far over the others in some keys.
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
      {
        deviceId: 'vintage-digital',
        preset: 'Dusty',
        params: { rate: 9000, jitter: 0.35, drive: 6 },
      },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 520, feedback: 0.4, mix: 0.25 },
      },
    ],
    ...cycled(8, [
      [0, 1, 52, 0.7],
      [0.5, 1, 59, 0.7],
      [1.1, 0.8, 64, 0.7],
      [1.9, 0.6, 65, 0.7],
      [2.6, 1.2, 64, 0.7],
      [4.21, 0.6, 62, 0.7],
      [4.97, 2, 59, 0.7],
    ]),
  },
  {
    n: 98,
    id: 'sliding-credits-c',
    name: 'Sliding credits {C}',
    kind: 'melodic',
    description:
      'Picked steel notes over {C} left to ring, the last slid down to, under a slow phaser in a long spring; it comes round.',
    preset: 'nature-film-sliding-credits',
    // No volume pedal, a hard pick and a shorter ring: each note starts on its pick. Only the last
    // overlaps the one before, which bends down to it instead of picking. The phaser goes three
    // times round the loop.
    set: { swell: 0, pick: 1, sustain: 9, tone: 4000 },
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.25, mix: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
    ...cycled(12, [
      [0, 1.4, 60, 0.7],
      [1.62, 2.1, 64, 0.65],
      [3.93, 2.1, 67, 0.65],
      [6.24, 2.4, 64, 0.6],
      [8.11, 2.8, 62, 0.65],
    ]),
  },
  {
    n: 99,
    id: 'harp-under-glass-g',
    name: 'Harp under glass {G}',
    kind: 'melodic',
    description:
      'Dry harp plucks up from {G} and back, each answered by a short backwards cloud; it comes round.',
    preset: 'nature-film-harp-under-glass',
    // The limiter stands first: after it the stream keeps more of each pluck.
    effects: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 12, release: 0.3, ride: 0 },
      },
      { deviceId: 'low-bitrate', preset: 'Behind glass', params: { loss: 0.6 } },
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 0.8, mix: 0.35 } },
    ],
    ...cycled(8, [
      [0, 1, 55, 0.7],
      [0.74, 1, 62, 0.6],
      [1.37, 1, 67, 0.65],
      [2.6, 1, 71, 0.7],
      [3.82, 1, 69, 0.6],
      [4.4, 1, 62, 0.55],
      [5.47, 1.2, 67, 0.65],
    ]),
  },
  {
    n: 100,
    id: 'film-strip-keys-fmaj7',
    name: 'Film strip keys {F}maj7',
    kind: 'melodic',
    description:
      'Tines drifting from side to side: {F} major seventh, two notes over it, then {E} minor seventh; it comes round.',
    preset: 'nature-film-film-strip-keys',
    // The tines cross from side to side five times in the loop.
    set: { tremoloRate: 0.625 },
    ...cycled(8, [
      [0, 1.6, 53, 0.6],
      [0.02, 1.6, 60, 0.5],
      [0.04, 1.6, 64, 0.5],
      [0.06, 1.6, 69, 0.55],
      [1.87, 0.8, 72, 0.9],
      [2.71, 0.9, 76, 0.85],
      [3.94, 1.6, 52, 0.6],
      [3.96, 1.6, 59, 0.5],
      [3.98, 1.6, 62, 0.5],
      [4.0, 1.6, 67, 0.55],
      [5.63, 1.2, 71, 0.9],
    ]),
  },
])
