import type { VisualPreset } from '../preset'

const presets: readonly VisualPreset[] = [
  {
    id: 'anemones-on-black-stock',
    name: 'Anemones on black stock',
    what: 'Pale anemones stand in a narrow cup, printed in chalky inks on black paper.',
    variation: 0,
    size: 0.44,
    world: {
      own: [1, 1, 0, -1, 0, -0.35, -0.8, 0],
      kinds: ['#5f7f8f', '#c9a8b8', '#b88a7a', '#d8cfc0', '#b0485a'],
      keep: 0.05,
      pace: 0.6,
    },
  },
  {
    id: 'picnic-seen-by-a-magpie',
    name: 'Picnic seen by a magpie',
    what: 'A checked cloth from straight above, with plates, a melon and a plum laid out on it.',
    variation: 0,
    world: {
      own: [0, 1, 0, 0, 0, 1, 1, 0],
      kinds: ['#35597f', '#f2d590', '#e8c070', '#cf5a44', '#c9503f'],
      keep: 0.02,
      pace: 0.5,
    },
  },
  {
    id: 'one-quince-in-indigo',
    name: 'One quince in indigo',
    what: 'A single quince on a low table under a thin moon, with bare paper all around it.',
    variation: 0,
    size: 0.4,
    world: {
      own: [0, 1, 0, 0, -1, -0.4, -1, 0],
      kinds: ['#2f3f68', '#9aa6bc', '#8a94a8', '#5f6f94', '#2f3f68'],
      keep: 0,
      pace: 0.3,
    },
  },
  {
    id: 'uncut-seed-packets',
    name: 'Uncut seed packets',
    what: 'Nine little fruit labels on one sheet, each printed flat with its inks in another order.',
    variation: 0,
    world: {
      own: [0, -1, 0, 0, 1, 0, 0, 0],
      kinds: ['#2f6f72', '#e3a94a', '#d8c090', '#d0603a', '#b03a3a'],
      keep: 0.05,
      vivid: -0.1,
    },
  },
  {
    id: 'cut-glass-at-sundown',
    name: 'Cut glass at sundown',
    what: 'Faceted fruit and a faceted dish in coarse dots on paper rolled from rose to apricot.',
    variation: 0,
    world: {
      own: [-1, 0.8, -1, 1, 0, -0.7, -1, 0],
      kinds: ['#5a3f58', '#e0a088', '#eac88f', '#b8483f', '#d8604a'],
      keep: 0.03,
    },
  },
  {
    id: 'gables-in-slanting-rain',
    name: 'Gables in slanting rain',
    what: 'Rain slants in blue strokes over a harbour town of steep red and yellow gables.',
    variation: 1,
    world: {
      own: [-0.6, -0.8, 0, -1, 0, -0.3, 0, -0.8],
      kinds: ['#2b4058', '#eebf6a', '#7f93b0', '#98606a', '#d9a04a'],
      keep: 0.03,
    },
  },
  {
    id: 'peaks-in-a-cold-tarn',
    name: 'Peaks in a cold tarn',
    what: 'Steep snow sided peaks stand twice, once in the air and once in still water.',
    variation: 1,
    world: {
      own: [0, 1, 0.8, 1, 0, 0.15, -1, 0],
      kinds: ['#2f5068', '#8fb3b8', '#9fb8c0', '#e0a890', '#e8c0a0'],
      keep: 0.03,
    },
  },
  {
    id: 'sown-valley-from-the-ridge',
    name: 'Sown valley from the ridge',
    what: 'Fields of green, rust and straw run away in striped patches to a low sun.',
    variation: 1,
    world: {
      own: [0, 1, 0, 0, 0, 0.8, 1, 0],
      kinds: ['#3a6f7f', '#e8c05a', '#d8c060', '#c96a44', '#c9603a'],
      keep: 0.03,
    },
  },
  {
    id: 'harbour-light-alone',
    name: 'Harbour light alone',
    what: 'A lighthouse on its rock, one huge low moon, and black still water under both.',
    variation: 1,
    world: {
      own: [1, 1, 0, 0, -1, -0.3, -1, 0],
      kinds: ['#3f5a78', '#e8d8b0', '#c0b090', '#c9a884', '#e8d8b0'],
      keep: 0.03,
    },
  },
  {
    id: 'rays-behind-the-headlands',
    name: 'Rays behind the headlands',
    what: 'Broad rays fan from a low sun over the far hills, flat and bold as a travel bill.',
    variation: 1,
    world: {
      own: [0, -1, 0, 0, 0, -0.6, 0, 1],
      kinds: ['#2f5a7a', '#e8b04a', '#e8b04a', '#d8503a', '#d8503a'],
    },
  },
]

export default presets
