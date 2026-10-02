import { type FactoryPreset } from '../types'

// Indiana Reel Room: sections of strings, brass and reeds recorded once and copied from reel to
// reel until they blur, low-passed hard, with the hiss left in and a sub tone under the floor.

export const PRESETS: readonly FactoryPreset[] = [
  // Tape orchestra: the sections themselves, already on worn tape.
  {
    id: 'reel-room-first-copy-strings',
    name: 'First copy strings',
    category: 'string',
    description:
      'Violins on tape that swell in slowly, copied to a slow reel, low-passed and left in a stone nave.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: {
        attack: 2.4,
        release: 5,
        tone: -0.6,
        age: 0.45,
        hiss: 0.3,
        vibrato: 0.25,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, wow: 0.35, hiss: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Dark', params: { highCut: 2200, air: -8 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'reel-room-slack-reel-cellos',
    name: 'Slack reel cellos',
    category: 'string',
    description:
      'Cellos at half speed, an octave under the keys, pushed into a tape preamp and looped on thirteen seconds of tape.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { attack: 1.8, release: 4.5, tone: -0.3, age: 0.55, vibrato: 0.2, volume: -13.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { highCut: 3000 } },
      { deviceId: 'tape-loop', preset: 'Long horizon', params: { wear: 0.6, mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 2500, mix: 0.35 } },
    ],
  },
  {
    id: 'reel-room-third-copy-horns',
    name: 'Third copy horns',
    category: 'wind',
    description:
      'Half-speed horns bounced from cassette to reel, each pass duller, behind a steep filter at 900 Hz.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: {
        attack: 1.5,
        release: 4,
        tone: -0.2,
        age: 0.7,
        hiss: 0.4,
        players: 0.9,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.35 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, age: 0.4 } },
      {
        deviceId: 'auto-filter',
        preset: 'Low-Pass Gate',
        params: { cutoffHz: 900, resonance: 0.7 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 9, damping: 0.6, mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'reel-room-reeds-under-hiss',
    name: 'Reeds under hiss',
    category: 'wind',
    description:
      'A reed section at half speed with a recorder whose hiss rises in every gap, into a long dark plate.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { speed: 1, attack: 1.2, release: 3.5, tone: -0.4, age: 0.5, players: 0.8 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Breathing recorder', params: { level: -34 } },
      { deviceId: 'ambient-eq', preset: 'Dark', params: { highCut: 3000 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.7, mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'reel-room-worn-spool-choir',
    name: 'Worn spool choir',
    category: 'voice',
    description:
      'A worn choir tape at half speed, its vowels smeared into one dark sheet inside a hall that hums along.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { speed: 1, attack: 2, release: 5, tone: -0.6, age: 0.7, hiss: 0.35, volume: -13.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.5 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'reel-room-leader-tape',
    name: 'Leader tape',
    category: 'texture',
    description:
      'One ruined flute note at half speed that runs out after six seconds, caught by a slowed loop in a long dark tail.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Lost reel',
      params: { attack: 0.8, release: 3, tone: -0.35, hiss: 0.6 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down', params: { length: 5, mix: 0.45 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'reel-room-strings-over-sub',
    name: 'Strings over sub',
    category: 'string',
    description:
      'Tape strings with their own slowed copy two octaves below them: a section and the sub under it on one reel.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: {
        attack: 1.6,
        release: 4,
        tone: -0.5,
        players: 1,
        vibrato: 0.3,
        spread: 0.7,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Two octaves under', params: { mix: 0.5, highCut: 1200 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.45, bump: 0.8, hiss: 0.2 } },
      {
        deviceId: 'zita-rev1',
        preset: 'Hall',
        params: { lowDecay: 5, midDecay: 3.5, damping: 3000, mix: 0.4 },
      },
    ],
  },
  {
    id: 'reel-room-tails-out',
    name: 'Tails out',
    category: 'string',
    description:
      'Cellos on tape fed to a six-second loop that plays backwards, so each chord returns as a swell with no start.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: {
        speed: 0,
        attack: 1.2,
        release: 3,
        tone: -0.5,
        age: 0.4,
        hiss: 0.25,
        volume: -11,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Backwards layers',
        params: { wear: 0.5, spread: 0.3, mix: 0.6 },
      },
      { deviceId: 'ambient-eq', preset: 'Dark', params: { highCut: 2000 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { damping: 0.6, mix: 0.25 } },
    ],
  },

  // Horns: brass choirs with slow lungs.
  {
    id: 'reel-room-low-brass-ballast',
    name: 'Low brass ballast',
    category: 'wind',
    description:
      'Trombones and tuba blown softly and slow to fill, on a slow reel at the far end of a cathedral.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { blow: 0.3, attack: 4, release: 7, volume: -7.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, bump: 0.7 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2500, mix: 0.5 } },
    ],
    preview: 'low',
  },
  {
    id: 'reel-room-four-track-chorale',
    name: 'Four-track chorale',
    category: 'wind',
    description:
      'A soft horn section recorded to cassette with its hiss, low-passed at 1.8 kHz and set in a very large room.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.4, section: 0.85, attack: 3.5, release: 6, volume: -10 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Dark', params: { highCut: 1800 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 14, highCut: 3000, mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'reel-room-flugelhorn-two-decks',
    name: 'Flugelhorn, two decks',
    category: 'wind',
    description:
      'A single flugelhorn without vibrato, played into tape strung between two machines so each phrase lies over the last.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { blow: 0.3, breath: 0.4, attack: 0.9, release: 2.5, vibrato: 0, volume: -2 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { feedback: 0.85, wear: 0.5, mix: 0.45 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.6, mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'reel-room-brass-next-door',
    name: 'Brass next door',
    category: 'wind',
    description:
      'A flugelhorn section heard through a wall: everything above 700 Hz gone, the rumble of the room left in.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { blow: 0.4, breath: 0.2, section: 1, attack: 2.5, release: 5, vibrato: 0 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-Pass Gate',
        params: { cutoffHz: 700, resonance: 0.6 },
      },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -44 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, damping: 0.7, mix: 0.45 } },
    ],
    preview: 'chord',
  },
  {
    id: 'reel-room-slowed-section',
    name: 'Slowed section',
    category: 'wind',
    description:
      'A horn chord replayed at half speed as it is played, an octave down and twice as slow, on a reel in a hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.5, section: 0.7, attack: 2, release: 5, volume: -10 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { highCut: 4000 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4, hiss: 0.3 } },
      {
        deviceId: 'zita-rev1',
        preset: 'Hall',
        params: { lowDecay: 6, midDecay: 4, damping: 3000, mix: 0.4 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'reel-room-fifths-in-fog',
    name: 'Fifths in fog',
    category: 'wind',
    description:
      'Horns shadowed a fifth above, held until the spectrum smears and the two lines cannot be told apart.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.45, harmony: 0.5, attack: 3, release: 6, volume: -4 },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { highCut: 2500, width: 0.25, mix: 0.6 },
      },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { damping: 0.6, mix: 0.2 } },
    ],
  },
  {
    id: 'reel-room-under-the-risers',
    name: 'Under the risers',
    category: 'drone',
    description:
      'A soft tuba fifth with the octave below added and printed hot to tape: a brass drone felt more than heard.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { blow: 0.2, section: 0.3, attack: 1.8, release: 5, volume: -7 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { filter: 500 } },
      { deviceId: 'tape', preset: 'Hot glue', params: { hiss: 0.15, output: -4 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 2.5, mix: 0.25 } },
    ],
  },

  // Chamber strings: a small section, mostly muted, mostly without vibrato.
  {
    id: 'reel-room-muted-slow-reel',
    name: 'Muted, slow reel',
    category: 'string',
    description:
      'Six muted players to a note, over three seconds in arriving, on a tired reel far down a stone nave.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { players: 6, attack: 4, release: 6, scatter: 0.5, volume: -8 },
    },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Disintegrating loop',
        params: { wow: 0.4, age: 0.6, hiss: 0.35 },
      },
      { deviceId: 'ambient-eq', preset: 'Dark', params: { highCut: 2000 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'reel-room-back-desk-violas',
    name: 'Back desk violas',
    category: 'string',
    description:
      'Slow dark bows with a copy an octave below, the lower one louder, on tape in a very large space.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Slow dark bows',
      params: { attack: 2.2, release: 4, vibrato: 0, mute: 0.6, volume: -8 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad octave below', params: { tone: 2500, mix: 0.65 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 3000, mix: 0.4 } },
    ],
  },
  {
    id: 'reel-room-bow-hair',
    name: 'Bow hair',
    category: 'string',
    description:
      'Bows barely touching the string, more air than note, filtered at 1.2 kHz with hiss that rides the sound.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { attack: 2, release: 4, mute: 0.5, volume: -7 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-Pass Gate',
        params: { cutoffHz: 1200, resonance: 0.6 },
      },
      { deviceId: 'noise-floor', preset: 'Rides the sound', params: { level: -34, tone: -0.4 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.6, mix: 0.4 } },
    ],
  },
  {
    id: 'reel-room-three-bars-looped',
    name: 'Three bars, looped',
    category: 'string',
    description:
      'A short phrase for three muted players that goes round a thirteen-second tape loop, each pass more worn.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: { players: 3, attack: 1.4, release: 2.5, vibrato: 3, mute: 0.7, volume: 1 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Long horizon',
        params: { feedback: 0.8, wear: 0.7, mix: 0.5 },
      },
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { tone: 0.3, noise: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 7, damping: 0.6, mix: 0.35 } },
    ],
    preview: 'line',
  },
  {
    id: 'reel-room-strings-held-still',
    name: 'Strings held still',
    category: 'string',
    description:
      'Three players with no vibrato and almost no bow noise, caught and held as a dark bed long after the bows stop.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { attack: 2.6, release: 5, mute: 0.8 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { mix: 0.55 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      {
        deviceId: 'zita-rev1',
        preset: 'Hall',
        params: { lowDecay: 5, midDecay: 4, damping: 2500, mix: 0.4 },
      },
    ],
  },
  {
    id: 'reel-room-viola-through-plaster',
    name: 'Viola through plaster',
    category: 'string',
    description:
      'One muted player replayed through a muffled speaker, the microphone turned away, a worn tape echo trailing into a hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { attack: 0.9, release: 2, vibrato: 5, mute: 0.6, width: 0.3, volume: -1 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker', params: { speaker: 1 } },
      {
        deviceId: 'tape-echo',
        preset: 'Worn tape',
        params: { feedback: 0.4, highCut: 1600, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { damping: 0.6, mix: 0.35 } },
    ],
    preview: 'line',
  },
  {
    id: 'reel-room-strings-and-undertow',
    name: 'Strings and undertow',
    category: 'string',
    description:
      'A warm section with a half-speed bed of itself beneath, into a reverb whose tail sinks an octave each pass.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 2, release: 4, vibrato: 4, mute: 0.5, volume: -12 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed bed', params: { tone: 2500, mix: 0.3 } },
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { lowBump: 0.3, highCut: 3500 } },
      { deviceId: 'shimmer', preset: 'Undertow', params: { shimmer: 0.35, tone: 2000, mix: 0.35 } },
    ],
  },

  // Drone: the floor under everything else.
  {
    id: 'reel-room-floor-joists',
    name: 'Floor joists',
    category: 'drone',
    description:
      'Octaves with the sub full up and the filter at 180 Hz, through a transformer: a low fifth felt in the room.',
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: {
        partials: 0.25,
        wave: 0.2,
        sub: 1,
        cutoff: 180,
        attack: 4,
        release: 14,
        volume: -11.5,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'reel-room-county-line-dusk',
    name: 'County line dusk',
    category: 'drone',
    description:
      'A just minor chord of wandering partials closed to 500 Hz, on a hissing reel in a space with no far wall.',
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: { cutoff: 500, attack: 4, release: 24, volume: -8.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.4, wow: 0.3 } },
      {
        deviceId: 'expanse',
        preset: 'Event horizon',
        params: { decay: 30, highCut: 2500, mix: 0.4 },
      },
    ],
  },
  {
    id: 'reel-room-tone-under-hiss',
    name: 'Tone under hiss',
    category: 'drone',
    description:
      'A plain unison and its sub with steady tape hiss laid over it, breathing slowly in a damped hall.',
    instrument: {
      deviceId: 'drone',
      preset: 'Latched unison',
      params: {
        partials: 0.4,
        wave: 0.05,
        movement: 0.5,
        rate: 0.05,
        sub: 0.6,
        air: 0.25,
        cutoff: 400,
        release: 16,
        width: 0.7,
        hold: 0,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -38 } },
      { deviceId: 'ambient-eq', preset: 'Drone', params: { highCut: 5000 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { damping: 0.6, mix: 0.4 } },
    ],
  },
  {
    id: 'reel-room-fog-on-stubble',
    name: 'Fog on stubble',
    category: 'drone',
    description:
      'Open fifths that never sit still, smeared by a spectral blur and a reverb that drifts flat as it rings.',
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: { movement: 0.85, cutoff: 700, attack: 4, release: 30, volume: -16 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.5 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'reel-room-half-speed-reel',
    name: 'Half-speed reel',
    category: 'drone',
    description:
      'A harmonic series on a low fifth with its own half-speed copy an octave beneath, on a reel in a cathedral.',
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: {
        partials: 0.5,
        wave: 0.4,
        movement: 0.5,
        rate: 0.06,
        sub: 0.3,
        cutoff: 600,
        attack: 3.5,
        release: 16,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { highCut: 2000, mix: 0.7 } },
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { tone: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'reel-room-grain-elevator-hum',
    name: 'Grain elevator hum',
    category: 'drone',
    description:
      'A cluster of sines a tone or less apart, low enough to beat like machinery, behind a slowly moving steep filter.',
    instrument: {
      deviceId: 'drone',
      preset: 'Fog cluster',
      params: { sub: 0.4, air: 0.2, cutoff: 350, attack: 4, release: 20, width: 0.45, volume: -10 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-Pass Gate',
        params: { cutoffHz: 300, resonance: 0.9, lfoAmount: 20, lfoRateHz: 0.05 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.2 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.7, mix: 0.3 } },
    ],
  },

  // Clarinet: low reeds, chalumeau register, breath left in.
  {
    id: 'reel-room-long-room-reeds',
    name: 'Long room reeds',
    category: 'wind',
    description:
      'The bottom fifth of a bass clarinet, blown softly and slow to speak, on tape in a very large space.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { blow: 0.3, attack: 1.5, release: 3 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 16, highCut: 3000, mix: 0.4 } },
    ],
    preview: 'low',
  },
  {
    id: 'reel-room-reed-chorale',
    name: 'Reed chorale',
    category: 'wind',
    description:
      'A chord of clarinets that fades in from nothing, layered on a six-second tape loop in a cathedral.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { blow: 0.35, breath: 0.3, attack: 3.2, release: 4.5, volume: -10 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 6, feedback: 0.75, wear: 0.5, mix: 0.4 },
      },
      { deviceId: 'ambient-eq', preset: 'Dark', params: { highCut: 2500 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
    preview: 'chord',
  },
  {
    id: 'reel-room-clarinet-and-shadow',
    name: 'Clarinet and shadow',
    category: 'wind',
    description:
      'One warm clarinet line with a bed of itself at half speed beneath, on a cassette four-track in a hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { blow: 0.45, attack: 0.8, release: 1.5, volume: -4.5 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed bed', params: { tone: 3000, mix: 0.35 } },
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, damping: 0.6, mix: 0.4 } },
    ],
    preview: 'line',
  },
  {
    id: 'reel-room-chalumeau-slowed',
    name: 'Chalumeau, slowed',
    category: 'wind',
    description:
      'A hollow clarinet section played back at half speed, filtered at 600 Hz until only the wood is left.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { blow: 0.4, attack: 1.2, release: 3, volume: -13.5 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave' },
      {
        deviceId: 'auto-filter',
        preset: 'Low-Pass Gate',
        params: { cutoffHz: 600, resonance: 0.7 },
      },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { damping: 0.6, mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'reel-room-mostly-breath',
    name: 'Mostly breath',
    category: 'wind',
    description:
      'A reed blown so softly it is mostly air, with the microphone noise left in and a long dull plate behind.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { blow: 0.1, breath: 1, attack: 1.5, release: 3, vibrato: 0, volume: -5.5 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Close microphone', params: { level: -36 } },
      { deviceId: 'ambient-eq', preset: 'Dark', params: { highCut: 2500 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.7, mix: 0.4 } },
    ],
    preview: 'line',
  },
  {
    id: 'reel-room-half-remembered-reed',
    name: 'Half-remembered reed',
    category: 'wind',
    description:
      'A dark reed line on wobbling reel tape, with pieces of the last minute drifting back slowed or reversed.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { blow: 0.35, attack: 0.6, release: 1.5, vibrato: 0.2, volume: -4.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.45, tone: 0.3 } },
      { deviceId: 'echo-memory', preset: 'Half-remembered' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { damping: 3000, mix: 0.3 } },
    ],
    preview: 'line',
  },

  // Bow: single strings, bowed or held singing.
  {
    id: 'reel-room-open-cello-fifth',
    name: 'Open cello fifth',
    category: 'string',
    description:
      'A cello fifth bowed lightly with almost no vibrato on a slow reel, its level riding up and down as if by hand.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 2.5, release: 5, pressure: 0.35, vibrato: 0.05, volume: -11.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.12, depth: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    preview: 'low',
  },
  {
    id: 'reel-room-magnet-held-strings',
    name: 'Magnet-held strings',
    category: 'string',
    description:
      'Guitar strings held singing with no pick, swelling in slowly and drifting on a tape loop in a huge room.',
    instrument: {
      deviceId: 'bowed-string',
      params: { attack: 3, release: 6, brightness: 0.25, vibrato: 0.05, detune: 8, volume: -12 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.3 } },
      { deviceId: 'tape-loop', preset: 'Two decks', params: { wear: 0.5, mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 3000, mix: 0.4 } },
    ],
  },
  {
    id: 'reel-room-bowed-thin',
    name: 'Bowed thin',
    category: 'texture',
    description:
      'A single string under a light slow bow, filtered and smeared until it is a grey band rather than a note.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 3.5, release: 7, pressure: 0.2, vibrato: 0, volume: -10 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-Pass Gate',
        params: { cutoffHz: 1100, resonance: 0.7 },
      },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { highCut: 3000, mix: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 8, damping: 0.6, mix: 0.4 } },
    ],
  },
  {
    id: 'reel-room-contrabass-slack-tape',
    name: 'Contrabass, slack tape',
    category: 'string',
    description:
      'A heavily bowed low fifth with a quarter-speed copy two octaves down, driven into a tape preamp in a hall.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 1.5, release: 4, pressure: 0.7, body: 1, vibrato: 0.1, volume: -12 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Two octaves under', params: { mix: 0.45 } },
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -10.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { damping: 3000, mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'reel-room-swells-into-murk',
    name: 'Swells into murk',
    category: 'string',
    description:
      'Plucked strings with the pick faded out of every note, their dark repeats piling up in a long plate.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { attack: 1.6, release: 5, brightness: 0.35, volume: 6 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 700 } },
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { tone: 1600, mix: 0.45 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.6, mix: 0.35 } },
    ],
  },
  {
    id: 'reel-room-line-turned-back',
    name: 'Line turned back',
    category: 'string',
    description:
      'A hard-pressed string singing on its overtone, on cassette, answered by itself backwards an octave lower.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 1.8, release: 4, brightness: 0.3, vibrato: 0.15, volume: -5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { tone: 0.35 } },
      { deviceId: 'reverse-delay', preset: 'Undertow', params: { mix: 0.45 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 7, damping: 0.6, mix: 0.3 } },
    ],
    preview: 'line',
  },

  // Flute: low flutes and breath.
  {
    id: 'reel-room-alto-flutes-resting',
    name: 'Alto flutes, resting',
    category: 'wind',
    description:
      'A chord of low flutes with no tonguing and little vibrato, doubled by a slow chorus, on a slow reel in a hall.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { blow: 0.2, chiff: 0, attack: 2, release: 6, vibrato: 0.1, volume: -13.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.3 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, hiss: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 10, damping: 0.6, mix: 0.45 } },
    ],
    preview: 'chord',
  },
  {
    id: 'reel-room-headjoint-breath',
    name: 'Headjoint breath',
    category: 'wind',
    description:
      'Flutes that are nearly all breath, filtered at 900 Hz so the air turns to a low rush, with tape hiss over it.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { attack: 2.2, release: 5, vibrato: 0, volume: -17.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-Pass Gate',
        params: { cutoffHz: 900, resonance: 0.6 },
      },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -45 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 2500, mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'reel-room-wooden-flute-loop',
    name: 'Wooden flute loop',
    category: 'wind',
    description:
      'A soft wooden flute line played into tape between two machines, each pass back quieter and more worn.',
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: {
        blow: 0.3,
        chiff: 0.2,
        attack: 0.5,
        release: 2,
        vibrato: 0.2,
        scoop: 20,
        volume: -6.5,
      },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Two decks', params: { wear: 0.6, spread: 0.4, mix: 0.45 } },
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { tone: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 7, damping: 0.6, mix: 0.35 } },
    ],
    preview: 'line',
  },
  {
    id: 'reel-room-flutes-octave-under',
    name: 'Flutes, octave under',
    category: 'wind',
    description:
      'Soft concert flutes replayed at half speed as they are played, so the chord sits an octave below the keys.',
    instrument: {
      deviceId: 'flute',
      preset: 'Soft wind lead',
      params: { attack: 1.5, release: 4, vibrato: 0.15, scoop: 0, volume: -13 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Half speed',
        params: { length: 2000, smooth: 0.9, highCut: 3500 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.6, mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'reel-room-hollow-pipes-blurred',
    name: 'Hollow pipes, blurred',
    category: 'wind',
    description:
      'Pan pipes with the chiff taken off and a slow start, dissolved until they hang like an organ in a humming hall.',
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: {
        breath: 0.35,
        blow: 0.3,
        chiff: 0,
        attack: 2.5,
        release: 5,
        scoop: 0,
        volume: -13.5,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { highCut: 3000, mix: 0.6 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'reel-room-worn-echo-flute',
    name: 'Worn echo flute',
    category: 'wind',
    description:
      'A low flute line with some vibrato, its repeats on tired tape that flutters and loses its top, down a dark well.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { blow: 0.3, attack: 0.5, release: 2.5, vibrato: 0.35, scoop: 20, volume: -12 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { highCut: 1800, mix: 0.4 } },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.35 } },
    ],
    preview: 'line',
  },

  // Felt piano: hammers softened or faded out of the note.
  {
    id: 'reel-room-lid-down-piano',
    name: 'Lid down piano',
    category: 'keys',
    description:
      'A felted piano with the hammer faded out of each note, on a tired reel that drops out, in a stone nave.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { felt: 1, hardness: 0.3, thump: 0.3, action: 0.2, reverbMix: 0.2, outputDb: -15 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 250, depth: 0.8 } },
      { deviceId: 'tape', preset: 'Disintegrating loop', params: { wow: 0.45, age: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'reel-room-four-notes-slowed',
    name: 'Four notes, slowed',
    category: 'keys',
    description:
      'A felt piano phrase caught on a loop running at half speed, so it comes back an octave down and twice as long.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { hardness: 0.2, reverbMix: 0.15, outputDb: -13 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slowed down',
        params: { length: 6, feedback: 0.8, mix: 0.6 },
      },
      { deviceId: 'ambient-eq', preset: 'Dark', params: { highCut: 1800 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 3000, mix: 0.3 } },
    ],
  },

  // Acoustic guitar: a guest in the room, recorded badly on purpose.
  {
    id: 'reel-room-nylon-thumb-only',
    name: 'Nylon, thumb only',
    category: 'plucked',
    description:
      'A nylon guitar played with the thumb, each pluck faded in, in a reverb that swells after the note instead of dying.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { type: 1, tone: 0.25, sustain: 8, release: 5, volume: 6 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 350, depth: 0.9 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, output: 2 } },
      {
        deviceId: 'shaped-reverb',
        preset: 'Slow bloom',
        params: { time: 4, highCut: 2500, mix: 0.5 },
      },
    ],
  },
  {
    id: 'reel-room-dashboard-cassette',
    name: 'Dashboard cassette',
    category: 'plucked',
    description:
      'A steel-string left to ring, on a cassette that has been through a summer: warped, dull and hissing, in a hall.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { nail: 0.1, tone: 0.3, strum: 40, volume: -2 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Falling apart', params: { wobble: 0.6, noise: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Dark', params: { highCut: 1600 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, damping: 0.6, mix: 0.4 } },
    ],
  },

  // Atmosphere: what the room sounds like with nobody playing.
  {
    id: 'reel-room-machine-left-on',
    name: 'Machine left on',
    category: 'texture',
    description:
      'Mains hum from a recorder left running overnight, with its tape hiss over the top, in a small room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: { density: 0.5, tone: 0.2, attack: 2, release: 5, volume: -12 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -42 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'reel-room-flat-roof-rain',
    name: 'Flat roof rain',
    category: 'texture',
    description:
      'Steady rain heard from inside: a low rush with the drops filtered off at 1 kHz, recorded on a slow reel.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Distant downpour',
      params: { tone: 0.2, size: 0.9, width: 0.6, volume: 6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-Pass Gate',
        params: { cutoffHz: 1000, resonance: 0.6 },
      },
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { drive: 0.6, speed: 2, hiss: 0.2, output: 1.3 },
      },
    ],
  },

  // Aurora: synthetic brass with the filter almost shut.
  {
    id: 'reel-room-buried-brass-pad',
    name: 'Buried brass pad',
    category: 'pad',
    description:
      'A soft synthetic horn chord with its filter at 350 Hz that keeps swelling while held, on cassette in a huge room.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: {
        brilliance: 350,
        lowCut: 60,
        attack: 3,
        swell: 0.8,
        release: 7,
        detune: 10,
        volume: -13,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 2500, mix: 0.4 } },
    ],
  },
  {
    id: 'reel-room-low-bloom',
    name: 'Low bloom',
    category: 'drone',
    description:
      'A low fifth that starts shut and opens while it is held, pushed into a tape preamp at the back of a cathedral.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow bloom',
      params: { brilliance: 260, contour: 0.5, attack: 4.5, release: 10, volume: -12 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { drive: 0.45 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },

  // Choir: low voices, closed vowels.
  {
    id: 'reel-room-far-reel-basses',
    name: 'Far reel basses',
    category: 'voice',
    description:
      'Low voices on a closed vowel with no vibrato, slow to arrive, on a slow mono reel played back in a cathedral.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { vowel: 0.95, motion: 0.1, attack: 3, release: 7, tone: 1200, volume: -13 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, hiss: 0.3 } },
      { deviceId: 'stereo-widener', preset: 'Mono', params: { width: 0.1 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'reel-room-hummed-not-sung',
    name: 'Hummed, not sung',
    category: 'voice',
    description:
      'A small group humming with mouths nearly shut, on reel tape, in a hall that answers on the same vowel.',
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: {
        vowel: 1,
        voice: 1,
        motion: 0.1,
        breath: 0.1,
        ensemble: 0.8,
        vibrato: 0,
        attack: 2.5,
        release: 5,
        tone: 1800,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { tone: 0.35 } },
      {
        deviceId: 'vowel-reverb',
        preset: 'Oo behind',
        params: { decay: 10, highCut: 3000, mix: 0.4 },
      },
    ],
  },

  // Chord harp: the strum softened until it is a pad.
  {
    id: 'reel-room-strummed-harp-pad',
    name: 'Strummed harp pad',
    category: 'plucked',
    description:
      'A strummed chord harp with its pad full up and each stroke faded in, on tape in a long damped plate.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Pad and sparkle',
      params: { strum: 60, sustain: 6, tone: 0.15, pad: 1, volume: -20 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 600 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.7, mix: 0.4 } },
    ],
  },
  {
    id: 'reel-room-cascade-backwards',
    name: 'Cascade, backwards',
    category: 'plucked',
    description:
      'A slow four-octave strum heard mostly in reverse, each chunk swelling in and cutting off, down a dark well.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { sustain: 8, tone: 0.2, volume: -3 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { tone: 2000, mix: 0.8 } },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.4 } },
    ],
  },

  // Dusk: a chorus polysynth kept under the tape.
  {
    id: 'reel-room-polysynth-under-blankets',
    name: 'Polysynth under blankets',
    category: 'pad',
    description:
      'A chorus polysynth chord whose filter barely opens, over a heavy sub, on cassette in a long damped plate.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Slow bloom',
      params: { cutoff: 220, envelope: 0.5, sub: 0.8, attack: 4, release: 9, volume: -14 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.7, mix: 0.4 } },
    ],
  },
  {
    id: 'reel-room-square-and-sub',
    name: 'Square and sub',
    category: 'drone',
    description:
      'A square wave and its sub octave on a low fifth, both chorus lines on, through a transformer in a hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { cutoff: 300, resonance: 0.1, attack: 2.5, release: 6, chorus: 3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { damping: 0.6, mix: 0.3 } },
    ],
  },

  // Ember: two oscillators in the basement.
  {
    id: 'reel-room-basement-oscillators',
    name: 'Basement oscillators',
    category: 'drone',
    description:
      'A saw and a pulse an octave apart under a 400 Hz filter with a sub, an amplifier humming beside them.',
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: {
        oscMix: 0.3,
        cutoff: 400,
        subLevel: 0.3,
        noiseLevel: 0.06,
        ampAttack: 4,
        ampRelease: 10,
        volume: -7.5,
      },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { level: -44 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 2500, mix: 0.35 } },
    ],
  },
  {
    id: 'reel-room-saws-lid-shut',
    name: 'Saws, lid shut',
    category: 'pad',
    description:
      'Two detuned saws behind a filter at 450 Hz, slow to arrive, layered on an eight-second tape loop.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: { cutoff: 450, noiseLevel: 0.05, ampAttack: 3.5, ampRelease: 8 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade', params: { length: 8, wear: 0.5, mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.6, mix: 0.35 } },
    ],
  },

  // Glass: the metal taken out, sines left.
  {
    id: 'reel-room-sines-on-tape',
    name: 'Sines on tape',
    category: 'pad',
    description:
      'Near-pure tones that fade in slowly and beat against each other, on a reel with heavy wow, in a hall.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { ratio: 1, brightness: 0.08, attack: 3, release: 7, detune: 6, volume: -17 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.55, hiss: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 8, damping: 0.6, mix: 0.4 } },
    ],
  },
  {
    id: 'reel-room-strikeless-dull-bowl',
    name: 'Strikeless dull bowl',
    category: 'bell',
    description:
      'A dull metal bowl with its strike faded out, its ring smeared and darkened, in a long room.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Temple bowl',
      params: { brightness: 0.2, decay: 14, release: 10, volume: -12.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 500 } },
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { width: 0.3, mix: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { damping: 3000, mix: 0.35 } },
    ],
  },

  // Grain: for whatever reel is loaded.
  {
    id: 'reel-room-any-reel-frozen',
    name: 'Any reel, frozen',
    category: 'pad',
    description:
      'Whatever is loaded, held at one moment in long overlapping grains, dulled to 1 kHz, in a hall that sings back.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: {
        size: 900,
        density: 10,
        spray: 0.15,
        detune: 8,
        attack: 3,
        release: 7,
        tone: 1000,
        volume: -17.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.3 } },
      {
        deviceId: 'vowel-reverb',
        preset: 'Cathedral choir',
        params: { highCut: 3000, mix: 0.4 },
      },
    ],
  },
  {
    id: 'reel-room-any-reel-backwards',
    name: 'Any reel, backwards',
    category: 'pad',
    description:
      'Whatever is loaded, read backwards in grains over a second long and dulled to 800 Hz, under steady tape hiss.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Backwards wash',
      params: { size: 1600, octaves: 0, attack: 3.5, release: 8, tone: 800, volume: -17.5 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -45 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 2500, mix: 0.4 } },
    ],
  },

  // Guitar: swells only, the way a visiting guitarist would be recorded here.
  {
    id: 'reel-room-swell-guitar-loop',
    name: 'Swell guitar loop',
    category: 'plucked',
    description:
      'An electric guitar faded in with the volume pedal, pushed into a tape preamp and layered on a long loop in a nave.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { swell: 1.4, tone: 1700, sustain: 25 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { highCut: 2500, output: -6.5 } },
      { deviceId: 'tape-loop', preset: 'Long horizon', params: { wear: 0.5, mix: 0.45 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'reel-room-baritone-held-over',
    name: 'Baritone held over',
    category: 'plucked',
    description:
      'A dark baritone guitar strummed softly through a warm preamp, each chord caught and held as a slow drone in a hall.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark baritone',
      params: { pickup: 0.15, hardness: 0.3, tone: 1500, swell: 0.3, strum: 60, volume: 6 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { highCut: 3000, output: 0.5 } },
      { deviceId: 'sustainer', preset: 'Endless drone', params: { attack: 1.5, mix: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, damping: 0.6, mix: 0.35 } },
    ],
    preview: 'chord',
  },

  // Handpan: steel slowed and dulled until it is a low bell.
  {
    id: 'reel-room-handpan-twice-as-slow',
    name: 'Handpan, twice as slow',
    category: 'bell',
    description:
      'A handpan touched softly, its strike softened, replayed an octave down and twice as slow on a reel in a hall.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Low ding',
      params: { touch: 0.15, shimmer: 0.1, volume: -4 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick' },
      {
        deviceId: 'half-speed',
        preset: 'Half speed',
        params: { length: 1500, smooth: 0.8, spread: 0.4 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { damping: 3000, mix: 0.4 } },
    ],
  },
  {
    id: 'reel-room-tongue-drum-worn',
    name: 'Tongue drum, worn',
    category: 'bell',
    description:
      'A tongue drum on a four-second loop of tape worn through, filtered at 600 Hz: thumps and a dull ring going round.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { touch: 0.05, position: 0.1, shimmer: 0.1, volume: 1.5 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 4, lowCut: 60, mix: 0.5 } },
      {
        deviceId: 'auto-filter',
        preset: 'Low-Pass Gate',
        params: { cutoffHz: 600, resonance: 0.6 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.7, mix: 0.35 } },
    ],
  },

  // Harp: the pluck removed or sunk.
  {
    id: 'reel-room-harp-pluck-removed',
    name: 'Harp, pluck removed',
    category: 'plucked',
    description:
      'A harp plucked softly at mid-string with every attack faded in, on a slow reel in a very large space.',
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { pluck: 0.5, touch: 0.05, body: 0.6, volume: -3 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 600 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 3000, mix: 0.4 } },
    ],
  },
  {
    id: 'reel-room-damped-harp-sunk',
    name: 'Damped harp, sunk',
    category: 'plucked',
    description:
      'A damped harp with a cloud of its own grains an octave below and half reversed, dulled, in a long plate.',
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { touch: 0.15, damp: 0.6, body: 1, volume: 2.5 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Dark', params: { highCut: 2000 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.6, mix: 0.35 } },
    ],
  },

  // Ladder bass: the tone under the floor.
  {
    id: 'reel-room-subsoil',
    name: 'Subsoil',
    category: 'keys',
    description:
      'A sub tone with the filter at 120 Hz, faded in, with enough tape saturation that small speakers can find it.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Soft sub',
      params: { cutoff: 120, glide: 0.3, volume: -8 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 800 } },
      { deviceId: 'saturator', preset: 'Tape Print', params: { driveDb: 18, outputDb: -21.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { damping: 0.6, mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'reel-room-pedal-tone-beating',
    name: 'Pedal tone, beating',
    category: 'keys',
    description:
      'Two low oscillators beating slowly over a sub behind a filter at 150 Hz, held level on tape in a big room.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Slow opener',
      params: {
        beat: 12,
        sub: 0.6,
        cutoff: 150,
        emphasis: 0.2,
        contour: 0.3,
        decay: 10,
        drive: 0.4,
        volume: -13.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { bump: 0.7 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 2000, mix: 0.25 } },
    ],
    preview: 'low',
  },

  // Mallets: rolls and soft bars.
  {
    id: 'reel-room-slack-tape-roll',
    name: 'Slack tape roll',
    category: 'bell',
    description:
      'A rolled marimba chord played with soft mallets, replayed at half speed so the roll slows to a low flutter.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { mallet: 0.05, roll: 8, volume: -17 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { highCut: 3000 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { damping: 3000, mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'reel-room-vibraphone-at-night',
    name: 'Vibraphone at night',
    category: 'bell',
    description:
      'A vibraphone struck with the softest mallets and a slow motor, on cassette, in a reverb that sinks an octave.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { mallet: 0, decay: 2.5, motor: 0.25, motorRate: 1.5, damper: 0, volume: -10.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick' },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { tone: 0.35 } },
      { deviceId: 'shimmer', preset: 'Undertow', params: { tone: 2000, mix: 0.4 } },
    ],
  },

  // Bells: rubbed, or slowed until the strike is gone.
  {
    id: 'reel-room-rubbed-bowls-and-pad',
    name: 'Rubbed bowls and pad',
    category: 'bell',
    description:
      'Bowls rubbed rather than struck, dull and slowly beating, with a dark string pad growing behind them, on a reel.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { decay: 25, hardness: 0.05, brightness: 0.15, volume: -15 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Long shadow', params: { brightness: 900, mix: 0.35 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'reel-room-bell-octave-down',
    name: 'Bell, octave down',
    category: 'bell',
    description:
      'A church bell struck softly and replayed at half speed in three-second passes, on tape in a long plate.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { decay: 20, hardness: 0.2, brightness: 0.25, volume: -4 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed', params: { length: 3000, smooth: 0.9 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.6, mix: 0.35 } },
    ],
  },

  // Organ: pipes and reeds heard from another room.
  {
    id: 'reel-room-pipes-under-floorboards',
    name: 'Pipes under floorboards',
    category: 'organ',
    description:
      'Flue pipes with a heavy sub rank and the tone at 600 Hz, two seconds to arrive, on a slow reel in a small dark room.',
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: {
        sub: 0.9,
        twelfth: 0.1,
        fifteenth: 0,
        attack: 4,
        release: 8,
        tone: 600,
        volume: -15,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'reel-room-back-room-harmonium',
    name: 'Back room harmonium',
    category: 'organ',
    description:
      'A wheezing pump organ on a cassette four-track, with the rumble of the empty room it was recorded in.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { sub: 0.5, attack: 1.2, release: 2.5, tone: 900, volume: -14 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -40 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 2, mix: 0.3 } },
    ],
  },

  // Outdoors: what comes in from the fields.
  {
    id: 'reel-room-far-county-thunder',
    name: 'Far county thunder',
    category: 'texture',
    description:
      'Far thunder with the crack worn off, only the roll left, recorded through a window on a slow reel.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { density: 0.6, distance: 1, tone: 0.25, release: 10, volume: -1 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 2500, mix: 0.3 } },
    ],
  },
  {
    id: 'reel-room-porch-chimes-slowed',
    name: 'Porch chimes, slowed',
    category: 'texture',
    description:
      'Wind chimes from across a yard, replayed at half speed so they fall an octave and ring as low dull bells.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Porch chimes',
      params: { density: 0.7, distance: 0.8, movement: 0.3, tone: 0.2, volume: -8 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Half speed',
        params: { length: 2500, smooth: 0.9, highCut: 3000, spread: 0.4 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { damping: 3000, mix: 0.4 } },
    ],
  },

  // Pedal steel: the bar held still, or moved very slowly.
  {
    id: 'reel-room-bar-held-still',
    name: 'Bar held still',
    category: 'plucked',
    description:
      'A steel guitar with no vibrato, every note faded in by the pedal, on a nine-second loop, dulled, in a cathedral.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 2, tone: 1600, volume: -8.5 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade', params: { length: 9, wear: 0.4, mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Dark', params: { presence: -6, highCut: 1000 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'reel-room-slow-bar-wavering',
    name: 'Slow bar, wavering',
    category: 'plucked',
    description:
      'Long steel guitar slides on tape whose speed wavers, with dark repeats that blur each bend, in a huge room.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { swell: 0.6, glide: 800, vibrato: 3, tone: 1500, volume: -3 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.7, hiss: 0.2 } },
      { deviceId: 'ambient-eq', preset: 'Dark', params: { presence: -6, highCut: 1000 } },
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { tone: 1500, mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 3000, mix: 0.35 } },
    ],
  },

  // Sampler: for whatever reel is loaded.
  {
    id: 'reel-room-loaded-reel-lowered',
    name: 'Loaded reel, lowered',
    category: 'pad',
    description:
      'Whatever is loaded, looped an octave down with heavy wobble and the top taken off, in a hall that breathes.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: { attack: 2.5, release: 6, tone: 1200, wobble: 0.6, volume: -17 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { damping: 0.6, mix: 0.45 } },
    ],
  },
  {
    id: 'reel-room-loaded-reel-mirrored',
    name: 'Loaded reel, mirrored',
    category: 'pad',
    description:
      'Whatever is loaded, its middle looped forwards then backwards at pitch, smeared, in a reverb that swells in.',
    instrument: {
      deviceId: 'sampler',
      preset: 'There and back',
      params: { tune: 0, attack: 3, release: 7, tone: 900, wobble: 0.45, volume: -18.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { highCut: 3000, mix: 0.5 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { highCut: 2500, mix: 0.4 } },
    ],
  },

  // String machine: only its low end.
  {
    id: 'reel-room-ensemble-lows-only',
    name: 'Ensemble, lows only',
    category: 'string',
    description:
      'A string machine with only its low octave, the tone at 600 Hz, on a slow reel in a very large space.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 4, release: 9, low: 1, high: 0, tone: 600, volume: -8.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, hiss: 0.3 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 20, highCut: 2000, width: 0.7, mix: 0.45 },
      },
    ],
  },
  {
    id: 'reel-room-cassette-string-synth',
    name: 'Cassette string synth',
    category: 'string',
    description:
      'A string machine with its chorus slowed right down and drifting, on a worn cassette in a long plate.',
    instrument: {
      deviceId: 'string-machine',
      params: {
        attack: 3,
        release: 6,
        low: 0.6,
        high: 0.1,
        tone: 900,
        ensemble: 1,
        speed: 0.4,
        drift: 0.7,
        width: 0.5,
        volume: -7.5,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.6, mix: 0.4 } },
    ],
  },

  // Tanpura: one string at a time, very slowly.
  {
    id: 'reel-room-four-slow-strings',
    name: 'Four slow strings',
    category: 'drone',
    description:
      'A drone lute with the buzz taken off its bridge, plucked round every ten seconds, each pluck faded in, on a reel.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: { speed: 10, body: 0.8, volume: -4.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 800 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'reel-room-drone-lute-octaves',
    name: 'Drone lute, octaves',
    category: 'drone',
    description:
      'A slow wall of drone lute strings with one and two octaves swelling in beneath, filtered dark, in a huge room.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wall',
      params: { jawari: 0.4, speed: 8, volume: -3.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0.6, attack: 0.8, filter: 300 } },
      { deviceId: 'ambient-eq', preset: 'Dark', params: { highCut: 2500 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 2500, mix: 0.35 } },
    ],
  },

  // Thesis: chords made of filtered noise, which is to say of hiss.
  {
    id: 'reel-room-tuned-hiss',
    name: 'Tuned hiss',
    category: 'pad',
    description:
      'Noise through wide low bands in D minor, more hiss than pitch, its last moments returning an octave down, reversed.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { resonance: 14, width: 40, attack: 3, release: 8, scale: 1, root: 2 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, output: -8.5 } },
      { deviceId: 'cascade', preset: 'Undertow', params: { mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'reel-room-air-in-ducts',
    name: 'Air in ducts',
    category: 'pad',
    description:
      'Noise through very narrow bands that drift, a chord of faint whistles filtered at 900 Hz, in a huge room.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { center: 55, resonance: 90, attack: 3.5, release: 8, mode: 2 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-Pass Gate',
        params: { cutoffHz: 900, resonance: 0.6 },
      },
      { deviceId: 'ambient-comp', preset: 'Glue', params: { makeup: 1.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 2500, mix: 0.4 } },
    ],
  },

  // Tine piano: an electric piano in the next room.
  {
    id: 'reel-room-hallway-tines',
    name: 'Hallway tines',
    category: 'keys',
    description:
      'An electric piano with soft hammers and no bell, through a tape preamp and a dark one-spring tank, in a hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { decay: 2, release: 1.2, hardness: 0.2, tone: 0.15, volume: -9 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { highCut: 3000, output: -13 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { damping: 3000, mix: 0.35 } },
    ],
  },
  {
    id: 'reel-room-reel-winding-down',
    name: 'Reel winding down',
    category: 'keys',
    description:
      'An electric piano on a recorder whose motor now and then slows to a stop and catches up, in a long plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { bell: 0.2, tremolo: 0, tone: 0.3, volume: -17 },
    },
    effects: [
      { deviceId: 'glitch', preset: 'Winding down', params: { mix: 0.7 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.6, mix: 0.35 } },
    ],
  },

  // Wavetable: plain tones, hollow tones.
  {
    id: 'reel-room-calibration-tones',
    name: 'Calibration tones',
    category: 'pad',
    description:
      'Plain sine tones and a sub octave, like the tones at the head of a reel, phasing against a shifted copy in a hall.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { cutoff: 600, sub: 0.6, attack: 3, release: 7, volume: -17 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { tone: 2500, mix: 0.4 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { damping: 3000, mix: 0.4 } },
    ],
  },
  {
    id: 'reel-room-hollow-tone-drifting',
    name: 'Hollow tone, drifting',
    category: 'pad',
    description:
      'A hollow wavetable closed to 500 Hz and slow to arrive, on reel tape, its long tail drifting off pitch.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { motion: 0.5, rate: 0.03, cutoff: 500, attack: 4, release: 12, volume: -12.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { tone: 0.35 } },
      { deviceId: 'bloom-reverb', preset: 'Winter drift', params: { decay: 20, mix: 0.45 } },
    ],
  },

  // West coast: folded tones with the gate held open.
  {
    id: 'reel-room-folded-tone-low',
    name: 'Folded tone, low',
    category: 'drone',
    description:
      'A low fifth of lightly folded sines whose timbre wanders, on a hissing reel, with grains of it falling an octave.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folding drone',
      params: { fold: 0.35, attack: 3.5, colour: 0.25, drift: 0.9, volume: -8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.35 } },
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { tone: 2000, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 9, damping: 0.6, mix: 0.35 } },
    ],
  },
  {
    id: 'reel-room-gate-held-open',
    name: 'Gate held open',
    category: 'pad',
    description:
      'A folded tone that swells in through a low-pass gate kept dark, doubled wide and smeared in a huge room.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Slow bloom',
      params: { fold: 0.2, fm: 0.1, timbreEnv: 0.6, attack: 3, colour: 0.3, volume: -15 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Thick double', params: { tone: 3000, width: 0.5 } },
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { width: 0.5, mix: 0.45 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 2500, mix: 0.35 } },
    ],
  },

  // Zither: felt hammers and slowed strums.
  {
    id: 'reel-room-felt-hammer-sympathy',
    name: 'Felt hammer, sympathy',
    category: 'plucked',
    description:
      'One dull string struck with felt, its strike softened, with a bank of tuned strings ringing after it in a nave.',
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { decay: 10, release: 6, brightness: 0.15, sympathy: 0.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick' },
      {
        deviceId: 'sympathetic',
        preset: 'Long resonance',
        params: { root: 2, mode: 1, mix: 0.5 },
      },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'reel-room-slow-loop-zither',
    name: 'Slow loop zither',
    category: 'plucked',
    description:
      'A slow strum of dull open strings on a loop running at half speed, back an octave down in a long plate.',
    instrument: {
      deviceId: 'zither',
      preset: 'Slow sus arpeggio',
      params: { roll: 0, brightness: 0.2, volume: -7 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down', params: { length: 7, wear: 0.5, mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Dark', params: { highCut: 2200 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.6, mix: 0.35 } },
    ],
  },
]
