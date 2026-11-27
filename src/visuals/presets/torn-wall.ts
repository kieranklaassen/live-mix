import type { VisualPreset } from '../preset'

const presets: readonly VisualPreset[] = [
  {
    id: 'far-range-in-handmade-paper',
    name: 'Far range in handmade paper',
    what: 'Torn sheets of blue and violet stand one behind another as hills under a peach sky.',
    variation: 0,
    world: {
      own: [0, -1, 0, 1, -1, 0.3, 0, 0],
      kinds: ['#f0c8a8', '#2f4058', '#4f6480', '#7f88a4', '#b8a0b0'],
      keep: 0.03,
      pace: 0.6,
    },
  },
  {
    id: 'letters-burnt-through',
    name: 'Letters burnt through',
    what: 'A fire has eaten one round hole through a bundle of cream letters, sheet by sheet.',
    variation: 0,
    world: {
      own: [0, 0.9, 1, 1, -1, 0.2, 0.25, 0],
      kinds: ['#1c1614', '#eadfc4', '#d8c49c', '#c9ae84', '#b08a60'],
      keep: 0.03,
      pace: 0.6,
      light: -0.1,
    },
  },
  {
    id: 'white-card-well',
    name: 'White card well',
    what: 'Thick white card is cut away in rings, each lower than the last, in plain daylight.',
    variation: 0,
    world: {
      own: [0, 1, -1, -1, -1, 1, 0, 0],
      kinds: ['#e8e4dc', '#e8e4dc', '#e8e4dc', '#e8e4dc', '#c9a890'],
      keep: 0,
      pace: 0.3,
      light: -0.12,
      contrast: 0.2,
    },
  },
  {
    id: 'sunset-through-blackout-paper',
    name: 'Sunset through blackout paper',
    what: 'Rips in black paper over a window let in the low sun and the last orange of the evening.',
    variation: 1,
    world: {
      own: [0, 0, 0, 1, -0.6, -1, 0, 0],
      kinds: ['#d8642a', '#7a4660', '#b05a48', '#eeb898', '#c9583a'],
      keep: 0.03,
      pace: 0.7,
    },
  },
  {
    id: 'lichen-on-the-north-gable',
    name: 'Lichen on the north gable',
    what: 'Grey and sulphur lichen spreads over an old limewashed wall and into its broken places.',
    variation: 1,
    world: {
      own: [0.2, 0, 0, 0.9, -1, 0.3, -0.75, 0],
      kinds: ['#4f5f66', '#c8ccc8', '#a8b09a', '#c0ae58', '#7a5a4a'],
      keep: 0.03,
      pace: 0.3,
      vivid: -0.15,
    },
  },
  {
    id: 'fig-shade-on-limewash',
    name: 'Fig shade on limewash',
    what: 'The moving shade of a fig tree lies over a warm white wall with one deep tear in it.',
    variation: 1,
    world: {
      own: [-0.6, 0, 0, 0.8, 0, 0.5, 0, 1],
      kinds: ['#b8583a', '#f0e0c8', '#d8a868', '#c98060', '#8a4030'],
      keep: 0.03,
      light: 0.05,
    },
  },
  {
    id: 'ticket-wall-under-the-lamp',
    name: 'Ticket wall under the lamp',
    what: 'Hundreds of small pasted tickets hang ragged in the pool of one street lamp.',
    variation: 0,
    world: {
      own: [0.4, 0, 0, 0, 1, 0, 0, -1],
      kinds: ['#3f6f70', '#8a5a70', '#d0a050', '#7a8a60', '#a83f34'],
      keep: 0.05,
      pace: 0.8,
      light: 0.12,
    },
  },
  {
    id: 'bark-of-an-old-birch',
    name: 'Bark of an old birch',
    what: 'White birch bark split across in long dark eyes, with tan and brown layers curling under it.',
    variation: 1,
    world: {
      own: [1, 0, 0.4, 1, -1, 0, 0.2, 0],
      kinds: ['#1c1614', '#eeeae2', '#c89a78', '#8a5a44', '#e0d4c4'],
      keep: 0.03,
      roll: 90,
      pace: 0.4,
    },
  },
  {
    id: 'floes-over-black-water',
    name: 'Floes over black water',
    what: 'White ice has split into long floes, with blue edges and black water showing between.',
    variation: 1,
    world: {
      own: [1, 0, 0, 1, -1, 0.4, 0.3, 0],
      kinds: ['#0c1620', '#e4ecee', '#a8c8d4', '#5f90a8', '#2f5870'],
      keep: 0.03,
      pace: 0.5,
    },
  },
  {
    id: 'cut-card-at-high-noon',
    name: 'Cut card at high noon',
    what: 'Great clean cut shapes of persimmon, teal and mustard card throw hard shadows.',
    variation: 0,
    world: {
      own: [-0.4, 0, -1, 1, -1, 1, 0, 0],
      kinds: ['#2f6f70', '#f0e0c0', '#e0a838', '#d8603a', '#2a3444'],
      keep: 0.03,
      pace: 0.6,
    },
  },
]

export default presets
