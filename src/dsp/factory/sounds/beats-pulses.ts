// Pulses: a pitched instrument playing a short figure round and round on the beat. Numbers 371 to 394.
// Every one keeps time (`bpm`, ../tempo.ts) and is written in rows (./rhythm.ts).
// What every sound here is held to is in docs/factory.md.
//
// Four sorts, six of each: plain pulses (one or two notes, nearly dry: a clock to lay under a pad),
// figures (a cell of a few notes, some with a row that goes three or five against the four), echoing
// chords (struck once or twice, an echo on a division of the beat doing the rest) and pulses that
// move by something other than new notes (a tremolo that chops, a filter that opens, an accent that walks).

import { type PatchDevice } from '../../../core/devices/patch'
import { hall } from '../parts'
import { type FactorySound } from '../types'
import { sound } from './recipe'
import { bars, row, type Row, type RowOptions } from './rhythm'

/** A chord on one row of marks: a row for each of its notes, struck together. */
const chord = (notes: readonly number[], marks: string, options?: RowOptions): Row[] =>
  notes.map((note) => row(note, marks, options))

/** A figure begun `by` notes late: what the second hand of a canon plays against the first. */
const turned = (notes: readonly number[], by: number): number[] =>
  notes.map((_, at) => notes[(at - by + notes.length) % notes.length])

/** A small room after an instrument that has none of its own. */
const room = (mix: number): PatchDevice => hall('Room', mix)

/** A chord held for the whole of a loop of `count` bars and let go as the next pass strikes it again. */
const held = (notes: readonly number[], count: number): Row[] =>
  chord(notes, `x${'.'.repeat(16 * count - 1)}`, { hold: 16 * count })

/**
 * A tremolo that cuts what is held into strokes, `rate` to the second at 120: a square wave that is
 * open for the first half of each turn, so a stroke starts where a row would put it.
 */
const chop = (rate: number, depth = 1): PatchDevice => ({
  deviceId: 'tremolo',
  params: { mode: 0, rate, depth, shape: 2, phase: 0, drift: 0, smooth: 0.05, mix: 1 },
})

/** A low-pass filter moved by an LFO that goes round with the beat (`lfoRateHz` at 120). */
const sweep = (params: Readonly<Record<string, number>>): PatchDevice => ({
  deviceId: 'auto-filter',
  params: { type: 0, slope: 1, driveDb: 0, envAmount: 0, mix: 1, ...params },
})

const PLAIN: readonly FactorySound[] = [
  sound({
    id: 'pulse-marimba-eighths-e',
    number: 371,
    name: 'Marimba eighths {E}',
    kind: 'beat',
    description:
      'One marimba bar on {E} in steady eighth notes, the beats struck a little harder, in a small room.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.4, decay: 0.7, width: 0 },
    },
    effects: [room(0.12)],
    ...bars(2, [row(64, 'X.o.x.o. x.o.x.o. X.o.x.o. x.o.x.-.')]),
  }),
  sound({
    id: 'pulse-pipe-breaths-f',
    number: 372,
    name: 'Pipe pulse {F}',
    kind: 'beat',
    description:
      'Pan pipes tongue a low {F} in eighth notes that swell and fall back like one long breath.',
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { release: 0.08, breath: 0.25 },
    },
    effects: [room(0.18)],
    ...bars(4, [
      row(53, 'o.o.o.o. o.x.x.x. x.x.X.X. X.X.X.x. x.x.x.x. x.o.o.o. o.o.o.o. o.o.o.o.', {
        hold: 1.2,
      }),
    ]),
  }),
  sound({
    id: 'pulse-tine-offbeats-a',
    number: 373,
    name: 'Tine offbeats {A}',
    kind: 'beat',
    description:
      'An electric piano plays the fifth on {A} short and soft on every offbeat, with nothing on the beat.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { tremolo: 0, release: 0.12, bell: 0.25, tone: 0.4 },
    },
    effects: [room(0.15)],
    ...bars(1, chord([57, 64], '..x. ..o. ..x. ..o.', { hold: 1.5 })),
  }),
  sound({
    id: 'pulse-kalimba-sixteenths-d',
    number: 374,
    name: 'Kalimba sixteenths {D}',
    kind: 'beat',
    description:
      'A single kalimba tine on {D} in even sixteenth notes, every other one lighter, almost dry.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 1.2, detune: 0, spread: 0.2 },
    },
    effects: [room(0.1)],
    ...bars(1, [row(74, 'Xoxo xoxo Xoxo xoxo')]),
  }),
  sound({
    id: 'pulse-tongue-drum-g',
    number: 375,
    name: 'Tongue drum beat {G}',
    kind: 'beat',
    description:
      'A steel tongue drum on a low {G} on every beat, the fifth above answering once before it comes round.',
    // A struck tongue meets what still rings of it: two passes are dropped (see `cycled`).
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 2.5, sympathy: 0.3 },
    },
    effects: [room(0.15)],
    ...bars(
      2,
      [row(55, 'X... x... x... x...'), row(62, '.... .... .... .... .... .... .... ..o.')],
      {
        passes: 2,
      },
    ),
  }),
  sound({
    id: 'pulse-muted-guitar-c',
    number: 376,
    name: 'Muted guitar pulse {C}',
    kind: 'beat',
    description:
      'A muted electric guitar on a low {C} in eighth notes, the octave above answering on the last offbeat.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Muted pattern',
      params: { shimmer: 0, strum: 0, sustain: 2.5, hardness: 0.3 },
    },
    effects: [room(0.14)],
    ...bars(1, [
      row(48, 'X.x. x.x. x.x. x...', { hold: 1.5 }),
      row(60, '.... .... .... ..o.', { hold: 1.5 }),
    ]),
  }),
]

