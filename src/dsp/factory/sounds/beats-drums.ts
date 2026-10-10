// Drum loops on the drum kit: one drum on a steady row, and small beats of two or three. Numbers 301 to 332.
// Every one keeps time (`bpm`, ../tempo.ts) and is written in rows (./rhythm.ts).
// What every sound here is held to is in docs/factory.md.
//
// Five sorts: one drum alone on a steady row (a short stroke of it is one hit, a long one a clock),
// sparse beats of two to four drums, rows that go against the four, drums into an echo on a division
// of the beat, and kits that are far off or worn.
//
// A kit's notes stay where they are when the key of a piece moves and its `tune` moves instead, so
// `tune` is set for the drums of each loop that have a pitch (the kick and sub, the toms, the tones
// under the snare): they sit on white keys as written. What does that differs by kit, since a kit
// retunes its drums: Soft 5, 0 or -2, Deep 5, 3 or 1, Tight 3, -2 or -4, Paper 1 or -1. It stays between
// -7 and 6, so that no key of a piece turns it round by an octave.

import { type PatchDevice } from '../../../core/devices/patch'
import { hall } from '../parts'
import { type FactorySound } from '../types'
import { sound } from './recipe'
import { bars, KIT, row } from './rhythm'

/** The four characters of the kit (`kit` in cpp/devices/drum-kit/device.json). */
const SOFT = 0
const DEEP = 1
const TIGHT = 2
const PAPER = 3

const kit = (params: Readonly<Record<string, number>>): PatchDevice => ({
  deviceId: 'drum-kit',
  params,
})

/** A small room after the kit, which has none of its own. */
const room = (mix: number): PatchDevice => hall('Room', mix)

// One drum on its own. The first stroke is at the start of the loop.
const ALONE: readonly FactorySound[] = [
  sound({
    id: 'drums-kick-beats',
    number: 301,
    name: 'Soft kick beats',
    kind: 'beat',
    description:
      'A soft round kick on every beat, the first of each four a little firmer, close and dry.',
    instrument: kit({
      kit: SOFT,
      tune: 5,
      length: 0.9,
      punch: 0.3,
      snap: 0.12,
      tone: 0.45,
      variation: 0.15,
    }),
    effects: [],
    ...bars(1, [row(KIT.kick, 'X... x... x... x...')]),
  }),
  sound({
    id: 'drums-sub-swell',
    number: 302,
    name: 'Slow sub pulse',
    kind: 'beat',
    description:
      'A deep sub drum that swells in with no click, once every four beats, and fades slowly towards the next.',
    instrument: kit({ kit: DEEP, tune: 5, length: 2.8, tone: 0.4, variation: 0.1 }),
    effects: [],
    ...bars(4, [row(KIT.sub, 'X... .... .... ....')]),
  }),
  sound({
    id: 'drums-hat-eighths',
    number: 303,
    name: 'Clock hats',
    kind: 'beat',
    description:
      'Short bright closed hats in even eighth notes, loud then soft, ticking like a clock.',
    instrument: kit({
      kit: TIGHT,
      tune: -2,
      length: 0.8,
      snap: 0.5,
      tone: 0.55,
      variation: 0,
      width: 0.3,
    }),
    effects: [],
    ...bars(1, [row(KIT.hat, 'x.o. x.o. x.o. x.-.')]),
  }),
  sound({
    id: 'drums-shaker-sixteenths',
    number: 304,
    name: 'Shaker sixteenths',
    kind: 'beat',
    description:
      'A dry paper shaker in sixteenth notes, leaning on each beat and falling back between.',
    instrument: kit({
      kit: PAPER,
      tune: 1,
      length: 1.1,
      snap: 0.3,
      tone: 0.5,
      variation: 0.35,
      width: 0.5,
    }),
    effects: [],
    ...bars(1, [row(KIT.shaker, 'X-o- x-o- X-o- x-oo')]),
    loopFold: 'power',
  }),
  sound({
    id: 'drums-rim-knock',
    number: 305,
    name: 'Slow rim knock',
    kind: 'beat',
    description:
      'A dry rim knock on every second beat, the second of each pair a little harder, in a small room.',
    instrument: kit({ kit: SOFT, tune: 0, length: 1.2, snap: 0.35, tone: 0.5 }),
    effects: [room(0.14)],
    ...bars(2, [row(KIT.rim, 'x... .... X... ....')]),
  }),
  sound({
    id: 'drums-tick-dotted',
    number: 306,
    name: 'Dotted tick',
    kind: 'beat',
    description:
      'A bright woodblock tick on every third sixteenth note, starting over each time it comes round.',
    instrument: kit({ kit: TIGHT, tune: 3, length: 0.7, snap: 0.7, tone: 0.7, width: 0.6 }),
    effects: [room(0.1)],
    ...bars(1, [row(KIT.tick, 'x..o ..x. .o.. x...')]),
  }),
  sound({
    id: 'drums-brush-strokes',
    number: 307,
    name: 'Slow brush strokes',
    kind: 'beat',
    description:
      'A brush of dull noise with a slow start on every second beat, no two strokes quite alike.',
    instrument: kit({
      kit: SOFT,
      tune: 0,
      length: 1.3,
      snap: 0.05,
      tone: 0.35,
      variation: 0.4,
    }),
    effects: [room(0.1)],
    ...bars(2, [row(KIT.brush, 'x... .... X... ....')]),
    loopFold: 'power',
  }),
  sound({
    id: 'drums-two-toms',
    number: 308,
    name: 'Two toms answering',
    kind: 'beat',
    description:
      'A long low tom and a softer high tom answer each other two beats apart, far off in a long dark hall.',
    instrument: kit({ kit: SOFT, tune: -2, length: 2, punch: 0.5, snap: 0.2, tone: 0.55 }),
    // The lows of the hall die in a second: a tom's own note beating in a long tail reads as more hits.
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 20, crossover: 500, lowDecay: 1, damping: 3000, mix: 0.35 },
      },
    ],
    ...bars(2, [
      row(KIT.lowTom, 'X... .... .... .... x... .... .... ....'),
      row(KIT.highTom, '.... .... x... .... .... .... o... ....'),
    ]),
  }),
]

