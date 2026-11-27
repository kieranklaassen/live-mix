import { type FactoryPreset } from '../types'

// Ridge Lines keeps its pitch still while its overtones slide, so a preset
// here decides which land stands in front, what passes behind it and how fast,
// and how soft the edges are. The movement is the instrument's own: effects
// that move are few, and none adds a pitch.

export const RIDGE_LINES_PRESETS: readonly FactoryPreset[] = [
  // Slow train pads: the rows behind go past at the pace of a window seat.
  {
    id: 'ridge-lines-night-carriage',
    name: 'Carriage window, dusk',
    category: 'pad',
    description:
      'Round hills before flickering pines, seen from a slow train: a warm wooden pad with high overtones passing, in a warm hall.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Slow train',
      params: {
        travel: 0.42,
        body: 0.45,
        attack: 1.1,
        release: 3.2,
        height: 0.68,
        eyes: 0.75,
        volume: -5.5,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } }],
  },
  {
    id: 'ridge-lines-two-lines-crossing',
    name: 'Two railway lines',
    category: 'pad',
    description:
      'Bright cliffs with round hills behind, the last row running backwards: overtones cross each other slowly on a long plate.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Bowed cliffs',
      params: {
        parallax: 1,
        travel: 0.5,
        height: 0.85,
        repeats: 3,
        attack: 0.7,
        release: 3.5,
        sustain: 0.85,
        eyes: 0.8,
        vibrato: 0.06,
        wind: 0.12,
        tone: 0.78,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  // Roof keys: they speak at once and fall by Decay.
  {
    id: 'ridge-lines-felt-attic',
    name: 'Attic keys in felt',
    category: 'keys',
    description:
      'Soft keys of a cliff edge and slow hills in a wooden box, dull when played softly, in a small room.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Felt keys',
      params: { glow: 0.8, decay: 5, release: 0.7, volume: -4.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } }],
    preview: 'keys',
  },
  {
    id: 'ridge-lines-slate-roofs',
    name: 'Wet slate roofs',
    category: 'keys',
    description:
      'Bright hollow keys of two thin towers that ring on after the touch, with climbing glints behind, on cassette.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Tower pluck',
      params: {
        repeats: 2,
        decay: 2.6,
        release: 0.9,
        glow: 0.55,
        tone: 0.62,
        ground: 0.62,
        penumbra: 0.28,
        body: 0.5,
        company: 0.3,
        wind: 0.12,
        volume: -0.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener' },
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
    ],
    preview: 'keys',
  },
  // Cliff leads: the edges cut sharp, Penumbra at nothing.
  {
    id: 'ridge-lines-cliff-edge',
    name: 'Edge of the cliff',
    category: 'wind',
    description:
      'A sharp bright lead whose overtones climb and drop over every long note, with a waver that comes late and warm repeats.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Cliff lead',
      params: { penumbra: 0, travel: 0.6, tone: 0.84, volume: -5.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.22 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
    preview: 'line',
  },
  {
    id: 'ridge-lines-low-sun-reed',
    name: 'Low sun on a reed',
    category: 'wind',
    description:
      'One reedy player, the sun so low that every second overtone goes, with air in the tone, across a stone nave.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Reed evening',
      params: { wind: 0.7, vibrato: 0.5, release: 0.5, travel: 0.3, volume: -4.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.24 } }],
    preview: 'line',
  },
  // Dune basses: round, deep on the ground, with a ridge moving over them.
  {
    id: 'ridge-lines-dune-crest',
    name: 'Crest of a dune',
    category: 'bass',
    description:
      'A round deep bass whose few overtones climb slowly while the note is held, dry in the middle of a tight room.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Dune bass',
      params: { decay: 3, sustain: 0.5, release: 0.3, volume: -10.0 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.12 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
    preview: 'bass',
  },
  {
    id: 'ridge-lines-gravel-slope',
    name: 'Gravel slope',
    category: 'bass',
    description:
      'A bass of bright cliffs with loose rock on it, struck hard and closing as it falls, pushed into a warm circuit.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Bowed cliffs',
      params: {
        repeats: 1,
        jag: 0.45,
        ground: 0.8,
        tone: 0.55,
        glow: 0.8,
        attack: 0.005,
        decay: 1.4,
        sustain: 0.3,
        release: 0.2,
        company: 0.08,
        vibrato: 0,
        eyes: 0.15,
        wind: 0.1,
        sun: 0.2,
        travel: 0.36,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.1 } },
    ],
    preview: 'bass',
  },
  // Tower plucks: short, hollow, with two thin blocks in each cycle.
  {
    id: 'ridge-lines-bell-tower-steps',
    name: 'Steps of a tower',
    category: 'plucked',
    description:
      'Hollow plucks that close fast, every one caught at another place of the cliffs behind, with clean echoes across the room.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Tower pluck',
      params: {
        decay: 0.6,
        release: 0.6,
        height: 0.6,
        tone: 0.6,
        ground: 0.6,
        eyes: 0.6,
        volume: 3.5,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 420, feedback: 0.25, mix: 0.25 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
    preview: 'keys',
  },
  {
    id: 'ridge-lines-pine-needles',
    name: 'Needles on tin',
    category: 'plucked',
    description:
      'Dry nasal plucks of pines, gone in a breath, high and bright, with two springs rattling softly behind.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Needle flutter',
      params: {
        near: 1,
        far: 1,
        repeats: 2,
        travel: 0.5,
        attack: 0.004,
        decay: 2.2,
        sustain: 0,
        release: 1.6,
        glow: 0.6,
        ground: 0.6,
        jag: 0.15,
        tone: 0.72,
        company: 0.15,
        height: 0.5,
        wind: 0.3,
        volume: 2.0,
      },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.28 } }],
    preview: 'keys',
  },
  // Pine strings: rough, nasal, many players.
  {
    id: 'ridge-lines-pine-section',
    name: 'Section in the pines',
    category: 'string',
    description:
      'A whole section on nasal pine rows with rough rock on them, cliffs climbing behind, in a hall.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Pine strings',
      params: { wind: 0.35, jag: 0.35, tone: 0.72, volume: -9.0 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.28 } }],
  },
  {
    id: 'ridge-lines-resin-quartet',
    name: 'Four bows, resin',
    category: 'string',
    description:
      'A few close bows on bright cliffs, plenty of hair on the string and a wide waver, inside a wooden body.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Bowed cliffs',
      params: {
        wind: 0.75,
        jag: 0.3,
        vibrato: 0.5,
        company: 0.18,
        attack: 0.14,
        sustain: 0.8,
        release: 0.6,
        body: 0.8,
        travel: 0.28,
        height: 0.35,
        ground: 0.4,
        eyes: 0.4,
        tone: 0.74,
        volume: -2.5,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.22 } },
    ],
    preview: 'line',
  },
  // Ridge voices: hardly any ground, the hills behind lead.
  {
    id: 'ridge-lines-ridge-singers',
    name: 'Singers on the ridge',
    category: 'voice',
    description:
      'Vowels made of two rows of hills over little fundamental, sliding from one to another, in a vast nave.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Fifth voices',
      params: { travel: 0.36, ground: 0.2, release: 2.4, volume: -7.0 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } }],
  },
  {
    id: 'ridge-lines-answering-valley',
    name: 'Valley that answers',
    category: 'voice',
    description:
      'Climbing voices: each note swells and opens as the cliffs behind come up, then drops, with dark echoes after it.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Climbing swells',
      params: {
        repeats: 2,
        travel: 0.44,
        ground: 0.35,
        near: 0,
        tone: 0.7,
        height: 0.85,
        vibrato: 0.3,
        parallax: 0.35,
        volume: -4.5,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.22 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.28 } },
    ],
    preview: 'line',
  },
  // Still organs: Travel at nothing, so every key holds one picture.
  {
    id: 'ridge-lines-still-chapel',
    name: 'Chapel without wind',
    category: 'organ',
    description:
      'Nothing moves: three even rows of hills held still, plain and warm as small organ pipes, in a chapel.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Still organ',
      params: { release: 0.4, company: 0.25, volume: -8.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.22 } }],
  },
  {
    id: 'ridge-lines-still-towers',
    name: 'Four stopped towers',
    category: 'organ',
    description:
      'Thin towers before hills, at rest: a hollow stopped organ with odd overtones, turning slowly in a rotary cabinet.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Still organ',
      params: {
        near: 3,
        repeats: 2,
        height: 0.55,
        ground: 0.8,
        tone: 0.66,
        penumbra: 0.25,
        sun: 0.6,
        attack: 0.03,
        wind: 0.15,
        volume: -8.5,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } },
    ],
  },
  // Haze drones: every edge soft, the rows shine through each other.
  {
    id: 'ridge-lines-haze-valley',
    name: 'Valley under haze',
    category: 'drone',
    description:
      'Soft rows shining through each other, dark and wide, coming up over four seconds and drifting in a far cloud.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Haze drone',
      params: { release: 6, travel: 0.32, volume: -6.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
    preview: 'hold',
  },
  {
    id: 'ridge-lines-stone-wind',
    name: 'Wind on a bare pass',
    category: 'drone',
    description:
      'Rough stone and the wind over it, each note carried by air, with glittering grain sliding through a blurred tail.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Wind on stone',
      params: { ground: 0.4, jag: 0.6, repeats: 3 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Faint haze' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.28 } },
    ],
    preview: 'hold',
  },
  // Winter bells: struck towers before quick pines.
  {
    id: 'ridge-lines-winter-morning',
    name: 'Frost on the belfry',
    category: 'bell',
    description:
      'Struck hollow bells with quick flickers of pine in them, wide and cold, ringing out in bright air.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Winter bells',
      params: {
        decay: 2.6,
        release: 2,
        tone: 0.5,
        ground: 0.62,
        height: 0.5,
        eyes: 0.7,
        volume: -2.5,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.3 } }],
    preview: 'bells',
  },
  {
    id: 'ridge-lines-ice-bells-backwards',
    name: 'Bells under ice',
    category: 'bell',
    description:
      'Round bells of hills that dull as they fall, high pines flickering over each, with their own ring played backwards behind.',
    instrument: {
      deviceId: 'ridge-lines',
      preset: 'Winter bells',
      params: {
        near: 0,
        repeats: 5,
        ground: 0.6,
        decay: 3.4,
        release: 1.8,
        travel: 0.5,
        glow: 0.7,
        height: 0.5,
        tone: 0.7,
        company: 0.35,
        volume: -1.0,
      },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.28 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
    preview: 'bells',
  },
]