const CANON = [64, 69, 67, 72, 74, 69, 67, 72]
const BROKEN_AM = [45, 52, 60, 64, 67, 64, 60, 52]
const BROKEN_C = [48, 55, 62, 64, 67, 64, 62, 55]

const FIGURES: readonly FactorySound[] = [
  sound({
    id: 'pulse-felt-canon-am',
    number: 377,
    name: 'Felt piano canon {A}m',
    kind: 'beat',
    description:
      'Two hands on a felted piano play one figure of eight notes in {A} minor, the second a step behind and softer.',
    // The piano's own room rings on some notes: a room after it. The felt takes most from a soft high note, so both hands play firmly.
    instrument: { deviceId: 'felt-piano', preset: 'Felt', params: { resonance: 0, reverbMix: 0 } },
    effects: [room(0.2)],
    ...bars(1, [
      row(CANON, 'X.x.x.x. X.x.x.x.', { hold: 1.5 }),
      row(turned(CANON, 1), 'x.o.o.o. x.o.o.o.', { hold: 1.5 }),
    ]),
  }),
  sound({
    id: 'pulse-harp-three-four-a',
    number: 378,
    name: 'Harp three on four {A}',
    kind: 'beat',
    description:
      'A harp keeps four low notes going on {A} and its fifth while three slower ones fall across them from above.',
    // The zither's harp: its pluck is on the stroke, where the harp instrument's comes 10 ms after it.
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { decay: 4, release: 2, strum: 0 },
    },
    effects: [room(0.2)],
    ...bars(4, [
      row([57, 64], 'x...', { hold: 3 }),
      row([76, 72, 69, 74], 'X..', { per: 3, hold: 0.6 }),
    ]),
  }),
  sound({
    id: 'pulse-vibes-five-four-d',
    number: 379,
    name: 'Vibes five on four {D}',
    kind: 'beat',
    description:
      'A vibraphone marks four beats on {D} while five even notes climb and turn above them in the same time.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { mallet: 0.5, decay: 0.8, damper: 0.7, width: 0.3 },
    },
    effects: [room(0.18)],
    ...bars(2, [
      row(62, 'x...', { hold: 2 }),
      row([69, 72, 74, 77, 76, 69, 72, 76, 74, 72], 'Xoxox', { per: 5, hold: 0.5 }),
    ]),
  }),
  sound({
    id: 'pulse-nylon-broken-chord-am',
    number: 380,
    name: 'Nylon broken chord {A}m',
    kind: 'beat',
    description:
      'A nylon guitar breaks {A} minor into sixteenth notes, up and back, then the same shape on {C}.',
    // The hard pluck is on the third beat: on the first, the step into it would be the largest of the loop (a seam).
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { sustain: 3, release: 0.8, strum: 0, shimmer: 0 },
    },
    effects: [room(0.18)],
    ...bars(2, [
      row([...BROKEN_AM, ...BROKEN_AM, ...BROKEN_C, ...BROKEN_C], 'xooo xooo Xooo xooo', {
        hold: 2,
      }),
    ]),
  }),
  sound({
    id: 'pulse-wooden-cell-g',
    number: 381,
    name: 'Wooden cell {G}',
    kind: 'beat',
    description:
      'Woody plucks of a folded tone: four notes in fifths over {G} on a rhythm of seven strokes, so the cell drifts.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { decay: 0.9, chance: 0, drift: 0 },
    },
    effects: [room(0.2)],
    ...bars(4, [row([67, 74, 69, 76], 'X..x ..x. x.x. x.o.', { hold: 1 })]),
  }),
  sound({
    id: 'pulse-koto-triplets-e',
    number: 382,
    name: 'Koto triplets {E}',
    kind: 'beat',
    description:
      'A koto picks six notes of a dark scale on {E} in triplets with two of them left out, so the figure turns.',
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { decay: 2, release: 0.8, strum: 0 },
    },
    effects: [room(0.2)],
    ...bars(2, [row([64, 65, 69, 71, 72, 69], 'Xox.xo xox.o.', { per: 12, hold: 1 })]),
  }),
]

