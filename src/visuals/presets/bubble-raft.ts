import type { VisualPreset } from '../preset'

const presets: readonly VisualPreset[] = [
  {
    id: 'raspberry-froth',
    name: 'Raspberry froth',
    what: 'A thick pink froth pressed into cells, its walls dark berry, light caught in each.',
    variation: 0,
    world: {
      own: [-0.55, 0.2, -1, 1, 0, 0, 0.3, 0],
      kinds: ['#7a2a45', '#e09aa4', '#b04a62', '#f0c4b8', '#f8e4d4'],
      keep: 0.05,
      pace: 0.7,
      vivid: 0.2,
    },
  },
  {
    id: 'pearls-on-grey-silk',
    name: 'Pearls on grey silk',
    what: 'A few large pale pearls lie apart on smooth grey cloth, each with its small soft shadow.',
    variation: 0,
    world: {
      own: [-0.8, 0, 0.6, 0, 1, 0, 0.5, 0],
      kinds: ['#8f9398', '#d8cdc4', '#b5a8a0', '#e0c8bc', '#f0e8dc'],
      keep: 0.08,
      light: 0.1,
      pace: 0.4,
    },
  },
  {
    id: 'moon-made-of-beads',
    name: 'Moon made of beads',
    what: 'A ball covered all over in close beads, one colour to a country, turns slowly in the dark.',
    variation: 0,
    world: {
      own: [0.1, -0.3, 0, -1, 1, 1, 0, 1],
      kinds: ['#5f7fa0', '#c9a878', '#8a5a6a', '#d8c8a8', '#7a9a80'],
      keep: 0.05,
      vivid: 0.35,
      light: 0.15,
    },
  },
  {
    id: 'red-rice-and-black',
    name: 'Red rice and black',
    what: 'Long grains of red, black and straw lie in short rows that turn from patch to patch.',
    variation: 0,
    world: {
      own: [-0.4, -0.6, 0, 0.6, 1, -1, -1, 0],
      kinds: ['#2a1a14', '#c98f5f', '#8a3022', '#e0c08a', '#f0dcae'],
      keep: 0.05,
      pace: 0.5,
    },
  },
  {
    id: 'duckweed-ditch',
    name: 'Duckweed ditch',
    what: 'Flat round leaves of duckweed, pale and deep green, crowd the dark water of a ditch.',
    variation: 0,
    world: {
      own: [-0.3, -0.4, 0.25, 1, -1, -0.8, 0.6, 0],
      kinds: ['#1f3f36', '#8fae5a', '#5a8a48', '#c0cc74', '#e0dc9a'],
      keep: 0.05,
      contrast: 0.15,
      pace: 0.6,
    },
  },
  {
    id: 'one-raft-on-blue',
    name: 'One raft on blue',
    what: 'A single island of clear bubbles lies quite still in the middle of a wide blue water.',
    variation: 0,
    world: {
      own: [-0.2, 0, 0, 1, 0, 0, 0, -1],
      kinds: ['#2f6f96', '#a8cdd8', '#5f9aa8', '#e0d8b8', '#f4f0e0'],
      keep: 0.1,
      pace: 0.5,
    },
  },
  {
    id: 'full-moon-domes',
    name: 'Full moon domes',
    what: 'Glass domes to the edge of the world, each holding a thin cut of the full moon.',
    variation: 1,
    world: {
      own: [-0.2, 0.8, 0, -1, 0, 0, 0, -0.4],
      kinds: ['#3a5a80', '#4f6f9a', '#5a8a98', '#b0b8d0', '#e8e4d0'],
      keep: 0.1,
    },
  },
  {
    id: 'shingle-at-low-sun',
    name: 'Shingle at low sun',
    what: 'Round stones of rust, sand and slate run down to the sea, all lit by a low sun.',
    variation: 1,
    world: {
      own: [-0.1, -0.6, 0, 1, 1, -0.9, 0.7, -0.2],
      kinds: ['#6a4a42', '#d8936a', '#8a7a70', '#c8b090', '#f4d0a0'],
      keep: 0.05,
      pace: 0.5,
    },
  },
  {
    id: 'pads-at-first-light',
    name: 'Pads at first light',
    what: 'Thin round pads lie apart on milky water in a pale green and rose morning.',
    variation: 1,
    world: {
      own: [-0.4, 0, 0.5, 0.9, -1, -0.8, -1, 0.15],
      kinds: ['#b8c4b4', '#ecc8bc', '#6f9a78', '#4f8468', '#f6e4d4'],
      keep: 0.08,
      pace: 0.6,
    },
  },
  {
    id: 'tray-of-glass-marbles',
    name: 'Tray of glass marbles',
    what: 'Great glass marbles of teal, plum and amber stand side by side, seen from close above.',
    variation: 1,
    world: {
      own: [-1, 0.4, 0, 0, 0, -1, 0, 0.9],
      kinds: ['#2f6f78', '#6a3f5f', '#b87a35', '#8f3f3a', '#d8c08a'],
      keep: 0.1,
    },
  },
]

export default presets
