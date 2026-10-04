// The sounds of the pack "Empty Concourse": its presets played, a hundred sounds to
// paint with. Numbers 1001 to 1100.

import { type PatchDevice } from '../../../core/devices/patch'
import { PRESETS } from '../packs/concourse'
import { type FactorySound } from '../types'
import { breathe, cycled, hall, looped, packSounds, played, quarterTurn, soften } from './recipe'

/** The pack's tape, as its presets set it. */
const tape = (params: Readonly<Record<string, number>> = {}): PatchDevice => ({
  deviceId: 'tape',
  preset: 'Quarter inch',
  params,
})

const narrow: PatchDevice = { deviceId: 'stereo-widener', preset: 'Narrow' }

/** Weather and room tone, narrowed: the instrument is as wide as it is loud at its own width. */
const weather = (preset: string, params: Readonly<Record<string, number>> = {}): PatchDevice => ({
  deviceId: 'atmosphere',
  preset,
  params: { attack: 0.5, width: 0.6, ...params },
})

const outdoors = (preset: string, params: Readonly<Record<string, number>> = {}): PatchDevice => ({
  deviceId: 'outdoors',
  preset,
  params,
})

const expanse = (params: Readonly<Record<string, number>> = {}): PatchDevice => ({
  deviceId: 'expanse',
  preset: 'Open space',
  params,
})

/** Holds the stroke down so what rings after it is not left far below the bank's peak. */
const lift = (gain: number): PatchDevice => ({
  deviceId: 'ambient-limiter',
  preset: 'Pinned',
  params: { gain, release: 0.3, ride: 0 },
})

/** Rides a held tone to one level, so what a tape or a room does to it does not swell. */
const even: PatchDevice = {
  deviceId: 'ambient-limiter',
  preset: 'Pinned',
  params: { gain: 18, release: 0.2 },
}

