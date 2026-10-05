// Faded Nature Film: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'nature-film-heather-plate',
    name: 'Heather plate',
    category: 'space',
    description:
      'A reverb that fades evenly to nothing in a second or two, into a medium plate with a smooth tail of a few seconds.',
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
    id: 'nature-film-kestrel-haze',
    name: 'Kestrel haze',
    category: 'space',
    description:
      'A far-off plate haze with a long, soft tail, then a compressor so slow it rides the level over many seconds.',
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
    id: 'nature-film-blackboard-plate',
    name: 'Blackboard plate',
    category: 'space',
    description:
      'An equaliser that adds lows and body and eases the top, then a tiny boxy room, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.64 } },
      { deviceId: 'expanse', preset: 'Small box', params: { modRate: 0.365 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 14.2 } },
    ],
  },
  {
    id: 'nature-film-red-deer-spring',
    name: 'Red-deer spring',
    category: 'space',
    description:
      'A fast, steady reel with soft saturation, into one taut dull spring that answers late and rings long.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      {
        deviceId: 'spring-reverb',
        preset: 'Dark late coil',
        params: { decay: 5.22, predelay: 73 },
      },
    ],
  },
  {
    id: 'nature-film-haze-in-long-shot',
    name: 'Haze in long shot',
    category: 'space',
    description:
      'A high cut set low enough to muffle everything, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.524 } },
    ],
  },
  {
    id: 'nature-film-bog-cotton-chamber',
    name: 'Bog-cotton chamber',
    category: 'space',
    description:
      'The first hint of weight from a tape preamp, into a bright wide chamber that is over in about a second.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'nature-film-estuary-bloom',
    name: 'Estuary bloom',
    category: 'space',
    description:
      'A deep pitch wobble with the two sides bending out of step, into a brief swell of reverb close behind each note.',
    effects: [
      { deviceId: 'tremolo', preset: 'Wide wobble', params: { rate: 2.81 } },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { time: 0.313 } },
    ],
  },
  {
    id: 'nature-film-off-speed-reel',
    name: 'Off-speed reel',
    category: 'echo',
    description:
      'A deep pitch wobble, like a warped tape, then a dull, wobbling, saturated echo on worn tape.',
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
      'A fast vibrato that warbles the whole sound in pitch, then an echo with a fast flutter in the pitch of its repeats.',
    effects: [
      { deviceId: 'chorus', preset: 'Vibrato', params: { rate: 5.91, delayMs: 5.96 } },
      { deviceId: 'analog-delay', preset: 'Fluttering' },
    ],
  },
  {
    id: 'nature-film-echo-at-closedown',
    name: 'Echo at closedown',
    category: 'echo',
    description:
      'Backwards chunks spliced hard with no fades between them, then a muffled cassette, its top rolled off and its lows lifted.',
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
      'A backwards echo of each phrase that swells in and cuts off, then a slow reel whose pitch sways widely and never settles.',
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
      'A tape preamp driven for thick lows and a dull top, then a short soft tape echo, into three long-ringing springs with all the top taken off.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -9.15 } },
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'nature-film-half-term-echo',
    name: 'Half-term echo',
    category: 'echo',
    description:
      'A tape reel pushed hard, saturated and thick, then whole phrases played backwards about four seconds later.',
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
      'A short, muffled loop at an eighth of the sample rate, into a small room that is over in about a second.',
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
    id: 'nature-film-otter-echo',
    name: 'Otter echo',
    category: 'echo',
    description:
      'Dotted tape repeats that pile up in a darkening wash, into a mellow reverb whose tail splits up and down in pitch.',
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
      'A dull, wobbling, saturated echo on worn tape, then a full chorus spread wide to left and right.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 596 } },
      { deviceId: 'chorus', preset: 'Wide chorus' },
    ],
  },
  {
    id: 'nature-film-sprocket-sway',
    name: 'Sprocket sway',
    category: 'echo',
    description:
      'A quick shallow vibrato such as a string player makes, then a short echo whose pitch sways like a seasick vibrato.',
    effects: [
      { deviceId: 'tremolo', preset: 'Pitch wobble', params: { rate: 5.76 } },
      { deviceId: 'analog-delay', preset: 'Seasick' },
    ],
  },
  {
    id: 'nature-film-repeats-in-class',
    name: 'Repeats in class',
    category: 'echo',
    description:
      'A chorus heard alone, its detuned copies spread hard apart, then a slow murky bucket-brigade echo with dull, worn repeats.',
    effects: [
      { deviceId: 'chorus', preset: 'Voices only' },
      { deviceId: 'analog-delay', preset: 'Murky', params: { time: 962, modRate: 0.245 } },
    ],
  },
  {
    id: 'nature-film-tideline-swells',
    name: 'Tideline swells',
    category: 'echo',
    description:
      'A dark fog of slow backwards swells, then a muffled early sampler, its top filtered away.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Dark fog', params: { time: 1570 } },
      { deviceId: 'patina', preset: 'Muffled sampler', params: { output: 2.87 } },
    ],
  },
  {
    id: 'nature-film-regional-octave',
    name: 'Regional octave',
    category: 'echo',
    description:
      'A quick fade-in that only softens the edge of each note, then an echo that slides down an octave like tape slowed by hand.',
    effects: [
      { deviceId: 'swell', preset: 'Soft pick' },
      { deviceId: 'analog-delay', preset: 'Falling tape' },
    ],
  },
  {
    id: 'nature-film-glen-loop',
    name: 'Glen loop',
    category: 'echo',
    description:
      'A short tape loop where each pass comes back quieter, into a bright spring splash that lands a moment after the note.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade', params: { length: 1.78 } },
      { deviceId: 'spring-reverb', preset: 'Late splash' },
    ],
  },
  {
    id: 'nature-film-lapwing-memory',
    name: 'Lapwing memory',
    category: 'echo',
    description:
      'A quick slapback echo over short glimpses of earlier notes, then an echo that slides down an octave like tape slowed by hand.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Glimpses' },
      { deviceId: 'analog-delay', preset: 'Falling tape', params: { time: 472, modRate: 0.308 } },
    ],
  },
  {
    id: 'nature-film-test-card-echo',
    name: 'Test-card echo',
    category: 'echo',
    description:
      'Amplifier valves driven until they round off every peak, then a backwards echo, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 're-amp', preset: 'Just the valves' },
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { time: 639 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
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
      'A sharp copy hard left and a flat one hard right, alone, then a lightly worn reel, into a tight chamber.',
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
      'A late copy on each side, like the same part played twice, then a reel with a little hiss, into a short, room-like haze.',
    effects: [
      { deviceId: 'chorus', preset: 'Loose double' },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'spectral-blur', preset: 'Diffuse room' },
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
      'A short, dull loop at a quarter of the sample rate, then a trembling reel, then a short echo whose pitch sways like a seasick vibrato.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Lo-fi quarter', params: { length: 1.56 } },
      { deviceId: 'tape', preset: 'Flutter shimmer' },
      { deviceId: 'analog-delay', preset: 'Seasick', params: { time: 165, modRate: 3.23 } },
    ],
  },
  {
    id: 'nature-film-reel-gone-magenta',
    name: 'Reel gone magenta',
    category: 'tape',
    description:
      'An old slow reel that drifts, dulls, drops out and hisses, into a single saturated tape echo close behind each note.',
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 95.3 } },
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
    id: 'nature-film-film-can-radio',
    name: 'Film-can radio',
    category: 'tape',
    description:
      'A small radio speaker, mono and boxy, with the lows gone, then a pure, low electrical hum that sits in the centre.',
    effects: [
      { deviceId: 'patina', preset: 'Kitchen radio' },
      { deviceId: 'noise-floor', preset: 'Mains hum', params: { response: 0.431, hold: 18.2 } },
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
    id: 'nature-film-bracken-reel',
    name: 'Bracken reel',
    category: 'tape',
    description:
      'Two copies in tune that wander like extra takes, then a slow reel that sways, into a tight, damped little room close around the sound.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Drifting' },
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'nature-film-seventies-glaze',
    name: 'Seventies glaze',
    category: 'tape',
    description:
      'A thin twelve-bit glaze, then a four-track cassette, dull on top, unsteady and hissing, then a sinking octave echo.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze' },
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'analog-delay', preset: 'Falling tape', params: { time: 491, modRate: 0.328 } },
    ],
  },
  {
    id: 'nature-film-loop-on-the-moor',
    name: 'Loop on the moor',
    category: 'tape',
    description:
      'A short, dull loop at a quarter of the sample rate, then a crackling old record, then a tape echo whose warm repeats soften as they fade.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Lo-fi quarter', params: { length: 1.6 } },
      { deviceId: 'patina', preset: 'Dusty record', params: { output: 2.95 } },
      { deviceId: 'tape-echo', preset: 'Warm repeats' },
    ],
  },
  {
    id: 'nature-film-parquet-record',
    name: 'Parquet record',
    category: 'tape',
    description:
      'A bright layer of saturation, then a crackling old record, into a clean speaker at the far end of a big, echoing room.',
    effects: [
      { deviceId: 'saturator', preset: 'Parallel shine' },
      { deviceId: 'patina', preset: 'Dusty record' },
      { deviceId: 're-amp', preset: 'Far end of the hall' },
    ],
  },
  {
    id: 'nature-film-drizzle-loop',
    name: 'Drizzle loop',
    category: 'tape',
    description:
      'A short, dull loop at a quarter of the sample rate, then a warped record through a dark cartridge, swaying slowly.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Lo-fi quarter' },
      { deviceId: 'vinyl', preset: 'Slow platter', params: { spin: 4.93 } },
    ],
  },
  {
    id: 'nature-film-sampler-in-the-can',
    name: 'Sampler in the can',
    category: 'tape',
    description:
      'A chorus heard alone, its detuned copies spread hard apart, then a muffled early sampler, its top filtered away.',
    effects: [
      { deviceId: 'chorus', preset: 'Voices only', params: { rate: 0.347, delayMs: 15.8 } },
      { deviceId: 'patina', preset: 'Muffled sampler' },
    ],
  },
  {
    id: 'nature-film-narrated-reel',
    name: 'Narrated reel',
    category: 'tape',
    description:
      'A high cut set low enough to muffle everything, then a reel driven as hard as it goes, thick with harmonics.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.51 } },
      { deviceId: 'tape', preset: 'Needles pinned' },
    ],
  },
  {
    id: 'nature-film-lights-off-sampler',
    name: 'Lights-off sampler',
    category: 'tape',
    description:
      'A warped record mixed against the dry sound as a slow chorus, then converters at a very low rate, filtered smooth and dull.',
    effects: [
      { deviceId: 'vinyl', preset: 'Warp chorus' },
      { deviceId: 'vintage-digital', preset: 'Sunken' },
    ],
  },
  {
    id: 'nature-film-otter-sampler',
    name: 'Otter sampler',
    category: 'tape',
    description:
      'Dull low-rate converters, then the soft air of an open microphone under the sound, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sunken' },
      { deviceId: 'noise-floor', preset: 'Close mic' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 16.7 } },
    ],
  },
  {
    id: 'nature-film-sprocket-crackle',
    name: 'Sprocket crackle',
    category: 'tape',
    description:
      'A dusty record, gently warped, with crackle in the groove, then a scooped tone with lows and highs up and the body down.',
    effects: [
      { deviceId: 'patina', preset: 'Dusty record' },
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.32 } },
    ],
  },
  {
    id: 'nature-film-osprey-sampler',
    name: 'Osprey sampler',
    category: 'tape',
    description:
      'A gentle flanger sweeping about every four seconds, then the converters of an early sampler, soft on top and gritty.',
    effects: [
      { deviceId: 'flanger', preset: 'Gentle sweep', params: { rate: 0.248, delayMs: 2.67 } },
      { deviceId: 'vintage-digital', preset: 'Sampler' },
    ],
  },
  {
    id: 'nature-film-field-trip-sampler',
    name: 'Field-trip sampler',
    category: 'tape',
    description:
      'Dull, hissing converters, then a worn dictation cassette, dull, trembling and full of hiss, then a three-head tape echo.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty' },
      { deviceId: 'tape', preset: 'Old dictation' },
      { deviceId: 'tape-echo', preset: 'Three heads' },
    ],
  },
  {
    id: 'nature-film-groove-on-a-wet-day',
    name: 'Groove on a wet day',
    category: 'tape',
    description:
      'A worn-out groove that dulls the top and fuzzes loud highs, then dotted tape repeats that bounce from side to side.',
    effects: [
      { deviceId: 'vinyl', preset: 'Inner groove' },
      { deviceId: 'tape-echo', preset: 'Dotted bounce' },
    ],
  },
  {
    id: 'nature-film-rock-pool-reel',
    name: 'Rock-pool reel',
    category: 'tape',
    description:
      'A tape loop that wears thinner and duller on every pass, then five-bit converters fed hot, coarse and grainy on every note.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out' },
      { deviceId: 'vintage-digital', preset: 'Crushed' },
    ],
  },
  {
    id: 'nature-film-closedown-reel',
    name: 'Closedown reel',
    category: 'tape',
    description:
      'A transformer driven so the low end thickens and loosens, then a tape loop that wears thinner and duller on every pass.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 3.31 } },
    ],
  },
  {
    id: 'nature-film-buckled-crackle',
    name: 'Buckled crackle',
    category: 'tape',
    description:
      'A badly worn record, swaying in pitch under loud crackle, then grain repeats that sink by fourths on every pass.',
    effects: [
      { deviceId: 'patina', preset: 'Scratched record' },
      { deviceId: 'grain-delay', preset: 'Falling fourths', params: { time: 562, size: 194 } },
    ],
  },
  {
    id: 'nature-film-dust-in-drizzle',
    name: 'Dust in drizzle',
    category: 'tape',
    description:
      'A blurred loop that never comes round quite the same, then a dusty, ticking record, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Drifting' },
      { deviceId: 'vinyl', preset: 'Dust and scratches', params: { spin: 1.41 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 19.7 } },
    ],
  },
  {
    id: 'nature-film-station-after-lunch',
    name: 'Station after lunch',
    category: 'tape',
    description:
      'A small mono transistor radio with a clear, steady signal, into a small damped room that is over within a second.',
    effects: [
      { deviceId: 'radio', preset: 'Clean transistor' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { predelayMs: 9.75 } },
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
    id: 'nature-film-phaser-in-a-bothy',
    name: 'Phaser in a bothy',
    category: 'motion',
    description:
      'A ten-stage phaser falling from the top again and again, then a thick, soft cassette, full in the lows and dull on top.',
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
      'A phaser taking about a quarter of a minute to come round, then an old slow reel that drifts, dulls, drops out and hisses.',
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.0593 } },
      { deviceId: 'tape', preset: 'Worn thin' },
    ],
  },
  {
    id: 'nature-film-drift-on-a-wet-day',
    name: 'Drift on a wet day',
    category: 'motion',
    description:
      'A dark amplifier stack with the bass full up and no treble, then a slow phasing drift that turns over every few seconds.',
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
      'A six-stage phaser turning about every three seconds, then a big lift of the low end that puts weight under the sound.',
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
      'A ten-stage phaser falling from the top again and again, into a damped hall of about five seconds, heard from far off.',
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
    id: 'nature-film-chorus-on-a-lean',
    name: 'Chorus on a lean',
    category: 'motion',
    description:
      'A drifting reel laid against the dry sound to make a chorus, into a late wall of reverb that holds and fades away.',
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'shaped-reverb', preset: 'Late wall' },
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
      'A trace of dull detuned copies at the edges, then a deep flanger that sweeps right up through the top.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Faint width', params: { delay: 13.2 } },
      { deviceId: 'flanger', preset: 'Through-zero feel' },
    ],
  },
  {
    id: 'nature-film-magenta-spiral',
    name: 'Magenta spiral',
    category: 'motion',
    description:
      'A valve stage that gives way under loud notes, tails rising, then a ringing sweep that seems to climb without end.',
    effects: [
      { deviceId: 'patina', preset: 'Valve bloom', params: { output: -8.03 } },
      { deviceId: 'freq-shifter', preset: 'Barber pole', params: { lfoRate: 0.0823 } },
    ],
  },
  {
    id: 'nature-film-corduroy-phaser',
    name: 'Corduroy phaser',
    category: 'motion',
    description:
      'A six-stage phaser turning about every three seconds, then a worn cassette that wobbles, drops out and hisses.',
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage' },
      { deviceId: 'patina', preset: 'Worn cassette', params: { output: 2.04 } },
    ],
  },
  {
    id: 'nature-film-blinds-down-tide',
    name: 'Blinds-down tide',
    category: 'motion',
    description:
      'A low-pass that opens and closes over about half a minute, into two slack springs that splash and drip on every attack.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0323, envAttackMs: 8.86, envReleaseMs: 213 },
      },
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { decay: 2.38, mix: 0.24 } },
    ],
  },
  {
    id: 'nature-film-pulse-by-the-loch',
    name: 'Pulse by the loch',
    category: 'motion',
    description:
      'A mid-forward tone with the lows and the top trimmed, then gated bursts of reverb repeating about four times a second.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.38 } },
      { deviceId: 'shaped-reverb', preset: 'Gate steps' },
    ],
  },
  {
    id: 'nature-film-warble-on-the-moor',
    name: 'Warble on the moor',
    category: 'motion',
    description:
      'A tape preamp pushed just enough to add weight, then a fast warble of the whole sound, sharp and flat by turns.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { output: -4.48 } },
      { deviceId: 'freq-shifter', preset: 'Fast warble', params: { delay: 27, lfoRate: 5.78 } },
    ],
  },
  {
    id: 'nature-film-autumn-term-swirl',
    name: 'Autumn-term swirl',
    category: 'motion',
    description:
      'A quick fade-in that only softens the edge of each note, then a six-stage phaser turning about every three seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 50, release: 53.9 } },
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.287 } },
    ],
  },
  {
    id: 'nature-film-wheeled-in-drift',
    name: 'Wheeled-in drift',
    category: 'motion',
    description:
      'A swell that takes seconds to rise after each silence, then a slow flanger sweep, opposite on each side.',
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 2550, release: 636 } },
      { deviceId: 'tremolo', preset: 'Drifting comb', params: { rate: 0.0958 } },
    ],
  },
  {
    id: 'nature-film-parquet-phaser',
    name: 'Parquet phaser',
    category: 'motion',
    description:
      'A phaser with no dry sound, pulling the two sides apart, then a four-track cassette, dull on top, unsteady and hissing.',
    effects: [
      { deviceId: 'phaser', preset: 'Stereo scatter' },
      { deviceId: 'tape', preset: 'Cassette four-track' },
    ],
  },
  {
    id: 'nature-film-changeover-drift',
    name: 'Changeover drift',
    category: 'motion',
    description:
      'A reel driven hot, then two copies in tune that wander like extra takes, into a damped hall of about five seconds, heard from far off.',
    effects: [
      { deviceId: 'tape', preset: 'Hot glue' },
      { deviceId: 'stereo-detune', preset: 'Drifting' },
      { deviceId: 'hall-reverb', preset: 'Far away' },
    ],
  },
  {
    id: 'nature-film-tremolo-at-half-term',
    name: 'Tremolo at half-term',
    category: 'motion',
    description:
      'A mid-forward tone with the lows and the top trimmed, then a harmonic tremolo whose lows and highs trade places quickly.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward' },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer' },
    ],
  },
  {
    id: 'nature-film-estuary-pad',
    name: 'Estuary pad',
    category: 'texture',
    description:
      'A held pad that stands alone in place of what was played, then coarse four-bit converters that rasp on every note.',
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
    id: 'nature-film-afterglow-in-the-can',
    name: 'Afterglow in the can',
    category: 'texture',
    description:
      'A short glow of held tone that dies just after each note, then a dense many-notched phaser drifting opposite on each side.',
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
    id: 'nature-film-grains-in-the-rushes',
    name: 'Grains in the rushes',
    category: 'texture',
    description:
      'Sparse stray grains of things played seconds earlier, then backwards repeats that step down an octave each time.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Stray memories', params: { size: 265, density: 1.52 } },
      { deviceId: 'reverse-delay', preset: 'Descending steps' },
    ],
  },
  {
    id: 'nature-film-harmony-gone-magenta',
    name: 'Harmony gone magenta',
    category: 'texture',
    description:
      'A pad of piled-up chords, then a trace of slow phaser, into two taut springs that ring long and clean with no drip.',
    effects: [
      { deviceId: 'sustainer', preset: 'Stacked harmony', params: { attack: 0.669, glide: 0.806 } },
      { deviceId: 'phaser', preset: 'Faint shade' },
      { deviceId: 'spring-reverb', preset: 'Tight long tank' },
    ],
  },
  {
    id: 'nature-film-duffel-coat-refrain',
    name: 'Duffel-coat refrain',
    category: 'texture',
    description:
      'A very slow swell, then whole phrases that repeat by chance, each time quieter, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'swell', preset: 'Glacier', params: { attack: 4030 } },
      { deviceId: 'glitch', preset: 'Phrase repeats' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'nature-film-last-period-mist',
    name: 'Last-period mist',
    category: 'texture',
    description:
      'A diffuse mist where each note hangs on after it is played, then a high cut set low enough to muffle everything.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.56 } },
    ],
  },
  {
    id: 'nature-film-salmon-run-strings',
    name: 'Salmon-run strings',
    category: 'texture',
    description:
      'A dark, low string pad like cellos under the playing, then a four-stage phaser kept high, leaving the low end alone.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos' },
      { deviceId: 'phaser', preset: 'Bass safe' },
    ],
  },
  {
    id: 'nature-film-lochside-drift',
    name: 'Lochside drift',
    category: 'texture',
    description:
      'A held pad whose every overtone wavers in pitch and level, then a steep low-pass that removes all above four hundred hertz.',
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Wavering choir',
        params: { attack: 0.435, glide: 0.65, mix: 0.39 },
      },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { lfoRateHz: 0.909, envAttackMs: 11.2, envReleaseMs: 194 },
      },
    ],
  },
  {
    id: 'nature-film-interlude-octave',
    name: 'Interlude octave',
    category: 'pitch',
    description:
      'A muffled half-speed octave below, kept in the centre, then a warped record through a dark cartridge, swaying slowly.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor', params: { length: 1990 } },
      { deviceId: 'vinyl', preset: 'Slow platter', params: { spin: 5.07 } },
    ],
  },
  {
    id: 'nature-film-octave-by-the-loch',
    name: 'Octave by the loch',
    category: 'pitch',
    description:
      'The level rising and falling at random, like surf, then a single darkened voice an octave below the dry sound.',
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
    id: 'nature-film-bass-for-schools',
    name: 'Bass for schools',
    category: 'pitch',
    description:
      'A soft, deep bass one and two octaves below each note, then a slow, dull, worn-out echo with hiss riding on its repeats.',
    effects: [
      { deviceId: 'octaves', preset: 'Deep' },
      { deviceId: 'analog-delay', preset: 'Noisy clock', params: { time: 1180, modRate: 0.662 } },
    ],
  },
  {
    id: 'nature-film-slowed-down-octave',
    name: 'Slowed-down octave',
    category: 'pitch',
    description:
      'A muffled half-speed octave below, kept in the centre, then a four-track cassette, dull on top, unsteady and hissing.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor', params: { length: 2190 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { output: -2.36 } },
    ],
  },
  {
    id: 'nature-film-bothy-depths',
    name: 'Bothy depths',
    category: 'pitch',
    description:
      'A quarter-speed crawl two octaves down, smooth and unbroken, then a four-track cassette, dull on top, unsteady and hissing.',
    effects: [
      { deviceId: 'half-speed', preset: 'Quarter speed' },
      { deviceId: 'tape', preset: 'Cassette four-track' },
    ],
  },
  {
    id: 'nature-film-projector-depths',
    name: 'Projector depths',
    category: 'pitch',
    description:
      'A quarter-speed crawl two octaves down, smooth and unbroken, then a badly warped record whose pitch sways once a turn.',
    effects: [
      { deviceId: 'half-speed', preset: 'Quarter speed', params: { length: 3890 } },
      { deviceId: 'vinyl', preset: 'Warped' },
    ],
  },
  {
    id: 'nature-film-wobbling-echo',
    name: 'Wobbling echo',
    category: 'pitch',
    description:
      'An echo that now and then lurches down a fifth and back, then a sharp copy and a flat one, full-range, wide to either side.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slow lurch', params: { time: 393, modRate: 0.56 } },
      { deviceId: 'stereo-detune', preset: 'Wider', params: { delay: 18.6 } },
    ],
  },
  {
    id: 'nature-film-hedgerow-stutter',
    name: 'Hedgerow stutter',
    category: 'pitch',
    description:
      'A stutter of tiny half-speed pieces, an octave down, then a hovering tape wash, into a driven spring tank.',
    effects: [
      { deviceId: 'half-speed', preset: 'Short stutter' },
      { deviceId: 'tape-echo', preset: 'Hovering wash' },
      { deviceId: 'spring-reverb', preset: 'Dub send' },
    ],
  },
  {
    id: 'nature-film-loop-run-slow',
    name: 'Loop run slow',
    category: 'pitch',
    description:
      'A low, dark tape loop played backwards at half speed, into a faint short reverb with a slight upward drift.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards', params: { length: 3.89 } },
      { deviceId: 'bloom-reverb', preset: 'Faint glow', params: { decay: 3.32 } },
    ],
  },
  {
    id: 'nature-film-caravan-master',
    name: 'Caravan master',
    category: 'master',
    description:
      'A few decibels of soft saturation with the top eased, then a parallel compressor that lifts quiet playing and tails, then a safety limiter.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 373, release: 2.64 } },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: -2.21 } },
    ],
  },
  {
    id: 'nature-film-bracken-master',
    name: 'Bracken master',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.6 } },
    ],
  },
  {
    id: 'nature-film-chalk-dust-master',
    name: 'Chalk-dust master',
    category: 'master',
    description:
      'A little soft saturation, then a slow levelling compressor, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 325, release: 1.96 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.44 } },
    ],
  },
  {
    id: 'nature-film-frogspawn-finish',
    name: 'Frogspawn finish',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a fast limiter that steps in only on the loudest peaks.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'nature-film-tin-roof-finish',
    name: 'Tin-roof finish',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a rumble cut and a small lift of presence, then a lightly pushed limiter.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ambient-eq', preset: 'Keys' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'nature-film-osprey-finish',
    name: 'Osprey finish',
    category: 'master',
    description:
      'A few decibels of soft saturation with the top eased, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: -4.53 } },
    ],
  },
  {
    id: 'nature-film-hillside-lacquer',
    name: 'Hillside lacquer',
    category: 'master',
    description:
      'A subsonic cut with the low mids and the presence eased, then a parallel compressor, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone', params: { clearTime: 1.45 } },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 449, release: 3.08 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 5.38 } },
    ],
  },
]
