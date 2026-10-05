// Coast Fog Four-Track: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'four-track-hand-labelled-hall',
    name: 'Hand-labelled hall',
    category: 'space',
    description:
      'A hall whose lows ring on long after the rest has gone, then a tape reel with soft saturation, slight wobble and hiss.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
    ],
  },
  {
    id: 'four-track-hall-one-room-over',
    name: 'Hall one room over',
    category: 'space',
    description:
      'A large hall heard alone with none of the dry sound left, then a cassette with a full head bump and a rolled-off top.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Full wet send' },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'four-track-porch-hall',
    name: 'Porch hall',
    category: 'space',
    description:
      'A hall of about four seconds with no dry sound in it, then a worn dictation cassette, dull, trembling and full of hiss.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Full wet send' },
      { deviceId: 'tape', preset: 'Old dictation', params: { output: -2.67 } },
    ],
  },
  {
    id: 'four-track-harbour-plate',
    name: 'Harbour plate',
    category: 'space',
    description:
      'A dark plate whose tail is soft on top, then a worn cassette that wobbles, drops out and hisses.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 16.8 } },
      { deviceId: 'patina', preset: 'Worn cassette' },
    ],
  },
  {
    id: 'four-track-mudflat-plate',
    name: 'Mudflat plate',
    category: 'space',
    description:
      'A medium plate with a smooth tail of a few seconds, then an old slow reel that drifts, dulls and drops out.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { predelayMs: 21.5 } },
      { deviceId: 'tape', preset: 'Worn thin' },
    ],
  },
  {
    id: 'four-track-bedroom-tremor',
    name: 'Bedroom tremor',
    category: 'space',
    description:
      'A space whose tail flutters quickly in pitch, then a muffled cassette, its top rolled off and its lows lifted.',
    effects: [
      { deviceId: 'expanse', preset: 'Fast flutter', params: { decay: 5.04 } },
      { deviceId: 'tape', preset: 'Under a blanket' },
    ],
  },
  {
    id: 'four-track-slack-tide-cathedral',
    name: 'Slack-tide cathedral',
    category: 'space',
    description:
      'A trace of room around the sound, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Faint air' },
      { deviceId: 'vowel-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'four-track-fogbank-drone',
    name: 'Fogbank drone',
    category: 'space',
    description:
      "A smooth swell on every note, like a string section's bows, into four long strings on an A minor chord held in the centre.",
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 301, release: 636 } },
      { deviceId: 'sympathetic', preset: 'Centre drone' },
    ],
  },
  {
    id: 'four-track-plate-in-the-rain',
    name: 'Plate in the rain',
    category: 'space',
    description:
      'A far-off plate with a long soft tail and little dry sound, then a low cut with the low mids dipped and the presence lifted.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
      { deviceId: 'ambient-eq', preset: 'Voice', params: { clearTime: 1.46 } },
    ],
  },
  {
    id: 'four-track-kerosene-swell',
    name: 'Kerosene swell',
    category: 'space',
    description:
      'A high cut set low enough to muffle everything, then a dark mono cellar, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.57 } },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar' },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 14.3, modRate: 0.282 } },
    ],
  },
  {
    id: 'four-track-harp-under-cloud',
    name: 'Harp under cloud',
    category: 'space',
    description:
      'Sixteen hard-driven strings in F major that ring for seconds, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Glass harp' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'four-track-homemade-plate',
    name: 'Homemade plate',
    category: 'space',
    description:
      'A heavy low shelf, then a clean speaker at the far end of a big, live room, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 're-amp', preset: 'Far end of the hall' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'four-track-fifths-in-salt-air',
    name: 'Fifths in salt air',
    category: 'space',
    description:
      'A mellow reverb whose tail drifts down towards the fifth, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Falling fifths' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'four-track-hall-under-wool',
    name: 'Hall under wool',
    category: 'space',
    description:
      'A combo amplifier heard from the far side of a big room, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall', params: { output: -4.28 } },
      { deviceId: 'hall-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'four-track-shore-road-haze',
    name: 'Shore-road haze',
    category: 'space',
    description:
      'A wash of three fed-back tape heads that hovers and fades, then two duller copies a few cents off, tucked behind the sound.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Hovering wash' },
      { deviceId: 'stereo-detune', preset: 'Soft halo', params: { delay: 12.5 } },
    ],
  },
  {
    id: 'four-track-blanketed-shade',
    name: 'Blanketed shade',
    category: 'space',
    description:
      'A tape preamp driven for thick lows and a dull top, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'four-track-driftwood-plate',
    name: 'Driftwood plate',
    category: 'space',
    description:
      'A plate wash that hangs on for half a minute, then two full-range copies tuned further apart, reaching lower.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 56.1 } },
      { deviceId: 'stereo-detune', preset: 'Wider', params: { delay: 20.7 } },
    ],
  },
  {
    id: 'four-track-cannery-tunnel',
    name: 'Cannery tunnel',
    category: 'space',
    description:
      'A dull mono tunnel with a tail of several seconds, then a parallel compressor that lifts quiet playing and tails.',
    effects: [
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 5.31 } },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 426, release: 3.08 } },
    ],
  },
  {
    id: 'four-track-strings-through-fog',
    name: 'Strings through fog',
    category: 'space',
    description:
      'A high cut set low enough to muffle everything, into sixteen strings in E minor heard alone with no dry sound.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.52 } },
      { deviceId: 'sympathetic', preset: 'Strings alone', params: { decay: 7.17 } },
    ],
  },
  {
    id: 'four-track-depths-on-the-ebb',
    name: 'Depths on the ebb',
    category: 'space',
    description:
      'A combo amplifier driven hard, miked right on the cone, into a deep dark well of slow blurred echoes.',
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { output: -4.24 } },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { length: 1.03, glide: 0.655 } },
    ],
  },
  {
    id: 'four-track-off-season-hall',
    name: 'Off-season hall',
    category: 'space',
    description:
      'Two late copies either side, like loose double-tracking, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'chorus', preset: 'Loose double' },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 61.1, midDecay: 1.9 },
      },
    ],
  },
  {
    id: 'four-track-fogbound-strings',
    name: 'Fogbound strings',
    category: 'space',
    description:
      'A deep, slow compressor that lifts a quiet bed and holds it, into a faint ring of six strings in A major.',
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Drone bed',
        params: { attack: 616, release: 8.95, makeup: 7.2 },
      },
      { deviceId: 'sympathetic', preset: 'Faint ring', params: { decay: 2.03 } },
    ],
  },
  {
    id: 'four-track-plate-off-the-jetty',
    name: 'Plate off the jetty',
    category: 'space',
    description:
      'A wobbling tape double a moment behind each note, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Wobbly double', params: { time: 34.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 40.6 } },
    ],
  },
  {
    id: 'four-track-tail-still-rolling',
    name: 'Tail still rolling',
    category: 'space',
    description:
      'A low-pass that opens and closes over about half a minute, into the drifting tail of a long reverb with no dry sound.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.031, envAttackMs: 9.6, envReleaseMs: 210 },
      },
      { deviceId: 'bloom-reverb', preset: 'Tail alone', params: { decay: 16.6 } },
    ],
  },
  {
    id: 'four-track-swell-in-fog',
    name: 'Swell in fog',
    category: 'space',
    description:
      'A rotating speaker at a standstill, heard close and in mono, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'rotary', preset: 'Stopped horn' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'four-track-oilskin-voices',
    name: 'Oilskin voices',
    category: 'space',
    description:
      'A soft slap close behind each note, into a wordless choir alone with none of the dry sound left.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback' },
      { deviceId: 'vowel-reverb', preset: 'Choir alone', params: { decay: 10.4, preDelay: 21.5 } },
    ],
  },
  {
    id: 'four-track-shore-road-hall',
    name: 'Shore-road hall',
    category: 'space',
    description:
      'A short swell that rounds the front off every note, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 12.4 } },
    ],
  },
  {
    id: 'four-track-far-shore-pool',
    name: 'Far-shore pool',
    category: 'echo',
    description:
      'A wide, muffled loop of the last phrase, as if under water, into a dull closed-mouth hum of deep voices behind the sound.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Underwater', params: { length: 2.22 } },
      { deviceId: 'vowel-reverb', preset: 'Humming', params: { decay: 9.6, preDelay: 19.2 } },
    ],
  },
  {
    id: 'four-track-loop-in-wet-wool',
    name: 'Loop in wet wool',
    category: 'echo',
    description:
      'A short tape loop where each pass comes back quieter, into a large hall whose tail hums a deep oh in bass voices.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade', params: { length: 1.9 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 10.5, preDelay: 19.6 } },
    ],
  },
  {
    id: 'four-track-one-take-trace',
    name: 'One-take trace',
    category: 'echo',
    description:
      'A tape loop kept low, an afterimage behind the playing, into a huge hall whose tail hums a soft oo for a long while.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Faint afterimage', params: { length: 3.47 } },
      { deviceId: 'vowel-reverb', preset: 'Endless oo' },
    ],
  },
  {
    id: 'four-track-loop-at-low-tide',
    name: 'Loop at low tide',
    category: 'echo',
    description:
      'A tape loop that never fades, holding every layer, into faint voices singing quietly behind the sound.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Endless hold', params: { length: 7.62 } },
      { deviceId: 'vowel-reverb', preset: 'Faint voices' },
    ],
  },
  {
    id: 'four-track-borrowed-echo',
    name: 'Borrowed echo',
    category: 'echo',
    description:
      'Three tape heads in a row, a cluster on every repeat, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 593 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'four-track-wash-under-cloud',
    name: 'Wash under cloud',
    category: 'echo',
    description:
      'Dotted tape repeats that pile up in a darkening wash, into a reverb whose tail drifts up towards the fifth as it rings.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Dub wash', params: { time: 825 } },
      { deviceId: 'bloom-reverb', preset: 'Rising fifths', params: { decay: 8.58 } },
    ],
  },
  {
    id: 'four-track-echo-between-takes',
    name: 'Echo between takes',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, into a cave whose echoes bend slowly up and down in pitch.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 653 } },
      { deviceId: 'swarm-reverb', preset: 'Bending', params: { length: 0.542, glide: 1.88 } },
    ],
  },
  {
    id: 'four-track-overdubbed-echo',
    name: 'Overdubbed echo',
    category: 'echo',
    description:
      'A dull, wobbling, saturated echo on worn tape, then a gentle high cut that shades the top end.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape' },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.47 } },
    ],
  },
  {
    id: 'four-track-second-hand-loop',
    name: 'Second-hand loop',
    category: 'echo',
    description:
      'A half-speed tape loop in reverse, low and dark, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards', params: { length: 4.14 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 63.4 } },
    ],
  },
  {
    id: 'four-track-november-repeats',
    name: 'November repeats',
    category: 'echo',
    description:
      'Tape repeats that lose their lows and thin out as they fade, then an equaliser that takes presence, air and lows away.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { time: 291 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'four-track-woodstove-echo',
    name: 'Woodstove echo',
    category: 'echo',
    description:
      'A slow swell after each silence that opens only at the end, then a bucket-brigade echo whose soft repeats dull as they fade.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise' },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 393, modRate: 0.605 } },
    ],
  },
  {
    id: 'four-track-cloud-on-side-b',
    name: 'Cloud on side b',
    category: 'echo',
    description:
      'Long grains of what was played about four seconds ago, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Long memory' },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 21.2, modRate: 0.221 } },
    ],
  },
  {
    id: 'four-track-pencilled-echo',
    name: 'Pencilled echo',
    category: 'echo',
    description:
      'An overloaded tape preamp, then a dull, wobbling, saturated echo on worn tape, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape' },
      { deviceId: 'tape-echo', preset: 'Worn tape' },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 64.3 } },
    ],
  },
  {
    id: 'four-track-unheated-tide',
    name: 'Unheated tide',
    category: 'echo',
    description:
      'The whole sound swaying sharp and flat every few seconds, then slow backwards swells that rise and die behind the playing.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Seasick' },
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1440 } },
    ],
  },
  {
    id: 'four-track-quilt-echo',
    name: 'Quilt echo',
    category: 'echo',
    description:
      'A bucket-brigade echo with a slow chorus on its repeats, into a single saturated tape slap behind each note.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 279, modRate: 0.932 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 94.8 } },
    ],
  },
  {
    id: 'four-track-ninety-minute-hiss',
    name: 'Ninety-minute hiss',
    category: 'tape',
    description:
      'A four-track cassette, then tape hiss that sinks under each note and swells in the gaps, into a dark, very long hall.',
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      {
        deviceId: 'noise-floor',
        preset: 'Breathing tape',
        params: { response: 0.869, hold: 14.2 },
      },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0884 } },
    ],
  },
  {
    id: 'four-track-tidewater-hiss',
    name: 'Tidewater hiss',
    category: 'tape',
    description:
      'A slow reel whose pitch sways widely and never settles, then a trace of tape hiss, even and barely there, into a far-off hall.',
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { output: -3.18 } },
      { deviceId: 'noise-floor', preset: 'Faint hiss' },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 21.9, lowDecay: 4.91, midDecay: 4.41 },
      },
    ],
  },
  {
    id: 'four-track-raincoat-tape',
    name: 'Raincoat tape',
    category: 'tape',
    description:
      'A cassette with a full head bump and a rolled-off top, then steady tape hiss, into a vast space that hangs on.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { response: 0.373, hold: 11.7 } },
      { deviceId: 'expanse', preset: 'Event horizon', params: { decay: 54.1, modRate: 0.164 } },
    ],
  },
  {
    id: 'four-track-trestle-hiss',
    name: 'Trestle hiss',
    category: 'tape',
    description:
      'A worn cassette that wobbles, drops out and hisses, then dull, thick tape hiss, into a big muffled cave that rings for about six seconds.',
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { output: 2.39 } },
      { deviceId: 'noise-floor', preset: 'Muffled hiss', params: { response: 0.405, hold: 11.2 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 6.16, breathRate: 0.336 } },
    ],
  },
  {
    id: 'four-track-hiss-on-track-four',
    name: 'Hiss on track four',
    category: 'tape',
    description:
      'A four-track cassette, then loud, wide tape hiss that stands over the sound, into three long springs with all the top taken off.',
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { output: -2.61 } },
      { deviceId: 'noise-floor', preset: 'Wall of hiss' },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'four-track-air-at-slack-tide',
    name: 'Air at slack tide',
    category: 'tape',
    description:
      'A worn dictation cassette, then the soft air of an open microphone under the sound, into a slowly sliding cave.',
    effects: [
      { deviceId: 'tape', preset: 'Old dictation' },
      { deviceId: 'noise-floor', preset: 'Close mic', params: { response: 0.361, hold: 8.86 } },
      { deviceId: 'swarm-reverb', preset: 'Slow stretch', params: { length: 0.744, glide: 4.93 } },
    ],
  },
  {
    id: 'four-track-porch-drift',
    name: 'Porch drift',
    category: 'tape',
    description:
      'Three voices drifting over a cycle of about twelve seconds, then a reel of tape, into a far-off plate haze.',
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'four-track-closed-door-double',
    name: 'Closed-door double',
    category: 'tape',
    description:
      'Two dark late copies, a shadow either side of the sound, then a dull, wobbling, saturated echo on worn tape, into a far-off hall.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Shadow', params: { delay: 27.1 } },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 564 } },
      { deviceId: 'hall-reverb', preset: 'Far away' },
    ],
  },
  {
    id: 'four-track-kerosene-air',
    name: 'Kerosene air',
    category: 'tape',
    description:
      'Detuned copies of the highs only, the body left as it was, then a flaking reel, then a wide hanging grain haze.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Top only' },
      { deviceId: 'tape', preset: 'Crumbling oxide' },
      { deviceId: 'grain-delay', preset: 'Frozen haze' },
    ],
  },
  {
    id: 'four-track-double-by-one-lamp',
    name: 'Double by one lamp',
    category: 'tape',
    description:
      'Two copies a slap behind, the left one first, then a wearing tape loop, into three long springs with all the top taken off.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Late copy' },
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 3.37 } },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'four-track-mill-town-cassette',
    name: 'Mill-town cassette',
    category: 'tape',
    description:
      'A steep low-pass at four hundred hertz, the top gone, then a worn cassette that wobbles, drops out and hisses.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { lfoRateHz: 0.879, envAttackMs: 11.1 },
      },
      { deviceId: 'patina', preset: 'Worn cassette', params: { output: -2.82 } },
    ],
  },
  {
    id: 'four-track-mudflat-drift',
    name: 'Mudflat drift',
    category: 'tape',
    description:
      'An overloaded tape preamp, then a slow reel that sways, into a small dark room that is gone in about a second.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape' },
      { deviceId: 'tape', preset: 'Seasick', params: { output: -4.67 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { decay: 1.33, modRate: 0.846 } },
    ],
  },
  {
    id: 'four-track-slough-fuzz',
    name: 'Slough fuzz',
    category: 'tape',
    description:
      'A tape preamp overloaded until it breaks up, dull and thick, into a clean speaker at the far end of a big, live room.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape' },
      { deviceId: 're-amp', preset: 'Far end of the hall', params: { output: -3.93 } },
    ],
  },
  {
    id: 'four-track-thump-in-fine-rain',
    name: 'Thump in fine rain',
    category: 'tape',
    description:
      'A held pad whose every overtone wavers, like a choir, then a cassette with a full head bump and a rolled-off top.',
    effects: [
      { deviceId: 'sustainer', preset: 'Wavering choir', params: { attack: 0.418, glide: 0.533 } },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'four-track-low-cloud-tape',
    name: 'Low-cloud tape',
    category: 'tape',
    description:
      'A valve stage that gives way under loud notes, tails rising, then a worn dictation cassette, dull, trembling and full of hiss.',
    effects: [
      { deviceId: 'patina', preset: 'Valve bloom' },
      { deviceId: 'tape', preset: 'Old dictation', params: { output: -2.83 } },
    ],
  },
  {
    id: 'four-track-played-out-tape',
    name: 'Played-out tape',
    category: 'tape',
    description:
      'A four-track cassette, then hiss that swells in the gaps, into a long dark reverb whose tail sinks slowly in pitch.',
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { output: 2.06 } },
      {
        deviceId: 'noise-floor',
        preset: 'Breathing tape',
        params: { response: 0.793, hold: 13.5 },
      },
      { deviceId: 'bloom-reverb', preset: 'Long dark' },
    ],
  },
  {
    id: 'four-track-estuary-tape',
    name: 'Estuary tape',
    category: 'tape',
    description:
      'A ring-easing equaliser, then a tape reel pushed hard into thick saturation, then long backwards phrases an octave down, dark and slow.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 3.2 } },
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'reverse-delay', preset: 'Undertow', params: { time: 2260 } },
    ],
  },
  {
    id: 'four-track-tape-till-morning',
    name: 'Tape till morning',
    category: 'tape',
    description:
      'A four-track cassette, then dull, thick tape hiss, into a big muffled cave that rings for about six seconds.',
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'noise-floor', preset: 'Muffled hiss' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 6.39, breathRate: 0.278 } },
    ],
  },
  {
    id: 'four-track-bounced-loop',
    name: 'Bounced loop',
    category: 'tape',
    description:
      'A tape loop that wears thinner and duller on every pass, then a cassette with a full head bump and a rolled-off top.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 2.82 } },
      { deviceId: 'tape', preset: 'Warm thump', params: { output: 1.05 } },
    ],
  },
  {
    id: 'four-track-dune-grass-triode',
    name: 'Dune-grass triode',
    category: 'tape',
    description:
      'A triode valve stage, smoothly overdriven, then tape hiss that sinks under each note and swells in the gaps.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      {
        deviceId: 'noise-floor',
        preset: 'Breathing tape',
        params: { response: 0.916, hold: 15.2 },
      },
    ],
  },
  {
    id: 'four-track-grey-reel',
    name: 'Grey reel',
    category: 'tape',
    description:
      'A tape reel pushed hard into thick saturation, then quick waves of reverb rippling about twice a second.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'shaped-reverb', preset: 'Ripples' },
    ],
  },
  {
    id: 'four-track-hemlock-oxide',
    name: 'Hemlock oxide',
    category: 'tape',
    description:
      'An old slow reel that drifts, dulls and drops out, then a worn cassette that wobbles, drops out and hisses.',
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'patina', preset: 'Worn cassette' },
    ],
  },
  {
    id: 'four-track-fogbank-tape',
    name: 'Fogbank tape',
    category: 'tape',
    description:
      'A clean pass over fast new tape, with nothing added, then muffled tape hiss with its top taken off, steady and thick.',
    effects: [
      { deviceId: 'tape', preset: 'Clean transfer' },
      { deviceId: 'noise-floor', preset: 'Muffled hiss' },
    ],
  },
  {
    id: 'four-track-net-shed-tape',
    name: 'Net-shed tape',
    category: 'tape',
    description:
      'A high cut set low enough to muffle everything, then a worn cassette that wobbles, drops out and hisses, then a worn tape echo.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.38 } },
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'tape-echo', preset: 'Worn tape' },
    ],
  },
  {
    id: 'four-track-rented-cassette',
    name: 'Rented cassette',
    category: 'tape',
    description:
      'A transformer that fills out the lows and dulls the top, then a muffled cassette, into a small room that casts a shadow an octave below.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'tape', preset: 'Under a blanket', params: { output: -2.53 } },
      { deviceId: 'shimmer', preset: 'Low shadow', params: { decay: 1.9, predelay: 20.2 } },
    ],
  },
  {
    id: 'four-track-tape-in-wet-wool',
    name: 'Tape in wet wool',
    category: 'tape',
    description:
      'A half-speed tape loop in reverse, low and dark, then a muffled cassette, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards', params: { length: 3.7 } },
      { deviceId: 'tape', preset: 'Under a blanket' },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 62.3, midDecay: 2.18 },
      },
    ],
  },
  {
    id: 'four-track-lid-shut-memo',
    name: 'Lid-shut memo',
    category: 'tape',
    description:
      'A worn dictation cassette, dull, trembling and full of hiss, then a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'tape', preset: 'Old dictation' },
      { deviceId: 'expanse', preset: 'Far echoes' },
    ],
  },
  {
    id: 'four-track-alder-comb',
    name: 'Alder comb',
    category: 'motion',
    description:
      'A slow comb sliding against the dry sound, sides opposed, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'tremolo', preset: 'Drifting comb' },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'four-track-comb-by-the-stove',
    name: 'Comb by the stove',
    category: 'motion',
    description:
      'A slow comb sliding against the dry sound, sides opposed, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'tremolo', preset: 'Drifting comb' },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 63.8, midDecay: 1.87 },
      },
    ],
  },
  {
    id: 'four-track-rain-gutter-pan',
    name: 'Rain-gutter pan',
    category: 'motion',
    description:
      'A slow pan from side to side, a few seconds each way, into one taut dull spring that answers late and rings long.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.154 } },
      { deviceId: 'spring-reverb', preset: 'Dark late coil' },
    ],
  },
  {
    id: 'four-track-tremolo-under-eaves',
    name: 'Tremolo under eaves',
    category: 'motion',
    description:
      'A shudder in the level, too fast to count, into a hall heard from far off with little dry sound left.',
    effects: [
      { deviceId: 'tremolo', preset: 'Fast shudder', params: { rate: 17.1 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 21, lowDecay: 5.4, midDecay: 4.31 },
      },
    ],
  },
  {
    id: 'four-track-lean-to-swell',
    name: 'Lean-to swell',
    category: 'motion',
    description:
      'The level breathing in and out about every four seconds, then a gentle low-pass at a kilohertz.',
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.229 } },
      { deviceId: 'auto-filter', preset: 'Init' },
    ],
  },
  {
    id: 'four-track-ninety-minute-chops',
    name: 'Ninety-minute chops',
    category: 'motion',
    description:
      'Half-speed chunks an octave down, cut about twice a second, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'half-speed', preset: 'Slow chops', params: { length: 471 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'four-track-cloud-out-of-season',
    name: 'Cloud out of season',
    category: 'motion',
    description:
      'Twelve phaser stages tuned far apart, drifting slowly, into a room heard from its far end with little dry sound left.',
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { rate: 0.108 } },
      { deviceId: 'ether-reverb', preset: 'Distant' },
    ],
  },
  {
    id: 'four-track-rivermouth-bows',
    name: 'Rivermouth bows',
    category: 'texture',
    description:
      'A held pad that swells in slowly like bowed strings, then a flaking reel whose sound ducks and dulls at random.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings', params: { attack: 1.77, glide: 1.35 } },
      { deviceId: 'tape', preset: 'Crumbling oxide' },
    ],
  },
  {
    id: 'four-track-shingle-glow',
    name: 'Shingle glow',
    category: 'texture',
    description:
      'A thin, quiet held pad with its lows cut, behind the notes, into thirteen drone strings in D major kept near the centre.',
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Thin halo',
        params: { attack: 0.949, glide: 0.993, mix: 0.12 },
      },
      { deviceId: 'sympathetic', preset: 'Sitar drone', params: { mix: 0.24 } },
    ],
  },
  {
    id: 'four-track-bounced-wash',
    name: 'Bounced wash',
    category: 'texture',
    description:
      'A combo amplifier miked fairly close in a small room, then a wide, darkened wash in which every note slowly dissolves.',
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { output: -4.82 } },
      { deviceId: 'spectral-blur', preset: 'Slow dissolve' },
    ],
  },
  {
    id: 'four-track-buried-swells',
    name: 'Buried swells',
    category: 'texture',
    description:
      'The playing turned backwards in place of the dry sound, into a clean speaker at the far end of a big, live room.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards only', params: { time: 933 } },
      { deviceId: 're-amp', preset: 'Far end of the hall' },
    ],
  },
  {
    id: 'four-track-back-porch-fog',
    name: 'Back-porch fog',
    category: 'texture',
    description:
      'A dense, wide fog of grains that buries the dry sound, then a wash of three fed-back tape heads that hovers and fades.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Thick fog', params: { size: 554, density: 99.4 } },
      { deviceId: 'tape-echo', preset: 'Hovering wash', params: { time: 826 } },
    ],
  },
  {
    id: 'four-track-unheated-wash',
    name: 'Unheated wash',
    category: 'texture',
    description:
      'A very wide wash in which every note hangs for many seconds, then a shallow vibrato, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Endless', params: { mix: 0.45 } },
      { deviceId: 'tremolo', preset: 'Pitch wobble', params: { rate: 4.89 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 35.2, mix: 0.24 } },
    ],
  },
  {
    id: 'four-track-wash-in-november',
    name: 'Wash in november',
    category: 'texture',
    description:
      'A longer bowed swell that leans into every note, then a slowly dissolving wash, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'swell', preset: 'Slow bow' },
      { deviceId: 'spectral-blur', preset: 'Slow dissolve' },
      { deviceId: 'plate-reverb', preset: 'Long plate' },
    ],
  },
  {
    id: 'four-track-gauze-up-the-stairs',
    name: 'Gauze up the stairs',
    category: 'texture',
    description:
      'A faint haze just behind the dry sound, into a two-spring tank with a little chirp and drip.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Faint haze' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { decay: 2.52 } },
    ],
  },
  {
    id: 'four-track-hold-at-low-tide',
    name: 'Hold at low tide',
    category: 'texture',
    description:
      'The first phrase played, held an octave down as a dark drone, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Deep drone', params: { length: 2.8 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'four-track-octave-in-the-rain',
    name: 'Octave in the rain',
    category: 'pitch',
    description:
      'A muffled octave below, then a worn dictation cassette, dull, trembling and full of hiss, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor', params: { length: 2160 } },
      { deviceId: 'tape', preset: 'Old dictation', params: { output: -3.19 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'four-track-damp-octave',
    name: 'Damp octave',
    category: 'pitch',
    description:
      'A muffled octave below, then a lightly worn reel, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor', params: { length: 1950 } },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 28.9, modRate: 0.106 } },
    ],
  },
  {
    id: 'four-track-chops-on-the-ebb',
    name: 'Chops on the ebb',
    category: 'pitch',
    description:
      'Half-speed chops, then a muffled cassette, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'half-speed', preset: 'Slow chops' },
      { deviceId: 'tape', preset: 'Under a blanket', params: { output: -2.55 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'four-track-track-four-undertow',
    name: 'Track-four undertow',
    category: 'pitch',
    description:
      'A long half-speed drag, then a cassette with a full head bump and a rolled-off top, into a slowly breathing hall.',
    effects: [
      { deviceId: 'half-speed', preset: 'Long drag' },
      { deviceId: 'tape', preset: 'Warm thump', params: { output: -3.03 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing' },
    ],
  },
  {
    id: 'four-track-hand-labelled-octave',
    name: 'Hand-labelled octave',
    category: 'pitch',
    description:
      'A rounded octave below every note of a chord, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'four-track-sunday-octave',
    name: 'Sunday octave',
    category: 'pitch',
    description:
      'A dark half-speed octave kept low under the dry sound, into a dark cellar of a room that folds the sound to mono.',
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1070, mix: 0.18 } },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { decay: 3.33, mix: 0.24 } },
    ],
  },
  {
    id: 'four-track-blanketed-strings',
    name: 'Blanketed strings',
    category: 'pitch',
    description:
      'A dark, low string pad like cellos under the playing, then a fresh reel of tape, open on top and nearly steady.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { rise: 1.64, fall: 8.4 } },
      { deviceId: 'patina', preset: 'New tape' },
    ],
  },
  {
    id: 'four-track-slowed-octave',
    name: 'Slowed octave',
    category: 'pitch',
    description:
      'A dark octave below held chords, every note moved cleanly, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad below' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { preDelay: 98.3, lowDecay: 7.37 } },
    ],
  },
  {
    id: 'four-track-pedals-in-the-dark',
    name: 'Pedals in the dark',
    category: 'pitch',
    description:
      'Deep pedal notes two octaves down that swell in slowly, then a reverb that swells and ebbs in waves of about four seconds.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals', params: { attack: 1.36 } },
      { deviceId: 'shaped-reverb', preset: 'Slow tide' },
    ],
  },
  {
    id: 'four-track-space-heater-iron',
    name: 'Space-heater iron',
    category: 'master',
    description:
      'A transformer driven so the low end thickens and loosens, then a compressor as slow as a hand on a fader, then a pushed limiter.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'ambient-comp', preset: 'Slow fader' },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { outputGain: -9.03 } },
    ],
  },
  {
    id: 'four-track-one-take-room',
    name: 'One-take room',
    category: 'master',
    description:
      'The close reflections of a very small room, then a fast limiter with the level lifted a little into it.',
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Short ambience',
        params: { decay: 0.419, breathRate: 0.298 },
      },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -5.16 } },
    ],
  },
  {
    id: 'four-track-width-in-coast-fog',
    name: 'Width in coast fog',
    category: 'master',
    description:
      'An equaliser that adds lows and body and eases the top, then the sides lifted a little, wider with nothing added, then a pushed limiter.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.43 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'four-track-rain-day-glue',
    name: 'Rain-day glue',
    category: 'master',
    description:
      'A mid-forward tone, then a slow compressor that evens out swells over seconds, then a low ceiling with the sound pushed hard up against it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.63 } },
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 287, release: 2.23 } },
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 3.95 } },
    ],
  },
  {
    id: 'four-track-sandbar-desk',
    name: 'Sandbar desk',
    category: 'master',
    description:
      'A hot console channel, then a heavy low shelf that puts weight under the sound, then an eased-back ceiling.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Hot channel' },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.24 } },
      { deviceId: 'ambient-limiter', preset: 'Pull back' },
    ],
  },
  {
    id: 'four-track-homemade-tape',
    name: 'Homemade tape',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a parallel compressor, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 429, release: 2.94 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 6.65 } },
    ],
  },
]
