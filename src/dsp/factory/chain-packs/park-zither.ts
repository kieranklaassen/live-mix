// Park Bench Zither: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'park-zither-tank-under-hammers',
    name: 'Tank under hammers',
    category: 'space',
    description:
      'A hollow three-voice chorus swelling over about ten seconds, into two taut springs that ring long and clean with no drip.',
    effects: [
      { deviceId: 'chorus', preset: 'Hollow swell', params: { rate: 0.0915, delayMs: 9.3 } },
      { deviceId: 'spring-reverb', preset: 'Tight long tank' },
    ],
  },
  {
    id: 'park-zither-springs-fountainside',
    name: 'Springs fountainside',
    category: 'space',
    description:
      'A hollow phaser with peaks where its notches would be, into a two-spring tank with a little chirp and drip.',
    effects: [
      { deviceId: 'phaser', preset: 'Negative notch' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
    ],
  },
  {
    id: 'park-zither-tip-jar-springs',
    name: 'Tip-jar springs',
    category: 'space',
    description:
      'A deep eight-stage phaser with sharp peaks between notches, into a two-spring tank with a little chirp and drip.',
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.191 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
    ],
  },
  {
    id: 'park-zither-springs-in-july',
    name: 'Springs in july',
    category: 'space',
    description:
      'A ten-stage phaser that takes most of a minute to sweep, into a bright spring splash that lands a moment after the note.',
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep' },
      { deviceId: 'spring-reverb', preset: 'Late splash' },
    ],
  },
  {
    id: 'park-zither-chopstick-glass',
    name: 'Chopstick glass',
    category: 'space',
    description:
      'Sixteen ringing strings, then a very short flanger swept nearly down to nothing, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Glass harp', params: { decay: 6.39 } },
      { deviceId: 'flanger', preset: 'Through-zero feel', params: { rate: 0.334, delayMs: 0.815 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 40.1, lowDecay: 2.48, midDecay: 2.99 },
      },
    ],
  },
  {
    id: 'park-zither-marigold-strings',
    name: 'Marigold strings',
    category: 'space',
    description:
      'Sixteen strings in C major that ring for about ten seconds, then a short hollow flanger on negative feedback, into an undamped hall.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Long ring', params: { decay: 9.25 } },
      { deviceId: 'flanger', preset: 'Negative hollow', params: { rate: 0.413, delayMs: 1.44 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air' },
    ],
  },
  {
    id: 'park-zither-noon-strings',
    name: 'Noon strings',
    category: 'space',
    description:
      'Eight sympathetic strings, then a trace of slow four-stage phaser under the dry sound, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Piano pedal', params: { decay: 3.2 } },
      { deviceId: 'phaser', preset: 'Faint shade', params: { rate: 0.146 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { predelayMs: 29 } },
    ],
  },
  {
    id: 'park-zither-strings-in-the-park',
    name: 'Strings in the park',
    category: 'space',
    description:
      'Ten self-tuning strings, then a four-stage phaser, into a medium hall with only a breath of a vowel in its tail.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { decay: 4.48 } },
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.333 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering' },
    ],
  },
  {
    id: 'park-zither-lemonade-strings',
    name: 'Lemonade strings',
    category: 'space',
    description:
      'A wide wash of sixteen long strings in D minor, then a twelve-stage phaser cloud, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor wash' },
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { rate: 0.108 } },
      { deviceId: 'fdn-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'park-zither-unhurried-swell',
    name: 'Unhurried swell',
    category: 'space',
    description:
      'Only the two detuned copies, hard left and right, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wet only' },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 14.4, modRate: 0.294 } },
    ],
  },
  {
    id: 'park-zither-busking-halo',
    name: 'Busking halo',
    category: 'space',
    description:
      "A smooth swell on every note, like a string section's bows, into a brief ring of sixteen strings behind each note.",
    effects: [
      { deviceId: 'swell', preset: 'String section' },
      { deviceId: 'sympathetic', preset: 'Short halo', params: { decay: 0.811 } },
    ],
  },
  {
    id: 'park-zither-park-strings',
    name: 'Park strings',
    category: 'space',
    description:
      'A swell-holding compressor, then sixteen strings that learn the tune and ring on long, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells', params: { attack: 166, release: 5.47 } },
      { deviceId: 'sympathetic', preset: 'Learn and hold' },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'park-zither-open-case-space',
    name: 'Open-case space',
    category: 'space',
    description:
      'A hint of open space behind the sound, then a phaser held still, two fixed peaks like a vowel.',
    effects: [
      { deviceId: 'expanse', preset: 'Faint air' },
      { deviceId: 'phaser', preset: 'Still formant', params: { rate: 0.303 } },
    ],
  },
  {
    id: 'park-zither-footpath-echo',
    name: 'Footpath echo',
    category: 'space',
    description:
      'Only the two detuned copies, hard left and right, into a soft slap close behind each note.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wet only', params: { delay: 16.6 } },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 102, modRate: 0.542 } },
    ],
  },
  {
    id: 'park-zither-cloudless-strings',
    name: 'Cloudless strings',
    category: 'space',
    description:
      'Sixteen strings that learn the tune and ring on long, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Learn and hold' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'park-zither-thumb-piano-strings',
    name: 'Thumb-piano strings',
    category: 'space',
    description:
      'A subsonic cut with the low mids and presence eased a touch, into nine hard-driven strings in E minor that soon fall silent.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone', params: { clearTime: 1.38 } },
      { deviceId: 'sympathetic', preset: 'Hammered', params: { decay: 1.63 } },
    ],
  },
  {
    id: 'park-zither-halo-for-coins',
    name: 'Halo for coins',
    category: 'space',
    description:
      'A tight cluster of tape repeats, like a very small room, into a late reverb that climbs by octaves and fifths.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Tiny room cluster', params: { time: 88.7 } },
      { deviceId: 'shimmer', preset: 'Late answer' },
    ],
  },
  {
    id: 'park-zither-bronze-mist',
    name: 'Bronze mist',
    category: 'space',
    description:
      'A low cut with the low mids dipped and the presence lifted, into a thin bright tail with all its lows cut away.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Voice', params: { clearTime: 1.32 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { decay: 11.9, modRate: 0.223 } },
    ],
  },
  {
    id: 'park-zither-glittering-cascade',
    name: 'Glittering cascade',
    category: 'echo',
    description:
      'A deep eight-stage phaser with sharp peaks between notches, then echoes that jump an octave on every repeat, left and right.',
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.188 } },
      { deviceId: 'lattice', preset: 'Crystal cascade', params: { output: 6 } },
    ],
  },
  {
    id: 'park-zither-clover-echo',
    name: 'Clover echo',
    category: 'echo',
    description:
      'A phaser with no dry sound, pulling the two sides apart, then two tape heads that make every repeat gallop.',
    effects: [
      { deviceId: 'phaser', preset: 'Stereo scatter', params: { rate: 0.278 } },
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 681 } },
    ],
  },
  {
    id: 'park-zither-walls-by-the-gate',
    name: 'Walls by the gate',
    category: 'echo',
    description:
      'A six-stage phaser turning about every three seconds, then a space that answers in hard separate echoes.',
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.272 } },
      { deviceId: 'expanse', preset: 'Hard echoes', params: { decay: 4.11, modRate: 0.422 } },
    ],
  },
  {
    id: 'park-zither-thumb-piano-strum',
    name: 'Thumb-piano strum',
    category: 'echo',
    description:
      'A phaser with no dry sound, pulling the two sides apart, then the start of each note struck again in a bouncing run.',
    effects: [
      { deviceId: 'phaser', preset: 'Stereo scatter' },
      { deviceId: 'cascade', preset: 'Restruck', params: { time: 540 } },
    ],
  },
  {
    id: 'park-zither-echo-under-leaves',
    name: 'Echo under leaves',
    category: 'echo',
    description:
      'A six-stage phaser turning about every three seconds, then a bucket-brigade echo with a slow chorus on its repeats.',
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.311 } },
      { deviceId: 'analog-delay', preset: 'Chorused' },
    ],
  },
  {
    id: 'park-zither-wide-open-drift',
    name: 'Wide-open drift',
    category: 'echo',
    description:
      'A combo amp in a room, then a wide echo whose repeats drift slowly in pitch, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room' },
      { deviceId: 'analog-delay', preset: 'Slow drift', params: { time: 612, modRate: 0.0969 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 14.7 } },
    ],
  },
  {
    id: 'park-zither-bandshell-waves',
    name: 'Bandshell waves',
    category: 'echo',
    description:
      'A fast reel with no hiss, driven hard so peaks are squashed, then quick waves of reverb rippling about twice a second.',
    effects: [
      { deviceId: 'tape', preset: 'Hot glue' },
      { deviceId: 'shaped-reverb', preset: 'Ripples', params: { time: 0.399 } },
    ],
  },
  {
    id: 'park-zither-soap-bubble-echo',
    name: 'Soap-bubble echo',
    category: 'echo',
    description:
      'Two copies in tune that wander like extra takes, then a bucket-brigade echo with a slow chorus on its repeats.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Drifting', params: { delay: 22 } },
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 287, modRate: 0.842 } },
    ],
  },
  {
    id: 'park-zither-echo-at-noon',
    name: 'Echo at noon',
    category: 'echo',
    description:
      "A smooth swell on every note, like a string section's bows, then an echo whose repeats hop up a fifth and down a fourth.",
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 334, release: 656 } },
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { time: 295, modRate: 0.659 } },
    ],
  },
  {
    id: 'park-zither-glad-slap',
    name: 'Glad slap',
    category: 'echo',
    description:
      'A short, soft tape echo close behind the playing, then two unison doubles snapped to pitch, hard left and right.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 155 } },
      { deviceId: 'lattice', preset: 'Tuned double', params: { v1Delay: 15.9, v2Delay: 25.4 } },
    ],
  },
  {
    id: 'park-zither-bronze-echo',
    name: 'Bronze echo',
    category: 'echo',
    description:
      'Three tape heads in a row, a cluster on every repeat, then a combo amplifier heard from the far side of a big room.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads' },
      { deviceId: 're-amp', preset: 'Down the hall' },
    ],
  },
  {
    id: 'park-zither-railing-echo',
    name: 'Railing echo',
    category: 'echo',
    description:
      'A plain echo rebuilt from grains, straight and centred, into a space whose tail flutters quickly in pitch.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Plain repeat' },
      { deviceId: 'expanse', preset: 'Fast flutter', params: { decay: 4.44, modRate: 4.53 } },
    ],
  },
  {
    id: 'park-zither-echo-on-the-path',
    name: 'Echo on the path',
    category: 'echo',
    description:
      'Three tape heads in a row, a cluster on every repeat, then grain repeats that climb by fifths on every pass.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads' },
      { deviceId: 'grain-delay', preset: 'Rising fifths', params: { time: 580, size: 151 } },
    ],
  },
  {
    id: 'park-zither-downtown-memory',
    name: 'Downtown memory',
    category: 'echo',
    description:
      'Short moments of the last few seconds, replayed as they were, into twelve strings in A minor that ring with notes in that key.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Just now', params: { time: 277, size: 0.851 } },
      { deviceId: 'sympathetic', preset: 'Minor strings' },
    ],
  },
  {
    id: 'park-zither-bandshell-hop',
    name: 'Bandshell hop',
    category: 'echo',
    description:
      'An echo whose repeats jump up an octave and back, into a big muffled cave that rings for about six seconds.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { time: 412, modRate: 0.655 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave' },
    ],
  },
  {
    id: 'park-zither-crystals-on-a-bench',
    name: 'Crystals on a bench',
    category: 'echo',
    description:
      'Grain repeats that climb an octave on every pass, into a bright wide chamber that is over in about a second.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals', params: { time: 307, size: 126 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'park-zither-trace-in-daylight',
    name: 'Trace in daylight',
    category: 'echo',
    description:
      'A faint trace of tape echo behind the playing, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 439 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 53.4, lowDecay: 7.97, midDecay: 1.8 },
      },
    ],
  },
  {
    id: 'park-zither-open-air-harp',
    name: 'Open-air harp',
    category: 'echo',
    description:
      'Each note answered by a rising pentatonic run of echoes, then a low cut and a small dip in the low mids, to make room.',
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Pentatonic harp',
        params: { v1Delay: 151, v2Delay: 290, v3Delay: 372, v4Delay: 477, output: 5.79 },
      },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'park-zither-straw-hat-bounce',
    name: 'Straw-hat bounce',
    category: 'echo',
    description:
      'A long tail that wavers in pitch like an unsteady choir, then dotted tape repeats that bounce from side to side.',
    effects: [
      { deviceId: 'expanse', preset: 'Seasick choir', params: { decay: 16.2, modRate: 1.49 } },
      { deviceId: 'tape-echo', preset: 'Dotted bounce' },
    ],
  },
  {
    id: 'park-zither-ladder-in-the-grass',
    name: 'Ladder in the grass',
    category: 'echo',
    description:
      'Each note replayed as an arpeggio of octaves and fifths, into three springs heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'cascade', preset: 'Rising steps', params: { time: 259 } },
      { deviceId: 'spring-reverb', preset: 'Tank alone' },
    ],
  },
  {
    id: 'park-zither-stoop-loop',
    name: 'Stoop loop',
    category: 'tape',
    description:
      'A one-second tape loop that soon dies away, then a slow reel whose pitch sways widely and never settles.',
    effects: [
      { deviceId: 'tape-loop', preset: 'One second round' },
      { deviceId: 'tape', preset: 'Seasick' },
    ],
  },
  {
    id: 'park-zither-reel-in-the-park',
    name: 'Reel in the park',
    category: 'tape',
    description:
      'A tape reel with soft saturation, slight wobble and hiss, then grain repeats that climb by fifths on every pass.',
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'grain-delay', preset: 'Rising fifths', params: { time: 576, size: 143 } },
    ],
  },
  {
    id: 'park-zither-brownstone-drift',
    name: 'Brownstone drift',
    category: 'tape',
    description:
      'A four-stage phaser kept high, leaving the low end alone, then a drifting reel laid half against the dry sound, a chorus.',
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.355 } },
      { deviceId: 'tape', preset: 'Drifting chorus' },
    ],
  },
  {
    id: 'park-zither-tape-under-hammers',
    name: 'Tape under hammers',
    category: 'tape',
    description:
      'A gentle flanger sweep about four seconds round, then a fresh reel of tape, open on top and nearly steady.',
    effects: [
      { deviceId: 'flanger', preset: 'Gentle sweep', params: { rate: 0.238, delayMs: 2.7 } },
      { deviceId: 'patina', preset: 'New tape' },
    ],
  },
  {
    id: 'park-zither-thumb-piano-reel',
    name: 'Thumb-piano reel',
    category: 'tape',
    description:
      'A tape reel pushed hard into thick saturation, then a fast, steady reel pushed into soft saturation.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'tape', preset: 'Mastering deck', params: { output: -2.36 } },
    ],
  },
  {
    id: 'park-zither-flagstone-reel',
    name: 'Flagstone reel',
    category: 'tape',
    description:
      'A slow comb sliding against the dry sound, sides opposed, then a clean pass over fast new tape, with nothing added.',
    effects: [
      { deviceId: 'tremolo', preset: 'Drifting comb' },
      { deviceId: 'tape', preset: 'Clean transfer', params: { output: 2.02 } },
    ],
  },
  {
    id: 'park-zither-downtown-flutter',
    name: 'Downtown flutter',
    category: 'tape',
    description:
      'A slow reel that trembles fast, mixed against the dry sound, into a bright spring splash that lands a moment after the note.',
    effects: [
      { deviceId: 'tape', preset: 'Flutter shimmer' },
      { deviceId: 'spring-reverb', preset: 'Late splash', params: { decay: 1.08, predelay: 196 } },
    ],
  },
  {
    id: 'park-zither-phaser-cross-legged',
    name: 'Phaser cross-legged',
    category: 'motion',
    description:
      'A slow phaser swirl, then a steady tape echo with no wobble, dirt or dulling, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl' },
      { deviceId: 'tape-echo', preset: 'Clean and steady', params: { time: 429 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'park-zither-stone-arch-phaser',
    name: 'Stone-arch phaser',
    category: 'motion',
    description:
      'A phaser swirl about a quarter of a minute round, then a clean steady echo, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl' },
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 195, modRate: 0.671 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'park-zither-phaser-at-a-stroll',
    name: 'Phaser at a stroll',
    category: 'motion',
    description:
      'A phaser with no dry sound, pulling the two sides apart, then a short, soft tape echo close behind the playing, into a bright plate.',
    effects: [
      { deviceId: 'phaser', preset: 'Stereo scatter', params: { rate: 0.232 } },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 154 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 5.15 } },
    ],
  },
  {
    id: 'park-zither-wire-brush-phaser',
    name: 'Wire-brush phaser',
    category: 'motion',
    description:
      'A hollow phaser with peaks where its notches would be, then a thinning tape echo, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'phaser', preset: 'Negative notch', params: { rate: 0.239 } },
      { deviceId: 'tape-echo', preset: 'Thin and fading' },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'park-zither-sprinkler-swirl',
    name: 'Sprinkler swirl',
    category: 'motion',
    description:
      'A four-stage phaser, then a tape echo whose warm repeats soften as they fade, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.317 } },
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { time: 386 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'park-zither-battery-amp-phaser',
    name: 'Battery-amp phaser',
    category: 'motion',
    description:
      'A climbing phaser, then a soft slap close behind each note, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'phaser', preset: 'Saw riser' },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 84.6, modRate: 0.603 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.313 } },
    ],
  },
  {
    id: 'park-zither-pawn-shop-drift',
    name: 'Pawn-shop drift',
    category: 'motion',
    description:
      'A deep flanger that takes most of a minute to cross, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'flanger', preset: 'Glacial drift' },
      { deviceId: 'ether-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'park-zither-brushed-flanger',
    name: 'Brushed flanger',
    category: 'motion',
    description:
      'A trace of short flanger, opposite on the two sides, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'flanger', preset: 'Faint air', params: { rate: 0.134, delayMs: 0.996 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Vast nave',
        params: { preDelay: 92.2, lowDecay: 7.38, midDecay: 7.78 },
      },
    ],
  },
  {
    id: 'park-zither-sweep-cross-legged',
    name: 'Sweep cross-legged',
    category: 'motion',
    description:
      'A very short flanger swept nearly down to nothing, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'flanger', preset: 'Through-zero feel', params: { rate: 0.296, delayMs: 0.726 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'park-zither-strings-in-june',
    name: 'Strings in june',
    category: 'motion',
    description:
      'A wide string pad that never stops shifting and shimmering, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Restless', params: { rise: 0.454, fall: 6.44 } },
      { deviceId: 'plate-reverb', preset: 'Long plate' },
    ],
  },
  {
    id: 'park-zither-park-chorus',
    name: 'Park chorus',
    category: 'motion',
    description:
      'A deep slow chorus on a long delay, swaying over seconds, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.144 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'park-zither-cut-grass-phaser',
    name: 'Cut-grass phaser',
    category: 'motion',
    description:
      'A trace of slow four-stage phaser under the dry sound, into a short reverb that swells in just after each note.',
    effects: [
      { deviceId: 'phaser', preset: 'Faint shade', params: { rate: 0.151 } },
      { deviceId: 'expanse', preset: 'Quick swell' },
    ],
  },
  {
    id: 'park-zither-speaker-after-lunch',
    name: 'Speaker after lunch',
    category: 'motion',
    description:
      'A rotating speaker on its slow speed, then a gentle flanger sweep about four seconds round.',
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'flanger', preset: 'Gentle sweep', params: { rate: 0.281, delayMs: 2.45 } },
    ],
  },
  {
    id: 'park-zither-midday-spiral',
    name: 'Midday spiral',
    category: 'motion',
    description:
      'A resonant comb that seems to climb without end, into a hint of a two-spring tank behind the sound.',
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Barber pole',
        params: { delay: 10.5, lfoRate: 0.0815, mix: 0.3 },
      },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.072 } },
    ],
  },
  {
    id: 'park-zither-cut-grass-wash',
    name: 'Cut-grass wash',
    category: 'motion',
    description:
      'A long slow flanger, nearly a chorus, opposite on each side, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'flanger', preset: 'Wide wash', params: { rate: 0.163, delayMs: 7.81 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'park-zither-chess-table-flanger',
    name: 'Chess-table flanger',
    category: 'motion',
    description:
      'A shallow flanger that ramps and snaps back in a steady beat, into three long springs that chirp and drip.',
    effects: [
      { deviceId: 'flanger', preset: 'Tremolo saw', params: { rate: 1.91, delayMs: 2.93 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { decay: 4.86 } },
    ],
  },
  {
    id: 'park-zither-hopscotch-wobble',
    name: 'Hopscotch wobble',
    category: 'motion',
    description:
      'Echoes that creep sharp on the left and flat on the right, then a short echo whose pitch sways like a seasick vibrato.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Split sky' },
      { deviceId: 'analog-delay', preset: 'Seasick' },
    ],
  },
  {
    id: 'park-zither-ensemble-by-the-arch',
    name: 'Ensemble by the arch',
    category: 'motion',
    description:
      'A thick three-voice ensemble chorus that turns slowly, into a small room that sparkles two octaves above the sound.',
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble' },
      { deviceId: 'shimmer', preset: 'Sparkle room', params: { decay: 1.22, predelay: 18.8 } },
    ],
  },
  {
    id: 'park-zither-cloudless-cabinet',
    name: 'Cloudless cabinet',
    category: 'motion',
    description:
      'A slow rotating speaker heard through one microphone, then a deep slow chorus on a long delay, swaying over seconds.',
    effects: [
      { deviceId: 'rotary', preset: 'Mono cabinet' },
      { deviceId: 'chorus', preset: 'Deep sea' },
    ],
  },
  {
    id: 'park-zither-chorus-by-the-pond',
    name: 'Chorus by the pond',
    category: 'motion',
    description:
      'Soft clipping, mixed low, then a three-voice chorus that leaves the lows dry and steady, into a far-off plate haze.',
    effects: [
      { deviceId: 'saturator', preset: 'Drum bus crunch' },
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { rate: 1.24, delayMs: 12.3 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'park-zither-pocket-comb',
    name: 'Pocket comb',
    category: 'motion',
    description:
      'A valve preamp curve, lopsided and a little brighter on top, then a climbing comb, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp' },
      { deviceId: 'flanger', preset: 'Rising comb', params: { rate: 0.223 } },
      { deviceId: 'plate-reverb', preset: 'Long plate' },
    ],
  },
  {
    id: 'park-zither-barefoot-chorus',
    name: 'Barefoot chorus',
    category: 'motion',
    description:
      'A honky horn loudspeaker heard from far across a big room, then a three-voice chorus spread wide across the sides.',
    effects: [
      { deviceId: 're-amp', preset: 'Station platform', params: { output: 7.66 } },
      { deviceId: 'chorus', preset: 'Wide chorus', params: { rate: 0.872, delayMs: 10.9 } },
    ],
  },
  {
    id: 'park-zither-swirl-on-the-lawn',
    name: 'Swirl on the lawn',
    category: 'motion',
    description:
      'A four-stage phaser kept high, leaving the low end alone, into a vast reverb where most of the tail climbs by octaves.',
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.33 } },
      { deviceId: 'shimmer', preset: 'Endless ascent' },
    ],
  },
  {
    id: 'park-zither-shirtsleeve-flanger',
    name: 'Shirtsleeve flanger',
    category: 'motion',
    description:
      'A short hollow flanger on negative feedback, then a clean steady echo, into three long springs that chirp and drip.',
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow', params: { rate: 0.369, delayMs: 1.49 } },
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 200, modRate: 0.631 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { decay: 4.25 } },
    ],
  },
  {
    id: 'park-zither-flanger-in-the-open',
    name: 'Flanger in the open',
    category: 'motion',
    description:
      'A long flanger with strong feedback, diving slowly, into a hall whose tail sways in pitch with a trace of the octave.',
    effects: [
      { deviceId: 'flanger', preset: 'Deep dive', params: { rate: 0.0954, delayMs: 7.65 } },
      { deviceId: 'shimmer', preset: 'Swaying hall' },
    ],
  },
  {
    id: 'park-zither-picnic-tremolo',
    name: 'Picnic tremolo',
    category: 'motion',
    description:
      'A steady amplifier tremolo, about four pulses a second, then a plain echo that is a little darker on each repeat.',
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo' },
      {
        deviceId: 'echo-memory',
        preset: 'Plain echo',
        params: { time: 356, reach: 20.5, size: 2.95 },
      },
    ],
  },
  {
    id: 'park-zither-pinwheel-drift',
    name: 'Pinwheel drift',
    category: 'motion',
    description:
      'A slow phasing drift from partials moved less than a hertz, into a bright chamber that rings for a couple of seconds.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift' },
      { deviceId: 'expanse', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'park-zither-lunch-hour-spiral',
    name: 'Lunch-hour spiral',
    category: 'motion',
    description:
      'A swell that arrives late, so notes seem to play in reverse, then a resonant comb that seems to climb without end.',
    effects: [
      { deviceId: 'swell', preset: 'Backwards', params: { attack: 394, release: 88.4 } },
      { deviceId: 'freq-shifter', preset: 'Barber pole', params: { delay: 11, lfoRate: 0.0863 } },
    ],
  },
  {
    id: 'park-zither-heat-haze-sunrise',
    name: 'Heat-haze sunrise',
    category: 'texture',
    description:
      'A slow swell after each silence that opens only at the end, into a bright chamber that rings for a couple of seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1370, release: 880 } },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { decay: 2.33, modRate: 0.653 } },
    ],
  },
  {
    id: 'park-zither-swell-in-the-open',
    name: 'Swell in the open',
    category: 'texture',
    description:
      'A short swell that rounds the front off every note, then a sharp copy on the left and a flat one on the right.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 172, release: 89.3 } },
      { deviceId: 'stereo-detune', preset: 'Classic' },
    ],
  },
  {
    id: 'park-zither-open-case-glide',
    name: 'Open-case glide',
    category: 'texture',
    description:
      'A held pad that takes seconds to melt into each new chord, then a jet-plane flanger sweep with a sharper comb.',
    effects: [
      { deviceId: 'sustainer', preset: 'Long glide', params: { attack: 1.37 } },
      { deviceId: 'flanger', preset: 'Classic jet', params: { rate: 0.24, delayMs: 2.35 } },
    ],
  },
  {
    id: 'park-zither-dappled-shimmer',
    name: 'Dappled shimmer',
    category: 'texture',
    description:
      'Grains fed back an octave up, climbing higher each pass, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Rising shimmer', params: { size: 332, density: 10.7 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 3.74, breathRate: 0.282 } },
    ],
  },
  {
    id: 'park-zither-strings-in-july',
    name: 'Strings in july',
    category: 'texture',
    description:
      'A wide string pad that never stops shifting and shimmering, then a big lift of presence and air, with ringing held in check.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Restless' },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { clearTime: 0.553 } },
    ],
  },
  {
    id: 'park-zither-brushed-wash',
    name: 'Brushed wash',
    category: 'texture',
    description:
      'A smeared wash of grains that climbs by octaves, then an echo whose repeats jump up an octave and back.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Shimmer wash' },
      { deviceId: 'analog-delay', preset: 'Octave hop' },
    ],
  },
  {
    id: 'park-zither-hold-by-hand',
    name: 'Hold by hand',
    category: 'texture',
    description:
      'A long clean sustain, then a hollow three-voice chorus swelling over about ten seconds, into an undamped hall.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Long clean hold' },
      { deviceId: 'chorus', preset: 'Hollow swell' },
      {
        deviceId: 'hall-reverb',
        preset: 'Bright hall',
        params: { preDelay: 41.7, lowDecay: 1.92, midDecay: 2.96 },
      },
    ],
  },
  {
    id: 'park-zither-midday-afterglow',
    name: 'Midday afterglow',
    category: 'texture',
    description:
      'A short glow of held tone that dies just after each note, into a hard-driven two-spring tank that answers late and loud.',
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Brief afterglow',
        params: { attack: 0.0286, glide: 0.0327, mix: 0.3 },
      },
      { deviceId: 'spring-reverb', preset: 'Dub send', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'park-zither-cloud-after-lunch',
    name: 'Cloud after lunch',
    category: 'texture',
    description:
      'A very slow swell, then a scattered cloud of short grains behind the playing, into a small tank that goes on ringing for seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Glacier' },
      { deviceId: 'grain-delay', preset: 'Grain cloud' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Small bright tank',
        params: { decay: 6.19, breathRate: 0.289 },
      },
    ],
  },
  {
    id: 'park-zither-sparkle-for-pigeons',
    name: 'Sparkle for pigeons',
    category: 'texture',
    description:
      'A soft wash of octave and fifth loops over each note, into the close reflections of a very small room.',
    effects: [
      { deviceId: 'cascade', preset: 'Sparkle bed', params: { time: 357 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'park-zither-crystals-under-trees',
    name: 'Crystals under trees',
    category: 'pitch',
    description:
      'Grain repeats that climb an octave on every pass, then a six-stage phaser turning about every three seconds.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals', params: { time: 381, size: 110 } },
      { deviceId: 'phaser', preset: 'Warm six-stage' },
    ],
  },
  {
    id: 'park-zither-high-wire-fifth',
    name: 'High-wire fifth',
    category: 'pitch',
    description:
      'A quiet fifth and octave above the line, a touch late, then a deep slow chorus on a long delay, swaying over seconds.',
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Quiet fifth halo',
        params: { v1Delay: 41.6, v2Delay: 80.2, output: 5.65 },
      },
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.142 } },
    ],
  },
  {
    id: 'park-zither-open-tuned-halo',
    name: 'Open-tuned halo',
    category: 'pitch',
    description:
      'High octaves that fade in late above each note, then a trace of chorus on the top of the sound only.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow halo', params: { attack: 0.65 } },
      { deviceId: 'chorus', preset: 'Faint air' },
    ],
  },
  {
    id: 'park-zither-dappled-fifths',
    name: 'Dappled fifths',
    category: 'pitch',
    description:
      'A wide, slightly detuned fifth above held chords, then three voices drifting over a cycle of about twelve seconds.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad fifth', params: { size: 64.5 } },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },
  {
    id: 'park-zither-harmony-an-octave-up',
    name: 'Harmony an octave up',
    category: 'pitch',
    description:
      'A volume-pedal swell, then a single voice a fifth above the dry sound, into a small tank that goes on ringing for seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 257, release: 165 } },
      { deviceId: 'pitch-shifter', preset: 'Fifth above', params: { size: 62.2 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank' },
    ],
  },
  {
    id: 'park-zither-strings-aglitter',
    name: 'Strings aglitter',
    category: 'pitch',
    description:
      'A detuned octave above each note, like doubled strings, then each note replayed as an arpeggio of octaves and fifths.',
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string' },
      { deviceId: 'cascade', preset: 'Rising steps' },
    ],
  },
  {
    id: 'park-zither-loop-on-brick',
    name: 'Loop on brick',
    category: 'pitch',
    description:
      'A double-speed tape loop, an octave up and thin, then a rumble cut and a single decibel of presence.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Octave up ghosts' },
      { deviceId: 'ambient-eq', preset: 'Keys', params: { clearTime: 1.45 } },
    ],
  },
  {
    id: 'park-zither-eyes-closed-glass',
    name: 'Eyes-closed glass',
    category: 'pitch',
    description:
      'A compressor as slow as a hand on a fader, then a bright, thin pad an octave up that follows closely.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader' },
      { deviceId: 'pad-follower', preset: 'Glassy', params: { rise: 0.142, fall: 2.25 } },
    ],
  },
  {
    id: 'park-zither-plane-tree-stack',
    name: 'Plane-tree stack',
    category: 'pitch',
    description:
      'Little loops of each note stacked one and two octaves up, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'cascade', preset: 'Octave stack' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { predelayMs: 92.2 } },
    ],
  },
  {
    id: 'park-zither-chess-table-drone',
    name: 'Chess-table drone',
    category: 'pitch',
    description:
      'A swell that fades every note in like a bow stroke, then copies of each note re-pitched to a fixed C and the G below.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed' },
      { deviceId: 'lattice', preset: 'Two note drone', params: { output: 7.96 } },
    ],
  },
  {
    id: 'park-zither-kite-flying-hall',
    name: 'Kite-flying hall',
    category: 'master',
    description:
      'A faint hall tail of about three seconds, then a fast limiter pushed so that soft and loud notes even out.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'park-zither-straw-hat-console',
    name: 'Straw-hat console',
    category: 'master',
    description:
      'A hot console channel, then a parallel compressor that lifts quiet playing and tails, then a low, breathing ceiling.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Hot channel' },
      { deviceId: 'ambient-comp', preset: 'Lift' },
      {
        deviceId: 'ambient-limiter',
        preset: 'Breathing',
        params: { release: 0.335, gain: -0.427 },
      },
    ],
  },
  {
    id: 'park-zither-zither-glow',
    name: 'Zither glow',
    category: 'master',
    description:
      'A lopsided soft curve that adds the octave above each note, then a gentle compressor, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { release: 1.91 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 5.28, gain: 2.62 } },
    ],
  },
  {
    id: 'park-zither-deck-by-hand',
    name: 'Deck by hand',
    category: 'master',
    description:
      'A fast, steady reel pushed into soft saturation, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -5.88 } },
    ],
  },
  {
    id: 'park-zither-park-bench-sheen',
    name: 'Park-bench sheen',
    category: 'master',
    description:
      'Bright tape-style saturation mixed in under the clean sound, then a scooped, hollow tone, then a pushed limiter.',
    effects: [
      { deviceId: 'saturator', preset: 'Parallel shine' },
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.34 } },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'park-zither-glue-for-pigeons',
    name: 'Glue for pigeons',
    category: 'master',
    description:
      'A scooped, hollow tone, then a fast, firm compressor that stops only the peaks, then a ceiling with a wide margin.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow' },
      { deviceId: 'ambient-comp', preset: 'Peak stop', params: { release: 0.181 } },
      { deviceId: 'ambient-limiter', preset: 'Margin', params: { release: 1.38 } },
    ],
  },
  {
    id: 'park-zither-fountain-glue',
    name: 'Fountain glue',
    category: 'master',
    description:
      'A low cut with some air, then a gentle compressor, then a true-peak ceiling with the level pushed up into it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.67 } },
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 87.6, release: 2.17 } },
      { deviceId: 'ambient-limiter', preset: 'Loud' },
    ],
  },
]