// Sparse beats of two to four drums.
const SPARSE: readonly FactorySound[] = [
  sound({
    id: 'drums-half-time-snare',
    number: 309,
    name: 'Half-time snare',
    kind: 'beat',
    description:
      'A soft kick on one and a snare a hair late on three, with ghosted hats on the offbeats between.',
    instrument: kit({ kit: SOFT, tune: 5, length: 1.1, punch: 0.35, snap: 0.25, tone: 0.45 }),
    effects: [room(0.12)],
    ...bars(2, [
      row(KIT.kick, 'X... .... .... .... X... .... .... ..o.'),
      row(KIT.snare, '.... .... x... ....', { lateSec: 0.01 }),
      row(KIT.hat, '..-. ..o. ..-. ..o.'),
    ]),
  }),
  sound({
    id: 'drums-heartbeat',
    number: 310,
    name: 'Heartbeat kick',
    kind: 'beat',
    description:
      'A deep kick and a softer low tom an eighth note after it, like a heartbeat, then nothing until it comes again.',
    instrument: kit({ kit: DEEP, tune: 3, length: 1, punch: 0.2, snap: 0.05, tone: 0.35 }),
    effects: [room(0.15)],
    ...bars(2, [row(KIT.kick, 'X... .... .... ....'), row(KIT.lowTom - 12, '..o. .... .... ....')]),
  }),
  sound({
    id: 'drums-kick-brush',
    number: 311,
    name: 'Kick and brush',
    kind: 'beat',
    description:
      'A round kick with no click and a slow dull brush on two and four, played softly in a small room.',
    instrument: kit({
      kit: SOFT,
      tune: 5,
      length: 1.3,
      punch: 0.15,
      snap: 0.05,
      tone: 0.35,
      variation: 0.4,
    }),
    effects: [room(0.12)],
    ...bars(2, [
      row(KIT.kick, 'X... .... ..x. ....'),
      row(KIT.brush, '.... x... .... x... .... x... .... x.-.'),
    ]),
  }),
  sound({
    id: 'drums-card-rim-hats',
    number: 312,
    name: 'Ghost hat beat',
    kind: 'beat',
    description:
      'A short kick like card, a rim knock now off the beat and now on it, and hats ghosted in sixteenth notes, all dry.',
    instrument: kit({ kit: PAPER, tune: 1, length: 1, punch: 0.4, snap: 0.4, tone: 0.5 }),
    effects: [],
    ...bars(2, [
      row(KIT.kick, 'X... .... x... ....'),
      row(KIT.rim, '.... ..x. .... x... .... ..x. .... x..o'),
      row(KIT.hat, '--o- --o- --o- --o-'),
    ]),
  }),
  sound({
    id: 'drums-sub-shaker',
    number: 313,
    name: 'Sub and shaker',
    kind: 'beat',
    description:
      'A deep sub drum once every four beats under a soft shaker in eighth notes that leans on the offbeats.',
    instrument: kit({ kit: DEEP, tune: 3, length: 2.6, snap: 0.2, tone: 0.45, width: 0.5 }),
    effects: [],
    ...bars(1, [row(KIT.sub, 'x... .... .... ....'), row(KIT.shaker, 'x.X. x.X. x.X. x.Xo')]),
  }),
  sound({
    id: 'drums-lazy-shuffle',
    number: 314,
    name: 'Lazy shuffle',
    kind: 'beat',
    description:
      'Kick on one and three, rim on two and four and hats swung all the way to a shuffle, with a ghost between.',
    instrument: kit({ kit: SOFT, tune: -2, length: 1, punch: 0.3, snap: 0.3, tone: 0.5 }),
    effects: [room(0.1)],
    ...bars(2, [
      row(KIT.kick, 'X... x... X..o x...', { per: 8, swing: 1 / 3 }),
      row(KIT.rim, '..x. ..x.', { per: 8 }),
      row(KIT.hat, 'xoxo xoxo', { per: 8, swing: 1 / 3 }),
      row(KIT.hat, '... .-. ... .-.', { per: 12 }),
    ]),
  }),
  sound({
    id: 'drums-three-hits',
    number: 315,
    name: 'Three soft hits',
    kind: 'melodic',
    description:
      'A kick, a rim knock and a low tom, one after another with long gaps between, in a soft room.',
    instrument: kit({ kit: SOFT, tune: 0, length: 1.6, punch: 0.3, snap: 0.2, tone: 0.45 }),
    effects: [room(0.26)],
    ...bars(1, [
      row(KIT.kick, 'x... .... .... ....'),
      row(KIT.rim, '.... ..x. .... ....'),
      row(KIT.lowTom, '.... .... ..x. ....'),
    ]),
  }),
  sound({
    id: 'drums-rim-beat-tom-fill',
    number: 316,
    name: 'Tom fill beat',
    kind: 'beat',
    description:
      'A slow beat of kick, rim on three and offbeat hats that ends every fourth time on two soft toms.',
    instrument: kit({ kit: SOFT, tune: 5, length: 1.2, punch: 0.35, snap: 0.3, tone: 0.5 }),
    effects: [room(0.12)],
    ...bars(4, [
      row(
        KIT.kick,
        'X... .... ..o. .... X... .... ..o. .... X... .... ..o. .... X... .... .... ....',
      ),
      row(KIT.rim, '.... .... x... ....'),
      row(
        KIT.hat,
        '..-. ..o. ..-. ..o. ..-. ..o. ..-. ..o. ..-. ..o. ..-. ..o. ..-. ..o. .... ....',
      ),
      row(
        KIT.highTom,
        '.... .... .... .... .... .... .... .... .... .... .... .... .... .... .... o...',
      ),
      row(
        KIT.lowTom,
        '.... .... .... .... .... .... .... .... .... .... .... .... .... .... .... ..o.',
      ),
    ]),
  }),
  sound({
    id: 'drums-quiet-four',
    number: 317,
    name: 'Quiet dance beat',
    kind: 'beat',
    description:
      'A tight kick on every beat and an open hat on every offbeat that the next beat shuts, with one kick left out.',
    instrument: kit({ kit: TIGHT, tune: -2, length: 1, punch: 0.4, snap: 0.35, tone: 0.5 }),
    effects: [room(0.08)],
    ...bars(4, [
      row(
        KIT.kick,
        'X... x... x... x... X... x... x... x... X... x... x... x... .... x... x... x...',
      ),
      row(KIT.hat, '-... -... -... -...'),
      row(KIT.open, '..o. ..o. ..o. ..o.'),
    ]),
  }),
  sound({
    id: 'drums-broken-two-step',
    number: 318,
    name: 'Broken two-step',
    kind: 'beat',
    description:
      'A tight kick that skips the third beat, a soft snare on two and four and hats on the offbeats.',
    instrument: kit({ kit: TIGHT, tune: 3, length: 0.9, punch: 0.45, snap: 0.3, tone: 0.5 }),
    effects: [room(0.1)],
    ...bars(2, [
      row(KIT.kick, 'X... .... ..x. .... X... ...o ..x. ....'),
      row(KIT.snare, '.... x... .... x... .... x... .... x..-'),
      row(KIT.hat, '..o. ..o. ..o. ..o-'),
    ]),
  }),
]

