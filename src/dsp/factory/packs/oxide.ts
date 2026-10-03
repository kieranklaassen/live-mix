import { type FactoryPreset } from '../types'

// Shedding Oxide: short orchestral loops on tape so old it sheds a little more each time round,
// until the tune is mostly the gaps. Sources first, then the reel that wears them, then a plain room.

export const PRESETS: readonly FactoryPreset[] = [
  // Tape orchestra: the reels themselves, from nearly whole to nearly gone.
  {
    id: 'oxide-first-pass',
    name: 'First pass',
    category: 'string',
    description:
      'A small string section on a three-second loop that is still nearly whole, mid-band only, in a plain hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { age: 0.25, attack: 0.6, release: 1.4, volume: -9 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 150, highCut: 5200, clear: 0.2 } },
      {
        deviceId: 'tape-loop',
        params: { length: 3, feedback: 0.6, wear: 0.15, lowCut: 120, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-fortieth-pass',
    name: 'Fortieth pass',
    category: 'string',
    description:
      'Three violins on the same loop many passes later: dull, lurching, and with more missing than is left.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: { age: 0.95, hiss: 0.5, tone: -0.5, attack: 0.3, release: 1, volume: -9 },
    },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.4, wow: 0.6, flutter: 0.3, speed: 2, age: 0.95, hiss: 0.4, tone: 0.35 },
      },
      {
        deviceId: 'tape-loop',
        params: { length: 3, feedback: 0.75, wear: 1, wow: 0.6, lowCut: 250, mix: 0.5 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'oxide-late-summer-horns',
    name: 'Late summer horns',
    category: 'wind',
    description:
      'A slow horn figure going round a worn two-and-a-half-second loop, each pass a little duller, in a hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: { age: 0.45, hiss: 0.3, tone: -0.1, attack: 0.2, release: 1.2, volume: -4 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        params: { length: 2.5, feedback: 0.8, wear: 0.45, wow: 0.35, lowCut: 100, mix: 0.5 },
      },
      {
        deviceId: 'patina',
        preset: 'Quarter inch reel',
        params: { drive: 0.4, wobble: 0.3, wear: 0.5, noise: 0.35, tone: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-slow-spool-cellos',
    name: 'Slow spool cellos',
    category: 'string',
    description:
      'Cellos on tape at half speed, an octave down and heavy in the low mids, with hiss under them in a long plate.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { age: 0.5, tone: 0, volume: -10 },
    },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { drive: 0.6, wow: 0.35, speed: 2, hiss: 0.35, bump: 0.9, tone: 0.4 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'oxide-far-station-aria',
    name: 'Far station aria',
    category: 'voice',
    description:
      'A choir on worn tape heard over a night radio link, sinking under static and coming back, in a hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { age: 0.7, attack: 0.4, release: 1.8, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'radio',
        params: { band: 0, drift: 0.25, fading: 0.5, static: 0.35, bandwidth: 0.45, speaker: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'oxide-motor-running-down',
    name: 'Motor running down',
    category: 'wind',
    description:
      'Flutes on a ruined half-speed reel whose motor keeps slowing to a stop, with one dull echo behind them.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Lost reel',
      params: { age: 0.9, hiss: 0.5, length: 5, attack: 0.1, release: 1.2, volume: -8.5 },
    },
    effects: [
      { deviceId: 'glitch', preset: 'Winding down', params: { chance: 0.3, mix: 0.8 } },
      {
        deviceId: 'tape-echo',
        params: { time: 700, feedback: 0.15, wow: 0.6, flutter: 0.3, highCut: 2500, mix: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'oxide-lobby-reeds',
    name: 'Lobby reeds',
    category: 'wind',
    description:
      'A reed section from tape played through a small ceiling speaker and heard from across the room.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { age: 0.4, attack: 0.15, release: 0.9, players: 0.7, volume: -13 },
    },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Quarter inch reel',
        params: { wobble: 0.35, wear: 0.45, noise: 0.25 },
      },
      {
        deviceId: 're-amp',
        params: { speaker: 0, drive: 0.2, treble: -0.2, distance: 0.65, room: 0.6, noise: 0.05 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'chord',
  },
  {
    id: 'oxide-mostly-the-gaps',
    name: 'Mostly the gaps',
    category: 'texture',
    description:
      'One string note on tape so worn that it comes and goes, with hiss rising to fill each gap it leaves.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { age: 1, hiss: 0.6, tone: -0.3, attack: 0.5, release: 2.5, volume: -6 },
    },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.45, wow: 0.8, flutter: 0.35, speed: 2, age: 1, hiss: 0.3, tone: 0.4 },
      },
      {
        deviceId: 'noise-floor',
        preset: 'Breathing recorder',
        params: { level: -32, response: 0.6 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { decay: 2.5, mix: 0.3 } },
    ],
  },

  // Horns: the brass of the old broadcasts, always at a distance.
  {
    id: 'oxide-distant-chorale',
    name: 'Distant chorale',
    category: 'wind',
    description:
      'Horns swelling in slowly with the top and bottom taken off, on a quarter-inch reel in a hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.45, section: 0.8, attack: 2.5, release: 4, volume: -7 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 160, presence: -2, highCut: 3200, clear: 0.2 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35, age: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'oxide-one-phrase-flugelhorn',
    name: 'One phrase, flugelhorn',
    category: 'wind',
    description:
      'A breathy flugelhorn line with its last seconds looping behind it at half speed, on tape in a small plate.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { attack: 0.3, release: 1.8, vibrato: 0.2, volume: 0 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed bed', params: { tone: 3500, mix: 0.4 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { age: 0.35, hiss: 0.3 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-muted-horn-far-dial',
    name: 'Muted horn, far dial',
    category: 'wind',
    description:
      'A muted trumpet heard over a fading night radio link: thin, nasal, with static rising whenever it sinks.',
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { attack: 0.15, release: 1.2, vibrato: 0.25, volume: -4 },
    },
    effects: [
      {
        deviceId: 'radio',
        params: { fading: 0.5, static: 0.25, bandwidth: 0.4 },
      },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { decay: 3.5, damping: 0.6, mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-low-brass-slowed',
    name: 'Low brass, slowed',
    category: 'wind',
    description:
      'Trombones and tuba rising slowly over themselves an octave down at half speed, on tape in a very long hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 3, release: 5, volume: -8 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Continuous octave',
        params: { highCut: 3000, spread: 0.6, mix: 0.55 },
      },
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 6, outputDb: -8 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'oxide-bandstand-memory',
    name: 'Bandstand memory',
    category: 'wind',
    description:
      'A brass band from a worn seventy-eight, played down a corridor and heard from the far end.',
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { blow: 0.55, attack: 0.4, release: 1.5, volume: -9 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Ballroom 78', params: { pops: 0.2 } },
      { deviceId: 're-amp', preset: 'Down the hall', params: { noise: 0.05 } },
      { deviceId: 'stereo-widener', params: { width: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'oxide-fanfare-worn-thin',
    name: 'Fanfare worn thin',
    category: 'wind',
    description:
      'A soft trumpet in parallel fifths squeezed into a narrow band, with dropouts, in a hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fifths',
      params: { blow: 0.35, breath: 0.5, attack: 0.3, release: 1.5, volume: 1 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { type: 2, slope: 1, cutoffHz: 1100, resonance: 0.9, driveDb: 4 },
      },
      {
        deviceId: 'tape',
        params: { drive: 0.4, wow: 0.5, flutter: 0.3, speed: 2, age: 0.7, hiss: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'oxide-half-remembered-horn',
    name: 'Half-remembered horn',
    category: 'wind',
    description:
      'One soft horn whose phrases drift back dull and slowed from earlier on, on a worn reel in a plate.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: {
        blow: 0.5,
        breath: 0.3,
        section: 0,
        attack: 0.35,
        release: 1.5,
        vibrato: 0.25,
        volume: 1.5,
      },
    },
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Half-remembered',
        params: { reach: 8, size: 2.5, mix: 0.45 },
      },
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.4, wear: 0.4 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },

  // Felt piano: short sad figures, slowed, dulled and put round a loop.
  {
    id: 'oxide-four-bars-again',
    name: 'Four bars, again',
    category: 'keys',
    description:
      'A soft felted piano figure going round a two-second loop, each pass duller and less steady, in a hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.8,
        hardness: 0.25,
        detune: 0.6,
        soft: 0.6,
        reverbMix: 0,
        polyphony: 10,
        outputDb: -11,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        params: { length: 2, feedback: 0.82, wear: 0.5, wow: 0.4, lowCut: 90, mix: 0.5 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, hiss: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'oxide-upright-next-door',
    name: 'Upright next door',
    category: 'keys',
    description:
      'An out-of-tune upright heard through the wall from the next room, then put on quarter-inch tape.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { hardness: 0.5, detune: 0.9, grit: 0.2, reverbMix: 0, polyphony: 12, outputDb: -11 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall', params: { treble: -0.4, noise: 0.05 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { age: 0.3, wow: 0.35 } },
    ],
  },
  {
    id: 'oxide-piano-under-hiss',
    name: 'Piano under hiss',
    category: 'keys',
    description:
      'A close felted piano, dulled, on a recorder whose hiss comes up between the notes, in a small room.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { reverbMix: 0, resonance: 0.3, polyphony: 12, outputDb: -13.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { lowCut: 90, highCut: 3800 } },
      { deviceId: 'noise-floor', preset: 'Breathing recorder', params: { level: -34, tone: -0.5 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'oxide-piano-at-half-speed',
    name: 'Piano at half speed',
    category: 'keys',
    description:
      'A piano played back at half speed: an octave down, every note twice as long and wavering, in a long plate.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.4,
        hardness: 0.55,
        reverbMix: 0,
        resonance: 0.3,
        polyphony: 10,
        outputDb: -15,
      },
    },
    effects: [
      {
        deviceId: 'half-speed',
        params: { length: 2000, smooth: 0.8, fade: 0.25, highCut: 3500, spread: 0.5 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.6, flutter: 0.1 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-ripple-on-the-reel',
    name: 'Ripple on the reel',
    category: 'keys',
    description:
      'High piano notes caught on a short loop that barely fades, so they ripple on and blur into a long hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Hall',
      params: { felt: 0.3, hardness: 0.55, resonance: 0, outputDb: -3 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        params: { length: 1.4, feedback: 0.88, wear: 0.3, wow: 0.3, lowCut: 150, mix: 0.5 },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 150, highCut: 5000, clear: 0.2 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    preview: 'bells',
  },
  {
    id: 'oxide-bolts-in-the-strings',
    name: 'Bolts in the strings',
    category: 'keys',
    description:
      'A piano with stiff, gritty strings and hard hammers, clanking and out of tune, on slow dark tape.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        hardness: 0.7,
        detune: 0.8,
        stiffness: 2,
        thump: 0.6,
        grit: 0.7,
        reverbMix: 0,
        polyphony: 10,
        outputDb: -13,
      },
    },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.5, wow: 0.45, speed: 2, age: 0.5, hiss: 0.3, tone: 0.3 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { decay: 3, mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-hammers-worn-away',
    name: 'Hammers worn away',
    category: 'keys',
    description:
      'A pedalled piano with its attacks faded out, so chords arrive like a pad, on wavering tape in a large space.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        sustain: 1,
        pedalNoise: 0,
        resonance: 0.6,
        reverbMix: 0,
        outputDb: -9,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad' },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.55, hiss: 0.2 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 6, mix: 0.3 } },
    ],
    preview: 'chord',
  },

  // String machine: the easy-listening strings the reels were cut from.
  {
    id: 'oxide-elevator-strings',
    name: 'Elevator strings',
    category: 'string',
    description:
      'The seventies string ensemble as background music: mid-band only, on steady tape with a small plate.',
    instrument: {
      deviceId: 'string-machine',
      params: { attack: 0.5, release: 1.6, tone: 3600, ensemble: 0.9, volume: -7 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 220, body: 1.5, highCut: 4200, clear: 0.2 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.12, flutter: 0.1 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'oxide-two-thirds-speed',
    name: 'Two-thirds speed',
    category: 'string',
    description:
      'Slow synthetic strings replayed at two-thirds speed, a fifth lower and dragging, on worn tape in a hall.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 2, tone: 2400, volume: -8 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        params: { speed: 1, length: 1600, smooth: 0.8, fade: 0.3, highCut: 5000, spread: 0.6 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { age: 0.5, wow: 0.45, hiss: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-cellos-printed-hot',
    name: 'Cellos printed hot',
    category: 'string',
    description:
      'The low octave of the ensemble alone, pushed hard onto tape with hiss riding each swell, in a long plate.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 1.4, release: 3, volume: -8 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 12, outputDb: -6 } },
      { deviceId: 'noise-floor', preset: 'Rides the sound', params: { level: -34 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'oxide-violins-off-station',
    name: 'Violins off station',
    category: 'string',
    description:
      'The top octave of the ensemble tuned a little off its station: narrow, whistling and sinking into static.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { tone: 5000, volume: -12 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Off the dial',
        params: { tuning: 0.3, fading: 0.45, static: 0.3 },
      },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-chord-held-over',
    name: 'Chord held over',
    category: 'string',
    description:
      'String-machine chords with their last four seconds looping underneath, duller, smeared and drifting.',
    instrument: {
      deviceId: 'string-machine',
      params: { attack: 0.9, release: 2.5, low: 0.5, high: 0.25, tone: 2600, volume: -6 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Drifting memory', params: { mix: 0.45 } },
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.35, wear: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-slow-ripple-strings',
    name: 'Slow ripple strings',
    category: 'string',
    description:
      'Synthetic strings through a slow phaser and an uneven swell, so the chord ripples, on tape in a long plate.',
    instrument: {
      deviceId: 'string-machine',
      params: {
        attack: 1.5,
        release: 4,
        low: 0.3,
        high: 0.6,
        tone: 4200,
        speed: 0.6,
        drift: 0.5,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { rate: 0.09, mix: 0.4 } },
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.4, depth: 0.45 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.2 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },

  // Chamber strings: real bows under the wear.
  {
    id: 'oxide-mutes-on-tape-failing',
    name: 'Mutes on, tape failing',
    category: 'string',
    description:
      'A muted section swelling in over two seconds on tape that keeps dropping out, in a hall.',
    instrument: { deviceId: 'chamber-strings', preset: 'Muted swell', params: { volume: -8 } },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.4, wow: 0.5, flutter: 0.25, speed: 2, age: 0.85, hiss: 0.35 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'oxide-rosin-and-hiss',
    name: 'Rosin and hiss',
    category: 'string',
    description:
      'Bows that are mostly air on a three-and-a-half-second loop, their breath hard to tell from the reel hiss.',
    instrument: { deviceId: 'chamber-strings', preset: 'Whisper bows', params: { volume: -5 } },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wear: 0.5, noise: 0.5 } },
      {
        deviceId: 'tape-loop',
        params: { length: 3.5, feedback: 0.7, wear: 0.4, wow: 0.3, lowCut: 120, mix: 0.45 },
      },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-violin-from-the-kitchen',
    name: 'Violin from the kitchen',
    category: 'string',
    description:
      'One violin with a wide vibrato from a small medium-wave set: all middle, a little static, in a room.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { attack: 0.2, release: 0.8, vibrato: 16, volume: -6 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio', params: { fading: 0.2, static: 0.2 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'line',
  },
  {
    id: 'oxide-thrift-shop-strings',
    name: 'Thrift shop strings',
    category: 'string',
    description:
      'Six players with a wide vibrato from a second-hand record: crackle, a warp and a worn groove, in a hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 0.8, release: 1.8, volume: -9 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find', params: { pops: 0.2 } },
      { deviceId: 'ambient-eq', params: { lowCut: 120, highCut: 6000, clear: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-reel-run-backwards',
    name: 'Reel run backwards',
    category: 'string',
    description:
      'A still section without vibrato whose last seconds come back reversed off the loop, in a hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { attack: 1.2, release: 3, volume: -8 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Backwards layers',
        params: { length: 2.5, feedback: 0.7, wear: 0.4, mix: 0.5 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-low-bows-heavy-tape',
    name: 'Low bows, heavy tape',
    category: 'string',
    description:
      'Dark bows on a low fifth pushed into the tape until they thicken, left in a very long hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Slow dark bows',
      params: { players: 6, volume: -8 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -11 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },

  // Sampler: written for whatever is loaded; the previews play its built-in soft tone.
  {
    id: 'oxide-whatever-was-on-it',
    name: 'Whatever was on it',
    category: 'keys',
    description:
      'Whatever is loaded, from tired tape onto a two-second loop that dulls it each pass, with faint static under it.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Worn tape',
      params: { attack: 0.2, release: 1.8, volume: -13.5 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        params: { length: 2, feedback: 0.8, wear: 0.6, wow: 0.4, lowCut: 100, mix: 0.5 },
      },
      { deviceId: 'noise-floor', preset: 'Between stations', params: { level: -44 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-spool-at-half-pitch',
    name: 'Spool at half pitch',
    category: 'pad',
    description:
      'The loaded sound an octave down on a slow unsteady loop, mid-band only, behind reel hiss in a hall.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: { attack: 1.2, release: 3.5, wobble: 0.6, volume: -15 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wear: 0.45, noise: 0.45 } },
      { deviceId: 'ambient-eq', params: { lowCut: 130, highCut: 3600, clear: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'oxide-back-and-forth-splice',
    name: 'Back and forth splice',
    category: 'texture',
    description:
      'A short stretch of the loaded sound run back and forth, heard half through a fading radio link.',
    instrument: {
      deviceId: 'sampler',
      preset: 'There and back',
      params: { tune: 0, attack: 0.8, release: 3, volume: -2 },
    },
    effects: [
      { deviceId: 'radio', params: { mix: 0.5 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-splice-in-backwards',
    name: 'Splice in backwards',
    category: 'keys',
    description:
      'The loaded sound played backwards on each key, with a worn tape echo trailing it into a room.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Backwards',
      params: { tone: 5000, wobble: 0.4, volume: -13 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { feedback: 0.5, mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'oxide-single-track-playback',
    name: 'Single-track playback',
    category: 'pad',
    description:
      'The loaded sound a fifth down from a one-track machine: mono, band-limited and hissing, in a small room.',
    instrument: {
      deviceId: 'sampler',
      params: {
        crossfade: 150,
        tune: -7,
        attack: 0.4,
        release: 2,
        tone: 1800,
        wobble: 0.5,
        velocity: 0.3,
        volume: -19,
      },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -40, tone: -0.4 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } },
      { deviceId: 'stereo-widener', preset: 'Mono' },
    ],
  },
  {
    id: 'oxide-motor-almost-stopped',
    name: 'Motor almost stopped',
    category: 'pad',
    description:
      'The loaded sound two octaves down, as from a deck with its motor nearly stopped: slow, dark and wavering.',
    instrument: {
      deviceId: 'sampler',
      preset: 'There and back',
      params: { tune: -24, attack: 3.5, release: 5, tone: 1500, wobble: 0.7, volume: -17 },
    },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.4, wow: 0.9, flutter: 0.1, speed: 2, hiss: 0.3, tone: 0.3 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { decay: 4, mix: 0.35 } },
    ],
  },

  // Grain: written for whatever is loaded; the previews play its built-in soft tone.
  {
    id: 'oxide-flakes-off-the-reel',
    name: 'Flakes off the reel',
    category: 'texture',
    description:
      'Short grains of the loaded sound falling one at a time, like flakes off a reel, into a hall.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Stutter',
      params: {
        position: 0.25,
        scan: 0.05,
        size: 90,
        density: 2,
        spray: 0.5,
        shape: 0.3,
        attack: 0.05,
        release: 1.5,
        spread: 0.6,
        tone: 5000,
        volume: -8.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { age: 0.5, hiss: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'oxide-held-against-the-head',
    name: 'Held against the head',
    category: 'pad',
    description:
      'One instant of the loaded sound held as a chord, as if the reel had stopped against the head, wobbling.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: { position: 0.3, tone: 4500, volume: -16 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.5, noise: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-barely-moving-reel',
    name: 'Barely moving reel',
    category: 'texture',
    description:
      'The loaded sound pulled past at a thirtieth of its speed, at pitch, with recorder hiss breathing in the gaps.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Slow stretch',
      params: {
        scan: 0.03,
        size: 500,
        density: 6,
        spray: 0.05,
        attack: 0.8,
        release: 2.5,
        spread: 0.3,
        tone: 4000,
        volume: -3.5,
      },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Breathing recorder', params: { level: -33 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'oxide-rewind-wash',
    name: 'Rewind wash',
    category: 'texture',
    description:
      'Long reversed grains swelling backwards through the loaded sound onto a four-second loop, dulled, in a long hall.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Backwards wash',
      params: { position: 0.3, size: 700, spread: 0.5, volume: -7.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 100, highCut: 3500, clear: 0.2 } },
      { deviceId: 'tape-loop', params: { length: 4, feedback: 0.6, wear: 0.5, mix: 0.45 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-dust-in-the-heads',
    name: 'Dust in the heads',
    category: 'pad',
    description:
      'A dense, dull cloud of the loaded sound with every grain a little out of tune, as heard through clogged heads.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Cloud',
      params: {
        size: 600,
        density: 10,
        spray: 0.3,
        detune: 22,
        octaves: 0,
        attack: 2,
        release: 5,
        spread: 0.5,
        tone: 1400,
        volume: -18,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { highCut: 4000 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { decay: 3, mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-spool-inside-a-spool',
    name: 'Spool inside a spool',
    category: 'pad',
    description:
      'A cloud of the loaded sound with its own last seconds looping underneath at half speed, on a worn reel.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Cloud',
      params: { attack: 1, release: 3, tone: 6000, volume: -14 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed bed', params: { length: 3, mix: 0.4 } },
      {
        deviceId: 'patina',
        preset: 'Quarter inch reel',
        params: { wobble: 0.4, wear: 0.6, noise: 0.4 },
      },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.3 } },
    ],
  },

  // Acoustic guitar: the nylon guitar of a light orchestra, looped or slowed.
  {
    id: 'oxide-nylon-on-a-short-loop',
    name: 'Nylon on a short loop',
    category: 'plucked',
    description:
      'A nylon-string guitar figure on a two-second loop, softer and less steady each time round, in a room.',
    instrument: { deviceId: 'acoustic-guitar', preset: 'Nylon dusk', params: { volume: 1.5 } },
    effects: [
      {
        deviceId: 'tape-loop',
        params: { length: 2, feedback: 0.78, wear: 0.5, wow: 0.35, mix: 0.45 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.6, speed: 2, hiss: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-thumbed-and-slowed',
    name: 'Thumbed and slowed',
    category: 'plucked',
    description:
      'A guitar chord brushed with the thumb and replayed at three-quarter speed, a fourth lower, over reel hiss.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { sustain: 10, release: 5, volume: -6 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        params: { speed: 0, length: 1500, smooth: 0.7, fade: 0.25, highCut: 6000, spread: 0.5 },
      },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -44 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },

  // Atmosphere: what the microphone and the machines add on their own.
  {
    id: 'oxide-hum-of-the-decks',
    name: 'Hum of the decks',
    category: 'texture',
    description:
      'The mains hum of two tape machines left running, tuned to the keys held, with their hiss, in a small room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: { density: 0.6, tone: 0.45, attack: 1.5, release: 3, volume: -13 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -40 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'oxide-rain-past-the-window',
    name: 'Rain past the window',
    category: 'texture',
    description:
      'Steady rain beyond an open window as a small recorder took it down: narrowed, soft at the top, hissing.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Distant downpour',
      params: { attack: 2, release: 5, width: 0.6, volume: 4.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.3, noise: 0.35 } },
      { deviceId: 'ambient-eq', params: { lowCut: 200, highCut: 5000, clear: 0.2 } },
    ],
  },

  // Brass and string polysynth: the synthesizer line laid over a reel afterwards.
  {
    id: 'oxide-synth-horn-refrain',
    name: 'Synth horn refrain',
    category: 'pad',
    description:
      'A soft synthetic horn line with long, dull repeats behind it, on a tired reel in a hall.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { attack: 0.5, release: 2.5, volume: -6 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Long and murky',
        params: { feedback: 0.5, tone: 2000, mix: 0.35 },
      },
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.35, wear: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'oxide-last-light-pad',
    name: 'Last light pad',
    category: 'pad',
    description:
      'A dark synthetic brass chord that opens over three seconds and sways in pitch on tape, in a very long hall.',
    instrument: { deviceId: 'aurora', preset: 'Slow bloom', params: { release: 6, volume: -9 } },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.35, wow: 0.8, flutter: 0.1, speed: 2, age: 0.3, hiss: 0.25 },
      },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },

  // Bow: one cello, bowed on a failing reel or plucked onto a loop.
  {
    id: 'oxide-cello-with-dropouts',
    name: 'Cello with dropouts',
    category: 'string',
    description: 'One bowed cello line on a reel that drops out and lurches, in a plate.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 0.4, release: 1.8, volume: -10 },
    },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.4, wow: 0.45, flutter: 0.3, speed: 2, age: 0.8, hiss: 0.3 },
      },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'oxide-plucked-bass-worn-loop',
    name: 'Plucked bass, worn loop',
    category: 'plucked',
    description:
      'A soft plucked bass fifth caught on a short loop and repeated, a little duller each time, in a room.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { brightness: 0.3, decay: 4, body: 0.7, volume: -5 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        params: { length: 1.6, feedback: 0.82, wear: 0.5, wow: 0.3, lowCut: 40, mix: 0.5 },
      },
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },

  // Choir: the operatic voice, far off or smeared.
  {
    id: 'oxide-soprano-under-static',
    name: 'Soprano under static',
    category: 'voice',
    description:
      'One operatic voice in a small chapel, heard over a fading radio link with static rising as it sinks.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { attack: 0.25, release: 1.2, volume: -4 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Small chapel', params: { mix: 0.3 } },
      { deviceId: 'radio', params: { static: 0.3, bandwidth: 0.45 } },
    ],
    preview: 'line',
  },
  {
    id: 'oxide-vowels-run-together',
    name: 'Vowels run together',
    category: 'voice',
    description:
      'A slow wordless chorus smeared until its vowels run into one another, on worn tape in a hall.',
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { ensemble: 0.6, width: 0.5, vibrato: 3, attack: 2, release: 5, volume: -14 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.6, width: 0.2 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { age: 0.5, wow: 0.4, hiss: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // Chord harp: the harp sweep of a string arrangement.
  {
    id: 'oxide-lounge-harp-sweep',
    name: 'Lounge harp sweep',
    category: 'plucked',
    description:
      'Slow harp sweeps up and back over four octaves, each one answered backwards off the tape, in a hall.',
    instrument: {
      deviceId: 'chord-harp',
      params: {
        strum: 140,
        direction: 2,
        span: 3,
        sustain: 6,
        tone: 0.35,
        pad: 0.15,
        spread: 0.8,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.4 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35, hiss: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-brushed-chord-worn',
    name: 'Brushed chord, worn',
    category: 'plucked',
    description:
      'One dull brushed chord with a soft pad under it, on a worn cassette with a long spring behind.',
    instrument: { deviceId: 'chord-harp', preset: 'Brushed chord', params: { volume: -11 } },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },

  // Clarinet: the reed player in the next room.
  {
    id: 'oxide-subtone-chewed-reel',
    name: 'Subtone, chewed reel',
    category: 'wind',
    description:
      'A breathy subtone saxophone on a reel the machine has chewed: it lurches, flutters and slips, in a room.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { attack: 0.25, release: 0.9, volume: -6 },
    },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.4, wow: 0.8, flutter: 0.5, speed: 1, age: 0.6, hiss: 0.3 },
      },
      { deviceId: 'glitch', preset: 'Rare slips', params: { chance: 0.15 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-reed-loop-slow-fade',
    name: 'Reed loop, slow fade',
    category: 'wind',
    description:
      'A clarinet that fades in from nothing on each note and comes round again on a four-second loop, in a hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { attack: 1.2, release: 2.5, volume: -2 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        params: { length: 4, feedback: 0.7, wear: 0.35, wow: 0.25, mix: 0.5 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // Drone: tones that are held rather than played.
  {
    id: 'oxide-carrier-tone',
    name: 'Carrier tone',
    category: 'drone',
    description:
      'A plain low tone held like a station carrier, with whistles and static from the edge of the dial.',
    instrument: {
      deviceId: 'drone',
      params: {
        shape: 0,
        partials: 0.4,
        wave: 0.1,
        movement: 0.3,
        sub: 0.2,
        air: 0.05,
        cutoff: 1800,
        attack: 2,
        release: 5,
        volume: -3.5,
      },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Between stations',
        params: { tuning: -0.6, fading: 0.4, static: 0.3, mix: 0.55 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'oxide-minor-chord-low-reel',
    name: 'Minor chord, low reel',
    category: 'drone',
    description:
      'A just minor chord over a deep sub, swelling in slowly on slow tape with a heavy low end, in a long hall.',
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: { attack: 3.5, release: 8, volume: -13.5 },
    },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.45, wow: 0.5, flutter: 0.1, speed: 2, age: 0.3, hiss: 0.25, bump: 0.8 },
      },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.25 } },
    ],
  },

  // Dusk: the polysynth pieces, slow and rippling.
  {
    id: 'oxide-pulse-across-the-room',
    name: 'Pulse across the room',
    category: 'pad',
    description:
      'A moving-pulse pad with no sub, drifting slowly from side to side, on quarter-inch tape in a plate.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Wide pulse',
      params: { attack: 1.5, release: 4, volume: -12 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.6 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.2 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-low-hold-tone',
    name: 'Low hold tone',
    category: 'drone',
    description:
      'A low square wave and its sub, filtered dark, over the hum of an amplifier left on, on tape.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { sub: 0.4, cutoff: 900, attack: 1.2, release: 4, volume: -13 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { level: -42 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.5, wow: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },

  // Ember: a pad under the wear, and a tone under the floor.
  {
    id: 'oxide-warm-pad-thin-tape',
    name: 'Warm pad, thin tape',
    category: 'pad',
    description:
      'A warm two-oscillator pad on a reel worn thin: no bass, no top and a slow wobble, in a hall.',
    instrument: { deviceId: 'ember', preset: 'Warm pad', params: { volume: -6 } },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Quarter inch reel',
        params: { wobble: 0.45, wear: 0.65, noise: 0.35 },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 250, highCut: 3500, clear: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-through-the-floor',
    name: 'Through the floor',
    category: 'drone',
    description:
      'A dark filtered drone with room rumble under it, like a building heard at night through the floor.',
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: { subLevel: 0.3, cutoff: 420, volume: -9.5 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -38 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { decay: 2.5, mix: 0.3 } },
    ],
  },

  // Flute: a soft flute from a record or a slowed reel.
  {
    id: 'oxide-warped-flute-side',
    name: 'Warped flute side',
    category: 'wind',
    description:
      'A soft flute line from a warped record, its pitch rising and falling once a turn, in a hall.',
    instrument: { deviceId: 'flute', preset: 'Soft wind lead', params: { volume: -7 } },
    effects: [
      { deviceId: 'vinyl', preset: 'Warped', params: { warp: 0.7, wear: 0.4 } },
      { deviceId: 'ambient-eq', params: { lowCut: 150, highCut: 5500, clear: 0.2 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-low-flute-half-reel',
    name: 'Low flute, half reel',
    category: 'wind',
    description:
      'A low flute with itself an octave down at half speed underneath, hissing softly, in a long plate.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { release: 3, volume: -8.5 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { spread: 0.5, mix: 0.5 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -40 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },

  // Glass: chimes off the air, a bowl slowed down.
  {
    id: 'oxide-interval-signal',
    name: 'Interval signal',
    category: 'bell',
    description:
      'Four glass chimes like a station call between programmes, heard over a fading night radio link.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { brightness: 0.35, decay: 3, volume: -6 },
    },
    effects: [
      { deviceId: 'radio', params: { fading: 0.5, bandwidth: 0.45 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { decay: 4, mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-bowl-at-half-speed',
    name: 'Bowl at half speed',
    category: 'bell',
    description:
      'A struck glass bowl replayed at half speed: an octave down, the beating between its partials slowed too.',
    instrument: { deviceId: 'fm-glass', preset: 'Temple bowl', params: { volume: -12 } },
    effects: [
      { deviceId: 'half-speed', params: { length: 3000, smooth: 1, fade: 0.3, spread: 0.6 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },

  // Guitar: the band's guitarist, on one track of the reel.
  {
    id: 'oxide-supper-club-guitar',
    name: 'Supper club guitar',
    category: 'plucked',
    description:
      'A mellow neck pickup with amp tremolo and a dark spring, in mono on quarter-inch tape.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { hardness: 0.35, tone: 2600, warmth: 0.6, volume: 0 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 4, depth: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.2 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { age: 0.3, wow: 0.3 } },
    ],
  },
  {
    id: 'oxide-swells-on-the-splice',
    name: 'Swells on the splice',
    category: 'plucked',
    description:
      'Guitar chords with no pick, faded in by hand and layered on a three-second loop that wears them down.',
    instrument: { deviceId: 'guitar', preset: 'Volume swell', params: { volume: 6 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15, output: 7 } },
      {
        deviceId: 'tape-loop',
        params: { length: 3, feedback: 0.75, wear: 0.4, wow: 0.25, mix: 0.5 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },

  // Handpan: steel slowed, dulled and looped until the strike is gone.
  {
    id: 'oxide-pan-slowed-and-dulled',
    name: 'Pan, slowed and dulled',
    category: 'bell',
    description:
      'A hand-played steel pan at half speed with the top taken off, going round a short worn loop in a hall.',
    instrument: { deviceId: 'handpan', preset: 'Low ding', params: { volume: -3 } },
    effects: [
      { deviceId: 'half-speed', params: { length: 1500, smooth: 0.7, highCut: 2500, spread: 0.5 } },
      {
        deviceId: 'tape-loop',
        params: { length: 2.5, feedback: 0.7, wear: 0.5, wow: 0.3, mix: 0.45 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-tongue-drum-dusty-reel',
    name: 'Tongue drum, dusty reel',
    category: 'bell',
    description:
      'A steel tongue drum on a dusty reel: soft strikes, a narrowed band and hiss, in a small room.',
    instrument: { deviceId: 'handpan', preset: 'Tongue drum', params: { volume: -4 } },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Quarter inch reel',
        params: { wear: 0.7, noise: 0.5, tone: 0.35 },
      },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },

  // Harp: one bar of the orchestra's harp.
  {
    id: 'oxide-harp-one-bar',
    name: 'Harp, one bar',
    category: 'plucked',
    description:
      'A softly plucked harp figure on a two-second loop that dulls it each pass, mid-band only, in a small plate.',
    instrument: { deviceId: 'harp', preset: 'Concert harp', params: { touch: 0.3, volume: 2 } },
    effects: [
      {
        deviceId: 'tape-loop',
        params: { length: 2, feedback: 0.8, wear: 0.55, wow: 0.35, mix: 0.5 },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 140, highCut: 4000, clear: 0.2 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-dull-muted-harp',
    name: 'Dull muted harp',
    category: 'plucked',
    description:
      'A damped harp, short and dull, with soft dark repeats, on slow tape in a small room.',
    instrument: { deviceId: 'harp', preset: 'Muted harp', params: { volume: -2 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { mix: 0.25 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, tone: 0.3, wow: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },

  // Ladder bass: a pedal tone, and a slow tune over the loop.
  {
    id: 'oxide-pedal-tone-old-reel',
    name: 'Pedal tone, old reel',
    category: 'keys',
    description:
      'A steady two-oscillator bass tone with a sub, on old tape that sags and saturates, in a small room.',
    instrument: { deviceId: 'ladder-bass', preset: 'Pedal drone', params: { volume: -14.5 } },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.5, wow: 0.4, flutter: 0.15, speed: 2, age: 0.4, hiss: 0.25, bump: 0.8 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.2 } },
    ],
    preview: 'low',
  },
  {
    id: 'oxide-synth-line-worn',
    name: 'Synth line, worn',
    category: 'keys',
    description:
      'A singing one-voice synthesizer playing a slow tune, dulled by a worn reel, with one soft echo in a hall.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Singing lead',
      params: { cutoff: 1100, glide: 0.2, volume: -1 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wear: 0.6, wobble: 0.35 } },
      { deviceId: 'tape-echo', params: { time: 500, feedback: 0.15, highCut: 2500, mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },

  // Mallets: the vibraphone of a lounge record, and a roll going round.
  {
    id: 'oxide-lounge-vibes-motor-on',
    name: 'Lounge vibes, motor on',
    category: 'bell',
    description:
      'A vibraphone with its motor on, mid-band only and a little unsteady on tape, with a small plate.',
    instrument: { deviceId: 'mallets', preset: 'Motor vibes', params: { mallet: 0.3, volume: -7 } },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 180, highCut: 5000, clear: 0.2 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4, age: 0.3, hiss: 0.3 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-marimba-roll-fading',
    name: 'Marimba roll, fading',
    category: 'bell',
    description:
      'A soft rolled marimba chord going round a three-second loop that wears a little more off it each pass.',
    instrument: { deviceId: 'mallets', preset: 'Rolled marimba', params: { volume: -14 } },
    effects: [
      {
        deviceId: 'tape-loop',
        params: { length: 3, feedback: 0.7, wear: 0.6, wow: 0.3, mix: 0.45 },
      },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },

  // Bells: a bell from outside, a music box running slow.
  {
    id: 'oxide-bell-across-town',
    name: 'Bell across town',
    category: 'bell',
    description:
      'A church bell from across town, its top and bottom lost on the way, taped through an open window.',
    instrument: { deviceId: 'modal-bells', preset: 'Church bell', params: { volume: -9.5 } },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 200, air: -6, highCut: 3000, clear: 0.2 } },
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.3, noise: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'oxide-wind-up-box-slowed',
    name: 'Wind-up box, slowed',
    category: 'bell',
    description:
      'A music box replayed at three-quarter speed, a fourth lower and unsteady, in a small room.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 5, release: 0.5, volume: -3.8 },
    },
    effects: [
      { deviceId: 'half-speed', params: { speed: 0, length: 1200, smooth: 0.6, spread: 0.4 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.7, flutter: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },

  // Reed organ: the lounge organ and the chapel one.
  {
    id: 'oxide-lounge-organ-old-reel',
    name: 'Lounge organ, old reel',
    category: 'organ',
    description:
      'A soft flute-stop organ through a slowly rotating speaker, on an old reel that sags, in a small room.',
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { tremulant: 0.2, sub: 0.3, volume: -14 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.15, distance: 0.5, mix: 0.8 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.45, age: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'oxide-pipes-under-hiss',
    name: 'Pipes under hiss',
    category: 'organ',
    description:
      'Distant pipes that swell in slowly, with reel hiss coming up in the hall when they stop.',
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { attack: 3, release: 5, volume: -12 },
    },
    effects: [
      {
        deviceId: 'noise-floor',
        preset: 'Breathing recorder',
        params: { level: -34, response: 1.5 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, mix: 0.35 } },
    ],
  },

  // Outdoors: the night outside the open window while the tape runs.
  {
    id: 'oxide-crickets-on-the-reel',
    name: 'Crickets on the reel',
    category: 'texture',
    description:
      'Crickets on a summer night as a portable recorder took them down: narrowed, hissing, a little unsteady.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Summer night',
      params: { width: 0.7, volume: 2.5 },
    },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.4, wow: 0.35, flutter: 0.3, speed: 2, age: 0.3, hiss: 0.4 },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 200, highCut: 6000, clear: 0.2 } },
    ],
  },
  {
    id: 'oxide-far-storm-tape-running',
    name: 'Far storm, tape running',
    category: 'texture',
    description:
      'Thunder a long way off through an open window, with the tape left running and hissing in the room.',
    instrument: { deviceId: 'outdoors', preset: 'Far storm', params: { volume: -3 } },
    effects: [
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -38 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },

  // Pedal steel: a slow steel, sagging or slowed.
  {
    id: 'oxide-steel-on-a-tired-reel',
    name: 'Steel on a tired reel',
    category: 'plucked',
    description:
      'A slow steel guitar with a spring behind it, on a tired reel whose pitch sways under the bar.',
    instrument: { deviceId: 'pedal-steel', preset: 'Slow steel', params: { volume: -10 } },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } },
      {
        deviceId: 'tape',
        params: { drive: 0.35, wow: 0.8, flutter: 0.15, speed: 2, age: 0.4, hiss: 0.3 },
      },
    ],
  },
  {
    id: 'oxide-still-steel-half-speed',
    name: 'Still steel, half speed',
    category: 'plucked',
    description:
      'Steel chords swelled in without vibrato over their own octave below at half speed, in a hall.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { sustain: 20, volume: -11 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { highCut: 4000, mix: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },

  // Tanpura: a drone lute received from far away, or slowed.
  {
    id: 'oxide-drone-lute-far-station',
    name: 'Drone lute, far station',
    category: 'drone',
    description:
      'A four-string drone lute received from very far off, fading under static and coming back.',
    instrument: { deviceId: 'tanpura', preset: 'Morning raga', params: { volume: 4.5 } },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Far station',
        params: { fading: 0.55, static: 0.3, bandwidth: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'oxide-monochord-slowed',
    name: 'Monochord, slowed',
    category: 'drone',
    description:
      'Plain plucked drone strings with no buzz, replayed at two-thirds speed, a fifth lower, on hissing tape.',
    instrument: { deviceId: 'tanpura', preset: 'Monochord', params: { speed: 5, volume: -6 } },
    effects: [
      {
        deviceId: 'half-speed',
        params: { speed: 1, length: 3000, smooth: 1, fade: 0.3, spread: 0.5 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.4, wow: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    preview: 'hold',
  },

  // Thesis: noise in tune, like whistles and hiss off the air.
  {
    id: 'oxide-whistles-off-the-dial',
    name: 'Whistles off the dial',
    category: 'texture',
    description:
      'Narrow bands of noise that swell in turn like whistles between stations, over a bed of static.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { center: 69, attack: 1, release: 3 },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { gain: 12, ride: 0 } },
      { deviceId: 'noise-floor', preset: 'Between stations', params: { level: -40 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-chord-made-of-hiss',
    name: 'Chord made of hiss',
    category: 'pad',
    description:
      'Six broad bands of noise from one key: a breathy chord that sounds like tape hiss in tune, in a long plate.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Fixed Full Stack',
      params: { center: 65, resonance: 12, width: 85, attack: 2, release: 4, mode: 1, strum: 0 },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { gain: 5, ride: 0 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    preview: 'hold',
  },

  // Tine piano: the electric piano of a late set.
  {
    id: 'oxide-warm-reel-tines',
    name: 'Warm reel tines',
    category: 'keys',
    description:
      'A soft electric piano with a slow tremolo, taped slow and a little warm, with a small plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { hardness: 0.5, tremoloRate: 2.2, tone: 0.45, volume: -15 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, wow: 0.4, age: 0.3 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-dark-tines-looped',
    name: 'Dark tines, looped',
    category: 'keys',
    description:
      'Dark tines with no bell, doubled a few cents apart so they blur, going round a worn loop in a hall.',
    instrument: { deviceId: 'tine-piano', preset: 'Dark felt', params: { volume: -12.5 } },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Treated piano' },
      {
        deviceId: 'tape-loop',
        params: { length: 2.5, feedback: 0.8, wear: 0.5, wow: 0.3, mix: 0.5 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // Wavetable: two decks out of step, and the tone at the head of the reel.
  {
    id: 'oxide-two-decks-one-tune',
    name: 'Two decks, one tune',
    category: 'pad',
    description:
      'A hollow morphing pad doubled a fraction of a hertz apart, like two decks at slightly different speeds.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 2, release: 5, volume: -10.5 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { feedback: 0.3, tone: 3500 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4, hiss: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 6, width: 0.6, mix: 0.25 } },
    ],
  },
  {
    id: 'oxide-line-up-tone',
    name: 'Line-up tone',
    category: 'pad',
    description:
      'A plain tone like the one at the head of a reel, sagging and fluttering as the tape drags, in a room.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { sub: 0.2, attack: 0.3, release: 2, volume: -11 },
    },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.35, wow: 0.9, flutter: 0.4, speed: 1, age: 0.5, hiss: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'hold',
  },

  // West Coast: a folding tone and a soft pluck, both through old tape.
  {
    id: 'oxide-folding-tone-old-reel',
    name: 'Folding tone, old reel',
    category: 'drone',
    description:
      'A low tone that folds over itself slowly, dulled by old slow tape, in a dark room.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folding drone',
      params: { colour: 0.5, volume: -10 },
    },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.4, wow: 0.4, flutter: 0.15, speed: 2, age: 0.4, hiss: 0.3, tone: 0.35 },
      },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { decay: 4, damping: 0.6, mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-mallet-tape-reversed',
    name: 'Mallet, tape reversed',
    category: 'plucked',
    description:
      'A soft wooden pluck with its last three seconds running backwards underneath, on tape with a small plate.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { decay: 2.2, volume: 0 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Backwards bed', params: { tone: 4000, mix: 0.35 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.3, wow: 0.35 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },

  // Zither: a parlour instrument from a record, and a hammered roll on a slow reel.
  {
    id: 'oxide-parlour-zither',
    name: 'Parlour zither',
    category: 'plucked',
    description:
      'A minor chord strummed on a chord zither, heard from a dusty record with a slow warp, in a small room.',
    instrument: { deviceId: 'zither', preset: 'Chord zither minor', params: { volume: -5 } },
    effects: [
      { deviceId: 'patina', preset: 'Dusty record', params: { noise: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'oxide-hammered-roll-slow-reel',
    name: 'Hammered roll, slow reel',
    category: 'plucked',
    description:
      'A hammered roll on doubled strings, on slow tape that dulls it and drops out, in a hall.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { brightness: 0.45, volume: -12 },
    },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.4, wow: 0.5, flutter: 0.2, speed: 2, age: 0.6, hiss: 0.3, tone: 0.35 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 5, mix: 0.35 } },
    ],
    preview: 'chord',
  },
]
