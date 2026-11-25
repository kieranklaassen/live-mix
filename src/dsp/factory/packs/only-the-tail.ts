import { type FactoryPreset, type Phrase } from '../types'

// What is left when the last key comes up. Every patch throws its strike away, by a slow fade in
// after the blow, by listening to the room alone or by keeping what rings in sympathy, and differs
// in what it keeps: wires, gourds, metal, breath, a chapel. The lengths run from a few seconds to forty.

// Every phrase waits a tenth of a second, so each effect is wholly where it is set before the first key.
// E2 B2 G3 D4 struck short: the halo of a minor seventh chord and nothing after it.
const HALO: Phrase = {
  notes: [
    { atSec: 0.1, durSec: 0.35, note: 40, gain: 0.85 },
    { atSec: 0.1, durSec: 0.35, note: 47, gain: 0.8 },
    { atSec: 0.1, durSec: 0.35, note: 55, gain: 0.8 },
    { atSec: 0.1, durSec: 0.35, note: 62, gain: 0.75 },
  ],
}
// Six voices stacked in thirds, A C E G B D, sung once and cut off.
const CUT_OFF: Phrase = {
  notes: [57, 60, 64, 67, 71, 74].map((note) => ({ atSec: 0.1, durSec: 1.6, note, gain: 0.6 })),
}
// C3 G3 C4 E4 held down almost without sounding; a loud short C2, whose overtones they are, wakes them twice.
const PARTNERS: Phrase = {
  notes: [
    ...[48, 55, 60, 64].map((note) => ({ atSec: 0.1, durSec: 7.2, note, gain: 0.03 })),
    { atSec: 0.4, durSec: 0.5, note: 36, gain: 0.9 },
    { atSec: 4, durSec: 0.5, note: 36, gain: 0.7 },
  ],
}
// Two tails over each other: E minor seventh, then F major seventh, the outer voices in contrary motion.
const CROSSED: Phrase = {
  notes: [
    ...[52, 59, 62, 67].map((note) => ({ atSec: 0.1, durSec: 0.4, note, gain: 0.7 })),
    ...[53, 57, 60, 64].map((note) => ({ atSec: 3.7, durSec: 0.4, note, gain: 0.7 })),
  ],
}
// The same two chords held long enough for a slow voice to speak before it is cut off.
const CROSSED_SLOW: Phrase = {
  notes: [
    ...[52, 59, 62, 67].map((note) => ({ atSec: 0.1, durSec: 1.5, note, gain: 0.65 })),
    ...[53, 57, 60, 64].map((note) => ({ atSec: 3.5, durSec: 1.6, note, gain: 0.65 })),
  ],
}
// A tower of fifths, D A E B, each struck on what the last one left.
const FIFTHS: Phrase = {
  notes: [
    { atSec: 0.1, durSec: 0.2, note: 62, gain: 0.8 },
    { atSec: 1.5, durSec: 0.2, note: 69, gain: 0.7 },
    { atSec: 2.9, durSec: 0.2, note: 76, gain: 0.6 },
    { atSec: 4.5, durSec: 0.2, note: 83, gain: 0.5 },
  ],
}
// Five single keys falling, E C A F and a low D: the ninth chord is only ever whole in the tails.
const FIVE_KEYS: Phrase = {
  notes: [
    { atSec: 0.1, durSec: 0.2, note: 76, gain: 0.6 },
    { atSec: 0.6, durSec: 0.2, note: 72, gain: 0.6 },
    { atSec: 1.1, durSec: 0.2, note: 69, gain: 0.65 },
    { atSec: 1.6, durSec: 0.2, note: 65, gain: 0.7 },
    { atSec: 2.4, durSec: 0.25, note: 50, gain: 0.85 },
  ],
}
// A call, D A D, and its answer, C G, each left to the place it is sounded in.
const CALL: Phrase = {
  notes: [
    { atSec: 0.1, durSec: 0.35, note: 50, gain: 0.75 },
    { atSec: 0.5, durSec: 0.35, note: 57, gain: 0.75 },
    { atSec: 0.9, durSec: 0.8, note: 62, gain: 0.8 },
    { atSec: 3.7, durSec: 0.4, note: 60, gain: 0.6 },
    { atSec: 4.2, durSec: 0.9, note: 55, gain: 0.6 },
  ],
}
// The last two chords of a service, F major to C major, the tenor and alto C kept and the other voices falling; the second is let go at once.
const LAST_AMEN: Phrase = {
  notes: [
    ...[41, 48, 57, 60, 65].map((note) => ({ atSec: 0.1, durSec: 1.5, note, gain: 0.6 })),
    ...[36, 48, 55, 60, 64].map((note) => ({ atSec: 1.7, durSec: 0.8, note, gain: 0.6 })),
  ],
}
// One key for a round or so of the strings, then no key.
const ONE_ROUND: Phrase = { notes: [{ atSec: 0.1, durSec: 3.6, note: 48, gain: 0.8 }] }
// One key, then the key a fifth above it, sounded into what the first has left: D, then A.
const SECOND_ROUND: Phrase = {
  notes: [
    { atSec: 0.1, durSec: 2.6, note: 50, gain: 0.8 },
    { atSec: 3.5, durSec: 1.8, note: 57, gain: 0.7 },
  ],
}
// A low fifth tolled, then A and E above it, rung into what it left.
const TOLLED: Phrase = {
  notes: [
    { atSec: 0.1, durSec: 0.25, note: 38, gain: 0.8 },
    { atSec: 0.1, durSec: 0.25, note: 45, gain: 0.7 },
    { atSec: 2.7, durSec: 0.25, note: 57, gain: 0.65 },
    { atSec: 4.4, durSec: 0.25, note: 64, gain: 0.6 },
  ],
}
// Eighteen white keys in a second and a quarter, from C6 to a G3 struck harder than the rest.
const SWEPT: Phrase = {
  notes: [84, 83, 81, 79, 77, 76, 74, 72, 71, 69, 67, 65, 64, 62, 60, 59, 57, 55].map(
    (note, i) => ({
      atSec: 0.1 + i * 0.07,
      durSec: 0.1,
      note,
      gain: note === 55 ? 0.7 : 0.4,
    }),
  ),
}
// Seven neighbouring keys under the forearm, F to E, and again an octave up: a whole mode with no tune in it.
const FOREARM: Phrase = {
  notes: [
    ...[53, 55, 57, 59, 60, 62, 64].map((note) => ({ atSec: 0.1, durSec: 0.2, note, gain: 0.4 })),
    ...[65, 67, 69, 71, 72, 74, 76].map((note) => ({ atSec: 3.7, durSec: 0.2, note, gain: 0.3 })),
  ],
}
// G D G C struck and let go; the B that should resolve the C comes late and alone, into its tail.
const LATE_RESOLVE: Phrase = {
  notes: [
    ...[43, 50, 55, 60].map((note) => ({ atSec: 0.1, durSec: 0.4, note, gain: 0.75 })),
    { atSec: 3.3, durSec: 0.4, note: 59, gain: 0.6 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Tanpura: the round has stopped; the gourd, the bridge and the octave go on.
  {
    id: 'only-the-tail-gourd-with-no-hand',
    name: 'Gourd with no hand',
    category: 'drone',
    description:
      'A dark Ma-tuned gourd with its plucks sifted out, only the steady tones let into a wholly wet eighteen second space.',
    preview: ONE_ROUND,
    instrument: { deviceId: 'tanpura', preset: 'Low Ma gourd', params: { speed: 4, decay: 30 } },
    effects: [
      { deviceId: 'sift', preset: 'Tones only' },
      {
        deviceId: 'expanse',
        preset: 'Low cathedral',
        params: { decay: 18, highCut: 1600, mix: 1 },
      },
    ],
  },
  {
    id: 'only-the-tail-buzz-without-a-pluck',
    name: 'Buzz without a pluck',
    category: 'drone',
    description:
      'A wide open bridge buzzing fast, every pluck smeared flat in a diffuse spectrum that hangs on, thinned under 300 Hz.',
    preview: SECOND_ROUND,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Fast buzzing round',
      params: { volume: 2, speed: 3, decay: 8 },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { blur: 0.8, tilt: 0.5, lowCut: 300, highCut: 14000, mix: 1 },
      },
    ],
  },
  {
    id: 'only-the-tail-strings-nobody-tuned',
    name: 'Strings nobody tuned',
    category: 'drone',
    description:
      'A plain monochord is heard only through sixteen C major strings that ring after it, worn thin by slow tape.',
    preview: ONE_ROUND,
    instrument: { deviceId: 'tanpura', preset: 'Monochord', params: { speed: 5, spread: 0.2 } },
    effects: [
      { deviceId: 'sympathetic', preset: 'Strings alone', params: { root: 0, mode: 0, decay: 10 } },
      { deviceId: 'tape', preset: 'Worn thin', params: { age: 0.6, hiss: 0.1, drive: 0.3 } },
    ],
  },
  {
    id: 'only-the-tail-dust-off-the-bridge',
    name: 'Dust off the bridge',
    category: 'texture',
    description:
      'Only the top of a bare buzzing string, high-passed at 1.4 kHz and left as a wet tail that climbs by octaves.',
    preview: ONE_ROUND,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Bare string buzz',
      params: { volume: 6, speed: 3.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Rumble cut',
        params: { type: 1, slope: 1, cutoffHz: 1400 },
      },
      {
        deviceId: 'shimmer',
        preset: 'Rising tail alone',
        params: { decay: 9, shimmer: 0.35, tone: 11000, mix: 1 },
      },
    ],
  },
  {
    id: 'only-the-tail-third-hour-of-pa',
    name: 'Third hour of Pa',
    category: 'drone',
    description:
      'The ten loudest partials of a Pa-tuned round redrawn as sines, two seconds to come and twenty to go, each band drifting.',
    preview: SECOND_ROUND,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wall',
      params: { volume: -3.5, speed: 3, jawari: 0.6 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Long linger',
        params: { partials: 10, attack: 2000, release: 20, mix: 1 },
      },
      { deviceId: 'currents', preset: 'Wide tide' },
    ],
  },
  {
    id: 'only-the-tail-ni-left-in-the-wood',
    name: 'Ni left in the wood',
    category: 'drone',
    description:
      'A dark Ni-tuned round heard from inside a large soundboard, then from a twelve second dark network behind it.',
    preview: ONE_ROUND,
    instrument: { deviceId: 'tanpura', preset: 'Dark slow Ni', params: { volume: -3, speed: 4.5 } },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 2.4, mix: 1, material: 0.7 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Full wet send',
        params: { decay: 12, damping: 0.8, mix: 0.85 },
      },
    ],
  },
  {
    id: 'only-the-tail-round-that-stopped',
    name: 'Round that stopped',
    category: 'drone',
    description:
      'A quick dry round turned into four second blooms with no dry sound, heard from the far side of a stone stairwell.',
    preview: SECOND_ROUND,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Quick dry round',
      params: { volume: 6, speed: 2, decay: 5 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 4, mix: 1, tail: 0.8 } },
      { deviceId: 'distance', preset: 'Stone stairwell' },
    ],
  },
  {
    id: 'only-the-tail-held-by-no-finger',
    name: 'Held by no finger',
    category: 'drone',
    description:
      'A mono gourd caught by a sustainer and heard only as the caught, even tone, turning slowly in a rotary cabinet.',
    preview: SECOND_ROUND,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Mono gourd drone',
      params: { volume: -2.5, speed: 3, jawari: 0.6 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Held sound alone',
        params: { attack: 1.2, decay: 20, mix: 1 },
      },
      { deviceId: 'rotary', preset: 'Chorale' },
    ],
  },
  {
    id: 'only-the-tail-raga-gone-to-bed',
    name: 'Raga gone to bed',
    category: 'voice',
    description:
      'A bright evening Ni round answered by a hall of sung oo and nothing else, its partials glinting slowly.',
    preview: ONE_ROUND,
    instrument: { deviceId: 'tanpura', preset: 'Evening Ni', params: { volume: 4, speed: 4 } },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Endless oo',
        params: { decay: 22, mix: 1, resonance: 0.85 },
      },
      { deviceId: 'glimmer', preset: 'Slow weather' },
    ],
  },
  {
    id: 'only-the-tail-cotton-thread-lifted',
    name: 'Cotton thread lifted',
    category: 'drone',
    description:
      'A closed bridge, blurred, recorded again and again through a small bright room until its tones are what rings.',
    preview: ONE_ROUND,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Closed jawari',
      params: { volume: -4, speed: 2.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 300 } },
      {
        deviceId: 'generations',
        preset: 'Small bright room',
        params: { length: 0.7, keep: 0.93, mix: 1, hiss: 0.02 },
      },
      { deviceId: 'stereo-detune', preset: 'Piano haze' },
    ],
  },
  {
    id: 'only-the-tail-beats-after-the-pluck',
    name: 'Beats after the pluck',
    category: 'drone',
    description:
      'Eight cents of beating between the strings, only the quiet ends let through and then stretched eight times.',
    preview: SECOND_ROUND,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wide beating',
      params: { volume: -20.5, speed: 4 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Only the tails', params: { threshold: -26, floor: -85 } },
      { deviceId: 'stretch', preset: 'Cloud alone', params: { stretch: 8, memory: 20, mix: 1 } },
    ],
  },

  // Magnet piano: no hammer at all, and the dampers slow to come down.
  {
    id: 'only-the-tail-magnets-let-go',
    name: 'Magnets let go',
    category: 'keys',
    description:
      'Strings sung by magnets for a moment, no hammer, then twelve seconds of damper and full sympathy under a slow chorus.',
    preview: CROSSED,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Glass swell',
      params: { volume: -13.5, bloom: 0.15, sympathy: 1, damper: 12, bright: 0.3 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Slow drift' }],
  },
  {
    id: 'only-the-tail-octave-left-hanging',
    name: 'Octave left hanging',
    category: 'keys',
    description:
      'The second harmonic only, heard through a wet tail whose grains sink by octaves for fourteen seconds.',
    preview: CROSSED,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Octave halo',
      params: { volume: -15, bloom: 0.2, damper: 2 },
    },
    effects: [
      {
        deviceId: 'bloom-reverb',
        preset: 'Falling fifths',
        params: { decay: 14, mix: 1, interval: 1 },
      },
    ],
  },
  {
    id: 'only-the-tail-wax-on-the-wire',
    name: 'Wax on the wire',
    category: 'pad',
    description:
      'A fourth harmonic choir with its onset gone, the tail alone sagging eighteen cents a second as it darkens.',
    preview: CROSSED_SLOW,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Overtone choir',
      params: { bloom: 0.4, damper: 4, sweep: 0.2 },
    },
    effects: [{ deviceId: 'melt', preset: 'Candle wax', params: { hold: 12, mix: 1 } }],
  },
  {
    id: 'only-the-tail-lower-than-it-was',
    name: 'Lower than it was',
    category: 'pad',
    description:
      'Bright low magnets played back at half speed in long smooth cycles, so what is left sounds an octave under what was played.',
    preview: CROSSED_SLOW,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Low magnets',
      params: { volume: -14, bloom: 0.3, damper: 8 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { mix: 1, length: 3000 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'only-the-tail-whistle-gone-home',
    name: 'Whistle gone home',
    category: 'texture',
    description:
      'The eighth harmonic of each string, short, remembered as a narrow wall of warm fuzz that takes nine seconds to thin.',
    preview: HALO,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'High whistle',
      params: { volume: -11.5, bloom: 0.1, damper: 0.6 },
    },
    effects: [{ deviceId: 'haze', preset: 'Narrow beam', params: { decay: 9, mix: 1, haze: 0.4 } }],
  },
  {
    id: 'only-the-tail-sine-leaves-a-bowl',
    name: 'Sine leaves a bowl',
    category: 'bell',
    description:
      'A still sine that is never heard itself, only the eight C pentatonic bowls it has set singing for thirty seconds.',
    preview: FIVE_KEYS,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Still sine',
      params: { volume: -0.5, bloom: 0.05, bright: 0.2, damper: 0.3 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Bowls alone',
        params: { ring: 30, beat: 0.25, strike: 0.2, spread: 1 },
      },
    ],
  },
  {
    id: 'only-the-tail-scattered-upstairs',
    name: 'Scattered upstairs',
    category: 'keys',
    description:
      'A wide magnet shimmer reduced to nine echoes thrown over three seconds, then a dark plate, with nothing dry.',
    preview: FIVE_KEYS,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Wide shimmer',
      params: { bloom: 0.08, damper: 0.5, shimmer: 0.6 },
    },
    effects: [
      {
        deviceId: 'constellation',
        preset: 'Gathering in',
        params: { stars: 9, span: 3000, mix: 1 },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'only-the-tail-ripple-outlives-the-key',
    name: 'Ripple outlives the key',
    category: 'keys',
    description:
      'Rippling harmonics cut short and answered by a bright undamped tank alone, eight seconds of it, phased slowly.',
    preview: CROSSED,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Ripple',
      params: { volume: -14, sweepRate: 0.4, damper: 0.8 },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { decay: 8, mix: 1 } },
      { deviceId: 'phaser', preset: 'Slow swirl' },
    ],
  },
  {
    id: 'only-the-tail-ringing-room-empty',
    name: 'Ringing room, empty',
    category: 'pad',
    description:
      'Full sympathy with the hammer taken off, its partials bent toward bell metal and heard through a slow breath.',
    preview: LATE_RESOLVE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Ringing room',
      params: { volume: -17, hammer: 0, bloom: 0.2, damper: 10 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Soft chime', params: { stretch: 0.2, mix: 0.8 } },
      { deviceId: 'breath', preset: 'Long slow sigh' },
    ],
  },

  // Prepared piano: the objects are still moving after the hammer has gone home.
  {
    id: 'only-the-tail-bolts-still-turning',
    name: 'Bolts still turning',
    category: 'bell',
    description:
      'Gong-like bolted strings with the strikes sifted out, their tones alone in a wholly wet dark hall of six seconds.',
    preview: HALO,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Temple gongs',
      params: { thud: 0, rattle: 0.1, decay: 4 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Tones only' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 1 } },
    ],
  },
  {
    id: 'only-the-tail-felt-after-felt',
    name: 'Felt after felt',
    category: 'keys',
    description:
      'Felt-muted strings blurred until no attack is left, then a dark wet tail of fifteen seconds played off a worn cassette.',
    preview: CROSSED,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt whisper',
      params: { volume: -10.5, decay: 4, thud: 0 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 320 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { decay: 15, mix: 0.8 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.1 } },
    ],
  },
  {
    id: 'only-the-tail-learned-by-the-wires',
    name: 'Learned by the wires',
    category: 'keys',
    description:
      'A plain piano heard only through sixteen strings that learn its notes and ring on for ten seconds, lifted at the quiet end.',
    preview: HALO,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Plain piano',
      params: { volume: -16, thud: 0, hammer: 0.35 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Learn and hold',
        params: { decay: 10, mix: 1, width: 1 },
      },
      { deviceId: 'lift', preset: 'Long tails', params: { floor: -85 } },
    ],
  },
  {
    id: 'only-the-tail-rubber-kept-the-low',
    name: 'Rubber kept the low',
    category: 'pad',
    description:
      'Woody rubbered thunks faded in over a third of a second and drawn down by octaves in a long undertow tail.',
    preview: LATE_RESOLVE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Soft rubber',
      params: { volume: 6, decay: 3, thud: 0 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow bow', params: { sensitivity: -68, attack: 300 } },
      { deviceId: 'shimmer', preset: 'Undertow', params: { mix: 1, decay: 11 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { autoGain: 16, ceiling: -9 } },
    ],
  },
  {
    id: 'only-the-tail-paper-settling',
    name: 'Paper settling',
    category: 'texture',
    description:
      'Paper on the strings, its buzz faded in and smeared into air above 250 Hz that hangs for some seconds, with the level brought back up.',
    preview: FOREARM,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper sizzle',
      params: { volume: 3.5, hammer: 0.3, thud: 0, decay: 2 },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'Soft pick',
        params: { sensitivity: -68, attack: 350, depth: 1 },
      },
      { deviceId: 'spectral-blur', preset: 'Whisper', params: { blur: 0.8, lowCut: 250, mix: 1 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { autoGain: 12, ceiling: -9 } },
    ],
  },
  {
    id: 'only-the-tail-every-object-breathes',
    name: 'Every object breathes',
    category: 'keys',
    description:
      'A different object on each key, all faded in over most of a second and crowded into a swarm of short echoes.',
    preview: FIVE_KEYS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Small orchestra',
      params: { volume: -0.5, decay: 3, thud: 0, rattle: 0.2 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { sensitivity: -68, attack: 700 } },
      { deviceId: 'swarm-reverb', preset: 'Cavern', params: { feedback: 0.75, mix: 1 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { autoGain: 14, ceiling: -9 } },
    ],
  },
  {
    id: 'only-the-tail-tin-sinking',
    name: 'Tin, sinking',
    category: 'bell',
    description:
      'Tinny bolted chimes with no front, heard only as a wet tail whose voices sink three octaves a minute and never land.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Tin chimes',
      params: { volume: 2.5, hammer: 0.5, decay: 1.5 },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'Soft pick',
        params: { sensitivity: -68, attack: 110, depth: 1 },
      },
      { deviceId: 'spiral', preset: 'Slow descent', params: { mix: 1, decay: 12 } },
    ],
  },
  {
    id: 'only-the-tail-loose-wires-slowed',
    name: 'Loose wires, slowed',
    category: 'pad',
    description:
      'Wide-tuned unisons stretched twenty times into a dark slow cloud with none of the piano itself.',
    preview: CROSSED,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Loose unisons',
      params: { volume: -10, hammer: 0.3, thud: 0, decay: 2.5 },
    },
    effects: [
      { deviceId: 'stretch', preset: 'Distant memory', params: { mix: 1 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { autoGain: 8, ceiling: -9 } },
    ],
  },
  {
    id: 'only-the-tail-orchestra-walks-back',
    name: 'Orchestra walks back',
    category: 'texture',
    description:
      'Dark prepared strings only as backwards chunks of a second, the strike at the far end, then a long plate.',
    preview: LATE_RESOLVE,
    instrument: { deviceId: 'prepared-piano', preset: 'Dark orchestra', params: { thud: 0 } },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards only',
        params: { time: 1000, smooth: 0.8, mix: 1 },
      },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { mix: 0.5 } },
    ],
  },

  // Ice: no crack under the blow; the lake keeps the note and hands it back from the shores.
  {
    id: 'only-the-tail-lake-has-not-let-go',
    name: 'Lake has not let go',
    category: 'texture',
    description:
      'Thick ice with no crack and a twenty-eight second ring, its tones alone and only where they are quiet, swaying side to side.',
    preview: TOLLED,
    instrument: {
      deviceId: 'ice',
      preset: 'Slow thaw',
      params: { volume: -16.5, ring: 28, cracks: 0, distance: 0.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Tones only' },
      {
        deviceId: 'lift',
        preset: 'Only the tails',
        params: { rise: 1.2, threshold: -22, floor: -85 },
      },
      { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.4 } },
    ],
  },
  {
    id: 'only-the-tail-answer-off-the-shore',
    name: 'Answer off the shore',
    category: 'bell',
    description:
      'Echoes off far shores with no crack in them, set at the edge of hearing with five seconds of open air around.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'ice',
      preset: 'Far shores',
      params: { crack: 0, ring: 8, shore: 1, bright: 0.4 },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'Soft pick',
        params: { sensitivity: -68, attack: 120, depth: 1 },
      },
      { deviceId: 'distance', preset: 'Far shore', params: { room: 1 } },
    ],
  },
  {
    id: 'only-the-tail-bowls-under-the-ice',
    name: 'Bowls under the ice',
    category: 'bell',
    description:
      'Clear ice notes, faded in, that are only a hand on five low bowls tuned in fifths on A, the bowls alone for twenty seconds.',
    preview: TOLLED,
    instrument: { deviceId: 'ice', preset: 'Ice bells', params: { volume: 6, crack: 0, ring: 3 } },
    effects: [
      {
        deviceId: 'swell',
        preset: 'Soft pick',
        params: { sensitivity: -68, attack: 200, depth: 1 },
      },
      { deviceId: 'bowls', preset: 'Low fifths', params: { mix: 1, ring: 20, strike: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { autoGain: 9, ceiling: -9 } },
    ],
  },
  {
    id: 'only-the-tail-floe-goes-under',
    name: 'Floe goes under',
    category: 'drone',
    description:
      'A deep dark floe rung for twenty seconds, its strike blurred over half a second, then taken under deep water.',
    preview: TOLLED,
    instrument: { deviceId: 'ice', preset: 'Deep floe', params: { ring: 20, crack: 0, cracks: 0 } },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 500 } },
      { deviceId: 'underwater', preset: 'Deep water', params: { depth: 0.6 } },
    ],
  },
  {
    id: 'only-the-tail-three-lines-of-frost',
    name: 'Three lines of frost',
    category: 'texture',
    description:
      'A clear ping reduced to its three strongest partials, redrawn an octave up as sines that outlast it by ten seconds.',
    preview: FIVE_KEYS,
    instrument: {
      deviceId: 'ice',
      preset: 'Clear ping',
      params: { volume: 2, distance: 0, ring: 6 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Octave halo',
        params: { partials: 3, attack: 300, release: 10, mix: 1, tone: 0.3 },
      },
    ],
  },
  {
    id: 'only-the-tail-section-behind-frost',
    name: 'Section behind frost',
    category: 'pad',
    description:
      'Stretched plate tones heard only as the dark low string pad they call up, which takes nine seconds to leave.',
    preview: CROSSED,
    instrument: {
      deviceId: 'ice',
      preset: 'Plate tones',
      params: { volume: 6, crack: 0.1, stretch: 0.4, ring: 3 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Pad alone',
        params: { rise: 0.6, fall: 9, octaves: -0.5, brightness: 900, mix: 1 },
      },
    ],
  },
  {
    id: 'only-the-tail-night-on-the-far-side',
    name: 'Night on the far side',
    category: 'texture',
    description:
      'A night lake with the cracking left out, its tail alone swelling in late and staying for forty seconds.',
    preview: LATE_RESOLVE,
    instrument: {
      deviceId: 'ice',
      preset: 'Lake at night',
      params: { volume: -2, cracks: 0, crack: 0, ring: 5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Wash alone', params: { highCut: 4000 } }],
  },
  {
    id: 'only-the-tail-splinters-forgetting',
    name: 'Splinters forgetting',
    category: 'texture',
    description:
      'Thin bright ice broken into long overlapping grains fed back on themselves, half of them reversed, no original left.',
    preview: FIVE_KEYS,
    instrument: {
      deviceId: 'ice',
      preset: 'Thin ice',
      params: { volume: 1, crack: 0, cracks: 0, ring: 4 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Slow smear',
        params: { mix: 1, size: 900, reverse: 0.5, feedback: 0.6, density: 12 },
      },
    ],
  },
  {
    id: 'only-the-tail-shore-a-fifth-lower',
    name: 'Shore a fifth lower',
    category: 'texture',
    description:
      'A zinging chirp with no bang, slowed by a third in smooth cycles so its ring sinks a fifth, then a small bright tank.',
    preview: FIVE_KEYS,
    instrument: { deviceId: 'ice', preset: 'Zing', params: { ring: 8, crack: 0, stretch: 0.2 } },
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down bed', params: { mix: 1, highCut: 9000 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.6 } },
    ],
  },

  // Zither: the twelve strings that are never plucked.
  {
    id: 'only-the-tail-twelve-unplucked',
    name: 'Twelve unplucked',
    category: 'string',
    description:
      'A felt hammer sets the whole box humming, the blow blurred over a third of a second, twenty seconds of halo kept.',
    preview: LATE_RESOLVE,
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: { volume: -11, decay: 20, release: 20, courses: 0.6, chord: 0 },
    },
    effects: [{ deviceId: 'fog', preset: 'No attack', params: { size: 350 } }],
  },
  {
    id: 'only-the-tail-box-answers-itself',
    name: 'Box answers itself',
    category: 'string',
    description:
      'An open zither, its picking faded in, with only the strings that learn its notes left sounding, seven of them, bright and wide.',
    preview: CROSSED,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { volume: -13, chord: 0, brightness: 0.8 },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'Soft pick',
        params: { sensitivity: -68, attack: 120, depth: 1 },
      },
      {
        deviceId: 'sympathetic',
        preset: 'Follow the tune',
        params: { mix: 1, decay: 9, strings: 3, width: 1 },
      },
      { deviceId: 'ambient-eq', preset: 'Bright' },
    ],
  },
  {
    id: 'only-the-tail-sweep-and-silence',
    name: 'Sweep and silence',
    category: 'plucked',
    description:
      'Single harp-bodied strings blurred into slow rises, then little but a bright plate that will not close.',
    preview: SWEPT,
    instrument: {
      deviceId: 'zither',
      preset: 'Harp glissando',
      params: { volume: -19, chord: 0, decay: 12, release: 20, sympathy: 0.8 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Slow rise' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.8, decay: 0.95 } },
    ],
  },
  {
    id: 'only-the-tail-common-to-both-hands',
    name: 'Common to both hands',
    category: 'string',
    description:
      'Octave-strung courses with the pick sifted out, passed through a filter that keeps only what was already sounding half a second ago.',
    preview: CROSSED,
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { decay: 20, release: 20, courses: 0.4 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Tones only' },
      { deviceId: 'common-tones', preset: 'Only what stays', params: { ring: 0.7, ago: 500 } },
    ],
  },
  {
    id: 'only-the-tail-strings-run-like-wax',
    name: 'Strings run like wax',
    category: 'string',
    description:
      'A dark finger pluck of which only the aged part is kept, sagging, blurred and dimmed the longer it rings.',
    preview: FIVE_KEYS,
    instrument: {
      deviceId: 'zither',
      preset: 'Slow falling sus',
      params: { volume: -12.5, chord: 0, strum: 0, sympathy: 1 },
    },
    effects: [{ deviceId: 'melt', preset: 'Deep pool', params: { sag: -12, mix: 1, drip: 0.2 } }],
  },
  {
    id: 'only-the-tail-dulcimer-fog-lamp',
    name: 'Dulcimer fog lamp',
    category: 'plucked',
    description:
      'Hammered octaves rolled nine times a second, heard only through two blurs and a soft fuzz, as one standing wall.',
    preview: CROSSED,
    instrument: { deviceId: 'zither', preset: 'Hammered shimmer', params: { brightness: 0.4 } },
    effects: [{ deviceId: 'haze', preset: 'Wall alone', params: { decay: 12, tone: 0.65 } }],
  },
  {
    id: 'only-the-tail-coil-of-koto',
    name: 'Coil of koto',
    category: 'plucked',
    description:
      'A picked koto string faded in and gone; three dark coils of spring go on with it for six seconds, softly compressed.',
    preview: FIVE_KEYS,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { volume: -12.5, position: 0.3, brightness: 0.5, release: 6 },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'Soft pick',
        params: { sensitivity: -68, attack: 140, depth: 1 },
      },
      {
        deviceId: 'spring-reverb',
        preset: 'Tank alone',
        params: { decay: 6, tone: 2400, drip: 0.05 },
      },
      { deviceId: 'ambient-comp', preset: 'Long sustain' },
    ],
  },
  {
    id: 'only-the-tail-open-fifths-left-on',
    name: 'Open fifths left on',
    category: 'string',
    description:
      'Each key strums a fifth and octave; the strum is faded in and smeared into a glassy spectrum that hangs, bright at the edges.',
    preview: CALL,
    instrument: {
      deviceId: 'zither',
      preset: 'Minor glass haze',
      params: { volume: -8.5, chord: 2, strum: 200, courses: 0.5 },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'Soft pick',
        params: { sensitivity: -68, attack: 150, depth: 1 },
      },
      {
        deviceId: 'spectral-blur',
        preset: 'Glass halo',
        params: { blur: 0.85, mix: 1, shimmer: 0.3 },
      },
    ],
  },

  // Horns: the players have stopped; the valley has not.
  {
    id: 'only-the-tail-valley-keeps-the-horn',
    name: 'Valley keeps the horn',
    category: 'wind',
    description:
      'A French horn section with a quick tongue, heard only as seven seconds of hall, none of it direct.',
    preview: CALL,
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { volume: 0.5, section: 0.6, attack: 0.1, release: 0.4, vibrato: 0, blow: 0.6 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 1, lowDecay: 8, midDecay: 7 } },
    ],
  },
  {
    id: 'only-the-tail-mute-and-coil',
    name: 'Mute and coil',
    category: 'wind',
    description:
      'A muted trumpet cut off short, of which only a single slack spring and a faint chorus are left.',
    preview: CALL,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { attack: 0.06, release: 0.3 },
    },
    effects: [
      {
        deviceId: 'spring-reverb',
        preset: 'Single slack coil',
        params: { mix: 1, tone: 3500, drip: 0.3, decay: 6 },
      },
      { deviceId: 'chorus', preset: 'Faint air' },
    ],
  },
  {
    id: 'only-the-tail-brass-sinks-an-octave',
    name: 'Brass sinks an octave',
    category: 'wind',
    description:
      'A low brass choir let go after a moment, its wet tail alone falling by octaves for sixteen seconds.',
    preview: CROSSED_SLOW,
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 0.3, release: 0.6, blow: 0.6 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Undertow', params: { mix: 1, decay: 16, shimmer: 0.4 } },
    ],
  },
  {
    id: 'only-the-tail-breath-in-the-tubing',
    name: 'Breath in the tubing',
    category: 'wind',
    description:
      'Almost no tone, all air: a horn blown empty, its release held eight seconds and heard in a whispering shell.',
    preview: CROSSED_SLOW,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { attack: 0.4, release: 8, section: 0.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Whispering shell', params: { mix: 0.8, air: 0.6 } },
      { deviceId: 'common-tones', preset: 'Loose match' },
    ],
  },
  {
    id: 'only-the-tail-fifths-left-burning',
    name: 'Fifths left burning',
    category: 'wind',
    description:
      'Flugelhorns that sound a fifth with every key, their own eight second release under a twelve-stage phaser in a late hall.',
    preview: CALL,
    instrument: {
      deviceId: 'horns',
      preset: 'Open fifths pad',
      params: { volume: -0.5, attack: 0.12, release: 8 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud' },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'only-the-tail-band-out-of-earshot',
    name: 'Band out of earshot',
    category: 'wind',
    description:
      'A bright brass section very far off, all room and no edge, off a tape that drags.',
    preview: CUT_OFF,
    instrument: { deviceId: 'horns', preset: 'Brass band', params: { attack: 0.15, release: 1.5 } },
    effects: [
      {
        deviceId: 'distance',
        preset: 'Back of the hall',
        params: { distance: 1, decay: 7, room: 1 },
      },
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.6, hiss: 0.15 } },
    ],
  },
  {
    id: 'only-the-tail-falls-in-a-line',
    name: 'Falls in a line',
    category: 'wind',
    description:
      'Glacial horns made quick, then let fall in a straight four second line of wet reverb with a halo of higher octaves.',
    preview: CALL,
    instrument: {
      deviceId: 'horns',
      preset: 'Glacial horns',
      params: { volume: 5, attack: 0.2, release: 0.8 },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        preset: 'Falling',
        params: { time: 4, mix: 1, tail: 0.6, density: 1 },
      },
      { deviceId: 'octaves', preset: 'Slow halo' },
    ],
  },
  {
    id: 'only-the-tail-call-nobody-sent',
    name: 'Call nobody sent',
    category: 'wind',
    description:
      'A solo horn heard only as echoes and as memories of the last fifteen seconds, most of them backwards, in a thin hall.',
    preview: CALL,
    instrument: { deviceId: 'horns', preset: 'Solo horn', params: { volume: 1.5, release: 0.8 } },
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Backwards',
        params: { mix: 1, echo: 0.6, feedback: 0.6, time: 700 },
      },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.5 } },
    ],
  },

  // Organ: the bellows are down; chapels of different sizes have the chord.
  {
    id: 'only-the-tail-sexton-with-the-keys',
    name: 'Sexton with the keys',
    category: 'organ',
    description:
      'A full organ chord cut off and heard only as twenty seconds of a large, barely damped tank, the last of it in the rafters.',
    preview: LAST_AMEN,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { volume: -25, attack: 0.08, release: 0.1, tone: 4000 },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 1, predelayMs: 120 } },
    ],
  },
  {
    id: 'only-the-tail-pipes-giving-up-wind',
    name: 'Pipes giving up wind',
    category: 'organ',
    description:
      'Distant dark pipes that take ten seconds to run out of wind, with gusts at the door and no hall of their own.',
    preview: LAST_AMEN,
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { volume: -14.5, attack: 0.25, release: 10, breath: 0.6, tone: 1800 },
    },
    effects: [{ deviceId: 'weather', preset: 'Breezy day', params: { voice: 0.2 } }],
  },
  {
    id: 'only-the-tail-celeste-rank-in-a-crypt',
    name: 'Celeste rank in a crypt',
    category: 'organ',
    description:
      'A beating celeste under a crypt that keeps only what is below a kilohertz, half a minute of it, narrowed.',
    preview: CROSSED_SLOW,
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { attack: 0.3, release: 0.5, sub: 0.3 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 1, decay: 30 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'only-the-tail-only-wind-in-the-chest',
    name: 'Only wind in the chest',
    category: 'wind',
    description:
      'A flute rank that is nearly all wind, smeared until no pitch begins anywhere, opening and closing like one breath.',
    preview: CROSSED_SLOW,
    instrument: { deviceId: 'organ', preset: 'Windy flute', params: { attack: 0.3, release: 6 } },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 1, lowCut: 200 } },
      { deviceId: 'breath', preset: 'Opening wide' },
    ],
  },
  {
    id: 'only-the-tail-reed-worn-by-a-room',
    name: 'Reed worn by a room',
    category: 'organ',
    description:
      'A pump organ that a large dark room has re-recorded every second or so until the reeds are only its resonances.',
    preview: CROSSED_SLOW,
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { volume: -15.5, release: 0.3, bellows: 0.4 },
    },
    effects: [
      {
        deviceId: 'generations',
        preset: 'Large dark room',
        params: { mix: 1, length: 1.2, hiss: 0.02 },
      },
    ],
  },
  {
    id: 'only-the-tail-through-a-closed-door',
    name: 'Through a closed door',
    category: 'organ',
    description:
      'An organ behind a wall with nothing over 380 Hz, left in a long plate whose overtones are then brought up.',
    preview: LAST_AMEN,
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { volume: -16.5, attack: 0.15, release: 0.3 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Full wet send', params: { decay: 0.93, damping: 0.5 } },
      { deviceId: 'reveal', preset: 'Overtones' },
    ],
  },
  {
    id: 'only-the-tail-reed-stop-no-reed',
    name: 'Reed stop, no reed',
    category: 'organ',
    description:
      'The shaken reed pipe is gone and a low hall of sung vowels, slowly changing, holds its notes for twelve seconds.',
    preview: CROSSED_SLOW,
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { tremulant: 0.3, release: 0.2 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Vowel drift',
        params: { mix: 1, decay: 12, voice: 0.15 },
      },
    ],
  },

  // Bells: metal and glass from the second second on.
  {
    id: 'only-the-tail-bowl-from-the-inside',
    name: 'Bowl from the inside',
    category: 'bell',
    description:
      'A dark bowl with the softest mallet, the touch blurred away, forty seconds of slow beats moving in bands.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Dark bowl',
      params: { volume: -6.5, detune: 0.8 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 400 } },
      { deviceId: 'currents', preset: 'Gentle drift' },
    ],
  },
  {
    id: 'only-the-tail-hum-note-of-evensong',
    name: 'Hum note of evensong',
    category: 'bell',
    description:
      'A church bell low-passed at 700 Hz, so the hum is what is heard, wholly inside an eight second nave.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { hardness: 0.2, decay: 35 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Init', params: { slope: 1, cutoffHz: 700 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 1 } },
    ],
  },
  {
    id: 'only-the-tail-gong-nobody-saw-hit',
    name: 'Gong nobody saw hit',
    category: 'bell',
    description:
      'A gong with its blow and its noise sifted out and its tones held over, then split into a slow drifting flock.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { volume: -1.5, hardness: 0.15, detune: 1 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Hard split', params: { air: -30, hold: 0.8, sharpness: 0.8 } },
      { deviceId: 'murmuration', preset: 'Slow drift', params: { mix: 0.7 } },
    ],
  },
  {
    id: 'only-the-tail-finger-off-the-rim',
    name: 'Finger off the rim',
    category: 'bell',
    description:
      'A rubbed glass released at once; the ring that climbs away from it by fifths is all there is, ten seconds long.',
    preview: CUT_OFF,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { volume: -11.5, release: 0.5 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { mix: 1, shimmer: 0.3 } }],
  },
  {
    id: 'only-the-tail-vibes-motor-still-on',
    name: 'Vibes, motor still on',
    category: 'bell',
    description:
      'Vibraphone bars with the pedal left down, each blow blurred for a quarter of a second, with only the fans beating on the sound.',
    preview: CUT_OFF,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { volume: -4.5, release: 0, decay: 14, hardness: 0.1 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 260 } },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 2.4 } },
    ],
  },
  {
    id: 'only-the-tail-thumb-box-of-bowls',
    name: 'Thumb box of bowls',
    category: 'bell',
    description:
      'A short kalimba that only serves to wake twelve bowls in C major, wide, slow and left alone for twenty-five seconds.',
    preview: SWEPT,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { volume: 4.5, hardness: 0.3 },
    },
    effects: [{ deviceId: 'bowls', preset: 'Wide and slow', params: { mix: 1, strike: 0.15 } }],
  },
  {
    id: 'only-the-tail-chimes-far-too-slow',
    name: 'Chimes far too slow',
    category: 'texture',
    description:
      'Wind chimes stretched thirty times: their ring becomes a still, shaded mist with no bar hit in it.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: { volume: -8.5, hardness: 0.6, decay: 10 },
    },
    effects: [
      { deviceId: 'stretch', preset: 'Hundred times', params: { mix: 1, stretch: 30 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },

  // Choir: the chapel after the singers.
  {
    id: 'only-the-tail-no-choir-in-it',
    name: 'No choir in it',
    category: 'voice',
    description:
      'Voices let go in a fraction of a second and never heard themselves, only fourteen seconds of open stone.',
    preview: CUT_OFF,
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { attack: 0.15, release: 0.15, motion: 0 },
    },
    effects: [
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { mix: 1, decay: 14, size: 0.9, modDepth: 0.15, highCut: 5000 },
      },
    ],
  },
  {
    id: 'only-the-tail-humming-in-the-porch',
    name: 'Humming in the porch',
    category: 'voice',
    description:
      'A dark hum that takes fifteen seconds to die by itself, with no hall, wandering slowly round your head.',
    preview: CROSSED_SLOW,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { attack: 0.35, release: 15, tone: 900 },
    },
    effects: [{ deviceId: 'around', preset: 'Barely moving', params: { radius: 0.6 } }],
  },
  {
    id: 'only-the-tail-air-the-singers-used',
    name: 'Air the singers used',
    category: 'voice',
    description:
      'Breath with hardly a voice in it, every onset diffused and only the quiet end of it let through.',
    preview: CUT_OFF,
    instrument: { deviceId: 'choir', preset: 'Breath', params: { attack: 0.4, release: 8 } },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { mix: 1, blur: 0.5, lowCut: 120 },
      },
      { deviceId: 'lift', preset: 'Only the tails', params: { threshold: -24, floor: -85 } },
    ],
  },
  {
    id: 'only-the-tail-basses-in-the-floor',
    name: 'Basses in the floor',
    category: 'voice',
    description:
      'Basses on ah cut short, of which a dark wet tail sinking by octaves is left for most of half a minute.',
    preview: LAST_AMEN,
    instrument: {
      deviceId: 'choir',
      preset: 'Basses ah',
      params: { volume: -0.5, attack: 0.2, release: 0.3 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 1 } }],
  },
  {
    id: 'only-the-tail-treble-gone-up',
    name: 'Treble gone up',
    category: 'voice',
    description:
      'A treble oo whose own sound is dropped, its reverb lifted two octaves up in a small bright space, then laid on a short loop.',
    preview: CUT_OFF,
    instrument: { deviceId: 'choir', preset: 'Boys ooh', params: { attack: 0.15, release: 0.4 } },
    effects: [
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 1, decay: 12, shimmer: 0.4 } },
      { deviceId: 'tape-loop', preset: 'Clean layers', params: { mix: 0.4, length: 2.6 } },
    ],
  },
  {
    id: 'only-the-tail-one-ah-worn-away',
    name: 'One ah, worn away',
    category: 'voice',
    description:
      'A short ah laid on four loops of unequal length that wear as they turn, with the singing left out.',
    preview: CROSSED,
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: { volume: -3, attack: 0.12, release: 0.8 },
    },
    effects: [
      { deviceId: 'orbits', preset: 'Loops alone', params: { length: 1.3, wear: 0.6, mix: 1 } },
      { deviceId: 'fog', preset: 'Slow rise' },
    ],
  },

  // Harp: one string struck and muted; its partners are not.
  {
    id: 'only-the-tail-partners-of-low-c',
    name: 'Partners of low C',
    category: 'plucked',
    description:
      'A lightly muted harp with all of its halo: pluck and fundamental are taken out, the strings that answer brought up.',
    preview: PARTNERS,
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { volume: -20, damp: 0.2, halo: 1, body: 0.8, touch: 0.2, decay: 4 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Tones only' },
      { deviceId: 'ambient-eq', params: { lowCut: 180, clear: 0 } },
      { deviceId: 'lift', preset: 'Long tails', params: { limit: 26, threshold: -23, floor: -85 } },
    ],
  },
  {
    id: 'only-the-tail-glass-ring-no-nail',
    name: 'Glass ring, no nail',
    category: 'plucked',
    description:
      'A harp that rings three times as long as it should, heard only as its octaves up and down, which come in over a second.',
    preview: FIVE_KEYS,
    instrument: { deviceId: 'harp', preset: 'Long glass ring', params: { decay: 3 } },
    effects: [{ deviceId: 'octaves', preset: 'Swell pad', params: { attack: 1.2 } }],
  },
  {
    id: 'only-the-tail-cascade-dried-up',
    name: 'Cascade, dried up',
    category: 'plucked',
    description:
      'A guzheng sweep of which only a thick, wide cloud of half-second grains and their feedback is left.',
    preview: SWEPT,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng cascade',
      params: { volume: 6, halo: 1, sweep: 0.3 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Thick fog', params: { mix: 1, pitch: 0 } },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'only-the-tail-hollow-wood-a-minor',
    name: 'Hollow wood, A minor',
    category: 'string',
    description:
      'A dark hollow harp blurred and silenced, ten A minor strings it set going left sounding for ten seconds in the centre.',
    preview: FIVE_KEYS,
    instrument: { deviceId: 'harp', preset: 'Dark hollow harp', params: { touch: 0.2 } },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 200 } },
      {
        deviceId: 'sympathetic',
        preset: 'Centre drone',
        params: { mix: 1, strings: 6, sympathy: 0.8, root: 9, mode: 1 },
      },
    ],
  },
  {
    id: 'only-the-tail-rolled-and-gone',
    name: 'Rolled and gone',
    category: 'pad',
    description:
      'A slow rolled harp redrawn by sixteen sines that come in over a second, wide, and stay for eight.',
    preview: HALO,
    instrument: { deviceId: 'harp', preset: 'Slow rolled chord', params: { sweep: 0.5 } },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Chord outline',
        params: { partials: 16, snap: 0, attack: 1000, spread: 0.9 },
      },
      { deviceId: 'rotary', preset: 'Faint motion' },
    ],
  },

  // Afterglow: the strike is turned down to nothing on the instrument itself.
  {
    id: 'only-the-tail-strike-at-nought',
    name: 'Strike at nought',
    category: 'pad',
    description:
      'Felt keys with the strike at nothing: only a dark glow and its octave halo, fading for fifteen seconds, each band coming and going.',
    preview: CROSSED,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the glow',
      params: { bloom: 0.5, fade: 15, halo: 0.8, tone: 0.25, width: 1, drift: 0.6 },
    },
    effects: [{ deviceId: 'currents', preset: 'Glass notes' }],
  },
  {
    id: 'only-the-tail-bell-minus-clapper',
    name: 'Bell minus clapper',
    category: 'bell',
    description:
      'A bell glow with no strike, octave halo up, in a ten second valley that answers late.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bell halo',
      params: { volume: 5, strike: 0, bloom: 0.4, fade: 8 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.7 } }],
  },
  {
    id: 'only-the-tail-pane-nobody-tapped',
    name: 'Pane nobody tapped',
    category: 'pad',
    description:
      'A still dark glass glow with no strike, no halo and no drift, seen through a glacial phaser and a wide double.',
    preview: CROSSED_SLOW,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Still glass',
      params: { strike: 0, bloom: 0.8, fade: 12, tone: 0.25 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep' },
      { deviceId: 'stereo-detune', preset: 'Wider' },
    ],
  },
  {
    id: 'only-the-tail-nail-never-landed',
    name: 'Nail never landed',
    category: 'plucked',
    description:
      'A pluck with only its slow bright glow, taken an octave lower off a two second tape loop and nothing from the keys.',
    preview: FIVE_KEYS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Harp into air',
      params: { volume: -2, strike: 0, bloom: 0.6, tone: 0.7 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slowed down',
        params: { length: 2, mix: 1, feedback: 0.6, speed: 0 },
      },
    ],
  },
  {
    id: 'only-the-tail-buoy-after-its-bell',
    name: 'Buoy after its bell',
    category: 'drone',
    description:
      'A low bell glow without its strike, fading for thirty seconds just under the surface of the water.',
    preview: TOLLED,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Low tide bell',
      params: { volume: -2, strike: 0, bloom: 1, fade: 30 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Slow swell', params: { bubbles: 0 } }],
  },

  // Felt piano: half pedal, full pedal, and the pedal somebody forgot.
  {
    id: 'only-the-tail-half-pedal-halo',
    name: 'Half pedal halo',
    category: 'keys',
    description:
      'A felted piano at half pedal with all its resonance; the struck part is held back and the quiet halo brought forward.',
    preview: HALO,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: {
        outputDb: -24,
        felt: 0.8,
        sustain: 0.6,
        damper: 0,
        resonance: 1,
        thump: 0,
        action: 0,
        pedalNoise: 0,
        reverbMix: 0,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { sensitivity: -68, attack: 600 } },
      { deviceId: 'lift', preset: 'Long tails', params: { threshold: -24, floor: -75 } },
    ],
  },
  {
    id: 'only-the-tail-forgotten-pedal',
    name: 'Forgotten pedal',
    category: 'keys',
    description:
      'Both pedals down under the softest hammer, every blow blurred through three layers of cloud with no tail of its own.',
    preview: PARTNERS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { outputDb: -15, reverbMix: 0, thump: 0, pedalNoise: 0 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Deep fog' },
      { deviceId: 'tape', preset: 'Drifting chorus', params: { hiss: 0 } },
    ],
  },
  {
    id: 'only-the-tail-iron-frame-after-hours',
    name: 'Iron frame after hours',
    category: 'keys',
    description:
      'A bare bright piano blurred and gone silent, sixteen strings in D minor still sounding for ten seconds, the quiet raised.',
    preview: FIVE_KEYS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { outputDb: -21, thump: 0, action: 0, reverbMix: 0, resonance: 0.8 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 160 } },
      { deviceId: 'sympathetic', preset: 'Minor wash', params: { sympathy: 0.9, mix: 1 } },
      { deviceId: 'ambient-comp', preset: 'Raise the quiet' },
    ],
  },
  {
    id: 'only-the-tail-next-room-unlit',
    name: 'Next room, unlit',
    category: 'keys',
    description:
      'A soft piano next door, only what two moments share let through, in a wash of voices that climbs very slowly.',
    preview: CROSSED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Next room',
      params: { outputDb: -11, sustain: 1, thump: 0, polyphony: 16 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Slow ear', params: { mix: 1, ring: 0.6 } },
      { deviceId: 'spiral', preset: 'Endless wash', params: { mix: 0.85, decay: 20 } },
    ],
  },

  // Strings: the bow has left; the box has not heard.
  {
    id: 'only-the-tail-bows-already-lifted',
    name: 'Bows already lifted',
    category: 'string',
    description:
      'Six players a key whose eight second release is the sound, muted, with a slow glimmer on their partials.',
    preview: CROSSED_SLOW,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Six slow bows',
      params: { attack: 0.4, release: 8, mute: 0.8 },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Broad swells' }],
  },
  {
    id: 'only-the-tail-rosin-in-the-light',
    name: 'Rosin in the light',
    category: 'string',
    description:
      'Bows near the bridge, cut off, seen again only as a thin wet air above 700 Hz that takes twelve seconds to settle.',
    preview: CROSSED_SLOW,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { volume: -4, attack: 0.2, release: 0.2 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { mix: 1 } }],
  },
  {
    id: 'only-the-tail-stands-left-in-the-hall',
    name: 'Stands left in the hall',
    category: 'string',
    description:
      'A section released quickly, then heard only as swarming echoes of a dark well that waver a little as they go.',
    preview: LAST_AMEN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 0.2, release: 0.3, vibrato: 4 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        preset: 'Dark well',
        params: { mix: 1, feedback: 0.8, highCut: 2200 },
      },
    ],
  },
  {
    id: 'only-the-tail-viol-in-the-cupboard',
    name: 'Viol in the cupboard',
    category: 'string',
    description:
      'Straight-toned viols caught as they stop and held as one even, dark bed for forty seconds, small-bodied.',
    preview: CROSSED_SLOW,
    instrument: { deviceId: 'chamber-strings', preset: 'Viol consort', params: { release: 0.4 } },
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { mix: 1, decay: 40, attack: 0.5 } },
      { deviceId: 'size', preset: 'Smaller' },
    ],
  },

  // Droplets: the rain goes on after the last key.
  {
    id: 'only-the-tail-rain-after-the-chord',
    name: 'Rain after the chord',
    category: 'texture',
    description:
      'Soft glass drops on the notes you let go of, falling for another twenty seconds, each blurred to a soft puff.',
    preview: CROSSED,
    instrument: {
      deviceId: 'droplets',
      preset: 'Glass rain',
      params: { trail: 20, soft: 1, splash: 0, rain: 4, ring: 2 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist', params: { size: 250, soften: 0.8, mix: 1 } },
    ],
  },
  {
    id: 'only-the-tail-gutter-in-a-cistern',
    name: 'Gutter in a cistern',
    category: 'texture',
    description:
      'Deep water drops, blurred, twelve seconds of them after the key, inside a huge stopped pipe with a low hall round it.',
    preview: TOLLED,
    instrument: {
      deviceId: 'droplets',
      preset: 'Deep pool',
      params: { trail: 12, splash: 0, soft: 0.8, rain: 2 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Soft cloud', params: { soften: 0.7 } },
      { deviceId: 'vessel', preset: 'Cistern', params: { mix: 1 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'only-the-tail-chimes-after-closing',
    name: 'Chimes after closing',
    category: 'bell',
    description:
      'Long metal drops that go on by themselves for fifteen seconds, every one blurred at the front, a soft octave under them.',
    preview: FIVE_KEYS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Long chimes',
      params: { trail: 15, soft: 1, rain: 1.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 220 } },
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5 } },
    ],
  },
  {
    id: 'only-the-tail-patter-turned-to-air',
    name: 'Patter turned to air',
    category: 'texture',
    description:
      'Soft felt patter, faded in and thickened until the single drops are gone, a shimmering mist that thins for ten seconds.',
    preview: FOREARM,
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt patter',
      params: { volume: -3.5, trail: 10, rain: 20, soft: 1, splash: 0, ring: 2 },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'Soft pick',
        params: { sensitivity: -68, attack: 200, depth: 1 },
      },
      { deviceId: 'spectral-blur', preset: 'Endless', params: { blur: 0.75, mix: 1, lowCut: 120 } },
    ],
  },

  // Dusk: the synth's release, with the attack shut out of it.
  {
    id: 'only-the-tail-streetlight-release',
    name: 'Streetlight release',
    category: 'pad',
    description:
      'Thin chorused saws whose twelve second release is the sound, the filter closing on it, with the onset blurred away.',
    preview: CROSSED,
    instrument: {
      deviceId: 'dusk',
      preset: 'Thin shimmer',
      params: { attack: 0.2, release: 12, cutoff: 1800, envelope: 0.3 },
    },
    effects: [{ deviceId: 'fog', preset: 'Slow rise', params: { size: 500 } }],
  },
  {
    id: 'only-the-tail-pulse-gone-in-the-hall',
    name: 'Pulse gone in the hall',
    category: 'pad',
    description:
      'A wide pulse stab that is not heard, only the fog it makes, rising and going over four seconds.',
    preview: LATE_RESOLVE,
    instrument: {
      deviceId: 'dusk',
      preset: 'Wide pulse',
      params: { volume: -2.5, attack: 0.01, release: 0.3 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Dark swell', params: { mix: 1, highCut: 3500 } },
    ],
  },
  {
    id: 'only-the-tail-sub-under-the-lamp',
    name: 'Sub under the lamp',
    category: 'drone',
    description:
      'A square and its sub octave, let go over ten seconds through a filter that barely opens, worn by a drifting valve.',
    preview: LATE_RESOLVE,
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { volume: -23, attack: 0.5, release: 10, cutoff: 500 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { wobble: 0.5, noise: 0 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'only-the-tail-filter-hums-to-itself',
    name: 'Filter hums to itself',
    category: 'pad',
    description:
      'A singing filter let go and remembered by a looper that turns it over at half speed, soft, with none of the playing.',
    preview: CROSSED_SLOW,
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { volume: -4.5, attack: 0.3, release: 3, resonance: 0.8 },
    },
    effects: [
      {
        deviceId: 'micro-looper',
        preset: 'Half speed',
        params: { mix: 1, smear: 0.7, length: 1.2 },
      },
    ],
  },
]
