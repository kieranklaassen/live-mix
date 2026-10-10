// Glitch loops on the glitch kit: clicks, pips and static laid on a grid. Numbers 341 to 360.
// Every one keeps time (`bpm`, ../tempo.ts) and is written in rows (./rhythm.ts).
// What every sound here is held to is in docs/factory.md.
//
// Four sorts: one fault on its own (a single hit when the stroke is short, a clock when it is long),
// patterns of two to five faults, rows that go against the four, and three that are mostly what an
// echo or a room makes of one fault. The keys are faults and not pitches (`FAULT`), so a piece in
// another key moves the kit's `tune` and nothing else; every loop was measured with it at +5 and -4.
//
// The kit draws its scatter from a seeded generator, one draw for each hit in the order they are
// struck: a loop is the same at every render and at every tempo, and adding or taking away one hit
// (or a pass) moves every throw after it. Where a number below looks arbitrary it was chosen for the
// draw it gives: hits on both sides of the middle, and no hit far louder than its neighbours.

import { type PatchDevice } from '../../../core/devices/patch'
import { type FactorySound } from '../types'
import { sound } from './recipe'
import { bars, FAULT, row } from './rhythm'

const kit = (params: Readonly<Record<string, number>>): PatchDevice => ({
  deviceId: 'glitch-kit',
  params,
})

/** The same fault an octave up: higher and shorter. */
const UP = 12

/** Steps of silence, for a row that plays in one bar of several. */
const rests = (steps: number): string => '.'.repeat(steps)

/**
 * `bars` for a loop whose passes are not the same audio twice (crackle drawn afresh at each hit, a
 * long tail under the first hit): the linear fold of `cycled`, right for the same wave again, dips
 * by 1.5 to 2.7 dB over two unrelated stretches. These are folded at equal power.
 */
const loose = (...written: Parameters<typeof bars>): ReturnType<typeof bars> => ({
  ...bars(...written),
  loopFold: 'power',
})

const ALONE: readonly FactorySound[] = [
  // The lilt is small on purpose: at 0.07 of a step the analysis is 0.67 sure of the pulse (0.6 is
  // the least it takes), and at 0.12 it calls the loop a texture.
  sound({
    id: 'glitch-click-eighths',
    number: 341,
    name: 'Lilting clicks',
    kind: 'beat',
    description:
      'One dry click in eighth notes, the off-beats softer and a hair late, each landing in a slightly different place.',
    instrument: kit({ length: 2, tone: 0.55, scatter: 0.4, spread: 0.7 }),
    effects: [],
    ...bars(4, [row(FAULT.click, 'Xoxo xoxo', { per: 8, swing: 0.07 })]),
  }),
  sound({
    id: 'glitch-pop-beats',
    number: 342,
    name: 'Steady pop',
    kind: 'beat',
    description:
      'A low sine pop on every beat, rounded and dull, where a kick drum would be; it stays in the middle.',
    instrument: kit({ length: 1.3, tone: 0.25, edge: 0.15, scatter: 0.2, spread: 0 }),
    effects: [],
    ...bars(2, [row(FAULT.pop, 'X... x... x... x...')]),
  }),
  sound({
    id: 'glitch-lone-pip',
    number: 343,
    name: 'Lone pip',
    kind: 'beat',
    description:
      'One short pure sine pip every four beats and nothing else, each a little off the last in level and place.',
    instrument: kit({ length: 1.2, tone: 0.6, edge: 0.1, scatter: 0.25, spread: 0.8 }),
    effects: [],
    ...bars(4, [row(FAULT.pip, 'x... .... .... ....')]),
  }),
  // `melodic` is what a bed of crackle reads as: each burst is twenty-odd ticks at random times, so
  // the analysis hears many irregular hits and a ringing band, not eight strokes. Bursts short
  // enough to read as a beat (length 0.5) are no bed. Two bars: the throws of four lean to the left.
  sound({
    id: 'glitch-crackle-bed',
    number: 344,
    name: 'Crackle bed',
    kind: 'melodic',
    description:
      'A dense burst of crackle on every beat that thins out before the next one: surface noise with a pulse in it.',
    instrument: kit({
      tune: -5,
      length: 2.2,
      tone: 0.35,
      edge: 0.2,
      density: 0.95,
      scatter: 0.6,
      spread: 0.9,
    }),
    effects: [],
    ...loose(2, [row(FAULT.crackle, 'x... x... x... x...')]),
  }),
  // On the off-beats, so the first burst is an eighth note in and not at the start.
  sound({
    id: 'glitch-static-offbeats',
    number: 345,
    name: 'Static offbeats',
    kind: 'beat',
    description:
      'A short burst of rough static on every off-beat that has died away by the beat, a little crushed.',
    instrument: kit({ length: 0.8, tone: 0.7, edge: 0.5, crush: 0.3, scatter: 0.5, spread: 0.8 }),
    effects: [],
    ...bars(4, [row(FAULT.static, '..x. ..x. ..x. ..x.')]),
  }),
  // Scatter is nearly off: with it up the kit picks a click or a sine for each stutter's grain, and
  // at one peak the click grain carries 10 dB less, so the row would be loud and faint by turns.
  sound({
    id: 'glitch-slow-stutter',
    number: 346,
    name: 'Slow stutter',
    kind: 'beat',
    description:
      'One tiny sine grain repeated fast and fading, like a buffer that skips, once every two beats.',
    instrument: kit({ tone: 0.45, density: 0.8, scatter: 0.05, spread: 0.4 }),
    effects: [],
    ...bars(4, [row(FAULT.stutter, 'x... .... x... ....')]),
  }),
]

