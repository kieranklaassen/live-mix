// Pitch: shimmer, harmonizer, frequency shifting.

import { type FactoryChain } from '../types'

export const PITCH_CHAINS: readonly FactoryChain[] = [
  {
    id: 'octave-halo',
    name: 'Octave halo',
    category: 'pitch',
    description: 'A long reverb that climbs an octave on every pass, a soft choir above the notes.',
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { shimmer: 0.65, decay: 12, mix: 0.45 },
      },
    ],
  },
  {
    id: 'harmony-in-thirds',
    name: 'Harmony in thirds',
    category: 'pitch',
    description: 'A third above and a sixth below a single line, in C major, in a small room.',
    effects: [
      { deviceId: 'lattice', preset: 'Diatonic thirds', params: { output: 7 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'octave-cascade',
    name: 'Octave cascade',
    category: 'pitch',
    description: 'Echoes that jump an octave each time they repeat, left and right, into a plate.',
    effects: [
      { deviceId: 'lattice', preset: 'Crystal cascade', params: { output: 5 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'shifter-drift',
    name: 'Shifter drift',
    category: 'pitch',
    description:
      'Partials moved by less than a hertz and fed back: slow beating like detuned tape.',
    effects: [{ deviceId: 'freq-shifter', preset: 'Slow drift' }],
  },
  {
    id: 'rising-fifths',
    name: 'Rising fifths',
    category: 'pitch',
    description: 'A reverb whose tail drifts up a fifth the longer it rings.',
    effects: [{ deviceId: 'bloom-reverb', preset: 'Rising fifths' }],
  },

  {
    id: 'hopping-echoes',
    name: 'Hopping echoes',
    category: 'pitch',
    description:
      'Analog repeats whose clock steps every two echoes, so they leap an octave up and drop back, blurred in a hall.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { feedback: 0.55, mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'wide-halo',
    name: 'Wide halo',
    category: 'pitch',
    description:
      'A sharp copy on the left and a flat copy on the right, darkened and hung in a plate.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Piano haze' },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'detune-spiral',
    name: 'Detune spiral',
    category: 'pitch',
    description: 'Repeats that climb on the left and sink on the right as they blur into a hall.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Spiral', params: { feedback: 0.55 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slowed-under',
    name: 'Slowed under',
    category: 'pitch',
    description:
      'Your playing again an octave down at half speed, dark and continuous, under the dry signal and into a plate.',
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'half-time-chops',
    name: 'Half time chops',
    category: 'pitch',
    description:
      'Half-second chunks of what you play, an octave down and half as fast, repeating as a rhythm with a quiet tape echo behind.',
    effects: [
      { deviceId: 'half-speed', preset: 'Slow chops' },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'octave-above',
    name: 'Octave above',
    category: 'pitch',
    description: 'A clean octave up beside the dry sound, softened by a plate.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave up', params: { mode: 3, mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'pad-fifth-halo',
    name: 'Pad fifth halo',
    category: 'pitch',
    description: 'A wide fifth above held chords, every note moved cleanly, blurred in a plate.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad fifth' },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'interval-ghosts',
    name: 'Interval ghosts',
    category: 'pitch',
    description:
      'A cave whose echoes jump by fourths and fifths on their own, softened by a plate.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Intervals', params: { mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'chord-organ',
    name: 'Chord organ',
    category: 'pitch',
    description:
      'Every note of a chord doubled an octave and two below and above, like drawbars, in a plate.',
    effects: [
      { deviceId: 'octaves', preset: 'Organ' },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'octave-swell',
    name: 'Octave swell',
    category: 'pitch',
    description: 'The playing disappears and its octaves fade in after each note, held in a hall.',
    effects: [
      { deviceId: 'octaves', preset: 'Swell pad' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
]
