// Single hits of the Club Kit: one drum struck once, to paint one at a time. Numbers 451 to 465.
// None keeps time: a hit is the same at every tempo. What every sound here is held to is in docs/factory.md.
//
// The first thirteen are the kit as it stands at its defaults, with Variation at 0 so that a hit is the
// same hit every time it is rendered: a hit painted beside a groove of the same kit is the same drum.
// The stroke is at the very start and is the plain stroke of a row (`x`, 0.8), and each sound is as long
// as its drum needs to ring out, two seconds at the least.
//
// The three kicks alone are struck at the accent (`X`, 1), as the grooves strike theirs
// (./club-grooves.ts). The kit makes a harder stroke louder and brighter, with a deeper fall and more
// click: at the plain stroke the firm kick is a duller kick than any groove's, up to 3 dB apart in a
// third-octave band at the same peak, and as the kit puts them out a kick at the plain stroke is
// 1.5 dB (deep) and 1.9 to 2.7 dB (firm) under the kick of a groove struck at the accent. At the
// accent the firm kick is the kick of the groove that leaves Punch and Snap alone, sample for sample,
// and the deep kick comes out of the kit within 0.1 dB of the kick of the two deep grooves that
// strike theirs at the accent, with more click than theirs.
//
// A kit's notes stay where they are when the key of a piece moves and its `tune` moves instead. `tune`
// is 0 here, where every drum with a pitch is on a white key.

import { type PatchDevice } from '../../../core/devices/patch'
import { type FactorySound } from '../types'
import { played, sound } from './recipe'
import { CLUB } from './rhythm'

/** The characters of the kit these use (`kit` in cpp/devices/club-kit/device.json). */
const FIRM = 0
const DEEP = 1

/** The plain stroke of a row of steps: what `x` is in ./rhythm.ts. */
const STROKE = 0.8
/** The accent of a row of steps: what `X` is. */
const ACCENT = 1

const kit = (params: Readonly<Record<string, number>>): PatchDevice => ({
  deviceId: 'club-kit',
  params: { variation: 0, ...params },
})

/** One stroke of one drum at the very start of a sound `seconds` long. */
const hit = (seconds: number, drum: number, gain = STROKE): ReturnType<typeof played> =>
  played(seconds, [[0, 0.1, drum, gain]])

/**
 * Every hit keeps the kit's own level (`kitLevel`): a hat hit is as far under a kick hit as the kit
 * has it, and a hit laid beside a groove or a layer of the same kit meets the same drum there
 * within a dB or two with nothing turned down.
 */
