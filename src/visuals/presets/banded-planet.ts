import type { VisualPreset } from '../preset'

const presets: readonly VisualPreset[] = [
  {
    id: 'wide-straw-rings',
    name: 'Wide straw rings',
    what: 'A small straw coloured globe floats inside broad open rings in the black.',
    variation: 0,
    world: {
      own: [0.85, 0.2, 0, 0.72, 1, 0.1, 0, 0],
      kinds: ['#b08a52', '#e0c896', '#c9a56a', '#8f6f4a', '#f2e6c4'],
      keep: 0.08,
      pace: 0.7,
      near: 0.9,
    },
  },
  {
    id: 'sepia-planet-plate',
    name: 'Sepia planet plate',
    what: 'A globe of many fine bands printed in brown ink on old cream paper, with a row of moons.',
    variation: 0,
    world: {
      own: [0.2, 1, 0, 0.8, -1, 0.45, 1, -1],
      kinds: ['#5a3c28', '#d8c096', '#7a5636', '#c09a6a', '#3a2618'],
      keep: 0.05,
      tones: ['#2a1a10', '#a07a50', '#f3e6c8'],
      toned: 0.75,
      pace: 0.5,
    },
  },
  {
    id: 'eye-of-a-rust-storm',
    name: 'Eye of a rust storm',
    what: 'One vast rust red storm turns among curling belts of cream and brown.',
    variation: 0,
    world: {
      own: [-0.1, 0.2, 0, -0.35, -1, 0.7, 0, 1],
      kinds: ['#7a4226', '#e2cfae', '#b0683a', '#a8402a', '#f0e2c8'],
      keep: 0.08,
      pace: 1.4,
      at: [-0.1, 0.02],
    },
  },
  {
    id: 'cracked-ice-moon',
    name: 'Cracked ice moon',
    what: 'A pale shell of ice, run over by fine brown cracks, lit almost from in front.',
    variation: 0,
    world: {
      own: [1, -0.7, 1, 0.3, -1, 0.45, 0, 0],
      kinds: ['#a8bcc8', '#dfe6e6', '#8a5a48', '#c4ced0', '#f4f6f4'],
      keep: 0.05,
      pace: 0.4,
    },
  },
  {
    id: 'rain-on-a-blue-world',
    name: 'Rain on a blue world',
    what: 'White cloud lies torn along the belts of a world of deep sea and green land.',
    variation: 0,
    world: {
      own: [0, 0, -1, -0.2, -1, 0.35, 0, 0],
      kinds: ['#3f74a0', '#a8c4d4', '#5a7a48', '#b09a66', '#f2f4f2'],
      keep: 0.08,
    },
  },
  {
    id: 'marbled-jade',
    name: 'Marbled jade',
    what: 'Green, cream and black run through each other like veins in polished stone, close up.',
    variation: 0,
    world: {
      own: [-1, 0.2, 0, -0.75, -1, 0.8, 0, 0],
      kinds: ['#2c5a48', '#a8c0a0', '#1a3a34', '#dfe4cc', '#6f9a7c'],
      keep: 0.05,
      pace: 0.6,
      contrast: 0.2,
    },
  },
  {
    id: 'gold-ring-of-a-hidden-sun',
    name: 'Gold ring of a hidden sun',
    what: 'A dark globe covers its sun, and only a thin gold ring of air shines round it.',
    variation: 1,
    world: {
      own: [0.6, 0, 0, 1, 0, 0, 0, 0],
      kinds: ['#c98a3c', '#8a5a34', '#6a4a3a', '#f0c070', '#f6dca0'],
      keep: 0.05,
      pace: 0.6,
    },
  },
  {
    id: 'green-veils-at-the-pole',
    name: 'Green veils at the pole',
    what: 'Curtains of green and rose light stand along the dark edge of a sleeping world.',
    variation: 1,
    world: {
      own: [0, 0, 0, 0.6, 0, -1, 0, 0],
      kinds: ['#2f5a5a', '#5aa88a', '#8a5a80', '#a8d0b0', '#e6f0d8'],
      keep: 0.05,
    },
  },
  {
    id: 'ring-arch-in-pink-haze',
    name: 'Ring arch in pink haze',
    what: 'A great pale arch of rings stands in a rose sky over long plum and cream bands of cloud.',
    variation: 1,
    world: {
      own: [0.7, 0.3, 0, -0.7, 1, 0.1, 0.75, 0],
      kinds: ['#b8705a', '#d8a094', '#c98a6a', '#f0d0b8', '#8a4a44'],
      keep: 0.05,
      tones: ['#3a1a24', '#d08a86', '#fbe8d8'],
      toned: 0.55,
      contrast: 0.35,
      light: 0.06,
      pace: 0.6,
    },
  },
  {
    id: 'seven-moons-rising',
    name: 'Seven moons rising',
    what: 'Half moons of every size hang in an arc over a blue edge, before clouds of stars.',
    variation: 1,
    world: {
      own: [0, 0.3, 0, 0.1, 0, 0.3, -1, -1],
      kinds: ['#3a5a9a', '#7a86b8', '#5a4a80', '#c9a890', '#f0e4d8'],
      keep: 0.08,
    },
  },
]

export default presets