export const SOUNDS: readonly FactorySound[] = packSounds('concourse', 1000, PRESETS, [
  // Drones: what the building holds when nothing is leaving.
  {
    n: 1,
    id: 'night-shift-drone-d',
    name: 'Night shift drone {D}',
    kind: 'drone',
    description:
      'A {D} and its fifth over a sub octave and a little air, breathing slightly, on tape in a long room.',
    preset: 'concourse-night-shift-drone',
    set: { movement: 0, air: 0.25, sub: 0.6 },
    effects: [
      tape({ wow: 0, hiss: 0.15 }),
      expanse({ decay: 14, highCut: 4000, mix: 0.3, modDepth: 0, width: 0.45 }),
    ],
    then: [breathe(0.125, 0.15), quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 6, 3, [50]),
  },
  {
    n: 2,
    id: 'ground-floor-a',
    name: 'Ground floor {A}',
    kind: 'drone',
    description:
      'A low square-wave {A} over its sub octave, with a half-speed copy an octave under it, in a hall.',
    preset: 'concourse-ground-floor',
    set: { chorus: 0 },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Under the mix',
        params: { length: 1000, jitter: 0, spread: 1, mix: 0.35 },
      },
      tape({ wow: 0, hiss: 0.1 }),
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25, breathRate: 0.25 } },
    ],
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 5, 2, [45]),
  },
  {
    n: 3,
    id: 'hollow-floor-a',
    name: 'Hollow floor {A}',
    kind: 'drone',
    description: 'A dark hollow {A} over a strong sub octave, on tape in a huge room.',
    preset: 'concourse-hollow-floor',
    set: { motion: 0, detune: 0 },
    then: [even, quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 6, 3, [45]),
  },
  {
    n: 4,
    id: 'soft-sub-tone-f',
    name: 'Soft sub tone {F}',
    kind: 'drone',
    description:
      'A round low {F} over its octave below, the filter opened a little, barely swelling, on tape in a small room.',
    preset: 'concourse-soft-sub-tone',
    set: { cutoff: 320, beat: 0, sub: 0.7 },
    then: [breathe(0.125, 0.2), quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 4, 2, [41]),
  },
  {
    n: 5,
    id: 'rough-low-string-g',
    name: 'Rough low string {G}',
    kind: 'drone',
    description:
      'One low {G} bowed without vibrato, a little rough at the bow, on tape in a long plate.',
    preset: 'concourse-rough-low-string',
    set: { detune: 0 },
    then: [narrow, even, quarterTurn(8)],
    ...looped(8, 5, 2, [43]),
    tuning: 'whole-cycles',
  },
  {
    n: 6,
    id: 'one-singer-g',
    name: 'One singer {G}',
    kind: 'drone',
    description:
      'One singer holding a {G} on one vowel with little breath and no vibrato, on tape in a hall.',
    preset: 'concourse-one-singer',
    set: { vibrato: 0, motion: 0, breath: 0.08, tone: 3500 },
    effects: [tape({ wow: 0, hiss: 0.15 }), hall('Hall', 0.45)],
    then: [lift(12), quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 5, 2, [55]),
  },
  {
    n: 7,
    id: 'slowly-folding-tone-g',
    name: 'Slowly folding tone {G}',
    kind: 'drone',
    description:
      'A low {G} that folds over into richer tones and back, held on tape in a vast room.',
    preset: 'concourse-slowly-folding-tone',
    // Its modulator at the unison, not the octave below: the tone repeats at its own pitch in every key.
    set: { drift: 0.1, ratio: 1 },
    effects: [
      tape({ wow: 0 }),
      expanse({ decay: 12, highCut: 5000, mix: 0.35, modDepth: 0, width: 0.6 }),
    ],
    then: [lift(12), quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 6, 3, [43]),
  },
  {
    n: 8,
    id: 'late-chorus-low-a',
    name: 'Late chorus low {A}',
    kind: 'drone',
    description:
      'The chorus polysynth holding one low {A} as a soft string tone, on tape in a hall.',
    preset: 'concourse-late-chorus-strings',
    ...looped(8, 6, 2, [45]),
  },
  {
    n: 9,
    id: 'slow-low-brass-c',
    name: 'Slow low brass {C}',
    kind: 'drone',
    description: 'One low brass player holding a {C} on tape, far down a long stone hall.',
    preset: 'concourse-slow-low-brass',
    set: { section: 0 },
    then: [quarterTurn(8)],
    ...looped(8, 6, 2, [48]),
    tuning: 'whole-cycles',
  },
  {
    n: 10,
    id: 'open-doors-drone-c',
    name: 'Open doors drone {C}',
    kind: 'drone',
    description:
      'A dark {C} of saw and square with its filter held open and the chorus off, in a vast still room.',
    preset: 'concourse-doors-opening',
    set: { chorus: 0 },
    effects: [expanse({ decay: 14, mix: 0.35, modDepth: 0, width: 0.6 })],
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 6, 2, [48]),
  },
  // Pads: chords that take their time.
  {
    n: 11,
    id: 'slow-vowel-loop-dm7',
    name: 'Slow vowel loop {D}m7',
    kind: 'pad',
    description:
      'A synthetic choir on {D} minor seventh, changing vowel in one slow swell, layered again on a tape loop.',
    preset: 'concourse-slow-vowel-loop',
    set: { rate: 0.125, detune: 5 },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 5.3, feedback: 0.65, wear: 0.1, wow: 0.1, spread: 0.4, mix: 0.4 },
      },
      hall('Hall', 0.3),
    ],
    then: [breathe(0.125, 0.5)],
    ...looped(8, 7, 3, [50, 57, [60, 0.8], [65, 0.7]]),
  },
  {
    n: 12,
    id: 'rotor-reed-em7',
    name: 'Rotor reed {E}m7',
    kind: 'pad',
    description:
      'A soft reed tone on {E} minor seventh, opening toward a saw in one slow swell, through a slowly rotating speaker.',
    preset: 'concourse-rotor-reed',
    set: { rate: 0.125 },
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 2, [52, 59, [62, 0.8], [67, 0.7]]),
  },
  {
    n: 13,
    id: 'reeds-from-nothing-g6',
    name: 'Reeds from nothing {G}6',
    kind: 'pad',
    description:
      'Clarinets holding {G} with its sixth, started from nothing, in a softly singing hall.',
    preset: 'concourse-reeds-from-nothing',
    then: [breathe(0.125, 0.6)],
    ...looped(8, 6, 2, [55, 62, [64, 0.8], [71, 0.7]]),
  },
  {
    n: 14,
    id: 'far-end-voices-g',
    name: 'Far end voices {G}',
    kind: 'pad',
    description:
      'Low voices on a closed oh holding {G} and {D}, through a speaker far down a stone hall.',
    preset: 'concourse-far-end-voices',
    then: [narrow, breathe(0.125, 0.4)],
    set: { ensemble: 0 },
    ...looped(8, 6, 3, [43, [50, 0.7]]),
  },
  {
    n: 15,
    id: 'beating-reeds-d',
    name: 'Beating reeds {D}',
    kind: 'pad',
    description:
      'A reed organ on {D} and {A} with a second rank beating slowly against the first, worn by tape.',
    preset: 'concourse-beating-reeds',
    set: { celeste: 0.5 },
    then: [breathe(0.125, 0.4)],
    ...looped(8, 6, 3, [50, [57, 0.8]]),
  },
  {
    n: 16,
    id: 'low-flute-loop-d',
    name: 'Low flute loop {D}',
    kind: 'pad',
    description:
      'A low flute on {D}, {A} and the {D} above in turn, each layered over the last on a four-second tape loop.',
    preset: 'concourse-low-flute-loop',
    ...cycled(12, [
      [0, 3.2, 50, 0.75],
      [4.3, 3, 57, 0.75],
      [8.1, 2.8, 62, 0.75],
    ]),
  },
  {
    n: 17,
    id: 'vowel-loops-g',
    name: 'Vowel loops {G}',
    kind: 'pad',
    description:
      'A few voices holding {G} and {D} on one ah, on two tape loops of unequal length in a hall.',
    preset: 'concourse-vowel-loops',
    set: { ensemble: 0 },
    then: [breathe(0.125, 0.35)],
    ...looped(8, 7, 3, [55, [62, 0.7]]),
  },
  {
    n: 18,
    id: 'still-tones-f',
    name: 'Still tones {F}',
    kind: 'pad',
    description:
      'Nearly pure tones on {F} and {C} in one slow swell, turned by a slow frequency shift and a breathing hall.',
    preset: 'concourse-still-tones',
    set: { detune: 0 },
    effects: [
      { deviceId: 'freq-shifter', params: { fine: 0.25, feedback: 0.4, mix: 0.4 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 7, mix: 0.4, breathRate: 0.25 },
      },
      breathe(0.125, 0.6),
      quarterTurn(8),
    ],
    ...looped(8, 6, 2, [53, [60, 0.8]]),
    tuning: 'whole-cycles',
  },
  {
    n: 19,
    id: 'tape-choir-loop-cmaj7',
    name: 'Tape choir loop {C}maj7',
    kind: 'pad',
    description:
      'A choir on strips of tape at half speed on {C} major seventh, laid again on a tape loop.',
    preset: 'concourse-tape-choir-loop',
    then: [breathe(0.125, 0.4)],
    ...looped(8, 7, 2, [60, [67, 0.8], [71, 0.8], [76, 0.7]]),
  },
  {
    n: 20,
    id: 'choir-an-octave-down-a',
    name: 'Choir an octave down {A}',
    kind: 'pad',
    description:
      'A choir chord on {A} minor loaded and played an octave down on an unsteady loop, layered on a longer one.',
    preset: 'concourse-loaded-octave-down',
    source: 'choir-chord-am',
    ...looped(8, 8, 3, [60]),
    loopFold: 'linear',
  },
  {
    n: 21,
    id: 'slow-glass-pad-fmaj7',
    name: 'Slow glass pad {F}maj7',
    kind: 'pad',
    description:
      'A held pad of glass overtones on {F} major seventh, on tape in a vast open space.',
    preset: 'concourse-slow-glass-pad',
    ...looped(8, 7, 3, [53, 60, [64, 0.8], [69, 0.7]]),
  },
  {
    n: 22,
    id: 'singing-glass-dm9',
    name: 'Singing glass {D}m9',
    kind: 'pad',
    description: 'Slow glass tones on {D} minor ninth in a hall that sings a soft ah back at them.',
    preset: 'concourse-singing-glass',
    then: [narrow, breathe(0.125, 0.3), quarterTurn(8)],
    ...looped(8, 7, 3, [50, 53, 57, [60, 0.8], [64, 0.7]]),
    tuning: 'whole-cycles',
  },
  {
    n: 23,
    id: 'skylight-glass-g6',
    name: 'Skylight glass {G}6',
    kind: 'pad',
    description:
      'Glass overtones drifting across {G} with its sixth and ninth, an octave halo above.',
    preset: 'concourse-skylight-glass',
    set: { rate: 0.125 },
    then: [breathe(0.125, 0.4)],
    ...looped(8, 7, 3, [55, 62, [71, 0.8], [76, 0.7], [81, 0.6]]),
  },
  {
    n: 24,
    id: 'late-chorus-strings-am7',
    name: 'Late chorus strings {A}m7',
    kind: 'pad',
    description:
      'The chorus polysynth as soft strings on {A} minor seventh, arriving slowly and let go, on tape in a hall.',
    preset: 'concourse-late-chorus-strings',
    ...played(
      12,
      [
        [0, 5.5, 45],
        [0, 5.5, 52],
        [0, 5.5, 60, 0.8],
        [0, 5.5, 64, 0.8],
        [0, 5.5, 67, 0.7],
      ],
      2,
    ),
  },
  {
    n: 25,
    id: 'landing-lights-cmaj7',
    name: 'Landing lights {C}maj7',
    kind: 'pad',
    description:
      'A thin moving pulse on {C} major seventh with its lows cut, a reverb climbing an octave over it.',
    preset: 'concourse-landing-lights',
    then: [breathe(0.125, 0.5)],
    ...looped(8, 6, 3, [60, 67, [71, 0.8], [76, 0.7]]),
  },
  {
    n: 26,
    id: 'dim-brass-chord-dm',
    name: 'Dim brass chord {D}m',
    kind: 'pad',
    description:
      'A dark brassy chord on {D} minor that keeps swelling while held, in a long plate.',
    preset: 'concourse-dim-brass-chord',
    then: [breathe(0.125, 0.5)],
    ...looped(8, 6, 3, [50, 57, [62, 0.8], [65, 0.7]]),
  },
  {
    n: 27,
    id: 'mezzanine-strings-em',
    name: 'Mezzanine strings {E}m',
    kind: 'pad',
    description:
      'A thin high string layer on {E} minor with its lows cut, in a slow chorus and a long room.',
    preset: 'concourse-mezzanine-strings',
    set: { detune: 5 },
    then: [breathe(0.125, 0.45)],
    ...looped(8, 6, 3, [64, 71, [76, 0.8], [79, 0.7]]),
  },
  {
    n: 28,
    id: 'slow-ensemble-c6',
    name: 'Slow ensemble {C}6',
    kind: 'pad',
    description:
      'A seventies string ensemble on {C} with its sixth and ninth, slow and dark, turning in a slow phaser.',
    preset: 'concourse-slow-ensemble',
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, mix: 0.25 } },
      hall('Hall', 0.3),
    ],
    then: [breathe(0.125, 0.5)],
    ...looped(8, 7, 3, [48, 55, [64, 0.8], [69, 0.8], [74, 0.7]]),
  },
  {
    n: 29,
    id: 'slow-low-brass-g',
    name: 'Low brass swell {G}',
    kind: 'pad',
    description:
      'Low brass in open fifths on {G}, every note swelling over four seconds, on tape in a long hall.',
    preset: 'concourse-slow-low-brass',
    then: [breathe(0.125, 0.4)],
    ...looped(8, 7, 3, [43, 50, [55, 0.8], [62, 0.6]]),
  },
  {
    n: 30,
    id: 'far-gate-mutes-am',
    name: 'Far gate mutes {A}m',
    kind: 'pad',
    description:
      'Six muted players on each note of {A} minor, heard from the far end of a long stone hall.',
    preset: 'concourse-far-gate-mutes',
    then: [breathe(0.125, 0.4)],
    ...looped(8, 7, 3, [45, 52, [60, 0.8], [64, 0.7]]),
  },
  {
    n: 31,
    id: 'oo-and-halo-em',
    name: 'Oo and halo {E}m',
    kind: 'pad',
    description:
      'Women on a closed oo holding {E} minor without vibrato, doubled either side under an octave halo.',
    preset: 'concourse-oo-and-halo',
    set: { ensemble: 0 },
    then: [breathe(0.125, 0.4), quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 7, 3, [64, 71, [79, 0.7]]),
  },
  {
    n: 32,
    id: 'thin-air-steel-g',
    name: 'Thin air steel {G}',
    kind: 'pad',
    description:
      'A pedal steel grip on {G} swelled in with the volume pedal, under a reverb that climbs an octave.',
    preset: 'concourse-thin-air-steel',
    ...cycled(8, [
      [0, 7, 43, 0.7],
      [0.03, 7, 55, 0.65],
      [0.06, 7, 62, 0.6],
      [0.09, 7, 71, 0.6],
    ]),
    loopFold: 'power',
  },
  {
    n: 33,
    id: 'hammerless-piano-am9',
    name: 'Hammerless piano {A}m9',
    kind: 'pad',
    description:
      'A piano on {A} minor ninth with the hammers faded off and the pedal held, played low and then high.',
    preset: 'concourse-hammerless-piano',
    then: [lift(6), narrow],
    ...cycled(8, [
      [0, 3.5, 45, 0.7],
      [0.02, 3.5, 52, 0.6],
      [0.04, 3.5, 60, 0.6],
      [3.7, 3.5, 64, 0.65],
      [3.72, 3.5, 67, 0.6],
      [3.74, 3.5, 71, 0.6],
    ]),
  },
  {
    n: 34,
    id: 'soft-landing-c6',
    name: 'Soft landing {C}6',
    kind: 'pad',
    description:
      'A tine chord on {C} sixth with the strike faded off, left to climb an octave in a long reverb.',
    preset: 'concourse-soft-landing',
    ...cycled(8, [
      [0, 5, 48, 0.7],
      [0.02, 5, 55, 0.6],
      [0.04, 5, 64, 0.6],
      [0.06, 5, 69, 0.6],
    ]),
  },
  {
    n: 35,
    id: 'slowed-tape-flutes-c',
    name: 'Slowed tape flutes {C}',
    kind: 'pad',
    description:
      'Tape flutes at half speed on {C}, {G} and the {C} above: breathy, a little unsteady, with murky repeats.',
    preset: 'concourse-slowed-tape-flutes',
    ...played(
      8,
      [
        [0, 2.5, 60],
        [0, 2.5, 67],
        [0, 2.5, 72],
      ],
      2,
    ),
  },
  {
    n: 36,
    id: 'reed-and-return-g',
    name: 'Reed and return {G}',
    kind: 'pad',
    description:
      'A soft clarinet line climbing from {G}, each phrase still sounding in a long tape delay; it comes round.',
    preset: 'concourse-reed-and-return',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.125, depth: 0.5, drift: 0 } },
      {
        deviceId: 'tape-echo',
        params: {
          time: 1800,
          feedback: 0.68,
          wow: 0.3,
          flutter: 0.1,
          drive: 0.2,
          highCut: 3500,
          spread: 0.4,
          mix: 0.42,
        },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3, breathRate: 0.25 } },
    ],
    ...cycled(8, [
      [0, 1.6, 67],
      [1.83, 0.9, 71],
      [2.91, 1.3, 74],
      [4.62, 2.2, 72],
    ]),
  },
  {
    n: 37,
    id: 'round-of-one-c',
    name: 'Round of one {C}',
    kind: 'pad',
    description:
      'A sung line on {C} fed to a two-second tape delay, each note still sounding under the next; it comes round.',
    preset: 'concourse-round-of-one',
    ...cycled(8, [
      [0, 1.8, 60],
      [2.11, 1.5, 64],
      [4.07, 1.2, 62],
      [5.6, 1.9, 67],
    ]),
  },
  {
    n: 38,
    id: 'circling-guitar-em',
    name: 'Circling guitar {E}m',
    kind: 'pad',
    description:
      'Guitar notes of {E} minor faded in so no pick is heard, circling in a long tape delay; it comes round.',
    preset: 'concourse-circling-guitar',
    ...cycled(8, [
      [0, 2.5, 52],
      [2.2, 2.2, 59],
      [4.1, 2.4, 62],
      [6.0, 1.8, 55],
    ]),
  },
  {
    n: 39,
    id: 'backwards-felt-piano-c',
    name: 'Backwards felt piano {C}',
    kind: 'pad',
    description:
      'A loaded felt piano note played backwards on three keys, with a long tape delay and a plate.',
    preset: 'concourse-loaded-backwards',
    then: [narrow],
    source: 'felt-piano-c',
    ...played(
      10,
      [
        [0, 3, 60],
        [2.6, 3, 67],
        [5.1, 3, 64],
      ],
      2,
    ),
  },
  // Textures: air, weather and what is left switched on.
  {
    n: 40,
    id: 'vent-air-steady',
    name: 'Steady vent air',
    kind: 'texture',
    description:
      'Steady air from the vents of a large building, with very little movement and no weather in it.',
    preset: 'concourse-vent-air',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { cutoffHz: 2500, lfoAmount: 15, lfoRateHz: 0.125 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
    ...looped(8, 5, 3, [48]),
  },
  {
    n: 41,
    id: 'tube-lights-hum',
    name: 'Tube lights hum',
    kind: 'texture',
    description:
      'The hum of light fittings on a low {A} under tape hiss and the rumble of an empty room.',
    preset: 'concourse-tube-lights',
    set: { volume: -16 },
    effects: [
      tape({ hiss: 0.2 }),
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -30, width: 0.7 } },
      hall('Room', 0.3),
    ],
    ...looped(8, 4, 2, [45]),
  },
  {
    n: 42,
    id: 'long-corridor-wind',
    name: 'Long corridor wind',
    kind: 'texture',
    description:
      'Breathy noise with a faint chord in it, like wind finding the gaps in a long corridor.',
    preset: 'concourse-long-corridor',
    ...looped(8, 5, 3, [50, 57]),
  },
  {
    n: 43,
    id: 'cabin-air-voices',
    name: 'Cabin air voices',
    kind: 'texture',
    description:
      'Breathy voices that change vowel slowly as they hold, more air than tone, in a wide open space.',
    preset: 'concourse-cabin-air',
    then: [narrow, breathe(0.125, 0.4)],
    set: { breath: 1 },
    ...looped(8, 7, 3, [52, 55, 59]),
  },
  {
    n: 44,
    id: 'air-and-octave-flutes',
    name: 'Air and octave flutes',
    kind: 'texture',
    description:
      'Low flutes blown so softly they are mostly air, held as a chord with an octave halo behind.',
    preset: 'concourse-air-and-octave',
    then: [quarterTurn(8)],
    set: { breath: 1 },
    ...looped(8, 6, 3, [57, 60, 64]),
    tuning: 'whole-cycles',
  },
  {
    n: 45,
    id: 'rain-on-the-skylight',
    name: 'Rain on the skylight',
    kind: 'texture',
    description: 'Rain on glass overhead, single drops over a steady patter, in a wide open space.',
    instrument: weather('Rain on the window', { density: 0.7 }),
    effects: [soften(20), expanse({ decay: 6, mix: 0.3 })],
    ...looped(8, 3, 2, [60]),
  },
  {
    n: 46,
    id: 'downpour-on-the-apron',
    name: 'Downpour on the apron',
    kind: 'texture',
    description:
      'Heavy rain on the concrete outside, a dense hiss with no single drop in front, on tape.',
    instrument: weather('Distant downpour'),
    effects: [tape({ hiss: 0.1 }), hall('Hall', 0.25)],
    ...looped(8, 3, 2, [55]),
  },
  {
    n: 47,
    id: 'draught-at-the-doors',
    name: 'Draught at the doors',
    kind: 'texture',
    description:
      'Wind whistling through the gap of a sliding door, rising and falling in a long empty space.',
    instrument: weather('Whistling gap', { resonance: 0.3, size: 0.5 }),
    effects: [expanse({ decay: 8, mix: 0.3 })],
    ...looped(16, 3, 3, [50]),
  },
  {
    n: 48,
    id: 'far-traffic-wash',
    name: 'Far traffic wash',
    kind: 'texture',
    description:
      'Slow waves of noise that rise and sink like traffic a long way beyond the car park, in a hall.',
    instrument: weather('Slow shore', { tone: 0.35, movement: 0.5, density: 0.5 }),
    effects: [
      { deviceId: 'ambient-eq', preset: 'Open', params: { lowCut: 40 } },
      soften(6),
      hall('Hall', 0.3),
    ],
    ...looped(16, 6, 3, [48]),
  },
  {
    n: 49,
    id: 'gate-radio-static',
    name: 'Gate radio static',
    kind: 'texture',
    description:
      'Bands of tuned noise through a radio far from its station, fading into static in a small room.',
    instrument: { deviceId: 'thesis', params: { resonance: 20, attack: 0.3, breatheRate: 0.25 } },
    effects: [{ deviceId: 'radio', preset: 'Far station' }, hall('Room', 0.4)],
    ...looped(8, 6, 2, [57, 64]),
  },
  {
    n: 50,
    id: 'storm-past-the-glass',
    name: 'Storm past the glass',
    kind: 'texture',
    description:
      'A storm a long way off, its rolls of thunder overlapping, softened in a wide open space.',
    instrument: outdoors('Far storm', { density: 1, tone: 0.6, movement: 0.4, width: 0.7 }),
    effects: [soften(8), expanse({ decay: 8, mix: 0.25 })],
    ...looped(16, 1, 3, [36, 43, 48, 53]),
  },
  {
    n: 51,
    id: 'birds-in-the-rafters',
    name: 'Birds in the rafters',
    kind: 'texture',
    description:
      'Small birds that got in, calling from high in the roof, far off in a wide open space.',
    instrument: outdoors('Dawn chorus', {
      density: 1,
      distance: 0.9,
      movement: 1,
      tone: 0.3,
      attack: 1,
      width: 0.6,
    }),
    effects: [expanse({ mix: 0.65, width: 0.7 })],
    ...looped(16, 4, 3, [48, 53, 57, 60, 64, 67, 72, 77]),
  },
  {
    n: 52,
    id: 'atrium-fountain',
    name: 'Atrium fountain',
    kind: 'texture',
    description: 'Water falling into a shallow pool: single bubbles over a soft rush, in a hall.',
    instrument: outdoors('Small stream', { density: 0.5, distance: 0.25, attack: 0.5, width: 0.7 }),
    effects: [hall('Hall', 0.35)],
    ...looped(8, 3, 2, [64]),
  },
  {
    n: 53,
    id: 'smeared-drone-strings',
    name: 'Smeared drone strings',
    kind: 'texture',
    description:
      'Four drone strings with the buzz taken off, smeared until neither pluck nor pitch is left, under room air.',
    preset: 'concourse-plain-drone-strings',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { width: 0.35, mix: 1 } },
      { deviceId: 'noise-floor', preset: 'Thin bright air', params: { level: -30 } },
      expanse({ decay: 12, mix: 0.3, width: 0.45 }),
    ],
    then: [narrow, breathe(0.125, 0.4)],
    ...looped(8, 8, 3, [55]),
  },
  {
    n: 54,
    id: 'cloud-ceiling-grains',
    name: 'Cloud ceiling grains',
    kind: 'texture',
    description:
      'Shifting groups of high partials broken into a cloud of grains until little pitch is left.',
    preset: 'concourse-cloud-ceiling',
    set: { detune: 40, motion: 1 },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 120, scatter: 1, spray: 1, texture: 1, mix: 1 },
      },
      expanse({ decay: 16, highCut: 6000, mix: 0.4, width: 0.8 }),
    ],
    then: [narrow, breathe(0.125, 0.4)],
    ...looped(8, 9, 3, [72, 74, 79, 81]),
  },
  // One-shots: one stroke, left to ring.
  {
    n: 55,
    id: 'boarding-chime-g',
    name: 'Boarding chime {G}',
    kind: 'oneshot',
    description: 'One struck {G} on a small chime bar, under a reverb that lifts it an octave.',
    preset: 'concourse-boarding-chime',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 9, shimmer: 0.4, tone: 6500, mix: 0.25 },
      },
    ],
    then: [narrow],
    ...played(6, [[0, 1.2, 79]], 1.5),
  },
  {
    n: 56,
    id: 'glass-bell-halo-f',
    name: 'Glass bell halo {F}',
    kind: 'oneshot',
    description:
      'One glassy FM bell on {F}, softly struck, in a reverb that climbs an octave above it as it fades.',
    preset: 'concourse-glass-bell-halo',
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 12, shimmer: 0.5, tone: 5500, predelay: 40, mix: 0.25 },
      },
    ],
    ...played(8, [[0, 2, 65]], 2),
  },
  {
    n: 57,
    id: 'dark-mallet-d',
    name: 'Dark mallet {D}',
    kind: 'oneshot',
    description:
      'One dark, round FM mallet note on a low {D}, on tape in a hall with a long dull tail.',
    preset: 'concourse-dark-mallet',
    ...played(8, [[0, 2, 38, 1]], 2),
  },
  {
    n: 58,
    id: 'stretched-bell-g',
    name: 'Stretched bell {G}',
    kind: 'oneshot',
    description:
      'One soft stroke of a church bell on {G}, its octaves stretched to ninths, in a long plate.',
    preset: 'concourse-stretched-bell',
    // Stretched this far the hum and the nominal are ninths (F below, A above): white keys.
    set: { decay: 9, stretch: 1.167, position: 0.45 },
    // Less of the plate: its low tail is out of phase between the sides where the hum note lands on it.
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.4, mix: 0.18 } },
    ],
    then: [lift(9), narrow],
    ...played(12, [[0, 11, 55]], 2.5),
  },
  {
    n: 59,
    id: 'still-vibraphone-f',
    name: 'Still vibraphone {F}',
    kind: 'oneshot',
    description:
      'One vibraphone bar on {F} with the motor off and the pedal down, widened a little, in a hall.',
    preset: 'concourse-still-vibraphone',
    ...played(8, [[0, 6, 65]], 1.5),
  },
  {
    n: 60,
    id: 'bowl-and-return-b',
    name: 'Bowl and return {B}',
    kind: 'oneshot',
    description:
      'One struck bronze bowl on {B} with a long tape delay that hands the note back darker, in a hall.',
    preset: 'concourse-bowl-and-return',
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 1650,
          feedback: 0.35,
          heads: 1,
          wow: 0.3,
          flutter: 0.1,
          drive: 0.2,
          highCut: 3000,
          spread: 0.7,
          mix: 0.22,
        },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...played(12, [[0, 8, 59]], 2.5),
  },
  {
    n: 61,
    id: 'tongue-drum-memory-c',
    name: 'Tongue drum memory {C}',
    kind: 'oneshot',
    description:
      'One soft stroke on a steel tongue drum on {C}, with an echo that brings it back, in a long hall.',
    preset: 'concourse-tongue-drum-memory',
    // The echo a little under the stroke, so it stays one stroke in every key.
    effects: [
      lift(4),
      { deviceId: 'echo-memory', preset: 'Backwards', params: { time: 900, mix: 0.22 } },
      hall('Cathedral', 0.35),
    ],
    ...played(10, [[0, 3, 60]], 3),
  },
  {
    n: 62,
    id: 'unattended-piano-f',
    name: 'Unattended piano {F}',
    kind: 'oneshot',
    description:
      'A low {F} with its fifth and octave, played softly on an upright across a hard, empty hall with its room tone.',
    preset: 'concourse-unattended-piano',
    // The limiter comes first, so the stroke is held down and the hall is left as it rings.
    effects: [
      lift(8),
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -44 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 90, lowDecay: 5, midDecay: 4.5, damping: 5000, mix: 0.4 },
      },
    ],
    ...played(
      8,
      [
        [0, 4, 41, 0.6],
        [0.01, 4, 48, 0.5],
        [0.02, 4, 53, 0.5],
      ],
      2,
    ),
  },
  {
    n: 63,
    id: 'soft-pedal-double-am',
    name: 'Soft pedal double {A}m',
    kind: 'oneshot',
    description:
      'A chord of {A} minor on the soft pedal, doubled a few cents either side and hung in a long dark room.',
    preset: 'concourse-soft-pedal-double',
    set: { sustain: 0 },
    ...played(
      10,
      [
        [0, 6, 45, 1],
        [0.01, 6, 57, 0.85],
        [0.02, 6, 60, 0.85],
        [0.03, 6, 64, 0.9],
      ],
      3,
    ),
  },
  {
    n: 64,
    id: 'prepared-piano-e',
    name: 'Prepared piano {E}',
    kind: 'oneshot',
    description:
      'One stiff, bell-like {E} on a piano with things laid on its strings, cut short, with a tape echo.',
    preset: 'concourse-prepared-piano',
    ...played(4, [[0, 0.4, 64]], 1),
  },
  {
    n: 65,
    id: 'rotating-piano-g6',
    name: 'Rotating piano {G}6',
    kind: 'oneshot',
    description:
      'A piano chord on {G} sixth through a slowly rotating speaker cabinet, with a long plate behind it.',
    preset: 'concourse-rotating-piano',
    ...played(
      8,
      [
        [0, 5, 43, 0.7],
        [0.01, 5, 50, 0.6],
        [0.02, 5, 59, 0.6],
        [0.03, 5, 64, 0.65],
      ],
      1.5,
    ),
  },
  {
    n: 66,
    id: 'glass-wall-tines-cmaj7',
    name: 'Glass wall tines {C}maj7',
    kind: 'oneshot',
    description:
      'Bell-like tines on {C} major seventh with a copy a few cents either side, in a vast room.',
    preset: 'concourse-glass-wall-tines',
    effects: [
      {
        deviceId: 'stereo-detune',
        preset: 'Classic',
        params: { detune: 11, delay: 18, drift: 0.35, mix: 0.3 },
      },
      expanse({ decay: 12, highCut: 8000, mix: 0.22, width: 0.8 }),
    ],
    ...played(
      10,
      [
        [0, 4, 48, 1],
        [0.01, 4, 55, 0.9],
        [0.02, 4, 64, 0.9],
        [0.03, 4, 71, 0.9],
      ],
      3,
    ),
  },
  {
    n: 67,
    id: 'digital-tines-dm9',
    name: 'Digital tines {D}m9',
    kind: 'oneshot',
    description:
      'An FM electric piano chord on {D} minor ninth, through twelve-bit converters and a chorus, on a plate.',
    preset: 'concourse-digital-tines',
    then: [narrow],
    ...played(
      6,
      [
        [0, 3.5, 50, 0.7],
        [0.01, 3.5, 57, 0.6],
        [0.02, 3.5, 60, 0.6],
        [0.03, 3.5, 65, 0.6],
        [0.04, 3.5, 76, 0.65],
      ],
      1,
    ),
  },
  {
    n: 68,
    id: 'moving-walkway-em7',
    name: 'Moving walkway {E}m7',
    kind: 'oneshot',
    description:
      'A long tine chord on {E} minor seventh carried from side to side by its tremolo, in a slow chorus.',
    preset: 'concourse-moving-walkway',
    ...played(
      8,
      [
        [0, 5, 52, 0.7],
        [0.01, 5, 59, 0.6],
        [0.02, 5, 62, 0.6],
        [0.03, 5, 67, 0.65],
      ],
      1.5,
    ),
  },
  {
    n: 69,
    id: 'night-freight-c',
    name: 'Night freight {C}',
    kind: 'oneshot',
    description:
      'One low dark tine on {C}, driven on tape, with a faint echo of itself and a short plate.',
    preset: 'concourse-night-freight',
    effects: [
      tape({ drive: 0.4, hiss: 0.1 }),
      {
        deviceId: 'echo-memory',
        preset: 'Far back',
        params: { time: 1100, feedback: 0.3, vary: 0.5, tone: 3500, mix: 0.2 },
      },
      { deviceId: 'plate-reverb', params: { decay: 0.8, damping: 0.5, mix: 0.25 } },
    ],
    ...played(8, [[0, 3, 36]], 2),
  },
  {
    n: 70,
    id: 'atrium-harp-a',
    name: 'Atrium harp {A}',
    kind: 'oneshot',
    description:
      'One harp string on {A} plucked softly near the middle, with strings that ring on behind it.',
    preset: 'concourse-atrium-harp',
    ...played(8, [[0, 4, 57]], 2),
  },
  {
    n: 71,
    id: 'strum-plate-chord-g6',
    name: 'Strum plate chord {G}6',
    kind: 'oneshot',
    description:
      'One quick sweep up an electronic chord harp holding {G} sixth, with a reverb that climbs an octave.',
    preset: 'concourse-strum-plate-sweep',
    set: { strum: 6 },
    ...played(
      7,
      [
        [0, 1, 55],
        [0, 1, 59],
        [0, 1, 62],
        [0, 1, 64],
      ],
      2,
    ),
  },
  {
    n: 72,
    id: 'hammered-and-phased-d',
    name: 'Hammered and phased {D}',
    kind: 'oneshot',
    description:
      'One hammered {D} with its fifth and octave on an open-tuned zither, through a slow phaser into a hall.',
    preset: 'concourse-hammered-and-phased',
    set: { roll: 0, strum: 8 },
    then: [lift(14)],
    ...played(7, [[0, 5, 50]], 2),
  },
  {
    n: 73,
    id: 'slowed-nylon-a',
    name: 'Slowed nylon {A}',
    kind: 'oneshot',
    description:
      'One {A} on a nylon string under the thumb, slowed to half speed on tape, in a long plate.',
    preset: 'concourse-slowed-nylon',
    // Less of the plate: its low tail is out of phase between the sides and booms on one note.
    effects: [
      lift(5),
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { length: 2800, mix: 0.8 } },
      tape({ wow: 0.35 }),
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.12 } },
    ],
    ...played(8, [[0, 3, 57]], 2),
  },
  {
    n: 74,
    id: 'steel-let-ring-g',
    name: 'Steel, let ring {G}',
    kind: 'oneshot',
    description:
      'Six steel strings strummed once on {G}, a faint pad swelling in behind them under an octave halo.',
    preset: 'concourse-steel-let-ring',
    then: [lift(8)],
    ...played(
      10,
      [
        [0, 6, 43],
        [0, 6, 50],
        [0, 6, 55],
        [0, 6, 59],
        [0, 6, 62],
        [0, 6, 67],
      ],
      2.5,
    ),
  },
  {
    n: 75,
    id: 'beating-bells-e',
    name: 'Beating bells {E}',
    kind: 'oneshot',
    description:
      'One inharmonic FM bell on {E} whose detuned halves beat slowly from side to side, in a wide space.',
    preset: 'concourse-beating-bells',
    set: { detune: 6 },
    effects: [expanse({ decay: 9, highCut: 5000, mix: 0.3 })],
    ...played(12, [[0, 6, 64]], 3),
  },
  {
    n: 76,
    id: 'backwards-gong-d',
    name: 'Backwards gong {D}',
    kind: 'oneshot',
    description:
      'One stroke on a large gong on {D}, heard backwards as well as forwards, in a long hall.',
    preset: 'concourse-backwards-gong',
    effects: [
      {
        deviceId: 'reverse-delay',
        params: { time: 3000, feedback: 0.2, smooth: 0.7, tone: 4000, spread: 0.2, mix: 0.4 },
      },
      hall('Cathedral', 0.35),
    ],
    ...played(12, [[0, 8, 50]], 3),
  },
  // Phrases: a few notes in free time, ending or coming round.
  {
    n: 77,
    id: 'unequal-loops-am',
    name: 'Unequal loops {A}m',
    kind: 'melodic',
    description:
      'Five soft tine notes falling through {A} minor on two tape loops of unequal length; it comes round.',
    preset: 'concourse-unequal-loops',
    ...cycled(8, [
      [0, 1.4, 69],
      [1.31, 1.2, 64],
      [2.47, 1.6, 60],
      [4.12, 1.1, 57],
      [5.63, 1.9, 52],
    ]),
  },
  {
    n: 78,
    id: 'late-arrival-dm',
    name: 'Late arrival {D}m',
    kind: 'melodic',
    description:
      'Dark round tines asking a question in {D} minor into a two-second tape delay; it comes round.',
    preset: 'concourse-late-arrival',
    ...cycled(8, [
      [0, 1.5, 50, 0.7],
      [0.05, 1.5, 57, 0.6],
      [1.4, 1.2, 65],
      [3.7, 1.4, 64],
      [5.3, 1.8, 60],
    ]),
  },
  {
    n: 79,
    id: 'chime-loops-g',
    name: 'Chime loops {G}',
    kind: 'melodic',
    description:
      'Short glass chimes scattered high over {G} on two tape loops that slip out of step; it comes round.',
    preset: 'concourse-chime-loops',
    ...cycled(8, [
      [0, 0.4, 79],
      [0.93, 0.4, 86],
      [2.21, 0.4, 83],
      [3.02, 0.4, 88],
      [4.87, 0.4, 81],
      [5.52, 0.4, 86],
    ]),
  },
  {
    n: 80,
    id: 'silk-string-loops-em',
    name: 'Silk string loops {E}m',
    kind: 'melodic',
    description:
      'Soft silk strings rising from a low {E} and leaning back, on two unequal loops; it comes round.',
    preset: 'concourse-silk-string-loops',
    ...cycled(8, [
      [0, 2, 52, 0.7],
      [1.12, 1.5, 59],
      [2.03, 1.5, 64],
      [3.44, 1.8, 67],
      [4.81, 1.6, 65],
      [5.9, 1.5, 64],
    ]),
  },
  {
    n: 81,
    id: 'slowed-handpan-loop-dm',
    name: 'Slowed handpan loop {D}m',
    kind: 'melodic',
    description:
      'A handpan in {D} minor slowed to half speed and dulled by tape, kept turning on a loop; it comes round.',
    preset: 'concourse-slowed-handpan-loop',
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { length: 8000 / 3, jitter: 0, highCut: 4500 },
      },
      tape({ wow: 0.2, tone: 0.35 }),
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 4.1, feedback: 0.65, wear: 0.5, mix: 0.4 },
      },
    ],
    ...cycled(
      8,
      [
        [0, 1.5, 50, 0.75],
        [0.82, 1, 57, 0.6],
        [1.9, 1.2, 60, 0.65],
        [3.07, 1, 65, 0.6],
        [4.4, 1.4, 62, 0.7],
        [5.33, 1, 57, 0.6],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 82,
    id: 'departure-board-am',
    name: 'Departure board {A}m',
    kind: 'melodic',
    description:
      'Short soft synth notes opening upward through {A} minor, kept going by a long tape delay; it comes round.',
    preset: 'concourse-departure-board',
    ...cycled(8, [
      [0, 0.3, 57],
      [0.71, 0.3, 64],
      [1.58, 0.3, 69],
      [2.84, 0.3, 72],
      [4.33, 0.3, 76],
      [5.41, 0.3, 71],
    ]),
    loopFold: 'power',
  },
  {
    n: 83,
    id: 'bowl-and-return-dm',
    name: 'Bowls and return {D}m',
    kind: 'melodic',
    description:
      'Three struck bronze bowls on {D}, {A} and {F}, a long tape delay handing each back darker; it comes round.',
    preset: 'concourse-bowl-and-return',
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 1650,
          feedback: 0.6,
          heads: 1,
          wow: 0.3,
          flutter: 0.1,
          drive: 0.2,
          highCut: 3000,
          spread: 0.7,
          mix: 0.4,
        },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3, breathRate: 0.25 } },
    ],
    ...cycled(8, [
      [0, 1, 50],
      [2.37, 1, 57],
      [4.78, 1, 53],
    ]),
  },
  {
    n: 84,
    id: 'celesta-held-c',
    name: 'Celesta held {C}',
    kind: 'melodic',
    description:
      'A celesta stepping down from a high {C} and back up, each note caught and held; it comes round.',
    preset: 'concourse-celesta-held',
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Sustain pedal',
        params: { sensitivity: 0.75, decay: 5, mix: 0.3 },
      },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { decay: 7, mix: 0.3 } },
      narrow,
    ],
    ...cycled(8, [
      [0, 0.6, 84],
      [0.78, 0.6, 79],
      [1.73, 0.6, 76],
      [3.35, 0.8, 72],
      [4.52, 0.6, 74],
      [5.6, 0.9, 79],
    ]),
  },
  {
    n: 85,
    id: 'atrium-harp-round-f',
    name: 'Atrium harp round {F}',
    kind: 'melodic',
    description:
      'A harp arpeggio opening upward over {F} lydian, strings ringing on behind it; it comes round.',
    preset: 'concourse-atrium-harp',
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { decay: 6, mix: 0.4 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 7, mix: 0.35, breathRate: 0.25 },
      },
    ],
    ...cycled(8, [
      [0, 2, 53, 0.7],
      [0.86, 1.6, 60],
      [1.59, 1.6, 64],
      [2.77, 1.8, 69],
      [4.02, 1.6, 71],
      [5.48, 2, 76],
    ]),
  },
  {
    n: 86,
    id: 'slowed-piano-loop-c',
    name: 'Slowed piano loop {C}',
    kind: 'melodic',
    description:
      'Four piano notes over {C} slowed to half speed and laid on a six-second tape loop; it comes round.',
    preset: 'concourse-slowed-piano-loop',
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { length: 3000, jitter: 0, highCut: 6000 },
      },
      {
        deviceId: 'tape-loop',
        preset: 'Long horizon',
        params: { length: 5.9, feedback: 0.65, wear: 0.45, mix: 0.4 },
      },
      hall('Hall', 0.3),
    ],
    // The half-speed heads turn every 1.5 s from the first stroke: one near the middle of a turn keeps
    // its attack. The first stroke comes after the fold, so the fold lies in the tail.
    ...cycled(12, [
      [0.4, 2, 60, 0.9],
      [2.85, 2, 67, 0.9],
      [5.9, 2, 64, 0.9],
      [8.4, 2, 62, 0.85],
    ]),
  },
  {
    n: 87,
    id: 'neck-pickup-round-g',
    name: 'Neck pickup round {G}',
    kind: 'melodic',
    description:
      'Clean neck-pickup notes circling {G} with a few dark repeats and a spring tank behind them; it comes round.',
    preset: 'concourse-neck-pickup-echoes',
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener' },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 520, feedback: 0.25, mix: 0.18 },
      },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
    ...cycled(8, [
      [0, 1, 55],
      [0.87, 1, 62],
      [1.93, 1, 59],
      [3.36, 1.5, 67],
      [5.02, 1, 64],
    ]),
  },
  {
    n: 88,
    id: 'chance-mallets-c',
    name: 'Chance mallets {C}',
    kind: 'melodic',
    description:
      'Soft folded mallet tones wandering over {C}, each differing by chance, with faint tape echoes; it rings out.',
    preset: 'concourse-chance-mallets',
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 1300,
          feedback: 0.5,
          heads: 3,
          wow: 0.3,
          highCut: 3500,
          spread: 0.6,
          mix: 0.07,
        },
      },
      hall('Hall', 0.35),
    ],
    ...played(
      8,
      [
        [0, 0.8, 60],
        [0.64, 0.8, 67],
        [1.71, 0.8, 64],
        [2.6, 0.8, 72],
        [4.15, 1, 69],
      ],
      2,
    ),
  },
  {
    n: 89,
    id: 'chimes-by-chance-loop',
    name: 'Chimes by chance',
    kind: 'melodic',
    description:
      'Wind chimes rung by chance in a breeze, caught on a slow tape loop in a long room.',
    preset: 'concourse-chimes-by-chance',
    then: [lift(12), narrow],
    ...looped(16, 6, 3, [60]),
  },
  {
    n: 90,
    id: 'unattended-piano-c',
    name: 'Unattended phrase {C}',
    kind: 'melodic',
    description:
      'A soft upright asks and answers over a low {C}, heard across a hard, empty hall; it rings out.',
    preset: 'concourse-unattended-piano',
    ...played(
      10,
      [
        [0, 3.2, 48, 0.55],
        [0.06, 3.2, 55, 0.45],
        [1.21, 1.8, 64, 0.9],
        [2.14, 1.5, 62, 0.85],
        [3.38, 2.6, 67, 0.95],
        [5.12, 2.4, 60, 0.8],
      ],
      2,
    ),
  },
  {
    n: 91,
    id: 'slow-steel-slides-a',
    name: 'Slow steel slides {A}',
    kind: 'melodic',
    description:
      'A lap steel climbs from {A} and slides back a third at the top, through a bar vibrato, a three-head echo and a spring.',
    preset: 'concourse-slow-steel-slides',
    set: { swell: 0 },
    // Four notes picked apart at uneven distances, then one that overlaps the last and bends it down.
    ...played(
      10,
      [
        [0, 1.6, 57],
        [1.9, 1, 60],
        [3.16, 2.1, 64],
        [5.5, 1.7, 67],
        [6.94, 1.2, 64],
      ],
      2.5,
    ),
  },
  {
    n: 92,
    id: 'sliding-bass-line-d',
    name: 'Sliding bass line {D}',
    kind: 'melodic',
    description:
      'A round bass slides from a low {D} up to {A} and settles back by step; it rings out.',
    preset: 'concourse-sliding-bass',
    ...played(
      8,
      [
        [0, 1.3, 38],
        [1.2, 1.2, 45],
        [2.5, 1.7, 43],
        [4.3, 2.2, 41],
      ],
      1,
    ),
  },
  {
    n: 93,
    id: 'tongue-drum-phrase-am',
    name: 'Tongue drum phrase {A}m',
    kind: 'melodic',
    description:
      'A steel tongue drum circling {A} minor, an echo returning earlier notes, some backwards; it rings out.',
    preset: 'concourse-tongue-drum-memory',
    ...played(
      10,
      [
        [0, 1, 57, 0.75],
        [0.73, 1, 64, 0.6],
        [1.62, 1, 60, 0.65],
        [2.9, 1.5, 62, 0.6],
        [4.3, 2, 57, 0.7],
      ],
      2.5,
    ),
  },
  {
    n: 94,
    id: 'backwards-piano-em',
    name: 'Backwards piano {E}m',
    kind: 'melodic',
    description:
      'Piano notes of {E} minor, each followed by itself turned round on tape, swelling up to where its hammer was.',
    preset: 'concourse-backwards-piano',
    // As much of the piano as of its reverse: the four strokes are heard in every key.
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Slow swells',
        params: { time: 1800, feedback: 0.15, smooth: 0.8, mix: 0.5 },
      },
      tape({ hiss: 0.1 }),
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    ...played(
      12,
      [
        [0, 1.5, 52, 0.8],
        [1.4, 1.5, 59, 0.8],
        [2.9, 1.5, 64, 0.85],
        [4.6, 2, 67, 0.9],
      ],
      3,
    ),
  },
  {
    n: 95,
    id: 'slowed-nylon-phrase-c',
    name: 'Slowed nylon phrase {C}',
    kind: 'melodic',
    description:
      'A nylon guitar climbs a chord of {C} and steps back, slowed to half speed on tape; it rings out.',
    preset: 'concourse-slowed-nylon',
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { length: 2800, mix: 0.8, spread: 0.2 },
      },
      tape({ wow: 0.35 }),
      hall('Hall', 0.3),
    ],
    ...played(
      10,
      [
        [0, 2, 48, 0.6],
        [0.87, 1.5, 55, 0.6],
        [1.93, 1.5, 60, 0.65],
        [3.1, 2, 64, 0.7],
        [4.6, 2.5, 62, 0.65],
      ],
      2.5,
    ),
  },
  {
    n: 96,
    id: 'still-vibraphone-phrase-g',
    name: 'Still vibes phrase {G}',
    kind: 'melodic',
    description:
      'Vibraphone bars with the motor off climb from {G} to its third and lean back; it rings out in a hall.',
    preset: 'concourse-still-vibraphone',
    ...played(
      10,
      [
        [0, 3, 55, 0.7],
        [0.9, 2.5, 62, 0.6],
        [1.7, 2.5, 67, 0.65],
        [3.2, 3, 71, 0.7],
        [4.9, 3, 69, 0.6],
      ],
      2,
    ),
  },
  {
    n: 97,
    id: 'dark-mallet-phrase-f',
    name: 'Dark mallet phrase {F}',
    kind: 'melodic',
    description:
      'Three dark FM mallet notes far apart, {F}, {C} and {A}, in a hall with a long dull tail; it rings out.',
    preset: 'concourse-dark-mallet',
    ...played(
      10,
      [
        [0, 1.5, 41],
        [1.9, 1.5, 48],
        [3.6, 2, 45],
      ],
      2.5,
    ),
  },
  {
    n: 98,
    id: 'prepared-piano-phrase-d',
    name: 'Prepared piano phrase {D}',
    kind: 'melodic',
    description:
      'Short stiff notes of a prepared piano hopping over {D} minor with a dotted tape echo; it rings out.',
    preset: 'concourse-prepared-piano',
    ...played(
      8,
      [
        [0, 0.3, 62],
        [0.52, 0.3, 69],
        [1.37, 0.3, 65],
        [2.05, 0.3, 74],
        [3.3, 0.4, 72],
        [4.1, 0.5, 69],
      ],
      1.5,
    ),
  },
  {
    n: 99,
    id: 'gate-call-chime-e',
    name: 'Gate call chime {E}',
    kind: 'melodic',
    description:
      'Two chime bars, {E} falling to {C}, under a reverb that lifts them an octave; it rings out.',
    preset: 'concourse-boarding-chime',
    ...played(
      7,
      [
        [0, 1, 76],
        [0.9, 1.5, 72],
      ],
      2,
    ),
  },
  {
    n: 100,
    id: 'glass-bell-fall-e',
    name: 'Glass bell fall {E}',
    kind: 'melodic',
    description:
      'Glassy FM bells falling from a high {E}, softly struck, a reverb climbing above them; it rings out.',
    preset: 'concourse-glass-bell-halo',
    ...played(
      11,
      [
        [0, 1, 88],
        [0.71, 1, 84],
        [1.9, 1, 79],
        [3.3, 2, 76],
      ],
      3,
    ),
  },
])
