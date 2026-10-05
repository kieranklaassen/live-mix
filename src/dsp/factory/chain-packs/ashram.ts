// Ashram Harp and Organ: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'ashram-twilight-strings',
    name: 'Twilight strings',
    category: 'space',
    description:
      'Eight strings in C major that ring on as under a held pedal, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Piano pedal' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 37.9 } },
    ],
  },
  {
    id: 'ashram-garland-wash',
    name: 'Garland wash',
    category: 'space',
    description:
      'A wide wash of sixteen long strings in D minor, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor wash', params: { decay: 9.82, mix: 0.509 } },
      {
        deviceId: 'ether-reverb',
        preset: 'Dark infinite',
        params: { predelayMs: 53.5, mix: 0.15 },
      },
    ],
  },
  {
    id: 'ashram-incense-strings',
    name: 'Incense strings',
    category: 'space',
    description:
      'Five strings in F major that ring for about half a second, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Brief pluck' },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'ashram-strings-for-evening',
    name: 'Strings for evening',
    category: 'space',
    description:
      'A brief ring of sixteen strings behind each note, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Short halo', params: { decay: 0.857 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 13.3, modRate: 0.282 } },
    ],
  },
  {
    id: 'ashram-camphor-strings',
    name: 'Camphor strings',
    category: 'space',
    description:
      'Four long strings on an A minor chord held in the centre, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Centre drone' },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 7.21, breathRate: 0.186 } },
    ],
  },
  {
    id: 'ashram-devotional-room',
    name: 'Devotional room',
    category: 'space',
    description:
      'A sharp copy on the left and a flat one on the right, into a small room that is over in about a second.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { delay: 12.8 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Room',
        params: { preDelay: 33.1, lowDecay: 1.54, midDecay: 1.32 },
      },
    ],
  },
  {
    id: 'ashram-wash-at-the-gate',
    name: 'Wash at the gate',
    category: 'space',
    description:
      'Two unison doubles snapped to pitch, hard left and right, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'lattice', preset: 'Tuned double', params: { v1Delay: 15.7, v2Delay: 30.5 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'ashram-orange-grove-plate',
    name: 'Orange-grove plate',
    category: 'space',
    description:
      'A plate heard alone with none of the dry sound left, then a compressor as slow as a hand on a fader.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
      { deviceId: 'ambient-comp', preset: 'Slow fader', params: { makeup: -0.119 } },
    ],
  },
  {
    id: 'ashram-doorstep-wash',
    name: 'Doorstep wash',
    category: 'space',
    description:
      'A wash of three fed-back tape heads that hovers and fades, then a low cut that thins the bass, with a little air on top.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Hovering wash' },
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.49 } },
    ],
  },
  {
    id: 'ashram-hall-in-dry-hills',
    name: 'Hall in dry hills',
    category: 'space',
    description:
      'An amplifier stack, all bass, with the mic turned away, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly', params: { output: -2.86 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 18.1 } },
    ],
  },
  {
    id: 'ashram-dusk-cathedral',
    name: 'Dusk cathedral',
    category: 'space',
    description:
      'A single saturated tape slap behind each note, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 99.5 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { decay: 20.5, preDelay: 41.8 } },
    ],
  },
  {
    id: 'ashram-back-room-strings',
    name: 'Back-room strings',
    category: 'space',
    description:
      'Four strings that retune to what is played and ring briefly, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Echo the tune', params: { mix: 0.24 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { predelayMs: 35.4, mix: 0.24 } },
    ],
  },
  {
    id: 'ashram-plate-till-daybreak',
    name: 'Plate till daybreak',
    category: 'space',
    description:
      'A bowed swell at half strength under the dry attacks, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 263, release: 135 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'ashram-hum-in-marigolds',
    name: 'Hum in marigolds',
    category: 'space',
    description:
      'A heavy low shelf that puts weight under the sound, into a dull closed-mouth hum of deep voices behind the sound.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.75 } },
      { deviceId: 'vowel-reverb', preset: 'Humming', params: { decay: 9.06, preDelay: 19.4 } },
    ],
  },
  {
    id: 'ashram-foothill-bloom',
    name: 'Foothill bloom',
    category: 'space',
    description:
      'A short swell that rounds the front off every note, into a reverb whose tail climbs nearly an octave as it rings.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 175, release: 75.3 } },
      { deviceId: 'bloom-reverb', preset: 'Octave halo', params: { decay: 6.27 } },
    ],
  },
  {
    id: 'ashram-plate-before-dawn',
    name: 'Plate before dawn',
    category: 'space',
    description:
      'A two-spring tank with a little chirp and drip, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 38.9 } },
    ],
  },
  {
    id: 'ashram-choir-by-the-creek',
    name: 'Choir by the creek',
    category: 'space',
    description:
      'A vast reverb where most of the tail climbs by octaves, into one slack spring in the centre whose echoes chirp brightly.',
    effects: [
      { deviceId: 'shimmer', preset: 'Endless ascent', params: { predelay: 58.6 } },
      { deviceId: 'spring-reverb', preset: 'Single slack coil', params: { decay: 3.89 } },
    ],
  },
  {
    id: 'ashram-sway-in-sage',
    name: 'Sway in sage',
    category: 'space',
    description:
      'A phaser held still, two fixed peaks like a vowel, into a hall whose tail sways in pitch with a trace of the octave.',
    effects: [
      { deviceId: 'phaser', preset: 'Still formant' },
      { deviceId: 'shimmer', preset: 'Swaying hall', params: { decay: 4.15, predelay: 21.8 } },
    ],
  },
  {
    id: 'ashram-sopranos-on-the-hill',
    name: 'Sopranos on the hill',
    category: 'space',
    description:
      'A vast hall whose long tail sings a high bright ah, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'High choir', params: { decay: 25.2, preDelay: 18.9 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.268 } },
    ],
  },
  {
    id: 'ashram-ghee-lamp-strings',
    name: 'Ghee-lamp strings',
    category: 'space',
    description:
      'A plain short room whose tail stays at pitch, into sixteen strings that learn the tune and ring on long.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { decay: 2.7 } },
      { deviceId: 'sympathetic', preset: 'Learn and hold', params: { decay: 9.53 } },
    ],
  },
  {
    id: 'ashram-plate-at-sundown',
    name: 'Plate at sundown',
    category: 'space',
    description:
      'A tape-style curve that rounds the peaks and dulls the top, into a medium plate with a smooth tail of a few seconds.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { predelayMs: 21.5 } },
    ],
  },
  {
    id: 'ashram-room-under-oaks',
    name: 'Room under oaks',
    category: 'space',
    description:
      'Twelve phaser stages tuned far apart, drifting slowly, into a far-miked room laid in under the clean sound.',
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { rate: 0.125 } },
      { deviceId: 're-amp', preset: 'Room underneath', params: { output: 6.57 } },
    ],
  },
  {
    id: 'ashram-chirp-in-saffron',
    name: 'Chirp in saffron',
    category: 'space',
    description:
      'Three slack springs where every echo is a long chirp, then a fast, firm compressor that stops only the peaks.',
    effects: [
      { deviceId: 'spring-reverb', preset: 'Slack and strange' },
      { deviceId: 'ambient-comp', preset: 'Peak stop', params: { makeup: -1.68 } },
    ],
  },
  {
    id: 'ashram-walls-for-the-altar',
    name: 'Walls for the altar',
    category: 'space',
    description:
      'A triode valve stage, smoothly overdriven, into the close reflections of a very small room.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Short ambience',
        params: { decay: 0.38, breathRate: 0.331 },
      },
    ],
  },
  {
    id: 'ashram-strings-at-the-gate',
    name: 'Strings at the gate',
    category: 'space',
    description:
      "A smooth swell on every note, like a string section's bows, into eight strings in C major that ring on as under a held pedal.",
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 314, release: 590 } },
      { deviceId: 'sympathetic', preset: 'Piano pedal', params: { decay: 2.8 } },
    ],
  },
  {
    id: 'ashram-plate-across-canyon',
    name: 'Plate across canyon',
    category: 'space',
    description:
      'A far-off plate with a long soft tail and little dry sound, then a big lift of presence and air, with ringing held in check.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.53 } },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { clearTime: 0.653 } },
    ],
  },
  {
    id: 'ashram-shrine-hall',
    name: 'Shrine hall',
    category: 'space',
    description:
      "A smooth swell on every note, like a string section's bows, into an undamped hall with about three seconds of tail.",
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 363, release: 548 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air' },
    ],
  },
  {
    id: 'ashram-silk-choir',
    name: 'Silk choir',
    category: 'space',
    description:
      'A small room that answers about an eighth of a second late, into a dull closed-mouth hum of deep voices behind the sound.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Slap room', params: { predelayMs: 139 } },
      { deviceId: 'vowel-reverb', preset: 'Humming' },
    ],
  },
  {
    id: 'ashram-veranda-loop',
    name: 'Veranda loop',
    category: 'echo',
    description:
      'A tape loop whose passes cross from side to side, into a vast space whose tail swells in and hangs a minute or more.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Crossing sides', params: { length: 1.56 } },
      { deviceId: 'expanse', preset: 'Event horizon', params: { decay: 58.7 } },
    ],
  },
  {
    id: 'ashram-echo-after-rain',
    name: 'Echo after rain',
    category: 'echo',
    description:
      'A slow, dull echo from a worn-out bucket-brigade line, into a short reverb that swells in just after each note.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Noisy clock' },
      { deviceId: 'expanse', preset: 'Quick swell', params: { decay: 2.13, modRate: 0.352 } },
    ],
  },
  {
    id: 'ashram-teak-echo',
    name: 'Teak echo',
    category: 'echo',
    description:
      'A slow compressor that evens out swells over seconds, then a dull, wobbling, saturated echo on worn tape.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level', params: { makeup: 2.29 } },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 633 } },
    ],
  },
  {
    id: 'ashram-rosewood-echo',
    name: 'Rosewood echo',
    category: 'echo',
    description:
      'An echo whose repeats hop up a fifth and down a fourth, into a reverb that grows backwards behind each note and cuts off.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { time: 344, modRate: 0.536 } },
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 1.3 } },
    ],
  },
  {
    id: 'ashram-trace-after-rain',
    name: 'Trace after rain',
    category: 'echo',
    description:
      'A bowed swell at half strength under the dry attacks, then a faint trace of tape echo behind the playing.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 323, release: 143 } },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 439 } },
    ],
  },
  {
    id: 'ashram-jasmine-trail',
    name: 'Jasmine trail',
    category: 'echo',
    description:
      'A rotating speaker on its slow speed, then a slow echo with a long dark trail and a few recollections.',
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      {
        deviceId: 'echo-memory',
        preset: 'Dark trail',
        params: { time: 1200, reach: 32.9, size: 5.28 },
      },
    ],
  },
  {
    id: 'ashram-echo-on-the-hill',
    name: 'Echo on the hill',
    category: 'echo',
    description:
      'A pan that wanders to a new place every second or so, then a clean, steady echo with no wobble and an open top.',
    effects: [
      { deviceId: 'tremolo', preset: 'Wandering pan' },
      { deviceId: 'analog-delay', preset: 'Clean echo' },
    ],
  },
  {
    id: 'ashram-echo-at-the-shrine',
    name: 'Echo at the shrine',
    category: 'echo',
    description:
      'A transformer driven so the low end thickens and loosens, then three tape heads in a row, a cluster on every repeat.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 580 } },
    ],
  },
  {
    id: 'ashram-saffron-echo',
    name: 'Saffron echo',
    category: 'echo',
    description:
      'Grain repeats that sink by fourths on every pass, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling fourths', params: { time: 568, size: 190 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { predelayMs: 191 } },
    ],
  },
  {
    id: 'ashram-sway-in-incense',
    name: 'Sway in incense',
    category: 'echo',
    description:
      'A short echo whose pitch sways like a seasick vibrato, into a hall heard from far off with little dry sound left.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Seasick', params: { time: 165, modRate: 3.11 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.597 } },
    ],
  },
  {
    id: 'ashram-cathedral-in-saffron',
    name: 'Cathedral in saffron',
    category: 'tape',
    description:
      'A tape reel with soft saturation, slight wobble and hiss, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'vowel-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'ashram-live-oak-voices',
    name: 'Live-oak voices',
    category: 'tape',
    description:
      'A tape reel pushed hard into thick saturation, into a choir of a hall whose vowel wanders on its own.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'vowel-reverb', preset: 'Vowel drift', params: { decay: 8.99, preDelay: 22 } },
    ],
  },
  {
    id: 'ashram-after-hours-choir',
    name: 'After-hours choir',
    category: 'tape',
    description:
      'A cassette with a full head bump and a rolled-off top, into a large hall whose tail hums a deep oh in bass voices.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 12.2, preDelay: 18 } },
    ],
  },
  {
    id: 'ashram-bare-floor-choir',
    name: 'Bare-floor choir',
    category: 'tape',
    description:
      'A muffled cassette, its top rolled off and its lows lifted, into a dull closed-mouth hum of deep voices behind the sound.',
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'vowel-reverb', preset: 'Humming', params: { decay: 9.65, preDelay: 21.6 } },
    ],
  },
  {
    id: 'ashram-rose-water-sampler',
    name: 'Rose-water sampler',
    category: 'tape',
    description:
      'A coarse early sampler, gritty, with bright hash on top, then a short, soft tape echo close behind the playing.',
    effects: [
      { deviceId: 'patina', preset: 'Eight bit' },
      { deviceId: 'tape-echo', preset: 'Short and soft' },
    ],
  },
  {
    id: 'ashram-reel-by-the-creek',
    name: 'Reel by the creek',
    category: 'tape',
    description:
      'A reel of tape at middle speed, with a little drift and hiss, then a single saturated tape slap behind each note.',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'tape-echo', preset: 'Single slap' },
    ],
  },
  {
    id: 'ashram-fuzz-with-garlands',
    name: 'Fuzz with garlands',
    category: 'tape',
    description:
      'A hard-clipped copy held at one level under the clean sound, then a gentle high cut that shades the top end.',
    effects: [
      { deviceId: 'saturator', preset: 'Sustain bed' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'ashram-reel-at-the-gate',
    name: 'Reel at the gate',
    category: 'tape',
    description:
      'A slow rotating speaker with its amplifier driven hard, then a reel of tape at middle speed, with a little drift and hiss.',
    effects: [
      { deviceId: 'rotary', preset: 'Slow burn' },
      { deviceId: 'tape', preset: 'Quarter inch', params: { output: -3.47 } },
    ],
  },
  {
    id: 'ashram-bits-in-the-grove',
    name: 'Bits in the grove',
    category: 'tape',
    description:
      'A wide string pad that never stops shifting and shimmering, then an early sampler at a low rate, its top filtered away.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Restless' },
      { deviceId: 'patina', preset: 'Muffled sampler' },
    ],
  },
  {
    id: 'ashram-rose-water-rotary',
    name: 'Rose-water rotary',
    category: 'motion',
    description:
      'A combo amplifier driven hard, miked right on the cone, then a clean slow rotating speaker blended under the dry sound, into a vast nave.',
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { output: -5.41 } },
      { deviceId: 'rotary', preset: 'Soft blend' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'ashram-evening-raga-cabinet',
    name: 'Evening-raga cabinet',
    category: 'motion',
    description:
      'A tape preamp pushed just enough to add weight, then a slow rotating speaker heard through one microphone, into a far-off plate haze.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { output: -8.6 } },
      { deviceId: 'rotary', preset: 'Mono cabinet' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'ashram-sundown-rotary',
    name: 'Sundown rotary',
    category: 'motion',
    description:
      'A warm amplifier stack, then a slow rotating speaker with its amplifier driven hard, into one dull, late spring.',
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack', params: { output: -4.17 } },
      { deviceId: 'rotary', preset: 'Slow burn' },
      {
        deviceId: 'spring-reverb',
        preset: 'Dark late coil',
        params: { decay: 4.99, predelay: 74.3 },
      },
    ],
  },
  {
    id: 'ashram-half-heard-swirl',
    name: 'Half-heard swirl',
    category: 'motion',
    description:
      'Driven amplifier valves heard through a flat speaker, then a far fast spinning horn, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 're-amp', preset: 'Just the valves', params: { output: 0.193 } },
      { deviceId: 'rotary', preset: 'Far shimmer' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 40.7 } },
    ],
  },
  {
    id: 'ashram-sagebrush-rotary',
    name: 'Sagebrush rotary',
    category: 'motion',
    description:
      'A tape preamp pushed just enough to add weight, then a rotating speaker on its fast speed, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'rotary', preset: 'Tremolo' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 13.7 } },
    ],
  },
  {
    id: 'ashram-satsang-rotary',
    name: 'Satsang rotary',
    category: 'motion',
    description:
      'A tape-style curve only just leaned on, then a slow rotating speaker heard from across the room, into two taut, long springs.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'spring-reverb', preset: 'Tight long tank' },
    ],
  },
  {
    id: 'ashram-strings-by-the-lamp',
    name: 'Strings by the lamp',
    category: 'motion',
    description:
      'Sixteen strings that learn the tune and ring on long, then a deep eight-stage phaser with sharp peaks between notches.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Learn and hold', params: { decay: 9.4 } },
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.213 } },
    ],
  },
  {
    id: 'ashram-strings-at-sundown',
    name: 'Strings at sundown',
    category: 'motion',
    description:
      'Thirteen drone strings in D major kept near the centre, then a slow rotating speaker set shallow and mixed half dry.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Sitar drone', params: { decay: 5.28, mix: 0.24 } },
      { deviceId: 'rotary', preset: 'Faint motion', params: { mix: 0.36 } },
    ],
  },
  {
    id: 'ashram-whitewashed-harp',
    name: 'Whitewashed harp',
    category: 'motion',
    description:
      'Sixteen strings in C major that ring for about ten seconds, then three voices drifting over a cycle of about twelve seconds.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Long ring' },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },
  {
    id: 'ashram-harp-after-rain',
    name: 'Harp after rain',
    category: 'motion',
    description:
      'Sixteen strings that learn the tune and ring on long, then a slow rotating speaker with its amplifier driven hard.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Learn and hold', params: { decay: 8.44, mix: 0.36 } },
      { deviceId: 'rotary', preset: 'Slow burn' },
    ],
  },
  {
    id: 'ashram-rotor-in-marigolds',
    name: 'Rotor in marigolds',
    category: 'motion',
    description:
      'A half-deep swell that leaves a ghost of each attack, then a slow rotating speaker that is mostly its low, dark drum.',
    effects: [
      { deviceId: 'swell', preset: 'Ghost pick', params: { attack: 513, release: 136 } },
      { deviceId: 'rotary', preset: 'Dark drum' },
    ],
  },
  {
    id: 'ashram-unhurried-sweep',
    name: 'Unhurried sweep',
    category: 'motion',
    description:
      'A short swell that rounds the front off every note, then a resonant low-pass that swings open about every two seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 155, release: 78.1 } },
      {
        deviceId: 'auto-filter',
        preset: 'Dub sweep',
        params: { lfoRateHz: 0.508, envAttackMs: 11.1, envReleaseMs: 207 },
      },
    ],
  },
  {
    id: 'ashram-ensemble-in-sage',
    name: 'Ensemble in sage',
    category: 'motion',
    description:
      'A thick three-voice ensemble chorus that turns slowly, into a small dark room that is gone in about a second.',
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble' },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'ashram-turmeric-speaker',
    name: 'Turmeric speaker',
    category: 'motion',
    description:
      'A slow rotating speaker heard from across the room, into a dark hall that takes about twenty seconds to die away.',
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0709 } },
    ],
  },
  {
    id: 'ashram-garland-phaser',
    name: 'Garland phaser',
    category: 'motion',
    description:
      'The first hint of weight from a tape preamp, then a deep eight-stage phaser with sharp peaks between notches.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.206 } },
    ],
  },
  {
    id: 'ashram-phaser-for-the-altar',
    name: 'Phaser for the altar',
    category: 'motion',
    description:
      'A warm amplifier stack, then a trace of slow four-stage phaser under the dry sound, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack' },
      { deviceId: 'phaser', preset: 'Faint shade' },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'ashram-sun-warmed-platter',
    name: 'Sun-warmed platter',
    category: 'motion',
    description:
      'A warped record through a dark cartridge, swaying slowly, into the drifting tail of a long reverb with no dry sound.',
    effects: [
      { deviceId: 'vinyl', preset: 'Slow platter', params: { spin: 4.45 } },
      { deviceId: 'bloom-reverb', preset: 'Tail alone', params: { decay: 15.8 } },
    ],
  },
  {
    id: 'ashram-jasmine-growl',
    name: 'Jasmine growl',
    category: 'motion',
    description:
      'A fast rotating speaker with its amplifier growling, into a far-miked room laid in under the clean sound.',
    effects: [
      { deviceId: 'rotary', preset: 'Growl' },
      { deviceId: 're-amp', preset: 'Room underneath', params: { output: 1.08 } },
    ],
  },
  {
    id: 'ashram-saffron-fall',
    name: 'Saffron fall',
    category: 'motion',
    description:
      'A valve stage driven hard until it thickens and sags, then a ten-stage phaser falling from the top again and again.',
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { output: -2.64 } },
      { deviceId: 'phaser', preset: 'Endless fall', params: { rate: 0.425 } },
    ],
  },
  {
    id: 'ashram-foothill-waves',
    name: 'Foothill waves',
    category: 'motion',
    description:
      'A reverb that breathes in slow waves over and over, into a faint ring of six strings in A major.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Breathing' },
      { deviceId: 'sympathetic', preset: 'Faint ring' },
    ],
  },
  {
    id: 'ashram-chorus-in-sage',
    name: 'Chorus in sage',
    category: 'motion',
    description:
      'A plain two-voice chorus with a voice towards each side, into a wordless choir alone with none of the dry sound left.',
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.742, delayMs: 11.5 } },
      { deviceId: 'vowel-reverb', preset: 'Choir alone', params: { decay: 9.23, preDelay: 22.2 } },
    ],
  },
  {
    id: 'ashram-rose-petal-pan',
    name: 'Rose-petal pan',
    category: 'motion',
    description:
      'A hard pan that jumps from one side to the other, then a single saturated tape slap behind each note.',
    effects: [
      { deviceId: 'tremolo', preset: 'Side to side' },
      { deviceId: 'tape-echo', preset: 'Single slap' },
    ],
  },
  {
    id: 'ashram-oil-lamp-fall',
    name: 'Oil-lamp fall',
    category: 'motion',
    description:
      'A resonant high-pass falling for about two seconds at a time, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Falling high-pass' },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 57.2, lowDecay: 7.93, midDecay: 2.22, mix: 0.24 },
      },
    ],
  },
  {
    id: 'ashram-live-oak-horn',
    name: 'Live-oak horn',
    category: 'motion',
    description:
      'A fast spinning horn laid over the dry sound, then two tape heads that make every repeat gallop.',
    effects: [
      { deviceId: 'rotary', preset: 'Guitar swirl' },
      { deviceId: 'tape-echo', preset: 'Two head gallop' },
    ],
  },
  {
    id: 'ashram-strings-in-no-hurry',
    name: 'Strings in no hurry',
    category: 'texture',
    description:
      'A deep, slow compressor, then a string pad that takes seconds to swell in after a chord, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
      { deviceId: 'pad-follower', preset: 'Slow swell' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 4.12, breathRate: 0.288 } },
    ],
  },
  {
    id: 'ashram-courtyard-felt',
    name: 'Courtyard felt',
    category: 'texture',
    description:
      'A volume-pedal swell, then a muffled pad with all its top taken off, slow to fade, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 252, release: 161 } },
      { deviceId: 'pad-follower', preset: 'Felted pad' },
      { deviceId: 'fdn-reverb', preset: 'Bright air' },
    ],
  },
  {
    id: 'ashram-courtyard-basses',
    name: 'Courtyard basses',
    category: 'texture',
    description:
      'A swell-holding compressor, then a dark pad like cellos, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Hold swells',
        params: { attack: 160, release: 6.12, makeup: 3.57 },
      },
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { rise: 1.32, fall: 7.11 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 11 } },
    ],
  },
  {
    id: 'ashram-turmeric-strings',
    name: 'Turmeric strings',
    category: 'texture',
    description:
      'A softened attack, then a soft string pad that swells in behind what is played, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 47.2, release: 66.1 } },
      { deviceId: 'pad-follower', preset: 'String pad', params: { rise: 0.653, fall: 3.97 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 14.1 } },
    ],
  },
  {
    id: 'ashram-gourd-halo',
    name: 'Gourd halo',
    category: 'texture',
    description:
      'A swell that takes seconds to rise after each silence, then a string pad with a second section an octave above, into a far-off hall.',
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 2610, release: 711 } },
      { deviceId: 'pad-follower', preset: 'Octave halo', params: { rise: 0.93, fall: 4.55 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { lowDecay: 4.96, midDecay: 5.02 } },
    ],
  },
  {
    id: 'ashram-bluff-top-pad',
    name: 'Bluff-top pad',
    category: 'texture',
    description:
      'A slow compressor that evens out swells over seconds, then a dark, round pad that melts slowly from chord to chord.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level' },
      { deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 1.14, glide: 2.37 } },
    ],
  },
  {
    id: 'ashram-basses-pitched-low',
    name: 'Basses pitched low',
    category: 'texture',
    description:
      'A dark string pad doubled an octave below the playing, then two copies in tune that wander like extra takes.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Low section', params: { rise: 0.742, fall: 5.42 } },
      { deviceId: 'stereo-detune', preset: 'Drifting' },
    ],
  },
  {
    id: 'ashram-hold-past-the-gate',
    name: 'Hold past the gate',
    category: 'texture',
    description:
      'Every note sustained after it is played, with no smearing, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Clean sustain' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 5.31 } },
    ],
  },
  {
    id: 'ashram-strings-pitched-low',
    name: 'Strings pitched low',
    category: 'texture',
    description:
      'A dark, low string pad like cellos under the playing, then a steep low-pass at four hundred hertz, the top gone.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos' },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { lfoRateHz: 1.04, envAttackMs: 9.91, envReleaseMs: 180 },
      },
    ],
  },
  {
    id: 'ashram-cross-legged-voices',
    name: 'Cross-legged voices',
    category: 'texture',
    description:
      'A held pad whose every overtone wavers, like a choir, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'sustainer', preset: 'Wavering choir', params: { attack: 0.352, glide: 0.589 } },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'ashram-brass-lamp-felt',
    name: 'Brass-lamp felt',
    category: 'texture',
    description:
      'A muffled pad with all its top taken off, slow to fade, then a bucket-brigade echo with a slow chorus on its repeats.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Felted pad', params: { rise: 0.837, fall: 13.5 } },
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 284, modRate: 1 } },
    ],
  },
  {
    id: 'ashram-sandalwood-pad',
    name: 'Sandalwood pad',
    category: 'texture',
    description:
      'A wide string pad that picks up even the softest notes, into twelve strings in A minor that ring with notes in that key.',
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Catch all',
        params: { rise: 0.22, fall: 8.89, mix: 0.302 },
      },
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { decay: 4.01, mix: 0.27 } },
    ],
  },
  {
    id: 'ashram-courtyard-depths',
    name: 'Courtyard depths',
    category: 'texture',
    description:
      'A low blurred bed under the sound, nothing above the bass, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Sub bed' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 4.86 } },
    ],
  },
  {
    id: 'ashram-shadow-between-sets',
    name: 'Shadow between sets',
    category: 'texture',
    description:
      'A slow swell after each silence, with some dry attack left, into a small room that sparkles two octaves above the sound.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1520, release: 318 } },
      { deviceId: 'shimmer', preset: 'Sparkle room', params: { decay: 1.08, predelay: 18.8 } },
    ],
  },
  {
    id: 'ashram-lotus-pond-drawbars',
    name: 'Lotus-pond drawbars',
    category: 'pitch',
    description:
      'Every note doubled one and two octaves below and above, then a fast rotating speaker whose drum pulses the lows deeply.',
    effects: [
      { deviceId: 'octaves', preset: 'Organ' },
      { deviceId: 'rotary', preset: 'Heavy rotors' },
    ],
  },
  {
    id: 'ashram-last-set-pipes',
    name: 'Last-set pipes',
    category: 'pitch',
    description:
      'Four octaves of pipes that swell in behind each note, then a slow rotating speaker heard through one microphone.',
    effects: [
      { deviceId: 'octaves', preset: 'Cathedral' },
      { deviceId: 'rotary', preset: 'Mono cabinet' },
    ],
  },
  {
    id: 'ashram-floor-cushion-jangle',
    name: 'Floor-cushion jangle',
    category: 'pitch',
    description:
      'A detuned octave above each note, like doubled strings, then a slow rotating speaker that is mostly its low, dark drum.',
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string' },
      { deviceId: 'rotary', preset: 'Dark drum' },
    ],
  },
  {
    id: 'ashram-pipes-past-the-gate',
    name: 'Pipes past the gate',
    category: 'pitch',
    description:
      'Four octaves of pipes that swell in behind each note, then a fast rotating speaker with its amplifier growling.',
    effects: [
      { deviceId: 'octaves', preset: 'Cathedral', params: { attack: 0.331 } },
      { deviceId: 'rotary', preset: 'Growl' },
    ],
  },
  {
    id: 'ashram-harp-in-sandalwood',
    name: 'Harp in sandalwood',
    category: 'pitch',
    description:
      'A swell-holding compressor, then a rising pentatonic run, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
      { deviceId: 'lattice', preset: 'Pentatonic harp', params: { output: 2.77 } },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'ashram-altar-octave',
    name: 'Altar octave',
    category: 'pitch',
    description:
      'A single voice an octave below the dry sound, darkened, then a deep slow chorus on a long delay, swaying over seconds.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave down', params: { size: 94.1 } },
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.134 } },
    ],
  },
  {
    id: 'ashram-late-set-sparkle',
    name: 'Late-set sparkle',
    category: 'pitch',
    description:
      'A soft wash of octave and fifth loops over each note, then a huge space that answers in separate far-off echoes, into a huge open valley.',
    effects: [
      { deviceId: 'cascade', preset: 'Sparkle bed', params: { time: 338 } },
      { deviceId: 'expanse', preset: 'Far echoes' },
      { deviceId: 'fdn-reverb', preset: 'Open valley' },
    ],
  },
  {
    id: 'ashram-bare-floor-octave',
    name: 'Bare-floor octave',
    category: 'pitch',
    description:
      'The level breathing in and out about every four seconds, then a single voice an octave above the dry sound.',
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.24 } },
      { deviceId: 'pitch-shifter', preset: 'Octave up', params: { size: 53.1 } },
    ],
  },
  {
    id: 'ashram-up-canyon-chord',
    name: 'Up-canyon chord',
    category: 'pitch',
    description:
      'A pure-tuned third and fifth above, with an octave below, then scattered short grains an octave up, falling like rain.',
    effects: [
      { deviceId: 'lattice', preset: 'Just intonation triad', params: { output: 7 } },
      { deviceId: 'grain-cloud', preset: 'Octave rain', params: { size: 79, density: 6.79 } },
    ],
  },
  {
    id: 'ashram-daybreak-grit',
    name: 'Daybreak grit',
    category: 'master',
    description:
      'Dark, thick valve grit, then a pluck-taming compressor, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit' },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -5.52 } },
    ],
  },
  {
    id: 'ashram-iron-at-sundown',
    name: 'Iron at sundown',
    category: 'master',
    description:
      'A low, warm transformer, then a scooped, hollow tone, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.67 } },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'ashram-coastal-tape',
    name: 'Coastal tape',
    category: 'master',
    description:
      'A tape preamp pushed just enough to add weight, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.36, gain: -2.4 } },
    ],
  },
  {
    id: 'ashram-sunday-reel',
    name: 'Sunday reel',
    category: 'master',
    description:
      'A tape-style curve only just leaned on, then a quicker compressor, then a safety limiter with its ceiling brought down a little.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'ambient-comp', preset: 'Mic' },
      { deviceId: 'fet-limiter', preset: 'Lower ceiling', params: { outputGain: 2.31 } },
    ],
  },
  {
    id: 'ashram-stone-step-tape',
    name: 'Stone-step tape',
    category: 'master',
    description:
      'A reel driven hot, then an equaliser that adds lows and body and eases the top, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'tape', preset: 'Hot glue' },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.52 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { gain: -2.58 } },
    ],
  },
  {
    id: 'ashram-ochre-tape',
    name: 'Ochre tape',
    category: 'master',
    description:
      'A reel of tape, then a gentle compressor that sets the sound a little way back, then a true-peak ceiling with the level pushed up into it.',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 88, release: 1.84 } },
      { deviceId: 'ambient-limiter', preset: 'Loud', params: { release: 2.53, gain: 2.34 } },
    ],
  },
]
