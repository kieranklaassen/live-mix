import type { VisualPreset } from '../preset'

const presets: readonly VisualPreset[] = [
  {
    id: 'ink-reeds-on-gold-leaf',
    name: 'Ink reeds on gold leaf',
    what: 'A few dark reeds stand upright against squares of warm gold leaf, with a little dust of ink.',
    variation: 0,
    world: {
      own: [1, -0.75, 0.55, -0.25, -0.3, 0, 0, 0],
      kinds: ['#e8c683', '#5a6a53', '#4a5a5a', '#6b4a38', '#8a3a26'],
      keep: 0.05,
      vivid: 0.5,
      contrast: 0.3,
      at: [0.16, 0],
      pace: 0.7,
    },
  },
  {
    id: 'vermilion-box-lid',
    name: 'Vermilion box lid',
    what: 'Gold clouds with scalloped edges lie over broad gold leaves on a deep red lid.',
    variation: 0,
    world: {
      own: [-1, 0.3, 0.8, 0.6, 1, 0, 0, 0],
      kinds: ['#b8402c', '#c98a4a', '#a8663a', '#e0b45a', '#f2d9a0'],
      keep: 0.05,
      pace: 0.5,
    },
  },
  {
    id: 'shell-blades-in-the-deep',
    name: 'Shell blades in the deep',
    what: 'Broad blades cut from shell shift green and rose in water as dark as a well.',
    variation: 0,
    world: {
      own: [-0.5, -0.4, 1, 0.5, -0.4, 1, 0, 0],
      kinds: ['#12404a', '#5f9a94', '#8f7a9a', '#cfe0d4', '#f0e2d8'],
      keep: 0.1,
    },
  },
  {
    id: 'rain-over-the-millet',
    name: 'Rain over the millet',
    what: 'Fine gold rain slants across bowed ears of millet on a night blue ground.',
    variation: 0,
    world: {
      own: [-0.8, 1, -0.6, 0.7, -1, 0, 0, 0.9],
      kinds: ['#26406b', '#8a9ab0', '#b09a6a', '#e6cf96', '#f4ead0'],
      keep: 0.05,
      pace: 1.2,
    },
  },
  {
    id: 'one-stem-and-the-moon',
    name: 'One stem and the moon',
    what: 'A single gold stem and its plume lean across a great moon of shell on black lacquer.',
    variation: 0,
    world: {
      own: [0, 0.1, 0.2, -1, -1, 0, 1, 0],
      kinds: ['#8a7a5a', '#a89a7a', '#7a8a7a', '#e6d9b0', '#f4ecd8'],
      keep: 0.1,
      pace: 0.6,
    },
  },
  {
    id: 'brushed-mountains-at-dawn',
    name: 'Brushed mountains at dawn',
    what: 'Ranges of mountains drawn in brown lines climb a sheet of pale rose paper.',
    variation: 1,
    world: {
      own: [1, 1, 0.3, 0.5, 0, 0, 0.2, 0],
      vivid: 0.5,
      answer: 1.3,
      kinds: ['#f2d6c6', '#8a5a44', '#7a6a5a', '#a0703a', '#b8482e'],
      keep: 0.05,
      pace: 0.4,
    },
  },
  {
    id: 'calm-strait-crescent',
    name: 'Calm strait crescent',
    what: 'A thin crescent of shell hangs over a low flat sea of fine gold lines.',
    variation: 1,
    world: {
      own: [-0.35, -1, -0.8, -0.35, -1, 0, -1, 0],
      kinds: ['#1f2f4a', '#8a96a8', '#7a8290', '#d9cfae', '#f2ead2'],
      keep: 0.05,
      pace: 0.4,
    },
  },
  {
    id: 'petals-on-a-green-river',
    name: 'Petals on a green river',
    what: 'Pale petals fall over a swelling river drawn in bold gold lines on dark green.',
    variation: 1,
    world: {
      own: [-1, 0, 0.8, 0.9, -0.6, 0, 0, -1],
      kinds: ['#1f5a48', '#9aa860', '#6f8a5a', '#d9c078', '#f4c9c0'],
      keep: 0.05,
    },
  },
  {
    id: 'beaded-dunes',
    name: 'Beaded dunes',
    what: 'Dunes set bead by bead in copper and gold roll under a small half hidden moon.',
    variation: 1,
    world: {
      own: [-0.45, 0.35, 0.65, 0.5, 0, -1, -0.3, 0],
      kinds: ['#b8683c', '#d99a5a', '#8f5a3c', '#f0c98a', '#f6e2b8'],
      keep: 0.05,
      pace: 0.6,
    },
  },
  {
    id: 'moon-among-gold-clouds',
    name: 'Moon among gold clouds',
    what: 'A huge moon of shell stands between banks of gold cloud over a low swell.',
    variation: 1,
    world: {
      own: [-0.6, -0.4, -0.3, -0.6, 1, 0, 1, 0],
      kinds: ['#5a2f4a', '#c9a060', '#8a7a4a', '#f0d48a', '#f6e8c0'],
      keep: 0.1,
      pace: 0.6,
    },
  },
]

export default presets
