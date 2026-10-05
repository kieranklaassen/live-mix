// Park Bench Zither: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'park-zither-springs-fountainside',
    name: 'Springs fountainside',
    category: 'space',
    description:
      'A hollow peaking phaser that turns about every four seconds, into a two-spring tank with a little chirp and drip.',
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
    id: 'park-zither-unhurried-swell',
    name: 'Unhurried swell',
    category: 'space',
    description:
      'A sharp copy hard left, a flat one hard right, heard alone, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wet only' },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 14.4, modRate: 0.294 } },
    ],
  },
  {
    id: 'park-zither-halo-for-coins',
    name: 'Halo for coins',
    category: 'space',
    description:
      'A tight cluster of tape repeats, like a very small room, into a reverb that comes in late and climbs by octaves and fifths.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Tiny room cluster', params: { time: 88.7 } },
      { deviceId: 'shimmer', preset: 'Late answer' },
    ],
  },
  {
    id: 'park-zither-vault-for-hours',
    name: 'Vault for hours',
    category: 'space',
    description:
      'A slow swell on only the first note after each silence, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'swell', preset: 'First note only' },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { predelayMs: 43.2, mix: 0.252 } },
    ],
  },
  {
    id: 'park-zither-kite-flying-springs',
    name: 'Kite-flying springs',
    category: 'space',
    description:
      'A four-stage phaser kept high, leaving the low end alone, into two taut springs that ring long and clean with no drip.',
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.373 } },
      { deviceId: 'spring-reverb', preset: 'Tight long tank', params: { decay: 5.37 } },
    ],
  },
  {
    id: 'park-zither-springs-on-the-path',
    name: 'Springs on the path',
    category: 'space',
    description:
      'A thick ensemble chorus turning about every two seconds, into three long springs that chirp and drip.',
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble' },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { decay: 4.3 } },
    ],
  },
  {
    id: 'park-zither-dandelion-halo',
    name: 'Dandelion halo',
    category: 'space',
    description:
      'Sixteen strings in C major that ring for about ten seconds, then a six-stage phaser, into a hint of open space behind the sound.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Long ring' },
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.31 } },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
  },
  {
    id: 'park-zither-busking-halo',
    name: 'Busking halo',
    category: 'space',
    description:
      'Nine hard-driven strings in E minor that soon fall silent, then a four-stage phaser, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Hammered', params: { decay: 1.37 } },
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.304 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 37.9 } },
    ],
  },
  {
    id: 'park-zither-weekend-halo',
    name: 'Weekend halo',
    category: 'space',
    description:
      'Ten strings that tune themselves to the notes they hear, then a slow phaser swirl, into a driven spring tank.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { decay: 4.38 } },
      { deviceId: 'phaser', preset: 'Slow swirl' },
      { deviceId: 'spring-reverb', preset: 'Dub send' },
    ],
  },
  {
    id: 'park-zither-lemonade-ring',
    name: 'Lemonade ring',
    category: 'space',
    description:
      'A wide wash of sixteen long strings in D minor, then a deep flanger that sweeps right up through the top, into an undamped hall.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor wash', params: { decay: 8.75 } },
      { deviceId: 'flanger', preset: 'Through-zero feel' },
      {
        deviceId: 'hall-reverb',
        preset: 'Bright hall',
        params: { preDelay: 43.8, lowDecay: 1.97, midDecay: 2.82 },
      },
    ],
  },
  {
    id: 'park-zither-glad-ring',
    name: 'Glad ring',
    category: 'space',
    description:
      'Twelve strings in A minor that ring with notes in that key, then a jet flanger sweep, into a driven spring tank.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { decay: 3.57 } },
      { deviceId: 'flanger', preset: 'Classic jet', params: { rate: 0.225, delayMs: 2.67 } },
      { deviceId: 'spring-reverb', preset: 'Dub send', params: { decay: 2.72, predelay: 61.3 } },
    ],
  },
  {
    id: 'park-zither-open-air-hall',
    name: 'Open-air hall',
    category: 'space',
    description:
      'An undamped hall of about three seconds with light lows, then a scooped tone with lows and highs up and the body down.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Bright hall',
        params: { preDelay: 41.7, lowDecay: 2.02, midDecay: 3.14 },
      },
      { deviceId: 'ambient-eq', preset: 'Hollow' },
    ],
  },
  {
    id: 'park-zither-halo-under-hammers',
    name: 'Halo under hammers',
    category: 'space',
    description:
      'A big lift of presence and air, with ringing held in check, into a vast reverb where most of the tail climbs by octaves.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright' },
      { deviceId: 'shimmer', preset: 'Endless ascent' },
    ],
  },
  {
    id: 'park-zither-sprinkler-hall',
    name: 'Sprinkler hall',
    category: 'space',
    description:
      'A hall whose tail sings a soft ah, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Choir of ah' },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 11.2, modRate: 0.356 } },
    ],
  },
  {
    id: 'park-zither-noon-springs',
    name: 'Noon springs',
    category: 'space',
    description:
      'A dense many-notched phaser drifting opposite on each side, into a bright spring splash that lands a moment after the note.',
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud' },
      { deviceId: 'spring-reverb', preset: 'Late splash', params: { decay: 1.15 } },
    ],
  },
  {
    id: 'park-zither-eyes-closed-vault',
    name: 'Eyes-closed vault',
    category: 'space',
    description:
      'A low cut that thins the bass, with a little air on top, then a small room that sparkles two octaves above the sound, into a vast nave.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.31 } },
      { deviceId: 'shimmer', preset: 'Sparkle room' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { lowDecay: 7.69 } },
    ],
  },
  {
    id: 'park-zither-barefoot-amp',
    name: 'Barefoot amp',
    category: 'space',
    description:
      'Soft saturation that adds the octave above each note, then a combo amplifier boxed in by the walls of a cupboard.',
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 're-amp', preset: 'In the cupboard' },
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
      'A smooth swell that brings every note in like bowed strings, then an echo whose repeats hop up a fifth and down a fourth.',
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 334, release: 656 } },
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { time: 295, modRate: 0.659 } },
    ],
  },
  {
    id: 'park-zither-bronze-echo',
    name: 'Bronze echo',
    category: 'echo',
    description:
      'A tape echo whose three heads make a cluster of each repeat, then a combo amplifier heard from the far side of a big room.',
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
      'A plain, centred echo rebuilt from grains, into a space whose tail flutters quickly in pitch.',
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
      'A tape echo whose three heads make a cluster of each repeat, then grain repeats that climb by fifths on every pass.',
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
      'Short moments of the last few seconds replayed as they were, into twelve strings in A minor that ring with notes in that key.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Just now', params: { time: 277, size: 0.851 } },
      { deviceId: 'sympathetic', preset: 'Minor strings' },
    ],
  },
  {
    id: 'park-zither-echo-for-coins',
    name: 'Echo for coins',
    category: 'echo',
    description:
      'A ten-stage phaser falling from the top again and again, then a plain echo whose repeats bounce from side to side.',
    effects: [
      { deviceId: 'phaser', preset: 'Endless fall' },
      {
        deviceId: 'echo-memory',
        preset: 'Side to side',
        params: { time: 313, reach: 22.2, size: 2.74 },
      },
    ],
  },
  {
    id: 'park-zither-tip-jar-echo',
    name: 'Tip-jar echo',
    category: 'echo',
    description:
      'A trace of slow four-stage phaser under the dry sound, then dotted tape repeats that bounce from side to side.',
    effects: [
      { deviceId: 'phaser', preset: 'Faint shade', params: { rate: 0.139 } },
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 588 } },
    ],
  },
  {
    id: 'park-zither-cloudless-repeats',
    name: 'Cloudless repeats',
    category: 'echo',
    description:
      'A six-stage phaser turning about every three seconds, then a plain echo that is a little darker on each repeat.',
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage' },
      {
        deviceId: 'echo-memory',
        preset: 'Plain echo',
        params: { time: 367, reach: 21.7, size: 2.75 },
      },
    ],
  },
  {
    id: 'park-zither-fifths-in-july',
    name: 'Fifths in July',
    category: 'echo',
    description:
      'Soft saturation that adds the octave above each note, then grain repeats that climb by fifths on every pass.',
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 'grain-delay', preset: 'Rising fifths' },
    ],
  },
  {
    id: 'park-zither-echoes-for-pigeons',
    name: 'Echoes for pigeons',
    category: 'echo',
    description:
      'A full chorus spread wide to left and right, then a space that answers in hard separate echoes.',
    effects: [
      { deviceId: 'chorus', preset: 'Wide chorus', params: { rate: 0.729, delayMs: 12.1 } },
      { deviceId: 'expanse', preset: 'Hard echoes' },
    ],
  },
  {
    id: 'park-zither-zither-echo',
    name: 'Zither echo',
    category: 'echo',
    description:
      'A hollow flanger that sweeps every two or three seconds, then a plain, centred echo rebuilt from grains.',
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow', params: { rate: 0.436, delayMs: 1.59 } },
      { deviceId: 'grain-delay', preset: 'Plain repeat', params: { time: 407, size: 109 } },
    ],
  },
  {
    id: 'park-zither-echo-in-daylight',
    name: 'Echo in daylight',
    category: 'echo',
    description:
      'A slow pan from side to side, a few seconds each way, then an echo with a fast flutter in the pitch of its repeats.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan' },
      { deviceId: 'analog-delay', preset: 'Fluttering', params: { time: 237, modRate: 6.13 } },
    ],
  },
  {
    id: 'park-zither-chord-bar-echo',
    name: 'Chord-bar echo',
    category: 'echo',
    description:
      'A held pad whose every overtone wavers in pitch and level, then an echo whose repeats hop up a fifth and down a fourth.',
    effects: [
      { deviceId: 'sustainer', preset: 'Wavering choir', params: { attack: 0.358, glide: 0.642 } },
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { time: 363, modRate: 0.621 } },
    ],
  },
  {
    id: 'park-zither-cut-grass-arpeggio',
    name: 'Cut-grass arpeggio',
    category: 'echo',
    description:
      'A ringing sweep that seems to climb without end, then each note answered by a rising C pentatonic run of echoes.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Barber pole' },
      {
        deviceId: 'lattice',
        preset: 'Pentatonic harp',
        params: { v1Delay: 133, v2Delay: 305, v3Delay: 434, v4Delay: 500 },
      },
    ],
  },
  {
    id: 'park-zither-pavement-echo',
    name: 'Pavement echo',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, into a wide wash of sixteen long strings in D minor.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 691 } },
      { deviceId: 'sympathetic', preset: 'Minor wash', params: { mix: 0.501 } },
    ],
  },
  {
    id: 'park-zither-park-bench-echo',
    name: 'Park-bench echo',
    category: 'echo',
    description:
      'A plain, centred echo rebuilt from grains, into the octave-climbing tail of a large reverb by itself.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Plain repeat' },
      { deviceId: 'shimmer', preset: 'Rising tail alone', params: { decay: 18.6 } },
    ],
  },
  {
    id: 'park-zither-brownstone-drift',
    name: 'Brownstone drift',
    category: 'tape',
    description:
      'A four-stage phaser kept high, leaving the low end alone, then a drifting reel laid against the dry sound to make a chorus.',
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.355 } },
      { deviceId: 'tape', preset: 'Drifting chorus' },
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
    id: 'park-zither-marigold-drift',
    name: 'Marigold drift',
    category: 'tape',
    description:
      'A scooped tone with lows and highs up and the body down, then a drifting reel laid against the dry sound to make a chorus.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.65 } },
      { deviceId: 'tape', preset: 'Drifting chorus' },
    ],
  },
  {
    id: 'park-zither-fountain-reel',
    name: 'Fountain reel',
    category: 'tape',
    description:
      'A tape reel pushed hard, saturated and thick, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard', params: { output: -5.89 } },
      { deviceId: 'hall-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'park-zither-stone-arch-reel',
    name: 'Stone-arch reel',
    category: 'tape',
    description:
      'A scooped tone with lows and highs up and the body down, then a trembling reel, then a short, soft tape echo close behind the playing.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.59 } },
      { deviceId: 'tape', preset: 'Flutter shimmer' },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 168 } },
    ],
  },
  {
    id: 'park-zither-home-dubbed-tape',
    name: 'Home-dubbed tape',
    category: 'tape',
    description:
      'A worn cassette that wobbles, drops out and hisses, then a short, soft tape echo close behind the playing.',
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 173 } },
    ],
  },
  {
    id: 'park-zither-wire-brush-reel',
    name: 'Wire-brush reel',
    category: 'tape',
    description:
      'A clean, bright combo amp, then a tape reel pushed hard, saturated and thick, into a trace of room around the sound.',
    effects: [
      { deviceId: 're-amp', preset: 'Clean and bright' },
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'park-zither-stone-arch-phaser',
    name: 'Stone-arch phaser',
    category: 'motion',
    description:
      'A slow phaser swirl, then a clean, steady echo with no wobble and little dulling, into a bright undamped plate of a couple of seconds.',
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
      'A hollow peaking phaser, then a thinning tape echo, into a long bright reverb tail kept low behind the sound.',
    effects: [
      { deviceId: 'phaser', preset: 'Negative notch', params: { rate: 0.239 } },
      { deviceId: 'tape-echo', preset: 'Thin and fading' },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'park-zither-battery-amp-phaser',
    name: 'Battery-amp phaser',
    category: 'motion',
    description:
      'A climbing phaser, then a soft slapback echo close behind each note, into a huge bright space with a wide and very long tail.',
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
      'A deep flanger that takes most of a minute to sweep, into a huge bright space with a wide and very long tail.',
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
    id: 'park-zither-midday-spiral',
    name: 'Midday spiral',
    category: 'motion',
    description:
      'A ringing sweep that seems to climb without end, into a hint of a two-spring tank behind the sound.',
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
      'A long slow flanger, nearly a chorus, opposite on each side, into a far-off plate haze with a long, soft tail.',
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
    id: 'park-zither-chorus-by-the-pond',
    name: 'Chorus by the pond',
    category: 'motion',
    description:
      'A layer of soft clipping, then a chorus on the upper range that leaves the lows steady, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'saturator', preset: 'Drum bus crunch' },
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { rate: 1.24, delayMs: 12.3 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
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
      'A hollow flanger, then a clean, steady echo with no wobble and little dulling, into three long springs that chirp and drip.',
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
      'A low, resonant flanger diving over about ten seconds, into a hall that sways in pitch with a trace of the octave above.',
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
      'A slow phasing drift that turns over every few seconds, into a bright chamber that rings for a couple of seconds.',
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
      'A swell so late that notes seem to play in reverse, then a ringing sweep that seems to climb without end.',
    effects: [
      { deviceId: 'swell', preset: 'Backwards', params: { attack: 394, release: 88.4 } },
      { deviceId: 'freq-shifter', preset: 'Barber pole', params: { delay: 11, lfoRate: 0.0863 } },
    ],
  },
  {
    id: 'park-zither-phaser-by-hand',
    name: 'Phaser by hand',
    category: 'motion',
    description:
      'A deep eight-stage phaser with sharp peaks between notches, then a clean steady echo, into a quiet late plate.',
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage' },
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 223, modRate: 0.622 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'park-zither-boat-pond-swirl',
    name: 'Boat-pond swirl',
    category: 'motion',
    description:
      'A six-stage phaser, then a short, soft tape echo close behind the playing, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.29 } },
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { preDelay: 27.2, midDecay: 5.01 } },
    ],
  },
  {
    id: 'park-zither-fountain-flanger',
    name: 'Fountain flanger',
    category: 'motion',
    description:
      'A deep flanger that sweeps right up through the top, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'flanger', preset: 'Through-zero feel' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 36.9 } },
    ],
  },
  {
    id: 'park-zither-flanger-on-brick',
    name: 'Flanger on brick',
    category: 'motion',
    description:
      'A flanger that takes about twelve seconds over each sweep, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep', params: { rate: 0.075, delayMs: 4.06 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { predelayMs: 44.2 } },
    ],
  },
  {
    id: 'park-zither-thumb-piano-phaser',
    name: 'Thumb-piano phaser',
    category: 'motion',
    description:
      'A phaser that climbs for about two seconds and snaps back, then a ringing sweep that seems to climb without end.',
    effects: [
      { deviceId: 'phaser', preset: 'Saw riser', params: { rate: 0.45 } },
      {
        deviceId: 'freq-shifter',
        preset: 'Barber pole',
        params: { delay: 12.4, lfoRate: 0.0746, mix: 0.323 },
      },
    ],
  },
  {
    id: 'park-zither-tip-jar-rotary',
    name: 'Tip-jar rotary',
    category: 'motion',
    description:
      'A rotating speaker on its fast speed, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'rotary', preset: 'Tremolo' },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'park-zither-pawn-shop-sweep',
    name: 'Pawn-shop sweep',
    category: 'motion',
    description:
      'A ten-stage phaser that takes most of a minute to sweep, into a faint ring of six strings in A major.',
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep' },
      { deviceId: 'sympathetic', preset: 'Faint ring', params: { decay: 2.24 } },
    ],
  },
  {
    id: 'park-zither-shirtsleeve-sweep',
    name: 'Shirtsleeve sweep',
    category: 'motion',
    description:
      'A deep flanger that sweeps right up through the top, into five strings in F major that ring for about half a second.',
    effects: [
      { deviceId: 'flanger', preset: 'Through-zero feel', params: { rate: 0.288, delayMs: 0.818 } },
      { deviceId: 'sympathetic', preset: 'Brief pluck' },
    ],
  },
  {
    id: 'park-zither-wind-bent-pad',
    name: 'Wind-bent pad',
    category: 'motion',
    description:
      'A held pad whose every overtone wavers in pitch and level, into a huge hall whose tail hums a soft oo for a long while.',
    effects: [
      { deviceId: 'sustainer', preset: 'Wavering choir', params: { glide: 0.586 } },
      { deviceId: 'vowel-reverb', preset: 'Endless oo', params: { decay: 36.1, preDelay: 18.8 } },
    ],
  },
  {
    id: 'park-zither-heat-haze-phaser',
    name: 'Heat-haze phaser',
    category: 'motion',
    description:
      'Amplifier valves driven until they round off every peak, then a dense many-notched phaser drifting opposite on each side.',
    effects: [
      { deviceId: 're-amp', preset: 'Just the valves', params: { output: 0.653 } },
      { deviceId: 'phaser', preset: 'Twelve stage cloud' },
    ],
  },
  {
    id: 'park-zither-pulse-under-hammers',
    name: 'Pulse under hammers',
    category: 'motion',
    description:
      'Quick waves of reverb rippling about twice a second, then grain repeats that climb by fifths on every pass.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Ripples' },
      { deviceId: 'grain-delay', preset: 'Rising fifths' },
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
      'A held pad that takes seconds to melt into each new chord, then a flanger sweep with the whoosh of a passing jet plane.',
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
    id: 'park-zither-midday-afterglow',
    name: 'Midday afterglow',
    category: 'texture',
    description:
      'A short glow of held tone that dies just after each note, into a hard-driven two-spring tank that answers a moment late.',
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
      'A very slow swell, then a scattered cloud of short grains behind the playing, into a small bright chamber that goes on ringing for seconds.',
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
    id: 'park-zither-marigold-halo',
    name: 'Marigold halo',
    category: 'texture',
    description:
      'A short bright haze with an octave above everything, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Glass halo' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 5.02 } },
    ],
  },
  {
    id: 'park-zither-stoop-shimmer',
    name: 'Stoop shimmer',
    category: 'texture',
    description:
      'A wide string pad that never stops shifting and shimmering, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Restless' },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { decay: 17.9, preDelay: 44.9 } },
    ],
  },
  {
    id: 'park-zither-pavement-sparks',
    name: 'Pavement sparks',
    category: 'texture',
    description:
      'Scattered sparks two octaves up, echoing higher still, then a faint trace of tape echo behind the playing.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'High sparks', params: { size: 30.2, delay: 231 } },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 519 } },
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
      'A wide, slightly detuned fifth above held chords, then a wide chorus drifting over a cycle of about twelve seconds.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad fifth', params: { size: 64.5 } },
      { deviceId: 'chorus', preset: 'Slow drift' },
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
    id: 'park-zither-bandshell-sparks',
    name: 'Bandshell sparks',
    category: 'pitch',
    description:
      'Faint grains an octave and a fifth up, behind the playing, then a late copy on each side, like the same part played twice.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints', params: { time: 464, size: 112 } },
      { deviceId: 'chorus', preset: 'Loose double' },
    ],
  },
  {
    id: 'park-zither-echoes-in-the-grass',
    name: 'Echoes in the grass',
    category: 'pitch',
    description:
      'A long bowed swell that leans slowly into every note, then octave-climbing echoes, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'swell', preset: 'Slow bow' },
      { deviceId: 'lattice', preset: 'Crystal cascade', params: { output: 11.1 } },
      { deviceId: 'fdn-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'park-zither-glittering-octave',
    name: 'Glittering octave',
    category: 'pitch',
    description:
      'A bowed swell that lets part of each attack through, then a detuned octave above each note, like doubled strings.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed' },
      { deviceId: 'octaves', preset: 'Twelve string' },
    ],
  },
  {
    id: 'park-zither-flagstone-octave',
    name: 'Flagstone octave',
    category: 'pitch',
    description:
      'A single voice an octave above the dry sound, then tape repeats that lose their lows and thin out as they fade.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave up', params: { size: 55.8 } },
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { time: 333 } },
    ],
  },
  {
    id: 'park-zither-arpeggio-for-coins',
    name: 'Arpeggio for coins',
    category: 'pitch',
    description:
      'Each note replayed as an arpeggio of octaves and fifths, into a two-spring tank with its input driven into saturation.',
    effects: [
      { deviceId: 'cascade', preset: 'Rising steps' },
      { deviceId: 'spring-reverb', preset: 'Overdriven tank', params: { decay: 2.09 } },
    ],
  },
  {
    id: 'park-zither-picnic-finish',
    name: 'Picnic finish',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a slow compressor that evens out swells over seconds, then a safety limiter.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 279, release: 2.15 } },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'park-zither-lacquer-outdoors',
    name: 'Lacquer outdoors',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-limiter', preset: 'Wall only' },
    ],
  },
  {
    id: 'park-zither-open-air-finish',
    name: 'Open-air finish',
    category: 'master',
    description:
      'A subsonic cut, then a slow compressor that evens out swells over seconds, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 2.83 } },
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 280, release: 2.15 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.37 } },
    ],
  },
  {
    id: 'park-zither-master-on-a-bench',
    name: 'Master on a bench',
    category: 'master',
    description:
      'A fresh reel of tape, then a very gentle compressor, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'ambient-limiter', preset: 'Streaming' },
    ],
  },
  {
    id: 'park-zither-polish-in-the-park',
    name: 'Polish in the park',
    category: 'master',
    description:
      'A stereo image widened a little, with the bass left central, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'park-zither-wire-brush-master',
    name: 'Wire-brush master',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a rumble cut and a small lift of presence, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-eq', preset: 'Keys', params: { clearTime: 1.59 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 6.73 } },
    ],
  },
  {
    id: 'park-zither-dandelion-finish',
    name: 'Dandelion finish',
    category: 'master',
    description:
      'Tape-style saturation that rounds only the loudest peaks, then a subsonic cut, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 3.37 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 5.88 } },
    ],
  },
]