const PATTERNS: readonly FactorySound[] = [
  sound({
    id: 'glitch-pop-and-clicks',
    number: 347,
    name: 'Pop and clicks',
    kind: 'beat',
    description:
      'A soft pop on the first and third beat with dry clicks in the gaps between, each in a slightly different place.',
    instrument: kit({ scatter: 0.45, spread: 0.7 }),
    effects: [],
    ...bars(2, [
      row(FAULT.pop, 'X... .... x... ....'),
      row(FAULT.click, '..x. ...x ..x. o... ..x. ...x ..x. o.xo'),
    ]),
  }),
  // The call is on one beat and the answer on the next. A cut carries 15 dB more than a click at the
  // same mark, so the cuts are written soft.
  sound({
    id: 'glitch-cuts-answer',
    number: 348,
    name: 'Cuts answer clicks',
    kind: 'beat',
    description:
      'Hard clicks on one beat and slices of hiss switched on and off that answer on the next, bright and square.',
    instrument: kit({ length: 0.7, tone: 0.9, edge: 1, scatter: 0.15, spread: 0.7 }),
    effects: [],
    ...bars(2, [
      row(FAULT.click, 'X.xx .... x.x. .... X.xx .... x..x ....'),
      row(FAULT.cut, '.... o..o .... o... .... o..o .... o.-.'),
    ]),
  }),
  // Four bars of a two-bar figure: the notes come round twice and the throws do not.
  sound({
    id: 'glitch-wide-faults',
    number: 349,
    name: 'Wide faults',
    kind: 'beat',
    description:
      'Clicks, doubled clicks, a cut of hiss and a breath of static thrown far to the left and right, no two in one place.',
    instrument: kit({ tone: 0.6, edge: 0.6, density: 0.6, scatter: 0.8, spread: 1 }),
    effects: [],
    ...bars(4, [
      row(FAULT.click, 'x... ...x x..x .... x... ..xx x..x ..x.'),
      row(FAULT.double, '.... x... .... ..o. .... x... .... ....'),
      row(FAULT.cut, '..o. .... .... ....'),
      row(FAULT.static, '.... .... .... -...'),
    ]),
  }),
  sound({
    id: 'glitch-small-high',
    number: 350,
    name: 'Small high faults',
    kind: 'beat',
    description:
      'Tiny clicks an octave up tick in sixteenth notes over one low pop, with a high pip and a chirp passing through.',
    instrument: kit({ length: 0.7, tone: 0.8, edge: 0.4, scatter: 0.3, spread: 0.7 }),
    effects: [],
    ...bars(2, [
      row(FAULT.pop, 'x... .... .... ....'),
      row(FAULT.click + UP, 'x.o. x.oo x.o. x..o x.o. x.oo x.o. xo.o'),
      row(FAULT.pip + UP, '.... .... .... ..-. .... .... .... ....'),
      row(FAULT.chirp + UP, '.... .... .... .... .... .... ..-. ....'),
    ]),
  }),
  // The edge is hard for the buzz: below about 0.85 its first pulse is lost in the fade-in and the
  // buzz starts one pulse late.
  sound({
    id: 'glitch-zap-turn',
    number: 351,
    name: 'Zap at the turn',
    kind: 'beat',
    description:
      'Off-beat clicks over a pop and a low buzz, and after sixteen beats a falling zap marks the turn.',
    instrument: kit({ tune: 5, tone: 0.45, edge: 0.85, scatter: 0.3, spread: 0.6 }),
    effects: [],
    ...bars(4, [
      row(FAULT.pop, 'x... .... .... ....'),
      row(FAULT.buzz, '.... .... x... ....'),
      row(FAULT.click, `${'..x. ..x. ..x. ..x.'.repeat(3)} ..x. ..x. ..x. ....`),
      row(FAULT.zap, `${rests(48)} .... .... .... ..o.`),
    ]),
  }),
  sound({
    id: 'glitch-three-three-two',
    number: 352,
    name: 'Three three two',
    kind: 'beat',
    description:
      'A pop on a three-three-two division of eighth notes and a click after the first and the last, coarse and crushed.',
    instrument: kit({ tone: 0.65, edge: 0.8, crush: 0.7, scatter: 0.1, spread: 0.6 }),
    effects: [],
    ...bars(2, [
      row(FAULT.pop, 'X... ..x. .... x...'),
      row(FAULT.click, '..o. .... ..o. .... ..o. .... ..o. ..o.'),
    ]),
  }),
  // Five hits in eight beats, each a different fault. Dry: a small room after the pip made a second
  // onset 0.1 s behind it at some tunings, and the loop then read as a texture.
  sound({
    id: 'glitch-nearly-empty',
    number: 353,
    name: 'Nearly empty',
    kind: 'beat',
    description:
      'A pop, a cut of hiss, a pip, a click and a breath of static, one after the other with long silences between.',
    instrument: kit({ tune: -2, length: 1.4, tone: 0.4, edge: 0.2, scatter: 0.25, spread: 0.7 }),
    effects: [],
    ...bars(2, [
      row(FAULT.pop, `x... .... .... .... ${rests(16)}`),
      row(FAULT.cut, `.... .... .... o... ${rests(16)}`),
      row(FAULT.pip, `${rests(16)} o... .... .... ....`),
      row(FAULT.click, `${rests(16)} .... .... ..x. ....`),
      row(FAULT.static, `${rests(16)} .... .... .... o...`),
    ]),
  }),
]

