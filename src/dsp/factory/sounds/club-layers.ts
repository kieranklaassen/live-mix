// Layers on the Club Kit: one part each, to stack. Numbers 413 to 436.
// Every one keeps time (`bpm`, ../tempo.ts) and is written in rows (./rhythm.ts).
// What every sound here is held to is in docs/factory.md.
//
// A layer is one part of a house beat, a loop of one or two bars (the crash, of four) to lay over
// others: a kick on every beat, a clap on two and four, a row of hats, and someone has a beat of
// their own. So each is plain and is what its name says, starts on a bar line (with a rest where
// the part has nothing on the first beat) and is dry, with no room after the kit, so that it takes
// the reverb of the piece it is painted into.
//
// Seven sorts: the kicks, the clap and the snare, the hats, shakers and rides, the congas with the
// cowbell and the rim, the tops of a beat with its kick left out, and one crash.
//
// `tune` stays at 0, where every drum of the kit with a pitch is on a white key in all four of its
// characters. The two of a pair (firm and deep, straight and swung) are set alike but for what the
// name says, so that one can be put in the place of the other.

import { type PatchDevice } from '../../../core/devices/patch'
import { type FactorySound } from '../types'
import { sound } from './recipe'
import { bars, CLUB, row } from './rhythm'

/** The characters of the kit that the layers use (`kit` in cpp/devices/club-kit/device.json). */
const FIRM = 0
const DEEP = 1
const BRIGHT = 3

const kit = (params: Readonly<Record<string, number>>): PatchDevice => ({
  deviceId: 'club-kit',
  params,
})

/** The kick of the two kicks on every beat and of the one with a pickup: the kit alone differs. */
const kick = (character: number): PatchDevice =>
  kit({ kit: character, tune: 0, length: 1, punch: 0.6, snap: 0.5, tone: 0.5, variation: 0 })

/** The clap and the snare on two and four. Nothing is drawn, so every stroke is the stroke before. */
const BACKBEAT = kit({ kit: FIRM, tune: 0, length: 1, snap: 0.45, tone: 0.5, variation: 0 })

/** The hats of every layer of closed hats alone, and of the two tops that are those hats and more. */
const HATS = kit({ kit: FIRM, tune: 0, length: 1, snap: 0.45, tone: 0.5, variation: 0.08 })

/**
 * The open hat on the offbeats rings twice as long as the kit leaves it, so that it is still
 * sounding an eighth note on, when the closed hat shuts it.
 */
const OPEN_HAT = kit({ kit: FIRM, tune: 0, length: 2, snap: 0.45, tone: 0.5, variation: 0.08 })

/** The shaker, straight and swung. */
const SHAKER = kit({ kit: FIRM, tune: 0, length: 1, snap: 0.45, tone: 0.5, variation: 0.1 })

/**
 * The ride of the two layers of ride alone. Nothing is drawn: a ride rings across the bar line,
 * and two rings that differ by a cent beat against each other where the loop is folded.
 */
const RIDE = kit({ kit: FIRM, tune: 0, length: 1, snap: 0.45, tone: 0.5, variation: 0 })

/** The congas of both conga layers. */
const CONGAS = kit({
  kit: FIRM,
  tune: 0,
  length: 1,
  punch: 0.5,
  snap: 0.45,
  tone: 0.5,
  variation: 0.1,
})

/** The cowbell and the rim. */
const BELL = kit({ kit: FIRM, tune: 0, length: 1, snap: 0.45, tone: 0.5, variation: 0.05 })

/** The bright kit of the two tops that are on it: nothing is drawn where a ride rings, as above. */
const brightTops = (variation: number): PatchDevice =>
  kit({ kit: BRIGHT, tune: 0, length: 1, snap: 0.45, tone: 0.5, variation })

/** A beat of closed hats in sixteenths: strong, ghost, soft, ghost. */
const SIXTEENTHS = 'x-o- x-o- x-o- x-o-'
/** A beat of the shaker in sixteenths: it leans on the offbeat. */
const SHAKEN = 'o-X- o-X- o-X- o-X-'
/**
 * How late every second sixteenth of a swung layer comes, as a share of a step: 25 ms at 120.
 * The analysis holds what it hears to a straight grid (core/analysis/onsets.ts) and reads no tempo
 * from sixteenths swung by more than 0.07 of a step. A swung layer is written on a beat all the
 * same, and `beat` is the bank's word for it (`beatTheAnalysisLoses` in the bank's tests).
 */
