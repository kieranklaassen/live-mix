import { type FactoryPreset } from '../types'

// Chord Clock is heard best under held keys: its pulses are the chord's own
// ratios slowed down, so most previews hold a chord and let it go. Effects that
// repeat or add pitches are kept low, so that the count stays the chord's.

export const CHORD_CLOCK_PRESETS: readonly FactoryPreset[] = [
  // Pattering pads: soft drops that run together into the chord.
  {
    id: 'chord-clock-patter-warm-hall',
    name: 'Patter into a chord',
    category: 'pad',
    description:
      'Soft drops on wood patter for seven seconds and run together into a pad, in a warm hall.',
    instrument: { deviceId: 'chord-clock', preset: 'Pattering pad' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'chord-clock-patter-on-glass',
    name: 'Rain that becomes glass',
    category: 'pad',
    description:
      'Drops on glass patter fast from the start and take ten seconds to fuse, doubled faintly on a long plate.',
    instrument: {
      deviceId: 'chord-clock',
      preset: 'Pattering pad',
      params: { body: 1, slowness: 5, quicken: 10, damping: 0.45, pulseWidth: 0.35 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 4 } },
    ],
    preview: 'chord',
  },
  // Wood that counts: tones that slow down and leave their polyrhythm.
  {
    id: 'chord-clock-wooden-counters',
    name: 'Wooden counters',
    category: 'plucked',
    description:
      "Wooden taps that begin as a tone and slow in a second and a half to the chord's own count, in a room.",
    instrument: { deviceId: 'chord-clock', preset: 'Wooden five to four' },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'chord-clock-wooden-boxes-springs',
    name: 'Boxes on springs',
    category: 'plucked',
    description:
      'Plucks on wood that slow to a count and answer one another in turn, thrown into a tank of two springs.',
    instrument: {
      deviceId: 'chord-clock',
      preset: 'Wooden five to four',
      params: { pulse: 4, slowness: 5, stagger: 0.8, damping: 0.6, tone: 0.5, accent: 0.5 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 4 } },
    ],
    preview: 'chord',
  },
  // Breath engines: puffs of air at the pitch's slow octaves.
  {
    id: 'chord-clock-breath-engine-veil',
    name: 'Engine of breath',
    category: 'wind',
    description:
      'Puffs of air lift each tone as they quicken over three seconds, behind a thin veil.',
    instrument: { deviceId: 'chord-clock', preset: 'Breath engine' },
    effects: [{ deviceId: 'fog', preset: 'Thin veil', params: { mix: 0.4 } }],
    preview: 'chord',
  },
  {
    id: 'chord-clock-breath-through-wood',
    name: 'Bellows in the next room',
    category: 'wind',
    description:
      'Wide breaths through wood go there and back every six seconds, heard from the next room.',
    instrument: {
      deviceId: 'chord-clock',
      preset: 'Breath engine',
      params: { body: 0, path: 3, quicken: 6, slowness: 5, pulseWidth: 0.7, lift: 0.8, tone: 0.85 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2.5 } },
    ],
    preview: 'chord',
  },
  // Basses that count.
  {
    id: 'chord-clock-counting-bass',
    name: 'Bass counting to itself',
    category: 'bass',
    description:
      'A skin bass with both lower octaves in it and a soft beat five octaves down, warmed low.',
    instrument: { deviceId: 'chord-clock', preset: 'Bass that counts', params: { volume: -16 } },
    effects: [{ deviceId: 'analog-drive', preset: 'Low warmth' }],
  },
  {
    id: 'chord-clock-plucked-counter-bass',
    name: 'Plucked counter bass',
    category: 'bass',
    description:
      'A short plucked wooden bass that climbs in stairs to its note in under a second, through a warm amp stack.',
    instrument: {
      deviceId: 'chord-clock',
      preset: 'Bass that counts',
      params: {
        pulse: 4,
        body: 0,
        path: 1,
        slowness: 3,
        quicken: 0.7,
        pulseWidth: 0.75,
        lower: 0.45,
        rhythm: 0.5,
        volume: -16.5,
      },
    },
    effects: [{ deviceId: 're-amp', preset: 'Warm stack', params: { treble: -0.5 } }],
  },
  // Bells that agree: the accent falls where every key's pulse is together.
  {
    id: 'chord-clock-bells-agree-cathedral',
    name: 'Bells in agreement',
    category: 'bell',
    description:
      'Taps on glass that are stressed wherever the keys fall together, ringing long in a cathedral.',
    instrument: { deviceId: 'chord-clock', preset: 'Bells agreeing' },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.28 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2 } },
    ],
    preview: 'chord',
  },
  {
    id: 'chord-clock-bells-agree-glints',
    name: 'Small bells in turn',
    category: 'bell',
    description:
      'Quick narrow taps on glass tuned to nines, answering one another in turn with faint glints above.',
    instrument: {
      deviceId: 'chord-clock',
      preset: 'Bells agreeing',
      params: {
        ratios: 4,
        stagger: 0.9,
        slowness: 5.5,
        pulseWidth: 0.1,
        damping: 0.4,
        tone: 0.4,
        release: 3,
        path: 2,
        quicken: 2,
      },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2 } },
    ],
    preview: 'keys',
  },
  // Octave stairs: each step doubles the pulses.
  {
    id: 'chord-clock-stair-keys-plate',
    name: 'Keys up the stairs',
    category: 'keys',
    description:
      'Plucks on wood that climb to their tone octave by octave in a second and a half, on a long plate.',
    instrument: { deviceId: 'chord-clock', preset: 'Octave stair keys' },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1.5 } },
    ],
    preview: 'keys',
  },
  {
    id: 'chord-clock-stair-drops-echo',
    name: 'Stairs under water',
    category: 'keys',
    description:
      'Pure drops on skin climb seven octaves in four seconds, each step struck, with a clean echo.',
    instrument: {
      deviceId: 'chord-clock',
      preset: 'Octave stair keys',
      params: { pulse: 1, body: 2, slowness: 7, quicken: 4, rhythm: 0.5, tone: 0.85, volume: -15 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  // Grain drones: pulses so near fusion that they purr.
  {
    id: 'chord-clock-grain-drone-tape',
    name: 'Purring drone',
    category: 'drone',
    description:
      'Bow strokes three octaves down purr under their own tone for eight seconds, on quarter inch tape.',
    instrument: { deviceId: 'chord-clock', preset: 'Grain drone', params: { volume: -5 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'chord-clock-grain-drone-strings',
    name: 'Hollow motor, strings',
    category: 'drone',
    description:
      'Breath in a column of air, two octaves down, takes half a minute to fuse while strings ring along.',
    instrument: {
      deviceId: 'chord-clock',
      preset: 'Grain drone',
      params: {
        pulse: 3,
        body: 3,
        slowness: 2,
        quicken: 30,
        rhythm: 0.85,
        pulseWidth: 0.3,
        lower: 0.6,
        tone: 0.8,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Long ring', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2 } },
    ],
  },
  // Choirs that wind down when they are let go.
  {
    id: 'chord-clock-winding-choir-hall',
    name: 'Choir winding down',
    category: 'voice',
    description:
      'A choir of breaths that begins as a chord and slows over nine seconds to single sighs, in a hall.',
    instrument: { deviceId: 'chord-clock', preset: 'Winding down choir' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'chord-clock-winding-bows-worn',
    name: 'Bows running out',
    category: 'voice',
    description:
      'Bowed air that slows for four seconds while held and runs out like a clock when let go, on worn tape.',
    instrument: {
      deviceId: 'chord-clock',
      preset: 'Winding down choir',
      params: { pulse: 2, quicken: 4, slowness: 5.5, rhythm: 0.6, width: 0.4, pulseWidth: 0.6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } },
    ],
  },
  // Looms of sevens.
  {
    id: 'chord-clock-sevens-loom-room',
    name: 'Loom of sevens',
    category: 'plucked',
    description: 'Plucked glass tuned to sevens, every key answering in its turn, in a small room.',
    instrument: { deviceId: 'chord-clock', preset: 'Sevens on the loom' },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
    ],
    preview: 'chord',
  },
  {
    id: 'chord-clock-sevens-loom-taps',
    name: 'Loom without a weaver',
    category: 'plucked',
    description:
      'Dry wooden taps in sevens, all rhythm with hardly a tone, woven into three tape heads.',
    instrument: {
      deviceId: 'chord-clock',
      preset: 'Sevens on the loom',
      params: {
        pulse: 0,
        body: 0,
        tone: 0.25,
        rhythm: 0.9,
        path: 2,
        quicken: 0.6,
        stagger: 1,
        damping: 0.7,
        slowness: 6,
        volume: -2,
      },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  // Solitary pulses: one drop, seconds apart.
  {
    id: 'chord-clock-solitary-open-space',
    name: 'One drop at a time',
    category: 'texture',
    description:
      'A slow glass pad with one drop at a time for each key, seconds apart, in a wide open space.',
    instrument: { deviceId: 'chord-clock', preset: 'Solitary pulse', params: { release: 5 } },
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2 } },
    ],
    preview: 'chord',
  },
  {
    id: 'chord-clock-solitary-far-drum',
    name: 'Drum across the water',
    category: 'texture',
    description:
      'Deep drops on skin, eight and a half octaves under their pitch, with hardly a tone, from a far shore.',
    instrument: {
      deviceId: 'chord-clock',
      preset: 'Solitary pulse',
      params: {
        body: 2,
        slowness: 8.5,
        tone: 0.22,
        rhythm: 1,
        pulseWidth: 0.8,
        damping: 0.1,
        attack: 0.4,
        lower: 0.3,
      },
    },
    effects: [
      { deviceId: 'distance', preset: 'Far shore' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 3 } },
    ],
    preview: 'chord',
  },
]
