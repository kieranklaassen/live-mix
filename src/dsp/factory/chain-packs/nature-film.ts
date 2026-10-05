// Faded Nature Film: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'nature-film-bog-cotton-room',
    name: 'Bog-cotton room',
    category: 'space',
    description:
      'A short room whose tail splits towards a fifth up and down, into a cloud of reverb that swells in after each note and fades.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Quick sparkle' },
      { deviceId: 'shaped-reverb', preset: 'Bloom' },
    ],
  },
  {
    id: 'nature-film-closedown-sway',
    name: 'Closedown sway',
    category: 'space',
    description:
      'A long tail that wavers in pitch like an unsteady choir, then a phaser held still, two fixed peaks like a vowel.',
    effects: [
      { deviceId: 'expanse', preset: 'Seasick choir' },
      { deviceId: 'phaser', preset: 'Still formant', params: { rate: 0.275 } },
    ],
  },
  {
    id: 'nature-film-heather-plate',
    name: 'Heather plate',
    category: 'space',
    description:
      'A reverb that falls away in a straight line, into a medium plate with a smooth tail of a few seconds.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Falling', params: { time: 1.56, preDelay: 17.8 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { predelayMs: 21.1 } },
    ],
  },
  {
    id: 'nature-film-faded-undertow',
    name: 'Faded undertow',
    category: 'space',
    description:
      'A hall whose lows ring on long after the rest has gone, then two copies in tune that wander like extra takes.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 53.8, lowDecay: 7.52, midDecay: 1.87 },
      },
      { deviceId: 'stereo-detune', preset: 'Drifting', params: { delay: 25.1 } },
    ],
  },
  {
    id: 'nature-film-shade-on-a-wet-day',
    name: 'Shade on a wet day',
    category: 'space',
    description:
      'A low cut and a small dip in the low mids, to make room, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Layer' },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'nature-film-kestrel-haze',
    name: 'Kestrel haze',
    category: 'space',
    description:
      'A far-off plate with a long soft tail and little dry sound, then a compressor as slow as a hand on a fader.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
      { deviceId: 'ambient-comp', preset: 'Slow fader', params: { makeup: -0.608 } },
    ],
  },
  {
    id: 'nature-film-hired-print-cavern',
    name: 'Hired-print cavern',
    category: 'space',
    description:
      'A bright, lean console channel driven for an edge on top, into a big muffled cave that rings for about six seconds.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Sheen' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 5.76, breathRate: 0.316 } },
    ],
  },
  {
    id: 'nature-film-salmon-run-tail',
    name: 'Salmon-run tail',
    category: 'space',
    description:
      'A warm, full equaliser, then a small plate that is gone in a second or two, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.44 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { predelayMs: 10.4 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { predelayMs: 29.2 } },
    ],
  },
  {
    id: 'nature-film-vault-in-the-can',
    name: 'Vault in the can',
    category: 'space',
    description:
      'A wobbling tape double a moment behind each note, into a dark cellar of a room that folds the sound to mono.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Wobbly double' },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { decay: 2.68 } },
    ],
  },
  {
    id: 'nature-film-caravan-fog',
    name: 'Caravan fog',
    category: 'space',
    description:
      'A small room that answers about an eighth of a second late, into a dull reverb that swells in over seconds and fades slowly.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Slap room' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'nature-film-film-strip-sheen',
    name: 'Film-strip sheen',
    category: 'space',
    description:
      'A wobbling tape double a moment behind each note, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Wobbly double', params: { time: 32.2 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'nature-film-echo-blinds-down',
    name: 'Echo blinds down',
    category: 'echo',
    description:
      'A quick shallow vibrato such as a string player makes, then a slow, dull echo from a worn-out bucket-brigade line.',
    effects: [
      { deviceId: 'tremolo', preset: 'Pitch wobble', params: { rate: 5.64 } },
      { deviceId: 'analog-delay', preset: 'Noisy clock' },
    ],
  },
  {
    id: 'nature-film-mustard-trace',
    name: 'Mustard trace',
    category: 'echo',
    description:
      'A quick flutter of three voices over the dry sound, then a faint trace of tape echo behind the playing.',
    effects: [
      { deviceId: 'chorus', preset: 'Fast flutter', params: { rate: 5.69, delayMs: 6.86 } },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 481 } },
    ],
  },
  {
    id: 'nature-film-off-speed-reel',
    name: 'Off-speed reel',
    category: 'echo',
    description:
      'A deep pitch wobble in the centre, like a warped tape, then a dull, wobbling, saturated echo on worn tape.',
    effects: [
      { deviceId: 'chorus', preset: 'Warped tape' },
      { deviceId: 'tape-echo', preset: 'Worn tape' },
    ],
  },
  {
    id: 'nature-film-curlew-echo',
    name: 'Curlew echo',
    category: 'echo',
    description:
      'A fast warble of two voices pulling against each other, then an echo with a fast flutter in the pitch of its repeats.',
    effects: [
      { deviceId: 'chorus', preset: 'Vibrato', params: { rate: 5.91, delayMs: 5.96 } },
      { deviceId: 'analog-delay', preset: 'Fluttering' },
    ],
  },
  {
    id: 'nature-film-curlew-mirror',
    name: 'Curlew mirror',
    category: 'echo',
    description:
      'A faint backwards swell behind each phrase, then a four-track cassette, dull on top, unsteady and hissing.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Faint reflection' },
      { deviceId: 'tape', preset: 'Cassette four-track' },
    ],
  },
  {
    id: 'nature-film-echo-at-closedown',
    name: 'Echo at closedown',
    category: 'echo',
    description:
      'Backwards chunks spliced hard, with no fades between them, then a muffled cassette, its top rolled off and its lows lifted.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Hard splices', params: { time: 427 } },
      { deviceId: 'tape', preset: 'Under a blanket' },
    ],
  },
  {
    id: 'nature-film-echo-in-heather',
    name: 'Echo in heather',
    category: 'echo',
    description:
      'A backwards echo of each phrase, swelling in and cut off, then a slow reel whose pitch sways widely and never settles.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { time: 610 } },
      { deviceId: 'tape', preset: 'Seasick' },
    ],
  },
  {
    id: 'nature-film-peat-water-echo',
    name: 'Peat-water echo',
    category: 'echo',
    description:
      'A tape preamp driven for thick lows and a dull top, then a short soft tape echo, into three long springs with all the top taken off.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -9.15 } },
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'nature-film-trace-on-the-moor',
    name: 'Trace on the moor',
    category: 'echo',
    description:
      'A faint, dull echo with a slow chorus on it, into a trace of room around the sound.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Faint halo', params: { time: 266, modRate: 0.366 } },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'nature-film-lights-off-stairs',
    name: 'Lights-off stairs',
    category: 'echo',
    description:
      'Backwards repeats that step down an octave each time, into a tight damped little room that is barely there.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Descending steps' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'nature-film-echo-after-lunch',
    name: 'Echo after lunch',
    category: 'echo',
    description:
      'A far-off horn loudspeaker, then a soft slap close behind each note, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 're-amp', preset: 'Station platform', params: { output: 6.78 } },
      { deviceId: 'analog-delay', preset: 'Slapback' },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 6.36, modRate: 0.442 } },
    ],
  },
  {
    id: 'nature-film-half-term-echo',
    name: 'Half-term echo',
    category: 'echo',
    description:
      'A tape reel pushed hard into thick saturation, then whole phrases played backwards about four seconds later.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard', params: { output: -0.913 } },
      { deviceId: 'reverse-delay', preset: 'Long mirror' },
    ],
  },
  {
    id: 'nature-film-sampler-under-haar',
    name: 'Sampler under haar',
    category: 'echo',
    description:
      'A short loop at an eighth of the sample rate, dull and plain, into a small room that is over in about a second.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Sampler grit', params: { length: 0.925 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Room',
        params: { preDelay: 26.9, lowDecay: 1.32, midDecay: 1.07 },
      },
    ],
  },
  {
    id: 'nature-film-seventies-reel',
    name: 'Seventies reel',
    category: 'echo',
    description:
      'A dull, wobbling, saturated echo on worn tape, then a gentle low-pass at a kilohertz.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 579 } },
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { lfoRateHz: 1.05, envAttackMs: 9.87, envReleaseMs: 181 },
      },
    ],
  },
  {
    id: 'nature-film-otter-echo',
    name: 'Otter echo',
    category: 'echo',
    description:
      'Dotted tape repeats that pile up in a darkening wash, into a mellow reverb whose tail splits upwards and downwards.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Dub wash' },
      { deviceId: 'bloom-reverb', preset: 'Scatter', params: { decay: 8.48 } },
    ],
  },
  {
    id: 'nature-film-echo-in-corduroy',
    name: 'Echo in corduroy',
    category: 'echo',
    description:
      'A dull, wobbling, saturated echo on worn tape, then a three-voice chorus spread wide across the sides.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 596 } },
      { deviceId: 'chorus', preset: 'Wide chorus' },
    ],
  },
  {
    id: 'nature-film-last-period-oxide',
    name: 'Last-period oxide',
    category: 'tape',
    description:
      'Three voices, no dry sound, then an old slow reel that drifts, dulls and drops out, into a faint single spring.',
    effects: [
      { deviceId: 'chorus', preset: 'Voices only' },
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { decay: 1.56 } },
    ],
  },
  {
    id: 'nature-film-cassette-on-film',
    name: 'Cassette on film',
    category: 'tape',
    description:
      'A sharp copy on the left and a flat one on the right, then a thick, soft cassette, into a small dead booth that is gone almost at once.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { delay: 15.4 } },
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'nature-film-wobbling-sway',
    name: 'Wobbling sway',
    category: 'tape',
    description:
      'Two dark late copies, then a slow reel whose pitch sways widely and never settles, then an amp in a cupboard.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Shadow', params: { delay: 26.1 } },
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 're-amp', preset: 'In the cupboard' },
    ],
  },
  {
    id: 'nature-film-reel-in-the-glen',
    name: 'Reel in the glen',
    category: 'tape',
    description:
      'Only the two detuned copies, hard left and right, then a tape reel with soft saturation, slight wobble and hiss, into a tight chamber.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wet only' },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      {
        deviceId: 'hall-reverb',
        preset: 'Tight chamber',
        params: { preDelay: 22.5, lowDecay: 1.08 },
      },
    ],
  },
  {
    id: 'nature-film-reel-over-credits',
    name: 'Reel over credits',
    category: 'tape',
    description:
      'Two late copies either side, like loose double-tracking, then a reel of tape, into a short diffuse haze around the sound, like a small room.',
    effects: [
      { deviceId: 'chorus', preset: 'Loose double' },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'spectral-blur', preset: 'Diffuse room' },
    ],
  },
  {
    id: 'nature-film-depths-blinds-down',
    name: 'Depths blinds down',
    category: 'tape',
    description:
      'Converters at a very low rate, filtered smooth and dull, then a flaking reel, then a sinking octave echo.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sunken' },
      { deviceId: 'tape', preset: 'Crumbling oxide' },
      { deviceId: 'analog-delay', preset: 'Falling tape', params: { time: 452, modRate: 0.333 } },
    ],
  },
  {
    id: 'nature-film-heather-bits',
    name: 'Heather bits',
    category: 'tape',
    description:
      'Folding low-rate converters, then a four-track cassette, then a wide echo whose repeats drift slowly in pitch.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Metallic' },
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'analog-delay', preset: 'Slow drift', params: { time: 577, modRate: 0.0974 } },
    ],
  },
  {
    id: 'nature-film-sixteen-mil-sampler',
    name: 'Sixteen-mil sampler',
    category: 'tape',
    description:
      'Dull low-rate converters, then a worn cassette that wobbles, drops out and hisses, then two tape heads that make every repeat gallop.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sunken' },
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'tape-echo', preset: 'Two head gallop' },
    ],
  },
  {
    id: 'nature-film-lapwing-loop',
    name: 'Lapwing loop',
    category: 'tape',
    description:
      'A dull quarter-rate loop, then a trembling reel, then a short echo whose pitch sways like a seasick vibrato.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Lo-fi quarter', params: { length: 1.56 } },
      { deviceId: 'tape', preset: 'Flutter shimmer' },
      { deviceId: 'analog-delay', preset: 'Seasick', params: { time: 165, modRate: 3.23 } },
    ],
  },
  {
    id: 'nature-film-bracken-bits',
    name: 'Bracken bits',
    category: 'tape',
    description:
      'Five-bit converters fed hot, a coarse grain on every note, then a mangled cassette, then a fluttering echo.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Crushed' },
      { deviceId: 'tape', preset: 'Chewed cassette', params: { output: -5.15 } },
      { deviceId: 'analog-delay', preset: 'Fluttering', params: { time: 236, modRate: 7.13 } },
    ],
  },
  {
    id: 'nature-film-loop-as-narrated',
    name: 'Loop as narrated',
    category: 'tape',
    description:
      'A short tape loop where each pass comes back quieter, then a tape preamp overloaded until it breaks up, dull and thick.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade', params: { length: 1.81 } },
      { deviceId: 'analog-drive', preset: 'Worn tape', params: { output: -11.5 } },
    ],
  },
  {
    id: 'nature-film-sprocket-record',
    name: 'Sprocket record',
    category: 'tape',
    description:
      'A dull hard clipper with no oversampling, so it aliases, then a worn-out groove that dulls the top and fuzzes loud highs.',
    effects: [
      { deviceId: 'saturator', preset: 'Lo-fi' },
      { deviceId: 'vinyl', preset: 'Inner groove', params: { spin: 1.66 } },
    ],
  },
  {
    id: 'nature-film-osprey-dust',
    name: 'Osprey dust',
    category: 'tape',
    description:
      'A transformer driven so the low end thickens and loosens, then ten-bit converters on a shaky clock, dull, with riding hiss.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { output: -7.63 } },
      { deviceId: 'vintage-digital', preset: 'Dusty' },
    ],
  },
  {
    id: 'nature-film-tideline-clock',
    name: 'Tideline clock',
    category: 'tape',
    description:
      'Smooth, dull converters whose clock is badly unsteady, then echoes that creep sharp on the left and flat on the right.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Jittery' },
      { deviceId: 'freq-shifter', preset: 'Split sky', params: { delay: 161, lfoRate: 0.11 } },
    ],
  },
  {
    id: 'nature-film-reel-gone-magenta',
    name: 'Reel gone magenta',
    category: 'tape',
    description:
      'An old slow reel that drifts, dulls and drops out, into a single saturated tape slap behind each note.',
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 95.3 } },
    ],
  },
  {
    id: 'nature-film-wheeled-in-static',
    name: 'Wheeled-in static',
    category: 'tape',
    description:
      'A deep eight-stage phaser with sharp peaks between notches, then a shortwave broadcast, narrow and mono, fading under static.',
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.218 } },
      { deviceId: 'patina', preset: 'Shortwave', params: { output: 4.17 } },
    ],
  },
  {
    id: 'nature-film-chalk-dust-record',
    name: 'Chalk-dust record',
    category: 'tape',
    description:
      'A badly worn record, swaying in pitch under loud crackle, into a hint of open space behind the sound.',
    effects: [
      { deviceId: 'patina', preset: 'Scratched record' },
      { deviceId: 'expanse', preset: 'Faint air', params: { decay: 3.3, modRate: 0.422 } },
    ],
  },
  {
    id: 'nature-film-bits-at-half-term',
    name: 'Bits at half-term',
    category: 'tape',
    description:
      'A bed of six-bit grit and false tones under the clean sound, then a steep low-pass at four hundred hertz, the top gone.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Grit bed', params: { mix: 0.21 } },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { lfoRateHz: 1.08, envAttackMs: 10.6, envReleaseMs: 196 },
      },
    ],
  },
  {
    id: 'nature-film-drizzle-warp',
    name: 'Drizzle warp',
    category: 'tape',
    description:
      'A deep pitch wobble in the centre, like a warped tape, then a high cut set low enough to muffle everything.',
    effects: [
      { deviceId: 'chorus', preset: 'Warped tape' },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.35 } },
    ],
  },
  {
    id: 'nature-film-film-can-radio',
    name: 'Film-can radio',
    category: 'tape',
    description:
      'A small radio speaker, mono and boxy, with the lows gone, then a pure low mains hum in the middle of the sound.',
    effects: [
      { deviceId: 'patina', preset: 'Kitchen radio' },
      { deviceId: 'noise-floor', preset: 'Mains hum', params: { response: 0.431, hold: 18.2 } },
    ],
  },
  {
    id: 'nature-film-phone-in-the-can',
    name: 'Phone in the can',
    category: 'tape',
    description:
      'A thin band of tone with the lows cut and the top rolled off, then a digital telephone line, eight bits, band-limited and dull.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { clearTime: 1.6 } },
      { deviceId: 'vintage-digital', preset: 'Phone' },
    ],
  },
  {
    id: 'nature-film-hillside-bits',
    name: 'Hillside bits',
    category: 'tape',
    description:
      'A half-speed loop, then an early sampler at a low rate, its top filtered away, into three long springs that chirp and drip.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed', params: { length: 2.37 } },
      { deviceId: 'patina', preset: 'Muffled sampler' },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { decay: 4.96 } },
    ],
  },
  {
    id: 'nature-film-schools-tape',
    name: 'Schools tape',
    category: 'tape',
    description:
      'A warm amplifier stack, then a worn cassette that wobbles, drops out and hisses, into a hint of a two-spring tank behind the sound.',
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack' },
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'nature-film-clock-gone-magenta',
    name: 'Clock gone magenta',
    category: 'tape',
    description:
      'A ten-stage phaser that takes most of a minute to sweep, then smooth, dull converters whose clock is badly unsteady.',
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { rate: 0.0223 } },
      { deviceId: 'vintage-digital', preset: 'Jittery' },
    ],
  },
  {
    id: 'nature-film-parquet-reel',
    name: 'Parquet reel',
    category: 'tape',
    description:
      'A slow reel whose pitch sways widely and never settles, then a medium-wave station under the crackle of a far storm.',
    effects: [
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'radio', preset: 'Storm coming' },
    ],
  },
  {
    id: 'nature-film-gorse-dust',
    name: 'Gorse dust',
    category: 'tape',
    description:
      'A small speaker, close and muffled, as if under a pillow, then a flat, unworn record under a thick bed of crackle.',
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker' },
      { deviceId: 'vinyl', preset: 'Crackle bed', params: { spin: 1.54 } },
    ],
  },
  {
    id: 'nature-film-buckled-wreck',
    name: 'Buckled wreck',
    category: 'tape',
    description:
      'A ruined cassette that lurches, drops out and hisses hard, then a well-played record, dulled, swaying, with ticks and pops.',
    effects: [
      { deviceId: 'patina', preset: 'Falling apart' },
      { deviceId: 'vinyl', preset: 'Charity shop find', params: { spin: 1.46 } },
    ],
  },
  {
    id: 'nature-film-tin-roof-record',
    name: 'Tin-roof record',
    category: 'tape',
    description:
      'A worn, swaying record, then radio static that drifts and crackles under the sound, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'patina', preset: 'Scratched record' },
      { deviceId: 'noise-floor', preset: 'Radio static', params: { response: 0.355, hold: 9.66 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'nature-film-classroom-swirl',
    name: 'Classroom swirl',
    category: 'motion',
    description:
      'A four-stage phaser kept high, leaving the low end alone, then a worn dictation cassette, dull, trembling and full of hiss.',
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe' },
      { deviceId: 'tape', preset: 'Old dictation' },
    ],
  },
  {
    id: 'nature-film-duffel-coat-phaser',
    name: 'Duffel-coat phaser',
    category: 'motion',
    description:
      'A hollow phaser with peaks where its notches would be, then a coarse early sampler, gritty, with bright hash on top.',
    effects: [
      { deviceId: 'phaser', preset: 'Negative notch', params: { rate: 0.227 } },
      { deviceId: 'patina', preset: 'Eight bit' },
    ],
  },
  {
    id: 'nature-film-phaser-in-a-bothy',
    name: 'Phaser in a bothy',
    category: 'motion',
    description:
      'A ten-stage phaser falling from the top again and again, then a cassette with a full head bump and a rolled-off top.',
    effects: [
      { deviceId: 'phaser', preset: 'Endless fall', params: { rate: 0.38 } },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'nature-film-curlew-phaser',
    name: 'Curlew phaser',
    category: 'motion',
    description:
      'A phaser swirl about a quarter of a minute round, then an old slow reel that drifts, dulls and drops out.',
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.0593 } },
      { deviceId: 'tape', preset: 'Worn thin' },
    ],
  },
  {
    id: 'nature-film-glen-phaser',
    name: 'Glen phaser',
    category: 'motion',
    description:
      'A deep eight-stage phaser with sharp peaks between notches, then a drifting reel laid half against the dry sound, a chorus.',
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage' },
      { deviceId: 'tape', preset: 'Drifting chorus' },
    ],
  },
  {
    id: 'nature-film-drift-on-a-wet-day',
    name: 'Drift on a wet day',
    category: 'motion',
    description:
      'An amplifier stack, all bass, with the mic turned away, then a slow phasing drift from partials moved less than a hertz.',
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly' },
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { delay: 42.5, lfoRate: 0.0837 } },
    ],
  },
  {
    id: 'nature-film-frogspawn-swirl',
    name: 'Frogspawn swirl',
    category: 'motion',
    description:
      'A six-stage phaser turning about every three seconds, then a heavy low shelf that puts weight under the sound.',
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.337 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.15 } },
    ],
  },
  {
    id: 'nature-film-phaser-at-half-term',
    name: 'Phaser at half-term',
    category: 'motion',
    description:
      'A ten-stage phaser falling from the top again and again, into a hall heard from far off with little dry sound left.',
    effects: [
      { deviceId: 'phaser', preset: 'Endless fall' },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 22.1, lowDecay: 4.41, midDecay: 4.09 },
      },
    ],
  },
  {
    id: 'nature-film-wobble-under-haar',
    name: 'Wobble under haar',
    category: 'motion',
    description:
      'A gentle low-pass at a kilohertz, then a deep pitch wobble with the two sides bending out of step.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { lfoRateHz: 1.04, envAttackMs: 10.1, envReleaseMs: 176 },
      },
      { deviceId: 'tremolo', preset: 'Wide wobble' },
    ],
  },
  {
    id: 'nature-film-chorus-in-class',
    name: 'Chorus in class',
    category: 'motion',
    description:
      'A light two-voice chorus that widens more than it moves, then a phaser held still, two fixed peaks like a vowel.',
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { rate: 0.319, delayMs: 8.07 } },
      { deviceId: 'phaser', preset: 'Still formant' },
    ],
  },
  {
    id: 'nature-film-chorus-on-a-lean',
    name: 'Chorus on a lean',
    category: 'motion',
    description:
      'A drifting reel laid half against the dry sound, a chorus, into a late wall of reverb that holds and stops dead.',
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'shaped-reverb', preset: 'Late wall' },
    ],
  },
  {
    id: 'nature-film-regional-air',
    name: 'Regional air',
    category: 'motion',
    description:
      'A trace of short flanger, opposite on the two sides, then a wide echo whose repeats drift slowly in pitch.',
    effects: [
      { deviceId: 'flanger', preset: 'Faint air' },
      { deviceId: 'analog-delay', preset: 'Slow drift', params: { time: 600, modRate: 0.0971 } },
    ],
  },
  {
    id: 'nature-film-moorland-scatter',
    name: 'Moorland scatter',
    category: 'motion',
    description:
      'Dark, thick valve grit, then a phaser with no dry sound, pulling the two sides apart, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit' },
      { deviceId: 'phaser', preset: 'Stereo scatter', params: { rate: 0.265 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 39.2 } },
    ],
  },
  {
    id: 'nature-film-voice-over-echo',
    name: 'Voice-over echo',
    category: 'motion',
    description:
      'A wide echo whose repeats drift slowly in pitch, into a tight chamber close round the sound for about a second.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slow drift', params: { time: 688, modRate: 0.103 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'nature-film-nature-table-swirl',
    name: 'Nature-table swirl',
    category: 'motion',
    description:
      'A four-stage phaser kept high, leaving the low end alone, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.392 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 20.2 } },
    ],
  },
  {
    id: 'nature-film-field-trip-sweep',
    name: 'Field-trip sweep',
    category: 'motion',
    description:
      'A trace of dull detuned copies at the edges, then a very short flanger swept nearly down to nothing.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Faint width', params: { delay: 13.2 } },
      { deviceId: 'flanger', preset: 'Through-zero feel' },
    ],
  },
  {
    id: 'nature-film-autumn-term-chorus',
    name: 'Autumn-term chorus',
    category: 'motion',
    description:
      'A phaser held still, two fixed peaks like a vowel, then a quick flutter of three voices over the dry sound.',
    effects: [
      { deviceId: 'phaser', preset: 'Still formant', params: { rate: 0.312 } },
      { deviceId: 'chorus', preset: 'Fast flutter' },
    ],
  },
  {
    id: 'nature-film-seesaw-on-the-moor',
    name: 'Seesaw on the moor',
    category: 'motion',
    description:
      'A reel driven as hard as it goes, thick with harmonics, then the tone rocking slowly from dark to bright, sides opposed.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned', params: { output: -2.24 } },
      { deviceId: 'tremolo', preset: 'Tilting tone' },
    ],
  },
  {
    id: 'nature-film-magenta-spiral',
    name: 'Magenta spiral',
    category: 'motion',
    description:
      'A valve stage that gives way under loud notes, tails rising, then a resonant comb that seems to climb without end.',
    effects: [
      { deviceId: 'patina', preset: 'Valve bloom', params: { output: -8.03 } },
      { deviceId: 'freq-shifter', preset: 'Barber pole', params: { lfoRate: 0.0823 } },
    ],
  },
  {
    id: 'nature-film-estuary-pad',
    name: 'Estuary pad',
    category: 'texture',
    description:
      'A held pad alone, in place of the sound that was played, then four-bit companded converters that rasp on every note.',
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Held sound alone',
        params: { attack: 0.124, glide: 0.321 },
      },
      { deviceId: 'vintage-digital', preset: 'Rasp' },
    ],
  },
  {
    id: 'nature-film-rumble-after-lunch',
    name: 'Rumble after lunch',
    category: 'texture',
    description:
      'A low blurred bed under the sound, nothing above the bass, then a bucket-brigade echo whose soft repeats dull as they fade.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Sub bed', params: { mix: 0.189 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 368, modRate: 0.675, mix: 0.21 },
      },
    ],
  },
  {
    id: 'nature-film-test-card-gauze',
    name: 'Test-card gauze',
    category: 'texture',
    description:
      'A thin veil of grains just behind the dry sound, then a deep pitch wobble in the centre, like a warped tape.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Thin veil' },
      { deviceId: 'chorus', preset: 'Warped tape' },
    ],
  },
  {
    id: 'nature-film-haar-strings',
    name: 'Haar strings',
    category: 'texture',
    description:
      'A dark, low string pad like cellos under the playing, then seven-bit converters whose quiet tails break up and cut off.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { rise: 1.48, fall: 7.67 } },
      { deviceId: 'vintage-digital', preset: 'Coarse' },
    ],
  },
  {
    id: 'nature-film-changeover-haze',
    name: 'Changeover haze',
    category: 'texture',
    description:
      'A late-blooming slow swell, then a faint haze just behind the dry sound, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1380, release: 830 } },
      { deviceId: 'spectral-blur', preset: 'Faint haze' },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'nature-film-afterglow-in-the-can',
    name: 'Afterglow in the can',
    category: 'texture',
    description:
      'A short glow of held tone that dies just after each note, then twelve phaser stages tuned far apart, drifting slowly.',
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Brief afterglow',
        params: { attack: 0.0308, glide: 0.0278 },
      },
      { deviceId: 'phaser', preset: 'Twelve stage cloud' },
    ],
  },
  {
    id: 'nature-film-projector-bounce',
    name: 'Projector bounce',
    category: 'texture',
    description:
      'Slices that repeat faster and faster like a dropped ball, into a small dead booth that is gone almost at once.',
    effects: [
      { deviceId: 'glitch', preset: 'Bouncing', params: { time: 307 } },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'nature-film-half-term-strings',
    name: 'Half-term strings',
    category: 'texture',
    description:
      'A deep, slow compressor that lifts a quiet bed and holds it, then a string pad that arrives long after the chord and stays.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
      { deviceId: 'pad-follower', preset: 'Late tide' },
    ],
  },
  {
    id: 'nature-film-regional-chorus',
    name: 'Regional chorus',
    category: 'texture',
    description:
      'A detuned double made of grains, spread to the sides, into a hall that answers about a quarter of a second late.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Detuned double', params: { size: 117, density: 36.8 } },
      { deviceId: 'fdn-reverb', preset: 'Late arrival' },
    ],
  },
  {
    id: 'nature-film-slow-pan-octave',
    name: 'Slow-pan octave',
    category: 'pitch',
    description:
      'A muffled half-speed octave below, all lows, in the middle, then a dusty record, gently warped, with crackle in the groove.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor', params: { length: 1780 } },
      { deviceId: 'patina', preset: 'Dusty record' },
    ],
  },
  {
    id: 'nature-film-fourth-in-the-rushes',
    name: 'Fourth in the rushes',
    category: 'pitch',
    description:
      'A close harmony a fourth below, made of short slowed pieces, then a deep pitch wobble in the centre, like a warped tape.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth below' },
      { deviceId: 'chorus', preset: 'Warped tape', params: { rate: 1.21, delayMs: 28.5 } },
    ],
  },
  {
    id: 'nature-film-autumn-term-octave',
    name: 'Autumn-term octave',
    category: 'pitch',
    description:
      'A half-speed replay an octave down, with no dry sound, then a warped record through a dark cartridge, swaying slowly.',
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed' },
      { deviceId: 'vinyl', preset: 'Slow platter', params: { spin: 5.61 } },
    ],
  },
  {
    id: 'nature-film-interlude-octave',
    name: 'Interlude octave',
    category: 'pitch',
    description:
      'A muffled half-speed octave below, all lows, in the middle, then a warped record through a dark cartridge, swaying slowly.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor', params: { length: 1990 } },
      { deviceId: 'vinyl', preset: 'Slow platter', params: { spin: 5.07 } },
    ],
  },
  {
    id: 'nature-film-take-up-pedals',
    name: 'Take-up pedals',
    category: 'pitch',
    description:
      'A console channel run hot with its level pulled back down, then deep pedal notes two octaves down that swell in slowly.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Hot channel', params: { output: -20.5 } },
      { deviceId: 'octaves', preset: 'Slow pedals', params: { attack: 1.19 } },
    ],
  },
  {
    id: 'nature-film-slowed-down-crawl',
    name: 'Slowed-down crawl',
    category: 'pitch',
    description:
      'A quarter-speed crawl two octaves down, smooth and unbroken, then a quiet string pad kept far behind the playing.',
    effects: [
      { deviceId: 'half-speed', preset: 'Quarter speed', params: { length: 4000 } },
      { deviceId: 'pad-follower', preset: 'Barely there', params: { rise: 2.14, fall: 6.62 } },
    ],
  },
  {
    id: 'nature-film-octave-by-the-loch',
    name: 'Octave by the loch',
    category: 'pitch',
    description:
      'The level rising and falling at random, like surf, then a single voice an octave below the dry sound, darkened.',
    effects: [
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.263 } },
      { deviceId: 'pitch-shifter', preset: 'Octave down', params: { size: 84 } },
    ],
  },
  {
    id: 'nature-film-fourth-from-a-hide',
    name: 'Fourth from a hide',
    category: 'pitch',
    description:
      'A wide, slowed copy a fourth below that drifts behind, then a resonant high-pass falling for about two seconds at a time.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth down drift', params: { length: 3180, mix: 0.36 } },
      {
        deviceId: 'auto-filter',
        preset: 'Falling high-pass',
        params: { lfoRateHz: 0.56, envAttackMs: 9.8, envReleaseMs: 204 },
      },
    ],
  },
  {
    id: 'nature-film-slip-run-slow',
    name: 'Slip run slow',
    category: 'pitch',
    description:
      'Uneven chunks a fourth down, like tape slipping and catching, then a tape preamp overloaded until it breaks up, dull and thick.',
    effects: [
      { deviceId: 'half-speed', preset: 'Tape slip', params: { length: 692 } },
      { deviceId: 'analog-drive', preset: 'Worn tape', params: { output: -12.1 } },
    ],
  },
  {
    id: 'nature-film-bass-for-schools',
    name: 'Bass for schools',
    category: 'pitch',
    description:
      'A soft bass two octaves below, and a little one octave below, then a slow, dull echo from a worn-out bucket-brigade line.',
    effects: [
      { deviceId: 'octaves', preset: 'Deep' },
      { deviceId: 'analog-delay', preset: 'Noisy clock', params: { time: 1180, modRate: 0.662 } },
    ],
  },
  {
    id: 'nature-film-narrated-reel',
    name: 'Narrated reel',
    category: 'master',
    description:
      'A reel of tape, then a quicker compressor that takes no notice of low rumble, then a low ceiling with the sound pushed hard up against it.',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'ambient-comp', preset: 'Mic', params: { attack: 66.8, release: 0.934 } },
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6.82 } },
    ],
  },
  {
    id: 'nature-film-jotter-sides',
    name: 'Jotter sides',
    category: 'master',
    description:
      'A lift of presence and air, then the sides lifted a little, wider with nothing added, then a low, hard-pushed ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright' },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { release: 1.58, gain: 4.58 } },
    ],
  },
  {
    id: 'nature-film-overcast-glass',
    name: 'Overcast glass',
    category: 'master',
    description:
      'A hint of wavefolder, then a scooped, hollow tone, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'saturator', preset: 'Folded glass' },
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.43 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'nature-film-valve-in-drizzle',
    name: 'Valve in drizzle',
    category: 'master',
    description:
      'A dark, thick valve curve mixed over some of the clean sound, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.37, gain: -3.09 } },
    ],
  },
  {
    id: 'nature-film-sprocket-tone',
    name: 'Sprocket tone',
    category: 'master',
    description:
      'A low cut that thins the bass, with a little air on top, then a fast limiter pushed so that soft and loud notes even out.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.54 } },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'nature-film-plate-in-the-rushes',
    name: 'Plate in the rushes',
    category: 'master',
    description:
      'A small plate that is gone in a second or two, then a fast limiter that steps in only on the loudest peaks.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Small plate' },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'nature-film-red-deer-lift',
    name: 'Red-deer lift',
    category: 'master',
    description:
      'A parallel compressor, then the sides turned down, the image drawn towards the middle, then a low, slow ceiling.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 372, release: 3.29 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
      { deviceId: 'ambient-limiter', preset: 'Late night', params: { gain: -0.268 } },
    ],
  },
]
