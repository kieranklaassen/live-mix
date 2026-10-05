// Shedding Oxide: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'oxide-thinning-drone',
    name: 'Thinning drone',
    category: 'space',
    description:
      'Four long strings on an A minor chord held in the centre, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Centre drone' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 32.9, modRate: 0.111 } },
    ],
  },
  {
    id: 'oxide-hall-off-the-shelf',
    name: 'Hall off the shelf',
    category: 'space',
    description:
      'A gentle low-pass at a kilohertz, into a plain hall with about four seconds of tail.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { lfoRateHz: 0.909, envAttackMs: 8.95, envReleaseMs: 221 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 3.53, breathRate: 0.309 } },
    ],
  },
  {
    id: 'oxide-slow-spool-waves',
    name: 'Slow-spool waves',
    category: 'space',
    description:
      'A cassette with a full head bump and a rolled-off top, into a reverb that swells and ebbs in waves of about four seconds.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'shaped-reverb', preset: 'Slow tide', params: { time: 3.73 } },
    ],
  },
  {
    id: 'oxide-tired-shade',
    name: 'Tired shade',
    category: 'space',
    description:
      'A dark reverb that rises backwards and leaves a dim tail, then a trace of dull detuned copies at the edges.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Ghost' },
      { deviceId: 'stereo-detune', preset: 'Faint width', params: { delay: 13.9 } },
    ],
  },
  {
    id: 'oxide-attic-halo',
    name: 'Attic halo',
    category: 'space',
    description:
      'A slow breathing level, then a mellow reverb whose tail drifts down towards the fifth, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.281 } },
      { deviceId: 'bloom-reverb', preset: 'Falling fifths', params: { decay: 9.35 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'oxide-ferric-wash',
    name: 'Ferric wash',
    category: 'space',
    description:
      'A fast reel with no hiss, driven hard so peaks are squashed, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'tape', preset: 'Hot glue', params: { output: -4.29 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'oxide-wash-played-thin',
    name: 'Wash played thin',
    category: 'space',
    description:
      'An equaliser that adds lows and body and eases the top, into a huge slow wash that swells in and hangs with no dry sound.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.4 } },
      { deviceId: 'expanse', preset: 'Wash alone' },
    ],
  },
  {
    id: 'oxide-yellowed-strings',
    name: 'Yellowed strings',
    category: 'space',
    description:
      'A subsonic cut with the low mids and presence eased a touch, into sixteen strings in E minor heard alone with no dry sound.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone', params: { clearTime: 1.67 } },
      { deviceId: 'sympathetic', preset: 'Strings alone' },
    ],
  },
  {
    id: 'oxide-crumbling-gate',
    name: 'Crumbling gate',
    category: 'space',
    description:
      'A valve stage driven hard until it thickens and sags, into a short burst of reverb that holds and stops dead.',
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { output: -6.18 } },
      { deviceId: 'shaped-reverb', preset: 'Gated' },
    ],
  },
  {
    id: 'oxide-muffled-wash',
    name: 'Muffled wash',
    category: 'space',
    description:
      'A dark cellar of a room that folds the sound to mono, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { mix: 0.24 } },
      {
        deviceId: 'ether-reverb',
        preset: 'Dark infinite',
        params: { predelayMs: 53.8, mix: 0.15 },
      },
    ],
  },
  {
    id: 'oxide-afternoon-pool',
    name: 'Afternoon pool',
    category: 'echo',
    description:
      'A wide, muffled loop of the last phrase, as if under water, then a dull, wobbling, saturated echo on worn tape.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Underwater' },
      { deviceId: 'tape-echo', preset: 'Worn tape' },
    ],
  },
  {
    id: 'oxide-slowed-loop',
    name: 'Slowed loop',
    category: 'echo',
    description:
      'A tape loop at half speed, an octave down and darker, then dotted tape repeats that pile up in a darkening wash.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down' },
      { deviceId: 'tape-echo', preset: 'Dub wash' },
    ],
  },
  {
    id: 'oxide-loop-on-the-shelf',
    name: 'Loop on the shelf',
    category: 'echo',
    description:
      'A short loop at an eighth of the sample rate, dull and plain, then a dull, wobbling, saturated echo on worn tape.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Sampler grit', params: { length: 0.972 } },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 611 } },
    ],
  },
  {
    id: 'oxide-stretched-loop',
    name: 'Stretched loop',
    category: 'echo',
    description:
      'A loop of the last phrase at half speed, an octave down, then a slow echo with a long dark trail and a few recollections.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed' },
      {
        deviceId: 'echo-memory',
        preset: 'Dark trail',
        params: { time: 1010, reach: 30.9, size: 5.26 },
      },
    ],
  },
  {
    id: 'oxide-flaking-tide',
    name: 'Flaking tide',
    category: 'echo',
    description:
      'Long backwards phrases an octave down, dark and slow, then a wash of three fed-back tape heads that hovers and fades.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Undertow' },
      { deviceId: 'tape-echo', preset: 'Hovering wash' },
    ],
  },
  {
    id: 'oxide-bandstand-echo',
    name: 'Bandstand echo',
    category: 'echo',
    description:
      'A dull hard clipper with no oversampling, so it aliases, then a slow echo with a long dark trail and a few recollections.',
    effects: [
      { deviceId: 'saturator', preset: 'Lo-fi' },
      {
        deviceId: 'echo-memory',
        preset: 'Dark trail',
        params: { time: 1040, reach: 31.6, size: 4.87 },
      },
    ],
  },
  {
    id: 'oxide-rewound-undertow',
    name: 'Rewound undertow',
    category: 'echo',
    description:
      'Long backwards phrases an octave down, dark and slow, then two copies far out of tune that sway like a worn tape.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Undertow', params: { time: 2150 } },
      { deviceId: 'stereo-detune', preset: 'Seasick', params: { delay: 23.1 } },
    ],
  },
  {
    id: 'oxide-boxed-fog',
    name: 'Boxed fog',
    category: 'echo',
    description:
      'Soft clipping, a little bright, laid under the clean sound, then a dark fog of slow backwards swells, then a hovering tape wash.',
    effects: [
      { deviceId: 'saturator', preset: 'Drum bus crunch' },
      { deviceId: 'reverse-delay', preset: 'Dark fog' },
      { deviceId: 'tape-echo', preset: 'Hovering wash' },
    ],
  },
  {
    id: 'oxide-unmarked-loop',
    name: 'Unmarked loop',
    category: 'echo',
    description:
      'A loop of the last phrase at half speed, an octave down, into a soft slap close behind each note.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed', params: { length: 2.23 } },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 90.1, modRate: 0.576 } },
    ],
  },
  {
    id: 'oxide-rust-red-haze',
    name: 'Rust-red haze',
    category: 'echo',
    description:
      'A wash of three fed-back tape heads that hovers and fades, into a single dull spring in the centre that is barely heard.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Hovering wash', params: { time: 820 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { decay: 1.71 } },
    ],
  },
  {
    id: 'oxide-archive-clock',
    name: 'Archive clock',
    category: 'echo',
    description:
      'A slow, dull echo from a worn-out bucket-brigade line, into a short diffuse haze around the sound, like a small room.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Noisy clock', params: { modRate: 0.67 } },
      { deviceId: 'spectral-blur', preset: 'Diffuse room' },
    ],
  },
  {
    id: 'oxide-chewed-murk',
    name: 'Chewed murk',
    category: 'echo',
    description:
      'A slow murky bucket-brigade echo with dull, worn repeats, then a wobbling tape double a moment behind each note.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky' },
      { deviceId: 'tape-echo', preset: 'Wobbly double' },
    ],
  },
  {
    id: 'oxide-basement-loop',
    name: 'Basement loop',
    category: 'echo',
    description:
      'A tape loop at half speed, an octave down and darker, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down', params: { length: 8.07 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'oxide-sunlit-gallop',
    name: 'Sunlit gallop',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, then a slow echo with a long dark trail and a few recollections.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 643 } },
      {
        deviceId: 'echo-memory',
        preset: 'Dark trail',
        params: { time: 1030, reach: 30.1, size: 4.38 },
      },
    ],
  },
  {
    id: 'oxide-loop-unlabelled',
    name: 'Loop unlabelled',
    category: 'echo',
    description:
      'A loop of the last phrase played backwards as a bed, into a space whose tail flutters quickly in pitch.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Reverse bed', params: { length: 3.3 } },
      { deviceId: 'expanse', preset: 'Fast flutter', params: { decay: 4.39, modRate: 4.49 } },
    ],
  },
  {
    id: 'oxide-half-erased-sampler',
    name: 'Half-erased sampler',
    category: 'echo',
    description:
      'A dull eighth-rate loop, then a rumble cut and a single decibel of presence, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Sampler grit', params: { length: 0.941 } },
      { deviceId: 'ambient-eq', preset: 'Keys' },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 20.3 } },
    ],
  },
  {
    id: 'oxide-spliced-swells',
    name: 'Spliced swells',
    category: 'echo',
    description:
      'Slow backwards swells that rise and die behind the playing, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1780 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { decay: 22.4, preDelay: 41.5 } },
    ],
  },
  {
    id: 'oxide-flaking-echo',
    name: 'Flaking echo',
    category: 'echo',
    description:
      'A few decibels of soft saturation with the top eased, then a tape echo whose warm repeats soften as they fade.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: -4.97 } },
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { time: 397 } },
    ],
  },
  {
    id: 'oxide-loop-on-pass-forty',
    name: 'Loop on pass forty',
    category: 'tape',
    description:
      'A wearing tape loop, then a four-track cassette, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out' },
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 15.1, modRate: 0.312 } },
    ],
  },
  {
    id: 'oxide-brown-loop',
    name: 'Brown loop',
    category: 'tape',
    description:
      'A faint tape loop, then a worn dictation cassette, into a long dark reverb whose tail sinks slowly in pitch.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Faint afterimage' },
      { deviceId: 'tape', preset: 'Old dictation', params: { output: 3.28 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark' },
    ],
  },
  {
    id: 'oxide-hissing-reel',
    name: 'Hissing reel',
    category: 'tape',
    description:
      'A half-speed tape loop in reverse, low and dark, then an old slow reel that drifts, dulls and drops out, into a dull mono tunnel.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards', params: { length: 3.93 } },
      { deviceId: 'tape', preset: 'Worn thin', params: { output: 2.47 } },
      { deviceId: 'expanse', preset: 'Narrow tunnel' },
    ],
  },
  {
    id: 'oxide-loop-under-dust',
    name: 'Loop under dust',
    category: 'tape',
    description:
      'A wearing tape loop, then a four-track cassette, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 2.97 } },
      { deviceId: 'tape', preset: 'Cassette four-track' },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { preDelay: 20.7, lowDecay: 3.95, midDecay: 4.4 },
      },
    ],
  },
  {
    id: 'oxide-forgotten-loop',
    name: 'Forgotten loop',
    category: 'tape',
    description:
      'A tape loop that wears thinner and duller on every pass, then a muffled cassette, into a slow dark swell.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out' },
      { deviceId: 'tape', preset: 'Under a blanket', params: { output: 2.01 } },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'oxide-seventh-year-loop',
    name: 'Seventh-year loop',
    category: 'tape',
    description:
      'A faint tape loop, then a four-track cassette, dull on top, unsteady and hissing, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Faint afterimage', params: { length: 3.54 } },
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 15.7 } },
    ],
  },
  {
    id: 'oxide-crumbling-rumble',
    name: 'Crumbling rumble',
    category: 'tape',
    description:
      'A mangled cassette, then the low rumble of an empty room, left running, into a faint scatter of echoes just behind the sound.',
    effects: [
      { deviceId: 'tape', preset: 'Chewed cassette' },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { response: 0.408, hold: 20.2 } },
      {
        deviceId: 'swarm-reverb',
        preset: 'Faint scatter',
        params: { length: 0.246, glide: 0.606 },
      },
    ],
  },
  {
    id: 'oxide-dust-in-late-light',
    name: 'Dust in late light',
    category: 'tape',
    description:
      'An old slow reel that drifts, dulls and drops out, then crackle between the notes, into a small chapel with a short sung eh in its tail.',
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'noise-floor', preset: 'Gap crackle' },
      { deviceId: 'vowel-reverb', preset: 'Chapel' },
    ],
  },
  {
    id: 'oxide-chewed-hiss',
    name: 'Chewed hiss',
    category: 'tape',
    description:
      'An old slow reel that drifts, dulls and drops out, then steady tape hiss that lingers after the last note, into a short scattering room.',
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { response: 0.353, hold: 11.4 } },
      { deviceId: 'bloom-reverb', preset: 'Quick sparkle' },
    ],
  },
  {
    id: 'oxide-fading-static',
    name: 'Fading static',
    category: 'tape',
    description:
      'A slow reel that sways, then radio static that sounds only with each note played, into the close reflections of a very small room.',
    effects: [
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'noise-floor', preset: 'Static notes' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'oxide-fortieth-pass-reel',
    name: 'Fortieth-pass reel',
    category: 'tape',
    description:
      'A tape preamp overloaded until it breaks up, dull and thick, then dotted tape repeats that bounce from side to side.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape' },
      { deviceId: 'tape-echo', preset: 'Dotted bounce' },
    ],
  },
  {
    id: 'oxide-rusting-record',
    name: 'Rusting record',
    category: 'tape',
    description:
      'A well-played record, dulled, swaying, with ticks and pops, into the drifting tail of a long reverb with no dry sound.',
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find' },
      { deviceId: 'bloom-reverb', preset: 'Tail alone' },
    ],
  },
  {
    id: 'oxide-tape-next-door',
    name: 'Tape next door',
    category: 'tape',
    description:
      'A dull hard clipper with no oversampling, so it aliases, then a four-track cassette, dull on top, unsteady and hissing.',
    effects: [
      { deviceId: 'saturator', preset: 'Lo-fi' },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { output: -3.97 } },
    ],
  },
  {
    id: 'oxide-powdered-sampler',
    name: 'Powdered sampler',
    category: 'tape',
    description:
      'An equaliser that adds lows and body and eases the top, then an early sampler at a low rate, its top filtered away.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.56 } },
      { deviceId: 'patina', preset: 'Muffled sampler', params: { output: -2.17 } },
    ],
  },
  {
    id: 'oxide-lobby-reel',
    name: 'Lobby reel',
    category: 'tape',
    description:
      'A reel of tape at middle speed, with a little drift and hiss, then the surface noise and crackle of an old record.',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'noise-floor', preset: 'Old record', params: { response: 0.447, hold: 7.75 } },
    ],
  },
  {
    id: 'oxide-lobby-station',
    name: 'Lobby station',
    category: 'tape',
    description:
      'A dull eighth-rate loop, then a far radio station, sinking in and out of heavy static, into a huge open valley.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Sampler grit' },
      { deviceId: 'patina', preset: 'Distant station' },
      { deviceId: 'fdn-reverb', preset: 'Open valley' },
    ],
  },
  {
    id: 'oxide-tape-losing-flakes',
    name: 'Tape losing flakes',
    category: 'tape',
    description:
      'A muffled cassette, its top rolled off and its lows lifted, into a small room that is over in about a second.',
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket' },
      {
        deviceId: 'hall-reverb',
        preset: 'Room',
        params: { preDelay: 33.4, lowDecay: 1.55, midDecay: 1.12 },
      },
    ],
  },
  {
    id: 'oxide-static-gone-brown',
    name: 'Static gone brown',
    category: 'tape',
    description:
      'A deep eight-stage phaser with sharp peaks between notches, then a medium-wave radio mixed in low, mostly its static.',
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.21 } },
      { deviceId: 'radio', preset: 'Hint of static' },
    ],
  },
  {
    id: 'oxide-sticky-crackle',
    name: 'Sticky crackle',
    category: 'tape',
    description:
      'A slow rotating speaker heard from across the room, then a badly worn record, swaying in pitch under loud crackle.',
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'patina', preset: 'Scratched record' },
    ],
  },
  {
    id: 'oxide-wavering-reel',
    name: 'Wavering reel',
    category: 'tape',
    description:
      'A slow reel that trembles fast, mixed against the dry sound, into three taut springs kept soft and close to the centre.',
    effects: [
      { deviceId: 'tape', preset: 'Flutter shimmer' },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
    ],
  },
  {
    id: 'oxide-endless-record',
    name: 'Endless record',
    category: 'tape',
    description:
      'A tape loop that never fades, holding every layer, then a worn shellac disc, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Endless hold' },
      { deviceId: 'vinyl', preset: 'Ballroom 78' },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'oxide-late-summer-clipper',
    name: 'Late-summer clipper',
    category: 'tape',
    description:
      'A thick three-voice ensemble chorus that turns slowly, then a dull hard clipper with no oversampling, so it aliases.',
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { rate: 0.554, delayMs: 18.7 } },
      { deviceId: 'saturator', preset: 'Lo-fi' },
    ],
  },
  {
    id: 'oxide-mostly-gaps-valves',
    name: 'Mostly-gaps valves',
    category: 'tape',
    description:
      'Driven amplifier valves heard through a flat speaker, then a flat, unworn record under a thick bed of crackle.',
    effects: [
      { deviceId: 're-amp', preset: 'Just the valves' },
      { deviceId: 'vinyl', preset: 'Crackle bed', params: { spin: 1.41 } },
    ],
  },
  {
    id: 'oxide-iron-thinning-out',
    name: 'Iron thinning out',
    category: 'tape',
    description:
      'A transformer that fills out the lows and dulls the top, then a heavy low shelf that puts weight under the sound.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth', params: { output: -6.73 } },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'oxide-sunlit-platter',
    name: 'Sunlit platter',
    category: 'tape',
    description:
      'A warped record through a dark cartridge, swaying slowly, into a narrow mono shaft of echoes that rings for seconds.',
    effects: [
      { deviceId: 'vinyl', preset: 'Slow platter' },
      { deviceId: 'swarm-reverb', preset: 'Mine shaft' },
    ],
  },
  {
    id: 'oxide-warp-unlabelled',
    name: 'Warp unlabelled',
    category: 'tape',
    description:
      'A badly warped record whose pitch sways once a turn, then a phaser held still, two fixed peaks like a vowel.',
    effects: [
      { deviceId: 'vinyl', preset: 'Warped', params: { spin: 1.39 } },
      { deviceId: 'phaser', preset: 'Still formant', params: { rate: 0.276 } },
    ],
  },
  {
    id: 'oxide-muffled-stream',
    name: 'Muffled stream',
    category: 'tape',
    description:
      'A stream cut off above the mids, as if through a wall, then a record with loud clicks and a scratch on every turn.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Through a wall' },
      { deviceId: 'vinyl', preset: 'Locked scratch', params: { spin: 1.55 } },
    ],
  },
  {
    id: 'oxide-run-out-tape',
    name: 'Run-out tape',
    category: 'tape',
    description:
      'A console channel run hot with its level pulled back down, then a worn dictation cassette, dull, trembling and full of hiss.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Hot channel' },
      { deviceId: 'tape', preset: 'Old dictation', params: { output: -3.59 } },
    ],
  },
  {
    id: 'oxide-coil-kept-too-long',
    name: 'Coil kept too long',
    category: 'tape',
    description:
      'A transformer overloaded into a thick, loose fuzz, then the low rumble of an empty room, left running.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron melt' },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { response: 0.419, hold: 18 } },
    ],
  },
  {
    id: 'oxide-dusty-warp',
    name: 'Dusty warp',
    category: 'tape',
    description:
      'A high cut set low enough to muffle everything, then a badly warped record, then dotted tape repeats that pile up in a darkening wash.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.68 } },
      { deviceId: 'vinyl', preset: 'Warped', params: { spin: 1.68 } },
      { deviceId: 'tape-echo', preset: 'Dub wash', params: { time: 778 } },
    ],
  },
  {
    id: 'oxide-wobble-gone-brown',
    name: 'Wobble gone brown',
    category: 'motion',
    description:
      'A deep pitch wobble in the centre, like a warped tape, into a two-spring tank with its input driven into saturation.',
    effects: [
      { deviceId: 'chorus', preset: 'Warped tape' },
      { deviceId: 'spring-reverb', preset: 'Overdriven tank', params: { decay: 1.96 } },
    ],
  },
  {
    id: 'oxide-fortieth-pass-rotor',
    name: 'Fortieth-pass rotor',
    category: 'motion',
    description:
      'A slow rotating speaker that is mostly its low, dark drum, then a bucket-brigade echo with a slow chorus on its repeats.',
    effects: [
      { deviceId: 'rotary', preset: 'Dark drum' },
      { deviceId: 'analog-delay', preset: 'Chorused' },
    ],
  },
  {
    id: 'oxide-tired-swirl',
    name: 'Tired swirl',
    category: 'motion',
    description:
      'A phaser swirl about a quarter of a minute round, then a badly warped record whose pitch sways once a turn.',
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.0654 } },
      { deviceId: 'vinyl', preset: 'Warped', params: { spin: 1.58 } },
    ],
  },
  {
    id: 'oxide-slow-spool-chorus',
    name: 'Slow-spool chorus',
    category: 'motion',
    description:
      'A warm amplifier stack, then a slow record-warp chorus, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack' },
      { deviceId: 'vinyl', preset: 'Warp chorus', params: { spin: 1.59 } },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'oxide-leader-wobble',
    name: 'Leader wobble',
    category: 'motion',
    description:
      'A deep pitch wobble with the two sides bending out of step, into a big muffled cave that rings for about six seconds.',
    effects: [
      { deviceId: 'tremolo', preset: 'Wide wobble', params: { rate: 2.72 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 5.68, breathRate: 0.267 } },
    ],
  },
  {
    id: 'oxide-last-pass-rotary',
    name: 'Last-pass rotary',
    category: 'motion',
    description:
      'A rotating speaker on its fast speed, then a plain echo that is a little darker on each repeat.',
    effects: [
      { deviceId: 'rotary', preset: 'Tremolo' },
      {
        deviceId: 'echo-memory',
        preset: 'Plain echo',
        params: { time: 371, reach: 20.4, size: 2.67 },
      },
    ],
  },
  {
    id: 'oxide-flaking-cabinet',
    name: 'Flaking cabinet',
    category: 'motion',
    description:
      'A valve stage that gives way under loud notes, tails rising, then a slow rotating speaker heard through one microphone.',
    effects: [
      { deviceId: 'patina', preset: 'Valve bloom', params: { output: -5.53 } },
      { deviceId: 'rotary', preset: 'Mono cabinet' },
    ],
  },
  {
    id: 'oxide-twice-played-drift',
    name: 'Twice-played drift',
    category: 'motion',
    description:
      'A slow reel whose pitch sways widely and never settles, into a cave whose echoes jump now and then by a fifth or octave.',
    effects: [
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'swarm-reverb', preset: 'Intervals' },
    ],
  },
  {
    id: 'oxide-yellowed-phaser',
    name: 'Yellowed phaser',
    category: 'motion',
    description:
      'A string voice that doubles each note almost at once, then a hollow phaser with peaks where its notches would be.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Doubler' },
      { deviceId: 'phaser', preset: 'Negative notch', params: { rate: 0.227 } },
    ],
  },
  {
    id: 'oxide-brittle-pad',
    name: 'Brittle pad',
    category: 'texture',
    description:
      'A dark, round pad that melts slowly from chord to chord, then a drifting reel laid half against the dry sound, a chorus.',
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 1.11, glide: 2.7 } },
      { deviceId: 'tape', preset: 'Drifting chorus', params: { output: -5.02 } },
    ],
  },
  {
    id: 'oxide-strings-coming-apart',
    name: 'Strings coming apart',
    category: 'texture',
    description:
      'A quiet string pad kept far behind the playing, then a phaser that climbs for about two seconds and snaps back.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Barely there', params: { rise: 1.78, fall: 7.4 } },
      { deviceId: 'phaser', preset: 'Saw riser', params: { rate: 0.543 } },
    ],
  },
  {
    id: 'oxide-brittle-gauze',
    name: 'Brittle gauze',
    category: 'texture',
    description:
      'A faint haze just behind the dry sound, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Faint haze' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'oxide-print-through-drift',
    name: 'Print-through drift',
    category: 'texture',
    description:
      'A blurred loop that never comes round quite the same, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Drifting' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'oxide-powdered-wash',
    name: 'Powdered wash',
    category: 'texture',
    description:
      'A wide, darkened wash in which every note slowly dissolves, into a small room that answers about an eighth of a second late.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.477 } },
      { deviceId: 'ether-reverb', preset: 'Slap room', params: { predelayMs: 129, mix: 0.18 } },
    ],
  },
  {
    id: 'oxide-echo-left-in-sun',
    name: 'Echo left in sun',
    category: 'texture',
    description:
      'A triode valve stage, smoothly overdriven, then grain repeats that fall an octave each time, darkening.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { time: 486, size: 244 } },
    ],
  },
  {
    id: 'oxide-far-dial-stutter',
    name: 'Far-dial stutter',
    category: 'texture',
    description:
      'A tight backwards stutter close behind each note, then a medium-wave set whose dial slides off the station and back.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Tight stutter' },
      { deviceId: 'radio', preset: 'Drifting dial' },
    ],
  },
  {
    id: 'oxide-drone-thinning-out',
    name: 'Drone thinning out',
    category: 'texture',
    description:
      'A dark slow-melting bed, then a reverb that breathes in slow waves over and over, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed' },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { time: 1.93 } },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'oxide-bandstand-glue',
    name: 'Bandstand glue',
    category: 'texture',
    description:
      'A deep, slow compressor that lifts a quiet bed and holds it, into a short mono slap of a few reflections.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Drone bed', params: { makeup: 9.12 } },
      { deviceId: 'shaped-reverb', preset: 'Mono slap' },
    ],
  },
  {
    id: 'oxide-afternoon-felt',
    name: 'Afternoon felt',
    category: 'texture',
    description:
      'A muffled pad with all its top taken off, slow to fade, into a hall whose tail sways in pitch with a trace of the octave.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Felted pad', params: { rise: 0.798, fall: 10.7 } },
      { deviceId: 'shimmer', preset: 'Swaying hall', params: { decay: 3.73, predelay: 18.3 } },
    ],
  },
  {
    id: 'oxide-forgotten-smear',
    name: 'Forgotten smear',
    category: 'texture',
    description:
      'A dark smear of long grains that trails for many seconds, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Dark slow smear', params: { time: 1440 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 8.07 } },
    ],
  },
  {
    id: 'oxide-drone-nearly-gone',
    name: 'Drone nearly gone',
    category: 'texture',
    description:
      'A dark drone looped from each note with the octave below, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'cascade', preset: 'Deep drone', params: { time: 1390 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite' },
    ],
  },
  {
    id: 'oxide-seventh-year-grains',
    name: 'Seventh-year grains',
    category: 'texture',
    description:
      'A soft cloud of grains made from what was just played, then a heavy low shelf that puts weight under the sound.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { size: 242, density: 18 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.28 } },
    ],
  },
  {
    id: 'oxide-sagging-undertow',
    name: 'Sagging undertow',
    category: 'pitch',
    description:
      'A dark half-speed octave kept low under the dry sound, then a dusty record, gently warped, with crackle in the groove.',
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1250 } },
      { deviceId: 'patina', preset: 'Dusty record' },
    ],
  },
  {
    id: 'oxide-seventh-year-wash',
    name: 'Seventh-year wash',
    category: 'pitch',
    description:
      'A blurred half-speed wash an octave down, its cycles uneven, then a new record with a little surface hiss and fine crackle.',
    effects: [
      { deviceId: 'half-speed', preset: 'Blurred half', params: { length: 437 } },
      { deviceId: 'vinyl', preset: 'New pressing' },
    ],
  },
  {
    id: 'oxide-fifth-in-a-shoebox',
    name: 'Fifth in a shoebox',
    category: 'pitch',
    description:
      'Scattered grains a fifth down, spread across both sides, then a badly worn record, swaying in pitch under loud crackle.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down grains' },
      { deviceId: 'patina', preset: 'Scratched record' },
    ],
  },
  {
    id: 'oxide-fifth-next-door',
    name: 'Fifth next door',
    category: 'pitch',
    description:
      'A slowed copy a fifth below, running on beside the dry sound, then a mangled cassette that lurches, trembles and drops out.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down bed', params: { length: 1800 } },
      { deviceId: 'tape', preset: 'Chewed cassette' },
    ],
  },
  {
    id: 'oxide-old-stock-octave',
    name: 'Old-stock octave',
    category: 'pitch',
    description:
      'A muffled half-speed octave below, all lows, in the middle, then a worn cassette that wobbles, drops out and hisses.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor' },
      { deviceId: 'patina', preset: 'Worn cassette' },
    ],
  },
  {
    id: 'oxide-shedding-octave',
    name: 'Shedding octave',
    category: 'pitch',
    description:
      'An unbroken half-speed bed an octave down, with no dry sound, into a hint of a two-spring tank behind the sound.',
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { length: 2430 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { decay: 1.48 } },
    ],
  },
  {
    id: 'oxide-grains-coming-apart',
    name: 'Grains coming apart',
    category: 'pitch',
    description:
      'A hard-clipped copy held at one level under the clean sound, then faint reversed grains that glide up an octave within seconds.',
    effects: [
      { deviceId: 'saturator', preset: 'Sustain bed' },
      { deviceId: 'spectral-drifter', preset: 'Rising glide' },
    ],
  },
  {
    id: 'oxide-octaves-in-a-shoebox',
    name: 'Octaves in a shoebox',
    category: 'pitch',
    description:
      "A smooth swell on every note, like a string section's bows, then an octave above and an octave below, clean on chords.",
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 332, release: 559 } },
      { deviceId: 'pitch-shifter', preset: 'Octaves both' },
    ],
  },
  {
    id: 'oxide-old-stock-loop',
    name: 'Old-stock loop',
    category: 'pitch',
    description:
      'A loop of the last phrase at half speed, an octave down, into a dark reverb that rises backwards and leaves a dim tail.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed' },
      { deviceId: 'shaped-reverb', preset: 'Ghost' },
    ],
  },
  {
    id: 'oxide-boxed-undertow',
    name: 'Boxed undertow',
    category: 'pitch',
    description:
      'A compressor as slow as a hand on a fader, then a dark octave underneath, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader', params: { release: 18.3, makeup: -1.06 } },
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1150 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 65.8 } },
    ],
  },
  {
    id: 'oxide-motor-down-undertow',
    name: 'Motor-down undertow',
    category: 'pitch',
    description:
      'A volume-pedal swell, then whole phrases dragged out at half speed, an octave down, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal' },
      { deviceId: 'half-speed', preset: 'Long drag', params: { length: 3980 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { predelayMs: 43.6, mix: 0.248 } },
    ],
  },
  {
    id: 'oxide-slowed-replay',
    name: 'Slowed replay',
    category: 'pitch',
    description:
      'A half-speed replay an octave down, with no dry sound, then a warped record through a dark cartridge, swaying slowly.',
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed' },
      { deviceId: 'vinyl', preset: 'Slow platter', params: { spin: 5.13 } },
    ],
  },
  {
    id: 'oxide-run-out-descent',
    name: 'Run-out descent',
    category: 'pitch',
    description:
      'Grains fed back a fourth down, sinking lower each pass, then detuned copies of the highs only, the body left as it was.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Sinking spiral', params: { size: 486, density: 8.85 } },
      { deviceId: 'stereo-detune', preset: 'Top only' },
    ],
  },
  {
    id: 'oxide-tide-gone-brown',
    name: 'Tide gone brown',
    category: 'pitch',
    description:
      'Long backwards phrases an octave down, dark and slow, then a worn record through a dark, dull cartridge.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Undertow', params: { time: 2440 } },
      { deviceId: 'vinyl', preset: 'Dull stylus' },
    ],
  },
  {
    id: 'oxide-iron-on-old-stock',
    name: 'Iron on old stock',
    category: 'master',
    description:
      'A low-heavy transformer, then a low cut with some air, then a low ceiling with the sound pushed hard up against it.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'ambient-eq', preset: 'Texture' },
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: -0.831 } },
    ],
  },
  {
    id: 'oxide-fader-losing-flakes',
    name: 'Fader losing flakes',
    category: 'master',
    description:
      'A slow compressor that evens out swells over seconds, then a fast limiter pushed so that soft and loud notes even out.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 299, release: 2.06 } },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'oxide-far-dial-cassette',
    name: 'Far-dial cassette',
    category: 'master',
    description:
      'A cassette with a full head bump and a rolled-off top, then a warm, full equaliser, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.55 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 5.84, gain: -2.62 } },
    ],
  },
  {
    id: 'oxide-baked-tape',
    name: 'Baked tape',
    category: 'master',
    description:
      'A reel of tape, then a parallel compressor that lifts quiet playing and tails, then a low, breathing ceiling.',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 446, release: 2.85 } },
      { deviceId: 'ambient-limiter', preset: 'Breathing', params: { release: 0.272, gain: 0.558 } },
    ],
  },
  {
    id: 'oxide-dusty-trace',
    name: 'Dusty trace',
    category: 'master',
    description:
      'A faint hall tail of about three seconds, then a low ceiling with the sound pushed hard up against it.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { release: 1.4, gain: 3.12 } },
    ],
  },
  {
    id: 'oxide-basement-sides',
    name: 'Basement sides',
    category: 'master',
    description:
      'A lift of presence and air, then the sides lifted a little, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright', params: { clearTime: 0.602 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -4.62 } },
    ],
  },
]
