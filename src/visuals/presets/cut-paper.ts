import type { VisualPreset } from '../preset'

const presets: readonly VisualPreset[] = [
  {
    id: 'carved-white-sheets',
    name: 'Carved white sheets',
    what: 'White paper cut down and built up in steps, nothing but shadow to tell the sheets apart.',
    variation: 0,
    world: {
      own: [0, 0.35, 1, -1, -1, -0.2, 0, 0],
      kinds: ['#8b97a3', '#a9adb0', '#b7b2a8', '#97a39c', '#c2a796'],
      keep: 0.05,
      tones: ['#2d343d', '#a7abae', '#f7f4ed'],
      toned: 0.75,
      pace: 0.5,
    },
  },
  {
    id: 'pressed-seaweed-page',
    name: 'Pressed seaweed page',
    what: 'Fronds of olive, wine and rust seaweed lie loose on cream album paper and sway a little.',
    variation: 0,
    world: {
      own: [0, -1, 0, -1, 1, 0, 0.45, 0],
      kinds: ['#3d4a2b', '#6e2f3a', '#8f7a35', '#5a6b3c', '#9c4a34'],
      keep: 0.04,
      tones: ['#1d1c16', '#8a7b5c', '#f4ecd8'],
      toned: 0.3,
      pace: 1.2,
    },
  },
  {
    id: 'pricked-night-sheets',
    name: 'Pricked night sheets',
    what: 'Dark blue sheets pricked full of small holes, with a lamp somewhere behind them.',
    variation: 0,
    world: {
      own: [0, 1, -1, 1, 1, 1, 0.3, 0],
      kinds: ['#2b4170', '#47608f', '#c99a52', '#e0c890', '#d8845a'],
      keep: 0.06,
      pace: 0.6,
    },
  },
  {
    id: 'painted-cart-wheel',
    name: 'Painted cart wheel',
    what: 'Sheets of ochre, brick and cream laid round and round a hub, each with its leaf cut out.',
    variation: 0,
    world: {
      own: [0, 0.3, 0, 0, 1, 0, 0, 1],
      kinds: ['#8e3b25', '#c8873a', '#e3c78e', '#5c6b4a', '#d9683c'],
      keep: 0.05,
    },
  },
  {
    id: 'copper-pit-terraces',
    name: 'Copper pit terraces',
    what: 'Close above great pits cut down in terraces of rust and green, with a low sun across them.',
    variation: 0,
    world: {
      own: [-1, 0.25, 1, 0, 1, -0.5, 0, 0],
      kinds: ['#a4532e', '#c07a4a', '#7a4a3a', '#3f8a80', '#d9b27a'],
      keep: 0.05,
      pace: 0.3,
    },
  },
  {
    id: 'seed-merchant-drawers',
    name: 'Seed merchant drawers',
    what: 'Rows of little trays of round seeds and beans, brick, black, cream and butter yellow.',
    variation: 0,
    world: {
      own: [0.5, 1, 0.6, 0, 1, -0.1, 0, 0],
      kinds: ['#5a4a42', '#a8684a', '#e0bc70', '#b85a48', '#f0e0c0'],
      keep: 0.05,
      light: 0.03,
      contrast: 0.08,
      pace: 0.4,
    },
  },
  {
    id: 'cut-snow-star',
    name: 'Cut snow star',
    what: 'One white star, folded six times and cut, hangs on a wall of deep winter blue.',
    variation: 1,
    world: {
      own: [0, 0, 0, 1, -1, 0, -0.4, 1],
      kinds: ['#3f6fa8', '#7d9fc4', '#a8bfd4', '#cfd9e0', '#b8c8dc'],
      keep: 0.05,
      pace: 0.5,
    },
  },
  {
    id: 'lantern-at-the-gate',
    name: 'Lantern at the gate',
    what: 'A dark paper lantern with its lamp lit, the warm light standing in every cut.',
    variation: 1,
    world: {
      own: [-0.1, 0.5, -0.6, 1, 1, 0.88, -0.3, 0],
      kinds: ['#6a3a22', '#b8662e', '#d9983f', '#e6c070', '#a8402a'],
      keep: 0.05,
    },
  },
  {
    id: 'screens-before-the-bay',
    name: 'Screens before the bay',
    what: 'Tall cut screens of sage, brick and teal stand in a row, bright sky and sea behind them.',
    variation: 1,
    world: {
      own: [0, -0.4, 0, -0.6, 1, 0.15, 0.2, -1],
      kinds: ['#2f5a6a', '#4f8a80', '#a8c0a0', '#d9d0a8', '#c86a4a'],
      keep: 0.05,
      light: -0.08,
      pace: 0.6,
    },
  },
  {
    id: 'festival-paper-flags',
    name: 'Festival paper flags',
    what: 'Many small cut flags in pink, teal, saffron and green hang in rows and stir.',
    variation: 1,
    world: {
      own: [0.55, 0.4, 0, 0, 1, 0, 0.4, 0],
      kinds: ['#2f7f86', '#b84a78', '#d99a35', '#4f7f4a', '#c84f3a'],
      keep: 0.05,
      pace: 1.4,
    },
  },
]

export default presets
