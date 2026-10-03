import { type FactoryPreset } from '../types'

export const STRING_MACHINE_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'ensemble-strings-hall',
    name: 'Ensemble strings, hall',
    category: 'string',
    description: 'The seventies string ensemble as it comes, with a long hall behind it.',
    instrument: { deviceId: 'string-machine', preset: 'Ensemble strings' },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } }],
  },
  {
    id: 'slow-tape-strings',
    name: 'Slow tape strings',
    category: 'string',
    description:
      'Strings that take three seconds to arrive, worn by tape and left in a very large room.',
    instrument: { deviceId: 'string-machine', preset: 'Slow strings', params: { width: 0.6 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'phased-string-ensemble',
    name: 'Phased ensemble',
    category: 'string',
    description:
      'The string machine through a slow phaser, the way it was recorded all through the seventies.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { attack: 0.9, release: 3, tone: 4200, width: 0.6, volume: -4 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Slow swirl',
        params: { rate: 0.09, feedback: 45, stereo: 50 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2, decay: 0.7 } },
    ],
  },
  {
    id: 'glass-strings',
    name: 'Glass strings',
    category: 'pad',
    description: 'Only the top octave of the ensemble, with an octave halo above it.',
    instrument: { deviceId: 'string-machine', preset: 'Glass', params: { volume: -12 } },
    effects: [{ deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.4 } }],
  },
  {
    id: 'cello-section',
    name: 'Cello section',
    category: 'string',
    description: 'The low octave alone: a dark section sound for slow bass lines and drones.',
    instrument: { deviceId: 'string-machine', preset: 'Cellos', params: { volume: -5 } },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: -4.5 } },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
    preview: 'low',
  },
  {
    id: 'viola-rank-room',
    name: 'Viola rank room',
    category: 'string',
    description:
      'The middle rank alone with both octaves off, a plain viola register in a small room.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: {
        attack: 0.35,
        release: 1.4,
        low: 0,
        high: 0,
        tone: 2600,
        ensemble: 0.75,
        volume: -6,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room' }],
  },
  {
    id: 'full-rank-ensemble',
    name: 'Full rank ensemble',
    category: 'string',
    description: 'All three octaves full up and bright, quick to speak, close in a small room.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: {
        attack: 0.2,
        release: 1.1,
        low: 1,
        high: 1,
        tone: 4800,
        ensemble: 0.85,
        volume: -13,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.22 } }],
  },
  {
    id: 'quick-ensemble-keys',
    name: 'Quick ensemble keys',
    category: 'keys',
    description:
      'The ensemble with an instant attack and a quick release, for chords played as keys, in a short ambience.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: {
        attack: 0.008,
        release: 0.25,
        low: 0.15,
        high: 0.55,
        tone: 5200,
        ensemble: 0.9,
        speed: 1.2,
        drift: 0.15,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience' }],
  },
  {
    id: 'dim-ensemble-pad',
    name: 'Dim ensemble pad',
    category: 'pad',
    description:
      'The upper octaves with the tone turned well down, the chorus slow and the tuning steady, in a dark hall.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: {
        attack: 1.4,
        release: 3.2,
        low: 0.2,
        high: 0.9,
        tone: 800,
        ensemble: 1,
        speed: 0.35,
        drift: 0.05,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } }],
  },
  {
    id: 'saw-rotary-organ',
    name: 'Saw rotary organ',
    category: 'organ',
    description:
      'Bare sawtooth octaves with the ensemble off and an instant attack, played as an organ through a slow rotary speaker.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: {
        attack: 0.005,
        release: 0.1,
        low: 1,
        high: 0.7,
        tone: 2200,
        drift: 0,
        volume: -15.5,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'quivering-ensemble',
    name: 'Quivering ensemble',
    category: 'string',
    description:
      'The ensemble chorus at twice its speed, a fast nervous shimmer on bright strings, in an airy hall.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: {
        attack: 1.2,
        release: 3.5,
        low: 0.3,
        high: 0.8,
        tone: 6500,
        ensemble: 1,
        speed: 2,
        drift: 0.1,
        volume: -10.5,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } }],
  },
  {
    id: 'string-lead-echo',
    name: 'String lead echo',
    category: 'string',
    description:
      'A quick, thin string voice for single lines, only half in the chorus, with dark repeats behind it.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: {
        attack: 0.07,
        release: 0.5,
        low: 0,
        high: 0.45,
        tone: 3400,
        ensemble: 0.4,
        speed: 1.4,
        drift: 0.6,
        width: 0.5,
        volume: -3,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
    preview: 'line',
  },
  {
    id: 'tremolando-ensemble',
    name: 'Tremolando ensemble',
    category: 'string',
    description:
      'A dark full section shivering as if every bow played tremolo, a fast flutter of the level, in a cathedral.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: {
        release: 1.6,
        low: 0.7,
        high: 0.7,
        tone: 1500,
        ensemble: 0.6,
        drift: 0.5,
        volume: -6,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { rate: 10, depth: 0.85, shape: 1, phase: 60, drift: 0.35 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'paraphonic-brass',
    name: 'Paraphonic brass',
    category: 'keys',
    description:
      'Nearly dry saws through one shared filter that opens as keys go down, then a valve stage: string machine brass.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: {
        attack: 0.03,
        release: 0.45,
        low: 0.6,
        high: 0,
        tone: 12000,
        ensemble: 0.2,
        drift: 0.2,
        width: 0.5,
        volume: 3,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: {
          cutoffHz: 600,
          resonance: 1.4,
          envAmount: 100,
          envAttackMs: 120,
          envReleaseMs: 400,
        },
      },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 5, outputDb: -13.5 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'sympathetic-stabs',
    name: 'Sympathetic stabs',
    category: 'keys',
    description:
      'Short dry string stabs that set a bank of tuned strings ringing on after each one.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: {
        attack: 0.005,
        release: 0.12,
        low: 0.5,
        tone: 3000,
        ensemble: 0.5,
        width: 0.6,
        volume: -11,
      },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { sympathy: 0.8, decay: 5, mix: 0.5, width: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
    preview: 'bells',
  },
  {
    id: 'long-swell-ensemble',
    name: 'Long swell ensemble',
    category: 'string',
    description:
      'A very slow swell, still rising after four seconds and as slow to leave, far off in an open valley.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: {
        attack: 6,
        release: 10,
        low: 0.3,
        high: 0.5,
        tone: 2800,
        ensemble: 0.9,
        speed: 0.3,
        drift: 0.4,
        volume: -7,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.55 } }],
  },
  {
    id: 'lossy-ensemble',
    name: 'Lossy ensemble',
    category: 'string',
    description:
      'The ensemble heard over a starving audio stream, quiet detail thrown away and the rest warbling, then played out into a hall.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: {
        attack: 0.8,
        release: 2.5,
        low: 0.25,
        high: 0.5,
        tone: 4000,
        drift: 0.5,
        width: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'low-bitrate',
        preset: 'Underwater',
        params: { loss: 0.72, smear: 0, highCut: 6000 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'ensemble-on-shellac',
    name: 'Ensemble on shellac',
    category: 'string',
    description:
      'A mono ensemble in a small room, cut to a shellac record with its narrow band, crackle and surface hiss.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: {
        attack: 0.45,
        release: 1.5,
        low: 0.2,
        high: 0.5,
        tone: 3000,
        ensemble: 0.7,
        speed: 0.9,
        width: 0,
      },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Room' },
      { deviceId: 'vinyl', preset: 'Parlour 78' },
    ],
  },
  {
    id: 'string-machine-fog',
    name: 'String machine fog',
    category: 'texture',
    description:
      'All three octaves, slow and loose in tune, ground into a dense fog of grains that hangs on long after the keys.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: {
        attack: 1.5,
        release: 5,
        low: 1,
        high: 1,
        tone: 1800,
        ensemble: 1,
        speed: 0.25,
        drift: 1,
        volume: -13,
      },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Thick fog', params: { spread: 0.6, mix: 0.7 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'drifting-saw-drone',
    name: 'Drifting saw drone',
    category: 'drone',
    description:
      'The low octave at full drift under a dark filter, a ten stage phaser crawling through it in a vast nave.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: {
        attack: 3,
        release: 12,
        low: 1,
        high: 0.25,
        tone: 500,
        ensemble: 1,
        speed: 0.3,
        drift: 1,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { stereo: 15, mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.4 } },
    ],
  },
]
