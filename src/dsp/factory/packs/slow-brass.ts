import { type FactoryPreset } from '../types'

// Horns, strings, reeds and swelled guitars with the entries taken off: each sound fades in over
// seconds, stays dark and leaves through a very long hall. One chord, held, and no hurry.

export const PRESETS: readonly FactoryPreset[] = [
  // Horns
  {
    id: 'slow-brass-hall-door-horns',
    name: 'Hall door horns',
    category: 'wind',
    description:
      'A horn section that takes four seconds to arrive, its top rolled off, leaving through a cathedral.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.45, section: 0.85, attack: 4.5, release: 8, volume: -8 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 5000 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 7.5, mix: 0.5 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-brass-low-fifth-brass',
    name: 'Low fifth brass',
    category: 'wind',
    description:
      'Trombones and tuba on a low fifth, shadowed an octave under at half speed, in a very large space.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { blow: 0.35, attack: 4, release: 8, volume: -4 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 14, mix: 0.4 } },
    ],
    preview: 'low',
  },
  {
    id: 'slow-brass-flugelhorn-next-room',
    name: 'Flugelhorn, next room',
    category: 'wind',
    description:
      'One flugelhorn, half breath, each note a second in coming, heard through its own room and a hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { blow: 0.3, breath: 0.6, attack: 2, release: 3.5, vibrato: 0, volume: 0 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Just the room' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 7, mix: 0.45 } },
    ],
    preview: 'line',
  },
  {
    id: 'slow-brass-night-ward-horn',
    name: 'Night ward horn',
    category: 'wind',
    description:
      'A muted trumpet, thin and nasal, its top taken off by a tape preamp and smeared until valves and breath are gone.',
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { blow: 0.3, attack: 3, release: 5, vibrato: 0, volume: 4 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Warm glue',
        params: { drive: 0.15, tone: -0.6, highCut: 1200, output: 3 },
      },
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { tilt: -2.5, highCut: 3500, width: 0.5, mix: 0.6 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 8, mix: 0.4 },
      },
    ],
    preview: 'hold',
  },
  {
    id: 'slow-brass-horn-fifth-above',
    name: 'Horn, fifth above',
    category: 'wind',
    description:
      'One horn note shadowed a fifth above, caught by a sustainer that holds both on into a long plate.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.5, section: 0.7, attack: 3.5, release: 6, harmony: 0.5, volume: -1 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } },
    ],
    preview: 'hold',
  },
  {
    id: 'slow-brass-trumpets-through-a-wall',
    name: 'Trumpets through a wall',
    category: 'wind',
    description:
      'A trumpet section blown softly behind a low-pass wall, a string pad rising slowly in its shadow.',
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { blow: 0.25, breath: 0.2, attack: 3, release: 6, volume: -6 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Init', params: { slope: 1, cutoffHz: 900 } },
      { deviceId: 'pad-follower', preset: 'Lingering', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-brass-slow-loop-horn',
    name: 'Slow loop horn',
    category: 'wind',
    description:
      'One horn note fading in, caught on a three-second tape loop that wears each time it comes round.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.55, section: 0.3, attack: 2.5, release: 5, volume: -4 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 3, feedback: 0.75, wear: 0.45, spread: 0.4, mix: 0.45 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { lowDecay: 5, midDecay: 4, mix: 0.4 } },
    ],
    preview: 'hold',
  },

  // Chamber strings
  {
    id: 'slow-brass-muted-section-slow',
    name: 'Muted section, slow',
    category: 'string',
    description:
      'Muted strings without vibrato that take four seconds to speak, printed to tape, left in a cathedral.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { players: 4, attack: 4, release: 7, air: 0.2, volume: -7 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 7.5, mix: 0.5 },
      },
    ],
  },
  {
    id: 'slow-brass-long-room-bows',
    name: 'Long room bows',
    category: 'string',
    description:
      'Five players on a low fifth with slow bows and loose tuning, in a space whose tail swells after them.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Slow dark bows',
      params: { attack: 3, release: 6, vibrato: 0, mute: 0.5, volume: -3 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.45 } },
    ],
    preview: 'low',
  },
  {
    id: 'slow-brass-halo-held-open',
    name: 'Halo held open',
    category: 'string',
    description:
      'Strings without vibrato caught by a sustainer that holds the chord after the bows stop, in a long hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { players: 4, attack: 3, release: 6, volume: -4 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings', params: { decay: 20, mix: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 12, breathDepth: 0, mix: 0.45 } },
    ],
  },
  {
    id: 'slow-brass-airy-bows-blurred',
    name: 'Airy bows, blurred',
    category: 'string',
    description:
      'Light bows that are mostly air, smeared by a spectral blur so no bow change is heard, in a long plate.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { attack: 2.5, release: 5, air: 0.7, width: 0.45 },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { blur: 0.8, width: 0.35, mix: 0.6 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.5, mix: 0.35 } },
    ],
  },
  {
    id: 'slow-brass-section-octave-under',
    name: 'Section, octave under',
    category: 'string',
    description:
      'Six players a note with their own half-speed copy an octave below them, far back in a cathedral.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 2.5, release: 5, vibrato: 4, mute: 0.4, volume: -8.5 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { highCut: 5000, mix: 0.45 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 8, mix: 0.55 },
      },
    ],
  },
  {
    id: 'slow-brass-two-cellos',
    name: 'Two cellos',
    category: 'string',
    description:
      'Two players on a low fifth, nearly still, doubled a few cents apart in a long stone room.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        players: 2,
        attack: 2,
        release: 5,
        bow: 0.3,
        vibrato: 2,
        mute: 0.3,
        scatter: 0.5,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    preview: 'low',
  },
  {
    id: 'slow-brass-no-bow-changes',
    name: 'No bow changes',
    category: 'string',
    description:
      'A muted section faded in again by a slow swell, into a hall whose tail sings like a far choir.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: { players: 5, attack: 1.5, release: 4, vibrato: 0, mute: 0.6, volume: -7.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Tide' },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },

  // Bowed string
  {
    id: 'slow-brass-string-and-magnet',
    name: 'String and magnet',
    category: 'string',
    description:
      'Guitar strings held singing by a magnet, three seconds to arrive and no pick anywhere, in a very long hall.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        attack: 3,
        release: 7,
        brightness: 0.3,
        body: 0.3,
        vibrato: 0,
        detune: 10,
        volume: -15,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { mix: 0.3 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 16, damping: 0.5, size: 1.6, breathDepth: 0, mix: 0.5 },
      },
    ],
  },
  {
    id: 'slow-brass-back-row-cello',
    name: 'Back row cello',
    category: 'string',
    description:
      'One bowed string with a wooden body on a low fifth, almost no vibrato, dark and far in a huge space.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 2.5, release: 6, pressure: 0.4, vibrato: 0.05, volume: -8.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6000 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 4000, mix: 0.45 } },
    ],
    preview: 'low',
  },
  {
    id: 'slow-brass-light-bow-fading',
    name: 'Light bow, fading',
    category: 'string',
    description:
      'A light bow that takes four seconds to speak and nine to go, blurred into a hall that breathes slowly.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: {
        attack: 4,
        release: 9,
        brightness: 0.4,
        pressure: 0.2,
        vibrato: 0,
        detune: 12,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 12, mix: 0.5 } },
    ],
  },
  {
    id: 'slow-brass-corridor-feedback',
    name: 'Corridor feedback',
    category: 'string',
    description:
      'A string driven until it tips into its octave, through a warm amplifier at the far end of a corridor.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 3.5, release: 7, brightness: 0.5, vibrato: 0.1, volume: -5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      {
        deviceId: 're-amp',
        preset: 'Down the hall',
        params: { distance: 0.55, room: 0.6, noise: 0.2 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'hold',
  },
  {
    id: 'slow-brass-pedal-up-chord-in',
    name: 'Pedal up, chord in',
    category: 'string',
    description:
      'Plucked strings with the pick faded out as by a volume pedal, into murky repeats and a long plate.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { attack: 2.5, release: 8, brightness: 0.45, decay: 28, volume: 2 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 1500 } },
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { decay: 0.92, mix: 0.4 } },
    ],
  },
  {
    id: 'slow-brass-half-speed-bow',
    name: 'Half speed bow',
    category: 'string',
    description:
      'A bowed line replayed at half speed, an octave down and twice as slow, into a long plate.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 1.3,
        release: 5,
        pressure: 0.3,
        body: 0.6,
        vibrato: 0,
        detune: 5,
        volume: -9.5,
      },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { highCut: 4000, spread: 0.15, mix: 0.85 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { decay: 0.93, mix: 0.35 } },
    ],
    preview: 'line',
  },
  {
    id: 'slow-brass-two-strings-drifting',
    name: 'Two strings drifting',
    category: 'string',
    description:
      'One bowed note as two strings tuned apart so they beat, phasing slowly, in a plain twelve-second hall.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        mode: 2,
        attack: 4,
        release: 8,
        pressure: 0.3,
        body: 0.5,
        vibrato: 0,
        detune: 18,
        volume: -13,
      },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { mix: 0.4 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 12, tone: 4000, mix: 0.45 } },
    ],
    preview: 'hold',
  },

  // Clarinet
  {
    id: 'slow-brass-clarinets-no-entry',
    name: 'Clarinets, no entry',
    category: 'wind',
    description:
      'A chord of clarinets with no entry to hear: air first, then wood, then a very large space for the rest.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { blow: 0.45, attack: 3.5, release: 5, volume: -10 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 22, lowCut: 60, mix: 0.5 } },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-brass-bass-clarinet-fifth',
    name: 'Bass clarinet fifth',
    category: 'wind',
    description:
      'The bottom of a bass clarinet on a fifth, slow to speak and woody, on tape in a very large space.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { blow: 0.62, breath: 0.4, attack: 2.5, release: 5, volume: -6.3 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4, bump: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 16, lowCut: 40, mix: 0.45 } },
    ],
    preview: 'low',
  },
  {
    id: 'slow-brass-hollow-reeds-held',
    name: 'Hollow reeds held',
    category: 'wind',
    description:
      'A hollow clarinet chord with a dark sustained copy that stays under it after the players stop.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { attack: 2, release: 4.5, vibrato: 0, volume: -12 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-brass-far-side-reed',
    name: 'Far side reed',
    category: 'wind',
    description:
      'A single clarinet line, each note a second in coming, with old phrases drifting back in a hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { blow: 0.5, breath: 0.5, attack: 1.6, release: 3, volume: -2 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Minute ago', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 8, mix: 0.5 } },
    ],
    preview: 'line',
  },
  {
    id: 'slow-brass-more-air-than-reed',
    name: 'More air than reed',
    category: 'wind',
    description:
      'A clarinet blown so softly it is mostly air, smeared by a spectral blur into a long plate.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { blow: 0.25, breath: 0.95, attack: 3, release: 5, volume: -5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { width: 0.7, mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { decay: 0.93, mix: 0.35 } },
    ],
    preview: 'hold',
  },
  {
    id: 'slow-brass-reeds-octave-under',
    name: 'Reeds, octave under',
    category: 'wind',
    description:
      'Clarinets on tape with a half-speed copy an octave beneath them, in a hall that breathes in slow waves.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { bore: 0.1, breath: 0.3, attack: 2.5, release: 4, volume: -8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.45 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 14, mix: 0.5 } },
    ],
    preview: 'chord',
  },

  // Guitar
  {
    id: 'slow-brass-pickless-guitar-chord',
    name: 'Pickless guitar chord',
    category: 'plucked',
    description:
      'A clean guitar chord with the pick faded out over two seconds by the volume pedal, in a very long hall.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { hardness: 0.3, sustain: 24, tone: 2200, swell: 2.5, warmth: 0.6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4, output: 2.5 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 18, damping: 0.45, size: 1.5, breathDepth: 0, mix: 0.5 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-brass-amp-hum-guitar',
    name: 'Amp hum guitar',
    category: 'drone',
    description:
      'A swelled low fifth caught and held as a drone that takes most of a minute to fade, over the hum of an amplifier left on.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { pickup: 0.8, sustain: 30, tone: 1800, swell: 3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { output: 2.2 } },
      {
        deviceId: 'sustainer',
        preset: 'Endless drone',
        params: { sensitivity: 0.7, attack: 2, decay: 40, mix: 0.6 },
      },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { level: -46 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'slow-brass-baritone-no-pick',
    name: 'Baritone, no pick',
    category: 'plucked',
    description:
      'Low strings by the bridge swelled in with no pick heard, thickened by a tape preamp, in a long plate.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark baritone',
      params: { hardness: 0.4, sustain: 20, tone: 1700, swell: 2, volume: 2 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { decay: 0.93, mix: 0.45 } },
    ],
    preview: 'low',
  },
  {
    id: 'slow-brass-two-guitars-one-chord',
    name: 'Two guitars, one chord',
    category: 'plucked',
    description:
      'A chord built a note at a time: each swelled note doubled a few cents apart, as if by two players, and layered on a tape loop.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { pickup: 0.3, hardness: 0.3, tone: 2600, swell: 1.2, shimmer: 0.6 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level', params: { ratio: 1, makeup: 8 } },
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { mix: 0.4 } },
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 2.6, feedback: 0.8, wear: 0.5, spread: 0.5, mix: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 10, mix: 0.45 } },
    ],
  },
  {
    id: 'slow-brass-guitar-into-strings',
    name: 'Guitar into strings',
    category: 'plucked',
    description:
      'A swelled neck-pickup chord that a string pad grows out of over two seconds and outlasts, in a cathedral.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { hardness: 0.35, sustain: 20, tone: 2800, swell: 2, volume: 6 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level', params: { ratio: 1, makeup: 11.5 } },
      {
        deviceId: 'pad-follower',
        preset: 'Slow swell',
        params: { rise: 2, fall: 12, brightness: 2000, width: 0.6, mix: 0.8 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 8, mix: 0.5 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-brass-strum-dissolved',
    name: 'Strum dissolved',
    category: 'plucked',
    description:
      'A slow strum with its attack removed by a swell, replayed as a cloud of long grains, in a long plate.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow strum',
      params: { hardness: 0.25, volume: 6 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Tide' },
      { deviceId: 'ambient-comp', preset: 'Level', params: { ratio: 1, makeup: 15 } },
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { scatter: 0, mix: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-brass-four-track-guitar',
    name: 'Four-track guitar',
    category: 'plucked',
    description:
      'A swelled guitar line through a dark amp spring onto worn cassette, hiss and wobble left in, in a long room.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { tone: 2000, swell: 1.4, warmth: 0.8 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.3 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { output: 3 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },

  // Tape orchestra
  {
    id: 'slow-brass-slowed-horn-reel',
    name: 'Slowed horn reel',
    category: 'wind',
    description:
      'Horns on tape slowed to half speed, an octave down, each chord three seconds in arriving, in a cathedral.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: {
        age: 0.4,
        hiss: 0.2,
        tone: -0.2,
        attack: 3,
        release: 6,
        vibrato: 0.1,
        volume: -13.5,
      },
    },
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 8, mix: 0.55 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-brass-low-cello-reel',
    name: 'Low cello reel',
    category: 'string',
    description:
      'Cellos on half-speed tape holding a low fifth, the top taken off, in a space sixteen seconds long.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { tone: -0.2, attack: 2.5, release: 5, vibrato: 0.15, volume: -6.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 16, mix: 0.4 } },
    ],
    preview: 'low',
  },
  {
    id: 'slow-brass-string-reel-rising',
    name: 'String reel rising',
    category: 'string',
    description:
      'A small violin section on worn tape, slow to arrive, through a reverb that swells late and a long plate.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { age: 0.5, tone: -0.3, attack: 3.5, release: 6, vibrato: 0.2 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'slow-brass-reed-reel-blurred',
    name: 'Reed reel, blurred',
    category: 'wind',
    description:
      'Orchestral reeds on half-speed tape, their wobble and joins smeared by a spectral blur, in a very long hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: {
        age: 0.4,
        tone: -0.2,
        speed: 1,
        attack: 2.5,
        release: 5,
        vibrato: 0.1,
        volume: -11.5,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.7, mix: 0.55 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 16, mix: 0.5 } },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-brass-worn-distant-choir',
    name: 'Worn distant choir',
    category: 'voice',
    description:
      'A choir on worn tape, dulled, three seconds in arriving and wobbling as it goes, in a long stone room.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { tone: -0.5, attack: 3, release: 6, vibrato: 0.3, volume: -18 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.45 } }],
  },
  {
    id: 'slow-brass-short-flute-reel',
    name: 'Short flute reel',
    category: 'wind',
    description:
      'A ruined flute tape at half speed with a short strip under each key, a sustainer keeping a quiet copy as it runs out.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Lost reel',
      params: { hiss: 0.5, length: 2.2, attack: 2, release: 5, volume: -7.5 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.6 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 10, mix: 0.4 } },
    ],
    preview: 'hold',
  },

  // Reed organ
  {
    id: 'slow-brass-far-end-pipes',
    name: 'Far end pipes',
    category: 'organ',
    description:
      'Organ pipes four seconds in speaking, dulled and doubled a few cents apart, in a space eighteen seconds long.',
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { attack: 4, release: 9, tone: 1000, volume: -13 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 18, mix: 0.5 } },
    ],
  },
  {
    id: 'slow-brass-two-ranks-beating',
    name: 'Two ranks beating',
    category: 'drone',
    description:
      'Two low ranks tuned apart so they beat, through a rotating speaker across the room, in a cathedral.',
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { celeste: 1, attack: 3, release: 7, tone: 1400, volume: -13.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room', params: { mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'slow-brass-harmonium-dark-well',
    name: 'Harmonium, dark well',
    category: 'organ',
    description:
      'A harmonium on an uneven bellows, slow to speak, at the bottom of a dark well of short echoes.',
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: { reed: 0.4, bellows: 0.6, attack: 3.5, release: 5, tone: 2200, volume: -14 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'slow-brass-flutes-far-strings',
    name: 'Flutes, far strings',
    category: 'organ',
    description:
      'Stopped flutes three seconds in speaking, with a string pad swelling in behind them, in a long plate.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { breath: 0.4, attack: 3, release: 6, tone: 3000 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Slow swell', params: { mix: 0.45 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'slow-brass-pump-organ-reel',
    name: 'Pump organ reel',
    category: 'organ',
    description:
      'A reedy pump organ breathing on its bellows, slow to speak, on a worn reel of tape in a long stone room.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { celeste: 0.4, bellows: 0.9, attack: 2.5, release: 5, volume: -19 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.35, wear: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'slow-brass-organ-standing-still',
    name: 'Organ standing still',
    category: 'drone',
    description:
      'Sub and unison ranks with a trace of octave, five seconds in speaking, held by a spectral blur as one unmoving low tone.',
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: {
        sub: 0.5,
        octave: 0.2,
        twelfth: 0,
        fifteenth: 0,
        reed: 0,
        celeste: 0.2,
        attack: 5,
        release: 10,
        tone: 1000,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Endless', params: { width: 0.6, mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { lowDecay: 6, midDecay: 5, mix: 0.4 } },
    ],
    preview: 'low',
  },

  // Aurora
  {
    id: 'slow-brass-four-second-brass',
    name: 'Four-second brass',
    category: 'pad',
    description:
      'A dark synthesiser brass chord that takes four seconds to open and keeps swelling while held, in a cathedral.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow bloom',
      params: { brilliance: 600, contour: 0.5, attack: 4, release: 10, volume: -6.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'slow-brass-synth-horns-asleep',
    name: 'Synth horns asleep',
    category: 'pad',
    description:
      'Soft synthesiser horns with the bass thinned, drifting on a slow chorus, in a space whose tail swells late.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { brilliance: 700, attack: 3, release: 8, detune: 10, volume: -10.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.4 } },
    ],
  },

  // Choir
  {
    id: 'slow-brass-low-wordless-voices',
    name: 'Low wordless voices',
    category: 'voice',
    description:
      'Low men on a closed vowel with no vibrato, three seconds in arriving and eight in leaving a stone room.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { breath: 0.2, ensemble: 0.7, attack: 3.5, release: 8, volume: -17 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.4 } }],
  },
  {
    id: 'slow-brass-far-small-voices',
    name: 'Far small voices',
    category: 'voice',
    description:
      "A children's choir on ooh with no vibrato and the top rolled off, blurred and far back in a cathedral.",
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { breath: 0.3, vibrato: 0, attack: 2.5, release: 6, tone: 3000, volume: -13.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.5, mix: 0.5 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 8, mix: 0.55 },
      },
    ],
  },

  // Drone
  {
    id: 'slow-brass-one-major-chord',
    name: 'One major chord',
    category: 'drone',
    description:
      'A just major chord of wandering partials over a sub octave, four seconds in arriving, in a cathedral.',
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: { sub: 0.3, air: 0.15, cutoff: 2200, attack: 4, release: 12 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'slow-brass-open-fifths-worn',
    name: 'Open fifths, worn',
    category: 'drone',
    description:
      'Low open fifths with the filter at 800 Hz, slowly wandering, on worn tape in a very large space.',
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: { movement: 0.7, sub: 0.5, cutoff: 800, attack: 5, release: 12 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4, age: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },

  // Dusk
  {
    id: 'slow-brass-late-filter',
    name: 'Late filter',
    category: 'pad',
    description:
      'A chorus polysynth chord that starts shut and takes four seconds to open, then closes in a long plate.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Slow bloom',
      params: { cutoff: 250, envelope: 0.7, attack: 4, release: 10, volume: -11 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } }],
  },
  {
    id: 'slow-brass-pad-octave-under',
    name: 'Pad, octave under',
    category: 'pad',
    description:
      'A soft chorus pad with the filter at 900 Hz and its own half-speed copy an octave beneath, in a hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { sub: 0.5, cutoff: 900, attack: 3.5, release: 8, chorus: 2, volume: -11 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 14, mix: 0.45 } },
    ],
  },

  // Ember
  {
    id: 'slow-brass-lights-off-pad',
    name: 'Lights off pad',
    category: 'pad',
    description:
      'Two detuned saws behind a filter at 800 Hz that takes four seconds to open, on tape in a cathedral.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: { cutoff: 800, filterAttack: 4, ampAttack: 3.5, ampRelease: 9, volume: -9 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.3 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 8, mix: 0.5 },
      },
    ],
  },
  {
    id: 'slow-brass-warm-tape-sub',
    name: 'Warm tape sub',
    category: 'drone',
    description:
      'A saw and a pulse an octave apart under a nearly shut filter, pushed into a tape preamp, in a huge space.',
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: { cutoff: 320, ampAttack: 4, ampRelease: 10, volume: -19 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },

  // Acoustic guitar
  {
    id: 'slow-brass-nylon-no-fingers',
    name: 'Nylon, no fingers',
    category: 'plucked',
    description:
      'Nylon strings with every pluck faded out by a swell, so only the ring of the body arrives, in a very long hall.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { nail: 0, sustain: 12, release: 10, tone: 0.4, volume: 6 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 1600, curve: 1 } },
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: 6 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 20, size: 1.5, breathDepth: 0, mix: 0.6 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-brass-twelve-strings-late',
    name: 'Twelve strings, late',
    category: 'plucked',
    description:
      'A twelve-string chord caught by a sustainer and given back three seconds late as a still pad, on tape.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { nail: 0.3, sustain: 10, release: 8, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Slow strings',
        params: { attack: 3, decay: 20, tone: -0.6, mix: 1 },
      },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },

  // Atmosphere
  {
    id: 'slow-brass-empty-hall-hum',
    name: 'Empty hall hum',
    category: 'texture',
    description:
      'Mains hum tuned to the key, four seconds in rising, with nothing else in a cathedral but its own tail.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: { tone: 0.3, resonance: 0.3, size: 0.5, attack: 4, release: 8, volume: -6.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } }],
  },
  {
    id: 'slow-brass-hall-roof-rain',
    name: 'Hall roof rain',
    category: 'texture',
    description:
      'Heavy rain heard from inside, four seconds in fading up, with the top taken off and a hall around it.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Distant downpour',
      params: { tone: 0.3, attack: 4, release: 10, width: 0.7, volume: 4.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 4000 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, mix: 0.35 } },
    ],
  },

  // Chord harp
  {
    id: 'slow-brass-strum-plate-pad',
    name: 'Strum plate pad',
    category: 'plucked',
    description:
      'An electronic chord harp with its pad layer full up and its plucks faded out by a swell, in a plain twenty-second hall.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Pad and sparkle',
      params: { strum: 30, sustain: 6, tone: 0.25, pad: 1, volume: -23.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 1500, release: 400, retrigger: 1 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 20, width: 0.8, mix: 0.5 } },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-brass-sweep-heard-backwards',
    name: 'Sweep heard backwards',
    category: 'plucked',
    description:
      'A slow sweep of plucked strings heard only backwards, each swelling up to where its pluck was, in a long plate.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { sustain: 4, tone: 0.3, volume: -4.3 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Slow swells',
        params: { time: 1100, feedback: 0.2, mix: 1 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.45 } },
    ],
    preview: 'chord',
  },

  // Felt piano
  {
    id: 'slow-brass-piano-down-the-hall',
    name: 'Piano down the hall',
    category: 'keys',
    description:
      'A fully felted piano, each hammer softened by a quarter-second fade, at the far end of a hall with no top.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: {
        felt: 1,
        hardness: 0.1,
        thump: 0.2,
        action: 0.1,
        pedalNoise: 0.1,
        grit: 0,
        reverbMix: 0.5,
        reverbSize: 1,
        outputDb: -13,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 250, depth: 0.85, curve: 0.2 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 14, highCut: 3500, mix: 0.5 } },
    ],
  },
  {
    id: 'slow-brass-piano-into-string-pad',
    name: 'Piano into string pad',
    category: 'keys',
    description:
      'Felted piano chords with the hammers faded out by a swell and a string pad growing where each note was.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        hardness: 0.2,
        thump: 0.1,
        action: 0.1,
        resonance: 0.8,
        reverbMix: 0,
        outputDb: -5.5,
      },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Slow swell',
        params: { rise: 1.5, fall: 12, sensitivity: 0.7, mix: 0.6 },
      },
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 1500, curve: 1 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { decay: 0.93, mix: 0.45 } },
    ],
    preview: 'chord',
  },

  // Flute
  {
    id: 'slow-brass-low-flutes-held',
    name: 'Low flutes, held',
    category: 'wind',
    description:
      'Low flutes with no chiff and barely any vibrato, slow to speak, doubled a few cents apart, in a cathedral.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { chiff: 0, attack: 2.5, release: 6, vibrato: 0.1, scoop: 0, volume: -17 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 8, mix: 0.55 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-brass-breath-before-the-note',
    name: 'Breath before the note',
    category: 'wind',
    description:
      'A low flute that is nearly all breath, three seconds in arriving, with a dark string pad in its shadow.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { attack: 3, release: 6, vibrato: 0, volume: -10 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Lingering', params: { mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
    preview: 'hold',
  },

  // Glass
  {
    id: 'slow-brass-glass-pad-slow',
    name: 'Glass pad, slow',
    category: 'pad',
    description:
      'Four operators as a dim glass pad, beating slowly between detuned pairs, on tape in a cathedral.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { brightness: 0.2, attack: 3.5, release: 8, detune: 12, spread: 0.4, volume: -19.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'slow-brass-bowl-no-strike',
    name: 'Bowl, no strike',
    category: 'bell',
    description:
      'A low metal bowl whose strike is replaced by a three-second fade in, its top blurred away, in a long hall.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Temple bowl',
      params: { brightness: 0.3, decay: 14, attack: 3, release: 10, volume: -20 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { width: 0.6, mix: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 12, mix: 0.45 } },
    ],
    preview: 'chord',
  },

  // Grain
  {
    id: 'slow-brass-any-sound-held',
    name: 'Any sound held',
    category: 'pad',
    description:
      'Whatever is loaded, frozen at one moment as a dark cloud of long grains that fades in, in a cathedral.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: {
        size: 600,
        density: 10,
        attack: 3.5,
        release: 8,
        spread: 0.6,
        tone: 1800,
        volume: -19.5,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { lowDecay: 8, mix: 0.5 } }],
  },
  {
    id: 'slow-brass-any-sound-reversed',
    name: 'Any sound reversed',
    category: 'pad',
    description:
      'Whatever is loaded, played as long backward grains with the top taken off, on tape in a huge space.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Backwards wash',
      params: { attack: 3, release: 8, tone: 1800, volume: -19 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },

  // Handpan
  {
    id: 'slow-brass-steel-without-hands',
    name: 'Steel without hands',
    category: 'bell',
    description:
      'A hand-played steel pan with the strike taken away: a sustainer gives each note back late as a still tone.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Halo',
      params: { decay: 10, touch: 0.1, volume: -2.3 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Slow strings',
        params: { attack: 2.5, decay: 15, motion: 0.15, ensemble: 0.3, mix: 1 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'slow-brass-tongue-drum-slowed',
    name: 'Tongue drum, slowed',
    category: 'bell',
    description:
      'A tongue drum with its strike faded out, replayed at half speed an octave down, in a long plate.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 10, touch: 0.05, volume: 0 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad' },
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { mix: 0.8 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } },
    ],
  },

  // Harp
  {
    id: 'slow-brass-harp-strings-only',
    name: 'Harp, strings only',
    category: 'plucked',
    description:
      'A harp chord with the fingers faded out by a swell, so only the long ring of the strings arrives, in a plain hall.',
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { touch: 0.05, decay: 4, volume: -2 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 1500, curve: 1 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 14, mix: 0.5 } },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-brass-harp-under-a-pad',
    name: 'Harp under a pad',
    category: 'plucked',
    description:
      'A harp heard only as the string pad that follows a second behind each chord, with no pluck left, in a cathedral.',
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { touch: 0.2, decay: 2.5, halo: 0.8, volume: 1 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Slow swell',
        params: { rise: 1.2, fall: 14, sensitivity: 0.75, brightness: 2200, width: 0.5, mix: 0.9 },
      },
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 800 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.5 } },
    ],
    preview: 'chord',
  },

  // Ladder bass
  {
    id: 'slow-brass-faded-pedal-tone',
    name: 'Faded pedal tone',
    category: 'drone',
    description:
      'Two beating oscillators and a sub behind a filter at 260 Hz, faded in by a slow swell, in a cathedral.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Pedal drone',
      params: { beat: 10, sub: 0.7, cutoff: 260, glide: 0.3, volume: -14.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Tide' },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 8, mix: 0.5 },
      },
    ],
  },
  {
    id: 'slow-brass-hall-floor-sub',
    name: 'Hall floor sub',
    category: 'keys',
    description:
      'A soft sub tone with no edge, two seconds in fading up, rounded by tape, under a cathedral.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Soft sub',
      params: { wave: 0.8, cutoff: 220, drive: 0.1, volume: -15 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 2000, mix: 1 } },
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.2, bump: 0.7, output: -5 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { lowDecay: 8, mix: 0.45 } },
    ],
    preview: 'low',
  },

  // Mallets
  {
    id: 'slow-brass-rolled-vibes-blurred',
    name: 'Rolled vibes, blurred',
    category: 'bell',
    description:
      'A soft vibraphone roll with its start faded out and its strokes blurred into each other, in a cathedral.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { mallet: 0, motor: 0.2, roll: 12, damper: 0, volume: -20.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Tide' },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.6, mix: 0.6 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 8, mix: 0.55 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-brass-marimba-bar-rolled',
    name: 'Marimba bar, rolled',
    category: 'bell',
    description:
      'One marimba bar rolled with soft mallets, its start faded out by a swell, an octave shadow under it, in a long plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { mallet: 0.1, decay: 2, roll: 14, volume: -6.5 },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'Piano to pad',
        params: { attack: 1500, curve: 1, retrigger: 1 },
      },
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } },
    ],
    preview: 'hold',
  },

  // Bells
  {
    id: 'slow-brass-rubbed-bowl-rising',
    name: 'Rubbed bowl, rising',
    category: 'bell',
    description:
      'A singing bowl rubbed rather than struck, slowly faded up, ringing on in a space twenty seconds long.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { decay: 30, hardness: 0.05, brightness: 0.3, release: 0.8, volume: -10.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Tide' },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 20, mix: 0.4 } },
    ],
    preview: 'hold',
  },
  {
    id: 'slow-brass-far-glass-rims',
    name: 'Far glass rims',
    category: 'bell',
    description:
      'Wine glass rims rubbed into a chord, the first touch faded out, in a hall whose tail sings a vowel.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { hardness: 0.05, sustain: 1, brightness: 0.3, release: 0.9, volume: -14 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { curve: 0.8, retrigger: 1 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { mix: 0.5 } },
    ],
    preview: 'chord',
  },

  // Outdoors
  {
    id: 'slow-brass-thunder-far-hills',
    name: 'Thunder, far hills',
    category: 'texture',
    description:
      'Thunder a long way off with its top taken away, rolling slowly into a hall: weather behind the music.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { distance: 0.9, tone: 0.8, attack: 3, release: 12, volume: -4.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slow-brass-crickets-screen-door',
    name: 'Crickets, screen door',
    category: 'texture',
    description:
      'A far field of crickets fading up over four seconds, thin and high, on worn cassette: the night outside.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Evening field',
      params: { distance: 1, tone: 0, attack: 4, release: 10, volume: 4.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { tone: 0.15, output: 6.7 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },

  // Pedal steel
  {
    id: 'slow-brass-still-bar-steel',
    name: 'Still bar steel',
    category: 'plucked',
    description:
      'A steel guitar chord swelled in over two seconds by its pedal, no vibrato, no pick, in a huge space.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 2, tone: 1800, volume: -14.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 20, mix: 0.45 } },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-brass-slow-slide-looped',
    name: 'Slow slide, looped',
    category: 'plucked',
    description:
      'A steel guitar line swelled in by its pedal, sliding between notes over a half-speed loop of itself, in a plate.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { swell: 1.6, vibrato: 2, tone: 2400, volume: -0.5 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } },
    ],
    preview: 'line',
  },

  // Sampler
  {
    id: 'slow-brass-any-sample-far',
    name: 'Any sample, far',
    category: 'pad',
    description:
      'Whatever is loaded, an octave down and dulled, looped with a slow fade in and tape wobble, in a cathedral.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: { attack: 3, release: 8, tone: 2500, wobble: 0.4, volume: -18 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.5 } }],
  },
  {
    id: 'slow-brass-any-sample-both-ways',
    name: 'Any sample, both ways',
    category: 'pad',
    description:
      'Whatever is loaded, looped forwards then backwards an octave down, blurred until the turns are gone.',
    instrument: {
      deviceId: 'sampler',
      preset: 'There and back',
      params: { attack: 4, release: 9, tone: 2000, volume: -18.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { width: 0.7, mix: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 10, mix: 0.4 } },
    ],
  },

  // String machine
  {
    id: 'slow-brass-ensemble-slow-fade',
    name: 'Ensemble, slow fade',
    category: 'string',
    description:
      'A seventies string ensemble with the top closed down, four seconds in arriving and nine in leaving a long plate.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 4.5, release: 9, high: 0.1, tone: 1300, volume: -6.5 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } }],
  },
  {
    id: 'slow-brass-ensemble-cellos-low',
    name: 'Ensemble cellos, low',
    category: 'string',
    description:
      'The low octave of a string ensemble on a fifth, dull and slow, on worn tape in a very large space.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 3, release: 7, tone: 900, volume: -2.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
    preview: 'low',
  },

  // Tanpura
  {
    id: 'slow-brass-unplucked-drone-lute',
    name: 'Unplucked drone lute',
    category: 'drone',
    description:
      'Four plain strings plucked round slowly, heard as the still tone a sustainer makes of them, in a cathedral.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: { speed: 10, volume: -4.5 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Endless drone',
        params: { sensitivity: 0.6, attack: 3, decay: 30, mix: 1 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'slow-brass-buzzing-strings-sunk',
    name: 'Buzzing strings, sunk',
    category: 'drone',
    description:
      'A slow wall of buzzing drone strings, each pluck faded out by a swell and the top blurred away, in a huge space.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wall',
      params: { jawari: 0.6, volume: -10.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 1500, retrigger: 0 } },
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { width: 0.3, mix: 0.9 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
  },

  // Thesis
  {
    id: 'slow-brass-tuned-air-major',
    name: 'Tuned air, major',
    category: 'pad',
    description:
      'Noise through narrow bands tuned to a major scale, breathing slowly, four seconds in arriving, in a cathedral.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { center: 60, resonance: 60, attack: 4, release: 8, breatheRate: 0.1 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: 3 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'slow-brass-low-noise-bands',
    name: 'Low noise bands',
    category: 'drone',
    description:
      'Wide bands of noise around a low fifth, drifting, more wind than pitch, on tape in a very large space.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { resonance: 30, attack: 3.5, release: 8, scale: 6, root: 5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },

  // Tine piano
  {
    id: 'slow-brass-tines-no-hammers',
    name: 'Tines, no hammers',
    category: 'keys',
    description:
      'A dark tine piano chord with the hammer faded out by a swell, drifting on a slow chorus, in a long plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { decay: 3, release: 2, volume: -13 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 1500, curve: 1 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-brass-tines-breathing',
    name: 'Tines, breathing',
    category: 'keys',
    description:
      'A soft tine chord given back by a sustainer as a dark held pad that rises and falls slowly, like breathing.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { bell: 0.3, hardness: 0.3, tremolo: 0, tone: 0.3, volume: -16 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 2.5, mix: 1 } },
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.2, depth: 0.5, shape: 0 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
    preview: 'chord',
  },

  // Wavetable
  {
    id: 'slow-brass-sine-and-octave',
    name: 'Sine and octave',
    category: 'pad',
    description:
      'Near sines over a sub octave with nothing moving, four seconds in arriving, on noisy tape in a cathedral.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { cutoff: 900, attack: 4, release: 9, volume: -17 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'slow-brass-hollow-wave-drifting',
    name: 'Hollow wave, drifting',
    category: 'pad',
    description:
      'A hollow wavetable chord moving slowly through its table behind a filter at 1 kHz, in a space that swells late.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { rate: 0.04, cutoff: 1000, attack: 5, release: 12 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.4 } }],
  },

  // West Coast
  {
    id: 'slow-brass-folded-tone-held',
    name: 'Folded tone, held',
    category: 'drone',
    description:
      'A sine folded gently over on itself on a low fifth, three seconds in arriving, doubled wide, in a cathedral.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folding drone',
      params: { fold: 0.35, attack: 3.5, colour: 0.3, drift: 0.6 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic' },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 8, mix: 0.5 },
      },
    ],
  },
  {
    id: 'slow-brass-fold-opening-slowly',
    name: 'Fold opening slowly',
    category: 'pad',
    description:
      'A wavefolded chord whose timbre opens over four seconds through a darkened gate, on tape in a long plate.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Slow bloom',
      params: { attack: 4, decay: 6, colour: 0.4, volume: -13.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } },
    ],
  },

  // Zither
  {
    id: 'slow-brass-dulcimer-roll-far',
    name: 'Dulcimer roll, far',
    category: 'plucked',
    description:
      'A hammered dulcimer rolled softly in octaves with its start faded out: only the shimmer reaches the cathedral.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { roll: 12, release: 8, brightness: 0.35, volume: -14 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Tide' },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 8, mix: 0.55 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'slow-brass-open-strings-smeared',
    name: 'Open strings, smeared',
    category: 'plucked',
    description:
      'Doubled courses of open strings with the pick faded out and the ring held as a wash by a spectral blur.',
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { decay: 16, brightness: 0.4, volume: -1.5 },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'Piano to pad',
        params: { attack: 1500, curve: 1, retrigger: 1 },
      },
      {
        deviceId: 'spectral-blur',
        preset: 'Endless',
        params: { highCut: 6000, width: 0.45, mix: 0.7 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 10, mix: 0.4 } },
    ],
    preview: 'chord',
  },
]
