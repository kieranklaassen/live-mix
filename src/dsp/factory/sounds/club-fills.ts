// Fills on the Club Kit: a bar or two that keep time and end. Numbers 437 to 442.
// Every one keeps time (`bpm`, ../tempo.ts) and is written in rows (./rhythm.ts).
// What every sound here is held to is in docs/factory.md.
//
// A fill is whole bars played once from a bar line (`barsOnce`): it is laid in the last bar before
// a change, over a groove or in place of its top, and is over on the bar line it ends at. Each
// gets louder or closer towards its end, and its last stroke is on the last sixteenth or the one
// before it, never on the bar line: the downbeat belongs to what comes next. The kit's drums are
// set shorter than they come, so that the last stroke has rung out before the bar line at 120 and
// the fade there has nothing to cut.

import { type PatchDevice } from '../../../core/devices/patch'
import { type FactorySound } from '../types'
import { sound } from './recipe'
import { barsOnce, CLUB, row } from './rhythm'

/** The four characters of the kit (`kit` in cpp/devices/club-kit/device.json). */
const FIRM = 0
const DUSTY = 2
const BRIGHT = 3

const kit = (params: Readonly<Record<string, number>>): PatchDevice => ({
  deviceId: 'club-kit',
  params,
})

/**
 * Every fill keeps the kit's own level (`kitLevel`), as the layers do: it is one part of a kit laid
 * over a groove, and its snare or its clap then meets the groove's own within a few dB with
 * nothing turned down.
 */
export const CLUB_FILLS: readonly FactorySound[] = [
  sound({
    id: 'club-snare-roll-fill',
    number: 437,
    name: 'Snare roll fill',
    kind: 'beat',
    description:
      'One bar of a firm short house snare, in eighths that close up to sixteenths halfway and get louder to the last one.',
    instrument: kit({ kit: FIRM, tune: 0, length: 0.5, snap: 0.5 }),
    effects: [],
    ...barsOnce(1, [row(CLUB.snare, '-.-. o.o. ooxx xxXX')]),
  }),
  sound({
    id: 'club-snare-build',
    number: 438,
    name: 'Snare build, two bars',
    // The thirty-seconds hide the tempo from the analysis: a beat by the bank's word.
    kind: 'beat',
    description:
      'Two bars of a dusty short club snare in quarters, then eighths, then sixteenths, then twice as fast again for the last half bar, rising.',
    instrument: kit({ kit: DUSTY, tune: 0, length: 0.55, snap: 0.5 }),
    effects: [],
    ...barsOnce(2, [
      row(CLUB.snare, '-... -... o.o. o.o. oooo xxxx .... ....'),
      // The last thirty-second is left out: the last stroke is on the last sixteenth.
      row(CLUB.snare, `${'.'.repeat(48)}xxxx xxxX XXXX XXX.`, { per: 32 }),
    ]),
  }),
  sound({
    id: 'club-conga-fill',
    number: 439,
    name: 'Conga fill',
    kind: 'beat',
    description:
      'One bar of the two club congas in sixteenths, from the high one down to the low one and back up, louder towards the end.',
    instrument: kit({ kit: FIRM, tune: 0, length: 0.8, punch: 0.5, snap: 0.5 }),
    effects: [],
    ...barsOnce(1, [
      row(CLUB.highConga, 'o-.. o... ..xo .XX.'),
      row(CLUB.lowConga, '..o- .o-o xo.. X...'),
    ]),
  }),
  sound({
    id: 'club-clap-roll-fill',
    number: 440,
    name: 'Clap roll fill',
    kind: 'beat',
    description:
      'One bar with a short dusty house clap on two, then four claps in sixteenths that get louder into the bar line.',
    instrument: kit({ kit: DUSTY, tune: 0, length: 0.3, snap: 0.5 }),
    effects: [],
    ...barsOnce(1, [row(CLUB.clap, '.... o... .... oxxX')]),
  }),
  sound({
    id: 'club-hat-stutter-fill',
    number: 441,
    name: 'Hat stutter fill',
    // As the snare build: thirty-seconds, so a beat by the bank's word.
    kind: 'beat',
    description:
      'One bar of bright short club hats in sixteenths that double their speed on three, and an open hat on the last offbeat.',
    instrument: kit({ kit: BRIGHT, tune: 0, length: 0.6, snap: 0.5 }),
    effects: [],
    ...barsOnce(1, [
      row(CLUB.hat, 'x-o- x-x- .... ....'),
      row(CLUB.hat, '.... .... .... .... oooo xxxx XXXX ....', { per: 32 }),
      row(CLUB.open, '.... .... .... ..X.'),
    ]),
  }),
  sound({
    id: 'club-kick-snare-fill',
    number: 442,
    name: 'Kick and snare fill',
    kind: 'beat',
    description:
      'One bar of a bright short house kick and snare trading strokes, the kick gone after three and the snare alone and louder into the bar line.',
    instrument: kit({ kit: BRIGHT, tune: 0, length: 0.55, punch: 0.5, snap: 0.5 }),
    effects: [],
    ...barsOnce(1, [row(CLUB.kick, 'o... ..o. o... ....'), row(CLUB.snare, '..o. o..o .ox. xxXX')]),
  }),
].map((fill) => ({ ...fill, kitLevel: true as const }))