// Rows that go against the four.
const AGAINST: readonly FactorySound[] = [
  sound({
    id: 'drums-hats-in-threes',
    number: 319,
    name: 'Hats in threes',
    kind: 'beat',
    description:
      'A soft kick on every beat under closed hats in triplets, three to each kick, loud then ghosted then soft.',
    instrument: kit({ kit: SOFT, tune: 0, length: 1, punch: 0.3, snap: 0.35, tone: 0.5 }),
    effects: [room(0.08)],
    ...bars(1, [row(KIT.kick, 'X... x... x... x...'), row(KIT.hat, 'x-o', { per: 12 })]),
  }),
  sound({
    id: 'drums-five-step-tick',
    number: 320,
    name: 'Five-step tick',
    kind: 'beat',
    description:
      'A woodblock tick every five sixteenth notes, now hard and now soft, walking across a tight kick on every beat.',
    instrument: kit({ kit: TIGHT, tune: -2, length: 0.9, punch: 0.4, snap: 0.5, tone: 0.6 }),
    effects: [room(0.12)],
    ...bars(4, [
      row(KIT.kick, 'x... o... o... o...'),
      row(KIT.tick, `${'x....o....'.repeat(6)}x...`),
    ]),
  }),
  sound({
    id: 'drums-triplet-toms',
    number: 321,
    name: 'Triplet toms',
    kind: 'beat',
    description:
      'Deep toms in slow triplets, one low then two high, against a kick on one and a rim knock on two and four.',
    instrument: kit({ kit: DEEP, tune: 3, length: 0.9, punch: 0.3, snap: 0.25, tone: 0.5 }),
    effects: [room(0.14)],
    ...bars(1, [
      row(KIT.kick, 'X... .... .... ....'),
      row(KIT.rim, '.... o... .... o...'),
      row([KIT.lowTom, KIT.highTom, KIT.highTom], 'xoo', { per: 6 }),
    ]),
  }),
  sound({
    id: 'drums-seven-step-rim',
    number: 322,
    name: 'Seven-step rim',
    kind: 'beat',
    description:
      'A dry rim figure seven sixteenth notes long, turning against a short kick on one and three and a hat on two and four.',
    instrument: kit({ kit: PAPER, tune: 1, length: 1.1, punch: 0.35, snap: 0.45, tone: 0.55 }),
    effects: [room(0.1)],
    ...bars(4, [
      row(KIT.kick, 'x... .... o... ....'),
      row(KIT.hat, '.... o... .... o...'),
      row(KIT.rim, `${'x..o.x.'.repeat(9)}.`),
    ]),
  }),
  sound({
    id: 'drums-five-against-four',
    number: 323,
    name: 'Five against four',
    kind: 'beat',
    description:
      'Five even woodblock ticks in the time of four beats, over a dry kick on one and a brush on three.',
    instrument: kit({ kit: PAPER, tune: -1, length: 1.2, punch: 0.3, snap: 0.35, tone: 0.55 }),
    effects: [room(0.1)],
    ...bars(2, [
      row(KIT.kick, 'X... .... .... ....'),
      row(KIT.brush, '.... .... o... ....'),
      row(KIT.tick, 'Xoxoo', { per: 5 }),
    ]),
  }),
]

