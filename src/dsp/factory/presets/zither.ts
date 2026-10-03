import { type FactoryPreset } from '../types'

export const ZITHER_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'open-zither-hall',
    name: 'Open zither hall',
    category: 'plucked',
    preview: 'chord',
    description:
      'A picked chord zither strummed across open fifths and octaves, on tape, in a plain hall.',
    instrument: { deviceId: 'zither', preset: 'Open zither', params: { volume: -9.5 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'harp-glissando-space',
    name: 'Harp glissando space',
    category: 'plucked',
    preview: 'hold',
    description:
      'Every key sweeps a harp slowly across an added-ninth chord into a very large space.',
    instrument: { deviceId: 'zither', preset: 'Harp glissando', params: { volume: -5 } },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } }],
  },
  {
    id: 'hammered-glass-shimmer',
    name: 'Hammered glass shimmer',
    category: 'plucked',
    preview: 'line',
    description:
      'A hammered dulcimer rolled in octaves, with quiet tape echoes and a glassy shimmer behind it.',
    instrument: { deviceId: 'zither', preset: 'Hammered shimmer' },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'twelve-string-haze-drift',
    name: 'Twelve-string haze',
    category: 'pad',
    description:
      'Wide double strings in octaves that beat slowly, through a drifting chorus into a long dark reverb.',
    instrument: { deviceId: 'zither', preset: 'Twelve-string haze', params: { volume: -4 } },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'koto-three-heads',
    name: 'Koto and three heads',
    category: 'plucked',
    preview: 'bells',
    description:
      'A dry, nasal string plucked near the bridge, answered by three tape heads in a small dark room.',
    instrument: { deviceId: 'zither', preset: 'Koto pluck', params: { volume: -2 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'zither-harp-room',
    name: 'Zither harp, room',
    category: 'plucked',
    description:
      'Single strings over a warm harp board, plucked with a fingertip and never damped, in a small room.',
    instrument: { deviceId: 'zither', preset: 'Concert harp', params: { volume: -10 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } }],
  },
  {
    id: 'plain-zither-plate',
    name: 'Plain zither, plate',
    category: 'plucked',
    description:
      'One paired string per key, plucked with a fingertip over the flat zither box, close and narrow, on a small plate.',
    instrument: { deviceId: 'zither', params: { decay: 8, release: 6, volume: -7.5 } },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Small plate' },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'wire-strung-zither',
    name: 'Wire strung zither',
    category: 'plucked',
    description:
      'Wire strings picked near the bridge and never damped, so they ring on over each other, in a hall.',
    instrument: {
      deviceId: 'zither',
      params: {
        exciter: 1,
        decay: 14,
        release: 20,
        brightness: 0.78,
        position: 0.16,
        courses: 0,
        sympathy: 0.55,
        volume: -8.5,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'muted-zither-pluck',
    name: 'Muted zither pluck',
    category: 'plucked',
    description:
      'Short dull plucks toward the middle of the string, stopped at once by the hand, with one slap echo close behind.',
    instrument: {
      deviceId: 'zither',
      params: {
        decay: 0.8,
        release: 0.08,
        brightness: 0.35,
        position: 0.38,
        courses: 0,
        sympathy: 0,
        volume: -5.5,
      },
    },
    effects: [
      { deviceId: 'stereo-widener', preset: 'Narrow' },
      { deviceId: 'tape-echo', preset: 'Single slap' },
    ],
  },
  {
    id: 'tremolo-pick-zither',
    name: 'Tremolo pick zither',
    category: 'plucked',
    preview: 'line',
    description:
      'A pick kept trembling on one paired string, thirteen strokes a second while the key is held, on tape in a hall.',
    instrument: {
      deviceId: 'zither',
      params: {
        exciter: 1,
        roll: 13,
        decay: 2.5,
        release: 0.5,
        brightness: 0.7,
        position: 0.14,
        courses: 0.55,
        sympathy: 0.2,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'stereo-widener', params: { width: 0.2 } },
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'zither-on-shellac',
    name: 'Zither on shellac',
    category: 'plucked',
    description:
      'Picked pairs of strings tuned well apart, through a valve stage onto a crackling old disc, heard in a room.',
    instrument: {
      deviceId: 'zither',
      params: {
        exciter: 1,
        decay: 3,
        release: 1.5,
        brightness: 0.6,
        position: 0.12,
        courses: 1,
        sympathy: 0.2,
        body: 2,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'vinyl', preset: 'Parlour 78', params: { crackle: 0.45, surface: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'koto-falling-rake',
    name: 'Koto falling rake',
    category: 'plucked',
    preview: 'bells',
    description:
      'A pick raked downward across a suspended chord by the bridge of a hollow koto body, in a bright chamber.',
    instrument: {
      deviceId: 'zither',
      params: {
        exciter: 1,
        chord: 6,
        strum: 240,
        direction: 1,
        decay: 4,
        release: 2.5,
        brightness: 0.7,
        position: 0.09,
        courses: 0,
        sympathy: 0.35,
        body: 3,
        volume: -1.5,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.35 } }],
  },
  {
    id: 'glass-wire-zither',
    name: 'Glass wire zither',
    category: 'plucked',
    preview: 'bells',
    description:
      'A hard pick right at the bridge, thin and glassy, with one and two octaves added above, on a bright plate.',
    instrument: {
      deviceId: 'zither',
      params: {
        exciter: 1,
        decay: 7,
        release: 5,
        brightness: 0.92,
        position: 0.06,
        courses: 0.15,
        sympathy: 0.6,
        body: 2,
        volume: 1.5,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves', params: { up1: 0.35, up2: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'felt-zither-octaves',
    name: 'Felt zither octaves',
    category: 'keys',
    description:
      'Octaves struck together with a soft felt hammer at the middle of the string, dull and round, on a dark plate.',
    instrument: {
      deviceId: 'zither',
      params: {
        exciter: 2,
        chord: 1,
        strum: 0,
        decay: 12,
        release: 9,
        brightness: 0.06,
        position: 0.48,
        courses: 0.15,
        sympathy: 0.4,
        body: 0,
        volume: -9.5,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate' }],
  },
  {
    id: 'low-zither-restruck',
    name: 'Low zither restruck',
    category: 'drone',
    description:
      'Low octave strings struck again softly with felt twice a second while the keys are held, in a huge dark space.',
    instrument: {
      deviceId: 'zither',
      params: {
        exciter: 2,
        chord: 1,
        strum: 300,
        roll: 2,
        decay: 20,
        release: 20,
        brightness: 0.3,
        position: 0.3,
        courses: 0.5,
        sympathy: 0.8,
        body: 0,
        volume: -6.5,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.3 } }],
  },
  {
    id: 'falling-zither-choir',
    name: 'Falling zither choir',
    category: 'plucked',
    preview: 'hold',
    description:
      'Every key draws a pick slowly down a major chord on paired strings, and a hall answers as a high choir of ah.',
    instrument: {
      deviceId: 'zither',
      params: {
        exciter: 1,
        chord: 3,
        strum: 600,
        direction: 1,
        decay: 10,
        release: 20,
        brightness: 0.5,
        courses: 0.4,
        sympathy: 0.4,
        volume: -1.5,
      },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'High choir', params: { mix: 0.55 } }],
  },
  {
    id: 'rotary-zither-strum',
    name: 'Rotary zither strum',
    category: 'plucked',
    description:
      'Fifths and octaves strummed quickly with a pick, shimmering through a fast rotary speaker in a room.',
    instrument: {
      deviceId: 'zither',
      params: {
        exciter: 1,
        chord: 2,
        strum: 25,
        decay: 8,
        release: 4,
        brightness: 0.62,
        position: 0.22,
        courses: 0.1,
        volume: -5,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Guitar swirl', params: { spread: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'zither-grain-cloud',
    name: 'Zither grain cloud',
    category: 'texture',
    description:
      'A hammered string rolled six times a second, grains of it thrown up an octave to left and right, in a hall.',
    instrument: {
      deviceId: 'zither',
      params: {
        exciter: 2,
        roll: 6,
        decay: 3,
        release: 2,
        brightness: 0.5,
        sympathy: 0.5,
        body: 2,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'stereo-widener', preset: 'Narrow' },
      { deviceId: 'grain-cloud', preset: 'Octave rain', params: { mix: 0.55 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'hollow-koto-recalled',
    name: 'Hollow koto recalled',
    category: 'plucked',
    description:
      'A fingertip at the middle of the string over a koto body, round and hollow, with echoes and earlier moments drifting back.',
    instrument: {
      deviceId: 'zither',
      params: {
        decay: 5,
        brightness: 0.45,
        position: 0.5,
        courses: 0,
        sympathy: 0.25,
        body: 3,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Recalling', params: { spread: 0.2 } },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'struck-wire-chimes',
    name: 'Struck wire chimes',
    category: 'bell',
    description:
      'Strings struck at the middle with a hard hammer and never damped, the twelve open strings answering, in a vast nave.',
    instrument: {
      deviceId: 'zither',
      params: {
        exciter: 2,
        decay: 20,
        release: 20,
        brightness: 0.85,
        position: 0.5,
        courses: 0.25,
        sympathy: 1,
        body: 2,
        volume: -14,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.45 } }],
  },
]
