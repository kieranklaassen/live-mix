// Echo: delays.

import { type FactoryChain } from '../types'

export const ECHO_CHAINS: readonly FactoryChain[] = [
  {
    id: 'tape-echo-wash',
    name: 'Tape echo wash',
    category: 'echo',
    description: 'Dotted tape repeats that darken as they pile up, left to blur in a hall.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Dub wash', params: { feedback: 0.72, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'backwards-repeats',
    name: 'Backwards repeats',
    category: 'echo',
    description: 'Each phrase comes back reversed, swelling in and cutting off, in a quiet hall.',
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 900, smooth: 0.6, mix: 0.5 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { lowDecay: 4, midDecay: 3.5, mix: 0.15 },
      },
    ],
  },
  {
    id: 'grain-crystals',
    name: 'Grain crystals',
    category: 'echo',
    description: 'Repeats rebuilt from grains an octave up, each pass climbing again into a plate.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'three-head-echo',
    name: 'Three head echo',
    category: 'echo',
    description: 'Three tape heads in a row and a spring behind them, the old echo box sound.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },

  {
    id: 'echoes-remembered',
    name: 'Echoes remembered',
    category: 'echo',
    description:
      'A soft echo while phrases from the last twenty seconds drift back under what you play, in a wide plate.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Recalling', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'half-remembered-hall',
    name: 'Half-remembered hall',
    category: 'echo',
    description:
      'Dark recollections from up to a minute ago, some backwards or an octave down, blurred in a hall.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Hazy past', params: { reach: 60, mix: 0.38 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'murky-analog-echo',
    name: 'Murky analog echo',
    category: 'echo',
    description:
      'Long, dark bucket-brigade repeats with a slow chorus and a little hiss, set back in a plate.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky', params: { feedback: 0.55, mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'memory-bed',
    name: 'Memory bed',
    category: 'echo',
    description:
      'Each phrase comes back as a soft loop that fades under what is played next, in a plate.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Soft bed' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'slapback-combo',
    name: 'Slapback combo',
    category: 'echo',
    description:
      'One quick dark repeat right behind each note, played through an open cabinet in a room.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 110, mix: 0.35 } },
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { drive: 0.2, room: 0.25, noise: 0.05 },
      },
    ],
  },
  {
    id: 'clean-ping-pong',
    name: 'Clean ping pong',
    category: 'echo',
    description:
      'Clear repeats that bounce from side to side and fade in a few seconds, with a thin veil of room.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Side to side',
        params: { time: 375, feedback: 0.5, tone: 9000, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'dotted-and-wide',
    name: 'Dotted and wide',
    category: 'echo',
    description:
      'A sharp copy on the left and a flat one on the right widen the sound before dotted tape repeats, in a small room.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { mix: 0.3 } },
      {
        deviceId: 'tape-echo',
        preset: 'Dotted bounce',
        params: { time: 480, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'warm-valve-echo',
    name: 'Warm valve echo',
    category: 'echo',
    description:
      'A valve stage rounds and thickens the sound, then tape repeats with a touch of spring behind them.',
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Tube preamp',
        params: { driveDb: 9, toneDb: -3, outputDb: -9 },
      },
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { time: 420, feedback: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'swept-echoes',
    name: 'Swept echoes',
    category: 'echo',
    description:
      'A resonant low pass opens and closes slowly ahead of the echo, so each repeat comes back in a different colour.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: {
          cutoffHz: 1100,
          resonance: 1.8,
          lfoAmount: 75,
          lfoRateHz: 0.23,
          lfoShape: 1,
        },
      },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 430, feedback: 0.62, tone: 6000, mix: 0.4 },
      },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'phased-trail',
    name: 'Phased trail',
    category: 'echo',
    description:
      'A long dark trail of repeats, more than a second apart, turning slowly through a six stage phaser.',
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Long dark trail',
        params: { time: 1100, highCut: 2600, mix: 0.3 },
      },
      {
        deviceId: 'phaser',
        preset: 'Slow swirl',
        params: { rate: 0.09, centerHz: 1600, mix: 0.3 },
      },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { inputGain: 2.5 } },
    ],
  },
  {
    id: 'spinning-repeats',
    name: 'Spinning repeats',
    category: 'echo',
    description:
      'Slowly drifting repeats played through a rotating speaker on its slow speed, so the echoes turn as they fade.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slow drift', params: { feedback: 0.5 } },
      { deviceId: 'rotary', preset: 'Soft blend', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'gallop-and-tremolo',
    name: 'Gallop and tremolo',
    category: 'echo',
    description:
      'Two tape heads gallop behind each note, an amp tremolo pulses the lot and a dark spring rings after it.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 540, mix: 0.3 } },
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 5.5, depth: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.22 } },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { inputGain: 3 } },
    ],
  },
  {
    id: 'three-against-four',
    name: 'Three against four',
    category: 'echo',
    description:
      'Two echoes in series at 450 and 600 milliseconds, whose repeats fall three against four.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Plain echo',
        params: { time: 450, feedback: 0.4, spread: 0.6, mix: 0.3 },
      },
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 600, tone: 5000, spread: 0.6, mix: 0.3 },
      },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'far-thin-echoes',
    name: 'Far thin echoes',
    category: 'echo',
    description:
      'Repeats that lose their low end on every pass, answered by separate echoes from a very large space.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { time: 520, mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 12, mix: 0.3 } },
    ],
  },
  {
    id: 'dub-spring-echo',
    name: 'Dub spring echo',
    category: 'echo',
    description:
      'A driven spring splash goes into the tape echo, so the splash itself repeats and darkens.',
    effects: [
      { deviceId: 'spring-reverb', preset: 'Dub send', params: { mix: 0.3 } },
      {
        deviceId: 'tape-echo',
        preset: 'Warm repeats',
        params: {
          time: 640,
          feedback: 0.68,
          drive: 0.55,
          lowCut: 250,
          highCut: 2400,
          spread: 0.6,
          mix: 0.4,
        },
      },
    ],
  },
  {
    id: 'crumbling-repeats',
    name: 'Crumbling repeats',
    category: 'echo',
    description:
      'The sound and its plain repeats pass an eight bit converter, so each repeat is grainier than the last until it cuts off.',
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Plain repeat',
        params: { time: 360, feedback: 0.6, tone: 6000, mix: 0.35 },
      },
      {
        deviceId: 'vintage-digital',
        preset: 'Glaze',
        params: { rate: 14000, bits: 8 },
      },
    ],
  },
  {
    id: 'reversed-glass',
    name: 'Reversed glass',
    category: 'echo',
    description:
      'What was just played comes back reversed an octave up and climbs again on each pass, into a long bright tail.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { feedback: 0.5, mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'crossing-tape-loop',
    name: 'Crossing tape loop',
    category: 'echo',
    description:
      'A short tape loop whose layers change sides on every pass and wear away, over a long low tail.',
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Crossing sides',
        params: { length: 1.5, feedback: 0.75, mix: 0.4 },
      },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'echoes-going-sharp',
    name: 'Echoes going sharp',
    category: 'echo',
    description:
      'Each repeat is shifted a few hertz higher than the last, so the echoes climb out of tune in a dark plate.',
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Rising echo',
        params: { fine: 7, feedback: 0.7 },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'echoes-into-mist',
    name: 'Echoes into mist',
    category: 'echo',
    description:
      'Repeats whose attacks dissolve and whose pitches hang on, until the echoes run together as mist.',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 400, feedback: 0.6 },
      },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { blur: 0.75, mix: 0.4 } },
      { deviceId: 'ambient-limiter', preset: 'Pull back' },
    ],
  },
  {
    id: 'hovering-repeats',
    name: 'Hovering repeats',
    category: 'echo',
    description:
      'Three tape heads with the feedback almost full: repeats hang for minutes and blur, held under a limiter.',
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Hovering wash',
        params: { time: 1200, lowCut: 100, highCut: 3500, mix: 0.35 },
      },
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { inputGain: 5, outputGain: -1.5 } },
    ],
  },
  {
    id: 'swell-into-echoes',
    name: 'Swell into echoes',
    category: 'echo',
    description:
      'Each note fades in with no attack and is levelled, then soft repeats carry it into a tail with long bright mids.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 220 } },
      {
        deviceId: 'fet-limiter',
        preset: 'Gentle lift',
        params: { inputGain: 4, outputGain: -2.5 },
      },
      {
        deviceId: 'echo-memory',
        preset: 'Plain echo',
        params: { time: 520, feedback: 0.6, tone: 4000, spread: 0, mix: 0.4 },
      },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'echo-on-open-strings',
    name: 'Echo on open strings',
    category: 'echo',
    description:
      'Each repeat strikes a bank of strings tuned to C major again, so they ring on under the echo.',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 500, feedback: 0.5 },
      },
      {
        deviceId: 'sympathetic',
        preset: 'Piano pedal',
        params: { strings: 8, decay: 4, mix: 0.3 },
      },
    ],
  },
  {
    id: 'sung-repeats',
    name: 'Sung repeats',
    category: 'echo',
    description:
      'Chorused analog repeats, each one answered by voices singing oo a moment behind it.',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 460, feedback: 0.5, mix: 0.38 },
      },
      { deviceId: 'vowel-reverb', preset: 'Oo behind' },
    ],
  },
  {
    id: 'scattered-stars',
    name: 'Scattered stars',
    category: 'echo',
    description:
      'Ten echoes scattered over three and a half seconds, never on a pulse, each on its own side; Shuffle deals another sky.',
    effects: [
      {
        deviceId: 'constellation',
        preset: 'Scattered seven',
        params: { span: 3600, stars: 10, again: 0.4 },
      },
    ],
  },
  {
    id: 'stars-in-fog',
    name: 'Stars in fog',
    category: 'echo',
    description:
      'Seven scattered echoes with every attack blurred into a soft cloud, so the repeats arrive as swells; Size sets how long a cloud lasts.',
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.5 } },
      { deviceId: 'fog', preset: 'Soft cloud', params: { size: 220, soften: 0.5 } },
    ],
  },
  {
    id: 'stone-over-water',
    name: 'Stone over water',
    category: 'echo',
    description:
      'Echoes that land closer and closer together, each softer and duller, crossing from left to right; Bounce past the middle spreads them out.',
    effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.45 } }],
  },
  {
    id: 'sinking-stones',
    name: 'Sinking stones',
    category: 'echo',
    description:
      'Echoes close up like a skipping stone, and the tail behind each landing sags in pitch as it fades; Sag sets how fast it sinks.',
    effects: [
      { deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.45 } },
      { deviceId: 'melt', preset: 'Slow melt', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'turning-loops',
    name: 'Turning loops',
    category: 'echo',
    description:
      'Three loops a hair apart in length record what you play and slide slowly out of step; Offset sets how fast they part.',
    effects: [{ deviceId: 'orbits', preset: 'Slow phasing' }],
  },
  {
    id: 'sparks-in-orbit',
    name: 'Sparks in orbit',
    category: 'echo',
    description:
      'Bright sparks above the playing are caught by three loops of unequal length and come round in patterns that keep shifting; try Density.',
    effects: [
      { deviceId: 'glints', preset: 'First light', params: { density: 7 } },
      { deviceId: 'orbits', preset: 'Out of step' },
    ],
  },
  {
    id: 'round-of-three',
    name: 'Round of three',
    category: 'echo',
    description:
      'Three followers repeat what you play, each a second and a half after the last, so one line becomes a round; Gap sets the wait.',
    effects: [{ deviceId: 'canon', preset: 'Round of three' }],
  },
  {
    id: 'bowed-procession',
    name: 'Bowed procession',
    category: 'echo',
    description:
      'Attacks fade in like a bow, then four followers repeat each note about two seconds apart, each darker, in a hall; Gap sets the wait.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed' },
      { deviceId: 'fet-limiter', params: { inputGain: 6, outputGain: -1 } },
      { deviceId: 'canon', preset: 'Slow procession' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
]
