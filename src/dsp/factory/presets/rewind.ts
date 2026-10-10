import { type FactoryPreset } from '../types'

export const REWIND_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'turned-piano-room',
    name: 'Turned piano room',
    category: 'keys',
    description:
      'Piano notes played backwards, each swelling up to its strike and ringing on in a small dark room.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Turned piano',
      params: { snap: 0.2, rise: 0.35, volume: -4 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } }],
  },
  {
    id: 'dead-stop-keys',
    name: 'Dead stop keys',
    category: 'keys',
    description:
      'Short backwards piano notes that climb evenly, land and stop dead, held level by a compressor, close and dry.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Stops dead',
      params: { snap: 0.3, rise: 0.1, volume: -3.5 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
      { deviceId: 'ambient-eq', preset: 'Keys' },
    ],
  },
  {
    id: 'slow-bloom-hall',
    name: 'Slow bloom hall',
    category: 'pad',
    description:
      'A chord that takes four seconds to gather out of its own ghost, lands softly and rings in a plain hall.',
    instrument: { deviceId: 'rewind', preset: 'Slow bloom', params: { volume: -5 } },
    effects: [{ deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.25 } }],
  },
  {
    id: 'bell-from-nowhere',
    name: 'Bell from nowhere',
    category: 'bell',
    description:
      'A bell heard backwards: its hum comes first, the bright partials last, then it rings on in a still room.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Bell arrival',
      params: { swell: 1.8, volume: -1.5 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.25 } }],
  },
  {
    id: 'pluck-played-back',
    name: 'Pluck played back',
    category: 'keys',
    description:
      'Plucked strings turned round, a quick swell in and a short ring, repeated softly by a tape echo.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Pluck back',
      params: { snap: 0.4, tail: 0.3, volume: -3.5 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.35 } }],
  },
  {
    id: 'gathering-bowl',
    name: 'Gathering bowl',
    category: 'pad',
    description:
      'A singing bowl that gathers for five seconds out of a wide wash, then rings forwards into open space.',
    instrument: { deviceId: 'rewind', preset: 'Bowl gather', params: { snap: 0, volume: 0 } },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } }],
    preview: 'hold',
  },
  {
    id: 'let-go-keys',
    name: 'Let go keys',
    category: 'keys',
    description:
      'Backwards piano that hovers while a key is held and lands as it lets go, with slow chorus and a spring.',
    instrument: { deviceId: 'rewind', preset: 'Let go', params: { snap: 0.15, volume: -1.5 } },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'held-bowl-choir',
    name: 'Held bowl choir',
    category: 'texture',
    description:
      'A bowl held just short of its strike for as long as the key is down, with faint voices in the room behind.',
    instrument: { deviceId: 'rewind', preset: 'Held bowl', params: { volume: 0.5 } },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Faint voices', params: { mix: 0.25 } }],
  },
  {
    id: 'short-swell-slap',
    name: 'Short swell slap',
    category: 'keys',
    description:
      'A fifth of a second of backwards piano into a strike with a short ring, answered by a slap echo in a bright chamber.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Snap shut',
      params: { snap: 0.5, rise: 0.3, tail: 0.2, volume: -3 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'worn-reel-return',
    name: 'Worn reel return',
    category: 'keys',
    description:
      'Dark backwards piano on an unsteady reel, its pitch drifting and beating, through worn tape.',
    instrument: { deviceId: 'rewind', preset: 'Worn reel', params: { volume: -4.5 } },
    effects: [{ deviceId: 'tape', preset: 'Worn thin' }],
  },
  {
    id: 'ghost-room-swarm',
    name: 'Ghost room swarm',
    category: 'pad',
    description:
      'A chord whose backwards room comes up long before it, gathers into the strike and scatters after.',
    instrument: { deviceId: 'rewind', preset: 'Ghost room', params: { volume: -4 } },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Faint scatter', params: { mix: 0.2 } }],
  },
  {
    id: 'late-surge-air',
    name: 'Late surge air',
    category: 'keys',
    description:
      'Notes held back until the last moment, then surging into the strike, with a faint octave and air above.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Late surge',
      params: { swell: 2, snap: 0.3, volume: -3.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave' },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
  },
  {
    id: 'glass-bell-release',
    name: 'Glass bell release',
    category: 'bell',
    description:
      'Beating backwards bells that land as each key lets go and ring on, lifted two octaves into a glass reverb.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Beating bells',
      params: { snap: 0.1, tail: 0.8, volume: 0 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.35 } }],
    preview: 'line',
  },
  {
    id: 'soft-return-haze',
    name: 'Soft return haze',
    category: 'keys',
    description:
      'Round, dark backwards piano with no hammer in it, arriving smoothly and widened into a soft haze.',
    instrument: { deviceId: 'rewind', preset: 'Soft return', params: { volume: -5.5 } },
    effects: [{ deviceId: 'stereo-detune', preset: 'Piano haze' }],
  },
  {
    id: 'mirror-note-pedal',
    name: 'Mirror note pedal',
    category: 'keys',
    description:
      'Each piano note backwards and then forwards, one second in and its whole decay out, over a held pedal.',
    instrument: { deviceId: 'rewind', preset: 'Mirror note', params: { volume: -5.5 } },
    effects: [{ deviceId: 'sympathetic', preset: 'Piano pedal', params: { mix: 0.2 } }],
  },
  {
    id: 'wide-drift-swirl',
    name: 'Wide drift swirl',
    category: 'pad',
    description:
      'Backwards plucks hovering wide and beating while the chord is held, landing on release, in a slow phaser.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Wide drift',
      params: { tail: 0.8, snap: 0.2, volume: -0.5 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.35 } }],
  },
  {
    id: 'backwards-crystals',
    name: 'Backwards crystals',
    category: 'texture',
    description:
      'One backwards note that stops dead at its strike, thrown up an octave in grains that repeat and thin.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Stops dead',
      params: { swell: 1.5, snap: 0.4, rise: 0.25, volume: -0.5 },
    },
    effects: [{ deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.5 } }],
  },
  {
    id: 'mist-before-the-note',
    name: 'Mist before the note',
    category: 'texture',
    description:
      'Four seconds of a blurred, wandering room that only becomes a chord at the very end.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Ghost room',
      params: { swell: 4, snap: 0.1, rise: 0.4, tail: 0.8, volume: -6 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'bell-dub-return',
    name: 'Bell dub return',
    category: 'bell',
    description:
      'Backwards bells that land and are carried off by long, dark, wandering tape repeats.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Bell arrival',
      params: { swell: 1.2, tail: 0.7, snap: 0.2, volume: 0.5 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Dub wash', params: { mix: 0.35 } }],
  },
  {
    id: 'bowl-on-a-rotor',
    name: 'Bowl on a rotor',
    category: 'pad',
    description:
      'A slow line of backwards bowls, each landing and ringing on through a slowly turning speaker.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: { swell: 1.5, ghost: 0.4, volume: -3 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.6 } }],
    preview: 'line',
  },
]
