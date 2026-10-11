// Chord riffs with a progression, and bass lines for under them. Numbers 491 to 502.
// Every one keeps time (`bpm`, ../tempo.ts): four bars at 120 that come round. What every sound here
// is held to is in docs/factory.md.
//
// Three progressions, all on the white keys. The four chords are {A} minor, {F}, {C} and {G}, a bar
// each. The two five one is {D} minor, {G}, {C} and {A} minor in sevenths and ninths, a bar each. The
// two chords are {A} minor seventh for two bars and {E} minor seventh for two. A riff and the bass
// line of the same progression are written to be laid together.
//
// No name here has a note in it, so the chord a sound is written on is its lowest note (`soundDegree`
// in ../vary.ts): the lowest note of every loop is the root of its first chord, {A} or {D}, and the
// other roots lie above it. That is why a bass line here goes up to its {F} and its {G} where a
// player would go down, and why the piano's left hand does.

import { type PatchDevice } from '../../../core/devices/patch'
import { hall, soften } from '../parts'
import { type FactorySound } from '../types'
import { sound, type Stroke } from './recipe'
import { bars, inTime, row, type Row, type RowOptions } from './rhythm'

/**
 * Chords on one row of marks, one for each stroke in turn and round again: a row for every voice,
 * the voices struck together. Every chord has as many notes as the first.
 */
const changes = (
  chords: readonly (readonly number[])[],
  marks: string,
  options?: RowOptions,
): Row[] =>
  chords[0].map((_, voice) =>
    row(
      chords.map((each) => each[voice]),
      marks,
      options,
    ),
  )

/** One thing `count` times over: the chord of a bar for each of its strokes. */
const times = <T>(count: number, each: T): T[] => Array.from({ length: count }, () => each)

/** A small room after an instrument that has none of its own. */
const room = (mix: number): PatchDevice => hall('Room', mix)

/**
 * `bars` for an instrument that does not play the same wave twice (an organ, a string machine, a
 * synthesizer whose oscillators run on): one pass folded over the next is two unrelated stretches,
 * which are folded at equal power.
 */
const loose = (...written: Parameters<typeof bars>): ReturnType<typeof bars> => ({
  ...bars(...written),
  loopFold: 'power',
})

/**
 * The string machine's ensemble sweeps at 0.6 and 6 Hz at a `speed` of 1: at this speed they are
 * 0.5 and 5 Hz, whole turns in a bar, and the speed follows the tempo.
 */
const ENSEMBLE_SPEED = 0.5 / 0.6

/** The strokes of a bass line that plays the same rhythm in every bar: a bar is 2 s at 120. */
const eachBar = (
  roots: readonly number[],
  bar: (root: number, at: number) => readonly Stroke[],
): Stroke[] =>
  roots.flatMap((root, at) =>
    bar(root, at).map(([atSec, ...rest]): Stroke => [2 * at + atSec, ...rest]),
  )

// The four chords, close under a {C} that all four share but the last: right hand only.
const A_MINOR = [60, 64, 69, 72]
const F_MAJOR = [60, 65, 69, 72]
const C_MAJOR = [60, 64, 67, 72]
const G_MAJOR = [59, 62, 67, 71]

// The two five one in sevenths, close over a {D}.
const D_MINOR_7 = [62, 65, 69, 72]
const G_SEVENTH = [62, 65, 67, 71]
const C_MAJOR_7 = [64, 67, 71, 72]
const A_MINOR_7 = [64, 67, 69, 72]

// The two five one with no root, as a keyboard player leaves it to the bass: the third, fifth, seventh
// and ninth of {D} minor, then one or two notes move at a time ({G} takes a thirteenth, {A} minor is
// left a seventh). No two notes of a chord are a semitone apart: two that are beat slowly enough for
// the analysis to hear a second strike where the chord is let go.
const D_MINOR_9 = [53, 57, 60, 64]
const G_THIRTEENTH = [53, 57, 59, 64]
const C_MAJOR_9 = [52, 55, 59, 62]
const A_MINOR_7_OPEN = [52, 55, 60, 64]

// The two chords, from {A} up.
const A_MINOR_7_LOW = [57, 60, 64, 67]
const E_MINOR_7 = [59, 62, 64, 67]

/** The four chords with the piano's left hand under them: a root in the octave from {A} up. */
const PIANO = {
  a: [45, ...A_MINOR],
  f: [53, ...F_MAJOR],
  c: [48, ...C_MAJOR],
  g: [55, ...G_MAJOR],
} as const

