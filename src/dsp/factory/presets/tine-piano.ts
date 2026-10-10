import { type FactoryPreset } from '../types'

export const TINE_PIANO_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'suitcase-phaser',
    name: 'Suitcase phaser',
    category: 'keys',
    description:
      'The soft electric piano with its tremolo on, through a slow phaser in a small room.',
    instrument: { deviceId: 'tine-piano', preset: 'Soft suitcase', params: { volume: -11.5 } },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'tine-tape-echo',
    name: 'Tines and tape echo',
    category: 'keys',
    description: 'Dark, round tines with three tape heads repeating behind them and a plate.',
    instrument: { deviceId: 'tine-piano', preset: 'Dark felt', params: { volume: -11 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { feedback: 0.65, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bell-tine-chorus',
    name: 'Bell tine chorus',
    category: 'keys',
    description: 'All bell and little bark: a glassy electric piano in a slow chorus and a hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bell: 1, hardness: 0.95, tone: 0.9 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.45 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'night-tines',
    name: 'Night tines',
    category: 'keys',
    description: 'Long tines that drift from side to side and dissolve into a very large space.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { tremolo: 0.6, tremoloRate: 0.45, volume: -16 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45, width: 0.75 } },
    ],
  },
  {
    id: 'rotary-stage-piano',
    name: 'Rotary stage piano',
    category: 'keys',
    description:
      'A stage piano that barks when played hard, through a slowly turning speaker and a spring.',
    instrument: { deviceId: 'tine-piano', preset: 'Barking stage', params: { volume: -13 } },
    effects: [
      {
        deviceId: 'rotary',
        preset: 'Chorale',
        params: { hornDepth: 0.8, drive: 0.5, balance: 0.6, spread: 1 },
      },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'dry-booth-tines',
    name: 'Dry booth tines',
    category: 'keys',
    description:
      'The tine piano as it is, tremolo off and a little bark on hard notes, close in a small dry room.',
    instrument: {
      deviceId: 'tine-piano',
      params: {
        bell: 0.5,
        bark: 0.45,
        hardness: 0.85,
        tremolo: 0,
        tone: 0.62,
        drive: 0.2,
        volume: -13.5,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
  },
  {
    id: 'pedal-down-tines',
    name: 'Pedal down tines',
    category: 'keys',
    description:
      'Clean tines whose dampers come down slowly, so each note hangs over the next as if the pedal were held, in a hall.',
    instrument: {
      deviceId: 'tine-piano',
      params: {
        bell: 0.55,
        bark: 0.25,
        decay: 1.3,
        release: 3,
        hardness: 0.6,
        tremolo: 0.15,
        tremoloRate: 1.6,
        tone: 0.5,
        drive: 0.1,
        volume: -14.5,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'low-tine-bass',
    name: 'Low tine bass',
    category: 'keys',
    preview: 'low',
    description:
      'The bottom octaves voiced as a bass: no bell, a growl on hard notes, tight dampers, levelled and nearly dry.',
    instrument: {
      deviceId: 'tine-piano',
      params: {
        bell: 0,
        bark: 0.8,
        decay: 0.9,
        release: 0.12,
        hardness: 0.9,
        tremolo: 0,
        tone: 0.5,
        drive: 0.45,
        volume: -11,
      },
    },
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Pluck tamer',
        params: { threshold: -30, scLowCut: 30, makeup: 3 },
      },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'bell-and-bark-tines',
    name: 'Bell and bark tines',
    category: 'keys',
    description:
      'Bell and bark both nearly full with the tone wide open: bright tines that chime and bite when played hard, on a bright plate.',
    instrument: {
      deviceId: 'tine-piano',
      params: {
        bell: 0.95,
        bark: 0.9,
        decay: 1.3,
        release: 0.3,
        hardness: 1,
        tremolo: 0,
        tone: 1,
        drive: 0.1,
        volume: -10,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.28 } }],
  },
  {
    id: 'envelope-wah-tines',
    name: 'Envelope wah tines',
    category: 'keys',
    description:
      'Barking tines played hot into a resonant filter that springs open on each strike and slides shut as the note fades, through a small amp.',
    instrument: {
      deviceId: 'tine-piano',
      params: {
        bell: 0.2,
        bark: 1,
        decay: 0.8,
        release: 0.1,
        hardness: 1,
        tremolo: 0,
        tone: 0.9,
        drive: 0.5,
        volume: 3,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Touch wah',
        params: { cutoffHz: 200, resonance: 3.5, driveDb: 0, envAmount: 100, mix: 0.65 },
      },
      { deviceId: 're-amp', preset: 'Combo in a room', params: { distance: 0.15, output: -6.5 } },
    ],
  },
  {
    id: 'reedy-tremolo-keys',
    name: 'Reedy tremolo keys',
    category: 'keys',
    description:
      'All bark and no bell, short notes under a quick, nearly mono tremolo, voiced like a reed piano, with one dark spring.',
    instrument: {
      deviceId: 'tine-piano',
      params: {
        bell: 0,
        bark: 0.9,
        decay: 0.5,
        release: 0.07,
        hardness: 1,
        tremolo: 0.45,
        tremoloRate: 6.5,
        pan: 0.2,
        tone: 0.75,
        drive: 0.3,
        volume: -11,
      },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.2 } }],
  },
  {
    id: 'thumb-tine-plucks',
    name: 'Thumb tine plucks',
    category: 'plucked',
    description:
      'Tines that die away in a moment, plucked like a thumb piano, ringing on in a small bright tank.',
    instrument: {
      deviceId: 'tine-piano',
      params: {
        bell: 0.85,
        bark: 0.1,
        decay: 0.25,
        release: 0.05,
        hardness: 0.5,
        tremolo: 0,
        tone: 0.8,
        drive: 0,
        volume: -9.5,
      },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { size: 0.7, mix: 0.25 } },
    ],
  },
  {
    id: 'fluttering-tines',
    name: 'Fluttering tines',
    category: 'keys',
    description:
      'Bell tines thrown from side to side nine times a second by the tremolo at full depth, in a hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: {
        bell: 0.7,
        decay: 2,
        release: 0.8,
        tremolo: 1,
        tremoloRate: 9,
        tone: 0.65,
        volume: -14.5,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall' }],
  },
  {
    id: 'dub-tine-stabs',
    name: 'Dub tine stabs',
    category: 'keys',
    preview: 'chord',
    description:
      'A chord that is gone in a moment however long it is held, thrown into dotted tape repeats and a dark spring.',
    instrument: {
      deviceId: 'tine-piano',
      params: {
        bell: 0.15,
        bark: 0.55,
        decay: 0.3,
        release: 0.05,
        hardness: 0.8,
        tremolo: 0,
        tone: 0.5,
        drive: 0.3,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Dub wash',
        params: { feedback: 0.7, spread: 0, mix: 0.45 },
      },
      { deviceId: 'spring-reverb', preset: 'Dub send', params: { width: 0.4, mix: 0.2 } },
    ],
  },
  {
    id: 'tine-celesta',
    name: 'Tine celesta',
    category: 'bell',
    description:
      'Pure tines with the bell full on and a short ring, heard mostly an octave higher, in a small room.',
    instrument: {
      deviceId: 'tine-piano',
      params: {
        bell: 1,
        bark: 0,
        decay: 0.7,
        release: 1.2,
        hardness: 0.6,
        tremolo: 0,
        tone: 1,
        drive: 0,
        volume: -13,
      },
    },
    effects: [
      {
        deviceId: 'octaves',
        params: { sub1: 0, dry: 0.4, up1: 1, up2: 0.25, detune: 0.1, spread: 0.15 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'hollow-tine-pad',
    name: 'Hollow tine pad',
    category: 'pad',
    description:
      'Pure tones with no bell or bark that ring for a long time, their strikes softened, set back in a dark hall.',
    instrument: {
      deviceId: 'tine-piano',
      params: {
        bell: 0,
        bark: 0,
        decay: 4,
        release: 3,
        hardness: 0.1,
        tremolo: 0,
        tone: 0.3,
        drive: 0,
        volume: -19,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Softened attacks', params: { width: 0 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'tine-organ-growl',
    name: 'Tine organ growl',
    category: 'organ',
    description:
      'Tines that ring as long as they can into an amplifier pushed hard: a sustained growl in a fast rotary speaker.',
    instrument: {
      deviceId: 'tine-piano',
      params: {
        bell: 0,
        bark: 1,
        decay: 4,
        release: 0.08,
        hardness: 1,
        tremolo: 0,
        tone: 0.5,
        drive: 0.8,
        volume: -9.5,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Tremolo' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'night-radio-tines',
    name: 'Night radio tines',
    category: 'keys',
    description:
      'A driven, barking tine piano heard on medium wave at night: narrow, slowly swaying in level, a little static, in a small room.',
    instrument: {
      deviceId: 'tine-piano',
      params: {
        bell: 0.5,
        bark: 0.8,
        hardness: 0.9,
        tremolo: 0,
        tone: 0.75,
        drive: 0.45,
        volume: -8.5,
      },
    },
    effects: [
      {
        deviceId: 'radio',
        params: { band: 0, fading: 0.65, static: 0.15, interference: 0, bandwidth: 0.8 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'tine-cascade',
    name: 'Tine cascade',
    category: 'keys',
    description:
      'Short bell tines whose notes come back as fast glittering repeats an octave and two above, in a hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bell: 0.8, decay: 0.8, release: 0.3, tremolo: 0, tone: 0.7, volume: -12 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Glass rain', params: { spread: 0.6, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'tine-fog-drone',
    name: 'Tine fog drone',
    category: 'drone',
    description:
      'Dark, driven tines that ring on and sway slowly across the speakers, blurred into a cloud of grains in a dark hall.',
    instrument: {
      deviceId: 'tine-piano',
      params: {
        bell: 0,
        bark: 0.75,
        decay: 4,
        release: 3,
        hardness: 0.3,
        tremolo: 0.5,
        tremoloRate: 0.15,
        tone: 0.25,
        drive: 0.6,
        volume: -10.5,
      },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Thick fog', params: { mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'felted-tine-bass',
    name: 'Felted tine bass',
    category: 'bass',
    description:
      'Dark, softly struck low tines that are almost all fundamental, through a valve stage with a little room behind them.',
    instrument: { deviceId: 'tine-piano', preset: 'Dark felt', params: { volume: -14 } },
    effects: [
      { deviceId: 're-amp', preset: 'Just the valves' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.1 } },
    ],
  },
  {
    id: 'barking-tine-bass',
    name: 'Barking tine bass',
    category: 'bass',
    description:
      'Low tines set close to the pickup so that hard notes bark, pushed through a tube preamp, in a small box of a room.',
    instrument: { deviceId: 'tine-piano', preset: 'Barking stage', params: { volume: -12 } },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp' },
      { deviceId: 'expanse', preset: 'Small box', params: { lowCut: 250, mix: 0.15 } },
    ],
  },
]
