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
      'Two dull copies that wander in a haze round the notes, into a wide open space with a slowly wavering tail.',
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
      'A sharp copy hard left and a flat one hard right, alone, into a huge dark open space that answers late and rings on.',
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
      'A sharp copy hard left and a flat one hard right, alone, into a hall with about two and a half seconds of tail.',
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
      'Two copies that repeat into a blur round the upper notes, into a damped hall of about five seconds, heard from far off.',
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
      'Two dark late copies that shadow the sound on either side, into a long plate with a wide and even tail.',
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
      'A sharp copy and a flat one, full-range, wide to either side, into a huge dark open space that answers late and rings on.',
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
      'A vast nave that rings for about eight seconds, then a plain chorus with a detuned copy towards each side.',
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
      'A huge dark cathedral with only the lows left ringing, then a chorus heard alone, its detuned copies spread hard apart.',
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
      'A hall whose lows ring on long after the rest has gone, then two dark late copies that shadow the sound on either side.',
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
    id: 'soft-pedal-plate-at-closing',
    name: 'Plate at closing',
    category: 'space',
    description:
      'A plate heard alone with none of the dry sound left, then a wavering double of the sound spread wide to both sides.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
      { deviceId: 'analog-delay', preset: 'Doubler', params: { mix: 0.3 } },
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
      'A big lift of the low end that puts weight under the sound, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 14.6, modRate: 0.263 } },
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
      'A bowed swell that lets part of each attack through, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 266, release: 133 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
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
    id: 'soft-pedal-pedal-down-hall',
    name: 'Pedal-down hall',
    category: 'space',
    description:
      'A shallow swell that leaves a ghost of each attack, into a hall that sways in pitch with a trace of the octave above.',
    effects: [
      { deviceId: 'swell', preset: 'Ghost pick', params: { attack: 506, release: 147 } },
      { deviceId: 'shimmer', preset: 'Swaying hall' },
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
    id: 'soft-pedal-treated-hall',
    name: 'Treated hall',
    category: 'space',
    description:
      'A late copy on each side, like the same part played twice, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'chorus', preset: 'Loose double', params: { rate: 0.183, delayMs: 27.8 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 11.8, breathRate: 0.0502 } },
    ],
  },
  {
    id: 'soft-pedal-midweek-hall',
    name: 'Midweek hall',
    category: 'space',
    description:
      'A hall of about four seconds with no dry sound in it, then a quick, firm compressor that takes no notice of low rumble.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Full wet send' },
      {
        deviceId: 'ambient-comp',
        preset: 'Mic',
        params: { attack: 64.7, release: 1.02, makeup: 2.28 },
      },
    ],
  },
  {
    id: 'soft-pedal-half-stick-ring',
    name: 'Half-stick ring',
    category: 'space',
    description:
      'A gentle high cut that shades the top end, into four strings tuned to a G major chord that ring in sympathy.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'sympathetic', preset: 'Open triad', params: { decay: 5.37 } },
    ],
  },
  {
    id: 'soft-pedal-wobble-under-the-lid',
    name: 'Wobble under the lid',
    category: 'space',
    description:
      'A long reverb whose tail wavers queasily in pitch, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'expanse', preset: 'Seasick choir' },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.46 } },
    ],
  },
  {
    id: 'soft-pedal-stage-door-murmur',
    name: 'Stage-door murmur',
    category: 'space',
    description:
      'An equaliser that takes presence, air and lows away, into a muffled reverb whose octave climb is soon damped away.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'shimmer', preset: 'Muffled choir' },
    ],
  },
  {
    id: 'soft-pedal-halo-to-empty-rows',
    name: 'Halo to empty rows',
    category: 'space',
    description:
      'Eight strings in C major that ring on as under a held pedal, into a large hall heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Piano pedal' },
      { deviceId: 'fdn-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'soft-pedal-rehearsal-swell',
    name: 'Rehearsal swell',
    category: 'space',
    description:
      'A slow swell after each silence that leaves some attack in, into a reverb that swells in after each note and fades away.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1550, release: 309 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 2.76 } },
    ],
  },
  {
    id: 'soft-pedal-ring-under-drapes',
    name: 'Ring under drapes',
    category: 'space',
    description:
      'A high cut set low enough to muffle everything, into eight strings in C major that ring on as under a held pedal.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.38 } },
      { deviceId: 'sympathetic', preset: 'Piano pedal' },
    ],
  },
  {
    id: 'soft-pedal-recital-ring',
    name: 'Recital ring',
    category: 'space',
    description:
      'A shallow swell, then eight strings in C major that ring on as under a held pedal, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'swell', preset: 'Ghost pick', params: { attack: 520, release: 159 } },
      { deviceId: 'sympathetic', preset: 'Piano pedal', params: { decay: 3.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 39.3 } },
    ],
  },
  {
    id: 'soft-pedal-lid-down-hall',
    name: 'Lid-down hall',
    category: 'space',
    description:
      'A hall that answers about a quarter of a second late, then a gentle high cut that shades the top end.',
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Late arrival',
        params: { decay: 4.68, predelayMs: 245, breathRate: 0.326 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.45 } },
    ],
  },
  {
    id: 'soft-pedal-vestibule-whisper',
    name: 'Vestibule whisper',
    category: 'space',
    description:
      'A brief swell of reverb close behind each note, into a medium hall with only a breath of voice in its tail.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Short halo' },
      { deviceId: 'vowel-reverb', preset: 'Whispering' },
    ],
  },
  {
    id: 'soft-pedal-upstairs-fog',
    name: 'Upstairs fog',
    category: 'space',
    description:
      'A dull reverb that swells in over seconds and fades slowly, then a high cut set low enough to muffle everything.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.35 } },
    ],
  },
  {
    id: 'soft-pedal-draped-hall',
    name: 'Draped hall',
    category: 'space',
    description:
      'A fully damped hall with a few seconds of tail, then a trace of chorus on the top of the sound only.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
      { deviceId: 'chorus', preset: 'Faint air' },
    ],
  },
  {
    id: 'soft-pedal-draughty-ring',
    name: 'Draughty ring',
    category: 'space',
    description:
      'A swell that fades every note in like a bow stroke, into twelve strings in A minor that ring with notes in that key.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 434, release: 159 } },
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { decay: 4.07 } },
    ],
  },
  {
    id: 'soft-pedal-panelled-choir',
    name: 'Panelled choir',
    category: 'space',
    description:
      'A huge hall whose tail hums a soft "oo" for a long while, into a reverb that rises for about four seconds behind each note.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Endless oo', params: { decay: 39.2, preDelay: 19.1 } },
      { deviceId: 'shaped-reverb', preset: 'Long rise' },
    ],
  },
  {
    id: 'soft-pedal-plaster-haze',
    name: 'Plaster haze',
    category: 'space',
    description:
      'A sharp copy and a flat one, full-range, wide to either side, then a wide haze of grains that hangs on long after the playing.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider', params: { delay: 17.5 } },
      { deviceId: 'grain-delay', preset: 'Frozen haze' },
    ],
  },
  {
    id: 'soft-pedal-trace-half-heard',
    name: 'Trace half heard',
    category: 'echo',
    description:
      'A faint echo with earlier phrases coming faintly back, into a big muffled cave that rings for about six seconds.',
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
      'A slow echo with a long dark trail as earlier phrases return, into a cathedral with about six seconds of tail.',
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
      'A swell that takes seconds to rise after each silence, then a slow echo with a long dark trail as earlier phrases return.',
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
    id: 'soft-pedal-plaster-repeats',
    name: 'Plaster repeats',
    category: 'echo',
    description:
      'A steady tape echo with no wobble, dirt or dulling, into a wide room heard from its far end.',
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
      'A clean, steady echo with no wobble and little dulling, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 189, modRate: 0.554 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 15.5 } },
    ],
  },
  {
    id: 'soft-pedal-evening-echo',
    name: 'Evening echo',
    category: 'echo',
    description:
      'Whole phrases played backwards about four seconds later, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Long mirror', params: { time: 3580 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'soft-pedal-plaster-memory',
    name: 'Plaster memory',
    category: 'echo',
    description:
      'A slow pan from side to side, a few seconds each way, then recalled moments that mostly come back reversed or slowed.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.132 } },
      { deviceId: 'echo-memory', preset: 'Backwards' },
    ],
  },
  {
    id: 'soft-pedal-fermata-echo',
    name: 'Fermata echo',
    category: 'echo',
    description:
      'A bucket-brigade echo whose soft repeats dull as they fade, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'soft-pedal-echo-by-the-stove',
    name: 'Echo by the stove',
    category: 'echo',
    description:
      'A steady tape echo with no wobble, dirt or dulling, then a soft echo while earlier phrases drift back under it.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Clean and steady', params: { time: 445 } },
      {
        deviceId: 'echo-memory',
        preset: 'Recalling',
        params: { time: 529, reach: 22.2, size: 3.18 },
      },
    ],
  },
  {
    id: 'soft-pedal-reel-on-the-quiet',
    name: 'Reel on the quiet',
    category: 'tape',
    description:
      'A damped hall of about five seconds, heard from far off, then a fast, steady reel with soft saturation.',
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
      'A damped hall of about five seconds, heard from far off, then a thick, soft cassette, full in the lows and dull on top.',
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
    id: 'soft-pedal-tape-on-soft-pedal',
    name: 'Tape on soft pedal',
    category: 'tape',
    description:
      'A thick, soft cassette, full in the lows and dull on top, into a plain room that is gone in a couple of seconds.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'bloom-reverb', preset: 'Still room' },
    ],
  },
  {
    id: 'soft-pedal-parquet-cassette',
    name: 'Parquet cassette',
    category: 'tape',
    description:
      'The level breathing in and out about every four seconds, then a thick, soft cassette, full in the lows and dull on top.',
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath' },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'soft-pedal-detuned-reel',
    name: 'Detuned reel',
    category: 'tape',
    description:
      'A big lift of the low end that puts weight under the sound, then a slow reel whose pitch sways widely and never settles.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.28 } },
      { deviceId: 'tape', preset: 'Seasick' },
    ],
  },
  {
    id: 'soft-pedal-chorus-as-it-rains',
    name: 'Chorus as it rains',
    category: 'motion',
    description:
      'A big lift of the low end that puts weight under the sound, then a plain chorus, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.895, delayMs: 13.2 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 64.6 } },
    ],
  },
  {
    id: 'soft-pedal-balcony-phaser',
    name: 'Balcony phaser',
    category: 'motion',
    description:
      'A sharp copy and a flat one, full-range, wide to either side, then a hollow, resonant phaser turning about every four seconds.',
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
      'Two copies in tune that wander like extra takes, into a damped hall of about five seconds, heard from far off.',
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
      'A hollow chorus that swells over about ten seconds, into faint voices singing behind the sound.',
    effects: [
      { deviceId: 'chorus', preset: 'Hollow swell', params: { rate: 0.102, delayMs: 8.82 } },
      { deviceId: 'vowel-reverb', preset: 'Faint voices', params: { decay: 4.35, preDelay: 20.4 } },
    ],
  },
  {
    id: 'soft-pedal-swell-past-the-door',
    name: 'Swell past the door',
    category: 'motion',
    description:
      'An equaliser that adds lows and body and eases the top, then the level rising and falling at random, like surf, into a slow tide of reverb.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.267 } },
      { deviceId: 'shaped-reverb', preset: 'Slow tide', params: { time: 3.63 } },
    ],
  },
  {
    id: 'soft-pedal-upright-sway',
    name: 'Upright sway',
    category: 'motion',
    description:
      'A big lift of the low end, then a slow pan from side to side, a few seconds each way, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.22 } },
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.131 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'soft-pedal-shuttered-chorus',
    name: 'Shuttered chorus',
    category: 'motion',
    description:
      'An equaliser that adds lows and body and eases the top, then a slowly drifting chorus, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'chorus', preset: 'Slow drift' },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 89, lowDecay: 6.93, midDecay: 6.27 },
      },
    ],
  },
  {
    id: 'soft-pedal-swell-either-side',
    name: 'Swell either side',
    category: 'motion',
    description:
      'An equaliser that takes presence, air and lows away, then a hollow chorus that swells over about ten seconds, into a vast nave.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.61 } },
      { deviceId: 'chorus', preset: 'Hollow swell', params: { rate: 0.0959, delayMs: 9.79 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'soft-pedal-overcast-rotary',
    name: 'Overcast rotary',
    category: 'motion',
    description:
      'A slow rotating speaker heard from across the room, then a long dark tape trail, into a slow, dark swell of reverb.',
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'tape-echo', preset: 'Long dark trail' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'soft-pedal-draughty-chorus',
    name: 'Draughty chorus',
    category: 'motion',
    description:
      'A late copy on each side, like the same part played twice, into a damped hall of about five seconds, heard from far off.',
    effects: [
      { deviceId: 'chorus', preset: 'Loose double', params: { rate: 0.22 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 20.3, lowDecay: 4.49, midDecay: 3.99 },
      },
    ],
  },
  {
    id: 'soft-pedal-swirl-at-dusk',
    name: 'Swirl at dusk',
    category: 'motion',
    description:
      'A late swell on every note like a rocked volume pedal, then a four-stage phaser kept high, leaving the low end alone.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 269, release: 148 } },
      { deviceId: 'phaser', preset: 'Bass safe' },
    ],
  },
  {
    id: 'soft-pedal-doorway-rotary',
    name: 'Doorway rotary',
    category: 'motion',
    description:
      'A dark slow rotating speaker that mostly turns the lows, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'rotary', preset: 'Dark drum' },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 15, modRate: 0.289 } },
    ],
  },
  {
    id: 'soft-pedal-alcove-chorus',
    name: 'Alcove chorus',
    category: 'motion',
    description:
      'Two copies in tune that wander like extra takes, then a thick ensemble chorus turning about every two seconds.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Drifting', params: { delay: 27.6 } },
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { rate: 0.458, delayMs: 19.9 } },
    ],
  },
  {
    id: 'soft-pedal-wall-to-wall-chorus',
    name: 'Wall-to-wall chorus',
    category: 'motion',
    description:
      'A full chorus spread wide to left and right, into a tiny boxy room that is gone almost at once.',
    effects: [
      { deviceId: 'chorus', preset: 'Wide chorus' },
      { deviceId: 'expanse', preset: 'Small box', params: { decay: 0.548, modRate: 0.422 } },
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
    id: 'soft-pedal-brushed-swell',
    name: 'Brushed swell',
    category: 'texture',
    description:
      'A half-hidden slow swell, then a small detuned blur, into a hall of about four seconds with no dry sound in it.',
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
    id: 'soft-pedal-swell-on-parquet',
    name: 'Swell on parquet',
    category: 'texture',
    description:
      'A string-like swell, then a sharp copy hard left and a flat one hard right, alone, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 307, release: 611 } },
      { deviceId: 'stereo-detune', preset: 'Wet only', params: { delay: 14.1 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { mix: 0.19 } },
    ],
  },
  {
    id: 'soft-pedal-lento-swell',
    name: 'Lento swell',
    category: 'texture',
    description:
      'A half-hidden slow swell, then two copies heard just after the sound, the left one first, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow' },
      { deviceId: 'stereo-detune', preset: 'Late copy', params: { delay: 53.5 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'soft-pedal-swell-in-the-stalls',
    name: 'Swell in the stalls',
    category: 'texture',
    description:
      'A softened attack, then a sharp copy on the left and a flat one on the right, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'swell', preset: 'Soft pick' },
      { deviceId: 'stereo-detune', preset: 'Classic', params: { delay: 14.1 } },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 30.6, modRate: 0.0984 } },
    ],
  },
  {
    id: 'soft-pedal-annexe-swell',
    name: 'Annexe swell',
    category: 'texture',
    description:
      'A swell that fades every note in like a bow stroke, into a dark cellar of a room that folds the sound to mono.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 354, release: 152 } },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar' },
    ],
  },
  {
    id: 'soft-pedal-midweek-pad',
    name: 'Midweek pad',
    category: 'texture',
    description:
      'A dark string pad that lingers long after each chord, into a plain hall that rings for about three seconds.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Lingering' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 3.32, predelay: 16.5 } },
    ],
  },
  {
    id: 'soft-pedal-vestibule-pad',
    name: 'Vestibule pad',
    category: 'texture',
    description:
      'A slow swell on only the first note after each silence, then a held pad whose every overtone wavers in pitch and level.',
    effects: [
      { deviceId: 'swell', preset: 'First note only' },
      { deviceId: 'sustainer', preset: 'Wavering choir', params: { attack: 0.354, glide: 0.56 } },
    ],
  },
  {
    id: 'soft-pedal-upstairs-haze',
    name: 'Upstairs haze',
    category: 'texture',
    description:
      'A wide, muffled loop of the last phrase, as if under water, into a small room that casts a shadow an octave below.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Underwater', params: { length: 2.28 } },
      { deviceId: 'shimmer', preset: 'Low shadow' },
    ],
  },
  {
    id: 'soft-pedal-twilit-pad',
    name: 'Twilit pad',
    category: 'texture',
    description:
      'A soft string pad that swells in behind what is played, then a thick, soft cassette, full in the lows and dull on top.',
    effects: [
      { deviceId: 'pad-follower', preset: 'String pad' },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'soft-pedal-memory-slow-to-empty',
    name: 'Memory slow to empty',
    category: 'texture',
    description:
      'Long grains of what was played about four seconds ago, then a faint trace of tape echo behind the playing.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Long memory', params: { size: 992, density: 5.12 } },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 477 } },
    ],
  },
  {
    id: 'soft-pedal-horizon-on-a-weekday',
    name: 'Horizon on a weekday',
    category: 'texture',
    description:
      'A vast space whose tail swells in and hangs a minute or more, into a dark reverb that rises behind each note and lingers.',
    effects: [
      { deviceId: 'expanse', preset: 'Event horizon', params: { decay: 57.7, modRate: 0.135 } },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { time: 2.08, preDelay: 62 } },
    ],
  },
  {
    id: 'soft-pedal-octave-in-the-bass',
    name: 'Octave in the bass',
    category: 'pitch',
    description:
      'A dark octave below held chords, every note shifted cleanly, into a small dark room that is gone in about a second.',
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
    id: 'soft-pedal-annexe-depths',
    name: 'Annexe depths',
    category: 'pitch',
    description:
      'A slow bass shadow of long grains two octaves down, then a wash of three fed-back tape heads that hovers and fades.',
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
      'A dark, smooth half-speed octave under the dry sound, then a plain chorus with a detuned copy towards each side.',
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
      'A muffled half-speed octave below, kept in the centre, then a faint, dull echo with a slow chorus on it.',
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
      'A string pad with a second section an octave above, then a long clear sustain that holds each note for seconds.',
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
      'A blurred half-speed wash an octave down, dull on top, then a held pad that takes seconds to melt into each new chord.',
    effects: [
      { deviceId: 'half-speed', preset: 'Blurred half', params: { length: 502 } },
      { deviceId: 'sustainer', preset: 'Long glide' },
    ],
  },
  {
    id: 'soft-pedal-undertow-in-felt',
    name: 'Undertow in felt',
    category: 'pitch',
    description:
      'A dark, smooth half-speed octave under the dry sound, then a wide echo whose repeats drift slowly in pitch.',
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1340 } },
      { deviceId: 'analog-delay', preset: 'Slow drift' },
    ],
  },
  {
    id: 'soft-pedal-depths-by-one-lamp',
    name: 'Depths by one lamp',
    category: 'pitch',
    description:
      'A slow bass shadow of long grains two octaves down, then a plain echo that is a little darker on each repeat.',
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Two octaves under',
        params: { size: 1340, density: 3.59 },
      },
      {
        deviceId: 'echo-memory',
        preset: 'Plain echo',
        params: { time: 408, reach: 20.3, size: 3.23 },
      },
    ],
  },
  {
    id: 'soft-pedal-dusk-master',
    name: 'Dusk master',
    category: 'master',
    description:
      'A very gentle compressor, then a slightly wider image, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue', params: { attack: 645, release: 3.77 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.65 } },
    ],
  },
  {
    id: 'soft-pedal-back-row-mixdown',
    name: 'Back-row mixdown',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { release: 1.34 } },
    ],
  },
  {
    id: 'soft-pedal-stove-side-finish',
    name: 'Stove-side finish',
    category: 'master',
    description:
      'Light tape-style saturation, then a slow compressor that evens out swells over seconds, then a smooth true-peak ceiling.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 268, release: 2.19 } },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'soft-pedal-pianissimo-mixdown',
    name: 'Pianissimo mixdown',
    category: 'master',
    description:
      'A gentle compressor that draws loud and quiet together, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { gain: 2.44 } },
    ],
  },
  {
    id: 'soft-pedal-overstrung-lacquer',
    name: 'Overstrung lacquer',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a gentle compressor, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.61 } },
    ],
  },
  {
    id: 'soft-pedal-shuttered-master',
    name: 'Shuttered master',
    category: 'master',
    description:
      'A few decibels of soft saturation with the top eased, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.42, gain: -4.53 } },
    ],
  },
  {
    id: 'soft-pedal-mixdown-half-heard',
    name: 'Mixdown half heard',
    category: 'master',
    description:
      'A rumble cut and a small lift of presence, then a parallel compressor that lifts quiet playing and tails, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Keys' },
      { deviceId: 'ambient-comp', preset: 'Lift' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 5.62 } },
    ],
  },
]
