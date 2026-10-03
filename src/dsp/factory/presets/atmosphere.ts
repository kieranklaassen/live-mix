import { type FactoryPreset } from '../types'

export const ATMOSPHERE_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'whistling-wind',
    name: 'Whistling wind',
    category: 'texture',
    description:
      'Gusts through a narrow gap that whistle on the note you hold, heard across a valley.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Whistling gap',
      params: { tone: 0.75, resonance: 0.7, width: 0.7, volume: -2 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.3 } }],
  },
  {
    id: 'rain-on-glass',
    name: 'Rain on glass',
    category: 'texture',
    description:
      'Separate drops on a window pane over a soft hiss, close by, as heard from inside a room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: { density: 0.55, tone: 0.45, width: 0.65, volume: 0 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.9, hiss: 0, output: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'slow-shore',
    name: 'Slow shore',
    category: 'texture',
    description:
      'Waves that build, break into foam and run back, one every eight seconds, with the rumble cut.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Slow shore',
      params: { density: 0.5, tone: 0.65, attack: 2, width: 0.8, volume: -3 },
    },
    effects: [{ deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 90 } }],
  },
  {
    id: 'record-surface',
    name: 'Record surface',
    category: 'texture',
    description: 'The hiss, clicks and turning rumble of an old record with nothing cut into it.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Old record',
      params: { density: 0.45, tone: 0.75, size: 0.1, release: 1.5, width: 0.4, volume: 0 },
    },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { drive: 0.8, wow: 0.4, hiss: 0.4, bump: 0.2, output: 3 },
      },
    ],
  },
  {
    id: 'amp-hum',
    name: 'Amp hum',
    category: 'texture',
    description:
      'An unsteady mains hum tuned to the keys you hold, through a valve stage and a spring tank.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: { density: 0.85, movement: 0.6, tone: 0.7, width: 1, volume: -13 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'wind-harp-strings',
    name: 'Wind harp strings',
    category: 'texture',
    description:
      'Gusts sweep a band of wind up and down strings tuned to the A minor scale, which ring on in a hall.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: {
        density: 0.8,
        movement: 1,
        tone: 0.4,
        resonance: 0.55,
        size: 0.2,
        attack: 1,
        release: 5,
        width: 0.8,
        volume: -2.5,
      },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { sympathy: 1, decay: 6, mix: 0.8 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'keyhole-whistle',
    name: 'Keyhole whistle',
    category: 'wind',
    description:
      'Wind narrowed until it whistles one clear note per key and speaks quickly, in a small room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Whistling gap',
      params: {
        density: 0.9,
        movement: 0.2,
        resonance: 1,
        size: 0.1,
        attack: 0.1,
        release: 0.6,
        width: 0.5,
        volume: -6,
      },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room' }],
  },
  {
    id: 'culvert-wind',
    name: 'Culvert wind',
    category: 'drone',
    description:
      'A low wind with slow heavy gusts and nothing bright in it, with the mono echo of a narrow tunnel.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: {
        density: 0.6,
        movement: 0.9,
        tone: 0.05,
        resonance: 0.2,
        size: 0.55,
        attack: 2.5,
        release: 8,
        width: 0.8,
        volume: -1.5,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel' }],
  },
  {
    id: 'dry-grass-gusts',
    name: 'Dry grass gusts',
    category: 'texture',
    description:
      'Quick bright gusts of hiss, made to rustle by a fast random tremolo, close by with no room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: {
        density: 0.95,
        movement: 0.85,
        tone: 0.92,
        resonance: 0,
        size: 0.05,
        attack: 0.8,
        release: 3,
        width: 0.75,
        volume: 0,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        params: { rate: 13, depth: 0.85, shape: 3, phase: 120, drift: 0.5, smooth: 0.1 },
      },
    ],
  },
  {
    id: 'cistern-drips',
    name: 'Cistern drips',
    category: 'texture',
    description:
      'A few slow drops a second over a soft hum of the held key, falling into a huge dark hollow.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: {
        density: 0.05,
        movement: 0.9,
        tone: 0.1,
        resonance: 0.6,
        size: 0.7,
        attack: 0.3,
        release: 6,
        width: 0.6,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 27, outputDb: -7 } },
      { deviceId: 'swarm-reverb', preset: 'Vast hollow', params: { mix: 0.5, width: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'rain-that-sings',
    name: 'Rain that sings',
    category: 'pad',
    description:
      'Far heavy rain rung through a resonance on every held key, so the downpour hums the chord, on a long plate.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Distant downpour',
      params: {
        density: 0.85,
        tone: 0.2,
        resonance: 1,
        size: 0.6,
        attack: 1.2,
        release: 6,
        width: 0.75,
        volume: -4.5,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
  },
  {
    id: 'squall-on-slates',
    name: 'Squall on slates',
    category: 'texture',
    description:
      'Hard bright rain close overhead, pressed flat by a soft clipper and coming in surges every few seconds, in a tight chamber.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: {
        density: 0.92,
        movement: 1,
        tone: 0.7,
        size: 0.12,
        attack: 1,
        release: 4,
        width: 0.75,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 18, outputDb: -8 } },
      {
        deviceId: 'tremolo',
        preset: 'Gentle breath',
        params: { rate: 0.35, depth: 0.7, drift: 0.5 },
      },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'tide-swell-chord',
    name: 'Tide swell chord',
    category: 'pad',
    description:
      'A wave every five seconds that rings the held keys as it breaks, with the rumble cut, on a plate.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Slow shore',
      params: {
        density: 1,
        movement: 0.75,
        tone: 0.45,
        resonance: 0.85,
        size: 0.3,
        attack: 0.5,
        width: 0.75,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 60 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'shingle-backwash',
    name: 'Shingle backwash',
    category: 'texture',
    description:
      'Bright waves that break hard and close, with a fine crackle that comes up between them like pebbles dragged back.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Slow shore',
      params: {
        density: 0.85,
        movement: 1,
        tone: 0.95,
        size: 0,
        attack: 1,
        release: 6,
        width: 0.75,
        volume: -6,
      },
    },
    effects: [
      {
        deviceId: 'noise-floor',
        preset: 'Gap crackle',
        params: { level: -36, tone: 0.5, hold: 2 },
      },
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 70 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'bonfire-up-close',
    name: 'Bonfire up close',
    category: 'texture',
    description:
      'A big fire close by: a flickering roar with dense crackle across both sides and very little room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hearth',
      params: {
        density: 0.85,
        movement: 0.95,
        tone: 0.6,
        size: 0.05,
        attack: 1,
        release: 3,
        width: 0.75,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 45 } },
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 12, outputDb: -6 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.12 } },
    ],
  },
  {
    id: 'embers-settling',
    name: 'Embers settling',
    category: 'texture',
    description:
      'A fire burning low: a bright tick about once a second over a steady low roar, on a dark plate.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hearth',
      params: {
        density: 0.06,
        movement: 0.25,
        tone: 0.8,
        size: 0,
        attack: 0.5,
        release: 5,
        width: 0.75,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 80 } },
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 12, outputDb: -2.5 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'furnace-drone',
    name: 'Furnace drone',
    category: 'drone',
    description:
      'The rumble of a fire rung on the pitch of each key so it drones and flickers, through a transformer into a dark hall.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hearth',
      params: {
        density: 0.25,
        movement: 1,
        tone: 0.3,
        resonance: 0.75,
        size: 0.5,
        release: 8,
        width: 0.7,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'record-next-door',
    name: 'Record next door',
    category: 'texture',
    description:
      'A record with nothing on it playing in the next room: dull crackle and turning rumble, the clicks rounded by a soft clipper.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Old record',
      params: {
        density: 0.65,
        movement: 0.9,
        tone: 0.35,
        size: 0.7,
        attack: 0.5,
        release: 2,
        width: 0.5,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 90 } },
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 20, outputDb: -5.5 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'mains-hum-organ',
    name: 'Mains hum organ',
    category: 'organ',
    description:
      'Mains hum played as an organ: hollow odd harmonics that speak at once, through a slow rotary speaker in a room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: {
        density: 0.85,
        movement: 0.15,
        tone: 0.85,
        resonance: 0,
        size: 0.1,
        attack: 0.03,
        release: 0.25,
        width: 0.7,
        volume: -18,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { balance: 0.6, spread: 1 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'cassette-hum-pad',
    name: 'Cassette hum pad',
    category: 'pad',
    description:
      'Hum thinned almost to a sine on each key and slow to arrive, on a cassette with wow and hiss, then a long plate.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: {
        density: 0.2,
        movement: 0.8,
        tone: 0.75,
        resonance: 0.9,
        size: 0.4,
        attack: 2.5,
        release: 6,
        width: 0.8,
        volume: -18.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
]
