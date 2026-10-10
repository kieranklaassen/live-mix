import { type FactoryPreset } from '../types'

export const WEST_COAST_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'wooden-plucks-echo',
    name: 'Wooden plucks and echo',
    category: 'plucked',
    description:
      'Woody plucks through a low-pass gate, with a quiet tape echo behind them and a small dark room.',
    instrument: { deviceId: 'west-coast', preset: 'Wooden pluck', params: { volume: -1.5 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'gate-glass-bells',
    name: 'Glass gate bells',
    category: 'bell',
    description:
      'Clangorous bell strikes that dull to a pure ring, widened a little and left in a still room.',
    instrument: { deviceId: 'west-coast', preset: 'Glass bell', params: { volume: -1 } },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener' },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'folding-drone-space',
    name: 'Folding drone',
    category: 'drone',
    description:
      'A low fifth that swells in and keeps folding over itself, on tape, in a very large space.',
    instrument: { deviceId: 'west-coast', preset: 'Folding drone', params: { volume: -8 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'slow-bloom-pad',
    name: 'Slow bloom',
    category: 'pad',
    description:
      'A chord that opens slowly, its overtones blooming with the gate, in an ensemble chorus and a blooming reverb.',
    instrument: { deviceId: 'west-coast', preset: 'Slow bloom', params: { volume: -9 } },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } },
      { deviceId: 'bloom-reverb', preset: 'Bloom', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'bright-gate-harp',
    name: 'Bright gate harp',
    category: 'plucked',
    preview: 'chord',
    description:
      'A bright strummed chord, each string a little different from the last, ringing into a plain hall.',
    instrument: { deviceId: 'west-coast', preset: 'Bright harp', params: { volume: -8.5 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'gate-thumb-piano',
    name: 'Gate thumb piano',
    category: 'plucked',
    description:
      'A short tine whose high overtones dull at once as the gate closes, pushed through a little drive, in a small room.',
    instrument: {
      deviceId: 'west-coast',
      params: {
        fold: 0.08,
        symmetry: 0,
        fm: 0.3,
        ratio: 6,
        timbreEnv: 0.35,
        decay: 1.1,
        chance: 0.1,
        drift: 0.1,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'wavefolder-bass',
    name: 'Wavefolder bass',
    category: 'keys',
    preview: 'low',
    description:
      'A low tone with a trace of the octave below, folded at the strike and dull while it is held, warmed by a transformer.',
    instrument: {
      deviceId: 'west-coast',
      params: {
        fold: 0.45,
        symmetry: 0.5,
        fm: 0.25,
        ratio: 0,
        timbreEnv: 0.8,
        attack: 0.002,
        sustain: 0.5,
        colour: 0.4,
        chance: 0.05,
        drift: 0.15,
        volume: -7.5,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'folded-reed-organ',
    name: 'Folded reed organ',
    category: 'organ',
    description:
      'A steady reedy tone from a lopsided fold, held for as long as the keys are, turning slowly in a rotary speaker.',
    instrument: {
      deviceId: 'west-coast',
      params: {
        fold: 0.3,
        symmetry: 0.9,
        fm: 0,
        timbreEnv: 0.15,
        attack: 0.015,
        decay: 0.35,
        sustain: 1,
        colour: 0.5,
        chance: 0.05,
        drift: 0.35,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { spread: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'bowed-fold-strings',
    name: 'Bowed fold strings',
    category: 'string',
    description:
      'A folded chord that swells in like a bow taking the string, each voice wandering a little, softly doubled, in a hall.',
    instrument: {
      deviceId: 'west-coast',
      params: {
        fold: 0.5,
        symmetry: 0.6,
        fm: 0.08,
        timbreEnv: 0.5,
        attack: 0.3,
        decay: 1.5,
        sustain: 0.9,
        chance: 0.1,
        drift: 0.6,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.27 } },
    ],
  },
  {
    id: 'folded-reed-line',
    name: 'Folded reed line',
    category: 'wind',
    description:
      'One reedy voice for a line: a lopsided fold that speaks quickly and brightens as each note opens, with a dark echo in a room.',
    instrument: {
      deviceId: 'west-coast',
      params: {
        fold: 0.3,
        symmetry: 1,
        ratio: 1,
        timbreEnv: 0.8,
        attack: 0.07,
        decay: 0.45,
        sustain: 0.85,
        chance: 0.1,
        drift: 0.45,
        volume: -5,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { spread: 0.2, mix: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sine-keys-cassette',
    name: 'Sine keys, cassette',
    category: 'keys',
    description:
      'Nearly pure sine keys that ring on quietly while held, wavering and hissing on a cassette, in a still room.',
    instrument: {
      deviceId: 'west-coast',
      params: {
        fold: 0.02,
        symmetry: 0,
        fm: 0,
        timbreEnv: 0.2,
        attack: 0.003,
        decay: 2.4,
        sustain: 0.35,
        colour: 0.45,
        chance: 0.05,
        drift: 0.3,
        volume: -6.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'buzzing-wire-keys',
    name: 'Buzzing wire keys',
    category: 'keys',
    description:
      'Hard folded keys that buzz for as long as they are held and stop short, through a slow phaser, close by.',
    instrument: {
      deviceId: 'west-coast',
      params: {
        fold: 0.7,
        symmetry: 0.35,
        fm: 0,
        timbreEnv: 0.6,
        decay: 0.5,
        sustain: 0.6,
        colour: 0.85,
        chance: 0.1,
        drift: 0.1,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { stereo: 20, mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'tin-clang-chimes',
    name: 'Tin clang chimes',
    category: 'bell',
    description:
      'Thin clanging chimes, each strike different in tone, length and place, with a clean echo in bright air.',
    instrument: {
      deviceId: 'west-coast',
      params: {
        fold: 0.1,
        symmetry: 0,
        fm: 0.4,
        ratio: 5,
        decay: 3,
        colour: 0.9,
        chance: 0.4,
        volume: -5,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Margin', params: { gain: 2.5 } },
    ],
  },
  {
    id: 'low-gate-gong',
    name: 'Low gate gong',
    category: 'bell',
    preview: 'low',
    description:
      'A low clanging strike from deep modulation, more overtone than note, darkening as it rings on for seconds in a cathedral.',
    instrument: {
      deviceId: 'west-coast',
      params: {
        fold: 0.25,
        symmetry: 0.2,
        fm: 0.7,
        ratio: 5,
        timbreEnv: 0.7,
        decay: 8,
        colour: 0.5,
        chance: 0.1,
        drift: 0.4,
        volume: -7,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } }],
  },
  {
    id: 'glass-fold-pad',
    name: 'Glass fold pad',
    category: 'pad',
    description:
      'A glassy chord with faint octaves modulated over each note, rocking between dark and bright in a harmonic tremolo, on a plate.',
    instrument: {
      deviceId: 'west-coast',
      params: {
        fold: 0.2,
        symmetry: 0,
        fm: 0.3,
        ratio: 4,
        timbreEnv: 0.2,
        attack: 0.25,
        decay: 2.5,
        sustain: 0.75,
        colour: 0.8,
        chance: 0.1,
        drift: 0.4,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer' },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'growling-fold-drone',
    name: 'Growling fold drone',
    category: 'drone',
    description:
      'A low fifth growling with deep modulation at its own pitch, its top slowly opened and closed by a filter, in a dark cave.',
    instrument: {
      deviceId: 'west-coast',
      params: {
        symmetry: 0.2,
        fm: 0.65,
        ratio: 1,
        timbreEnv: 0.3,
        attack: 1.2,
        decay: 3,
        sustain: 1,
        chance: 0.1,
        drift: 0.7,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { lfoRateHz: 0.12 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'fold-chord-chopped',
    name: 'Fold chord, chopped',
    category: 'pad',
    description:
      'A bright folded chord chopped on and off four times a second, its pulses repeated by a dark echo in a hall.',
    instrument: {
      deviceId: 'west-coast',
      params: {
        fold: 0.8,
        symmetry: 0.15,
        fm: 0.1,
        timbreEnv: 0.3,
        attack: 0.01,
        decay: 1,
        sustain: 0.8,
        colour: 0.9,
        chance: 0.1,
        drift: 0.3,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Chopper', params: { rate: 4 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 375, mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'hollow-pluck-strings',
    name: 'Hollow pluck strings',
    category: 'plucked',
    description:
      'Hollow plucks with an undertone, and a soft string section that grows out of the notes they leave behind, in a hall.',
    instrument: {
      deviceId: 'west-coast',
      params: {
        fold: 0.2,
        fm: 0.3,
        ratio: 2,
        timbreEnv: 0.5,
        decay: 1.6,
        colour: 0.5,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'String pad', params: { width: 0.4, mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'sine-vowel-choir',
    name: 'Sine vowel choir',
    category: 'voice',
    description:
      'Bare sines that swell in under a second and wander in pitch, sung back as an open ah by the hall behind them.',
    instrument: {
      deviceId: 'west-coast',
      params: {
        fold: 0.05,
        symmetry: 0,
        fm: 0,
        timbreEnv: 0.3,
        attack: 0.9,
        decay: 2.5,
        sustain: 1,
        colour: 0.35,
        chance: 0.1,
        drift: 1,
        volume: -14,
      },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Choir of ah',
        params: { mix: 0.5, motion: 0.15, width: 0.3 },
      },
    ],
  },
  {
    id: 'metal-fold-mist',
    name: 'Metal fold mist',
    category: 'texture',
    description:
      'One held note modulated until it clangs, its fold wandering, smeared into a hanging mist in a large space.',
    instrument: {
      deviceId: 'west-coast',
      params: {
        fold: 0.6,
        symmetry: 0.5,
        fm: 1,
        ratio: 5,
        timbreEnv: 0.3,
        attack: 0.5,
        decay: 3,
        sustain: 1,
        colour: 0.8,
        chance: 0.05,
        drift: 1,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Margin' },
    ],
  },
  {
    id: 'folded-gate-bass',
    name: 'Folded gate bass',
    category: 'bass',
    description:
      'A folded sine struck through a low-pass gate: rich at the strike, then mellow and held a third open, in a small box.',
    instrument: {
      deviceId: 'west-coast',
      params: {
        fold: 0.3,
        symmetry: 0.2,
        fm: 0,
        timbreEnv: 0.5,
        attack: 0.001,
        decay: 1.3,
        sustain: 0.35,
        colour: 0.45,
        chance: 0,
        drift: 0,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Small box', params: { lowCut: 250, mix: 0.2 } },
      { deviceId: 'ambient-limiter', params: { ceiling: -6, gain: 6, ride: 0 } },
    ],
  },
]
