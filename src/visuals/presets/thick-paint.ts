import type { VisualPreset } from '../preset'

const presets: readonly VisualPreset[] = [
  {
    id: 'lavender-rows',
    name: 'Lavender rows',
    what: 'Rows of lavender run straight up to one point on the hill under a pale summer sky.',
    variation: 0,
    world: {
      own: [-0.3, -0.2, -0.4, 0, 1, 0, 0, 1],
      kinds: ['#6a5a9c', '#b7cbd6', '#4d6650', '#b79fd0', '#f3ead2'],
      keep: 0.05,
    },
  },
  {
    id: 'snowed-in-terraces',
    name: 'Snowed in terraces',
    what: 'Snow lies on the terraces of a hill, blue in every hollow, under a low white sky.',
    variation: 0,
    world: {
      own: [0.15, 0.2, 0.42, 0, 1, 0.1, 0, -0.8],
      kinds: ['#9ab4d6', '#c6d3de', '#333f4d', '#e6eef6', '#f8f6ef'],
      keep: 0.03,
      pace: 0.6,
    },
  },
  {
    id: 'red-clay-peak',
    name: 'Red clay peak',
    what: 'A peak of red clay built of square dabs stands against a thin turquoise sky.',
    variation: 0,
    world: {
      own: [0, -1, 1, 0, 1, 0, 0, 0.2],
      kinds: ['#b0492f', '#7fb3ad', '#6a3a2c', '#dd9a56', '#f2dcb0'],
      keep: 0.05,
    },
  },
  {
    id: 'poplars-in-slant-rain',
    name: 'Poplars in slant rain',
    what: 'A line of tall dark poplars stands in long slanting rain over wet grey green fields.',
    variation: 0,
    world: {
      own: [0.2, 0.5, -0.7, -1, 1, 0, -1, -0.2],
      kinds: ['#6f7d72', '#9aa7aa', '#27332f', '#93a385', '#d3d8d2'],
      keep: 0.05,
      pace: 1.6,
    },
  },
  {
    id: 'stubble-at-sundown',
    name: 'Stubble at sundown',
    what: 'Cut stubble glows in separate orange strokes on black, a huge sun going down behind.',
    variation: 0,
    world: {
      own: [0.2, 0.5, -0.5, 0.4, 1, -0.9, 1, 0.5],
      kinds: ['#8a4028', '#6a3a50', '#2c2430', '#e08a3a', '#fbe0a0'],
      keep: 0.05,
    },
  },
  {
    id: 'moon-road-on-sand',
    name: 'Moon road on sand',
    what: 'A moon and small stars in a rolling blue night, and the moon lays its road over the wet shore.',
    variation: 1,
    world: {
      own: [-0.6, 0, -0.75, 1, -1, 0, 1, 0],
      kinds: ['#2f5c7a', '#5a6fa8', '#6a7a6a', '#d8c48a', '#f2e2a8'],
      keep: 0.05,
    },
  },
  {
    id: 'reeds-before-the-sun',
    name: 'Reeds before the sun',
    what: 'Dark upright reeds stand before grey water, and a red sun goes down on the far side of it.',
    variation: 1,
    world: {
      own: [-0.55, -0.3, -0.1, 0, 1, 0.35, 1, 1],
      kinds: ['#b4b4a6', '#d6d4c8', '#3a4038', '#e6d6b6', '#b8452f'],
      keep: 0.03,
      pace: 0.4,
    },
  },
  {
    id: 'spring-tide-gale',
    name: 'Spring tide gale',
    what: 'Great slabs of slate and bottle green: the sea runs high up the shore and the sky turns over it.',
    variation: 1,
    world: {
      own: [0.9, 0.2, -0.75, 0.6, 1, 0, 0, -1],
      kinds: ['#2f5a5e', '#66727c', '#3f5548', '#8fa08a', '#dfe6e2'],
      keep: 0.05,
      pace: 1.8,
      contrast: 0.15,
    },
  },
  {
    id: 'pink-brine-lagoon',
    name: 'Pink brine lagoon',
    what: 'A flat lagoon of rose pink brine lies under a mint sky, all in small square dabs.',
    variation: 1,
    world: {
      own: [-0.35, -1, -0.9, 0, 1, 0, 0, 0],
      kinds: ['#c2607a', '#a9cfc0', '#4a3f4c', '#dd9a98', '#f8ecdc'],
      keep: 0.03,
      contrast: 0.2,
      light: -0.1,
    },
  },
  {
    id: 'ripe-barley-wall',
    name: 'Ripe barley wall',
    what: 'Ripe barley stands higher than your head, a strip of deep blue sky left at the top.',
    variation: 1,
    world: {
      own: [0.35, 0.2, 1, 0, 1, 0, 0, 0.6],
      kinds: ['#d9a850', '#3f6a9c', '#e0b050', '#f8dc90', '#f6e6b8'],
      light: 0.2,
      keep: 0.05,
    },
  },
]

export default presets
