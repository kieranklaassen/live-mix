// Grooves on the Club Kit: whole beats with a kick on every beat. Numbers 401 to 412.
// Every one keeps time (`bpm`, ../tempo.ts) and is written in rows (./rhythm.ts).
// What every sound here is held to is in docs/factory.md.
//
// Each is two bars, and the second differs from the first by one thing at the turn (a ghost, an
// open hat, a pickup), so that the loop does not read as one bar played twice. The kick is the
// loudest drum of every groove and the others are set under it with the marks of their rows, not
// with the kit's volume. `tune` is 0 throughout: every drum of the Club Kit that has a pitch is on
// a white key there in all four characters. Most are dry, so that a groove takes the room of the
// piece it is laid in.

import { type PatchDevice } from '../../../core/devices/patch'
import { hall } from '../parts'
import { type FactorySound } from '../types'
import { sound } from './recipe'
import { bars, CLUB, row, type Row } from './rhythm'

/** The four characters of the kit (`kit` in cpp/devices/club-kit/device.json). */
const FIRM = 0
const DEEP = 1
const DUSTY = 2
const BRIGHT = 3

const kit = (params: Readonly<Record<string, number>>): PatchDevice => ({
  deviceId: 'club-kit',
  params,
})

/**
 * How late every second sixteenth of a swung row comes, as a share of a step: 25 ms at 120, the
 * swing of the swung layers of the pack (./club-layers.ts), so that a groove and a layer lie on
 * one another. The analysis holds what it hears to a straight grid (core/analysis/onsets.ts) and
 * reads no tempo from sixteenths swung this far. A swung groove is written on a beat all the same,
 * and `beat` is the bank's word for it (`beatTheAnalysisLoses` in the bank's tests).
 */
const SWING = 0.2

/**
 * A stroke and its echoes written out as strokes: the same drum again every `apart` steps of a
 * loop of `steps` sixteenths, as hard as `gains` say, going round the end of the loop into its
 * start. No echo device that follows the tempo filters its first repeat, so a kick on every beat
 * under one comes back as loud as it went in; written out, only the drum that is meant to echo does.
 */
function echoed(
  key: number,
  steps: number,
  starts: readonly number[],
  apart: number,
  gains: readonly number[],
): Row {
  const marks = new Array<number>(steps).fill(0)
  for (const start of starts) {
    gains.forEach((gain, repeat) => {
      marks[(start + repeat * apart) % steps] = gain
    })
  }
  return { ...row(key, '.'.repeat(steps)), steps: marks }
}

/**
 * How hard a rim and its four echoes are struck. The kit plays a stroke at a quarter of its level
 * and three quarters of that by its gain, so these fall by 2.5 dB each, and each is duller.
 */
const ECHO_GAINS = [1, 0.67, 0.42, 0.23, 0.09]

/**
 * How hard a soft stroke and a ghost of the snare are struck where the marks of a row are too
 * hard for them. The kit plays a stroke at a quarter of its level and three quarters of that by
 * its gain, so the soft mark is only 2 dB under a clap written as a stroke and the ghost mark 5,
 * which is no ghost beside it. These peak 7 and 10 dB under that clap, and are duller.
 */
const SOFT_SNARE = 0.2
const GHOST_SNARE = 0.05

/** A row of the snare with its soft marks and its ghost marks struck as softly as above. */
function hushed(base: Row): Row {
  const [soft, ghost] = row(base.notes, 'o-').steps
  return {
    ...base,
    steps: base.steps.map((gain) =>
      gain === soft ? SOFT_SNARE : gain === ghost ? GHOST_SNARE : gain,
    ),
  }
}

