import { type FactoryPreset } from '../types'

export const PEDAL_STEEL_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'steel-slow-chords',
    name: 'Slow steel chords',
    category: 'plucked',
    description:
      'A pedal steel swelled in with the volume pedal, so chords rise out of an amp spring and a long plate.',
    instrument: { deviceId: 'pedal-steel', preset: 'Slow steel' },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'steel-still-glass',
    name: 'Still glass steel',
    category: 'plucked',
    description:
      'Steel strings with no vibrato, faded in over a second and a half and held in a very large, dark space.',
    instrument: { deviceId: 'pedal-steel', preset: 'Still glass', params: { volume: -10.5 } },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45 } },
    ],
    preview: 'chord',
  },
  {
    id: 'steel-long-slides',
    name: 'Long steel slides',
    category: 'plucked',
    description:
      'One string that slides to every overlapping note within an octave, trailing tape echo into a hall.',
    instrument: { deviceId: 'pedal-steel', preset: 'Long slides', params: { volume: -7 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.28, spread: 0.8 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
    preview: 'keys',
  },
  {
    id: 'steel-singing-lead',
    name: 'Singing steel lead',
    category: 'plucked',
    description:
      'A lead that bends between neighbouring notes under a slow, deep bar vibrato, with three echoes and a plate.',
    instrument: { deviceId: 'pedal-steel', preset: 'Singing lead', params: { volume: -6 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.22 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'lap-steel-tremolo',
    name: 'Lap steel tremolo',
    category: 'plucked',
    description:
      'A bright lap steel picked hard with no swell, through amp tremolo and a dripping spring tank.',
    instrument: { deviceId: 'pedal-steel', preset: 'Lap slide', params: { volume: -6 } },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'thumb-picked-steel',
    name: 'Thumb picked steel',
    category: 'plucked',
    description:
      'Every note picked softly over the neck with no pedal swell and no bends, close up in a tight chamber.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0, sustain: 7, range: 0, vibrato: 5, pick: 0.12, tone: 2000, volume: -10 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.3 } }],
  },
  {
    id: 'combo-amp-steel',
    name: 'Combo amp steel',
    category: 'plucked',
    description:
      'A pedal steel with a quick pedal and a firm pick, played through a clean open cabinet into a room.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: {
        swell: 0.2,
        sustain: 12,
        glide: 110,
        vibrato: 12,
        rate: 5.6,
        pick: 0.62,
        tone: 4200,
        volume: -10,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Clean and bright',
        params: { treble: 0.4, distance: 0.3, room: 0.5, output: -4.5 },
      },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'pick-blocked-steel',
    name: 'Pick blocked steel',
    category: 'plucked',
    description:
      'Short steel notes that die away quickly, with no swell, bend or vibrato, in a tight ambience.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { sustain: 2, range: 0, vibrato: 0, pick: 0.6, tone: 3800, volume: -5 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.3 } }],
  },
  {
    id: 'swing-neck-chords',
    name: 'Swing neck chords',
    category: 'plucked',
    description:
      'Dark chords picked softly over the neck with a quick, shallow vibrato, through a warm amplifier in a room.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: {
        swell: 0,
        glide: 80,
        range: 1,
        vibrato: 7,
        rate: 6,
        pick: 0,
        tone: 1700,
        volume: -10,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Warm stack',
        params: { drive: 0.3, distance: 0.1, output: -4 },
      },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
    preview: 'chord',
  },
  {
    id: 'lap-steel-on-shellac',
    name: 'Lap steel on shellac',
    category: 'plucked',
    description:
      'A lap steel with a fast, wide bar vibrato, recorded in a small room and heard from a crackling shellac disc.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Lap slide',
      params: {
        swell: 0.06,
        sustain: 12,
        glide: 130,
        range: 4,
        vibrato: 24,
        rate: 6.6,
        pick: 0.5,
        tone: 3400,
        volume: -10.5,
      },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
      { deviceId: 'vinyl', preset: 'Parlour 78', params: { crackle: 0.35 } },
    ],
  },
  {
    id: 'quick-pedal-bends',
    name: 'Quick pedal bends',
    category: 'plucked',
    description:
      'Steel picked hard, where a neighbouring note snaps the held string to it at once, with one slap and a hall.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: {
        swell: 0,
        sustain: 10,
        glide: 35,
        range: 4,
        vibrato: 5,
        pick: 0.72,
        tone: 4300,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.2, breathDepth: 0 } },
    ],
  },
  {
    id: 'resonator-slide',
    name: 'Resonator slide',
    category: 'plucked',
    description:
      'A hard bridge pick on a bright string that slides to nearby notes, with a nasal peak and a brief ring of tuned strings.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Lap slide',
      params: {
        sustain: 7,
        glide: 200,
        range: 4,
        vibrato: 14,
        rate: 5.2,
        pick: 0.9,
        tone: 6000,
        volume: -16.5,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Resonant peak',
        params: { cutoffHz: 1300, resonance: 1.2, envAmount: 0 },
      },
      {
        deviceId: 'sympathetic',
        preset: 'Short halo',
        params: { decay: 1.6, mix: 0.3, width: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'steel-palm-chimes',
    name: 'Steel palm chimes',
    category: 'bell',
    description:
      'Only the octave above each picked steel note is heard, glassy and still like a palm harmonic, in bright air.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { sustain: 9, range: 0, vibrato: 0, pick: 0.35, tone: 6000, volume: -7.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'High voice alone', params: { spread: 0 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.4, decay: 4, size: 1.3 } },
    ],
  },
  {
    id: 'octave-strung-steel',
    name: 'Octave strung steel',
    category: 'plucked',
    description:
      'Each steel string doubled by a slightly detuned octave above, as on a twelve string guitar, in a hall.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: {
        swell: 0.1,
        sustain: 12,
        glide: 160,
        vibrato: 6,
        pick: 0.65,
        tone: 3600,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string', params: { up1: 0.5, spread: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25, breathDepth: 0 } },
    ],
  },
  {
    id: 'steel-over-strings',
    name: 'Steel over strings',
    category: 'plucked',
    description:
      'A slow steel line with a soft string section that swells in behind each note and lingers after it, in a hall.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: {
        swell: 0.35,
        sustain: 16,
        glide: 320,
        range: 3,
        vibrato: 9,
        rate: 4.8,
        pick: 0.4,
        tone: 3000,
        volume: -8,
      },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'String pad',
        params: { rise: 0.9, fall: 8, width: 0.3, mix: 0.5 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'pedal-steel-organ',
    name: 'Pedal steel organ',
    category: 'organ',
    description:
      'Steel chords for holding, swelled in with no vibrato, stacked in octaves like organ stops, in a slow rotary speaker.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 0.7, range: 0, pick: 0.05, tone: 4800, volume: -12 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Organ' },
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.1, spread: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'steel-vibrato-pad',
    name: 'Steel vibrato pad',
    category: 'pad',
    description:
      'Steel chords for holding: they fade in over two seconds under a slow bar vibrato, thickened by an ensemble in a nave.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 2, vibrato: 14, rate: 3, pick: 0.15, tone: 3400, volume: -8.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'backwards-steel',
    name: 'Backwards steel',
    category: 'plucked',
    description:
      'Short picked steel notes heard only backwards in pieces of half a second, each swelling up to its pick, in a hall.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { sustain: 3, range: 0, vibrato: 0, pick: 0.55, tone: 4500, volume: -6 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards only',
        params: { time: 500, smooth: 0.4, tone: 5000, spread: 0 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'steel-wah-lead',
    name: 'Steel wah lead',
    category: 'plucked',
    description:
      'A steel lead picked hard with a fast, wide vibrato, through a wah that sweeps by itself once a second and a driven stack.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: {
        swell: 0,
        sustain: 20,
        glide: 100,
        vibrato: 28,
        rate: 6.2,
        pick: 0.78,
        tone: 3800,
        volume: 0,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Touch wah',
        params: {
          cutoffHz: 800,
          resonance: 2.5,
          envAmount: 0,
          lfoAmount: 50,
          lfoRateHz: 1.1,
          mix: 0.8,
        },
      },
      {
        deviceId: 're-amp',
        preset: 'Warm stack',
        params: { drive: 0.9, treble: 0.1, output: -3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'low-steel-drone',
    name: 'Low steel drone',
    category: 'drone',
    description:
      'Held low steel strings, picked hard by the bridge and swelled in over a second and a half, thickened by a transformer in a dark cave.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.6, range: 0, vibrato: 3, rate: 3, pick: 0.9, tone: 2300, volume: -10 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.35 } },
    ],
  },
]
