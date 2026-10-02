import { type FactoryPreset } from '../types'

// Open-tuned strings hammered, brushed and strummed into a phaser, an echo and a hall: bright,
// swirling and glad, as played cross-legged on a blanket in a city park at noon.

export const PRESETS: readonly FactoryPreset[] = [
  // Zither: the open-tuned box of strings itself, hammered, brushed, picked and swelled.
  {
    id: 'park-zither-chopstick-hammers',
    name: 'Chopstick hammers',
    category: 'plucked',
    description:
      'Open strings rolled in octaves with light hammers, swirling in a phaser with a soft echo and a hall.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { roll: 10, brightness: 0.68, sympathy: 0.6, volume: -7.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Warm Six-Stage', params: { rate: 0.38, mix: 0.45 } },
      { deviceId: 'analog-delay', preset: 'Chorus echo', params: { time: 310, mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'park-zither-brushed-open-tuning',
    name: 'Brushed open tuning',
    category: 'plucked',
    description:
      'A hand brushed slowly up and back across an added-ninth tuning, through a gentle flanger and tape echo.',
    instrument: {
      deviceId: 'zither',
      preset: 'Harp glissando',
      params: { strum: 420, brightness: 0.5, position: 0.32, sympathy: 0.5, body: 1, volume: -4 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Gentle Sweep', params: { rate: 0.18, mix: 0.4 } },
      { deviceId: 'tape-echo', params: { time: 460, feedback: 0.4, highCut: 5200, mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'hold',
  },
  {
    id: 'park-zither-bench-strum',
    name: 'Park bench strum',
    category: 'plucked',
    description:
      'A picked major chord zither through a phaser and a small battery amplifier, heard from a few steps away.',
    instrument: {
      deviceId: 'zither',
      preset: 'Chord zither major',
      params: { strum: 70, decay: 8, release: 5, brightness: 0.72, sympathy: 0.5, volume: -2 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Classic 4-Stage', params: { rate: 0.5, depth: 70, mix: 0.5 } },
      {
        deviceId: 're-amp',
        preset: 'Bedside radio',
        params: { drive: 0.3, treble: 0.4, distance: 0.2, room: 0.25, noise: 0.08 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { width: 0.6, mix: 0.2 } },
    ],
    preview: 'line',
  },
  {
    id: 'park-zither-fountain-spray',
    name: 'Fountain spray',
    category: 'plucked',
    description:
      'Single bright strings struck with a hammer and thrown up in fast rising octaves, with a little shimmer above.',
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { brightness: 0.8, position: 0.12, decay: 4, courses: 0.3, body: 2, volume: -6 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Glass rain', params: { time: 170, mix: 0.4 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { shimmer: 0.2, mix: 0.2 } },
    ],
    preview: 'bells',
  },
  {
    id: 'park-zither-noon-haze',
    name: 'Noon haze',
    category: 'pad',
    description:
      'Wide double courses in octaves left to beat, turned slowly by a phaser inside a very large space.',
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { strum: 90, decay: 16, release: 12, brightness: 0.66, sympathy: 0.7, volume: -5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { centerHz: 1500, mix: 0.45 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 9000, mix: 0.35 } },
    ],
  },
  {
    id: 'park-zither-eyes-closed',
    name: 'Eyes closed',
    category: 'plucked',
    description:
      'Fifths and octaves with the pick taken off, so each strum fades in like a bowed string, on a long plate.',
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { strum: 40, decay: 14, release: 10, brightness: 0.6, volume: -1 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 600 } },
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'park-zither-skipping-hammers',
    name: 'Skipping hammers',
    category: 'plucked',
    description:
      'A soft felt hammer on one double string per key, answered by dotted tape heads so a slow phrase starts to skip.',
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { brightness: 0.45, position: 0.3, decay: 3, release: 1.2, courses: 0.6, volume: -1 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 375, heads: 3, feedback: 0.55, highCut: 6000, spread: 0.8, mix: 0.4 },
      },
      { deviceId: 'phaser', preset: 'Bass Safe', params: { rate: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'bells',
  },
  {
    id: 'park-zither-marigold-arpeggio',
    name: 'Marigold arpeggio',
    category: 'plucked',
    description:
      'Fingers rolling a suspended chord up and back on harp strings, washed by a flanger in a cathedral.',
    instrument: {
      deviceId: 'zither',
      preset: 'Slow sus arpeggio',
      params: { strum: 300, roll: 4, brightness: 0.62, volume: -7.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Wide Wash', params: { mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 5500, mix: 0.35 } },
    ],
    preview: 'hold',
  },
  {
    id: 'park-zither-home-dubbed-zither',
    name: 'Home-dubbed zither',
    category: 'plucked',
    description:
      'A picked minor chord zither as it sounds on a home-copied cassette: a little unsteady, hissy and close.',
    instrument: {
      deviceId: 'zither',
      preset: 'Chord zither minor',
      params: { strum: 110, decay: 7, release: 4, brightness: 0.6, volume: -3 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic Chorus', params: { rate: 0.6, mix: 0.3 } },
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { time: 420, mix: 0.25 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.35, noise: 0.35 } },
    ],
    preview: 'line',
  },

  // Chord harp: the strum-plate cousin of the lap harp, a held chord swept by one hand.
  {
    id: 'park-zither-pawn-shop-harp',
    name: 'Pawn shop harp',
    category: 'plucked',
    description:
      'A bright three-octave strum with no pad under it, phased and left in an amplifier spring.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { strum: 55, tone: 0.88, pad: 0, sustain: 4, volume: 0.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Classic 4-Stage', params: { rate: 0.4, mix: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'park-zither-there-and-back',
    name: 'There and back',
    category: 'plucked',
    description:
      'The chord swept up four octaves and down again, each string caught by a bucket-brigade echo in a hall.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { strum: 110, tone: 0.6, sustain: 5, pad: 0.1, volume: -4 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorus echo',
        params: { time: 440, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'park-zither-button-chimes',
    name: 'Button chimes',
    category: 'plucked',
    description:
      'No strum at all: each key one bright electronic pluck, doubled by a flanger and repeated by three tape heads.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Single chimes',
      params: { tone: 0.92, sustain: 3, spread: 0.7, volume: -1.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Classic Jet', params: { rate: 0.2, feedback: 35, mix: 0.4 } },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 480, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  {
    id: 'park-zither-pigeons-scattering',
    name: 'Pigeons scattering',
    category: 'plucked',
    description:
      'The chord scattered in no order over a soft organ tone, in a twelve-stage phaser with a faint octave halo.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Pad and sparkle',
      params: { strum: 60, span: 3, tone: 0.7, pad: 0.45, sustain: 3, volume: -9 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve Stage Cloud', params: { mix: 0.45 } },
      { deviceId: 'bloom-reverb', preset: 'Octave halo', params: { width: 0.35, mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'park-zither-coins-in-the-case',
    name: 'Coins in the case',
    category: 'plucked',
    description:
      'Quick downward strums of short bright strings, each one thrown back as a sparkle of rising octaves.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Toy harp',
      params: { strum: 18, span: 2, sustain: 1.5, volume: -0.7 },
    },
    effects: [
      {
        deviceId: 'cascade',
        preset: 'Sparkle bed',
        params: { time: 240, repeats: 10, interval: 0, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { breathDepth: 0, mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'park-zither-wire-brush-chord',
    name: 'Wire brush chord',
    category: 'plucked',
    description:
      'Two octaves brushed almost at once, dark and long, with a soft string pad swelling in behind it on a long plate.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Brushed chord',
      params: { strum: 8, sustain: 7, tone: 0.3, pad: 0.2, volume: -4.8 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Slow swell',
        params: { rise: 2, brightness: 2200, mix: 0.4 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.4, mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'park-zither-turning-leaves',
    name: 'Turning leaves',
    category: 'plucked',
    description:
      'A very slow random strum over three octaves, ringing eight seconds through a slow rotating speaker.',
    instrument: {
      deviceId: 'chord-harp',
      params: {
        strum: 150,
        direction: 3,
        span: 2,
        sustain: 8,
        tone: 0.55,
        pad: 0.15,
        spread: 0.8,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room', params: { distance: 0.6, mix: 0.8 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 8, mix: 0.25 } },
    ],
    preview: 'chord',
  },

  // Handpan: hand percussion for the same blanket, played into the same pedals.
  {
    id: 'park-zither-steel-tongue-echo',
    name: 'Steel tongue echo',
    category: 'bell',
    description:
      'A pure steel tongue drum tapped softly, each note answered by itself played backwards, in a hall.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 5, touch: 0.25, volume: -2 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { time: 500, mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'park-zither-pan-in-the-swirl',
    name: 'Pan in the swirl',
    category: 'bell',
    description:
      'Long handpan notes that set each other ringing, with a slow phaser moving through the overtones.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Halo',
      params: { decay: 8, shimmer: 0.9, touch: 0.3, volume: -1 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Deep 8-Stage',
        params: { centerHz: 900, rate: 0.15, mix: 0.45 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'park-zither-rain-on-the-arch',
    name: 'Rain on the arch',
    category: 'bell',
    description:
      'Short damped taps at the rim, flanged and pattered about by three tape heads in a small room.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Rain taps',
      params: { touch: 0.65, decay: 1.5, volume: 1.2 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Negative Hollow', params: { rate: 0.3, mix: 0.35 } },
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 300, feedback: 0.55, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'park-zither-low-steel-ding',
    name: 'Low steel ding',
    category: 'bell',
    description:
      'The centre note struck low with its thump of air, spread by a deep slow chorus into a large space.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Low ding',
      params: { decay: 9, cavity: 1, sympathy: 0.7, volume: -4 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep Sea', params: { mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 12, mix: 0.35 } },
    ],
    preview: 'keys',
  },
  {
    id: 'park-zither-knuckle-rhythm',
    name: 'Knuckle rhythm',
    category: 'bell',
    description:
      'A handpan rapped hard with the knuckles, doubled and bounced by a short echo off a spring.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Knuckles',
      params: { decay: 2.2, position: 0.7, shimmer: 0.6, volume: -4 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic wide', params: { mix: 0.3 } },
      {
        deviceId: 'analog-delay',
        preset: 'Slapback',
        params: { time: 190, feedback: 0.35, mix: 0.3 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },

  // Mallets: bars struck with the same light sticks, as patterns, tunes from the street and held shimmer.
  {
    id: 'park-zither-marimba-footsteps',
    name: 'Marimba footsteps',
    category: 'bell',
    description:
      'A marimba played with harder sticks into a short echo, so a slow broken chord comes back as a walking pattern.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.6, decay: 0.8, resonator: 0.9, volume: -2.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 250, feedback: 0.5, tone: 4500, mix: 0.35 },
      },
      { deviceId: 'phaser', preset: 'Warm Six-Stage', params: { rate: 0.22, mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
  {
    id: 'park-zither-park-railings',
    name: 'Park railings',
    category: 'bell',
    description:
      'A glockenspiel rolled in short rattles, like a stick run along railings, flanged with an echo in a hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 0.6, roll: 13, decay: 1.2, width: 0.6, volume: 0.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Gentle Sweep', params: { rate: 0.2, mix: 0.4 } },
      {
        deviceId: 'analog-delay',
        preset: 'Chorus echo',
        params: { time: 300, feedback: 0.35, mix: 0.25 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'park-zither-warm-pavement',
    name: 'Warm pavement',
    category: 'bell',
    description:
      'Vibraphone chords rolled with soft sticks into a steady blur, slowly phased on a long plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { roll: 10, motor: 0.2, damper: 0.15, width: 0.8, volume: -14.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { rate: 0.09, mix: 0.45 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'park-zither-celesta-on-the-stairs',
    name: 'Celesta on the stairs',
    category: 'bell',
    description:
      'A celesta with the dampers off, thickened by a chorus and followed up the stairs by a quiet tape echo.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.6, damper: 0.2, decay: 1.3, width: 0.6, volume: -2.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Guitar Shimmer', params: { mix: 0.4 } },
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 280, feedback: 0.4, spread: 0.5, mix: 0.3 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'park-zither-afternoon-motor',
    name: 'Afternoon motor',
    category: 'bell',
    description:
      'Vibraphone bars with the motor turning slowly and the pedal down, in a chorused echo and a hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { motor: 0.8, motorRate: 2.6, mallet: 0.35, decay: 1.6, volume: -11.3 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorus echo',
        params: { time: 520, feedback: 0.45, mix: 0.25 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { breathDepth: 0.1, mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'park-zither-hopscotch-bars',
    name: 'Hopscotch bars',
    category: 'bell',
    description:
      'A dry xylophone whose every note is restruck in rising steps of octaves and fifths, in a short gated room.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { mallet: 0.7, decay: 0.8, resonator: 0.6, width: 0.8, volume: 2.5 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Rising steps', params: { time: 220, repeats: 6, mix: 0.4 } },
      { deviceId: 'shaped-reverb', preset: 'Gated room', params: { time: 0.5, mix: 0.3 } },
    ],
  },

  // Harp: longer strings for the same hands, swept, plucked by the bridge and left to ring.
  {
    id: 'park-zither-sprinkler-arc',
    name: 'Sprinkler arc',
    category: 'plucked',
    description:
      'Every note a glissando swept up the harp to the key, turning through a phaser into a hall.',
    instrument: {
      deviceId: 'harp',
      preset: 'Glissando',
      params: { sweep: 0.6, touch: 0.5, halo: 0.9, volume: -0.5 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm Six-Stage',
        params: { centerHz: 1100, rate: 0.2, mix: 0.45 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'park-zither-bridge-pluck',
    name: 'Bridge pluck',
    category: 'plucked',
    description:
      'Silk strings plucked by the bridge, thin and nasal, pushed into a soft clip, a jet flanger and tape repeats.',
    instrument: {
      deviceId: 'harp',
      params: { strings: 1, pluck: 0.1, touch: 0.3, decay: 2.2, halo: 0.7, body: 0.7, volume: 1 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm Glue', params: { driveDb: 11, outputDb: -8 } },
      { deviceId: 'flanger', preset: 'Classic Jet', params: { rate: 0.16, mix: 0.4 } },
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 340, feedback: 0.35, mix: 0.35 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  {
    id: 'park-zither-long-afternoon-ring',
    name: 'Long afternoon ring',
    category: 'plucked',
    description:
      'A harp touched lightly at mid-string and ringing three times as long, with a slow chorus and a blurred high halo.',
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { touch: 0.2, decay: 3.2, body: 0.3, volume: -4.7 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.3 } },
      { deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'park-zither-kite-strings',
    name: 'Kite strings',
    category: 'plucked',
    description:
      'Bright steel strings rolled into each other, with echoes that jump up an octave on every other repeat.',
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng cascade',
      params: { sweep: 0.5, touch: 0.6, volume: 4.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Octave hops',
        params: { time: 360, feedback: 0.5, mix: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { breathDepth: 0, mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'park-zither-palm-on-the-strings',
    name: 'Palm on the strings',
    category: 'plucked',
    description:
      'A harp damped with the palm so each note is a short knock, kept moving by a phaser and a quick echo.',
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { damp: 0.7, touch: 0.5, body: 0.9, volume: -1.6 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Classic 4-Stage',
        params: { centerHz: 1000, rate: 0.6, mix: 0.45 },
      },
      {
        deviceId: 'analog-delay',
        preset: 'Slapback',
        params: { time: 220, feedback: 0.45, spread: 0.7, mix: 0.35 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.15 } },
    ],
    preview: 'keys',
  },
  {
    id: 'park-zither-bending-silk',
    name: 'Bending silk',
    category: 'plucked',
    description:
      'Soft silk strings pressed behind the bridge so each note rises into pitch, with moments of it drifting back.',
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { bend: 80, decay: 3, halo: 1, volume: 2 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Flickers', params: { size: 0.6, tone: 7000, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'bells',
  },

  // Bells: thumb piano, gongs, bowls and chimes, the other things carried to the park in the bag.
  {
    id: 'park-zither-thumb-piano-swirl',
    name: 'Thumb piano swirl',
    category: 'bell',
    description:
      'A dry thumb piano put through the zither pedals: a phaser, then an echo that keeps a pattern going.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { hardness: 0.7, brightness: 0.6, volume: -0.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Warm Six-Stage', params: { rate: 0.45, mix: 0.5 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 330, feedback: 0.55, tone: 4200, mix: 0.35 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'park-zither-gourd-resonator',
    name: 'Gourd resonator',
    category: 'bell',
    description:
      'Thumb piano tines plucked softly near the middle, warm and round, looped as a quiet bed under what comes next.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: {
        decay: 6,
        damping: 0.55,
        hardness: 0.35,
        position: 0.4,
        brightness: 0.4,
        release: 0.7,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Soft bed', params: { length: 3, fade: 0.1, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'park-zither-tines-and-sparks',
    name: 'Tines and sparks',
    category: 'bell',
    description:
      'Hard bright thumb piano notes, each restruck seven times as it dies, on a small plate.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 1.8, hardness: 0.9, brightness: 0.8, spread: 0.5, volume: -4.5 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Restruck', params: { time: 280, high: 0.7, mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'park-zither-edge-struck-gong',
    name: 'Edge-struck gong',
    category: 'bell',
    description:
      'A gong struck hard near its edge so the high modes speak, turned by a slow phaser in a very large space.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: {
        decay: 20,
        damping: 0.25,
        hardness: 0.85,
        position: 0.7,
        brightness: 0.9,
        spread: 0.5,
        volume: -13.5,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep 8-Stage', params: { rate: 0.1, mix: 0.4 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 14, highCut: 8000, width: 0.7, mix: 0.35 },
      },
    ],
    preview: 'keys',
  },
  {
    id: 'park-zither-bronze-weather',
    name: 'Bronze weather',
    category: 'bell',
    description:
      'A gong kept sounding with soft beaters for as long as the key is held, swept by a slow flanger in a cathedral.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: {
        damping: 0.3,
        hardness: 0.5,
        sustain: 0.9,
        brightness: 0.75,
        detune: 3,
        release: 0.1,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow Sweep', params: { feedback: 45, mix: 0.45 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    preview: 'hold',
  },
  {
    id: 'park-zither-bowl-on-the-blanket',
    name: 'Bowl on the blanket',
    category: 'bell',
    description:
      'A bronze bowl tapped once per note with a padded stick, its slow beating spread wide on a long plate.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: { decay: 14, hardness: 0.35, detune: 1.6, brightness: 0.55, volume: -4 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Subtle halo', params: { tone: 9000, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'park-zither-wet-glass-rims',
    name: 'Wet glass rims',
    category: 'bell',
    description:
      'Glasses rubbed until they sing, each note swelling in, phased in twelve stages with a rising halo behind.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { sustain: 1, hardness: 0.1, brightness: 0.5, release: 0.4, volume: -11 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve Stage Cloud', params: { rate: 0.08, mix: 0.4 } },
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { shimmer: 0.3, decay: 6, mix: 0.25 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'park-zither-pocket-chimes',
    name: 'Pocket chimes',
    category: 'bell',
    description:
      'Small metal bars struck hard and bright, doubled by a flanger, with echoes that hop a fifth and a fourth.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 4, hardness: 0.9, brightness: 0.95, volume: -3.4 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Gentle Sweep', params: { delayMs: 1.8, mix: 0.35 } },
      {
        deviceId: 'analog-delay',
        preset: 'Fifths and fourths',
        params: { time: 300, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },

  // Tanpura: the drone that sits under the strings for a whole side of a cassette.
  {
    id: 'park-zither-blanket-drone',
    name: 'Blanket drone',
    category: 'drone',
    description:
      'Four strings plucked round and round with a buzzing bridge, in a phasing that seems to climb without end.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { jawari: 0.7, speed: 4, volume: -5 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Barber pole',
        params: { fine: 0.6, feedback: 0.7, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'park-zither-long-noon-drone',
    name: 'Long noon drone',
    category: 'drone',
    description:
      'Slow plucks that overlap into a wall of overtones, swept by a slow flanger across a very large space.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wall',
      params: { jawari: 0.85, speed: 8, volume: -1.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow Sweep', params: { depth: 60, mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 14, mix: 0.4 } },
    ],
  },
  {
    id: 'park-zither-fourth-string-open',
    name: 'Fourth string open',
    category: 'drone',
    description:
      'A drone tuned to the fourth, with a bank of sympathetic strings in D ringing behind it in a hall.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Ma tuning',
      params: { jawari: 0.55, detune: 3, volume: -5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Sitar drone', params: { mode: 1, mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'park-zither-woody-quick-drone',
    name: 'Woody quick drone',
    category: 'drone',
    description:
      'The bridge nearly closed so the strings are plain and woody, plucked quickly, with a chorus and a dark echo.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Closed jawari',
      params: { jawari: 0.15, speed: 3, body: 0.7, volume: -0.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush Ensemble', params: { mix: 0.4 } },
      {
        deviceId: 'analog-delay',
        preset: 'Long and murky',
        params: { time: 750, feedback: 0.45, mix: 0.3 },
      },
    ],
  },
  {
    id: 'park-zither-late-light-drone',
    name: 'Late light drone',
    category: 'drone',
    description:
      'A drone with the seventh in it, plucked slowly, through a slow rotating speaker with a faint octave above.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Evening Ni',
      params: { speed: 6, spread: 0.8, volume: -7 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.1, distance: 0.5, mix: 0.7 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { shimmer: 0.3, mix: 0.3 } },
    ],
  },

  // Felt piano: the piano the strings were learned from, played open and bright.
  {
    id: 'park-zither-chapel-upright',
    name: 'Chapel upright',
    category: 'keys',
    description:
      'A piano with the felt taken off and hard bright hammers, open strings ringing in sympathy behind it in a hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { hardness: 0.7, resonance: 0.8, damper: 0.7, reverbMix: 0.1, outputDb: -13.5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Piano pedal', params: { strings: 8, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { lowDecay: 2.5, mix: 0.3 } },
    ],
  },
  {
    id: 'park-zither-piano-in-the-pedals',
    name: 'Piano in the pedals',
    category: 'keys',
    description:
      'A soft felt piano sent through the zither pedals: a slow six-stage phaser and a chorused echo.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { felt: 0.45, hardness: 0.45, thump: 0.3, reverbMix: 0.1, outputDb: -8.4 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Warm Six-Stage', params: { rate: 0.18, mix: 0.5 } },
      { deviceId: 'analog-delay', preset: 'Chorus echo', params: { time: 400, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.2 } },
    ],
  },

  // Acoustic guitar: the instrument that was traded in for the strings.
  {
    id: 'park-zither-traded-twelve-string',
    name: 'Traded twelve-string',
    category: 'plucked',
    description:
      'A twelve-string picked near the bridge and strummed, phased, with an amplifier spring behind it.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { strum: 45, nail: 0.55, tone: 0.75, sustain: 8, release: 4, volume: -3.8 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Classic 4-Stage',
        params: { rate: 0.35, centerHz: 1000, mix: 0.45 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'park-zither-stoop-fingerstyle',
    name: 'Stoop fingerstyle',
    category: 'plucked',
    description:
      'Steel strings picked with the fingertips and let ring, doubled a few cents apart, with a short tape echo on a small plate.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { nail: 0.3, position: 0.24, tone: 0.55, volume: 0.2 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Subtle halo', params: { detune: 6, mix: 0.3 } },
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 240, feedback: 0.3, spread: 0.4, mix: 0.25 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { decay: 0.55, mix: 0.25 } },
    ],
  },

  // Atmosphere: what the park itself adds to the tape.
  {
    id: 'park-zither-fountain-basin',
    name: 'Fountain basin',
    category: 'texture',
    description:
      'Dense bright falling water, steady as a fountain filling its basin, with a slow phaser turning in it.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Distant downpour',
      params: {
        density: 1,
        tone: 0.75,
        size: 0.7,
        movement: 0.3,
        attack: 1,
        width: 0.7,
        volume: 2.5,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { centerHz: 2000, depth: 60, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
      { deviceId: 'ambient-limiter', params: { ceiling: -9.5, gain: 4.5, release: 0.5 } },
    ],
  },
  {
    id: 'park-zither-wind-in-plane-trees',
    name: 'Wind in plane trees',
    category: 'texture',
    description:
      'Gusting wind with a little pitch in it, combed by a slow flanger so it seems to pass through leaves.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: {
        density: 0.55,
        movement: 0.75,
        tone: 0.6,
        resonance: 0.3,
        attack: 1,
        width: 0.6,
        volume: 1,
      },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow Sweep', params: { delayMs: 3, feedback: 45, mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },

  // Aurora: a brass and string pad to lay under the strings.
  {
    id: 'park-zither-warm-brick',
    name: 'Warm brick',
    category: 'pad',
    description: 'Bright synthesiser strings that swell in, turned by a slow phaser in a hall.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { brilliance: 6000, attack: 0.8, detune: 12, volume: -5.3 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { rate: 0.1, mix: 0.45 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'park-zither-brass-gong-pad',
    name: 'Brass gong pad',
    category: 'pad',
    description:
      'A brassy chord with ring modulation in it that clangs like struck metal and keeps swelling, flanged on a plate.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { brilliance: 2600, ring: 0.65, attack: 0.05, swell: 0.3, volume: -8.2 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Gentle Sweep', params: { rate: 0.12, mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },

  // Bow: one string of the box, bowed or struck alone.
  {
    id: 'park-zither-bowed-wire',
    name: 'Bowed wire',
    category: 'string',
    description:
      'One thin wire bowed lightly near the bridge, pure and slow to speak, in a phaser on a long plate.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 1.8, pressure: 0.25, brightness: 0.85, vibrato: 0.05, volume: -4.2 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm Six-Stage',
        params: { centerHz: 1400, rate: 0.14, mix: 0.4 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    preview: 'line',
  },
  {
    id: 'park-zither-one-string-echo',
    name: 'One string echo',
    category: 'string',
    description:
      'A single plucked string with a wooden body, plain and close, counted out by two tape heads.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { brightness: 0.5, decay: 5, position: 0.12, body: 0.75, volume: -1 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: { time: 330, heads: 1, feedback: 0.5, highCut: 5500, spread: 0.6, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },

  // Chamber strings: a few players joining in from the next bench.
  {
    id: 'park-zither-strings-under-the-arch',
    name: 'Strings under the arch',
    category: 'string',
    description:
      'Three players with almost no bow weight, mostly air, no vibrato, phased in twelve stages under stone.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { air: 0.6, attack: 1.2, volume: -5.7 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve Stage Cloud', params: { rate: 0.1, mix: 0.4 } },
      {
        deviceId: 'zita-rev1',
        preset: 'Cathedral',
        params: { midDecay: 4, damping: 5000, mix: 0.35 },
      },
    ],
  },
  {
    id: 'park-zither-six-warm-bows',
    name: 'Six warm bows',
    category: 'string',
    description:
      'Six players leaning on the bow with wide vibrato, close and unmuted, with one chorused repeat behind them.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 0.35, release: 1.6, vibrato: 16, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorus echo',
        params: { time: 360, feedback: 0.25, mix: 0.2 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 1.6, mix: 0.25 } },
    ],
  },

  // Choir: the voice that sings along with the strings, alone or as a round of friends.
  {
    id: 'park-zither-morning-chant',
    name: 'Morning chant',
    category: 'voice',
    description:
      'Low voices holding one closed vowel without vibrato, slowly phased, in a hall whose tail sings back.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { vowel: 0.9, motion: 0.3, attack: 1.2, tone: 3800, volume: -7 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { centerHz: 700, mix: 0.35 } },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { decay: 6, mix: 0.3 } },
    ],
  },
  {
    id: 'park-zither-one-glad-voice',
    name: 'One glad voice',
    category: 'voice',
    description:
      'A single open-throated singer with a quick vibrato, answered by a tape echo across a hall.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { vowel: 0.05, vibrato: 26, attack: 0.08, release: 0.9, tone: 8000, volume: -5.3 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: { time: 420, feedback: 0.4, highCut: 5000, spread: 0.5, mix: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },

  // Clarinet: reeds, as a mouth organ chord and as one player by the water.
  {
    id: 'park-zither-mouth-organ-chord',
    name: 'Mouth organ chord',
    category: 'wind',
    description:
      'A hollow reed section held as a chord and fluttered by a tremolo, like a mouth organ breathed in and out.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { bore: 0.5, blow: 0.6, breath: 0.35, attack: 0.12, release: 0.5, volume: -6.4 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 5.5, depth: 0.35, phase: 60 } },
      { deviceId: 'chorus', preset: 'Classic Chorus', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'park-zither-reed-by-the-water',
    name: 'Reed by the water',
    category: 'wind',
    description: 'A breathy double reed with a wide vibrato, sent into a dark echo and a hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { breath: 0.6, vibrato: 0.6, attack: 0.25, release: 0.7, volume: -4 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { time: 470, mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // Drone: held just-intoned air, and a low fifth sounding its harmonic series.
  {
    id: 'park-zither-just-major-air',
    name: 'Just major air',
    category: 'drone',
    description:
      'A just major chord of soft partials on every key with air in it, opening slowly under a faint rising octave.',
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: { cutoff: 6500, sub: 0.1, movement: 0.5, volume: -8 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Slow Swirl',
        params: { centerHz: 1600, depth: 70, mix: 0.35 },
      },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { shimmer: 0.3, mix: 0.25 } },
    ],
  },
  {
    id: 'park-zither-overtone-ladder',
    name: 'Overtone ladder',
    category: 'drone',
    description:
      'A low fifth sounding its whole harmonic series, buzzing like a drone lute, combed by a resonant flanger.',
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: { movement: 0.8, rate: 0.3, cutoff: 4200, attack: 1, volume: -3.7 },
    },
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Classic Jet',
        params: { rate: 0.07, depth: 75, feedback: 55, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // Dusk: the home keyboard of the cassette years, its own chorus left to do the widening.
  {
    id: 'park-zither-home-keyboard-organ',
    name: 'Home keyboard organ',
    category: 'pad',
    description:
      'A square-wave organ tone with both choruses on and no attack to speak of, on a worn cassette in a spring.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Shimmer organ',
      params: { cutoff: 2600, sub: 0.4, release: 0.5, volume: -15.7 },
    },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Worn cassette',
        params: { drive: 0.4, wobble: 0.3, noise: 0.3 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'park-zither-phased-pulse-pad',
    name: 'Phased pulse pad',
    category: 'pad',
    description:
      'A thin moving pulse with the filter well open, swelling in softly into a slow phaser and a hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Wide pulse',
      params: { cutoff: 5200, attack: 1, release: 3, volume: -6.8 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm Six-Stage',
        params: { rate: 0.12, depth: 75, mix: 0.45 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // Ember: plain oscillators made to ring like the bells and the strings.
  {
    id: 'park-zither-sine-chimes',
    name: 'Sine chimes',
    category: 'bell',
    description:
      'Two sine waves a twelfth apart struck like a chime, with repeats that climb an octave each time, in a hall.',
    instrument: {
      deviceId: 'ember',
      preset: 'Bell',
      params: {
        ampDecay: 2.2,
        ampRelease: 2.2,
        oscMix: 0.5,
        unisonVoices: 2,
        unisonDetune: 8,
        volume: 3.3,
      },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Rising steps',
        params: { delay: 300, feedback: 0.45, mix: 0.35 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'park-zither-glass-pad-turning',
    name: 'Glass pad turning',
    category: 'pad',
    description:
      'A triangle and a thin pulse an octave apart, three voices wide, turned through twelve phaser stages on a plate.',
    instrument: {
      deviceId: 'ember',
      preset: 'Glass pad',
      params: { cutoff: 4200, ampAttack: 0.6, ampRelease: 4, unisonSpread: 0.7, volume: -4.6 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Twelve Stage Cloud',
        params: { rate: 0.09, feedback: 40, mix: 0.4 },
      },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
  },

  // Flute: breath, from the player at the other end of the path.
  {
    id: 'park-zither-wood-flute-far-bench',
    name: 'Wood flute, far bench',
    category: 'wind',
    description:
      'A wooden flute that scoops up into each note, heard with a tape echo across a very large space.',
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { breath: 0.4, scoop: 55, vibrato: 0.45, release: 1, volume: -10.4 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: { time: 520, feedback: 0.4, highCut: 4000, spread: 0.5, mix: 0.3 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 7, mix: 0.3 } },
    ],
  },
  {
    id: 'park-zither-pipes-in-a-round',
    name: 'Pipes in a round',
    category: 'wind',
    description:
      'Pan pipes with a hard chiff and no vibrato, each note caught by a phaser and sung back by a short echo.',
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { chiff: 1, breath: 0.55, release: 0.6, volume: -7.4 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Classic 4-Stage',
        params: { centerHz: 1200, rate: 0.45, mix: 0.4 },
      },
      {
        deviceId: 'analog-delay',
        preset: 'Chorus echo',
        params: { time: 270, feedback: 0.5, mix: 0.35 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },

  // Glass: FM bells and tines for the same bright patterns.
  {
    id: 'park-zither-glass-bell-swirl',
    name: 'Glass bell swirl',
    category: 'bell',
    description:
      'A bright FM glass bell with slow beating, its long ring carried round by a phaser into a hall.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { brightness: 0.55, decay: 4, detune: 8, spread: 0.7, volume: -2.3 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm Six-Stage',
        params: { centerHz: 1600, rate: 0.25, mix: 0.45 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { breathDepth: 0.1, mix: 0.3 } },
    ],
  },
  {
    id: 'park-zither-electric-thumb-piano',
    name: 'Electric thumb piano',
    category: 'bell',
    description: 'Short FM tines with a little bite, through a chorus and round three tape heads.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: { ratio: 5, brightness: 0.4, decay: 1.2, release: 0.8, feedback: 0.2, volume: -6 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic Chorus', params: { rate: 0.6, mix: 0.35 } },
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 360, feedback: 0.45, highCut: 5000, mix: 0.35 },
      },
    ],
    preview: 'keys',
  },

  // Grain: whatever recording is loaded, treated as the strings are.
  {
    id: 'park-zither-glitter-of-anything',
    name: 'Glitter of anything',
    category: 'pad',
    description:
      'Whatever is loaded, scattered as a cloud of grains, many thrown up an octave and echoed higher again.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Shimmer',
      params: { size: 240, density: 12, octaves: 0.7, attack: 0.8, tone: 14000, volume: -19 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals', params: { time: 280, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'park-zither-hammered-grains',
    name: 'Hammered grains',
    category: 'texture',
    description:
      'Whatever is loaded, cut into short hard-edged grains that rattle like a roll of light hammers, with an echo.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Stutter',
      params: {
        size: 60,
        density: 3,
        scan: 0.3,
        spray: 0.1,
        release: 0.6,
        spread: 0.7,
        volume: -11,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorus echo',
        params: { time: 330, feedback: 0.45, mix: 0.3 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },

  // Guitar: an electric played the way the zither is, open and chiming.
  {
    id: 'park-zither-electric-twelve-swirl',
    name: 'Electric twelve swirl',
    category: 'plucked',
    description:
      'A bright electric twelve-string strummed through a phaser and a chorused echo, with a little spring.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Twelve string',
      params: { strum: 45, tone: 5200, sustain: 14, volume: 2.6 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm Six-Stage',
        params: { rate: 0.33, centerHz: 1100, mix: 0.5 },
      },
      { deviceId: 'analog-delay', preset: 'Chorus echo', params: { time: 350, mix: 0.25 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    preview: 'chord',
  },
  {
    id: 'park-zither-chords-from-nothing',
    name: 'Chords from nothing',
    category: 'plucked',
    description:
      'A clean guitar with every note swelled in so no pick is heard, in a slow rotating speaker and a hall.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { swell: 1, pickup: 0.7, tone: 3600, volume: 6 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 3 } },
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.1, distance: 0.25, mix: 0.75 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },

  // Horns: soft brass drifting over from somewhere else in the park.
  {
    id: 'park-zither-flugel-across-the-lawn',
    name: 'Flugel across the lawn',
    category: 'wind',
    description:
      'One flugelhorn blown softly with breath in the tone and a slow vibrato, with a tape echo in a hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { blow: 0.4, attack: 0.2, release: 1.8, volume: -4 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 400, feedback: 0.35, mix: 0.25 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'park-zither-brass-in-the-swirl',
    name: 'Brass in the swirl',
    category: 'wind',
    description:
      'A section of horns swelling in slowly as a chord, turned by a deep eight-stage phaser on a long plate.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.7, attack: 1.5, release: 3, section: 0.8, volume: -4.3 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Deep 8-Stage',
        params: { rate: 0.13, feedback: 50, mix: 0.45 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },

  // Ladder bass: the root under the strings, held or pulsing.
  {
    id: 'park-zither-root-under-the-strings',
    name: 'Root under the strings',
    category: 'keys',
    description:
      'Two beating oscillators and a sub held as a low pedal note, slowly phased so the top of it turns.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Pedal drone',
      params: { cutoff: 600, beat: 7, sub: 0.5, volume: -12.4 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Bass Safe',
        params: { centerHz: 1200, rate: 0.12, depth: 60, mix: 0.45 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.2 } },
    ],
    preview: 'low',
  },
  {
    id: 'park-zither-rubber-pulse',
    name: 'Rubber pulse',
    category: 'keys',
    description:
      'A short rubbery bass pluck, each note bounced by a quick echo so a slow line becomes a pulse.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Rubber pluck',
      params: { cutoff: 700, decay: 1.2, drive: 0.7, glide: 0.03, volume: 3 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Slapback',
        params: { time: 250, feedback: 0.5, tone: 3000, spread: 0.6, mix: 0.35 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
    preview: 'line',
  },

  // Organ: a lap harmonium, and the flutes of a small chapel organ.
  {
    id: 'park-zither-lap-harmonium',
    name: 'Lap harmonium',
    category: 'organ',
    description:
      'A reedy harmonium pumped by hand so the chord breathes, with a slow phaser and a little hall.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: {
        reed: 0.65,
        bellows: 0.7,
        celeste: 0.3,
        tone: 3200,
        attack: 0.25,
        release: 0.8,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { centerHz: 900, depth: 70, mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'park-zither-flutes-turning',
    name: 'Flutes turning',
    category: 'organ',
    description:
      'Soft flute pipes with their wind audible and no reeds, through a slowly rotating speaker across a room.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { octave: 0.45, fifteenth: 0.2, breath: 0.35, release: 1, volume: -11.6 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room', params: { distance: 0.7, drive: 0.15 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 3, mix: 0.25 } },
    ],
  },

  // Outdoors: the birds and the chimes that end up on any recording made on a bench.
  {
    id: 'park-zither-sparrows-at-the-gate',
    name: 'Sparrows at the gate',
    category: 'texture',
    description:
      'A busy flock of whistled bird calls close by, bright and dry, with only a small room round them.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Dawn chorus',
      params: { density: 0.8, distance: 0.2, tone: 0.6, attack: 1, width: 0.8, volume: -5.6 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { lowCut: 200 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'park-zither-chimes-on-a-branch',
    name: 'Chimes on a branch',
    category: 'texture',
    description:
      'Wind chimes stirred by a restless breeze, tuned by the key, phased and scattered further by an echo.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Chimes in a breeze',
      params: { density: 0.85, distance: 0.25, tone: 0.65, width: 0.8, volume: -6.7 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm Six-Stage',
        params: { centerHz: 2000, rate: 0.2, mix: 0.4 },
      },
      {
        deviceId: 'analog-delay',
        preset: 'Chorus echo',
        params: { time: 410, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { breathDepth: 0, mix: 0.25 } },
    ],
  },

  // Pedal steel: a slide bar laid across the strings.
  {
    id: 'park-zither-slide-bar',
    name: 'Slide bar',
    category: 'plucked',
    description:
      'Hard-picked steel strings with a bar sliding between overlapping notes, in a phaser and a long spring.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Lap slide',
      params: { glide: 260, vibrato: 12, tone: 5200, sustain: 10, volume: -2.8 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Classic 4-Stage',
        params: { centerHz: 1300, rate: 0.28, mix: 0.45 },
      },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { tone: 4200, mix: 0.3 } },
    ],
  },
  {
    id: 'park-zither-glass-slide-swell',
    name: 'Glass slide swell',
    category: 'plucked',
    description:
      'Steel notes swelled in with a pedal and held without vibrato, drifting through a slow flanger on a long plate.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.2, tone: 2800, pick: 0.3, volume: -8.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Wide Wash', params: { rate: 0.1, mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },

  // Sampler: whatever recording is loaded, played across the keys.
  {
    id: 'park-zither-loaded-and-phased',
    name: 'Loaded and phased',
    category: 'keys',
    description:
      'Whatever is loaded, looped under each key with a little wobble, through a phaser and a chorused echo.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: {
        crossfade: 120,
        attack: 0.03,
        release: 1.2,
        tone: 10000,
        wobble: 0.3,
        volume: -10.7,
      },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm Six-Stage',
        params: { rate: 0.26, depth: 70, mix: 0.45 },
      },
      { deviceId: 'analog-delay', preset: 'Chorus echo', params: { time: 380, mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'park-zither-once-and-upward',
    name: 'Once and upward',
    category: 'keys',
    description:
      'Whatever is loaded, played once per key from start to end and thrown back as a stack of rising octaves.',
    instrument: {
      deviceId: 'sampler',
      preset: 'One shot',
      params: { release: 0.8, tone: 12000, volume: -10.7 },
    },
    effects: [
      {
        deviceId: 'cascade',
        preset: 'Octave stack',
        params: { time: 330, repeats: 6, high: 0.75, spread: 0.8, mix: 0.4 },
      },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },

  // String machine: the string ensemble and phaser pairing of the seventies.
  {
    id: 'park-zither-ensemble-and-phaser',
    name: 'Ensemble and phaser',
    category: 'string',
    description:
      'The top octave of a string ensemble, thin and bright, through a slow six-stage phaser into a hall.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.7, release: 3, tone: 8000, low: 0.1, volume: -7.6 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm Six-Stage',
        params: { centerHz: 1000, rate: 0.15, depth: 80, feedback: 50 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'park-zither-slow-saw-tide',
    name: 'Slow saw tide',
    category: 'string',
    description:
      'A low string ensemble that swells in slowly, its chorus slowed, under a slow flanger in a very large space.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 3, tone: 2400, speed: 0.6, high: 0.3, volume: -6 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow Sweep', params: { feedback: 40, mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 8, mix: 0.3 } },
    ],
  },

  // Tape orchestra: a tape-replay keyboard heard through the same pedals.
  {
    id: 'park-zither-tape-flutes-phased',
    name: 'Tape flutes, phased',
    category: 'wind',
    description:
      'Flutes from a strip of worn tape under each key, wavering, through a quick phaser and a tape echo.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: { age: 0.45, release: 0.6, vibrato: 0.5, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Classic 4-Stage',
        params: { centerHz: 1100, rate: 0.55, mix: 0.45 },
      },
      { deviceId: 'tape-echo', params: { time: 400, feedback: 0.4, mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
  {
    id: 'park-zither-choir-on-a-reel',
    name: 'Choir on a reel',
    category: 'voice',
    description:
      'A choir played from tape with its hiss, brightened a little, swept by a slow flanger in a hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: { tone: 0.3, hiss: 0.3, attack: 0.4, release: 1.6, volume: -8.4 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Gentle Sweep', params: { rate: 0.1, depth: 65, mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // Thesis: chords of tuned air, strummed like the strings.
  {
    id: 'park-zither-five-note-breath',
    name: 'Five-note breath',
    category: 'pad',
    description:
      'Bands of noise tuned to a pentatonic scale and its mirror, breathing every two seconds through a phaser.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Pentatonic Breath',
      params: { resonance: 60, attack: 0.3, release: 2.5, breatheRate: 0.5, strum: 30 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 10, outputGain: -4 } },
      { deviceId: 'phaser', preset: 'Warm Six-Stage', params: { rate: 0.2, mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'hold',
  },
  {
    id: 'park-zither-strummed-air',
    name: 'Strummed air',
    category: 'plucked',
    description:
      'A stack of tuned noise bands strummed quickly like strings in a raised-fourth scale, with a bright echo.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Strummed Lydian',
      params: { resonance: 70, attack: 0.02, release: 1.6, strum: 60 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 12, outputGain: -6.7 } },
      {
        deviceId: 'analog-delay',
        preset: 'Chorus echo',
        params: { time: 340, feedback: 0.5, tone: 6000, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },

  // Tine piano: the electric piano of the club years before the park.
  {
    id: 'park-zither-tines-in-a-phaser',
    name: 'Tines in a phaser',
    category: 'keys',
    description:
      'A bell-toned electric piano through a slow phaser with its tremolo barely on, in a small plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { tremolo: 0.1, decay: 1.5, release: 0.5, volume: -12.6 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Classic 4-Stage',
        params: { rate: 0.22, depth: 75, mix: 0.5 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'park-zither-late-set-tines',
    name: 'Late set tines',
    category: 'keys',
    description:
      'A long-ringing electric piano panning slowly from side to side, mellow, with a dark echo, taped on a cassette.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { bell: 0.4, decay: 2.2, hardness: 0.55, tone: 0.42, volume: -16.8 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Long and murky',
        params: { time: 640, feedback: 0.45, mix: 0.25 },
      },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
    ],
  },

  // Wavetable: glass and vowel tables moved slowly, as beds for the strings.
  {
    id: 'park-zither-glass-table-morning',
    name: 'Glass table morning',
    category: 'pad',
    description:
      'A glass wavetable drifting through its brighter half, with a faint rising octave and a slow phaser.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: { position: 0.6, motion: 0.6, cutoff: 7000, sub: 0.1, attack: 0.8, volume: -9 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { centerHz: 1400, depth: 70, mix: 0.4 } },
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { shimmer: 0.25, decay: 5, mix: 0.25 },
      },
    ],
  },
  {
    id: 'park-zither-vowel-haze',
    name: 'Vowel haze',
    category: 'pad',
    description:
      'A wavetable moving slowly between vowels, slow to speak, combed by a flanger in a hall.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { rate: 0.08, cutoff: 5000, spread: 0.5, volume: -8.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Wide Wash', params: { depth: 65, stereo: 90, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // West coast: folded tones struck like strings and like sticks on wood.
  {
    id: 'park-zither-folded-gate-pluck',
    name: 'Folded gate pluck',
    category: 'plucked',
    description:
      'A wavefolded tone plucked through a gate that darkens as it fades, bright at the front, with an echo in a hall.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Bright harp',
      params: { decay: 3.5, fold: 0.5, chance: 0.1, volume: -3.9 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic wide', params: { mix: 0.3 } },
      {
        deviceId: 'analog-delay',
        preset: 'Chorus echo',
        params: { time: 300, feedback: 0.45, mix: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'park-zither-sticks-on-the-bench',
    name: 'Sticks on the bench',
    category: 'bell',
    description:
      'Short folded knocks, no two alike, like sticks on wood, clipped softly and pattered about by two tape heads.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Rain on wood',
      params: { decay: 0.4, colour: 0.6, volume: 0 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm Glue', params: { driveDb: 16, outputDb: -6.9 } },
      {
        deviceId: 'tape-echo',
        params: { time: 220, heads: 1, feedback: 0.6, highCut: 6000, spread: 0.8, mix: 0.45 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
]
