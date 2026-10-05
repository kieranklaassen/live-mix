// Museum Window Garden: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'window-garden-midday-patter',
    name: 'Midday patter',
    category: 'space',
    description:
      'A fine patter of thin high echoes with no bass in them, into a plain hall of about four seconds.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Glass rain' },
      { deviceId: 'vowel-reverb', preset: 'Plain hall' },
    ],
  },
  {
    id: 'window-garden-room-in-daylight',
    name: 'Room in daylight',
    category: 'space',
    description:
      'A second take either side, a little late and out of tune, into a bright wide room that rings for a second or two.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { delay: 30.8 } },
      { deviceId: 'ether-reverb', preset: 'Ether' },
    ],
  },
  {
    id: 'window-garden-glinting-hall',
    name: 'Glinting hall',
    category: 'space',
    description:
      'A quick patter of separate echoes behind each note, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { length: 0.312, glide: 0.608 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air' },
    ],
  },
  {
    id: 'window-garden-hall-by-the-door',
    name: 'Hall by the door',
    category: 'space',
    description:
      'A rotating speaker at a standstill, heard close and in mono, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'rotary', preset: 'Stopped horn' },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'window-garden-hall-in-the-foyer',
    name: 'Hall in the foyer',
    category: 'space',
    description:
      'A far-off room laid in under the untouched sound, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 're-amp', preset: 'Room underneath' },
      {
        deviceId: 'hall-reverb',
        preset: 'Bright hall',
        params: { preDelay: 36.4, lowDecay: 2.01, midDecay: 3.21 },
      },
    ],
  },
  {
    id: 'window-garden-closed-day-hall',
    name: 'Closed-day hall',
    category: 'space',
    description:
      'A hall whose lows outlast its damped top, then a plain chorus with a detuned copy towards each side.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 45.6, lowDecay: 4.03, midDecay: 2.63 },
      },
      { deviceId: 'chorus', preset: 'Classic chorus' },
    ],
  },
  {
    id: 'window-garden-close-walled-cell',
    name: 'Close-walled cell',
    category: 'space',
    description:
      'Two dull copies that wander in a haze round the notes, into a small dark room that is gone in about a second.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Piano haze', params: { delay: 16.2 } },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'window-garden-pebble-hall',
    name: 'Pebble hall',
    category: 'space',
    description:
      'A wavering double of the sound spread wide to both sides, into a hall that answers about a quarter of a second late.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Doubler' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Late arrival',
        params: { decay: 5.46, breathRate: 0.327 },
      },
    ],
  },
  {
    id: 'window-garden-patter-by-the-basin',
    name: 'Patter by the basin',
    category: 'space',
    description:
      'One slow scatter of echoes over about a second and no tail, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Long scatter', params: { length: 1.09, glide: 0.553 } },
      { deviceId: 'fdn-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'window-garden-patter-by-the-door',
    name: 'Patter by the door',
    category: 'space',
    description:
      'A quick patter of separate echoes behind each note, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { length: 0.386, glide: 0.565 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'window-garden-foyer-echoes',
    name: 'Foyer echoes',
    category: 'space',
    description:
      'A handful of separate echoes that fall away and repeat, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Scattered' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 4.4 } },
    ],
  },
  {
    id: 'window-garden-hall-in-a-vitrine',
    name: 'Hall in a vitrine',
    category: 'space',
    description:
      'A big lift of presence and air, with ringing held in check, then a soft slapback echo close behind each note, into an undamped hall.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright' },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 97.5, modRate: 0.529 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Bright hall',
        params: { preDelay: 44.4, lowDecay: 1.83, midDecay: 2.99 },
      },
    ],
  },
  {
    id: 'window-garden-echo-at-opening',
    name: 'Echo at opening',
    category: 'space',
    description:
      'A few decibels of soft saturation with the top eased, then a short, soft tape echo close behind the playing.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: -4.58 } },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 174 } },
    ],
  },
  {
    id: 'window-garden-plate-after-drizzle',
    name: 'Plate after drizzle',
    category: 'space',
    description:
      'A small chapel with a short sung eh in its tail, into a medium plate with a smooth tail of a few seconds.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Chapel', params: { decay: 1.7, preDelay: 5.61 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { predelayMs: 19.6 } },
    ],
  },
  {
    id: 'window-garden-celadon-echoes',
    name: 'Celadon echoes',
    category: 'space',
    description:
      'A few decibels of soft saturation with the top eased, into a quick patter of separate echoes behind each note.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: -5.49 } },
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { length: 0.325, glide: 0.595 } },
    ],
  },
  {
    id: 'window-garden-brookside-hall',
    name: 'Brookside hall',
    category: 'space',
    description:
      'A big lift of presence and air, with ringing held in check, into a medium hall with only a breath of voice in its tail.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright' },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { decay: 3.93, preDelay: 19 } },
    ],
  },
  {
    id: 'window-garden-raked-gravel-plate',
    name: 'Raked-gravel plate',
    category: 'space',
    description:
      'A warm, full equaliser, then a far-off room laid in under the untouched sound, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.44 } },
      { deviceId: 're-amp', preset: 'Room underneath' },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'window-garden-cypress-plate',
    name: 'Cypress plate',
    category: 'space',
    description:
      'A bright undamped plate of a couple of seconds, then a big lift of presence and air, with ringing held in check.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
      { deviceId: 'ambient-eq', preset: 'Bright' },
    ],
  },
  {
    id: 'window-garden-tea-bowl-hall',
    name: 'Tea-bowl hall',
    category: 'space',
    description:
      'A triode valve stage, smoothly overdriven, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { preDelay: 27.9, midDecay: 4.4 } },
    ],
  },
  {
    id: 'window-garden-hall-left-plain',
    name: 'Hall left plain',
    category: 'space',
    description:
      'A gentle high cut that shades the top end, then a tight tape cluster, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.54 } },
      { deviceId: 'tape-echo', preset: 'Tiny room cluster', params: { time: 87 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.271 } },
    ],
  },
  {
    id: 'window-garden-courtyard-room',
    name: 'Courtyard room',
    category: 'space',
    description:
      'A plain chorus with a detuned copy towards each side, into a reverb that fades evenly to nothing in a second or two.',
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus' },
      { deviceId: 'shaped-reverb', preset: 'Falling', params: { time: 1.57, preDelay: 21.2 } },
    ],
  },
  {
    id: 'window-garden-weekday-room',
    name: 'Weekday room',
    category: 'space',
    description:
      'A trace of chorus on the top of the sound only, into a tight cluster of echoes close behind each note.',
    effects: [
      { deviceId: 'chorus', preset: 'Faint air', params: { rate: 0.264, delayMs: 10.5 } },
      { deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { length: 0.0926, glide: 0.547 } },
    ],
  },
  {
    id: 'window-garden-sparrow-hall',
    name: 'Sparrow hall',
    category: 'space',
    description:
      'A single saturated tape echo close behind each note, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 4.23, breathRate: 0.32 } },
    ],
  },
  {
    id: 'window-garden-windless-hall',
    name: 'Windless hall',
    category: 'space',
    description:
      'A string voice that doubles each note almost at once, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Doubler', params: { rise: 0.0519, fall: 0.887 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'window-garden-wagtail-swell',
    name: 'Wagtail swell',
    category: 'space',
    description:
      'A fast, steady reel with soft saturation, into a reverb that swells up behind each note and cuts off.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 1.19 } },
    ],
  },
  {
    id: 'window-garden-windless-sheen',
    name: 'Windless sheen',
    category: 'space',
    description:
      'A valve preamp, gently driven and a little bright on top, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { outputDb: -9.14 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'window-garden-paper-screen-echo',
    name: 'Paper-screen echo',
    category: 'echo',
    description:
      'Tape repeats that lose their lows and thin out as they fade, into a short bright room whose tail splits a fifth up and down.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { time: 356 } },
      { deviceId: 'bloom-reverb', preset: 'Quick sparkle', params: { decay: 1.07 } },
    ],
  },
  {
    id: 'window-garden-raked-gravel-repeats',
    name: 'Raked-gravel repeats',
    category: 'echo',
    description:
      'A bucket-brigade echo whose soft repeats dull as they fade, into a small plate that is gone in a second or two.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 394, modRate: 0.559 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { predelayMs: 9.02 } },
    ],
  },
  {
    id: 'window-garden-echo-by-the-pond',
    name: 'Echo by the pond',
    category: 'echo',
    description:
      'A bucket-brigade echo with a slow chorus on its repeats, into a trace of room around the sound.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 325, modRate: 0.809 } },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'window-garden-guest-book-echo',
    name: 'Guest-book echo',
    category: 'echo',
    description:
      'A faint trace of tape echo behind the playing, into a small dead booth that is gone almost at once.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 484 } },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'window-garden-sliding-door-repeats',
    name: 'Sliding-door repeats',
    category: 'echo',
    description:
      'A bucket-brigade echo whose soft repeats dull as they fade, into a bright wide chamber that is over in about a second.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 360, modRate: 0.656 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'window-garden-echo-before-noon',
    name: 'Echo before noon',
    category: 'echo',
    description:
      'A tape echo whose warm repeats soften as they fade, into a short mono burst of a few close reflections.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { time: 389 } },
      { deviceId: 'shaped-reverb', preset: 'Mono slap', params: { time: 0.154 } },
    ],
  },
  {
    id: 'window-garden-loop-on-tatami',
    name: 'Loop on tatami',
    category: 'echo',
    description:
      'A quick loop of about the last half second that soon fades, into a quick patter of separate echoes behind each note.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Quick loop', params: { length: 0.544 } },
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { length: 0.325, glide: 0.57 } },
    ],
  },
  {
    id: 'window-garden-azalea-echo',
    name: 'Azalea echo',
    category: 'echo',
    description:
      'Tape repeats that lose their lows and thin out as they fade, into a small dead booth that is gone almost at once.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { time: 348 } },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'window-garden-under-eaves-echoes',
    name: 'Under-eaves echoes',
    category: 'echo',
    description:
      'A handful of separate echoes that fall away and repeat, into a single saturated tape echo close behind each note.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Scattered' },
      { deviceId: 'tape-echo', preset: 'Single slap' },
    ],
  },
  {
    id: 'window-garden-atrium-echo',
    name: 'Atrium echo',
    category: 'echo',
    description:
      'A clean, steady echo with no wobble and little dulling, into a medium plate with a smooth tail of a few seconds.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 201, modRate: 0.637 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { predelayMs: 21.2 } },
    ],
  },
  {
    id: 'window-garden-drizzle-echo',
    name: 'Drizzle echo',
    category: 'echo',
    description:
      'A tape echo whose three heads make a cluster of each repeat, into a tiny boxy room that is gone almost at once.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 560 } },
      { deviceId: 'expanse', preset: 'Small box' },
    ],
  },
  {
    id: 'window-garden-stoneware-echo',
    name: 'Stoneware echo',
    category: 'echo',
    description:
      'A four-stage phaser kept high, leaving the low end alone, then a steady tape echo with no wobble, dirt or dulling.',
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.344 } },
      { deviceId: 'tape-echo', preset: 'Clean and steady' },
    ],
  },
  {
    id: 'window-garden-sun-warmed-echo',
    name: 'Sun-warmed echo',
    category: 'echo',
    description:
      'A bucket-brigade echo whose soft repeats dull as they fade, into a short diffuse haze around the sound, like a small room.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 387, modRate: 0.622 } },
      { deviceId: 'spectral-blur', preset: 'Diffuse room' },
    ],
  },
  {
    id: 'window-garden-shoji-loop',
    name: 'Shoji loop',
    category: 'echo',
    description:
      'A low cut that thins the bass, with a little air on top, then a tape loop about a second round that soon dies away.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.52 } },
      { deviceId: 'tape-loop', preset: 'One second round' },
    ],
  },
  {
    id: 'window-garden-echo-under-eaves',
    name: 'Echo under eaves',
    category: 'echo',
    description:
      'A dense many-notched phaser drifting opposite on each side, then a tape echo whose warm repeats soften as they fade.',
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud' },
      { deviceId: 'tape-echo', preset: 'Warm repeats' },
    ],
  },
  {
    id: 'window-garden-lantern-echo',
    name: 'Lantern echo',
    category: 'echo',
    description:
      'A plain echo that is a little darker on each repeat, into a plain room that is gone in a couple of seconds.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Plain echo' },
      { deviceId: 'bloom-reverb', preset: 'Still room' },
    ],
  },
  {
    id: 'window-garden-cypress-echo',
    name: 'Cypress echo',
    category: 'echo',
    description:
      'A plain echo that is a little darker on each repeat, then two copies heard just after the sound, the left one first.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Plain echo',
        params: { time: 360, reach: 21.1, size: 2.83 },
      },
      { deviceId: 'stereo-detune', preset: 'Late copy' },
    ],
  },
  {
    id: 'window-garden-fern-echo',
    name: 'Fern echo',
    category: 'echo',
    description:
      'A tape echo whose three heads make a cluster of each repeat, then a faint, dull echo with a slow chorus on it.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 560 } },
      { deviceId: 'analog-delay', preset: 'Faint halo', params: { time: 288, modRate: 0.361 } },
    ],
  },
  {
    id: 'window-garden-white-wall-echo',
    name: 'White-wall echo',
    category: 'echo',
    description:
      'A hint of wavefolder, then a plain, centred echo rebuilt from grains, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'saturator', preset: 'Folded glass' },
      { deviceId: 'grain-delay', preset: 'Plain repeat', params: { time: 399, size: 109 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 19.3 } },
    ],
  },
  {
    id: 'window-garden-tatami-loop',
    name: 'Tatami loop',
    category: 'echo',
    description:
      'A short tape loop where each pass comes back quieter, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade', params: { length: 1.65 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 35.5, lowDecay: 2.21, midDecay: 2.69 },
      },
    ],
  },
  {
    id: 'window-garden-loop-on-gravel',
    name: 'Loop on gravel',
    category: 'echo',
    description:
      'A thin double-speed tape loop an octave above the playing, into a faint scatter of echoes just behind the sound.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Octave up ghosts', params: { length: 3.08 } },
      { deviceId: 'swarm-reverb', preset: 'Faint scatter' },
    ],
  },
  {
    id: 'window-garden-early-light-echo',
    name: 'Early-light echo',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, then a scooped tone with lows and highs up and the body down.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 648 } },
      { deviceId: 'ambient-eq', preset: 'Hollow' },
    ],
  },
  {
    id: 'window-garden-garden-sampler',
    name: 'Garden sampler',
    category: 'tape',
    description:
      'Early sampler converters, then detuned copies heard alone, into a tight, damped little room close around the sound.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler' },
      { deviceId: 'stereo-detune', preset: 'Wet only', params: { delay: 15.2 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'window-garden-tatami-grit',
    name: 'Tatami grit',
    category: 'tape',
    description:
      'A bed of digital grit, then a sharp and a flat copy kept in the centre, thick not wide, into a small room that is over in about a second.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Grit bed' },
      { deviceId: 'stereo-detune', preset: 'Thickener' },
      {
        deviceId: 'hall-reverb',
        preset: 'Room',
        params: { preDelay: 27.9, lowDecay: 1.58, midDecay: 1.07 },
      },
    ],
  },
  {
    id: 'window-garden-morning-radio',
    name: 'Morning radio',
    category: 'tape',
    description:
      'A close echo and glimpses, then a small mono transistor radio with a clear, steady signal, into an undamped hall.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Glimpses' },
      { deviceId: 'radio', preset: 'Clean transistor' },
      {
        deviceId: 'hall-reverb',
        preset: 'Bright hall',
        params: { preDelay: 35.5, lowDecay: 1.82, midDecay: 2.71 },
      },
    ],
  },
  {
    id: 'window-garden-sampler-before-noon',
    name: 'Sampler before noon',
    category: 'tape',
    description:
      'Early sampler converters, then a sharp and a flat copy of the highs only, to either side, into a tight little room.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler' },
      { deviceId: 'stereo-detune', preset: 'Top only' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'window-garden-tea-room-glass',
    name: 'Tea-room glass',
    category: 'tape',
    description:
      'Glassy old converters, then a sharp and a flat copy of the highs only, to either side, into a bright chamber.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glassy' },
      { deviceId: 'stereo-detune', preset: 'Top only' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'window-garden-sampler-in-a-vitrine',
    name: 'Sampler in a vitrine',
    category: 'tape',
    description:
      'A hot console channel, forward in the upper mids, then a grainy early sampler, into a brief swell of reverb close behind each note.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Hot channel' },
      { deviceId: 'patina', preset: 'Early sampler', params: { output: -2.26 } },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { time: 0.279 } },
    ],
  },
  {
    id: 'window-garden-veranda-grain',
    name: 'Veranda grain',
    category: 'tape',
    description:
      'The first hint of weight from a tape preamp, then five-bit converters fed hot, coarse and grainy on every note, into a bright chamber.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint', params: { output: -2.18 } },
      { deviceId: 'vintage-digital', preset: 'Crushed' },
      { deviceId: 'expanse', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'window-garden-tape-in-the-shade',
    name: 'Tape in the shade',
    category: 'tape',
    description:
      'A thick, soft cassette, full in the lows and dull on top, then dotted tape repeats that bounce from side to side.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 601 } },
    ],
  },
  {
    id: 'window-garden-shaded-sampler',
    name: 'Shaded sampler',
    category: 'tape',
    description:
      'Smooth, dull converters with a hiss that rides high notes, then a scooped tone with lows and highs up and the body down.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Jittery' },
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.62 } },
    ],
  },
  {
    id: 'window-garden-heron-swell',
    name: 'Heron swell',
    category: 'motion',
    description:
      'A hollow chorus that swells over about ten seconds, into a thin veil of reverb kept low under the sound.',
    effects: [
      { deviceId: 'chorus', preset: 'Hollow swell' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { decay: 2.2, breathRate: 0.296 } },
    ],
  },
  {
    id: 'window-garden-koi-pond-chorus',
    name: 'Koi-pond chorus',
    category: 'motion',
    description:
      'A light chorus that widens more than it moves, into a tight chamber close round the sound for about a second.',
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { rate: 0.323, delayMs: 7.05 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'window-garden-east-wing-drift',
    name: 'East-wing drift',
    category: 'motion',
    description:
      'A wide chorus drifting over a cycle of about twelve seconds, into the close reflections of a very small room.',
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.0885, delayMs: 26.6 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Short ambience',
        params: { decay: 0.377, breathRate: 0.281 },
      },
    ],
  },
  {
    id: 'window-garden-chorus-on-a-bench',
    name: 'Chorus on a bench',
    category: 'motion',
    description:
      'A wide chorus drifting over a cycle of about twelve seconds, into a small plain room that is over in about a second.',
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 1.32, breathRate: 0.267 } },
    ],
  },
  {
    id: 'window-garden-wagtail-chorus',
    name: 'Wagtail chorus',
    category: 'motion',
    description:
      'A chorus on the upper range that leaves the lows steady, into a faint short reverb with a slight upward drift.',
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer' },
      { deviceId: 'bloom-reverb', preset: 'Faint glow', params: { decay: 3.15 } },
    ],
  },
  {
    id: 'window-garden-garden-sway',
    name: 'Garden sway',
    category: 'motion',
    description:
      'A slow pan from side to side, a few seconds each way, then two tape heads that make every repeat gallop, into a mid-sized hall.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan' },
      { deviceId: 'tape-echo', preset: 'Two head gallop' },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'window-garden-flanger-in-daylight',
    name: 'Flanger in daylight',
    category: 'motion',
    description:
      'A deep flanger that sweeps right up through the top, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'flanger', preset: 'Through-zero feel', params: { rate: 0.313, delayMs: 0.763 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'window-garden-overcast-chorus',
    name: 'Overcast chorus',
    category: 'motion',
    description:
      'A tape preamp pushed just enough to add weight, then a full chorus spread wide to left and right.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'chorus', preset: 'Wide chorus' },
    ],
  },
  {
    id: 'window-garden-camellia-chorus',
    name: 'Camellia chorus',
    category: 'motion',
    description:
      'A thick ensemble chorus turning about every two seconds, into a clean speaker heard from well back in a room.',
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { rate: 0.513, delayMs: 17.7 } },
      { deviceId: 're-amp', preset: 'Just the room', params: { output: 3.74 } },
    ],
  },
  {
    id: 'window-garden-paper-screen-chorus',
    name: 'Paper-screen chorus',
    category: 'motion',
    description:
      'A full chorus spread wide to left and right, into a small room that is over in about a second.',
    effects: [
      { deviceId: 'chorus', preset: 'Wide chorus', params: { rate: 0.872, delayMs: 11.7 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'window-garden-gallery-chorus',
    name: 'Gallery chorus',
    category: 'motion',
    description:
      'A thin chorus of one copy bending against the dry sound, then a gentle high cut that shades the top end.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow chorus' },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.39 } },
    ],
  },
  {
    id: 'window-garden-flanger-in-the-foyer',
    name: 'Flanger in the foyer',
    category: 'motion',
    description:
      'A hollow flanger that sweeps every two or three seconds, into a cloud of reverb that swells in after each note and fades.',
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow', params: { rate: 0.392, delayMs: 1.63 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 2.23 } },
    ],
  },
  {
    id: 'window-garden-pond-skater-sway',
    name: 'Pond-skater sway',
    category: 'motion',
    description:
      'A bright, lean console channel driven for an edge on top, then the tone rocking slowly from dark to bright, sides opposed.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Sheen' },
      { deviceId: 'tremolo', preset: 'Tilting tone', params: { rate: 0.281 } },
    ],
  },
  {
    id: 'window-garden-pondside-sway',
    name: 'Pondside sway',
    category: 'motion',
    description:
      'A stereo image at its widest, with one side a touch late, then a deep slow chorus on a long delay, swaying over seconds.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Ultra wide' },
      { deviceId: 'chorus', preset: 'Deep sea' },
    ],
  },
  {
    id: 'window-garden-skylight-drift',
    name: 'Skylight drift',
    category: 'motion',
    description:
      'A pan that wanders to a new place every second or so, into a small plain room that is over in about a second.',
    effects: [
      { deviceId: 'tremolo', preset: 'Wandering pan', params: { rate: 0.677 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 1.27, breathRate: 0.278 } },
    ],
  },
  {
    id: 'window-garden-phaser-on-stone',
    name: 'Phaser on stone',
    category: 'motion',
    description:
      'A phaser with no dry sound, pulling the two sides apart, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'phaser', preset: 'Stereo scatter', params: { rate: 0.229 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 56.3, lowDecay: 7.48, midDecay: 1.96 },
      },
    ],
  },
  {
    id: 'window-garden-opening-hour-sway',
    name: 'Opening-hour sway',
    category: 'motion',
    description:
      'A slow pan from side to side, a few seconds each way, into a small room that sparkles two octaves above the sound.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.152 } },
      { deviceId: 'shimmer', preset: 'Sparkle room', params: { decay: 1.18, predelay: 20.6 } },
    ],
  },
  {
    id: 'window-garden-tide-on-gravel',
    name: 'Tide on gravel',
    category: 'motion',
    description:
      'A deep slow chorus on a long delay, swaying over seconds, into a reverb that fades evenly to nothing in a second or two.',
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.154 } },
      { deviceId: 'shaped-reverb', preset: 'Falling' },
    ],
  },
  {
    id: 'window-garden-unhurried-sway',
    name: 'Unhurried sway',
    category: 'motion',
    description:
      'A light chorus that widens more than it moves, then a slow pan from side to side, a few seconds each way.',
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { rate: 0.313, delayMs: 7.42 } },
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.153 } },
    ],
  },
  {
    id: 'window-garden-phaser-before-noon',
    name: 'Phaser before noon',
    category: 'motion',
    description:
      'A hollow peaking phaser that turns about every four seconds, into a small plain room that is over in about a second.',
    effects: [
      { deviceId: 'phaser', preset: 'Negative notch', params: { rate: 0.281 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 1.11, breathRate: 0.289 } },
    ],
  },
  {
    id: 'window-garden-museum-afterglow',
    name: 'Museum afterglow',
    category: 'texture',
    description:
      'A short glow of held tone that dies just after each note, into a thin veil of reverb kept low under the sound.',
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Brief afterglow',
        params: { attack: 0.0276, glide: 0.0333, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.072 } },
    ],
  },
  {
    id: 'window-garden-white-wall-organ',
    name: 'White-wall organ',
    category: 'texture',
    description:
      'A still, steady tone like organ pipes under each note, into a tight, damped little room close around the sound.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Still pipes' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'window-garden-celadon-strings',
    name: 'Celadon strings',
    category: 'texture',
    description:
      'A wide string pad that picks up even the softest notes, into a bright wide room that rings for a second or two.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Catch all', params: { rise: 0.189, fall: 9.23 } },
      { deviceId: 'ether-reverb', preset: 'Ether' },
    ],
  },
  {
    id: 'window-garden-swell-in-pine-shade',
    name: 'Swell in pine shade',
    category: 'texture',
    description:
      'A smooth swell that brings every note in like bowed strings, into the close reflections of a very small room.',
    effects: [
      { deviceId: 'swell', preset: 'String section' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'window-garden-atrium-grains',
    name: 'Atrium grains',
    category: 'texture',
    description:
      'A scattered cloud of long grains, some an octave up, then a clean, steady echo with no wobble and little dulling.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Slow cloud', params: { size: 252, delay: 131 } },
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 199, modRate: 0.589 } },
    ],
  },
  {
    id: 'window-garden-paper-screen-halo',
    name: 'Paper-screen halo',
    category: 'texture',
    description:
      'A thin held pad with no lows that swells in behind the notes, then a long slow flanger, nearly a chorus, opposite on each side.',
    effects: [
      { deviceId: 'sustainer', preset: 'Thin halo' },
      { deviceId: 'flanger', preset: 'Wide wash', params: { rate: 0.142, delayMs: 8.36 } },
    ],
  },
  {
    id: 'window-garden-cypress-strings',
    name: 'Cypress strings',
    category: 'texture',
    description:
      'A string pad with a second section an octave above, then a dark slow rotating speaker that mostly turns the lows.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Octave halo', params: { rise: 1.01, fall: 5.18 } },
      { deviceId: 'rotary', preset: 'Dark drum' },
    ],
  },
  {
    id: 'window-garden-pebble-swell',
    name: 'Pebble swell',
    category: 'texture',
    description:
      'A late swell on every note like a rocked volume pedal, then a sharp and a flat copy kept in the centre, thick not wide.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 277, release: 162 } },
      { deviceId: 'stereo-detune', preset: 'Thickener' },
    ],
  },
  {
    id: 'window-garden-guest-book-fifth',
    name: 'Guest-book fifth',
    category: 'pitch',
    description:
      'A single voice a fifth above the dry sound, into a tight chamber close round the sound for about a second.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Fifth above' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'window-garden-stone-path-glow',
    name: 'Stone-path glow',
    category: 'pitch',
    description:
      'High octaves that fade in late above each note, into a tight chamber close round the sound for about a second.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow halo', params: { attack: 0.668 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'window-garden-daylight-thirds',
    name: 'Daylight thirds',
    category: 'pitch',
    description:
      'A third above and a sixth below a single line, in C major, into a small plate that is gone in a second or two.',
    effects: [
      { deviceId: 'lattice', preset: 'Diatonic thirds', params: { output: 5.99 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'window-garden-fifth-in-pine-shade',
    name: 'Fifth in pine shade',
    category: 'pitch',
    description:
      'A single voice a fifth above the dry sound, into a small room that answers about an eighth of a second late.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Fifth above' },
      { deviceId: 'ether-reverb', preset: 'Slap room' },
    ],
  },
  {
    id: 'window-garden-ginkgo-chord',
    name: 'Ginkgo chord',
    category: 'pitch',
    description:
      'A pure-tuned third, fifth and low octave in C major, into a short reverb that swells in just after each note.',
    effects: [
      { deviceId: 'lattice', preset: 'Just intonation triad', params: { output: 4.48 } },
      { deviceId: 'expanse', preset: 'Quick swell' },
    ],
  },
  {
    id: 'window-garden-footbridge-octave',
    name: 'Footbridge octave',
    category: 'pitch',
    description:
      'A detuned octave above each note, like doubled strings, then a thin twelve-bit glaze from converters at a moderate rate.',
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string' },
      { deviceId: 'vintage-digital', preset: 'Glaze' },
    ],
  },
  {
    id: 'window-garden-porcelain-sevenths',
    name: 'Porcelain sevenths',
    category: 'pitch',
    description:
      'A third, fifth and seventh above each note, in C major, then a thin band of tone with the lows cut and the top rolled off.',
    effects: [
      { deviceId: 'lattice', preset: 'Seventh chord stack', params: { output: 7.33 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { clearTime: 1.45 } },
    ],
  },
  {
    id: 'window-garden-bamboo-sparks',
    name: 'Bamboo sparks',
    category: 'pitch',
    description:
      'Scattered sparks two octaves up, echoing higher still, into a thin veil of reverb kept low under the sound.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'High sparks' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'window-garden-veranda-finish',
    name: 'Veranda finish',
    category: 'master',
    description:
      'A stereo image widened a little, with the bass left central, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.57 } },
    ],
  },
  {
    id: 'window-garden-daylight-finish',
    name: 'Daylight finish',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a true-peak ceiling that lets go again over several seconds.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
  {
    id: 'window-garden-sun-warmed-polish',
    name: 'Sun-warmed polish',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a subsonic cut, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 2.66 } },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'window-garden-overcast-lacquer',
    name: 'Overcast lacquer',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a parallel compressor that lifts quiet playing and tails, then a safety limiter.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 415, release: 2.69 } },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'window-garden-stone-basin-master',
    name: 'Stone-basin master',
    category: 'master',
    description:
      'A rumble cut and a small lift of presence, then a slow compressor that evens out swells over seconds, then a smooth true-peak ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Keys', params: { clearTime: 1.35 } },
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 285, release: 2.17 } },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'window-garden-polish-on-tatami',
    name: 'Polish on tatami',
    category: 'master',
    description:
      'Light tape-style saturation, then a gentle compressor, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 111, release: 2.22 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.67 } },
    ],
  },
  {
    id: 'window-garden-cloakroom-mixdown',
    name: 'Cloakroom mixdown',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a subsonic cut with the low mids and the presence eased, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-eq', preset: 'Drone' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
]