// Against the four. The analysis takes its tempo from the commonest gap between hits, so a row that
// runs free in threes or sevens for a whole loop is heard at that rate, with no confidence, and the
// loop reads as a texture. Each of these keeps a row on the beat under the one that goes against it,
// and the row in threes starts over every four beats.
const AGAINST: readonly FactorySound[] = [
  sound({
    id: 'glitch-clicks-in-threes',
    number: 354,
    name: 'Clicks in threes',
    kind: 'beat',
    description:
      'A dull click every three sixteenth notes against a soft pop on every beat, starting over every four beats.',
    instrument: kit({ tune: -7, tone: 0.25, edge: 0.1, scatter: 0.3, spread: 0.7 }),
    effects: [],
    ...bars(2, [row(FAULT.pop, 'x... o... o... o...'), row(FAULT.click, 'x..x ..x. .x.. x...')]),
  }),
  sound({
    id: 'glitch-five-on-four',
    number: 355,
    name: 'Five on four',
    kind: 'beat',
    description:
      'Five even sine pips to every four beats, the first one harder, over a pop on the first and third beat.',
    instrument: kit({ tune: 5, length: 0.6, tone: 0.5, edge: 0.2, scatter: 0.2, spread: 0.6 }),
    effects: [],
    ...bars(2, [row(FAULT.pop, 'o... .... -... ....'), row(FAULT.pip, 'xoooo', { per: 5 })]),
  }),
  // Nine turns of the seven-step figure and one step over fill four bars; the bit noise on the
  // off-beats is what the figure turns against.
  sound({
    id: 'glitch-seven-steps',
    number: 356,
    name: 'Seven step faults',
    kind: 'beat',
    description:
      'Two clicks and a cut in a figure seven sixteenth notes long, turning against a faint bit noise on every off-beat.',
    instrument: kit({
      length: 0.6,
      tone: 0.65,
      edge: 0.8,
      crush: 0.45,
      scatter: 0.1,
      spread: 0.7,
    }),
    effects: [],
    ...bars(4, [
      row(FAULT.bit + UP, '..-.'),
      row(FAULT.click, `${'x..o...'.repeat(9)}.`),
      row(FAULT.cut, `${'.....o.'.repeat(9)}.`),
    ]),
  }),
  sound({
    id: 'glitch-triplet-ticks',
    number: 357,
    name: 'Triplet ticks',
    kind: 'beat',
    description:
      'Small bright ticks in triplets, three to the beat, over a soft pop on the first and third beat.',
    instrument: kit({ tune: 7, length: 0.6, tone: 0.7, scatter: 0.35, spread: 0.8 }),
    effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.15 } }],
    ...bars(2, [
      row(FAULT.pop, 'x... .... o... ....'),
      row(FAULT.click, 'X-o x-o x-o x-o', { per: 12 }),
    ]),
  }),
]