const SWING = 0.2
/**
 * The open hat of the two tops on the sixteenths. A soft stroke: the closed hat is struck on the
 * same step and the two are the same six pulses, so they add, and a full stroke there peaks
 * nearly as high as the clap.
 */
const TOPS_OPEN = row(CLUB.open, '..o. ..o. ..o. ..o.')

// The kick alone.
const KICKS: readonly FactorySound[] = [
  sound({
    id: 'club-firm-kick-four',
    number: 413,
    name: 'Firm kick four',
    kind: 'beat',
    description:
      'The firm club kick alone on every beat, the first of each four a little firmer, close and dry.',
    instrument: kick(FIRM),
    effects: [],
    ...bars(1, [row(CLUB.kick, 'X... x... x... x...')]),
  }),
  sound({
    id: 'club-deep-kick-four',
    number: 414,
    name: 'Deep kick four',
    kind: 'beat',
    description:
      'The long round kick of the deep club kit alone on every beat, the first of each four a little firmer, dry.',
    instrument: kick(DEEP),
    effects: [],
    ...bars(1, [row(CLUB.kick, 'X... x... x... x...')]),
  }),
  sound({
    id: 'club-kick-pickup',
    number: 415,
    name: 'Kick with a pickup',
    kind: 'beat',
    description:
      'The firm club kick on every beat over two bars, with one soft kick more a sixteenth before the second bar.',
    instrument: kick(FIRM),
    effects: [],
    ...bars(2, [row(CLUB.kick, 'X... x... x... x..o X... x... x... x...')]),
  }),
]

// The clap and the snare. Two bars each: one bar of two strokes is too few for a tempo to be read from.
const BACKBEATS: readonly FactorySound[] = [
  sound({
    id: 'club-clap-two-four',
    number: 416,
    name: 'Clap on two and four',
    kind: 'beat',
    description:
      'The club clap alone on beats two and four, four bursts of noise and a short tail, dry.',
    instrument: BACKBEAT,
    effects: [],
    ...bars(2, [row(CLUB.clap, '.... x... .... x...')]),
  }),
  sound({
    id: 'club-snare-two-four',
    number: 417,
    name: 'Snare on two and four',
    kind: 'beat',
    description:
      'The firm club snare alone on beats two and four, two short tones under a band of noise, dry.',
    instrument: BACKBEAT,
    effects: [],
    ...bars(2, [row(CLUB.snare, '.... x... .... x...')]),
  }),
  sound({
    id: 'club-double-clap',
    number: 418,
    name: 'Double clap',
    kind: 'beat',
    description:
      'The club clap on beats two and four, with a second softer clap an eighth note after the four, dry.',
    instrument: BACKBEAT,
    effects: [],
    ...bars(2, [row(CLUB.clap, '.... x... .... x.o.')]),
  }),
]