// Into an echo on a division of the beat. Two passes are dropped, so the loop starts with the last
// echoes of the time before in it.
const ECHOED: readonly FactorySound[] = [
  sound({
    id: 'drums-rim-echo',
    number: 324,
    name: 'Rim into echo',
    kind: 'beat',
    description:
      'One rim knock answered by a dark echo on every third sixteenth note that fades before it comes again, in a room.',
    instrument: kit({ kit: SOFT, tune: 0, length: 1.2, snap: 0.4, tone: 0.55 }),
    effects: [
      {
        deviceId: 'analog-delay',
        params: {
          time: 375,
          feedback: 0.5,
          modDepth: 0,
          tone: 4000,
          age: 0.15,
          spread: 0.4,
          mix: 0.45,
        },
      },
      room(0.3),
    ],
    ...bars(1, [row(KIT.rim, 'X... .... .... ....')], { passes: 2 }),
  }),
  sound({
    id: 'drums-tick-tape-echo',
    number: 325,
    name: 'Tape echo tick',
    kind: 'beat',
    description:
      'A bright tick struck once off the beat and a tape echo that repeats it on every offbeat after, each one duller.',
    instrument: kit({ kit: TIGHT, tune: 3, length: 0.8, snap: 0.6, tone: 0.65 }),
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 500,
          feedback: 0.6,
          heads: 0,
          wow: 0,
          flutter: 0,
          drive: 0.2,
          lowCut: 200,
          highCut: 6000,
          spread: 0.5,
          mix: 0.5,
        },
      },
      room(0.3),
    ],
    ...bars(1, [row(KIT.tick, '..X. .... .... ....')], { passes: 2 }),
  }),
  sound({
    id: 'drums-clap-hall',
    number: 326,
    name: 'Long hall clap',
    kind: 'beat',
    description:
      'One soft clap every four beats, a little harder every other time, into a very long dark hall.',
    instrument: kit({ kit: SOFT, tune: 0, length: 1.2, snap: 0.3, tone: 0.5, width: 0.3 }),
    effects: [
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { preDelay: 20, mix: 0.58 } },
    ],
    ...bars(4, [row(KIT.clap, 'X... .... .... .... x... .... .... ....')], { passes: 2 }),
    loopFold: 'power',
  }),
  sound({
    id: 'drums-hat-echo',
    number: 327,
    name: 'Echoing hats',
    kind: 'beat',
    description:
      'A few closed hats into a thin tape echo on every third sixteenth note, so the echoes fill the gaps between them.',
    instrument: kit({ kit: TIGHT, tune: -2, length: 0.9, snap: 0.45, tone: 0.55, width: 0.3 }),
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 375,
          feedback: 0.55,
          heads: 0,
          wow: 0,
          flutter: 0,
          drive: 0.2,
          lowCut: 600,
          highCut: 9000,
          spread: 0.6,
          mix: 0.4,
        },
      },
      room(0.12),
    ],
    ...bars(1, [row(KIT.hat, 'x... x... x... x...')], { passes: 2 }),
  }),
  sound({
    id: 'drums-snare-triplet-echo',
    number: 328,
    name: 'Snare triplet echo',
    kind: 'beat',
    description:
      'A kick on one and a snare on three whose dark echo comes back in quarter-note triplets, in a small room.',
    instrument: kit({ kit: SOFT, tune: 5, length: 1.1, punch: 0.3, snap: 0.3, tone: 0.5 }),
    effects: [
      {
        deviceId: 'analog-delay',
        params: {
          time: 333.333,
          feedback: 0.45,
          modDepth: 0,
          tone: 3200,
          age: 0.15,
          spread: 0.5,
          mix: 0.35,
        },
      },
      room(0.15),
    ],
    ...bars(1, [row(KIT.kick, 'X... .... .... ....'), row(KIT.snare, '.... .... x... ....')], {
      passes: 2,
    }),
  }),
]