// Through an echo or a room. Two passes each: the tail of one pass lies under the start of the next.
const ECHOED: readonly FactorySound[] = [
  sound({
    id: 'glitch-pip-dotted-echo',
    number: 358,
    name: 'Pip dotted echo',
    kind: 'beat',
    description:
      'A sine pip every two beats into a dotted-eighth echo, so the repeats fall across the beat and under the next pip.',
    instrument: kit({ tune: -7, length: 0.8, tone: 0.6, edge: 0.1, scatter: 0.15, spread: 0.3 }),
    effects: [
      {
        deviceId: 'analog-delay',
        params: {
          time: 375,
          feedback: 0.5,
          modDepth: 0,
          tone: 3000,
          age: 0.1,
          spread: 0.6,
          mix: 0.4,
        },
      },
    ],
    ...bars(2, [row(FAULT.pip, 'X... .... x... ....')], { passes: 2 }),
  }),
  // The echo's first repeat goes to the left, so the loop leans 2.5 dB that way; with the echo's
  // spread full it leans 3. Scatter is low: the first click of the loop is the next pass's, and
  // with more scatter the two differ by 2 dB.
  sound({
    id: 'glitch-scattered-clicks',
    number: 359,
    name: 'Scattered clicks',
    kind: 'beat',
    description:
      'A few dry clicks, each thrown into a short dull tape echo that repeats it on the sixteenth notes from side to side.',
    instrument: kit({ length: 1.5, tone: 0.6, edge: 0.5, scatter: 0.3, spread: 0.4 }),
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 125,
          feedback: 0.6,
          heads: 0,
          wow: 0,
          flutter: 0,
          drive: 0.2,
          lowCut: 500,
          highCut: 2500,
          spread: 0.5,
          mix: 0.5,
        },
      },
    ],
    ...loose(2, [row(FAULT.click, 'x... ..x. .... .x.. x... .... ..x. ....')], { passes: 2 }),
  }),
  // A plate and not a hall: a hall's pre-delay (20 ms at the least) gave the cut a second onset, and
  // a hall this long left the second half of each bar 19 to 24 dB under the first (the plate: 12).
  sound({
    id: 'glitch-cut-dark-plate',
    number: 360,
    name: 'Dark plate cut',
    kind: 'beat',
    description:
      'A slice of hiss cut hard every four beats into a long dark plate reverb, still fading when the next one comes.',
    instrument: kit({ length: 1.4, tone: 0.5, edge: 0.7, scatter: 0.4, spread: 0.5 }),
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { decay: 0.93, mix: 0.4 } },
    ],
    ...loose(4, [row(FAULT.cut, 'x... .... .... ....')], { passes: 2 }),
  }),
]

export const GLITCH_LOOPS: readonly FactorySound[] = [...ALONE, ...PATTERNS, ...AGAINST, ...ECHOED]
