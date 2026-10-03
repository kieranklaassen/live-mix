import { type FactoryPreset } from '../types'

export const CHAMBER_STRINGS_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'chamber-strings-hall',
    name: 'Strings in a hall',
    category: 'string',
    description:
      'A small section as it comes, four players on every note, heard from a few rows back.',
    instrument: { deviceId: 'chamber-strings', preset: 'Chamber section' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall' }],
    preview: 'chord',
  },
  {
    id: 'muted-tape-swell',
    name: 'Muted tape swell',
    category: 'string',
    description:
      'Muted strings without vibrato that take seconds to arrive, on tape, in a very large room.',
    instrument: { deviceId: 'chamber-strings', preset: 'Muted swell' },
    effects: [
      // The drive the preset had when this was tuned.
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'whisper-bow-halo',
    name: 'Whisper bow halo',
    category: 'string',
    description:
      'Light bows over the fingerboard, more air than tone, with a reverb that climbs an octave.',
    instrument: { deviceId: 'chamber-strings', preset: 'Whisper bows' },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'low-dark-strings',
    name: 'Low dark strings',
    category: 'string',
    description:
      'Five players a note with slow bows and wide tuning, a long way down a stone nave.',
    instrument: { deviceId: 'chamber-strings', preset: 'Slow dark bows' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } }],
    preview: 'chord',
  },
  {
    id: 'close-solo-strings',
    name: 'Close solo strings',
    category: 'string',
    description:
      'One player on each note, close and quick, with vibrato and bow changes, in a small room.',
    instrument: { deviceId: 'chamber-strings', preset: 'Close solo', params: { width: 0.7 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } }],
    preview: 'chord',
  },
  {
    id: 'fingerboard-duo',
    name: 'Fingerboard duo',
    category: 'string',
    description:
      'Two players a note bowing over the fingerboard, soft and breathy, quick to speak in a small booth.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        players: 2,
        attack: 0.2,
        release: 0.5,
        bow: 0.1,
        air: 0.7,
        vibrato: 8,
        mute: 0,
        scatter: 0.4,
        width: 1,
        volume: -7,
      },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth' }],
  },
  {
    id: 'warm-plate-bows',
    name: 'Warm plate bows',
    category: 'string',
    description:
      'Six unmuted players on every note with an easy vibrato, warm and unhurried, on a damped plate.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 0.8, release: 2.2, bow: 0.35, air: 0.1, vibrato: 12, volume: -7.5 },
    },
    effects: [
      {
        deviceId: 'plate-reverb',
        preset: 'Medium plate',
        params: { decay: 0.8, damping: 0.55 },
      },
    ],
  },
  {
    id: 'close-muted-bows',
    name: 'Close muted bows',
    category: 'string',
    description:
      'Three players with mutes on and a little vibrato, quick to speak, veiled and nasal in a small room.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        players: 3,
        attack: 0.3,
        release: 0.9,
        bow: 0.35,
        air: 0.2,
        vibrato: 5,
        mute: 1,
        scatter: 0.3,
        width: 0.5,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.22 } }],
  },
  {
    id: 'bridge-glass-bows',
    name: 'Bridge glass bows',
    category: 'string',
    description:
      'Five players bowing at the bridge with plenty of rosin, glassy and thin, in a long bright hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        players: 5,
        attack: 0.9,
        release: 2.5,
        bow: 1,
        air: 0.65,
        mute: 0,
        scatter: 0.5,
        volume: -9.5,
      },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { midDecay: 4, mix: 0.45 } },
    ],
  },
  {
    id: 'ragged-string-pad',
    name: 'Ragged string pad',
    category: 'pad',
    description:
      'Six players a note as far apart in pitch and timing as they go, a thick slow pad on a long plate.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: {
        attack: 2,
        release: 3.5,
        bow: 0.6,
        air: 0.3,
        vibrato: 18,
        scatter: 1,
        width: 0.6,
        volume: -7.5,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate' }],
  },
  {
    id: 'cello-floor-drone',
    name: 'Cello floor drone',
    category: 'drone',
    description:
      'Six half muted players a note, slow and without vibrato, with their octave below, in a hall with long lows.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Slow dark bows',
      params: {
        players: 6,
        attack: 3,
        release: 7,
        bow: 0.15,
        air: 0.2,
        vibrato: 0,
        mute: 0.5,
        scatter: 0.85,
        width: 0.5,
        volume: -5,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'short-muted-strokes',
    name: 'Short muted strokes',
    category: 'string',
    description:
      'Short separate strokes from two muted players, soft and round, slapped back by a small room.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        players: 2,
        attack: 0.05,
        release: 0.15,
        bow: 0.3,
        vibrato: 0,
        mute: 0.8,
        scatter: 0.5,
        volume: -4.5,
      },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Slap room' }],
    preview: 'keys',
  },
  {
    id: 'wandering-solo-bow',
    name: 'Wandering solo bow',
    category: 'string',
    description:
      'One player without vibrato whose pitch drifts as far as it goes, a dark tape echo trailing in a hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: {
        attack: 0.5,
        release: 1.5,
        bow: 0.3,
        air: 0.3,
        vibrato: 0,
        mute: 0.2,
        scatter: 1,
        volume: -3,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'dictation-tape-bows',
    name: 'Dictation tape bows',
    category: 'string',
    description:
      'Five players with a very wide vibrato, thinned to a narrow band on worn cassette tape that flutters and hisses, in a room.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        players: 5,
        attack: 0.4,
        release: 1.4,
        bow: 0.55,
        air: 0.15,
        vibrato: 35,
        mute: 0,
        scatter: 0.5,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin' },
      { deviceId: 'tape', preset: 'Old dictation', params: { hiss: 0.5, tone: 0.15 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'slowest-bow-swell',
    name: 'Slowest bow swell',
    category: 'pad',
    description:
      'Very slow bows: a chord is still growing out of its own hiss after three seconds, in a very large open space.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        attack: 5,
        release: 5,
        bow: 0.5,
        air: 0.6,
        vibrato: 4,
        mute: 0,
        scatter: 0.4,
        volume: -6,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.4 } }],
  },
  {
    id: 'far-shore-strings',
    name: 'Far shore strings',
    category: 'string',
    description:
      'A small section with a full vibrato heard from far off, its top and bottom taken away, mostly hall and little bow.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        players: 5,
        release: 2.5,
        air: 0.15,
        vibrato: 12,
        mute: 0,
        scatter: 0.5,
        width: 0.3,
        volume: -6.7,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { lowCut: 260 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.65 } },
    ],
  },
  {
    id: 'chamber-harmonics',
    name: 'Chamber harmonics',
    category: 'string',
    description:
      'Two still players at the bridge with a copy an octave above, thin as harmonics, in a hall with a bright tail.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        players: 2,
        attack: 1.2,
        release: 3,
        bow: 1,
        air: 0.1,
        vibrato: 0,
        mute: 0,
        scatter: 0.15,
      },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave up', params: { mode: 3, mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'bow-hiss-weather',
    name: 'Bow hiss weather',
    category: 'texture',
    description:
      'Six bows that are nearly all hiss, a slow resonant peak sweeping through them like wind, in a reverb that breathes.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        players: 6,
        attack: 2.5,
        release: 5,
        bow: 0.9,
        air: 1,
        vibrato: 0,
        mute: 0,
        scatter: 1,
        width: 0.5,
        volume: -5,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: {
          type: 4,
          cutoffHz: 1100,
          resonance: 2,
          lfoAmount: 45,
          lfoRateHz: 0.12,
        },
      },
      // Holds chords near the level of one note; tails 1 lets the gain come back before the next.
      {
        deviceId: 'ambient-comp',
        preset: 'Hold swells',
        params: { threshold: -24, release: 3, tails: 1 },
      },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'rotary-speaker-bows',
    name: 'Rotary speaker bows',
    category: 'string',
    description:
      'An unmuted section bowed towards the bridge with no vibrato, through a slowly turning rotary speaker, in a hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        attack: 0.9,
        release: 2.2,
        bow: 0.75,
        air: 0.1,
        vibrato: 0,
        mute: 0,
        scatter: 0.2,
        width: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'rotary',
        preset: 'Chorale',
        params: { hornDepth: 0.8, drive: 0.3, balance: 0.65, distance: 0.4, spread: 0.75 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'organ-pipe-bows',
    name: 'Organ pipe bows',
    category: 'organ',
    description:
      'Six players in tight unison with no vibrato or bow noise, stacked in octaves like organ stops, in a hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        players: 6,
        attack: 0.12,
        release: 0.5,
        bow: 0.2,
        air: 0,
        vibrato: 0,
        mute: 0,
        scatter: 0,
        width: 0.4,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Organ' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
]
