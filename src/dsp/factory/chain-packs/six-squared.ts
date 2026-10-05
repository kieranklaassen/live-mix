// Six Squared: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'six-squared-old-flyer-nave',
    name: 'Old-flyer nave',
    category: 'space',
    description:
      'A transformer driven so the low end thickens and loosens, then a vast nave, then a slow compressor that evens out swells over seconds.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { lowDecay: 7.31, midDecay: 7.05 } },
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 329, release: 2.13 } },
    ],
  },
  {
    id: 'six-squared-night-bus-wash',
    name: 'Night-bus wash',
    category: 'space',
    description:
      'A transformer overloaded into a thick, loose fuzz, then a huge wash by itself, then a firm compressor that listens only above the low end.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron melt' },
      { deviceId: 'expanse', preset: 'Wash alone' },
      {
        deviceId: 'ambient-comp',
        preset: 'Ride the mids',
        params: { attack: 59.8, release: 0.648 },
      },
    ],
  },
  {
    id: 'six-squared-fog-lamp-hall',
    name: 'Fog-lamp hall',
    category: 'space',
    description:
      'A sagging valve stage, then a hall whose lows ring on long after the rest has gone, then a parallel compressor.',
    effects: [
      { deviceId: 'patina', preset: 'Valve bloom' },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 64.7, lowDecay: 7.23, midDecay: 2.15 },
      },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 377, release: 2.75 } },
    ],
  },
  {
    id: 'six-squared-roundabout-hall',
    name: 'Roundabout hall',
    category: 'space',
    description:
      'A cassette with a full head bump and a rolled-off top, then a hall with no dry sound, then a dense, hard compressor.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'fdn-reverb', preset: 'Full wet send' },
      { deviceId: 'ambient-comp', preset: 'Dense pad', params: { release: 2.99 } },
    ],
  },
  {
    id: 'six-squared-comedown-vault',
    name: 'Comedown vault',
    category: 'space',
    description:
      'Dark, thick valve grit, then a cathedral with about six seconds of tail, then a firm, slow compressor that keeps long swells held down.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit' },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 86.4, lowDecay: 6.18, midDecay: 6.24 },
      },
      { deviceId: 'ambient-comp', preset: 'Hold swells', params: { attack: 163, release: 6.14 } },
    ],
  },
  {
    id: 'six-squared-halo-gone-midnight',
    name: 'Halo gone midnight',
    category: 'space',
    description:
      'A reverb whose tail drifts up towards the fifth as it rings, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Rising fifths', params: { decay: 7.22 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { preDelay: 98.7, midDecay: 7.85 } },
    ],
  },
  {
    id: 'six-squared-gasworks-loft',
    name: 'Gasworks loft',
    category: 'space',
    description:
      'A large dark reverb stacking octaves and fifths like pipes, into the drifting tail of a long reverb with no dry sound.',
    effects: [
      { deviceId: 'shimmer', preset: 'Organ loft', params: { decay: 15.1, predelay: 41.9 } },
      { deviceId: 'bloom-reverb', preset: 'Tail alone', params: { decay: 15.9 } },
    ],
  },
  {
    id: 'six-squared-cave-by-the-canal',
    name: 'Cave by the canal',
    category: 'space',
    description:
      'Two late copies either side, like loose double-tracking, into a rush of short echoes that piles up into a cavern.',
    effects: [
      { deviceId: 'chorus', preset: 'Loose double' },
      { deviceId: 'swarm-reverb', preset: 'Cavern', params: { length: 0.471, glide: 0.559 } },
    ],
  },
  {
    id: 'six-squared-gasworks-hall',
    name: 'Gasworks hall',
    category: 'space',
    description:
      'A tape preamp pushed just enough to add weight, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'six-squared-viaduct-hall',
    name: 'Viaduct hall',
    category: 'space',
    description:
      'A damped hall whose tail lasts ten seconds and more, then a compressor that lets each attack through before it levels.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 57.7 } },
      { deviceId: 'ambient-comp', preset: 'Keys', params: { attack: 108, release: 1.33 } },
    ],
  },
  {
    id: 'six-squared-valley-at-half-four',
    name: 'Valley at half four',
    category: 'space',
    description:
      'A huge dark open space that answers late and rings on, then two dark late copies, a shadow either side of the sound.',
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 10.7, predelayMs: 126, breathRate: 0.306 },
      },
      { deviceId: 'stereo-detune', preset: 'Shadow', params: { delay: 28.3 } },
    ],
  },
  {
    id: 'six-squared-remembered-haze',
    name: 'Remembered haze',
    category: 'space',
    description:
      'A tape preamp driven for thick lows and a dull top, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -10.3 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'six-squared-night-long-hall',
    name: 'Night-long hall',
    category: 'space',
    description:
      'Two copies in tune that wander like extra takes, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Drifting', params: { delay: 24.2 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 67.1 } },
    ],
  },
  {
    id: 'six-squared-clocks-back-choir',
    name: 'Clocks-back choir',
    category: 'space',
    description:
      'A low-pass that opens and closes over about half a minute, into a long tail that wavers in pitch like an unsteady choir.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0282, envAttackMs: 10.9, envReleaseMs: 220 },
      },
      { deviceId: 'expanse', preset: 'Seasick choir' },
    ],
  },
  {
    id: 'six-squared-rain-slick-tide',
    name: 'Rain-slick tide',
    category: 'space',
    description:
      'A reverb that breathes in slow waves over and over, then a low, gentle compressor that brings up everything quiet.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { time: 1.77 } },
      {
        deviceId: 'ambient-comp',
        preset: 'Raise the quiet',
        params: { attack: 90.4, release: 1.04, makeup: 10.8 },
      },
    ],
  },
  {
    id: 'six-squared-cul-de-sac-swell',
    name: 'Cul-de-sac swell',
    category: 'space',
    description:
      'A large space whose tail swells in behind each note, then only the two detuned copies, hard left and right.',
    effects: [
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 12.5, modRate: 0.305 } },
      { deviceId: 'stereo-detune', preset: 'Wet only' },
    ],
  },
  {
    id: 'six-squared-redbrick-plate',
    name: 'Redbrick plate',
    category: 'space',
    description:
      'A high cut set low enough to muffle everything, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.48 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'six-squared-hall-under-amber',
    name: 'Hall under amber',
    category: 'space',
    description:
      'A slow swell after each silence, with some dry attack left, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1510, release: 333 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 65.1, lowDecay: 7.24, midDecay: 2.11 },
      },
    ],
  },
  {
    id: 'six-squared-shade-in-no-light',
    name: 'Shade in no light',
    category: 'space',
    description:
      'A steep dark low-pass, then a plain short room whose tail stays at pitch, into a dark plate whose tail is soft on top.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { lfoRateHz: 1.04, envAttackMs: 10.2 },
      },
      { deviceId: 'bloom-reverb', preset: 'Still room' },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'six-squared-hard-shoulder-hall',
    name: 'Hard-shoulder hall',
    category: 'space',
    description:
      'A hall heard from far off with little dry sound left, then a gentle high cut that shades the top end.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 21.9, lowDecay: 5.45, midDecay: 4.31 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.46 } },
    ],
  },
  {
    id: 'six-squared-dancefloor-halo',
    name: 'Dancefloor halo',
    category: 'space',
    description:
      'A deep, slow compressor that lifts a quiet bed and holds it, then a string pad with a second section an octave above.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
      { deviceId: 'pad-follower', preset: 'Octave halo', params: { rise: 0.882, fall: 4.53 } },
    ],
  },
  {
    id: 'six-squared-ticket-stub-hall',
    name: 'Ticket-stub hall',
    category: 'space',
    description:
      'A phaser with no dry sound, pulling the two sides apart, into a hall that answers about a quarter of a second late.',
    effects: [
      { deviceId: 'phaser', preset: 'Stereo scatter', params: { rate: 0.226 } },
      { deviceId: 'fdn-reverb', preset: 'Late arrival', params: { breathRate: 0.33 } },
    ],
  },
  {
    id: 'six-squared-convoy-valley',
    name: 'Convoy valley',
    category: 'space',
    description:
      'A dull hard clipper with no oversampling, so it aliases, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'saturator', preset: 'Lo-fi' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 8.83, predelayMs: 106, breathRate: 0.308, mix: 0.27 },
      },
    ],
  },
  {
    id: 'six-squared-cloud-at-the-depot',
    name: 'Cloud at the depot',
    category: 'space',
    description:
      'A soft slap close behind each note, into a dark reverb that rises backwards and leaves a dim tail.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 86.9, modRate: 0.568 } },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { time: 2.17, preDelay: 64.8 } },
    ],
  },
  {
    id: 'six-squared-shopfront-sampler',
    name: 'Shopfront sampler',
    category: 'echo',
    description:
      'A dull eighth-rate loop, then a reel driven as hard as it goes, thick with harmonics, into a slow tide of reverb.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Sampler grit', params: { length: 1.03 } },
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'shaped-reverb', preset: 'Slow tide', params: { time: 3.78 } },
    ],
  },
  {
    id: 'six-squared-cooling-tower-pad',
    name: 'Cooling-tower pad',
    category: 'echo',
    description:
      'A wide held pad, then a tape preamp overloaded until it breaks up, dull and thick, into a hall on its own.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Frozen pad' },
      { deviceId: 'analog-drive', preset: 'Worn tape', params: { output: -13.9 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { preDelay: 22.2, lowDecay: 4.15, midDecay: 4.03 },
      },
    ],
  },
  {
    id: 'six-squared-bus-shelter-memory',
    name: 'Bus-shelter memory',
    category: 'echo',
    description:
      'A soft echo while earlier phrases drift back under it, then a flat clipped under-layer, into a cathedral with about six seconds of tail.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Recalling',
        params: { time: 481, reach: 18.5, size: 3.33 },
      },
      { deviceId: 'saturator', preset: 'Sustain bed' },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 72.9, lowDecay: 6.81, midDecay: 5.5 },
      },
    ],
  },
  {
    id: 'six-squared-cobbled-loop',
    name: 'Cobbled loop',
    category: 'echo',
    description:
      'A tape loop whose passes cross from side to side, then a hot valve stage, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Crossing sides', params: { length: 1.46 } },
      { deviceId: 'patina', preset: 'Hot valve', params: { output: -4.81 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'six-squared-ginnel-drone',
    name: 'Ginnel drone',
    category: 'echo',
    description:
      'A dark held drone, then a tape-style curve that rounds the peaks and dulls the top, into a dark backwards reverb.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Deep drone' },
      { deviceId: 'saturator', preset: 'On tape' },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { time: 1.99, preDelay: 61.1 } },
    ],
  },
  {
    id: 'six-squared-memory-walking-home',
    name: 'Memory walking home',
    category: 'echo',
    description:
      'A slap and short glimpses, then a fast, steady reel pushed into soft saturation, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Glimpses',
        params: { time: 65.9, reach: 22.2, size: 0.634 },
      },
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 59.9 } },
    ],
  },
  {
    id: 'six-squared-windscreen-murk',
    name: 'Windscreen murk',
    category: 'echo',
    description:
      'A slow murky bucket-brigade echo with dull, worn repeats, into a thin veil of reverb kept low under the sound.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky', params: { time: 796 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'six-squared-shopfront-repeats',
    name: 'Shopfront repeats',
    category: 'echo',
    description:
      'A low-pass that opens and closes over about half a minute, then a bucket-brigade echo whose soft repeats dull as they fade.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'analog-delay', preset: 'Dark echo' },
    ],
  },
  {
    id: 'six-squared-estate-wash',
    name: 'Estate wash',
    category: 'echo',
    description:
      'Dotted tape repeats that pile up in a darkening wash, then a dark fog of slow backwards swells.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Dub wash' },
      { deviceId: 'reverse-delay', preset: 'Dark fog' },
    ],
  },
  {
    id: 'six-squared-closing-time-trace',
    name: 'Closing-time trace',
    category: 'echo',
    description:
      'A dark fuzz from a triode pushed far past its limit, then a faint, dull echo with a slow chorus on it, into a medium plate.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz' },
      { deviceId: 'analog-delay', preset: 'Faint halo' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { predelayMs: 17.9 } },
    ],
  },
  {
    id: 'six-squared-closing-time-echo',
    name: 'Closing-time echo',
    category: 'echo',
    description:
      'A dark, thick valve curve mixed over some of the clean sound, then a chorused echo, into a slow dark swell.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit', params: { outputDb: -18 } },
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 279, modRate: 0.934 } },
      { deviceId: 'shaped-reverb', preset: 'Dark swell', params: { time: 3.94 } },
    ],
  },
  {
    id: 'six-squared-loop-gone-midnight',
    name: 'Loop gone midnight',
    category: 'echo',
    description:
      'A tape loop at half speed, an octave down and darker, then a gentle low-pass at a kilohertz, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down' },
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { lfoRateHz: 1.11, envAttackMs: 10.6, envReleaseMs: 224 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate' },
    ],
  },
  {
    id: 'six-squared-fog-lamp-echo',
    name: 'Fog-lamp echo',
    category: 'echo',
    description:
      'A tape reel pushed hard into thick saturation, then a dull, wobbling, saturated echo on worn tape, into a dark, very long hall.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 671 } },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0835 } },
    ],
  },
  {
    id: 'six-squared-pebble-dash-loop',
    name: 'Pebble-dash loop',
    category: 'echo',
    description:
      'An equaliser that adds lows and body and eases the top, then a wide, muffled loop of the last phrase, as if under water.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'micro-looper', preset: 'Underwater' },
    ],
  },
  {
    id: 'six-squared-ring-road-echo',
    name: 'Ring-road echo',
    category: 'echo',
    description:
      'A short echo whose pitch sways like a seasick vibrato, into the close reflections of a very small room.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Seasick', params: { time: 146, modRate: 2.97 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { breathRate: 0.329 } },
    ],
  },
  {
    id: 'six-squared-flyover-reel',
    name: 'Flyover reel',
    category: 'echo',
    description:
      'A short tape loop where each pass comes back quieter, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade' },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'six-squared-paper-round-iron',
    name: 'Paper-round iron',
    category: 'tape',
    description:
      'A low, warm transformer, then a compressor that pulls the tail of every note back up, then hiss that swells in the gaps.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'ambient-comp', preset: 'Long sustain', params: { makeup: 9.01 } },
      {
        deviceId: 'noise-floor',
        preset: 'Breathing tape',
        params: { response: 0.865, hold: 14.4 },
      },
    ],
  },
  {
    id: 'six-squared-multi-storey-fuzz',
    name: 'Multi-storey fuzz',
    category: 'tape',
    description:
      'A dark valve fuzz, then an even-handed compressor, then record crackle that ducks under notes and fills the gaps.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz' },
      { deviceId: 'ambient-comp', preset: 'Keys', params: { attack: 114, release: 1.54 } },
      { deviceId: 'noise-floor', preset: 'Gap crackle', params: { response: 0.588, hold: 10.1 } },
    ],
  },
  {
    id: 'six-squared-left-on-reel',
    name: 'Left-on reel',
    category: 'tape',
    description:
      'An overloaded tape preamp, then a parallel compressor, then a pure low mains hum in the middle of the sound.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 350, release: 3.33 } },
      { deviceId: 'noise-floor', preset: 'Mains hum', params: { response: 0.436, hold: 21.5 } },
    ],
  },
  {
    id: 'six-squared-iron-at-a-bus-stop',
    name: 'Iron at a bus stop',
    category: 'tape',
    description:
      'A transformer driven so the low end thickens and loosens, then a gentle compressor, then a trace of tape hiss, even and barely there.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'noise-floor', preset: 'Faint hiss', params: { response: 0.403, hold: 13.5 } },
    ],
  },
  {
    id: 'six-squared-convoy-grit',
    name: 'Convoy grit',
    category: 'tape',
    description:
      'A dull hard clipper with no oversampling, so it aliases, then a deep, slow compressor, then the low rumble of an empty room, left running.',
    effects: [
      { deviceId: 'saturator', preset: 'Lo-fi' },
      {
        deviceId: 'ambient-comp',
        preset: 'Drone bed',
        params: { attack: 767, release: 10.1, makeup: 8.23 },
      },
      { deviceId: 'noise-floor', preset: 'Empty room' },
    ],
  },
  {
    id: 'six-squared-precinct-tape',
    name: 'Precinct tape',
    category: 'tape',
    description:
      'A tape-style curve only just leaned on, then a slow levelling compressor, then the low rumble of an empty room, left running.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      {
        deviceId: 'ambient-comp',
        preset: 'Level',
        params: { attack: 316, release: 1.91, makeup: 2.51 },
      },
      { deviceId: 'noise-floor', preset: 'Empty room' },
    ],
  },
  {
    id: 'six-squared-bypass-bits',
    name: 'Bypass bits',
    category: 'tape',
    description:
      'Dull, shaky converters, then a quick fading loop, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty' },
      { deviceId: 'micro-looper', preset: 'Quick loop', params: { length: 0.482 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 7.57, breathRate: 0.202 } },
    ],
  },
  {
    id: 'six-squared-viaduct-clock',
    name: 'Viaduct clock',
    category: 'tape',
    description:
      'Smooth, dull converters whose clock is badly unsteady, then a blurred loop that never comes round quite the same, into a damped hall.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Jittery' },
      { deviceId: 'micro-looper', preset: 'Drifting' },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'six-squared-forecourt-bits',
    name: 'Forecourt bits',
    category: 'tape',
    description:
      'Five-bit converters fed hot, a coarse grain on every note, then a tape loop whose passes cross from side to side, then a hovering tape wash.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Crushed' },
      { deviceId: 'tape-loop', preset: 'Crossing sides', params: { length: 1.38 } },
      { deviceId: 'tape-echo', preset: 'Hovering wash', params: { time: 944 } },
    ],
  },
  {
    id: 'six-squared-windscreen-bits',
    name: 'Windscreen bits',
    category: 'tape',
    description:
      'Dull, shaky converters, then a half-speed loop, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty' },
      { deviceId: 'micro-looper', preset: 'Half speed', params: { length: 2.67 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 15.4, modRate: 0.292 } },
    ],
  },
  {
    id: 'six-squared-sampler-by-the-canal',
    name: 'Sampler by the canal',
    category: 'tape',
    description:
      'A tape loop whose passes cross from side to side, then a grainy early sampler, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Crossing sides', params: { length: 1.27 } },
      { deviceId: 'patina', preset: 'Early sampler' },
      { deviceId: 'expanse', preset: 'Bloom' },
    ],
  },
  {
    id: 'six-squared-substation-memo',
    name: 'Substation memo',
    category: 'tape',
    description:
      'A worn dictation cassette, dull, trembling and full of hiss, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'tape', preset: 'Old dictation', params: { output: -4.1 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { lowDecay: 3.72, midDecay: 4.38 },
      },
    ],
  },
  {
    id: 'six-squared-tape-by-the-bypass',
    name: 'Tape by the bypass',
    category: 'tape',
    description:
      'A muffled cassette, its top rolled off and its lows lifted, then a slow tape echo with a long trail that dulls as it goes.',
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { time: 1500 } },
    ],
  },
  {
    id: 'six-squared-ticket-stub-loop',
    name: 'Ticket-stub loop',
    category: 'tape',
    description:
      'An equaliser that takes presence, air and lows away, then a short loop at an eighth of the sample rate, dull and plain.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.46 } },
      { deviceId: 'micro-looper', preset: 'Sampler grit' },
    ],
  },
  {
    id: 'six-squared-record-in-a-lay-by',
    name: 'Record in a lay-by',
    category: 'tape',
    description:
      'A half-speed tape loop, then a badly warped record whose pitch sways once a turn, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down' },
      { deviceId: 'vinyl', preset: 'Warped' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 4.42, breathRate: 0.263 } },
    ],
  },
  {
    id: 'six-squared-lock-up-layers',
    name: 'Lock-up layers',
    category: 'tape',
    description:
      'A tape loop that plays its layers back in reverse, then a new record with a little surface hiss and fine crackle.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Backwards layers', params: { length: 5.55 } },
      { deviceId: 'vinyl', preset: 'New pressing', params: { spin: 1.67 } },
    ],
  },
  {
    id: 'six-squared-motorway-cassette',
    name: 'Motorway cassette',
    category: 'tape',
    description:
      'A cassette with a full head bump and a rolled-off top, into the close reflections of a very small room.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Short ambience',
        params: { decay: 0.412, breathRate: 0.286 },
      },
    ],
  },
  {
    id: 'six-squared-loop-in-lamplight',
    name: 'Loop in lamplight',
    category: 'tape',
    description:
      'A half-speed tape loop in reverse, low and dark, then a badly worn record, swaying in pitch under loud crackle.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards', params: { length: 4.03 } },
      { deviceId: 'patina', preset: 'Scratched record', params: { output: 2.28 } },
    ],
  },
  {
    id: 'six-squared-groove-in-lamplight',
    name: 'Groove in lamplight',
    category: 'tape',
    description:
      'A dusty record, gently warped, with crackle in the groove, into a brief swell of reverb close behind each note.',
    effects: [
      { deviceId: 'patina', preset: 'Dusty record', params: { output: -2.54 } },
      { deviceId: 'shaped-reverb', preset: 'Short halo' },
    ],
  },
  {
    id: 'six-squared-precinct-bits',
    name: 'Precinct bits',
    category: 'tape',
    description:
      'Converters at a very low rate, filtered smooth and dull, then the low mains hum of an amplifier left switched on.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sunken' },
      { deviceId: 'noise-floor', preset: 'Amp left on' },
    ],
  },
  {
    id: 'six-squared-air-midweek',
    name: 'Air midweek',
    category: 'tape',
    description:
      'A clean bright reel under a thick layer of tape hiss, then a deep pitch wobble in the centre, like a warped tape.',
    effects: [
      { deviceId: 'tape', preset: 'Hiss and air', params: { output: 2.09 } },
      { deviceId: 'chorus', preset: 'Warped tape', params: { rate: 1.14, delayMs: 23.5 } },
    ],
  },
  {
    id: 'six-squared-amber-cassette',
    name: 'Amber cassette',
    category: 'tape',
    description:
      'A muffled cassette, then a far radio station, sinking in and out of heavy static, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'patina', preset: 'Distant station', params: { output: -2.21 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'six-squared-depot-dial',
    name: 'Depot dial',
    category: 'tape',
    description:
      'A fast reel with no hiss, driven hard so peaks are squashed, then a medium-wave set whose dial slides off the station and back.',
    effects: [
      { deviceId: 'tape', preset: 'Hot glue' },
      { deviceId: 'radio', preset: 'Drifting dial' },
    ],
  },
  {
    id: 'six-squared-coil-never-silent',
    name: 'Coil never silent',
    category: 'tape',
    description:
      'A transformer driven so the low end thickens and loosens, then the surface noise and crackle of an old record.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { output: -7.24 } },
      { deviceId: 'noise-floor', preset: 'Old record' },
    ],
  },
  {
    id: 'six-squared-warehouse-reel',
    name: 'Warehouse reel',
    category: 'tape',
    description:
      'A tape reel pushed hard into thick saturation, then a slow murky bucket-brigade echo with dull, worn repeats.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'analog-delay', preset: 'Murky', params: { time: 840, modRate: 0.276 } },
    ],
  },
  {
    id: 'six-squared-oxide-by-the-pylons',
    name: 'Oxide by the pylons',
    category: 'tape',
    description:
      'A flaking reel whose sound ducks and dulls at random, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'tape', preset: 'Crumbling oxide' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 28.5, modRate: 0.0908 } },
    ],
  },
  {
    id: 'six-squared-bedsit-notch',
    name: 'Bedsit notch',
    category: 'motion',
    description:
      'A dull hard clipper with no oversampling, so it aliases, then a slowly drifting notch, into a huge wash by itself.',
    effects: [
      { deviceId: 'saturator', preset: 'Lo-fi' },
      {
        deviceId: 'auto-filter',
        preset: 'Slow notch',
        params: { lfoRateHz: 0.158, envReleaseMs: 181 },
      },
      { deviceId: 'expanse', preset: 'Wash alone', params: { decay: 38.8, modRate: 0.106 } },
    ],
  },
  {
    id: 'six-squared-filter-under-amber',
    name: 'Filter under amber',
    category: 'motion',
    description:
      'A low, warm transformer, then a gentle low-pass at a kilohertz, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { lfoRateHz: 0.893, envAttackMs: 10.5, envReleaseMs: 222 },
      },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 30.3, modRate: 0.112 } },
    ],
  },
  {
    id: 'six-squared-clocks-back-filter',
    name: 'Clocks-back filter',
    category: 'motion',
    description:
      'A little soft saturation, then a dark low-pass that blooms, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: 1.42 } },
      {
        deviceId: 'auto-filter',
        preset: 'Soft bloom',
        params: { lfoRateHz: 0.992, envAttackMs: 133, envReleaseMs: 910 },
      },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 11.2, breathRate: 0.0525 } },
    ],
  },
  {
    id: 'six-squared-fall-at-a-bus-stop',
    name: 'Fall at a bus stop',
    category: 'motion',
    description:
      'A tape preamp pushed just enough to add weight, then a falling high-pass, into a vast space whose tail swells in and hangs a minute or more.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { output: -4.67 } },
      {
        deviceId: 'auto-filter',
        preset: 'Falling high-pass',
        params: { lfoRateHz: 0.478, envAttackMs: 8.78, envReleaseMs: 207 },
      },
      { deviceId: 'expanse', preset: 'Event horizon', params: { decay: 54.4, modRate: 0.137 } },
    ],
  },
  {
    id: 'six-squared-filter-in-sleet',
    name: 'Filter in sleet',
    category: 'motion',
    description:
      'A tape preamp driven for thick lows and a dull top, then a gentle low-pass at a kilohertz, into a breathing reverb.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      { deviceId: 'auto-filter', preset: 'Init' },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { time: 2.02 } },
    ],
  },
  {
    id: 'six-squared-net-curtain-chorus',
    name: 'Net-curtain chorus',
    category: 'motion',
    description:
      'A chorus above the lows, then soft clipping, mixed low, then the soft air of an open microphone under the sound, into a hall with long lows.',
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer' },
      { deviceId: 'saturator', preset: 'Drum bus crunch', params: { outputDb: -5.34 } },
      { deviceId: 'noise-floor', preset: 'Close mic' },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 66.3, lowDecay: 7.71, midDecay: 2.02 },
      },
    ],
  },
  {
    id: 'six-squared-morning-after-chorus',
    name: 'Morning-after chorus',
    category: 'motion',
    description:
      'A wide three-voice chorus, then a triode valve stage, smoothly overdriven, then old record crackle, into a slow dark swell.',
    effects: [
      { deviceId: 'chorus', preset: 'Wide chorus', params: { rate: 0.861, delayMs: 12.6 } },
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { output: 3 } },
      { deviceId: 'noise-floor', preset: 'Old record' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'six-squared-milk-float-chorus',
    name: 'Milk-float chorus',
    category: 'motion',
    description:
      'A slow ensemble chorus, then a dull, aliasing clipper, then the surface noise and crackle of an old record, into a damped hall.',
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble' },
      { deviceId: 'saturator', preset: 'Lo-fi' },
      { deviceId: 'noise-floor', preset: 'Old record', params: { response: 0.443, hold: 7.6 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'six-squared-underpass-tide',
    name: 'Underpass tide',
    category: 'motion',
    description:
      'A deep slow chorus, then a flat clipped under-layer, then a pure low mains hum, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.159 } },
      { deviceId: 'saturator', preset: 'Sustain bed' },
      { deviceId: 'noise-floor', preset: 'Mains hum', params: { response: 0.411, hold: 19 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 16.2 } },
    ],
  },
  {
    id: 'six-squared-roundabout-phaser',
    name: 'Roundabout phaser',
    category: 'motion',
    description:
      'A fast reel with no hiss, driven hard so peaks are squashed, then a six-stage phaser turning about every three seconds.',
    effects: [
      { deviceId: 'tape', preset: 'Hot glue' },
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.319 } },
    ],
  },
  {
    id: 'six-squared-towpath-tide',
    name: 'Towpath tide',
    category: 'motion',
    description:
      'A low-pass that opens and closes over about half a minute, into a single saturated tape slap behind each note.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 83.9 } },
    ],
  },
  {
    id: 'six-squared-idling-drift',
    name: 'Idling drift',
    category: 'motion',
    description:
      'A tape preamp overloaded until it breaks up, dull and thick, then a slowly sliding comb, into a very long sung oo.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape', params: { output: -6.38 } },
      { deviceId: 'tremolo', preset: 'Drifting comb', params: { rate: 0.0996 } },
      { deviceId: 'vowel-reverb', preset: 'Endless oo', params: { decay: 37.8, preDelay: 18.4 } },
    ],
  },
  {
    id: 'six-squared-flyover-smear',
    name: 'Flyover smear',
    category: 'texture',
    description:
      'A dark smear of long grains that trails for many seconds, then an early sampler at a low rate, its top filtered away.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Dark slow smear', params: { time: 1490 } },
      { deviceId: 'patina', preset: 'Muffled sampler' },
    ],
  },
  {
    id: 'six-squared-back-seat-undertow',
    name: 'Back-seat undertow',
    category: 'texture',
    description:
      'Long sparse grains two octaves down, a slow bass shadow, then an echo whose repeats hop up a fifth and down a fourth.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Two octaves under' },
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { time: 294, modRate: 0.565 } },
    ],
  },
  {
    id: 'six-squared-high-rise-blur',
    name: 'High-rise blur',
    category: 'texture',
    description:
      'The sound with its attacks blurred soft and nothing added, then a one-second tape loop that soon dies away.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Softened attacks' },
      { deviceId: 'tape-loop', preset: 'One second round' },
    ],
  },
  {
    id: 'six-squared-car-park-pad',
    name: 'Car-park pad',
    category: 'texture',
    description:
      'A soft string pad that swells in behind what is played, then a warped record through a dark cartridge, swaying slowly.',
    effects: [
      { deviceId: 'pad-follower', preset: 'String pad', params: { rise: 0.567, fall: 3.63 } },
      { deviceId: 'vinyl', preset: 'Slow platter' },
    ],
  },
  {
    id: 'six-squared-chorus-by-the-bypass',
    name: 'Chorus by the bypass',
    category: 'texture',
    description:
      'A detuned double made of grains, spread to the sides, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Detuned double' },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'six-squared-fog-lamp-swell',
    name: 'Fog-lamp swell',
    category: 'texture',
    description:
      "A smooth swell on every note, like a string section's bows, into a small room that is over in about a second.",
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 306, release: 550 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Room',
        params: { preDelay: 32, lowDecay: 1.33, midDecay: 1.34 },
      },
    ],
  },
  {
    id: 'six-squared-mist-in-a-lock-up',
    name: 'Mist in a lock-up',
    category: 'texture',
    description:
      'A very wide wash in which every note hangs for many seconds, then a phaser that climbs for about two seconds and snaps back.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Endless' },
      { deviceId: 'phaser', preset: 'Saw riser' },
    ],
  },
  {
    id: 'six-squared-redbrick-pad',
    name: 'Redbrick pad',
    category: 'texture',
    description:
      'A dark slow-melting bed, then a resonant low-pass that swings open about every two seconds, into a slow dark swell.',
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 1.21, glide: 2.72 } },
      { deviceId: 'auto-filter', preset: 'Dub sweep' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell', params: { time: 3.96 } },
    ],
  },
  {
    id: 'six-squared-allotment-refrain',
    name: 'Allotment refrain',
    category: 'texture',
    description:
      'A late-blooming slow swell, then whole phrases that repeat by chance, each time quieter, into a huge dark cathedral.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise' },
      { deviceId: 'glitch', preset: 'Phrase repeats' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 28.6, modRate: 0.0903 } },
    ],
  },
  {
    id: 'six-squared-outskirts-undertow',
    name: 'Outskirts undertow',
    category: 'pitch',
    description:
      'A dark half-speed octave kept low under the dry sound, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1180 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite' },
    ],
  },
  {
    id: 'six-squared-amber-pedals',
    name: 'Amber pedals',
    category: 'pitch',
    description:
      'Deep pedal notes two octaves down that swell in slowly, then a subsonic cut with the low mids and presence eased a touch.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals', params: { attack: 1.14 } },
      { deviceId: 'ambient-eq', preset: 'Drone' },
    ],
  },
  {
    id: 'six-squared-bus-shelter-drone',
    name: 'Bus-shelter drone',
    category: 'pitch',
    description:
      'A drone looped from each note with the fifth above it, into a late reverb that climbs by octaves and fifths.',
    effects: [
      { deviceId: 'cascade', preset: 'Drone of fifths', params: { time: 402 } },
      { deviceId: 'shimmer', preset: 'Late answer', params: { decay: 8.53, predelay: 435 } },
    ],
  },
  {
    id: 'six-squared-clocks-back-bass',
    name: 'Clocks-back bass',
    category: 'pitch',
    description:
      'A soft bass two octaves below, and a little one octave below, then a record thick with dust, ticking and popping throughout.',
    effects: [
      { deviceId: 'octaves', preset: 'Deep' },
      { deviceId: 'vinyl', preset: 'Dust and scratches', params: { spin: 1.64 } },
    ],
  },
  {
    id: 'six-squared-drag-in-a-ginnel',
    name: 'Drag in a ginnel',
    category: 'pitch',
    description:
      'Whole phrases dragged out at half speed, an octave down, then a plain echo rebuilt from grains, straight and centred.',
    effects: [
      { deviceId: 'half-speed', preset: 'Long drag', params: { length: 3610 } },
      { deviceId: 'grain-delay', preset: 'Plain repeat' },
    ],
  },
  {
    id: 'six-squared-glowing-coil',
    name: 'Glowing coil',
    category: 'master',
    description:
      'A low, warm transformer, then a swell-holding compressor, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'six-squared-slip-road-reel',
    name: 'Slip-road reel',
    category: 'master',
    description:
      'A tape reel with soft saturation, slight wobble and hiss, then a compressor as slow as a hand on a fader, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'ambient-comp', preset: 'Slow fader' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 5.62 } },
    ],
  },
  {
    id: 'six-squared-reel-at-the-depot',
    name: 'Reel at the depot',
    category: 'master',
    description:
      'A tape-style curve only just leaned on, then a heavy low shelf that puts weight under the sound, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.63 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { gain: -2.44 } },
    ],
  },
  {
    id: 'six-squared-sheen-before-buses',
    name: 'Sheen before buses',
    category: 'master',
    description:
      'Bright tape-style saturation mixed in under the clean sound, then a quicker compressor, then a safety limiter.',
    effects: [
      { deviceId: 'saturator', preset: 'Parallel shine' },
      { deviceId: 'ambient-comp', preset: 'Mic', params: { attack: 66.1, release: 1.09 } },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 2.9 } },
    ],
  },
  {
    id: 'six-squared-idling-lift',
    name: 'Idling lift',
    category: 'master',
    description:
      'A parallel compressor that lifts quiet playing and tails, then a true-peak ceiling with the level eased back before it.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 431, release: 2.96 } },
      { deviceId: 'ambient-limiter', preset: 'Pull back', params: { release: 1.35, gain: 0.471 } },
    ],
  },
  {
    id: 'six-squared-bay-window-reel',
    name: 'Bay-window reel',
    category: 'master',
    description:
      'A reel of tape, then a very gentle compressor that leans on the loudest swells, then a low, breathing ceiling.',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'ambient-comp', preset: 'Glue', params: { attack: 643, release: 3.9 } },
      {
        deviceId: 'ambient-limiter',
        preset: 'Breathing',
        params: { release: 0.288, gain: -0.223 },
      },
    ],
  },
  {
    id: 'six-squared-first-bus-tape',
    name: 'First-bus tape',
    category: 'master',
    description:
      'Soft tape-style saturation, then a slow compressor that evens out swells over seconds, then a lightly pushed limiter.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape' },
      { deviceId: 'ambient-comp', preset: 'Level' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'six-squared-reel-in-a-car-park',
    name: 'Reel in a car park',
    category: 'master',
    description:
      'A tape-style curve only just leaned on, then a fast compressor that takes the spike off plucked notes, then a low, slow ceiling.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { attack: 11, release: 0.132 } },
      { deviceId: 'ambient-limiter', preset: 'Late night' },
    ],
  },
]
