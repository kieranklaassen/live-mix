import { type FactoryPreset } from '../types'

// Unsung Voice is a chord and the line its overtones sing, so a preset here
// decides two things: what the keys are made of, and what the voice above them
// does. Two presets for each of ten directions. An effect that adds pitches
// would hide which note nobody plays, so none here does.

export const UNSUNG_VOICE_PRESETS: readonly FactoryPreset[] = [
  // Chapel four: four close voices and the fifth above them.
  {
    id: 'unsung-voice-fifth-singer',
    name: 'Fifth singer, dark nave',
    category: 'voice',
    description:
      'Throats between Oo and Ah with a slow clear voice high over them that nobody sings, in a vast nave.',
    instrument: { deviceId: 'unsung-voice', preset: 'Chapel four' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.28 } }],
  },
  {
    id: 'unsung-voice-small-hours-hum',
    name: 'Hummed at small hours',
    category: 'voice',
    description:
      "A closed hum at arm's length, a low line that slides from note to note in it, in a room with worn tape.",
    instrument: {
      deviceId: 'unsung-voice',
      preset: 'Chapel four',
      params: {
        vowel: 0.08,
        tilt: -0.35,
        closeness: 0.75,
        register: 900,
        pace: 2.6,
        glide: 0.6,
        colour: 0.7,
        vibrato: 0.5,
        second: 0,
        breath: 0.4,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.24 } },
    ],
  },
  // Glass descant: two lines over a rubbed rim.
  {
    id: 'unsung-voice-two-panes',
    name: 'Two panes, two lines',
    category: 'bell',
    description:
      'Struck glass with two lines that walk against each other at the two ears, left to ring in a bright chamber.',
    instrument: { deviceId: 'unsung-voice', preset: 'Glass descant' },
    effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'unsung-voice-window-rain',
    name: 'Descant on window rain',
    category: 'texture',
    description: 'Glass keys come in softly while pure tones fall over them in dotted tape echoes.',
    instrument: {
      deviceId: 'unsung-voice',
      preset: 'Glass descant',
      params: {
        attack: 5,
        lean: -0.9,
        pace: 0.5,
        linger: 0.35,
        colour: 0,
        register: 2600,
        tolerance: 40,
        second: 0.9,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.32 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  // Plucked halo: keys that die and a line that stays.
  {
    id: 'unsung-voice-what-the-pluck-left',
    name: 'What the pluck left',
    category: 'plucked',
    description:
      'Stopped pipes plucked and soon gone, and over them the pure tones their overtones had in common, in a warm hall.',
    instrument: { deviceId: 'unsung-voice', preset: 'Plucked halo' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'unsung-voice-thimble-strings',
    name: 'Thimbles on a low string',
    category: 'plucked',
    description:
      'Hard short plucks with a sliding voice above, through a wooden body and a slow tape slap.',
    instrument: {
      deviceId: 'unsung-voice',
      preset: 'Plucked halo',
      params: {
        body: 1,
        hold: 0.12,
        tilt: 0.3,
        register: 1300,
        glide: 0.5,
        pace: 1.1,
        colour: 0.5,
        vibrato: 0.5,
        second: 0,
        breath: 0.05,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.4 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.22 } },
    ],
    preview: 'line',
  },
  // Bowed fog: strings that take their time.
  {
    id: 'unsung-voice-bows-in-mist',
    name: 'Loose bows in a mist',
    category: 'string',
    description:
      'A loose, wide section of bows comes in slowly; the line over it only climbs and slides, behind a thin veil.',
    instrument: { deviceId: 'unsung-voice', preset: 'Bowed fog' },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'unsung-voice-gut-and-resin',
    name: 'Gut, resin, lamplight',
    category: 'string',
    description:
      'Close bright bows on a wooden body with a singing vibrato in the line over them, in a tight chamber.',
    instrument: {
      deviceId: 'unsung-voice',
      preset: 'Bowed fog',
      params: {
        closeness: 0.8,
        tilt: 0.35,
        attack: 0.25,
        release: 0.9,
        breath: 0.15,
        glide: 0,
        partner: 4,
        lean: 0.1,
        pace: 2.2,
        register: 2200,
        width: 0.4,
        vibrato: 0.5,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.22 } },
    ],
    preview: 'line',
  },
  // Bell crown: the line struck over glass.
  {
    id: 'unsung-voice-crown-of-seven',
    name: 'Crown over a glass bell',
    category: 'bell',
    description:
      'A bright struck glass bell, and from its crown two quick peals of the overtones the held keys share.',
    instrument: { deviceId: 'unsung-voice', preset: 'Bell crown', params: { volume: -0.5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.28 } }],
  },
  {
    id: 'unsung-voice-belfry-underwater',
    name: 'Sunken belfry',
    category: 'bell',
    description:
      'Dull bells struck far down, the peal above them slow, low and beating, with the water over everything.',
    instrument: {
      deviceId: 'unsung-voice',
      preset: 'Bell crown',
      params: {
        tilt: -0.5,
        register: 1000,
        pace: 1.6,
        linger: 0.7,
        beating: 0.5,
        colour: 0.5,
        hold: 0.7,
        tolerance: 55,
      },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Just under' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.25 } },
    ],
    preview: 'bells',
  },
  // Beating seconds: overtones that are not pulled together.
  {
    id: 'unsung-voice-seconds-that-grate',
    name: 'Reeds a shade apart',
    category: 'organ',
    description:
      'Dark reeds whose shared overtones are let go to beat against each other, through a slowly turning horn.',
    instrument: { deviceId: 'unsung-voice', preset: 'Beating seconds', params: { volume: -3 } },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'unsung-voice-slow-moire',
    name: 'Low fifths that shimmer',
    category: 'drone',
    description:
      'A low fifth of stopped pipes with two lines that beat slowly and never settle, in a dark cave.',
    instrument: {
      deviceId: 'unsung-voice',
      preset: 'Beating seconds',
      params: {
        body: 4,
        tilt: 0.3,
        beating: 0.35,
        colour: 0.9,
        lift: 0.68,
        register: 1100,
        pace: 9,
        attack: 2.4,
        release: 6,
        breath: 0.1,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },
  // Low partner: a lone key that has company.
  {
    id: 'unsung-voice-company-for-one',
    name: 'Company for one note',
    category: 'voice',
    description:
      'One low throat at a time, and over it the seventh overtone, which it shares with a partner nobody hears, on a plate.',
    instrument: { deviceId: 'unsung-voice', preset: 'Low partner', params: { volume: -2 } },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } },
    ],
    preview: {
      notes: [
        { atSec: 0, durSec: 2, note: 38 },
        { atSec: 2, durSec: 1.5, note: 41 },
        { atSec: 3.5, durSec: 2.5, note: 45 },
      ],
    },
  },
  {
    id: 'unsung-voice-cellar-tenth',
    name: 'Bass with a lodger',
    category: 'bass',
    description:
      'A stopped pipe played short as a bass, with one soft bell of an overtone lodged over every note.',
    instrument: {
      deviceId: 'unsung-voice',
      preset: 'Low partner',
      params: {
        body: 4,
        partner: 4,
        hold: 0.5,
        attack: 0.006,
        release: 0.5,
        lift: 0.42,
        glide: 0,
        pace: 0.8,
        linger: 0.6,
        colour: 0.25,
        tilt: 0.15,
        vibrato: 0.15,
        register: 750,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
    ],
    preview: 'bass',
  },
  // Breath line: more air than tone.
  {
    id: 'unsung-voice-air-finds-pitch',
    name: 'Where air finds a pitch',
    category: 'wind',
    description:
      'Stopped pipes full of wind, and over them a line that is half hiss and half pitch, across an open valley.',
    instrument: { deviceId: 'unsung-voice', preset: 'Breath line', params: { volume: -2.5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
    preview: 'line',
  },
  {
    id: 'unsung-voice-sleepers-ward',
    name: 'Sleepers in a row',
    category: 'texture',
    description:
      'Throats breathing slowly through an Ee, two whispered lines sliding between them, on a dark plate.',
    instrument: {
      deviceId: 'unsung-voice',
      preset: 'Breath line',
      params: {
        body: 0,
        vowel: 0.95,
        tilt: -0.2,
        breath: 1,
        attack: 2.6,
        release: 4,
        lift: 0.62,
        pace: 4,
        glide: 0.5,
        vibrato: 0,
        colour: 0.3,
        second: 0.8,
        width: 1,
        volume: -0.5,
      },
    },
    effects: [
      { deviceId: 'breath', preset: 'Calm breath', params: { mix: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  // Reed keys: quick and plain.
  {
    id: 'unsung-voice-parlour-tongues',
    name: 'Tongues in a parlour',
    category: 'keys',
    description:
      'Quick reed tongues under the fingers, with a short high tone every second, small and near in a booth.',
    instrument: { deviceId: 'unsung-voice', preset: 'Reed keys', params: { volume: 0 } },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener' },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.18 } },
    ],
    preview: 'keys',
  },
  {
    id: 'unsung-voice-pump-and-whistle',
    name: 'Organ and one whistler',
    category: 'organ',
    description:
      'A full reed organ with the stops drawn and one whistler over it who never stops walking, in a bright hall.',
    instrument: {
      deviceId: 'unsung-voice',
      preset: 'Reed keys',
      params: {
        closeness: 0.4,
        hold: 1,
        attack: 0.12,
        release: 0.8,
        tilt: 0.45,
        linger: 1,
        pace: 0.7,
        lift: 0.5,
        colour: 0,
        vibrato: 0.45,
        vowel: 0.6,
        width: 0.7,
        register: 2800,
        volume: -2.5,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Faint motion' },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.22 } },
    ],
    preview: 'chord',
  },
  // Dark drone: hardly a line at all.
  {
    id: 'unsung-voice-under-the-floor',
    name: 'Low under the boards',
    category: 'drone',
    description:
      'A hum so dark it is nearly the note alone, and every twelve seconds or so one tone changes above it.',
    instrument: {
      deviceId: 'unsung-voice',
      preset: 'Dark drone',
      params: { register: 900, volume: -8.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.3 } }],
    preview: 'low',
  },
  {
    id: 'unsung-voice-turning-embers',
    name: 'Embers changing places',
    category: 'pad',
    description:
      'A dark bowed chord under two nearly pure tones that slide from place to place all the time, in a late hall.',
    instrument: {
      deviceId: 'unsung-voice',
      preset: 'Dark drone',
      params: {
        body: 3,
        tilt: -0.6,
        second: 0.9,
        pace: 5,
        glide: 0.9,
        lift: 0.56,
        colour: 0.15,
        register: 1100,
        attack: 2.2,
        release: 6,
        closeness: 0.2,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.28 } },
    ],
  },
]
