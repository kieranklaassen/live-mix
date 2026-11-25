import { type FactoryPreset, type Phrase } from '../types'

// A jar buried upside down under a stone basin, the water that falls into it and the bamboo
// that fills, tips and knocks beside it. Laid out by what sounds (drops, shells, jars, bamboo,
// stone), by how much water there is, from a flood to one drop of winter, and by what earth lies over it.

// Two keys held and no more: D and A, so that no third is ever heard.
const TWO_KEYS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 62, gain: 0.6 },
    { atSec: 0.2, durSec: 6.6, note: 69, gain: 0.5 },
  ],
}
// Three fifths in one jar, D A E, and the same three in a second jar a fifth lower, G D A.
const TWO_JARS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.2, note: 62, gain: 0.6 },
    { atSec: 0.1, durSec: 3.1, note: 69, gain: 0.5 },
    { atSec: 0.3, durSec: 2.9, note: 76, gain: 0.5 },
    { atSec: 3.6, durSec: 3.3, note: 55, gain: 0.65 },
    { atSec: 3.7, durSec: 3.2, note: 62, gain: 0.55 },
    { atSec: 3.9, durSec: 3, note: 69, gain: 0.5 },
  ],
}
// Drops on D A E B, each high one splashing a fifth above itself an eighth of a second later.
const DROPS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3, note: 74, gain: 0.55 },
    { atSec: 0.12, durSec: 2.6, note: 81, gain: 0.3 },
    { atSec: 2.2, durSec: 2.4, note: 69, gain: 0.48 },
    { atSec: 3.9, durSec: 2.2, note: 76, gain: 0.52 },
    { atSec: 4.02, durSec: 2, note: 83, gain: 0.26 },
    { atSec: 5.4, durSec: 1.9, note: 62, gain: 0.45 },
  ],
}
// One jar calls A E D and the other answers a fifth lower, D A G; then E B A, and A E D.
const ANSWERS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 69, gain: 0.6 },
    { atSec: 0.42, durSec: 1, note: 76, gain: 0.5 },
    { atSec: 0.98, durSec: 1.2, note: 74, gain: 0.45 },
    { atSec: 2.0, durSec: 1.2, note: 62, gain: 0.55 },
    { atSec: 2.42, durSec: 1, note: 69, gain: 0.45 },
    { atSec: 2.98, durSec: 1.2, note: 67, gain: 0.4 },
    { atSec: 4.1, durSec: 1, note: 76, gain: 0.5 },
    { atSec: 4.46, durSec: 0.9, note: 83, gain: 0.35 },
    { atSec: 4.94, durSec: 0.9, note: 81, gain: 0.35 },
    { atSec: 5.8, durSec: 1.5, note: 69, gain: 0.5 },
    { atSec: 6.16, durSec: 1.2, note: 76, gain: 0.4 },
    { atSec: 6.6, durSec: 0.8, note: 74, gain: 0.35 },
  ],
}
// The bamboo on G, a bounce 0.12 s after each knock, its gaps uneven: 2.35 s, then 3.03 s.
const CROOKED_CLOCK: Phrase = {
  notes: [
    { atSec: 0.3, durSec: 0.7, note: 43, gain: 0.85 },
    { atSec: 0.42, durSec: 0.5, note: 43, gain: 0.4 },
    { atSec: 2.65, durSec: 0.7, note: 43, gain: 0.85 },
    { atSec: 2.77, durSec: 0.5, note: 43, gain: 0.35 },
    { atSec: 5.68, durSec: 0.8, note: 43, gain: 0.85 },
    { atSec: 5.8, durSec: 0.5, note: 43, gain: 0.4 },
  ],
}
// A trickle on A D E that swells and quickens, the knock on G it tips into, and one drop left over.
const FILLING: Phrase = {
  notes: [
    { atSec: 0.1, durSec: 1, note: 69, gain: 0.25 },
    { atSec: 0.9, durSec: 0.9, note: 74, gain: 0.28 },
    { atSec: 1.6, durSec: 0.8, note: 76, gain: 0.3 },
    { atSec: 2.2, durSec: 0.7, note: 69, gain: 0.34 },
    { atSec: 2.72, durSec: 0.6, note: 74, gain: 0.38 },
    { atSec: 3.18, durSec: 0.5, note: 76, gain: 0.42 },
    { atSec: 3.58, durSec: 0.5, note: 69, gain: 0.46 },
    { atSec: 3.92, durSec: 0.4, note: 74, gain: 0.5 },
    { atSec: 4.22, durSec: 0.4, note: 76, gain: 0.54 },
    { atSec: 4.7, durSec: 0.9, note: 43, gain: 0.85 },
    { atSec: 4.82, durSec: 0.6, note: 43, gain: 0.4 },
    { atSec: 6.1, durSec: 1.3, note: 74, gain: 0.4 },
  ],
}
// A chain of cups: water stepping down D C A G F through two octaves, slower at each link.
const RAIN_CHAIN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 86, gain: 0.5 },
    { atSec: 0.3, durSec: 0.9, note: 84, gain: 0.45 },
    { atSec: 0.64, durSec: 0.9, note: 81, gain: 0.48 },
    { atSec: 1.02, durSec: 1, note: 79, gain: 0.45 },
    { atSec: 1.44, durSec: 1, note: 77, gain: 0.45 },
    { atSec: 1.9, durSec: 1.1, note: 74, gain: 0.5 },
    { atSec: 2.42, durSec: 1.1, note: 72, gain: 0.45 },
    { atSec: 3.0, durSec: 1.2, note: 69, gain: 0.5 },
    { atSec: 3.66, durSec: 1.2, note: 67, gain: 0.48 },
    { atSec: 4.4, durSec: 1.3, note: 65, gain: 0.5 },
    { atSec: 5.24, durSec: 1.9, note: 62, gain: 0.6 },
  ],
}
// Winter: one drop on D and its splash a fifth up, and nothing after.
const ONE_DROP: Phrase = {
  notes: [
    { atSec: 0.2, durSec: 5.6, note: 74, gain: 0.75 },
    { atSec: 0.32, durSec: 4.4, note: 81, gain: 0.35 },
  ],
}
// The earth: D and A low down, built up in fifths and one fourth, D A D A E, with no third in it.
const GROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 38, gain: 0.6 },
    { atSec: 0.8, durSec: 6.4, note: 45, gain: 0.5 },
    { atSec: 2, durSec: 5.2, note: 50, gain: 0.45 },
    { atSec: 3.4, durSec: 3.8, note: 57, gain: 0.45 },
    { atSec: 4.6, durSec: 2.6, note: 64, gain: 0.4 },
  ],
}
// A line down the scale E F A B C, its two halves E C B and A F E each ending on a half step.
const MOSS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.65, note: 76, gain: 0.55 },
    { atSec: 1.7, durSec: 0.55, note: 72, gain: 0.5 },
    { atSec: 2.3, durSec: 1.5, note: 71, gain: 0.5 },
    { atSec: 4, durSec: 0.85, note: 69, gain: 0.55 },
    { atSec: 4.9, durSec: 0.45, note: 65, gain: 0.5 },
    { atSec: 5.4, durSec: 1.95, note: 64, gain: 0.5 },
  ],
}
// The same line two octaves lower, for what lies deeper.
const ROOTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.65, note: 52, gain: 0.65 },
    { atSec: 1.7, durSec: 0.55, note: 48, gain: 0.6 },
    { atSec: 2.3, durSec: 1.5, note: 47, gain: 0.6 },
    { atSec: 4, durSec: 0.85, note: 45, gain: 0.65 },
    { atSec: 4.9, durSec: 0.45, note: 41, gain: 0.6 },
    { atSec: 5.4, durSec: 1.95, note: 40, gain: 0.65 },
  ],
}
// Four fifths set on one another, G D A E B, one ring of water at a time.
const RINGS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 55, gain: 0.5 },
    { atSec: 1, durSec: 6, note: 62, gain: 0.46 },
    { atSec: 2, durSec: 5, note: 69, gain: 0.44 },
    { atSec: 3, durSec: 4, note: 76, gain: 0.42 },
    { atSec: 4, durSec: 3, note: 83, gain: 0.36 },
  ],
}
// A ladle poured over the hands, E D B A G E D in a rush, then what drips off: D, A, E.
const LADLE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.6, note: 76, gain: 0.5 },
    { atSec: 0.26, durSec: 0.6, note: 74, gain: 0.5 },
    { atSec: 0.48, durSec: 0.6, note: 71, gain: 0.52 },
    { atSec: 0.66, durSec: 0.6, note: 69, gain: 0.55 },
    { atSec: 0.81, durSec: 0.6, note: 67, gain: 0.55 },
    { atSec: 0.94, durSec: 0.6, note: 64, gain: 0.6 },
    { atSec: 1.05, durSec: 1.2, note: 62, gain: 0.65 },
    { atSec: 2.7, durSec: 1.4, note: 74, gain: 0.5 },
    { atSec: 4.1, durSec: 1.4, note: 69, gain: 0.45 },
    { atSec: 5.8, durSec: 1.5, note: 76, gain: 0.4 },
  ],
}
// A dropped stick on D settling: each bounce sooner and softer than the last, then one ring on an E a ninth above.
const SETTLING: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.6, note: 50, gain: 0.85 },
    { atSec: 0.9, durSec: 0.5, note: 50, gain: 0.7 },
    { atSec: 1.6, durSec: 0.4, note: 50, gain: 0.58 },
    { atSec: 2.14, durSec: 0.3, note: 50, gain: 0.48 },
    { atSec: 2.56, durSec: 0.3, note: 50, gain: 0.4 },
    { atSec: 2.88, durSec: 0.2, note: 50, gain: 0.34 },
    { atSec: 3.13, durSec: 0.2, note: 50, gain: 0.3 },
    { atSec: 4.2, durSec: 2.6, note: 64, gain: 0.6 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Droplets: five surfaces, from a flood to one drop, in the jars and out of them.
  {
    id: 'buried-jar-jar-under-the-gravel',
    name: 'Jar under the gravel',
    category: 'texture',
    preview: TWO_KEYS,
    description:
      'One slow water drop every two seconds, sung back by a glazed bottle of twice the size.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Water drops',
      params: {
        rain: 0.5,
        loose: 1,
        spread: 1,
        size: 0.35,
        splash: 0.1,
        ring: 1.5,
        trail: 4,
        volume: -4,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Deep well',
        params: { size: 2, material: 0.85, opening: 0.35, air: 0.1, tone: 0.55, mix: 0.8 },
      },
    ],
  },
  {
    id: 'buried-jar-jar-by-the-far-stone',
    name: 'Jar by the far stone',
    category: 'texture',
    preview: TWO_JARS,
    description:
      'Heavy slow drops in a bottle of three times the size, heard from one side and creeping round.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Deep pool',
      params: { rain: 0.8, size: 0.8, ring: 2.5, splash: 0.35, trail: 3, volume: -8 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Deep well',
        params: { size: 3, material: 0.9, opening: 0.5, tone: 0.3, mix: 0.85 },
      },
      { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.01, turn: -90, radius: 0.8 } },
    ],
  },
  {
    id: 'buried-jar-one-drop-of-winter',
    name: 'One drop of winter',
    category: 'bell',
    preview: ONE_DROP,
    description:
      'A glass drop about every three seconds, in a nearly closed hard bottle and then a dark hall.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Slow drip',
      params: {
        rain: 0.3,
        material: 0,
        size: 0.5,
        spread: 0,
        ring: 3,
        soft: 0.1,
        splash: 0,
        trail: 20,
        volume: -11,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Blown bottle',
        params: { size: 1, material: 0.95, opening: 0.1, air: 0, mix: 0.6 },
      },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { decay: 8, mix: 0.35 } },
    ],
  },
  {
    id: 'buried-jar-gravel-drinks-the-rain',
    name: 'Gravel drinks the rain',
    category: 'texture',
    preview: TWO_KEYS,
    description:
      'Over twenty felted specks a second, all splash and little pitch, cut at both ends and pressed level.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt patter',
      params: {
        rain: 22,
        loose: 1,
        size: 0.02,
        spread: 3,
        splash: 0.95,
        ring: 0.3,
        width: 1,
        trail: 1.5,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 260, presence: 3 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { inputGain: 12, outputGain: 4 } },
    ],
  },
  {
    id: 'buried-jar-shell-on-the-basin-rim',
    name: 'Shell on the basin rim',
    category: 'bell',
    preview: DROPS,
    description:
      'Six glass drops a second inside a small hard shell, whose high cluster rings over each of them.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Glass rain',
      params: { volume: -3.5, rain: 6, size: 0.2, ring: 0.6, soft: 0.2, splash: 0.2, trail: 1 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Whispering shell',
        params: { size: 0.6, material: 0.75, air: 0.15, mix: 0.75 },
      },
    ],
  },
  {
    id: 'buried-jar-unglazed-and-half-full',
    name: 'Unglazed and half full',
    category: 'texture',
    preview: TWO_JARS,
    description:
      'Splashing water drops in an unglazed clay bottle that swallows their top and their ring.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Water drops',
      params: { volume: -1, rain: 2.2, size: 0.55, splash: 0.8, ring: 0.8, spread: 0.5, trail: 1 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { size: 1.333, material: 0.1, mix: 0.95 } },
    ],
  },
  {
    id: 'buried-jar-cups-on-a-chain',
    name: 'Cups on a chain',
    category: 'bell',
    preview: RAIN_CHAIN,
    description:
      'Small metal drops in an even pulse over three octaves, thrown on as closer and closer skips.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Metal shower',
      params: {
        volume: -1,
        rain: 5,
        loose: 0,
        size: 0.1,
        spread: 3,
        ring: 0.6,
        soft: 0.3,
        splash: 0,
        trail: 0,
      },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Soft pebble',
        params: { first: 260, bounce: 0.7, skips: 7, mix: 0.4 },
      },
    ],
  },
  {
    id: 'buried-jar-below-the-cistern-lid',
    name: 'Below the cistern lid',
    category: 'texture',
    preview: GROUND,
    description:
      'The largest water drops, rung long in a long stopped pipe tuned to G and left in a warm hall.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Deep pool',
      params: { rain: 1.5, size: 1, ring: 4, splash: 0.2, soft: 0.8, spread: 0, trail: 8 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Cistern', params: { size: 2.67, mix: 0.7 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'buried-jar-thimble-of-sleet',
    name: 'Thimble of sleet',
    category: 'bell',
    preview: TWO_KEYS,
    description:
      'Tiny bright glass grains three octaves wide in a thimble, with sparks of overtones thrown off.',
    instrument: {
      deviceId: 'droplets',
      preset: 'High glitter',
      params: { volume: -2, rain: 9, size: 0, spread: 3, ring: 0.5, soft: 0.2, trail: 2 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Thimble', params: { material: 0.75, mix: 0.6 } },
      { deviceId: 'glints', preset: 'Overtone spray', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'buried-jar-the-basin-runs-over',
    name: 'The basin runs over',
    category: 'texture',
    preview: FILLING,
    description:
      'Twenty water drops a second, run together and heard from just under the surface, with bubbles.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Bubble stream',
      params: { volume: -1, rain: 20, size: 0.3, spread: 1, bursts: 0, ring: 1, splash: 0.3 },
    },
    effects: [
      {
        deviceId: 'underwater',
        preset: 'Just under',
        params: { depth: 0.4, bubbles: 0.8, waver: 0.6 },
      },
    ],
  },
  {
    id: 'buried-jar-bamboo-leaves-shake-dry',
    name: 'Bamboo leaves shake dry',
    category: 'texture',
    preview: ANSWERS,
    description:
      'Wooden ticks that come in bursts over two octaves, heard a little way off in the open air.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Wood ticks',
      params: {
        volume: -5,
        rain: 5,
        loose: 1,
        size: 0.15,
        bursts: 0.9,
        spread: 2,
        ring: 0.5,
        splash: 0.4,
        trail: 3,
      },
    },
    effects: [
      { deviceId: 'distance', preset: 'Open air', params: { distance: 0.45, wander: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { gain: 12 } },
    ],
  },
  {
    id: 'buried-jar-slow-bamboo-clock',
    name: 'Slow bamboo clock',
    category: 'plucked',
    preview: CROOKED_CLOCK,
    description:
      'A large wooden knock in a slow even pulse, each with two softer bounces close behind it.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Wood pulse',
      params: {
        rain: 0.9,
        loose: 0,
        size: 1,
        spread: 0,
        ring: 1.2,
        soft: 0,
        splash: 0,
        trail: 0,
        width: 0.1,
      },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Two skips',
        params: { first: 120, bounce: 0.8, throw: 0, loss: 6, mix: 0.4 },
      },
    ],
  },
  {
    id: 'buried-jar-snow-slides-from-eaves',
    name: 'Snow slides from eaves',
    category: 'texture',
    preview: RINGS,
    description:
      'Big soft felted drops with much splash, each blurred by a slow diffusion until it has no edge.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt pulse',
      params: {
        volume: -3,
        rain: 1.6,
        loose: 0.7,
        size: 1,
        soft: 1,
        splash: 0.8,
        ring: 3,
        spread: 0.5,
        trail: 2,
        width: 0.8,
      },
    },
    effects: [{ deviceId: 'fog', preset: 'Slow rise', params: { size: 420, damp: 0.5 } }],
  },
  {
    id: 'buried-jar-ice-on-the-spout',
    name: 'Ice on the spout',
    category: 'pad',
    preview: RINGS,
    description:
      'Large soft glass drops with a very long ring, and slow pure sines that trace their partials.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Long chimes',
      params: {
        volume: -5.5,
        rain: 1.2,
        material: 0,
        size: 0.9,
        ring: 4,
        soft: 1,
        splash: 0,
        trail: 12,
      },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Wide glass',
        params: { attack: 600, release: 4, mix: 0.55 },
      },
    ],
  },
  {
    id: 'buried-jar-iron-lid-steady-drip',
    name: 'Iron lid, steady drip',
    category: 'bell',
    preview: DROPS,
    description:
      'Metal drops in a nearly even pulse, struck on the skin of a hard drum of twice the size.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Tin roof',
      params: {
        volume: -1.5,
        rain: 2.5,
        loose: 0.1,
        size: 0.5,
        spread: 0,
        ring: 0.5,
        soft: 0.1,
        splash: 0.1,
        bursts: 0,
        trail: 0,
      },
    },
    effects: [{ deviceId: 'vessel', preset: 'Kettle', params: { mix: 0.75 } }],
  },
  {
    id: 'buried-jar-from-the-veranda',
    name: 'From the veranda',
    category: 'texture',
    preview: LADLE,
    description:
      'Water drops at four a second, dark and narrow at the far end of a long room of five seconds.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Water drops',
      params: { volume: -3, rain: 4, size: 0.4, ring: 2, spread: 2, splash: 0.1, trail: 1 },
    },
    effects: [
      {
        deviceId: 'distance',
        preset: 'Far shore',
        params: { distance: 0.85, room: 0.8, air: 0.9 },
      },
    ],
  },
  {
    id: 'buried-jar-ear-to-the-bamboo-tube',
    name: 'Ear to the bamboo tube',
    category: 'texture',
    preview: TWO_KEYS,
    description:
      'Water drops down a short stopped pipe tuned to D, passed through one narrow band and drawn in to mono.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Water drops',
      params: { volume: 2, rain: 1.8, size: 0.3, ring: 2.5, splash: 0.2, trail: 2, width: 0 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Glass tube',
        params: { body: 2, size: 0.4454, material: 0.6, position: 0.18, mix: 0.8 },
      },
      {
        deviceId: 'auto-filter',
        preset: 'Phone line',
        params: { type: 2, slope: 0, cutoffHz: 900, resonance: 1.4, driveDb: 0 },
      },
      { deviceId: 'stereo-widener', preset: 'Mono' },
    ],
  },
  {
    id: 'buried-jar-gutter-in-the-thaw',
    name: 'Gutter in the thaw',
    category: 'texture',
    preview: LADLE,
    description:
      'A metal shower, fourteen drops a second and mostly splash, shaken by three slack dripping springs.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Metal shower',
      params: { rain: 14, size: 0.35, splash: 0.8, ring: 0.4, spread: 1, trail: 1 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Slack and strange', params: { drip: 0.9, mix: 0.45 } },
    ],
  },
  {
    id: 'buried-jar-stars-in-the-wet-stone',
    name: 'Stars in the wet stone',
    category: 'bell',
    preview: DROPS,
    description:
      'Slow glass drops, each answered by seven scattered echoes that fade over four seconds.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Slow drip',
      params: { volume: 4, rain: 1, size: 0.15, ring: 1, spread: 1, trail: 2, splash: 0.1 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { span: 4000, mix: 0.5 } },
    ],
  },
  {
    id: 'buried-jar-moss-takes-the-sound',
    name: 'Moss takes the sound',
    category: 'texture',
    preview: ANSWERS,
    description:
      'Felted drops, six a second, the lows lifted and everything above the low mids rolled off.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt patter',
      params: {
        volume: -3.5,
        rain: 6,
        size: 0.7,
        soft: 0.5,
        splash: 0.1,
        spread: 0.3,
        ring: 1.5,
        width: 0.4,
      },
    },
    effects: [{ deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1100, low: 4 } }],
  },
  {
    id: 'buried-jar-runnels-that-never-meet',
    name: 'Runnels that never meet',
    category: 'texture',
    preview: TWO_JARS,
    description:
      'Bursts of high water drops kept in two loops of unequal length that turn against each other.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Flurries',
      params: {
        volume: 0,
        material: 3,
        rain: 5,
        bursts: 1,
        size: 0.1,
        spread: 2,
        ring: 1.2,
        trail: 0.5,
      },
    },
    effects: [{ deviceId: 'orbits', preset: 'Two voices', params: { mix: 0.5 } }],
  },
  {
    id: 'buried-jar-steam-off-hot-stones',
    name: 'Steam off hot stones',
    category: 'texture',
    preview: TWO_KEYS,
    description:
      'Small metal drops whose echoes are rebuilt from grains a fifth up and climb as they repeat.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Bell drizzle',
      params: { volume: -3, rain: 3, size: 0.25, ring: 0.8, spread: 1, soft: 0.8, trail: 3 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Rising fifths',
        params: { time: 420, feedback: 0.55, mix: 0.5 },
      },
    ],
  },
  {
    id: 'buried-jar-crack-in-the-glaze',
    name: 'Crack in the glaze',
    category: 'bell',
    preview: DROPS,
    description:
      'Long-ringing metal drops with their partials pulled apart, so each is a small untrue bell.',
    instrument: {
      deviceId: 'droplets',
      preset: 'Long chimes',
      params: {
        volume: -4,
        rain: 1.4,
        loose: 1,
        size: 0.6,
        ring: 3,
        soft: 0.1,
        splash: 0.1,
        spread: 0.6,
        trail: 4,
      },
    },
    effects: [{ deviceId: 'warp', preset: 'Bell metal', params: { stretch: 0.6, mix: 0.8 } }],
  },
  // Graft: the bamboo that knocks, blown and plucked, and the jar itself struck, rubbed and blown.
  {
    id: 'buried-jar-on-the-knocking-stone',
    name: 'On the knocking stone',
    category: 'plucked',
    preview: CROOKED_CLOCK,
    description:
      'A struck wood bar, damped to a dry knock, with a short stopped bamboo pipe round it.',
    instrument: {
      deviceId: 'graft',
      preset: 'Struck wood bar',
      params: {
        volume: 0,
        decay: 0.5,
        bright: 0.25,
        air: 0.4,
        release: 0.15,
        pressure: 0.6,
        width: 0.2,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Hint of wood',
        params: { body: 2, size: 0.667, material: 0.25, opening: 0.6, mix: 0.6 },
      },
    ],
  },
  {
    id: 'buried-jar-wind-over-the-cut-culm',
    name: 'Wind over the cut culm',
    category: 'wind',
    preview: MOSS,
    description:
      'A blown pipe, as much breath as note, in a small room; held notes begin straight and sway later.',
    instrument: {
      deviceId: 'graft',
      preset: 'Blown pipe',
      params: {
        volume: -4,
        pressure: 0.35,
        bright: 0.45,
        air: 0.8,
        swell: 0.1,
        release: 0.4,
        wander: 0.5,
      },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { wait: 600, depth: 35 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'buried-jar-jar-struck-from-outside',
    name: 'Jar struck from outside',
    category: 'bell',
    preview: DROPS,
    description:
      'A soft dark mallet on a bowl, taken up by a glazed bottle half as large again, tuned to D.',
    instrument: {
      deviceId: 'graft',
      preset: 'Struck bowl',
      params: {
        volume: 0,
        decay: 7,
        bright: 0.2,
        position: 0.45,
        pressure: 0.3,
        air: 0,
        release: 4,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Blown bottle',
        params: { size: 1.5, material: 0.85, air: 0.05, mix: 0.8 },
      },
    ],
  },
  {
    id: 'buried-jar-knuckle-on-raw-clay',
    name: 'Knuckle on raw clay',
    category: 'plucked',
    preview: FILLING,
    description:
      'A struck bowl cut to under a second, hollow and unglazed, on a slack drum of clay.',
    instrument: {
      deviceId: 'graft',
      preset: 'Struck bowl',
      params: {
        volume: 3,
        decay: 0.6,
        bright: 0.35,
        position: 0.5,
        pressure: 0.65,
        air: 0.35,
        release: 0.2,
        width: 0.4,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Drum head',
        params: { size: 1.4, material: 0.12, opening: 0.3, mix: 0.75 },
      },
    ],
  },
  {
    id: 'buried-jar-wet-finger-on-the-lip',
    name: 'Wet finger on the lip',
    category: 'pad',
    preview: RINGS,
    description:
      'A rubbed bowl that takes two seconds to speak, its bands drifting from side to side.',
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bowl',
      params: { swell: 2, pressure: 0.5, bright: 0.6, air: 0.2, release: 5 },
    },
    effects: [{ deviceId: 'currents', preset: 'Wide tide', params: { rate: 0.15 } }],
  },
  {
    id: 'buried-jar-culms-along-the-fence',
    name: 'Culms along the fence',
    category: 'plucked',
    preview: LADLE,
    description:
      'A plucked stopped pipe, dry and airy, answered twice more at even gaps by its own round.',
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked pipe',
      params: { volume: 0.5, decay: 0.9, air: 0.5, bright: 0.5, position: 0.2, release: 0.3 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Round of three',
        params: { followers: 2, gap: 0.75, tone: 4500, mix: 0.45 },
      },
    ],
  },
  {
    id: 'buried-jar-roots-knocked-from-below',
    name: 'Roots knocked from below',
    category: 'bass',
    preview: ROOTS,
    description:
      'A struck pipe low down, round and short, thickened by a driven tube and rolled off above.',
    instrument: {
      deviceId: 'graft',
      preset: 'Struck pipe',
      params: {
        volume: -12.5,
        decay: 0.9,
        bright: 0.15,
        air: 0.15,
        position: 0.5,
        pressure: 0.6,
        width: 0,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { curve: 2, driveDb: 10, toneDb: -6 } },
    ],
  },
  {
    id: 'buried-jar-vine-tied-round-the-jar',
    name: 'Vine tied round the jar',
    category: 'string',
    preview: LADLE,
    description:
      'A dull plucked string stopped almost at once, its copies sharp on one side and flat on the other.',
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked string',
      params: { volume: 6, decay: 0.35, bright: 0.25, position: 0.5, air: 0.3, release: 0.1 },
    },
    effects: [{ deviceId: 'stereo-detune', preset: 'Doubled', params: { detune: 14, mix: 0.45 } }],
  },
  {
    id: 'buried-jar-rope-on-the-well-wheel',
    name: 'Rope on the well wheel',
    category: 'string',
    preview: ROOTS,
    description:
      'A rough bowed string in the low octaves, played through a loudspeaker shut in a cupboard.',
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: { pressure: 0.85, bright: 0.35, air: 0.5, swell: 0.25, wander: 0.6, width: 0.3 },
    },
    effects: [{ deviceId: 're-amp', preset: 'In the cupboard', params: { drive: 0.15, noise: 0 } }],
  },
  {
    id: 'buried-jar-dipper-set-on-the-rim',
    name: 'Dipper set on the rim',
    category: 'bell',
    preview: RAIN_CHAIN,
    description:
      'A bright struck bar cut to a second, throwing off small sparks an octave and a fifth up.',
    instrument: {
      deviceId: 'graft',
      preset: 'Struck bar',
      params: { volume: 5.5, decay: 1, bright: 0.9, position: 0.15, pressure: 0.7, release: 0.6 },
    },
    effects: [{ deviceId: 'glints', preset: 'Fifths above', params: { mix: 0.35 } }],
  },
  {
    id: 'buried-jar-wet-slates-beating',
    name: 'Wet slates beating',
    category: 'bell',
    preview: DROPS,
    description:
      'A soft long struck bar with a copy shifted a few hertz up on one side and down on the other.',
    instrument: {
      deviceId: 'graft',
      preset: 'Struck bar',
      params: {
        volume: -2,
        decay: 10,
        bright: 0.45,
        position: 0.45,
        pressure: 0.3,
        air: 0,
        release: 6,
      },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Moving beat',
        params: { mode: 2, fine: 2.5, feedback: 0.2, mix: 0.5 },
      },
    ],
  },
  {
    id: 'buried-jar-pipe-full-of-water',
    name: 'Pipe full of water',
    category: 'wind',
    preview: MOSS,
    description:
      'A blown pipe held well under the surface, slowly wavering, with bubbles off every attack.',
    instrument: {
      deviceId: 'graft',
      preset: 'Blown pipe',
      params: { pressure: 0.65, bright: 0.8, air: 0.2, swell: 0.2, release: 0.8 },
    },
    effects: [
      {
        deviceId: 'underwater',
        preset: 'Bathtub',
        params: { depth: 0.6, waver: 0.7, bubbles: 0.8 },
      },
    ],
  },
  {
    id: 'buried-jar-breath-across-the-jar',
    name: 'Breath across the jar',
    category: 'wind',
    preview: GROUND,
    description:
      'A blown bowl, slow and breathy, inside an open bottle of three times the size, tuned to a low D.',
    instrument: {
      deviceId: 'graft',
      preset: 'Blown bowl',
      params: {
        volume: -12,
        pressure: 0.6,
        bright: 0.3,
        air: 0.7,
        swell: 0.8,
        release: 2,
        wander: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Blown bottle',
        params: { size: 3, material: 0.5, opening: 0.6, air: 0.9, mix: 0.8 },
      },
    ],
  },
  {
    id: 'buried-jar-split-stick-rattles-down',
    name: 'Split stick rattles down',
    category: 'plucked',
    preview: SETTLING,
    description:
      'A bar plucked hard at its end and stopped short, turned into a wheeling flock of twelve.',
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked bar',
      params: {
        volume: 2,
        decay: 0.3,
        bright: 0.85,
        position: 0.03,
        air: 0.6,
        pressure: 0.8,
        release: 0.1,
      },
    },
    effects: [
      {
        deviceId: 'murmuration',
        preset: 'Thick ensemble',
        params: { birds: 12, range: 18, mix: 0.6 },
      },
    ],
  },
  {
    id: 'buried-jar-ladle-laid-across',
    name: 'Ladle laid across',
    category: 'keys',
    preview: LADLE,
    description:
      'A struck string, dark and short, with narrow warm springs left shaking after each note.',
    instrument: {
      deviceId: 'graft',
      preset: 'Struck string',
      params: {
        volume: 4,
        decay: 1.1,
        bright: 0.2,
        position: 0.12,
        pressure: 0.35,
        air: 0.35,
        release: 0.3,
      },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.45 } }],
  },
  {
    id: 'buried-jar-frost-in-the-pipe',
    name: 'Frost in the pipe',
    category: 'pad',
    preview: RINGS,
    description: 'A bowed pipe, thin and slow, whose long tail climbs two octaves at every pass.',
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed pipe',
      params: {
        volume: -6,
        pressure: 0.3,
        bright: 0.85,
        air: 0.1,
        position: 0.15,
        swell: 1.4,
        release: 2,
      },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.4 } }],
  },
  {
    id: 'buried-jar-damp-tongue-of-bamboo',
    name: 'Damp tongue of bamboo',
    category: 'organ',
    preview: TWO_JARS,
    description: 'A blown bar pressed hard, its pitch unsteady and its top worn away by slow tape.',
    instrument: {
      deviceId: 'graft',
      preset: 'Blown bar',
      params: { pressure: 0.75, bright: 0.25, air: 0.35, swell: 0.15, release: 0.5, wander: 0.6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket', params: { wow: 0.6, flutter: 0.2, hiss: 0 } },
    ],
  },
  {
    id: 'buried-jar-full-to-the-neck',
    name: 'Full to the neck',
    category: 'drone',
    preview: GROUND,
    description:
      'A bowed bar that swells in, recorded over itself in a small room until only its tones are left.',
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bar',
      params: { swell: 1.2, pressure: 0.6, bright: 0.4, air: 0.25, decay: 4, release: 3 },
    },
    effects: [
      {
        deviceId: 'generations',
        preset: 'Quick to tones',
        params: { length: 0.8, resonance: 0.6, hiss: 0, mix: 0.55 },
      },
    ],
  },
  {
    id: 'buried-jar-stones-down-the-bed',
    name: 'Stones down the bed',
    category: 'plucked',
    preview: SETTLING,
    description:
      'A short wood bar whose strikes are struck again and again in a quick scattered run.',
    instrument: {
      deviceId: 'graft',
      preset: 'Struck wood bar',
      params: {
        volume: 4.5,
        decay: 0.8,
        bright: 0.5,
        position: 0.1,
        pressure: 0.8,
        air: 0.1,
        release: 0.3,
      },
    },
    effects: [
      {
        deviceId: 'cascade',
        preset: 'Dropped marbles',
        params: { high: 0.4, decay: 0.35, tone: 6000, mix: 0.45 },
      },
    ],
  },
  {
    id: 'buried-jar-air-in-the-drain',
    name: 'Air in the drain',
    category: 'drone',
    preview: GROUND,
    description:
      'A blown string, all air and slow swell, inside a long stopped pipe with a whisper of its own.',
    instrument: {
      deviceId: 'graft',
      preset: 'Blown string',
      params: { pressure: 0.25, bright: 0.3, air: 0.85, swell: 2.2, release: 3, wander: 0.7 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Cistern',
        params: { size: 2.67, material: 0.7, air: 0.6, mix: 0.75 },
      },
    ],
  },
  // Outdoors: the stream, the frogs, the crickets and the weather, most of them inside something buried.
  {
    id: 'buried-jar-trickle-into-the-jar',
    name: 'Trickle into the jar',
    category: 'texture',
    preview: TWO_KEYS,
    description:
      'A thin near trickle poured through a glazed bottle of twice the size, so its gurgle rings on a few notes of the jar.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Trickle',
      params: { volume: 1.5, density: 0.1, movement: 1, tone: 0.6, attack: 0.3, release: 2 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Deep well',
        params: { size: 2, material: 0.85, opening: 0.35, air: 0.1, mix: 0.85 },
      },
    ],
  },
  {
    id: 'buried-jar-stream-heard-as-fifths',
    name: 'Stream heard as fifths',
    category: 'drone',
    preview: TWO_KEYS,
    description: 'A fast stream let through only where it meets D and A, ringing in every octave.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Fast water',
      params: { volume: 1, density: 0.8, distance: 0.3, attack: 1 },
    },
    effects: [
      {
        deviceId: 'scale-filter',
        preset: 'Open fifths',
        params: { root: 2, ring: 1.4, width: 22 },
      },
    ],
  },
  {
    id: 'buried-jar-the-bamboo-fills',
    name: 'The bamboo fills',
    category: 'texture',
    preview: TWO_KEYS,
    description:
      'A trickle that takes four seconds to come in, down a short open bamboo pipe on D, heard where it has no third.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Small stream',
      params: {
        volume: 1,
        density: 0.3,
        distance: 0.1,
        tone: 0.8,
        movement: 0.9,
        attack: 4,
        release: 0.3,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Inside a pipe',
        params: { size: 0.4454, position: 0.36, material: 0.45, opening: 0.3, mix: 0.9 },
      },
    ],
  },
  {
    id: 'buried-jar-sluice-under-the-path',
    name: 'Sluice under the path',
    category: 'texture',
    preview: GROUND,
    description: 'Fast dark water heard from beneath: muffled, pressed heavy and slowly wavering.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Fast water',
      params: { density: 1, distance: 0.1, tone: 0.15, movement: 0.4 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Heavy water', params: { waver: 0.5 } }],
  },
  {
    id: 'buried-jar-water-finding-its-mouth',
    name: 'Water finding its mouth',
    category: 'texture',
    preview: TWO_KEYS,
    description:
      'A small near stream pressed into the colour of a hollow tube and swept by a slow deep phaser.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Small stream',
      params: { volume: -2.5, density: 0.7, distance: 0, tone: 0.35, movement: 1 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 1.6, replace: 0.5 } },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'buried-jar-runnel-under-thin-ice',
    name: 'Runnel under thin ice',
    category: 'texture',
    preview: TWO_KEYS,
    description:
      'A bright trickle with all but its strongest partials thrown away, until it swirls, then put on a bright plate.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Trickle',
      params: { volume: 4.5, density: 0.4, tone: 1, movement: 0.6, attack: 0.5 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Few partials', params: { smear: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'buried-jar-drops-cut-from-a-stream',
    name: 'Drops cut from a stream',
    category: 'texture',
    preview: TWO_KEYS,
    description:
      'A stream half of which runs through a resonant band that jumps six times a second, drip by drip.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Small stream',
      params: { volume: 1, density: 0.9, distance: 0.2, tone: 0.5, movement: 0.2, attack: 0.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Stepped',
        params: {
          type: 2,
          cutoffHz: 900,
          resonance: 6,
          lfoAmount: 60,
          lfoRateHz: 6,
          lfoShape: 5,
          driveDb: 0,
        },
      },
    ],
  },
  {
    id: 'buried-jar-frog-shut-in-the-jar',
    name: 'Frog shut in the jar',
    category: 'texture',
    preview: TWO_JARS,
    description: 'A few near frogs croaking inside a clay bottle that keeps only their lower half.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Pond at dusk',
      params: { volume: -3.5, density: 0.2, distance: 0.05, tone: 0.3, attack: 0.2 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { size: 1.122, material: 0.3, mix: 0.8 } },
    ],
  },
  {
    id: 'buried-jar-frogs-past-the-wall',
    name: 'Frogs past the wall',
    category: 'texture',
    preview: GROUND,
    description:
      'A full pond of frogs, far off and dark behind a wall, with the space between left to ring.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Spring pond',
      params: { volume: 0, density: 0.9, tone: 0.75, distance: 0.3, attack: 1 },
    },
    effects: [
      {
        deviceId: 'distance',
        preset: 'Next door',
        params: { distance: 0.75, decay: 2.5, room: 0.5 },
      },
    ],
  },
  {
    id: 'buried-jar-frog-and-three-puddles',
    name: 'Frog and three puddles',
    category: 'texture',
    preview: ANSWERS,
    description:
      'One frog, answered a fourth and an octave lower from other puddles by a dark slow canon.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Pond at dusk',
      params: {
        volume: -0.5,
        density: 0,
        distance: 0.15,
        tone: 0.6,
        movement: 0.2,
        attack: 0.05,
        release: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Dark canon',
        params: { gap: 0.7, interval1: -5, interval2: -12, interval3: -5, tone: 2500, round: 0.2 },
      },
    ],
  },
  {
    id: 'buried-jar-crickets-in-a-whelk',
    name: 'Crickets in a whelk',
    category: 'texture',
    preview: TWO_KEYS,
    description:
      'A summer field of crickets in a shell grown larger than life, with its own hush of air.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Summer night',
      params: { volume: -1, density: 0.8, distance: 0.1, tone: 0.3, attack: 0.8 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Shell to the ear',
        params: { size: 1.8, opening: 0.4, mix: 0.75 },
      },
    ],
  },
  {
    id: 'buried-jar-last-cricket-of-the-wall',
    name: 'Last cricket of the wall',
    category: 'texture',
    preview: ONE_DROP,
    description:
      'A single low cricket, its chirps passed down the three heads of a dark tape echo.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Lone cricket',
      params: { volume: -1, tone: 0.05, movement: 0.4, attack: 0.1, release: 1 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 620, highCut: 3000, mix: 0.45 },
      },
    ],
  },
  {
    id: 'buried-jar-chimes-let-down-the-well',
    name: 'Chimes let down the well',
    category: 'bell',
    preview: RINGS,
    description:
      'Wind chimes swinging close by inside a nearly closed bottle of over twice the size, tuned to a low G.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Porch chimes',
      params: { volume: -2, density: 0.6, distance: 0.05, tone: 0.2, release: 8 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Deep well',
        params: { size: 2.25, opening: 0.2, air: 0.2, mix: 0.9 },
      },
    ],
  },
  {
    id: 'buried-jar-chimes-set-in-ice',
    name: 'Chimes set in ice',
    category: 'pad',
    preview: RINGS,
    description:
      'Breezy chimes smeared by a long blur, so strikes turn into one slowly moving band.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Chimes in a breeze',
      params: { density: 0.8, tone: 0.8, distance: 0.2 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Glass halo', params: { blur: 0.85, mix: 0.9 } },
    ],
  },
  {
    id: 'buried-jar-roof-tiles-hung-on-wire',
    name: 'Roof tiles hung on wire',
    category: 'bell',
    preview: ANSWERS,
    description:
      'Steady chimes with their partials pulled into a dull gong an octave down, in a small booth.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Porch chimes',
      params: { volume: -2.5, density: 1, distance: 0, tone: 0, movement: 0.2 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Sunken gong', params: { mix: 1 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'buried-jar-gust-turned-back',
    name: 'Gust turned back',
    category: 'bell',
    preview: RAIN_CHAIN,
    description:
      'A cloud of chimes, heard mostly backwards and an octave up, each piece swelling in and cut.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Chime cloud',
      params: { volume: 2.5, density: 0.7, attack: 0.1, tone: 0.5, distance: 0.4, release: 5 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Rising glass',
        params: { time: 900, smooth: 0.3, mix: 0.75 },
      },
    ],
  },
  {
    id: 'buried-jar-thunder-in-the-clay',
    name: 'Thunder in the clay',
    category: 'texture',
    preview: GROUND,
    description:
      'A near storm heard from within a huge hard bottle, so every roll comes round to one low D.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Storm overhead',
      params: { volume: -6, density: 1, distance: 0.2, tone: 0.3, attack: 0.1 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Deep well',
        params: { size: 3, material: 0.95, opening: 0.2, air: 0.3, mix: 0.9 },
      },
    ],
  },
  {
    id: 'buried-jar-storm-through-the-soles',
    name: 'Storm through the soles',
    category: 'drone',
    preview: GROUND,
    description:
      'A far storm with everything but its floor removed, pushed into iron until it hums.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { volume: -14, density: 1, tone: 0.1, distance: 0.5, attack: 0.2 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.55, highCut: 1000 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { highCut: 1000 } },
    ],
  },
  {
    id: 'buried-jar-a-bird-drinks',
    name: 'A bird drinks',
    category: 'texture',
    preview: ANSWERS,
    description:
      'One near bird whose call is thrown over the water in slowing, duller skips from side to side.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'One blackbird',
      params: { volume: -5, density: 0.15, tone: 0.7, distance: 0.05, attack: 0.05, release: 1 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Slowing bounces',
        params: { skips: 6, sink: 0.5, mix: 0.45 },
      },
    ],
  },
  {
    id: 'buried-jar-dawn-under-the-lid',
    name: 'Dawn under the lid',
    category: 'texture',
    preview: RINGS,
    description:
      'A dawn chorus spread across the range by a slow fan of delays, low calls first, under the skin of a large drum.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Dawn chorus',
      params: { volume: -3, density: 0.9, distance: 0.6, tone: 0.2, attack: 0.6 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Slow unfolding', params: { mix: 0.7 } },
      { deviceId: 'vessel', preset: 'Kettle', params: { size: 3, mix: 0.5 } },
    ],
  },
  // Prepared piano: rubber and wood for the bamboo, bolts for the jars, paper for leaves, felt for moss.
  {
    id: 'buried-jar-it-tips-and-it-knocks',
    name: 'It tips and it knocks',
    category: 'plucked',
    preview: FILLING,
    description:
      'Piano strings stopped dead with rubber, struck firmly, in an open bamboo pipe on G, its peaks held in by a limiter.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rubber thunks',
      params: {
        volume: 4.5,
        amount: 1,
        hammer: 0.55,
        decay: 0.45,
        thud: 0.9,
        position: 0.4,
        width: 0.1,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Inside a pipe',
        params: { size: 1.335, material: 0.3, air: 0, mix: 0.6 },
      },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { gain: 6, ceiling: -9.5 } },
    ],
  },
  {
    id: 'buried-jar-rake-dropped-on-gravel',
    name: 'Rake dropped on gravel',
    category: 'plucked',
    preview: SETTLING,
    description:
      'Bright rubbered wood blocks, their bounces quickening, thrown round in twelve close echoes.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Wood blocks',
      params: { volume: 5.5, amount: 0.95, hammer: 0.7, decay: 0.4, position: 0.3, thud: 0.1 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Close flicker', params: { mix: 0.45 } }],
  },
  {
    id: 'buried-jar-coins-in-the-basin',
    name: 'Coins in the basin',
    category: 'bell',
    preview: DROPS,
    description:
      'Bolted strings, struck lightly, with a table of bowls in D and A that rings on after them.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Bolt gongs',
      params: {
        volume: 3.5,
        amount: 0.75,
        position: 0.12,
        hammer: 0.3,
        rattle: 0,
        decay: 0.7,
        thud: 0,
      },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Low fifths',
        params: { root: 2, register: 0.55, ring: 14, mix: 0.45 },
      },
    ],
  },
  {
    id: 'buried-jar-felt-laid-over-moss',
    name: 'Felt laid over moss',
    category: 'keys',
    preview: MOSS,
    description:
      'A felted whisper of a piano, each attack blurred away and the rest left without a tail.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt whisper',
      params: { volume: 6, amount: 0.8, tone: 0.35, thud: 0, decay: 1.4 },
    },
    effects: [{ deviceId: 'fog', preset: 'No attack', params: { size: 260 } }],
  },
  {
    id: 'buried-jar-dry-sheath-underfoot',
    name: 'Dry sheath underfoot',
    category: 'keys',
    preview: ANSWERS,
    description:
      'Papered strings cut short, played through the worn disc of an old record with its noise off.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper buzz',
      params: { volume: 5, amount: 0.9, rattle: 0.7, decay: 0.4, position: 0.35, tone: 0.6 },
    },
    effects: [{ deviceId: 'patina', preset: 'Dusty record', params: { noise: 0, wear: 0.6 } }],
  },
  {
    id: 'buried-jar-everything-in-the-shed',
    name: 'Everything in the shed',
    category: 'keys',
    preview: FILLING,
    description:
      'A different object on every key, kept in a loop of under two seconds that wears as it turns.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Small orchestra',
      params: { volume: 5.5, amount: 0.75, rattle: 0.5, hammer: 0.6, decay: 0.8 },
    },
    effects: [{ deviceId: 'tape-loop', preset: 'Slow fade', params: { wear: 0.5, mix: 0.45 } }],
  },
  {
    id: 'buried-jar-cellar-of-pickle-jars',
    name: 'Cellar of pickle jars',
    category: 'keys',
    preview: ROOTS,
    description:
      'Dark strings with mixed objects, low down, each rung by a glazed bottle of twice the size.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Dark orchestra',
      params: { volume: 1, amount: 1, rattle: 0.2, hammer: 0.5, tone: 0.4, decay: 1 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Blown bottle',
        params: { size: 2, material: 0.8, opening: 0.2, air: 0, mix: 0.8 },
      },
    ],
  },
  {
    id: 'buried-jar-gong-under-three-spades',
    name: 'Gong under three spades',
    category: 'bell',
    preview: GROUND,
    description:
      'Long bolted gongs struck softly, buried in a dark eight-line room of six seconds.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Temple gongs',
      params: { volume: 3.5, amount: 1, hammer: 0.15, tone: 0.45, detune: 0.8 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.4 } }],
  },
  {
    id: 'buried-jar-tin-cups-in-the-rain',
    name: 'Tin cups in the rain',
    category: 'bell',
    preview: RAIN_CHAIN,
    description:
      'Short bright bolts near the end of the string, each echo rebuilt from grains an octave up.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Tin chimes',
      params: { volume: 6, amount: 0.65, position: 0.06, decay: 0.45, rattle: 0.1 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Crystals',
        params: { time: 240, feedback: 0.35, mix: 0.35 },
      },
    ],
  },
  {
    id: 'buried-jar-well-wheel-out-of-true',
    name: 'Well wheel out of true',
    category: 'keys',
    preview: ANSWERS,
    description:
      'Strings pulled far out of unison with a few objects on them, their pitch swaying slowly.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Loose unisons',
      params: { volume: 6, amount: 0.25, hammer: 0.4, rattle: 0, tone: 0.5, decay: 1.8 },
    },
    effects: [{ deviceId: 'tremolo', preset: 'Slow chorus', params: { rate: 1.2, mix: 0.6 } }],
  },
  {
    id: 'buried-jar-three-scarers-in-a-row',
    name: 'Three scarers in a row',
    category: 'plucked',
    preview: CROOKED_CLOCK,
    description:
      'A soft rubber thunk repeated by two more, an octave and then a fifth up, at gaps of 0.9 s.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Soft rubber',
      params: { volume: 6, amount: 0.8, hammer: 0.5, decay: 0.7, thud: 0.6, tone: 0.8 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Canon at the fifth',
        params: { followers: 2, gap: 0.9, interval1: 12, interval2: 7, mix: 0.5 },
      },
    ],
  },
  {
    id: 'buried-jar-chain-on-the-bucket',
    name: 'Chain on the bucket',
    category: 'keys',
    preview: LADLE,
    description:
      'Loose bolts that rattle hard on every string, boiling down into a tight swarm of echoes.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rattling bolts',
      params: { volume: 1, rattle: 1, hammer: 0.8, decay: 0.6, position: 0.25 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { mix: 0.45 } }],
  },
  {
    id: 'buried-jar-leaves-skim-the-pool',
    name: 'Leaves skim the pool',
    category: 'texture',
    preview: RAIN_CHAIN,
    description:
      'Paper sizzle with the pitch sifted out of it, so mostly the air of each note goes wide.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper sizzle',
      params: { volume: 5.5, amount: 1, rattle: 1, hammer: 0.5, decay: 1.5 },
    },
    effects: [
      {
        deviceId: 'sift',
        preset: 'Wide air',
        params: { tones: -14, attacks: -8, air: 6, scatter: 1 },
      },
    ],
  },
  {
    id: 'buried-jar-muffled-by-new-snow',
    name: 'Muffled by new snow',
    category: 'keys',
    preview: ROOTS,
    description:
      'Fully felted strings, damped and round, with a few murky repeats that wander in pitch.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt mute',
      params: { volume: 6, amount: 1, hammer: 0.2, decay: 0.5, tone: 0.3, thud: 0.5 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Murky', params: { time: 620, feedback: 0.45 } }],
  },
  {
    id: 'buried-jar-strings-in-a-nautilus',
    name: 'Strings in a nautilus',
    category: 'keys',
    preview: RINGS,
    description:
      'A nearly plain piano heard inside a large closed shell, the hush of it held under the strings.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Plain piano',
      params: { volume: 3, hammer: 0.3, tone: 0.6, thud: 0.1, decay: 2 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Shell to the ear',
        params: { size: 2, material: 0.7, opening: 0.1, air: 0.4, mix: 0.75 },
      },
    ],
  },
  {
    id: 'buried-jar-log-down-the-channel',
    name: 'Log down the channel',
    category: 'bass',
    preview: SETTLING,
    description:
      'A rubbered string with its thud raised, doubled one and two octaves under, the copies filtered low.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rubber thunks',
      params: { amount: 0.7, hammer: 0.2, decay: 1.6, thud: 1, tone: 0.3, position: 0.15 },
    },
    effects: [{ deviceId: 'octaves', preset: 'Deep', params: { sub2: 0.6, sub1: 0.8 } }],
  },
  {
    id: 'buried-jar-jars-drawing-breath',
    name: 'Jars drawing breath',
    category: 'pad',
    preview: RINGS,
    description:
      'Bolted strings with the strike taken off, each note fading in over nearly a second into a detuned cloud.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Temple gongs',
      params: {
        volume: 6,
        amount: 0.7,
        position: 0.45,
        rattle: 0.1,
        decay: 4,
        tone: 0.8,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 800 } },
      { deviceId: 'stereo-detune', preset: 'Cloud', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'buried-jar-stone-with-a-hollow',
    name: 'Stone with a hollow',
    category: 'bell',
    preview: MOSS,
    description:
      'Light bolts at the middle of the string, waking five tuned bowls on the notes of the line.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Light bolts',
      params: { volume: 2.5, amount: 0.4, hammer: 0.45, decay: 1.2, rattle: 0, tone: 1 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Five dark bowls',
        params: { root: 9, scale: 6, strike: 0.7, register: 0.6, mix: 0.5 },
      },
    ],
  },
  {
    id: 'buried-jar-knock-lost-in-the-pines',
    name: 'Knock lost in the pines',
    category: 'plucked',
    preview: CROOKED_CLOCK,
    description:
      'Hard wooden strikes answered from far off by slow echoes that skip away and sink.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Wood blocks',
      params: {
        volume: 4,
        amount: 0.6,
        position: 0.5,
        hammer: 0.8,
        decay: 1,
        thud: 0.8,
        tone: 0.55,
      },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Sinking away', params: { first: 600, mix: 0.45 } },
    ],
  },
  {
    id: 'buried-jar-ripples-coming-home',
    name: 'Ripples coming home',
    category: 'keys',
    preview: LADLE,
    description:
      'Mixed objects, each note met by a reversed reverb that swells for over a second and is cut.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Small orchestra',
      params: { volume: 5, amount: 1, hammer: 0.8, rattle: 0.1, decay: 0.5, tone: 1 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.55 } }],
  },
  // Bells: glazed jars, clay jars and the rims of basins.
  {
    id: 'buried-jar-glazed-and-upside-down',
    name: 'Glazed and upside down',
    category: 'bell',
    preview: DROPS,
    description:
      'A singing bowl struck firmly and not for long, in a bottle of twice its size with a high glaze.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: {
        volume: -3,
        decay: 3,
        damping: 0.6,
        hardness: 0.6,
        detune: 0.2,
        brightness: 0.6,
        release: 0.1,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Blown bottle',
        params: { size: 2, material: 0.95, opening: 0.2, air: 0.05, mix: 0.75 },
      },
    ],
  },
  {
    id: 'buried-jar-unfired-clay-in-a-row',
    name: 'Unfired clay in a row',
    category: 'plucked',
    preview: FILLING,
    description:
      'Bars damped to under a second with their overtones squeezed inward, then one late slap of a room.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: {
        volume: 6,
        decay: 0.8,
        stretch: 0.6,
        hardness: 0.6,
        brightness: 0.5,
        position: 0.1,
        release: 0.6,
        damping: 0.8,
      },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.25 } }],
  },
  {
    id: 'buried-jar-iron-plate-in-the-mud',
    name: 'Iron plate in the mud',
    category: 'drone',
    preview: GROUND,
    description:
      'A dark gong with everything above the low mids removed and slow swells through three bands.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { volume: -3.5, hardness: 0.1, brightness: 0.1, stretch: 0.7, damping: 0.8 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Deep swell', params: { rate: 0.2 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { highCut: 1300 } },
    ],
  },
  {
    id: 'buried-jar-round-the-basin-rim',
    name: 'Round the basin rim',
    category: 'pad',
    preview: RINGS,
    description:
      'A rubbed bowl held for as long as the key, opening and closing on a slow uneven breath.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { brightness: 0.75, detune: 2.5, damping: 0.2, spread: 1 },
    },
    effects: [{ deviceId: 'breath', preset: 'Asleep', params: { depth: 0.6, air: 0.2 } }],
  },
  {
    id: 'buried-jar-tongues-cut-in-a-tube',
    name: 'Tongues cut in a tube',
    category: 'plucked',
    preview: FILLING,
    description:
      'Short dull tongues plucked over a tube, each with two quick bounces that soften from side to side.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: {
        volume: 0,
        decay: 0.9,
        damping: 1,
        hardness: 0.3,
        brightness: 0.3,
        detune: 0,
        position: 0.4,
      },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Two skips',
        params: { first: 160, bounce: 0.7, loss: 4, mix: 0.35 },
      },
    ],
  },
  {
    id: 'buried-jar-splinters-off-the-culm',
    name: 'Splinters off the culm',
    category: 'plucked',
    preview: SETTLING,
    description:
      'Hard wood bars, overtones stretched wide and gone at once, in a short gated room that stops dead.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: {
        volume: 1,
        decay: 0.4,
        stretch: 1.45,
        hardness: 0.8,
        brightness: 1,
        position: 0.02,
        damping: 0.6,
      },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.22, mix: 0.6 } }],
  },
  {
    id: 'buried-jar-bell-sunk-in-silt',
    name: 'Bell sunk in silt',
    category: 'bell',
    preview: TWO_JARS,
    description:
      'A church bell with its partials pulled in close, deep in water and slow to waver.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { volume: -3, stretch: 0.65, hardness: 0.3, brightness: 0.3, decay: 12, detune: 2 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Deep water', params: { depth: 0.65, bubbles: 0.2 } },
    ],
  },
  {
    id: 'buried-jar-links-of-a-wet-chain',
    name: 'Links of a wet chain',
    category: 'bell',
    preview: RAIN_CHAIN,
    description:
      'Bright tubes stopped when the key is, with small pieces of them falling an octave as they fade.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: {
        volume: 3.5,
        decay: 2.5,
        release: 0.9,
        hardness: 0.6,
        brightness: 0.5,
        position: 0.1,
        spread: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'falling',
        preset: 'Rain of falls',
        params: { size: 160, density: 14, mix: 0.45 },
      },
    ],
  },
  {
    id: 'buried-jar-cup-tapped-empty',
    name: 'Cup tapped empty',
    category: 'bell',
    preview: LADLE,
    description:
      'Tapped glass cut very short and dry, in one thimble of glass and one slap of tape.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: {
        volume: -1.5,
        decay: 0.7,
        damping: 0.5,
        brightness: 0.5,
        position: 0.3,
        release: 0.7,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Thimble', params: { body: 0, material: 0.9, mix: 0.6 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'buried-jar-first-ice-sings',
    name: 'First ice sings',
    category: 'bell',
    preview: ONE_DROP,
    description:
      'Glass beating seven times a second, let out into a vast tail that grows before it fades.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Shivering glass',
      params: { volume: -4.5, hardness: 0.25, brightness: 0.8, stretch: 1.15, decay: 16 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bloom', params: { decay: 10, mix: 0.45 } }],
  },
  {
    id: 'buried-jar-lantern-over-the-water',
    name: 'Lantern over the water',
    category: 'bell',
    preview: MOSS,
    description:
      'Vibraphone bars through a slow tremolo that tips between lows and highs, not up and down.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { volume: 6, hardness: 0.35, brightness: 0.5, decay: 9, position: 0.75, detune: 1.2 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Harmonic shimmer',
        params: { rate: 1.6, depth: 1, crossover: 500 },
      },
    ],
  },
  {
    id: 'buried-jar-cracked-in-the-kiln',
    name: 'Cracked in the kiln',
    category: 'bell',
    preview: ANSWERS,
    description:
      'Music box bars beating at eight a second, split by a ring modulator tuned to a low D.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { volume: 5, detune: 8, hardness: 0.5, decay: 4, brightness: 0.35 },
    },
    effects: [
      {
        deviceId: 'ring',
        preset: 'Dark bell',
        params: { root: 2, octave: 3, tone: 1800, mix: 0.45 },
      },
    ],
  },
  {
    id: 'buried-jar-wax-runs-into-the-bowl',
    name: 'Wax runs into the bowl',
    category: 'pad',
    preview: TWO_JARS,
    description: 'A very dark bowl whose tail sags in pitch and dulls the longer it has rung.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Dark bowl',
      params: { volume: -5.5, hardness: 0.2, brightness: 0.4, position: 0.2, detune: 3 },
    },
    effects: [{ deviceId: 'melt', preset: 'Candle wax', params: { sag: -25, mix: 0.6 } }],
  },
  {
    id: 'buried-jar-glass-mist-at-five',
    name: 'Glass mist at five',
    category: 'pad',
    preview: RINGS,
    description:
      'Rubbed glass caught in a warm fuzzy haze, an octave glowing above it as it is held.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { sustain: 1, brightness: 0.2, damping: 0.6, detune: 0.5 },
    },
    effects: [{ deviceId: 'haze', preset: 'Octave glow', params: { mix: 0.45 } }],
  },
  {
    id: 'buried-jar-carillon-for-snails',
    name: 'Carillon for snails',
    category: 'bell',
    preview: RAIN_CHAIN,
    description:
      'Music box bars with the body shrunk as far as it goes, sampled coarsely and left bright.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: {
        volume: -4,
        decay: 1.5,
        hardness: 1,
        position: 0.02,
        brightness: 0.9,
        damping: 0.1,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'Music box', params: { detail: 0.5 } },
      { deviceId: 'vintage-digital', preset: 'Glaze', params: { rate: 12000, aliasing: 0.5 } },
    ],
  },
  {
    id: 'buried-jar-flat-stone-struck-once',
    name: 'Flat stone, struck once',
    category: 'bell',
    preview: ONE_DROP,
    description:
      'A gong damped to a second and hit hard, with moments of it drifting back, some backwards.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: {
        volume: 6,
        decay: 1.2,
        damping: 0.4,
        hardness: 0.8,
        stretch: 1.3,
        release: 0.4,
        detune: 0.5,
      },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Backwards', params: { reach: 4, mix: 0.5 } }],
  },
  {
    id: 'buried-jar-bell-for-an-empty-jar',
    name: 'Bell for an empty jar',
    category: 'bell',
    preview: TWO_JARS,
    description:
      'A soft bowed bell that lasts as long as the key, with scattered fifths and octaves in its tail.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Bowed bell',
      params: { brightness: 0.6, stretch: 0.85, detune: 1.5, hardness: 0.3 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Scatter', params: { decay: 7, mix: 0.45 } }],
  },
]
