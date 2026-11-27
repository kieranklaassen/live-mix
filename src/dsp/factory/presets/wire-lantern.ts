import { type FactoryPreset } from '../types'

// Wire Lantern's note is a solid: what a preset decides first is the shape, then
// what wakes it and where it is touched. The tones inside a note are open
// intervals when True is up and beat when it is down, so an effect that adds
// pitches stays on fifths, and most of these add none.

export const WIRE_LANTERN_PRESETS: readonly FactoryPreset[] = [
  // Octahedron harp: fingers on steel, the open intervals of the solid.
  {
    id: 'wire-lantern-harp-warm-hall',
    name: 'Lantern harp, warm hall',
    category: 'plucked',
    description:
      'Fingers on the wires of an octahedron: open fourths and fifths inside every note, in a warm hall.',
    instrument: { deviceId: 'wire-lantern', preset: 'Octahedron harp', params: { volume: -3.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.28 } }],
  },
  {
    id: 'wire-lantern-harp-far-edge',
    name: 'Far edge, dotted echoes',
    category: 'plucked',
    description:
      'The harp played in the middle of a far edge, rounder and harder, with dotted tape echoes on a bright plate.',
    instrument: {
      deviceId: 'wire-lantern',
      preset: 'Octahedron harp',
      params: { edge: 4, pluck: 0.8, hardness: 0.55, sympathy: 0.15, decay: 14, volume: 0.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.28 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.22 } },
    ],
    preview: 'line',
  },
  // Cube bells: True low, so the tones beat.
  {
    id: 'wire-lantern-cube-high-nave',
    name: 'Cube bells, high nave',
    category: 'bell',
    description:
      'A hammer on a cube of steel wire with its tones left uneven, each bell long and beating in a vast nave.',
    instrument: { deviceId: 'wire-lantern', preset: 'Cube bells', params: { volume: -1 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } }],
  },
  {
    id: 'wire-lantern-cube-on-springs',
    name: 'Cube chimes on springs',
    category: 'bell',
    description:
      'A cube struck near a corner and damped within two seconds, small and bright, in a tank of two springs.',
    instrument: {
      deviceId: 'wire-lantern',
      preset: 'Cube bells',
      params: {
        decay: 4,
        release: 0.8,
        sympathy: 0.1,
        hardness: 1,
        edge: 2,
        true: 0.2,
        shell: 0.7,
      },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  // Turning pads: a bow, and Turn heard as the chord going round.
  {
    id: 'wire-lantern-turning-slow-light',
    name: 'Slowly turning light',
    category: 'pad',
    description:
      'Bowed octahedron that turns once in twelve seconds, the chord passing from bright to dark in a slow chorus.',
    instrument: {
      deviceId: 'wire-lantern',
      preset: 'Turning pad',
      params: { turn: 0.083, swell: 2.2, ear: 0.4, volume: -5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'wire-lantern-turning-wheeling',
    name: 'Wheeling prism',
    category: 'pad',
    description:
      'A bowed prism that turns once a second and shakes by itself, glittering between the ears in an open valley.',
    instrument: {
      deviceId: 'wire-lantern',
      preset: 'Turning pad',
      params: { solid: 4, turn: 1, width: 1, hardness: 0.5, swell: 0.7, release: 3, volume: -3.3 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } },
    ],
  },
  // Ring koto: one loop of wire, plain harmonics.
  {
    id: 'wire-lantern-koto-paper-room',
    name: 'Ring koto, paper room',
    category: 'plucked',
    description:
      'Six wires in one ring, plucked near a corner: plain harmonics in a wooden case, in a small booth.',
    instrument: { deviceId: 'wire-lantern', preset: 'Ring koto', params: { volume: 3.5 } },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood' },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.2 } },
    ],
    preview: 'line',
  },
  {
    id: 'wire-lantern-koto-soft-gut',
    name: 'Gut ring, dark echoes',
    category: 'string',
    description:
      'A ring of soft gut plucked in its middle, gone in a few seconds, with a finger vibrato and dark echoes.',
    instrument: {
      deviceId: 'wire-lantern',
      preset: 'Ring koto',
      params: { wire: 0.15, pluck: 0.9, hardness: 0.2, decay: 20, shade: 0.2, volume: -2.8 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Finger vibrato' },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.3 } },
    ],
  },
  // Corner whispers: breath.
  {
    id: 'wire-lantern-whisper-corners',
    name: 'Breath in the corners',
    category: 'wind',
    description:
      'More air than tone: a soft breath through a tetrahedron, wide apart at the two ears, in an airy tail.',
    instrument: { deviceId: 'wire-lantern', preset: 'Corner whisper', params: { volume: 1 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.35 } }],
  },
  {
    id: 'wire-lantern-whisper-hollow-voices',
    name: 'Hollow voices',
    category: 'voice',
    description:
      'A breath through the ring in a deep case, its hollows like vowels, sung on by a choir of ah behind it.',
    instrument: { deviceId: 'wire-lantern', preset: 'Hollow choir', params: { turn: 0.12 } },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.3 } }],
  },
  // Basses: the dark cube, and the ring bowed low.
  {
    id: 'wire-lantern-bass-dark-cube',
    name: 'Dark cube, warm drive',
    category: 'bass',
    description:
      'A cube plucked in the middle of an edge under a heavy shade, nearly one low tone, with a little warm drive.',
    instrument: { deviceId: 'wire-lantern', preset: 'Dark cube bass' },
    effects: [{ deviceId: 'analog-drive', preset: 'Low warmth' }],
  },
  {
    id: 'wire-lantern-bass-bowed-ring',
    name: 'Bowed ring, low room',
    category: 'bass',
    description:
      'A ring of wire bowed softly at once, dark and harmonic, narrow in the middle, in a tight chamber.',
    instrument: {
      deviceId: 'wire-lantern',
      preset: 'Bowed ring',
      params: { shade: 0.55, swell: 0.05, width: 0.1, release: 0.35, hardness: 0.45, volume: 0.5 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.15 } },
    ],
  },
  // Web dust: the solid that is slow to speak.
  {
    id: 'wire-lantern-dust-far-away',
    name: 'Dust on the web',
    category: 'texture',
    description:
      'A web that is slow to speak: a long rustle of fingers that opens into tone, with faint sparks far away.',
    instrument: { deviceId: 'wire-lantern', preset: 'Web dust', params: { volume: 2 } },
    effects: [
      { deviceId: 'glints', preset: 'Faint dust' },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'wire-lantern-dust-pattering',
    name: 'Web blown in rain',
    category: 'texture',
    description:
      'A hard breath through the web with the corners leaking, broken into patter by a swarm of small echoes.',
    instrument: {
      deviceId: 'wire-lantern',
      preset: 'Web dust',
      params: {
        exciter: 3,
        hardness: 0.9,
        swell: 1.2,
        cornerLoss: 0.6,
        contact: 0.9,
        turn: 0.6,
        volume: 3.5,
      },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.4 } }],
  },
  // Glass keys: the prism, dry and quick.
  {
    id: 'wire-lantern-glass-small-plate',
    name: 'Glass keys, small plate',
    category: 'keys',
    description:
      'A soft hammer on a prism near its pure intervals, dry and quick to stop, on a small plate.',
    instrument: { deviceId: 'wire-lantern', preset: 'Glass keys', params: { volume: 1.5 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } }],
  },
  {
    id: 'wire-lantern-glass-worn-tape',
    name: 'Glass keys, worn tape',
    category: 'keys',
    description:
      'Prism keys hit hard through a case, uneven and bright, on worn tape that sways, in a room.',
    instrument: {
      deviceId: 'wire-lantern',
      preset: 'Glass keys',
      params: { true: 0.15, hardness: 0.6, shell: 0.9, edge: 5, release: 1.5, volume: -0.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  // Tetra drones: few tones, and the frame ringing along.
  {
    id: 'wire-lantern-tetra-dark-cave',
    name: 'Tetra drone, dark cave',
    category: 'drone',
    description:
      'A hard bow on a tetrahedron with every wire of the frame ringing along, opening over three seconds in a cave.',
    instrument: { deviceId: 'wire-lantern', preset: 'Tetra drone', params: { volume: -5.5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } }],
  },
  {
    id: 'wire-lantern-tetra-rising-fifths',
    name: 'Tetra under fifths',
    category: 'drone',
    description:
      'A tetrahedron blown hard in a halo of its own wires while fifths rise out of the hall behind it.',
    instrument: {
      deviceId: 'wire-lantern',
      preset: 'Tetra drone',
      params: {
        exciter: 3,
        swell: 4,
        hardness: 0.7,
        shade: 0.05,
        true: 0.6,
        edge: 3,
        shell: 0.6,
        turn: 0.12,
        volume: -1,
      },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.5 } }],
  },
  // Muted lanterns: a finger on a corner.
  {
    id: 'wire-lantern-muted-walk',
    name: 'Muted lantern, walking',
    category: 'plucked',
    description:
      'A finger rests on one corner: the octahedron short and woody in a deep case, with one quick slap behind it.',
    instrument: {
      deviceId: 'wire-lantern',
      preset: 'Muted lantern',
      params: { sympathy: 0.2, volume: -4 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Slapback' }],
    preview: 'line',
  },
  {
    id: 'wire-lantern-muted-blanket',
    name: 'Lantern under a cloth',
    category: 'keys',
    description:
      'A hammer on a touched cube, all but mute, soft and round under a blanket of tape with its halo left ringing.',
    instrument: {
      deviceId: 'wire-lantern',
      preset: 'Muted lantern',
      params: {
        solid: 3,
        exciter: 1,
        touch: 0.35,
        hardness: 0.2,
        shade: 0.3,
        sympathy: 0.8,
        release: 2,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.2 } },
    ],
  },
]
