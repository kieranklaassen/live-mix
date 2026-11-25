import { type FactoryPreset, type Phrase } from '../types'

// Held voices whose loops last a prime number of seconds, so the field they make is not the same
// twice. Laid out by player and by how far off the player stands; many partials, rounds, delays
// and slow cycles are set to primes too. Most phrases play the loops five or ten times too fast.

// Field one, A minor eleventh, at five times speed: A3 of 11, E4 13, C4 17, B4 19, G4 23, D5 29, A2 31.
const FIELD_ONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 3, note: 45, gain: 0.5 },
    { atSec: 0.4, durSec: 1.5, note: 57, gain: 0.5 },
    { atSec: 0.9, durSec: 2, note: 60, gain: 0.46 },
    { atSec: 1.5, durSec: 1.8, note: 64, gain: 0.46 },
    { atSec: 2, durSec: 1.6, note: 71, gain: 0.4 },
    { atSec: 2.6, durSec: 1.5, note: 57, gain: 0.48 },
    { atSec: 2.9, durSec: 2.3, note: 67, gain: 0.42 },
    { atSec: 3.7, durSec: 2.6, note: 74, gain: 0.38 },
    { atSec: 4.1, durSec: 1.8, note: 64, gain: 0.46 },
    { atSec: 4.3, durSec: 2, note: 60, gain: 0.44 },
    { atSec: 4.8, durSec: 1.5, note: 57, gain: 0.46 },
    { atSec: 5.8, durSec: 1.5, note: 71, gain: 0.36 },
    { atSec: 6.2, durSec: 1.1, note: 45, gain: 0.42 },
  ],
}
// Field two, lydian on F, at five times speed: A4 of 11, F3 13, C4 17, G4 19, E5 23, B4 29, F2 31.
const FIELD_TWO: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.2, note: 41, gain: 0.5 },
    { atSec: 0.3, durSec: 1.5, note: 69, gain: 0.44 },
    { atSec: 0.8, durSec: 1.8, note: 53, gain: 0.48 },
    { atSec: 1.2, durSec: 2.1, note: 60, gain: 0.46 },
    { atSec: 1.9, durSec: 1.7, note: 67, gain: 0.44 },
    { atSec: 2.3, durSec: 2.4, note: 76, gain: 0.38 },
    { atSec: 2.5, durSec: 1.5, note: 69, gain: 0.42 },
    { atSec: 3.4, durSec: 1.8, note: 53, gain: 0.46 },
    { atSec: 3.9, durSec: 2.7, note: 71, gain: 0.42 },
    { atSec: 4.6, durSec: 2.1, note: 60, gain: 0.44 },
    { atSec: 4.7, durSec: 1.5, note: 69, gain: 0.4 },
    { atSec: 5.7, durSec: 1.6, note: 67, gain: 0.4 },
    { atSec: 6, durSec: 1.3, note: 53, gain: 0.42 },
    { atSec: 6.2, durSec: 1.1, note: 41, gain: 0.42 },
  ],
}
// Long tones for slow voices, A minor ninth: after the first two the entries are 1.1, 1.3 and 1.7 s apart.
const SLOW_FIELD: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.6, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 3.5, note: 64, gain: 0.5 },
    { atSec: 1.1, durSec: 4, note: 60, gain: 0.5 },
    { atSec: 2.4, durSec: 4.3, note: 71, gain: 0.44 },
    { atSec: 4.1, durSec: 3.2, note: 67, gain: 0.46 },
  ],
}
// Near-twins: one C4 every 1.1 s, another every 1.3 s. A unison opens into an echo, 0.2 s wider
// each turn, until the sixth of one all but meets the seventh of the other.
const NEAR_TWINS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 48, gain: 0.4 },
    { atSec: 0, durSec: 0.8, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 0.9, note: 60, gain: 0.4 },
    { atSec: 1.1, durSec: 0.8, note: 60, gain: 0.5 },
    { atSec: 1.3, durSec: 0.9, note: 60, gain: 0.4 },
    { atSec: 2.2, durSec: 0.8, note: 60, gain: 0.5 },
    { atSec: 2.6, durSec: 0.9, note: 60, gain: 0.4 },
    { atSec: 3.3, durSec: 0.8, note: 60, gain: 0.5 },
    { atSec: 3.9, durSec: 0.9, note: 60, gain: 0.4 },
    { atSec: 4.4, durSec: 0.8, note: 60, gain: 0.48 },
    { atSec: 5.2, durSec: 0.9, note: 60, gain: 0.4 },
    { atSec: 5.5, durSec: 0.8, note: 60, gain: 0.46 },
    { atSec: 6.5, durSec: 0.8, note: 60, gain: 0.38 },
    { atSec: 6.6, durSec: 0.75, note: 60, gain: 0.44 },
  ],
}
// Five against seven: E4 every 1 s, B3 every 1.4 s. They start as one and meet again at 7 s.
const THIRTY_FIVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.8, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 1.1, note: 59, gain: 0.5 },
    { atSec: 1, durSec: 0.8, note: 64, gain: 0.46 },
    { atSec: 1.4, durSec: 1.1, note: 59, gain: 0.48 },
    { atSec: 2, durSec: 0.8, note: 64, gain: 0.46 },
    { atSec: 2.8, durSec: 1.1, note: 59, gain: 0.48 },
    { atSec: 3, durSec: 0.8, note: 64, gain: 0.46 },
    { atSec: 4, durSec: 0.8, note: 64, gain: 0.46 },
    { atSec: 4.2, durSec: 1.1, note: 59, gain: 0.48 },
    { atSec: 5, durSec: 0.8, note: 64, gain: 0.46 },
    { atSec: 5.6, durSec: 1.1, note: 59, gain: 0.48 },
    { atSec: 6, durSec: 0.8, note: 64, gain: 0.46 },
    { atSec: 7, durSec: 0.38, note: 64, gain: 0.55 },
    { atSec: 7, durSec: 0.38, note: 59, gain: 0.55 },
  ],
}
// The one moment all seven begin together: each leaves at its own prime, a fifth of it.
const ALL_MEET: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.2, note: 45, gain: 0.46 },
    { atSec: 0, durSec: 2.2, note: 57, gain: 0.44 },
    { atSec: 0, durSec: 3.4, note: 60, gain: 0.42 },
    { atSec: 0, durSec: 2.6, note: 64, gain: 0.42 },
    { atSec: 0, durSec: 4.6, note: 67, gain: 0.4 },
    { atSec: 0, durSec: 3.8, note: 71, gain: 0.38 },
    { atSec: 0, durSec: 5.8, note: 74, gain: 0.36 },
  ],
}
// The same turned round, lydian on F: seven enter each a fifth of its prime before one shared end.
const ENDS_AS_ONE: Phrase = {
  notes: [
    { atSec: 0.2, durSec: 6.2, note: 41, gain: 0.46 },
    { atSec: 0.6, durSec: 5.8, note: 71, gain: 0.38 },
    { atSec: 1.8, durSec: 4.6, note: 76, gain: 0.36 },
    { atSec: 2.6, durSec: 3.8, note: 67, gain: 0.4 },
    { atSec: 3, durSec: 3.4, note: 60, gain: 0.42 },
    { atSec: 3.8, durSec: 2.6, note: 53, gain: 0.44 },
    { atSec: 4.2, durSec: 2.2, note: 69, gain: 0.4 },
  ],
}
// One line whose notes begin 1.1, 1.3, 1.7 and 1.9 s apart: A, C, E, D, B.
const GAPS_WIDEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 69, gain: 0.5 },
    { atSec: 1.1, durSec: 1.1, note: 72, gain: 0.52 },
    { atSec: 2.4, durSec: 1.4, note: 76, gain: 0.54 },
    { atSec: 4.1, durSec: 1.5, note: 74, gain: 0.5 },
    { atSec: 6, durSec: 1.35, note: 71, gain: 0.44 },
  ],
}
// A lower line whose notes begin 1.9, 1.7, 1.3 and 1.1 s apart: E, D, A, C, B.
const GAPS_CLOSE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 64, gain: 0.5 },
    { atSec: 1.9, durSec: 1.4, note: 62, gain: 0.5 },
    { atSec: 3.6, durSec: 1.1, note: 57, gain: 0.54 },
    { atSec: 4.9, durSec: 0.95, note: 60, gain: 0.5 },
    { atSec: 6, durSec: 1.35, note: 59, gain: 0.46 },
  ],
}
// Two players alone: E5 of 11 and B4 of 13, at five times speed.
const TWO_OF_THEM: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.7, note: 76, gain: 0.46 },
    { atSec: 0.6, durSec: 1.7, note: 71, gain: 0.48 },
    { atSec: 2.2, durSec: 1.7, note: 76, gain: 0.46 },
    { atSec: 3.2, durSec: 1.7, note: 71, gain: 0.48 },
    { atSec: 4.4, durSec: 1.7, note: 76, gain: 0.44 },
    { atSec: 5.8, durSec: 1.5, note: 71, gain: 0.44 },
  ],
}
// Four players on D, A, C and E, a ninth chord with no third, at five times speed: C4 of 11, A3 13, D3 17, E4 19.
const HORN_FOUR: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.6, note: 50, gain: 0.52 },
    { atSec: 0.6, durSec: 2.1, note: 57, gain: 0.5 },
    { atSec: 1.2, durSec: 2.8, note: 64, gain: 0.46 },
    { atSec: 1.8, durSec: 1.7, note: 60, gain: 0.48 },
    { atSec: 3.2, durSec: 2.1, note: 57, gain: 0.48 },
    { atSec: 3.4, durSec: 2.6, note: 50, gain: 0.5 },
    { atSec: 4, durSec: 1.7, note: 60, gain: 0.46 },
    { atSec: 5, durSec: 2.3, note: 64, gain: 0.44 },
    { atSec: 5.8, durSec: 1.5, note: 57, gain: 0.46 },
    { atSec: 6.2, durSec: 1.1, note: 60, gain: 0.44 },
  ],
}
// Four pipes, E minor seventh, at five times speed: D5 of 11, B4 13, E4 17, G4 19.
const HIGH_FIELD: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.6, note: 64, gain: 0.5 },
    { atSec: 0.5, durSec: 2, note: 71, gain: 0.46 },
    { atSec: 1.1, durSec: 2.8, note: 67, gain: 0.48 },
    { atSec: 1.7, durSec: 1.6, note: 74, gain: 0.42 },
    { atSec: 3.1, durSec: 2, note: 71, gain: 0.46 },
    { atSec: 3.4, durSec: 2.6, note: 64, gain: 0.48 },
    { atSec: 3.9, durSec: 1.6, note: 74, gain: 0.42 },
    { atSec: 4.9, durSec: 2.4, note: 67, gain: 0.46 },
    { atSec: 5.7, durSec: 1.6, note: 71, gain: 0.44 },
    { atSec: 6.1, durSec: 1.2, note: 74, gain: 0.4 },
  ],
}
// Steel: A3 of 11, E4 of 13 and C5 of 17, at five times speed; one B4 pulls the held C5 down.
const STEEL_LOOPS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 57, gain: 0.52 },
    { atSec: 0.5, durSec: 1.8, note: 64, gain: 0.5 },
    { atSec: 1.7, durSec: 2, note: 72, gain: 0.46 },
    { atSec: 2.2, durSec: 1.6, note: 57, gain: 0.5 },
    { atSec: 2.9, durSec: 1.2, note: 71, gain: 0.44 },
    { atSec: 3.1, durSec: 1.8, note: 64, gain: 0.48 },
    { atSec: 4.4, durSec: 1.6, note: 57, gain: 0.5 },
    { atSec: 5.1, durSec: 2, note: 72, gain: 0.44 },
    { atSec: 5.7, durSec: 1.6, note: 64, gain: 0.46 },
  ],
}
// Two drones a fifth apart, at ten times speed: A2 of 31 and E3 of 23.
const PEDAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.6, note: 45, gain: 0.54 },
    { atSec: 0.7, durSec: 1.8, note: 52, gain: 0.48 },
    { atSec: 3, durSec: 1.8, note: 52, gain: 0.48 },
    { atSec: 3.1, durSec: 2.6, note: 45, gain: 0.52 },
    { atSec: 5.3, durSec: 1.8, note: 52, gain: 0.46 },
    { atSec: 6.2, durSec: 1.1, note: 45, gain: 0.48 },
  ],
}
// Low twins, at ten times speed: one D3 of 29 and one of 31, parting by 2 s a turn (0.2 here), and A3 of 19 over them.
const LOW_TWINS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 2.4, note: 50, gain: 0.42 },
    { atSec: 0.9, durSec: 1.4, note: 57, gain: 0.44 },
    { atSec: 2.8, durSec: 1.4, note: 57, gain: 0.44 },
    { atSec: 2.9, durSec: 2.2, note: 50, gain: 0.48 },
    { atSec: 3.1, durSec: 2.4, note: 50, gain: 0.42 },
    { atSec: 4.7, durSec: 1.4, note: 57, gain: 0.42 },
    { atSec: 5.8, durSec: 1.5, note: 50, gain: 0.46 },
    { atSec: 6.2, durSec: 1.1, note: 50, gain: 0.4 },
  ],
}
// The closing line played tied, every note held into the next, so a steel slides: E, D, A, C, B.
const TIED_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.15, note: 64, gain: 0.54 },
    { atSec: 1.9, durSec: 1.95, note: 62, gain: 0.5 },
    { atSec: 3.6, durSec: 1.5, note: 57, gain: 0.54 },
    { atSec: 4.9, durSec: 1.3, note: 60, gain: 0.5 },
    { atSec: 6, durSec: 1.35, note: 59, gain: 0.48 },
  ],
}
// Two keys a fifth apart, the second 1.3 s late: two rounds of strings that never fall together.
const TWO_ROUNDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 48, gain: 0.52 },
    { atSec: 1.3, durSec: 5.9, note: 55, gain: 0.46 },
  ],
}
// One key of C held for seven seconds: the round of strings under it is the whole loop.
const ONE_KEY: Phrase = { notes: [{ atSec: 0, durSec: 7, note: 48, gain: 0.55 }] }