/** The four chords as triads from {A} up, for the organ: three notes are the whole of a short stab. */
const ORGAN = [
  [57, 60, 64],
  [57, 60, 65],
  [60, 64, 67],
  [59, 62, 67],
]

const RIFFS: readonly FactorySound[] = [
  sound({
    id: 'house-piano-riff',
    number: 491,
    name: 'Piano house riff',
    kind: 'beat',
    description:
      'A bare piano stabs {A} minor, {F}, {C} and {G} in a pushed house rhythm, the next chord coming early on the last stab of each bar.',
    // The brightest the felt piano gives: no felt, the hardest hammers. Its sympathetic strings and its
    // own room ring on from chord to chord, so both are off and a room follows it.
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        felt: 0,
        hardness: 1,
        thump: 0.2,
        action: 0.1,
        grit: 0,
        resonance: 0,
        damper: 1,
        reverbMix: 0,
        width: 0.6,
      },
    },
    effects: [room(0.1)],
    // Five stabs to the bar, three, three, four, three and three sixteenths apart. The fifth is the
    // chord of the bar to come, three sixteenths ahead of it.
    ...bars(
      4,
      changes(
        [
          ...times(4, PIANO.a),
          ...times(5, PIANO.f),
          ...times(5, PIANO.c),
          ...times(5, PIANO.g),
          PIANO.a,
        ],
        'X..o ..x. ..o. .X..',
        { hold: 0.9 },
      ),
    ),
  }),
  sound({
    id: 'house-organ-riff',
    number: 492,
    name: 'Organ house riff',
    kind: 'beat',
    description:
      'Short tonewheel organ stabs on the offbeats with a sixteenth pickup, a bar each of {A} minor, {F}, {C} and {G}, for house.',
    // The bank's tonewheel setting (flutes that speak at once) with a fifteenth for its twelfth: over
    // the {B} of the {G} chord a twelfth is a note the key does not have. The vibrato is half dry,
    // which is a chorus, and goes round three times a beat.
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: {
        sub: 0.6,
        octave: 0.55,
        twelfth: 0,
        fifteenth: 0.25,
        reed: 0.1,
        celeste: 0,
        breath: 0,
        bellows: 0,
        tremulant: 0,
        attack: 0.005,
        release: 0.04,
        tone: 5000,
        volume: -9.5,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        params: {
          mode: 3,
          rate: 6,
          depth: 0.3,
          shape: 0,
          phase: 90,
          drift: 0,
          smooth: 0.2,
          mix: 0.5,
        },
      },
      room(0.2),
    ],
    // Four stabs on the offbeats, and a soft one a sixteenth ahead of the last.
    ...loose(4, [
      ...changes(
        ORGAN.flatMap((each) => times(4, each)),
        '..x. ..x. ..x. ..X.',
        { hold: 1.3 },
      ),
      ...changes(ORGAN, '.... .... .... .o..', { hold: 0.6 }),
    ]),
  }),
  sound({
    id: 'house-tine-chords',
    number: 493,
    name: 'Tine house chords',
    kind: 'beat',
    description:
      'A soft electric piano plays ninths on {D} minor, {G} and {C} and a seventh on {A} minor, one held and two short answers a bar, for house.',
    // The amplifier's own tremolo keeps no time: it is off, and a slow pan after it goes round once a beat.
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: {
        bell: 0.4,
        bark: 0.3,
        decay: 1,
        release: 0.2,
        hardness: 0.6,
        tremolo: 0,
        tone: 0.5,
        drive: 0.15,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        params: { mode: 1, rate: 2, depth: 0.3, shape: 0, drift: 0, smooth: 0.5, mix: 1 },
      },
      room(0.2),
    ],
    // The left hand plays one note in the loop: the {D} under the first chord, which is the note the
    // sound stands on. The other three chords have no root. The two answers are laid back by 10 ms.
    ...bars(4, [
      row(50, `x${'.'.repeat(63)}`, { hold: 7 }),
      ...changes([D_MINOR_9, G_THIRTEENTH, C_MAJOR_9, A_MINOR_7_OPEN], 'x... .... .... ....', {
        hold: 7,
      }),
      ...changes(
        [D_MINOR_9, G_THIRTEENTH, C_MAJOR_9, A_MINOR_7_OPEN].flatMap((each) => times(2, each)),
        '.... .... ..x. ..o.',
        { hold: 1.5, lateSec: 0.01 },
      ),
    ]),
  }),
  sound({
    id: 'house-pumping-pad',
    number: 494,
    name: 'Pumping pad chords',
    kind: 'beat',
    description:
      'A sawtooth pad on {A} minor, {F}, {C} and {G} that drops out on every beat, as if a house kick pushed it, and comes back brightening.',
    // The pad is silent for the first sixteenth of every beat and is struck after it, then a filter
    // opens until it is let go just before the next beat. The strike is quick: the analysis hears no
    // hit in an attack of a tenth of a second and calls the loop a texture, and only a beat or a phrase
    // keeps time. One voice to a note and nothing of the synthesizer's own moving (its LFOs keep no
    // time), so the level holds still after the strike and every one of the sixteen is heard as a hit.
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: {
        osc2Fine: 6,
        cutoff: 600,
        keyTrack: 0,
        filterEnvAmount: 0.35,
        filterAttack: 0.4,
        filterDecay: 0.3,
        filterSustain: 1,
        filterRelease: 0.05,
        ampAttack: 0.01,
        ampDecay: 0.3,
        ampSustain: 1,
        ampRelease: 0.04,
        lfo1Amount: 0,
        lfo2Amount: 0,
        unisonVoices: 1,
      },
    },
    effects: [
      soften(8),
      // A copy a few cents sharp on the left and one flat on the right, held still: the width the one voice has not.
      {
        deviceId: 'stereo-detune',
        params: {
          detune: 9,
          delay: 14,
          drift: 0,
          feedback: 0,
          focus: 180,
          tone: 10000,
          width: 1,
          mix: 0.36,
        },
      },
      room(0.12),
    ],
    ...bars(
      4,
      changes(
        [[57, 64, 69, 72], [57, 65, 69, 72], C_MAJOR, G_MAJOR].flatMap((each) => times(4, each)),
        '.X...x...x...x..',
        { hold: 2.6 },
      ),
    ),
  }),
  sound({
    id: 'house-dub-chords',
    number: 495,
    name: 'Dub chord changes',
    kind: 'beat',
    description:
      'A dark filtered stab of {A} minor seventh on the and of two into a dotted eighth echo, then {E} minor seventh, for dub house.',
    // Two sawtooths a few cents apart through a filter that shuts in a quarter of a second. The echo
    // is three sixteenths long, so its repeats cross the beat, and two passes are dropped: the loop
    // starts with the last echoes of {E} minor in it.
    instrument: {
      deviceId: 'ember',
      preset: 'Init',
      params: {
        osc2Fine: 9,
        oscMix: 0.5,
        filterSlope: 1,
        cutoff: 500,
        resonance: 0.2,
        filterEnvAmount: 0.45,
        filterAttack: 0.001,
        filterDecay: 0.25,
        filterSustain: 0.15,
        filterRelease: 0.15,
        ampAttack: 0.003,
        ampDecay: 0.4,
        ampSustain: 0.5,
        ampRelease: 0.12,
        volume: -6,
      },
    },
    effects: [
      soften(23),
      {
        deviceId: 'analog-delay',
        params: {
          time: 375,
          feedback: 0.6,
          modDepth: 0.1,
          modRate: 0.5,
          tone: 1800,
          age: 0.2,
          spread: 0.3,
          mix: 0.5,
        },
      },
      room(0.25),
    ],
    // One stab to a chord, and two bars of its echoes: a stab in every bar lands a sixteenth after an
    // echo of the one before, and the analysis then finds no pulse in some keys.
    ...loose(
      4,
      changes([A_MINOR_7_LOW, E_MINOR_7], `.... ..x. .... ....${'.'.repeat(16)}`, { hold: 1.5 }),
      { passes: 2 },
    ),
  }),
  sound({
    id: 'house-pluck-run',
    number: 496,
    name: 'Pluck chord run',
    kind: 'beat',
    description:
      'A woody folded pluck through a gate that shuts runs sixteenth notes up and down {A} minor, {F}, {C} and {G}, with a short echo, for house.',
    // Every strike pushes the folder up, so a note starts with its overtones and loses them as the
    // gate closes. No chance and no drift: a round is the same notes again.
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: {
        fold: 0.35,
        symmetry: 0.35,
        fm: 0.05,
        ratio: 3,
        timbreEnv: 0.35,
        attack: 0.003,
        decay: 0.4,
        sustain: 0,
        colour: 0.55,
        chance: 0,
        drift: 0,
        volume: -9,
      },
    },
    effects: [
      soften(21),
      {
        deviceId: 'analog-delay',
        params: {
          time: 375,
          feedback: 0.3,
          modDepth: 0,
          tone: 3000,
          age: 0.1,
          spread: 0.4,
          mix: 0.25,
        },
      },
      room(0.2),
    ],
    // Eight notes up the chord and back, twice a bar.
    ...bars(4, [
      row(
        [
          [57, 60, 64, 69, 72, 69, 64, 60],
          [57, 60, 65, 69, 72, 69, 65, 60],
          [60, 64, 67, 72, 76, 72, 67, 64],
          [59, 62, 67, 71, 74, 71, 67, 62],
        ].flatMap((run) => [...run, ...run]),
        'xoxo xoxo xoxo xoxo',
        { hold: 0.8 },
      ),
    ]),
  }),
  sound({
    id: 'house-string-stabs',
    number: 497,
    name: 'String stab changes',
    kind: 'beat',
    description:
      'Short string machine stabs, mostly off the beat, on {D} minor seventh, {G} seventh, {C} major seventh and {A} minor seventh, for house.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: {
        attack: 0.01,
        release: 0.1,
        low: 0.2,
        high: 0.5,
        tone: 5000,
        ensemble: 0.7,
        speed: ENSEMBLE_SPEED,
        drift: 0,
        width: 0.7,
        volume: -3,
      },
    },
    effects: [soften(10), room(0.2)],
    // Stabs on the and of one and the and of two, on four and softly on its and. All are on eighths,
    // so the analysis finds the pulse at any tempo, and short, so the last two are heard apart.
    ...loose(
      4,
      changes(
        [D_MINOR_7, G_SEVENTH, C_MAJOR_7, A_MINOR_7].flatMap((each) => times(4, each)),
        '..x. ..X. .... x.o.',
        { hold: 1.2 },
      ),
    ),
  }),
  sound({
    id: 'house-night-tines',
    number: 498,
    name: 'Late night tines',
    kind: 'beat',
    description:
      'A slow dark electric piano plays {A} minor seventh, then {E} minor seventh, with two notes after each, into a long tape echo for late house.',
    // A steady transport: wow and flutter keep no time. The echo is a dotted quarter, and two passes
    // are dropped so the loop starts with the echoes of its end in it.
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: {
        bell: 0.2,
        bark: 0.2,
        decay: 1.5,
        release: 0.6,
        hardness: 0.4,
        tremolo: 0,
        tone: 0.35,
        drive: 0.1,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 750,
          feedback: 0.5,
          heads: 0,
          wow: 0,
          flutter: 0,
          drive: 0.25,
          lowCut: 150,
          highCut: 3000,
          spread: 0.4,
          mix: 0.4,
        },
      },
      room(0.25),
    ],
    // The answers are the two notes both chords have, so their echoes sit in either.
    ...inTime(
      8,
      [
        ...[45, 55, 60, 64].map((note): Stroke => [0, 1.6, note, 0.75]),
        [3, 0.4, 64, 0.55],
        [3.5, 0.6, 67, 0.6],
        ...[52, 55, 59, 62].map((note): Stroke => [4, 1.6, note, 0.7]),
        [7, 0.4, 67, 0.55],
        [7.5, 0.4, 64, 0.5],
      ],
      { passes: 2, crossfadeSec: 0.03 },
    ),
  }),
]

