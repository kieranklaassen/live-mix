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
    id: 'six-squared-comedown-vault',
    name: 'Comedown vault',
    category: 'space',
    description:
      'Dark, thick valve grit that fills out the low end, then a cathedral, then a firm, slow compressor that keeps long swells held down.',
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
      'A dark reverb stacking octaves and fifths like organ pipes, into the drifting tail of a long reverb with no dry sound.',
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
      'A late copy on each side, like the same part played twice, into a cavern built from a rush of short echoes.',
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
      'A huge dark open space that answers late and rings on, then two dark late copies that shadow the sound on either side.',
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
      'A tape preamp driven for thick lows and a dull top, into a far-off plate haze with a long, soft tail.',
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
    id: 'six-squared-rain-slick-tide',
    name: 'Rain-slick tide',
    category: 'space',
    description:
      'A long reverb that comes and goes in waves, over and over, then a gentle compressor that brings up everything quiet.',
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
      'A large space whose tail swells in behind each note, then a sharp copy hard left and a flat one hard right, alone.',
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
      'A slow swell after each silence that leaves some attack in, into a hall whose lows ring on long after the rest has gone.',
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
    id: 'six-squared-hard-shoulder-hall',
    name: 'Hard-shoulder hall',
    category: 'space',
    description:
      'A damped hall of about five seconds, heard from far off, then a gentle high cut that shades the top end.',
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
    id: 'six-squared-top-deck-fog',
    name: 'Top-deck fog',
    category: 'space',
    description:
      'A tape preamp driven for thick lows and a dull top, then a huge wash heard alone, then a quick, firm compressor.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      { deviceId: 'expanse', preset: 'Wash alone' },
      { deviceId: 'ambient-comp', preset: 'Mic', params: { attack: 60.2, release: 1.12 } },
    ],
  },
  {
    id: 'six-squared-gasworks-wash',
    name: 'Gasworks wash',
    category: 'space',
    description:
      'Tape-style saturation that rounds peaks and dulls the top, then a dark, very long hall, then a parallel compressor.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape' },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0895 } },
      { deviceId: 'ambient-comp', preset: 'Lift' },
    ],
  },
  {
    id: 'six-squared-bedsit-cave',
    name: 'Bedsit cave',
    category: 'space',
    description:
      'A big lift of the low end that puts weight under the sound, into a big muffled cave that rings for about six seconds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.98 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 5.72, breathRate: 0.325 } },
    ],
  },
  {
    id: 'six-squared-precinct-murmur',
    name: 'Precinct murmur',
    category: 'space',
    description:
      'An equaliser that adds lows and body and eases the top, into a dull closed-mouth hum of deep voices behind the sound.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.58 } },
      { deviceId: 'vowel-reverb', preset: 'Humming', params: { decay: 9.73, preDelay: 21.8 } },
    ],
  },
  {
    id: 'six-squared-plate-till-daylight',
    name: 'Plate till daylight',
    category: 'space',
    description:
      'A tape preamp overloaded until it breaks up, dull and thick, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 36.7 } },
    ],
  },
  {
    id: 'six-squared-hall-out-of-town',
    name: 'Hall out of town',
    category: 'space',
    description:
      'A fully damped hall with a few seconds of tail, then a compressor that pulls the tail of every note back up.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
      {
        deviceId: 'ambient-comp',
        preset: 'Long sustain',
        params: { attack: 205, release: 0.713, makeup: 11.4 },
      },
    ],
  },
  {
    id: 'six-squared-cobbled-hall',
    name: 'Cobbled hall',
    category: 'space',
    description:
      'Dark, thick valve grit that fills out the low end, into a large hall heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Full wet send',
        params: { decay: 8.84, breathRate: 0.294 },
      },
    ],
  },
  {
    id: 'six-squared-shopfront-sampler',
    name: 'Shopfront sampler',
    category: 'echo',
    description:
      'A short, muffled loop at an eighth of the sample rate, then an overdriven reel, into a slow tide of reverb.',
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
      'A wide held pad, then an overloaded tape preamp, into a hall of about four seconds with no dry sound in it.',
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
      'A soft echo while earlier phrases drift back under it, then a hard-clipped under-layer, into a cathedral with about six seconds of tail.',
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
      'A dark held drone, then tape-style saturation that rounds peaks and dulls the top, into a dark rising reverb.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Deep drone' },
      { deviceId: 'saturator', preset: 'On tape' },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { time: 1.99, preDelay: 61.1 } },
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
    id: 'six-squared-closing-time-echo',
    name: 'Closing-time echo',
    category: 'echo',
    description:
      'Dark, thick valve grit that fills out the low end, then a chorused echo, into a dull reverb that swells in over seconds and fades slowly.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit', params: { outputDb: -18 } },
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 279, modRate: 0.934 } },
      { deviceId: 'shaped-reverb', preset: 'Dark swell', params: { time: 3.94 } },
    ],
  },
  {
    id: 'six-squared-fog-lamp-echo',
    name: 'Fog-lamp echo',
    category: 'echo',
    description:
      'A tape reel pushed hard, saturated and thick, then a dull, wobbling, saturated echo on worn tape, into a dark, very long hall.',
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
    id: 'six-squared-power-cut-octaves',
    name: 'Power-cut octaves',
    category: 'echo',
    description:
      'Backwards repeats that step down an octave each time, then an equaliser that adds lows and body and eases the top.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Descending steps' },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'six-squared-echo-over-rooftops',
    name: 'Echo over rooftops',
    category: 'echo',
    description:
      'A dull, wobbling, saturated echo on worn tape, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape' },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'six-squared-memory-from-a-taxi',
    name: 'Memory from a taxi',
    category: 'echo',
    description:
      'A soft echo while earlier phrases drift back under it, into a dark plate whose tail is soft on top.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Recalling',
        params: { time: 545, reach: 17.6, size: 3.15 },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'six-squared-reel-gone-midnight',
    name: 'Reel gone midnight',
    category: 'echo',
    description:
      'A tape loop that wears away, then a low-heavy transformer, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 3.34 } },
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 13.3, breathRate: 0.0544 } },
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
    id: 'six-squared-motorway-cassette',
    name: 'Motorway cassette',
    category: 'tape',
    description:
      'A thick, soft cassette, full in the lows and dull on top, into the close reflections of a very small room.',
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
      'A low, dark tape loop played backwards at half speed, then a badly worn record, swaying in pitch under loud crackle.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards', params: { length: 4.03 } },
      { deviceId: 'patina', preset: 'Scratched record', params: { output: 2.28 } },
    ],
  },
  {
    id: 'six-squared-amber-cassette',
    name: 'Amber cassette',
    category: 'tape',
    description:
      'A muffled cassette, then a far radio station, fading in and out of heavy static, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'patina', preset: 'Distant station', params: { output: -2.21 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'six-squared-warehouse-reel',
    name: 'Warehouse reel',
    category: 'tape',
    description:
      'A tape reel pushed hard, saturated and thick, then a slow murky bucket-brigade echo with dull, worn repeats.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'analog-delay', preset: 'Murky', params: { time: 840, modRate: 0.276 } },
    ],
  },
  {
    id: 'six-squared-lay-by-warmth',
    name: 'Lay-by warmth',
    category: 'tape',
    description:
      'A low-heavy transformer, then a parallel compressor, then the soft air of an open microphone under the sound.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'ambient-comp', preset: 'Lift' },
      { deviceId: 'noise-floor', preset: 'Close mic' },
    ],
  },
  {
    id: 'six-squared-milk-float-warmth',
    name: 'Milk-float warmth',
    category: 'tape',
    description:
      'A few decibels of soft saturation with the top eased, then a parallel compressor, then muffled tape hiss, steady and thick.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { makeup: 8 } },
      { deviceId: 'noise-floor', preset: 'Muffled hiss' },
    ],
  },
  {
    id: 'six-squared-glowing-warmth',
    name: 'Glowing warmth',
    category: 'tape',
    description:
      'A few decibels of soft saturation with the top eased, then a deep, slow compressor, then drifting radio static.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      {
        deviceId: 'ambient-comp',
        preset: 'Drone bed',
        params: { attack: 654, release: 9.05, makeup: 4.87 },
      },
      { deviceId: 'noise-floor', preset: 'Radio static' },
    ],
  },
  {
    id: 'six-squared-tape-in-a-ginnel',
    name: 'Tape in a ginnel',
    category: 'tape',
    description:
      'An overloaded tape preamp, then a deep, slow compressor, then a thin, even trace of tape hiss, heard in the pauses.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape' },
      {
        deviceId: 'ambient-comp',
        preset: 'Drone bed',
        params: { attack: 659, release: 9.06, makeup: 6.71 },
      },
      { deviceId: 'noise-floor', preset: 'Faint hiss' },
    ],
  },
  {
    id: 'six-squared-slip-road-fuzz',
    name: 'Slip-road fuzz',
    category: 'tape',
    description:
      'A thick, loose fuzz from an overloaded transformer, then a quick, firm compressor, then a pure, low electrical hum that sits in the centre.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron melt' },
      { deviceId: 'ambient-comp', preset: 'Mic' },
      { deviceId: 'noise-floor', preset: 'Mains hum', params: { response: 0.359, hold: 20.2 } },
    ],
  },
  {
    id: 'six-squared-morning-after-grit',
    name: 'Morning-after grit',
    category: 'tape',
    description:
      'A bed of digital grit, then a tape loop that wears thinner and duller on every pass, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Grit bed' },
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 3.3 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 87.7, lowDecay: 7.28, midDecay: 5.81 },
      },
    ],
  },
  {
    id: 'six-squared-steamed-up-sampler',
    name: 'Steamed-up sampler',
    category: 'tape',
    description:
      'Dull low-rate converters, then a tape loop whose passes cross from side to side, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sunken' },
      { deviceId: 'tape-loop', preset: 'Crossing sides', params: { length: 1.26 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.281 } },
    ],
  },
  {
    id: 'six-squared-milk-float-sampler',
    name: 'Milk-float sampler',
    category: 'tape',
    description:
      'A muffled early sampler, its top filtered away, then the light surface hiss and fine crackle of a new record.',
    effects: [
      { deviceId: 'patina', preset: 'Muffled sampler' },
      { deviceId: 'vinyl', preset: 'New pressing' },
    ],
  },
  {
    id: 'six-squared-high-rise-record',
    name: 'High-rise record',
    category: 'tape',
    description:
      'A tape loop that wears thinner and duller on every pass, then a dusty, ticking record, into a late-arriving hall.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 3.12 } },
      { deviceId: 'vinyl', preset: 'Dust and scratches', params: { spin: 1.36 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'six-squared-car-park-cassette',
    name: 'Car-park cassette',
    category: 'tape',
    description:
      'A four-track cassette, dull on top, unsteady and hissing, into a medium plate with a smooth tail of a few seconds.',
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { predelayMs: 18.2 } },
    ],
  },
  {
    id: 'six-squared-convoy-sampler',
    name: 'Convoy sampler',
    category: 'tape',
    description:
      'A short, muffled loop at an eighth of the sample rate, into a hint of open space behind the sound.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Sampler grit', params: { length: 0.987 } },
      { deviceId: 'expanse', preset: 'Faint air', params: { decay: 2.77, modRate: 0.387 } },
    ],
  },
  {
    id: 'six-squared-first-bus-crackle',
    name: 'First-bus crackle',
    category: 'tape',
    description:
      'A thin, far-off tape loop with its lows cut away, then a dusty, ticking record, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Thin and distant' },
      { deviceId: 'vinyl', preset: 'Dust and scratches' },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 59.1 } },
    ],
  },
  {
    id: 'six-squared-estate-drift',
    name: 'Estate drift',
    category: 'tape',
    description:
      'A hard-clipped copy held at one level under the clean sound, then a slow reel whose pitch sways widely and never settles.',
    effects: [
      { deviceId: 'saturator', preset: 'Sustain bed' },
      { deviceId: 'tape', preset: 'Seasick', params: { output: -2.01 } },
    ],
  },
  {
    id: 'six-squared-convoy-signal',
    name: 'Convoy signal',
    category: 'tape',
    description:
      'A digital telephone line, then a half-speed loop, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Phone' },
      { deviceId: 'micro-looper', preset: 'Half speed', params: { length: 2.67 } },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'six-squared-sampler-in-fine-rain',
    name: 'Sampler in fine rain',
    category: 'tape',
    description:
      'Smooth, dull converters with a hiss that rides high notes, then a half-speed tape loop, into a far-off hall.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Jittery' },
      { deviceId: 'tape-loop', preset: 'Slowed down', params: { length: 8.08 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { lowDecay: 5.24, midDecay: 4.42 } },
    ],
  },
  {
    id: 'six-squared-dancefloor-shortwave',
    name: 'Dancefloor shortwave',
    category: 'tape',
    description:
      'A transformer that fills out the lows and dulls the top, then a fading shortwave signal, into a dark mono cellar.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'patina', preset: 'Shortwave', params: { output: -2.13 } },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { decay: 2.7 } },
    ],
  },
  {
    id: 'six-squared-substation-record',
    name: 'Substation record',
    category: 'tape',
    description:
      'A wide muffled loop, then a dusty record, gently warped, with crackle in the groove, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Underwater', params: { length: 2.2 } },
      { deviceId: 'patina', preset: 'Dusty record' },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 49.6, lowDecay: 3.89, midDecay: 3.29 },
      },
    ],
  },
  {
    id: 'six-squared-reel-in-sleet',
    name: 'Reel in sleet',
    category: 'tape',
    description:
      'Clean converters fed hot, so the loudest peaks flatten, then an old slow reel that drifts, dulls, drops out and hisses.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Flat tops' },
      { deviceId: 'tape', preset: 'Worn thin', params: { output: -2.57 } },
    ],
  },
  {
    id: 'six-squared-closing-time-tape',
    name: 'Closing-time tape',
    category: 'tape',
    description:
      'A tape reel pushed hard, saturated and thick, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard', params: { output: -6.23 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'six-squared-photocopied-loop',
    name: 'Photocopied loop',
    category: 'tape',
    description:
      'A trace of slow four-stage phaser under the dry sound, then a short, dull loop at a quarter of the sample rate.',
    effects: [
      { deviceId: 'phaser', preset: 'Faint shade', params: { rate: 0.145 } },
      { deviceId: 'micro-looper', preset: 'Lo-fi quarter', params: { length: 1.67 } },
    ],
  },
  {
    id: 'six-squared-net-curtain-chorus',
    name: 'Net-curtain chorus',
    category: 'motion',
    description:
      'A chorus above the lows, then a layer of soft clipping, then the soft air of an open microphone under the sound, into a hall with long lows.',
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
      'A wide full chorus, then a triode valve stage, smoothly overdriven, then old record crackle, into a slow, dark swell of reverb.',
    effects: [
      { deviceId: 'chorus', preset: 'Wide chorus', params: { rate: 0.861, delayMs: 12.6 } },
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { output: 3 } },
      { deviceId: 'noise-floor', preset: 'Old record' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
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
      'A low-pass that opens and closes over about half a minute, into a single saturated tape echo close behind each note.',
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
      'An overloaded tape preamp, then a slow flanger sweep, opposite on each side, into a huge hall whose tail hums a soft "oo" for a long while.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape', params: { output: -6.38 } },
      { deviceId: 'tremolo', preset: 'Drifting comb', params: { rate: 0.0996 } },
      { deviceId: 'vowel-reverb', preset: 'Endless oo', params: { decay: 37.8, preDelay: 18.4 } },
    ],
  },
  {
    id: 'six-squared-filter-gone-midnight',
    name: 'Filter gone midnight',
    category: 'motion',
    description:
      'A few decibels of soft saturation with the top eased, then a half-minute low-pass sweep, into a slow, dark swell of reverb.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: -3.28 } },
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0274, envAttackMs: 9.72, envReleaseMs: 181 },
      },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'six-squared-filter-walking-home',
    name: 'Filter walking home',
    category: 'motion',
    description:
      'An overloaded tape preamp, then a half-minute low-pass sweep, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape', params: { output: -12.4 } },
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0322, envAttackMs: 10.5, envReleaseMs: 215 },
      },
      { deviceId: 'expanse', preset: 'Bloom' },
    ],
  },
  {
    id: 'six-squared-drift-in-fine-rain',
    name: 'Drift in fine rain',
    category: 'motion',
    description:
      'A slowly drifting chorus, then an overloaded transformer, then the low hum of an amplifier left switched on, into a wide open space.',
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.0794, delayMs: 24.5 } },
      { deviceId: 'analog-drive', preset: 'Iron melt' },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { response: 0.443, hold: 28.4 } },
      { deviceId: 'expanse', preset: 'Open space' },
    ],
  },
  {
    id: 'six-squared-ripple-in-a-car-park',
    name: 'Ripple in a car park',
    category: 'motion',
    description:
      'A chorus above the lows, then a triode valve stage, smoothly overdriven, then the hum of an amplifier, into a slowly breathing hall.',
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { rate: 1.26, delayMs: 12.5 } },
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { output: 5.16 } },
      { deviceId: 'noise-floor', preset: 'Amp left on' },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 7.24, breathRate: 0.224 } },
    ],
  },
  {
    id: 'six-squared-filter-from-the-bus',
    name: 'Filter from the bus',
    category: 'motion',
    description:
      'A dark fuzz from a valve pushed far past its limit, then a steep dark low-pass, into a dark reverb that rises behind each note and lingers.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { output: -7.81 } },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { lfoRateHz: 1.07, envReleaseMs: 195 },
      },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { time: 1.85, preDelay: 54.5 } },
    ],
  },
  {
    id: 'six-squared-filter-by-the-pylons',
    name: 'Filter by the pylons',
    category: 'motion',
    description:
      'A hard-clipped copy held at one level under the clean sound, then a steep dark low-pass, into a huge open valley.',
    effects: [
      { deviceId: 'saturator', preset: 'Sustain bed', params: { mix: 0.395 } },
      { deviceId: 'auto-filter', preset: 'Low-pass gate' },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.27 } },
    ],
  },
  {
    id: 'six-squared-milk-float-tide',
    name: 'Milk-float tide',
    category: 'motion',
    description:
      'A dark valve fuzz, then a low-pass that opens and closes over about half a minute, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { output: -8.49 } },
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0336, envAttackMs: 9.6 },
      },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 18.5 } },
    ],
  },
  {
    id: 'six-squared-back-seat-undertow',
    name: 'Back-seat undertow',
    category: 'texture',
    description:
      'A slow bass shadow of long grains two octaves down, then an echo whose repeats hop up a fifth and down a fourth.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Two octaves under' },
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { time: 294, modRate: 0.565 } },
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
    id: 'six-squared-fog-lamp-swell',
    name: 'Fog-lamp swell',
    category: 'texture',
    description:
      'A smooth swell that brings every note in like bowed strings, into a small room that is over in about a second.',
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
      'A dark, slow-melting pad, then a swinging resonant low-pass, into a dull reverb that swells in over seconds and fades slowly.',
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
    id: 'six-squared-cul-de-sac-harmony',
    name: 'Cul-de-sac harmony',
    category: 'texture',
    description:
      'A held pad where each new chord piles onto the last, into a reverb that swells in after each note and fades away.',
    effects: [
      { deviceId: 'sustainer', preset: 'Stacked harmony', params: { attack: 0.611, glide: 0.788 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 2.21 } },
    ],
  },
  {
    id: 'six-squared-echo-on-the-estate',
    name: 'Echo on the estate',
    category: 'texture',
    description:
      'Tape-style saturation that rounds peaks and dulls the top, then grain repeats that fall an octave and darken each time.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { outputDb: -10.9 } },
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { time: 526, size: 221 } },
    ],
  },
  {
    id: 'six-squared-cellos-in-no-light',
    name: 'Cellos in no light',
    category: 'texture',
    description:
      'A dark, low string pad like cellos under the playing, then a flaking, hissing reel that ducks and dulls at random.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { rise: 1.62, fall: 7.81 } },
      { deviceId: 'tape', preset: 'Crumbling oxide' },
    ],
  },
  {
    id: 'six-squared-outskirts-undertow',
    name: 'Outskirts undertow',
    category: 'pitch',
    description:
      'A dark, smooth half-speed octave under the dry sound, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1180 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite' },
    ],
  },
  {
    id: 'six-squared-bus-shelter-drone',
    name: 'Bus-shelter drone',
    category: 'pitch',
    description:
      'A drone looped from each note with the fifth above it, into a reverb that comes in late and climbs by octaves and fifths.',
    effects: [
      { deviceId: 'cascade', preset: 'Drone of fifths', params: { time: 402 } },
      { deviceId: 'shimmer', preset: 'Late answer', params: { decay: 8.53, predelay: 435 } },
    ],
  },
  {
    id: 'six-squared-bay-window-bass',
    name: 'Bay-window bass',
    category: 'pitch',
    description:
      'A single darkened voice an octave below the dry sound, then a dark, round pad that melts slowly from chord to chord.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave down' },
      { deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 1.19, glide: 2.21 } },
    ],
  },
  {
    id: 'six-squared-viaduct-octave',
    name: 'Viaduct octave',
    category: 'pitch',
    description:
      'A dark octave below held chords, every note shifted cleanly, into a reverb that fades evenly to nothing in a second or two.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad below' },
      { deviceId: 'shaped-reverb', preset: 'Falling' },
    ],
  },
  {
    id: 'six-squared-cul-de-sac-octave',
    name: 'Cul-de-sac octave',
    category: 'pitch',
    description:
      'A rounded octave below every note of a chord, then a slow, dull, worn-out echo with hiss riding on its repeats.',
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'analog-delay', preset: 'Noisy clock' },
    ],
  },
  {
    id: 'six-squared-convoy-finish',
    name: 'Convoy finish',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a small dip in the low mids, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ambient-eq', preset: 'Drone' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { release: 1.52 } },
    ],
  },
  {
    id: 'six-squared-precinct-finish',
    name: 'Precinct finish',
    category: 'master',
    description:
      'A few decibels of soft saturation with the top eased, then a gentle compressor that draws loud and quiet together, then a safety limiter.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'six-squared-forecourt-master',
    name: 'Forecourt master',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a parallel compressor, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 420, release: 3.36 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only' },
    ],
  },
  {
    id: 'six-squared-depot-master',
    name: 'Depot master',
    category: 'master',
    description:
      'Light tape-style saturation, then a gentle compressor, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 109, release: 2.2 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming' },
    ],
  },
  {
    id: 'six-squared-lock-up-master',
    name: 'Lock-up master',
    category: 'master',
    description:
      'A subsonic cut, then a parallel compressor that lifts quiet playing and tails, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 403, release: 3.14 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 6.63 } },
    ],
  },
  {
    id: 'six-squared-outskirts-polish',
    name: 'Outskirts polish',
    category: 'master',
    description:
      'A subsonic cut, then a stereo image widened a little, with the bass left central, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 3.17 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 6.66 } },
    ],
  },
  {
    id: 'six-squared-lacquer-in-a-lay-by',
    name: 'Lacquer in a lay-by',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a gentle compressor, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 111, release: 2.02 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'six-squared-motorway-lacquer',
    name: 'Motorway lacquer',
    category: 'master',
    description:
      'Tape-style saturation that rounds only the loudest peaks, then a very gentle compressor, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 5.49 } },
    ],
  },
]
