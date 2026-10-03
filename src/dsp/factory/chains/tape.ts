// Tape: degradation and warmth (tape, records, radio, old converters, overdriven stages).

import { type FactoryChain } from '../types'

export const TAPE_CHAINS: readonly FactoryChain[] = [
  {
    id: 'worn-cassette',
    name: 'Worn cassette',
    category: 'tape',
    description:
      'A four-track cassette: dull on top, a little unsteady, with hiss under everything.',
    effects: [{ deviceId: 'tape', preset: 'Cassette four-track' }],
  },
  {
    id: 'crumbling-loop',
    name: 'Crumbling loop',
    category: 'tape',
    description:
      'A short loop that loses treble and steadiness on every pass until there is only dust.',
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Worn out',
        params: { length: 2.6, feedback: 0.88, wear: 0.9, wow: 0.6 },
      },
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.3, output: 2.5 } },
    ],
  },
  {
    id: 'sound-on-sound',
    name: 'Sound on sound',
    category: 'tape',
    description:
      'Two decks and four seconds of tape between them: play, and layers build and slowly fade.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 6, outputDb: -4 } },
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { cutoffHz: 5500, resonance: 0.6 },
      },
      { deviceId: 'tape-loop', preset: 'Two decks', params: { spread: 0.25, mix: 0.45 } },
    ],
  },
  {
    id: 'tape-dropouts',
    name: 'Tape dropouts',
    category: 'tape',
    description:
      'An old reel at slow speed whose oxide is flaking: the sound ducks and dulls at random.',
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { speed: 2, age: 1, wow: 0.35, flutter: 0.3, hiss: 0.3, drive: 0.4 },
      },
    ],
  },
  {
    id: 'reel-flange',
    name: 'Reel flange',
    category: 'tape',
    description:
      'Two machines drifting against each other: a slow through-zero sweep printed to tape.',
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Through-zero feel',
        params: { rate: 0.08, feedback: 10, stereo: 40 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { output: 3.5 } },
    ],
  },
  {
    id: 'worn-tape-wash',
    name: 'Worn tape wash',
    category: 'tape',
    description:
      'An old reel that drifts, dulls and hisses under the sound, left to ring in a long plate.',
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.4, wear: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },

  {
    id: 'bedside-cassette',
    name: 'Bedside cassette',
    category: 'tape',
    description: 'A worn cassette played through a small radio speaker in a bedroom.',
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
      { deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0.1 } },
    ],
  },
  {
    id: 'breathing-recorder',
    name: 'Breathing recorder',
    category: 'tape',
    description:
      'A cassette recorder with automatic level: the hiss sinks under each note and swells up in the gaps.',
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0 } },
      { deviceId: 'noise-floor', preset: 'Breathing tape', params: { level: -32 } },
    ],
  },
  {
    id: 'half-speed-shadow',
    name: 'Half speed shadow',
    category: 'tape',
    description:
      'The last phrase loops an octave down and twice as long behind the playing, in a hall.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'iron-and-plate',
    name: 'Iron and plate',
    category: 'tape',
    description: 'A transformer stage that thickens and breaks up the lows, then a soft plate.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'dark-fuzz-bed',
    name: 'Dark fuzz bed',
    category: 'tape',
    description:
      'A triode pushed until it folds, filtered dark and laid half under the clean sound in a hall.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { mix: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'old-sampler',
    name: 'Old sampler',
    category: 'tape',
    description:
      'Twelve bits at a reduced rate: the top softens and a faint glassy copy of it rings above, in a plate.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'eight-bit-hall',
    name: 'Eight bit hall',
    category: 'tape',
    description:
      'A hall heard through an eight-bit companded converter, so its tail turns to grain as it fades.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
      { deviceId: 'vintage-digital', preset: 'Toy', params: { aliasing: 0.4 } },
    ],
  },
  {
    id: 'behind-glass',
    name: 'Behind glass',
    category: 'tape',
    description:
      'A thin stream: quiet detail falls away and what is left swirls a little, in a soft plate.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Behind glass' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'drowned-hall',
    name: 'Drowned hall',
    category: 'tape',
    description: 'A hall sent down a starving stream, its tail chewed into watery fragments.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4 } },
      { deviceId: 'low-bitrate', preset: 'Underwater', params: { loss: 0.6, mix: 0.85 } },
    ],
  },
  {
    id: 'empty-ballroom',
    name: 'Empty ballroom',
    category: 'tape',
    description:
      'A worn shellac 78 heard down a long empty hall: narrow, swaying, under a blanket of surface noise.',
    effects: [
      { deviceId: 'vinyl', preset: 'Ballroom 78' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'charity-shop-record',
    name: 'Charity shop record',
    category: 'tape',
    description:
      'A much-played LP: dull on top, a little warped, with crackle, pops and a scratch that comes round.',
    effects: [{ deviceId: 'vinyl', preset: 'Charity shop find' }],
  },
  {
    id: 'dusty-record',
    name: 'Dusty record',
    category: 'tape',
    description:
      'The surface noise and crackle of an old record under the sound, heard across a room.',
    effects: [
      { deviceId: 'noise-floor', preset: 'Old record', params: { level: -40 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'night-shortwave',
    name: 'Night shortwave',
    category: 'tape',
    description:
      'A distant station heard at night: thin, slowly fading, with static rising as it sinks, in a soft hall.',
    effects: [
      { deviceId: 'radio', preset: 'Night shortwave', params: { fading: 0.45, bandwidth: 0.62 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },

  {
    id: 'reel-warmth',
    name: 'Reel warmth',
    category: 'tape',
    description:
      'A tape preamp into a fast clean reel: peaks rounded, lows a little fuller, the top softened.',
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Tape weight',
        params: { drive: 0.3, lowBump: 0.1, output: -4.4 },
      },
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.3, bump: 0.3, hiss: 0.05 } },
    ],
  },
  {
    id: 'tape-slapback',
    name: 'Tape slapback',
    category: 'tape',
    description:
      'A short tape echo and its fainter repeat behind every note, pushed onto a hot reel so they fuse.',
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Single slap',
        params: { time: 125, feedback: 0.2, spread: 0.4, mix: 0.3 },
      },
      { deviceId: 'tape', preset: 'Hot glue', params: { drive: 0.65, bump: 0.4, output: -1.4 } },
    ],
  },
  {
    id: 'hot-console',
    name: 'Hot console',
    category: 'tape',
    description:
      'A console channel driven hard under the clean sound, then a fast limiter that pulls the two together.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Console', params: { drive: 0.55, mix: 0.5 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 6, outputGain: -6.2 } },
    ],
  },
  {
    id: 'old-valve-combo',
    name: 'Old valve combo',
    category: 'tape',
    description:
      'An old valve combo: tremolo and a dark spring ahead of a speaker that just starts to break up.',
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.6, depth: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.3 } },
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { drive: 0.45, bass: 0.6, output: -0.5 },
      },
    ],
  },
  {
    id: 'third-generation',
    name: 'Third generation',
    category: 'tape',
    description:
      'A cassette copied to a cassette and copied again: each pass duller, shakier and hissier.',
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.25, output: -1.3 } },
      {
        deviceId: 'tape',
        preset: 'Cassette four-track',
        params: { wow: 0.3, flutter: 0.45, hiss: 0.3, output: -1.3 },
      },
      {
        deviceId: 'tape',
        preset: 'Cassette four-track',
        params: { wow: 0.5, flutter: 0.25, age: 0.5, hiss: 0.35, output: -1.3 },
      },
    ],
  },
  {
    id: 'jukebox-next-door',
    name: 'Jukebox next door',
    category: 'tape',
    description:
      'A single on a big speaker heard through the wall: thump, a dull top and muffled crackle from the groove.',
    effects: [
      { deviceId: 'vinyl', preset: 'Jukebox single', params: { crackle: 0.6, pops: 0.3 } },
      {
        deviceId: 're-amp',
        preset: 'Warm stack',
        params: { distance: 0.6, room: 0.6, output: -2 },
      },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 700, resonance: 0.8 },
      },
    ],
  },
  {
    id: 'parlour-horn',
    name: 'Parlour horn',
    category: 'tape',
    description:
      'A shellac disc played through a horn in a small room: all honk and no bass, with soft surface noise.',
    effects: [
      { deviceId: 'vinyl', preset: 'Parlour 78' },
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: {
          speaker: 3,
          drive: 0.35,
          bass: 0.7,
          distance: 0.4,
          room: 0.3,
          noise: 0,
          output: 1.2,
        },
      },
    ],
  },
  {
    id: 'warp-and-crackle',
    name: 'Warp and crackle',
    category: 'tape',
    description:
      'A warped record against the steady sound makes a slow chorus in a small room, with crackle in the gaps.',
    effects: [
      { deviceId: 'vinyl', preset: 'Warp chorus', params: { warp: 0.5, mix: 0.3 } },
      { deviceId: 'noise-floor', preset: 'Gap crackle', params: { level: -46 } },
      {
        deviceId: 're-amp',
        preset: 'Just the room',
        params: { drive: 0.3, distance: 0.3, room: 0.4, output: 0 },
      },
    ],
  },
  {
    id: 'worn-videotape',
    name: 'Worn videotape',
    category: 'tape',
    description:
      'The sound track of an old home video: fluttering and dropping out, over a low mains hum.',
    effects: [
      {
        deviceId: 'tape',
        preset: 'Flutter shimmer',
        params: { flutter: 0.8, age: 0.65, tone: 0.45, hiss: 0.3, output: 0, mix: 1 },
      },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { level: -46, tone: 0.5 } },
    ],
  },
  {
    id: 'lost-packets',
    name: 'Lost packets',
    category: 'tape',
    description:
      'A stream that keeps losing packets, with a tape echo behind it that plays on through each hole.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Dropouts', params: { loss: 0.45, stutter: 0.1 } },
      {
        deviceId: 'tape-echo',
        preset: 'Faint trace',
        params: { time: 330, feedback: 0.55, mix: 0.25 },
      },
    ],
  },
  {
    id: 'torn-speaker',
    name: 'Torn speaker',
    category: 'tape',
    description:
      'A pentode driven past its limit into a small speaker shut in a cupboard: rasping, boxy and close.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Torn cone', params: { mix: 0.7 } },
      {
        deviceId: 're-amp',
        preset: 'In the cupboard',
        params: { speaker: 0, distance: 0.3, output: -1 },
      },
    ],
  },
  {
    id: 'overloaded-room',
    name: 'Overloaded room',
    category: 'tape',
    description:
      'A chamber recorded far too hot and pulled in towards the middle: its tail is squashed up to the notes and breaks up.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { decay: 2.5 } },
      { deviceId: 'analog-drive', preset: 'Crushed', params: { output: -3.5, mix: 1 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'static-halo',
    name: 'Static halo',
    category: 'tape',
    description:
      'Radio static rides on each note, then both are smeared into a hissing haze and printed to tape.',
    effects: [
      { deviceId: 'noise-floor', preset: 'Static notes', params: { level: -30 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { blur: 0.8, tilt: 1, lowCut: 200, mix: 0.4 },
      },
      { deviceId: 'tape', preset: 'Mastering deck', params: { hiss: 0, output: -1 } },
    ],
  },
  {
    id: 'alias-bells',
    name: 'Alias bells',
    category: 'tape',
    description:
      'A converter at a very low rate folds each note into out of tune bell tones above it, in an airy hall.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Clang', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'double-speed-ghosts',
    name: 'Double speed ghosts',
    category: 'tape',
    description:
      'A tape loop at double speed: each phrase returns an octave up and twice as fast, into thin bright air.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Octave up ghosts' },
      { deviceId: 'tape', preset: 'Mastering deck', params: { flutter: 0.3, output: 1.8 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'backwards-reel',
    name: 'Backwards reel',
    category: 'tape',
    description:
      'The last three seconds come round again backwards on worn tape, with a dark spring behind.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Backwards layers', params: { length: 3, mix: 0.45 } },
      {
        deviceId: 'patina',
        preset: 'Quarter inch reel',
        params: { drive: 0.5, wear: 0.45, output: 0.6 },
      },
      { deviceId: 'spring-reverb', preset: 'Dark late coil', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'flat-batteries',
    name: 'Flat batteries',
    category: 'tape',
    description:
      'A cassette player on dying batteries: now and then it winds down and spins back up, swaying all the while.',
    effects: [
      { deviceId: 'glitch', preset: 'Winding down', params: { chance: 0.3, calm: 0.8 } },
      {
        deviceId: 'tape',
        preset: 'Seasick',
        params: { speed: 3, wow: 0.8, flutter: 0.3, tone: 0.4 },
      },
    ],
  },
  {
    id: 'drifting-reels',
    name: 'Drifting reels',
    category: 'tape',
    description:
      'Two reels that never hold the same speed: copies wander around the sound, in a hall with a long low tail.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Drifting' },
      { deviceId: 'tape', preset: 'Drifting chorus', params: { drive: 0.5, bump: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'glass-fold',
    name: 'Glass fold',
    category: 'tape',
    description:
      'A wavefolder lays bright folded harmonics over the sound, spread wide and rung in a bright plate.',
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Folded glass',
        params: { driveDb: 26, toneDb: 9, outputDb: -10 },
      },
      { deviceId: 'stereo-detune', preset: 'Top only' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'dark-tape-trail',
    name: 'Dark tape trail',
    category: 'tape',
    description:
      'Slow tape repeats that take half a minute to fade, each pass darker and softer, in a dark hall.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { time: 1150, feedback: 0.9 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
]
