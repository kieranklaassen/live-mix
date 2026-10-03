import { type FactoryPreset } from '../types'

// Berlin Sequencer, 1974: a ladder-filter bass sequence running all night under
// tape-replay flutes and choirs, a phased string ensemble and a combo organ,
// everything through tape echo, phaser, spring and plate.

export const PRESETS: readonly FactoryPreset[] = [
  // ladder-bass: the sequence, its upper lines, pedals and slow leads
  {
    id: 'sequencer-1974-night-run-bass',
    name: 'Night run bass',
    category: 'keys',
    description:
      'Short ladder-filter bass notes that snap shut, one tape head answering each step, in a small plate.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Sequence bass',
      params: {
        cutoff: 420,
        emphasis: 0.4,
        contour: 0.7,
        decay: 0.4,
        drive: 0.5,
        glide: 0.02,
        volume: 2,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: { time: 375, feedback: 0.42, wow: 0.2, flutter: 0.12, highCut: 3800, mix: 0.38 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.18 } },
    ],
    preview: 'line',
  },
  {
    id: 'sequencer-1974-slow-filter-rise',
    name: 'Slow filter rise',
    category: 'keys',
    description:
      'A sequence voice under a second filter that opens and closes over sixteen seconds, with dark bucket-brigade repeats.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Sequence bass',
      params: {
        wave: 0.15,
        cutoff: 1400,
        emphasis: 0.25,
        contour: 0.45,
        decay: 0.45,
        drive: 0.35,
        volume: -2.5,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          slope: 1,
          cutoffHz: 800,
          resonance: 2.2,
          lfoAmount: 65,
          lfoRateHz: 0.06,
          lfoShape: 1,
        },
      },
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 250, feedback: 0.35, mix: 0.3 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.15 } },
    ],
    preview: 'line',
  },
  {
    id: 'sequencer-1974-top-row-gallop',
    name: 'Top row gallop',
    category: 'keys',
    description:
      'A squarer short note printed hot and fed to a dotted tape echo, so four played steps come back as a galloping figure.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Rubber pluck',
      params: {
        wave: 0.6,
        beat: 3,
        sub: 0.1,
        cutoff: 1200,
        emphasis: 0.35,
        contour: 0.5,
        decay: 0.45,
        drive: 0.5,
        glide: 0,
        volume: 4,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 12, outputDb: -6.5 } },
      {
        deviceId: 'tape-echo',
        params: { time: 500, feedback: 0.55, heads: 3, highCut: 5000, spread: 0.7, mix: 0.45 },
      },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { decay: 0.5, mix: 0.2 } },
    ],
    preview: 'bells',
  },
  {
    id: 'sequencer-1974-cellar-pedal-tone',
    name: 'Cellar pedal tone',
    category: 'drone',
    description:
      'Two sawtooths and a sub held on one low note, beating slowly through an eight-stage phaser in a short room.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Pedal drone',
      params: { beat: 11, sub: 0.6, cutoff: 800, emphasis: 0.15, drive: 0.25, volume: -12.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep 8-Stage', params: { rate: 0.07, stereo: 40, mix: 0.45 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'low',
  },
  {
    id: 'sequencer-1974-small-hours-lead',
    name: 'Small hours lead',
    category: 'keys',
    description:
      'A round solo voice that slides for a fifth of a second between notes, with chorused bucket-brigade repeats in a long plate.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Singing lead',
      params: { beat: 7, cutoff: 1300, emphasis: 0.5, glide: 0.22, volume: -0.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorus echo', params: { time: 420, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.28 } },
    ],
    preview: 'line',
  },
  {
    id: 'sequencer-1974-under-the-floor',
    name: 'Under the floor',
    category: 'drone',
    description:
      'Little more than a sub octave, pushed through a transformer so its harmonics carry, with a short room.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Soft sub',
      params: { cutoff: 200, drive: 0.15, volume: -15 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.75, output: -6 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'low',
  },
  {
    id: 'sequencer-1974-dripping-filter',
    name: 'Dripping filter',
    category: 'keys',
    description:
      'A filter close to whistling that yelps open on each note, dripping in a spring tank and printed to tape.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Rubber pluck',
      params: { cutoff: 350, emphasis: 0.7, contour: 0.85, decay: 0.8, drive: 0.6, volume: 3.5 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.3 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
    ],
    preview: 'line',
  },
  {
    id: 'sequencer-1974-warm-room-drift',
    name: 'Warm room drift',
    category: 'drone',
    description:
      'Two oscillators a quarter of a semitone apart, as they drift when the room warms up, under a slow flanger.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 0.2,
        beat: 24,
        sub: 0.2,
        cutoff: 900,
        emphasis: 0.2,
        contour: 0.15,
        decay: 10,
        glide: 0.3,
        volume: -1,
      },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow Sweep', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },

  // tape-orchestra: the tape-replay keyboard, flutes, choir, strings and horns
  {
    id: 'sequencer-1974-courtyard-flute',
    name: 'Courtyard flute',
    category: 'wind',
    description:
      'A tape-replay flute playing a slow line, each note answered by a tape head and left in a long plate.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: { age: 0.45, hiss: 0.2, attack: 0.03, release: 0.45, vibrato: 0.5, volume: -6 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 420, feedback: 0.5, highCut: 4000, mix: 0.33 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'sequencer-1974-worn-flute-reel',
    name: 'Worn flute reel',
    category: 'wind',
    description:
      'Flutes from an old strip of tape held as a chord, lurching and hissing through a four-stage phaser and a long spring.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: {
        age: 0.8,
        hiss: 0.45,
        tone: -0.25,
        attack: 0.08,
        release: 1.2,
        players: 0.8,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Classic 4-Stage', params: { rate: 0.12, mix: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'sequencer-1974-stone-nave-choir',
    name: 'Stone nave choir',
    category: 'voice',
    description:
      'A choir from tape under every key, sung into a stone nave with six seconds of tail.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: { age: 0.35, attack: 0.4, release: 1.6, players: 0.9, volume: -11.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'sequencer-1974-octave-down-choir-tape',
    name: 'Octave-down choir tape',
    category: 'voice',
    description:
      'The choir tape run at half speed, an octave down and dark, wobbling in a very large space.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { speed: 1, tone: -0.5, attack: 0.8, release: 3, volume: -10.5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { highCut: 4000, mix: 0.35 } }],
  },
  {
    id: 'sequencer-1974-tape-strings-turning',
    name: 'Tape strings turning',
    category: 'string',
    description:
      'Violins on tape swelling in over a second, turned slowly by a six-stage phaser into a plate.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { age: 0.4, attack: 1.2, release: 2.4, volume: -5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { rate: 0.08, feedback: 50 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sequencer-1974-cello-reel-bed',
    name: 'Cello reel bed',
    category: 'string',
    description:
      'Cellos at half speed for the low end of a piece, thickened by a tape preamp and set back in a hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { age: 0.5, tone: 0.4, attack: 0.9, release: 3, volume: -15.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'sequencer-1974-horn-reel-chorale',
    name: 'Horn reel chorale',
    category: 'wind',
    description:
      'Horns from tape in a slow chorale, a short slap of echo behind each chord and a hall after it.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: { age: 0.45, hiss: 0.3, attack: 0.5, release: 1.5, volume: -12 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },

  // string-machine: the string ensemble, almost always through a phaser
  {
    id: 'sequencer-1974-six-stage-strings',
    name: 'Six-stage strings',
    category: 'string',
    description:
      'The string ensemble through a slow six-stage phaser, the sweep crossing the chord every ten seconds.',
    instrument: {
      deviceId: 'string-machine',
      params: { attack: 0.8, release: 2.8, high: 0.4, tone: 4000, volume: -4.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { rate: 0.1, feedback: 45, stereo: 60 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { decay: 0.65, mix: 0.22 } },
    ],
  },
  {
    id: 'sequencer-1974-thin-top-octave',
    name: 'Thin top octave',
    category: 'string',
    description:
      'Only the top octave of the ensemble, thin and cold, phased and repeated by two tape heads, with a hall behind.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 1.5, release: 4.5, tone: 6000, volume: -6 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Classic 4-Stage',
        params: { centerHz: 1800, rate: 0.16, depth: 70, mix: 0.45 },
      },
      { deviceId: 'tape-echo', params: { time: 520, feedback: 0.4, heads: 1, mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'sequencer-1974-low-strings-pedal',
    name: 'Low strings pedal',
    category: 'string',
    description:
      'The low octave alone on a pedal fifth, dark, with a deep phaser turning under it in a hall.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 1.4, release: 3.5, tone: 1000, volume: -0.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep 8-Stage', params: { centerHz: 400, rate: 0.05 } },
      { deviceId: 'zita-rev1', preset: 'Hall' },
    ],
    preview: 'low',
  },
  {
    id: 'sequencer-1974-wavering-reel-strings',
    name: 'Wavering reel strings',
    category: 'string',
    description:
      'Strings that swell in slowly in a hall, the whole room then recorded to a wavering reel.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 2.6, release: 5, tone: 2200, volume: -9 },
    },
    effects: [
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35, age: 0.35 } },
    ],
  },
  {
    id: 'sequencer-1974-airfield-strings',
    name: 'Airfield strings',
    category: 'string',
    description:
      'A brighter, drier ensemble under a slow jet flanger with strong feedback, sweeping once every eleven seconds, in a long spring.',
    instrument: {
      deviceId: 'string-machine',
      params: {
        attack: 0.5,
        release: 2.2,
        low: 0.25,
        high: 0.65,
        tone: 5600,
        ensemble: 0.35,
        speed: 0.6,
        volume: -10,
      },
    },
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Classic Jet',
        params: { rate: 0.09, depth: 80, feedback: 55 },
      },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'sequencer-1974-short-bows-spring',
    name: 'Short bows, spring',
    category: 'string',
    description:
      'The ensemble with a fast attack for broken chords and riffs, in a two-spring tank with a slapback.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { attack: 0.03, release: 0.5, tone: 4500, ensemble: 0.6, width: 0.6, volume: -7 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.25 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'sequencer-1974-distant-nave-strings',
    name: 'Distant nave strings',
    category: 'string',
    description:
      'Slow strings played through a speaker stack some way off, in a cathedral with six seconds of tail.',
    instrument: {
      deviceId: 'string-machine',
      params: { attack: 1.8, release: 4, low: 0.55, high: 0.25, tone: 2600, volume: -9.5 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Warm stack',
        params: { drive: 0.2, distance: 0.6, room: 0.5 },
      },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },

  // organ: a thin combo organ, flute stops, a reed through an amplifier, and pipes
  {
    id: 'sequencer-1974-thin-organ-phased',
    name: 'Thin organ, phased',
    category: 'organ',
    description:
      'A thin transistor combo organ with no wind in it, through a six-stage phaser and a spring tank.',
    instrument: {
      deviceId: 'organ',
      params: {
        sub: 0,
        octave: 0.7,
        twelfth: 0.1,
        fifteenth: 0.4,
        reed: 0.5,
        celeste: 0,
        breath: 0,
        bellows: 0,
        tremulant: 0.15,
        attack: 0.01,
        release: 0.12,
        tone: 5500,
        volume: -10.5,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Warm Six-Stage', params: { rate: 0.22 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'sequencer-1974-three-head-organ',
    name: 'Three-head organ',
    category: 'organ',
    description:
      'Hollow flute stops with a strong fifth rank and no reed, played as short notes into three tape heads and a plate.',
    instrument: {
      deviceId: 'organ',
      params: {
        sub: 0.45,
        octave: 0.25,
        twelfth: 0.55,
        fifteenth: 0,
        reed: 0,
        celeste: 0,
        breath: 0,
        bellows: 0,
        attack: 0.005,
        release: 0.15,
        tone: 2600,
        volume: -8.8,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 480, feedback: 0.45, mix: 0.3 },
      },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
  {
    id: 'sequencer-1974-back-room-organ',
    name: 'Back room organ',
    category: 'organ',
    description:
      'A nasal reed organ shaken by its tremulant, through a small amplifier whose fifty-cycle hum stays on between the notes, with dark repeats.',
    instrument: {
      deviceId: 'organ',
      params: {
        sub: 0.25,
        octave: 0.3,
        twelfth: 0,
        fifteenth: 0.1,
        reed: 0.9,
        celeste: 0,
        breath: 0,
        bellows: 0,
        tremulant: 0.7,
        attack: 0.008,
        release: 0.1,
        tone: 3200,
        volume: -14.5,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.4 } },
      { deviceId: 'noise-floor', params: { type: 3, level: -52, width: 0.3, hold: 4 } },
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'sequencer-1974-night-chapel-pipes',
    name: 'Night chapel pipes',
    category: 'organ',
    description:
      'Pipes that take a second and a half to speak, dark and far off, in a hall that breathes in slow waves.',
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { attack: 1.5, release: 5, tone: 1800, volume: -12 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 9, mix: 0.45 } },
    ],
  },
  {
    id: 'sequencer-1974-slow-rotor-pedal',
    name: 'Slow rotor pedal',
    category: 'drone',
    description:
      'A low organ pedal with the sub rank full on, turned by a slow rotating speaker into a small plate.',
    instrument: {
      deviceId: 'organ',
      params: {
        sub: 1,
        octave: 0.3,
        twelfth: 0,
        fifteenth: 0,
        reed: 0.25,
        celeste: 0.4,
        breath: 0.1,
        bellows: 0.2,
        attack: 0.6,
        release: 2.5,
        tone: 1500,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.35 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
    preview: 'low',
  },
  {
    id: 'sequencer-1974-all-stops-flanged',
    name: 'All stops, flanged',
    category: 'organ',
    description:
      'Every rank drawn, swept slowly by a flanger so the upper harmonics rise and fall, in a hall.',
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { reed: 0.4, celeste: 0.1, attack: 0.03, release: 0.6, tone: 5000, volume: -11 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow Sweep', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // aurora: slow synthesizer brass and string layers
  {
    id: 'sequencer-1974-brass-after-hours',
    name: 'Brass after hours',
    category: 'pad',
    description:
      'Synth brass that starts dark, opens past its tone and goes on swelling, through an ensemble chorus into a long plate.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: { brilliance: 1300, attack: 0.7, detune: 10, volume: -7 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush Ensemble', params: { mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sequencer-1974-three-second-swell',
    name: 'Three-second swell',
    category: 'pad',
    description:
      'A chord that starts dark, needs three seconds to speak and keeps opening while held, printed to tape in a hall.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow bloom',
      params: { brilliance: 800, volume: -7.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'sequencer-1974-ring-mod-brass',
    name: 'Ring-mod brass',
    category: 'pad',
    description:
      'Each note opens with a clang like a ring modulator that melts into brass, with two tape heads and a spring.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { attack: 0.15, release: 5, ring: 0.7, volume: -13 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 600, feedback: 0.5, heads: 1, mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'sequencer-1974-low-horn-pedal',
    name: 'Low horn pedal',
    category: 'pad',
    description:
      'Soft synth horns on a low fifth, two seconds to arrive, warmed by a tape preamp in a hall.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { brilliance: 600, lowCut: 60, attack: 2, release: 5, volume: -13.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'zita-rev1', preset: 'Hall' },
    ],
    preview: 'low',
  },
  {
    id: 'sequencer-1974-flanged-string-layer',
    name: 'Flanged string layer',
    category: 'pad',
    description:
      'Two bright string layers sixteen cents apart under a wide slow flanger, in a plate.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { brilliance: 4200, attack: 1.2, detune: 16, volume: -4 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Wide Wash', params: { rate: 0.1 } },
      { deviceId: 'dattorro', preset: 'ambient-live' },
    ],
  },
  {
    id: 'sequencer-1974-resonant-night-pad',
    name: 'Resonant night pad',
    category: 'pad',
    description:
      'A narrow resonant band that almost sings, hollowed by a phaser with negative feedback, in a cathedral.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Night choir',
      params: { resonance: 0.7, attack: 2.4, release: 6, volume: -11 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Negative Notch', params: { rate: 0.09 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },

  // west-coast: modular plucks, random steps and folding pedals
  {
    id: 'sequencer-1974-clock-ticks-dotted',
    name: 'Clock ticks, dotted',
    category: 'plucked',
    description:
      'Short gated plucks, hardly varying from step to step, pushed into tape saturation and a dotted echo that fills in the pattern.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { fold: 0.3, timbreEnv: 0.55, decay: 0.4, colour: 0.6, chance: 0.05, volume: 0 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 16, outputDb: -8.5 } },
      {
        deviceId: 'tape-echo',
        params: { time: 375, feedback: 0.5, heads: 3, spread: 0.6, mix: 0.4 },
      },
      { deviceId: 'dattorro', preset: 'Small plate' },
    ],
  },
  {
    id: 'sequencer-1974-random-voltages',
    name: 'Random voltages',
    category: 'texture',
    description:
      'A held folded tone chopped into random filter steps seven times a second, with a tape echo and a spring.',
    instrument: {
      deviceId: 'west-coast',
      params: {
        fold: 0.6,
        symmetry: 0.3,
        fm: 0.2,
        attack: 0.01,
        decay: 2,
        sustain: 1,
        colour: 0.9,
        drift: 0.4,
        volume: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Stepped',
        params: { mix: 1, resonance: 5, lfoRateHz: 7 },
      },
      { deviceId: 'tape-echo', params: { time: 280, feedback: 0.4, mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'sequencer-1974-folding-pedal',
    name: 'Folding pedal',
    category: 'drone',
    description:
      'A low fifth that keeps folding over itself, a frequency shifter a third of a hertz off beating against it, in a hall.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folding drone',
      params: { fold: 0.75, attack: 2, drift: 0.7, volume: -10 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { fine: 0.3, mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'sequencer-1974-clang-bell-echo',
    name: 'Clang bell echo',
    category: 'bell',
    description:
      'A clangorous bell from deep frequency modulation that dulls as it fades, with one long tape echo in a plate.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Glass bell',
      params: { fm: 0.7, decay: 4, colour: 0.8, volume: -0.5 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 660, feedback: 0.55, mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sequencer-1974-slow-fold-pad',
    name: 'Slow fold pad',
    category: 'pad',
    description:
      'A chord whose overtones unfold over two seconds as the gate opens, with a slow chorus and long murky repeats.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Slow bloom',
      params: { fold: 0.35, attack: 2.2, sustain: 0.85, volume: -9.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.35 } },
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'sequencer-1974-second-row-pulse',
    name: 'Second row pulse',
    category: 'keys',
    description:
      'A dull, hollow pulse for a second sequence line, printed hot to tape with a quarter-second echo.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Deep pulse',
      params: { decay: 0.5, sustain: 0.3, colour: 0.25, volume: -7.5 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { outputDb: -2 } },
      { deviceId: 'tape-echo', params: { time: 250, feedback: 0.35, mix: 0.3 } },
    ],
    preview: 'line',
  },

  // wavetable: one timbre travelling slowly into another
  {
    id: 'sequencer-1974-slow-reed-sweep',
    name: 'Slow reed sweep',
    category: 'pad',
    description:
      'Each note travels from a soft reed to a full sawtooth and back every twelve seconds, through a slow rotating speaker.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: {
        position: 0.4,
        motion: 0.9,
        rate: 0.08,
        detune: 10,
        cutoff: 3500,
        attack: 0.8,
        release: 3,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room', params: { spread: 0.7 } },
      { deviceId: 'dattorro', preset: 'Small plate' },
    ],
  },
  {
    id: 'sequencer-1974-sung-chord-worn-reel',
    name: 'Sung chord, worn reel',
    category: 'pad',
    description:
      'The vowel table moving slowly so the chord seems sung, worn like a reel and left in a long plate.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { motion: 0.6, cutoff: 4500, attack: 1.6, release: 4, spread: 0.6, volume: -11.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sequencer-1974-hollow-square-pad',
    name: 'Hollow square pad',
    category: 'pad',
    description:
      'A hollow tone under a second resonant filter that opens and closes every fourteen seconds, in a hall.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { cutoff: 1400, resonance: 0.35, attack: 2, volume: -12.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          slope: 1,
          cutoffHz: 900,
          resonance: 2.5,
          lfoAmount: 50,
          lfoRateHz: 0.07,
          lfoShape: 1,
        },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sequencer-1974-glass-ripple-echo',
    name: 'Glass ripple echo',
    category: 'pad',
    description:
      'A glassy tone that ripples as it sounds, quick enough for broken chords, with two tape heads and a spring.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: {
        position: 0.75,
        motion: 0.5,
        rate: 0.4,
        sub: 0,
        cutoff: 11000,
        attack: 0.3,
        release: 2.5,
        volume: -10.5,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: { time: 430, feedback: 0.45, heads: 1, highCut: 8000, mix: 0.3 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  {
    id: 'sequencer-1974-night-air-flanged',
    name: 'Night air, flanged',
    category: 'pad',
    description:
      'A bright shifting haze of harmonics that arrives slowly, under a wide flanger in a very large space.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Spectral cloud',
      params: { cutoff: 6000, attack: 4, release: 8, spread: 0.6, volume: -8.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Wide Wash', params: { rate: 0.05, depth: 70, stereo: 60 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sequencer-1974-test-tone-floor',
    name: 'Test tone floor',
    category: 'drone',
    description:
      'A plain low sine and its sub octave with nothing moving, through a console channel onto tape.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { sub: 0.7, cutoff: 700, attack: 1.5, volume: -13 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console edge', params: { drive: 0.35 } },
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } },
    ],
    preview: 'low',
  },

  // acoustic-guitar: the twelve-string figure, and a damped pattern
  {
    id: 'sequencer-1974-twelve-string-figure',
    name: 'Twelve-string figure',
    category: 'plucked',
    description:
      'A twelve-string picked one note at a time onto tape, the doubled courses shimmering through a light phaser into a plate.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { nail: 0.7, sustain: 5, release: 2, tone: 0.6, strum: 8, volume: 4.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.6 } },
      { deviceId: 'phaser', preset: 'Classic 4-Stage', params: { rate: 0.18, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'sequencer-1974-damped-steel-pattern',
    name: 'Damped steel pattern',
    category: 'plucked',
    description:
      'Damped steel-string notes printed hot and played as a pattern into three tape heads, so the guitar becomes one more sequence.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: { sustain: 2.5, release: 0.4, tone: 0.55, volume: -2 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 14, outputDb: -8.5 } },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 375, feedback: 0.45 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.2 } },
    ],
  },

  // atmosphere: noise through a swept filter, the wind and surf of the period
  {
    id: 'sequencer-1974-swept-noise-wind',
    name: 'Swept noise wind',
    category: 'texture',
    description:
      'Noise swept by a resonant low-pass every eleven seconds, a synthesizer wind, phased in a very large space.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: {
        density: 0.6,
        movement: 0.7,
        tone: 0.45,
        resonance: 0.5,
        attack: 3,
        release: 6,
        width: 0.6,
        volume: -1.5,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          slope: 1,
          cutoffHz: 900,
          resonance: 4,
          driveDb: 6,
          lfoAmount: 70,
          lfoRateHz: 0.09,
        },
      },
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sequencer-1974-noise-surf',
    name: 'Noise surf',
    category: 'texture',
    description:
      'Slow waves of filtered noise breaking and drawing back, with a flanger moving inside them and a long spring.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Slow shore',
      params: { density: 0.45, tone: 0.4, width: 0.6, volume: -4.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow Sweep', params: { mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
  },

  // bowed-string: a guitar held singing, and one low bowed string
  {
    id: 'sequencer-1974-singing-guitar-lead',
    name: 'Singing guitar lead',
    category: 'string',
    description:
      'A guitar string held singing with no pick, pushed through a valve stage into a tape echo and a long plate.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        attack: 0.5,
        release: 2.5,
        brightness: 0.6,
        vibrato: 0.3,
        vibratoRate: 5.2,
        detune: 4,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Glowing triode', params: { drive: 0.55, output: -7 } },
      { deviceId: 'tape-echo', params: { time: 480, feedback: 0.5, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    preview: 'line',
  },
  {
    id: 'sequencer-1974-bowed-low-string',
    name: 'Bowed low string',
    category: 'string',
    description:
      'A low fifth bowed with a heavy arm so the string rasps, a six-stage phaser turning slowly through it, in a hall.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 1, release: 2.5, pressure: 0.85, vibrato: 0.1, volume: -9.5 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm Six-Stage',
        params: { rate: 0.08, stereo: 40, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall' },
    ],
    preview: 'low',
  },

  // chamber-strings: one player and a muted section, each treated like a string tape
  {
    id: 'sequencer-1974-lone-taped-violin',
    name: 'Lone taped violin',
    category: 'string',
    description:
      'One close player with a wide vibrato, wobbled and hissed like a single key of a string tape, with a chorused echo in a long spring.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { attack: 0.2, release: 0.9, vibrato: 14, volume: -5.3 },
    },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { wow: 0.4, flutter: 0.3, age: 0.4, hiss: 0.3 },
      },
      { deviceId: 'analog-delay', preset: 'Chorus echo', params: { time: 360, mix: 0.25 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
    preview: 'line',
  },
  {
    id: 'sequencer-1974-far-muted-bows',
    name: 'Far muted bows',
    category: 'string',
    description:
      'Muted bows swelling in over two seconds with no vibrato, far back in a hall and recorded to clean tape.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 2, release: 3.5, volume: -7.5 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, mix: 0.45 } },
      { deviceId: 'patina', preset: 'New tape', params: { tone: 0.5 } },
    ],
  },

  // choir: voices made to sound replayed from tape, and low men under a vault
  {
    id: 'sequencer-1974-tape-voices-phased',
    name: 'Tape voices, phased',
    category: 'voice',
    description:
      'Wordless voices wobbled by tape until they sound replayed, through a phaser into a long plate.',
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: {
        vowel: 0.1,
        breath: 0.15,
        ensemble: 0.5,
        vibrato: 6,
        attack: 0.3,
        release: 1.5,
        tone: 4500,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.45, age: 0.4 } },
      { deviceId: 'phaser', preset: 'Warm Six-Stage', params: { rate: 0.1, mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sequencer-1974-low-vault-voices',
    name: 'Low vault voices',
    category: 'voice',
    description:
      'Low men on a closed vowel with no vibrato, taking two seconds to gather under a stone vault that rings for nine.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { attack: 2, release: 5, volume: -10.5 },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        params: { decay: 9, damping: 0.55, predelayMs: 40, size: 1.6, breathDepth: 0, mix: 0.4 },
      },
    ],
  },

  // chord-harp: strums fed to the echo
  {
    id: 'sequencer-1974-three-head-strum',
    name: 'Three-head strum',
    category: 'plucked',
    description:
      'A chord swept up three octaves into three tape heads, each strum trailing its own pattern.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { strum: 60, sustain: 2.5, tone: 0.55, pad: 0.1, volume: -3.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 400, mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Room' },
    ],
  },
  {
    id: 'sequencer-1974-brushed-harp-phased',
    name: 'Brushed harp, phased',
    category: 'plucked',
    description:
      'A soft brushed chord with a pad under it, the phaser crossing slowly as the strings ring out in a hall.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Brushed chord',
      params: { sustain: 6, pad: 0.5, volume: -10 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },

  // clarinet: a hollow reed stop, and a bass reed with its tape double
  {
    id: 'sequencer-1974-reed-stop-echo',
    name: 'Reed stop, echo',
    category: 'wind',
    description:
      'A hollow reed line with slow vibrato, like the woodwind stop of a preset lead synthesizer, with a chorused echo and a spring.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { blow: 0.5, breath: 0.2, attack: 0.08, release: 0.5, vibrato: 0.35, volume: -8 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorus echo',
        params: { time: 450, feedback: 0.45, mix: 0.3 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'sequencer-1974-half-speed-reed',
    name: 'Half-speed reed',
    category: 'wind',
    description:
      'A bass reed doubled an octave lower by a half-speed tape copy, on a quarter-inch reel in a hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { attack: 0.4, release: 1.2, volume: -4 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.45 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // drone: banks of oscillators left running
  {
    id: 'sequencer-1974-oscillator-bank',
    name: 'Oscillator bank',
    category: 'drone',
    description:
      'A bank of sawtooth oscillators in octaves that never quite hold their tuning, under a twelve-stage phaser.',
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: {
        partials: 0.6,
        wave: 1,
        movement: 0.6,
        rate: 0.05,
        sub: 0.5,
        cutoff: 900,
        attack: 4,
        release: 8,
        volume: -5,
      },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Twelve Stage Cloud',
        params: { rate: 0.05, stereo: 60, mix: 0.4 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'sequencer-1974-fifths-under-fog',
    name: 'Fifths under fog',
    category: 'drone',
    description:
      'Open fifths with tuned air over them, arriving slowly, on tape in a very large space.',
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: { wave: 0.3, air: 0.3, cutoff: 1400, attack: 5, volume: -10 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
  },

  // dusk: a later polysynth made to behave like the string ensemble
  {
    id: 'sequencer-1974-pulse-width-pad',
    name: 'Pulse-width pad',
    category: 'pad',
    description:
      'A moving pulse wave with its own chorus on, through a six-stage phaser into a plate.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Wide pulse',
      params: { cutoff: 2800, attack: 1, release: 3.5, chorus: 1, volume: -7.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Warm Six-Stage', params: { rate: 0.14, mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'ambient-live' },
    ],
  },
  {
    id: 'sequencer-1974-filter-ring-two-heads',
    name: 'Filter ring, two heads',
    category: 'keys',
    description:
      'The filter ringing on its own two octaves above the key, nearly a sine, echoed by two tape heads in a spring.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { attack: 0.3, release: 3, volume: -11 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 560, feedback: 0.55, heads: 1, mix: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
    preview: 'line',
  },

  // ember: sample-and-hold on a held chord, and a solo voice
  {
    id: 'sequencer-1974-sample-and-hold',
    name: 'Sample and hold',
    category: 'pad',
    description:
      'A held chord whose resonant filter jumps to a new random value six times a second, with dark repeats and a spring.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: {
        cutoff: 900,
        resonance: 0.55,
        filterEnvAmount: 0,
        ampAttack: 0.3,
        ampRelease: 2.5,
        lfo1Shape: 4,
        lfo1Rate: 6,
        lfo1Amount: 0.5,
        lfo2Amount: 0,
        volume: -8.5,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { time: 330, mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'sequencer-1974-legato-pulse-lead',
    name: 'Legato pulse lead',
    category: 'keys',
    description:
      'A narrow pulse lead with vibrato that glides between legato notes, phased, with two tape heads and a spring.',
    instrument: {
      deviceId: 'ember',
      params: {
        osc1Shape: 1,
        osc1Pw: 0.3,
        osc2Fine: 6,
        oscMix: 0.3,
        cutoff: 1800,
        resonance: 0.25,
        keyTrack: 0.5,
        filterEnvAmount: 0.3,
        filterAttack: 0.15,
        filterDecay: 0.8,
        ampAttack: 0.06,
        ampRelease: 0.6,
        lfo1Rate: 5.2,
        lfo1Dest: 0,
        lfo1Amount: 0.015,
        voiceMode: 2,
        glide: 0.12,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Classic 4-Stage', params: { rate: 0.2, mix: 0.3 } },
      { deviceId: 'tape-echo', params: { time: 500, feedback: 0.5, heads: 1, mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    preview: 'line',
  },

  // felt-piano: the unfelted grand, forwards and backwards
  {
    id: 'sequencer-1974-piano-swelling-to-strike',
    name: 'Piano swelling to strike',
    category: 'keys',
    description:
      'Unfelted piano notes heard mostly backwards, each one swelling up to where it was struck, in a long plate.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        hardness: 0.4,
        thump: 0,
        action: 0,
        pedalNoise: 0,
        resonance: 0.7,
        reverbMix: 0.1,
        outputDb: -12.3,
      },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Slow swells',
        params: { time: 1400, feedback: 0.25, mix: 0.8 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sequencer-1974-bare-concert-grand',
    name: 'Bare concert grand',
    category: 'keys',
    description:
      'A hard-hammered unfelted piano for the slow introduction, its strings ringing on as if pedalled, with a short echo and a hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        hardness: 0.75,
        thump: 0.2,
        reverbMix: 0.2,
        reverbSize: 0.6,
        width: 0.7,
        outputDb: -11,
      },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Piano pedal', params: { root: 2, mode: 1, mix: 0.3 } },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 220, mix: 0.2 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // flute: a wooden flute into the echo, and breath in place of the flute tape
  {
    id: 'sequencer-1974-wood-flute-echo',
    name: 'Wood flute echo',
    category: 'wind',
    description:
      'A plain wood flute phrase answered by a long tape echo that keeps four or five repeats going, in a spring.',
    instrument: {
      deviceId: 'flute',
      params: {
        type: 4,
        breath: 0.35,
        blow: 0.4,
        chiff: 0.6,
        attack: 0.03,
        release: 0.6,
        vibrato: 0.3,
        scoop: 20,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 700, feedback: 0.62, highCut: 3500, mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'sequencer-1974-taped-flute-chord',
    name: 'Taped flute chord',
    category: 'wind',
    description:
      'Low flutes held as a chord and put on wobbling tape, real breath standing in for the tape-replay flutes.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: {
        breath: 0.6,
        blow: 0.3,
        chiff: 0.1,
        attack: 0.5,
        release: 2,
        vibrato: 0.4,
        volume: -17,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4, flutter: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },

  // fm-glass: a bell soured by a ring modulator, and one glass pad under a tape flange
  {
    id: 'sequencer-1974-sour-ring-bell',
    name: 'Sour ring bell',
    category: 'bell',
    description:
      'A bell at an uneven ratio, ring-modulated against a fixed tone so its pitch turns sour, with a tape echo.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { ratio: 4, brightness: 0.5, decay: 3, volume: -6.5 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Radio ring',
        params: { shift: 140, feedback: 0.1, mix: 0.5 },
      },
      { deviceId: 'tape-echo', params: { time: 500, feedback: 0.5, mix: 0.3 } },
    ],
  },
  {
    id: 'sequencer-1974-glass-pad-flanged',
    name: 'Glass pad, flanged',
    category: 'pad',
    description:
      'A glassy pad with slow beating between its operators, flanged close to zero delay the way two tape machines do it, in a hall.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { ratio: 5, brightness: 0.55, attack: 2, spread: 0.5, volume: -12.8 },
    },
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Through-Zero Feel',
        params: { rate: 0.07, depth: 85, stereo: 120, mix: 0.45 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // grain-synth: whatever is loaded, treated as the studio would have treated it
  {
    id: 'sequencer-1974-loaded-sound-phased',
    name: 'Loaded sound, phased',
    category: 'pad',
    description:
      'Whatever is loaded, frozen at one moment and held as a pad, through a deep phaser into a very large space.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: { attack: 1.5, release: 4, volume: -17 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep 8-Stage', params: { rate: 0.1, mix: 0.45 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sequencer-1974-reel-by-hand',
    name: 'Reel by hand',
    category: 'pad',
    description:
      'Whatever is loaded, read through slowly like a reel dragged by hand, then caught on a three-second loop of tape that fades.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Slow stretch',
      params: {
        scan: 0.06,
        size: 300,
        density: 6,
        attack: 0.4,
        release: 2,
        spread: 0.5,
        tone: 6000,
        volume: -11.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4 } },
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 3, feedback: 0.6, mix: 0.35 },
      },
    ],
  },

  // guitar: clean through phaser and echo, and a fuzz lead that holds
  {
    id: 'sequencer-1974-clean-guitar-echo',
    name: 'Clean guitar echo',
    category: 'plucked',
    description:
      'A clean neck pickup picked slowly through a four-stage phaser, a tape echo and an amp spring.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { hardness: 0.5, tone: 3200, strum: 10, volume: 4.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Classic 4-Stage', params: { rate: 0.25, mix: 0.3 } },
      { deviceId: 'tape-echo', params: { time: 440, mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'sequencer-1974-fuzz-sustain-lead',
    name: 'Fuzz sustain lead',
    category: 'plucked',
    description:
      'Single notes driven into fuzz so they hold and sing, repeated by three tape heads in a hall.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { sustain: 25, tone: 2600, swell: 0.25, volume: 0 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: {
          drive: 0.6,
          circuit: 4,
          push: 1,
          lowCut: 120,
          tone: -0.3,
          highCut: 4000,
          output: -5,
        },
      },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },

  // handpan: steel used as a sequence voice and as a gong
  {
    id: 'sequencer-1974-steel-steps',
    name: 'Steel steps',
    category: 'bell',
    description:
      'Damped steel taps given a metallic edge by a frequency shifter and fed to a dotted echo like one more sequence.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Rain taps',
      params: { decay: 1.5, touch: 0.6, damp: 0.5, volume: -1 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Bell metal', params: { shift: 90, mix: 0.4 } },
      { deviceId: 'tape-echo', params: { time: 375, feedback: 0.5, heads: 3, mix: 0.4 } },
    ],
  },
  {
    id: 'sequencer-1974-slowed-steel-gong',
    name: 'Slowed steel gong',
    category: 'bell',
    description:
      'One steel note with a half-speed copy an octave under it, ringing like a small gong, phased, in a long plate.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Low ding',
      params: { decay: 8, volume: 2 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { spread: 0.5, mix: 0.5 } },
      { deviceId: 'phaser', preset: 'Deep 8-Stage', params: { stereo: 40, mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    preview: 'hold',
  },

  // harp: plucked like a keyboard, and a run into the plate
  {
    id: 'sequencer-1974-plucked-keyboard',
    name: 'Plucked keyboard',
    category: 'plucked',
    description:
      'Strings plucked hard at the very end so they bite like a plucked keyboard, printed hot to tape and lightly phased in a small plate.',
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { pluck: 0.06, touch: 0.8, decay: 1.5, halo: 0.25, body: 0.35, volume: 4 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.7, hiss: 0.05 } },
      { deviceId: 'phaser', preset: 'Classic 4-Stage', params: { rate: 0.2, mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Small plate' },
    ],
  },
  {
    id: 'sequencer-1974-harp-run-plate',
    name: 'Harp run, plate',
    category: 'plucked',
    description:
      'A slow sweep across the strings before each note, the whole run caught and held by a long plate.',
    instrument: {
      deviceId: 'harp',
      preset: 'Glissando',
      params: { halo: 0.9, sweep: 1, volume: -3 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.2 } },
      { deviceId: 'dattorro', preset: 'Long plate' },
    ],
  },

  // horns: low brass under the phaser, and one far player
  {
    id: 'sequencer-1974-low-brass-turning',
    name: 'Low brass turning',
    category: 'wind',
    description:
      'Low brass swelling in slowly, a section on every key, turned by a phaser in a hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { blow: 0.5, attack: 2.5, release: 5, volume: -3.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Warm Six-Stage', params: { rate: 0.09, mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall' },
    ],
    preview: 'chord',
  },
  {
    id: 'sequencer-1974-far-horn-line',
    name: 'Far horn line',
    category: 'wind',
    description:
      'One breathy flugelhorn playing a slow line, long murky repeats trailing it across a hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { attack: 0.3, release: 1.8, volume: 0 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },

  // mallets: vibes under the phaser, and a high pattern for the echo
  {
    id: 'sequencer-1974-phased-vibraphone',
    name: 'Phased vibraphone',
    category: 'bell',
    description:
      'Vibraphone bars with the motor turning slowly, through a six-stage phaser in a short room.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { decay: 1.5, motor: 0.5, motorRate: 3.5, volume: -5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Warm Six-Stage', params: { rate: 0.15, mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sequencer-1974-dotted-celesta-pattern',
    name: 'Dotted celesta pattern',
    category: 'bell',
    description:
      'Small celesta notes fed to a dotted tape echo, a high pattern to set over the bass sequence.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.4, damper: 0.5, volume: -7.5 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 400, feedback: 0.5, heads: 3, mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },

  // modal-bells: a gong, and struck bars
  {
    id: 'sequencer-1974-opening-gong',
    name: 'Opening gong',
    category: 'bell',
    description:
      'One gong stroke, the kind that opens a side, recorded to tape and left to spread in a long plate.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { decay: 25, hardness: 0.45, brightness: 0.6, spread: 0.6, volume: -0.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'dattorro', preset: 'Long plate' },
    ],
    preview: 'hold',
  },
  {
    id: 'sequencer-1974-echoing-metal-bars',
    name: 'Echoing metal bars',
    category: 'bell',
    description:
      'Struck metal bars repeated by three tape heads, a four-stage phaser moving over the echoes.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 5, hardness: 0.6, volume: 2.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.35 } },
      { deviceId: 'phaser', preset: 'Classic 4-Stage', params: { mix: 0.3 } },
    ],
  },

  // outdoors: field sounds made to pass for the synthesizer
  {
    id: 'sequencer-1974-electric-birds',
    name: 'Electric birds',
    category: 'texture',
    description:
      'Whistled bird calls through tape echo and a slack spring until they sound like a synthesizer chirping.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Dawn chorus',
      params: { density: 0.4, distance: 0.3, tone: 0.6, width: 0.6, volume: -5.5 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 300, feedback: 0.6, mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sequencer-1974-crickets-phased',
    name: 'Crickets, phased',
    category: 'texture',
    description:
      'Crickets on a warm night with a slow phaser drawn across them, recorded to a quarter-inch reel.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Summer night',
      params: { density: 0.95, distance: 0.75, width: 0.6, volume: 3 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { centerHz: 2500 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.6, hiss: 0.15 } },
    ],
  },

  // pedal-steel: a slide line into the echo, and a faded-in chord in a rotating speaker
  {
    id: 'sequencer-1974-slide-through-echo',
    name: 'Slide through echo',
    category: 'plucked',
    description:
      'A slide guitar line with a little valve drive, bending into each new note, with two tape heads and a long plate.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Lap slide',
      params: { swell: 0.15, sustain: 14, range: 7, vibrato: 12, tone: 3500, volume: -6 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Glowing triode', params: { drive: 0.4 } },
      { deviceId: 'tape-echo', params: { time: 480, feedback: 0.5, heads: 1, mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    preview: 'line',
  },
  {
    id: 'sequencer-1974-faded-steel-chord',
    name: 'Faded steel chord',
    category: 'plucked',
    description:
      'Steel strings faded in with a volume pedal and no vibrato, a held chord turning in a slow rotating speaker, in a hall.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.2, sustain: 30, tone: 2600, volume: -10 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.15, distance: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },

  // sampler: any recording turned into a tape-replay key
  {
    id: 'sequencer-1974-tape-replay-key',
    name: 'Tape-replay key',
    category: 'pad',
    description:
      'Whatever is loaded, looped under each key with tape wobble like a tape-replay keyboard, on a hissing reel in a plate.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: {
        tune: 0,
        fine: 5,
        attack: 0.25,
        release: 1.5,
        tone: 4500,
        wobble: 0.6,
        volume: -17.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { age: 0.4, hiss: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sequencer-1974-loaded-sound-reversed',
    name: 'Loaded sound, reversed',
    category: 'keys',
    description:
      'Whatever is loaded played backwards from its end, with two tape heads and a long spring.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Backwards',
      params: { release: 1.5, tone: 7000, volume: -15 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 450, feedback: 0.5, heads: 1, mix: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
  },

  // tanpura: a drone lute from before the sequencer, once plain and once buzzing
  {
    id: 'sequencer-1974-drone-lute-flanged',
    name: 'Drone lute, flanged',
    category: 'drone',
    description:
      'Four strings with the buzz closed off, plucked round every three seconds like a slow sequence, under a slow flanger in a plate.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Closed jawari',
      params: { jawari: 0.15, speed: 3, decay: 8, body: 0.6, volume: 1.6 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow Sweep', params: { mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'sequencer-1974-buzzing-strings-reel',
    name: 'Buzzing strings, reel',
    category: 'drone',
    description:
      'Buzzing strings plucked so slowly they run into one mass, recorded to a wavering reel and sent to a long spring.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wall',
      params: { speed: 9, decay: 25, volume: -7 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
  },

  // thesis: chords of filtered noise
  {
    id: 'sequencer-1974-tuned-noise-bands',
    name: 'Tuned noise bands',
    category: 'pad',
    description:
      'Noise through narrow tuned filters, a chord of whistling bands, with a jet flanger passing over it in a long plate.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { resonance: 60, attack: 1.2 },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { gain: 8.5, ceiling: -6 } },
      { deviceId: 'flanger', preset: 'Classic Jet', params: { rate: 0.12, stereo: 60, mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sequencer-1974-noise-chord-echo',
    name: 'Noise chord echo',
    category: 'plucked',
    description:
      'Short strummed strokes of tuned noise in a Dorian mode, repeated by three tape heads in a spring.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Strummed Lydian',
      params: { resonance: 50, attack: 0.03, release: 1.5, strum: 60, scale: 4, root: 2 },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { gain: -2, ceiling: -6 } },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },

  // tine-piano: the electric piano through the phaser
  {
    id: 'sequencer-1974-tines-through-phaser',
    name: 'Tines through phaser',
    category: 'keys',
    description:
      'An electric piano with its tremolo off, through a six-stage phaser turning every three seconds, in a small plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { bell: 0.5, tremolo: 0, volume: -9 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Warm Six-Stage', params: { rate: 0.35, depth: 70 } },
      { deviceId: 'dattorro', preset: 'Small plate' },
    ],
  },
  {
    id: 'sequencer-1974-night-tines-echo',
    name: 'Night tines, echo',
    category: 'keys',
    description:
      'Dark, soft tines with a slow stereo tremolo, a dark bucket-brigade echo behind them and a hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { decay: 2, tremolo: 0.4, tremoloRate: 1.2, volume: -15.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 430, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // zither: strings plucked and hammered inside the piano
  {
    id: 'sequencer-1974-inside-the-piano',
    name: 'Inside the piano',
    category: 'plucked',
    description:
      'Single strings plucked by hand as if inside a piano, the others ringing in sympathy, in a slack spring and a plate.',
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: {
        exciter: 0,
        chord: 0,
        strum: 0,
        decay: 10,
        release: 8,
        brightness: 0.45,
        position: 0.12,
        sympathy: 0.8,
        volume: -6.5,
      },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sequencer-1974-hammered-strings-echo',
    name: 'Hammered strings, echo',
    category: 'plucked',
    description:
      'Hammered strings in octaves, three tape heads turning each stroke into a pattern, in a small dark room.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { roll: 0, decay: 5, release: 3, volume: -6.5 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 375, feedback: 0.5, heads: 2, mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
  },
]