export const CLUB_GROOVES: readonly FactorySound[] = [
  sound({
    id: 'club-four-floor-groove',
    number: 401,
    name: 'Four floor groove',
    kind: 'beat',
    description:
      'A firm house kick on every beat, a clap on two and four and a short open hat on every offbeat, with a ghost closed hat on each beat.',
    instrument: kit({ kit: FIRM, tune: 0, punch: 0.6, snap: 0.5 }),
    effects: [],
    ...bars(2, [
      row(CLUB.kick, 'X... X... X... X...'),
      row(CLUB.clap, '.... x... .... x...'),
      row(CLUB.open, '..x. ..x. ..x. ..x.'),
      // The second bar ends on one more ghost, which shuts the last open hat a sixteenth early.
      row(CLUB.hat, '-... -... -... -... -... -... -... -..-'),
    ]),
  }),
  sound({
    id: 'club-deep-house-groove',
    number: 402,
    name: 'Deep house groove',
    kind: 'beat',
    description:
      'A long round deep house kick on every beat, a soft clap on two and four and closed hats in eighths that lean on the offbeat.',
    instrument: kit({ kit: DEEP, tune: 0, length: 1.2, punch: 0.4, snap: 0.3, tone: 0.45 }),
    effects: [],
    ...bars(2, [
      row(CLUB.kick, 'X... X... X... X...'),
      row(CLUB.clap, '.... o... .... o...'),
      // The last offbeat of the second bar is the one open hat, shut by the ghost on the next beat.
      row(CLUB.hat, '-.x. -.x. -.x. -.x. -.x. -.x. -.x. -...'),
      row(CLUB.open, '.... .... .... .... .... .... .... ..x.'),
    ]),
  }),
  sound({
    id: 'club-swung-hat-groove',
    number: 403,
    name: 'Swung hat groove',
    // The analysis reads no tempo from it (see SWING): a beat by the bank's word.
    kind: 'beat',
    description:
      'A dusty house kick on every beat and a clap on two and four under closed hats in swung sixteenths, loudest on the offbeat.',
    instrument: kit({ kit: DUSTY, tune: 0, snap: 0.5 }),
    effects: [],
    ...bars(2, [
      // The pickup on the last sixteenth is swung with the hats.
      row(CLUB.kick, 'X... X... X... X... X... X... X... X..o', { swing: SWING }),
      row(CLUB.clap, '.... x... .... x...'),
      row(CLUB.hat, 'ooxo ooxo ooxo ooxo', { swing: SWING }),
    ]),
  }),
  sound({
    id: 'club-late-clap-groove',
    number: 404,
    name: 'Late clap groove',
    kind: 'beat',
    description:
      'A firm house kick, a clap a hair behind two and four with a ghost snare a sixteenth before it, and closed hats on the offbeats.',
    instrument: kit({ kit: FIRM, tune: 0, punch: 0.5, snap: 0.4 }),
    effects: [],
    ...bars(2, [
      row(CLUB.kick, 'X... X... X... X...'),
      row(CLUB.clap, '.... x... .... x...', { lateSec: 0.015 }),
      hushed(row(CLUB.snare, '...- .... ...- ....')),
      // The last offbeat of the second bar is an open hat, which rings into the turn.
      row(CLUB.hat, '..x. ..x. ..x. ..x. ..x. ..x. ..x. ....'),
      row(CLUB.open, '.... .... .... .... .... .... .... ..x.'),
    ]),
  }),
  sound({
    id: 'club-rim-shaker-groove',
    number: 405,
    name: 'Rim and shaker groove',
    kind: 'beat',
    description:
      'A bright house kick on every beat, a rim on two and four in place of a clap, and a shaker in sixteenths that leans on the offbeat.',
    instrument: kit({ kit: BRIGHT, tune: 0, snap: 0.5 }),
    effects: [],
    ...bars(2, [
      row(CLUB.kick, 'X... X... X... X...'),
      // One soft rim more on the last sixteenth of the second bar.
      row(CLUB.rim, '.... X... .... X... .... X... .... X..o'),
      row(CLUB.shaker, 'o-x- o-x- o-x- o-x-'),
    ]),
  }),
  sound({
    id: 'club-conga-groove',
    number: 406,
    name: 'Conga groove',
    kind: 'beat',
    description:
      'A firm house kick, clap and offbeat hat, with a high conga early in the bar and a low conga answering it with the same figure late in it.',
    instrument: kit({ kit: FIRM, tune: 0, punch: 0.5, snap: 0.45 }),
    effects: [],
    ...bars(2, [
      row(CLUB.kick, 'X... X... X... X...'),
      row(CLUB.clap, '.... x... .... x...'),
      row(CLUB.hat, '..x. ..x. ..x. ..x.'),
      // The high conga comes once more on the last sixteenth of the second bar, into the turn.
      row(CLUB.highConga, '...x ..o. .... .... ...x ..o. .... ...o'),
      row(CLUB.lowConga, '.... .... ...x ..o.'),
    ]),
  }),
  sound({
    id: 'club-ride-groove',
    number: 407,
    name: 'Ride groove',
    kind: 'beat',
    description:
      'A bright house kick on every beat, a clap on two and four and a ride cymbal ringing on every offbeat, with one more on the last beat.',
    instrument: kit({ kit: BRIGHT, tune: 0, snap: 0.45 }),
    effects: [],
    ...bars(2, [
      row(CLUB.kick, 'X... X... X... X...'),
      row(CLUB.clap, '.... x... .... x...'),
      row(CLUB.ride, '..-. ..-. ..-. ..-. ..-. ..-. ..-. -.-.'),
    ]),
  }),
  sound({
    id: 'club-skipping-kick-groove',
    number: 408,
    name: 'Skipping kick groove',
    // Its early kick and the hats beside it are swung (see SWING): a beat by the bank's word too.
    kind: 'beat',
    description:
      'A dusty house kick that leaves the third beat out and comes a swung sixteenth before it, a clap on two and four and swung hats off the beat.',
    instrument: kit({ kit: DUSTY, tune: 0, punch: 0.55, snap: 0.45 }),
    effects: [],
    ...bars(2, [
      row(CLUB.kick, 'X... X..x .... X...', { swing: SWING }),
      row(CLUB.clap, '.... x... .... x...'),
      // A soft swung hat after every offbeat one, the second of them with the early kick. The second
      // bar ends on an open hat.
      row(CLUB.hat, '..xo ..xo ..xo ..xo ..xo ..xo ..xo ....', { swing: SWING }),
      row(CLUB.open, '.... .... .... .... .... .... .... ..x.'),
    ]),
  }),
  sound({
    id: 'club-dub-echo-groove',
    number: 409,
    name: 'Dub echo groove',
    kind: 'beat',
    description:
      'A deep house kick, offbeat closed hats and a rim on the and of two that echoes four times, a dotted eighth apart, each softer and duller.',
    instrument: kit({ kit: DEEP, tune: 0, length: 1.1, punch: 0.4, snap: 0.35, tone: 0.5 }),
    effects: [hall('Room', 0.1)],
    ...bars(2, [
      row(CLUB.kick, 'X... X... X... X...'),
      // One ghost more after the last offbeat of the second bar.
      row(CLUB.hat, '..x. ..x. ..x. ..x. ..x. ..x. ..x. ..x-'),
      // The rim of each bar on its sixth sixteenth and its echoes every three after: the last of
      // them lands on the first offbeat of the next bar.
      echoed(CLUB.rim, 32, [6, 22], 3, ECHO_GAINS),
    ]),
  }),
  sound({
    id: 'club-ghost-snare-groove',
    number: 410,
    name: 'Ghost snare groove',
    kind: 'beat',
    description:
      'A dusty house kick on every beat and a clap on two and four, with soft and ghosted snare strokes on the sixteenths between them.',
    instrument: kit({ kit: DUSTY, tune: 0, punch: 0.5, snap: 0.4 }),
    effects: [],
    ...bars(2, [
      row(CLUB.kick, 'X... X... X... X...'),
      row(CLUB.clap, '.... x... .... x...'),
      // A ghost before the third beat and a soft stroke after it. The second bar has two strokes
      // more, into the turn.
      hushed(row(CLUB.snare, '.... ...- .o.. .... .... ...- .o.. ..-o')),
    ]),
  }),
  sound({
    id: 'club-cowbell-groove',
    number: 411,
    name: 'Cowbell groove',
    kind: 'beat',
    description:
      'A bright house kick, clap and offbeat hat under a cowbell that counts three, three and two sixteenths, twice to the bar.',
    instrument: kit({ kit: BRIGHT, tune: 0, snap: 0.45 }),
    effects: [],
    ...bars(2, [
      row(CLUB.kick, 'X... X... X... X...'),
      row(CLUB.clap, '.... x... .... x...'),
      // The last offbeat of the second bar is an open hat.
      row(CLUB.hat, '..o. ..o. ..o. ..o. ..o. ..o. ..o. ....'),
      row(CLUB.open, '.... .... .... .... .... .... .... ..o.'),
      row(CLUB.cowbell, 'x..o ..o. x..o ..o.'),
    ]),
  }),
  sound({
    id: 'club-late-night-groove',
    number: 412,
    name: 'Late night groove',
    kind: 'beat',
    description:
      'A soft dull deep house kick, a soft clap on two and four and a shaker in sixteenths, far off in a room.',
    instrument: kit({
      kit: DEEP,
      tune: 0,
      length: 1.4,
      punch: 0.3,
      snap: 0.2,
      tone: 0.3,
      width: 0.7,
    }),
    // The lows of the room die in a second, so that the kick does not ring into the next one.
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { lowDecay: 1, mix: 0.3 } }],
    ...bars(2, [
      row(CLUB.kick, 'x... x... x... x...'),
      // A ghost clap on the last sixteenth of the second bar.
      row(CLUB.clap, '.... o... .... o... .... o... .... o..-'),
      row(CLUB.shaker, 'o-x- o-x- o-x- o-x-'),
    ]),
  }),
]
