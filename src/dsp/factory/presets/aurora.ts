import { type FactoryPreset } from '../types'

export const AURORA_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'aurora-slow-brass-hall',
    name: 'Slow brass in a hall',
    category: 'pad',
    description:
      'Brass that starts dark, opens past its tone and keeps swelling while held, with a slow chorus and a hall.',
    instrument: { deviceId: 'aurora', preset: 'Slow brass' },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { spread: 60, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'aurora-wide-strings',
    name: 'Wide string layers',
    category: 'pad',
    description:
      'Two bright string layers beating against each other, thickened by an ensemble chorus in a long hall.',
    instrument: { deviceId: 'aurora', preset: 'Wide strings', params: { volume: -6 } },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'aurora-distant-horns',
    name: 'Distant soft horns',
    category: 'pad',
    description:
      'Muted horns that take their time to speak, worn by tape and set far back in a very large room.',
    instrument: { deviceId: 'aurora', preset: 'Soft horns', params: { volume: -14 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, width: 0.8 } },
    ],
    preview: 'chord',
  },
  {
    id: 'aurora-night-choir',
    name: 'Night choir halo',
    category: 'pad',
    description: 'A narrow, resonant band that sounds almost sung, with a halo an octave above it.',
    instrument: { deviceId: 'aurora', preset: 'Night choir', params: { volume: -12 } },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.35 } }],
    preview: 'chord',
  },
  {
    id: 'aurora-metal-dawn',
    name: 'Metal dawn echoes',
    category: 'pad',
    description:
      'Each note opens with a falling metallic ring that melts into the pad, repeated by tape and a long plate.',
    instrument: { deviceId: 'aurora', preset: 'Metal dawn', params: { volume: -11.5 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'aurora-brass-held-still',
    name: 'Brass held still',
    category: 'pad',
    description:
      'A dark, plain brass pad whose filter does not move and whose level does not swell, on a medium plate.',
    instrument: {
      deviceId: 'aurora',
      params: {
        brilliance: 900,
        resonance: 0.1,
        contour: 0,
        attack: 0.3,
        swell: 0,
        release: 1.8,
        detune: 4,
        volume: -11,
      },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.2 } }],
  },
  {
    id: 'aurora-quick-brass-section',
    name: 'Quick brass section',
    category: 'keys',
    description:
      'Lean brass with the lows trimmed that speaks at once with a filter overshoot and lets go quickly, in a room.',
    instrument: {
      deviceId: 'aurora',
      params: {
        brilliance: 2200,
        lowCut: 150,
        resonance: 0.3,
        contour: 0.9,
        attack: 0.06,
        swell: 0.15,
        release: 0.5,
        detune: 4,
        volume: -12.5,
      },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } }],
  },
  {
    id: 'aurora-close-synth-strings',
    name: 'Close synth strings',
    category: 'string',
    description:
      'Two full string layers nine cents apart with a quick bow and a short release, in a tight chamber.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { brilliance: 3600, lowCut: 110, attack: 0.3, release: 1.4, detune: 9, volume: -12 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Tight chamber', params: { mix: 0.28 } }],
  },
  {
    id: 'aurora-silver-string-sheen',
    name: 'Silver string sheen',
    category: 'string',
    description:
      'Only the top of the string layers, filters wide open and the body cut away, beating in bright air.',
    instrument: {
      deviceId: 'aurora',
      params: {
        brilliance: 14000,
        lowCut: 700,
        resonance: 0,
        contour: 0,
        attack: 0.8,
        swell: 0.4,
        detune: 22,
        volume: -3,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air' },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'aurora-round-brass-keys',
    name: 'Round brass keys',
    category: 'keys',
    description:
      'A soft, dark key that speaks at once and does not swell, drifting from side to side, with a little spring.',
    instrument: {
      deviceId: 'aurora',
      params: {
        brilliance: 1000,
        lowCut: 90,
        resonance: 0.05,
        contour: 0.2,
        attack: 0.006,
        swell: 0,
        release: 0.9,
        detune: 2,
        volume: -12.5,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.35, depth: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'aurora-brass-filter-pluck',
    name: 'Brass filter pluck',
    category: 'plucked',
    description:
      'The filter snaps open and shuts below the note, so each key is a pluck over a dull hum, with dark echoes.',
    instrument: {
      deviceId: 'aurora',
      params: {
        brilliance: 200,
        resonance: 0.4,
        contour: 1,
        attack: 0.005,
        swell: 0,
        release: 0.5,
        detune: 5,
        volume: -10.5,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'aurora-falling-ring-bells',
    name: 'Falling ring bells',
    category: 'bell',
    description:
      'Struck notes with the ring modulator sweep full up, a metallic onset that falls in pitch, levelled into a bright plate.',
    instrument: {
      deviceId: 'aurora',
      params: {
        brilliance: 5000,
        lowCut: 200,
        resonance: 0.1,
        contour: 0.1,
        attack: 0.005,
        swell: 0,
        release: 3.5,
        detune: 3,
        ring: 1,
        volume: -3,
      },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 5, outputGain: -2 } },
      { deviceId: 'dattorro', preset: 'Bright plate', params: { decay: 0.8 } },
    ],
  },
  {
    id: 'aurora-rotor-brass-organ',
    name: 'Rotor brass organ',
    category: 'organ',
    description:
      'A still tone with octaves added below and above like organ stops, through a slow rotary speaker in a room.',
    instrument: {
      deviceId: 'aurora',
      params: {
        brilliance: 1200,
        resonance: 0,
        contour: 0,
        attack: 0.015,
        swell: 0,
        release: 0.12,
        detune: 0,
        volume: -17,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Organ', params: { sub2: 0 } },
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'aurora-hollow-synth-pipe',
    name: 'Hollow synth pipe',
    category: 'wind',
    description:
      'A narrow resonant band around the note with a breath of overshoot and a light vibrato, for one line in a small hall.',
    instrument: {
      deviceId: 'aurora',
      params: {
        brilliance: 700,
        lowCut: 250,
        resonance: 0.6,
        contour: 0.5,
        attack: 0.08,
        swell: 0.2,
        release: 0.6,
        detune: 0,
        volume: -9.5,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Pitch wobble', params: { phase: 0 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { decay: 3, mix: 0.25 } },
    ],
  },
  {
    id: 'aurora-high-ee-voices',
    name: 'High ee voices',
    category: 'voice',
    description:
      'A thin resonant band far above the notes that sounds like a sung ee, set far back in a hall.',
    instrument: {
      deviceId: 'aurora',
      params: {
        brilliance: 2600,
        lowCut: 1100,
        resonance: 0.75,
        contour: 0.1,
        attack: 1.2,
        swell: 0.4,
        detune: 12,
        volume: -10.5,
      },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Far away', params: { mix: 0.6 } }],
  },
  {
    id: 'aurora-overtone-climb',
    name: 'Overtone climb',
    category: 'texture',
    description:
      'A filter at full resonance that opens over four seconds and climbs through the overtones of low notes, in a hall.',
    instrument: {
      deviceId: 'aurora',
      params: {
        brilliance: 2500,
        lowCut: 100,
        resonance: 1,
        contour: 1,
        attack: 4,
        swell: 0.3,
        release: 4,
        detune: 0,
        volume: -7.5,
      },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } }],
    preview: 'low',
  },
  {
    id: 'aurora-beating-brass-drone',
    name: 'Beating brass drone',
    category: 'drone',
    description:
      'A dark low drone with its two layers thirty cents apart, beating and growing while held, in a dark hall.',
    instrument: {
      deviceId: 'aurora',
      params: {
        brilliance: 300,
        lowCut: 20,
        resonance: 0.2,
        contour: 0,
        attack: 2.5,
        swell: 1,
        release: 12,
        detune: 30,
        volume: -5.5,
      },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Dark hall' }],
  },
  {
    id: 'aurora-shellac-strings',
    name: 'Shellac strings',
    category: 'string',
    description:
      'Detuned string layers and their small plate, played back from a crackling shellac record, narrow and nearly mono.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { brilliance: 2200, lowCut: 300, attack: 0.9, release: 3, detune: 18, volume: -7.5 },
    },
    effects: [
      { deviceId: 'dattorro', preset: 'Small plate' },
      { deviceId: 'vinyl', preset: 'Parlour 78' },
    ],
  },
  {
    id: 'aurora-horns-on-shortwave',
    name: 'Horns on shortwave',
    category: 'pad',
    description:
      'Soft horns heard over a shortwave link, thin and fading in and out of static, in a dark hall.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { brilliance: 1200, attack: 0.8, release: 3 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Night shortwave', params: { static: 0.2, interference: 0 } },
      { deviceId: 'zita-rev1', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'aurora-frost-of-overtones',
    name: 'Frost of overtones',
    category: 'texture',
    description:
      'Everything below two kilohertz cut away, leaving two layers fizzing against each other, blurred into a halo and levelled.',
    instrument: {
      deviceId: 'aurora',
      params: {
        brilliance: 16000,
        lowCut: 2000,
        resonance: 0.3,
        contour: 0,
        attack: 2,
        swell: 0.5,
        release: 5,
        detune: 30,
        volume: -3,
      },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Glass halo',
        params: { smear: 0.9, width: 0.45, mix: 0.8 },
      },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.3 } },
      { deviceId: 'limiter-1176', params: { inputGain: 14, outputGain: -7 } },
    ],
  },
]
