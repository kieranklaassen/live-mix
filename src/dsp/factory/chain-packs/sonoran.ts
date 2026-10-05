// Sonoran Night Air: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'sonoran-tide-in-the-open',
    name: 'Tide in the open',
    category: 'space',
    description:
      'A trace of room around the sound, into a reverb that swells and ebbs in waves of over a second each.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Faint air' },
      { deviceId: 'shaped-reverb', preset: 'Slow tide', params: { time: 3.89 } },
    ],
  },
  {
    id: 'sonoran-cienega-cathedral',
    name: 'Cienega cathedral',
    category: 'space',
    description:
      'A slow swell after each silence that opens only at the end, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1460, release: 762 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 86.8, lowDecay: 6.59, midDecay: 6.64 },
      },
    ],
  },
  {
    id: 'sonoran-hall-in-the-scrub',
    name: 'Hall in the scrub',
    category: 'space',
    description:
      'A tape preamp driven for thick lows and a dull top, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -8.07 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { predelayMs: 191 } },
    ],
  },
  {
    id: 'sonoran-hall-out-past-town',
    name: 'Hall out past town',
    category: 'space',
    description:
      'A damped hall of about five seconds, heard from far off, then a low cut that thins the bass, with a little air on top.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 21.6, lowDecay: 5.51, midDecay: 4.81 },
      },
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.49 } },
    ],
  },
  {
    id: 'sonoran-swell-down-the-wash',
    name: 'Swell down the wash',
    category: 'space',
    description:
      'A tight cluster of tape repeats, like a very small room, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Tiny room cluster' },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 14.5, modRate: 0.289 } },
    ],
  },
  {
    id: 'sonoran-halo-among-cactus',
    name: 'Halo among cactus',
    category: 'space',
    description:
      'A wide room heard from its far end, into a small glassy reverb with a glint two octaves up.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Distant', params: { mix: 0.531 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { decay: 5.93, predelay: 19.7, mix: 0.18 } },
    ],
  },
  {
    id: 'sonoran-starfield-nave',
    name: 'Starfield nave',
    category: 'space',
    description:
      'A vast nave that rings for about eight seconds, then a phaser with no dry sound, pulling the two sides apart.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
      { deviceId: 'phaser', preset: 'Stereo scatter', params: { rate: 0.262 } },
    ],
  },
  {
    id: 'sonoran-lamp-lit-shadow',
    name: 'Lamp-lit shadow',
    category: 'space',
    description:
      'A small room that casts a shadow an octave below, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'shimmer', preset: 'Low shadow', params: { decay: 2.19, predelay: 20.2 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 15.7, modRate: 0.325 } },
    ],
  },
  {
    id: 'sonoran-halo-under-stars',
    name: 'Halo under stars',
    category: 'space',
    description:
      'A swell that takes seconds to rise after each silence, into a reverb that comes in late and climbs by octaves and fifths.',
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 2520, release: 661 } },
      { deviceId: 'shimmer', preset: 'Late answer', params: { decay: 8.83, predelay: 369 } },
    ],
  },
  {
    id: 'sonoran-ironwood-hall',
    name: 'Ironwood hall',
    category: 'space',
    description:
      'Two dark late copies that shadow the sound on either side, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Shadow' },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 62.2 } },
    ],
  },
  {
    id: 'sonoran-windless-cloud',
    name: 'Windless cloud',
    category: 'space',
    description:
      'A hot console channel, forward in the upper mids, into a dull reverb that swells in over seconds and fades slowly.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Hot channel' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell', params: { time: 3.76 } },
    ],
  },
  {
    id: 'sonoran-hall-a-valley-over',
    name: 'Hall a valley over',
    category: 'space',
    description:
      'One slow scatter of echoes over about a second and no tail, into a damped hall of about five seconds, heard from far off.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Long scatter', params: { glide: 0.55 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { lowDecay: 4.68, midDecay: 5.04 } },
    ],
  },
  {
    id: 'sonoran-power-line-choir',
    name: 'Power-line choir',
    category: 'space',
    description:
      'A huge hall whose tail hums a soft oo for a long while, into a cloud of reverb that swells in after each note and fades.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Endless oo', params: { preDelay: 19.3 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom' },
    ],
  },
  {
    id: 'sonoran-dry-lake-cathedral',
    name: 'Dry-lake cathedral',
    category: 'space',
    description:
      'A slow swell after each silence that opens only at the end, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1660, release: 784 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { decay: 18.1, preDelay: 41.8 } },
    ],
  },
  {
    id: 'sonoran-starlit-depths',
    name: 'Starlit depths',
    category: 'space',
    description:
      'A slow swell after each silence that opens only at the end, into a large reverb whose tail sinks an octave on every pass.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1600, release: 838 } },
      { deviceId: 'shimmer', preset: 'Undertow', params: { decay: 12.3, predelay: 19.5 } },
    ],
  },
  {
    id: 'sonoran-far-ridge-hall',
    name: 'Far-ridge hall',
    category: 'space',
    description:
      'A damped hall of about five seconds, heard from far off, then a deep, slow compressor that lifts the quiet and holds it.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Far away' },
      { deviceId: 'ambient-comp', preset: 'Drone bed', params: { makeup: 8.19 } },
    ],
  },
  {
    id: 'sonoran-slow-breath-wash',
    name: 'Slow-breath wash',
    category: 'space',
    description:
      'A huge slow wash that swells in and hangs with no dry sound, then a deep slow chorus on a long delay, swaying over seconds.',
    effects: [
      { deviceId: 'expanse', preset: 'Wash alone' },
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.136, delayMs: 27.9 } },
    ],
  },
  {
    id: 'sonoran-echoes-miles-off',
    name: 'Echoes miles off',
    category: 'space',
    description:
      'A triode valve stage, smoothly overdriven, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'expanse', preset: 'Far echoes', params: { modRate: 0.261 } },
    ],
  },
  {
    id: 'sonoran-mud-brick-space',
    name: 'Mud-brick space',
    category: 'space',
    description:
      'A string-like swell, then a hollow peaking phaser that turns about every four seconds, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 314, release: 529 } },
      { deviceId: 'phaser', preset: 'Negative notch' },
      { deviceId: 'expanse', preset: 'Open space' },
    ],
  },
  {
    id: 'sonoran-yucca-swell',
    name: 'Yucca swell',
    category: 'space',
    description:
      'A cloud of reverb that swells in after each note and fades, then a low, gentle compressor that brings up everything quiet.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 2.28 } },
      {
        deviceId: 'ambient-comp',
        preset: 'Raise the quiet',
        params: { attack: 95.7, release: 0.908, makeup: 11.4 },
      },
    ],
  },
  {
    id: 'sonoran-space-by-the-road',
    name: 'Space by the road',
    category: 'space',
    description:
      'A mid-forward tone with the lows and the top trimmed, into a vast space whose tail swells in and hangs a minute or more.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward' },
      { deviceId: 'expanse', preset: 'Event horizon', params: { decay: 55.3, modRate: 0.153 } },
    ],
  },
  {
    id: 'sonoran-bosque-halo',
    name: 'Bosque halo',
    category: 'space',
    description:
      'A bright chamber that rings for a couple of seconds, into a reverb whose tail climbs nearly an octave as it rings.',
    effects: [
      { deviceId: 'expanse', preset: 'Bright chamber' },
      { deviceId: 'bloom-reverb', preset: 'Octave halo', params: { decay: 6.13 } },
    ],
  },
  {
    id: 'sonoran-cave-on-bare-rock',
    name: 'Cave on bare rock',
    category: 'space',
    description:
      'A tape preamp pushed just enough to add weight, into a cave whose echoes bend slowly up and down in pitch.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'swarm-reverb', preset: 'Bending' },
    ],
  },
  {
    id: 'sonoran-drone-under-cirrus',
    name: 'Drone under cirrus',
    category: 'space',
    description:
      'A big lift of the low end that puts weight under the sound, into a huge hall whose tail hums a soft oo for a long while.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'vowel-reverb', preset: 'Endless oo' },
    ],
  },
  {
    id: 'sonoran-caliche-tide',
    name: 'Caliche tide',
    category: 'space',
    description:
      'A warm, full equaliser, then a reverb that swells up behind each note and cuts off, into a slowly breathing hall.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.57 } },
      { deviceId: 'shaped-reverb', preset: 'Reverse' },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 8.83, breathRate: 0.215 } },
    ],
  },
  {
    id: 'sonoran-saguaro-hall',
    name: 'Saguaro hall',
    category: 'space',
    description:
      'A late copy on each side, like the same part played twice, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'chorus', preset: 'Loose double', params: { rate: 0.205, delayMs: 26.8 } },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'sonoran-tinaja-hall',
    name: 'Tinaja hall',
    category: 'space',
    description:
      'A short, soft tape echo close behind the playing, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 171 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 59.2 } },
    ],
  },
  {
    id: 'sonoran-poorwill-cathedral',
    name: 'Poorwill cathedral',
    category: 'space',
    description:
      'A cathedral with about six seconds of tail, then a wide chorus drifting over a cycle of about twelve seconds.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 74.7, lowDecay: 7.79, midDecay: 6.57 },
      },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },
  {
    id: 'sonoran-coyote-choir',
    name: 'Coyote choir',
    category: 'space',
    description:
      'A short swell that rounds the front off every note, then a sung oo just behind, into the drifting tail of a long reverb with no dry sound.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 164, release: 76.6 } },
      { deviceId: 'vowel-reverb', preset: 'Oo behind' },
      { deviceId: 'bloom-reverb', preset: 'Tail alone', params: { decay: 15.9 } },
    ],
  },
  {
    id: 'sonoran-cienega-hall',
    name: 'Cienega hall',
    category: 'space',
    description:
      'A slow swell on only the first note after each silence, into a damped hall of about five seconds, heard from far off.',
    effects: [
      { deviceId: 'swell', preset: 'First note only', params: { attack: 1350, release: 1380 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { lowDecay: 4.86, midDecay: 4.91 } },
    ],
  },
  {
    id: 'sonoran-porch-echo',
    name: 'Porch echo',
    category: 'echo',
    description:
      'An echo whose repeats hop up a fifth and down a fourth, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Fifth hop' },
      { deviceId: 'fdn-reverb', preset: 'Open valley' },
    ],
  },
  {
    id: 'sonoran-kit-fox-trail',
    name: 'Kit-fox trail',
    category: 'echo',
    description:
      'A slow tape echo with a long trail that dulls as it goes, then a dark smear of long grains that trails for many seconds.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Long dark trail' },
      { deviceId: 'grain-delay', preset: 'Dark slow smear' },
    ],
  },
  {
    id: 'sonoran-elf-owl-echo',
    name: 'Elf-owl echo',
    category: 'echo',
    description:
      'A bucket-brigade echo whose soft repeats dull as they fade, into a long reverb that comes and goes in waves, over and over.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 358, modRate: 0.664 } },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { time: 1.88 } },
    ],
  },
  {
    id: 'sonoran-echo-half-asleep',
    name: 'Echo half asleep',
    category: 'echo',
    description:
      'A bucket-brigade echo whose soft repeats dull as they fade, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 362, modRate: 0.599 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { mix: 0.196 } },
    ],
  },
  {
    id: 'sonoran-echo-at-moonset',
    name: 'Echo at moonset',
    category: 'echo',
    description:
      'A wide echo whose repeats drift slowly in pitch, into a hint of open space behind the sound.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slow drift' },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
  },
  {
    id: 'sonoran-moonrise-descent',
    name: 'Moonrise descent',
    category: 'echo',
    description:
      'Echoes that fall a fourth further on every repeat, into a reverb that fades evenly to nothing in a second or two.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Falling steps', params: { size: 73.9, delay: 423 } },
      { deviceId: 'shaped-reverb', preset: 'Falling' },
    ],
  },
  {
    id: 'sonoran-wind-bent-echo',
    name: 'Wind-bent echo',
    category: 'echo',
    description:
      'A transformer driven so the low end thickens and loosens, then a wide echo whose repeats drift slowly in pitch.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { output: -7.29 } },
      { deviceId: 'analog-delay', preset: 'Slow drift', params: { time: 660, modRate: 0.0923 } },
    ],
  },
  {
    id: 'sonoran-satellite-echo',
    name: 'Satellite echo',
    category: 'echo',
    description:
      'A slow echo with a long dark trail and a few recollections, into a plain room that is gone in a couple of seconds.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Dark trail',
        params: { time: 1120, reach: 26.7, size: 4.46 },
      },
      { deviceId: 'bloom-reverb', preset: 'Still room' },
    ],
  },
  {
    id: 'sonoran-granite-echo',
    name: 'Granite echo',
    category: 'echo',
    description:
      'A fast, steady reel with soft saturation, then a bucket-brigade echo with a slow chorus on its repeats.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 305, modRate: 0.919 } },
    ],
  },
  {
    id: 'sonoran-echo-on-warm-rock',
    name: 'Echo on warm rock',
    category: 'echo',
    description:
      'A tape echo whose warm repeats soften as they fade, into a reverb whose tail climbs an octave on every pass.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { time: 367 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { decay: 7.26, predelay: 20.2 } },
    ],
  },
  {
    id: 'sonoran-bajada-echo',
    name: 'Bajada echo',
    category: 'echo',
    description:
      'A clean, steady echo with no wobble and little dulling, into a long bright reverb tail kept low behind the sound.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 219, modRate: 0.674 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'sonoran-starlit-pad',
    name: 'Starlit pad',
    category: 'echo',
    description:
      'A wide smeared pad held from the first notes played, into a plain room that is gone in a couple of seconds.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Frozen pad' },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { decay: 2.7 } },
    ],
  },
  {
    id: 'sonoran-echo-at-last-light',
    name: 'Echo at last light',
    category: 'echo',
    description:
      'A bucket-brigade echo with a slow chorus on its repeats, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 313, modRate: 0.806 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 13, breathRate: 0.053 } },
    ],
  },
  {
    id: 'sonoran-cereus-repeats',
    name: 'Cereus repeats',
    category: 'echo',
    description:
      'A bucket-brigade echo whose soft repeats dull as they fade, into a dark hall that takes about twenty seconds to die away.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo' },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0703 } },
    ],
  },
  {
    id: 'sonoran-open-range-loop',
    name: 'Open-range loop',
    category: 'echo',
    description:
      'A half-speed loop that plays the last phrase an octave down, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed', params: { length: 2.3 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 15.9 } },
    ],
  },
  {
    id: 'sonoran-cereus-echo',
    name: 'Cereus echo',
    category: 'echo',
    description:
      'A tape echo whose three heads make a cluster of each repeat, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 569 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'sonoran-echo-out-past-town',
    name: 'Echo out past town',
    category: 'echo',
    description:
      'Tape-style saturation that rounds peaks and dulls the top, then a chorused echo, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape' },
      { deviceId: 'analog-delay', preset: 'Chorused' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 33.1, modRate: 0.107 } },
    ],
  },
  {
    id: 'sonoran-tail-light-reel',
    name: 'Tail-light reel',
    category: 'tape',
    description:
      'A reel of tape at middle speed, with a little drift and hiss, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { output: -2.28 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'sonoran-caliche-warmth',
    name: 'Caliche warmth',
    category: 'tape',
    description:
      'Tape-style saturation that rounds only the loudest peaks, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth', params: { outputDb: -6.93 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 10.8, modRate: 0.38 } },
    ],
  },
  {
    id: 'sonoran-palo-verde-warmth',
    name: 'Palo-verde warmth',
    category: 'tape',
    description:
      'A transformer driven so the low end thickens and loosens, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'fdn-reverb', preset: 'Breathing' },
    ],
  },
  {
    id: 'sonoran-cassette-off-the-rim',
    name: 'Cassette off the rim',
    category: 'tape',
    description:
      'A thick, soft cassette, full in the lows and dull on top, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { lowDecay: 7.73, midDecay: 7.93 } },
    ],
  },
  {
    id: 'sonoran-tape-after-dark',
    name: 'Tape after dark',
    category: 'tape',
    description:
      'A big lift of the low end that puts weight under the sound, then a thick, soft cassette, full in the lows and dull on top.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.97 } },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'sonoran-open-range-filter',
    name: 'Open-range filter',
    category: 'motion',
    description:
      'A glacial low-pass, then a thick ensemble chorus turning about every two seconds, into a fully damped hall with a few seconds of tail.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0271, envAttackMs: 9.49, envReleaseMs: 196 },
      },
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { rate: 0.538, delayMs: 20 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 22.4 } },
    ],
  },
  {
    id: 'sonoran-ridgeline-swell',
    name: 'Ridgeline swell',
    category: 'motion',
    description:
      'The level breathing in and out about every four seconds, then a plain chorus, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath' },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.885, delayMs: 10.7 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'sonoran-cienega-filter',
    name: 'Cienega filter',
    category: 'motion',
    description:
      'A glacial low-pass, then a trace of chorus on the top of the sound only, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'chorus', preset: 'Faint air', params: { rate: 0.254, delayMs: 10.7 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'sonoran-foothill-filter',
    name: 'Foothill filter',
    category: 'motion',
    description:
      'A single notch drifting slowly up and down the spectrum, then a deep slow chorus, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Slow notch' },
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.148 } },
      { deviceId: 'expanse', preset: 'Open space', params: { modRate: 0.403 } },
    ],
  },
  {
    id: 'sonoran-sonoran-swirl',
    name: 'Sonoran swirl',
    category: 'motion',
    description:
      'A six-stage phaser turning about every three seconds, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.273 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { lowDecay: 3.52, midDecay: 3.84 },
      },
    ],
  },
  {
    id: 'sonoran-firelight-sweep',
    name: 'Firelight sweep',
    category: 'motion',
    description:
      'A few decibels of soft saturation with the top eased, then a ten-stage phaser that takes most of a minute to sweep.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { rate: 0.0182 } },
    ],
  },
  {
    id: 'sonoran-headlight-phaser',
    name: 'Headlight phaser',
    category: 'motion',
    description:
      'A ten-stage phaser falling from the top again and again, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'phaser', preset: 'Endless fall', params: { rate: 0.412 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'sonoran-drift-after-rain',
    name: 'Drift after rain',
    category: 'motion',
    description:
      'A sharp copy hard left, a flat one hard right, heard alone, then a wide chorus drifting over a cycle of about twelve seconds.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wet only', params: { delay: 14.5 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.0862, delayMs: 22.1 } },
    ],
  },
  {
    id: 'sonoran-small-hours-sway',
    name: 'Small-hours sway',
    category: 'motion',
    description:
      'A slow pan from side to side, a few seconds each way, then a hollow chorus that swells over about ten seconds, into a late-arriving hall.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.124 } },
      { deviceId: 'chorus', preset: 'Hollow swell', params: { rate: 0.0982, delayMs: 8.55 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'sonoran-moonless-tide',
    name: 'Moonless tide',
    category: 'motion',
    description:
      'A glacial low-pass, then a chorus on the upper range that leaves the lows steady, into a plate heard alone with none of the dry sound left.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0321, envAttackMs: 10.4, envReleaseMs: 183 },
      },
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { rate: 1.28, delayMs: 15.2 } },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'sonoran-thunderhead-filter',
    name: 'Thunderhead filter',
    category: 'motion',
    description:
      'A resonant low-pass that swings open about every two seconds, then a chorused echo, into a slowly breathing hall.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Dub sweep',
        params: { lfoRateHz: 0.495, envAttackMs: 11.1, envReleaseMs: 220 },
      },
      { deviceId: 'analog-delay', preset: 'Chorused' },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 8.49, breathRate: 0.218 } },
    ],
  },
  {
    id: 'sonoran-sweep-in-still-air',
    name: 'Sweep in still air',
    category: 'motion',
    description:
      'A sagging valve stage, then a deep flanger that sweeps right up through the top, into a plain hall of about four seconds.',
    effects: [
      { deviceId: 'patina', preset: 'Valve bloom' },
      { deviceId: 'flanger', preset: 'Through-zero feel' },
      { deviceId: 'vowel-reverb', preset: 'Plain hall' },
    ],
  },
  {
    id: 'sonoran-agave-flanger',
    name: 'Agave flanger',
    category: 'motion',
    description:
      'A full, warm transformer, then a gentle flanger sweeping about every four seconds, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'flanger', preset: 'Gentle sweep' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'sonoran-edgeless-flanger',
    name: 'Edgeless flanger',
    category: 'motion',
    description:
      'A long slow flanger, nearly a chorus, opposite on each side, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'flanger', preset: 'Wide wash' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 39.4 } },
    ],
  },
  {
    id: 'sonoran-basin-phaser',
    name: 'Basin phaser',
    category: 'motion',
    description:
      'A phaser taking about a quarter of a minute to come round, into a huge slow wash that swells in and hangs with no dry sound.',
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.0667 } },
      { deviceId: 'expanse', preset: 'Wash alone' },
    ],
  },
  {
    id: 'sonoran-arroyo-drift',
    name: 'Arroyo drift',
    category: 'motion',
    description:
      'A hard-clipped copy held at one level under the clean sound, then a slow flanger-like sweep, opposite on each side.',
    effects: [
      { deviceId: 'saturator', preset: 'Sustain bed' },
      { deviceId: 'tremolo', preset: 'Drifting comb', params: { rate: 0.0902 } },
    ],
  },
  {
    id: 'sonoran-swirl-on-bare-rock',
    name: 'Swirl on bare rock',
    category: 'motion',
    description:
      'A fast, steady reel with soft saturation, then a four-stage phaser with two broad notches, turning slowly.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { output: 2.41 } },
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.291 } },
    ],
  },
  {
    id: 'sonoran-phaser-rim-to-rim',
    name: 'Phaser rim to rim',
    category: 'motion',
    description:
      'Repeats that climb in pitch on the left, sink on the right, then a dense many-notched phaser drifting opposite on each side.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Spiral', params: { delay: 41.6 } },
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { rate: 0.115 } },
    ],
  },
  {
    id: 'sonoran-cholla-harmony',
    name: 'Cholla harmony',
    category: 'texture',
    description:
      'A held pad where each new chord piles onto the last, then a gentle high cut that shades the top end, into a hall with no dry sound.',
    effects: [
      { deviceId: 'sustainer', preset: 'Stacked harmony', params: { attack: 0.643, glide: 0.831 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Full wet send',
        params: { decay: 8.61, breathRate: 0.309 },
      },
    ],
  },
  {
    id: 'sonoran-windless-pad',
    name: 'Windless pad',
    category: 'texture',
    description:
      'A dark, round pad that melts slowly from chord to chord, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed' },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 47.1, lowDecay: 4.06, midDecay: 2.65 },
      },
    ],
  },
  {
    id: 'sonoran-observatory-pad',
    name: 'Observatory pad',
    category: 'texture',
    description:
      'A string pad that takes seconds to swell in after a chord, into a long blurred cave that slides slowly between intervals.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Slow swell', params: { rise: 3.59, fall: 7.18 } },
      { deviceId: 'swarm-reverb', preset: 'Slow stretch' },
    ],
  },
  {
    id: 'sonoran-all-night-pad',
    name: 'All-night pad',
    category: 'texture',
    description:
      'A held pad that swells in slowly like bowed strings, then a tape reel with soft saturation, slight wobble and hiss.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings', params: { attack: 1.83, glide: 1.33 } },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
    ],
  },
  {
    id: 'sonoran-cellos-down-the-wash',
    name: 'Cellos down the wash',
    category: 'texture',
    description:
      'A dark, low string pad like cellos under the playing, into a reverb whose tail climbs in fifths as it rings.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { rise: 1.6, fall: 7.53 } },
      { deviceId: 'shimmer', preset: 'Fifths' },
    ],
  },
  {
    id: 'sonoran-glimpses-on-hardpan',
    name: 'Glimpses on hardpan',
    category: 'texture',
    description:
      'A quick slapback echo over short glimpses of earlier notes, into a hall of about four seconds with no dry sound in it.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Glimpses',
        params: { time: 70.6, reach: 20.3, size: 0.55 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { lowDecay: 3.57, midDecay: 3.88 },
      },
    ],
  },
  {
    id: 'sonoran-strings-till-morning',
    name: 'Strings till morning',
    category: 'texture',
    description:
      'A held pad that swells in slowly like bowed strings, then a high cut set low enough to muffle everything, into a space that swells in.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings', params: { attack: 2.25, glide: 1.44 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 12.7 } },
    ],
  },
  {
    id: 'sonoran-monsoon-tide',
    name: 'Monsoon tide',
    category: 'texture',
    description:
      'A string pad that arrives long after the chord and stays, then a big lift of the low end, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Late tide' },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.08 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'sonoran-dry-lake-drone',
    name: 'Dry-lake drone',
    category: 'texture',
    description:
      'An unfading slow drone, then a mid-forward tone with the lows and the top trimmed, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'sustainer', preset: 'Endless drone', params: { attack: 3.06, glide: 3.63 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 10.8, modRate: 0.351 } },
    ],
  },
  {
    id: 'sonoran-strings-on-the-roof',
    name: 'Strings on the roof',
    category: 'texture',
    description:
      'A soft string pad that swells in behind what is played, then a far-off, dulled tone, into a huge wash by itself.',
    effects: [
      { deviceId: 'pad-follower', preset: 'String pad' },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.52 } },
      { deviceId: 'expanse', preset: 'Wash alone', params: { decay: 44.8, modRate: 0.0962 } },
    ],
  },
  {
    id: 'sonoran-poorwill-wash',
    name: 'Poorwill wash',
    category: 'texture',
    description:
      'A wide, darkened wash in which every note slowly dissolves, then grain repeats that fall an octave and darken each time.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.42 } },
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.24 } },
    ],
  },
  {
    id: 'sonoran-tide-overhead',
    name: 'Tide overhead',
    category: 'texture',
    description:
      'A short swell that rounds the front off every note, then long slow grains an octave down, most of them reversed, into a hall with long lows.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack' },
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { size: 883, density: 5.06 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'sonoran-cholla-drone',
    name: 'Cholla drone',
    category: 'texture',
    description:
      'A slow drone that swells from the playing and never fades, then a chorus heard alone, its detuned copies spread hard apart.',
    effects: [
      { deviceId: 'sustainer', preset: 'Endless drone', params: { attack: 3.33, glide: 3.9 } },
      { deviceId: 'chorus', preset: 'Voices only', params: { rate: 0.347, delayMs: 16.4 } },
    ],
  },
  {
    id: 'sonoran-dark-sky-afterglow',
    name: 'Dark-sky afterglow',
    category: 'texture',
    description:
      'A slow swell after each silence that opens only at the end, then a dark string pad that lingers long after each chord.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1340, release: 797 } },
      { deviceId: 'pad-follower', preset: 'Lingering', params: { rise: 1.13, fall: 17.5 } },
    ],
  },
  {
    id: 'sonoran-katydid-sustain',
    name: 'Katydid sustain',
    category: 'texture',
    description:
      'A long clear sustain that holds each note for seconds, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Long clean hold' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 3.7, breathRate: 0.304 } },
    ],
  },
  {
    id: 'sonoran-bosque-octave',
    name: 'Bosque octave',
    category: 'pitch',
    description:
      'A muffled half-speed octave below, kept in the centre, into a damped hall of about five seconds, heard from far off.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor' },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 22.5, lowDecay: 5.02, midDecay: 4.2, mix: 0.586 },
      },
    ],
  },
  {
    id: 'sonoran-tail-light-grains',
    name: 'Tail-light grains',
    category: 'pitch',
    description:
      'Scattered grains a fifth down, spread across both sides, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down grains' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 31.2, modRate: 0.0956 } },
    ],
  },
  {
    id: 'sonoran-moonlit-undertow',
    name: 'Moonlit undertow',
    category: 'pitch',
    description:
      'A dark, smooth half-speed octave under the dry sound, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1320 } },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 27.9, modRate: 0.0931 } },
    ],
  },
  {
    id: 'sonoran-basin-fifth',
    name: 'Basin fifth',
    category: 'pitch',
    description:
      'A slowed copy a fifth below, running on beside the dry sound, into a vast space whose tail swells in and hangs a minute or more.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down bed' },
      { deviceId: 'expanse', preset: 'Event horizon', params: { decay: 56.9, modRate: 0.144 } },
    ],
  },
  {
    id: 'sonoran-windmill-bass',
    name: 'Windmill bass',
    category: 'pitch',
    description:
      'A deep bass two octaves down that swells in slowly, then a deep slow chorus on a long delay, swaying over seconds.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals' },
      { deviceId: 'chorus', preset: 'Deep sea' },
    ],
  },
  {
    id: 'sonoran-deep-basin-drift',
    name: 'Deep-basin drift',
    category: 'pitch',
    description:
      'A wide, slowed copy a fourth below that drifts behind, then a very wide wash in which every note hangs for many seconds.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth down drift', params: { mix: 0.36 } },
      { deviceId: 'spectral-blur', preset: 'Endless', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'sonoran-two-lane-depths',
    name: 'Two-lane depths',
    category: 'pitch',
    description:
      'A soft, deep bass one and two octaves below each note, into sixteen strings that learn the tune and ring on long.',
    effects: [
      { deviceId: 'octaves', preset: 'Deep' },
      { deviceId: 'sympathetic', preset: 'Learn and hold', params: { mix: 0.36 } },
    ],
  },
  {
    id: 'sonoran-observatory-undertow',
    name: 'Observatory undertow',
    category: 'pitch',
    description:
      'A dark, smooth half-speed octave under the dry sound, into a cavern built from a rush of short echoes.',
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix' },
      { deviceId: 'swarm-reverb', preset: 'Cavern', params: { length: 0.46, glide: 0.655 } },
    ],
  },
  {
    id: 'sonoran-cattle-guard-replay',
    name: 'Cattle-guard replay',
    category: 'pitch',
    description:
      'A half-speed replay an octave down, with no dry sound, into a dull reverb that swells in over seconds and fades slowly.',
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'sonoran-agave-finish',
    name: 'Agave finish',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a parallel compressor, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 449, release: 3.32 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
  {
    id: 'sonoran-master-slow-as-sleep',
    name: 'Master slow as sleep',
    category: 'master',
    description:
      'A small dip in the low mids, then a slow compressor that evens out swells over seconds, then a smooth true-peak ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone', params: { clearTime: 1.45 } },
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 280, release: 1.85 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { release: 1.39 } },
    ],
  },
  {
    id: 'sonoran-javelina-lacquer',
    name: 'Javelina lacquer',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ambient-limiter', preset: 'Wall only' },
    ],
  },
  {
    id: 'sonoran-mixdown-before-sunup',
    name: 'Mixdown before sunup',
    category: 'master',
    description:
      'A gentle compressor that draws loud and quiet together, then a slightly wider image, then a safety limiter.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 94, release: 1.78 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 3.89 } },
    ],
  },
  {
    id: 'sonoran-katydid-mixdown',
    name: 'Katydid mixdown',
    category: 'master',
    description:
      'A rumble cut and a small lift of presence, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Keys', params: { clearTime: 1.64 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'sonoran-polish-by-the-road',
    name: 'Polish by the road',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a small dip in the low mids, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-eq', preset: 'Drone' },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.64 } },
    ],
  },
]
