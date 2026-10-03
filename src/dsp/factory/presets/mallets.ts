import { type FactoryPreset } from '../types'

export const MALLETS_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'yarn-marimba',
    name: 'Yarn marimba',
    category: 'bell',
    description:
      'Rosewood bars under soft yarn mallets, each low tone blooming out of its tube, in a room.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { width: 0.7, volume: -3.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } }],
    preview: 'bells',
  },
  {
    id: 'rolled-marimba-pad',
    name: 'Rolled marimba pad',
    category: 'bell',
    description:
      'Held marimba chords rolled with soft mallets until they hum like a pad, on tape, in a hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { volume: -15.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-motor-vibes',
    name: 'Slow motor vibes',
    category: 'bell',
    description:
      'Vibraphone bars ringing with the motor turning, the low tone throbbing under still overtones.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { motorRate: 3.5, volume: -6 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
    preview: 'bells',
  },
  {
    id: 'rolled-vibes-haze',
    name: 'Rolled vibes haze',
    category: 'bell',
    description:
      'Vibraphone chords rolled very softly under a slow motor and left to hang in a wide open space.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { volume: -15.5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } }],
    preview: 'chord',
  },
  {
    id: 'celesta-small-plate',
    name: 'Celesta on a plate',
    category: 'bell',
    description:
      'Felt hammers on steel plates over a wooden box, small and clear, on a short plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { volume: -6 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } }],
    preview: 'bells',
  },
  {
    id: 'glockenspiel-hall',
    name: 'Glockenspiel hall',
    category: 'bell',
    description:
      'Steel bars over short tubes struck with hard beaters, a round tone under each ping, in a concert hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { resonator: 0.8, width: 0.25, volume: -8.2 },
    },
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { decay: 3.5, mix: 0.42 } },
    ],
  },
  {
    id: 'concert-xylophone',
    name: 'Concert xylophone',
    category: 'bell',
    description:
      'Hard sticks on rosewood bars over their tubes, a knock and a short ring, lightly limited, in a tight chamber.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { mallet: 0.7, decay: 1.2, resonator: 0.9, width: 0.45, volume: -5 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Light touch', params: { outputGain: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'damped-vibraphone',
    name: 'Damped vibraphone',
    category: 'keys',
    description:
      'A vibraphone with the motor off and the pedal up, so each note stops as its key lifts, in a small room.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { mallet: 0.55, decay: 1, resonator: 0.85, damper: 0.85, width: 0.4, volume: -11.3 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } }],
  },
  {
    id: 'low-vibes-throb',
    name: 'Low vibes throb',
    category: 'drone',
    description:
      'Low vibraphone bars kept humming by a soft slow roll, the motor throbbing about once a second, warmed by a transformer.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { mallet: 0, decay: 3, motor: 1, motorRate: 1.2, roll: 3, damper: 0.25, width: 0.1 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'fast-fan-vibes',
    name: 'Fast fan vibes',
    category: 'bell',
    description:
      'Vibraphone bars under hard mallets with the motor turned right up, the low tone fluttering nine times a second on a bright plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: {
        mallet: 0.7,
        decay: 1.2,
        resonator: 1,
        motor: 1,
        motorRate: 9,
        damper: 0.4,
        width: 0.2,
        volume: -6,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3 } }],
  },
  {
    id: 'vibes-without-tubes',
    name: 'Vibes without tubes',
    category: 'bell',
    description:
      'Aluminium bars struck hard with no tubes under them, thin and glassy, doubled a few cents apart, far off in a long airy hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { mallet: 0.7, decay: 2.5, resonator: 0, damper: 0, width: 0.25, volume: -4.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'felted-glockenspiel',
    name: 'Felted glockenspiel',
    category: 'bell',
    description:
      'Steel bars over tubes, touched with the softest beaters so only a round tone is left, in a dark hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 0.05, decay: 2.5, resonator: 1, volume: -10.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall' }],
  },
  {
    id: 'toy-celesta',
    name: 'Toy celesta',
    category: 'bell',
    description:
      'Hard hammers on short stopped plates, a toy keyboard heard close through a small boxy speaker in a short dry room.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.95, decay: 0.4, resonator: 0.2, damper: 1, width: 0.2, volume: -6.7 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { distance: 0, noise: 0.1 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'marimba-sub-octave',
    name: 'Marimba sub octave',
    category: 'bell',
    description:
      'A marimba with every note doubled an octave below, so middle bars sound as deep as the longest ones, in a room.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.45, decay: 1.5, resonator: 0.9, width: 0.4, volume: -12.3 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
    preview: 'keys',
  },
  {
    id: 'rolled-celesta-halo',
    name: 'Rolled celesta halo',
    category: 'pad',
    description:
      'Celesta chords rolled softly into a steady hum, in a long reverb whose tail climbs by octaves.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.15, resonator: 1, roll: 7, damper: 0.25, width: 0.15, volume: -17.5 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { width: 0.4 } }],
  },
  {
    id: 'xylophone-on-shellac',
    name: 'Xylophone on shellac',
    category: 'bell',
    description:
      'A xylophone played in a room and cut through a valve stage to a shellac disc: narrow, nearly mono, crackling.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { mallet: 0.7, decay: 0.8, resonator: 0.5, width: 0.3, volume: -1 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'vinyl', preset: 'Parlour 78', params: { crackle: 0.4, surface: 0.45 } },
    ],
    preview: 'keys',
  },
  {
    id: 'fluttering-marimba',
    name: 'Fluttering marimba',
    category: 'bell',
    description:
      'A marimba with a fast motor fitted to its tubes, the low tone of each long note fluttering on a plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: {
        mallet: 0.45,
        decay: 2.2,
        resonator: 1,
        motor: 1,
        motorRate: 9.5,
        width: 0.5,
        volume: -7.8,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'bowed-vibraphone',
    name: 'Bowed vibraphone',
    category: 'pad',
    description:
      'Vibraphone bars with the stroke faded out, so each chord swells in as if bowed and rings on in a cathedral.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { mallet: 0.6, decay: 4, resonator: 0.2, damper: 0.35, width: 0.3, volume: -13 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow bow' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'glockenspiel-clock',
    name: 'Glockenspiel clock',
    category: 'bell',
    description:
      'Held glockenspiel notes restruck two or three times a second, high bars faster and further right, like clocks out of step.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: {
        mallet: 0.75,
        decay: 0.3,
        resonator: 0.3,
        roll: 2.2,
        damper: 0.7,
        width: 0.6,
        volume: -10.5,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.25, width: 0.4 } }],
    preview: 'chord',
  },
  {
    id: 'marimba-knock-echo',
    name: 'Marimba knock echo',
    category: 'plucked',
    description:
      'Marimba bars with no tubes under them, struck hard and soon gone, each knock galloping off two tape heads in a room.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 1, decay: 0.4, resonator: 0, damper: 1, width: 0.3, volume: 3.4 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { feedback: 0.6, mix: 0.45 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
]
