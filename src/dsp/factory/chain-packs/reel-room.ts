// Indiana Reel Room: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'reel-room-haymow-plate',
    name: 'Haymow plate',
    category: 'space',
    description:
      'A high cut set low enough to muffle everything, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.58 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'reel-room-pinch-roller-well',
    name: 'Pinch-roller well',
    category: 'space',
    description:
      'A deep dark well of slow blurred echoes, then a compressor as slow as a hand on a fader.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { length: 1.12, glide: 0.645 } },
      { deviceId: 'ambient-comp', preset: 'Slow fader' },
    ],
  },
  {
    id: 'reel-room-ground-fog-depths',
    name: 'Ground-fog depths',
    category: 'space',
    description:
      'A small room that is over in about a second, into a deep dark well of slow blurred echoes.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Room' },
      { deviceId: 'swarm-reverb', preset: 'Dark well' },
    ],
  },
  {
    id: 'reel-room-bleacher-wash',
    name: 'Bleacher wash',
    category: 'space',
    description:
      'A reel driven as hard as it goes, thick with harmonics, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 63.4 } },
    ],
  },
  {
    id: 'reel-room-capstan-halo',
    name: 'Capstan halo',
    category: 'space',
    description:
      'A string pad with a second section an octave above, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Octave halo' },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 5.8, modRate: 0.443 } },
    ],
  },
  {
    id: 'reel-room-hall-slow-to-go',
    name: 'Hall slow to go',
    category: 'space',
    description:
      'An equaliser that takes presence, air and lows away, then a small dark room, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.59 } },
      { deviceId: 'expanse', preset: 'Small dark room' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'reel-room-razor-cut-chamber',
    name: 'Razor-cut chamber',
    category: 'space',
    description:
      'A transformer that fills out the lows and dulls the top, into a tight chamber close round the sound for about a second.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { preDelay: 21.7 } },
    ],
  },
  {
    id: 'reel-room-plate-before-snow',
    name: 'Plate before snow',
    category: 'space',
    description:
      'A far-off plate with a long soft tail and little dry sound, then a heavy low shelf that puts weight under the sound.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.49 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.34 } },
    ],
  },
  {
    id: 'reel-room-low-speed-depths',
    name: 'Low-speed depths',
    category: 'space',
    description:
      'A slow compressor that evens out swells over seconds, then a long dark reverb whose tail sinks slowly in pitch, into a far-off hall.',
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Level',
        params: { attack: 275, release: 2.06, makeup: 5.84 },
      },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { decay: 26 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { lowDecay: 4.39, midDecay: 3.97 } },
    ],
  },
  {
    id: 'reel-room-linoleum-hall',
    name: 'Linoleum hall',
    category: 'space',
    description:
      'An equaliser that adds lows and body and eases the top, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.36 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 62.1, lowDecay: 7.95, midDecay: 2.19 },
      },
    ],
  },
  {
    id: 'reel-room-halo-on-risers',
    name: 'Halo on risers',
    category: 'space',
    description:
      'A slow swell after each silence that opens only at the end, into a mellow reverb whose tail splits upwards and downwards.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1450, release: 878 } },
      { deviceId: 'bloom-reverb', preset: 'Scatter' },
    ],
  },
  {
    id: 'reel-room-nave-by-the-barn',
    name: 'Nave by the barn',
    category: 'space',
    description:
      'A mid-forward tone with the lows and the top trimmed, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.38 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Vast nave',
        params: { lowDecay: 7.5, midDecay: 7.26, mix: 0.3 },
      },
    ],
  },
  {
    id: 'reel-room-half-track-cave',
    name: 'Half-track cave',
    category: 'space',
    description:
      'The level rising and falling at random, like surf, into a long blurred cave that slides slowly between intervals.',
    effects: [
      { deviceId: 'tremolo', preset: 'Sea swell' },
      { deviceId: 'swarm-reverb', preset: 'Slow stretch' },
    ],
  },
  {
    id: 'reel-room-bounce-down-hall',
    name: 'Bounce-down hall',
    category: 'space',
    description:
      'A valve stage driven hard until it thickens and sags, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { output: -4.39 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'reel-room-joist-cathedral',
    name: 'Joist cathedral',
    category: 'space',
    description:
      'A tape-style curve only just leaned on, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth', params: { outputDb: -10.4 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { predelayMs: 35.1 } },
    ],
  },
  {
    id: 'reel-room-snow-fence-frost',
    name: 'Snow-fence frost',
    category: 'space',
    description:
      'A steep low-pass at four hundred hertz, the top gone, into a dark reverb whose tail sags slowly out of tune.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { lfoRateHz: 1.06, envAttackMs: 9, envReleaseMs: 186 },
      },
      { deviceId: 'bloom-reverb', preset: 'Winter drift', params: { decay: 13.1 } },
    ],
  },
  {
    id: 'reel-room-grease-pencil-wash',
    name: 'Grease-pencil wash',
    category: 'space',
    description:
      'A huge slow wash that swells in and hangs with no dry sound, then a fast reel with no hiss, driven hard so peaks are squashed.',
    effects: [
      { deviceId: 'expanse', preset: 'Wash alone' },
      { deviceId: 'tape', preset: 'Hot glue' },
    ],
  },
  {
    id: 'reel-room-feed-mill-mirror',
    name: 'Feed-mill mirror',
    category: 'echo',
    description:
      'Reversed recollections, then a four-track cassette, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Backwards' },
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 15.6, modRate: 0.299 } },
    ],
  },
  {
    id: 'reel-room-reel-tail-first',
    name: 'Reel tail first',
    category: 'echo',
    description:
      'A half-speed tape loop in reverse, low and dark, then a worn dictation cassette, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards' },
      { deviceId: 'tape', preset: 'Old dictation' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'reel-room-crawl-space-swells',
    name: 'Crawl-space swells',
    category: 'echo',
    description:
      'A dark fog of slow backwards swells, then a four-track cassette, then a dark smear of long grains that trails for many seconds.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Dark fog' },
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'grain-delay', preset: 'Dark slow smear' },
    ],
  },
  {
    id: 'reel-room-february-loop',
    name: 'February loop',
    category: 'echo',
    description:
      'A half-speed tape loop in reverse, low and dark, then a four-track cassette, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards', params: { length: 3.78 } },
      { deviceId: 'tape', preset: 'Cassette four-track' },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 71.2, lowDecay: 7.63, midDecay: 5.35 },
      },
    ],
  },
  {
    id: 'reel-room-swells-by-one-bulb',
    name: 'Swells by one bulb',
    category: 'echo',
    description:
      'A dark fog of slow backwards swells, then a muffled cassette, into a cave whose echoes bend slowly up and down in pitch.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Dark fog', params: { time: 1550 } },
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'swarm-reverb', preset: 'Bending' },
    ],
  },
  {
    id: 'reel-room-lath-replay',
    name: 'Lath replay',
    category: 'echo',
    description:
      'Replays of the last seconds, then a far-off, dulled tone, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Just now' },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.66 } },
      { deviceId: 'expanse', preset: 'Bloom' },
    ],
  },
  {
    id: 'reel-room-pole-barn-hold',
    name: 'Pole-barn hold',
    category: 'echo',
    description:
      'The first phrase played, held an octave down as a dark drone, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Deep drone', params: { length: 2.72 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 16.5 } },
    ],
  },
  {
    id: 'reel-room-late-harvest-mirror',
    name: 'Late-harvest mirror',
    category: 'echo',
    description:
      'A slow reel whose pitch sways widely and never settles, then each phrase answered once by itself played backwards.',
    effects: [
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'reverse-delay', preset: 'Phrase and mirror', params: { time: 2750 } },
    ],
  },
  {
    id: 'reel-room-razor-cut-loop',
    name: 'Razor-cut loop',
    category: 'echo',
    description:
      'A tape loop that wears thinner and duller on every pass, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 3.34 } },
      { deviceId: 'expanse', preset: 'Low cathedral' },
    ],
  },
  {
    id: 'reel-room-stairs-at-harvest',
    name: 'Stairs at harvest',
    category: 'echo',
    description:
      'Backwards repeats that step down an octave each time, into the drifting tail of a long reverb with no dry sound.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Descending steps', params: { time: 554 } },
      { deviceId: 'bloom-reverb', preset: 'Tail alone', params: { decay: 14.2 } },
    ],
  },
  {
    id: 'reel-room-con-sordino-echo',
    name: 'Con-sordino echo',
    category: 'echo',
    description:
      'A short swell that rounds the front off every note, then a dull, wobbling, saturated echo on worn tape.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack' },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 621 } },
    ],
  },
  {
    id: 'reel-room-coal-chute-fall',
    name: 'Coal-chute fall',
    category: 'echo',
    description:
      'An echo that slides down an octave like tape slowed by hand, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Falling tape', params: { time: 554, modRate: 0.305 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { lowDecay: 7.83, midDecay: 7.38 } },
    ],
  },
  {
    id: 'reel-room-chaff-reel',
    name: 'Chaff reel',
    category: 'echo',
    description:
      'A tape loop that wears thinner and duller on every pass, then a dark fog of slow backwards swells.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out' },
      { deviceId: 'reverse-delay', preset: 'Dark fog' },
    ],
  },
  {
    id: 'reel-room-radiator-loop',
    name: 'Radiator loop',
    category: 'echo',
    description:
      'A half-speed tape loop in reverse, low and dark, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards', params: { length: 4.18 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley' },
    ],
  },
  {
    id: 'reel-room-gravel-road-reel',
    name: 'Gravel-road reel',
    category: 'tape',
    description:
      'A swell of about a second that turns struck notes to pads, then a reel of tape, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 858, release: 383 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { output: 8.74 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { decay: 21, preDelay: 38.4 } },
    ],
  },
  {
    id: 'reel-room-oxide-down-a-row',
    name: 'Oxide down a row',
    category: 'tape',
    description:
      'A first-note swell, then an old slow reel that drifts, dulls and drops out, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'swell', preset: 'First note only', params: { attack: 1640, release: 1360 } },
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 44.3 } },
    ],
  },
  {
    id: 'reel-room-linoleum-cassette',
    name: 'Linoleum cassette',
    category: 'tape',
    description:
      'A volume-pedal swell, then a worn dictation cassette, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal' },
      { deviceId: 'tape', preset: 'Old dictation' },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 22, modRate: 0.222 } },
    ],
  },
  {
    id: 'reel-room-tape-all-winter',
    name: 'Tape all winter',
    category: 'tape',
    description:
      'A slow swell after each silence, with some dry attack left, then a reel of tape, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow' },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 59.1 } },
    ],
  },
  {
    id: 'reel-room-corncrib-drift',
    name: 'Corncrib drift',
    category: 'tape',
    description:
      'A longer bowed swell that leans into every note, then a slow reel whose pitch sways widely and never settles, into a dark backwards reverb.',
    effects: [
      { deviceId: 'swell', preset: 'Slow bow' },
      { deviceId: 'tape', preset: 'Seasick', params: { output: 6.84 } },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { time: 1.76, preDelay: 56.3 } },
    ],
  },
  {
    id: 'reel-room-bottomland-hiss',
    name: 'Bottomland hiss',
    category: 'tape',
    description:
      'A worn cassette that wobbles, drops out and hisses, then a trace of tape hiss, even and barely there, into a long plate.',
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'noise-floor', preset: 'Faint hiss', params: { response: 0.368, hold: 12.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 42 } },
    ],
  },
  {
    id: 'reel-room-winter-wheat-mains',
    name: 'Winter-wheat mains',
    category: 'tape',
    description:
      'A worn dictation cassette, then a pure low mains hum in the middle of the sound, into a dark, very long hall.',
    effects: [
      { deviceId: 'tape', preset: 'Old dictation' },
      { deviceId: 'noise-floor', preset: 'Mains hum', params: { response: 0.408, hold: 19.6 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Endless tail',
        params: { decay: 18.4, breathRate: 0.0839 },
      },
    ],
  },
  {
    id: 'reel-room-splice-block-hiss',
    name: 'Splice-block hiss',
    category: 'tape',
    description:
      'A lightly worn reel, then muffled tape hiss with its top taken off, steady and thick, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'noise-floor', preset: 'Muffled hiss' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { preDelay: 89.4, midDecay: 7.17 } },
    ],
  },
  {
    id: 'reel-room-back-desk-tape',
    name: 'Back-desk tape',
    category: 'tape',
    description:
      'A worn cassette that wobbles, drops out and hisses, then steady tape hiss, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'noise-floor', preset: 'Tape floor' },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 6.56, modRate: 0.445 } },
    ],
  },
  {
    id: 'reel-room-second-copy-hiss',
    name: 'Second-copy hiss',
    category: 'tape',
    description:
      'A tape reel pushed hard into thick saturation, then steady tape hiss, into a dark hall that takes about twenty seconds to die away.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'noise-floor', preset: 'Tape floor' },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0824 } },
    ],
  },
  {
    id: 'reel-room-pole-barn-cassette',
    name: 'Pole-barn cassette',
    category: 'tape',
    description:
      'A muffled cassette, its top rolled off and its lows lifted, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'reel-room-killing-frost-tape',
    name: 'Killing-frost tape',
    category: 'tape',
    description:
      'A tape preamp overloaded until it breaks up, dull and thick, into a large hall heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Full wet send',
        params: { decay: 8.11, breathRate: 0.317 },
      },
    ],
  },
  {
    id: 'reel-room-fencerow-tape',
    name: 'Fencerow tape',
    category: 'tape',
    description:
      'A tape preamp driven for thick lows and a dull top, then a low-pass that opens and closes over about half a minute.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -8.86 } },
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0273, envAttackMs: 10.7, envReleaseMs: 183 },
      },
    ],
  },
  {
    id: 'reel-room-reel-behind-lath',
    name: 'Reel behind lath',
    category: 'tape',
    description:
      'A wearing tape loop, then tape hiss that sinks under each note and swells in the gaps, then a hovering tape wash.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 3.01 } },
      {
        deviceId: 'noise-floor',
        preset: 'Breathing tape',
        params: { response: 0.941, hold: 15.3 },
      },
      { deviceId: 'tape-echo', preset: 'Hovering wash' },
    ],
  },
  {
    id: 'reel-room-yard-light-cassette',
    name: 'Yard-light cassette',
    category: 'tape',
    description:
      'A worn cassette that wobbles, drops out and hisses, then an equaliser that adds lows and body and eases the top.',
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { output: -2.34 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'reel-room-cassette-by-the-silo',
    name: 'Cassette by the silo',
    category: 'tape',
    description:
      'A worn cassette that wobbles, drops out and hisses, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 51.2, lowDecay: 4.42, midDecay: 3.09 },
      },
    ],
  },
  {
    id: 'reel-room-reel-in-low-fog',
    name: 'Reel in low fog',
    category: 'tape',
    description:
      'A steep low-pass at four hundred hertz, the top gone, then an old slow reel that drifts, dulls and drops out.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Low-pass gate' },
      { deviceId: 'tape', preset: 'Worn thin', params: { output: -3.08 } },
    ],
  },
  {
    id: 'reel-room-reel-at-a-splice',
    name: 'Reel at a splice',
    category: 'tape',
    description:
      'A half-speed loop, then a reel of tape, into a cloud of reverb that swells in after each note and fades.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed' },
      { deviceId: 'tape', preset: 'Quarter inch', params: { output: 2.12 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom' },
    ],
  },
  {
    id: 'reel-room-cork-grease-tape',
    name: 'Cork-grease tape',
    category: 'tape',
    description:
      'A worn cassette that wobbles, drops out and hisses, into a dark cellar of a room that folds the sound to mono.',
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { output: -2.16 } },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar' },
    ],
  },
  {
    id: 'reel-room-stand-light-cassette',
    name: 'Stand-light cassette',
    category: 'tape',
    description:
      'A far-off combo amp, then a cassette with a full head bump and a rolled-off top, into a thin veil of reverb kept low under the sound.',
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall' },
      { deviceId: 'tape', preset: 'Warm thump', params: { output: -3.07 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { decay: 2.64, breathRate: 0.269 } },
    ],
  },
  {
    id: 'reel-room-slack-spool-reel',
    name: 'Slack-spool reel',
    category: 'tape',
    description:
      'A high cut set low enough to muffle everything, then a tape loop that wears thinner and duller on every pass.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.54 } },
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 3.24 } },
    ],
  },
  {
    id: 'reel-room-loop-on-the-flat',
    name: 'Loop on the flat',
    category: 'tape',
    description:
      'A tape loop that wears thinner and duller on every pass, then dotted tape repeats that pile up in a darkening wash.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out' },
      { deviceId: 'tape-echo', preset: 'Dub wash' },
    ],
  },
  {
    id: 'reel-room-flat-roof-choir',
    name: 'Flat-roof choir',
    category: 'motion',
    description:
      'A held pad whose every overtone wavers, like a choir, into a reverb that breathes in slow waves over and over.',
    effects: [
      { deviceId: 'sustainer', preset: 'Wavering choir', params: { attack: 0.431, glide: 0.543 } },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { time: 1.84 } },
    ],
  },
  {
    id: 'reel-room-breath-in-plaster',
    name: 'Breath in plaster',
    category: 'motion',
    description:
      'A hissing, humming amp, then the level breathing in and out about every four seconds, into a slow tide of reverb.',
    effects: [
      { deviceId: 're-amp', preset: 'Noisy valves', params: { output: 2.4 } },
      { deviceId: 'tremolo', preset: 'Gentle breath' },
      { deviceId: 'shaped-reverb', preset: 'Slow tide', params: { time: 3.87 } },
    ],
  },
  {
    id: 'reel-room-head-gap-chorus',
    name: 'Head-gap chorus',
    category: 'motion',
    description:
      'A valve preamp curve, lopsided and a little brighter on top, then two late copies either side, like loose double-tracking.',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp' },
      { deviceId: 'chorus', preset: 'Loose double', params: { rate: 0.198 } },
    ],
  },
  {
    id: 'reel-room-furrow-echo',
    name: 'Furrow echo',
    category: 'motion',
    description:
      'A wide echo whose repeats drift slowly in pitch, then a gentle low-pass at a kilohertz.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slow drift', params: { time: 650, modRate: 0.0946 } },
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { lfoRateHz: 0.919, envAttackMs: 8.84, envReleaseMs: 179 },
      },
    ],
  },
  {
    id: 'reel-room-tide-out-back',
    name: 'Tide out back',
    category: 'motion',
    description:
      'A swell that takes seconds to rise after each silence, then a low-pass that opens and closes over about half a minute.',
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 2410, release: 710 } },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
    ],
  },
  {
    id: 'reel-room-stubble-choir',
    name: 'Stubble choir',
    category: 'motion',
    description:
      'A transformer overloaded into a thick, loose fuzz, then a choir of a hall whose vowel wanders on its own.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron melt' },
      { deviceId: 'vowel-reverb', preset: 'Vowel drift', params: { decay: 8.37, preDelay: 17.9 } },
    ],
  },
  {
    id: 'reel-room-stovepipe-mist',
    name: 'Stovepipe mist',
    category: 'texture',
    description:
      'A long-hanging wide wash, then a gentle low-pass at a kilohertz, then a parallel compressor that lifts quiet playing and tails.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Endless' },
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { lfoRateHz: 0.88, envAttackMs: 10.6, envReleaseMs: 193 },
      },
      {
        deviceId: 'ambient-comp',
        preset: 'Lift',
        params: { attack: 390, release: 2.95, makeup: 8.18 },
      },
    ],
  },
  {
    id: 'reel-room-slow-arriving-cellos',
    name: 'Slow-arriving cellos',
    category: 'texture',
    description:
      'A dark, low string pad like cellos under the playing, then a heavy low shelf that puts weight under the sound, then a deep, slow compressor.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { fall: 8.19 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.07 } },
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
    ],
  },
  {
    id: 'reel-room-pinch-roller-swell',
    name: 'Pinch-roller swell',
    category: 'texture',
    description:
      'A slow-swelling string pad, then a high cut set low enough to muffle everything, then a very gentle compressor.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Slow swell' },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
      {
        deviceId: 'ambient-comp',
        preset: 'Glue',
        params: { attack: 648, release: 3.93, makeup: 2.25 },
      },
    ],
  },
  {
    id: 'reel-room-ductwork-cellos',
    name: 'Ductwork cellos',
    category: 'texture',
    description:
      'A dark, low string pad like cellos under the playing, then a gentle high cut that shades the top end, then a deep, slow compressor.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { rise: 1.6, fall: 8.13 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.6 } },
      { deviceId: 'ambient-comp', preset: 'Drone bed', params: { attack: 776, release: 9.83 } },
    ],
  },
  {
    id: 'reel-room-line-up-pad',
    name: 'Line-up pad',
    category: 'texture',
    description:
      'A dark, round pad that melts slowly from chord to chord, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 3.91, breathRate: 0.299 } },
    ],
  },
  {
    id: 'reel-room-capstan-strings',
    name: 'Capstan strings',
    category: 'texture',
    description:
      'A dark string pad doubled an octave below the playing, then a muffled cassette, its top rolled off and its lows lifted.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Low section' },
      { deviceId: 'tape', preset: 'Under a blanket' },
    ],
  },
  {
    id: 'reel-room-bow-on-a-siding',
    name: 'Bow on a siding',
    category: 'texture',
    description:
      'A bowed swell at half strength under the dry attacks, into three taut springs kept soft and close to the centre.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 312, release: 160 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
    ],
  },
  {
    id: 'reel-room-radiator-felt',
    name: 'Radiator felt',
    category: 'texture',
    description:
      'A muffled, felted pad, then a single notch drifting slowly up and down the spectrum, into a huge wash by itself.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Felted pad', params: { rise: 0.812, fall: 10.7 } },
      {
        deviceId: 'auto-filter',
        preset: 'Slow notch',
        params: { lfoRateHz: 0.154, envAttackMs: 9.3, envReleaseMs: 181 },
      },
      { deviceId: 'expanse', preset: 'Wash alone', params: { decay: 39.1, modRate: 0.103 } },
    ],
  },
  {
    id: 'reel-room-layers-before-snow',
    name: 'Layers before snow',
    category: 'texture',
    description:
      'A held pad where each new chord piles onto the last, then a gentle low-pass at a kilohertz.',
    effects: [
      { deviceId: 'sustainer', preset: 'Stacked harmony', params: { attack: 0.63, glide: 0.731 } },
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { lfoRateHz: 0.912, envAttackMs: 10.2, envReleaseMs: 186 },
      },
    ],
  },
  {
    id: 'reel-room-sub-by-the-boiler',
    name: 'Sub by the boiler',
    category: 'texture',
    description:
      'A faint layer of reversed grains an octave below the sound, then a low-pass that opens and closes over about half a minute.',
    effects: [
      { deviceId: 'spectral-drifter', preset: 'Sub octave', params: { decay: 5.06 } },
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.032, envAttackMs: 9.1, envReleaseMs: 178 },
      },
    ],
  },
  {
    id: 'reel-room-ploughed-flickers',
    name: 'Ploughed flickers',
    category: 'texture',
    description:
      'Quick glimpses of notes just played, flickering about, then long backwards phrases an octave down, dark and slow.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Flickers',
        params: { time: 309, reach: 11.6, size: 0.247 },
      },
      { deviceId: 'reverse-delay', preset: 'Undertow', params: { time: 1950 } },
    ],
  },
  {
    id: 'reel-room-killing-frost-tide',
    name: 'Killing-frost tide',
    category: 'texture',
    description:
      'Long slow grains an octave down, most of them reversed, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { size: 1000, density: 4.58 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 17.6 } },
    ],
  },
  {
    id: 'reel-room-furrow-pad',
    name: 'Furrow pad',
    category: 'texture',
    description:
      'A slow swell on only the first note after each silence, then a dark, round pad that melts slowly from chord to chord.',
    effects: [
      { deviceId: 'swell', preset: 'First note only', params: { attack: 1490, release: 1550 } },
      { deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 1.13, glide: 2.55 } },
    ],
  },
  {
    id: 'reel-room-minutes-long-glide',
    name: 'Minutes-long glide',
    category: 'texture',
    description:
      'A held pad that takes seconds to melt into each new chord, then a four-track cassette, dull on top, unsteady and hissing.',
    effects: [
      { deviceId: 'sustainer', preset: 'Long glide' },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { output: -2.63 } },
    ],
  },
  {
    id: 'reel-room-fallow-swell',
    name: 'Fallow swell',
    category: 'texture',
    description:
      'A slow swell after each silence, with some dry attack left, into one slow scatter of echoes over about a second and no tail.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1420, release: 276 } },
      { deviceId: 'swarm-reverb', preset: 'Long scatter' },
    ],
  },
  {
    id: 'reel-room-tuning-note-water',
    name: 'Tuning-note water',
    category: 'texture',
    description:
      'A half-deep swell that leaves a ghost of each attack, then a dark, bassy wash, into a big muffled cave that rings for about six seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Ghost pick', params: { attack: 440, release: 140 } },
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.404 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Dark cave',
        params: { decay: 6.14, breathRate: 0.314, mix: 0.27 },
      },
    ],
  },
  {
    id: 'reel-room-drone-in-the-gym',
    name: 'Drone in the gym',
    category: 'texture',
    description:
      'A slow drone that swells from the playing and never fades, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'sustainer', preset: 'Endless drone', params: { attack: 3.27, glide: 4.03 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 9, predelayMs: 122, breathRate: 0.287 },
      },
    ],
  },
  {
    id: 'reel-room-next-county-fog',
    name: 'Next-county fog',
    category: 'texture',
    description:
      'A dense, wide fog of grains that buries the dry sound, then a faint, dull echo with a slow chorus on it.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Thick fog', params: { size: 495 } },
      { deviceId: 'analog-delay', preset: 'Faint halo' },
    ],
  },
  {
    id: 'reel-room-crawl-by-the-boiler',
    name: 'Crawl by the boiler',
    category: 'pitch',
    description:
      'A quarter-speed crawl, then a flaking reel whose sound ducks and dulls at random, then a gentle high cut that shades the top end.',
    effects: [
      { deviceId: 'half-speed', preset: 'Quarter speed', params: { length: 3650 } },
      { deviceId: 'tape', preset: 'Crumbling oxide', params: { output: 2.31 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'reel-room-loop-into-murk',
    name: 'Loop into murk',
    category: 'pitch',
    description:
      'A half-speed tape loop in reverse, low and dark, then a worn dictation cassette, then a steep low-pass at four hundred hertz, the top gone.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards', params: { length: 3.98 } },
      { deviceId: 'tape', preset: 'Old dictation' },
      { deviceId: 'auto-filter', preset: 'Low-pass gate' },
    ],
  },
  {
    id: 'reel-room-rolled-off-octave',
    name: 'Rolled-off octave',
    category: 'pitch',
    description:
      'A smooth octave-down bed, then a dull, wobbling, saturated echo on worn tape, then a steep low-pass at four hundred hertz, the top gone.',
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave' },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 605 } },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { lfoRateHz: 0.988, envAttackMs: 10.1, envReleaseMs: 206 },
      },
    ],
  },
  {
    id: 'reel-room-barn-light-fourth',
    name: 'Barn-light fourth',
    category: 'pitch',
    description:
      'A wide, slowed copy a fourth below that drifts behind, then a lightly worn reel, then an equaliser that takes presence, air and lows away.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth down drift', params: { length: 3260 } },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.64 } },
    ],
  },
  {
    id: 'reel-room-slow-arriving-depths',
    name: 'Slow-arriving depths',
    category: 'pitch',
    description:
      'A copy two octaves down, then a tape reel pushed hard into thick saturation, then an equaliser that adds lows and body and eases the top.',
    effects: [
      { deviceId: 'half-speed', preset: 'Two octaves', params: { length: 1510 } },
      { deviceId: 'patina', preset: 'Reel pushed hard', params: { output: -6.02 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.54 } },
    ],
  },
  {
    id: 'reel-room-pedals-under-tin',
    name: 'Pedals under tin',
    category: 'pitch',
    description:
      'Deep pedal notes two octaves down that swell in slowly, then a heavy low shelf, then dark, thick valve grit.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals' },
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'saturator', preset: 'Bass grit', params: { outputDb: -21.9 } },
    ],
  },
  {
    id: 'reel-room-seed-corn-shadow',
    name: 'Seed-corn shadow',
    category: 'pitch',
    description:
      'A dull copy an octave below, close behind each note, then a high cut set low enough to muffle everything, then an overloaded tape preamp.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Sub shadow' },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.45 } },
      { deviceId: 'analog-drive', preset: 'Worn tape', params: { output: -11.7 } },
    ],
  },
  {
    id: 'reel-room-octave-by-the-deck',
    name: 'Octave by the deck',
    category: 'pitch',
    description:
      'A rounded octave below every note of a chord, then a shaded top end, then the first hint of weight from a tape preamp.',
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'analog-drive', preset: 'First hint', params: { output: -3.26 } },
    ],
  },
  {
    id: 'reel-room-pedals-in-the-gym',
    name: 'Pedals in the gym',
    category: 'pitch',
    description:
      'Slow, deep pedal notes, then an equaliser that takes presence, air and lows away, then a triode valve stage, smoothly overdriven.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals', params: { attack: 1.44 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'analog-drive', preset: 'Triode glow' },
    ],
  },
  {
    id: 'reel-room-seed-corn-blur',
    name: 'Seed-corn blur',
    category: 'pitch',
    description:
      'A blurred half-speed wash an octave down, its cycles uneven, then a worn cassette that wobbles, drops out and hisses.',
    effects: [
      { deviceId: 'half-speed', preset: 'Blurred half', params: { length: 433 } },
      { deviceId: 'patina', preset: 'Worn cassette' },
    ],
  },
  {
    id: 'reel-room-county-line-undertow',
    name: 'County-line undertow',
    category: 'pitch',
    description:
      'A transformer driven so the low end thickens and loosens, then whole phrases dragged out at half speed, an octave down.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { output: -7.04 } },
      { deviceId: 'half-speed', preset: 'Long drag' },
    ],
  },
  {
    id: 'reel-room-tails-out-loop',
    name: 'Tails-out loop',
    category: 'pitch',
    description:
      'A smeared loop run backwards at half speed, an octave down, then layers of held chords that bloom slowly and never fade.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Slow reverse', params: { length: 3.53 } },
      { deviceId: 'sustainer', preset: 'Slow bloom layers', params: { glide: 4.77 } },
    ],
  },
  {
    id: 'reel-room-root-cellar-octave',
    name: 'Root-cellar octave',
    category: 'pitch',
    description:
      'A muffled half-speed octave below, all lows, in the middle, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor' },
      { deviceId: 'hall-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'reel-room-depths-in-the-joists',
    name: 'Depths in the joists',
    category: 'pitch',
    description:
      'A soft bass two octaves below, and a little one octave below, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'octaves', preset: 'Deep' },
      { deviceId: 'expanse', preset: 'Low cathedral' },
    ],
  },
  {
    id: 'reel-room-pole-barn-fifth',
    name: 'Pole-barn fifth',
    category: 'pitch',
    description:
      'A slowed copy a fifth below, running on beside the dry sound, then an old slow reel that drifts, dulls and drops out.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down bed', params: { length: 1650 } },
      { deviceId: 'tape', preset: 'Worn thin' },
    ],
  },
  {
    id: 'reel-room-replay-into-murk',
    name: 'Replay into murk',
    category: 'pitch',
    description:
      'A half-speed replay an octave down, with no dry sound, then a steep low-pass at four hundred hertz, the top gone.',
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed' },
      { deviceId: 'auto-filter', preset: 'Low-pass gate' },
    ],
  },
  {
    id: 'reel-room-ploughed-sub',
    name: 'Ploughed sub',
    category: 'pitch',
    description:
      'The octave below alone, rounded off into a bass, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'octaves', preset: 'Bass alone' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { preDelay: 90.5, lowDecay: 7.15 } },
    ],
  },
  {
    id: 'reel-room-tape-down-a-row',
    name: 'Tape down a row',
    category: 'master',
    description:
      'A tape reel with soft saturation, slight wobble and hiss, then a gentle compressor, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { gain: 2.36 } },
    ],
  },
  {
    id: 'reel-room-stovepipe-hall',
    name: 'Stovepipe hall',
    category: 'master',
    description:
      'A faint hall tail of about three seconds, then a fast limiter with the level lifted a little into it.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 37.4, lowDecay: 2.54, midDecay: 3.23 },
      },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -5.19 } },
    ],
  },
  {
    id: 'reel-room-tape-down-a-duct',
    name: 'Tape down a duct',
    category: 'master',
    description:
      'A tape preamp pushed just enough to add weight, then a low cut that thins the bass, with a little air on top, then an eased-back ceiling.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.61 } },
      { deviceId: 'ambient-limiter', preset: 'Pull back', params: { release: 1.56 } },
    ],
  },
  {
    id: 'reel-room-erase-head-coil',
    name: 'Erase-head coil',
    category: 'master',
    description:
      'A low, warm transformer, then an equaliser that adds lows and body and eases the top, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.55 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { gain: -3.54 } },
    ],
  },
  {
    id: 'reel-room-glue-by-the-barn',
    name: 'Glue by the barn',
    category: 'master',
    description:
      'A mid-forward tone with the lows and the top trimmed, then a parallel compressor, then a low, breathing ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.55 } },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 445, release: 3.24 } },
      {
        deviceId: 'ambient-limiter',
        preset: 'Breathing',
        params: { release: 0.329, gain: -0.177 },
      },
    ],
  },
  {
    id: 'reel-room-tape-by-the-silo',
    name: 'Tape by the silo',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -5.37 } },
    ],
  },
]
