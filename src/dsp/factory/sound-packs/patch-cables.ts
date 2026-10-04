// The sounds of the pack "Island Patch Cables": its presets played, a hundred sounds to
// paint with. Numbers 19001 to 19100.

import { type PatchDevice } from '../../../core/devices/patch'
import { PRESETS } from '../packs/patch-cables'
import { type FactorySound } from '../types'
import { breathe, cycled, looped, packSounds, played, quarterTurn, soften } from './recipe'

// A plucked drone lute stands 6 dB over its own ringing at every pluck: the limiter takes
// the pluck down and the compressor brings the strings back up behind it.
const HELD: PatchDevice = {
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
}
const LEVELLED: readonly PatchDevice[] = [
  { deviceId: 'fet-limiter', params: { inputGain: 30, outputGain: -12 } },
  HELD,
]

export const SOUNDS: readonly FactorySound[] = packSounds('patch-cables', 19000, PRESETS, [
  // Drones: one note or two, held on the patch, the reeds, the voices and the drone lutes.
  {
    n: 1,
    id: 'stepped-current-a',
    name: 'Stepped current {A}',
    kind: 'drone',
    description: 'A low folding {A} with a band stepping at random over it, in a small dark room.',
    preset: 'patch-cables-stepped-current',
    // No lower: its modulator runs an octave under the key, and five semitones down from an
    // {E} that is under 40 Hz, where the fold is heard as noise.
    ...looped(8, 5, 3, [45]),
  },
  {
    n: 2,
    id: 'greenhouse-hum-c',
    name: 'Greenhouse hum {C}',
    kind: 'drone',
    description:
      'Pure partials of a just major chord over a low {C}, with air in them and a flanger moving in steps.',
    preset: 'patch-cables-greenhouse-hum',
    // The partials wander less than the preset's: at its 0.7 the level moved 3.7 dB, a pad.
    set: { movement: 0 },
    // And the flanger's steps are quieter: at the preset's level each step read as a note two
    // semitones up, where the sound was a phrase.
    effects: [
      { deviceId: 'flanger', preset: 'Stepped random', params: { rate: 3, depth: 45, mix: 0.18 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    then: [HELD],
    ...looped(8, 5, 3, [48]),
  },
  {
    n: 3,
    id: 'quick-cycle-g',
    name: 'Quick cycle {G}',
    kind: 'drone',
    description:
      'Four buzzing strings on {D} and {G} plucked round, three rounds to the loop, with octave echoes.',
    preset: 'patch-cables-quick-cycle',
    // Twelve plucks from the fifth one on take 8 s at this speed. The strings behind are tuned
    // to the key that is played, not to the preset's D, whose third is a black key.
    set: { speed: 2.698, decay: 30 },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Octave hop',
        // A third of a second, not the preset's 330 ms: its octave hop then takes a round exactly.
        params: { time: 333.33, feedback: 0.4, tone: 6000, mix: 0.25 },
      },
      { deviceId: 'sympathetic', preset: 'Open triad', params: { root: 7, mix: 0.3 } },
    ],
    then: LEVELLED,
    ...looped(8, 2.77, 0.45, [55]),
  },
  {
    n: 4,
    id: 'seventh-string-f',
    name: 'Seventh string {F}',
    kind: 'drone',
    description:
      'A drone lute on {F} with {E} on its first string, two rounds to the loop, in a halo that slides upward.',
    preset: 'patch-cables-seventh-string-halo',
    set: { speed: 4.047, decay: 30 },
    then: LEVELLED,
    ...looped(8, 4.15, 0.45, [53]),
  },
  {
    n: 5,
    id: 'reed-organ-spin-d',
    name: 'Reed organ spin {D}',
    kind: 'drone',
    description: 'A pumped reed organ on {D} and {A} through a rotating speaker at full speed.',
    preset: 'patch-cables-reed-organ-spinning',
    // A limiter holds the level: the bellows and the turning speaker moved it by 2.3 dB, close
    // to a pad, and four semitones up each turn of the speaker read as a note.
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 15, release: 0.3, ride: 0 } },
    ],
    ...looped(8, 4, 2, [50, [57, 0.8]]),
  },
  {
    n: 6,
    id: 'low-brother-g',
    name: 'Low brother {G}',
    kind: 'drone',
    description:
      'One voice holding {G} with a grainy copy an octave below and a quieter {D} above, in a short halo.',
    preset: 'patch-cables-low-brother',
    set: { vibrato: 0, motion: 0 },
    then: [HELD],
    // On G every overtone up to the tenth is a white key. On D the vowel sat on the fifth one five
    // semitones down, and more than a third of the sound was the major third, a black key. And
    // on the low G: an octave higher the grains of the copy beat the level into a pad.
    ...looped(8, 5, 2, [43]),
  },
  {
    n: 7,
    id: 'subtone-octaves-b',
    name: 'Subtone octaves {B}',
    kind: 'drone',
    description: 'A breathy low reed on {B} with its octave below and above, in a spring tank.',
    preset: 'patch-cables-subtone-octaves',
    // No vibrato and a held level: with them the breath swelled into a pad in half the keys.
    set: { vibrato: 0 },
    then: [HELD],
    ...looped(8, 5, 2, [47]),
  },
  {
    n: 8,
    id: 'tape-choir-raised-g',
    name: 'Tape choir raised {G}',
    kind: 'drone',
    description:
      'A taped choir on {G} with a wavering copy of itself an octave up, small and high in a hall.',
    preset: 'patch-cables-tape-choir-raised',
    set: { vibrato: 0.15, age: 0.1 },
    then: [HELD],
    // On G its vowel sits on white keys; on D, E or B a third of the sound is the major third.
    ...looped(8, 5, 2, [55]),
  },
  {
    n: 9,
    id: 'patched-harmony-c',
    name: 'Patched harmony {C}',
    kind: 'drone',
    description: 'One folded tone held on {C}, with an {E} found for it above and another below.',
    preset: 'patch-cables-patched-harmony',
    ...looped(8, 5, 2, [60]),
  },
  {
    n: 10,
    id: 'mirror-flute-g',
    name: 'Mirror flute {G}',
    kind: 'drone',
    description: 'A soft flute held on {G}, with its mirror on the {A} below and a {B} above it.',
    preset: 'patch-cables-mirror-flute',
    set: { vibrato: 0 },
    then: LEVELLED,
    ...looped(8, 5, 2, [67]),
  },
  {
    n: 11,
    id: 'seventh-stack-e',
    name: 'Seventh stack {E}',
    kind: 'drone',
    description: 'One low voice on oo holding {E}, stacked into {E} minor seventh from the scale.',
    preset: 'patch-cables-seventh-stack',
    set: { vibrato: 0, motion: 0 },
    then: LEVELLED,
    ...looped(8, 5, 2, [52]),
  },
  {
    n: 12,
    id: 'low-pedal-sawing-a',
    name: 'Low pedal sawing {A}',
    kind: 'drone',
    description: 'A bass {A} held under a resonant filter that ramps open four times a second.',
    preset: 'patch-cables-low-pedal-sawing',
    then: [HELD],
    ...looped(8, 4, 2, [33]),
  },
  {
    n: 13,
    id: 'brass-triad-f',
    name: 'Brass triad {F}',
    kind: 'drone',
    description: 'One breathy flugelhorn on {F}, made a close triad by two voices from the scale.',
    preset: 'patch-cables-brass-triads',
    // No vibrato and a held level: the three horns beat into a pad one and four semitones up.
    set: { vibrato: 0 },
    then: [HELD],
    ...looped(8, 5, 2, [65]),
  },
  {
    n: 14,
    id: 'reed-thirds-e',
    name: 'Reed thirds {E}',
    kind: 'drone',
    description: 'A warm clarinet held on a low {E}, with a {G} found above it and another below.',
    preset: 'patch-cables-reed-thirds',
    // Less air than the preset: the breath wandered by 2 dB and the fold with it.
    set: { breath: 0.2 },
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 5, 2, [52]),
  },
  {
    n: 15,
    id: 'reed-loop-in-thirds-f',
    name: 'Reed loop in thirds {F}',
    kind: 'drone',
    description:
      'The bass clarinet looped on a sampler an octave up, on {F}, with a third above and a sixth below.',
    preset: 'patch-cables-sample-in-thirds',
    source: 'bass-clarinet-f',
    ...looped(8, 5, 2, [72]),
  },

  // Pads: chords on the patch and the instruments folded into it, moving slowly.
  {
    n: 16,
    id: 'folded-morning-dm',
    name: 'Folded morning {D}m',
    kind: 'pad',
    description:
      'A chord of {D} minor whose overtones have folded open, turned by a phaser and swelling once a loop.',
    preset: 'patch-cables-folded-morning',
    // The phaser at one turn a loop, not the preset's 0.12 Hz, which is short of one.
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3, damping: 0.25 } },
    ],
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 3, [50, 57, [65, 0.7]]),
  },
  {
    n: 17,
    id: 'green-vowels-am',
    name: 'Green vowels {A}m',
    kind: 'pad',
    description:
      'A chord of {A} minor that talks, the table running through its vowels, in a small room that sings back.',
    preset: 'patch-cables-green-vowels',
    // Two turns of the vowels to a loop, and a swell: by itself the chord held as still as a drone.
    set: { rate: 0.25 },
    then: [breathe(0.125, 0.5)],
    ...looped(8, 4, 2, [57, 64, [72, 0.7]]),
  },
  {
    n: 18,
    id: 'morning-window-c',
    name: 'Morning window {C}',
    kind: 'pad',
    description:
      'Clear glass on {C} and {G} with a twelfth laid over every note like an organ mixture, in a hall.',
    preset: 'patch-cables-morning-window',
    then: [breathe(0.125, 0.4)],
    ...looped(8, 5, 3, [48, 60, [67, 0.8]]),
  },
  {
    n: 19,
    id: 'octave-siblings-em',
    name: 'Octave siblings {E}m',
    kind: 'pad',
    description:
      'Small high voices on ooh holding {E} minor, with a copy an octave above them and a spring.',
    preset: 'patch-cables-octave-siblings',
    then: [breathe(0.125, 0.4)],
    ...looped(8, 5, 2, [64, 67, [71, 0.8]]),
  },
  {
    n: 20,
    id: 'reed-section-f6',
    name: 'Reed section {F}6',
    kind: 'pad',
    description:
      'Hollow clarinets holding {F} sixth, lightly doubled, swelling once a loop in a hall.',
    preset: 'patch-cables-reed-section',
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 2, [53, 60, [62, 0.8], [69, 0.7]]),
  },
  {
    n: 21,
    id: 'crystal-chord-cadd9',
    name: 'Crystal chord {C}add9',
    kind: 'pad',
    description:
      'A crystalline chord of {C} with a ninth, phased slowly, a faint halo two octaves above it.',
    preset: 'patch-cables-crystal-chord',
    set: { spread: 0.4 },
    // The phaser at one turn a loop: the preset's 0.2 Hz does not come round in 8 s, and at two
    // turns its sweeps were counted as strokes.
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.125, mix: 0.35 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.25 } },
    ],
    ...looped(8, 5, 3, [48, 55, [62, 0.8], [64, 0.7]]),
  },
  {
    n: 22,
    id: 'glass-in-a-sung-ee-a',
    name: 'Glass in a sung ee {A}',
    kind: 'pad',
    description: 'Glass tones holding {A}, {E}, {G} and {B} in a hall shaped like a high sung ee.',
    preset: 'patch-cables-glass-in-a-sung-ee',
    ...looped(8, 5, 3, [57, 64, [67, 0.8], [71, 0.7]]),
  },
  {
    n: 23,
    id: 'sunlit-brass-c',
    name: 'Sunlit brass {C}',
    kind: 'pad',
    description:
      'An open string and brass chord on {C} and {G} with the octave above mixed in, in a hall.',
    preset: 'patch-cables-sunlit-brass',
    // An open fifth, and the two layers closer in tune than the preset's 14 cents: with a third
    // in it and that much detuning the chord is heard as noise.
    set: { detune: 5 },
    then: [breathe(0.125, 0.4)],
    ...looped(8, 5, 3, [48, 55, [60, 0.8]]),
  },
  {
    n: 24,
    id: 'section-in-leaf-e',
    name: 'Section in leaf {E}',
    kind: 'pad',
    description:
      'Six unmuted players on {E} and {B} with a wide vibrato, a soft synthetic section an octave up behind.',
    preset: 'patch-cables-section-in-leaf',
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 3, [52, 59, [64, 0.8]]),
  },
  {
    n: 25,
    id: 'chorus-morning-f',
    name: 'Chorus morning {F}',
    kind: 'pad',
    description:
      'A bright sawtooth and pulse chord on {F} and {C} through both choruses, a halo an octave and a fifth above.',
    preset: 'patch-cables-chorus-morning',
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 3, [53, 60, [65, 0.8]]),
  },
  {
    n: 26,
    id: 'grain-canopy-g',
    name: 'Grain canopy {G}',
    kind: 'pad',
    description:
      'The high flutes on {G} with a ninth as a cloud of grains, half of them an octave up, wide in a hall.',
    preset: 'patch-cables-grain-canopy',
    source: 'high-flutes-gadd9',
    ...looped(8, 4, 2, [60]),
  },
  {
    n: 27,
    id: 'octave-choir-am',
    name: 'Octave choir {A}m',
    kind: 'pad',
    description:
      'The choir chord on {A} minor held on a loop, with octaves above and below, in an ensemble chorus.',
    preset: 'patch-cables-sample-octave-choir',
    source: 'choir-chord-am',
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 2, [60]),
  },
  {
    n: 28,
    id: 'swelled-and-stacked-g',
    name: 'Swelled and stacked {G}',
    kind: 'pad',
    description:
      'A guitar chord on {G} faded in with the volume knob and stacked with octaves until it is an organ.',
    preset: 'patch-cables-swelled-and-stacked',
    ...played(
      8,
      [
        [0, 5, 43],
        [0, 5, 50],
        [0, 5, 55],
        [0, 5, 59],
        [0, 5, 62],
      ],
      2,
    ),
  },
  {
    n: 29,
    id: 'top-octave-light-d',
    name: 'Top octave light {D}',
    kind: 'pad',
    description:
      'A string ensemble on {D}, {A} and {E} with its top octave full up, thin and high in a hall.',
    preset: 'patch-cables-top-octave-light',
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 2, [62, 69, [76, 0.7]]),
  },
  {
    n: 30,
    id: 'sung-wire-a',
    name: 'Sung wire {A}',
    kind: 'pad',
    description:
      'A string on {A} and {E} held singing by a magnet, turned in a slow rotating speaker.',
    preset: 'patch-cables-sung-wire',
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 5, 2, [45, [52, 0.7]]),
  },
  {
    n: 31,
    id: 'horn-fifths-d',
    name: 'Horn fifths {D}',
    kind: 'pad',
    description:
      'Low horns on {D} with the {A} above every note, under a tremolo that shimmers, in a hall.',
    preset: 'patch-cables-horn-fifths',
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 5, 2, [38, [50, 0.7]]),
  },
  {
    n: 32,
    id: 'overtone-ferns-g',
    name: 'Overtone ferns {G}',
    kind: 'pad',
    description:
      'The harmonic series of a low {G}, buzzing and wandering, with shards of it an octave up.',
    preset: 'patch-cables-overtone-ferns',
    // The shards denser and quieter than the preset's: twelve a second were heard as hits.
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Glass shards',
        params: { size: 60, density: 40, spread: 0.7, mix: 0.2 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25, decay: 6, width: 0.8 } },
    ],
    then: [breathe(0.125, 0.6)],
    ...looped(8, 5, 3, [43]),
  },
  {
    n: 33,
    id: 'hollow-reeds-e',
    name: 'Hollow reeds {E}',
    kind: 'pad',
    description:
      'A hollow digital reed held on {E}, with a mirrored voice and a third above, in a spring tank.',
    preset: 'patch-cables-hollow-reeds',
    set: { rate: 0.625, spread: 0.3 },
    ...looped(8, 5, 2, [64]),
  },
  {
    n: 34,
    id: 'flutter-tongue-a',
    name: 'Flutter tongue {A}',
    kind: 'pad',
    description:
      'A full-blown flute on {A} with a fast flutter in its tone and a loop of itself an octave up.',
    preset: 'patch-cables-flutter-tongue',
    then: [breathe(0.125, 0.4)],
    ...looped(8, 5, 2, [69]),
  },
  {
    n: 35,
    id: 'canopy-air-dsus2',
    name: 'Canopy air {D}sus2',
    kind: 'pad',
    description:
      'Low flutes on {D}, {A} and {E} with breath in the tone, swaying in a deep slow chorus.',
    preset: 'patch-cables-canopy-air',
    // Less air than the preset's 0.7, at which the chord is heard as noise, and the chorus at
    // two sways a loop, not the preset's 0.3 Hz, which does not come round.
    set: { breath: 0.3 },
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.25, mix: 0.4 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { mix: 0.3 } },
    ],
    ...looped(8, 5, 3, [50, 57, [64, 0.8]]),
  },
  {
    n: 36,
    id: 'talking-greens-d',
    name: 'Talking greens {D}',
    kind: 'pad',
    description:
      'A straight-toned ee on {D} and {A} with a band-pass stepping at random through it.',
    preset: 'patch-cables-talking-greens',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Stepped',
        params: { cutoffHz: 1500, resonance: 3, lfoAmount: 60, lfoRateHz: 6, mix: 0.5 },
      },
      {
        deviceId: 'grain-delay',
        preset: 'Plain repeat',
        params: { time: 300, spread: 0.6, mix: 0.25 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.45 } },
    ],
    ...looped(8, 5, 2, [50, 57, [62, 0.8]]),
  },
  {
    n: 37,
    id: 'greenhouse-hum-f',
    name: 'Greenhouse hum {F}',
    kind: 'pad',
    description:
      'Pure partials of a just major chord over {F} in two octaves, wandering, with a stepping flanger.',
    preset: 'patch-cables-greenhouse-hum',
    // The partials wander three times a loop: the preset's 0.3 Hz does not come round.
    set: { rate: 0.375 },
    ...looped(8, 5, 3, [41, [53, 0.7]]),
  },

  // Textures: weather on the island and the patch washed out until no pitch is left.
  {
    n: 38,
    id: 'pinging-window-rain',
    name: 'Pinging window rain',
    kind: 'texture',
    description:
      'Rain on a window through a resonant band that steps at random, so the drops ping.',
    preset: 'patch-cables-pinging-rain',
    // Less of the saturator than the preset's 16 dB: pressed that flat the rain was the loudest
    // texture of the pack and the pings did not stand out of it.
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Stepped',
        params: { cutoffHz: 1400, resonance: 8, lfoAmount: 60, lfoRateHz: 5, mix: 0.75 },
      },
      { deviceId: 'saturator', params: { curve: 0, driveDb: 6, outputDb: -4 } },
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 250, feedback: 0.4, mix: 0.3 },
      },
      { deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { mix: 0.25 } },
    ],
    ...looped(8, 3, 2, [64]),
  },
  {
    n: 39,
    id: 'gusts-through-firs',
    name: 'Gusts through firs',
    kind: 'texture',
    description: 'A gusting wind that half sings, with a fifth laid above it, in a mid-sized hall.',
    preset: 'patch-cables-wind-through-firs',
    set: { resonance: 0.4 },
    ...looped(16, 4, 3, [62]),
  },
  {
    n: 40,
    id: 'frog-pond-with-hops',
    name: 'Frog pond with hops',
    kind: 'texture',
    description:
      'A spring pond of frogs close by, with echoes of them that jump a fifth up and a fourth down.',
    preset: 'patch-cables-pond-with-hops',
    // No F or B among the keys: the echo plays a fifth up, a fifth down, a fourth up and a fourth
    // down, and one of them is a black key from either.
    ...looped(8, 4, 2, [43, 48, 55, 60, 62]),
  },
  {
    n: 41,
    id: 'distant-birds-on-cables',
    name: 'Distant birds on cables',
    kind: 'texture',
    description:
      'A dawn chorus across a wood, with quick backwards flickers of each call thrown to either side, in a hall.',
    preset: 'patch-cables-birds-on-cables',
    // A crowd of birds further off, a little duller, and more of the hall than the preset has:
    // a few close by are a phrase of pitched calls, not a texture.
    set: { density: 1, distance: 0.9, tone: 0.3 },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Flicker',
        params: { time: 180, spread: 0.7, mix: 0.5 },
      },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.55, width: 0.6, tone: 4000 } },
    ],
    ...looped(8, 4, 2, [43, 48, 53, 55, 57, 60, 64, 67]),
  },
  {
    n: 42,
    id: 'breathing-bands-d',
    name: 'Breathing bands {D}',
    kind: 'texture',
    description:
      'Soft bands of tuned noise on {D} and its fifth, swelling in turn three times a loop, chorused in a hall.',
    preset: 'patch-cables-breathing-bands',
    set: { resonance: 20, breatheRate: 0.375 },
    ...looped(8, 4, 2, [62, 69]),
  },
  {
    n: 43,
    id: 'patched-breath-c',
    name: 'Patched breath {C}',
    kind: 'texture',
    description:
      'Mostly air: a whispered chord over {C} phasing slowly in a frequency shifter, crystals an octave up.',
    preset: 'patch-cables-patched-breath',
    ...looped(8, 5, 3, [48, 52, 55, 59, 62, 64, 69]),
  },
  {
    n: 44,
    id: 'spectral-garden-haze',
    name: 'Spectral garden haze',
    kind: 'texture',
    description:
      'Six bright shifting notes run together into a haze, grains of it falling an octave above.',
    preset: 'patch-cables-spectral-garden',
    set: { rate: 0.375 },
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 3, [53, 60, 64, 67, 69, 74]),
  },
  {
    n: 45,
    id: 'tide-under-the-dock',
    name: 'Tide under the dock',
    kind: 'texture',
    description:
      'Slow waves on a shore, turned once a loop by a phaser, with a spring tank behind them.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Slow shore',
      params: { density: 0.7, movement: 0.5, attack: 0.5, width: 0.6 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.0625, mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    ...looped(16, 3, 3, [60]),
  },
  {
    n: 46,
    id: 'creek-through-the-patch',
    name: 'Creek through the patch',
    kind: 'texture',
    description:
      'A small stream close by, flickers of it coming back from either side, in a tight swarm of echoes.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Small stream',
      params: { density: 0.5, distance: 0.15, attack: 0.5, width: 0.8 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Flickers', params: { time: 250, mix: 0.3 } },
      { deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { mix: 0.25 } },
    ],
    ...looped(8, 3, 2, [64]),
  },
  {
    n: 47,
    id: 'thunder-in-the-tank',
    name: 'Thunder in the tank',
    kind: 'texture',
    description:
      'A storm far off whose rolls of thunder overlap, shaking a long three-spring tank.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { density: 1, tone: 0.65, movement: 0.4, width: 0.8 },
    },
    effects: [
      soften(8),
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.35 } },
    ],
    ...looped(16, 1, 3, [36, 43, 48, 53]),
  },
  {
    n: 48,
    id: 'island-downpour',
    name: 'Island downpour',
    kind: 'texture',
    description:
      'Heavy rain at a distance, pushed into a saturator and repeated by three tape heads.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Distant downpour',
      params: { attack: 0.5, width: 0.6 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 0, driveDb: 16, outputDb: -11.5 } },
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 250, feedback: 0.4, mix: 0.3 },
      },
    ],
    ...looped(8, 3, 2, [55]),
  },
  {
    n: 49,
    id: 'woodstove-in-a-spring',
    name: 'Woodstove in a spring',
    kind: 'texture',
    description: 'A small fire crackling close by, each snap dripping in a two-spring tank.',
    instrument: { deviceId: 'atmosphere', preset: 'Hearth', params: { attack: 0.5, width: 0.6 } },
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 12, outputDb: -6 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
    ...looped(8, 3, 2, [52]),
  },

  // One-shots: one note or one chord, struck, plucked or stabbed, ringing out through the patch.
  {
    n: 50,
    id: 'tines-with-octaves-a',
    name: 'Tines with octaves {A}',
    kind: 'oneshot',
    description:
      'One {A} on a bell-like electric piano with the octave above and below it, in a light chorus.',
    preset: 'patch-cables-tines-with-octaves',
    ...played(5, [[0, 1.2, 57]], 1),
  },
  {
    n: 51,
    id: 'piano-climbing-c',
    name: 'Piano, climbing {C}',
    kind: 'oneshot',
    description:
      'One low {C} on a bare piano, repeated an octave higher and then higher again, in a plate.',
    preset: 'patch-cables-piano-climbing',
    // The octaves under the note: at the preset's level a high key's first repeat is a second hit.
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Rising steps',
        params: { mode: 3, delay: 60, feedback: 0.45, mix: 0.18 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.25 } },
    ],
    ...played(6, [[0, 1.5, 48]], 1),
  },
  {
    n: 52,
    id: 'ring-piano-d',
    name: 'Ring piano {D}',
    kind: 'oneshot',
    description:
      'One {D} on a felted piano with a frequency shifter mixed in, so a second pitch rings above the note.',
    preset: 'patch-cables-ring-piano',
    // The shifter adds 147 Hz to every partial, which is a {D}: on this key the second pitch is
    // the next step of the note's own harmonic series, and in any other key it is a bell's.
    ...played(6, [[0, 2, 50]], 1),
  },
  {
    n: 53,
    id: 'steel-bell-double-g',
    name: 'Steel bell double {G}',
    kind: 'oneshot',
    description:
      'One hard-picked {G} on a steel guitar, doubled a few cents either side, in a spring that chirps.',
    preset: 'patch-cables-steel-bell-double',
    // Less of the double and of the spring's drip: in a high key the beating of the one and the
    // chirps of the other came out as a pulse.
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Doubler', params: { spread: 0.7, mix: 0.22 } },
      {
        deviceId: 'spring-reverb',
        preset: 'Surf drip',
        params: { mix: 0.18, drive: 0.3, drip: 0.3 },
      },
    ],
    ...played(6, [[0, 3, 55]], 1),
  },
  {
    n: 54,
    id: 'music-box-inhale-e',
    name: 'Music box inhale {E}',
    kind: 'oneshot',
    description:
      'One hard chime bar on a high {E}, followed by a reverb that swells up backwards and cuts off.',
    preset: 'patch-cables-music-box-inhale',
    ...played(5, [[0, 1.2, 76]], 1),
  },
  {
    n: 55,
    id: 'glockenspiel-sparks-a',
    name: 'Glockenspiel sparks {A}',
    kind: 'oneshot',
    description:
      'One small metal bar on a high {A}, breaking into quick octaves and fifths above it.',
    preset: 'patch-cables-glockenspiel-sparks',
    ...played(5, [[0, 1.2, 81]], 1),
  },
  {
    n: 56,
    id: 'motor-and-octave-f',
    name: 'Motor and octave {F}',
    kind: 'oneshot',
    description:
      'One vibraphone bar on {F} with the motor turning, followed a moment later by itself an octave up.',
    preset: 'patch-cables-motor-and-octave',
    ...played(7, [[0, 3, 65]], 1.5),
  },
  {
    n: 57,
    id: 'tongue-drum-echo-a',
    name: 'Tongue drum echo {A}',
    kind: 'oneshot',
    description:
      'One soft tap on a steel tongue drum on {A}, its echoes coming back from further off, some backwards.',
    preset: 'patch-cables-tongue-drum-echo',
    // Ringing longer than the preset's 4 s: one soft tap that dies sooner is the quietest
    // one-shot of the pack by 2 LU.
    set: { decay: 6 },
    ...played(8, [[0, 1.5, 57]], 2),
  },
  {
    n: 58,
    id: 'scattered-strum-cmaj7',
    name: 'Scattered strum {C}maj7',
    kind: 'oneshot',
    description:
      'A toy chord harp holding {C} major seventh, swept once in a random order, with a chorused echo.',
    preset: 'patch-cables-scattered-strum',
    // Swept fast enough to be one stroke: at the preset's pace it has no single attack.
    set: { strum: 20 },
    ...played(
      5,
      [
        [0, 1, 60],
        [0, 1, 64],
        [0, 1, 67],
        [0, 1, 71],
      ],
      1,
    ),
  },
  {
    n: 59,
    id: 'kelp-bell-f',
    name: 'Kelp bell {F}',
    kind: 'oneshot',
    description:
      'One clangorous modulated strike on {F} that dulls to a pure ring, with faint echoes an octave up.',
    preset: 'patch-cables-kelp-bells',
    // The climbing echoes under the strike: at the preset's level they are strikes of their own.
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Rising steps', params: { delay: 280, mix: 0.12 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.25 } },
    ],
    ...played(8, [[0, 2, 65]], 2),
  },
  {
    n: 60,
    id: 'glass-mallets-b',
    name: 'Glass mallets {B}',
    kind: 'oneshot',
    description:
      'One clear mallet tone on {B}, with echoes that hop an octave up on every other step.',
    preset: 'patch-cables-glass-mallets',
    // The echoes under the note, not beside it: at the preset's level the first one is a second hit.
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Octave hop',
        params: { time: 190, feedback: 0.55, tone: 6500, spread: 0.8, mix: 0.18 },
      },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.2 } },
    ],
    ...played(5, [[0, 0.8, 71]], 1),
  },
  {
    n: 61,
    id: 'celesta-steps-f',
    name: 'Celesta steps {F}',
    kind: 'oneshot',
    description:
      'One damped celesta note on a high {F}, with a tape echo on three heads walking away behind it.',
    preset: 'patch-cables-celesta-steps',
    ...played(6, [[0, 0.8, 77]], 1),
  },
  {
    n: 62,
    id: 'ice-ladder-g',
    name: 'Ice ladder {G}',
    kind: 'oneshot',
    description:
      'One thin glass chime on {G}, followed by delayed copies an octave and a fifth above that keep climbing.',
    preset: 'patch-cables-ice-ladder',
    ...played(8, [[0, 1.2, 67]], 1.5),
  },
  {
    n: 63,
    id: 'brass-sprout-f',
    name: 'Brass sprout {F}',
    kind: 'oneshot',
    description:
      'A short synthetic brass stab on {F} major, its filter snapping open, bounced on dotted tape heads.',
    preset: 'patch-cables-brass-sprouts',
    ...played(
      5,
      [
        [0, 0.3, 53],
        [0, 0.3, 60],
        [0, 0.3, 65],
        [0, 0.3, 69],
      ],
      1,
    ),
  },
  {
    n: 64,
    id: 'tine-bubbles-em7',
    name: 'Tine bubbles {E}m7',
    kind: 'oneshot',
    description:
      'Digital tine keys on {E} minor seventh through a band-pass that opens with the chord: one small wah.',
    preset: 'patch-cables-tine-bubbles',
    ...played(
      5,
      [
        [0, 1.2, 52],
        [0, 1.2, 59],
        [0, 1.2, 62],
        [0, 1.2, 67],
      ],
      1,
    ),
  },
  {
    n: 65,
    id: 'pulse-pluck-d',
    name: 'Pulse pluck {D}',
    kind: 'oneshot',
    description:
      'One low {D} plucked on a chorus polysynth, the filter closing fast on a moving pulse, with a dark echo.',
    preset: 'patch-cables-pulse-sequence',
    // Narrowed: the wide chorus and the spread echo left little in the middle in the high keys.
    then: [{ deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...played(5, [[0, 0.4, 50]], 1),
  },
  {
    n: 66,
    id: 'ensemble-stab-g',
    name: 'Ensemble stab {G}',
    kind: 'oneshot',
    description:
      'A short sawtooth string stab on {G} major, up high and thin, swirled by a phaser, with tape repeats.',
    preset: 'patch-cables-ensemble-stabs',
    // The tape repeats under the stab: at the preset's level the first one is as loud as the chord.
    // The keys are up before the first repeat comes, a quarter of a second in.
    effects: [
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.6, mix: 0.35 } },
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 250, feedback: 0.4, mix: 0.18 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    ...played(
      5,
      [
        [0, 0.2, 67],
        [0, 0.2, 71],
        [0, 0.2, 74],
        [0, 0.2, 79],
      ],
      1,
    ),
  },
  {
    n: 67,
    id: 'gated-reed-a',
    name: 'Gated reed {A}',
    kind: 'oneshot',
    description:
      'One {A} from a reed table through a filter that snaps open and falls shut like a gate, with a tape echo.',
    preset: 'patch-cables-reed-sequence',
    ...played(5, [[0, 0.5, 57]], 1),
  },
  {
    n: 68,
    id: 'cedar-pluck-g',
    name: 'Cedar pluck {G}',
    kind: 'oneshot',
    description:
      'One folded pluck on {G} through a low-pass gate, answered a fifth up by a bucket-brigade echo.',
    preset: 'patch-cables-cedar-plucks',
    // Not on F: the echo's step back plays the end of the pluck a fifth down, a black key under
    // F. The pluck rings longer than the preset's and is levelled before the echo, which is kept
    // under it: as the preset has them the pluck is all peak and its echoes are plucks of their own.
    set: { decay: 1.5 },
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 12, outputDb: -8 } },
      { deviceId: 'fet-limiter', params: { inputGain: 24, outputGain: -8 } },
      {
        deviceId: 'analog-delay',
        preset: 'Fifth hop',
        params: { time: 250, feedback: 0.5, tone: 5200, intervalB: 0, step: 1, mix: 0.2 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2, tone: 4500 } },
    ],
    ...played(5, [[0, 0.5, 55]], 1),
  },
  {
    n: 69,
    id: 'rolled-greens-e',
    name: 'Rolled greens {E}',
    kind: 'oneshot',
    description:
      'A marimba fifth on {E} kept alive by a soft roll for a second, then let go in a hall.',
    preset: 'patch-cables-rolled-greens',
    ...played(
      6,
      [
        [0, 1.2, 52],
        [0, 1.2, 59],
      ],
      1.5,
    ),
  },
  {
    n: 70,
    id: 'twelve-in-steps-c',
    name: 'Twelve in steps {C}',
    kind: 'oneshot',
    description:
      'A strummed twelve-string chord of {C} major with a phaser jumping between random settings.',
    preset: 'patch-cables-twelve-in-steps',
    // The picks rounded off before the phaser: ten strings picked at once are all peak, and the
    // chord behind them came out 2 LU quieter. It has rung out after 3 s, so no longer than 4.
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 12, outputDb: -6 } },
      { deviceId: 'phaser', preset: 'Random steps', params: { depth: 60, mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
    // A hundredth of a second in: the pick lands on the first frame otherwise, and that is a step.
    ...played(
      4,
      [
        [0.01, 3, 48],
        [0.01, 3, 55],
        [0.01, 3, 60],
        [0.01, 3, 64],
        [0.01, 3, 67],
      ],
      1,
    ),
  },
  {
    n: 71,
    id: 'quick-bow-a',
    name: 'Quick bow {A}',
    kind: 'oneshot',
    description:
      'One short bow stroke on {A} from a small section, close and woody, three tape heads behind.',
    preset: 'patch-cables-quick-bows',
    ...played(4, [[0, 0.3, 57]], 1),
  },
  {
    n: 72,
    id: 'tuned-drum-knock-c',
    name: 'Tuned drum knock {C}',
    kind: 'oneshot',
    description:
      'One knock on a hollow drum tuned to {C}, through a transformer, with soft dotted tape heads behind.',
    preset: 'patch-cables-tuned-drum-knocks',
    // One knock is all peak: it is levelled before the echo, and the echo kept under it.
    set: { decay: 0.5 },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.7, output: 0 } },
      { deviceId: 'fet-limiter', params: { inputGain: 28, outputGain: -8 } },
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 190, feedback: 0.45, heads: 3, spread: 0.8, mix: 0.18 },
      },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
    ...played(4, [[0, 0.4, 48]], 1),
  },
  {
    n: 73,
    id: 'thumb-piano-crystal-e',
    name: 'Thumb piano crystal {E}',
    kind: 'oneshot',
    description:
      'One short damped metal tongue on {E}, with faint grains of it coming back an octave up.',
    preset: 'patch-cables-thumb-piano-crystals',
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Crystals',
        params: { time: 250, feedback: 0.35, mix: 0.14 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    ...played(5, [[0, 1, 64]], 1),
  },

  // Phrases: lines in free time, half of them coming round as loops, half ending.
  {
    n: 74,
    id: 'kelp-bells-c',
    name: 'Kelp bells {C}',
    kind: 'melodic',
    description:
      'Six clangorous strikes on {C} and its fourth and fifth that dull to a pure ring, the echoes climbing by octaves.',
    preset: 'patch-cables-kelp-bells',
    // Only the keys whose major third is a white one: the bell's modulator puts a third in every strike.
    ...played(
      10,
      [
        [0, 0.6, 72],
        [0.9, 0.6, 67],
        [1.55, 0.6, 79],
        [2.9, 0.8, 77],
        [3.6, 0.6, 72],
        [4.75, 1.2, 65],
      ],
      2,
    ),
  },
  {
    n: 75,
    id: 'deck-rain-patter',
    name: 'Deck rain patter',
    kind: 'melodic',
    description:
      'Tiny woody ticks up high on five notes over {C}, never the same twice, scattered into a patter of octaves.',
    preset: 'patch-cables-deck-rain',
    ...cycled(8, [
      [0, 0.1, 84, 0.7],
      [0.43, 0.1, 91, 0.5],
      [0.71, 0.1, 76, 0.6],
      [1.38, 0.1, 96, 0.5],
      [1.57, 0.1, 79, 0.7],
      [2.29, 0.1, 88, 0.55],
      [2.94, 0.1, 72, 0.6],
      [3.13, 0.1, 93, 0.5],
      [3.86, 0.1, 81, 0.7],
      [4.41, 0.1, 86, 0.5],
      [4.63, 0.1, 74, 0.6],
      [5.52, 0.1, 93, 0.5],
      [5.79, 0.1, 84, 0.65],
      [6.47, 0.1, 79, 0.6],
      [6.92, 0.1, 88, 0.55],
      [7.36, 0.1, 91, 0.5],
    ]),
  },
  {
    n: 76,
    id: 'bright-ferns-g',
    name: 'Bright ferns {G}',
    kind: 'melodic',
    description:
      'Bright folded strings picked upward from {G} and back, the octave of each arriving a moment after it.',
    preset: 'patch-cables-bright-ferns',
    ...cycled(8, [
      [0, 1.2, 55],
      [0.7, 1.2, 62],
      [1.25, 1.2, 67],
      [2.4, 1.2, 71],
      [3.1, 1.2, 74],
      [4.4, 1.5, 69],
      [5.3, 1.5, 62],
    ]),
  },
  {
    n: 77,
    id: 'glass-sprouts-c',
    name: 'Glass sprouts {C}',
    kind: 'melodic',
    description:
      'Quick glassy notes up a {C} chord and wandering back down, each echo hopping up an octave and back.',
    preset: 'patch-cables-glass-sprouts',
    ...cycled(8, [
      [0, 0.15, 72],
      [0.45, 0.15, 76],
      [0.8, 0.15, 79],
      [1.75, 0.15, 84],
      [2.3, 0.15, 79],
      [3.4, 0.15, 74],
      [3.75, 0.15, 77],
      [4.9, 0.15, 72],
      [5.45, 0.15, 67],
    ]),
  },
  {
    n: 78,
    id: 'folded-voice-d',
    name: 'Folded voice {D}',
    kind: 'melodic',
    description:
      'One singer on an open ah from {D}, with a mirrored voice, a third and an octave found for her from the scale.',
    preset: 'patch-cables-folded-voice',
    ...played(
      10,
      [
        [0, 1.4, 62],
        [1.6, 0.7, 65],
        [2.4, 1.6, 69],
        [4.2, 0.8, 67],
        [5.1, 2.2, 64],
      ],
      2,
    ),
  },
  {
    n: 79,
    id: 'xylophone-patter-g',
    name: 'Xylophone patter {G}',
    kind: 'melodic',
    description:
      'Dry hard xylophone bars struck twice and falling from {G}, stuttering and skipping as if the sequencer lost its place.',
    preset: 'patch-cables-xylophone-patter',
    set: { decay: 1.1 },
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 40, outputGain: 0 } }],
    ...played(
      8,
      [
        [0, 0.3, 79],
        [0.38, 0.3, 79],
        [1.05, 0.3, 76],
        [1.83, 0.3, 72],
        [2.17, 0.3, 74],
        [3.21, 0.3, 67],
        [3.64, 0.3, 67],
        [4.52, 0.5, 72],
      ],
      1.5,
    ),
  },
  {
    n: 80,
    id: 'piping-pattern-g',
    name: 'Piping pattern {G}',
    kind: 'melodic',
    description:
      'Short tongued flute notes up from {G}, each echoed a fourth up and back so they run into a pattern.',
    preset: 'patch-cables-piping-pattern',
    // No B and no F in the line: the echo steps a fourth up and, on its way back, a fourth down.
    ...played(
      9,
      [
        [0, 0.2, 67],
        [0.4, 0.2, 69],
        [0.95, 0.2, 72],
        [1.3, 0.2, 74],
        [2.2, 0.3, 76],
        [2.75, 0.2, 74],
        [3.6, 0.2, 72],
        [4.0, 0.2, 69],
        [4.9, 0.6, 67],
      ],
      2,
    ),
  },
  {
    n: 81,
    id: 'pipes-on-springs-e',
    name: 'Pipes on springs {E}',
    kind: 'melodic',
    description:
      'Hollow stopped pipes on a line around {E}, swaying from side to side in a slack spring that chirps.',
    preset: 'patch-cables-pipes-on-springs',
    // Less breath than the preset: in a low key the air outweighed the pipe.
    set: { breath: 0.35 },
    ...played(
      10,
      [
        [0, 0.5, 64],
        [0.85, 0.4, 67],
        [1.5, 0.9, 71],
        [3.1, 0.4, 69],
        [3.6, 0.4, 67],
        [4.5, 1.1, 64],
      ],
      2.5,
    ),
  },
  {
    n: 82,
    id: 'wood-flute-grains-f',
    name: 'Wood flute grains {F}',
    kind: 'melodic',
    description:
      'A round wood flute scooping into five notes from {F}, trailed by grains of itself that climb in fifths.',
    preset: 'patch-cables-wood-flute-grains',
    // Tongued harder than the preset, so each note starts as a stroke in every key.
    set: { attack: 0.008, chiff: 0.95 },
    ...played(
      10,
      [
        [0, 1.2, 65],
        [1.5, 0.5, 72],
        [2.2, 1.4, 67],
        [4.1, 0.6, 65],
        [4.9, 1.8, 60],
      ],
      2.5,
    ),
  },
  {
    n: 83,
    id: 'soprano-bubbles-a',
    name: 'Soprano bubbles {A}',
    kind: 'melodic',
    description:
      'Clipped soprano reed notes zigzagging up from {A}, caught by a bouncing buffer and repeated faster and faster.',
    preset: 'patch-cables-soprano-bubbles',
    ...played(
      8,
      [
        [0, 0.15, 69],
        [0.42, 0.15, 76],
        [1.27, 0.15, 72],
        [1.73, 0.15, 79],
        [2.89, 0.15, 76],
        [3.96, 0.3, 81],
      ],
      1.5,
    ),
  },
  {
    n: 84,
    id: 'piano-climbing-am',
    name: 'Piano climbing {A}m',
    kind: 'melodic',
    description:
      'A bare piano up a low {A} minor chord, each note repeated an octave higher and then higher again.',
    preset: 'patch-cables-piano-climbing',
    ...played(
      10,
      [
        [0, 0.8, 45],
        [1.1, 0.6, 52],
        [1.7, 0.8, 57],
        [3.0, 0.6, 60],
        [3.6, 0.9, 64],
        [4.9, 1.6, 57],
      ],
      2,
    ),
  },
  {
    n: 85,
    id: 'marimba-garden-c',
    name: 'Marimba garden {C}',
    kind: 'melodic',
    description:
      'Marimba notes around {C} ringing over their tubes, each echo jumping a fifth up and a fourth down.',
    preset: 'patch-cables-marimba-garden',
    // The echo at 400 ms, not the preset's 375: its four hops then take 1.6 s, five to the loop.
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Fifth hop',
        params: { time: 400, feedback: 0.5, tone: 5000, mix: 0.35 },
      },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.25 } },
    ],
    ...cycled(8, [
      [0, 0.4, 60],
      [0.6, 0.4, 64],
      [1.45, 0.4, 67],
      [2.0, 0.4, 72],
      [3.2, 0.4, 69],
      [3.85, 0.4, 67],
      [5.0, 0.4, 62],
      [5.6, 0.4, 64],
    ]),
  },
  {
    n: 86,
    id: 'nylon-sprigs-em',
    name: 'Nylon sprigs {E}m',
    kind: 'melodic',
    description:
      'A nylon guitar picked close in {E} minor, each note sprouting small octaves and fifths behind it.',
    preset: 'patch-cables-nylon-sprigs',
    // Left to ring a little longer than the preset's short notes: as short as those the phrase
    // is mostly silence, and too quiet five semitones down.
    set: { sustain: 3, release: 1.2 },
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 34, outputGain: 0 } }],
    ...played(
      9,
      [
        [0, 0.9, 52],
        [0.7, 0.9, 55],
        [1.3, 1.0, 64],
        [2.4, 0.9, 62],
        [3.0, 1.0, 57],
        [4.1, 0.9, 55],
        [4.7, 1.6, 52],
      ],
      2,
    ),
  },
  {
    n: 87,
    id: 'one-string-answered-a',
    name: 'One string answered {A}',
    kind: 'melodic',
    description:
      'Five plucked notes from {A}, each answered by four later ones on the next steps of a pentatonic scale.',
    preset: 'patch-cables-one-string-answered',
    ...cycled(8, [
      [0, 1, 57],
      [1.3, 1, 60],
      [3.1, 1, 64],
      [4.2, 1, 62],
      [6.1, 1, 55],
    ]),
    loopFold: 'power',
  },
  {
    n: 88,
    id: 'celesta-steps-am',
    name: 'Celesta steps {A}m',
    kind: 'melodic',
    description:
      'Damped celesta notes high in {A} minor, with a tape echo on three heads walking away behind them.',
    preset: 'patch-cables-celesta-steps',
    ...cycled(8, [
      [0, 0.4, 81],
      [0.5, 0.4, 84],
      [1.3, 0.4, 88],
      [2.45, 0.4, 86],
      [2.9, 0.4, 81],
      [4.1, 0.4, 79],
      [4.7, 0.4, 76],
      [5.6, 0.6, 81],
    ]),
  },
  {
    n: 89,
    id: 'glass-pluck-rising-d',
    name: 'Glass pluck rising {D}',
    kind: 'melodic',
    description:
      'Thin plucks with a snapping filter up a {D} minor chord, trailed by grains an octave and a twelfth up.',
    preset: 'patch-cables-glass-pluck-rising',
    ...played(
      8,
      [
        [0, 0.4, 62],
        [0.55, 0.4, 65],
        [1.2, 0.4, 69],
        [2.3, 0.4, 74],
        [2.85, 0.4, 72],
        [3.9, 0.4, 69],
        [4.5, 1, 65],
      ],
      1.5,
    ),
  },
  {
    n: 90,
    id: 'quacking-neck-em',
    name: 'Quacking neck {E}m',
    kind: 'melodic',
    description:
      'A clean electric guitar picking {E} minor through a filter that opens with each stroke, with a chorused echo.',
    preset: 'patch-cables-quacking-neck',
    ...cycled(8, [
      [0, 0.5, 52],
      [0.65, 0.3, 55],
      [1.1, 0.5, 59],
      [2.2, 0.3, 62],
      [2.65, 0.6, 64],
      [3.9, 0.4, 62],
      [4.5, 0.4, 59],
      [5.4, 0.8, 57],
    ]),
  },
  {
    n: 91,
    id: 'pan-taps-d',
    name: 'Pan taps {D}',
    kind: 'melodic',
    description:
      'A steel pan tapped near the rim around {D} and damped at once, each tap struck again in octaves.',
    preset: 'patch-cables-pan-taps',
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 32, outputGain: 0 } }],
    ...cycled(8, [
      [0, 0.3, 62],
      [0.8, 0.3, 69],
      [1.45, 0.3, 65],
      [2.9, 0.3, 72],
      [3.5, 0.3, 69],
      [4.85, 0.3, 64],
      [5.5, 0.3, 62],
    ]),
  },
  {
    n: 92,
    id: 'koto-backwards-d',
    name: 'Koto backwards {D}',
    kind: 'melodic',
    description:
      'Silk strings plucked near the bridge from {D}, each note returning backwards and an octave higher.',
    preset: 'patch-cables-koto-backwards',
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 26, outputGain: 0 } }],
    ...played(
      10,
      [
        [0, 0.8, 62],
        [1.1, 0.8, 64],
        [1.9, 0.8, 69],
        [3.4, 0.8, 67],
        [4.3, 0.8, 64],
        [5.2, 1.5, 62],
      ],
      2,
    ),
  },
  {
    n: 93,
    id: 'harp-loop-sparkle-f',
    name: 'Harp loop sparkle {F}',
    kind: 'melodic',
    description:
      'A concert harp plucked down an {F} chord, with a short loop of the last second at double speed over it.',
    preset: 'patch-cables-harp-loop-sparkle',
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 31, outputGain: 0 } }],
    ...played(
      9,
      [
        [0, 0.6, 77],
        [0.83, 0.6, 72],
        [1.47, 0.6, 69],
        [2.71, 0.6, 65],
        [3.38, 0.6, 60],
        [4.62, 1, 53],
      ],
      3,
    ),
  },
  {
    n: 94,
    id: 'steel-in-fifths-c',
    name: 'Steel in fifths {C}',
    kind: 'melodic',
    description:
      'A singing steel line picking five notes from {C}, shadowed a fifth and a ninth above, in a hall.',
    preset: 'patch-cables-steel-in-fifths',
    // Picked, not swelled: under the volume pedal the line has no attacks to count.
    set: { swell: 0, pick: 0.8 },
    ...played(
      10,
      [
        [0, 1.2, 60],
        [1.4, 0.6, 62],
        [2.1, 1.5, 65],
        [3.9, 0.7, 67],
        [4.7, 2.2, 62],
      ],
      2.5,
    ),
  },
  {
    n: 95,
    id: 'rubber-sequence-a',
    name: 'Rubber sequence {A}',
    kind: 'melodic',
    description:
      'A rubbery one-voice bass line from a low {A}, with echoes an octave above it, through a small amplifier.',
    preset: 'patch-cables-rubber-sequence',
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 28, outputGain: 0 } }],
    ...cycled(8, [
      [0, 0.3, 45],
      [0.55, 0.3, 57],
      [1.3, 0.3, 52],
      [2.1, 0.3, 55],
      [2.9, 0.3, 57],
      [3.3, 0.3, 48],
      [4.4, 0.3, 50],
      [5.0, 0.3, 52],
      [5.9, 0.3, 57],
    ]),
    loopFold: 'power',
  },
  {
    n: 96,
    id: 'thumb-piano-crystals-g',
    name: 'Thumb piano crystals {G}',
    kind: 'melodic',
    description:
      'Short damped metal tongues zigzagging up from {G} from thumb to thumb, grains of each note coming back an octave up.',
    preset: 'patch-cables-thumb-piano-crystals',
    ...cycled(8, [
      [0.02, 0.4, 67],
      [0.47, 0.4, 74],
      [1.21, 0.4, 71],
      [1.88, 0.4, 76],
      [3.03, 0.4, 72],
      [3.49, 0.4, 79],
      [4.61, 0.4, 74],
      [5.42, 0.4, 67],
    ]),
  },
  {
    n: 97,
    id: 'cedar-plucks-c',
    name: 'Cedar plucks {C}',
    kind: 'melodic',
    description:
      'Folded plucks from {C} through a low-pass gate, a call and its answer, with echoes that hop a fifth.',
    preset: 'patch-cables-cedar-plucks',
    // No F and no B in the line: the echo steps a fifth up and, on its way back, a fifth down.
    ...played(
      8,
      [
        [0, 0.4, 60],
        [0.45, 0.4, 67],
        [1.15, 0.6, 64],
        [2.63, 0.4, 69],
        [3.07, 0.4, 67],
        [3.78, 0.4, 62],
        [4.91, 0.8, 60],
      ],
      1.5,
    ),
  },
  {
    n: 98,
    id: 'tines-turned-round-f',
    name: 'Tines turned round {F}',
    kind: 'melodic',
    description:
      'Soft tines up from {F}, panning slowly from side to side, with backwards shards of each note in a plate.',
    preset: 'patch-cables-tines-turned-round',
    // The pan goes round five times a loop: the preset's 0.6 Hz does not come round in 8 s.
    set: { tremoloRate: 0.625 },
    ...cycled(8, [
      [0, 1, 53],
      [0.9, 1, 60],
      [1.7, 1, 65],
      [3.2, 1, 69],
      [4.1, 1, 67],
      [5.3, 1.5, 64],
    ]),
  },
  {
    n: 99,
    id: 'hammered-patter-d',
    name: 'Hammered patter {D}',
    kind: 'melodic',
    description:
      'Dulcimer strings from {D} kept sounding by quick hammer strokes, twelve a second, close in a spring.',
    preset: 'patch-cables-hammered-patter',
    ...played(
      9,
      [
        [0, 1, 50],
        [1.3, 0.6, 57],
        [2.0, 1.2, 62],
        [3.6, 0.6, 60],
        [4.3, 1.6, 57],
      ],
      2,
    ),
  },
  {
    n: 100,
    id: 'suspended-sweep-d',
    name: 'Suspended sweep {D}',
    kind: 'melodic',
    description:
      'Four keys from {D}, each swept up and down as a suspended fourth chord over strings that ring in sympathy.',
    preset: 'patch-cables-suspended-sweep',
    // Swept twice as fast as the preset: each sweep has to land as a stroke.
    set: { strum: 150 },
    ...played(
      12,
      [
        [0, 1.5, 50],
        [2.3, 1.5, 57],
        [4.1, 1.2, 55],
        [5.6, 2, 50],
      ],
      3,
    ),
  },
])
