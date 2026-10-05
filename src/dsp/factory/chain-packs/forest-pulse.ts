// Pulse under the Forest: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'forest-pulse-wood-path-horizon',
    name: 'Wood-path horizon',
    category: 'space',
    description:
      'A vast space whose tail swells in and hangs a minute or more, then a big lift of the low end that puts weight under the sound.',
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
      'A slow swell after each silence, opening late in its rise, into a dark reverb stacking octaves and fifths like organ pipes.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { release: 893 } },
      { deviceId: 'shimmer', preset: 'Organ loft', params: { decay: 14.2, predelay: 43.1 } },
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
      'A damped hall of about five seconds, heard from far off, then a parallel compressor that lifts quiet playing and tails.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Far away', params: { lowDecay: 5.02, midDecay: 4.59 } },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 415, release: 2.96 } },
    ],
  },
  {
    id: 'forest-pulse-underfoot-wash',
    name: 'Underfoot wash',
    category: 'space',
    description:
      'The drifting tail of a long reverb with no dry sound, into a plain hall of about four seconds.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Tail alone', params: { decay: 14.5 } },
      { deviceId: 'vowel-reverb', preset: 'Plain hall' },
    ],
  },
  {
    id: 'forest-pulse-choir-in-the-firs',
    name: 'Choir in the firs',
    category: 'space',
    description:
      'A big lift of the low end that puts weight under the sound, into a cathedral whose long tail sings a soft open "ah".',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.09 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { decay: 21, preDelay: 39.2 } },
    ],
  },
  {
    id: 'forest-pulse-underfoot-shade',
    name: 'Underfoot shade',
    category: 'space',
    description:
      'A small dark room that is gone in about a second, into a dark reverb that rises behind each note and lingers.',
    effects: [
      { deviceId: 'expanse', preset: 'Small dark room', params: { decay: 1.26, modRate: 0.786 } },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { time: 2.01, preDelay: 66.6 } },
    ],
  },
  {
    id: 'forest-pulse-plate-after-rain',
    name: 'Plate after rain',
    category: 'space',
    description:
      'Two copies in tune that wander like extra takes, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Drifting', params: { delay: 25.4 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 60.6 } },
    ],
  },
  {
    id: 'forest-pulse-ivy-grown-choir',
    name: 'Ivy-grown choir',
    category: 'space',
    description:
      'A huge hall whose tail hums a soft "oo" for a long while, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Endless oo' },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 51.8, lowDecay: 4.1, midDecay: 2.74 },
      },
    ],
  },
  {
    id: 'forest-pulse-trunk-side-haze',
    name: 'Trunk-side haze',
    category: 'space',
    description:
      'A dark smear of long grains that trails for many seconds, then a trace of dull detuned copies at the edges.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Dark slow smear', params: { time: 1800, size: 498 } },
      { deviceId: 'stereo-detune', preset: 'Faint width' },
    ],
  },
  {
    id: 'forest-pulse-birchbark-choir',
    name: 'Birchbark choir',
    category: 'space',
    description:
      'The whole sound folded to mono, into a huge hall whose tail hums a soft "oo" for a long while.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Mono' },
      { deviceId: 'vowel-reverb', preset: 'Endless oo' },
    ],
  },
  {
    id: 'forest-pulse-windfall-hall',
    name: 'Windfall hall',
    category: 'space',
    description:
      'A vast hall that opens to the sound in very slow waves, then an equaliser that takes presence, air and lows away.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 10.9, breathRate: 0.0537 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'forest-pulse-alder-tunnel',
    name: 'Alder tunnel',
    category: 'space',
    description:
      'Tape-style saturation that rounds only the loudest peaks, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 5.26, modRate: 0.427 } },
    ],
  },
  {
    id: 'forest-pulse-thicket-loop',
    name: 'Thicket loop',
    category: 'echo',
    description:
      'A faint short-lived loop, then a steep dark low-pass, into a dull reverb that swells in over seconds and fades slowly.',
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
      'A short, dull loop at a quarter of the sample rate, then a gentle high cut that shades the top end, into a damped hall.',
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
      'A muffled early-sampler loop, then a half-minute low-pass sweep, into the drifting tail of a long reverb with no dry sound.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Sampler grit', params: { length: 0.996 } },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'bloom-reverb', preset: 'Tail alone' },
    ],
  },
  {
    id: 'forest-pulse-embers-under-a-lid',
    name: 'Embers under a lid',
    category: 'echo',
    description:
      'A bowed swell that lets part of each attack through, then grain repeats that fall an octave and darken each time.',
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
      'A half-speed tape loop that returns an octave down and dull, then grain repeats that fall an octave and darken each time.',
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
      'A tape echo whose warm repeats soften as they fade, then a chorus heard alone, its detuned copies spread hard apart.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats' },
      { deviceId: 'chorus', preset: 'Voices only', params: { rate: 0.358, delayMs: 17.2 } },
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
      'A low, dark tape loop played backwards at half speed, into a cavern built from a rush of short echoes.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards', params: { length: 3.98 } },
      { deviceId: 'swarm-reverb', preset: 'Cavern', params: { length: 0.483, glide: 0.609 } },
    ],
  },
  {
    id: 'forest-pulse-first-light-reel',
    name: 'First-light reel',
    category: 'echo',
    description:
      'A half-speed tape loop, then a swinging resonant low-pass, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down', params: { length: 7.45, mix: 0.3 } },
      {
        deviceId: 'auto-filter',
        preset: 'Dub sweep',
        params: { lfoRateHz: 0.491, envAttackMs: 10.3, envReleaseMs: 219 },
      },
      { deviceId: 'hall-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'forest-pulse-loop-played-slow',
    name: 'Loop played slow',
    category: 'echo',
    description:
      'A half-speed tape loop, then a steep low-pass that removes all above four hundred hertz, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down' },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { lfoRateHz: 0.996, envAttackMs: 11.2, envReleaseMs: 208 },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'forest-pulse-loop-before-dawn',
    name: 'Loop before dawn',
    category: 'echo',
    description:
      'A half-speed loop that plays the last phrase an octave down, into the close reflections of a very small room.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed', params: { length: 2.43 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Short ambience',
        params: { decay: 0.385, breathRate: 0.265 },
      },
    ],
  },
  {
    id: 'forest-pulse-loop-off-the-path',
    name: 'Loop off the path',
    category: 'echo',
    description:
      'A thin, far-off tape loop with its lows cut away, into a dark hall that takes about twenty seconds to die away.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Thin and distant', params: { length: 1.94 } },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0847 } },
    ],
  },
  {
    id: 'forest-pulse-old-growth-loop',
    name: 'Old-growth loop',
    category: 'echo',
    description:
      'A short, muffled loop at an eighth of the sample rate, into a dark reverb that rises behind each note and lingers.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Sampler grit', params: { length: 0.909 } },
      { deviceId: 'shaped-reverb', preset: 'Ghost' },
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
      'A dark, swaying record, then a low, dark tape loop played backwards at half speed, into a huge open valley.',
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
    id: 'forest-pulse-scuffed-record',
    name: 'Scuffed record',
    category: 'tape',
    description:
      'A badly worn record, swaying in pitch under loud crackle, then a slow, dull, worn-out echo with hiss riding on its repeats.',
    effects: [
      { deviceId: 'patina', preset: 'Scratched record' },
      { deviceId: 'analog-delay', preset: 'Noisy clock' },
    ],
  },
  {
    id: 'forest-pulse-dew-wet-record',
    name: 'Dew-wet record',
    category: 'tape',
    description:
      'A well-played old record, then a quarter-speed copy two octaves down under the dry sound, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find', params: { spin: 1.43 } },
      { deviceId: 'half-speed', preset: 'Two octaves' },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 46.9, lowDecay: 4.21, midDecay: 3.31 },
      },
    ],
  },
  {
    id: 'forest-pulse-late-romantic-record',
    name: 'Late-romantic record',
    category: 'tape',
    description:
      'A mid-forward tone with the lows and the top trimmed, then a dusty record, gently warped, with crackle in the groove.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.45 } },
      { deviceId: 'patina', preset: 'Dusty record', params: { output: -2.45 } },
    ],
  },
  {
    id: 'forest-pulse-trunk-side-grit',
    name: 'Trunk-side grit',
    category: 'tape',
    description:
      'Dark, thick valve grit that fills out the low end, then record crackle that ducks under notes and fills the gaps.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit' },
      { deviceId: 'noise-floor', preset: 'Gap crackle', params: { response: 0.635, hold: 9.32 } },
    ],
  },
  {
    id: 'forest-pulse-underfoot-tape',
    name: 'Underfoot tape',
    category: 'tape',
    description:
      'A tape loop that wears thinner and duller on every pass, then a worn-out groove that dulls the top and fuzzes loud highs.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 2.83 } },
      { deviceId: 'vinyl', preset: 'Inner groove', params: { spin: 1.54 } },
    ],
  },
  {
    id: 'forest-pulse-lichen-reel',
    name: 'Lichen reel',
    category: 'tape',
    description:
      'A six-stage phaser turning about every three seconds, then an old slow reel that drifts, dulls, drops out and hisses.',
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.299 } },
      { deviceId: 'tape', preset: 'Worn thin' },
    ],
  },
  {
    id: 'forest-pulse-second-hand-record',
    name: 'Second-hand record',
    category: 'tape',
    description:
      'A tape loop whose passes cross from side to side, then a dark, swaying record, into a dark reverb that rises behind each note and lingers.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Crossing sides', params: { length: 1.39 } },
      { deviceId: 'vinyl', preset: 'Slow platter', params: { spin: 5.45 } },
      { deviceId: 'shaped-reverb', preset: 'Ghost' },
    ],
  },
  {
    id: 'forest-pulse-grey-dawn-sampler',
    name: 'Grey-dawn sampler',
    category: 'tape',
    description:
      'A deep pitch wobble, like a warped tape, then smooth, dull converters with a hiss that rides high notes.',
    effects: [
      { deviceId: 'chorus', preset: 'Warped tape', params: { rate: 1.41, delayMs: 28.7 } },
      { deviceId: 'vintage-digital', preset: 'Jittery' },
    ],
  },
  {
    id: 'forest-pulse-needle-bed-sway',
    name: 'Needle-bed sway',
    category: 'tape',
    description:
      'A warped record through a dark cartridge, swaying slowly, into a reverb that fades evenly to nothing in a second or two.',
    effects: [
      { deviceId: 'vinyl', preset: 'Slow platter', params: { spin: 5.57 } },
      { deviceId: 'shaped-reverb', preset: 'Falling' },
    ],
  },
  {
    id: 'forest-pulse-drizzle-dust',
    name: 'Drizzle dust',
    category: 'tape',
    description:
      'A dusty record, gently warped, with crackle in the groove, then a single saturated tape echo close behind each note.',
    effects: [
      { deviceId: 'patina', preset: 'Dusty record', params: { output: -2.11 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 91.7 } },
    ],
  },
  {
    id: 'forest-pulse-waves-past-a-ridge',
    name: 'Waves past a ridge',
    category: 'motion',
    description:
      'Quick waves of reverb rippling about twice a second, then a dulled, thinned tone, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Ripples' },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.39 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'forest-pulse-fogbound-sweep',
    name: 'Fogbound sweep',
    category: 'motion',
    description:
      'Two dull copies that wander in a haze round the notes, then a deep eight-stage phaser with sharp peaks between notches.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Piano haze', params: { delay: 19 } },
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.196 } },
    ],
  },
  {
    id: 'forest-pulse-mossy-filter',
    name: 'Mossy filter',
    category: 'motion',
    description:
      'A low-pass that opens and closes over about half a minute, into a short diffuse haze around the sound, like a small room.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0319, envAttackMs: 10.1, envReleaseMs: 199 },
      },
      { deviceId: 'spectral-blur', preset: 'Diffuse room', params: { mix: 0.235 } },
    ],
  },
  {
    id: 'forest-pulse-birchbark-tremolo',
    name: 'Birchbark tremolo',
    category: 'motion',
    description:
      'A steady amplifier tremolo, four or five pulses a second, then an equaliser that takes presence, air and lows away, into a damped hall.',
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo' },
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 20.9 } },
    ],
  },
  {
    id: 'forest-pulse-pulse-in-leaf-mould',
    name: 'Pulse in leaf mould',
    category: 'motion',
    description:
      'A chopped half-speed octave, then an equaliser that adds lows and body and eases the top, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'half-speed', preset: 'Slow chops' },
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 35.6 } },
    ],
  },
  {
    id: 'forest-pulse-evergreen-pulse',
    name: 'Evergreen pulse',
    category: 'motion',
    description:
      'A pulse from side to side, then a high cut set low enough to muffle everything, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Moving beat', params: { delay: 41.5, lfoRate: 0.071 } },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.58 } },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 6.61, modRate: 0.356 } },
    ],
  },
  {
    id: 'forest-pulse-undergrowth-pulse',
    name: 'Undergrowth pulse',
    category: 'motion',
    description:
      'A steady pulse about twice a second, crossing side to side, then a mid-forward tone with the lows and the top trimmed, into a far-off hall.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Moving beat', params: { delay: 42.8, lfoRate: 0.0795 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { lowDecay: 5.33, midDecay: 4.49, mix: 0.514 },
      },
    ],
  },
  {
    id: 'forest-pulse-pulse-far-below',
    name: 'Pulse far below',
    category: 'motion',
    description:
      'A half-speed octave below, cut hard about twice a second, into a dark cellar of a room that folds the sound to mono.',
    effects: [
      { deviceId: 'half-speed', preset: 'Slow chops', params: { length: 530 } },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar' },
    ],
  },
  {
    id: 'forest-pulse-treeline-pad',
    name: 'Treeline pad',
    category: 'motion',
    description:
      'A held pad whose every overtone wavers in pitch and level, into a vast blurred hollow that rings for half a minute.',
    effects: [
      { deviceId: 'sustainer', preset: 'Wavering choir', params: { attack: 0.365, glide: 0.608 } },
      { deviceId: 'swarm-reverb', preset: 'Vast hollow', params: { length: 1.14, glide: 0.641 } },
    ],
  },
  {
    id: 'forest-pulse-drizzle-phaser',
    name: 'Drizzle phaser',
    category: 'motion',
    description:
      'A phaser flipping between two tones, opposite on each side, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'phaser', preset: 'Two-tone flip' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'forest-pulse-deepwood-ripples',
    name: 'Deepwood ripples',
    category: 'motion',
    description:
      'Quick waves of reverb rippling about twice a second, into a big muffled cave that rings for about six seconds.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Ripples', params: { time: 0.413 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 5.57, breathRate: 0.277 } },
    ],
  },
  {
    id: 'forest-pulse-phaser-under-leaves',
    name: 'Phaser under leaves',
    category: 'motion',
    description:
      'A deep eight-stage phaser with sharp peaks between notches, into a deep dark well of slow blurred echoes.',
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage' },
      { deviceId: 'swarm-reverb', preset: 'Dark well' },
    ],
  },
  {
    id: 'forest-pulse-wash-among-trunks',
    name: 'Wash among trunks',
    category: 'texture',
    description:
      'A long-hanging wide wash, then a hollow, resonant phaser, into a long dark reverb whose tail sinks slowly in pitch.',
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
      'A slowly dissolving wash, then a four-stage phaser, into a dull reverb that swells in over seconds and fades slowly.',
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
      'A long-hanging wide wash, then a hollow chorus that swells over about ten seconds, into a dark plate whose tail is soft on top.',
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
      'A dark, round pad that melts slowly from chord to chord, then a slowly drifting chorus, into a plate wash that hangs on for half a minute.',
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
      'Sparse stray grains of things played seconds earlier, then muffled tape hiss, steady and thick.',
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
      'A wide fog without lows or highs that hangs for seconds, then muffled tape hiss, steady and thick.',
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
      'A slow bass shadow of long grains two octaves down, then the soft air of an open microphone under the sound.',
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
    id: 'forest-pulse-buried-shadow',
    name: 'Buried shadow',
    category: 'texture',
    description:
      'A slow bass shadow of long grains two octaves down, then recalled moments that mostly come back reversed or slowed.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Two octaves under' },
      { deviceId: 'echo-memory', preset: 'Backwards', params: { reach: 16.6, size: 1.56 } },
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
      'A wide fog without lows or highs that hangs for seconds, then a tape reel with soft saturation, slight wobble and hiss.',
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
      'A swell so late that notes seem to play in reverse, then a wide pad made of the sound with its attacks dissolved.',
    effects: [
      { deviceId: 'swell', preset: 'Backwards', params: { attack: 429, release: 104 } },
      { deviceId: 'spectral-blur', preset: 'Pad from anything' },
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
    id: 'forest-pulse-grey-dawn-bloom',
    name: 'Grey-dawn bloom',
    category: 'texture',
    description:
      'Layers of held chords that bloom slowly and never fade, then a slow record-warp chorus, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow bloom layers' },
      { deviceId: 'vinyl', preset: 'Warp chorus' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'forest-pulse-far-off-wash',
    name: 'Far-off wash',
    category: 'texture',
    description:
      'A long-hanging wide wash, then a chorus on the upper range that leaves the lows steady, into a late-arriving hall.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Endless' },
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { rate: 1.13, delayMs: 13.3 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'forest-pulse-deadfall-tide',
    name: 'Deadfall tide',
    category: 'texture',
    description:
      'A string pad that arrives long after the chord and stays, then a record with loud clicks and a scratch on every turn.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Late tide', params: { rise: 5.68, fall: 19.6 } },
      { deviceId: 'vinyl', preset: 'Locked scratch', params: { spin: 1.45 } },
    ],
  },
  {
    id: 'forest-pulse-unhurried-layers',
    name: 'Unhurried layers',
    category: 'texture',
    description:
      'Earlier phrases that return over and over and slowly gather, into a hint of open space behind the sound.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Gathering' },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
  },
  {
    id: 'forest-pulse-hollow-trunk-pad',
    name: 'Hollow-trunk pad',
    category: 'texture',
    description:
      'A dark string pad that lingers long after each chord, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Lingering' },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 22.2 } },
    ],
  },
  {
    id: 'forest-pulse-deepwood-mist',
    name: 'Deepwood mist',
    category: 'texture',
    description:
      'A diffuse mist where each note hangs on after it is played, into a small room that answers about an eighth of a second late.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist' },
      { deviceId: 'ether-reverb', preset: 'Slap room' },
    ],
  },
  {
    id: 'forest-pulse-reversal-in-wet-bark',
    name: 'Reversal in wet bark',
    category: 'texture',
    description:
      'Phrases that sometimes turn round and play backwards, then an echo that slides down an octave like tape slowed by hand.',
    effects: [
      { deviceId: 'glitch', preset: 'Backwards glances', params: { time: 830 } },
      { deviceId: 'analog-delay', preset: 'Falling tape' },
    ],
  },
  {
    id: 'forest-pulse-pad-at-treeline',
    name: 'Pad at treeline',
    category: 'texture',
    description:
      'A held pad that takes seconds to melt into each new chord, then a badly warped record whose pitch sways once a turn.',
    effects: [
      { deviceId: 'sustainer', preset: 'Long glide' },
      { deviceId: 'vinyl', preset: 'Warped', params: { spin: 1.39 } },
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
      'A soft, deep bass one and two octaves below each note, then a dense, wide fog of grains that buries the dry sound, into a vast nave.',
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
      'A smooth octave-down bed, then a blurred bed of bass that hangs low under the sound, then a dark smear of long grains.',
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
    id: 'forest-pulse-alder-echo',
    name: 'Alder echo',
    category: 'pitch',
    description:
      'Grain repeats that fall an octave and darken each time, then a dark fog of slow backwards swells.',
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
    id: 'forest-pulse-loop-in-the-fog',
    name: 'Loop in the fog',
    category: 'pitch',
    description:
      'A half-speed loop that plays the last phrase an octave down, into a plate heard alone with none of the dry sound left.',
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
      'A dark, smooth half-speed octave under the dry sound, then a ten-stage phaser that takes most of a minute to sweep.',
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
      'Dark voices one and two octaves below the dry sound, into a clean speaker at the far end of a big, echoing room.',
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
      'A wide, slowed copy a fourth below that drifts behind, then a slow echo with a long dark trail as earlier phrases return.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth down drift' },
      { deviceId: 'echo-memory', preset: 'Dark trail' },
    ],
  },
  {
    id: 'forest-pulse-wrong-speed-octave',
    name: 'Wrong-speed octave',
    category: 'pitch',
    description:
      'A late swell on every note like a rocked volume pedal, then a muffled half-speed octave below, kept in the centre.',
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
    id: 'forest-pulse-rhineland-undertow',
    name: 'Rhineland undertow',
    category: 'pitch',
    description:
      'A long half-speed replay, then a slow bass shadow of long grains two octaves down, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'half-speed', preset: 'Long drag' },
      {
        deviceId: 'grain-cloud',
        preset: 'Two octaves under',
        params: { size: 1300, density: 4.11 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 50.3, lowDecay: 3.92, midDecay: 3.23 },
      },
    ],
  },
  {
    id: 'forest-pulse-buried-undertow',
    name: 'Buried undertow',
    category: 'pitch',
    description:
      'Long, dark backwards phrases an octave below the playing, then moments that drop to half speed or wind down to a stop.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Undertow', params: { time: 2180 } },
      { deviceId: 'glitch', preset: 'Winding down' },
    ],
  },
  {
    id: 'forest-pulse-lichen-octave',
    name: 'Lichen octave',
    category: 'pitch',
    description:
      'An unbroken half-speed bed an octave down, with no dry sound, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { length: 2210 } },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.49 } },
    ],
  },
  {
    id: 'forest-pulse-octave-under-moss',
    name: 'Octave under moss',
    category: 'pitch',
    description:
      'A muffled half-speed octave below, kept in the centre, then long slow grains an octave down, most of them reversed.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor' },
      { deviceId: 'grain-cloud', preset: 'Low tide' },
    ],
  },
  {
    id: 'forest-pulse-muffled-blur',
    name: 'Muffled blur',
    category: 'pitch',
    description:
      'A blurred half-speed wash an octave down, dull on top, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'half-speed', preset: 'Blurred half', params: { length: 498 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'forest-pulse-woodland-master',
    name: 'Woodland master',
    category: 'master',
    description:
      'A gentle compressor that draws loud and quiet together, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 99.8, release: 1.79 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.41, gain: 2.43 } },
    ],
  },
  {
    id: 'forest-pulse-leaf-litter-lacquer',
    name: 'Leaf-litter lacquer',
    category: 'master',
    description:
      'A subsonic cut, then a parallel compressor that lifts quiet playing and tails, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master' },
      { deviceId: 'ambient-comp', preset: 'Lift' },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'forest-pulse-second-hand-mixdown',
    name: 'Second-hand mixdown',
    category: 'master',
    description:
      'A rumble cut and a small lift of presence, then a stereo image widened a little, with the bass left central, then a safety limiter.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Keys', params: { clearTime: 1.48 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'forest-pulse-logging-road-master',
    name: 'Logging-road master',
    category: 'master',
    description:
      'A slow compressor that evens out swells over seconds, then a true-peak ceiling that lets go again over several seconds.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 6.4 } },
    ],
  },
  {
    id: 'forest-pulse-alder-finish',
    name: 'Alder finish',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a small dip in the low mids, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ambient-eq', preset: 'Drone' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.67 } },
    ],
  },
  {
    id: 'forest-pulse-lacquer-under-canopy',
    name: 'Lacquer under canopy',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
]