// One chord, struck once or twice; the echo is on a division of the beat and does the rest. A second
// stroke is a whole number of echoes after the first, so the two trains fall together. Two passes
// are dropped, so the loop starts with the last echoes of the time before in it.
const ECHOES: readonly FactorySound[] = [
  sound({
    id: 'pulse-dub-chord-am',
    number: 383,
    name: 'Dub chord {A}m7',
    kind: 'beat',
    description:
      'A soft minor seventh on {A} from a string machine, struck off the beat into a dotted-eighth echo and a room.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { attack: 0.005, release: 0.12, tone: 1500, ensemble: 0.5, drift: 0, width: 0.6 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        params: {
          time: 375,
          feedback: 0.5,
          modDepth: 0.15,
          tone: 2200,
          age: 0.2,
          spread: 0.6,
          mix: 0.4,
        },
      },
      room(0.3),
    ],
    ...bars(2, chord([57, 60, 64, 67], '..x. .... .... .... .... x... .... ....', { hold: 1.2 }), {
      passes: 2,
    }),
  }),
  sound({
    id: 'pulse-tine-echo-dm7',
    number: 384,
    name: 'Tine echo {D}m7',
    kind: 'beat',
    description:
      'An electric piano stabs {D} minor seventh twice and a tape echo answers on every third sixteenth note.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { tremolo: 0, release: 0.1 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 375,
          feedback: 0.45,
          heads: 0,
          wow: 0.1,
          flutter: 0.05,
          drive: 0.3,
          highCut: 4500,
          spread: 0.4,
          mix: 0.4,
        },
      },
      room(0.25),
    ],
    ...bars(2, chord([50, 57, 60, 65], 'X... .... .... .... ..x. .... .... ....', { hold: 1 }), {
      passes: 2,
    }),
  }),
  sound({
    id: 'pulse-organ-stab-em',
    number: 385,
    name: 'Organ stab {E}m',
    kind: 'beat',
    description:
      'A reed organ stabs {E} minor on an offbeat and a quarter-note echo throws it from one side to the other.',
    // No twelfth: over the {B} of the chord it is a note the key does not have.
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: { attack: 0.005, release: 0.1, twelfth: 0, celeste: 0, bellows: 0, breath: 0.1 },
    },
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Side to side',
        params: { time: 500, feedback: 0.5, mix: 0.4 },
      },
      room(0.25),
    ],
    ...bars(1, chord([52, 59, 64, 67], '.... ..x. .... ....', { hold: 1.5 }), { passes: 2 }),
  }),
  sound({
    id: 'pulse-glass-ricochet-fmaj7',
    number: 386,
    name: 'Glass ricochet {F}maj7',
    kind: 'beat',
    description:
      'A glassy chord on {F} major seventh struck once, then a quick echo in dotted sixteenth notes that skips away.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: { decay: 1.2, release: 0.4, detune: 3 },
    },
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Plain echo',
        params: { time: 187.5, feedback: 0.6, mix: 0.4 },
      },
      room(0.25),
    ],
    ...bars(1, chord([65, 69, 72, 76], 'x... .... .... ....', { hold: 1 }), { passes: 2 }),
  }),
  sound({
    id: 'pulse-pluck-echo-csus2',
    number: 387,
    name: 'Pluck echo {C}sus2',
    kind: 'beat',
    description:
      'A filtered synthesizer pluck on {C} with its second and fifth, struck on the beat into a triplet echo.',
    instrument: {
      deviceId: 'ember',
      preset: 'Glass Pluck',
      params: { cutoff: 700, ampDecay: 0.8, ampRelease: 0.5, filterDecay: 0.3 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        params: {
          time: 333.333,
          feedback: 0.5,
          modDepth: 0.1,
          tone: 3000,
          age: 0.1,
          spread: 0.7,
          mix: 0.4,
        },
      },
      room(0.25),
    ],
    ...bars(2, chord([48, 60, 62, 67], 'x... .... .... .... x... .... o... ....', { hold: 1 }), {
      passes: 2,
    }),
  }),
  sound({
    id: 'pulse-guitar-echo-g',
    number: 388,
    name: 'Guitar echo {G}',
    kind: 'beat',
    description:
      'A clean electric guitar chord on {G}, struck twice, with a tape echo in eighth notes that dulls as it fades.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { strum: 6, shimmer: 0, sustain: 2, hardness: 0.4 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 250,
          feedback: 0.65,
          heads: 0,
          wow: 0.1,
          flutter: 0.05,
          drive: 0.2,
          highCut: 4000,
          spread: 0.5,
          mix: 0.35,
        },
      },
      room(0.25),
    ],
    ...bars(2, chord([55, 62, 67, 71], 'x... .... .... .... x... .... ..o. ....', { hold: 1 }), {
      passes: 2,
    }),
  }),
]

