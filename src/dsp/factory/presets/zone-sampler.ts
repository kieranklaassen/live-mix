import { type FactoryPreset } from '../types'

// Written for whatever instrument is loaded: a sampled piano, a set of bowed
// notes, a box of bells. The previews play the three built-in tones.
export const ZONE_SAMPLER_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'zone-keys-room',
    name: 'Zone keys',
    category: 'keys',
    description: 'Each key plays its nearest zone, repitched, with a small room around the notes.',
    instrument: { deviceId: 'zone-sampler', preset: 'Keys', params: { volume: -15 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } }],
  },
  {
    id: 'zone-soft-keys',
    name: 'Soft zone keys',
    category: 'keys',
    description: 'The zones played with a slower start and a closed top, on a dark plate.',
    instrument: { deviceId: 'zone-sampler', preset: 'Soft keys', params: { volume: -16 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } }],
  },
  {
    id: 'zone-slow-swell',
    name: 'Zone swell',
    category: 'pad',
    description: 'Every note rises slowly out of its zone and hangs on in a long hall.',
    instrument: { deviceId: 'zone-sampler', preset: 'Slow swell', params: { volume: -18 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.4 } }],
  },
  {
    id: 'zone-short-bright',
    name: 'Short zone notes',
    category: 'plucked',
    description: 'Short open notes from the zones with a dotted echo bouncing behind them.',
    instrument: { deviceId: 'zone-sampler', preset: 'Short and bright', params: { volume: -15 } },
    effects: [{ deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.3 } }],
  },
  {
    id: 'zone-octave-down',
    name: 'Zones an octave down',
    category: 'pad',
    description: 'The whole instrument an octave lower, thickened by a slow chorus in a wide hall.',
    instrument: { deviceId: 'zone-sampler', preset: 'Octave down', params: { volume: -16 } },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.42 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'zone-even-touch',
    name: 'Even zone keys',
    category: 'keys',
    description: 'Every key at one level however hard it is hit, in a bright chamber.',
    instrument: { deviceId: 'zone-sampler', preset: 'Even touch', params: { volume: -15 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.25 } }],
  },
  {
    id: 'zone-tape-keys',
    name: 'Zone keys on tape',
    category: 'keys',
    description:
      'The zones through a tired cassette, a little dull and unsteady, with a short spring.',
    instrument: { deviceId: 'zone-sampler', preset: 'Keys', params: { tone: 5000, volume: -17 } },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'zone-glass-pad',
    name: 'Zone glass pad',
    category: 'pad',
    description:
      'Slow notes from the zones with octaves of glass laid above them and a long plate.',
    instrument: {
      deviceId: 'zone-sampler',
      preset: 'Slow swell',
      params: { attack: 0.6, volume: -17 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves', params: { up1: 0.35, up2: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'zone-halo',
    name: 'Zone halo',
    category: 'texture',
    description:
      'The instrument held under a rising halo, each note opening into the one above it.',
    instrument: {
      deviceId: 'zone-sampler',
      preset: 'Soft keys',
      params: { release: 2.5, volume: -16 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.35 } }],
  },
  {
    id: 'zone-blur',
    name: 'Zone dissolve',
    category: 'texture',
    description: 'Notes from the zones smeared until they run together, in an open space.',
    instrument: {
      deviceId: 'zone-sampler',
      preset: 'Slow swell',
      params: { release: 4, volume: -17 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { width: 0.5, mix: 0.6 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, width: 0.7 } },
    ],
  },
  {
    id: 'zone-low-drone',
    name: 'Low zone drone',
    category: 'drone',
    description: 'The zones two octaves down and held, moving slowly under a glacial filter.',
    instrument: {
      deviceId: 'zone-sampler',
      preset: 'Octave down',
      params: { tune: -24, attack: 2, release: 6, volume: -12 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'zone-tremolo-keys',
    name: 'Trembling zone keys',
    category: 'keys',
    description:
      'The zones with an amplifier tremolo pulsing through each note and a quick spring.',
    instrument: { deviceId: 'zone-sampler', preset: 'Keys', params: { release: 0.8, volume: -12 } },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.65 } },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'zone-reverse-echoes',
    name: 'Zones, backwards echoes',
    category: 'texture',
    description:
      'Each note answered by itself played backwards and an octave up, swelling in behind.',
    instrument: {
      deviceId: 'zone-sampler',
      preset: 'Short and bright',
      params: { release: 0.5, volume: -9 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { pitch: 1, mix: 0.4 } }],
  },
  {
    id: 'zone-radio',
    name: 'Zones on a small radio',
    category: 'keys',
    description:
      'The instrument heard through a kitchen radio, narrow and close, with faint static.',
    instrument: { deviceId: 'zone-sampler', preset: 'Even touch', params: { volume: -18 } },
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio', params: { static: 0.1, interference: 0 } },
    ],
  },
  {
    id: 'zone-driven-keys',
    name: 'Driven zone keys',
    category: 'keys',
    description: 'The zones pushed into a warm valve stage so hard notes thicken, with a slapback.',
    instrument: { deviceId: 'zone-sampler', preset: 'Keys', params: { velocity: 1, volume: -14 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { output: -2.5 } },
      { deviceId: 'analog-delay', preset: 'Slapback' },
    ],
  },
  {
    id: 'zone-fifth-up',
    name: 'Zones a fifth up',
    category: 'bell',
    description: 'The instrument seven semitones higher and short, ringing into a bright plate.',
    instrument: {
      deviceId: 'zone-sampler',
      preset: 'Short and bright',
      params: { tune: 7, release: 0.9, volume: -6 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3 } }],
  },
  {
    id: 'zone-phased-pad',
    name: 'Phased zone pad',
    category: 'pad',
    description:
      'Slow notes from the zones with a slow swirl turning through them and a late hall.',
    instrument: {
      deviceId: 'zone-sampler',
      preset: 'Slow swell',
      params: { tone: 6000, volume: -15 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { stereo: 60, mix: 0.35 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'zone-dark-echo',
    name: 'Zone keys, dark echo',
    category: 'keys',
    description: 'Soft notes from the zones with a dark echo trailing each one into a warm hall.',
    instrument: {
      deviceId: 'zone-sampler',
      preset: 'Soft keys',
      params: { tone: 3000, volume: -16 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.28 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'zone-sustained',
    name: 'Sustained zones',
    category: 'string',
    description: 'Each note caught and held like a bowed string long after the key is let go.',
    instrument: {
      deviceId: 'zone-sampler',
      preset: 'Soft keys',
      params: { attack: 0.15, volume: -17 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings' },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'zone-well',
    name: 'Zones in a well',
    category: 'texture',
    description: 'Notes from the zones dropped into a dark swarm of echoes that patter and fade.',
    instrument: {
      deviceId: 'zone-sampler',
      preset: 'Short and bright',
      params: { tone: 4000, volume: -9 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.35 } }],
  },
]
