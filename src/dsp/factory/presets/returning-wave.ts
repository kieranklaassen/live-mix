import { type FactoryPreset } from '../types'

// Returning Wave is first of all a length of time: what a key is while it is
// held depends on where in its return it is. The previews hold a chord for
// four and a half seconds and a low fifth for five and a half, so a preset
// whose point is the arrival returns within that, and one that takes a minute
// has its point in what it does meanwhile. Nothing after the instrument adds a
// pitch that is not an octave or a fifth, so the harmonics stay the wave's own.

export const RETURNING_WAVE_PRESETS: readonly FactoryPreset[] = [
  // Dissolving pads.
  {
    id: 'returning-wave-bright-to-haze',
    name: 'Bright, then haze',
    category: 'pad',
    description:
      'A chord opens bright in a box, blurs to warm haze within a second and is whole again four seconds on, in a hall.',
    instrument: { deviceId: 'returning-wave', preset: 'Dissolving pad', params: { return: 4 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } }],
  },
  {
    id: 'returning-wave-haze-over-a-bay',
    name: 'Haze over a bay',
    category: 'pad',
    description:
      'A wide dark wave in two rooms, an octave under the keys, that rises slowly and drifts in a chorus over open land.',
    instrument: {
      deviceId: 'returning-wave',
      params: {
        walls: 3,
        width: 0.55,
        throw: 0.15,
        second: 0.5,
        return: 18,
        tilt: -0.35,
        haze: 0.5,
        splash: 0,
        ears: 0.85,
        attack: 1.2,
        release: 5,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } },
    ],
  },
  // Glass keys.
  {
    id: 'returning-wave-window-glass',
    name: 'Window glass keys',
    category: 'keys',
    description:
      'Narrow waves thrown round a ring, clear and quick to leak away, on a small plate: glass touched with a stick.',
    instrument: { deviceId: 'returning-wave', preset: 'Glass keys', params: { volume: -3 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.25 } }],
  },
  {
    id: 'returning-wave-hollow-glass',
    name: 'Hollow glass, far tape',
    category: 'keys',
    description:
      'The crests of a wave in a box, hollow as a blown tube and leaking from the top, with short soft tape echoes.',
    instrument: {
      deviceId: 'returning-wave',
      preset: 'Glass keys',
      params: {
        walls: 0,
        reading: 1,
        width: 0.35,
        leak: 0.25,
        tilt: -0.1,
        body: 0.35,
        splash: 0.5,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
  },
  // Breathing organs.
  {
    id: 'returning-wave-organ-that-breathes',
    name: 'Organ that breathes',
    category: 'organ',
    description:
      'Waves that swing in a bowl, full at the end of each swing and thin in the middle, under a cathedral roof.',
    instrument: {
      deviceId: 'returning-wave',
      preset: 'Breathing organ',
      params: { return: 6 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Faint motion' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'returning-wave-quick-bowl',
    name: 'Quick bowl, reed stop',
    category: 'organ',
    description:
      'A wave thrown hard in a bowl, five swings in three seconds, reedy, with its octaves beside it in a small room.',
    instrument: {
      deviceId: 'returning-wave',
      preset: 'Breathing organ',
      params: { width: 0.02, throw: 0.7, return: 1.8, tilt: 0.75, body: 0.8, attack: 0.06 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Organ' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  // Ring bells.
  {
    id: 'returning-wave-small-ring',
    name: 'Small ring of bells',
    category: 'bell',
    description:
      'Two waves thrown round a ring in a small clear body, returning every four seconds while they ring, with an airy tail.',
    instrument: { deviceId: 'returning-wave', preset: 'Ring bells', params: { volume: 3.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } }],
  },
  {
    id: 'returning-wave-round-and-round',
    name: 'Bell that goes round',
    category: 'bell',
    description:
      'One narrow wave that comes round every two seconds or so and leaves the octave and the twelfth behind on its way, with a glint above.',
    instrument: {
      deviceId: 'returning-wave',
      preset: 'Ring bells',
      params: {
        throw: 0.1,
        place: 0.7,
        second: 0,
        return: 2.2,
        leak: 0.28,
        tilt: 0.2,
        body: 0.5,
        splash: 0.4,
        volume: -0.5,
      },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
  },
  // Tunnel basses.
  {
    id: 'returning-wave-through-the-wall',
    name: 'Bass through the wall',
    category: 'bass',
    description:
      'A round bass in two rooms that goes through the wall and back, an octave under the key, on warm tape.',
    instrument: { deviceId: 'returning-wave', preset: 'Tunnel bass', params: { volume: -3 } },
    effects: [{ deviceId: 'tape', preset: 'Warm thump' }],
  },
  {
    id: 'returning-wave-hollow-tunnel',
    name: 'Light in the tunnel',
    category: 'bass',
    description:
      'A hollow bass with its crests thrown hard in a box, bright at the stroke and dark at once, through warm drive and a short spring.',
    instrument: {
      deviceId: 'returning-wave',
      preset: 'Tunnel bass',
      params: {
        walls: 0,
        reading: 1,
        width: 0.2,
        throw: 0.7,
        return: 3,
        leak: 0.3,
        anchor: 0.5,
        tilt: 0.3,
        splash: 0.3,
        volume: -7.5,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  // Frozen.
  {
    id: 'returning-wave-frozen-twelfth',
    name: 'Frozen on the twelfth',
    category: 'pad',
    description:
      'A ring stopped a third of the way round, where three waves stand and the twelfth sounds over each key, in a warm hall.',
    instrument: { deviceId: 'returning-wave', preset: 'Frozen twelfth' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } }],
  },
  {
    id: 'returning-wave-held-octave',
    name: 'Octave held in ice',
    category: 'pad',
    description:
      'A narrow wave halted half way round a ring, so each key sounds as its octave, clear and still, with a glassy shimmer.',
    instrument: {
      deviceId: 'returning-wave',
      preset: 'Frozen twelfth',
      params: {
        width: 0,
        throw: 0.35,
        start: 0.5,
        freeze: 0.95,
        tilt: 0.3,
        body: 0.7,
        anchor: 0.2,
        haze: 0.1,
        attack: 0.4,
        volume: -2.5,
      },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.2 } },
    ],
  },
  // Plucked flickers.
  {
    id: 'returning-wave-flicker-pluck',
    name: 'Flicker, plucked',
    category: 'plucked',
    description:
      'Hollow plucks whose crests flicker through a whole return in little over a second and a half, with a faint halo of echo.',
    instrument: { deviceId: 'returning-wave', preset: 'Plucked flicker', params: { volume: -1 } },
    effects: [{ deviceId: 'analog-delay', preset: 'Faint halo', params: { mix: 0.3 } }],
  },
  {
    id: 'returning-wave-fast-strings',
    name: 'Strings in a fast box',
    category: 'plucked',
    description:
      'Round plucks from near the middle of a box that come whole once a second as they fade, with open strings ringing along.',
    instrument: {
      deviceId: 'returning-wave',
      preset: 'Plucked flicker',
      params: {
        reading: 0,
        width: 0.3,
        throw: 0.2,
        place: 0.85,
        return: 1,
        leak: 0.22,
        tilt: 0,
        body: 0.3,
        blur: 0.1,
        release: 2,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Short halo', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  // Twin throw choirs.
  {
    id: 'returning-wave-two-throws',
    name: 'Two throws, one choir',
    category: 'voice',
    description:
      'Two wide waves thrown at each other, grained like many voices on one vowel, in a lush ensemble and a hall.',
    instrument: { deviceId: 'returning-wave', preset: 'Twin throw choir', params: { volume: -2 } },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'returning-wave-breath-choir',
    name: 'Choir of moving air',
    category: 'voice',
    description:
      'Only what moves between two waves is read: breath on every key that stirs and grows still, behind a thin veil.',
    instrument: {
      deviceId: 'returning-wave',
      preset: 'Twin throw choir',
      params: {
        reading: 2,
        width: 0.3,
        throw: 0.45,
        gap: 0.5,
        return: 7,
        anchor: 0.15,
        body: 0.65,
        haze: 0.75,
        volume: 1.5,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  // Minute drones.
  {
    id: 'returning-wave-one-minute-out',
    name: 'One minute out',
    category: 'drone',
    description:
      'A low fifth in two rooms that needs a minute to come back, dark and wide on a steady ground, in a cave.',
    instrument: { deviceId: 'returning-wave', preset: 'Minute drone', params: { volume: 3 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } }],
  },
  {
    id: 'returning-wave-sinking-tide',
    name: 'Tide in a bare well',
    category: 'drone',
    description:
      'A low fifth that sinks into a fading well and takes a minute and a half for each return, full of breath, on worn tape.',
    instrument: {
      deviceId: 'returning-wave',
      preset: 'Minute drone',
      params: {
        walls: 4,
        width: 0.15,
        throw: 0.55,
        return: 90,
        start: 0,
        tilt: 0.3,
        body: 0.45,
        haze: 0.7,
        attack: 1,
        volume: 1,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.3 } },
    ],
  },
  // One clock for all keys.
  {
    id: 'returning-wave-shared-clock',
    name: 'One clock, many lights',
    category: 'texture',
    description:
      'All keys light up on one clock, high ones a little later, in a fading well, with a soft choir rising in the hall behind.',
    instrument: {
      deviceId: 'returning-wave',
      preset: 'Shared shimmer',
      params: { return: 4, volume: -5 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'returning-wave-signals-at-sea',
    name: 'Signals over the sea',
    category: 'texture',
    description:
      'Hollow crests in a ring that blink together, once a second, as lamps do far off, each blink with one clean echo.',
    instrument: {
      deviceId: 'returning-wave',
      preset: 'Shared shimmer',
      params: {
        walls: 1,
        reading: 1,
        width: 0.1,
        throw: 0.3,
        return: 2,
        tilt: 0.1,
        body: 0.6,
        blur: 0,
        haze: 0,
        release: 1.2,
        volume: 4,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 333, feedback: 0.2 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
]