export const CLUB_HITS: readonly FactorySound[] = [
  sound({
    id: 'club-kick-hit',
    number: 451,
    name: 'Club kick',
    kind: 'oneshot',
    description:
      'The firm kick of the club kit, a sine falling fast onto a low note through a waveshaper, with a click.',
    instrument: kit({ kit: FIRM }),
    effects: [],
    ...hit(2, CLUB.kick, ACCENT),
  }),
  sound({
    id: 'club-deep-kick-hit',
    number: 452,
    name: 'Deep club kick',
    kind: 'oneshot',
    description:
      'The deep kick of the club kit, longer and darker, a sine falling onto a note a tone lower with little click.',
    instrument: kit({ kit: DEEP }),
    effects: [],
    ...hit(2, CLUB.kick, ACCENT),
  }),
  sound({
    id: 'club-clap-hit',
    number: 453,
    name: 'Club clap',
    kind: 'oneshot',
    description:
      'One club clap, four quick bursts of noise through a band pass filter and a short tail, on both sides.',
    instrument: kit({ kit: FIRM }),
    effects: [],
    ...hit(2, CLUB.clap),
  }),
  sound({
    id: 'club-snare-hit',
    number: 454,
    name: 'Club snare',
    kind: 'oneshot',
    description:
      'The firm snare of the club kit, two short tones under a band of noise, in the centre and dry.',
    instrument: kit({ kit: FIRM }),
    effects: [],
    ...hit(2, CLUB.snare),
  }),
  sound({
    id: 'club-rim-hit',
    number: 455,
    name: 'Club rim',
    kind: 'oneshot',
    description:
      'One side stick on the rim of the club kit, two short high partials and a click, a little to the left.',
    instrument: kit({ kit: FIRM }),
    effects: [],
    ...hit(2, CLUB.rim),
  }),
  sound({
    id: 'club-closed-hat-hit',
    number: 456,
    name: 'Closed hat',
    kind: 'oneshot',
    description:
      'One short closed hat of the club kit, six detuned pulses and noise through a high pass filter, dry.',
    instrument: kit({ kit: FIRM }),
    effects: [],
    ...hit(2, CLUB.hat),
  }),
  sound({
    id: 'club-open-hat-hit',
    number: 457,
    name: 'Open hat',
    kind: 'oneshot',
    description:
      'One open hat of the club kit left to ring out, six detuned pulses and noise through a high pass filter.',
    instrument: kit({ kit: FIRM }),
    effects: [],
    ...hit(2, CLUB.open),
  }),
  sound({
    id: 'club-shaker-hit',
    number: 458,
    name: 'Club shaker',
    kind: 'oneshot',
    description:
      'One stroke of the club kit shaker, a short band of high noise with a soft start, a little to the left.',
    instrument: kit({ kit: FIRM }),
    effects: [],
    ...hit(2, CLUB.shaker),
  }),
  sound({
    id: 'club-ride-hit',
    number: 459,
    name: 'Ride hit',
    kind: 'oneshot',
    description:
      'One club ride cymbal ringing out, four high sines for the ping over a quieter wash of pulses.',
    instrument: kit({ kit: FIRM }),
    effects: [],
    ...hit(2, CLUB.ride),
  }),
  // Four seconds to the frame, the stick on the first of them: the reverse crashes are this sound
  // played backwards, and count on both.
  sound({
    id: 'club-crash-hit',
    number: 460,
    name: 'Crash hit',
    kind: 'oneshot',
    description:
      'One club crash cymbal ringing out, six detuned pulses and noise, a hard start and a long wash.',
    instrument: kit({ kit: FIRM }),
    effects: [],
    ...hit(4, CLUB.crash),
  }),
  sound({
    id: 'club-low-conga-hit',
    number: 461,
    name: 'Low conga',
    kind: 'oneshot',
    description:
      'The low conga of the club kit, a sine with a small fall in pitch, a fifth over it and a slap.',
    instrument: kit({ kit: FIRM }),
    effects: [],
    ...hit(2, CLUB.lowConga),
  }),
  sound({
    id: 'club-high-conga-hit',
    number: 462,
    name: 'High conga',
    kind: 'oneshot',
    description:
      'The high conga of the club kit, a fifth above the low one, a sine with a small fall and a slap.',
    instrument: kit({ kit: FIRM }),
    effects: [],
    ...hit(2, CLUB.highConga),
  }),
  sound({
    id: 'club-cowbell-hit',
    number: 463,
    name: 'Cowbell',
    kind: 'oneshot',
    description:
      'The cowbell of the club kit, two pulses a fifth apart through a band pass filter, with a hard start.',
    instrument: kit({ kit: FIRM }),
    effects: [],
    ...hit(2, CLUB.cowbell),
  }),
  // The two that are not dry. The hall is levelled, so the drum keeps its peak and the tail sits under
  // it. The clap's is a long one, 60 dB down three and a half seconds on.
  sound({
    id: 'club-hall-clap-hit',
    number: 464,
    name: 'Clap in a hall',
    kind: 'oneshot',
    description:
      'One club clap in a long hall, its four bursts of noise ringing on for three seconds after it.',
    instrument: kit({ kit: FIRM }),
    effects: [
      { deviceId: 'hall-reverb', preset: 'Hall', params: { preDelay: 40, midDecay: 5, mix: 0.45 } },
    ],
    ...hit(4, CLUB.clap),
  }),
  // The deep kick, whose own ring is the longer: with Length at its longest it is 60 dB down a second
  // and three quarters on, and that is the boom, on the kick's note. The hall is kept under it. A
  // hall's lows ring on the few notes its size gives it, a semitone or so apart down there, and not
  // on the kick's: at a mix of 0.4 what rang on was off the note in most keys.
  sound({
    id: 'club-long-kick-hit',
    number: 465,
    name: 'Kick with a long boom',
    kind: 'oneshot',
    description:
      'The deep club kick at its longest, its low note booming on for two seconds into a dark hall of lows.',
    instrument: kit({ kit: DEEP, length: 4 }),
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: {
          preDelay: 20,
          crossover: 300,
          lowDecay: 3,
          midDecay: 1.2,
          damping: 1500,
          mix: 0.2,
        },
      },
    ],
    ...hit(3, CLUB.kick, ACCENT),
  }),
].map((each) => ({ ...each, kitLevel: true as const }))
