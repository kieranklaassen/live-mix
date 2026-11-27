import { type FactoryPreset } from '../types'

// Slow Accord starts as metal and ends as a chord, so a preset here says which
// metal, what it agrees to, and how long that takes. What a key does happens
// within the first seconds of its preview; the phrase is chosen to leave it
// that time. Effects that add pitches of their own are kept to octaves, so
// that what disagrees at first is the metal alone.

export const SLOW_ACCORD_PRESETS: readonly FactoryPreset[] = [
  // Bells that become organs.
  {
    id: 'slow-accord-bell-for-vespers',
    name: 'Bell for vespers',
    category: 'organ',
    description:
      'A struck bell whose overtones go one by one to the key’s own series, till a soft organ is left in a nave.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Bell becomes organ',
      params: { volume: -4.5, travel: 0.45, release: 2.4, glint: 0.1, leftover: 0.12 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.28 } }],
    preview: 'chord',
  },
  {
    id: 'slow-accord-pipes-after-metal',
    name: 'Pipes after metal',
    category: 'organ',
    description:
      'A bright plate is struck and turns into ranks of octaves, one under the note among them, behind turning horns.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Bell becomes organ',
      params: {
        volume: -8,
        material: 1,
        goal: 2,
        overtones: 8,
        touch: 0.4,
        ring: 5,
        glow: 0.9,
        air: 0.03,
        tilt: -0.1,
        travel: 0.35,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.22 } },
    ],
    preview: 'chord',
  },
  // Scattered metal, as light comes up.
  {
    id: 'slow-accord-first-grey-light',
    name: 'First grey light',
    category: 'pad',
    description:
      'Scattered overtones swell for over a second and find the chord from the top down, with chimes as they arrive.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Scattered dawn',
      params: { attack: 1.3, travel: 0.8, tilt: -0.2, glint: 0.6, volume: 1 },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.3 } },
      { deviceId: 'spread', preset: 'Wide but safe' },
    ],
  },
  {
    id: 'slow-accord-dew-on-wires',
    name: 'Dew on wires',
    category: 'texture',
    description:
      'A thin scatter of breath and metal that never sits still, in late points of light over one slow note.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Scattered dawn',
      params: {
        overtones: 9,
        attack: 0.5,
        travel: 0.5,
        again: 0.9,
        rest: 0.4,
        manner: 0.45,
        air: 0.3,
        glow: 0.6,
        tilt: -0.3,
        volume: -2.5,
      },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.22 } },
    ],
  },
  // Keys that go half of the way.
  {
    id: 'slow-accord-almost-a-piano',
    name: 'Almost in tune',
    category: 'keys',
    description:
      'Struck bars that lean half of the way to the chord and stop there, on quarter inch tape in a small room.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Half bent keys',
      params: { volume: -1.5, bend: 0.55, glow: 0.25, release: 1.4, attack: 0.006, touch: 0.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'slow-accord-bent-bell-keys',
    name: 'Bent bell keys',
    category: 'keys',
    description:
      'Soft bell keys that go two thirds of the way and beat a little as they ring, in a slow chorus.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Half bent keys',
      params: {
        volume: 0,
        material: 2,
        goal: 1,
        bend: 0.68,
        overtones: 7,
        leftover: 0.5,
        touch: 0.35,
        ring: 5,
        tilt: -0.2,
        release: 1.8,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } },
    ],
  },
  // Basses.
  {
    id: 'slow-accord-settling-low',
    name: 'Settling low',
    category: 'bass',
    description:
      'A crowd of close tones that draws together onto the series of a deep root, round and narrow, warmed a little.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Squeezed bass',
      params: { glow: 0.65, travel: 0.18, release: 0.4, volume: -10 },
    },
    effects: [{ deviceId: 'saturator', preset: 'Warm glue' }],
  },
  {
    id: 'slow-accord-plucked-iron-bass',
    name: 'Plucked iron bass',
    category: 'bass',
    description:
      'A short bass of struck bar with a knock at its front and its own series found at once, dry but for a small booth.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Squeezed bass',
      params: {
        material: 0,
        goal: 1,
        overtones: 6,
        attack: 0.004,
        glow: 0.15,
        ring: 5,
        touch: 0.7,
        travel: 0.1,
        tilt: 0.15,
        volume: -0.5,
      },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.15 } },
    ],
  },
  // Pads that never rest.
  {
    id: 'slow-accord-nothing-stays',
    name: 'Nothing stays',
    category: 'pad',
    description:
      'A soft held chord in which one tone after another leaves for a new place in it, as long as the keys are down.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Never resting pad',
      params: { rest: 0.4, travel: 1.1, attack: 0.8, glint: 0.2, forward: 0.65 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.32 } }],
  },
  {
    id: 'slow-accord-there-and-back',
    name: 'There and back to metal',
    category: 'pad',
    description:
      'Octaves that sink back into bell metal and come again, each with a slow breath, under a faint haze.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'In and out of metal',
      params: { volume: -4.5, travel: 0.9, rest: 0.3, attack: 0.6, overtones: 8, tilt: 0.2 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Faint haze' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  // Stepped glass.
  {
    id: 'slow-accord-glass-stairs',
    name: 'Glass stairwell',
    category: 'bell',
    description:
      'Stiff bright wire whose overtones hop to their octaves in small strokes and ring a chime at the end of each way.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Stepped glass',
      params: { volume: 0, touch: 0.4, travel: 0.6, tilt: -0.15, ring: 4 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 410, mix: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'slow-accord-ticking-lattice',
    name: 'Ticking lattice',
    category: 'texture',
    description:
      'Small dry strokes on settled tones that keep stepping to other notes of the chord, from side to side.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Ticking tones',
      params: { material: 3, travel: 0.18, overtones: 8, spread: 1, glint: 0.3, volume: -0.5 },
    },
    effects: [
      { deviceId: 'around', preset: 'Gentle sway' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  // The series of a low tone.
  {
    id: 'slow-accord-root-remembered',
    name: 'Root remembered',
    category: 'drone',
    description:
      'A plate that slowly finds the overtones of a tone under the lowest key, with a soft breath on all of them.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Halo of the bass',
      params: { attack: 0.5, travel: 0.5, glow: 0.85, air: 0.15, volume: -11.5 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'slow-accord-low-window',
    name: 'Low window',
    category: 'pad',
    description:
      'A low halo that beats slowly between metal and the bass series, wide, with octave light far behind.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Halo of the bass',
      params: {
        material: 2,
        overtones: 14,
        attack: 0.9,
        leftover: 0.55,
        tilt: 0.25,
        air: 0.05,
        swing: 0.4,
        volume: -6.5,
      },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Faint glimmer' },
      { deviceId: 'spread', preset: 'Hazy edges' },
    ],
  },
  // Plucked.
  {
    id: 'slow-accord-caught-at-once',
    name: 'Caught at once',
    category: 'plucked',
    description:
      'A bright pluck that snaps into the chord within a quarter of a second, with springs behind it.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Quick pluck',
      params: { ring: 3, release: 1.1, glint: 0.65, volume: -5 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Hint of spring' }],
  },
  {
    id: 'slow-accord-tin-leaf-echo',
    name: 'Tin leaf, tape echo',
    category: 'plucked',
    description:
      'Thin struck plate that dies within two seconds on its own series, answered by three heads of warm tape.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Quick pluck',
      params: {
        material: 1,
        goal: 1,
        overtones: 9,
        ring: 1.2,
        touch: 0.45,
        tilt: -0.25,
        glint: 0.2,
        volume: 1,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.28 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
    ],
  },
  // Voices that swing past their note.
  {
    id: 'slow-accord-leaning-choir',
    name: 'Leaning choir',
    category: 'voice',
    description:
      'Breathy sung tones that swing past the chord and back before they settle, and go on swaying slowly.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Swinging choir',
      params: { volume: -5.5, air: 0.5, travel: 0.9, attack: 0.6, release: 3.5, tilt: 0 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slow-accord-wind-learns-a-chord',
    name: 'Wind learns a chord',
    category: 'voice',
    description:
      'Nothing but tuned wind: scattered breaths that slide until they sing the chord, far off in the open.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Tuned wind',
      params: {
        volume: -2.5,
        attack: 0.9,
        travel: 0.8,
        swing: 0.5,
        air: 0.85,
        tilt: -0.6,
        forward: 0.7,
      },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  // Raw metal, hardly bent or not at all.
  {
    id: 'slow-accord-unpersuaded',
    name: 'Unpersuaded',
    category: 'drone',
    description:
      'A raw plate that swells and agrees with nothing: dark close overtones that beat for as long as it is held.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Raw metal drone',
      params: { attack: 1.6, tilt: -0.6, leftover: 0.8, volume: -4.5 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } },
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slow-accord-cooling-all-night',
    name: 'Cooling all night',
    category: 'drone',
    description:
      'A struck plate that rings for long and lets its high overtones settle first, worn thin on old tape.',
    instrument: {
      deviceId: 'slow-accord',
      preset: 'Cooling plate',
      params: { travel: 1.6, bend: 0.8, touch: 0.6, glow: 0.6, tilt: -0.3, volume: -3.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
]
