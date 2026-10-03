// Pads of sections and ensembles: strings, voices, brass and winds holding a chord of the white keys.
// Numbers 154 to 160. What every sound here is held to is in docs/factory.md.
//
// A chord is voiced the way a section is scored, the root lowest, a fifth over
// it in all but the close harmony of the choir on tape, and the colour above.
// Every sound keeps its players close in tuning with little vibrato and little
// air: detuned players and noise on the upper notes are what the analysis
// stops hearing as pitch.

import { breathe, quarterTurn, zita } from '../parts'
import { type FactorySound } from '../types'
import { looped, sound } from './recipe'

export const PADS_ACOUSTIC: readonly FactorySound[] = [
  sound({
    id: 'chamber-strings-em7',
    number: 154,
    name: 'Chamber strings {E}m7',
    kind: 'pad',
    description:
      'Six half-muted players on each note of {E} minor seventh in a hall, swelling once every 16 s.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 1.2, air: 0.05, vibrato: 4, scatter: 0.2, mute: 0.5 },
    },
    effects: [zita('Hall', 0.4), breathe(0.0625, 0.45)],
    // Cellos on {E} and {B}, a viola, two violins. The swell reaches its top 5 s after the bows
    // start: the loop begins just under it, with the attack over and the hall full.
    ...looped(16, 4, 3, [40, 47, [55, 0.8], [62, 0.8], [67, 0.6]]),
  }),
  sound({
    id: 'low-brass-fifths-f',
    number: 155,
    name: 'Low brass fifths on {F}',
    kind: 'pad',
    description:
      'Trombones and tuba on open fifths over a low {F}, rising and sinking in a dark hall.',
    instrument: { deviceId: 'horns', preset: 'Low brass choir', params: { attack: 2 } },
    effects: [
      { deviceId: 'zita-rev1', preset: 'Dark hall', params: { mix: 0.45 } },
      breathe(0.0625, 0.5),
    ],
    ...looped(16, 4, 3, [41, 48, [53, 0.8], [60, 0.6]]),
  }),
  sound({
    id: 'treble-voices-dsus2',
    number: 156,
    name: 'Treble voices {D}sus2',
    kind: 'pad',
    description:
      'High voices on a closed Oo holding {D}, {A} and {E}, swelling slowly far down a stone nave.',
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { ensemble: 0, vibrato: 0, attack: 0.8, motion: 0.6 },
    },
    effects: [zita('Cathedral', 0.5), breathe(0.0625, 0.45)],
    // These voices are steady tones, and how they meet themselves at the fold depends on where
    // the loop starts: 6 s in, the level over the fold stays within a decibel in every key.
    ...looped(16, 6, 3, [62, 69, [74, 0.7], [76, 0.7]]),
  }),
  sound({
    id: 'tape-choir-am9',
    number: 157,
    name: 'Tape choir {A}m9',
    kind: 'pad',
    description:
      'A choir played from tape in close harmony on {A} minor ninth, with wow and faint hiss, in a small room.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      // Length fully up: the tape under each key never runs out. The tape is no older than
      // the preset's: a worn one drops out, and the analysis hears each return as a hit.
      params: { length: 9, attack: 0.5, vibrato: 0.1, players: 0.2, hiss: 0.3 },
    },
    effects: [zita('Room', 0.25), breathe(0.125, 0.4)],
    // No basses: the harmonics of a low {A} beat fast against these thirds, and the analysis
    // hears the beats as hits.
    ...looped(8, 7, 2, [57, [60, 0.8], [64, 0.8], [67, 0.7], [71, 0.6]]),
  }),
  sound({
    id: 'clarinets-dm7',
    number: 158,
    name: 'Clarinets {D}m7',
    kind: 'pad',
    description:
      'Low clarinets holding {D} minor seventh, hollow and woody, swelling in a small room.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { attack: 0.6, blow: 0.45 },
    },
    effects: [
      // Two turns of the chorus to a loop.
      { deviceId: 'chorus', preset: 'Subtle widener', params: { rate: 0.25 } },
      zita('Room', 0.3),
      breathe(0.125, 0.55),
      quarterTurn(8),
    ],
    ...looped(8, 6.5, 2, [50, 57, [60, 0.8], [65, 0.8]]),
    tuning: 'whole-cycles',
  }),
  sound({
    id: 'high-flutes-gadd9',
    number: 159,
    name: 'High flutes {G}add9',
    kind: 'pad',
    description:
      'Concert flutes blown softly on {G} with an added ninth, high and breathy, in a hall.',
    // Half breath at most: with more air than that the chord is heard as noise.
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { type: 0, breath: 0.5, blow: 0.3, vibrato: 0.1 },
    },
    effects: [zita('Hall', 0.45), breathe(0.125, 0.5), quarterTurn(8)],
    ...looped(8, 7.5, 2, [67, 74, [81, 0.8], [83, 0.7]]),
    tuning: 'whole-cycles',
  }),
  sound({
    id: 'steel-swell-c6',
    number: 160,
    name: 'Steel swell {C}6',
    kind: 'pad',
    description:
      'A pedal steel on {C} sixth in a wide space, swelled in with the volume pedal and left to ring.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      // No bends between neighbouring strings: the grip stays on its notes.
      params: { swell: 2, sustain: 30, range: 0, vibrato: 5 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, modRate: 0.375 } },
      quarterTurn(8),
    ],
    // One grip, held. The loop starts 1.5 s after the pick, half way up the pedal, where the
    // chord is as loud as it is 8 s later: it rises out of its own ring and never stops.
    ...looped(8, 1.5, 1, [48, 55, [64, 0.8], [69, 0.7]]),
    tuning: 'whole-cycles',
  }),
]