// What moves here is not the notes: a tremolo cuts a held chord into strokes, a filter opens on the
// beat or over the loop, an accent walks through a row that never changes.
const MOVING: readonly FactorySound[] = [
  sound({
    id: 'pulse-chopped-strings-dm',
    number: 389,
    name: 'Chopped strings {D}m9',
    kind: 'beat',
    description:
      'A string machine holds {D} minor ninth while a square tremolo cuts it into even eighth notes.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { attack: 0.01, release: 0.3, drift: 0 },
    },
    effects: [chop(4), room(0.2)],
    ...bars(2, held([50, 57, 65, 72, 76], 2)),
  }),
  sound({
    id: 'pulse-filter-beats-f',
    number: 390,
    name: 'Filter pulse {F}',
    kind: 'beat',
    description:
      'A reedy wavetable chord on {F} is held while a filter snaps open on every beat and closes again.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { attack: 0.01, release: 0.3, motion: 0 },
    },
    effects: [
      sweep({ cutoffHz: 350, resonance: 2, lfoAmount: 75, lfoRateHz: 2, lfoShape: 3 }),
      room(0.2),
    ],
    ...bars(2, held([53, 60, 65, 69], 2)),
  }),
  sound({
    id: 'pulse-opening-organ-g',
    number: 391,
    name: 'Opening organ {G}',
    kind: 'beat',
    description:
      'A reed organ repeats an open chord on {G} in eighth notes while a filter opens slowly over it and shuts again.',
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: { attack: 0.005, release: 0.08, twelfth: 0.1, celeste: 0, bellows: 0, breath: 0.1 },
    },
    effects: [
      sweep({ cutoffHz: 600, resonance: 1.5, lfoAmount: 60, lfoRateHz: 0.5, lfoShape: 2 }),
      room(0.2),
    ],
    ...bars(1, chord([55, 62, 67, 69], 'x.x.x.x. x.x.x.x.', { hold: 1 })),
  }),
  sound({
    id: 'pulse-walking-accent-a',
    number: 392,
    name: 'Walking accent {A}',
    kind: 'beat',
    description:
      'A vibraphone repeats one {A} in eighth notes and leans on every third, so the accent walks across the beat.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { mallet: 0.5, decay: 0.8, damper: 0.7, width: 0.3 },
    },
    effects: [room(0.18)],
    ...bars(4, [row(69, 'XooXooXo oXooXooX ooXooXoo XooXooXo', { per: 8, hold: 0.6 })]),
  }),
  sound({
    id: 'pulse-gated-saws-em',
    number: 393,
    name: 'Gated saws {E}m7',
    kind: 'beat',
    description:
      'Detuned sawtooth waves hold {E} minor seventh, gated into sixteenth notes while a filter slowly opens and closes.',
    instrument: {
      deviceId: 'ember',
      preset: 'Super Saw',
      params: { unisonVoices: 3, cutoff: 4000, ampAttack: 0.005, ampRelease: 0.3 },
    },
    effects: [
      chop(8, 0.9),
      sweep({ cutoffHz: 900, resonance: 1.2, lfoAmount: 50, lfoRateHz: 0.25, lfoShape: 0 }),
      room(0.2),
    ],
    ...bars(2, held([52, 59, 62, 67], 2)),
  }),
  sound({
    id: 'pulse-chopped-flutes-c',
    number: 394,
    name: 'Chopped flutes {C}6',
    kind: 'beat',
    description:
      'Soft flutes hold a sixth chord on {C} while a square tremolo cuts it into triplets.',
    instrument: {
      deviceId: 'flute',
      preset: 'Soft wind lead',
      params: { attack: 0.01, release: 0.3, vibrato: 0 },
    },
    effects: [chop(6, 0.9), room(0.2)],
    ...bars(2, held([60, 64, 67, 69], 2)),
  }),
]

export const PULSES: readonly FactorySound[] = [...PLAIN, ...FIGURES, ...ECHOES, ...MOVING]
