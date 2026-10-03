import { type FactoryPreset } from '../types'

// Harp sweeps, an electric organ in a turning speaker, strings that swoop and a
// tanpura under all of it: modal jazz carried up a canyon road to a prayer hall.

export const PRESETS: readonly FactoryPreset[] = [
  // harp
  {
    id: 'ashram-first-sweep',
    name: 'First sweep',
    category: 'plucked',
    description: 'A held chord rolled up the harp in under a second, ringing into a long plate.',
    instrument: {
      deviceId: 'harp',
      preset: 'Glissando',
      params: { sweep: 0.7, halo: 0.9, volume: -4 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.32 } }],
    preview: 'chord',
  },
  {
    id: 'ashram-saffron-harp',
    name: 'Saffron harp',
    category: 'plucked',
    description: 'A concert harp plucked mid-string, turned slowly by a phaser in a small plate.',
    instrument: { deviceId: 'harp', preset: 'Concert harp', params: { touch: 0.5, volume: 0 } },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.11, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { decay: 0.6, mix: 0.28 } },
    ],
  },
  {
    id: 'ashram-harp-over-drone',
    name: 'Harp over drone',
    category: 'plucked',
    description:
      'Soft harp notes that wake a bank of strings tuned to D, humming on behind in a hall.',
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { pluck: 0.42, touch: 0.25, decay: 1.4, halo: 0.7, volume: -7 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Sitar drone',
        params: { mode: 1, decay: 7, mix: 0.3, width: 0.6 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ashram-canyon-sweep',
    name: 'Canyon sweep',
    category: 'plucked',
    description: 'A slow roll of long-ringing strings with tape repeats falling away into a plate.',
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { sweep: 1.4, touch: 0.3, decay: 2.4, volume: -5.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 460, feedback: 0.4, mix: 0.25 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.35, mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'ashram-late-set-harp',
    name: 'Late set harp',
    category: 'plucked',
    description:
      'Short, dry notes plucked hard near the soundboard for quick lines, on tape in a room.',
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { touch: 0.7, decay: 0.45, damp: 0.25, halo: 0.15, volume: 1.6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.45, hiss: 0.15 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'ashram-wound-strings',
    name: 'Wound strings',
    category: 'plucked',
    description:
      'The low wire-wound strings of the harp, plucked full and left to hum in a dark spring.',
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { pluck: 0.22, touch: 0.5, decay: 1.8, halo: 0.6, body: 0.9, volume: -8.5 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      {
        deviceId: 'spring-reverb',
        preset: 'Dark amp spring',
        params: { decay: 2.6, mix: 0.3, width: 0.6 },
      },
    ],
    preview: 'low',
  },
  {
    id: 'ashram-harp-and-section',
    name: 'Harp and section',
    category: 'plucked',
    description: 'Each harp chord is answered by a soft string section that swells in behind it.',
    instrument: {
      deviceId: 'harp',
      preset: 'Glissando',
      params: { sweep: 0.35, touch: 0.45, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Slow swell',
        params: { rise: 1.6, fall: 6, octaves: 0.3, ensemble: 0.5, mix: 0.45 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.28 } },
    ],
    preview: 'chord',
  },

  // organ
  {
    id: 'ashram-swirling-organ',
    name: 'Swirling organ',
    category: 'organ',
    description:
      'A full reedy registration through a fast rotating speaker pushed into drive, on a plate.',
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { sub: 0.5, twelfth: 0.35, reed: 0.7, celeste: 0, bellows: 0, volume: -15 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Tremolo', params: { drive: 0.55, distance: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { decay: 0.65, mix: 0.25 } },
    ],
  },
  {
    id: 'ashram-chorale-organ',
    name: 'Chorale organ',
    category: 'organ',
    description:
      'Flutes and a little reed in a slowly turning speaker, warmed and left in a long plate.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { reed: 0.2, fifteenth: 0.2, bellows: 0, attack: 0.04, release: 0.5, volume: -19.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.3 } },
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ashram-reed-solo',
    name: 'Reed solo',
    category: 'organ',
    description:
      'A thin snarling reed stop for single lines, through a growling rotor and a spring.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: {
        sub: 0,
        octave: 0.5,
        twelfth: 0.4,
        fifteenth: 0.3,
        reed: 1,
        celeste: 0,
        breath: 0.1,
        bellows: 0,
        attack: 0.01,
        release: 0.15,
        tone: 5200,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Growl', params: { drive: 0.7, hornDepth: 0.8 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
    preview: 'line',
  },
  {
    id: 'ashram-prayer-hall-harmonium',
    name: 'Prayer hall harmonium',
    category: 'organ',
    description:
      'A hand-pumped harmonium with an uneven bellows, close on quarter-inch tape in a room.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { sub: 0.3, celeste: 0.35, bellows: 0.7, release: 0.35, tone: 2800, volume: -12 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.28 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'ashram-pedal-tone',
    name: 'Pedal tone',
    category: 'drone',
    description: 'The organ pedals alone: a sub rank and its beating twin under a slow bass rotor.',
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: {
        sub: 1,
        octave: 0.35,
        reed: 0.25,
        celeste: 0.6,
        attack: 0.6,
        tone: 1400,
        volume: -15,
      },
    },
    effects: [
      {
        deviceId: 'rotary',
        preset: 'Chorale',
        params: { hornDepth: 0.3, drumDepth: 0.8, balance: 0.3, drive: 0.35 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'ashram-phased-flutes',
    name: 'Phased flutes',
    category: 'organ',
    description: 'Soft flute stops swept by a deep eight-stage phaser, wide in a hall.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { sub: 0.35, octave: 0.5, attack: 0.15, release: 1.2, tone: 4000, volume: -9 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.14, feedback: 50 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'ashram-sunday-organ',
    name: 'Sunday organ',
    category: 'organ',
    description:
      'A church organ with its tremulant on, heard through a combo amplifier and its spring.',
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { reed: 0.35, fifteenth: 0.35, tremulant: 0.55, tone: 4200, volume: -15 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.4, room: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { drip: 0.25, mix: 0.25 } },
    ],
  },
  {
    id: 'ashram-bent-organ-line',
    name: 'Bent organ line',
    category: 'organ',
    description:
      'One reedy line whose pitch sways like a bent key, through a slow rotor into a tape echo.',
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { octave: 0.5, twelfth: 0.25, reed: 0.6, tremulant: 0.2, tone: 5000, volume: -8 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Pitch wobble',
        params: { phase: 0, rate: 1.3, depth: 0.55, drift: 0.7 },
      },
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.45 } },
      { deviceId: 'tape-echo', params: { time: 420, mix: 0.25 } },
    ],
    preview: 'line',
  },

  // tanpura
  {
    id: 'ashram-morning-tanpura',
    name: 'Morning tanpura',
    category: 'drone',
    description:
      'Four strings plucked round in a steady cycle, their buzz opening into a small plate.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { spread: 0.7, volume: -3 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.25 } }],
  },
  {
    id: 'ashram-slow-cycle',
    name: 'Slow cycle',
    category: 'drone',
    description:
      'A slow cycle on long strings with the bridge wide open, on master tape in a long plate.',
    instrument: { deviceId: 'tanpura', preset: 'Slow wall', params: { speed: 8, volume: -5 } },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'ashram-fourth-string-dusk',
    name: 'Fourth string dusk',
    category: 'drone',
    description:
      'The suspended tuning on the fourth, with a slow phaser turning its overtones in a hall.',
    instrument: { deviceId: 'tanpura', preset: 'Ma tuning', params: { spread: 0.7, volume: -2 } },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { centerHz: 900, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ashram-rotor-tanpura',
    name: 'Rotor tanpura',
    category: 'drone',
    description:
      'The leading-note tuning sent through a slow rotating speaker, so the buzz circles the room.',
    instrument: { deviceId: 'tanpura', preset: 'Evening Ni', params: { volume: -8 } },
    effects: [
      {
        deviceId: 'rotary',
        preset: 'Across the room',
        params: { distance: 0.6, drive: 0.2, mix: 0.8 },
      },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'ashram-open-bridge',
    name: 'Open bridge',
    category: 'drone',
    description:
      'A quick round with the bridge buzzing as far as it goes, pushed lightly through a valve.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { jawari: 1, speed: 3.2, decay: 9, body: 0.55, volume: -5.5 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 7, outputDb: -4 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ashram-cassette-tanpura',
    name: 'Cassette tanpura',
    category: 'drone',
    description:
      'A closed, woody buzz as a home cassette kept it, wavering and with hiss, in a small room.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Closed jawari',
      params: { speed: 5, decay: 10, spread: 0.15, volume: -4 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.35 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.3, decay: 1.6 } },
    ],
  },

  // chamber-strings
  {
    id: 'ashram-swaying-strings',
    name: 'Swaying strings',
    category: 'string',
    description:
      'A warm section with wide vibrato whose pitch sways slowly up and down together, in a long plate.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 0.3, release: 1.6, vibrato: 18, scatter: 0.6, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Slow chorus',
        params: { rate: 0.8, depth: 1, phase: 0, drift: 0.6, mix: 1 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.32 } },
    ],
  },
  {
    id: 'ashram-still-strings',
    name: 'Still strings',
    category: 'string',
    description:
      'Three players a note with no vibrato, arriving slowly over strings tuned to D that ring on.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { attack: 2.2, release: 4.5, air: 0.3, volume: -12 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Sitar drone',
        params: { mode: 1, sympathy: 0.6, decay: 8, mix: 0.3, width: 0.7 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 3.2, mix: 0.35 } },
    ],
  },
  {
    id: 'ashram-octave-line',
    name: 'Octave line',
    category: 'string',
    description:
      'A unison violin line bowed towards the bridge and doubled an octave above itself, in a small plate.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        players: 4,
        attack: 0.12,
        release: 0.7,
        bow: 0.65,
        vibrato: 10,
        mute: 0,
        scatter: 0.2,
        volume: -2.5,
      },
    },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'Twelve string',
        params: { up1: 0.45, detune: 0.3, spread: 0.5 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { decay: 0.6, mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'ashram-shaking-bows',
    name: 'Shaking bows',
    category: 'string',
    description:
      'A section made to shiver like tremolo bowing by an uneven tremolo nine times a second, in a plate.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: { players: 5, attack: 0.2, bow: 0.55, air: 0.45, vibrato: 4, volume: -5.5 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { rate: 9, depth: 0.7, shape: 1, phase: 60, drift: 0.6, smooth: 0.3 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ashram-low-desks',
    name: 'Low desks',
    category: 'string',
    description: 'Cellos and basses holding a low fifth with slow, full bows, on tape in a hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Slow dark bows',
      params: { attack: 0.9, bow: 0.35, vibrato: 5, mute: 0.3, volume: -8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { lowDecay: 4, mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'ashram-free-violin',
    name: 'Free violin',
    category: 'string',
    description:
      'One violin bowed near the bridge, close and thin with a wide vibrato, in a spring tank.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { attack: 0.08, bow: 0.8, air: 0.5, vibrato: 20, scatter: 0.6, volume: -12 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { outputDb: -2, driveDb: 6 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.28 } },
    ],
    preview: 'line',
  },
  {
    id: 'ashram-phased-section',
    name: 'Phased section',
    category: 'string',
    description:
      'Six muted players a note through a twelve-stage phaser, the whole section turning in a hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 1, release: 2.2, bow: 0.3, vibrato: 9, mute: 0.75, volume: -5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { rate: 0.09, mix: 0.45 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // choir
  {
    id: 'ashram-evening-voices',
    name: 'Evening voices',
    category: 'voice',
    description: 'A small room of singers on an open ah with a little vibrato, in a plate.',
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { ensemble: 0.8, vibrato: 14, attack: 0.5, release: 2, tone: 5200, volume: -10 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } }],
  },
  {
    id: 'ashram-back-row-basses',
    name: 'Back row basses',
    category: 'voice',
    description: 'Men holding a closed oh on a low fifth with no vibrato, kept on a worn cassette.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { vowel: 0.75, attack: 1, release: 3, volume: -7 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.3, noise: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 1.8, mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'ashram-alto-lead',
    name: 'Alto lead',
    category: 'voice',
    description:
      "One low woman's voice with a slow wide vibrato, singing a line into a long plate.",
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: {
        vowel: 0.12,
        voice: 1.02,
        vibrato: 26,
        vibratoRate: 4.8,
        attack: 0.2,
        release: 0.9,
        tone: 5000,
        volume: -6,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
    preview: 'line',
  },
  {
    id: 'ashram-sung-reply',
    name: 'Sung reply',
    category: 'voice',
    description: 'A chord of drifting vowels that a tape echo sings back twice, in a hall.',
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { motion: 0.7, attack: 0.8, release: 2.5, volume: -10.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 700, feedback: 0.3, heads: 1, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ashram-humming-women',
    name: 'Humming women',
    category: 'voice',
    description:
      'Women humming a closed oo with little vibrato, turned by a slow phaser in a long plate.',
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: {
        voice: 1.24,
        vibrato: 8,
        attack: 0.9,
        release: 3,
        tone: 6000,
        width: 0.65,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'ashram-cabinet-voices',
    name: 'Cabinet voices',
    category: 'voice',
    description:
      'A sung ah played back through the organ speaker from across the room, in a spring.',
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { vowel: 0.15, motion: 0.2, ensemble: 0.5, vibrato: 6, attack: 0.4, volume: -12 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room', params: { drive: 0.25, distance: 0.7 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.2 } },
    ],
  },

  // tine-piano
  {
    id: 'ashram-phased-tines',
    name: 'Phased tines',
    category: 'keys',
    description:
      'A soft, hollow electric piano through a four-stage phaser at walking pace, in a small plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { bark: 0.15, tremolo: 0.1, tone: 0.45, volume: -9.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.55, feedback: 50 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'ashram-driven-tines',
    name: 'Driven tines',
    category: 'keys',
    description:
      'Tines played hard so the pickup barks, into a glowing valve stage and a two-spring tank.',
    instrument: { deviceId: 'tine-piano', preset: 'Barking stage', params: { volume: -13 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.4, output: -3 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'ashram-tremolo-dusk',
    name: 'Tremolo dusk',
    category: 'keys',
    description: 'Tines pulsing from side to side six times a second, on tape in a hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Tremolo',
      params: { pan: 1, tremolo: 0.7, decay: 1.4, release: 0.5, volume: -14.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ashram-long-tine-echo',
    name: 'Long tine echo',
    category: 'keys',
    description: 'Bell-like tines with a long sustain, repeated by dotted tape heads into a plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { bell: 0.75, tremolo: 0, volume: -16 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Dub wash',
        params: { time: 560, feedback: 0.5, spread: 0.7, mix: 0.3 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'ashram-tines-over-strings',
    name: 'Tines over strings',
    category: 'keys',
    description:
      'Dark, round tines that set a bank of drone strings ringing in D minor behind them.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { bell: 0.25, tone: 0.35, volume: -18 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Sitar drone',
        params: { mode: 1, strings: 12, decay: 6, mix: 0.35, width: 0.6 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'ashram-rotor-tines',
    name: 'Rotor tines',
    category: 'keys',
    description:
      'The electric piano with its own tremolo off, spun by heavy fast rotors, in a plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { bark: 0.5, tremolo: 0, tone: 0.6, volume: -14 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Heavy rotors', params: { drive: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { decay: 0.6, mix: 0.25 } },
    ],
  },

  // chord-harp
  {
    id: 'ashram-four-octave-sweep',
    name: 'Four octave sweep',
    category: 'plucked',
    description:
      'The held chord climbs four octaves string by string and comes back down, in a long plate.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { strum: 95, tone: 0.45, volume: -6 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.32 } }],
    preview: 'chord',
  },
  {
    id: 'ashram-phased-strum',
    name: 'Phased strum',
    category: 'plucked',
    description:
      'A three-octave strum of soft electronic strings through a slow phaser and a spring.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { pad: 0.2, volume: -3.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.2, mix: 0.45 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'ashram-falling-strum',
    name: 'Falling strum',
    category: 'plucked',
    description:
      'A slow downward sweep from the top string, with tape repeats trailing into a hall.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { direction: 1, strum: 120, sustain: 4.5, tone: 0.5, pad: 0, volume: 0 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 500, mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'ashram-rotor-strum',
    name: 'Rotor strum',
    category: 'plucked',
    description:
      'Scattered plucks over a soft held chord, both sent round a slow rotating speaker into a plate.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Pad and sparkle',
      params: { pad: 0.85, sustain: 2.5, volume: -18.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.3, spread: 0.9 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.28 } },
    ],
    preview: 'chord',
  },
  {
    id: 'ashram-brushed-chord',
    name: 'Brushed chord',
    category: 'plucked',
    description: 'Two octaves brushed almost at once, dull and close, as a home cassette kept it.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Brushed chord',
      params: { tone: 0.2, volume: -10.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { decay: 1.4, mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'ashram-quick-bright-strum',
    name: 'Quick bright strum',
    category: 'plucked',
    description:
      'A short one-octave strum of thin bright strings at every key, rocked dark to bright by an amplifier tremolo and its spring.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Toy harp',
      params: { direction: 0, strum: 26, sustain: 1.6, tone: 0.85, spread: 0.5, volume: 0.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 2.6, depth: 0.7 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },

  // dusk
  {
    id: 'ashram-cassette-string-pad',
    name: 'Cassette string pad',
    category: 'pad',
    description:
      'A chorus polysynth playing slow strings under the singing, kept on a home cassette in a hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { cutoff: 1800, attack: 1.4, release: 3.5, chorus: 3, volume: -12 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ashram-square-wave-organ',
    name: 'Square wave organ',
    category: 'organ',
    description:
      'A hollow square with its sub octave, quick as an organ key, in a slow rotating speaker.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Shimmer organ',
      params: { cutoff: 1500, chorus: 0, release: 0.5, volume: -15 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.35, hornDepth: 0.75 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { decay: 0.6, mix: 0.25 } },
    ],
  },

  // aurora
  {
    id: 'ashram-slow-brass-dawn',
    name: 'Slow brass dawn',
    category: 'pad',
    description:
      'Soft synthesiser horns that take a second and a half to speak and go on swelling, in a long plate.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { brilliance: 950, swell: 0.6, release: 5, volume: -13 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.32 } },
    ],
  },
  {
    id: 'ashram-wide-synth-strings',
    name: 'Wide synth strings',
    category: 'pad',
    description:
      'The string channel of a late-seventies polysynth, detuned wide and slowly phased in a hall.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { brilliance: 3600, attack: 0.7, detune: 16, volume: -6.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.09, mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // ember
  {
    id: 'ashram-long-glide',
    name: 'Long glide',
    category: 'pad',
    description:
      'One synthesiser voice that slides for most of a second from each note to the next, echoed on tape.',
    instrument: {
      deviceId: 'ember',
      preset: 'Slow strings',
      params: {
        voiceMode: 2,
        glide: 0.8,
        cutoff: 2400,
        ampAttack: 0.15,
        ampRelease: 2,
        unisonVoices: 2,
        unisonDetune: 12,
        unisonSpread: 0.3,
        volume: 0.5,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { feedback: 0.4, mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'ashram-lamp-lit-pad',
    name: 'Lamp-lit pad',
    category: 'pad',
    description:
      'A warm, dull two-oscillator pad with a slow filter, darkened further and set in a hall.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: {
        cutoff: 900,
        ampAttack: 1.8,
        ampRelease: 5,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6000 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // string-machine
  {
    id: 'ashram-slow-keyboard-strings',
    name: 'Slow keyboard strings',
    category: 'string',
    description:
      'A seventies string keyboard that fades in slowly, through a slow phaser and a plate.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 3, release: 4, tone: 2400, width: 0.6, volume: -3 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm six-stage',
        params: { rate: 0.12, depth: 70, stereo: 30 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ashram-top-octave-strings',
    name: 'Top octave strings',
    category: 'string',
    description:
      'Only the top octave of the string keyboard, thin and clear, on tape in a long plate.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.8, release: 3, tone: 5500, speed: 1.1, volume: -11 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.4, mix: 0.3 } },
    ],
  },

  // wavetable
  {
    id: 'ashram-synth-vowels',
    name: 'Synth vowels',
    category: 'pad',
    description:
      'A wavetable drifting slowly between vowels, like a sung chord remembered by a worn cassette.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { cutoff: 3000, attack: 1.8, release: 4, spread: 0.6, volume: -12.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.35, noise: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ashram-reed-wave-organ',
    name: 'Reed wave organ',
    category: 'organ',
    description:
      'A reedy wavetable with a quick key, spun by a fast rotating speaker into a spring.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { position: 0.3, motion: 0.1, attack: 0.03, release: 0.4, cutoff: 3000, volume: -17 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Tremolo', params: { drive: 0.4, hornDepth: 0.7 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.22 } },
    ],
  },

  // west-coast
  {
    id: 'ashram-folded-harp',
    name: 'Folded harp',
    category: 'plucked',
    description:
      'A bright folded pluck that dulls as it dies, like a wire harp, with tape repeats in a plate.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Bright harp',
      params: { decay: 2.4, volume: -1 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 330, mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ashram-folded-low-tone',
    name: 'Folded low tone',
    category: 'drone',
    description:
      'A low held tone whose overtones fold open and shut, a slow phaser turning it in a hall.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folding drone',
      params: { fold: 0.6, attack: 1.5, drift: 0.6, volume: -6 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.08, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // fm-glass
  {
    id: 'ashram-brass-bowl',
    name: 'Brass bowl',
    category: 'bell',
    description: 'A struck metal bowl with a slow beat in its long ring, set in a hall.',
    instrument: { deviceId: 'fm-glass', preset: 'Temple bowl', params: { detune: 7, volume: -9 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 3.5, mix: 0.3 } }],
  },
  {
    id: 'ashram-small-hand-bells',
    name: 'Small hand bells',
    category: 'bell',
    description: 'Small bright bells, short, with a clashing high overtone, in a spring tank.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: {
        ratio: 9,
        brightness: 0.9,
        decay: 1.2,
        release: 1.5,
        detune: 10,
        spread: 0.45,
        volume: -6.5,
      },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { drip: 0.25, mix: 0.25 } },
    ],
  },

  // modal-bells
  {
    id: 'ashram-rubbed-bowl',
    name: 'Rubbed bowl',
    category: 'bell',
    description:
      'A singing bowl rubbed rather than struck, each note swelling and ringing on in a plate.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { decay: 12, volume: -4 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
  },
  {
    id: 'ashram-courtyard-bell',
    name: 'Courtyard bell',
    category: 'bell',
    description:
      'A bronze bell struck outdoors and heard from down the hall, its hum hanging for seconds.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { decay: 14, hardness: 0.55, volume: -5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Just the room', params: { distance: 0.6, room: 0.7 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // mallets
  {
    id: 'ashram-club-vibes',
    name: 'Club vibes',
    category: 'bell',
    description:
      'A vibraphone with its motor turning slowly in a small spring, heard off a pressing from the club years.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { motor: 0.55, motorRate: 3.2, mallet: 0.4, volume: -9.5 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { decay: 2, mix: 0.22 } },
      { deviceId: 'vinyl', preset: 'New pressing', params: { surface: 0.2, warp: 0.2 } },
    ],
  },
  {
    id: 'ashram-rolled-bars',
    name: 'Rolled bars',
    category: 'bell',
    description:
      'Soft marimba rolls that hold a chord as a low wooden shimmer, slowly phased in a plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { roll: 9, mallet: 0.15, volume: -11.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.15, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },

  // handpan
  {
    id: 'ashram-tuned-hand-drum',
    name: 'Tuned hand drum',
    category: 'bell',
    description:
      'A tongue drum struck firmly and damped short like a pair of hand drums, on tape in a room.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 1.1, touch: 0.6, cavity: 0.9, damp: 0.6, volume: -2 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
  {
    id: 'ashram-ringing-steel',
    name: 'Ringing steel',
    category: 'bell',
    description:
      'A steel pan touched lightly, every note waking the others, circling in a slow rotor and a plate.',
    instrument: { deviceId: 'handpan', preset: 'Halo', params: { decay: 6, volume: -6.5 } },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room', params: { distance: 0.5, mix: 0.7 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },

  // felt-piano
  {
    id: 'ashram-late-set-piano',
    name: 'Late set piano',
    category: 'keys',
    description:
      'A bare piano with hard hammers and no felt, levelled and close on tape in a small room.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        hardness: 0.75,
        thump: 0.4,
        reverbMix: 0,
        width: 0.6,
        polyphony: 16,
        outputDb: -12,
      },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Keys' },
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.45, hiss: 0.15 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'ashram-plate-piano',
    name: 'Plate piano',
    category: 'keys',
    description:
      'A lightly felted piano with its strings left to ring in sympathy, deep in a long plate.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.3,
        hardness: 0.5,
        resonance: 0.8,
        damper: 0.8,
        reverbMix: 0,
        polyphony: 16,
        outputDb: -17,
      },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 30, mix: 0.4 } },
    ],
  },

  // acoustic-guitar
  {
    id: 'ashram-plectrum-lute',
    name: 'Plectrum lute',
    category: 'plucked',
    description:
      'Nylon strings picked by the bridge, nasal and close like a fretless lute, driven onto tape in a room.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: {
        position: 0.1,
        nail: 0.6,
        sustain: 3,
        release: 1.2,
        tone: 0.38,
        strum: 8,
        volume: -3,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 14, outputDb: -8 } },
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.5, hiss: 0.15 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ashram-twelve-over-drone',
    name: 'Twelve over drone',
    category: 'plucked',
    description:
      'A twelve-string strummed slowly, its doubled courses waking drone strings in a hall.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { strum: 55, sustain: 8, release: 3, volume: -6 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Sitar drone',
        params: { mode: 1, sympathy: 0.7, strings: 10, mix: 0.3, width: 0.6 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.28 } },
    ],
  },

  // guitar
  {
    id: 'ashram-sustained-lead',
    name: 'Sustained lead',
    category: 'plucked',
    description:
      'A neck-pickup line held for seconds through a warm driven stack, in a long plate.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: {
        pickup: 0.8,
        hardness: 0.6,
        sustain: 24,
        tone: 2600,
        strum: 0,
        warmth: 0.7,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack', params: { drive: 0.65, room: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'ashram-swirl-strum',
    name: 'Swirl strum',
    category: 'plucked',
    description:
      'Slow soft strums of a clean electric guitar through a fast rotating horn and a spring.',
    instrument: { deviceId: 'guitar', preset: 'Slow strum', params: { strum: 45, volume: -2.5 } },
    effects: [
      { deviceId: 'rotary', preset: 'Guitar swirl', params: { mix: 0.8 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },

  // pedal-steel
  {
    id: 'ashram-sliding-string',
    name: 'Sliding string',
    category: 'plucked',
    description:
      'Each new note drags the last one up to it in a long slide, over drone strings and a plate.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { swell: 0.1, glide: 420, vibrato: 12, pick: 0.7, tone: 3600, volume: -9 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Sitar drone',
        params: { mode: 1, sympathy: 0.75, decay: 5, mix: 0.3, width: 0.5 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'ashram-still-steel',
    name: 'Still steel',
    category: 'plucked',
    description:
      'Steel notes with no vibrato that fade in and hang, drifting in a slow chorus and a long plate.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.1, volume: -5.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { spread: 60, mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },

  // zither
  {
    id: 'ashram-singers-zither',
    name: "Singer's zither",
    category: 'plucked',
    description:
      'A small box of strings stroked slowly up and back across an added-ninth chord, in a long plate.',
    instrument: {
      deviceId: 'zither',
      preset: 'Harp glissando',
      params: { strum: 420, brightness: 0.65, sympathy: 0.5, body: 1, volume: -11 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ashram-hammered-strings',
    name: 'Hammered strings',
    category: 'plucked',
    description:
      'Light hammers rolling on doubled strings in octaves, with soft chorused echoes in a hall.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { roll: 10, decay: 6, brightness: 0.55, volume: -12 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 340, mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // bowed-string
  {
    id: 'ashram-arco-bass',
    name: 'Arco bass',
    category: 'string',
    description:
      'A low string bowed with weight and a slow vibrato, pushed into soft saturation in a small room.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.4,
        release: 1.2,
        pressure: 0.7,
        body: 0.9,
        vibrato: 0.2,
        vibratoRate: 4.5,
        volume: -17.5,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { outputDb: -2, driveDb: 6 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'ashram-bowed-harmonic',
    name: 'Bowed harmonic',
    category: 'string',
    description:
      'A light bow that is slow to speak, close to a pure tone, with tape repeats in a long plate.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 1.4, release: 4, pressure: 0.2, vibrato: 0.2, volume: -7 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 480, feedback: 0.4, mix: 0.25 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },

  // horns
  {
    id: 'ashram-low-brass-floor',
    name: 'Low brass floor',
    category: 'wind',
    description: 'A low brass section that arrives slowly and holds the floor, on tape in a hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 3, release: 5, blow: 0.45, volume: -7 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'ashram-muted-call',
    name: 'Muted call',
    category: 'wind',
    description:
      'One muted trumpet, thin and nasal with a little vibrato, calling into a tape echo and a spring.',
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { blow: 0.6, vibrato: 0.35, attack: 0.06, release: 0.7, volume: -3.5 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 440, feedback: 0.4, mix: 0.25 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
  },

  // flute
  {
    id: 'ashram-alto-flute-dusk',
    name: 'Alto flute dusk',
    category: 'wind',
    description:
      'A low flute blown softly with a lot of breath in it, over tape hiss in a long plate.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { breath: 0.65, attack: 0.25, release: 1.2, vibrato: 0.45, scoop: 20, volume: -8.5 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -48 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 30, mix: 0.32 } },
    ],
  },
  {
    id: 'ashram-bamboo-flute',
    name: 'Bamboo flute',
    category: 'wind',
    description:
      'A wooden flute that scoops up into each note, with dark repeats behind it in a hall.',
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { breath: 0.45, scoop: 70, vibrato: 0.5, release: 1, volume: -8 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 420, mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // clarinet
  {
    id: 'ashram-straight-soprano',
    name: 'Straight soprano',
    category: 'wind',
    description: 'A conical reed blown hard, edged and with a narrow vibrato, on tape in a plate.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { blow: 0.75, vibrato: 0.3, attack: 0.04, release: 0.4, volume: -5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4, hiss: 0.15 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ashram-overblown-tenor',
    name: 'Overblown tenor',
    category: 'wind',
    description:
      'A tenor reed pushed until it growls and splits, driven through a console into a spring.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: { blow: 0.85, growl: 0.8, vibrato: 0.35, volume: -4.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console', params: { drive: 0.5, output: -3 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },

  // ladder-bass
  {
    id: 'ashram-bass-vamp',
    name: 'Bass vamp',
    category: 'keys',
    description:
      'A round plucked bass note that closes in a second, levelled like an upright under the band.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Rubber pluck',
      params: { wave: 0.8, cutoff: 260, emphasis: 0.25, decay: 1.2, drive: 0.25, volume: -3 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 8, outputGain: -6 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'low',
  },
  {
    id: 'ashram-pedal-synth',
    name: 'Pedal synth',
    category: 'drone',
    description:
      'One held bass note, two oscillators beating over a sub, in a slow phaser and a small plate.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Pedal drone',
      params: { beat: 11, cutoff: 420, drive: 0.3, volume: -13 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.12, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } },
    ],
  },

  // drone
  {
    id: 'ashram-reed-drone-box',
    name: 'Reed drone box',
    category: 'drone',
    description:
      'A reedy root and fifth held steady with a little air, like a bellows drone box on reel tape.',
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        partials: 0.9,
        wave: 0.85,
        movement: 0.25,
        sub: 0.1,
        air: 0.3,
        cutoff: 3200,
        attack: 1.2,
        volume: -8.5,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { noise: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'ashram-overtone-floor',
    name: 'Overtone floor',
    category: 'drone',
    description:
      'A harmonic series whose partials wander, drifting slowly in phase against itself in a long plate.',
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: { movement: 0.8, rate: 0.12, sub: 0.25, cutoff: 2600, attack: 2.5, volume: -7.5 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { fine: 0.25, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },

  // atmosphere
  {
    id: 'ashram-warm-canyon-wind',
    name: 'Warm canyon wind',
    category: 'texture',
    description:
      'A warm wind that gusts slowly and whistles a little at the pitch of the key, in a large space.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: {
        movement: 0.75,
        tone: 0.4,
        resonance: 0.35,
        attack: 2.5,
        release: 6,
        width: 0.6,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 6, mix: 0.25, width: 0.6 } },
    ],
  },
  {
    id: 'ashram-lamp-flame',
    name: 'Lamp flame',
    category: 'texture',
    description: 'A small fire heard close: a soft flutter and sparse crackle, narrow, in a room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hearth',
      params: { density: 0.3, movement: 0.5, tone: 0.4, width: 0.3, volume: -1 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },

  // outdoors
  {
    id: 'ashram-hillside-dawn',
    name: 'Hillside dawn',
    category: 'texture',
    description:
      'Birds starting up at a little distance before the first prayers, in the air of a hall.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Dawn chorus',
      params: { density: 0.5, distance: 0.55, attack: 2, width: 0.8, volume: -2 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } }],
  },
  {
    id: 'ashram-veranda-chimes',
    name: 'Veranda chimes',
    category: 'texture',
    description:
      'Wind chimes tuned to the key and stirred by a gusting breeze, ringing into a long spring.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Chimes in a breeze',
      params: { density: 0.55, distance: 0.3, movement: 0.8, width: 0.8, volume: -9 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } }],
  },

  // sampler
  {
    id: 'ashram-cassette-loop-bed',
    name: 'Cassette loop bed',
    category: 'pad',
    description:
      'Whatever is loaded, an octave down on a wobbling loop, through a worn cassette and a spring.',
    instrument: { deviceId: 'sampler', preset: 'Tape choir', params: { attack: 0.9, volume: -19 } },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'ashram-turning-sample',
    name: 'Turning sample',
    category: 'keys',
    description:
      'The loaded sound played across the keys and sent round a slow rotating speaker, in a plate.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: { attack: 0.03, release: 0.9, tone: 6000, wobble: 0.1, volume: -15 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.3, hornDepth: 0.75 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.28 } },
    ],
  },

  // grain-synth
  {
    id: 'ashram-held-syllable',
    name: 'Held syllable',
    category: 'pad',
    description:
      'One instant of the loaded sound held as a still cloud, in a hall whose tail sings ah.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: { position: 0.2, attack: 0.8, release: 3, spread: 0.4, tone: 5000, volume: -15.5 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { decay: 5, mix: 0.35 } }],
  },
  {
    id: 'ashram-octave-dust',
    name: 'Octave dust',
    category: 'pad',
    description:
      'Grains of the loaded sound scattered an octave up and down, slow to gather, on tape in a long plate.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Shimmer',
      params: {
        position: 0.15,
        octaves: 0.6,
        attack: 2.2,
        release: 5,
        spread: 0.5,
        tone: 9000,
        volume: -14.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },

  // tape-orchestra
  {
    id: 'ashram-reel-strings',
    name: 'Reel strings',
    category: 'string',
    description:
      'A violin section played from a strip of worn tape, swept by a slow flanger in a plate.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { attack: 0.6, vibrato: 0.55, age: 0.4, volume: -6.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep', params: { feedback: 20, mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ashram-reel-voices',
    name: 'Reel voices',
    category: 'voice',
    description:
      'A choir played from tape under every key, wavering, with one echo and a long spring.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: { age: 0.45, hiss: 0.3, release: 1.4, volume: -13 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 520, feedback: 0.25, mix: 0.25 },
      },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
  },

  // thesis
  {
    id: 'ashram-conch-breath',
    name: 'Conch breath',
    category: 'wind',
    description:
      'One narrow band of blown noise that swells and breathes slowly, like a shell horn in a long plate.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: {
        resonance: 75,
        attack: 0.9,
        release: 3,
        breatheRate: 0.15,
        mirrorEnabled: 0,
        scale: 4,
        root: 2,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 12, outputGain: -4.5 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    preview: 'hold',
  },
  {
    id: 'ashram-dorian-air',
    name: 'Dorian air',
    category: 'pad',
    description:
      'Soft bands of noise that turn one key into a breathy chord from D dorian, phased in a hall.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Fixed Full Stack',
      params: {
        resonance: 18,
        width: 80,
        attack: 1.6,
        release: 4,
        mode: 1,
        strum: 0,
        scale: 4,
        root: 2,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 8 } },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'hold',
  },
]
