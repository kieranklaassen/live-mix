import { type FactoryPreset } from '../types'

export const THESIS_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'whistling-voices',
    name: 'Whistling voices',
    category: 'voice',
    description:
      'Three narrow bands of noise from one key, swelling in turn like distant whistlers.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { center: 71, attack: 0.7, release: 2.5 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 14, outputGain: -3.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'hold',
  },
  {
    id: 'soft-air-chords',
    name: 'Soft air chords',
    category: 'pad',
    description:
      'All six bands at a low resonance, so one key gives a soft breathy chord from the scale.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Fixed Full Stack',
      params: { center: 67, resonance: 14, width: 85, attack: 2, release: 4, strum: 0, mode: 1 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 8 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { spread: 60, mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'hold',
  },
  {
    id: 'drifting-minor-bands',
    name: 'Drifting minor bands',
    category: 'pad',
    description:
      'A minor triad of noise whose pitches wander slightly, through tape and a long space.',
    instrument: { deviceId: 'thesis', preset: 'Drifting Minor', params: { center: 59 } },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 7 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
    preview: 'hold',
  },
  {
    id: 'low-wind-fifths',
    name: 'Low wind fifths',
    category: 'pad',
    description:
      'Broad dark bands that mirror low notes far above themselves, like wind across a pipe.',
    instrument: { deviceId: 'thesis', preset: 'Dark Phrygian', params: { attack: 3 } },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.4 } }],
    preview: 'low',
  },
  {
    id: 'mirror-line-echo',
    name: 'Mirror line echo',
    category: 'voice',
    description: 'Each note of a melody with its mirror moving the other way, on a tape echo.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: { center: 60, attack: 0.12, release: 1.5 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 7 } },
      { deviceId: 'tape-echo', preset: 'Warm repeats' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'noise-flute-close',
    name: 'Noise flute, close',
    category: 'wind',
    description:
      'One narrow band of noise per note and nothing else, quick to speak like a breathy flute in a small room.',
    instrument: {
      deviceId: 'thesis',
      params: {
        resonance: 50,
        attack: 0.07,
        release: 0.3,
        mode: 0,
        mirrorEnabled: 0,
        octaflipEnabled: 0,
      },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { gain: 2 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'noise-octave-pipes',
    name: 'Noise octave pipes',
    category: 'organ',
    description:
      'Each key as two still bands of noise an octave apart, quick as flue pipes, through a slow rotary speaker.',
    instrument: {
      deviceId: 'thesis',
      params: { resonance: 50, attack: 0.05, release: 0.25, mode: 0, mirrorEnabled: 0 },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { gain: -2 } },
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.1 } },
      { deviceId: 'zita-rev1', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'pedal-tone-whistle',
    name: 'Pedal tone whistle',
    category: 'wind',
    description:
      'A whistled line of noise with the centre note sounding under every key, on a dark echo in a hall.',
    instrument: {
      deviceId: 'thesis',
      params: {
        center: 50,
        resonance: 50,
        attack: 0.15,
        release: 1.2,
        mode: 0,
        mirrorEnabled: 0,
        octaflipEnabled: 0,
        centerEnabled: 1,
        scale: 4,
        root: 2,
      },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { ceiling: -3, gain: 4 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'plain-mirrored-bands',
    name: 'Plain mirrored bands',
    category: 'pad',
    description:
      'Every note and its mirror image as two still bands, half breath and half pitch, in a room.',
    instrument: {
      deviceId: 'thesis',
      params: {
        resonance: 22,
        width: 80,
        attack: 0.6,
        release: 2.5,
        mode: 0,
        octaflipEnabled: 0,
        scale: 4,
        root: 2,
      },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { gain: -3 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'singing-saw-noise',
    name: 'Singing saw noise',
    category: 'string',
    description:
      'Narrow bands whose pitch sways twice a second, notes and mirrors out of step, like bowed saws in a hall.',
    instrument: {
      deviceId: 'thesis',
      params: {
        center: 64,
        resonance: 50,
        attack: 0.35,
        release: 1.4,
        mode: 2,
        breatheRate: 2,
        octaflipEnabled: 0,
        scale: 1,
        root: 9,
      },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { gain: -3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'noise-chimes-fifth',
    name: 'Noise chimes, fifth',
    category: 'bell',
    description:
      'Bands of noise that speak at once and sound a fifth above the keys, each with its mirror, in a bright space.',
    instrument: {
      deviceId: 'thesis',
      params: {
        center: 69,
        resonance: 50,
        attack: 0.01,
        release: 1.6,
        mode: 3,
        strum: 30,
        octaflipEnabled: 0,
      },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { gain: -1 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'noise-wind-harp',
    name: 'Noise wind harp',
    category: 'string',
    description:
      'Broad gusts of noise at each note set a bank of tuned strings ringing, and the strings are most of what is heard.',
    instrument: {
      deviceId: 'thesis',
      params: {
        resonance: 8,
        attack: 0.25,
        release: 0.5,
        mode: 0,
        mirrorEnabled: 0,
        octaflipEnabled: 0,
      },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        params: { sympathy: 0.9, strings: 12, decay: 8, mix: 0.85, width: 0.5 },
      },
      { deviceId: 'ambient-limiter', params: { gain: -6.5 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'five-band-rake',
    name: 'Five band rake',
    category: 'plucked',
    description:
      'Five bands to a key, raked a tenth of a second apart on a five note scale, with a clean echo in a hall.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Fixed Full Stack',
      params: {
        center: 71,
        resonance: 50,
        attack: 0.01,
        release: 2.2,
        strum: 100,
        centerEnabled: 0,
        scale: 9,
      },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { gain: -4 } },
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 330, mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'hiss-shoreline',
    name: 'Hiss shoreline',
    category: 'texture',
    description:
      'Six bands so broad they are nearly plain noise, opened and closed by a slow filter like surf.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Fixed Full Stack',
      params: { center: 71, resonance: 5, width: 80, attack: 2, release: 5, strum: 0 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { cutoffHz: 600, lfoAmount: 55, lfoRateHz: 0.2 },
      },
      { deviceId: 'ambient-limiter', params: { ceiling: -3, gain: 1 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'humming-mirror-drone',
    name: 'Humming mirror drone',
    category: 'drone',
    description:
      'Narrow low bands, each low note mirrored above a low centre into an open stack, rising and sinking every ten seconds in a dark hall.',
    instrument: {
      deviceId: 'thesis',
      params: {
        center: 48,
        resonance: 50,
        attack: 3,
        release: 8,
        breatheRate: 0.1,
        octaflipEnabled: 0,
        scale: 4,
        root: 2,
      },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { ceiling: -3, gain: 12 } },
      { deviceId: 'zita-rev1', preset: 'Dark hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'far-noise-cluster',
    name: 'Far noise cluster',
    category: 'voice',
    description:
      'Each key with the two notes halfway to the centre and beyond it, swelling in turn, far back in a hall.',
    instrument: {
      deviceId: 'thesis',
      params: {
        center: 64,
        resonance: 45,
        attack: 1,
        release: 3,
        breatheRate: 0.8,
        mirrorEnabled: 0,
        octaflipEnabled: 0,
        middleEnabled: 1,
        mirrorMiddleEnabled: 1,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clear: 0 } },
      { deviceId: 'zita-rev1', preset: 'Far away', params: { mix: 0.7 } },
    ],
  },
  {
    id: 'shellac-noise-bands',
    name: 'Shellac noise bands',
    category: 'pad',
    description:
      'Half pitched bands on each note, its mirror and its octave, their pitch wandering, played off a crackling shellac disc.',
    instrument: {
      deviceId: 'thesis',
      params: {
        center: 59,
        resonance: 28,
        attack: 0.9,
        release: 3,
        mode: 2,
        breatheRate: 0.5,
        scale: 5,
        root: 4,
      },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { gain: -3.5 } },
      { deviceId: 'vinyl', preset: 'Ballroom 78' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rippling-six-bands',
    name: 'Rippling six bands',
    category: 'texture',
    description:
      'One key becomes six whistling bands that swell one after another about once a second, in a long open space.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Fixed Full Stack',
      params: {
        center: 65,
        resonance: 50,
        width: 80,
        attack: 1.2,
        release: 4,
        mode: 1,
        breatheRate: 1.1,
        strum: 0,
        scale: 6,
        root: 5,
      },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { ceiling: -3, gain: 11 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'noise-into-strings',
    name: 'Noise into strings',
    category: 'string',
    description:
      'One narrow band of noise per note, then a string section and its upper octave swell in on the same chord.',
    instrument: {
      deviceId: 'thesis',
      params: {
        resonance: 50,
        attack: 0.8,
        release: 2.5,
        mode: 0,
        mirrorEnabled: 0,
        octaflipEnabled: 0,
      },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'String pad',
        params: { rise: 1.2, octaves: 0.8, brightness: 6000, width: 0.4, mix: 0.8 },
      },
      { deviceId: 'ambient-limiter', params: { gain: 4.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'reversed-noise-puffs',
    name: 'Reversed noise puffs',
    category: 'keys',
    description:
      'Short soft puffs of pitched noise and their mirrors, each answered by itself played backwards.',
    instrument: {
      deviceId: 'thesis',
      params: {
        center: 60,
        resonance: 35,
        attack: 0.02,
        release: 0.5,
        mode: 0,
        octaflipEnabled: 0,
      },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { ceiling: -4.5, gain: 5 } },
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { mix: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'bells',
  },
]
