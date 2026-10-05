// Soft Pedal: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'soft-pedal-hall-on-parquet',
    name: 'Hall on parquet',
    category: 'space',
    description:
      'Two dull copies that wander, a haze round the notes, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Piano haze', params: { delay: 18.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 10.5, modRate: 0.428 } },
    ],
  },
  {
    id: 'soft-pedal-draughty-valley',
    name: 'Draughty valley',
    category: 'space',
    description:
      'Only the two detuned copies, hard left and right, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wet only' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 11.2, predelayMs: 123, breathRate: 0.334 },
      },
    ],
  },
  {
    id: 'soft-pedal-floorboard-hall',
    name: 'Floorboard hall',
    category: 'space',
    description:
      'Only the two detuned copies, hard left and right, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wet only', params: { delay: 15.5 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 57, lowDecay: 2.74, midDecay: 2.25 },
      },
    ],
  },
  {
    id: 'soft-pedal-twilit-hall',
    name: 'Twilit hall',
    category: 'space',
    description:
      'Two copies fed back into a small blur round the upper notes, into a hall heard from far off with little dry sound left.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Cloud' },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { lowDecay: 5.05, midDecay: 4.97 } },
    ],
  },
  {
    id: 'soft-pedal-balcony-plate',
    name: 'Balcony plate',
    category: 'space',
    description:
      'Two dark late copies, a shadow either side of the sound, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Shadow' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 40.3 } },
    ],
  },
  {
    id: 'soft-pedal-undamped-hall',
    name: 'Undamped hall',
    category: 'space',
    description:
      'Two full-range copies tuned further apart, reaching lower, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 9.05, predelayMs: 114, breathRate: 0.324 },
      },
    ],
  },
  {
    id: 'soft-pedal-hall-one-floor-up',
    name: 'Hall one floor up',
    category: 'space',
    description:
      'A sharp copy on the left and a flat one on the right, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { delay: 15.1 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 47, lowDecay: 3.5, midDecay: 2.76 },
      },
    ],
  },
  {
    id: 'soft-pedal-aisle-cathedral',
    name: 'Aisle cathedral',
    category: 'space',
    description:
      'A vast nave that rings for about eight seconds, then a plain two-voice chorus with a voice towards each side.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { lowDecay: 7.48 } },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.765, delayMs: 10.8 } },
    ],
  },
  {
    id: 'soft-pedal-stacked-chair-hall',
    name: 'Stacked-chair hall',
    category: 'space',
    description:
      'A hall whose lows outlast its damped top, then a deep slow chorus on a long delay, swaying over seconds.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { preDelay: 52.2, lowDecay: 4.19 } },
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.149, delayMs: 26.4 } },
    ],
  },
  {
    id: 'soft-pedal-overstrung-cathedral',
    name: 'Overstrung cathedral',
    category: 'space',
    description:
      'A huge dark cathedral with only the lows left ringing, then three detuned voices spread hard apart with no dry sound.',
    effects: [
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 29.1, modRate: 0.0902 } },
      { deviceId: 'chorus', preset: 'Voices only', params: { rate: 0.385, delayMs: 15.4 } },
    ],
  },
  {
    id: 'soft-pedal-undertow-after-hours',
    name: 'Undertow after hours',
    category: 'space',
    description:
      'A hall whose lows ring on long after the rest has gone, then two dark late copies, a shadow either side of the sound.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 56.8, midDecay: 2.01 },
      },
      { deviceId: 'stereo-detune', preset: 'Shadow', params: { delay: 27.8 } },
    ],
  },
  {
    id: 'soft-pedal-fifths-at-closing',
    name: 'Fifths at closing',
    category: 'space',
    description:
      'A mellow reverb whose tail drifts down towards the fifth, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Falling fifths' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 11.8 } },
    ],
  },
  {
    id: 'soft-pedal-hall-by-the-stove',
    name: 'Hall by the stove',
    category: 'space',
    description:
      'A second take either side, a little late and out of tune, into a large hall heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { delay: 35.7 } },
      { deviceId: 'fdn-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'soft-pedal-cave-to-no-one',
    name: 'Cave to no one',
    category: 'space',
    description:
      'A small room that is over in about a second, into a long blurred cave that slides slowly between intervals.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Room' },
      { deviceId: 'swarm-reverb', preset: 'Slow stretch', params: { length: 0.664, glide: 4.93 } },
    ],
  },
  {
    id: 'soft-pedal-ebony-cloud',
    name: 'Ebony cloud',
    category: 'space',
    description:
      'A steep low-pass at four hundred hertz, the top gone, then a tight damped little room that is barely there, into a swelling reverb cloud.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { lfoRateHz: 0.939, envAttackMs: 9.76, envReleaseMs: 213 },
      },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 2.42 } },
    ],
  },
  {
    id: 'soft-pedal-recital-halo',
    name: 'Recital halo',
    category: 'space',
    description:
      'A deep, slow compressor, then a small glassy reverb with a glint two octaves up, into a vast nave that rings for about eight seconds.',
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Drone bed',
        params: { attack: 615, release: 9.55, makeup: 6.67 },
      },
      { deviceId: 'shimmer', preset: 'Glass', params: { decay: 5.89, predelay: 21.2 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'soft-pedal-stove-side-harp',
    name: 'Stove-side harp',
    category: 'space',
    description:
      'A swell that takes about four seconds to open after silence, into sixteen strings in E minor heard alone with no dry sound.',
    effects: [
      { deviceId: 'swell', preset: 'Glacier', params: { attack: 4120 } },
      { deviceId: 'sympathetic', preset: 'Strings alone', params: { decay: 7.26 } },
    ],
  },
  {
    id: 'soft-pedal-plate-at-closing',
    name: 'Plate at closing',
    category: 'space',
    description:
      'A plate heard alone with none of the dry sound left, then a wavering double spread wide to both sides.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
      { deviceId: 'analog-delay', preset: 'Doubler', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'soft-pedal-glow-to-empty-rows',
    name: 'Glow to empty rows',
    category: 'space',
    description:
      'A gentle high cut that shades the top end, into a quiet reverb with a glimmer an octave up in its tail.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.39 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer' },
    ],
  },
  {
    id: 'soft-pedal-dusk-hall',
    name: 'Dusk hall',
    category: 'space',
    description:
      'A phaser with no dry sound, pulling the two sides apart, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'phaser', preset: 'Stereo scatter' },
      { deviceId: 'fdn-reverb', preset: 'Breathing' },
    ],
  },
  {
    id: 'soft-pedal-floorboard-echoes',
    name: 'Floorboard echoes',
    category: 'space',
    description:
      'A huge space that answers in separate far-off echoes, then a parallel compressor that lifts quiet playing and tails.',
    effects: [
      { deviceId: 'expanse', preset: 'Far echoes' },
      {
        deviceId: 'ambient-comp',
        preset: 'Lift',
        params: { attack: 364, release: 3.03, makeup: 11.5 },
      },
    ],
  },
  {
    id: 'soft-pedal-lamplit-swell',
    name: 'Lamplit swell',
    category: 'space',
    description:
      'A heavy low shelf that puts weight under the sound, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 14.6, modRate: 0.263 } },
    ],
  },
  {
    id: 'soft-pedal-midweek-ring',
    name: 'Midweek ring',
    category: 'space',
    description:
      'A small dead booth that is gone almost at once, into a faint ring of six strings in A major.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Small booth' },
      { deviceId: 'sympathetic', preset: 'Faint ring', params: { decay: 2.22 } },
    ],
  },
  {
    id: 'soft-pedal-draughty-wash',
    name: 'Draughty wash',
    category: 'space',
    description:
      'The drifting tail of a long reverb with no dry sound, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Tail alone', params: { decay: 14 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 86.4, lowDecay: 7.24, midDecay: 6.7 },
      },
    ],
  },
  {
    id: 'soft-pedal-after-hours-hall',
    name: 'After-hours hall',
    category: 'space',
    description:
      'A high cut set low enough to muffle everything, into a plain hall that rings for about three seconds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.35 } },
      { deviceId: 'shimmer', preset: 'Plain hall' },
    ],
  },
  {
    id: 'soft-pedal-foyer-undertow',
    name: 'Foyer undertow',
    category: 'space',
    description:
      'A hall whose lows ring on long after the rest has gone, then an equaliser that takes presence, air and lows away.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { preDelay: 56.3 } },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.63 } },
    ],
  },
  {
    id: 'soft-pedal-aisle-hall',
    name: 'Aisle hall',
    category: 'space',
    description:
      'A bowed swell at half strength under the dry attacks, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 266, release: 133 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'soft-pedal-half-stick-tail',
    name: 'Half-stick tail',
    category: 'space',
    description:
      'A dark hall that takes about twenty seconds to die away, then the sides pushed out past normal, with the bass kept narrow.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0897 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'soft-pedal-lento-tide',
    name: 'Lento tide',
    category: 'space',
    description:
      'A vast hall that opens to the sound in very slow waves, then a second take either side, a little late and out of tune.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 12.3, breathRate: 0.0527 } },
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { delay: 28.2 } },
    ],
  },
  {
    id: 'soft-pedal-lento-waves',
    name: 'Lento waves',
    category: 'space',
    description:
      'A plain short room whose tail stays at pitch, into a reverb that breathes in slow waves over and over.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Still room' },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { time: 2 } },
    ],
  },
  {
    id: 'soft-pedal-pedal-past-the-door',
    name: 'Pedal past the door',
    category: 'space',
    description:
      'A half-deep swell, then eight strings in C major that ring on as under a held pedal, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Ghost pick', params: { attack: 511, release: 162 } },
      { deviceId: 'sympathetic', preset: 'Piano pedal', params: { decay: 3.11 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'soft-pedal-shuttered-air',
    name: 'Shuttered air',
    category: 'space',
    description:
      'A short swell that rounds the front off every note, into a hint of open space behind the sound.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 150, release: 70.4 } },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
  },
  {
    id: 'soft-pedal-air-on-a-weekday',
    name: 'Air on a weekday',
    category: 'space',
    description:
      'A wide detune, sharp on the left and flat on the right, into a trace of room around the sound.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Detuned' },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'soft-pedal-pedal-down-hall',
    name: 'Pedal-down hall',
    category: 'space',
    description:
      'A half-deep swell that leaves a ghost of each attack, into a hall whose tail sways in pitch with a trace of the octave.',
    effects: [
      { deviceId: 'swell', preset: 'Ghost pick', params: { attack: 506, release: 147 } },
      { deviceId: 'shimmer', preset: 'Swaying hall' },
    ],
  },
  {
    id: 'soft-pedal-cathedral-in-felt',
    name: 'Cathedral in felt',
    category: 'space',
    description:
      'A ring-easing equaliser, then a small room that casts a shadow an octave below, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 2.97 } },
      { deviceId: 'shimmer', preset: 'Low shadow' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 28.8, modRate: 0.0967 } },
    ],
  },
  {
    id: 'soft-pedal-pedal-in-a-draught',
    name: 'Pedal in a draught',
    category: 'space',
    description:
      'A small plate that is gone in a second or two, into eight strings in C major that ring on as under a held pedal.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { predelayMs: 10.9 } },
      { deviceId: 'sympathetic', preset: 'Piano pedal' },
    ],
  },
  {
    id: 'soft-pedal-draped-swell',
    name: 'Draped swell',
    category: 'space',
    description:
      'A low cut that thins the bass, with a little air on top, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.58 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 14.2, modRate: 0.312 } },
    ],
  },
  {
    id: 'soft-pedal-plate-by-one-lamp',
    name: 'Plate by one lamp',
    category: 'space',
    description:
      'A long plate with a wide and even tail, then a fast reel with no hiss, driven hard so peaks are squashed.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate' },
      { deviceId: 'tape', preset: 'Hot glue' },
    ],
  },
  {
    id: 'soft-pedal-trace-half-heard',
    name: 'Trace half heard',
    category: 'echo',
    description:
      'A faint echo and faint recollections behind the playing, into a big muffled cave that rings for about six seconds.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Faint recall',
        params: { time: 434, reach: 19.8, size: 2.23 },
      },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 6.2, breathRate: 0.272 } },
    ],
  },
  {
    id: 'soft-pedal-felted-echo',
    name: 'Felted echo',
    category: 'echo',
    description:
      'A slow tape echo with a long trail that dulls as it goes, into a dark hall that takes about twenty seconds to die away.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Long dark trail' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Endless tail',
        params: { decay: 18.6, breathRate: 0.0857 },
      },
    ],
  },
  {
    id: 'soft-pedal-empty-stage-trail',
    name: 'Empty-stage trail',
    category: 'echo',
    description:
      'A slow tape echo with a long trail that dulls as it goes, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { time: 1530 } },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'soft-pedal-rafter-trail',
    name: 'Rafter trail',
    category: 'echo',
    description:
      'A slow echo with a long dark trail and a few recollections, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Dark trail', params: { time: 1240, size: 5.36 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 81.3, lowDecay: 6.75, midDecay: 6.19 },
      },
    ],
  },
  {
    id: 'soft-pedal-shuttered-echoes',
    name: 'Shuttered echoes',
    category: 'echo',
    description:
      'A huge space that answers in separate far-off echoes, then a trace of dull detuned copies at the edges.',
    effects: [
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 22.1, modRate: 0.273 } },
      { deviceId: 'stereo-detune', preset: 'Faint width', params: { delay: 14 } },
    ],
  },
  {
    id: 'soft-pedal-rained-in-echoes',
    name: 'Rained-in echoes',
    category: 'echo',
    description:
      'A handful of separate echoes that fall away and repeat, then a wide detune, sharp on the left and flat on the right.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Scattered', params: { time: 2.19 } },
      { deviceId: 'freq-shifter', preset: 'Detuned', params: { delay: 48.8, lfoRate: 0.487 } },
    ],
  },
  {
    id: 'soft-pedal-brushed-echo',
    name: 'Brushed echo',
    category: 'echo',
    description:
      'A swell that takes seconds to rise after each silence, then a slow echo with a long dark trail and a few recollections.',
    effects: [
      { deviceId: 'swell', preset: 'Tide' },
      {
        deviceId: 'echo-memory',
        preset: 'Dark trail',
        params: { time: 1020, reach: 29.8, size: 4.8 },
      },
    ],
  },
  {
    id: 'soft-pedal-stacked-chair-pool',
    name: 'Stacked-chair pool',
    category: 'echo',
    description:
      'A wide, muffled loop of the last phrase, as if under water, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Underwater', params: { length: 2.45 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'soft-pedal-twilit-undertow',
    name: 'Twilit undertow',
    category: 'echo',
    description:
      'Long backwards phrases an octave down, dark and slow, into a wide wash of sixteen long strings in D minor.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Undertow', params: { time: 2190 } },
      { deviceId: 'sympathetic', preset: 'Minor wash', params: { mix: 0.513 } },
    ],
  },
  {
    id: 'soft-pedal-echo-under-drapes',
    name: 'Echo under drapes',
    category: 'echo',
    description:
      'Dotted tape repeats that pile up in a darkening wash, then a quick loop of about the last half second, soon faded.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Dub wash' },
      { deviceId: 'micro-looper', preset: 'Quick loop', params: { length: 0.559 } },
    ],
  },
  {
    id: 'soft-pedal-plaster-repeats',
    name: 'Plaster repeats',
    category: 'echo',
    description:
      'A steady tape echo with no wobble, dirt or dulling, into a room heard from its far end with little dry sound left.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Clean and steady', params: { time: 471 } },
      { deviceId: 'ether-reverb', preset: 'Distant', params: { mix: 0.546 } },
    ],
  },
  {
    id: 'soft-pedal-rehearsal-echo',
    name: 'Rehearsal echo',
    category: 'echo',
    description:
      'A clean, steady echo with no wobble and an open top, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 189, modRate: 0.554 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 15.5 } },
    ],
  },
  {
    id: 'soft-pedal-reel-on-the-quiet',
    name: 'Reel on the quiet',
    category: 'tape',
    description:
      'A hall heard from far off with little dry sound left, then a fast, steady reel pushed into soft saturation.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 21.6, lowDecay: 5.55, midDecay: 4.95 },
      },
      { deviceId: 'tape', preset: 'Mastering deck', params: { output: -2.28 } },
    ],
  },
  {
    id: 'soft-pedal-stacked-chair-tape',
    name: 'Stacked-chair tape',
    category: 'tape',
    description:
      'A hall heard from far off with little dry sound left, then a cassette with a full head bump and a rolled-off top.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 20.5, lowDecay: 4.97, midDecay: 4.44 },
      },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'soft-pedal-walnut-tape',
    name: 'Walnut tape',
    category: 'tape',
    description:
      'A hall whose lows outlast its damped top, then a tape reel with soft saturation, slight wobble and hiss.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 55.5, lowDecay: 3.84, midDecay: 3.22 },
      },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
    ],
  },
  {
    id: 'soft-pedal-draughty-tape',
    name: 'Draughty tape',
    category: 'tape',
    description:
      'A subsonic cut with the low mids and presence eased a touch, then a reel of tape, then three tape heads in a row, a cluster on every repeat.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone', params: { clearTime: 1.54 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 509 } },
    ],
  },
  {
    id: 'soft-pedal-reel-at-half-stick',
    name: 'Reel at half stick',
    category: 'tape',
    description:
      'Faint recollections, then a clean pass over fast new tape, with nothing added, into a far-off plate haze.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Faint recall' },
      { deviceId: 'tape', preset: 'Clean transfer', params: { output: -3.12 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'soft-pedal-rehearsal-tape',
    name: 'Rehearsal tape',
    category: 'tape',
    description:
      'A fresh reel of tape, open on top and nearly steady, then whole phrases played backwards about four seconds later.',
    effects: [
      { deviceId: 'patina', preset: 'New tape', params: { output: 2.81 } },
      { deviceId: 'reverse-delay', preset: 'Long mirror', params: { time: 3950 } },
    ],
  },
  {
    id: 'soft-pedal-surf-in-the-stalls',
    name: 'Surf in the stalls',
    category: 'motion',
    description:
      'A warm, full equaliser, then the level rising and falling at random, like surf, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'tremolo', preset: 'Sea swell' },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 58.3 } },
    ],
  },
  {
    id: 'soft-pedal-panelled-comb',
    name: 'Panelled comb',
    category: 'motion',
    description:
      'An equaliser that takes presence, air and lows away, then a slowly sliding comb, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'tremolo', preset: 'Drifting comb' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'soft-pedal-chorus-as-it-rains',
    name: 'Chorus as it rains',
    category: 'motion',
    description:
      'A heavy low shelf, then a plain two-voice chorus with a voice towards each side, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.895, delayMs: 13.2 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 64.6 } },
    ],
  },
  {
    id: 'soft-pedal-upstairs-hollow',
    name: 'Upstairs hollow',
    category: 'motion',
    description:
      'An equaliser that takes presence, air and lows away, then a hollow swelling chorus, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'chorus', preset: 'Hollow swell', params: { rate: 0.0882, delayMs: 9.24 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'soft-pedal-rotary-in-felt',
    name: 'Rotary in felt',
    category: 'motion',
    description:
      'A dark low-pass that each note nudges open a moment late, then a slow rotating speaker set shallow and mixed half dry, into a far-off hall.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Soft bloom',
        params: { lfoRateHz: 1.11, envAttackMs: 108, envReleaseMs: 838 },
      },
      { deviceId: 'rotary', preset: 'Faint motion' },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 21.1, lowDecay: 4.64, midDecay: 4.49 },
      },
    ],
  },
  {
    id: 'soft-pedal-parquet-chorale',
    name: 'Parquet chorale',
    category: 'motion',
    description:
      'A rotating speaker on its slow speed, into sixteen hard-driven strings in F major that ring for seconds.',
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'sympathetic', preset: 'Glass harp', params: { decay: 7.04, mix: 0.42 } },
    ],
  },
  {
    id: 'soft-pedal-wall-to-wall-double',
    name: 'Wall-to-wall double',
    category: 'motion',
    description:
      'Two late copies either side, like loose double-tracking, then a plain echo that is a little darker on each repeat, into a medium plate.',
    effects: [
      { deviceId: 'chorus', preset: 'Loose double', params: { rate: 0.191, delayMs: 26.7 } },
      {
        deviceId: 'echo-memory',
        preset: 'Plain echo',
        params: { time: 341, reach: 20.6, size: 2.89 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { predelayMs: 19.6 } },
    ],
  },
  {
    id: 'soft-pedal-salon-swell',
    name: 'Salon swell',
    category: 'motion',
    description:
      'A hollow three-voice chorus swelling over about ten seconds, then a reverb that swells and ebbs in waves of about four seconds.',
    effects: [
      { deviceId: 'chorus', preset: 'Hollow swell' },
      { deviceId: 'shaped-reverb', preset: 'Slow tide', params: { time: 3.51 } },
    ],
  },
  {
    id: 'soft-pedal-ivory-rotary',
    name: 'Ivory rotary',
    category: 'motion',
    description:
      'A slow rotating speaker heard from across the room, into a large reverb whose tail sinks an octave on every pass.',
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'shimmer', preset: 'Undertow' },
    ],
  },
  {
    id: 'soft-pedal-chorus-one-floor-up',
    name: 'Chorus one floor up',
    category: 'motion',
    description:
      'A bucket-brigade echo with a slow chorus on its repeats, then twelve phaser stages tuned far apart, drifting slowly.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 255, modRate: 0.871 } },
      { deviceId: 'phaser', preset: 'Twelve stage cloud' },
    ],
  },
  {
    id: 'soft-pedal-lid-down-shimmer',
    name: 'Lid-down shimmer',
    category: 'motion',
    description:
      'Piled-up held chords, every overtone drifting, spread wide, then a heavy low shelf that puts weight under the sound.',
    effects: [
      { deviceId: 'sustainer', preset: 'Shimmer cloud' },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'soft-pedal-balcony-phaser',
    name: 'Balcony phaser',
    category: 'motion',
    description:
      'Two full-range copies tuned further apart, reaching lower, then a hollow phaser with peaks where its notches would be.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider' },
      { deviceId: 'phaser', preset: 'Negative notch' },
    ],
  },
  {
    id: 'soft-pedal-double-after-hours',
    name: 'Double after hours',
    category: 'motion',
    description:
      'Two copies in tune that wander like extra takes, into a hall heard from far off with little dry sound left.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Drifting', params: { delay: 24 } },
      { deviceId: 'hall-reverb', preset: 'Far away' },
    ],
  },
  {
    id: 'soft-pedal-twilit-chorus',
    name: 'Twilit chorus',
    category: 'motion',
    description:
      'A hollow three-voice chorus swelling over about ten seconds, into faint voices singing quietly behind the sound.',
    effects: [
      { deviceId: 'chorus', preset: 'Hollow swell', params: { rate: 0.102, delayMs: 8.82 } },
      { deviceId: 'vowel-reverb', preset: 'Faint voices', params: { decay: 4.35, preDelay: 20.4 } },
    ],
  },
  {
    id: 'soft-pedal-back-row-swell',
    name: 'Back-row swell',
    category: 'texture',
    description:
      'A volume-pedal swell, then a sharp and a flat copy kept in the centre, thick not wide, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 269, release: 163 } },
      { deviceId: 'stereo-detune', preset: 'Thickener' },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'soft-pedal-panelled-sunrise',
    name: 'Panelled sunrise',
    category: 'texture',
    description:
      'A late-blooming slow swell, then two copies a few cents sharp and flat, left and right, into a dark, very long hall.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1580, release: 896 } },
      { deviceId: 'pitch-shifter', preset: 'Doubler' },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0796 } },
    ],
  },
  {
    id: 'soft-pedal-brushed-swell',
    name: 'Brushed swell',
    category: 'texture',
    description:
      'A slow swell after each silence, with some dry attack left, then a small detuned blur, into a hall on its own.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1380, release: 333 } },
      { deviceId: 'stereo-detune', preset: 'Cloud' },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { lowDecay: 4.03, midDecay: 3.53 },
      },
    ],
  },
  {
    id: 'soft-pedal-spruce-rumble',
    name: 'Spruce rumble',
    category: 'texture',
    description:
      'A low blurred bed under the sound, nothing above the bass, then a dark smear of long grains that trails for many seconds.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Sub bed' },
      { deviceId: 'grain-delay', preset: 'Dark slow smear', params: { time: 1670, size: 483 } },
    ],
  },
  {
    id: 'soft-pedal-stove-side-pedal',
    name: 'Stove-side pedal',
    category: 'texture',
    description:
      'A long clean sustain, then a six-stage phaser turning about every three seconds, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Long clean hold' },
      { deviceId: 'phaser', preset: 'Warm six-stage' },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 9.07, modRate: 0.428, mix: 0.298 },
      },
    ],
  },
  {
    id: 'soft-pedal-stage-door-rise',
    name: 'Stage-door rise',
    category: 'texture',
    description:
      'A slow swell after each silence that opens only at the end, then three voices drifting over a cycle of about twelve seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1550, release: 732 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.0727, delayMs: 24.9 } },
    ],
  },
  {
    id: 'soft-pedal-cloud-after-supper',
    name: 'Cloud after supper',
    category: 'texture',
    description:
      'A soft cloud of grains made from what was just played, into a tiny boxy room that is gone almost at once.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Soft cloud' },
      { deviceId: 'expanse', preset: 'Small box', params: { decay: 0.507, modRate: 0.445 } },
    ],
  },
  {
    id: 'soft-pedal-alcove-haze',
    name: 'Alcove haze',
    category: 'texture',
    description:
      'A compressor as slow as a hand on a fader, then a wide hanging grain haze, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader', params: { makeup: -0.266 } },
      { deviceId: 'grain-delay', preset: 'Frozen haze' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { preDelay: 72, lowDecay: 7.46 } },
    ],
  },
  {
    id: 'soft-pedal-rained-in-cellos',
    name: 'Rained-in cellos',
    category: 'texture',
    description:
      'A dark, low string pad like cellos under the playing, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos' },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'soft-pedal-layers-slow-to-empty',
    name: 'Layers slow to empty',
    category: 'texture',
    description:
      'A held pad where each new chord piles onto the last, into ten strings that tune themselves to the notes they hear.',
    effects: [
      { deviceId: 'sustainer', preset: 'Stacked harmony', params: { mix: 0.3 } },
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { decay: 4.36, mix: 0.3 } },
    ],
  },
  {
    id: 'soft-pedal-pedal-at-dusk',
    name: 'Pedal at dusk',
    category: 'texture',
    description:
      'Every note sustained after it is played, with no smearing, into a huge slow wash that swells in and hangs with no dry sound.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Clean sustain', params: { mix: 0.27 } },
      { deviceId: 'expanse', preset: 'Wash alone', params: { decay: 40.2, modRate: 0.111 } },
    ],
  },
  {
    id: 'soft-pedal-alcove-swell',
    name: 'Alcove swell',
    category: 'texture',
    description:
      'Long slow grains an octave down, most of them reversed, then a faint trace of tape echo behind the playing.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { size: 971, density: 5.26 } },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 460 } },
    ],
  },
  {
    id: 'soft-pedal-depths-in-a-draught',
    name: 'Depths in a draught',
    category: 'texture',
    description:
      'A dark, bassy wash that hangs under the notes for seconds, then a reel of tape at middle speed, with a little drift and hiss.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Dark water' },
      { deviceId: 'tape', preset: 'Quarter inch', params: { output: -6.47 } },
    ],
  },
  {
    id: 'soft-pedal-overstrung-halo',
    name: 'Overstrung halo',
    category: 'texture',
    description:
      'A string pad with a second section an octave above, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Octave halo' },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.55 } },
    ],
  },
  {
    id: 'soft-pedal-octave-in-the-bass',
    name: 'Octave in the bass',
    category: 'pitch',
    description:
      'A dark octave below held chords, every note moved cleanly, into a small dark room that is gone in about a second.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad below', params: { size: 54.6 } },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'soft-pedal-foyer-octave',
    name: 'Foyer octave',
    category: 'pitch',
    description:
      'A half-speed replay an octave down, with no dry sound, then a wobbling tape double a moment behind each note.',
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed' },
      { deviceId: 'tape-echo', preset: 'Wobbly double', params: { time: 33.6 } },
    ],
  },
  {
    id: 'soft-pedal-doorway-reel',
    name: 'Doorway reel',
    category: 'pitch',
    description:
      'A half-speed replay an octave down, with no dry sound, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed' },
      { deviceId: 'expanse', preset: 'Far echoes' },
    ],
  },
  {
    id: 'soft-pedal-annexe-depths',
    name: 'Annexe depths',
    category: 'pitch',
    description:
      'Long sparse grains two octaves down, a slow bass shadow, then a wash of three fed-back tape heads that hovers and fades.',
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Two octaves under',
        params: { size: 1180, density: 3.52 },
      },
      { deviceId: 'tape-echo', preset: 'Hovering wash' },
    ],
  },
  {
    id: 'soft-pedal-evening-octave',
    name: 'Evening octave',
    category: 'pitch',
    description:
      'A dark half-speed octave kept low under the dry sound, then a plain two-voice chorus with a voice towards each side.',
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1050 } },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.836, delayMs: 11.3 } },
    ],
  },
  {
    id: 'soft-pedal-draped-octave',
    name: 'Draped octave',
    category: 'pitch',
    description:
      'A muffled half-speed octave below, all lows, in the middle, then a faint, dull echo with a slow chorus on it.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor' },
      { deviceId: 'analog-delay', preset: 'Faint halo', params: { time: 288, modRate: 0.405 } },
    ],
  },
  {
    id: 'soft-pedal-right-hand-halo',
    name: 'Right-hand halo',
    category: 'pitch',
    description:
      'A string pad with a second section an octave above, then a quiet, unsmeared sustain that holds each note for seconds.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Octave halo' },
      { deviceId: 'spectral-blur', preset: 'Long clean hold' },
    ],
  },
  {
    id: 'soft-pedal-brushed-blur',
    name: 'Brushed blur',
    category: 'pitch',
    description:
      'A blurred half-speed wash an octave down, its cycles uneven, then a held pad that takes seconds to melt into each new chord.',
    effects: [
      { deviceId: 'half-speed', preset: 'Blurred half', params: { length: 502 } },
      { deviceId: 'sustainer', preset: 'Long glide' },
    ],
  },
  {
    id: 'soft-pedal-octave-after-hours',
    name: 'Octave after hours',
    category: 'pitch',
    description:
      'A faint octave above each note, slightly detuned, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 28.9, modRate: 0.0885 } },
    ],
  },
  {
    id: 'soft-pedal-overcast-glue',
    name: 'Overcast glue',
    category: 'master',
    description:
      'A low cut and a small dip in the low mids, to make room, then a gentle compressor, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Layer', params: { clearTime: 1.62 } },
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { gain: 3.17 } },
    ],
  },
  {
    id: 'soft-pedal-pianissimo-plate',
    name: 'Pianissimo plate',
    category: 'master',
    description:
      'A small plate that is gone in a second or two, then a true-peak ceiling with the level eased back before it.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { predelayMs: 9.51 } },
      { deviceId: 'ambient-limiter', preset: 'Pull back', params: { release: 1.6, gain: 1.75 } },
    ],
  },
  {
    id: 'soft-pedal-unlit-shelf',
    name: 'Unlit shelf',
    category: 'master',
    description:
      'A heavy low shelf that puts weight under the sound, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.31 } },
    ],
  },
  {
    id: 'soft-pedal-vestibule-tone',
    name: 'Vestibule tone',
    category: 'master',
    description:
      'A low cut that thins the bass, with a little air on top, then a true-peak ceiling that lets go again over several seconds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.4 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 6.06 } },
    ],
  },
  {
    id: 'soft-pedal-fermata-hall',
    name: 'Fermata hall',
    category: 'master',
    description:
      'A faint hall tail of about three seconds, then a low ceiling that keeps loud passages down for a while.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
      { deviceId: 'ambient-limiter', preset: 'Late night', params: { gain: -0.546 } },
    ],
  },
  {
    id: 'soft-pedal-empty-stage-reel',
    name: 'Empty-stage reel',
    category: 'master',
    description:
      'Soft tape-style saturation, then a low cut and some presence, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape' },
      { deviceId: 'ambient-eq', preset: 'Voice', params: { clearTime: 1.32 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { release: 1.63 } },
    ],
  },
  {
    id: 'soft-pedal-glue-on-the-quiet',
    name: 'Glue on the quiet',
    category: 'master',
    description:
      'A warm, full equaliser, then a firm, slow compressor that keeps long swells held down, then a low, slow ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'ambient-comp', preset: 'Hold swells', params: { attack: 151, release: 6.18 } },
      { deviceId: 'ambient-limiter', preset: 'Late night', params: { gain: -0.92 } },
    ],
  },
]