export const PRESETS: readonly FactoryPreset[] = [
  // Tanpura: the round itself is a loop, set to 2, 3, 5, 7 or 11 seconds, from a closed bridge to an open one.
  {
    id: 'prime-lengths-eleven-second-gourd',
    name: 'Eleven second gourd',
    category: 'drone',
    description:
      'A dull, deep drone lute on Ma, its round eleven seconds long, heard from across a room.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Low Ma gourd',
      params: { jawari: 0.05, speed: 11, decay: 29, volume: 0 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { highCut: 3200 } },
      { deviceId: 'distance', preset: 'Across the room', params: { distance: 0.35 } },
    ],
  },
  {
    id: 'prime-lengths-round-of-seven-bees',
    name: 'Round of seven bees',
    category: 'drone',
    description:
      'Four bare strings with the bridge wide open, a seven second round, widened by a faint chorus and a small plate.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Bare string buzz',
      params: { volume: 4, speed: 7, decay: 13, detune: 2, jawari: 0.95 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'prime-lengths-five-breathes-eleven',
    name: 'Five breathes eleven',
    category: 'drone',
    description:
      'A five second round of Ma strings in a hall, opened and shut by a breath that takes eleven seconds in all.',
    preview: PEDAL,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Ma full bloom',
      params: { volume: 0, speed: 5, decay: 17, body: 0.35 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Calm breath',
        params: { in: 4, hold: 1, out: 5, rest: 1, vary: 0, depth: 0.55, colour: 0.7, air: 0.1 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'prime-lengths-three-second-loom',
    name: 'Three second loom',
    category: 'plucked',
    description:
      'Short dry strings on a three second round, woven by four loops of unequal length.',
    preview: TWO_ROUNDS,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Quick dry round',
      params: { volume: 4, speed: 3, jawari: 0.3, body: 0.6 },
    },
    effects: [
      { deviceId: 'orbits', preset: 'Wide weave', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'prime-lengths-gnats-over-a-ditch',
    name: 'Gnats over a ditch',
    category: 'drone',
    description:
      'A two second round of open buzz through a wavering middle band, levelled hard, with a tape echo every 1.1 seconds.',
    preview: TWO_ROUNDS,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Fast buzzing round',
      params: { speed: 2, volume: 6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { type: 2, cutoffHz: 1500, resonance: 1.6, lfoAmount: 12, lfoRateHz: 0.091 },
      },
      { deviceId: 'fet-limiter', preset: 'Drive' },
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { time: 1100, feedback: 0.35, mix: 0.3 },
      },
    ],
  },
  {
    id: 'prime-lengths-seventeen-year-hum',
    name: 'Seventeen year hum',
    category: 'drone',
    description:
      'Strings with no buzz that ring seventeen seconds, an octave added under them, warmed by soft valve drive in a dark hall.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: { speed: 11, decay: 17, detune: 5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.7 } },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 9, toneDb: -2 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'prime-lengths-cicada-field-at-noon',
    name: 'Cicada field at noon',
    category: 'drone',
    description:
      'A thin, bright three second round on Ni whose upper partials flicker one by one in a small bright chamber.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Bright Ni shimmer',
      params: { volume: 2, decay: 7 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Glitter on top', params: { depth: 0.9, rate: 5 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'prime-lengths-slow-wheel-in-the-barn',
    name: 'Slow wheel in the barn',
    category: 'drone',
    description:
      'A dark eleven second round on Ni through a woolly loudspeaker stack and a dark spring.',
    preview: ONE_KEY,
    instrument: { deviceId: 'tanpura', preset: 'Dark slow Ni', params: { speed: 11, jawari: 0.4 } },
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly', params: { distance: 0.4, noise: 0 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'prime-lengths-no-pluck-left',
    name: 'No pluck left',
    category: 'pad',
    description:
      'Plain strings on a five second round with every pluck taken off by a slow swell and blurred, in a medium plate.',
    preview: PEDAL,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Plain plucked four',
      params: { speed: 5, decay: 11, detune: 3, volume: 6 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 700 } },
      { deviceId: 'fog', preset: 'Slow rise', params: { mix: 0.7 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'prime-lengths-thirteen-foot-of-tape',
    name: 'Thirteen foot of tape',
    category: 'drone',
    description:
      'Widely beating strings laid on a worn tape loop thirteen seconds long, an older pass under each new one.',
    preview: TWO_ROUNDS,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wide beating',
      params: { volume: -1.5, speed: 7, jawari: 0.65, decay: 19 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { wow: 0.5, hiss: 0.1, drive: 0.6 } },
      { deviceId: 'tape-loop', preset: 'Long horizon', params: { length: 13, mix: 0.45 } },
    ],
  },
  {
    id: 'prime-lengths-monks-keep-no-clock',
    name: 'Monks keep no clock',
    category: 'drone',
    description:
      'One narrow gourd drone on a seven second round, answered by a hall that sings a low vowel.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Mono gourd drone',
      params: { volume: -2.5, speed: 7, jawari: 0.55 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.5 } }],
  },
  {
    id: 'prime-lengths-well-under-the-field',
    name: 'Well under the field',
    category: 'texture',
    description:
      'A three second round heard from under water, muffled and wavering, with few bubbles.',
    preview: PEDAL,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { speed: 3, decay: 11, jawari: 0.85, volume: 2 },
    },
    effects: [
      {
        deviceId: 'underwater',
        preset: 'Deep water',
        params: { depth: 0.6, bubbles: 0.1, waver: 0.5 },
      },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },

  // Horns: five kinds of brass, from the next chair to the far shore.
  {
    id: 'prime-lengths-first-chair-waits',
    name: 'First chair waits',
    category: 'wind',
    description: 'One horn, close and soft, speaking over most of a second, in a tight chamber.',
    preview: HORN_FOUR,
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { attack: 0.7, release: 1.7, blow: 0.28, breath: 0.35 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Barely there', params: { depth: 9 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'prime-lengths-swell-of-twenty-nine',
    name: 'Swell of twenty-nine',
    category: 'pad',
    description:
      'A full horn section over a 2.9 second attack, loud at its top, in a huge space that swells behind it.',
    preview: SLOW_FIELD,
    instrument: {
      deviceId: 'horns',
      preset: 'Glacial horns',
      params: { attack: 2.9, release: 5, blow: 0.95 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
      { deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'prime-lengths-flugel-next-door',
    name: 'Flugel next door',
    category: 'wind',
    description:
      'A breathy flugelhorn through the wall: nearly all the highs gone, little of the room left.',
    preview: GAPS_CLOSE,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { attack: 0.4, vibrato: 0.5, blow: 0.5, volume: -5 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door', params: { level: 0.95 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'prime-lengths-mute-for-seventeen',
    name: 'Mute for seventeen',
    category: 'wind',
    description:
      'A thin muted trumpet faded in over half a second, on warped tape with an echo of 1.7 seconds.',
    preview: GAPS_CLOSE,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { volume: 0.5, attack: 0.5, release: 2.3, blow: 0.65 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.6, hiss: 0.1 } },
      {
        deviceId: 'tape-echo',
        preset: 'Long dark trail',
        params: { time: 1700, feedback: 0.4, mix: 0.35 },
      },
    ],
  },
  {
    id: 'prime-lengths-low-brass-long-rests',
    name: 'Low brass, long rests',
    category: 'pad',
    description:
      'Low brass pushed into a transformer with its bottom raised, slow to start and slow to leave.',
    preview: PEDAL,
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 1.1, release: 2.9, blow: 0.6 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 2600 } },
    ],
  },
  {
    id: 'prime-lengths-fifths-on-a-slow-wheel',
    name: 'Fifths on a slow wheel',
    category: 'pad',
    description:
      'A flugelhorn section with fifths above every note, turned by a phaser of twenty-three seconds.',
    preview: HORN_FOUR,
    instrument: {
      deviceId: 'horns',
      preset: 'Open fifths pad',
      params: { volume: 2.5, attack: 1.3, blow: 0.45 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.043, mix: 0.55 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'prime-lengths-breath-and-no-bell',
    name: 'Breath and no bell',
    category: 'texture',
    description:
      'A horn that is nearly all air, blown through an open glass tube, its quiet end brought up, a small spring behind.',
    preview: HORN_FOUR,
    instrument: { deviceId: 'horns', preset: 'Horn of air', params: { attack: 0.8, volume: -8 } },
    effects: [
      { deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.6 } },
      { deviceId: 'lift', preset: 'Quiet end up' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'prime-lengths-fourths-slip-apart',
    name: 'Fourths slip apart',
    category: 'wind',
    description:
      'Horns in parallel fourths caught by two loops of 1.3 seconds and a little more, which slowly part.',
    preview: HORN_FOUR,
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fourths',
      params: { volume: -3, attack: 0.25, release: 1.1, section: 0.1, blow: 0.75 },
    },
    effects: [
      {
        deviceId: 'orbits',
        preset: 'Two voices',
        params: { length: 1.3, offset: 3, feedback: 0.7, mix: 0.45 },
      },
      { deviceId: 'ambient-eq', preset: 'Voice' },
    ],
  },
  {
    id: 'prime-lengths-ferry-every-eleven',
    name: 'Ferry every eleven',
    category: 'wind',
    description:
      'A low trombone with no vibrato, surf passing over it, heard from the back of a hall.',
    preview: PEDAL,
    instrument: {
      deviceId: 'horns',
      preset: 'Trombone',
      params: { attack: 0.3, release: 1.1, vibrato: 0, volume: 0 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Slow surf', params: { exposure: 0.35, voice: 0.3 } },
      { deviceId: 'distance', preset: 'Back of the hall', params: { distance: 0.6, level: 0.95 } },
    ],
  },
  {
    id: 'prime-lengths-brass-asleep-in-rows',
    name: 'Brass asleep in rows',
    category: 'pad',
    description:
      'A muted section with its attacks blurred to nothing, rising and falling on a breath of thirteen seconds.',
    preview: HORN_FOUR,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { volume: -2, attack: 0.8, blow: 0.4 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Asleep',
        params: { in: 4, hold: 2, out: 5, rest: 2, vary: 0, depth: 0.5 },
      },
      { deviceId: 'fog', preset: 'Deep fog' },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },

  // Magnet piano: the magnets feed harmonic one, two, three, five or seven, and the bloom is the attack.
  {
    id: 'prime-lengths-glass-enters-on-time',
    name: 'Glass enters on time',
    category: 'keys',
    description:
      'Bright magnets that speak almost at once, the low end cut away, a copy some cents off on either side, in a hall.',
    preview: FIELD_ONE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Bowed glass',
      params: { bloom: 0.17, bright: 0.75, body: 0.9, volume: -10 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 160, highCut: 5000 } },
      { deviceId: 'stereo-detune', preset: 'Wider', params: { mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'prime-lengths-seventh-harmonic-kept',
    name: 'Seventh harmonic kept',
    category: 'keys',
    description:
      'Only the seventh harmonic of each string, a high thin whistle that twinkles in a bright plate.',
    preview: PEDAL,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'High whistle',
      params: { harmonic: 7, bloom: 0.4, shimmer: 0.5, volume: 0 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Wide shimmer', params: { rate: 3.1 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'prime-lengths-fifth-harmonic-rests',
    name: 'Fifth harmonic rests',
    category: 'keys',
    description:
      'Keys heard as their fifth harmonic, two octaves and a third up, rounded off, with a bucket-brigade echo of 1.1 seconds.',
    preview: HORN_FOUR,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Overtone choir',
      params: { harmonic: 5, sweep: 0, bloom: 0.9, bright: 0.2 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Murky',
        params: { time: 1100, feedback: 0.5, mix: 0.35 },
      },
    ],
  },
  {
    id: 'prime-lengths-twelfth-and-a-slow-rotor',
    name: 'Twelfth and a slow rotor',
    category: 'organ',
    description:
      'Magnets on the third harmonic, quick to speak and quick to stop, through a slow rotating cabinet.',
    preview: ENDS_AS_ONE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Twelfth organ',
      params: { volume: -12.5, bright: 0.5, body: 0.6 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'prime-lengths-second-harmonic-lamp',
    name: 'Second harmonic lamp',
    category: 'keys',
    description:
      'Magnets on the octave, damped soon, with a few strings ringing along, each band drifting on a seventeen second tide.',
    preview: ENDS_AS_ONE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Octave halo',
      params: { volume: -11, bloom: 1.9, bright: 0.4, damper: 0.7 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide', params: { rate: 0.059, depth: 0.7 } },
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'prime-lengths-felt-then-a-long-air',
    name: 'Felt then a long air',
    category: 'keys',
    description:
      'A full felt hammer first and slow magnets long after it, through dusty converters, in a hall whose low end lasts longest.',
    preview: ALL_MEET,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Felt and magnets',
      params: { hammer: 1, bloom: 5, bright: 0.75, body: 0.9, sympathy: 0, volume: -5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty', params: { drive: 4 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'prime-lengths-twin-hammers-drift',
    name: 'Twin hammers drift',
    category: 'keys',
    description:
      'Soft hammers with hardly any magnet behind them, each note answered 1.3 and 2.6 seconds later by a canon.',
    preview: NEAR_TWINS,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Soft hammer',
      params: { bloom: 10, body: 0.35, damper: 0.4, bright: 0.35 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Round of three',
        params: { followers: 2, gap: 1.3, fade: 0.3, tone: 5000, mix: 0.45 },
      },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'prime-lengths-tide-that-misses-itself',
    name: 'Tide that misses itself',
    category: 'pad',
    description:
      'A slow bloom whose harmonics sweep every seventeen seconds, smeared into a hanging wash.',
    preview: SLOW_FIELD,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Slow tide',
      params: { volume: -10.5, bloom: 1.5, sweep: 0.9, sweepRate: 0.059 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.5 } },
      { deviceId: 'ambient-limiter', preset: 'Margin' },
    ],
  },
  {
    id: 'prime-lengths-dark-wood-below',
    name: 'Dark wood below',
    category: 'keys',
    description:
      'A dark, narrow body with half a hammer, taken down an octave at half speed under itself.',
    preview: FIELD_TWO,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Dark wood',
      params: { volume: -18, bloom: 0.5, bright: 0.25 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1300, mix: 0.45 } },
      { deviceId: 'tape', preset: 'Under a blanket', params: { hiss: 0.1 } },
    ],
  },
  {
    id: 'prime-lengths-still-sine-on-a-sill',
    name: 'Still sine on a sill',
    category: 'keys',
    description:
      'A plain pure tone with no shimmer and no body, carried slowly from side to side in a bright hall.',
    preview: TWO_OF_THEM,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Still sine',
      params: { bloom: 0.3, damper: 0.8 },
    },
    effects: [
      { deviceId: 'around', preset: 'Gentle sway', params: { rate: 0.077 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.3 } },
    ],
  },

  // Overtone: the mouth rests on partial three, five, seven, eleven or thirteen, or walks between them.
  {
    id: 'prime-lengths-throat-on-the-seventh',
    name: 'Throat on the seventh',
    category: 'voice',
    description:
      'A throat voice resting on its seventh partial without moving, in a room of hard, plain echoes.',
    preview: LOW_TWINS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Throat song',
      params: { overtone: 7, wander: 0, focus: 0.95, attack: 0.5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Hard echoes', params: { mix: 0.22 } }],
  },
  {
    id: 'prime-lengths-eleventh-partial-alone',
    name: 'Eleventh partial alone',
    category: 'voice',
    description:
      'A still whistle on the eleventh partial, spread wide at every frequency, in a long plate.',
    preview: PEDAL,
    instrument: {
      deviceId: 'overtone',
      preset: 'Still whistle',
      params: { volume: -3.5, overtone: 11, attack: 0.9, release: 3, growl: 0.2 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Everything wide' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'prime-lengths-pipe-on-thirteen',
    name: 'Pipe on thirteen',
    category: 'wind',
    description:
      'A drone pipe held at its thirteenth partial, through a medium wave radio link with a little static, a late hall behind.',
    preview: PEDAL,
    instrument: {
      deviceId: 'overtone',
      preset: 'High whistle',
      params: { volume: -5, overtone: 13, wander: 0, focus: 0.7, attack: 0.3 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Clean transistor',
        params: { static: 0.06, bandwidth: 0.8, mix: 0.8 },
      },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'prime-lengths-third-partial-growl',
    name: 'Third partial growl',
    category: 'drone',
    description: 'A rough low voice on its third partial, driven by a triode and cut dark above.',
    preview: PEDAL,
    instrument: {
      deviceId: 'overtone',
      preset: 'Low growl',
      params: { overtone: 3, wander: 0.1, attack: 0.4, release: 1.7 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { highCut: 3000, tone: -0.4 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'prime-lengths-fifth-partial-bagpipe',
    name: 'Fifth partial bagpipe',
    category: 'wind',
    description:
      'A pipe open at the fifth partial with organ stops an octave and a twelfth over it.',
    preview: LOW_TWINS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Drone pipe',
      params: { overtone: 5, growl: 0.15, wander: 0, focus: 0.3 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Principal chorus', params: { sub: 0.2, mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'prime-lengths-vowels-out-of-turn',
    name: 'Vowels out of turn',
    category: 'voice',
    description:
      'Open vowels that wander between partials, in a slow smear of long grains, half of them reversed.',
    preview: FIELD_ONE,
    instrument: {
      deviceId: 'overtone',
      preset: 'Open vowels',
      params: { pace: 0.6, focus: 0.35, width: 1 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.5, feedback: 0.1 } },
    ],
  },
  {
    id: 'prime-lengths-reed-skips-a-turn',
    name: 'Reed skips a turn',
    category: 'drone',
    description:
      'A buzzing reed drone chopped softly by two gates whose patterns drift apart, with a short spring.',
    preview: HORN_FOUR,
    instrument: {
      deviceId: 'overtone',
      preset: 'Reed drone',
      params: { growl: 0, focus: 0.45, overtone: 6 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Slow drift', params: { rate: 3.1, steps: 13, fill: 7 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'prime-lengths-wind-in-a-hollow-count',
    name: 'Wind in a hollow count',
    category: 'wind',
    description:
      'More breath than pipe, whistling on and off the ninth partial while gusts pass over it.',
    preview: SLOW_FIELD,
    instrument: {
      deviceId: 'overtone',
      preset: 'Breath pipe',
      params: { breath: 1, focus: 0.8, wander: 0.6 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Whistling gap', params: { voice: 0.3, exposure: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { air: 3, presence: 2 } },
    ],
  },
  {
    id: 'prime-lengths-chant-a-minute-wide',
    name: 'Chant a minute wide',
    category: 'voice',
    description:
      'A deep chant on its fourth partial, boomed by a large stopped pipe, with the octave below added.',
    preview: LOW_TWINS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Deep chant',
      params: { growl: 0.25, attack: 0.6 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.5 } },
      { deviceId: 'octaves', preset: 'Bass alone', params: { dry: 0.7, sub1: 0.8 } },
    ],
  },
  {
    id: 'prime-lengths-glass-part-hardly-there',
    name: 'Glass part, hardly there',
    category: 'pad',
    description:
      'The sixteenth partial of a reed as a glass tone wandering round the head, with sines that linger an octave up.',
    preview: PEDAL,
    instrument: {
      deviceId: 'overtone',
      preset: 'Glass harmonic',
      params: { volume: -4, attack: 0.4, release: 3.7 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.5 } },
      { deviceId: 'around', preset: 'Slow wander', params: { rate: 0.091 } },
    ],
  },

  // Pedal steel: swell, sustain and bar, each in a chain at another distance from the porch.
  {
    id: 'prime-lengths-steel-from-a-far-bank',
    name: 'Steel from a far bank',
    category: 'plucked',
    description:
      'Still glassy steel on a slow swell, moved to the far shore with its room still sounding.',
    preview: STEEL_LOOPS,
    instrument: { deviceId: 'pedal-steel', preset: 'Still glass', params: { swell: 0.7 } },
    effects: [{ deviceId: 'distance', preset: 'Far shore', params: { distance: 0.75, level: 1 } }],
  },
  {
    id: 'prime-lengths-bar-on-eleven-strings',
    name: 'Bar on eleven strings',
    category: 'plucked',
    description: 'A plain picked steel with a harmonic tremolo and a surf spring that drips.',
    preview: STEEL_LOOPS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { sustain: 11, pick: 0.7 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 2.3 } },
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'prime-lengths-slow-slide-between-turns',
    name: 'Slow slide between turns',
    category: 'plucked',
    description:
      'Wide slow bends of up to an octave, a tape echo of 1.9 seconds keeping the note that was left.',
    preview: STEEL_LOOPS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { volume: -4.5, glide: 700, swell: 0.3 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Warm repeats',
        params: { time: 1900, feedback: 0.5, mix: 0.4 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'prime-lengths-wide-shake-at-rest',
    name: 'Wide shake at rest',
    category: 'plucked',
    description:
      'A bright steel under a wide bar vibrato of three shakes a second, played off an old shellac disc.',
    preview: STEEL_LOOPS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Wide shake',
      params: { volume: -8, rate: 3, vibrato: 30, pick: 0.5 },
    },
    effects: [{ deviceId: 'vinyl', preset: 'Parlour 78', params: { surface: 0.3 } }],
  },
  {
    id: 'prime-lengths-thumb-on-a-cold-string',
    name: 'Thumb on a cold string',
    category: 'plucked',
    description:
      'A round thumb stroke with no pick noise, throwing off a few long sparks two octaves higher.',
    preview: THIRTY_FIVE,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Round thumb',
      params: { volume: -4, sustain: 5 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Slow stars', params: { density: 2.3, mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'prime-lengths-held-back-to-nineteen',
    name: 'Held back to nineteen',
    category: 'pad',
    description:
      'A slow, dark volume-pedal swell, caught and held as a pad that takes nineteen seconds to die.',
    preview: SLOW_FIELD,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: { swell: 1.3, range: 0, tone: 2000, vibrato: 3 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings', params: { decay: 19, mix: 0.5 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'prime-lengths-short-steel-long-year',
    name: 'Short steel, long year',
    category: 'plucked',
    description:
      'Short twanging strings with four seasons turned over them, one whole year every thirty-one seconds.',
    preview: STEEL_LOOPS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Short twang',
      params: { sustain: 4, pick: 0.6 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Quick year', params: { turning: 31, year: 0.5 } }],
  },
  {
    id: 'prime-lengths-stone-over-the-reservoir',
    name: 'Stone over the reservoir',
    category: 'plucked',
    description:
      'One string slid quickly from note to note, its echoes skipping away, closer and closer, across both sides.',
    preview: TIED_LINE,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Lap slide',
      params: { volume: -4.5, sustain: 37, glide: 130, tone: 3500 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Sinking away',
        params: { first: 370, skips: 11, mix: 0.45 },
      },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'prime-lengths-steel-in-a-tin-roof',
    name: 'Steel in a tin roof',
    category: 'plucked',
    description:
      'A fading swell of bright steel through a horn speaker on a platform, a late hall behind it.',
    preview: STEEL_LOOPS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Fading swell',
      params: { swell: 0.25, sustain: 7 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Station platform', params: { drive: 0.3, noise: 0 } },
      { deviceId: 'fdn-reverb', preset: 'Late arrival', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'prime-lengths-dark-swell-two-decks',
    name: 'Dark swell, two decks',
    category: 'pad',
    description:
      'A dark rounded swell on two tape decks 2.3 seconds apart, the older pass worn and wavering.',
    preview: STEEL_LOOPS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dark swell',
      params: { volume: -4.5, swell: 0.5, vibrato: 4 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Two decks', params: { length: 2.3, wear: 0.5, mix: 0.45 } },
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { rate: 0.091, mix: 0.4 } },
    ],
  },

  // Afterglow: the strike is the moment two loops meet, the glow is all the time between.
  {
    id: 'prime-lengths-strike-and-long-apart',
    name: 'Strike and long apart',
    category: 'keys',
    description:
      'A soft felt strike raised into a warm glow over 1.3 seconds, doubled by a detuned copy, in a cathedral.',
    preview: ALL_MEET,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Felt afterglow',
      params: { bloom: 1.3, tone: 0.3, halo: 0, strike: 0.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Piano haze' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'prime-lengths-bell-of-the-common-year',
    name: 'Bell of the common year',
    category: 'bell',
    description:
      'A struck bell with its partials pushed apart, and a table of tuned bowls that rings on after it.',
    preview: THIRTY_FIVE,
    instrument: { deviceId: 'afterglow', preset: 'Bell halo', params: { strike: 0.9, decay: 5 } },
    effects: [
      { deviceId: 'warp', preset: 'Glass bar', params: { mix: 0.8 } },
      { deviceId: 'bowls', preset: 'Minor table', params: { mix: 0.45, beat: 0.3 } },
    ],
  },
  {
    id: 'prime-lengths-glass-breath-by-fives',
    name: 'Glass breath by fives',
    category: 'pad',
    description:
      'A faint glass strike that becomes air, opening and closing every five seconds, with a tail two octaves up.',
    preview: FIELD_TWO,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Glass breath',
      params: { bloom: 1.1, tone: 0.75 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Opening wide',
        params: { in: 2, hold: 0.5, out: 2, rest: 0.5, vary: 0, depth: 0.5 },
      },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'prime-lengths-pluck-left-in-the-hay',
    name: 'Pluck left in the hay',
    category: 'plucked',
    description:
      'A short pluck with little glow, its attacks split off and brought in late, its tones ringing on.',
    preview: THIRTY_FIVE,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: { volume: 3, glow: 0.3, decay: 1.7, tone: 0.45 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Late echoes' },
      { deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'prime-lengths-only-between-the-strikes',
    name: 'Only between the strikes',
    category: 'pad',
    description:
      'No strike at all, only the raised overtones, blurred without a tail and made wide by frequency.',
    preview: FIELD_TWO,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the glow',
      params: { bloom: 0.9, tone: 0.2 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Dark bank', params: { mix: 0.8 } },
      { deviceId: 'spread', preset: 'Hazy edges' },
    ],
  },
  {
    id: 'prime-lengths-dull-hammer-in-snow',
    name: 'Dull hammer in snow',
    category: 'keys',
    description:
      'A dark felt strike with a low glow and no halo, on a worn cassette, in a dark cave.',
    preview: NEAR_TWINS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Dark felt',
      params: { volume: -4.5, tone: 0.08, glow: 0.4, strike: 1 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.15 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'prime-lengths-chimes-of-seven-loops',
    name: 'Chimes of seven loops',
    category: 'bell',
    description:
      'Bright struck chimes scattered by seven echoes over 2.9 seconds, each at its own side.',
    preview: TWO_OF_THEM,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bright chimes',
      params: { volume: 2.5, glow: 0.25 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { span: 2900, mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Layer', params: { air: -3 } },
    ],
  },
  {
    id: 'prime-lengths-light-that-loses-count',
    name: 'Light that loses count',
    category: 'pad',
    description:
      'A restless glow at its widest, its bright edge carried upward by a reverb that never lands.',
    preview: FIELD_ONE,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Restless light',
      params: { tone: 0.7, strike: 0.15 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.4 } }],
  },
  {
    id: 'prime-lengths-dark-bell-waits',
    name: 'Dark bell waits',
    category: 'bell',
    description:
      'A dark, slow bell with a glow that fades over thirteen seconds behind it, its pitch sagging as it goes.',
    preview: ALL_MEET,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Low tide bell',
      params: { volume: -13.5, bloom: 2.3, fade: 13 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Candle wax', params: { mix: 0.45 } },
      { deviceId: 'saturator', preset: 'Warm glue' },
    ],
  },
  {
    id: 'prime-lengths-harp-meets-itself',
    name: 'Harp meets itself',
    category: 'plucked',
    description: 'A plucked string into slow air, then heard backwards a second and a bit later.',
    preview: NEAR_TWINS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Harp into air',
      params: { volume: -3, bloom: 2.9, glow: 0.5, tone: 0.6 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { time: 1300, mix: 0.45 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.18 } },
    ],
  },

  // Flute: five pipes, each the voice of one loop and no other.
  {
    id: 'prime-lengths-low-flute-by-nineteen',
    name: 'Low flute by nineteen',
    category: 'wind',
    description:
      'A low flute that speaks over half a second, carried from side to side and back in nineteen seconds.',
    preview: GAPS_WIDEN,
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { attack: 0.4, release: 1.9, blow: 0.4 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.053, drift: 0, depth: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'prime-lengths-bamboo-off-the-beat',
    name: 'Bamboo off the beat',
    category: 'wind',
    description:
      'A bamboo flute bent up from far below, with three tape heads repeating it at 1.3 seconds and under.',
    preview: GAPS_WIDEN,
    instrument: {
      deviceId: 'flute',
      preset: 'Bent from below',
      params: { attack: 0.15, scoop: 150, blow: 0.6, vibrato: 0.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 1300, mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 5000 } },
    ],
  },
  {
    id: 'prime-lengths-pipes-along-a-fence',
    name: 'Pipes along a fence',
    category: 'wind',
    description: 'Hollow pan pipes fading in slowly, flown as a small flock around the listener.',
    preview: HIGH_FIELD,
    instrument: {
      deviceId: 'flute',
      preset: 'Hollow pipes pad',
      params: { attack: 0.5, breath: 0.5, blow: 0.5 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Slow drift', params: { birds: 7, mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'prime-lengths-wood-flute-in-a-jar',
    name: 'Wood flute in a jar',
    category: 'wind',
    description:
      'A still wooden pipe with no vibrato and hardly any breath, sounding inside a clay pot.',
    preview: GAPS_WIDEN,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { attack: 0.3, release: 0.7, blow: 0.35 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.85, size: 1.2, air: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'prime-lengths-concert-flute-told-twice',
    name: 'Concert flute told twice',
    category: 'wind',
    description:
      'A concert flute in a straight tone, then itself again 1.1 seconds later and an octave down at 2.2, in a faint cathedral.',
    preview: TWO_OF_THEM,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { attack: 0.2, release: 0.9 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Octaves apart',
        params: { gap: 1.1, interval1: 0, interval2: -12, fade: 0.3, mix: 0.45 },
      },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'prime-lengths-breath-from-two-rooms',
    name: 'Breath from two rooms',
    category: 'texture',
    description:
      'Almost only breath in a low flute, its air raised and scattered wide, its held tones hanging on.',
    preview: HIGH_FIELD,
    instrument: { deviceId: 'flute', preset: 'Breath pad', params: { attack: 0.8, volume: -12.5 } },
    effects: [
      { deviceId: 'sift', preset: 'Wide air' },
      { deviceId: 'common-tones', preset: 'Hanging notes' },
    ],
  },
  {
    id: 'prime-lengths-alto-for-the-low-loop',
    name: 'Alto for the low loop',
    category: 'wind',
    description:
      'A warm alto flute blown full, moved by a slow twelve-stage phaser in a narrow tunnel.',
    preview: GAPS_CLOSE,
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { volume: -5.5, attack: 0.25, chiff: 0.2, vibrato: 0.4 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { rate: 0.059 } },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'prime-lengths-whistle-at-the-crossing',
    name: 'Whistle at the crossing',
    category: 'wind',
    description:
      'A hard-blown flute with every attack swelled away, shifted a few hertz apart on the two sides.',
    preview: TWO_OF_THEM,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { release: 1.3, vibrato: 0.2 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 300 } },
      { deviceId: 'freq-shifter', preset: 'Split sky', params: { fine: 2, mix: 0.4 } },
    ],
  },

  // Clarinet: the bore opens from a cylinder to a cone, and the reed from a hum to a growl.
  {
    id: 'prime-lengths-reed-hum-all-night',
    name: 'Reed hum all night',
    category: 'pad',
    description:
      'A reed hardly vibrating, warm and close, with organ stops blooming slowly behind every note.',
    preview: HORN_FOUR,
    instrument: { deviceId: 'clarinet', preset: 'Reed hum', params: { attack: 0.6, release: 2.3 } },
    effects: [
      { deviceId: 'stops', preset: 'Slow bloom', params: { speak: 1300, mix: 0.7 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'prime-lengths-from-nothing-on-thirteen',
    name: 'From nothing on thirteen',
    category: 'wind',
    description:
      'A clarinet out of silence over 1.3 seconds and back over three, at the back of a large hall.',
    preview: HORN_FOUR,
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { attack: 1.3, breath: 0.2 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.4 } }],
  },
  {
    id: 'prime-lengths-bass-reed-under-the-mill',
    name: 'Bass reed under the mill',
    category: 'wind',
    description:
      'A breathy bass clarinet with an octave below added quietly, driven into tape until its top is dull.',
    preview: PEDAL,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { attack: 0.5, release: 1.1, blow: 0.6 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.4 } },
      { deviceId: 'tape', preset: 'Hot glue', params: { tone: 0.25 } },
    ],
  },
  {
    id: 'prime-lengths-apricot-reed-at-dusk',
    name: 'Apricot reed at dusk',
    category: 'wind',
    description:
      'A soft double-reed tone with a deep vibrato, its held notes swaying wider over a drone of five sympathetic strings.',
    preview: GAPS_CLOSE,
    instrument: { deviceId: 'clarinet', preset: 'Duduk', params: { attack: 0.35, release: 0.9 } },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
      { deviceId: 'sympathetic', preset: 'Centre drone', params: { strings: 1, mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'prime-lengths-subtone-by-the-stove',
    name: 'Subtone by the stove',
    category: 'wind',
    description:
      'A breathy tenor subtone through a pillow speaker, a faint breath of microphone air under it.',
    preview: GAPS_CLOSE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { volume: -1, attack: 0.4, release: 0.8 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker' },
      { deviceId: 'noise-floor', preset: 'Close mic', params: { level: -50 } },
    ],
  },
  {
    id: 'prime-lengths-flutter-between-turns',
    name: 'Flutter between turns',
    category: 'texture',
    description:
      'A fluttering reed replayed as reversed loops stacked an octave below, dark and slow.',
    preview: HORN_FOUR,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { attack: 0.6, growl: 0.8 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Undertow', params: { time: 700, mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'prime-lengths-soprano-over-two-fields',
    name: 'Soprano over two fields',
    category: 'wind',
    description: 'A bright conical reed eased in, hung in a thin, frozen winter.',
    preview: TWO_OF_THEM,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { attack: 0.25, release: 1.1, vibrato: 0.4 },
    },
    effects: [
      { deviceId: 'seasons', preset: 'Deep winter', params: { depth: 0.6 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming' },
    ],
  },
  {
    id: 'prime-lengths-reed-whisper-kept',
    name: 'Reed whisper kept',
    category: 'texture',
    description:
      'Breath over a nearly closed reed, its quiet overtones turned up, every band moving on its own.',
    preview: HORN_FOUR,
    instrument: { deviceId: 'clarinet', preset: 'Reed whisper', params: { volume: -6.5 } },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones' },
      { deviceId: 'glimmer', preset: 'Slow weather' },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },

  // Bow: plucked, sustained or bowed, from a bare still tone to a whole detuned section.
  {
    id: 'prime-lengths-cello-keeps-seventeen',
    name: 'Cello keeps seventeen',
    category: 'string',
    description: 'A bowed low string with a full wooden body, close, one small spring behind it.',
    preview: PEDAL,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 0.7, pressure: 0.4, release: 1.7 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'prime-lengths-glass-bow-on-the-ridge',
    name: 'Glass bow on the ridge',
    category: 'string',
    description: 'A light bow near the bridge with a wash of octaves climbing above it.',
    preview: SLOW_FIELD,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 1.1, release: 3.7, pressure: 0.05 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.35 } }],
  },
  {
    id: 'prime-lengths-still-string-no-edge',
    name: 'Still string, no edge',
    category: 'pad',
    description:
      'A sustained string at its darkest, with no body and no vibrato, let go at once, in a deep chorus and slow waves of hall.',
    preview: ENDS_AS_ONE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 0.9, release: 0.6 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.077 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'prime-lengths-raw-rope-of-the-bell',
    name: 'Raw rope of the bell',
    category: 'string',
    description:
      'A heavy bow hard against the bridge, rasping, squeezed flat and cut above three kilohertz.',
    preview: PEDAL,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: { volume: 6, attack: 0.3, release: 1.3 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Dense pad', params: { makeup: 5 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 3000 } },
    ],
  },
  {
    id: 'prime-lengths-flautando-adrift',
    name: 'Flautando adrift',
    category: 'string',
    description:
      'A bow with no weight over the middle of the string, repeated backwards every 2.3 seconds, made wide.',
    preview: FIELD_ONE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.4, release: 1.9 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 2300, mix: 0.45 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'prime-lengths-beating-wires-in-frost',
    name: 'Beating wires in frost',
    category: 'plucked',
    description:
      'Plucked strings detuned as far as they go, ringing eleven seconds in a cave that bends as it answers.',
    preview: THIRTY_FIVE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { decay: 11, brightness: 0.7 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Bending', params: { mix: 0.3 } }],
  },
  {
    id: 'prime-lengths-octave-that-ebbs',
    name: 'Octave that ebbs',
    category: 'string',
    description:
      'A sustained string that breaks into its octave, echoed from the last thirty-one seconds of playing.',
    preview: STEEL_LOOPS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 0.8, release: 2.3 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Recalling', params: { reach: 31, mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'prime-lengths-damped-string-counted',
    name: 'Damped string counted',
    category: 'plucked',
    description:
      'A dull damped pluck, caught in a 1.1 second loop that dissolves into the tones of a small room.',
    preview: THIRTY_FIVE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { volume: -4, decay: 2.3, release: 0.7 },
    },
    effects: [
      { deviceId: 'generations', preset: 'Small bright room', params: { length: 1.1, mix: 0.45 } },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },

  // Choir: near soloist to far crowd, the vowel walked from Ah to Oo.
  {
    id: 'prime-lengths-one-voice-on-eleven',
    name: 'One voice on eleven',
    category: 'voice',
    description:
      'A single low-bodied singer between Ah and Eh, easing in with some breath, in a reverb that falls in one straight line.',
    preview: GAPS_WIDEN,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: {
        attack: 0.35,
        release: 1.1,
        vibrato: 14,
        breath: 0.45,
        voice: 1,
        vowel: 0.12,
        volume: -6,
      },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Falling', params: { mix: 0.35 } }],
  },
  {
    id: 'prime-lengths-seven-on-bad-tape',
    name: 'Seven on bad tape',
    category: 'voice',
    description:
      'Bright voices between Eh and Ee on one failing cassette, wavering and cut off above, in three long springs.',
    preview: FIELD_TWO,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: { attack: 0.5, vowel: 0.35, voice: 1.3, vibrato: 4, breath: 0.1 },
    },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Falling apart',
        params: { wobble: 0.6, noise: 0.15, drive: 0.4 },
      },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'prime-lengths-monks-a-bell-apart',
    name: 'Monks a bell apart',
    category: 'voice',
    description:
      'Low voices on Oh in a straight tone, with a slow whistle wandering through their overtones.',
    preview: LOW_TWINS,
    instrument: { deviceId: 'choir', preset: 'Low monks', params: { volume: -4, attack: 0.7 } },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'Slow wander',
        params: { root: 2, low: 6, high: 9, pace: 0.3, drone: 0.45, focus: 0.75 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'prime-lengths-breath-of-the-back-row',
    name: 'Breath of the back row',
    category: 'texture',
    description:
      'A dark choir of breath on Oh, sounding through a filter that rings on the notes of A minor.',
    preview: SLOW_FIELD,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 0.9, vowel: 0.75, voice: 0.9, tone: 3000, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'scale-filter',
        preset: 'In a major key',
        params: { root: 9, scale: 1, ring: 2.9, width: 12, depth: 44, glow: 0.3 },
      },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'prime-lengths-trebles-lose-the-bar',
    name: 'Trebles lose the bar',
    category: 'voice',
    description:
      'High voices that roam from vowel to vowel, unfolded by bands from low to high with each repeat.',
    preview: TWO_OF_THEM,
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: { volume: -2.5, attack: 0.3, release: 2.3 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Slow unfolding', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Voice', params: { air: -3 } },
    ],
  },
  {
    id: 'prime-lengths-hum-behind-the-wall',
    name: 'Hum behind the wall',
    category: 'voice',
    description:
      'Voices humming with the mouth shut, with the body of something very large, a long way off.',
    preview: ALL_MEET,
    instrument: { deviceId: 'choir', preset: 'Humming', params: { attack: 0.6, tone: 1000 } },
    effects: [
      { deviceId: 'size', preset: 'Giant', params: { mix: 0.6 } },
      { deviceId: 'distance', preset: 'Through fog', params: { level: 1 } },
    ],
  },
  {
    id: 'prime-lengths-tenors-wait-a-year',
    name: 'Tenors wait a year',
    category: 'voice',
    description:
      'Tenors on Oh in a slow wide waver, followed by a string pad an octave lower that lingers.',
    preview: FIELD_TWO,
    instrument: {
      deviceId: 'choir',
      preset: 'Tenors oh',
      params: { volume: -4.5, attack: 0.5, release: 1.9, vibrato: 28, vibratoRate: 3.7 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { mix: 0.45 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.2 } },
    ],
  },

  // Feedback: one string and its own amplifier, at four distances.
  {
    id: 'prime-lengths-string-caught-at-three',
    name: 'String caught at three',
    category: 'string',
    description:
      'A string that sings on its third partial alone, with no grit, in a wide modulated space.',
    preview: HORN_FOUR,
    instrument: {
      deviceId: 'feedback',
      preset: 'Pure twelfth',
      params: { volume: -5, bloom: 0.5, release: 2.3 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Seasick choir', params: { mix: 0.3, modDepth: 0.5 } },
    ],
  },
  {
    id: 'prime-lengths-hum-holds-the-door',
    name: 'Hum holds the door',
    category: 'drone',
    description:
      'A note that rises out of its own hum with no pluck, dark, moved by a slow low-pass filter.',
    preview: LOW_TWINS,
    instrument: {
      deviceId: 'feedback',
      preset: 'Out of the hum',
      params: { bloom: 0.7, damp: 0.7 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { cutoffHz: 700, resonance: 1.2, lfoAmount: 20, lfoRateHz: 0.077 },
      },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'prime-lengths-seventh-caught-in-air',
    name: 'Seventh caught in air',
    category: 'string',
    description:
      'An amplifier stood far enough off to pull out the seventh partial, drifting round the head.',
    preview: PEDAL,
    instrument: {
      deviceId: 'feedback',
      preset: 'Drifting air',
      params: { volume: -3, distance: 7, bloom: 0.9, wander: 0.2 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow eight', params: { rate: 0.059 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'prime-lengths-long-sink-after-a-chord',
    name: 'Long sink after a chord',
    category: 'pad',
    description:
      'Plucked notes that sing and then sink for eleven seconds after they are let go, in a long dark reverb that drifts down.',
    preview: STEEL_LOOPS,
    instrument: {
      deviceId: 'feedback',
      preset: 'Long sink',
      params: { release: 11, grit: 0.4, crowd: 0.1 },
    },
    effects: [
      { deviceId: 'tamer', preset: 'Gentle' },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.35 } },
    ],
  },

  // Thesis: noise tuned to each note and its reflections, as loops nobody plays.
  {
    id: 'prime-lengths-mirror-of-the-long-count',
    name: 'Mirror of the long count',
    category: 'pad',
    description:
      'Noise tuned to each note and mirrored in D dorian, slow to come, with the whole held in a dark plate.',
    preview: SLOW_FIELD,
    instrument: {
      deviceId: 'thesis',
      preset: 'Drifting Minor',
      params: { attack: 1.3, release: 2.9, scale: 4, root: 2, resonance: 70 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 5 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'prime-lengths-sieve-of-plain-air',
    name: 'Sieve of plain air',
    category: 'texture',
    description:
      'Wide bands of noise on F lydian with no mirror, only a middle band added, in a wind that comes and goes.',
    preview: FIELD_TWO,
    instrument: {
      deviceId: 'thesis',
      preset: 'Whole tone haze',
      params: { scale: 6, root: 5, resonance: 17, attack: 0.7, release: 1.9 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Breezy day', params: { exposure: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 0 } },
    ],
  },
  {
    id: 'prime-lengths-whistles-prime-to-each',
    name: 'Whistles prime to each',
    category: 'texture',
    description:
      'Very narrow bands, near to whistling, that breathe once in seven seconds and leave clean echoes 1.1 seconds apart.',
    preview: HORN_FOUR,
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: { resonance: 97, breatheRate: 0.143, attack: 0.5, release: 1.1, scale: 5, root: 4 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 1100, feedback: 0.5 } },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 0 } },
    ],
  },
]
