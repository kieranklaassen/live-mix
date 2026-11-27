import { type FactoryPreset } from '../types'

// Singing Sand has one thing to say before its sound: how far its grains are
// in step. A preset here is a place on that way, from loose sand that only
// patters to a slope that sings one note, and a surge that moves along it.
// Two for each of the ten directions the instrument has.

export const SINGING_SAND_PRESETS: readonly FactoryPreset[] = [
  // Dune pads: the waves go over the keys one after the other.
  {
    id: 'singing-sand-crest-after-crest',
    name: 'Crest after crest',
    category: 'pad',
    description:
      'A warm hum that a slow wave crosses once every four seconds, from the low keys to the high ones, in a warm hall.',
    instrument: {
      deviceId: 'singing-sand',
      preset: 'Dune pad',
      params: { lockstep: 0.82, onset: 0.9, pace: 0.25, front: 0.8, bury: 0.1, volume: -6 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } }],
  },
  {
    id: 'singing-sand-lee-side-evening',
    name: 'Lee side, evening',
    category: 'pad',
    description:
      'A dark, soft pad of grains in two groups that sing the octave, spread by a slow chorus in an open space.',
    instrument: {
      deviceId: 'singing-sand',
      preset: 'Dune pad',
      params: {
        cluster: 2,
        bury: 0.42,
        boom: 0.3,
        onset: 1.6,
        layerOrder: 2,
        layer: 0.6,
        pace: 0.12,
        slope: 0.3,
        dry: 0.1,
        volume: -0.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
    ],
  },
  // Bass slopes: short and round, and long and buried.
  {
    id: 'singing-sand-bass-off-the-slope',
    name: 'Bass off the slope',
    category: 'bass',
    description:
      'A round, locked bass with the whole slope moving an octave under it, warmed by a low drive.',
    instrument: {
      deviceId: 'singing-sand',
      preset: 'Bass slope',
      params: { run: 1.1, flow: 0.35, volume: -0.5 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Low warmth' }],
  },
  {
    id: 'singing-sand-buried-to-the-neck',
    name: 'Buried to the neck',
    category: 'bass',
    description:
      'A long deep bass heard through a lot of sand, all in step, slow to begin and slow to stop, on soft tape.',
    instrument: {
      deviceId: 'singing-sand',
      preset: 'Bass slope',
      params: {
        lockstep: 1,
        bury: 0.68,
        boom: 0.85,
        onset: 0.12,
        run: 8,
        flow: 0.9,
        slump: 1.3,
        layer: 0.7,
        layerOrder: 1,
        pulse: 3,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
  },
  // Squeaking keys: sand that chirps under a foot.
  {
    id: 'singing-sand-squeak-underfoot',
    name: 'Squeak underfoot',
    category: 'keys',
    description:
      'Short keys of sand that squeaks, a chirp on every note and then nothing, with a hint of a spring.',
    instrument: {
      deviceId: 'singing-sand',
      preset: 'Squeaking keys',
      params: { grain: 0.35, layer: 0.4, layerOrder: 4 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 8 } },
    ],
  },
  {
    id: 'singing-sand-barefoot-echo',
    name: 'Barefoot, with echo',
    category: 'plucked',
    description:
      'Tiny bright squeaks in two groups, each gone in half a second, and tape echoes that walk away.',
    instrument: {
      deviceId: 'singing-sand',
      preset: 'Squeaking keys',
      params: {
        grain: 0.7,
        run: 0.5,
        flow: 0.03,
        slump: 0.35,
        cluster: 2,
        dry: 0.3,
        lockstep: 0.95,
        volume: 3,
      },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 11.5 } },
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.4 } },
    ],
  },
  // Glass beach bells.
  {
    id: 'singing-sand-low-tide-glass',
    name: 'Low tide glass',
    category: 'bell',
    description:
      'Clear bells of ground glass, struck all in step and left to run out for three seconds, on a long plate.',
    instrument: { deviceId: 'singing-sand', preset: 'Glass beach bells' },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 9.5 } },
    ],
  },
  {
    id: 'singing-sand-green-bottle-chimes',
    name: 'Green bottle chimes',
    category: 'bell',
    description:
      'Glass bells in five groups that ring a high third over the note, wide, with a faint shimmer above.',
    instrument: {
      deviceId: 'singing-sand',
      preset: 'Glass beach bells',
      params: {
        cluster: 5,
        grain: 0.5,
        run: 6,
        onset: 0.02,
        layer: 0.6,
        layerOrder: 5,
        bury: 0.15,
        spread: 12,
        lockstep: 0.9,
      },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Faint glimmer' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 2 } },
    ],
    preview: 'keys',
  },
  // Dissolving voices: the note comes out of the noise and goes back.
  {
    id: 'singing-sand-voices-come-apart',
    name: 'Voices come apart',
    category: 'voice',
    description:
      'Grains hardly in step, in four groups, that gather into a note as a wave passes and come apart again, in a hall that sings.',
    instrument: { deviceId: 'singing-sand', preset: 'Dissolving voices' },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.35 } }],
  },
  {
    id: 'singing-sand-hollow-singers',
    name: 'Hollow singers',
    category: 'voice',
    description:
      'Hollow wet voices with one overtone sung out of each key, half in step, in a cathedral.',
    instrument: {
      deviceId: 'singing-sand',
      preset: 'Dissolving voices',
      params: {
        cluster: 1,
        pulse: 3,
        lockstep: 0.6,
        layer: 0.85,
        layerOrder: 5,
        slope: 0.4,
        grit: 0.2,
        spread: 20,
        onset: 0.6,
        pace: 0.35,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } }],
  },
  // Aftershocks.
  {
    id: 'singing-sand-shock-in-the-valley',
    name: 'Shock in the valley',
    category: 'texture',
    description:
      'One deep shock and rarer and rarer ones after it on a low fifth, with loose sand running down an open valley.',
    instrument: {
      deviceId: 'singing-sand',
      preset: 'Aftershocks',
      params: { bury: 0.12, grain: 0.5, volume: -3 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
    preview: 'low',
  },
  {
    id: 'singing-sand-cracks-in-a-window',
    name: 'Cracks in a window',
    category: 'texture',
    description:
      'Glassy slips that come two a second and thin out, high and wide, with a backwards reflection of each.',
    instrument: {
      deviceId: 'singing-sand',
      preset: 'Aftershocks',
      params: {
        pulse: 4,
        grain: 0.85,
        pace: 2,
        slope: 0.45,
        bury: 0,
        boom: 0,
        layer: 0.6,
        layerOrder: 6,
        lockstep: 0.9,
        dry: 0.2,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      { deviceId: 'reverse-delay', preset: 'Faint reflection' },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  // Locked drones.
  {
    id: 'singing-sand-all-grains-one-note',
    name: 'All grains, one note',
    category: 'drone',
    description:
      'Every grain in step on a low fifth with a deep tone under it, swelling once in eleven seconds in a vast nave.',
    instrument: { deviceId: 'singing-sand', preset: 'Locked drone', params: { boom: 0.6 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } }],
  },
  {
    id: 'singing-sand-twelfth-in-the-sand',
    name: 'Twelfth in the sand',
    category: 'drone',
    description:
      'A locked drone in three groups that stands on its twelfth, with a whistle over it, on worn tape in a dark cave.',
    instrument: {
      deviceId: 'singing-sand',
      preset: 'Locked drone',
      params: {
        cluster: 3,
        grain: 0.6,
        layer: 0.8,
        layerOrder: 9,
        boom: 0.1,
        onset: 1.2,
        dry: 0.35,
        pace: 0.5,
        slope: 0.4,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } },
    ],
  },
  // Cluster organs.
  {
    id: 'singing-sand-organ-of-three-heaps',
    name: 'Organ of three heaps',
    category: 'organ',
    description:
      'An even organ of grains in three groups, the twelfth of every key on top, through a slow rotary cabinet.',
    instrument: { deviceId: 'singing-sand', preset: 'Cluster organ' },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'singing-sand-flint-chapel-organ',
    name: 'Flint chapel organ',
    category: 'organ',
    description:
      'A reedy organ of sharp flint in two groups, the octave over every key, in a chapel that hums.',
    instrument: {
      deviceId: 'singing-sand',
      preset: 'Cluster organ',
      params: {
        cluster: 2,
        pulse: 1,
        grain: 0.6,
        bury: 0.18,
        layer: 0.5,
        layerOrder: 2,
        boom: 0.4,
        onset: 0.08,
        slump: 0.6,
      },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.3 } }],
  },
  // Flint plucks.
  {
    id: 'singing-sand-flint-on-flint',
    name: 'Flint on flint',
    category: 'plucked',
    description:
      'Hard dry plucks of flint with a spray of grit at each, short, in a tight stone chamber.',
    instrument: {
      deviceId: 'singing-sand',
      preset: 'Flint plucks',
      params: { grit: 0.3, dry: 0.25, run: 1.2, grain: 0.35, volume: 0 },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 7.5 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'singing-sand-sparks-in-the-dark',
    name: 'Sparks in the dark',
    category: 'plucked',
    description:
      'Fine flint in four groups, plucked two octaves up and thrown wide, with faint glints an octave over in a dark hall.',
    instrument: {
      deviceId: 'singing-sand',
      preset: 'Flint plucks',
      params: {
        grain: 0.75,
        cluster: 4,
        run: 1.8,
        layer: 0.5,
        layerOrder: 8,
        bury: 0.02,
        width: 1,
        lockstep: 0.97,
      },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 10 } },
    ],
  },
  // Far rain: loose sand with hardly a note in it.
  {
    id: 'singing-sand-rain-past-the-dunes',
    name: 'Rain past the dunes',
    category: 'texture',
    description:
      'Single dry grains like rain a long way off, with only a breath of a note in them, heard from a far shore.',
    instrument: { deviceId: 'singing-sand', preset: 'Far rain', params: { volume: -4 } },
    effects: [
      { deviceId: 'distance', preset: 'Far shore' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 3 } },
    ],
  },
  {
    id: 'singing-sand-drizzle-on-a-tin',
    name: 'Drizzle on a tin',
    category: 'texture',
    description:
      'Loose flint pattering on a small tin, with one high overtone of the key ringing faintly out of it.',
    instrument: {
      deviceId: 'singing-sand',
      preset: 'Far rain',
      params: {
        pulse: 1,
        grain: 0.55,
        layer: 0.75,
        layerOrder: 6,
        lockstep: 0.4,
        spread: 30,
        surge: 1,
        slope: 0.5,
        pace: 1.2,
        onset: 0.2,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
    preview: 'chord',
  },
]
