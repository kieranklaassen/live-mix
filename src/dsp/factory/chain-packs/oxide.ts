// Shedding Oxide: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'oxide-tired-shade',
    name: 'Tired shade',
    category: 'space',
    description:
      'A dark reverb that rises behind each note, then lingers, then a trace of dull detuned copies at the edges.',
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
    id: 'oxide-choir-on-old-stock',
    name: 'Choir on old stock',
    category: 'space',
    description:
      'A mid-forward tone with the lows and the top trimmed, into a large hall whose tail hums a deep oh in bass voices.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.43 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 12.9, preDelay: 20.9 } },
    ],
  },
  {
    id: 'oxide-halo-losing-flakes',
    name: 'Halo losing flakes',
    category: 'space',
    description:
      'A mellow reverb whose tail splits up and down in pitch, into a damped hall of about five seconds, heard from far off.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Scatter', params: { decay: 8.85 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 20.8, lowDecay: 5.44, midDecay: 4.1 },
      },
    ],
  },
  {
    id: 'oxide-tired-hall',
    name: 'Tired hall',
    category: 'space',
    description:
      'A damped hall whose tail lasts ten seconds and more, then a parallel compressor that lifts quiet playing and tails.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 53.1 } },
      { deviceId: 'ambient-comp', preset: 'Lift' },
    ],
  },
  {
    id: 'oxide-undertow-nearly-gone',
    name: 'Undertow nearly gone',
    category: 'space',
    description:
      'A thin chorus of one copy bending against the dry sound, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow chorus' },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 60.2, midDecay: 2.13 },
      },
    ],
  },
  {
    id: 'oxide-fading-swell',
    name: 'Fading swell',
    category: 'space',
    description:
      'A high cut set low enough to muffle everything, into a reverb that rises for about four seconds behind each note.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.34 } },
      { deviceId: 'shaped-reverb', preset: 'Long rise' },
    ],
  },
  {
    id: 'oxide-slowed-loop',
    name: 'Slowed loop',
    category: 'echo',
    description:
      'A half-speed tape loop that returns an octave down and dull, then dotted tape repeats that pile up in a darkening wash.',
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
      'A short, muffled loop at an eighth of the sample rate, then a dull, wobbling, saturated echo on worn tape.',
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
      'A half-speed loop that plays the last phrase an octave down, then a slow echo with a long dark trail and a few recollections.',
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
    id: 'oxide-rewound-undertow',
    name: 'Rewound undertow',
    category: 'echo',
    description:
      'Long, dark backwards phrases an octave below the playing, then two copies far out of tune that sway like a worn tape.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Undertow', params: { time: 2150 } },
      { deviceId: 'stereo-detune', preset: 'Seasick', params: { delay: 23.1 } },
    ],
  },
  {
    id: 'oxide-unmarked-loop',
    name: 'Unmarked loop',
    category: 'echo',
    description:
      'A half-speed loop that plays the last phrase an octave down, into a soft slapback echo close behind each note.',
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
      'A wash of three fed-back tape heads that hovers and fades, into a single dull spring kept low in the centre of the sound.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Hovering wash', params: { time: 820 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { decay: 1.71 } },
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
    id: 'oxide-baked-sampler',
    name: 'Baked sampler',
    category: 'echo',
    description:
      'A short, dull loop at a quarter of the sample rate, then dotted tape repeats that bounce from side to side.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Lo-fi quarter' },
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 534 } },
    ],
  },
  {
    id: 'oxide-lobby-echo',
    name: 'Lobby echo',
    category: 'echo',
    description:
      'An echo whose repeats hop up a fifth and down a fourth, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Fifth hop' },
      { deviceId: 'plate-reverb', preset: 'Long plate' },
    ],
  },
  {
    id: 'oxide-late-summer-echo',
    name: 'Late-summer echo',
    category: 'echo',
    description:
      'A tape preamp driven for thick lows and a dull top, then a chorused echo, into a cave whose echoes bend slowly up and down in pitch.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -7.1 } },
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 299, modRate: 0.926 } },
      { deviceId: 'swarm-reverb', preset: 'Bending' },
    ],
  },
  {
    id: 'oxide-archive-trail',
    name: 'Archive trail',
    category: 'echo',
    description:
      'A fast, steady reel with soft saturation, then a slow dark-trailing echo, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      {
        deviceId: 'echo-memory',
        preset: 'Dark trail',
        params: { time: 1210, reach: 31.6, size: 4.49 },
      },
      { deviceId: 'expanse', preset: 'Narrow tunnel' },
    ],
  },
  {
    id: 'oxide-dusty-echo',
    name: 'Dusty echo',
    category: 'echo',
    description:
      'Grain repeats that sink by fourths on every pass, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling fourths', params: { time: 596, size: 182 } },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.42 } },
    ],
  },
  {
    id: 'oxide-spliced-wash',
    name: 'Spliced wash',
    category: 'echo',
    description:
      'A wash of three fed-back tape heads that hovers and fades, then a high cut set low enough to muffle everything.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Hovering wash' },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.52 } },
    ],
  },
  {
    id: 'oxide-muffled-echo',
    name: 'Muffled echo',
    category: 'echo',
    description:
      'A slow murky bucket-brigade echo with dull, worn repeats, into sixteen strings in E minor heard alone with no dry sound.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky' },
      { deviceId: 'sympathetic', preset: 'Strings alone', params: { decay: 8.54 } },
    ],
  },
  {
    id: 'oxide-echo-unlabelled',
    name: 'Echo unlabelled',
    category: 'echo',
    description:
      'One backwards answer to each phrase about three seconds on, then a dull, wobbling, saturated echo on worn tape.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Phrase and mirror' },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 693 } },
    ],
  },
  {
    id: 'oxide-muffled-octaves',
    name: 'Muffled octaves',
    category: 'echo',
    description:
      'A hollow chorus that swells over about ten seconds, then backwards repeats that step down an octave each time.',
    effects: [
      { deviceId: 'chorus', preset: 'Hollow swell', params: { rate: 0.103, delayMs: 8.03 } },
      { deviceId: 'reverse-delay', preset: 'Descending steps', params: { time: 518 } },
    ],
  },
  {
    id: 'oxide-thinning-loop',
    name: 'Thinning loop',
    category: 'echo',
    description:
      'A short, dull loop at a quarter of the sample rate, into a small plate that is gone in a second or two.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Lo-fi quarter', params: { length: 1.32 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
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
      'A low, dark tape loop played backwards at half speed, then an old reel dropping out, into a dull mono tunnel with a tail of several seconds.',
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
    id: 'oxide-dust-in-late-light',
    name: 'Dust in late light',
    category: 'tape',
    description:
      'An old reel dropping out, then crackle between the notes, into a small chapel with a short sung eh in its tail.',
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'noise-floor', preset: 'Gap crackle' },
      { deviceId: 'vowel-reverb', preset: 'Chapel' },
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
      'A dull, hard-clipped fuzz with a rough digital edge, then a four-track cassette, dull on top, unsteady and hissing.',
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
      'An equaliser that adds lows and body and eases the top, then a muffled early sampler, its top filtered away.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.56 } },
      { deviceId: 'patina', preset: 'Muffled sampler', params: { output: -2.17 } },
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
      'A tape loop that never fades and holds every layer, then a worn shellac disc, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Endless hold' },
      { deviceId: 'vinyl', preset: 'Ballroom 78' },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'oxide-run-out-tape',
    name: 'Run-out tape',
    category: 'tape',
    description:
      'A hot console channel, forward in the upper mids, then a worn dictation cassette, dull, trembling and full of hiss.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Hot channel' },
      { deviceId: 'tape', preset: 'Old dictation', params: { output: -3.59 } },
    ],
  },
  {
    id: 'oxide-noise-under-dust',
    name: 'Noise under dust',
    category: 'tape',
    description:
      'A thick, soft cassette, then the low, wide rumble of an empty room, into a short diffuse haze around the sound, like a small room.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { response: 0.405, hold: 19.7 } },
      { deviceId: 'spectral-blur', preset: 'Diffuse room' },
    ],
  },
  {
    id: 'oxide-crumbling-static',
    name: 'Crumbling static',
    category: 'tape',
    description:
      'A worn dictation cassette, then drifting radio static, into a clean speaker at the far end of a big, echoing room.',
    effects: [
      { deviceId: 'tape', preset: 'Old dictation' },
      { deviceId: 'noise-floor', preset: 'Radio static' },
      { deviceId: 're-amp', preset: 'Far end of the hall' },
    ],
  },
  {
    id: 'oxide-shedding-cassette',
    name: 'Shedding cassette',
    category: 'tape',
    description:
      'A ruined cassette that lurches, drops out and hisses hard, then a medium-wave station under the crackle of a far storm.',
    effects: [
      { deviceId: 'patina', preset: 'Falling apart' },
      { deviceId: 'radio', preset: 'Storm coming' },
    ],
  },
  {
    id: 'oxide-radio-in-a-shoebox',
    name: 'Radio in a shoebox',
    category: 'tape',
    description:
      'A small, boxy radio speaker close by in a small room, then the low, wide rumble of an empty room.',
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio' },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { response: 0.395, hold: 20.4 } },
    ],
  },
  {
    id: 'oxide-boxed-filter',
    name: 'Boxed filter',
    category: 'tape',
    description:
      'A telephone band-pass, then the hiss of a new record, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Phone line' },
      { deviceId: 'vinyl', preset: 'New pressing' },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 62.1 } },
    ],
  },
  {
    id: 'oxide-stretched-sampler',
    name: 'Stretched sampler',
    category: 'tape',
    description:
      'A chorus heard alone, its detuned copies spread hard apart, then smooth, dull converters with a hiss that rides high notes.',
    effects: [
      { deviceId: 'chorus', preset: 'Voices only', params: { rate: 0.322, delayMs: 17.1 } },
      { deviceId: 'vintage-digital', preset: 'Jittery' },
    ],
  },
  {
    id: 'oxide-record-off-the-shelf',
    name: 'Record off the shelf',
    category: 'tape',
    description:
      'A badly worn record, swaying in pitch under loud crackle, then the surface noise and crackle of an old record.',
    effects: [
      { deviceId: 'patina', preset: 'Scratched record' },
      { deviceId: 'noise-floor', preset: 'Old record' },
    ],
  },
  {
    id: 'oxide-far-dial-sampler',
    name: 'Far-dial sampler',
    category: 'tape',
    description:
      'A short, dull loop at a quarter of the sample rate, then a small mono transistor radio with a clear, steady signal.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Lo-fi quarter', params: { length: 1.62 } },
      { deviceId: 'radio', preset: 'Clean transistor' },
    ],
  },
  {
    id: 'oxide-drift-on-old-stock',
    name: 'Drift on old stock',
    category: 'tape',
    description:
      'A slow reel whose pitch sways widely and never settles, then an equaliser that takes presence, air and lows away.',
    effects: [
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'oxide-late-summer-tape',
    name: 'Late-summer tape',
    category: 'tape',
    description:
      'A worn dictation cassette, dull, trembling and full of hiss, into the close reflections of a very small room.',
    effects: [
      { deviceId: 'tape', preset: 'Old dictation' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Short ambience',
        params: { decay: 0.407, breathRate: 0.28 },
      },
    ],
  },
  {
    id: 'oxide-afternoon-tape',
    name: 'Afternoon tape',
    category: 'tape',
    description:
      'A loop of the last phrase played backwards as a bed, then a ruined cassette, into three long springs with all the top taken off.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Reverse bed', params: { length: 2.76 } },
      { deviceId: 'patina', preset: 'Falling apart' },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'oxide-drift-in-the-attic',
    name: 'Drift in the attic',
    category: 'tape',
    description:
      'A blurred loop that never comes round quite the same, then a worn record through a dark, dull cartridge.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Drifting' },
      { deviceId: 'vinyl', preset: 'Dull stylus', params: { spin: 1.6 } },
    ],
  },
  {
    id: 'oxide-slow-spool-cassette',
    name: 'Slow-spool cassette',
    category: 'tape',
    description:
      'A worn cassette that wobbles, drops out and hisses, then a slow echo with a long dark trail and a few recollections.',
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      {
        deviceId: 'echo-memory',
        preset: 'Dark trail',
        params: { time: 1010, reach: 33.1, size: 4.59 },
      },
    ],
  },
  {
    id: 'oxide-reel-thinning-out',
    name: 'Reel thinning out',
    category: 'tape',
    description:
      'A small radio speaker muffled as if under a pillow, then a flaking reel, into a small dark room that is gone in about a second.',
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker' },
      { deviceId: 'tape', preset: 'Crumbling oxide', params: { output: -2.4 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { decay: 1.25, modRate: 0.797 } },
    ],
  },
  {
    id: 'oxide-twice-played-record',
    name: 'Twice-played record',
    category: 'tape',
    description:
      'A faint tape loop, then a crackling old record, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Faint afterimage', params: { length: 3.05 } },
      { deviceId: 'patina', preset: 'Dusty record' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 10.8, predelayMs: 115, breathRate: 0.327 },
      },
    ],
  },
  {
    id: 'oxide-tired-swirl',
    name: 'Tired swirl',
    category: 'motion',
    description:
      'A phaser taking about a quarter of a minute to come round, then a badly warped record whose pitch sways once a turn.',
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
    id: 'oxide-yellowed-phaser',
    name: 'Yellowed phaser',
    category: 'motion',
    description:
      'A string voice that doubles each note almost at once, then a hollow peaking phaser that turns about every four seconds.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Doubler' },
      { deviceId: 'phaser', preset: 'Negative notch', params: { rate: 0.227 } },
    ],
  },
  {
    id: 'oxide-drift-kept-too-long',
    name: 'Drift kept too long',
    category: 'motion',
    description:
      'A slow flanger-like sweep, opposite on each side, into a tight cluster of tape repeats, like a very small room.',
    effects: [
      { deviceId: 'tremolo', preset: 'Drifting comb' },
      { deviceId: 'tape-echo', preset: 'Tiny room cluster', params: { time: 84.6 } },
    ],
  },
  {
    id: 'oxide-thinning-chorus',
    name: 'Thinning chorus',
    category: 'motion',
    description:
      'A chorus heard alone, its detuned copies spread hard apart, into a mellow reverb whose tail splits up and down in pitch.',
    effects: [
      { deviceId: 'chorus', preset: 'Voices only', params: { rate: 0.323, delayMs: 17.3 } },
      { deviceId: 'bloom-reverb', preset: 'Scatter', params: { decay: 8.87 } },
    ],
  },
  {
    id: 'oxide-twice-played-sweep',
    name: 'Twice-played sweep',
    category: 'motion',
    description:
      'A resonant low-pass that swings open about every two seconds, then a flanger sweep with the whoosh of a passing jet plane.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Dub sweep',
        params: { lfoRateHz: 0.443, envAttackMs: 10.7, envReleaseMs: 221 },
      },
      { deviceId: 'flanger', preset: 'Classic jet', params: { rate: 0.255, delayMs: 2.54 } },
    ],
  },
  {
    id: 'oxide-wavering-sway',
    name: 'Wavering sway',
    category: 'motion',
    description:
      'A transformer that fills out the lows and dulls the top, then a slow reel whose pitch sways widely and never settles.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'tape', preset: 'Seasick', params: { output: -2.29 } },
    ],
  },
  {
    id: 'oxide-brittle-pad',
    name: 'Brittle pad',
    category: 'texture',
    description:
      'A dark, round pad that melts slowly from chord to chord, then a drifting reel laid against the dry sound to make a chorus.',
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 1.11, glide: 2.7 } },
      { deviceId: 'tape', preset: 'Drifting chorus', params: { output: -5.02 } },
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
    id: 'oxide-echo-left-in-sun',
    name: 'Echo left in sun',
    category: 'texture',
    description:
      'A triode valve stage, smoothly overdriven, then grain repeats that fall an octave and darken each time.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { time: 486, size: 244 } },
    ],
  },
  {
    id: 'oxide-seventh-year-grains',
    name: 'Seventh-year grains',
    category: 'texture',
    description:
      'A soft cloud of grains made from what was just played, then a big lift of the low end that puts weight under the sound.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { size: 242, density: 18 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.28 } },
    ],
  },
  {
    id: 'oxide-bandstand-harmony',
    name: 'Bandstand harmony',
    category: 'texture',
    description:
      'A slow swell after each silence that leaves some attack in, then a held pad where each new chord piles onto the last.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1290, release: 324 } },
      { deviceId: 'sustainer', preset: 'Stacked harmony', params: { attack: 0.674, glide: 0.704 } },
    ],
  },
  {
    id: 'oxide-dusty-wash',
    name: 'Dusty wash',
    category: 'texture',
    description:
      'A very wide wash in which every note hangs for many seconds, then an old slow reel that drifts, dulls, drops out and hisses.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Endless' },
      { deviceId: 'tape', preset: 'Worn thin', params: { output: -4.86 } },
    ],
  },
  {
    id: 'oxide-shelved-pad',
    name: 'Shelved pad',
    category: 'texture',
    description:
      'A held pad that swells in slowly like bowed strings, into ten strings that tune themselves to the notes they hear.',
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Slow strings',
        params: { attack: 1.78, glide: 1.46, mix: 0.33 },
      },
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'oxide-bandstand-drone',
    name: 'Bandstand drone',
    category: 'texture',
    description:
      'Layers of held chords that bloom slowly and never fade, then a slow rotating speaker with its amplifier driven hard, into a mid-sized hall.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow bloom layers', params: { mix: 0.3 } },
      { deviceId: 'rotary', preset: 'Slow burn' },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 54.8, lowDecay: 2.91, midDecay: 2.47, mix: 0.21 },
      },
    ],
  },
  {
    id: 'oxide-swell-in-the-attic',
    name: 'Swell in the attic',
    category: 'texture',
    description:
      'A combo amplifier boxed in by the walls of a cupboard, then long slow grains an octave down, most of them reversed.',
    effects: [
      { deviceId: 're-amp', preset: 'In the cupboard', params: { output: 0.556 } },
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { size: 932, density: 4.51 } },
    ],
  },
  {
    id: 'oxide-grains-nearly-gone',
    name: 'Grains nearly gone',
    category: 'texture',
    description:
      'A cloud of backwards grains close behind the playing, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Backwards room', params: { size: 398, density: 8.56 } },
      { deviceId: 'expanse', preset: 'Narrow tunnel' },
    ],
  },
  {
    id: 'oxide-ferric-pad',
    name: 'Ferric pad',
    category: 'texture',
    description:
      'A muffled, slow-fading string pad with its top taken off, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Felted pad', params: { rise: 0.868, fall: 11.8 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'oxide-crumbling-tide',
    name: 'Crumbling tide',
    category: 'texture',
    description:
      'Dark backwards loops of each note and its octave below, into a small room that answers about an eighth of a second late.',
    effects: [
      { deviceId: 'cascade', preset: 'Undertow', params: { time: 584 } },
      { deviceId: 'ether-reverb', preset: 'Slap room' },
    ],
  },
  {
    id: 'oxide-swells-thinning-out',
    name: 'Swells thinning out',
    category: 'texture',
    description:
      'The playing turned backwards in place of the dry sound, into a clean speaker heard from well back in a room.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards only', params: { time: 991 } },
      { deviceId: 're-amp', preset: 'Just the room' },
    ],
  },
  {
    id: 'oxide-sagging-undertow',
    name: 'Sagging undertow',
    category: 'pitch',
    description:
      'A dark, smooth half-speed octave under the dry sound, then a dusty record, gently warped, with crackle in the groove.',
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1250 } },
      { deviceId: 'patina', preset: 'Dusty record' },
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
      'A slowed copy a fifth below, running on beside the dry sound, then a mangled, hissing cassette that lurches and drops out.',
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
      'A muffled half-speed octave below, kept in the centre, then a worn cassette that wobbles, drops out and hisses.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor' },
      { deviceId: 'patina', preset: 'Worn cassette' },
    ],
  },
  {
    id: 'oxide-old-stock-loop',
    name: 'Old-stock loop',
    category: 'pitch',
    description:
      'A half-speed loop that plays the last phrase an octave down, into a dark reverb that rises behind each note, then lingers.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed' },
      { deviceId: 'shaped-reverb', preset: 'Ghost' },
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
    id: 'oxide-half-erased-loop',
    name: 'Half-erased loop',
    category: 'pitch',
    description:
      'A low, dark tape loop played backwards at half speed, then a muffled early sampler, its top filtered away.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards' },
      { deviceId: 'patina', preset: 'Muffled sampler', params: { output: 2.55 } },
    ],
  },
  {
    id: 'oxide-sunlit-fourth',
    name: 'Sunlit fourth',
    category: 'pitch',
    description:
      'A short swell that rounds the front off every note, then a close harmony a fourth below, made of short slowed pieces.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 176, release: 70.3 } },
      { deviceId: 'half-speed', preset: 'Fourth below' },
    ],
  },
  {
    id: 'oxide-run-out-octave',
    name: 'Run-out octave',
    category: 'pitch',
    description:
      'An unbroken half-speed bed an octave down, with no dry sound, then a gentle high cut that shades the top end.',
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { length: 2540 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'oxide-fortieth-pass-depths',
    name: 'Fortieth-pass depths',
    category: 'pitch',
    description:
      'A quarter-speed crawl two octaves down, smooth and unbroken, then a faint swell of octave loops behind each note.',
    effects: [
      { deviceId: 'half-speed', preset: 'Quarter speed' },
      { deviceId: 'cascade', preset: 'Faint halo' },
    ],
  },
  {
    id: 'oxide-octave-off-the-shelf',
    name: 'Octave off the shelf',
    category: 'pitch',
    description:
      'A half-speed replay an octave down, with no dry sound, then a muffled, slow-fading string pad with its top taken off.',
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed', params: { length: 1100 } },
      { deviceId: 'pad-follower', preset: 'Felted pad', params: { rise: 0.88, fall: 10.9 } },
    ],
  },
  {
    id: 'oxide-lobby-bass',
    name: 'Lobby bass',
    category: 'pitch',
    description:
      'A transformer driven so the low end thickens and loosens, then the octave below alone, rounded off like a bass.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { output: -7.04 } },
      { deviceId: 'octaves', preset: 'Bass alone' },
    ],
  },
  {
    id: 'oxide-depths-in-a-shoebox',
    name: 'Depths in a shoebox',
    category: 'pitch',
    description:
      'A quarter-speed crawl, then a soft bucket-brigade echo, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'half-speed', preset: 'Quarter speed' },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 383, modRate: 0.662 } },
      { deviceId: 'expanse', preset: 'Low cathedral' },
    ],
  },
  {
    id: 'oxide-forgotten-finish',
    name: 'Forgotten finish',
    category: 'master',
    description:
      'Light tape-style saturation, then a rumble cut and a small lift of presence, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'ambient-eq', preset: 'Keys' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { release: 1.38 } },
    ],
  },
  {
    id: 'oxide-archive-finish',
    name: 'Archive finish',
    category: 'master',
    description:
      'A parallel compressor that lifts quiet playing and tails, then a slightly wider image, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 391, release: 2.87 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
  {
    id: 'oxide-master-in-the-attic',
    name: 'Master in the attic',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a subsonic cut, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 3.07 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'oxide-unmarked-finish',
    name: 'Unmarked finish',
    category: 'master',
    description:
      'A small dip in the low mids, then a gentle compressor, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone' },
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 112, release: 1.82 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.46, gain: 2.96 } },
    ],
  },
  {
    id: 'oxide-dusty-finish',
    name: 'Dusty finish',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a slow compressor that evens out swells over seconds, then a lightly pushed limiter.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Level' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'oxide-master-left-in-sun',
    name: 'Master left in sun',
    category: 'master',
    description:
      'A stereo image widened a little, with the bass left central, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Wall only' },
    ],
  },
]