// The hats.
const HAT_ROWS: readonly FactorySound[] = [
  sound({
    id: 'club-offbeat-open-hat',
    number: 419,
    name: 'Offbeat open hat',
    kind: 'beat',
    description:
      'The club open hat on every offbeat, shut on each beat by a ghost of the closed hat, dry.',
    instrument: OPEN_HAT,
    effects: [],
    ...bars(1, [row(CLUB.hat, '-... -... -... -...'), row(CLUB.open, '..x. ..x. ..x. ..x.')]),
  }),
  sound({
    id: 'club-offbeat-closed-hat',
    number: 420,
    name: 'Offbeat closed hat',
    kind: 'beat',
    description:
      'The club closed hat alone on every offbeat, short and bright, six detuned pulses and noise, dry.',
    instrument: HATS,
    effects: [],
    ...bars(1, [row(CLUB.hat, '..x. ..x. ..x. ..x.')]),
  }),
  sound({
    id: 'club-eighth-hats',
    number: 421,
    name: 'Firm eighth hats',
    kind: 'beat',
    description:
      'The club closed hat in eighth notes, soft on the beat and stronger on the offbeat, firm and dry.',
    instrument: HATS,
    effects: [],
    ...bars(1, [row(CLUB.hat, 'o.x. o.x. o.x. o.x.')]),
  }),
  sound({
    id: 'club-sixteenth-hats',
    number: 422,
    name: 'Sixteenth hats',
    kind: 'beat',
    description:
      'The club closed hat in straight sixteenth notes, each beat strong, ghost, soft, ghost, dry.',
    instrument: HATS,
    effects: [],
    ...bars(1, [row(CLUB.hat, SIXTEENTHS)]),
  }),
  sound({
    id: 'club-swung-sixteenth-hats',
    number: 423,
    name: 'Swung sixteenth hats',
    // The analysis reads no tempo from it (see SWING): a beat by the bank's word.
    kind: 'beat',
    description:
      'The club closed hat in swung sixteenth notes, strong, ghost, soft, ghost, with every ghost late, dry.',
    instrument: HATS,
    effects: [],
    ...bars(1, [row(CLUB.hat, SIXTEENTHS, { swing: SWING })]),
  }),
]

// Shakers and rides.
const SHAKERS_AND_RIDES: readonly FactorySound[] = [
  sound({
    id: 'club-straight-shaker',
    number: 424,
    name: 'Straight club shaker',
    kind: 'beat',
    description:
      'The club shaker in straight sixteenth notes, a band of noise with a soft start, leaning on the offbeats, dry.',
    instrument: SHAKER,
    effects: [],
    ...bars(1, [row(CLUB.shaker, SHAKEN)]),
  }),
  sound({
    id: 'club-swung-shaker',
    number: 425,
    name: 'Swung club shaker',
    // As for the swung hats: a beat by the bank's word.
    kind: 'beat',
    description:
      'The club shaker in swung sixteenth notes that lean on the offbeats, every second one late, dry.',
    instrument: SHAKER,
    effects: [],
    ...bars(1, [row(CLUB.shaker, SHAKEN, { swing: SWING })]),
  }),
  sound({
    id: 'club-offbeat-ride',
    number: 426,
    name: 'Offbeat ride',
    kind: 'beat',
    description:
      'The club ride alone on every offbeat, a ping of four high sines over a quiet wash, ringing on, dry.',
    instrument: RIDE,
    effects: [],
    ...bars(1, [row(CLUB.ride, '..x. ..x. ..x. ..x.')]),
  }),
  sound({
    id: 'club-ride-eighths',
    number: 427,
    name: 'Ride in eighths',
    kind: 'beat',
    description:
      'The club ride in eighth notes, stronger on the beat and soft on the offbeat, each ping cut by the next, dry.',
    instrument: RIDE,
    effects: [],
    ...bars(1, [row(CLUB.ride, 'x.o. x.o. x.o. x.o.')]),
  }),
]

// Congas, the cowbell and the rim. Two bars each but the rolling congas.
const HAND_DRUMS: readonly FactorySound[] = [
  sound({
    id: 'club-two-conga-pattern',
    number: 428,
    name: 'Two conga pattern',
    kind: 'beat',
    description:
      'The low and high club congas in a syncopated figure over two bars, the high one leading, no two bars alike, dry.',
    instrument: CONGAS,
    effects: [],
    ...bars(2, [
      row(CLUB.highConga, '..x. .x.. ..x. .... ..x. .x.. ..x. .x..'),
      row(CLUB.lowConga, '.... ...x .... x.o. x... ...x .... ...o'),
    ]),
  }),
  sound({
    id: 'club-rolling-congas',
    number: 429,
    name: 'Rolling congas',
    kind: 'beat',
    description:
      'The club congas in running sixteenth notes, ghosts on the low one and accents on the high one off the beat, dry.',
    instrument: CONGAS,
    effects: [],
    ...bars(1, [
      row(CLUB.lowConga, 'o-.- -.-. o-.- .-..'),
      row(CLUB.highConga, '..X. .x.o ..X. o.xo'),
    ]),
  }),
  sound({
    id: 'club-cowbell-offbeats',
    number: 430,
    name: 'Cowbell offbeats',
    kind: 'beat',
    description:
      'The club cowbell on the offbeats, the last one of each bar left out, two pulses a fifth apart, dry.',
    instrument: BELL,
    effects: [],
    ...bars(2, [row(CLUB.cowbell, '..x. ..x. ..x. ....')]),
  }),
  sound({
    id: 'club-rim-three-three-two',
    number: 431,
    name: 'Rim in three three two',
    kind: 'beat',
    description:
      'The club rim on steps one, four and seven of each eight, three, three and two sixteenth notes apart, dry.',
    instrument: BELL,
    effects: [],
    ...bars(2, [row(CLUB.rim, 'X..x..x.')]),
  }),
]

