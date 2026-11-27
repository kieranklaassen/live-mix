import type { VisualPreset } from '../preset'

const presets: readonly VisualPreset[] = [
  {
    id: 'flag-iris-on-cream',
    name: 'Flag iris on cream',
    what: 'The violet and yellow petals of one iris open from their stem on cream paper.',
    variation: 0,
    world: {
      own: [0, 1, 1, 1, 0.5, 0, 0, 0],
      kinds: ['#43337f', '#6a4aa0', '#c9962a', '#7a62b4', '#f3e2b4'],
      keep: 0.04,
      pace: 0.6,
    },
  },
  {
    id: 'dawn-mist-on-a-loch',
    name: 'Dawn mist on a loch',
    what: 'Rose and grey mist lies in bands over a still loch that holds it all again.',
    variation: 0,
    world: {
      own: [0, -1, -0.95, 0, 1, -0.3, -1, 0],
      kinds: ['#4f6478', '#c99a94', '#a8b0b8', '#e0b89a', '#f3dcc4'],
      keep: 0.04,
      pace: 0.5,
    },
  },
  {
    id: 'brush-ribbon-black-and-red',
    name: 'Brush ribbon black and red',
    what: 'Long ribbons of black ink and one of red run over white paper.',
    variation: 0,
    world: {
      own: [0.2, -0.25, 1, 0, -0.9, 0, 0, 0],
      kinds: ['#22242a', '#2c2c30', '#3a3634', '#b5302c', '#f2ece0'],
      keep: 0.03,
      pace: 0.6,
      contrast: 0.1,
    },
  },
  {
    id: 'pollen-let-go-at-dusk',
    name: 'Pollen let go at dusk',
    what: 'Clouds of gold grains drift and fold over each other in the last light.',
    variation: 0,
    world: {
      own: [0.5, 0, -0.4, 0, 0.7, 0, 0, -1],
      kinds: ['#4a3a4c', '#d9a24a', '#e0b868', '#c9803a', '#f3d898'],
      keep: 0.04,
      pace: 0.8,
    },
  },
  {
    id: 'gossamer-over-stubble',
    name: 'Gossamer over stubble',
    what: 'Single threads of spider silk lie along a pale morning, waving a little.',
    variation: 0,
    world: {
      own: [0.5, -1, -0.95, -1, 0.2, -0.3, 0, 0],
      kinds: ['#a89a74', '#e8e0c8', '#f0e8d4', '#d9c9a0', '#f6f0e0'],
      keep: 0.04,
      pace: 0.7,
    },
  },
  {
    id: 'comb-jelly-in-blue',
    name: 'Comb jelly in blue',
    what: 'Long faint arms of a comb jelly trail down through clear blue water.',
    variation: 0,
    world: {
      own: [0.5, 1, -1, 0, -0.35, 0.5, 0, 0.5],
      kinds: ['#1c3f5c', '#7aa4c0', '#a8c4cc', '#c9a8b8', '#e0e8e4'],
      keep: 0.04,
      pace: 0.6,
      roll: 180,
    },
  },
  {
    id: 'flamed-tulip',
    name: 'Flamed tulip',
    what: 'One tulip flamed in red and yellow stands against a deep green dark.',
    variation: 1,
    world: {
      own: [0, 1, -0.8, 1, 0.5, -0.2, 0, 0.6],
      kinds: ['#1c3a2e', '#b01c2a', '#e8b040', '#c8261c', '#f3d88a'],
      keep: 0.04,
      pace: 0.5,
      vivid: 0.45,
      light: 0.1,
    },
  },
  {
    id: 'whale-breath-at-blue-dusk',
    name: 'Whale breath at blue dusk',
    what: 'The breath of a whale stands white over still water, which holds it upside down.',
    variation: 1,
    world: {
      own: [0, 0.3, -0.7, 0, 0.1, -0.3, -1, 0.5],
      kinds: ['#3a4c74', '#8a94b8', '#b8b0c4', '#d8b0b0', '#f3dccc'],
      keep: 0.04,
      pace: 0.6,
    },
  },
  {
    id: 'heron-plume',
    name: 'Heron plume',
    what: 'A long grey blue plume of fine barbs lies on paper.',
    variation: 1,
    world: {
      own: [-0.4, 0.5, 0.95, -1, 0, -1, 0, 0],
      kinds: ['#3f5468', '#5a7088', '#7a8a98', '#4a5a6c', '#ecdcc0'],
      keep: 0.05,
      pace: 0.5,
    },
  },
  {
    id: 'scarf-across-a-dark-room',
    name: 'Scarf across a dark room',
    what: 'A shot silk scarf in plum, teal and copper floats across a dark room.',
    variation: 1,
    world: {
      own: [0, -1, 0, 0.5, 0.5, 0, 0, 1],
      kinds: ['#2f6a70', '#7a3a6a', '#b5643a', '#a84a5a', '#e0b48a'],
      keep: 0.04,
      pace: 0.7,
    },
  },
]

export default presets
