// Sonoran Night Air: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'sonoran-hall-in-the-open',
    name: 'Hall in the open',
    category: 'space',
    description:
      'A deep, slow compressor that lifts a quiet bed and holds it, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Drone bed', params: { makeup: 7.3 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 9.25, predelayMs: 117, breathRate: 0.323 },
      },
    ],
  },
  {
    id: 'sonoran-open-range-hum',
    name: 'Open-range hum',
    category: 'space',
    description:
      'A mid-forward tone with the lows and the top trimmed, into a dull closed-mouth hum of deep voices behind the sound.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward' },
      { deviceId: 'vowel-reverb', preset: 'Humming' },
    ],
  },
  {
    id: 'sonoran-well-off-the-rim',
    name: 'Well off the rim',
    category: 'space',
    description:
      'A deep dark well of slow blurred echoes, then a firm compressor that listens only above the low end.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { length: 1.14, glide: 0.64 } },
      {
        deviceId: 'ambient-comp',
        preset: 'Ride the mids',
        params: { attack: 58.3, release: 0.56, makeup: 10.7 },
      },
    ],
  },
  {
    id: 'sonoran-tide-in-the-open',
    name: 'Tide in the open',
    category: 'space',
    description:
      'A trace of room around the sound, into a reverb that swells and ebbs in waves of about four seconds.',
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
    id: 'sonoran-saguaro-tail',
    name: 'Saguaro tail',
    category: 'space',
    description:
      'The drifting tail of a long reverb with no dry sound, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Tail alone', params: { decay: 16.1 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'sonoran-room-by-the-fire',
    name: 'Room by the fire',
    category: 'space',
    description:
      'Three detuned voices spread hard apart with no dry sound, into a plain hall that rings for about three seconds.',
    effects: [
      { deviceId: 'chorus', preset: 'Voices only', params: { rate: 0.327, delayMs: 14.6 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 2.91, predelay: 13.9 } },
    ],
  },
  {
    id: 'sonoran-hall-out-past-town',
    name: 'Hall out past town',
    category: 'space',
    description:
      'A hall heard from far off with little dry sound left, then a low cut that thins the bass, with a little air on top.',
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
      'A room heard from its far end with little dry sound left, into a small glassy reverb with a glint two octaves up.',
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
      'A swell that takes seconds to rise after each silence, into a late reverb that climbs by octaves and fifths.',
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
      'Two dark late copies, a shadow either side of the sound, into a damped hall whose tail lasts ten seconds and more.',
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
      'A console channel run hot with its level pulled back down, into a dull reverb that swells in over seconds and fades slowly.',
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
      'One slow scatter of echoes over about a second and no tail, into a hall heard from far off with little dry sound left.',
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
    id: 'sonoran-cholla-hall',
    name: 'Cholla hall',
    category: 'space',
    description:
      'A wide open space with a slowly wavering tail, then a low-pass that opens and closes over about half a minute.',
    effects: [
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 9.7, modRate: 0.389, mix: 0.316 },
      },
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0296, envAttackMs: 10.5, envReleaseMs: 191 },
      },
    ],
  },
  {
    id: 'sonoran-small-hours-glow',
    name: 'Small-hours glow',
    category: 'space',
    description:
      'A tight cluster of echoes close behind each note, into a faint short reverb with a slight upward drift.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Tight swarm' },
      { deviceId: 'bloom-reverb', preset: 'Faint glow', params: { decay: 3.64 } },
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
    id: 'sonoran-katydid-harp',
    name: 'Katydid harp',
    category: 'space',
    description:
      'A subsonic cut and a slow ear that eases whatever rings on, into sixteen hard-driven strings in F major that ring for seconds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 2.83 } },
      { deviceId: 'sympathetic', preset: 'Glass harp', params: { decay: 6.6 } },
    ],
  },
  {
    id: 'sonoran-open-sky-harp',
    name: 'Open-sky harp',
    category: 'space',
    description:
      'Sixteen strings in E minor heard alone with no dry sound, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Strings alone', params: { decay: 8.61 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.304 } },
    ],
  },
  {
    id: 'sonoran-coyote-tide',
    name: 'Coyote tide',
    category: 'space',
    description:
      'A long slow flanger, nearly a chorus, opposite on each side, into a huge slow wash that swells in and hangs with no dry sound.',
    effects: [
      { deviceId: 'flanger', preset: 'Wide wash', params: { rate: 0.157, delayMs: 8.23 } },
      { deviceId: 'expanse', preset: 'Wash alone', params: { decay: 40.9, modRate: 0.105 } },
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
      'A hall heard from far off with little dry sound left, then a deep, slow compressor that lifts a quiet bed and holds it.',
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
    id: 'sonoran-hall-off-the-rim',
    name: 'Hall off the rim',
    category: 'space',
    description:
      'A glacial low-pass, then a trace of room around the sound, into a hall heard from far off with little dry sound left.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0273, envAttackMs: 9.76, envReleaseMs: 206 },
      },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
      { deviceId: 'hall-reverb', preset: 'Far away' },
    ],
  },
  {
    id: 'sonoran-moth-wing-tail',
    name: 'Moth-wing tail',
    category: 'space',
    description:
      'A phaser held still, two fixed peaks like a vowel, into the drifting tail of a long reverb with no dry sound.',
    effects: [
      { deviceId: 'phaser', preset: 'Still formant' },
      { deviceId: 'bloom-reverb', preset: 'Tail alone' },
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
    id: 'sonoran-basin-wash',
    name: 'Basin wash',
    category: 'echo',
    description:
      'Dotted tape repeats that pile up in a darkening wash, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Dub wash' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 38 } },
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
    id: 'sonoran-saguaro-hop',
    name: 'Saguaro hop',
    category: 'echo',
    description:
      'An echo whose repeats jump up an octave and back, into a reverb that breathes in slow waves over and over.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Octave hop' },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { time: 1.95 } },
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
      'A bucket-brigade echo whose soft repeats dull as they fade, into a reverb that breathes in slow waves over and over.',
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
      'Echoes that fall a fourth further on every repeat, into a reverb that falls away in a straight line.',
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
      'A slow echo with a long dark trail and a few recollections, into a plain short room whose tail stays at pitch.',
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
    id: 'sonoran-loop-on-warm-rock',
    name: 'Loop on warm rock',
    category: 'echo',
    description:
      'A fading tape loop, then an equaliser that takes presence, air and lows away, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade', params: { length: 1.97 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 10.9, modRate: 0.42 } },
    ],
  },
  {
    id: 'sonoran-granite-echo',
    name: 'Granite echo',
    category: 'echo',
    description:
      'A fast, steady reel pushed into soft saturation, then a bucket-brigade echo with a slow chorus on its repeats.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 305, modRate: 0.919 } },
    ],
  },
  {
    id: 'sonoran-tinaja-mirror',
    name: 'Tinaja mirror',
    category: 'echo',
    description:
      'Recalled moments that mostly come back reversed or slowed, into a dark hall that takes about twenty seconds to die away.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Backwards',
        params: { time: 558, reach: 13.5, size: 1.43 },
      },
      { deviceId: 'fdn-reverb', preset: 'Endless tail' },
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
      'A clean, steady echo with no wobble and an open top, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 219, modRate: 0.674 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'sonoran-edgeless-trail',
    name: 'Edgeless trail',
    category: 'echo',
    description:
      'A slow echo with a long dark trail and a few recollections, then dotted tape repeats that pile up in a darkening wash.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Dark trail' },
      { deviceId: 'tape-echo', preset: 'Dub wash' },
    ],
  },
  {
    id: 'sonoran-starlit-pad',
    name: 'Starlit pad',
    category: 'echo',
    description:
      'The first notes played, held as a wide smeared pad, into a plain short room whose tail stays at pitch.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Frozen pad' },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { decay: 2.7 } },
    ],
  },
  {
    id: 'sonoran-dark-sky-weight',
    name: 'Dark-sky weight',
    category: 'tape',
    description:
      'A transformer that fills out the lows and dulls the top, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 8.29, breathRate: 0.204 } },
    ],
  },
  {
    id: 'sonoran-unfenced-tape',
    name: 'Unfenced tape',
    category: 'tape',
    description:
      'A tape-style curve that rounds the peaks and dulls the top, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 11.7, breathRate: 0.0533 } },
    ],
  },
  {
    id: 'sonoran-monsoon-tape',
    name: 'Monsoon tape',
    category: 'tape',
    description:
      'A clean pass over fast new tape, with nothing added, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'tape', preset: 'Clean transfer' },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 63.3 } },
    ],
  },
  {
    id: 'sonoran-sundown-reel',
    name: 'Sundown reel',
    category: 'tape',
    description:
      'A valve preamp curve, lopsided and a little brighter on top, then a reel of tape at middle speed, with a little drift and hiss.',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp' },
      { deviceId: 'tape', preset: 'Quarter inch', params: { output: -4.3 } },
    ],
  },
  {
    id: 'sonoran-tape-by-the-road',
    name: 'Tape by the road',
    category: 'tape',
    description:
      'A thick, soft cassette, then a fresh reel of tape, open on top and nearly steady, into a small dark room that is gone in about a second.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'patina', preset: 'New tape', params: { output: -2.38 } },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'sonoran-open-range-filter',
    name: 'Open-range filter',
    category: 'motion',
    description:
      'A glacial low-pass, then a thick three-voice ensemble chorus that turns slowly, into a fully damped hall with a few seconds of tail.',
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
      'A slow breathing level, then a plain two-voice chorus with a voice towards each side, into a far-off plate haze.',
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath' },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.885, delayMs: 10.7 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'sonoran-lamp-lit-pan',
    name: 'Lamp-lit pan',
    category: 'motion',
    description:
      'A slow pan, then three voices drifting over a cycle of about twelve seconds, into a far-off plate haze.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.13 } },
      { deviceId: 'chorus', preset: 'Slow drift' },
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
    id: 'sonoran-javelina-notch',
    name: 'Javelina notch',
    category: 'motion',
    description:
      'A slowly drifting notch, then a slow ensemble chorus, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Slow notch' },
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { rate: 0.55, delayMs: 19.7 } },
      { deviceId: 'expanse', preset: 'Bloom' },
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
    id: 'sonoran-cloud-in-the-scrub',
    name: 'Cloud in the scrub',
    category: 'motion',
    description:
      'A warm tape preamp, then twelve phaser stages tuned far apart, drifting slowly, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { rate: 0.106 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
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
    id: 'sonoran-rotary-under-cirrus',
    name: 'Rotary under cirrus',
    category: 'motion',
    description:
      'Dark, thick valve grit, then a soft slow rotary blend, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit', params: { outputDb: -20.1 } },
      { deviceId: 'rotary', preset: 'Soft blend' },
      { deviceId: 'hall-reverb', preset: 'Hall' },
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
    id: 'sonoran-hollow-slow-as-sleep',
    name: 'Hollow slow as sleep',
    category: 'motion',
    description:
      'A short hollow flanger on negative feedback, then a pan that wanders to a new place every second or so.',
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow', params: { rate: 0.426, delayMs: 1.48 } },
      { deviceId: 'tremolo', preset: 'Wandering pan' },
    ],
  },
  {
    id: 'sonoran-open-sky-hollow',
    name: 'Open-sky hollow',
    category: 'motion',
    description:
      'A short hollow flanger on negative feedback, into a mellow reverb whose tail splits upwards and downwards.',
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow' },
      { deviceId: 'bloom-reverb', preset: 'Scatter' },
    ],
  },
  {
    id: 'sonoran-yucca-phaser',
    name: 'Yucca phaser',
    category: 'motion',
    description:
      'A thick, soft cassette, then a glacial phaser sweep, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'phaser', preset: 'Glacial sweep' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'sonoran-tinaja-voices',
    name: 'Tinaja voices',
    category: 'motion',
    description:
      'A choir of a hall whose vowel wanders on its own, then a low-pass that opens and closes over about half a minute.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Vowel drift' },
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0283, envAttackMs: 10.1, envReleaseMs: 209 },
      },
    ],
  },
  {
    id: 'sonoran-headlight-phaser',
    name: 'Headlight phaser',
    category: 'motion',
    description:
      'A ten-stage phaser falling from the top again and again, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'phaser', preset: 'Endless fall', params: { rate: 0.412 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'sonoran-stock-tank-hollow',
    name: 'Stock-tank hollow',
    category: 'motion',
    description:
      "A smooth swell on every note, like a string section's bows, then a short hollow flanger on negative feedback.",
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 314, release: 552 } },
      { deviceId: 'flanger', preset: 'Negative hollow' },
    ],
  },
  {
    id: 'sonoran-monsoon-chorale',
    name: 'Monsoon chorale',
    category: 'motion',
    description:
      'A rotating speaker on its slow speed, then whole phrases coming back three times, each one duller, into a hall with no dry sound.',
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'cascade', preset: 'Phrase returns', params: { time: 1590 } },
      { deviceId: 'fdn-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'sonoran-drift-after-rain',
    name: 'Drift after rain',
    category: 'motion',
    description:
      'Only the two detuned copies, hard left and right, then three voices drifting over a cycle of about twelve seconds.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wet only', params: { delay: 14.5 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.0862, delayMs: 22.1 } },
    ],
  },
  {
    id: 'sonoran-thunderhead-pedal',
    name: 'Thunderhead pedal',
    category: 'texture',
    description:
      'A long clean sustain, then an equaliser that takes presence, air and lows away, into a dark, very long hall.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Long clean hold' },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.4 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Endless tail',
        params: { decay: 18.1, breathRate: 0.0817 },
      },
    ],
  },
  {
    id: 'sonoran-two-lane-strings',
    name: 'Two-lane strings',
    category: 'texture',
    description:
      'A quiet string pad kept far behind the playing, then a steep low-pass at four hundred hertz, the top gone, into a slowly breathing hall.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Barely there', params: { rise: 1.8, fall: 7.85 } },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { lfoRateHz: 0.938, envAttackMs: 8.76, envReleaseMs: 202 },
      },
      { deviceId: 'fdn-reverb', preset: 'Breathing' },
    ],
  },
  {
    id: 'sonoran-arroyo-pedal',
    name: 'Arroyo pedal',
    category: 'texture',
    description:
      'A pad held from each chord, then a warm, full equaliser, into a long dark reverb whose tail sinks slowly in pitch.',
    effects: [
      { deviceId: 'sustainer', preset: 'Sustain pedal' },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.56 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { decay: 24.8 } },
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
    id: 'sonoran-strings-till-morning',
    name: 'Strings till morning',
    category: 'texture',
    description:
      'A dark string pad that lingers long after each chord, then a gentle low-pass at a kilohertz, into a huge open valley.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Lingering' },
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { lfoRateHz: 0.945, envAttackMs: 9.99, envReleaseMs: 218 },
      },
      { deviceId: 'fdn-reverb', preset: 'Open valley' },
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
    id: 'sonoran-power-line-tunnel',
    name: 'Power-line tunnel',
    category: 'texture',
    description:
      'A piece of each note looped into a long, swelling drone, then a plain echo that is a little darker on each repeat.',
    effects: [
      { deviceId: 'cascade', preset: 'Long drone', params: { time: 792 } },
      { deviceId: 'echo-memory', preset: 'Plain echo' },
    ],
  },
  {
    id: 'sonoran-firelight-tide',
    name: 'Firelight tide',
    category: 'texture',
    description:
      'Long slow grains an octave down, most of them reversed, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { size: 1010, density: 5.6 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
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
      'A quick slap while short glimpses of earlier notes return, into a hall of about four seconds with no dry sound in it.',
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
    id: 'sonoran-poorwill-wash',
    name: 'Poorwill wash',
    category: 'texture',
    description:
      'A reverse-sounding swell, then a slowly dissolving wash, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      { deviceId: 'swell', preset: 'Backwards', params: { attack: 396, release: 107 } },
      { deviceId: 'spectral-blur', preset: 'Slow dissolve' },
      { deviceId: 'vowel-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'sonoran-depths-under-cirrus',
    name: 'Depths under cirrus',
    category: 'texture',
    description:
      'A low blurred bed under the sound, nothing above the bass, then a clean pass over fast new tape, with nothing added.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Sub bed' },
      { deviceId: 'tape', preset: 'Clean transfer', params: { output: -2.14 } },
    ],
  },
  {
    id: 'sonoran-playa-fader',
    name: 'Playa fader',
    category: 'texture',
    description:
      'A slow compressor that evens out swells over seconds, then a string voice that doubles each note almost at once.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level', params: { makeup: 2.32 } },
      { deviceId: 'pad-follower', preset: 'Doubler', params: { rise: 0.0442, fall: 0.857 } },
    ],
  },
  {
    id: 'sonoran-bosque-octave',
    name: 'Bosque octave',
    category: 'pitch',
    description:
      'A muffled half-speed octave below, all lows, in the middle, into a hall heard from far off with little dry sound left.',
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
      'A dark half-speed octave kept low under the dry sound, into a huge dark cathedral with only the lows left ringing.',
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
    id: 'sonoran-caliche-depths',
    name: 'Caliche depths',
    category: 'pitch',
    description:
      'A firm, slow compressor that keeps long swells held down, then a quarter-speed crawl two octaves down, smooth and unbroken.',
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Hold swells',
        params: { attack: 163, release: 6.7, makeup: 2.44 },
      },
      { deviceId: 'half-speed', preset: 'Quarter speed', params: { length: 3700 } },
    ],
  },
  {
    id: 'sonoran-windmill-bass',
    name: 'Windmill bass',
    category: 'pitch',
    description:
      'Deep pedal notes two octaves down that swell in slowly, then a deep slow chorus on a long delay, swaying over seconds.',
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
    id: 'sonoran-kit-fox-tide',
    name: 'Kit-fox tide',
    category: 'pitch',
    description:
      'Long slow grains an octave down, most of them reversed, then a wash of three fed-back tape heads that hovers and fades.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Low tide' },
      { deviceId: 'tape-echo', preset: 'Hovering wash' },
    ],
  },
  {
    id: 'sonoran-mesquite-octave',
    name: 'Mesquite octave',
    category: 'pitch',
    description:
      'A rounded octave below every note of a chord, into a late wall of reverb that holds and stops dead.',
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'shaped-reverb', preset: 'Late wall' },
    ],
  },
  {
    id: 'sonoran-agave-reel',
    name: 'Agave reel',
    category: 'master',
    description:
      'A fast, steady reel pushed into soft saturation, then a fast compressor that takes the spike off plucked notes, then an eased-back ceiling.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { release: 0.147 } },
      { deviceId: 'ambient-limiter', preset: 'Pull back', params: { release: 1.39, gain: 0.629 } },
    ],
  },
  {
    id: 'sonoran-lamp-lit-preamp',
    name: 'Lamp-lit preamp',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'sonoran-cereus-tape',
    name: 'Cereus tape',
    category: 'master',
    description:
      'A fresh reel of tape, then a gentle compressor, then a true-peak ceiling six decibels down, with room to spare.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 111, release: 1.97 } },
      { deviceId: 'ambient-limiter', preset: 'Margin', params: { release: 1.59, gain: 2.33 } },
    ],
  },
  {
    id: 'sonoran-ironwood-glue',
    name: 'Ironwood glue',
    category: 'master',
    description:
      'A low cut and a small dip in the low mids, to make room, then a parallel compressor, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Layer' },
      { deviceId: 'ambient-comp', preset: 'Lift' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 6.08 } },
    ],
  },
  {
    id: 'sonoran-power-line-reel',
    name: 'Power-line reel',
    category: 'master',
    description:
      'A reel of tape at middle speed, with a little drift and hiss, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.65 } },
    ],
  },
  {
    id: 'sonoran-moonrise-curve',
    name: 'Moonrise curve',
    category: 'master',
    description:
      'An equaliser that adds lows and body and eases the top, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -6.17 } },
    ],
  },
]
