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
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'octave-cascade',
    name: 'Octave cascade',
    category: 'pitch',
    description: 'Echoes that jump an octave each time they repeat, left and right, into a plate.',
    effects: [
      { deviceId: 'lattice', preset: 'Crystal cascade', params: { output: 5 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
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
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
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
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
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
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'pad-fifth-halo',
    name: 'Pad fifth halo',
    category: 'pitch',
    description: 'A wide fifth above held chords, every note moved cleanly, blurred in a plate.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad fifth' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
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
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
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
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
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

  {
    id: 'octave-beneath',
    name: 'Octave beneath',
    category: 'pitch',
    description:
      'Every note of a chord doubled an octave below with no delay, kept dark, in a small room.',
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { dry: 0.92, sub1: 0.55 } },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'twelve-string-spring',
    name: 'Twelve string spring',
    category: 'pitch',
    description:
      'Each note paired with a string an octave up and a little out of tune, then a short splash of spring.',
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string', params: { dry: 0.66, up1: 0.43 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'faint-octave-air',
    name: 'Faint octave air',
    category: 'pitch',
    description: 'A faint clean octave above the notes, then a bright hall with a long thin tail.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Faint air' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'sour-unison',
    name: 'Sour unison',
    category: 'pitch',
    description:
      'Sharp and flat copies stacked in the centre so notes beat like an untuned piano, in a mono spring.',
    effects: [
      {
        deviceId: 'stereo-detune',
        preset: 'Thickener',
        params: { detune: 22, drift: 0.3, mix: 0.5 },
      },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring' },
    ],
  },
  {
    id: 'octave-up-choir',
    name: 'Octave up choir',
    category: 'pitch',
    description:
      'An octave above feeds a large hall that sings ah in a soprano voice, a high choir behind the notes.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave up', params: { mode: 3 } },
      { deviceId: 'vowel-reverb', preset: 'High choir', params: { decay: 14, mix: 0.3 } },
    ],
  },
  {
    id: 'bass-choir-below',
    name: 'Bass choir below',
    category: 'pitch',
    description:
      'An octave below feeds a dark hall that sings oh in a bass voice, a low choir under the notes.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad below', params: { mix: 0.45 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.38 } },
    ],
  },
  {
    id: 'mirror-harmony',
    name: 'Mirror harmony',
    category: 'pitch',
    description:
      'A single line gains a voice that falls as it rises, a third above and an answer from the other octave, in a hall.',
    effects: [
      { deviceId: 'lattice', preset: 'Thesis voicing', params: { output: 3.2 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'fixed-note-drone',
    name: 'Fixed note drone',
    category: 'pitch',
    description:
      'A single line is also bent onto a held C and the G below it, a drone that speaks only when you play, in a wide space.',
    effects: [
      { deviceId: 'lattice', preset: 'Two note drone' },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 16, mix: 0.35 } },
    ],
  },
  {
    id: 'ever-rising-tail',
    name: 'Ever rising tail',
    category: 'pitch',
    description:
      'A long plate sent round a shifter that lifts it a hertz and a half each pass, so the tail seems to climb for ever, under a limiter.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
      { deviceId: 'freq-shifter', preset: 'Barber pole', params: { feedback: 0.7, width: 0.6 } },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: -1.5 } },
    ],
  },
  {
    id: 'bells-into-strings',
    name: 'Bells into strings',
    category: 'pitch',
    description:
      'Every partial pushed up 233 hertz into inharmonic bell tones, which set a bank of strings in C major ringing.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Bell metal' },
      { deviceId: 'sympathetic', preset: 'Long ring', params: { decay: 6, mix: 0.5 } },
    ],
  },
  {
    id: 'sinking-repeats',
    name: 'Sinking repeats',
    category: 'pitch',
    description:
      'Grain repeats that drop an octave each time round, some of them backwards, sinking into a dark cave.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling embers' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'two-octave-glitter',
    name: 'Two octave glitter',
    category: 'pitch',
    description:
      'Short grains two octaves up scattered after each note like glints, in a small bright room.',
    effects: [
      { deviceId: 'grain-delay', preset: 'High glitter', params: { density: 1.5, mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'backwards-octaves',
    name: 'Backwards octaves',
    category: 'pitch',
    description:
      'Each phrase returns backwards an octave up, swelling in, and every repeat climbs again, in a bright ringing chamber.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { feedback: 0.45 } },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { decay: 8, mix: 0.28 } },
    ],
  },
  {
    id: 'held-organ-stops',
    name: 'Held organ stops',
    category: 'pitch',
    description:
      'Catches each chord and holds it still, adds octaves below and above like organ stops, then a slow rotary speaker.',
    effects: [
      { deviceId: 'sustainer', preset: 'Glass organ', params: { decay: 6, mix: 0.4 } },
      {
        deviceId: 'octaves',
        preset: 'Cathedral',
        params: { dry: 0.75, sub2: 0.15, sub1: 0.24, up1: 0.3, up2: 0.23 },
      },
      { deviceId: 'rotary', preset: 'Soft blend' },
    ],
  },
  {
    id: 'octave-filter-synth',
    name: 'Octave filter synth',
    category: 'pitch',
    description:
      'Your notes replaced by the octaves below and above them, through a low pass filter that opens on every note like a synth.',
    effects: [
      { deviceId: 'octaves', preset: 'Hollow pair', params: { sub1: 0.6, up1: 0.6, detune: 0.3 } },
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: {
          slope: 1,
          cutoffHz: 500,
          resonance: 3,
          driveDb: 6,
          envAmount: 90,
          envAttackMs: 15,
          envReleaseMs: 350,
        },
      },
    ],
  },
  {
    id: 'bowed-twelfths',
    name: 'Bowed twelfths',
    category: 'pitch',
    description:
      'Attacks removed so notes bow in, levelled, into a long reverb whose tail climbs an octave and a fifth like organ ranks.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 300 } },
      { deviceId: 'fet-limiter', params: { inputGain: 9, outputGain: -6.5 } },
      { deviceId: 'shimmer', preset: 'Organ loft', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'snap-to-key',
    name: 'Snap to key',
    category: 'pitch',
    description:
      'A single line is replaced by a copy pulled onto the notes of the key, so bends land as steps and the cathedral behind rings in tune.',
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Tuned double',
        params: { scale: 0, mix: 100, v1Level: 0, v1Pan: 0, v1Delay: 0, v2Role: 0, output: 3 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'octave-staircase',
    name: 'Octave staircase',
    category: 'pitch',
    description:
      'Each note is replayed as little loops that climb in octaves like a slow arpeggio, over a half speed copy, with a brief halo.',
    effects: [
      { deviceId: 'cascade', preset: 'Slow staircase', params: { time: 420, mix: 0.42 } },
      { deviceId: 'shaped-reverb', preset: 'Short halo' },
    ],
  },
  {
    id: 'sagging-echoes',
    name: 'Sagging echoes',
    category: 'pitch',
    description:
      'Dark analog repeats whose clock is dragged down an octave and let go every four echoes, so they sag flat and whip back sharp, in a spring.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Falling tape', params: { age: 0.15 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'quarter-speed-floor',
    name: 'Quarter speed floor',
    category: 'pitch',
    description:
      'Your playing two octaves down at a quarter of the speed, a slow rumble under the dry sound, in an open valley.',
    effects: [
      { deviceId: 'half-speed', preset: 'Quarter speed', params: { mix: 0.38 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'slow-melt',
    name: 'Slow melt',
    category: 'pitch',
    description:
      'A tail behind each note that sags in pitch, darkens and blurs the longer it rings, like wax running; Sag sets how fast, or lifts it.',
    effects: [{ deviceId: 'melt', preset: 'Slow melt', params: { hold: 7 } }],
  },
  {
    id: 'sparks-evaporating',
    name: 'Sparks evaporating',
    category: 'pitch',
    description:
      'Bright sparks above the playing, and a tail that lifts in pitch and thins as it ages, so everything drifts upward; Sag sets how fast.',
    effects: [
      { deviceId: 'glints', preset: 'First light', params: { density: 8 } },
      { deviceId: 'melt', preset: 'Evaporate' },
    ],
  },
  {
    id: 'drooping-strings',
    name: 'Drooping strings',
    category: 'pitch',
    description:
      'A string section swells in behind each chord, then sags in pitch in fits and starts as it fades; turn Drip down for a steady slide.',
    effects: [
      { deviceId: 'pad-follower', preset: 'String pad' },
      { deviceId: 'melt', preset: 'Wobbly wax' },
    ],
  },
  {
    id: 'octave-round-in-fog',
    name: 'Octave round in fog',
    category: 'pitch',
    description:
      'Each line is repeated an octave up and then an octave down, and every attack is blurred into a slow swell; Gap sets the wait.',
    effects: [
      { deviceId: 'canon', preset: 'Octaves apart' },
      { deviceId: 'fog', preset: 'Slow rise', params: { width: 0.5 } },
    ],
  },
]
