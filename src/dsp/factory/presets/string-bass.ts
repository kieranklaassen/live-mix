import { type FactoryPreset } from '../types'

export const STRING_BASS_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'fingers-left-ringing',
    name: 'Fingers left ringing',
    category: 'bass',
    description:
      'A soft fingered electric bass whose strings ring for a second after the key is let go, on tape, with a small dark room above the bass.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { tone: 0.5, volume: -6.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.7, hiss: 0 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { lowCut: 250, mix: 0.15 } },
    ],
  },
  {
    id: 'deep-fretless-bloom',
    name: 'Deep fretless bloom',
    category: 'bass',
    description:
      'A fretless stroked softly by the neck: every note opens after the pluck and rings long, a reverb swelling in behind it above the bass.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Quiet deep fretless',
      params: { tone: 0.5, growl: 0.9, volume: -1.5 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Bloom', params: { lowCut: 250, mix: 0.25 } }],
  },
  {
    id: 'far-dark-upright',
    name: 'Far dark upright',
    category: 'bass',
    description:
      'A dark upright plucked with the flat of a finger, all body and no edge, heard from the far end of a narrow tunnel, in mono.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark soft upright',
      params: { mute: 0.05, sustain: 14, volume: 1.4 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 2, lowCut: 90, mix: 0.75 } },
    ],
  },
  {
    id: 'thumbed-neck-bass',
    name: 'Thumbed neck bass',
    category: 'bass',
    description:
      'An electric bass plucked with the thumb at the middle of the string: round, hollow, no click, weighted and flattened by a tape preamp.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Thumb at the neck',
      params: { tone: 0.42, release: 0.6, volume: -2 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { drive: 0.3, output: -8.5 } },
    ],
  },
  {
    id: 'long-ringing-upright',
    name: 'Long ringing upright',
    category: 'bass',
    description:
      'An upright set to ring as long as it will, its wooden body well up, while four strings that tune themselves to the line hum on behind.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Long wooden ring',
      params: { position: 0.32, sustain: 20, release: 2, volume: -6.2 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Follow the tune',
        params: { strings: 0, decay: 6, mix: 0.3, width: 0.35 },
      },
    ],
  },
  {
    id: 'flat-strings-foam-mute',
    name: 'Flat strings, foam mute',
    category: 'bass',
    description:
      'Flat strings with the tone rolled off and a little foam under them: a dark thump that is gone in two seconds, edged by a transformer.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark flat strings',
      params: { position: 0.35, mute: 0.1, sustain: 3, volume: 0 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
  },
  {
    id: 'fretless-volume-swell',
    name: 'Fretless volume swell',
    category: 'bass',
    description:
      'A singing fretless with each pluck taken off by a volume pedal, so every note fades in over a third of a second, a chorus above the bass.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { sustain: 12, release: 0.8, volume: 2 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 300, curve: 0.5 } },
      { deviceId: 'chorus', preset: 'Vocal thickener', params: { hpHz: 300 } },
    ],
  },
  {
    id: 'warm-fingered-bass',
    name: 'Warm fingered bass',
    category: 'bass',
    description:
      'The plain fingered electric bass: plucked a quarter of the way along, tone half open, each note held up by a compressor, on a tape preamp.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Warm fingers',
      params: { position: 0.26, tone: 0.5, volume: -4 },
    },
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Pluck tamer',
        params: {
          threshold: -36,
          ratio: 6,
          attack: 30,
          release: 0.3,
          scLowCut: 40,
          makeup: 7,
        },
      },
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { output: -4 } },
    ],
  },
  {
    id: 'fingers-by-the-bridge',
    name: 'Fingers by the bridge',
    category: 'bass',
    description:
      'Fingers hard by the bridge: tight and nasal with the pickup peak well up, through a console channel, with a trace of a tight chamber.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Near the bridge',
      params: { mute: 0, volume: 2.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.12 } },
    ],
  },
  {
    id: 'growling-fretless-chorus',
    name: 'Growling fretless chorus',
    category: 'bass',
    description:
      'A fretless plucked hard near the bridge so the string growls on the board, saturated as tape does, a wide chorus on the overtones only.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Growling fretless',
      params: { position: 0.16, sustain: 7, release: 0.3, volume: -2 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { outputDb: -9 } },
      { deviceId: 'chorus', preset: 'Wide chorus', params: { hpHz: 400, mix: 0.3 } },
    ],
  },
  {
    id: 'round-upright-room',
    name: 'Round upright in a room',
    category: 'bass',
    description:
      'A walking upright: a round pluck with a thump under it and notes that are gone in two seconds, in a small box of a room above the lows.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { sustain: 6, resonance: 0.6, volume: 0.5 },
    },
    effects: [
      {
        deviceId: 'expanse',
        preset: 'Small box',
        params: { lowCut: 150, width: 0.4, mix: 0.3 },
      },
    ],
  },
  {
    id: 'slapped-upright-slapback',
    name: 'Slapped upright slapback',
    category: 'bass',
    description:
      'An upright pulled hard near the bridge, each note gone in a second, pushed into hot tape, with a gated slap of room behind it, in mono.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Slapped upright',
      params: { sustain: 3, volume: 3.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Hot glue', params: { output: -0.5 } },
      { deviceId: 'shaped-reverb', preset: 'Mono slap' },
    ],
  },
  {
    id: 'palm-muted-thud',
    name: 'Palm muted thud bass',
    category: 'bass',
    description:
      'A soft finger with the side of the hand on the strings: a dull thud that is gone in under half a second, pressed hard into tape saturation.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted thud',
      params: { touch: 0.15, position: 0.45, volume: 6 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Soft tape warmth',
        params: { driveDb: 20, outputDb: -12.2 },
      },
    ],
  },
  {
    id: 'bright-pick-combo',
    name: 'Bright pick, combo amp',
    category: 'bass',
    description:
      'A pick near the bridge with the tone open and the pickup peak up, through a driven combo amplifier miked close and straight on.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Bright pick',
      params: { position: 0.15, sustain: 4, resonance: 0.7, volume: -4.5 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: {
          drive: 0.65,
          bass: 0.2,
          treble: 0.3,
          distance: 0.1,
          room: 0.15,
          angle: 0,
          noise: 0,
          output: 0.5,
        },
      },
    ],
  },
  {
    id: 'rattling-pick-pentode',
    name: 'Rattling pick, driven',
    category: 'bass',
    description:
      'A hard pick on strings that rattle against the frets, the pickup peak well up, bitten by a pentode with the top held to six kilohertz.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Pick with a rattle',
      params: { position: 0.16, sustain: 4, volume: -5 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Bite', params: { lowCut: 30, highCut: 6000 } }],
  },
  {
    id: 'muted-pick-dark-spring',
    name: 'Muted pick, dark spring',
    category: 'bass',
    description:
      'A pick on strings under the hand: each note a click and a short thump, rounded by a triode, with a dark mono spring ringing behind it.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted pick',
      params: { mute: 0.5, volume: 3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { output: 2 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'dead-string-pick',
    name: 'Dead string pick',
    category: 'bass',
    description:
      'The hardest and shortest: a pick at the bridge on strings damped dead, a click and a thump 20 dB down in a tenth of a second, on hot tape.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted pick',
      params: {
        touch: 1,
        position: 0.08,
        tone: 1,
        mute: 1,
        release: 0.03,
        resonance: 0.7,
        volume: 6,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Soft tape warmth',
        params: { driveDb: 36, outputDb: -9 },
      },
    ],
  },
  {
    id: 'fretless-tenor-hall',
    name: 'Fretless tenor in a hall',
    category: 'plucked',
    description:
      'A fretless played high on the neck as a melody: soft plucks with the sustain full up, each note singing on for seconds, in a hall.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { position: 0.25, sustain: 20, release: 1.5, volume: -4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'high-upright-pizzicato',
    name: 'High upright pizzicato',
    category: 'plucked',
    description:
      'An upright plucked in thumb position, up where a cello plays: woody notes with a thump under each, glued by a tape preamp, in a chamber.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: {
        touch: 0.4,
        position: 0.2,
        tone: 0.6,
        sustain: 12,
        release: 1,
        resonance: 0.7,
        volume: 1,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { output: -3.5 } },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { width: 0.5, mix: 0.2 } },
    ],
  },
  {
    id: 'sustained-fretless-drone',
    name: 'Sustained fretless drone',
    category: 'drone',
    description:
      'A low fifth on a fretless caught by a sustainer: it comes up in a second, holds level under the keys and fades slowly, in an open space.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { type: 1, touch: 0.3, growl: 0.7, volume: -6 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Sustain pedal',
        params: { attack: 1.5, decay: 20, motion: 0.2, ensemble: 0, lowCut: 30, mix: 0.85 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.6, hiss: 0, output: 2 } },
      { deviceId: 'expanse', preset: 'Open space', params: { lowCut: 200, width: 0.7, mix: 0.35 } },
    ],
  },
]
