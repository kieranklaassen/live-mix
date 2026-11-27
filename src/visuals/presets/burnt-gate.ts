import type { VisualPreset } from '../preset'

const presets: readonly VisualPreset[] = [
  {
    id: 'strip-of-small-frames',
    name: 'Strip of small frames',
    what: 'Rows of little frames, faded to rose, cream and sea blue, and the light eats holes in them.',
    variation: 0,
    world: {
      own: [0.3, 0, 0, 1, 0, 1, 0, 0],
      kinds: ['#3f7288', '#d89a84', '#86b0a0', '#e8c890', '#f4e0c0'],
      keep: 0.05,
      vivid: 0.25,
      light: 0.12,
    },
  },
  {
    id: 'letter-from-the-grate',
    name: 'Letter from the grate',
    what: 'A pale sheet of paper smoulders, its holes ringed in fire and the night behind them.',
    variation: 0,
    world: {
      own: [-0.2, 0, 1, -1, 0, 0, 0, 0.55],
      kinds: ['#1a1512', '#f8dca8', '#c9b48a', '#d07a3c', '#f0b860'],
      keep: 0.05,
      near: 1.1,
      pace: 0.6,
      light: 0.15,
      contrast: 0.1,
      vivid: 0.1,
    },
  },
  {
    id: 'moss-cays-from-above',
    name: 'Moss cays from above',
    what: 'Soft green islands with low scalloped shores lie in a shallow teal sea, seen from high up.',
    variation: 0,
    world: {
      own: [-0.2, -0.15, -1, 1, -0.45, 0, -1, 0],
      kinds: ['#4a6a3a', '#8f9c50', '#dcc088', '#1f6880', '#58aeb0'],
      keep: 0.05,
      near: 1.12,
      vivid: 0.15,
      contrast: 0.1,
    },
  },
  {
    id: 'stubble-fire-by-night',
    name: 'Stubble fire by night',
    what: 'Thin crooked lines of fire crawl over a black field, brightest where the wind finds them.',
    variation: 0,
    world: {
      own: [0.6, 1, 1, 0.8, 0, 0, 0, 1],
      kinds: ['#16181c', '#5a3a2a', '#3a2a24', '#c8703a', '#e89048'],
      keep: 0.05,
      near: 1.12,
    },
  },
  {
    id: 'wells-of-cut-card',
    name: 'Wells of cut card',
    what: 'Round wells cut through layer on layer of coloured card, each step lower in shadow.',
    variation: 0,
    world: {
      own: [-0.9, -1, 1, 1, -1, 0, 1, 0],
      kinds: ['#c8604a', '#e0a86a', '#2f6a78', '#e8d8b4', '#3a3a5a'],
      keep: 0.03,
      near: 1.12,
      pace: 0.5,
    },
  },
  {
    id: 'ice-cave-curtain',
    name: 'Ice cave curtain',
    what: 'Long pale blue folds of ice hang down, their openings rimmed with frost, night behind them.',
    variation: 1,
    world: {
      own: [-0.1, 0.3, 1, 1, 1, 1, 0, 0],
      kinds: ['#2a4a6a', '#a8c8dc', '#e4eef2', '#7fb0c8', '#d8e8f0'],
      keep: 0.05,
      pace: 0.5,
    },
  },
  {
    id: 'oilskin-at-daybreak',
    name: 'Oilskin at daybreak',
    what: 'A wet black oilskin full of holes, and through them the peach and blue of the first light.',
    variation: 1,
    world: {
      own: [-0.4, 0, -1, -1, -0.6, 0, 0, 0],
      kinds: ['#2a3440', '#6a5a5a', '#8fb0d0', '#eca27c', '#8fb4d8'],
      keep: 0.05,
    },
  },
  {
    id: 'sky-pools-in-clay',
    name: 'Sky pools in clay',
    what: 'A red clay bed has dried and cracked all over, and the last round pools hold the sky.',
    variation: 1,
    world: {
      own: [-0.1, -1, -1, 1, -0.7, -1, 0, 0],
      kinds: ['#8a4a30', '#b8744c', '#9a5638', '#86aed0', '#cfe0ea'],
      keep: 0.05,
      pace: 0.4,
    },
  },
  {
    id: 'slashed-red-curtain',
    name: 'Slashed red curtain',
    what: 'A heavy red curtain in deep folds, cut through in long slits that let the grey in.',
    variation: 1,
    world: {
      own: [-0.2, 1, 0, 1, -1, 1, 0, 0],
      kinds: ['#3a0f14', '#9a2a2a', '#b8453a', '#d88a5a', '#e8b080'],
      keep: 0.03,
    },
  },
  {
    id: 'crags-in-a-cloud-sea',
    name: 'Crags in a cloud sea',
    what: 'Dark wet crags stand out of a pale sea of cloud that goes slowly up and over them.',
    variation: 1,
    world: {
      own: [-0.1, 0.4, -1, 1, -1, 0, -1, -0.8],
      kinds: ['#2c3a40', '#8a989c', '#46564e', '#c4d0d2', '#e4e4dc'],
      keep: 0.05,
      pace: 0.6,
    },
  },
]

export default presets
