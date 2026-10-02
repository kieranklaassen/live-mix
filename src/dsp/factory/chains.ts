import { type FactoryChain } from './types'

export const FACTORY_CHAINS: readonly FactoryChain[] = [
  // Space: reverbs.
  {
    id: 'long-plate',
    name: 'Long plate',
    category: 'space',
    description: 'A bright steel plate with a long even tail, the plain reverb for anything.',
    effects: [{ deviceId: 'dattorro', preset: 'Long plate' }],
  },
  {
    id: 'breathing-hall',
    name: 'Breathing hall',
    category: 'space',
    description: 'A large hall whose tail rises and falls every five seconds, like slow breath.',
    effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing' }],
  },
  {
    id: 'infinite-space',
    name: 'Infinite space',
    category: 'space',
    description: 'A modulated space with a one minute tail that swells in behind each note.',
    effects: [{ deviceId: 'expanse', preset: 'Event horizon', params: { width: 0.8 } }],
  },
  {
    id: 'frozen-room',
    name: 'Frozen room',
    category: 'space',
    description:
      'A big undamped room with a long wide tail; its freeze switch holds whatever is ringing in it.',
    effects: [
      {
        deviceId: 'ether-reverb',
        preset: 'Cathedral',
        params: { decay: 30, damping: 0.1, size: 1, mix: 0.25 },
      },
    ],
  },
  {
    id: 'spring-tank',
    name: 'Spring tank',
    category: 'space',
    description: 'Three long springs with the chirp and drip of the tank in an old amplifier.',
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.4 } }],
  },

  {
    id: 'backwards-cloud',
    name: 'Backwards cloud',
    category: 'space',
    description:
      'Each note is answered by a cloud that grows backwards behind it and cuts off, inside a quiet plate.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Backwards cloud' },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'singing-hall',
    name: 'Singing hall',
    category: 'space',
    description: 'A hall whose tail holds a soft sung ah behind every note.',
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.35 } }],
  },
  {
    id: 'wandering-choir',
    name: 'Wandering choir',
    category: 'space',
    description: 'A choir whose vowel drifts on its own, left to dissolve in a plate.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Moving vowels', params: { mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'amp-down-the-hall',
    name: 'Amp down the hall',
    category: 'space',
    description:
      'A guitar amplifier heard from the far end of a hall, with a plate carrying the tail on.',
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall', params: { output: -1.5 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'swarm-cavern',
    name: 'Swarm cavern',
    category: 'space',
    description: 'A rush of separate echoes after each note that piles up into a dark cave.',
    effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern' }],
  },
  // Echo: delays.
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
      { deviceId: 'zita-rev1', preset: 'Hall', params: { lowDecay: 4, midDecay: 3.5, mix: 0.15 } },
    ],
  },
  {
    id: 'grain-crystals',
    name: 'Grain crystals',
    category: 'echo',
    description: 'Repeats rebuilt from grains an octave up, each pass climbing again into a plate.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals' },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
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
      { deviceId: 'echo-memory', preset: 'Remembering', params: { mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'half-remembered-hall',
    name: 'Half-remembered hall',
    category: 'echo',
    description:
      'Dark recollections from up to a minute ago, some backwards or an octave down, blurred in a hall.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Half-remembered', params: { reach: 60, mix: 0.45 } },
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
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { feedback: 0.55, mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
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
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  // Tape: degradation and warmth (tape, records, radio, old converters, overdriven stages).
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
      { deviceId: 'tape', preset: 'Disintegrating loop', params: { hiss: 0.3, output: 2.5 } },
    ],
  },
  {
    id: 'sound-on-sound',
    name: 'Sound on sound',
    category: 'tape',
    description:
      'Two decks and four seconds of tape between them: play, and layers build and slowly fade.',
    effects: [
      { deviceId: 'saturator', preset: 'Tape Print', params: { driveDb: 6, outputDb: -4 } },
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
        preset: 'Through-Zero Feel',
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
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
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
      { deviceId: 'noise-floor', preset: 'Breathing recorder', params: { level: -32 } },
    ],
  },
  {
    id: 'half-speed-shadow',
    name: 'Half speed shadow',
    category: 'tape',
    description:
      'The last phrase loops an octave down and twice as long behind the playing, in a hall.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed bed' },
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
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'dark-fuzz-bed',
    name: 'Dark fuzz bed',
    category: 'tape',
    description:
      'A triode pushed until it folds, filtered dark and laid half under the clean sound in a hall.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz bed', params: { mix: 0.5 } },
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
      { deviceId: 'vintage-digital', preset: 'Twelve bit' },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
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
      { deviceId: 'vintage-digital', preset: 'Eight bit toy', params: { aliasing: 0.4 } },
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
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
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
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'night-shortwave',
    name: 'Night shortwave',
    category: 'tape',
    description:
      'A distant station heard at night: thin, slowly fading, with static rising as it sinks, in a soft hall.',
    effects: [
      { deviceId: 'radio', preset: 'Night shortwave' },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  // Motion: modulation.
  {
    id: 'slow-chorus',
    name: 'Slow chorus',
    category: 'motion',
    description: 'Three voices drifting over twelve seconds: width and movement without wobble.',
    effects: [{ deviceId: 'chorus', preset: 'Slow Drift' }],
  },
  {
    id: 'phaser-sweep',
    name: 'Phaser sweep',
    category: 'motion',
    description: 'Eight resonant stages swept up and down once every sixteen seconds.',
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Deep 8-Stage',
        params: { rate: 0.06, depth: 85, shape: 1, stereo: 60, feedback: 55, mix: 0.42 },
      },
    ],
  },
  {
    id: 'rotary-chorale',
    name: 'Rotary chorale',
    category: 'motion',
    description: 'A rotating speaker on its slow speed, heard from across the room.',
    effects: [{ deviceId: 'rotary', preset: 'Across the room', params: { distance: 0.6 } }],
  },
  {
    id: 'tremolo-and-pan',
    name: 'Tremolo and pan',
    category: 'motion',
    description:
      'A harmonic tremolo that shimmers rather than pulses, then drifts from side to side.',
    effects: [
      { deviceId: 'tremolo', preset: 'Brownface shimmer', params: { rate: 2.8, depth: 0.55 } },
      { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.6 } },
    ],
  },
  {
    id: 'filter-tide',
    name: 'Filter tide',
    category: 'motion',
    description:
      'A low-pass filter that starts closed and takes a hundred seconds to open and close again.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { cutoffHz: 900, resonance: 1, lfoAmount: 40, lfoRateHz: 0.01, lfoShape: 1 },
      },
    ],
  },

  {
    id: 'breathing-pulses',
    name: 'Breathing pulses',
    category: 'motion',
    description:
      'The reverb comes in three slow waves and comes round again, quieter each time, into a plate.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Breathing pulses', params: { mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  // Texture: granular and spectral.
  {
    id: 'soft-grain-cloud',
    name: 'Soft grain cloud',
    category: 'texture',
    description:
      'The last moments replayed as overlapping grains in a hall; its freeze holds the cloud still.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Soft cloud' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'spectral-smear',
    name: 'Spectral smear',
    category: 'texture',
    description:
      'Every frequency hangs on after its note and attacks dissolve; switch on freeze for a drone.',
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { blur: 0.8, mix: 0.4, width: 0.7 },
      },
    ],
  },
  {
    id: 'sympathetic-strings',
    name: 'Sympathetic strings',
    category: 'texture',
    description:
      'Sixteen strings that tune themselves to the notes you play and ring on after them.',
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Follow the melody',
        params: { strings: 12, sympathy: 0.5, decay: 6, mix: 0.3, width: 0.85 },
      },
    ],
  },
  {
    id: 'bowed-swells',
    name: 'Bowed swells',
    category: 'texture',
    description:
      'Attacks are removed so each note fades in like a bow, levelled and carried on by a plate.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed' },
      { deviceId: 'limiter-1176', params: { inputGain: 8, outputGain: -2 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'scattered-drift',
    name: 'Scattered drift',
    category: 'texture',
    description:
      'Reversed grains of the last two seconds wander off pitch both ways, in a dark room.',
    effects: [
      { deviceId: 'spectral-drifter', preset: 'Scatter', params: { bloom: 0.85, mix: 0.4 } },
      {
        deviceId: 'expanse',
        preset: 'Small dark room',
        params: { size: 0.3, decay: 4, mix: 0.35 },
      },
    ],
  },

  {
    id: 'soft-stumbles',
    name: 'Soft stumbles',
    category: 'texture',
    description:
      'Now and then a moment repeats, turns backwards or winds down, each one faded in and blurred by a hall.',
    effects: [
      { deviceId: 'glitch', preset: 'Gentle stumble', params: { calm: 0.85, chance: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'skipping-disc',
    name: 'Skipping disc',
    category: 'texture',
    description:
      'The sound sticks on tiny fragments like a scratched disc, softened and set in a plate.',
    effects: [
      { deviceId: 'glitch', preset: 'Skipping disc', params: { calm: 0.45, mix: 0.8 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'stacked-loops',
    name: 'Stacked loops',
    category: 'texture',
    description:
      'Each note comes back as little loops an octave and two octaves up, falling into a long plate.',
    effects: [
      { deviceId: 'cascade', preset: 'Octave stack', params: { mix: 0.45 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'drawn-drone',
    name: 'Drawn drone',
    category: 'texture',
    description: 'A slowly darkening drone is drawn out of every note and carried into a hall.',
    effects: [
      { deviceId: 'cascade', preset: 'Long drone', params: { mix: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sideband-ghosts',
    name: 'Sideband ghosts',
    category: 'texture',
    description:
      'Every pitch shifted off its harmony on a drifting sideband set, repeated on worn tape and left in a plate.',
    effects: [
      {
        deviceId: 'radio',
        preset: 'Sideband voices',
        params: { tuning: 0.25, interference: 0.1, mix: 0.8 },
      },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { feedback: 0.45, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'section-behind',
    name: 'Section behind',
    category: 'texture',
    description:
      'A string section swells in behind each chord and follows the harmony, set in a soft plate.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Strings behind' },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'strings-above',
    name: 'Strings above',
    category: 'texture',
    description:
      'A section an octave above what you play rises slowly over it and drifts off into a hall.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Octave halo' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  // Pitch: shimmer, harmonizer, frequency shifting.
  {
    id: 'octave-halo',
    name: 'Octave halo',
    category: 'pitch',
    description: 'A long reverb that climbs an octave on every pass, a soft choir above the notes.',
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { shimmer: 0.65, decay: 12, mix: 0.45 },
      },
    ],
  },
  {
    id: 'harmony-in-thirds',
    name: 'Harmony in thirds',
    category: 'pitch',
    description: 'A third above and a sixth below a single line, in C major, in a small room.',
    effects: [
      { deviceId: 'lattice', preset: 'Diatonic thirds', params: { output: 7 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'octave-cascade',
    name: 'Octave cascade',
    category: 'pitch',
    description: 'Echoes that jump an octave each time they repeat, left and right, into a plate.',
    effects: [
      { deviceId: 'lattice', preset: 'Crystal cascade', params: { output: 5 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'shifter-drift',
    name: 'Shifter drift',
    category: 'pitch',
    description:
      'Partials moved by less than a hertz and fed back: slow beating like detuned tape.',
    effects: [{ deviceId: 'freq-shifter', preset: 'Slow drift' }],
  },
  {
    id: 'rising-fifths',
    name: 'Rising fifths',
    category: 'pitch',
    description: 'A reverb whose tail drifts up a fifth the longer it rings.',
    effects: [{ deviceId: 'bloom-reverb', preset: 'Rising fifths' }],
  },

  {
    id: 'hopping-echoes',
    name: 'Hopping echoes',
    category: 'pitch',
    description:
      'Analog repeats whose clock steps every two echoes, so they leap an octave up and drop back, blurred in a hall.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Octave hops', params: { feedback: 0.55, mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'wide-halo',
    name: 'Wide halo',
    category: 'pitch',
    description:
      'A sharp copy on the left and a flat copy on the right, darkened and hung in a plate.',
    effects: [
      { deviceId: 'micro-shift', preset: 'Treated piano' },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'detune-spiral',
    name: 'Detune spiral',
    category: 'pitch',
    description: 'Repeats that climb on the left and sink on the right as they blur into a hall.',
    effects: [
      { deviceId: 'micro-shift', preset: 'Spiral', params: { feedback: 0.55 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slowed-under',
    name: 'Slowed under',
    category: 'pitch',
    description:
      'Your playing again an octave down at half speed, dark and continuous, under the dry signal and into a plate.',
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'half-time-chops',
    name: 'Half time chops',
    category: 'pitch',
    description:
      'Half-second chunks of what you play, an octave down and half as fast, repeating as a rhythm with a quiet tape echo behind.',
    effects: [
      { deviceId: 'half-speed', preset: 'Slow chops' },
      { deviceId: 'tape-echo', preset: 'Discreet', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'octave-above',
    name: 'Octave above',
    category: 'pitch',
    description: 'A clean octave up beside the dry sound, softened by a plate.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave up', params: { mode: 3, mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'pad-fifth-halo',
    name: 'Pad fifth halo',
    category: 'pitch',
    description: 'A wide fifth above held chords, every note moved cleanly, blurred in a plate.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad fifth above' },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'interval-ghosts',
    name: 'Interval ghosts',
    category: 'pitch',
    description:
      'A cave whose echoes jump by fourths and fifths on their own, softened by a plate.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Interval ghosts', params: { mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  // Master: last on the mix.
  {
    id: 'gentle-glue',
    name: 'Gentle glue',
    category: 'master',
    description: 'A few decibels of soft saturation and a limiter that only catches peaks.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm Glue', params: { driveDb: 3, outputDb: -4 } },
      { deviceId: 'limiter-1176', params: { inputGain: 3, outputGain: -3 } },
    ],
  },
  {
    id: 'wide-and-safe',
    name: 'Wide and safe',
    category: 'master',
    description:
      'A little more side signal with the bass kept in the middle, then a safety limiter.',
    effects: [
      { deviceId: 'stereo-widener', params: { width: 0.62 } },
      { deviceId: 'limiter-1176', preset: 'Safety' },
    ],
  },
  {
    id: 'tape-master',
    name: 'Tape master',
    category: 'master',
    description:
      'The mix printed to clean tape at fifteen inches a second, a touch wider, then limited.',
    effects: [
      { deviceId: 'tape', preset: 'Studio master', params: { drive: 0.25, hiss: 0 } },
      { deviceId: 'stereo-widener', params: { width: 0.56 } },
      { deviceId: 'limiter-1176', preset: 'Safety' },
    ],
  },
  {
    id: 'ambient-master',
    name: 'Ambient master',
    category: 'master',
    description:
      'Made for long layered sound: what rings on is eased, swells are ridden over seconds, and a true-peak ceiling holds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master' },
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
]