// The tops of a beat: everything but the kick.
const TOPS: readonly FactorySound[] = [
  sound({
    id: 'club-tops-straight',
    number: 432,
    name: 'Tops, straight',
    kind: 'beat',
    description:
      'House tops with no kick: a clap on two and four, closed hats in straight sixteenths, an open hat on the offbeats.',
    instrument: HATS,
    effects: [],
    ...bars(1, [row(CLUB.clap, '.... x... .... x...'), row(CLUB.hat, SIXTEENTHS), TOPS_OPEN]),
  }),
  sound({
    id: 'club-tops-swung',
    number: 433,
    name: 'Tops, swung',
    // As for the swung hats: a beat by the bank's word.
    kind: 'beat',
    description:
      'House tops with no kick: a clap on two and four, closed hats in swung sixteenths, an open hat on the offbeats.',
    instrument: HATS,
    effects: [],
    ...bars(1, [
      row(CLUB.clap, '.... x... .... x...'),
      row(CLUB.hat, SIXTEENTHS, { swing: SWING }),
      TOPS_OPEN,
    ]),
  }),
  sound({
    id: 'club-tops-ride',
    number: 434,
    name: 'Tops with a ride',
    kind: 'beat',
    description:
      'Bright house tops with no kick: a clap on two and four, a ride on the offbeats, closed hats in eighths.',
    instrument: brightTops(0),
    effects: [],
    ...bars(1, [
      row(CLUB.clap, '.... x... .... x...'),
      row(CLUB.ride, '..o. ..o. ..o. ..o.'),
      row(CLUB.hat, 'o.-. o.-. o.-. o.-.'),
    ]),
  }),
  sound({
    id: 'club-tops-shaker',
    number: 435,
    name: 'Tops with a shaker',
    kind: 'beat',
    description:
      'Bright house tops with no kick: a clap on two and four, a shaker in sixteenths, a closed hat on the offbeats.',
    instrument: brightTops(0.08),
    effects: [],
    ...bars(1, [
      row(CLUB.clap, '.... x... .... x...'),
      row(CLUB.shaker, 'o-x- o-x- o-x- o-x-'),
      row(CLUB.hat, '..o. ..o. ..o. ..o.'),
    ]),
  }),
]

// One crash and nothing after it.
const CRASHES: readonly FactorySound[] = [
  sound({
    id: 'club-crash-on-the-one',
    number: 436,
    name: 'Crash on the one',
    // One stroke in four bars is one hit to the analysis: a loop on a beat by the bank's word,
    // so a stroke of it laid over sixteen bars is a crash on every fourth.
    kind: 'beat',
    description:
      'One club crash on the first beat of four bars and nothing else, a fast fall and a wide wash ringing out, dry.',
    instrument: kit({ kit: FIRM, tune: 0, length: 1.5, snap: 0.45, tone: 0.5, variation: 0 }),
    effects: [],
    ...bars(4, [row(CLUB.crash, `X... .... .... ....${' .... .... .... ....'.repeat(3)}`)]),
  }),
]

/**
 * Every layer keeps the kit's own level (`kitLevel`): the hats are as far under the kick as the kit
 * has them, so layers laid over each other are balanced as one kit with nothing turned down.
 */
export const CLUB_LAYERS: readonly FactorySound[] = [
  ...KICKS,
  ...BACKBEATS,
  ...HAT_ROWS,
  ...SHAKERS_AND_RIDES,
  ...HAND_DRUMS,
  ...TOPS,
  ...CRASHES,
].map((layer) => ({ ...layer, kitLevel: true as const }))