// Far off or worn.
const FAR: readonly FactorySound[] = [
  sound({
    id: 'drums-far-kit',
    number: 329,
    name: 'Far hall kit',
    kind: 'beat',
    description:
      'A slow beat of kick, snare on three and a shaker on the offbeats, a long way off in a very large dark space.',
    instrument: kit({ kit: TIGHT, tune: -4, length: 1.2, punch: 0.3, snap: 0.4, tone: 0.45 }),
    effects: [
      {
        deviceId: 'expanse',
        params: {
          mix: 0.75,
          size: 0.8,
          decay: 8,
          density: 1,
          modDepth: 0,
          lowCut: 200,
          highCut: 2500,
        },
      },
    ],
    ...bars(
      2,
      [
        row(KIT.kick, 'X... .... .... .... x... .... ..o. ....'),
        row(KIT.snare, '.... .... x... ....'),
        row(KIT.shaker, '..o. ..o. ..o. ..o.'),
      ],
      { passes: 2 },
    ),
  }),
  sound({
    id: 'drums-paper-tape',
    number: 330,
    name: 'Worn paper kit',
    kind: 'beat',
    description:
      'A dry kit of paper and card playing a plain beat through a worn cassette, dull and a little crushed.',
    instrument: kit({
      kit: PAPER,
      tune: 1,
      length: 0.9,
      punch: 0.35,
      snap: 0.4,
      tone: 0.45,
      drive: 0.3,
      variation: 0.4,
    }),
    effects: [
      {
        deviceId: 'tape',
        params: {
          drive: 0.5,
          wow: 0,
          flutter: 0,
          speed: 3,
          age: 0.3,
          hiss: 0.3,
          bump: 0.5,
          tone: 0.45,
        },
      },
    ],
    ...bars(2, [
      row(KIT.kick, 'X... .... x.o. .... X... ..o. x... ....'),
      row(KIT.snare, '.... x... .... x...'),
      row(KIT.hat, 'x.o. x.o. x.o. x.o.'),
    ]),
  }),
  sound({
    id: 'drums-deep-slow',
    number: 331,
    name: 'Deep slow kit',
    kind: 'beat',
    description:
      'A long dark kick and a dull snare taking turns four beats apart, over a sub drum that rings from each to the next.',
    instrument: kit({
      kit: DEEP,
      tune: 1,
      length: 3.5,
      punch: 0.2,
      snap: 0.15,
      tone: 0.2,
      drive: 0.3,
      width: 0.7,
    }),
    effects: [
      {
        deviceId: 'expanse',
        params: {
          mix: 0.4,
          size: 0.7,
          decay: 6,
          density: 1,
          modDepth: 0,
          lowCut: 400,
          highCut: 2500,
        },
      },
    ],
    ...bars(4, [
      // An octave above the sub: at one pitch the two beat against each other as the kick falls.
      row(
        KIT.kick + 12,
        'X... .... .... .... .... .... .... .... x... .... .... x... .... .... .... ....',
      ),
      row(KIT.sub, 'x... .... .... ....'),
      row(KIT.snare, '.... .... .... .... x... .... .... ....'),
    ]),
  }),
  sound({
    id: 'drums-opening-filter',
    number: 332,
    name: 'Opening filter beat',
    kind: 'beat',
    description:
      'A tight kick, rim and sixteenth-note hats under a filter that opens over four beats and shuts again.',
    instrument: kit({ kit: TIGHT, tune: 3, length: 0.9, punch: 0.4, snap: 0.4, tone: 0.55 }),
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 0,
          cutoffHz: 2000,
          resonance: 1.5,
          driveDb: 0,
          envAmount: 0,
          lfoAmount: 70,
          lfoRateHz: 0.5,
          lfoShape: 2,
          mix: 1,
        },
      },
      room(0.1),
    ],
    ...bars(1, [
      row(KIT.kick, 'X... .... x... ....'),
      row(KIT.rim, '.... x... .... x...'),
      row(KIT.hat, 'xoxo xoxo xoxo xoxo'),
    ]),
  }),
]

export const DRUM_LOOPS: readonly FactorySound[] = [
  ...ALONE,
  ...SPARSE,
  ...AGAINST,
  ...ECHOED,
  ...FAR,
]
