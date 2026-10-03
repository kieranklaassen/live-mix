// Pads of the synthesizers: a chord of the white keys held, with slow movement that comes round with the loop.
// Numbers 147 to 153. What every sound here is held to is in docs/factory.md.

import { breathe, zita } from '../parts'
import { type FactorySound } from '../types'
import { cycled, looped, sound } from './recipe'

export const PADS_SYNTH: readonly FactorySound[] = [
  sound({
    id: 'chorus-pad-em7',
    number: 147,
    name: 'Chorus pad {E}m7',
    kind: 'pad',
    description:
      'A dark chorused polysynth on a low {E} minor seventh, its filter opening once every 8 s.',
    // No sub octave: under the third of the chord it would make a close triad in the bass.
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { sub: 0, cutoff: 2000, envelope: 0, attack: 0.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { slope: 1, cutoffHz: 480, lfoAmount: 45, lfoRateHz: 0.125 },
      },
      zita('Room', 0.2),
      breathe(0.125, 0.25),
    ],
    ...looped(8, 6.5, 2, [40, 47, [55, 0.8], [62, 0.7]]),
  }),
  sound({
    id: 'brass-swell-fadd9',
    number: 148,
    name: 'Brass swell {F}add9',
    kind: 'pad',
    description:
      'Synthesizer brass on {F} with an added ninth, opening and closing once every 16 s in a hall.',
    instrument: { deviceId: 'aurora', preset: 'Slow bloom', params: { release: 5 } },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.0625, spread: 60, mix: 0.3 } },
      zita('Hall', 0.35),
    ],
    // The lows come in under the tail of the pass before and take seven seconds to open.
    ...cycled(
      16,
      [
        [13, 16.5, 41, 0.9],
        [13.5, 16.3, 48, 0.9],
        [15.5, 10.5, 57, 0.8],
        [1, 9.5, 67, 0.7],
        [2.5, 8, 72, 0.6],
      ],
      { crossfadeSec: 1 },
    ),
  }),
  sound({
    id: 'folded-pad-c6',
    number: 149,
    name: 'Folded pad {C}6',
    kind: 'pad',
    description:
      'Sine waves folded into overtones on {C} sixth, close in a small room, swelling every 8 s.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Slow bloom',
      params: { sustain: 1, attack: 1, chance: 0, colour: 0.5, fold: 0.3 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { rate: 0.25 } },
      zita('Room', 0.3),
      breathe(0.125, 0.45),
    ],
    ...looped(8, 7, 2, [48, 55, [64, 0.8], [69, 0.7]]),
  }),
  sound({
    id: 'vowel-pad-am9',
    number: 150,
    name: 'Vowel pad {A}m9',
    kind: 'pad',
    description:
      'A wavetable of vowels on {A} minor ninth, moving through them every 16 s in a huge space.',
    // No sub octave: under the ninth it would be a semitone below the third.
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { rate: 0.0625, sub: 0, attack: 1, spread: 0.5, detune: 9 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
      breathe(0.0625, 0.45),
    ],
    ...looped(16, 15, 3, [45, 52, 60, [67, 0.8], [71, 0.6]]),
  }),
  sound({
    id: 'slow-glass-gadd9',
    number: 151,
    name: 'Slow glass {G}add9',
    kind: 'pad',
    description:
      'High glassy FM tones on {G} with an added ninth, beating in a long plate, swelling every 4 s.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Slow glass',
      params: { attack: 1, decay: 3, spread: 0.25, brightness: 0.5, detune: 6 },
    },
    effects: [
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
      breathe(0.25, 0.4),
    ],
    ...looped(8, 7.5, 2, [[55, 0.7], 67, 74, [81, 0.8], [83, 0.6]]),
  }),
  sound({
    id: 'phased-strings-dsus2',
    number: 152,
    name: 'Phased strings {D}sus2',
    kind: 'pad',
    description:
      'A string ensemble on {D}, {A} and {E} through a phaser that sweeps once every 16 s.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { low: 0.15, ensemble: 0.3, speed: 0.7, tone: 2400 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Slow swirl',
        params: { rate: 0.0625, shape: 0, depth: 70, feedback: 15, stereo: 60 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3, breathDepth: 0 } },
      breathe(0.0625, 0.35),
    ],
    // The loop starts where the sweep and the swell are both at their lowest.
    ...looped(16, 12, 2, [50, 57, 64, [69, 0.7]]),
  }),
  sound({
    id: 'rotary-organ-gsus4',
    number: 153,
    name: 'Rotary organ {G}sus4',
    kind: 'pad',
    description:
      'Organ stops holding {G}, {C} and {D} through a slowly turning speaker, heard across a hall.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { sub: 0.2, octave: 0.5, fifteenth: 0.3, reed: 0.25, attack: 0.4, tone: 4000 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      zita('Hall', 0.3),
      breathe(0.125, 0.45),
    ],
    ...looped(8, 7, 2, [43, 50, 60, [67, 0.8], [74, 0.6]]),
  }),
]
