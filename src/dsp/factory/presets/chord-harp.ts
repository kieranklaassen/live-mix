import { type FactoryPreset } from '../types'

export const CHORD_HARP_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'evening-chord-harp',
    name: 'Evening chord harp',
    category: 'plucked',
    description:
      'A held chord strummed up three octaves of soft electronic strings, in a slow chorus and a hall.',
    instrument: { deviceId: 'chord-harp', preset: 'Evening strum', params: { volume: -6 } },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'harp-slow-cascade',
    name: 'Slow harp cascade',
    category: 'plucked',
    description:
      'The chord climbs four octaves one dark string at a time and comes back down, with tape repeats.',
    instrument: { deviceId: 'chord-harp', preset: 'Slow cascade' },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { feedback: 0.5, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'harp-chime-keys',
    name: 'Chime keys',
    category: 'plucked',
    description: 'No strum: every key is one bright electronic pluck, ringing into a long spring.',
    instrument: { deviceId: 'chord-harp', preset: 'Single chimes' },
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'harp-pad-and-sparkle',
    name: 'Pad and sparkle',
    category: 'plucked',
    description:
      'A soft organ chord with its notes scattered above it in no order, wide, in a very large space.',
    instrument: { deviceId: 'chord-harp', preset: 'Pad and sparkle' },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, width: 0.75 } },
    ],
    preview: 'chord',
  },
  {
    id: 'toy-harp-tape',
    name: 'Toy harp on tape',
    category: 'plucked',
    description:
      'A quick downward strum of short, bright strings over two octaves, on tape in a small room.',
    instrument: { deviceId: 'chord-harp', preset: 'Toy harp' },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'chord-harp-chamber',
    name: 'Chord harp chamber',
    category: 'plucked',
    description:
      'A plain upward strum over three octaves of clear strings with no pad under it, in a tight chamber.',
    instrument: {
      deviceId: 'chord-harp',
      params: { strum: 35, tone: 0.55, pad: 0, spread: 0.5, volume: -2.5 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Tight chamber' }],
    preview: 'chord',
  },
  {
    id: 'muted-strum-plate',
    name: 'Muted strum plate',
    category: 'plucked',
    description:
      'Strings damped so each is a short dull tick, every key strumming up three octaves into a clean tape echo and a small plate.',
    instrument: {
      deviceId: 'chord-harp',
      params: { strum: 30, sustain: 0.35, tone: 0.35, pad: 0, volume: 6 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { time: 300, feedback: 0.45, mix: 0.3 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'round-harp-plucks',
    name: 'Round harp plucks',
    category: 'plucked',
    description:
      'No strum and the tone shut: every key is one soft round pluck, close in a small room.',
    instrument: {
      deviceId: 'chord-harp',
      params: { strum: 0, sustain: 3.5, tone: 0.06, pad: 0, spread: 0.35, volume: -4 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } }],
  },
  {
    id: 'chord-harp-organ',
    name: 'Chord harp organ',
    category: 'organ',
    description:
      'The pad layer alone as a soft square organ with octave stops and a tick on each key, in a slow rotating speaker.',
    instrument: {
      deviceId: 'chord-harp',
      params: { strum: 0, sustain: 0.25, tone: 0.4, pad: 1, spread: 0, volume: -22 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Organ' },
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'strum-plate-ripple',
    name: 'Strum plate ripple',
    category: 'plucked',
    description:
      'A very fast run up four octaves and back with the tone wide open, spread from left to right, in a bright plate.',
    instrument: {
      deviceId: 'chord-harp',
      params: { strum: 6, direction: 2, span: 3, tone: 1, pad: 0, spread: 1, volume: -4 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Bright plate', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'chord-harp-drops',
    name: 'Chord harp drops',
    category: 'plucked',
    description:
      'Short bright strings falling one by one from the top of four octaves, far off in a very large open space.',
    instrument: {
      deviceId: 'chord-harp',
      params: {
        strum: 85,
        direction: 1,
        span: 3,
        sustain: 1,
        tone: 0.82,
        pad: 0,
        spread: 0.85,
        volume: 6,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.55 } }],
    preview: 'chord',
  },
  {
    id: 'chord-harp-on-vinyl',
    name: 'Chord harp on vinyl',
    category: 'plucked',
    description:
      'The chord rolled slowly up one octave of soft strings over a faint pad, on a worn record in a hall.',
    instrument: {
      deviceId: 'chord-harp',
      params: { strum: 150, span: 0, sustain: 8, tone: 0.3, pad: 0.1, spread: 0.4, volume: -2 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'chord-harp-radio',
    name: 'Chord harp radio',
    category: 'plucked',
    description:
      'A two octave strum with every string in the centre, on a small medium wave radio with a little static, in a room.',
    instrument: {
      deviceId: 'chord-harp',
      params: { strum: 48, span: 1, sustain: 2, tone: 0.7, pad: 0.1, spread: 0, volume: -4 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio', params: { interference: 0 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'chord',
  },
  {
    id: 'strum-plate-hail',
    name: 'Strum plate hail',
    category: 'plucked',
    description:
      'Very short glassy strings struck in no order across four octaves, pattering on in a swarm of tight echoes.',
    instrument: {
      deviceId: 'chord-harp',
      params: {
        strum: 90,
        direction: 3,
        span: 3,
        sustain: 0.7,
        tone: 0.92,
        pad: 0,
        spread: 1,
        volume: 6,
      },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        preset: 'Glass rain',
        params: { length: 0.3, feedback: 0.8, mix: 0.4 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'chord-harp-held',
    name: 'Chord harp held',
    category: 'pad',
    description:
      'Single long plucks caught and held as a slow string pad that swells in under them, in a hall.',
    instrument: {
      deviceId: 'chord-harp',
      params: { strum: 0, sustain: 8, tone: 0.35, pad: 0, volume: -11 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'twelve-string-plate',
    name: 'Twelve string plate',
    category: 'plucked',
    description:
      'A quick bright two octave strum with every string doubled an octave up and a little out of tune, on a plate.',
    instrument: {
      deviceId: 'chord-harp',
      params: { strum: 9, span: 1, sustain: 7, tone: 0.85, pad: 0, spread: 0.7, volume: -4 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string' },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'harp-keys-and-amp',
    name: 'Harp keys and amp',
    category: 'keys',
    description:
      'No strum: each key is a bright pluck over its own soft held tone, through a small amplifier and its spring.',
    instrument: {
      deviceId: 'chord-harp',
      params: { strum: 0, sustain: 1.6, tone: 0.7, pad: 0.55, spread: 0.5, volume: -12.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room' },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'chord-harp-sympathy',
    name: 'Chord harp sympathy',
    category: 'plucked',
    description:
      'Short single plucks that set a bank of strings tuned to A minor ringing after them, on a small plate.',
    instrument: {
      deviceId: 'chord-harp',
      params: { strum: 0, sustain: 0.9, tone: 0.55, pad: 0, spread: 0.5, volume: -5.5 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { sympathy: 1, strings: 12, decay: 6, mix: 0.4, width: 0.3 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'octave-ladder-chime',
    name: 'Octave ladder chime',
    category: 'bell',
    description:
      'A key alone climbs a quick ladder of its own octaves, glassy and high, with a clean echo behind it in a bright hall.',
    instrument: {
      deviceId: 'chord-harp',
      params: { strum: 60, span: 3, tone: 0.88, pad: 0, spread: 0.8, volume: -4.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 360, mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Bright hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'chord-harp-drone',
    name: 'Chord harp drone',
    category: 'drone',
    description:
      'A low held tone with dull strings climbing slowly over it and back, phased, in a reverb that sings a low vowel.',
    instrument: {
      deviceId: 'chord-harp',
      params: {
        strum: 150,
        direction: 2,
        span: 3,
        sustain: 8,
        tone: 0.22,
        pad: 0.7,
        spread: 0.7,
        volume: -5.5,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.4 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks' },
    ],
  },
]
