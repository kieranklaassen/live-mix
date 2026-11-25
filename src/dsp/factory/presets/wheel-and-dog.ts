import { type FactoryPreset } from '../types'

// Wheel and Dog plays drones from the keys under Split and a melody of one
// line, or two, from the keys over it, so a preset is chosen with its phrase.
// A low fifth (`low`) is all drone keys at the default Split, and holds the
// drones alone. A line (`line`, `keys`) is all melody keys, so there Drone
// names the note the white keys are a mode over. A chord (`chord`) is given a
// Split in its middle: its low keys turn the drones and Duo plays the top two.
// The bass line moves the drones themselves, with Drone on First key.

export const WHEEL_AND_DOG_PRESETS: readonly FactoryPreset[] = [
  // Slow heartbeats: two pushes a turn.
  {
    id: 'wheel-and-dog-slow-heart',
    name: 'Slow wheel heart',
    category: 'drone',
    description:
      'A wheel that turns once in two seconds and is pushed twice, long then short: the drones swell in pairs, in a dark hall.',
    instrument: { deviceId: 'wheel-and-dog', preset: 'Slow heartbeat', params: { volume: -11 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall' }],
  },
  {
    id: 'wheel-and-dog-ten-seconds',
    name: 'One turn in ten seconds',
    category: 'drone',
    description:
      'The slowest wheel: one push every five seconds lifts the drones and lets them sink again, in a vast nave.',
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Ten seconds a turn',
      params: { volume: -10.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave' }],
  },
  {
    id: 'wheel-and-dog-pulse-tune',
    name: 'Pulse under a tune',
    category: 'string',
    preview: 'line',
    description:
      'A tune over drones on D, two soft pushes to a turn of two seconds and no bark: one slow pulse a second under every note.',
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Slow heartbeat',
      params: {
        pattern: 0,
        depth: 0.35,
        dog: 0,
        drone: 3,
        drones: 0.5,
        brightness: 0.45,
        volume: -12.5,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate' }],
  },
  // Drones alone.
  {
    id: 'wheel-and-dog-chapel',
    name: 'Chapel drones',
    category: 'drone',
    description:
      'Three drones under a wheel that turns evenly, root, octave and fifth, with no seam in them, in a cathedral.',
    instrument: { deviceId: 'wheel-and-dog', preset: 'Still wheel', params: { volume: -13 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral' }],
  },
  {
    id: 'wheel-and-dog-beating-fifth',
    name: 'Slow beating fifth',
    category: 'drone',
    description:
      'The third drone five cents sharp: it beats against the low one about once in two and a half seconds. Nearly dry, on tape.',
    instrument: { deviceId: 'wheel-and-dog', preset: 'Beating fifth', params: { volume: -11.5 } },
    effects: [{ deviceId: 'tape', preset: 'Clean transfer', params: { drive: 0.3 } }],
  },
  {
    id: 'wheel-and-dog-open-fourth',
    name: 'Open fourth ground',
    category: 'drone',
    description:
      'Drones on D with a fourth on top instead of a fifth, a light push three times a turn, over an open valley.',
    instrument: { deviceId: 'wheel-and-dog', preset: 'Open fourth' },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley' }],
  },
  {
    id: 'wheel-and-dog-moving-ground',
    name: 'Moving ground',
    category: 'bass',
    description:
      'A bass line of drones: each low key moves all three, a fifth and an octave over it, and the wheel hardly slows between two.',
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Low fifths',
      params: { drone: 0, spin: 0.8, speed: 0.5, accents: 0, brightness: 0.42 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'wheel-and-dog-trembling',
    name: 'Trembling drones',
    category: 'drone',
    description:
      'Six small pushes to a quick turn, under what the dog needs to bark: the drones tremble over five times a second, in a plate.',
    instrument: { deviceId: 'wheel-and-dog', preset: 'Even trembling', params: { volume: -11.5 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate' }],
  },
  // Tunes on the keys over the drones: one set of white keys, a mode for every drone.
  {
    id: 'wheel-and-dog-over-d',
    name: 'Wheel tune over D',
    category: 'string',
    preview: 'line',
    description:
      'A tune on the white keys over drones on D, which makes it dorian. Three barks to a turn of two seconds, in a room.',
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Turning wheel',
      params: { drone: 3, volume: -14 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room' }],
  },
  {
    id: 'wheel-and-dog-over-g',
    name: 'Wheel tune over G',
    category: 'keys',
    description:
      'White keys over drones on G, which makes them mixolydian: a wooden knock at each key, light pushes, in a small plate.',
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Open fourth',
      params: {
        tuning: 0,
        drone: 8,
        tangents: 0.7,
        dog: 0.35,
        drones: 0.55,
        trompette: 0.5,
        volume: -11,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate' }],
  },
  {
    id: 'wheel-and-dog-over-a',
    name: 'Wheel tune over A',
    category: 'string',
    preview: 'line',
    description:
      'White keys over bare octaves of A, which makes them minor: a wheel that turns evenly, long to stop, in a wide chapel.',
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Chapel octaves',
      params: { drone: 10, tuning: 2, spin: 1.2, drones: 0.6, volume: -14.5 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.25 } }],
  },
  {
    id: 'wheel-and-dog-over-e',
    name: 'Wheel tune over E',
    category: 'string',
    preview: 'line',
    description:
      'White keys over drones on E, which makes them phrygian: a raw wheel and a loose dog in a bare stone stairwell.',
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Raw wheel',
      params: { drone: 5, rosin: 0.75, drones: 0.5, volume: -14 },
    },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
  },
  {
    id: 'wheel-and-dog-two-voices',
    name: 'Two voices over D',
    category: 'string',
    description:
      'The two newest keys from middle C up sound as two strings; the keys under it only turn the drones on D. In a hall.',
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Two voices',
      params: { split: 5, drone: 3, volume: -11.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall' }],
  },
  {
    id: 'wheel-and-dog-octave-down',
    name: 'Tune an octave down too',
    category: 'wind',
    description:
      'Each key plays a second string an octave under it, dark and in the body of the wood, over soft drones, in a narrow spring.',
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Octave below',
      params: { drone: 3, volume: -11.5 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Narrow warm tank' }],
  },
  // Cotton on the strings: little rosin, the second slip takes the fundamental out, the rest is hiss.
  {
    id: 'wheel-and-dog-cotton-close',
    name: 'Cotton, close by',
    category: 'wind',
    description:
      'Cotton on the strings: the wheel barely grips, so the tune is thin, with hiss let in at every slip. In a small booth.',
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Cotton whisper',
      params: { drone: 3, noise: 0.65, drones: 0.4 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth' }],
  },
  {
    id: 'wheel-and-dog-cotton-snow',
    name: 'Cotton under snow',
    category: 'pad',
    description:
      'Two whispering strings over whispering drones that take most of a second to come and go, in thin air that hangs on.',
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Cotton whisper',
      params: { split: 5, drone: 3, melody: 2, spread: 1, brightness: 0.3 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Thin air' }],
  },
  // Far fields.
  {
    id: 'wheel-and-dog-far-field',
    name: 'Across a field',
    category: 'texture',
    preview: 'line',
    description:
      'A tune with its three barks a turn, heard in the open from some way off: the air takes the top off each bark.',
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Three barks a turn',
      params: { drone: 3, volume: -13 },
    },
    effects: [{ deviceId: 'distance', preset: 'Open air' }],
  },
  {
    id: 'wheel-and-dog-behind-hill',
    name: 'Behind the hill',
    category: 'texture',
    preview: 'low',
    description:
      'Covered drones and no bark, far away in a fog: a low hum that swells three times to a turn of two seconds.',
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Behind the wall',
      params: { dog: 0, volume: -9.5 },
    },
    effects: [{ deviceId: 'distance', preset: 'Through fog' }],
  },
  {
    id: 'wheel-and-dog-run-down',
    name: 'Wheel let go',
    category: 'texture',
    description:
      'One key turns drones on C. Let go, the wheel takes two seconds to stop: its barks come further apart and give out first.',
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Long run down',
      params: { spin: 2, split: 7, drone: 1, speed: 1.2, volume: -11.5 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room' }],
  },
  // Barking dances.
  {
    id: 'wheel-and-dog-three-barks',
    name: 'Three barks in a barn',
    category: 'drone',
    description:
      'Drones on D and a dog that barks three times a turn, one and a half times a second, in a wooden barn.',
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Three barks a turn',
      params: { volume: -9.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'wheel-and-dog-limping',
    name: 'Limping wheel dance',
    category: 'plucked',
    description:
      'Six barks a turn in long and short pairs, a turn just over a second long, under a tune with bare strings. In a chamber.',
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Limping dance',
      params: { drone: 3, volume: -15 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
  },
  {
    id: 'wheel-and-dog-first-strong',
    name: 'Four, the first strong',
    category: 'string',
    preview: 'line',
    description:
      'Four barks a turn, three a second, the first of each four pushed twice as hard as the rest: a dance in a slap room.',
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Four to the turn',
      params: { drone: 3, volume: -15.5 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Slap room' }],
  },
  {
    id: 'wheel-and-dog-mad-dog',
    name: 'Mad dog in the yard',
    category: 'drone',
    description:
      'The loosest bridge and the hardest pushes, nearly five a second: the dog never quite shuts. Through a small amplifier.',
    instrument: { deviceId: 'wheel-and-dog', preset: 'Mad dog', params: { volume: -22 } },
    effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }],
  },
  {
    id: 'wheel-and-dog-bright-reel',
    name: 'Bright reel, fast wheel',
    category: 'keys',
    description:
      'A bright fast wheel, one and a half turns a second with a strong bark and a weak one in each, under a quick tune on D.',
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Bright reel',
      params: { drone: 3, volume: -16 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
]
