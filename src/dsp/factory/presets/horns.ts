import { type FactoryPreset } from '../types'

// Brass belongs under a `wind` category; until the bank has one these sit
// with the pads.
export const HORNS_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'horn-section-hall',
    name: 'Horns in a hall',
    category: 'wind',
    description:
      'Three horns to a key, swelling in and warming as they grow, with a concert hall behind them.',
    instrument: { deviceId: 'horns', preset: 'Horn swell' },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } }],
    preview: 'chord',
  },
  {
    id: 'breathy-fifths-trumpet',
    name: 'Trumpet in fifths',
    category: 'wind',
    description:
      'A soft trumpet that is half air, shadowed a fifth above, its tape echoes trailing into open space.',
    instrument: { deviceId: 'horns', preset: 'Parallel fifths', params: { volume: -3 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'flugelhorn-close',
    name: 'Flugelhorn up close',
    category: 'wind',
    description:
      'One flugelhorn played quietly into the microphone, breath and all, in a small warm room.',
    instrument: { deviceId: 'horns', preset: 'Flugel breath', params: { volume: -3 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'zita-rev1', preset: 'Room' },
    ],
    preview: 'line',
  },
  {
    id: 'low-brass-choir',
    name: 'Low brass choir',
    category: 'wind',
    description:
      'Trombones and tuba, four to a note, rising slowly out of a very large and dark space.',
    instrument: { deviceId: 'horns', preset: 'Low brass choir', params: { attack: 2.5 } },
    effects: [{ deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } }],
    preview: 'low',
  },
  {
    id: 'muted-trumpet-far',
    name: 'Muted trumpet, far off',
    category: 'wind',
    description:
      'A thin, nasal muted trumpet heard from a distance through worn tape echo and a long hall.',
    instrument: { deviceId: 'horns', preset: 'Muted distance', params: { volume: -2 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'line',
  },
  {
    id: 'open-trumpet-solo',
    name: 'Open trumpet solo',
    category: 'wind',
    description:
      'One open trumpet, tongued and clear, with a little vibrato on held notes, in a small bright chamber.',
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { section: 0, blow: 0.62, attack: 0.04, release: 0.35, vibrato: 0.2, volume: -1 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Tight chamber' }],
  },
  {
    id: 'tuba-alone',
    name: 'Tuba alone',
    category: 'wind',
    description: 'A single tuba to a key, tongued and held steady, close in a small room.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { section: 0, blow: 0.5, breath: 0.1, attack: 0.05, release: 0.5, volume: -4 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Room' }],
    preview: 'low',
  },
  {
    id: 'horn-quartet',
    name: 'Horn quartet',
    category: 'wind',
    description:
      'A few French horns that speak promptly and sit close together, round and plain, in a small room.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { section: 0.35, blow: 0.55, attack: 0.25, release: 1.2, volume: -8 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Room' }],
    preview: 'chord',
  },
  {
    id: 'flugelhorn-choir',
    name: 'Flugelhorn choir',
    category: 'wind',
    description:
      'Several flugelhorns on every key, soft edged with a slight vibrato, on a medium plate reverb.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: {
        section: 0.8,
        blow: 0.45,
        breath: 0.15,
        attack: 0.7,
        release: 2.2,
        vibrato: 0.15,
        volume: -7,
      },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.22 } }],
    preview: 'chord',
  },
  {
    id: 'tower-fanfare',
    name: 'Tower fanfare',
    category: 'wind',
    description:
      'Trumpets blown hard into a bright blare and tongued short, ringing on in a bright hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { section: 0.7, blow: 0.95, breath: 0, attack: 0.02, release: 0.45 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Bright hall', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'horns-in-fourths',
    name: 'Horns in fourths',
    category: 'wind',
    description:
      'French horns in parallel, a second voice a fourth below every note, over a long open valley tail.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { section: 0.5, harmony: -0.7, blow: 0.5, attack: 0.5, release: 2, volume: -3 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
  },
  {
    id: 'humming-horns',
    name: 'Humming horns',
    category: 'pad',
    description:
      'Four horns to a key blown so gently they only hum, a dark pure pad with slow chorus drift in a dark hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0, breath: 0, section: 1, attack: 1.5, release: 5, volume: -6.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Dark hall' },
    ],
  },
  {
    id: 'breath-in-brass',
    name: 'Breath in brass',
    category: 'pad',
    description:
      'Low brass blown at its gentlest with all the breath let through, each note half air, under a thin bright tail.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { blow: 0, breath: 1, attack: 1.5, release: 3, volume: -10 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { width: 0.7 } }],
  },
  {
    id: 'muted-trumpet-pad',
    name: 'Muted trumpet pad',
    category: 'pad',
    description:
      'Four muted trumpets to a key swelling in, thin and nasal, as a slow phaser opens across their narrow band.',
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { section: 1, blow: 0.75, attack: 2.2, release: 3.5, vibrato: 0, volume: -7 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { stereo: 0, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall' },
    ],
  },
  {
    id: 'shellac-trumpet',
    name: 'Shellac trumpet',
    category: 'wind',
    description:
      'A muted trumpet with vibrato on every held note, recorded in a room and played back from a crackling shellac disc.',
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { blow: 0.4, breath: 0.1, vibrato: 0.8, attack: 0.06, release: 0.6, volume: -3.5 },
    },
    effects: [
      { deviceId: 'zita-rev1', preset: 'Room' },
      { deviceId: 'vinyl', preset: 'Parlour 78' },
    ],
  },
  {
    id: 'flugelhorn-organ',
    name: 'Flugelhorn organ',
    category: 'organ',
    description:
      'A flugelhorn that starts and stops like a key, stacked in octaves above and below, through a slow rotary speaker.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { blow: 0.3, breath: 0, attack: 0.02, release: 0.12, vibrato: 0, volume: -12 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Organ' },
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'zita-rev1', preset: 'Room' },
    ],
  },
  {
    id: 'trumpet-into-piano',
    name: 'Trumpet into piano',
    category: 'wind',
    description:
      'Short trumpet notes played into an open piano, whose strings ring on in sympathy after each one, longest for low notes.',
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { section: 0, blow: 0.7, breath: 0.1, attack: 0.03, release: 0.25, volume: -10 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Piano pedal',
        params: { sympathy: 0.8, decay: 6, strings: 12, width: 0.2 },
      },
      { deviceId: 'zita-rev1', preset: 'Room' },
    ],
    preview: 'bells',
  },
  {
    id: 'muted-trumpet-drone',
    name: 'Muted trumpet drone',
    category: 'drone',
    description:
      'Muted trumpets far below their range, a nasal buzz of close overtones that a phaser combs slowly from side to side, in a damped hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: {
        section: 1,
        blow: 0.6,
        breath: 0.1,
        attack: 3,
        release: 6,
        vibrato: 0,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { centerHz: 1200, mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Dark hall' },
    ],
  },
  {
    id: 'short-horns-echo',
    name: 'Short horns, echo',
    category: 'wind',
    description:
      'A horn section tongued very short, each note bounced by a tape echo in a dotted pattern and set on a small plate.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.7, attack: 0.02, release: 0.18, volume: -4 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { spread: 0.5 } },
      { deviceId: 'dattorro', preset: 'Small plate' },
    ],
    preview: 'keys',
  },
  {
    id: 'flugelhorn-reversed',
    name: 'Flugelhorn reversed',
    category: 'wind',
    description:
      'Short flugelhorn notes, each answered a moment later by itself played backwards, swelling in and cutting off, in a hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: {
        section: 0.3,
        blow: 0.55,
        breath: 0.25,
        attack: 0.02,
        release: 0.25,
        vibrato: 0,
        volume: -5,
      },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards only',
        params: { time: 800, mix: 0.7, spread: 0.15 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
]
