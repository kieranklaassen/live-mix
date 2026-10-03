// Made from another sound: a factory sound played by the granular synth or the sampler.
// Numbers 195 to 200. What every sound here is held to is in docs/factory.md.
//
// The source moves with the key and the phrase keeps its own notes, so the
// key that is played says how far the source is moved: 60 leaves it where it
// is, 48 is an octave down, 67 a fifth up. A source of one note can go to any
// white key that way; a chord or a phrase only by octaves, or by a fifth when
// it has no B (up) or no F (down) in it.

import { breathe, hall } from '../parts'
import { type FactorySound } from '../types'
import { looped, played, sound } from './recipe'

export const MADE: readonly FactorySound[] = [
  sound({
    id: 'gong-wash-a',
    number: 195,
    name: 'Gong wash {A}',
    kind: 'pad',
    description:
      'The gong a fifth up, read backwards in long overlapping grains: a dark wash of metal.',
    source: 'gong-d',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Backwards wash',
      // Grains from the second after the strike, never the strike itself. The
      // gong leans from side to side already, so the grains are kept near the middle.
      params: {
        position: 0.1,
        scan: 0,
        size: 1500,
        density: 10,
        spray: 0.3,
        detune: 4,
        octaves: 0.25,
        attack: 1,
        spread: 0.25,
        tone: 3000,
      },
    },
    effects: [{ deviceId: 'stereo-widener', preset: 'Narrow' }, hall('Hall', 0.45)],
    ...looped(8, 5, 3, [67]),
  }),
  sound({
    id: 'kalimba-glitter-am',
    number: 196,
    name: 'Kalimba glitter {A}m',
    kind: 'melodic',
    description: 'The kalimba pattern cut into short grains and scattered up and down the octaves.',
    source: 'kalimba-pattern-am',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Shimmer',
      // Grains from anywhere in the pattern, an octave up, three in five an octave above or below that.
      params: {
        position: 0.4,
        scan: 0,
        size: 160,
        density: 2,
        spray: 0.9,
        detune: 0,
        octaves: 0.6,
        shape: 0.5,
        reverse: 0.2,
        attack: 0.3,
        spread: 0.8,
        tone: 14000,
      },
    },
    effects: [hall('Hall', 0.35)],
    ...looped(8, 3, 2, [72]),
  }),
  sound({
    id: 'frozen-electric-piano-g',
    number: 197,
    name: 'Frozen electric piano {G}',
    kind: 'pad',
    description:
      'The second chord of the electric piano held still as a cloud of grains: {G} with a ninth.',
    source: 'electric-piano-dm9',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      // Grains from 4.2 to 5.2 s of the phrase: the chord is down, its answer not yet played.
      params: {
        position: 0.55,
        spray: 0.2,
        size: 600,
        density: 12,
        detune: 5,
        attack: 0.5,
        spread: 0.55,
        tone: 6000,
      },
    },
    effects: [hall('Hall', 0.4)],
    ...looped(8, 4, 2, [60]),
  }),
  sound({
    id: 'choir-on-tape-dsus2',
    number: 198,
    name: 'Choir on tape {D}sus2',
    kind: 'pad',
    description:
      'The choir drone on three keys of a sampler, fifths on {D} and {A}, wavering on tape and swelling.',
    source: 'choir-drone-a',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      // The preset plays an octave down and six cents sharp: here the keys say the pitch.
      params: { tune: 0, fine: 0, crossfade: 500 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1, age: 0.05 } },
      breathe(0.125, 0.5),
    ],
    // The swell is lowest 6.5 s after the keys go down: the loop starts on its way up.
    ...looped(8, 7, 2, [53, [60, 0.8], [65, 0.6]]),
  }),
  sound({
    id: 'half-speed-bells-c',
    number: 199,
    name: 'Half-speed bells {C}',
    kind: 'melodic',
    description: 'The bell phrase an octave down at half speed, every stroke twice as long.',
    source: 'bell-phrase-c',
    instrument: {
      deviceId: 'sampler',
      preset: 'One shot',
      params: { tone: 9000, wobble: 0.25, release: 0.5 },
    },
    // The halo of the phrase has more side than mid for seconds at a time: narrowed before the hall.
    effects: [{ deviceId: 'stereo-widener', preset: 'Narrow' }, hall('Hall', 0.25)],
    // Half speed makes the eight seconds sixteen; the last of them is silence and is left off.
    ...played(15, [[0, 14.8, 48]], 1),
  }),
  sound({
    id: 'vibraphone-chord-em7',
    number: 200,
    name: 'Vibraphone chord {E}m7',
    kind: 'oneshot',
    description:
      'The one vibraphone bar struck on four keys of a sampler: a low, open {E} minor seventh.',
    source: 'vibraphone-g',
    instrument: {
      deviceId: 'sampler',
      preset: 'One shot',
      params: { tone: 9000, wobble: 0.2, release: 0.5 },
    },
    effects: [{ deviceId: 'fet-limiter', preset: 'Drive' }, hall('Hall', 0.3)],
    ...played(
      8,
      [
        [0, 7.8, 45, 0.8],
        [0.012, 7.8, 52, 0.7],
        [0.024, 7.8, 55, 0.65],
        [0.036, 7.8, 60, 0.6],
      ],
      1.5,
    ),
  }),
]
