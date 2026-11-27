import type { VisualPreset } from '../preset'

const presets: readonly VisualPreset[] = [
  {
    id: 'canes-in-thin-ink',
    name: 'Canes in thin ink',
    what: 'Slender canes stand side by side in thin green grey ink, some pale as if in mist.',
    variation: 0,
    world: {
      own: [0.8, 1, 0.03, 0, -1, -0.15, 0, -0.25],
      kinds: ['#3f4a44', '#6a7a6a', '#8a948a', '#54635a', '#2f3a34'],
      keep: 0.06,
      tones: ['#1d2420', '#8f998c', '#f4efdf'],
      toned: 0.4,
      pace: 0.4,
    },
  },
  {
    id: 'barn-boards-in-oxide',
    name: 'Barn boards in oxide',
    what: 'Broad strokes of oxide red and ochre lie one over another on weathered boards.',
    variation: 0,
    world: {
      own: [0.2, -1, 0, -1, 1, -0.2, 0, 0],
      kinds: ['#5f3a2c', '#a8412e', '#c9793a', '#e0c08a', '#e8dcc0'],
      keep: 0.05,
      contrast: 0.25,
      pace: 0.4,
    },
  },
  {
    id: 'gilt-reeds-on-lacquer',
    name: 'Gilt reeds on lacquer',
    what: 'Thin reeds of gold lean together on black lacquer, each drawn out to a point.',
    variation: 0,
    world: {
      own: [0.85, 1, 0.2, 1, 0.4, 0, 1, 0],
      kinds: ['#8a6a2f', '#b5904a', '#d9b96a', '#f0dca0', '#c9583a'],
      keep: 0.05,
      pace: 0.6,
      edge: 0.35,
    },
  },
  {
    id: 'tide-flats-in-wash',
    name: 'Tide flats in wash',
    what: 'Wide washes of grey blue and sand lie level on wet paper and run into each other.',
    variation: 0,
    world: {
      own: [0, -1, 0, 0, -1, 0.3, 0, -1],
      kinds: ['#3f6a8a', '#8fb0bf', '#c9b08a', '#a58f9a', '#d98a6a'],
      keep: 0.06,
      pace: 0.5,
    },
  },
  {
    id: 'sedge-bent-by-a-gust',
    name: 'Sedge bent by a gust',
    what: 'Long green blades and one of tan sweep round across each other on pale bare canvas.',
    variation: 0,
    world: {
      own: [0.9, 0.6, 0.5, 0, 1, 0, 1, 0.4],
      kinds: ['#3f6a3a', '#7f9a4f', '#5a8a5a', '#b8c87a', '#d9a85a'],
      keep: 0.05,
      pace: 0.6,
    },
  },
  {
    id: 'ring-in-one-breath',
    name: 'Ring in one breath',
    what: 'A great black turn of a dry brush, a whitewashed one across it and much bare canvas.',
    variation: 1,
    world: {
      own: [-1, 0, 1, 0, 0, -0.45, 0, 0],
      kinds: ['#2a2826', '#4a4644', '#3a3634', '#35302c', '#6a2f24'],
      keep: 0.1,
      pace: 0.3,
    },
  },
  {
    id: 'windfall-under-a-maple',
    name: 'Windfall under a maple',
    what: 'Leaves of rust, wine and gold have fallen across one another and throw small shadows.',
    variation: 1,
    world: {
      own: [0, 0, -1, -0.75, 1, 0, 1, 1],
      kinds: ['#6a5440', '#a8412e', '#d98f3a', '#7a2a34', '#e8c25a'],
      keep: 0.05,
      pace: 0.4,
    },
  },
  {
    id: 'cut-papers-on-a-deal-table',
    name: 'Cut papers on a deal table',
    what: 'Flat strips of coloured paper cross on a bare wooden table top, each a little raised.',
    variation: 1,
    world: {
      own: [0.3, 0, 0.1, -0.9, 1, 0, -1, 1],
      kinds: ['#b5946a', '#4f7a7a', '#d9a08a', '#e8dcc0', '#b5533a'],
      keep: 0.05,
      pace: 0.3,
    },
  },
  {
    id: 'dyed-hanks-in-the-dark',
    name: 'Dyed hanks in the dark',
    what: 'Soft hanks of dyed wool in amber, rust and sea blue hang side by side in the dark.',
    variation: 1,
    world: {
      own: [0.6, 1, 0, 1, -0.8, 0.6, 0, -1],
      kinds: ['#4a6a78', '#c98f52', '#8a4f3f', '#e0c48a', '#b86a6a'],
      keep: 0.06,
      pace: 0.9,
    },
  },
  {
    id: 'chalk-hoops-on-slate',
    name: 'Chalk hoops on slate',
    what: 'Hoops of dry white and blue chalk overlap on a dark school slate.',
    variation: 1,
    world: {
      own: [0.4, 0.35, 0.8, 0.85, 0.3, -0.5, 0, 0],
      kinds: ['#c9d4d9', '#8fb0c9', '#e8e4d9', '#d9b5a0', '#e8a07a'],
      keep: 0.05,
      tones: ['#1c262b', '#7f9aa5', '#f4f0e6'],
      toned: 0.3,
      pace: 0.4,
    },
  },
]

export default presets
