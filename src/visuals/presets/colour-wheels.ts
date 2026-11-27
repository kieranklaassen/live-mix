import type { VisualPreset } from '../preset'

const presets: readonly VisualPreset[] = [
  {
    id: 'walnut-bowls-in-a-row',
    name: 'Walnut bowls in a row',
    what: 'Turned wooden bowls stand in a row by size, their rings catching one low light.',
    variation: 0,
    world: {
      own: [0, 1, 0.5, 0, -1, 0, -1, 0],
      kinds: ['#7a4a28', '#9f6c3a', '#8a7358', '#c99a60', '#e0c090'],
      keep: 0.04,
      pace: 0.4,
      near: 1.12,
      light: 0.15,
    },
  },
  {
    id: 'compass-drawing',
    name: 'Compass drawing',
    what: 'Circles drawn in ink cross on pale paper and fill with thin blue and sepia washes.',
    variation: 0,
    world: {
      own: [-0.35, 0, -0.3, 0, 0, 1, -1, 0],
      kinds: ['#3f6488', '#8fa6b5', '#a8845a', '#c9b48a', '#b0583a'],
      keep: 0.04,
      pace: 0.5,
    },
  },
  {
    id: 'rings-of-a-dark-planet',
    name: 'Rings of a dark planet',
    what: 'Thin gold and slate rings glow round one dark middle, with small moons far off.',
    variation: 0,
    world: {
      own: [0, -1, 1, 0, 0, -1, -1, 0],
      kinds: ['#b8904a', '#5f7896', '#6a5a4a', '#d8c8a0', '#e8dcb8'],
      keep: 0.04,
      pace: 0.5,
    },
  },
  {
    id: 'paper-windmills',
    name: 'Paper windmills',
    what: 'Paper windmills in brick, cream and blue turn apart on a pale wall.',
    variation: 0,
    world: {
      own: [0.6, 0, -0.6, 0, 0, 0, 0.3, 1],
      kinds: ['#b8402a', '#e0a848', '#e6dcc4', '#2f6690', '#24506a'],
      keep: 0.04,
      pace: 0.8,
      vivid: 0.05,
      contrast: 0.15,
    },
  },
  {
    id: 'rings-cut-in-slate',
    name: 'Rings cut in slate',
    what: 'Broad rings cut deep into blue grey slate cross one another in raking light.',
    variation: 0,
    world: {
      own: [-0.2, 0, 0.8, 0, -1, 0, -1, 0],
      kinds: ['#4a5a64', '#66767e', '#3a4852', '#8f9ca0', '#c9d0cc'],
      keep: 0.04,
      pace: 0.6,
    },
  },
  {
    id: 'leaded-lantern',
    name: 'Leaded lantern',
    what: 'Petals of amber, rose and bottle green glass in black lead round one lamp.',
    variation: 0,
    world: {
      own: [0, -1, -0.2, -0.8, 1, 0, 0.4, 0],
      kinds: ['#a8642a', '#8f4040', '#2f5a48', '#c99a50', '#e0c890'],
      keep: 0.04,
      pace: 0.4,
    },
  },
  {
    id: 'clay-ridge-tiles',
    name: 'Clay ridge tiles',
    what: 'Great half round clay tiles in rust and sand, worn and lit from one side.',
    variation: 1,
    world: {
      own: [-0.45, -1, -0.4, 0, -1, 0, -1, -0.3],
      kinds: ['#a0522f', '#b8703f', '#8a4428', '#c99a68', '#e0c8a0'],
      keep: 0.04,
      pace: 0.3,
    },
  },
  {
    id: 'cut-shell-rosette',
    name: 'Cut shell rosette',
    what: 'Half rounds of shell pink, cream and sea grey lie bent about one middle.',
    variation: 1,
    world: {
      own: [-0.15, 1, -0.2, 0, 0, 0.45, 0.1, 0],
      kinds: ['#c9847c', '#d8b8a8', '#6f928f', '#e8d8c4', '#b86a5a'],
      keep: 0.04,
      pace: 0.4,
      vivid: 0.2,
    },
  },
  {
    id: 'paper-fans-by-lamplight',
    name: 'Paper fans by lamplight',
    what: 'Pleated fans of red and gold glow one after another in the dark.',
    variation: 1,
    world: {
      own: [-0.6, 0, -0.5, 0, 0, -1, 0.8, 0],
      kinds: ['#8f2f24', '#c98a3a', '#a84a2f', '#e0b868', '#e8d0a0'],
      keep: 0.04,
      pace: 0.5,
    },
  },
  {
    id: 'white-plaster-panels',
    name: 'White plaster panels',
    what: 'Half panels with round corners moulded in white plaster, rib within rib, row upon row.',
    variation: 1,
    world: {
      own: [0.55, -1, 0, 1, -0.75, 0, -1, 0],
      kinds: ['#d8d2c6', '#e6e0d4', '#c9c6be', '#efe8da', '#c9a88a'],
      keep: 0.02,
      pace: 0.3,
      light: 0.12,
      tones: ['#4a4844', '#bdb6a8', '#f4eee0'],
      toned: 0.75,
    },
  },
]

export default presets
