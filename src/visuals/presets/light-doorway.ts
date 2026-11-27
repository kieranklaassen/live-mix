import type { VisualPreset } from '../preset'

const presets: readonly VisualPreset[] = [
  {
    id: 'duck-egg-bedroom',
    name: 'Duck egg bedroom',
    what: 'A bare bedroom painted pale blue by day, sun in the panes of its tall glass door.',
    variation: 0,
    world: {
      own: [0.45, 0, 1, 0, 0, -0.35, 1, 0.9],
      kinds: ['#b89870', '#86b4b0', '#f0e6d2', '#f0c878', '#f0d890'],
      keep: 0.1,
      pace: 0.6,
    },
  },
  {
    id: 'door-standing-in-dunes',
    name: 'Door standing in dunes',
    what: 'A door stands by itself on rippled sand at daybreak, and lets another light through.',
    variation: 0,
    world: {
      own: [0, 0, 0.15, -1, 1, 0.75, 0.3, 0],
      kinds: ['#2f5590', '#e89070', '#d8a878', '#f6dca8', '#f6efdc'],
      near: 0.8,
      at: [-0.12, 0.06],
      vivid: 0.2,
      keep: 0.06,
      pace: 0.5,
    },
  },
  {
    id: 'flooded-loggia',
    name: 'Flooded loggia',
    what: 'A row of tall openings stands along black water and lies in it again.',
    variation: 0,
    world: {
      own: [-0.25, 1, 0, 1, 0, 0.2, 0, 0],
      kinds: ['#2f5f78', '#5f8fa0', '#c0a878', '#d8d0b0', '#e8dcc0'],
      keep: 0.08,
    },
  },
  {
    id: 'moon-gate-and-pool',
    name: 'Moon gate and pool',
    what: 'A great round gate in a stone wall closes into a full ring in the still pool before it.',
    variation: 0,
    world: {
      own: [1, -1, 1, 1, -0.9, 1, 0, 0],
      kinds: ['#5f84a0', '#8fb0c0', '#e8d8a8', '#f0e8d0', '#f6f0e0'],
      near: 0.93,
      light: 0.14,
      keep: 0.06,
      pace: 0.5,
    },
  },
  {
    id: 'shutters-in-the-heat',
    name: 'Shutters in the heat',
    what: 'Slats of afternoon light lie over the boards of a dark hot room.',
    variation: 0,
    world: {
      own: [0.7, 0, 1, 0, 0, -0.75, 0, -1],
      kinds: ['#c0622e', '#d88a3f', '#e8b060', '#f0cc88', '#f6e2b0'],
      keep: 0.06,
      pace: 0.5,
    },
  },
  {
    id: 'thread-beside-a-landing-door',
    name: 'Thread beside a landing door',
    what: 'A door is all but shut, and one thread of light stands in the dark.',
    variation: 0,
    world: {
      own: [0, 0, -0.95, 0.3, 0, 0.7, 0, 0],
      kinds: ['#6a3a4a', '#b07a6a', '#d09a80', '#f0d0b0', '#f0e0c8'],
      keep: 0.06,
      pace: 0.3,
      light: 0.1,
    },
  },
  {
    id: 'bottom-of-the-draw-well',
    name: 'Bottom of the draw well',
    what: 'Straight up a deep shaft of rough blocks the light stands square and far away.',
    variation: 1,
    world: {
      own: [-0.1, 0, 1, 0, -1, 1, 0, 0],
      kinds: ['#4a6a78', '#8aa0a0', '#b09a70', '#e0d8b8', '#f0e8d0'],
      keep: 0.08,
      pace: 0.5,
    },
  },
  {
    id: 'lime-courtyard-first-stars',
    name: 'Lime courtyard first stars',
    what: 'Low walls stand round a still basin, with one round-headed door and the first stars over it.',
    variation: 1,
    world: {
      own: [0.35, -1, 0, 1, 1, -1, 0.1, 0],
      kinds: ['#2f3f78', '#a86a78', '#d8905a', '#f0c890', '#f0e0b8'],
      keep: 0.06,
      pace: 0.5,
    },
  },
  {
    id: 'clay-granary-noon',
    name: 'Clay granary noon',
    what: 'Four dark doors stand in an ochre wall at noon, and panes of sun lie across the corner.',
    variation: 1,
    world: {
      own: [0.3, 1, 0.3, -1, 0, -0.5, 1, 1],
      kinds: ['#c9a070', '#d8a05a', '#b8683a', '#f0dcb0', '#f6ecd0'],
      keep: 0.06,
      pace: 0.4,
    },
  },
  {
    id: 'slatted-tower-dust',
    name: 'Slatted tower dust',
    what: 'One slanting beam comes down through slats into the dusty dark of a tall shaft.',
    variation: 1,
    world: {
      own: [0, -0.6, -0.7, 0, -0.5, -0.2, -1, -0.8],
      kinds: ['#56687a', '#7a8a94', '#a8a090', '#f0e0c0', '#f6ecd8'],
      keep: 0.06,
      pace: 0.6,
    },
  },
]

export default presets
