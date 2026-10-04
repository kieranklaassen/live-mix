// The sounds of the pack "Static Cathedral": its presets played, a hundred sounds to
// paint with. Numbers 7001 to 7100.

import { PRESETS } from '../packs/static-cathedral'
import { type FactorySound } from '../types'
import { breathe, cycled, hall, looped, packSounds, played, quarterTurn, soften } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('static-cathedral', 7000, PRESETS, [
  // Drones: one note or a bare interval, held under the static.
  {
    n: 1,
    id: 'pedal-undertow-c',
    name: 'Pedal undertow {C}',
    kind: 'drone',
    description:
      'A low {C} on two organ ranks beating slowly over their sub octave, driven through iron in a stone tail.',
    preset: 'static-cathedral-pedal-undertow',
    set: { celeste: 0.15, bellows: 0 },
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 10, release: 0.3, ride: 0 } },
      quarterTurn(8),
    ],
    ...looped(8, 6, 2, [36]),
    tuning: 'whole-cycles',
  },
  {
    n: 2,
    id: 'clipped-flutes-f',
    name: 'Clipped flutes {F}',
    kind: 'drone',
    description:
      'Stopped flutes on {F} and {C} clipped hard until they fuse into one buzzing tone, in a hall.',
    preset: 'static-cathedral-clipped-flutes',
    then: [quarterTurn(8)],
    ...looped(8, 4, 2, [53, [60, 0.8]]),
    tuning: 'whole-cycles',
  },
  {
    n: 3,
    id: 'breaking-speaker-g',
    name: 'Breaking speaker {G}',
    kind: 'drone',
    description:
      'Low octaves on {G} over a heavy sub, a quiet {D} above, through a speaker near breaking up, an amplifier humming.',
    preset: 'static-cathedral-breaking-speaker-drone',
    set: { movement: 0.15 },
    then: [quarterTurn(8)],
    ...looped(8, 6, 2, [55, [62, 0.5]]),
    tuning: 'whole-cycles',
  },
  {
    n: 4,
    id: 'shaking-floor-a',
    name: 'Shaking floor {A}',
    kind: 'drone',
    description:
      'A square wave on a low {A} with its full sub octave through a stack on the edge of breaking up.',
    preset: 'static-cathedral-shaking-floor',
    then: [breathe(0.25, 0.2), quarterTurn(8)],
    ...looped(8, 4, 2, [33]),
    tuning: 'whole-cycles',
  },
  {
    n: 5,
    id: 'slow-folding-tone-d',
    name: 'Slow folding tone {D}',
    kind: 'drone',
    description:
      'A slowly wavefolding tone on {D}, sample-reduced, with grains an octave down beneath.',
    preset: 'static-cathedral-slow-folding-tone',
    ...looped(8, 6, 2, [50]),
  },
  {
    n: 6,
    id: 'folded-series-g',
    name: 'Folded series {G}',
    kind: 'drone',
    description:
      'A buzzing harmonic series on {G} aliased at a low sample rate, folded partials ringing between.',
    preset: 'static-cathedral-folded-series',
    set: { movement: 0 },
    ...looped(8, 5, 2, [43]),
  },
  {
    n: 7,
    id: 'overdriven-horns-e',
    name: 'Overdriven horns {E}',
    kind: 'drone',
    description:
      'Two horns on {E} and the {B} above pushed into a triode until they compress, edges smeared.',
    preset: 'static-cathedral-overdriven-horns',
    set: { section: 0 },
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 10, release: 0.3, ride: 0 } },
    ],
    ...looped(8, 6, 2, [52, [59, 0.7]]),
  },
  {
    n: 8,
    id: 'flickering-major-f',
    name: 'Flickering major {F}',
    kind: 'drone',
    description:
      'A just {F} major chord of which a starved stream keeps a few partials, flickering in a tail that blooms up a fifth.',
    preset: 'static-cathedral-flickering-major',
    set: { movement: 0.4, rate: 0.05 },
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 10, release: 0.3, ride: 0 } },
    ],
    ...looped(8, 6, 2, [53]),
  },
  {
    n: 9,
    id: 'thinned-choir-c',
    name: 'Thinned choir {C}',
    kind: 'drone',
    description:
      'A resonant pad on {C}, {G} and {D} of which a starved stream keeps the thin remainder, rising in fifths.',
    preset: 'static-cathedral-thinned-choir-pad',
    effects: [
      { deviceId: 'low-bitrate', params: { loss: 0.75, mode: 1, frame: 2, smear: 0.4 } },
      { deviceId: 'shimmer', preset: 'Fifths', params: { width: 0.7, mix: 0.3 } },
    ],
    ...looped(8, 6, 2, [60, 67, [74, 0.8]]),
  },
  {
    n: 10,
    id: 'cavern-fifths-g',
    name: 'Cavern fifths {G}',
    kind: 'drone',
    description:
      'A soft trumpet held on {G} with its fifth above and octaves both ways, in a dark cavern of short echoes.',
    preset: 'static-cathedral-cavern-fifths',
    set: { vibrato: 0, breath: 0.4 },
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 10, release: 0.3, ride: 0 } },
    ],
    ...looped(8, 5, 2, [55]),
  },
  {
    n: 11,
    id: 'aliased-string-drone-a',
    name: 'Aliased string drone {A}',
    kind: 'drone',
    description:
      'One sawtooth {A} over its sub octave with the chorus off, clipped hard so aliasing grit rides the tone, in a hall.',
    preset: 'static-cathedral-aliased-strings',
    set: { chorus: 0 },
    then: [breathe(0.125, 0.15), quarterTurn(8)],
    ...looped(8, 5, 2, [57]),
    tuning: 'whole-cycles',
  },
  // Pads: chords of the white keys that move slowly.
  {
    n: 12,
    id: 'trumpets-on-the-line-d',
    name: 'Trumpets on the line {D}',
    kind: 'pad',
    description:
      'Three muted trumpets holding {D} and {A} through eight-bit telephone converters, dark tape echoes trailing into a hall.',
    preset: 'static-cathedral-telephone-trumpet',
    set: { attack: 0.8, release: 2.5, vibrato: 0 },
    then: [breathe(0.125, 0.6)],
    ...looped(8, 5, 2, [62, 69, [74, 0.8]]),
  },
  {
    n: 13,
    id: 'loft-in-static-am',
    name: 'Loft in static {A}m',
    kind: 'pad',
    description:
      'Far pipes on {A} minor swirled by a starved stream, with radio static that rises as they do.',
    preset: 'static-cathedral-loft-in-static',
    ...looped(8, 7, 2, [45, 52, [60, 0.8], [64, 0.7]]),
  },
  {
    n: 14,
    id: 'wire-choir-gsus4',
    name: 'Wire choir {G}sus4',
    kind: 'pad',
    description:
      'An open ah on {G}, {C} and {D} with wavering copies a fifth above and a fourth below, in a stone nave.',
    preset: 'static-cathedral-wire-choir',
    set: { ensemble: 0, vibrato: 0 },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Broken choir', params: { jitter: 0.2, mix: 0.35 } },
      { deviceId: 'low-bitrate', preset: 'Smeared haze', params: { loss: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 4, release: 0.3, ride: 0 } },
      breathe(0.125, 0.5),
    ],
    ...looped(8, 6, 2, [55, 60, [62, 0.8], [67, 0.7]]),
  },
  {
    n: 15,
    id: 'treble-images-am7',
    name: 'Treble images {A}m7',
    kind: 'pad',
    description:
      'High treble voices on {A} minor seventh with converter images above, in a reverb that climbs an octave.',
    preset: 'static-cathedral-treble-images',
    set: { ensemble: 0, vibrato: 0 },
    then: [breathe(0.125, 0.4)],
    ...looped(8, 6, 2, [69, 72, [76, 0.8], [79, 0.7]]),
  },
  {
    n: 16,
    id: 'sideband-psalm-em',
    name: 'Sideband psalm {E}m',
    kind: 'pad',
    description:
      'A slowly changing vowel on {E} minor over a sideband link tuned a little wrong, in a hall.',
    preset: 'static-cathedral-sideband-psalm',
    set: { ensemble: 0 },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Sideband voices',
        params: { tuning: 0.04, drift: 0, fading: 0.1, interference: 0, mix: 0.7 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, mix: 0.4 } },
    ],
    then: [breathe(0.125, 0.3)],
    ...looped(8, 6, 2, [52, 59, [64, 0.8], [67, 0.7]]),
  },
  {
    n: 17,
    id: 'brass-through-stone-f',
    name: 'Brass through stone {F}',
    kind: 'pad',
    description:
      'Trombones and tuba four to a note on {F} major, tape-saturated and heard from a far room.',
    preset: 'static-cathedral-brass-through-stone',
    then: [{ deviceId: 'stereo-widener', params: { width: 0.3 } }],
    ...looped(8, 6, 2, [41, 48, [53, 0.8], [57, 0.7]]),
  },
  {
    n: 18,
    id: 'converter-choir-c',
    name: 'Converter choir {C}',
    kind: 'pad',
    description:
      'A slow vowel wavetable on {C} major through a nine-bit converter, in a long hall that sings back.',
    preset: 'static-cathedral-converter-choir',
    set: { rate: 0.125 },
    then: [breathe(0.125, 0.4), { deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...looped(8, 6, 2, [48, 55, [60, 0.8], [64, 0.7], [67, 0.6]]),
  },
  {
    n: 19,
    id: 'folded-cloud-g',
    name: 'Folded cloud {G}',
    kind: 'pad',
    description:
      'A morphing table of partials on {G} in octaves wavefolded into dense upper grit and rolled off again.',
    preset: 'static-cathedral-folded-cloud',
    set: { rate: 0.125 },
    then: [breathe(0.125, 0.4)],
    ...looped(8, 7, 2, [43, [55, 0.8]]),
  },
  {
    n: 20,
    id: 'iron-brass-pad-c',
    name: 'Iron brass pad {C}',
    kind: 'pad',
    description:
      'A brass pad on {C} and {G} pushed through a transformer and a horn loudspeaker on a far platform.',
    preset: 'static-cathedral-iron-brass-pad',
    set: { detune: 5 },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Iron lows',
        params: { drive: 0.2, push: 0.5, output: -8 },
      },
      { deviceId: 're-amp', preset: 'Station platform', params: { room: 0.5, output: -0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    then: [breathe(0.125, 0.35), { deviceId: 'stereo-widener', params: { width: 0.3 } }],
    ...looped(8, 5, 2, [48, [55, 0.6], [60, 0.8]]),
  },
  {
    n: 21,
    id: 'bowless-section-em',
    name: 'Bowless section {E}m',
    kind: 'pad',
    description:
      'A muted section on {E} minor smeared by long grains so no bow change is heard, in a hall.',
    preset: 'static-cathedral-bowless-section',
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 4, release: 0.3, ride: 0 } },
      breathe(0.125, 0.4),
    ],
    ...looped(8, 6, 2, [52, 59, [64, 0.8], [67, 0.7]]),
  },
  {
    n: 22,
    id: 'aliased-strings-f',
    name: 'Aliased strings {F}',
    kind: 'pad',
    description:
      'A chorus polysynth on {F} and {C} clipped hard so aliasing grit rides inside the chord, in a hall.',
    preset: 'static-cathedral-aliased-strings',
    then: [breathe(0.125, 0.4)],
    ...looped(8, 5, 2, [53, 60, [65, 0.8]]),
  },
  {
    n: 23,
    id: 'split-crystal-a',
    name: 'Split crystal {A}',
    kind: 'pad',
    description:
      'A slow FM pad on {A} and {E} through a tube stage, shifted up on one side and down on the other.',
    preset: 'static-cathedral-split-crystal',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 14, outputDb: -19 } },
      { deviceId: 'freq-shifter', preset: 'Split sky', params: { width: 0.3, mix: 0.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { width: 0.4, mix: 0.35 } },
    ],
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 10, release: 0.3, ride: 0 } },
      breathe(0.125, 0.55),
    ],
    ...looped(8, 6, 2, [57, 64, [69, 0.8], [76, 0.7]]),
  },
  {
    n: 24,
    id: 'ensemble-under-fuzz-d',
    name: 'Ensemble under fuzz {D}',
    kind: 'pad',
    description:
      'A seventies string ensemble on {D} and {A} under a dark triode fuzz, phased slowly in open space.',
    preset: 'static-cathedral-ensemble-under-fuzz',
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { drive: 0.55, output: -6 } },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { width: 0.7, mix: 0.35 } },
    ],
    then: [breathe(0.125, 0.35), { deviceId: 'stereo-widener', params: { width: 0.3 } }],
    ...looped(8, 6, 3, [50, 57, [62, 0.8]]),
  },
  {
    n: 25,
    id: 'slowed-reel-horns-c',
    name: 'Slowed reel horns {C}',
    kind: 'pad',
    description:
      'Horns from a reel at half speed on {C} major, saturated and scattered into long grains behind the chord.',
    preset: 'static-cathedral-slowed-reel-horns',
    then: [breathe(0.125, 0.35)],
    ...looped(8, 6, 2, [60, 67, [72, 0.8], [76, 0.7]]),
  },
  {
    n: 26,
    id: 'steel-under-grit-c',
    name: 'Steel under grit {C}',
    kind: 'pad',
    description:
      'Slow-swelling steel on {C} major with a layer of pentode grit under it and grains in open space.',
    preset: 'static-cathedral-steel-under-grit',
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 10, release: 0.3, ride: 0 } },
      breathe(0.125, 0.4),
    ],
    ...looped(8, 3, 2, [48, 55, [64, 0.8]]),
  },
  {
    n: 27,
    id: 'growling-reeds-e',
    name: 'Growling reeds {E}',
    kind: 'pad',
    description:
      'A table moving from reed to sawtooth on {E} and {B} through an overdriven rotating speaker.',
    preset: 'static-cathedral-growling-reeds',
    set: { rate: 0.125 },
    then: [{ deviceId: 'stereo-widener', params: { width: 0.3 } }],
    ...looped(8, 4, 2, [52, 59, [64, 0.8]]),
  },
  {
    n: 28,
    id: 'far-hall-monks-g',
    name: 'Far hall monks {G}',
    kind: 'pad',
    description:
      'Bass voices on a closed oh holding {G} in octaves, through a loudspeaker far down a hall.',
    preset: 'static-cathedral-far-hall-monks',
    set: { ensemble: 0, motion: 0 },
    then: [{ deviceId: 'stereo-widener', params: { width: 0.25 } }],
    ...looped(8, 6, 3, [43, [55, 0.8]]),
  },
  {
    n: 29,
    id: 'singing-static-d',
    name: 'Singing static {D}',
    kind: 'pad',
    description:
      'Filtered noise singing on {D} and {A} through a dusty ten-bit sampler into a hall of moving vowels.',
    preset: 'static-cathedral-singing-static',
    ...looped(8, 5, 2, [62, 69]),
  },
  {
    n: 30,
    id: 'backwards-vestry-c',
    name: 'Backwards vestry {C}',
    kind: 'pad',
    description:
      'Piano chords on {C} and then {F} turned backwards into slow swells, in a dark reverb that rises in reverse.',
    preset: 'static-cathedral-backwards-vestry',
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 8, release: 0.3, ride: 0 } },
    ],
    ...cycled(8, [
      [0, 2, 48, 0.7],
      [0.03, 2, 55, 0.6],
      [0.05, 2, 64, 0.7],
      [4.13, 2, 53, 0.7],
      [4.16, 2, 57, 0.6],
      [4.2, 2, 60, 0.7],
    ]),
  },
  {
    n: 31,
    id: 'rolled-metal-blur-c',
    name: 'Rolled metal blur {C}',
    kind: 'pad',
    description:
      'A rolled vibraphone chord on {C} major blurred until the roll is a shimmer, drifting sharp in a long stone tail.',
    preset: 'static-cathedral-rolled-metal-blur',
    set: { motorRate: 1.625 },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Long clean hold',
        params: { blur: 0.9, width: 0.5, mix: 1 },
      },
      {
        deviceId: 'freq-shifter',
        preset: 'Slow drift',
        params: { fine: 1.25, width: 0.4, mix: 0.4 },
      },
    ],
    then: [
      hall('Cathedral', 0.6),
      breathe(0.125, 0.4),
      { deviceId: 'stereo-widener', params: { width: 0.3 } },
    ],
    ...looped(8, 5, 3, [60, 64, 67, 72]),
    loopFold: 'linear',
  },
  {
    n: 32,
    id: 'nave-wall-c',
    name: 'Nave wall chord {C}',
    kind: 'pad',
    description:
      'Full organ on {C} major, its mixture beating slowly, bitten by drive and heard from the far end of a nave.',
    preset: 'static-cathedral-nave-wall',
    then: [breathe(0.125, 0.3), { deviceId: 'stereo-widener', params: { width: 0.3 } }],
    ...looped(8, 5, 2, [48, 55, [64, 0.8], [67, 0.7]]),
  },
  {
    n: 33,
    id: 'nave-wall-d',
    name: 'Nave wall {D}',
    kind: 'pad',
    description:
      'Full organ on one low {D}, bitten by drive and swelling slowly at the far end of a nave.',
    preset: 'static-cathedral-nave-wall',
    set: { celeste: 0, bellows: 0, twelfth: 0 },
    then: [breathe(0.125, 0.3), quarterTurn(8)],
    ...looped(8, 5, 2, [38]),
    tuning: 'whole-cycles',
  },
  {
    n: 34,
    id: 'blown-pedal-tone-e',
    name: 'Blown pedal tone {E}',
    kind: 'pad',
    description:
      'A one-voice bass on a low {E} through tube grit and a warm stack, swelling twice in the loop.',
    preset: 'static-cathedral-blown-pedal-tone',
    set: { beat: 0, drive: 0.2, cutoff: 900 },
    then: [breathe(0.25, 0.6), quarterTurn(8)],
    ...looped(8, 4, 2, [40]),
    tuning: 'whole-cycles',
  },
  {
    n: 35,
    id: 'folded-high-strings-c',
    name: 'Folded high strings {C}',
    kind: 'pad',
    description:
      'The top of a string ensemble on {C} major folded back on itself by a low sample rate, in a long plate.',
    preset: 'static-cathedral-folded-high-strings',
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 10, release: 0.3, ride: 0 } },
      breathe(0.125, 0.55),
    ],
    ...looped(8, 5, 2, [72, 76, [79, 0.8]]),
  },
  {
    n: 36,
    id: 'eight-bit-bellows-dm',
    name: 'Eight bit bellows {D}m',
    kind: 'pad',
    description:
      'A reedy pump organ on {D} minor, sampled at eight bits and played through a small speaker.',
    preset: 'static-cathedral-eight-bit-bellows',
    set: { bellows: 0, celeste: 0 },
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 10, release: 0.3, ride: 0 } },
      breathe(0.125, 0.5),
    ],
    ...looped(8, 4, 2, [50, 57, [62, 0.8], [65, 0.7]]),
  },
  {
    n: 37,
    id: 'dull-metal-b',
    name: 'Dull metal {B}',
    kind: 'pad',
    description:
      'A hollow table on {B} in octaves with every partial moved up by forty-three hertz, turning to dull metal.',
    preset: 'static-cathedral-dull-metal-pad',
    set: { rate: 0.125 },
    then: [breathe(0.125, 0.5), { deviceId: 'stereo-widener', params: { width: 0.3 } }],
    ...looped(8, 6, 2, [47, [59, 0.8]]),
  },
  {
    n: 38,
    id: 'buzzing-wall-g',
    name: 'Buzzing wall {G}',
    kind: 'pad',
    description:
      'Four buzzing strings on {G} and {D}, tube-driven so the overtone sweep roars, over tape hiss.',
    preset: 'static-cathedral-buzzing-wall',
    set: { speed: 2.698 },
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 18, release: 0.3, ride: 0 } },
      breathe(0.125, 0.5),
    ],
    ...looped(8, 8, 2, [55]),
  },
  {
    n: 39,
    id: 'brass-through-stone-dm',
    name: 'Brass through stone {D}m',
    kind: 'pad',
    description:
      'Trombones four to a note higher up on {D} minor, tape-saturated and heard from a far room.',
    preset: 'static-cathedral-brass-through-stone',
    then: [{ deviceId: 'stereo-widener', params: { width: 0.3 } }],
    ...looped(8, 6, 2, [50, 57, [62, 0.8], [65, 0.7]]),
  },
  {
    n: 40,
    id: 'nave-fuzz-a',
    name: 'Nave fuzz {A}',
    kind: 'pad',
    description:
      'Open fifths on {A} and then {D} swelled into a hard fuzz, the strum smeared away, hanging in a nave; it comes round.',
    preset: 'static-cathedral-nave-fuzz',
    set: { swell: 1.2 },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Fuzz pedal',
        params: { driveDb: 32, toneDb: 2, outputDb: -24 },
      },
      { deviceId: 'ambient-eq', params: { low: -1.5, body: -1.5, presence: -1.5, air: -1.5 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Long clean hold',
        params: { blur: 0.9, highCut: 6000, width: 0.3, mix: 0.75 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    ...cycled(
      8,
      [
        [0.02, 3.8, 45],
        [0.02, 3.8, 52],
        [0.02, 3.8, 57],
        [4.07, 3.8, 50],
        [4.07, 3.8, 57],
        [4.07, 3.8, 62],
      ],
      { passes: 2 },
    ),
  },

  // Textures: the static itself.
  {
    n: 41,
    id: 'roar-of-grain',
    name: 'Roar of grain',
    kind: 'texture',
    description:
      'A just {E} minor chord of wandering partials folded over itself by a broken speaker into a dark roar.',
    preset: 'static-cathedral-wall-of-grain',
    set: { movement: 0.25 },
    then: [breathe(0.125, 0.3)],
    ...looped(8, 6, 2, [40, [52, 0.7]]),
  },
  {
    n: 42,
    id: 'overdriven-horn-wall',
    name: 'Overdriven horn wall',
    kind: 'texture',
    description:
      'A {D} minor chord of French horns pushed into a triode, their edges smeared into one dense band.',
    preset: 'static-cathedral-overdriven-horns',
    then: [breathe(0.125, 0.3)],
    ...looped(8, 6, 2, [50, 57, [62, 0.8], [65, 0.7]]),
  },
  {
    n: 43,
    id: 'glass-held-in-frames',
    name: 'Glass held in frames',
    kind: 'texture',
    description:
      'A {G} major chord on a glass table bitten by a pentode and held frame by frame by a stream that cannot keep up.',
    preset: 'static-cathedral-frozen-frame-glass',
    then: [breathe(0.125, 0.7)],
    ...looped(8, 5, 2, [55, 62, [67, 0.8], [71, 0.7]]),
  },
  {
    n: 44,
    id: 'six-bit-downpour',
    name: 'Six bit downpour',
    kind: 'texture',
    description:
      'A downpour squashed flat and crushed to six bits at a low sample rate: a sheet of static in open space.',
    preset: 'static-cathedral-six-bit-rain',
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Hard clip master',
        params: { driveDb: 24, outputDb: -16.5 },
      },
      { deviceId: 'vintage-digital', preset: 'Crushed', params: { bits: 6, rate: 9000, drive: 6 } },
      { deviceId: 'expanse', preset: 'Open space', params: { width: 0.5, mix: 0.7 } },
    ],
    then: [breathe(0.125, 0.4), { deviceId: 'stereo-widener', params: { width: 0.3 } }],
    ...looped(8, 4, 2, [55]),
  },
  {
    n: 45,
    id: 'thunder-through-walls',
    name: 'Thunder through walls',
    kind: 'texture',
    description:
      'Distant thunder heard from inside, dulled by a room and by tape and held in a long stone tail.',
    preset: 'static-cathedral-storm-outside',
    ...looped(16, 2, 3, [36, 43, 48]),
  },
  {
    n: 46,
    id: 'wind-in-the-pipe-mouths',
    name: 'Wind in the pipe mouths',
    kind: 'texture',
    description:
      'Broad dark bands of noise like wind across pipe mouths, swirled by a starved stream in a wide space.',
    preset: 'static-cathedral-wind-across-pipes',
    ...looped(8, 5, 2, [40, 47]),
  },
  {
    n: 47,
    id: 'whispers-dropping-out',
    name: 'Whispers dropping out',
    kind: 'texture',
    description:
      'A whispered {A} minor chord, more air than tone, dropping out and stuttering like a bad connection in a large space.',
    preset: 'static-cathedral-breath-and-dropouts',
    ...looped(8, 5, 2, [57, 60, 64]),
  },
  {
    n: 48,
    id: 'sines-between-stations',
    name: 'Sines between stations',
    kind: 'texture',
    description:
      'A cluster of close sines between two shortwave stations, fading under static and whistles.',
    preset: 'static-cathedral-between-two-stations',
    effects: [
      {
        deviceId: 'radio',
        preset: 'Between stations',
        params: { tuning: -0.45, static: 0.8, mix: 0.9 },
      },
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    ...looped(8, 6, 2, [52]),
  },
  {
    n: 49,
    id: 'swirled-flute-breath',
    name: 'Swirled flute breath',
    kind: 'texture',
    description:
      'Low flutes on {F} and {C} that are nearly all breath, the air swirled by a starved stream and hung in a blur.',
    preset: 'static-cathedral-swirled-breath',
    set: { breath: 1, blow: 0.05 },
    ...looped(8, 6, 2, [41, 48, 53]),
  },
  {
    n: 50,
    id: 'bows-behind-glass',
    name: 'Bows behind glass',
    kind: 'texture',
    description:
      'Bows on {G} and {D} that are mostly air, heard as if behind glass, the breath swirled by a stream in a long plate.',
    preset: 'static-cathedral-starved-bows',
    then: [breathe(0.125, 0.3), { deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...looped(8, 6, 3, [55, 62, 67]),
  },
  {
    n: 51,
    id: 'drips-in-the-nave',
    name: 'Drips in the nave',
    kind: 'texture',
    description:
      'Sparse rain through a roof, each drop worn by a nine-bit converter and left in a long stone tail.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: { density: 0.3, tone: 0.45, attack: 0.5, width: 0.6 },
    },
    effects: [soften(12), { deviceId: 'vintage-digital', preset: 'Worn' }, hall('Cathedral', 0.45)],
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 18, release: 0.3, ride: 0 } },
    ],
    ...looped(8, 4, 2, [60]),
  },
  {
    n: 52,
    id: 'crackle-down-the-nave',
    name: 'Crackle down the nave',
    kind: 'texture',
    description:
      'A record left turning with no music on it, played through a loudspeaker and heard from far down a nave.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Old record',
      params: { density: 0.6, attack: 0.3, width: 0.6 },
    },
    effects: [
      soften(10),
      { deviceId: 're-amp', preset: 'Down the hall', params: { speaker: 2, room: 0.65 } },
      hall('Cathedral', 0.4),
    ],
    then: [
      { deviceId: 'stereo-widener', params: { width: 0.3 } },
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 8, release: 0.3, ride: 0 } },
    ],
    ...looped(8, 4, 2, [60]),
  },
  {
    n: 53,
    id: 'draught-in-the-tower',
    name: 'Draught in the tower',
    kind: 'texture',
    description:
      'Wind through a bell tower heard as if behind glass: a starved stream swirls it in a hall.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: { density: 0.5, movement: 0.7, tone: 0.4, size: 0.5, attack: 1, width: 0.6 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Behind glass', params: { loss: 0.6, stereo: 0.4 } },
      hall('Hall', 0.35),
    ],
    ...looped(16, 4, 3, [48]),
  },
  {
    n: 54,
    id: 'bow-and-static-c',
    name: 'Bow and static {C}',
    kind: 'texture',
    description:
      'A bowed low {C}, heavy and dull, with radio static kept under the bow in a stone tail.',
    preset: 'static-cathedral-bow-and-static',
    then: [breathe(0.125, 0.3), quarterTurn(8)],
    ...looped(8, 5, 2, [36]),
    tuning: 'whole-cycles',
  },
  {
    n: 55,
    id: 'piano-under-snow-g',
    name: 'Piano under snow {G}',
    kind: 'texture',
    description:
      'Soft hammers on {G} major dissolved by long grains and a blurred spectrum until only the chord is left.',
    preset: 'static-cathedral-piano-under-snow',
    ...cycled(8, [
      [0, 3, 43, 0.7],
      [0.04, 3, 50, 0.6],
      [0.09, 3, 59, 0.7],
      [3.87, 3, 55, 0.6],
      [3.93, 3, 62, 0.7],
    ]),
  },

  // One-shots: one note or one chord, struck and left to ring out.
  {
    n: 56,
    id: 'tower-bell-d',
    name: 'Tower bell {D}',
    kind: 'oneshot',
    description:
      'One stroke of a church bell on {D} heard through stone from the far end of the building.',
    preset: 'static-cathedral-tower-bell',
    set: { decay: 9, position: 0.667, detune: 0, stretch: 1 },
    then: [{ deviceId: 'stereo-widener', params: { width: 0.3 } }],
    ...played(9, [[0, 8, 50]], 2),
  },
  {
    n: 57,
    id: 'jittered-steel-a',
    name: 'Jittered steel {A}',
    kind: 'oneshot',
    description:
      'A steel pan struck once on {A} on a ten-bit sampler, with dark bucket-brigade repeats in a hall.',
    preset: 'static-cathedral-jittered-steel',
    ...played(4.5, [[0, 2, 57]], 1.5),
  },
  {
    n: 58,
    id: 'detuned-upright-c',
    name: 'Detuned upright {C}',
    kind: 'oneshot',
    description:
      'A low {C} with {G} and {E} above on an upright with its unisons pulled apart, through twelve bits into a hall.',
    preset: 'static-cathedral-detuned-upright',
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 6, release: 0.3, ride: 0 } },
    ],
    ...played(
      6.5,
      [
        [0, 4, 36, 0.8],
        [0.01, 4, 55, 0.7],
        [0.02, 4, 64, 0.75],
      ],
      1.5,
    ),
  },
  {
    n: 59,
    id: 'crushed-felt-f',
    name: 'Crushed felt {F}',
    kind: 'oneshot',
    description:
      'One low {F} on a close felt piano crushed by a console stage, through a small amplifier and its spring.',
    preset: 'static-cathedral-crushed-felt',
    ...played(5, [[0, 3, 41]], 1),
  },
  {
    n: 60,
    id: 'blown-cone-tines-e',
    name: 'Blown cone tines {E}',
    kind: 'oneshot',
    description:
      'A barking electric piano on {E} and {B} through a broken-speaker fold and a small amplifier with a dark spring.',
    preset: 'static-cathedral-tines-blown-cone',
    ...played(
      5,
      [
        [0, 3, 40, 0.8],
        [0.01, 3, 52, 0.7],
        [0.02, 3, 59, 0.7],
      ],
      1,
    ),
  },
  {
    n: 61,
    id: 'dusty-tines-g6',
    name: 'Dusty tines {G}6',
    kind: 'oneshot',
    description:
      'Soft dark tines on {G} sixth at ten bits with a jittering clock, doubled a few cents apart, in a hall.',
    preset: 'static-cathedral-dusty-tines',
    ...played(
      6,
      [
        [0, 3.5, 55, 0.7],
        [0.01, 3.5, 62, 0.6],
        [0.02, 3.5, 64, 0.6],
        [0.03, 3.5, 71, 0.65],
      ],
      1.2,
    ),
  },
  {
    n: 62,
    id: 'baritone-grind-d',
    name: 'Baritone grind {D}',
    kind: 'oneshot',
    description:
      'One low {D} picked hard into a dark triode fuzz and a warm stack, the microphone turned from the cone.',
    preset: 'static-cathedral-baritone-grind',
    ...played(6, [[0, 4.5, 38]], 1.2),
  },
  {
    n: 63,
    id: 'five-bit-twelve-g',
    name: 'Five bit twelve {G}',
    kind: 'oneshot',
    description:
      'A twelve-string strum of {G} major reduced to five bits and low-passed, a soft crackling chord in a plate.',
    preset: 'static-cathedral-five-bit-twelve',
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 6, release: 0.3, ride: 0 } },
    ],
    ...played(
      7,
      [
        [0, 5, 43],
        [0, 5, 50],
        [0, 5, 55],
        [0, 5, 59],
        [0, 5, 62],
        [0, 5, 67],
      ],
      1.5,
    ),
  },
  {
    n: 64,
    id: 'crushed-silk-string-e',
    name: 'Crushed silk string {E}',
    kind: 'oneshot',
    description:
      'A koto plucked hard on {E} near the bridge, crushed to five bits and heard from across a room.',
    preset: 'static-cathedral-crushed-silk-strings',
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 5, release: 0.3, ride: 0 } },
      { deviceId: 'stereo-widener', params: { width: 0.35 } },
    ],
    ...played(3, [[0, 2, 64]], 1),
  },
  {
    n: 65,
    id: 'transept-nylon-am',
    name: 'Transept nylon {A}m',
    kind: 'oneshot',
    description:
      'Nylon strings strummed once on {A} minor with reversed grains of themselves behind, glazed by a converter.',
    preset: 'static-cathedral-transept-nylon',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Backwards room', params: { spread: 0.4, mix: 0.2 } },
      { deviceId: 'vintage-digital', preset: 'Glaze' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 6, release: 0.3, ride: 0 } },
    ],
    ...played(
      7,
      [
        [0, 4, 45],
        [0, 4, 52],
        [0, 4, 57],
        [0, 4, 60],
        [0, 4, 64],
      ],
      1.5,
    ),
  },
  {
    n: 66,
    id: 'slipping-steel-a',
    name: 'Slipping steel {A}',
    kind: 'oneshot',
    description:
      'One ringing steel string on {A} on an early sampler that now and then slips, in a small plate.',
    preset: 'static-cathedral-slipping-steel',
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 5, release: 0.3, ride: 0 } },
    ],
    ...played(5, [[0, 4, 69]], 1.2),
  },
  {
    n: 67,
    id: 'closing-filter-f',
    name: 'Closing filter {F}',
    kind: 'oneshot',
    description:
      'A resonant bass on a low {F} whose filter opens on the note and slowly closes, at twelve bits.',
    preset: 'static-cathedral-closing-filter',
    ...played(6, [[0, 5, 41]], 1),
  },
  {
    n: 68,
    id: 'rafter-zither-g',
    name: 'Rafter zither {G}',
    kind: 'oneshot',
    description:
      'Doubled courses on {G} strummed into a pushed console stage, the ring blurred into a long stone tail.',
    preset: 'static-cathedral-rafter-zither',
    set: { strum: 25 },
    ...played(10, [[0, 4, 55]], 2.5),
  },
  {
    n: 69,
    id: 'clipped-flute-stab-dm',
    name: 'Clipped flute stab {D}m',
    kind: 'oneshot',
    description:
      'A short {D} minor chord on stopped flute pipes clipped into one buzzing tone, let go into a hall.',
    preset: 'static-cathedral-clipped-flutes',
    ...played(
      5,
      [
        [0, 0.5, 62],
        [0, 0.5, 65],
        [0, 0.5, 69],
      ],
      1,
    ),
  },
  {
    n: 70,
    id: 'unwound-upright-e',
    name: 'Unwound upright {E}',
    kind: 'oneshot',
    description:
      'One felt piano {E} with faint echoes that slide down an octave behind it, printed hot to tape in a plate.',
    preset: 'static-cathedral-unwound-upright',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Falling tape',
        params: { time: 620, feedback: 0.4, glide: 0.3, mix: 0.25 },
      },
      { deviceId: 'tape', preset: 'Hot glue', params: { wow: 0.3, age: 0.3, output: -4.5 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.3 } },
    ],
    ...played(8, [[0, 2.5, 64]], 2.5),
  },
  {
    n: 71,
    id: 'small-tower-bell-d',
    name: 'Small tower bell {D}',
    kind: 'oneshot',
    description:
      'One stroke of a smaller church bell an octave up on {D}, softened by drive and heard through stone.',
    preset: 'static-cathedral-tower-bell',
    set: { decay: 5, position: 0.667, detune: 0, stretch: 1 },
    then: [{ deviceId: 'stereo-widener', params: { width: 0.3 } }],
    ...played(5.5, [[0, 5, 62]], 1.5),
  },
  {
    n: 72,
    id: 'crushed-felt-chord-c',
    name: 'Crushed felt chord {C}',
    kind: 'oneshot',
    description:
      'A {C} major chord on a close felt piano crushed by a console stage, through a small amplifier and its spring.',
    preset: 'static-cathedral-crushed-felt',
    ...played(
      6,
      [
        [0, 3.5, 48, 0.7],
        [0.01, 3.5, 55, 0.6],
        [0.02, 3.5, 64, 0.65],
        [0.03, 3.5, 67, 0.6],
      ],
      1.2,
    ),
  },
  {
    n: 73,
    id: 'high-jittered-steel-e',
    name: 'High jittered steel {E}',
    kind: 'oneshot',
    description:
      'A steel pan struck once on a high {E} on a ten-bit sampler, dark bucket-brigade repeats behind it.',
    preset: 'static-cathedral-jittered-steel',
    ...played(4.5, [[0, 2, 76]], 1.5),
  },

  // Phrases: a few notes in free time; half of them come round.
  {
    n: 74,
    id: 'detuned-upright-air-c',
    name: 'Detuned upright air {C}',
    kind: 'melodic',
    description:
      'An upright with its unisons pulled apart, slow notes over {C} and then {G} at twelve bits; it comes round.',
    preset: 'static-cathedral-detuned-upright',
    ...cycled(8, [
      [0, 3, 48, 0.6],
      [0.06, 2.5, 64, 0.85],
      [1.37, 2, 67, 0.8],
      [2.51, 2.2, 69, 0.85],
      [4.12, 3, 43, 0.6],
      [4.19, 2, 62, 0.8],
      [5.63, 1.8, 64, 0.85],
    ]),
  },
  {
    n: 75,
    id: 'transept-nylon-rise-em',
    name: 'Transept nylon rise {E}m',
    kind: 'melodic',
    description:
      'Nylon strings opening {E} minor from the bottom, reversed grains behind each note; it comes round.',
    preset: 'static-cathedral-transept-nylon',
    ...cycled(8, [
      [0, 2.5, 52, 0.7],
      [0.71, 2.5, 59, 0.6],
      [1.33, 2.5, 64, 0.65],
      [2.42, 2.5, 67, 0.7],
      [3.88, 3, 71, 0.75],
      [5.47, 2, 69, 0.6],
    ]),
  },
  {
    n: 76,
    id: 'harp-turned-back-f',
    name: 'Harp turned back {F}',
    kind: 'melodic',
    description:
      'A long-ringing harp climbing from {F} behind its own reversed grains, a halo an octave above; it comes round.',
    preset: 'static-cathedral-harp-turned-back',
    set: { touch: 0.4 },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Backwards room', params: { spread: 0.4, mix: 0.35 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { width: 0.7, mix: 0.3 } },
    ],
    ...cycled(
      8,
      [
        [0, 2, 53, 0.7],
        [1.18, 2, 60, 0.6],
        [2.07, 2, 65, 0.65],
        [3.46, 2, 69, 0.7],
        [4.59, 2.2, 67, 0.6],
        [5.81, 2, 64, 0.65],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 77,
    id: 'jittered-steel-round-d',
    name: 'Jittered steel round {D}',
    kind: 'melodic',
    description:
      'A steel pan circling {D} minor at ten bits with a jittering clock, dark repeats behind; it comes round.',
    preset: 'static-cathedral-jittered-steel',
    ...cycled(
      8,
      [
        [0, 1.5, 50, 0.75],
        [0.83, 1, 57, 0.55],
        [1.52, 1, 62, 0.6],
        [2.77, 1.2, 60, 0.5],
        [3.61, 1.5, 53, 0.7],
        [4.93, 1, 57, 0.55],
        [5.72, 1, 65, 0.6],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 78,
    id: 'dusty-tines-round-g',
    name: 'Dusty tines round {G}',
    kind: 'melodic',
    description:
      'Soft dark tines at ten bits over {G} and then {F}, doubled a few cents apart in a hall; it comes round.',
    preset: 'static-cathedral-dusty-tines',
    ...cycled(8, [
      [0, 3, 55, 0.6],
      [0.04, 2, 71, 0.7],
      [1.42, 2, 74, 0.7],
      [2.21, 2.4, 72, 0.65],
      [4.06, 3, 53, 0.6],
      [4.11, 2, 69, 0.7],
      [5.53, 2, 67, 0.7],
    ]),
  },
  {
    n: 79,
    id: 'splintered-plucks-am',
    name: 'Splintered plucks {A}m',
    kind: 'melodic',
    description:
      'Woody plucks wandering over {A} minor, cut into tiny repeating slices across octaves; it comes round.',
    preset: 'static-cathedral-splintered-pluck',
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 8, release: 0.3, ride: 0 } },
    ],
    ...cycled(8, [
      [0, 1, 57, 0.7],
      [0.62, 1, 64, 0.55],
      [1.48, 1, 67, 0.6],
      [2.31, 1, 72, 0.6],
      [3.57, 1, 69, 0.65],
      [4.26, 1, 64, 0.5],
      [5.41, 1, 60, 0.6],
      [6.33, 1, 62, 0.55],
    ]),
  },
  {
    n: 80,
    id: 'octave-down-guitar-d',
    name: 'Octave-down guitar {D}',
    kind: 'melodic',
    description:
      'Picked notes over {D} replayed an octave down at half speed in long overlapping cycles; it comes round.',
    preset: 'static-cathedral-octave-down-guitar-loop',
    ...cycled(12, [
      [0, 3, 50, 0.7],
      [1.83, 3, 57, 0.65],
      [4.27, 3, 62, 0.7],
      [6.94, 3, 60, 0.6],
      [9.12, 2.5, 55, 0.65],
    ]),
  },
  {
    n: 81,
    id: 'warped-lead-steel-c',
    name: 'Warped lead steel {C}',
    kind: 'melodic',
    description:
      'A steel line sliding up {C} major on a warped record, through a bedside speaker and a long spring; it comes round.',
    preset: 'static-cathedral-warped-lead-steel',
    ...cycled(12, [
      [0, 3, 60, 0.7],
      [2.37, 2.5, 64, 0.65],
      [4.81, 3.4, 67, 0.7],
      [8.02, 3, 65, 0.6],
    ]),
    loopFold: 'power',
  },
  {
    n: 82,
    id: 'held-and-spiralling-b',
    name: 'Held and spiralling {B}',
    kind: 'melodic',
    description:
      'Picked notes falling from {B} each caught and held as a tone, then set spiralling upward; it comes round.',
    preset: 'static-cathedral-held-and-spiralling',
    then: [{ deviceId: 'stereo-widener', params: { width: 0.3 } }],
    ...cycled(12, [
      [0, 2, 71, 0.7],
      [2.61, 2, 67, 0.65],
      [5.87, 2, 64, 0.7],
      [8.43, 2, 62, 0.6],
    ]),
  },
  {
    n: 83,
    id: 'lone-cantor-d',
    name: 'Lone cantor {D}',
    kind: 'melodic',
    description:
      'One singer on a slow line round {D}, shadowed by stumbling octave copies, in a hall that sings back.',
    preset: 'static-cathedral-lone-cantor',
    ...played(
      14,
      [
        [0, 1.6, 62, 0.8],
        [1.84, 0.9, 65, 0.7],
        [2.93, 1.9, 64, 0.8],
        [5.11, 1.2, 60, 0.7],
        [6.47, 2.4, 62, 0.85],
      ],
      3,
    ),
  },
  {
    n: 84,
    id: 'telephone-trumpet-g',
    name: 'Telephone trumpet {G}',
    kind: 'melodic',
    description:
      'A thin muted trumpet calling up from {G} through eight-bit converters, dark tape echoes trailing into a hall.',
    preset: 'static-cathedral-telephone-trumpet',
    set: { attack: 0.03 },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Phone' },
      { deviceId: 'tape-echo', params: { time: 520, feedback: 0.25, highCut: 2800, mix: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    ...played(
      10,
      [
        [0, 0.7, 67, 0.7],
        [1.12, 0.4, 72, 0.6],
        [1.83, 1.4, 74, 1],
        [3.94, 0.5, 72, 0.6],
        [4.71, 0.5, 71, 0.6],
        [5.45, 1.6, 69, 0.75],
      ],
      2,
    ),
  },
  {
    n: 85,
    id: 'bamboo-in-stone-e',
    name: 'Bamboo in stone {E}',
    kind: 'melodic',
    description:
      'A bamboo flute with a hard chiff leaning from {E} up to a long {A} and back, far down a nave.',
    preset: 'static-cathedral-bamboo-in-stone',
    set: { breath: 0.5 },
    ...played(
      10,
      [
        [0, 1.3, 64, 0.5],
        [1.37, 0.6, 65, 0.45],
        [2.31, 1.8, 69, 1],
        [4.45, 0.4, 67, 0.5],
        [5.02, 1.6, 64, 0.5],
      ],
      2,
    ),
  },
  {
    n: 86,
    id: 'rasping-reed-line-am',
    name: 'Rasping reed line {A}m',
    kind: 'melodic',
    description:
      'A nasal reed with a wide vibrato climbing {A} minor to the fifth and falling home, doubled, in a stone hall.',
    preset: 'static-cathedral-rasping-doubled-reed',
    set: { attack: 0.015, release: 0.3 },
    ...played(
      12,
      [
        [0, 1.8, 57, 0.5],
        [2.07, 0.8, 60, 0.45],
        [3.04, 0.7, 62, 0.45],
        [3.92, 2.3, 64, 1],
        [6.48, 0.9, 62, 0.45],
        [7.61, 1.5, 57, 0.55],
      ],
      2,
    ),
  },
  {
    n: 87,
    id: 'crushed-felt-phrase-c',
    name: 'Crushed felt phrase {C}',
    kind: 'melodic',
    description:
      'A close felt piano crushed by a console stage: a low {C}, three notes above, an answer over {F}; it rings out.',
    preset: 'static-cathedral-crushed-felt',
    ...played(
      9,
      [
        [0, 2.5, 36, 0.7],
        [0.05, 2, 55, 0.8],
        [1.57, 1.2, 57, 0.75],
        [2.46, 2.5, 52, 0.8],
        [4.38, 3, 41, 0.7],
        [4.43, 2.5, 60, 0.8],
      ],
      1.5,
    ),
  },
  {
    n: 88,
    id: 'slipping-steel-dm',
    name: 'Slipping steel {D}m',
    kind: 'melodic',
    description:
      'Ringing steel strings opening {D} minor on an early sampler that now and then slips; it rings out.',
    preset: 'static-cathedral-slipping-steel',
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 10, release: 0.3, ride: 0 } },
    ],
    ...played(
      10,
      [
        [0, 2.5, 50, 0.7],
        [0.93, 2, 62, 0.65],
        [1.71, 2, 65, 0.7],
        [2.96, 2.4, 69, 0.75],
        [4.62, 2, 67, 0.6],
        [5.48, 2.6, 64, 0.7],
      ],
      1.5,
    ),
  },
  {
    n: 89,
    id: 'crushed-silk-run-b',
    name: 'Crushed silk run {B}',
    kind: 'melodic',
    description:
      'A koto plucked hard through {B}, {C}, {E} and {F} and back, crushed to five bits across a room.',
    preset: 'static-cathedral-crushed-silk-strings',
    then: [{ deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...played(
      7,
      [
        [0, 1.5, 71, 0.8],
        [0.74, 1.5, 72, 0.6],
        [1.39, 1.5, 76, 0.7],
        [2.66, 1.5, 77, 0.8],
        [3.21, 1.5, 76, 0.6],
        [4.57, 2, 71, 0.8],
      ],
      1.2,
    ),
  },
  {
    n: 90,
    id: 'bad-line-celesta-c',
    name: 'Bad line celesta {C}',
    kind: 'melodic',
    description:
      'A small celesta falling from a high {C} over a failing connection, tape echoes filling the holes; it comes round.',
    preset: 'static-cathedral-bad-line-celesta',
    ...cycled(8, [
      [0, 1.2, 84, 0.7],
      [0.57, 1.2, 79, 0.6],
      [1.31, 1.2, 76, 0.65],
      [2.48, 1.5, 81, 0.7],
      [3.02, 1.5, 77, 0.6],
      [4.36, 2, 72, 0.7],
      [6.13, 1.5, 76, 0.55],
    ]),
  },
  {
    n: 91,
    id: 'blown-cone-riff-a',
    name: 'Blown cone riff {A}',
    kind: 'melodic',
    description:
      'A barking electric piano low on {A}, a question and a longer answer through a broken-speaker fold.',
    preset: 'static-cathedral-tines-blown-cone',
    ...played(
      8,
      [
        [0, 1.5, 45, 0.6],
        [0.81, 0.6, 52, 0.5],
        [1.47, 1.8, 55, 0.6],
        [3.52, 0.7, 52, 0.5],
        [4.24, 2.4, 57, 1],
      ],
      1.2,
    ),
  },
  {
    n: 92,
    id: 'closing-filter-line-d',
    name: 'Closing filter line {D}',
    kind: 'melodic',
    description:
      'A resonant bass gliding from a low {D} to {A} and settling on {F}, the filter closing on each, at twelve bits.',
    preset: 'static-cathedral-closing-filter',
    ...played(
      9,
      [
        [0, 2.2, 38, 0.8],
        [2.57, 1.4, 45, 0.7],
        [4.21, 3, 41, 0.8],
      ],
      1.5,
    ),
  },
  {
    n: 93,
    id: 'baritone-grind-riff-e',
    name: 'Baritone grind riff {E}',
    kind: 'melodic',
    description:
      'Strings picked hard from {E} up to {A} and back into a dark triode fuzz and a warm stack.',
    preset: 'static-cathedral-baritone-grind',
    ...played(
      10,
      [
        [0, 1.3, 52, 0.9],
        [1.63, 1, 55, 0.7],
        [2.94, 1.8, 57, 0.9],
        [5.12, 3, 52, 0.85],
      ],
      1.2,
    ),
  },
  {
    n: 94,
    id: 'mirrored-bell-peal-e',
    name: 'Mirrored bell peal {E}',
    kind: 'melodic',
    description:
      'Four FM glass bells from a high {E} with converter images above, each strike returning backwards.',
    preset: 'static-cathedral-mirrored-bell',
    ...played(
      14,
      [
        [0, 2, 76, 0.7],
        [1.34, 2, 72, 0.6],
        [2.87, 2.5, 79, 0.7],
        [4.93, 3, 69, 0.65],
      ],
      3,
    ),
  },
  {
    n: 95,
    id: 'skipping-tremulant-g',
    name: 'Skipping tremulant {G}',
    kind: 'melodic',
    description:
      'One flute rank with its tremulant shaking, a slow air up from {G} that skips like a scratched disc.',
    preset: 'static-cathedral-skipping-tremulant',
    ...played(
      14,
      [
        [0, 1.4, 67, 0.8],
        [1.62, 0.8, 71, 0.7],
        [2.61, 1.9, 74, 0.8],
        [4.83, 1, 72, 0.7],
        [6.02, 2.4, 69, 0.8],
      ],
      3,
    ),
  },
  {
    n: 96,
    id: 'unwound-upright-a',
    name: 'Unwound upright {A}',
    kind: 'melodic',
    description:
      'Two felt piano notes, {A} and then {E}, whose echoes slide down an octave as they repeat, printed hot to tape.',
    preset: 'static-cathedral-unwound-upright',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Falling tape',
        params: { time: 620, feedback: 0.7, glide: 0.3, mix: 0.5 },
      },
      { deviceId: 'tape', preset: 'Hot glue', params: { wow: 0.3, age: 0.3, output: -4.5 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.3 } },
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.3 } }],
    ...played(
      12,
      [
        [0, 1.5, 69, 0.8],
        [2.71, 2, 64, 0.8],
      ],
      3,
    ),
  },
  {
    n: 97,
    id: 'stuttering-chimes',
    name: 'Stuttering chimes',
    kind: 'melodic',
    description:
      'Wind chimes over a stream that keeps sticking on a packet, single strikes stuttering under a rising halo.',
    preset: 'static-cathedral-stuck-chimes',
    ...looped(8, 4, 3, [60, 67]),
  },
  {
    n: 98,
    id: 'slowed-tongues-f',
    name: 'Slowed tongues {F}',
    kind: 'melodic',
    description:
      'A tongue drum on {F}, {C} and {A} with itself an octave down at half speed, blurred in a plate; it comes round.',
    preset: 'static-cathedral-slowed-tongues',
    set: { decay: 5 },
    then: [{ deviceId: 'stereo-widener', params: { width: 0.3 } }],
    ...cycled(
      8,
      [
        [0, 2, 53, 0.7],
        [1.87, 2, 60, 0.6],
        [4.23, 2.5, 57, 0.7],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 99,
    id: 'strum-without-end-a',
    name: 'Strum without end {A}',
    kind: 'melodic',
    description:
      'A slow four-octave strum of {A} and {E} that never lands, each string blurred into the last, from a far loudspeaker.',
    preset: 'static-cathedral-strum-without-end',
    ...cycled(8, [
      [0, 3.5, 57],
      [0, 3.5, 64],
      [4.07, 3.5, 57],
      [4.07, 3.5, 64],
    ]),
  },
  {
    n: 100,
    id: 'skipping-string-rise-c',
    name: 'Skipping string rise {C}',
    kind: 'melodic',
    description:
      'Clean neck-pickup notes up {C} major that skip like a scratched disc, backwards grains behind; it rings out.',
    preset: 'static-cathedral-skipping-string',
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 8, release: 0.3, ride: 0 } },
    ],
    ...played(
      8,
      [
        [0, 1.2, 60, 0.8],
        [1.37, 1, 64, 0.7],
        [2.31, 1.6, 67, 0.8],
        [4.18, 2.5, 72, 0.9],
      ],
      1.5,
    ),
  },
])
