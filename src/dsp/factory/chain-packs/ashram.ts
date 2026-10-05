// Ashram Harp and Organ: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
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
      'A dark amplifier stack with the bass full up and no treble, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly', params: { output: -2.86 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 18.1 } },
    ],
  },
  {
    id: 'ashram-plate-till-daybreak',
    name: 'Plate till daybreak',
    category: 'space',
    description:
      'A bowed swell that lets part of each attack through, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 263, release: 135 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
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
    id: 'ashram-plate-at-sundown',
    name: 'Plate at sundown',
    category: 'space',
    description:
      'Tape-style saturation that rounds peaks and dulls the top, into a medium plate with a smooth tail of a few seconds.',
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
      'A dense many-notched phaser drifting opposite on each side, into a far-off room laid in beneath the sound.',
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { rate: 0.125 } },
      { deviceId: 're-amp', preset: 'Room underneath', params: { output: 6.57 } },
    ],
  },
  {
    id: 'ashram-shrine-hall',
    name: 'Shrine hall',
    category: 'space',
    description:
      'A smooth swell that brings every note in like bowed strings, into an undamped hall with about three seconds of tail.',
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
    id: 'ashram-stone-step-ring',
    name: 'Stone-step ring',
    category: 'space',
    description:
      'Sixteen strings in C major that ring for about ten seconds, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Long ring' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'ashram-ring-by-the-lamp',
    name: 'Ring by the lamp',
    category: 'space',
    description:
      'Sixteen strings that learn the tune and ring on long, into a hint of open space behind the sound.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Learn and hold' },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
  },
  {
    id: 'ashram-ring-in-saffron',
    name: 'Ring in saffron',
    category: 'space',
    description:
      'A wide wash of sixteen long strings in D minor, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor wash', params: { decay: 9.9, mix: 0.504 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.24 } },
    ],
  },
  {
    id: 'ashram-pilgrim-whisper',
    name: 'Pilgrim whisper',
    category: 'space',
    description:
      'A fast, steady reel with soft saturation, into a medium hall with only a breath of voice in its tail.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { decay: 3.4, preDelay: 19.7 } },
    ],
  },
  {
    id: 'ashram-devotional-choir',
    name: 'Devotional choir',
    category: 'space',
    description:
      'A soft sung "oo" that trails each note by a moment, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Oo behind' },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 52.6, lowDecay: 4.49, midDecay: 3.27 },
      },
    ],
  },
  {
    id: 'ashram-evening-murmur',
    name: 'Evening murmur',
    category: 'space',
    description:
      'A dull closed-mouth hum of deep voices behind the sound, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Humming', params: { decay: 9.36, preDelay: 17.6 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { decay: 2.84, breathRate: 0.272 } },
    ],
  },
  {
    id: 'ashram-camphor-choir',
    name: 'Camphor choir',
    category: 'space',
    description:
      'A big lift of the low end that puts weight under the sound, into a reverb whose deep voices come in late on a sung "ee".',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.09 } },
      { deviceId: 'vowel-reverb', preset: 'Late basses' },
    ],
  },
  {
    id: 'ashram-fifths-in-no-hurry',
    name: 'Fifths in no hurry',
    category: 'space',
    description:
      'A reverb whose tail drifts up towards the fifth as it rings, into a hard-driven two-spring tank that answers a moment late.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Rising fifths', params: { decay: 8.19 } },
      { deviceId: 'spring-reverb', preset: 'Dub send', params: { decay: 3.05, predelay: 52.7 } },
    ],
  },
  {
    id: 'ashram-evening-raga-space',
    name: 'Evening-raga space',
    category: 'space',
    description:
      'A wide open space with a slowly wavering tail, then a wavering double of the sound spread wide to both sides.',
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.315 } },
      { deviceId: 'analog-delay', preset: 'Doubler', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ashram-canyon-road-choir',
    name: 'Canyon-road choir',
    category: 'space',
    description:
      'An equaliser that takes presence, air and lows away, into a huge hall whose tail hums a soft "oo" for a long while.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.4 } },
      { deviceId: 'vowel-reverb', preset: 'Endless oo' },
    ],
  },
  {
    id: 'ashram-wash-in-the-grove',
    name: 'Wash in the grove',
    category: 'space',
    description:
      'A plate wash that hangs on for half a minute, then a fast reel with no hiss, driven hard so peaks are squashed.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 63.5 } },
      { deviceId: 'tape', preset: 'Hot glue' },
    ],
  },
  {
    id: 'ashram-dry-creek-choir',
    name: 'Dry-creek choir',
    category: 'space',
    description:
      'A half-hidden slow swell, then a reverb whose deep voices come in late on a sung "ee", into three long-ringing springs that chirp and drip.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1420, release: 317 } },
      { deviceId: 'vowel-reverb', preset: 'Late basses' },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { decay: 4.23 } },
    ],
  },
  {
    id: 'ashram-daybreak-ring',
    name: 'Daybreak ring',
    category: 'space',
    description:
      'A big lift of presence and air, into thirteen drone strings in D major kept near the centre.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright', params: { clearTime: 0.531 } },
      { deviceId: 'sympathetic', preset: 'Sitar drone', params: { mix: 0.24 } },
    ],
  },
  {
    id: 'ashram-last-set-ring',
    name: 'Last-set ring',
    category: 'space',
    description:
      'Ten strings that tune themselves to the notes they hear, into a small bright chamber that goes on ringing for seconds.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { decay: 4.42, mix: 0.3 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Small bright tank',
        params: { decay: 7.11, breathRate: 0.28, mix: 0.24 },
      },
    ],
  },
  {
    id: 'ashram-plate-in-the-grove',
    name: 'Plate in the grove',
    category: 'space',
    description:
      'A plate heard alone with none of the dry sound left, then two copies heard just after the sound, the left one first.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
      { deviceId: 'stereo-detune', preset: 'Late copy' },
    ],
  },
  {
    id: 'ashram-chaparral-echo',
    name: 'Chaparral echo',
    category: 'space',
    description:
      'Two copies a few cents sharp and flat, left and right, then a short, soft tape echo close behind the playing.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Doubler', params: { mix: 0.373 } },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'ashram-sundown-halo',
    name: 'Sundown halo',
    category: 'space',
    description:
      'A short bright room whose tail splits a fifth up and down, into a long bright reverb tail kept low behind the sound.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Quick sparkle' },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'ashram-rosewood-echo',
    name: 'Rosewood echo',
    category: 'echo',
    description:
      'An echo whose repeats hop up a fifth and down a fourth, into a reverb that swells up behind each note and cuts off.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { time: 344, modRate: 0.536 } },
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 1.3 } },
    ],
  },
  {
    id: 'ashram-jasmine-trail',
    name: 'Jasmine trail',
    category: 'echo',
    description:
      'A rotating speaker on its slow speed, then a slow echo with a long dark trail as earlier phrases return.',
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
      'A pan that wanders to a new place every second or so, then a clean, steady echo with no wobble and little dulling.',
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
      'A transformer driven so the low end thickens and loosens, then a tape echo whose three heads make a cluster of each repeat.',
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
      'A short echo whose pitch sways like a seasick vibrato, into a damped hall of about five seconds, heard from far off.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Seasick', params: { time: 165, modRate: 3.11 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.597 } },
    ],
  },
  {
    id: 'ashram-echo-pitched-low',
    name: 'Echo pitched low',
    category: 'echo',
    description:
      'A dark slow rotating speaker that mostly turns the lows, then an echo that slides down an octave like tape slowed by hand.',
    effects: [
      { deviceId: 'rotary', preset: 'Dark drum' },
      { deviceId: 'analog-delay', preset: 'Falling tape', params: { time: 507 } },
    ],
  },
  {
    id: 'ashram-rose-petal-drift',
    name: 'Rose-petal drift',
    category: 'echo',
    description:
      'A low-thickening transformer, then a wide echo whose repeats drift slowly in pitch, into a hall humming a long "oo".',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'analog-delay', preset: 'Slow drift', params: { time: 594, modRate: 0.088 } },
      { deviceId: 'vowel-reverb', preset: 'Endless oo' },
    ],
  },
  {
    id: 'ashram-loop-up-the-canyon',
    name: 'Loop up the canyon',
    category: 'echo',
    description:
      'A tape loop whose passes cross from side to side, into three springs heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Crossing sides', params: { length: 1.54 } },
      { deviceId: 'spring-reverb', preset: 'Tank alone', params: { decay: 3.35 } },
    ],
  },
  {
    id: 'ashram-dusk-trail',
    name: 'Dusk trail',
    category: 'echo',
    description:
      'A slow tape echo with a long trail that dulls as it goes, then an equaliser that takes presence, air and lows away.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { time: 1570 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'ashram-cathedral-in-saffron',
    name: 'Cathedral in saffron',
    category: 'tape',
    description:
      'A tape reel with soft saturation, slight wobble and hiss, into a cathedral whose long tail sings a soft open "ah".',
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
      'A tape reel pushed hard, saturated and thick, into a reverb whose choir wanders from vowel to vowel.',
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
      'A thick, soft cassette, full in the lows and dull on top, into a large reverb whose tail hums a deep "oh" in bass voices.',
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
    id: 'ashram-marigold-tape',
    name: 'Marigold tape',
    category: 'tape',
    description:
      'A thick, soft cassette, full in the lows and dull on top, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'fdn-reverb', preset: 'Breathing' },
    ],
  },
  {
    id: 'ashram-sunday-cassette',
    name: 'Sunday cassette',
    category: 'tape',
    description:
      'A hollow, resonant phaser turning about every four seconds, then a thick, soft cassette, full in the lows and dull on top.',
    effects: [
      { deviceId: 'phaser', preset: 'Negative notch' },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'ashram-sun-warmed-cassette',
    name: 'Sun-warmed cassette',
    category: 'tape',
    description:
      'A four-track cassette, dull on top, unsteady and hissing, then an echo whose repeats jump up an octave and back.',
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { output: -3.19 } },
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { time: 395, modRate: 0.579 } },
    ],
  },
  {
    id: 'ashram-dim-lamp-cassette',
    name: 'Dim-lamp cassette',
    category: 'tape',
    description:
      'A thick, soft cassette, full in the lows and dull on top, into a quick bright twang of springs behind each attack.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump', params: { output: -3.27 } },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { decay: 0.789 } },
    ],
  },
  {
    id: 'ashram-sway-with-garlands',
    name: 'Sway with garlands',
    category: 'tape',
    description:
      'A hot valve stage, then a warped record through a dark cartridge, swaying slowly, into a hint of a two-spring tank behind the sound.',
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { output: -6.74 } },
      { deviceId: 'vinyl', preset: 'Slow platter' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { decay: 1.58 } },
    ],
  },
  {
    id: 'ashram-rose-water-rotary',
    name: 'Rose-water rotary',
    category: 'motion',
    description:
      'A combo amplifier driven hard and recorded right up close, then a clean slow rotating speaker blended under the dry sound, into a vast nave.',
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { output: -5.41 } },
      { deviceId: 'rotary', preset: 'Soft blend' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'ashram-half-heard-swirl',
    name: 'Half-heard swirl',
    category: 'motion',
    description:
      'A driven valve amplifier, then a fast rotating speaker heard from far off, smooth and even, into a long plate with a wide and even tail.',
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
      'Light tape-style saturation, then a distant, slow rotary, into two taut springs that ring long and clean with no drip.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'spring-reverb', preset: 'Tight long tank' },
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
    id: 'ashram-chorus-in-sage',
    name: 'Chorus in sage',
    category: 'motion',
    description:
      'A plain chorus with a detuned copy towards each side, into a wordless choir alone with none of the dry sound left.',
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.742, delayMs: 11.5 } },
      { deviceId: 'vowel-reverb', preset: 'Choir alone', params: { decay: 9.23, preDelay: 22.2 } },
    ],
  },
  {
    id: 'ashram-sycamore-rotary',
    name: 'Sycamore rotary',
    category: 'motion',
    description:
      'A tape preamp driven for thick lows and a dull top, then a fast rotating speaker with its amplifier growling, into a bright plate.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -7.31 } },
      { deviceId: 'rotary', preset: 'Growl' },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'ashram-incense-rotary',
    name: 'Incense rotary',
    category: 'motion',
    description:
      'A tape preamp pushed just enough to add weight, then a rotating speaker on its slow speed, into a medium plate.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { predelayMs: 22.2 } },
    ],
  },
  {
    id: 'ashram-ring-for-evening',
    name: 'Ring for evening',
    category: 'motion',
    description:
      'Thirteen drone strings in D major kept near the centre, then a dark slow rotating speaker that mostly turns the lows.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Sitar drone', params: { mix: 0.24 } },
      { deviceId: 'rotary', preset: 'Dark drum' },
    ],
  },
  {
    id: 'ashram-prayer-hour-drone',
    name: 'Prayer-hour drone',
    category: 'motion',
    description:
      'Thirteen drone strings in D major kept near the centre, then a deep eight-stage phaser with sharp peaks between notches.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Sitar drone', params: { decay: 6.46 } },
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.19 } },
    ],
  },
  {
    id: 'ashram-sunday-halo',
    name: 'Sunday halo',
    category: 'motion',
    description:
      'Eight strings in C major that ring on as under a held pedal, then a six-stage phaser turning about every three seconds.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Piano pedal' },
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.273 } },
    ],
  },
  {
    id: 'ashram-cross-legged-ring',
    name: 'Cross-legged ring',
    category: 'motion',
    description:
      'Four long strings on an A minor chord held in the centre, then a four-stage phaser kept high, leaving the low end alone.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Centre drone' },
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.338, mix: 0.357 } },
    ],
  },
  {
    id: 'ashram-back-room-rotary',
    name: 'Back-room rotary',
    category: 'motion',
    description:
      'A slow rotating speaker heard from across the room, into one taut dull spring that answers late and rings long.',
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'spring-reverb', preset: 'Dark late coil' },
    ],
  },
  {
    id: 'ashram-lotus-pond-rotary',
    name: 'Lotus-pond rotary',
    category: 'motion',
    description:
      'A slow rotating speaker heard from across the room, into a short reverb that swells in just after each note.',
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'expanse', preset: 'Quick swell' },
    ],
  },
  {
    id: 'ashram-live-oak-rotary',
    name: 'Live-oak rotary',
    category: 'motion',
    description:
      'A rotating speaker on its slow speed, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'ashram-dry-season-swell',
    name: 'Dry-season swell',
    category: 'motion',
    description:
      'A hollow chorus that swells over about ten seconds, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'chorus', preset: 'Hollow swell', params: { rate: 0.104, delayMs: 8.14 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { preDelay: 89.3, midDecay: 7.28 } },
    ],
  },
  {
    id: 'ashram-brass-lamp-rotary',
    name: 'Brass-lamp rotary',
    category: 'motion',
    description:
      'A fast rotating speaker that pulses the lows deeply, then a steady tape echo with no wobble, dirt or dulling.',
    effects: [
      { deviceId: 'rotary', preset: 'Heavy rotors' },
      { deviceId: 'tape-echo', preset: 'Clean and steady', params: { time: 413, mix: 0.198 } },
    ],
  },
  {
    id: 'ashram-oil-lamp-rotary',
    name: 'Oil-lamp rotary',
    category: 'motion',
    description:
      'A fast rotating speaker with its amplifier growling, into a dull reverb that swells in over seconds and fades slowly.',
    effects: [
      { deviceId: 'rotary', preset: 'Growl' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'ashram-chorus-after-prayers',
    name: 'Chorus after prayers',
    category: 'motion',
    description:
      'A tape reel pushed hard, saturated and thick, then a deep slow chorus, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard', params: { output: -5.01 } },
      { deviceId: 'chorus', preset: 'Deep sea' },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { predelayMs: 39.7 } },
    ],
  },
  {
    id: 'ashram-kneeling-rotary',
    name: 'Kneeling rotary',
    category: 'motion',
    description:
      'A big lift of the low end that puts weight under the sound, then a fast rotating speaker that pulses the lows deeply.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.32 } },
      { deviceId: 'rotary', preset: 'Heavy rotors' },
    ],
  },
  {
    id: 'ashram-chorus-in-marigolds',
    name: 'Chorus in marigolds',
    category: 'motion',
    description:
      'A late copy on each side, like the same part played twice, then a wide string pad that never stops shifting and shimmering.',
    effects: [
      { deviceId: 'chorus', preset: 'Loose double' },
      { deviceId: 'pad-follower', preset: 'Restless' },
    ],
  },
  {
    id: 'ashram-twilight-drift',
    name: 'Twilight drift',
    category: 'motion',
    description:
      'Tape-style saturation that rounds peaks and dulls the top, then a wandering pan, into a hall with long lows.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { outputDb: -12.1 } },
      { deviceId: 'tremolo', preset: 'Wandering pan' },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 64.1, midDecay: 1.93 },
      },
    ],
  },
  {
    id: 'ashram-hilltop-chorus',
    name: 'Hilltop chorus',
    category: 'motion',
    description:
      'A thick ensemble chorus turning about every two seconds, then a slow rotating speaker with its amplifier driven hard.',
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble' },
      { deviceId: 'rotary', preset: 'Slow burn' },
    ],
  },
  {
    id: 'ashram-rosewood-rotary',
    name: 'Rosewood rotary',
    category: 'motion',
    description:
      'A rotating speaker on its slow speed, into sixteen hard-driven strings in F major that ring for seconds.',
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'sympathetic', preset: 'Glass harp', params: { decay: 7.8, mix: 0.42 } },
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
      'A blurred bed of bass that hangs low under the sound, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Sub bed' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 4.86 } },
    ],
  },
  {
    id: 'ashram-coastal-unison',
    name: 'Coastal unison',
    category: 'texture',
    description:
      'A half-hidden slow swell, then a string voice that doubles each note almost at once, into a hall with long lows.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1260, release: 297 } },
      { deviceId: 'pad-follower', preset: 'Doubler' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'ashram-stone-step-drone',
    name: 'Stone-step drone',
    category: 'texture',
    description:
      'A slow drone that swells from the playing and never fades, into a hard-driven two-spring tank that answers a moment late.',
    effects: [
      { deviceId: 'sustainer', preset: 'Endless drone', params: { attack: 3.23, glide: 3.95 } },
      { deviceId: 'spring-reverb', preset: 'Dub send' },
    ],
  },
  {
    id: 'ashram-glow-for-the-altar',
    name: 'Glow for the altar',
    category: 'texture',
    description:
      'A short glow of held tone that dies just after each note, then a high cut set low enough to muffle everything.',
    effects: [
      { deviceId: 'sustainer', preset: 'Brief afterglow', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.67 } },
    ],
  },
  {
    id: 'ashram-pad-before-dawn',
    name: 'Pad before dawn',
    category: 'texture',
    description:
      'A held tone that takes over each note at once and soon fades, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'sustainer', preset: 'Quick catch', params: { attack: 0.0197, glide: 0.048 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'ashram-harmony-under-oaks',
    name: 'Harmony under oaks',
    category: 'texture',
    description:
      'A held pad where each new chord piles onto the last, then a slow reel that sways, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'sustainer', preset: 'Stacked harmony' },
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 5.12 } },
    ],
  },
  {
    id: 'ashram-undertow-on-the-hill',
    name: 'Undertow on the hill',
    category: 'texture',
    description:
      'A blurred bed of bass that hangs low under the sound, into sixteen strings that learn the tune and ring on long.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Sub bed' },
      { deviceId: 'sympathetic', preset: 'Learn and hold' },
    ],
  },
  {
    id: 'ashram-pad-in-no-hurry',
    name: 'Pad in no hurry',
    category: 'texture',
    description:
      'A held pad that swells in slowly like bowed strings, then a slow rotating speaker heard from across the room.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings' },
      { deviceId: 'rotary', preset: 'Across the room' },
    ],
  },
  {
    id: 'ashram-daybreak-pad',
    name: 'Daybreak pad',
    category: 'texture',
    description:
      'A held pad that stands alone in place of what was played, into a small dark room that is gone in about a second.',
    effects: [
      { deviceId: 'sustainer', preset: 'Held sound alone' },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'ashram-rose-water-pad',
    name: 'Rose-water pad',
    category: 'texture',
    description:
      'A held pad whose every overtone wavers in pitch and level, into three springs heard alone with none of the dry sound left.',
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Wavering choir',
        params: { attack: 0.386, glide: 0.57, mix: 0.39 },
      },
      { deviceId: 'spring-reverb', preset: 'Tank alone', params: { decay: 3.1 } },
    ],
  },
  {
    id: 'ashram-wood-smoke-pad',
    name: 'Wood-smoke pad',
    category: 'texture',
    description:
      'A held pad caught from each chord that glides to the next, then a high cut set low enough to muffle everything.',
    effects: [
      { deviceId: 'sustainer', preset: 'Sustain pedal', params: { attack: 0.233, glide: 0.397 } },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.57 } },
    ],
  },
  {
    id: 'ashram-altar-octave',
    name: 'Altar octave',
    category: 'pitch',
    description:
      'A single darkened voice an octave below the dry sound, then a deep slow chorus on a long delay, swaying over seconds.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave down', params: { size: 94.1 } },
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.134 } },
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
      'A pure-tuned third, fifth and low octave in C major, then scattered short grains an octave up, falling like rain.',
    effects: [
      { deviceId: 'lattice', preset: 'Just intonation triad', params: { output: 7 } },
      { deviceId: 'grain-cloud', preset: 'Octave rain', params: { size: 79, density: 6.79 } },
    ],
  },
  {
    id: 'ashram-octaves-by-the-creek',
    name: 'Octaves by the creek',
    category: 'pitch',
    description:
      'Four octaves that swell in on each note, like a pipe organ, then a slow rotating speaker heard through one microphone.',
    effects: [
      { deviceId: 'octaves', preset: 'Cathedral' },
      { deviceId: 'rotary', preset: 'Mono cabinet' },
    ],
  },
  {
    id: 'ashram-ochre-swell',
    name: 'Ochre swell',
    category: 'pitch',
    description:
      'A deep bass two octaves down that swells in slowly, then a dark slow rotating speaker that mostly turns the lows.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals', params: { attack: 1.41 } },
      { deviceId: 'rotary', preset: 'Dark drum' },
    ],
  },
  {
    id: 'ashram-glow-by-the-creek',
    name: 'Glow by the creek',
    category: 'pitch',
    description:
      'High octaves that fade in late above each note, then a rotating speaker on its fast speed.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow halo' },
      { deviceId: 'rotary', preset: 'Tremolo' },
    ],
  },
  {
    id: 'ashram-hilltop-octave',
    name: 'Hilltop octave',
    category: 'pitch',
    description:
      'A detuned octave above each note, like doubled strings, then a rotating speaker on its fast speed.',
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string' },
      { deviceId: 'rotary', preset: 'Tremolo' },
    ],
  },
  {
    id: 'ashram-lotus-pond-shimmer',
    name: 'Lotus-pond shimmer',
    category: 'pitch',
    description:
      'Grains fed back an octave up, climbing higher each pass, then a slow-speed reel with a quick flutter against the dry sound.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Rising shimmer' },
      { deviceId: 'tape', preset: 'Flutter shimmer' },
    ],
  },
  {
    id: 'ashram-depths-in-sage',
    name: 'Depths in sage',
    category: 'pitch',
    description:
      'A soft, deep bass one and two octaves below each note, then a tape loop about one second long that soon dies away.',
    effects: [
      { deviceId: 'octaves', preset: 'Deep' },
      { deviceId: 'tape-loop', preset: 'One second round', params: { length: 1.07 } },
    ],
  },
  {
    id: 'ashram-pilgrim-polish',
    name: 'Pilgrim polish',
    category: 'master',
    description:
      'A gentle compressor, then a slightly wider image, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 104, release: 1.77 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { release: 1.37, gain: 3.85 } },
    ],
  },
  {
    id: 'ashram-dry-creek-mixdown',
    name: 'Dry-creek mixdown',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a parallel compressor, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Lift' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { release: 1.39 } },
    ],
  },
  {
    id: 'ashram-bluff-top-finish',
    name: 'Bluff-top finish',
    category: 'master',
    description:
      'A few decibels of soft saturation with the top eased, then a subsonic cut, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 2.71 } },
      { deviceId: 'fet-limiter', preset: 'Light touch', params: { outputGain: -5.9 } },
    ],
  },
  {
    id: 'ashram-barefoot-polish',
    name: 'Barefoot polish',
    category: 'master',
    description:
      'A fresh reel of tape, then a slow compressor that evens out swells over seconds, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-comp', preset: 'Level' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.41 } },
    ],
  },
  {
    id: 'ashram-mixdown-in-saffron',
    name: 'Mixdown in saffron',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a true-peak ceiling that lets go again over several seconds.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
  {
    id: 'ashram-hillside-mixdown',
    name: 'Hillside mixdown',
    category: 'master',
    description:
      'Tape-style saturation that rounds only the loudest peaks, then an even-handed compressor, then a safety limiter.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'ambient-comp', preset: 'Keys', params: { attack: 105, release: 1.32 } },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
]
