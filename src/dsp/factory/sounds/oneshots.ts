// One-shots: a single note or one struck chord, starting on its attack and ringing out inside its length.
// Numbers 171 to 184. What every sound here is held to is in docs/factory.md.

import { hall } from '../parts'
import { type FactorySound } from '../types'
import { bells, played, sound } from './recipe'

export const ONESHOTS: readonly FactorySound[] = [
  sound({
    id: 'rubber-bass-c',
    number: 171,
    name: 'Rubber bass {C}',
    kind: 'oneshot',
    description: 'One low {C} on a ladder-filter bass driven hard, the filter closing behind it.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Rubber pluck',
      params: { wave: 0.25, sub: 0, emphasis: 0.4, drive: 1, decay: 3 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Subtle widener' }, hall('Room', 0.2)],
    ...played(3, [[0, 2.7, 36]], 0.2),
  }),
  sound({
    id: 'marimba-g',
    number: 172,
    name: 'Marimba {G}',
    kind: 'oneshot',
    description: 'A soft mallet on a low rosewood bar on {G}, its tube blooming after the stroke.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.25, decay: 1.2 },
    },
    effects: [hall('Room', 0.25)],
    ...played(4, [[0, 3.8, 43]], 0.3),
  }),
  sound({
    id: 'tanpura-pluck-d',
    number: 173,
    name: 'Tanpura pluck {D}',
    kind: 'oneshot',
    description:
      'One pluck of the first string of a tanpura, a {D}, its buzz sliding down the overtones.',
    // The key played is the G above, the Sa the tanpura is tuned to: its first string is the Pa a
    // fourth under it, the D that is heard. The key comes up before the finger goes to the second
    // string, 3 s after the first pluck, so no other string sounds.
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { speed: 12, decay: 14, jawari: 0.85, body: 0.6, spread: 1 },
    },
    effects: [hall('Hall', 0.25)],
    ...played(5, [[0, 2.9, 55]], 0.4),
  }),
  sound({
    id: 'nylon-string-a',
    number: 174,
    name: 'Nylon string {A}',
    kind: 'oneshot',
    description: 'One {A} on a nylon-string guitar under the flesh of a thumb, in a small room.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { sustain: 9, nail: 0, position: 0.36, tone: 0.4 },
    },
    effects: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 16, release: 0.3, ride: 0 },
      },
      hall('Room', 0.35),
    ],
    ...played(4, [[0, 3.7, 57]], 0.4),
  }),
  sound({
    id: 'handpan-f',
    number: 175,
    name: 'Handpan {F}',
    kind: 'oneshot',
    description:
      'One tap on a hand-played steel pan on {F}, its octave and twelfth shimmering in a hall.',
    instrument: { deviceId: 'handpan', preset: 'Halo', params: { decay: 5 } },
    effects: [hall('Hall', 0.4)],
    ...played(5, [[0, 4.7, 53]], 0.4),
  }),
  sound({
    id: 'guitar-chord-em',
    number: 176,
    name: 'Guitar chord {E}m',
    kind: 'oneshot',
    description:
      'Six strings of an electric guitar strummed once on {E} minor, through a warm amp and a spring.',
    instrument: { deviceId: 'guitar', preset: 'Slow strum', params: { strum: 30, warmth: 1 } },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 5, release: 0.3, ride: 0 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3, drive: 0.5 } },
    ],
    ...played(
      6,
      [
        [0, 5.2, 40],
        [0, 5.2, 47],
        [0, 5.2, 52],
        [0, 5.2, 55],
        [0, 5.2, 59],
        [0, 5.2, 64],
      ],
      0.5,
    ),
  }),
  sound({
    id: 'tine-chord-fmaj7',
    number: 177,
    name: 'Tine chord {F}maj7',
    kind: 'oneshot',
    description:
      'A tine piano chord on {F} major seventh, the amplifier moving it from side to side.',
    instrument: { deviceId: 'tine-piano', preset: 'Slow pan', params: { tremolo: 0.5 } },
    effects: [{ deviceId: 'chorus', preset: 'Subtle widener' }, hall('Hall', 0.3)],
    ...played(
      6,
      [
        [0, 4.6, 53, 0.7],
        [0.01, 4.6, 60, 0.6],
        [0.02, 4.6, 64, 0.6],
        [0.03, 4.6, 69, 0.65],
      ],
      0.4,
    ),
  }),
  sound({
    id: 'picked-steel-e',
    number: 178,
    name: 'Picked steel {E}',
    kind: 'oneshot',
    description:
      'One picked note on a steel guitar on {E}, bright and bell-like, with a plate behind it.',
    // The third harmonic is the loudest thing in this note: on a B it would be an F sharp.
    instrument: { deviceId: 'pedal-steel', preset: 'Picked bell', params: { pick: 0.5 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } }],
    ...played(5, [[0, 3.6, 64]], 0.4),
  }),
  sound({
    id: 'church-bell-d',
    number: 179,
    name: 'Church bell {D}',
    kind: 'oneshot',
    description: 'One stroke of a church bell on {D}, its minor third and hum ringing in a nave.',
    // The bell has a partial a major tenth over its strike note as well as the minor third: a
    // black key over any white one. Struck two thirds of the way up, that partial is at its node
    // and does not sound. Over D every other partial is a white key (D F A G B); over E or A the
    // sixth is not, and over C, F or G the minor third itself is not.
    instrument: bells('Church bell', { decay: 10, position: 0.667 }),
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 9, release: 0.3, ride: 0 } },
      hall('Cathedral', 0.35),
    ],
    ...played(8, [[0, 7.8, 62]], 0.6),
  }),
  sound({
    id: 'harp-g',
    number: 180,
    name: 'Harp {G}',
    kind: 'oneshot',
    description:
      'One string of a concert harp on {G}, plucked with the pad of a finger, in a hall.',
    instrument: { deviceId: 'harp', preset: 'Concert harp', params: { decay: 2 } },
    effects: [hall('Hall', 0.3), { deviceId: 'stereo-widener', preset: 'Gently wide' }],
    ...played(4, [[0, 3.6, 67]], 0.3),
  }),
  sound({
    id: 'dulcimer-dsus2',
    number: 181,
    name: 'Dulcimer {D}sus2',
    kind: 'oneshot',
    description: 'Hammers running once up the open strings of a dulcimer on {D}, {E} and {A}.',
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: {
        chord: 5,
        strum: 70,
        body: 2,
        brightness: 0.55,
        position: 0.14,
        courses: 0.8,
        decay: 8,
      },
    },
    effects: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 11, release: 0.3, ride: 0 },
      },
      hall('Hall', 0.35),
    ],
    ...played(5, [[0, 4, 62]], 0.4),
  }),
  sound({
    id: 'chord-harp-am7',
    number: 182,
    name: 'Chord harp {A}m7',
    kind: 'oneshot',
    description:
      'One quick sweep up a strum plate holding {A} minor seventh, through a slow chorus.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { strum: 6, span: 2, sustain: 3.5, pad: 0 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
      hall('Room', 0.3),
    ],
    ...played(
      4,
      [
        [0, 1, 57],
        [0, 1, 60],
        [0, 1, 64],
        [0, 1, 67],
      ],
      0.4,
    ),
  }),
  sound({
    id: 'high-felt-piano-c',
    number: 183,
    name: 'High felt piano {C}',
    kind: 'oneshot',
    description: 'One high {C} on a felted piano with a little of the action, in a small room.',
    // Its own room is off: on some high notes it comes out nearly out of phase.
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { felt: 0.5, thump: 0.15, action: 0.25, resonance: 0, reverbMix: 0, width: 0.3 },
    },
    effects: [hall('Room', 0.3)],
    ...played(3, [[0, 2.8, 84]], 0.3),
  }),
  sound({
    id: 'ice-chime-b',
    number: 184,
    name: 'Ice chime {B}',
    kind: 'oneshot',
    description: 'A short glassy FM chime on a high {B} with a hall ringing on after it.',
    instrument: { deviceId: 'fm-glass', preset: 'Ice chimes', params: { detune: 1, spread: 0.35 } },
    effects: [hall('Hall', 0.35)],
    ...played(3, [[0, 2.8, 95]], 0.3),
  }),
]
