// Pulse under the Forest: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'forest-pulse-alder-depths',
    name: 'Alder depths',
    category: 'space',
    description:
      'A compressor as slow as a hand on a fader, then a large reverb whose tail sinks an octave on every pass, into a slow tide of reverb.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader' },
      { deviceId: 'shimmer', preset: 'Undertow', params: { decay: 11.6, predelay: 18.5 } },
      { deviceId: 'shaped-reverb', preset: 'Slow tide', params: { time: 3.85 } },
    ],
  },
  {
    id: 'forest-pulse-fog-off-the-path',
    name: 'Fog off the path',
    category: 'space',
    description:
      'A huge slow wash that swells in and hangs with no dry sound, then detuned copies of the highs only, the body left as it was.',
    effects: [
      { deviceId: 'expanse', preset: 'Wash alone', params: { decay: 42.3, modRate: 0.108 } },
      { deviceId: 'stereo-detune', preset: 'Top only' },
    ],
  },
  {
    id: 'forest-pulse-tunnel-in-the-firs',
    name: 'Tunnel in the firs',
    category: 'space',
    description:
      'A phaser held still, two fixed peaks like a vowel, into a narrow mono shaft of echoes that rings for seconds.',
    effects: [
      { deviceId: 'phaser', preset: 'Still formant' },
      { deviceId: 'swarm-reverb', preset: 'Mine shaft' },
    ],
  },
  {
    id: 'forest-pulse-drizzle-hum',
    name: 'Drizzle hum',
    category: 'space',
    description:
      'A dull closed-mouth hum of deep voices behind the sound, into a vast space whose tail swells in and hangs a minute or more.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Humming', params: { decay: 10.4, preDelay: 18.9 } },
      { deviceId: 'expanse', preset: 'Event horizon', params: { decay: 57.2, modRate: 0.134 } },
    ],
  },
  {
    id: 'forest-pulse-deepwood-rise',
    name: 'Deepwood rise',
    category: 'space',
    description:
      'A reverb that rises backwards for about four seconds, then a heavy low shelf that puts weight under the sound.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Long rise' },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'forest-pulse-wood-path-horizon',
    name: 'Wood-path horizon',
    category: 'space',
    description:
      'A vast space whose tail swells in and hangs a minute or more, then a heavy low shelf that puts weight under the sound.',
    effects: [
      { deviceId: 'expanse', preset: 'Event horizon', params: { decay: 59.2, modRate: 0.158 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.76 } },
    ],
  },
  {
    id: 'forest-pulse-bark-brown-loft',
    name: 'Bark-brown loft',
    category: 'space',
    description:
      'A slow swell after each silence that opens only at the end, into a large dark reverb stacking octaves and fifths like pipes.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { release: 893 } },
      { deviceId: 'shimmer', preset: 'Organ loft', params: { decay: 14.2, predelay: 43.1 } },
    ],
  },
  {
    id: 'forest-pulse-pinewood-well',
    name: 'Pinewood well',
    category: 'space',
    description:
      'A steep low-pass at four hundred hertz, the top gone, then a dark mono cellar, into a deep dark well of slow blurred echoes.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { lfoRateHz: 0.956, envAttackMs: 9.14, envReleaseMs: 191 },
      },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { decay: 3.35, mix: 0.24 } },
      {
        deviceId: 'swarm-reverb',
        preset: 'Dark well',
        params: { length: 1.01, glide: 0.543, mix: 0.27 },
      },
    ],
  },
  {
    id: 'forest-pulse-first-light-hall',
    name: 'First-light hall',
    category: 'space',
    description:
      'A gentle low-pass at a kilohertz, then a short gated reverb, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { lfoRateHz: 1.06, envAttackMs: 10.2, envReleaseMs: 221 },
      },
      { deviceId: 'shaped-reverb', preset: 'Gated' },
      { deviceId: 'ether-reverb', preset: 'Dark infinite' },
    ],
  },
  {
    id: 'forest-pulse-lichen-crypt',
    name: 'Lichen crypt',
    category: 'space',
    description:
      'A few decibels of soft saturation with the top eased, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: -3.14 } },
      { deviceId: 'expanse', preset: 'Low cathedral' },
    ],
  },
  {
    id: 'forest-pulse-owl-hour-wash',
    name: 'Owl-hour wash',
    category: 'space',
    description:
      'A high cut set low enough to muffle everything, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled' },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { mix: 0.191 } },
    ],
  },
  {
    id: 'forest-pulse-root-tangle-hall',
    name: 'Root-tangle hall',
    category: 'space',
    description:
      'A hall heard from far off with little dry sound left, then a parallel compressor that lifts quiet playing and tails.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Far away', params: { lowDecay: 5.02, midDecay: 4.59 } },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 415, release: 2.96 } },
    ],
  },
  {
    id: 'forest-pulse-strings-at-treeline',
    name: 'Strings at treeline',
    category: 'space',
    description:
      'A phaser held still, two fixed peaks like a vowel, into a faint ring of six strings in A major.',
    effects: [
      { deviceId: 'phaser', preset: 'Still formant', params: { rate: 0.281 } },
      { deviceId: 'sympathetic', preset: 'Faint ring' },
    ],
  },
  {
    id: 'forest-pulse-logging-road-breath',
    name: 'Logging-road breath',
    category: 'space',
    description:
      'A tape preamp driven for thick lows and a dull top, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 8.58, breathRate: 0.212 } },
    ],
  },
  {
    id: 'forest-pulse-grey-dawn-pool',
    name: 'Grey-dawn pool',
    category: 'echo',
    description:
      'A wide muffled loop, then a swinging resonant low-pass, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Underwater', params: { length: 2.32, mix: 0.24 } },
      { deviceId: 'auto-filter', preset: 'Dub sweep' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'forest-pulse-thicket-loop',
    name: 'Thicket loop',
    category: 'echo',
    description:
      'A faint short-lived loop, then a steep low-pass at four hundred hertz, the top gone, into a slow dark swell.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Faint bed', params: { length: 1.65 } },
      { deviceId: 'auto-filter', preset: 'Low-pass gate' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'forest-pulse-loop-in-leaf-mould',
    name: 'Loop in leaf mould',
    category: 'echo',
    description:
      'A dull quarter-rate loop, then a gentle high cut that shades the top end, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Lo-fi quarter', params: { length: 1.49 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 19.3 } },
    ],
  },
  {
    id: 'forest-pulse-overcast-sampler',
    name: 'Overcast sampler',
    category: 'echo',
    description:
      'A dull eighth-rate loop, then a glacial low-pass, into the drifting tail of a long reverb with no dry sound.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Sampler grit', params: { length: 0.996 } },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'bloom-reverb', preset: 'Tail alone' },
    ],
  },
  {
    id: 'forest-pulse-larch-sides',
    name: 'Larch sides',
    category: 'echo',
    description:
      'A tape loop whose passes cross from side to side, then a steep dark low-pass, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Crossing sides', params: { length: 1.46 } },
      { deviceId: 'auto-filter', preset: 'Low-pass gate' },
      {
        deviceId: 'ether-reverb',
        preset: 'Dark infinite',
        params: { predelayMs: 53.2, mix: 0.189 },
      },
    ],
  },
  {
    id: 'forest-pulse-fall-among-trunks',
    name: 'Fall among trunks',
    category: 'echo',
    description:
      'An echo that slides down an octave like tape slowed by hand, into a small dark room that is gone in about a second.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Falling tape', params: { time: 443, modRate: 0.293 } },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'forest-pulse-dusk-wood-echo',
    name: 'Dusk-wood echo',
    category: 'echo',
    description:
      'A slow echo with a long dark trail and a few recollections, then a low cut and a small dip in the low mids, to make room.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Dark trail' },
      { deviceId: 'ambient-eq', preset: 'Layer', params: { clearTime: 1.66 } },
    ],
  },
  {
    id: 'forest-pulse-embers-under-a-lid',
    name: 'Embers under a lid',
    category: 'echo',
    description:
      'A bowed swell at half strength under the dry attacks, then grain repeats that fall an octave each time, darkening.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 313, release: 157 } },
      { deviceId: 'grain-delay', preset: 'Falling embers' },
    ],
  },
  {
    id: 'forest-pulse-slowed-reel',
    name: 'Slowed reel',
    category: 'echo',
    description:
      'A tape loop at half speed, an octave down and darker, then grain repeats that fall an octave each time, darkening.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down' },
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { time: 464, size: 234 } },
    ],
  },
  {
    id: 'forest-pulse-ivy-grown-repeats',
    name: 'Ivy-grown repeats',
    category: 'echo',
    description:
      'A tape echo whose warm repeats soften as they fade, then three detuned voices spread hard apart with no dry sound.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats' },
      { deviceId: 'chorus', preset: 'Voices only', params: { rate: 0.358, delayMs: 17.2 } },
    ],
  },
  {
    id: 'forest-pulse-deadfall-bounce',
    name: 'Deadfall bounce',
    category: 'echo',
    description:
      'A deep eight-stage phaser with sharp peaks between notches, then a plain echo whose repeats bounce from side to side.',
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.175 } },
      {
        deviceId: 'echo-memory',
        preset: 'Side to side',
        params: { time: 346, reach: 20.2, size: 3.13 },
      },
    ],
  },
  {
    id: 'forest-pulse-fourths-before-dawn',
    name: 'Fourths before dawn',
    category: 'echo',
    description:
      'Grain repeats that sink by fourths on every pass, into a long dark reverb whose tail sinks slowly in pitch.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling fourths', params: { time: 496, size: 197 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark' },
    ],
  },
  {
    id: 'forest-pulse-reel-in-woodsmoke',
    name: 'Reel in woodsmoke',
    category: 'echo',
    description:
      'A half-speed tape loop in reverse, low and dark, into a rush of short echoes that piles up into a cavern.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards', params: { length: 3.98 } },
      { deviceId: 'swarm-reverb', preset: 'Cavern', params: { length: 0.483, glide: 0.609 } },
    ],
  },
  {
    id: 'forest-pulse-needle-bed-groove',
    name: 'Needle-bed groove',
    category: 'tape',
    description:
      'A well-played record, dulled, swaying, with ticks and pops, then a slowed fifth below, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find' },
      { deviceId: 'half-speed', preset: 'Fifth down bed' },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'forest-pulse-damp-bark-crackle',
    name: 'Damp-bark crackle',
    category: 'tape',
    description:
      'A dusty, ticking record, then a thin half-speed shadow, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'vinyl', preset: 'Dust and scratches', params: { spin: 1.48 } },
      { deviceId: 'half-speed', preset: 'Thin shadow', params: { length: 1640 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite' },
    ],
  },
  {
    id: 'forest-pulse-under-canopy-crackle',
    name: 'Under-canopy crackle',
    category: 'tape',
    description:
      'A dusty, ticking record, then a slowed fifth below, into a cave whose echoes bend slowly up and down in pitch.',
    effects: [
      { deviceId: 'vinyl', preset: 'Dust and scratches', params: { spin: 1.4 } },
      { deviceId: 'half-speed', preset: 'Fifth down bed' },
      { deviceId: 'swarm-reverb', preset: 'Bending' },
    ],
  },
  {
    id: 'forest-pulse-lidded-record',
    name: 'Lidded record',
    category: 'tape',
    description:
      'A warped record through a dark cartridge, swaying slowly, then a half-speed tape loop in reverse, low and dark, into a huge open valley.',
    effects: [
      { deviceId: 'vinyl', preset: 'Slow platter', params: { spin: 4.82 } },
      { deviceId: 'tape-loop', preset: 'Slow backwards', params: { length: 4.29 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 9.32, predelayMs: 134, breathRate: 0.328 },
      },
    ],
  },
  {
    id: 'forest-pulse-crackle-under-leaves',
    name: 'Crackle under leaves',
    category: 'tape',
    description:
      'A flat, unworn record under a thick bed of crackle, then a half-speed tape loop in reverse, low and dark, then a dark smear of long grains.',
    effects: [
      { deviceId: 'vinyl', preset: 'Crackle bed' },
      { deviceId: 'tape-loop', preset: 'Slow backwards', params: { length: 4.26 } },
      { deviceId: 'grain-delay', preset: 'Dark slow smear', params: { time: 1440 } },
    ],
  },
  {
    id: 'forest-pulse-sway-in-drizzle',
    name: 'Sway in drizzle',
    category: 'tape',
    description:
      'A backwards loop, then a warped record through a dark cartridge, swaying slowly, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Reverse bed', params: { length: 3.22 } },
      { deviceId: 'vinyl', preset: 'Slow platter' },
      { deviceId: 'fdn-reverb', preset: 'Open valley' },
    ],
  },
  {
    id: 'forest-pulse-clock-under-moss',
    name: 'Clock under moss',
    category: 'tape',
    description:
      'A half-speed loop, then smooth, dull converters whose clock is badly unsteady, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed', params: { length: 2.29 } },
      { deviceId: 'vintage-digital', preset: 'Jittery' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 13.4 } },
    ],
  },
  {
    id: 'forest-pulse-rain-soaked-crackle',
    name: 'Rain-soaked crackle',
    category: 'tape',
    description:
      'A flat, unworn record under a thick bed of crackle, then the surface noise and crackle of an old record.',
    effects: [
      { deviceId: 'vinyl', preset: 'Crackle bed' },
      { deviceId: 'noise-floor', preset: 'Old record', params: { response: 0.41, hold: 8.63 } },
    ],
  },
  {
    id: 'forest-pulse-record-under-canopy',
    name: 'Record under canopy',
    category: 'tape',
    description:
      'A dusty record, gently warped, with crackle in the groove, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 'patina', preset: 'Dusty record' },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 5.62, modRate: 0.396 } },
    ],
  },
  {
    id: 'forest-pulse-needle-bed-slowdown',
    name: 'Needle-bed slowdown',
    category: 'tape',
    description:
      'Moments that drop to half speed or wind down to a stop, then a dark low-pass that each note nudges open a moment late.',
    effects: [
      { deviceId: 'glitch', preset: 'Winding down', params: { time: 617 } },
      {
        deviceId: 'auto-filter',
        preset: 'Soft bloom',
        params: { lfoRateHz: 0.88, envAttackMs: 115, envReleaseMs: 914 },
      },
    ],
  },
  {
    id: 'forest-pulse-leafless-sampler',
    name: 'Leafless sampler',
    category: 'tape',
    description:
      'A short loop at an eighth of the sample rate, dull and plain, then an equaliser that adds lows and body and eases the top.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Sampler grit', params: { length: 1.06 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.41 } },
    ],
  },
  {
    id: 'forest-pulse-dew-wet-record',
    name: 'Dew-wet record',
    category: 'tape',
    description:
      'A hollow phaser with peaks where its notches would be, then a new record with a little surface hiss and fine crackle.',
    effects: [
      { deviceId: 'phaser', preset: 'Negative notch' },
      { deviceId: 'vinyl', preset: 'New pressing', params: { spin: 1.59 } },
    ],
  },
  {
    id: 'forest-pulse-scuffed-record',
    name: 'Scuffed record',
    category: 'tape',
    description:
      'A badly worn record, swaying in pitch under loud crackle, then a slow, dull echo from a worn-out bucket-brigade line.',
    effects: [
      { deviceId: 'patina', preset: 'Scratched record' },
      { deviceId: 'analog-delay', preset: 'Noisy clock' },
    ],
  },
  {
    id: 'forest-pulse-owl-hour-crackle',
    name: 'Owl-hour crackle',
    category: 'tape',
    description:
      'A slow dark-trailing echo, then a record thick with dust, ticking and popping throughout, then a hovering tape wash.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Dark trail',
        params: { time: 996, reach: 26.6, size: 4.97 },
      },
      { deviceId: 'vinyl', preset: 'Dust and scratches' },
      { deviceId: 'tape-echo', preset: 'Hovering wash' },
    ],
  },
  {
    id: 'forest-pulse-beat-on-old-wax',
    name: 'Beat on old wax',
    category: 'motion',
    description:
      'A steady beat about twice a second, crossing side to side, then a heavy low shelf, into a plate heard alone with none of the dry sound left.',
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Moving beat',
        params: { delay: 45.8, lfoRate: 0.0785, mix: 0.3 },
      },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.86 } },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'forest-pulse-damp-bark-chops',
    name: 'Damp-bark chops',
    category: 'motion',
    description:
      'Half-speed chops, then a dark low-pass that each note nudges open a moment late, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'half-speed', preset: 'Slow chops' },
      {
        deviceId: 'auto-filter',
        preset: 'Soft bloom',
        params: { lfoRateHz: 0.88, envAttackMs: 129, envReleaseMs: 839 },
      },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 59.2 } },
    ],
  },
  {
    id: 'forest-pulse-old-growth-beat',
    name: 'Old-growth beat',
    category: 'motion',
    description:
      'A beat crossing the sides, then a gentle low-pass at a kilohertz, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Moving beat' },
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { lfoRateHz: 1.11, envAttackMs: 10.8, envReleaseMs: 221 },
      },
      { deviceId: 'expanse', preset: 'Low cathedral' },
    ],
  },
  {
    id: 'forest-pulse-chops-far-below',
    name: 'Chops far below',
    category: 'motion',
    description:
      'Half-speed chops, then a high cut set low enough to muffle everything, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'half-speed', preset: 'Slow chops', params: { length: 562 } },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.41 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 16.1 } },
    ],
  },
  {
    id: 'forest-pulse-waves-past-a-ridge',
    name: 'Waves past a ridge',
    category: 'motion',
    description:
      'Quick waves of reverb rippling about twice a second, then an equaliser that takes presence, air and lows away, into a far-off plate haze.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Ripples' },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.39 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'forest-pulse-under-moss-pan',
    name: 'Under-moss pan',
    category: 'motion',
    description:
      'A slow pan from side to side, a few seconds each way, into a small chapel with a short sung eh in its tail.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.151 } },
      { deviceId: 'vowel-reverb', preset: 'Chapel', params: { decay: 1.41, preDelay: 5.07 } },
    ],
  },
  {
    id: 'forest-pulse-birchbark-chop',
    name: 'Birchbark chop',
    category: 'motion',
    description:
      'A square tremolo that switches the sound hard on and off, into a huge slow wash that swells in and hangs with no dry sound.',
    effects: [
      { deviceId: 'tremolo', preset: 'On and off', params: { rate: 1.6 } },
      { deviceId: 'expanse', preset: 'Wash alone' },
    ],
  },
  {
    id: 'forest-pulse-flea-market-sway',
    name: 'Flea-market sway',
    category: 'motion',
    description:
      'A long tail that wavers in pitch like an unsteady choir, then a chorused echo, into a big muffled cave that rings for about six seconds.',
    effects: [
      { deviceId: 'expanse', preset: 'Seasick choir', params: { decay: 19.7, modRate: 1.76 } },
      { deviceId: 'analog-delay', preset: 'Chorused' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 6.38, breathRate: 0.292 } },
    ],
  },
  {
    id: 'forest-pulse-phaser-in-the-firs',
    name: 'Phaser in the firs',
    category: 'motion',
    description:
      'A low-pass that opens and closes over about half a minute, then a phaser flipping between two tones, opposite on each side.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0269, envReleaseMs: 224 },
      },
      { deviceId: 'phaser', preset: 'Two-tone flip' },
    ],
  },
  {
    id: 'forest-pulse-root-tangle-notch',
    name: 'Root-tangle notch',
    category: 'motion',
    description:
      'A single notch drifting slowly up and down the spectrum, into a vast blurred hollow that rings for half a minute.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Slow notch',
        params: { lfoRateHz: 0.156, envReleaseMs: 202 },
      },
      { deviceId: 'swarm-reverb', preset: 'Vast hollow' },
    ],
  },
  {
    id: 'forest-pulse-fogbound-sweep',
    name: 'Fogbound sweep',
    category: 'motion',
    description:
      'Two dull copies that wander, a haze round the notes, then a deep eight-stage phaser with sharp peaks between notches.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Piano haze', params: { delay: 19 } },
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.196 } },
    ],
  },
  {
    id: 'forest-pulse-tremolo-in-the-fog',
    name: 'Tremolo in the fog',
    category: 'motion',
    description:
      'A subsonic cut and a slow ear that eases whatever rings on, then a steady amplifier tremolo, about four pulses a second.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master' },
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 4.34 } },
    ],
  },
  {
    id: 'forest-pulse-wash-among-trunks',
    name: 'Wash among trunks',
    category: 'texture',
    description:
      'A long-hanging wide wash, then a hollow peaking phaser, into a long dark reverb whose tail sinks slowly in pitch.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Endless' },
      { deviceId: 'phaser', preset: 'Negative notch', params: { mix: 0.3 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.36 } },
    ],
  },
  {
    id: 'forest-pulse-wash-from-far-off',
    name: 'Wash from far off',
    category: 'texture',
    description:
      'A wide, darkened wash in which every note slowly dissolves, then a four-stage phaser, into a slow dark swell.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve' },
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.268 } },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'forest-pulse-mycelium-horizon',
    name: 'Mycelium horizon',
    category: 'texture',
    description:
      'A long-hanging wide wash, then a hollow three-voice chorus swelling over about ten seconds, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Endless' },
      { deviceId: 'chorus', preset: 'Hollow swell', params: { rate: 0.112, delayMs: 8.44 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'forest-pulse-ivy-grown-drone',
    name: 'Ivy-grown drone',
    category: 'texture',
    description:
      'A dark slow-melting bed, then three voices drifting over a cycle of about twelve seconds, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 1.05, glide: 2.24 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.083, delayMs: 26 } },
      {
        deviceId: 'plate-reverb',
        preset: 'Endless wash',
        params: { predelayMs: 62.9, mix: 0.266 },
      },
    ],
  },
  {
    id: 'forest-pulse-unhurried-drone',
    name: 'Unhurried drone',
    category: 'texture',
    description:
      'A dark slow-melting bed, then a shallow three-voice chorus that thickens above the lows, into a dark, very long hall.',
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 1.06, glide: 2.26 } },
      { deviceId: 'chorus', preset: 'Vocal thickener', params: { rate: 0.417 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Endless tail',
        params: { decay: 18.1, breathRate: 0.0826 },
      },
    ],
  },
  {
    id: 'forest-pulse-leaf-mould-swell',
    name: 'Leaf-mould swell',
    category: 'texture',
    description:
      'Long slow grains an octave down, most of them reversed, then the soft air of an open microphone under the sound.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { size: 857, density: 5.03 } },
      { deviceId: 'noise-floor', preset: 'Close mic', params: { response: 0.369, hold: 10.8 } },
    ],
  },
  {
    id: 'forest-pulse-old-growth-echoes',
    name: 'Old-growth echoes',
    category: 'texture',
    description:
      'Sparse stray grains of things played seconds earlier, then muffled tape hiss with its top taken off, steady and thick.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Stray memories' },
      { deviceId: 'noise-floor', preset: 'Muffled hiss', params: { response: 0.387, hold: 11.8 } },
    ],
  },
  {
    id: 'forest-pulse-woodland-fog',
    name: 'Woodland fog',
    category: 'texture',
    description:
      'A wide fog kept to the middle band, hanging for seconds, then muffled tape hiss with its top taken off, steady and thick.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Band of fog' },
      { deviceId: 'noise-floor', preset: 'Muffled hiss' },
    ],
  },
  {
    id: 'forest-pulse-treeline-undertow',
    name: 'Treeline undertow',
    category: 'texture',
    description:
      'Long sparse grains two octaves down, a slow bass shadow, then the soft air of an open microphone under the sound.',
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Two octaves under',
        params: { size: 1280, density: 4.04 },
      },
      { deviceId: 'noise-floor', preset: 'Close mic' },
    ],
  },
  {
    id: 'forest-pulse-trunk-side-rumble',
    name: 'Trunk-side rumble',
    category: 'texture',
    description:
      'A low blurred bed under the sound, nothing above the bass, then a worn record through a dark, dull cartridge.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Sub bed', params: { mix: 0.15 } },
      { deviceId: 'vinyl', preset: 'Dull stylus', params: { spin: 1.42 } },
    ],
  },
  {
    id: 'forest-pulse-buried-shadow',
    name: 'Buried shadow',
    category: 'texture',
    description:
      'Long sparse grains two octaves down, a slow bass shadow, then recalled moments that mostly come back reversed or slowed.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Two octaves under' },
      { deviceId: 'echo-memory', preset: 'Backwards', params: { reach: 16.6, size: 1.56 } },
    ],
  },
  {
    id: 'forest-pulse-grains-in-a-clearing',
    name: 'Grains in a clearing',
    category: 'texture',
    description:
      'A scattered cloud of short grains behind the playing, then a flat, unworn record under a thick bed of crackle.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Grain cloud', params: { time: 232, size: 75.6 } },
      { deviceId: 'vinyl', preset: 'Crackle bed', params: { spin: 1.48 } },
    ],
  },
  {
    id: 'forest-pulse-lidded-afterglow',
    name: 'Lidded afterglow',
    category: 'texture',
    description:
      'A dark string pad that lingers long after each chord, then two copies in tune that wander like extra takes, into a hall with long lows.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Lingering' },
      { deviceId: 'stereo-detune', preset: 'Drifting' },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 56.9, lowDecay: 7.33, midDecay: 2.07 },
      },
    ],
  },
  {
    id: 'forest-pulse-strings-between-firs',
    name: 'Strings between firs',
    category: 'texture',
    description:
      'A dark string pad doubled an octave below the playing, then an equaliser that takes presence, air and lows away.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Low section' },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.46 } },
    ],
  },
  {
    id: 'forest-pulse-larch-smear',
    name: 'Larch smear',
    category: 'texture',
    description:
      'A smear of long overlapping grains, half of them reversed, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Slow smear' },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 15.3, modRate: 0.289 } },
    ],
  },
  {
    id: 'forest-pulse-hemlock-wash',
    name: 'Hemlock wash',
    category: 'texture',
    description:
      'A dark, bassy wash that hangs under the notes for seconds, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.36 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 7.12, breathRate: 0.185, mix: 0.3 },
      },
    ],
  },
  {
    id: 'forest-pulse-rhineland-mist',
    name: 'Rhineland mist',
    category: 'texture',
    description:
      'A wide fog kept to the middle band, hanging for seconds, then a tape reel with soft saturation, slight wobble and hiss.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Band of fog' },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
    ],
  },
  {
    id: 'forest-pulse-forest-floor-wash',
    name: 'Forest-floor wash',
    category: 'texture',
    description:
      'A swell that arrives late, so notes seem to play in reverse, then a wide pad made of the sound with its attacks dissolved.',
    effects: [
      { deviceId: 'swell', preset: 'Backwards', params: { attack: 429, release: 104 } },
      { deviceId: 'spectral-blur', preset: 'Pad from anything' },
    ],
  },
  {
    id: 'forest-pulse-bramble-wash',
    name: 'Bramble wash',
    category: 'texture',
    description:
      'A wide, darkened wash in which every note slowly dissolves, into a long dark reverb whose tail sinks slowly in pitch.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.461 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.36 } },
    ],
  },
  {
    id: 'forest-pulse-beechwood-wash',
    name: 'Beechwood wash',
    category: 'texture',
    description:
      'A seconds-long swell, then a diffuse mist where each note hangs on after it is played, into a huge open valley.',
    effects: [
      { deviceId: 'swell', preset: 'Tide' },
      { deviceId: 'spectral-blur', preset: 'Hanging mist' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 9.63, predelayMs: 126, breathRate: 0.292 },
      },
    ],
  },
  {
    id: 'forest-pulse-mossy-glue',
    name: 'Mossy glue',
    category: 'texture',
    description:
      'A deep, slow compressor that lifts a quiet bed and holds it, into one slow scatter of echoes over about a second and no tail.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Drone bed', params: { makeup: 7.26 } },
      { deviceId: 'swarm-reverb', preset: 'Long scatter' },
    ],
  },
  {
    id: 'forest-pulse-haze-in-a-thicket',
    name: 'Haze in a thicket',
    category: 'texture',
    description:
      'A diffuse mist where each note hangs on after it is played, into a tight chamber close round the sound for about a second.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.301 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.12 } },
    ],
  },
  {
    id: 'forest-pulse-bark-brown-pad',
    name: 'Bark-brown pad',
    category: 'texture',
    description:
      'A held pad that swells in slowly like bowed strings, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings', params: { attack: 2.2, glide: 1.34 } },
      { deviceId: 'expanse', preset: 'Open space' },
    ],
  },
  {
    id: 'forest-pulse-drift-in-a-thicket',
    name: 'Drift in a thicket',
    category: 'pitch',
    description:
      'A drifting fourth below, then softly blurred attacks, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth down drift' },
      { deviceId: 'spectral-blur', preset: 'Softened attacks' },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 14.9, modRate: 0.287 } },
    ],
  },
  {
    id: 'forest-pulse-fogbound-bass',
    name: 'Fogbound bass',
    category: 'pitch',
    description:
      'A soft bass two octaves below, and a little one octave below, then a dense, wide fog of grains that buries the dry sound, into a vast nave.',
    effects: [
      { deviceId: 'octaves', preset: 'Deep' },
      { deviceId: 'grain-cloud', preset: 'Thick fog' },
      {
        deviceId: 'hall-reverb',
        preset: 'Vast nave',
        params: { preDelay: 96, lowDecay: 7.56, mix: 0.383 },
      },
    ],
  },
  {
    id: 'forest-pulse-late-autumn-octave',
    name: 'Late-autumn octave',
    category: 'pitch',
    description:
      'A smooth octave-down bed, then a low blurred bed, then a dark smear of long grains that trails for many seconds.',
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave' },
      { deviceId: 'spectral-blur', preset: 'Sub bed' },
      { deviceId: 'grain-delay', preset: 'Dark slow smear', params: { time: 1730, size: 449 } },
    ],
  },
  {
    id: 'forest-pulse-fir-wood-grains',
    name: 'Fir-wood grains',
    category: 'pitch',
    description:
      'Grains a fifth down, then a cloud of backwards grains close behind the playing, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down grains' },
      { deviceId: 'grain-cloud', preset: 'Backwards room' },
      { deviceId: 'expanse', preset: 'Low cathedral' },
    ],
  },
  {
    id: 'forest-pulse-leaf-litter-drag',
    name: 'Leaf-litter drag',
    category: 'pitch',
    description:
      'A long half-speed drag, then a diffuse mist where each note hangs on after it is played, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'half-speed', preset: 'Long drag' },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.27 } },
    ],
  },
  {
    id: 'forest-pulse-alder-echo',
    name: 'Alder echo',
    category: 'pitch',
    description:
      'Grain repeats that fall an octave each time, darkening, then a dark fog of slow backwards swells.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { time: 464, size: 210 } },
      { deviceId: 'reverse-delay', preset: 'Dark fog' },
    ],
  },
  {
    id: 'forest-pulse-salon-fifth',
    name: 'Salon fifth',
    category: 'pitch',
    description:
      'A slowed copy a fifth below, running on beside the dry sound, then a warped record through a dark cartridge, swaying slowly.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down bed' },
      { deviceId: 'vinyl', preset: 'Slow platter', params: { spin: 4.56 } },
    ],
  },
  {
    id: 'forest-pulse-reel-in-wet-bark',
    name: 'Reel in wet bark',
    category: 'pitch',
    description:
      'A half-speed replay an octave down, with no dry sound, then a low blurred bed under the sound, nothing above the bass.',
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed' },
      { deviceId: 'spectral-blur', preset: 'Sub bed', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'forest-pulse-clearing-octaves',
    name: 'Clearing octaves',
    category: 'pitch',
    description:
      'A quarter-speed copy two octaves down under the dry sound, into a dark cellar of a room that folds the sound to mono.',
    effects: [
      { deviceId: 'half-speed', preset: 'Two octaves', params: { length: 1610 } },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { decay: 2.93 } },
    ],
  },
  {
    id: 'forest-pulse-loop-in-the-fog',
    name: 'Loop in the fog',
    category: 'pitch',
    description:
      'A loop of the last phrase at half speed, an octave down, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'forest-pulse-fogbound-undertow',
    name: 'Fogbound undertow',
    category: 'pitch',
    description:
      'A dark half-speed octave kept low under the dry sound, then a ten-stage phaser that takes most of a minute to sweep.',
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1150 } },
      { deviceId: 'phaser', preset: 'Glacial sweep' },
    ],
  },
  {
    id: 'forest-pulse-leafless-depths',
    name: 'Leafless depths',
    category: 'pitch',
    description:
      'Dark voices one and two octaves below the dry sound, into a clean speaker at the far end of a big, live room.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Two octaves', params: { size: 136 } },
      { deviceId: 're-amp', preset: 'Far end of the hall' },
    ],
  },
  {
    id: 'forest-pulse-spruce-octave',
    name: 'Spruce octave',
    category: 'pitch',
    description:
      'A rounded octave below every note of a chord, then a tape reel with soft saturation, slight wobble and hiss.',
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { output: -2.76 } },
    ],
  },
  {
    id: 'forest-pulse-resin-drift',
    name: 'Resin drift',
    category: 'pitch',
    description:
      'A wide, slowed copy a fourth below that drifts behind, then a slow echo with a long dark trail and a few recollections.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth down drift' },
      { deviceId: 'echo-memory', preset: 'Dark trail' },
    ],
  },
  {
    id: 'forest-pulse-late-romantic-pedals',
    name: 'Late-romantic pedals',
    category: 'pitch',
    description:
      'Deep pedal notes two octaves down that swell in slowly, then a muffled pad with all its top taken off, slow to fade.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals' },
      { deviceId: 'pad-follower', preset: 'Felted pad', params: { rise: 0.888, fall: 11.8 } },
    ],
  },
  {
    id: 'forest-pulse-wrong-speed-octave',
    name: 'Wrong-speed octave',
    category: 'pitch',
    description:
      'A swell that stays low and arrives late, like a rocked pedal, then a muffled half-speed octave below, all lows, in the middle.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 249, release: 156 } },
      { deviceId: 'half-speed', preset: 'Muffled floor', params: { length: 2070 } },
    ],
  },
  {
    id: 'forest-pulse-bracken-undertow',
    name: 'Bracken undertow',
    category: 'pitch',
    description:
      'Whole phrases dragged out at half speed, an octave down, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'half-speed', preset: 'Long drag' },
      { deviceId: 'expanse', preset: 'Bloom' },
    ],
  },
  {
    id: 'forest-pulse-loop-in-a-clearing',
    name: 'Loop in a clearing',
    category: 'pitch',
    description:
      'A loop of the last phrase at half speed, an octave down, then ten-bit converters on a shaky clock, dull, with riding hiss.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed', params: { length: 2.23 } },
      { deviceId: 'vintage-digital', preset: 'Dusty' },
    ],
  },
  {
    id: 'forest-pulse-grit-in-leaf-mould',
    name: 'Grit in leaf mould',
    category: 'master',
    description:
      'Dark, thick valve grit, then a mid-forward tone, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit' },
      { deviceId: 'ambient-eq', preset: 'Forward' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -7.48 } },
    ],
  },
  {
    id: 'forest-pulse-underfoot-coil',
    name: 'Underfoot coil',
    category: 'master',
    description:
      'A low, warm transformer, then a parallel compressor, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 389, release: 3.23 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming' },
    ],
  },
  {
    id: 'forest-pulse-rain-soaked-coil',
    name: 'Rain-soaked coil',
    category: 'master',
    description:
      'A low-heavy transformer, then a slow compressor that evens out swells over seconds, then a ceiling with a wide margin.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 278, release: 2.11 } },
      { deviceId: 'ambient-limiter', preset: 'Margin' },
    ],
  },
  {
    id: 'forest-pulse-lichen-booth',
    name: 'Lichen booth',
    category: 'master',
    description:
      'A small dead booth that is gone almost at once, then a fast limiter that steps in only on the loudest peaks.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Small booth' },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'forest-pulse-drizzle-coil',
    name: 'Drizzle coil',
    category: 'master',
    description:
      'A low-heavy transformer, then a very gentle compressor, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'ambient-comp', preset: 'Glue', params: { attack: 626, release: 4.19 } },
      { deviceId: 'fet-limiter', preset: 'Light touch', params: { outputGain: -5.46 } },
    ],
  },
  {
    id: 'forest-pulse-trace-in-the-fog',
    name: 'Trace in the fog',
    category: 'master',
    description:
      'A faint hall tail of about three seconds, then a true-peak ceiling that eases long swells down first.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 39.9, lowDecay: 2.79, midDecay: 2.74 },
      },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
]