// Every note of a bass line is at or under 52, the {E} below middle {C}: the app files a sound under
// its basses only then. Every instrument parameter is written out, as in the other bass lines.
const BASS_LINES: readonly FactorySound[] = [
  sound({
    id: 'house-offbeat-bass',
    number: 499,
    name: 'Four chord offbeat bass',
    kind: 'beat',
    description:
      'A driven sine bass on every offbeat and never on the beat, a bar each on {A}, {F}, {C} and {G}, to answer a house kick; it comes round.',
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Dub weight',
      params: {
        shape: 0.3,
        harmonics: 0.35,
        drop: 3,
        fall: 30,
        attack: 0.008,
        decay: 1.5,
        release: 0.08,
        drive: 0.5,
        glide: 0,
        volume: -8,
      },
    },
    effects: [room(0.08)],
    ...inTime(
      8,
      eachBar([33, 41, 36, 43], (root) => [
        [0.25, 0.2, root, 0.9],
        [0.75, 0.2, root, 0.6],
        [1.25, 0.2, root, 0.75],
        [1.75, 0.2, root, 0.6],
      ]),
      { crossfadeSec: 0.2 },
    ),
  }),
  sound({
    id: 'house-rolling-bass',
    number: 500,
    name: 'Four chord rolling bass',
    kind: 'beat',
    description:
      'A rubbery FM bass rolls in eighth notes on {A}, {F}, {C} and {G}, a bar each, root and fifth, for house; it comes round.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Rubber bass',
      params: {
        ratio: 1,
        depth: 0.6,
        bite: 0.15,
        body: 0.7,
        feedback: 0.15,
        sub: 0,
        decay: 0.6,
        release: 0.06,
        glide: 0,
        volume: -8,
      },
    },
    effects: [soften(17), room(0.08)],
    // Root, root, fifth, twice, the root again, and a step towards the root of the next bar.
    ...inTime(
      8,
      eachBar([33, 41, 36, 43], (root, at) =>
        [root, root, root + 7, root, root, root + 7, root, [40, 38, 41, 35][at]].map(
          (note, eighth): Stroke =>
            // The last note of the round is let go early: the next round then starts from rest.
            [
              eighth * 0.25,
              at === 3 && eighth === 7 ? 0.12 : 0.2,
              note,
              [0.9, 0.6, 0.7, 0.6, 0.8, 0.6, 0.7, 0.6][eighth],
            ],
        ),
      ),
    ),
  }),
  sound({
    id: 'house-two-five-bass',
    number: 501,
    name: 'Two five one bass',
    kind: 'beat',
    description:
      'A round fingered electric bass walks from {D} to {G}, {C} and {A}, a bar each, stepping into every root, under house chords; it comes round.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Thumb at the neck',
      params: {
        type: 0,
        touch: 0.15,
        position: 0.38,
        tone: 0.4,
        mute: 0.05,
        sustain: 4,
        release: 0.12,
        growl: 0.1,
        resonance: 0.25,
        volume: -6,
      },
    },
    effects: [soften(14)],
    // Each bar: the root, the root again short, another note of the chord, and one a step from the
    // next root.
    ...inTime(
      8,
      [
        [0, 0.7, 38, 0.9],
        [0.75, 0.2, 38, 0.55],
        [1, 0.45, 45, 0.7],
        [1.5, 0.45, 41, 0.65],
        [2, 0.7, 43, 0.85],
        [2.75, 0.2, 43, 0.55],
        [3, 0.45, 50, 0.7],
        [3.5, 0.45, 47, 0.65],
        [4, 0.7, 48, 0.9],
        [4.75, 0.2, 48, 0.55],
        [5, 0.45, 40, 0.7],
        [5.5, 0.45, 43, 0.65],
        [6, 0.7, 45, 0.85],
        [6.75, 0.2, 45, 0.55],
        [7, 0.45, 43, 0.7],
        [7.5, 0.4, 40, 0.65],
      ],
      { crossfadeSec: 0.2 },
    ),
  }),
  sound({
    id: 'house-deep-bass',
    number: 502,
    name: 'Two chord deep bass',
    kind: 'beat',
    description:
      'A deep sine bass sounds a long fading {A} for two bars, then {E} for two, two short steps before each change, for house; it comes round.',
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Soft sub',
      params: {
        shape: 0.2,
        harmonics: 0.3,
        drop: 0,
        fall: 40,
        attack: 0.03,
        decay: 4,
        release: 0.1,
        drive: 0.25,
        glide: 0,
        volume: -9,
      },
    },
    effects: [room(0.1)],
    // A note is let go quickly and the last one is short: the round then starts from rest at any
    // tempo, and the bass starts every round the same way.
    ...inTime(8, [
      [0, 2.6, 33, 0.85],
      [3, 0.4, 33, 0.6],
      [3.5, 0.4, 36, 0.65],
      [4, 2.6, 40, 0.8],
      [7, 0.4, 40, 0.6],
      [7.5, 0.2, 35, 0.6],
    ]),
  }),
]

export const HOUSE_RIFFS: readonly FactorySound[] = [...RIFFS, ...BASS_LINES]
